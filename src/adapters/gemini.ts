import type { ChatMessage, ExtractedMessageNode } from '../types/index.js';
import {
  buildMessageNode,
  cleanDocumentTitle,
  clickSubmitControl,
  hasVisibleMatch,
  insertIntoInputElement,
  isElementVisible,
  queryFirst,
  readInputText,
  toPlainMessages,
} from './shared.js';
import type { SiteAdapter } from './types.js';

const INPUT_SELECTORS = [
  'rich-textarea .ql-editor[contenteditable="true"]',
  'div.ql-editor[contenteditable="true"]',
  'rich-textarea [contenteditable="true"]',
  'textarea[aria-label*="Gemini" i]',
  '[contenteditable="true"][role="textbox"]',
];

const SUBMIT_SELECTORS = [
  'button.send-button',
  'button[aria-label*="Send message" i]',
  'button[aria-label*="Send" i]',
  'button[aria-label*="发送" i]',
];

const STOP_SELECTORS = [
  'button[aria-label*="Stop response" i]',
  'button[aria-label*="Stop generating" i]',
  'button[aria-label*="停止" i]',
  'mat-spinner',
  '.loading-content-spinner',
  'model-response [aria-busy="true"]',
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

  clickSubmit(): boolean {
    return clickSubmitControl(SUBMIT_SELECTORS, this.findInput());
  },

  isGenerating(): boolean {
    return hasVisibleMatch(STOP_SELECTORS);
  },

  extractMessageNodes(): ExtractedMessageNode[] {
    const results: ExtractedMessageNode[] = [];
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>(
        'user-query, model-response, [data-test-id="user-query"], [data-test-id="model-response"]'
      )
    );

    if (blocks.length > 0) {
      for (const block of blocks) {
        const tag = block.tagName.toLowerCase();
        const isUser = tag === 'user-query' || block.getAttribute('data-test-id') === 'user-query';
        const contentRoot = isUser
          ? block.querySelector<HTMLElement>('.query-text, .user-query-bubble-with-background, user-query-content') ??
            block
          : block.querySelector<HTMLElement>('message-content, .model-response-text, .markdown') ?? block;
        const thinkingNode = !isUser ? block.querySelector<HTMLElement>('.thoughts-content, model-thoughts') : null;
        const built = buildMessageNode(
          results.length,
          isUser ? 'user' : 'assistant',
          contentRoot,
          block,
          thinkingNode
        );
        if (built) results.push(built);
      }
      return results;
    }

    const containers = Array.from(document.querySelectorAll<HTMLElement>('.conversation-container'));
    for (const box of containers) {
      const u = box.querySelector<HTMLElement>('.query-text, user-query-content');
      if (u) {
        const builtU = buildMessageNode(results.length, 'user', u, u);
        if (builtU) results.push(builtU);
      }
      const m = box.querySelector<HTMLElement>('message-content, .markdown');
      if (m) {
        const builtM = buildMessageNode(results.length, 'assistant', m, m);
        if (builtM) results.push(builtM);
      }
    }
    return results;
  },

  extractMessages(): ChatMessage[] {
    return toPlainMessages(this.extractMessageNodes());
  },

  getConversationTitle(): string {
    const activeNav = document.querySelector<HTMLElement>('.conversation.selected .conversation-title');
    if (activeNav?.textContent?.trim()) return activeNav.textContent.trim();
    return cleanDocumentTitle(document.title, ['- Google Gemini', 'Google Gemini', '- Gemini']);
  },
};
