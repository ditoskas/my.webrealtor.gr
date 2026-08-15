"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import type { MessageFormInput } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

const EMPTY_VALUES: MessageFormInput = {
  realtorId: "",
  slug: "",
  subject: "",
  recipient: "",
};

interface MessageFormFormProps {
  realtorId: string;
  guid?: string;
  initialValues?: Partial<MessageFormInput>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: MessageFormInput) => void;
  onCancel: () => void;
}

export default function MessageFormForm({
  realtorId,
  guid,
  initialValues,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: MessageFormFormProps) {
  const t = useTranslation();
  const [values, setValues] = useState<MessageFormInput>({ ...EMPTY_VALUES, ...initialValues, realtorId });

  const setField = (field: "slug" | "subject" | "recipient") => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      {guid && (
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="guid">{t("messageForms.form.guid")}</label>
          <input id="guid" readOnly className={sharedStyles.input} value={guid} />
          <p className="text-xs text-neutral-400 mt-1">{t("messageForms.form.guidHint")}</p>
        </div>
      )}

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="slug">{t("messageForms.form.slug")}</label>
        <input
          id="slug"
          required
          placeholder={t("messageForms.form.slugPlaceholder")}
          className={sharedStyles.input}
          value={values.slug}
          onChange={setField("slug")}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="subject">{t("messageForms.form.subject")}</label>
        <input
          id="subject"
          required
          placeholder={t("messageForms.form.subjectPlaceholder")}
          className={sharedStyles.input}
          value={values.subject}
          onChange={setField("subject")}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="recipient">{t("messageForms.form.recipient")}</label>
        <input
          id="recipient"
          type="email"
          required
          className={sharedStyles.input}
          value={values.recipient}
          onChange={setField("recipient")}
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
