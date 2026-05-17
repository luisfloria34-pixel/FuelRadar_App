import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { translations, TranslationKey } from '../constants/translations';

/**
 * Returns a `t` function whose reference changes whenever language changes.
 * Use this instead of `const { t } = useStore()` in any component that needs
 * to re-render when the user switches language.
 */
export function useTranslation() {
  // Selector-based subscription: re-renders only when language value changes.
  const language = useStore((state) => state.language);

  // New function reference on each language change → React sees it as a
  // changed dep and re-renders anything that depends on t or language.
  const t = useCallback(
    (key: TranslationKey): string => {
      return (
        (translations[language] as Record<string, string>)[key] ??
        (translations.de as Record<string, string>)[key] ??
        key
      );
    },
    [language],
  );

  return { t, language };
}
