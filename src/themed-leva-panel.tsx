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
    return {
      colors: {
        elevation1: c["color-surface-hover"] ?? fallback.elevation1,
        elevation2: c["color-surface"] ?? fallback.elevation2,
        elevation3: c["color-surface"] ?? fallback.elevation3,
        accent1: c["color-border"] ?? fallback.accent1,
        accent2: c["color-surface-hover"] ?? fallback.accent2,
        accent3: c["color-border"] ?? fallback.accent3,
        highlight1: c["color-border"] ?? fallback.highlight1,
        highlight2: c["color-text"] ?? fallback.highlight2,
        highlight3: c["color-text"] ?? fallback.highlight3,
      },
      fonts: DEFAULT_LEVA_THEME.fonts,
    };
  }, [cssVars]);

  return <LevaPanel {...props} theme={theme} />;
};
