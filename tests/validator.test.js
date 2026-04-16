const { describe, test, expect } = require('bun:test');
const { validate } = require('../src/validator');

// Builds a minimal valid radar. Pass entry field overrides to test specific rules.
function buildRadar(entryOverrides = {}, configOverrides = {}) {
  return {
    meta: { title: 'Test', version: 1, date: '2026-01-01' },
    config: {
      'link-types': { url: { label: 'Website' } },
      teams: { 'team-a': { label: 'Team A' } },
      verticals: { 'vert-a': { label: 'Vert A' } },
      ...configOverrides,
    },
    disciplines: {
      eng: {
        meta: { label: 'Engineering' },
        quadrants: {
          tools: {
            meta: { label: 'Tools' },
            entries: {
              tool: { label: 'Tool', ring: 'adopt', ...entryOverrides },
            },
          },
        },
      },
    },
  };
}

describe('validate - valid radar', () => {
  test('returns empty array for a minimal valid radar', () => {
    expect(validate(buildRadar())).toEqual([]);
  });

  test('returns empty array with all optional fields present', () => {
    const errors = validate(buildRadar({
      ring: 'hold',
      hold_reason: 'Deprecated.',
      teams: ['team-a'],
      verticals: ['vert-a'],
      links: [{ type: 'url', uri: 'https://example.com' }],
      timeline: { assess: '2025-Q1', hold: '2026-Q1' },
      'ring-overrides': {
        teams: { 'team-a': { ring: 'trial', reason: 'Still evaluating.' } },
        verticals: { 'vert-a': { ring: 'assess', reason: 'Not ready.' } },
      },
    }));
    expect(errors).toEqual([]);
  });
});

describe('validate - ring', () => {
  test('errors on invalid ring value', () => {
    const errors = validate(buildRadar({ ring: 'unknown' }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('"unknown"'),
    }));
  });

  test('accepts all four valid rings', () => {
    for (const ring of ['adopt', 'trial', 'assess', 'hold']) {
      const overrides = ring === 'hold' ? { ring, hold_reason: 'Reason.' } : { ring };
      expect(validate(buildRadar(overrides))).toEqual([]);
    }
  });
});

describe('validate - teams', () => {
  test('errors on unknown team reference', () => {
    const errors = validate(buildRadar({ teams: ['ghost-team'] }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('"ghost-team"'),
    }));
  });

  test('passes with a known team', () => {
    expect(validate(buildRadar({ teams: ['team-a'] }))).toEqual([]);
  });
});

describe('validate - verticals', () => {
  test('errors on unknown vertical when config defines verticals', () => {
    const errors = validate(buildRadar({ verticals: ['ghost-vert'] }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('"ghost-vert"'),
    }));
  });

  test('skips vertical validation when config has no verticals defined', () => {
    const radar = buildRadar({ verticals: ['anything'] }, { verticals: {} });
    expect(validate(radar)).toEqual([]);
  });
});

describe('validate - links', () => {
  test('errors on unknown link type', () => {
    const errors = validate(buildRadar({ links: [{ type: 'unknown-type', uri: 'x' }] }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('"unknown-type"'),
    }));
  });

  test('passes with a known link type', () => {
    expect(validate(buildRadar({ links: [{ type: 'url', uri: 'https://x.com' }] }))).toEqual([]);
  });
});

describe('validate - hold entries', () => {
  test('errors when hold entry is missing hold_reason', () => {
    const errors = validate(buildRadar({ ring: 'hold' }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: 'Hold entry missing hold_reason',
    }));
  });

  test('passes when hold entry has hold_reason', () => {
    expect(validate(buildRadar({ ring: 'hold', hold_reason: 'Deprecated.' }))).toEqual([]);
  });
});

describe('validate - timeline', () => {
  test('errors on invalid ring in timeline', () => {
    const errors = validate(buildRadar({ timeline: { 'bad-ring': '2026-Q1' } }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      path: expect.stringContaining('timeline'),
      message: expect.stringContaining('"bad-ring"'),
    }));
  });

  test('passes with valid timeline rings', () => {
    expect(validate(buildRadar({
      timeline: { assess: '2025-Q1', trial: '2025-Q3', adopt: '2026-Q1' },
    }))).toEqual([]);
  });
});

describe('validate - ring overrides (teams)', () => {
  test('errors on override referencing unknown team', () => {
    const errors = validate(buildRadar({
      'ring-overrides': { teams: { 'ghost-team': { ring: 'trial', reason: 'r' } } },
    }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('"ghost-team"'),
    }));
  });

  test('errors on override with invalid ring', () => {
    const errors = validate(buildRadar({
      teams: ['team-a'],
      'ring-overrides': { teams: { 'team-a': { ring: 'bad', reason: 'r' } } },
    }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('"bad"'),
    }));
  });

  test('warns when override is missing reason', () => {
    const errors = validate(buildRadar({
      teams: ['team-a'],
      'ring-overrides': { teams: { 'team-a': { ring: 'trial' } } },
    }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'warning',
      message: 'Ring override missing reason',
    }));
    expect(errors.every(e => e.severity === 'warning')).toBe(true);
  });
});

describe('validate - ring overrides (verticals)', () => {
  test('errors on override referencing unknown vertical when config has verticals', () => {
    const errors = validate(buildRadar({
      'ring-overrides': { verticals: { 'ghost-vert': { ring: 'trial', reason: 'r' } } },
    }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('"ghost-vert"'),
    }));
  });

  test('skips unknown-vertical check when config has no verticals', () => {
    const radar = buildRadar(
      { 'ring-overrides': { verticals: { 'any-vert': { ring: 'trial', reason: 'r' } } } },
      { verticals: {} },
    );
    const errors = validate(radar);
    // Only error should be about the invalid ring (trial is valid), so no unknown-vertical error
    expect(errors.every(e => !e.message.includes('"any-vert"'))).toBe(true);
  });

  test('errors on override with invalid ring', () => {
    const errors = validate(buildRadar({
      verticals: ['vert-a'],
      'ring-overrides': { verticals: { 'vert-a': { ring: 'bad', reason: 'r' } } },
    }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('"bad"'),
    }));
  });

  test('warns when vertical override is missing reason', () => {
    const errors = validate(buildRadar({
      verticals: ['vert-a'],
      'ring-overrides': { verticals: { 'vert-a': { ring: 'trial' } } },
    }));
    expect(errors).toContainEqual(expect.objectContaining({
      severity: 'warning',
      message: 'Ring override missing reason',
    }));
    expect(errors.every(e => e.severity === 'warning')).toBe(true);
  });
});

describe('validate - error paths', () => {
  test('path format is disc.quad.entry', () => {
    const errors = validate(buildRadar({ ring: 'bad' }));
    expect(errors[0].path).toBe('eng.tools.tool');
  });

  test('team error path includes .teams suffix', () => {
    const errors = validate(buildRadar({ teams: ['ghost'] }));
    expect(errors[0].path).toBe('eng.tools.tool.teams');
  });

  test('ring-override team error path includes the team key', () => {
    const errors = validate(buildRadar({
      'ring-overrides': { teams: { 'ghost-team': { ring: 'trial', reason: 'r' } } },
    }));
    expect(errors.some(e => e.path === 'eng.tools.tool.ring-overrides.teams.ghost-team')).toBe(true);
  });
});

describe('validate - structural edge cases', () => {
  test('handles a radar with no disciplines', () => {
    const radar = { meta: {}, config: {}, disciplines: {} };
    expect(validate(radar)).toEqual([]);
  });

  test('handles a discipline with no quadrants', () => {
    const radar = {
      meta: {}, config: {},
      disciplines: { eng: { meta: { label: 'Eng' } } },
    };
    expect(validate(radar)).toEqual([]);
  });

  test('handles a quadrant with no entries', () => {
    const radar = {
      meta: {}, config: {},
      disciplines: {
        eng: {
          meta: { label: 'Eng' },
          quadrants: { tools: { meta: { label: 'Tools' } } },
        },
      },
    };
    expect(validate(radar)).toEqual([]);
  });

  test('handles a radar with no config at all', () => {
    const radar = {
      meta: {},
      disciplines: {
        eng: {
          meta: { label: 'Eng' },
          quadrants: {
            tools: {
              meta: { label: 'Tools' },
              entries: { tool: { label: 'Tool', ring: 'adopt' } },
            },
          },
        },
      },
    };
    // No config means no teams/verticals/link-types known — but an entry that
    // references none of them should still validate.
    expect(validate(radar)).toEqual([]);
  });

  test('reports errors for every invalid entry, not just the first', () => {
    const radar = buildRadar();
    // Add a second entry under the same quadrant with a bad ring.
    radar.disciplines.eng.quadrants.tools.entries.other = { label: 'Other', ring: 'nope' };
    // And break the first entry too.
    radar.disciplines.eng.quadrants.tools.entries.tool.ring = 'also-bad';

    const errors = validate(radar);
    const badRingErrors = errors.filter(e => e.message.includes('Invalid ring'));
    expect(badRingErrors).toHaveLength(2);
    expect(badRingErrors.map(e => e.path).sort()).toEqual([
      'eng.tools.other',
      'eng.tools.tool',
    ]);
  });
});

describe('validate - timeline', () => {
  test('collects errors for multiple invalid timeline rings', () => {
    const errors = validate(buildRadar({
      timeline: { 'bad-1': '2026-Q1', 'bad-2': '2026-Q2' },
    }));
    const timelineErrors = errors.filter(e => e.path.endsWith('.timeline'));
    expect(timelineErrors).toHaveLength(2);
  });
});
