import * as migration_20261009_190810_initial from './20261009_190810_initial';
import * as migration_20261009_211414_content from './20261009_211414_content';
import * as migration_20261009_230154_review_fixes from './20261009_230154_review_fixes';

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
    name: '20261009_230154_review_fixes'
  },
];
