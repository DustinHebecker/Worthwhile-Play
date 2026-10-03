// @ts-nocheck
import { h } from '@wp/ui';
import type { Page } from '../app';
import { ROADMAP_URL } from '../config';
import { GAMES } from '../registry';
import { gameBadges, gameTranslator } from './shared';

export const renderHome: Page = (main, app) => {
  const { t } = app;
  main.append(
    h('section', { class: 'hero' },
      h('h1', {}, t('app.tagline')),
      h('p', { class: 'lead' }, t('home.intro'))
    ),
    h('section', { class: 'catalogue', 'aria-labelledby': 'catalogue-title' },
      h('h2', { id: 'catalogue-title' }, t('home.catalogue')),
      h('ul', { class: 'game-grid', role: 'list' },
        ...GAMES.map(({ metadata }) => {
          const gt = gameTranslator(metadata, app.locale);
          return h('li', {},
            h('a', { class: 'game-card', href: `/games/${metadata.id}`, 'data-testid': `game-card-${metadata.id}` },
              h('span', { class: 'game-card-title' }, gt('title')),
              h('span', { class: 'game-card-tagline' }, gt('tagline')),
              gameBadges(metadata, t)
            )
          );
        })
      ),
      h('p', { class: 'wp-muted' }, h('a', { href: ROADMAP_URL, rel: 'noopener' }, t('home.roadmap')))
    ),
    h('section', { class: 'principles wp-card', 'aria-labelledby': 'principles-title' },
      h('h2', { id: 'principles-title' }, t('home.principles.title')),
      h('ul', {},
        h('li', {}, t('home.principles.stop')),
        h('li', {}, t('home.principles.noPressure')),
        h('li', {}, t('home.principles.noAds')),
        h('li', {}, t('home.principles.offline'))
      ),
      h('p', { class: 'wp-muted' }, t('home.honesty'))
    )
  );
};
