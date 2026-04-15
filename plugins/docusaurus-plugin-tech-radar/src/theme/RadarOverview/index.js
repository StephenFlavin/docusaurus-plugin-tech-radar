import React from 'react';
import RadarLayout from '@theme/RadarLayout';
import {
  EntryCard, FilterBar, RingStats,
  useRadarFilters, ringOrder, effectiveRing,
} from '@theme/RadarComponents';

export default function RadarOverview({ radar, sidebar }) {
  const allEntries = [];
  for (const [dSlug, disc] of Object.entries(radar.disciplines)) {
    for (const [qSlug, quad] of Object.entries(disc.quadrants || {})) {
      for (const [eSlug, entry] of Object.entries(quad.entries || {})) {
        allEntries.push({
          ...entry, slug: eSlug, discSlug: dSlug,
          discLabel: disc.meta.label, quadLabel: quad.meta.label,
        });
      }
    }
  }

  const filters = useRadarFilters(allEntries);
  const sorted = [...filters.filtered].sort((a, b) => {
    const ra = effectiveRing(a, filters.teamFilter, filters.verticalFilter).ring;
    const rb = effectiveRing(b, filters.teamFilter, filters.verticalFilter).ring;
    return ringOrder(ra) - ringOrder(rb);
  });

  const toc = [
    { id: 'rings', label: 'Rings', level: 2 },
    { id: 'entries', label: 'All Entries', level: 2 },
    ...(radar.meta.changelog?.length ? [{ id: 'changelog', label: 'Changelog', level: 2 }] : []),
  ];

  return (
    <RadarLayout sidebar={sidebar} toc={toc} title="Tech Radar" description={radar.meta.title}>
      <h1>{radar.meta.title}</h1>
      <p className="radar-overview-meta">
        Version {radar.meta.version} · {radar.meta.date}
        {radar.meta.cadence && <> · Reviewed {radar.meta.cadence}</>}
      </p>

      <div id="rings">
        <RingStats
          entries={allEntries}
          teamFilter={filters.teamFilter}
          verticalFilter={filters.verticalFilter}
          ringFilter={filters.ringFilter}
          setRingFilter={filters.setRingFilter}
        />
      </div>

      <FilterBar filters={filters} config={radar.config} />

      <div id="entries">
        <div className="radar-filter-count">
          {sorted.length} of {allEntries.length} entries
        </div>
        <div className="radar-entry-grid">
          {sorted.map(e => (
            <EntryCard
              key={`${e.discSlug}-${e.slug}`}
              entry={e} slug={e.slug} discSlug={e.discSlug}
              routeBasePath={radar.routeBasePath}
              subtitle={`${e.discLabel} › ${e.quadLabel}`}
              config={radar.config}
              teamFilter={filters.teamFilter}
              verticalFilter={filters.verticalFilter}
            />
          ))}
        </div>
      </div>

      {radar.meta.changelog && radar.meta.changelog.length > 0 && (
        <div className="radar-detail-section" id="changelog">
          <h2>Changelog</h2>
          {radar.meta.changelog.map(c => (
            <div key={c.version} className="radar-changelog-item">
              <strong>v{c.version}</strong> — {c.date}
              <p className="radar-changelog-summary">{c.summary}</p>
            </div>
          ))}
        </div>
      )}
    </RadarLayout>
  );
}
