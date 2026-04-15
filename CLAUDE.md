# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # Install dependencies
bun start            # Dev server with hot-reload (watches YAML changes too)
bun run build        # Production static build → build/
bun run test         # Run unit tests (parser + validator)
bun run validate     # Validate radar.yaml without a full build (reads path from docusaurus.config.js)
bun run clear        # Clear Docusaurus cache

# Validate a specific file or directory directly
node plugins/docusaurus-plugin-tech-radar/validate.js radar.yaml
node plugins/docusaurus-plugin-tech-radar/validate.js radar/
```

Unit tests live in `plugins/docusaurus-plugin-tech-radar/tests/` and use Bun's built-in test runner. `bun run validate` is the integration-level correctness check against the actual `radar.yaml`.

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

## Refactoring priorities

These are the known structural issues to address before this plugin is production-ready, ordered by impact.

### 1. `routeBasePath` is not threaded to components — actual bug

`EntryCard` (`RadarComponents/index.js:328`) hardcodes `/radar/${discSlug}/${slug}` and `RadarEntry` breadcrumbs (`RadarEntry/index.js:40,42`) hardcode `/radar`. Any user who sets `routeBasePath: 'tech-radar'` gets silently broken navigation.

Fix: include `routeBasePath` in the JSON written by `contentLoaded` — either add it to `radar.json` alongside `meta`/`config`/`disciplines`, or add it to each `entryData` and `discData` blob. Components then use it to construct paths instead of the hardcoded string.

### 2. `RadarComponents/index.js` is a god file

At 376 lines it combines ring constants, pure utility functions, a custom hook, and four distinct UI components that have nothing in common beyond being exports. None share a test strategy or change frequency. Split within the directory (keeping the barrel export intact so `@theme/RadarComponents` imports continue to work):

```
RadarComponents/
  index.js      ← re-exports everything, no logic
  rings.js      ← RING_ORDER/COLORS/FILLS constants, ringOrder(), effectiveRing()
  filters.js    ← entryMatchesFilters() (unexported), useRadarFilters()
  FilterBar.js
  RingStats.js
  EntryCard.js
  RadarViz.js   ← seededRandom() lives here too
```

### 3. `ringOrder` and `slugToLabel` are each duplicated

`ringOrder` is defined identically in `src/index.js:164` (CJS) and `RadarComponents/index.js:13` (ESM). `slugToLabel` is defined identically in `src/parser.js:122` (unexported, CJS) and `RadarEntry/index.js:287` (private, ESM).

The CJS/ESM boundary makes sharing a single module file awkward. The pragmatic fix is to extract `src/utils/rings.js` (CJS) containing `ringOrder` — `index.js` requires it, and `RadarComponents/rings.js` can inline its own copy with a comment noting the intentional duplication. Same pattern for `slugToLabel`. Alternatively, consolidate to a single runtime once the plugin is packaged properly.

### 4. `useRadarFilters` recomputes usage counts on every render

The `teamUsage`/`tagUsage`/`verticalUsage` tallies in `RadarComponents/index.js:69–74` run on every render. With a large radar this is O(entries × tags). Wrap them in `React.useMemo` keyed on `allEntries`.

### 5. Inline styles should move to `radar.css`

`RadarEntry/index.js` has ~15 `style={{...}}` blocks and `RadarDiscipline/index.js` has 3. These make components noisy and make theming via CSS variables impossible for those properties. Move them to named classes in `RadarLayout/radar.css`.

### 6. `entryData` needlessly duplicates config

`index.js:82` embeds `config: radar.config` into every entry's JSON file. With many entries and a large config this multiplies the data. `config` is already available on the `radar` prop (which is passed to every route). Remove `config` from `entryData` and read it from `radar.config` in `RadarEntry`.

### 7. Array-index `key` props

`RadarEntry/index.js` uses `key={i}` for links (line 218), discussions (line 234), and key individuals (line 275). Use a stable property instead: `key={l.uri}`, `key={d.title}`, `key={p.name}`.
