"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";

export interface FileEditValues {
  title: string;
  description: string;
}

interface FileEditFormProps {
  initialValues: FileEditValues;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: FileEditValues) => void;
  onCancel: () => void;
}

// Metadata-only edit form — an attachment's underlying file can't be replaced, only its title/
// description (delete and re-upload instead), so this is deliberately smaller than NoteForm.
export default function FileEditForm({ initialValues, loading = false, error, onSubmit, onCancel }: FileEditFormProps) {
  const t = useTranslation();
  const [values, setValues] = useState<FileEditValues>(initialValues);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="fileTitle">
          {t("files.form.title")}
        </label>
        <input
          id="fileTitle"
          required
          className={sharedStyles.input}
          value={values.title}
          onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="fileDescription">
          {t("files.form.description")}
        </label>
        <textarea
          id="fileDescription"
          rows={3}
          className={sharedStyles.input}
          value={values.description}
          onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
        />
      </div>

      <div className={sharedStyles.formActions}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
