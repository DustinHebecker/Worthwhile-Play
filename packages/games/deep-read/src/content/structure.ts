import type { TextStructure } from './types';

/**
 * Language-independent structure of every text: ids, question types, option ids, gold answers and the
 * paragraph that supports each answer. Ordered easy → hard; questions are asked in this order.
 * Saves reference these ids: never rename or remove a text, question or option, and never change a gold
 * answer — only add new texts.
 */
export const TEXTS: readonly TextStructure[] = [
  {
    id: 'city-trees',
    difficulty: 'easy',
    paragraphs: 4,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c'], gold: 'a', support: 4 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'b', support: 2 },
      { id: 'q3', type: 'detail', options: ['a', 'b', 'c'], gold: 'c', support: 3 },
      { id: 'q4', type: 'structure', options: ['a', 'b', 'c'], gold: 'b' }
    ]
  },
  {
    id: 'bees',
    difficulty: 'easy',
    paragraphs: 4,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c'], gold: 'a', support: 1 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'b', support: 2 },
      { id: 'q3', type: 'detail', options: ['a', 'b', 'c'], gold: 'c', support: 3 },
      { id: 'q4', type: 'evidence', options: ['a', 'b', 'c'], gold: 'b', support: 4 }
    ]
  },
  {
    id: 'paperback',
    difficulty: 'easy',
    paragraphs: 4,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c'], gold: 'b', support: 4 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'c', support: 2 },
      { id: 'q3', type: 'detail', options: ['a', 'b', 'c'], gold: 'a', support: 3 },
      { id: 'q4', type: 'structure', options: ['a', 'b', 'c'], gold: 'c' }
    ]
  },
  {
    id: 'bridges',
    difficulty: 'easy',
    paragraphs: 4,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c'], gold: 'a', support: 2 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'c', support: 2 },
      { id: 'q3', type: 'detail', options: ['a', 'b', 'c'], gold: 'b', support: 3 },
      { id: 'q4', type: 'evidence', options: ['a', 'b', 'c'], gold: 'c', support: 3 }
    ]
  },
  {
    id: 'lighthouse',
    difficulty: 'medium',
    paragraphs: 5,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c', 'd'], gold: 'a', support: 3 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'c', support: 1 },
      { id: 'q3', type: 'detail', options: ['a', 'b', 'c'], gold: 'b', support: 3 },
      { id: 'q4', type: 'structure', options: ['a', 'b', 'c'], gold: 'c', support: 4 },
      { id: 'q5', type: 'evidence', options: ['a', 'b', 'c'], gold: 'b', support: 4 }
    ]
  },
  {
    id: 'time-zones',
    difficulty: 'medium',
    paragraphs: 5,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c'], gold: 'b', support: 2 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'a', support: 1 },
      { id: 'q3', type: 'detail', options: ['a', 'b', 'c'], gold: 'c', support: 3 },
      { id: 'q4', type: 'structure', options: ['a', 'b', 'c'], gold: 'a' },
      { id: 'q5', type: 'contradiction', options: ['a', 'b', 'c'], gold: 'c', support: 4 }
    ]
  },
  {
    id: 'longitude',
    difficulty: 'medium',
    paragraphs: 5,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c', 'd'], gold: 'b', support: 2 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'a', support: 2 },
      { id: 'q3', type: 'detail', options: ['a', 'b', 'c'], gold: 'c', support: 3 },
      { id: 'q4', type: 'structure', options: ['a', 'b', 'c'], gold: 'a', support: 2 },
      { id: 'q5', type: 'evidence', options: ['a', 'b', 'c'], gold: 'c', support: 4 }
    ]
  },
  {
    id: 'tree-rings',
    difficulty: 'medium',
    paragraphs: 5,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c', 'd'], gold: 'a', support: 3 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'b', support: 2 },
      { id: 'q3', type: 'detail', options: ['a', 'b', 'c'], gold: 'c', support: 3 },
      { id: 'q4', type: 'contradiction', options: ['a', 'b', 'c'], gold: 'b', support: 4 },
      { id: 'q5', type: 'evidence', options: ['a', 'b', 'c'], gold: 'c', support: 4 }
    ]
  },
  {
    id: 'repair',
    difficulty: 'hard',
    paragraphs: 6,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c', 'd'], gold: 'c', support: 1 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'a', support: 1 },
      { id: 'q3', type: 'structure', options: ['a', 'b', 'c'], gold: 'b' },
      { id: 'q4', type: 'contradiction', options: ['a', 'b', 'c'], gold: 'c', support: 6 },
      { id: 'q5', type: 'evidence', options: ['a', 'b', 'c'], gold: 'b', support: 5 },
      { id: 'q6', type: 'detail', options: ['a', 'b', 'c'], gold: 'a', support: 6 }
    ]
  },
  {
    id: 'library',
    difficulty: 'hard',
    paragraphs: 5,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c', 'd'], gold: 'd', support: 5 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c', 'd'], gold: 'b', support: 3 },
      { id: 'q3', type: 'contradiction', options: ['a', 'b', 'c'], gold: 'a', support: 2 },
      { id: 'q4', type: 'evidence', options: ['a', 'b', 'c'], gold: 'c', support: 4 },
      { id: 'q5', type: 'evidence', options: ['a', 'b', 'c'], gold: 'a', support: 3 },
      { id: 'q6', type: 'structure', options: ['a', 'b', 'c'], gold: 'b' }
    ]
  },
  {
    id: 'car-free',
    difficulty: 'hard',
    paragraphs: 6,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c', 'd'], gold: 'b', support: 6 },
      { id: 'q2', type: 'detail', options: ['a', 'b', 'c'], gold: 'b', support: 4 },
      { id: 'q3', type: 'contradiction', options: ['a', 'b', 'c'], gold: 'c', support: 5 },
      { id: 'q4', type: 'evidence', options: ['a', 'b', 'c'], gold: 'b', support: 2 },
      { id: 'q5', type: 'evidence', options: ['a', 'b', 'c'], gold: 'a', support: 3 },
      { id: 'q6', type: 'structure', options: ['a', 'b', 'c'], gold: 'c' }
    ]
  },
  {
    id: 'hiring',
    difficulty: 'hard',
    paragraphs: 5,
    questions: [
      { id: 'q1', type: 'main', options: ['a', 'b', 'c', 'd'], gold: 'c', support: 5 },
      { id: 'q2', type: 'contradiction', options: ['a', 'b', 'c'], gold: 'b', support: 5 },
      { id: 'q3', type: 'evidence', options: ['a', 'b', 'c'], gold: 'a', support: 3 },
      { id: 'q4', type: 'evidence', options: ['a', 'b', 'c'], gold: 'c', support: 4 },
      { id: 'q5', type: 'detail', options: ['a', 'b', 'c'], gold: 'b', support: 5 },
      { id: 'q6', type: 'structure', options: ['a', 'b', 'c'], gold: 'a' }
    ]
  }
];
