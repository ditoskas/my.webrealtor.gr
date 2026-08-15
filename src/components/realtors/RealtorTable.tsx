import { Mail, Phone, Smartphone, MapPin, Home, Users, LandPlot, Eye, Pencil, Trash2, MessagesSquare } from "lucide-react";
import type { Realtor } from "@/lib/types";
import { Card, Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./RealtorsPage.module.scss";

interface RealtorTableProps {
  realtors: Realtor[];
  onView: (realtor: Realtor) => void;
  onEdit: (realtor: Realtor) => void;
  onDelete: (realtor: Realtor) => void;
  onMessages: (realtor: Realtor) => void;
}

export default function RealtorTable({ realtors, onView, onEdit, onDelete, onMessages }: RealtorTableProps) {
  const t = useTranslation();

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className={styles.table}>
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("realtors.table.headerRealtor")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("realtors.table.headerContact")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("realtors.table.headerLocation")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("realtors.table.headerStats")}</th>
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("realtors.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {realtors.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>{t("realtors.table.empty")}</td>
              </tr>
            ) : (
              realtors.map((realtor) => {
                const hasMapUrl = Boolean(realtor.googleMapsUrl);
                const locationContent = (
                  <>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-neutral-400 shrink-0" />
                      <span>{realtor.city || "—"}</span>
                    </div>
                    {realtor.address && (
                      <div className="text-xs text-neutral-400 pl-[18px]">{realtor.address}</div>
                    )}
                  </>
                );

                return (
                  <tr key={realtor.id} className="hover:bg-neutral-50/60">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-neutral-900 block">
                        {realtor.firstName} {realtor.lastName}
                      </span>
                      {realtor.website && (
                        <a
                          href={realtor.website.startsWith("http") ? realtor.website : `https://${realtor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-400 hover:text-brand-600 hover:underline"
                        >
                          {realtor.website.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      <div className="space-y-1">
                        <a
                          href={`mailto:${realtor.email}`}
                          className="flex items-center gap-1.5 hover:text-brand-600 hover:underline"
                        >
                          <Mail size={12} className="text-neutral-400 shrink-0" />
                          <span>{realtor.email}</span>
                        </a>
                        {realtor.phone && (
                          <a
                            href={`tel:${realtor.phone}`}
                            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-600 hover:underline"
                          >
                            <Phone size={12} className="text-neutral-400 shrink-0" />
                            <span>{realtor.phone}</span>
                          </a>
                        )}
                        {realtor.mobile && (
                          <a
                            href={`tel:${realtor.mobile}`}
                            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-600 hover:underline"
                          >
                            <Smartphone size={12} className="text-neutral-400 shrink-0" />
                            <span>{realtor.mobile}</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {hasMapUrl ? (
                        <a
                          href={realtor.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-brand-600 hover:underline"
                          title={t("realtors.table.mapsTitle")}
                        >
                          {locationContent}
                        </a>
                      ) : (
                        locationContent
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <Home size={12} className="text-neutral-400 shrink-0" />
                        <span>{t("realtors.table.statsProperties", { count: realtor.propertyCount ?? 0 })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <LandPlot size={12} className="text-neutral-400 shrink-0" />
                        <span>{t("realtors.table.statsLand", { count: realtor.landCount ?? 0 })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Users size={12} className="text-neutral-400 shrink-0" />
                        <span>{t("realtors.table.statsClients", { count: realtor.clientCount ?? 0 })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("realtors.table.viewTitle")}
                        aria-label={t("realtors.table.viewTitle")}
                        onClick={() => onView(realtor)}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("realtors.table.messagesTitle")}
                        aria-label={t("realtors.table.messagesTitle")}
                        onClick={() => onMessages(realtor)}
                      >
                        <MessagesSquare size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("realtors.table.editTitle")}
                        aria-label={t("realtors.table.editTitle")}
                        onClick={() => onEdit(realtor)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("realtors.table.deleteTitle")}
                        aria-label={t("realtors.table.deleteTitle")}
                        onClick={() => onDelete(realtor)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
