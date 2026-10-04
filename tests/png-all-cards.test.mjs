import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRoute } from "./helpers/route-loader.mjs";
import { rasteriseSvg } from "../src/lib/svg-to-png.ts";

const pc = loadRoute("lib/profile-card.ts");
// Small solid-orange avatar so we can find it in the output.
const AVATAR = "data:image/svg+xml;base64," + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#ff8800"/></svg>').toString("base64");
const languages = [["JavaScript", 47, "#f1e05a"], ["Python", 29, "#3572A5"], ["TypeScript", 10, "#3178c6"]].map(([name, percentage, color]) => ({ name, percentage, color, size: percentage * 100 }));
const days = Array.from({ length: 371 }, (_, i) => ({ date: new Date(Date.UTC(2026, 9, 4) - (370 - i) * 86400000).toISOString().slice(0, 10), contributionCount: (i * 7) % 9 }));
const profile = { username: "rowkav09", name: "rowan kavanagh", bio: "Building things", followers: 20, publicRepos: 28, totalStars: 4, contributionsThisYear: 7972, currentStreak: 5, longestStreak: 30, totalCommits: 6100, languages, contributionDays: days, avatarDataUri: AVATAR };
const repo = { owner: "rowkavdev", name: "GitHub-profile-stats", description: "Cards for GitHub profiles", ownerAvatarUrl: "", avatarDataUri: AVATAR, contributors: 3, commits: 900, openIssues: 12, stars: 47, forks: 5, languages };

function differing(a, b) {
  let count = 0;
  for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) count++;
  return count;
}

function orangeCount(px) {
  let count = 0;
  for (let i = 0; i < px.length; i += 4) if (px[i] > 220 && px[i + 1] > 100 && px[i + 1] < 170 && px[i + 2] < 40) count++;
  return count;
}

// Render at a third of the size: enough to see glyphs and the avatar, and light on memory.
const SCALED = 400;
const cases = [];
for (const theme of Object.keys(pc.PROFILE_THEMES)) {
  for (const style of pc.PROFILE_CARD_STYLES) {
    for (const type of pc.PROFILE_CARD_TYPES) cases.push({ theme, style, type, kind: "profile" });
    cases.push({ theme, style, type: "repo", kind: "repository" });
  }
}

test("every PNG card type, style and theme keeps its text and avatar", () => {
  assert.ok(cases.length >= 150);
  for (const { theme, style, type, kind } of cases) {
    const options = pc.resolveProfileCardOptions(new URLSearchParams({ type, style, theme }));
    const svg = kind === "repository" ? pc.renderRepositoryCard(repo, options) : pc.renderProfileCard(profile, options);
    const label = `${kind} ${type} ${style} ${theme}`;
    const full = rasteriseSvg(svg, SCALED).pixels;
    const noText = rasteriseSvg(svg.replace(/<text[\s\S]*?<\/text>/g, ""), SCALED).pixels;
    assert.ok(differing(full, noText) > 150, `text missing: ${label}`);
    if (type !== "contributions") assert.ok(orangeCount(full) > 200, `avatar missing: ${label}`);
  }
});
