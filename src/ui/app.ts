import type { SiteAdapter } from '../adapters/types.js';
import {
  formatConversationMarkdownWithStats,
  sanitizeFilename,
  triggerTextDownload,
} from '../core/exporter.js';
import { buildHandoffPayload } from '../core/handoff.js';
import { createPinnedSnippet } from '../core/pinboard.js';
import { computeUrlFingerprint, redactSensitiveText } from '../core/privacy.js';
import { BUILTIN_TEMPLATES } from '../core/templates.js';
import { buildTimelineNodes, selectMessagesForHandoff } from '../core/timeline.js';
import { extractVerifyCandidates, verifyCandidatesOnline } from '../core/verifier.js';
import { formatMsg, getMessages, PLATFORM_NAMES } from '../i18n/index.js';
import {
  clearAllLocalData,
  createDefaultSettings,
  loadActiveHandoff,
  loadActiveTabStatuses,
  loadSettings,
  loadTemplatesWithSeed,
} from '../storage/bridge.js';
import type {
  BroadcastCommand,
  ExtractedMessageNode,
  HandoffPayload,
  PinnedSnippet,
  PromptTemplate,
  RelaySettings,
  StorageBridge,
  TabRunState,
  TabStatusEntry,
  TimelineNode,
} from '../types/index.js';
import { clearChildren, el, svgIcon } from './dom.js';
import { DynamicIsland } from './island.js';
import { PaletteModal } from './palette.js';
import { SHADOW_CSS } from './styles.js';
import { MetroTimeline } from './timeline.js';

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

  const islandSlot = el('div');
  const timelineSlot = el('div');
  const anchor = el('div', { className: 'cr-anchor' });
  const bannerSlot = el('div');
  const dockSlot = el('div');
  const selectionSlot = el('div');
  const modalSlot = el('div');
  const toastSlot = el('div');
  anchor.append(bannerSlot, dockSlot);
  shadow.append(islandSlot, timelineSlot, anchor, selectionSlot, modalSlot, toastSlot);

  const tabId = `tab-${adapter.id}-${Math.random().toString(36).slice(2, 8)}`;
  let templates: PromptTemplate[] = [];
  let pins: PinnedSnippet[] = [];
  let settings: RelaySettings = createDefaultSettings();
  let pendingHandoff: HandoffPayload | null = null;
  let tabStatuses: Record<string, TabStatusEntry> = {};
  let extractedNodes: ExtractedMessageNode[] = [];
  const mutedIndices = new Set<number>();
  let slashTriggeredFromInput = false;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Radar state machine
  let currentRunState: TabRunState = 'idle';
  let streamStartedAt = 0;
  let lastDurationSec = 0;
  let lastNotifiedTabDoneKey = '';
  const handledBroadcasts = new Set<string>();

  const showToast = (text: string) => {
    clearChildren(toastSlot);
    toastSlot.appendChild(el('div', { className: 'cr-toast', text }));
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => clearChildren(toastSlot), 3200);
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

  const addPin = async (text: string, kind: 'selection' | 'turn') => {
    const msg = getMessages(settings.locale);
    const created = createPinnedSnippet({
      sourcePlatform: adapter.id,
      sourceTitle: adapter.getConversationTitle(),
      sourceUrl: window.location.href,
      text,
      kind,
      redactSecrets: settings.redactSecrets,
      redactPii: settings.redactPii,
    });
    if (!created) return;
    pins = [created, ...pins].slice(0, 60);
    await bridge.set('pins', pins);
    renderChrome();
    palette.refresh();
    showToast(msg.pinAddedToast);
  };

  const palette = new PaletteModal(modalSlot, {
    getTemplates: () => templates,
    getPins: () => pins,
    getSettings: () => settings,
    scanVerifyContext: () => {
      const nodes = adapter.extractMessageNodes();
      const active = selectMessagesForHandoff(nodes, { mutedIndices });
      return extractVerifyCandidates(active);
    },
    runOnlineVerify: async (candidates) => {
      if (!bridge.fetchPublicReadOnly) {
        return candidates.map((c) => ({
          ...c,
          status: 'error',
          detail: 'Online verification unavailable in this environment',
        }));
      }
      return verifyCandidatesOnline(candidates, (url) => bridge.fetchPublicReadOnly!(url));
    },
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
    onDeletePin: async (id) => {
      pins = pins.filter((p) => p.id !== id);
      await bridge.set('pins', pins);
      renderChrome();
      palette.refresh();
    },
    onClearPins: async () => {
      pins = [];
      await bridge.remove('pins');
      renderChrome();
      palette.refresh();
    },
    onUpdateSettings: async (patch) => {
      settings = { ...settings, ...patch };
      await bridge.set('settings', settings);
      renderAll();
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
      pins = [];
      tabStatuses = {};
      await clearAllLocalData(bridge);
      const reloaded = await loadTemplatesWithSeed(bridge);
      templates = reloaded.templates;
      settings = reloaded.settings;
      renderAll();
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
    onDownloadMarkdown: (filename, content) => {
      triggerTextDownload(filename, content);
    },
    onNotify: (text) => showToast(text),
  });

  const timeline = new MetroTimeline(timelineSlot, {
    onJump: (node: TimelineNode) => {
      const target = node.element;
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const prevOutline = target.style.outline;
      const prevOffset = target.style.outlineOffset;
      target.style.outline = '2px solid #3b82f6';
      target.style.outlineOffset = '4px';
      setTimeout(() => {
        target.style.outline = prevOutline;
        target.style.outlineOffset = prevOffset;
      }, 1500);
    },
    onFork: (node: TimelineNode) => {
      void handleHandoffPackage(node.index);
    },
    onPinTurn: (node: TimelineNode) => {
      const matched = extractedNodes.find((n) => n.index === node.index);
      if (matched) {
        void addPin(matched.content, 'turn');
      }
    },
    onToggleMute: (node: TimelineNode) => {
      if (mutedIndices.has(node.index)) {
        mutedIndices.delete(node.index);
      } else {
        mutedIndices.add(node.index);
      }
      renderTimeline();
    },
  });

  const island = new DynamicIsland(islandSlot, {
    onSendBroadcast: async (promptText, targetTabIds, autoSubmit) => {
      const msg = getMessages(settings.locale);
      const trimmed = promptText.trim();
      if (!trimmed || targetTabIds.length === 0) {
        showToast(msg.broadcastNoTargetToast);
        return;
      }
      const cmd: BroadcastCommand = {
        id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        targetTabIds,
        promptText: trimmed,
        autoSubmit,
        createdAt: Date.now(),
        consumedBy: [],
      };
      await bridge.set('broadcast', cmd);
      await applyBroadcastIfTargeted(cmd);
      showToast(formatMsg(msg.broadcastSentToast, { count: targetTabIds.length }));
    },
    onCopyPreview: async (text) => {
      const msg = getMessages(settings.locale);
      await bridge.copyToClipboard(text);
      showToast(msg.toastCopied);
    },
    onEnableNotifications: async () => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
        renderIsland();
      }
    },
  });

  const handleHandoffPackage = async (upToIndex?: number) => {
    const msg = getMessages(settings.locale);
    const nodes = adapter.extractMessageNodes();
    extractedNodes = nodes;
    const messages = selectMessagesForHandoff(nodes, { upToIndex, mutedIndices });
    if (messages.length === 0) {
      showToast(msg.toastNoMessages);
      return;
    }

    const isFork = upToIndex !== undefined;
    const payload = buildHandoffPayload({
      sourcePlatform: adapter.id,
      sourceTitle: adapter.getConversationTitle(),
      sourceUrl: window.location.href,
      messages,
      mode: isFork ? 'full' : settings.handoffMode,
      maxCompactTurns: settings.maxCompactTurns,
      locale: settings.locale,
      isFork,
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

    if (isFork) {
      showToast(
        formatMsg(msg.toastForkSaved, {
          turn: (upToIndex ?? 0) + 1,
          count: payload.includedCount,
        })
      );
    } else if (payload.redactedCount > 0) {
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
    const nodes = adapter.extractMessageNodes();
    extractedNodes = nodes;
    const messages = selectMessagesForHandoff(nodes, { mutedIndices });
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

    if (pendingHandoff && (pendingHandoff.isFork || pendingHandoff.sourceFingerprint !== currentFingerprint)) {
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
      const headingText = ho.isFork
        ? formatMsg(msg.handoffForkTitle, { platform: sourceName, turns: ho.includedCount })
        : formatMsg(msg.handoffBannerTitle, { platform: sourceName });

      bannerSlot.appendChild(
        el(
          'div',
          { className: 'cr-handoff-banner' },
          el(
            'div',
            { className: 'cr-handoff-title' },
            svgIcon(ho.isFork ? 'fork' : 'relay', 14),
            el('span', { text: headingText })
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
            title: msg.pinboardTitle,
            onClick: () => palette.openPinboard(),
          },
          svgIcon('pin', 14),
          el('span', { text: msg.pinboardBtn }),
          pins.length > 0 ? el('span', { className: 'cr-badge-count', text: String(pins.length) }) : null
        ),
        el(
          'button',
          {
            className: 'cr-btn',
            title: msg.verifierTitle,
            onClick: () => palette.openVerifier(),
          },
          svgIcon('shield', 14),
          el('span', { text: msg.verifyBtn })
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

  const renderTimeline = () => {
    extractedNodes = adapter.extractMessageNodes();
    const nodes = buildTimelineNodes(extractedNodes, mutedIndices);
    timeline.render(nodes, adapter.id, settings.locale, settings.showTimeline);
  };

  const renderIsland = () => {
    const activeTabs = Object.values(tabStatuses).filter((t) => t.expiresAt > Date.now());
    island.render(
      activeTabs,
      tabId,
      settings.locale,
      settings.showDynamicIsland,
      settings.notifyOnBackgroundDone
    );
  };

  const renderAll = () => {
    renderChrome();
    renderTimeline();
    renderIsland();
  };

  const syncTabHeartbeat = async (force = false) => {
    const generating = adapter.isGenerating();
    const now = Date.now();
    let stateChanged = force;

    if (generating) {
      if (currentRunState !== 'streaming') {
        currentRunState = 'streaming';
        streamStartedAt = now;
        stateChanged = true;
      }
    } else if (currentRunState === 'streaming') {
      currentRunState = 'done';
      lastDurationSec = Math.max(1, Math.round((now - streamStartedAt) / 1000));
      stateChanged = true;
    }

    const nodes = adapter.extractMessageNodes();
    extractedNodes = nodes;
    const lastAssistant = [...nodes].reverse().find((n) => n.role === 'assistant');
    const rawPreview = lastAssistant?.content.slice(0, 260) ?? '';
    const safePreview = redactSensitiveText(rawPreview, {
      redactSecrets: settings.redactSecrets,
      redactPii: settings.redactPii,
    }).text;
    const safeTitle = redactSensitiveText(
      adapter.getConversationTitle() || PLATFORM_NAMES[adapter.id],
      { redactSecrets: settings.redactSecrets, redactPii: settings.redactPii }
    ).text;

    const currentEntry: TabStatusEntry = {
      tabId,
      platform: adapter.id,
      title: safeTitle,
      state: currentRunState,
      startedAt: streamStartedAt || now,
      updatedAt: now,
      expiresAt: now + 20_000,
      lastDurationSec,
      lastPreview: safePreview,
    };

    const existingMap = await loadActiveTabStatuses(bridge, now);
    existingMap[tabId] = currentEntry;
    tabStatuses = existingMap;

    if (stateChanged || !island.isOpenPopover()) {
      await bridge.set('tab_statuses', existingMap);
    }

    renderTimeline();
    renderIsland();
  };

  const applyBroadcastIfTargeted = async (cmd: BroadcastCommand | null) => {
    if (!cmd || handledBroadcasts.has(cmd.id)) return;
    if (!cmd.targetTabIds.includes(tabId)) return;
    if (Date.now() - cmd.createdAt > 30_000) return;

    handledBroadcasts.add(cmd.id);
    const ok = adapter.insertText(cmd.promptText);
    if (ok && cmd.autoSubmit) {
      setTimeout(() => {
        adapter.clickSubmit();
      }, 150);
    }
  };

  const maybeNotifyBackgroundCompletion = (map: Record<string, TabStatusEntry>) => {
    if (!settings.notifyOnBackgroundDone) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    for (const entry of Object.values(map)) {
      if (entry.state !== 'done') continue;
      if (entry.tabId === tabId && !document.hidden) continue;
      const doneKey = `${entry.tabId}:${entry.startedAt}`;
      if (doneKey === lastNotifiedTabDoneKey) continue;
      if (Date.now() - entry.updatedAt > 12_000) continue;

      lastNotifiedTabDoneKey = doneKey;
      const msg = getMessages(settings.locale);
      const sec = entry.lastDurationSec ?? 1;
      new Notification(`${PLATFORM_NAMES[entry.platform]} · ${formatMsg(msg.islandDone, { sec })}`, {
        body: entry.lastPreview.slice(0, 100) || entry.title,
      });
    }
  };

  const onDocumentMouseUp = () => {
    clearChildren(selectionSlot);
    if (!settings.selectionPinbar) return;
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim() ?? '';
    if (selectedText.length < 6 || !sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const containerEl =
      range.commonAncestorContainer.nodeType === 1
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;
    if (!containerEl || host.contains(containerEl)) return;
    if (containerEl.closest('textarea, input, [contenteditable="true"]')) return;

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const msg = getMessages(settings.locale);
    const pill = el(
      'button',
      {
        className: 'cr-selection-pill',
        onClick: (e) => {
          e.stopPropagation();
          clearChildren(selectionSlot);
          sel.removeAllRanges();
          void addPin(selectedText, 'selection');
        },
      },
      svgIcon('pin', 12),
      el('span', { text: msg.pinSelectionBtn })
    );
    const topPos = Math.max(52, rect.top - 36);
    const leftPos = Math.min(window.innerWidth - 130, Math.max(12, rect.left));
    pill.style.top = `${Math.round(topPos)}px`;
    pill.style.left = `${Math.round(leftPos)}px`;
    selectionSlot.appendChild(pill);
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
    if (e.key === 'Escape') {
      clearChildren(selectionSlot);
      if (palette.isOpen()) {
        e.preventDefault();
        slashTriggeredFromInput = false;
        palette.close();
      }
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

  document.addEventListener('mouseup', onDocumentMouseUp, true);
  document.addEventListener('input', onDocumentInput, true);
  window.addEventListener('keydown', onKeyDown, true);

  let lastHref = window.location.href;
  const pollTimer = setInterval(() => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href;
      mutedIndices.clear();
      currentRunState = 'idle';
      renderChrome();
    }
    void syncTabHeartbeat();
  }, 2500);

  const unsubscribe = bridge.subscribe((changedKey) => {
    void (async () => {
      if (changedKey === 'handoff') {
        pendingHandoff = await loadActiveHandoff(bridge);
        renderChrome();
      } else if (changedKey === 'templates') {
        templates = (await bridge.get<PromptTemplate[]>('templates')) ?? [];
        palette.refresh();
      } else if (changedKey === 'pins') {
        pins = (await bridge.get<PinnedSnippet[]>('pins')) ?? [];
        renderChrome();
        palette.refresh();
      } else if (changedKey === 'tab_statuses') {
        tabStatuses = await loadActiveTabStatuses(bridge);
        maybeNotifyBackgroundCompletion(tabStatuses);
        renderIsland();
      } else if (changedKey === 'broadcast') {
        const cmd = await bridge.get<BroadcastCommand>('broadcast');
        await applyBroadcastIfTargeted(cmd);
      } else if (changedKey === 'settings') {
        settings = await loadSettings(bridge);
        renderAll();
        palette.refresh();
      }
    })();
  });

  void (async () => {
    const loaded = await loadTemplatesWithSeed(bridge);
    templates = loaded.templates;
    settings = loaded.settings;
    pins = (await bridge.get<PinnedSnippet[]>('pins')) ?? [];
    pendingHandoff = await loadActiveHandoff(bridge);
    await syncTabHeartbeat(true);
    renderAll();
  })();

  return () => {
    document.removeEventListener('mouseup', onDocumentMouseUp, true);
    document.removeEventListener('input', onDocumentInput, true);
    window.removeEventListener('keydown', onKeyDown, true);
    clearInterval(pollTimer);
    unsubscribe();
    host.remove();
  };
}
