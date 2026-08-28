import * as React from "react";
import { LevaPanel } from "leva";
import { useThemeSettings } from "./theme-settings";

const DEFAULT_LEVA_THEME = {
  colors: {
    elevation1: "#f2f2f2",
    elevation2: "#ffffff",
    elevation3: "#f7f7f7",
    accent1: "#ccc",
    accent2: "#e6e6e6",
    accent3: "#ccc",
    highlight1: "#b3b3b3",
    highlight2: "#000",
    highlight3: "#000",
    vivid1: "#ffcc00",
    folderWidgetColor: "#b3b3b3",
    folderTextColor: "#000",
    toolTipBackground: "#f7f7f7",
    toolTipText: "#000",
  },
  fonts: {
    mono: "inherit",
    sans: "inherit",
  },
};

export const ThemedLevaPanel = (
  props: React.ComponentProps<typeof LevaPanel>
) => {
  const { cssVars } = useThemeSettings();
  const theme = React.useMemo(() => {
    const c = cssVars;
    const fallback = DEFAULT_LEVA_THEME.colors;
    const surface = c["color-surface"] ?? fallback.elevation2;
    const surfaceHover = c["color-surface-hover"] ?? fallback.elevation1;
    const border = c["color-border"] ?? fallback.accent1;
    const text = c["color-text"] ?? fallback.highlight2;
    const textMuted = c["color-text-muted"] ?? fallback.highlight1;
    return {
      colors: {
        elevation1: surfaceHover,
        elevation2: surface,
        elevation3: surface,
        accent1: border,
        accent2: surfaceHover,
        accent3: border,
        highlight1: textMuted,
        highlight2: text,
        highlight3: text,
        vivid1: fallback.vivid1,
        folderWidgetColor: textMuted,
        folderTextColor: text,
        toolTipBackground: surfaceHover,
        toolTipText: text,
      },
      fonts: DEFAULT_LEVA_THEME.fonts,
    };
  }, [cssVars]);

  // Leva resolves its root text color ($rootText) as the inherited color, so
  // the panel title follows the theme instead of staying black.
  return (
    <div style={{ color: "var(--color-text)" }}>
      <LevaPanel {...props} theme={theme} />
    </div>
  );
};
