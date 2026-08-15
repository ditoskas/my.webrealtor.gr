"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCanEdit, useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Message, PaginatedResponse, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import MessageTable from "./MessageTable";
import ViewMessageModal from "./ViewMessageModal";
import DeleteMessageModal from "./DeleteMessageModal";
import styles from "./MessagesPage.module.scss";

const PAGE_SIZE = 100;

export default function MessagesPage() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const user = useCurrentUser();
  const canEdit = useCanEdit();
  const isRoot = user?.role === "Root";

  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [messageToView, setMessageToView] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  // No setState calls before the first `await` — see RealtorsPage for why.
  const loadMessages = useCallback(
    async (targetPage: number) => {
      if (!user) return;
      try {
        const scopeParam = isRoot ? "" : `&realtorId=${user.realtorId}`;
        const [messagesRes, realtorsRes] = await Promise.all([
          apiClient.get<ApiResponse<PaginatedResponse<Message>>>(
            `/api/messages?page=${targetPage}&pageSize=${PAGE_SIZE}${scopeParam}`
          ),
          isRoot ? apiClient.get<ApiResponse<Realtor[]>>("/api/realtors") : Promise.resolve(null),
        ]);
        setMessages(messagesRes.data.data.items);
        setTotal(messagesRes.data.data.total);
        setPage(messagesRes.data.data.page);
        if (realtorsRes) setRealtors(realtorsRes.data.data);
        setError(null);
        // Page-load notification convention — see CLAUDE.md → Footer notifications.
        MessageHandler.normal(dispatch, t("messages.countMessage", { count: messagesRes.data.data.total }));
      } catch {
        setError(t("messages.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, isRoot, user, t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadMessages(1);
  }, [loadMessages]);

  const realtorNames = useMemo(
    () =>
      realtors.reduce<Record<string, string>>((map, realtor) => {
        map[realtor.id] = `${realtor.firstName} ${realtor.lastName}`;
        return map;
      }, {}),
    [realtors]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("messages.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("messages.pageSubtitle")}</p>
        </div>
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("messages.loading")}</p>
      ) : (
        <>
          <MessageTable
            messages={messages}
            realtorNames={realtorNames}
            showRealtorColumn={isRoot}
            canEdit={canEdit}
            onView={setMessageToView}
            onDelete={setMessageToDelete}
          />

          <div className={styles.pagination}>
            <span className={styles.pageInfo}>{t("messages.pageInfo", { page, totalPages, total })}</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => loadMessages(page - 1)}>
                {t("messages.previous")}
              </Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => loadMessages(page + 1)}>
                {t("messages.next")}
              </Button>
            </div>
          </div>
        </>
      )}

      <ViewMessageModal isOpen={!!messageToView} message={messageToView} onClose={() => setMessageToView(null)} />
      <DeleteMessageModal
        isOpen={!!messageToDelete}
        message={messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onDeleted={() => loadMessages(page)}
      />
    </div>
  );
}
