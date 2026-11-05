/**
 * Asking for the app update from pages that must not load the service-worker code themselves (tests,
 * game pages). `pwa.ts` registers the real handler; without one, `reload` reloads from the network.
 */
let handler: ((reload: boolean) => void) | undefined;

export function setUpdateHandler(next: (reload: boolean) => void): void {
  handler = next;
}

/** A save was written by a newer release than this (cached) app: fetch the update and apply it when it is there. */
export function requestUpdate(reload = false): void {
  if (handler) handler(reload);
  else if (reload) location.reload();
}
