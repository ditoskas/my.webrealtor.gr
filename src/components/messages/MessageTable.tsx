import { Eye, Trash2 } from "lucide-react";
import type { Message } from "@/lib/types";
import { Card, Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import { formatDateTime } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";

interface MessageTableProps {
  messages: Message[];
  realtorNames: Record<string, string>;
  showRealtorColumn: boolean;
  canEdit: boolean;
  onView: (message: Message) => void;
  onDelete: (message: Message) => void;
}

function bodyPreview(body: Record<string, unknown>): string {
  const preview = Object.entries(body)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(", ");
  return preview.length > 80 ? `${preview.slice(0, 80)}…` : preview;
}

export default function MessageTable({
  messages,
  realtorNames,
  showRealtorColumn,
  canEdit,
  onView,
  onDelete,
}: MessageTableProps) {
  const t = useTranslation();
  const columnCount = 6 + (showRealtorColumn ? 1 : 0);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("messages.table.headerDate")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("messages.table.headerSlug")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("messages.table.headerSubject")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("messages.table.headerRecipient")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("messages.table.headerBody")}</th>
              {showRealtorColumn && <th className={sharedStyles.tableHeaderCell}>{t("messages.table.headerRealtor")}</th>}
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("messages.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {messages.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("messages.table.empty")}
                </td>
              </tr>
            ) : (
              messages.map((message) => (
                <tr key={message.id} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4 text-xs text-neutral-400 whitespace-nowrap">
                    {formatDateTime(message.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900">{message.slug}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{message.subject}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{message.recipient}</td>
                  <td className="px-6 py-4 text-xs text-neutral-500 max-w-xs truncate" title={bodyPreview(message.body)}>
                    {bodyPreview(message.body)}
                  </td>
                  {showRealtorColumn && (
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {realtorNames[message.realtorId] ?? "—"}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("messages.table.viewTitle")}
                      aria-label={t("messages.table.viewTitle")}
                      onClick={() => onView(message)}
                    >
                      <Eye size={14} />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("messages.table.deleteTitle")}
                        aria-label={t("messages.table.deleteTitle")}
                        onClick={() => onDelete(message)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
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
