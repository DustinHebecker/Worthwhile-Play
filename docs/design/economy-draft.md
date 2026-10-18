# Economy / tycoon game — planning draft (NOT approved)

Status: draft for the owner's review (2026-10-18). It becomes `docs/design/economy.md` plus ADR 0019 (`@wp/economy-engine`) after approval. No code exists yet.
Shared maths: `@wp/finance-math` (ADR 0020). The API draft is in `packages/finance-math/API-DRAFT.md`. The orchestrator approved it in principle and the life-sim agent reviewed it. Review changes still to fold in:
- no rounding defaults at all;
- `studentTUnit`;
- `hazardFromAnnual` and its inverse;
- `poisson`;
- `cholesky` and `correlatedNormals`;
- Rng-based variants `normalFrom`, `studentTFrom` and `logNormalFrom`, with a target of at least 10^7 normals/s;
- AR/GARCH stay in the engines;
- the inflation helpers `fisherReal`, `cumulativeIndex` and `deflate`;
- a timing option (end/start);
- PV of a growing annuity;
- `progressiveTax`;
- `remainingBalance`;
- the key encoding documented (UTF-16, length-prefixed);
- `uniform` on the open interval (0,1);
- the restricted-Math lint rule must also ban `**`.

Verified: in ECMA-262, `Math.sqrt` returns the correctly rounded value, while `exp`, `log`, `pow`, `cbrt` and `expm1` are "implementation-approximated".

## Proposal summary
- **id / name**: `quarterworks` / "Quarterworks" (trademark check pending). The fictional city is Harborfield, with 5 districts.
- **Quarter loop**:
  1. briefing (cycle, base rate, season, events);
  2. decisions per business and site, with standing policies (autopilot rules);
  3. optional forecast (expected value plus band, without the realised shocks);
  4. resolution;
  5. report with a cause breakdown.
  The year-end is a natural pause point.
- **Model**:
  - Bass diffusion: ΔA = (p + qA/M)(M − A).
  - Market demand: Q = D_pot·(p̄/p_ref)^(−ε_m).
  - Attraction shares: w_i = q^α·B^β·(p_i/p_ref)^(−ε_s), share_i = w_i/(w_0 + Σw).
  - Awareness adstock.
  - Sales = min(demand, stock): newsvendor spoilage, backlog.
  - Learning curve: c(n) = c0·(n/n0)^(log2 L).
  - Capacity tiers.
  - Break-even: Q* = F/(p − c_v).
  - Annuity loans; the rate is the base rate plus a rating spread.
  - Overdraft, savings, equity with dilution.
  - Simplified balance sheet with receivables.
  - Valuation by EBITDA multiple minus net debt.
  - Markov business cycle.
  - Money in integer cents; keyed draws give common random numbers for counterfactuals.
- **Industries**:
  - bakery/café: break-even, spoilage, location (MVP);
  - software subscription: S-curve, near-zero marginal cost, churn, sunk cost, equity;
  - solar installer: working capital, interest sensitivity, seasonality;
  - logistics: operating leverage, utilisation, receivables;
  - fashion: inventory risk, lead time, markdowns;
  - agriculture: price taker, cobweb cycle, insurance.
- **Several businesses**: a holding with a shared cash pool, credit rating and overdraft; management attention points; moderate synergies; diversification; sites per district with cannibalisation; pivots with switching and sunk costs.
- **Rivals**: budget, premium, aggressor, copycat and steady. Same rules, no cheats, `observe()` only; entry and exit; curated fictional names.
- **Events**: macro, industry and firm events with options; insurance; an open risk table with probabilities; no gambling feel.
- **Scenarios**:
  1. first bakery;
  2. price war;
  3. borrowed time;
  4. the long curve;
  5. sunny season;
  6. harvest and cycle;
  7. pivot;
  8. holding.
  Plus free play. Endings: goal, sale, retirement or insolvency, followed by a review with "what if" recalculations at 3–5 key points.
- **UI**: bottom navigation (City | Businesses | Finance | Market | Reports); a flat SVG city map; own SVG charts with table alternatives; an interactive price/demand curve; collapsible "How is this calculated?" panels.
- **Save**: the world JSON, a decision log, and snapshots at key points. IndexedDB, roughly under 0.5 MB.
- **Engine/game split**:
  - `@wp/economy-engine`: createWorld, validateDecisions, resolveQuarter, forecast, observe, AI, accounting, isValidWorld, worldHash.
  - The game: scenarios, 16 locales, view, settings, review.
- **Balance**: an AI tournament of the archetypes and scripted strategies; no strategy above about 2/3 of wins; do-nothing loses; "concept tests" check that each lesson actually holds in the model.
- **Tests**:
  - TDD formulas;
  - properties: determinism, purity, round trip, the identity assets = liabilities + equity, cash reconciliation, monotonicity, id symmetry, common random numbers, AI fairness;
  - fuzzing, contract and e2e;
  - long suites;
  - Stryker on accounting and finance.
- **Roadmap**:
  - P0: docs.
  - P1: engine core with the bakery.
  - P2: MVP game with the bakery (release).
  - P3: software, solar, holding, rating, aggressor and copycat, events.
  - P4: logistics, fashion, agriculture, synergies, equity, taxes.
  - P5: scenarios, sale, review.
  - P6: tournament balancing, polish.

## Open owner questions (recommendation in brackets)
1. Name: Quarterworks? (yes, after a trademark check)
2. Currency: a fictional unit with its own coin symbol (yes) or the real local currency?
3. Insolvency: one expensive rescue offer, then the end with a review (yes) or an immediate end?
4. Taxes from P4; inflation only as a scenario option? (yes)
5. MVP with the bakery only? (yes)
6. Forecast tool with a band? (yes)
7. City view: flat 2D (yes) or isometric?
8. Score: net worth plus learning goals, no leaderboard? (yes)
9. Default free-play length: 20 years / 80 quarters (about 3–5 h, an estimate)?
