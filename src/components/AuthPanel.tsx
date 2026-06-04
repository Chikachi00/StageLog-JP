import { Cloud, LogOut, Mail } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export function AuthPanel() {
  const { t } = useTranslation();
  const { user, loading, isSupabaseConfigured, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      await signInWithEmail(email.trim());
      setMessage(t("auth.checkEmail"));
      setEmail("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.signInFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      await signOut();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.signOutFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <section className="auth-panel auth-panel--compact">
        <Cloud size={16} aria-hidden="true" />
        <span>{t("auth.notConfigured")}</span>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="auth-panel auth-panel--compact">
        <Cloud size={16} aria-hidden="true" />
        <span>{t("auth.cloudSync")}</span>
      </section>
    );
  }

  if (user) {
    return (
      <section className="auth-panel">
        <div>
          <span>{t("auth.signedInAs")}</span>
          <strong>{user.email}</strong>
        </div>
        <button className="ghost-button" type="button" disabled={submitting} onClick={handleSignOut}>
          <LogOut size={16} aria-hidden="true" />
          {t("auth.signOut")}
        </button>
        {error ? <p className="auth-panel__error">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <form onSubmit={handleSubmit}>
        <label>
          {t("auth.email")}
          <span>
            <Mail size={15} aria-hidden="true" />
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </span>
        </label>
        <button className="ghost-button" type="submit" disabled={submitting}>
          {submitting ? t("auth.signIn") : t("auth.sendMagicLink")}
        </button>
      </form>
      {message ? <p className="auth-panel__message">{message}</p> : null}
      {error ? <p className="auth-panel__error">{error}</p> : null}
    </section>
  );
}
