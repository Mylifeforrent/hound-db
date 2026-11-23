# App Shell Grid System

**Status:** Draft for review. Shared grid, spacing, and reflow rules for the six UI surfaces.
**Implements:** [design.md](../design.md) sections 5.1-5.3, 6, 11.
**Scope:** Measurement, containment, and reflow only. Section order, states, and per-surface accessibility live in the surface files listed in section 8.

Normative keywords: MUST, MUST NOT, DEFAULT. Every value is either a token from [design.md](../design.md) or a derived dimension registered in section 2.3. A derived dimension MUST NOT be added to `tokens.css`, and a new token MUST NOT be introduced by a layout file.

## 1. Breakpoint bands

[design.md](../design.md) fixes three breakpoints: 768, 1024, and 1280. The band names below label those ranges; they add no new breakpoint.

| Band | Viewport | History rail | Page gutter | Shell summary |
|---|---|---|---|---|
| Mobile | below 768 | Overlay drawer, 240 (shell constant) | 16 (`--spacing-md`) | One fluid content column; tables scroll inside their panel |
| Tablet | 768-1023 | Overlay drawer, 240 | 16 (`--spacing-md`) | One fluid content column plus one surface rail where the surface spec allows |
| Laptop | 1024-1279 | In flow, 240 | 32 (`--spacing-xl`) | Three-column shell; no docked 320 detail column |
| Desktop | 1280 and wider | In flow, 240 | 32 (`--spacing-xl`) | Three-column shell; a surface MAY dock one 320 detail column |

Two documented events narrow the content box and MUST NOT be softened by an undocumented auto-collapse:

1. At 1024 the history rail enters the flow (design.md section 5.3).
2. At 1280 the chat trace column docks and the graph detail column MAY dock (design.md sections 9.1 and 9.3, default in section 15 of that document).

Both events reduce the content box; the surface files record the resulting widths. A surface MUST NOT invent a rail-collapse state at or above 1024 to avoid the reduction.

Sub-thresholds inside the mobile band - for example 480 for a KPI stack or 360 for a shortened connection pill - are content-fit thresholds, not shell breakpoints. They never change the rails, gutters, type steps, or overlay behavior, and they exist only because a fluid column has a minimum useful content width. The three breakpoints above remain the only shell breakpoints.

## 2. Dimensions

### 2.1 Shell constants

Reproduced from [design.md](../design.md) section 5.3. They are the only shell constants a layout may use.

| Dimension | Value | Token or source |
|---|---|---|
| Top nav height | 64px | design.md section 5.3 |
| History rail width | 240px | design.md section 5.3 |
| Surface list rail width | 240px | design.md section 5.3 (admin list rail) |
| Content max width | 1200px, centered | design.md section 5.3 |
| Answer column max width | 880px | design.md section 5.3 |
| Page gutter | 32px at 1024 and wider; 16px below | `--spacing-xl`, `--spacing-md` |
| Default element gap | 16px | `--spacing-md` |
| Panel gap | 24px | `--spacing-lg` |
| Card padding | 24px; 32px KPI; 48px signature | `--spacing-lg`, `--spacing-xl`, `--spacing-xxl` |
| Table row height | 40px dense, 48px comfortable default | design.md section 5.3 |
| Input height | 44px | design.md section 5.3 |
| Icon button size | 40px square | design.md section 5.3 |
| Radius: card, banner, modal | 10px | `--radius-md` |
| Radius: button, signature card | 12px | `--radius-lg` |
| Radius: input | 6px | `--radius-sm` |

### 2.2 Content box

The content max width of 1200 includes the page gutters, as written in design.md section 5.3 ("Content max width 1200px, centered, page gutter `--spacing-xl`"). The widest content box is therefore 1136.

Content box = min(1200, viewport - docked rails) - 2 x page gutter

| Viewport | History rail in flow | Region | Container | Page gutter | Content box |
|---|---|---|---|---|---|
| 768 | 0 (drawer) | 768 | 768 | 16 | 736 |
| 1024 | 240 | 784 | 784 | 32 | 720 |
| 1280 | 240 | 1040 | 1040 | 32 | 976 |
| 1440 | 240 | 1200 | 1200 | 32 | 1136 |

The container is centered in the region. The content box is left-aligned inside the container, after the page gutter. A surface that docks an additional 320 column subtracts that column and one 24 panel gap from the content box before placing its primary column.

### 2.3 Derived dimensions register

These values are arithmetic on section 2.1 and 2.2 plus the spacing scale. They are layout measurements, not tokens.

| Value | Where used | Derivation |
|---|---|---|
| 320px detail column | Chat trace, graph detail, evaluation case panel | Reuses the documented 320px detail-panel width, design.md section 9.3 |
| 632px answer column at 1280 | Chat | 976 - 320 - 24 |
| 792px answer column at 1440 | Chat | 1136 - 320 - 24 |
| 976px content box at 1280 | All surfaces | 1280 - 240 - 64 |
| 720px content box at 1024 | All surfaces | 1024 - 240 - 64 |
| 736px content box at 768 | All surfaces | 768 - 32 |
| 456px graph canvas at 1024 | Graph explorer | 720 - 240 - 24 |
| 368px graph canvas at 1280 | Graph explorer | 976 - 240 - 24 - 320 - 24 |
| 712px admin editor at 1280 | Admin console | 976 - 240 - 24 |
| 50vh result-table viewport | Chat | Viewport rule; keeps a 1,000-row clamp scrollable inside its panel |
| 70vh bottom-sheet height | Chat | Viewport rule |
| 40px collapsed-rail toggle | All rails | Icon button size, design.md section 5.3 |

`vh` values are viewport rules, not design tokens. They MUST NOT be used for type, spacing, or radius.

### 2.4 Twelve-column content grid

Inside a content box, placement uses a 12-column grid with a 16px gutter (`--spacing-md`). The grid has no column margins; the page gutter is the margin.

Column width = (content box - 11 x 16) / 12

| Span | 736 box | 720 box | 976 box | 1136 box |
|---|---|---|---|---|
| 1 column | 46.7 | 45.3 | 66.7 | 80 |
| 2 columns | 109.3 | 106.7 | 149.3 | 176 |
| 3 columns | 172 | 168 | 232 | 272 |
| 4 columns | 234.7 | 229.3 | 314.7 | 368 |
| 6 columns | 360 | 352 | 480 | 560 |
| 8 columns | 485.3 | 474.7 | 645.3 | 752 |
| 12 columns | 736 | 720 | 976 | 1136 |

The grid is a placement tool, not a token set. Two layout shapes are not expressed through it:

- A fixed rail plus fluid remainder: the rail is 240 and the panel gap is 24; the remainder is whatever the content box leaves.
- A fluid primary column plus a fixed 320 dock: the primary column is `min(880, content box - 344)`.

Dashboards and tables use the 12-column grid for track placement. Chat, the admin editor, and the graph canvas use the fixed-rail shapes.

## 3. Vertical rhythm

| Rhythm | Value | Token |
|---|---|---|
| Page top padding, 1024 and wider | 32 | `--spacing-xl` |
| Page top padding, below 1024 | 16 | `--spacing-md` |
| Page section gap | 48 | `--spacing-xxl` |
| Panel gap | 24 | `--spacing-lg` |
| Gap between cards in a band | 16 | `--spacing-md` |
| Gap between blocks inside a card | 16 | `--spacing-md` |
| Gap between field rows | 24 | `--spacing-lg` |
| Label to field | 8 | `--spacing-xs` |
| Caption to its value | 4 | `--spacing-xxs` |
| Card padding | 24; 32 KPI; 48 signature | `--spacing-lg`, `--spacing-xl`, `--spacing-xxl` |

Type does not scale with the viewport. A narrower viewport reflows panels; it never changes a type step.

## 4. Scroll containment

- The page MUST NOT scroll horizontally at 1280x800 or 1024x768, and MUST NOT at 200 percent zoom.
- Each surface has exactly one page-level vertical scroll container: the main region. Rails, docks, and sheets scroll independently inside their own columns.
- A nested scroll container MUST be focusable (`tabindex=0`) and MUST carry an accessible name, so keyboard users can scroll it without being trapped.
- Tables scroll horizontally inside their own panel. A table MUST NOT widen the page.
- Table headers stick inside a scrolling table panel.
- Long identifiers wrap with `overflow-wrap: anywhere`. Truncation happens only with a title attribute and never on a primary key.

## 5. Rails, docks, and sheets

| Pattern | Width | Behavior |
|---|---|---|
| History rail at 1024 and wider | 240 | Fixed column, canvas fill, 1px hairline right border, own vertical scroll |
| History rail below 1024 | 240 | Overlay drawer below the top nav, layer 30, scrim `rgba(24, 29, 38, 0.48)`, focus trap, Esc closes, focus returns to the 40px History toggle in the top nav |
| Surface list rail at 768 and wider | 240 | Fixed column inside the content box; 24 panel gap to the working panel |
| Surface list rail below 768 | 240 drawer | Same overlay-drawer behavior as the history rail; 40px toggle in the surface header |
| Detail column at 1280 and wider | 320 | Docked column inside the content box; 24 panel gap; hairline left border; own vertical scroll |
| Detail column below 1280 | 320 | Right overlay drawer, layer 30, no scrim, non-modal; Esc closes; focus returns to the trigger; full width below 768 |
| Chat trace below 1280 | Content width | Bottom sheet, layer 30, no scrim, max height 70vh, Esc closes, focus returns to the Trace disclosure |

A surface MUST NOT combine a scrim with a non-modal drawer. Scrim means modal: layer 40 except where design.md puts the drawer at 30 with a scrim (the history rail, section 5.3).

## 6. Layers and overlays

| Layer | Value | Use |
|---|---|---|
| Base | 0 | Page |
| Sticky header | 10 | Top nav, sticky table headers inside panels, sticky editor save bar |
| Dropdown and popover | 20 | Menus, tooltips that contain no data |
| Drawer | 30 | History rail, graph detail, evaluation case panel, chat trace sheet |
| Modal | 40 | Unsaved-changes confirmation, delete confirmation |
| Toast | 50 | Transient acknowledgements only |

No shadow tokens exist. Elevation is a border and a surface step; the only ring is the 2px focus outline (design.md sections 6 and 11).

## 7. Reflow contract

1. Below 768: one fluid column; every rail is a drawer; every table scrolls horizontally inside its panel; detail becomes full width.
2. 768-1023: history rail is a drawer; surface rails stay at 240 where the surface spec says so; tables still scroll horizontally; the 320 detail is an overlay.
3. 1024-1279: history rail enters the flow; content box drops from 1136-capable to 720 at 1024; the 320 detail stays an overlay everywhere on this band.
4. 1280 and wider: a surface MAY dock one 320 detail column; the primary column yields first.

The chat answer column records the two cliffs this contract produces (design.md sections 5.3 and 9.1 both apply). A layout MUST NOT hide a rail to smooth a cliff without a design.md amendment.

## 8. Surface index

| Surface | File | Docked detail | Page-level scroll container |
|---|---|---|---|
| Chat | [chat.md](chat.md) | Trace 320 at 1280 and wider | Conversation list |
| Schema graph explorer | [schema-graph-explorer.md](schema-graph-explorer.md) | Detail 320 at 1280 and wider | Graph panel or table view |
| Semantic admin console | [semantic-admin-console.md](semantic-admin-console.md) | None | Editor column |
| Evaluation dashboard | [evaluation-dashboard.md](evaluation-dashboard.md) | Case panel 320 as an overlay at every width | Dashboard column |
| Query history rail | [query-history-rail.md](query-history-rail.md) | None | Item list |
| Top nav | [top-nav.md](top-nav.md) | None | None; the bar never scrolls |
