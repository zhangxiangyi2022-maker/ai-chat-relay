import { describe, expect, it } from 'vitest';
import {
  BUILTIN_TEMPLATES,
  exportTemplatesToMarkdown,
  extractTemplateVariables,
  fillTemplateVariables,
  filterTemplates,
  importTemplatesFromText,
} from '../src/core/templates.js';

describe('templates engine', () => {
  it('extracts unique variables in order and fills values', () => {
    const raw = 'Fix {{error}} in {{lang}}, retry {{error}} carefully.';
    expect(extractTemplateVariables(raw)).toEqual(['error', 'lang']);
    expect(fillTemplateVariables(raw, { error: 'TypeError', lang: 'TS' })).toBe(
      'Fix TypeError in TS, retry TypeError carefully.'
    );
  });

  it('filters templates by command, title, and tags', () => {
    const zh = filterTemplates(BUILTIN_TEMPLATES, 'debug', 'zh');
    expect(zh.some((t) => t.command === 'debug')).toBe(true);

    const byTag = filterTemplates(BUILTIN_TEMPLATES, 'handoff', 'en');
    expect(byTag.some((t) => t.command === 'handoff-brief')).toBe(true);
  });

  it('round-trips templates through Markdown playbook export and import', () => {
    const md = exportTemplatesToMarkdown(BUILTIN_TEMPLATES.slice(0, 2), 'en');
    const imported = importTemplatesFromText(md);
    expect(imported).toHaveLength(2);
    expect(imported[0]?.command).toBe('debug');
    expect(imported[0]?.tags).toEqual(['code', 'debug']);
    expect(imported[1]?.command).toBe('review');
  });

  it('imports JSON template arrays', () => {
    const json = JSON.stringify([
      { command: 'sql-opt', title: 'SQL 优化', tags: ['db'], content: 'Optimize {{sql}}' },
    ]);
    const imported = importTemplatesFromText(json);
    expect(imported).toHaveLength(1);
    expect(imported[0]?.command).toBe('sql-opt');
  });
});
