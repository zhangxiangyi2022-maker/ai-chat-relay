import type { HttpGetResponse, StorageBridge, StorageKey } from '../types/index.js';

export class MemoryStorageBridge implements StorageBridge {
  private readonly store = new Map<StorageKey, unknown>();
  private readonly listeners = new Set<(key: StorageKey) => void>();
  public lastClipboard = '';
  public mockFetcher?: (url: string) => Promise<HttpGetResponse>;

  async get<T>(key: StorageKey): Promise<T | null> {
    const val = this.store.get(key);
    return val === undefined ? null : (structuredClone(val) as T);
  }

  async set<T>(key: StorageKey, value: T): Promise<void> {
    this.store.set(key, structuredClone(value));
    for (const listener of this.listeners) {
      listener(key);
    }
  }

  async remove(key: StorageKey): Promise<void> {
    this.store.delete(key);
    for (const listener of this.listeners) {
      listener(key);
    }
  }

  subscribe(listener: (key: StorageKey) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async copyToClipboard(text: string): Promise<boolean> {
    this.lastClipboard = text;
    return true;
  }

  async fetchPublicReadOnly(url: string): Promise<HttpGetResponse> {
    if (this.mockFetcher) {
      return this.mockFetcher(url);
    }
    return { ok: false, status: 404, body: 'Not mocked' };
  }
}
