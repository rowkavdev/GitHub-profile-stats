// Kept free of runtime imports so the client builder stays small and node can
// load it in tests. These rules mirror parseExtraOwners in github.ts; a test
// checks the two agree.
const MAX_ORGS = 3;
const LOGIN_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

function parseOrgs(raw: string | undefined, username: string): string[] {
  const seen = new Set([username.toLowerCase()]);
  const owners: string[] = [];
  for (const part of (raw ?? "").split(",")) {
    const login = part.trim();
    if (!LOGIN_RE.test(login) || seen.has(login.toLowerCase())) continue;
    seen.add(login.toLowerCase());
    owners.push(login);
    if (owners.length >= MAX_ORGS) break;
  }
  return owners;
}

export type SocialCardOptions = {
  type: string;
  theme: string;
  style: string;
  /** Raw comma-separated organisation logins typed into the builder. */
  orgs?: string;
};

/**
 * Build the SVG and PNG URLs for the social card builder. Organisations are
 * validated with the same rules as the API and only added when at least one
 * is usable, so cards without orgs keep exactly the URLs they had before.
 */
export function socialCardUrls(username: string, options: SocialCardOptions) {
  const params = new URLSearchParams({
    username,
    type: options.type,
    theme: options.theme,
    style: options.style,
  });
  const owners = parseOrgs(options.orgs, username);
  if (owners.length > 0) params.set("orgs", owners.join(","));
  const query = params.toString().replace(/%2C/g, ",");
  return {
    svgUrl: `/api/profile?${query}`,
    pngUrl: `/api/profile/png?${query}&download=true`,
    orgs: owners,
    maxOrgs: MAX_ORGS,
  };
}
