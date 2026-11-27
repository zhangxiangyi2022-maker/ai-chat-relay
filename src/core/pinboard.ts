import { PLATFORM_NAMES } from '../i18n/index.js';
import type { Locale, PinnedSnippet, PlatformId } from '../types/index.js';
import { computeUrlFingerprint, redactSensitiveText } from './privacy.js';

export interface CreatePinInput {
  sourcePlatform: PlatformId;
  sourceTitle: string;
  sourceUrl: string;
  text: string;
  kind: 'selection' | 'turn';
  redactSecrets: boolean;
  redactPii: boolean;
}

export function createPinnedSnippet(input: CreatePinInput): PinnedSnippet | null {
  const trimmed = input.text.trim();
  if (!trimmed) return null;
  const redactOpts = {
    redactSecrets: input.redactSecrets,
    redactPii: input.redactPii,
  };
  const redactedText = redactSensitiveText(trimmed, redactOpts).text;
  const redactedTitle = redactSensitiveText(
    input.sourceTitle.trim() || PLATFORM_NAMES[input.sourcePlatform],
    redactOpts
  ).text;

  return {
    id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourcePlatform: input.sourcePlatform,
    sourceTitle: redactedTitle,
    sourceFingerprint: computeUrlFingerprint(input.sourceUrl),
    text: redactedText,
    kind: input.kind,
    createdAt: Date.now(),
  };
}

export function formatPinboardMarkdown(pins: PinnedSnippet[], locale: Locale): string {
  const heading = locale === 'zh' ? '# ChatRelay 灵感背包笔记' : '# ChatRelay Pinned Notes';
  const sections = pins.map((pin, i) => {
    const platform = PLATFORM_NAMES[pin.sourcePlatform];
    return `## ${i + 1}. [${platform}] ${pin.sourceTitle}\n\n${pin.text}`;
  });
  return `${heading}\n\n${sections.join('\n\n---\n\n')}\n`;
}

export function formatPinboardPrompt(pins: PinnedSnippet[], locale: Locale): string {
  const body = pins
    .map((p, i) => `[Snippet ${i + 1} · ${PLATFORM_NAMES[p.sourcePlatform]}]\n${p.text}`)
    .join('\n\n---\n\n');

  if (locale === 'zh') {
    return `以下是我在不同模型回答中钉选保存的关键灵感与代码片段，请结合它们帮我继续处理：\n\n${body}\n\n请基于以上片段给出下一步建议：`;
  }
  return `Here are key snippets I pinned from earlier AI responses. Please synthesize and continue from them:\n\n${body}\n\nNext steps:`;
}
