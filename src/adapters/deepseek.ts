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
  'textarea#chat-input',
  'textarea[placeholder*="DeepSeek" i]',
  'textarea[placeholder*="发送消息" i]',
  'main textarea',
  'textarea',
];

export const deepseekAdapter: SiteAdapter = {
  id: 'deepseek',

  matches(hostname: string): boolean {
    return hostname === 'chat.deepseek.com';
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

    // Primary strategy: .ds-message containers (assistant messages contain .ds-markdown)
    const dsMessages = Array.from(document.querySelectorAll<HTMLElement>('.ds-message'));
    if (dsMessages.length > 0) {
      for (const msg of dsMessages) {
        const mdBody = msg.querySelector<HTMLElement>('.ds-markdown');
        const thinkBody = msg.querySelector<HTMLElement>('.ds-think-content');
        if (mdBody) {
          const content = domElementToMarkdown(mdBody);
          const thinking = thinkBody ? domElementToMarkdown(thinkBody) : '';
          if (content) {
            results.push(thinking ? { role: 'assistant', content, thinking } : { role: 'assistant', content });
          }
        } else {
          const content = domElementToMarkdown(msg);
          if (content) results.push({ role: 'user', content });
        }
      }
      if (results.length > 0) return results;
    }

    // Fallback: look for .ds-markdown blocks paired with preceding user prompt siblings
    const assistantMarkdowns = Array.from(document.querySelectorAll<HTMLElement>('.ds-markdown'));
    for (const mdNode of assistantMarkdowns) {
      const turnWrap = mdNode.closest('[data-virtual-index], [class*="message"]') ?? mdNode.parentElement;
      const prev = turnWrap?.previousElementSibling;
      if (prev && !prev.querySelector('.ds-markdown')) {
        const userText = domElementToMarkdown(prev);
        if (userText) results.push({ role: 'user', content: userText });
      }
      const assistantText = domElementToMarkdown(mdNode);
      if (assistantText) results.push({ role: 'assistant', content: assistantText });
    }

    return results;
  },

  getConversationTitle(): string {
    return cleanDocumentTitle(document.title, ['- DeepSeek', '| DeepSeek']);
  },
};
