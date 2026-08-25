import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gameModes } from '@/lib/gameConfig';
import { GAME_COMPONENTS } from '@/lib/gameRegistry';

describe('game config / registry consistency', () => {
  it('every game mode has a registered component', () => {
    const ids = gameModes.map(m => m.id);
    for (const id of ids) {
      expect(GAME_COMPONENTS[id], `missing component for "${id}"`).toBeDefined();
    }
  });

  it('every registered component has a game mode entry', () => {
    const modeIds = new Set(gameModes.map(m => m.id));
    for (const id of Object.keys(GAME_COMPONENTS)) {
      expect(modeIds.has(id), `unregistered mode "${id}"`).toBe(true);
    }
  });

  it('game ids are unique', () => {
    const ids = gameModes.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes at least the 35 advertised modes', () => {
    expect(gameModes.length).toBeGreaterThanOrEqual(35);
  });

  it('every mode is in the arena DB rotation pool', () => {
    const sql = readFileSync('/workspace/supabase/migrations/20260816010000_more_games.sql', 'utf8');
    const block = sql.match(/from \(values([\s\S]*?)\)\s*as game\(id\)/)?.[1];
    expect(block, 'migration pool block not found').toBeTruthy();
    const pool = new Set(block!.match(/'([a-z0-9]+)'/g)!.map(m => m.slice(1, -1)));
    for (const mode of gameModes) {
      expect(pool.has(mode.id), `"${mode.id}" missing from arena DB pool`).toBe(true);
    }
  });
});
