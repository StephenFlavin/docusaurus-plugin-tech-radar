import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';

import './radar.css';

/**
 * Three-column layout matching the Docusaurus docs layout:
 *   Left sidebar  |  Main content  |  Right TOC
 *
 * Props:
 *   - sidebar: array of sidebar items
 *   - toc: array of { id, label, level } for the right TOC
 *   - title: page title
 *   - children: main content
 */
export default function RadarLayout({ sidebar, toc, title, description, children }) {
  return (
    <Layout title={title} description={description}>
      <div className="radar-page">
        <aside className="radar-sidebar">
          <nav className="radar-sidebar-nav">
            <SidebarItems items={sidebar} />
          </nav>
        </aside>

        <main className="radar-main">
          {children}
        </main>

        {toc && toc.length > 0 && (
          <div className="radar-toc">
            <div className="radar-toc-inner">
              <h4 className="radar-toc-title">On this page</h4>
              <ul className="radar-toc-list">
                {toc.map(item => (
                  <li key={item.id} className={`radar-toc-item radar-toc-level-${item.level}`}>
                    <a href={`#${item.id}`} className="radar-toc-link">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/** Recursive sidebar renderer */
function SidebarItems({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <ul className="radar-sidebar-list">
      {items.map((item, i) => (
        <SidebarItem key={i} item={item} />
      ))}
    </ul>
  );
}

function SidebarItem({ item }) {
  const location = useLocation();
  const isActive = item.href && location.pathname === item.href;

  if (item.type === 'link') {
    return (
      <li className="radar-sidebar-item">
        <Link
          to={item.href}
          className={`radar-sidebar-link ${isActive ? 'radar-sidebar-link--active' : ''}`}
        >
          {item.label}
          {item.ring && <RingDot ring={item.ring} />}
        </Link>
      </li>
    );
  }

  if (item.type === 'category') {
    return <SidebarCategory item={item} />;
  }

  return null;
}

function SidebarCategory({ item }) {
  const location = useLocation();

  // Expand if this category or any child is active
  const isChildActive = hasActiveChild(item, location.pathname);
  const [open, setOpen] = useState(isChildActive || !item.collapsed);

  return (
    <li className="radar-sidebar-item">
      <div className="radar-sidebar-category-header">
        {item.href ? (
          <Link
            to={item.href}
            className={`radar-sidebar-link radar-sidebar-category-label ${
              location.pathname === item.href ? 'radar-sidebar-link--active' : ''
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <span className="radar-sidebar-link radar-sidebar-category-label">
            {item.label}
          </span>
        )}
        <button
          className={`radar-sidebar-toggle ${open ? 'radar-sidebar-toggle--open' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M4.5 3L7.5 6L4.5 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      {open && <SidebarItems items={item.items} />}
    </li>
  );
}

function hasActiveChild(item, pathname) {
  if (item.href === pathname) return true;
  if (item.items) {
    return item.items.some(child => hasActiveChild(child, pathname));
  }
  return false;
}

function RingDot({ ring }) {
  return <span className={`radar-ring-dot radar-ring-dot--${ring}`} />;
}
