const { describe, test } = require('node:test');
const { expect } = require('expect');
const path = require('path');
const { parseRadar } = require('../src/parser');

const fixtures = path.join(__dirname, 'fixtures');

describe('parseRadar - single file', () => {
  test('parses a valid single-file radar', () => {
    const radar = parseRadar(path.join(fixtures, 'valid-single.yaml'));
    expect(radar.meta.title).toBe('Test Radar');
    expect(radar.meta.version).toBe(1);
    const entry = radar.disciplines.engineering.quadrants.tools.entries['my-tool'];
    expect(entry.ring).toBe('adopt');
    expect(entry.teams).toEqual(['team-a']);
    expect(entry.timeline).toEqual({ assess: '2025-12-31', adopt: '2026-03-31' });
  });

  test('throws when radar: key is missing', () => {
    expect(() =>
      parseRadar(path.join(fixtures, 'no-radar-key.yaml'))
    ).toThrow('Expected top-level "radar:" key');
  });
});

describe('parseRadar - directory mode', () => {
  test('parses a valid directory radar', () => {
    const radar = parseRadar(path.join(fixtures, 'valid-dir'));
    expect(radar.meta.title).toBe('Dir Radar');
    expect(radar.disciplines.backend.meta.label).toBe('Backend Engineering');
    const entry = radar.disciplines.backend.quadrants.languages.entries.java;
    expect(entry.ring).toBe('adopt');
    expect(entry.label).toBe('Java');
  });

  test('reads quadrant meta from _meta.yaml', () => {
    const radar = parseRadar(path.join(fixtures, 'valid-dir'));
    expect(radar.disciplines.backend.quadrants.languages.meta.label).toBe('Languages');
  });

  test('throws when root _meta.yaml is missing', () => {
    expect(() =>
      parseRadar(path.join(fixtures, 'dir-no-root-yaml'))
    ).toThrow('Directory mode requires _meta.yaml');
  });
});

describe('parseRadar - directory mode meta fallbacks', () => {
  const radar = parseRadar(path.join(fixtures, 'dir-meta-fallbacks'));
  const disc = radar.disciplines['persistence-and-messaging'];

  test('falls back to slug-derived discipline label when _meta.yaml is absent', () => {
    expect(disc.meta.label).toBe('Persistence And Messaging');
  });

  test('falls back to slug-derived quadrant label when _meta.yaml is absent', () => {
    expect(disc.quadrants.datastores.meta.label).toBe('Datastores');
  });

  test('accepts .yml entry files alongside .yaml', () => {
    const entries = disc.quadrants.datastores.entries;
    expect(entries.redis).toBeDefined();
    expect(entries.kafka).toBeDefined();
    expect(entries.kafka.ring).toBe('trial');
  });

  test('ignores entry files starting with _', () => {
    const entries = disc.quadrants.datastores.entries;
    expect(entries._draft).toBeUndefined();
    expect(entries.draft).toBeUndefined();
  });
});
