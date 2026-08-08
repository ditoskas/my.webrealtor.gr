"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";

export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordFormProps {
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: ChangePasswordValues) => void;
}

export default function ChangePasswordForm({ loading = false, error, onSubmit }: ChangePasswordFormProps) {
  const t = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMismatchError(t("profile.passwordMismatch"));
      return;
    }
    setMismatchError(null);
    onSubmit({ currentPassword, newPassword });
  };

  return (
    <form onSubmit={handleSubmit}>
      {(mismatchError || error) && <p className={sharedStyles.errorText}>{mismatchError ?? error}</p>}

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="currentPassword">
          {t("profile.currentPassword")}
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={sharedStyles.input}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="newPassword">
          {t("profile.newPassword")}
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={sharedStyles.input}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="confirmPassword">
          {t("profile.confirmNewPassword")}
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={sharedStyles.input}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      <div className={sharedStyles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : t("profile.changePassword")}
        </Button>
      </div>
    </form>
  );
}
