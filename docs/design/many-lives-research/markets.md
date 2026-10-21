# Many Lives: capital-market and macro calibration (research notes)

**Second pass (2026-10-21).** Targeted verification of MVP items. Changed: DMS/UBS 2025 world real returns now VERIFIED (equities 5.2%, bonds 1.7%, bills 0.5%; bills was 0.8%); single-stock volatility now VERIFIED from Campbell et al. 2022 (value-weighted idiosyncratic 28% since 1997, market 18%); delisting rates now SECONDARY (BCG 2026: bankruptcies 1.7–4.2% p.a., mergers 3–7% p.a.); Bessembinder median life 7.5 yrs SECONDARY; house-sale dispersion now VERIFIED from Giacoletti's working paper (residual SD 11–18%); §656c BGB VERIFIED (statute text); §28 II. BV 2026 amounts SECONDARY (€11.50 / €14.58 / €18.62); notary + land registry SECONDARY (≈1.5%, range 0.8–2%); German and Indian broker fees VERIFIED or SECONDARY (Zerodha price list; neo-broker €0.99–1 per order); SEBI TER framework revised Dec 2025 (SECONDARY); euro-area recession chronology SECONDARY. Still UNVERIFIED: exact SEBI slabs, a CRSP-based performance-delisting rate, current RBI LTV Master Direction, India brokerage on property, EM crisis frequency.

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
| World equity real, latest Yearbook | **5.2% p.a.**; world bonds **1.7%**; bills **0.5%** (35 markets). World real SD ≈17% still UNVERIFIED (not stated in the summaries) | 1900–2024 | ±0.5 pp | UBS Global Investment Returns Yearbook 2025 (proprietary; summary free), as quoted by Cambridge Judge Business School: https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/ | VERIFIED (returns, author institution's summary); SD UNVERIFIED |
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
| Median life of a listed US stock | median listed life ≈7.5 years (2018 version, 25,967 stocks); fewer than half have positive lifetime returns (49.2% positive, median lifetime return −3.7% in the 2017 draft; 48.2% positive, median −6.9% in the 1926–2025 update); modal lifetime return −100% | – | Bessembinder 2018 and updates, via https://www.morningstar.com/columns/rekenthaler-report/most-stocks-stink and https://alphaarchitect.com/2017/01/treasury-bills-outperform-stocks-say/ | SECONDARY (figures differ by vintage; paper itself not opened) |
| Typical single-stock volatility | Value-weighted averages (annualised): **idiosyncratic 28%** (1997–2021; 26% in 1962–97), industry 14%, market 18%. Implied total vol of a typical large stock ≈ √(18²+14²+28²) ≈ **36%** (own derivation). Firm-level share of variance ≈ 60% value-weighted but ≈ 80–95% equal-weighted, i.e. small stocks are far more idiosyncratic. Small-cap levels of 50%+ are still UNVERIFIED | 1962–2021, US | Campbell, Lettau, Malkiel & Xu, "Idiosyncratic Equity Risk Two Decades Later", NBER w29916 (2022), §3: https://www.nber.org/system/files/working_papers/w29916/w29916.pdf | VERIFIED (value-weighted levels read in the paper) |
| Delisting | Performance-related delisting returns average about −30% to −55%; Shumway-Warther use −55% for Nasdaq | – | Shumway 1997 JF; Shumway & Warther 1999 JF | SECONDARY |
| Annual delisting / bankruptcy rate | Bankruptcies ≈ **1.7% of US-listed firms in 2007, 4.2% in 2009**; mergers ≈ 7.3% (2007) and 2.9% (2009). Five-year "failure" risk (all delisting reasons incl. M&A and going private) ≈ **18% (2025)**, peak ≈ 40% (2002); by size 26% (smallest revenue quartile) vs 8% (largest) | 1975–2025, US | BCG, "Why do companies fail?" (2026): https://www.bcg.com/publications/2026/why-do-companies-fail-us-failure-rates | SECONDARY (consultancy analysis of listing data; a CRSP-code-based performance-delisting rate is still UNVERIFIED) |

Game implication (second pass: the 1.7–4.2% p.a. bankruptcy range supports a failure hazard of ≈0.1–0.35%/month for weak stocks): give the 10 fictional stocks idiosyncratic volatility of 25–45% p.a. with a positively skewed (lognormal) payoff, and a small monthly failure hazard (about 0.1%/month for each weak stock). Over a lifetime, roughly half should underperform cash while 1–2 become big winners.

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
| Notary + land registry | ≈1.5% typical (notary ≈1.0%, land registry ≈0.5%); range 0.8–2.0% depending on mortgage charge and services. Fees follow the GNotKG scale on the price, notary +19% VAT — SECONDARY (https://www.immowelt.de/ratgeber/kaufen/notarkosten-grundbuchkosten, https://www.immobilienscout24.de/wissen/kaufen/notargebuehren.html) | Registration ≈1% (Maharashtra: 1%, max ₹30,000) — SECONDARY |
| Agent | Since 23 Dec 2020 (§§656a–656d BGB; flats and single-family homes bought by consumers only): if the agent is engaged by both sides, both must pay the **same** amount (§656c); if engaged by one side, at most half can be passed to the other, and only after the engaging party has paid (§656d). VERIFIED (statute text: https://www.buzer.de/656c_BGB.htm). The customary rate of ≈3.57% incl. VAT per side is SECONDARY (https://www.ihk.de/darmstadt/servicemarken/news/service/neues-gesetz-zur-teilung-der-maklerprovision-4834582) | Brokerage ≈1–2% — **UNVERIFIED** |
| Total round-trip (buyer) | ≈7–12% | ≈6–11% |

### 5c. Maintenance rule of thumb
- Germany: §28 (2) II. Berechnungsverordnung sets maximum maintenance lump sums per m² of living area per year by building age: statutory base **€7.10 (< 22 yrs) / €9.00 (22–32 yrs) / €11.50 (≥ 32 yrs)** (SECONDARY: statute wording seen only as a search excerpt of https://rewis.io/gesetze/ii-bv/p/28-ii-bv/; gesetze-im-internet still returned 503), indexed to CPI every 3 years. From **1 Jan 2026: €11.50 / €14.58 / €18.62** (+8.37%, CPI Oct 2022 → Oct 2025) — SECONDARY (Haus & Grund München press release 5 Dec 2025; Thüringer Aufbaubank form https://dokumente.aufbaubank.de/862739-TAB_Erfassungsbogen_Objektwirtschaftlichkeitsberechnung.pdf). These are statutory caps for social housing cost rent, not measured spending. Also the "Peterssche Formel" and the common "1% of value p.a." rule (UNVERIFIED as empirical norms).
- Recommendation: 1.0% of building value p.a. (band 0.5–2%), plus lumpy shocks (roof or heating at about 5–10% of value every 20–30 years).

### 5d. Price dispersion around "market value"
- Giacoletti (RFS 2021, 34(8)): idiosyncratic risk in individual house capital gains is large. In the working paper it is up to 60% of capital-gain volatility over a 1-year holding period and below 20% over 5 years. SECONDARY.
- Giacoletti (working paper, 2017, §3): the cross-sectional SD of house-specific capital-gain residuals between two sales is **≈11–18%** (Los Angeles 13% in 2006 → 17% in 2012; San Diego 11–12%; San Francisco 13% → 18%), and it does **not** grow with the holding period (a one-off shock at sale). VERIFIED (read in https://finance.unibocconi.eu/sites/default/files/files/media/attachments/MarcoGiacolettiJMP20170116082355.pdf).
- Case & Shiller (1989): SD of annual appreciation of an individual house ≈15% (SECONDARY, cited in a 2022 AUT working paper). Pace, Sirmans & Slawson (2002): appraiser errors ≈10% SD; plain hedonic models 28–50% (SECONDARY, abstract).
- Recommendation: individual sale price = index value × lognormal(σ ≈ 8–12%), drawn once per sale and not scaled by holding time. A residual of 11–18% between two sales implies ≈ 8–13% per sale if both sales carry independent noise (own derivation). Band 5–15%. Now SECONDARY/derived rather than UNVERIFIED.

### 5e. Mortgages
| Item | Germany | India |
|---|---|---|
| LTV rules | No binding statutory LTV cap. BaFin macro-prudential tools exist (FinDAG 2017) but are not activated. Banks price by LTV, with the best rates at ≤60–80% — **UNVERIFIED** | RBI (Oct 2015 circular; slabs still quoted by lenders in 2025, current Master Direction not checked): ≤90% LTV for loans ≤ ₹30 lakh, ≤80% for ₹30–75 lakh, ≤75% above ₹75 lakh — SECONDARY (https://www.business-standard.com/article/finance/rbi-cuts-risk-weight-for-individual-home-loans-115100800931_1.html) |
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
| Germany brokers | Neo-brokers: Trade Republic €1 per order (€2 with chosen venue, from Jul 2026), Scalable Capital €0.99 (free tier); **ETF savings plans €0** at both. Direct bank (comdirect, standard): €4.90 + 0.25% of volume, min €9.90, max €59.90 per domestic order, plus exchange fees; custody free under conditions, else €1.95/month. Branch banks UNVERIFIED (typically higher) | Broker price summaries: https://www.justetf.com/at/etf-sparplan/trade-republic-etf-sparplan-test.html, https://www.finanz.de/geldanlage/depot/broker-gebuehren/, https://zendepot.de/depot/comdirect-kosten | SECONDARY (fees change often) |
| India | Discount broker (Zerodha): **₹0 brokerage on delivery**; intraday 0.03% or ₹20 per order, whichever is lower; **STT 0.1% on delivery buy and sell** (intraday 0.025% sell side); stamp duty **0.015% on delivery buys**; NSE transaction charge 0.00307%; DP charge ₹15.34 per scrip on sale; 18% GST on brokerage and fees | https://zerodha.com/charges | VERIFIED (broker price list, Oct 2026) |
| India mutual-fund TER caps | 2018 framework: active open-ended equity regular plans max 2.25% for the first ₹500 crore AUM, falling by slab to ≈1.05% above ₹50,000 crore. Dec 2025 SEBI overhaul: renamed Base Expense Ratio (statutory levies outside the cap), cuts of up to 15 bp per slab, extra 5 bp exit-load allowance removed. Index direct plans 0.1–0.3% UNVERIFIED | https://www.business-standard.com/amp/markets/news/sebi-revamps-mf-expense-ratio-framework-125121700968_1.html | SECONDARY (exact new slabs UNVERIFIED) |

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
| Euro area | Peaks/troughs: 1974Q3 / 1975Q1 (trough UNVERIFIED), 1980Q1 / 1982Q3, 1992Q1 / 1993Q3, 2008Q1 / 2009Q2, 2011Q3 / 2013Q1, 2019Q4 / 2020Q2; recession = quarters P+1 … T | ≈31 recession quarters of 224 in 1970–2025 ≈ **14%** (own count) | CEPR-EABCN Dating Committee chronology: https://eabcn.org/dbc/peaksandtroughs/chronology-euro-area-business-cycles | SECONDARY (dates via search summary of the committee page; page itself returned 403) |
| India | no official dating committee; growth recessions are rare (1979–80, 2020 COVID contraction) | – | – | UNVERIFIED |

Markov switching (monthly): P(expansion→recession) ≈ 1/64 ≈ 0.016; P(recession→expansion) ≈ 1/10 ≈ 0.10. Stationary recession share = 0.016/(0.016+0.10) ≈ 14%. For emerging markets, add a separate "crisis" state (inflation/FX spike) at about 1–3% p.a. probability (Egypt 2016, 2023–24; Brazil, Indonesia 1998). The EM crisis frequency is UNVERIFIED and comes from the episode history above.

---

## Top 10 recommended game parameters

| # | Parameter | Recommended value | Band | Basis |
|---|---|---|---|---|
| 1 | World ETF real expected return (geometric) | **4.5% p.a.** (≈0.37%/month) | 3–5.5% | DMS 5.2% 1900–2024 (verified 2nd pass); 3.5% in the 21st century; net of 0.2% TER |
| 2 | World ETF volatility | **16% p.a.** (4.6%/month), fat tails (t, ν≈5) or a 2-regime model; recession regime mean −1.5%/month, vol ×1.6 | 14–18% | Developed markets 1990–2026: 15.0%, kurtosis 4.4; DMS world about 17% |
| 3 | Single-stock idiosyncratic vol / failure | **30% p.a.** idiosyncratic (large caps; small caps 40–50%); failure hazard 0.1%/month (→ −90% to −100%) | 20–50%; 0.05–0.35% | Campbell et al. 2022: VW idiosyncratic 28%; BCG bankruptcies 1.7–4.2% p.a.; Bessembinder 57% of stocks lose to bills; Shumway −55% delisting |
| 4 | Inflation, Germany / India | **2.0% (SD 1.5)** / **5.5% (SD 2.5)**; AR(1) with episodic shocks (DE 7%, IN 12%) | DE 1–3; IN 4–7 | World Bank CPI 2000–2025 |
| 5 | Savings deposit real rate | DE **−0.5%**, IN **0%**, EG −2%, ZA/ID +2%, BR +4% | ±2 pp | §3 computation |
| 6 | Government bond real yield (10-yr) | DE **+0.8%**, IN **+1.5%**; duration ≈8 | ±1.5 pp | §3 computation; Jordà 1–3% |
| 7 | Real house price growth (+ net rent yield) | DE **+0.5%** price + 3% net rent; IN **+2.5%** price + 2.5% net rent; individual sale noise lognormal σ = **10%** | price 0–3%; σ 5–15% | BIS series; Jordà; Giacoletti |
| 8 | Housing transaction + upkeep costs | buyer DE **10%** (GrESt 3.5–6.5 + notary 2 + agent 3.57), IN **8%** (stamp 5–7 + reg 1 + broker 1); maintenance **1% of building value p.a.** | 6–12%; 0.5–2% | §5b/5c |
| 9 | Fees and behaviour | ETF TER **0.2%**, active fund **1.4% ongoing (1.9% total)** with zero expected alpha; overtrading penalty about **−6 pp p.a.** at >250% turnover; loss aversion λ = **2.0** | λ 1.8–2.1 | ESMA 2025; Barber-Odean; Brown et al. 2024 |
| 10 | Regimes and FX | recession entry **0.016**/month, exit **0.10**/month (≈14% of time); real FX half-life **4 years** (ρ_month ≈ 0.986); PPP data from World Bank ICP / PWT (CC BY 4.0) | half-life 2–5 yrs | NBER, CEPR, Rogoff 1996 |

Mortgage defaults for the game: DE ≈3.5% fixed for 10 years, typical max LTV 80–90% with a risk premium above 80%; IN ≈8.5% floating (repo-linked), LTV caps 90/80/75% by loan size (RBI).

### Items to re-verify before shipping (UNVERIFIED)
After the second pass: world real equity SD in DMS 2025; small-cap single-stock volatility level; CRSP-code performance-delisting rate; exact SEBI Base Expense Ratio slabs (Dec 2025); current RBI LTV Master Direction; Indian property brokerage; the 2026 §28 II. BV amounts against the Bundesanzeiger/official notice; euro-area 1975 trough; German LTV practice; EM crisis frequency. Resolved in the second pass: DMS 2025 returns, §656c BGB, German notary range, broker fees, single-stock vol, bankruptcy rates, house-sale σ.
