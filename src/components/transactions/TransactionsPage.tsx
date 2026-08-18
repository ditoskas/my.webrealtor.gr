"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmModal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCanEdit, useCurrentUser, useTranslation } from "@/store/hooks";
import type {
  ApiResponse,
  Asset,
  Client,
  FloorLevel,
  LandCategory,
  PropertyCategory,
  Realtor,
  Transaction,
  TransactionFileKind,
} from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import TransactionTable from "./TransactionTable";
import AddTransactionModal from "./AddTransactionModal";
import EditTransactionModal from "./EditTransactionModal";
import DeleteTransactionModal from "./DeleteTransactionModal";

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const canEdit = useCanEdit();
  const isRoot = user?.role === "Root";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [listings, setListings] = useState<Asset[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [floorLevels, setFloorLevels] = useState<FloorLevel[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Removing either file slot — one shared confirm dialog for both kinds (see CLAUDE.md's
  // ConfirmModal precedent for Notes/Files), same "small sub-resource delete" shape.
  const [removeFileTarget, setRemoveFileTarget] = useState<{ transaction: Transaction; kind: TransactionFileKind } | null>(null);
  const [removeFileLoading, setRemoveFileLoading] = useState(false);
  const [removeFileError, setRemoveFileError] = useState<string | null>(null);

  // Category/Floor pool entities — used only to build a richer listing label (Category · Floor ·
  // Address), same lookups ViewingPanel/TransactionForm already fetch independently.
  useEffect(() => {
    apiClient
      .get<ApiResponse<PropertyCategory[]>>("/api/property-categories")
      .then((response) => setPropertyCategories(response.data.data))
      .catch(() => setPropertyCategories([]));
    apiClient
      .get<ApiResponse<FloorLevel[]>>("/api/floor-levels")
      .then((response) => setFloorLevels(response.data.data))
      .catch(() => setFloorLevels([]));
    apiClient
      .get<ApiResponse<LandCategory[]>>("/api/land-categories")
      .then((response) => setLandCategories(response.data.data))
      .catch(() => setLandCategories([]));
  }, []);

  // No setState calls before the first `await` — see RealtorsPage for why. `silent` skips the
  // page-load count message — used after Add/Edit/Delete.
  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) return;
      try {
        const scoped = !isRoot;
        const transactionsUrl = scoped ? `/api/transactions?realtorId=${user.realtorId}` : "/api/transactions";
        const clientsUrl = scoped ? `/api/clients?realtorId=${user.realtorId}` : "/api/clients";
        const assetsUrl = scoped ? `/api/assets?realtorId=${user.realtorId}` : "/api/assets";

        const [transactionsRes, clientsRes, assetsRes, realtorsRes] = await Promise.all([
          apiClient.get<ApiResponse<Transaction[]>>(transactionsUrl),
          apiClient.get<ApiResponse<Client[]>>(clientsUrl),
          apiClient.get<ApiResponse<Asset[]>>(assetsUrl),
          isRoot ? apiClient.get<ApiResponse<Realtor[]>>("/api/realtors") : Promise.resolve(null),
        ]);

        setTransactions(transactionsRes.data.data);
        setClients(clientsRes.data.data);
        setListings(assetsRes.data.data);
        if (realtorsRes) setRealtors(realtorsRes.data.data);
        setError(null);
        if (!options?.silent) {
          MessageHandler.normal(dispatch, t("transactions.countMessage", { count: transactionsRes.data.data.length }));
        }
      } catch {
        setError(t("transactions.loadError"));
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

  const handleRemoveFileConfirm = async () => {
    if (!removeFileTarget) return;
    const { transaction, kind } = removeFileTarget;
    setRemoveFileLoading(true);
    setRemoveFileError(null);
    try {
      await apiClient.delete(`/api/transactions/${transaction.id}/files/${kind}`);
      MessageHandler.success(
        dispatch,
        t(kind === "receipt" ? "transactions.files.receiptRemoved" : "transactions.files.contractRemoved")
      );
      setRemoveFileTarget(null);
      reloadSilently();
    } catch (err) {
      setRemoveFileError(getErrorMessage(err, t("transactions.files.removeError")));
    } finally {
      setRemoveFileLoading(false);
    }
  };

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
          <h2 className={sharedStyles.pageTitle}>{t("transactions.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("transactions.pageSubtitle")}</p>
        </div>
        {canEdit && <Button onClick={() => setIsAddOpen(true)}>{t("transactions.addButton")}</Button>}
      </div>

      {error && <p className="text-sm text-rose-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("transactions.loading")}</p>
      ) : (
        <TransactionTable
          transactions={transactions}
          clients={clients}
          listings={listings}
          propertyCategories={propertyCategories}
          floorLevels={floorLevels}
          landCategories={landCategories}
          realtorNames={realtorNames}
          showRealtorColumn={isRoot}
          canEdit={canEdit}
          onEdit={setTransactionToEdit}
          onDelete={setTransactionToDelete}
          onGenerateReceipt={(transaction) => router.push(`/tools/receipt?transactionId=${transaction.id}`)}
          onGenerateContract={(transaction) => router.push(`/tools/contract?transactionId=${transaction.id}`)}
          onRemoveFile={(transaction, kind) => setRemoveFileTarget({ transaction, kind })}
        />
      )}

      <AddTransactionModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaved={reloadSilently} />
      <EditTransactionModal
        isOpen={!!transactionToEdit}
        transaction={transactionToEdit}
        onClose={() => setTransactionToEdit(null)}
        onSaved={reloadSilently}
      />
      <DeleteTransactionModal
        isOpen={!!transactionToDelete}
        transaction={transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onDeleted={reloadSilently}
      />
      <ConfirmModal
        isOpen={!!removeFileTarget}
        title={
          removeFileTarget?.kind === "receipt"
            ? t("transactions.files.removeReceiptTitle")
            : t("transactions.files.removeContractTitle")
        }
        message={t("transactions.files.removeConfirmMessage")}
        loading={removeFileLoading}
        error={removeFileError}
        onConfirm={handleRemoveFileConfirm}
        onCancel={() => setRemoveFileTarget(null)}
      />
    </div>
  );
}
