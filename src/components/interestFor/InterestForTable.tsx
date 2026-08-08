import { Pencil, Trash2 } from "lucide-react";
import type { InterestFor, LandCategory, PropertyCategory } from "@/lib/types";
import { Card, Button, Badge } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import { formatDate } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";

interface InterestForTableProps {
  interests: InterestFor[];
  propertyCategories: PropertyCategory[];
  landCategories: LandCategory[];
  onEdit: (interest: InterestFor) => void;
  onDelete: (interest: InterestFor) => void;
}

export default function InterestForTable({
  interests,
  propertyCategories,
  landCategories,
  onEdit,
  onDelete,
}: InterestForTableProps) {
  const t = useTranslation();

  const categoryName = (interest: InterestFor) => {
    const list = interest.listingType === "Property" ? propertyCategories : landCategories;
    return list.find((category) => category.id === interest.categoryId)?.name ?? "—";
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("interestFor.table.headerDate")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("interestFor.table.headerTransactionType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("interestFor.table.headerListingType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("interestFor.table.headerCategory")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("interestFor.table.headerPrice")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("interestFor.table.headerCity")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("interestFor.table.headerArea")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("interestFor.table.headerStatus")}</th>
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("interestFor.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {interests.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("interestFor.empty")}
                </td>
              </tr>
            ) : (
              interests.map((interest) => (
                <tr key={interest.id} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4 text-sm text-neutral-600">{formatDate(interest.date)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {t(`interestFor.transactionType.${interest.transactionType}`)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {t(`interestFor.listingType.${interest.listingType}`)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-neutral-900 block">{categoryName(interest)}</span>
                    {interest.remarks && (
                      <span className="text-xs text-neutral-400">{interest.remarks}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{interest.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{interest.city || "—"}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{interest.area ?? "—"}</td>
                  <td className="px-6 py-4">
                    <Badge variant={interest.isActive ? "active" : "inactive"}>
                      {t(interest.isActive ? "interestFor.statusActive" : "interestFor.statusInactive")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("interestFor.editTitle")}
                      aria-label={t("interestFor.editTitle")}
                      onClick={() => onEdit(interest)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("interestFor.deleteTitle")}
                      aria-label={t("interestFor.deleteTitle")}
                      onClick={() => onDelete(interest)}
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
