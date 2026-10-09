import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidReviewState, type ReviewState } from './rules';
import { createReview } from './view';

export type { ReviewState } from './rules';

export default defineGame<ReviewState>({
  metadata,
  create: (context) => createReview(context),
  isValidState: (value: unknown): value is ReviewState => isValidReviewState(value)
});
