export type Route =
  | { name: 'home' }
  | { name: 'game'; id: string; seed?: number; difficulty?: string; fresh?: boolean }
  | { name: 'decks' }
  | { name: 'deck'; id: string }
  | { name: 'deck-import' }
  | { name: 'about' }
  | { name: 'settings' }
  | { name: 'legal' }
  | { name: 'not-found' };

const SEED = /^\d{1,10}$/;
const SLUG = '([a-z0-9]+(?:-[a-z0-9]+)*)';

/** Pure URL → route mapping. `?seed=…&difficulty=…` make a game reproducible (bug reports, sharing). */
export function parseRoute(pathname: string, search = ''): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/index.html') return { name: 'home' };
  if (path === '/about') return { name: 'about' };
  if (path === '/settings') return { name: 'settings' };
  if (path === '/legal' || path === '/impressum') return { name: 'legal' };
  if (path === '/decks') return { name: 'decks' };
  if (path === '/decks/import') return { name: 'deck-import' };
  const deck = new RegExp(`^/decks/${SLUG}$`).exec(path);
  if (deck && deck[1] && deck[1].length <= 64) return { name: 'deck', id: deck[1] };
  const match = new RegExp(`^/games/${SLUG}$`).exec(path);
  if (match) {
    const params = new URLSearchParams(search);
    const route: Route = { name: 'game', id: match[1] as string };
    const seed = params.get('seed');
    if (seed && SEED.test(seed) && Number(seed) <= 0xffffffff) route.seed = Number(seed);
    const difficulty = params.get('difficulty');
    if (difficulty && /^[a-z0-9-]{1,32}$/.test(difficulty)) route.difficulty = difficulty;
    // `?new=1`: start a fresh game right away (e.g. "Play" on a deck page); the host then drops the parameter
    // so that a reload resumes this game instead of dealing again.
    if (params.get('new') === '1' && route.seed === undefined) route.fresh = true;
    return route;
  }
  return { name: 'not-found' };
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'game':
      return `/games/${route.id}`;
    case 'about':
      return '/about';
    case 'settings':
      return '/settings';
    case 'legal':
      return '/legal';
    case 'decks':
      return '/decks';
    case 'deck':
      return `/decks/${route.id}`;
    case 'deck-import':
      return '/decks/import';
    default:
      return '/';
  }
}

/** Intercepts same-origin link clicks for client-side navigation (History API). */
export function startRouter(onRoute: (route: Route) => void): (path: string) => void {
  const navigate = (path: string) => {
    if (path !== location.pathname + location.search) history.pushState(null, '', path);
    onRoute(parseRoute(location.pathname, location.search));
    window.scrollTo(0, 0);
  };
  document.addEventListener('click', (event) => {
    const anchor = (event.target as Element | null)?.closest?.('a');
    if (!anchor || anchor.target || anchor.hasAttribute('download') || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    navigate(url.pathname + url.search);
  });
  window.addEventListener('popstate', () => onRoute(parseRoute(location.pathname, location.search)));
  onRoute(parseRoute(location.pathname, location.search));
  return navigate;
}
