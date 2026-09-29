/** Parameters actually read by /api/card. Drop everything else before the edge cache key is formed. */
const CARD_PARAMS = new Set([
  "username", "theme", "alltime", "orgs", "bg", "text", "title_color",
  "icon_color", "border_color", "hide_border", "hide_title", "hide",
  "show_icons", "show_ring", "border_radius", "custom_title", "size",
  "compact_count", "show_emoji", "order",
]);

export function canonicalCardUrl(url: URL): URL | null {
  const params = url.searchParams;
  if (![...params.keys()].some((key) => !CARD_PARAMS.has(key))) return null;
  const canonical = new URL(url);
  for (const key of [...canonical.searchParams.keys()]) {
    if (!CARD_PARAMS.has(key)) canonical.searchParams.delete(key);
  }
  return canonical;
}
