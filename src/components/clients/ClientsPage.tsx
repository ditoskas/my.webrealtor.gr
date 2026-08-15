"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCanEdit, useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Client, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import ClientTable from "./ClientTable";
import AddClientModal from "./AddClientModal";
import EditClientModal from "./EditClientModal";
import DeleteClientModal from "./DeleteClientModal";

export default function ClientsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const canEdit = useCanEdit();
  const isRoot = user?.role === "Root";

  const [clients, setClients] = useState<Client[]>([]);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // No setState calls before the first `await` — see RealtorsPage for why. `silent` skips the
  // page-load count message — see RealtorsPage for why (used after Add/Edit/Delete).
  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) return;
      try {
        const clientsUrl = isRoot ? "/api/clients" : `/api/clients?realtorId=${user.realtorId}`;
        const [clientsRes, realtorsRes] = await Promise.all([
          apiClient.get<ApiResponse<Client[]>>(clientsUrl),
          isRoot ? apiClient.get<ApiResponse<Realtor[]>>("/api/realtors") : Promise.resolve(null),
        ]);
        setClients(clientsRes.data.data);
        if (realtorsRes) setRealtors(realtorsRes.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("clients.countMessage", { count: clientsRes.data.data.length }));
        }
      } catch {
        setError(t("clients.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, isRoot, user, t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
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
          <h2 className={sharedStyles.pageTitle}>{t("clients.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("clients.pageSubtitle")}</p>
        </div>
        {canEdit && <Button onClick={() => setIsAddOpen(true)}>{t("clients.newClient")}</Button>}
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("clients.loading")}</p>
      ) : (
        <ClientTable
          clients={clients}
          realtorNames={realtorNames}
          showRealtorColumn={isRoot}
          canEdit={canEdit}
          onView={(client) => router.push(`/clients/${client.id}/view`)}
          onEdit={setClientToEdit}
          onDelete={setClientToDelete}
          onOrder={(client) => router.push(`/tools/order?clientId=${client.id}`)}
        />
      )}

      <AddClientModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaved={reloadSilently} />
      <EditClientModal
        isOpen={!!clientToEdit}
        client={clientToEdit}
        onClose={() => setClientToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteClientModal
        isOpen={!!clientToDelete}
        client={clientToDelete}
        onClose={() => setClientToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
