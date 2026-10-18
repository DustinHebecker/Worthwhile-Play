# Calibration sheet: "A large country in South Asia (calibrated on India)"

Research date: 2026-10-18. Prepared for the "Many Lives" personal-finance life simulation.

**How to read this sheet**
- **Status column:** **V** = checked against a primary source (official PDF or table opened directly). **V2** = confirmed by two or more secondary reports that cite the primary source, but the primary source was not opened. **UNVERIFIED** = background knowledge or a single non-authoritative source. Re-check before shipping.
- **Uncertainty band:** a suggested range for tuning the simulation, not a statistical confidence interval, unless stated otherwise.
- **Licence notes:** these numbers are statistical facts, which are not copyrightable. Credit the source in the in-game credits or `docs/third-party.md`.
  - World Bank (WDI, Findex, poverty platform): CC BY 4.0.
  - WID.world: data published under CC BY 4.0. Verify on the wid.world terms page.
  - MoSPI and Government of India data: Government Open Data License – India (GODL), which requires attribution.
  - NFHS (IIPS/ICF, DHS Program): the published fact-sheet values may be cited. The microdata needs DHS registration and must not be redistributed.
  - ILO: CC BY 4.0 for ILOSTAT.
  - News or aggregator sites: cite only as pointers. Do not copy their text.
- **Search budget:** the shared web-search budget ran out before every item was checked. Items still open are listed as UNVERIFIED in §12.
- **Tone guidance for writers:** describe households by circumstance (income, work, housing), never by caste, religion or region stereotypes. Street-dwelling families are workers and citizens with agency (they vend, collect recyclables, do construction labour, care work and transport). Do not frame them as objects of pity or as criminal.

Currency: INR. ₹1 lakh = 100,000. ₹1 crore = 10,000,000. FX for orientation only: about ₹83–88 per US$ (2024–26) (UNVERIFIED).

---

## 0. Suggested household starts (derived from the sheet below)

| Start | Calibration anchor | Annual income (per adult, 2022-23 prices) | Net wealth (per adult) | Notes |
|---|---|---|---|---|
| Street-dwelling family in a big city | Census "houseless" population; bottom decile | Household roughly ₹60k–1.5 lakh/yr from casual day work (₹400–550/day urban casual wage, but irregular: 12–20 days/month) | ≈ 0 or negative (informal debt) | Usually no address proof, which blocks bank, ration and school paperwork in-game until "documents" are obtained. Shelters (DAY-NULM) are limited. |
| Urban upper middle class (top 10%) | WID p90 threshold ₹2.91 lakh per adult; top-10% average ₹13.5 lakh | Two-earner salaried household ₹15–40 lakh/yr | Household ₹50 lakh–2 crore, mostly housing plus gold plus EPF | Private school, coaching, home loan, demat account, EPF/NPS |
| Very wealthy family (top 1%) | WID p99 income threshold ₹20.7 lakh; top-1% average ₹53 lakh; wealth p99 ₹81.6 lakh; top-1% average wealth ₹5.41 crore | ₹50 lakh–5 crore+ | ₹5 crore–100 crore+ (business equity, property) | Family business, equity, property, overseas education |

Note that WID thresholds are **per adult (20+), pre-tax national income**, scaled up to national accounts. They are therefore higher than survey incomes but lower than what people perceive "top 10%" to mean in metro cities.

---

## 1. Income, wealth, poverty, homelessness

| Item | Value | Unit | Year | Source | Band | Status |
|---|---|---|---|---|---|---|
| Average national income per adult | 2,34,551 | ₹/adult/yr | 2022-23 | WIL WP 2024/09, Bharti, Chancel, Piketty, Somanchi, Table 2 — https://wid.world/wp-content/uploads/2024/03/WorldInequalityLab_WP2024_09_Income-and-Wealth-Inequality-in-India-1922-2023_Final.pdf | ±10% | V |
| Bottom 50% average income | 71,163 (share 15.0%) | ₹/adult/yr | 2022-23 | same, Table 2 | ±15% | V |
| Middle 40%: threshold / average | 1,05,413 / 1,65,273 (share 27.3%) | ₹/adult/yr | 2022-23 | same | ±15% | V |
| **Top 10%: threshold / average** | **2,90,848 / 13,52,985** (share 57.7%) | ₹/adult/yr | 2022-23 | same | ±20% | V |
| **Top 1%: threshold / average** | **20,73,846 / 53,00,549** (share 22.6%) | ₹/adult/yr | 2022-23 | same | ±25% (authors call it a likely lower bound) | V |
| Top 0.1%: threshold / average | 82,20,379 / 2,24,58,442 (share 9.6%) | ₹/adult/yr | 2022-23 | same | ±30% | V |
| Average wealth per adult | 13,49,029 | ₹/adult | 2022-23 | same, Table 3 | ±20% | V |
| Bottom 50% average wealth | 1,73,184 (1,93,031 without the outlier); share 6.4% | ₹/adult | 2022-23 | same | ±25% | V |
| Middle 40% wealth: threshold / average | 4,31,138 / 9,63,560 (share 28.6%) | ₹/adult | 2022-23 | same | ±25% | V |
| **Top 10% wealth: threshold / average** | **21,98,344 / 87,70,132** (share 65.0%) | ₹/adult | 2022-23 | same | ±25% | V |
| **Top 1% wealth: threshold / average** | **81,60,022 / 5,41,41,525** (share 40.1%) | ₹/adult | 2022-23 | same | ±30% | V |
| Billionaires (US$) | 162 | count | 2022 | same paper (text) | — | V2 |
| Mean monthly per-capita consumption (MPCE), urban | 6,996 (7,078 including the value of free items) | ₹/person/month | 2023-24 | MoSPI HCES 2023-24 press note — https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf | ±5% | V2 |
| MPCE, rural | 4,122 (4,247 including free items) | ₹/person/month | 2023-24 | same | ±5% | V2 |
| Consumption Gini, urban / rural | 0.284 / 0.237 | — | 2023-24 | same | — | V2 |
| "Median household income" | No official income survey exists. **Proxy:** urban mean household consumption ≈ ₹6,996 × ~4 members ≈ ₹28k/month; the median is lower, roughly ₹20–24k/month | ₹/household/month | 2023-24 | derived from HCES; household size UNVERIFIED | ±25% | UNVERIFIED (derived) |
| Extreme poverty (US$3.00/day, 2021 PPP) | 5.3% (≈75 million people); 27.1% in 2011-12 | % of population | 2022-23 | World Bank Poverty & Equity Brief / PIP (CC BY 4.0), as reported, e.g., https://www.tribuneindia.com/news/india/extreme-poverty-in-india-down-to-5-3-from-27-1-world-bank | 5–12% (independent estimates 9.9–12.2% under other lines) | V2 |
| US$3.00/day in rupees | ≈ ₹257/day (PPP) | ₹/person/day | 2021 PPP | same | — | V2 |
| Houseless population (Census) | 1.77 million total: 0.94 million urban, 0.83 million rural (0.15% of population) | persons | 2011 | Census 2011 houseless tables; HLRN 2013 — https://hlrn.org.in/documents/Housing_and_Land_Status_Update_2013.pdf | Advocacy groups estimate 2–3× undercount (urban ≈1% of population in some metros) | V2 |
| Census definition of houseless | people living in the open, on the roadside, on pavements, in hume pipes, under flyovers or staircases, or on railway platforms | — | 2011 | same | — | V2 |
| Urban homeless trend 2001→2011 | urban +20%, rural −28% | % | 2011 | IndiaSpend — https://indiaspend.com/indias-target-for-homeless-60000-houses-a-year-29465 | — | V2 |
| Livelihoods of street-dwelling people | casual construction or loading labour, waste picking and recycling, street vending, rickshaw/cart pulling, domestic work, catering. Delhi survey of people who beg: 65% earn <₹200/day, 23% ₹200–500 | qualitative / % | 2010s | IHD Delhi survey — https://ihdindia.org/pdf/Exec-Summary-Beggar-Survey.pdf; ActionAid Bhubaneswar 2017 (6,559 homeless counted vs 1,245 in Census) — https://www.actionaidindia.org/wp-content/uploads/2018/06/City-Makers-in-Bhubaneswar-A-Study-on-Homeless-22-Sept-2017.pdf | wide | V2 (small samples) |
| Slum population | 65.5 million people, about 17.4% of urban population in reporting towns; 13.7 million households | persons | 2011 | Census 2011 / Lok Sabha answer — https://rsdebate.nic.in/bitstream/123456789/624824/2/PQ_229_22082013_U1454_p206_p223.pdf | 17–25% urban | V2 |

## 2. Informality and employment structure

| Item | Value | Unit | Year | Source | Band | Status |
|---|---|---|---|---|---|---|
| Self-employed share of workers | 58.4% | % of workers | Jul 2023–Jun 2024 | PLFS AR 2023-24 (MoSPI) — summary: https://ruralindiaonline.org/en/library/resource/periodic-labour-force-survey-plfs-annual-report-july-2023-june-2024/ | ±1 pp | V2 |
| Regular wage / salaried share | 21.7% | % | 2023-24 | same | ±1 pp | V2 |
| Casual labour share | 19.8% | % | 2023-24 | same | ±1 pp | V2 |
| Informal employment (all forms) | ≈ 90% of workers (≈82% in the informal sector) | % | 2022 | ILO–IHD India Employment Report 2024 — summary: https://www.gktoday.in/india-employment-report-2024/ | 85–92% | V2 |
| Regular salaried without a written contract | 58% | % of regular employees | 2023-24 | PLFS AR 2023-24 (summary above) | ±3 pp | V2 |
| Regular salaried without paid leave | 47.3% | % | 2023-24 | same | ±3 pp | V2 |
| Regular salaried without any social security | 53.4% | % | 2023-24 | same | ±3 pp | V2 |
| Regular salaried earnings, urban (men / women) | 24,434 (26,105 / 19,879) | ₹/month | Apr–Jun 2024 | same | ±10% | V2 |
| Regular salaried earnings, rural (men / women) | 17,033 (18,200 / 12,396) | ₹/month | Apr–Jun 2024 | same | ±10% | V2 |
| Casual wage, urban (men / women) | 516 (537 / 364) | ₹/day | Apr–Jun 2024 | same | ±10%. Days worked are irregular | V2 |
| Casual wage, rural (men / women) | 417 (444 / 299) | ₹/day | Apr–Jun 2024 | same | ±10% | V2 |
| Self-employed earnings | ≈ ₹13–14k rural, ≈ ₹20–22k urban per month | ₹/month | 2023-24 | PLFS AR, Statement on earnings | ±20% | UNVERIFIED |

## 3. Education

| Item | Value | Unit | Year | Source | Band | Status |
|---|---|---|---|---|---|---|
| Government-school share of school enrolment | 55.9% (rural ≈66%, urban 30.1%) | % of students | 2025 | NSS 80th round CMS:E 2025 (MoSPI) — https://www.newsonair.gov.in/government-schools-account-for-56-of-enrolments-says-education-survey-2025 | ±2 pp | V2 |
| Private unaided share | 31.9% (CMS:E); 34.4% (UDISE+ 2023-24) | % | 2025 / 2023-24 | same; UDISE+ analysis — https://educationforallinindia.com/trends-in-udiseplus-key-indicators-data-from-2020-21-to-2023-24/ | 30–36% | V2 |
| Household spend per student, government school | 2,863 (rural 2,639 / urban 4,128) | ₹/yr | 2025 | CMS:E 2025 | ±15% | V2 |
| Household spend per student, non-government school | 25,002 (rural 19,554 / urban 31,782). Premium urban private schools charge ₹1–5 lakh+ (UNVERIFIED) | ₹/yr | 2025 | CMS:E 2025 | ±20% | V2 |
| Students taking private coaching | 27% (urban 30.7%, rural 25.5%) | % | 2025 | CMS:E 2025 — https://insights.dataful.in/articles/private-schooling-costs-nearly-9-times-more-than-government-education-nss-survey | ±2 pp | V2 |
| Average coaching spend, urban (higher secondary) | ≈ 3,988 (9,950) | ₹/yr | 2025 | secondary site citing CMS:E | ±30% | UNVERIFIED |
| Residential entrance-exam coaching (coaching hub city) | coaching ≈ ₹1.5 lakh/yr plus hostel ≈ ₹50k/yr; ₹5–6 lakh over the whole preparation. Commercial sites say ₹2.5–5.5 lakh/yr all-in | ₹/yr | ~2023 | Lok Sabha answer — https://eparlib.nic.in/bitstream/123456789/2966444/1/12882.pdf | ₹1.5–5.5 lakh | V2 |
| Secondary dropout rate | 14.1% | %/yr | 2023-24 | UDISE+ (analysis by A.C. Mehta) | 12–15% | V2 |
| Higher-education GER (18–23) | 28.4% (2021-22); 30.0% (2023-24, released Jul 2026) | % | 2021-22 / 2023-24 | AISHE (MoE) — https://educationforallinindia.com/trends-analysis-of-gross-enrolment-ratio-ger-in-higher-education-in-india-2024/ | ±1 pp | V2 |
| Engineering entrance (JEE Main) candidates | 14,75,103 | persons | 2025 | NTA, via Careers360 — https://news.careers360.com/jee-advanced-2025-only-1-in-10-secure-seat-iit-nit-cut-off-josaa-counselling-how-many-qualify-75-pc-criteria-jeeadv-ac-in | — | V2 |
| Elite-tech-institute (IIT) seats | ≈ 17,760. Other central institutes (NIT/IIIT/GFTI) ≈ 42,000 | seats | 2025 | JoSAA (blog) | ±5% | UNVERIFIED (blog) |
| → Implied odds for an elite-tech seat | ≈ 1.2% of JEE Main candidates (≈1 in 83); ≈ 5% for any central-institute seat | % | 2025 | derived | ±0.5 pp | derived |
| Medical entrance (NEET-UG) candidates | ≈ 20.9 lakh appeared (≈ 22.7–23.4 lakh registered); 12.4 lakh qualified | persons | 2025 | NTA via Careers360 / ETV Bharat — https://www.etvbharat.com/en/!bharat/over-12-lakh-qualify-neet-ug-2025-enn25062402458 | ±5% | V2 |
| MBBS seats | 1.18 lakh at the start; ≈ 1.29 lakh after additions (about half government) | seats | 2025-26 | NMC via Careers360 — https://news.careers360.com/neet-ug-2025-counselling-nmc-adds-11500-medical-round-3-choice-filling-total-mbbs-seats-india-rises-1-29-lakh-mcc-nic-in | ±5% | V2 |
| → Implied odds | ≈ 6% of candidates get any MBBS seat; ≈ 3% get a low-fee government seat | % | 2025 | derived | — | derived |
| Fees at public elite-tech institutes | ≈ ₹2–2.5 lakh/yr tuition, with income-linked fee waivers | ₹/yr | 2024 | institute fee notices | ±20% | UNVERIFIED |
| Private MBBS fees | ₹10–25 lakh/yr (total ₹60 lakh–1.2 crore) | ₹/yr | 2024 | state fee committees | wide | UNVERIFIED |
| Education loans | Collateral-free up to ≈ ₹7.5 lakh (CGFSEL). Interest subsidy (CSIS) during study for family income < ₹4.5 lakh. PM-Vidyalaxmi (2024) for top institutions. Rates ≈ 8–11% | — | 2024-26 | MoE / IBA scheme | — | UNVERIFIED |
| Dropout reasons (ages 6–29) | mainly financial constraints, being engaged in domestic or economic activity, and lack of interest. For girls, also marriage and domestic duties | qualitative | 2017-18 | NSS 75th round education report | — | UNVERIFIED |

## 4. Earnings by education, unemployment, wage growth

| Item | Value | Unit | Year | Source | Band | Status |
|---|---|---|---|---|---|---|
| Unemployment rate, graduates (15+) | 13.0% (17.2% in 2019-20; 13.4% in 2022-23) | % | 2023-24 | PLFS via Rajya Sabha answer — https://rsdebate.nic.in/bitstream/123456789/757437/1/PQ_267_13032025_U1693_p1124_p1124.pdf | ±1 pp | V2 |
| Unemployment, postgraduates | 12.4% | % | 2023-24 | same | ±1 pp | V2 |
| Graduate youth unemployment | 29.1% (women 34.5%, men 26.4%) | % | 2022 | ILO–IHD IER 2024 — https://www.iasgyan.in/daily-current-affairs/india-employment-report-2024 | 25–32% | V2 |
| Youth unemployment (all) | 12.4% | % | 2022 | same | — | V2 |
| Share of the unemployed who are youth | ≈ 83% | % | 2022 | same | — | V2 |
| Educated share of unemployed youth | 65.7% (35.2% in 2000) | % | 2022 | same | — | V2 |
| Earnings premium by education | Regular-salaried graduates earn about 2–2.5× workers with secondary education. Earnings rise with age to about 45–50, then flatten | ratio | 2020s | IER 2024; PLFS unit data | wide | UNVERIFIED |
| Real wage growth | casual wages roughly +2–3%/yr real (2012–22); regular salaried wages flat to slightly negative in real terms 2019–24 | %/yr | 2012–24 | IER 2024 | ±2 pp | UNVERIFIED |

## 5. Financial access, savings and returns

| Item | Value | Unit | Year | Source | Band | Status |
|---|---|---|---|---|---|---|
| Account ownership (15+) | 89% (77.5% in 2021, 35% in 2011). About 16% of account owners have no active account | % adults | 2024 (Findex 2025) | World Bank Global Findex 2025 (CC BY 4.0) — https://www.worldbank.org/en/publication/globalfindex ; reported by https://affairscloud.com/wbs-global-findex-report-2025-india-maintains-89-financial-account-ownership-faces-high-inactivity-rates/ | 87–96% (sources disagree) | V2 |
| Women with a bank account they use themselves | 78.6% (53.0% in 2015-16) | % women 15–49 | 2019-21 | NFHS-5 India fact sheet — https://dhsprogram.com/pubs/pdf/OF43/NFHS-5_India_and_State_Factsheet_Compendium_Phase-II.pdf | ±2 pp | V |
| Demat accounts | 21.6 crore (CDSL 17.3 crore, NSDL 4.3 crore). Unique investors are far fewer, roughly 11–12 crore (UNVERIFIED) | accounts | Dec 2025 | SEBI/depositories via Business Standard — https://www.business-standard.com/amp/markets/capital-market-news/overall-tally-of-dmat-accounts-in-india-hits-21-crore-125120800942_1.html | — | V2 |
| Household gold stock | 25,000 t (WGC reference); later estimates 27,871 t (2025) | tonnes | 2019–25 | World Gold Council via Business Today — https://businesstoday.in/latest/economy-politics/story/indian-households-have-stocked-up-to-25000-tonnes-of-gold-world-gold-council-202147-2019-05-21 | 24k–35k t | V2 |
| Gold as a share of household wealth | ≈ 11–15%. Jewellery is common across all income levels, as savings and as gifts | % | 2018-19 | AIDIS / RBI household-finance committee (2017) | — | UNVERIFIED |
| Self-help groups | ≈ 9–10 million SHGs with ≈ 100 million women (DAY-NRLM) | count | 2024-25 | MoRD | ±10% | UNVERIFIED |
| Chit funds | Regulated by the Chit Funds Act 1982 (registered schemes); unregistered ones are common. Members bid for the monthly pot. Effective returns or costs of roughly 8–15% | — | — | — | — | UNVERIFIED |
| EPF interest rate | 8.25% (2023-24, 2024-25); 8.15% (2022-23); 8.10% (2021-22) | %/yr | FY25 | EPFO CBT — https://www.business-standard.com/amp/finance/personal-finance/govt-keeps-epf-rate-at-8-25-for-fy25-here-s-what-it-means-for-you-125052600835_1.html | ±0.3 pp | V2 |
| PPF interest rate | 7.1% (NSC 7.7%, Sukanya Samriddhi 8.2%, KVP 7.5%) | %/yr | Q3 FY27 (Oct–Dec 2026) | MoF notification 30 Sep 2026, via https://www.businesstoday.in/personal-finance/story/small-savings-scheme-interest-rates-unchanged-for-q3-fy27-check-ppf-scss-ssy-rates-558892-2026-09-30 | ±0.3 pp | V2 |
| RBI policy repo rate | 5.50% (raised from 5.25% on 7 Oct 2026; stance "calibrated tightening") | % | Oct 2026 | RBI MPC — https://www.scconline.com/blog/post/2026/10/09/rbi-hikes-repo-rate-to-5-50-percent-october-2026/ | — | V2 |
| CPI inflation | 5.54% y/y (food 7.74%), new 2024-base series | % | Sep 2026 | MoSPI press release — https://www.mospi.gov.in/uploads/latestreleasesfiles/1791801549227-Press%20Release%20for%20the%20month%20of%20September,%202026.pdf | — | V2 |
| CPI long-run average | ≈ 6–7%/yr (2000–2025). Above 9% in 2009–13; about 4–5% from 2015 to 2019 | %/yr | 2000–25 | MoSPI / RBI DBIE series | ±1 pp | UNVERIFIED |
| 1-yr FD (largest public bank) | ≈ 6.25–6.50% (seniors +0.5 pp) | %/yr | 2026 | bank rate cards via BankBazaar (aggregator) | ±0.5 pp | UNVERIFIED |
| Real FD return, snapshots | Aug 2012: 9% FD vs 10% CPI → −1%. Aug 2015: 7.75% vs 3.66% → +3.8%. May 2022: 5.3% vs 7.04% → −1.7%. Long-run average ≈ 0 to +1.5% real before tax; often negative after tax | % real | 2000–25 | Business Standard 2015 — https://www.business-standard.com/amp/article/finance/reserve-bank-rate-cut-will-not-hit-depositors-115092901419_1.html ; CARE/Mint 2022 — https://www.careratings.com/Uploads/media/20062022012538_Deposit_rates_are_up_but_real_returns_are_still_in_the_negative_zone_Mint.pdf | −3 to +4 pp in any one year | V2 (points); average UNVERIFIED |
| Nifty 50 long-run return | TRI 12.74% CAGR; price 11.23% CAGR (3 Nov 1995 – 27 Feb 2026) | %/yr nominal | 1995–2026 | NSE press release — https://nsearchives.nseindia.com//web/pressrelease/2026-03/PR_cc_09032026_20260309214332.pdf | ±1 pp | V2 |
| → Real equity return | ≈ 6% real (TRI 12.7% minus CPI ≈ 6.5%) | %/yr | 1995–2026 | derived | ±1.5 pp | derived |
| Nifty drawdowns | −57% (Jan 2008 – Mar 2009); −38% (Feb–Mar 2020) | % | — | Bajaj AMC — https://www.bajajamc.com/knowledge-centre/nifty-50-historical-returns | — | V2 |
| Nifty annual volatility | ≈ 20–25% (s.d. of annual returns); ≈ 15–18% in calm years | % | — | NSE factsheets | ±5 pp | UNVERIFIED |

## 6. Taxes

| Item | Value | Year | Source | Status |
|---|---|---|---|---|
| New (default) personal income-tax regime slabs | 0–4 lakh: 0%; 4–8 lakh: 5%; 8–12 lakh: 10%; 12–16 lakh: 15%; 16–20 lakh: 20%; 20–24 lakh: 25%; >24 lakh: 30%. Plus 4% health & education cess. Surcharge applies above ₹50 lakh (UNVERIFIED detail) | FY 2025-26; unchanged in Budget 2026 | Budget 2025 / Income-tax Dept; summary https://housing.com/news/income-tax-slab-india/ ; https://www.businesstoday.in/amp/personal-finance/tax/story/tax-slabs-rebates-tds-limits-major-income-tax-changes-effective-from-april-1-2025-check-details-469488-2025-03-26 | V2 |
| Rebate u/s 87A | up to ₹60,000, so zero tax up to ₹12 lakh taxable income (≈ ₹12.75 lakh for salaried people after the ₹75k standard deduction). Not available on special-rate income such as capital gains | FY 2025-26 | same | V2 |
| New law | Income-tax Act 2025 in force from tax year 2026-27; rates carried over | 2026 | finnovate (secondary) | V2 |
| Listed equity STCG (≤12 months) | 20% | from 23 Jul 2024 | Budget 2024 — https://www.outlookmoney.com/news/budget-2024-25-ltcg-raised-to-125-what-it-means-for-you | V2 |
| Listed equity LTCG (>12 months) | 12.5% on gains above ₹1.25 lakh/yr, no indexation | from 23 Jul 2024 | same | V2 |
| Interest income (FD) | taxed at slab rate; TDS 10% above a threshold | — | — | UNVERIFIED (detail) |
| EPF/PPF | PPF interest is tax-exempt. EPF interest on employee contributions above ₹2.5 lakh/yr is taxable | — | — | UNVERIFIED (detail) |
| GST structure ("GST 2.0") | 5% (merit/essentials), 18% (standard), 40% (demerit: tobacco, luxury cars, etc.). 12% and 28% slabs abolished. Many unprocessed foods are 0%. About 99% of former 12% items moved to 5% | from 22 Sep 2025 | 56th GST Council, 3 Sep 2025 — https://www.godrejcapital.com/media-blog/knowledge-centre/gst-rates-in-india | V2 |
| GST effect on cost of living | For gameplay: effective GST on a typical urban basket ≈ 6–9% (more on durables and services; food is mostly 0–5%). Indirect taxes weigh more on the poor relative to income | — | derived | UNVERIFIED |
| Share filing income tax | ≈ 7–9 crore returns filed; most filers pay zero tax | — | CBDT | UNVERIFIED |

## 7. Pensions and social protection

| Item | Value | Unit | Year | Source | Status |
|---|---|---|---|---|---|
| EPF contribution | 12% employee + 12% employer (8.33% of the employer share goes to EPS pension, capped wage ₹15,000). Mandatory in firms with ≥20 workers | % of basic wage | current | EPFO | UNVERIFIED (well-established) |
| EPFO net monthly payroll additions | ≈ 19–20 lakh/month | persons | 2024-25 | Labour Ministry PIB — https://www.tribuneindia.com/news/business/epfo-logs-record-members-addition-in-may-2025-at-20-06-lakh | V2 |
| EPFO contributing members | ≈ 7–8 crore | persons | 2024-25 | EPFO annual report | UNVERIFIED |
| NPS subscribers | 1.65 crore (incl. ≈ 12 lakh private-sector additions in FY25) | persons | Mar 2025 | PFRDA via Outlook Money — https://www.outlookmoney.com/retirement/pension/national-pension-system-nps-private-subscriber-grew-more-than-12-lakh-in-fy25-aum-up-by-23-per-cent | V2 |
| Atal Pension Yojana (informal workers) | 7.6 crore subscribers. Guaranteed pension of only ₹1,000–5,000/month | persons | Mar 2025 | same | V2 |
| NPS + APY AUM | ₹14.43 lakh crore | ₹ | Mar 2025 | same | V2 |
| Social security among regular employees | 53.4% have none (see §2) | % | 2023-24 | PLFS | V2 |
| Older adults (60+) with organised-sector or government pension | ≈ 20% | % | 2017-18 | LASI Wave 1, HDCA 2024 abstract — https://nomadit.co.uk/conference/hdca2024/p/15467 | V2 (weak) |
| Older adults financially dependent on others | ≈ 50%. About 40% have no personal income source | % | 2017-18 | IIPS LASI paper — https://www.iipsindia.ac.in/sites/default/files/23_03_Ecowellbeing_ISEC.pdf | UNVERIFIED (may cite an earlier study) |
| Old-age support by children | Most older adults live with an adult child (≈ 70%+); adult sons are the main source of old-age support. Social pensions (NSAP) pay ₹200–500/month central share plus state top-ups | — | — | LASI W1 India report | UNVERIFIED |

## 8. Health

| Item | Value | Unit | Year | Source | Status |
|---|---|---|---|---|---|
| Life expectancy at birth | 72.0 (men 70.5, women 73.6) | years | 2023 | World Bank WDI (CC BY 4.0) — https://fred.stlouisfed.org/series/SPDYNLE00ININD | V2 |
| Life expectancy (national SRS) | 69.7 (men 68.4, women 71.1) for 2015-19. 2019-23 figures (≈68.5 / 72.5) are only secondary | years | 2015-19 | ORGI SRS abridged life tables | V2 / UNVERIFIED for 2019-23 |
| Out-of-pocket share of total health expenditure | 39.4% (62.6% in 2014-15) | % | 2021-22 | National Health Accounts (MoHFW) — https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/oct/doc2024104408201.pdf | V2 |
| Total / government health expenditure | 3.83% / 1.84% of GDP | % GDP | 2021-22 | same | V2 |
| Catastrophic health expenditure (>10% of consumption) | ≈ 13–20% of households in recent studies (peak 23.5% in 2014). Hospitalisation in a private hospital → about 72% of such households exceed 10% (injury study) | % | 2014–18 | SAGE study DOI 10.1177/09720634231153226; NSS 75th round studies, e.g., https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8664228/ | V2 (range) |
| Borrowing to pay for hospitalisation | 13.4% rural / 8.5% urban households | % of hospitalisation cases | 2017-18 | NSS 75th round (as cited) | V2 (secondary) |
| Households with any member covered by health insurance or financing | 41.0% (urban 38.1%, rural 42.4%; 28.7% in 2015-16). PM-JAY was not yet fully counted | % households | 2019-21 | NFHS-5 fact sheet (DHS link in §5) | V |
| PM-JAY (Ayushman Bharat) | ₹5 lakh/family/yr hospital cover for roughly the poorest 40% of households (≈ 12 crore families, ≈ 55 crore people). Extended to everyone aged 70+ regardless of income (Vay Vandana, Oct 2024). Inpatient care only | — | 2024-26 | NHA; news — https://www.outlookbusiness.com/ampstories/news/70-indians-now-get-rs-5-lakh-free-medical-checkup-all-you-need-to-know | V2 (70+); UNVERIFIED (family and person counts) |
| Mental-health treatment gap | 28–83% depending on the disorder (alcohol use disorders 86%). About 150 million people need care | % | 2015-16 | NMHS 2015-16 (NIMHANS) — https://ruralindiaonline.org/en/library/resource/national-mental-health-survey-of-india-2015-16-summary/ | V2 |
| Mental-disorder prevalence | men 13.9%, women 7.5%. Overall current prevalence 10.6% | % adults | 2015-16 | same; 10.6% UNVERIFIED | V2 / UNVERIFIED |

## 9. Family

Handle neutrally. Family structures vary widely by region and urban or rural setting. Do not attach these patterns to any community.

| Item | Value | Unit | Year | Source | Status |
|---|---|---|---|---|---|
| Total fertility rate | 2.0 (urban 1.6, rural 2.1; 2.2 in 2015-16) | children/woman | 2019-21 | NFHS-5 fact sheet | V |
| Women 20–24 married before 18 | 23.3% (urban 14.7%, rural 27.0%) | % | 2019-21 | same | V |
| Men 25–29 married before 21 | 17.7% | % | 2019-21 | same | V |
| Median age at first marriage, women 20–49 | 19.2 (no schooling 17.1; 12+ years of schooling 22.8). Men ≈ 24–25 (UNVERIFIED) | years | 2019-21 | NFHS-5 report via ThePrint — https://theprint.in/india/25-women-aged-18-29-15-men-aged-21-29-married-before-reaching-legal-age-nfhs-5/945423/ | V2 |
| Legal minimum marriage age | women 18, men 21 | years | — | Prohibition of Child Marriage Act 2006 | UNVERIFIED (well-established) |
| Family-arranged marriages | About 95% of ever-married women 15–49 said their family was involved in choosing the spouse. 55% had some input themselves (77% of college-educated women). About 5% chose without family input (≈34% in the North-East). 65% met their husband only around the wedding | % | 2011-12 | IHDS-II, NCAER brief — https://ndic.ncaer.org/how-much-agency-do-indian-women-have-in-marriage-choices/ | V2 |
| Divorced / separated | Divorced: 0.24% of ever-married people (0.11% of population). Separated: 0.61% of married people. About 2/3 of divorced or separated people are women. Separation without formal divorce is more common. Data limits: Census 2011 is the latest; the stigma means under-reporting | % | 2011 | Census 2011 via IJPS — https://article.accscience.com/read-online/full-issue/IJPS/11-3/files/basic-html/page34.html | V2 |
| Joint or extended households | ≈ 1/4 of households have more than one married couple or several generations. Most older adults live with a child | % | — | Census 2011 household tables / NFHS | UNVERIFIED |
| Dowry | Illegal under the Dowry Prohibition Act 1961, but still a documented practice in many places. **Recommendation: no event mechanics.** At most, mention it neutrally as a background social and economic pressure. Never model it as a choice the player can make | — | — | — | (policy note) |
| Female LFPR (15+, usual status) | 41.7% (37.0% in 2022-23; 23.3% in 2017-18). Men 78.8%. Female worker-population ratio 40.3% | % | 2023-24 | MoSPI PLFS press note — https://mospi.gov.in/sites/default/files/press_release/Press_note_AR_PLFS_2023_24_22092024.pdf | V2 |
| Drivers of female LFPR | Much of the recent rise is rural self-employment or unpaid family work. Participation is U-shaped by education (lowest among women with secondary schooling). Other drivers: care burden, safety and transport, social norms on mobility, and few suitable local jobs. Women who worked in the last 12 months and were paid in cash: 25.4% | — | 2019-24 | NFHS-5 (25.4% V); drivers from IER 2024 and the literature | V (25.4%) / UNVERIFIED (drivers) |
| Women owning house and/or land (alone or jointly) | 43.3% | % | 2019-21 | NFHS-5 | V |

## 10. Housing

| Item | Value | Unit | Year | Source | Status |
|---|---|---|---|---|---|
| Owner-occupied households | ≈ 87% all-India (2011). Urban ≈ 67–69% owners, ≈ 28–31% renters | % | 2001–11 | Census via MoSPI — https://mospi.gov.in/sites/default/files/reports_and_publication/cso_research_and_publication_unit/COSIOIESIOTSDVOL-2/Pages%20from%20Housing-4.13.pdf | V2 (2001 urban 66.8% / 28.5%); 2011 urban split UNVERIFIED |
| Metro rents | 1-BHK in a big metro ≈ ₹15–40k/month; 2–3 BHK in upper-middle areas ≈ ₹35k–1.5 lakh/month. Gross rental yield ≈ 2–3.5% | ₹/month | 2025-26 | property portals | UNVERIFIED |
| House price growth (RBI HPI, 10 cities) | +3.1% to +4.3% y/y nominal across FY25 quarters (Q4 FY25 +3.1%; city range −2.3% to +8.8%). That is roughly flat to slightly negative in real terms | % y/y | 2024-25 | RBI — https://website.rbi.org.in/mr/web/rbi/-/press-releases/all-india-house-price-index-hpi-for-q4-2024-25 | V2 |
| Stamp duty + registration | Stamp duty ≈ 5–7% of property value, depending on the state (often 1–2 pp lower for women buyers). Registration ≈ 1% | % | 2025 | state revenue departments | UNVERIFIED |
| Home-loan rate | ≈ 7.25–8.5% (good credit, largest bank); repo-linked, so it rose after the Oct 2026 hike | %/yr | Oct 2026 | aggregators — https://www.newsbytesapp.com/news/business/banks-update-home-loan-interest-rates-on-october-16-2026/tldr | UNVERIFIED (aggregator) |
| LTV caps (RBI) | ≤ ₹30 lakh: 90%; ₹30–75 lakh: 80%; > ₹75 lakh: 75% | % of value | since 2015 (risk weights revised later) | RBI notification 2015 — https://www.business-standard.com/amp/article/finance/rbi-cuts-risk-weight-for-individual-home-loans-115100800931_1.html | V2. Check the current Master Direction |
| Informal settlements | 17.4% of the urban population in slum-reporting towns (2011). In a few megacities the share is about 40% (UNVERIFIED) | % | 2011 | see §1 | V2 |
| Shelters for urban homeless | DAY-NULM "Shelter for Urban Homeless" (SUH) scheme. Capacity is far below need | — | — | MoHUA | UNVERIFIED |

## 11. Migration

| Item | Value | Unit | Year | Source | Status |
|---|---|---|---|---|---|
| Internal migration rate (by last usual residence) | 28.9% of population (rural 26.5%, urban 34.9%). Women 47.9% vs men ≈ 10.7% (UNVERIFIED). Marriage accounts for 86.8% of women's moves; work is the main reason for men's | % | Jul 2020–Jun 2021 | MoSPI "Migration in India 2020-21" — https://ruralindiaonline.org/en/library/resource/migration-in-india-2020-2021 | V2 |
| Indians in the Gulf (GCC) | ≈ 9–9.8 million: UAE 3.6–4.3 million, Saudi Arabia 2.6 million, Kuwait 1.0 million, Qatar 0.83 million, Oman 0.67 million, Bahrain 0.33 million | persons | 2024 | MEA / Parliament — https://www.wam.ae/en/article/b4dfcy1-gcc-countries-host-nine-million-indians ; MEA annex https://www.mea.gov.in/Images/CPV/4406-english-2026.pdf | V2 |
| Gulf migration mechanics (for gameplay) | Mostly employer-sponsored, temporary contracts. Recruitment fees and debt are common for low-wage workers. Families can't settle permanently. Emigration Check Required (ECR) passports for people with less than 10 years of schooling | — | — | MEA eMigrate | UNVERIFIED |
| US H-1B lottery | FY2026: ≈ 344k eligible registrations, ≈ 120k selected (≈ 35%). FY2027: wage-weighted selection (1–4 entries by wage level), estimated 34–42%. Indians receive about 70% of H-1B approvals (UNVERIFIED) | % | FY26–27 | Wolfsdorf (law firm, third-party) — https://wolfsdorf.com/h-1b-cap-fy2027-lottery-results-next-steps/ ; official: USCIS H-1B cap pages | V2 (third-party); confirm with USCIS |
| UK visitor-visa refusal, Indian nationals | ≈ 10–18% (grant rate ≈ 82–91% in recent years). Sponsored study grants ≈ 96% | % | 2024–26 | Home Office Immigration System Statistics, table Vis_D02 (Open Government Licence v3.0) — https://westminsterbrief.co.uk/archive/pq/110365 ; blog figures UNVERIFIED | UNVERIFIED (blog); primary table named |
| Canada study permits | Approval rates for Indian applicants fell sharply after the 2024 caps (approval roughly ≤ 50%) | % | 2024-25 | IRCC open data | UNVERIFIED |
| Germany | Fast-growing destination for students (≈ 50–60k Indian students; tuition-free public universities) and skilled workers (EU Blue Card) | — | 2024-25 | DAAD / Destatis | UNVERIFIED |
| Remittance inflows | US$129.4 billion (RBI, 2024). World Bank estimate US$129 billion for 2024, the world's largest | US$ | 2024 | World Bank blog (CC BY 4.0) via https://www.business-standard.com/amp/economy/news/at-129-bn-india-top-recipient-of-remittances-this-year-world-bank-124121801266_1.html ; RBI via https://www.policycircle.org/economy/india-remittances-in-2024 | V2 |

## 12. Open items (UNVERIFIED — re-check before shipping)

1. Self-employed earnings, PLFS 2023-24, earnings statement.
2. Stamp duty by state, urban rents, home-loan rates (official bank pages).
3. Nifty annual volatility (NSE factsheet), a long-run FD vs CPI series (RBI DBIE).
4. Self-help group and chit fund figures; share of wealth held in gold.
5. PM-JAY person and family counts; NMHS overall prevalence of 10.6%; SRS life tables 2019-23.
6. EPFO active contributors; LASI share of older adults living with children or dependent on them.
7. Fees at elite technical institutes and private medical colleges; education-loan schemes.
8. Canada, Germany and UK refusal or approval rates (official tables).
9. Joint-household share; median age at marriage for men.
10. FLFPR drivers (cite the IER 2024 chapter).
