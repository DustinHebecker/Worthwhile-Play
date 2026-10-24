/**
 * Annual historical series used for block-bootstrap draws of economic years (design § 5.1–5.2):
 * the game replays real sequences of years (e.g. the 2022 inflation spike together with falling real
 * wages) instead of inventing a distribution. Values are fractions per year.
 */
import type { ParamStatus } from './types';

export interface Series {
  id: string;
  sourceId: string;
  /** ISO 3166 alpha-2. */
  region: string;
  firstYear: number;
  values: readonly number[];
  status: ParamStatus;
  note?: string;
}

export const SERIES: readonly Series[] = [
  {
    id: 'de.macro.cpi-annual', sourceId: 'wb-wdi-cpi', region: 'DE', firstYear: 2000, status: 'verified',
    note: 'World Bank FP.CPI.TOTL.ZG for DEU, read via the FRED mirror FPCPITOTLZGDEU on 2026-10-24; rounded to 0.01 pp',
    values: [0.0144, 0.0198, 0.0142, 0.0103, 0.0167, 0.0155, 0.0158, 0.0230, 0.0263, 0.0031, 0.0110, 0.0208, 0.0201, 0.0150, 0.0091,
      0.0051, 0.0049, 0.0151, 0.0173, 0.0145, 0.0014, 0.0307, 0.0687, 0.0595, 0.0226, 0.0217]
  },
  {
    id: 'in.macro.cpi-annual', sourceId: 'wb-wdi-cpi', region: 'IN', firstYear: 2000, status: 'verified',
    note: 'World Bank FP.CPI.TOTL.ZG for IND, read via the FRED mirror FPCPITOTLZGIND on 2026-10-24; rounded to 0.01 pp',
    values: [0.0401, 0.0378, 0.0430, 0.0381, 0.0377, 0.0425, 0.0580, 0.0637, 0.0835, 0.1088, 0.1199, 0.0891, 0.0948, 0.1002, 0.0667,
      0.0491, 0.0495, 0.0333, 0.0394, 0.0373, 0.0662, 0.0513, 0.0670, 0.0565, 0.0495, 0.0240]
  },
  {
    id: 'de.earnings.real-wage-annual', sourceId: 'destatis-real-wage-series', region: 'DE', firstYear: 2009, status: 'secondary',
    note: 'Destatis real wage index, annual change; 2025 verified at the source, earlier years via secondary reports (research notes, germany.md)',
    values: [-0.002, 0.015, 0.012, 0.005, -0.001, 0.017, 0.024, 0.018, 0.010, 0.014, 0.011, -0.012, 0.000, -0.040, 0.001, 0.031, 0.019]
  }
];

export function seriesById(id: string): Series {
  const s = SERIES.find((x) => x.id === id);
  if (s === undefined) throw new RangeError(`Unknown series: ${id}`);
  return s;
}

/** Value of a series in a calendar year (undefined outside its range). */
export function seriesValue(series: Series, year: number): number | undefined {
  const i = year - series.firstYear;
  return i >= 0 && i < series.values.length ? series.values[i] : undefined;
}
