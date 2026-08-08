"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import RealtorTable from "./RealtorTable";
import AddRealtorModal from "./AddRealtorModal";
import EditRealtorModal from "./EditRealtorModal";
import DeleteRealtorModal from "./DeleteRealtorModal";

export default function RealtorsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [realtorToEdit, setRealtorToEdit] = useState<Realtor | null>(null);
  const [realtorToDelete, setRealtorToDelete] = useState<Realtor | null>(null);

  // No setState calls before the first `await` here — a leading synchronous setState reachable
  // from the effect below trips `react-hooks/set-state-in-effect` (cascading-render lint).
  //
  // `silent` skips the page-load count message — used when reloading right after an Add/Edit/
  // Delete, so that mutation's own success message isn't immediately clobbered by the count.
  const loadRealtors = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const response = await apiClient.get<ApiResponse<Realtor[]>>("/api/realtors");
        setRealtors(response.data.data);
        setError(null);
        if (!options?.silent) {
          // Page-load notification convention — see CLAUDE.md → Footer notifications.
          MessageHandler.normal(dispatch, t("realtors.countMessage", { count: response.data.data.length }));
        }
      } catch {
        setError(t("realtors.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, t]
  );

  useEffect(() => {
    // Standard fetch-on-mount; react-hooks/set-state-in-effect flags any effect-reachable
    // setState regardless of await timing, which would rule out this pattern entirely.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRealtors();
  }, [loadRealtors]);

  const reloadSilently = useCallback(() => loadRealtors({ silent: true }), [loadRealtors]);

  return (
    <div>
      <div className={sharedStyles.pageHeader}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("realtors.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("realtors.pageSubtitle")}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>{t("realtors.register")}</Button>
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("realtors.loading")}</p>
      ) : (
        <RealtorTable
          realtors={realtors}
          onView={(realtor) => router.push(`/realtors/${realtor.id}/view`)}
          onEdit={setRealtorToEdit}
          onDelete={setRealtorToDelete}
        />
      )}

      <AddRealtorModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditRealtorModal
        isOpen={!!realtorToEdit}
        realtor={realtorToEdit}
        onClose={() => setRealtorToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteRealtorModal
        isOpen={!!realtorToDelete}
        realtor={realtorToDelete}
        onClose={() => setRealtorToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
