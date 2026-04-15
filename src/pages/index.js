import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home() {
  return (
    <Layout title="Home" description="Acme Engineering Developer Portal">
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '2.5rem' }}>Acme Engineering</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--ifm-font-color-secondary)', maxWidth: 600 }}>
          Internal developer portal. Standards, guides, and our technology radar.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Docs
          </Link>
          <Link className="button button--secondary button--lg" to="/radar">
            Tech Radar →
          </Link>
        </div>
      </main>
    </Layout>
  );
}
