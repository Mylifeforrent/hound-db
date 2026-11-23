# Architecture

## 1. Context and constraints

| Constraint | Value |
|---|---|
| Users | Author and team developers; team tech-share audience |
| Target data | PostgreSQL test database, read-only account, ~100 tables, 20 hot tables |
| Deployment | Local laptop, Docker Compose |
| External dependency | OpenAI API; budget not constrained |
| Accuracy target | Overall ≥90% on 30 frozen cases; held-out ≥80%; safety false-negative = 0 |
| Latency target | Fast path P95 <1.5 s; agent path P95 <10 s |
| Non-goals | Commercialization, multi-tenancy, authentication, write access, cross-database queries, production connection |

## 2. Component diagram

```
┌──────────────────────────── Web (React) ────────────────────────────┐
│ Chat | Schema graph | Semantic admin | Eval dashboard | History     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ REST + SSE
┌────────────────────────────────▼────────────────────────────────────┐
│ FastAPI                                                             │
│  /ask  /runs  /semantic  /eval  /schema                             │
│                                                                     │
│  Fast path ──► validate ──► executor ──► answer                     │
│                                                                     │
│  LangGraph: Supervisor ─► Knowledge ─► SQL writer ─► Gate ─► Exec   │
│                    │                         ▲           │          │
│                    └─► Clarify / Refuse      └── Repair ┘           │
└───────┬──────────────────────┬──────────────────────┬───────────────┘
        │                      │                      │
   ┌────▼─────┐          ┌─────▼──────┐         ┌─────▼─────┐
   │ App DB   │          │ Neo4j      │         │ OpenAI    │
   │ pgvector │          │ projection │         │ API       │
   └──────────┘          └────────────┘         └───────────┘
        │
   ┌────▼──────────┐
   │ Target test DB│
   │ read-only     │
   └───────────────┘
```

The **app database** (PostgreSQL + pgvector) is a local container and is separate from the **target test database**. The target database receives only read-only queries and never holds application tables. If the target database is a local instance the owner controls, application tables MAY live in a separate database or schema, but the query connection MUST remain read-only.

## 3. Technology decisions

| Concern | Decision | Rationale | Rejected alternatives |
|---|---|---|---|
| Orchestration | LangGraph `StateGraph` | Typed state, conditional edges, `interrupt()` for clarification, resumability, visible trace | Chatty supervisor; no framework |
| Backend | FastAPI + uv | Async, SSE, simple API surface, matches project defaults | Django, Node.js |
| Frontend | React + TypeScript + Vite + Tailwind + shadcn/ui | Matches project defaults; no SSR requirement | Next.js |
| App storage | PostgreSQL + pgvector | One store for relational data, vectors, and eval history | Chroma, LanceDB, Qdrant, separate vector DB |
| Graph | Neo4j Community | Recognizable graph model, Cypher traversal, Browser visualization | Apache AGE, Postgres-only tables |
| LLM | OpenAI; strong model for generation, small model for routing | Available to the owner; quality and tool use | Local models (not required) |
| SQL parsing | sqlglot | Dialect-aware AST, deterministic validation | Regex; LLM-based validation |
| Charts | Vega-Lite | Declarative JSON, no arbitrary code execution | ECharts, Chart.js |
| Runtime | Docker Compose | One command on a laptop | Kubernetes |
| Tracing | Custom `agent_run` / `agent_step` tables | Full control, simple UI, no external service | LangSmith, OpenTelemetry |

## 4. Agent vs tool boundary

An LLM agent is justified only when the step needs independent judgment, its own toolset, and its own evaluation. Everything else is a deterministic tool.

| Capability | Type | Why |
|---|---|---|
| Supervisor | Agent (rules + small LLM) | Intent classification, routing, budget, clarification decision |
| Knowledge agent | Agent (LLM + retrieval tools) | Multi-step schema selection, term resolution, join-path exploration |
| SQL writer | Agent (LLM) | SQL synthesis with assumptions and confidence |
| Chart planner | Agent (LLM, asynchronous) | Chart choice and encoding planning; rendering is deterministic |
| Validate/safety gate | Tool | Must be deterministic and auditable; LLM cannot be the primary defense |
| Executor | Tool | Must be deterministic; no LLM may decide whether or how to execute |
| Performance linter | Tool | Rules plus `EXPLAIN`; advisory only, no auto-rewrite |
| Renderer | Tool | Deterministic Vega-Lite rendering |
| Trace/feedback persistence | Tool/feature | Deterministic writes and product feedback |
| Repair | Loop, reuses SQL writer | Maximum one attempt; not a separate agent |

## 5. LangGraph topology and node contracts

```
entry
  │
  ▼
supervisor
  ├─ simple_lookup ──► fast_path ──► validate_gate ──► executor ──► explain
  ├─ unsafe ─────────► refuse
  ├─ ambiguous ──────► clarify ──► (interrupt; resume with choice)
  └─ analytical
        │
        ├─► knowledge ──────────────┐
        ├─► retrieve_examples ──────┤ (parallel)
        ▼                           ▼
     sql_writer ──► validate_gate ──► executor
                       │                 │
                       └─ reject ──► repair (≤1) ──► sql_writer
                                         │
                                         └─ error ──► repair (≤1)
        │
        ▼
     chart (async, optional) ──► renderer
        │
        ▼
     explain ──► persist trace ──► answer
```

| Node | Type | Input | Output | Timeout | LLM |
|---|---|---|---|---|---|
| `supervisor` | Rules + small LLM | Question, history hints | `intent`, `route`, budget | 2 s | Yes |
| `fast_path` | Deterministic | Question, schema snapshot | SQL from template | 300 ms | No |
| `knowledge` | LLM + tools | Question, vector hits | Candidate tables, subgraph, terms, join paths, confidence | 6 s | Yes |
| `retrieve_examples` | Deterministic | Question embedding | Top-k example pairs | 300 ms | No |
| `sql_writer` | LLM | Question, subgraph, terms, examples | 1–2 SQL candidates, assumptions, confidence | 10 s | Yes |
| `validate_gate` | Deterministic | SQL candidate | Pass/reject, reasons, normalized SQL | 100 ms | No |
| `executor` | Deterministic | Approved SQL | Columns, rows, latency, truncated, error | 10 s | No |
| `repair` | LLM (reuses writer) | Failed SQL, error, schema | New SQL candidate | 10 s | Yes |
| `clarify` | Deterministic + UI | Ambiguity candidates | Clarification request | — | No |
| `chart` | LLM, async | Result schema, sample rows, question | Vega-Lite spec, one-sentence insight | 8 s | Yes |
| `explain` | Template + trace | Run state | Answer text, assumptions, trace | 2 s | Optional |

Typical LLM call count: 2–4. Hard cap: 5. Maximum repairs: 1.

## 6. Shared state

All agents read and write a typed state. Agents MUST NOT exchange free-form prose. This is what makes the graph testable and the trace readable.

```python
class AgentState(TypedDict, total=False):
    run_id: str
    question: str
    connection_id: str
    schema_version: str

    intent: Literal["simple_lookup", "analytical", "ambiguous", "unsafe", "meta"]
    route: Literal["fast_path", "verified", "agent", "clarify", "refuse"]

    candidate_tables: list[TableRef]
    subgraph: SubgraphContext
    resolved_terms: list[ResolvedTerm]
    examples: list[ExamplePair]

    sql_candidates: list[SqlCandidate]
    selected_sql: str | None
    validation: ValidationResult | None
    execution: ExecutionResult | None

    clarification: ClarificationRequest | None
    chart_spec: dict | None
    answer: str | None
    assumptions: list[str]
    confidence: float

    llm_calls: int
    repair_count: int
    degraded: bool
    errors: list[AgentError]
    trace: list[TraceEvent]
```

## 7. Fast path

Patterns recognized without an LLM:

| Pattern | Example | Template |
|---|---|---|
| Primary-key lookup | "trade id 333" | `SELECT * FROM trade WHERE id = $1 LIMIT 1` |
| Top-N by column | "top 10 trades by update_time" | `SELECT * FROM trade ORDER BY update_time DESC LIMIT 10` |
| Simple equality | "trades where status = failed" | `SELECT * FROM trade WHERE status = $1 LIMIT 1000` |
| Time range | "trades updated today" | `SELECT * FROM trade WHERE update_time >= $1 AND update_time < $2 LIMIT 1000` |

Rules:

- The table and columns MUST exist in the current schema snapshot.
- Literal types MUST match column types.
- Joins, aggregation, and nested queries MUST fall back to the agent path.
- If a small model is used for recognition, it MUST return a typed intent object and MUST NOT emit SQL. The template compiler emits SQL.
- User-provided limits are clamped to 1000.
- A generated template still passes through the same deterministic safety gate.

## 8. Verified-answer short-circuit

1. Normalize the question (case, punctuation, canonical table names).
2. Check exact normalized match first.
3. Then check cosine similarity above the configured threshold and the same `connection_id` and `schema_version`.
4. Re-execute the stored SQL template with the current parameters. Never return cached rows.
5. Label the answer as verified and show the stored SQL.
6. If the schema version changed, mark the verified answer `stale` and fall back to the agent path.

The LLM MUST NOT rewrite a verified SQL before execution.

## 9. Knowledge layer

### 9.1 System of record and projection

PostgreSQL is the system of record for schema snapshots, join relations, and semantic assets. Neo4j is a **read-only projection** rebuilt from PostgreSQL. This avoids two sources of truth and enables the degraded mode in NFR-09.

- Admin edits write to PostgreSQL in a transaction.
- A sync step upserts the affected Neo4j nodes and edges.
- `scripts/rebuild_graph` performs a full rebuild.
- If Neo4j is unavailable, the knowledge agent falls back to relational 2-hop expansion over `table_relation`, then to the full schema snapshot; the run is marked `degraded=true`.

### 9.2 Neo4j model

```
(:Table {name, schema, description, row_estimate, hot, verified, snapshot_version})
(:Column {name, data_type, description, nullable, ordinal, enum_values})
(:BusinessTerm {name, definition, aliases})

(:Table)-[:HAS_COLUMN]->(:Column)
(:Table)-[:REFERENCES {constraint_name, from_columns, to_columns}]->(:Table)
(:Table)-[:JOINS_ON {condition, cardinality, verified, note}]->(:Table)
(:BusinessTerm)-[:MAPS_TO {values}]->(:Column)
```

All tables are imported. The 20 hot tables carry verified descriptions, terms, and manual joins. Remaining tables carry introspected metadata and `verified=false`.

### 9.3 Retrieval flow

1. Embed the question.
2. Search `embedding_index` in pgvector for table, column, and term descriptions; combine with keyword/full-text hits.
3. Select candidate tables (top-k, then prune to 2-hop neighborhood).
4. Expand in Neo4j: fetch columns, FK edges, manual join edges, and term mappings.
5. Resolve business terms into column/value constraints (for example, "abnormal order" → `status IN (...)`).
6. Build a compact subgraph context for the SQL writer.

Neo4j may be unavailable; see 9.1 for fallback.

## 10. Validate and safety gate

The gate is deterministic. It is the primary security boundary.

| Check | Rule | Failure code |
|---|---|---|
| Parse | sqlglot must parse exactly one statement | `PARSE_ERROR`, `MULTI_STATEMENT` |
| Statement type | Root must be `SELECT` or `WITH ... SELECT` | `NON_SELECT` |
| Writes | Reject `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `CREATE`, `DROP`, `ALTER`, `TRUNCATE`, `CALL`, `COPY`, `DO` | `WRITE_STATEMENT` |
| Locks | Reject `FOR UPDATE`, `FOR SHARE`, `LOCK TABLE` | `LOCKING_CLAUSE` |
| System catalogs | Reject `pg_catalog`, `information_schema`, `pg_toast` unless explicitly enabled | `SYSTEM_CATALOG` |
| Dangerous functions | Reject `pg_sleep`, `pg_read_file`, `pg_ls_dir`, `lo_import`, `lo_export`, `dblink`, `set_config` | `DANGEROUS_FUNCTION` |
| Whitelist | Every table and column must exist in the schema snapshot | `UNKNOWN_RELATION`, `UNKNOWN_COLUMN` |
| Cartesian joins | Multi-table queries must have a join condition | `CARTESIAN_JOIN` |
| Row cap | Detail queries without `LIMIT` get `LIMIT 1000`; larger limits are clamped | `LIMIT_CLAMPED` (warning) |
| Parameters | Fast-path and verified templates use bound parameters; generated SQL is parsed after interpolation | `PARAM_ERROR` |

Execution-time defenses: read-only transaction, `statement_timeout=10s`, `idle_in_transaction_timeout=15s`, row cap at fetch time, and no temp tables.

An LLM safety review MAY run as a second opinion. If it disagrees with the gate, the gate wins.

## 11. Executor

- Connection pool to the target database with the read-only account.
- Connection options: `default_transaction_read_only=on`, `statement_timeout=10000`, `idle_in_transaction_timeout=15000`, `application_name=hound-db`.
- Execute one statement; `fetchmany(1001)`; return `truncated=true` when the cap is hit.
- Capture `error_code`, `error_message`, and latency.
- Cancel on timeout.
- Never store full result sets; persist at most 20 sample rows or a hash.

## 12. Performance linter

Advisory only. It MUST NOT rewrite SQL.

Rules:

- `SELECT *` on wide tables.
- Cartesian join or missing join condition.
- Function applied to an indexed column in a predicate.
- Leading-wildcard `LIKE`.
- Large `IN` list.
- Missing time filter on a large time-series table.

Plan check: `EXPLAIN (FORMAT JSON, COSTS TRUE)` without `ANALYZE`; warn when estimated cost exceeds the configured threshold. Warnings appear in the trace and the UI.

## 13. Chart planner

- Trigger: result has ≥2 rows and the question is aggregate, trend, or distribution. Single-row lookups never trigger it.
- Input: result schema, up to 50 sample rows, question, units.
- Output: Vega-Lite spec plus a one-sentence insight.
- Guards: at most 500 marks; aggregate or truncate beyond that; no pie charts above 6 categories; no 3D; no arbitrary code.
- Asynchronous: the answer is returned first; the chart appears when ready. Chart failure MUST NOT block the answer.

## 14. Data model

### 14.1 PostgreSQL (system of record)

| Table | Purpose | Key columns |
|---|---|---|
| `db_connection` | Target database connection metadata | `id`, `name`, `host`, `port`, `database`, `secret_ref`, `read_only` |
| `schema_snapshot` | Versioned introspection result | `id`, `connection_id`, `version`, `captured_at`, `ddl_hash`, `payload_json` |
| `table_relation` | FK-derived and manual join relations | `id`, `from_table`, `from_column`, `to_table`, `to_column`, `cardinality`, `join_condition`, `source`, `verified`, `note` |
| `semantic_asset` | Descriptions, enums, business terms | `id`, `asset_type`, `table_name`, `column_name`, `term`, `definition`, `enum_values`, `owner`, `verified`, `updated_at` |
| `embedding_index` | Embeddings for schema and term text | `id`, `entity_type`, `entity_id`, `text`, `embedding`, `model`, `updated_at` |
| `verified_answer` | Short-circuit corpus | `id`, `connection_id`, `schema_version`, `question`, `normalized_question`, `sql_template`, `param_spec`, `owner`, `last_verified_at`, `status`, `embedding` |
| `example_pair` | Few-shot corpus | `id`, `question`, `sql`, `tags`, `tables`, `embedding` |
| `eval_case` | Frozen evaluation cases | `id`, `suite_version`, `set_name`, `question`, `expected_behavior`, `gold_sql`, `gold_result_hash`, `gold_result_sample`, `tags` |
| `eval_run` | Evaluation run metadata | `id`, `suite_version`, `model`, `prompt_version`, `graph_version`, `schema_version`, `temperature`, `metrics` |
| `eval_result` | Per-case result | `run_id`, `case_id`, `outcome`, `route`, `generated_sql`, `result_hash`, `latency_ms`, `tokens`, `error_code` |
| `query_history` | User-visible history and feedback | `id`, `run_id`, `question`, `sql`, `row_count`, `latency_ms`, `feedback` |
| `agent_run` | Trace header | `run_id`, `question`, `route`, `status`, `degraded`, `model`, `versions`, `latency_ms`, `tokens`, `cost_usd` |
| `agent_step` | Trace steps | `run_id`, `seq`, `node`, `type`, `input_json`, `output_json`, `latency_ms`, `tokens`, `error_code` |

### 14.2 Neo4j (projection)

Labels and edges are defined in section 9.2. Neo4j holds no vectors; pgvector is the only vector store.

## 15. API surface

| Endpoint | Purpose |
|---|---|
| `POST /api/ask` | Ask a question; streams SSE events: `route`, `knowledge`, `sql`, `validation`, `execution`, `chart`, `answer`, `error`, `done` |
| `GET /api/runs/{run_id}` | Full trace and result |
| `POST /api/runs/{run_id}/feedback` | Thumbs up/down and optional comment |
| `POST /api/runs/{run_id}/verify` | Promote a run to `verified_answer` |
| `GET/POST/PATCH /api/semantic/*` | Manage descriptions, enums, terms, and join relations |
| `GET /api/schema/graph` | Graph data for the schema explorer |
| `POST /api/eval/runs` | Start an evaluation run |
| `GET /api/eval/runs` | List runs and metrics |
| `GET /api/eval/runs/{id}` | Per-case results |
| `GET /api/health` | Liveness and dependency status |

## 16. Observability

- Every node writes an `agent_step` row: input, output, latency, tokens, error.
- `agent_run` records model, prompt version, graph version, schema version, route, status, and `degraded`.
- The trace UI shows a timeline with LLM and deterministic badges, expandable payloads, and per-step latency.
- Connection secrets are never logged. SQL and at most 20 sample rows are logged; full result sets are not.

## 17. Latency and cost budgets

| Stage | P50 | P95 | Notes |
|---|---|---|---|
| Supervisor | 0.3 s | 0.8 s | Rules first; small model fallback |
| Fast path | 0.2 s | 1.2 s | Includes execution |
| Knowledge | 1.2 s | 3.0 s | Parallel retrieval |
| Example retrieval | 0.1 s | 0.3 s | pgvector |
| SQL writer | 2.5 s | 5.0 s | Strong model |
| Validate gate | 0.02 s | 0.1 s | sqlglot |
| Executor | 0.1 s | 2.0 s | Read-only; 10 s timeout |
| Repair (when needed) | +2.5 s | +5.0 s | ≤1 attempt |
| Chart (async) | 1.2 s | 3.0 s | After answer |
| Agent total | 4–6 s | <10 s | 2–4 LLM calls |

Expected cost: 8–12k tokens per analytical question. Report cost per query; no hard budget gate.

## 18. Failure handling

| Failure | Behavior |
|---|---|
| Fast path low confidence | Fall back to agent path |
| Verified answer stale | Fall back to agent path; mark stale |
| Neo4j unavailable | PostgreSQL relational fallback; `degraded=true` |
| LLM timeout | One retry with a smaller prompt, then abstain |
| Safety gate reject | Repair once; then abstain with reason |
| Execution error | Repair once; then abstain with the database error |
| Material ambiguity | Clarify with two candidates |
| Chart failure | Return the answer without a chart |
| LLM budget exhausted | Abstain with reason; never fabricate |

## 19. Deployment

Compose services:

| Service | Image | Purpose |
|---|---|---|
| `app-db` | `pgvector/pgvector:pg16` | Application data, pgvector, eval history |
| `neo4j` | `neo4j:5-community` | Graph projection |
| `api` | Local build | FastAPI + LangGraph |
| `web` | Local build | React UI |

The target test database is external. Configuration is provided through `.env` (gitignored) with `.env.example` as the template. Volumes persist PostgreSQL and Neo4j data. Healthchecks gate startup. Make targets: `make up`, `make down`, `make graph-rebuild`, `make eval`.

[TBD-INFRA] Exact image tags and Make target names are pinned in M1.

## 20. Rejected designs

| Rejected design | Why rejected |
|---|---|
| Six all-LLM agents, including execution and safety | Latency stacking, non-determinism, prompt-injection risk, untestable |
| LLM executor | Execution must be deterministic and auditable |
| LLM safety gate as primary | Bypassable; cannot provide a false-negative guarantee |
| LLM auto-rewrite for performance | Semantic drift; advisory lint only |
| Chatty supervisor with free-text handoffs | Context loss, doubled latency, hard to test |
| Independent vector database | pgvector is sufficient; one fewer component |
| Neo4j as the only store | Relational eval data and transactions belong in PostgreSQL |
| Full-schema prompting only | 30–50k tokens at ~100 tables; graph pruning is necessary |
| Apache AGE instead of Neo4j | Weaker tooling and visualization for a demo |
| Next.js | SSR is not needed for a local tool |
| Kubernetes | Overkill for a laptop prototype |

## 21. Open technical questions

| ID | Question | Needed by |
|---|---|---|
| T-01 | Embedding model and dimension | M1 |
| T-02 | Similarity threshold for verified short-circuit | M3 |
| T-03 | SSE vs WebSocket for trace streaming | M1 |
| T-04 | LangGraph checkpointer vs custom trace tables only | M1 |
| T-05 | Neo4j Community version and image tag | M1 |
| T-06 | OpenAI model IDs and pricing assumptions | M1 |
| T-07 | Schema snapshot diffing and stale-answer invalidation | M2 |
| T-08 | UI copy language | M4 |
| T-09 | Vega-Lite vs ECharts for rendering | M3 |
