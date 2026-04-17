import React from 'react';
import Link from '@docusaurus/Link';
import { linkTypeLabel } from './links';

export function LinkList({ config, links }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="radar-link-list">
      {links.map(l => (
        <Link key={l.uri} to={l.uri} className="radar-link-item">
          <span className="radar-link-type-badge">{linkTypeLabel(config, l.type)}</span>
          <div className="radar-link-body">
            <div className="radar-link-label">{l.label || l.uri}</div>
            {l.description && (
              <div className="radar-link-description">{l.description}</div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
