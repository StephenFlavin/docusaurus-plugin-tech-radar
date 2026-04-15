#!/usr/bin/env node

/**
 * Validate a radar YAML file or directory.
 *
 * Usage:
 *   node validate.js radar.yaml
 *   node validate.js radar/
 *   bun run validate           # uses the path from docusaurus.config.js
 */

const path = require('path');
const { parseRadar } = require('./src/parser');
const { validate } = require('./src/validator');

// Resolve input path
let inputPath = process.argv[2];

if (!inputPath) {
  // Try to read from docusaurus.config.js
  try {
    const configPath = path.resolve(process.cwd(), 'docusaurus.config.js');
    const config = require(configPath);
    const plugins = config.plugins || [];
    for (const p of plugins) {
      if (Array.isArray(p) && typeof p[1] === 'object' && p[1].path) {
        inputPath = p[1].path;
        break;
      }
    }
  } catch {}
}

if (!inputPath) {
  console.error('Usage: node validate.js <radar.yaml|radar-dir/>');
  console.error('   or: add to package.json scripts and run from project root');
  process.exit(1);
}

const resolved = path.resolve(process.cwd(), inputPath);

try {
  const radar = parseRadar(resolved);
  const errors = validate(radar);

  const errs = errors.filter(e => e.severity === 'error');
  const warns = errors.filter(e => e.severity === 'warning');

  for (const e of errors) {
    const prefix = e.severity === 'error' ? '\x1b[31mERROR\x1b[0m' : '\x1b[33mWARN \x1b[0m';
    console.log(`  ${prefix} ${e.path} → ${e.message}`);
  }

  // Count entries
  let totalEntries = 0;
  const rings = { adopt: 0, trial: 0, assess: 0, hold: 0 };
  for (const disc of Object.values(radar.disciplines || {})) {
    for (const quad of Object.values(disc.quadrants || {})) {
      for (const entry of Object.values(quad.entries || {})) {
        totalEntries++;
        rings[entry.ring] = (rings[entry.ring] || 0) + 1;
      }
    }
  }

  console.log('');
  if (errs.length > 0) {
    console.log(`\x1b[31m✗\x1b[0m ${errs.length} error(s), ${warns.length} warning(s)`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m✓\x1b[0m Valid — ${warns.length} warning(s)`);
    console.log(`  ${Object.keys(radar.disciplines).length} disciplines, ${totalEntries} entries  [${rings.adopt} adopt · ${rings.trial} trial · ${rings.assess} assess · ${rings.hold} hold]`);
  }
} catch (e) {
  console.error(`\x1b[31m✗\x1b[0m Failed to parse: ${e.message}`);
  process.exit(1);
}
