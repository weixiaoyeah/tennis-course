import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { translations, Language, TranslationKeys } from './translations';

const STORAGE_KEY = '@app_language';

// 阿拉伯语需要 RTL 布局
function applyRTL(lang: Language) {
  if (I18nManager.isRTL !== (lang === 'ar')) {
    I18nManager.forceRTL(lang === 'ar');
    I18nManager.allowRTL(true);
  }
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 获取嵌套属性的值
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('zh');
  const [isLoaded, setIsLoaded] = useState(false);

  // 从存储加载语言设置
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'zh' || saved === 'en' || saved === 'ar') {
          applyRTL(saved);
          setLanguageState(saved as Language);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  // 保存语言设置
  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
      applyRTL(lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, []);

  // 切换语言（zh -> en -> ar -> zh 循环）
  const toggleLanguage = useCallback(() => {
    const order: Language[] = ['zh', 'en', 'ar'];
    const next = order[(order.indexOf(language) + 1) % order.length];
    setLanguage(next);
  }, [language, setLanguage]);

  // 翻译函数
  const t = useCallback(
    (key: string): string => {
      const value = getNestedValue(translations, key);
      if (typeof value === 'object' && value !== null) {
        return value[language] || key;
      }
      return String(value);
    },
    [language]
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// 便捷的翻译 hook
export function useTranslation() {
  const { t, language, toggleLanguage } = useLanguage();
  return { t, language, toggleLanguage };
}
