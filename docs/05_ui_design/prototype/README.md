# UI Prototype

**Status:** Static design prototype for review. Not application code.

This directory is a low-fidelity, clickable prototype of the six UI surfaces specified in [design.md](../design.md) and [layouts/](../layouts/). It exists to validate information architecture, section order, states, copy placement, and responsive behavior before the M1 implementation.

## 1. Why this is not `web/`

[AGENTS.md](../../../AGENTS.md) section 6 defers application code (`api/`, `web/`, `agent/`) to M1, after the M0 evaluation set is frozen. This prototype is therefore a static design artifact: plain HTML, CSS, and JavaScript with no build step, no framework, no package manager, and no network requests. It does not use React, Vite, Tailwind, LangChain, or any runtime dependency. It is not the M1 application.

## 2. Run

Open `index.html` directly, or serve the directory:

```bash
cd docs/05_ui_design/prototype
python3 -m http.server 8791 --bind 127.0.0.1
# http://127.0.0.1:8791/index.html
```

No install, no build, no external asset. Inter is not bundled; the token file falls back to `system-ui`, which design.md section 4.1 permits.

## 3. Files

| File | Role |
|---|---|
| `index.html` | App shell and the four surface mounts. Copy-bearing elements are empty until the localization file hydrates them. |
| `tokens.css` | Vendored token values from the Airtable snapshot, with the two deviations recorded in design.md section 4.1. |
| `prototype.css` | Layout, components, responsive reflow, and the prototype bar. |
| `copy.zh.js` | The single localization resource file and the synthetic fixture data. It is the only file in the prototype that contains Chinese text. |
| `prototype.js` | Rendering, state, deep links, and interactions. English only. |
| `README.md` | This file. |

### Token source

`tokens.css` reproduces the snapshot at `brands-design-md/brands/airtable/variables.css`, snapshot date 2026-11-22, SHA-256 `6aa0d2dd74e5d874b3a5d62b67085c0028fe665b02a411385ce5b7daacb9bafb`.

The two deviations are the approved substitute font stack (`Inter, system-ui, sans-serif`) and the added `--font-mono` token. Colors, the type scale, and the standard radii come from `tokens.css`; the common padding, gap, margin, and offset values use the spacing tokens. Shell constants and documented component geometry (64px nav, 240px rails, 320px detail, 44px inputs, 40px icon buttons, 40/48px table rows, 10px dense-cell padding) remain literals because the layout documents record them as derived dimensions. The prototype introduces no new color; the only color literal outside `tokens.css` is the documented scrim alpha derived from `--color-ink`.

At M1 the single token source becomes `web/src/styles/tokens.css`, vendored under the same rules. This file must not become a second long-lived source.

## 4. Prototype controls

The cream bar above the product UI is meta-UI, not part of the design. It provides:

- Surface tabs: Chat, Schema graph, Semantic admin, Evaluation.
- A state selector whose options change with the active surface.
- A **Hide bar** control for clean screenshots. When hidden, a floating **Show prototype controls** button returns it.
- The bar is English because it is a review instrument, not product UI.

### Deep links

Every surface and state is reachable from the URL, which keeps review screenshots reproducible:

```text
index.html?surface=chat&state=rejected
index.html?surface=chat&state=clarification
index.html?surface=graph&state=table
index.html?surface=admin&state=error
index.html?surface=eval&state=blocked
```

| Surface | State values |
|---|---|
| `chat` | `empty`, `loading`, `streaming`, `fast`, `verified`, `answered`, `clarification`, `rejected`, `abstain`, `degraded`, `stale`, `clamped`, `chart-pending`, `chart-unavailable` |
| `graph` | `graph`, `table`, `degraded`, `empty` |
| `admin` | `clean`, `dirty`, `saved`, `error`, `degraded`, `stale`, `projection`, `empty`, `empty-type` |
| `eval` | `pass`, `blocked`, `degraded`, `stale`, `running`, `empty`, `loading` |

## 5. What is real and what is mock

**Real, taken from the design documents:**

- Token values, type roles, spacing, radius, and the measured contrast pairs.
- Shell dimensions, breakpoints, content widths, and the 12-column dashboard grid.
- Section order, component anatomy, state treatment, and the accessibility rules.
- The deterministic-boundaries language in the UI: the rejected state, the safety reason codes, the abstain state, the row-clamp notice, and the trace anatomy.

**Mock, invented for the prototype:**

- The entire schema: `orders`, `channels`, `payments`, `refunds`, `customers`, `products`, and their columns.
- All questions, SQL, result rows, KPI values, run IDs, timestamps, owners, costs, failure counts, case IDs, and audit rows.
- The evaluation metrics. They are plausible but synthetic; they are not a claim about the system.
- The charts. Both charts are static inline SVG mocks. design.md section 10 and D-11 require Vega-Lite at implementation; the prototype uses SVG only to validate the chart slot, labels, legend, data-table fallback, and the 240px band.
- The graph. It is an HTML/SVG mock, not Neo4j, Cytoscape, or a real projection.

`schema/` and `eval/` are still empty, so no real schema or evaluation case was available. Every mock value is in `copy.zh.js` and must not be read as a business fact.

## 6. Copy and language

- Product UI copy is Chinese, the O-07 default at M4, and lives only in `copy.zh.js`. This follows AGENTS.md section 1 exception 1: UI copy is in one localization resource file; code, comments, file names, and this README stay English.
- `index.html` holds no English UI copy. Copy-bearing elements are empty and are hydrated from `copy.zh.js` on load. The only static English text is the product identifier, the meta prototype bar, and the document title fallback.
- Reason codes, run IDs, SQL identifiers, and mock table names are English intentionally.
- If O-07 resolves to English, only `copy.zh.js` changes; the rendering code stays as is.

## 7. Surface and state coverage

| Surface | Coverage |
|---|---|
| Chat | Empty, loading, streaming, fast path, verified short-circuit, answered, clarification with two candidates, rejected, abstain, degraded, stale, row-clamped, chart pending, chart unavailable; docked trace at 1280, bottom sheet below. |
| Schema graph | Graph view, table view, filter rail, verified and hot toggles, node selection, docked detail at 1280 and drawer below, degraded fallback to table view, empty filter result. |
| Semantic admin | Five asset types; join, table, column, enum, and term editors; clean, dirty, saved, validation error, degraded, stale schema, projection pending, no selection, and empty type; unsaved-changes modal; audit strip. |
| Evaluation | Pass, release blocked, degraded, stale schema, running, empty, loading; KPI band, secondary strip, failure taxonomy, trend with data table, ablation, case table, case panel. |

The admin mobile drill-down uses a native type select and a list/editor swap below 768. The graph mobile default is the table view; the graph toggle remains available. The chat clarification cards stack below 1024.

## 8. Responsive and visual checks

Rendered and inspected with headless Chrome at:

- **1280x800 and 1280x1000:** desktop shell; history rail in flow; trace docked at 320; graph detail docked at 320; KPI band 3-up; no horizontal page scroll.
- **1440x1000:** content box 1136; KPI band 6-up; graph and chat columns reach their documented widths.
- **1024x768:** laptop band; history rail in flow; trace is a bottom sheet; graph detail is an overlay; KPI 3-up; case table scrolls inside its panel; no horizontal page scroll.
- **768x1024:** tablet band; history rail is a drawer; chat is one column; tables scroll inside their cards.
- **500x900:** mobile band; one fluid column; composer row; admin drill-down list/editor; graph table view default; KPI 2-up; secondary strip 2-up.
- **390px exact width:** checked in a 390px iframe. The document reported `scrollWidth = 390` and no page overflow.

Chrome headless on macOS clamps `--window-size` to a 500px minimum, so a 390px screenshot from the command line is a cropped 500px layout, not a real mobile render. Use an iframe or a real mobile emulator for 390px checks.

Not covered by automation: real mobile browsers, 200% zoom, screen readers, and high-contrast mode. Those remain manual review items from design.md section 16 and the layout acceptance checks.

## 9. Interaction checks

A temporary headless iframe harness exercised the following; all passed. The harness was removed so the prototype stays dependency-free.

- Trace step expansion and payload visibility.
- Chart data-table toggle.
- Surface switching and state switching.
- Graph node selection, detail panel, table view, and graph view.
- Admin asset selection, verified switch, dirty state, save, validation error, and unsaved-changes modal.
- Case panel open and Escape close.
- Evaluation empty to running to pass transition.
- Clarification two-candidate rendering and rejected-state question restoration.

## 10. Findings and deviations

These are design questions the build exposed. They are recorded here for review; the design documents were not silently changed.

1. **Clarification card width arithmetic.** `chat.md` section 2 says each candidate card is 308px at 1280. The answer column is 632px; the answer card's 24px padding leaves 584px; two cards with a 16px gap are 284px each. The prototype uses 284 and keeps the 16px gap. Either the card width or the answer-card padding needs to change in the spec.
2. **No on-dark primary button.** `design.md` section 8.6 places a primary button inside the dark signature card in the empty state, but section 8.1 defines no inverse or on-dark primary variant; the primary fill is ink, which disappears on the dark card. The prototype uses a canvas-fill inverse button inside the card. This needs a design decision: add an inverse variant, or move the button outside the dark card.
3. **KPI wrap threshold.** `design.md` section 9.5 says the six KPI cards wrap at 1024px, while `evaluation-dashboard.md` section 2 reads that threshold against the content box, making 6-up start at a 1328px viewport. The prototype follows the layout reading: 3-up at 1280, 6-up at 1440. One of the two documents should state the intended reading.
4. **Non-numeric fast-path result.** The fast path returns a status word, not a number. `design.md` section 9.2 describes a 32px KPI number for a single-value result. The prototype uses the same single-value slot for the status word. The design should say whether non-numeric single values use that slot or the answer headline only.
5. **Defaults used without a decision.** Chinese UI copy (O-07 default), inline SVG glyphs instead of a library (O-10 default is the shadcn icon set at M1), `--radius-lg` for buttons (U-01 default), a docked trace at 1280 (U-02 default), and the empty-state signature card (U-03 default). These are review defaults, not decisions.
6. **Button and graph-node geometry.** `design.md` section 8.1 specifies 16px/24px button padding; the prototype uses 10px/24px to stay near the 40px control height used by the shell. The graph-node spec (16px padding, body-md label, caption column count) does not fit the 368px canvas at 1280 with three columns; the prototype uses 10px/12px padding, a 13px label, and a 12px column count. Review should widen the canvas, reduce the nodes per row, or amend the node spec.

## 11. What this prototype does not prove

- It does not prove the agent graph, the safety gate, the executor, retrieval, or the SSE contract.
- It does not prove chart correctness or Vega-Lite rendering.
- It does not prove accessibility conformance. It applies the documented focus, labeling, table, and reduced-motion rules, but no automated or screen-reader audit was run.
- It does not use the real schema, the frozen evaluation cases, or real metrics.
- It does not replace the M0 evaluation freeze or the M1 implementation.

## 12. Verification commands

The repository gates for Python and frontend code do not apply to this static artifact. The checks used were:

```bash
node --check prototype.js
node --check copy.zh.js
# Headless Chromium screenshots at 1280x800, 1280x1000, 1440x1000,
# 1024x768, 768x1024, and 500x900, plus the iframe-based 390px check.
```

The only server 404 observed was `favicon.ico`; the prototype intentionally ships no favicon.
