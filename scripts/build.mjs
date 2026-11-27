import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { zipSync } from 'fflate';
import { generateExtensionIcons } from './icons.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

const distDir = path.join(rootDir, 'dist');
const extDir = path.join(distDir, 'extension');
const userDir = path.join(distDir, 'userscript');

const USERSCRIPT_BANNER = `// ==UserScript==
// @name         ChatRelay — Cross-AI Cockpit, Timeline & Reality Check
// @name:zh-CN   ChatRelay — 跨平台 AI 驾驶舱（地铁线分叉 / 灵动岛监工 / 灵感背包 / 防幻觉验真）
// @namespace    https://github.com/zhangxiangyi2022-maker/ai-chat-relay
// @homepageURL  https://github.com/zhangxiangyi2022-maker/ai-chat-relay
// @supportURL   https://github.com/zhangxiangyi2022-maker/ai-chat-relay/issues
// @updateURL    https://github.com/zhangxiangyi2022-maker/ai-chat-relay/releases/latest/download/chat-relay.user.js
// @downloadURL  https://github.com/zhangxiangyi2022-maker/ai-chat-relay/releases/latest/download/chat-relay.user.js
// @version      ${pkg.version}
// @description  Metro conversation timeline & fork, multi-tab Dynamic Island radar & broadcast, Pinboard, anti-hallucination package/GitHub verifier, slash prompts, and privacy-first handoff for ChatGPT, Gemini, Claude, and DeepSeek.
// @description:zh-CN 为 ChatGPT、Gemini、Claude、DeepSeek 提供右侧对话地铁线分叉、顶部多标签灵动岛监工与群发、划词灵感背包、防幻觉包名/GitHub 验真、/ 快捷模板与自动脱敏接力。
// @author       zhangxiangyi2022-maker
// @license      MIT
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://gemini.google.com/*
// @match        https://claude.ai/*
// @match        https://chat.deepseek.com/*
// @connect      registry.npmjs.org
// @connect      pypi.org
// @connect      api.github.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==
`;

function collectFilesForZip(dir, prefix = '') {
  const out = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      Object.assign(out, collectFilesForZip(abs, rel));
    } else {
      out[rel] = new Uint8Array(fs.readFileSync(abs));
    }
  }
  return out;
}

function syncStaticAssets() {
  fs.mkdirSync(extDir, { recursive: true });
  fs.mkdirSync(userDir, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/manifest.json'), 'utf8'));
  manifest.version = pkg.version;
  fs.writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.copyFileSync(path.join(rootDir, 'public/popup.html'), path.join(extDir, 'popup.html'));
  generateExtensionIcons(path.join(extDir, 'icons'));
}

async function runBuild() {
  const isWatch = process.argv.includes('--watch');
  fs.rmSync(distDir, { recursive: true, force: true });
  syncStaticAssets();

  const common = {
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'chrome114',
    minify: !isWatch,
    logLevel: 'info',
  };

  const configs = [
    {
      ...common,
      entryPoints: [path.join(rootDir, 'src/entries/extension.ts')],
      outfile: path.join(extDir, 'content.js'),
    },
    {
      ...common,
      entryPoints: [path.join(rootDir, 'src/entries/background.ts')],
      outfile: path.join(extDir, 'background.js'),
    },
    {
      ...common,
      entryPoints: [path.join(rootDir, 'src/entries/popup.ts')],
      outfile: path.join(extDir, 'popup.js'),
    },
    {
      ...common,
      entryPoints: [path.join(rootDir, 'src/entries/userscript.ts')],
      outfile: path.join(userDir, 'chat-relay.user.js'),
      banner: { js: USERSCRIPT_BANNER },
    },
  ];

  if (isWatch) {
    const contexts = await Promise.all(configs.map((c) => esbuild.context(c)));
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log('[ChatRelay] Watching for changes...');
    return;
  }

  await Promise.all(configs.map((c) => esbuild.build(c)));
  const zipped = zipSync(collectFilesForZip(extDir), { level: 9 });
  fs.writeFileSync(path.join(distDir, 'chat-relay-extension.zip'), zipped);
  console.log('[ChatRelay] Dual build complete:');
  console.log(`  - Extension folder: ${extDir}`);
  console.log(`  - Extension zip:    ${path.join(distDir, 'chat-relay-extension.zip')}`);
  console.log(`  - Userscript file:  ${path.join(userDir, 'chat-relay.user.js')}`);
}

runBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
