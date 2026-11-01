/**
 * Shared Tower Defense core (docs/design/tower-defense.md § 15): the TD ruleset on the strategy
 * engine (towers with their branch tree, wave units) and the wave lanes (spawn, route following,
 * leaks, stop budget). Used by Tower Defense and the strategy/TD hybrid, which must not import each
 * other.
 */
export * from './ruleset';
export * from './lanes';
export * from './draw';
