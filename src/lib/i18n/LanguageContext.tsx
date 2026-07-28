"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { dict, type LangCode, languages } from "./translations";

interface LanguageContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: string, fallback?: string) => string;
  languages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key, fb) => fb ?? key,
  languages,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", code);
    }
  }, []);

  // Initialize from localStorage
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lang") as LangCode | null;
      if (saved && languages.some(l => l.code === saved)) {
        setLangState(saved);
      }
    }
  });

  const t = useCallback(
    (key: string, fallback?: string) => {
      return dict[key]?.[lang] ?? fallback ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
