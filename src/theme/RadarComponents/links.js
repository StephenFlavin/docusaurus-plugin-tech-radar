// "persistence-and-messaging" → "Persistence And Messaging".
// Duplicated in src/parser.js (CJS side); see CLAUDE.md CJS/ESM note.
function slugToLabel(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function linkTypeLabel(config, typeKey) {
  return config?.links?.[typeKey]?.label || slugToLabel(typeKey);
}

export function linkTypeIconUri(config, typeKey) {
  return config?.links?.[typeKey]?.['icon-uri'];
}
