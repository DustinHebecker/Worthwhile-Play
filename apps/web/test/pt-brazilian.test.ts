import { describe, expect, it } from 'vitest';
import { AI_TERMS, CAPITALS, FIRST_WORDS } from '@wp/learning-content';
import { COMMON_MESSAGES, LOCALE_DEFINITIONS } from '@wp/localization';
import { LOCALE_LOADERS } from '../src/i18n';
import { GAMES } from '../src/registry';

/**
 * The locale `pt` is Brazilian Portuguese (pt-BR) everywhere: shell, game messages, per-locale game content and
 * built-in decks. These words exist only in European Portuguese (the Brazilian word in the comment), so none of
 * them may appear in a Portuguese string. Whole words only, case-insensitive.
 */
const EUROPEAN_ONLY = [
  'ecrã', 'ecrãs', // tela
  'ficheiro', 'ficheiros', // arquivo
  'utilizador', 'utilizadora', 'utilizadores', 'utilizadoras', // usuário
  'telemóvel', 'telemóveis', // celular
  'equipa', 'equipas', // equipe
  'registo', 'registos', // registro
  'autocarro', 'autocarros', // ônibus
  'comboio', 'comboios', // trem
  'pequeno-almoço', // café da manhã
  'casa de banho', // banheiro
  'frigorífico', // geladeira
  'connosco', // conosco
  'contacto', 'contactos', // contato
  'receção', // recepção
  'planear', 'planeamento', // planejar, planejamento
  'cronómetro', // cronômetro
  'prémio', 'prémios' // prêmio
] as const;

/** Games excluded from this guard (none: relay-command joined after its pt-BR pass, PR #24). */
const EXCLUDED_GAMES = new Set<string>();

const PATTERN = new RegExp(`(?<![\\p{L}\\p{M}-])(?:${EUROPEAN_ONLY.join('|')})(?![\\p{L}\\p{M}-])`, 'iu');

type Found = readonly [where: string, text: string];

function collect(value: unknown, where: string, out: Found[]): Found[] {
  if (typeof value === 'string') out.push([where, value]);
  else if (Array.isArray(value)) value.forEach((item, i) => collect(item, `${where}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) collect(item, `${where}.${key}`, out);
  return out;
}

/** Per-locale game content and split-out message files (ADR 0011), read straight from the sources. */
const CONTENT_MODULES = import.meta.glob<Record<string, unknown>>('../../../packages/games/*/src/{content,messages}/pt.ts', { eager: true });

async function portugueseStrings(): Promise<Found[]> {
  const out: Found[] = [];
  const shell = await LOCALE_LOADERS.pt();
  collect(shell.ui, 'ui', out);
  collect(shell.learning, 'learning', out);
  collect(COMMON_MESSAGES.pt, 'common', out);
  for (const entry of GAMES) {
    if (EXCLUDED_GAMES.has(entry.metadata.id)) continue;
    const { metadata } = await entry.load();
    collect(metadata.messages.pt, `games.${metadata.id}`, out);
  }
  for (const [path, module] of Object.entries(CONTENT_MODULES)) {
    const id = /packages\/games\/([^/]+)\//.exec(path)?.[1] ?? path;
    if (!EXCLUDED_GAMES.has(id)) collect(module, path.replace(/^(\.\.\/)+/, ''), out);
  }
  for (const word of FIRST_WORDS) collect(word.words.pt, `first-words.${word.id}`, out);
  for (const capital of CAPITALS) collect(capital.names.pt, `capitals.${capital.code}`, out);
  for (const term of AI_TERMS) collect([term.terms.pt, term.definitions.pt], `ai-basics.${term.id}`, out);
  return out;
}

describe('Portuguese is Brazilian Portuguese (pt-BR)', () => {
  it('detects European-only words as whole words, in any case', () => {
    expect(PATTERN.test('Guarde o ficheiro no ecrã.')).toBe(true);
    expect(PATTERN.test('A Equipa decide.')).toBe(true);
    expect(PATTERN.test('Tomamos o pequeno-almoço.')).toBe(true);
    expect(PATTERN.test('Salve o arquivo na tela; a equipe decide.')).toBe(false);
    expect(PATTERN.test('equipamento, registros, comboiozinho')).toBe(false);
  });

  it('labels the locale as Brazilian Portuguese in the language picker (the code stays `pt`)', () => {
    expect(LOCALE_DEFINITIONS.find((d) => d.code === 'pt')?.nativeName).toBe('Português (Brasil)');
  });

  it('uses no European-only words in any Portuguese string', async () => {
    const strings = await portugueseStrings();
    // The corpus really covers the shell, every game and the per-locale content chunks.
    expect(strings.length).toBeGreaterThan(4000);
    expect(Object.keys(CONTENT_MODULES).some((path) => path.includes('/deep-read/'))).toBe(true);
    const offenders = strings.filter(([, text]) => PATTERN.test(text)).map(([where, text]) => `${where}: ${text}`);
    expect(offenders).toEqual([]);
  });
});
