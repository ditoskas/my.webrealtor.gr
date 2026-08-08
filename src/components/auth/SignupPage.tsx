"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/store/hooks";
import logo from "@/assets/img/webrealtor-logo.png";
import sharedStyles from "@/styles/shared.module.scss";
// Reuses LoginPage's layout classes directly — the signup page is intentionally styled
// identically to login (same wrapper/panel/logo/card shell), so there's nothing
// signup-specific to colocate here.
import styles from "./LoginPage.module.scss";

export default function SignupPage() {
  const t = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/auth/signup", { email, password });
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err, t("auth.signupError")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <h1 className={styles.title}>
          <Image src={logo} alt="WebRealtor" className={styles.logo} priority />
        </h1>
        <p className={styles.subtitle}>{t("auth.signupSubtitle")}</p>

        <Card className="p-8">
          {submitted ? (
            <p className="text-sm text-center text-neutral-600">
              {t("auth.signupCheckEmail", { email })}
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <p className={sharedStyles.errorText}>{error}</p>}

              <div className={sharedStyles.field}>
                <label className={sharedStyles.label} htmlFor="email">
                  {t("auth.emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className={sharedStyles.input}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label} htmlFor="password">
                  {t("auth.passwordLabel")}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  className={sharedStyles.input}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.signingUp") : t("auth.signUp")}
              </Button>
            </form>
          )}
        </Card>

        <p className={styles.subtitle}>
          {t("auth.haveAccount")} <Link href="/login">{t("auth.signInLink")}</Link>
        </p>
      </div>
    </div>
  );
}
