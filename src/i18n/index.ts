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
  privacySectionTitle: string;
  redactSecretsLabel: string;
  redactPiiLabel: string;
  autoClearAfterPasteLabel: string;
  handoffTtlLabel: string;
  includeSourceUrlLabel: string;
  autoCopyLabel: string;
  clearHandoffNowBtn: string;
  clearAllDataBtn: string;
  toastHandoffSaved: string;
  toastHandoffSavedRedacted: string;
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
  tagline: '跨平台 AI 提示词 & 对话接力',
  privacyBadge: '纯本地运行 · 零上传 · 敏感信息自动脱敏',
  langSwitch: 'EN',
  promptsBtn: '指令 /',
  handoffBtn: '带走接力',
  exportBtn: '导出 MD',
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
  handoffBannerTitle: '发现来自 {platform} 的待接力上下文',
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
  privacySectionTitle: '私人隐私保护',
  redactSecretsLabel: '自动打码密钥/Token/JWT/私钥/数据库密码',
  redactPiiLabel: '自动打码个人邮箱/手机号/身份证/银行卡号',
  autoClearAfterPasteLabel: '填入目标对话框后立即销毁接力缓存（阅后即焚）',
  handoffTtlLabel: '接力缓存自动过期时间（分钟，0 为不自动过期）',
  includeSourceUrlLabel: '导出 Markdown 时写入来源链接（默认关闭防泄露）',
  autoCopyLabel: '带走接力/导出时自动写入系统剪贴板（默认关闭）',
  clearHandoffNowBtn: '清除待接力缓存',
  clearAllDataBtn: '一键清空全部本地数据',
  toastHandoffSaved: '已打包 {platform} 的 {count} 条消息，切到其他 AI 页面即可接力',
  toastHandoffSavedRedacted: '已打包 {platform} 的 {count} 条消息（已自动脱敏 {redacted} 处敏感信息）',
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
  popupNoHandoff: '暂无待接力对话。在 ChatGPT / Gemini / Claude / DeepSeek 页面点击「带走接力」即可跨站流转。',
  popupOpenSites: '快速打开支持平台',
  popupTemplateCount: '已保存模板：{count} 条',
};

const EN: I18nMessages = {
  appName: 'ChatRelay',
  tagline: 'Cross-AI Prompt & Context Relay',
  privacyBadge: '100% Local · Zero Telemetry · Auto-Redaction Active',
  langSwitch: '中文',
  promptsBtn: 'Prompts /',
  handoffBtn: 'Handoff',
  exportBtn: 'Export MD',
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
  privacySectionTitle: 'Privacy & Secret Protection',
  redactSecretsLabel: 'Auto-redact API keys, tokens, JWTs, private keys & DB passwords',
  redactPiiLabel: 'Auto-redact personal emails, phone numbers, IDs & card numbers',
  autoClearAfterPasteLabel: 'Auto-purge handoff cache right after pasting (burn-after-read)',
  handoffTtlLabel: 'Handoff auto-expiration in minutes (0 = never expire)',
  includeSourceUrlLabel: 'Include source URL in Markdown export (off by default)',
  autoCopyLabel: 'Auto-copy to OS clipboard on Handoff/Export (off by default)',
  clearHandoffNowBtn: 'Purge Handoff Cache',
  clearAllDataBtn: 'Wipe All Local Data',
  toastHandoffSaved: 'Packaged {count} messages from {platform}. Switch tabs to resume.',
  toastHandoffSavedRedacted: 'Packaged {count} msgs from {platform} ({redacted} sensitive items redacted)',
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
  popupNoHandoff: 'No pending handoff. Click "Handoff" inside ChatGPT, Gemini, Claude, or DeepSeek.',
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
