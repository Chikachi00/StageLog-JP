import { useTranslation } from "react-i18next";
import { useUserSettings } from "../context/UserSettingsContext";

const languages = [
  { id: "en", labelKey: "language.english" },
  { id: "zh", labelKey: "language.chinese" },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { updateLanguageSetting } = useUserSettings();

  const changeLanguage = (language: "en" | "zh") => {
    void updateLanguageSetting(language);
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
