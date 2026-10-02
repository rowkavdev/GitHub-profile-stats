import type { Metadata } from "next";
import Link from "next/link";
import {
  readStatusReport,
  formatMilliseconds,
  formatPercentage,
  getStatusCopy,
} from "@/lib/status";
import { SITE, SITE_ROUTES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Status",
  description: `Live uptime and response-time checks for ${SITE.name}.`,
  alternates: {
    canonical: SITE_ROUTES.status,
  },
  openGraph: {
    title: `${SITE.name} Service Status`,
    description: `Live uptime and response-time checks for ${SITE.name}.`,
    url: SITE_ROUTES.status,
  },
};

export const dynamic = "force-dynamic";

function statusTone(status: string): string {
  switch (status) {
    case "operational":
      return "text-[#3fb950]";
    case "degraded":
      return "text-[#d29922]";
    case "down":
      return "text-[#f85149]";
    default:
      return "text-[#8b949e]";
  }
}

function statusDot(status: string): string {
  switch (status) {
    case "operational":
      return "bg-[#3fb950] shadow-[0_0_20px_rgba(63,185,80,0.35)]";
    case "degraded":
      return "bg-[#d29922] shadow-[0_0_20px_rgba(210,153,34,0.25)]";
    case "down":
      return "bg-[#f85149] shadow-[0_0_20px_rgba(248,81,73,0.25)]";
    default:
      return "bg-[#8b949e]";
  }
}

function responseTone(ms: number | null): string {
  if (ms === null) return "text-[#8b949e]";
  if (ms < 600) return "text-[#3fb950]";
  if (ms < 1500) return "text-[#d29922]";
  return "text-[#f85149]";
}

export default async function StatusPage() {
  const report = await readStatusReport();
  if (!report) return <main className="mx-auto max-w-6xl px-6 py-16"><h1 className="text-4xl font-bold">Service status</h1><p className="mt-4">No status report is available yet. Scheduled collection may not be configured.</p></main>;
  const copy = getStatusCopy(report.overall.status);

  return (
    <main className="min-h-screen">
      <header className="border-b border-[#21262d] bg-[#010409]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-[#58a6ff]">{SITE.name}</span> status
          </span>
          <Link
            href="/"
            className="text-sm text-[#8b949e] transition-colors hover:text-[#c9d1d9]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="border-b border-[#21262d] bg-gradient-to-b from-[#010409] to-[#0d1117]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Service status
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[#8b949e]">
            Live uptime and response-time checks for the main site and public
            endpoints. This page uses recent probe samples and the same visual
            style as the rest of the site.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <article className="rounded-lg border border-[#30363d] bg-[#161b22] p-5">
              <p className="text-xs uppercase tracking-wider text-[#8b949e]">
                Current status
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${statusDot(report.overall.status)}`} />
                <h2 className={`text-2xl font-semibold ${statusTone(report.overall.status)}`}>
                  {copy.label}
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#8b949e]">
                {copy.description}
              </p>
            </article>

            <article className="rounded-lg border border-[#30363d] bg-[#161b22] p-5">
              <p className="text-xs uppercase tracking-wider text-[#8b949e]">
                24h uptime
              </p>
              <p className="mt-3 text-3xl font-bold text-white">
                {formatPercentage(report.overall.uptime24h)}
              </p>
              <p className="mt-2 text-sm text-[#8b949e]">Rolling availability</p>
            </article>

            <article className="rounded-lg border border-[#30363d] bg-[#161b22] p-5">
              <p className="text-xs uppercase tracking-wider text-[#8b949e]">
                7d uptime
              </p>
              <p className="mt-3 text-3xl font-bold text-white">
                {formatPercentage(report.overall.uptime7d)}
              </p>
              <p className="mt-2 text-sm text-[#8b949e]">Seven-day window</p>
            </article>

            <article className="rounded-lg border border-[#30363d] bg-[#161b22] p-5">
              <p className="text-xs uppercase tracking-wider text-[#8b949e]">
                Avg response
              </p>
              <p className="mt-3 text-3xl font-bold text-white">
                {formatMilliseconds(report.overall.averageResponseMs)}
              </p>
              <p className="mt-2 text-sm text-[#8b949e]">
                {report.overall.healthyCount}/{report.overall.totalCount} healthy
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-[#21262d]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-2 border-b border-[#21262d] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Endpoints</h2>
              <p className="mt-2 text-sm text-[#8b949e]">
                Response status, uptime, and latency for each public route.
              </p>
            </div>
            <p className="text-sm text-[#8b949e]">
              Checked {new Date(report.checkedAt).toLocaleString()}
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-[#30363d]">
            <table className="w-full text-sm">
              <thead className="bg-[#161b22] text-left text-[#8b949e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Endpoint</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">24h uptime</th>
                  <th className="px-4 py-3 font-medium">Response</th>
                  <th className="px-4 py-3 font-medium">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {report.endpoints.map((endpoint) => (
                  <tr key={endpoint.key} className="hover:bg-[#161b22]/50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-[#c9d1d9]">{endpoint.label}</div>
                      <div className="mt-1 break-all text-xs text-[#8b949e]">
                        {endpoint.path}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(endpoint.ok ? "operational" : "down")}`}
                      >
                        {endpoint.ok ? `Up ${endpoint.status ?? ""}` : "Down"}
                      </span>
                      {endpoint.error ? (
                        <p className="mt-2 text-xs text-[#8b949e]">
                          {endpoint.error}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top text-[#c9d1d9]">
                      {formatPercentage(endpoint.uptime24h)}
                    </td>
                    <td className={`px-4 py-3 align-top font-medium ${responseTone(endpoint.responseTimeMs)}`}>
                      {formatMilliseconds(endpoint.responseTimeMs)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <a
                        href={endpoint.url}
                        className="text-[#58a6ff] transition-colors hover:text-[#79c0ff]"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-sm text-[#8b949e]">
            Observed uptime is derived from recent probe samples stored in Redis
            when available.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#21262d] bg-[#010409]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 sm:flex-row sm:items-center">
          <span className="text-sm text-[#484f58]">
            {SITE.name} status and uptime overview.
          </span>
          <Link
            href={SITE_ROUTES.home}
            className="text-sm text-[#8b949e] transition-colors hover:text-[#c9d1d9]"
          >
            Back to the main page
          </Link>
        </div>
      </footer>
    </main>
  );
}
