import { domElementToMarkdown } from '../core/domToMarkdown.js';
import type { ChatMessage } from '../types/index.js';
import {
  cleanDocumentTitle,
  insertIntoInputElement,
  isElementVisible,
  queryFirst,
  readInputText,
} from './shared.js';
import type { SiteAdapter } from './types.js';

const INPUT_SELECTORS = [
  'rich-textarea .ql-editor[contenteditable="true"]',
  'div.ql-editor[contenteditable="true"]',
  'rich-textarea [contenteditable="true"]',
  'textarea[aria-label*="Gemini" i]',
  '[contenteditable="true"][role="textbox"]',
];

export const geminiAdapter: SiteAdapter = {
  id: 'gemini',

  matches(hostname: string): boolean {
    return hostname === 'gemini.google.com';
  },

  findInput(): HTMLElement | null {
    const found = queryFirst(INPUT_SELECTORS);
    return found && isElementVisible(found) ? found : null;
  },

  getInputText(inputEl?: HTMLElement | null): string {
    return readInputText(inputEl ?? this.findInput());
  },

  insertText(text: string, options?: { replaceTrailingSlashQuery?: boolean }): boolean {
    const input = this.findInput();
    if (!input) return false;
    return insertIntoInputElement(input, text, options);
  },

  extractMessages(): ChatMessage[] {
    const results: ChatMessage[] = [];
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>('user-query, model-response, [data-test-id="user-query"], [data-test-id="model-response"]')
    );

    if (blocks.length > 0) {
      for (const block of blocks) {
        const tag = block.tagName.toLowerCase();
        const isUser = tag === 'user-query' || block.getAttribute('data-test-id') === 'user-query';
        const contentRoot = isUser
          ? block.querySelector<HTMLElement>('.query-text, .user-query-bubble-with-background, user-query-content') ?? block
          : block.querySelector<HTMLElement>('message-content, .model-response-text, .markdown') ?? block;
        const thinkingNode = !isUser ? block.querySelector<HTMLElement>('.thoughts-content, model-thoughts') : null;
        const content = domElementToMarkdown(contentRoot);
        if (!content) continue;
        const thinking = thinkingNode ? domElementToMarkdown(thinkingNode) : '';
        results.push(thinking ? { role: isUser ? 'user' : 'assistant', content, thinking } : { role: isUser ? 'user' : 'assistant', content });
      }
      return results;
    }

    // Fallback: conversation container pairs
    const containers = Array.from(document.querySelectorAll<HTMLElement>('.conversation-container'));
    for (const box of containers) {
      const u = box.querySelector<HTMLElement>('.query-text, user-query-content');
      if (u) {
        const md = domElementToMarkdown(u);
        if (md) results.push({ role: 'user', content: md });
      }
      const m = box.querySelector<HTMLElement>('message-content, .markdown');
      if (m) {
        const md = domElementToMarkdown(m);
        if (md) results.push({ role: 'assistant', content: md });
      }
    }
    return results;
  },

  getConversationTitle(): string {
    const activeNav = document.querySelector<HTMLElement>('.conversation.selected .conversation-title');
    if (activeNav?.textContent?.trim()) return activeNav.textContent.trim();
    return cleanDocumentTitle(document.title, ['- Google Gemini', 'Google Gemini', '- Gemini']);
  },
};
