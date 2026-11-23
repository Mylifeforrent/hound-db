# Evaluation Dashboard Layout

**Status:** Draft for review. Layout specification for the evaluation dashboard.
**Implements:** [design.md](../design.md) sections 5.3, 8.3, 8.5-8.6, 8.8, 9.5, 10, 11; [requirements](../../00_requirement/requirements.md) FR-21 and FR-22; [evaluation protocol](../../02_eval/evaluation-protocol.md).
**Scope:** Layout only. No code, no new tokens. Shared measurements are in [grid-system.md](grid-system.md).

Normative keywords: MUST, MUST NOT, DEFAULT. Token names refer to `web/src/styles/tokens.css` as specified by design.md.

## 1. Structure

Tablet, laptop, and desktop, 768 and wider. One scrolling column of sections inside the shell.

```
+------------------------------------------------------------------------------+
| TOP NAV  64                                                                   |
+--------------+---------------------------------------------------------------+
| HISTORY RAIL | CONTENT BOX  976 at 1280 / 720 at 1024 / 736 at 768           |
| 240          | +-----------------------------------------------------------+ |
|              | | run header: [ run selector 44 ]            [ Copy report ] | |
|              | | model . temperature . prompt . graph . schema . ts . dur  | |
|              | +-----------------------------------------------------------+ |
|              | | Release blocked banner (only when a gate is breached)     | |
|              | +-----------------------------------------------------------+ |
|              | | KPI band  3 up at 976/720/736, 6 up at 1136 or wider      | |
|              | | [ Overall ] [ Verified ] [ Generation ]                   | |
|              | | [ Held-out ] [ Safety FN ] [ P95 ]                        | |
|              | +-----------------------------------------------------------+ |
|              | | run-identity caption: run id . timestamp . schema v       | |
|              | | secondary strip: 5 label/value items                      | |
|              | +-----------------------------------------------------------+ |
|              | | failure taxonomy table                                    | |
|              | | trend chart 240 high + View data                          | |
|              | | ablation table + interpretation sentence                  | |
|              | | case table (8 columns, min 880)                           | |
|              | +-----------------------------------------------------------+ |
+--------------+---------------------------------------------------------------+
                                       case panel 320 overlays from the right
```

Mobile, below 768. The history rail is a drawer; every band collapses to one or two tracks.

```
+------------------------------------------------------------------------------+
| TOP NAV 64  brand | pill | status | [ History ]                             |
+------------------------------------------------------------------------------+
| CONTENT  gutter 16, fluid                                                    |
| [ run selector, full width ]                                                 |
| [ Copy report ]                                                              |
| metadata rows, stacked                                                       |
| KPI band: 3 up at 768 and wider, 2 up from 480 to 767, 1 up below 480      |
| secondary strip: 2 up                                                        |
| taxonomy, chart, ablation, case table (horizontal scroll)                    |
+------------------------------------------------------------------------------+
```

## 2. Grid system

| Viewport | History rail | Page gutter | Content box | KPI tracks | KPI card outer | KPI card inner | Case table |
|---|---|---|---|---|---|---|---|
| 768 | Drawer | 16 (`--spacing-md`) | 736 | 3 | 234.7 | 170.7 | Scrolls horizontally |
| 1024 | 240 | 32 (`--spacing-xl`) | 720 | 3 | 229.3 | 165.3 | Scrolls horizontally |
| 1280 | 240 | 32 | 976 | 3 | 314.7 | 250.7 | Fits at 976 |
| 1440 | 240 | 32 | 1136 | 6 | 176 | 112 | Fits at 1136 |

KPI card inner width = outer width - 64 (32px padding on each side).

The KPI band uses a 12-column grid with a 16px gutter. A card spans 4 columns in the 3-up layout and 2 columns in the 6-up layout.

**Wrap threshold reading.** design.md section 9.5 states that the six KPI cards wrap at 1024px. The shell removes 240px for the history rail, so the threshold is applied to the content box, not the viewport: the band is 6-up when the content box is at least 1024 wide, which begins at a 1328px viewport. At 1280 this produces two rows of three cards with 250.7px of inner width. The literal viewport reading would place six cards of 149.3px outer width, or 85.3px inner width, at 1280. That reading is recorded here so review can amend design.md section 9.5 if it prefers literal six-up at 1280; this layout does not override the document.

Section spacing is 48 (`--spacing-xxl`) between major bands: header, gate banner, KPI band, secondary strip, taxonomy, trend, ablation, case table. Cards inside a band use 16 (`--spacing-md`). The content column is left-aligned in the content box.

## 3. Section order and component placement

| # | Section | Contents | Width | Notes |
|---|---|---|---|---|
| 1 | Run header | Run selector (native select, 44, max 320) and "Copy report" (secondary) on row 1; metadata row 2 | Content width | Metadata: model ID, temperature, prompt version, graph version, schema version, run timestamp, duration |
| 2 | Release blocked banner | Only when a gate is breached; lists the failing metrics, their values, and their gates | Content width | Coral, above the KPI band |
| 3 | KPI band | Six cards | 12-column grid | Overall, Verified split, Generation split, Held-out, Safety false negatives, P95 latency |
| 4 | Run-identity caption | Run ID, run timestamp, schema version | Content width | Ensures every number nearby has a source |
| 5 | Secondary strip | Clarify passes, abstain passes, total tokens, cost per question, failure count | 5-up at 768 and wider; 2-up below 768 | Reported, not gated |
| 6 | Failure taxonomy | Code, count, definition | Content width | Zero rows is a positive panel, never blank |
| 7 | Trend | Chart 240 high plus "View data" | Content width | Overall and held-out across runs |
| 8 | Ablation | Three-column table plus interpretation | Content width | Full DDL vs graph-pruned context |
| 9 | Case table | Eight columns, min 880 | Content width, scrolls inside | All cases render; no pagination |
| 10 | Case panel | Selected case detail | 320 overlay | Opens from the case ID button |

Run header details: the selector has a visible label "Run" and shows run ID plus timestamp in its options. The metadata row is a wrapping caption row with a 16px gap; each item is a muted label and an ink value. Timestamps are ISO 8601 with the local offset. Duration uses one decimal and `s`.

KPI card: 32px padding, `--radius-md`, hairline border, canvas fill. Contents in order: the metric name in caption weight 500, the value in `--text-display-md` 32px tabular, the gate target in caption ("Gate >= 90%" or "Gate = 0"), and a status badge: Positive "Pass" or Danger "Fail" for the four gated cards (overall, held-out, safety false negatives, P95 latency), and Neutral "Reported" for the verified and generation split cards. A failed card also gets a 4px coral left border. The card fill is never coral: design.md section 3.4 limits filled status colors to badges, banners, and buttons.

Gate targets shown on the cards: overall at least 90 percent, held-out at least 80 percent, safety false negatives equal to 0, agent P95 below 10 seconds. The verified and generation split cards are reported, not gated, so their badge reads "Reported" and never "Pass".

The gate banner: coral fill, on-primary text, title "Release blocked", one sentence, the failing items as a list with each metric, its value, and its gate, and the text "No release is approved from this run." It is not dismissible.

The secondary strip sits on a hairline-bounded band with 16px vertical padding, five equal tracks with 16px gaps. Each track: caption label, then value in `--text-body-md` weight 500 tabular. Values are integers, tokens in `k` with one decimal, and cost as recorded.

The failure taxonomy table has three columns (code, count, definition) and 40px dense rows. Codes are mono. Counts are right-aligned and tabular. When the count is zero for every code, the panel is replaced by a positive empty state: a Positive badge "No failures", one sentence, and no table.

The trend section: `--text-title-md` title, caption subtitle stating the run range and the number of runs, the chart, and a "View data" secondary button that toggles a data table beneath the chart. The chart is 240 high (derived from the rail constant). Two series: overall accuracy in `--color-link` and held-out accuracy in `--color-link-active`. Gate reference lines at 90 and 80 are muted dashed rules with caption labels. The last accepted run is marked with a point plus the caption "Last accepted run". Coral is not used as a series color here because the dashboard already uses coral for gate failure; this is a deliberate departure from the palette's assignment order, not a new color.

The ablation table has three columns (metric, full DDL, graph-pruned) and rows for accuracy, tokens, and latency, followed by the interpretation sentence in `--text-body-md`. Missing values render as a muted `NULL`, never as zero or an empty cell. If the run has no ablation, the section shows a Neutral badge "Not run" and one sentence; no fabricated numbers.

The case table has eight columns with a 12-column colgroup: case ID (1), split (1), question (4), outcome (1), route (1), failure code (2), latency (1), tokens (1). Rows are 40px dense. Caption: "30 cases · run <id> · schema v<n>". Split badges use the documented Verified, Few-shot, and Held-out variants. Outcome is a word; a failed outcome also shows a Danger badge "Failed", and an abstain shows a Neutral badge "Abstain". The case ID cell contains a button that opens the case panel; the row itself is also clickable for pointer users, but the button is the keyboard path. Held-out rows are never filtered, paginated, or sorted to the bottom by default; the default order is case ID.

The case panel is a 320 right overlay drawer at every width, so the case table never loses a column to a dock. It contains the case question, split badge, outcome, failure code in mono, generated SQL in a SQL block, result hash, latency, tokens, and the case trace timeline. The trace uses the trace-step anatomy from design.md section 8.7 and scrolls inside the panel. A tertiary "Copy case ID" is the only action.

## 4. Scroll containers and width limits

| Region | Scroll axis | Width | Notes |
|---|---|---|---|
| Dashboard column | Vertical | Content width | The only page scroll |
| Trend chart panel | None | Content width | Chart height 240; data table toggles below |
| Case table | Horizontal | Content width, min 880 | Scrolls inside its panel; sticky header |
| Case panel | Vertical | 320 | Header sticky; Esc closes |
| KPI band | None | Content width | Cards wrap, never scroll |

The dashboard never scrolls horizontally as a page. The case table's 880 min-width is the answer-column constant; at 720 and 736 it scrolls inside its panel, and its first column is not sticky in v1. Long question text in the case table wraps at the cell and keeps a title attribute with the full text; it is never truncated to an ellipsis without one.

## 5. States

| State | Trigger | Header | KPI and secondary bands | Tables and chart |
|---|---|---|---|---|
| Empty | No evaluation runs exist | Run selector empty | Hidden | Hidden |
| Loading | Run list or run detail in flight | "Loading runs" status | Hidden | Hidden |
| Streaming / running | A run started and is not complete | "Running · elapsed 00:42" | Values show an em dash and "Pending run"; no badges | Metrics withheld; completed case rows may appear with "12 of 30 cases complete" |
| Rejected | Not reachable | The dashboard submits no SQL; nearest is Release blocked | - | - |
| Abstain | Not reachable at page level | Per-case abstain is an outcome in the case table | - | - |
| Degraded | The run or the shell is degraded | Warning badge "Degraded" plus banner | Values visible | Values visible |
| Stale | Run schema version behind the current snapshot | Warning badge "Stale schema" plus versions | Values visible | Values visible |
| Row-clamped | Trend window is capped at 20 runs | - | - | Caption "Showing the last 20 of <n> runs" |
| Release blocked | A completed run breaches a gate | - | Failing KPI cards switch to Danger | Banner above the band |

### 5.1 Empty

With no runs, the content column shows a single block: `--text-title-lg` "No evaluation runs yet", one sentence stating that the 30-case suite has not been run, and one primary button "Run eval". No KPI placeholders and no zero-filled chart.

With runs available but none selected, the selector holds the most recent completed run by default. The dashboard never shows a partial mix of two runs.

### 5.2 Loading

A single muted status line "Loading runs" appears below the header. The KPI, secondary, taxonomy, trend, ablation, and case sections are not rendered at all, so no placeholder looks like data. Controls in the header remain enabled; the values replace the status line when the response arrives.

### 5.3 Streaming and running

The evaluation API starts a run and then serves results over ordinary requests, so there is no token stream to render; this is the streaming-equivalent state. While a run is in progress, the header shows "Running" with elapsed time in tabular mono and no duration. The KPI band renders its six cards with an em dash as the value and the caption "Pending run"; no badge is shown, and no gate is evaluated. The secondary strip is hidden. The failure taxonomy, trend, and ablation sections are hidden because a partial run cannot produce them.

If the case endpoint returns completed cases, the case table renders them with the caption "12 of 30 cases complete" and no accuracy figure anywhere. If it does not, the case section shows one caption line, "Results appear when the run completes". The Release blocked banner is never shown for an incomplete run.

### 5.4 Release blocked

A coral banner above the KPI band: title "Release blocked", one sentence, and the failing items as a list, each with the metric, the value, and the gate. The banner is not dismissible. The corresponding KPI cards get the Danger badge "Fail" and the 4px coral left border; other cards keep their positive or reported badge.

The rest of the dashboard stays usable: a blocked run is still a readable run, and its failures are the point of the surface.

### 5.5 Degraded

When the run header records `degraded=true`, a mustard banner sits above the KPI band: title "Degraded run", one sentence stating that graph retrieval was unavailable and relational metadata was used, and the code in mono. The run header keeps a Warning badge "Degraded". All values remain visible and are labeled with the same run identity.

When Neo4j is unavailable at load time, the same banner reports the shell condition and the data still loads from PostgreSQL.

### 5.6 Stale

When the run's recorded schema version is older than the current snapshot, the header shows the Warning badge "Stale schema" and a sentence naming both versions. The values stay visible; the badge prevents a stale run from being read as current. The trend data table carries a stale marker for the run, so the state is readable without relying on the chart mark.

### 5.7 Row-clamped

There is no case-level clamp. All completed cases render; pagination or virtual scrolling MUST NOT hide a held-out failure. The only clamped list on the surface is the trend window: it shows the last 20 runs and the caption states "Showing the last 20 of <n> runs". The case table scrolls horizontally inside its panel rather than truncating a column.

## 6. Responsive behavior

**1280.** History rail 240 in flow; content box 976. KPI band is two rows of three cards at 314.7 outer width. The case table fits at 976. The case panel is an overlay.

**1440.** Content box 1136. The KPI band becomes one row of six at 176 outer width and 112 inner width; card labels and gate captions may wrap to two lines and the band height grows to the tallest card. Everything else keeps its order.

**1024-1279.** Content box 720 at 1024. KPI 3-up at 229.3 outer. The case table scrolls horizontally. The run header metadata wraps to two or three rows. The case panel is a 320 overlay.

**768-1023.** History rail is a drawer; content box 736-991. KPI 3-up at 234.7 or wider. The secondary strip stays 5-up. Tables scroll horizontally.

**Below 768.** Content is fluid with 16px gutters. The run selector takes the full content width and "Copy report" moves to its own row at natural width. Metadata stacks. The KPI band is 2-up between 480 and 767 and 1-up below 480; a 1-up KPI card keeps 32px padding and its 32px value. The secondary strip is 2-up. The trend chart keeps full width with the data table below it. The case table scrolls horizontally; the case panel is full width.

## 7. Accessibility

**Landmarks and headings.** `nav` "Query history" for the rail; `main` for the dashboard; one `h1` "Evaluation"; `h2` for each band (KPIs, failures, trend, ablation, cases); `h3` inside the case panel. The case panel is `complementary` labeled "Case detail".

**Focus order.** Skip to content, top nav, history rail, run selector, Copy report, KPI band (no focus stops unless a card links to its metric definition), failure table, chart View data, ablation, case table scroll region, case buttons, case panel. The case panel moves focus to its heading on open, closes on Esc, and returns focus to the case button.

**KPI semantics.** The band is a description list: each card is a `div` containing a `dt` (metric name) and a `dd` (value, gate, badge). Badges carry text. The gate target is part of the card's accessible text, so "Held-out 82, gate at least 80, Pass" is read as one unit. No card relies on its left border or badge color alone.

**Tables.** Every table has a `caption`, `th scope="col"`, and a row header in the first column. The case table's row header is the case ID; the ID cell's button opens the panel and has an accessible name that includes the case ID and the question. The failure taxonomy's count column is right-aligned and tabular in markup, not by spacing characters. The ablation table's missing values read as "NULL".

**Chart.** The trend is a `figure` with a `figcaption`; series are direct-labeled and the legend is keyboard reachable. "View data" toggles a real table with run, overall, held-out, and acceptance columns, so the chart is never the only encoding. Gate reference lines are labeled in the subtitle. The chart animates once for at most 240ms and honors `prefers-reduced-motion`.

**Live regions.** Starting a run announces "Evaluation run started" once; completion announces "Evaluation run complete" once with the gate outcome. The trend and table updates are not announced per row. Copy report announces "Report copied" once.

**Zoom.** At 200 percent zoom the surface uses the mobile layout; the case table scrolls horizontally and the KPI values stay at 32px. No action is clipped.

## 8. Design notes

- Every number is tied to a run. The run-identity caption sits directly under the KPI band and the case table caption repeats the run ID, so a screenshot of any band carries its source.
- Failing metrics use a badge plus a border, never a filled card. A filled coral card would violate design.md section 3.4 and would also destroy the type contrast on the card.
- The trend avoids coral as a series color because coral is the failure semantic on this surface. The second series uses the third palette entry, `--color-link-active`, which is still a documented chart color.
- The case panel is an overlay rather than a dock so the eight-column table keeps its width. design.md section 9.5 says "side panel"; an overlay drawer is a side panel and is the only reading that keeps the table readable at 976.
- Withholding metrics during a running evaluation is deliberate: a partial accuracy number is a fabricated claim about a run that has not finished.

## 9. Layout acceptance checks

- [ ] At 1280 the content box is 976, the KPI band is 3-up, and the case table fits without page scroll.
- [ ] At 1440 the KPI band is 6-up and no card is narrower than 176 outer.
- [ ] At 1024 and 768 the case table scrolls inside its panel and the page does not scroll horizontally.
- [ ] The KPI wrap reading is documented next to the band and matches this file.
- [ ] Empty, loading, streaming/running, release-blocked, degraded, stale, and trend-window-clamp states are reachable and labeled.
- [ ] A failed gate shows the banner, the Danger badge, and the coral left border, and no card fill.
- [ ] All cases render; no pagination hides a held-out failure.
- [ ] The chart has a data table and a keyboard-reachable legend.
- [ ] At 200 percent zoom the layout uses the mobile band and no metric or action is clipped.
