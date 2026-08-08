import { Pencil, Trash2 } from "lucide-react";
import type { Client, FloorLevel, Land, LandCategory, Property, PropertyCategory, Transaction } from "@/lib/types";
import { Card, Button, Badge } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import { formatDate } from "@/lib/formatDate";
import { listingLabel } from "@/lib/listingLabel";
import sharedStyles from "@/styles/shared.module.scss";

interface TransactionTableProps {
  transactions: Transaction[];
  clients: Client[];
  propertyListings: Property[];
  landListings: Land[];
  propertyCategories: PropertyCategory[];
  floorLevels: FloorLevel[];
  landCategories: LandCategory[];
  realtorNames: Record<string, string>;
  showRealtorColumn: boolean;
  canEdit: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export default function TransactionTable({
  transactions,
  clients,
  propertyListings,
  landListings,
  propertyCategories,
  floorLevels,
  landCategories,
  realtorNames,
  showRealtorColumn,
  canEdit,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const t = useTranslation();
  const columnCount = 8 + (showRealtorColumn ? 1 : 0);

  const clientName = (transaction: Transaction) => {
    const client = clients.find((c) => c.id === transaction.clientId);
    return client ? `${client.firstName} ${client.lastName}` : "—";
  };

  const listingName = (transaction: Transaction) => {
    const list = transaction.listingType === "Property" ? propertyListings : landListings;
    const listing = list.find((item) => item.id === transaction.listingId);
    return listing
      ? listingLabel(listing, transaction.listingType, propertyCategories, floorLevels, landCategories)
      : "—";
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("transactions.table.headerDate")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("transactions.table.headerClient")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("transactions.table.headerType")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("transactions.table.headerListing")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("transactions.table.headerAction")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("transactions.table.headerPrice")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("transactions.table.headerCommission")}</th>
              {showRealtorColumn && <th className={sharedStyles.tableHeaderCell}>{t("transactions.table.headerRealtor")}</th>}
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("transactions.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("transactions.table.empty")}
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4 text-sm text-neutral-600">{formatDate(transaction.date)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900">{clientName(transaction)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {t(`transactions.listingType.${transaction.listingType}`)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{listingName(transaction)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={transaction.action === "buy" ? "active" : "pending"}>
                      {t(`transactions.action.${transaction.action}`)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-neutral-900">{transaction.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{transaction.commission.toLocaleString()}</td>
                  {showRealtorColumn && (
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {realtorNames[transaction.realtorId] ?? "—"}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right space-x-2">
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("transactions.editTitle")}
                          aria-label={t("transactions.editTitle")}
                          onClick={() => onEdit(transaction)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          className={sharedStyles.buttonIcon}
                          title={t("transactions.deleteTitle")}
                          aria-label={t("transactions.deleteTitle")}
                          onClick={() => onDelete(transaction)}
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
