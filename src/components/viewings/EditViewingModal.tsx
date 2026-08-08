"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Attachment, FloorLevel, Land, LandCategory, Property, PropertyCategory, Viewing } from "@/lib/types";
import ViewingForm, { type ViewingFormValues } from "./ViewingForm";

interface EditViewingModalProps {
  isOpen: boolean;
  clientId: string;
  viewing: Viewing | null;
  propertyListings: Property[];
  landListings: Land[];
  propertyCategories: PropertyCategory[];
  floorLevels: FloorLevel[];
  landCategories: LandCategory[];
  attachments: Attachment[];
  onAttachmentUploaded: (attachment: Attachment) => void;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditViewingModal({
  isOpen,
  clientId,
  viewing,
  propertyListings,
  landListings,
  propertyCategories,
  floorLevels,
  landCategories,
  attachments,
  onAttachmentUploaded,
  onClose,
  onSaved,
}: EditViewingModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ViewingFormValues) => {
    if (!viewing) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/clients/${clientId}/viewings/${viewing.id}`, values);
      MessageHandler.success(dispatch, t("viewings.updateSuccess"));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("viewings.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !viewing) return null;

  return (
    <Modal isOpen={isOpen} title={t("viewings.editTitle")} onClose={onClose}>
      <ViewingForm
        key={viewing.id}
        initialValues={viewing}
        clientId={clientId}
        propertyListings={propertyListings}
        landListings={landListings}
        propertyCategories={propertyCategories}
        floorLevels={floorLevels}
        landCategories={landCategories}
        attachments={attachments}
        onAttachmentUploaded={onAttachmentUploaded}
        submitLabel={t("common.save")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
