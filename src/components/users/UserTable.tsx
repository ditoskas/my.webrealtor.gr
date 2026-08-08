import { Pencil, Trash2 } from "lucide-react";
import type { User } from "@/lib/types";
import { Card, Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";

interface UserTableProps {
  users: User[];
  realtorNames: Record<string, string>;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const ROLE_BADGE = {
  Root: "danger",
  Administrator: "active",
  Operator: "inactive",
} as const;

export default function UserTable({ users, realtorNames, onEdit, onDelete }: UserTableProps) {
  const t = useTranslation();

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className={sharedStyles.tableHeaderCell}>{t("users.table.headerEmail")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("users.table.headerRole")}</th>
              <th className={sharedStyles.tableHeaderCell}>{t("users.table.headerRealtor")}</th>
              <th className={`${sharedStyles.tableHeaderCell} text-right`}>{t("users.table.headerActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-neutral-400 text-xs">
                  {t("users.table.empty")}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50/60">
                  <td className="px-6 py-4 font-semibold text-neutral-900">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={ROLE_BADGE[user.role]}>{t(`users.roles.${user.role}`)}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {user.realtorId ? realtorNames[user.realtorId] ?? "—" : "—"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("users.table.editTitle")}
                      aria-label={t("users.table.editTitle")}
                      onClick={() => onEdit(user)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className={sharedStyles.buttonIcon}
                      title={t("users.table.deleteTitle")}
                      aria-label={t("users.table.deleteTitle")}
                      onClick={() => onDelete(user)}
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
