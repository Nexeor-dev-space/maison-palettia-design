import * as migration_20261009_190810_initial from './20261009_190810_initial';

export const migrations = [
  {
    up: migration_20261009_190810_initial.up,
    down: migration_20261009_190810_initial.down,
    name: '20261009_190810_initial'
  },
];
