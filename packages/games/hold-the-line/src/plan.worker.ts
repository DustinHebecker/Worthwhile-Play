/// <reference lib="webworker" />
import { planRound } from './ai';
import type { HoldState } from './rules';

/**
 * The computer's planning off the page's main thread (design § 16.3, review of PR #104: planning
 * must never stop the page from closing or pausing). It gets what the computer may see (`seenBy`)
 * and answers with its plan; the plan is the same as in the page (pure, deterministic).
 */
self.onmessage = (event: MessageEvent<{ token: number; seen: HoldState }>) => {
  const { token, seen } = event.data;
  self.postMessage({ token, plan: planRound(seen) });
};
