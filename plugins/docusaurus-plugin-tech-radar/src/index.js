const path = require('path');
const fs = require('fs');
const { parseRadar } = require('./parser');
const { validate } = require('./validator');

/** @type {import('@docusaurus/types').Plugin} */
module.exports = function pluginTechRadar(context, options) {
  const {
    path: radarPath = 'radar.yaml',
    routeBasePath = 'radar',
  } = options;

  const resolvedPath = path.resolve(context.siteDir, radarPath);

  return {
    name: 'docusaurus-plugin-tech-radar',

    // Re-parse when YAML changes during `docusaurus start`
    getPathsToWatch() {
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        return [`${resolvedPath}/**/*.{yaml,yml}`];
      }
      return [resolvedPath];
    },

    async loadContent() {
      const radar = parseRadar(resolvedPath);
      const errors = validate(radar);

      const realErrors = errors.filter(e => e.severity === 'error');
      if (realErrors.length > 0) {
        const msg = realErrors.map(e => `  ${e.path}: ${e.message}`).join('\n');
        throw new Error(`Tech Radar validation failed:\n${msg}`);
      }

      if (errors.length > 0) {
        errors.forEach(e => {
          console.warn(`[tech-radar] WARN ${e.path}: ${e.message}`);
        });
      }

      return radar;
    },

    async contentLoaded({ content: radar, actions }) {
      const { createData, addRoute } = actions;

      // Write the full radar data as JSON — components import it
      const dataPath = await createData('radar.json', JSON.stringify(radar));

      // Build sidebar items
      const sidebarItems = buildSidebar(radar, routeBasePath);
      const sidebarPath = await createData('sidebar.json', JSON.stringify(sidebarItems));

      // Overview route
      addRoute({
        path: `/${routeBasePath}`,
        component: '@theme/RadarOverview',
        modules: { radar: dataPath, sidebar: sidebarPath },
        exact: true,
      });

      // Discipline and entry routes
      for (const [discSlug, disc] of Object.entries(radar.disciplines)) {
        // Discipline overview page
        const discData = await createData(
          `disc-${discSlug}.json`,
          JSON.stringify({ slug: discSlug, discipline: disc, config: radar.config })
        );

        addRoute({
          path: `/${routeBasePath}/${discSlug}`,
          component: '@theme/RadarDiscipline',
          modules: { radar: dataPath, discData: discData, sidebar: sidebarPath },
          exact: true,
        });

        // Entry pages
        for (const [quadSlug, quad] of Object.entries(disc.quadrants || {})) {
          for (const [entrySlug, entry] of Object.entries(quad.entries || {})) {
            const entryData = await createData(
              `entry-${discSlug}-${entrySlug}.json`,
              JSON.stringify({
                slug: entrySlug,
                entry,
                discSlug,
                discLabel: disc.meta.label,
                quadSlug,
                quadLabel: quad.meta.label,
                config: radar.config,
              })
            );

            addRoute({
              path: `/${routeBasePath}/${discSlug}/${entrySlug}`,
              component: '@theme/RadarEntry',
              modules: { radar: dataPath, entryData: entryData, sidebar: sidebarPath },
              exact: true,
            });
          }
        }
      }
    },

    getThemePath() {
      return path.resolve(__dirname, './theme');
    },
  };
};

/**
 * Build a sidebar structure that Docusaurus components can render.
 * Matches the shape our RadarLayout expects.
 */
function buildSidebar(radar, basePath) {
  const items = [];

  // Overview
  items.push({
    type: 'link',
    label: 'Overview',
    href: `/${basePath}`,
  });

  // Disciplines
  for (const [discSlug, disc] of Object.entries(radar.disciplines)) {
    const discItem = {
      type: 'category',
      label: disc.meta.label,
      href: `/${basePath}/${discSlug}`,
      collapsed: true,
      items: [],
    };

    for (const [quadSlug, quad] of Object.entries(disc.quadrants || {})) {
      const quadItem = {
        type: 'category',
        label: quad.meta.label,
        collapsed: true,
        items: [],
      };

      const entries = Object.entries(quad.entries || {})
        .sort((a, b) => ringOrder(a[1].ring) - ringOrder(b[1].ring));

      for (const [entrySlug, entry] of entries) {
        quadItem.items.push({
          type: 'link',
          label: entry.label,
          href: `/${basePath}/${discSlug}/${entrySlug}`,
          ring: entry.ring,
        });
      }

      discItem.items.push(quadItem);
    }

    items.push(discItem);
  }

  return items;
}

function ringOrder(ring) {
  return { adopt: 0, trial: 1, assess: 2, hold: 3 }[ring] ?? 4;
}
