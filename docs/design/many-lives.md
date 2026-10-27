# Design: Many Lives — a life simulation about personal finances

Status: **Draft v0.3 — owner decisions of 2026-10-18 recorded (section 0, O1–O28).** Nothing implemented yet. Numbers marked *(verify)* are first estimates from memory and must be replaced by researched values with sources ([many-lives-sources.md](many-lives-sources.md)) before they enter the engine. Engine decision record: [ADR 0018 (proposed; number confirmed by the orchestrator)](../adr/0018-life-engine.md).

Scope:

- `packages/life-engine` (`@wp/life-engine`) — pure, deterministic life and finance simulation (no DOM).
- `packages/games/many-lives` (`@wp/game-many-lives`) — the game: start screen settings, view, texts.
- `e2e/games/many-lives.spec.ts`.

Owned by the life-sim workstream (ADR 0006 pattern, like ADR 0009/0014). Shared needs go to the orchestrator.

---

## 0. Owner decisions (2026-10-18)

| # | Decision |
|---|---|
| O1 | Name **Many Lives** (de: *Viele Leben*), id `many-lives`. |
| O2 | Time runs only when the player advances it; "fast-forward" runs **until the next event** (not until the next decision). |
| O3 | **Long and deep**: far more than 40 decisions; a life may take several hours, played over several days (closable and resumable at any moment). A player who does not look at everything can play faster (standing plans, sensible defaults). |
| O4 | **One life per game.** Finished lives are kept for comparison. |
| O5 | **Stock market with buying and selling**: at most 10 individual companies to choose from; the player sees the full range of outcomes even without investing (bankruptcy, multi-bagger, stagnation, market-like performance, crashes, the cost of panic selling). One **total-market ETF** over all 10 companies with lower volatility and performance comparable to a broad world index. **Fixed income** with returns mostly slightly below inflation. Speculation may feel like gambling as long as it is realistic; at the latest at the end the player must see whether it paid off. |
| O6 | **Cost of living grows with inflation, wages not always.** |
| O7 | The simulation must cover **many nuances**; many things happen statistically, each with low probability. |
| O8 | **Comparison of lives**: absolute and relative, not only money but also satisfaction, impact on the world and descendants. There is no single correct optimum. |
| O9 | **Fictionalised region profiles**, calibrated on real countries; the selection of starts covers the world and income levels broadly and is deliberately **not** population-weighted (section 3). Language and migration history matter. |
| O10 | The variance options for starts (random / percentile band / choose) are kept. |
| O11 | Deeper trade-offs: gates with alternative routes, lock-in effects, life-stage-dependent energy and preferences, women's and men's roles, part-time work for childcare, opaque real-estate markets, migration with visa rules (section 4–5). |
| O12 | Review dimensions extended by satisfaction, impact on the world and descendants (section 9). |
| O13 | Both modes ("understand other lives", "plan your own life") are wanted. |
| O14 | Visual style: warm paper/illustration look, self-drawn SVG. **The character is central; what matters to them (family and/or material things) is shown in the background**, comparable in layout to casual life-sim games, but without any payment, ads or grind mechanics and much more mature (section 11). |
| O15 | **Languages: develop in German and English first; translate into the other 14 locales at the end. Until then other locales fall back to English.** (Needs a shared-rule decision by the orchestrator, section 15.) |
| O16 | All other recommendations of the first proposal accepted: tone serious-warm with light everyday humour; severe content handled with care and a content setting; death drawn from life tables; dimension weights optional at start and comparable at the end; pensions and social security modelled in simplified form; sandbox with personal data local only. |
| O17 (Q1) | Engine tick: **one month**. |
| O18 (Q2) | Sex of the character: **random, woman or man** (for now). |
| O19 (Q3) | No ethnicity attribute; documented discrimination effects via origin, language and migration history; profiles describe wealth, not ethnicity. |
| O20 (Q4) | **Appearance as in real life:** face, skin tone, build etc. are given at birth (inherited from the parents, drawn from the profile's diverse population, never a single stereotype per profile); **hairstyle, clothing and accessories are chosen by the player within what the income allows**. Attractiveness stays an abstract value. |
| O21 (Q5) | Descriptive profile labels ("A large country in South Asia") with an open calibration note. |
| O22 (Q6) | Additional profiles: Latin America (Brazil: favela and middle class), Eastern Europe (Poland or Romania), Gulf (labour migrant family), Southeast Asia (Indonesia or Philippines, with remittances). |
| O23 (Q7) | Early death of the character possible from 16 with real hazard; childhood mortality not played; the "gentle" setting has neither child deaths nor early own death. |
| O24 (Q8) | Ecological footprint shown as information, not scored. |
| O25 (Q9) | MVP: two contrasting profiles (calibrated on Germany and India) with the full market and all core systems; further profiles step by step. |
| O26 (Q10) | Local currency per profile; comparisons in purchasing-power-adjusted units; **the relative change of purchasing power between profiles over the years (inflation differentials, exchange rates) is modelled and shown — important for migration planning** (section 5.13). |
| O27 (Q11) | Later: a new game may start from a descendant's start (never automatic). |
| O28 (Q12) | **Early release in English and German**, marked **"Work in progress"**; the other 14 locales follow afterwards (owner, confirmed 2026-10-21: "Früh auf englisch und deutsch und dann die anderen sprachen"). The technical route (registration for en/de, language fallback, WIP marker) is proposed in the MVP PR (section 15.1). |

---

## 1. Goals, non-goals and honesty

Goals, in priority order:

1. **Understanding, not winning.** Show how start conditions, decisions and luck interact over a whole life, and what that means for money, health, relationships, satisfaction and meaning.
2. **Trade-offs without a correct answer.** Every important decision exchanges money, time, energy, security, relationships, health, freedom or meaning against each other. Which life is "good" depends on the player's values.
3. **Grounded in data.** Core relations are calibrated on cited statistics and research; every parameter carries source, year, region and uncertainty. Simplifications are labelled in the game ("Simplified model; based on …").
4. **Upward mobility is possible from every start** — as a measurable probability that the player's choices change, never as a certainty, and never framed as "the poor just did not try hard enough" (section 14.3).
5. **Respect.** Birth circumstances shape probabilities, never fates. No caricatures of countries, classes, genders or groups. Illness is never punishment; support options are always shown.

Non-goals: real money, financial/medical/psychological advice, real company/brand/person names, meta-progression, streaks, daily rewards, artificial waiting, real-time timers, ads, purchases, dynasty grinding.

Honesty texts (en/de, shown on the start screen, in the "How the model works" panel and in the sandbox): "Practice and understanding. This is not financial, medical or psychological advice. Simplified model based on …".

---

## 2. Life structure and time

- **Engine tick: one month.** Salaries, rent, markets, health and relationships update monthly; crashes can happen inside a year, which makes panic selling and liquidity real. *(Open: Q1 — month vs. quarter.)*
- **The player acts at any time** between ticks: buy/sell, apply for jobs, change the budget, date, move, invest time in health, etc. Advancing is always a deliberate press:
  - **Next month**,
  - **Next year**,
  - **Until the next event** (O2) — stops at the first event, decision deadline, birthday milestone or market move beyond a threshold the player set (e.g. "stop if my portfolio falls by more than 15 %").
- **Standing plans** (budget split, savings plan, working hours, time for partner/children/health/friends, rebalancing rule) apply every month until changed, so a player can ignore whole areas and still live a coherent life (O3 "play faster").
- **Life phases** shape what is offered, not the clock:

| Phase | Age | Play |
|---|---|---|
| Childhood | 0–11 | Compressed into a few scenes; parents decide; the player chooses interests and effort in a few moments; outcomes are drawn (school recommendation, health, family events). |
| Youth | 12–17 | School track and grades, first job, friends, first relationships, family conflicts, migration of the family possible. |
| Early adulthood | 18–29 | Education/training, first jobs, moving out, debts, partner, migration, first investments. |
| Mid-life | 30–54 | Career, family, home, health trends, care for parents, separation, meaning questions. |
| Late working life | 55–67 *(region profile)* | Retirement planning, health, grandchildren, early retirement. |
| Retirement | 67+ | Drawdown, health, care, legacy, review. |

- **Length:** ~16–17 playable years × 12 months; a typical playthrough has **several hundred decisions** (many small, dozens large) and takes several hours *(calibrate in play-tests)*.
- **End:** death drawn from the profile's life table, modulated by health, behaviour and socio-economic status (O16). The life review follows.
- **Closable at any moment:** state is saved after every action and every tick; nothing depends on timers.

---

## 3. Start generator and region profiles

### 3.1 Region profiles (fictionalised, calibrated)

A **region profile** is a data set: income and wealth distributions, prices and cost of living, education system (tracks, gates, fees), labour market (occupations, unemployment, informality), taxes and social security (simplified), pensions, health system and life tables, housing market (prices, rents, mortgage rules, transaction costs), family law (marriage, divorce, custody, child support — simplified), migration rules (visa types, quotas, processing times), language(s), and macro behaviour (inflation regime, recession frequency).

Profiles are **fictionalised**: generic names and no national symbols, politics or stereotypes; the game shows openly which country each profile is calibrated on and which sources it uses (*Open: Q5 — naming*).

Starts the owner asked for (calibration country → household situations), deliberately **not** population-weighted (O9). Labels are neutral and descriptive:

| Profile (calibrated on) | Household situations |
|---|---|
| South Asia (India) | Homeless/street-dwelling family in a large city; urban upper middle class (top ~10 %); very wealthy family (top ~1 %) |
| East Asia (China) | Rural family (household registration restricts urban services *(verify)*); urban family |
| North America (USA) | Family in a large coastal metropolis; family in a rural region with declining industry |
| Central Europe (Germany) | Family receiving basic income support; middle-class family (skilled trades / office) |
| Southern Europe (Spain) | Family working in the seasonal tourism sector |
| North Africa (Egypt) | Middle-class family |
| Southern Africa (South Africa) | Family in an informal settlement; wealthy family *(see Q3 on how to handle ethnicity)* |
| West Africa (Mali) | Average household (largely informal and agricultural economy) |
| East Asia (Japan) | Average middle-class family |
| Latin America (Brazil) | Family in an informal urban settlement; middle-class family (O22) |
| Eastern Europe (Poland or Romania) | Average household, with labour migration of relatives (O22) |
| Gulf (labour migration) | Family of a labour migrant (O22) |
| Southeast Asia (Indonesia or Philippines) | Household relying on remittances (O22) |

**Honest limit:** personal-finance tools (index funds, mortgages, pensions) work very differently in low-income and largely informal economies (access, trust, inflation, savings groups, remittances, land rights). Those profiles need extra mechanics, not just other numbers (section 5.13).

### 3.2 Family and person

Sampled **jointly** (Gaussian copula over the profile's marginal distributions) so that combinations are realistic without being packages:

- parents: education, occupation, income percentile, wealth, health, relationship stability, number of siblings, household language(s), migration history (none / internal / international, generation), urban/rural, region within the profile;
- the person: sex (random woman or man, O18), birth order, health at birth, temperament (a few traits that shift probabilities a little: conscientiousness, openness, extraversion, emotional stability — Big Five *(verify effect sizes)*), talents (cognitive, social, practical, creative — broad and probabilistic), appearance (given at birth, inherited, O20) and attractiveness (section 5.11).

**Variance options** on the start screen (O10): random start · start from a band (e.g. "bottom 20 % of the profile") · choose profile and household.

### 3.3 Implemented: South Asia (India) profile, first slice (E4a)

`PROFILE_IN` (`packages/life-engine/src/profiles/in.ts`) and `EVENTS_IN` (`content/in.ts`). The start setting lists each region with a random household and each household (`random`, `de`, `basic-support`, `middle`, `in`, `street`, `upper-middle`, `wealthy`). Household ids are unique across profiles, so saves from the Germany-only version stay valid. Money is in rupees at 2026 prices; the economy replays India's CPI years. There is no real-wage series yet, so wages follow prices (IER 2024 reports regular salaries roughly flat in real terms 2019–24).

| Area | Model | Basis |
|---|---|---|
| Households | Street (income percentile 1), upper middle (92), wealthy (99) | Census 2011 houseless; WID 2022-23 thresholds |
| Pay | No qualification: casual work, daily wage × 16 days. Higher secondary or diploma: secondary-level salary s = urban average / (1 − g + g·p). Degree: p·s. Postgraduate: 1.3·p·s | PLFS 2023-24; graduate premium p = 2.25 (IER 2024); g and the postgraduate factor are **assumptions** |
| Pay by sex | Raw ratios: regular women/men to the average; casual women to the average | PLFS 2023-24 |
| Age profile | Rising to 1.5× from 22 to 47, then flat; normalised to mean 1 over 22–60 | IER 2024 (qualitative); the ratio is an **assumption** |
| Tax | New regime FY 2025-26: standard deduction, slabs, zero tax up to ₹12 lakh with marginal relief, 4 % cess. Provident fund is left out (it is saving); so are surcharges | Statutory |
| Living costs | Per-person spending (HCES 2023-24) turned into a single budget with the OECD scale for an assumed four-person household. Frugal = rural level, average = urban, comfortable = urban × middle-40 average/threshold. At the parents' home: half the urban per-person spending | HCES; household size is an **assumption** |
| Safety net | No cash minimum income (rations are in kind), no unemployment insurance, no student support, no child benefit | — |
| Children | 0.3 single budgets plus school spending weighted by the government-school share; child support half the child's cost (no statutory minimum; **assumption**) | CMS:E 2025 |
| Labour market | Monthly job finding 10 % (no degree) or 5 % (graduates); job loss from the steady state with the PLFS unemployment rates by education (4.4 %, 8.6 %, 13 %). Regular jobs come with social security and employer health cover in 46.6 % of cases | PLFS 2023-24; the job-finding rates are **assumptions** |
| Education | Government or private school. A 14.1 % yearly chance of pressure to leave school at 14–15. Streams after grade 10. Coaching. Elite seat 1.2 % on average (coaching assumed ×3), one drop year. Public college 3 years, private 4 years, vocational course 2 years, master 2 years | UDISE+, CMS:E, JEE numbers; the coaching odds ratio is an **assumption** |
| Housing | Street → a rented room once there is regular work; otherwise moving out from 21 | — |
| Health | Catastrophic hospital bill 16.5 % per household-year; bill = 2 months of average living costs (start prices, scaled by inflation) unless the job brings health cover | NSS 75th round; the bill size is an **assumption** |
| Life review | Income (pre-tax, per adult) and wealth (per adult) percentiles from WID | WID 2022-23 |

The assumptions are parameters with the source `model-assumption` and status `unverified`. `checkParams` lists them, and they must be researched or confirmed before the release. **Not yet in the slice:** family life (marriage, children, maternity benefit), wealth transfers of wealthy families (gifts, family business, inheritance), tuition and coaching costs as money (the parents carry them, shown as strain), medical entrance exams, rural lives, and a sensitivity review of the texts.

---

## 4. Decisions and trade-off design

### 4.1 Three scarce resources

- **Money** (cash flow and wealth),
- **Time** (hours per week: work, commute, learning, partner, children, friends, health, rest, volunteering),
- **Energy** (monthly capacity; depends on physical and mental health, sleep, stress, age-dependent recovery, meaning of work; low energy limits what can be done and raises health risks).

Almost every decision trades these against each other and against the review dimensions (section 9).

### 4.2 Gates with alternative routes (O11)

Gates are probabilistic and rarely final. Example education gate:

```text
Wants university ─► school recommendation (teacher; depends on grades, parents' education*, language, chance)
                    ├─ granted ─► final exam grade ─► admission (grade threshold / exam / fees)
                    └─ refused ─► alternatives:
                         · bridging school / second-chance route (+1–3 years, costs time and money, energy)
                         · vocational training first, then university via work experience
                         · entrance exam route
                         · study abroad (fees, visa, language)
                         · give up the goal (frees time and money)
*  social gradient of recommendations, sourced (verify, e.g. German school-track transitions)
```

The same pattern applies to jobs (rejection → retrain, other city, other field, network), visas (refusal/delay → wait, appeal, other country, local plan), mortgages (refusal → larger down payment, cheaper home, co-signer), promotions and loans.

### 4.3 Decision catalogue (non-exhaustive)

| Area | Decisions |
|---|---|
| Education | track, effort, tutoring, subject/field, training vs. study, part-time study, loans/scholarships, drop out, retrain later, languages |
| Work | apply (choose offers by pay, security, hours, commute, meaning, team), negotiate, change job, quit, part-time, side job, self-employment, overtime, decline promotion, early retirement |
| Money | monthly budget (housing, food, transport, leisure, giving), emergency fund, debt repayment, savings plan, buy/sell shares, ETF, fixed income, rebalancing rule, insurance (health, disability, liability, life) |
| Housing | rent/buy, location (price vs. commute vs. schools), viewing and inspection, offer price, mortgage terms, renovation, sell, let out |
| Relationships | date, commit, move in, marry, invest time, couple counselling, separate, custody arrangement, friendships, contact with parents/siblings, care for parents |
| Children | try for children (fertility depends on age), adoption, parental leave split, part-time, childcare, schools, support for adult children |
| Health | exercise, sleep, diet (abstract), check-ups, therapy/support, sick leave, rehabilitation, workload reduction |
| Migration | target country, visa type, language course, credential recognition, wait/appeal/give up, return, remittances |
| Meaning | volunteering, donations, career change towards meaning, mentoring, civic engagement, sabbatical |
| Events | each event offers 2–4 responses with visible costs in money/time/energy and uncertain effects |

### 4.4 Lock-in effects (O11)

Decisions create commitments that later constrain choices, with real numbers behind them:

- a home bought together while the relationship becomes unhappy: separation means selling (transaction costs, possible loss, negative equity) or one partner buying the other out (needs a new mortgage that may be refused);
- a mortgage with fixed payments limits switching to a lower-paid but more meaningful job;
- custody arrangements tie the place of residence;
- a visa tied to an employer limits job changes;
- specialised careers have higher pay but fewer outside options;
- a high lifestyle (car financing, private schools) raises the income needed ("lifestyle creep").

### 4.5 Preferences change over life (O11)

Values (importance of money, security, family, freedom, status, meaning) and energy have an age profile plus event-driven shifts (parenthood, illness, loss, burnout, windfall). The owner's assumption — the young cope better with high workloads and are more motivated; older people are more disillusioned — is **to be checked against data** *(verify; current impression: mixed evidence — recovery capacity declines with age, but job satisfaction tends to rise with age and burnout is reported more often by younger workers in several surveys; life satisfaction may follow a contested U-shape)*. The model will follow the evidence, not the assumption.

### 4.6 Speculation and its truth (O5)

Trading may feel exciting, as in reality, but:

- results are realistic (most single stocks do worse than the market over long horizons; a few multiply) *(verify: Bessembinder 2018)*;
- the game shows, monthly and at the end, a **counterfactual**: "with the same money in the ETF / in fixed income / not invested you would have …", and the cost of panic sales ("sold at −35 %, the market recovered within N months");
- no ticker animations, sounds, flashing or near-miss effects.

---

## 5. Models (life engine)

All parameters live in a typed data file with source, year, region and uncertainty (section 13). *(verify)* marks values to be researched.

### 5.1 Macro environment per profile

- Business cycle: Markov regimes (expansion / recession / crisis) with profile-specific transition probabilities.
- Inflation: AR(1) per regime, rare high-inflation episodes (stronger in some profiles, e.g. calibrated on Egypt).
- Interest rates: policy-rate proxy following inflation with lag; drives savings rates, mortgage rates, bond prices.
- Housing cycle: regional price index with momentum and occasional busts.
- Correlations: recessions raise unemployment, lower equity returns, slow wage growth, sometimes lower house prices.
- **Currencies and purchasing power between profiles (O26):** each profile has its own currency; nominal exchange rates follow inflation differentials in the long run (relative PPP) with persistent real-exchange-rate deviations and occasional devaluations *(verify: Penn World Table, World Bank PPP / ICP)*. The game shows, per profile pair, how purchasing power changed over the years — for comparisons between lives and for migration planning (savings and remittances lose or gain value).

### 5.2 Prices and cost of living (O6)

- Basket per profile (housing, food, transport, health, education, childcare, leisure) indexed to inflation, with category-specific drift (e.g. rents and education can rise faster than CPI *(verify)*).
- **Wages follow with lag and not always** (O6): nominal wage growth = sector/occupation drift + partial inflation pass-through + individual raises; real wages can stagnate for years; collective agreements in some profiles.
- Lifestyle level chosen by the player (frugal … generous) with satisfaction effects that adapt over time (hedonic adaptation *(verify)*).

### 5.3 Education

- School tracks and gates per profile (recommendations, exams, grades); grade = f(talent, effort time, energy, support at home, school quality, language match, chance).
- Social gradient of transitions sourced per profile *(verify; e.g. ≈ 79 vs. 27 of 100 children start university by parents' degree in Germany, DZHW 2020)*.
- Costs: fees, materials, forgone earnings; loans and scholarships per profile.
- Credentials and skills: credentials open gates; skills raise productivity and wages; both depreciate if unused.

### 5.4 Labour market and career

- **Occupation families** (~30–40, calibrated per profile): entry requirements, wage distribution and ladder, unemployment risk, automation/structural risk, physical strain, repetitiveness, meaning score, hours, flexibility (part-time possible), informality.
- **Wage model** (Mincer-type): log wage = occupation × region × credentials + experience (concave) + persistent individual effect + AR(1) shock + bargaining.
- **Job search as a process**: applications → callbacks (probability depends on credentials, experience, network, local unemployment, gaps in CV, age; and documented discrimination effects, e.g. callback gaps by name/origin from field experiments *(verify; Q3)*) → offers with trade-offs (pay, security, commute, hours, meaning, team climate) → decision.
- **Events**: raise, promotion (with more hours/stress), reorganisation, layoff (higher in recessions), plant closure, bad boss, burnout risk, job-change regret ("higher pay, less security, the team does not fit"), wage scarring after unemployment *(verify)*.
- **Self-employment**: a small business with realistic failure rates *(verify)*; kept simple to avoid overlap with the business tycoon.
- **Part-time** for childcare or health with long-run wage and pension effects (section 5.10).

### 5.5 Household finances

- Monthly cash flow: net income (after simplified taxes and social contributions) − cost of living − debt service − chosen spending ± transfers.
- Accounts: current account (overdraft with high interest), emergency fund, consumer credit, student loans, mortgage; arrears → reminders, fees, credit-score-like access limits; formal insolvency simplified per profile.
- Behavioural nudges are shown, not imposed: "You have no emergency fund" etc.

### 5.6 Capital market (O5)

**Universe:** exactly 10 fictional listed companies (invented names, sectors, short descriptions), plus one total-market ETF and fixed-income products. Companies that go bankrupt or are taken over are replaced by a new listing, so the universe stays at 10 and the player sees survivorship.

**Return model (monthly):**

```text
r_i,t = β_i · m_t + ε_i,t − mean_w(ε_t)          (idiosyncratic parts sum to 0 under the index weights)
m_t   = market factor: regime-dependent mean, Student-t shocks (fat tails), volatility clustering
ε_i,t = company-specific: lognormal-ish drift and volatility by company type, plus jumps
        (earnings surprise, scandal, breakthrough), and a bankruptcy hazard
```

- Subtracting the weighted mean of ε makes the **ETF exactly the market factor** (cap-weighted, low fee), so it is consistent with the 10 stocks and calibrated to a broad world index: real return ≈ 5 %/year, volatility ≈ 15–18 %/year, maximum drawdowns of ~50 % a few times per century *(verify: DMS yearbook, MSCI World history)*.
- **Company archetypes are drawn, not shown**: future multi-bagger, steady compounder, market-like, stagnating, cyclical, decliner, bankruptcy — so that over one life the player typically sees several of these outcomes (O5) even without investing.
- Skewness: most single stocks underperform the market; a few deliver most of the gains *(verify)*.
- Dividends, splits (cosmetic), fees per trade and per year, capital-gains and dividend tax per profile, spreads.
- **Panic selling**: the player's own decision. The game shows drawdown, the history of past recoveries and the counterfactual (section 4.6). Stress from losses lowers mood/energy a little (honest: watching losses hurts) *(verify loss aversion magnitudes)*.

**Fixed income:** savings account, term deposit (1–10 years, early-exit penalty), government-bond fund; nominal returns typically slightly **below** inflation (O5) — note: this holds for many recent periods and profiles, not universally (e.g. periods of positive real rates; deeply negative real rates in high-inflation profiles) *(verify per profile)*.

**Access differs by profile** (brokerage access, minimums, informal savings groups, gold/land as stores of value, currency risk) *(verify)*.

### 5.7 Real estate (O11)

- Listings with an **asking price**; the **true market value** is hidden. Transaction prices scatter around the market value (market opacity; lognormal noise of ~±10 % *(verify)*). Paid inspection or appraisal narrows the uncertainty; bidding against other buyers in hot markets.
- Transaction costs per profile (taxes, notary, agent; ≈ 10 % in the German calibration *(verify)*); selling takes months; forced sales at a discount.
- Maintenance: scheduled (roof, heating, facade on life cycles) and surprising (burst pipe, mould, structural damage); ≈ 1–1.5 % of value per year on average *(verify)*; condition of the property as a state.
- Mortgage: loan-to-value and income limits per profile, fixed/variable rates, rate resets, refinancing, foreclosure.
- Renting out: rent, vacancy, tenant problems, rent-control rules per profile (simplified).
- Regional differences: price levels and growth by city/rural region; ownership culture and rules per profile.

### 5.8 Taxes, social security and pensions

- Simplified, generic per profile: progressive income tax, social contributions, capital-gains tax, property tax, child benefits, unemployment benefits, basic income support, health insurance model (public/private/none), disability benefits, public pension (pay-as-you-go points), occupational and private pensions, statutory retirement age, early retirement with deductions.
- Always labelled "simplified" and region-specific.

### 5.9 Relationships

- Social network: family (parents, siblings, children), friends, colleagues; each tie has closeness that needs time.
- Partner search: meeting chances depend on age, social activity, location, attractiveness, education; partners have their own values, income, wishes (children, location) and health.
- Relationship satisfaction as a stock: time together, shared values, stress (money, work, children), conflict handling, health; events: crisis, affair, reconciliation, counselling.
- Marriage/cohabitation; **separation and divorce**: asset split, child custody, child support and alimony per profile (simplified family law), housing lock-in (section 4.4), effects on children and wellbeing *(verify)*.
- Ageing parents: care needs (time, money, energy), inheritance, death.

### 5.10 Children and gender roles (O11)

- Fertility by age (both partners), pregnancy risks, adoption.
- Costs by age of the child and profile; childcare availability and price; parental leave rules per profile.
- **The player can be a woman or a man** (O11, Q2); outcomes differ where data show it, transparently explained: child penalty in earnings *(verify; e.g. Kleven et al. 2019 cross-country estimates)*, part-time shares, pension gaps, gender pay gap, health differences, violence risks are **not** simulated as events (sensitivity). Division of care work is a joint decision with the partner, with consequences for both careers.
- Children's outcomes (education, health, wellbeing) depend probabilistically on time, money, stability and chance — feeding the descendants dimension (section 9).

### 5.11 Appearance and attractiveness (O11)

- An abstract attractiveness value (not body shape) with an age profile and influence of health and grooming spending; small effects on dating chances and a small wage premium *(verify; e.g. Hamermesh & Biddle 1994)*. Never shown as a judgement of the character; texts stay respectful.

### 5.12 Health and wellbeing

- **Physical health** and **mental health** as stocks; risk factors: age, genetics (family history, probabilistic), behaviour (exercise, sleep, diet, substance use — abstract), work strain, stress, financial strain, loneliness; protective factors: relationships, exercise, meaning, care access.
- Conditions with low probabilities (O7): accidents (some with reduced work capacity), chronic diseases, depression, anxiety, burnout, cancer, cardiovascular events, infections — each with treatment options, costs per health system, recovery paths and **support options**. Mental illness is never framed as weakness; a neutral note says that real help exists.
- **Mortality**: profile life table × health × socio-economic gradient *(verify; e.g. ≈ 8 years for men and ≈ 4 years for women between the lowest and highest income groups in Germany, Lampert et al. 2019)*.
- **Wellbeing** in two layers: life satisfaction (evaluation) and mood (experience). Effects: log income with diminishing returns *(verify: Killingsworth 2021; Killingsworth, Kahneman & Mellers 2023)*; strong effects of relationships, health, unemployment beyond income loss *(verify)*; partial adaptation; meaning.
- **Meaning crises** (O11): repetitive work, early retirement without purpose, empty nest, loss — events that let the player re-orient (volunteering, new field, family, community).

### 5.13 Migration (O11)

- Moves within a profile (city/rural) and between profiles.
- Visa types per destination: study, skilled work (job offer, points, salary thresholds), family reunification, working holiday; later possibly humanitarian protection (only after a sensitivity review).
- Each application: requirements (language level, credentials, money, job offer), costs, processing time (distribution), refusal probability, delays. On refusal or delay the player decides: wait, reapply, appeal, invest more (language, credential recognition), try another country, build a local plan.
- After arrival: credential recognition (often partial; de-skilling *(verify)*), language learning, network loss and homesickness, remittances, citizenship timelines, return migration.
- Low-income/informal profiles get mechanics of their own: informal work, savings groups, remittances, land, family obligations *(verify)*.

### 5.14 Events (O7)

- Several hundred events, each with a base probability from data where available, conditioned on state (age, job, health, region, relationships), many with follow-ups (chains). Examples: accident with reduced work capacity, divorce, custody dispute, death of a parent or child (content setting), own early death, illness, layoff, promotion, raise, job change regret, inheritance, theft, fraud attempt, car breakdown, flood/storm (region), pandemic-like shock (generic, not a real one), friendship ending, reunion, unexpected pregnancy, care need of a parent, house damage, market crash.
- No lottery and no "jackpot" events; windfalls are realistic (inheritance, bonus, tax refund).

---

## 6. Modes (O13)

- **Live a life** (main mode).
- **Understand other lives**: (1) *same choices, other start* — the player's strategy, abstracted as a policy, is replayed from many other starts; (2) *same start, other luck* — the same start and policy with other seeds; (3) curated starts with a short introduction (sensitivity-reviewed).
- **Plan your own life** (sandbox): enter age, income, wealth, region profile and plans; Monte-Carlo fan chart (P10/P50/P90) of wealth, income and retirement; stays on the device; delete button; "not financial advice".

---

## 7. Saves and the library

- State: plain JSON (ids, numbers, bounded histories; monthly history compacted to yearly summaries after one year to bound the size), PRNG state inside; `isValidState` never throws; `stateVersion` with migrations.
- Finished lives: compact summaries in the game library (ADR 0012) for comparison; bounded by `LIBRARY_LIMITS` (50 items, 64 KiB each) — enough for summaries, not for full histories.

---

## 8. Start screen (ADR 0017)

Declared settings: mode (life / other lives / plan), start (random / band / choose), profile and household (when chosen), content intensity (show / gentle / off for severe events), end (life table / review at 85), optional value weights. `settingsOf(state)` implemented. Difficulty: none (all starts are "difficulty").

---

## 9. Scoring and life review (O8, O12)

No single score. Dimensions (each with icon, number and text, never colour only):

| Dimension | Measured by (sketch) |
|---|---|
| Wealth | net worth and lifetime consumption, in purchasing-power-adjusted terms (absolute) and as percentile within the profile and change versus the start (relative) |
| Security | months of buffer, income volatility, insurance cover, debt stress, periods of hardship |
| Health | healthy life years, physical and mental health over time |
| Relationships | closeness of ties over time, partnership quality, loneliness periods |
| Freedom | choice over time (hours, work, place), financial independence |
| Meaning | meaningful work, volunteering, purpose events |
| Life satisfaction | integrated life satisfaction ("satisfied years") and mood |
| Impact on the world | volunteering, donations, work in socially valuable roles, mentoring, civic engagement *(Open: Q8 — include the ecological footprint?)* |
| Descendants | children's and grandchildren's expected start and wellbeing, inheritance, education, relationships with them |

- **Weights:** optional at the start; at the end the review shows "by the values you chose" and "by your values now".
- **Comparisons (O8):** absolute (purchasing-power-adjusted wealth, satisfied years, healthy years) and relative (percentile within the profile, change against own start, against the profile's median life, against other finished lives in the library).
- **Decomposition:** what came from the start, from decisions and from luck (counterfactual runs with the same start and another seed, and with a reference policy).
- **Review:** a timeline of turning points, the counterfactuals of big money decisions (section 4.6), and a calm closing text without a grade.

---

## 10. Content and sensitivity

- Content setting for severe events (death of a child or parent, severe illness, early death): show / gentle (mentioned without detail; no child death) / off. Suicide is not an event. Violence is not simulated as an event.
- Sensitivity review (independent agent with checklist) for every profile, household description and event text; no caricatures; regional realities described with dignity and sourced.
- Help note (neutral, generic per profile) where mental health or crisis appears.

---

## 11. UI and visual style (O14)

Portrait-first layout (works at 360 px), landscape adds side panels:

```text
┌──────────────────────────────────────────────┐
│ status bar: money · net per month · mood ·    │
│ health · energy · age / date                  │
├──────────────────────────────────────────────┤
│                                              │
│   SCENE: the character in the centre;         │
│   in the background what matters to them:     │
│   home, partner, children, friends, workplace,│
│   car, garden, books, community … drawn from  │
│   state and values (self-drawn SVG layers)    │
│                                              │
├──────────────────────────────────────────────┤
│ time: [next month] [next year] [to next event]│
│ current event card / notifications            │
├──────────────────────────────────────────────┤
│ dock: Work · Learn · Money · Home · People ·  │
│ Health · Life · Move                          │
└──────────────────────────────────────────────┘
```

- Panels (sheets) per area with lists of offers and actions; each action shows its costs in money / time / energy and its uncertain effects.
- Charts (portfolio, net worth, satisfaction over life) as self-drawn SVG with table alternatives; the life timeline as a band.
- Warm paper and illustration look; the character is drawn as an illustrated figure — face, skin tone and build given at birth, hairstyle, clothing and accessories chosen within the budget (O20) — ageing visibly over life; background layers change with life (student room → flat → house; partner and children appear; objects of value).
- Difference from casual life sims: no tier grind, no ads or purchases, no real-time clock, numbers sourced, trade-offs explicit, a mature tone.

---

## 12. Accessibility

Text-first structure, no time pressure, `aria-live` monthly summaries, table alternative for every chart, numbers via `Intl`, 44 px targets, keyboard/touch/pointer, RTL-safe CSS, reduced motion, content setting (section 10).

---

## 13. Data and research plan

See [many-lives-sources.md](many-lives-sources.md). Every parameter: `{ value, unit, sourceId, year, region, uncertainty, note }`; aggregated figures only (no datasets shipped); license review in `docs/third-party.md`; calibration tests compare simulated statistics with the targets (section 14).

---

## 14. Architecture, tests and balance

### 14.1 Split

```text
packages/life-engine          pure TS, depends on @wp/game-core only
  params/ (per profile, typed, sourced) · model/ (macro, market, labour, household,
  housing, family, health, wellbeing, migration, events) · step(state, actions, rng)
  · policies/ (for tournaments) · tournament runner · deterministic math
packages/games/many-lives     metadata, messages (en/de first), content/<locale> (ADR 0011),
                              view (SVG scene, panels, charts), index
```

Integer cents for money; own deterministic `exp`/`log` approximations because `Math.exp/log/pow` are implementation-defined in ECMAScript (cross-browser reproducibility of seeds).

### 14.2 Tests

- Unit and property tests (fast-check): money conservation (no money from nothing), determinism, `isValidState` never throws, monotonicity (e.g. more saving never lowers wealth before consumption), ETF equals market factor.
- **Calibration tests** (`*.long.test.ts`): stylised facts as assertions with tolerance bands from the sources (education premiums, unemployment rates, equity return and drawdown frequencies, inflation, life expectancy gradients, divorce rates, child penalty).
- Contract (`runGameContract`), e2e (`startGame`, `expectResumeAfterReload`), mutation tests on the engine.

### 14.3 Tournament (mobility and balance)

- Many seeded lives × simple policies (frugal saver, consumer, education first, ETF autopilot, home owner, stock picker, family first, migrant, balanced) × every profile and household.
- Metrics per start: probability of moving up at least one quintile within the profile, satisfied years, healthy years, descendants' start.
- **Variance decomposition** (start / policy / luck); target band for the share explained by decisions *(owner accepted recommendation: decisions ≈ 30–40 %, start ≈ 30 %, luck the rest — to be checked against data where possible)*.
- Requirement: from every start at least one policy gives a meaningful probability of moving up — and the review explains structural barriers honestly instead of implying lack of effort.

---

## 15. Shared needs (for the orchestrator)

1. **Languages (O15)** — orchestrator answer (2026-10-18): development in en/de uses `runGameContract(module, { locales: ['en', 'de'] })`, which requires completeness only for the listed locales. It is allowed only while the game is **unregistered**; phases can still be merged into `main` unregistered (like Poker and Skat earlier). The orchestrator registers and releases the game only once all 16 locales are complete, and the option then leaves the contract test. Consequence: no player sees English fallback; the final translation is its own phase before the release PR. **Superseded for the release by O28 (2026-10-21):** the MVP is released early in en/de with a "Work in progress" marker; the technical route for the other locales (fallback, catalogue, marker) is proposed in the MVP PR and coordinated with the orchestrator.
2. **ADR number**: 0018 confirmed for the life engine (the tycoon gets 0019).
3. **Shared finance maths**: no dependency on the economy engine. Orchestrator decision (2026-10-18): the economy workstream drafts `@wp/finance-math` (ADR 0020: cents and basis points, fixed-point pow/exp/log, annuity/NPV/compound growth, stateless keyed seeded draws with normal and fat-tailed distributions); this workstream reviews the API and has sent its needs (Student-t, lognormal, monthly hazards, jumps, regime switching, AR(1), volatility clustering, small correlated draws, mortgage maths, documented accuracy). The life engine uses it once merged instead of its own deterministic maths.
4. Library size limits (64 KiB per item) are sufficient for life summaries; no change needed for now.

---

## 16. Open questions (to the owner, with recommendations)

Answered by the owner on 2026-10-18 (O17–O28 in section 0). Kept for reference.

| # | Question | Recommendation |
|---|---|---|
| Q1 | Engine tick: month or quarter? | Month |
| Q2 | Sex of the character: chosen or random; non-binary option? | Choice (woman / man / random); differences only where data show them, explained |
| Q3 | Ethnicity and discrimination | No explicit ethnicity attribute; documented discrimination effects modelled via origin, language and migration history; profiles calibrated on South Africa describe wealth, not ethnicity |
| Q4 | Appearance of the character | Freely chosen by the player, independent of the profile (no stereotypes); a random default |
| Q5 | Naming of profiles | Descriptive region labels ("A large country in South Asia") with open calibration note |
| Q6 | Additional profiles | Brazil, Eastern Europe, Gulf labour migrants, Southeast Asia (later phases) |
| Q7 | Early death of the player character | Possible from 16 with real hazard; childhood mortality not played; "gentle" setting avoids it |
| Q8 | Ecological footprint in "impact on the world" | Show as information, not scored |
| Q9 | MVP scope | Two contrasting profiles first (Germany- and India-calibrated) with full market and core systems |
| Q10 | Currency | Local currency per profile; comparisons in purchasing-power-adjusted units |
| Q11 | Continue as one's child | Later: a new game may start from a descendant's start (never automatic) |
| Q12 | Release before translation | Decided: early en/de release with "Work in progress" (O28) |
