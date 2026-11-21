import { formatMsg, getMessages, PLATFORM_NAMES } from '../i18n/index.js';
import { loadActiveHandoff, loadTemplatesWithSeed } from '../storage/bridge.js';
import { ChromeStorageBridge } from '../storage/chromeBridge.js';
import type { PlatformId } from '../types/index.js';
import { clearChildren, el } from '../ui/dom.js';

const PLATFORM_URLS: Record<PlatformId, string> = {
  chatgpt: 'https://chatgpt.com/',
  gemini: 'https://gemini.google.com/',
  claude: 'https://claude.ai/',
  deepseek: 'https://chat.deepseek.com/',
};

async function initPopup(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) return;

  const bridge = new ChromeStorageBridge();
  const render = async () => {
    const { templates, settings } = await loadTemplatesWithSeed(bridge);
    const handoff = await loadActiveHandoff(bridge);
    const msg = getMessages(settings.locale);

    clearChildren(root);

    const header = el(
      'div',
      { className: 'header' },
      el('div', {}, el('h1', { text: msg.appName }), el('p', { className: 'sub', text: msg.tagline })),
      el('button', {
        className: 'pill-btn',
        text: msg.langSwitch,
        onClick: async () => {
          await bridge.set('settings', {
            ...settings,
            locale: settings.locale === 'zh' ? 'en' : 'zh',
          });
          await render();
        },
      })
    );

    const privacyCard = el(
      'div',
      { className: 'card' },
      el('div', { className: 'meta', text: msg.privacyBadge })
    );

    const card = el('div', { className: 'card' });
    card.appendChild(el('div', { className: 'card-title', text: msg.popupStatusTitle }));

    if (handoff) {
      const source = PLATFORM_NAMES[handoff.sourcePlatform];
      const modeLabel = handoff.mode === 'compact' ? msg.handoffModeCompact : msg.handoffModeFull;
      const meta = formatMsg(msg.handoffBannerMeta, {
        included: handoff.includedCount,
        total: handoff.messageCount,
        tokens: handoff.estimatedTokens,
        mode: modeLabel,
      });
      const redactedSuffix =
        handoff.redactedCount > 0
          ? formatMsg(msg.handoffRedactedMeta, { count: handoff.redactedCount })
          : '';
      card.appendChild(
        el('div', {
          className: 'meta',
          text: `${formatMsg(msg.handoffBannerTitle, { platform: source })} · ${meta}${redactedSuffix}`,
        })
      );
      card.appendChild(
        el(
          'div',
          { className: 'actions' },
          el('button', {
            className: 'primary-btn',
            text: msg.handoffCopyBtn,
            onClick: async () => {
              await bridge.copyToClipboard(handoff.promptText);
            },
          }),
          el('button', {
            className: 'pill-btn',
            text: msg.handoffDismissBtn,
            onClick: async () => {
              await bridge.remove('handoff');
              await render();
            },
          })
        )
      );
    } else {
      card.appendChild(el('div', { className: 'meta', text: msg.popupNoHandoff }));
    }

    const linksCard = el('div', { className: 'card' });
    linksCard.appendChild(el('div', { className: 'card-title', text: msg.popupOpenSites }));
    const linkGrid = el('div', { className: 'site-grid' });
    for (const id of Object.keys(PLATFORM_URLS) as PlatformId[]) {
      linkGrid.appendChild(
        el('a', {
          className: 'site-link',
          href: PLATFORM_URLS[id],
          target: '_blank',
          rel: 'noreferrer',
          text: PLATFORM_NAMES[id],
        })
      );
    }
    linksCard.appendChild(linkGrid);

    const footer = el('div', {
      className: 'footer',
      text: formatMsg(msg.popupTemplateCount, { count: templates.length }),
    });

    root.append(header, privacyCard, card, linksCard, footer);
  };

  await render();
}

void initPopup();
