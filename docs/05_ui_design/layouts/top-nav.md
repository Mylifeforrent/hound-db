# Top Nav Layout

**Status:** Draft for review. Layout specification for the application top nav.
**Implements:** [design.md](../design.md) sections 5.3, 8.1, 8.3, 9.1, 11; [decision log](../../04_decisions/decision-log.md) [D-05](../../04_decisions/decision-log.md#d-05--local-first-deployment) (no authentication).
**Scope:** Layout only. No code, no new tokens. Shared measurements are in [grid-system.md](grid-system.md).

Normative keywords: MUST, MUST NOT, DEFAULT. Token names refer to `web/src/styles/tokens.css` as specified by design.md.

## 1. Structure

The bar spans the full viewport, sits above the rails, and never scrolls with content.

```
+------------------------------------------------------------------------------+
| 64 high, canvas fill, 1px hairline bottom, sticky layer 10                    |
|                                                                              |
| [ product name ]   [ test DB, read-only ]        [ Healthy ]   [ History ]    |
|  leading group      connection pill               health        40, below 1024|
| <---------------- flexible spacer ---------------------------------------->  |
+------------------------------------------------------------------------------+
```

Zones: a leading group (brand link, connection pill), a flexible spacer, and a trailing group (dependency health, History button below 1024). No user menu, no settings avatar, no model selector: v1 has no authentication (D-05) and no settings surface.

## 2. Grid system

| Viewport | Horizontal padding | Group gap | Within-group gap | History button |
|---|---|---|---|---|
| 768 | 16 (`--spacing-md`) | 16 (`--spacing-md`) | 8 (`--spacing-xs`) | Rendered, 40 |
| 1024 | 32 (`--spacing-xl`) | 24 (`--spacing-lg`) | 16 (`--spacing-md`) | Not rendered |
| 1280 | 32 | 24 | 16 | Not rendered |
| 1440 | 32 | 24 | 16 | Not rendered |

The bar is 64 high at every breakpoint and is not inside the content max width: it is full-bleed and its inner content aligns to the viewport padding, not to the 1200 container. Its height is fixed, so the shell's content region begins at exactly 64 on every surface.

The trailing group is right-aligned by the spacer. The bar content is vertically centered; no item wraps at 768 and wider.

## 3. Section order and component placement

| Order | Element | Placement | Notes |
|---|---|---|---|
| 0 | Skip link | Before the bar in DOM, visually hidden until focused | Targets the main region of the current surface |
| 1 | Brand | Leading edge | Link to the chat surface, `--text-title-sm` 18px weight 500, ink |
| 2 | Connection pill | After the brand | Static: surface-soft fill, `--radius-pill`, caption, 4px/12px padding |
| 3 | Spacer | Middle | Pushes the trailing group right |
| 4 | Dependency health | Trailing group, before History | Dot plus text label, or a badge in a non-healthy state |
| 5 | History button | Trailing edge, below 1024 only | 40px icon button, accessible name "History" |

Brand: a link, not a button, because it navigates to the chat surface. Hover and focus use the link color and the 2px link focus ring at 2px offset. The brand is a focus stop.

Connection pill: the text "test DB, read-only" in `--text-caption`. The pill is not interactive and is not a focus stop. It repeats the connection identity that design.md section 9.2 also requires above the composer; the duplication is intentional and both instances are static.

Dependency health:

- Healthy: an 8px dot in `--color-success` plus the word "Healthy" in caption weight 500, ink. The dot is decorative and hidden from assistive technology; the word carries the state.
- Degraded: the Warning badge "Degraded" (mustard fill, ink text) replaces the dot and word. This is the only way to show degraded health with sufficient text contrast; mustard text on canvas would fail.
- Unavailable: the Danger badge "Unavailable" when the application database is unreachable.
- Checking: the muted caption "Checking status" with no dot.
- The health element is a polite status region; its accessible name includes the subject, for example "Dependencies healthy".

History button: rendered only below 1024, where the rail leaves the flow. It is a 40px icon button with the accessible name "History", `aria-expanded` reflecting the drawer, and `aria-controls` pointing at the drawer. It is removed from the DOM at 1024 and wider, where the rail is permanently visible; it is never a hidden or disabled orphan.

## 4. Scroll containers and width limits

| Region | Scroll axis | Width | Notes |
|---|---|---|---|
| Bar | None | Viewport width | Sticky at layer 10 |
| Leading group | None | Content width | The brand never truncates at 360 and wider |
| Trailing group | None | Content width | Health and History keep their intrinsic widths |

The bar never scrolls and never wraps at 768 and wider. The connection pill is the only element that can shorten, and only below 360: it reads "Read-only" with the full "test DB, read-only" as its accessible name and title, so the connection identity is abbreviated visually but not lost. No other label truncates.

## 5. States

| State | Trigger | Bar rendering |
|---|---|---|
| Healthy | Both dependencies reachable | Success dot plus "Healthy" |
| Checking | Health request in flight | Muted "Checking status", no dot |
| Degraded | Neo4j unreachable, relational fallback active | Warning badge "Degraded" |
| Unavailable | PostgreSQL unreachable | Danger badge "Unavailable" |
| Empty, loading, streaming, rejected, abstain, stale, row-clamped | Not reachable in the bar | Not applicable; these are surface states announced in the main region |

### 5.1 Healthy and checking

Healthy is the resting state: dot plus word, no banner, no announcement on first load. Checking appears only while the first health response is pending; it is a muted caption and not an error. A health change from healthy to degraded is announced once by the health status region; the surface's own degraded banner may also appear, but only one of the two is a live region for that change.

### 5.2 Degraded and unavailable

Degraded health is a Warning badge with the word "Degraded" and no dot: the badge fill carries the mustard semantic and the ink text keeps contrast. The badge is not a button and does not open a popover; dependency detail lives in the surface banner that explains the consequence.

Unavailable uses the Danger badge "Unavailable" and is reserved for a lost application database. The target test database being unreachable is reported by the ask flow as a rejection or abstention with a reason code, not by the nav.

### 5.3 Not applicable states

The bar does not submit questions, so streaming, rejected, abstain, and stale never render here. It has no rows, so row-clamped is not applicable. Run outcomes are announced once by the main region's live region; the nav MUST NOT duplicate those announcements, because a second live region reading the same event confuses screen-reader users.

## 6. Responsive behavior

**1024 and wider.** Padding 32, group gap 24, within-group gap 16. The History button is absent because the rail is in flow. Health sits at the trailing edge.

**768-1023.** Padding 16, group gap 16, within-group gap 8. The History button appears at 40 and is the last element. The health label stays a full word.

**Below 768.** Same mobile composition: 16 padding, 8 gaps. The brand keeps its 18px size; the bar keeps 64. At 360 or wider everything fits on one line. Below 360 the connection pill shortens to "Read-only" as described in section 4; nothing else changes.

**200 percent zoom.** The effective viewport drops below 1024, so the History button appears and the rail becomes a drawer. The bar keeps 64 and its labels remain readable; no item clips.

## 7. Accessibility

**Landmarks and headings.** The bar is a `header` (banner landmark). The skip link precedes it in DOM and is the first focus stop. The brand is the only navigation link in the bar; there is no secondary navigation menu.

**Focus order.** Skip link, brand, History button (below 1024), then the rest of the shell. The connection pill and the health label are not focus stops because they are not actions.

**Names.** The brand link's accessible name is the product name. The History button has the accessible name "History" and exposes its expanded state. The connection pill's text is read as static text. The health element exposes the subject and state, for example "Dependencies degraded", not a color word.

**Status.** Health is always text plus color. The dot is decorative and hidden. A change is announced once by a polite status region; no flashing, no motion.

**Contrast and focus.** The bar uses ink on canvas and the measured pairs in design.md section 3.5. Focus is a 2px link outline at 2px offset, never removed. The History button has a 40x40 hit target and the brand link has at least a 40px hit height through vertical padding.

## 8. Design notes

- The bar carries exactly two facts and one action: which connection is in use, whether dependencies are healthy, and where history lives when it is not on screen. Anything else belongs to the surface.
- The connection pill is static. Making it a menu would imply switching connections, which is out of scope (one read-only connection, D-04).
- Degraded and unavailable use badges rather than a colored dot with colored text, because mustard and coral text on canvas fail contrast at caption size.
- The History button is removed at 1024, not hidden. A hidden control that duplicates a visible rail would add a dead tab stop.

## 9. Layout acceptance checks

- [ ] The bar is 64 high with a hairline bottom at every breakpoint and never scrolls.
- [ ] At 1024 and wider the padding is 32 and the History button is absent; below 1024 it is 16 with a 40px History button.
- [ ] The connection pill and health label are not focus stops; the brand and History are.
- [ ] Health shows text in every state: "Checking status", "Healthy", "Degraded", or "Unavailable".
- [ ] A health change is announced once, and the bar never announces run outcomes.
- [ ] Below 360 the pill shortens to "Read-only" with the full text as its accessible name and title.
- [ ] At 200 percent zoom the bar keeps 64, the History button appears, and no label clips.
- [ ] No user menu, settings avatar, or model selector exists in the bar.
