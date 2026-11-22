"use client";

import { useState, useEffect, useMemo } from "react";
import { HERO_THEMES } from "@/lib/themes/configs/registry";

const ICONS: Record<string, string> = {
  star: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z",
  commit:
    "M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5h-3.32zM8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  pr: "M7.177 3.073L9.573.677A.25.25 0 0 1 10 .854v4.792a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354zM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25zM11 2.5h-1V4h1a1 1 0 0 1 1 1v5.628a2.251 2.251 0 1 0 1.5 0V5A2.5 2.5 0 0 0 11 2.5zm1 10.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0zM3.75 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z",
  fire: "M7.998 14.5c2.832 0 5-1.98 5-4.5 0-1.463-.68-2.19-1.879-3.383l-.036-.037c-1.013-1.008-2.3-2.29-2.834-4.434-.322.256-.63.579-.864.953-.432.696-.621 1.58-.046 2.73.473.943.114 1.5-.455 1.5-.638 0-1.18-.504-1.48-1.089a3.645 3.645 0 0 1-.346-1.323 3.9 3.9 0 0 0-.6.961c-.563.767-.895 1.636-.895 2.622 0 2.52 2.168 4.5 5 4.5z",
  trend:
    "M.75 8a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5A.75.75 0 0 1 .75 8zm4-4a.75.75 0 0 1 .75.75v9.5a.75.75 0 0 1-1.5 0v-9.5A.75.75 0 0 1 4.75 4zM8.75 0a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-1.5 0V.75a.75.75 0 0 1 .75-.75zm4 2a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-1.5 0V2.75a.75.75 0 0 1 .75-.75z",
  clock:
    "M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 4.75v3.44l2.78 1.61a.75.75 0 1 1-.75 1.3l-3.16-1.83A.75.75 0 0 1 7 8.69V4.75a.75.75 0 0 1 1.5 0z",
  trophy:
    "M4.25 1a.25.25 0 0 0-.25.25v1h-1A1.75 1.75 0 0 0 1.25 4v1c0 .966.784 1.75 1.75 1.75h.25v.457a4.002 4.002 0 0 0 2.5 3.693V12h-1a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-1v-1.1a4.002 4.002 0 0 0 2.5-3.693V6.75h.25c.966 0 1.75-.784 1.75-1.75V4c0-.966-.784-1.75-1.75-1.75h-1v-1A.25.25 0 0 0 11.75 1zM3 4.25h1v2.5H3.25a.25.25 0 0 1-.25-.25V4.25zm10 0v2.25a.25.25 0 0 1-.25.25H12v-2.5z",
  graph:
    "M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042z",
};

const DEMO_STATS = [
  { label: "Total Stars Earned", value: "1,247", icon: "star" },
  { label: "Commits (Past Year)", value: "3,891", icon: "commit" },
  { label: "Pull Requests", value: "186", icon: "pr" },
  { label: "Current Streak", value: "42 days", icon: "fire" },
  { label: "Weekly Contribution Trend", value: "47", icon: "trend" },
  { label: "Avg Contributions / Day", value: "10.7", icon: "clock" },
  { label: "Activity Grade", value: "A+", icon: "trophy" },
  { label: "Contributions (Past Year)", value: "2,847", icon: "graph" },
];

function buildDemoSvg(t: (typeof HERO_THEMES)[number]): string {
  const W = 495;
  const PX = 25;
  const PT = 25;
  const TH = 30;
  const G = 5;
  const RH = 25;
  const PB = 20;
  const RR = 40;
  const ringArea = RR * 2 + 30;
  const sY = PT + TH + G;
  const sH = DEMO_STATS.length * RH;
  const cH = Math.max(sY + sH + PB, ringArea + PT + TH + G + PB);
  const sW = W - PX - ringArea - 10;
  const rCx = W - PX - RR - 5;
  const rCy = sY + sH / 2;
  const circ = 2 * Math.PI * RR;
  const off = circ - 0.87 * circ;
  const f = "font-family:'Segoe UI',Ubuntu,sans-serif";

  const rows = DEMO_STATS.map((s, i) => {
    const y = sY + i * RH;
    return `<g><svg x="${PX}" y="${y}" width="16" height="16" viewBox="0 0 16 16" fill="${t.icon}"><path d="${ICONS[s.icon]}"/></svg><text x="${PX + 25}" y="${y + 12.5}" style="font-size:14px;font-weight:400;${f};fill:${t.text}">${s.label}:</text><text x="${sW}" y="${y + 12.5}" style="font-size:14px;font-weight:700;${f};fill:${t.text}" text-anchor="end">${s.value}</text></g>`;
  }).join("");

  return `<svg width="${W}" height="${cH}" viewBox="0 0 ${W} ${cH}" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" rx="4.5" ry="4.5" width="${W - 1}" height="${cH - 1}" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/><text x="${PX}" y="${PT + 18}" style="font-size:18px;font-weight:600;${f};fill:${t.title}">Your GitHub Stats</text>${rows}<circle cx="${rCx}" cy="${rCy}" r="${RR}" fill="none" stroke="${t.border}" stroke-width="5" opacity="0.3"/><circle cx="${rCx}" cy="${rCy}" r="${RR}" fill="none" stroke="${t.title}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}" transform="rotate(-90 ${rCx} ${rCy})"/><text x="${rCx}" y="${rCy - 6}" text-anchor="middle" style="font-size:20px;font-weight:800;${f};fill:${t.title}">A+</text><text x="${rCx}" y="${rCy + 12}" text-anchor="middle" style="font-size:11px;font-weight:600;${f};fill:${t.text};opacity:0.7">87%</text></svg>`;
}

export default function HeroCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((p) => (p + 1) % HERO_THEMES.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  const uris = useMemo(
    () =>
      HERO_THEMES.map(
        (t) =>
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildDemoSvg(t))}`,
      ),
    [],
  );

  const theme = HERO_THEMES[index];

  return (
    <div className="relative mx-auto" style={{ maxWidth: 495 }}>
      {uris.map((uri, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={uri}
          alt={i === index ? "Demo stats card" : ""}
          className={`w-full transition-opacity duration-700 ease-in-out ${
            i === 0 ? "relative" : "absolute inset-0"
          }`}
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      <div className="flex items-center justify-center gap-2 mt-5">
        {HERO_THEMES.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setIndex(i)}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300 ring-1 ring-white/10"
            style={{
              backgroundColor: i === index ? t.title : "#30363d",
              transform: i === index ? "scale(1.4)" : "scale(1)",
              boxShadow: i === index ? `0 0 8px ${t.title}60` : "none",
            }}
            aria-label={`Theme: ${t.key}`}
          />
        ))}
      </div>
      <p
        className="text-center mt-2 text-xs font-medium tracking-wide transition-colors duration-500"
        style={{ color: theme.title }}
      >
        {theme.key}
      </p>
    </div>
  );
}
