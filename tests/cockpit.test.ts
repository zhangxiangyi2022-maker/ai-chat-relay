import { afterEach, describe, expect, it } from 'vitest';
import { chatgptAdapter } from '../src/adapters/chatgpt.js';
import { deepseekAdapter } from '../src/adapters/deepseek.js';
import { createPinnedSnippet, formatPinboardMarkdown } from '../src/core/pinboard.js';
import { buildTimelineNodes, selectMessagesForHandoff } from '../src/core/timeline.js';
import {
  extractVerifyCandidates,
  formatHallucinationFeedbackPrompt,
  isAllowedVerifyUrl,
  verifyCandidatesOnline,
} from '../src/core/verifier.js';
import { createDefaultSettings } from '../src/storage/bridge.js';
import { MemoryStorageBridge } from '../src/storage/memoryBridge.js';
import type { BroadcastCommand } from '../src/types/index.js';
import { mountChatRelay } from '../src/ui/app.js';

let unmount: (() => void) | null = null;

afterEach(() => {
  unmount?.();
  unmount = null;
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
});

describe('ChatRelay v1.0 Cockpit features', () => {
  it('builds Metro Timeline nodes and forks cleanly excluding muted turns', () => {
    document.body.innerHTML = `
      <div id="prompt-textarea" contenteditable="true"></div>
      <div data-message-author-role="user"><div class="whitespace-pre-wrap">Step 1 goal</div></div>
      <div data-message-author-role="assistant"><div class="markdown"><pre><code class="language-ts">const x = 1;</code></pre></div></div>
      <div data-message-author-role="user"><div class="whitespace-pre-wrap">Wrong tangent</div></div>
      <div data-message-author-role="assistant"><div class="markdown"><p>Ignore this wrong branch.</p></div></div>
      <div data-message-author-role="user"><div class="whitespace-pre-wrap">Later round</div></div>
    `;

    const extracted = chatgptAdapter.extractMessageNodes();
    expect(extracted).toHaveLength(5);

    const muted = new Set([2]);
    const nodes = buildTimelineNodes(extracted, muted);
    expect(nodes[1]?.hasCode).toBe(true);
    expect(nodes[2]?.muted).toBe(true);

    const forked = selectMessagesForHandoff(extracted, { upToIndex: 3, mutedIndices: muted });
    expect(forked).toHaveLength(3);
    expect(forked.map((m) => m.content)).not.toContain('Wrong tangent');
  });

  it('redacts secrets inside Pinboard snippets and formats combined Markdown', () => {
    const pin = createPinnedSnippet({
      sourcePlatform: 'deepseek',
      sourceTitle: 'Auth setup sk-proj-1234567890abcdef123456',
      sourceUrl: 'https://chat.deepseek.com/a/secret-id',
      text: 'Contact me at alice@private.cn with token ghp_12345678901234567890123456',
      kind: 'selection',
      redactSecrets: true,
      redactPii: true,
    });

    expect(pin).not.toBeNull();
    expect(pin?.text).toContain('[REDACTED_EMAIL]');
    expect(pin?.text).toContain('[REDACTED_GITHUB_TOKEN]');
    expect(JSON.stringify(pin)).not.toContain('secret-id');

    const md = formatPinboardMarkdown([pin!], 'zh');
    expect(md).toContain('# ChatRelay 灵感背包笔记');
    expect(md).toContain('[DeepSeek]');
  });

  it('extracts npm/pypi/github candidates, enforces allowlist, and verifies against registries', async () => {
    const { candidates, offlineWarnings } = extractVerifyCandidates([
      {
        role: 'assistant',
        content: [
          'Install `npm i zod fake-hallucinated-pkg` and `pip install fastapi`.',
          'Check https://github.com/zhangxiangyi2022-maker/ai-chat-relay or https://example.com/fake-docs',
        ].join('\n'),
      },
    ]);

    expect(candidates.map((c) => `${c.kind}:${c.target}`)).toEqual([
      'npm:zod',
      'npm:fake-hallucinated-pkg',
      'pypi:fastapi',
      'github:zhangxiangyi2022-maker/ai-chat-relay',
    ]);
    expect(offlineWarnings).toHaveLength(1);
    expect(offlineWarnings[0]?.status).toBe('suspicious');

    expect(isAllowedVerifyUrl('https://registry.npmjs.org/zod')).toBe(true);
    expect(isAllowedVerifyUrl('https://evil.example.com/steal')).toBe(false);

    const results = await verifyCandidatesOnline(candidates, async (url) => {
      if (url.includes('registry.npmjs.org/zod')) {
        return { ok: true, status: 200, body: JSON.stringify({ 'dist-tags': { latest: '3.24.1' } }) };
      }
      if (url.includes('fake-hallucinated-pkg')) {
        return { ok: false, status: 404, body: 'Not Found' };
      }
      if (url.includes('pypi.org/pypi/fastapi/json')) {
        return { ok: true, status: 200, body: JSON.stringify({ info: { version: '0.115.0' } }) };
      }
      if (url.includes('api.github.com/repos/zhangxiangyi2022-maker/ai-chat-relay')) {
        return { ok: true, status: 200, body: JSON.stringify({ stargazers_count: 42 }) };
      }
      return { ok: false, status: 500, body: '' };
    });

    expect(results.find((r) => r.target === 'zod')?.status).toBe('valid');
    expect(results.find((r) => r.target === 'fake-hallucinated-pkg')?.status).toBe('not_found');
    expect(results.find((r) => r.target === 'fastapi')?.version).toBe('0.115.0');
    expect(results.find((r) => r.target === 'zhangxiangyi2022-maker/ai-chat-relay')?.stars).toBe(42);

    const report = formatHallucinationFeedbackPrompt([...offlineWarnings, ...results], 'en');
    expect(report).toContain('fake-hallucinated-pkg');
    expect(report).toContain('https://example.com/fake-docs');
  });

  it('renders Dynamic Island, Metro Timeline, detects streaming state, and receives Broadcast prompt', async () => {
    const bridge = new MemoryStorageBridge();
    await bridge.set('settings', {
      ...createDefaultSettings(),
      locale: 'zh',
    });

    document.body.innerHTML = `
      <textarea id="chat-input"></textarea>
      <div class="ds-loading">thinking...</div>
      <div class="ds-message">Explain event loop</div>
      <div class="ds-message"><div class="ds-markdown"><p>Microtasks run before macrotasks.</p></div></div>
    `;

    expect(deepseekAdapter.isGenerating()).toBe(true);

    unmount = mountChatRelay({ adapter: deepseekAdapter, bridge });
    await new Promise((r) => setTimeout(r, 40));

    const host = document.getElementById('chat-relay-root');
    const shadow = host?.shadowRoot;
    expect(shadow?.querySelector('.cr-island')).not.toBeNull();
    expect(shadow?.querySelectorAll('.cr-tl-dot').length).toBe(2);

    const statuses = await bridge.get<Record<string, { tabId: string; state: string }>>('tab_statuses');
    const activeTabIds = Object.keys(statuses ?? {});
    expect(activeTabIds).toHaveLength(1);
    expect(statuses?.[activeTabIds[0]!]?.state).toBe('streaming');

    const cmd: BroadcastCommand = {
      id: 'bc-test-1',
      targetTabIds: activeTabIds,
      promptText: 'Summarize in 3 bullets',
      autoSubmit: false,
      createdAt: Date.now(),
      consumedBy: [],
    };
    await bridge.set('broadcast', cmd);
    await new Promise((r) => setTimeout(r, 30));

    expect(deepseekAdapter.getInputText()).toContain('Summarize in 3 bullets');
  });
});
