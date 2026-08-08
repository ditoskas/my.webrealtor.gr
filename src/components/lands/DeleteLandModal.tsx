"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Land } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface DeleteLandModalProps {
  isOpen: boolean;
  land: Land | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteLandModal({ isOpen, land, onClose, onDeleted }: DeleteLandModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!land) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/lands/${land.id}`);
      MessageHandler.success(dispatch, t("land.deleteModal.success", { title: land.title || "" }));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("land.deleteModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !land) return null;

  return (
    <Modal isOpen={isOpen} title={t("land.deleteModal.title")} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">
        {t("land.deleteModal.confirm", { title: land.title || t("land.deleteModal.fallbackTitle") })}
      </p>
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
