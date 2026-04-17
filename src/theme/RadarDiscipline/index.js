import React from 'react';
import Heading from '@theme/Heading';
import RadarLayout from '@theme/RadarLayout';
import {
  EntryCard, FilterBar, RadarViz, RingStats, LinkList,
  useRadarFilters, ringOrder, effectiveRing, linkTypeLabel,
} from '@theme/RadarComponents';

export default function RadarDiscipline({ radar, discData, sidebar }) {
  const { slug: discSlug, discipline: disc, pagination } = discData;
  const config = radar.config;
  const ki = disc.meta['key-individuals'] || [];
  const links = disc.meta.links || [];

  const allEntries = [];
  for (const [sSlug, seg] of Object.entries(disc.segments || {})) {
    for (const [eSlug, entry] of Object.entries(seg.entries || {})) {
      allEntries.push({ ...entry, slug: eSlug, discSlug, segSlug: sSlug });
    }
  }

  const filters = useRadarFilters(allEntries);
  const hasFilter = filters.ringFilter || filters.teamFilter || filters.verticalFilter || filters.tagFilter || filters.search;

  // @theme/TOC expects items shaped like { id, value, level } (same as
  // mdx-loader's TOCItem). `value` is the display string.
  const toc = [
    { id: 'radar-viz', value: 'Radar', level: 2 },
    ...Object.entries(disc.segments || {}).map(([sSlug, seg]) => ({
      id: sSlug, value: seg.meta.label, level: 2,
    })),
    ...(ki.length > 0 ? [{ id: 'people', value: 'Key Individuals', level: 2 }] : []),
    ...(links.length > 0 ? [{ id: 'links', value: 'Links', level: 2 }] : []),
  ];

  const breadcrumbs = [
    { label: 'Tech Radar', href: radar.routeBasePath },
    { label: disc.meta.label },
  ];

  return (
    <RadarLayout
      sidebar={sidebar} toc={toc} breadcrumbs={breadcrumbs} pagination={pagination}
      title={disc.meta.label} description={disc.meta.description}
    >
      <h1>{disc.meta.label}</h1>

      {disc.meta.description && (
        <p className="radar-disc-description">{disc.meta.description}</p>
      )}

      {disc.meta.tags && disc.meta.tags.length > 0 && (
        <div className="radar-disc-tags">
          {disc.meta.tags.map(t => <span key={t} className="radar-tag">{t}</span>)}
        </div>
      )}

      <Heading as="h2" id="radar-viz">Radar</Heading>
      <RadarViz
        segments={Object.entries(disc.segments || {})}
        basePath={`${radar.routeBasePath}/${discSlug}`}
        filters={filters}
      />

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

      {Object.entries(disc.segments || {}).map(([sSlug, seg]) => {
        const entries = filters.filtered
          .filter(e => e.segSlug === sSlug)
          .sort((a, b) => {
            const ra = effectiveRing(a, filters.teamFilter, filters.verticalFilter).ring;
            const rb = effectiveRing(b, filters.teamFilter, filters.verticalFilter).ring;
            return ringOrder(ra) - ringOrder(rb);
          });

        if (entries.length === 0 && hasFilter) return null;

        return (
          <div key={sSlug} className="radar-segment">
            <div className="radar-segment-header">
              <Heading as="h2" id={sSlug}>{seg.meta.label}</Heading>
              <span className="radar-segment-count">{entries.length} entries</span>
            </div>
            {seg.meta.guidance && (
              <div className="radar-segment-guidance">{seg.meta.guidance}</div>
            )}
            {seg.meta.links && seg.meta.links.length > 0 && (
              <LinkList config={config} links={seg.meta.links} />
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
        <div className="radar-detail-section">
          <Heading as="h2" id="people">Key Individuals</Heading>
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
        <div className="radar-detail-section">
          <Heading as="h2" id="links">Links</Heading>
          <LinkList config={config} links={links} />
        </div>
      )}
    </RadarLayout>
  );
}
