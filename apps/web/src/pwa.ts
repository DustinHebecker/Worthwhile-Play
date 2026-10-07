import { h } from '@wp/ui';
import type { UiTranslator } from './app';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

let deferredInstall: BeforeInstallPromptEvent | undefined;
let updateSW: ((reload?: boolean) => Promise<void>) | undefined;
let needRefresh = false;
let offlineReady = false;
let registered = false;
let rerender: (() => void) | undefined;

/**
 * Service-worker registration (`registerType: 'prompt'`).
 * Update policy: a new version is applied automatically (page reload) whenever no game is
 * open, so visitors always see the latest release. While a game page is open, the update
 * waits and is offered via a footer button, so a running game is never interrupted; it is
 * applied automatically on the next navigation away from the game.
 */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const isGamePage = (path = location.pathname) => path.startsWith('/games/');

/** Called by the router after every navigation: apply a waiting update once the user leaves a game. */
export function applyPendingUpdateIfIdle(): void {
  if (needRefresh && updateSW && !isGamePage()) void updateSW(true);
}

export function setupPwa(slot: HTMLElement, t: UiTranslator): void {
  const render = () => {
    slot.replaceChildren();
    if (needRefresh && updateSW) {
      const button = h('button', { type: 'button', 'data-testid': 'pwa-update' }, t('pwa.update'));
      button.addEventListener('click', () => void updateSW?.(true));
      slot.append(h('span', {}, t('pwa.updateReady'), ' '), button);
    } else if (deferredInstall) {
      const button = h('button', { type: 'button' }, t('pwa.install'));
      button.addEventListener('click', async () => {
        const event = deferredInstall;
        deferredInstall = undefined;
        render();
        await event?.prompt();
      });
      slot.append(button);
    } else if (offlineReady) {
      slot.append(h('span', { class: 'wp-muted' }, t('pwa.offlineReady')));
    }
  };
  rerender = render;
  render();

  if (registered) return;
  registered = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstall = event as BeforeInstallPromptEvent;
    rerender?.();
  });
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  void import('virtual:pwa-register').then(({ registerSW }) => {
    updateSW = registerSW({
      onNeedRefresh: () => {
        needRefresh = true;
        if (!isGamePage()) void updateSW?.(true);
        else rerender?.();
      },
      onRegisteredSW: (_url, registration) => {
        // Long-lived tabs and installed apps also pick up new releases.
        if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS);
      },
      onOfflineReady: () => {
        offlineReady = true;
        rerender?.();
      }
    });
  });
}
