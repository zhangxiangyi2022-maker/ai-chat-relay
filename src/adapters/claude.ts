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
  'div.ProseMirror[contenteditable="true"]',
  '[contenteditable="true"][data-testid="chat-input"]',
  'fieldset [contenteditable="true"]',
  '[contenteditable="true"][aria-label*="Claude" i]',
];

export const claudeAdapter: SiteAdapter = {
  id: 'claude',

  matches(hostname: string): boolean {
    return hostname === 'claude.ai' || hostname.endsWith('.claude.ai');
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
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-testid="user-message"], [data-testid^="assistant-message"], .font-claude-response, .font-claude-message'
      )
    );

    // Filter out nested matches inside an already matched message container
    const topLevel = nodes.filter(
      (node) => !nodes.some((other) => other !== node && other.contains(node))
    );

    for (const node of topLevel) {
      const testId = node.getAttribute('data-testid') ?? '';
      const isUser = testId === 'user-message';
      const content = domElementToMarkdown(node);
      if (content) {
        results.push({ role: isUser ? 'user' : 'assistant', content });
      }
    }
    return results;
  },

  getConversationTitle(): string {
    const headerTitle = document.querySelector<HTMLElement>('[data-testid="chat-title-button"]');
    if (headerTitle?.textContent?.trim()) return headerTitle.textContent.trim();
    return cleanDocumentTitle(document.title, ['- Claude', '| Claude']);
  },
};
