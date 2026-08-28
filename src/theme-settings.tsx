import * as React from "react";
import { buildUrl } from "./public-url";

export type ThemeInfo = { id: string; name: string };

const DEFAULT_THEME = "default";
const STORAGE_KEY = "settings.theme";

const readThemeId = (): string => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (typeof raw === "string" && raw.length > 0) return raw;
  } catch (e) {}
  return DEFAULT_THEME;
};

// Themes are plain CSS files; Leva needs JS colors, so parse the few vars it
// uses out of the active theme's stylesheet.
const parseCssVars = (css: string): Record<string, string> => {
  const vars: Record<string, string> = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
};

type ContextValue = {
  themeId: string;
  setThemeId: (id: string) => void;
  themes: ThemeInfo[];
  cssVars: Record<string, string>;
};

const Context = React.createContext<ContextValue>({
  themeId: DEFAULT_THEME,
  setThemeId: () => {},
  themes: [],
  cssVars: {},
});

export const ThemeSettingsProvider: React.FC<{}> = ({ children }) => {
  const [themeId, setThemeIdState] = React.useState(readThemeId);
  const [themes, setThemes] = React.useState<ThemeInfo[]>([]);
  const [cssText, setCssText] = React.useState<string | null>(null);
  const [cssVars, setCssVars] = React.useState<Record<string, string>>({});

  const applyTheme = React.useCallback((id: string) => {
    fetch(buildUrl(`/themes/${encodeURIComponent(id)}`))
      .then((res) =>
        res.ok ? res.text() : Promise.reject(new Error("not found"))
      )
      .then((css) => {
        setCssText(css);
        setCssVars(parseCssVars(css));
      })
      .catch(() => {
        // Fall back to the base :root palette in global-styles.tsx.
        setCssText(null);
        setCssVars({});
      });
  }, []);

  React.useEffect(() => {
    fetch(buildUrl("/themes"))
      .then((res) => res.json())
      .then((data) => setThemes(data?.data?.themes ?? []))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    applyTheme(themeId);
  }, [themeId, applyTheme]);

  // DM and player windows share the 127.0.0.1 origin, so localStorage changes
  // propagate to the other window via the native storage event.
  React.useEffect(() => {
    const listener = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEY && ev.newValue && ev.newValue !== themeId) {
        setThemeIdState(ev.newValue);
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [themeId]);

  const value = React.useMemo<ContextValue>(
    () => ({
      themeId,
      setThemeId: (id) => {
        try {
          window.localStorage.setItem(STORAGE_KEY, id);
        } catch (e) {}
        setThemeIdState(id);
      },
      themes,
      cssVars,
    }),
    [themeId, themes, cssVars]
  );

  return (
    <Context.Provider value={value}>
      {cssText ? <style data-theme={themeId}>{cssText}</style> : null}
      {children}
    </Context.Provider>
  );
};

export const useThemeSettings = () => React.useContext(Context);
