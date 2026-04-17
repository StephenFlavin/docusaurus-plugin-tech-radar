# docusaurus-plugin-tech-radar

A Docusaurus plugin that renders a Technology Radar from YAML definitions. Supports a multi-discipline radar with quadrants, ring overrides per team or vertical, timeline tracking, compliance metadata, and full-text search.

## Features

- **Overview page** — all entries across every discipline with ring stats, filters (ring, team, tag, search), and a changelog
- **Discipline page** — SVG radar visualisation + entry cards per quadrant
- **Entry page** — full detail view: rationale, timeline, ring overrides, constraints, links, discussions, and freeform sections
- **Ring overrides** — teams or verticals can hold a different ring than the org-wide default; displayed with a ◆ marker
- **Two input modes** — single `tech-radar.yaml` file or a `tech-radar/` directory tree (one file per entry)
- **Auto-detection** — no `path` option needed; the plugin looks for `tech-radar.yaml` then `tech-radar/` in your site root
- **Build-time validation** — invalid rings, missing hold reasons, unknown team/vertical references all abort the build with a clear error
- **Docusaurus theme integration** — uses `--ifm-*` CSS variables so it inherits your site's colour scheme

---

## Installation

```bash
npm install docusaurus-plugin-tech-radar
# or
bun add docusaurus-plugin-tech-radar
```

Then reference it from your Docusaurus config:

```js
// docusaurus.config.js
plugins: [
  ['docusaurus-plugin-tech-radar', {
    routeBasePath: 'radar',
  }],
],
```

---

## Configuration

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

---

## YAML format

### Single-file mode

Name your file `tech-radar.yaml` at the Docusaurus site root. The file must have a top-level `radar:` key:

```yaml
radar:
  meta:
    title: Acme Engineering Technology Radar
    version: 4
    date: 2026-04-13
    cadence: quarterly
    changelog:
      - version: 4
        date: 2026-04-13
        summary: Added data discipline.

  config:
    link-types:
      url:
        label: Website
        icon-uri: https://example.com/icons/link.svg
      slack:
        label: Slack
        icon-uri: https://example.com/icons/slack.svg
        uri-pattern: "^https://acme\\.slack\\.com/.+"  # optional validation regex
        label-pattern: "^#[a-z0-9_-]+$"                # optional validation regex

    teams:
      platform:
        label: Platform Engineering
        description: Developer tooling, CI/CD, infrastructure.

    verticals:
      digital-commerce:
        label: Digital Commerce
        description: Online storefront and checkout.

  disciplines:
    backend:
      meta:
        label: Backend Engineering
        description: Server-side languages and frameworks.
        tags: [services, apis]
        key-individuals:
          - name: Sarah Chen
            role: Tech Lead
        links:
          - type: slack
            uri: "#backend-engineering"
            label: Backend community

      quadrants:
        languages-and-frameworks:
          meta:
            label: Languages & Frameworks
            description: Primary languages and their ecosystems.
            guidance: Prefer JVM languages unless a compelling case exists.

          entries:
            java:
              label: Java
              ring: adopt              # adopt | trial | assess | hold
              timeline:
                assess: 2023-12-31
                trial: 2024-03-31
                adopt: 2024-09-30
              description: Core backend language.
              rationale: Mature ecosystem, strong hiring pipeline.
              licence: GPL-2.0 WITH Classpath-exception-2.0
              compliance:
                frameworks: [SOC2]
                notes: PII fields require encryption.
              teams: [platform]
              verticals: [digital-commerce]
              tags: [jvm, core]
              constraints:
                min_version: "21"
              links:
                - type: url
                  uri: https://openjdk.org
                  label: OpenJDK
              discussions:
                - type: rfc
                  title: Java as primary backend language
                  link:
                    type: confluence
                    uri: /spaces/ENG/pages/10234
              sections:
                getting-started: |
                  Use the eng-bootstrap CLI to scaffold a new Java service.
              ring-overrides:
                teams:
                  platform:
                    ring: hold
                    reason: Platform is migrating to Kotlin.
                verticals:
                  digital-commerce:
                    ring: trial
                    reason: Evaluating Go for edge services.
```

**Hold entries** must include `hold_reason`. Optionally add `sunset_date` and `migration_target`:

```yaml
dynamodb:
  label: DynamoDB
  ring: hold
  hold_reason: Cost unpredictability and hot partition issues.
  sunset_date: 2027-03-31
  migration_target: postgresql
```

### Directory mode

Split the radar across individual files. Useful for large radars or teams that want per-entry pull requests.

```
tech-radar/
├── _meta.yaml                                # meta + config (flat — no radar: wrapper)
└── disciplines/
    └── backend/
        ├── _meta.yaml                        # discipline meta
        └── languages-and-frameworks/
            ├── _meta.yaml                    # quadrant meta
            ├── java.yaml                     # entry (fields directly, no wrapper)
            └── kotlin.yaml
```

`tech-radar/_meta.yaml` contains `meta:` and `config:` as top-level keys — no `radar:` wrapper:

```yaml
meta:
  title: Acme Engineering Technology Radar
  version: 4
  date: 2026-04-13
  cadence: quarterly
  changelog:
    - version: 4
      date: 2026-04-13
      summary: Added data discipline.

config:
  link-types:
    url:
      label: Website
      icon-uri: https://example.com/icons/link.svg
  teams:
    platform:
      label: Platform Engineering
      description: Developer tooling, CI/CD, infrastructure.
  verticals:
    digital-commerce:
      label: Digital Commerce
      description: Online storefront and checkout.
```

Discipline and quadrant `_meta.yaml` files contain their meta fields directly (same as before). Entry files contain just the entry fields directly.

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

## Validation

The plugin validates your YAML at build time and provides a standalone CLI:

```bash
# Validate without building (auto-detects tech-radar.yaml or tech-radar/)
node validate.js

# Validate an explicit path
node validate.js tech-radar.yaml
node validate.js tech-radar/

# From a sample directory
bun run validate
```

Validation checks:
- All `ring` values are `adopt`, `trial`, `assess`, or `hold`
- `hold` entries have a `hold_reason`
- All referenced `teams`, `verticals`, and link `type` keys exist in `config`
- Ring override values are valid ring names

Errors abort the build. Warnings print and continue.

---

## Development

```bash
# Install plugin dependencies
bun install

# Run unit tests
bun run test

# Try a sample (single-file mode)
cd samples/uber-yaml && bun install && bun run validate && bun run build

# Try a sample (directory mode)
cd samples/dir-tree  && bun install && bun run validate && bun run build
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
  tests/                 ← unit tests (Bun)
  validate.js            ← standalone CLI validator

samples/
  uber-yaml/             ← single-file YAML demo (tech-radar.yaml)
  dir-tree/              ← directory-mode demo (tech-radar/)
```

---

## Pages created by the plugin

| URL | Page |
|-----|------|
| `/radar` | Overview — ring stats, all entries, changelog |
| `/radar/:discipline` | Discipline — SVG radar + entry cards per quadrant |
| `/radar/:discipline/:entry` | Entry — full detail (rationale, timeline, overrides, links) |

---

## Releasing

Releases are published to npm by `.github/workflows/publish.yml`. On every
push to `main` it reads `version` from `package.json` and publishes if that
version is not yet on the registry — so cutting a release is:

1. Open a PR that bumps `version` in `package.json`.
2. Merge the PR to `main`.
3. The `Publish to npm` workflow runs, installs, tests, and publishes.

The workflow needs one repository secret:

| Secret | Where to get it |
|--------|-----------------|
| `NPM_TOKEN` | Create an **Automation** token at <https://www.npmjs.com/settings/~/tokens> and add it under **Settings → Secrets and variables → Actions**. |

`npm publish --provenance` is used, so the workflow also needs the
`id-token: write` permission (already set in the workflow file).

---

## License

MIT
