"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { InterestFor, LandCategory, PropertyCategory } from "@/lib/types";
import InterestForForm, { type InterestForFormValues } from "./InterestForForm";

interface EditInterestForModalProps {
  isOpen: boolean;
  clientId: string;
  interest: InterestFor | null;
  propertyCategories: PropertyCategory[];
  landCategories: LandCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export default function EditInterestForModal({
  isOpen,
  clientId,
  interest,
  propertyCategories,
  landCategories,
  onClose,
  onSaved,
}: EditInterestForModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: InterestForFormValues) => {
    if (!interest) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/clients/${clientId}/interest-for/${interest.id}`, values);
      MessageHandler.success(dispatch, t("interestFor.updateSuccess"));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("interestFor.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !interest) return null;

  return (
    <Modal isOpen={isOpen} title={t("interestFor.editTitle")} onClose={onClose}>
      <InterestForForm
        key={interest.id}
        initialValues={interest}
        propertyCategories={propertyCategories}
        landCategories={landCategories}
        submitLabel={t("common.save")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
