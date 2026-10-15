import { renderErrorCard } from "../svg-primitives";
import { languageChartRegistry } from "./registry";
import { LanguageStat, LangChartOptions } from "@/lib/types";
import { ThemeConfig } from "@/lib/themes/types";

export function renderLanguageChart(
  languages: LanguageStat[],
  theme: ThemeConfig,
  options: LangChartOptions,
): string {
  const topLangs = languages.slice(0, Math.min(options.max_langs, 12));

  if (!topLangs.length) {
    return renderErrorCard("No language data available for this user.", theme);
  }

  const totalSize = topLangs.reduce((sum, lang) => sum + lang.size, 0);

  // A zero (or otherwise non-positive) total has no shares to chart: bar,
  // horizontal_list and vertical_list would divide by it and emit NaN
  // geometry. Render the same empty-data card an empty list gets.
  if (!(totalSize > 0)) {
    return renderErrorCard("No language data available for this user.", theme);
  }

  return languageChartRegistry[options.layout](
    topLangs,
    totalSize,
    theme,
    options,
  );
}
