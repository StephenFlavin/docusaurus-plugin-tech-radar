import React from 'react';
import { effectiveRing } from './rings';

export function RingStats({ entries, teamFilter, verticalFilter, ringFilter, setRingFilter }) {
  const counts = { adopt: 0, trial: 0, assess: 0, hold: 0 };
  for (const e of entries) {
    const { ring } = effectiveRing(e, teamFilter, verticalFilter);
    counts[ring] = (counts[ring] || 0) + 1;
  }

  return (
    <div className="radar-stats">
      {['adopt', 'trial', 'assess', 'hold'].map(r => (
        <button
          key={r}
          className={`radar-stat-card ${ringFilter === r ? 'radar-stat-card--active' : ''}`}
          onClick={() => setRingFilter(ringFilter === r ? null : r)}
        >
          <div className={`radar-stat-value radar-stat-value--${r}`}>{counts[r]}</div>
          <div className="radar-stat-label">{r}</div>
        </button>
      ))}
    </div>
  );
}
