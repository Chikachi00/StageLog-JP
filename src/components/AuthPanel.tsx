import { Cloud, KeyRound, LogOut, Mail } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

type AuthAction = "magic-link" | "password-sign-in" | "password-sign-up";

export function AuthPanel() {
  const { t } = useTranslation();
  const {
    user,
    loading,
    isSupabaseConfigured,
    signInWithEmail,
    signInWithPassword,
    signOut,
    signUpWithPassword,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submittingAction, setSubmittingAction] = useState<AuthAction | null>(null);

  const validateEmail = () => {
    if (!email.trim()) {
      setError(t("auth.emailRequired"));
      return false;
    }

    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setError(t("auth.passwordRequired"));
      return false;
    }

    if (password.length < 6) {
      setError(t("auth.passwordMinLength"));
      return false;
    }

    return true;
  };

  const handleMagicLink = async () => {
    setMessage("");
    setError("");

    if (!validateEmail()) {
      return;
    }

    setSubmittingAction("magic-link");

    try {
      await signInWithEmail(email.trim());
      setMessage(t("auth.checkEmail"));
      setEmail("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.signInFailed"));
    } finally {
      setSubmittingAction(null);
    }
  };

  const handlePasswordSignIn = async () => {
    setMessage("");
    setError("");

    if (!validateEmail() || !validatePassword()) {
      return;
    }

    setSubmittingAction("password-sign-in");

    try {
      await signInWithPassword(email.trim(), password);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.authenticationFailed"));
    } finally {
      setSubmittingAction(null);
    }
  };

  const handlePasswordSignUp = async () => {
    setMessage("");
    setError("");

    if (!validateEmail() || !validatePassword()) {
      return;
    }

    setSubmittingAction("password-sign-up");

    try {
      await signUpWithPassword(email.trim(), password);
      setMessage(t("auth.accountCreatedCheckEmail"));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.authenticationFailed"));
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleSignOut = async () => {
    setMessage("");
    setError("");
    setSubmittingAction("password-sign-in");

    try {
      await signOut();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.signOutFailed"));
    } finally {
      setSubmittingAction(null);
    }
  };

  const isSubmitting = submittingAction !== null;

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
        <button className="ghost-button" type="button" disabled={isSubmitting} onClick={handleSignOut}>
          <LogOut size={16} aria-hidden="true" />
          {t("auth.signOut")}
        </button>
        {error ? <p className="auth-panel__error">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <form onSubmit={(event) => event.preventDefault()}>
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
        <label>
          {t("auth.password")}
          <span>
            <KeyRound size={15} aria-hidden="true" />
            <input
              autoComplete="current-password"
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.password")}
            />
          </span>
        </label>
        <div className="auth-panel__actions">
          <button
            className="ghost-button"
            type="button"
            disabled={isSubmitting}
            onClick={handlePasswordSignIn}
          >
            {submittingAction === "password-sign-in" ? t("auth.signIn") : t("auth.signInWithPassword")}
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={isSubmitting}
            onClick={handlePasswordSignUp}
          >
            {submittingAction === "password-sign-up" ? t("auth.signIn") : t("auth.signUpWithPassword")}
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={isSubmitting}
            onClick={handleMagicLink}
          >
            {submittingAction === "magic-link" ? t("auth.signIn") : t("auth.sendMagicLink")}
          </button>
        </div>
      </form>
      {message ? <p className="auth-panel__message">{message}</p> : null}
      {error ? <p className="auth-panel__error">{error}</p> : null}
    </section>
  );
}
