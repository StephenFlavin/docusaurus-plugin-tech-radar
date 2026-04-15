import React from 'react';
import Link from '@docusaurus/Link';
import { RING_COLORS, RING_FILLS, effectiveRing } from './rings';
import { entryMatchesFilters } from './filters';

// Deterministic position scatter — same slug always lands in the same spot.
function seededRandom(str, salt) {
  let h = salt * 9301 + 49297;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return ((h & 0x7fffffff) % 1000) / 1000;
}

export function RadarViz({ quadrants, basePath, filters }) {
  const { teamFilter, verticalFilter, tagFilter, ringFilter, search } = filters;

  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 230;
  const ringRadii = [78, 138, 188, maxR];
  const ringNames = ['adopt', 'trial', 'assess', 'hold'];
  const anglePerQuad = (2 * Math.PI) / Math.max(quadrants.length, 1);
  const startAngle = -Math.PI / 2;

  return (
    <div className="radar-viz">
      <svg viewBox={`0 0 ${size} ${size}`} className="radar-viz-svg">
        {/* Ring bands — draw largest first so smaller ones render on top */}
        {[...ringRadii].reverse().map((r, ri) => {
          const idx = ringRadii.length - 1 - ri;
          return (
            <circle
              key={idx}
              cx={cx} cy={cy} r={r}
              fill={RING_FILLS[ringNames[idx]]}
              stroke="var(--ifm-toc-border-color)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Ring name labels */}
        {ringRadii.map((r, i) => {
          const labelR = i === 0 ? r / 2 : (ringRadii[i - 1] + r) / 2;
          return (
            <text
              key={ringNames[i]}
              x={cx} y={cy - labelR + 3}
              fill={RING_COLORS[ringNames[i]]}
              fontSize="7.5" opacity="0.5"
              textAnchor="middle" fontWeight="600" letterSpacing="0.08em"
            >
              {ringNames[i].toUpperCase()}
            </text>
          );
        })}

        {/* Quadrant segments */}
        {quadrants.map(([qSlug, quad], qi) => {
          const a1 = startAngle + qi * anglePerQuad;
          const midAngle = a1 + anglePerQuad / 2;
          const lx = cx + Math.cos(a1) * maxR;
          const ly = cy + Math.sin(a1) * maxR;
          const lbx = cx + Math.cos(midAngle) * (maxR + 16);
          const lby = cy + Math.sin(midAngle) * (maxR + 16);
          const label = quad.meta.label.length > 18
            ? quad.meta.label.slice(0, 16) + '…'
            : quad.meta.label;

          const visibleEntries = Object.entries(quad.entries || {}).filter(([, entry]) =>
            entryMatchesFilters(entry, teamFilter, verticalFilter, tagFilter, ringFilter, search)
          );

          return (
            <g key={qSlug}>
              <line x1={cx} y1={cy} x2={lx} y2={ly}
                stroke="var(--ifm-toc-border-color)" strokeWidth="0.5" />
              <text x={lbx} y={lby}
                fill="var(--ifm-font-color-secondary)" fontSize="7" opacity="0.6"
                textAnchor="middle" dominantBaseline="middle">
                {label}
              </text>

              {visibleEntries.map(([eSlug, entry]) => {
                const { ring: effRing, override } = effectiveRing(entry, teamFilter, verticalFilter);
                const ringIdx = ringNames.indexOf(effRing);
                if (ringIdx < 0) return null;

                const innerR = ringIdx === 0 ? 14 : ringRadii[ringIdx - 1] + 8;
                const outerR = ringRadii[ringIdx] - 8;
                const r = innerR + (outerR - innerR) * seededRandom(eSlug, 0);
                const aSpread = anglePerQuad * 0.78;
                const aOffset = (anglePerQuad - aSpread) / 2;
                const a = a1 + aOffset + aSpread * seededRandom(eSlug, 1);
                const ex = cx + Math.cos(a) * r;
                const ey = cy + Math.sin(a) * r;
                const showLabel = visibleEntries.length <= 10;

                return (
                  <Link key={eSlug} to={`${basePath}/${eSlug}`}>
                    <g className="radar-viz-dot">
                      <circle cx={ex} cy={ey} r={10} fill="transparent" className="radar-viz-dot-hover" />
                      {override ? (
                        <rect
                          x={ex - 4.5} y={ey - 4.5} width={9} height={9}
                          fill={RING_COLORS[effRing]} opacity="0.9"
                          transform={`rotate(45 ${ex} ${ey})`}
                        />
                      ) : (
                        <circle cx={ex} cy={ey} r={4.5} fill={RING_COLORS[effRing]} opacity="0.85" />
                      )}
                      {showLabel && (
                        <text x={ex} y={ey + 13}
                          fill="var(--ifm-font-color-secondary)"
                          fontSize="5.5" textAnchor="middle" opacity="0.7">
                          {entry.label.length > 14 ? entry.label.slice(0, 12) + '…' : entry.label}
                        </text>
                      )}
                      <title>
                        {entry.label} ({effRing})
                        {override ? ` — overridden from ${entry.ring}` : ''}
                      </title>
                    </g>
                  </Link>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
