"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCurrentUser, useTranslation } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { setLocale } from "@/store/localeSlice";
import type { Locale } from "@/lib/i18n/locales";
import type { ApiResponse, Realtor, RealtorInput, User } from "@/lib/types";
import RealtorForm from "@/components/realtors/RealtorForm";
import ChangePasswordForm, { type ChangePasswordValues } from "./ChangePasswordForm";
import LanguageForm from "./LanguageForm";
import DisplayNameForm from "./DisplayNameForm";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./ProfilePage.module.scss";

// "root or admin can edit realtor info" (as requested) is reconciled with the data model's
// Root-always-has-realtorId-null invariant (see models/User.ts) by gating on `user.realtorId`
// being set rather than on role directly — in practice this only ever renders for Administrator,
// since Root never has a realtorId, but it also means the gate stays correct if that ever changes.
export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const user = useCurrentUser();

  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [loadingRealtor, setLoadingRealtor] = useState(false);
  const [realtorFormKey, setRealtorFormKey] = useState(0);
  const [realtorSaving, setRealtorSaving] = useState(false);
  const [realtorError, setRealtorError] = useState<string | null>(null);

  const [passwordFormKey, setPasswordFormKey] = useState(0);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);

  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.realtorId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / entity-change, see RealtorsPage for the general pattern
    setLoadingRealtor(true);
    apiClient
      .get<ApiResponse<Realtor>>(`/api/realtors/${user.realtorId}`)
      .then((response) => {
        setRealtor(response.data.data);
        setRealtorError(null);
      })
      .catch(() => setRealtorError(t("profile.realtorLoadError")))
      .finally(() => setLoadingRealtor(false));
  }, [user?.realtorId, t]);

  const handleRealtorSubmit = async (values: RealtorInput) => {
    if (!user?.realtorId) return;
    setRealtorSaving(true);
    setRealtorError(null);
    try {
      const response = await apiClient.put<ApiResponse<Realtor>>(`/api/realtors/${user.realtorId}`, values);
      setRealtor(response.data.data);
      MessageHandler.success(dispatch, t("profile.realtorUpdateSuccess"));
    } catch (err) {
      setRealtorError(getErrorMessage(err, t("profile.realtorSaveError")));
    } finally {
      setRealtorSaving(false);
    }
  };

  const handleLanguageSubmit = async (language: Locale) => {
    setLanguageSaving(true);
    setLanguageError(null);
    try {
      const response = await apiClient.post<ApiResponse<User>>("/api/auth/language", { language });
      dispatch(setUser(response.data.data));
      dispatch(setLocale(response.data.data.language));
      MessageHandler.success(dispatch, t("profile.languageUpdateSuccess"));
    } catch (err) {
      setLanguageError(getErrorMessage(err, t("profile.languageSaveError")));
    } finally {
      setLanguageSaving(false);
    }
  };

  const handleDisplayNameSubmit = async (displayName: string) => {
    setDisplayNameSaving(true);
    setDisplayNameError(null);
    try {
      const response = await apiClient.post<ApiResponse<User>>("/api/auth/display-name", { displayName });
      dispatch(setUser(response.data.data));
      MessageHandler.success(dispatch, t("profile.displayNameUpdateSuccess"));
    } catch (err) {
      setDisplayNameError(getErrorMessage(err, t("profile.displayNameSaveError")));
    } finally {
      setDisplayNameSaving(false);
    }
  };

  const handlePasswordSubmit = async (values: ChangePasswordValues) => {
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await apiClient.post("/api/auth/change-password", values);
      MessageHandler.success(dispatch, t("profile.passwordUpdateSuccess"));
      setPasswordFormKey((key) => key + 1);
    } catch (err) {
      setPasswordError(getErrorMessage(err, t("profile.passwordSaveError")));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("profile.title")}</h2>
          <p className={sharedStyles.pageSubtitle}>{user?.email}</p>
        </div>
      </div>

      <div className={styles.body}>
        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("profile.displayNameSectionTitle")}</h3>
          {user && (
            <DisplayNameForm
              key={user.displayName}
              initialValue={user.displayName}
              loading={displayNameSaving}
              error={displayNameError}
              onSubmit={handleDisplayNameSubmit}
            />
          )}
        </Card>

        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("profile.languageSectionTitle")}</h3>
          {user && (
            <LanguageForm
              key={user.language}
              initialValue={user.language}
              loading={languageSaving}
              error={languageError}
              onSubmit={handleLanguageSubmit}
            />
          )}
        </Card>

        {user?.realtorId && (
          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("profile.realtorSectionTitle")}</h3>
            {loadingRealtor ? (
              <p className="text-sm text-neutral-400">{t("profile.realtorLoading")}</p>
            ) : realtor ? (
              <RealtorForm
                key={`${realtor.id}-${realtorFormKey}`}
                initialValues={realtor}
                submitLabel={t("common.save")}
                loading={realtorSaving}
                error={realtorError}
                onSubmit={handleRealtorSubmit}
                onCancel={() => setRealtorFormKey((key) => key + 1)}
              />
            ) : (
              <p className={sharedStyles.errorText}>{realtorError ?? t("profile.realtorLoadError")}</p>
            )}
          </Card>
        )}

        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("profile.passwordSectionTitle")}</h3>
          <ChangePasswordForm
            key={passwordFormKey}
            loading={passwordSaving}
            error={passwordError}
            onSubmit={handlePasswordSubmit}
          />
        </Card>
      </div>
    </div>
  );
}
