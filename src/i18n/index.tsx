import * as React from "react";
import { es } from "./translations";
import { Locale } from "../desktop-api";

const normalizeLocale = (raw: string | null | undefined): Locale =>
  (raw ?? "").toLowerCase().split("-")[0] === "es" ? "es" : "en";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // t(message, vars): looks up `message` (English source string) in the active
  // locale dictionary; falls back to English when missing. `{var}` placeholders
  // in the (possibly translated) string are replaced with the given vars.
  // no ICU/plural rules; the `{var}` replace covers the one
  // parameterized string we have. Add a real pluralization lib when more.
  t: (message: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = React.createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (message) => message,
});

export { I18nContext };

export const I18nProvider: React.FC<{}> = ({ children }) => {
  const [locale, setLocaleState] = React.useState<Locale>(() =>
    normalizeLocale(typeof navigator !== "undefined" ? navigator.language : "")
  );

  React.useEffect(() => {
    const desktopApi = window.desktopApi;
    if (!desktopApi) return;
    // The main process owns the resolved locale (system locale or user choice
    // persisted in userData); the menu also switches it live.
    desktopApi.getLocale().then((systemLocale) => {
      setLocaleState(normalizeLocale(systemLocale));
    });
    return desktopApi.onLocaleChanged((next) => {
      setLocaleState(normalizeLocale(next));
    });
  }, []);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        window.desktopApi?.setLocale(next);
      },
      t: (message, vars) => {
        const translated = locale === "es" ? es[message] ?? message : message;
        if (!vars) return translated;
        return translated.replace(/\{(\w+)\}/g, (_, key) =>
          vars[key] === undefined ? `{${key}}` : String(vars[key])
        );
      },
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => React.useContext(I18nContext);
