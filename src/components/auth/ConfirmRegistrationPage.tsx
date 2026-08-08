"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { setLocale } from "@/store/localeSlice";
import { MessageHandler } from "@/helpers/messageHandler";
import { getDisplayName } from "@/lib/displayName";
import type { ApiResponse, LoginResponse, RealtorInput } from "@/lib/types";
import RealtorForm from "@/components/realtors/RealtorForm";
import logo from "@/assets/img/webrealtor-logo.png";
// Same reuse rationale as SignupPage — this page keeps the login/signup shell (logo, panel,
// card), just with a different card body.
import styles from "./LoginPage.module.scss";

type Status = "loading" | "invalid" | "ready";

export default function ConfirmRegistrationPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, see RealtorsPage for the general pattern
      setStatus("invalid");
      return;
    }
    apiClient
      .get<ApiResponse<{ email: string }>>(`/api/auth/registrations/${token}`)
      .then((response) => {
        setEmail(response.data.data.email);
        setStatus("ready");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleSubmit = async (values: RealtorInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>("/api/auth/complete-registration", {
        token,
        realtor: values,
      });
      dispatch(setUser(response.data.data.user));
      dispatch(setLocale(response.data.data.user.language));
      MessageHandler.success(dispatch, t("auth.welcomeMessage", { name: getDisplayName(response.data.data.user) }));
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, t("auth.completeRegistrationError")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <h1 className={styles.title}>
          <Image src={logo} alt="WebRealtor" className={styles.logo} priority />
        </h1>

        {status === "loading" && (
          <p className={styles.subtitle}>{t("auth.confirmLoading")}</p>
        )}

        {status === "invalid" && (
          <>
            <p className={styles.subtitle}>{t("auth.confirmInvalid")}</p>
            <Card className="p-8">
              <p className="text-sm text-center text-neutral-600">
                {t("auth.confirmInvalidHint")}{" "}
                <Link href="/signup">{t("auth.signUpLink")}</Link>
              </p>
            </Card>
          </>
        )}

        {status === "ready" && (
          <>
            <p className={styles.subtitle}>{t("auth.confirmSubtitle", { email })}</p>
            <Card className="p-8">
              <RealtorForm
                initialValues={{ email }}
                submitLabel={t("auth.completeRegistration")}
                loading={saving}
                error={error}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/login")}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
