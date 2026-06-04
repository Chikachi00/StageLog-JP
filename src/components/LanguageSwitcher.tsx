import { useTranslation } from "react-i18next";
import { LANGUAGE_STORAGE_KEY } from "../i18n";

const languages = [
  { id: "en", labelKey: "language.english" },
  { id: "zh", labelKey: "language.chinese" },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language: "en" | "zh") => {
    void i18n.changeLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  };

  return (
    <div className="language-switcher" aria-label={t("language.label")}>
      {languages.map((language) => (
        <button
          className={i18n.language === language.id ? "is-active" : undefined}
          key={language.id}
          type="button"
          onClick={() => changeLanguage(language.id)}
        >
          {t(language.labelKey)}
        </button>
      ))}
    </div>
  );
}
