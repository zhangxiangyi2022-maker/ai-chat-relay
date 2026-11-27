import { isAllowedVerifyUrl } from '../core/verifier.js';
import type { HttpGetResponse, StorageBridge, StorageKey } from '../types/index.js';
import { copyWithFallback, STORAGE_PREFIX, storageFullKey } from './bridge.js';

declare function GM_getValue<T>(name: string, defaultValue?: T): T | Promise<T>;
declare function GM_setValue<T>(name: string, value: T): void | Promise<void>;
declare function GM_deleteValue(name: string): void | Promise<void>;
declare function GM_addValueChangeListener(
  name: string,
  callback: (name: string, oldVal: unknown, newVal: unknown, remote: boolean) => void
): string | number;
declare function GM_removeValueChangeListener(listenerId: string | number): void;
declare function GM_setClipboard(data: string, info?: string): void;
declare function GM_xmlhttpRequest(details: {
  method: 'GET';
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  onload?: (resp: { status: number; responseText: string }) => void;
  onerror?: () => void;
  ontimeout?: () => void;
}): void;

const ALL_KEYS: StorageKey[] = [
  'templates',
  'handoff',
  'settings',
  'pins',
  'tab_statuses',
  'broadcast',
];

export class GmStorageBridge implements StorageBridge {
  async get<T>(key: StorageKey): Promise<T | null> {
    const full = storageFullKey(key);
    const raw = await Promise.resolve(GM_getValue<string | T | null>(full, null));
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    }
    return raw as T;
  }

  async set<T>(key: StorageKey, value: T): Promise<void> {
    const full = storageFullKey(key);
    await Promise.resolve(GM_setValue(full, JSON.stringify(value)));
  }

  async remove(key: StorageKey): Promise<void> {
    await Promise.resolve(GM_deleteValue(storageFullKey(key)));
  }

  subscribe(listener: (key: StorageKey) => void): () => void {
    if (typeof GM_addValueChangeListener !== 'function') {
      return () => undefined;
    }

    const ids: Array<string | number> = [];
    for (const key of ALL_KEYS) {
      const full = storageFullKey(key);
      const id = GM_addValueChangeListener(full, (_name, _oldVal, _newVal, remote) => {
        if (remote || _name.startsWith(STORAGE_PREFIX)) {
          listener(key);
        }
      });
      ids.push(id);
    }

    return () => {
      if (typeof GM_removeValueChangeListener !== 'function') return;
      for (const id of ids) {
        GM_removeValueChangeListener(id);
      }
    };
  }

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(text, 'text');
        return true;
      }
    } catch {
      // Fall back to navigator/DOM copy
    }
    return copyWithFallback(text);
  }

  async fetchPublicReadOnly(url: string): Promise<HttpGetResponse> {
    if (!isAllowedVerifyUrl(url)) {
      return { ok: false, status: 403, body: 'Blocked non-allowlisted domain' };
    }
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise<HttpGetResponse>((resolve) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers: { Accept: 'application/json' },
          timeout: 6500,
          onload: (resp) => {
            resolve({
              ok: resp.status >= 200 && resp.status < 300,
              status: resp.status,
              body: resp.responseText ?? '',
            });
          },
          onerror: () => resolve({ ok: false, status: 0, body: 'Network error' }),
          ontimeout: () => resolve({ ok: false, status: 0, body: 'Request timeout' }),
        });
      });
    }
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    return { ok: resp.ok, status: resp.status, body: await resp.text() };
  }
}
