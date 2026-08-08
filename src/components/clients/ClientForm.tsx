"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { useCurrentUser, useTranslation } from "@/store/hooks";
import { GENDERS } from "@/lib/types";
import type { ApiResponse, ClientInput, Gender, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface ClientFormValues {
  gender: Gender | "";
  firstName: string;
  lastName: string;
  tin: string;
  email: string;
  phone: string;
  mobile: string;
  city: string;
  address: string;
  zipcode: string;
  realtorId: string;
}

const EMPTY_VALUES: ClientFormValues = {
  gender: "",
  firstName: "",
  lastName: "",
  tin: "",
  email: "",
  phone: "",
  mobile: "",
  city: "",
  address: "",
  zipcode: "",
  realtorId: "",
};

interface ClientFormProps {
  initialValues?: Partial<ClientFormValues>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: ClientInput) => void;
  onCancel: () => void;
}

export default function ClientForm({
  initialValues,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const t = useTranslation();
  const user = useCurrentUser();
  // Only Root manages clients across every realtor — Administrator/Operator are always scoped to
  // their own, so the field is redundant (and would let them pick someone else's) for them.
  const isRoot = user?.role === "Root";
  const [values, setValues] = useState<ClientFormValues>({
    ...EMPTY_VALUES,
    realtorId: user?.realtorId ?? "",
    ...initialValues,
  });
  const [realtors, setRealtors] = useState<Realtor[]>([]);

  useEffect(() => {
    if (!isRoot) return;
    apiClient
      .get<ApiResponse<Realtor[]>>("/api/realtors")
      .then((response) => setRealtors(response.data.data))
      .catch(() => setRealtors([]));
  }, [isRoot]);

  const setField =
    (field: keyof ClientFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        event.target instanceof HTMLInputElement && event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      realtorId: values.realtorId,
      gender: values.gender || null,
      firstName: values.firstName,
      lastName: values.lastName,
      tin: values.tin,
      email: values.email,
      phone: values.phone,
      mobile: values.mobile,
      city: values.city,
      address: values.address,
      zipcode: values.zipcode,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div className={sharedStyles.formGrid}>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="firstName">{t("clients.form.firstName")}</label>
          <input
            id="firstName"
            required
            className={sharedStyles.input}
            value={values.firstName}
            onChange={setField("firstName")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="lastName">{t("clients.form.lastName")}</label>
          <input
            id="lastName"
            required
            className={sharedStyles.input}
            value={values.lastName}
            onChange={setField("lastName")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="gender">{t("clients.form.gender")}</label>
          <select id="gender" className={sharedStyles.input} value={values.gender} onChange={setField("gender")}>
            <option value="">—</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender === "Male" ? t("clients.form.genderMale") : t("clients.form.genderFemale")}
              </option>
            ))}
          </select>
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="tin">{t("clients.form.tin")}</label>
          <input id="tin" className={sharedStyles.input} value={values.tin} onChange={setField("tin")} />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="email">{t("clients.form.email")}</label>
          <input
            id="email"
            type="email"
            className={sharedStyles.input}
            value={values.email}
            onChange={setField("email")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="phone">{t("clients.form.phone")}</label>
          <input id="phone" className={sharedStyles.input} value={values.phone} onChange={setField("phone")} />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="mobile">{t("clients.form.mobile")}</label>
          <input id="mobile" className={sharedStyles.input} value={values.mobile} onChange={setField("mobile")} />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="city">{t("clients.form.city")}</label>
          <input id="city" className={sharedStyles.input} value={values.city} onChange={setField("city")} />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="zipcode">{t("clients.form.zipcode")}</label>
          <input id="zipcode" className={sharedStyles.input} value={values.zipcode} onChange={setField("zipcode")} />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="address">{t("clients.form.address")}</label>
          <input id="address" className={sharedStyles.input} value={values.address} onChange={setField("address")} />
        </div>
        {isRoot && (
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="realtorId">{t("clients.form.realtor")}</label>
            <select
              id="realtorId"
              required
              className={sharedStyles.input}
              value={values.realtorId}
              onChange={setField("realtorId")}
            >
              <option value="">{t("clients.form.realtorPlaceholder")}</option>
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
