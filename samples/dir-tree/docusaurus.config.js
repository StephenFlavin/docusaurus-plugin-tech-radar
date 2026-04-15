// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Acme Engineering',
  tagline: 'Developer Portal',
  favicon: 'img/favicon.ico',

  url: 'https://engineering.acme.internal',
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  // ━━━ Directory-mode: point path at a folder instead of a single file ━━━
  plugins: [
    ['../..', {
      path: 'radar/',
      routeBasePath: 'radar',
    }],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Acme Engineering',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            to: '/radar',
            label: 'Tech Radar',
            position: 'left',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Built with Docusaurus.`,
      },
    }),
};

module.exports = config;
