"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { useTranslation } from "@/store/hooks";
import type { ApiResponse, Realtor, UserInput, UserRole } from "@/lib/types";
import { USER_ROLES } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface UserFormValues {
  email: string;
  password: string;
  role: UserRole;
  realtorId: string;
}

const EMPTY_VALUES: UserFormValues = {
  email: "",
  password: "",
  role: "Operator",
  realtorId: "",
};

interface UserFormProps {
  initialValues?: Partial<UserFormValues>;
  isEdit?: boolean;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: UserInput) => void;
  onCancel: () => void;
}

export default function UserForm({
  initialValues,
  isEdit = false,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const t = useTranslation();
  const [values, setValues] = useState<UserFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [realtors, setRealtors] = useState<Realtor[]>([]);

  useEffect(() => {
    apiClient
      .get<ApiResponse<Realtor[]>>("/api/realtors")
      .then((response) => setRealtors(response.data.data))
      .catch(() => setRealtors([]));
  }, []);

  const setField = (field: keyof UserFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      email: values.email,
      role: values.role,
      realtorId: values.role === "Root" ? null : values.realtorId || null,
      ...(values.password ? { password: values.password } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="email">{t("users.form.email")}</label>
          <input
            id="email"
            type="email"
            required
            className={sharedStyles.input}
            value={values.email}
            onChange={setField("email")}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="password">
            {isEdit ? t("users.form.newPassword") : t("users.form.password")}
          </label>
          <input
            id="password"
            type="password"
            required={!isEdit}
            minLength={8}
            placeholder={isEdit ? t("users.form.passwordPlaceholder") : undefined}
            className={sharedStyles.input}
            value={values.password}
            onChange={setField("password")}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="role">{t("users.form.role")}</label>
          <select id="role" className={sharedStyles.input} value={values.role} onChange={setField("role")}>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>{t(`users.roles.${role}`)}</option>
            ))}
          </select>
        </div>

        {values.role !== "Root" && (
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="realtorId">{t("users.form.realtor")}</label>
            <select
              id="realtorId"
              required
              className={sharedStyles.input}
              value={values.realtorId}
              onChange={setField("realtorId")}
            >
              <option value="">{t("users.form.realtorPlaceholder")}</option>
              {realtors.map((realtor) => (
                <option key={realtor.id} value={realtor.id}>
                  {realtor.firstName} {realtor.lastName}
                </option>
              ))}
            </select>
          </div>
        )}
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
