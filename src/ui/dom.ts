export type IconName =
  | 'relay'
  | 'slash'
  | 'download'
  | 'settings'
  | 'close'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'copy'
  | 'upload'
  | 'sparkles'
  | 'pin'
  | 'shield'
  | 'radar'
  | 'fork'
  | 'send'
  | 'bell'
  | 'mute';

type ChildInput = Node | string | null | undefined | false;

export interface ElProps {
  className?: string;
  text?: string;
  id?: string;
  title?: string;
  type?: string;
  value?: string;
  checked?: boolean;
  placeholder?: string;
  rows?: number;
  min?: string;
  max?: string;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  dataset?: Record<string, string>;
  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: ElProps,
  ...children: ChildInput[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props) {
    if (props.className) node.className = props.className;
    if (props.id) node.id = props.id;
    if (props.title) node.title = props.title;
    if (props.text !== undefined) node.textContent = props.text;
    if (props.dataset) {
      for (const [k, v] of Object.entries(props.dataset)) {
        node.dataset[k] = v;
      }
    }
    if (node instanceof HTMLButtonElement || node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      if (props.disabled !== undefined) node.disabled = props.disabled;
    }
    if (node instanceof HTMLInputElement) {
      if (props.type) node.type = props.type;
      if (props.value !== undefined) node.value = props.value;
      if (props.checked !== undefined) node.checked = props.checked;
      if (props.placeholder) node.placeholder = props.placeholder;
      if (props.min) node.min = props.min;
      if (props.max) node.max = props.max;
    }
    if (node instanceof HTMLTextAreaElement) {
      if (props.value !== undefined) node.value = props.value;
      if (props.placeholder) node.placeholder = props.placeholder;
      if (props.rows) node.rows = props.rows;
    }
    if (node instanceof HTMLAnchorElement) {
      if (props.href) node.href = props.href;
      if (props.target) node.target = props.target;
      if (props.rel) node.rel = props.rel;
    }
    const htmlNode = node as HTMLElement;
    if (props.onClick) htmlNode.addEventListener('click', props.onClick);
    if (props.onMouseEnter) htmlNode.addEventListener('mouseenter', props.onMouseEnter);
    if (props.onMouseLeave) htmlNode.addEventListener('mouseleave', props.onMouseLeave);
    if (props.onInput) htmlNode.addEventListener('input', props.onInput);
    if (props.onChange) htmlNode.addEventListener('change', props.onChange);
    if (props.onKeyDown) htmlNode.addEventListener('keydown', props.onKeyDown);
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string') {
      node.appendChild(document.createTextNode(child));
    } else {
      node.appendChild(child);
    }
  }
  return node;
}

export function clearChildren(node: Element): void {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICON_PATHS: Record<IconName, string[]> = {
  relay: ['M17 1l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 23l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'],
  slash: ['M7 20L17 4'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  ],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  plus: ['M12 5v14', 'M5 12h14'],
  edit: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  copy: ['M9 9h13v13H9z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  sparkles: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z', 'M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z'],
  pin: ['M12 17v5', 'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
  radar: ['M12 2a10 10 0 1 0 10 10', 'M12 12l6-6', 'M12 6a6 6 0 1 0 6 6'],
  fork: ['M6 3v12', 'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 9a9 9 0 0 1-9 9'],
  send: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  mute: ['M11 5L6 9H2v6h4l5 4V5z', 'M23 9l-6 6', 'M17 9l6 6'],
};

export function svgIcon(name: IconName, size = 15): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  for (const d of ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}
