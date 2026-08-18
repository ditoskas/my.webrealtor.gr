"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Asset, Attachment, FloorLevel, LandCategory, PropertyCategory } from "@/lib/types";
import ViewingForm, { type ViewingFormValues } from "./ViewingForm";

interface AddViewingModalProps {
  isOpen: boolean;
  clientId: string;
  listings: Asset[];
  propertyCategories: PropertyCategory[];
  floorLevels: FloorLevel[];
  landCategories: LandCategory[];
  attachments: Attachment[];
  onAttachmentUploaded: (attachment: Attachment) => void;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddViewingModal({
  isOpen,
  clientId,
  listings,
  propertyCategories,
  floorLevels,
  landCategories,
  attachments,
  onAttachmentUploaded,
  onClose,
  onSaved,
}: AddViewingModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ViewingFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/clients/${clientId}/viewings`, values);
      MessageHandler.success(dispatch, t("viewings.createSuccess"));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("viewings.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("viewings.addButton")} onClose={onClose}>
      <ViewingForm
        key="new"
        clientId={clientId}
        listings={listings}
        propertyCategories={propertyCategories}
        floorLevels={floorLevels}
        landCategories={landCategories}
        attachments={attachments}
        onAttachmentUploaded={onAttachmentUploaded}
        submitLabel={t("viewings.addButton")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
