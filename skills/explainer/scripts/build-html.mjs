#!/usr/bin/env node
// README.md を 1 枚の自己完結 HTML (dist/index.html) にする。
// - figures/*.svg への画像リンクは SVG をそのまま埋め込む (外部参照なし)
// - 同名の *.scene.json があれば、vlmkit-anim html で再生ページ (dist/<name>.html) を作ってリンクする
//
//   node build-html.mjs <doc>/README.md
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { marked } from 'marked';

const mdPath = resolve(process.argv[2] ?? 'README.md');
const docDir = dirname(mdPath);
const dist = join(docDir, 'dist');
mkdirSync(dist, { recursive: true });
const anim = join(process.cwd(), 'node_modules/@mizchi/vlmkit-anim/dist/cli.mjs');

let md = readFileSync(mdPath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const title = md.match(/^# (.+)$/m)?.[1] ?? 'Explainer';

// 画像 → インライン SVG (+ 再生ページへのリンク)
md = md.replace(/!\[([^\]]*)\]\((figures\/[^)]+?)\.svg\)/g, (_, alt, base) => {
  const svg = readFileSync(join(docDir, `${base}.svg`), 'utf8').replace(/<\?xml[^>]*>/, '');
  const scene = join(docDir, `${base}.scene.json`);
  let link = '';
  if (existsSync(scene) && existsSync(anim)) {
    const name = base.split('/').pop();
    spawnSync('node', [anim, 'html', scene, '--out', join(dist, `${name}.html`), '--title', alt], { encoding: 'utf8' });
    link = `<a class="play" href="${name}.html">▶ 1 ステップずつ再生する</a>`;
  }
  return `\n<figure role="img" aria-label="${alt}">${svg}<figcaption>${alt} ${link}</figcaption></figure>\n`;
});

const body = marked.parse(md);
const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
:root { --bg: #ffffff; --fg: #1f2328; --muted: #57606a; --line: #d0d7de; --code: #f6f8fa; --accent: #0550ae; --fig: #ffffff; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg: #0d1117; --fg: #e6edf3; --muted: #9da7b3; --line: #30363d; --code: #161b22; --accent: #79c0ff; --fig: #ffffff; }
}
:root[data-theme="dark"] { --bg: #0d1117; --fg: #e6edf3; --muted: #9da7b3; --line: #30363d; --code: #161b22; --accent: #79c0ff; --fig: #ffffff; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.75 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 32px 16px 96px; }
h1 { font-size: 1.8rem; line-height: 1.35; }
h2 { margin-top: 2.6em; padding-top: .6em; border-top: 1px solid var(--line); font-size: 1.35rem; }
h3 { margin-top: 1.8em; font-size: 1.1rem; }
a { color: var(--accent); }
code { background: var(--code); padding: .1em .3em; border-radius: 4px; font-size: .9em; }
pre { background: var(--code); border: 1px solid var(--line); border-radius: 6px; padding: 12px 14px; overflow-x: auto; line-height: 1.5; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; display: block; overflow-x: auto; font-size: .93rem; }
th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
blockquote { margin: 1em 0; padding: .2em 1em; border-left: 4px solid var(--line); color: var(--muted); }
figure { margin: 1.5em 0; }
figure svg { display: block; max-width: 100%; max-height: 720px; width: auto; height: auto; margin: 0 auto; background: var(--fig); border-radius: 6px; }
figcaption { color: var(--muted); font-size: .9rem; text-align: center; margin-top: .4em; }
.play { margin-left: .5em; white-space: nowrap; }
details { border: 1px solid var(--line); border-radius: 6px; padding: 8px 12px; margin: .6em 0; }
summary { cursor: pointer; font-weight: 600; }
</style>
</head>
<body><main>
${body}
</main></body>
</html>
`;
writeFileSync(join(dist, 'index.html'), html);
console.log(`wrote ${join(dist, 'index.html')}`);
