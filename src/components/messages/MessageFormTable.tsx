"use client";

import { Pencil, Trash2, Copy } from "lucide-react";
import type { MessageForm } from "@/lib/types";
import { Card, Button } from "@/components/ui";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import { MessageHandler } from "@/helpers/messageHandler";
import sharedStyles from "@/styles/shared.module.scss";

interface MessageFormTableProps {
  messageForms: MessageForm[];
  onEdit: (messageForm: MessageForm) => void;
  onDelete: (messageForm: MessageForm) => void;
}

export default function MessageFormTable({ messageForms, onEdit, onDelete }: MessageFormTableProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();

  const handleCopyGuid = async (guid: string) => {
    await navigator.clipboard.writeText(guid);
    MessageHandler.success(dispatch, t("messageForms.table.copyGuidSuccess"));
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("messageForms.table.headerSlug")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("messageForms.table.headerSubject")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("messageForms.table.headerRecipient")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("messageForms.table.headerGuid")}</th>
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("messageForms.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {messageForms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("messageForms.table.empty")}
                </td>
              </tr>
            ) : (
              messageForms.map((messageForm) => (
                <tr key={messageForm.id} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4 font-semibold text-neutral-900">{messageForm.slug}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{messageForm.subject}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{messageForm.recipient}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-neutral-400 font-mono truncate max-w-[10rem]">
                        {messageForm.guid}
                      </span>
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("messageForms.table.copyGuid")}
                        aria-label={t("messageForms.table.copyGuid")}
                        onClick={() => handleCopyGuid(messageForm.guid)}
                      >
                        <Copy size={12} />
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("messageForms.table.editTitle")}
                      aria-label={t("messageForms.table.editTitle")}
                      onClick={() => onEdit(messageForm)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("messageForms.table.deleteTitle")}
                      aria-label={t("messageForms.table.deleteTitle")}
                      onClick={() => onDelete(messageForm)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
