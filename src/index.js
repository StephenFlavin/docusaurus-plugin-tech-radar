const path = require('path');
const fs = require('fs');
const { normalizeUrl } = require('@docusaurus/utils');
const { Joi, RouteBasePathSchema } = require('@docusaurus/utils-validation');
const { parseRadar } = require('./parser');
const { validate } = require('./validator');

const PluginOptionSchema = Joi.object({
  path: Joi.string().optional(),
  routeBasePath: RouteBasePathSchema.default('radar'),
});

/** @type {import('@docusaurus/types').Plugin} */
function pluginTechRadar(context, options) {
  const { path: radarPath, routeBasePath } = options;

  const { baseUrl } = context.siteConfig;
  const resolvedPath = resolveRadarPath(context.siteDir, radarPath);

  // Build absolute route paths that include baseUrl. Docusaurus's Link component
  // prepends baseUrl to href props, so addRoute paths must include it too or
  // the broken-links checker reports mismatches. normalizeUrl handles the
  // trailing/leading slashes consistently with the rest of Docusaurus.
  const routePath = (...parts) => normalizeUrl([baseUrl, routeBasePath, ...parts]);

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

      // Write the full radar data as JSON — components import it.
      // routeBasePath is injected here so components can build links without hardcoding.
      const dataPath = await createData('radar.json', JSON.stringify({ ...radar, routeBasePath }));

      // Build sidebar items
      const sidebarItems = buildSidebar(radar, baseUrl, routeBasePath);
      const sidebarPath = await createData('sidebar.json', JSON.stringify(sidebarItems));

      // Overview route
      addRoute({
        path: routePath(),
        component: '@theme/RadarOverview',
        modules: { radar: dataPath, sidebar: sidebarPath },
        exact: true,
      });

      // Discipline and entry routes
      for (const [discSlug, disc] of Object.entries(radar.disciplines)) {
        // Discipline overview page
        const discData = await createData(
          `disc-${discSlug}.json`,
          JSON.stringify({ slug: discSlug, discipline: disc })
        );

        addRoute({
          path: routePath(discSlug),
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
              })
            );

            addRoute({
              path: routePath(discSlug, entrySlug),
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
}

module.exports = pluginTechRadar;
module.exports.validateOptions = function validateOptions({ validate, options }) {
  return validate(PluginOptionSchema, options);
};

/**
 * Resolve the radar input path.
 * If the user passed a `path` option, resolve it relative to siteDir.
 * Otherwise auto-detect: look for tech-radar.yaml then tech-radar/ in siteDir.
 */
function resolveRadarPath(siteDir, radarPath) {
  if (radarPath) {
    return path.resolve(siteDir, radarPath);
  }

  const candidates = [
    path.join(siteDir, 'tech-radar.yaml'),
    path.join(siteDir, 'tech-radar'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    '[docusaurus-plugin-tech-radar] Could not find tech-radar.yaml or tech-radar/ ' +
    `in ${siteDir}. Pass a path option to the plugin to specify the location explicitly.`
  );
}

/**
 * Build a sidebar structure mirroring Docusaurus's PropSidebarItem shape
 * ('link' | 'category' with { label, href, items }) so it feels familiar and
 * would be swizzle-compatible with a future @theme/DocSidebar adoption.
 * `ring` is a radar-specific extension used by Sidebar.js to render the ring dot.
 */
function buildSidebar(radar, baseUrl, routeBasePath) {
  const href = (...parts) => normalizeUrl([baseUrl, routeBasePath, ...parts]);
  const items = [{ type: 'link', label: 'Overview', href: href() }];

  for (const [discSlug, disc] of Object.entries(radar.disciplines)) {
    const discItem = {
      type: 'category',
      label: disc.meta.label,
      href: href(discSlug),
      collapsed: true,
      collapsible: true,
      items: [],
    };

    for (const [quadSlug, quad] of Object.entries(disc.quadrants || {})) {
      const quadItem = {
        type: 'category',
        label: quad.meta.label,
        collapsed: true,
        collapsible: true,
        items: [],
      };

      const entries = Object.entries(quad.entries || {})
        .sort((a, b) => ringOrder(a[1].ring) - ringOrder(b[1].ring));

      for (const [entrySlug, entry] of entries) {
        quadItem.items.push({
          type: 'link',
          label: entry.label,
          href: href(discSlug, entrySlug),
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
