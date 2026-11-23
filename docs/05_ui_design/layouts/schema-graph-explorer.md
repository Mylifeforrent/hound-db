# Schema Graph Explorer Layout

**Status:** Draft for review. Layout specification for the schema graph explorer.
**Implements:** [design.md](../design.md) sections 5.3, 8.3, 8.5, 8.8, 9.3, 11; [architecture](../../01_architecture/architecture.md) sections 9.2, 14.2, 15.
**Scope:** Layout only. No code, no new tokens. Shared measurements are in [grid-system.md](grid-system.md).

Normative keywords: MUST, MUST NOT, DEFAULT. Token names refer to `web/src/styles/tokens.css` as specified by design.md.

## 1. Structure

Desktop, 1280 and wider. The detail panel is docked; the canvas yields width.

```
+------------------------------------------------------------------------------+
| TOP NAV  64                                                                   |
+--------------+--------------+--------------------------------+----------------+
| HISTORY RAIL | FILTER RAIL  | GRAPH PANEL  surface-soft      | DETAIL  320    |
| 240          | 240          |                                |                |
|              | search 44    |  nodes and edges               | name + badges  |
|              |              |                                | description    |
|              | verified [ ] |                                | columns table  |
|              | hot [ ]      |                                | owner, schema  |
|              | ------------ |                                | edit link      |
|              | graph list   |                                | (scroll)       |
|              | 48px rows    | +----------------------------+ |                |
|              | (scroll)     | | legend: verified unverified| |                |
|              |              | | selected edge              | |                |
|              |              | +----------------------------+ |                |
+--------------+--------------+--------------------------------+----------------+
```

Laptop, 1024-1279. The same three columns, but the detail is an overlay drawer and the canvas keeps the width.

```
+--------------+--------------+-------------------------------------------------+
| HISTORY RAIL | FILTER RAIL  | GRAPH PANEL  456 wide at 1024                   |
| 240          | 240          |  [ Table view ]                                 |
|              |              |  nodes, edges                                   |
|              |              |  legend strip                                   |
+--------------+--------------+-------------------------------------------------+
                                 detail drawer 320 overlays from the right
```

Tablet, 768-1023. The history rail is a drawer; the filter rail stays.

```
+--------------+----------------------------------------------+-----------------+
| FILTER RAIL  | GRAPH PANEL  472 wide at 768                 | detail drawer   |
| 240          |  [ Table view ]                              | 320 overlay     |
|              |  legend strip                                |                 |
+--------------+----------------------------------------------+-----------------+
```

Mobile, below 768. The filter rail becomes a 40px toggle plus a drawer; the table view is the default rendering.

```
+------------------------------------------------------------------------------+
| TOP NAV 64  brand | pill | status | [ History ]                             |
+------------------------------------------------------------------------------+
| SURFACE HEADER  below 768 only: [ Filters ]                                  |
| +--------------------------------------------------------------------------+ |
| | GRAPH PANEL  [ Table view ]                                               | |
| | TABLE VIEW (default)  or graph canvas                                     | |
| | tables table / joins table, horizontal scroll inside the panel            | |
| +--------------------------------------------------------------------------+ |
| | legend strip                                                             | |
| +--------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------+
```

## 2. Grid system

The surface fills the viewport below the top nav and does not scroll the page vertically. Main region height = viewport - 64; content top and bottom padding = 32 at 1024 and wider, 16 below; panels fill the remainder.

| Viewport | History rail | Page gutter | Filter rail | Content box | Detail | Graph canvas | Gap |
|---|---|---|---|---|---|---|---|
| 768 | Drawer | 16 (`--spacing-md`) | 240 | 736 | Overlay 320 | 472 | 24 (`--spacing-lg`) |
| 1024 | 240 | 32 (`--spacing-xl`) | 240 | 720 | Overlay 320 | 456 | 24 |
| 1280 | 240 | 32 | 240 | 976 | Docked 320 | 368 | 24 |
| 1440 | 240 | 32 | 240 | 1136 | Docked 320 | 528 | 24 |

Graph canvas = content box - 240 - 24 - 320 - 24 when the detail is docked, and content box - 240 - 24 when it is an overlay.

- The detail docks only at 1280 and wider, where the canvas remains at least 368 wide (design.md section 9.3 gives the detail 320; the dock follows the chat trace rule in section 9.1 of that document).
- Between 1024 and 1279 the detail is a right overlay drawer; the canvas keeps 456-711.
- Below 1024 the history rail is a drawer, so the canvas gains width at the cost of the filter rail staying fixed.
- 368 is the narrowest graph canvas; below that the table view is the working surface. This is the reason the detail never docks at 1024.
- The legend strip is inside the graph panel, below the canvas or table, 48 high (`--spacing-xxl`), 16px horizontal padding (`--spacing-md`), 1px hairline top border. It is always visible per design.md section 9.3.

Internal placement:

- The filter rail is a flex column: search input (44), two toggle rows (40 each), a 1px hairline divider, then the graph list, which is the only scrolling part of the rail.
- The graph panel is a flex column: a 48px header row (surface title in caption plus the "Table view" toggle at the right), the canvas or table, then the legend strip.
- The detail panel is a flex column with a sticky header and a scrolling body.
- The surface header exists only below 768 and holds one control: the 40px Filters toggle. The Table view toggle always lives in the graph panel header, so it has exactly one location at every width.

## 3. Section order and component placement

| Order | Region | Contents | Width | Notes |
|---|---|---|---|---|
| 1 | Filter rail | Search input "Find a table"; "Verified only" switch; "Hot tables only" switch; graph list | 240 | List is the keyboard path to every node |
| 2 | Graph panel header | Caption "Schema graph" and the "Table view" toggle | Panel width | Toggle is a secondary button with `aria-pressed` |
| 3 | Graph canvas | Nodes and edges on surface-soft | Panel width, fluid | Non-focusable; `role="img"` summary |
| 3a | Table view | Tables table, then joins table | Panel width | Replaces the canvas in place |
| 4 | Legend | Verified, unverified, selected, edge | Panel width | Always visible, both views |
| 5 | Detail panel | Selected table or join | 320 | Docked or overlay |
| 6 | Banners | Degraded, stale, unavailable | Above the panel header | Mustard or coral per design.md section 8.8 |

Filter rail order:

1. Search input, 44 high, `--radius-sm`, muted border, visible label "Find a table" above it in `--text-label-md`.
2. "Verified only" toggle, 40 row, label plus caption "Manually maintained knowledge (20 tables)". The count is a documented product constant ([D-14](../../04_decisions/decision-log.md#d-14--import-all-tables-maintain-20)) and is not live data.
3. "Hot tables only" toggle, 40 row, label plus caption "The manually maintained set".
4. Hairline divider.
5. Graph list: one row per table, 48 comfortable. Table name in mono `--text-body-md`, column count in caption, Verified (Positive) or Unverified (Neutral) badge. Row hover surface-soft, selected surface-strong, `aria-current="true"`.

Graph panel:

- Node: canvas fill, 1px border-strong, `--radius-md`, 16px padding, `--text-body-md` ink label, column count in caption. Content-sized with a 240 max width (the rail constant); the label wraps and never truncates.
- Verified or manually maintained node: 2px ink border plus a 4px mint accent bar on the left edge.
- Unverified node: 1px dashed border-strong, muted label, Neutral "Unverified" badge.
- Selected node: 2px ink border plus the 2px link focus ring at 2px offset.
- Hover: surface-strong fill. Hover never reveals information that selection does not: the join condition appears only in the detail panel.
- Edge: 1px muted line, cardinality label in caption near the midpoint. No gradients, no animated flows.
- The canvas is not a scrolling region. It pans and zooms as one viewport; pointer and wheel only. Keyboard users work through the graph list and the table view.

Table view:

- Two tables stacked with a 24 gap: "Tables" (name, verified, column count, description excerpt) and "Joins" (from, to, cardinality, join condition).
- Each table has 40px dense rows, a sticky header inside its scroll region, a caption that names the schema version, and `th scope` semantics. Row headers are the table name and the join pair.
- The joins table's condition cell uses mono `--text-body-md` and wraps at 100 characters; it is never collapsed into a tooltip.
- Selecting a row in either table selects the same object as the graph list; the detail panel updates.

Detail panel, order: object name (`--text-title-sm`) with Verified or Unverified badge; for a join, both endpoints and the cardinality; description in `--text-body-md`; for a table, the columns table; for a join, the join condition in a mono block; owner and schema version in caption; "Edit in admin console" as a tertiary action (link); `updated_at` in caption.

The columns table in the detail: three columns (name, type, key), 40px rows, caption "Columns (n)", row header on the name. Names are mono and wrap; types are caption. The table scrolls vertically inside the detail body; it never widens the panel.

## 4. Scroll containers and width limits

| Region | Scroll axis | Width | Notes |
|---|---|---|---|
| Graph list | Vertical | 240 | The filter rail does not scroll as a whole |
| Detail body | Vertical | 320 | Sticky header inside the panel |
| Table view | Vertical and horizontal | Panel width | Each table scrolls inside its own region |
| Graph canvas | None | Panel width | Pans and zooms; no scrollbars |
| Legend | None | Panel width | Fixed strip |
| Page | None | Viewport | The surface is viewport-height; no vertical page scroll |

The detail panel is fixed at 320 and never shrinks. The graph list is fixed at 240. The canvas has no min-width below 368; when the computed canvas would fall below 368, the detail MUST be an overlay instead of a dock. Below 768 the graph list moves into a 240 drawer and the canvas keeps the content box.

## 5. States

| State | Trigger | Graph panel | Filter rail | Detail |
|---|---|---|---|---|
| Empty | No schema snapshot captured | "No schema snapshot" message, no canvas | Graph list empty with the same reason | Empty state |
| Loading | Graph fetch in flight | "Loading schema graph" status line | List shows "Loading" | "Select a table" |
| No matches | Filters exclude every table | Same message inside the panel plus "Clear filters" | List shows "No tables match these filters" | Previous selection clears |
| Streaming | Not reachable | The graph is fetched once; there is no SSE channel for it | Not applicable | Not applicable |
| Rejected | Not reachable | The surface submits nothing; the nearest state is Unavailable | Not applicable | Not applicable |
| Abstain | Not reachable | The surface produces no answers | Not applicable | Not applicable |
| Degraded | Neo4j unavailable | Mustard Degraded banner; canvas replaced by the table view | List served from PostgreSQL; still usable | Still usable |
| Stale | Projection behind the current assets | Mustard stale banner; graph still renders with the projected version | List shows the current assets | Header shows the projected version |
| Unavailable | Graph fetch failed | Coral banner "Graph data unavailable" plus reason code and a secondary "Reload" | List may still load independently | Empty |
| Row-clamped | Not applicable | No row cap exists on this surface; the detail column list and the table view scroll instead of truncating | Not applicable | Column list scrolls, never truncates |

### 5.1 Empty

When no snapshot exists, the graph panel shows a centered block: a `--text-title-md` line "No schema snapshot", one sentence explaining that a snapshot must be captured before exploring, and a caption pointing at the schema import script in the README. No primary button is invented because no capture API exists in the v1 surface (architecture section 15).

When the snapshot exists but no table matches the filters, the panel shows "No tables match these filters" and a tertiary "Clear filters" action. The graph list shows the same message. The legend remains visible in both cases.

The detail panel shows "Select a table or join" with one sentence. It never renders a blank white column.

### 5.2 Loading

The graph panel shows one muted status line, "Loading schema graph", centered. No skeleton nodes and no spinner without a label. The filter rail list shows "Loading". Controls remain enabled so the user can change filters while the fetch completes; the response is applied once.

### 5.3 Degraded

When Neo4j is unavailable, a mustard banner sits above the graph panel: title "Degraded mode", one sentence stating that the graph projection is unavailable and relational metadata is in use, and the reason code in mono. The canvas is replaced by the table view regardless of the toggle; the "Table view" toggle is removed rather than disabled, so no dead control remains. The legend strip stays visible because design.md section 9.3 requires it at all times; its items describe the table view's verified and unverified markers as well as the graph marks. The detail panel continues to work from PostgreSQL.

### 5.4 Stale projection

When the graph projection lags the current semantic assets or schema snapshot, a mustard banner states "Graph projection is stale", names the projected and current versions, and shows the reason code in mono. The banner is not dismissible. The graph still renders and every detail header shows the projected schema version, so a stale object is never presented as current. The table view reads the relational projection and is therefore current; a caption in the banner says so.

### 5.5 Unavailable

If the graph request fails for a reason other than a missing projection, a coral banner shows "Graph data unavailable", one sentence of consequence, and the reason code in mono. A secondary "Reload" button retries the fetch. The canvas area shows the same message; it never renders an empty canvas (design.md section 9.3). If the filter list loaded, it stays usable and selecting a row shows whatever detail data is available.

## 6. Responsive behavior

**1280 and wider.** Docked detail at 320; canvas 368 at 1280 and 528 at 1440. No page scroll. The surface header is absent; the view toggle stays in the graph panel header.

**1024-1279.** The history rail enters the flow at 1024, so the canvas is 456 at 1024 and 711 at 1279. The detail becomes a right overlay drawer at 320, opened by selecting a node or a list row. The drawer has no scrim, does not trap focus, closes on Esc, and returns focus to the row that opened it. The page still does not scroll.

**768-1023.** The history rail is a drawer. The filter rail stays at 240; the canvas is 472-727. The detail is a right overlay drawer at 320, opened by selecting a node or a list row. The page still does not scroll.

**Below 768.** The filter rail is only a drawer, opened from the surface header's 40px Filters toggle. The table view is the default rendering because a 368px canvas cannot show a useful graph; the Graph view remains available from the toggle and pans within the panel. The detail drawer is full width. The legend strip stays visible but its items wrap to two rows at 360 or below.

## 7. Accessibility

**Landmarks and headings.** `nav` "Query history" for the history rail; `nav` "Schema filters" for the filter rail; `main` for the surface; `complementary` "Table detail" for the detail. One `h1` "Schema graph" at the start of `main`, visually hidden when the surface header is absent; the detail object name is an `h2`; the table view's two table titles are `h2` when the table view is active, so the heading order stays flat.

**Focus order.** Skip to content, top nav, history rail, filter search, verified toggle, hot toggle, graph list, view toggle, then the active view: the graph canvas is not focusable, and when the table view is active its scroll regions and rows are focusable. The detail heading and the edit link follow. The canvas is never in the tab order.

**Graph list.** The list is a single tab stop with a roving tabindex: arrow keys move between tables, Home and End jump to the ends, Enter selects the table, updates the detail, and moves focus to the detail heading. This applies the arrow-key convention from design.md section 11 to the graph list it names.

**Canvas equivalence.** The canvas is `role="img"` with an accessible name that states the node and edge counts and points to the table view, for example "Schema graph: 24 tables, 31 joins. Use Table view for an accessible table." Nodes and edges are not focusable, because a 60-node canvas would otherwise add 60 tab stops with no equivalent action. Every operation available on the canvas (inspect a table, inspect a join, read its condition) is available through the graph list, the table view, and the detail panel. The table view is always one activation away; in degraded mode it is the only view.

**Tables.** Both fallback tables have a `caption` that includes the schema version, `th scope="col"`, a row header in the first column, and their own focusable scroll regions with accessible names. The joins table's condition is text, never an image. The detail columns table uses the same semantics.

**Status and color.** Verified and unverified differ by border style and a text badge, not by color alone. The legend labels each mark in text. The detail header always states Verified or Unverified in words.

**Drawers.** The detail drawer is non-modal at every width: no scrim, background stays operable, focus moves to its heading on open, Esc closes it, and focus returns to the trigger. The filter drawer below 768 is modal like the history rail: scrim `rgba(24, 29, 38, 0.48)`, focus trap, Esc closes, focus returns to the Filters toggle.

## 8. Design notes

- The graph canvas is a pointer affordance, not the accessible path. The table view is the contract; this is why the view toggle sits in the panel header rather than in a menu.
- The filter rail stays in flow down to 768 because the graph list is the keyboard equivalent of node selection. Removing it on tablet would remove the only non-pointer selection path.
- No state renders an empty canvas: empty, loading, degraded, and unavailable all replace the canvas with a message or the table view.
- A stale projection is shown, not hidden. The detail header carries the projected version so a join condition is never read as current when it is not.
- The 368px canvas at 1280 is the direct result of four fixed rails and the content max. It is enough to orient and select; deep inspection happens in the 320 detail and the table view.

## 9. Layout acceptance checks

- [ ] At 1280 and 1440 the docked detail is 320, the canvas is 368 and 528, and the page does not scroll.
- [ ] At 1024 the canvas is 456 and the detail is an overlay drawer.
- [ ] The legend is visible in every state that renders the graph or the table view.
- [ ] The table view is reachable in one activation at every breakpoint and is the only view when degraded.
- [ ] The graph list supports arrow-key navigation, Enter selection, and focus transfer to the detail heading.
- [ ] No hover-only information exists: every join condition is in the detail panel and the joins table.
- [ ] Empty, loading, no-match, degraded, stale, and unavailable states replace or annotate the canvas without leaving it blank.
- [ ] At 200 percent zoom the surface uses the mobile layout and the table view.
