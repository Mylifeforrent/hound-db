# UI Design

**Status:** Draft for review. Implements the four UI surfaces of the [architecture](../01_architecture/architecture.md) on top of the Airtable token snapshot.

## 0. Document control

| Field | Value |
|---|---|
| Scope | UI design system and surface specifications for the web app (`web/`) |
| Token source | `brands-design-md/brands/airtable` (outside this repository) |
| Snapshot date | 2026-11-22 |
| `tokens.json` SHA-256 | `0e09e775b33953b099b04606ab46d6353455b3633799bb069a220be351ff8f13` |
| `variables.css` SHA-256 | `6aa0d2dd74e5d874b3a5d62b67085c0028fe665b02a411385ce5b7daacb9bafb` |
| Upstream authority | [airtable.com](https://www.airtable.com/); the live site wins over this snapshot |
| Related | [Requirements](../00_requirement/requirements.md), [architecture](../01_architecture/architecture.md), [evaluation protocol](../02_eval/evaluation-protocol.md), [AGENTS.md](../../AGENTS.md) |

This document is self-contained: all values are reproduced here. M1 vendors one file, `web/src/styles/tokens.css`, reproducing the snapshot's `:root` block value for value, with two recorded deviations: the three `--font-*` families are replaced by the approved substitute stack in section 4.1, and `--font-mono` is added (section 4.1). The vendored file's header records those deviations, the source path, the snapshot date, and the checksums above. Components MUST consume the CSS variables, never raw hex values. Tailwind v4 projects MAY load the same values through `@theme`.

The token set is the ceiling, not a suggestion. Adding a color, radius, or step requires a new decision-log entry. Project-level rules that the snapshot does not cover (status semantics, monospace, motion, layering) are listed in section 14 and MUST be ratified before they are treated as frozen.

## 1. Principles

1. **Evidence first.** Every answer exposes the SQL, the tables used, and the step trace (NFR-05). The design makes evidence easy to read, not hidden behind a disclosure.
2. **Sober canvas, rare voltage.** The canvas is white, type is dark ink, and brand color appears in a small number of deliberate places: status, signature cards, the graph. No decorative color.
3. **Modest type.** Weights 400-600 only. Big type is for page titles and single KPI numbers, never for emphasis inside prose.
4. **Dense where data lives, comfortable everywhere else.** Tables and traces are dense; empty states and onboarding use the generous end of the scale.
5. **Honest states.** Abstain, degraded, stale, clamped, and rejected are designed states with their own treatment. They never look like success, and they never hide the reason code.
6. **No invented values.** If a token is missing, the answer is a documented extension, not an eyeballed hex value.

## 2. Token governance

- One source: `web/src/styles/tokens.css`, vendored from the snapshot and marked with the source path, snapshot date, and the checksums above.
- No runtime dependency on the brands repository, a CDN, or a remote font service (NFR-07: the LLM API is the only external dependency).
- Components MUST NOT contain hex values, magic radii, or arbitrary spacing. A review rejects `#f5f5f5`, `border-radius: 8px`, `margin-top: 10px`.
- The snapshot has no dark theme (`theme: light`). v1 is light-only.
- Drift check: when re-vendoring, recompute the checksums and update this table in the same commit.

## 3. Color

All values below are exact. The "App use" column is normative for this product.

### 3.1 Neutrals, text, and surfaces

| Token | Value | Role | App use |
|---|---|---|---|
| `--color-canvas` | `#ffffff` | Canvas | Page background, cards, inputs, tables |
| `--color-surface-soft` | `#f8fafc` | Surface soft | Page gutters, code blocks, table hover, graph canvas |
| `--color-surface-strong` | `#e0e2e6` | Surface strong | Selected rail item, KPI band, disabled fill |
| `--color-hairline` | `#dddddd` | Hairline | Decorative dividers and table row rules only |
| `--color-border-strong` | `#9297a0` | Border strong | Emphasis borders, graph node outline, disabled controls |
| `--color-ink` | `#181d26` | Ink | Headings, primary text, primary button fill |
| `--color-body` | `#333840` | Body | Table cells, secondary prose |
| `--color-muted` | `#41454d` | Muted | Captions, metadata, placeholders, axis labels |
| `--color-primary` | `#181d26` | Primary | Primary button, selected tab indicator |
| `--color-primary-active` | `#0d1218` | Primary active | Primary button pressed state |
| `--color-surface-dark` | `#181d26` | Surface dark | At most one dark band per view |
| `--color-surface-dark-elevated` | `#1d1f25` | Dark elevated | Cards inside a dark band |
| `--color-on-primary` | `#ffffff` | On primary | Text on primary fill |
| `--color-on-dark` | `#ffffff` | On dark | Text on dark fill |

### 3.2 Semantic and accent colors

| Token | Value | Role | App use |
|---|---|---|---|
| `--color-link` | `#1b61c9` | Link | Links, focus ring on light surfaces |
| `--color-link-active` | `#1a3866` | Link active | Visited/pressed link |
| `--color-info` | `#254fad` | Info | Informational text and badges |
| `--color-info-border` | `#458fff` | Info border | Info accent border and chart series |
| `--color-success` | `#006400` | Success | Pass, verified, healthy, gate met |
| `--color-success-border` | `#39bf45` | Success border | Success accent border and chart series |
| `--color-pricing-ink` | `#1d1f25` | Pricing ink | Unused in this product |

### 3.3 Signature colors

| Token | Value | Role | App use |
|---|---|---|---|
| `--color-signature-coral` | `#aa2d00` | Coral | Danger, safety rejection, failed eval, destructive confirm |
| `--color-signature-forest` | `#0a2e0e` | Forest | Only as a dark band alternative; never for text on light |
| `--color-signature-cream` | `#f5e9d4` | Cream | Abstain callout, LLM badge, onboarding aside |
| `--color-signature-peach` | `#fcab79` | Peach | Decorative accent; chart series 6 |
| `--color-signature-mint` | `#a8d8c4` | Mint | Deterministic badge, verified accent, focus ring on dark |
| `--color-signature-yellow` | `#f4d35e` | Yellow | Highlight only; never text on a light surface |
| `--color-signature-mustard` | `#d9a441` | Mustard | Warning, degraded mode, stale answer, advisory hint |

### 3.4 Product status mapping

The snapshot has no warning or danger token. This mapping is a project rule built from existing tokens; no new colors are introduced.

| Status | Fill | Text | Border/accent | Use |
|---|---|---|---|---|
| Danger | `--color-signature-coral` | `--color-on-primary` | coral | Safety rejection, release block, destructive confirm, failed case |
| Warning | `--color-signature-mustard` | `--color-ink` | mustard | Degraded mode, stale verified answer, `LIMIT_CLAMPED`, advisory lint, abstain-adjacent notices |
| Positive | `--color-success` | `--color-on-primary` | success border | Verified answer, pass, healthy dependency, gate met |
| Info | `--color-info` | `--color-on-primary` | info border | Neutral informational banner |
| Neutral | `--color-surface-strong` | `--color-ink` | border strong | Few-shot, held-out, unverified, skipped |

Rules:

- Warning and danger MUST carry a text label and a reason code; color alone is never the signal.
- `--color-signature-yellow` is never used as text on canvas or surface-soft. On light surfaces it fails contrast.
- `--color-signature-coral` is never body text. Use it for filled badges, borders, icons, and short labels.
- Filled status colors are limited to badges, banners, and buttons. Never fill a table, a whole card, or a page with a status color.

### 3.5 Measured contrast

Ratios below are computed from the token values (WCAG 2.1 relative luminance).

| Pair | Ratio | Allowed |
|---|---|---|
| ink on canvas | 16.90 | Any text |
| body on canvas | 11.79 | Any text |
| muted on canvas | 9.62 | Any text |
| muted on surface-soft | 9.19 | Any text |
| ink on surface-strong | 13.03 | Any text |
| link on canvas | 5.83 | Any text |
| link on surface-soft | 5.58 | Any text |
| link-active on canvas | 11.66 | Any text |
| info on canvas | 7.50 | Any text |
| success on canvas | 7.44 | Any text |
| coral on canvas | 6.81 | Short labels, icons; not body text |
| white on coral | 6.81 | Any text |
| white on success | 7.44 | Any text |
| white on info | 7.50 | Any text |
| ink on cream | 14.07 | Any text |
| ink on peach | 9.05 | Any text |
| ink on mint | 10.69 | Any text |
| ink on mustard | 7.51 | Any text |
| white on surface-dark | 16.90 | Any text |
| mint on surface-dark | 10.69 | Any text |
| peach on surface-dark | 9.05 | Any text |
| mustard on surface-dark | 7.51 | Any text |
| border-strong on canvas | 2.93 | Fail for control boundaries (see below) |
| hairline on canvas | 1.36 | Decorative only |

Consequences:

- Form controls, toggles, and selectable cards MUST use `--color-muted` or `--color-ink` for their boundary. `--color-border-strong` at 2.93:1 fails the 3:1 non-text requirement and is reserved for emphasis borders and graph outlines where the boundary is not the only affordance.
- `--color-hairline` is never the sole boundary of an interactive control.
- Any new pair used for text MUST be added to this table with its ratio before merge.

## 4. Typography

### 4.1 Families

| Purpose | Stack | Notes |
|---|---|---|
| Display and UI (`--font-primary`, `--font-family-2`) | `Inter, system-ui, sans-serif` | Substitutes for Haas Groot Disp / Haas. Do not bundle or reference Haas; it is not licensed here |
| Numeric display (`--font-family-3`) | `Inter, system-ui, sans-serif` | Same substitute; no separate face |
| Code and identifiers (project extension) | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | No monospace token exists in the snapshot |

Inter MUST be bundled with the app or replaced by `system-ui`. Loading fonts from a CDN is forbidden (NFR-07, local-first, offline demo).

### 4.2 Type scale

| Role | Size | Line height | Tracking | Token | App use |
|---|---|---|---|---|---|
| display-xl | 48px | 1.1 | 0 | `--text-display-xl` | Empty-state title, onboarding hero only |
| display-lg | 40px | 1.2 | 0 | `--text-display-lg` | Empty-state title; never in app chrome |
| display-md | 32px | 1.2 | 0 | `--text-display-md` | KPI number, page title on dashboards |
| title-lg | 24px | 1.35 | 0.12px | `--text-title-lg` | Section title, answer headline |
| title-md | 20px | 1.5 | 0 | `--text-title-md` | Panel title, clarification candidate title |
| title-sm | 18px | 1.4 | 0 | `--text-title-sm` | Card title, modal title |
| label-md | 16px | 1.4 | 0 | `--text-label-md` | Form label, primary navigation |
| button | 16px | 1.4 | 0 | `--text-button` | All button labels |
| body-md | 14px | 1.25 | 0 | `--text-body-md` | Base UI text, table cells, prose |
| caption | 14px | 1.35 | 0.16px | `--text-caption` | Metadata, timestamps, hints, table headers |
| legal | 13.12px | 1.2 | 0 | `--text-legal` | Footer, license text |
| pricing-display | 44.8px | 1.1 | 0 | `--text-pricing-display` | Unused in this product |
| pricing-section | 28px | 1.2 | 0 | `--text-pricing-section` | Unused in this product |
| pricing-card-title | 20px | 1.3 | 0 | `--text-pricing-card-title` | Unused in this product |

Rules:

- Each size token ships with a matching `--leading-<role>` and `--tracking-<role>` token; the line-height and tracking columns above reproduce those values. Components MUST set all three together.
- Weights 400, 500, 600 only. Weights 500 and 600 are for titles and numeric emphasis. Body copy stays 400.
- ALL-CAPS is forbidden. Sentence case everywhere.
- Tables, KPI numbers, latencies, token counts, and SQL identifiers use `font-variant-numeric: tabular-nums`.
- Long identifiers wrap with `overflow-wrap: anywhere`; never truncate the middle of a table or column name without a title attribute.
- Prose line length stops at 72 characters; tables and traces are exempt.
- Do not scale the type ramp with viewport width. Use the fixed steps and reflow the layout.

## 5. Spacing, layout, and radius

### 5.1 Spacing scale

| Token | Value | App use |
|---|---|---|
| `--spacing-xxs` | 4px | Icon-to-label, badge internals |
| `--spacing-xs` | 8px | Inline gaps, compact cell padding |
| `--spacing-sm` | 12px | Control padding, list item gap |
| `--spacing-md` | 16px | Default gap, card padding (compact) |
| `--spacing-lg` | 24px | Card padding (default), panel gap |
| `--spacing-xl` | 32px | Section gap inside a panel |
| `--spacing-xxl` | 48px | Page section gap, signature card padding |
| `--spacing-section` | 96px | Marketing/empty-state sections only; never in tables or admin forms |

### 5.2 Radius

| Token | Value | App use |
|---|---|---|
| `--radius-xs` | 2px | Inline code, tags |
| `--radius-sm` | 6px | Inputs, selects, textareas |
| `--radius-md` | 10px | Cards, banners, code blocks, modals |
| `--radius-lg` | 12px | Buttons, signature cards |
| `--radius-pill` | 9999px | Filter chips, split badges, connection pill |
| `--radius-full` | 9999px | Circular icon buttons, avatars, status dots |

### 5.3 App shell

| Dimension | Value |
|---|---|
| Top nav height | 64px, canvas background, hairline bottom border |
| History rail width | 240px, canvas background, hairline right border |
| Admin list rail width | 240px |
| Content max width | 1200px, centered, page gutter `--spacing-xl` |
| Answer column max width | 880px |
| Default element gap | 16px (`--spacing-md`) |
| Card padding | 24px (`--spacing-lg`); 32px for signature and KPI cards |
| Table row height | 40px dense, 48px comfortable default |
| Input height | 44px |
| Icon button size | 40px |

Responsive rules:

- At 1024px and wider: three-column shell (nav, rail, content).
- Below 1024px: the history rail collapses to a 40px icon button opening an overlay drawer; content keeps 16px gutters.
- Below 768px: tables scroll horizontally inside their panel; cells never wrap mid-number.
- No horizontal page scroll at 1280x800 or 1024x768.

## 6. Elevation, borders, and layering

The snapshot defines no shadow tokens. Elevation is expressed with borders and surface steps, not shadows.

- Cards: canvas fill plus 1px hairline border. On surface-soft pages, cards keep the canvas fill and the same border.
- Selected and active items: surface-strong fill, no shadow.
- Modal: canvas panel, 1px border-strong border, `--radius-md`, scrim `rgba(24, 29, 38, 0.48)` (alpha of `--color-ink`).
- Dropdown and popover: canvas, 1px border-strong, `--radius-md`, no shadow.
- `box-shadow` is forbidden except a single focus ring expressed as `outline`, never as shadow.
- Layering (project extension): base 0, sticky header 10, dropdown 20, drawer 30, modal 40, toast 50.

## 7. Motion

The snapshot defines no motion tokens. This is a project extension.

| Motion | Duration | Easing |
|---|---|---|
| Hover and focus color change | 120ms | `ease-out` |
| Expand/collapse, drawer | 180ms | `ease-out` |
| Modal and overlay | 240ms | `ease-out` |

- Motion MUST NOT convey state on its own.
- Streaming trace steps appear as they arrive; no typing animation, no spinners longer than 400ms without a text label.
- `prefers-reduced-motion: reduce` removes all non-essential transitions and the chart entrance animation.
- Charts animate once on first render, at most 240ms, transform/opacity only.

## 8. Components

### 8.1 Buttons

| Variant | Fill | Text | Radius | Padding | Use |
|---|---|---|---|---|---|
| Primary | `--color-primary` | `--color-on-primary` | `--radius-lg` | 16px 24px | Ask, Run eval, Save, Use this |
| Primary active | `--color-primary-active` | `--color-on-primary` | `--radius-lg` | - | Pressed state |
| Secondary | `--color-canvas` | `--color-ink`, 1px muted border | `--radius-lg` | 16px 24px | Cancel, Copy, Re-run |
| Tertiary | transparent | `--color-link` | - | 0 | Inline actions, "View SQL" |
| Destructive | `--color-signature-coral` | `--color-on-primary` | `--radius-lg` | 16px 24px | Confirm delete in a modal only |
| Icon | `--color-canvas` | `--color-ink` | `--radius-full` | 40px square | Rail collapse, close, expand |

Rules:

- Button label uses `--text-button`, weight 500.
- Minimum hit target is 40x40px; icon-only buttons MUST have an accessible name.
- Buttons never stretch full width except in narrow modals and empty states.
- The snapshot's "pill CTA" prose conflicts with its `button primary` component, which specifies `--radius-lg`. This document follows the component token; `--radius-pill` is reserved for chips and the connection pill. [CONFLICT] resolved at implementation time; confirm against the live site.
- Disabled: surface-strong fill, muted text, border-strong border, `cursor: not-allowed`, no opacity fade.

### 8.2 Inputs and forms

- Height 44px, `--radius-sm`, canvas fill, 1px `--color-muted` border, padding 12px 16px, `--text-body-md`.
- Label above the field: `--text-label-md`, ink, 500. Helper text and errors below: `--text-caption`.
- Focus: 2px `--color-link` outline with 2px offset. On dark surfaces, 2px `--color-signature-mint`.
- Error: 1px coral border, coral message, reason code in mono, icon plus text. The message states what to fix.
- Placeholder is muted and never the only label.
- Textarea for SQL and descriptions: `--radius-sm`, minimum 6 rows, mono for SQL only.
- Select: same geometry as input. Native select is acceptable in v1 if styled to match.
- Required fields are marked with text ("Required"), not an asterisk alone.
- No auto-save in the admin console. Unsaved changes trigger a confirmation on navigation.

### 8.3 Badges

| Badge | Fill | Text | Use |
|---|---|---|---|
| Verified | success | on-primary | Verified-answer hit; label "Verified" |
| Fast path | mint | ink | Deterministic fast path |
| Agent | cream | ink | LLM-executed agent path |
| LLM step | cream | ink | Trace step executed by an LLM |
| Deterministic step | mint | ink | Trace step executed by a tool |
| Verified split | pill, success border, canvas | ink | Eval case split |
| Few-shot split | pill, border strong, canvas | ink | Eval case split |
| Held-out split | pill, ink border, canvas | ink | Eval case split |
| Warning | mustard | ink | Degraded, stale, clamped, advisory |
| Danger | coral | on-primary | Rejected, failed, release blocked |
| Neutral | surface-strong | ink | Skipped, unverified |

Badges use `--text-caption`, weight 500, `--radius-pill` (or `--radius-xs` for inline codes), 4px/8px padding. Every badge includes text; no icon-only status.

### 8.4 SQL block

- Fill `--color-surface-soft`, 1px hairline border, `--radius-md`, padding 16px 24px.
- Mono stack, 14px, line-height 1.5, ink text, soft wrap at 100 characters with a "Copy" tertiary button.
- Syntax colors on the light block: keywords ink at 500, strings `--color-success`, numbers `--color-signature-coral`, comments muted. Mint, peach, and yellow are forbidden here; they fail contrast on light.
- A rejected SQL block keeps the same layout, gains a coral left border (4px), a danger badge, and the reason code directly above the code.
- Never render SQL in a tooltip or a collapsed element by default. Hidden evidence breaks NFR-05.

### 8.5 Tables

- Header: canvas fill, 1px hairline bottom border, `--text-caption`, weight 500, muted, sentence case, sticky within a scrolling panel.
- Rows: 40px dense, 1px hairline bottom border, body text 14px. Hover surface-soft. No zebra striping.
- Numbers right-aligned, tabular. Identifiers left-aligned, mono only when they are literal database or run identifiers.
- `NULL` is displayed as a muted `NULL`, never as an empty cell. Booleans read `true`/`false`, never color dots.
- Truncated cells show a title attribute with the full value; never truncate a primary key.
- Row cap: when the executor clamps to 1,000 rows, show a warning banner above the table with the code `LIMIT_CLAMPED` and the applied limit.
- Horizontal scroll stays inside the panel; the page never scrolls sideways.

### 8.6 Cards

| Card | Fill | Border | Radius | Padding | Use |
|---|---|---|---|---|---|
| Answer | canvas | hairline | md | 24px | Chat answer container |
| Evidence | surface-soft | hairline | md | 24px | SQL and result block inside the answer |
| Clarification candidate | canvas | muted | md | 24px | Two candidate interpretations |
| KPI | surface-strong or canvas | hairline | md | 32px | Eval metric with gate state |
| Signature | coral, forest, or surface-dark | none | lg | 48px | At most one per view; empty states and demo header only |
| Trace step | canvas | hairline | sm | 12px 16px | One agent step |
| Callout | cream | cream | md | 24px | Abstain, onboarding note |

Only one dark or signature card may appear per viewport. Dense tables and traces never sit on a signature fill.

### 8.7 Trace timeline

- Vertical list, ordered by step sequence, with a 1px hairline spine between steps.
- Each step: status dot (8px, full radius), node name in `--text-title-sm`, LLM or deterministic badge, latency in tabular mono, token count when applicable, expand control.
- Expanded payload: surface-soft block, mono 13px, JSON pretty-printed, max height 320px with its own scroll.
- Failed step: coral left border 4px, danger badge, reason code, error text. The trace continues below it.
- Header: total latency, total tokens, route badge, model ID, graph/prompt/schema versions, `degraded` flag if set.
- Steps appear as SSE events arrive; the header shows "streaming" as muted text, not a spinner-only state.

### 8.8 Banners

| Banner | Fill | Text | Border | Use |
|---|---|---|---|---|
| Degraded | mustard | ink | mustard | Neo4j unavailable, relational fallback active |
| Stale | mustard | ink | mustard | Verified answer invalidated by schema drift |
| Rejected | coral | on-primary | coral | Safety gate rejection; no SQL executed |
| Release blocked | coral | on-primary | coral | Eval gate failure on the dashboard |
| Info | info | on-primary | info border | Version changes, run notes |
| Abstain | cream | ink | cream | Not an error: no confident answer |

Every banner has a title, one sentence of consequence, an optional action, and the reason code in mono. Banners are inline and dismissible only when the condition is transient; degraded and stale banners persist while the condition holds.

### 8.9 Modals and clarification

- Modal: max width 640px, `--radius-md`, 32px padding, dark scrim, focus trapped, `Esc` closes, focus returns to the trigger.
- Delete confirmation: destructive button labeled with the object name, e.g. "Delete join", plus "Cancel".
- Clarification is not a modal. It is an inline answer state with exactly two candidate cards side by side (stacked below 1024px). Each card contains the interpretation, the SQL block, a one-row preview table, and a primary "Use this" button. No candidate is preselected. There is no third option and no free-text clarification box (D-18).

## 9. Surfaces

### 9.1 App shell

- Top nav (64px): product name, read-only connection pill ("test DB, read-only"), dependency health dot with a text label, and a global "History" icon on narrow screens. No user menu, no settings avatar: there is no authentication in v1 (D-05).
- Left rail (240px): query history, grouped by day, newest first. Each item shows the question in two lines, route badge, and a verified badge when applicable. The active item uses surface-strong. The rail has its own filter input.
- Main content: 1200px maximum. Chat uses an 880px answer column with the trace to the right at 1280px and wider, stacked below 1280px.

### 9.2 Chat

Answer anatomy, in order:

1. Route and timing: route badge (fast path, verified, agent), latency, model, `degraded` warning if set.
2. Answer text: `--text-title-lg` for a one-line headline when the result is a single value, body otherwise.
3. Result: a single-value result uses a 32px KPI number with its unit; a tabular result uses the result table with the row count and clamp notice.
4. SQL: always visible, using the SQL block component.
5. Tables used: inline chips (`--radius-pill`, surface-soft, mono for literal names) with the schema version.
6. Assumptions and confidence: caption text; confidence is a word ("high", "medium", "low") plus a short reason, never a bare percentage.
7. Actions: "Save as verified" (secondary), thumbs up/down (icon buttons with labels), "Copy SQL" (tertiary).
8. Trace: collapsed by default in the answer container, expanded in the right panel. It MUST be reachable in one click.

States:

- **Clarification:** inline two-candidate layout (section 8.9). The question stays visible above the candidates.
- **Abstain:** cream callout, title "No confident answer", the reason, the closest valid SQL, and "Nothing was executed." No fabricated number anywhere.
- **Rejected:** coral banner with the reason code (for example `WRITE_STATEMENT`), the offending SQL block, and "No SQL was executed."
- **Degraded:** mustard banner above the answer; the answer remains usable.
- **Chart pending:** the answer renders immediately and a placeholder line reads "Preparing chart"; if chart planning fails, replace it with a muted "Chart unavailable" line. The answer never waits.
- **Streaming:** show the current stage (`route`, `knowledge`, `sql`, `validation`, `execution`) as muted status text with an ordered list. Do not stream raw model tokens.

Composer:

- Single-line question input at 44px that grows to 6 rows, `--radius-sm`, canvas fill, muted border, focus ring link.
- Primary button "Ask" at the right, disabled when empty.
- Above the composer: the connection pill and "read-only" note. No model selector in the primary flow.
- Single-turn v1: the composer clears after send and the answer is appended to history.

### 9.3 Schema graph explorer

- Layout: 240px filter rail (table search, verified toggle, hot-tables toggle) plus a graph canvas on surface-soft.
- Node: canvas fill, 1px border-strong, `--radius-md`, 16px padding, `--text-body-md` ink label; column count in caption.
- Verified/maintained node: 2px ink border plus a mint accent bar on the left edge.
- Unverified node: dashed 1px border-strong, muted label, neutral badge "Unverified".
- Selected: 2px ink border plus focus ring. Hover: surface-strong fill. Never rely on hover alone to reveal a join condition.
- Edge: 1px muted line, cardinality label in caption near the midpoint, join condition revealed on select and in the detail panel. No gradients, no animated flows.
- Detail panel: 320px, canvas, hairline left border; shows the selected table or join with description, columns, owner, schema version, and a link to edit in the admin console.
- Legend is always visible: verified, unverified, selected, edge.
- Accessibility and fallback: a "Table view" toggle renders the same nodes and edges as two accessible tables. When Neo4j is unavailable, the graph area is replaced by the degraded banner plus the table view; the surface never renders an empty canvas.

### 9.4 Semantic admin console

- Two panes: a 240px list rail of asset types (tables, columns, enums, terms, joins) and a detail editor.
- Editor header: asset name, schema version, `verified` toggle with a one-line explanation, owner, and `updated_at` in caption.
- Fields: description (English), enum values, term and synonyms (synonyms MAY contain non-English data per AGENTS.md), join condition (mono textarea), cardinality select (`1:1`, `1:N`, `N:1`, `N:M`).
- Every save writes `owner`, `updated_at`, and the schema snapshot version (FR-05); the footer displays them after save.
- Validation is inline and blocking: an empty join condition, an unknown column, or a duplicate term shows a coral field error and a reason code.
- No auto-save, no optimistic silent writes, no bulk import from an agent. A human saves each asset.
- A read-only audit strip lists the last five changes for the selected asset.
- English-only authored content is enforced in the UI with a hint; non-English strings are permitted only in the synonyms data field and in schema snapshot values.

### 9.5 Evaluation dashboard

- Header: run selector, model ID, temperature, prompt/graph/schema versions, run timestamp, and duration.
- KPI band: six cards in one row (wrapping at 1024px): Overall, Verified split, Generation split, Held-out, Safety false negatives, P95 latency. Metric at 32px tabular; gate target in caption; status badge (positive/negative/warning).
- Secondary strip beneath the KPI band: clarify passes, abstain passes, total tokens, cost per question, and the run's failure count. These are reported, not gated.
- Gate rules visible on the card: overall >= 90%, held-out >= 80%, safety false negatives = 0, agent P95 < 10s. A breached gate switches the card to danger and shows a coral "Release blocked" banner with the failing items.
- Failure taxonomy: a table of code, count, and definition, using the codes from the evaluation protocol. Zero rows is a positive empty state, not a blank panel.
- Trend: a line chart of overall and held-out accuracy across runs, with a muted reference line at each gate and the last accepted run marked.
- Ablation: a compact two-column table comparing full DDL with graph-pruned context (accuracy, tokens, latency), with the interpretation sentence from the protocol.
- Case table: case ID, split badge, question, outcome, route, failure code, latency, tokens. Row click opens the case trace in a side panel. A held-out failure is never hidden behind pagination defaults.
- Export: "Copy report" produces the text template from the evaluation protocol. No PDF generation in v1.

## 10. Charts

- Renderer is Vega-Lite only (D-11). No chart libraries that execute arbitrary code.
- Categorical palette, in order, capped at five series: `--color-link`, `--color-signature-coral`, `--color-link-active`, `--color-signature-mustard`, `--color-muted`. Series beyond five require small multiples, not more colors.
- Grid lines: hairline. Axis labels: muted, caption size. Axis line: border-strong. No chart borders or background fills other than canvas.
- Chart types: bar for comparison, line for trend over time, horizontal bar for ranked categories, single bar for one aggregate. No pie or donut above five categories, no 3D, no dual axes.
- Direct-label series where space allows; the legend is always present and keyboard reachable.
- Every chart has a title, a subtitle stating the data range and row count, and a data-table fallback toggled by "View data".
- Charts never appear for single-row results, and a chart failure never removes the answer.
- Color is never the only encoding: pair it with labels or direct values. Check the palette with a deuteranopia simulation before release.

## 11. Accessibility

- The app shell, forms, tables, and trace MUST meet WCAG 2.1 AA.
- Text contrast >= 4.5:1 for all text under 24px; >= 3:1 for icons and non-text boundaries. Use the measured table in section 3.5; measured pairs are the approved set.
- Focus is always visible: 2px link outline on light, 2px mint outline on dark, 2px offset, never removed.
- Full keyboard path: skip link to content, logical tab order, `Esc` closes overlays, arrow keys navigate tabs and the graph list, focus returns to the trigger.
- Tables use `th` with scope, a caption, and row headers for the first column.
- Status is conveyed by text plus color. Reason codes are always text.
- Live regions: announce route, completion, rejection, and abstain once; do not announce every streaming step.
- The graph has a table equivalent; every chart has a data table.
- Reduced motion is honored; no flashing content; no autoplay.
- Zoom to 200% must not clip content or hide actions.

## 12. Content and UI copy

- UI copy language is the open item O-07 (`[TBD-UX]`; DEFAULT Chinese at M4). All strings live in one localization resource file (AGENTS.md section 1). Code, keys, and comments stay English.
- Terminology is fixed: question, answer, SQL, tables used, trace, verified answer, few-shot example, held-out case, clarify, abstain, degraded, safety gate, reason code. Do not use synonyms in the UI.
- Error format: what failed, the reason code in mono, what was not executed, and the next action. Example: "Rejected by the safety gate (`WRITE_STATEMENT`). No SQL was executed. Ask a read-only question."
- Never show a number without its source: run ID, case ID, schema version, and "as of" timestamp.
- Percentages are integers; latency is one decimal with `s`; tokens are shown in `k` with one decimal; currency uses the run's recorded cost.
- Timestamps are ISO 8601 with the local timezone offset in the trace and run headers.
- Empty states explain the next action in one sentence and use a single primary button.

## 13. Prohibited patterns

- Raw hex values, arbitrary neutrals (`#f5f5f5`, `#eee`), and colors outside the token set.
- Gradients, glassmorphism, heavy shadows, and layered blur.
- Dark mode in v1.
- Marketing components from the snapshot: pricing tier cards, logo strip, article cards, footer as a landing-page element, hero band with `display-lg`. They do not belong in a tool UI.
- `--color-pricing-ink` and `--text-pricing-*` anywhere.
- Pie or donut charts above five categories; dual axes; 3D; animated flows on graph edges.
- Color-only status, icon-only status, emoji as status.
- ALL-CAPS labels, bold body text, centered body copy.
- Hidden SQL, hidden tables used, or a trace that requires more than one click.
- Silent truncation of identifiers, rows, or failures.
- Spinners without a text label, skeleton screens longer than one second.
- Auto-saving semantic edits or promoting a run to verified without an explicit human action.

## 14. Adaptations and gaps

The snapshot does not cover the following. Each rule is a project extension; none introduces a new color.

| Gap | Rule | Status |
|---|---|---|
| No warning/danger semantic tokens | Status mapping in section 3.4 (mustard/coral) | Rule for M1; owner confirmation |
| No monospace family | System mono stack in section 4.1 | Rule |
| No shadow/elevation tokens | Borders and surface steps only (section 6) | Rule |
| No motion or z-index tokens | Fixed values in sections 6 and 7 | Rule |
| Focus state not specified | Link ring on light, mint ring on dark (section 11) | Rule, accessibility requirement |
| No icon set | Icons 20px, 1.5px stroke, `currentColor`; library choice is open item | O-10 |
| No dark theme | Light-only v1 | Rule |
| Haas is not licensed | Inter or system-ui only, bundled locally | Rule |
| Marketing components | Explicitly unused | Rule |

## 15. Open items

| ID | Question | Needed by | Default if unresolved |
|---|---|---|---|
| O-07 | UI copy language (existing) | M4 | Chinese, single localization file |
| O-10 | Icon library | M1 | shadcn/ui default icon set; adding it needs a decision entry |
| U-01 | Confirm the primary button radius against the live site (pill vs 12px) | M1 | `--radius-lg` per the component token |
| U-02 | Whether the trace panel is a right rail or a bottom sheet at 1024-1280px | M1 | Right rail at >= 1280px, bottom sheet below |
| U-03 | Signature card usage in the demo (which single view carries it) | M4 | Empty state of chat |

`U-*` items are design-local and become decision-log entries if they outlive M1.

## 16. UI acceptance checklist

A UI change is done only when all apply:

- [ ] Every color, radius, spacing, and type value comes from a token in this document; no raw values in components.
- [ ] Measured contrast passes for every text/background pair in use.
- [ ] Focus is visible and the full flow works by keyboard.
- [ ] Loading, empty, error, rejected, abstain, degraded, and stale states are all designed and reachable.
- [ ] SQL, tables used, and the trace are visible or one click away.
- [ ] Status always has text, not color alone.
- [ ] Tables keep headers, alignment, `NULL` treatment, and clamp notices.
- [ ] Charts follow section 10 and offer a data table.
- [ ] UI strings come from the localization file; authored repository text stays English.
- [ ] No prohibited pattern from section 13 appears in the diff.
- [ ] Verified at 1280x800 and 1024x768 with no horizontal page scroll, and at 200% zoom.
