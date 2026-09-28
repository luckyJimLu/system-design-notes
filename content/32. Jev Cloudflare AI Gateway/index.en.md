---
id: jev-cloudflare-ai-gateway
title: Jev with Cloudflare AI Gateway SOP
titleEn: Jev with Cloudflare AI Gateway SOP
order: 32
category: developer-tools
description: Validate Jev structured decisions via Cloudflare AI Gateway and plan browser agent integration.
tags: [Developer Tools, Jev, Cloudflare, AI Gateway, Browser Automation, SOP]
---

# Jev with Cloudflare AI Gateway: Validation and Integration SOP

Updated: 2026-09-29. The official API and repository configuration have been checked. No request has been made using your Cloudflare account, so latency, cost, and task accuracy remain unverified.

## Scope and current status

Use the existing Cloudflare account and AI Gateway to call TypeSafe Jev **without a separate TypeSafe API key or provider integration**. The supported REST path is `POST /ai/run` with model `typesafe/jev`. Jev evaluates a state against typed `noul`, `choice`, and `score` questions and returns probabilities; it does not generate free-form text.

The promotional link to the [AI Gateway overview](https://developers.cloudflare.com/ai-gateway/) is a general entry point. The [Jev model page](https://developers.cloudflare.com/ai/models/typesafe/jev/) specifies the request schema, and the [REST API guide](https://developers.cloudflare.com/ai-gateway/usage/rest-api/) specifies authentication and gateway routing.

| Goal | Status |
| --- | --- |
| Call Jev through Cloudflare and inspect Gateway logs | Supported by the documented REST API |
| Point `browser-use/jev-ultrafast` at Cloudflare with environment settings alone | Not currently supported by that repository; add a decision provider adapter |

## Prerequisites

1. In Cloudflare, go to **AI → AI Gateway**, create or select a gateway, and record its ID (for example, `default`). Review billing, credits, and spend limits. The model catalog currently lists Jev as a third-party model at $0.042 per million input tokens and $0 per million output tokens; verify the current price before use.
2. Find the Cloudflare Account ID and create an API token with **Account → Workers AI → Read** permission. An AI Gateway management-only token is insufficient for `/accounts/{account_id}/ai/*` and can return `401` / `10000`.
3. Set credentials locally; never commit the token:

```bash
export CF_ACCOUNT_ID='your Account ID'
export CF_AI_TOKEN='your Cloudflare API Token'
export CF_GATEWAY_ID='default'
```

## Smoke test

Use the universal `/ai/run` endpoint and Jev's model-specific schema. Do not send this payload to chat completions.

```bash
curl --fail-with-body --silent --show-error \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run" \
  -H "Authorization: Bearer ${CF_AI_TOKEN}" \
  -H "cf-aig-gateway-id: ${CF_GATEWAY_ID}" \
  -H 'Content-Type: application/json' \
  --data '{
    "model": "typesafe/jev",
    "input": {
      "state": "The customer says: I was charged twice. Please resolve this urgently.",
      "questions": {
        "route": {
          "type": "choice",
          "instructions": "Which team should handle this?",
          "criteria": {
            "billing": "Billing, payment, refunds, duplicate charges",
            "technical": "Bugs, outages, integrations",
            "other": "None of the above"
          }
        },
        "urgent": {
          "type": "noul",
          "instructions": "Does the customer explicitly express urgency?",
          "criteria": {
            "true": "Explicit request for urgent handling",
            "false": "No time requirement"
          }
        }
      }
    }
  }'
```

Acceptance: HTTP 2xx; the response includes `answers.route.choice`, `answers.route.probabilities`, `answers.urgent.noul`, and `usage`. Billing is the expected category in this example, not a guaranteed result. Check that Analytics/Logs attribute the request to the selected gateway and record latency, tokens, and cost.

## Browser-agent decision pattern

Supply the goal, current URL, and a compact table of **visible, numbered controls** as `state`. Define a `choice` question for the next operation and, when applicable, a separate `choice` question for compatible targets. Use only the target matching the selected operation. Before executing, ensure the target ID still belongs to the current snapshot and that the action is compatible. Observe again when the page changes. Verify `DONE` with an independent outcome assertion.

The browser executor, not Jev, handles DOM snapshots, stale-state checks, click safety, and streaming. Jev is the decision layer; the text helper generates strings for `TYPE_TEXT`.

## Measurement and troubleshooting

Run at least ten repetitions of each representative task. Record the prompt version, response, outcome assertion, P50/P95 end-to-end latency, input tokens, gateway cost, and errors. Compare with the existing browser implementation on the same tasks. The repository's single seven-second flight demo is not a general reliability benchmark.

| Symptom | Check |
| --- | --- |
| `401` / `10000` | Correct account and Workers AI Read token permission |
| Billing error | Third-party credits, gateway billing configuration, account limits |
| No log under intended gateway | `cf-aig-gateway-id` matches the selected Gateway ID |
| Schema error | `/ai/run`, `model: typesafe/jev`, and `input.state/questions` |
| Low confidence | Shorten state, make criteria explicit, reduce candidate count, and calibrate escalation thresholds |

Remove secrets, cookies, and irrelevant private page content before sending state or writing logs. Avoid caching decisions for rapidly changing page state.

## Integrating `jev-ultrafast`

The upstream [README](https://github.com/browser-use/jev-ultrafast) currently configures `TYPESAFE_API_KEY` for decisions and `TEXT_MODEL_API_KEY` for the separate text helper. [Issue #25](https://github.com/browser-use/jev-ultrafast/issues/25) requests provider decoupling.

1. Define an internal `DecisionProvider.evaluate(state, questions)` interface around the current model calls.
2. Implement a Cloudflare provider using the documented `/ai/run` payload, server-side credentials, and an adapter back to the agent's current operation/target/probability structures.
3. Retain the text helper, or separately migrate it to a suitable Cloudflare-supported text model if the whole stack should use the Cloudflare account. Jev cannot author the text to type.
4. Regress static forms, public search, and asynchronous suggestion lists. Check stale targets, occluded controls, timeouts, independent `DONE` assertions, and fallback.
5. Compare task success, latency, and total cost before changing the default provider.

For the existing Gemini Live and streaming-output project, Jev can choose page actions. Browser control must still handle WebSocket/media capture and incremental output. That division is an architectural inference and needs target-site validation.

## References

- [Jev model reference](https://developers.cloudflare.com/ai/models/typesafe/jev/)
- [AI Gateway REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/)
- [Create an AI Gateway](https://developers.cloudflare.com/ai-gateway/tutorials/create-first-aig-workers/)
- [AI Gateway overview](https://developers.cloudflare.com/ai-gateway/)
- [jev-ultrafast](https://github.com/browser-use/jev-ultrafast)
- [Provider abstraction issue #25](https://github.com/browser-use/jev-ultrafast/issues/25)
