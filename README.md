# hound-db

**Local-first natural-language data query assistant for developers.**

Ask a question against a PostgreSQL test database in plain language. Get an answer you can trace to the executed SQL, the tables used, and every agent step that produced it.

> **Status:** requirements finalized (Architecture Plan A). Implementation not started.
> **Decision date:** 2026-11-23.

## What it does

- **Fast path** for simple lookups (`trade by id`, `top 10 by update_time`): deterministic SQL templates, sub-second, no LLM.
- **Agent path** for analytical questions: LangGraph supervisor, knowledge agent, SQL writer, and an asynchronous chart planner, wrapped around a deterministic safety gate and executor.
- **Knowledge layer**: PostgreSQL with pgvector for verified question→SQL pairs and embeddings; Neo4j Community as a graph projection for tables, columns, joins, and business terms.
- **Evaluation dashboard**: 30 frozen cases (10 verified / 10 few-shot / 10 held-out), per-agent metrics, adversarial safety suite, regression trend.
- **Four UI surfaces**: chat, schema graph explorer, semantic admin console, evaluation dashboard.

## What it is not

Not a commercial product. No authentication, multi-tenancy, write access, cross-database joins, IM integration, scheduled reports, or production database connection. See [Non-goals](docs/00_requirement/requirements.md#5-non-goals).

## Documentation

| Document | Contents |
|---|---|
| [AGENTS.md](AGENTS.md) | Repository rules for humans and AI agents: English-only artifacts, scope freeze, deterministic boundaries, verification gates |
| [Requirements](docs/00_requirement/requirements.md) | Product definition, users, scope, functional and non-functional requirements, success metrics, risks |
| [Business case](docs/01_business-model/business-case.md) | Internal value case: time-saving hypothesis, costs, options, success and kill criteria. Not a commercial business model |
| [Architecture](docs/01_architecture/architecture.md) | Plan A topology, agent/tool boundary, node contracts, data model, safety gate, API, latency and cost budgets |
| [Evaluation protocol](docs/02_eval/evaluation-protocol.md) | Case split, gold standard, correctness rules, metrics, adversarial suite, regression policy |
| [Milestones and demo](docs/03_delivery/milestones.md) | M0–M4, exit criteria, 5-minute demo script, required inputs |
| [Decision log](docs/04_decisions/decision-log.md) | Final decisions, rejected alternatives, rationale, open items |
| [UI design](docs/05_ui_design/design.md) | Airtable token snapshot, color and type rules, component specs, and the four app surfaces |

`docs/01_business-model/` contains an **internal business case (value case)**, not a commercial business model. The project remains non-commercial (decision D-01); the document answers "is this worth the author's spare time?", not "how do we make money?".

## Non-negotiable constraints

1. The target database is a **test database** accessed through a **read-only** account. No row is ever written by the product.
2. The safety gate is **deterministic**. An LLM may advise, but it never decides whether SQL is safe.
3. Every answer shows the SQL and the tables used. No hidden generation.
4. Accuracy is reported on a **frozen 30-case set with a held-out split**; verified-answer hits and generated answers are reported separately.
5. A dangerous statement passing the gate is a **release blocker**.

## Getting started

Nothing runs yet. M0 freezes the evaluation set; M1 delivers the first end-to-end slice. Setup instructions will be added when the first runnable milestone lands.

## Repository status

```
docs/                 Requirements, architecture, evaluation, delivery, decisions, UI design
docs/00_setup/        Reserved for project setup and rules (empty)
docs/05_ui_design/    Airtable-derived tokens, component specs, and surface designs
eval/                 Frozen evaluation cases and runner (M0/M3)
schema/               Schema-only dumps and snapshots (M0/M1)
semantic/             Version-controlled seed/export of semantic assets (M2)
scripts/              Setup, import, and graph rebuild scripts (M1/M2)
tests/                Unit and integration tests (M1+)
```

Application code (`api/`, `web/`, `agent/`) is planned for M1.
