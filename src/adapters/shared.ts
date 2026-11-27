import { domElementToMarkdown } from '../core/domToMarkdown.js';
import type { ChatMessage, ExtractedMessageNode, MessageRole } from '../types/index.js';

export function queryFirst(selectors: readonly string[], root: ParentNode = document): HTMLElement | null {
  for (const sel of selectors) {
    try {
      const found = root.querySelector<HTMLElement>(sel);
      if (found) return found;
    } catch {
      // Ignore invalid selector in older DOM engines
    }
  }
  return null;
}

export function hasVisibleMatch(selectors: readonly string[], root: ParentNode = document): boolean {
  for (const sel of selectors) {
    try {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(sel));
      if (nodes.some((n) => isElementVisible(n))) return true;
    } catch {
      // Ignore invalid selector
    }
  }
  return false;
}

export function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const style = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null;
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
  return true;
}

export function readInputText(el: HTMLElement | null | undefined): string {
  if (!el) return '';
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return el.innerText ?? el.textContent ?? '';
}

function setNativeTextareaValue(el: HTMLTextAreaElement | HTMLInputElement, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor?.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function stripTrailingSlashToken(text: string): string {
  return text.replace(/(?:^|\s)\/[^\s/]*$/, (m) => (m.startsWith(' ') || m.startsWith('\n') ? m[0] ?? '' : ''));
}

export function insertIntoInputElement(
  el: HTMLElement,
  text: string,
  options: { replaceTrailingSlashQuery?: boolean } = {}
): boolean {
  el.focus();

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    let base = el.value;
    if (options.replaceTrailingSlashQuery) {
      base = stripTrailingSlashToken(base);
    }
    const needsNewline = base.trim().length > 0 && !base.endsWith('\n') && !base.endsWith(' ');
    const next = base ? `${base}${needsNewline ? '\n\n' : ''}${text}` : text;
    setNativeTextareaValue(el, next);
    el.setSelectionRange(next.length, next.length);
    return true;
  }

  const existing = (el.innerText ?? el.textContent ?? '').trim();
  if (options.replaceTrailingSlashQuery) {
    const raw = el.innerText ?? el.textContent ?? '';
    const cleaned = stripTrailingSlashToken(raw);
    if (cleaned !== raw) {
      setContentEditablePlainText(el, cleaned);
    }
  } else if (existing.length > 0 && typeof window !== 'undefined' && typeof document.createRange === 'function') {
    moveCaretToEnd(el);
  }

  const shouldPrefixBreak = (el.innerText ?? el.textContent ?? '').trim().length > 0;
  const payload = shouldPrefixBreak ? `\n\n${text}` : text;

  try {
    if (typeof document.execCommand === 'function') {
      moveCaretToEnd(el);
      const ok = document.execCommand('insertText', false, payload);
      if (ok && (el.textContent ?? '').includes(text.slice(0, 12))) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
  } catch {
    // Fall through to safe DOM text assignment
  }

  const baseText = (el.innerText ?? el.textContent ?? '').trimEnd();
  setContentEditablePlainText(el, baseText ? `${baseText}\n\n${text}` : text);
  return true;
}

export function clickSubmitControl(buttonSelectors: readonly string[], inputEl: HTMLElement | null): boolean {
  for (const sel of buttonSelectors) {
    try {
      const btn = document.querySelector<HTMLElement>(sel);
      if (btn && isElementVisible(btn)) {
        const disabled =
          (btn instanceof HTMLButtonElement && btn.disabled) ||
          btn.getAttribute('aria-disabled') === 'true';
        if (!disabled) {
          btn.click();
          return true;
        }
      }
    } catch {
      // Ignore invalid selector
    }
  }

  if (inputEl) {
    inputEl.focus();
    inputEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true })
    );
    return true;
  }
  return false;
}

function setContentEditablePlainText(el: HTMLElement, text: string): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
  const lines = text.split('\n');
  for (const line of lines) {
    const p = document.createElement('p');
    if (line.length > 0) {
      p.textContent = line;
    } else {
      p.appendChild(document.createElement('br'));
    }
    el.appendChild(p);
  }
  moveCaretToEnd(el);
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
}

function moveCaretToEnd(el: HTMLElement): void {
  try {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    // Ignore selection errors in headless DOM tests
  }
}

export function cleanDocumentTitle(rawTitle: string, suffixes: string[]): string {
  let title = rawTitle.trim();
  for (const s of suffixes) {
    if (title.endsWith(s)) {
      title = title.slice(0, -s.length).trim();
    }
  }
  return title;
}

export function toPlainMessages(nodes: ExtractedMessageNode[]): ChatMessage[] {
  return nodes.map(({ role, content, thinking }) => (thinking ? { role, content, thinking } : { role, content }));
}

export function buildMessageNode(
  index: number,
  role: MessageRole,
  node: Element,
  anchorEl: HTMLElement | null,
  thinkingNode?: Element | null
): ExtractedMessageNode | null {
  const content = domElementToMarkdown(node).trim();
  if (!content) return null;
  const thinking = thinkingNode ? domElementToMarkdown(thinkingNode).trim() : undefined;
  return thinking
    ? { index, role, content, thinking, element: anchorEl }
    : { index, role, content, element: anchorEl };
}
