// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Acme Engineering',
  tagline: 'Developer Portal',
  favicon: 'img/favicon.ico',

  url: 'https://stephenflavin.github.io',
  baseUrl: '/docusaurus-plugin-tech-radar/',

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

  // ━━━ This is the only bit you need to add ━━━
  plugins: [
    ['../..', {
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
          // ━━━ And this navbar link ━━━
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
