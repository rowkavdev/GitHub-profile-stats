"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatLayoutLabel } from "@/lib/svg/languages/utils";
import { themes } from "@/lib/themes/configs/registry";
import { usePreviewOrigin } from "./utils/origin";
import { LANG_CHART_LAYOUTS } from "@/lib/types";
import { CardOpts, LangOpts, MiniOpts, SparkOpts } from "./types";
import {
  appendCardParams,
  appendCardOrderParams,
  appendLangsParams,
  appendMiniParams,
  appendSparklineParams,
} from "./utils/embedUrl";
import {
  CARD_DEFAULTS,
  LANG_DEFAULTS,
  MINI_DEFAULTS,
  SPARK_DEFAULTS,
} from "./configs";
import { STAT_OPTIONS, EMBED_LABELS, MINI_METRICS } from "./configs";
import { EmbedType } from "./types";
import { usePatchState } from "./utils/state";
import BadgeStylePicker from "./BadgeStylePicker";

export default function CardPreview() {
  const [embedType, setEmbedType] = useState<EmbedType>("card");
  const [username, setUsername] = useState("octocat");
  const [theme, setTheme] = useState("default");
  const [advancedMode, setAdvancedMode] = useState(false);

  const [card, patchCard] = usePatchState<CardOpts>(CARD_DEFAULTS);
  const [langs, patchLangs] = usePatchState<LangOpts>(LANG_DEFAULTS);
  const [mini, patchMini] = usePatchState<MiniOpts>(MINI_DEFAULTS);
  const [spark, patchSpark] = usePatchState<SparkOpts>(SPARK_DEFAULTS);

  const [hiddenStats, setHiddenStats] = useState<string[]>([]);
  const [statsOrder, setStatsOrder] = useState<string[]>(
    STAT_OPTIONS.map((s) => s.key),
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [output, setOutput] = useState({
    embedUrl: "",
    imgUrl: "",
    embedLabel: EMBED_LABELS.card as string,
    markdownCode: "",
    htmlCode: "",
    loading: false,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const origin = usePreviewOrigin();

  const toggleStat = useCallback((key: string) => {
    setHiddenStats((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  }, []);

  const moveStat = useCallback((from: number, to: number) => {
    setStatsOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const buildEmbedUrl = useCallback(() => {
    if (!username.trim()) return "";

    const base = `${origin}/api/${embedType}`;
    const p = new URLSearchParams();
    p.set("username", username.trim());
    if (theme !== "default") p.set("theme", theme);

    switch (embedType) {
      case "card":
        appendCardParams(p, card);
        appendCardOrderParams(p, statsOrder, hiddenStats);
        break;
      case "langs":
        appendLangsParams(p, langs, card.customTitle);
        break;
      case "mini":
        appendMiniParams(p, mini);
        break;
      case "sparkline":
        appendSparklineParams(p, spark);
        break;
    }

    return `${base}?${p.toString()}`;
  }, [
    card,
    embedType,
    hiddenStats,
    langs,
    mini,
    origin,
    spark,
    statsOrder,
    theme,
    username,
  ]);

  useEffect(() => {
    const url = buildEmbedUrl();
    const label = EMBED_LABELS[embedType];

    if (!url) {
      setOutput({
        embedUrl: "",
        imgUrl: "",
        embedLabel: label,
        markdownCode: "",
        htmlCode: "",
        loading: false,
      });
      return;
    }

    setOutput((prev) => ({
      ...prev,
      embedUrl: url,
      embedLabel: label,
      markdownCode: `![${label}](${url})`,
      htmlCode: `<img src="${url}" alt="${label}" />`,
    }));

    const timeout = setTimeout(() => {
      const sep = url.includes("?") ? "&" : "?";
      setOutput((prev) => ({
        ...prev,
        loading: true,
        imgUrl: `${url}${sep}cache=${Date.now()}`,
      }));
    }, 500);

    return () => clearTimeout(timeout);
  }, [buildEmbedUrl, embedType]);

  const copyToClipboard = useCallback((text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1200);
    });
  }, []);

  const themeEntries = useMemo(() => Object.entries(themes), []);

  const { embedUrl, imgUrl, embedLabel, markdownCode, htmlCode, loading } =
    output;

  return (
    <section id="try" className="border-b border-[#21262d] bg-[#0d1117]">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Try it out</h2>
            <p className="text-sm text-[#8b949e]">
              Generate your embed, preview it, then copy a single line.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8b949e] bg-[#0b1117] border border-[#30363d] rounded-lg px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#238636]" />
            Live preview refreshes automatically
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Left: inputs */}
          <div className="space-y-5 animate-slide-up">
            <div>
              <label className="label-text">Embed Type</label>
              <div className="mt-2 inline-flex rounded-xl border border-[#30363d] bg-[#0d1117] p-[3px] flex-wrap">
                {(
                  [
                    { key: "card", label: "Stats Card" },
                    { key: "langs", label: "Languages" },
                    { key: "mini", label: "Mini Badge" },
                    { key: "sparkline", label: "Sparkline" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setEmbedType(opt.key);
                      if (opt.key !== "card") setAdvancedMode(false);
                    }}
                    className={`px-4 py-1.5 rounded-[9px] text-xs font-semibold tracking-wide transition-all duration-200 ease-out m-[2px] ${
                      embedType === opt.key
                        ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]"
                        : "text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-text">GitHub Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="octocat"
                className="input-field"
              />
            </div>

            {embedType === "card" && (
              <>
                <div>
                  <label className="label-text">
                    Custom Title{" "}
                    <span className="text-[#484f58] font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={card.customTitle}
                    onChange={(e) => patchCard({ customTitle: e.target.value })}
                    placeholder="My Awesome Stats"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-text">
                    Border Radius:{" "}
                    <span className="text-[#58a6ff] font-semibold">
                      {card.borderRadius}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={card.borderRadius}
                    onChange={(e) =>
                      patchCard({ borderRadius: e.target.value })
                    }
                    className="w-full accent-[#58a6ff] mt-1"
                  />
                </div>

                <div>
                  <label className="label-text">Layout</label>
                  <div className="mt-2 inline-flex rounded-xl border border-[#30363d] bg-[#0d1117] p-[3px]">
                    {(["default", "compact"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => patchCard({ size: s })}
                        className={`px-5 py-1.5 rounded-[9px] text-xs font-semibold tracking-wide transition-all duration-200 ease-out ${
                          card.size === s
                            ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]"
                            : "text-[#8b949e] hover:text-[#c9d1d9]"
                        }`}
                      >
                        {s === "default" ? "Standard" : "Compact"}
                      </button>
                    ))}
                  </div>
                </div>

                {card.size === "compact" && (
                  <div className="space-y-4 rounded-xl border border-[#30363d]/60 bg-[#0d1117] px-4 py-4">
                    <div>
                      <label className="label-text">Stats to show</label>
                      <div className="mt-2 inline-flex rounded-xl border border-[#30363d] bg-[#161b22] p-[3px]">
                        {([3, 4, 6] as const).map((n) => (
                          <button
                            key={n}
                            onClick={() => patchCard({ compactCount: n })}
                            className={`px-4 py-1.5 rounded-[9px] text-xs font-semibold tracking-wide transition-all duration-200 ease-out ${
                              card.compactCount === n
                                ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]"
                                : "text-[#8b949e] hover:text-[#c9d1d9]"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#484f58]">
                        Shows the first {card.compactCount} visible stats in
                        order
                      </p>
                    </div>
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={card.showEmoji}
                        onChange={(e) =>
                          patchCard({ showEmoji: e.target.checked })
                        }
                        className="accent-[#58a6ff] w-4 h-4 rounded"
                      />
                      Use emojis instead of icons
                    </label>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {(
                    [
                      { label: "Show Icons", key: "showIcons" },
                      { label: "Show Ring", key: "showRing" },
                      { label: "Hide Border", key: "hideBorder" },
                      { label: "Hide Title", key: "hideTitle" },
                    ] as const
                  ).map((t) => (
                    <label key={t.key} className="toggle-label">
                      <input
                        type="checkbox"
                        checked={card[t.key]}
                        onChange={(e) =>
                          patchCard({
                            [t.key]: e.target.checked,
                          } as Partial<CardOpts>)
                        }
                        className="accent-[#58a6ff] w-4 h-4 rounded"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <label className="label-text mb-0">Advanced Options</label>
                  <button
                    type="button"
                    onClick={() => setAdvancedMode((v) => !v)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold border transition-all duration-200 ${
                      advancedMode
                        ? "bg-[#21262d] border-[#58a6ff]/50 text-white"
                        : "bg-transparent border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    {advancedMode ? "Hide advanced" : "Show advanced"}
                  </button>
                </div>

                {advancedMode && (
                  <div className="space-y-3 rounded-xl border border-[#30363d]/60 bg-[#0d1117] px-4 py-4">
                    <div className="flex items-center justify-between">
                      <label className="label-text mb-0">
                        Reorder & hide stats
                      </label>
                      <span className="text-[11px] text-[#484f58]">
                        Drag to reorder, click to hide
                      </span>
                    </div>
                    <div className="space-y-2">
                      {statsOrder.map((key, index) => {
                        const stat = STAT_OPTIONS.find((s) => s.key === key);
                        if (!stat) return null;
                        const hidden = hiddenStats.includes(key);
                        return (
                          <div
                            key={key}
                            className={`flex items-center justify-between gap-3 rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#c9d1d9] ${
                              dragOverIndex === index
                                ? "border-[#58a6ff]/60 bg-[#0f1621]"
                                : ""
                            }`}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (dragOverIndex !== index)
                                setDragOverIndex(index);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragIndex !== null && dragIndex !== index)
                                moveStat(dragIndex, index);
                              setDragIndex(null);
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
                              setDragIndex(null);
                              setDragOverIndex(null);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="cursor-grab text-[#8b949e]">
                                ⋮⋮
                              </span>
                              <span
                                className={
                                  hidden ? "line-through text-[#484f58]" : ""
                                }
                              >
                                {stat.label}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleStat(key)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                                hidden
                                  ? "border-[#30363d] text-[#8b949e] bg-transparent"
                                  : "border-[#58a6ff]/40 text-[#58a6ff] bg-[#58a6ff]/10"
                              }`}
                            >
                              {hidden ? "Hidden" : "Visible"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {embedType === "langs" && (
              <div className="space-y-4 rounded-xl border border-[#30363d]/60 bg-[#0d1117] px-4 py-4">
                <div>
                  <label className="label-text">Layout</label>
                  <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl border border-[#30363d] bg-[#161b22] p-1.5">
                    {" "}
                    {LANG_CHART_LAYOUTS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => patchLangs({ layout: opt })}
                        className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ease-out ${
                          langs.layout === opt
                            ? "bg-[#21262d] text-white shadow-sm border border-[#30363d]"
                            : "text-[#8b949e] hover:text-[#c9d1d9] border border-transparent"
                        }`}
                      >
                        {formatLayoutLabel(opt)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-text">
                    Max languages:{" "}
                    <span className="text-[#58a6ff] font-semibold">
                      {langs.maxLangs}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={langs.maxLangs}
                    onChange={(e) =>
                      patchLangs({ maxLangs: Number(e.target.value) })
                    }
                    className="w-full accent-[#58a6ff] mt-1"
                  />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {(
                    [
                      { label: "Hide Border", key: "hideBorder" },
                      { label: "Hide Title", key: "hideTitle" },
                    ] as const
                  ).map((t) => (
                    <label key={t.key} className="toggle-label">
                      <input
                        type="checkbox"
                        checked={langs[t.key]}
                        onChange={(e) =>
                          patchLangs({
                            [t.key]: e.target.checked,
                          } as Partial<LangOpts>)
                        }
                        className="accent-[#58a6ff] w-4 h-4 rounded"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {embedType === "mini" && (
              <div className="space-y-4 rounded-xl border border-[#30363d]/60 bg-[#0d1117] px-4 py-4">
                <div>
                  <label className="label-text">Metric</label>
                  <select
                    value={mini.metric}
                    onChange={(e) => patchMini({ metric: e.target.value })}
                    className="input-field"
                  >
                    {MINI_METRICS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Custom Label (optional)</label>
                  <input
                    type="text"
                    value={mini.label}
                    onChange={(e) => patchMini({ label: e.target.value })}
                    placeholder="Stars"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">
                    Accent Colour (hex, no #)
                  </label>
                  <input
                    type="text"
                    value={mini.color}
                    onChange={(e) => patchMini({ color: e.target.value })}
                    placeholder="f59e0b"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">Badge Style</label>
                  <BadgeStylePicker
                    value={mini.style}
                    onChange={(style) => patchMini({ style })}
                  />
                </div>
              </div>
            )}

            {embedType === "sparkline" && (
              <div className="space-y-4 rounded-xl border border-[#30363d]/60 bg-[#0d1117] px-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-text">Days (7-90)</label>
                    <input
                      type="number"
                      min={7}
                      max={90}
                      value={spark.days}
                      onChange={(e) => patchSpark({ days: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">Width</label>
                    <input
                      type="number"
                      min={180}
                      max={800}
                      value={spark.width}
                      onChange={(e) => patchSpark({ width: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">Height</label>
                    <input
                      type="number"
                      min={40}
                      max={240}
                      value={spark.height}
                      onChange={(e) => patchSpark({ height: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">Title (optional)</label>
                    <input
                      type="text"
                      value={spark.title}
                      onChange={(e) => patchSpark({ title: e.target.value })}
                      placeholder="Last 30 days"
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-text">Line Colour (hex)</label>
                    <input
                      type="text"
                      value={spark.lineColor}
                      onChange={(e) =>
                        patchSpark({ lineColor: e.target.value })
                      }
                      placeholder="58a6ff"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">Fill Colour (hex)</label>
                    <input
                      type="text"
                      value={spark.fillColor}
                      onChange={(e) =>
                        patchSpark({ fillColor: e.target.value })
                      }
                      placeholder="58a6ff"
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={spark.hideBorder}
                      onChange={(e) =>
                        patchSpark({ hideBorder: e.target.checked })
                      }
                      className="accent-[#58a6ff] w-4 h-4 rounded"
                    />
                    Hide Border
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="label-text">Border Radius</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={spark.borderRadius}
                      onChange={(e) =>
                        patchSpark({ borderRadius: e.target.value })
                      }
                      className="w-24 rounded border border-[#30363d] bg-[#161b22] px-3 py-1 text-sm text-[#c9d1d9]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
            <label className="label-text">Live Preview</label>
            <div className="preview-box">
              {imgUrl ? (
                <div className="relative w-full flex items-center justify-center">
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#161b22]/60 rounded-lg z-10">
                      <div className="w-5 h-5 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={imgUrl}
                    src={imgUrl}
                    alt={`${embedLabel} preview`}
                    className="max-w-full transition-opacity duration-500 ease-out"
                    style={{ opacity: loading ? 0.4 : 1 }}
                    onLoad={() =>
                      setOutput((prev) => ({ ...prev, loading: false }))
                    }
                    onError={() =>
                      setOutput((prev) => ({ ...prev, loading: false }))
                    }
                  />
                </div>
              ) : (
                <p className="text-[#484f58] text-sm">
                  Enter a username to see the preview
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          className="grid gap-4 sm:grid-cols-3 animate-slide-up"
          style={{ animationDelay: "160ms" }}
        >
          {[
            { label: "Link", code: embedUrl, id: "link" },
            { label: "Markdown", code: markdownCode, id: "md" },
            { label: "HTML", code: htmlCode, id: "html" },
          ].map((block) => (
            <div key={block.id} className="embed-block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">
                  {block.label}
                </span>
                <button
                  onClick={() => copyToClipboard(block.code, block.id)}
                  disabled={!embedUrl}
                  className="copy-btn"
                >
                  {copiedField === block.id ? (
                    <span className="text-[#3fb950] transition-colors duration-200">
                      Copied!
                    </span>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>
              <pre className="text-xs text-[#c9d1d9] whitespace-pre-wrap break-all leading-relaxed">
                {block.code}
              </pre>
            </div>
          ))}
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "240ms" }}>
          <label className="label-text mb-3 block">Theme</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {themeEntries.map(([key, t]) => {
              const isActive = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className="theme-card group"
                  style={{
                    borderColor: isActive ? t.title : "transparent",
                    boxShadow: isActive ? `0 0 16px ${t.title}25` : "none",
                  }}
                >
                  <div
                    className="rounded-lg p-3 transition-all duration-300 ease-out"
                    style={{ backgroundColor: t.bg }}
                  >
                    <div
                      className="text-xs font-semibold mb-2 truncate transition-colors duration-300"
                      style={{ color: t.title }}
                    >
                      {t.name}
                    </div>
                    <div className="flex gap-1.5">
                      {[t.title, t.icon, t.text, t.border].map((c, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full border border-white/10 transition-transform duration-300 ease-out group-hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div
                    className="mt-1 text-[10px] text-center truncate transition-colors duration-300"
                    style={{ color: isActive ? t.title : "#6e7681" }}
                  >
                    {key}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
