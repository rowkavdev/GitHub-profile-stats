import { test } from "node:test";
import assert from "node:assert/strict";
import { socialCardUrls } from "../src/lib/social-card-urls.ts";

const base = { type: "profile", theme: "github", style: "github" };

test("cards without orgs keep the URLs they had before", () => {
  const urls = socialCardUrls("rowkav09", base);
  assert.equal(urls.svgUrl, "/api/profile?username=rowkav09&type=profile&theme=github&style=github");
  assert.equal(urls.pngUrl, "/api/profile/png?username=rowkav09&type=profile&theme=github&style=github&download=true");
});

test("orgs are added to the SVG and PNG URLs", () => {
  const urls = socialCardUrls("rowkav09", { ...base, orgs: "rowkavdev, other-org" });
  assert.match(urls.svgUrl, /&orgs=rowkavdev,other-org$/);
  assert.match(urls.pngUrl, /&orgs=rowkavdev,other-org&download=true$/);
});

test("invalid, duplicate and own-name orgs are dropped", () => {
  const urls = socialCardUrls("rowkav09", { ...base, orgs: "bad/org, rowkav09, rowkavdev, ROWKAVDEV" });
  assert.deepEqual(urls.orgs, ["rowkavdev"]);
  assert.equal(socialCardUrls("rowkav09", { ...base, orgs: "bad/org" }).svgUrl.includes("orgs"), false);
});

test("org parsing matches the API's parseExtraOwners", async () => {
  const { parseExtraOwners } = await import("../src/lib/github.ts");
  for (const raw of ["a,b,c,d,e", " a , a ,B", "x/y,,z", "-bad,good-", "rowkav09,Rowkav09,ok", ""]) {
    assert.deepEqual(socialCardUrls("rowkav09", { ...base, orgs: raw }).orgs, parseExtraOwners(raw, "rowkav09"), raw);
  }
});

test("SVG download is named like the PNG download", () => {
  assert.equal(socialCardUrls("rowkav09", base).svgFileName, "rowkav09-github-card.svg");
});
