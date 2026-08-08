"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Client, ClientInput } from "@/lib/types";
import ClientForm from "./ClientForm";

interface EditClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditClientModal({ isOpen, client, onClose, onSaved }: EditClientModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ClientInput) => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/clients/${client.id}`, values);
      MessageHandler.success(dispatch, t("clients.editModal.success", { name: `${values.firstName} ${values.lastName}` }));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("clients.addModal.error")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <Modal
      isOpen={isOpen}
      title={t("clients.editModal.title", { name: `${client.firstName} ${client.lastName}` })}
      onClose={onClose}
    >
      <ClientForm
        key={client.id}
        initialValues={{
          gender: client.gender ?? "",
          firstName: client.firstName,
          lastName: client.lastName,
          tin: client.tin ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          mobile: client.mobile ?? "",
          city: client.city ?? "",
          address: client.address ?? "",
          zipcode: client.zipcode ?? "",
          realtorId: client.realtorId,
        }}
        submitLabel={t("clients.editModal.submitLabel")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
