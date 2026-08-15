"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import type { RealtorInput } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

const EMPTY_VALUES: RealtorInput = {
  firstName: "",
  lastName: "",
  phone: "",
  mobile: "",
  email: "",
  city: "",
  address: "",
  postcode: "",
  googleMapsUrl: "",
  website: "",
  realtorNumber: "",
  saleCommission: null,
  rentCommission: null,
};

interface RealtorFormProps {
  initialValues?: Partial<RealtorInput>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: RealtorInput) => void;
  onCancel: () => void;
}

export default function RealtorForm({
  initialValues,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: RealtorFormProps) {
  const t = useTranslation();
  const [values, setValues] = useState<RealtorInput>({ ...EMPTY_VALUES, ...initialValues });

  const setField = (field: keyof RealtorInput) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const setCommissionField =
    (field: "saleCommission" | "rentCommission") => (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      setValues((prev) => ({ ...prev, [field]: raw === "" ? null : Number(raw) }));
    };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div className={sharedStyles.formGrid}>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="firstName">{t("realtors.form.firstName")}</label>
          <input
            id="firstName"
            required
            className={sharedStyles.input}
            value={values.firstName}
            onChange={setField("firstName")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="lastName">{t("realtors.form.lastName")}</label>
          <input
            id="lastName"
            required
            className={sharedStyles.input}
            value={values.lastName}
            onChange={setField("lastName")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="email">{t("realtors.form.email")}</label>
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
          <label className={sharedStyles.label} htmlFor="website">{t("realtors.form.website")}</label>
          <input
            id="website"
            className={sharedStyles.input}
            value={values.website}
            onChange={setField("website")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="phone">{t("realtors.form.phone")}</label>
          <input
            id="phone"
            className={sharedStyles.input}
            value={values.phone}
            onChange={setField("phone")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="mobile">{t("realtors.form.mobile")}</label>
          <input
            id="mobile"
            className={sharedStyles.input}
            value={values.mobile}
            onChange={setField("mobile")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="city">{t("realtors.form.city")}</label>
          <input
            id="city"
            className={sharedStyles.input}
            value={values.city}
            onChange={setField("city")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="postcode">{t("realtors.form.postcode")}</label>
          <input
            id="postcode"
            className={sharedStyles.input}
            value={values.postcode}
            onChange={setField("postcode")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="address">{t("realtors.form.address")}</label>
          <input
            id="address"
            className={sharedStyles.input}
            value={values.address}
            onChange={setField("address")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="googleMapsUrl">{t("realtors.form.googleMapsUrl")}</label>
          <input
            id="googleMapsUrl"
            type="url"
            className={sharedStyles.input}
            placeholder="https://maps.app.goo.gl/..."
            value={values.googleMapsUrl}
            onChange={setField("googleMapsUrl")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="realtorNumber">
            {t("realtors.form.realtorNumber")}
          </label>
          <input
            id="realtorNumber"
            className={sharedStyles.input}
            placeholder={t("realtors.form.realtorNumberPlaceholder")}
            value={values.realtorNumber}
            onChange={setField("realtorNumber")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="saleCommission">
            {t("realtors.form.saleCommission")}
          </label>
          <input
            id="saleCommission"
            type="number"
            min="0"
            step="0.01"
            placeholder={t("realtors.form.commissionPlaceholder")}
            className={sharedStyles.input}
            value={values.saleCommission ?? ""}
            onChange={setCommissionField("saleCommission")}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="rentCommission">
            {t("realtors.form.rentCommission")}
          </label>
          <input
            id="rentCommission"
            type="number"
            min="0"
            step="0.01"
            placeholder={t("realtors.form.commissionPlaceholder")}
            className={sharedStyles.input}
            value={values.rentCommission ?? ""}
            onChange={setCommissionField("rentCommission")}
          />
        </div>
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
