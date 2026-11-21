export const SHADOW_CSS = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
  --cr-bg: rgba(255, 255, 255, 0.94);
  --cr-bg-solid: #ffffff;
  --cr-surface: #f4f5f7;
  --cr-border: rgba(15, 23, 42, 0.12);
  --cr-text: #0f172a;
  --cr-muted: #64748b;
  --cr-accent: #2563eb;
  --cr-accent-hover: #1d4ed8;
  --cr-accent-soft: rgba(37, 99, 235, 0.1);
  --cr-danger: #dc2626;
  --cr-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
}

@media (prefers-color-scheme: dark) {
  :host {
    --cr-bg: rgba(24, 24, 27, 0.92);
    --cr-bg-solid: #18181b;
    --cr-surface: #27272a;
    --cr-border: rgba(255, 255, 255, 0.14);
    --cr-text: #f4f4f5;
    --cr-muted: #a1a1aa;
    --cr-accent: #3b82f6;
    --cr-accent-hover: #60a5fa;
    --cr-accent-soft: rgba(59, 130, 246, 0.18);
    --cr-danger: #f87171;
    --cr-shadow: 0 14px 36px rgba(0, 0, 0, 0.48);
  }
}

* {
  box-sizing: border-box;
}

.cr-anchor {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483640;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  color: var(--cr-text);
  font-size: 13px;
}

.cr-dock {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 6px;
  background: var(--cr-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--cr-border);
  border-radius: 999px;
  box-shadow: var(--cr-shadow);
}

.cr-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--cr-text);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.cr-btn:hover {
  background: var(--cr-surface);
}

.cr-btn-primary {
  background: var(--cr-accent);
  color: #ffffff;
}

.cr-btn-primary:hover {
  background: var(--cr-accent-hover);
  color: #ffffff;
}

.cr-btn-subtle {
  background: var(--cr-surface);
  color: var(--cr-text);
  border-radius: 8px;
  height: 28px;
  padding: 0 9px;
}

.cr-btn-danger {
  color: var(--cr-danger);
}

.cr-btn-icon {
  width: 30px;
  padding: 0;
  justify-content: center;
}

.cr-handoff-banner {
  max-width: 360px;
  padding: 10px 12px;
  background: var(--cr-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--cr-accent);
  border-radius: 14px;
  box-shadow: var(--cr-shadow);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cr-handoff-title {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--cr-text);
}

.cr-handoff-meta {
  font-size: 11px;
  color: var(--cr-muted);
}

.cr-handoff-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.cr-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483645;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: min(11vh, 88px);
}

.cr-modal {
  width: min(640px, 92vw);
  max-height: 76vh;
  background: var(--cr-bg-solid);
  color: var(--cr-text);
  border: 1px solid var(--cr-border);
  border-radius: 16px;
  box-shadow: var(--cr-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cr-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--cr-border);
  gap: 10px;
}

.cr-modal-title {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 7px;
}

.cr-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--cr-border);
}

.cr-search {
  flex: 1 1 200px;
  height: 34px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--cr-border);
  background: var(--cr-surface);
  color: var(--cr-text);
  font-size: 13px;
  outline: none;
}

.cr-search:focus {
  border-color: var(--cr-accent);
}

.cr-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cr-item {
  border: 1px solid var(--cr-border);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: transparent;
  transition: border-color 0.12s ease, background 0.12s ease;
}

.cr-item.is-active,
.cr-item:hover {
  border-color: var(--cr-accent);
  background: var(--cr-accent-soft);
}

.cr-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cr-item-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  min-width: 0;
}

.cr-cmd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--cr-accent-soft);
  color: var(--cr-accent);
}

.cr-item-title {
  font-size: 13px;
  font-weight: 600;
}

.cr-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--cr-surface);
  color: var(--cr-muted);
}

.cr-item-preview {
  font-size: 12px;
  color: var(--cr-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.cr-form {
  padding: 14px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cr-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cr-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--cr-text);
}

.cr-hint {
  font-size: 11px;
  color: var(--cr-muted);
}

.cr-input,
.cr-textarea {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--cr-border);
  background: var(--cr-surface);
  color: var(--cr-text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
}

.cr-input:focus,
.cr-textarea:focus {
  border-color: var(--cr-accent);
}

.cr-textarea {
  resize: vertical;
  min-height: 110px;
  line-height: 1.45;
}

.cr-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.cr-row-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--cr-border);
  border-radius: 10px;
}

.cr-radio-group {
  display: flex;
  gap: 6px;
}

.cr-empty {
  text-align: center;
  color: var(--cr-muted);
  padding: 28px 12px;
  font-size: 13px;
}

.cr-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  background: var(--cr-bg-solid);
  color: var(--cr-text);
  border: 1px solid var(--cr-accent);
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: var(--cr-shadow);
  pointer-events: none;
}
`;
