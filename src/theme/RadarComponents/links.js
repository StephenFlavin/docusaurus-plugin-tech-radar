export function linkTypeLabel(config, typeKey) {
  return config?.['link-types']?.[typeKey]?.label || typeKey;
}

// Resolve a clickable href from a link object.
// Returns a URL string when the URI is already absolute (https?://) or
// when the link-type config defines a base-url to prepend; null otherwise.
export function resolveHref(config, link) {
  const { type, uri } = link;
  if (!uri) return null;
  if (/^https?:\/\//.test(uri)) return uri;
  const baseUrl = config?.['link-types']?.[type]?.['base-url'];
  if (!baseUrl) return null;
  // Paths starting with '/' need only the base without trailing slash.
  // Bare identifiers (e.g. Jira PLAT-2200) need a separator added.
  return uri.startsWith('/')
    ? baseUrl.replace(/\/$/, '') + uri
    : baseUrl.replace(/\/?$/, '/') + uri;
}
