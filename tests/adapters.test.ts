import { afterEach, describe, expect, it } from 'vitest';
import { resolveSiteAdapter } from '../src/adapters/index.js';
import { chatgptAdapter } from '../src/adapters/chatgpt.js';
import { claudeAdapter } from '../src/adapters/claude.js';
import { deepseekAdapter } from '../src/adapters/deepseek.js';
import { geminiAdapter } from '../src/adapters/gemini.js';

afterEach(() => {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
});

describe('site adapters', () => {
  it('resolves supported hostnames accurately', () => {
    expect(resolveSiteAdapter('chatgpt.com')?.id).toBe('chatgpt');
    expect(resolveSiteAdapter('gemini.google.com')?.id).toBe('gemini');
    expect(resolveSiteAdapter('claude.ai')?.id).toBe('claude');
    expect(resolveSiteAdapter('chat.deepseek.com')?.id).toBe('deepseek');
    expect(resolveSiteAdapter('example.com')).toBeNull();
  });

  it('extracts ChatGPT messages and replaces /query in ProseMirror', () => {
    document.body.innerHTML = `
      <div id="prompt-textarea" contenteditable="true"><p>/deb</p></div>
      <div data-message-author-role="user"><div class="whitespace-pre-wrap">Hello GPT</div></div>
      <div data-message-author-role="assistant"><div class="markdown"><p>Hi! Use <code>npm test</code>.</p></div></div>
    `;

    const msgs = chatgptAdapter.extractMessages();
    expect(msgs).toEqual([
      { role: 'user', content: 'Hello GPT' },
      { role: 'assistant', content: 'Hi! Use `npm test`.' },
    ]);

    const ok = chatgptAdapter.insertText('Diagnose this error', { replaceTrailingSlashQuery: true });
    expect(ok).toBe(true);
    expect(chatgptAdapter.getInputText()).toContain('Diagnose this error');
    expect(chatgptAdapter.getInputText()).not.toContain('/deb');
  });

  it('extracts Gemini messages including thoughts', () => {
    document.body.innerHTML = `
      <rich-textarea><div class="ql-editor" contenteditable="true"></div></rich-textarea>
      <user-query><div class="query-text">Explain Rust lifetimes</div></user-query>
      <model-response>
        <model-thoughts>Checking borrow rules</model-thoughts>
        <message-content><p>Lifetimes prevent dangling references.</p></message-content>
      </model-response>
    `;

    const msgs = geminiAdapter.extractMessages();
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toEqual({ role: 'user', content: 'Explain Rust lifetimes' });
    expect(msgs[1]?.thinking).toBe('Checking borrow rules');
    expect(msgs[1]?.content).toContain('Lifetimes prevent dangling references.');
    expect(geminiAdapter.insertText('Continue')).toBe(true);
  });

  it('extracts Claude messages without duplicate nested nodes', () => {
    document.body.innerHTML = `
      <div class="ProseMirror" contenteditable="true"></div>
      <div data-testid="user-message"><p>Review my PR</p></div>
      <div data-testid="assistant-message-1"><div class="font-claude-response"><p>Looks clean!</p></div></div>
    `;

    const msgs = claudeAdapter.extractMessages();
    expect(msgs).toEqual([
      { role: 'user', content: 'Review my PR' },
      { role: 'assistant', content: 'Looks clean!' },
    ]);
  });

  it('extracts DeepSeek messages and inserts into controlled textarea', () => {
    document.body.innerHTML = `
      <textarea id="chat-input"></textarea>
      <div class="ds-message">How to optimize SQL?</div>
      <div class="ds-message">
        <div class="ds-think-content">Consider indexes.</div>
        <div class="ds-markdown"><p>Add a composite index.</p></div>
      </div>
    `;

    const msgs = deepseekAdapter.extractMessages();
    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.role).toBe('user');
    expect(msgs[1]?.thinking).toBe('Consider indexes.');
    expect(msgs[1]?.content).toContain('composite index');

    expect(deepseekAdapter.insertText('SELECT 1;')).toBe(true);
    const input = document.getElementById('chat-input') as HTMLTextAreaElement;
    expect(input.value).toBe('SELECT 1;');
  });
});
