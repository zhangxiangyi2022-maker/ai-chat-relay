export type PlatformId = 'chatgpt' | 'gemini' | 'claude' | 'deepseek';

export type Locale = 'zh' | 'en';

export type MessageRole = 'user' | 'assistant';

export type HandoffMode = 'compact' | 'full';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  thinking?: string;
}

export interface ExtractedMessageNode extends ChatMessage {
  index: number;
  element: HTMLElement | null;
}

export interface TimelineNode {
  index: number;
  role: MessageRole;
  preview: string;
  hasCode: boolean;
  hasMath: boolean;
  hasTable: boolean;
  muted: boolean;
  element: HTMLElement | null;
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
  isFork?: boolean;
  createdAt: number;
  expiresAt: number;
  mode: HandoffMode;
  promptText: string;
  estimatedTokens: number;
}

export type TabRunState = 'idle' | 'streaming' | 'done';

export interface TabStatusEntry {
  tabId: string;
  platform: PlatformId;
  title: string;
  state: TabRunState;
  startedAt: number;
  updatedAt: number;
  expiresAt: number;
  lastDurationSec?: number;
  lastPreview: string;
}

export interface BroadcastCommand {
  id: string;
  targetTabIds: string[];
  promptText: string;
  autoSubmit: boolean;
  createdAt: number;
  consumedBy: string[];
}

export interface PinnedSnippet {
  id: string;
  sourcePlatform: PlatformId;
  sourceTitle: string;
  sourceFingerprint: string;
  text: string;
  kind: 'selection' | 'turn';
  createdAt: number;
}

export type VerifyKind = 'npm' | 'pypi' | 'github' | 'url';

export interface VerifyCandidate {
  kind: VerifyKind;
  target: string;
  displayLabel: string;
}

export interface VerifyResult extends VerifyCandidate {
  status: 'valid' | 'not_found' | 'suspicious' | 'error';
  detail: string;
  version?: string;
  stars?: number;
}

export interface HttpGetResponse {
  ok: boolean;
  status: number;
  body: string;
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
  showTimeline: boolean;
  showDynamicIsland: boolean;
  notifyOnBackgroundDone: boolean;
  selectionPinbar: boolean;
}

export type StorageKey =
  | 'templates'
  | 'handoff'
  | 'settings'
  | 'pins'
  | 'tab_statuses'
  | 'broadcast';

export interface StorageBridge {
  get<T>(key: StorageKey): Promise<T | null>;
  set<T>(key: StorageKey, value: T): Promise<void>;
  remove(key: StorageKey): Promise<void>;
  subscribe(listener: (key: StorageKey) => void): () => void;
  copyToClipboard(text: string): Promise<boolean>;
  fetchPublicReadOnly?(url: string): Promise<HttpGetResponse>;
}
