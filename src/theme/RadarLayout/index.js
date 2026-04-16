import React from 'react';
import Layout from '@theme/Layout';
import TOC from '@theme/TOC';
import { SidebarItems } from './Sidebar';

import './radar.css';

/**
 * Three-column shell: Left sidebar | Main content | Right TOC
 *
 * Props:
 *   sidebar     - array of sidebar items built by buildSidebar() in index.js
 *   toc         - array of { id, value, level } — the shape @theme/TOC expects
 *                 (value is the display label). Each heading in a page must
 *                 render an element with a matching id attribute.
 *   title       - page <title>
 *   description - meta description
 *   children    - main content
 *
 * We reuse Docusaurus's @theme/TOC so the right-column TOC gets scroll-based
 * active-link highlighting for free and matches the docs TOC styling that
 * users theme via --ifm-toc-* CSS variables.
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
            <TOC toc={toc} minHeadingLevel={2} maxHeadingLevel={3} />
          </div>
        )}
      </div>
    </Layout>
  );
}
