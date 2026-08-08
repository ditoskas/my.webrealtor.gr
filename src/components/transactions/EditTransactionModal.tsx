"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { Transaction, TransactionInput } from "@/lib/types";
import TransactionForm from "./TransactionForm";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTransactionModal({
  isOpen,
  transaction,
  onClose,
  onSaved,
}: EditTransactionModalProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: TransactionInput) => {
    if (!transaction) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/api/transactions/${transaction.id}`, values);
      MessageHandler.success(dispatch, t("transactions.updateSuccess"));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("transactions.saveError")));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <Modal isOpen={isOpen} title={t("transactions.editTitle")} onClose={onClose}>
      <TransactionForm
        key={transaction.id}
        initialValues={transaction}
        submitLabel={t("common.save")}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
