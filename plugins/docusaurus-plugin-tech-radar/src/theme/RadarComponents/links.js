export function linkTypeLabel(config, typeKey) {
  return config?.['link-types']?.[typeKey]?.label || typeKey;
}
