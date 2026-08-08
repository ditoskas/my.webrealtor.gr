"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Property } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface DeletePropertyModalProps {
  isOpen: boolean;
  property: Property | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeletePropertyModal({ isOpen, property, onClose, onDeleted }: DeletePropertyModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!property) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/api/properties/${property.id}`);
      MessageHandler.success(dispatch, t("properties.deleteModal.success", { title: property.title || t("properties.detail.untitledListing") }));
      onDeleted();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("properties.deleteModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !property) return null;

  return (
    <Modal isOpen={isOpen} title={t("properties.deleteModal.title")} onClose={onClose}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">
        {t("properties.deleteModal.confirm", { title: property.title || t("properties.deleteModal.fallbackTitle") })}
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
