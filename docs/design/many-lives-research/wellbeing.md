# Wellbeing, work, health and relationships: effect sizes for the "Many Lives" monthly life model

**Second pass (2026-10-21).** This file was not a priority for the MVP pass. One change: the Blanchflower midlife-low ages (47.2 advanced, 48.2 developing countries) are now confirmed from the NBER working-paper abstract (w26641, 132 countries; https://www.nber.org/papers/w26641). The McKee-Ryan pooled effect size was searched for but is still UNVERIFIED. All other UNVERIFIED items are unchanged.

Compiled 2026-10-18. Every number below was checked against an abstract, an official page or full text unless marked **UNVERIFIED**. Most estimates are **observational associations, not causal effects**. Treat them as calibration anchors, not as laws.

**Licence note.** Numbers and facts are not copyrightable. Citing an effect size with attribution is fine. Reproducing figures, tables or datasets is a different matter: check each licence first. Licence notes are given only where they matter (datasets).

**Health-content care (for the design).** Mortality, depression, burnout and disability findings are population averages. The game should never present them as personal predictions or medical advice. It should frame them as "people in situations like this, on average…". It should also avoid deterministic doom, for example "lonely means dies early". Where depression or burnout appear as game states, show recovery and help-seeking as normal and effective. Do not use these states as punishments for "bad play".

---

## 1. Money and wellbeing

| Finding | Effect size / units | Source (year) | Population | Uncertainty / caveats | Status |
|---|---|---|---|---|---|
| Experienced wellbeing (momentary feeling) rises **linearly in log income**, with no plateau at $75k; the slope above $80k is as steep as below it | Linear in log(income); no kink | Killingsworth, *PNAS* 118(4) e2016976118 (2021). https://www.pnas.org/doi/10.1073/pnas.2016976118 | 33,391 employed US adults aged 18–65; 1,725,994 experience-sampling reports (app, non-representative) | Not a representative sample; within-person feeling scale | Verified (abstract and ScienceDaily) |
| "Conflict resolved": a plateau near $100k exists **only for the least-happy ~20%**. For the middle, happiness keeps rising with log income; for the happiest, it **accelerates** above $100k | Quantile-specific log-income slopes | Killingsworth, Kahneman & Mellers, *PNAS* 120(10) e2208661120 (2023). https://www.pnas.org/doi/10.1073/pnas.2208661120 | Same US data, reanalysed by quantile (adversarial collaboration) | Disputed by Bennedsen (arXiv 2401.05347), who criticises the threshold assumptions | Verified (abstract-level) |
| Life satisfaction rises with log income both **within and across countries**, with no satiation point found | Within- and between-country log-income gradients are similar | Stevenson & Wolfers, *Brookings Papers on Economic Activity* 2008(1):1–102. https://www.brookings.edu/articles/economic-growth-and-subjective-well-being-reassessing-the-easterlin-paradox ; Stevenson & Wolfers, *AER P&P* 103(3):598–604 (2013). https://www.nber.org/papers/w18992 | Gallup World Poll, WVS and others; 100+ countries | The exact slope (often quoted as ~0.3–0.4 ladder points per log point within countries, ~0.4 across countries) is **UNVERIFIED**; check the tables | Direction verified; slope **UNVERIFIED** |
| Relative income: holding own income fixed, **higher neighbour earnings go with lower happiness** | The effect of neighbours' log earnings is negative and of similar order to own income (exact coefficient **UNVERIFIED**) | Luttmer, *QJE* 120(3):963–1002 (2005). https://www.nber.org/papers/w10667 | US NSFH panel, 1987–94 | Panel controls for selection; the author reads it as relative consumption | Direction verified; magnitude **UNVERIFIED** |
| Absolute income dominates; relative comparison plays a "more limited" role at country level | Qualitative | Stevenson & Wolfers 2008 (above) | Cross-country | Contrasts with the Easterlin view | Verified |
| World Happiness Report (WHR) | Cantril ladder 0–10, 3-year national averages with 95% CIs | Helliwell, Layard, Sachs, De Neve et al., WHR (annual). https://worldhappiness.report/data-sharing/ | Gallup World Poll, ~1,000 respondents per country per year | **Licence:** the Figure 2.1 data is a free download and attribution to WHR and Gallup World Poll is expected. Dashboards have been reported as **CC BY-NC-SA 4.0** (non-commercial: check before shipping). Gallup microdata is **not** free (subscription or request). Our World in Data republishes it with WHR attribution. | Licence terms partly **UNVERIFIED**: read the WHR site before reuse |

**Model suggestion.** `wellbeingDelta ∝ k · Δln(income)`, with k the same at all income levels. Optionally add a small negative term for `ln(income / peerIncome)` that is weaker than the own-income term. Add a cap or flattening only for a "chronically unhappy" trait subgroup, which mirrors the 2023 result.

---

## 2. Unemployment, life events and adaptation

| Finding | Effect size / units | Source (year) | Population | Uncertainty / caveats | Status |
|---|---|---|---|---|---|
| Unemployment lowers wellbeing **far beyond the income loss**: the non-pecuniary effect is much larger than the income effect | Fixed-effects life satisfaction (0–10): large negative effect | Winkelmann & Winkelmann, *Economica* 65(257):1–15 (1998). https://ideas.repec.org/a/bla/econom/v65y1998i257p1-15.html | German men of working age, SOEP | Within-person (fixed effects) | Verified |
| Unemployment effect in SOEP fixed effects ≈ **−0.67** life-satisfaction points (0–10) | −0.671 points | Cited in Stutzer & Frey (2008 WP), referencing Stutzer & Frey 2004 Table 4 | Germany, SOEP | One specification | Verified (as quoted in the Stutzer & Frey PDF) |
| Meta-analysis: unemployed vs employed distress **d = 0.51**; **34%** of unemployed vs **16%** of employed have psychological problems; longitudinal evidence supports causation; selection is weak; harm is greater for men, blue-collar workers, and in countries with weak protection or high inequality; interventions d = −0.35 | Cohen's d; prevalence | Paul & Moser, *J. Vocational Behavior* 74(3):264–282 (2009). https://cris.fau.de/publications/117729304 | 237 cross-sectional and 87 longitudinal studies | Heterogeneity across countries | Verified (note: d = 0.51, not 0.54) |
| McKee-Ryan et al. meta-analysis: the unemployed have lower psychological and physical wellbeing; effect moderated by duration | 104 studies, 437 effect sizes (pooled ES **UNVERIFIED**) | *J. Applied Psychology* 90(1):53–76 (2005) | Multi-country | | Partly verified |
| **Lags and leads**: people **adapt fully** to marriage, divorce, widowhood, birth of a child and layoff, but there is **little adaptation to unemployment (men)**. Effects start before the event (anticipation). | Pattern only; per-year coefficients **UNVERIFIED** | Clark, Diener, Georgellis & Lucas, *Economic Journal* 118(529):F222–F243 (2008). https://researchonline.lse.ac.uk/id/eprint/19656 | Germany SOEP, 20 waves | Men are somewhat more affected by labour-market events | Verified (abstract) |
| Marital transitions: on average people react and then return toward baseline, with **large individual variation**. Widowed people end up below their pre-marriage level but mostly recover close to it. | Pattern | Lucas, Clark, Georgellis & Diener, *JPSP* 84(3):527–539 (2003). https://eprints.kingston.ac.uk/21016 | Germany SOEP, 15 years, >24,000 people | Heterogeneity matters | Verified |
| **Disability**: onset of long-term disability brings a **lasting** drop in life satisfaction with no full adaptation; psychological distress shows partial adaptation | SOEP/BHPS; drop of roughly 0.5–1.0 points on 0–10 depending on severity (**UNVERIFIED** magnitude) | Lucas, *JPSP* 92(4):717–730 (2007) | Germany (SOEP), UK (BHPS) | Oswald & Powdthavee (2008, *J. Public Econ.*) find **partial adaptation of ~30–50%** | Direction verified; magnitude **UNVERIFIED** |
| Scarring: past unemployment lowers later wellbeing even after re-employment | Pattern (Clark, Georgellis & Sanfey 2001, *Economica*) | — | Germany | | **UNVERIFIED** in this session (well-known literature) |

**Model suggestion.** Treat unemployment as a persistent negative state with no or slow decay. Give layoffs and marriage-related events a spike plus decay (half-life roughly 1–3 years; **UNVERIFIED** parameter). Disability gets a permanent partial offset with 30–50% adaptation. Add individual variance: some characters do not return to baseline.

---

## 3. Age

| Finding | Effect size / units | Source (year) | Population | Caveats | Status |
|---|---|---|---|---|---|
| U-shape of wellbeing in age, with the **low point around age 47–50** after controls | Midlife low ~age 47–48: 47.2 (187 advanced-country estimates), 48.2 (257 developing-country estimates), per the NBER w26641 abstract (verified in the second pass; the published J Pop Econ version was not re-checked) | Blanchflower, *J. Population Economics* 34:575–624 (2021) | 145 countries, under-70s | **Contested.** The U-shape depends on controls (over-control bias) and differs by data source. Kratz & Brüderl (2021) find no robust U-shape in panel data (**secondary summary**). Bartram (2023, *NIER*) finds U-shapes in 18 of 30 European countries. The size is small (a few tenths of a point) | Verified (abstract and debate) |
| Marriage flattens the midlife dip | Qualitative | Grover & Helliwell, *J. Happiness Studies* 20:373–390 (2019) | UK BHPS/APS; Gallup | | Verified |
| **Job satisfaction is U-shaped in age**: minimum at **~31** without controls and **~36** with controls (overall job satisfaction) | Ordered probit turning point | Clark, Oswald & Warr, *J. Occup. Organ. Psychol.* 69(1):57–81 (1996). https://www.andrewoswald.com/docs/jooparticle.pdf | 5,192 British employees, BHPS wave 1 (1991) | Cross-section (cohort effects possible) | **Verified (full text)** |
| Older workers have **more favourable job attitudes** on most of 35 attitudes; effects are weak to moderate | Meta-analytic correlations (small) | Ng & Feldman, *Personnel Psychology* 63(3):677–718 (2010) | >800 articles | Exceptions: older women report lower satisfaction with promotion and less trust | Verified |
| With age, **intrinsic motives increase**; growth and extrinsic motives decrease | Meta-analytic correlations | Kooij et al., *J. Organizational Behavior* 32(2):197–225 (2011) | Multi-study | | Verified |
| **Burnout is more often reported by younger workers** (surveys): UK 18–34: 42%; 35–54: 33%; 55+: 20% (past 12 months). US Gen Z/Millennials 72–77% vs Boomers 38% "burnout symptoms" | Survey prevalence | Avilio (UK, 2025, n = 1,284); Seramount (US, 2025, n = 1,000) | Commercial surveys, varying measures | Low quality: non-peer-reviewed, measures not comparable. Survivor and selection effects (burned-out older workers leave the workforce) | Verified as reported; **low evidential quality** |
| Sleep need: **7–9 h** (young adults 18–25 and adults 26–64), **7–8 h** (65+) | Hours per day | Hirshkowitz et al. (National Sleep Foundation), *Sleep Health* 1(1):40–43 (2015) | Expert panel (RAND/UCLA method) | Expert consensus, not a dose-response study | Verified |
| Aerobic capacity (VO₂peak) declines **~3–6% per decade in the 20s–30s**, accelerating to **>20% per decade in the 70s+**; the decline is similar across activity quartiles (the level differs) | % per decade | Fleg et al., *Circulation* 112:674–682 (2005), Baltimore Longitudinal Study of Aging (BLSA) | 810 US adults aged 21–87, longitudinal | HUNT3 (Norway): 2–5% in the 30s–40s, >12% in the 70s+. The cross-sectional "~10%/decade" rule is a simplification | Verified (secondary reviews, e.g. PMC9975246) |
| Work ability declines with age on average, but variance grows and depends strongly on job demands and health (Work Ability Index, Ilmarinen) | — | Ilmarinen (various) | Finland | | **UNVERIFIED** in this session |

### Evaluating the assumption "the young cope better with high workloads and are more motivated; the old are disillusioned"

**Mostly not supported.**
- **Physical recovery capacity** does decline with age (VO₂peak, sleep architecture), so "the young recover faster physically" is defensible.
- **Motivation** does not fall; it changes. Intrinsic motives rise, and growth and extrinsic motives fall (Kooij 2011).
- **Job satisfaction and job attitudes** are *higher* in older workers (Ng & Feldman 2010), and job satisfaction is U-shaped with a trough in the early-to-mid 30s (Clark, Oswald & Warr 1996).
- **Burnout** is reported *more* by younger workers in surveys. Disillusionment, where it appears, is concentrated in the early-to-mid career, not old age.
- **Long-hours health risk** (section 4) applies at all ages.

**Recommendation.** Model age as follows:
- `physicalRecoveryRate` decreases with age.
- `jobSatisfaction` follows a U-shape with its trough at 31–36.
- `burnoutRisk` is slightly *higher* for young and early-career characters (less control, less experience).
- `motivation` shifts from extrinsic and growth goals to intrinsic and social goals.

This avoids an ageist stereotype that the evidence contradicts.

---

## 4. Work

| Finding | Effect size / units | Source (year) | Population | Caveats | Status |
|---|---|---|---|---|---|
| ≥55 h/week vs 35–40 h: **stroke RR 1.35** (95% CI ~1.13–1.61), **IHD RR 1.17** (95% CI ~1.05–1.31) | Risk ratio, incidence and mortality | Descatha et al. (stroke), *Environ. Int.* 142:105746 (2020); Li et al. (IHD), *Environ. Int.* 142:105739 (2020) (WHO/ILO systematic reviews) | Global cohorts | Exact CIs **UNVERIFIED** (approximate). IHD evidence contested (a Danish register replication found no increase). Dose-response seen for stroke only | RRs verified |
| Burden: **745,000 deaths** in 2016 attributable to ≥55 h/week (398k stroke, 347k IHD); ~9% of people work ≥55 h | Attributable deaths | Pega et al., *Environ. Int.* 154:106595 (2021). https://doi.org/10.1016/j.envint.2021.106595 | 194 countries | Modelled (population attributable fractions, PAF) | Verified |
| Earlier Lancet meta-analysis: ≥55 h → **CHD RR 1.13 (1.02–1.26)**, **stroke RR 1.33 (1.11–1.61)** | Risk ratio | Kivimäki et al., *Lancet* 386:1739–46 (2015) | 603,838 (CHD) / 528,908 (stroke) people | Observational | Verified |
| **Job strain** (high demand plus low control) → **CHD HR 1.23 (1.10–1.37)**; population attributable risk 3.4% | Hazard ratio | Kivimäki et al., *Lancet* 380:1491–97 (2012), IPD-Work consortium | 197,473 people, 13 European cohorts | Smaller than smoking | Verified |
| **Commuting paradox**: one hour one-way vs none → **−0.20** life-satisfaction points (0–10, fixed effects); 1 SD (18 min) → −0.086. Mean commute 22 min one way. Full compensation for 22 min ≈ **€470/month ≈ 35% of average monthly labour income** (working-paper version; authors say "do not insist on the number") | LS points; € | Stutzer & Frey, *Scand. J. Econ.* 110(2):339–366 (2008). PDF: https://wwz.unibas.ch/fileadmin/user_upload/wwz/00_Professuren/Stutzer_Politische_Oekonomie/Publications/Stutzer_Frey_CommutingStress_SJEa.pdf | Germany SOEP, 1985–2003 | The published version's numbers may differ slightly | Verified (full text of WP) |
| Commuting is the **least enjoyable** daily activity (DRM) | Ranking | Kahneman et al., *Science* 306:1776–80 (2004) | 909 employed Texas women | | Verified |
| **Meaningful work**: large correlations with engagement, commitment and job satisfaction (**r ≥ 0.70**); moderate to large with life satisfaction, life meaning, health and withdrawal intentions (**|r| 0.44–0.49**) | Meta-analytic r | Allan, Batz-Barbarich, Sterling & Tay, *J. Management Studies* 56(3):500–528 (2019) | 44 articles, N = 23,144 | Correlational | Verified |
| Repetitive or monotonous low-control work → lower wellbeing (part of the low-decision-latitude concept in the Karasek model) | — | — | — | | **UNVERIFIED** as a specific effect size |
| **Retirement and health: mixed.** An overview of 15 systematic reviews is inconclusive: higher-SES retirees often improve in mental health, lower-SES retirees decline; mortality and cognition evidence mixed. Major biases: reverse causation, healthy-worker effect | Qualitative | Overview of reviews, *Soc. Sci. Med.* (2025); Ageing & Society systematic review (2024). https://www.cambridge.org/core/services/aop-cambridge-core/content/view/A7FEBD5443A8BB59AD5664F2332DE782/S0144686X24000503a.pdf/how-does-retirement-really-affect-physical-health-a-systematic-review-of-longitudinal-studies.pdf | Multi-country | | Verified (abstract-level) |

---

## 5. Relationships

| Finding | Effect size / units | Source (year) | Population | Caveats | Status |
|---|---|---|---|---|---|
| Stronger social relationships → **50% higher odds of survival**; complex social integration OR 1.91; living alone the weakest measure (OR 1.19) | OR 1.50 (95% CI 1.42–1.59) | Holt-Lunstad, Smith & Layton, *PLoS Med* 7(7):e1000316 (2010) (**CC BY**) | 148 studies, 308,849 people, mean follow-up 7.5 years | Observational | Verified |
| Increased odds of mortality: social isolation **OR 1.29**, loneliness **1.26**, living alone **1.32** | Odds ratio | Holt-Lunstad et al., *Perspect. Psychol. Sci.* 10(2):227–237 (2015). https://pubmed.ncbi.nlm.nih.gov/25910392/ | 70 studies, ~3.4 million people | Not proof of causation; objective and subjective isolation are not interchangeable | Verified |
| Married people are more satisfied **even after controlling for pre-marriage wellbeing**; the effect is about twice as large if the spouse is one's best friend | Qualitative and relative | Grover & Helliwell (2019) (above) | UK, Gallup | Selection also exists (Stutzer & Frey 2006, *J. Socio-Econ.*; **UNVERIFIED** this session) | Verified |
| Adaptation to marriage is (near-)complete within a few years (SOEP) | — | Clark et al. 2008; Lucas et al. 2003 | Germany | Contrasts with Grover & Helliwell (UK) | Verified |
| Children of divorce: median effect **d ≈ 0.14 SD** worse outcomes (achievement, conduct, adjustment, self-concept, social relations); strongest for the father–child relationship (−0.26) and conduct (−0.23). The 2001 update confirms deficits persist | Cohen's d | Amato & Keith, *Psychol. Bull.* 110:26–46 (1991); Amato, *J. Family Psychology* 15:355–370 (2001) | 92 studies (1991), mostly US | Small effects with large overlap. Pre-divorce conflict confounds them | 1991 verified; 2001 values **UNVERIFIED** |
| Adults after divorce: drop around the event, then adaptation (SOEP) | — | Clark et al. 2008; Lucas 2005 | Germany | Individual variance | Verified (Clark) |
| **Parenthood happiness gap** varies by country. The US has the largest parent deficit of 22 OECD countries; in Norway and Hungary parents are happier. The gap is **fully explained** by work-family policies (paid leave, childcare cost, sick and vacation days, flexibility) | Country-level gap | Glass, Simon & Andersson, *AJS* 122(3):886–929 (2016) | ESS 2006/08, ISSP 2007/08, 22 countries | Cross-sectional | Verified |
| Time use: childcare ranks **low** in momentary enjoyment while socialising and intimate relations rank highest, even though people name children as their greatest joy | Ranking of 28 activities (DRM) | Kahneman et al. (2004) | 909 US women | Episode vs global evaluation | Verified |

---

## 6. Health

| Finding | Effect size / units | Source (year) | Population | Caveats | Status |
|---|---|---|---|---|---|
| Leisure-time physical activity vs inactive: **1–2× the guideline minimum** (7.5–15 MET-h/week) ≈ **−31%** mortality; **3–5×** ≈ **−39%** (plateau); no harm at ≥10× | Hazard ratio ~0.69 → 0.61 | Arem et al., *JAMA Intern. Med.* 175(6):959–967 (2015). https://pmc.ncbi.nlm.nih.gov/articles/PMC4451435/ | 661,137 people, 6 US/Swedish cohorts | Even below the minimum ≈ −20% (**UNVERIFIED** category label); observational | Mostly verified |
| Lifetime prevalence of a DSM-IV major depressive episode: **14.6%** (10 high-income countries) and **11.1%** (8 low/middle-income); 12-month: 5.5% / 5.9% | % | Bromet et al., *BMC Medicine* 9:90 (2011) (**CC BY**) | 18 countries, World Mental Health surveys (CIDI) | Survey-defined episode | Verified |
| Treatment response (≥50% symptom drop) in primary care vs usual care: psychotherapy **RR 1.60**, antidepressants **RR 1.65**, combination **RR 2.15** | Relative risk | Cuijpers et al., *Ann. Fam. Med.* 19(3):262–270 (2021) | 58 RCTs, 9,301 patients | Absolute response rates **UNVERIFIED**. An older meta-analysis: ~54% response with psychotherapy vs ~41% in control conditions (Cuijpers 2014, per the author's slides) | RRs verified |
| Cumulative remission after up to 4 antidepressant steps: STAR*D reported **67%**; the Pigott 2023 reanalysis found **35%**; the original investigators reply **60%** | % | Pigott et al., *BMJ Open* 13:e063095 (2023) (**CC BY-NC**); AJP reply (2024) | US, 3,671 or 4,041 patients | **Disputed**: present as a range | Verified |
| Burnout / exhaustion disorder recovery: often **months to >1 year**. Workplace-oriented intervention: return-to-work 89% vs 73% at **1.5 years** | Return-to-work % | Swedish RCT (Karlson et al., *BMC Public Health* 14:821, 2014 follow-up) | Sweden | Generic duration distribution **UNVERIFIED**. Individual CBT has weak return-to-work effects | Partly verified |
| Occupational accidents (EU): **1,506 non-fatal** (≥4 days off work) per 100,000 employed per year (2022); fatal 1.66 per 100,000. Ranges from <100 (RO, BG; under-reporting) to >2,000 (ES, PT, FR, DK); construction 2,961 | Incidence per 100k | Eurostat ESAW, Statistics Explained (2024). https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20241119-1 | EU-27 | Eurostat reuse is free with attribution (Commission Decision 2011/833/EU) | Verified |
| Germany: **10,283 new accident pensions** (≥20% reduced earning capacity, *MdE*) from workplace accidents in 2023 = **0.237 per 1,000 full-time workers**; reportable accidents 18.09 per 1,000 full-time workers | Rate | DGUV, *Geschäfts- und Rechnungsergebnisse 2023* | Germany | Approximates "permanent work-capacity reduction": ~1.3% of reportable accidents lead to a pension | Verified (one source) |
| Socioeconomic gradient: US life-expectancy gap top 1% vs bottom 1% of income: **14.6 y (men)**, **10.1 y (women)** (95% CI 14.4–14.8; 9.9–10.3); the gap widened 2001–2014 | Years | Chetty et al., *JAMA* 315(16):1750–66 (2016) | 1.4 billion US tax records | Europe's gradients are smaller (not quantified here) | Verified |

**Monthly hazard conversions (illustrative).** EU non-fatal accident ≈ 1.5%/year ≈ **0.125%/month** of employed people (higher in construction). German permanent-reduction pension ≈ 0.024%/year ≈ **0.002%/month**. Scale these by occupation risk.

---

## 7. Personality (Big Five)

| Finding | Effect size | Source | Status |
|---|---|---|---|
| Personality predicts **mortality, divorce and occupational attainment** about as strongly as SES and cognitive ability. Typical correlations are r ≈ 0.05–0.20, for example conscientiousness → lower mortality, neuroticism → more divorce, agreeableness and conscientiousness → less divorce | Effects "indistinguishable" from SES/IQ (specific r values **UNVERIFIED**) | Roberts, Kuncel, Shiner, Caspi & Goldberg, *Perspect. Psychol. Sci.* 2(4):313–345 (2007); prospective studies only | Main claim verified |
| Earnings: all five traits have significant effects, jointly comparable to cognitive ability. **Men** gain from low agreeableness, emotional stability and openness; **women** gain from conscientiousness and openness. Agreeableness is the largest contributor to the gender pay gap | Wage effects of a few % per SD (exact values **UNVERIFIED**) | Mueller & Plug, *ILR Review* 60(1):3–22 (2006); Wisconsin Longitudinal Study (1957 graduates, 1992) | Verified |

---

## 8. Attractiveness

| Finding | Effect size | Source | Status |
|---|---|---|---|
| Plainness penalty **5–10%** of wages, slightly larger than the beauty premium. Often quoted: men −9% / +5%, women −5% / +4% | % wage | Hamermesh & Biddle, *AER* 84(5):1174–94 (1994); NBER WP 4518. https://www.nber.org/papers/w4518 | Range verified; split by sex verified only from secondary sources |
| Experimental meta-analysis: attractive people get better job-related outcomes (hiring, ratings), **d = 0.37**. Equal for men and women; professionals are as biased as students; declining over time | Cohen's d | Hosoda, Stone-Romero & Coats, *Personnel Psychology* 56(2):431–462 (2003) | Verified |
| Change with age: rated attractiveness declines with age, and the beauty premium persists over the career (Hamermesh 2011, *Beauty Pays*) | — | — | **UNVERIFIED** |

Design note: model beauty as a small wage modifier (±5%) with **no colour-only or appearance-shaming UI**. Use it sparingly, since it encodes real bias.

---

## 9. Discrimination in hiring (field experiments)

| Finding | Effect size | Source | Status |
|---|---|---|---|
| US: whites receive **36% more callbacks than African Americans** and **24% more than Latinos** (studies since 1989); **no decline** over 25 years for African Americans | Callback ratio 1.36 / 1.24 | Quillian, Pager, Hexel & Midtbøen, *PNAS* 114(41):10870–75 (2017). https://pmc.ncbi.nlm.nih.gov/articles/PMC5642692/ ; 28 studies, 55,842 applications | Verified |
| 9 countries, 97 experiments, >200,000 applications. High-discrimination countries: natives get **nearly 2×** the callbacks of non-white applicants; low-discrimination countries: **~1.25×**. **France highest, then Sweden**; smaller in GB, CA, BE, NL, NO, US, DE. Discrimination against white immigrants is low | Callback ratio 1.25–2.0 | Quillian, Heath, Pager, Midtbøen, Fleischmann & Hexel, *Sociological Science* 6:467–496 (2019) (**CC BY**). DOI 10.15195/v6.a18 | Verified (abstract); per-country ratios **UNVERIFIED** |
| GEMM harmonised field experiment: N = 19,181 applications, 53 minority groups, DE / NL / NO / ES / UK / US (2016–18); cross-country comparison of the same groups. Data open on DANS (**CC0**) | Group-specific callback gaps (values **UNVERIFIED**; MENA and African-origin groups typically show the largest gaps) | Lancee et al., *JEMS* 47(6):1181–1200 (2021). DOI 10.1080/1369183X.2019.1622744 | Design verified; results **UNVERIFIED** |

Design note: the **CC0 GEMM data** is the cleanest licence for calibrating callback probabilities. Present discrimination as a structural fact the player encounters, not as a player-chosen trait.

---

## 10. Financial strain and mental health

| Finding | Effect size | Source | Status |
|---|---|---|---|
| Unsecured debt → **any mental disorder OR 3.24**, **depression OR 2.77**, **suicide completion OR 7.9**, problem drinking and drug use higher; smoking not significant (OR 1.35). More severe debt → worse health. **Causality unclear** | Pooled odds ratios | Richardson, Elliott & Roberts, *Clin. Psychol. Rev.* 33(8):1148–62 (2013). https://pubmed.ncbi.nlm.nih.gov/24121465/ ; 65 papers | Verified (CIs **UNVERIFIED**) |

Design note: model debt as raising *stress* and *risk of low mood* with a dose-response by debt severity. Make it bidirectional, since poor mental health also leads to debt. Offer **help pathways** (debt counselling, talking to someone) as in-game options. Suicide must not appear as a game event. If it is mentioned at all, show it only as an out-of-game support resource.

---

## Summary of status

- **Verified (abstract or full text):** Killingsworth 2021/2023; Stevenson & Wolfers (direction); Luttmer (direction); Winkelmann; Paul & Moser (d = 0.51); Clark et al. 2008; Lucas 2003/2007 (direction); Clark, Oswald & Warr (minimum at 31/36); Ng & Feldman; Kooij; NSF sleep; Fleg VO₂; WHO/ILO RR 1.35/1.17 and 745k deaths; Kivimäki 2012/2015; Stutzer & Frey (−0.20 / €470 / 35%); Allan 2019; Holt-Lunstad 2010/2015; Grover & Helliwell; Glass et al.; Kahneman DRM; Arem; Bromet; Cuijpers RRs; STAR*D dispute; Eurostat ESAW; DGUV; Chetty; Roberts (main claim); Mueller & Plug; Hamermesh & Biddle (5–10%); Hosoda d = 0.37; Quillian 2017/2019 (headline); Lancee (design); Richardson ORs.
- **UNVERIFIED:** exact log-income slopes; Luttmer magnitude; Clark 2008 coefficients; disability magnitude; scarring; the WHR licence details; Kratz & Brüderl content; work ability (Ilmarinen); repetitive-work effect size; Amato 2001 values; Big Five correlation sizes; beauty and age; per-country callback ratios; GEMM results; burnout recovery distribution; CIs on the WHO/ILO RRs.
