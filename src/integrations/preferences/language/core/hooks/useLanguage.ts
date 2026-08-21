// src/integrations/preferences/core/language/hooks/useLanguage.ts
/**
 * Language Preference Hook (Core)
 *
 * Manages language preference using localStorage with cross-tab sync.
 * Single source of truth for language application to prevent infinite reload loops.
 */

import { useEffect, useRef } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
  defaultLanguage,
  getLanguageByCode,
} from "../utils/languages";
// Language type available via ../utils/languages if needed

export function useLanguage() {
  const defaultCode = defaultLanguage?.code || "en";

  const [languageCode, setLanguageCode] = useLocalStorage<string>(
    "user-language",
    defaultCode,
    {
      raw: true,
      syncTabs: true,
      validate: (code) => !!getLanguageByCode?.(code),
    }
  );

  const prevLanguageRef = useRef(languageCode);

  // Apply language whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ✅ FIX: Only apply if language actually changed
    if (prevLanguageRef.current === languageCode) {
      console.log(`🔒 Language unchanged (${languageCode}), skipping apply`);
      return;
    }
    prevLanguageRef.current = languageCode;

    const applyFn = (window as any).applyGoogleTranslateLanguage;

    if (!applyFn) {
      console.warn("⚠️  Google Translate not ready yet");
      return;
    }

    console.log(`🔄 Language changed to: ${languageCode}`);
    applyFn(languageCode);
  }, [languageCode]);

  const changeLanguage = (code: string) => {
    const language = getLanguageByCode?.(code);
    if (!language) {
      console.error(`Invalid language code: ${code}`);
      return;
    }

    console.log(`📝 User selected language: ${code}`);
    setLanguageCode(code);
  };

  const resetLanguage = () => {
    console.log("🔄 Resetting to default language");
    setLanguageCode(defaultCode);
  };

  const currentLanguage = getLanguageByCode?.(languageCode) ||
    defaultLanguage || {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸",
    };

  return {
    currentLanguage,
    languageCode,
    changeLanguage,
    resetLanguage,
  };
}
