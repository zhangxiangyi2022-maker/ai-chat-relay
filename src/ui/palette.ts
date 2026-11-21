import {
  exportTemplatesToMarkdown,
  extractTemplateVariables,
  fillTemplateVariables,
  filterTemplates,
  importTemplatesFromText,
  normalizeCommand,
  resolveTemplateContent,
  resolveTemplateTitle,
} from '../core/templates.js';
import { formatMsg, getMessages } from '../i18n/index.js';
import type { Locale, PromptTemplate, RelaySettings } from '../types/index.js';
import { clearChildren, el, svgIcon } from './dom.js';

export type ModalView = 'closed' | 'list' | 'fill' | 'edit' | 'import' | 'settings';

export interface PaletteControllerDeps {
  getTemplates: () => PromptTemplate[];
  getSettings: () => RelaySettings;
  onSaveTemplates: (templates: PromptTemplate[]) => Promise<void>;
  onResetBuiltins: () => Promise<void>;
  onUpdateSettings: (patch: Partial<RelaySettings>) => Promise<void>;
  onClearHandoff: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  onInsertPrompt: (text: string) => void;
  onCopyText: (text: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

export class PaletteModal {
  private readonly root: HTMLElement;
  private readonly deps: PaletteControllerDeps;
  private view: ModalView = 'closed';
  private searchQuery = '';
  private selectedIndex = 0;
  private activeTemplate: PromptTemplate | null = null;
  private editingTemplate: PromptTemplate | null = null;

  constructor(container: HTMLElement, deps: PaletteControllerDeps) {
    this.root = container;
    this.deps = deps;
  }

  isOpen(): boolean {
    return this.view !== 'closed';
  }

  openList(initialQuery = ''): void {
    this.view = 'list';
    this.searchQuery = initialQuery;
    this.selectedIndex = 0;
    this.render();
  }

  openSettings(): void {
    this.view = 'settings';
    this.render();
  }

  close(): void {
    if (this.view === 'closed') return;
    this.view = 'closed';
    clearChildren(this.root);
  }

  refresh(): void {
    if (this.view !== 'closed') {
      this.render();
    }
  }

  private get locale(): Locale {
    return this.deps.getSettings().locale;
  }

  private chooseTemplate(tpl: PromptTemplate): void {
    const raw = resolveTemplateContent(tpl, this.locale);
    const vars = extractTemplateVariables(raw);
    if (vars.length > 0) {
      this.activeTemplate = tpl;
      this.view = 'fill';
      this.render();
      return;
    }
    this.close();
    this.deps.onInsertPrompt(raw);
  }

  private render(): void {
    clearChildren(this.root);
    if (this.view === 'closed') return;

    const msg = getMessages(this.locale);
    const backdrop = el('div', {
      className: 'cr-backdrop',
      onClick: (e) => {
        if (e.target === backdrop) this.close();
      },
    });

    const modal = el('div', { className: 'cr-modal' });

    const headerTitleText =
      this.view === 'fill'
        ? msg.fillVarsTitle
        : this.view === 'edit'
          ? msg.newTemplate.replace(/^\+\s*/, '')
          : this.view === 'import'
            ? msg.importTitle
            : this.view === 'settings'
              ? msg.settingsBtn
              : msg.paletteTitle;

    const header = el(
      'div',
      { className: 'cr-modal-header' },
      el('div', { className: 'cr-modal-title' }, svgIcon('sparkles', 16), el('span', { text: headerTitleText })),
      el(
        'div',
        { className: 'cr-item-actions' },
        el('button', {
          className: 'cr-btn cr-btn-subtle',
          text: msg.langSwitch,
          onClick: () => {
            void this.deps.onUpdateSettings({ locale: this.locale === 'zh' ? 'en' : 'zh' });
          },
        }),
        el(
          'button',
          {
            className: 'cr-btn cr-btn-icon',
            title: 'Close',
            onClick: () => this.close(),
          },
          svgIcon('close', 16)
        )
      )
    );

    modal.appendChild(header);

    if (this.view === 'list') {
      this.renderListView(modal);
    } else if (this.view === 'fill' && this.activeTemplate) {
      this.renderFillView(modal, this.activeTemplate);
    } else if (this.view === 'edit') {
      this.renderEditView(modal, this.editingTemplate);
    } else if (this.view === 'import') {
      this.renderImportView(modal);
    } else if (this.view === 'settings') {
      this.renderSettingsView(modal);
    }

    backdrop.appendChild(modal);
    this.root.appendChild(backdrop);
  }

  private renderListView(modal: HTMLElement): void {
    const msg = getMessages(this.locale);
    const listWrap = el('div', { className: 'cr-list' });

    const rebuildRows = () => {
      clearChildren(listWrap);
      const filtered = filterTemplates(this.deps.getTemplates(), this.searchQuery, this.locale);
      if (this.selectedIndex >= filtered.length) {
        this.selectedIndex = Math.max(0, filtered.length - 1);
      }
      if (filtered.length === 0) {
        listWrap.appendChild(el('div', { className: 'cr-empty', text: msg.noTemplatesMatch }));
        return;
      }

      filtered.forEach((tpl, idx) => {
        const title = resolveTemplateTitle(tpl, this.locale);
        const content = resolveTemplateContent(tpl, this.locale);
        const item = el(
          'div',
          {
            className: `cr-item${idx === this.selectedIndex ? ' is-active' : ''}`,
          },
          el(
            'div',
            { className: 'cr-item-top' },
            el(
              'div',
              { className: 'cr-item-left' },
              el('span', { className: 'cr-cmd', text: `/${tpl.command}` }),
              el('span', { className: 'cr-item-title', text: title }),
              ...tpl.tags.slice(0, 3).map((tag) => el('span', { className: 'cr-tag', text: tag }))
            ),
            el(
              'div',
              { className: 'cr-item-actions' },
              el('button', {
                className: 'cr-btn cr-btn-primary',
                text: msg.insertBtn,
                onClick: () => this.chooseTemplate(tpl),
              }),
              el(
                'button',
                {
                  className: 'cr-btn cr-btn-icon',
                  title: msg.editBtn,
                  onClick: () => {
                    this.editingTemplate = tpl;
                    this.view = 'edit';
                    this.render();
                  },
                },
                svgIcon('edit', 14)
              ),
              el(
                'button',
                {
                  className: 'cr-btn cr-btn-icon cr-btn-danger',
                  title: msg.deleteBtn,
                  onClick: () => {
                    const next = this.deps.getTemplates().filter((t) => t.id !== tpl.id);
                    void this.deps.onSaveTemplates(next).then(() => {
                      this.deps.onNotify(msg.toastTemplateDeleted);
                      rebuildRows();
                    });
                  },
                },
                svgIcon('trash', 14)
              )
            )
          ),
          el('div', { className: 'cr-item-preview', text: content.replace(/\s+/g, ' ').slice(0, 120) })
        );
        listWrap.appendChild(item);
      });
    };

    const searchInput = el('input', {
      className: 'cr-search',
      type: 'text',
      value: this.searchQuery,
      placeholder: msg.paletteSearchPlaceholder,
      onInput: (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        this.selectedIndex = 0;
        rebuildRows();
      },
      onKeyDown: (e) => {
        const filtered = filterTemplates(this.deps.getTemplates(), this.searchQuery, this.locale);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (filtered.length > 0) {
            this.selectedIndex = (this.selectedIndex + 1) % filtered.length;
            rebuildRows();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (filtered.length > 0) {
            this.selectedIndex = (this.selectedIndex - 1 + filtered.length) % filtered.length;
            rebuildRows();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const target = filtered[this.selectedIndex];
          if (target) this.chooseTemplate(target);
        }
      },
    });

    const toolbar = el(
      'div',
      { className: 'cr-toolbar' },
      searchInput,
      el('button', {
        className: 'cr-btn cr-btn-subtle',
        text: msg.newTemplate,
        onClick: () => {
          this.editingTemplate = null;
          this.view = 'edit';
          this.render();
        },
      }),
      el(
        'button',
        {
          className: 'cr-btn cr-btn-subtle',
          onClick: () => {
            this.view = 'import';
            this.render();
          },
        },
        svgIcon('upload', 13),
        el('span', { text: msg.importBtn })
      ),
      el(
        'button',
        {
          className: 'cr-btn cr-btn-subtle',
          onClick: () => {
            const md = exportTemplatesToMarkdown(this.deps.getTemplates(), this.locale);
            void this.deps.onCopyText(md);
          },
        },
        svgIcon('copy', 13),
        el('span', { text: msg.exportTemplatesBtn })
      ),
      el('button', {
        className: 'cr-btn cr-btn-subtle',
        text: msg.resetBuiltinsBtn,
        onClick: () => {
          void this.deps.onResetBuiltins().then(() => rebuildRows());
        },
      })
    );

    modal.appendChild(toolbar);
    modal.appendChild(listWrap);
    rebuildRows();
    setTimeout(() => searchInput.focus(), 10);
  }

  private renderFillView(modal: HTMLElement, tpl: PromptTemplate): void {
    const msg = getMessages(this.locale);
    const raw = resolveTemplateContent(tpl, this.locale);
    const vars = extractTemplateVariables(raw);
    const values: Record<string, string> = {};

    const form = el('div', { className: 'cr-form' });
    form.appendChild(
      el(
        'div',
        { className: 'cr-item-left' },
        el('span', { className: 'cr-cmd', text: `/${tpl.command}` }),
        el('span', { className: 'cr-item-title', text: resolveTemplateTitle(tpl, this.locale) })
      )
    );

    let firstInput: HTMLTextAreaElement | null = null;
    for (const v of vars) {
      values[v] = '';
      const area = el('textarea', {
        className: 'cr-textarea',
        rows: 3,
        placeholder: msg.varInputPlaceholder,
        onInput: (e) => {
          values[v] = (e.target as HTMLTextAreaElement).value;
        },
      });
      if (!firstInput) firstInput = area;
      form.appendChild(el('div', { className: 'cr-field' }, el('label', { className: 'cr-label', text: `{{${v}}}` }), area));
    }

    const submit = () => {
      const filled = fillTemplateVariables(raw, values);
      this.close();
      this.deps.onInsertPrompt(filled);
    };

    form.appendChild(
      el(
        'div',
        { className: 'cr-form-footer' },
        el('button', {
          className: 'cr-btn cr-btn-subtle',
          text: msg.cancelBtn,
          onClick: () => {
            this.view = 'list';
            this.render();
          },
        }),
        el('button', {
          className: 'cr-btn cr-btn-primary',
          text: msg.insertBtn,
          onClick: submit,
        })
      )
    );

    modal.appendChild(form);
    if (firstInput) setTimeout(() => firstInput?.focus(), 10);
  }

  private renderEditView(modal: HTMLElement, existing: PromptTemplate | null): void {
    const msg = getMessages(this.locale);
    const cmdInput = el('input', {
      className: 'cr-input',
      type: 'text',
      value: existing?.command ?? '',
      placeholder: 'e.g. sql-opt',
    });
    const titleInput = el('input', {
      className: 'cr-input',
      type: 'text',
      value: existing ? resolveTemplateTitle(existing, this.locale) : '',
      placeholder: msg.titleLabel,
    });
    const tagsInput = el('input', {
      className: 'cr-input',
      type: 'text',
      value: existing?.tags.join(', ') ?? '',
      placeholder: 'code, review',
    });
    const contentInput = el('textarea', {
      className: 'cr-textarea',
      rows: 7,
      value: existing ? resolveTemplateContent(existing, this.locale) : '',
      placeholder: msg.contentHint,
    });

    const save = () => {
      const command = normalizeCommand(cmdInput.value || titleInput.value);
      const title = titleInput.value.trim() || command;
      const content = contentInput.value.trim();
      if (!command || !content) return;
      const tags = tagsInput.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const list = [...this.deps.getTemplates()];
      const nextItem: PromptTemplate = existing
        ? {
            ...existing,
            command,
            title: this.locale === 'zh' ? title : existing.title,
            titleEn: this.locale === 'en' ? title : existing.titleEn,
            tags,
            content: this.locale === 'zh' ? content : existing.content,
            contentEn: this.locale === 'en' ? content : existing.contentEn,
            updatedAt: Date.now(),
          }
        : {
            id: `tpl-${Date.now()}`,
            command,
            title,
            tags,
            content,
            isBuiltin: false,
            updatedAt: Date.now(),
          };

      const idx = existing ? list.findIndex((t) => t.id === existing.id) : -1;
      if (idx >= 0) list[idx] = nextItem;
      else list.unshift(nextItem);

      void this.deps.onSaveTemplates(list).then(() => {
        this.deps.onNotify(msg.toastTemplateSaved);
        this.view = 'list';
        this.render();
      });
    };

    const form = el(
      'div',
      { className: 'cr-form' },
      el('div', { className: 'cr-field' }, el('label', { className: 'cr-label', text: msg.cmdLabel }), cmdInput),
      el('div', { className: 'cr-field' }, el('label', { className: 'cr-label', text: msg.titleLabel }), titleInput),
      el('div', { className: 'cr-field' }, el('label', { className: 'cr-label', text: msg.tagsLabel }), tagsInput),
      el(
        'div',
        { className: 'cr-field' },
        el('label', { className: 'cr-label', text: msg.contentLabel }),
        el('span', { className: 'cr-hint', text: msg.contentHint }),
        contentInput
      ),
      el(
        'div',
        { className: 'cr-form-footer' },
        el('button', {
          className: 'cr-btn cr-btn-subtle',
          text: msg.cancelBtn,
          onClick: () => {
            this.view = 'list';
            this.render();
          },
        }),
        el('button', {
          className: 'cr-btn cr-btn-primary',
          text: msg.saveBtn,
          onClick: save,
        })
      )
    );

    modal.appendChild(form);
    setTimeout(() => cmdInput.focus(), 10);
  }

  private renderImportView(modal: HTMLElement): void {
    const msg = getMessages(this.locale);
    const area = el('textarea', {
      className: 'cr-textarea',
      rows: 9,
      placeholder: msg.importPlaceholder,
    });

    const apply = () => {
      const imported = importTemplatesFromText(area.value);
      if (imported.length === 0) {
        this.deps.onNotify(msg.toastImportEmpty);
        return;
      }
      const existing = [...this.deps.getTemplates()];
      const existingCmds = new Set(existing.map((t) => t.command));
      const merged = [
        ...imported.filter((t) => !existingCmds.has(t.command)),
        ...existing,
      ];
      void this.deps.onSaveTemplates(merged).then(() => {
        this.deps.onNotify(formatMsg(msg.toastImportedCount, { count: imported.length }));
        this.view = 'list';
        this.render();
      });
    };

    modal.appendChild(
      el(
        'div',
        { className: 'cr-form' },
        area,
        el(
          'div',
          { className: 'cr-form-footer' },
          el('button', {
            className: 'cr-btn cr-btn-subtle',
            text: msg.cancelBtn,
            onClick: () => {
              this.view = 'list';
              this.render();
            },
          }),
          el('button', {
            className: 'cr-btn cr-btn-primary',
            text: msg.importApply,
            onClick: apply,
          })
        )
      )
    );
    setTimeout(() => area.focus(), 10);
  }

  private makeToggleRow(
    labelText: string,
    checked: boolean,
    onToggle: (next: boolean) => void
  ): HTMLElement {
    const input = el('input', {
      type: 'checkbox',
      checked,
      onChange: (e) => onToggle((e.target as HTMLInputElement).checked),
    });
    return el('div', { className: 'cr-row-switch' }, el('span', { text: labelText }), input);
  }

  private renderSettingsView(modal: HTMLElement): void {
    const msg = getMessages(this.locale);
    const s = this.deps.getSettings();

    const turnsInput = el('input', {
      className: 'cr-input',
      type: 'number',
      min: '2',
      max: '40',
      value: String(s.maxCompactTurns),
      onChange: (e) => {
        const val = Math.min(40, Math.max(2, Number((e.target as HTMLInputElement).value) || 8));
        void this.deps.onUpdateSettings({ maxCompactTurns: val });
      },
    });
    turnsInput.style.width = '76px';

    const ttlInput = el('input', {
      className: 'cr-input',
      type: 'number',
      min: '0',
      max: '1440',
      value: String(s.handoffTtlMinutes),
      onChange: (e) => {
        const raw = Number((e.target as HTMLInputElement).value);
        const val = Number.isFinite(raw) ? Math.min(1440, Math.max(0, raw)) : 30;
        void this.deps.onUpdateSettings({ handoffTtlMinutes: val });
      },
    });
    ttlInput.style.width = '76px';

    const form = el(
      'div',
      { className: 'cr-form' },
      el('div', { className: 'cr-hint', text: msg.privacyBadge }),
      el(
        'div',
        { className: 'cr-row-switch' },
        el('span', { text: msg.handoffBtn }),
        el(
          'div',
          { className: 'cr-radio-group' },
          el('button', {
            className: `cr-btn ${s.handoffMode === 'compact' ? 'cr-btn-primary' : 'cr-btn-subtle'}`,
            text: msg.handoffModeCompact,
            onClick: () => void this.deps.onUpdateSettings({ handoffMode: 'compact' }),
          }),
          el('button', {
            className: `cr-btn ${s.handoffMode === 'full' ? 'cr-btn-primary' : 'cr-btn-subtle'}`,
            text: msg.handoffModeFull,
            onClick: () => void this.deps.onUpdateSettings({ handoffMode: 'full' }),
          })
        )
      ),
      el('div', { className: 'cr-row-switch' }, el('span', { text: msg.maxCompactTurnsLabel }), turnsInput),
      this.makeToggleRow(msg.slashTriggerLabel, s.slashTrigger, (val) =>
        void this.deps.onUpdateSettings({ slashTrigger: val })
      ),
      this.makeToggleRow(msg.includeThinkingLabel, s.includeThinking, (val) =>
        void this.deps.onUpdateSettings({ includeThinking: val })
      ),
      el('div', { className: 'cr-label', text: msg.privacySectionTitle }),
      this.makeToggleRow(msg.redactSecretsLabel, s.redactSecrets, (val) =>
        void this.deps.onUpdateSettings({ redactSecrets: val })
      ),
      this.makeToggleRow(msg.redactPiiLabel, s.redactPii, (val) =>
        void this.deps.onUpdateSettings({ redactPii: val })
      ),
      this.makeToggleRow(msg.autoClearAfterPasteLabel, s.autoClearHandoffAfterPaste, (val) =>
        void this.deps.onUpdateSettings({ autoClearHandoffAfterPaste: val })
      ),
      el('div', { className: 'cr-row-switch' }, el('span', { text: msg.handoffTtlLabel }), ttlInput),
      this.makeToggleRow(msg.includeSourceUrlLabel, s.includeSourceUrlInExport, (val) =>
        void this.deps.onUpdateSettings({ includeSourceUrlInExport: val })
      ),
      this.makeToggleRow(msg.autoCopyLabel, s.autoCopyToClipboard, (val) =>
        void this.deps.onUpdateSettings({ autoCopyToClipboard: val })
      ),
      el(
        'div',
        { className: 'cr-form-footer' },
        el('button', {
          className: 'cr-btn cr-btn-subtle',
          text: msg.clearHandoffNowBtn,
          onClick: () => void this.deps.onClearHandoff(),
        }),
        el('button', {
          className: 'cr-btn cr-btn-subtle cr-btn-danger',
          text: msg.clearAllDataBtn,
          onClick: () => void this.deps.onClearAllData(),
        })
      )
    );

    modal.appendChild(form);
  }
}
