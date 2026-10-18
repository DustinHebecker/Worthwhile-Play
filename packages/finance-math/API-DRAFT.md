# `@wp/finance-math` — API draft v1 (for review)

Status: draft by the economy agent, 2026-10-18. Reviewers: the life-sim agent and the orchestrator. ADR 0020 "Deterministic finance math" follows after the OK.
Consumers: `@wp/economy-engine` (ADR 0019) and `@wp/life-engine` (ADR 0018). It depends only on `@wp/game-core` (for the `Rng` interface). Pure functions, no DOM, no state.

## 0. The core decision: deterministic doubles, not fixed-point

ECMAScript fixes `+ − × ÷` on Numbers to IEEE-754 binary64 with round-to-nearest-even, and JS engines never fuse multiply-add. `Math.exp`, `log`, `pow`, `sin` and the like are *implementation-approximated*: V8, SpiderMonkey and JSC may differ in the last ulp. Even `Math.pow(x, 2)` is not guaranteed to equal `x * x`.

**Proposal:**
- Real-valued maths runs on ordinary doubles, using only the exact operations: `+ − × ÷`, comparisons, `Math.floor/ceil/trunc/round/abs/min/max/sign`, `Math.imul`, bit ops, `Number.isInteger`, and `Math.fround` (unused).
- `exp`, `ln` and `pow` are our own, built with range reduction and polynomials from those operations only.
- **Money** is stored as integer **cents**. Converting real → cents always names a rounding mode.

Why not Q16.16 or decimal fixed-point:
- It needs BigInt or a split multiply for products above 2^53.
- It loses range for growth over 100+ periods.
- It doubles the code.

Doubles are exact in JSON round trips, are as deterministic as integers under the restricted operation set, and are faster. A lint rule (an ESLint `no-restricted-properties` on `Math.exp/log/pow/sqrt/cbrt/sin/cos/tan/atan2/hypot/expm1/log1p/log2/log10/sinh/…`) enforces the set inside both engines.

> Open point A: Is `Math.sqrt` safe? The spec requires a correctly rounded result (it is not listed as implementation-approximated, unlike `exp`/`log`). I believe this, but **will verify against the current spec text** before relying on it. Fallback: a Newton iteration from the basic ops.

## 1. Money and rates (`money.ts`)

```ts
/** Integer number of cents, |v| ≤ Number.MAX_SAFE_INTEGER. Plain number at runtime (JSON-safe). */
export type Cents = number;
/** Integer basis points: 10_000 = 100 %. May be negative (negative rates, losses). */
export type Bp = number;
export const BP_ONE = 10_000;

export type Rounding = 'half-even' | 'half-up' | 'floor' | 'ceil' | 'trunc';

export function isCents(v: unknown): v is Cents;            // never throws
export function isBp(v: unknown): v is Bp;                  // never throws; integer, |v| ≤ 10^8
/** Real → cents. Throws RangeError on non-finite or unsafe results (a logic bug, never user input). */
export function toCents(x: number, mode: Rounding): Cents;
/** Exact a·b/c with one rounding, via BigInt internally (no 2^53 overflow). c ≠ 0. */
export function mulDiv(a: Cents, b: number /* integer */, c: number /* integer */, mode: Rounding): Cents;
/** amount × rate, exact, one rounding: mulDiv(amount, bp, BP_ONE, mode). */
export function applyBp(amount: Cents, rate: Bp, mode: Rounding): Cents;
/** Splits `total` into integer parts proportional to non-negative weights (largest remainder,
 *  ties to the lower index). Σ parts === total exactly. All-zero weights: an even split. */
export function allocate(total: Cents, weights: readonly number[]): Cents[];
/** Checked sum; throws RangeError past MAX_SAFE_INTEGER. */
export function sumCents(values: readonly Cents[]): Cents;
export function bpToRate(bp: Bp): number;                    // bp / 10_000 (exact for |bp| < 2^53)
export function rateToBp(rate: number, mode: Rounding): Bp;
```

## 2. Deterministic real functions (`real.ts`)

These are bit-identical on every engine. Accuracy: ≤ 1 ulp versus a correctly rounded reference on the documented domain; the target is ≤ 2 ulp, measured in tests.

```ts
export function exp(x: number): number;        // x ∈ [−745, 709.78]; outside: 0 / Infinity
export function ln(x: number): number;         // x > 0; ln(0) = −Infinity; x < 0 → NaN
export function log2(x: number): number;
export function pow(base: number, e: number): number; // base > 0 any e; base ≤ 0 only integer e
export function powInt(base: number, n: number): number; // exponentiation by squaring, integer n
export function sqrt(x: number): number;       // Math.sqrt if open point A holds, else Newton
export function expm1(x: number): number;      // accurate near 0 (small rates)
export function ln1p(x: number): number;       // accurate near 0: per-period rates
```

## 3. Interest, growth, valuation (`interest.ts`)

Rates are **per period** as real fractions (`0.012` = 1.2 % per quarter); callers convert from `Bp`.

```ts
/** Effective per-period rate from an annual effective rate: (1+a)^(1/n) − 1 (via ln1p/expm1). */
export function periodicRate(annual: number, periodsPerYear: number): number;
/** Nominal split: annual / n (what banks quote for loans). Both are offered so the games can teach the difference. */
export function nominalPeriodicRate(annual: number, periodsPerYear: number): number;
/** Growth factor (1+r)^n, integer n ≥ 0 (powInt; exact for r = 0). */
export function growthFactor(r: number, n: number): number;
/** principal·(1+r)^n rounded once. */
export function compound(principal: Cents, r: number, n: number, mode: Rounding): Cents;
/** Level annuity payment P·r/(1−(1+r)^−n); r = 0 → P/n. Default rounding `ceil` (the lender's side). */
export function annuityPayment(principal: Cents, r: number, n: number, mode?: Rounding): Cents;
export interface ScheduleRow { period: number; payment: Cents; interest: Cents; principal: Cents; balance: Cents; }
/** Full amortisation: interest is rounded per period (half-even); the last row takes the remainder, so the balance is exactly 0. */
export function amortization(principal: Cents, r: number, n: number): ScheduleRow[];
/** One period of a running loan, for state machines that do not hold a schedule. */
export function loanStep(balance: Cents, r: number, payment: Cents): { interest: Cents; principal: Cents; balance: Cents };
/** Σ cf_t/(1+r)^t, t = 0..; real result (callers round). */
export function npv(cashflows: readonly Cents[], r: number): number;
/** IRR by bracketed bisection plus a secant step, fixed iteration cap, deterministic; undefined if there is no sign change. */
export function irr(cashflows: readonly Cents[], opts?: { lo?: number; hi?: number; maxIter?: number }): number | undefined;
/** Perpetuity with growth: cf/(r−g), r > g. Used for a terminal value. */
export function growingPerpetuity(cf: number, r: number, g: number): number;
```

## 4. Keyed random draws (`draw.ts`): common random numbers

Problem: with a sequential `Rng`, any extra draw (one more decision, one more firm) shifts every later draw. A "what if" replay would then differ in weather and markets too.

Solution: stateless draws addressed by a **key**.

```ts
/** Key parts: small integers or short ASCII strings, e.g. [quarter, 'weather', districtId]. */
export type KeyPart = number | string;
/** 32-bit mix of the seed and the key: a canonical encoding plus murmur3 fmix32 per word (documented byte layout). */
export function keyHash(seed: number, ...key: KeyPart[]): number;
/** Uniform in [0, 1), 53-bit resolution (two hashes). Never returns 1. */
export function uniform(seed: number, ...key: KeyPart[]): number;
export function uniformInt(seed: number, min: number, max: number, ...key: KeyPart[]): number; // inclusive, unbiased (rejection on the hash chain)
export function bernoulli(seed: number, p: number, ...key: KeyPart[]): boolean;
/** Standard normal by inverse CDF (Wichura AS241, basic ops + our ln/sqrt): one uniform per draw, so it stays keyed. */
export function normal(seed: number, ...key: KeyPart[]): number;
export function logNormal(seed: number, mu: number, sigma: number, ...key: KeyPart[]): number;
/** Student t with integer df ≥ 1 (fat-tailed returns): normal / sqrt(χ²_df/df), χ² from df keyed normals (sub-keys 0..df−1). */
export function studentT(seed: number, df: number, ...key: KeyPart[]): number;
/** Weighted choice, weights ≥ 0 with a positive sum; returns the index. */
export function weightedIndex(seed: number, weights: readonly number[], ...key: KeyPart[]): number;
/** A sequential Rng (game-core interface) seeded from a key: for local shuffles inside one keyed step. */
export function keyedRng(seed: number, ...key: KeyPart[]): Rng;
/** Inverse normal CDF itself (also useful for confidence bands in forecasts). */
export function normalQuantile(p: number): number;   // p ∈ (0,1)
export function normalCdf(x: number): number;        // erfc-based, own implementation
```

## 5. Regimes (`markov.ts`)

```ts
/** Row-stochastic transition matrix in Bp (each row sums to 10_000; validated). */
export type TransitionBp = readonly (readonly Bp[])[];
export function isTransitionBp(m: unknown, states?: number): m is TransitionBp;   // never throws
export function markovStep(m: TransitionBp, state: number, u: number /* uniform [0,1) */): number;
/** Long-run distribution (power iteration, fixed count): for docs and tests and the "formula" panels. */
export function stationary(m: TransitionBp): number[];
```

Business cycles (economy), market regimes for returns (life sim), and possibly health or job states.

## 6. Tests (part of the PR)

- **Golden vectors.** `golden.test.ts` holds ~200 inputs per function with the expected **float64 bit pattern** (hex). Any change of an algorithm breaks it on purpose: a reviewed diff. It also holds keyed draws: `uniform(42, 7, 'weather', 3)` and others, as bits.
- **Accuracy.** Compare against a high-precision reference computed with BigInt rational arithmetic in the test (slow, test-only) on random inputs. Assert ≤ 2 ulp, and report the maximum found.
- **Properties (fast-check).**
  - `exp(ln x) ≈ x`; `ln(a·b) ≈ ln a + ln b` within bounds; `pow(x, 1) === x`; `pow(x, 0) === 1`; `powInt` matches repeated multiplication for small n.
  - `exp` and `ln` are monotone, also across the boundaries of the range reduction.
  - `allocate`: Σ = total, each part within 1 of its exact share, permuting equal weights only moves the remainders.
  - `amortization`: Σ principal = P, last balance 0, interest ≥ 0 for r ≥ 0, rows equal `loanStep`.
  - `annuityPayment` decreases with n and increases with r.
  - `npv(irr(cf)) ≈ 0`.
  - `mulDiv` matches a BigInt reference exactly, for every mode.
  - Keyed draws: the same key gives the same value; any key part change gives an independent-looking value (χ² and serial-correlation smoke tests in `*.long.test.ts`); `uniform` ∈ [0, 1); `normalQuantile(normalCdf(x)) ≈ x`.
  - Purity: no input arrays are mutated.
  - Junk input never hangs: `irr` has an iteration cap, `isCents`/`isBp`/`isTransitionBp` never throw.
- **Lint.** The restricted-`Math` rule applies in `finance-math`, `economy-engine` and `life-engine`.
- **Mutation.** Stryker on `money.ts`, `interest.ts` and `real.ts`, target ≥ 80 %.

## 7. Open questions for the reviewers

1. **Doubles + own exp/ln (proposed) vs. fixed-point.** Any life-sim need for exact decimal behaviour beyond cents?
2. **Rate convention.** Per-period real fractions in the maths API, `Bp` only for storage and display: OK?
3. **Rounding defaults.** Interest and fees `half-even`; annuity payment `ceil`; tax `floor`? Or should each call site always pass a mode explicitly, with no defaults? I lean towards **no defaults** except on `annuityPayment`.
4. **Distributions for the life sim.** Is Student-t with integer df enough for fat tails, or do you need a GARCH-like volatility regime (which `markov.ts` could cover)?
5. **Inflation and real-value helpers** (`deflate(value, indexPath)`): here, or in each engine?
6. **Package name** `@wp/finance-math` (orchestrator's choice): fine.

## v1.1 additions (life-sim needs, 2026-10-18)

- **interest.ts**
  - `remainingBalance(P, r, n, k): Cents`: the balance after k of n level payments. It equals the amortisation row k.
  - `hazardPerPeriod(annualP, periodsPerYear): number` = 1 − (1 − p)^(1/n), computed as −expm1(ln1p(−p)/n).
  - `annuityDuePayment(P, r, n, mode)`: payments at the start of each period.
- **draw.ts**
  - `studentT(seed, df, ...key, { unitVariance?: boolean })`: with df > 2, scaled by sqrt((df − 2)/df).
  - `poissonCount(seed, lambda, ...key)` (inversion, capped).
  - `jump(seed, pJump, size: (u) => number, ...key)`: a Bernoulli trigger, then the size from a sub-key.
- **process.ts** (new; pure step functions, the state stays in the engine)
  - `ar1Step(x, mu, phi, sigma, eps)`.
  - `garchStep({ variance }, { omega, alpha, beta }, lastShock)` → `{ variance }`. It requires α + β < 1 and is validated.
  - `regimeParams` is not in this package: it combines with `markovStep` in each engine.
- **correlate.ts** (new)
  - `cholesky(m: number[][]): number[][] | undefined`. Doubles, n ≤ 16, undefined when the matrix is not positive definite.
  - `correlated(seed, L, ...key): number[]` (L · z with keyed z_i).
  - `oneFactor(beta, m, eps)` = β·m + sqrt(1 − β²)·ε.
