/**
 * Slow data re-verification (design § 21.3, ADR 0021): the computed facts against public-domain oracles transcribed
 * from the CIA World Factbook (US government work; not shipped), and the standard time offsets against Node's tz data.
 */
import { describe, expect, it } from 'vitest';
import { decodeAtlas } from '../src/atlas';
import { ATLAS_DATA } from '../src/data/atlas.gen';
import config from '../scripts/atlas-config.json';

const atlas = decodeAtlas(ATLAS_DATA);

/** UN members without a sea coast (Factbook "landlocked"; the Caspian and Aral Seas are lakes). */
const LANDLOCKED = 'AD AF AM AT AZ BF BI BO BT BW BY CF CH CZ ET HU KG KZ LA LI LS LU MD MK ML MN MW NE NP PY RS RW SK SM SS SZ TD TJ TM UG UZ ZM ZW'.split(' ');

/**
 * Land boundaries of 45 countries (Factbook "border countries", UN members only), and the documented deviations of
 * this map: the neutrality rule (§ 12.3: a border lying entirely along a hatched area does not count) and the
 * exclaves under 100 km² that the map does not draw (Ceuta and Melilla).
 */
const BORDERS: Record<string, string> = {
  AR: 'BO BR CL PY UY',
  AT: 'CH CZ DE HU IT LI SI SK',
  BE: 'DE FR LU NL',
  BO: 'AR BR CL PE PY',
  BR: 'AR BO CO FR GY PE PY SR UY VE',
  CA: 'US',
  CH: 'AT DE FR IT LI',
  CL: 'AR BO PE',
  CN: 'AF BT IN KG KP KZ LA MM MN NP PK RU TJ VN',
  CO: 'BR EC PA PE VE',
  CZ: 'AT DE PL SK',
  DE: 'AT BE CH CZ DK FR LU NL PL',
  DZ: 'LY MA ML MR NE TN',
  EG: 'IL LY SD',
  ES: 'AD FR MA PT',
  ET: 'DJ ER KE SD SO SS',
  FI: 'NO RU SE',
  FR: 'AD BE BR CH DE ES IT LU MC SR',
  GR: 'AL BG MK TR',
  GY: 'BR SR VE',
  HU: 'AT HR RO RS SI SK UA',
  IL: 'EG JO LB SY',
  IN: 'BD BT CN MM NP PK',
  IQ: 'IR JO KW SA SY TR',
  IR: 'AF AM AZ IQ PK TM TR',
  KE: 'ET SO SS TZ UG',
  KZ: 'CN KG RU TM UZ',
  MA: 'DZ ES',
  MX: 'BZ GT US',
  NG: 'BJ CM NE TD',
  PE: 'BO BR CL CO EC',
  PK: 'AF CN IN IR',
  PL: 'BY CZ DE LT RU SK UA',
  RU: 'AZ BY CN EE FI GE KP KZ LT LV MN NO PL UA',
  SA: 'AE IQ JO KW OM QA YE',
  TH: 'KH LA MM MY',
  TR: 'AM AZ BG GE GR IQ IR SY',
  TZ: 'BI CD KE MW MZ RW UG ZM',
  UA: 'BY HU MD PL RO RU SK',
  US: 'CA MX',
  VE: 'BR CO GY',
  VN: 'CN KH LA',
  ZA: 'BW LS MZ NA SZ ZW',
  CD: 'AO BI CF CG RW SS TZ UG ZM',
  AF: 'CN IR PK TJ TM UZ'
};
/** Pairs that are not neighbours on this map, with the reason. */
const DEVIATIONS: Record<string, string> = {
  'CN-PK': 'the whole border lies along hatched Kashmir areas (§ 12.3)',
  'GY-VE': 'the whole border lies along the hatched Essequibo area (§ 12.3)',
  'IL-SY': 'the whole border lies along the hatched Golan Heights (§ 12.3)',
  'ES-MA': 'Ceuta and Melilla are parts under 100 km², not drawn (§ 11.2)'
};
const key = (a: string, b: string) => [a, b].sort().join('-');

/** Total areas (km², Factbook) of 30 countries; `areaCore` must be within 8 % (inland water explains small gaps). */
const AREAS: Record<string, number> = {
  FR: 643801, DE: 357022, PL: 312685, ES: 505370, IT: 301340, SE: 450295, FI: 338145, GB: 243610, IE: 70273, PT: 92090,
  GR: 131957, RO: 238391, EG: 1001450, NG: 923768, DZ: 2381741, BR: 8515770, AR: 2780400, MX: 1964375, AU: 7741220, US: 9833517,
  JP: 377915, KE: 580367, PE: 1285216, CL: 756102, IR: 1648195, MN: 1564116, TH: 513120, TR: 783562, CO: 1138910, ZA: 1219090
};

describe('facts against oracles (slow)', () => {
  it('knows exactly the landlocked UN members', () => {
    expect(atlas.countries.filter((c) => !c.coast).map((c) => c.id)).toEqual(LANDLOCKED);
  });

  it('has the Factbook land borders of 45 countries, minus the documented deviations', () => {
    for (const [id, list] of Object.entries(BORDERS)) {
      const expected = list.split(' ').filter((n) => !DEVIATIONS[key(id, n)]);
      expect(atlas.country(id)!.nb, id).toEqual(expected.sort());
    }
  });

  it('has areas within 8 % of the Factbook totals', () => {
    for (const [id, km2] of Object.entries(AREAS)) {
      const c = atlas.country(id)!;
      expect(Math.abs(c.areaCore / km2 - 1), `${id}: ${c.areaCore} vs ${km2}`).toBeLessThan(0.08);
    }
  });

  it('stores standard offsets equal to Node’s tz data (min of January and July)', () => {
    const offset = (tz: string, iso: string) => {
      const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')!.value;
      const m = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(part)!;
      return m[1] ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
    };
    for (const c of config.cities) {
      const tz = Math.min(offset(c.tz, '2026-01-15T12:00:00Z'), offset(c.tz, '2026-07-15T12:00:00Z'));
      expect(atlas.city(c.id)!.tz, `${c.id}: tzdata changed: re-run scripts/build-atlas`).toBe(tz);
    }
  });
});
