# Calibration sheet: family, partnership, care and career events ("Central Europe", calibrated on Germany)

For the "Many Lives" life simulation. Research date: 2026-10-24. This file adds to `germany.md` §8–9 (family, housing) and `wellbeing.md` §2 and §5 (adaptation to marriage, divorce and children). Values already recorded there are referenced, not repeated. Where this file has a newer or better-sourced value than `germany.md`, it says so.

**Status labels**
- **VERIFIED**: read at the primary source (the page, PDF or data API was opened and the number was read there).
- **SECONDARY**: from a secondary source that cites a primary one (press agency, statistics portal, research summary, or an abstract quoted by a search engine). The primary table itself was not opened.
- **DERIVED**: computed by us from VERIFIED or SECONDARY inputs. The method is given in the row.
- **UNVERIFIED**: background knowledge or a plausible calibration guess. Check before shipping.

**Respectful modelling notes**
- Family forms are diverse: couples living apart (LAT), unmarried cohabitation, marriage, same-sex couples (about 3 % of marriages in 2023), single parents, blended families, chosen childlessness and involuntary childlessness. None is a default or a "success state". The game should not reward or punish any of them.
- Statistics below are population averages. They are not predictions for a person or a group. Do not attach divorce, childlessness or care burdens to stereotypes (for example by nationality or education) in game text. Where a covariate is used as a model input (education, income), keep it out of the narration.
- Death of a parent, infertility, separation and care are painful events. Frame them with care and offer support paths in game. Never use them as punishments for "bad play".

**Licence notes**
- **Destatis / GENESIS / Statistische Berichte**: Datenlizenz Deutschland – Namensnennung 2.0. Attribution: "© Statistisches Bundesamt (Destatis), <year>".
- **Eurostat** (queried through the dissemination API): CC BY 4.0, attribution "Source: Eurostat".
- **Demographic Research** (Hiekel & Fulda 2018): CC BY 3.0 DE (from the PDF metadata).
- **Kattenbach et al. 2014** (J. Vocational Behavior, PMC3895325): CC BY 3.0.
- **IW Köln, IAB, Bertelsmann Stiftung, WSI GenderDatenPortal, sozialpolitik-aktuell.de, Univ. Bern press releases, journal articles behind paywalls**: copyrighted publications. We use only the facts (numbers), which are not copyrightable. Cite the source and copy no text, charts or tables verbatim.

**Monthly hazard conversion used throughout.** ppm = parts per million per month = (1 − (1 − p_year)^(1/12)) × 10⁶. For small p this is ≈ p_year / 12 × 10⁶. For an interval probability P over n years with a constant hazard: p_year = 1 − (1 − P)^(1/n).

---

## 1. Partnership formation

### 1a. Living arrangements by age (Mikrozensus, co-resident partnerships only)

The Mikrozensus counts only partners who share a household. Couples living apart together (LAT) count as "alleinstehend" (living without a partner in the household).

| Item | Value | Unit | Year | Band | Source | Status |
|---|---|---|---|---|---|---|
| Adults living with a partner in the same household | **60 %** (1996: 66 %) | share of adults 18+ | H1 2023 | ±1 pp | [Destatis PM 464/2023](https://www.destatis.de/DE/Presse/Pressemitteilungen/2023/12/PD23_464_12.html) | VERIFIED |
| Of co-resident couples: share married | **84 %** overall; older partner < 40: **61 %**; 40–59: **85 %**; 60+: **93 %**. So about **39 %** of couples under 40 are unmarried cohabiting couples | share of couples | H1 2023 | ±1 pp | same | VERIFIED (39 % derived) |
| Adults married / never married | **50 %** married (35.0 million; 1993: 60 %); **33 %** never married (22.6 million) | share of adults 18+ | end 2023 | ±1 pp | [Destatis Zahl der Woche 06/2025](https://www.destatis.de/DE/Presse/Pressemitteilungen/Zahl-der-Woche/2025/PD25_06_p002.html) | VERIFIED |
| Living arrangements, age 25–34 | ≈ **50 %** with a partner (about 25 % with children, 25 % without), ≈ **34 %** without a partner in the household ("alleinstehend"), ≈ 13 % single and living with parents, ≈ 2.6 % single parents | share of age group | 2025 | ±3 pp (chart labels) | Destatis Mikrozensus Erstergebnisse 2025 via [sozialpolitik-aktuell abbVII11](https://www.sozialpolitik-aktuell.de/files/sozialpolitik-aktuell/_Politikfelder/Bevoelkerung/Datensammlung/PDF-Dateien/abbVII11.pdf) | SECONDARY (category labels inferred from the chart; the totals add up to 100) |
| Living arrangements, age 35–44 | **57.5 %** partner + children; **12.4 %** partner, no children; **19.6 %** without a partner in the household; **6.9 %** single parents; ≈ 3.6 % with their parents | share | 2025 | ±1 pp | same (values stated in the text) | SECONDARY |
| Living arrangements, age 65–74 | **62.4 %** partner, no children in the household; ≈ 29 % without a partner | share | 2025 | ±2 pp | same | SECONDARY |
| Under 25 | **88.9 %** single and living with their parents | share | 2025 | ±1 pp | same | SECONDARY |
| Without a partner in the household ("alleinstehend"), **men / women** | under 25: ≈ 7.7 / 7.8; 25–34: **33.9 / 27.4**; 35–44: **26.0 / 12.7**; 45–54: **24.7 / 14.6**; 55–64: ≈ 25 / 26; 65–74: **22.1 / 33.5**; 75–84: **22.0 / 50.6**; 85+: **31.1 / 59.7** | % of age group | 2025 | ±2 pp (85+ values stated in text; others read from chart labels, so the sex assignment for under 25 and 55–64 is uncertain) | Destatis GENESIS via [sozialpolitik-aktuell abbVII14](https://www.sozialpolitik-aktuell.de/files/sozialpolitik-aktuell/_Politikfelder/Bevoelkerung/Datensammlung/PDF-Dateien/abbVII14.pdf) | SECONDARY |
| Average age when leaving the parental home | **24.1** (men 24.8, women 23.3) | years | 2025 | ±0.3 | Eurostat yth_demo_030 (API) | VERIFIED |

**Pattern for the model.** In the 25–54 age range, men are more often without a co-resident partner than women. After 65 the pattern reverses because women live longer and widowhood is common.

### 1b. Singles, including people living apart together (FReDA survey)

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| No steady partnership at all (true singles, LAT excluded), ages 20–54 | ≈ **20 %** ("one in five") | 2024 | ±2 pp | BiB analysis of FReDA, reported by epd: [evangelisch.de 02-07-2026](https://www.evangelisch.de/inhalte/256852/02-07-2026/singles-haeufiger-jung-und-maennlich) | SECONDARY |
| Same, ages 20–29 / 40–54 | **42 %** / **11 %** | 2024 | ±3 pp | same | SECONDARY |
| Same, by education | low/medium **23 %**, high **17 %** | 2024 | ±2 pp | same | SECONDARY |
| Singles who want a partnership | ≈ **2/3** (about 1/3 are single by choice) | 2024 | | same | SECONDARY |
| Men single more often than women | in every age group 20–54 (no figures given) | 2024 | | same | SECONDARY |
| LAT share | Implied: the difference between "no co-resident partner" (Mikrozensus, ≈ 34 % at 25–34) and "no steady partner" (FReDA) is the LAT group, roughly **10–15 %** of adults under 35 | | wide | derived from the two sources above (different surveys and age bands) | DERIVED / UNVERIFIED |

### 1c. Cohabitation and marriage timing

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Mean age at first marriage, women / men | **32.8 / 35.3** (1993: 26.8 / 29.2). 2024: ≈ 33 / ≈ 35 | 2023 | ±0.2 | [Destatis Zahl der Woche 06/2025](https://www.destatis.de/DE/Presse/Pressemitteilungen/Zahl-der-Woche/2025/PD25_06_p002.html) | VERIFIED (2023). This replaces the UNVERIFIED row in `germany.md` |
| First union is cohabitation, not direct marriage | ≈ **80 %** of West Germans born in the 1970s; only 15 % had no cohabitation before first marriage; 71 % married their first cohabiting partner | cohorts 1971–73 | | Hiekel & Fulda, [Demographic Research 39(30), 2018](https://www.demographic-research.org/volumes/vol39/30/39-30.pdf), citing Hiekel 2014 | VERIFIED |
| Median age at first cohabitation | not found. Model suggestion: **≈ 25–26** (between leaving home at 24 and first birth at 30.5) | | ±2 years | — | **UNVERIFIED** |
| Women start cohabiting and families earlier than men; men stay longer in the parental home | qualitative | pairfam wave 3 | | [EPC 2020 abstract](https://epc2020.popconf.org/abstracts/201272) | SECONDARY |
| Marriages | 349,216 | 2024 | | Eurostat demo_nind (API) | VERIFIED |
| People marrying for the first time | **78 %** of people marrying (so 22 % are remarriages) | 2023 | ±1 pp | Destatis Zahl der Woche 06/2025 | VERIFIED |

---

## 2. Separation, divorce and repartnering

### 2a. Divorce by marriage duration (official statistics)

Destatis publishes duration-specific divorce rates: divorces in the report year from marriage cohort X, per 1,000 marriages concluded in year X. Their sum over durations 0–25 is the total divorce rate.

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Total divorce rate (durations 0–25) | **28.0** per 100 marriages (2023: 27.8; 2022: 29.3; 2015: 34.7; peak 2004–05 ≈ 40.4). Provisional 2025: **28.4** | 2024 | ±0.5 | Destatis Scheidungsstatistik table 3.13 via [sozialpolitik-aktuell tabVII6](https://www.sozialpolitik-aktuell.de/files/sozialpolitik-aktuell/_Politikfelder/Bevoelkerung/Datensammlung/PDF-Dateien/tabVII6.pdf) and [abbVII15](https://www.sozialpolitik-aktuell.de/files/sozialpolitik-aktuell/_Politikfelder/Bevoelkerung/Datensammlung/PDF-Dateien/abbVII15.pdf) | SECONDARY (exact copy of the Destatis table) |
| Divorces; mean marriage duration at divorce; share with minor children | **129,337**; **14.7 years**; **50.8 %** | 2024 | ±1 % | same | SECONDARY |
| Duration-specific divorce rate per 1,000 marriages, by duration (years) | 0: 0.0; 1: 2.6; 2: 13.8; 3: 18.5; 4: 16.7; 5: 21.8; **6: 22.7 (peak)**; 7: 21.8; 8: 20.9; 9: 19.3; 10: 17.9; 11: 17.2; 12: 15.9; 13: 15.1; 14: 13.6; 15: 12.9; 16: 12.0; 17: 11.6; 18: 11.1; 19: 10.5; 20: 10.0; 21: 9.3; 22: 8.9; 23: 8.0; 24: 7.5; 25: 7.2. Sum 347.1 | 2015 | ±0.5 per value | [Destatis Fachserie 1 Reihe 1.4, 2015, table 3.12](https://www.statistischebibliothek.de/mir/servlets/MCRFileNodeServlet/DEHeft_derivate_00032289/2010140157004.pdf) | VERIFIED (latest year found with single-year detail) |
| Share of 2015 divorces at durations > 25 years | **15 %** (24,760 of 163,335) | 2015 | | same (derived from counts) | DERIVED |
| **Lifetime divorce risk** | ≈ **33 %** of marriages. Method: total divorce rate 0–25 (28 %) divided by the 0–25 share of all divorces (0.85) | 2024 | ±3 pp | derived | DERIVED. This replaces the UNVERIFIED "33–35 %" in `germany.md` |
| Legal waiting time | Divorce usually follows at least **one year of separation** (Trennungsjahr). The very low rates in years 0–1 are an artefact of this rule. A model that tracks *separation* should shift the profile about **1–1.5 years earlier** | statute | | § 1565–1566 BGB | UNVERIFIED (shift size); rule well known |

**Duration profile scaled to 2024 and converted to a monthly hazard among still-married couples** (DERIVED: 2015 rates × 28.0/34.7, divided by the share still married, with a crude 0.2 %/year loss to widowhood):

| Duration (years) | 1 | 2 | 3–4 | 5–9 | 10–14 | 15–19 | 20–25 | 26+ |
|---|---|---|---|---|---|---|---|---|
| Divorce hazard, %/year | 0.2 | 1.1 | 1.4–1.5 | 1.8–2.0 | 1.4–1.7 | 1.2–1.3 | 0.9–1.1 | ≈ 0.5 (UNVERIFIED shape) |
| ppm/month | 175 | 930 | 1,200 | 1,600 | 1,300 | 1,050 | 850 | 400 |
| Cumulative divorced (%) at end of band | 0.2 | 1.3 | 4.2 | 12.8 | 19.2 | 23.9 | 28.0 | ≈ 33 |

### 2b. Cohabiting unions (not married)

| Item | Value | Cohort / year | Band | Source | Status |
|---|---|---|---|---|---|
| Stability in the first year | **> 90 %** of cohabiting unions (any order) are still intact after 1 year | West Germany, born 1971–73 | | Hiekel & Fulda 2018 | VERIFIED |
| Separated within 5 years of moving in | ≈ **30 %** (first, second and higher-order unions alike). Cumulative dissolution roughly doubles each year in years 1–3, then grows more slowly | same | ±5 pp | same | VERIFIED |
| Married within 5 years (first and second unions) | **> 60 %** (about twice the separation share); third and later unions ≈ 40 % (women) | same | ±5 pp | same | VERIFIED |
| Serial cohabitation (2+ cohabiting partners by age 35–45) | ≈ 13–19 % had 2 cohabitations; 2–5 % had 3+ | same | | same | VERIFIED |
| Unmarried parents vs married parents | higher separation risk for unmarried parents, partly selection (shorter relationships before the birth) | pairfam | | summary of Bastin et al. 2012 and others in [PMC4037585](https://pmc.ncbi.nlm.nih.gov/articles/PMC4037585) | SECONDARY |

**Caveat.** The 1970s cohort married more than people do today: in 2023, 39 % of co-resident couples under 40 were unmarried. For current calibration, keep the separation hazard and lower the marriage hazard.

### 2c. Unemployment and separation

| Item | Value | Data | Source | Status |
|---|---|---|---|---|
| Annual separation rate before / after an unemployment spell | **0.9 % → 1.6 %** per year (≈ ×1.8); no difference by which partner lost the job | Germany (SOEP) and UK panels | Di Nallo et al., [DIW SOEPpaper](https://www.diw.de/de/diw_01.c.832521.de/s_13244.html) (abstract) | SECONDARY |
| Husband's job loss and divorce | plant closure **+54 %**, dismissal **+74 %** higher risk of marital dissolution; the effect fades with time since the job loss; a wife's job loss shows no similar effect | SOEP, discrete-time survival | Keldenich & Lücke, ["Unlucky at work, unlucky in love"](https://www.vwl1.ovgu.de/-p-1218) (abstract) | SECONDARY |
| Trend | the destabilising effect of men's unemployment was smaller in 2000–2010 than in the late 1980s | SOEP | [DIW](https://www.diw.de/de/diw_01.c.768550.de/s_8093.html) (abstract) | SECONDARY |
| Mixed evidence | a dyadic SOEP study finds no clear effect of spouses' employment situation | SOEP | Schmid 2022, [DIW](https://www.diw.de/de/diw_01.c.839166.de/s_13528.html) | SECONDARY |

**Model suggestion.** Multiply the separation hazard by **1.5–1.8** for 24 months after either partner's involuntary job loss, then decay to 1.0. The game should not assign this effect by gender (the evidence is contested).

### 2d. Remarriage and repartnering

| Item | Value | Source | Status |
|---|---|---|---|
| Remarriages among people marrying | 22 % (see 1c) | Destatis | VERIFIED |
| Living with a new partner after separation | **> 40 %**; mean gap from separation to moving in with a new partner **≈ 4.5–5 years** (pooled over Germany and four other countries) | GGS wave 1 (2005), [GGP research note 002](https://www.ggp-i.org/wp-content/uploads/2017/08/ggp_research_note_002.pdf) | SECONDARY |
| Who repartners | little difference by sex overall; women who are older at divorce repartner much less often; higher education raises repartnering for both sexes | Jaschinski, Zeitschrift für Familienforschung 23(2):219–240 (2011) | SECONDARY |
| Remarriage timing | remarriage propensity is highest **2–5 years** after separation when pre-school children live in the household; divorced women have a higher baseline remarriage propensity than men after controls | Lankuttis & Blossfeld, ZfF 15(1):5–24 (2003), [DOAJ](https://doaj.org/article/8e0080a34e58410b8d125aa5450d5e73) | SECONDARY |
| Ageing reduces repartnering more for women than for men | DEAS 1996–2017 | search snippet of a DEAS study | SECONDARY |

---

## 3. Relationship satisfaction dynamics

See `wellbeing.md` §2 and §5 for life-satisfaction responses to marriage, divorce, widowhood and children (Lucas et al. 2003; Clark et al. 2008; mostly full adaptation within a few years).

| Item | Value / effect size | Data | Source | Status |
|---|---|---|---|---|
| Trajectory by relationship duration | declines from the start; **lowest after about 10 years**; rises again until about 20 years, then declines slightly. The steepest drops are in the first years | meta-analysis: 165 samples, > 165,000 people, 16 countries, durations 3 months – 46 years | Bühler, Krauss & Orth, *Psychol. Bull.* 147(10):1012–1053 (2021); [Univ. Bern press release](https://mediarelations.unibe.ch/media_releases/2021/media_releases_2021/relationship_satisfaction_at_its_lowest_point_after_10_years/index_eng.html) | VERIFIED (press release); per-year d values **UNVERIFIED** |
| Trajectory by age | declines in young adulthood, **low point at age 40**, rises until 65, then stable at a fairly high level | same | same | VERIFIED |
| Floor | average satisfaction never fell below **77 %** of the scale maximum | same | same | VERIFIED |
| Children | people with children were "somewhat less satisfied"; gender had no effect on the trajectory | same | same | VERIFIED (size UNVERIFIED) |
| Transition to parenthood | pregnancy → 11 months after birth: average **g ≈ −0.23 (men), −0.27 (women)**, a small decline; childless newlyweds show a similar decline over the same time | meta-analysis, 37 + 4 studies | Mitnick, Heyman & Smith Slep, *J. Family Psychology* 23(6):848–852 (2009), values as cited in later papers | SECONDARY |
| Same, newer meta-analysis | new parents ≈ **−0.30**, couples without a baby ≈ **−0.12** over the same window | 49 studies | Frontiers in Psychology 2022 ([10.3389/fpsyg.2022.901362](https://www.frontiersin.org/articles/10.3389/fpsyg.2022.901362)), via a blog summary | **UNVERIFIED** (blog) |
| Parenthood in Germany | satisfaction declines persistently after the first birth for both partners; linked to more negative and fewer positive couple interactions, and (for women) to more household labour | pairfam 2008–2022, N = 4,108 | [JOMF 2026 abstract](https://ifp.nyu.edu/2026/journal-article-abstracts/jomf-70059/) | SECONDARY |
| Financial disagreements | the strongest type of disagreement for predicting divorce (both spouses). Couples who argued about money weekly were > 30 % more likely to divorce than couples who argued a few times a month | US NSFH, 4,574 couples | Dew, Britt & Huston, *Family Relations* (2012), [BYU](https://scholarsarchive.byu.edu/facpub/4526) and press coverage | SECONDARY (US data) |
| Unemployment → couple | separation rate ≈ ×1.8 (see 2c); the life-satisfaction penalty of unemployment is in `wellbeing.md` | | | |
| Economic pressure → conflict → lower quality (family stress model) | direction well established; no pooled German effect size found | | Conger et al. family stress model | **UNVERIFIED** (size) |

**Model suggestion (UNVERIFIED parameters, consistent with the sources).** Relationship quality Q on 0–1 starts near 0.85, drifts down ≈ 0.01/year over the first 10 years (faster in years 1–3), then recovers ≈ 0.005/year until year 20. A first birth gives a one-off drop of ≈ 0.25 SD that recovers partly over 2–3 years. Money stress (savings below one month of expenses, or arrears) adds −0.02/year drift and raises the separation hazard by about 1.3× (calibration guess). Couples differ: draw a personal drift term so that some couples improve.

---

## 4. Fertility

### 4a. Age-specific fertility rates (all birth orders)

| Mother's age | 15–19 | 20–24 | 25–29 | 30–34 | 35–39 | 40–44 | 45–49 |
|---|---|---|---|---|---|---|---|
| Births per woman per year (2024) | 0.0055 | 0.0298 | 0.0702 | **0.0976** | 0.0554 | 0.0124 | 0.0008 |
| Peak single years | 31: 0.1028; 32: 0.1024; 30: 0.0984; 33: 0.0969 | | | | | | |

TFR 2024 = 1.356. Source: Eurostat demo_frate (API, "age reached during the year"), VERIFIED. Destatis reports TFR 2025 = 1.32 (`germany.md`). Single-year values are in the API response.

### 4b. Birth order by mother's age (2024)

| Mother's age | 15–19 | 20–24 | 25–29 | 30–34 | 35–39 | 40–44 | All |
|---|---|---|---|---|---|---|---|
| First births (share of births) | 85 % | 67 % | 57 % | 44 % | 32 % | 29 % | **46.5 %** |
| Second | 13 % | 25 % | 30 % | 38 % | 41 % | 34 % | 35.0 % |
| Third | 2 % | 6 % | 9 % | 12 % | 17 % | 19 % | 12.0 % |
| Fourth or later | 0 % | 2 % | 4 % | 6 % | 10 % | 17 % | 6.5 % |

Source: Eurostat demo_fordagec (API; 677,117 live births in 2024), VERIFIED. Mean age at first birth 30.5 (mothers) and 33.3 (fathers), 2025, Destatis (see `germany.md`).

### 4c. Childlessness and parity

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Childless women aged 45–49 | **20 %** (West 20 %, East excl. Berlin 14 %; city-states highest: Hamburg 29 %, Berlin 25 %) | 2022 | ±1 pp | [Destatis press release 226/2023 (EN)](https://destatis.de/EN/Press/2023/06/PE23_226_12.html) | VERIFIED |
| Childlessness by education (women born 1973–77, ISCED) | high **23 %**, medium **21 %**, low **11 %** | 2022 | ±1 pp | same | VERIFIED |
| Same, born in Germany or arrived before age 15 / arrived at 15+ | 22 % (low 16 %, high 24 %) / 12 % (low 8 %, high 18 %) | 2022 | | same | VERIFIED |
| Childless share by age (for first-birth hazards) | born 1988–92 (age 30–34): **48 %**; born 1983–87 (35–39): **27 %** | 2022 | ±2 pp | Mikrozensus 2022 first results via Statista | SECONDARY |
| Parity distribution, women 45–54 | 0 children **20 %**, 1 child **25 %**, 2 children **37 %**, 3+ **17 %**; average 1.6 | 2022 | ±1 pp | Destatis via [statistikportal.de](https://www.statistikportal.de/en/node/179931) (search snippet) | SECONDARY |
| Parity progression (derived from the row above) | P(2nd child \| 1st) ≈ **68 %**; P(3rd \| 2nd) ≈ **31 %** | 2022 | ±3 pp | derived | DERIVED |
| Completed fertility, cohort 1976 | 1.58 | | | `germany.md` | VERIFIED |

### 4d. Time to conception and infertility by age

| Item | Value | Source | Status |
|---|---|---|---|
| Failure to conceive within 12 cycles (well-timed intercourse), by woman's age | 19–26: **8 %**; 27–34: **13–14 %**; 35–39: **18 %**. Absolute sterility ≈ **1 %**, not rising with age. Male age matters from the late 30s (18 → 28 % failure from age 35 to 40). Many "infertile" couples conceive in a second year | Dunson, Baird & Colombo, *Obstet. Gynecol.* 103(1):51–56 (2004); 782 couples from 7 European centres; [PubMed 14704244](https://pubmed.ncbi.nlm.nih.gov/14704244/) | SECONDARY (abstract) |
| Implied average monthly conception probability (homogeneous approximation: (1 − p)¹² = failure share) | 19–26: ≈ **0.19**; 27–34: ≈ **0.155**; 35–39: ≈ **0.13**. Real couples vary: early cycles are higher (≈ 0.25–0.3), and the remaining couples are less fertile | derived | DERIVED |
| Natural conception within 4 years of starting to try (model) | start at 30: **91 %**; 35: **84 %**; 40: **64 %**. ART recovers only part of the births lost by delaying | Leridon, *Hum. Reprod.* 19:1548–1553 (2004), figures as reported in press coverage | SECONDARY |
| Implied monthly probability at 40–44 | ≈ **0.06** for couples who can still conceive (calibrated so that ≈ 64 % conceive within 4 years, allowing for rising sterility) | derived | DERIVED / UNVERIFIED |
| Pregnancy loss | Not researched in this pass. If the game shows pregnancy at all, keep it optional and treat it with care | — | **UNVERIFIED** |

---

## 5. Parental leave, childcare and mothers' return to work

### 5a. Elterngeld (parental allowance) take-up

Benefit rules (rates, 14 months, ElterngeldPlus, income limit) are in `germany.md` §8.

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Fathers' share of all Elterngeld recipients ("Väteranteil") | **25.9 %** (2024: 25.8 %; 2022: 26.1 %); highest Saxony 30.1 %, lowest Saarland 21.0 % | 2025 | ±0.3 pp | [Statistisches Landesamt Sachsen PM 87/2026](https://www.statistik.sachsen.de/download/presse-2026/mi_statistik-sachsen-087-2026_statistikportal_elterngeld_2025.pdf) (Destatis data) | VERIFIED |
| Recipients | ≈ 1.2 million women, ≈ 417,000 men | 2025 | | Destatis 16-04-2026 via [elterngeld.net](https://www.elterngeld.net/elterngeldstatistik.html) | SECONDARY |
| Planned benefit duration, mothers / fathers | **14.9 / 3.8 months** (2024: 14.8 / 3.8) | 2025 | ±0.2 | same; 2024 values also in [BT-Drs. 21/5926](https://dserver.bundestag.de/btd/21/059/2105926.pdf) | SECONDARY |
| Share of children whose father took Elterngeld ("Väterbeteiligung") | **46.3 %** of children born in 2022 | births 2022 | ±1 pp | Destatis, as cited in [IW-Report 31/2026](https://www.iwkoeln.de/fileadmin/user_upload/Studien/Report/PDF/2026/IW-Report_2026-Elternzeit.pdf) | SECONDARY |
| Most fathers take only the 2 partner months | widely reported (about 3 in 4 fathers ≤ 2 months) | | | — | **UNVERIFIED** (distribution not found) |

### 5b. Parental leave (Elternzeit) and work status by age of the youngest child (Mikrozensus 2022)

Shares of all mothers (fathers) whose youngest child is in that year of life. Source: Geis-Thöne, [IW-Report 31/2026](https://www.iwkoeln.de/fileadmin/user_upload/Studien/Report/PDF/2026/IW-Report_2026-Elternzeit.pdf), table 4-1, from the Mikrozensus 2022 scientific use file. Status: VERIFIED (read in the report).

| Year of life of youngest child | 1st | 2nd | 3rd | 4th | 5th | 6th | 8th |
|---|---|---|---|---|---|---|---|
| Mothers: on leave, not working | **58.0** | 25.5 | 9.4 | 2.9 | 0.9 | 0.7 | 0.4 |
| Mothers: on leave, working part-time | 5.2 | 7.4 | 4.0 | 1.5 | 1.1 | 0.9 | 0.5 |
| Mothers: employed (not on leave) | 11.6 | **37.6** | **57.7** | 66.7 | 68.4 | 69.4 | 73.7 |
| Mothers: self-employed | 1.8 | 2.6 | 3.5 | 3.8 | 4.9 | 4.9 | 4.7 |
| Mothers: not employed (outside leave) | 23.4 | 26.9 | 25.4 | 25.2 | 24.8 | 24.1 | 20.7 |
| Fathers: on leave, not working | 5.3 | 2.0 | 0.5 | 0.3 | 0.2 | 0.1 | 0.1 |
| Fathers: on leave, working part-time | 3.2 | 2.1 | 1.1 | 1.0 | 0.7 | 0.6 | 0.3 |
| Fathers: employed (not on leave) | 76.6 | 81.7 | 82.6 | 82.4 | 81.9 | 82.8 | 82.5 |

Other facts from the same report: compared with 2012, mothers return earlier (employed in the 2nd year of life: 43.4 % in 2022 vs 36.8 % in 2012, second method). A 5.3 % annual average of fathers on leave in year 1, with an average 3.3-month leave, corresponds to ≈ 19 % of fathers taking leave in the first year. Women with vocational training are more often still on leave in the 2nd year than graduates (32.7 % vs 22.4 %).

### 5c. Mothers' employment and part-time work by age of the youngest child

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Employment rate, parents aged 20–49, youngest child under 6: mothers / fathers | **50.2 % / 83.2 %**; youngest child 6+: **75.0 % / 85.0 %**; 3+ children with one under 6: mothers 38.2 % | 2025 | ±1 pp | [Destatis Qualität der Arbeit: Erwerbsbeteiligung von Eltern](https://www.destatis.de/DE/Themen/Arbeit/Arbeitsmarkt/Qualitaet-Arbeit/Dimension-3/erwerbsbeteiligung-eltern.html) | VERIFIED |
| Mothers with a child under 3 who are working (leave excluded) | ≈ **40 %** (fathers 89 %) | 2024 | ±2 pp | Destatis release 2024 (search snippet) | SECONDARY |
| **Part-time rate of employed mothers / fathers by age of youngest child** | under 3: **72.6 / 8.8 %**; 3–5: **75.0 / 9.2 %**; 6–9: **70.8 / 8.5 %**; 10–14: **63.9 / 7.5 %**; 15–17: **58.2 / 6.8 %**. All parents 68.1 / 8.3 %; people without children 40.8 / 11.6 %; all employed 49.9 / 10.5 % | 2024 | ±1 pp | Destatis Mikrozensus via [WSI GenderDatenPortal Teilzeit-03](https://www.wsi.de/data/wsi_gdp_ze-teilzeit-03.pdf) | VERIFIED (read at WSI) |
| Child penalty in earnings | 61 % (years 5–10 after first birth) | | | Kleven et al. 2019, in `germany.md` §3 | |

### 5d. Childcare enrolment

| Item | Value | Year (reference date) | Band | Source | Status |
|---|---|---|---|---|---|
| Children under 3 in day care (Kita or childminder) | **37.2 %** (West 34.1 %, East incl. Berlin 53.5 %). 1 Mar 2025: 37.8 % (West 34.5, East 54.9) | 1 Mar 2026 | ±1 pp | [Destatis Betreuungsquote table](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Soziales/Kindertagesbetreuung/Tabellen/betreuungsquote.html) | VERIFIED. Note: population base changed from Census 2011 to Census 2022, so earlier years are not fully comparable |
| Children aged 3–5 in day care | **95.3 %** (West 94.8 %, East 97.6 %); 2025: ≈ 93.2–95 % depending on the population base | 1 Mar 2026 | ±1 pp | same | VERIFIED. Replaces the UNVERIFIED "≈ 91 %" in `germany.md` |
| By single year of age | under 1: **1.8 %**; age 1: **37.5 %**; age 2: **64.5 %** | 1 Mar 2020 | ±2 pp | Destatis via search snippet | SECONDARY (old; the single-year 2025 table was not found) |
| Legal entitlement | from the 1st birthday (in `germany.md`) | | | | |

---

## 6. Child costs by age

The Destatis series is still based on EVS 2018 (`germany.md` §8). No EVS 2023 child-cost release was found.

| Child age (couple with one child) | Consumption spending on the child | Year | Source | Status |
|---|---|---|---|---|
| 0–5 | **679** EUR/month | 2018 | [Destatis Zahl der Woche 2021](https://www.destatis.de/DE/Presse/Pressemitteilungen/Zahl-der-Woche/2021/PD21_26_p002.html) | VERIFIED (in `germany.md`) |
| 6–11 | **786** EUR/month | 2018 | secondary table citing the same EVS | SECONDARY |
| 12–17 | **953** EUR/month | 2018 | Destatis | VERIFIED |
| Average (one child) | 763 EUR/month (21 % of the household's 3,593 EUR consumption); 2013: 660 | 2018 | Destatis | VERIFIED |
| 2026 level | multiply by ≈ **1.25–1.30** for consumer-price inflation 2018→2026 | | `germany.md` | DERIVED / UNVERIFIED (inflation factor) |
| Childcare fees | vary by state, from fee-free to several hundred EUR/month; not researched here | | | **UNVERIFIED** |

Kindergeld: see `germany.md`.

---

## 7. Job changes, promotions and wage gains

| Item | Value | Data | Band | Source | Status |
|---|---|---|---|---|---|
| Annual job transitions, qualified West German employees | total **12.6 %**/year: **internal** (new position with the same employer, a proxy for promotion) **4.1 %**, **external** (employer change) **8.5 %**. 2005–2010: 12.6 % (internal 3.9, external 8.7). Women 15.5 %, men 11.6 % | SOEP 1984–2010 | ±1 pp | Kattenbach, Schneidhofer, Lücke, Latzke, Loacker, Schramm & Mayrhofer, *J. Vocational Behavior* (2014), [PMC3895325](https://pmc.ncbi.nlm.nih.gov/articles/PMC3895325/) (CC BY 3.0) | VERIFIED |
| Age effect | the probability of a job change falls steadily with age; the age effect for moves within the organisation weakened over time, the one for employer changes did not. The paper reports about −8.6 pp per 10 years for total transitions (reported coefficients are inconsistent between table and text) | same | | same | VERIFIED (direction); size uncertain |
| Annual employer change rate by skill level | helpers (unskilled jobs) **11.3 %**; skilled workers **7.3 %** | German employment data | ±1 pp | [Bertelsmann Stiftung press release, 6 Jun 2023](https://rsm-bst-live.bertelsmann-stiftung.de/fileadmin/files/BSt/Presse/PM_2023-06_06_Aufstieg_und_mehr_Geld_So_zahlt_sich_der_Jobwechsel_aus.pdf) | VERIFIED (press release) |
| Number of employers in mid-career (age 35–49) | < 40 % had one employer; 23 % two; 29 % three to five; 9 % six or more. Average ≈ 2.7 employers at 25–34 and 35–49; ≈ 1.8 at 50–60 | SIAB 1975–2023 | | IAB-Kurzbericht 14/2026 ([PDF](https://doku.iab.de/kurzber/2026/kb2026-14.pdf)), [idw summary](https://idw-online.de/en/news875726) | VERIFIED |
| Wage growth, job changers vs stayers | changers **+2.68 %/year**, stayers **+1.34 %/year** (annual average) | BA employment statistics, all employees 1999–2009 | ±0.3 pp | Alm, Engel & Weyh, IAB-Discussion Paper 8/2013, via [Böckler Impuls 02/2014](https://www.boeckler.de/de/boeckler-impuls-jobwechsel-bringt-auch-im-osten-mehr-geld-6690.htm) | SECONDARY |
| Wage gain by distance of the change | change into a closely related occupation ≈ **+3,500 EUR gross/year** more than a change into an unrelated one; a loosely related one ≈ +2,500 EUR | | | Bertelsmann Stiftung 2023 (above) | VERIFIED (press release) |
| Upward moves helper → skilled job | among changers with vocational training: men **82 %**, women **≈ 77 %** succeed; vocational training raises the helper → skilled promotion rate by 50 %; people without training have 3× the risk of a downward move when changing jobs | | | same | VERIFIED (press release) |
| Occupation changes | voluntary changes lead to higher wages than staying; in Germany, wage growth often dips before an occupational change | IAB | | [IAB-Kurzbericht 1/2012](https://doku.iab.de/kurzber/2012/kb0112.pdf) | SECONDARY |
| "Promotion" as a raise ≥ 15 % | ≈ 2.5 % of employees per year | commercial pay data (Oct 2024 – Oct 2025) | | [Ravio](https://get.ravio.com/blog/average-promotion-rate) | SECONDARY (commercial, narrow definition) |
| Annual promotion probability (title change) | **UNVERIFIED**. Use the internal transition rate (≈ 4 %/year) as the upper anchor for formal promotions; a raise beyond the collective agreement is asked in SOEP but no distribution was found | | | | **UNVERIFIED** |

---

## 8. Housing

Rents, purchase prices and transaction costs are in `germany.md` §9.

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| Rent burden (gross cold rent / household net income), tenant main households | **27.8 %** average (19.9 million households). Moved in 2019 or later: 29.5 %; lease before 1999: 26.8 %. **3.1 million** households pay ≥ 40 %, **1.5 million** ≥ 50 % | 2022 | ±0.5 pp | [Destatis PE23_129 (EN)](https://www.destatis.de/EN/Press/2023/03/PE23_129_12_63.html) | VERIFIED |
| Rent burden by household net income | under 1,500 EUR: **44.7 %**; 4,000 EUR and more: **15.9 %** | 2022 | ±2 pp | Destatis via [Statista](https://de.statista.com/statistik/daten/studie/1608423/umfrage/mietbelastungsquote-in-deutschland-nach-einkommen) | SECONDARY |
| Housing costs as a share of disposable income (all tenures) | all **24.5 %**; above the poverty threshold 21.0 %; below it **43.8 %**; one adult 33.3 %; two adults 22.3 % | 2024 | ±1 pp | Eurostat ilc_mded01 (API) | VERIFIED |
| Housing cost overburden rate (housing costs > 40 % of disposable income) | **12.0 %** of people; market-rent tenants 13.8 %; owners with a mortgage 14.5 %; owners without 6.8 % | 2024 | ±1 pp | Eurostat ilc_lvho07c (API) | VERIFIED |
| Home ownership, share of people | **47.2 %** (households: 41.9 %, `germany.md`). People above the poverty threshold **51.6 %**, below it **22.9 %**. Owners with a mortgage 23.2 %, outright 24.0 % | 2024 | ±1 pp | Eurostat ilc_lvho02 (API) | VERIFIED |
| Home ownership by age | age 16–34: **≈ 12 %**; 35–44: **just under 40 %** (other West European countries > 50 %) | ≈ 2020 | ±3 pp | Voigtländer (IW), [Bundestag hearing statement 2022](https://www.bundestag.de/resource/blob/919816/685c46f2440cf82f302e9b3af9679930/Stellungnahme-SV-Prof-Dr-Voigtlaender-data.pdf) | VERIFIED (read in the statement; underlying data Eurostat/SOEP) |
| Same, earlier | 25–34: 12 %; 35–44: 38 % (both 5 pp below 2010) | 2017 | | IW via secondary press | SECONDARY |
| Capital needed to buy | ≈ 20–30 % of the price (5–8 % transaction costs plus 10–20 % equity); only ≈ 15 % of tenants (< 12 % of tenants aged 25–40) have enough | 2018 data | | Voigtländer 2022 (above) | VERIFIED |
| Age at first home purchase | not found. Model suggestion: median ≈ **35–40**; the process is late because people wait for a stable relationship, job and income | | ±3 years | Interhyp statement ("relatively late") | **UNVERIFIED** (number) |
| Annual moving rate, tenants | ≈ **10 %** per year. Method: 6.6 million of 19.9 million tenant households (33 %) moved in during 2019–2022 (≈ 3.5 years) → ≈ 10–11 %/year | 2022 | ±2 pp | derived from Destatis PE23_129 | DERIVED |
| Same, from meter-reading data (multi-family rented flats) | 9.4 % (2014), 9.9 % (2013), peak 12.7 % (2007); East higher than West | 2014 | | Techem via [baulinks](https://www.baulinks.de/webplugin/2003/1318.php4) | SECONDARY (old) |
| Annual moving rate, owners | ≈ 2–3 %/year | | | — | **UNVERIFIED** |
| Main reasons for moving | flat too small 20.9 %, job 17.8 % (up to 3 answers) | 2008 | | SOEP via Statista | SECONDARY (old) |

---

## 9. Care for ageing parents (informal care)

| Item | Value | Year | Band | Source | Status |
|---|---|---|---|---|---|
| People needing long-term care (SGB XI) | ≈ **5.7 million**; 86 % (4.9 million) cared for at home; **3.1 million** receive only the care allowance and are cared for mainly by relatives; 1.1 million with home care services | Dec 2023 | ±1 % | Destatis Pflegestatistik 2023, via search snippet | SECONDARY |
| Informal carers aged 18+ | **5.65 million**: 18–49: **1.65 m**; 50–65: **2.57 m**; 66+: **1.43 m**. Women 3.38 m, men 2.27 m | 2022 | ±5 % | SOEP v39; Stockhausen, [IW-Trends 4/2025](https://www.iwkoeln.de/fileadmin/user_upload/Studien/IW-Trends/PDF/2025/IW-Trends_2025-04-01_Stockhausen-neu.pdf), table 1 | VERIFIED |
| Share of the age group providing care | 18–49: ≈ **5 %**; 50–65: ≈ **12–13 %**; 66+: ≈ **8 %** | 2022 | ±2 pp | derived: carers above ÷ approximate population (≈ 33 m, ≈ 21 m, ≈ 18 m; population counts UNVERIFIED) | DERIVED |
| Earlier estimate | 5–6 % of all adults provide care regularly | 2001–2012 | | Geyer, [DIW Wochenbericht 14/2014](https://www.diw.de/de/diw_01.c.458718.de/publikationen/wochenberichte/2014_14_2/who_cares__die_bedeutung_der_informellen_pflege_durch_erwerbstaetige_in_deutschland.html) | SECONDARY |
| Carers providing > 10 hours/week | 2.2 million of ≈ 5.3 million | 2022 | | DIW estimate, via a book excerpt | SECONDARY |
| Care hours per working day | average **2.7 h**: women 3.0, men 2.4; age 18–49: 3.0; 50–65: **2.1** (care of parents with lower needs); 66+: 3.6 (often a spouse). Full-time workers **1.9 h**, part-time 2.3, not employed 3.8 | 2022 | ±0.2 h | IW-Trends 4/2025, table 1 | VERIFIED |
| Employment of carers | ≈ 45 % of carers aged 18–65 work full-time; ≈ 75 % of carers 18–49 are employed (≈ 35 h/week) | 2022 | | same | VERIFIED |
| Change in employment when care starts (age 18–65) | ≈ 90 % of full-time carers already worked full-time before; of part-time carers, 10.2 % had cut down from full-time and 11.1 % had started work. **10 %** of carers moved into non-employment after taking on care (≈ 400,000 people), while ≈ 260,000 took up work | 2022 | | same | VERIFIED |
| Main care time reported by main carers (any age) | 49 h/week (2019: 43 h) | 2023 | | WIdO monitor (Forsa survey) | SECONDARY (different definition: main carers of working age) |
| Causal effect of caregiving on labour supply | negative, larger for women; persistence studied by Heger & Korfhage (2017) and Fischer-Weckemann & Korfhage (J. Health Econ., 2024) | SOEP | | [ilpnetwork](https://ilpnetwork.org/?p=8855) and RePEc listings | SECONDARY (no effect size read) |

**Model suggestion.** Make care for a parent an event that follows the parent's need for care, not a free hazard on the player. If the model has no parent agents: onset of a parental-care episode ≈ **3 %/year at own age 50–65** and ≈ 1 %/year at 18–49 (prevalence ÷ an assumed 4–5-year episode length, which is UNVERIFIED). An episode costs ≈ 2–3 h per working day. For a full-time worker, the default is to keep the job (90 %), with a 10–15 % chance of reducing hours or leaving work.

---

## 10. Death of a parent (derived from the life table)

**Method (DERIVED).** Source: Destatis Sterbetafel 2022/2024, Statistischer Bericht 12613 tables b01/b02 (single-year qₓ, males and females; xlsx downloaded from Destatis; DL-DE-BY 2.0). Assume the mother is **29** and the father **32** years older than the child (mean ages at birth for people born 1975–1995; current values are 31.9 and 34.8, `germany.md`). The parent's annual death probability at the child's age a is q(a + gap). The chance that the parent is still alive is l(a + gap) / l(gap), assuming the parent was alive at the birth. Parents' deaths are treated as independent. **Caveats:** (1) a period life table understates future mortality improvement, so for young players the parents' survival is somewhat *understated*; (2) real age gaps vary (sample the gap per character, for example a normal distribution with SD 5 years); (3) mortality differs by socio-economic status (see `germany.md` / `wellbeing.md`).

| Own age | Mother: death probability per year | Father: per year | Mother still alive | Father still alive | Both alive | At least one alive | Mother, ppm/month | Father, ppm/month |
|---|---|---|---|---|---|---|---|---|
| 20 | 0.16 % | 0.41 % | 98.6 % | 96.7 % | 95.3 % | ≈ 100 % | 137 | 338 |
| 25 | 0.27 % | 0.67 % | 97.6 % | 94.3 % | 92.1 % | 99.9 % | 225 | 557 |
| 30 | 0.44 % | 1.14 % | 96.0 % | 90.5 % | 86.9 % | 99.6 % | 370 | 957 |
| 35 | 0.76 % | 1.85 % | 93.4 % | 84.2 % | 78.7 % | 99.0 % | 639 | 1,555 |
| 40 | 1.20 % | 2.76 % | 89.2 % | 75.4 % | 67.2 % | 97.3 % | 1,008 | 2,327 |
| 45 | 1.90 % | 4.25 % | 82.9 % | 63.8 % | 52.8 % | 93.8 % | 1,601 | 3,611 |
| 50 | 3.35 % | 7.09 % | 73.3 % | 48.7 % | 35.7 % | 86.3 % | 2,834 | 6,112 |
| 55 | 6.20 % | 13.05 % | 58.9 % | 30.2 % | 17.8 % | 71.3 % | 5,321 | 11,588 |
| 60 | 12.81 % | 23.76 % | 37.7 % | 12.0 % | 4.5 % | 45.1 % | 11,360 | 22,352 |
| 65 | 23.61 % | 36.32 % | 14.9 % | 2.2 % | 0.3 % | 16.7 % | 22,192 | 36,903 |

So with these assumptions about half of 45-year-olds still have both parents, and about half of 60-year-olds have lost both. The expected number of parent deaths per year peaks at **≈ 7.6 %** of people aged 55–60 (DERIVED).

**Implementation.** Best: simulate each parent as a lightweight agent with an age and the same life-table hazard as other characters (then care needs and inheritance follow naturally). Simplest: per living parent, monthly hazard = 1 − (1 − q(parent age))^(1/12), with q from the life table.

---

## 11. Recommended monthly hazards (ppm) for the model

All values are per person (or per couple) at risk, per month. "Calibrate" means the value is a starting point that should be tuned so the simulated population matches the VERIFIED stock shares above (for example, single shares by age in §1).

| # | Event (population at risk) | Recommended ppm/month | Derivation |
|---|---|---|---|
| 1 | Start a steady partnership (singles who want one) | age 18–29: **15,000**; 30–39: **11,000**; 40–54: **7,000**; 55–69: **3,500**; 70+: **1,200** | Calibrate: single shares 42 % (20–29) → 11 % (40–54) (FReDA, §1b); ⅔ of singles want a partner; older singles repartner less (§2d). UNVERIFIED levels |
| 2 | Move in together (steady LAT couple) | **20,000** in years 1–3 of the relationship, then 8,000 | Calibrate to ≈ 50 % co-resident at 25–34 and first cohabitation ≈ 25–26 (UNVERIFIED) |
| 3 | Cohabiting couple separates | year 1: **4,000**; years 2–5: **7,500**; 6+: 5,000 | ≈ 30 % separated within 5 years, > 90 % intact after year 1 (Hiekel & Fulda; 0.30 over 5 years ≈ 6,000 ppm average) |
| 4 | Cohabiting couple marries | years 1–5: **10,000**; later: 4,000 | 1970s cohort: > 60 % married within 5 years (≈ 16,000 ppm); lowered because 39 % of couples under 40 are now unmarried. Calibrate to the married share by age |
| 5 | Married couple divorces (legal divorce; shift 12–18 months earlier for separation) | duration 1: **175**; 2: **930**; 3–4: **1,200**; 5–9: **1,600**; 10–14: **1,300**; 15–19: **1,050**; 20–25: **850**; 26+: **400** | Destatis duration-specific rates 2015 scaled to the 2024 total of 28.0 %, divided by the share still married (§2a); lifetime ≈ 33 % |
| 5a | Multiplier after involuntary job loss of either partner | **×1.6** for 24 months | Di Nallo et al. (×1.8), Keldenich & Lücke (+54 % to +74 %) |
| 6 | Remarry / repartner after separation | **9,000** (years 1–5 after separation), 4,000 later; women 50+ ×0.5 | > 40 % live with a new partner, mean ≈ 4.5–5 years after separation (GGS) |
| 7 | First birth (childless women, all) | age 20–24: **1,800**; 25–29: **4,600**; 30–34: **7,500**; 35–39: **5,400**; 40–44: **1,450**; 45+: ≈ 50 | ASFR × first-birth share (Eurostat 2024) ÷ childless share (≈ 92 %, 72 %, 48 %, 27 %, 21 %; the 20–29 values are UNVERIFIED estimates). For partnered women who want a child, use the conception probability in #9 instead |
| 8 | Second birth (mothers with one child, from month 12 after the first birth) | **15,000** if mother < 35; ×0.6 at 35–39; ×0.2 at 40–44 | P(2nd \| 1st) ≈ 68 % (Destatis parity 2022); 15,000 ppm over ≈ 5 years gives ≈ 60 %, plus later births. Third birth: ×0.35 of these values (P ≈ 31 %) |
| 9 | Conception per month (couple actively trying, no contraception) | woman 19–26: **190,000**; 27–34: **155,000**; 35–39: **130,000**; 40–44: **60,000**; plus ≈ 1 % sterile at any age | Dunson et al. 2004 (12-cycle failure 8 / 13.5 / 18 %); Leridon 2004 for 40+. Add frailty (per-couple multiplier, mean 1) so that a share takes > 12 months |
| 10 | Mother returns to work (on leave, child under 3) | months 0–11: **8,000**; months 12–23: **55,000**; months 24–35: **60,000** | Leave shares 63 % → 33 % → 13 % between child years 1, 2 and 3 (IW-Report 2026, table 4-1). On return, part-time with p ≈ 0.73 (WSI 2024) |
| 11 | Father takes Elterngeld (at each birth) | one-off probability **0.46**; duration: 2 months with p ≈ 0.75 (UNVERIFIED), else 3–12 months | Väterbeteiligung 46.3 % (births 2022); average planned 3.8 months |
| 12 | Child starts day care | probability per child: by age 1: **0.38**; by age 2: **0.65**; by age 3–5: **0.95** (East: higher) | Destatis 2020 single-year rates, 2026 group rates |
| 13 | Change employer (employed) | **7,000** at age 25–34 (helpers ×1.4); 35–49: **5,500**; 50–64: **2,500** | External transitions 8.5 %/year (SOEP qualified, ≈ 7,400 ppm); helpers 11.3 %, skilled 7.3 % (Bertelsmann); falls with age (Kattenbach et al.; IAB: 1.8 employers at 50–60). Age split UNVERIFIED |
| 13a | Wage effect of a voluntary employer change | +3 to +8 % one-off (related occupation higher; unrelated ≈ 0) | Changers gain ≈ +1.3 pp/year more than stayers (Alm, Engel & Weyh); ≈ +2,500 to +3,500 EUR/year for related moves (Bertelsmann). Size of the one-off step UNVERIFIED |
| 14 | Internal promotion (employed, same employer) | **3,400** (age < 40), **2,000** (40–54), **800** (55+) | Internal transitions 4.1 %/year 1984–2010 (≈ 3.9 % in 2005–10). Promotion pay step ≈ +5–10 % (UNVERIFIED) |
| 15 | Move home (tenant household) | **9,000** | ≈ 10 %/year (derived from Destatis move-in years) |
| 15a | Move home (owner household) | **2,000** | UNVERIFIED |
| 16 | First home purchase (tenant couple with equity ≥ 20 % of the price) | **4,000** | Calibrate to ownership ≈ 12 % at 16–34 and ≈ 40 % at 35–44 (Voigtländer), and to the capital barrier (only ≈ 15 % of tenants have enough). UNVERIFIED |
| 17 | Start caring for a parent (if parents are not agents) | own age 18–49: **850**; 50–65: **2,500**; 66+: **800** | Prevalence 5 % / 12–13 % / 8 % (SOEP 2022) ÷ assumed 4–5-year episodes (UNVERIFIED episode length) |
| 17a | Leave work or cut hours when care starts (employed carer) | one-off probability **0.10–0.15** | IW-Trends 4/2025: ≈ 10 % move to non-employment; ≈ 10 % of part-timers cut from full-time |
| 18 | Death of a living parent | from the life table: mother 1 − (1 − q_f(own age + 29))^(1/12); father 1 − (1 − q_m(own age + 32))^(1/12). Example at own age 40: mother **1,008**, father **2,327**; at 55: **5,321** / **11,588** | Destatis Sterbetafel 2022/24 (§10) |

**Open items (to verify before shipping):** single-year 2025 childcare rates; childless share at ages 20–29; median age at first cohabitation; fathers' Elterngeld duration distribution; German promotion rate and promotion pay step; owners' moving rate; age at first home purchase; caregiving episode length; per-year effect sizes in Bühler et al. 2021; EVS 2023 child-cost update.
