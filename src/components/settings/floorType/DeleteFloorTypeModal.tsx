"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { FloorType } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface DeleteFloorTypeModalProps {
  isOpen: boolean;
  floorType: FloorType | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteFloorTypeModal({
  isOpen,
  floorType,
  onClose,
  onDeleted,
}: DeleteFloorTypeModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!floorType) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/floor-types/${floorType.id}`);
      MessageHandler.success(dispatch, t("settingsPool.deletedMessage", { label: t("settingsEntities.floorType"), name: floorType.name }));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("settingsPool.deleteError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !floorType) return null;

  return (
    <Modal isOpen={isOpen} title={t("settingsPool.deleteModalTitle", { label: t("settingsEntities.floorType") })} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">{t("settingsPool.deleteConfirm", { name: floorType.name })}</p>
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
