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

  // ━━━ Directory-mode: auto-detects tech-radar/ with no path option needed ━━━
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
          {
            to: '/radar',
            label: 'Tech Radar',
            position: 'left',
          },
          {
            label: '(docusaurus-plugin-tech-radar demo)',
            position: 'right',
            href: 'https://github.com/StephenFlavin/docusaurus-plugin-tech-radar',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/StephenFlavin/docusaurus-plugin-tech-radar',
              },
            ],
          },
        ],
        copyright: `Built with Docusaurus.`,
      },
    }),
};

module.exports = config;
