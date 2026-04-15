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
    fixtures/                  ← sample YAML/dirs consumed by the tests
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

# Validate from within a sample (auto-detects tech-radar.yaml or tech-radar/,
# or reads the plugin's `path` option from docusaurus.config.js)
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

`index.js` also implements `getPathsToWatch()` so `docusaurus start` re-parses on
YAML edits (the whole dir tree in directory mode, or the single file in file mode).

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

- **`RadarLayout`** — three-column shell (sidebar | content | TOC). Wraps every page. Sidebar is built by `buildSidebar()` in `index.js` and passed as a prop. Sidebar items extracted to `Sidebar.js`. All radar styling lives in `radar.css` alongside the layout.
- **`RadarComponents`** — shared logic and UI atoms. Barrel `index.js` re-exports from sub-modules: `rings.js`, `filters.js`, `FilterBar.js`, `RingStats.js`, `EntryCard.js`, `RadarViz.js`, `links.js`.
- **`RadarOverview`** — `/radar` page: all entries across all disciplines with filtering.
- **`RadarDiscipline`** — `/radar/:disc` page: SVG radar viz (`RadarViz`) + entry cards per quadrant.
- **`RadarEntry`** — `/radar/:disc/:entry` page: full detail view (rationale, timeline, overrides, links, discussions, freeform sections).

### Ring override system

Entries have an org-wide `ring`. Teams and verticals can override it via `ring-overrides`. The `effectiveRing(entry, teamFilter, verticalFilter)` function in `RadarComponents/rings.js` resolves which ring to display — team overrides take priority over vertical overrides. Overridden entries are displayed with a ◆ marker and a diamond shape in the SVG viz.

### Input modes

The plugin accepts either:

- **Single file** (`tech-radar.yaml`): top-level `radar:` key containing the full radar.
- **Directory** (`tech-radar/`) with the layout below. `_meta.yaml` at the directory root holds radar-wide meta/config (flat — `meta:` and `config:` as top-level keys, no `radar:` wrapper). All disciplines live under a `disciplines/` subdirectory; each discipline and quadrant has its own `_meta.yaml`; each entry is its own YAML file named `<entrySlug>.yaml`:

  ```
  tech-radar/
  ├── _meta.yaml                  # { meta: {...}, config: {...} }
  └── disciplines/
      └── <discipline-slug>/
          ├── _meta.yaml          # discipline meta fields
          └── <quadrant-slug>/
              ├── _meta.yaml      # quadrant meta fields
              └── <entry-slug>.yaml
  ```

The mode is detected automatically by `parser.js` based on whether the path is a file or directory. The `path` plugin option is optional — if omitted, `index.js` auto-detects `tech-radar.yaml` then `tech-radar/` in `siteDir`. When a discipline or quadrant `_meta.yaml` is missing, the label falls back to a title-cased version of the slug via `slugToLabel()`.

### Validation

`validator.js` checks: valid rings (`adopt|trial|assess|hold`), all referenced teams/verticals/link-types exist in `config`, `hold` entries have `hold_reason`, ring override entries have valid rings and (as a warning) a `reason`. Errors abort the build; warnings print and continue.

The standalone `validate.js` script wraps the same parser + validator for CI use without running Docusaurus. It also reads `path` from a local `docusaurus.config.js` plugin entry when no argument is given.

### CJS/ESM boundary

Plugin Node code (`src/index.js`, `src/parser.js`, `src/validator.js`) is CJS. Theme components (`src/theme/`) are ESM. The `ringOrder` utility and `slugToLabel` helper appear in both — this duplication is intentional due to the module boundary. Each copy has a comment noting this.

## Code conventions

- **Helpers over inline logic.** When a small transformation is needed in more than one place (e.g. looking up a link-type label), put it in a helper in `RadarComponents/*` and import it. New code should prefer `linkTypeLabel(config, type)` over re-implementing `config['link-types']?.[type]?.label || type` inline.
- **Stable React `key`s.** Prefer a domain-stable field (`entry.slug`, `link.uri`, `person.name`). Avoid array indices unless the list is genuinely positional and immutable.
- **Memoise derived collections in hooks** (see `useRadarFilters` — usage tallies are `useMemo`'d on `allEntries`). Don't recompute per render.
- **Styling lives in `radar.css`.** Components apply class names; no inline `style` objects for anything structural.
- **`routeBasePath` flows through data, not constants.** Components read `radar.routeBasePath` — never hardcode `/radar`.

## Testing

Unit tests (`tests/parser.test.js`, `tests/validator.test.js`) cover:

- **Parser**: single-file parsing, directory parsing, both happy paths and missing-`radar:`-key / missing-root-`_meta.yaml` failures; meta-label fallback to `slugToLabel()` when a discipline or quadrant has no `_meta.yaml`; mixed `.yaml` / `.yml` entry files; entries prefixed with `_` are skipped.
- **Validator**: ring, team, vertical, link-type, hold-reason, timeline, and team/vertical ring-override rules, plus structural edge cases (no disciplines, discipline without quadrants, quadrant without entries, radar with no `config`) and multi-entry / multi-timeline error accumulation. Error-path shape (`disc.quad.entry[.field]`) is asserted to keep it stable for tooling.

Fixtures live in `tests/fixtures/`:

- `valid-single.yaml`, `no-radar-key.yaml` — single-file mode cases.
- `valid-dir/` — happy-path directory mode with all `_meta.yaml` files present.
- `dir-no-root-yaml/` — missing-root-meta failure case.
- `dir-meta-fallbacks/` — discipline and quadrant without `_meta.yaml`, plus a `.yml` entry and a `_`-prefixed entry that must be skipped.

What is **not** unit-tested and intentionally left to the sample sites (`samples/uber-yaml`, `samples/dir-tree`):

- Theme components (no DOM harness configured).
- `src/index.js` Docusaurus plugin wiring (route registration, `createData`, `getPathsToWatch`).
- `validate.js` CLI behaviour (argv handling, `docusaurus.config.js` discovery).

Running the two sample `bun run build`s and `bun run validate`s is the integration gate for those.

## Follow-ups

None open — previous items have been addressed. Add new entries here when
review surfaces fresh cleanliness nits.

## Resolved refactors (history)

Documented for context on past decisions — all fixed in the current tree.

1. **`routeBasePath` was not threaded to components.** Now injected into `radar.json` at `contentLoaded` time; components read `radar.routeBasePath`.
2. **`RadarComponents/index.js` was a god file.** Split into `rings.js`, `filters.js`, `FilterBar.js`, `RingStats.js`, `EntryCard.js`, `RadarViz.js`, `links.js`; the barrel is a pure re-export.
3. **`ringOrder` / `slugToLabel` duplication across the CJS/ESM boundary** is intentional and commented in both copies.
4. **`useRadarFilters` recomputed usage counts every render.** Wrapped in `React.useMemo` keyed on `allEntries`.
5. **Inline styles moved to `radar.css`.**
6. **`entryData` duplicated `config`.** Removed; components read it from `radar.config`.
7. **Array-index `key` props.** Replaced with stable domain keys everywhere, including `RadarDiscipline`'s quadrant-links list.
8. **Inline link-type lookup.** Every callsite now uses the shared `linkTypeLabel(config, type)` helper from `RadarComponents/links.js`.
9. **Silent `catch {}` in `validate.js`.** Now narrowed to `ENOENT` / `MODULE_NOT_FOUND`; real config errors surface as a warning rather than being swallowed.
10. **Placeholder parser tests.** Replaced with fixtures that actually exercise the `slugToLabel()` fallback, mixed `.yaml`/`.yml` entry extensions, and `_`-prefixed entry exclusion.
