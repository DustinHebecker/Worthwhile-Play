// @ts-nocheck
import { h } from '@wp/ui';
import type { Page } from '../app';

export const renderNotFound: Page = (main, { t }) => {
  main.append(h('section', { class: 'prose' }, h('h1', {}, t('game.notFound')), h('p', {}, h('a', { href: '/' }, t('game.back')))));
};
