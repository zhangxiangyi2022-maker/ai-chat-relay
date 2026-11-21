import { describe, expect, it } from 'vitest';
import { domElementToMarkdown } from '../src/core/domToMarkdown.js';

describe('domElementToMarkdown', () => {
  it('converts code blocks with language and strips Copy buttons', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <p>Here is a Python example:</p>
      <div class="md-code-block">
        <div class="md-code-block-banner">
          <span>python</span>
          <button>Copy code</button>
        </div>
        <pre><code class="language-python">def hello():
    return "world"</code></pre>
      </div>
    `;

    const md = domElementToMarkdown(root);
    expect(md).toContain('Here is a Python example:');
    expect(md).toContain('```python\ndef hello():\n    return "world"\n```');
    expect(md).not.toContain('Copy code');
  });

  it('extracts KaTeX annotations as clean LaTeX math', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <p>Inline <span class="katex"><math><semantics><annotation encoding="application/x-tex">E = mc^2</annotation></semantics></math></span> formula.</p>
      <div class="katex-display"><math><semantics><annotation encoding="application/x-tex">\\int_0^1 x^2 dx</annotation></semantics></math></div>
    `;

    const md = domElementToMarkdown(root);
    expect(md).toContain('$E = mc^2$');
    expect(md).toContain('$$\n\\int_0^1 x^2 dx\n$$');
  });

  it('converts tables, lists, links, and nested quotes cleanly', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <h2>Summary</h2>
      <ul>
        <li>First <strong>bold</strong> item</li>
        <li>Second <a href="https://example.com">link</a></li>
      </ul>
      <blockquote><p>Quoted line</p></blockquote>
      <table>
        <thead><tr><th>Model</th><th>Role</th></tr></thead>
        <tbody><tr><td>Gemini</td><td>Reasoning</td></tr></tbody>
      </table>
    `;

    const md = domElementToMarkdown(root);
    expect(md).toContain('## Summary');
    expect(md).toContain('- First **bold** item');
    expect(md).toContain('- Second [link](https://example.com)');
    expect(md).toContain('> Quoted line');
    expect(md).toContain('| Model | Role |\n| --- | --- |\n| Gemini | Reasoning |');
  });
});
