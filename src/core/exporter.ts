import { PLATFORM_NAMES } from '../i18n/index.js';
import type { ChatMessage, Locale, PlatformId } from '../types/index.js';
import { redactSensitiveText, sanitizeUrlForDisplay } from './privacy.js';

export interface ExportConversationInput {
  platform: PlatformId;
  title: string;
  url: string;
  messages: ChatMessage[];
  locale: Locale;
  includeThinking: boolean;
  includeSourceUrl?: boolean;
  redactSecrets?: boolean;
  redactPii?: boolean;
  exportedAt?: Date;
}

export interface ExportConversationResult {
  markdown: string;
  redactedCount: number;
}

export function sanitizeFilename(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned.slice(0, 80) || 'conversation';
}

export function formatConversationMarkdownWithStats(
  input: ExportConversationInput
): ExportConversationResult {
  const platformName = PLATFORM_NAMES[input.platform];
  const dateStr = (input.exportedAt ?? new Date()).toISOString().replace('T', ' ').slice(0, 19);
  const redactOpts = {
    redactSecrets: input.redactSecrets ?? true,
    redactPii: input.redactPii ?? true,
  };

  let redactedCount = 0;
  const rawTitle = input.title.trim() || `${platformName} Conversation`;
  const titleRedacted = redactSensitiveText(rawTitle, redactOpts);
  redactedCount += titleRedacted.redactedCount;
  const title = titleRedacted.text;

  const metaLines =
    input.locale === 'zh'
      ? [
          `# ${title}`,
          '',
          `- **来源平台**：${platformName}`,
          `- **导出时间**：${dateStr}`,
          ...(input.includeSourceUrl ? [`- **原链接**：${sanitizeUrlForDisplay(input.url)}`] : []),
          `- **消息总数**：${input.messages.length}`,
          '',
          '---',
          '',
        ]
      : [
          `# ${title}`,
          '',
          `- **Platform**: ${platformName}`,
          `- **Exported**: ${dateStr}`,
          ...(input.includeSourceUrl ? [`- **Source URL**: ${sanitizeUrlForDisplay(input.url)}`] : []),
          `- **Messages**: ${input.messages.length}`,
          '',
          '---',
          '',
        ];

  const header = metaLines.join('\n');

  const body = input.messages
    .map((msg) => {
      const heading =
        msg.role === 'user'
          ? input.locale === 'zh'
            ? '## 用户'
            : '## User'
          : `## ${platformName}`;

      const parts = [heading, ''];
      if (input.includeThinking && msg.thinking?.trim()) {
        const label = input.locale === 'zh' ? '深度思考过程' : 'Thinking Process';
        const thinkRedacted = redactSensitiveText(msg.thinking.trim(), redactOpts);
        redactedCount += thinkRedacted.redactedCount;
        parts.push('<details>', `<summary>${label}</summary>`, '', thinkRedacted.text, '', '</details>', '');
      }
      const contentRedacted = redactSensitiveText(msg.content.trim(), redactOpts);
      redactedCount += contentRedacted.redactedCount;
      parts.push(contentRedacted.text);
      return parts.join('\n');
    })
    .join('\n\n---\n\n');

  return {
    markdown: `${header}${body}\n`,
    redactedCount,
  };
}

export function formatConversationMarkdown(input: ExportConversationInput): string {
  return formatConversationMarkdownWithStats(input).markdown;
}

export function triggerTextDownload(filename: string, content: string, mimeType = 'text/markdown;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}
