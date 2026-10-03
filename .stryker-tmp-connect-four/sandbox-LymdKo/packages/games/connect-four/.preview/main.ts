// @ts-nocheck
import '@wp/ui/styles.css';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';
import game from '../src/index';
const params = new URLSearchParams(location.search);
const locale = (params.get('locale') ?? 'en') as SupportedLocale;
const t = createTranslator({ locale, sources: [game.metadata.messages, COMMON_MESSAGES] });
document.documentElement.dir = t.direction;
const root = document.getElementById('root')!;
const instance = game.create({ root, t, reducedMotion: true, requestSave() {}, finished() {} });
instance.newGame({ seed: 1, difficulty: 'easy' });
const moves = params.get('moves');
if (moves) instance.restore({ ...instance.serialize(), opponent: 'human', moves: moves.split(',').map(Number) } as never);
(window as unknown as { inst: unknown }).inst = instance;
