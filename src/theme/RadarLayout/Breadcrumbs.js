import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

/**
 * Breadcrumbs styled to match Docusaurus docs — uses infima's
 * `.breadcrumbs` / `.breadcrumbs__item` / `.breadcrumbs__link` classes
 * which are available globally via the classic theme's CSS.
 *
 * Props:
 *   items: Array<{ label: string, href?: string }>
 *          Last item is rendered as the active (current) page.
 */
export function Breadcrumbs({ items }) {
  const homeHref = useBaseUrl('/');
  if (!items || items.length === 0) return null;

  return (
    <nav className="radar-breadcrumbs" aria-label="Breadcrumbs">
      <ul className="breadcrumbs" itemScope itemType="https://schema.org/BreadcrumbList">
        <li className="breadcrumbs__item">
          <Link className="breadcrumbs__link" href={homeHref} aria-label="Home page">
            <HomeIcon />
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const liClass = `breadcrumbs__item${isLast ? ' breadcrumbs__item--active' : ''}`;
          const content =
            isLast || !item.href ? (
              <span className="breadcrumbs__link" itemProp="name">{item.label}</span>
            ) : (
              <Link className="breadcrumbs__link" href={item.href} itemProp="item">
                <span itemProp="name">{item.label}</span>
              </Link>
            );
          return (
            <li
              key={`${item.label}-${i}`}
              className={liClass}
              {...(item.href && !isLast && {
                itemScope: true,
                itemProp: 'itemListElement',
                itemType: 'https://schema.org/ListItem',
              })}
            >
              {content}
              <meta itemProp="position" content={String(i + 1)} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="radar-breadcrumb-home-icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"
      />
    </svg>
  );
}
