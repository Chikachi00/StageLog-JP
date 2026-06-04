import { Cloud, KeyRound, LogOut, Mail, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ProfilePanel } from "./ProfilePanel";

type AuthAction = "magic-link" | "password-sign-in" | "password-sign-up" | "sign-out";

interface AuthPanelProps {
  isCloudMode?: boolean;
  localEventCount?: number;
  localTicketCount?: number;
  isImportingLocalEvents?: boolean;
  isImportingLocalTickets?: boolean;
  onImportLocalEvents?: () => void | Promise<void>;
  onImportLocalTickets?: () => void | Promise<void>;
}

const abbreviateEmail = (email?: string) => {
  if (!email) {
    return "";
  }

  const [name, domain] = email.split("@");

  if (!domain) {
    return email.length > 14 ? `${email.slice(0, 11)}...` : email;
  }

  const visibleName = name.length <= 3 ? name : `${name.slice(0, 3)}...`;
  return `${visibleName}@${domain}`;
};

export function AuthPanel({
  isCloudMode = false,
  localEventCount = 0,
  localTicketCount = 0,
  isImportingLocalEvents = false,
  isImportingLocalTickets = false,
  onImportLocalEvents,
  onImportLocalTickets,
}: AuthPanelProps) {
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
  const panelRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submittingAction, setSubmittingAction] = useState<AuthAction | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setEmail("");
      setPassword("");
      setMessage("");
      setError("");
      setIsOpen(false);
    }
  }, [user]);

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

  const openPanel = () => {
    setMessage("");
    setError("");
    setIsOpen((current) => !current);
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
      setIsOpen(false);
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
    setSubmittingAction("sign-out");

    try {
      await signOut();
      setIsOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("auth.signOutFailed"));
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleImportLocalEvents = async () => {
    await onImportLocalEvents?.();
  };

  const handleImportLocalTickets = async () => {
    await onImportLocalTickets?.();
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

  return (
    <section className="auth-panel auth-panel--compact-menu" ref={panelRef}>
      <button
        className="ghost-button auth-entry-button"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={user ? t("auth.openAccountMenu") : t("auth.signIn")}
        onClick={openPanel}
      >
        {user ? <UserRound size={16} aria-hidden="true" /> : <Cloud size={16} aria-hidden="true" />}
        <span>{user ? t("auth.cloudMode") : t("auth.signIn")}</span>
        {user ? <strong>{abbreviateEmail(user.email)}</strong> : null}
      </button>

      {isOpen ? (
        <div className="auth-popover" role="dialog" aria-modal="false">
          <div className="auth-popover__header">
            <div>
              <span>{user ? t("auth.account") : t("auth.signIn")}</span>
              <strong>{user ? t("auth.cloudMode") : "StageLog JP"}</strong>
            </div>
            <button className="icon-button" type="button" aria-label={t("common.close")} onClick={() => setIsOpen(false)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {user ? (
            <div className="account-menu">
              <div className="account-menu__identity">
                <span>{t("auth.signedInAs")}</span>
                <strong>{user.email}</strong>
                <small>{isCloudMode ? t("auth.cloudModeDescription") : t("auth.localModeDescription")}</small>
              </div>

              {isCloudMode && localEventCount > 0 ? (
                <button
                  className="ghost-button"
                  type="button"
                  disabled={isImportingLocalEvents}
                  onClick={() => void handleImportLocalEvents()}
                >
                  {isImportingLocalEvents ? t("auth.importing") : t("auth.importLocalData")}
                </button>
              ) : null}

              {isCloudMode && localTicketCount > 0 ? (
                <button
                  className="ghost-button"
                  type="button"
                  disabled={isImportingLocalTickets}
                  onClick={() => void handleImportLocalTickets()}
                >
                  {isImportingLocalTickets ? t("auth.importing") : t("auth.importLocalTickets")}
                </button>
              ) : null}

              <ProfilePanel />

              <button className="ghost-button" type="button" disabled={isSubmitting} onClick={handleSignOut}>
                <LogOut size={16} aria-hidden="true" />
                {t("auth.signOut")}
              </button>
              {error ? <p className="auth-panel__error">{error}</p> : null}
            </div>
          ) : (
            <>
              <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
                <label>
                  {t("auth.email")}
                  <span>
                    <Mail size={15} aria-hidden="true" />
                    <input
                      required
                      autoComplete="email"
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
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
