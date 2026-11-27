import { isAllowedVerifyUrl } from '../core/verifier.js';
import type { HttpGetResponse, StorageBridge, StorageKey } from '../types/index.js';
import { copyWithFallback, STORAGE_PREFIX, storageFullKey } from './bridge.js';

export class ChromeStorageBridge implements StorageBridge {
  async get<T>(key: StorageKey): Promise<T | null> {
    const full = storageFullKey(key);
    const result = await chrome.storage.local.get(full);
    const value = result[full];
    return value === undefined ? null : (value as T);
  }

  async set<T>(key: StorageKey, value: T): Promise<void> {
    await chrome.storage.local.set({ [storageFullKey(key)]: value });
  }

  async remove(key: StorageKey): Promise<void> {
    await chrome.storage.local.remove(storageFullKey(key));
  }

  subscribe(listener: (key: StorageKey) => void): () => void {
    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local') return;
      for (const fullKey of Object.keys(changes)) {
        if (!fullKey.startsWith(STORAGE_PREFIX)) continue;
        const shortKey = fullKey.slice(STORAGE_PREFIX.length) as StorageKey;
        listener(shortKey);
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }

  async copyToClipboard(text: string): Promise<boolean> {
    return copyWithFallback(text);
  }

  async fetchPublicReadOnly(url: string): Promise<HttpGetResponse> {
    if (!isAllowedVerifyUrl(url)) {
      return { ok: false, status: 403, body: 'Blocked non-allowlisted domain' };
    }
    const response = await chrome.runtime.sendMessage({
      type: 'CHAT_RELAY_FETCH_PUBLIC',
      url,
    }) as HttpGetResponse | undefined;
    if (!response) {
      return { ok: false, status: 0, body: 'No response from extension background worker' };
    }
    return response;
  }
}
