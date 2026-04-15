const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Parse a radar definition from either a single YAML file or a directory.
 * @param {string} inputPath - Path to a .yaml file or a directory
 * @returns {object} Parsed radar object
 */
function parseRadar(inputPath) {
  const stat = fs.statSync(inputPath);

  if (stat.isFile()) {
    return parseSingleFile(inputPath);
  } else if (stat.isDirectory()) {
    return parseDirectory(inputPath);
  } else {
    throw new Error(`Input path does not exist: ${inputPath}`);
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
 *   radar/
 *   ├── radar.yaml              # { radar: { meta, config } }
 *   └── disciplines/
 *       └── <discipline>/
 *           ├── _meta.yaml      # discipline meta fields
 *           └── <quadrant>/
 *               ├── _meta.yaml  # quadrant meta fields
 *               └── <entry>.yaml
 */
function parseDirectory(dirPath) {
  const rootFile = path.join(dirPath, 'radar.yaml');
  if (!fs.existsSync(rootFile)) {
    throw new Error(`Directory mode requires radar.yaml at: ${rootFile}`);
  }

  const rootDoc = yaml.load(fs.readFileSync(rootFile, 'utf-8'));
  if (!rootDoc || !rootDoc.radar) {
    throw new Error(`Expected top-level "radar:" key in ${rootFile}`);
  }

  const radar = rootDoc.radar;
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
