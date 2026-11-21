import { chatgptAdapter } from './chatgpt.js';
import { claudeAdapter } from './claude.js';
import { deepseekAdapter } from './deepseek.js';
import { geminiAdapter } from './gemini.js';
import type { SiteAdapter } from './types.js';

export const ALL_ADAPTERS: readonly SiteAdapter[] = [
  chatgptAdapter,
  geminiAdapter,
  claudeAdapter,
  deepseekAdapter,
];

export function resolveSiteAdapter(hostname: string): SiteAdapter | null {
  const lower = hostname.toLowerCase();
  return ALL_ADAPTERS.find((adapter) => adapter.matches(lower)) ?? null;
}
