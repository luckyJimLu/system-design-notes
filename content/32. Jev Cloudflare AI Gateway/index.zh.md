---
id: jev-cloudflare-ai-gateway
title: Jev 与 Cloudflare AI Gateway 接入 SOP
titleEn: Jev with Cloudflare AI Gateway SOP
order: 32
category: developer-tools
description: 通过 Cloudflare AI Gateway 验证 Jev 结构化决策，并规划接入浏览器代理。
tags: [开发工具, Jev, Cloudflare, AI Gateway, 浏览器自动化, SOP]
---

# Jev × Cloudflare AI Gateway 验证与接入 SOP

更新：2026-09-29（北京时间）  
状态：官方接口和仓库配置已核对；尚未使用你的 Cloudflare 账户发起实际请求，因此延迟、费用和业务准确率均待实测。

## 1. 目标和结论

你提供的推广链接去掉 `utm_*` 参数后是 [Cloudflare AI Gateway 总览](https://developers.cloudflare.com/ai-gateway/)；它介绍网关能力，不是 Jev 专用的配置页面。实际调用以 Jev 模型页和 AI Gateway REST API 页为准。

在现有 Cloudflare 账户及 AI Gateway 下直接试用 TypeSafe 的 Jev，**不创建另一家模型提供商集成，也不申请 TypeSafe API Key**。首选 Cloudflare REST API 的 `POST /ai/run`，模型名 `typesafe/jev`。这是结构化决策模型，输入为 `state` 和若干 `questions`，输出选择、概率与置信度；它不生成自由文本。

注意区分两个目标：

| 目标 | 当前可行性 | 操作 |
| --- | --- | --- |
| 独立调用 Jev，观察 Cloudflare 网关日志 | 官方支持 | 本 SOP 第 2–5 节 |
| 让 `browser-use/jev-ultrafast` 直接改用 Cloudflare | 仓库当前未提供现成开关 | 按第 6 节修改模型传输层；不能仅设置 `TYPESAFE_API_KEY` 或替换 URL |

## 2. 准备

1. 在 Cloudflare 控制台进入 **AI → AI Gateway**，创建或选择一个 Gateway，记下 Gateway ID（例如 `default`）。检查计费方式、余额和用量上限。Jev 在 Cloudflare 模型目录中标记为第三方模型，经 Cloudflare 账户计费；当前目录价格为输入每百万 token **$0.042**、输出 **$0.00**。价格会变化，以控制台当前显示为准。
2. 获取 Account ID。创建具备 **Account → Workers AI → Read** 权限的 Cloudflare API Token。调用 `/accounts/{account_id}/ai/*` 时，仅有 AI Gateway 管理权限会返回 `401` / `10000`。
3. 在本机终端设置环境变量，避免把 Token 写进脚本或仓库：

```bash
export CF_ACCOUNT_ID='你的 Account ID'
export CF_AI_TOKEN='你的 Cloudflare API Token'
export CF_GATEWAY_ID='default'
```

## 3. 最小烟测

以下是官方 Jev 模型示例的简化版。这个模型使用专用 `input` schema，应调用通用 `/ai/run`；不要把它当作聊天模型发往 `/ai/v1/chat/completions`。

```bash
curl --fail-with-body --silent --show-error \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run" \
  -H "Authorization: Bearer ${CF_AI_TOKEN}" \
  -H "cf-aig-gateway-id: ${CF_GATEWAY_ID}" \
  -H 'Content-Type: application/json' \
  --data '{
    "model": "typesafe/jev",
    "input": {
      "state": "用户说：我被重复扣费，请尽快处理。",
      "questions": {
        "route": {
          "type": "choice",
          "instructions": "该请求应由哪个团队处理？",
          "criteria": {
            "billing": "账单、支付、退款、重复扣费",
            "technical": "故障、程序错误、接口问题",
            "other": "以上均不适用"
          }
        },
        "urgent": {
          "type": "noul",
          "instructions": "用户是否明确表达时间紧迫？",
          "criteria": {
            "true": "明确催促尽快处理",
            "false": "没有时间要求"
          }
        }
      }
    }
  }'
```

**通过条件**：HTTP 2xx；响应含 `answers.route.choice`、`answers.route.probabilities`、`answers.urgent.noul` 和 `usage`。预计 `route.choice` 为 `billing`，但模型并非确定性规则；应记录实际值，不能把示例输出当保证。到 Gateway 的 Analytics/Logs 确认该请求归属目标 Gateway、延迟、token 和费用。若日志不出现，先检查 Gateway ID 与所用账户。

## 4. 面向你的浏览器任务的判定样例

Jev 适合在每一步根据页面的**可见、已编号控件**选择动作。将网页观察整理为简短 state，同时为每个动作列出当前合法目标；不要让模型返回 CSS 选择器、任意 JavaScript 或未经观察的坐标。

```json
{
  "model": "typesafe/jev",
  "input": {
    "state": {
      "goal": "在搜索页打开标题为 API Guide 的结果",
      "url": "https://example.com/search",
      "visible_elements": [
        {"id": 1, "role": "textbox", "name": "Search", "value": "API Guide"},
        {"id": 2, "role": "button", "name": "Search"},
        {"id": 3, "role": "link", "name": "API Guide"}
      ]
    },
    "questions": {
      "operation": {
        "type": "choice",
        "instructions": "选择下一步；目标已完成才选 DONE。",
        "criteria": {
          "CLICK": "点击当前可见链接或按钮",
          "TYPE_TEXT": "输入框需要文本",
          "WAIT": "等待页面状态变化",
          "DONE": "目标已由当前页面证实",
          "BLOCKED": "缺少可用目标"
        }
      },
      "click_target": {
        "type": "choice",
        "instructions": "若决定 CLICK，应点击哪个可见元素？",
        "criteria": {"2": "Search 按钮", "3": "API Guide 链接"}
      }
    }
  }
}
```

把该 JSON 保存为 `jev-request.json` 后运行：

```bash
curl --fail-with-body --silent --show-error \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run" \
  -H "Authorization: Bearer ${CF_AI_TOKEN}" \
  -H "cf-aig-gateway-id: ${CF_GATEWAY_ID}" \
  -H 'Content-Type: application/json' \
  --data @jev-request.json
```

**执行前校验**：只读取 `answers.operation.choice` 对应的目标分支；目标 ID 必须在本次快照中存在且与操作类型兼容；页面状态变化后重新观察。`DONE` 仍须用独立断言验证目标。对登录、支付、发送消息等敏感动作，保留明确的人为确认。

## 5. 验收记录与排障

每个样例至少运行 10 次，保存：任务 ID、输入版本、模型返回、是否正确、P50/P95 延迟、输入 token、网关费用、错误码、最终页面断言。与现有浏览器方案在**相同页面和任务**上比较成功率及端到端时间；不要用仓库中的单次 7 秒演示当通用性能指标。

| 现象 | 检查顺序 |
| --- | --- |
| `401` / `10000` | Token 是否属于正确账户、是否有 Workers AI Read 权限；仅有 AI Gateway Read/Edit 不够 |
| 余额或计费错误 | 第三方模型余额、Gateway 计费设置和账户限制 |
| 请求成功但没入目标 Gateway | `cf-aig-gateway-id` 是否与控制台 Gateway ID 一致 |
| schema 错误 | 使用 `/ai/run`、`model: typesafe/jev`、`input.state`、`input.questions`；不要套用 chat completions 格式 |
| 选择错误或低置信度 | 缩短 state、明确目标定义、缩小候选集；低置信度时进入重试/人工处理，阈值按实测标定 |

不要把原始用户私密页面、Cookie、密钥和完整浏览器快照直接写入网关日志。生产环境应先做字段裁剪、脱敏，并检查日志保留设置。决策状态实时变化时，避免缓存旧选择；按任务需要关闭缓存。

## 6. 接入 `jev-ultrafast` 的工程步骤

该开源演示目前用 `TYPESAFE_API_KEY` 调 TypeSafe，另用 `TEXT_MODEL_API_KEY` 生成 `TYPE_TEXT` 所需文本。项目 issue #25 明确提出 provider 解耦需求。因此 Cloudflare 的模型可用，**不代表仓库现成支持 Cloudflare**。

1. 在独立分支梳理 `jev_ultrafast/model.py`、`questions.py` 和代理调用点，定义 `DecisionProvider.evaluate(state, questions)` 的内部接口。
2. 保留原有决策 schema 和候选 ID 规则，实现 `CloudflareJevProvider`：调用第 3 节的 `/ai/run`，传 `typesafe/jev`、Gateway ID 和 Cloudflare Token；将 `answers` 转回现有代理所需的操作、目标与概率结构。将认证信息放服务端环境变量。
3. `TYPE_TEXT` 仍须文本生成器。可继续使用已有 helper；如果目标是**只使用 Cloudflare 账户**，另选 Cloudflare 支持的文本模型，通过 Cloudflare REST API 接入生成环节，并验证 helper 所需 JSON 输出。Jev 自身不会生成待输入字符串。
4. 用本地静态表单、公开搜索页面、异步建议列表三组任务回归。验证目标兼容、页面过期、被遮挡元素、超时、`DONE` 独立断言和失败回退。
5. 比较原提供方与 Cloudflare 的成功率、P50/P95、token/任务及总成本后再考虑替换默认后端。

针对你之前的 Gemini Live/流式输出场景：Jev 适合作为**页面动作决策层**；WebSocket 音视频流采集、增量消息读取及会话协议仍由浏览器控制层负责。此处是基于两者接口职责作出的架构推断，需针对目标站点验证。

## 7. 官方资料

- [Cloudflare AI Gateway 总览（你提供的链接）](https://developers.cloudflare.com/ai-gateway/)
- [Cloudflare Jev 模型说明与输入输出示例](https://developers.cloudflare.com/ai/models/typesafe/jev/)
- [Cloudflare AI Gateway REST API、权限与网关路由](https://developers.cloudflare.com/ai-gateway/usage/rest-api/)
- [Cloudflare 创建 AI Gateway 教程](https://developers.cloudflare.com/ai-gateway/tutorials/create-first-aig-workers/)
- [browser-use/jev-ultrafast README](https://github.com/browser-use/jev-ultrafast)
- [jev-ultrafast 的 provider 解耦请求 #25](https://github.com/browser-use/jev-ultrafast/issues/25)
