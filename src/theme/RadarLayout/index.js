import React from 'react';
import Layout from '@theme/Layout';
import { SidebarItems } from './Sidebar';

import './radar.css';

/**
 * Three-column shell: Left sidebar | Main content | Right TOC
 *
 * Props:
 *   sidebar     - array of sidebar items built by buildSidebar() in index.js
 *   toc         - array of { id, label, level } for the right-hand TOC
 *   title       - page <title>
 *   description - meta description
 *   children    - main content
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
