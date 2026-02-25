import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Language, translations, TranslationKeys } from "../constants/translations";

const APP_LANG_KEY = "app_language";

interface LanguageContextValue {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const saved = await AsyncStorage.getItem(APP_LANG_KEY);
                if (saved === "hi" || saved === "en") {
                    setLanguageState(saved);
                }
            } catch (error) {
                console.error("Failed to load language", error);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = useCallback(async (lang: Language) => {
        try {
            setLanguageState(lang);
            await AsyncStorage.setItem(APP_LANG_KEY, lang);
        } catch (error) {
            console.error("Failed to save language", error);
        }
    }, []);

    const t = useCallback(
        (key: TranslationKeys) => {
            const translation = translations[language][key];
            return translation || key;
        },
        [language]
    );

    const value = React.useMemo(
        () => ({
            language,
            setLanguage,
            t,
        }),
        [language, setLanguage, t]
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
}
