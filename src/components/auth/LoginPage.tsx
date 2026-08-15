"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/store/hooks";
import type { LoginResponse } from "@/lib/types";
import logo from "@/assets/img/webrealtor-logo.png";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const t = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient.post<LoginResponse>("/api/auth/login", { email, password });
      // Hard navigation, not router.push/dispatch(setUser(...)) — a client-side transition
      // would carry over whatever Redux/router-cache state this tab had from a previous
      // session (e.g. another user's data). A full reload forces DashboardShell to
      // re-hydrate everything from scratch off the freshly-set session cookie.
      window.location.href = "/dashboard";
    } catch (err) {
      setError(getErrorMessage(err, t("auth.invalidCredentials")));
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <h1 className={styles.title}>
          <Image src={logo} alt="WebRealtor" className={styles.logo} priority />
        </h1>
        <p className={styles.subtitle}>{t("auth.subtitle")}</p>

        <Card className="p-8">
          <form onSubmit={handleSubmit}>
            {error && <p className={sharedStyles.errorText}>{error}</p>}

            <div className={sharedStyles.field}>
              <label className={sharedStyles.label} htmlFor="email">{t("auth.emailLabel")}</label>
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
              <label className={sharedStyles.label} htmlFor="password">{t("auth.passwordLabel")}</label>
              <input
                id="password"
                type="password"
                required
                className={sharedStyles.input}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
        </Card>

        <p className={styles.subtitle}>
          {t("auth.noAccount")} <Link href="/signup">{t("auth.signUpLink")}</Link>
        </p>
      </div>
    </div>
  );
}
