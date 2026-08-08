"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Realtor, RealtorInput } from "@/lib/types";
import RealtorForm from "./RealtorForm";

interface EditRealtorModalProps {
  isOpen: boolean;
  realtor: Realtor | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditRealtorModal({ isOpen, realtor, onClose, onSaved }: EditRealtorModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: RealtorInput) => {
    if (!realtor) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/realtors/${realtor.id}`, values);
      MessageHandler.success(
        dispatch,
        t("realtors.editModal.success", { name: `${values.firstName} ${values.lastName}` })
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("realtors.addModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !realtor) return null;

  return (
    <Modal
      isOpen={isOpen}
      title={t("realtors.editModal.title", { name: `${realtor.firstName} ${realtor.lastName}` })}
      onClose={onClose}
    >
      <RealtorForm
        key={realtor.id}
        initialValues={realtor}
        submitLabel={t("realtors.editModal.submitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
