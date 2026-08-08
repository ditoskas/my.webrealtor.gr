"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { LandCategory, PropertyCategory } from "@/lib/types";
import InterestForForm, { type InterestForFormValues } from "./InterestForForm";

interface AddInterestForModalProps {
  isOpen: boolean;
  clientId: string;
  propertyCategories: PropertyCategory[];
  landCategories: LandCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AddInterestForModal({
  isOpen,
  clientId,
  propertyCategories,
  landCategories,
  onClose,
  onSaved,
}: AddInterestForModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: InterestForFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/clients/${clientId}/interest-for`, values);
      MessageHandler.success(dispatch, t("interestFor.createSuccess"));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("interestFor.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("interestFor.addButton")} onClose={onClose}>
      <InterestForForm
        key="new"
        propertyCategories={propertyCategories}
        landCategories={landCategories}
        submitLabel={t("interestFor.addButton")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
