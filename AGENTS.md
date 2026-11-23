# AGENTS.md — hound-db

Repository rules for every human and AI agent that edits this repository. They override personal or global defaults wherever they conflict, including any default of writing Simplified Chinese replies, commit subjects, or design documents into this repo.

Keywords are normative: **MUST**, **MUST NOT**, **DEFAULT**. When this file is silent, follow the decision log; when the two disagree, the newer decision log entry wins and this file MUST be updated in the same change.

Sources of truth: [requirements](docs/00_requirement/requirements.md), [architecture](docs/01_architecture/architecture.md), [evaluation protocol](docs/02_eval/evaluation-protocol.md), [milestones](docs/03_delivery/milestones.md), [decision log](docs/04_decisions/decision-log.md).

## 1. Language: English only

Every artifact authored in this repository MUST be in English. This is a hard rule, not a style preference ([NFR-10](docs/00_requirement/requirements.md#8-non-functional-requirements), [D-21](docs/04_decisions/decision-log.md#d-21--documentation-language)).

MUST be English:

- All prose in `README.md` and everything under `docs/`, including headings, tables, checklists, and PR/issue text.
- Code identifiers: files, directories, modules, classes, functions, variables, constants, environment variable names, database object names we create, API paths and payload keys, error codes.
- Code comments, docstrings, and type/test names.
- Commit subjects and bodies, branch names, tag names, changelog entries, release notes.
- Log messages, CLI help text, API error messages, and user-visible non-UI strings.
- Test fixture descriptions, eval case titles, and semantic descriptions, terms, and join explanations.
- Task and milestone write-ups committed to the repository.

MUST NOT:

- Mix languages inside one document or one code file.
- Keep bilingual duplicates of a document.
- Use a non-English commit subject or PR title.
- Translate the same content twice "for safety"; pick English.

Permitted exceptions. Each is narrow and scoped to a specific path or field, and they are the only exceptions:

1. User-facing UI copy. The language is the open decision [O-07](docs/04_decisions/decision-log.md#open-decisions) (`[TBD-UX]`, DEFAULT Chinese at M4). UI copy MUST live in a single localization resource file, never inline in components, and the code that consumes it stays English.
2. Schema snapshot content under `schema/`. It is a verbatim dump of the target database and MUST be reproduced exactly, including any non-English comments already present in that database.
3. Business-term synonyms and sample values in `semantic/` or test fixtures, when matching real user vocabulary requires a non-English string. These MUST be data values only; explanations around them stay English.
4. Identifiers, column names, and string values that come from the target database.

Any other exception MUST be justified by a new decision-log entry before the non-English content is committed.

Enforcement: reviews check the diff for non-English prose and strings. From M1, a test MUST scan tracked files for CJK characters and fail, with the exemptions above allowlisted by path. When in doubt, English.

Chat replies to the user are outside this rule and follow the user's stated language preference.

## 2. Scope freeze

The product is a local-first, single-user, non-commercial query assistant over one read-only PostgreSQL test database ([D-01](docs/04_decisions/decision-log.md#d-01--non-commercial-capability-validation-prototype), [D-04](docs/04_decisions/decision-log.md#d-04--target-data-and-access)).

MUST NOT add, without superseding a decision:

- Any write path to the target database: `INSERT`, `UPDATE`, `DELETE`, DDL, `CALL`, functions with side effects, temp tables.
- Connection to a production database, a read replica, or a second database; cross-database joins.
- Authentication, authorization, multi-tenancy, user accounts, billing.
- IM integration, scheduled reports, alerting, a CLI, an MCP server, an IDE plugin.
- A metric layer, dbt/Cube integration, or a full data catalog ([D-15](docs/04_decisions/decision-log.md#d-15--semantic-scope)).
- Cloud or Kubernetes deployment; the runtime is Docker Compose on a laptop ([D-05](docs/04_decisions/decision-log.md#d-05--local-first-deployment)).

## 3. Deterministic boundaries

These boundaries are architectural, not implementation details. Violating one is a defect, not a trade-off.

- The safety gate MUST be deterministic: sqlglot AST validation plus read-only execution, whitelist, single statement, row cap, and timeout. An LLM MAY give a second opinion; the gate decides ([D-09](docs/04_decisions/decision-log.md#d-09--safety-gate-is-deterministic)). A dangerous statement that passes the gate is a release blocker.
- SQL MUST be exactly one statement whose root is `SELECT` or `WITH ... SELECT`. Writes, locking clauses, system catalogs unless explicitly enabled, and dangerous functions MUST be rejected; the rule table in [architecture §10](docs/01_architecture/architecture.md#10-validate-and-safety-gate) is normative.
- Execution MUST be a deterministic tool with fixed connection settings, `statement_timeout`, row cap, and error capture. It MUST NOT retry, rewrite, or decide whether to run ([D-08](docs/04_decisions/decision-log.md#d-08--execution-is-a-deterministic-tool)). LangChain `SQLDatabase` MUST NOT be used for execution.
- The fast path MUST be deterministic and MUST still pass the safety gate ([D-16](docs/04_decisions/decision-log.md#d-16--fast-path-for-simple-lookups)).
- Verified answers MUST follow exact-match, then similarity above the tuned threshold, scoped by connection and schema version. Stored SQL MUST be re-executed; result rows MUST NOT be cached; the LLM MUST NOT rewrite verified SQL ([D-17](docs/04_decisions/decision-log.md#d-17--verified-answer-short-circuit)).
- Charts MUST be planned asynchronously, emitted as a Vega-Lite spec, rendered deterministically, and MUST NOT block the answer ([D-11](docs/04_decisions/decision-log.md#d-11--chart-planning-is-asynchronous)).
- Performance hints MUST be advisory: rule-based lint plus `EXPLAIN` without `ANALYZE`; a rewrite MUST NOT be applied automatically ([D-10](docs/04_decisions/decision-log.md#d-10--performance-optimization-is-advisory)).
- The agent graph MUST use a typed shared state with no free-text handoffs, and clarification MUST offer at most two candidate interpretations; after one failed repair the system abstains ([D-12](docs/04_decisions/decision-log.md#d-12--thin-supervisor-typed-state), [D-18](docs/04_decisions/decision-log.md#d-18--clarify-with-two-candidates-abstain-on-failure)).
- Feedback MUST NOT mutate prompts, semantics, or verified answers automatically. Knowledge changes only through explicit human review ([D-22](docs/04_decisions/decision-log.md#d-22--no-autonomous-learning-from-feedback)).
- Every LLM call and every deterministic step MUST write an `agent_step` trace row.

## 4. Stack and dependencies

Frozen by [D-20](docs/04_decisions/decision-log.md#d-20--stack-defaults) and [architecture §3](docs/01_architecture/architecture.md#3-technology-decisions):

| Concern | Decision |
|---|---|
| Orchestration | LangGraph `StateGraph`; LangChain only for model and tool wrappers |
| Backend | Python, FastAPI, uv |
| Frontend | React, TypeScript, Vite, Tailwind, shadcn/ui (source vendored) |
| System of record | PostgreSQL with pgvector |
| Graph | Neo4j Community, a rebuildable projection |
| LLM | OpenAI; strong model for generation, small model for routing |
| SQL parsing | sqlglot |
| Charts | Vega-Lite |
| Runtime | Docker Compose |

MUST use `uv` for Python (per D-20); `pip`, `requirements.txt`, and `poetry` are forbidden. MUST use `npm` for Node (project default); `pnpm` and `yarn` are forbidden. MUST NOT add a dependency or service without a decision-log entry that names the need and the rejected alternatives. MUST NOT swap a stack element without a superseding decision.

## 5. Storage and knowledge boundaries

- PostgreSQL is the single system of record: schema snapshots, joins, semantics, verified answers, examples, eval data, traces ([D-13](docs/04_decisions/decision-log.md#d-13--storage-split)).
- pgvector MUST be the only vector store. No separate vector database.
- Neo4j MUST remain rebuildable from PostgreSQL; the system MUST degrade to relational metadata when it is unavailable.
- All tables MUST be imported; only the 20 hot tables MUST be manually maintained, and the rest MUST be marked `verified=false` ([D-14](docs/04_decisions/decision-log.md#d-14--import-all-tables-maintain-20)).
- Govern exactly four asset types: table/column descriptions, enums and status codes, business terms, join relations. Metric definitions are out of scope.

## 6. Directory ownership

| Path | Owns | Rules |
|---|---|---|
| `docs/00_requirement/` | Product definition and requirements | Requirement IDs are stable; change by adding, not renumbering |
| `docs/01_architecture/` | Topology, contracts, safety gate, data model | Must match implemented behavior |
| `docs/01_business-model/` | Internal value case | Never present it as a commercial business model |
| `docs/02_eval/` | Case split, correctness rules, metrics | Eval protocol is frozen once M0 lands |
| `docs/03_delivery/` | Milestones, demo script, Definition of Done | DoD applies to every milestone |
| `docs/04_decisions/` | Decision log | Append-only; never edit history |
| `docs/05_ui_design/` | UI design tokens and surface specifications | Token values are normative; no color, radius, or type step outside the Airtable snapshot |
| `eval/` | Frozen cases, gold SQL, runner | Cases are immutable per version; runner records versions |
| `schema/` | Schema-only dumps and snapshots | No data rows, no secrets |
| `semantic/` | Version-controlled seeds and exports of semantic assets | Human-reviewed content only |
| `scripts/` | Setup, import, graph rebuild | Must be idempotent and documented |
| `tests/` | Unit and integration tests | Safety suite is a release gate |

Application code (`api/`, `web/`, `agent/`) is planned for M1. It MUST NOT be introduced before the M0 eval set is frozen, because the evaluation set comes first ([delivery principles](docs/03_delivery/milestones.md#1-delivery-principles)).

## 7. Change protocol

- A multi-file change MUST start with a short plan: goal, files touched, steps, verification. Get it approved before editing, unless the user asked for immediate implementation.
- Behavior and documentation MUST change in the same commit. If implementation must deviate from a doc, either update the doc or add a decision-log entry in that commit.
- The decision log is append-only. Change a decision by adding a superseding entry (`D-nn`); MUST NOT rewrite or delete an existing entry. Open items are `O-nn`; unresolved business or UX facts stay labeled `[TBD-BIZ]`, `[TBD-UX]`, `[TBD-BE]`, `[TBD-INFRA]` with an owner and milestone.
- The evaluation set is frozen ([D-19](docs/04_decisions/decision-log.md#d-19--evaluation-design)). MUST NOT edit, delete, or re-label a committed case to make a metric pass. A new or corrected case MUST arrive as a new versioned snapshot, and held-out cases MUST NOT be tuned against.
- Verified-answer accuracy and generated-answer accuracy MUST be reported separately. Overall >= 90%, held-out >= 80%, safety false negatives = 0 are the gates.
- MUST NOT commit secrets, `.env` values, credentials, connection strings with embedded secrets, production data, real PII, or full result sets. Fixtures are synthetic and sanitized; connection secrets are referenced, never logged.
- MUST NOT connect agents or scripts to a production database, and MUST NOT run destructive SQL against any database.
- Commits MUST follow Conventional Commits with an English subject in the imperative mood, one logical change per commit. MUST NOT use `--no-verify`.
- Knowledge-base content (descriptions, terms, joins, verified answers) MUST be added through explicit human review, never by an automated agent action.

## 8. Verification before commit

MUST run the gates that apply and MUST report what was run. Never claim a check that did not run; if a gate is skipped, say so and why.

| Change type | Required command |
|---|---|
| Python code | `uv run ruff check .` and `uv run ruff format --check .` |
| Python code | `uv run pytest` |
| Frontend code | `npm run lint`, `npm run build`, and `npm test` |
| Compose or infrastructure | `docker compose config` |
| Safety gate, executor, or prompts | Adversarial suite green with zero false negatives |
| Docs only | Re-read the rendered diff; verify internal links and anchors resolve |

These commands are the frozen targets. Repository tooling lands at M1 and MUST make exactly these commands pass from a clean checkout. Until the tooling exists, a change MUST NOT invent alternative commands as "verification".

A milestone is done only when the [Definition of Done](docs/03_delivery/milestones.md#5-definition-of-done) holds, including one-command startup and a second person succeeding in <= 10 minutes.

## 9. Stop and escalate

Stop and ask, or record a decision first, before:

- Adding a dependency, service, or deployment target.
- Touching the safety gate's semantics, the eval set, or the success metrics.
- Introducing any write path, production access, or multi-user capability.
- Expanding scope beyond v1 non-goals, or revisiting D-01 (commercialization).
- Committing anything that looks like a credential, real PII, or a full result set.

## 10. Open items

Tracked in the [decision log](docs/04_decisions/decision-log.md#open-decisions): O-01 embedding model and dimension, O-02 similarity threshold, O-03 SSE vs WebSocket, O-04 checkpointer vs custom tables, O-05 Neo4j image, O-06 model IDs, O-07 UI copy language, O-08 chart renderer, O-09 snapshot diff strategy. Until each is resolved, use the documented default and record the assumption in the change that depends on it.
