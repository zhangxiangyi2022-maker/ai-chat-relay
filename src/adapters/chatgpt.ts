import type { ChatMessage, ExtractedMessageNode, MessageRole } from '../types/index.js';
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
  '#prompt-textarea',
  'div.ProseMirror[contenteditable="true"]',
  'textarea[data-id="root"]',
  'form textarea',
];

const SUBMIT_SELECTORS = [
  'button[data-testid="send-button"]',
  'button[aria-label*="Send prompt" i]',
  'button[aria-label*="Send" i]',
  'button[aria-label*="发送" i]',
];

const STOP_SELECTORS = [
  'button[data-testid="stop-button"]',
  'button[aria-label*="Stop generating" i]',
  'button[aria-label*="Stop streaming" i]',
  'button[aria-label*="停止" i]',
  '.result-streaming',
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

  clickSubmit(): boolean {
    return clickSubmitControl(SUBMIT_SELECTORS, this.findInput());
  },

  isGenerating(): boolean {
    return hasVisibleMatch(STOP_SELECTORS);
  },

  extractMessageNodes(): ExtractedMessageNode[] {
    const results: ExtractedMessageNode[] = [];
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-message-author-role]'));

    if (nodes.length > 0) {
      for (const node of nodes) {
        const rawRole = node.getAttribute('data-message-author-role');
        if (rawRole !== 'user' && rawRole !== 'assistant') continue;
        const role: MessageRole = rawRole;
        const contentRoot =
          node.querySelector<HTMLElement>('.markdown, .whitespace-pre-wrap') ?? node;
        const built = buildMessageNode(results.length, role, contentRoot, node);
        if (built) results.push(built);
      }
      return results;
    }

    const turns = Array.from(document.querySelectorAll<HTMLElement>('article[data-testid^="conversation-turn-"]'));
    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      if (!turn) continue;
      const built = buildMessageNode(results.length, i % 2 === 0 ? 'user' : 'assistant', turn, turn);
      if (built) results.push(built);
    }
    return results;
  },

  extractMessages(): ChatMessage[] {
    return toPlainMessages(this.extractMessageNodes());
  },

  getConversationTitle(): string {
    return cleanDocumentTitle(document.title, ['| ChatGPT', '- ChatGPT']);
  },
};
