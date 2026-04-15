# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

```
/                              ← plugin source (the production deliverable)
  src/
    index.js                   ← Docusaurus plugin entry (CJS)
    parser.js                  ← YAML → radar object (CJS)
    validator.js               ← validation rules (CJS)
    theme/                     ← React components (ESM)
      RadarLayout/
      RadarComponents/
      RadarOverview/
      RadarDiscipline/
      RadarEntry/
  tests/                       ← unit tests (Bun test runner)
  validate.js                  ← standalone CLI validator
  package.json

samples/
  uber-yaml/                   ← single-file YAML demo (tech-radar.yaml)
  dir-tree/                    ← directory-mode demo (tech-radar/)
```

## Commands

```bash
# Plugin (run from repo root)
bun install          # Install plugin dependencies
bun run test         # Run unit tests (parser + validator)

# Validate a sample directly
node validate.js samples/uber-yaml/tech-radar.yaml
node validate.js samples/dir-tree/tech-radar/

# Samples (run from the sample directory)
cd samples/uber-yaml && bun install && bun run build
cd samples/dir-tree  && bun install && bun run build

# Validate from within a sample (auto-detects tech-radar.yaml or tech-radar/)
cd samples/uber-yaml && bun run validate
cd samples/dir-tree  && bun run validate
```

Unit tests live in `tests/` and use Bun's built-in test runner. `validate.js` is the integration-level correctness check without running Docusaurus.

## Architecture

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
  routeBasePath: 'radar',      // injected by index.js from plugin options
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

- **`RadarLayout`** — three-column shell (sidebar | content | TOC). Wraps every page. Sidebar is built by `buildSidebar()` in `index.js` and passed as a prop. Sidebar items extracted to `Sidebar.js`.
- **`RadarComponents`** — shared logic and UI atoms. Barrel `index.js` re-exports from sub-modules: `rings.js`, `filters.js`, `FilterBar.js`, `RingStats.js`, `EntryCard.js`, `RadarViz.js`, `links.js`.
- **`RadarOverview`** — `/radar` page: all entries across all disciplines with filtering.
- **`RadarDiscipline`** — `/radar/:disc` page: SVG radar viz (`RadarViz`) + entry cards per quadrant.
- **`RadarEntry`** — `/radar/:disc/:entry` page: full detail view (rationale, timeline, overrides, links, discussions, freeform sections).

### Ring override system

Entries have an org-wide `ring`. Teams and verticals can override it via `ring-overrides`. The `effectiveRing(entry, teamFilter, verticalFilter)` function in `RadarComponents/rings.js` resolves which ring to display — team overrides take priority over vertical overrides. Overridden entries are displayed with a ◆ marker and a diamond shape in the SVG viz.

### Input modes

The plugin accepts either:
- **Single file** (`tech-radar.yaml`): top-level `radar:` key containing the full radar.
- **Directory** (`tech-radar/`): `_meta.yaml` at the directory root for meta/config (flat — `meta:` and `config:` as top-level keys, no `radar:` wrapper). Disciplines as subdirectories; each discipline and quadrant has a `_meta.yaml`; each entry is its own YAML file named `<entrySlug>.yaml`.

The mode is detected automatically by `parser.js` based on whether the path is a file or directory. The `path` plugin option is optional — if omitted, `index.js` auto-detects `tech-radar.yaml` then `tech-radar/` in `siteDir`.

### Validation

`validator.js` checks: valid rings (`adopt|trial|assess|hold`), all referenced teams/verticals/link-types exist in `config`, `hold` entries have `hold_reason`, ring override entries have valid rings. Errors abort the build; warnings print and continue.

The standalone `validate.js` script wraps the same parser + validator for CI use without running Docusaurus.

### CJS/ESM boundary

Plugin Node code (`src/index.js`, `src/parser.js`, `src/validator.js`) is CJS. Theme components (`src/theme/`) are ESM. The `ringOrder` utility and `slugToLabel` helper appear in both — this duplication is intentional due to the module boundary. Each copy has a comment noting this.

## Refactoring priorities

All items below have been resolved. Documented here for context on past decisions.

### 1. `routeBasePath` was not threaded to components — fixed

`EntryCard` hardcoded `/radar/${discSlug}/${slug}` and `RadarEntry` breadcrumbs hardcoded `/radar`. Fixed by injecting `routeBasePath` into `radar.json` at `contentLoaded` time. Components now read it from `radar.routeBasePath`.

### 2. `RadarComponents/index.js` was a god file — fixed

Split into `rings.js`, `filters.js`, `FilterBar.js`, `RingStats.js`, `EntryCard.js`, `RadarViz.js`, `links.js`. `index.js` is now a pure barrel re-export.

### 3. `ringOrder` and `slugToLabel` duplication — accepted

Intentional due to CJS/ESM boundary. Each copy is commented.

### 4. `useRadarFilters` recomputed usage counts on every render — fixed

Usage tallies are now wrapped in `React.useMemo` keyed on `allEntries`.

### 5. Inline styles moved to `radar.css` — fixed

`RadarEntry` and `RadarDiscipline` inline styles replaced with named CSS classes in `RadarLayout/radar.css`.

### 6. `entryData` needlessly duplicated config — fixed

`config` removed from per-entry and per-discipline JSON. Components read it from `radar.config`.

### 7. Array-index `key` props — fixed

`RadarEntry` links use `key={l.uri}`, discussions use `key={d.title}`, key individuals use `key={p.name}`.
