"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, Realtor, User } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import UserTable from "./UserTable";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import DeleteUserModal from "./DeleteUserModal";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // No setState calls before the first `await` — see RealtorsPage for why. `silent` skips the
  // page-load count message — see RealtorsPage for why (used after Add/Edit/Delete).
  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const [usersRes, realtorsRes] = await Promise.all([
          apiClient.get<ApiResponse<User[]>>("/api/users"),
          apiClient.get<ApiResponse<Realtor[]>>("/api/realtors"),
        ]);
        setUsers(usersRes.data.data);
        setRealtors(realtorsRes.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("users.countMessage", { count: usersRes.data.data.length }));
        }
      } catch {
        setError(t("users.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const reloadSilently = useCallback(() => loadData({ silent: true }), [loadData]);

  const realtorNames = useMemo(
    () =>
      realtors.reduce<Record<string, string>>((map, realtor) => {
        map[realtor.id] = `${realtor.firstName} ${realtor.lastName}`;
        return map;
      }, {}),
    [realtors]
  );

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("users.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("users.pageSubtitle")}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>{t("users.addUser")}</Button>
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("users.loading")}</p>
      ) : (
        <UserTable users={users} realtorNames={realtorNames} onEdit={setUserToEdit} onDelete={setUserToDelete} />
      )}

      <AddUserModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaved={reloadSilently} />
      <EditUserModal
        isOpen={!!userToEdit}
        user={userToEdit}
        onClose={() => setUserToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteUserModal
        isOpen={!!userToDelete}
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
