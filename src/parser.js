const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { marked } = require('marked');

// Render inline content without wrapping <p> — lets us use markdown inside
// headings / small fragments. For section bodies we use the block renderer.
marked.use({ gfm: true, breaks: false });

/**
 * Parse a radar definition from either a single YAML file or a directory.
 * Entries' freeform `sections` are rendered from Markdown to HTML so the
 * theme can drop them in with dangerouslySetInnerHTML.
 * @param {string} inputPath - Path to a .yaml file or a directory
 * @returns {object} Parsed radar object
 */
function parseRadar(inputPath) {
  const stat = fs.statSync(inputPath);

  let radar;
  if (stat.isFile()) {
    radar = parseSingleFile(inputPath);
  } else if (stat.isDirectory()) {
    radar = parseDirectory(inputPath);
  } else {
    throw new Error(`Input path does not exist: ${inputPath}`);
  }

  normalizeDates(radar);
  renderSections(radar);
  return radar;
}

/**
 * YAML 1.1/1.2 both parse unquoted `YYYY-MM-DD` as a Date. The theme and
 * validator treat dates as strings (we sort with localeCompare, render as
 * text, etc.), so normalise every Date we find back to `YYYY-MM-DD`.
 * Rewriting in place keeps authors free to quote or not-quote dates.
 */
function normalizeDates(node) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (node[i] instanceof Date) node[i] = toISODate(node[i]);
      else normalizeDates(node[i]);
    }
    return;
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const v = node[key];
      if (v instanceof Date) node[key] = toISODate(v);
      else normalizeDates(v);
    }
  }
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Walk every entry and replace `sections[key]` (Markdown) with
 * `{ raw, html }` so components can render HTML without bundling a
 * Markdown parser client-side.
 */
function renderSections(radar) {
  for (const disc of Object.values(radar.disciplines || {})) {
    for (const quad of Object.values(disc.quadrants || {})) {
      for (const entry of Object.values(quad.entries || {})) {
        if (!entry || !entry.sections) continue;
        const rendered = {};
        for (const [key, value] of Object.entries(entry.sections)) {
          const raw = typeof value === 'string' ? value : String(value ?? '');
          rendered[key] = { raw, html: marked.parse(raw) };
        }
        entry.sections = rendered;
      }
    }
  }
}

function parseSingleFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const doc = yaml.load(content);

  if (!doc || !doc.radar) {
    throw new Error(`Expected top-level "radar:" key in ${filePath}`);
  }

  return doc.radar;
}

/**
 * Directory layout:
 *   tech-radar/
 *   ├── _meta.yaml              # { meta: {...}, config: {...} }
 *   └── disciplines/
 *       └── <discipline>/
 *           ├── _meta.yaml      # discipline meta fields
 *           └── <quadrant>/
 *               ├── _meta.yaml  # quadrant meta fields
 *               └── <entry>.yaml
 */
function parseDirectory(dirPath) {
  const metaFile = findRootMeta(dirPath);
  if (!metaFile) {
    throw new Error(`Directory mode requires _meta.yaml at: ${path.join(dirPath, '_meta.yaml')}`);
  }

  const rootDoc = yaml.load(fs.readFileSync(metaFile, 'utf-8')) || {};
  const radar = {
    meta: rootDoc.meta || {},
    config: rootDoc.config || {},
  };
  radar.disciplines = {};

  const discDir = path.join(dirPath, 'disciplines');
  if (!fs.existsSync(discDir)) return radar;

  for (const discName of sortedDirs(discDir)) {
    const discPath = path.join(discDir, discName);
    radar.disciplines[discName] = parseDisciplineDir(discPath);
  }

  return radar;
}

function parseDisciplineDir(dirPath) {
  const meta = readMeta(dirPath, {
    label: slugToLabel(path.basename(dirPath)),
  });

  const quadrants = {};
  for (const quadName of sortedDirs(dirPath)) {
    const quadPath = path.join(dirPath, quadName);
    quadrants[quadName] = parseQuadrantDir(quadPath);
  }

  return { meta, quadrants };
}

function parseQuadrantDir(dirPath) {
  const meta = readMeta(dirPath, {
    label: slugToLabel(path.basename(dirPath)),
  });

  const entries = {};
  const yamlFiles = fs.readdirSync(dirPath)
    .filter(f => (f.endsWith('.yaml') || f.endsWith('.yml')) && !f.startsWith('_'))
    .sort();

  for (const file of yamlFiles) {
    const slug = path.basename(file, path.extname(file));
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    entries[slug] = yaml.load(content);
  }

  return { meta, entries };
}

/** Find _meta.yaml / _meta.yml in directory root */
function findRootMeta(dirPath) {
  for (const name of ['_meta.yaml', '_meta.yml']) {
    const p = path.join(dirPath, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Read _meta.yaml from a directory, falling back to defaults */
function readMeta(dirPath, defaults) {
  for (const name of ['_meta.yaml', '_meta.yml']) {
    const metaPath = path.join(dirPath, name);
    if (fs.existsSync(metaPath)) {
      return yaml.load(fs.readFileSync(metaPath, 'utf-8'));
    }
  }
  return defaults;
}

/** List subdirectories sorted alphabetically */
function sortedDirs(dirPath) {
  return fs.readdirSync(dirPath)
    .filter(f => fs.statSync(path.join(dirPath, f)).isDirectory())
    .sort();
}

/** "persistence-and-messaging" → "Persistence And Messaging" */
function slugToLabel(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

module.exports = { parseRadar };
