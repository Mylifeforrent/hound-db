# Business Case — hound-db

**Type:** Internal business case (value case). This is **not** a commercial business model.

## 0. Document control

| Field | Value |
|---|---|
| Status | Draft for owner review |
| Date | 2026-11-23 |
| Owner | Project author (solo) |
| Audience | Author, team reviewers |
| Question answered | Is hound-db worth 66–104 hours of spare time? |
| Question not answered | How do we make money from it? |
| Related | [Requirements](../00_requirement/requirements.md), [Architecture](../01_architecture/architecture.md), [Evaluation protocol](../02_eval/evaluation-protocol.md), [Milestones](../03_delivery/milestones.md), [Decision log](../04_decisions/decision-log.md) |

## 1. Executive summary

hound-db is a local-first natural-language query assistant for the team's PostgreSQL test database. The proposal is to build the Plan A prototype — a deterministic fast path, a verified-answer short-circuit, and a LangGraph agent pipeline with a deterministic safety gate — over 66–104 hours of spare time, gated at M3.

**Base-case value:** 20 queries per day, 3 minutes saved per query, 21 workdays per month → **21 hours saved per month**. Build payback is **3.1–5.0 months** of daily use. Cash cost is about **$21 per month** for LLM API calls. Maintenance is **2–4 hours per month**. These are time savings, not cash savings, and they materialize only if the tool is trusted and used.

**Primary justification is not ROI.** The author's stated goal is personal capability validation and a team tech share. The build demonstrates agent engineering, graph modeling, deterministic safety, and evaluation rigor. Time savings is a secondary benefit and is still a hypothesis.

**Key caveat:** if the only objective were time savings, buying a BI assistant at $6–35 per user per month or using ChatGPT with a pasted schema would be cheaper. The build is justified only because the learning, demonstration, and tailored workflow (read-only execution, deterministic safety, traceability) matter to the author.

**Recommendation:** approve M0–M4 as a spare-time prototype, with a hard stop at M3 if the accuracy, adoption, or maintenance gates fail. No commercialization, no headcount claims, and no production database access.

## 2. Problem and status quo

| Dimension | Today | Cost |
|---|---|---|
| Connection | Open DBeaver, connect to the test database | Slow, repeated setup |
| Schema discovery | Search for tables and columns manually | Time and mistakes |
| SQL writing | Hand-written queries | Syntax errors, wrong joins |
| Verification | Ad hoc; no record of assumptions | Repeated questions, low trust |
| Knowledge | Status codes, soft-delete rules, and joins live in people's heads | Onboarding cost and inconsistency |

The target users are the author and team developers. The primary scenarios are integration-test data verification and data troubleshooting. The reported frequency is "dozens of queries per day"; the exact number is [TBD-BIZ]. The current time per query is assumed to be 3–5 minutes; this is an [ASSUMPTION] and MUST be measured in M0.

The friction is not "developers cannot write SQL". It is connection setup, schema recall, and the round trip between a question and a trustworthy answer.

## 3. Proposed solution

- **Fast path** for simple lookups (primary key, top-N, simple equality, time range): deterministic SQL templates, sub-second, no LLM.
- **Verified-answer short-circuit** for curated question→SQL pairs: execute the stored SQL, never let the LLM rewrite it.
- **Agent path** for analytical questions: supervisor, knowledge agent, SQL writer, asynchronous chart planner, deterministic safety gate and executor.
- **Knowledge layer**: PostgreSQL as the system of record, pgvector for embeddings, Neo4j as a rebuildable graph projection for tables, joins, and business terms.
- **Evaluation dashboard**: 30 frozen cases with a held-out split, per-agent metrics, adversarial safety suite, and a graph-pruning ablation.

Full design: [Architecture](../01_architecture/architecture.md).

## 4. Users and beneficiaries

| Beneficiary | Benefit | Evidence |
|---|---|---|
| Author | Faster daily queries; a credible capability-validation artifact | Primary stated goal |
| Team developers | Faster integration-test verification and troubleshooting; shared verified answers | Dozens of queries per day (reported) |
| Team | A live tech-share demo and reusable patterns for future agent work | Primary stated audience |
| Other teams | Not committed; would require multi-tenant, auth, and security review | Out of scope (D-01, D-05) |

## 5. Value hypothesis

### 5.1 Time savings

| Assumption | Base case | Source |
|---|---|---|
| Queries per day | 20 | [ASSUMPTION] midpoint of "dozens" |
| Current time per query | 4 minutes | [ASSUMPTION] midpoint of 3–5 minutes |
| Time per query with hound-db | 1 minute | [ASSUMPTION] includes reading the SQL and verifying the result |
| Time saved per query | 3 minutes | Derived |
| Workdays per month | 21 | Standard |
| Hours saved per month | 21 | 20 × 3 × 21 ÷ 60 |
| Build effort | 66–104 hours | [Milestones](../03_delivery/milestones.md) |
| Payback at daily use | 3.1–5.0 months | Build hours ÷ monthly savings |
| LLM cost per query | $0.05 | [ASSUMPTION] 8–12k tokens |
| LLM cost per month | $21 | 20 × 21 × $0.05 |
| Maintenance | 2–4 hours per month | Semantic assets, schema drift, eval re-runs |

Sensitivity is in Appendix A. The estimate is a hypothesis, not a measurement. M0 MUST record a one-week time log before the build is treated as justified by time savings.

### 5.2 Trust and quality

- Every answer shows the executed SQL and the selected tables.
- The deterministic gate blocks writes, multiple statements, system catalogs, dangerous functions, and unknown columns.
- When the system is not confident, it clarifies or abstains instead of fabricating a number.
- Verified answers are human-approved and carry an owner and verification date.

These properties reduce the risk of "plausible but wrong" answers, which is the most expensive failure mode in a data tool.

### 5.3 Capability and learning

The project exercises skills that are directly relevant to the author's goals:

- Agent orchestration with typed state, routing, tool use, and repair.
- Retrieval design: pgvector for examples and descriptions; Neo4j for graph traversal.
- Deterministic safety and SQL validation.
- Evaluation design: frozen suites, held-out splits, per-agent metrics, adversarial cases.
- Product judgment: deciding what should be an agent and what should be a tool.

This value is real to the author but is not monetizable and is not counted in the time-savings calculation.

### 5.4 Option value

If another team wants the same workflow, the prototype could become an internal tool. That would require multi-tenant support, authentication, security review, and a maintenance owner. It is **not** committed. The value is optionality, not a plan.

### 5.5 What is not claimed

- No revenue, pricing, or market size.
- No headcount reduction.
- No replacement of the BI stack.
- No production database use.
- No company-wide rollout.
- No guarantee that the 90% accuracy target transfers beyond the frozen 30-case set.

## 6. Cost estimate

| Cost | Estimate | Notes |
|---|---|---|
| Build | 66–104 hours | M0–M4; see [Milestones](../03_delivery/milestones.md) |
| LLM API | ~$21/month | 20 queries/day × 21 days × $0.05; budget not constrained by the owner, but track it |
| Infrastructure | $0 | Local Docker Compose; no cloud hosting |
| Maintenance | 2–4 hours/month | Semantic assets, schema drift, eval re-runs; 4–8 hours after a schema change |
| Opportunity cost | 66–104 hours of spare time | The largest real cost |

Cost risks:

- Token usage per analytical question could exceed 12k, raising the monthly cost.
- Model prices may change.
- Maintenance can creep if the schema changes frequently or the team adds tables.
- Scope creep toward BI features would increase both build and maintenance cost.

## 7. Options considered

| Option | Build effort | Cash cost | Time saved | Learning / demo | Key risk |
|---|---|---|---|---|---|
| Do nothing | 0 | $0 | 0 | None | Status quo persists |
| DBeaver + ChatGPT | ~2 hours setup | $0–20/month | Partial; no execution, safety, or trace | Low | Schema context limits, inconsistent answers, copy-paste errors |
| Buy a BI assistant (Metabase, Power BI, Tableau) | 1–2 days setup plus semantic work | $6–35 per user per month | Medium to high for BI questions | Low | Not tailored to developer troubleshooting; semantic setup; vendor dependency |
| **Build Plan A** | **66–104 hours** | **~$21/month** | **High if adopted** | **High** | **Accuracy, adoption, scope** |
| Build six all-LLM agents | 100–150 hours | Higher token and latency cost | Uncertain | High demo value | Over-engineering, latency, hard to debug |

**Recommendation:** build Plan A. It is the only option that combines the tailored developer workflow, deterministic safety, traceability, and a credible capability-validation artifact.

**Decision rule:** if the M0 time log shows fewer than 10 queries per day or less than 2 minutes saved per query, stop and use an existing tool or ChatGPT instead. The build is not justified by time savings alone at that level.

## 8. Success metrics and kill criteria

| Metric | Target | When | If failed |
|---|---|---|---|
| Measured query frequency | ≥10 per day | M0 | Stop or narrow to a demo |
| Measured time saved per query | ≥2 minutes | M0/M1 | Stop or pivot to "demo only" |
| Fast-path P95 | <1.5 s | M3 | Optimize or remove the fast path |
| Agent P95 | <10 s | M3 | Reduce LLM calls or simplify the graph |
| Overall 30-case accuracy | ≥90% | M3 | Stop or narrow the question set |
| Held-out accuracy | ≥80% | M3 | Stop if <70%; investigate if 70–80% |
| Safety false-negative | 0 | M3 | Release blocker; fix before further use |
| Weekly use | Author uses it ≥3 days/week for 2 consecutive weeks | M3–M4 | Stop if unused |
| Maintenance | ≤8 hours/month | M4 | Simplify or stop |
| LLM cost | ≤$100/month | M4 | Optimize prompts or cap usage |

Kill criteria are additive: any single hard failure (safety false-negative, no use for two weeks, accuracy below 80% after M3) stops the project or forces a pivot.

Pivot options if the build fails:

1. Keep the fast path only; drop the agent path and graph.
2. Keep it as a portfolio demo; stop daily-use investment.
3. Buy an existing BI assistant and document the comparison as the learning outcome.

## 9. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Accuracy is lower than the demo suggests | Medium | High | Held-out split; abstain; failure taxonomy; no benchmark claims |
| Knowledge assets decay | High | High | Owner fields, last-verified dates, eval re-runs after schema changes |
| Scope creep toward BI | High | High | Non-goals are normative; reopen the decision log to add anything |
| Graph is over-engineered | Medium | Medium | Ablation; keep the graph only if it earns its place |
| LLM latency stacking | Medium | Medium | Fast path; parallel retrieval; ≤4 LLM calls; max 1 repair |
| LLM provider dependency | Low | Medium | Provider abstraction; fallback model |
| Test data drift breaks eval | Medium | Medium | Execute gold and generated SQL in the same run |
| No adoption after the demo | Medium | High | Start with the author; measure weekly use; kill criterion |
| Security incident | Low | High | Test DB, read-only account, deterministic gate, no production access |

## 10. Assumptions and open questions

| ID | Type | Item | Needed by |
|---|---|---|---|
| B-01 | ASSUMPTION | 20 queries/day is representative | M0 measurement |
| B-02 | ASSUMPTION | Current time per query is 3–5 minutes | M0 measurement |
| B-03 | ASSUMPTION | The tool reduces a query to about 1 minute including verification | M1 measurement |
| B-04 | ASSUMPTION | $0.05 per analytical query | M3 measurement |
| B-05 | ASSUMPTION | A read-only account and test database are available | M0 |
| B-06 | TBD-BIZ | Actual team adoption beyond the author | M4 |
| B-07 | TBD-BIZ | Whether another team wants to use it | After M4 |
| B-08 | TBD-INFRA | Actual LLM cost per query | M3 |
| B-09 | TBD-UX | UI copy language | M4 |

## 11. Decision requested

1. Approve M0–M4 as a spare-time prototype, with no cash budget beyond the LLM API.
2. Approve an LLM spend cap of **$100 per month**; the expected cost is about $21 per month.
3. Approve the M3 gate and the kill criteria in section 8.
4. Confirm that the project remains non-commercial: no revenue, no headcount claims, no production access, no multi-tenant work.
5. Provide the M0 inputs: schema-only dump, top tables, ten additional questions, gold answers, one-page business dictionary, and read-only confirmation.

## Appendix A — Calculation and sensitivity

**Base formula:**

```
hours saved per month = queries per day × minutes saved × workdays ÷ 60
payback months       = build hours ÷ hours saved per month
```

**Sensitivity:**

| Queries/day | Minutes saved/query | Hours saved/month | Payback at 66 h | Payback at 104 h |
|---|---|---|---|---|
| 10 | 3 | 10.5 | 6.3 months | 9.9 months |
| 20 | 3 | 21.0 | 3.1 months | 5.0 months |
| 30 | 3 | 31.5 | 2.1 months | 3.3 months |
| 20 | 2 | 14.0 | 4.7 months | 7.4 months |
| 20 | 4 | 28.0 | 2.4 months | 3.7 months |

**Interpretation:**

- At 20 queries/day and 3 minutes saved, the build pays back in 3–5 months of daily use.
- At 10 queries/day or 2 minutes saved, payback is 5–10 months; the case weakens.
- These are time savings, not cash. They are only realized if the tool is trusted and adopted.
- The primary justification remains capability validation and team learning, not payback.

## Appendix B — Pricing comparables

Public list prices observed in November 2026. Verify before relying on them; vendors change pricing and packaging.

| Tool | Public list price | Notes |
|---|---|---|
| Metabase | Starter from $6/user/month; Pro $12/user/month; Enterprise from $20k/year | AI tokens at $3.75 per 1M or bring your own key. [Source](https://www.metabase.com/pricing/) |
| Power BI | Pro $14/user/month; Premium Per User $24/user/month | Copilot requires Fabric capacity and consumes it. [Source](https://www.microsoft.com/en-us/power-platform/products/power-bi/pricing) |
| Tableau | Standard from $15/user/month; Enterprise from $35/user/month | AI features are in Cloud+ tiers; contact sales. [Source](https://www.tableau.com/pricing) |
| Hex | $36/editor/month Professional; $75/editor/month Team | Agent credits may apply. [Source](https://hex.tech/pricing/) |
| Cube | $40/dev/month; $80/dev/month | Enterprise custom; bring your own cloud/LLM. [Source](https://cube.dev/pricing) |
| Snowflake Cortex Analyst | Consumption-based | Per-message credits plus warehouse compute. [Source](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst) |
| Databricks Genie | Consumption-based | Verify current packaging and promotional terms. [Source](https://docs.databricks.com/aws/en/genie/best-practices) |

**Observation:** BI seats are priced in the $6–35 per user per month range, and AI is increasingly bundled into those seats. Standalone natural-language query tools rarely command a large premium. For pure time savings, buying is cheaper than building. The build is justified by the tailored workflow and the capability-validation goal, not by undercutting vendor pricing.

## Appendix C — References

Internal:

- [Requirements](../00_requirement/requirements.md)
- [Architecture](../01_architecture/architecture.md)
- [Evaluation protocol](../02_eval/evaluation-protocol.md)
- [Milestones and demo](../03_delivery/milestones.md)
- [Decision log](../04_decisions/decision-log.md)

External pricing pages are linked in Appendix B. They are context for the build-versus-buy discussion, not procurement quotes.
