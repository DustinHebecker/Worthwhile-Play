import type { SupportedLocale } from '@wp/localization';
import ar from './ar';
import de from './de';
import en, { type UiCatalogue } from './en';
import es from './es';
import fr from './fr';
import hi from './hi';
import it from './it';
import ja from './ja';
import ko from './ko';
import nl from './nl';
import pl from './pl';
import pt from './pt';
import ru from './ru';
import tr from './tr';
import uk from './uk';
import zhHans from './zh-Hans';

export type { UiKey, UiCatalogue } from './en';

/** UI chrome catalogues. Bundled eagerly: together they are small compared to one game. */
export const UI_MESSAGES: Readonly<Record<SupportedLocale, UiCatalogue>> = {
  de, en, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi
};
