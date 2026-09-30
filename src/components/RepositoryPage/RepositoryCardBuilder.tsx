"use client";

import { useMemo, useState } from "react";
import { PROFILE_CARD_STYLES } from "@/lib/social-card-layout";

const THEMES = ["github", "light", "dark", "ocean", "violet", "amber"] as const;
const REPO_URL = "https://github.com/rowkavdev/GitHub-profile-stats";

export default function RepositoryCardBuilder({ owner, repo }: { owner: string; repo: string }) {
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("github");
  const [style, setStyle] = useState<(typeof PROFILE_CARD_STYLES)[number]>("github");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const repository = `${owner}/${repo}`;
  const encoded = encodeURIComponent(repository);
  const svgUrl = `/api/profile?repo=${encoded}&theme=${theme}&style=${style}`;
  const pngUrl = `/api/profile/png?repo=${encoded}&theme=${theme}&style=${style}&download=true`;
  const markdown = useMemo(() => `[![${repository} repository card](https://ghstats.dev${svgUrl})](${REPO_URL})`, [repository, svgUrl]);

  function copyMarkdown() {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1400);
    }).catch(() => {
      setCopyStatus("failed");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    });
  }

  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#010409] p-4 shadow-2xl shadow-black/20 sm:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Build a repository card</h2>
        <p className="mt-1 text-sm text-[#8b949e]">Pick a style and theme, preview it live, then copy the linked embed or download a PNG.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          <fieldset className="mb-7">
            <legend className="label-text">Layout style</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PROFILE_CARD_STYLES.map((option) => <button key={option} type="button" aria-pressed={style === option} onClick={() => setStyle(option)} className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize ${style === option ? "border-[#58a6ff] bg-[#1f6feb]/15 text-[#79c0ff]" : "border-[#30363d] bg-[#161b22] text-[#8b949e]"}`}>{option === "github" ? "GitHub" : option}</button>)}
            </div>
          </fieldset>
        <fieldset>
          <legend className="label-text">Theme preset</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {THEMES.map((option) => (
              <button key={option} type="button" onClick={() => setTheme(option)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold capitalize transition-colors ${theme === option ? "border-[#58a6ff] bg-[#1f6feb]/15 text-[#79c0ff]" : "border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-[#c9d1d9]"}`}>
                <span className={`h-3 w-3 rounded-full ${option === "github" || option === "light" ? "bg-white" : option === "dark" ? "bg-[#0d1117]" : option === "ocean" ? "bg-[#38bdf8]" : option === "violet" ? "bg-[#a78bfa]" : "bg-[#f5b942]"}`} />{option}
              </button>
            ))}
          </div>
        </fieldset>
        </div>
        <div className="min-w-0 space-y-5">
          <div className="preview-box min-h-0 overflow-hidden p-3 sm:p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={svgUrl} src={svgUrl} alt={`${repository} repository ${style} card in ${theme}`} className="h-auto w-full rounded-lg" />
          </div>
          <div className="embed-block">
            <div className="flex items-center justify-between gap-3"><span className="label-text mb-0">Linked markdown embed</span><button type="button" onClick={copyMarkdown} className="copy-btn">{copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy"}</button></div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-xs leading-6 text-[#79c0ff]">{markdown}</pre>
            <p className="mt-2 text-xs text-[#484f58]">The image stays live and clicking it opens the GitHub-profile-stats repository.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row"><a href={pngUrl} className="rounded-lg bg-[#238636] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#2ea043]">Download PNG</a><a href={svgUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#30363d] px-4 py-2.5 text-center text-sm font-semibold text-[#c9d1d9] hover:border-[#58a6ff]">Open SVG</a></div>
        </div>
      </div>
    </section>
  );
}
