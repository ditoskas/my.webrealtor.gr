import { Pencil, Trash2 } from "lucide-react";
import type { HeatingMedium } from "@/lib/types";
import { Card, Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";

interface HeatingMediumTableProps {
  heatingMediums: HeatingMedium[];
  onEdit: (heatingMedium: HeatingMedium) => void;
  onDelete: (heatingMedium: HeatingMedium) => void;
}

export default function HeatingMediumTable({ heatingMediums, onEdit, onDelete }: HeatingMediumTableProps) {
  const t = useTranslation();
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("settingsPool.table.headerName")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("settingsPool.table.headerSlug")}</th>
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("settingsPool.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {heatingMediums.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("settingsPool.empty")}
                </td>
              </tr>
            ) : (
              heatingMediums.map((heatingMedium) => (
                <tr key={heatingMedium.id} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4 font-semibold text-neutral-900">{heatingMedium.name}</td>
                  <td className="px-6 py-4 text-xs text-neutral-400 font-mono">{heatingMedium.slug}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("settingsPool.table.editAction")}
                      aria-label={t("settingsPool.table.editAction")}
                      onClick={() => onEdit(heatingMedium)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("settingsPool.table.deleteAction")}
                      aria-label={t("settingsPool.table.deleteAction")}
                      onClick={() => onDelete(heatingMedium)}
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
