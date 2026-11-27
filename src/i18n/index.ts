import type { Locale, PlatformId } from '../types/index.js';

export const PLATFORM_NAMES: Record<PlatformId, string> = {
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  claude: 'Claude',
  deepseek: 'DeepSeek',
};

export interface I18nMessages {
  appName: string;
  tagline: string;
  privacyBadge: string;
  langSwitch: string;
  promptsBtn: string;
  handoffBtn: string;
  exportBtn: string;
  pinboardBtn: string;
  verifyBtn: string;
  settingsBtn: string;
  paletteTitle: string;
  paletteSearchPlaceholder: string;
  newTemplate: string;
  importBtn: string;
  exportTemplatesBtn: string;
  resetBuiltinsBtn: string;
  noTemplatesMatch: string;
  insertBtn: string;
  editBtn: string;
  deleteBtn: string;
  saveBtn: string;
  cancelBtn: string;
  fillVarsTitle: string;
  varInputPlaceholder: string;
  cmdLabel: string;
  titleLabel: string;
  tagsLabel: string;
  contentLabel: string;
  contentHint: string;
  importTitle: string;
  importPlaceholder: string;
  importApply: string;
  handoffBannerTitle: string;
  handoffForkTitle: string;
  handoffBannerMeta: string;
  handoffRedactedMeta: string;
  handoffPasteBtn: string;
  handoffCopyBtn: string;
  handoffDismissBtn: string;
  handoffModeCompact: string;
  handoffModeFull: string;
  includeThinkingLabel: string;
  slashTriggerLabel: string;
  maxCompactTurnsLabel: string;
  hudSectionTitle: string;
  showTimelineLabel: string;
  showIslandLabel: string;
  notifyDoneLabel: string;
  selectionPinbarLabel: string;
  privacySectionTitle: string;
  redactSecretsLabel: string;
  redactPiiLabel: string;
  autoClearAfterPasteLabel: string;
  handoffTtlLabel: string;
  includeSourceUrlLabel: string;
  autoCopyLabel: string;
  clearHandoffNowBtn: string;
  clearAllDataBtn: string;
  timelineJumpBtn: string;
  timelineForkBtn: string;
  timelinePinBtn: string;
  timelineMuteBtn: string;
  timelineUnmuteBtn: string;
  timelineCodeChip: string;
  timelineMathChip: string;
  timelineTableChip: string;
  timelineMutedChip: string;
  islandTitle: string;
  islandStreaming: string;
  islandDone: string;
  islandIdle: string;
  islandBroadcastBtn: string;
  islandNotifyBtn: string;
  islandNoTabs: string;
  broadcastTitle: string;
  broadcastPlaceholder: string;
  broadcastTargetsLabel: string;
  broadcastAutoSubmitLabel: string;
  broadcastSendBtn: string;
  broadcastSentToast: string;
  broadcastNoTargetToast: string;
  pinSelectionBtn: string;
  pinboardTitle: string;
  pinboardEmpty: string;
  pinboardExportMdBtn: string;
  pinboardInsertAllBtn: string;
  pinboardClearBtn: string;
  pinAddedToast: string;
  verifierTitle: string;
  verifierPrivacyNote: string;
  verifierRunOnlineBtn: string;
  verifierScanning: string;
  verifierEmpty: string;
  verifierCopyReportBtn: string;
  verifierCountLabel: string;
  toastHandoffSaved: string;
  toastHandoffSavedRedacted: string;
  toastForkSaved: string;
  toastNoMessages: string;
  toastNoInput: string;
  toastInserted: string;
  toastExportedMd: string;
  toastExportedMdRedacted: string;
  toastCopied: string;
  toastTemplateSaved: string;
  toastTemplateDeleted: string;
  toastImportedCount: string;
  toastImportEmpty: string;
  toastBuiltinsRestored: string;
  toastPrivacyCleared: string;
  popupStatusTitle: string;
  popupNoHandoff: string;
  popupOpenSites: string;
  popupTemplateCount: string;
}

const ZH: I18nMessages = {
  appName: 'ChatRelay',
  tagline: '全平台 AI 驾驶舱 · 接力 / 地铁线 / 灵动岛 / 防幻觉验真',
  privacyBadge: '纯本地运行 · 默认双层脱敏 · 联网验真仅在手动点击时触发',
  langSwitch: 'EN',
  promptsBtn: '指令 /',
  handoffBtn: '接力',
  exportBtn: '导出',
  pinboardBtn: '背包',
  verifyBtn: '验真',
  settingsBtn: '设置',
  paletteTitle: '快捷提示词与剧本',
  paletteSearchPlaceholder: '搜索 /指令、标题或标签...',
  newTemplate: '+ 新建模板',
  importBtn: '导入',
  exportTemplatesBtn: '导出库',
  resetBuiltinsBtn: '恢复默认',
  noTemplatesMatch: '没有匹配的模板，可直接新建一个。',
  insertBtn: '填入',
  editBtn: '编辑',
  deleteBtn: '删除',
  saveBtn: '保存',
  cancelBtn: '取消',
  fillVarsTitle: '填写模板变量',
  varInputPlaceholder: '输入内容（可留空）...',
  cmdLabel: '快捷指令（如 debug）',
  titleLabel: '模板标题',
  tagsLabel: '标签（逗号分隔）',
  contentLabel: '模板正文',
  contentHint: '使用 {{变量名}} 语法即可在插入时弹窗快速填空',
  importTitle: '导入模板（支持 JSON 或 Markdown 剧本）',
  importPlaceholder: '粘贴导出的 JSON 或 Markdown 内容...',
  importApply: '确认导入',
  handoffBannerTitle: '来自 {platform} 的待接力上下文',
  handoffForkTitle: '来自 {platform} 第 #{turns} 轮的对话分叉',
  handoffBannerMeta: '{included}/{total} 条消息 · 约 {tokens} tokens · {mode}',
  handoffRedactedMeta: ' · 已脱敏 {count} 处',
  handoffPasteBtn: '接着聊',
  handoffCopyBtn: '复制',
  handoffDismissBtn: '销毁',
  handoffModeCompact: '精简模式',
  handoffModeFull: '完整模式',
  includeThinkingLabel: '导出时包含深度思考过程',
  slashTriggerLabel: '在输入框输入 / 时自动弹出指令面板',
  maxCompactTurnsLabel: '精简接力保留最近消息条数',
  hudSectionTitle: 'AI 驾驶舱 HUD',
  showTimelineLabel: '显示右侧「对话地铁线」时间轴导航与分叉按钮',
  showIslandLabel: '显示顶部「灵动岛监工雷达 & 一问多投」浮窗',
  notifyDoneLabel: '后台 AI 思考完成时发送系统桌面通知',
  selectionPinbarLabel: '划词选中文本时弹出「📌 钉进灵感背包」浮标',
  privacySectionTitle: '私人隐私保护',
  redactSecretsLabel: '自动打码密钥/Token/JWT/私钥/数据库密码',
  redactPiiLabel: '自动打码个人邮箱/手机号/身份证/银行卡号',
  autoClearAfterPasteLabel: '填入目标对话框后立即销毁接力缓存（阅后即焚）',
  handoffTtlLabel: '接力缓存自动过期时间（分钟，0 为不自动过期）',
  includeSourceUrlLabel: '导出 Markdown 时写入来源链接（默认关闭防泄露）',
  autoCopyLabel: '带走接力/导出时自动写入系统剪贴板（默认关闭）',
  clearHandoffNowBtn: '清除待接力缓存',
  clearAllDataBtn: '一键清空全部本地数据',
  timelineJumpBtn: '定位',
  timelineForkBtn: '分叉到此处',
  timelinePinBtn: '钉住',
  timelineMuteBtn: '静音',
  timelineUnmuteBtn: '取消静音',
  timelineCodeChip: '代码',
  timelineMathChip: '公式',
  timelineTableChip: '表格',
  timelineMutedChip: '已静音',
  islandTitle: '灵动岛监工',
  islandStreaming: '思考中 {sec}s',
  islandDone: '已完成 {sec}s',
  islandIdle: '空闲',
  islandBroadcastBtn: '群发',
  islandNotifyBtn: '通知',
  islandNoTabs: '仅当前标签页在线',
  broadcastTitle: '一问多投（向已打开的 AI 标签页同步投递）',
  broadcastPlaceholder: '输入要同时问多个 AI 的问题...',
  broadcastTargetsLabel: '选择投递目标标签页：',
  broadcastAutoSubmitLabel: '填入后尝试自动点击发送（不勾选则仅填入待你确认）',
  broadcastSendBtn: '立即群发投递',
  broadcastSentToast: '已向 {count} 个 AI 标签页投递提示词',
  broadcastNoTargetToast: '请至少选择一个在线 AI 标签页并输入内容',
  pinSelectionBtn: '钉进背包',
  pinboardTitle: '随手钉 · 灵感背包',
  pinboardEmpty: '在页面里划选任意文字点「📌 钉进背包」，或在右侧地铁线节点点「钉住」，就能把零散精华集中在这里。',
  pinboardExportMdBtn: '拼成 Markdown 笔记',
  pinboardInsertAllBtn: '全部喂给当前 AI',
  pinboardClearBtn: '清空背包',
  pinAddedToast: '已收入灵感背包',
  verifierTitle: '防幻觉 · 包名与 GitHub 验真透视灯',
  verifierPrivacyNote: '隐私承诺：仅在你点击下方按钮时，向 npm / PyPI / GitHub 官方只读接口核对提取出的公开包名与仓库名，绝不发送任何对话文本。',
  verifierRunOnlineBtn: '联网核实存在性',
  verifierScanning: '正在向官方源核实...',
  verifierEmpty: '当前对话暂未识别到 npm / PyPI 包名、GitHub 仓库或待核验外链。',
  verifierCopyReportBtn: '复制打假追问话术',
  verifierCountLabel: '已识别 {count} 项候选包/仓库/链接（含离线可疑项检查）',
  toastHandoffSaved: '已打包 {platform} 的 {count} 条消息，切到其他 AI 页面即可接力',
  toastHandoffSavedRedacted: '已打包 {platform} 的 {count} 条消息（已自动脱敏 {redacted} 处敏感信息）',
  toastForkSaved: '已从第 #{turn} 轮分叉打包（含 {count} 条有效消息）',
  toastNoMessages: '当前页面暂未识别到可导出的对话内容',
  toastNoInput: '未找到页面输入框，已为你复制到剪贴板',
  toastInserted: '已填入输入框',
  toastExportedMd: '已下载 Markdown 文件',
  toastExportedMdRedacted: '已下载 Markdown 文件（已自动脱敏 {redacted} 处敏感信息）',
  toastCopied: '已复制到剪贴板',
  toastTemplateSaved: '模板已保存',
  toastTemplateDeleted: '模板已删除',
  toastImportedCount: '成功导入 {count} 条模板',
  toastImportEmpty: '未识别到有效模板内容',
  toastBuiltinsRestored: '已恢复内置默认模板',
  toastPrivacyCleared: '已安全清除本地缓存数据',
  popupStatusTitle: '当前跨站接力缓存',
  popupNoHandoff: '暂无待接力对话。在 ChatGPT / Gemini / Claude / DeepSeek 页面点击「接力」或从地铁线分叉即可流转。',
  popupOpenSites: '快速打开支持平台',
  popupTemplateCount: '已保存模板：{count} 条',
};

const EN: I18nMessages = {
  appName: 'ChatRelay',
  tagline: 'Cross-AI Cockpit · Handoff / Timeline / Radar / Reality Check',
  privacyBadge: '100% Local · Auto-Redaction Active · Verify only on demand',
  langSwitch: '中文',
  promptsBtn: 'Prompts /',
  handoffBtn: 'Handoff',
  exportBtn: 'Export',
  pinboardBtn: 'Pins',
  verifyBtn: 'Verify',
  settingsBtn: 'Settings',
  paletteTitle: 'Prompt & Playbook Palette',
  paletteSearchPlaceholder: 'Search /command, title, or tags...',
  newTemplate: '+ New Template',
  importBtn: 'Import',
  exportTemplatesBtn: 'Export All',
  resetBuiltinsBtn: 'Restore Defaults',
  noTemplatesMatch: 'No matching templates found.',
  insertBtn: 'Insert',
  editBtn: 'Edit',
  deleteBtn: 'Delete',
  saveBtn: 'Save',
  cancelBtn: 'Cancel',
  fillVarsTitle: 'Fill Template Variables',
  varInputPlaceholder: 'Enter value (optional)...',
  cmdLabel: 'Slash command (e.g. debug)',
  titleLabel: 'Title',
  tagsLabel: 'Tags (comma-separated)',
  contentLabel: 'Prompt Content',
  contentHint: 'Use {{variable}} placeholders to prompt for quick fill-in on insert',
  importTitle: 'Import Templates (JSON or Markdown Playbook)',
  importPlaceholder: 'Paste exported JSON or Markdown playbook...',
  importApply: 'Import',
  handoffBannerTitle: 'Pending Handoff from {platform}',
  handoffForkTitle: 'Conversation Fork from {platform} (#{turns})',
  handoffBannerMeta: '{included}/{total} msgs · ~{tokens} tokens · {mode}',
  handoffRedactedMeta: ' · {count} redacted',
  handoffPasteBtn: 'Resume Here',
  handoffCopyBtn: 'Copy',
  handoffDismissBtn: 'Purge',
  handoffModeCompact: 'Compact',
  handoffModeFull: 'Full',
  includeThinkingLabel: 'Include model thinking blocks in Markdown export',
  slashTriggerLabel: 'Open palette when typing / in input box',
  maxCompactTurnsLabel: 'Recent messages kept in Compact handoff',
  hudSectionTitle: 'AI Cockpit HUD',
  showTimelineLabel: 'Show right-edge Metro Timeline & Fork controls',
  showIslandLabel: 'Show top Dynamic Island radar & multi-tab broadcast',
  notifyDoneLabel: 'Send desktop notification when a background AI finishes',
  selectionPinbarLabel: 'Show floating "Pin" pill when selecting text',
  privacySectionTitle: 'Privacy & Secret Protection',
  redactSecretsLabel: 'Auto-redact API keys, tokens, JWTs, private keys & DB passwords',
  redactPiiLabel: 'Auto-redact personal emails, phone numbers, IDs & card numbers',
  autoClearAfterPasteLabel: 'Auto-purge handoff cache right after pasting (burn-after-read)',
  handoffTtlLabel: 'Handoff auto-expiration in minutes (0 = never expire)',
  includeSourceUrlLabel: 'Include source URL in Markdown export (off by default)',
  autoCopyLabel: 'Auto-copy to OS clipboard on Handoff/Export (off by default)',
  clearHandoffNowBtn: 'Purge Handoff Cache',
  clearAllDataBtn: 'Wipe All Local Data',
  timelineJumpBtn: 'Jump',
  timelineForkBtn: 'Fork Here',
  timelinePinBtn: 'Pin',
  timelineMuteBtn: 'Mute',
  timelineUnmuteBtn: 'Unmute',
  timelineCodeChip: 'Code',
  timelineMathChip: 'Math',
  timelineTableChip: 'Table',
  timelineMutedChip: 'Muted',
  islandTitle: 'Radar',
  islandStreaming: 'Thinking {sec}s',
  islandDone: 'Done {sec}s',
  islandIdle: 'Idle',
  islandBroadcastBtn: 'Broadcast',
  islandNotifyBtn: 'Alerts',
  islandNoTabs: 'Only current tab active',
  broadcastTitle: 'Broadcast Prompt to Open AI Tabs',
  broadcastPlaceholder: 'Enter one prompt to dispatch across open AI tabs...',
  broadcastTargetsLabel: 'Target open tabs:',
  broadcastAutoSubmitLabel: 'Attempt auto-submit after filling (unchecked = fill only)',
  broadcastSendBtn: 'Dispatch Prompt',
  broadcastSentToast: 'Dispatched prompt to {count} AI tab(s)',
  broadcastNoTargetToast: 'Enter a prompt and select at least one open AI tab',
  pinSelectionBtn: 'Pin Snippet',
  pinboardTitle: 'Pinboard · Idea Backpack',
  pinboardEmpty: 'Highlight any text in a chat to click "Pin Snippet", or pin a turn from the right-edge Metro Timeline.',
  pinboardExportMdBtn: 'Combine to Markdown',
  pinboardInsertAllBtn: 'Feed All to Current AI',
  pinboardClearBtn: 'Clear Pins',
  pinAddedToast: 'Saved to Pinboard',
  verifierTitle: 'Reality Check · Package & Repo Verifier',
  verifierPrivacyNote: 'Privacy: Only extracted public package names and GitHub owner/repo pairs are checked against official read-only endpoints when you click Verify. No chat text is ever sent.',
  verifierRunOnlineBtn: 'Verify Packages & Repos Online',
  verifierScanning: 'Checking official registries...',
  verifierEmpty: 'No npm/PyPI packages, GitHub repos, or suspicious URLs detected yet.',
  verifierCopyReportBtn: 'Copy Hallucination Challenge',
  verifierCountLabel: 'Detected {count} candidate packages/repos/links (offline audit ready)',
  toastHandoffSaved: 'Packaged {count} messages from {platform}. Switch tabs to resume.',
  toastHandoffSavedRedacted: 'Packaged {count} msgs from {platform} ({redacted} sensitive items redacted)',
  toastForkSaved: 'Forked up to turn #{turn} ({count} active messages packaged)',
  toastNoMessages: 'No conversation messages detected on this page yet.',
  toastNoInput: 'Input box not found; copied to clipboard instead.',
  toastInserted: 'Inserted into chat input',
  toastExportedMd: 'Downloaded Markdown file',
  toastExportedMdRedacted: 'Downloaded Markdown ({redacted} sensitive items redacted)',
  toastCopied: 'Copied to clipboard',
  toastTemplateSaved: 'Template saved',
  toastTemplateDeleted: 'Template deleted',
  toastImportedCount: 'Imported {count} templates',
  toastImportEmpty: 'No valid templates found in input',
  toastBuiltinsRestored: 'Built-in templates restored',
  toastPrivacyCleared: 'Cleared local cached data',
  popupStatusTitle: 'Pending Cross-Site Handoff',
  popupNoHandoff: 'No pending handoff. Click "Handoff" or fork from the Metro Timeline inside ChatGPT, Gemini, Claude, or DeepSeek.',
  popupOpenSites: 'Supported AI Platforms',
  popupTemplateCount: 'Saved templates: {count}',
};

export function detectDefaultLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

export function getMessages(locale: Locale): I18nMessages {
  return locale === 'zh' ? ZH : EN;
}

export function formatMsg(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = vars[key];
    return val === undefined ? `{${key}}` : String(val);
  });
}
