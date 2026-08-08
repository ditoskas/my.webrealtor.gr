"use client";

import Modal from "./Modal";
import Button from "./Button";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

// Generic yes/no confirmation dialog — for a full entity's own delete flow (Realtor, Client,
// Property, Land, the 15 Settings pool entities) each still gets its own dedicated DeleteXModal,
// since those already carry entity-specific copy/logic. This is for the smaller, structurally
// identical sub-resource deletes (Notes, Files) that don't warrant their own bespoke modal each.
export default function ConfirmModal({ isOpen, title, message, loading = false, error, onConfirm, onCancel }: ConfirmModalProps) {
  const t = useTranslation();

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}
      <p className="text-sm text-neutral-500 mb-4">{message}</p>
      <div className="flex gap-2">
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? t("common.deleting") : t("common.delete")}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {t("common.cancel")}
        </Button>
      </div>
    </Modal>
  );
}
