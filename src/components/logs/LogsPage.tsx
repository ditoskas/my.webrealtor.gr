"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import { Badge, Button, Card } from "@/components/ui";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useTranslation } from "@/store/hooks";
import type { ApiResponse, LogEntry, LogType, PaginatedResponse, Realtor, User } from "@/lib/types";
import { formatDateTime } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./LogsPage.module.scss";

const PAGE_SIZE = 100;

const LOG_BADGE: Record<LogType, "active" | "pending" | "danger"> = {
  Information: "active",
  Warning: "pending",
  Error: "danger",
};

export default function LogsPage() {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(
    async (targetPage: number) => {
      try {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<LogEntry>>>(
          `/api/logs?page=${targetPage}&pageSize=${PAGE_SIZE}`
        );
        setEntries(response.data.data.items);
        setTotal(response.data.data.total);
        setPage(response.data.data.page);
        setError(null);
        // Page-load notification convention — see CLAUDE.md → Footer notifications.
        MessageHandler.normal(dispatch, t("logs.countMessage", { count: response.data.data.total }));
      } catch {
        setError(t("logs.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, t]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadLogs(1);
    apiClient
      .get<ApiResponse<User[]>>("/api/users")
      .then((response) => setUsers(response.data.data))
      .catch(() => setUsers([]));
    apiClient
      .get<ApiResponse<Realtor[]>>("/api/realtors")
      .then((response) => setRealtors(response.data.data))
      .catch(() => setRealtors([]));
  }, [loadLogs]);

  const userEmails = useMemo(
    () => users.reduce<Record<string, string>>((map, user) => ({ ...map, [user.id]: user.email }), {}),
    [users]
  );
  const realtorNames = useMemo(
    () =>
      realtors.reduce<Record<string, string>>(
        (map, realtor) => ({ ...map, [realtor.id]: `${realtor.firstName} ${realtor.lastName}` }),
        {}
      ),
    [realtors]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("logs.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("logs.pageSubtitle")}</p>
        </div>
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("logs.loading")}</p>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className={sharedStyles.tableHeaderCell}>{t("logs.table.headerType")}</th>
                    <th className={sharedStyles.tableHeaderCell}>{t("logs.table.headerCategory")}</th>
                    <th className={sharedStyles.tableHeaderCell}>{t("logs.table.headerMessage")}</th>
                    <th className={sharedStyles.tableHeaderCell}>{t("logs.table.headerUser")}</th>
                    <th className={sharedStyles.tableHeaderCell}>{t("logs.table.headerRealtor")}</th>
                    <th className={sharedStyles.tableHeaderCell}>{t("logs.table.headerWhen")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 text-xs">
                        {t("logs.table.empty")}
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4">
                          <Badge variant={LOG_BADGE[entry.logType]}>{t(`logs.type.${entry.logType}`)}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{entry.category}</td>
                        <td className="px-6 py-4 text-sm text-neutral-900">{entry.message}</td>
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          {entry.userId ? userEmails[entry.userId] ?? "—" : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          {entry.realtorId ? realtorNames[entry.realtorId] ?? "—" : "—"}
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-400 whitespace-nowrap">
                          {formatDateTime(entry.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className={styles.pagination}>
            <span className={styles.pageInfo}>{t("logs.pageInfo", { page, totalPages, total })}</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => loadLogs(page - 1)}>
                {t("logs.previous")}
              </Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => loadLogs(page + 1)}>
                {t("logs.next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
