"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { setLocale } from "@/store/localeSlice";
import { MessageHandler } from "@/helpers/messageHandler";
import { getDisplayName } from "@/lib/displayName";
import type { LoginResponse } from "@/lib/types";
import logo from "@/assets/img/webrealtor-logo.png";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
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
      const response = await apiClient.post<LoginResponse>("/api/auth/login", { email, password });
      dispatch(setUser(response.data.user));
      // The account's own stored language preference wins over whatever store/localeSlice's
      // LocaleHydrator guessed from localStorage — see lib/types.ts's User.language doc comment.
      dispatch(setLocale(response.data.user.language));
      MessageHandler.success(dispatch, t("auth.welcomeMessage", { name: getDisplayName(response.data.user) }));
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, t("auth.invalidCredentials")));
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
