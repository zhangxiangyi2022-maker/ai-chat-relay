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
  'div.ProseMirror[contenteditable="true"]',
  '[contenteditable="true"][data-testid="chat-input"]',
  'fieldset [contenteditable="true"]',
  '[contenteditable="true"][aria-label*="Claude" i]',
];

const SUBMIT_SELECTORS = [
  'button[aria-label*="Send message" i]',
  'button[aria-label*="Send Message" i]',
  'button[aria-label*="发送" i]',
  'fieldset button[type="submit"]',
];

const STOP_SELECTORS = [
  'button[aria-label*="Stop response" i]',
  'button[aria-label*="Stop generating" i]',
  'button[aria-label*="停止" i]',
  '[data-is-streaming="true"]',
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

  clickSubmit(): boolean {
    return clickSubmitControl(SUBMIT_SELECTORS, this.findInput());
  },

  isGenerating(): boolean {
    return hasVisibleMatch(STOP_SELECTORS);
  },

  extractMessageNodes(): ExtractedMessageNode[] {
    const results: ExtractedMessageNode[] = [];
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-testid="user-message"], [data-testid^="assistant-message"], .font-claude-response, .font-claude-message'
      )
    );

    const topLevel = nodes.filter(
      (node) => !nodes.some((other) => other !== node && other.contains(node))
    );

    for (const node of topLevel) {
      const testId = node.getAttribute('data-testid') ?? '';
      const isUser = testId === 'user-message';
      const built = buildMessageNode(results.length, isUser ? 'user' : 'assistant', node, node);
      if (built) results.push(built);
    }
    return results;
  },

  extractMessages(): ChatMessage[] {
    return toPlainMessages(this.extractMessageNodes());
  },

  getConversationTitle(): string {
    const headerTitle = document.querySelector<HTMLElement>('[data-testid="chat-title-button"]');
    if (headerTitle?.textContent?.trim()) return headerTitle.textContent.trim();
    return cleanDocumentTitle(document.title, ['- Claude', '| Claude']);
  },
};
