import React from 'react';
import { effectiveRing } from './rings';

/** Returns true if the entry passes all active filters. */
export function entryMatchesFilters(entry, teamFilter, verticalFilter, tagFilter, ringFilter, search) {
  const { ring: effRing } = effectiveRing(entry, teamFilter, verticalFilter);
  if (ringFilter && effRing !== ringFilter) return false;
  if (teamFilter && !(entry.teams || []).includes(teamFilter)) return false;
  if (verticalFilter && !(entry.verticals || []).includes(verticalFilter)) return false;
  if (tagFilter && !(entry.tags || []).includes(tagFilter)) return false;
  if (search) {
    const q = search.toLowerCase();
    const haystack = [
      entry.label, entry.description, entry.rationale,
      ...(entry.tags || []), ...(entry.teams || []), ...(entry.verticals || []),
    ].filter(Boolean).join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function useRadarFilters(allEntries) {
  const [ringFilter, setRingFilter] = React.useState(null);
  const [teamFilter, setTeamFilter] = React.useState(null);
  const [verticalFilter, setVerticalFilter] = React.useState(null);
  const [tagFilter, setTagFilter] = React.useState(null);
  const [search, setSearch] = React.useState('');

  const { teamUsage, tagUsage, verticalUsage } = React.useMemo(() => {
    const teamUsage = {}, tagUsage = {}, verticalUsage = {};
    for (const e of allEntries) {
      for (const t of (e.teams || [])) teamUsage[t] = (teamUsage[t] || 0) + 1;
      for (const t of (e.tags || [])) tagUsage[t] = (tagUsage[t] || 0) + 1;
      for (const v of (e.verticals || [])) verticalUsage[v] = (verticalUsage[v] || 0) + 1;
    }
    return { teamUsage, tagUsage, verticalUsage };
  }, [allEntries]);

  const filtered = allEntries.filter(e =>
    entryMatchesFilters(e, teamFilter, verticalFilter, tagFilter, ringFilter, search)
  );

  return {
    ringFilter, setRingFilter,
    teamFilter, setTeamFilter,
    verticalFilter, setVerticalFilter,
    tagFilter, setTagFilter,
    search, setSearch,
    filtered,
    teamUsage, tagUsage, verticalUsage,
  };
}
