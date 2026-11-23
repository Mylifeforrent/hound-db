# Query History Rail Layout

**Status:** Draft for review. Layout specification for the query history rail, a shell surface shared by every view.
**Implements:** [design.md](../design.md) sections 5.3, 8.2-8.3, 9.1, 11; [architecture](../../01_architecture/architecture.md) section 14.1 (`query_history`).
**Scope:** Layout only. No code, no new tokens. Shared measurements are in [grid-system.md](grid-system.md).

Normative keywords: MUST, MUST NOT, DEFAULT. Token names refer to `web/src/styles/tokens.css` as specified by design.md.

## 1. Structure

In flow at 1024 and wider. Full height below the top nav, 240 wide, canvas fill, 1px hairline right border.

```
+-- 240 ------------------+
| filter label  caption   |  fixed
| [ filter input  44    ] |
| 1px hairline            |
| TODAY            caption|  sticky group header
| +---------------------+ |
| | question line 1     | |  content-driven, about 82 high, selected surface-strong
| | question line 2     | |
| | [route] [status] 14:32| |
| +---------------------+ |
| | ...                 | |  list scrolls
| YESTERDAY               |
| | ...                 | |
| footer caption          |  only when the source is capped
+-------------------------+
```

Below 1024 the rail leaves the flow and becomes an overlay drawer opened from the 40px History icon in the top nav.

```
+--------------------------------------+
| TOP NAV 64   brand | pill | status | [H] |
+------------------+-------------------+
| scrim            | HISTORY DRAWER 240 |
| rgba ink 0.48    | filter + list      |
|                  |                    |
+------------------+-------------------+
```

## 2. Grid system

| Viewport | Placement | Width | Margins and padding | Item layout |
|---|---|---|---|---|
| 768 | Overlay drawer | 240 | 0 outer margin; 16 internal padding (`--spacing-md`) | One column |
| 1024 | In flow, first shell column | 240 | 0 outer margin; 16 internal padding | One column |
| 1280 | In flow, first shell column | 240 | 0 outer margin; 16 internal padding | One column |
| 1440 | In flow, first shell column | 240 | 0 outer margin; 16 internal padding | One column |

The rail never changes width. At 240 with 16px side padding the content width is 208. The rail sits between the top nav (64 high) and the viewport bottom, full height, with no bottom margin.

The item is a two-part stack: question text pinned to two lines, then a meta row that may wrap to a second line. Item vertical padding is 12 (`--spacing-sm`) and the line gap is 4 (`--spacing-xxs`). A two-line question with a single meta row is about 82 high; the item grows only when the meta row wraps. The item has a 48 minimum (`--spacing-xxl`) so a one-line question still has a comfortable target.

## 3. Section order and component placement

| Order | Element | Placement | Notes |
|---|---|---|---|
| 1 | Filter label | Above the input, caption | Visible, persistent |
| 2 | Filter input | 44 high, `--radius-sm`, muted border | Fixed above the list |
| 3 | Hairline divider | Below the input | Decorative divider |
| 4 | Day groups | Below the divider, newest first | Today, Yesterday, then ISO dates |
| 5 | History items | Inside each day group | Newest first |
| 6 | Footer caption | After the last group | Only when the source caps the list |

Filter: visible label "Filter questions" in caption, input with the placeholder "Question text", 44 high. Filtering is a case-insensitive substring match on the question text. The input keeps focus while the list updates; the list returns to its top once per change and never steals focus.

Day group header: caption weight 500, muted, 8px top and 4px bottom padding, sticky at the top of the list's scroll container. Labels are "Today", "Yesterday", then the ISO date (for example "2026-11-21"). A group with no items is not rendered.

History item:

- Line 1 and line 2: the question in `--text-body-md`, ink, wrapped with `overflow-wrap: anywhere`, clamped to two lines. The full question is the item's accessible name and its title attribute.
- Meta row: a route badge (Verified, Fast path, or Agent), an optional status badge, and the time in caption tabular. The time is right-aligned on the meta row when it fits and wraps to the next line when it does not. Each item shows one route badge; status badges appear only when the run is not a plain successful answer, and a degraded flag may sit beside a terminal status, in which case the meta row wraps.
- Padding 12px 16px, no radius, hairline bottom border (a list row rule), hover surface-soft, active surface-strong, no shadow.
- Active item: surface-strong fill and `aria-current="true"`.
- Verified item: the route badge is Positive "Verified" (design.md section 8.3); a separate Verified badge is not duplicated.
- Degraded run: the meta row adds the Warning badge "Degraded" next to the route badge.
- Rejected run: Danger badge "Rejected"; the reason code is part of the item's accessible name and title, and appears in full in the answer view.
- Abstain: Neutral badge "Abstain".
- Stale verified hit: Warning badge "Stale", and the route badge reads "Agent" because the run fell back.
- Running run: the meta row reads "Running" in muted text until the route event arrives, then shows the route badge and keeps "Running" until completion.

The footer caption is used only when the history source returns a capped list. It states the cap in words, for example "Showing the 200 most recent questions". A cap MUST NOT be silent.

## 4. Scroll containers and width limits

| Region | Scroll axis | Width | Notes |
|---|---|---|---|
| Item list | Vertical | 208 content | The only scrolling region in the rail |
| Filter | None | 208 | Fixed above the list |
| Day header | None | 208 | Sticks inside the list scroll container |
| Footer caption | None | 208 | In flow at the end of the list |

The rail is fixed at 240 and never shrinks or resizes. The item question is clamped to two lines; the clamp is labeled by the title attribute and the accessible name. No other content in the rail truncates: badges and the time wrap rather than ellipsize.

## 5. States

| State | Trigger | Rail rendering |
|---|---|---|
| Empty | No question has been asked | Empty state with one primary button |
| Loading | History fetch in flight | "Loading history" caption in the list area |
| Streaming | A run is in flight | Newest item at the top with "Running" in the meta row |
| Rejected | The run ended in a safety rejection | Danger badge "Rejected"; reason code in the accessible name |
| Abstain | The run ended without a confident answer | Neutral badge "Abstain" |
| Degraded | The run used relational fallback | Warning badge "Degraded" added to the meta row |
| Stale | A verified hit was invalidated and the run fell back | Warning badge "Stale"; route reads Agent |
| Row-clamped | The source caps the list, or a question exceeds two lines | Two-line clamp with title; labeled footer caption |
| No matches | The filter excludes every item | "No matching questions" plus "Clear filter" |
| Drawer open | Below 1024, the History icon is activated | Overlay drawer with scrim |

### 5.1 Empty

With no history, the list area shows a small empty state: `--text-title-sm` "No questions yet", one sentence in caption, and a primary "Ask a question" button at full rail width. The button moves to the chat surface and focuses the composer, and closes the drawer if open. Full-width buttons are allowed only in narrow modals and empty states (design.md section 8.1); this is the empty-state case.

### 5.2 Loading

The list area shows one caption line, "Loading history". The filter stays enabled. No skeleton rows: a 240-wide rail cannot show a useful skeleton, and design.md section 13 forbids skeletons that outlive one second.

### 5.3 Streaming

The question is appended as the newest item as soon as Ask is sent. Until the route event arrives, the meta row shows "Running" in muted text; after it, the route badge appears and "Running" stays until the answer completes. Selecting a running item shows the live answer in the main region. When the run settles, the item's badges update in place; the list does not reorder or scroll while the user is reading below the top.

### 5.4 Rejected and abstain

A rejected run keeps the question and shows the Danger badge "Rejected". The reason code is not rendered as a third line, because 208px cannot hold it without truncation; it is part of the item's accessible name and title, and it is fully visible in the answer view. An abstain shows the Neutral badge "Abstain" and no danger treatment, because abstaining is not an error.

### 5.5 Degraded and stale

A run produced under degraded mode keeps its normal badge and adds the Warning badge "Degraded". A run whose verified hit was stale shows the Warning badge "Stale" and the Agent route badge, because the stored verified SQL was not executed. Neither badge is dismissible; they describe the run record.

### 5.6 Row-clamped

Two clamps exist and both are labeled:

1. The question is clamped to two lines with a title attribute and a full accessible name. The item grows to at most one extra meta line, never more.
2. If the history source caps the list, the footer caption states the cap in words. There is no "load more" control in v1 because no pagination contract exists for history.

### 5.7 Drawer open

Below 1024, the top nav's 40px History button opens the rail as an overlay drawer: full height below the nav, 240 wide, canvas fill, hairline right border, scrim `rgba(24, 29, 38, 0.48)`, layer 30. The drawer header shows "History" in `--text-title-sm` and a 40px close icon button. Focus moves to the heading, the drawer traps focus, Esc and a scrim click close it, and focus returns to the History button. Selecting an item closes the drawer and loads the run in the main region.

## 6. Responsive behavior

**1024 and wider.** The rail is the first shell column at 240, in flow, full height. It scrolls independently of the main region.

**768-1023.** The rail is an overlay drawer; the top nav shows the History icon. The main region gains 240px of width. The drawer behavior is identical at both tablet widths.

**Below 768.** Same drawer, still 240 wide. On a 320px viewport the drawer covers 240 and the scrim covers the rest; the item padding stays 16, so questions still have 208px to wrap in.

**Any width, 200 percent zoom.** The rail does not reflow internally; it becomes a drawer when the effective viewport drops below 1024. Text does not scale with the viewport, and the two-line clamp still leaves the full question in the accessible name.

## 7. Accessibility

**Landmarks and headings.** The rail is a `nav` with `aria-label="Query history"` and a visually hidden `h2` "History". Day groups are `role="group"` with an accessible name from their visible header. The page's `h1` lives in the main region, not here.

**Roving focus.** The item list is one tab stop. Up and Down move between items, Home and End jump to the ends, Enter or Space selects. This uses the arrow-key convention that design.md section 11 applies to tabs and the graph list, and it avoids up to 200 tab stops in a 240 rail. The filter is a separate tab stop before the list.

**Item semantics.** Each item is a button, full width, with the question as its accessible name plus route, status, and time as a description. The active item has `aria-current="true"`. The time uses a `time` element with a machine-readable value. The route badge text is part of the name, so a screen reader hears "Verified" or "Agent" without relying on color.

**Live updates.** A new item is not announced individually. When a run completes, the existing live region in the main region announces the outcome once, so the rail and the answer do not double-announce. A rejected run's reason code is available from the item's description and from the answer.

**Drawer.** Modal semantics: `dialog` role with an accessible name, focus trap, Esc, focus returns. The scrim is not the only dismiss affordance; a close icon button sits in the drawer header.

**Zoom and contrast.** All rail text uses measured pairs from design.md section 3.5. The rail introduces no color; status is always a badge with text. At 200 percent zoom the drawer fills the space and no badge is clipped.

## 8. Design notes

- The rail is a navigation surface, not a data table. It shows the question, the route, and the worst status a run needs; every detail is one selection away.
- One route badge only. "Verified" is the route marker for a verified hit, so a second Verified badge would duplicate the same fact.
- The reason code is compressed into the accessible name and title instead of a third line. The full code and its consequence remain in the answer view, which is the record of the run.
- The filter and the day headers stay fixed while only the item list scrolls, so a long history never pushes the filter out of reach.
- A running item is inserted optimistically. The alternative, waiting for the first event, would leave the rail showing a question that the user already sent.

## 9. Layout acceptance checks

- [ ] The rail is 240 at every breakpoint; in flow at 1024 and wider, an overlay drawer below.
- [ ] The filter and day headers stay fixed; only the list scrolls.
- [ ] The item question is clamped at two lines with a title attribute and a full accessible name.
- [ ] Empty, loading, running, rejected, abstain, degraded, stale, no-match, and capped-list states are reachable and labeled.
- [ ] The list is one tab stop with arrow-key navigation; the active item has `aria-current`.
- [ ] The drawer traps focus, closes on Esc and scrim click, and returns focus to the History button.
- [ ] A capped list states the cap in words; no clamp is silent.
- [ ] At 200 percent zoom the drawer is usable and no badge or question is clipped.
