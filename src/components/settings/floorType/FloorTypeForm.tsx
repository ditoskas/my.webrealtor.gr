"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import type { FloorTypeInput } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

const EMPTY_VALUES: FloorTypeInput = {
  name: "",
  slug: "",
};

interface FloorTypeFormProps {
  initialValues?: Partial<FloorTypeInput>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: FloorTypeInput) => void;
  onCancel: () => void;
}

export default function FloorTypeForm({
  initialValues,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: FloorTypeFormProps) {
  const t = useTranslation();
  const [values, setValues] = useState<FloorTypeInput>({ ...EMPTY_VALUES, ...initialValues });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="name">{t("settingsPool.form.name")}</label>
        <input
          id="name"
          required
          className={sharedStyles.input}
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="slug">{t("settingsPool.form.slug")}</label>
        <input
          id="slug"
          required
          placeholder={t("settingsPool.form.slugPlaceholder")}
          className={sharedStyles.input}
          value={values.slug}
          onChange={(event) => setValues((prev) => ({ ...prev, slug: event.target.value }))}
        />
      </div>

      <div className={sharedStyles.formActions}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
