import React from 'react';
import Link from '@docusaurus/Link';

/**
 * Previous / next navigation at the bottom of a page.
 * Uses infima's `.pagination-nav` / `.pagination-nav__link` classes so it
 * inherits docs pagination styling (including hover + dark-mode).
 *
 * Props:
 *   previous, next: { label, href } | null
 */
export function Pagination({ previous, next }) {
  if (!previous && !next) return null;
  return (
    <nav className="pagination-nav radar-pagination" aria-label="Tech Radar pages">
      {previous ? (
        <Link to={previous.href} className="pagination-nav__link pagination-nav__link--prev">
          <div className="pagination-nav__sublabel">Previous</div>
          <div className="pagination-nav__label">« {previous.label}</div>
        </Link>
      ) : <div />}
      {next ? (
        <Link to={next.href} className="pagination-nav__link pagination-nav__link--next">
          <div className="pagination-nav__sublabel">Next</div>
          <div className="pagination-nav__label">{next.label} »</div>
        </Link>
      ) : <div />}
    </nav>
  );
}
