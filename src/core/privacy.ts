export interface RedactOptions {
  redactSecrets: boolean;
  redactPii: boolean;
}

export interface RedactResult {
  text: string;
  redactedCount: number;
}

const PLACEHOLDER_VALUE_RE = /^(?:your[_-]|xxx+|placeholder|example|changeme|null|none|true|false|<[^>]+>|\[REDACTED[^\]]*\])$/i;

function replaceWithCount(
  input: string,
  regex: RegExp,
  replacer: string | ((...args: string[]) => string),
  counter: { count: number }
): string {
  return input.replace(regex, (...args) => {
    const full = args[0] ?? '';
    const next = typeof replacer === 'function' ? replacer(...args) : replacer;
    if (next !== full) {
      counter.count++;
    }
    return next;
  });
}

export function redactSensitiveText(input: string, opts: RedactOptions): RedactResult {
  if (!input || (!opts.redactSecrets && !opts.redactPii)) {
    return { text: input, redactedCount: 0 };
  }

  let text = input;
  const counter = { count: 0 };

  if (opts.redactSecrets) {
    // 1. PEM Private Keys
    text = replaceWithCount(
      text,
      /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g,
      '[REDACTED_PRIVATE_KEY]',
      counter
    );

    // 2. Bearer JWT / Authorization headers
    text = replaceWithCount(
      text,
      /(Authorization\s*:\s*Bearer\s+)[A-Za-z0-9._~+/-]{12,}=*/gi,
      '$1[REDACTED_TOKEN]',
      counter
    );
    text = replaceWithCount(
      text,
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/g,
      '[REDACTED_JWT]',
      counter
    );

    // 3. Well-known API key prefixes
    text = replaceWithCount(
      text,
      /\b(?:sk-(?:proj-|ant-|live-|test-)?[A-Za-z0-9_-]{16,})\b/g,
      '[REDACTED_API_KEY]',
      counter
    );
    text = replaceWithCount(text, /\bAIza[0-9A-Za-z_-]{20,}\b/g, '[REDACTED_GOOGLE_KEY]', counter);
    text = replaceWithCount(
      text,
      /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
      '[REDACTED_GITHUB_TOKEN]',
      counter
    );
    text = replaceWithCount(text, /\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED_AWS_KEY]', counter);
    text = replaceWithCount(text, /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g, '[REDACTED_SLACK_TOKEN]', counter);
    text = replaceWithCount(text, /\bhf_[A-Za-z0-9]{20,}\b/g, '[REDACTED_HF_TOKEN]', counter);

    // 4. Passwords inside connection URLs (e.g. postgres://user:pass@host)
    text = replaceWithCount(
      text,
      /(\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|amqp|amqps|https?):\/\/[^:\s/@]+:)([^@\s/]+)(@)/gi,
      (_full, prefix: string, secret: string, at: string) =>
        secret.startsWith('[REDACTED') ? _full : `${prefix}[REDACTED_PASSWORD]${at}`,
      counter
    );

    // 5. Key=Value env secrets while preserving variable name for debugging
    text = replaceWithCount(
      text,
      /\b([A-Z0-9_]*(?:API_KEY|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY|CLIENT_SECRET|DB_PASSWORD|PASSWORD|SECRET|TOKEN)\s*[:=]\s*)(["']?)([^\s"'`]{8,})\2/g,
      (full, prefix: string, quote: string, val: string) => {
        if (PLACEHOLDER_VALUE_RE.test(val) || val.startsWith('[REDACTED')) return full;
        return `${prefix}${quote}[REDACTED_VALUE]${quote}`;
      },
      counter
    );
  }

  if (opts.redactPii) {
    // 1. Emails (preserve synthetic example domains)
    text = replaceWithCount(
      text,
      /\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
      (full, domain: string) => {
        const lower = domain.toLowerCase();
        if (lower === 'example.com' || lower === 'example.org' || lower === 'users.noreply.github.com') {
          return full;
        }
        return '[REDACTED_EMAIL]';
      },
      counter
    );

    // 2. Mainland China mobile numbers
    text = replaceWithCount(
      text,
      /(?<!\d)(?:\+?86[-\s]?)?1[3-9]\d{9}(?!\d)/g,
      '[REDACTED_PHONE]',
      counter
    );

    // 3. Formatted international phone numbers with explicit separators
    text = replaceWithCount(
      text,
      /(?<!\w)(?:\+\d{1,3}[-\s.]?)?\(?\d{3}\)?[-\s.]\d{3}[-\s.]\d{4}(?!\d)/g,
      '[REDACTED_PHONE]',
      counter
    );

    // 4. 18-digit National ID numbers
    text = replaceWithCount(
      text,
      /(?<!\d)[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx](?!\d)/g,
      '[REDACTED_ID_CARD]',
      counter
    );

    // 5. Grouped 16-digit payment card numbers
    text = replaceWithCount(
      text,
      /(?<!\d)(?:\d{4}[-\s]){3}\d{4}(?!\d)/g,
      '[REDACTED_CARD]',
      counter
    );
  }

  return { text, redactedCount: counter.count };
}

export function computeUrlFingerprint(rawUrl: string): string {
  // Non-reversible FNV-1a 32-bit hash so storage never holds raw conversation URLs
  let hash = 0x811c9dc5;
  for (let i = 0; i < rawUrl.length; i++) {
    hash ^= rawUrl.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function sanitizeUrlForDisplay(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return `${u.origin}${u.pathname}`;
  } catch {
    return rawUrl.split('?')[0]?.split('#')[0] ?? '';
  }
}
