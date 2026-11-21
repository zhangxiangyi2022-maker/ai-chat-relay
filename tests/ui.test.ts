import { afterEach, describe, expect, it } from 'vitest';
import { chatgptAdapter } from '../src/adapters/chatgpt.js';
import { geminiAdapter } from '../src/adapters/gemini.js';
import { createDefaultSettings } from '../src/storage/bridge.js';
import { MemoryStorageBridge } from '../src/storage/memoryBridge.js';
import { mountChatRelay } from '../src/ui/app.js';

let unmount: (() => void) | null = null;

afterEach(() => {
  unmount?.();
  unmount = null;
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
});

describe('ChatRelay UI & cross-platform handoff integration', () => {
  it('mounts Shadow DOM dock, creates redacted handoff, pastes on target, and auto-clears cache', async () => {
    const bridge = new MemoryStorageBridge();
    await bridge.set('settings', {
      ...createDefaultSettings(),
      locale: 'zh',
    });

    // Simulate source page on Gemini with a secret key inside conversation
    document.body.innerHTML = `
      <rich-textarea><div class="ql-editor" contenteditable="true"></div></rich-textarea>
      <user-query><div class="query-text">My key is sk-live-secret1234567890abcdef</div></user-query>
      <model-response><message-content><p>Share a StorageBridge interface.</p></message-content></model-response>
    `;

    unmount = mountChatRelay({ adapter: geminiAdapter, bridge });
    await new Promise((r) => setTimeout(r, 20));

    const host = document.getElementById('chat-relay-root');
    expect(host?.shadowRoot).not.toBeNull();

    const buttons = Array.from(host!.shadowRoot!.querySelectorAll('button'));
    const handoffBtn = buttons.find((b) => b.textContent?.includes('带走接力'));
    expect(handoffBtn).toBeDefined();

    handoffBtn!.click();
    await new Promise((r) => setTimeout(r, 20));

    // Should not pollute clipboard by default
    expect(bridge.lastClipboard).toBe('');

    const stored = await bridge.get<{
      sourcePlatform: string;
      promptText: string;
      redactedCount: number;
    }>('handoff');
    expect(stored?.sourcePlatform).toBe('gemini');
    expect(stored?.redactedCount).toBe(1);
    expect(stored?.promptText).toContain('[REDACTED_API_KEY]');
    expect(stored?.promptText).not.toContain('secret1234567890abcdef');

    // Unmount and mount on target ChatGPT page at a different URL
    unmount();
    window.history.pushState({}, '', '/c/new-chat');
    document.body.innerHTML = `<div id="prompt-textarea" contenteditable="true"></div>`;

    unmount = mountChatRelay({ adapter: chatgptAdapter, bridge });
    await new Promise((r) => setTimeout(r, 20));

    const targetHost = document.getElementById('chat-relay-root');
    const banner = targetHost!.shadowRoot!.querySelector('.cr-handoff-banner');
    expect(banner?.textContent).toContain('Gemini');
    expect(banner?.textContent).toContain('已脱敏 1 处');

    const resumeBtn = Array.from(banner!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('接着聊')
    );
    expect(resumeBtn).toBeDefined();
    resumeBtn!.click();
    await new Promise((r) => setTimeout(r, 20));

    expect(chatgptAdapter.getInputText()).toContain('Share a StorageBridge interface.');
    // Burn-after-read: handoff cache should now be cleared
    expect(await bridge.get('handoff')).toBeNull();
  });
});
