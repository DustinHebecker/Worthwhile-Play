import { h } from '@wp/ui';
import type { Page } from '../app';
import { hasLegalDetails, LEGAL, REPOSITORY_URL } from '../config';

export const renderLegal: Page = (main, { t }) => {
  const provider = hasLegalDetails()
    ? h('address', { 'data-testid': 'legal-provider' },
        ...[LEGAL.name, ...LEGAL.address].flatMap((line, i) => (i === 0 ? [line] : [h('br'), line])),
        LEGAL.email ? h('span', {}, h('br'), `${t('legal.contact')}: `, h('a', { href: `mailto:${LEGAL.email}` }, LEGAL.email)) : null
      )
    : h('p', { class: 'notice', 'data-testid': 'legal-missing' }, t('legal.missing'));
  main.append(
    h('section', { class: 'prose' },
      h('h1', {}, t('legal.title')),
      h('p', {}, t('legal.intro')),
      h('h2', {}, t('legal.provider')),
      provider,
      h('p', {}, t('legal.liability')),
      h('p', {}, t('legal.aiDisclosure')),
      h('h2', {}, t('legal.feedback')),
      h('p', {}, t('legal.feedbackCopy'), ' ', h('a', { href: `${REPOSITORY_URL}/issues`, rel: 'noopener' }, t('legal.feedbackLink')))
    )
  );
};
