# Semantic Admin Console Layout

**Status:** Draft for review. Layout specification for the semantic admin console.
**Implements:** [design.md](../design.md) sections 5.3, 8.1-8.3, 8.5-8.6, 8.8-8.9, 9.4, 11; [requirements](../../00_requirement/requirements.md) FR-04 to FR-07; [architecture](../../01_architecture/architecture.md) section 14.1.
**Scope:** Layout only. No code, no new tokens. Shared measurements are in [grid-system.md](grid-system.md).

Normative keywords: MUST, MUST NOT, DEFAULT. Token names refer to `web/src/styles/tokens.css` as specified by design.md.

## 1. Structure

Desktop, 1280 and wider. Two panes inside the shell: the asset rail and the editor.

```
+------------------------------------------------------------------------------+
| TOP NAV  64                                                                   |
+--------------+------------------+--------------------------------------------+
| HISTORY RAIL | ASSET RAIL  240  | EDITOR  712 at 1280 / 872 at 1440          |
| 240          |                  | +----------------------------------------+ |
|              | Tables      24   | | sticky header                          | |
|              | Columns    318   | |  asset name  [Verified switch]         | |
|              | Enums        9   | |  schema v12 . owner . updated_at       | |
|              | Terms       41   | +----------------------------------------+ |
|              | Joins       31   | | body (scroll)                          | |
|              | ---------------- | |  description (textarea, max 72ch)      | |
|              | filter 44        | |  columns list (read-only, table assets) | |
|              | ---------------- | |  ... type-specific fields ...          | |
|              | asset list       | |  audit strip: last 5 changes           | |
|              | 48px rows        | +----------------------------------------+ |
|              | (scroll)         | | save bar (sticky footer)               | |
+--------------+------------------+--------------------------------------------+
```

Laptop and tablet, 768-1279. The history rail is in flow at 1024-1279 and a drawer below. The asset rail stays; the editor narrows.

```
+--------------+------------------+--------------------------------------------+
| HISTORY RAIL | ASSET RAIL  240  | EDITOR  456 at 1024 / 472 at 768           |
| 240 or       |                  | header meta wraps to two rows              |
| drawer       |                  | fields single column, max 880              |
|              |                  | save bar sticky                            |
+--------------+------------------+--------------------------------------------+
```

Mobile, below 768. Drill-down: the list is one screen, the editor is the next.

```
+------------------------------------------------------------------------------+
| TOP NAV 64  brand | pill | status | [ History ]                             |
+------------------------------------------------------------------------------+
| LIST VIEW                                                                    |
| asset type  [ native select, 44 ]                                            |
| filter      [ input, 44 ]                                                    |
| asset rows  48 each                                                          |
+------------------------------------------------------------------------------+
             select an asset ->
+------------------------------------------------------------------------------+
| EDITOR VIEW  [ < All terms ]                                                 |
| header, fields, audit strip (body scrolls)                                   |
| save bar fixed at the bottom                                                 |
+------------------------------------------------------------------------------+
```

## 2. Grid system

The surface fills the viewport below the top nav. The asset rail and the editor each scroll independently; the page does not scroll vertically. Save bar is a footer row of the editor column.

| Viewport | History rail | Page gutter | Asset rail | Content box | Editor | Gap |
|---|---|---|---|---|---|---|
| 768 | Drawer | 16 (`--spacing-md`) | 240 | 736 | 472 | 24 (`--spacing-lg`) |
| 1024 | 240 | 32 (`--spacing-xl`) | 240 | 720 | 456 | 24 |
| 1280 | 240 | 32 | 240 | 976 | 712 | 24 |
| 1440 | 240 | 32 | 240 | 1136 | 872 | 24 |

Editor width = content box - 240 - 24.

- The editor body has a max-width of 880 (the answer-column constant) and is left-aligned; at 1440 its 872 width is below the cap, so the cap never binds on this surface.
- Field rows are a single column with a 24px gap. No two-column field layout is used at any width: description, join condition, and synonym fields are prose or mono and need the full width.
- The header meta row (schema version, owner, updated_at) wraps. At 1280 and wider it sits on one row below the name; below 1280 it wraps to two rows with an 8px row gap.
- The save bar spans the editor width, 1px hairline top border, canvas fill, 16px vertical padding, and is pinned to the bottom of the editor column.
- The audit strip is the last block of the editor body, above the save bar, with a 24px gap.

Asset rail placement, top to bottom:

1. Five type rows at 40 each, in this order: Tables, Columns, Enums, Terms, Joins. Each row shows the type name in `--text-label-md` and its count in caption, right-aligned and tabular. Selected type: surface-strong fill, ink text, `aria-current="page"`.
2. Filter input, 44, label "Filter assets", `--radius-sm`.
3. Hairline divider.
4. Asset list, 48px rows, scrolling. Each row: asset name (`--text-body-md`; mono for column and table identifiers), a second line in caption naming the parent table for column assets, and a Verified (Positive) or Unverified (Neutral) badge at the right. Selected: surface-strong. A stale-schema asset keeps its Verified or Unverified badge and adds a Warning badge "Stale" on the second line, so the verified state is never hidden by the staleness warning.

At 768 and wider the type rows are visible; below 768 they collapse to a native select at the top of the list view (design.md section 8.2 allows a native select styled to match an input).

## 3. Section order and component placement

| Order | Region | Contents | Width | Spacing |
|---|---|---|---|---|
| 1 | Asset rail | Type rows, filter, asset list | 240 | 16 (`--spacing-md`) inside; 24 between rail and editor |
| 2 | Editor header | Asset name `--text-title-sm`; Verified switch with a one-line explanation; schema version, owner, updated_at in caption | Editor width | 24 to the body |
| 3 | Editor body | Type-specific fields, in the order below | Editor width, max 880 | 24 between field rows |
| 4 | Audit strip | Last five changes | Editor width | 24 above |
| 5 | Save bar | Status line, Discard (secondary), Save (primary) | Editor width | 16 vertical padding |

Field order by asset type:

- Table: description; read-only "Columns in this table" table; verified switch lives in the header.
- Column: parent table in caption; description; data type and nullability as read-only caption facts.
- Enum: the enum values editor; description; verified switch.
- Term: definition; synonyms (comma-separated data values, non-English permitted in this field only); verified switch.
- Join: from and to endpoints as read-only mono text; join condition (mono textarea, minimum 6 rows); cardinality select (`1:1`, `1:N`, `N:1`, `N:M`); note field; verified switch.

Every field uses the input geometry from design.md section 8.2: 44px height for single-line inputs and selects, `--radius-sm`, canvas fill, 1px muted border, label above in `--text-label-md`, helper text below in caption. Textareas use `--radius-sm`, the mono stack only for the join condition, and the description capped at a 72-character measure. Required fields are marked with the word "Required" after the label.

The editor header:

- Name is the only `--text-title-sm` element.
- The Verified switch is a 40px row: switch, label "Verified", and a one-line explanation "Marks manually maintained knowledge; unverified assets still appear in the schema." The explanation is `aria-describedby` for the switch.
- Schema version, owner, and updated_at are caption facts in a wrapping row, 16px gap, labels muted and values ink.
- When the asset's schema version is older than the current snapshot, a Warning badge "Stale schema" follows the version and a one-line sentence explains that the columns may have changed.

The save bar:

- Before any edit: a caption "No unsaved changes"; Save disabled, Discard absent.
- After an edit: the caption reads "Unsaved changes" in ink; Save enabled, Discard enabled.
- During a save: Save disabled, Discard disabled, caption "Saving".
- After a save: the caption reads "Saved by <owner> at <ISO timestamp> · schema v<n>", with a Positive badge "Saved". The audit strip refreshes.
- On a blocked save: the caption reads "Not saved" with the reason code; errors are rendered at the fields and in an error summary.

The audit strip: a table with four columns (timestamp, owner, field, change), 40px dense rows, caption "Last 5 changes". When more than five exist, the caption reads "Showing the last 5 of <n> changes". It is read-only, has no row actions, and is not collapsible.

## 4. Scroll containers and width limits

| Region | Scroll axis | Width | Notes |
|---|---|---|---|
| Asset list | Vertical | 240 | Type rows and filter stay fixed above it |
| Editor body | Vertical | Editor width, max 880 | Header and save bar stay fixed |
| Description textarea | Vertical after 6 rows | Editor width, max 72ch | Grows to its max, then scrolls |
| Join condition textarea | Vertical after 6 rows | Editor width | Mono, soft wrap at 100 characters |
| Columns table | Vertical | Editor width | Sticky header, 40px rows |
| Audit strip | None | Editor width | Exactly five rows |
| Page | None | Viewport | The surface is viewport-height; rails and editor scroll |

The asset rail is fixed at 240 and never shrinks. The editor has no min-width; at 456 it still renders one field per row. Long identifiers wrap with `overflow-wrap: anywhere`; an asset name in a list row may truncate only with a title attribute, and a primary key or column name MUST NOT truncate.

## 5. States

| State | Trigger | Asset rail | Editor |
|---|---|---|---|
| Empty | No asset selected | Types and list visible | "Select an asset to edit", one sentence |
| Empty type | Selected type has no assets | "No assets of this type" plus the reason | Empty |
| Loading | Assets or asset fetch in flight | "Loading assets" caption | "Loading asset" caption |
| Streaming | Not reachable | No streaming endpoint exists for semantic assets | Not applicable |
| Rejected | A save fails validation or the server rejects it | Nothing changes | Coral field errors and reason codes; error summary; "Not saved" |
| Abstain | Not reachable | The admin console does not answer questions | Not applicable |
| Degraded | Neo4j unavailable | List still loads from PostgreSQL | Editing works; banner states projection is postponed |
| Stale | Asset schema version behind the snapshot, or projection pending | Verified or Unverified badge plus a Warning badge "Stale" | Warning badge and sentence; "Projection pending" in the save bar after a save |
| Row-clamped | More than five audit entries | Not applicable | Audit strip shows 5 of n with a labeled caption |

### 5.1 Empty

With no asset selected, the editor body shows a centered block: `--text-title-md` "Select an asset to edit" and one sentence naming the five asset types. No primary button: selection happens in the rail, and inventing a create action is out of scope.

When a type has no assets, the rail's list area shows "No assets of this type" and one caption sentence explaining that assets come from the schema snapshot or a reviewed import. The editor stays in its select-an-asset state.

### 5.2 Loading

The rail shows one caption line "Loading assets". The editor shows "Loading asset" and nothing else. No skeleton rows and no spinner without a label (design.md section 7). The filter input stays enabled; the list is replaced when the response arrives.

### 5.3 Rejected: validation and server refusal

Client validation runs on blur and on Save. Errors render below the field: 1px coral border on the field, a coral message stating what to fix, and the reason code in mono. The reason codes are text and always visible, for example `JOIN_CONDITION_EMPTY`, `UNKNOWN_COLUMN`, `DUPLICATE_TERM`.

On a Save attempt with one or more invalid fields:

1. An error summary appears at the top of the editor body, as an alert region, listing each error as a link to its field.
2. Focus moves to the first invalid field.
3. The save is blocked; "Not saved" appears in the save bar with the first reason code.

A server refusal (for example an unknown column discovered after submit) renders a coral banner at the top of the editor body with one sentence and the reason code, and keeps every entered value. The editor never clears a value on failure.

### 5.4 Degraded and stale

When Neo4j is unavailable, a mustard banner sits above the editor: title "Degraded mode", one sentence stating that the graph projection is unavailable and saved edits will project when it returns, and the reason code in mono. The console remains fully usable because PostgreSQL is the system of record.

Two stale conditions exist and both use the Warning badge with text:

1. **Stale schema.** The asset records an older schema version than the current snapshot. The header shows the Warning badge "Stale schema", the version pair (asset v<n>, current v<m>), and a sentence that the columns may have changed. Save is still allowed; the new version is recorded.
2. **Projection pending.** A save succeeded but the graph rebuild has not run. The save bar shows "Saved" plus "Projection pending" in ink with a mustard dot and the word, and the same line states that retrieval still uses the previous projection. This state clears when the rebuild completes.

### 5.5 Row-clamped

The audit strip is capped at five rows by design.md section 9.4. It is never silently truncated: the caption reads "Showing the last 5 of <n> changes". There is no "load more" control because the full history is not a v1 surface. Long field values scroll inside their textareas; identifiers wrap; nothing else is clamped.

## 6. Responsive behavior

**1280 and wider.** History rail 240 in flow, asset rail 240, editor 712-872. Header meta on one row. Save bar full editor width. No page scroll.

**1024-1279.** History rail enters the flow; the editor is 456 at 1024 and 711 at 1279. Header meta wraps to two rows. Field rows stay single column. The audit strip keeps four columns; the change column wraps.

**768-1023.** History rail is a drawer. Asset rail 240; editor 472-727. Everything else as in the laptop band.

**Below 768.** Drill-down. The list view is full width: a 44px native select for the asset type, the filter input, then 48px asset rows. Selecting an asset replaces the list with the editor view, whose header starts with a tertiary back control "< Back to <type>". The editor body scrolls; the save bar is fixed at the bottom above the safe area. The history rail is the top-nav drawer. Unsaved changes block the back control and the History toggle with the confirmation modal.

## 7. Accessibility

**Landmarks and headings.** `nav` "Query history" for the history rail; `nav` "Semantic assets" for the asset rail; `main` for the editor; `form` with an accessible name for the asset form. One `h1` "Semantic admin" at the start of `main`, visually hidden when no visible surface title is rendered; the asset name is an `h2`; each field group is a `fieldset` with a `legend`.

**Focus order.** Skip to content, top nav, history rail, asset type rows, filter, asset list, editor header (Verified switch), fields in visual order, audit strip, then the save bar (Discard, Save). When Save becomes unavailable, during or after a save, it switches to its disabled style but uses `aria-disabled` rather than `disabled`, so focus is not dropped. The save bar's status line is a polite live region and announces "Saved" or "Not saved" once.

**Field semantics.** Labels are programmatically associated; helper text and errors are referenced by `aria-describedby`; invalid fields carry `aria-invalid`. The Verified switch has a visible label and an explanation. The error summary is an alert region whose links move focus to the named field. Reason codes are text, never an icon.

**Tables.** The columns list and the audit strip use `caption`, `th scope="col"`, and a row header in the first column. The columns list's name column is mono, wraps, and never truncates. Scrolling table regions are focusable with accessible names.

**Unsaved-changes modal.** Max width 640, `--radius-md`, 32px padding, dark scrim, focus trapped, Esc cancels, focus returns to the control that attempted navigation. The primary action is "Keep editing"; "Discard changes" is secondary. The destructive fill is reserved for delete confirmation and is not used here.

**No auto-save.** Every write requires the explicit Save action. Navigating away, changing the selected asset, or switching the asset type with unsaved changes opens the modal. The modal is the only place where a change can be lost.

**Zoom.** At 200 percent zoom the console uses the drill-down layout; no field, reason code, or save action is clipped.

## 8. Design notes

- The console never shows a save result as a toast alone. The save bar keeps "Saved by ... at ... · schema v<n>", because FR-05 requires owner, timestamp, and schema version to be visible after every edit.
- Errors are blocking and inline. A single banner with no field marker is insufficient; the field, the message, and the reason code all appear together.
- The asset list is a navigation rail, not a data table; it uses 48px rows and a two-line pattern so a column asset can name its parent table.
- The editor is single-column at every width. Two-column forms would push the 72-character prose measure below a readable width at 1024.
- The Verified switch is the only place where the word "Verified" changes product behavior, so its explanation is always visible rather than in a tooltip.

## 9. Layout acceptance checks

- [ ] At 1280 the editor is 712 and the asset rail 240; at 1024 the editor is 456 and no field is clipped.
- [ ] The page does not scroll vertically; only the asset list, the editor body, and textareas scroll.
- [ ] The save bar always shows owner, ISO timestamp, and schema version after a save.
- [ ] Empty, empty-type, loading, rejected, degraded, stale-schema, projection-pending, and audit-clamp states are reachable and labeled.
- [ ] Validation errors render at the field, in the summary, and in the save bar with a reason code.
- [ ] The audit strip never shows more than five rows and never hides the total count.
- [ ] Keyboard focus reaches every field, the save bar, and the audit strip; the unsaved modal traps focus and returns it.
- [ ] At 200 percent zoom the drill-down layout is used and the save action stays visible.
