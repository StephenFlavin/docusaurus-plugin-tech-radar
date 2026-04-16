const VALID_RINGS = ['adopt', 'trial', 'assess', 'hold'];

function validate(radar) {
  const errors = [];
  const validTeams = Object.keys(radar.config?.teams || {});
  const validVerticals = Object.keys(radar.config?.verticals || {});
  const linkTypes = radar.config?.['link-types'] || {};
  const validLinkTypes = Object.keys(linkTypes);

  for (const [discSlug, disc] of Object.entries(radar.disciplines || {})) {
    for (const [quadSlug, quad] of Object.entries(disc.quadrants || {})) {
      for (const [entrySlug, entry] of Object.entries(quad.entries || {})) {
        const p = `${discSlug}.${quadSlug}.${entrySlug}`;

        // Ring
        if (!VALID_RINGS.includes(entry.ring)) {
          errors.push({ path: p, message: `Invalid ring "${entry.ring}"`, severity: 'error' });
        }

        // Teams
        for (const t of (entry.teams || [])) {
          if (!validTeams.includes(t)) {
            errors.push({ path: `${p}.teams`, message: `Unknown team "${t}"`, severity: 'error' });
          }
        }

        // Verticals
        for (const v of (entry.verticals || [])) {
          if (validVerticals.length > 0 && !validVerticals.includes(v)) {
            errors.push({ path: `${p}.verticals`, message: `Unknown vertical "${v}"`, severity: 'error' });
          }
        }

        // Links
        for (const l of (entry.links || [])) {
          validateLink(l, linkTypes, validLinkTypes, `${p}.links`, errors);
        }

        // Discussions (nested link)
        for (const d of (entry.discussions || [])) {
          if (d.link) {
            validateLink(d.link, linkTypes, validLinkTypes, `${p}.discussions`, errors);
          }
        }

        // Hold without reason
        if (entry.ring === 'hold' && !entry.hold_reason) {
          errors.push({ path: p, message: 'Hold entry missing hold_reason', severity: 'error' });
        }

        // Timeline rings
        for (const [ring] of Object.entries(entry.timeline || {})) {
          if (!VALID_RINGS.includes(ring)) {
            errors.push({ path: `${p}.timeline`, message: `Invalid ring "${ring}" in timeline`, severity: 'error' });
          }
        }

        // Ring overrides
        const overrides = entry['ring-overrides'] || {};

        // Team overrides
        for (const [teamKey, override] of Object.entries(overrides.teams || {})) {
          if (!validTeams.includes(teamKey)) {
            errors.push({
              path: `${p}.ring-overrides.teams.${teamKey}`,
              message: `Unknown team "${teamKey}"`,
              severity: 'error',
            });
          }
          if (!override.ring || !VALID_RINGS.includes(override.ring)) {
            errors.push({
              path: `${p}.ring-overrides.teams.${teamKey}.ring`,
              message: `Invalid ring "${override.ring}"`,
              severity: 'error',
            });
          }
          if (!override.reason) {
            errors.push({
              path: `${p}.ring-overrides.teams.${teamKey}`,
              message: 'Ring override missing reason',
              severity: 'warning',
            });
          }
        }

        // Vertical overrides
        for (const [vertKey, override] of Object.entries(overrides.verticals || {})) {
          if (validVerticals.length > 0 && !validVerticals.includes(vertKey)) {
            errors.push({
              path: `${p}.ring-overrides.verticals.${vertKey}`,
              message: `Unknown vertical "${vertKey}"`,
              severity: 'error',
            });
          }
          if (!override.ring || !VALID_RINGS.includes(override.ring)) {
            errors.push({
              path: `${p}.ring-overrides.verticals.${vertKey}.ring`,
              message: `Invalid ring "${override.ring}"`,
              severity: 'error',
            });
          }
          if (!override.reason) {
            errors.push({
              path: `${p}.ring-overrides.verticals.${vertKey}`,
              message: 'Ring override missing reason',
              severity: 'warning',
            });
          }
        }
      }
    }
  }

  return errors;
}

function validateLink(link, linkTypes, validLinkTypes, path, errors) {
  if (!validLinkTypes.includes(link.type)) {
    errors.push({ path, message: `Unknown link type "${link.type}"`, severity: 'error' });
    return;
  }
  const typeDef = linkTypes[link.type] || {};
  if (typeDef['uri-pattern'] && link.uri != null) {
    if (!new RegExp(typeDef['uri-pattern']).test(link.uri)) {
      errors.push({
        path,
        message: `Link uri "${link.uri}" does not match uri-pattern for type "${link.type}"`,
        severity: 'error',
      });
    }
  }
  if (typeDef['label-pattern'] && link.label != null) {
    if (!new RegExp(typeDef['label-pattern']).test(link.label)) {
      errors.push({
        path,
        message: `Link label "${link.label}" does not match label-pattern for type "${link.type}"`,
        severity: 'error',
      });
    }
  }
}

module.exports = { validate };
