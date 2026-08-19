import Link from "next/link";
import { Building2, Eye, Globe, GlobeOff, Images, Pencil, Phone, Receipt, Trees, Trash2 } from "lucide-react";
import type { Asset, PropertyStatus } from "@/lib/types";
import { Card, Button, Badge } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./AssetsPage.module.scss";

const STATUS_VARIANT: Record<PropertyStatus, "active" | "pending" | "inactive"> = {
  active: "active",
  pending: "pending",
  inactive: "inactive",
};

interface OwnerInfo {
  name: string;
  phone: string;
}

interface AssetTableProps {
  assets: Asset[];
  realtorNames: Record<string, string>;
  propertyCategoryNames: Record<string, string>;
  landCategoryNames: Record<string, string>;
  owners: Record<string, OwnerInfo>;
  tagNames: Record<string, string>;
  showRealtorColumn: boolean;
  canEdit: boolean;
  onView: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onMedia: (asset: Asset) => void;
  onReceipt: (asset: Asset) => void;
  onTogglePublish: (asset: Asset) => void;
}

// Merges the old PropertyTable + LandTable into one — see CLAUDE.md → "Asset management". A Type
// column replaces the two separate nav/table destinations; Category resolves from whichever pool
// applies to the row's `isLand`.
export default function AssetTable({
  assets,
  realtorNames,
  propertyCategoryNames,
  landCategoryNames,
  owners,
  tagNames,
  showRealtorColumn,
  canEdit,
  onView,
  onEdit,
  onDelete,
  onMedia,
  onReceipt,
  onTogglePublish,
}: AssetTableProps) {
  const t = useTranslation();
  // Kind, Type, Status, Category, Tags, Size, Location, Price, Owner, Actions — plus Realtor when shown.
  const columnCount = 10 + (showRealtorColumn ? 1 : 0);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className={styles.table}>
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerKind")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerStatus")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerCategory")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerTags")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerSize")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerLocation")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerPrice")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerOwner")}</th>
              {showRealtorColumn && <th className={sharedStyles.tableHeaderCell}>{t("assets.table.headerRealtor")}</th>}
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("assets.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {assets.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("assets.table.empty")}
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const owner = asset.clientId ? owners[asset.clientId] : undefined;
                const categoryId = asset.isLand ? asset.landCategoryId : asset.propertyCategoryId;
                const categoryName = categoryId ? (asset.isLand ? landCategoryNames : propertyCategoryNames)[categoryId] : undefined;
                return (
                  <tr
                    key={asset.id}
                    className={
                      asset.status === "inactive"
                        ? sharedStyles.rowInactive
                        : asset.status === "pending"
                          ? sharedStyles.rowPending
                          : "hover:bg-neutral-50/60"
                    }
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                        {asset.isLand ? <Trees size={14} /> : <Building2 size={14} />}
                        {t(`assets.kind.${asset.isLand ? "land" : "property"}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {asset.transactionType === "rent" ? t("assets.table.forRent") : t("assets.table.forSale")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={STATUS_VARIANT[asset.status]}>{t(`assets.status.${asset.status}`)}</Badge>
                        <Badge variant={asset.publishedAt ? "active" : "inactive"}>
                          {t(asset.publishedAt ? "assets.table.publishedYes" : "assets.table.publishedNo")}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{categoryName ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {asset.tagIds.length > 0 ? (
                        <div className={styles.tagChips}>
                          {asset.tagIds.map((tagId) => (
                            <span key={tagId} className={styles.tagChip}>
                              {tagNames[tagId] ?? tagId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{asset.area} m²</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {[asset.city, asset.region, asset.address].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-neutral-900">
                      {asset.price.toLocaleString()} {asset.currency}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {owner ? (
                        <div className="space-y-0.5">
                          <Link
                            href={`/clients/${asset.clientId}/view`}
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
                      <td className="px-6 py-4 text-sm text-neutral-600">{realtorNames[asset.realtorId] ?? "—"}</td>
                    )}
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("assets.table.viewTitle")}
                        aria-label={t("assets.table.viewTitle")}
                        onClick={() => onView(asset)}
                      >
                        <Eye size={14} />
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            className={sharedStyles.buttonIcon}
                            title={t("assets.table.mediaTitle")}
                            aria-label={t("assets.table.mediaTitle")}
                            onClick={() => onMedia(asset)}
                          >
                            <Images size={14} />
                          </Button>
                          {asset.status === "active" && (
                            <Button
                              variant="ghost"
                              className={sharedStyles.buttonIcon}
                              title={t("assets.table.receiptTitle")}
                              aria-label={t("assets.table.receiptTitle")}
                              onClick={() => onReceipt(asset)}
                            >
                              <Receipt size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className={sharedStyles.buttonIcon}
                            title={t(asset.publishedAt ? "assets.table.unpublishTitle" : "assets.table.publishTitle")}
                            aria-label={t(asset.publishedAt ? "assets.table.unpublishTitle" : "assets.table.publishTitle")}
                            onClick={() => onTogglePublish(asset)}
                          >
                            {asset.publishedAt ? <GlobeOff size={14} /> : <Globe size={14} />}
                          </Button>
                          <Button
                            variant="ghost"
                            className={sharedStyles.buttonIcon}
                            title={t("assets.table.editTitle")}
                            aria-label={t("assets.table.editTitle")}
                            onClick={() => onEdit(asset)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            className={sharedStyles.buttonIcon}
                            title={t("assets.table.deleteTitle")}
                            aria-label={t("assets.table.deleteTitle")}
                            onClick={() => onDelete(asset)}
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
