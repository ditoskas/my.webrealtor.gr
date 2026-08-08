import { Mail, Phone, Smartphone, MapPin, Eye, Pencil, Trash2 } from "lucide-react";
import type { Client } from "@/lib/types";
import { Card, Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";

interface ClientTableProps {
  clients: Client[];
  realtorNames: Record<string, string>;
  showRealtorColumn: boolean;
  canEdit: boolean;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export default function ClientTable({
  clients,
  realtorNames,
  showRealtorColumn,
  canEdit,
  onView,
  onEdit,
  onDelete,
}: ClientTableProps) {
  const t = useTranslation();
  // Actions column is always present — the View action is visible to every role, unlike
  // Edit/Delete which stay canEdit-gated (same pattern as PropertyTable's View action).
  const columnCount = 4 + (showRealtorColumn ? 1 : 0);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("clients.table.headerClient")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("clients.table.headerContact")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("clients.table.headerLocation")}</th>
              {showRealtorColumn && <th className={sharedStyles.tableHeaderCell}>{t("clients.table.headerRealtor")}</th>}
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("clients.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("clients.table.empty")}
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-neutral-900 block">
                      {client.firstName} {client.lastName}
                    </span>
                    {client.tin && (
                      <span className="text-xs text-neutral-400">{t("clients.table.tin", { tin: client.tin })}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    <div className="space-y-1">
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-1.5 hover:text-brand-600 hover:underline"
                        >
                          <Mail size={12} className="text-neutral-400 shrink-0" />
                          <span>{client.email}</span>
                        </a>
                      )}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-600 hover:underline"
                        >
                          <Phone size={12} className="text-neutral-400 shrink-0" />
                          <span>{client.phone}</span>
                        </a>
                      )}
                      {client.mobile && (
                        <a
                          href={`tel:${client.mobile}`}
                          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-600 hover:underline"
                        >
                          <Smartphone size={12} className="text-neutral-400 shrink-0" />
                          <span>{client.mobile}</span>
                        </a>
                      )}
                      {!client.email && !client.phone && !client.mobile && "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-neutral-400 shrink-0" />
                      <span>{client.city || "—"}</span>
                    </div>
                    {client.address && (
                      <div className="text-xs text-neutral-400 pl-[18px]">{client.address}</div>
                    )}
                  </td>
                  {showRealtorColumn && (
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {realtorNames[client.realtorId] ?? "—"}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("clients.table.viewTitle")}
                      aria-label={t("clients.table.viewTitle")}
                      onClick={() => onView(client)}
                    >
                      <Eye size={14} />
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("clients.table.editTitle")}
                          aria-label={t("clients.table.editTitle")}
                          onClick={() => onEdit(client)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("clients.table.deleteTitle")}
                          aria-label={t("clients.table.deleteTitle")}
                          onClick={() => onDelete(client)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
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
