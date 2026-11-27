import { isAllowedVerifyUrl } from '../core/verifier.js';
import type { HttpGetResponse } from '../types/index.js';

interface FetchPublicMessage {
  type: 'CHAT_RELAY_FETCH_PUBLIC';
  url: string;
}

chrome.runtime.onMessage.addListener(
  (
    message: FetchPublicMessage | undefined,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (resp: HttpGetResponse) => void
  ) => {
    if (!message || message.type !== 'CHAT_RELAY_FETCH_PUBLIC') {
      return false;
    }

    if (!isAllowedVerifyUrl(message.url)) {
      sendResponse({ ok: false, status: 403, body: 'Blocked non-allowlisted domain' });
      return false;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);

    fetch(message.url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (resp) => {
        const body = await resp.text();
        sendResponse({ ok: resp.ok, status: resp.status, body });
      })
      .catch((err: unknown) => {
        sendResponse({
          ok: false,
          status: 0,
          body: err instanceof Error ? err.message : 'Network error',
        });
      })
      .finally(() => {
        clearTimeout(timer);
      });

    return true;
  }
);
