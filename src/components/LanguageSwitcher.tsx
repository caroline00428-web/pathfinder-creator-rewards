"use client";

import { useT } from "@/lib/i18n/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useT();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as typeof lang)}
      className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
