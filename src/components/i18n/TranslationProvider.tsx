'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'bn';

type TranslationContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  languages: Array<{ code: SupportedLanguage; label: string }>;
};

const LANG_STORAGE_KEY = 'nationtrack.language';
const translationCache = new Map<string, string>();

const TranslationContext = createContext<TranslationContextValue | null>(null);

const supportedLanguages: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'bn', label: 'Bengali' },
];

const shouldTranslateText = (text: string) => {
  const value = text.trim();
  if (!value) return false;
  if (value.length < 2 || value.length > 160) return false;
  return /[A-Za-z]/.test(value);
};

const translateText = async (text: string, language: SupportedLanguage) => {
  const cacheKey = `${language}:${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang: language }),
  });

  if (!response.ok) {
    return text;
  }

  const result = (await response.json()) as { translatedText?: string };
  const translated = result.translatedText?.trim() || text;
  translationCache.set(cacheKey, translated);
  return translated;
};

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const originalTextsRef = useRef(new Map<Text, string>());

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLanguage | null;
    if (saved && supportedLanguages.some((item) => item.code === saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(LANG_STORAGE_KEY, nextLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const restoreEnglish = () => {
      originalTextsRef.current.forEach((original, node) => {
        if (node.isConnected) {
          node.nodeValue = original;
        }
      });
    };

    if (language === 'en') {
      restoreEnglish();
      return;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (
          parent.closest('[data-no-translate="true"]') ||
          ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'SELECT', 'OPTION'].includes(
            parent.tagName
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return shouldTranslateText(node.nodeValue ?? '')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    const nodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      nodes.push(current as Text);
      current = walker.nextNode();
    }

    let cancelled = false;

    const run = async () => {
      await Promise.all(
        nodes.map(async (node) => {
          const baseText = originalTextsRef.current.get(node) ?? node.nodeValue ?? '';
          if (!originalTextsRef.current.has(node)) {
            originalTextsRef.current.set(node, baseText);
          }
          const translated = await translateText(baseText, language);
          if (!cancelled && node.isConnected) {
            node.nodeValue = translated;
          }
        })
      );
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [language, pathname]);

  const contextValue = useMemo<TranslationContextValue>(
    () => ({
      language,
      setLanguage,
      languages: supportedLanguages,
    }),
    [language, setLanguage]
  );

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider.');
  }
  return context;
}
