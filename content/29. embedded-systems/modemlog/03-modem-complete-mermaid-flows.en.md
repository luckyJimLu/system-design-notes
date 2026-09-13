# Modem Diagnostic System Mermaid Flowcharts

This page is consistent with [Unified Design Baseline](01-diagnostics-unified-design.md) and [C++ Implementation Architecture](02-cpp-architecture-and-interactions.md): ModemLog and CHR each utilize a dedicated TCP Socket; TCPDump captures packets via a local bypass on the MCU and is no longer modeled as a third Modem socket. The illustrations convey the recommended design rather than driver-level implementation guarantees. Figures 10 through 12 detail C++ modules and their runtime interactions.

## 1. Overall Data Path: Dual Sockets and Local Snapshot

```mermaid
flowchart TD
    subgraph MODEM["Modem Firmware Domain (IPC Source)"]
        modemLog["ModemLog Stream Service\n(Continuous 1 Mbps Throughput)"]
        modemChr["Modem CHR Event Service\n(Critical Crash & State Events)"]
    end

    subgraph INGRESS["MCU Ingress Domain (Socket Reactor Task)"]
        logSock["ModemLog TCP Client\n(Non-blocking Socket)"]
        chrSock["CHR TCP Client\n(Reliable In-order Socket)"]
        reactor["Socket Reactor Scheduler\n(select multiplexing / dynamic budget)"]
        logSock --> reactor
        chrSock --> reactor
    end

    subgraph NETIF["lwIP Network Domain (Normal MCU Traffic)"]
        netTraffic["Normal lwIP RX / TX Packet Flow"] --> tap{"CaptureTap\nPassive Observation Gate"}
        tap -->|"Zero-latency pass"| netStack["Normal lwIP Protocol Stack Continues"]
    end

    subgraph SRAM_POOLS["Static SRAM Pools (SPSC Lock-Free Ring Buffers)"]
        logRing[("ModemLog Dedicated Ring\n(Fixed Chunk Queue)")]
        chrRing[("CHR Dedicated Ring\n(Framed Message Queue)")]
        capRing[("Capture Snapshot Ring\n(Dual-buffered Private Slots)")]
    end

    subgraph STORAGE_DOMAIN["Storage Engine (Storage Owner Task)"]
        storageExec["StorageOwner Engine\n(Sole Owner of FatFs / SDIO DMA)"]
    end

    subgraph MEDIA_FS["Persistent Storage (MicroSD / eMMC)"]
        fileLog[("ModemLog Files\n(*.log circular overwrite)")]
        fileChr[("CHR Files\n(*.chr append archive)")]
        filePcap[("PCAP Files\n(*.pcap capture stream)")]
    end

    modemLog -->|"IPC TCP Link"| logSock
    modemChr -->|"IPC TCP Link"| chrSock

    reactor -->|"Zero-copy chunk publish"| logRing
    reactor -->|"Structured frame publish"| chrRing
    tap -.->|"Best-effort copy (if slot free)"| capRing

    logRing -->|"Sequential batch consume"| storageExec
    chrRing -->|"Sequential consume ack"| storageExec
    capRing -->|"Asynchronous drain"| storageExec

    storageExec --> fileLog
    storageExec --> fileChr
    storageExec --> filePcap
```

## 2. Socket Reactor Fair Scheduling

```mermaid
flowchart TD
    start([Scheduling Period Begins]) --> checkCtl{"Pending Control / Stop Signal?"}
    checkCtl -->|Pending Control Command| handleCtl["Transition Session State Machine\nExecute Quiesce / Drain"]
    checkCtl -->|No Control Pending| buildFds["Rebuild fd_set\nBased on Free Ring Quotas"]

    handleCtl --> buildFds
    buildFds --> doSelect["Execute select() (Bounded timeout 5~10ms)"]

    doSelect --> selResult{"select() Return Status?"}
    selResult -->|Timeout / 0 Ready| checkBudget
    selResult -->|Error / EINTR| logErr["Log Transient Warning & Backoff"] --> checkBudget
    selResult -->|Events Ready| checkChr{"CHR Ready?"}

    checkChr -->|Yes| readChr["Read Bounded CHR Frames\nVerify Frame Length & CRC"]
    checkChr -->|No| checkLog{"ModemLog Ready?"}
    readChr --> checkLog

    checkLog -->|Yes| readLog["Read Bounded Log Chunk (Max 4KB)\nPrevent CPU Starvation"]
    checkLog -->|No| checkPublish
    readLog --> checkPublish

    checkPublish{"New Chunks Ready?"}
    checkPublish -->|Yes| publish["Publish with Memory Barrier to Ring\nLightweight Semaphore to Storage"]
    checkPublish -->|No| checkBudget

    publish --> checkBudget{"Check CPU Time Budget\n& Stop Request Flag?"}
    checkBudget -->|Budget Remaining| buildFds
    checkBudget -->|Budget Exhausted / Stop| yield["taskYIELD() Relinquish Timeslice"] --> start
```

## 3. Capture Tap Failure Pass-Through Flow

```mermaid
flowchart TD
    pktIn([Original Packet at lwIP Ingress / Egress Tap]) --> checkEn{"1. Capture Globally Enabled\n& Interface Whitelisted?"}
    checkEn -->|No| passOriginal["Normal Path: Pass to lwIP Stack with Zero Delay"]
    checkEn -->|Yes| checkBudget{"2. Filter & Rate-Budget Check\n(Token Bucket Limiter)?"}

    checkBudget -->|Over Budget| dropCount1["Increment Rate-Limit Drop Counter Only"] --> passOriginal
    checkBudget -->|Budget OK| acquireSlot{"3. Atomic Try-Acquire Private Slot\n(Non-blocking Check)?"}

    acquireSlot -->|No Slot Available| dropCount2["Increment Overflow Drop Counter Only\n(Never Block Network Stack)"] --> passOriginal
    acquireSlot -->|Acquired Slot| copyPkt["4. SnapLen Truncated Read-Only Copy\nRead pbuf Only; No Long Holding"]

    copyPkt --> checkValid{"5. Snapshot & Segment Verification OK?"}
    checkValid -->|Corrupt / Partial| discardSlot["Return Slot to FREE State\nIncrement Corrupt Drop Counter"] --> passOriginal
    checkValid -->|Valid Snapshot| publishSlot["6. Release Mark Slot as READY\nNotify StorageOwner Task"] --> passOriginal

    passOriginal --> pktOut([Original Packet Continues Normal Transmission])
```

## 4. Slot Ownership State Machine

```mermaid
stateDiagram-v2
    [*] --> FREE: Cold Boot Static Pool Allocation

    state "FREE (Idle / Available)" as FREE
    state "FILLING (Producer Reserved & Writing)" as FILLING
    state "READY (Published / Awaiting Drain)" as READY
    state "READING (Storage Exclusive In-flight)" as READING
    state "ERROR_HELD (Fault Retained for Recovery)" as ERROR_HELD

    FREE --> FILLING: Producer Atomic Try-Reserve Success\n[Producer Try-Acquire]
    FILLING --> READY: Verification Pass & Memory Barrier\n[Release Publish]
    FILLING --> FREE: Verification Failed / Rollback Discard\n[Rollback Discard]

    READY --> READING: Storage Engine Atomic Acquire\n[Storage Acquire]
    READING --> FREE: DMA Flush & Sector Sync Complete\n[Storage Release]
    READING --> ERROR_HELD: SDIO/DMA Bus Fault; Preserve Context\n[IO Failure]

    ERROR_HELD --> FREE: DMA Abort Confirmed & Channel Cleaned\n[Fault Recovery Clean]
```

## 5. Public Network and IPC Routing Boundary

```mermaid
flowchart TD
    subgraph APPS["Application Layer Socket Sources"]
        diagSockets["Diagnostic Clients\n(Two Dedicated Diag Sockets)"]
        wanApps["Public Application Traffic\n(HTTP / MQTT / OTA Sockets)"]
    end

    subgraph ROUTING["MCU Routing Decision & Compliance Engine"]
        routeTable{"Route Lookup by Destination IP"}
        guardIPC{"IPC Boundary Compliance\nAllow Only Modem Local Diag IPs"}
        guardWAN{"WAN Boundary Compliance\nStrictly Deny IPC Private Subnets"}
    end

    subgraph NETIFS["Network Interface Layer"]
        netifIPC["IPC Virtual Netif\n(Inter-core Communication)"]
        netifWAN["WAN Default Netif\n(Cellular Internet)"]
        tap["MCU Local Capture Tap\n(Passive Snapshot Probe)"]
    end

    subgraph EXTERNALS["External Network Endpoints"]
        modemLocal["Modem Local Diag Endpoint\n(127.0.0.1 / Local Daemon)"]
        modemCell["Cellular Operator Network\n(Cellular Internet)"]
    end

    diagSockets -->|"Explicitly Bound to IPC IP"| routeTable
    wanApps -->|"Default Gateway Path"| routeTable

    routeTable -->|"Destination is IPC Subnet"| guardIPC
    routeTable -->|"Destination is Public Internet"| guardWAN

    guardIPC -->|"Legitimate IP"| netifIPC
    guardIPC -->|"Invalid Outbound"| dropIPC["Drop & Security Audit Alarm"]

    guardWAN -->|"Legitimate Public IP"| netifWAN
    guardWAN -->|"Private Subnet Leak"| dropWAN["Drop & Prevent Data Leak"]

    netifIPC --> modemLocal
    netifWAN --> modemCell
    netifWAN -.->|"Read-only Snapshot"| tap
```

## 6. Safe Business Quiescence and Stop Protocol

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Session Coordinator (SessionCoordinator)
    participant Producer as Ingress (Reactor or Capture Gate)
    participant Storage as Storage Owner Task
    participant Disk as SD Driver / FatFs

    Note over Manager,Disk: Phase 1: Ingress Quiescence
    Manager->>Producer: Request Stop for Target Service (STOP_REQUEST)
    Producer->>Producer: Block New Inbound Admissions (QUIESCING)
    Producer->>Producer: Await In-flight Chunks to Finish Publishing
    Producer-->>Manager: Ingress Fully Quiesced

    Note over Manager,Disk: Phase 2: Drain In-Flight & Close Files
    Manager->>Storage: Drain Remaining Data and Close File (DRAIN_AND_CLOSE)
    Storage->>Storage: Sequentially Consume All Remaining READY Slots
    Storage->>Disk: Flush Final Buffers and Invoke f_sync()
    Disk-->>Storage: Write & Sync Confirmed (or Bounded Timeout)
    Storage->>Disk: Close File Handle via f_close()
    Storage-->>Manager: Resource Cleanup Confirmed

    Note over Manager: Safe State Update
    Manager->>Manager: Transition Session State to STOPPED (or FAULTED)
```

## 7. Packet RX/TX and Snapshot Copy Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Driver as Network Driver (RX/TX)
    participant Tap as Capture Tap
    participant Pool as Private Capture Slots
    participant Network as lwIP Protocol Stack
    participant Storage as Storage Owner Task

    Note over Driver,Network: Fast-Path: Non-invasive Read-only Probe
    Driver->>Tap: Pass Packet Pointer (pbuf Ownership Stays with lwIP)
    Tap->>Tap: Evaluate Whitelist and Token-Bucket Rate Budget

    alt Private Slot Available & Budget Passes (Hit)
        Tap->>Pool: Atomic Try-Reserve Private Slot
        Tap->>Pool: Truncated Read-only Copy (SnapLen Bytes)
        Pool-->>Tap: Mark Slot Published as READY
        Tap-->>Driver: Return Immediately (< 2 microseconds)
        Driver->>Network: Continue Normal Packet Transmission

        Note over Storage,Pool: Decoupled Async Flush
        Storage->>Pool: Scan and Batch Acquire READY Slots
        Storage->>Storage: Assemble PCAP Header & Write to Sector Buffer
        Storage->>Pool: Return Slot to FREE State for Re-use
    else Slot Exhausted or Budget Exceeded (Graceful Drop)
        Tap->>Tap: Increment Drop Counters Atomically
        Tap-->>Driver: Return Immediately (Zero Overhead)
        Driver->>Network: Continue Normal Packet Transmission (Zero Degradation)
    end
```

## 8. Tiered Backoff Under Storage Overload

```mermaid
flowchart TD
    start([SDIO Slowdown or Buffer High-Watermark Detected]) --> tier1

    subgraph T1["Tier 1 Backoff: Shed Non-Essential Sideband"]
        tier1["1. Throttle / Suspend CaptureTap Ingress\n(100% bypass drop; zero production impact)"]
        tier1 --> checkT1{"Queue Pressure Relieved?"}
        checkT1 -->|Yes| recoverT1["Restore Capture Tap Sampling"] --> normalState([Resume Normal Operation])
        checkT1 -->|No| tier2
    end

    subgraph T2["Tier 2 Backoff: Throttle High-Throughput Logs"]
        tier2["2. ModemLog Independent High-Watermark Flow Control\n(Shrink TCP Receive Window to apply backpressure)"]
        tier2 --> checkT2{"Queue Pressure Relieved?"}
        checkT2 -->|Yes| recoverT2["Gradually Reopen Receive Window"] --> normalState
        checkT2 -->|No| tier3
    end

    subgraph T3["Tier 3 Backoff: Protect Critical Telemetry"]
        tier3["3. CHR High-Priority Protected Queuing\n(Preserve crash dumps & critical events only)"]
        tier3 --> checkTimeout{"Storage Stall Duration\nExceeded Safety Threshold?"}
        checkTimeout -->|No| waitRecovery["Await SDIO Internal Block Erase Completion"] --> tier2
        checkTimeout -->|Yes| tier4
    end

    subgraph T4["Tier 4 Backoff: Fault Isolation & Circuit Breaker"]
        tier4["4. Mark Diagnostic Session as FAULTED\nAbort DMA and Safely Close Corrupted File"]
        tier4 --> keepWAN["Keep Normal WAN Cellular Operation 100% Intact"]
        tier4 --> alertOps["Emit Hardware Telemetry Alert to Management Plane"]
    end
```

## 9. Session State Machine (Not Thread Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> STOPPED: System Boot Initialized

    state "STOPPED (Quiescent / Ready)" as STOPPED
    state "PREPARING (Resource & File Pre-allocation)" as PREPARING
    state "ACTIVE (Full-rate Streaming & Logging)" as ACTIVE
    state "QUIESCING (Ingress Suppressed)" as QUIESCING
    state "DRAINING (In-flight Buffer Flush)" as DRAINING
    state "FAULTED (Fault-isolated & Protected)" as FAULTED

    STOPPED --> PREPARING: Start Command Received\n[Storage Allocates Memory & Opens Target Files]
    PREPARING --> ACTIVE: Initialization Successful\n[Open Socket Read Admissions]
    PREPARING --> FAULTED: File Creation Failed or Media Unavailable\n[Log Pre-allocation Error Code]

    ACTIVE --> QUIESCING: Stop Command Received\n[Quiesce Socket Ingress & Disable Tap]
    ACTIVE --> FAULTED: Severe Storage IO Timeout or DMA Lockup\n[Trigger Circuit Breaker]

    QUIESCING --> DRAINING: Ingress Fully Silent and In-flight Zero\n[No New Packets Queued]
    QUIESCING --> FAULTED: Quiescence Timeout Exceeded\n[Force Abort]

    DRAINING --> STOPPED: All Buffers Flushed & Files Cleanly Closed\n[f_close Success]
    DRAINING --> FAULTED: Flush Timeout or Sector IO Failure\n[Record Dropped Log Count]

    FAULTED --> STOPPED: Explicit Recovery / Reset Invoked\n[Release Leases & Reset State]
```

## Critical Reading Constraints

- Capture failure drops only the copy; the original packet continues unaffected. This is not a zero-CPU guarantee.
- The two application tasks are Socket Reactor and Storage Owner, distinct from existing lwIP/driver/RTOS tasks.
- Capture RX/TX may execute concurrently; private slots and non-spinning try-guards prevent prolonged holds on lwIP pbufs.
- Storage is the single consumer managing FIL handles; buffer recycling and filesystem persistence are decoupled events.
- Interface layers, offload semantics, PCAP LinkType, and invocation contexts align strictly with the [Baseline Design](01-diagnostics-unified-design.md).

## 10. C++ Modules and Execution Context

```mermaid
flowchart TD
    subgraph CLIENT["Client & Control Interface (Caller Context)"]
        api["DiagnosticApi\n(Unified External Contract)"]
        requestSlot[("Fixed Command Slot\n(Zero-allocation slot)")]
        api -->|"Zero-heap Submission"| requestSlot
    end

    subgraph REACTOR_TASK["SocketReactor Task (Task 1)"]
        coordinator["SessionCoordinator\n(State Machine Orchestrator)"]
        requestSlot --> coordinator
        
        reactor["SocketReactor\n(select multiplexing)"]
        coordinator --> reactor

        log["LogSession\n(Zero-lock Stream Unpacker)"]
        chr["ChrSession\n(Transaction Framing & Ack)"]

        reactor --> log
        reactor --> chr
    end

    subgraph BUFFERS["SRAM Dedicated Buffer Pools (SPSC Rings)"]
        rings[("Log & CHR Dedicated Rings\n(Fixed-size chunk queues)")]
        cap[("Independent RX / TX Capture Ring\n(Dual-buffered slots)")]

        log -->|"Publish Ownership"| rings
        chr -->|"Publish Ownership"| rings
    end

    subgraph LWIP_CTX["lwIP Network Context (Network Thread / ISR)"]
        hooks["lwIP RX / TX Hooks"] --> tap["CaptureTap & CaptureGate\n(Atomic counters / Threshold check)"]
        tap -.->|"Try-Reserve Copy"| cap
    end

    subgraph STORAGE_TASK["StorageOwner Task (Task 2)"]
        coordinator -->|"Storage Command Slot"| storage["StorageOwner Task\n(Single-threaded serial flush)"]
        rings -->|"Consume"| storage
        cap -->|"Consume"| storage

        files["FatFsPort Driver Abstraction\n(Sector-aligned writing)"]
        storage --> files
    end

    storage -.->|"Result Slot Confirmation"| coordinator
```

## 11. C++ Asynchronous Start Sequence

```mermaid
sequenceDiagram
    autonumber
    actor App as Client Application (App)
    participant Ctl as SessionCoordinator & Reactor
    participant Disk as StorageOwner Task
    participant Source as SocketSession or CaptureGate

    App->>Ctl: Submit Start(config) Request
    Note over Ctl,Disk: Storage Preparation Precedes Data Flow
    Ctl->>Disk: PrepareFile & generation Params
    Disk->>Disk: Allocate Buffers & Create Target File
    Disk-->>Ctl: Retain Completed Result (Prepared OK / Error)

    alt File Preparation Succeeded
        Ctl->>Source: Establish Non-blocking Connection or Enable Tap
        Source-->>Ctl: READY or Connection Established
        Ctl-->>App: Asynchronous Completion: State Marked RUNNING
    else File Preparation Failed
        Ctl-->>App: Asynchronous Failure: State Marked FAULTED
    end
```

## 12. CHR Reliable Persistence Ack Flow

```mermaid
sequenceDiagram
    autonumber
    participant Modem as Modem CHR Client
    participant Rx as ChrSession & Reactor
    participant Ring as CHR Dedicated Ring
    participant Disk as StorageOwner Task

    Modem->>Rx: Structured Byte Stream (with unique SeqID)
    Rx->>Rx: Frame Boundary & CRC Verification
    Rx->>Ring: Publish Intact Message Block to SPSC Ring
    Rx-->>Modem: TCP Transport Layer ACK (Network Confirmed)

    Note over Ring,Disk: Asynchronous Flush & Persistence
    Disk->>Ring: Sequentially Consume Pending CHR Chunks
    Disk->>Disk: Write to FatFs and Call f_sync()
    Disk-->>Rx: Sync Checkpoint Confirmation (Persisted up to SeqID)
    Rx-->>Modem: Send Application-Level CHR_PERSISTED_ACK(SeqID)\n(Modem can safely reclaim its internal flash buffer)
```
