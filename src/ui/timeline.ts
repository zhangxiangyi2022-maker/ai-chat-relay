import { getMessages, PLATFORM_NAMES } from '../i18n/index.js';
import type { Locale, PlatformId, TimelineNode } from '../types/index.js';
import { clearChildren, el, svgIcon } from './dom.js';

export interface TimelineCallbacks {
  onJump: (node: TimelineNode) => void;
  onFork: (node: TimelineNode) => void;
  onPinTurn: (node: TimelineNode) => void;
  onToggleMute: (node: TimelineNode) => void;
}

export class MetroTimeline {
  private readonly root: HTMLElement;
  private readonly callbacks: TimelineCallbacks;
  private hoverCard: HTMLElement | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private hoveredIndex: number | null = null;

  constructor(container: HTMLElement, callbacks: TimelineCallbacks) {
    this.root = container;
    this.callbacks = callbacks;
  }

  render(nodes: TimelineNode[], platform: PlatformId, locale: Locale, visible: boolean): void {
    clearChildren(this.root);
    this.hoverCard = null;
    if (!visible || nodes.length === 0) return;

    const msg = getMessages(locale);
    const rail = el('div', { className: 'cr-timeline' });
    const cardSlot = el('div');

    const closeCardSoon = () => {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        this.hoveredIndex = null;
        clearChildren(cardSlot);
      }, 220);
    };

    const keepCard = () => {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    };

    const showCardFor = (node: TimelineNode, dotBtn: HTMLElement) => {
      keepCard();
      this.hoveredIndex = node.index;
      clearChildren(cardSlot);

      const roleName =
        node.role === 'user' ? (locale === 'zh' ? '你' : 'You') : PLATFORM_NAMES[platform];
      const chips: HTMLElement[] = [];
      if (node.hasCode) chips.push(el('span', { className: 'cr-tag', text: msg.timelineCodeChip }));
      if (node.hasMath) chips.push(el('span', { className: 'cr-tag', text: msg.timelineMathChip }));
      if (node.hasTable) chips.push(el('span', { className: 'cr-tag', text: msg.timelineTableChip }));
      if (node.muted) chips.push(el('span', { className: 'cr-tag cr-status-bad', text: msg.timelineMutedChip }));

      const card = el(
        'div',
        {
          className: 'cr-tl-card',
          onMouseEnter: keepCard,
          onMouseLeave: closeCardSoon,
        },
        el(
          'div',
          { className: 'cr-tl-card-head' },
          el('span', { text: `#${node.index + 1} · ${roleName}` }),
          el('div', { className: 'cr-item-actions' }, ...chips)
        ),
        el('div', { className: 'cr-tl-preview', text: node.preview || '...' }),
        el(
          'div',
          { className: 'cr-tl-actions' },
          el('button', {
            className: 'cr-btn cr-btn-subtle',
            text: msg.timelineJumpBtn,
            onClick: () => this.callbacks.onJump(node),
          }),
          el(
            'button',
            {
              className: 'cr-btn cr-btn-primary',
              onClick: () => {
                clearChildren(cardSlot);
                this.callbacks.onFork(node);
              },
            },
            svgIcon('fork', 12),
            el('span', { text: msg.timelineForkBtn })
          ),
          el(
            'button',
            {
              className: 'cr-btn cr-btn-subtle',
              onClick: () => this.callbacks.onPinTurn(node),
            },
            svgIcon('pin', 12),
            el('span', { text: msg.timelinePinBtn })
          ),
          el(
            'button',
            {
              className: `cr-btn cr-btn-subtle${node.muted ? ' cr-btn-danger' : ''}`,
              onClick: () => {
                clearChildren(cardSlot);
                this.callbacks.onToggleMute(node);
              },
            },
            svgIcon('mute', 12),
            el('span', { text: node.muted ? msg.timelineUnmuteBtn : msg.timelineMuteBtn })
          )
        )
      );

      const rect = dotBtn.getBoundingClientRect();
      const clampedTop = Math.max(56, Math.min(window.innerHeight - 170, rect.top - 24));
      card.style.top = `${Math.round(clampedTop)}px`;
      this.hoverCard = card;
      cardSlot.appendChild(card);
    };

    for (const node of nodes) {
      const hasArtifact = node.hasCode || node.hasMath || node.hasTable;
      const dotCls = [
        'cr-tl-dot',
        node.role === 'user' ? 'is-user' : 'is-assistant',
        hasArtifact ? 'has-artifact' : '',
        node.muted ? 'is-muted' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const dot = el('button', {
        className: dotCls,
        title: `#${node.index + 1}`,
        onClick: () => this.callbacks.onJump(node),
        onMouseEnter: (e) => showCardFor(node, e.currentTarget as HTMLElement),
        onMouseLeave: closeCardSoon,
      });

      rail.appendChild(el('div', { className: 'cr-tl-node' }, dot));
    }

    this.root.append(rail, cardSlot);

    if (this.hoveredIndex !== null && this.hoverCard === null) {
      // Keep card closed cleanly across re-renders
      this.hoveredIndex = null;
    }
  }
}
