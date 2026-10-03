// @ts-nocheck
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
 * Service-worker registration with an explicit update prompt (`registerType: 'prompt'`):
 * an update never reloads the page on its own, so a running game is never interrupted.
 */
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
        rerender?.();
      },
      onOfflineReady: () => {
        offlineReady = true;
        rerender?.();
      }
    });
  });
}
