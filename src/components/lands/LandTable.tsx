import { Images, FolderOpen, Pencil, Trash2 } from "lucide-react";
import type { Land, PropertyStatus } from "@/lib/types";
import { Card, Button, Badge } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./LandsPage.module.scss";

const STATUS_VARIANT: Record<PropertyStatus, "active" | "pending" | "inactive"> = {
  active: "active",
  pending: "pending",
  inactive: "inactive",
};

interface LandTableProps {
  lands: Land[];
  realtorNames: Record<string, string>;
  showRealtorColumn: boolean;
  canEdit: boolean;
  onDetails: (land: Land) => void;
  onEdit: (land: Land) => void;
  onDelete: (land: Land) => void;
  onMedia: (land: Land) => void;
}

export default function LandTable({
  lands,
  realtorNames,
  showRealtorColumn,
  canEdit,
  onDetails,
  onEdit,
  onDelete,
  onMedia,
}: LandTableProps) {
  const t = useTranslation();
  // Actions column is always present — the Notes action is visible to every role, unlike
  // Media/Edit/Delete which stay canEdit-gated (same pattern as PropertyTable's View action).
  const columnCount = 6 + (showRealtorColumn ? 1 : 0);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className={styles.table}>
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("land.table.headerType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("land.table.headerListing")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("land.table.headerStatus")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("land.table.headerLocation")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("land.table.headerPrice")}</th>
              {showRealtorColumn && <th className={sharedStyles.tableHeaderCell}>{t("land.table.headerRealtor")}</th>}
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("land.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lands.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("land.table.empty")}
                </td>
              </tr>
            ) : (
              lands.map((land) => (
                <tr key={land.id} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4 text-sm font-semibold text-neutral-900">
                    {land.transactionType === "rent" ? t("land.table.forRent") : t("land.table.forSale")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-neutral-900 block">
                      {land.title || t("land.table.listingFallback", { id: land.id.slice(-6) })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={STATUS_VARIANT[land.status]}>{t(`land.status.${land.status}`)}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {[land.neighborhood, land.city].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-neutral-900">
                    {land.price.toLocaleString()} {land.currency}
                  </td>
                  {showRealtorColumn && (
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {realtorNames[land.realtorId] ?? "—"}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("entityDetails.action")}
                      aria-label={t("entityDetails.action")}
                      onClick={() => onDetails(land)}
                    >
                      <FolderOpen size={14} />
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("land.table.mediaTitle")}
                          aria-label={t("land.table.mediaTitle")}
                          onClick={() => onMedia(land)}
                        >
                          <Images size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("land.table.editTitle")}
                          aria-label={t("land.table.editTitle")}
                          onClick={() => onEdit(land)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("land.table.deleteTitle")}
                          aria-label={t("land.table.deleteTitle")}
                          onClick={() => onDelete(land)}
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
