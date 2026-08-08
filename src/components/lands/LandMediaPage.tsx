"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, MediaManager } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, Land, PropertyImage } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./LandMediaPage.module.scss";

interface LandMediaPageProps {
  landId: string;
}

// Same full-page pattern and upload/save flow as PropertyMediaPage — see that component's comment
// for the reasoning (both apply identically here, Land's images are the same shape as Property's).
export default function LandMediaPage({ landId }: LandMediaPageProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();

  const [land, setLand] = useState<Land | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLand = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<Land>>(`/api/lands/${landId}`);
      setLand(response.data.data);
      setImages(response.data.data.images ?? []);
    } catch {
      setError(t("land.detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [landId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadLand();
  }, [loadLand]);

  const handleFilesSelected = async (files: File[]) => {
    if (!land) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("realtorId", land.realtorId);
      formData.append("listingId", land.id);
      const response = await apiClient.post<ApiResponse<PropertyImage[]>>("/api/uploads", formData);
      setImages((prev) => [...prev, ...response.data.data]);
    } catch (err) {
      setError(getErrorMessage(err, t("media.uploadError")));
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (id: string, patch: Partial<Pick<PropertyImage, "alt" | "description">>) => {
    setImages((prev) => prev.map((image) => (image.id === id ? { ...image, ...patch } : image)));
  };

  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const handleReorder = (reordered: PropertyImage[]) => {
    setImages(reordered);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiClient.put(`/api/lands/${landId}/images`, { images });
      MessageHandler.success(dispatch, t("media.saveSuccess"));
      router.push("/lands");
    } catch (err) {
      setError(getErrorMessage(err, t("media.saveError")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("land.detail.loadingDetail")}</p>;
  }

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>
            {t("media.pageTitle", { title: land?.title || t("media.untitledListing") })}
          </h2>
          <p className={sharedStyles.pageSubtitle}>{t("media.pageSubtitle")}</p>
        </div>
      </div>

      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <Card className={styles.card}>
        <MediaManager
          images={images}
          uploading={uploading}
          onFilesSelected={handleFilesSelected}
          onImageChange={handleImageChange}
          onRemove={handleRemove}
          onReorder={handleReorder}
        />
      </Card>

      <div className={sharedStyles.formActions}>
        <Button type="button" variant="outline" onClick={() => router.push("/lands")} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? t("common.saving") : t("media.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
