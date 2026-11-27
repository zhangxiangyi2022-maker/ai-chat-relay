import { formatMsg, getMessages, PLATFORM_NAMES } from '../i18n/index.js';
import type { Locale, TabStatusEntry } from '../types/index.js';
import { clearChildren, el, svgIcon } from './dom.js';

export interface IslandCallbacks {
  onSendBroadcast: (promptText: string, targetTabIds: string[], autoSubmit: boolean) => Promise<void>;
  onCopyPreview: (text: string) => Promise<void>;
  onEnableNotifications: () => Promise<void>;
}

export class DynamicIsland {
  private readonly root: HTMLElement;
  private readonly callbacks: IslandCallbacks;
  private popoverMode: 'none' | 'broadcast' | 'preview' = 'none';
  private previewTabId: string | null = null;
  private collapsed = false;

  constructor(container: HTMLElement, callbacks: IslandCallbacks) {
    this.root = container;
    this.callbacks = callbacks;
  }

  isOpenPopover(): boolean {
    return this.popoverMode !== 'none';
  }

  render(
    tabs: TabStatusEntry[],
    currentTabId: string,
    locale: Locale,
    visible: boolean,
    notifyEnabled: boolean
  ): void {
    // Avoid blowing away user's in-progress broadcast textarea while typing
    if (this.popoverMode === 'broadcast' && this.root.querySelector('.cr-island-popover textarea')) {
      this.updateChipStripOnly(tabs, currentTabId, locale, visible, notifyEnabled);
      return;
    }

    clearChildren(this.root);
    if (!visible) return;

    const msg = getMessages(locale);
    const wrap = el('div', { className: 'cr-island-wrap' });
    const bar = el('div', { className: 'cr-island' });

    const toggleCollapse = el(
      'button',
      {
        className: 'cr-island-chip',
        title: msg.islandTitle,
        onClick: () => {
          this.collapsed = !this.collapsed;
          if (this.collapsed) this.popoverMode = 'none';
          this.render(tabs, currentTabId, locale, visible, notifyEnabled);
        },
      },
      svgIcon('radar', 13),
      el('span', { text: this.collapsed ? `${msg.islandTitle} (${tabs.length})` : msg.islandTitle })
    );
    bar.appendChild(toggleCollapse);

    if (!this.collapsed) {
      const sorted = [...tabs].sort((a, b) => (a.tabId === currentTabId ? -1 : b.tabId === currentTabId ? 1 : b.updatedAt - a.updatedAt));
      const now = Date.now();
      for (const tab of sorted.slice(0, 6)) {
        const dotClass =
          tab.state === 'streaming'
            ? 'cr-dot cr-dot-streaming'
            : tab.state === 'done'
              ? 'cr-dot cr-dot-done'
              : 'cr-dot cr-dot-idle';
        const sec =
          tab.state === 'streaming'
            ? Math.max(1, Math.round((now - tab.startedAt) / 1000))
            : tab.lastDurationSec ?? 0;
        const labelSuffix =
          tab.state === 'streaming'
            ? formatMsg(msg.islandStreaming, { sec })
            : tab.state === 'done'
              ? formatMsg(msg.islandDone, { sec })
              : msg.islandIdle;

        const chip = el(
          'button',
          {
            className: 'cr-island-chip',
            title: tab.title,
            onClick: () => {
              if (this.popoverMode === 'preview' && this.previewTabId === tab.tabId) {
                this.popoverMode = 'none';
              } else {
                this.previewTabId = tab.tabId;
                this.popoverMode = 'preview';
              }
              this.render(tabs, currentTabId, locale, visible, notifyEnabled);
            },
          },
          el('span', { className: dotClass }),
          el('span', { text: `${PLATFORM_NAMES[tab.platform]} · ${labelSuffix}` })
        );
        bar.appendChild(chip);
      }

      bar.appendChild(
        el(
          'button',
          {
            className: 'cr-island-btn',
            onClick: () => {
              this.popoverMode = this.popoverMode === 'broadcast' ? 'none' : 'broadcast';
              this.render(tabs, currentTabId, locale, visible, notifyEnabled);
            },
          },
          svgIcon('send', 12),
          el('span', { text: msg.islandBroadcastBtn })
        )
      );

      if (notifyEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        bar.appendChild(
          el(
            'button',
            {
              className: 'cr-island-chip',
              onClick: () => void this.callbacks.onEnableNotifications(),
            },
            svgIcon('bell', 12),
            el('span', { text: msg.islandNotifyBtn })
          )
        );
      }
    }

    wrap.appendChild(bar);

    if (!this.collapsed && this.popoverMode === 'broadcast') {
      wrap.appendChild(this.buildBroadcastPopover(tabs, locale));
    } else if (!this.collapsed && this.popoverMode === 'preview' && this.previewTabId) {
      const targetTab = tabs.find((t) => t.tabId === this.previewTabId);
      if (targetTab) {
        wrap.appendChild(this.buildPreviewPopover(targetTab, locale));
      }
    }

    this.root.appendChild(wrap);
  }

  private updateChipStripOnly(
    tabs: TabStatusEntry[],
    currentTabId: string,
    locale: Locale,
    visible: boolean,
    notifyEnabled: boolean
  ): void {
    const existingArea = this.root.querySelector<HTMLTextAreaElement>('.cr-island-popover textarea');
    const draft = existingArea?.value ?? '';
    clearChildren(this.root);
    this.render(tabs, currentTabId, locale, visible, notifyEnabled);
    const nextArea = this.root.querySelector<HTMLTextAreaElement>('.cr-island-popover textarea');
    if (nextArea && draft) {
      nextArea.value = draft;
    }
  }

  private buildBroadcastPopover(tabs: TabStatusEntry[], locale: Locale): HTMLElement {
    const msg = getMessages(locale);
    const selectedIds = new Set(tabs.map((t) => t.tabId));
    let autoSubmit = false;

    const area = el('textarea', {
      className: 'cr-textarea',
      rows: 3,
      placeholder: msg.broadcastPlaceholder,
    });

    const checksWrap = el('div', { className: 'cr-target-checks' });
    for (const tab of tabs) {
      const checkbox = el('input', {
        type: 'checkbox',
        checked: true,
        onChange: (e) => {
          if ((e.target as HTMLInputElement).checked) selectedIds.add(tab.tabId);
          else selectedIds.delete(tab.tabId);
        },
      });
      checksWrap.appendChild(
        el(
          'label',
          { className: 'cr-check-pill' },
          checkbox,
          el('span', { text: `${PLATFORM_NAMES[tab.platform]} (${tab.title.slice(0, 14)})` })
        )
      );
    }

    const autoSubmitCheckbox = el('input', {
      type: 'checkbox',
      checked: false,
      onChange: (e) => {
        autoSubmit = (e.target as HTMLInputElement).checked;
      },
    });

    return el(
      'div',
      { className: 'cr-island-popover' },
      el(
        'div',
        { className: 'cr-item-top' },
        el('strong', { text: msg.broadcastTitle }),
        el(
          'button',
          {
            className: 'cr-btn cr-btn-icon',
            onClick: () => {
              this.popoverMode = 'none';
              clearChildren(this.root.querySelector('.cr-island-popover')?.parentElement ?? this.root);
            },
          },
          svgIcon('close', 14)
        )
      ),
      area,
      el('div', { className: 'cr-hint', text: msg.broadcastTargetsLabel }),
      checksWrap,
      el('label', { className: 'cr-row-switch' }, el('span', { text: msg.broadcastAutoSubmitLabel }), autoSubmitCheckbox),
      el(
        'div',
        { className: 'cr-form-footer' },
        el('button', {
          className: 'cr-btn cr-btn-primary',
          text: msg.broadcastSendBtn,
          onClick: () => {
            const prompt = area.value;
            this.popoverMode = 'none';
            void this.callbacks.onSendBroadcast(prompt, Array.from(selectedIds), autoSubmit);
          },
        })
      )
    );
  }

  private buildPreviewPopover(tab: TabStatusEntry, locale: Locale): HTMLElement {
    const msg = getMessages(locale);
    return el(
      'div',
      { className: 'cr-island-popover' },
      el(
        'div',
        { className: 'cr-item-top' },
        el('strong', { text: `${PLATFORM_NAMES[tab.platform]} · ${tab.title}` }),
        el(
          'button',
          {
            className: 'cr-btn cr-btn-icon',
            onClick: () => {
              this.popoverMode = 'none';
              this.root.querySelector('.cr-island-popover')?.remove();
            },
          },
          svgIcon('close', 14)
        )
      ),
      el('div', { className: 'cr-pin-body', text: tab.lastPreview || msg.toastNoMessages }),
      el(
        'div',
        { className: 'cr-form-footer' },
        tab.lastPreview
          ? el('button', {
              className: 'cr-btn cr-btn-subtle',
              text: msg.handoffCopyBtn,
              onClick: () => void this.callbacks.onCopyPreview(tab.lastPreview),
            })
          : null
      )
    );
  }
}
