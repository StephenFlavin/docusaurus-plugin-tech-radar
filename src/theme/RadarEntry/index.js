import React from 'react';
import Link from '@docusaurus/Link';
import RadarLayout from '@theme/RadarLayout';

// NOTE: slugToLabel is also defined in src/parser.js (CJS).
// The CJS/ESM boundary prevents sharing one file; both copies are intentional.
function slugToLabel(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function RadarEntry({ radar, entryData, sidebar }) {
  const { slug, entry, discSlug, discLabel, quadSlug, quadLabel } = entryData;
  const config = radar.config;
  const lt = config['link-types'] || {};

  const ki = entry['key-individuals'] || [];
  const links = entry.links || [];
  const discussions = entry.discussions || [];
  const sections = Object.entries(entry.sections || {});
  const constraints = Object.entries(entry.constraints || {});
  const verticals = entry.verticals || [];
  const overrides = entry['ring-overrides'] || {};
  const teamOverrides = Object.entries(overrides.teams || {});
  const verticalOverrides = Object.entries(overrides.verticals || {});
  const hasOverrides = teamOverrides.length > 0 || verticalOverrides.length > 0;
  const timeline = Object.entries(entry.timeline || {})
    .sort((a, b) => a[1].localeCompare(b[1]));

  const toc = [];
  if (entry.rationale) toc.push({ id: 'rationale', label: 'Rationale', level: 2 });
  if (entry.ring === 'hold' && entry.hold_reason) toc.push({ id: 'hold-warning', label: 'Hold Warning', level: 2 });
  if (hasOverrides) toc.push({ id: 'ring-overrides', label: 'Ring Overrides', level: 2 });
  if (timeline.length > 0) toc.push({ id: 'timeline', label: 'Timeline', level: 2 });
  toc.push({ id: 'details', label: 'Details', level: 2 });
  if (constraints.length > 0) toc.push({ id: 'constraints', label: 'Constraints', level: 2 });
  if (links.length > 0) toc.push({ id: 'links', label: 'Links', level: 2 });
  if (discussions.length > 0) toc.push({ id: 'discussions', label: 'Discussions', level: 2 });
  for (const [key] of sections) toc.push({ id: key, label: slugToLabel(key), level: 2 });
  if (ki.length > 0) toc.push({ id: 'people', label: 'Key Individuals', level: 2 });

  const base = radar.routeBasePath;

  return (
    <RadarLayout sidebar={sidebar} toc={toc} title={entry.label}>
      <nav className="radar-breadcrumb">
        <Link to={`/${base}`}>Radar</Link>
        {' › '}
        <Link to={`/${base}/${discSlug}`}>{discLabel}</Link>
        {' › '}
        {quadLabel}
      </nav>

      <h1 className="radar-entry-title">{entry.label}</h1>

      <div className="radar-entry-ring-row">
        <span className={`radar-ring-badge radar-ring-badge--${entry.ring}`}>
          {entry.ring}
          {hasOverrides && <span className="radar-entry-ring-orgwide">(org-wide)</span>}
        </span>
        {entry.licence && (
          <span className="radar-entry-licence">{entry.licence}</span>
        )}
      </div>

      {entry.description && (
        <p className="radar-entry-description">{entry.description}</p>
      )}

      {entry.rationale && (
        <div className="radar-detail-section" id="rationale">
          <h2>Rationale</h2>
          <p className="radar-section-body">{entry.rationale}</p>
        </div>
      )}

      {entry.ring === 'hold' && entry.hold_reason && (
        <div className="radar-detail-section" id="hold-warning">
          <h2>Hold Warning</h2>
          <div className="radar-hold-warning">
            <div className="radar-hold-warning-title">⚠ Do not use for new work</div>
            <p>{entry.hold_reason}</p>
            {entry.sunset_date && <p>Sunset date: <strong>{entry.sunset_date}</strong></p>}
            {entry.migration_target && <p>Migrate to: <strong>{entry.migration_target}</strong></p>}
          </div>
        </div>
      )}

      {hasOverrides && (
        <div className="radar-detail-section" id="ring-overrides">
          <h2>Ring Overrides</h2>
          <p className="radar-overrides-intro">
            The org-wide ring is <strong className={`radar-ring-text--${entry.ring}`}>{entry.ring}</strong>,
            but these teams or verticals have a different assessment.
          </p>
          <div className="radar-overrides-list">
            {teamOverrides.map(([teamKey, o]) => (
              <div key={`team-${teamKey}`} className="radar-override-card">
                <div className="radar-override-header">
                  <span className="radar-override-scope">Team</span>
                  <strong>{config.teams?.[teamKey]?.label || teamKey}</strong>
                  <span className="radar-override-arrow">→</span>
                  <span className={`radar-ring-badge radar-ring-badge--${o.ring}`}>{o.ring}</span>
                </div>
                {o.reason && <div className="radar-override-reason">{o.reason}</div>}
              </div>
            ))}
            {verticalOverrides.map(([vertKey, o]) => (
              <div key={`vert-${vertKey}`} className="radar-override-card">
                <div className="radar-override-header">
                  <span className="radar-override-scope radar-override-scope--vertical">Vertical</span>
                  <strong>{config.verticals?.[vertKey]?.label || vertKey}</strong>
                  <span className="radar-override-arrow">→</span>
                  <span className={`radar-ring-badge radar-ring-badge--${o.ring}`}>{o.ring}</span>
                </div>
                {o.reason && <div className="radar-override-reason">{o.reason}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {timeline.length > 0 && (
        <div className="radar-detail-section" id="timeline">
          <h2>Timeline</h2>
          <div className="radar-timeline">
            {timeline.map(([ring, date], i) => (
              <React.Fragment key={ring}>
                {i > 0 && <div className="radar-timeline-connector" />}
                <div className="radar-timeline-step">
                  <div className={`radar-timeline-dot radar-timeline-dot--${ring} ${ring === entry.ring ? 'radar-timeline-dot--current' : ''}`} />
                  <div className="radar-timeline-label">{ring}</div>
                  <div className="radar-timeline-date">{date}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="radar-detail-section" id="details">
        <h2>Details</h2>
        <div className="radar-detail-grid">
          {entry.teams?.length > 0 && (
            <div className="radar-detail-cell">
              <div className="radar-detail-cell-label">Teams</div>
              <div className="radar-detail-cell-value">
                {entry.teams.map(t => config.teams?.[t]?.label || t).join(', ')}
              </div>
            </div>
          )}
          {verticals.length > 0 && (
            <div className="radar-detail-cell">
              <div className="radar-detail-cell-label">Verticals</div>
              <div className="radar-detail-cell-value">
                {verticals.map(v => config.verticals?.[v]?.label || v).join(', ')}
              </div>
            </div>
          )}
          {entry.compliance?.frameworks?.length > 0 && (
            <div className="radar-detail-cell">
              <div className="radar-detail-cell-label">Compliance</div>
              <div className="radar-detail-cell-value">{entry.compliance.frameworks.join(', ')}</div>
            </div>
          )}
          {entry.compliance?.notes && (
            <div className="radar-detail-cell">
              <div className="radar-detail-cell-label">Compliance Notes</div>
              <div className="radar-detail-cell-value">{entry.compliance.notes}</div>
            </div>
          )}
        </div>
        {entry.tags?.length > 0 && (
          <div className="radar-entry-detail-tags">
            {entry.tags.map(t => <span key={t} className="radar-tag">{t}</span>)}
          </div>
        )}
      </div>

      {constraints.length > 0 && (
        <div className="radar-detail-section" id="constraints">
          <h2>Constraints</h2>
          <table className="radar-constraint-table">
            <tbody>
              {constraints.map(([k, v]) => (
                <tr key={k}>
                  <td>{k.replace(/_/g, ' ')}</td>
                  <td>{Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {links.length > 0 && (
        <div className="radar-detail-section" id="links">
          <h2>Links</h2>
          <div className="radar-link-list">
            {links.map(l => (
              <div key={l.uri} className="radar-link-item">
                <span className="radar-link-type-badge">{lt[l.type]?.label || l.type}</span>
                <span className="radar-link-label">{l.label || l.uri}</span>
                <span className="radar-link-uri">{l.uri}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {discussions.length > 0 && (
        <div className="radar-detail-section" id="discussions">
          <h2>Discussions</h2>
          <div className="radar-link-list">
            {discussions.map(d => (
              <div key={d.title} className="radar-discussion-item">
                <span className="radar-discussion-type">{d.type}</span>
                <div>
                  <div className="radar-discussion-title">{d.title}</div>
                  {d.date && <div className="radar-discussion-date">{d.date}</div>}
                  {d.link && (
                    <div className="radar-discussion-link-ref">
                      <span className="radar-link-type-badge radar-link-type-badge--sm">
                        {lt[d.link.type]?.label || d.link.type}
                      </span>
                      {' '}{d.link.uri}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.map(([key, content]) => (
        <div key={key} className="radar-detail-section" id={key}>
          <h2>{slugToLabel(key)}</h2>
          <div className="radar-section-body">
            <pre className="radar-section-pre">{content}</pre>
          </div>
        </div>
      ))}

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
    </RadarLayout>
  );
}
