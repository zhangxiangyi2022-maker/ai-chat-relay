import type { ChatMessage, HttpGetResponse, Locale, VerifyCandidate, VerifyResult } from '../types/index.js';

export const ALLOWED_VERIFY_ORIGINS = new Set([
  'https://registry.npmjs.org',
  'https://pypi.org',
  'https://api.github.com',
]);

export function isAllowedVerifyUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return ALLOWED_VERIFY_ORIGINS.has(parsed.origin);
  } catch {
    return false;
  }
}

const NODE_BUILTINS = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'events',
  'fs',
  'http',
  'https',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'querystring',
  'readline',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
]);

const GITHUB_RESERVED = new Set([
  'about',
  'account',
  'apps',
  'collections',
  'contact',
  'customer-stories',
  'enterprise',
  'events',
  'explore',
  'features',
  'issues',
  'login',
  'marketplace',
  'new',
  'notifications',
  'orgs',
  'pricing',
  'pulls',
  'search',
  'security',
  'settings',
  'signup',
  'sponsors',
  'topics',
  'trending',
]);

function cleanNpmPackageName(raw: string): string | null {
  const trimmed = raw.trim().replace(/^['"`]|['"`.,;:)]+$/g, '');
  if (!trimmed || trimmed.startsWith('-') || trimmed.startsWith('.') || trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('node:')) return null;

  // Strip @version suffix while preserving @scope/name
  let pkg = trimmed;
  if (pkg.startsWith('@')) {
    const slashIdx = pkg.indexOf('/');
    if (slashIdx <= 1) return null;
    const atVersion = pkg.indexOf('@', slashIdx + 1);
    if (atVersion > 0) pkg = pkg.slice(0, atVersion);
    const parts = pkg.split('/');
    if (parts.length > 2) pkg = `${parts[0]}/${parts[1]}`;
  } else {
    const atVersion = pkg.indexOf('@');
    if (atVersion > 0) pkg = pkg.slice(0, atVersion);
    const slashIdx = pkg.indexOf('/');
    if (slashIdx > 0) pkg = pkg.slice(0, slashIdx);
  }

  if (NODE_BUILTINS.has(pkg)) return null;
  if (!/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]{0,80}$/.test(pkg)) {
    return null;
  }
  return pkg;
}

function cleanPypiPackageName(raw: string): string | null {
  const trimmed = raw.trim().replace(/^['"`]|['"`.,;:)]+$/g, '');
  if (!trimmed || trimmed.startsWith('-') || trimmed.startsWith('.') || trimmed.includes('/')) return null;
  const base = trimmed.split(/[=<>!~\[]/)[0]?.trim() ?? '';
  if (!base || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,60}$/.test(base)) return null;
  return base;
}

const SUSPICIOUS_URL_RE =
  /https?:\/\/(?:example\.com|example\.org|yourdomain\.com|your-domain\.com|placeholder\.|localhost\b|127\.0\.0\.1|<[^>]+>|\[[^\]]+\])/i;

export function extractVerifyCandidates(messages: ChatMessage[]): {
  candidates: VerifyCandidate[];
  offlineWarnings: VerifyResult[];
} {
  const assistantText = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join('\n\n');

  if (!assistantText) return { candidates: [], offlineWarnings: [] };

  const seen = new Set<string>();
  const candidates: VerifyCandidate[] = [];
  const offlineWarnings: VerifyResult[] = [];

  const pushCandidate = (kind: VerifyCandidate['kind'], target: string, displayLabel: string) => {
    const key = `${kind}:${target.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ kind, target, displayLabel });
  };

  // 1. npm install / npx / pnpm / yarn / bun commands
  const npmCmdRe = /\b(?:npm\s+(?:i|install)|npx|pnpm\s+add|yarn\s+add|bun\s+(?:add|x))\s+([^\n`]+)/gi;
  for (const m of assistantText.matchAll(npmCmdRe)) {
    const tokens = (m[1] ?? '').split(/\s+/);
    for (const tok of tokens) {
      if (tok.startsWith('-')) continue;
      if (tok === '&&' || tok === ';' || tok === '|') break;
      const pkg = cleanNpmPackageName(tok);
      if (pkg) pushCandidate('npm', pkg, `npm: ${pkg}`);
    }
  }

  // 2. pip / uv install commands
  const pipCmdRe = /\b(?:pip3?\s+install|uv\s+(?:pip\s+install|add))\s+([^\n`]+)/gi;
  for (const m of assistantText.matchAll(pipCmdRe)) {
    const tokens = (m[1] ?? '').split(/\s+/);
    let skipNext = false;
    for (const tok of tokens) {
      if (skipNext) {
        skipNext = false;
        continue;
      }
      if (tok === '-r' || tok === '--requirement' || tok === '-c') {
        skipNext = true;
        continue;
      }
      if (tok.startsWith('-')) continue;
      if (tok === '&&' || tok === ';' || tok === '|') break;
      const pkg = cleanPypiPackageName(tok);
      if (pkg) pushCandidate('pypi', pkg, `PyPI: ${pkg}`);
    }
  }

  // 3. GitHub repositories
  const ghRe = /https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/gi;
  for (const m of assistantText.matchAll(ghRe)) {
    const owner = m[1] ?? '';
    const repo = (m[2] ?? '').replace(/\.git$/i, '').replace(/[),.;:]+$/, '');
    if (!owner || !repo || GITHUB_RESERVED.has(owner.toLowerCase())) continue;
    const slug = `${owner}/${repo}`;
    pushCandidate('github', slug, `GitHub: ${slug}`);
  }

  // 4. Offline suspicious/placeholder URL checks
  const urlRe = /https?:\/\/[^\s)>"'`]+/gi;
  for (const m of assistantText.matchAll(urlRe)) {
    const url = (m[0] ?? '').replace(/[.,;:!?]+$/, '');
    if (!url) continue;
    if (SUSPICIOUS_URL_RE.test(url)) {
      const key = `url:${url.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        offlineWarnings.push({
          kind: 'url',
          target: url,
          displayLabel: url,
          status: 'suspicious',
          detail: 'Placeholder or local-only URL detected',
        });
      }
    }
  }

  return { candidates: candidates.slice(0, 15), offlineWarnings: offlineWarnings.slice(0, 10) };
}

async function verifySingleCandidate(
  candidate: VerifyCandidate,
  fetcher: (url: string) => Promise<HttpGetResponse>
): Promise<VerifyResult> {
  try {
    if (candidate.kind === 'npm') {
      const url = `https://registry.npmjs.org/${encodeURIComponent(candidate.target)}`;
      const res = await fetcher(url);
      if (res.status === 404) {
        return { ...candidate, status: 'not_found', detail: '404 Not Found on npm registry' };
      }
      if (!res.ok) {
        return { ...candidate, status: 'error', detail: `HTTP ${res.status}` };
      }
      const data = JSON.parse(res.body) as { 'dist-tags'?: { latest?: string } };
      const version = data['dist-tags']?.latest;
      return {
        ...candidate,
        status: 'valid',
        version,
        detail: version ? `v${version}` : 'Exists on npm',
      };
    }

    if (candidate.kind === 'pypi') {
      const url = `https://pypi.org/pypi/${encodeURIComponent(candidate.target)}/json`;
      const res = await fetcher(url);
      if (res.status === 404) {
        return { ...candidate, status: 'not_found', detail: '404 Not Found on PyPI' };
      }
      if (!res.ok) {
        return { ...candidate, status: 'error', detail: `HTTP ${res.status}` };
      }
      const data = JSON.parse(res.body) as { info?: { version?: string } };
      const version = data.info?.version;
      return {
        ...candidate,
        status: 'valid',
        version,
        detail: version ? `v${version}` : 'Exists on PyPI',
      };
    }

    if (candidate.kind === 'github') {
      const [owner, repo] = candidate.target.split('/');
      const url = `https://api.github.com/repos/${encodeURIComponent(owner ?? '')}/${encodeURIComponent(repo ?? '')}`;
      const res = await fetcher(url);
      if (res.status === 404) {
        return { ...candidate, status: 'not_found', detail: '404 Repo not found (or private)' };
      }
      if (res.status === 403 || res.status === 429) {
        return { ...candidate, status: 'error', detail: 'GitHub API rate-limited' };
      }
      if (!res.ok) {
        return { ...candidate, status: 'error', detail: `HTTP ${res.status}` };
      }
      const data = JSON.parse(res.body) as { stargazers_count?: number };
      const stars = typeof data.stargazers_count === 'number' ? data.stargazers_count : undefined;
      return {
        ...candidate,
        status: 'valid',
        stars,
        detail: stars !== undefined ? `${stars.toLocaleString()} ★` : 'Repo exists',
      };
    }
  } catch (err) {
    return {
      ...candidate,
      status: 'error',
      detail: err instanceof Error ? err.message : 'Network error',
    };
  }

  return { ...candidate, status: 'error', detail: 'Unsupported candidate' };
}

export async function verifyCandidatesOnline(
  candidates: VerifyCandidate[],
  fetcher: (url: string) => Promise<HttpGetResponse>
): Promise<VerifyResult[]> {
  const results: VerifyResult[] = [];
  const batchSize = 4;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const slice = candidates.slice(i, i + batchSize);
    const batch = await Promise.all(slice.map((c) => verifySingleCandidate(c, fetcher)));
    results.push(...batch);
  }
  return results;
}

export function formatHallucinationFeedbackPrompt(results: VerifyResult[], locale: Locale): string {
  const issues = results.filter((r) => r.status === 'not_found' || r.status === 'suspicious');
  if (issues.length === 0) return '';
  const list = issues.map((r) => `- ${r.displayLabel}: ${r.detail}`).join('\n');
  if (locale === 'zh') {
    return `我核查了你刚才回答里提到的包名、仓库或链接，以下几项疑似不存在或不可用（404 / 占位地址）：\n\n${list}\n\n请核实后仅保留真实存在的官方包名或仓库，不要编造名称或链接，并重新给出可运行方案。`;
  }
  return `I verified the packages, repos, and links from your previous answer and found the following 404 or placeholder entries:\n\n${list}\n\nPlease replace any hallucinated entries with verified, existing packages/repositories and update your solution.`;
}
