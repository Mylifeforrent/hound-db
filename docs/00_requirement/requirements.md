# Requirements

## 0. Document control

| Field | Value |
|---|---|
| Status | Approved — Architecture Plan A |
| Date | 2026-11-23 |
| Owner | Project author (solo) |
| Audience | Author, team reviewers |
| Source | Five-round structured interview; see [Decision log](../04_decisions/decision-log.md) |
| Normative language | MUST / MUST NOT / SHOULD / SHOULD NOT / MAY (RFC 2119) |

## 1. Product definition

hound-db is a local-first web application that lets internal developers query a PostgreSQL test database in natural language. It combines a deterministic fast path for high-frequency lookups with a LangGraph agent pipeline for analytical questions. Every answer is traceable to the executed SQL, the selected tables, the business terms applied, and the agent steps that produced it. A frozen 30-case evaluation set, including a held-out split and an adversarial safety suite, provides credible accuracy evidence.

## 2. Goals

| ID | Goal | Why |
|---|---|---|
| G-1 | Ship a complete, runnable product that a teammate can start in ≤10 minutes | The primary audience is a team tech share; "complete product" is one half of the demonstration |
| G-2 | Demonstrate agent engineering: typed state, routing, tool use, retrieval, repair, trace, per-agent evaluation | The second half of the demonstration |
| G-3 | Reduce the 5–10 minute DBeaver loop to seconds for high-frequency developer queries | Real daily value; dozens of queries per day |
| G-4 | Produce credible accuracy evidence, not demo theater | Overall ≥90% on 30 frozen cases; held-out ≥80%; safety false-negative = 0 |

## 3. Success metrics

| Metric | Target | Measurement |
|---|---|---|
| Overall accuracy, 30 cases | ≥90% | Eval runner; correct answer or correct clarify/abstain |
| Held-out generation accuracy, 10 cases | ≥80% | Cases never stored as verified answers or few-shot examples |
| Fast-path P95 latency | <1.5 s | Eval runner and production trace |
| Agent-path P95 latency | <10 s | Eval runner and production trace |
| Traceability | 100% of answers expose SQL and selected tables | UI contract |
| Safety false-negative rate | 0 | Adversarial suite; any dangerous statement passing the gate is a release blocker |
| Cold start | Teammate runs locally in ≤10 minutes | README walkthrough by a second person |

Correctness is defined in the [Evaluation protocol](../02_eval/evaluation-protocol.md). The short version: the result matches gold (order-insensitive for detail, numeric tolerance), or the system correctly clarifies/abstains.

## 4. Users and scenarios

| Field | Value |
|---|---|
| Primary users | The author and team developers |
| Primary scenarios | Integration-test data verification; data troubleshooting during development and test |
| Current workflow | DBeaver: slow connection setup, manual table/column discovery, hand-written SQL |
| Frequency | Dozens of queries per day (reported) |
| Representative questions | "Top 10 trades ordered by update_time"; "Trade with id 333" |
| Job to be done | Get a trustworthy answer in seconds without remembering schema details, and see how the answer was produced |

[ASSUMPTION] The additional questions provided in M0 will remain mostly single-table or simple-join. If they are join-heavy, the graph layer becomes more valuable and the scope grows.

## 5. Non-goals

The following are explicitly out of scope for v1. Adding any of them requires reopening the decision log.

- Commercialization, pricing, billing, market validation.
- Multi-tenancy, authentication, user management, RBAC.
- Write operations of any kind (INSERT/UPDATE/DELETE/DDL).
- Cross-database or federated queries.
- IM integrations (Slack, Lark, DingTalk, WeCom).
- Scheduled reports, subscriptions, alerts.
- Export/share workflows.
- Production database connections; v1 targets a test database with a read-only account.
- Metric-definition governance (GMV, active users, etc.); no metric use case in the current question set.
- Multi-turn conversation; v1 is single-turn plus one clarification.
- Autonomous prompt or semantic mutation from user feedback.
- Enterprise audit, SSO, SOC 2, or on-prem packaging beyond Docker Compose.

An internal business case is documented in [Business case](../01_business-model/business-case.md). It justifies the time investment; it does not imply commercialization.

## 6. Scope

### 6.1 In scope (v1)

| Area | Included |
|---|---|
| UI | Chat, schema graph explorer, semantic admin console, evaluation dashboard, query history sidebar |
| Query modes | Fast path, verified-answer short-circuit, agent path |
| Input | Natural-language question, single-turn; optional clarification selection |
| Output | Answer text, executed SQL, result table, assumptions, confidence, table-selection rationale, agent trace |
| Knowledge | Table/column descriptions, enums/status codes, business terms, join relations and cardinality |
| Evaluation | 30 frozen cases, held-out split, per-agent metrics, adversarial safety suite, ablation, trend |
| Ops | Docker Compose, one-command start, README, 5-minute demo video |

### 6.2 Out of scope (v1)

Everything in section 5, plus charts beyond a single optional bar chart for aggregate results (P1, asynchronous).

## 7. Functional requirements

### Connection and schema

- **FR-01** The system MUST connect to a PostgreSQL test database through a read-only account and MUST enforce read-only at the session level.
- **FR-02** The system MUST introspect tables, columns, types, primary keys, foreign keys, comments, and row estimates, and MUST store the result as a versioned schema snapshot.
- **FR-03** The system MUST project the schema snapshot, join relations, and semantic assets into Neo4j; tables outside the manually maintained set MUST be marked `verified=false`.

### Knowledge management

- **FR-04** The semantic admin console MUST allow the author to edit table descriptions, column descriptions, enums/status codes, business terms and synonyms, and join relations with cardinality and join condition.
- **FR-05** Every knowledge edit MUST record `owner`, `updated_at`, and a schema snapshot version.
- **FR-06** The system MUST maintain two distinct retrieval corpora: `verified_answer` (short-circuit eligible) and `example_pair` (few-shot only). A pair MUST NOT be in both.
- **FR-07** The system MUST allow promoting a successful run to `verified_answer` ("Save as verified"), with owner and verification timestamp.

### Asking questions

- **FR-08** The chat UI MUST accept a natural-language question and MUST return an answer with SQL, result rows, assumptions, confidence, selected tables, and a step trace.
- **FR-09** The system MUST run a deterministic fast path before invoking any LLM for recognized simple patterns: primary-key lookup, order-by with limit, simple equality filter, and time-range filter on a known timestamp column.
- **FR-10** If the fast path cannot recognize a question with high confidence, the system MUST fall back to the agent path. The fast path MUST NOT silently guess.
- **FR-11** The agent path MUST use the Plan A topology: supervisor → knowledge agent → SQL writer → validate/safety gate → executor → optional repair (max 1) → answer; chart planning, when applicable, MUST run asynchronously after the answer.
- **FR-12** If a question matches a `verified_answer` above the configured similarity threshold, the system MUST execute the stored SQL template and MUST label the answer as verified. The system MUST NOT let the LLM rewrite a verified SQL before execution.
- **FR-13** When material ambiguity exists, the system MUST present two candidate interpretations, each with SQL and a one-row preview, and MUST let the user choose. It MUST NOT silently choose.
- **FR-14** After one failed repair, or for an unanswerable question, the system MUST abstain with a reason and the closest valid query. It MUST NOT return a fabricated number.
- **FR-15** Exact lookups (for example, a primary key) MUST NOT trigger clarification.

### Safety and execution

- **FR-16** The validate/safety gate MUST be deterministic and MUST NOT depend on an LLM. It MUST reject non-SELECT statements, multiple statements, system catalogs, dangerous functions, and unknown tables or columns.
- **FR-17** The executor MUST enforce `statement_timeout=10s`, a row cap of 1000 for detail queries, single-statement execution, and read-only transactions.
- **FR-18** Performance optimization MUST be advisory only: rule-based lint plus `EXPLAIN` (without `ANALYZE`) cost warnings. The system MUST NOT auto-rewrite SQL for performance.
- **FR-19** The chart planner, when triggered, MUST output a declarative Vega-Lite specification. Rendering MUST be deterministic. Chart planning MUST NOT block the answer.

### Evaluation and observability

- **FR-20** Every run MUST persist a step-level trace with input, output, latency, tokens, and errors.
- **FR-21** The evaluation dashboard MUST run the 30-case suite, display overall and per-agent metrics, failure taxonomy, and trend across runs.
- **FR-22** Eval runs MUST record model ID, prompt version, graph version, and schema snapshot version.

### Operations

- **FR-23** The system MUST start with one Docker Compose command on a laptop.
- **FR-24** The README MUST let a second person run the demo in ≤10 minutes without undocumented steps.
- **FR-25** Secrets MUST NOT be stored in plaintext in the database or in logs.

## 8. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-01 | Fast-path P95 <1.5 s; agent-path P95 <10 s on the frozen eval set |
| NFR-02 | Typical question ≤4 LLM calls; hard cap 5; maximum 1 repair loop |
| NFR-03 | Overall 30-case accuracy ≥90%; held-out ≥80% |
| NFR-04 | Safety false-negative rate = 0 on the adversarial suite |
| NFR-05 | 100% of answers expose SQL and selected tables |
| NFR-06 | Result persistence stores at most 20 sample rows or a hash, never full result sets |
| NFR-07 | Runs on a single laptop with Docker Compose; the only external dependency is the LLM API |
| NFR-08 | All prompts, model IDs, graph versions, and schema snapshots are versioned and recorded per run |
| NFR-09 | The system remains usable if Neo4j is unavailable: it falls back to PostgreSQL relational metadata and marks the run `degraded` |
| NFR-10 | Documentation is in English; UI copy language is [TBD-UX] |

## 9. Architecture summary

Plan A, confirmed 2026-11-23:

- **LLM agents:** Supervisor (thin router), Knowledge agent, SQL writer, Chart planner (asynchronous, on-demand).
- **Deterministic tools:** validate/safety gate, executor, performance linter, renderer, trace/feedback persistence.
- **Repair:** a loop back to the SQL writer, maximum one attempt; not a separate LLM agent.
- **Storage:** PostgreSQL is the system of record, with pgvector for verified answers, examples, and embeddings; Neo4j Community is a rebuildable graph projection for schema, joins, and business terms.
- **Stack defaults:** FastAPI + uv; React + TypeScript + Vite + Tailwind + shadcn/ui; LangGraph for orchestration; LangChain only for model/tool wrappers; OpenAI as the default provider.

Full details: [Architecture](../01_architecture/architecture.md).

## 10. Knowledge assets

| Asset | Content | Owner (prototype) | Owner (productized) |
|---|---|---|---|
| Table/column descriptions | Purpose, grain, caveats | Author | Team |
| Enums/status codes | Allowed values and meanings | Author | Team |
| Business terms | Synonyms and mappings to columns/values | Author | Team |
| Join relations | Join condition, cardinality, verified flag | Author | Team |
| Verified answers | Question, SQL template, params, owner, last verified | Author | Team |

Cold start: the LLM drafts descriptions from DDL and sample rows; the author reviews the 20 hot tables at 2–3 minutes each; the business dictionary is hand-written and kept to one page.

[RISK] Knowledge maintenance is the real bottleneck. If no one maintains these assets, accuracy decays within weeks regardless of architecture.

## 11. Evaluation summary

30 cases = 10 verified + 10 few-shot + 10 held-out. At least 3 cases are designed to require clarification or abstention, with at least 2 in the held-out set. Gold is SQL plus a result hash. Adversarial safety cases are mandatory. Full protocol: [Evaluation protocol](../02_eval/evaluation-protocol.md).

## 12. Delivery summary

M0 materials and eval set; M1 thin slice; M2 knowledge layer; M3 agent quality; M4 demo polish. Details and the demo script: [Milestones and demo](../03_delivery/milestones.md).

## 13. Risks, assumptions, and open items

| ID | Type | Item | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Risk | With 20 hot tables, the graph may reduce tokens but not improve accuracy | Weakens the graph narrative | Report the ablation honestly; keep the graph only where it earns its place |
| R-02 | Risk | 90% can be gamed by the verified library | Misleading result | Held-out split is reported separately; verified and generated accuracy are never merged |
| R-03 | Risk | Multi-agent latency stacking | P95 breach, poor demo | Fast path, parallel retrieval, ≤4 LLM calls, asynchronous chart, max 1 repair |
| R-04 | Risk | Supervisor misrouting | Wrong answer path | Rules-first routing; fallback to clarification, not guessing |
| R-05 | Risk | Full DDL for ~100 tables is 30–50k tokens | Cost and context pressure | Graph-pruned subgraph; ablation proves the saving |
| R-06 | Risk | Knowledge assets decay | Accuracy regression | Owner fields, last-verified timestamps, eval re-runs after schema changes |
| A-01 | Assumption | Test database only; read-only account available | Blocks M1 | Confirm during M0 |
| A-02 | Assumption | OpenAI API is stable and budget is not constrained | Blocks agent path | Provider abstraction; fallback model |
| A-03 | Assumption | Additional real questions remain mostly simple | Scope | Re-evaluate after the 10 questions arrive |
| T-01 | TBD | Actual schema, top tables, `trade` column meanings | Blocks M0 | Owner provides schema-only dump in M0 |
| T-02 | TBD | 10 additional real questions and gold answers | Blocks eval freeze | Owner provides in M0 |
| T-03 | TBD-BE | Embedding model and dimension | Blocks pgvector schema | Choose with the LLM provider in M1 |
| T-04 | TBD-UX | UI copy language (Chinese vs English) | Cosmetic but user-facing | Decide before M4 |
| T-05 | TBD-INFRA | Exact Docker image versions and Make targets | Blocks M1 packaging | Pin during M1 |

## 14. Glossary

| Term | Definition |
|---|---|
| Fast path | Deterministic pattern recognition and SQL templating that bypasses the LLM |
| Verified answer | A question + SQL template that has been human-verified and may short-circuit generation |
| Held-out | Evaluation cases never stored as verified answers or few-shot examples |
| Subgraph | The table/column/term/join slice retrieved from Neo4j for a question |
| Hot table | One of the ~20 manually maintained tables |
| Trace | Step-level record of an agent run |
| Clarify | Returning two candidate interpretations for the user to choose |
| Abstain | Refusing to answer with a reason instead of fabricating a number |
