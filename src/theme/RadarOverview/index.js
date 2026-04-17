import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import RadarLayout from '@theme/RadarLayout';
import {
  EntryCard, FilterBar, RingStats,
  useRadarFilters, ringOrder, effectiveRing,
} from '@theme/RadarComponents';

const RINGS = ['adopt', 'trial', 'assess', 'hold'];

export default function RadarOverview({ radar, sidebar, pagination }) {
  const allEntries = [];
  const disciplineSummaries = [];
  for (const [dSlug, disc] of Object.entries(radar.disciplines)) {
    const discEntries = [];
    for (const [qSlug, quad] of Object.entries(disc.quadrants || {})) {
      for (const [eSlug, entry] of Object.entries(quad.entries || {})) {
        const withCtx = {
          ...entry, slug: eSlug, discSlug: dSlug,
          discLabel: disc.meta.label, quadLabel: quad.meta.label,
        };
        allEntries.push(withCtx);
        discEntries.push(withCtx);
      }
    }
    const ringCounts = Object.fromEntries(RINGS.map(r => [r, 0]));
    for (const e of discEntries) ringCounts[e.ring] = (ringCounts[e.ring] || 0) + 1;
    disciplineSummaries.push({
      slug: dSlug,
      label: disc.meta.label,
      description: disc.meta.description,
      tags: disc.meta.tags || [],
      total: discEntries.length,
      ringCounts,
    });
  }

  const filters = useRadarFilters(allEntries);
  const sorted = [...filters.filtered].sort((a, b) => {
    const ra = effectiveRing(a, filters.teamFilter, filters.verticalFilter).ring;
    const rb = effectiveRing(b, filters.teamFilter, filters.verticalFilter).ring;
    return ringOrder(ra) - ringOrder(rb);
  });

  // @theme/TOC expects items shaped like { id, value, level } (same as
  // mdx-loader's TOCItem). `value` is the display string.
  const toc = [
    { id: 'rings', value: 'Rings', level: 2 },
    { id: 'disciplines', value: 'Disciplines', level: 2 },
    { id: 'entries', value: 'All Entries', level: 2 },
    ...(radar.meta.changelog?.length ? [{ id: 'changelog', value: 'Changelog', level: 2 }] : []),
  ];

  const breadcrumbs = [{ label: 'Tech Radar' }];

  return (
    <RadarLayout
      sidebar={sidebar} toc={toc} breadcrumbs={breadcrumbs} pagination={pagination}
      title="Tech Radar" description={radar.meta.title}
    >
      <h1>{radar.meta.title}</h1>
      <p className="radar-overview-meta">
        Version {radar.meta.version} · {radar.meta.date}
        {radar.meta.cadence && <> · Reviewed {radar.meta.cadence}</>}
      </p>

      <Heading as="h2" id="rings">Rings</Heading>
      <RingStats
        entries={allEntries}
        teamFilter={filters.teamFilter}
        verticalFilter={filters.verticalFilter}
        ringFilter={filters.ringFilter}
        setRingFilter={filters.setRingFilter}
      />

      <Heading as="h2" id="disciplines">Disciplines</Heading>
      <div className="radar-discipline-grid">
        {disciplineSummaries.map(d => (
          <Link
            key={d.slug}
            to={`${radar.routeBasePath}/${d.slug}`}
            className="radar-discipline-card"
          >
            <div className="radar-discipline-card-title">{d.label}</div>
            {d.description && (
              <p className="radar-discipline-card-desc">{d.description}</p>
            )}
            <div className="radar-discipline-card-stats">
              <span className="radar-discipline-card-total">{d.total} entries</span>
              {RINGS.filter(r => d.ringCounts[r] > 0).map(r => (
                <span key={r} className={`radar-ring-text--${r}`}>
                  {d.ringCounts[r]} {r}
                </span>
              ))}
            </div>
            {d.tags.length > 0 && (
              <div className="radar-discipline-card-tags">
                {d.tags.map(t => <span key={t} className="radar-tag">{t}</span>)}
              </div>
            )}
          </Link>
        ))}
      </div>

      <FilterBar filters={filters} config={radar.config} />

      <Heading as="h2" id="entries">All Entries</Heading>
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

      {radar.meta.changelog && radar.meta.changelog.length > 0 && (
        <div className="radar-detail-section">
          <Heading as="h2" id="changelog">Changelog</Heading>
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
