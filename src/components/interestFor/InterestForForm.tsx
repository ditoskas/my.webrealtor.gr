"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import {
  TRANSACTION_TYPES,
  INTEREST_FOR_LISTING_TYPES,
  type InterestForInput,
  type LandCategory,
  type PropertyCategory,
} from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

// clientId is supplied by the caller (AddInterestForModal/EditInterestForModal) from the parent
// Client's id, not edited in this form — same split NotesPanel uses for entityType/entityId.
export type InterestForFormValues = Omit<InterestForInput, "clientId">;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_VALUES: InterestForFormValues = {
  date: todayIsoDate(),
  transactionType: "sale",
  listingType: "Property",
  categoryId: "",
  price: 0,
  city: "",
  area: undefined,
  remarks: "",
  isActive: true,
};

interface InterestForFormProps {
  initialValues?: Partial<InterestForFormValues>;
  propertyCategories: PropertyCategory[];
  landCategories: LandCategory[];
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: InterestForFormValues) => void;
  onCancel: () => void;
}

export default function InterestForForm({
  initialValues,
  propertyCategories,
  landCategories,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: InterestForFormProps) {
  const t = useTranslation();
  const [values, setValues] = useState<InterestForFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
    date: initialValues?.date ? initialValues.date.slice(0, 10) : EMPTY_VALUES.date,
  });

  const categoryOptions = values.listingType === "Property" ? propertyCategories : landCategories;

  const handleListingTypeChange = (listingType: InterestForFormValues["listingType"]) => {
    // Category options differ per listing type — a previously picked category id would silently
    // point at the wrong pool entity, so it's cleared rather than carried over.
    setValues((prev) => ({ ...prev, listingType, categoryId: "" }));
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
          <label className={sharedStyles.label} htmlFor="if-date">
            {t("interestFor.form.date")}
          </label>
          <input
            id="if-date"
            type="date"
            required
            className={sharedStyles.input}
            value={values.date}
            onChange={(event) => setValues((prev) => ({ ...prev, date: event.target.value }))}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="if-transactionType">
            {t("interestFor.form.transactionType")}
          </label>
          <select
            id="if-transactionType"
            required
            className={sharedStyles.input}
            value={values.transactionType}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                transactionType: event.target.value as InterestForFormValues["transactionType"],
              }))
            }
          >
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`interestFor.transactionType.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="if-listingType">
            {t("interestFor.form.listingType")}
          </label>
          <select
            id="if-listingType"
            required
            className={sharedStyles.input}
            value={values.listingType}
            onChange={(event) =>
              handleListingTypeChange(event.target.value as InterestForFormValues["listingType"])
            }
          >
            {INTEREST_FOR_LISTING_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`interestFor.listingType.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="if-category">
            {t("interestFor.form.category")}
          </label>
          <select
            id="if-category"
            required
            className={sharedStyles.input}
            value={values.categoryId}
            onChange={(event) => setValues((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            <option value="">{t("common.selectPlaceholder")}</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="if-price">
            {t("interestFor.form.price")}
          </label>
          <input
            id="if-price"
            type="number"
            min="0"
            step="0.01"
            required
            className={sharedStyles.input}
            value={values.price}
            onChange={(event) => setValues((prev) => ({ ...prev, price: Number(event.target.value) }))}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="if-city">
            {t("interestFor.form.city")}
          </label>
          <input
            id="if-city"
            className={sharedStyles.input}
            value={values.city ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, city: event.target.value }))}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="if-area">
            {t("interestFor.form.area")}
          </label>
          <input
            id="if-area"
            type="number"
            min="0"
            step="0.01"
            className={sharedStyles.input}
            value={values.area ?? ""}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                area: event.target.value === "" ? undefined : Number(event.target.value),
              }))
            }
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="if-remarks">
            {t("interestFor.form.remarks")}
          </label>
          <input
            id="if-remarks"
            className={sharedStyles.input}
            value={values.remarks ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, remarks: event.target.value }))}
          />
        </div>

        <div className={sharedStyles.checkboxField}>
          <input
            id="if-isActive"
            type="checkbox"
            className={sharedStyles.checkbox}
            checked={values.isActive}
            onChange={(event) => setValues((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          <label htmlFor="if-isActive" className={sharedStyles.checkboxLabel}>
            {t("interestFor.form.isActive")}
          </label>
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
