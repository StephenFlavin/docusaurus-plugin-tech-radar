import React from 'react';
import Link from '@docusaurus/Link';
import RadarLayout from '@theme/RadarLayout';

export default function RadarEntry({ radar, entryData, sidebar }) {
  const { slug, entry, discSlug, discLabel, quadSlug, quadLabel, config } = entryData;
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

  // Build right-hand TOC
  const toc = [];
  if (entry.rationale) toc.push({ id: 'rationale', label: 'Rationale', level: 2 });
  if (entry.ring === 'hold' && entry.hold_reason) toc.push({ id: 'hold-warning', label: 'Hold Warning', level: 2 });
  if (hasOverrides) toc.push({ id: 'ring-overrides', label: 'Ring Overrides', level: 2 });
  if (timeline.length > 0) toc.push({ id: 'timeline', label: 'Timeline', level: 2 });
  toc.push({ id: 'details', label: 'Details', level: 2 });
  if (constraints.length > 0) toc.push({ id: 'constraints', label: 'Constraints', level: 2 });
  if (links.length > 0) toc.push({ id: 'links', label: 'Links', level: 2 });
  if (discussions.length > 0) toc.push({ id: 'discussions', label: 'Discussions', level: 2 });
  for (const [key] of sections) {
    toc.push({ id: key, label: slugToLabel(key), level: 2 });
  }
  if (ki.length > 0) toc.push({ id: 'people', label: 'Key Individuals', level: 2 });

  return (
    <RadarLayout sidebar={sidebar} toc={toc} title={entry.label}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--ifm-font-color-secondary)' }}>
        <Link to="/radar">Radar</Link>
        {' › '}
        <Link to={`/radar/${discSlug}`}>{discLabel}</Link>
        {' › '}
        {quadLabel}
      </nav>

      <h1 style={{ marginBottom: '0.3rem' }}>{entry.label}</h1>

      {/* Ring + licence */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <span className={`radar-ring-badge radar-ring-badge--${entry.ring}`}>
          {entry.ring}
          {hasOverrides && <span style={{ marginLeft: '0.3rem', opacity: 0.7 }}>(org-wide)</span>}
        </span>
        {entry.licence && (
          <span style={{ fontSize: '0.78rem', color: 'var(--ifm-font-color-secondary)' }}>
            {entry.licence}
          </span>
        )}
      </div>

      {entry.description && (
        <p style={{ fontSize: '1rem', color: 'var(--ifm-font-color-secondary)', lineHeight: 1.6 }}>
          {entry.description}
        </p>
      )}

      {/* Rationale */}
      {entry.rationale && (
        <div className="radar-detail-section" id="rationale">
          <h2>Rationale</h2>
          <p className="radar-section-body">{entry.rationale}</p>
        </div>
      )}

      {/* Hold warning */}
      {entry.ring === 'hold' && entry.hold_reason && (
        <div className="radar-detail-section" id="hold-warning">
          <h2>Hold Warning</h2>
          <div className="radar-hold-warning">
            <div className="radar-hold-warning-title">⚠ Do not use for new work</div>
            <p>{entry.hold_reason}</p>
            {entry.sunset_date && <p>Sunset date: <strong>{entry.sunset_date}</strong></p>}
            {entry.migration_target && (
              <p>Migrate to: <strong>{entry.migration_target}</strong></p>
            )}
          </div>
        </div>
      )}

      {/* Ring Overrides */}
      {hasOverrides && (
        <div className="radar-detail-section" id="ring-overrides">
          <h2>Ring Overrides</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--ifm-font-color-secondary)', marginBottom: '0.75rem' }}>
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
                  <span className={`radar-ring-badge radar-ring-badge--${o.ring}`}>
                    {o.ring}
                  </span>
                </div>
                {o.reason && (
                  <div className="radar-override-reason">{o.reason}</div>
                )}
              </div>
            ))}
            {verticalOverrides.map(([vertKey, o]) => (
              <div key={`vert-${vertKey}`} className="radar-override-card">
                <div className="radar-override-header">
                  <span className="radar-override-scope radar-override-scope--vertical">Vertical</span>
                  <strong>{config.verticals?.[vertKey]?.label || vertKey}</strong>
                  <span className="radar-override-arrow">→</span>
                  <span className={`radar-ring-badge radar-ring-badge--${o.ring}`}>
                    {o.ring}
                  </span>
                </div>
                {o.reason && (
                  <div className="radar-override-reason">{o.reason}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
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

      {/* Details grid */}
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
              <div className="radar-detail-cell-value">
                {entry.compliance.frameworks.join(', ')}
              </div>
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
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {entry.tags.map(t => <span key={t} className="radar-tag">{t}</span>)}
          </div>
        )}
      </div>

      {/* Constraints */}
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

      {/* Links */}
      {links.length > 0 && (
        <div className="radar-detail-section" id="links">
          <h2>Links</h2>
          <div className="radar-link-list">
            {links.map((l, i) => (
              <div key={i} className="radar-link-item">
                <span className="radar-link-type-badge">{lt[l.type]?.label || l.type}</span>
                <span className="radar-link-label">{l.label || l.uri}</span>
                <span className="radar-link-uri">{l.uri}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discussions */}
      {discussions.length > 0 && (
        <div className="radar-detail-section" id="discussions">
          <h2>Discussions</h2>
          <div className="radar-link-list">
            {discussions.map((d, i) => (
              <div key={i} className="radar-discussion-item">
                <span className="radar-discussion-type">{d.type}</span>
                <div>
                  <div className="radar-discussion-title">{d.title}</div>
                  {d.date && <div className="radar-discussion-date">{d.date}</div>}
                  {d.link && (
                    <div className="radar-discussion-link-ref">
                      <span className="radar-link-type-badge" style={{ fontSize: '0.55rem' }}>
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

      {/* Freeform sections */}
      {sections.map(([key, content]) => (
        <div key={key} className="radar-detail-section" id={key}>
          <h2>{slugToLabel(key)}</h2>
          <div className="radar-section-body">
            <pre style={{
              whiteSpace: 'pre-wrap', background: 'transparent',
              border: 'none', padding: 0,
              fontFamily: 'inherit', fontSize: 'inherit',
            }}>{content}</pre>
          </div>
        </div>
      ))}

      {/* Key individuals */}
      {ki.length > 0 && (
        <div className="radar-detail-section" id="people">
          <h2>Key Individuals</h2>
          <div className="radar-people">
            {ki.map((p, i) => (
              <div key={i} className="radar-person-chip">
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

function slugToLabel(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
