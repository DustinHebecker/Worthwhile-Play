import { describe, expect, it } from 'vitest';
import { deckGuidePath } from '@wp/learning-content';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { buildAiGuides } from '../ai-guide-plugin';

describe('guides for AIs (build step)', () => {
  it('publishes one Markdown guide per UI locale at the path the import page links to', async () => {
    const files = await buildAiGuides();
    expect(Object.keys(files).sort()).toEqual(SUPPORTED_LOCALES.map((locale) => deckGuidePath(locale).slice(1)).sort());
    expect(files['ai/deck-guide.ja.md']).toContain('# AI 向けガイド');
    expect(files['ai/deck-guide.en.md']).toContain('https://worthwhile-play.pages.dev/decks/import#deck=<DATA>');
  });

  it('can name another origin (preview deployments)', async () => {
    const files = await buildAiGuides('https://preview.example');
    expect(files['ai/deck-guide.de.md']).toContain('https://preview.example/decks/import#deck=');
    expect(files['ai/deck-guide.de.md']).not.toContain('worthwhile-play.pages.dev');
  });
});
