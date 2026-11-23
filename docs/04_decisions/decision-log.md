# Decision Log

Append-only. Each decision records its context, the choice, the rejected alternatives, and the consequences. A decision is changed by adding a new entry that supersedes the old one — never by editing history.

**Date of record:** 2026-11-23

## D-01 — Non-commercial capability-validation prototype

- **Context:** The project is a solo, spare-time effort for personal capability validation and a team tech share.
- **Decision:** No commercialization, pricing, or business model. `docs/01_business-model/` is intentionally absent.
- **Rejected:** SaaS product, funded startup, paid internal platform.
- **Consequences:** No multi-tenancy, billing, GTM, or market validation. Success is measured by demo quality, daily use, and evaluation rigor. If commercialization is later considered, add the business-model doc and reopen this decision.

## D-02 — Audience and demonstration goals

- **Context:** The primary audience is a team tech share; the author wants to demonstrate both product completeness and agent engineering.
- **Decision:** Optimize for a 5-minute live demo plus a reproducible repository. Narrative order: evaluation rigor, agent observability, graph modeling, UI completeness.
- **Rejected:** A pure architecture slide deck; a notebook-only prototype.
- **Consequences:** The evaluation dashboard and trace UI are first-class, not optional.

## D-03 — Users and scenarios

- **Context:** The target users are internal developers querying their own system's database.
- **Decision:** Primary scenarios are integration-test data verification and data troubleshooting; frequency is dozens of queries per day; the current tool is DBeaver.
- **Rejected:** Business-user self-service BI; customer-facing analytics; analyst SQL copilot.
- **Consequences:** Optimize for speed, SQL transparency, and schema recall — not dashboards or executive metrics.

## D-04 — Target data and access

- **Context:** The target is a PostgreSQL test database with approximately 100 tables; 20 are hot.
- **Decision:** Connect through a read-only account only. No production database in v1.
- **Rejected:** Production read replica; write access; multi-database federation.
- **Consequences:** The product can never mutate data. Security review is simpler, and the demo cannot damage the target.

## D-05 — Local-first deployment

- **Context:** Solo use, local network, no operations team.
- **Decision:** Docker Compose on a laptop; no authentication or multi-tenancy.
- **Rejected:** Kubernetes, managed cloud deployment, SSO.
- **Consequences:** One-command startup is a hard requirement; public deployment is out of scope.

## D-06 — Web UI first

- **Context:** The product needs a chat surface, a graph explorer, an admin console, and an evaluation dashboard.
- **Decision:** Build a web application first. No CLI or MCP server in v1.
- **Rejected:** CLI-only, IDE plugin, MCP-first.
- **Consequences:** The core runs behind `/api/ask`, so a future MCP or CLI client is a thin shell.

## D-07 — Plan A architecture

- **Context:** The author proposed six LLM agents: generation, execution, safety, chart, performance/feedback, and a supervisor.
- **Decision:** Keep four LLM roles — supervisor, knowledge agent, SQL writer, chart planner — and make validation, execution, performance lint, and rendering deterministic tools. Repair is a loop, not an agent.
- **Rejected:** Six all-LLM agents; single monolithic prompt.
- **Consequences:** Fewer LLM calls, lower latency, deterministic safety, and a clearer demo narrative. The knowledge agent is added because schema selection and term resolution drive accuracy.

## D-08 — Execution is a deterministic tool

- **Context:** An "execution agent" would decide whether, how often, and in what form to run SQL.
- **Decision:** Execution is a deterministic executor with fixed connection settings, timeout, row cap, and error capture.
- **Rejected:** LLM executor; agent that retries or rewrites before running.
- **Consequences:** Execution is auditable and reproducible. The agentic behavior lives in the repair loop, not in running the query.

## D-09 — Safety gate is deterministic

- **Context:** LLM safety checks are non-deterministic and can be bypassed by prompt injection.
- **Decision:** The primary gate is sqlglot AST validation plus read-only execution, whitelist, single-statement, limit, and timeout. An LLM may provide a second opinion, but the gate wins.
- **Rejected:** LLM-only safety review; regex-only filtering.
- **Consequences:** Safety false-negative must be 0. The adversarial suite is a release gate.

## D-10 — Performance optimization is advisory

- **Context:** LLM auto-rewrites can change semantics (for example, outer to inner joins).
- **Decision:** Use rule-based lint plus `EXPLAIN` (without `ANALYZE`) cost warnings. Never auto-apply a rewrite.
- **Rejected:** LLM optimizer that rewrites and executes; index advisor.
- **Consequences:** Performance hints appear in the trace and UI; correctness is preserved.

## D-11 — Chart planning is asynchronous

- **Context:** Most real questions are single-row lookups; charts add latency and failure modes.
- **Decision:** Trigger the chart planner only for aggregate/trend/distribution results with ≥2 rows. It emits a Vega-Lite spec; rendering is deterministic; it never blocks the answer.
- **Rejected:** Chart on every answer; LLM-generated chart code; synchronous charting.
- **Consequences:** Single-row queries stay fast. Chart failures degrade gracefully.

## D-12 — Thin supervisor, typed state

- **Context:** Chatty supervisors that exchange prose with sub-agents lose context, double latency, and are hard to test.
- **Decision:** The supervisor is an entry node with rules-first routing, a small-model fallback, a call budget, and a clarification decision. All agents share a typed state; there are no free-text handoffs.
- **Rejected:** Conversational supervisor; agent-to-agent chat; fully autonomous planner.
- **Consequences:** The graph is testable and the trace is readable. Misrouting falls back to clarification.

## D-13 — Storage split

- **Context:** The product needs relational data, vectors, eval history, and graph traversal.
- **Decision:** PostgreSQL is the system of record (including schema snapshots, joins, semantics, verified answers, examples, eval data, traces). pgvector is the only vector store. Neo4j Community is a rebuildable projection for graph traversal and visualization.
- **Rejected:** Neo4j as the only store; an independent vector database; a document store.
- **Consequences:** One source of truth; the graph can be rebuilt; the system degrades to relational metadata if Neo4j is unavailable.

## D-14 — Import all tables, maintain 20

- **Context:** The database has ~100 tables; roughly 20 are hot. Earlier notes said "20 tables" but this was clarified as 20 maintained tables.
- **Decision:** Import all tables into the schema snapshot and Neo4j. Manually maintain descriptions, terms, and joins for 20 hot tables. Mark the rest `verified=false`.
- **Rejected:** Manually documenting all 100 tables; ignoring non-hot tables entirely.
- **Consequences:** The graph is complete, the maintenance burden is bounded, and the ablation measures whether graph pruning helps.

## D-15 — Semantic scope

- **Context:** "Semantic governance" could expand indefinitely.
- **Decision:** Govern four asset types: table/column descriptions, enums/status codes, business terms, and join relations with cardinality. Do not govern metric definitions.
- **Rejected:** Metric layer, dbt/Cube integration, full data catalog.
- **Consequences:** The knowledge workload stays at roughly one page for the prototype. Metric questions are out of scope.

## D-16 — Fast path for simple lookups

- **Context:** The confirmed examples are primary-key lookup and top-N by update time; both are trivial and high-frequency.
- **Decision:** Recognize simple patterns deterministically, compile SQL from templates, and bypass the LLM. Fall back to the agent path when uncertain.
- **Rejected:** Sending every question to the LLM; a full NL-to-DSL compiler.
- **Consequences:** Sub-second answers for the most common queries. The fast path still passes through the safety gate.

## D-17 — Verified-answer short-circuit

- **Context:** Curated question→SQL pairs are the strongest accuracy lever, but pure similarity retrieval can return stale or wrong SQL.
- **Decision:** Exact normalized match first, then similarity above a tuned threshold, scoped by connection and schema version. Re-execute the stored SQL; never cache rows. The LLM must not rewrite verified SQL.
- **Rejected:** Pure RAG over examples for every question; caching result rows.
- **Consequences:** Verified hits are fast and trustworthy. Schema drift marks answers stale.

## D-18 — Clarify with two candidates; abstain on failure

- **Context:** Silent guessing produces plausible wrong numbers, which is the worst failure mode for a data tool.
- **Decision:** When material ambiguity exists, show two candidate interpretations with SQL and a one-row preview. After one failed repair, abstain with a reason and the closest valid query. Exact lookups never trigger clarification.
- **Rejected:** Open-ended conversational clarification; always pick the most likely interpretation; unlimited repair.
- **Consequences:** The demo can show the system saying "I am not sure", which is a strength, not a weakness.

## D-19 — Evaluation design

- **Context:** A demo can be gamed by storing every question as a verified answer.
- **Decision:** Freeze 30 cases: 10 verified, 10 few-shot, 10 held-out. At least 3 require clarify/abstain, at least 2 in held-out. Overall ≥90%, held-out ≥80%, safety false-negative = 0. Run an ablation of full DDL vs graph-pruned context.
- **Rejected:** Happy-path demo only; benchmark scores as the success metric; merging verified and generated accuracy.
- **Consequences:** The headline number is defensible, and failures are part of the story.

## D-20 — Stack defaults

- **Context:** Project defaults and solo maintainability.
- **Decision:** FastAPI + uv; React + TypeScript + Vite + Tailwind + shadcn/ui; LangGraph for orchestration; LangChain only for model/tool wrappers; OpenAI as the default provider; Vega-Lite for charts; Docker Compose.
- **Rejected:** Django, Next.js, Kubernetes, local LLMs, ECharts.
- **Consequences:** Minimal moving parts. LangChain's `SQLDatabase` must not be used for execution.

## D-21 — Documentation language

- **Context:** The author wants the repository reviewable by a technical audience.
- **Decision:** All repository documentation is in English. User-facing UI copy language is [TBD-UX].
- **Rejected:** Chinese-only documentation; bilingual duplication.
- **Consequences:** Docs are consistent; UI localization remains a small open decision.

## D-22 — No autonomous learning from feedback

- **Context:** "Feedback agent" could imply automatic prompt or semantic mutation.
- **Decision:** Feedback is thumbs up/down plus "Save as verified". No automatic prompt edits. Failure mining is a manual, offline exercise.
- **Rejected:** Self-modifying prompts; automatic semantic edits from user clicks.
- **Consequences:** The knowledge base changes only through explicit human review.

## D-23 — Internal business case added

- **Context:** The owner asked why a business-model document was omitted and requested a business case.
- **Decision:** Add `docs/01_business-model/business-case.md` as an **internal business case (value case)**. It documents the time-saving hypothesis, costs, options, success metrics, and kill criteria. It is explicitly not a commercial business model.
- **Rejected:** Writing a commercial business model with invented customers, pricing, and go-to-market.
- **Consequences:** D-01 remains in force for non-commercialization. This decision supersedes only the "directory intentionally absent" note in D-01: the directory now exists and holds the internal value case. The document MUST be revisited if real adoption, a sponsor, or a second team appears. Commercialization still requires reopening D-01 and a separate business-model document.

## Open decisions

| ID | Question | Needed by | Default if unresolved |
|---|---|---|---|
| O-01 | Embedding model and dimension | M1 | Use the default embedding model of the chosen LLM provider |
| O-02 | Verified-answer similarity threshold | M3 | Start at 0.92; tune on the eval set |
| O-03 | SSE vs WebSocket for trace streaming | M1 | SSE |
| O-04 | LangGraph checkpointer vs custom trace tables | M1 | Custom `agent_run` / `agent_step` tables |
| O-05 | Neo4j image version | M1 | `neo4j:5-community` |
| O-06 | OpenAI model IDs | M1 | Strongest available for generation; cheapest capable for routing |
| O-07 | UI copy language | M4 | Chinese, matching the team |
| O-08 | Chart renderer | M3 | Vega-Lite |
| O-09 | Schema snapshot diff strategy | M2 | Full rebuild per snapshot; mark verified answers stale when the hash changes |

## Superseded decisions

None.
