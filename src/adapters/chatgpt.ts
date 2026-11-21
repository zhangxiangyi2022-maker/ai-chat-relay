import { domElementToMarkdown } from '../core/domToMarkdown.js';
import type { ChatMessage, MessageRole } from '../types/index.js';
import {
  cleanDocumentTitle,
  insertIntoInputElement,
  isElementVisible,
  queryFirst,
  readInputText,
} from './shared.js';
import type { SiteAdapter } from './types.js';

const INPUT_SELECTORS = [
  '#prompt-textarea',
  'div.ProseMirror[contenteditable="true"]',
  'textarea[data-id="root"]',
  'form textarea',
];

export const chatgptAdapter: SiteAdapter = {
  id: 'chatgpt',

  matches(hostname: string): boolean {
    return hostname === 'chatgpt.com' || hostname.endsWith('.chatgpt.com') || hostname === 'chat.openai.com';
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
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-message-author-role]'));

    if (nodes.length > 0) {
      for (const node of nodes) {
        const rawRole = node.getAttribute('data-message-author-role');
        if (rawRole !== 'user' && rawRole !== 'assistant') continue;
        const role: MessageRole = rawRole;
        const contentRoot =
          node.querySelector<HTMLElement>('.markdown, .whitespace-pre-wrap') ?? node;
        const md = domElementToMarkdown(contentRoot);
        if (md) results.push({ role, content: md });
      }
      return results;
    }

    // Fallback: article conversation turns
    const turns = Array.from(document.querySelectorAll<HTMLElement>('article[data-testid^="conversation-turn-"]'));
    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      if (!turn) continue;
      const md = domElementToMarkdown(turn);
      if (!md) continue;
      results.push({ role: i % 2 === 0 ? 'user' : 'assistant', content: md });
    }
    return results;
  },

  getConversationTitle(): string {
    return cleanDocumentTitle(document.title, ['| ChatGPT', '- ChatGPT']);
  },
};
