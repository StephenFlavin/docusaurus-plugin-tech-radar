import React from 'react';
import Layout from '@theme/Layout';
import TOC from '@theme/TOC';
import TOCCollapsible from '@theme/TOCCollapsible';
import { SidebarItems } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { Pagination } from './Pagination';

import './radar.css';

/**
 * Three-column shell: Left sidebar | Main content | Right TOC
 *
 * Props:
 *   sidebar     - array of sidebar items built by buildSidebar() in index.js
 *   toc         - array of { id, value, level } — the shape @theme/TOC expects
 *                 (value is the display label). Each heading in a page must
 *                 render an element with a matching id attribute.
 *   breadcrumbs - Array<{ label, href? }> passed to <Breadcrumbs>. Rendered
 *                 at the top of the main column. Last item is the active page.
 *   pagination  - { previous?, next? } for a Previous/Next nav rendered at the
 *                 bottom of the main column, matching docs pagination styling.
 *   title       - page <title>
 *   description - meta description
 *   children    - main content
 *
 * We reuse Docusaurus's @theme/TOC / @theme/TOCCollapsible so the right-column
 * TOC (and the mobile "On this page" collapsible) get scroll-based active-link
 * highlighting for free and match the docs TOC styling (themable via
 * --ifm-toc-* CSS variables).
 */
export default function RadarLayout({
  sidebar, toc, breadcrumbs, pagination,
  title, description, children,
}) {
  const hasToc = toc && toc.length > 0;
  return (
    <Layout title={title} description={description}>
      <div className="radar-page">
        <aside className="radar-sidebar">
          <nav className="radar-sidebar-nav">
            <SidebarItems items={sidebar} />
          </nav>
        </aside>

        <main className="radar-main">
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
          {hasToc && (
            <TOCCollapsible
              className="radar-toc-mobile"
              toc={toc}
              minHeadingLevel={2}
              maxHeadingLevel={3}
            />
          )}
          {children}
          {pagination && <Pagination {...pagination} />}
        </main>

        {hasToc && (
          <div className="radar-toc">
            <TOC toc={toc} minHeadingLevel={2} maxHeadingLevel={3} />
          </div>
        )}
      </div>
    </Layout>
  );
}
