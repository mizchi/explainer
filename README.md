# explainer

English | [日本語](README.ja.md)

Skills and tools for explaining concepts from an AI to a human.

Coding agents now write faster than people can understand what they wrote ([Geoffrey Litt, *Understanding is the new bottleneck*](https://www.geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck)).
This repository is for writing, for one reader, **only what that reader does not already know**, with **claims and figures checked by tools**.

## Install

As a Claude Code plugin (this repository is itself a plugin marketplace; one plugin, `explainer`, contains five skills):

```
/plugin marketplace add mizchi/explainer
/plugin install explainer@explainer
```

From a shell: `claude plugin marketplace add mizchi/explainer` and `claude plugin install explainer@explainer`.
To update an installed copy: `claude plugin marketplace update explainer` and then `claude plugin update explainer@explainer`. Changes are listed in [CHANGELOG.md](CHANGELOG.md).

The skills can also be installed with [`npx skills`](https://github.com/vercel-labs/skills) or [APM](https://github.com/microsoft/apm) (checked with skills 1.7.0 and apm-cli 0.32.0; both put the skills in `.claude/skills/`, byte-identical to this repository).

```sh
npx skills add mizchi/explainer --skill '*' -a claude-code   # --list to see the skills first
apm install mizchi/explainer --target claude
```

Install `explainer`, `explainer-book` and `first-reader` together: `explainer-book` runs `explainer`'s `verify-doc.mjs` from the sibling directory (`../../explainer/scripts/`).

| Skill | When to use it |
|---|---|
| `explainer` | A crash course for one reader. Claims and figures are checked with tools |
| `explainer-book` | A chaptered course. Checks learning objectives, concept order, reading time and exercises |
| `first-reader` | Has simulated readers read a draft one paragraph at a time before publishing. Reports where they drop off and what stays with them the next day. Does not rewrite |
| `d2-diagram` | A D2 diagram laid out by TALA, read in the terminal, and held to a fact sheet by `d2-facts.mjs` (what the picture draws, not what the text says) |
| `d2-slides` | A slide deck from one Markdown file with a D2 fence per figure, built to HTML and checked with vlmkit's gates |

The last two came from [mizchi/vlmkit](https://github.com/mizchi/vlmkit). Figures are Mermaid or D2 text checked by `figure-check.mjs`; the animation package `@mizchi/vlmkit-anim` and its two skills were removed in 0.5 (see CHANGELOG).

Install the scripts' dependencies in the repository that holds the documents (`npm i -D @mizchi/vlmkit marked playwright mermaid`, Node 24+). Add the `d2` CLI if you use D2 figures, and `@iconify-json/lucide @iconify-json/logos` to use icons.
`first-reader` needs only the Python 3 standard library.

For documents in Japanese, also install [yomiyasu](https://github.com/nanaism/yomiyasu) (MIT): `verify-doc.mjs` then runs its linter over the prose and lists patterns common in AI-written Japanese (too much bold or bulleting, metaphorical verbs) as things to look at. It is not bundled (`npx skills add nanaism/yomiyasu`).

`first-reader` is bundled from [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/agent_skills/first-reader) (Apache-2.0; see `skills/first-reader/LICENSE` and `NOTICE`).
`feed.py` counts words differently so that Japanese drafts can also be read one paragraph at a time.

## What it does

```
persona ─→ question ─→ real artifacts (runnable examples, models) ─→ text + figures ─→ verify ─→ HTML
  │                          │                                          │               │
  questions + public info    paste outputs, never retype               Mermaid / D2    verify-doc.mjs
                                                                        + fact sheets   (checks / figures / quotes / vlmkit)
```

- **Persona** (`personas/`): what the reader already knows, and where their understanding is shaky. It decides what to leave out.
- **Skills** (`skills/explainer/`): the procedure, writing style, how to choose a figure, how to verify.
- **Verification**: every quoted output is re-run from `checks.json` and compared with the text. Figures (Mermaid / D2 / SVG / HTML) are checked against fact sheets and for overlap, clipping and arrow readability by `figure-check.mjs`, and pages go through `vlmkit check integrity` / `check a11y contrast`.

[ELI5](https://github.com/dreambigou/eli5) treats the reader as a type (age, job).
This skill treats one real person as the reader, and checks what it writes with tools.

## Instructions, and the figures they produced

These are instructions actually given in the conversation that built this repository (excerpts, translated from Japanese; the originals are in [README.ja.md](README.ja.md)), and the figures that came out.
Every figure was either checked against a tool's output or passed `figure-check.mjs`, and was looked at and fixed by eye.
The images are rebuilt with `npm run readme:images`. The figures themselves are in Japanese, the language of the documents.

### 1. A crash course on formal methods

> As a test, build a persona of mizchi from public information, and write an explanation of formal methods that I can understand. I tried to write material on Z3 and TLA+, but lost confidence as I wrote it.
>
> Actually run the induction check with Apalache as well, and verify it.

![Figures from the formal methods crash course](docs/readme/formal-methods.png)

- A: all reachable states of Counter, generated from TLC's state graph as Mermaid by `tlc-to-mermaid.mjs`. The thick-bordered states are the ones the correct order and TLC's counterexample walk; `D D | 1` is the final state where one update was lost.
- B: for CounterAtomic, reachable states ⊂ NoLostUpdate ⊂ all states. The contents of the "reachable" box are checked against the states TLC enumerated. Red is the counterexample to induction (CTI) that Z3 found: an unreachable state that satisfies NoLostUpdate and leaves it in one step.
- C: which states each check looked at (hand-written SVG).
- Document: [`docs/formal-methods/README.md`](docs/formal-methods/README.md)

### 2. A chaptered course

> I want to add a skill for making a substantial course that doesn't end as a short text. Like foo-book/01-quickstart.md.

![Figures from the chaptered book](docs/readme/book.png)

- A: chapter dependency map, generated from `book.json`; the same data drives the check that no concept is used before it is introduced.
- B: triaging a counterexample to induction (CTI), in D2 + ELK.
- Book: [`docs/inductive-invariant-book/`](docs/inductive-invariant-book/README.md)

### 3. Which figure tool to use

> Using TALA and D2, make a cheat sheet from samples that sorts out which drawing tool to use when.

![The same D2 drawn by three engines](docs/readme/engines.png)

- The same `arch.d2` drawn by A: TALA, B: ELK, C: dagre.
- Without a `direction`, A put the entry points (browser, app) at the bottom. In B and C, lines cross the container titles (エッジ, サービス, データ).
- Cheat sheet: [`docs/figure-cheatsheet/README.md`](docs/figure-cheatsheet/README.md)

> Write down when to use Mermaid. Use Mermaid when it is enough; for other structured patterns consider D2; for free-form drawings D2 can't express, consider SVG or HTML.

![Mermaid compared with D2 + TALA](docs/readme/mermaid-vs-tala.png)

- A: a figure Mermaid is enough for (a procedure with a back edge). No ✗ from the checks.
- B: in Mermaid, once a node inside a subgraph links to a node outside it, the subgraph's `direction TB` is ignored and everything goes into one row.
- C: the same links in D2 + TALA keep the inside vertical.

### 4. Render, look, and fix the layout

> With D2 and Mermaid, when you actually render from the semantics, the result is sometimes clearly unnatural, or the arrows are hard to read. I want a flow that checks these visually and fixes them.

![Edge sheet](docs/readme/arrows-edges.png)

The edge sheet (made by `figure-check.mjs`): each arrow drawn in red in turn, with the others faded.
The two framed in red failed the machine check "browser→CDN and browser→API Gateway run together for 222px": the split reads as an arrow between CDN and API Gateway.

![Layout candidates](docs/readme/arrows-variants.png)

Layout candidates (made by `figure-variants.mjs`): TALA seeds 1–6, ELK and dagre, sorted by penalty.
Only seeds 6 and 5 have no ✗. You choose among those by eye and record why in a comment in the source.

### 5. Icons

> I want to bring in an SVG icon set and be able to use it.

![Figures using the same icon sets from D2 and Mermaid](docs/readme/icons.png)

- `icons.mjs` searches the installed Iconify sets (Lucide line icons, ISC; logos of technologies, CC0), lays candidates out in one image to choose from, and writes the chosen icon next to the figure, recording its source and license in `figures/icons/ICONS.md`.
- A: D2 + ELK. Line icons inside the boxes, and logos (as `shape: image`, sized explicitly; unsized, the Postgres logo became the largest thing in the figure) for the products themselves.
- B: Mermaid. `figure-check.mjs` registers the installed sets with Mermaid, so `lucide:user` or `logos:postgresql` can be used directly.
- `figure-check.mjs` fails images that are not embedded in the figure (a missing file or wrong path) and D2 icons without a recorded source.

## Example: a formal methods crash course for mizchi

- Persona: [`personas/mizchi.md`](personas/mizchi.md) (built from public information; facts and guesses kept apart)
- Document: [`docs/formal-methods/README.md`](docs/formal-methods/README.md) "Reading the green: what did Z3's and TLA+'s 'OK' actually guarantee?"

Building the persona showed the reader was not a beginner at formal methods.
They already run about ten verifiers through agents.
So the document is not a tool tutorial; it is limited to **criteria for judging, yourself, what a checker's result guaranteed**.

## Example: a chaptered course (book)

When one document is not enough, the `explainer-book` skill splits it into chapters.

- Book: [`docs/inductive-invariant-book/`](docs/inductive-invariant-book/README.md) "Finding inductive invariants yourself" (3 chapters)
  - `01-quickstart.md`: show with Apalache's three checks that an invariant holds for any number of steps
  - `02-reading-cti.md`: use TLC to tell whether a counterexample to induction (CTI) means a weak invariant or a bug
  - `03-strengthening.md`: exercises in reading off the condition to add from a CTI
- Whole-book checks (`verify-book.mjs`): learning objectives matched to quizzes, no concept used before it is introduced, reading time per chapter, exercises whose starting point fails and whose answer passes, the chapter dependency map

## Example: choosing a figure tool (cheat sheet)

- Document: [`docs/figure-cheatsheet/README.md`](docs/figure-cheatsheet/README.md) "Which figure, with which tool"
- Mermaid when it is enough; D2 (TALA / ELK / dagre) for structures Mermaid can't handle; SVG / HTML for free-form figures that don't fit D2. A figure that copies a tool's output is generated from that output together with its fact sheet. Includes a comparison that draws the same samples with Mermaid and D2's three engines (`samples/compare.mjs`).
- Measured findings: the direction inside a container is ignored by Mermaid once inner nodes link outside, and always silently ignored by ELK and dagre; only TALA kept it. TALA's layout changes completely with the seed, and it slows down sharply as boxes are added.

## Usage

```sh
npm install            # Node 24+ (required by vlmkit)
npm run setup:tla      # fetch TLC and Apalache into .tools/ (Java 17+)
npm run setup:d2       # fetch D2 (TALA / ELK) into .tools/, for hand-written D2 figures
npm run verify         # verify docs/formal-methods → verdict: VERIFIED
npm run build          # build docs/formal-methods/dist/index.html
npm run verify:book    # verify docs/inductive-invariant-book → book verdict: VERIFIED
npm run build:book     # build docs/inductive-invariant-book/dist/*.html
npm run verify:cheatsheet   # verify docs/figure-cheatsheet (re-runs the engine comparison, ~2 min)
npm run figure -- docs/formal-methods/figures/coverage.svg   # render and check one figure; look at the sheet it prints
npm run figure:variants -- docs/figure-cheatsheet/figures/arch.d2   # lay out D2 / Mermaid candidates with scores; compare and choose
npm run test:figures   # regression tests for figure-check
npm run readme:images  # rebuild the README images (docs/readme/*.png)
npm run icons -- search database --sheet /tmp/icons.png   # find icons and look at the candidates; then: npm run icons -- add lucide:database
```

## Measuring the skills (evals)

`evals/<case>/prompt.md` and `graders/*.md` are cases for `claude plugin eval`.
Each case runs with and without the plugin, and the score difference (Δ) is reported.

```sh
claude plugin eval . --trust-plugin --allow-tools Bash Write Edit Agent -j 4
```

| Case | What it looks at |
|---|---|
| `crash-course` | Does it skip what the reader knows? Does it run code and show the output? Is there a quiz? |
| `crash-course-known-heavy` | On a topic that invites "X is…" openings even for experts (BuildKit caching), does it skip the known parts and explain the core correctly? |
| `crash-course-persona-implicit` | The same topic, with the reader's knowledge only in the persona file, not in the request |
| `crash-course-persona-build` | Given only the reader's name and team, does it check before writing, or state its assumptions? Does it avoid inventing a background? |
| `book` | Is chapter 1 a quickstart? Does each chapter have objectives and quizzes with answers? Does it run the exercise answers to check them? |
| `pr-reader-first` | When the reader is unknown, does it check before writing, or state its assumptions? |
| `pr-value-first` | For a PR whose impact the diff does not show (retry backoff with jitter, explained to an on-call SRE), does it say what changes during an outage first, and the code after? |
| `data-diagnostics` | Explaining a logistic regression's diagnostics to a PM who decides whether to ship it: is there a verdict table (item, measured, criterion, verdict, next action), do panel titles say what passes, are pass lines dashed, and is the chart a Vega-Lite spec? |
| `one-liner-control` | Control. For a one-sentence question, does it avoid calling the skill and producing a document? |
| `first-reader-no-rewrite` | When reviewing a draft, does it report the reader's experience without rewriting? |

The latest results, and caveats on reading them, are in [`evals/RESULTS.md`](evals/RESULTS.md) (in Japanese).
In the 2026-09-25 to 27 runs, using only graders that don't depend on a shell, the Δ values were:

| Case | Δ |
|---|---|
| `crash-course` | +0.43 (3 runs each, 5th round) |
| `crash-course-known-heavy` | +0.25 |
| `crash-course-persona-implicit` | +0.12 |
| `crash-course-persona-build` | +0.20; +0.40 in the 9th round, after adding the rule to record a provisional persona; +0.13 in the 10th, after adding a reply template (the persona file was written in 3 of 3 runs); +0.33 in the 11th, with a reply form for writing on assumptions too (every grader passed in all 3 runs with the skill) |
| `pr-reader-first` | +0.50 |
| `book` | +0.28 |
| control case | no difference (no over-triggering) |

Reporting code it could not run happened in 6 of 6 runs with the skill and 1 of 6 without.
When the reader's information was given (in the request or in a persona file), skipping known material happened even without the skill.
In that environment the shell did not work inside the eval sandbox, so graders that look at code execution were disabled.

Unit tests for the `first-reader` scripts: `python3 tests/first-reader/test_first_reader.py` and `test_cjk.py`.

## Layout

| Path | Contents |
|---|---|
| `skills/explainer/SKILL.md` | The skill (one crash course) |
| `skills/explainer-book/SKILL.md` | The book version (chaptered course). `scripts/verify-book.mjs` checks the whole book |
| `skills/explainer/references/` | Guides for personas, writing and figures |
| `skills/explainer/scripts/verify-doc.mjs` | Verification (checks / figures / quotes / vlmkit gates) |
| `skills/explainer/scripts/build-html.mjs` | Markdown → self-contained HTML |
| `skills/explainer/scripts/icons.mjs` | Finds icons in the installed Iconify sets (lucide, logos), shows candidates in one image, places the chosen ones next to the figure and records their source and license in ICONS.md |
| `skills/explainer/scripts/tlc-to-mermaid.mjs` | TLC state graphs and counterexamples → Mermaid figures and fact sheets |
| `skills/explainer/scripts/figure-check.mjs` | Renders and checks hand-written SVG / HTML / D2 / Mermaid figures, and makes a sheet to look at (light, dark, phone) |
| `skills/explainer/scripts/figure-arrows.mjs` | Arrow readability checks, and a sheet with each edge highlighted in turn (used by figure-check) |
| `skills/explainer/scripts/figure-variants.mjs` | Draws D2 / Mermaid layout candidates (TALA seeds, ELK, dagre, directions) and lays them out with scores |
| `tests/figure-check/` | Regression tests for figure-check (each bad figure fails its check) |
| `personas/` | Reader personas |
| `docs/<topic>/` | Documents: `README.md`, `checks.json`, `examples/`, `figures/` |
| `docs/<topic>-book/` | Books: `README.md` (contents), `book.json`, `NN-*.md`, `checks.json`, `examples/`, `figures/` |
| `docs/readme/` | Images for this README |
| `skills/first-reader/` | Simulated readers (bundled, Apache-2.0) |
| `.claude-plugin/` | Plugin and marketplace definitions |
| `evals/` | Cases for `claude plugin eval` |
| `tests/first-reader/` | Unit tests for the first-reader scripts |
| `scripts/readme-images.mjs` | Rebuilds the README images |

## License

[MIT](LICENSE).
`skills/first-reader/` keeps the license of its source (Apache-2.0; see `skills/first-reader/LICENSE` and `NOTICE`).
Icons placed in documents keep their sets' licenses (Lucide: ISC, logos: CC0; logos are their owners' trademarks), recorded per icon in `figures/icons/ICONS.md`.
