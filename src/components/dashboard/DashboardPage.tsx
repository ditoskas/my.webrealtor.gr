"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { useCurrentUser, useLocale, useTranslation } from "@/store/hooks";
import type { ApiResponse, Client, Land, Property, Transaction } from "@/lib/types";
import MonthlyBarChart from "./MonthlyBarChart";
import styles from "./DashboardPage.module.scss";

const TREND_MONTHS = 6;

interface MonthBucket {
  key: string;
  label: string;
  transactionCount: number;
  revenue: number;
}

export default function DashboardPage() {
  const t = useTranslation();
  const locale = useLocale();
  const user = useCurrentUser();
  const isRoot = user?.role === "Root";

  const [clientsCount, setClientsCount] = useState(0);
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Same Root-sees-all / Administrator-Operator-scoped-to-their-own-realtor pattern as
  // every other list page — see CLAUDE.md → "Data scoping by realtor".
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const scoped = !isRoot;
      const clientsUrl = scoped ? `/api/clients?realtorId=${user.realtorId}` : "/api/clients";
      const propertiesUrl = scoped ? `/api/properties?realtorId=${user.realtorId}` : "/api/properties";
      const landsUrl = scoped ? `/api/lands?realtorId=${user.realtorId}` : "/api/lands";
      const transactionsUrl = scoped ? `/api/transactions?realtorId=${user.realtorId}` : "/api/transactions";

      const [clientsRes, propertiesRes, landsRes, transactionsRes] = await Promise.all([
        apiClient.get<ApiResponse<Client[]>>(clientsUrl),
        apiClient.get<ApiResponse<Property[]>>(propertiesUrl),
        apiClient.get<ApiResponse<Land[]>>(landsUrl),
        apiClient.get<ApiResponse<Transaction[]>>(transactionsUrl),
      ]);

      setClientsCount(clientsRes.data.data.length);
      const activeProperties = propertiesRes.data.data.filter((property) => property.status === "active").length;
      const activeLands = landsRes.data.data.filter((land) => land.status === "active").length;
      setActiveListingsCount(activeProperties + activeLands);
      setTransactions(transactionsRes.data.data);
      setError(null);
    } catch {
      setError(t("dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  }, [isRoot, user, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadData();
  }, [loadData]);

  // Trailing 6-month window, oldest → newest, ending this month — bucketed by each
  // transaction's own `date` (the deal date), not `createdAt`.
  const monthBuckets = useMemo<MonthBucket[]>(() => {
    const now = new Date();
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
    const buckets: MonthBucket[] = Array.from({ length: TREND_MONTHS }, (_, index) => {
      const offset = TREND_MONTHS - 1 - index;
      const bucketDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return {
        key: `${bucketDate.getFullYear()}-${bucketDate.getMonth()}`,
        label: monthFormatter.format(bucketDate),
        transactionCount: 0,
        revenue: 0,
      };
    });

    const bucketsByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.date);
      const bucket = bucketsByKey.get(`${transactionDate.getFullYear()}-${transactionDate.getMonth()}`);
      if (!bucket) continue;
      bucket.transactionCount += 1;
      bucket.revenue += transaction.commission;
    }

    return buckets;
  }, [transactions, locale]);

  // The stat tile is "this month's revenue so far" (the trailing bucket); the chart beside
  // it shows the trend across the full window — see CLAUDE.md → Dashboard.
  const monthlyRevenue = monthBuckets[monthBuckets.length - 1]?.revenue ?? 0;

  const stats = [
    { label: t("dashboard.statActiveListings"), value: activeListingsCount.toLocaleString() },
    { label: t("dashboard.statTotalClients"), value: clientsCount.toLocaleString() },
    { label: t("dashboard.statMonthlyRevenue"), value: monthlyRevenue.toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">{t("nav.dashboard")}</h2>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("dashboard.loading")}</p>
      ) : (
        <>
          <div className={styles.grid}>
            {stats.map((stat) => (
              <Card key={stat.label} className={styles.tile}>
                <p className={styles.tileLabel}>{stat.label}</p>
                <h3 className={styles.tileValue}>{stat.value}</h3>
              </Card>
            ))}
          </div>

          <div className={styles.chartsGrid}>
            <MonthlyBarChart
              title={t("dashboard.chartTransactionsTitle")}
              data={monthBuckets.map((bucket) => ({
                key: bucket.key,
                label: bucket.label,
                value: bucket.transactionCount,
              }))}
              formatValue={(value) => t("dashboard.transactionsValue", { count: value })}
              emptyMessage={t("dashboard.chartEmpty")}
            />
            <MonthlyBarChart
              title={t("dashboard.chartRevenueTitle")}
              data={monthBuckets.map((bucket) => ({ key: bucket.key, label: bucket.label, value: bucket.revenue }))}
              formatValue={(value) => value.toLocaleString()}
              emptyMessage={t("dashboard.chartEmpty")}
            />
          </div>
        </>
      )}
    </div>
  );
}
