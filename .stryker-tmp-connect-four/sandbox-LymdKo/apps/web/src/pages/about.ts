// @ts-nocheck
import { h } from '@wp/ui';
import type { Page } from '../app';
import { APP_VERSION, REPOSITORY_URL } from '../config';

export const renderAbout: Page = (main, { t }) => {
  main.append(
    h('section', { class: 'prose' },
      h('h1', {}, t('about.title')),
      h('p', {}, t('about.purpose')),
      h('p', {}, t('about.privacy')),
      h('p', {}, t('about.ai')),
      h('p', {}, t('about.source'), ' ', h('a', { href: REPOSITORY_URL, rel: 'noopener' }, t('about.sourceLink'))),
      h('p', {}, t('about.license')),
      h('p', { class: 'wp-muted' }, `v${APP_VERSION}`)
    )
  );
};
