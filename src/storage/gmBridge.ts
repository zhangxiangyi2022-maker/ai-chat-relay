import type { StorageBridge, StorageKey } from '../types/index.js';
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

const ALL_KEYS: StorageKey[] = ['templates', 'handoff', 'settings'];

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
}
