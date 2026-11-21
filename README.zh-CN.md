# ChatRelay — 跨平台 AI 提示词与对话接力助手

[English README](./README.md)

面向 **ChatGPT、Gemini、Claude、DeepSeek** 的轻量开源浏览器增强工具，一套 TypeScript 代码**一键双构建**出 **Chrome/Edge 扩展（MV3）** 与 **油猴脚本（`.user.js`）**。

## 核心功能

- **`/` 快捷指令与提示词剧本（Prompt & Playbook）**
  - 在任意支持网站的输入框敲 `/`（或按 `Ctrl+Shift+P` / `Cmd+Shift+P`）即刻唤起提示词面板。
  - 支持 `{{变量名}}` 占位符语法，选中模板时弹窗快速填空再精准写入输入框。
  - 内置 8 个中英双语高频模板（`/debug`、`/review`、`/translate`、`/tldr`、`/refactor`、`/prompt`、`/handoff-brief`、`/playbook`），支持自由增删改以及 Markdown 剧本 / JSON 导入导出。
- **跨平台一键对话接力（Context Handoff）**
  - 在某个模型里聊了一半碰到次数上限或卡住了？点击右下角悬浮条的 **「带走接力」**，自动将对话整理为结构化前情提要（支持 **精简模式**：保留最初目标 + 最近 N 轮；或 **完整模式**）。
  - 切换到另一个 AI 平台网页时，右下角会自动弹出 **「发现来自 XX 的待接力上下文」** 胶囊，点 **「接着聊」** 一键填入并继续。
- **高保真无损导出 Markdown**
  - 自动识别代码块语言并剔除网页自带的 `"Copy code"` 等按钮噪音，还原 KaTeX 数学公式（`$...$` / `$$...$$`）和 Markdown 表格，支持可选导出模型深度思考过程。
- **纯本地隐私优先 & 适配严格安全策略**
  - 零后台服务器、零数据上传、零外发请求；界面封装在 Shadow DOM 内且全程不使用 `innerHTML`，完美兼容 Gemini 等开启 Trusted Types 的站点。
  - **默认开启双重自动脱敏**：带走接力或导出 Markdown 前自动对 API Key、Token、JWT、私钥、数据库密码以及邮箱、手机号、身份证号进行打码替换。
  - **阅后即焚 & 自动过期销毁**：接力缓存不存原对话链接（仅存单向指纹）、填入目标框后立即销毁、超时（默认 30 分钟）自动清除，默认不污染系统剪贴板历史。详情见 [PRIVACY.md](./PRIVACY.md)。
- **一键双构建（Dual Build）**
  - 一次构建同时产出 Chrome 扩展包与单文件油猴脚本。

## 支持平台

- **ChatGPT**：`https://chatgpt.com/`、`https://chat.openai.com/`
- **Gemini**：`https://gemini.google.com/`
- **Claude**：`https://claude.ai/`
- **DeepSeek**：`https://chat.deepseek.com/`

## 安装使用

### 方式一：Chrome / Edge 浏览器扩展（无需装油猴）

1. 前往 [GitHub Releases](https://github.com/zhangxiangyi2022-maker/ai-chat-relay/releases/latest) 下载 [`chat-relay-extension.zip`](https://github.com/zhangxiangyi2022-maker/ai-chat-relay/releases/latest/download/chat-relay-extension.zip) 并解压（或本地执行 `npm run build`）。
2. 在浏览器地址栏打开 `chrome://extensions/`（Edge 为 `edge://extensions/`）。
3. 打开右上角的 **开发者模式**。
4. 点击 **加载已解压的扩展程序**，选择解压后的文件夹（`dist/extension/`）即可。

### 方式二：油猴脚本（Tampermonkey / Violentmonkey）

1. 先在浏览器安装 **篡改猴（Tampermonkey）** 或 **暴力猴（Violentmonkey）**。
2. 点击直装链接：[**安装 `chat-relay.user.js`**](https://github.com/zhangxiangyi2022-maker/ai-chat-relay/releases/latest/download/chat-relay.user.js)（或把本地构建的 `dist/userscript/chat-relay.user.js` 拖入脚本管理器）。

## 本地开发与构建

```bash
npm install
npm run typecheck
npm test
npm run build
```

构建完成后会在 `dist/` 下生成：
- `dist/extension/`：解压态 Chrome/Edge 扩展目录
- `dist/chat-relay-extension.zip`：可直接分享/上架的扩展压缩包
- `dist/userscript/chat-relay.user.js`：单文件油猴脚本

## 开源协议

[MIT](./LICENSE)
