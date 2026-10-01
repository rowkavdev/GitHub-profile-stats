import { ThemeConfig, ThemeSurface } from "../types";
import { THEME_DEFINITIONS } from ".";

export const themes: Record<string, ThemeConfig> = Object.fromEntries(
  THEME_DEFINITIONS.map((definition) => [definition.key, Object.fromEntries(
    Object.entries(definition).filter(([key]) => key !== "key" && key !== "showIn"),
  ) as ThemeConfig]),
);

function themesFor(surface: ThemeSurface) {
  return THEME_DEFINITIONS.filter((t) => t.showIn.includes(surface));
}

export const THEMES = themesFor("visual_builder").map(({ key, name }) => ({
  key,
  name,
}));

export const HERO_THEMES = themesFor("hero").map(
  ({ key, bg, title, text, icon, border }) => ({
    key,
    bg,
    title,
    text,
    icon,
    border,
  }),
);
