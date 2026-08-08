"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import { LOCALE_OPTIONS, type Locale } from "@/lib/i18n/locales";
import sharedStyles from "@/styles/shared.module.scss";

interface LanguageFormProps {
  initialValue: Locale;
  loading?: boolean;
  error?: string | null;
  onSubmit: (language: Locale) => void;
}

export default function LanguageForm({ initialValue, loading = false, error, onSubmit }: LanguageFormProps) {
  const t = useTranslation();
  const [language, setLanguage] = useState<Locale>(initialValue);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(language);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="language">
          {t("profile.languageLabel")}
        </label>
        <select
          id="language"
          className={sharedStyles.input}
          value={language}
          onChange={(event) => setLanguage(event.target.value as Locale)}
        >
          {LOCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={sharedStyles.formActions}>
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
