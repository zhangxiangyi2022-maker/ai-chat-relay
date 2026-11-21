import { detectDefaultLocale } from '../i18n/index.js';
import type { HandoffPayload, PromptTemplate, RelaySettings, StorageBridge, StorageKey } from '../types/index.js';
import { BUILTIN_TEMPLATES } from '../core/templates.js';

export const STORAGE_PREFIX = 'chat_relay_v1_';

export function storageFullKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function createDefaultSettings(): RelaySettings {
  return {
    locale: detectDefaultLocale(),
    handoffMode: 'compact',
    maxCompactTurns: 8,
    includeThinking: false,
    slashTrigger: true,
    seededBuiltins: false,
    redactSecrets: true,
    redactPii: true,
    autoClearHandoffAfterPaste: true,
    handoffTtlMinutes: 30,
    includeSourceUrlInExport: false,
    autoCopyToClipboard: false,
  };
}

export async function loadSettings(bridge: StorageBridge): Promise<RelaySettings> {
  const stored = await bridge.get<Partial<RelaySettings>>('settings');
  return {
    ...createDefaultSettings(),
    ...stored,
  };
}

export async function loadActiveHandoff(bridge: StorageBridge, now = Date.now()): Promise<HandoffPayload | null> {
  const payload = await bridge.get<HandoffPayload>('handoff');
  if (!payload) return null;
  if (payload.expiresAt > 0 && now >= payload.expiresAt) {
    await bridge.remove('handoff');
    return null;
  }
  return payload;
}

export async function loadTemplatesWithSeed(bridge: StorageBridge): Promise<{
  templates: PromptTemplate[];
  settings: RelaySettings;
}> {
  const settings = await loadSettings(bridge);
  const existing = await bridge.get<PromptTemplate[]>('templates');

  if (!existing && !settings.seededBuiltins) {
    const seeded = BUILTIN_TEMPLATES.map((t) => ({ ...t }));
    const nextSettings: RelaySettings = { ...settings, seededBuiltins: true };
    await bridge.set('templates', seeded);
    await bridge.set('settings', nextSettings);
    return { templates: seeded, settings: nextSettings };
  }

  return { templates: existing ?? [], settings };
}

export async function clearAllLocalData(bridge: StorageBridge): Promise<void> {
  await Promise.all([bridge.remove('handoff'), bridge.remove('templates'), bridge.remove('settings')]);
}

export async function copyWithFallback(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to execCommand copy
  }

  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
