# DevCanvas

A diagram-as-code editor: write a small text DSL on one side, see it rendered
as an interactive flowchart on the other — auto-laid-out, draggable,
exportable, and shareable via a URL.

## Features

- **Text-to-diagram DSL** — a small `flowchart` syntax, parsed live as you
  type, with inline error reporting that never clobbers the last valid render.
- **Interactive canvas** — pan, zoom, drag nodes, auto-layout, undo/redo.
- **Keyboard-first editing** — select, delete, and nudge nodes without a
  mouse; see [Keyboard shortcuts](#keyboard-shortcuts) below.
- **Local persistence** — diagrams save to IndexedDB, autosave in the
  background, and recover an unsaved draft if the tab closes mid-edit.
- **Export** — SVG, PNG, and a round-trippable `.devcanvas` file format.
- **Share links** — encode a diagram straight into a URL, no server needed.
- **Embed mode** — drop a read-only diagram into another page via `<iframe>`.
- **Tutorials** — a few worked examples of the DSL, built into the app.
- **Light / dark / midnight themes**, synced between the canvas and the
  Monaco editor.

## Tech stack

- [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) + TypeScript
- [Vite](https://vite.dev/) for dev/build
- [Pinia](https://pinia.vuejs.org/) for state
- [Vue Router](https://router.vuejs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the DSL
  editor, with a custom language definition
- IndexedDB for local storage (diagrams + crash-recovery drafts)
- [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/)
  for unit/integration tests
- [Playwright](https://playwright.dev/) for end-to-end tests

## Quick start

Requires Node 20+ (see [`.nvmrc`](./.nvmrc); developed against Node 22).

```bash
git clone https://github.com/sanya-shch/devcanvas.git
cd devcanvas
npm install
npm run dev
```

Open the printed local URL — the editor loads at `/editor` with a starter
diagram.

## The DSL

A diagram is a `flowchart` declaration followed by node and edge statements.

```
flowchart LR

Browser["Web Browser"] -- HTTP request -> API["REST API"]
API -- "SQL query" -> Database(PostgreSQL)
API -- 'cache lookup' -> Redis{Redis Cache}
```

- **Direction**: the first line must be `flowchart LR` (left-to-right) or
  `flowchart TD` (top-down).
- **Nodes**: `id`, `id[Label]`, `id{Label}`, or `id(Label)` — the three
  bracket styles are equivalent label delimiters, not shape selectors (use
  `"..."` or `'...'` inside them for labels containing spaces or special
  characters). A node's **shape** — rectangle, rounded, circle, or diamond —
  is set from the inspector panel after selecting it on the canvas, not from
  the syntax, and is preserved across edits.
- **Edges**: `from -> to`, or `from -- label -> to` / `from -- "label" -> to`
  for a labeled edge.
- Reference a node by its `id` after its first definition to add more edges
  from/to it without repeating the label.
- `// ...` starts a line comment.

Parse errors are shown inline with a line number, and the canvas keeps
rendering the last valid diagram until the source is valid again.

## Keyboard shortcuts

| Keys                                     | Action                                                  |
| ---------------------------------------- | ------------------------------------------------------- |
| `Cmd/Ctrl + Z`                           | Undo                                                    |
| `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` | Redo                                                    |
| `Delete` / `Backspace`                   | Delete the selected node                                |
| Arrow keys (`Shift` for larger steps)    | Move the selected (focused) node                        |
| `Escape`                                 | Deselect the current node / close the shortcuts overlay |
| `Cmd/Ctrl + Enter`                       | Parse immediately                                       |
| `Cmd/Ctrl + 0`                           | Reset zoom and pan                                      |
| `?`                                      | Show the shortcuts overlay                              |

Diagram nodes are keyboard-focusable (`Tab`) and announce their label and
shape to screen readers; `Enter`/`Space` selects a focused node.

## Embedding a diagram

`/embed` renders a single, read-only diagram with no editor chrome — meant
for dropping into an `<iframe>` on another page:

```html
<iframe
  src="https://your-deployment/embed?source=flowchart%20LR%0A%0AA-%3EB"
  width="100%"
  height="400"
  style="border: 0"
></iframe>
```

Supported query parameters:

- `source` — URL-encoded DSL source (as above), **or**
- a `#share=...` hash (the same format `createShareUrl()` produces from the
  editor's Share button) — either works.
- `theme` — `light`, `dark`, or `midnight`. Applies to that embed only; it
  never touches the visitor's saved theme preference for the main app.

Panning and zooming still work in embed mode; dragging, selecting, and
editing nodes are disabled.

## Available scripts

| Script                            | What it does                                        |
| --------------------------------- | --------------------------------------------------- |
| `npm run dev`                     | Start the Vite dev server                           |
| `npm run build`                   | Typecheck, then build for production                |
| `npm run preview`                 | Preview a production build locally                  |
| `npm run typecheck`               | `vue-tsc` across the app, e2e, and config projects  |
| `npm run lint` / `lint:fix`       | ESLint                                              |
| `npm run format` / `format:check` | Prettier                                            |
| `npm run test:watch`              | Vitest, watch mode                                  |
| `npm run test:run`                | Vitest, single run (unit + integration)             |
| `npm run test:e2e`                | Playwright E2E suite (starts the dev server itself) |
| `npm run test:e2e:ui`             | Playwright's interactive UI mode                    |

## Testing

**Unit/integration** (Vitest, jsdom) cover the DSL parser, serializer,
auto-layout, edge routing, undo/redo history, IndexedDB repositories, the
editor store, and component-level interaction (drag, pan, zoom, keyboard).

```bash
npm run test:run
```

**End-to-end** (Playwright, real Chromium) cover the flows that only make
sense across the whole stack: typing a diagram and seeing it render, saving
and reloading, exporting, the share-link round trip, keyboard shortcuts, and
embed mode.

```bash
npx playwright install --with-deps chromium   # first time only
npm run test:e2e
```

Crash-recovery drafts are covered at the unit level only — the recovery flow
depends on catching a real interrupted save mid-flight, which is inherently
timing-based and not something to script reliably in browser automation.

## Project structure

```
src/
  app/                 # router, page-title helper
  components/
    canvas/            # DiagramCanvas, DiagramNode, NodeInspector (SVG canvas)
    editor/            # Monaco-based CodeEditor + DSL language definition
    layout/            # AppShell, header/nav chrome
    theme/             # ThemeSwitcher
  content/tutorials/   # built-in worked DSL examples
  features/
    diagram/           # parser, serializer, layout, edge routing, history, SVG export
    diagrams/          # saved-diagram persistence (IndexedDB)
    drafts/            # crash-recovery draft persistence
    file/              # .devcanvas file format (import/export)
    share/             # URL-hash share codec
    storage/           # generic IndexedDB repository + database setup
    theme/             # Monaco theme definitions
    tutorials/         # tutorial registry
  pages/
    editor-page/       # composables that make up EditorPage (see below)
    *.vue              # HomePage, EditorPage, DiagramsPage, TutorialsPage,
                        # EmbedPage, NotFoundPage
  stores/
    editor/            # composables that make up the editor Pinia store
    editor.ts          # thin orchestration over stores/editor/*
    diagrams.ts, theme.ts
e2e/                   # Playwright specs
```

`stores/editor.ts` and `pages/EditorPage.vue` are both intentionally thin —
each composes small, single-purpose modules from `stores/editor/` and
`pages/editor-page/` respectively (state, viewport, parsing, history,
persistence, keyboard shortcuts, export, draft recovery, ...). See the
comments at the top of `stores/editor.ts` for the composition order and why
it's structured that way.

## License

[MIT](./LICENSE)
