# Hallucination Evaluation Report

_Generated 2026-11-26 12:23 UTC by `python -m backend.evals.factcheck_eval`. Raw results: `backend/evals/results/20261126-173332/`._

## Part A — Fact-Check Agent accuracy (planted errors, ground truth)

24 synthetic campaigns · 103 planted false claims (38 contradicted, 65 unsupported) · 82 true claims.
AI verification ran in 24/24 campaigns (others fell back to the statistics check only). Models used: openai/gpt-oss-120b.

| Metric | Result |
| :--- | ---: |
| **False claims caught (fixed or flagged)** | **100%** (103/103) |
| — fixed automatically (removed from the final copy) | 100% (103/103) |
| — flagged for review (still in copy, shown to the user) | 0% (0/103) |
| False claims missed (published silently) | 0% (0/103) |
| Contradicted claims caught | 100% |
| Unsupported claims caught | 100% |
| Contradicted claims corrected to the true value | 100% |
| **True claims wrongly flagged or removed (false alarms)** | **0%** (0/82) |
| Campaigns with all sections preserved | 100% |

Caught by claim type:

| Type | Caught |
| :--- | ---: |
| award | 100% (8) |
| city | 100% (10) |
| customer | 100% (11) |
| feature | 100% (19) |
| pct | 100% (12) |
| price | 100% (10) |
| statistic | 100% (17) |
| study | 100% (10) |
| year | 100% (6) |

Without the Fact-Check Agent, 100% of these false claims would reach the final copy.

## Part B — Invented statistics in real AI-written copy (before vs after)

5 campaigns, each written by the real copywriter three ways. Metric: statistics (%, multipliers, money) that appear in no source (brand guide or campaign goal) — measured deterministically, no AI judge.

| Pipeline | Unsourced statistics per campaign | Campaigns with ≥1 unsourced statistic |
| :--- | ---: | ---: |
| Old instructions (before changes) | 11.2 | 100% |
| New instructions | 0.2 | 20% |
| New instructions + Fact-Check Agent | 0.2 | 20% |

**Non-numeric claims (features, customers, etc.).** The statistic metric above can't see these, so here is what the Fact-Check Agent reported on the new copy. AI verification completed in 3/5 campaigns (the rest fell back to the statistics-only check because of Groq rate limits or an unreadable AI response). In those, it found 22 claim(s) not backed by the brand guide, corrected 12 (55%) and flagged the remaining 10 for review.

Reduction in invented statistics vs the old pipeline: **98%** (56 → 1).

## Limitations

- Small sample; results vary between runs because the models are not deterministic. Re-run to confirm. (A 2-campaign pilot run missed 1 of 9 planted claims — a fake study — so the true catch rate is likely somewhat below a perfect score.)
- Most of the drop in invented statistics comes from the new copywriter/research instructions, not the Fact-Check Agent; the agent's main contribution is catching non-numeric claims and anything the instructions don't prevent.
- On a free Groq plan, rate limits can stop the AI fact-check or its correction step; the copy is then flagged instead of fixed.
- Part A uses short synthetic copy with clear-cut planted errors; real copy is longer and errors can be subtler.
- Part B measures only numeric statistics, not invented features, customers or other non-numeric claims.
- Vague marketing language (e.g. "enterprise-grade") is not treated as a checkable claim and is not measured.
