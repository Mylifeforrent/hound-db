# Chat Layout

**Status:** Draft for review. Layout specification for the chat surface.
**Implements:** [design.md](../design.md) sections 5.3, 8.1-8.9, 9.1-9.2, 10, 11; [architecture](../../01_architecture/architecture.md) section 15.
**Scope:** Layout only. No code, no new tokens. Shared measurements are in [grid-system.md](grid-system.md).

Normative keywords: MUST, MUST NOT, DEFAULT. Token names refer to `web/src/styles/tokens.css` as specified by design.md. Derived widths are registered in grid-system.md section 2.3 and MUST NOT become tokens.

## 1. Structure

Desktop, 1280 and wider. The trace is docked; the answer column yields width first.

```
+------------------------------------------------------------------------------+
| TOP NAV  64  brand | read-only connection pill |          dependency status    |
+--------------+---------------------------------------------------------------+
| HISTORY RAIL | MAIN REGION   container 1040  gutter 32  content box 976       |
| 240          | +----------------------------------+  +--------------------+  |
|              | | ANSWER COLUMN  632 (max 880)     |  | TRACE RAIL  320    |  |
| filter 44    | | 1 route row                      |  | header (sticky)    |  |
|              | | 2 answer headline / body         |  | 01 route   0.3s    |  |
| day group    | | 3 result: KPI or table           |  | 02 knowledge 1.2s  |  |
|  item        | |   chart slot (optional)          |  | 03 sql writer      |  |
|  item        | | 4 SQL block                      |  | 04 validation      |  |
| (scroll)     | | 5 tables used                    |  | 05 execution       |  |
|              | | 6 assumptions + confidence       |  | 06 answer          |  |
|              | | 7 actions                        |  | (scroll)           |  |
|              | +----------------------------------+  |                    |  |
|              | +----------------------------------+  |                    |  |
|              | | connection pill + read-only note |  |                    |  |
|              | | question input 44 -> 6 rows [Ask]|  |                    |  |
|              | +----------------------------------+  +--------------------+  |
+--------------+---------------------------------------------------------------+
```

Laptop and tablet, below 1280. The trace is a bottom sheet opened from the answer's Trace row; the history rail is in flow at 1024-1279 and a drawer below 1024.

```
+--------------+---------------------------------------------------------------+
| HISTORY RAIL | MAIN REGION   content box 720 at 1024 / 736 at 768            |
| 240 or       | +-----------------------------------------------------------+ |
| drawer       | | ANSWER COLUMN  max 880 (720 / 736 when narrower)          | |
|              | | 1 route row ... 7 actions                                 | |
|              | | 8 Trace . 12 steps . 4.2 s                    [ expand ]    | |
|              | +-----------------------------------------------------------+ |
|              | | connection pill + read-only note                          | |
|              | | question input  [ Ask ]                                   | |
|              | +-----------------------------------------------------------+ |
+--------------+---------------------------------------------------------------+
```

Mobile, below 768. One fluid column; the history rail is a drawer opened from the top nav.

```
+------------------------------------------------------------------------------+
| TOP NAV 64  brand | connection pill | status | [ History ]                    |
+------------------------------------------------------------------------------+
| MAIN  gutter 16, content box 736 -> fluid                                     |
| +--------------------------------------------------------------------------+ |
| | ANSWER COLUMN  fluid, max 880                                             | |
| | route row ... actions ... Trace row                                       | |
| +--------------------------------------------------------------------------+ |
| | connection pill + read-only note                                         | |
| | question input  [ Ask ]                                                  | |
| +--------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------+
```

## 2. Grid system

| Viewport | History rail | Page gutter | Content box | Answer column | Trace | Gap |
|---|---|---|---|---|---|---|
| 768 | Drawer (0 in flow) | 16 (`--spacing-md`) | 736 | 736, capped at 880 | Bottom sheet | 24 (`--spacing-lg`) |
| 1024 | 240 in flow | 32 (`--spacing-xl`) | 720 | 720, capped at 880 | Bottom sheet | 24 |
| 1280 | 240 in flow | 32 | 976 | 632 | Docked 320 | 24 |
| 1440 | 240 in flow | 32 | 1136 | 792 | Docked 320 | 24 |

Answer column width = min(880, content box - 344) when the trace is docked, otherwise min(880, content box).

- At 1024-1183 the answer column is 720-879.
- At 1184-1279 it reaches its 880 cap.
- At 1280 it drops to 632 because the trace docks (design.md sections 5.3 and 9.1 both apply). The 248px step is a documented consequence; this layout MUST NOT auto-collapse the history rail to avoid it. If the step is rejected in review, the amendment belongs in design.md, not here.
- The answer column is left-aligned in the content box. At 1279 the 95px slack stays on the right; it is never used for a second column.

Internal placement:

- The answer card is a single column stack with a 24px section gap and 24px padding (`--spacing-lg`).
- The route row is a wrapping flex row with an 8px gap (`--spacing-xs`).
- The actions row is a wrapping flex row with an 8px column gap and an 8px row gap.
- Clarification cards are two equal columns with a 16px gap (`--spacing-md`) inside the answer column; each is 308 wide at 1280 and 388 at 1440. They stack below 1024 (design.md section 8.9).
- The SQL block uses 24px horizontal padding; code content wraps at 100 characters. No horizontal scroll.
- Tables used chips wrap with an 8px gap; chips never truncate a table name without a title attribute.
- The trace rail is a single column: a sticky header, then the step list.
- The composer block is pinned to the bottom of the answer column, not overlaid on content: the answer column is a flex column whose scroll area is the conversation and whose footer is the composer.

The route row, result, and actions MUST NOT be rearranged per breakpoint. Only the trace changes location.

## 3. Section order and component placement

| # | Section | Placement | Width | Spacing after |
|---|---|---|---|---|
| 1 | Route and timing | First block in the answer card | Full answer width | 16 |
| 2 | Answer text | Below the route row | Full width; prose stops at 72 characters | 16 |
| 3 | Result | Below the answer text | KPI number 32px `--text-display-md` tabular, left-aligned; table full width | 16 |
| 3a | Chart slot | Directly after the result | Full answer width; optional | 16 |
| 4 | SQL | Always visible, never collapsed | Full answer width | 16 |
| 5 | Tables used | Below SQL | Full width; chips wrap | 16 |
| 6 | Assumptions and confidence | Below tables used | Caption text | 24 |
| 7 | Actions | Last block before the trace row | Wrapping row | 0 |
| 8 | Trace | At 1280 and wider: docked rail. Below 1280: a Trace row inside the answer card that opens the bottom sheet | 320 or full answer width | 0 |

Route row contents, in order: route badge (Fast path, Verified, or Agent), latency in tabular mono with one decimal and `s`, model ID in caption, a Warning badge "Degraded" when the run is degraded, and, below 1280, the Trace disclosure button at the row end. The Verified badge appears only for a verified hit.

Result:

- Single-value result: `--text-display-md` 32px, tabular, with the unit in `--text-body-md`. The answer headline above it is `--text-title-lg`.
- Tabular result: the result table with a caption that states the row count and the run ID. The row-clamp banner sits above the table.
- A chart appears only for a comparable multi-row result, never for a single row (design.md section 10).

SQL block: surface-soft fill, hairline border, `--radius-md`, 16px/24px padding, mono 14px, "Copy" tertiary action at the top right of the block. The block is a top-level block of the answer, not nested inside a disclosure.

Tables used: pill chips on surface-soft, literal names in mono, followed by the caption "schema v<n>".

Assumptions and confidence: caption text. Confidence is the word "high", "medium", or "low" plus a short reason. A bare percentage MUST NOT appear.

Actions, in order: "Save as verified" (secondary), two 40px icon buttons with the accessible names "Helpful" and "Not helpful", and "Copy SQL" (tertiary). "Save as verified" is absent on verified hits, abstains, and rejections.

Composer block, top to bottom: a caption row with the connection pill and the read-only note; the question input (44px, grows to 6 rows, mono off, `--radius-sm`); the primary "Ask" button at the right of the input row. The composer block has a 1px hairline top border and canvas fill. The note repeats the top-nav pill because design.md section 9.2 requires it above the composer; both instances are static and neither is a focus stop.

The composer is cleared on send. The new question is appended to the history rail immediately as the newest item and to the conversation as the newest answer card. Single-turn v1: no threading and no conversation branch.

## 4. Scroll containers and width limits

| Region | Scroll axis | Width | Notes |
|---|---|---|---|
| Conversation | Vertical | Answer column width; 632-880 | The only page-level scroll for the surface |
| Trace rail | Vertical, independent | 320 fixed | Its header is sticky; it does not scroll with the conversation |
| Result table | Both axes inside the card | Full answer width | Max height 50vh, sticky header, focusable scroll region, 40px dense rows |
| Trace step payload | Vertical | Trace width | Max height 320 (design.md section 8.7) |
| Bottom sheet | Vertical | Answer column width | Max height 70vh |
| SQL block | None | Full answer width | Wraps at 100 characters; never scrolls sideways |

Minimum widths: the answer card has no min-width below its container, so text wraps instead of forcing page scroll. The result table never widens the page: its columns size to content, and when the natural width exceeds the card it scrolls horizontally inside the card. A numeric cell never wraps. The trace rail is fixed at 320 and does not shrink. The composer input has a min-height of 44 and a max-height of 6 body rows (129px), after which it scrolls internally.

At 200 percent zoom the surface reflows into the mobile band. Nothing clips, and every action remains reachable.

## 5. States

All states are rendered inside the answer column. The route row is present in every state that has a run; the trace rail or sheet is available in every state that produced steps, including rejected and abstain.

| State | Trigger | Answer card | Trace | Composer |
|---|---|---|---|---|
| Empty | No history, no selected run | Signature card, one per view | Rail shows "No run selected" | Empty, Ask disabled |
| Loading | Ask sent, no SSE event yet | Route row "Routing"; stage list starts | Rail header with run ID; "Waiting for the first step" | Cleared, Ask disabled |
| Streaming | SSE events arriving | Stages and blocks appear in order | Steps append as they arrive | Ask disabled |
| Clarification | Two candidate interpretations | Two candidate cards, no preselection | Steps up to the clarification | Editable; sending a new question dismisses the candidates |
| Rejected | Safety gate rejection | Coral banner, offending SQL, no result | Steps available, including the rejection step | Restored with the original question, Ask enabled |
| Abstain | Unanswerable after repair | Cream callout, closest SQL, nothing executed | Steps available | Restored, Ask enabled |
| Degraded | Neo4j unavailable, relational fallback | Mustard banner above the answer; answer usable | Degraded flag in the header | Enabled |
| Stale | Verified hit invalidated by schema drift | Mustard banner; no Verified badge; agent answer | Steps available | Enabled |
| Row-clamped | Executor hit the 1,000-row cap | Warning banner above the table, `LIMIT_CLAMPED` | Execution step shows the cap | Enabled |
| Chart pending | Answer rendered, chart planner running | "Preparing chart" caption in the chart slot | Chart step pending | Enabled |
| Chart unavailable | Chart planner failed | Muted "Chart unavailable" caption | Chart step failed with its reason code | Enabled |

### 5.1 Empty

One signature card at the top of the answer column: surface-dark fill, `--color-on-dark` text, `--radius-lg`, 48px padding, `--text-display-lg` title, one sentence in `--text-body-md`, and one primary button "Ask a question" that moves focus to the composer. It is the only dark or signature surface in the view (design.md section 8.6, default U-03).

Nothing else renders: no example questions, no KPI placeholders, no fake rows. The trace rail, when docked, shows a caption "No run selected" and nothing else. The composer is empty with Ask disabled.

### 5.2 Loading

After Ask, the answer card appears immediately with the route row reading "Routing" in muted text and the ordered stage list (`route`, `knowledge`, `sql`, `validation`, `execution`). The current stage is muted; completed stages are ink. A caption reads "Step 1 of 5". No skeleton blocks and no spinner: a status line is the loading treatment (design.md section 7).

The trace rail header shows the run ID and the muted word "streaming"; its body reads "Waiting for the first step". The composer is cleared and Ask is disabled.

If the first event does not arrive within 400ms, the status line gains the label "Still routing"; no other change, so the layout never shifts.

### 5.3 Streaming

Stages are listed in order as they complete (design.md section 9.2). The answer text, result, and SQL slots stay empty until their data arrives; no placeholder numbers are shown. The trace rail and sheet append steps as SSE events arrive. Raw model tokens are never streamed into the answer.

One live region announces the route once when it is known and "Answer ready" once at completion. Individual steps are not announced.

### 5.4 Clarification

The question stays visible above two candidate cards, side by side at 1024 and wider and stacked below 1024. Each card contains, in order: the interpretation as a `--text-title-md` heading, the candidate SQL in a SQL block, a one-row preview table with the caption "1 row preview", and a primary "Use this" button. No candidate is preselected. There is no third candidate and no free-text clarification field.

Equal card heights; the taller card sets the row height. A candidate whose preview failed shows the failure reason code in place of the preview table and its "Use this" button is disabled. If both previews fail, the state becomes Abstain.

Focus moves to the first candidate heading when the state appears. Choosing a candidate collapses the other card, keeps the chosen interpretation visible as a caption above the answer, and continues with the normal answer anatomy.

### 5.5 Rejected

The answer card starts with a full-width coral banner: title "Rejected by the safety gate", one sentence of consequence, the reason code in mono (for example `WRITE_STATEMENT`), and the text "No SQL was executed." No dismiss control: the rejection is part of the answer record.

Below the banner: the offending SQL block with a 4px coral left border and a Danger badge. The result area is replaced by one caption line stating that nothing was executed. No KPI, no table, no chart, no feedback controls. "Copy SQL" (tertiary) remains. "Save as verified" is absent.

The original question is restored in the composer for editing, not resubmitted. Focus moves to the banner heading once.

### 5.6 Abstain

A cream callout with `--radius-md` and 24px padding: title "No confident answer", the reason in one sentence, the reason code in mono. Below it, the closest valid SQL in a SQL block, with the caption "This was not executed." Nothing else renders: no number, no table, no chart, no Verified or Fast path badge.

"Save as verified" and feedback controls are absent. "Copy SQL" remains. The state is not an error and MUST NOT use coral.

### 5.7 Degraded

A mustard banner spans the answer card above the route row: title "Degraded mode", one sentence stating that graph retrieval is unavailable and relational metadata is in use, the reason code in mono. The banner is not dismissible and persists for answers produced under the condition. The answer itself is unchanged and fully usable. The trace header carries the Warning badge "Degraded".

### 5.8 Stale

Rendered only when a verified answer matched but was invalidated, and the run fell back to the agent path. A mustard banner above the route row states "Verified answer is stale", names the schema versions (verified at v<n>, current v<m>), and shows `SCHEMA_DRIFT` in mono. The Verified badge MUST NOT render; the route badge reads "Agent". The banner persists for that answer and is not dismissible.

### 5.9 Row-clamped

When the executor clamps the result to the row cap, a Warning banner sits above the result table: "Result clamped to 1,000 rows", the applied limit, and `LIMIT_CLAMPED` in mono. The table caption repeats the row count and the word "clamped". No control offers rows beyond the cap, because the cap is a safety property, not a pagination limit.

The table itself keeps its 50vh internal viewport with a sticky header, scrolls horizontally inside the card when needed, and never wraps a numeric cell.

### 5.10 Chart pending and unavailable

The chart slot sits below the result table and above the SQL block. While the chart planner runs, the slot shows one muted caption line, "Preparing chart". When the chart arrives, it is a Vega-Lite render with a title, a subtitle stating the data range and row count, and a "View data" toggle that reveals an accessible data table. If planning fails, the slot shows the muted line "Chart unavailable" and nothing else; the answer, SQL, and table remain.

The answer never waits for the chart (design.md section 9.2). The one-time vertical shift when the chart inserts is accepted and documented; the SQL block below it moves down, so no control jumps under the pointer.

## 6. Responsive behavior

**1280 and wider.** The trace rail is docked at 320; the answer column is 632 at 1280 and 792 at 1440. The composer aligns to the answer column, so the space below the trace rail is empty by design. Page gutters are 32.

**1024-1279.** The history rail is in flow at 240. The content box is 720 at 1024 and 975 at 1279; the answer column is 720-880. The trace becomes a Trace row at the end of each answer card; opening it slides a bottom sheet up to 70vh, anchored to the top of the composer block so the composer stays visible. Clarification cards stack below 1024. Page gutters are 32.

**768-1023.** The history rail collapses to the 40px History toggle in the top nav and opens as an overlay drawer. The content box is 736-991 with 16px gutters; the answer column is 736-880. Tables scroll horizontally inside the card. The composer keeps its full width; the Ask button stays on the input row until the answer column is below 480, then moves to the next row at full width.

**Below 768.** One fluid column with 16px gutters. The answer column is the content box. The actions row wraps to two rows. The signature card keeps 48px padding only while the viewport is at least 480 wide; below 480 it uses 24px padding (`--spacing-lg`) so the title does not touch the edge. Type sizes do not change. The bottom sheet is full width.

## 7. Accessibility

**Landmarks and headings.** `header` for the top nav, `nav` labeled "Query history" for the rail, `main` for the surface, `form` labeled "Ask a question" for the composer, `complementary` labeled "Run trace" for the docked trace. Each answer is an `article` with an `h2` whose accessible name is the question. Clarification candidates use `h3`. The page has one visually hidden `h1` "Chat" at the start of `main`.

**Skip links.** A global "Skip to content" link precedes the top nav and targets `main`. Inside `main`, a "Skip to question input" link precedes the conversation and targets the input. The two links are the only way to cross a long conversation in one tab stop.

**Focus order.** Skip to content, top nav (brand, History toggle below 1024), history rail (filter, items), main: skip to input, answers in chronological order (heading, actions, Trace row), composer, Ask. After a run completes, focus stays where it is; the live region announces the outcome. On Clarification and Rejected, focus moves once to the state heading because the user must act.

**Composer.** Enter submits; Shift+Enter inserts a newline. The input has a persistent visually hidden label, so the placeholder is never the only label (design.md section 8.2). Ask is disabled when the input is empty or a run is active, with a caption stating the reason when disabled by an active run.

**Live regions.** One polite status region announces the route and the stage once and the completion or abstain once with its reason code. A rejection is announced once by an alert region, not by the polite region, so the outcome is heard exactly once. Streaming steps are not announced individually. The chart arriving is announced as "Chart ready"; a chart failure is silent beyond the visible caption.

**Answer content.** The SQL block is a readable `pre`, not an image, with the Copy button outside the scroll area. The result table has a `caption` naming the run ID and row count, `th scope="col"`, a row header in the first identifier column, and `NULL` rendered as the muted word. The scroll region has a `role="region"` and an accessible name; it is keyboard focusable and scrolls with the arrow keys. Confidence is read as a word.

**Trace.** The trace is an ordered list with a heading; each step is a button that toggles a payload, with `aria-expanded` and `aria-controls`. Payload regions are not live. The bottom sheet moves focus to its heading, does not trap focus because it has no scrim, closes on Esc, and returns focus to the Trace row. The docked rail is not a dialog either: it is reachable in the tab order and does not trap focus.

**Motion and zoom.** Stage changes and the sheet honor `prefers-reduced-motion`. No typing animation, no spinner without a label, no autoplay. At 200 percent zoom the layout reflows to one column and no action is clipped.

## 8. Design notes

- The signature card is used only in the empty state; a run view carries no signature card, so at most one appears per view (U-03 default).
- The 1280 answer-column step from 880 to 632 is the price of the docked trace plus the always-visible history rail. It is recorded, not hidden. Design.md U-02 owns the trace-placement decision; this spec uses the documented default.
- The composer repeats the connection pill because design.md section 9.2 asks for it above the composer. Both instances are static text, so the duplication adds no focus stops.
- No state shows a number without its source. Every result carries the run ID, the schema version, and an as-of timestamp in the trace header or the table caption.
- An abstain never renders a Save as verified action, and a rejection never renders feedback controls; promotion requires a successful run (design.md section 13).

## 9. Layout acceptance checks

- [ ] At 1280x800 and 1024x768 there is no horizontal page scroll; the result table scrolls inside the card.
- [ ] At 1280 the answer column is 632 and the trace is 320; at 1024-1279 the trace is a sheet and the answer column is at most 880.
- [ ] The eight-section order is stable across breakpoints; only the trace changes location.
- [ ] SQL, tables used, and the trace are visible or one click away in every state that produced them.
- [ ] Empty, loading, streaming, clarification, rejected, abstain, degraded, stale, row-clamped, chart pending, and chart unavailable each render inside the answer column without layout shift beyond the documented ones.
- [ ] Every status has a text label and, where applicable, a reason code in mono.
- [ ] Focus order reaches the composer in two tab stops from the top nav via the skip links.
- [ ] At 200 percent zoom the surface matches the mobile layout and no action is hidden.
