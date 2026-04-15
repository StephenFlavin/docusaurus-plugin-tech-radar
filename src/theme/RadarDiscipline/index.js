import React from 'react';
import RadarLayout from '@theme/RadarLayout';
import {
  EntryCard, FilterBar, RadarViz, RingStats,
  useRadarFilters, ringOrder, effectiveRing, linkTypeLabel,
} from '@theme/RadarComponents';

export default function RadarDiscipline({ radar, discData, sidebar }) {
  const { slug: discSlug, discipline: disc } = discData;
  const config = radar.config;
  const ki = disc.meta['key-individuals'] || [];
  const links = disc.meta.links || [];

  const allEntries = [];
  for (const [qSlug, quad] of Object.entries(disc.quadrants || {})) {
    for (const [eSlug, entry] of Object.entries(quad.entries || {})) {
      allEntries.push({ ...entry, slug: eSlug, discSlug, quadSlug: qSlug });
    }
  }

  const filters = useRadarFilters(allEntries);
  const hasFilter = filters.ringFilter || filters.teamFilter || filters.verticalFilter || filters.tagFilter || filters.search;

  const toc = [
    { id: 'radar-viz', label: 'Radar', level: 2 },
    ...Object.entries(disc.quadrants || {}).map(([qSlug, quad]) => ({
      id: qSlug, label: quad.meta.label, level: 2,
    })),
    ...(ki.length > 0 ? [{ id: 'people', label: 'Key Individuals', level: 2 }] : []),
    ...(links.length > 0 ? [{ id: 'links', label: 'Links', level: 2 }] : []),
  ];

  return (
    <RadarLayout sidebar={sidebar} toc={toc} title={disc.meta.label} description={disc.meta.description}>
      <h1>{disc.meta.label}</h1>

      {disc.meta.description && (
        <p className="radar-disc-description">{disc.meta.description}</p>
      )}

      {disc.meta.tags && disc.meta.tags.length > 0 && (
        <div className="radar-disc-tags">
          {disc.meta.tags.map(t => <span key={t} className="radar-tag">{t}</span>)}
        </div>
      )}

      <div id="radar-viz">
        <RadarViz
          quadrants={Object.entries(disc.quadrants || {})}
          basePath={`/${radar.routeBasePath}/${discSlug}`}
          filters={filters}
        />
      </div>

      <RingStats
        entries={allEntries}
        teamFilter={filters.teamFilter}
        verticalFilter={filters.verticalFilter}
        ringFilter={filters.ringFilter}
        setRingFilter={filters.setRingFilter}
      />

      <FilterBar filters={filters} config={config} />

      <div className="radar-filter-count">
        {filters.filtered.length} of {allEntries.length} entries
      </div>

      {Object.entries(disc.quadrants || {}).map(([qSlug, quad]) => {
        const entries = filters.filtered
          .filter(e => e.quadSlug === qSlug)
          .sort((a, b) => {
            const ra = effectiveRing(a, filters.teamFilter, filters.verticalFilter).ring;
            const rb = effectiveRing(b, filters.teamFilter, filters.verticalFilter).ring;
            return ringOrder(ra) - ringOrder(rb);
          });

        if (entries.length === 0 && hasFilter) return null;

        return (
          <div key={qSlug} className="radar-quadrant" id={qSlug}>
            <div className="radar-quadrant-header">
              <h2>{quad.meta.label}</h2>
              <span className="radar-quadrant-count">{entries.length} entries</span>
            </div>
            {quad.meta.guidance && (
              <div className="radar-quadrant-guidance">{quad.meta.guidance}</div>
            )}
            {quad.meta.links && quad.meta.links.length > 0 && (
              <div className="radar-quadrant-links">
                {quad.meta.links.map(l => (
                  <span key={l.uri} className="radar-quadrant-link-item">
                    <span className="radar-link-type-badge">{linkTypeLabel(config, l.type)}</span>
                    {' '}{l.label || l.uri}
                  </span>
                ))}
              </div>
            )}
            <div className="radar-entry-grid">
              {entries.map(e => (
                <EntryCard
                  key={e.slug}
                  entry={e} slug={e.slug} discSlug={discSlug}
                  routeBasePath={radar.routeBasePath}
                  config={config}
                  teamFilter={filters.teamFilter}
                  verticalFilter={filters.verticalFilter}
                />
              ))}
            </div>
          </div>
        );
      })}

      {ki.length > 0 && (
        <div className="radar-detail-section" id="people">
          <h2>Key Individuals</h2>
          <div className="radar-people">
            {ki.map(p => (
              <div key={p.name} className="radar-person-chip">
                {p.name}
                {p.role && <span className="radar-person-role">{p.role}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div className="radar-detail-section" id="links">
          <h2>Links</h2>
          <div className="radar-link-list">
            {links.map(l => (
              <div key={l.uri} className="radar-link-item">
                <span className="radar-link-type-badge">{linkTypeLabel(config, l.type)}</span>
                <span className="radar-link-label">{l.label || l.uri}</span>
                <span className="radar-link-uri">{l.uri}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </RadarLayout>
  );
}
