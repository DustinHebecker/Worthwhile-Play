import { SKILLS, type Skill } from '@wp/game-core';
import { h } from '@wp/ui';
import type { Page } from '../app';
import { ROADMAP_URL } from '../config';
import { GAMES } from '../registry';
import { gameBadges, gameTranslator } from './shared';

export const renderHome: Page = (main, app) => {
  const { t } = app;

  // Skills present in the catalogue, in canonical order. The selection lives in the URL (?skill=…).
  const skills = SKILLS.filter((skill) => GAMES.some((g) => g.metadata.skills.includes(skill)));
  const requested = new URLSearchParams(location.search).get('skill');
  let active: Skill | undefined = skills.find((s) => s === requested);

  const cards = GAMES.map(({ metadata }) => {
    const gt = gameTranslator(metadata, app.locale);
    const saved = h('span', { class: 'badge saved', hidden: true, 'data-testid': `saved-${metadata.id}` }, `● ${t('home.inProgress')}`);
    const item = h('li', { 'data-skills': metadata.skills.join(' ') },
      h('a', { class: 'game-card', href: `/games/${metadata.id}`, 'data-testid': `game-card-${metadata.id}` },
        h('span', { class: 'game-card-title' }, gt('title'), ' ', saved),
        h('span', { class: 'game-card-tagline' }, gt('tagline')),
        gameBadges(metadata, t)
      )
    );
    return { metadata, item, saved };
  });

  const chip = (skill: Skill | undefined) => {
    const button = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(skill === active), 'data-testid': `filter-${skill ?? 'all'}` },
      skill ? t(`skill.${skill}` as never) : t('home.filterAll'));
    button.addEventListener('click', () => {
      active = skill;
      const url = skill ? `/?skill=${skill}` : '/';
      history.replaceState(null, '', url);
      apply();
    });
    return button;
  };
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': t('home.filter') }, chip(undefined), ...skills.map(chip));

  const apply = () => {
    for (const { metadata, item } of cards) item.hidden = Boolean(active && !metadata.skills.includes(active));
    for (const button of chips.querySelectorAll('button')) {
      const id = button.getAttribute('data-testid')?.replace('filter-', '');
      button.setAttribute('aria-pressed', String((id === 'all' && !active) || id === active));
    }
  };
  apply();

  // Mark games with a saved game, so resuming is one tap away.
  void app.store.then((store) => store.keys()).then((keys) => {
    for (const { metadata, saved } of cards) saved.hidden = !keys.includes(metadata.id);
  }).catch(() => undefined);

  const catalogue = h('section', { class: 'catalogue', 'aria-labelledby': 'catalogue-title' },
    h('h2', { id: 'catalogue-title' }, t('home.catalogue')),
    chips,
    h('ul', { class: 'game-grid', role: 'list' }, ...cards.map((c) => c.item)),
    h('p', { class: 'wp-muted' }, h('a', { href: ROADMAP_URL, rel: 'noopener' }, t('home.roadmap')))
  );

  main.append(
    h('section', { class: 'hero' },
      h('h1', {}, t('app.tagline')),
      h('p', { class: 'lead' }, t('home.intro'))
    ),
    catalogue,
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
