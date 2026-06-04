import { Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useUserSettings } from "../context/UserSettingsContext";

export function ProfilePanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, profileError, profileLoading, saveProfile } = useUserSettings();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [homeRegion, setHomeRegion] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? "");
    setUsername(profile?.username ?? "");
    setHomeRegion(profile?.homeRegion ?? "");
  }, [profile]);

  if (!user) {
    return (
      <section className="profile-panel profile-panel--compact">
        <UserRound size={16} aria-hidden="true" />
        <span>{t("profile.signInHint")}</span>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      await saveProfile({
        displayName: displayName.trim() || undefined,
        username: username.trim() || undefined,
        homeRegion: homeRegion.trim() || undefined,
      });
      setMessage(t("profile.saved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-panel">
      <div className="profile-panel__header">
        <UserRound size={16} aria-hidden="true" />
        <div>
          <strong>{t("profile.title")}</strong>
          <span>{user.email}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          {t("profile.displayName")}
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={profileLoading || saving}
          />
        </label>
        <label>
          {t("profile.username")}
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={profileLoading || saving}
          />
        </label>
        <label>
          {t("profile.homeRegion")}
          <input
            value={homeRegion}
            onChange={(event) => setHomeRegion(event.target.value)}
            disabled={profileLoading || saving}
          />
        </label>
        <button className="ghost-button" type="submit" disabled={profileLoading || saving}>
          <Save size={15} aria-hidden="true" />
          {t("profile.save")}
        </button>
      </form>
      <p className="profile-panel__meta">
        {t("profile.currentSettings", {
          language: profile?.language ?? "-",
          theme: profile?.theme ?? "-",
        })}
      </p>
      {profileError ? <p className="auth-panel__error">{profileError}</p> : null}
      {message ? <p className="auth-panel__message">{message}</p> : null}
    </section>
  );
}
