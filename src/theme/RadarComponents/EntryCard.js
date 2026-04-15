import React from 'react';
import Link from '@docusaurus/Link';
import { effectiveRing } from './rings';

export function EntryCard({ entry, slug, discSlug, routeBasePath, subtitle, config, teamFilter, verticalFilter }) {
  const { ring: effRing, override } = effectiveRing(entry, teamFilter, verticalFilter);
  const teams = (entry.teams || []).slice(0, 3).map(t => config?.teams?.[t]?.label || t);
  const extra = Math.max(0, (entry.teams || []).length - 3);
  const linkCount = (entry.links || []).length;
  const discCount = (entry.discussions || []).length;

  return (
    <Link
      to={`/${routeBasePath}/${discSlug}/${slug}`}
      className={`radar-entry-card radar-entry-card--${effRing}`}
    >
      <div className="radar-entry-card-header">
        <span className="radar-entry-card-title">{entry.label}</span>
        <span className="radar-entry-card-ring">
          <span className={`radar-ring-badge radar-ring-badge--${effRing}`}>
            {override && '◆ '}{effRing}
          </span>
          {override && <span className="radar-ring-original">was {entry.ring}</span>}
        </span>
      </div>

      {entry.description && (
        <div className="radar-entry-card-desc">{entry.description}</div>
      )}
      {override && (
        <div className="radar-entry-card-override">{override.reason}</div>
      )}
      {subtitle && (
        <div className="radar-entry-card-subtitle">{subtitle}</div>
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
