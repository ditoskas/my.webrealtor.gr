"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, MediaManager } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, Asset, PropertyImage } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./AssetMediaPage.module.scss";

interface AssetMediaPageProps {
  assetId: string;
}

// Merges the old PropertyMediaPage + LandMediaPage (already near-byte-identical) into one — see
// CLAUDE.md → "Asset management". Uploads (POST /api/uploads) land in local state immediately;
// nothing is persisted to the Asset document until Save Changes calls PUT /api/assets/[id]/images,
// so a page navigated away from mid-upload just leaves orphaned files on disk rather than a
// half-saved listing — an accepted trade-off, not a bug.
export default function AssetMediaPage({ assetId }: AssetMediaPageProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAsset = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<Asset>>(`/api/assets/${assetId}`);
      setAsset(response.data.data);
      setImages(response.data.data.images ?? []);
    } catch {
      setError(t("assets.detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [assetId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadAsset();
  }, [loadAsset]);

  const handleFilesSelected = async (files: File[]) => {
    if (!asset) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("realtorId", asset.realtorId);
      formData.append("listingId", asset.id);
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
      await apiClient.put(`/api/assets/${assetId}/images`, { images });
      MessageHandler.success(dispatch, t("media.saveSuccess"));
      router.push("/assets");
    } catch (err) {
      setError(getErrorMessage(err, t("media.saveError")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("assets.detail.loadingDetail")}</p>;
  }

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>
            {t("media.pageTitle", { title: asset?.title || t("media.untitledListing") })}
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
        <Button type="button" variant="outline" onClick={() => router.push("/assets")} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? t("common.saving") : t("media.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
