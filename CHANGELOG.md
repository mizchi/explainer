# Changelog

The plugin's version is in `.claude-plugin/plugin.json` (and the marketplace entry in `.claude-plugin/marketplace.json`).
Bump both when the skills change, so that installed copies see an update.

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
