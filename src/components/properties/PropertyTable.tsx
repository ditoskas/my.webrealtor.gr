import Link from "next/link";
import { Eye, Images, Pencil, Phone, Trash2 } from "lucide-react";
import type { Property } from "@/lib/types";
import { Card, Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./PropertiesPage.module.scss";

interface OwnerInfo {
  name: string;
  phone: string;
}

interface PropertyTableProps {
  properties: Property[];
  realtorNames: Record<string, string>;
  categoryNames: Record<string, string>;
  owners: Record<string, OwnerInfo>;
  showRealtorColumn: boolean;
  canEdit: boolean;
  onView: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onMedia: (property: Property) => void;
}

export default function PropertyTable({
  properties,
  realtorNames,
  categoryNames,
  owners,
  showRealtorColumn,
  canEdit,
  onView,
  onEdit,
  onDelete,
  onMedia,
}: PropertyTableProps) {
  const t = useTranslation();
  // Actions column is always present now — the View action is visible to every role, unlike
  // Media/Edit/Delete which stay canEdit-gated.
  const columnCount = 6 + (showRealtorColumn ? 1 : 0);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className={styles.table}>
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("properties.table.headerType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("properties.table.headerCategory")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("properties.table.headerSize")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("properties.table.headerLocation")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("properties.table.headerPrice")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("properties.table.headerOwner")}</th>
              {showRealtorColumn && <th className={sharedStyles.tableHeaderCell}>{t("properties.table.headerRealtor")}</th>}
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("properties.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {properties.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("properties.table.empty")}
                </td>
              </tr>
            ) : (
              properties.map((property) => {
                const owner = property.clientId ? owners[property.clientId] : undefined;
                return (
                <tr
                  key={property.id}
                  className={
                    property.status === "inactive"
                      ? "bg-neutral-100 hover:bg-neutral-200/60"
                      : "hover:bg-neutral-50/60"
                  }
                >
                  <td className="px-6 py-4 text-sm font-semibold text-neutral-900">
                    {property.transactionType === "rent" ? t("properties.table.forRent") : t("properties.table.forSale")}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {(property.propertyCategoryId && categoryNames[property.propertyCategoryId]) ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{property.area} m²</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {[property.city, property.region, property.address].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-neutral-900">
                    {property.price.toLocaleString()} {property.currency}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {owner ? (
                      <div className="space-y-0.5">
                        <Link
                          href={`/clients/${property.clientId}/view`}
                          className="block text-neutral-900 font-medium hover:text-brand-600 hover:underline"
                        >
                          {owner.name}
                        </Link>
                        {owner.phone && (
                          <a
                            href={`tel:${owner.phone}`}
                            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-600 hover:underline"
                          >
                            <Phone size={12} className="text-neutral-400 shrink-0" />
                            <span>{owner.phone}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  {showRealtorColumn && (
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {realtorNames[property.realtorId] ?? "—"}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("properties.table.viewTitle")}
                      aria-label={t("properties.table.viewTitle")}
                      onClick={() => onView(property)}
                    >
                      <Eye size={14} />
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("properties.table.mediaTitle")}
                          aria-label={t("properties.table.mediaTitle")}
                          onClick={() => onMedia(property)}
                        >
                          <Images size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("properties.table.editTitle")}
                          aria-label={t("properties.table.editTitle")}
                          onClick={() => onEdit(property)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("properties.table.deleteTitle")}
                          aria-label={t("properties.table.deleteTitle")}
                          onClick={() => onDelete(property)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
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
