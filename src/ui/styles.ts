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
  --cr-accent-soft: rgba(37, 99, 235, 0.12);
  --cr-emerald: #10b981;
  --cr-amber: #f59e0b;
  --cr-danger: #ef4444;
  --cr-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  --cr-island-bg: rgba(15, 23, 42, 0.9);
  --cr-island-text: #f8fafc;
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
    --cr-emerald: #34d399;
    --cr-amber: #fbbf24;
    --cr-danger: #f87171;
    --cr-shadow: 0 14px 36px rgba(0, 0, 0, 0.48);
    --cr-island-bg: rgba(17, 17, 21, 0.94);
    --cr-island-text: #f4f4f5;
  }
}

* {
  box-sizing: border-box;
}

/* ---------- Top Dynamic Island Radar ---------- */
.cr-island-wrap {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483638;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.cr-island {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--cr-island-bg);
  color: var(--cr-island-text);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  font-size: 12px;
  max-width: 92vw;
  overflow-x: auto;
}

.cr-island-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--cr-island-text);
  border: none;
  font-size: 11.5px;
  cursor: pointer;
  white-space: nowrap;
}

.cr-island-chip:hover {
  background: rgba(255, 255, 255, 0.16);
}

.cr-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.cr-dot-idle {
  background: #94a3b8;
}

.cr-dot-done {
  background: var(--cr-emerald);
}

.cr-dot-streaming {
  background: var(--cr-amber);
  animation: cr-pulse 1.1s infinite ease-in-out;
}

@keyframes cr-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.45); opacity: 0.55; }
}

.cr-island-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  border: none;
  background: rgba(59, 130, 246, 0.28);
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.cr-island-btn:hover {
  background: rgba(59, 130, 246, 0.45);
}

.cr-island-popover {
  width: min(460px, 90vw);
  padding: 12px 14px;
  background: var(--cr-bg-solid);
  color: var(--cr-text);
  border: 1px solid var(--cr-border);
  border-radius: 14px;
  box-shadow: var(--cr-shadow);
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 12.5px;
}

.cr-target-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cr-check-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid var(--cr-border);
  background: var(--cr-surface);
  font-size: 12px;
  cursor: pointer;
}

/* ---------- Right Metro Timeline Rail ---------- */
.cr-timeline {
  position: fixed;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2147483635;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  background: var(--cr-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--cr-border);
  border-radius: 999px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.14);
  max-height: 58vh;
  overflow-y: auto;
}

.cr-tl-node {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cr-tl-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid var(--cr-bg-solid);
  padding: 0;
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}

.cr-tl-dot.is-user {
  background: var(--cr-accent);
}

.cr-tl-dot.is-assistant {
  background: var(--cr-emerald);
}

.cr-tl-dot.has-artifact {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.55);
}

.cr-tl-dot.is-muted {
  background: var(--cr-muted);
  opacity: 0.35;
}

.cr-tl-dot:hover {
  transform: scale(1.35);
}

.cr-tl-card {
  position: fixed;
  right: 48px;
  width: 295px;
  padding: 10px 12px;
  background: var(--cr-bg-solid);
  color: var(--cr-text);
  border: 1px solid var(--cr-border);
  border-radius: 12px;
  box-shadow: var(--cr-shadow);
  z-index: 2147483639;
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 12px;
}

.cr-tl-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-weight: 600;
}

.cr-tl-preview {
  color: var(--cr-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cr-tl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* ---------- Selection Pin Pill ---------- */
.cr-selection-pill {
  position: fixed;
  z-index: 2147483642;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: var(--cr-island-bg);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow: var(--cr-shadow);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.cr-selection-pill:hover {
  background: var(--cr-accent);
}

/* ---------- Bottom-Right Cockpit Dock ---------- */
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
  gap: 3px;
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
  padding: 0 9px;
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
  height: 27px;
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

.cr-badge-count {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--cr-accent-soft);
  color: var(--cr-accent);
}

.cr-handoff-banner {
  max-width: 375px;
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

/* ---------- Modal ---------- */
.cr-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483645;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: min(7vh, 56px);
}

.cr-modal {
  width: min(680px, 92vw);
  max-height: 84vh;
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
  padding: 11px 16px;
  border-bottom: 1px solid var(--cr-border);
  gap: 10px;
}

.cr-modal-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.cr-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--cr-muted);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.cr-tab.is-active {
  background: var(--cr-accent-soft);
  color: var(--cr-accent);
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

.cr-status-valid {
  background: rgba(16, 185, 129, 0.14);
  color: var(--cr-emerald);
}

.cr-status-bad {
  background: rgba(239, 68, 68, 0.15);
  color: var(--cr-danger);
}

.cr-status-warn {
  background: rgba(245, 158, 11, 0.15);
  color: var(--cr-amber);
}

.cr-item-preview {
  font-size: 12px;
  color: var(--cr-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cr-pin-body {
  font-size: 12px;
  color: var(--cr-text);
  line-height: 1.5;
  white-space: pre-wrap;
  max-height: 120px;
  overflow-y: auto;
}

.cr-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.cr-form {
  padding: 12px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  line-height: 1.45;
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
  min-height: 92px;
  line-height: 1.45;
}

.cr-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.cr-row-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 10px;
  border: 1px solid var(--cr-border);
  border-radius: 10px;
  font-size: 12.5px;
}

.cr-radio-group {
  display: flex;
  gap: 6px;
}

.cr-empty {
  text-align: center;
  color: var(--cr-muted);
  padding: 26px 12px;
  font-size: 13px;
  line-height: 1.55;
}

.cr-toast {
  position: fixed;
  top: 56px;
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
