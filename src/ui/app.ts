import type { SiteAdapter } from '../adapters/types.js';
import {
  formatConversationMarkdownWithStats,
  sanitizeFilename,
  triggerTextDownload,
} from '../core/exporter.js';
import { buildHandoffPayload } from '../core/handoff.js';
import { computeUrlFingerprint } from '../core/privacy.js';
import { BUILTIN_TEMPLATES } from '../core/templates.js';
import { formatMsg, getMessages, PLATFORM_NAMES } from '../i18n/index.js';
import {
  clearAllLocalData,
  createDefaultSettings,
  loadActiveHandoff,
  loadSettings,
  loadTemplatesWithSeed,
} from '../storage/bridge.js';
import type { HandoffPayload, PromptTemplate, RelaySettings, StorageBridge } from '../types/index.js';
import { clearChildren, el, svgIcon } from './dom.js';
import { PaletteModal } from './palette.js';
import { SHADOW_CSS } from './styles.js';

export interface MountOptions {
  adapter: SiteAdapter;
  bridge: StorageBridge;
}

export function mountChatRelay({ adapter, bridge }: MountOptions): () => void {
  const existing = document.getElementById('chat-relay-root');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'chat-relay-root';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  if ('adoptedStyleSheets' in shadow && typeof CSSStyleSheet === 'function') {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(SHADOW_CSS);
      shadow.adoptedStyleSheets = [sheet];
    } catch {
      const style = document.createElement('style');
      style.textContent = SHADOW_CSS;
      shadow.appendChild(style);
    }
  } else {
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    shadow.appendChild(style);
  }

  const anchor = el('div', { className: 'cr-anchor' });
  const bannerSlot = el('div');
  const dockSlot = el('div');
  const modalSlot = el('div');
  const toastSlot = el('div');
  anchor.append(bannerSlot, dockSlot);
  shadow.append(anchor, modalSlot, toastSlot);

  let templates: PromptTemplate[] = [];
  let settings: RelaySettings = createDefaultSettings();
  let pendingHandoff: HandoffPayload | null = null;
  let slashTriggeredFromInput = false;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  const showToast = (text: string) => {
    clearChildren(toastSlot);
    toastSlot.appendChild(el('div', { className: 'cr-toast', text }));
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => clearChildren(toastSlot), 3000);
  };

  const insertIntoChat = async (text: string): Promise<boolean> => {
    const msg = getMessages(settings.locale);
    const ok = adapter.insertText(text, { replaceTrailingSlashQuery: slashTriggeredFromInput });
    slashTriggeredFromInput = false;
    if (ok) {
      showToast(msg.toastInserted);
      return true;
    }
    await bridge.copyToClipboard(text);
    showToast(msg.toastNoInput);
    return false;
  };

  const palette = new PaletteModal(modalSlot, {
    getTemplates: () => templates,
    getSettings: () => settings,
    onSaveTemplates: async (next) => {
      templates = next;
      await bridge.set('templates', next);
    },
    onResetBuiltins: async () => {
      const msg = getMessages(settings.locale);
      const customOnly = templates.filter((t) => !t.isBuiltin);
      const merged = [...BUILTIN_TEMPLATES.map((t) => ({ ...t })), ...customOnly];
      templates = merged;
      await bridge.set('templates', merged);
      showToast(msg.toastBuiltinsRestored);
    },
    onUpdateSettings: async (patch) => {
      settings = { ...settings, ...patch };
      await bridge.set('settings', settings);
      renderChrome();
      palette.refresh();
    },
    onClearHandoff: async () => {
      const msg = getMessages(settings.locale);
      pendingHandoff = null;
      await bridge.remove('handoff');
      renderChrome();
      showToast(msg.toastPrivacyCleared);
    },
    onClearAllData: async () => {
      const msg = getMessages(settings.locale);
      pendingHandoff = null;
      await clearAllLocalData(bridge);
      const reloaded = await loadTemplatesWithSeed(bridge);
      templates = reloaded.templates;
      settings = reloaded.settings;
      renderChrome();
      palette.refresh();
      showToast(msg.toastPrivacyCleared);
    },
    onInsertPrompt: (text) => {
      void insertIntoChat(text);
    },
    onCopyText: async (text) => {
      const msg = getMessages(settings.locale);
      await bridge.copyToClipboard(text);
      showToast(msg.toastCopied);
    },
    onNotify: (text) => showToast(text),
  });

  const handleHandoffPackage = async () => {
    const msg = getMessages(settings.locale);
    const messages = adapter.extractMessages();
    if (messages.length === 0) {
      showToast(msg.toastNoMessages);
      return;
    }

    const payload = buildHandoffPayload({
      sourcePlatform: adapter.id,
      sourceTitle: adapter.getConversationTitle(),
      sourceUrl: window.location.href,
      messages,
      mode: settings.handoffMode,
      maxCompactTurns: settings.maxCompactTurns,
      locale: settings.locale,
      redactSecrets: settings.redactSecrets,
      redactPii: settings.redactPii,
      ttlMinutes: settings.handoffTtlMinutes,
    });
    if (!payload) {
      showToast(msg.toastNoMessages);
      return;
    }

    pendingHandoff = payload;
    await bridge.set('handoff', payload);
    if (settings.autoCopyToClipboard) {
      await bridge.copyToClipboard(payload.promptText);
    }
    renderChrome();

    if (payload.redactedCount > 0) {
      showToast(
        formatMsg(msg.toastHandoffSavedRedacted, {
          platform: PLATFORM_NAMES[adapter.id],
          count: payload.includedCount,
          redacted: payload.redactedCount,
        })
      );
    } else {
      showToast(
        formatMsg(msg.toastHandoffSaved, {
          platform: PLATFORM_NAMES[adapter.id],
          count: payload.includedCount,
        })
      );
    }
  };

  const handleExportMarkdown = async () => {
    const msg = getMessages(settings.locale);
    const messages = adapter.extractMessages();
    if (messages.length === 0) {
      showToast(msg.toastNoMessages);
      return;
    }

    const title = adapter.getConversationTitle() || `${PLATFORM_NAMES[adapter.id]}-Chat`;
    const result = formatConversationMarkdownWithStats({
      platform: adapter.id,
      title,
      url: window.location.href,
      messages,
      locale: settings.locale,
      includeThinking: settings.includeThinking,
      includeSourceUrl: settings.includeSourceUrlInExport,
      redactSecrets: settings.redactSecrets,
      redactPii: settings.redactPii,
    });
    const filename = `${adapter.id}-${sanitizeFilename(title)}.md`;
    triggerTextDownload(filename, result.markdown);
    if (settings.autoCopyToClipboard) {
      await bridge.copyToClipboard(result.markdown);
    }
    if (result.redactedCount > 0) {
      showToast(formatMsg(msg.toastExportedMdRedacted, { redacted: result.redactedCount }));
    } else {
      showToast(msg.toastExportedMd);
    }
  };

  const renderChrome = () => {
    const msg = getMessages(settings.locale);
    clearChildren(bannerSlot);
    clearChildren(dockSlot);

    const currentFingerprint = computeUrlFingerprint(window.location.href);
    const isExpired =
      pendingHandoff !== null &&
      pendingHandoff.expiresAt > 0 &&
      Date.now() >= pendingHandoff.expiresAt;

    if (isExpired) {
      pendingHandoff = null;
      void bridge.remove('handoff');
    }

    // Show cross-site handoff banner when there's a valid pending handoff from another conversation/site
    if (pendingHandoff && pendingHandoff.sourceFingerprint !== currentFingerprint) {
      const ho = pendingHandoff;
      const sourceName = PLATFORM_NAMES[ho.sourcePlatform];
      const modeLabel = ho.mode === 'compact' ? msg.handoffModeCompact : msg.handoffModeFull;
      const baseMeta = formatMsg(msg.handoffBannerMeta, {
        included: ho.includedCount,
        total: ho.messageCount,
        tokens: ho.estimatedTokens,
        mode: modeLabel,
      });
      const redactedSuffix =
        ho.redactedCount > 0
          ? formatMsg(msg.handoffRedactedMeta, { count: ho.redactedCount })
          : '';

      bannerSlot.appendChild(
        el(
          'div',
          { className: 'cr-handoff-banner' },
          el(
            'div',
            { className: 'cr-handoff-title' },
            svgIcon('relay', 14),
            el('span', { text: formatMsg(msg.handoffBannerTitle, { platform: sourceName }) })
          ),
          el('div', {
            className: 'cr-handoff-meta',
            text: `${baseMeta}${redactedSuffix}`,
          }),
          el(
            'div',
            { className: 'cr-handoff-actions' },
            el('button', {
              className: 'cr-btn cr-btn-primary',
              text: msg.handoffPasteBtn,
              onClick: async () => {
                slashTriggeredFromInput = false;
                const inserted = await insertIntoChat(ho.promptText);
                if (inserted && settings.autoClearHandoffAfterPaste) {
                  pendingHandoff = null;
                  await bridge.remove('handoff');
                  renderChrome();
                }
              },
            }),
            el('button', {
              className: 'cr-btn cr-btn-subtle',
              text: msg.handoffCopyBtn,
              onClick: async () => {
                await bridge.copyToClipboard(ho.promptText);
                showToast(msg.toastCopied);
              },
            }),
            el('button', {
              className: 'cr-btn cr-btn-subtle',
              text: msg.handoffDismissBtn,
              onClick: async () => {
                pendingHandoff = null;
                await bridge.remove('handoff');
                renderChrome();
              },
            })
          )
        )
      );
    }

    dockSlot.appendChild(
      el(
        'div',
        { className: 'cr-dock' },
        el(
          'button',
          {
            className: 'cr-btn',
            title: `${msg.promptsBtn} (Ctrl+Shift+P)`,
            onClick: () => {
              slashTriggeredFromInput = false;
              palette.openList();
            },
          },
          svgIcon('slash', 14),
          el('span', { text: msg.promptsBtn })
        ),
        el(
          'button',
          {
            className: 'cr-btn cr-btn-primary',
            title: msg.handoffBtn,
            onClick: () => void handleHandoffPackage(),
          },
          svgIcon('relay', 14),
          el('span', { text: msg.handoffBtn })
        ),
        el(
          'button',
          {
            className: 'cr-btn',
            title: msg.exportBtn,
            onClick: () => void handleExportMarkdown(),
          },
          svgIcon('download', 14),
          el('span', { text: msg.exportBtn })
        ),
        el(
          'button',
          {
            className: 'cr-btn cr-btn-icon',
            title: msg.settingsBtn,
            onClick: () => palette.openSettings(),
          },
          svgIcon('settings', 14)
        )
      )
    );
  };

  const onDocumentInput = (e: Event) => {
    if (!settings.slashTrigger || palette.isOpen()) return;
    const target = e.target as HTMLElement | null;
    if (!target || host.contains(target)) return;
    const activeInput = adapter.findInput();
    if (!activeInput) return;
    if (target !== activeInput && !activeInput.contains(target)) return;

    const text = adapter.getInputText(activeInput);
    if (/(?:^|\s)\/$/.test(text)) {
      slashTriggeredFromInput = true;
      palette.openList();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && palette.isOpen()) {
      e.preventDefault();
      slashTriggeredFromInput = false;
      palette.close();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      if (palette.isOpen()) {
        palette.close();
      } else {
        slashTriggeredFromInput = false;
        palette.openList();
      }
    }
  };

  document.addEventListener('input', onDocumentInput, true);
  window.addEventListener('keydown', onKeyDown, true);

  let lastHref = window.location.href;
  const hrefTimer = setInterval(() => {
    const expired =
      pendingHandoff !== null &&
      pendingHandoff.expiresAt > 0 &&
      Date.now() >= pendingHandoff.expiresAt;

    if (window.location.href !== lastHref || expired) {
      lastHref = window.location.href;
      renderChrome();
    }
  }, 1000);

  const unsubscribe = bridge.subscribe((changedKey) => {
    void (async () => {
      if (changedKey === 'handoff') {
        pendingHandoff = await loadActiveHandoff(bridge);
        renderChrome();
      } else if (changedKey === 'templates') {
        templates = (await bridge.get<PromptTemplate[]>('templates')) ?? [];
        palette.refresh();
      } else if (changedKey === 'settings') {
        settings = await loadSettings(bridge);
        renderChrome();
        palette.refresh();
      }
    })();
  });

  void (async () => {
    const loaded = await loadTemplatesWithSeed(bridge);
    templates = loaded.templates;
    settings = loaded.settings;
    pendingHandoff = await loadActiveHandoff(bridge);
    renderChrome();
  })();

  return () => {
    document.removeEventListener('input', onDocumentInput, true);
    window.removeEventListener('keydown', onKeyDown, true);
    clearInterval(hrefTimer);
    unsubscribe();
    host.remove();
  };
}
