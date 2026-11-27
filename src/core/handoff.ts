import { PLATFORM_NAMES } from '../i18n/index.js';
import type { ChatMessage, HandoffMode, HandoffPayload, Locale, PlatformId } from '../types/index.js';
import { computeUrlFingerprint, redactSensitiveText } from './privacy.js';

export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjkCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x4e00 && code <= 0x9fff) {
      cjkCount++;
    }
  }
  const nonCjk = text.length - cjkCount;
  return Math.max(1, Math.round(cjkCount / 1.5 + nonCjk / 3.8));
}

function truncateMiddle(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const head = Math.floor(maxChars * 0.6);
  const tail = Math.floor(maxChars * 0.3);
  return `${text.slice(0, head)}\n\n...[truncated ${text.length - head - tail} chars]...\n\n${text.slice(text.length - tail)}`;
}

export interface BuildHandoffInput {
  sourcePlatform: PlatformId;
  sourceTitle: string;
  sourceUrl: string;
  messages: ChatMessage[];
  mode: HandoffMode;
  maxCompactTurns: number;
  locale: Locale;
  isFork?: boolean;
  redactSecrets?: boolean;
  redactPii?: boolean;
  ttlMinutes?: number;
  now?: number;
}

export function buildHandoffPayload(input: BuildHandoffInput): HandoffPayload | null {
  const nonEmpty = input.messages.filter((m) => m.content.trim().length > 0);
  if (nonEmpty.length === 0) return null;

  const limit = Math.max(2, input.maxCompactTurns);
  let selected: ChatMessage[];
  let omittedCount = 0;

  if (input.mode === 'compact' && nonEmpty.length > limit + 1) {
    const firstUser = nonEmpty.find((m) => m.role === 'user');
    const tail = nonEmpty.slice(-limit);
    const hasFirstInTail = firstUser ? tail.includes(firstUser) : true;
    selected = firstUser && !hasFirstInTail
      ? [{ ...firstUser, content: truncateMiddle(firstUser.content, 1200) }, ...tail]
      : tail;
    omittedCount = Math.max(0, nonEmpty.length - selected.length);
  } else {
    selected = nonEmpty;
  }

  const redactOpts = {
    redactSecrets: input.redactSecrets ?? true,
    redactPii: input.redactPii ?? true,
  };

  let totalRedacted = 0;
  const platformLabel = PLATFORM_NAMES[input.sourcePlatform];
  const rawTitle = input.sourceTitle.trim() || `${platformLabel} Chat`;
  const titleRedaction = redactSensitiveText(rawTitle, redactOpts);
  totalRedacted += titleRedaction.redactedCount;
  const title = titleRedaction.text;

  const transcriptLines: string[] = [];

  for (let i = 0; i < selected.length; i++) {
    const msg = selected[i];
    if (!msg) continue;
    const roleLabel =
      input.locale === 'zh'
        ? msg.role === 'user'
          ? '用户'
          : platformLabel
        : msg.role === 'user'
          ? 'User'
          : platformLabel;
    const rawContent = input.mode === 'compact' ? truncateMiddle(msg.content.trim(), 3200) : msg.content.trim();
    const redacted = redactSensitiveText(rawContent, redactOpts);
    totalRedacted += redacted.redactedCount;

    transcriptLines.push(`### [${roleLabel}]\n${redacted.text}`);
    if (i === 0 && omittedCount > 0) {
      transcriptLines.push(
        input.locale === 'zh'
          ? `> _[注：中间省略了 ${omittedCount} 条较早轮次以控制上下文长度]_`
          : `> _[Note: ${omittedCount} intermediate messages omitted in Compact handoff mode]_`
      );
    }
  }

  const promptText =
    input.locale === 'zh'
      ? [
          `【跨平台对话接力 · 来自 ${platformLabel}】`,
          `- 原对话标题：${title}`,
          `- 交接范围：共 ${nonEmpty.length} 条消息（本次附带 ${selected.length} 条）`,
          '',
          '以下是之前讨论的上下文记录，请你直接从当前进度接着协助我处理，无需重复解释已知内容，除非发现前文方案有误：',
          '',
          ...transcriptLines,
          '',
          '---',
          '请确认已理解上述上下文，并针对最后一步问题继续给出解答或下一步操作：',
        ].join('\n')
      : [
          `[Cross-AI Context Handoff · From ${platformLabel}]`,
          `- Original Title: ${title}`,
          `- Included Turns: ${selected.length} of ${nonEmpty.length} messages`,
          '',
          'Please seamlessly continue assisting me from the conversation context below. Do not repeat prior explanations unless correcting an error:',
          '',
          ...transcriptLines,
          '',
          '---',
          'Confirm you have the context and continue from the latest question or blocker:',
        ].join('\n');

  const createdAt = input.now ?? Date.now();
  const ttlMinutes = input.ttlMinutes ?? 30;
  const expiresAt = ttlMinutes > 0 ? createdAt + ttlMinutes * 60_000 : 0;

  return {
    id: `ho-${createdAt}-${Math.random().toString(36).slice(2, 7)}`,
    sourcePlatform: input.sourcePlatform,
    sourceTitle: title,
    sourceFingerprint: computeUrlFingerprint(input.sourceUrl),
    messageCount: nonEmpty.length,
    includedCount: selected.length,
    redactedCount: totalRedacted,
    isFork: input.isFork,
    createdAt,
    expiresAt,
    mode: input.mode,
    promptText,
    estimatedTokens: estimateTokens(promptText),
  };
}
