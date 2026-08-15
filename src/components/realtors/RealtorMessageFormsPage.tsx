"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, MessageForm, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import MessageFormTable from "@/components/messages/MessageFormTable";
import AddMessageFormModal from "@/components/messages/AddMessageFormModal";
import EditMessageFormModal from "@/components/messages/EditMessageFormModal";
import DeleteMessageFormModal from "@/components/messages/DeleteMessageFormModal";
import styles from "./RealtorMessageFormsPage.module.scss";

interface RealtorMessageFormsPageProps {
  realtorId: string;
}

// Root-only — reached via the "Message Forms" row action on RealtorTable, see CLAUDE.md →
// "Messages". Unlike the top-level /messages page (every role, realtor-scoped), this page always
// operates on one fixed realtorId, so there's no Root-vs-scoped branching here.
export default function RealtorMessageFormsPage({ realtorId }: RealtorMessageFormsPageProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();

  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [messageForms, setMessageForms] = useState<MessageForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formToEdit, setFormToEdit] = useState<MessageForm | null>(null);
  const [formToDelete, setFormToDelete] = useState<MessageForm | null>(null);

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const [realtorRes, formsRes] = await Promise.all([
          apiClient.get<ApiResponse<Realtor>>(`/api/realtors/${realtorId}`),
          apiClient.get<ApiResponse<MessageForm[]>>(`/api/message-forms?realtorId=${realtorId}`),
        ]);
        setRealtor(realtorRes.data.data);
        setMessageForms(formsRes.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("messageForms.countMessage", { count: formsRes.data.data.length }));
        }
      } catch {
        setError(t("messageForms.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, realtorId, t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadData();
  }, [loadData]);

  const reloadSilently = useCallback(() => loadData({ silent: true }), [loadData]);

  const realtorName = realtor ? `${realtor.firstName} ${realtor.lastName}` : "";

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <button type="button" className={styles.backLink} onClick={() => router.push("/realtors")}>
            <ArrowLeft size={14} />
            <span>{t("messageForms.backToRealtors")}</span>
          </button>
          <h2 className={sharedStyles.pageTitle}>{t("messageForms.pageTitle", { name: realtorName })}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("messageForms.pageSubtitle")}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>{t("messageForms.newForm")}</Button>
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("messageForms.loading")}</p>
      ) : (
        <MessageFormTable messageForms={messageForms} onEdit={setFormToEdit} onDelete={setFormToDelete} />
      )}

      <AddMessageFormModal
        isOpen={isAddOpen}
        realtorId={realtorId}
        onClose={() => setIsAddOpen(false)}
        onSaved={reloadSilently}
      />
      <EditMessageFormModal
        isOpen={!!formToEdit}
        messageForm={formToEdit}
        onClose={() => setFormToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteMessageFormModal
        isOpen={!!formToDelete}
        messageForm={formToDelete}
        onClose={() => setFormToDelete(null)}
        onDeleted={reloadSilently}
      />
    </div>
  );
}
