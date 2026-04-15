# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # Install dependencies
bun start            # Dev server with hot-reload (watches YAML changes too)
bun run build        # Production static build → build/
bun run validate     # Validate radar.yaml without a full build (reads path from docusaurus.config.js)
bun run clear        # Clear Docusaurus cache

# Validate a specific file or directory directly
node plugins/docusaurus-plugin-tech-radar/validate.js radar.yaml
node plugins/docusaurus-plugin-tech-radar/validate.js radar/
```

There is no test suite yet. `bun run validate` is the main correctness check.

## Architecture

The repo has two distinct parts:

- **Root Docusaurus site** (`docusaurus.config.js`, `src/`, `docs/`, `radar.yaml`) — exists purely to test the plugin locally. Not production code.
- **Plugin** (`plugins/docusaurus-plugin-tech-radar/`) — the production deliverable. This is where all real work happens.

### Plugin data flow

```
radar.yaml (or radar/ dir)
  → parser.js        parses YAML into a radar object
  → validator.js     validates and returns { severity, path, message }[]
  → index.js         Docusaurus plugin: loadContent + contentLoaded
                     - writes radar.json, sidebar.json, per-discipline JSON via createData
                     - registers routes: /radar, /radar/:disc, /radar/:disc/:entry
  → theme/           React components that receive those JSON modules as props
```

### Internal data model

The parsed radar object shape (what all components receive):

```js
{
  meta: { title, version, date, cadence, changelog: [] },
  config: {
    'link-types': { [key]: { label, icon-url, uri-pattern? } },
    teams: { [key]: { label, description } },
    verticals: { [key]: { label, description } },
  },
  disciplines: {
    [discSlug]: {
      meta: { label, description, tags?, links?, 'key-individuals'? },
      quadrants: {
        [quadSlug]: {
          meta: { label, description?, guidance?, links? },
          entries: {
            [entrySlug]: {
              label, ring, description?, rationale?,
              timeline: { [ring]: 'YYYY-Qn' },
              teams: [], verticals: [], tags: [],
              links: [{ type, uri, label? }],
              discussions: [{ type, title, date?, link? }],
              'ring-overrides': {
                teams: { [teamKey]: { ring, reason } },
                verticals: { [vertKey]: { ring, reason } },
              },
              constraints: {}, sections: {},
              'key-individuals': [{ name, role }],
              hold_reason?, sunset_date?, migration_target?,
              licence?, compliance?: { frameworks: [], notes? },
            }
          }
        }
      }
    }
  }
}
```

### Theme components

All live under `src/theme/` and are registered via `getThemePath()` in `index.js`. Docusaurus resolves `@theme/RadarXxx` imports from there.

- **`RadarLayout`** — three-column shell (sidebar | content | TOC). Wraps every page. Sidebar is built by `buildSidebar()` in `index.js` and passed as a prop.
- **`RadarComponents`** — shared logic and UI atoms. Exports: `useRadarFilters`, `FilterBar`, `RingStats`, `RadarViz`, `EntryCard`, `effectiveRing`, `ringOrder`, `linkTypeLabel`.
- **`RadarOverview`** — `/radar` page: all entries across all disciplines with filtering.
- **`RadarDiscipline`** — `/radar/:disc` page: SVG radar viz (`RadarViz`) + entry cards per quadrant.
- **`RadarEntry`** — `/radar/:disc/:entry` page: full detail view (rationale, timeline, overrides, links, discussions, freeform sections).

### Ring override system

Entries have an org-wide `ring`. Teams and verticals can override it via `ring-overrides`. The `effectiveRing(entry, teamFilter, verticalFilter)` function in `RadarComponents` resolves which ring to display — team overrides take priority over vertical overrides. Overridden entries are displayed with a ◆ marker and a diamond shape in the SVG viz.

### Input modes

The plugin accepts either:
- **Single file** (`radar.yaml`): top-level `radar:` key containing the full radar.
- **Directory** (`radar/`): `radar.yaml` at the root for meta/config, disciplines as subdirectories. Each discipline and quadrant has a `_meta.yaml`; each entry is its own YAML file named `<entrySlug>.yaml`.

The mode is detected automatically by `parser.js` based on whether the path is a file or directory.

### Validation

`validator.js` checks: valid rings (`adopt|trial|assess|hold`), all referenced teams/verticals/link-types exist in `config`, `hold` entries have `hold_reason`, ring override entries have valid rings. Errors abort the build; warnings print and continue.

The standalone `validate.js` script at the plugin root wraps the same parser + validator for CI use without running Docusaurus.
