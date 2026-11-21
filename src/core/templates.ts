import type { Locale, PromptTemplate } from '../types/index.js';

export const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'builtin-debug',
    command: 'debug',
    title: '报错根因诊断与最小修复',
    titleEn: 'Root-Cause Debug & Minimal Fix',
    tags: ['code', 'debug'],
    isBuiltin: true,
    updatedAt: 1,
    content: [
      '请作为资深工程师帮我定位以下报错：',
      '',
      '- **报错信息**：',
      '```',
      '{{error}}',
      '```',
      '- **相关上下文/代码**：{{context}}',
      '',
      '请按以下顺序回答：',
      '1. 给出最可能的根本原因（不要泛泛而谈）；',
      '2. 给出最小可行的修复代码；',
      '3. 说明如何验证修好了以及需要警惕的边界情况。',
    ].join('\n'),
    contentEn: [
      'Act as a senior engineer and diagnose this error:',
      '',
      '- **Error**:',
      '```',
      '{{error}}',
      '```',
      '- **Context / Code**: {{context}}',
      '',
      'Please respond in order:',
      '1. The most likely root cause (no generic guesses);',
      '2. Minimal working fix;',
      '3. How to verify the fix and edge cases to watch.',
    ].join('\n'),
  },
  {
    id: 'builtin-review',
    command: 'review',
    title: '严格代码审查（Bug / 安全 / 边界）',
    titleEn: 'Strict Code Review',
    tags: ['code', 'review'],
    isBuiltin: true,
    updatedAt: 1,
    content: [
      '请对下面的代码做一次严格审查，重点关注：逻辑 Bug、空值/边界异常、并发与性能隐患、安全问题。',
      '如果没有明显问题直接说明；如果有，请按严重程度列出问题位置、原因和修改建议：',
      '',
      '```',
      '{{code}}',
      '```',
    ].join('\n'),
    contentEn: [
      'Perform a strict code review focusing on logic bugs, edge cases, performance pitfalls, and security issues.',
      'List issues by severity with exact location, impact, and suggested fix:',
      '',
      '```',
      '{{code}}',
      '```',
    ].join('\n'),
  },
  {
    id: 'builtin-translate',
    command: 'translate',
    title: '信达雅技术/自然语言互译',
    titleEn: 'Natural Bilingual Translator',
    tags: ['writing', 'translate'],
    isBuiltin: true,
    updatedAt: 1,
    content: [
      '请将下面内容翻译为 **{{target_lang}}**。',
      '要求：保留专有名词/代码标识符原文，表达自然地道，不要逐字机翻腔：',
      '',
      '{{text}}',
    ].join('\n'),
    contentEn: [
      'Translate the following text into natural, idiomatic **{{target_lang}}**.',
      'Keep technical terms and code identifiers intact:',
      '',
      '{{text}}',
    ].join('\n'),
  },
  {
    id: 'builtin-tldr',
    command: 'tldr',
    title: '太长不看 · 三层提纯总结',
    titleEn: 'TL;DR 3-Layer Summary',
    tags: ['summary', 'reading'],
    isBuiltin: true,
    updatedAt: 1,
    content: [
      '请把下面内容提纯为三部分：',
      '1. **一句话结论**',
      '2. **核心要点（不超过 5 条，每条带关键数据或事实）**',
      '3. **可执行建议 / 下一步**',
      '',
      '原文：',
      '{{content}}',
    ].join('\n'),
    contentEn: [
      'Distill the text below into 3 sections:',
      '1. **One-line takeaway**',
      '2. **Key points (max 5 bullets with concrete facts)**',
      '3. **Actionable next steps**',
      '',
      'Source:',
      '{{content}}',
    ].join('\n'),
  },
  {
    id: 'builtin-refactor',
    command: 'refactor',
    title: '安全重构拆解（保持行为不变）',
    titleEn: 'Behavior-Preserving Refactor',
    tags: ['code', 'refactor'],
    isBuiltin: true,
    updatedAt: 1,
    content: [
      '请帮我重构以下实现。重构目标：**{{goal}}**。',
      '要求：保持对外接口与边界行为完全一致，减少重复逻辑并提高可读性：',
      '',
      '```',
      '{{code}}',
      '```',
    ].join('\n'),
    contentEn: [
      'Refactor the code below with the goal: **{{goal}}**.',
      'Preserve public interfaces and edge-case behavior while eliminating duplication:',
      '',
      '```',
      '{{code}}',
      '```',
    ].join('\n'),
  },
  {
    id: 'builtin-prompt',
    command: 'prompt',
    title: '提示词打磨优化器',
    titleEn: 'Prompt Refiner',
    tags: ['prompt', 'ai'],
    isBuiltin: true,
    updatedAt: 1,
    content: [
      '我想让 AI 帮我完成下面这件事，但我的描述还比较粗糙。请你把它改写成一个结构清晰、约束明确、能直接复制使用的高质量提示词：',
      '',
      '原始想法：{{raw_idea}}',
    ].join('\n'),
    contentEn: [
      'Rewrite my rough request below into a crisp, well-structured, ready-to-use prompt with clear constraints and output format:',
      '',
      'Rough idea: {{raw_idea}}',
    ].join('\n'),
  },
  {
    id: 'builtin-handoff-brief',
    command: 'handoff-brief',
    title: '生成超短交接简报（切模型前用）',
    titleEn: 'Compact Handoff Brief',
    tags: ['handoff', 'workflow'],
    isBuiltin: true,
    updatedAt: 1,
    content: [
      '我准备把当前任务交接给另一个 AI 模型继续处理。请你把我们到目前为止的对话浓缩成一份 **300 字以内的交接简报**，包含：',
      '1. 最终目标与硬性约束；',
      '2. 已经确认或已完成的部分；',
      '3. 当前卡点 / 待解决的具体问题；',
      '4. 关键代码或配置片段（仅保留必要的）。',
    ].join('\n'),
    contentEn: [
      'I am handing this task off to another AI model. Summarize our conversation into a **concise handoff brief (< 250 words)** containing:',
      '1. Goal & hard constraints;',
      '2. Decisions & work already completed;',
      '3. Exact current blocker / open question;',
      '4. Essential snippets/files only.',
    ].join('\n'),
  },
  {
    id: 'builtin-playbook',
    command: 'playbook',
    title: '多步骤执行剧本（Playbook）',
    titleEn: 'Step-by-Step Execution Playbook',
    tags: ['workflow', 'planning'],
    isBuiltin: true,
    updatedAt: 1,
    content: [
      '请为以下任务设计一份可直接照着执行的 Playbook：',
      '',
      '- **目标任务**：{{task}}',
      '',
      '请输出：',
      '1. 拆解为 3–6 个清晰阶段；',
      '2. 每个阶段的输入、具体操作与验收标准（Done looks like）；',
      '3. 最容易踩坑的风险点与规避方式；',
      '4. 先只让我确认第一步，不要一次全铺开。',
    ].join('\n'),
    contentEn: [
      'Design an actionable execution Playbook for the following task:',
      '',
      '- **Task**: {{task}}',
      '',
      'Include:',
      '1. 3–6 concrete phases;',
      '2. Inputs, actions, and Done criteria per phase;',
      '3. Common pitfalls and mitigations;',
      '4. Ask me to confirm Phase 1 first before doing everything at once.',
    ].join('\n'),
  },
];

export function resolveTemplateTitle(tpl: PromptTemplate, locale: Locale): string {
  if (locale === 'en' && tpl.titleEn) return tpl.titleEn;
  return tpl.title;
}

export function resolveTemplateContent(tpl: PromptTemplate, locale: Locale): string {
  if (locale === 'en' && tpl.contentEn) return tpl.contentEn;
  return tpl.content;
}

export function extractTemplateVariables(content: string): string[] {
  const seen = new Set<string>();
  const vars: string[] = [];
  const regex = /\{\{\s*([^{}]+?)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1]?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      vars.push(name);
    }
  }
  return vars;
}

export function fillTemplateVariables(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (full, rawKey: string) => {
    const key = rawKey.trim();
    const replacement = values[key];
    return replacement !== undefined ? replacement : full;
  });
}

export function normalizeCommand(raw: string): string {
  return raw
    .trim()
    .replace(/^\/+/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

export function filterTemplates(
  templates: PromptTemplate[],
  query: string,
  locale: Locale
): PromptTemplate[] {
  const clean = query.trim().replace(/^\/+/, '').toLowerCase();
  if (!clean) return templates;
  return templates.filter((tpl) => {
    const haystack = [
      tpl.command,
      tpl.title,
      tpl.titleEn ?? '',
      resolveTemplateTitle(tpl, locale),
      ...tpl.tags,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(clean);
  });
}

export function exportTemplatesToMarkdown(templates: PromptTemplate[], locale: Locale): string {
  const sections = templates.map((tpl) => {
    const title = resolveTemplateTitle(tpl, locale);
    const body = resolveTemplateContent(tpl, locale);
    const tagsLine = tpl.tags.length > 0 ? `<!-- tags: ${tpl.tags.join(', ')} -->\n` : '';
    return `## /${tpl.command} | ${title}\n${tagsLine}\`\`\`prompt\n${body}\n\`\`\``;
  });
  return `# ChatRelay Prompt Playbook\n\n${sections.join('\n\n')}\n`;
}

export function importTemplatesFromText(raw: string): PromptTemplate[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // 1. Try JSON first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { templates?: unknown }).templates)
          ? (parsed as { templates: unknown[] }).templates
          : [];
      const results: PromptTemplate[] = [];
      for (const item of list) {
        if (typeof item !== 'object' || item === null) continue;
        const rec = item as Record<string, unknown>;
        const content = typeof rec.content === 'string' ? rec.content.trim() : '';
        const title = typeof rec.title === 'string' ? rec.title.trim() : '';
        const command = normalizeCommand(typeof rec.command === 'string' ? rec.command : title);
        if (!content || !command) continue;
        const tags = Array.isArray(rec.tags)
          ? rec.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          : [];
        results.push({
          id: typeof rec.id === 'string' && rec.id ? rec.id : `tpl-${Date.now()}-${results.length}`,
          command,
          title: title || command,
          titleEn: typeof rec.titleEn === 'string' ? rec.titleEn : undefined,
          tags,
          content,
          contentEn: typeof rec.contentEn === 'string' ? rec.contentEn : undefined,
          isBuiltin: false,
          updatedAt: Date.now(),
        });
      }
      if (results.length > 0) return results;
    } catch {
      // Fall through to Markdown parser
    }
  }

  // 2. Parse Markdown playbook sections: ## /cmd | Title
  const results: PromptTemplate[] = [];
  const headingRegex = /^##\s+\/?([^\s|]+)(?:\s*\|\s*(.+))?$/gm;
  const matches = Array.from(trimmed.matchAll(headingRegex));
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    if (!cur || cur.index === undefined) continue;
    const cmdRaw = cur[1] ?? '';
    const titleRaw = cur[2]?.trim() ?? '';
    const start = cur.index + cur[0].length;
    const end = matches[i + 1]?.index ?? trimmed.length;
    const block = trimmed.slice(start, end).trim();

    const tagMatch = block.match(/<!--\s*tags:\s*([^>]+?)\s*-->/i);
    const tags = tagMatch?.[1]
      ? tagMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const withoutTagComment = block.replace(/<!--\s*tags:[^>]*-->/gi, '').trim();
    const fenceMatch = withoutTagComment.match(/^```(?:prompt|markdown|text)?\s*\n([\s\S]*?)\n```\s*$/i);
    const content = (fenceMatch?.[1] ?? withoutTagComment).trim();
    const command = normalizeCommand(cmdRaw);
    if (!command || !content) continue;

    results.push({
      id: `tpl-md-${Date.now()}-${i}`,
      command,
      title: titleRaw || command,
      tags,
      content,
      isBuiltin: false,
      updatedAt: Date.now(),
    });
  }

  return results;
}
