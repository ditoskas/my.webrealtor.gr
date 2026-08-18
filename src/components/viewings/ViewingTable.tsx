import { Pencil, Trash2, FileText } from "lucide-react";
import type { Asset, Attachment, FloorLevel, LandCategory, PropertyCategory, Viewing } from "@/lib/types";
import { Card, Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import { formatDate } from "@/lib/formatDate";
import { listingLabel } from "@/lib/listingLabel";
import sharedStyles from "@/styles/shared.module.scss";

interface ViewingTableProps {
  viewings: Viewing[];
  listings: Asset[];
  propertyCategories: PropertyCategory[];
  floorLevels: FloorLevel[];
  landCategories: LandCategory[];
  attachments: Attachment[];
  onEdit: (viewing: Viewing) => void;
  onDelete: (viewing: Viewing) => void;
}

export default function ViewingTable({
  viewings,
  listings,
  propertyCategories,
  floorLevels,
  landCategories,
  attachments,
  onEdit,
  onDelete,
}: ViewingTableProps) {
  const t = useTranslation();

  const listingName = (viewing: Viewing) => {
    const listing = listings.find((item) => item.id === viewing.listingId);
    return listing ? listingLabel(listing, propertyCategories, floorLevels, landCategories) : "—";
  };

  const signatureDocument = (viewing: Viewing) =>
    viewing.signatureDocumentId ? attachments.find((a) => a.id === viewing.signatureDocumentId) : undefined;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("viewings.table.headerDate")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("viewings.table.headerType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("viewings.table.headerListing")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("viewings.table.headerComment")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("viewings.table.headerSignatureDocument")}</th>
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("viewings.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {viewings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("viewings.empty")}
                </td>
              </tr>
            ) : (
              viewings.map((viewing) => {
                const document = signatureDocument(viewing);
                return (
                  <tr key={viewing.id} className="hover:bg-neutral-50/60">
                    <td className="px-6 py-4 text-sm text-neutral-600">{formatDate(viewing.date)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {t(`viewings.listingType.${viewing.listingType}`)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900">{listingName(viewing)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{viewing.comment || "—"}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {document ? (
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-brand-600 hover:underline"
                        >
                          <FileText size={12} className="text-neutral-400 shrink-0" />
                          <span>{document.title}</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("viewings.editTitle")}
                        aria-label={t("viewings.editTitle")}
                        onClick={() => onEdit(viewing)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        className={sharedStyles.buttonIcon}
                        title={t("viewings.deleteTitle")}
                        aria-label={t("viewings.deleteTitle")}
                        onClick={() => onDelete(viewing)}
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
