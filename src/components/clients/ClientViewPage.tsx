"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Smartphone, MapPin, Building2, IdCard, UserRound } from "lucide-react";
import { Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Client, Realtor } from "@/lib/types";
import EntityDetailTabs from "@/components/entityDetails/EntityDetailTabs";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./ClientViewPage.module.scss";

interface ClientViewPageProps {
  clientId: string;
}

export default function ClientViewPage({ clientId }: ClientViewPageProps) {
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const isRoot = user?.role === "Root";

  const [client, setClient] = useState<Client | null>(null);
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<Client>>(`/api/clients/${clientId}`)
      .then((response) => {
        setClient(response.data.data);
        setError(null);
      })
      .catch(() => setError(t("clients.view.loadError")))
      .finally(() => setLoading(false));
  }, [clientId, t]);

  useEffect(() => {
    if (!isRoot || !client?.realtorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see AssetDetail's clients effect for why
      setRealtor(null);
      return;
    }
    apiClient
      .get<ApiResponse<Realtor>>(`/api/realtors/${client.realtorId}`)
      .then((response) => setRealtor(response.data.data))
      .catch(() => setRealtor(null));
  }, [isRoot, client?.realtorId]);

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("clients.view.loading")}</p>;
  }

  if (error || !client) {
    return <p className={sharedStyles.errorText}>{error ?? t("clients.view.loadError")}</p>;
  }

  const locationLine = [client.address, client.city, client.zipcode].filter(Boolean).join(", ");

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <button type="button" className={styles.backLink} onClick={() => router.push("/clients")}>
            <ArrowLeft size={14} />
            <span>{t("clients.view.backToClients")}</span>
          </button>
          <h2 className={sharedStyles.pageTitle}>
            {client.firstName} {client.lastName}
          </h2>
          {client.email && <p className={sharedStyles.pageSubtitle}>{client.email}</p>}
        </div>
      </div>

      <div className={styles.body}>
        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("clients.view.contactTitle")}</h3>
          {client.email || client.phone || client.mobile ? (
            <div className={styles.contactBlock}>
              {client.email && (
                <a href={`mailto:${client.email}`} className={styles.contactLink}>
                  <Mail size={12} />
                  <span>{client.email}</span>
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className={styles.contactLink}>
                  <Phone size={12} />
                  <span>{client.phone}</span>
                </a>
              )}
              {client.mobile && (
                <a href={`tel:${client.mobile}`} className={styles.contactLink}>
                  <Smartphone size={12} />
                  <span>{client.mobile}</span>
                </a>
              )}
            </div>
          ) : (
            <p className={styles.emptyText}>{t("clients.view.noContact")}</p>
          )}
        </Card>

        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("clients.view.locationTitle")}</h3>
          {locationLine ? (
            <div className={styles.contactBlock}>
              <span className={styles.contactLink}>
                <MapPin size={12} />
                <span>{locationLine}</span>
              </span>
            </div>
          ) : (
            <p className={styles.emptyText}>{t("clients.view.noLocation")}</p>
          )}
        </Card>

        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("clients.view.detailsTitle")}</h3>
          <div className={styles.contactBlock}>
            {client.gender && (
              <span className={styles.contactLink}>
                <UserRound size={12} />
                <span>{t(`clients.form.gender${client.gender}`)}</span>
              </span>
            )}
            {client.tin && (
              <span className={styles.contactLink}>
                <IdCard size={12} />
                <span>{client.tin}</span>
              </span>
            )}
            {isRoot && (
              <span className={styles.contactLink}>
                <Building2 size={12} />
                <span>{realtor ? `${realtor.firstName} ${realtor.lastName}` : "—"}</span>
              </span>
            )}
            {!client.gender && !client.tin && !isRoot && <p className={styles.emptyText}>{t("clients.view.noDetails")}</p>}
          </div>
        </Card>
      </div>

      <Card className={styles.card}>
        <EntityDetailTabs entityType="Client" entityId={client.id} realtorId={client.realtorId} />
      </Card>
    </div>
  );
}
