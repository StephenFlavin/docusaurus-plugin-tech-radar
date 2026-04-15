import React from 'react';

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
        <input
          type="text"
          placeholder="Search entries…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="radar-search-input"
        />
      </div>

      <div className="radar-filter-row">
        <div className="radar-ring-filters">
          {['adopt', 'trial', 'assess', 'hold'].map(r => (
            <button
              key={r}
              onClick={() => setRingFilter(ringFilter === r ? null : r)}
              className={`radar-ring-badge radar-ring-badge--${r} ${ringFilter === r ? 'radar-ring-badge--active' : ''}`}
            >
              <span className={`radar-ring-dot radar-ring-dot--${r}`} />
              {r}
            </button>
          ))}
        </div>

        {verticalFilter ? (
          <button className="radar-filter-chip radar-filter-chip--vertical" onClick={() => setVerticalFilter(null)}>
            {config.verticals?.[verticalFilter]?.label || verticalFilter} ✕
          </button>
        ) : verticals.length > 0 ? (
          <select className="radar-filter-select" value="" onChange={e => setVerticalFilter(e.target.value || null)}>
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
          <select className="radar-filter-select" value="" onChange={e => setTeamFilter(e.target.value || null)}>
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
          <select className="radar-filter-select" value="" onChange={e => setTagFilter(e.target.value || null)}>
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
