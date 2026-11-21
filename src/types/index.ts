export type PlatformId = 'chatgpt' | 'gemini' | 'claude' | 'deepseek';

export type Locale = 'zh' | 'en';

export type MessageRole = 'user' | 'assistant';

export type HandoffMode = 'compact' | 'full';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  thinking?: string;
}

export interface PromptTemplate {
  id: string;
  command: string;
  title: string;
  titleEn?: string;
  tags: string[];
  content: string;
  contentEn?: string;
  isBuiltin?: boolean;
  updatedAt: number;
}

export interface HandoffPayload {
  id: string;
  sourcePlatform: PlatformId;
  sourceTitle: string;
  sourceFingerprint: string;
  messageCount: number;
  includedCount: number;
  redactedCount: number;
  createdAt: number;
  expiresAt: number;
  mode: HandoffMode;
  promptText: string;
  estimatedTokens: number;
}

export interface RelaySettings {
  locale: Locale;
  handoffMode: HandoffMode;
  maxCompactTurns: number;
  includeThinking: boolean;
  slashTrigger: boolean;
  seededBuiltins: boolean;
  redactSecrets: boolean;
  redactPii: boolean;
  autoClearHandoffAfterPaste: boolean;
  handoffTtlMinutes: number;
  includeSourceUrlInExport: boolean;
  autoCopyToClipboard: boolean;
}

export type StorageKey = 'templates' | 'handoff' | 'settings';

export interface StorageBridge {
  get<T>(key: StorageKey): Promise<T | null>;
  set<T>(key: StorageKey, value: T): Promise<void>;
  remove(key: StorageKey): Promise<void>;
  subscribe(listener: (key: StorageKey) => void): () => void;
  copyToClipboard(text: string): Promise<boolean>;
}
