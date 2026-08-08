"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { TransactionInput } from "@/lib/types";
import TransactionForm from "./TransactionForm";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddTransactionModal({ isOpen, onClose, onSaved }: AddTransactionModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: TransactionInput) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/transactions", values);
      MessageHandler.success(dispatch, t("transactions.createSuccess"));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("transactions.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("transactions.addButton")} onClose={onClose}>
      <TransactionForm
        key="new"
        submitLabel={t("transactions.addButton")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
