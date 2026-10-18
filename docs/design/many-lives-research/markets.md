# Many Lives: capital-market and macro calibration (research notes)

Status: 2026-10-18. "VERIFIED" means I read the figure in the source itself or worked it out from the primary data. "SECONDARY" means the figure comes from a summary of the source and I did not see the original. **UNVERIFIED** means the figure is from memory or could not be checked. The web-search budget ran out during the session (limit reached), so several legal/fee items below are UNVERIFIED and should be re-checked before they become game parameters.

Own computations (one-off analysis scripts, not kept in the repository) used:
- World Bank WDI `FP.CPI.TOTL.ZG` (CPI inflation) and `FR.INR.DPST` (deposit rate). License: CC BY 4.0.
- FRED/BIS real residential property prices `Q??R628BIS`. License: BIS terms of use, which allow reuse with citation.
- FRED/OECD long-term yields (`IRLTLT01DEA156N`, `INDIRLTLT01STM`) and German short rate (`IRSTCI01DEA156N`). License: OECD terms, attribution required.
- Kenneth French Data Library (US market 1926–2026, Developed markets 1990–2026). No formal license; free academic use with citation, and redistribution of the raw data is unclear. Use derived statistics only.

---

## 1. World equities: return, volatility, tails

| Item | Value | Period / region | Band | Source (license) | Status |
|---|---|---|---|---|---|
| World equity real return | ≈5% p.a. (geometric) | 1900–2002, 16 countries | country range 2.5–7.6% real; SD 17–32% | Dimson-Marsh-Staunton, *Triumph of the Optimists* / FAJ 2004 (copyright, cite only) | SECONDARY |
| World equity real, latest Yearbook | ≈5.0–5.3% p.a.; world bonds ≈1.7%; bills ≈0.8%; world real SD ≈17% | 1900–2024 | ±0.5 pp | UBS Global Investment Returns Yearbook 2025 (proprietary; summary free) | **UNVERIFIED** (exact figure not in the press release) |
| Global stocks in the 21st century | 3.5% p.a. real; 4.3% premium over cash | 2000–2024 | – | UBS press release 4 Mar 2025 | VERIFIED |
| US equities | 6.6% real, 9.7% nominal p.a.; real SD 19.9% | 1900–2023 | – | UBS Yearbook summaries | SECONDARY |
| MSCI World (USD gross) | 8.94% p.a. nominal since 30 Jun 1994; 10-yr SD ≈14.9% | to Apr 2026 | – | MSCI factsheet (proprietary, factsheet is free to read) | SECONDARY |
| MSCI World max drawdown | −57.8% (Oct 2007 – Mar 2009) | since Dec 1994 | – | MSCI factsheet Nov 2025 | SECONDARY |
| Developed-market index (own calc.) | 8.6% p.a. nominal USD, annual vol 15.0%, monthly skew −0.65, **kurtosis 4.4** (excess 1.4), max DD −54%; drawdowns >20%: 5, >30%: 2, >50%: 1 in 36 yrs; worst month −19.4%; 7 months below −10% | Jul 1990 – Aug 2026 | – | Ken French Data Library | VERIFIED (computed) |
| US market (own calc.) | 10.4% p.a. nominal, vol 18.3%, **kurtosis 10.3** (inflated by the 1930s), max DD −84%; drawdowns >30%: 5, >50%: 2 in 100 yrs; 31 months below −10% | Jul 1926 – Aug 2026 | – | Ken French Data Library | VERIFIED (computed) |
| Housing vs equities (16 advanced economies) | Equity ≈7% arithmetic real, SD ≈22%; geometric ≈4.6%. Housing ≈7% arithmetic real (6.6% CAGR), SD ≈10% | 1870–2015 | ±1 pp | Jordà, Knoll, Kuvshinov, Schularick & Taylor (QJE 2019); NBER Reporter 2018 ("may be reproduced freely with attribution") | SECONDARY (exact table decimals not seen) |
| Safe assets | real 1–3% in peacetime; risk premium 4–5% | 1870–2015 | – | same (NBER Reporter) | VERIFIED |

Game implication: a monthly log-return with μ ≈ 0.4%/month real and σ ≈ 4.3–4.6%/month, plus fat tails (Student-t with ν≈5, or a regime switch), reproduces a drawdown of more than 30% about every 15–20 years and one of more than 50% about once or twice a century.

## 2. Single stocks: skewness, survival

| Item | Value | Band | Source (license) | Status |
|---|---|---|---|---|
| US stocks that beat 1-month T-bills over their listed life | 42.6% (57.4% underperform) | – | Bessembinder 2018, JFE 129(3) (Elsevier, copyright) | SECONDARY (abstract figures confirmed by multiple sources) |
| Share of net US wealth creation | top ≈4% (1,092 of 25,332 CRSP stocks) account for all net wealth creation 1926–2016; 86 stocks = half | – | same | SECONDARY |
| Global (64,000 stocks, 1990–2020) | 55.2% of US and 57.4% of non-US stocks underperform T-bills; top 2.4% of firms = all US$75.7 trn of net wealth creation | – | Bessembinder, Chen, Choi & Wei, FAJ 2023 (copyright) | SECONDARY |
| Median life of a listed US stock | ≈7.5 years; >50% of stocks have negative lifetime returns | – | Bessembinder 2018 | **UNVERIFIED** |
| Typical single-stock volatility | 30–50% annualised (large caps 20–35%, small caps 50%+); the idiosyncratic share rises in crises | – | Campbell-Lettau-Malkiel-Xu 2001 (JF); NBER w29916 (2022) update | **UNVERIFIED** (values not seen; papers only describe the trends) |
| Delisting | Performance-related delisting returns average about −30% to −55%; Shumway-Warther use −55% for Nasdaq | – | Shumway 1997 JF; Shumway & Warther 1999 JF | SECONDARY |
| Annual delisting / bankruptcy rate | about 4–8% of US-listed firms leave per year (most through mergers); about 1–2% p.a. are performance/bankruptcy delistings | wide | CRSP delisting codes | **UNVERIFIED** |

Game implication: give the 10 fictional stocks idiosyncratic volatility of 25–45% p.a. with a positively skewed (lognormal) payoff, and a small monthly failure hazard (about 0.1%/month for each weak stock). Over a lifetime, roughly half should underperform cash while 1–2 become big winners.

## 3. Fixed income real returns: Germany vs India (owner assumption check)

| Instrument | Period | Mean real (p.a.) | Share of years negative | Source | Status |
|---|---|---|---|---|---|
| DE overnight/money market rate − CPI | 1960–1999 | +2.3% | 8% | OECD via FRED + World Bank CPI | VERIFIED (computed) |
| DE money market − CPI | 2000–2025 | −0.5% | 62% | same | VERIFIED |
| DE money market − CPI | 2010–2025 | −1.5% | 94% | same | VERIFIED |
| DE 10-yr Bund yield − CPI (an ex-ante proxy, not a realised return) | 1960–1999 | +3.9% | 0% | same | VERIFIED |
| DE 10-yr Bund yield − CPI | 2000–2025 | +0.4% | 38% | same | VERIFIED |
| DE 10-yr Bund yield − CPI | 2010–2025 | −0.9% | 62% | same | VERIFIED |
| DE savings / sight deposits | long run, excluding the GFC | average real rate **negative**; negative real rates "held the upper hand" historically (1970s, early 1990s, 2000s); time deposits clearly below zero 2010–13 for the first time | – | Bundesbank, "Nothing new about negative real interest rates on deposits" (2014), © Bundesbank | VERIFIED (qualitative) |
| IN 10-yr G-sec yield − CPI | 2012–2025 | +1.6% (nominal 7.3%) | 21% | OECD via FRED + World Bank CPI | VERIFIED (computed) |
| IN SBI 1-yr FD − CPI | snapshots: 2012 −1%, 2015 +3.8%, 2019 −2.9%, 2021 −0.3%, 2022 −1.7% | about −1 to +1 average | – | Business Standard, Outlook Business (news) | SECONDARY |
| Other countries, deposit rate − CPI 2000–2024 (World Bank) | EG −2.1% (64% neg.), CN +0.2% (44%), JP +0.3%, PH +0.2%, RO −1.1%, ZA +1.9%, ID +2.1%, BR +4.8% | – | WDI (CC BY 4.0) | VERIFIED (computed) |

**Assessment of "fixed income mostly slightly below inflation":**
- **Germany:** true for deposits since 2000, and for deposits over the very long run (Bundesbank). It is false for Bunds before 2000, which earned about +3–4% real. Recommendation: savings deposits at −0.5% real (band −2 to +1), 10-yr Bunds at +0.5–1.5% real long run.
- **India:** the assumption does not hold well. Bank FDs average about 0 real (band −3 to +3) and G-secs about +1.5% real.
- **Egypt / Romania:** clearly negative real (−1 to −3%).
- **Brazil / South Africa / Indonesia:** positive real (+2 to +5%).

## 4. Inflation (World Bank CPI, annual %, own computation)

| Country | Full sample mean (geo) | SD | 2000–2025 mean | SD | Peak year | Notes |
|---|---|---|---|---|---|---|
| Germany | 2.7 (1960–2025) | 1.8 | 1.9 | 1.5 | 1973: 7.0; 2022: 6.9 | Destatis: 2022 +6.9%, 2023 +5.9%, 2024 +2.2%. 1923 hyperinflation lies outside the data |
| India | 7.1 (1960–2025) | 4.8 | 5.9 | 2.5 | 1974: 28.6 | RBI target 4% ±2 since 2016, extended to 2031 |
| USA | 3.7 | 2.7 | 2.6 | 1.6 | 1980: 13.5 | |
| China | 4.3 (1987–) | 6.0 | 1.9 | 1.7 | 1994: 24.3 | |
| Japan | 2.9 | 4.0 | 0.5 | 1.3 | 1974: 23.2 | deflation years |
| Spain | 6.0 | 5.5 | 2.4 | 1.9 | 1977: 24.5 | |
| **Egypt** | 10.2 | 7.5 | 11.3 | 8.1 | 2023: 33.9 (annual avg) | monthly peak 38–39.7% (Aug/Sep 2023), core about 40–41%; EGP 30.85 → about 50/USD in March 2024 |
| South Africa | 7.5 | 4.6 | 5.1 | 2.1 | 1986: 18.7 | |
| Mali | 2.6 (1989–) | 5.1 | 2.2 | 3.2 | 1994: 23.2 (CFA devaluation) | CFA franc pegged to EUR |
| Brazil | hyperinflation (1990: 2,948%) | – | 6.2 | 2.5 | 1990 | use the post-1995 Real regime only |
| Poland | 17.8 (1971–) | – | 3.5 | 3.5 | 1990: 568 | |
| Romania | 29.3 (1991–) | – | 8.7 | 10.6 | 1993: 255 | |
| Indonesia | 23.1 | – | 5.6 | 3.3 | 1966: 1,136 | 1998 about 58% |
| Philippines | 7.9 | 8.1 | 3.8 | 1.8 | 1984: 50.3 | |

Source: World Bank WDI FP.CPI.TOTL.ZG (CC BY 4.0), VERIFIED by computation. Egypt monthly figures: CAPMAS/CBE via news (SECONDARY).

## 5. Housing

### 5a. Long-run real house prices (BIS real residential property prices, own computation, Q4-to-Q4)

| Country | Period | Real price CAGR | SD of annual change | Max real drawdown |
|---|---|---|---|---|
| Germany | 1970–2025 | **+0.1%** | 3.7 | −31% |
| India | 2009–2025 | +3.4% | 6.3 | −13% |
| USA | 1970–2025 | +1.8% | 5.5 | −39% |
| Spain | 1971–2025 | +2.4% | 8.8 | −45% |
| Japan | 1955–2025 | +3.1% | 8.4 | −49% (after 1991) |
| South Africa | 1966–2025 | +0.8% | 9.1 | −53% |
| China | 2005–2025 | −0.2% | 4.4 | −25% |
| Brazil | 2001–2025 | +2.7% | 8.5 | −39% |
| Poland | 2010–2025 | +1.4% | 4.9 | −17% |

Source: BIS via FRED (BIS terms: reuse permitted with citation). VERIFIED (computed). Total housing return = price growth + net rental yield. Jordà et al. find net rental yields of about 4–5%, which gives a total real return of about 6–7% in advanced economies 1870–2015 (SECONDARY).

### 5b. Transaction costs

| Item | Germany | India |
|---|---|---|
| Transfer tax | Grunderwerbsteuer 3.5% (Bavaria) to 6.5% (NRW, Brandenburg, Saarland, Schleswig-Holstein); 5.0% BW/NI/RP/ST; 5.5% HH/SN/(HB since 7/2025); 6.0% BE/HE/MV; TH 5.0 or 6.5 (sources conflict). No state uses the first-home exemption (as of Apr 2026) — SECONDARY (rate tables) | Stamp duty 4–8% by state (Maharashtra 6% urban, about 7% Pune/Thane, women −1%; Delhi 6% men / 4% women; Karnataka about 5–5.6%; Kerala 8%). Charged on the higher of price and circle rate — SECONDARY |
| Notary + land registry | ≈1.5–2.0% — **UNVERIFIED** | Registration ≈1% (often capped) — SECONDARY |
| Agent | Buyer pays at most half; since 23 Dec 2020 (§656c BGB) typically 3.57% incl. VAT for each side — **UNVERIFIED** (gesetze-im-internet returned 503) | Brokerage ≈1–2% — **UNVERIFIED** |
| Total round-trip (buyer) | ≈7–12% | ≈6–11% |

### 5c. Maintenance rule of thumb
- Germany: §28 II. Berechnungsverordnung sets maintenance lump sums per m² of living area per year, stepped by building age (2002 base about €7.10 / €9.00 / €11.50, indexed every 3 years; about €10–16 today). Also the "Peterssche Formel" and the common "1% of value p.a." rule. **UNVERIFIED** (law page unavailable).
- Recommendation: 1.0% of building value p.a. (band 0.5–2%), plus lumpy shocks (roof or heating at about 5–10% of value every 20–30 years).

### 5d. Price dispersion around "market value"
- Giacoletti (RFS 2021, 34(8)): idiosyncratic risk in individual house capital gains is large. In the working paper it is up to 60% of capital-gain volatility over a 1-year holding period and below 20% over 5 years. SECONDARY.
- Recommendation: individual sale price = index value × lognormal(σ ≈ 8–12%). Band 5–15%. The 8–12% value itself is **UNVERIFIED**; it is a common magnitude in hedonic-residual and appraisal-error studies.

### 5e. Mortgages
| Item | Germany | India |
|---|---|---|
| LTV rules | No binding statutory LTV cap. BaFin macro-prudential tools exist (FinDAG 2017) but are not activated. Banks price by LTV, with the best rates at ≤60–80% — **UNVERIFIED** | RBI (circular 2017, still in force UNVERIFIED): ≤90% LTV for loans ≤ ₹30 lakh, ≤80% for ₹30–75 lakh, ≤75% above ₹75 lakh — SECONDARY (circular text) |
| Typical rate | Euro area >10-yr fixed: 2.97% (Jan 2025), 3.09% (Feb 2025) (ECB MIR, VERIFIED secondary); DE >10-yr about 3.35% (Mar 2026, Bundesbank via comparison site, SECONDARY). History: about 1% (2021) to about 8–9% (early 1980s and 1990s) | SBI band 7.50–8.70% (repo/EBLR-linked, floating) — SECONDARY. Range over the last 20 years about 6.7–11% — UNVERIFIED |
| Typical structure | 10–15-yr fixed, annuity with 2–3% initial repayment | floating, 15–30 yrs, EMI |

## 6. Investor behaviour

| Item | Value | Notes / band | Source (license) | Status |
|---|---|---|---|---|
| Overtrading penalty | Most active quintile (turnover >250%/yr) earned 11.4% net p.a. vs 17.9% market; average household 16.4% net (18.7% gross), turnover 75% p.a. | 66,465 US households, 1991–96 | Barber & Odean 2000, JF 55(2) | SECONDARY (multiple consistent) |
| Behaviour gap (funds) | ≈1.2 pp p.a. (investor 7.0% vs fund 8.2%, 10 yrs to end-2024); ETFs 1.6 pp vs 1.2 pp for traditional funds (10 yrs to 2025) | method: dollar- vs time-weighted, which mixes hindsight effects | Morningstar "Mind the Gap" (proprietary) | SECONDARY |
| Market-level gap | Dichev 2007: 1.3% NYSE/AMEX 1926–2002, 5.3% Nasdaq, 1.5% across 19 markets | **Disputed**: Keswani & Stolin 2008 find the gap is not robust (the UK flips to −1.3%); Hayley 2014 attributes much of it to hindsight bias | AER 2007; FRL 2008 | SECONDARY |
| Loss aversion λ | **1.955** (95% interval 1.82–2.10); median of raw estimates 1.69 | 607 estimates, 150 papers | Brown, Imai, Vieider & Camerer, JEL 62(2) 2024 | VERIFIED (abstract) |

## 7. Fees

| Item | Value | Source (license) | Status |
|---|---|---|---|
| EU equity UCITS (non-ETF), retail, 2020–24, 5-yr horizon | total costs 1.9% p.a. = ongoing 1.38 + subscription 0.51 + redemption 0.04 | ESMA Market Report "Costs and Performance of EU Retail Investment Products 2025" (Mar 2026). © ESMA, "brief excerpts may be reproduced provided the source is cited" | VERIFIED |
| EU equity ETFs | total 0.5% p.a.; ongoing 0.22% | same | VERIFIED |
| 2024 ongoing costs: active equity funds vs ETFs | active equity (non-ETF) 1.2%; passive equity ETF 0.2%; active equity ETF 0.3% | same | VERIFIED |
| 2024 net returns | active equity 17.0% vs passive funds 21.3% vs ETFs 21.4% | same | VERIFIED |
| Bond UCITS | total 1.3%, ongoing 0.87%; real net −4.0% p.a. 2020–24 | same | VERIFIED |
| Germany brokers | neo-brokers €0–1 per order; ETF savings plans often €0; branch banks about €5–10 + 0.25% per order, plus custody fees | broker price lists | **UNVERIFIED** |
| India | discount brokers ₹0 delivery / ₹20 intraday; STT 0.1% on delivery buy & sell; stamp 0.015% on buys; mutual fund TER caps (SEBI) up to about 2.25% for active equity regular plans; index direct plans 0.1–0.3% | SEBI / broker lists | **UNVERIFIED** |

## 8. Exchange rates and PPP

| Item | Value | Source (license) | Status |
|---|---|---|---|
| Half-life of real-exchange-rate deviations | "remarkable consensus" of **3–5 years** (implies ≈1.2–1.9%/month mean reversion of the log gap) | Rogoff 1996, JEL 34(2) "The Purchasing Power Parity Puzzle" (copyright) | SECONDARY (wording confirmed via citing papers) |
| Panel / post-1973 estimates | 2–2.5 yrs; median-unbiased CIs run from about 1 yr to infinity | Murray & Papell 2002/2004; Lopez, Murray & Papell 2005/2009 | SECONDARY |
| Relative PPP | holds in the long run (decades), especially between high- and low-inflation countries; short-run nominal FX is close to a random walk | standard literature | consensus, UNVERIFIED specific numbers |
| PPP conversion factors | World Bank ICP 2021 (176 economies; released May 2024; PPP series 2017–2023) | **CC BY 4.0** (World Bank data catalog) | VERIFIED |
| | Penn World Table 10.01 / 11.0 | **CC BY 4.0**, cite Feenstra, Inklaar & Timmer (2015) | VERIFIED |
| | World Bank WDI `PA.NUS.PPP`, `PA.NUS.PRVT.PP` | CC BY 4.0 | VERIFIED (WDI license) |

Game model: log real FX gap follows AR(1) with monthly ρ = 0.5^(1/48) ≈ 0.9857 (4-year half-life) and innovations of about 2.5–3% per month. The nominal rate drifts by the inflation differential.

## 9. Business-cycle regimes

| Region | Recession share of time | Average durations | Source (license) | Status |
|---|---|---|---|---|
| USA 1945–2020 | ≈14% of months (10.3 / 74.5) | contraction 10.3 months, expansion 64.2 months (range 12–128) | NBER Business Cycle Dating (public, cite NBER) | SECONDARY (table values consistent across sources) |
| Euro area | recessions 2008Q2–2009Q2, 2011Q4–2013Q1, 2020Q1–2020Q2. Earlier: 1974–75, 1980–82, 1992–93 | ≈12–15% of quarters since 1970 | CEPR-EABCN Dating Committee chronology (free, cite CEPR) | Recent dates VERIFIED (secondary); pre-2008 dates and the share **UNVERIFIED** |
| India | no official dating committee; growth recessions are rare (1979–80, 2020 COVID contraction) | – | – | UNVERIFIED |

Markov switching (monthly): P(expansion→recession) ≈ 1/64 ≈ 0.016; P(recession→expansion) ≈ 1/10 ≈ 0.10. Stationary recession share = 0.016/(0.016+0.10) ≈ 14%. For emerging markets, add a separate "crisis" state (inflation/FX spike) at about 1–3% p.a. probability (Egypt 2016, 2023–24; Brazil, Indonesia 1998). The EM crisis frequency is UNVERIFIED and comes from the episode history above.

---

## Top 10 recommended game parameters

| # | Parameter | Recommended value | Band | Basis |
|---|---|---|---|---|
| 1 | World ETF real expected return (geometric) | **4.5% p.a.** (≈0.37%/month) | 3–5.5% | DMS ≈5% 1900–; 3.5% in the 21st century; net of 0.2% TER |
| 2 | World ETF volatility | **16% p.a.** (4.6%/month), fat tails (t, ν≈5) or a 2-regime model; recession regime mean −1.5%/month, vol ×1.6 | 14–18% | Developed markets 1990–2026: 15.0%, kurtosis 4.4; DMS world about 17% |
| 3 | Single-stock idiosyncratic vol / failure | **30% p.a.** idiosyncratic; failure hazard 0.1%/month (→ −90% to −100%) | 20–45%; 0.05–0.2% | Bessembinder 57% of stocks lose to bills; Shumway −55% delisting |
| 4 | Inflation, Germany / India | **2.0% (SD 1.5)** / **5.5% (SD 2.5)**; AR(1) with episodic shocks (DE 7%, IN 12%) | DE 1–3; IN 4–7 | World Bank CPI 2000–2025 |
| 5 | Savings deposit real rate | DE **−0.5%**, IN **0%**, EG −2%, ZA/ID +2%, BR +4% | ±2 pp | §3 computation |
| 6 | Government bond real yield (10-yr) | DE **+0.8%**, IN **+1.5%**; duration ≈8 | ±1.5 pp | §3 computation; Jordà 1–3% |
| 7 | Real house price growth (+ net rent yield) | DE **+0.5%** price + 3% net rent; IN **+2.5%** price + 2.5% net rent; individual sale noise lognormal σ = **10%** | price 0–3%; σ 5–15% | BIS series; Jordà; Giacoletti |
| 8 | Housing transaction + upkeep costs | buyer DE **10%** (GrESt 3.5–6.5 + notary 2 + agent 3.57), IN **8%** (stamp 5–7 + reg 1 + broker 1); maintenance **1% of building value p.a.** | 6–12%; 0.5–2% | §5b/5c |
| 9 | Fees and behaviour | ETF TER **0.2%**, active fund **1.4% ongoing (1.9% total)** with zero expected alpha; overtrading penalty about **−6 pp p.a.** at >250% turnover; loss aversion λ = **2.0** | λ 1.8–2.1 | ESMA 2025; Barber-Odean; Brown et al. 2024 |
| 10 | Regimes and FX | recession entry **0.016**/month, exit **0.10**/month (≈14% of time); real FX half-life **4 years** (ρ_month ≈ 0.986); PPP data from World Bank ICP / PWT (CC BY 4.0) | half-life 2–5 yrs | NBER, CEPR, Rogoff 1996 |

Mortgage defaults for the game: DE ≈3.5% fixed for 10 years, typical max LTV 80–90% with a risk premium above 80%; IN ≈8.5% floating (repo-linked), LTV caps 90/80/75% by loan size (RBI).

### Items to re-verify before shipping (UNVERIFIED)
DMS 2025 world exact figures; §656c BGB and §28 II. BV wording/amounts; German notary percentage; German and Indian broker fees; SEBI TER caps; single-stock vol and delisting rates; euro-area pre-2008 recession dates; current RBI LTV circular status; house-sale price-dispersion σ.
