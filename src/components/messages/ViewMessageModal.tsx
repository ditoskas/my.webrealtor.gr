"use client";

import { Modal, Badge } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import { formatDateTime } from "@/lib/formatDate";
import type { Message } from "@/lib/types";

interface ViewMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
}

export default function ViewMessageModal({ isOpen, message, onClose }: ViewMessageModalProps) {
  const t = useTranslation();

  if (!isOpen || !message) return null;

  return (
    <Modal isOpen={isOpen} title={t("messages.viewModal.title")} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-neutral-600">
          <span>{formatDateTime(message.createdAt)}</span>
          <Badge variant={message.emailSent ? "active" : "danger"}>
            {message.emailSent ? t("messages.viewModal.emailSent") : t("messages.viewModal.emailNotSent")}
          </Badge>
        </div>
        <dl className="divide-y divide-neutral-100 border border-neutral-100 rounded-md overflow-hidden">
          {Object.entries(message.body).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-2 px-3 py-2">
              <dt className="col-span-1 font-medium text-neutral-500 break-words">{key}</dt>
              <dd className="col-span-2 text-neutral-900 break-words">
                {typeof value === "string" ? value : JSON.stringify(value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}
