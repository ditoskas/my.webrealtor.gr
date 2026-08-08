"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { UploadCloud } from "lucide-react";
import { Button, SearchableSelect } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { listingLabel } from "@/lib/listingLabel";
import { useTranslation } from "@/store/hooks";
import {
  INTEREST_FOR_LISTING_TYPES,
  type ApiResponse,
  type Attachment,
  type FloorLevel,
  type Land,
  type LandCategory,
  type Property,
  type PropertyCategory,
  type ViewingInput,
} from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

// clientId is supplied by the caller, not edited in this form — same split InterestForForm uses
// for its own clientId.
export type ViewingFormValues = Omit<ViewingInput, "clientId">;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_VALUES: ViewingFormValues = {
  date: todayIsoDate(),
  listingType: "Property",
  listingId: "",
  comment: "",
  signatureDocumentId: null,
};

interface ViewingFormProps {
  initialValues?: Partial<ViewingFormValues>;
  clientId: string;
  propertyListings: Property[];
  landListings: Land[];
  propertyCategories: PropertyCategory[];
  floorLevels: FloorLevel[];
  landCategories: LandCategory[];
  attachments: Attachment[];
  onAttachmentUploaded: (attachment: Attachment) => void;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: ViewingFormValues) => void;
  onCancel: () => void;
}

export default function ViewingForm({
  initialValues,
  clientId,
  propertyListings,
  landListings,
  propertyCategories,
  floorLevels,
  landCategories,
  attachments,
  onAttachmentUploaded,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: ViewingFormProps) {
  const t = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ViewingFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
    date: initialValues?.date ? initialValues.date.slice(0, 10) : EMPTY_VALUES.date,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [listingError, setListingError] = useState<string | null>(null);

  const listingOptions = values.listingType === "Property" ? propertyListings : landListings;

  const handleListingTypeChange = (listingType: ViewingFormValues["listingType"]) => {
    // Listing options differ per type — a previously picked listing id would silently point at
    // the wrong collection, so it's cleared rather than carried over (same reasoning
    // InterestForForm's category clear already established).
    setValues((prev) => ({ ...prev, listingType, listingId: "" }));
  };

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("entityType", "Client");
      formData.append("entityId", clientId);
      formData.append("files", file);
      const response = await apiClient.post<ApiResponse<Attachment[]>>("/api/attachments", formData);
      const uploaded = response.data.data[0];
      if (uploaded) {
        onAttachmentUploaded(uploaded);
        setValues((prev) => ({ ...prev, signatureDocumentId: uploaded.id }));
      }
    } catch (err) {
      setUploadError(getErrorMessage(err, t("viewings.form.uploadError")));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // SearchableSelect isn't a native form control, so the browser's own `required` validation
    // can't reach it — this is the manual equivalent, same field the API itself also validates.
    if (!values.listingId) {
      setListingError(t("viewings.form.listingRequired"));
      return;
    }
    setListingError(null);
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <div className={sharedStyles.formGrid}>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="vw-date">
            {t("viewings.form.date")}
          </label>
          <input
            id="vw-date"
            type="date"
            required
            className={sharedStyles.input}
            value={values.date}
            onChange={(event) => setValues((prev) => ({ ...prev, date: event.target.value }))}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="vw-listingType">
            {t("viewings.form.listingType")}
          </label>
          <select
            id="vw-listingType"
            required
            className={sharedStyles.input}
            value={values.listingType}
            onChange={(event) =>
              handleListingTypeChange(event.target.value as ViewingFormValues["listingType"])
            }
          >
            {INTEREST_FOR_LISTING_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`viewings.listingType.${type}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* One field per row, deliberately outside formGrid's 2-column layout — both need the extra
          width: Signature Document to read comfortably at a larger size, the listing picker to
          show Category/Floor/Address per option legibly. */}
      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="vw-signatureDocument">
          {t("viewings.form.signatureDocument")}
        </label>
        <select
          id="vw-signatureDocument"
          className={`${sharedStyles.input} text-base py-3`}
          value={values.signatureDocumentId ?? ""}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, signatureDocumentId: event.target.value || null }))
          }
        >
          <option value="">{t("viewings.form.signatureDocumentNone")}</option>
          {attachments.map((attachment) => (
            <option key={attachment.id} value={attachment.id}>
              {attachment.title}
            </option>
          ))}
        </select>
        {uploadError && <p className={sharedStyles.errorText}>{uploadError}</p>}
        <Button
          type="button"
          variant="outline"
          className="mt-2"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={14} />
          <span>{uploading ? t("viewings.form.uploading") : t("viewings.form.uploadNew")}</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            handleUpload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="vw-listing">
          {t("viewings.form.listing")}
        </label>
        <SearchableSelect
          id="vw-listing"
          value={values.listingId}
          onChange={(listingId) => setValues((prev) => ({ ...prev, listingId }))}
          placeholder={t("common.selectPlaceholder")}
          options={listingOptions.map((listing) => ({
            value: listing.id,
            label: listingLabel(listing, values.listingType, propertyCategories, floorLevels, landCategories),
          }))}
        />
        {listingError && <p className={sharedStyles.errorText}>{listingError}</p>}
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="vw-comment">
          {t("viewings.form.comment")}
        </label>
        <textarea
          id="vw-comment"
          rows={4}
          className={sharedStyles.input}
          value={values.comment ?? ""}
          onChange={(event) => setValues((prev) => ({ ...prev, comment: event.target.value }))}
        />
      </div>

      <div className={sharedStyles.formActions}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading ? t("common.saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
