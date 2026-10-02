# Changelog

The plugin's version is in `.claude-plugin/plugin.json` (and the marketplace entry in `.claude-plugin/marketplace.json`).
Bump both when the skills change, so that installed copies see an update. Never reuse or go below a number that has been pushed anywhere, even on a branch.

## 0.4.2 — 2026-10-02

- explainer: data charts (distributions, relations, model diagnostics) are written as Vega-Lite specs (`figures/*.vl.json`); `figure-check.mjs` renders them with vega (no browser) and runs the same text checks, and `verify-doc.mjs` picks them up. Compute in JS when it can be written (aggregates, ROC / PR, calibration, GLM by IRLS), in Python when it needs statsmodels / lifelines etc.
- explainer: diagnostic figures name what to look at and what passes in each panel title, draw the pass lines dashed, stack panels in one column for phones, and come with a verdict table (item, measured, criterion, verdict, next action) written by reading the figure, not by code. Ideas from atsushi-green/ds-ai-coding-skills (no license stated, so no text or code was taken).
- figure-check: fails SVGs whose text is drawn as outlines (matplotlib's default; set `svg.fonttype = "none"`), fails characters that no installed font can draw (tofu), and looks for playwright in the figure's, the cwd's and its own package.json in turn.
- docs/dataviz: the logistic-regression diagnostic in JS, checked against statsmodels / scikit-learn to 6 decimals.
- build-html: PNG / JPEG / GIF / WebP images under `figures/` are embedded as data URIs, so the built page shows them.

## 0.4.1 — 2026-10-02

(These changes were pushed on a branch as 0.3.1 and 0.3.2; released as 0.4.1, after 0.4.0.)

Ideas from [HyperFrames](https://github.com/heygen-com/hyperframes) (Apache-2.0), rewritten for explainer (no code copied):

- explainer: in the reply after writing on assumptions, the second line is always the message (what the document tells the reader, and its sections); caveats such as "unverified" come after the form.
- explainer: the skill now triggers for small PR explanations and chat-only answers whenever a named reader is given (it was not being loaded in the PR eval cases).
- explainer: replies about a new reader separate what the request said from what was inferred (with reasons); an inference is never treated as an answer, including in non-interactive runs.
- explainer: one sentence of what the document tells the reader, and a table of each section's job, made before writing and placed at the top; sections whose "why" does not lead back to that sentence are cut.
- explainer: value before evidence (what changes for the reader by the second section, especially for PRs), and a two-way delete test after writing.

## 0.4.0 — 2026-10-02

From [mizchi/vlmkit](https://github.com/mizchi/vlmkit), which keeps its frontend gates and hands its explanation and diagram tooling here:

- `@mizchi/vlmkit-anim` (`packages/vlmkit-anim/`): the source, its writing guide (`docs/anim-ir.md`, now shipped in the package), fixtures, samples and all 280 tests. The npm name is unchanged; 0.23.2 was the last version published from vlmkit, and from 0.24 it is published from here (`vlmkit-anim-v*` tags, `.github/workflows/vlmkit-anim.yml`, OIDC).
- Four skills: `explain-with-anim`, `explanatory-animation`, `d2-diagram`, `d2-slides`, with `d2-diagram`'s fact checker and `d2-slides`' deck builder and reviewer, their tests (`tests/d2/`, `npm run test:d2`), the worked deck (`examples/d2-slides/`, `npm run deck:example`) and the deck-gates workflow.

## 0.3.0 — 2026-10-01

No new changes; this release puts the version above every number used so far.
0.2.0 appeared briefly on a working branch (and could be installed from it) before being renumbered to 0.1.1, so an installed 0.2.0 would see 0.1.1 and 0.1.2 as older.
0.3.0 contains everything in 0.1.1 and 0.1.2 below. From here on, versions only go up.

## 0.1.2 — 2026-10-01

- explainer: when writing on assumptions without the reader's answers, the reply opens with a fixed three-line form (what was written, the assumptions, the questions), so the assumptions reach the reader and not only the persona file.

## 0.1.1 — 2026-10-01

### Figures

- `figure-check.mjs`: renders hand-written SVG / HTML / D2 / Mermaid figures and checks them (text overlaps, clipping, labels crossing box edges, lines through labels, text under 9px at phone width, fact sheets, vlmkit gates), and makes a sheet (light, dark, phone) to look at.
- Arrow readability (`figure-arrows.mjs`): fails two edges running together and edges through unrelated boxes; flags crossings, detours and edges against the flow; an edge sheet highlights each arrow in turn.
- `figure-variants.mjs`: draws layout candidates (TALA seeds, ELK, dagre, directions; Mermaid direction × curve), scores them and lays them out side by side to choose by eye.
- Mermaid figures (`.mmd`) alongside D2; `# d2-flags:` for flags D2 cannot take in the file (e.g. `--tala-seeds`).
- Icons (`icons.mjs`): Iconify sets (lucide, ISC; logos, CC0) usable from D2, Mermaid and hand SVG; sources and licenses recorded in `figures/icons/ICONS.md`; figure-check fails images not embedded and icons without a recorded source.
- Cheat sheet (`docs/figure-cheatsheet/`): Mermaid → D2 → SVG / HTML, with the D2 engines and Mermaid measured on the same samples.

### Skills

- explainer: write a provisional persona file before asking the reader (and a reply template for stopping to ask).
- explainer: the figure order above, and the look-and-fix loop.

### Other

- README in English and Japanese, with instructions and the figures they produced; installation first.
- Installation via `npx skills` and APM checked.
- License: MIT (`skills/first-reader/` stays Apache-2.0).

## 0.1.0 — 2026-09-25

- First release: explainer, explainer-book and first-reader (bundled) as one Claude Code plugin; `claude plugin eval` cases.
