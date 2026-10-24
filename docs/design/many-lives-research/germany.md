# Calibration sheet: "Central Europe (calibrated on Germany)"

**Second pass (2026-10-21).** Changed: net equivalised income percentiles now V-P (Eurostat EU-SILC ilc_di01: P10 14,556 / median 28,891 / P90 54,971 EUR/yr, 2025 survey); age–earnings profile now V-P from Eurostat SES 2022 (hourly pay 50+ ≈ 1.6× under-30s); real-wage path filled for 2009–2025 (V-S; 2000–2008 still UNVERIFIED); Kappungsgrenze V-P (§ 558 (3) BGB text; the "11 %" proposal not found); Selbstbehalt 1,450 / 1,200 EUR now V-S; Chancenkarte work rules (20 h/week, 2-week trials) and English C1 V-P from § 20a/§ 20b text (the points table in the annex is still UNVERIFIED); purchase prices per m² by metro now V-S (ImmoScout24 Q4 2025); consumption basket: added Eurostat HICP 2025 weights (V-P, but a different concept from LWR). Still UNVERIFIED: job-finding rates, unemployment rate for vocational qualification, LWR 2024 shares, rural price levels, price-to-rent ratios.

For the "Many Lives" life-simulation. Research date: 2026-10-18. All money values are EUR (nominal unless noted).

**How to read the verification status**
- **V-P**: checked against a primary source (Destatis, Bundesbank, BA, DRV, RKI, government or peer-reviewed text). The page was opened directly or quoted in search snippets from that domain.
- **V-S**: the figure appears consistently in several secondary sources (news, advisory sites) that cite an official source. The primary page itself was not opened.
- **UNVERIFIED**: from background knowledge or a single non-authoritative source. Check it before shipping.

The web-search budget ran out before every item could be checked. Every UNVERIFIED row is a to-do.

**Licence notes (check before redistributing any data file)**
- **Destatis / GENESIS**: Datenlizenz Deutschland – Namensnennung 2.0 (DL-DE-BY 2.0). Attribution: "© Statistisches Bundesamt (Destatis), <year>".
- **Bundesbank** (PHF results): may be reproduced with attribution under the Bundesbank's terms of use. This is not DL-DE. Check the imprint terms.
- **OECD** (Pensions at a Glance, Education at a Glance): CC BY 4.0 for OECD content published since July 2024 (UNVERIFIED for the specific tables).
- **RKI Journal of Health Monitoring**: CC BY 4.0 (open access).
- **BA statistics**: free reuse with attribution ("Quelle: Statistik der Bundesagentur für Arbeit").
- **DZHW, CHE, IAB, WSI, DAK, Kleven et al. (AEA)**: copyrighted publications. We use only the facts (numbers), which are not copyrightable. Cite them and copy no text, figures or tables verbatim.
- **Statutes** (EStG, SGB, BEEG, AufenthG): official works are in the public domain (§ 5 UrhG).
- **Düsseldorfer Tabelle**: a court guideline. Treat it as a public official work and cite it.

**Fictionalisation note.** The region profile should present these figures as "calibrated on Germany". Rename the institutions in game (for example, "basic income support" rather than Bürgergeld). Keep a mapping table in the design docs only.

---

## 0. Two household starts (derived archetypes)

| Archetype | Composition | Monthly cash (2026) | Basis |
|---|---|---|---|
| **A. Basic income support family** | 2 adults + 2 children (ages 4 and 9) | Standard rates 506+506+357+390 = **1,759** + housing and heating costs (KdU) at actual "appropriate" cost (≈ 700–1,000 in a mid-size city) + Kindergeld 2×259 = 518, **counted as income**, so it is offset against support. Net support ≈ 1,759 + KdU − 518 + education package | Standard rates V-P (see §1). KdU level UNVERIFIED |
| **B. Middle-class family** | 2 adults (skilled trades + office, one part-time) + 2 children | Gross ≈ 4,125 (full-time, vocational qualification) + ≈ 2,000 (part-time) per month. Kindergeld 518 | Earnings V-P (Destatis 4/2025, see §3) |

The average total benefit entitlement per household receiving support was **1,349 EUR/month** in March 2025, of which about **594 EUR** was housing costs (KdU share UNVERIFIED: the snippet was truncated). Source: [Bundestag Drucksache 21/6544](https://dserver.bundestag.de/btd/21/065/2106544.pdf).

---

## 1. Income, wealth, basic income support

### 1a. Income distribution

| Item | Value | Unit | Year | Band | Source | Status |
|---|---|---|---|---|---|---|
| At-risk-of-poverty threshold (60 % of median), single person | 1,446 | EUR net/month | EU-SILC 2025 (2024 incomes) | ±3 % | [Destatis PM 039/2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/02/PD26_039_63.html) | V-P |
| Same threshold, 2 adults + 2 children under 14 | 3,036 | EUR net/month | 2025 | ±3 % | same | V-P |
| Implied median equivalised net income | ≈ 2,410 | EUR/month (≈ 28,900 per year) | 2025 | ±3 % | derived (1,446 / 0.6) | derived |
| Poverty-risk rate, total population | 16.1 % | share of persons | 2025 | ±0.5 pp | same | V-P |
| Poverty-risk rate, single parents / people living alone | 28.7 % / 30.9 % | share | 2025 | ±2 pp | same | V-P |
| Median full-time gross earnings (individual, annual incl. bonuses) | 54,066 | EUR/year | 2025 | ±2 % | [Destatis PM 113/2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/04/PD26_113_621.html) | V-P |
| Equivalised net income percentiles P10 / P25 / P50 / P75 / P90 (per person, annual) | **14,556 / 20,553 / 28,891 / 40,176 / 54,971** (P95 67,391; P99 111,693). Previous survey: 14,325 / 19,914 / 27,619 / 38,216 / 51,787. Ratios: P10 ≈ 0.50×, P90 ≈ 1.90× the median | EUR/year | EU-SILC 2025 (2024 incomes) | ±3 % | Eurostat ilc_di01 (top cut-off points, EUR), queried via the Eurostat API: https://ec.europa.eu/eurostat/databrowser/view/ilc_di01/default/table (Eurostat data: CC BY 4.0). The median matches the Destatis poverty threshold (1,446 × 12 / 0.6 ≈ 28,920) | V-P |

### 1b. Wealth (Bundesbank PHF 2023, published April 2025)

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Median net wealth per household | 103,200 EUR (nominal) | 2023 | ±10 % (survey) | [Bundesbank Monthly Report Apr 2025](https://publikationen.bundesbank.de/publikationen-en/reports-studies/monthly-reports/household-wealth-and-finances-in-germany-results-of-the-2023-household-wealth-survey-954660) | V-P |
| Mean net wealth | 324,800 EUR | 2023 | ±10 % | same | V-P |
| P10 | ≈ 800 EUR | 2023 | wide | same | V-P |
| P90 | ≈ 780,000 EUR (P90/median = 7.6; P90 − P10 = 779,000) | 2023 | ±15 % | same (derived) | V-P / derived |
| P75 − P25 (interquartile range) | 390,000 EUR | 2023 | | same | V-P |
| Top 10 % share of net wealth | **54 %** | 2023 | ±4 pp | same. Secondary press says ">60 %"; use the primary figure. | V-P |
| Gini (net wealth) | 0.72 | 2023 | ±0.02 | [Bundesbank article](https://www.bundesbank.de/de/aufgaben/themen/bundesbank-studie-vermoegen-in-deutschland-steigen-nominal-gehen-aber-real-zurueck-ungleichheit-bleibt-unveraendert-954622) | V-P |
| Median wealth, tenants | 18,300 EUR | 2023 | ±15 % | Monthly Report | V-P |
| Median wealth, owners with mortgage / without mortgage | 379,900 / 450,200 EUR | 2023 | ±10 % | Monthly Report | V-P |
| Owner-occupier share of households | 42 % (West 45 %, East 29 %) | 2023 | ±2 pp | Monthly Report | V-P |

### 1c. Basic income support (Bürgergeld, since 1 July 2026 renamed "Grundsicherungsgeld")

The new Grundsicherung law was passed by the Bundestag on 5 March 2026 and by the Bundesrat on 27 March 2026, promulgated on 22 April 2026, and has applied since 1 July 2026. Standard rates are unchanged. Sanctions are stricter: a 30 % cut for 3 months for breaches of duty, payments can stop after 3 missed appointments, housing costs are capped (reportedly at 1.5× the appropriateness benchmark), and the asset grace period was removed. Sources: [Bundestag vote](https://www.bundestag.de/parlament/plenum/abstimmung/abstimmung?id=995), [beck-aktuell](https://www.beck-aktuell.de/heute-im-recht/rechtspolitik-gesetzgebung/buergergeld-bundestag-beschliesst-reform-2026-03-05), [Nordkurier summary](https://www.nordkurier.de/politik/buergergeld-ist-geschichte-das-ist-neu-bei-der-grundsicherung-4412686). Status: V-S. The details of the housing-cost cap are UNVERIFIED.

| Standard rate (Regelbedarfsstufe) | 2026 EUR/month | Status |
|---|---|---|
| Single adult / single parent (RBS 1) | 563 | V-S. Zero increase in 2025 and 2026 under the "Besitzschutz" rule (the formula would have given 557) |
| Each partner in a couple (RBS 2) | 506 | V-S |
| Adults in institutions / under 25 living with parents (RBS 3) | 451 | V-S (sources disagree on which group this level applies to) |
| Teenager aged 14–17 | 471 | V-S |
| Child aged 6–13 | 390 | V-S |
| Child aged 0–5 | 357 | V-S |
| Housing and heating (KdU) | actual rent and heating if "appropriate" (local benchmark) | V-S |

Sources: [finanz.de](https://www.finanz.de/news/artikel-10497/), [Stuttgarter Zeitung](https://www.stuttgarter-zeitung.de/wirtschaft/erhoehung-buergergeld-2026-mhsd-79220153.html). Uncertainty: the 2027 rate is not known. Modelling assumption for 2027: 0–2 % increase (UNVERIFIED).

| Recipients | Value | Year | Source | Status |
|---|---|---|---|---|
| Benefit recipients (Regelleistungsberechtigte) | ≈ 5.2 million (5.32 million average in 2025) | May 2026 | [BT-Drs. 21/6855](https://dserver.bundestag.de/btd/21/068/2106855.pdf) (BA data) | V-P |
| Employable recipients (ELB) | 3.90 million | average 2025 | same | V-P |
| Households receiving support (Bedarfsgemeinschaften) | ≈ 2.8 million | May 2026 | same | V-P |
| Share of the population | ≈ 6.2 % of 83.5 million | 2026 | derived | derived |
| Share of households | ≈ 6.8 % of ≈ 41 million households | 2026 | derived (household count UNVERIFIED) | derived |

### 1d. Related family transfers

| Item | Value | Year | Source | Status |
|---|---|---|---|---|
| Kindergeld (child benefit) | 259 EUR per child per month | 2026 | [ETL](https://www.etl.de/aktuelles/was-2026-fuer-steuerpflichtigen-wichtig-ist/) | V-S |
| Child tax allowances (Kinderfreibetrag + BEA) | 9,756 EUR per child per year (both parents together) | 2026 | same | V-S |
| Kinderzuschlag (supplement for low-income working families) | up to 297 EUR per child per month | 2026 | [nexvyra summary](https://nexvyra.de/fakten/kindergeldzuschlag-2026.html) | V-S (check with the Familienkasse) |

---

## 2. Education

| Item | Value | Year / data | Band | Source | Status |
|---|---|---|---|---|---|
| University entry, per 100 children with ≥1 academic parent | **79** | DZHW 2018 (school-entry cohorts around 2016) | ±5 | [DZHW press release](https://www.dzhw.eu/services/material/pressemitteilungen/PM_Bildungsbeteiligungsquoten.pdf), [Forschung & Lehre](https://www.forschung-und-lehre.de/lehre/nichtakademiker-knapp-ein-drittel-der-kinder-studiert-597/) | V-P |
| University entry, per 100 children of non-academic parents | **27** | same | ±4 | same; repeated in Hochschul-Bildungs-Report 2020 ([Stifterverband](https://stifterverband.org/download/file/fid/10426)) | V-P |
| Master's degree (academic vs non-academic parents) | 43 vs 11 per 100 | DZHW 2022 | ±4 | secondary | V-S |
| Doctorate (non-academic parents) | 2 per 100 (academic parents ≈ 10, UNVERIFIED) | DZHW 2022 | | secondary | V-S / UNVERIFIED |
| Gymnasium recommendation, child of a highly qualified academic parent | 64.5 % | IGLU 2021 analysis, published March 2026 (n = 4,188) | ±4 pp | [IFS Dortmund](https://ifs.ep.tu-dortmund.de/en/newsdetail/neue-iglu-auswertung-zur-gymnasialempfehlung-61061/) | V-P |
| Gymnasium recommendation, child of a parent in a simple skilled manual job | 22.6 % | same | ±4 pp | same | V-P |
| Gymnasium recommendation, all children | 43.3 % | same | | same | V-P |
| Gymnasium odds, upper class vs skilled-worker families, same reading and cognitive ability | ≈ 2.7× | IGLU 2006/2011 (Bos et al.) | 2.5–4× | [Böckler](https://www.boeckler.de/de/boeckler-impuls-gesellschaftliche-ungleichheit-in-der-schule-erlernt-6985.htm) | V-S |
| Gymnasium pupils whose parents have (Fach)Abitur | 67 % (vs 46 % across all school types; Hauptschule 16 %) | 2019 | | [bpb](https://www.bpb.de/kurz-knapp/zahlen-und-fakten/soziale-situation-in-deutschland/183038/schulbesuch-nach-schulabschluss-der-eltern/) | V-P |
| First-year students without (Fach)Abitur (studying via vocational qualification) | 2.7 % (≈ 13,100) | 2024 | ±0.3 pp | [CHE](https://studieren-ohne-abitur.de/wp-content/uploads/2025/03/CHE_kurz_und_kompakt_Studium-ohne-Abitur-1.pdf) | V-P |
| Graduates without Abitur | 10,270 | 2024 | | same | V-P |
| Bachelor dropout rate, universities | 35 % | graduating cohort 2020 (DZHW) | ±4 pp | [DZHW Tab. 2.5.90](https://guse.dzhw.eu/portal/de/Tabelle-2.5.90.pdf) | V-P |
| Bachelor dropout rate, universities of applied sciences | 20 % | same | ±4 pp | same | V-P |
| Bachelor dropout rate, all (German students) | 27 % | cohort 2018 | | [DZHW Brief 03/2020](https://www.dzhw.eu/services/material/pressemitteilungen/pm_dzhw_brief_03_200722.pdf) | V-P |
| BAföG maximum rate | 992 EUR/month (housing allowance 380 included) | WS 2026/27 | fixed | [studierenplus](https://www.studierenplus.de/bafoeg/bafoeg-hoechstsatz) | V-S |
| BAföG reform plan | Housing allowance 380 → 440 (from ~April 2027); basic need 475 → 503 → 563 (2027–2029). Cabinet approved 12 Aug 2026; not yet passed | 2026 | timing uncertain | [buerger-geld.org](https://www.buerger-geld.org/?p=42173) | V-S. Treat as a scenario |
| BAföG repayment rule | 50 % grant / 50 % interest-free loan, repayment capped at 10,010 EUR | statute | | — | **UNVERIFIED** |

**Second-chance routes (rules, simplified for the game)**

| Route | Rule summary | Status |
|---|---|---|
| Abendgymnasium / Kolleg | Adults (usually 19+, with a vocational qualification or ≥2 years of work) earn the Abitur in 3 years. The Kolleg is full-time and BAföG-eligible | UNVERIFIED (KMK agreement) |
| Fachoberschule / Fachabitur | 1–2 years after the intermediate school certificate; gives access to universities of applied sciences | UNVERIFIED |
| Studying without Abitur | Master craftsman / technician → general university access. Vocational training + 3 years' work → access to related subjects (KMK 2009) | UNVERIFIED (rules); share V-P (above) |
| Late (second-chance) Abitur via vocational school (Berufliches Gymnasium) | 3-year upper secondary track | UNVERIFIED |

---

## 3. Earnings

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Mean gross monthly pay, full-time, no vocational qualification | 3,432 | April 2025, excl. bonuses | ±3 % | [Destatis PM 103/2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/03/PD26_103_62.html) | V-P |
| Recognised vocational qualification (apprenticeship) | 4,125 | same | ±3 % | same | V-P |
| Master craftsman / technician / Fachschule | 5,405 | same | ±3 % | same | V-P |
| Bachelor's degree | 5,289 | same | ±3 % | same | V-P |
| Master's / Diplom | 7,019 | same | ±3 % | same | V-P |
| Doctorate | 9,476 | same | ±5 % | same | V-P |
| Median gross monthly pay, full-time (all) | 4,123 (mean 4,784) | April 2025 | ±2 % | Destatis via [frontaliers-grandest](https://frontaliers-grandest.eu/de/?p=64172) | V-S |
| Median annual gross incl. bonuses, full-time | 54,066 (mean 64,441) | 2025 | ±2 % | Destatis PM 113/2026 | V-P |
| By sector: finance (highest) / hospitality (lowest) | 6,279 / 3,185 mean monthly | April 2025 | | same | V-S |
| Tertiary vs upper-secondary earnings premium | +50 % (OECD average +54 %) | EAG 2025 (2023 data) | ±5 pp | [OECD EAG 2025 Germany note](https://www.oecd.org/en/publications/education-at-a-glance-2025_1a3543e2-en/germany_fa91d155-en.html) | V-P |
| Statutory minimum wage | 13.90 EUR/hour (2026), 14.60 EUR/hour (from 1 Jan 2027) | 2026–27 | fixed | [Bundesregierung](https://www.bundesregierung.de/breg-de/schwerpunkte/wirksam-regieren/mindestlohn-steigt-2391010) | V-P |
| Mini-job earnings limit | 603 EUR/month | 2026 | | [krankenkassen.de](https://www.krankenkassen.de/gesetzliche-krankenkassen/system-gesetzliche-krankenversicherung/sozialversicherung-rechengroessen-beitragsbemessungsgrenze-versicherungspflichtgrenze/rechengroessen-2026/) | V-S |
| Real wage growth | +1.9 % (nominal +4.2 %, CPI +2.2 %) | 2025 | ±0.3 pp | [Destatis PM 068/2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/02/PD26_068_62321.html) | V-P |
| Real wage index level | 2025 ≈ 2019 level (100 vs 100.5) | 2019–2025 | | same | V-P |
| Real wage index, annual change | 2009 −0.2; 2010 +1.5; 2011 +1.2; 2012 +0.5; 2013 −0.1; 2014 +1.7; 2015 +2.4; 2016 +1.8; 2017 +1.0; 2018 +1.4; 2019 +1.1; 2020 −1.2; 2021 0.0; 2022 −4.0; 2023 +0.1; 2024 +3.1; 2025 +1.9 (%). Series starts 2008; 2000–2008 ≈ flat is still UNVERIFIED | 2009–2025 | ±0.3 pp (revisions) | Destatis real wage index as reported by: Amt für Statistik Berlin-Brandenburg (Kleine Anfrage 6/2694, https://kleineanfragen.de/brandenburg/6/2694-einkommensentwicklung-versus-inflation.pdf) for 2009–2014; [der-betrieb](https://der-betrieb.de/meldungen/realloehne-im-jahr-2015-mit-25-prozent-stark-gestiegen) for 2015; [Statista/Destatis](https://de.statista.com/statistik/daten/studie/384228/umfrage/entwicklung-der-realloehne-nominalloehne-und-verbraucherpreise-in-deutschland) for 2016–2024; Destatis PM 068/2026 for 2025 | V-S (2025 V-P) |
| Collective bargaining coverage (sector-level agreements) | 41 % of employees (67 % in 1996) | 2024 | ±2 pp | IAB Betriebspanel via [WSI-Mitteilungen 4/2025](https://www.boeckler.de/data/wsimit_2025_04_hohendanner-1.pdf) | V-S |
| No agreement at all (West / East) | ≈ 50 % / 58 % | 2024 | | same | V-S |
| Age–earnings profile (mean gross hourly pay, firms ≥ 10 employees) | Under 30: **14.97**; 30–49: **23.51**; 50+: **24.35** EUR/hour (men 15.19 / 25.31 / 27.64; women 14.69 / 21.36 / 20.84). So 50+ ≈ **1.63×** under-30 (men 1.82×, women 1.42×). Annual pay, under-30 vs all ages: 34,307 vs 51,042 EUR (professionals 47,575 vs 73,798) | 2022 | ±3 % | Eurostat SES 2022, earn_ses22_13 and earn_ses22_28 (Germany publishes only these coarse age groups): https://ec.europa.eu/eurostat/databrowser/view/earn_ses22_13/default/table | V-P (computed). The finer shape (steep rise to ≈ 35, plateau 45–55, dip after 58) and the 2–2.5× graduate peak remain **UNVERIFIED** |

---

## 4. Labour market

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Registered unemployment rate (BA definition) | 6.3 % (2.948 million) | average 2025 | ±0.3 pp | [BA Jahresrückblick 2025](https://www.arbeitsagentur.de/presse/2026-02-jahresrueckblick-2025) | V-P |
| Unemployment rate, no vocational qualification | 20.9 % | 2024 | ±2 pp | IAB via [BIBB](https://www.bibb.de/dienst/publikationen/download/20879) | V-S |
| Unemployment rate, university graduates | 2.9 % (2024); >3 % in 2025 | 2024–25 | ±0.3 pp | [BA Akademiker](https://statistik.arbeitsagentur.de/DE/Statischer-Content/Statistiken/Themen-im-Fokus/Berufe/AkademikerInnen/Allgemeiner-Teil/1-7-Arbeitslosigkeit.html) | V-P |
| Unemployment rate, vocational qualification | ≈ 4–5 % | 2024 | | IAB | **UNVERIFIED** |
| Job-finding rate | BA: "historically low". Suggested model: monthly exit into employment ≈ 6–8 % for ALG I claimants, ≈ 2–3 % for basic-support recipients | 2025 | wide | BA | **UNVERIFIED** (level). Direction V-P |
| ALG I replacement rate | 60 % of flat-rate net pay (67 % with ≥1 child) | statute § 149 SGB III | fixed | [gegen-hartz summary](https://www.gegen-hartz.de/news/arbeitslosengeld-ab-60-hoehe-anspruch-und-dauer-in-2026) | V-S |
| ALG I qualifying period | ≥12 months of insured employment within 30 months | § 142 SGB III | | same | V-S |
| ALG I duration | 6 months (12 months insured) … 12 months (24 months insured, age <50); 15 months from age 50; 18 months from 55; 24 months from 58 with 48 months insured | § 147 SGB III | fixed | same | V-S |
| ALG I ceiling | contributions and benefits capped at 8,450 EUR gross/month | 2026 | | see §5 | V-P |
| Wage scarring after job loss | Large, persistent losses: about 15–25 % of earnings years later. Losses roughly double when displacement happens in a recession. They come mainly from lower wages (moving to lower-paying firms), not from time out of work | West Germany 1975–2009 | 10–30 % | Schmieder, von Wachter & Heining, [AER 2023](https://www.aeaweb.org/doi/10.1257/aer.20200252) | V-P |
| Heterogeneity in scarring | A minority suffers catastrophic losses; ≈ 1/4 of displaced workers are better off after 5 years | 2000–2005 plant closures | | [Hanushek et al., VoxEU 2025](https://cepr.org/voxeu/columns/revisiting-consequences-job-displacement) | V-S |
| Part-time share, women | 50.6 % | 2025 | ±1 pp | Destatis Mikrozensus via [Der Betrieb](https://der-betrieb.de/meldungen/teilzeit-auf-rekordniveau-jede-zweite-frau-arbeitet-reduziert/) | V-S |
| Part-time share, men | 14.3 % | 2025 | ±1 pp | same | V-S |
| Part-time share, all employees | 31.9 % (IAB, broader definition: 39.9 %) | 2025 | | same | V-S |
| Child penalty in earnings, Germany (average over years 5–10 after the first birth) | **61 %** (Austria 51 %; Denmark ≈ 21 %; US ≈ 31 %) | Kleven et al. 2019 | ±5 pp | [Kleven, Landais, Posch, Steinhauer, Zweimüller, AEA P&P 109:122–126](https://econ.lse.ac.uk/staff/clandais/cgi-bin/Articles/childpenaltiesAEAP&P.pdf), [NBER w25524](https://www.nber.org/papers/w25524) | V-S (Germany and Austria values confirmed; DK and US values UNVERIFIED) |
| Child penalty in labour-force participation, Germany | 30 % | same, online appendix | | same | V-S |
| Gender pay gap, unadjusted | 16 % (hourly 22.81 vs 27.05 EUR; West 17 %, East 5 %) | 2025 | ±1 pp | [Destatis PM 453/2025](https://www.destatis.de/DE/Presse/Pressemitteilungen/2025/12/PD25_453_621.html) | V-P |
| Gender pay gap, adjusted | 6 % (upper bound for discrimination; ≈ 60 % of the gap explained) | 2025 | ±1 pp | same | V-P |

---

## 5. Taxes and social contributions (2026)

### 5a. Income tax (§ 32a EStG 2026, single filer; joint filing uses splitting = double the brackets)

| Zone | Taxable income (EUR/year) | Marginal rate | Status |
|---|---|---|---|
| Basic tax-free allowance (Grundfreibetrag) | 0 – 12,348 | 0 % | V-S ([ETL](https://www.etl.de/aktuelles/was-2026-fuer-steuerpflichtigen-wichtig-ist/)) |
| Progression zone 1 | 12,349 – 17,799 | 14 % → ≈ 24 % (linear) | V-S |
| Progression zone 2 | 17,800 – 69,878 | ≈ 24 % → 42 % (linear) | V-S |
| Top rate | 69,879 – 277,825 | 42 % | V-S ([taxmaro](https://www.taxmaro.com/post/spitzensteuersatz-2026-grenze-tarif)) |
| "Rich tax" | ≥ 277,826 | 45 % | V-S |
| 2025 comparison | Grundfreibetrag 12,096 | | V-S |
| Solidarity surcharge | 5.5 % of income tax, only above an exemption limit of 20,350 EUR income tax (40,700 joint), so ≈ 90 % of taxpayers pay none | 2026 | V-S (one source gives an outdated 18,130 limit) |
| Church tax | 8 % (Bavaria, Baden-Württemberg) or 9 % of income tax; optional for the game | | UNVERIFIED |

Game simplification: use a piecewise-linear marginal rate, 0 → 14 → 24 → 42 → 45 %, at the brackets above.

### 5b. Social contributions (employee share in brackets; employer pays the rest)

| Branch | Total rate | Contribution ceiling (2026) | Status / source |
|---|---|---|---|
| Pension (RV) | 18.6 % (9.3 %) | 8,450 EUR/month (101,400/yr), single ceiling for East and West | V-P ([SVRechGrV 2026](https://www.buzer.de/SVRechGrV_2026.htm)) |
| Unemployment (ALV) | 2.6 % (1.3 %) | 8,450 EUR/month | V-S |
| Health (GKV) | 14.6 % + average additional contribution 2.9 % = 17.5 % (8.75 %) | 5,812.50 EUR/month (69,750/yr) | V-S ([lohn-info](https://lohn-info.de/sozialversicherungsbeitraege2026.html)) |
| Long-term care (PV) | 3.6 % (1.8 %); childless 23+ pay +0.6 pp (employee 2.4 %); −0.25 pp per child for children 2–5 (under 25) | 5,812.50 EUR/month | V-S (rate); per-child reduction UNVERIFIED |
| Statutory health opt-out threshold (Versicherungspflichtgrenze) | 77,400 EUR/yr | | V-S |
| **Employee total (1 child)** | ≈ **21.15 %** of gross up to the ceilings | | derived |

### 5c. Capital income

| Item | Value | Status |
|---|---|---|
| Flat capital gains tax (Abgeltungsteuer) | 25 % + Soli 5.5 % → **26.375 %** (≈ 27.8–28 % with church tax) | V-S ([steuerschroeder](https://www.steuerschroeder.de/Abgeltungssteuer.html)) |
| Saver's allowance (Sparerpauschbetrag) | 1,000 EUR single / 2,000 EUR joint per year | V-S |
| Partial exemption, equity funds/ETFs | 30 % of fund income tax-free (mixed funds 15 %, real-estate funds 60/80 %) | V-S |
| Base rate for the annual deemed-income tax on funds (Vorabpauschale) | 3.20 % (2026); 2.53 % (2025) | V-S (one outlier source says 2.29 %) |

---

## 6. Pensions

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Points system | Annual points = own gross pay / provisional average pay (2026: **51,944 EUR**), capped at the contribution ceiling (≈ 1.95 points/yr). Monthly pension = Σ points × pension value × access factor | 2026 | fixed | [SVRechGrV 2026 § 3](https://www.gesetze-im-internet.de/svbezgrv_2026/__3.html) (average pay) | V-P |
| Pension value per point (aktueller Rentenwert) | 40.79 → **42.52 EUR/month** (+4.24 % from 1 July 2026) | 2026 | | [DRV](https://www.deutsche-rentenversicherung.de/DRV/DE/Ueber-uns-und-Presse/Presse/Meldungen/2026/260305-rentenanpassung-2026.html), [Bundesregierung](https://www.bundesregierung.de/breg-de/aktuelles/rentenanpassung-2026-2337000) | V-P |
| Standard pensioner (45 years at average pay) | 45 × 42.52 ≈ 1,913 EUR gross/month | 2026 | | derived | derived |
| Final average pay 2024 | 47,085 EUR | 2024 | | SVRechGrV | V-S |
| Pension-level guarantee (Haltelinie) | 48 % (standard pension relative to average pay) guaranteed until 2031. Rentenpaket 2025 passed Bundestag 5 Dec 2025, Bundesrat 19 Dec 2025, in force 1 Jan 2026. Mothers' pension III: 3 years credited per child | 2026–2031 | | [DRV FAQ](https://www.deutsche-rentenversicherung.de/SharedDocs/FAQ/Gesetzesaenderungen/rentenpaket-2025/Rentenpaket-2025.html), [Bundesregierung](https://www.bundesregierung.de/breg-de/suche/rentenpaket-2025-2368678) | V-P |
| "Aktivrente" (working past retirement age) | Up to 2,000 EUR/month of earnings tax-free | 2026 | | [finanztip](https://www.finanztip.de/daily/rentenpaket-kommt-was-bringen-aktiv-fruehstart-und-muetterrente/) | V-S. Start date **UNVERIFIED** |
| Future net replacement rate, mandatory schemes, average earner | **53.3 %** (OECD average 63.2 %); ≈ +5 pp without the sustainability factor; 68.0 % incl. voluntary private pension (4 % contributions) | PaG 2025, entry at age 22 in 2024 | ±3 pp | [OECD PaG 2025 Germany note](https://www.oecd.org/en/publications/pensions-at-a-glance-2025-country-notes_8a53ef12-en/germany_c480c8fa-en.html) | V-P |
| Gross replacement rate | ≈ 42 % | | | third party | **UNVERIFIED** |
| Normal retirement age | 67 for people born 1964 or later (phased in from 65) | statute | fixed | [gegen-hartz summary](https://www.gegen-hartz.de/news/1964-geboren-wann-kann-ich-in-rente-gehen) | V-S |
| Early retirement deduction | 0.3 % per month early, permanently; from 63 with 35 insured years → max 14.4 % | statute | fixed | same | V-S |
| Early retirement without deduction | 45 insured years → 65 (born 1964+) | statute | | same | V-S |
| Disability pension: see §7 | | | | | |

---

## 7. Health and mortality

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Life expectancy at birth, men / women (period life table) | 78.5 / 83.2 | 2022/24 | ±0.2 | Destatis via [Ärzteblatt](https://www.aerzteblatt.de/news/manner-sterben-in-deutschland-fruher-als-frauen-bf7de76e-59fc-47ba-942c-d45a0d288f38) | V-S |
| Single-year 2024, men / women | 78.9 / 83.5 | 2024 | | Destatis via [PwC](https://blogs.pwc.de/de/insurance-news/article/250398/destatis-veroeffentlicht-sterbetafel-2022-24-lebenserwartung-in-deutschland-wieder-auf-vor-corona-niveau/) | V-S |
| Newer table 2023/2025 | exists; national values not retrieved | | | [Destatis Sterbetafel](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Sterbefaelle-Lebenserwartung/sterbetafel.html) | to fetch (GENESIS 12621-0001), DL-DE-BY 2.0 |
| Life expectancy gap at birth, lowest vs highest income group | **men 8.6 years, women 4.4 years** | SOEP 1992–2016 | ±1.5 | Lampert, Hoebel, Kroll 2019, [J Health Monit 4(1):3–14](https://pmc.ncbi.nlm.nih.gov/articles/PMC8848850/), doi 10.25646/5872, CC BY 4.0 | V-P |
| Same gap at age 65 | men 6.6, women 3.7 years | same | | same | V-P |
| Death before 65, lowest vs highest income group | men 27 % vs 14 %; women 13 % vs 8 % | same | | same | V-P |
| Depressive symptoms (PHQ-9 ≥ 10), adults | 22 % (anxiety 14 %; moderate/severe 8 %). The jump is partly due to a change in survey method | 2024 | 16–22 % | [RKI panel 2024, PMC12709641](https://pmc.ncbi.nlm.nih.gov/articles/PMC12709641/) | V-P |
| Earlier comparable measure (PHQ-8) | 10.1 % (women 11.6 %, men 8.6 %) | GEDA 2014/15 | | [RKI fact sheet](https://www.rki.de/EN/Content/Health_Monitoring/Health_Reporting/GBEDownloadsJ/FactSheets_en/JoHM_03_2017_Prevalence_depressive_symptoms.pdf) | V-P |
| Sick days for mental disorders | 366 days per 100 insured (10.7 cases; ≈ 34 days per case); depression ≈ 202 days; 7 % of employees had ≥1 case | 2025 (DAK insured) | ±10 % | [DAK Psychreport 2026](https://www.dak.de/dak/unternehmen/reporte-forschung/psychreport-2026_163000) | V-S |
| "Burnout" (ICD Z73) specifically | not obtained | | | | **UNVERIFIED**. Use the mental-disorder figures and avoid the clinical term "burnout" in game text |
| New disability pensions (Erwerbsminderungsrente) | 175,978 (2025), 171,732 (2024) | 2025 | ±3 % | DRV via [Versicherungsbote](https://www.versicherungsbote.de/id/4951629/Erwerbsminderungsrente-Warum-Menschen-aus-dem-Erwerbsleben-ausscheiden/) | V-S |
| Share of new disability pensions due to mental disorders | 41.1 % (2025) | 2025 | ±2 pp | same | V-S |
| Disability pension incidence per year | ≈ 0.4 % of the ≈ 40 million insured active population | | | derived (denominator UNVERIFIED) | derived |
| Average new disability pension amount | not obtained (≈ 1,000–1,100 EUR) | | | DRV Statistikband | **UNVERIFIED** |

---

## 8. Family

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Total fertility rate | 1.32 (German nationals 1.20, foreign nationals 1.78; East 1.22, West 1.34) | 2025 | ±0.02 | [Destatis PM 230/2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/07/PD26_230_12.html) | V-P |
| Mean age at first birth: mothers / fathers | **30.5 / 33.3** | 2025 | ±0.2 | same | V-P |
| Mean age at any birth: mothers / fathers | 31.9 / 34.8 | 2025 | | same | V-P |
| Completed fertility, women born 1976 | 1.58 | | | same | V-P |
| Births | 654,241 | 2025 | | same | V-P |
| Marriages | 348,800 (≈ 4.2 per 1,000) | 2025 | ±1 % | Destatis PM 220/2026 via [statistiken-aktuell](https://statistiken-aktuell.de/eheschliessungen-scheidungen-2025-datenmonitor/) | V-S |
| Divorces | 130,100 (1.56 per 1,000 inhabitants); mean marriage duration at divorce 14 years 7 months; 113,400 minor children affected | 2025 | ±1 % | same | V-S |
| Lifetime divorce risk (aggregate divorce rate) | ≈ 33–35 % of marriages | | | Destatis | **UNVERIFIED** |
| Mean age at first marriage | ≈ 35 (men) / 32.5 (women) | | | GENESIS 12611 | **UNVERIFIED** |
| Child cost (consumption only), couple with 1 child | 763 EUR/month (21 % of household consumption); age 0–6: 679; age 12–17: 953; 2 children 1,276; 3 children 1,770 | **2018** (EVS); add ≈ +25–30 % inflation for 2026 ≈ 960–1,000 | ±15 % | [Destatis Zahl der Woche](https://www.destatis.de/DE/Presse/Pressemitteilungen/Zahl-der-Woche/2021/PD21_26_p002.html) | V-P (2018); uplift derived |
| Parental allowance (Elterngeld Basis) | 65–67 % of prior net pay (up to 100 % for low earners), min 300, max 1,800 EUR/month; 12 months + 2 partner months (14 total) | 2026 | fixed | [kita.de summary](https://www.kita.de/wissen/elterngeld-2026-was-sich-fuer-eltern-aendert-und-wie-du-das-elterngeld-optimal-beantragst/) | V-S. Replacement-rate tiers UNVERIFIED |
| ElterngeldPlus | half the amount (150–900) for twice as long; up to 4 bonus months if both parents work part-time | 2026 | | same | V-S |
| Elterngeld income limit | taxable household income ≤ 175,000 EUR (births from 1 Apr 2025) | 2026 | | [taxmaro](https://www.taxmaro.com/post/elterngeld-neue-einkommensgrenze-ab-2025) | V-S |
| Elterngeld vs basic support | counted as income for basic-support households (exemption only for prior earnings) | | | | **UNVERIFIED** |
| Childcare rate, under 3s | 37.8 % (East 54.9 %, West 34.5 %); legal entitlement from age 1 | 1 Mar 2025 | ±1 pp | Destatis via [evangelisch.de](https://www.evangelisch.de/inhalte/249057/31-10-2025/zahl-der-betreuten-kinder-sinkt-infolge-ruecklaeufiger-geburtenzahlen) | V-S |
| Childcare rate, ages 3–5 | ≈ 91 % | 2025 | | | **UNVERIFIED** |
| Unmet childcare demand, under 3s | parents want ≈ 49 % vs 38 % placed (gap ≈ 10 pp) | | | BMFSFJ Kita-Bericht | **UNVERIFIED** |
| Child support minimum (Düsseldorfer Tabelle, income group 1 up to 2,100 EUR net) | 0–5: **486**; 6–11: **558**; 12–17: **653** EUR/month (half of Kindergeld is deducted). The table has 15 income groups; each higher group adds ≈ 5–8 %, up to 160 % at the top | 2026 | fixed | [OLG Düsseldorf / Justiz NRW](https://www.justiz.nrw/node/6822) | V-P |
| Minimum the paying parent keeps (Selbstbehalt) towards minor children | **1,450 EUR/month employed, 1,200 EUR not employed** (includes 520 EUR warm rent); towards other adult children 1,750 EUR (rent 650); towards parents ≥ 2,650 EUR. Unchanged from 2025 because the social-assistance standard rate was not raised | 2026 | fixed | Copies of DT 2026: [Stadt Memmingen PDF](https://www.memmingen.de/fileadmin/civserv/9764000/forms/Amt41/2026-01-01_Duesseldorfer_Tabelle.pdf), [beck-aktuell](https://www.beck-aktuell.de/heute-im-recht/rechtsgeschehen/duesseldorfer-tabelle-2026-unterhalt-selbstbehalt-kinder-eltern-grosseltern-2025-12-02) (parents 2,650) | V-S (OLG page returned 503) |
| Custody after separation | Joint custody is the default. Residence model (child lives mainly with one parent, > 90 % with the mother) is dominant. Equal shared care (Wechselmodell) ≈ **5 %** of separated families (5–15 % depending on definition) | 2021 | ±3 pp | [Univ. Duisburg-Essen / Marburg FAMOD](https://www.uni-due.de/2021-05-17-studie-trennungskinder) | V-S |

---

## 9. Housing

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Homeownership rate (households) | ≈ 42 % (58 % rent); city-states lowest, Saarland highest | Mikrozensus 2022 | ±1 pp | [Destatis Wohnen](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html) | V-P |
| Same, PHF | 42 % (West 45 %, East 29 %) | 2023 | | Bundesbank | V-P |
| Asking rent (existing stock), national | 8.80 EUR/m² net cold rent | Q3 2025 | ±5 % | [ImmoScout24 WohnBarometer](https://www.scout24.com/fileadmin/user_upload/ImmoScout24_WohnBarometer_Q3_2025_Miete.pdf) (commercial data; cite only) | V-S |
| Asking rent, 8 largest metros (average) | 14.68 EUR/m² | Q3 2025 | ±5 % | same | V-S |
| Asking rent range, 14 largest cities | 8.7 (Dresden) – 21.9 (Munich) EUR/m² | 2024 | | BBSR via [caren-lay.de](https://www.caren-lay.de/kontext/controllers/document.php/161.d/b/905d4c.pdf) | V-S |
| Asking rent, rural districts | ≈ 7–8 EUR/m² | | | BBSR | **UNVERIFIED** |
| Asking rent growth, 14 largest cities | ≈ +50 % since 2015 (Berlin > +100 %) | 2015–2024 | | BMWSB / BBSR | V-S |
| Asking purchase price, existing flats (EUR/m²) | Germany **2,574** (houses 2,844; new-build flats 4,133); Munich **8,266**; Frankfurt 5,343; Hamburg 5,283; Stuttgart 5,008; Berlin 4,884; Düsseldorf 4,534; Cologne 4,340; Leipzig 2,992 | Q4 2025 | ±10 % (asking prices) | [ImmoScout24 WohnBarometer Q4 2025](https://www.immobilienscout24.de/unternehmen/news-medien/news/default-title/kaufpreise-steigen-so-stark-wie-seit-jahren-nicht-mehr/) (commercial data; cite only). vdp gives Munich 9,610 (transaction-based) | V-S |
| Price level, rural districts | below the national 2,574 average; ≈ 1,500–2,500 EUR/m² is a plausible game band | 2025 | wide | no per-district-type figure found | **UNVERIFIED** |
| Price-to-rent ratio | ≈ 25–30 annual rents (big cities), ≈ 20 (rural) | | | | **UNVERIFIED** |
| Rent cap on new leases (Mietpreisbremse) | new-lease rent ≤ local comparative rent + 10 % in designated tight markets; extended to 31 Dec 2029 | 2025–2029 | | [beck-aktuell](https://www.beck-aktuell.de/heute-im-recht/rechtspolitik-gesetzgebung/mietpreisbremse-2029-verlaengerung-gesetzentwurf-2025-05-28) | V-S (extension status: bill; Bremen ordinance runs to 2029) |
| Rent increase cap in existing leases (Kappungsgrenze, § 558 (3) BGB) | ≤ **20 % within 3 years**; **15 %** in areas designated by state ordinance (for up to 5 years each); never above the local comparative rent; modernisation (§ 559) and operating-cost (§ 560) increases are outside the cap | statute (2026) | fixed | [§ 558 BGB text](https://lxgesetze.de/bgb/558) | V-P. No enacted 11 % cap found (treat as a scenario only) |
| Property transfer tax (Grunderwerbsteuer) | 3.5 % (Bavaria) – 6.5 % (NRW, Brandenburg, Saarland, Schleswig-Holstein); Saxony 5.5 % | 2026 | | [finanz.de](https://www.finanz.de/finanzierung/kaufnebenkosten/) | V-S |
| Notary + land registry | ≈ 1.5 % typical (notary ≈ 1 %, land registry ≈ 0.5 %), range 0.8–2 % (GNotKG fee scale) | | | same; [immowelt](https://www.immowelt.de/ratgeber/kaufen/notarkosten-grundbuchkosten) | V-S |
| Estate agent fee (Makler) | ≈ 3.57 % for the buyer (customary). Equal split is mandatory if the agent works for both sides; otherwise at most half may be passed on (§§ 656c–656d BGB, since 23 Dec 2020; flats and single-family homes bought by consumers) | | | same; [§ 656c text](https://www.buzer.de/656c_BGB.htm) | V-S (rate); V-P (rule) |
| **Total transaction costs** | ≈ **7–12 %** of the purchase price (game default 10 %) | | | derived | V-S |

---

## 10. Cost-of-living basket (household consumption shares)

The Destatis LWR/EVS table could not be fetched (404) and the search budget was exhausted. The shares below come from secondary sources quoting Destatis.

| Category | Share of consumption | Monthly EUR (average household, 2022) | Status |
|---|---|---|---|
| Housing, energy, maintenance | ≈ 36 % | 1,025 | V-S ([Statista/Destatis](https://de.statista.com/statistik/daten/studie/164774/umfrage/konsumausgaben-private-haushalt)) |
| Food, drinks, tobacco | ≈ 14–15 % | ≈ 420 | V-S (14.2 % national accounts 2024) |
| Transport | ≈ 12 % | 347 | V-S |
| Leisure, entertainment, culture | 9.5 % (2024); 8.6 % (2022) | 309 (2024); 245 (2022) | V-S (second pass, see below) |
| Restaurants, accommodation | ≈ 5–6 % | | **UNVERIFIED** |
| Furnishings, household goods | ≈ 5 % | | **UNVERIFIED** |
| Clothing, shoes | ≈ 4 % | | **UNVERIFIED** |
| Health | ≈ 4 % | | **UNVERIFIED** |
| Communication | ≈ 2–3 % | | **UNVERIFIED** |
| Education | ≈ 1 % | | **UNVERIFIED** |
| Other goods and services | ≈ 5 % | | **UNVERIFIED** |
| **Total consumption, average household** | 100 % | **2,846** | V-S (2022) |
| Single-person household, total | | 1,918 (housing 817, food 254, transport 195) | V-S (2023, via [Sparkasse](https://www.sparkasse.de/pk/ratgeber/finanzplanung/finanzen-und-haushalt/lebenshaltungskosten.html)) |

Second pass: leisure, sport and culture was **9.5 % (309 EUR/month) in 2024** (8.6 % in 2022), per Destatis LWR as reported by [Lebensmittelpraxis](https://lebensmittelpraxis.de/handel-aktuell/49585-konsumausgaben-2024-deutsche-haushalte-geben-mehr-geld-fuer-freizeit-aus.html) (V-S). destatis.de timed out, so the LWR 2024 table is still not fetched.

**Alternative, verified basket: HICP item weights, Germany 2025** (per mille of household monetary consumption; excludes owner-occupiers' imputed rent, so housing is much lower than in the LWR). Source: Eurostat prc_hicp_inw, https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_inw/default/table (CC BY 4.0). V-P.

| COICOP group | Weight 2025 (%) |
|---|---|
| Food, non-alcoholic drinks | 13.1 |
| Alcohol, tobacco | 3.5 |
| Clothing, shoes | 3.8 |
| Housing, water, energy (actual rents 7.6; energy 5.2) | 16.4 |
| Furnishings, household goods | 6.4 |
| Health | 5.8 |
| Transport | 17.1 |
| Communication | 2.3 |
| Recreation, culture | 11.4 |
| Education | 0.8 |
| Restaurants, hotels | 7.4 |
| Other goods and services | 12.0 |

Game guidance: for a renter household use the LWR-style housing share (≈ 36 %) and scale the other HICP shares down proportionally. To do: GENESIS LWR table 63121-0001 (2024), licence DL-DE-BY 2.0. Low-income households spend a higher share on housing and food (≈ 45–50 % housing; UNVERIFIED).

---

## 11. Skilled immigration

| Item | Value | Year | Source | Status |
|---|---|---|---|---|
| EU Blue Card, standard minimum salary | **50,700 EUR** gross/year | 2026 | [German missions fact sheet](https://www.germany.info/resource/blob/2435484/ffe411670fb3aa496edfb1a77e7136f2/eu-blue-card-data.pdf) | V-P |
| EU Blue Card, reduced minimum (shortage occupations, graduates within 3 years, IT specialists without a degree with 3 years' experience) | **45,934.20 EUR** | 2026 | same | V-P |
| Opportunity Card (Chancenkarte) | Entry for up to 1 year to look for work. Requires either a qualification recognised in Germany or **≥ 6 points** plus a vocational or university qualification recognised in the home country, plus A1 German or B2 English | 2026 | [Make it in Germany](https://www.make-it-in-germany.com/de/visum-aufenthalt/chancenkarte/jobsuche) | V-P (headline rules) |
| Points (§ 20b AufenthG) | Criteria V-P from the statute text ([lxgesetze § 20b](https://lxgesetze.de/aufenthg/20b)): partial recognition; German at three levels; **English C1** (not C2); experience ≥ 5 of last 7 years or ≥ 2 of last 5; shortage occupation (§ 18g list); age ≤ 35 or 35–40; ≥ 6 months' prior lawful stay in the last 5 years; partner also applying. The point values sit in the law's annex table (the government may change them by ordinance) and are still **UNVERIFIED**: partial recognition 4; experience 3 / 2; German B2 3 / B1 2 / A2 1; English C1 1; age 2 / 1; prior stay 1; shortage occupation 1; partner 1; minimum 6 | 2026 | | criteria V-P; values **UNVERIFIED** |
| Proof of funds, Opportunity Card | ≈ 1,091 EUR/month (≈ 13,092 EUR/yr in a blocked account) | 2026 | [fintiba](https://www.fintiba.com/de/opportunity-card-germany) | V-S |
| Opportunity Card: work allowed and duration | Work averaging ≤ **20 h/week**, plus trial employment of up to **2 weeks** at a time. Search card up to 1 year; one follow-up card of up to 2 years only with a qualified job offer and BA approval. Language for the points route: basic German (A1) or English B2 | 2026 | [§ 20a AufenthG text](https://lxgesetze.de/aufenthg/20a) | V-P |
| Visa processing time | No official statistics are kept. The Foreign Office says Blue Card and highly qualified applicants get appointments "immediately or within weeks". Elsewhere, 6–12 month appointment waits are reported at high-demand missions. Accelerated procedure: appointment within 3 weeks, decision usually within 3 weeks | 2025 | [BT-Drs. 21/1914](https://dserver.bundestag.de/btd/21/019/2101914.pdf); [AA briefing](https://cdn.table.media/assets/berlin/aa_visabeschleunigung.pdf) | V-S. Accelerated-procedure deadlines **UNVERIFIED**. Game band: 1–9 months |
| Credential recognition outcomes | ≈ 66,900 decided cases: 43 % full equivalence, 45 % equivalence with conditions (adaptation course or exam), 10 % partial, ≈ 1 % rejected | 2024 | [BMBFSFJ press release](https://www.bmbfsfj.bund.de/bmbfsfj/aktuelles/pressemitteilungen/anerkennung-auslaendischer-berufsqualifikationen-2024-neue-hoechstwerte-erneut-deutlicher-zuwachs-bei-gesundheitsberufen--269962) (Destatis data) | V-S |
| Positive recognition decisions | 79,100 (2024) → 86,600 (2025, +10 %) | 2025 | [Destatis PM 295/2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/08/PD26_295_212.html) | V-P |
| Recognition duration | ≈ 3–4 months after a complete application (statutory 3-month decision deadline) | | | **UNVERIFIED** |

---

## Open items (priority for a follow-up research pass)

1. Exact LWR 2024 consumption shares (Destatis 63121).
2. ~~Net household income percentiles~~ (done: Eurostat ilc_di01).
3. Age–earnings profile: coarse groups done (SES 2022); finer 5-year groups still open.
4. Real-wage index: 2009–2025 done; 2000–2008 still open.
5. Job-finding (exit) rates from BA statistics.
6. Unemployment rate for people with a vocational qualification.
7. ~~Selbstbehalt amount; Kappungsgrenze statute text~~ (done in the second pass); the § 20b point values from the annex.
8. Destatis life table 2023/25 values and the single-year mortality curve (qx by age and sex) for the simulation.
9. Average disability pension amount; KdU average from BA tables.
10. Purchase price levels per m², city vs rural (Destatis house price index or BBSR).
