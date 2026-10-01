#!/usr/bin/env python3
"""
Convert PDF files under pdfs/ into clean, chapter-based Markdown files
inspired by Microsoft MarkItDown principles:
- Document structure retention: Headings (#, ##, ###), lists, tables, code blocks.
- Clean up artifacts: Strip running headers, footers, page numbers, form feed chars.
- Code fencing: Wrap C++ code listings into ```cpp ... ``` blocks.
- Generate valid Front-matter documents compatible with src/content/loader.ts.
- Emit paired index.en.md and index.zh.md to pass npm run validate:content.
"""

import io
import os
import re
import sys
import shutil
import subprocess
from pathlib import Path

try:
    from markitdown import MarkItDown
    import pypdfium2 as pdfium
    HAS_MARKITDOWN = True
except ImportError:
    HAS_MARKITDOWN = False

REPO_ROOT = Path(__file__).resolve().parent.parent
PDFS_DIR = REPO_ROOT / 'pdfs'
CONTENT_DIR = REPO_ROOT / 'content'

# --- MarkItDown text cleaning & markdown formatting ---

COMMON_CPP = re.compile(
    r'(?:'
    r'^\s*(?://|/\*|\*|#include|#define|using\s+namespace|namespace\b|template\s*<|class\b|struct\b|enum\b|typedef\b)|'
    r'\b(?:std::|boost::|asio::|std::thread|std::mutex|std::atomic|std::unique_lock|std::lock_guard|std::condition_variable|std::future|std::promise)\b|'
    r'^\s*(?:int|void|bool|auto|char|double|float|unsigned|const|static|explicit|virtual|override)\s+\w+.*[;{()=]|'
    r'^\s*(?:if|for|while|switch|catch)\s*\(.*[;{]?$|'
    r'^\s*(?:return|throw)\b.*[;]?$|'
    r'^\s*(?:<<|>>|->)'
    r')'
)

CPP_STMT_KEYWORDS = re.compile(
    r'\b(?:std::|boost::|asio::|int|void|bool|auto|char|double|float|unsigned|'
    r'return|throw|delete|new|sizeof|nullptr|true|false)\b'
)

PROSE_STOPWORDS = {
    'the', 'of', 'in', 'and', 'to', 'a', 'is', 'it', 'for', 'with', 'as', 'this',
    'that', 'from', 'by', 'on', 'at', 'an', 'be', 'are', 'was', 'were', 'have',
    'has', 'had', 'you', 'we', 'they', 'i', 'my', 'your', 'our', 'their', 'or',
    'but', 'not', 'if', 'because', 'when', 'where', 'how', 'which', 'who', 'whom',
    'whose', 'what', 'why', 'so', 'can', 'will', 'would', 'could', 'should',
    'every', 'other', 'into', 'about', 'some', 'any', 'these', 'those'
}

def is_prose_line(line: str) -> bool:
    words = re.findall(r'\b[a-z]{2,}\b', line.lower())
    stopword_count = sum(1 for w in words if w in PROSE_STOPWORDS)
    return stopword_count >= 3

def is_cpp_code_line(line: str, in_code: bool = False) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if re.match(r'^\s*\d+\.\s+', stripped):
        return False
    if not stripped.startswith(('//', '/*', '*', '#')) and is_prose_line(stripped):
        return False
    if COMMON_CPP.search(stripped):
        return True
    if stripped.endswith((';', '{', '}')):
        if stripped.endswith(';') and not CPP_STMT_KEYWORDS.search(stripped) and not any(c in stripped for c in ['::', '->', '(', ')', '=', '<', '>']):
            return False
        return True
    if in_code:
        if stripped.endswith((',', '(', '{', '}', ';', '<<', '>>', '=', '+', '-')) or stripped.startswith(('<<', '>>', '}', ')', '->', '.')):
            return True
        if re.search(r'\(.*\);?$', stripped):
            return True
        if re.match(r'^[A-Za-z0-9_]+(?:::<[A-Za-z0-9_, ]+>)?\s+[A-Za-z0-9_]+', stripped):
            return True
    return False

def clean_page_text(page_text: str, running_headers: list[str]) -> str:
    lines = page_text.splitlines()
    cleaned = []
    
    for line in lines:
        s = line.strip()
        if not s:
            cleaned.append('')
            continue
        
        # Filter out standalone page numbers (arabic or roman)
        if re.match(r'^\d+$', s) or re.match(r'^[ivxlcdm]+$', s, re.I):
            continue
        
        # Filter out running headers/footers
        skip = False
        for pat in running_headers:
            if re.match(pat, s, re.I):
                skip = True
                break
        if skip:
            continue
        
        cleaned.append(line)
        
    return '\n'.join(cleaned)

def format_text_to_markdown(raw_text: str, ch_title: str) -> str:
    """
    Transforms extracted PDF text into clean, structured Markdown.
    """
    # 1. Clean bullet ligatures: InDesign 'ff \n\n' or '■' or '•' or '' or 'f '
    text = re.sub(r'(?:\b[f]{1,2}\b|\u25a0|\u2022|\uf0a1|[•■])\s*\n+\s*([A-Za-z0-9])', r'- \1', raw_text)
    text = re.sub(r'^[ \t]*(?:\b[f]{1,2}\b|\u25a0|\u2022|\uf0a1|[•■])\s+', r'- ', text, flags=re.M)
    
    # 2. Fix hyphenated word breaks at end of line: 'concur-\nrency' -> 'concurrency'
    text = re.sub(r'(\b[A-Za-z]+)-\n\s*([a-z]+)\b', r'\1\2', text)
    
    # 3. Merge section numbers with titles: '1.1\n\nWhat is concurrency?' -> '1.1 What is concurrency?'
    text = re.sub(r'(\b\d+\.\d+(?:\.\d+)?\b)\s*\n+\s*([A-Za-z0-9][^\n]+)', r'\1 \2', text)
    
    lines = text.splitlines()
    md_lines = []
    
    # Add main title
    md_lines.append(f"# {ch_title}\n")
    
    in_code_block = False
    code_buffer = []
    
    def flush_code():
        nonlocal in_code_block, code_buffer
        if code_buffer:
            md_lines.append("```cpp")
            md_lines.extend(code_buffer)
            md_lines.append("```\n")
            code_buffer = []
        in_code_block = False

    i = 0
    while i < len(lines):
        line = lines[i]
        s = line.strip()
        
        if not s:
            if in_code_block:
                # Lookahead to see if next non-empty line is still code
                next_is_code = False
                for j in range(i + 1, min(i + 4, len(lines))):
                    if lines[j].strip():
                        if is_cpp_code_line(lines[j], in_code=True):
                            next_is_code = True
                        break
                if next_is_code:
                    code_buffer.append('')
                else:
                    flush_code()
            else:
                md_lines.append('')
            i += 1
            continue
        
        # Check headings
        # e.g., '1.1 What is concurrency?' or '1.2.2 Using concurrency for performance'
        m_sec = re.match(r'^(\d+\.\d+(?:\.\d+)?)\s+(.*)', s)
        if m_sec and not in_code_block:
            flush_code()
            level = "###" if m_sec.group(1).count('.') >= 2 else "##"
            md_lines.append(f"{level} {s}\n")
            i += 1
            continue
            
        # e.g., 'Creating an endpoint', 'How to do it…', 'How it works…'
        if re.match(r'^(?:How to do it…|How to do it|How it works…|How it works|There\'s more…|There\'s more|See also|Getting ready…|Getting ready|Summary)\b', s, re.I):
            flush_code()
            md_lines.append(f"### {s}\n")
            i += 1
            continue

        # Specific recipe titles in Boost.Asio
        if re.match(r'^(?:Creating an endpoint|Creating an active socket|Creating a passive socket|Resolving a DNS name|Binding a socket to an endpoint|Connecting a socket|Accepting connections|Creating the server endpoint)\b', s, re.I):
            flush_code()
            md_lines.append(f"## {s}\n")
            i += 1
            continue
        
        # Check if line looks like code
        looks_like_code = is_cpp_code_line(line, in_code=in_code_block)
        if looks_like_code:
            in_code_block = True
            code_buffer.append(line)
            i += 1
            continue
        else:
            if in_code_block:
                flush_code()
        
        # Normal prose or list
        if s.startswith('- ') or re.match(r'^\d+\.\s+', s):
            md_lines.append(s)
        else:
            md_lines.append(line)
        i += 1
        
    flush_code()
    
    # Reflow and clean multiple blank lines
    result = '\n'.join(md_lines)
    result = re.sub(r'\n{3,}', '\n\n', result)
    return result.strip() + '\n'


# --- Book Configurations ---

BOOKS_CONFIG = {
    'Boost.Asio C++ Network Programming Cookbook.pdf': {
        'book_slug': 'boost-asio',
        'book_short_name': 'Boost.Asio',
        'book_title_en': 'Boost.Asio C++ Network Programming Cookbook',
        'book_title_zh': 'Boost.Asio C++ 网络编程实战',
        'running_headers': [
            r'^Chapter\s+\d+$',
            r'^The Basics$',
            r'^I/O Operations$',
            r'^Implementing Client Applications$',
            r'^Implementing Server Applications$',
            r'^HTTP and SSL/TLS$',
            r'^Other Topics$'
        ],
        'chapters': [
            {
                'num': 1,
                'slug': '01-the-basics',
                'folder_title': '01 The Basics',
                'title_en': 'Chapter 1: The Basics',
                'title_zh': '第 1 章：Boost.Asio 基础知识',
                'start_page': 16,
                'end_page': 53,
                'desc_en': 'Introduction to fundamental Boost.Asio classes: endpoints, sockets, DNS resolution, and connection establishment.',
                'desc_zh': '深入解析 Boost.Asio 核心基础组件：端点 (Endpoint)、主动与被动套接字、DNS 域名解析与连接建立机制。',
                'tags_en': ['Boost.Asio', 'C++', 'Networking', 'Sockets', 'Endpoints', 'DNS'],
                'tags_zh': ['Boost.Asio', 'C++', '网络编程', '套接字', '端点', 'DNS解析']
            },
            {
                'num': 2,
                'slug': '02-io-operations',
                'folder_title': '02 IO Operations',
                'title_en': 'Chapter 2: I/O Operations',
                'title_zh': '第 2 章：网络 I/O 操作',
                'start_page': 54,
                'end_page': 109,
                'desc_en': 'Techniques for synchronous and asynchronous socket I/O operations, stream buffers, and error handling.',
                'desc_zh': '掌握 Boost.Asio 的同步与异步套接字读写操作、流式缓冲管理 (streambuf) 与错误处理模型。',
                'tags_en': ['Boost.Asio', 'I/O', 'Synchronous', 'Asynchronous', 'Buffers', 'TCP'],
                'tags_zh': ['Boost.Asio', '网络IO', '同步IO', '异步IO', '缓冲管理', 'TCP']
            },
            {
                'num': 3,
                'slug': '03-client-applications',
                'folder_title': '03 Client Applications',
                'title_en': 'Chapter 3: Implementing Client Applications',
                'title_zh': '第 3 章：构建客户端应用',
                'start_page': 110,
                'end_page': 141,
                'desc_en': 'Practical architectural patterns for building synchronous and asynchronous TCP client applications.',
                'desc_zh': '实战构建高性能同步与异步 TCP 客户端应用架构，处理连接管理与请求响应流。',
                'tags_en': ['Boost.Asio', 'Client', 'Sync Client', 'Async Client', 'TCP Client'],
                'tags_zh': ['Boost.Asio', '客户端', '同步客户端', '异步客户端', 'TCP客户端']
            },
            {
                'num': 4,
                'slug': '04-server-applications',
                'folder_title': '04 Server Applications',
                'title_en': 'Chapter 4: Implementing Server Applications',
                'title_zh': '第 4 章：构建服务端应用',
                'start_page': 142,
                'end_page': 173,
                'desc_en': 'Designing iterative and parallel TCP servers with Boost.Asio, managing concurrency, and handling client sessions.',
                'desc_zh': '设计迭代型与并发多线程 TCP 服务器架构，基于 Boost.Asio 实现高并发会话管理与事件驱动调度。',
                'tags_en': ['Boost.Asio', 'Server', 'Iterative Server', 'Parallel Server', 'Asynchronous Accept'],
                'tags_zh': ['Boost.Asio', '服务端', '迭代服务器', '并发多线程服务器', '异步Accept']
            },
            {
                'num': 5,
                'slug': '05-http-and-ssl-tls',
                'folder_title': '05 HTTP and SSL-TLS',
                'title_en': 'Chapter 5: HTTP and SSL/TLS',
                'title_zh': '第 5 章：HTTP 与 SSL/TLS 安全通信',
                'start_page': 174,
                'end_page': 225,
                'desc_en': 'Implementing HTTP protocol parsers, SSL/TLS encrypted streams, certificate verification, and secure network applications.',
                'desc_zh': '实现 HTTP 协议编解码、SSL/TLS 加密通信流、数字证书验证与安全可靠的分布式系统连接。',
                'tags_en': ['Boost.Asio', 'HTTP', 'SSL', 'TLS', 'Security', 'OpenSSL'],
                'tags_zh': ['Boost.Asio', 'HTTP协议', 'SSL', 'TLS', '加密通信', 'OpenSSL']
            },
            {
                'num': 6,
                'slug': '06-other-topics',
                'folder_title': '06 Other Topics',
                'title_en': 'Chapter 6: Other Topics',
                'title_zh': '第 6 章：高级与进阶主题',
                'start_page': 226,
                'end_page': 248,
                'desc_en': 'Advanced Boost.Asio facilities including steady/deadline timers, socket options, and composite buffer operations.',
                'desc_zh': '深入探索高精度异步定时器、套接字底层配置选项、组合缓冲区与进阶系统网络操作。',
                'tags_en': ['Boost.Asio', 'Timers', 'Socket Options', 'Composite Buffers', 'UNIX Domain'],
                'tags_zh': ['Boost.Asio', '定时器', '套接字选项', '组合缓冲', 'UNIX域套接字']
            }
        ]
    },
    'C++ Concurrency in Action.pdf': {
        'book_slug': 'cpp-concurrency',
        'book_short_name': 'C++ Concurrency',
        'book_title_en': 'C++ Concurrency in Action (2nd Edition)',
        'book_title_zh': 'C++ 并发编程实战（第二版）',
        'running_headers': [
            r'^CHAPTER\s+\d+.*',
            r'^APPENDIX\s+[A-D].*',
            r'^CONTENTS$',
            r'^BRIEF CONTENTS$',
            r'^ABOUT THIS BOOK$',
            r'^PREFACE$'
        ],
        'chapters': [
            {
                'num': 1,
                'slug': '01-hello-world',
                'folder_title': '01 Hello World',
                'title_en': 'Chapter 1: Hello, world of concurrency in C++!',
                'title_zh': '第 1 章：C++ 并发世界初探',
                'start_page': 24,
                'end_page': 38,
                'desc_en': 'What is concurrency and multithreading, why use it, and a brief history of concurrency in C++.',
                'desc_zh': '全面认识并发与多线程的基本概念、为什么使用并发，以及 C++ 标准中的并发演化历程。',
                'tags_en': ['C++', 'Concurrency', 'Multithreading', 'Threads', 'Performance'],
                'tags_zh': ['C++', '并发编程', '多线程', '线程模型', '性能优化']
            },
            {
                'num': 2,
                'slug': '02-managing-threads',
                'folder_title': '02 Managing Threads',
                'title_en': 'Chapter 2: Managing threads',
                'title_zh': '第 2 章：线程管理与生命周期',
                'start_page': 39,
                'end_page': 62,
                'desc_en': 'Launching threads, passing arguments, transferring ownership, and determining thread count at runtime.',
                'desc_zh': '掌握 std::thread 启动、参数传递、所有权转移 (std::move)、线程分离与运行时核心数查询。',
                'tags_en': ['C++', 'std::thread', 'RAII', 'Thread Ownership', 'Hardware Concurrency'],
                'tags_zh': ['C++', 'std::thread', 'RAII模式', '线程所有权', '硬件并发度']
            },
            {
                'num': 3,
                'slug': '03-sharing-data',
                'folder_title': '03 Sharing Data',
                'title_en': 'Chapter 3: Sharing data between threads',
                'title_zh': '第 3 章：线程间数据共享与互斥锁',
                'start_page': 63,
                'end_page': 93,
                'desc_en': 'Protecting shared data with mutexes, avoiding deadlocks, and alternate facilities for shared data protection.',
                'desc_zh': '深入互斥量 (std::mutex)、防死锁策略 (std::lock)、死锁规避准则以及读写锁与只初始化一次模式。',
                'tags_en': ['C++', 'Mutex', 'Deadlock', 'std::unique_lock', 'std::shared_mutex'],
                'tags_zh': ['C++', '互斥锁', '死锁防护', 'std::unique_lock', '共享互斥量']
            },
            {
                'num': 4,
                'slug': '04-synchronizing-operations',
                'folder_title': '04 Synchronizing Operations',
                'title_en': 'Chapter 4: Synchronizing concurrent operations',
                'title_zh': '第 4 章：同步并发操作与条件变量',
                'start_page': 94,
                'end_page': 134,
                'desc_en': 'Waiting for events with condition variables, futures, promises, and coordinating concurrent operations.',
                'desc_zh': '使用条件变量 (condition_variable) 等待事件、future 与 promise 异步传值及包装任务调度。',
                'tags_en': ['C++', 'Condition Variable', 'std::future', 'std::async', 'std::promise'],
                'tags_zh': ['C++', '条件变量', '异步Future', 'std::async', 'Promise传值']
            },
            {
                'num': 5,
                'slug': '05-memory-model-and-atomics',
                'folder_title': '05 Memory Model and Atomics',
                'title_en': 'Chapter 5: The C++ memory model and operations on atomic types',
                'title_zh': '第 5 章：C++ 内存模型与原子操作',
                'start_page': 135,
                'end_page': 195,
                'desc_en': 'In-depth exploration of the C++ memory model, atomic types, memory orderings, and release sequences.',
                'desc_zh': '深度拆解 C++ 内存模型、std::atomic 原子类型、顺序一致性、Acquire-Release 语义与内存屏障。',
                'tags_en': ['C++', 'Memory Model', 'Atomics', 'Memory Order', 'Acquire Release'],
                'tags_zh': ['C++', '内存模型', '原子操作', '内存顺序', 'Acquire-Release']
            },
            {
                'num': 6,
                'slug': '06-lock-based-data-structures',
                'folder_title': '06 Lock-Based Data Structures',
                'title_en': 'Chapter 6: Designing lock-based concurrent data structures',
                'title_zh': '第 6 章：基于锁的并发数据结构设计',
                'start_page': 196,
                'end_page': 227,
                'desc_en': 'Guidelines for concurrent data structure design, thread-safe stacks, queues, and lookup tables.',
                'desc_zh': '线程安全数据结构设计准则：实战线程安全栈、细粒度锁队列及并发哈希查询表。',
                'tags_en': ['C++', 'Data Structures', 'Thread Safe Stack', 'Thread Safe Queue', 'Fine-grained Locking'],
                'tags_zh': ['C++', '并发数据结构', '线程安全栈', '线程安全队列', '细粒度锁']
            },
            {
                'num': 7,
                'slug': '07-lock-free-data-structures',
                'folder_title': '07 Lock-Free Data Structures',
                'title_en': 'Chapter 7: Designing lock-free concurrent data structures',
                'title_zh': '第 7 章：无锁 (Lock-Free) 并发数据结构设计',
                'start_page': 228,
                'end_page': 273,
                'desc_en': 'Definitions, consequences, ABA problem, memory reclamation, and designing lock-free stacks and queues.',
                'desc_zh': '无锁与无等待数据结构原理：解决 ABA 问题、风险指针 (Hazard Pointers) 与引用计数内存回收。',
                'tags_en': ['C++', 'Lock-Free', 'ABA Problem', 'Hazard Pointers', 'CAS'],
                'tags_zh': ['C++', '无锁编程', 'ABA问题', '风险指针', 'CAS原子比较']
            },
            {
                'num': 8,
                'slug': '08-designing-concurrent-code',
                'folder_title': '08 Designing Concurrent Code',
                'title_en': 'Chapter 8: Designing concurrent code',
                'title_zh': '第 8 章：并发代码设计与性能优化',
                'start_page': 274,
                'end_page': 322,
                'desc_en': 'Work division techniques, hardware factors affecting performance, false sharing, and parallel algorithms.',
                'desc_zh': '任务划分模型、伪共享 (False Sharing) 规避、阿姆达尔定律与高性能并行算法实现。',
                'tags_en': ['C++', 'Parallel Algorithms', 'False Sharing', 'Cache Contention', 'Scalability'],
                'tags_zh': ['C++', '并行算法', '伪共享', '缓存争用', '系统扩展性']
            },
            {
                'num': 9,
                'slug': '09-advanced-thread-management',
                'folder_title': '09 Advanced Thread Management',
                'title_en': 'Chapter 9: Advanced thread management',
                'title_zh': '第 9 章：高级线程管理与线程池',
                'start_page': 323,
                'end_page': 349,
                'desc_en': 'Thread pools, work stealing queues, and interrupting threads cleanly.',
                'desc_zh': '生产级线程池架构设计：工作窃取 (Work Stealing) 队列与安全线程中断机制。',
                'tags_en': ['C++', 'Thread Pool', 'Work Stealing', 'Task Scheduler', 'Thread Interruption'],
                'tags_zh': ['C++', '线程池', '工作窃取', '任务调度器', '线程中断']
            },
            {
                'num': 10,
                'slug': '10-parallel-algorithms',
                'folder_title': '10 Parallel Algorithms',
                'title_en': 'Chapter 10: Parallel algorithms',
                'title_zh': '第 10 章：C++17 并行算法库',
                'start_page': 350,
                'end_page': 361,
                'desc_en': 'Execution policies in C++17, parallelizing standard algorithms, and performance considerations.',
                'desc_zh': 'C++17 标准并行算法实战：执行策略 (Execution Policies) 与标准算法并行化加速。',
                'tags_en': ['C++', 'C++17', 'Parallel STL', 'Execution Policies', 'std::execution'],
                'tags_zh': ['C++', 'C++17', '并行STL', '执行策略', 'std::execution']
            },
            {
                'num': 11,
                'slug': '11-testing-and-debugging',
                'folder_title': '11 Testing and Debugging',
                'title_en': 'Chapter 11: Testing and debugging multithreaded applications',
                'title_zh': '第 11 章：多线程应用测试与调试',
                'start_page': 362,
                'end_page': 376,
                'desc_en': 'Types of concurrency bugs, locating race conditions, testability design, and multithreaded test harnesses.',
                'desc_zh': '死锁与数据竞争定位、并发缺陷排查方法、面向可测性设计与多线程自动化测试框架。',
                'tags_en': ['C++', 'Testing', 'Debugging', 'Race Conditions', 'Deadlock Detection'],
                'tags_zh': ['C++', '并发测试', '故障调试', '数据竞争', '死锁检测']
            },
            {
                'num': 12,
                'slug': '12-appendix-a',
                'folder_title': '12 Appendix A',
                'title_en': 'Appendix A: Brief reference for some C++11 language features',
                'title_zh': '附录 A：C++11 核心语言特性速查',
                'start_page': 377,
                'end_page': 404,
                'desc_en': 'Rvalue references, move semantics, lambdas, constexpr, and generalized attributes.',
                'desc_zh': '右值引用与移动语义、Lambda 表达式、constexpr 与变长参数模板等核心语法速查。',
                'tags_en': ['C++', 'C++11', 'Move Semantics', 'Lambda', 'Language Reference'],
                'tags_zh': ['C++', 'C++11', '移动语义', 'Lambda', '语言参考']
            },
            {
                'num': 13,
                'slug': '13-appendix-b',
                'folder_title': '13 Appendix B',
                'title_en': 'Appendix B: Brief comparison of concurrency libraries',
                'title_zh': '附录 B：主流并发库对比',
                'start_page': 405,
                'end_page': 406,
                'desc_en': 'Overview and trade-offs between standard C++ threads, Boost.Thread, OpenMP, and TBB.',
                'desc_zh': '标准 C++ 线程、Boost.Thread、OpenMP 与 Intel TBB 等主流并发库优缺点全景对比。',
                'tags_en': ['C++', 'Boost.Thread', 'OpenMP', 'TBB', 'Concurrency Libraries'],
                'tags_zh': ['C++', 'Boost.Thread', 'OpenMP', 'TBB', '并发库对比']
            },
            {
                'num': 14,
                'slug': '14-appendix-c',
                'folder_title': '14 Appendix C',
                'title_en': 'Appendix C: A message-passing framework and complete ATM example',
                'title_zh': '附录 C：消息传递框架与 ATM 完整实战',
                'start_page': 407,
                'end_page': 423,
                'desc_en': 'Actor-style message passing framework implementation and a complete bank ATM simulation in modern C++.',
                'desc_zh': '现代 C++ 实现 Actor 模式消息传递框架，构建完整的银行 ATM 自动化模拟工程。',
                'tags_en': ['C++', 'Actor Model', 'Message Passing', 'ATM Simulation', 'State Machine'],
                'tags_zh': ['C++', 'Actor模型', '消息传递', 'ATM仿真', '状态机架构']
            },
            {
                'num': 15,
                'slug': '15-appendix-d',
                'folder_title': '15 Appendix D',
                'title_en': 'Appendix D: C++ Thread Library reference',
                'title_zh': '附录 D：C++ Thread 标准线程库参考手册',
                'start_page': 424,
                'end_page': 573,
                'desc_en': 'Comprehensive API reference for the standard thread library headers: <thread>, <mutex>, <condition_variable>, <future>, <atomic>.',
                'desc_zh': 'C++ 标准多线程库完整 API 参考手册：覆盖 thread, mutex, condition_variable, future 与 atomic 全套头文件。',
                'tags_en': ['C++', 'API Reference', 'std::thread', 'std::mutex', 'std::atomic'],
                'tags_zh': ['C++', 'API参考', 'std::thread', 'std::mutex', 'std::atomic']
            }
        ]
    }
}


def extract_pages_text(pdf_path: Path, start_page: int, end_page: int) -> str:
    """Extracts text for a range of pages using Microsoft MarkItDown if available, with pdftotext fallback."""
    if HAS_MARKITDOWN:
        try:
            pdf = pdfium.PdfDocument(str(pdf_path))
            sub_pdf = pdfium.PdfDocument.new()
            sub_pdf.import_pages(pdf, list(range(start_page - 1, end_page)))
            buf = io.BytesIO()
            sub_pdf.save(buf)
            buf.seek(0)
            md = MarkItDown()
            res = md.convert_stream(buf, file_extension='.pdf')
            return res.text_content
        except Exception as e:
            print(f"    [MarkItDown warning: {e}, falling back to pdftotext]")

    cmd = [
        'pdftotext',
        '-f', str(start_page),
        '-l', str(end_page),
        str(pdf_path),
        '-'
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    return res.stdout


def generate_frontmatter(
    doc_id: str,
    title: str,
    title_en: str,
    order: int,
    category: str,
    description: str,
    tags: list[str]
) -> str:
    tag_str = ', '.join(f'"{t}"' for t in tags)
    return (
        f"---\n"
        f"id: {doc_id}\n"
        f"title: \"{title}\"\n"
        f"titleEn: \"{title_en}\"\n"
        f"order: {order}\n"
        f"category: {category}\n"
        f"description: \"{description}\"\n"
        f"tags: [{tag_str}]\n"
        f"---\n\n"
    )


def get_existing_max_order(content_dir: Path, known_book_prefixes: list[str]) -> int:
    """
    Scans content/ directory for existing chapters and front-matter orders,
    ignoring any folders generated by this script.
    Returns the maximum order number found.
    """
    max_order = 0
    pattern_known = re.compile(
        r'^\d+[\.\-_]\s*(?:' + '|'.join(re.escape(p) for p in known_book_prefixes) + r')\b',
        re.I
    )
    for entry in content_dir.iterdir():
        if not entry.is_dir():
            continue
        # Skip directories generated by this script or legacy book folders
        if pattern_known.match(entry.name) or entry.name in ['boost-asio', 'cpp-concurrency']:
            continue

        # Check folder prefix e.g. "01. Scaling", "32. Jev Cloudflare AI Gateway"
        m = re.match(r'^(\d+)', entry.name)
        if m:
            order_val = int(m.group(1))
            if order_val > max_order:
                max_order = order_val

        # Also inspect index.en.md / index.zh.md / Readme.md front-matter if present
        for md_name in ['index.en.md', 'index.zh.md', 'index.md']:
            md_path = entry / md_name
            if md_path.exists():
                try:
                    content = md_path.read_text(encoding='utf-8')
                    m_order = re.search(r'^order:\s*(\d+)', content, re.M)
                    if m_order:
                        order_val = int(m_order.group(1))
                        if order_val > max_order:
                            max_order = order_val
                except Exception:
                    pass

    return max_order


def clean_existing_generated_folders(content_dir: Path, known_book_prefixes: list[str]):
    """Removes previously generated book folders so re-running is clean and deterministic."""
    pattern_known = re.compile(
        r'^\d+[\.\-_]\s*(?:' + '|'.join(re.escape(p) for p in known_book_prefixes) + r')\b',
        re.I
    )
    for entry in content_dir.iterdir():
        if not entry.is_dir():
            continue
        if pattern_known.match(entry.name) or entry.name in ['boost-asio', 'cpp-concurrency']:
            print(f"Cleaning up previous generated directory: {entry.name}")
            shutil.rmtree(entry)


def process_book(pdf_name: str, config: dict, start_order: int) -> int:
    pdf_path = PDFS_DIR / pdf_name
    if not pdf_path.exists():
        print(f"Warning: PDF not found: {pdf_path}")
        return start_order

    book_slug = config['book_slug']
    book_short_name = config['book_short_name']
    print(f"\nProcessing book: {pdf_name} -> {book_short_name}")
    
    running_headers = config.get('running_headers', [])
    chapters = config['chapters']
    
    current_order = start_order
    for ch in chapters:
        order = current_order
        current_order += 1
        
        ch_slug = ch['slug']
        doc_id = f"{book_slug}-{ch_slug}"
        folder_title = ch.get('folder_title', ch_slug)
        folder_name = f"{order:02d}. {book_short_name} - {folder_title}"
        out_dir = CONTENT_DIR / folder_name
        out_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"  [{order}] Extracting {ch['title_en']} (pages {ch['start_page']}-{ch['end_page']}) -> {folder_name}...")
        raw_text = extract_pages_text(pdf_path, ch['start_page'], ch['end_page'])
        
        # Split pages by form-feed to clean page headers per page
        pages = raw_text.split('\x0c')
        cleaned_pages = [clean_page_text(p, running_headers) for p in pages]
        full_cleaned = '\n'.join(cleaned_pages)
        
        # Format as Markdown
        body_en = format_text_to_markdown(full_cleaned, ch['title_en'])
        
        # Frontmatter for EN
        fm_en = generate_frontmatter(
            doc_id=doc_id,
            title=ch['title_en'],
            title_en=ch['title_en'],
            order=order,
            category='specialized',
            description=ch['desc_en'],
            tags=ch['tags_en']
        )
        
        # Frontmatter for ZH
        fm_zh = generate_frontmatter(
            doc_id=doc_id,
            title=ch['title_zh'],
            title_en=ch['title_en'],
            order=order,
            category='specialized',
            description=ch['desc_zh'],
            tags=ch['tags_zh']
        )
        
        # Write index.en.md
        en_file = out_dir / 'index.en.md'
        en_file.write_text(fm_en + body_en, encoding='utf-8')
        
        # Write index.zh.md (with Chinese title & frontmatter, preserving technical body)
        zh_body = body_en.replace(f"# {ch['title_en']}", f"# {ch['title_zh']}\n\n> 本章包含英文原书核心技术内容与完整代码示例，提供中英文对照检索。")
        zh_file = out_dir / 'index.zh.md'
        zh_file.write_text(fm_zh + zh_body, encoding='utf-8')

    print(f"Finished processing {book_short_name}: {len(chapters)} chapters written.")
    return current_order


def main():
    if not PDFS_DIR.exists():
        print(f"Error: {PDFS_DIR} does not exist.")
        sys.exit(1)

    known_prefixes = [cfg['book_short_name'] for cfg in BOOKS_CONFIG.values()]
    
    # 1. Clean up old generated book folders to guarantee idempotent numbering
    clean_existing_generated_folders(CONTENT_DIR, known_prefixes)

    # 2. Determine next available order dynamically from content/
    max_order = get_existing_max_order(CONTENT_DIR, known_prefixes)
    start_order = max_order + 1
    print(f"Auto-numbering: Maximum existing order in content/ is {max_order}. Next available order starts at {start_order}.")

    # 3. Process all configured books sequentially
    order_cursor = start_order
    for pdf_name, config in BOOKS_CONFIG.items():
        order_cursor = process_book(pdf_name, config, order_cursor)

    print(f"\nAll PDFs processed successfully. Total numbered documents created: {order_cursor - start_order} (Orders {start_order} to {order_cursor - 1}).")


if __name__ == '__main__':
    main()

