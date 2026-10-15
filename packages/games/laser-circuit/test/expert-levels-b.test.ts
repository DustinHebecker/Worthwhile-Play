import { LEVELS } from '../src/levels';
import { expertLevelTests } from './expert-check';

// Expert levels 5 to the last (the first half: expert-levels-a.test.ts).
expertLevelTests(4, LEVELS.expert.length, false);
