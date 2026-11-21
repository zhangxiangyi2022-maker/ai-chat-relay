import { describe, expect, it } from 'vitest';
import { formatConversationMarkdown, sanitizeFilename } from '../src/core/exporter.js';
import { buildHandoffPayload } from '../src/core/handoff.js';
import type { ChatMessage } from '../src/types/index.js';

const SAMPLE_MSGS: ChatMessage[] = [
  { role: 'user', content: 'Initial goal: build a Chrome extension.' },
  { role: 'assistant', content: 'Let us start with manifest v3.' },
  { role: 'user', content: 'Step 2 question' },
  { role: 'assistant', content: 'Step 2 answer' },
  { role: 'user', content: 'Final blocker: Trusted Types on Gemini' },
  { role: 'assistant', content: 'Avoid innerHTML completely.', thinking: 'Checked DOM CSP rules.' },
];

describe('handoff and exporter', () => {
  it('keeps initial user message plus tail turns in compact mode', () => {
    const payload = buildHandoffPayload({
      sourcePlatform: 'gemini',
      sourceTitle: 'Extension Architecture',
      sourceUrl: 'https://gemini.google.com/app/123',
      messages: SAMPLE_MSGS,
      mode: 'compact',
      maxCompactTurns: 3,
      locale: 'zh',
    });

    expect(payload).not.toBeNull();
    expect(payload?.messageCount).toBe(6);
    expect(payload?.includedCount).toBe(4);
    expect(payload?.promptText).toContain('Initial goal: build a Chrome extension.');
    expect(payload?.promptText).toContain('Final blocker: Trusted Types on Gemini');
    expect(payload?.promptText).toContain('中间省略了 2 条较早轮次');
  });

  it('exports Markdown with optional thinking block and safe filename', () => {
    expect(sanitizeFilename('Bug: Fix / Export? <v1>')).toBe('Bug-Fix-Export-v1');
    const md = formatConversationMarkdown({
      platform: 'deepseek',
      title: 'DeepSeek Debug',
      url: 'https://chat.deepseek.com/a/1',
      messages: SAMPLE_MSGS.slice(-2),
      locale: 'en',
      includeThinking: true,
      exportedAt: new Date('2026-11-21T12:00:00Z'),
    });

    expect(md).toContain('# DeepSeek Debug');
    expect(md).toContain('<summary>Thinking Process</summary>');
    expect(md).toContain('Checked DOM CSP rules.');
  });
});
