import * as migration_20261009_190810_initial from './20261009_190810_initial';
import * as migration_20261009_211414_content from './20261009_211414_content';
import * as migration_20261009_230154_review_fixes from './20261009_230154_review_fixes';
import * as migration_20261009_235606_commerce from './20261009_235606_commerce';
import * as migration_20261010_013411_phase3_review_fixes from './20261010_013411_phase3_review_fixes';

export const migrations = [
  {
    up: migration_20261009_190810_initial.up,
    down: migration_20261009_190810_initial.down,
    name: '20261009_190810_initial',
  },
  {
    up: migration_20261009_211414_content.up,
    down: migration_20261009_211414_content.down,
    name: '20261009_211414_content',
  },
  {
    up: migration_20261009_230154_review_fixes.up,
    down: migration_20261009_230154_review_fixes.down,
    name: '20261009_230154_review_fixes',
  },
  {
    up: migration_20261009_235606_commerce.up,
    down: migration_20261009_235606_commerce.down,
    name: '20261009_235606_commerce',
  },
  {
    up: migration_20261010_013411_phase3_review_fixes.up,
    down: migration_20261010_013411_phase3_review_fixes.down,
    name: '20261010_013411_phase3_review_fixes'
  },
];
