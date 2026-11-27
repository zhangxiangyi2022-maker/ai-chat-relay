import type { ChatMessage, ExtractedMessageNode, PlatformId } from '../types/index.js';

export interface SiteAdapter {
  readonly id: PlatformId;
  matches(hostname: string): boolean;
  findInput(): HTMLElement | null;
  getInputText(inputEl?: HTMLElement | null): string;
  insertText(text: string, options?: { replaceTrailingSlashQuery?: boolean }): boolean;
  clickSubmit(): boolean;
  isGenerating(): boolean;
  extractMessageNodes(): ExtractedMessageNode[];
  extractMessages(): ChatMessage[];
  getConversationTitle(): string;
}
