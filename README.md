# docusaurus-plugin-tech-radar

A Docusaurus plugin that renders a Technology Radar from YAML definitions. Supports a multi-discipline radar with segments, ring overrides per team or vertical, timeline tracking, compliance metadata, and full-text search.

**[Live demo](https://stephenflavin.github.io/docusaurus-plugin-tech-radar/)**

## Features

- **Overview page** — all entries across every discipline with ring stats, filters (ring, team, tag, search), and a changelog
- **Discipline page** — SVG radar visualisation + entry cards per segment
- **Entry page** — full detail view: rationale, timeline, ring overrides, constraints, links, discussions, and freeform sections
- **Ring overrides** — teams or verticals can hold a different ring than the org-wide default; displayed with a ◆ marker
- **Two input modes** — single `tech-radar.yaml` file or a `tech-radar/` directory tree (one file per entry)
- **Auto-detection** — no `path` option needed; the plugin looks for `tech-radar.yaml` then `tech-radar/` in your site root
- **Build-time validation** — invalid rings, missing hold reasons, unknown team/vertical references all abort the build with a clear error
- **Docusaurus theme integration** — uses `--ifm-*` CSS variables so it inherits your site's colour scheme

---

## Quick start

```bash
npm install docusaurus-plugin-tech-radar
```

Add the plugin to your Docusaurus config:

```js
// docusaurus.config.js
plugins: [
  ['docusaurus-plugin-tech-radar', {
    routeBasePath: 'radar',
  }],
],
```

Add a navbar link:

```js
themeConfig: {
  navbar: {
    items: [
      { to: '/radar', label: 'Tech Radar', position: 'left' },
    ],
  },
},
```

Drop a `tech-radar.yaml` in your site root and build — the plugin auto-detects it.

---

## YAML schema

The full YAML schema is documented in [`schema.yaml`](schema.yaml) with inline comments explaining every field, its type, whether it is required/optional, allowed values, and validation rules. Use it as both a reference and a starting template.

Below is a condensed overview. See `schema.yaml` for the complete picture.

### Single-file mode

Name your file `tech-radar.yaml` at the Docusaurus site root. The file must have a top-level `radar:` key:

```yaml
radar:
  meta:
    title: Acme Engineering Technology Radar
    version: 4
    date: 2026-04-13
    cadence: quarterly                       # optional
    changelog:                               # optional
      - version: 4
        date: 2026-04-13
        summary: Added data discipline.

  config:
    link-types:
      url:
        label: Website
      slack:
        label: Slack
        uri-pattern: "^https://acme\\.slack\\.com/.+"  # optional validation regex

    teams:
      platform:
        label: Platform Engineering
        description: Developer tooling, CI/CD, infrastructure.

    verticals:
      digital-commerce:
        label: Digital Commerce

  disciplines:
    backend:
      meta:
        label: Backend Engineering
        description: Server-side languages and frameworks.
      segments:
        languages:
          meta:
            label: Languages & Frameworks
          entries:
            java:
              label: Java
              ring: adopt                    # adopt | trial | assess | hold
              teams: [platform]
              # ...see schema.yaml for all entry fields
```

### Directory mode

Split the radar across individual files — useful for large radars or per-entry pull requests:

```
tech-radar/
├── _meta.yaml                        # meta + config (no radar: wrapper)
└── disciplines/
    └── backend/
        ├── _meta.yaml                # discipline meta
        └── languages-and-frameworks/
            ├── _meta.yaml            # segment meta
            ├── java.yaml             # entry fields directly
            └── kotlin.yaml
```

### Hold entries

Entries with `ring: hold` must include `hold_reason`:

```yaml
dynamodb:
  label: DynamoDB
  ring: hold
  hold_reason: Cost unpredictability and hot partition issues.
  sunset_date: 2027-03-31            # optional
  migration_target: postgresql        # optional
```

---

## Ring system

Four rings, in order of maturity:

| Ring | Meaning |
|------|---------|
| `adopt` | Proven, recommended for all new work |
| `trial` | Worth pursuing — active pilot in progress |
| `assess` | Worth exploring — spike or proof-of-concept |
| `hold` | Pause new investment; migrate existing usage |

### Ring overrides

An entry has one org-wide `ring`. Teams and verticals can override it independently:

```yaml
ring-overrides:
  teams:
    payments:
      ring: hold
      reason: Payments is migrating away from this technology.
  verticals:
    retail-operations:
      ring: assess
      reason: Evaluating a lighter-weight alternative for in-store systems.
```

Overridden entries show a ◆ marker in both the SVG viz and entry cards. Team overrides take priority over vertical overrides when both filters are active simultaneously.

---

## Plugin options

```js
// docusaurus.config.js
plugins: [
  ['docusaurus-plugin-tech-radar', {
    // path: 'tech-radar.yaml',  // optional — auto-detected if omitted
    routeBasePath: 'radar',      // URL prefix — default: 'radar'
  }],
],
```

The plugin auto-detects `tech-radar.yaml` (single-file mode) or `tech-radar/` (directory mode) in your site root. Pass `path` explicitly only if you use a non-standard name or location.

---

## Validation

The plugin validates your YAML at build time and provides a standalone CLI:

```bash
# Validate without building (auto-detects tech-radar.yaml or tech-radar/)
node validate.js

# Validate an explicit path
node validate.js tech-radar.yaml
node validate.js tech-radar/

# From a sample directory
npm run validate
```

Errors abort the build. Warnings (e.g. missing ring-override `reason`) print and continue.

---

## Pages created by the plugin

| URL | Page |
|-----|------|
| `/radar` | Overview — ring stats, all entries, changelog |
| `/radar/:discipline` | Discipline — SVG radar + entry cards per segment |
| `/radar/:discipline/:entry` | Entry — full detail (rationale, timeline, overrides, links) |

---

## Development

```bash
npm install          # install plugin dependencies
npm test             # run unit tests

# Try a sample (single-file mode)
cd samples/uber-yaml && npm install && npm run validate && npm run build

# Try a sample (directory mode)
cd samples/dir-tree  && npm install && npm run validate && npm run build
```

### Repository structure

```
/                        ← plugin source (the publishable package)
  src/
    index.js             ← Docusaurus plugin entry (CJS)
    parser.js            ← YAML → radar object
    validator.js         ← validation rules
    theme/               ← React components (ESM)
      RadarLayout/       ← three-column shell + sidebar
      RadarComponents/   ← shared atoms: rings, filters, cards, SVG viz
      RadarOverview/     ← /radar overview page
      RadarDiscipline/   ← /radar/:disc discipline page
      RadarEntry/        ← /radar/:disc/:entry detail page
  tests/                 ← unit tests (node --test)
  validate.js            ← standalone CLI validator
  schema.yaml            ← full YAML schema reference

samples/
  uber-yaml/             ← single-file YAML demo (tech-radar.yaml)
  dir-tree/              ← directory-mode demo (tech-radar/)
```

---

## Releasing

Releases are automated by [semantic-release](https://github.com/semantic-release/semantic-release). On every push to `main`, the publish workflow parses commit messages, picks the next version, updates `CHANGELOG.md` and `package.json`, publishes to npm with `--provenance`, and creates a GitHub Release.

All commits to `main` must follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Effect |
|--------|--------|
| `feat:` | minor bump |
| `fix:` / `perf:` | patch bump |
| `feat!:` or `BREAKING CHANGE:` footer | major bump |
| `chore:` / `docs:` / `refactor:` / `test:` / `ci:` | no release |

Auth to npm uses trusted publishing (OIDC) — no `NPM_TOKEN` secret is needed.

---

## License

MIT
