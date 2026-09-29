import { ThemeConfig } from "./types";
import { themes } from "./configs/registry";

export function resolveTheme(
  themeName: string,
  overrides: {
    bg?: string;
    text?: string;
    title_color?: string;
    icon_color?: string;
    border_color?: string;
  },
): ThemeConfig {
  const base = Object.hasOwn(themes, themeName) ? themes[themeName] : themes.default;
  return {
    ...base,
    bg: overrides.bg ? `#${overrides.bg}` : base.bg,
    text: overrides.text ? `#${overrides.text}` : base.text,
    title: overrides.title_color ? `#${overrides.title_color}` : base.title,
    icon: overrides.icon_color ? `#${overrides.icon_color}` : base.icon,
    border: overrides.border_color ? `#${overrides.border_color}` : base.border,
  };
}
