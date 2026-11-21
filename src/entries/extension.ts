import { resolveSiteAdapter } from '../adapters/index.js';
import { ChromeStorageBridge } from '../storage/chromeBridge.js';
import { mountChatRelay } from '../ui/app.js';

function bootstrap(): void {
  const adapter = resolveSiteAdapter(window.location.hostname);
  if (!adapter) return;
  const bridge = new ChromeStorageBridge();
  mountChatRelay({ adapter, bridge });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
