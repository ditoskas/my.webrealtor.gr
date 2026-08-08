"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";

interface DisplayNameFormProps {
  initialValue: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (displayName: string) => void;
}

export default function DisplayNameForm({ initialValue, loading = false, error, onSubmit }: DisplayNameFormProps) {
  const t = useTranslation();
  const [displayName, setDisplayName] = useState(initialValue);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(displayName.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="displayName">
          {t("profile.displayNameLabel")}
        </label>
        <input
          id="displayName"
          type="text"
          placeholder={t("profile.displayNamePlaceholder")}
          className={sharedStyles.input}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>

      <div className={sharedStyles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
