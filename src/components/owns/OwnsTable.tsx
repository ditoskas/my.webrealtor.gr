import { Eye } from "lucide-react";
import type { Land, LandCategory, Property, PropertyCategory, PropertyStatus } from "@/lib/types";
import { Card, Button, Badge } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";

export type OwnedListing = ({ kind: "Property" } & Property) | ({ kind: "Land" } & Land);

const STATUS_VARIANT: Record<PropertyStatus, "active" | "pending" | "inactive"> = {
  active: "active",
  pending: "pending",
  inactive: "inactive",
};

interface OwnsTableProps {
  listings: OwnedListing[];
  propertyCategories: PropertyCategory[];
  landCategories: LandCategory[];
  onView: (listing: OwnedListing) => void;
}

export default function OwnsTable({ listings, propertyCategories, landCategories, onView }: OwnsTableProps) {
  const t = useTranslation();

  const categoryName = (listing: OwnedListing) => {
    const categoryId = listing.kind === "Property" ? listing.propertyCategoryId : listing.landCategoryId;
    if (!categoryId) return "—";
    const list = listing.kind === "Property" ? propertyCategories : landCategories;
    return list.find((category) => category.id === categoryId)?.name ?? "—";
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("owns.table.headerStatus")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("owns.table.headerType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("owns.table.headerTransactionType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("owns.table.headerCategory")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("owns.table.headerPrice")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("owns.table.headerCity")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("owns.table.headerArea")}</th>
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("owns.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("owns.empty")}
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={`${listing.kind}-${listing.id}`} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4">
                    <Badge variant={STATUS_VARIANT[listing.status]}>{t(`owns.status.${listing.status}`)}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{t(`owns.listingType.${listing.kind}`)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {t(`owns.transactionType.${listing.transactionType}`)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{categoryName(listing)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-neutral-900">
                    {listing.price.toLocaleString()} {listing.currency}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{listing.city || "—"}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{listing.area} m²</td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("owns.viewTitle")}
                      aria-label={t("owns.viewTitle")}
                      onClick={() => onView(listing)}
                    >
                      <Eye size={14} />
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
