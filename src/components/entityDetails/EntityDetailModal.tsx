"use client";

import { Modal } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import type { AttachableEntityType } from "@/lib/types";
import EntityDetailTabs from "./EntityDetailTabs";

interface EntityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: AttachableEntityType;
  entityId: string;
  entityLabel: string;
}

// Modal wrapper around EntityDetailTabs — used only by entities with no view/detail page of their
// own to embed the tabs in directly (currently just Land). See CLAUDE.md → "Files (Attachments)".
export default function EntityDetailModal({ isOpen, onClose, entityType, entityId, entityLabel }: EntityDetailModalProps) {
  const t = useTranslation();

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={t("entityDetails.modalTitle", { label: entityLabel })} onClose={onClose}>
      <EntityDetailTabs entityType={entityType} entityId={entityId} />
    </Modal>
  );
}
