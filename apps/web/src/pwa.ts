import { h } from '@wp/ui';
import type { UiTranslator } from './app';
import { setUpdateHandler } from './lib/update';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

let deferredInstall: BeforeInstallPromptEvent | undefined;
let updateSW: ((reload?: boolean) => Promise<void>) | undefined;
let needRefresh = false;
let offlineReady = false;
let registered = false;
let rerender: (() => void) | undefined;
let registration: ServiceWorkerRegistration | undefined;
/** A game page holds a save from a newer release: apply the next update at once, game page or not. */
let updateWanted = false;

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

/**
 * A save was written by a newer release than this (cached) app: look for the update now and apply it as
 * soon as it is there, even on a game page (the save is kept until then). Without a service worker, or
 * with `reload`, the page is reloaded from the network instead.
 */
function requestUpdate(reload: boolean): void {
  updateWanted = true;
  if (needRefresh && updateSW) void updateSW(true);
  else if (registration)
    void registration
      .update()
      .catch(() => undefined)
      .then(() => {
        // Asked for explicitly and no update came: reload from the network.
        if (reload && !needRefresh) location.reload();
      });
  else if (reload) location.reload();
}

setUpdateHandler(requestUpdate);

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
        if (!isGamePage() || updateWanted) void updateSW?.(true);
        else rerender?.();
      },
      onRegisteredSW: (_url, reg) => {
        registration = reg;
        // Long-lived tabs and installed apps also pick up new releases.
        if (reg) setInterval(() => void reg.update(), UPDATE_CHECK_INTERVAL_MS);
        if (reg && updateWanted) void reg.update().catch(() => undefined);
      },
      onOfflineReady: () => {
        offlineReady = true;
        rerender?.();
      }
    });
  });
}
