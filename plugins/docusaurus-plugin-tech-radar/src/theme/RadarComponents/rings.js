// Ring constants and resolution logic.
// NOTE: ringOrder() is also defined in src/index.js for the plugin's Node runtime.
// The CJS/ESM boundary prevents sharing a single file; both copies are intentional.

export const RING_ORDER = { adopt: 0, trial: 1, assess: 2, hold: 3 };

export const RING_COLORS = {
  adopt: '#22c55e',
  trial: '#3b82f6',
  assess: '#f59e0b',
  hold: '#ef4444',
};

export const RING_FILLS = {
  adopt: 'rgba(34,197,94,0.07)',
  trial: 'rgba(59,130,246,0.05)',
  assess: 'rgba(245,158,11,0.04)',
  hold: 'rgba(239,68,68,0.03)',
};

export function ringOrder(r) {
  return RING_ORDER[r] ?? 4;
}

/**
 * Resolve the effective ring for an entry given active filters.
 * Team overrides take priority over vertical overrides.
 * Returns { ring, override: { scope, key, reason } | null }
 */
export function effectiveRing(entry, teamFilter, verticalFilter) {
  const overrides = entry['ring-overrides'] || {};

  if (teamFilter && overrides.teams?.[teamFilter]) {
    const o = overrides.teams[teamFilter];
    return { ring: o.ring, override: { scope: 'team', key: teamFilter, reason: o.reason } };
  }

  if (verticalFilter && overrides.verticals?.[verticalFilter]) {
    const o = overrides.verticals[verticalFilter];
    return { ring: o.ring, override: { scope: 'vertical', key: verticalFilter, reason: o.reason } };
  }

  return { ring: entry.ring, override: null };
}
