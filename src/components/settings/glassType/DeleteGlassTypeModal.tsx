"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { GlassType } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface DeleteGlassTypeModalProps {
  isOpen: boolean;
  glassType: GlassType | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteGlassTypeModal({
  isOpen,
  glassType,
  onClose,
  onDeleted,
}: DeleteGlassTypeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!glassType) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/glass-types/${glassType.id}`);
      MessageHandler.success(dispatch, t("settingsPool.deletedMessage", { label: t("settingsEntities.glassType"), name: glassType.name }));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.deleteError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !glassType) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.deleteModalTitle", { label: t("settingsEntities.glassType") })} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">{t("settingsPool.deleteConfirm", { name: glassType.name })}</p>
      <div className="flex gap-2">
        <Button variant="danger" onClick={handleConfirm} disabled={loading}>
          {loading ? t("common.deleting") : t("common.delete")}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {t("common.cancel")}
        </Button>
      </div>
    </Modal>
  );
}
