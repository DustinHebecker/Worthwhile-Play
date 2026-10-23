import type { Param, ParamStatus, Unit } from './types';

/**
 * Non-country-specific calibration values: markets, behaviour, wellbeing and health effect sizes.
 * `region` is where the study's data come from ('world' for multi-country estimates; 'US', 'DE' or 'EU'
 * when a single-country or EU study is the best available anchor). Transcribed from
 * docs/design/many-lives-research/{markets,wellbeing}.md; percentages are written as fractions.
 */
const p = (id: string, value: number, unit: Unit, sourceId: string, year: number, region: string,
  band: readonly [number, number], status: ParamStatus, note?: string): Param =>
  note === undefined ? { id, value, unit, sourceId, year, region, band, status } : { id, value, unit, sourceId, year, region, band, status, note };

export const WORLD_PARAMS: readonly Param[] = [
  // --- World equities and long-run asset returns --------------------------------------------------
  p('world.market.equity-real-return', 0.052, 'rate-per-year', 'ubs-gir-2025', 2024, 'world', [0.047, 0.057], 'verified', 'DMS 1900–2024, 35 markets, geometric; game default 4.5 % net of TER (recommendation)'),
  p('world.market.bond-real-return', 0.017, 'rate-per-year', 'ubs-gir-2025', 2024, 'world', [0.012, 0.022], 'verified', 'world bonds 1900–2024'),
  p('world.market.bill-real-return', 0.005, 'rate-per-year', 'ubs-gir-2025', 2024, 'world', [0, 0.01], 'verified', 'world bills 1900–2024'),
  p('world.market.dm-equity-nominal-return-usd', 0.086, 'rate-per-year', 'french-data-library', 2026, 'world', [0.076, 0.096], 'verified', 'developed markets Jul 1990–Aug 2026, own calc.; band: ±1 pp assumed'),
  p('world.market.dm-equity-vol', 0.15, 'rate-per-year', 'french-data-library', 2026, 'world', [0.14, 0.18], 'verified', 'annualised SD; band from top-10 recommendation (game default 16 %)'),
  p('world.market.dm-monthly-skew', -0.65, 'ratio', 'french-data-library', 2026, 'world', [-0.85, -0.45], 'verified', 'skewness of monthly returns; band: ±0.2 assumed'),
  p('world.market.dm-monthly-kurtosis', 4.4, 'ratio', 'french-data-library', 2026, 'world', [4, 5], 'verified', 'kurtosis (excess 1.4) of monthly returns; band assumed'),
  p('world.market.dm-max-drawdown', 0.54, 'share', 'french-data-library', 2026, 'world', [0.5, 0.58], 'verified', 'max drawdown 1990–2026; MSCI World −57.8 % (secondary) sets the upper band'),
  p('world.market.dm-worst-month', -0.194, 'share', 'french-data-library', 2026, 'world', [-0.25, -0.15], 'verified', 'worst monthly return 1990–2026; band assumed'),
  p('us.market.equity-vol', 0.183, 'rate-per-year', 'french-data-library', 2026, 'US', [0.17, 0.2], 'verified', 'US market Jul 1926–Aug 2026, own calc.; band assumed'),
  p('us.market.equity-nominal-return', 0.104, 'rate-per-year', 'french-data-library', 2026, 'US', [0.094, 0.114], 'verified', '1926–2026; band: ±1 pp assumed'),
  p('us.market.monthly-kurtosis', 10.3, 'ratio', 'french-data-library', 2026, 'US', [8, 12], 'verified', 'inflated by the 1930s; band assumed'),
  p('us.market.drawdowns-over-30pct-per-century', 5, 'count', 'french-data-library', 2026, 'US', [4, 7], 'verified', 'drawdowns >30 % in 100 years; band assumed'),
  p('us.market.drawdowns-over-50pct-per-century', 2, 'count', 'french-data-library', 2026, 'US', [1, 3], 'verified', 'drawdowns >50 % in 100 years; band assumed'),
  p('world.market.equity-real-return-arith-16', 0.07, 'rate-per-year', 'jorda-2019', 2015, 'world', [0.06, 0.08], 'secondary', '16 advanced economies 1870–2015, arithmetic; geometric ≈4.6 %'),
  p('world.market.equity-real-sd-16', 0.22, 'rate-per-year', 'jorda-2019', 2015, 'world', [0.2, 0.24], 'secondary', 'annual SD; band: ±2 pp assumed'),
  p('world.market.housing-real-return-arith-16', 0.07, 'rate-per-year', 'jorda-2019', 2015, 'world', [0.06, 0.08], 'secondary', 'total housing return (6.6 % CAGR), 1870–2015'),
  p('world.market.housing-real-sd-16', 0.1, 'rate-per-year', 'jorda-2019', 2015, 'world', [0.08, 0.12], 'secondary', 'band: ±2 pp assumed'),
  p('world.market.housing-net-rental-yield', 0.045, 'rate-per-year', 'jorda-2019', 2015, 'world', [0.04, 0.05], 'secondary', '"about 4–5 %"; midpoint'),
  p('world.market.safe-real-return-peacetime', 0.02, 'rate-per-year', 'jorda-2019', 2015, 'world', [0.01, 0.03], 'verified', '"real 1–3 % in peacetime"; midpoint'),
  p('world.market.equity-risk-premium', 0.045, 'rate-per-year', 'jorda-2019', 2015, 'world', [0.04, 0.05], 'verified', '"risk premium 4–5 %"; midpoint'),
  // --- Single stocks: dispersion, survival ---------------------------------------------------------
  p('us.stocks.share-beating-tbills', 0.426, 'share', 'bessembinder-2018', 2016, 'US', [0.4, 0.45], 'secondary', 'CRSP 1926–2016, lifetime buy-and-hold vs 1-month T-bills; band assumed'),
  p('us.stocks.share-creating-all-wealth', 0.043, 'share', 'bessembinder-2018', 2016, 'US', [0.024, 0.05], 'secondary', '1,092 of 25,332 stocks; global 1990–2020 study gives 2.4 % (lower band)'),
  p('us.stocks.median-listed-life', 7.5, 'years', 'bessembinder-2018', 2016, 'US', [6, 9], 'secondary', 'median listed life (2018 version); band assumed'),
  p('us.stocks.idiosyncratic-vol', 0.28, 'rate-per-year', 'campbell-2022', 2021, 'US', [0.2, 0.5], 'verified', 'value-weighted 1997–2021; band 20–50 % covers small caps (recommendation)'),
  p('us.stocks.industry-vol', 0.14, 'rate-per-year', 'campbell-2022', 2021, 'US', [0.12, 0.16], 'verified', 'value-weighted industry component; band assumed'),
  p('us.stocks.market-vol', 0.18, 'rate-per-year', 'campbell-2022', 2021, 'US', [0.16, 0.2], 'verified', 'market component in the decomposition; band assumed'),
  p('us.stocks.bankruptcy-rate-expansion', 0.017, 'rate-per-year', 'bcg-2026', 2007, 'US', [0.012, 0.022], 'secondary', 'share of US-listed firms going bankrupt in 2007; band assumed'),
  p('us.stocks.bankruptcy-rate-recession', 0.042, 'rate-per-year', 'bcg-2026', 2009, 'US', [0.035, 0.05], 'secondary', 'share in 2009; band assumed'),
  p('us.stocks.merger-rate-expansion', 0.073, 'rate-per-year', 'bcg-2026', 2007, 'US', [0.05, 0.09], 'secondary', 'exits by merger 2007; band assumed'),
  p('us.stocks.merger-rate-recession', 0.029, 'rate-per-year', 'bcg-2026', 2009, 'US', [0.02, 0.04], 'secondary', 'exits by merger 2009; band assumed'),
  p('us.stocks.five-year-failure-risk', 0.18, 'share', 'bcg-2026', 2025, 'US', [0.08, 0.26], 'secondary', 'all delisting reasons; band = largest vs smallest revenue quartile'),
  // --- Housing price dispersion -------------------------------------------------------------------
  p('us.housing.sale-price-noise-sd', 0.1, 'sd', 'giacoletti-2017', 2012, 'US', [0.05, 0.15], 'secondary', 'lognormal σ per sale (log units), derived: residual SD 11–18 % between two sales ⇒ 8–13 % per sale'),
  // --- Business cycle and FX ----------------------------------------------------------------------
  p('us.cycle.recession-share', 0.14, 'share', 'nber-bcdc', 2020, 'US', [0.12, 0.16], 'secondary', 'share of months in recession 1945–2020; band assumed'),
  p('us.cycle.contraction-months', 10.3, 'months', 'nber-bcdc', 2020, 'US', [8, 13], 'secondary', 'mean contraction 1945–2020; monthly exit ≈ 0.10; band assumed'),
  p('us.cycle.expansion-months', 64.2, 'months', 'nber-bcdc', 2020, 'US', [12, 128], 'secondary', 'mean expansion; band = observed range; monthly entry ≈ 0.016'),
  p('eu.cycle.recession-share', 0.14, 'share', 'eabcn-2025', 2025, 'EU', [0.11, 0.17], 'secondary', 'euro area (region code EU used for the euro area): ≈31 of 224 quarters 1970–2025, own count; band assumed'),
  p('world.fx.real-half-life', 4, 'years', 'rogoff-1996', 1996, 'world', [2, 5], 'secondary', 'consensus 3–5 years; game uses 4 (monthly ρ ≈ 0.986); band from panel estimates 2–2.5'),
  // --- Investor behaviour and fees ----------------------------------------------------------------
  p('us.behaviour.overtrading-penalty', 0.065, 'rate-per-year', 'barber-odean-2000', 1996, 'US', [0.05, 0.08], 'secondary', 'most active quintile 11.4 % net vs market 17.9 % (1991–96); band assumed'),
  p('us.behaviour.average-household-gap', 0.015, 'rate-per-year', 'barber-odean-2000', 1996, 'US', [0.01, 0.02], 'secondary', 'average household 16.4 % net vs market 17.9 %; band assumed'),
  p('us.behaviour.average-household-turnover', 0.75, 'rate-per-year', 'barber-odean-2000', 1996, 'US', [0.6, 0.9], 'secondary', 'portfolio turnover p.a.; band assumed'),
  p('world.behaviour.loss-aversion', 1.955, 'ratio', 'brown-2024', 2024, 'world', [1.82, 2.1], 'verified', 'λ, 95 % interval; 607 estimates, 150 papers'),
  p('eu.fees.active-equity-fund-total', 0.019, 'rate-per-year', 'esma-2026', 2024, 'EU', [0.016, 0.022], 'verified', 'retail equity UCITS (non-ETF), 5-yr horizon 2020–24: ongoing 1.38 + entry 0.51 + exit 0.04; band assumed'),
  p('eu.fees.active-equity-fund-ongoing', 0.0138, 'rate-per-year', 'esma-2026', 2024, 'EU', [0.012, 0.016], 'verified', 'band assumed'),
  p('eu.fees.equity-etf-total', 0.005, 'rate-per-year', 'esma-2026', 2024, 'EU', [0.003, 0.007], 'verified', 'band assumed'),
  p('eu.fees.equity-etf-ongoing', 0.0022, 'rate-per-year', 'esma-2026', 2024, 'EU', [0.001, 0.003], 'verified', 'game ETF TER 0.2 %; band assumed'),
  p('eu.fees.bond-fund-total', 0.013, 'rate-per-year', 'esma-2026', 2024, 'EU', [0.01, 0.016], 'verified', 'bond UCITS total costs (ongoing 0.87 %); band assumed'),
  // --- Wellbeing: unemployment, commuting, age ----------------------------------------------------
  p('de.wellbeing.unemployment-life-satisfaction', -0.671, 'points-0-10', 'stutzer-frey-2008', 2003, 'DE', [-0.9, -0.45], 'verified', 'SOEP fixed effects, one specification (as quoted); band assumed'),
  p('de.wellbeing.commute-1h-life-satisfaction', -0.2, 'points-0-10', 'stutzer-frey-2008', 2003, 'DE', [-0.3, -0.1], 'verified', 'one hour one-way vs none, SOEP 1985–2003; band assumed'),
  p('de.wellbeing.commute-compensation-share', 0.35, 'share', 'stutzer-frey-2008', 2003, 'DE', [0.2, 0.5], 'verified', 'income share that would compensate a 22-min commute (≈ €470/month); authors do not insist; band assumed'),
  p('world.wellbeing.unemployment-distress-d', 0.51, 'sd', 'paul-moser-2009', 2009, 'world', [0.45, 0.57], 'verified', "Cohen's d unemployed vs employed; band assumed"),
  p('world.wellbeing.distress-share-unemployed', 0.34, 'share', 'paul-moser-2009', 2009, 'world', [0.3, 0.38], 'verified', 'share with psychological problems; band assumed'),
  p('world.wellbeing.distress-share-employed', 0.16, 'share', 'paul-moser-2009', 2009, 'world', [0.13, 0.19], 'verified', 'band assumed'),
  p('world.wellbeing.midlife-low-age-advanced', 47.2, 'years', 'blanchflower-2020', 2020, 'world', [45, 50], 'verified', 'U-shape trough, advanced countries; contested, effect a few tenths of a point'),
  p('world.wellbeing.midlife-low-age-developing', 48.2, 'years', 'blanchflower-2020', 2020, 'world', [45, 50], 'verified', 'developing countries'),
  p('gb.wellbeing.job-satisfaction-trough-age', 36, 'years', 'clark-oswald-warr-1996', 1991, 'GB', [31, 37], 'verified', 'with controls (31 without); BHPS 1991'),
  // --- Health and time budget ---------------------------------------------------------------------
  p('world.health.sleep-need', 56, 'hours-per-week', 'hirshkowitz-2015', 2015, 'world', [49, 63], 'verified', '7–9 h/day for adults 18–64 (×7 = 49–63 h/week); midpoint; 65+: 7–8 h/day'),
  p('us.health.vo2-decline-young', 0.0045, 'rate-per-year', 'fleg-2005-review', 2005, 'US', [0.003, 0.006], 'secondary', '3–6 % per decade in the 20s–30s, converted to per year; midpoint'),
  p('us.health.vo2-decline-old', 0.02, 'rate-per-year', 'fleg-2005-review', 2005, 'US', [0.02, 0.03], 'secondary', '>20 % per decade in the 70s+, converted to per year; upper band assumed'),
  p('world.health.long-hours-stroke-rr', 1.35, 'ratio', 'descatha-2020', 2020, 'world', [1.13, 1.61], 'verified', '≥55 vs 35–40 h/week; CI approximate'),
  p('world.health.long-hours-ihd-rr', 1.17, 'ratio', 'li-2020', 2020, 'world', [1.05, 1.31], 'verified', 'CI approximate; contested by a Danish replication'),
  p('world.health.long-hours-share-workers', 0.09, 'share', 'pega-2021', 2016, 'world', [0.07, 0.11], 'verified', 'share of people working ≥55 h/week; band assumed'),
  p('world.health.social-ties-survival-or', 1.5, 'ratio', 'holt-lunstad-2010', 2010, 'world', [1.42, 1.59], 'verified', 'stronger social relationships, odds of survival'),
  p('world.health.isolation-mortality-or', 1.29, 'ratio', 'holt-lunstad-2015', 2015, 'world', [1.15, 1.45], 'verified', 'social isolation; band assumed (CI not transcribed)'),
  p('world.health.loneliness-mortality-or', 1.26, 'ratio', 'holt-lunstad-2015', 2015, 'world', [1.12, 1.4], 'verified', 'band assumed'),
  p('world.health.living-alone-mortality-or', 1.32, 'ratio', 'holt-lunstad-2015', 2015, 'world', [1.18, 1.46], 'verified', 'band assumed'),
  p('world.wellbeing.divorce-child-outcome-d', -0.14, 'sd', 'amato-keith-1991', 1991, 'world', [-0.26, -0.05], 'verified', 'median effect, mostly US studies; band from the domain range (father relationship −0.26)'),
  p('world.health.activity-mortality-hr-1to2x', 0.69, 'ratio', 'arem-2015', 2015, 'world', [0.65, 0.73], 'verified', '7.5–15 MET-h/week vs inactive (−31 %); band assumed'),
  p('world.health.activity-mortality-hr-3to5x', 0.61, 'ratio', 'arem-2015', 2015, 'world', [0.57, 0.65], 'verified', 'plateau (−39 %); band assumed'),
  p('world.health.mde-lifetime-high-income', 0.146, 'share', 'bromet-2011', 2011, 'world', [0.13, 0.16], 'verified', 'DSM-IV major depressive episode, 10 high-income countries; band assumed'),
  p('world.health.mde-12m-high-income', 0.055, 'share', 'bromet-2011', 2011, 'world', [0.045, 0.065], 'verified', 'band assumed'),
  p('world.health.mde-lifetime-lmic', 0.111, 'share', 'bromet-2011', 2011, 'world', [0.095, 0.125], 'verified', '8 low/middle-income countries; band assumed'),
  p('world.health.mde-12m-lmic', 0.059, 'share', 'bromet-2011', 2011, 'world', [0.049, 0.069], 'verified', 'band assumed'),
  p('world.health.debt-depression-or', 2.77, 'ratio', 'richardson-2013', 2013, 'world', [2, 3.5], 'verified', 'unsecured debt; causality unclear; band assumed (CI unverified)'),
  p('world.health.debt-mental-disorder-or', 3.24, 'ratio', 'richardson-2013', 2013, 'world', [2.4, 4], 'verified', 'any mental disorder; band assumed'),
  p('eu.health.accident-nonfatal-rate', 0.01506, 'rate-per-year', 'eurostat-esaw-2024', 2022, 'EU', [0.001, 0.03], 'verified', '1,506 per 100,000 employed (≥4 days off); band = country range (<100 to >2,000) and construction 2,961'),
  p('eu.health.accident-fatal-rate', 0.0000166, 'rate-per-year', 'eurostat-esaw-2024', 2022, 'EU', [0.00001, 0.000025], 'verified', '1.66 per 100,000 employed; band assumed'),
  p('us.health.le-gap-income-top-bottom-men', 14.6, 'years', 'chetty-2016', 2014, 'US', [14.4, 14.8], 'verified', 'top 1 % vs bottom 1 % of income'),
  p('us.health.le-gap-income-top-bottom-women', 10.1, 'years', 'chetty-2016', 2014, 'US', [9.9, 10.3], 'verified', 'top 1 % vs bottom 1 % of income'),
  // --- Labour-market frictions --------------------------------------------------------------------
  p('us.labour.callback-ratio-white-black', 1.36, 'ratio', 'quillian-2017', 2015, 'US', [1.25, 1.47], 'verified', 'field experiments since 1989; band assumed'),
  p('us.labour.callback-ratio-white-latino', 1.24, 'ratio', 'quillian-2017', 2015, 'US', [1.14, 1.34], 'verified', 'band assumed'),
  p('world.labour.callback-ratio-high-discrimination', 2, 'ratio', 'quillian-2019', 2019, 'world', [1.7, 2], 'verified', '"nearly 2×" natives vs non-white applicants (France highest); band assumed below 2'),
  p('world.labour.callback-ratio-low-discrimination', 1.25, 'ratio', 'quillian-2019', 2019, 'world', [1.15, 1.35], 'verified', '"~1.25×" (e.g. GB, CA, DE, US); band assumed'),
  p('us.earnings.plainness-penalty', 0.075, 'share', 'hamermesh-biddle-1994', 1994, 'US', [0.05, 0.1], 'verified', 'wage penalty 5–10 %; midpoint; game uses ±5 % modifier sparingly')
];
