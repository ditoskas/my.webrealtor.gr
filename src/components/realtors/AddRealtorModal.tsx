"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { RealtorInput } from "@/lib/types";
import RealtorForm from "./RealtorForm";

interface AddRealtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddRealtorModal({ isOpen, onClose, onSaved }: AddRealtorModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: RealtorInput) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/realtors", values);
      MessageHandler.success(
        dispatch,
        t("realtors.addModal.success", { name: `${values.firstName} ${values.lastName}` })
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("realtors.addModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("realtors.addModal.title")} onClose={onClose}>
      <RealtorForm
        key="new"
        submitLabel={t("realtors.register")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
