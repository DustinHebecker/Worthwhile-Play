import type { Param } from './types';
import { WORLD_PARAMS } from './world';
import { DE_PARAMS } from './de';
import { IN_PARAMS } from './in';

export { SOURCES } from './sources';
export * from './series';
export * from './lifetables';
export { WORLD_PARAMS } from './world';
export { DE_PARAMS } from './de';
export { IN_PARAMS } from './in';

/** Every calibration parameter (world-level effect sizes plus the region profiles). */
export const ALL_PARAMS: readonly Param[] = [...WORLD_PARAMS, ...DE_PARAMS, ...IN_PARAMS];
