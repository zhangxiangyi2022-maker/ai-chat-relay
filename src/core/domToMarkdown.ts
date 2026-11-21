const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'SVG',
  'BUTTON',
  'SELECT',
  'OPTION',
  'TEXTAREA',
  'INPUT',
]);

const UI_CHROME_SELECTOR = [
  'button',
  '[role="button"]',
  '.copy-code',
  '.copy-button',
  '.code-block-decoration',
  '.md-code-block-banner',
  '.ds-code-block-banner',
  '[data-testid="copy-turn-action-button"]',
].join(',');

function extractKatexTex(el: Element): string | null {
  const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
  const tex = annotation?.textContent?.trim();
  if (!tex) return null;
  const isDisplay =
    el.classList.contains('katex-display') ||
    el.closest('.katex-display') !== null ||
    el.tagName.toLowerCase() === 'math-block';
  return isDisplay ? `\n$$\n${tex}\n$$\n` : `$${tex}$`;
}

function detectCodeLanguage(container: Element): string {
  const code = container.querySelector('code') ?? container;
  for (const cls of Array.from(code.classList)) {
    const m = cls.match(/^(?:language|lang)-([a-zA-Z0-9_+#.-]+)$/);
    if (m?.[1]) return m[1];
  }

  const dataLang =
    container.getAttribute('data-language') ??
    code.getAttribute('data-language') ??
    container.getAttribute('data-lang');
  if (dataLang?.trim()) return dataLang.trim().toLowerCase();

  // Check common header chrome above <pre> (ChatGPT, Claude, DeepSeek, Gemini)
  const headerSelectors = [
    '.md-code-block-banner',
    '.code-block-decoration',
    '.ds-code-block-banner',
    'div > span',
  ];
  for (const sel of headerSelectors) {
    const header = container.querySelector(sel);
    if (!header || header.contains(code)) continue;
    const candidate = header.textContent?.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
    if (
      candidate &&
      candidate !== 'copy' &&
      candidate !== '复制' &&
      candidate !== 'code' &&
      /^[a-z0-9_+#.-]{1,20}$/.test(candidate)
    ) {
      return candidate;
    }
  }

  return '';
}

function extractCodeBody(container: Element): string {
  const code = container.querySelector('pre code') ?? container.querySelector('code') ?? container.querySelector('pre') ?? container;
  // Clone-free read: walk text nodes inside `code` skipping UI buttons if pre wraps header + code
  const chunks: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      chunks.push(node.textContent ?? '');
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    if (el !== code && el.matches(UI_CHROME_SELECTOR)) return;
    if (el.tagName === 'BR') {
      chunks.push('\n');
      return;
    }
    for (const child of Array.from(el.childNodes)) {
      walk(child);
    }
  };
  walk(code);
  return chunks.join('').replace(/\r\n/g, '\n').replace(/\n+$/, '');
}

function formatCodeFence(lang: string, body: string): string {
  let longest = 2;
  const matches = body.match(/`+/g);
  if (matches) {
    for (const m of matches) {
      if (m.length > longest) longest = m.length;
    }
  }
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `\n\n${fence}${lang}\n${body}\n${fence}\n\n`;
}

function convertTable(table: Element): string {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return '';

  const matrix = rows.map((row) =>
    Array.from(row.querySelectorAll('th, td')).map((cell) =>
      nodeChildrenToMarkdown(cell, { inTableCell: true })
        .replace(/\s*\n+\s*/g, ' ')
        .replace(/\|/g, '\\|')
        .trim()
    )
  );

  const colCount = Math.max(...matrix.map((r) => r.length), 0);
  if (colCount === 0) return '';

  const normalizeRow = (r: string[]) => {
    const padded = [...r];
    while (padded.length < colCount) padded.push('');
    return `| ${padded.join(' | ')} |`;
  };

  const first = matrix[0] ?? [];
  const headerLine = normalizeRow(first);
  const sepLine = `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`;
  const bodyLines = matrix.slice(1).map(normalizeRow);
  return `\n\n${[headerLine, sepLine, ...bodyLines].join('\n')}\n\n`;
}

interface ConvertOptions {
  listDepth?: number;
  inTableCell?: boolean;
}

function isCustomCodeWrapper(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'code-block') return true;
  if (el.classList.contains('md-code-block')) return true;
  // ChatGPT/Claude wrap <pre> in a container with a header bar before <code>
  if (tag === 'pre') return true;
  return false;
}

function nodeToMarkdown(node: Node, opts: ConvertOptions = {}): string {
  if (node.nodeType === 3) {
    return (node.textContent ?? '').replace(/\u00a0/g, ' ');
  }
  if (node.nodeType !== 1) return '';

  const el = node as Element;
  const tag = el.tagName.toUpperCase();

  if (SKIP_TAGS.has(tag)) return '';
  if (el.matches('[aria-hidden="true"]') && !el.classList.contains('katex') && !el.classList.contains('katex-display')) {
    // Some UIs hide decorative spans while katex puts visual math in aria-hidden + annotation in mathml
    if (!el.querySelector('annotation[encoding="application/x-tex"]')) {
      return '';
    }
  }

  // KaTeX / Math check before general element handling
  if (
    el.classList.contains('katex-display') ||
    el.classList.contains('katex') ||
    tag === 'MATH-BLOCK' ||
    tag === 'MATH-INLINE'
  ) {
    const tex = extractKatexTex(el);
    if (tex !== null) return tex;
  }

  // Code block containers (custom code-block, DeepSeek .md-code-block, or <pre>)
  if (isCustomCodeWrapper(el)) {
    const lang = detectCodeLanguage(el);
    const body = extractCodeBody(el);
    return formatCodeFence(lang, body);
  }

  // Skip UI chrome buttons/banners that sit alongside real content
  if (el.matches(UI_CHROME_SELECTOR)) return '';

  switch (tag) {
    case 'BR':
      return opts.inTableCell ? ' ' : '  \n';
    case 'HR':
      return '\n\n---\n\n';
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6': {
      const level = Number(tag.slice(1));
      const inner = nodeChildrenToMarkdown(el, opts).trim();
      return inner ? `\n\n${'#'.repeat(level)} ${inner}\n\n` : '';
    }
    case 'P': {
      const inner = nodeChildrenToMarkdown(el, opts).trim();
      return inner ? `\n\n${inner}\n\n` : '';
    }
    case 'STRONG':
    case 'B': {
      const inner = nodeChildrenToMarkdown(el, opts).trim();
      return inner ? `**${inner}**` : '';
    }
    case 'EM':
    case 'I': {
      const inner = nodeChildrenToMarkdown(el, opts).trim();
      return inner ? `*${inner}*` : '';
    }
    case 'DEL':
    case 'S': {
      const inner = nodeChildrenToMarkdown(el, opts).trim();
      return inner ? `~~${inner}~~` : '';
    }
    case 'CODE': {
      const text = (el.textContent ?? '').replace(/\n+/g, ' ').trim();
      if (!text) return '';
      const wrap = text.includes('`') ? '``' : '`';
      return text.includes('`') ? `${wrap} ${text} ${wrap}` : `${wrap}${text}${wrap}`;
    }
    case 'A': {
      const href = el.getAttribute('href')?.trim() ?? '';
      const label = nodeChildrenToMarkdown(el, opts).trim() || href;
      if (!href || href.startsWith('javascript:')) return label;
      return `[${label}](${href})`;
    }
    case 'IMG': {
      const src = el.getAttribute('src')?.trim() ?? '';
      const alt = el.getAttribute('alt')?.trim() ?? 'image';
      return src ? `![${alt}](${src})` : '';
    }
    case 'BLOCKQUOTE': {
      const inner = nodeChildrenToMarkdown(el, opts).trim();
      if (!inner) return '';
      const quoted = inner
        .split('\n')
        .map((line) => (line.trim() ? `> ${line}` : '>'))
        .join('\n');
      return `\n\n${quoted}\n\n`;
    }
    case 'UL':
    case 'OL': {
      const depth = opts.listDepth ?? 0;
      const ordered = tag === 'OL';
      const startAttr = Number(el.getAttribute('start') ?? '1');
      let index = Number.isFinite(startAttr) ? startAttr : 1;
      const lines: string[] = [];

      for (const child of Array.from(el.children)) {
        if (child.tagName.toUpperCase() !== 'LI') continue;
        const prefix = ordered ? `${index++}. ` : '- ';
        const indent = '  '.repeat(depth);
        const itemText = nodeChildrenToMarkdown(child, {
          ...opts,
          listDepth: depth + 1,
        })
          .trim()
          .replace(/\n{2,}/g, '\n');

        if (!itemText) continue;
        const itemLines = itemText.split('\n');
        const firstLine = `${indent}${prefix}${itemLines[0] ?? ''}`;
        const restLines = itemLines.slice(1).map((line) => `${indent}  ${line}`);
        lines.push([firstLine, ...restLines].join('\n'));
      }

      return lines.length > 0 ? `\n\n${lines.join('\n')}\n\n` : '';
    }
    case 'TABLE':
      return convertTable(el);
    default:
      return nodeChildrenToMarkdown(el, opts);
  }
}

function nodeChildrenToMarkdown(parent: Element, opts: ConvertOptions): string {
  const parts: string[] = [];
  for (const child of Array.from(parent.childNodes)) {
    parts.push(nodeToMarkdown(child, opts));
  }
  return parts.join('');
}

export function domElementToMarkdown(root: Element): string {
  const raw = nodeToMarkdown(root);
  return raw
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
