# Privacy Policy / 隐私保护声明

**Last Updated**: 2026-11-21

ChatRelay (`ai-chat-relay`) is designed from the ground up as a **100% local-first** browser tool.

## 1. Zero Network Requests & Zero Telemetry
- ChatRelay **never** makes outbound network requests, **never** embeds analytics or tracking scripts, and **never** transmits your prompts, conversations, or templates to any third-party server.
- In the Userscript build, no `@connect` or `GM_xmlhttpRequest` permissions are requested.
- In the Chrome/Edge Extension build, only the `storage` permission is requested, scoped strictly to `chatgpt.com`, `chat.openai.com`, `gemini.google.com`, `claude.ai`, and `chat.deepseek.com`.

## 2. Built-in Secret & PII Redaction (Enabled by Default)
Before packaging a conversation for cross-platform Handoff or Markdown export, ChatRelay locally scans and redacts:
- **Secrets & Credentials**: API keys (`sk-...`, `AIza...`, `ghp_...`, `AKIA...`, `hf_...`, `xoxb-...`), Bearer tokens / JWTs, PEM private key blocks, database URL passwords (`postgres://user:pass@host`), and sensitive environment variable values.
- **Personal Identifiers (PII)**: Email addresses, phone numbers, national ID numbers, and formatted card numbers.

Both redaction switches can be toggled anytime in Settings.

## 3. Ephemeral Cross-Site Handoff Cache
- **No Raw Conversation URLs Stored**: Handoff metadata stores only a one-way FNV-1a fingerprint (`sourceFingerprint`) to distinguish source vs. target tabs—never your raw private conversation URL.
- **Burn-After-Read**: By default, once you click **Resume Here**, the cached handoff payload is immediately deleted from local extension/userscript storage.
- **Auto-Expiration**: Unconsumed handoff payloads automatically expire after 30 minutes (configurable) and are purged from storage.
- **Export Privacy**: Exported Markdown files omit source URLs by default, and neither Handoff nor Export writes to your OS clipboard history automatically unless you click **Copy** or opt in.

## 4. Full User Control
You can purge pending handoff data or wipe all locally stored templates and settings at any time inside the Settings panel.

---

## 中文简要说明

- **零联网、零统计**：所有解析、脱敏、模板管理和接力打包均在本地浏览器内完成，不向任何第三方服务器发送数据。
- **默认开启双重脱敏**：带走接力与导出 Markdown 前自动打码 API 密钥、Token、JWT、私钥、数据库连接密码，以及邮箱、手机号、身份证号等个人隐私信息。
- **不留存敏感痕迹**：本地缓存不保存原始对话 URL（仅存单向哈希指纹）；默认支持“填入目标平台后立即销毁（阅后即焚）”和“30 分钟自动过期自毁”；默认不主动写入系统剪贴板历史；设置页提供一键清空全部本地数据。
