# Privacy Policy / 隐私保护声明

**Last Updated**: 2026-11-28

ChatRelay (`ai-chat-relay`) is designed from the ground up as a **100% local-first** AI Cockpit.

## 1. Zero Telemetry & Strictly Allowlisted On-Demand Verification
- ChatRelay **never** embeds analytics, tracking scripts, or remote backends, and **never** transmits your conversation text, prompts, or pinned notes anywhere.
- **Offline by Default**: Prompt templates, Metro Timeline, Pinboard, Dynamic Island tab status sync, Context Handoff, and Markdown Export run **100% locally** inside browser storage (`chrome.storage.local` or Tampermonkey storage).
- **On-Demand Reality Check (Verify)**: Only when you explicitly click **Verify Packages & Repos Online**, ChatRelay queries three read-only public registries (`https://registry.npmjs.org`, `https://pypi.org`, `https://api.github.com`) with **only the extracted public package name or `owner/repo` string**—never conversation content, URLs, or user identifiers.
- **Minimal Permissions**:
  - Extension permissions: `storage` only; `host_permissions` strictly restricted to the three read-only package/repo registries above; content scripts strictly scoped to `chatgpt.com`, `chat.openai.com`, `gemini.google.com`, `claude.ai`, and `chat.deepseek.com`.
  - Userscript `@connect` strictly restricted to `registry.npmjs.org`, `pypi.org`, and `api.github.com`.

## 2. Built-in Secret & PII Redaction (Enabled by Default)
Before packaging a conversation for cross-platform Handoff, Fork, Pinboard, Tab Preview, or Markdown Export, ChatRelay locally scans and redacts:
- **Secrets & Credentials**: API keys (`sk-...`, `AIza...`, `ghp_...`, `AKIA...`, `hf_...`, `xoxb-...`), Bearer tokens / JWTs, PEM private key blocks, database URL passwords (`postgres://user:pass@host`), and sensitive environment variable values.
- **Personal Identifiers (PII)**: Email addresses, phone numbers, national ID numbers, and formatted card numbers.

## 3. Ephemeral Cross-Site Caches
- **No Raw Conversation URLs Stored**: Handoff and Pinboard metadata store only a one-way FNV-1a fingerprint (`sourceFingerprint`)—never your raw private conversation URL.
- **Burn-After-Read & Auto-Expire**: Cached handoff payloads auto-delete right after pasting (by default) and auto-expire after 30 minutes. Tab status entries auto-expire after 20 seconds.
- **Zero OS Clipboard Pollution**: Handoff and Export do not write to your OS clipboard automatically unless you click **Copy** or opt in.

## 4. Full User Control
You can purge pending handoff data or wipe all locally stored templates, pins, tab statuses, and settings at any time inside the Settings panel.

---

## 中文简要说明

- **默认纯本地、零遥测**：时间轴导航/分叉、多标签灵动岛监工、灵感背包、快捷模板、接力与 Markdown 导出**全部纯本地运行**，绝不上传任何对话文本或隐私内容。
- **联网验真严格白名单 + 手动触发**：只有当你主动点击「联网核实存在性」时，才会向 `registry.npmjs.org`、`pypi.org`、`api.github.com` 三个公开只读官方源查询提取出的包名或仓库名，绝不夹带聊天原文。
- **默认开启双重脱敏**：接力、分叉、钉入灵感背包、灵动岛摘要以及导出前，自动打码 API 密钥、Token、JWT、私钥、数据库连接密码及个人邮箱/手机号/身份证号。
- **阅后即焚与一键清空**：本地缓存不存原始对话链接（仅存单向指纹），接力默认填入即焚且 30 分钟自动销毁，设置页支持一键清空全部本地数据。
