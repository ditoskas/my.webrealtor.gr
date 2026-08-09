"use client";

import { useRef, useState } from "react";
import { Trash2, UploadCloud, UserRound } from "lucide-react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/store/hooks";
import type { ApiResponse, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./RealtorImageUpload.module.scss";

interface RealtorImageUploadProps {
  realtorId: string;
  imageUrl: string | null | undefined;
  onUpdated: (imageUrl: string | null) => void;
}

// Shared by RealtorViewPage (Root) and ProfilePage's Realtor Info card (Administrator, self-service)
// — see CLAUDE.md → "Realtor management" for the imageUrl field itself. Deliberately its own small
// component rather than folded into RealtorForm: RealtorForm is also used for create (AddRealtorModal,
// ConfirmRegistrationPage), where there's no realtorId yet to upload against — see
// POST /api/realtors/[id]/image, which requires an existing realtor.
export default function RealtorImageUpload({ realtorId, imageUrl, onUpdated }: RealtorImageUploadProps) {
  const t = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post<ApiResponse<Realtor>>(`/api/realtors/${realtorId}/image`, formData);
      onUpdated(response.data.data.imageUrl ?? null);
    } catch (err) {
      setError(getErrorMessage(err, t("realtors.image.uploadError")));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/realtors/${realtorId}/image`);
      onUpdated(null);
    } catch (err) {
      setError(getErrorMessage(err, t("realtors.image.removeError")));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.avatar}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded file served from UPLOADS_DIR, not a next/image-optimizable static asset
          <img src={imageUrl} alt="" className={styles.avatarImg} />
        ) : (
          <UserRound size={28} className={styles.avatarPlaceholder} />
        )}
      </div>
      <div className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={14} />
          <span>{uploading ? t("realtors.image.uploading") : imageUrl ? t("realtors.image.change") : t("realtors.image.upload")}</span>
        </Button>
        {imageUrl && (
          <Button type="button" variant="ghost" disabled={uploading} onClick={handleRemove}>
            <Trash2 size={14} />
            <span>{t("realtors.image.remove")}</span>
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            handleUpload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
    </div>
  );
}
