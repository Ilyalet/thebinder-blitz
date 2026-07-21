// Maps a page name (matching the component name in src/pages/, optionally
// with a "?query=string" suffix) to its route path, e.g. createPageUrl('Document?id=123') -> '/document?id=123'.
export function createPageUrl(pageNameWithQuery) {
  const [name, query] = pageNameWithQuery.split('?');
  const path = '/' + name.toLowerCase();
  return query ? `${path}?${query}` : path;
}
