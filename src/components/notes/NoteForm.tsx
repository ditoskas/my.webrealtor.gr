"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import { NOTE_IMPORTANCE_LEVELS, type NoteImportance } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

export interface NoteFormValues {
  title: string;
  text: string;
  importance: NoteImportance;
}

const EMPTY_VALUES: NoteFormValues = {
  title: "",
  text: "",
  importance: "Normal",
};

interface NoteFormProps {
  initialValues?: Partial<NoteFormValues>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: NoteFormValues) => void;
  onCancel: () => void;
}

export default function NoteForm({ initialValues, submitLabel, loading = false, error, onSubmit, onCancel }: NoteFormProps) {
  const t = useTranslation();
  const [values, setValues] = useState<NoteFormValues>({ ...EMPTY_VALUES, ...initialValues });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="noteTitle">
          {t("notes.form.title")}
        </label>
        <input
          id="noteTitle"
          required
          className={sharedStyles.input}
          value={values.title}
          onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="noteText">
          {t("notes.form.text")}
        </label>
        <textarea
          id="noteText"
          required
          rows={4}
          className={sharedStyles.input}
          value={values.text}
          onChange={(event) => setValues((prev) => ({ ...prev, text: event.target.value }))}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="noteImportance">
          {t("notes.form.importance")}
        </label>
        <select
          id="noteImportance"
          className={sharedStyles.input}
          value={values.importance}
          onChange={(event) => setValues((prev) => ({ ...prev, importance: event.target.value as NoteImportance }))}
        >
          {NOTE_IMPORTANCE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {t(`notes.importance.${level}`)}
            </option>
          ))}
        </select>
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
