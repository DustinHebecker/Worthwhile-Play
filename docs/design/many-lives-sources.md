# Many Lives — sources and research plan

Status: **Research plan (2026-10-18).** Nothing here is verified yet. Each entry lists a *candidate* source; before a value enters `packages/life-engine/src/params`, it must be checked against the primary source (title, year, table, region, value, uncertainty) and its license reviewed (`docs/third-party.md`). Only aggregated figures are used; no datasets are shipped.

Status values: `candidate` (from memory, unverified) · `checked` (primary source read, value and citation recorded) · `licensed` (terms reviewed).

## Parameter record

```ts
interface Param {
  id: string;                  // e.g. 'de.edu.uniEntry.byParentDegree'
  value: number | number[];    // in `unit`
  unit: string;
  sourceId: string;            // key into the source list below
  year: number;                // data year
  region: string;              // calibration country / 'world'
  uncertainty: [number, number]; // plausible band used in tests and sensitivity runs
  note?: string;               // simplification, transformation
}
```

## Candidate sources by area

| Area | Candidate sources | License (to check) | Status |
|---|---|---|---|
| Cross-country statistics | World Bank World Development Indicators; OECD data (Education at a Glance, Income Distribution DB, Wealth DB, Pensions at a Glance, Taxing Wages); ILO ILOSTAT; UN DESA World Population Prospects (life tables, fertility) | WDI CC BY 4.0; OECD CC BY 4.0 (since 2024); ILO and UN terms to check | candidate |
| Inequality and wealth | World Inequality Database; national household finance surveys (Bundesbank PHF, US SCF, Spain EFF); Credit Suisse/UBS Global Wealth Report (figures only) | WID CC BY; others to check | candidate |
| Social mobility | OECD *A Broken Social Elevator?* (2018); Chetty et al. (Opportunity Insights) for the USA; World Bank *Fair Progress?* (2018) for developing countries | to check | candidate |
| Education transitions | DZHW (Germany, university entry by parents' degree); PISA ESCS gradients; national statistics | to check | candidate |
| Earnings and occupations | OECD EAG earnings by education; Destatis Verdienststrukturerhebung; US BLS OES; ILO wage data; national labour force surveys | Destatis DL-DE-BY 2.0; BLS public domain | candidate |
| Unemployment and scarring | OECD Employment Outlook; Jacobson, LaLonde & Sullivan (1993); Davis & von Wachter (2011) | paper citation | candidate |
| Child penalty and gender | Kleven, Landais, Posch, Steinhauer & Zweimüller (2019, AEA P&P) — cross-country child penalties; OECD gender data | paper citation | candidate |
| Beauty premium | Hamermesh & Biddle (1994, AER) and later meta-analyses | paper citation | candidate |
| Personality and outcomes | Roberts et al. (2007); Big Five effect sizes on earnings and health | paper citation | candidate |
| Equity returns and risk | Dimson, Marsh & Staunton — Global Investment Returns Yearbook (summary figures); MSCI World index factsheets (summary figures only); Jordà, Knoll, Kuvshinov, Schularick & Taylor (2019, QJE) *The Rate of Return on Everything* | yearbook and MSCI: cite figures only; JST database terms to check | candidate |
| Single-stock skewness | Bessembinder (2018, JFE) *Do stocks outperform Treasury bills?*; Bessembinder et al. (2023) global | paper citation | candidate |
| Investor behaviour | Barber & Odean (2000) trading costs; Dalbar-type behaviour gap (use with care, methodology disputed); loss aversion (Kahneman & Tversky 1979; meta-analyses) | paper citation | candidate |
| Fees | fund TER surveys (ESMA annual statistical report on costs and performance) | ESMA terms to check | candidate |
| Inflation and rates | national CPI series (Destatis, BLS, INE, CAPMAS, RBI/MOSPI, NBS, Statistics Japan, Stats SA, INSTAT Mali); IMF World Economic Outlook | to check per office | candidate |
| Housing | BIS residential property price statistics; OECD house price indicators; transaction costs (national); maintenance rules of thumb (to be sourced) | BIS terms to check | candidate |
| Price dispersion in housing | hedonic-model residual studies (e.g. national appraisal literature) | paper citation | candidate |
| Taxes and benefits | OECD Taxing Wages; OECD tax-benefit models; national rules (simplified) | OECD CC BY | candidate |
| Pensions | OECD Pensions at a Glance | OECD CC BY | candidate |
| Mortality and SES gradient | national life tables; Lampert, Hoebel & Kroll (2019, RKI) for Germany; Chetty et al. (2016, JAMA) for the USA | to check | candidate |
| Health burden | WHO Global Health Observatory; IHME Global Burden of Disease | **WHO CC BY-NC-SA 3.0 IGO and IHME terms are non-commercial — check compatibility with the project license (PolyForm Perimeter) before use** | candidate |
| Mental health | WHO World Mental Health surveys; national prevalence data | to check | candidate |
| Wellbeing and money | Killingsworth (2021, PNAS); Killingsworth, Kahneman & Mellers (2023, PNAS); World Happiness Report; Clark et al. (2008) adaptation; unemployment and wellbeing meta-analyses | WHR terms to check | candidate |
| Age, work and energy | job satisfaction by age (Clark, Oswald & Warr 1996); burnout surveys by age; life satisfaction U-shape (Blanchflower & Oswald; critiques) | paper citation | candidate |
| Relationships | national divorce statistics; Harvard Study of Adult Development (Waldinger & Schulz 2023, figures only); loneliness and health meta-analyses (Holt-Lunstad 2010/2015) | paper citation | candidate |
| Parenthood and wellbeing | Glass, Simon & Andersson (2016, AJS) | paper citation | candidate |
| Child costs | Destatis (Germany), USDA (historical), national estimates | to check | candidate |
| Migration and visas | OECD International Migration Outlook; national visa statistics (processing times, refusal rates); credential recognition and de-skilling studies | to check | candidate |
| Remittances | World Bank Migration and Development Briefs | CC BY 4.0 | candidate |
| Discrimination in hiring | field-experiment meta-analyses (Quillian et al. 2019; Lancee 2021 cross-national GEMM) | paper citation | candidate |
| Informal economies | ILO *Women and Men in the Informal Economy*; World Bank Global Findex (account ownership, savings groups) | Findex CC BY 4.0 | candidate |

## Owner assumptions to test

| Assumption | Current impression (unverified) | Plan |
|---|---|---|
| Young people cope better with high workloads and are more motivated; older people are more disillusioned. | Mixed: recovery from sleep loss declines with age, but job satisfaction tends to rise with age and several surveys report more burnout among younger workers. | Literature review; model energy recovery and preferences by evidence. |
| Fixed income mostly returns slightly below inflation. | True for savings deposits in many recent periods (e.g. euro area 2010–2022); long-run government bonds returned positive real returns in many countries; profiles with high inflation had deeply negative real rates. | Calibrate per profile and regime. |
| A 10-stock market ETF has lower volatility than single stocks and performs like a world index. | Correct by construction in the model (section 5.6 of the design). | Calibration test. |
