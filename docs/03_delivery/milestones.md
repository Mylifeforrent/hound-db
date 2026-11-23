# Milestones and Demo

## 1. Delivery principles

1. **Evaluation set first.** M0 freezes the 30 cases and gold answers before application code starts.
2. **Thin slice first.** M1 proves the end-to-end path with two questions before the knowledge layer exists.
3. **No big-bang.** Every milestone ends with a runnable artifact.
4. **Honest reporting.** Every milestone records what works, what fails, and what was cut.
5. **Demo-driven scope.** If a feature does not help the 5-minute demo or daily use, it waits.

## 2. Milestones

| Milestone | Scope | Exit criteria | Artifacts |
|---|---|---|---|
| **M0** Materials and eval freeze | Collect schema, questions, gold answers; write the business dictionary; freeze `frozen-v1`; build the adversarial suite | 30 cases with gold and expected behavior; ≥3 clarify/abstain; ≥12 adversarial cases; schema snapshot captured; dictionary v1 | `eval/cases/frozen-v1.jsonl`, `schema/snapshot-v1.sql`, `semantic/dictionary-v1.md`, updated decision log |
| **M1** Thin slice | Docker Compose; target DB connection; introspection; fast path; one LLM path; deterministic gate; executor; chat UI with SQL and result | Two sample questions correct end-to-end; `DROP TABLE` blocked; trace visible in the UI | Runnable API and web app; `make up`; README quickstart v1 |
| **M2** Knowledge layer | Neo4j projection; schema graph explorer; semantic admin console; pgvector indexing; verified-answer and example libraries; graph rebuild | All tables imported; 20 hot tables documented; graph rebuild works; ablation runnable | Admin UI; `make graph-rebuild`; seed semantic assets; ablation script |
| **M3** Agent quality | Full LangGraph (supervisor, knowledge, SQL writer, chart); clarification; repair; trace persistence; per-agent eval metrics | 30-case overall ≥90%; held-out ≥80%; safety FN = 0; agent P95 <10 s; ablation report | Eval dashboard; eval report v1; failure taxonomy populated |
| **M4** Demo polish | Final eval dashboard; query history; save-as-verified; Compose hardening; README; 5-minute video; architecture diagram; unit tests | A teammate runs the demo in ≤10 minutes; demo rehearsed twice; no secrets in repo; docs match behavior | Video, README, architecture diagram, test report, release notes |

### Indicative effort

[ASSUMPTION] At 8–10 focused hours per week:

| Milestone | Indicative effort |
|---|---|
| M0 | 6–10 h |
| M1 | 12–20 h |
| M2 | 16–24 h |
| M3 | 20–30 h |
| M4 | 12–20 h |
| **Total** | **66–104 h** |

## 3. M0 required inputs

The owner MUST provide:

1. `pg_dump --schema-only` output, or an `information_schema` export of tables, columns, primary keys, foreign keys, and comments.
2. The 5–10 most frequently queried tables and the meaning of each `trade` column.
3. Ten additional real questions covering multi-table, aggregate, time-range, and ambiguous business terms.
4. Gold SQL or gold answers for all 30 cases.
5. A one-page business dictionary: enums/status codes, soft-delete rules, timezone and business-day boundary, currency/units.
6. Confirmation that a read-only account exists and that the database is a test database.

Without items 1–3, M0 cannot freeze the suite and M1 cannot start.

## 4. Demo script (5–6 minutes)

Actual table and question names depend on the schema; `trade` is the confirmed example. [TBD-BE]

| Time | Scene | Action | What it proves |
|---|---|---|---|
| 0:00–0:30 | Pain | Narrate the DBeaver loop: open, connect, find tables, write SQL, fix errors, 5–10 minutes | The problem is real and frequent |
| 0:30–1:15 | Fast path | Ask "trade id 333"; answer in under a second with SQL and the row | Speed without an LLM |
| 1:15–2:45 | Agent path | Ask a multi-table or aggregate question; show the trace: knowledge, retrieval, SQL writer, gate, executor | Agent engineering and observability |
| 2:45–3:30 | Ambiguity | Ask about "abnormal orders"; show two candidate interpretations with SQL and preview; pick one | Clarification instead of guessing |
| 3:30–4:00 | Safety | Ask to drop a table or inject instructions; show the deterministic rejection with a reason code | The gate is real, not prompt-only |
| 4:00–4:30 | Honest failure | Replay a held-out failure; show abstention with the reason and the closest valid query | The system knows what it does not know |
| 4:30–5:30 | Evidence | Open the eval dashboard: 90% overall, held-out accuracy, latency, tokens, ablation, failure taxonomy | Claims are measured |
| 5:30–6:00 | Judgment | Show Plan A: four agents plus deterministic tools; explain what was rejected and why | Architecture judgment, not technology collecting |

Rehearse at least twice. Record a backup video in case the live database is unavailable.

## 5. Definition of Done

A milestone is done only when all apply:

- [ ] The artifact runs from a clean checkout with documented commands.
- [ ] The README steps work for a second person in ≤10 minutes.
- [ ] The eval runner is reproducible and records versions.
- [ ] No secrets, credentials, or full result sets are committed.
- [ ] The safety suite passes with zero false negatives.
- [ ] The trace shows every LLM and deterministic step.
- [ ] The decision log and affected docs are updated.
- [ ] The demo script still works end-to-end.

## 6. Schedule risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Knowledge curation takes longer than expected | High | M0/M2 slip | Cap the first pass at 20 hot tables; use LLM drafts and 2–3 minute reviews |
| Multi-agent debugging consumes time | Medium | M3 slip | Typed state, per-node tests, max one repair, trace from day one |
| LLM non-determinism makes eval noisy | Medium | Misleading numbers | Temperature 0; 3 release runs; report median and worst |
| Chart polish expands scope | Medium | M4 slip | Chart is P1 and asynchronous; cut it if needed |
| Scope creep toward BI features | High | All milestones | Non-goals list is normative; reopen the decision log to add anything |

## 7. Out of scope for the demo

- Authentication, multi-tenancy, user management.
- Write operations and production database access.
- Cross-database queries.
- IM integrations and scheduled reports.
- Export/share workflows.
- Metric-definition governance.
- Multi-turn conversation beyond one clarification.
