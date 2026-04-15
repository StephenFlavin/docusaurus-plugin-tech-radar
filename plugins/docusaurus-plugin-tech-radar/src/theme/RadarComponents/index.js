import React from 'react';
import Link from '@docusaurus/Link';

// ── Ring Helpers ─────────────────────────────────────────────────

const RING_ORDER = { adopt: 0, trial: 1, assess: 2, hold: 3 };
const RING_COLORS = { adopt: '#22c55e', trial: '#3b82f6', assess: '#f59e0b', hold: '#ef4444' };
const RING_FILLS = {
  adopt: 'rgba(34,197,94,0.07)', trial: 'rgba(59,130,246,0.05)',
  assess: 'rgba(245,158,11,0.04)', hold: 'rgba(239,68,68,0.03)',
};

export function ringOrder(r) { return RING_ORDER[r] ?? 4; }

/**
 * Resolve effective ring given active filters.
 * Team overrides take priority over vertical overrides.
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

/** Check whether an entry passes the active filters */
function entryMatchesFilters(entry, teamFilter, verticalFilter, tagFilter, ringFilter, search) {
  const { ring: effRing } = effectiveRing(entry, teamFilter, verticalFilter);
  if (ringFilter && effRing !== ringFilter) return false;
  if (teamFilter && !(entry.teams || []).includes(teamFilter)) return false;
  if (verticalFilter && !(entry.verticals || []).includes(verticalFilter)) return false;
  if (tagFilter && !(entry.tags || []).includes(tagFilter)) return false;
  if (search) {
    const q = search.toLowerCase();
    const h = [entry.label, entry.description, entry.rationale,
      ...(entry.tags || []), ...(entry.teams || []), ...(entry.verticals || [])]
      .filter(Boolean).join(' ').toLowerCase();
    if (!h.includes(q)) return false;
  }
  return true;
}

// ── Seeded random ────────────────────────────────────────────────

function seededRandom(str, salt) {
  let h = salt * 9301 + 49297;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return ((h & 0x7fffffff) % 1000) / 1000;
}

// ── Filters ──────────────────────────────────────────────────────

export function useRadarFilters(allEntries) {
  const [ringFilter, setRingFilter] = React.useState(null);
  const [teamFilter, setTeamFilter] = React.useState(null);
  const [verticalFilter, setVerticalFilter] = React.useState(null);
  const [tagFilter, setTagFilter] = React.useState(null);
  const [search, setSearch] = React.useState('');

  const teamUsage = {}, tagUsage = {}, verticalUsage = {};
  for (const e of allEntries) {
    for (const t of (e.teams || [])) teamUsage[t] = (teamUsage[t] || 0) + 1;
    for (const t of (e.tags || [])) tagUsage[t] = (tagUsage[t] || 0) + 1;
    for (const v of (e.verticals || [])) verticalUsage[v] = (verticalUsage[v] || 0) + 1;
  }

  const filtered = allEntries.filter(e =>
    entryMatchesFilters(e, teamFilter, verticalFilter, tagFilter, ringFilter, search)
  );

  return {
    ringFilter, setRingFilter,
    teamFilter, setTeamFilter,
    verticalFilter, setVerticalFilter,
    tagFilter, setTagFilter,
    search, setSearch,
    filtered,
    teamUsage, tagUsage, verticalUsage,
  };
}

export function FilterBar({ filters, config }) {
  const {
    ringFilter, setRingFilter,
    teamFilter, setTeamFilter,
    verticalFilter, setVerticalFilter,
    tagFilter, setTagFilter,
    search, setSearch,
    teamUsage, tagUsage, verticalUsage,
  } = filters;

  const teams = Object.keys(config.teams || {}).filter(t => teamUsage[t]);
  const verticals = Object.keys(config.verticals || {}).filter(v => verticalUsage[v]);
  const tags = Object.keys(tagUsage).sort();
  const hasContext = teamFilter || verticalFilter;

  return (
    <div className="radar-filter-bar">
      <div className="radar-filter-search">
        <input type="text" placeholder="Search entries…" value={search}
          onChange={e => setSearch(e.target.value)} className="radar-search-input" />
      </div>

      <div className="radar-filter-row">
        <div className="radar-ring-filters">
          {['adopt', 'trial', 'assess', 'hold'].map(r => (
            <button key={r}
              onClick={() => setRingFilter(ringFilter === r ? null : r)}
              className={`radar-ring-badge radar-ring-badge--${r} ${ringFilter === r ? 'radar-ring-badge--active' : ''}`}>
              <span className={`radar-ring-dot radar-ring-dot--${r}`} />
              {r}
            </button>
          ))}
        </div>

        {verticalFilter ? (
          <button className="radar-filter-chip radar-filter-chip--vertical"
            onClick={() => setVerticalFilter(null)}>
            {config.verticals?.[verticalFilter]?.label || verticalFilter} ✕
          </button>
        ) : verticals.length > 0 ? (
          <select className="radar-filter-select" value=""
            onChange={e => setVerticalFilter(e.target.value || null)}>
            <option value="">Vertical…</option>
            {verticals.map(v => (
              <option key={v} value={v}>
                {config.verticals?.[v]?.label || v} ({verticalUsage[v]})
              </option>
            ))}
          </select>
        ) : null}

        {teamFilter ? (
          <button className="radar-filter-chip" onClick={() => setTeamFilter(null)}>
            {config.teams?.[teamFilter]?.label || teamFilter} ✕
          </button>
        ) : teams.length > 0 ? (
          <select className="radar-filter-select" value=""
            onChange={e => setTeamFilter(e.target.value || null)}>
            <option value="">Team…</option>
            {teams.map(t => (
              <option key={t} value={t}>
                {config.teams?.[t]?.label || t} ({teamUsage[t]})
              </option>
            ))}
          </select>
        ) : null}

        {tagFilter ? (
          <button className="radar-filter-chip" onClick={() => setTagFilter(null)}>
            {tagFilter} ✕
          </button>
        ) : tags.length > 0 ? (
          <select className="radar-filter-select" value=""
            onChange={e => setTagFilter(e.target.value || null)}>
            <option value="">Tag…</option>
            {tags.map(t => <option key={t} value={t}>{t} ({tagUsage[t]})</option>)}
          </select>
        ) : null}
      </div>

      {hasContext && (
        <div className="radar-context-hint">
          Rings reflect the perspective of
          {teamFilter && <strong> {config.teams?.[teamFilter]?.label || teamFilter}</strong>}
          {teamFilter && verticalFilter && ' within'}
          {verticalFilter && <strong> {config.verticals?.[verticalFilter]?.label || verticalFilter}</strong>}
          . Overridden entries are marked with ◆.
        </div>
      )}
    </div>
  );
}

// ── Stat Cards ───────────────────────────────────────────────────

export function RingStats({ entries, teamFilter, verticalFilter, ringFilter, setRingFilter }) {
  const rings = { adopt: 0, trial: 0, assess: 0, hold: 0 };
  for (const e of entries) {
    const { ring } = effectiveRing(e, teamFilter, verticalFilter);
    rings[ring]++;
  }
  return (
    <div className="radar-stats">
      {['adopt', 'trial', 'assess', 'hold'].map(r => (
        <button key={r}
          className={`radar-stat-card ${ringFilter === r ? 'radar-stat-card--active' : ''}`}
          onClick={() => setRingFilter(ringFilter === r ? null : r)}>
          <div className={`radar-stat-value radar-stat-value--${r}`}>{rings[r]}</div>
          <div className="radar-stat-label">{r}</div>
        </button>
      ))}
    </div>
  );
}

// ── Radar SVG Visualization ──────────────────────────────────────

export function RadarViz({ quadrants, basePath, filters }) {
  const { teamFilter, verticalFilter, tagFilter, ringFilter, search } = filters;

  const size = 520, cx = size / 2, cy = size / 2, maxR = 230;
  const ringRadii = [78, 138, 188, maxR];
  const ringNames = ['adopt', 'trial', 'assess', 'hold'];
  const anglePerQuad = (2 * Math.PI) / Math.max(quadrants.length, 1);
  const startAngle = -Math.PI / 2;

  return (
    <div className="radar-viz">
      <svg viewBox={`0 0 ${size} ${size}`} className="radar-viz-svg">
        {/* Ring bands */}
        {[...ringRadii].reverse().map((r, ri) => {
          const idx = ringRadii.length - 1 - ri;
          return <circle key={idx} cx={cx} cy={cy} r={r}
            fill={RING_FILLS[ringNames[idx]]}
            stroke="var(--ifm-toc-border-color)" strokeWidth="0.5" />;
        })}

        {/* Ring labels */}
        {ringRadii.map((r, i) => {
          const labelR = i === 0 ? r / 2 : (ringRadii[i - 1] + r) / 2;
          return <text key={i} x={cx} y={cy - labelR + 3}
            fill={RING_COLORS[ringNames[i]]} fontSize="7.5" opacity="0.5"
            textAnchor="middle" fontWeight="600" letterSpacing="0.08em">
            {ringNames[i].toUpperCase()}
          </text>;
        })}

        {/* Quadrants */}
        {quadrants.map(([qSlug, quad], qi) => {
          const a1 = startAngle + qi * anglePerQuad;
          const midAngle = a1 + anglePerQuad / 2;
          const lx = cx + Math.cos(a1) * maxR;
          const ly = cy + Math.sin(a1) * maxR;
          const labelR2 = maxR + 16;
          const lbx = cx + Math.cos(midAngle) * labelR2;
          const lby = cy + Math.sin(midAngle) * labelR2;
          const label = quad.meta.label.length > 18
            ? quad.meta.label.slice(0, 16) + '…' : quad.meta.label;

          // Filter entries the same way the card grid does
          const allEntries = Object.entries(quad.entries || {});
          const visibleEntries = allEntries.filter(([, entry]) =>
            entryMatchesFilters(entry, teamFilter, verticalFilter, tagFilter, ringFilter, search)
          );

          return (
            <g key={qSlug}>
              <line x1={cx} y1={cy} x2={lx} y2={ly}
                stroke="var(--ifm-toc-border-color)" strokeWidth="0.5" />
              <text x={lbx} y={lby}
                fill="var(--ifm-font-color-secondary)" fontSize="7" opacity="0.6"
                textAnchor="middle" dominantBaseline="middle">{label}</text>

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

                // Diamond shape for overridden entries, circle for normal
                return (
                  <a key={eSlug} href={`${basePath}/${eSlug}`}>
                    <g className="radar-viz-dot">
                      <circle cx={ex} cy={ey} r={10} fill="transparent"
                        className="radar-viz-dot-hover" />
                      {override ? (
                        // Diamond for overridden entries
                        <rect x={ex - 4.5} y={ey - 4.5} width={9} height={9}
                          fill={RING_COLORS[effRing]} opacity="0.9"
                          transform={`rotate(45 ${ex} ${ey})`} />
                      ) : (
                        // Circle for normal entries
                        <circle cx={ex} cy={ey} r={4.5}
                          fill={RING_COLORS[effRing]} opacity="0.85" />
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
                  </a>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Entry Card ───────────────────────────────────────────────────

export function EntryCard({ entry, slug, discSlug, subtitle, config, teamFilter, verticalFilter }) {
  const { ring: effRing, override } = effectiveRing(entry, teamFilter, verticalFilter);
  const teams = (entry.teams || []).slice(0, 3).map(t => config?.teams?.[t]?.label || t);
  const extra = Math.max(0, (entry.teams || []).length - 3);
  const linkCount = (entry.links || []).length;
  const discCount = (entry.discussions || []).length;

  return (
    <Link to={`/radar/${discSlug}/${slug}`}
      className={`radar-entry-card radar-entry-card--${effRing}`}>
      <div className="radar-entry-card-header">
        <span className="radar-entry-card-title">{entry.label}</span>
        <span className="radar-entry-card-ring">
          <span className={`radar-ring-badge radar-ring-badge--${effRing}`}>
            {override && '◆ '}{effRing}
          </span>
          {override && (
            <span className="radar-ring-original">was {entry.ring}</span>
          )}
        </span>
      </div>
      {entry.description && <div className="radar-entry-card-desc">{entry.description}</div>}
      {override && (
        <div className="radar-entry-card-override">{override.reason}</div>
      )}
      {subtitle && (
        <div style={{ fontSize: '0.72rem', color: 'var(--ifm-font-color-secondary)', marginTop: '0.15rem' }}>
          {subtitle}
        </div>
      )}
      <div className="radar-entry-card-footer">
        {entry.tags && entry.tags.length > 0 && (
          <div className="radar-entry-card-tags">
            {entry.tags.map(t => <span key={t} className="radar-tag">{t}</span>)}
          </div>
        )}
        <div className="radar-entry-card-meta">
          {teams.length > 0 && (
            <span className="radar-entry-card-teams">
              {teams.join(', ')}{extra > 0 ? ` +${extra}` : ''}
            </span>
          )}
          {linkCount > 0 && <span className="radar-entry-card-icon">🔗{linkCount}</span>}
          {discCount > 0 && <span className="radar-entry-card-icon">💬{discCount}</span>}
        </div>
      </div>
    </Link>
  );
}

// ── Link Type Helper ─────────────────────────────────────────────

export function linkTypeLabel(config, typeKey) {
  const lt = config?.['link-types'] || {};
  return lt[typeKey]?.label || typeKey;
}
