# Tech Radar — Docusaurus Example

A minimal Docusaurus site with the `docusaurus-plugin-tech-radar` plugin pre-installed.

## Run it

```bash
bun install
bun start
```

Then open http://localhost:3000 and click **Tech Radar** in the navbar.

`bun run build` produces a static site in `build/`.

`bun run validate` checks your YAML without building — useful in CI.

## What's in here

```
├── radar.yaml                              # ← Your radar definition
├── docusaurus.config.js                    # ← Plugin wired up here (2 additions)
├── docs/                                   # Normal Docusaurus docs
├── src/pages/index.js                      # Homepage
└── plugins/
    └── docusaurus-plugin-tech-radar/       # ← The plugin
        ├── package.json
        └── src/
            ├── index.js                    # Plugin entry (loadContent → addRoute)
            ├── parser.js                   # YAML → JSON
            ├── validator.js                # Build-time validation
            └── theme/
                ├── RadarLayout/            # 3-column layout (sidebar, content, TOC)
                ├── RadarOverview/          # /radar
                ├── RadarDiscipline/        # /radar/:discipline
                └── RadarEntry/             # /radar/:discipline/:entry
```

## Pages created by the plugin

| URL | What it shows |
|---|---|
| `/radar` | Overview — stats + all disciplines |
| `/radar/backend` | Backend Engineering — quadrants + entry cards |
| `/radar/backend/java` | Java — full detail with timeline, links, discussions |

## Editing the radar

Edit `radar.yaml` and the site hot-reloads. The plugin's `getPathsToWatch()` hook watches
the YAML file (or all `*.yaml` in a directory if you use directory mode).

## Directory mode

To use one-file-per-entry, change the config:

```js
plugins: [
  ['./plugins/docusaurus-plugin-tech-radar', {
    path: 'radar/',          // point to a directory
    routeBasePath: 'radar',
  }],
],
```

Then structure your `radar/` directory as:

```
radar/
├── radar.yaml                       # meta + config
└── disciplines/
    └── backend/
        ├── _meta.yaml
        └── languages-and-frameworks/
            ├── _meta.yaml
            ├── java.yaml
            └── kotlin.yaml
```
