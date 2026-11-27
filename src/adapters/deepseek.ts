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
  'textarea#chat-input',
  'textarea[placeholder*="DeepSeek" i]',
  'textarea[placeholder*="发送消息" i]',
  'main textarea',
  'textarea',
];

const SUBMIT_SELECTORS = [
  'div[role="button"].ds-icon-button:not([aria-disabled="true"])',
  'button[aria-label*="Send" i]',
  'button[aria-label*="发送" i]',
  'button[type="submit"]',
];

const STOP_SELECTORS = [
  '.ds-loading',
  'button[aria-label*="Stop" i]',
  'button[aria-label*="停止" i]',
  '[data-testid="stop-button"]',
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

  clickSubmit(): boolean {
    return clickSubmitControl(SUBMIT_SELECTORS, this.findInput());
  },

  isGenerating(): boolean {
    return hasVisibleMatch(STOP_SELECTORS);
  },

  extractMessageNodes(): ExtractedMessageNode[] {
    const results: ExtractedMessageNode[] = [];

    const dsMessages = Array.from(document.querySelectorAll<HTMLElement>('.ds-message'));
    if (dsMessages.length > 0) {
      for (const msg of dsMessages) {
        const mdBody = msg.querySelector<HTMLElement>('.ds-markdown');
        const thinkBody = msg.querySelector<HTMLElement>('.ds-think-content');
        if (mdBody) {
          const built = buildMessageNode(results.length, 'assistant', mdBody, msg, thinkBody);
          if (built) results.push(built);
        } else {
          const built = buildMessageNode(results.length, 'user', msg, msg);
          if (built) results.push(built);
        }
      }
      if (results.length > 0) return results;
    }

    const assistantMarkdowns = Array.from(document.querySelectorAll<HTMLElement>('.ds-markdown'));
    for (const mdNode of assistantMarkdowns) {
      const turnWrap = mdNode.closest('[data-virtual-index], [class*="message"]') ?? mdNode.parentElement;
      const prev = turnWrap?.previousElementSibling;
      if (prev && !prev.querySelector('.ds-markdown')) {
        const builtU = buildMessageNode(results.length, 'user', prev, prev as HTMLElement);
        if (builtU) results.push(builtU);
      }
      const builtA = buildMessageNode(results.length, 'assistant', mdNode, mdNode);
      if (builtA) results.push(builtA);
    }

    return results;
  },

  extractMessages(): ChatMessage[] {
    return toPlainMessages(this.extractMessageNodes());
  },

  getConversationTitle(): string {
    return cleanDocumentTitle(document.title, ['- DeepSeek', '| DeepSeek']);
  },
};
