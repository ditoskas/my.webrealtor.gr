"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Smartphone, MapPin, ExternalLink, Home, Users, LandPlot, UserRound } from "lucide-react";
import { Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Realtor, User } from "@/lib/types";
import EntityDetailTabs from "@/components/entityDetails/EntityDetailTabs";
import RealtorImageUpload from "./RealtorImageUpload";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./RealtorViewPage.module.scss";

interface RealtorViewPageProps {
  realtorId: string;
}

export default function RealtorViewPage({ realtorId }: RealtorViewPageProps) {
  const router = useRouter();
  const t = useTranslation();
  const currentUser = useCurrentUser();

  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<Realtor>>(`/api/realtors/${realtorId}`)
      .then((response) => {
        setRealtor(response.data.data);
        setError(null);
      })
      .catch(() => setError(t("realtors.view.loadError")))
      .finally(() => setLoading(false));
  }, [realtorId, t]);

  useEffect(() => {
    if (!realtor?.userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see PropertyDetail's clients effect for why
      setAccountUser(null);
      return;
    }
    apiClient
      .get<ApiResponse<User>>(`/api/users/${realtor.userId}`)
      .then((response) => setAccountUser(response.data.data))
      .catch(() => setAccountUser(null));
  }, [realtor?.userId]);

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("realtors.view.loading")}</p>;
  }

  if (error || !realtor) {
    return <p className={sharedStyles.errorText}>{error ?? t("realtors.view.loadError")}</p>;
  }

  const mapsHref = realtor.googleMapsUrl || null;
  const locationLine = [realtor.address, realtor.city, realtor.postcode].filter(Boolean).join(", ");

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <button type="button" className={styles.backLink} onClick={() => router.push("/realtors")}>
            <ArrowLeft size={14} />
            <span>{t("realtors.view.backToRealtors")}</span>
          </button>
          <h2 className={sharedStyles.pageTitle}>
            {realtor.firstName} {realtor.lastName}
          </h2>
          <p className={sharedStyles.pageSubtitle}>{realtor.email}</p>
        </div>
      </div>

      <RealtorImageUpload
        realtorId={realtor.id}
        imageUrl={realtor.imageUrl}
        onUpdated={(imageUrl) => setRealtor((prev) => (prev ? { ...prev, imageUrl } : prev))}
      />

      <div className={styles.statsBar}>
        <span className={styles.statPill}>
          <Home size={14} /> {t("realtors.table.statsProperties", { count: realtor.propertyCount ?? 0 })}
        </span>
        <span className={styles.statPill}>
          <LandPlot size={14} /> {t("realtors.table.statsLand", { count: realtor.landCount ?? 0 })}
        </span>
        <span className={styles.statPill}>
          <Users size={14} /> {t("realtors.table.statsClients", { count: realtor.clientCount ?? 0 })}
        </span>
      </div>

      <div className={styles.body}>
        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("realtors.view.contactTitle")}</h3>
          <div className={styles.contactBlock}>
            <a href={`mailto:${realtor.email}`} className={styles.contactLink}>
              <Mail size={12} />
              <span>{realtor.email}</span>
            </a>
            {realtor.phone && (
              <a href={`tel:${realtor.phone}`} className={styles.contactLink}>
                <Phone size={12} />
                <span>{realtor.phone}</span>
              </a>
            )}
            {realtor.mobile && (
              <a href={`tel:${realtor.mobile}`} className={styles.contactLink}>
                <Smartphone size={12} />
                <span>{realtor.mobile}</span>
              </a>
            )}
            {realtor.website && (
              <a
                href={realtor.website.startsWith("http") ? realtor.website : `https://${realtor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactLink}
              >
                <ExternalLink size={12} />
                <span>{realtor.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
              </a>
            )}
          </div>
        </Card>

        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("realtors.view.locationTitle")}</h3>
          {locationLine ? (
            <div className={styles.contactBlock}>
              <span className={styles.contactLink}>
                <MapPin size={12} />
                <span>{locationLine}</span>
              </span>
              {mapsHref && (
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                  <ExternalLink size={12} />
                  <span>{t("media.openInGoogleMaps")}</span>
                </a>
              )}
            </div>
          ) : (
            <p className={styles.emptyText}>{t("realtors.view.noLocation")}</p>
          )}
        </Card>

        <Card className={styles.card}>
          <h3 className={styles.cardTitle}>{t("realtors.view.accountTitle")}</h3>
          {accountUser ? (
            <div className={styles.contactBlock}>
              <span className={styles.contactLink}>
                <UserRound size={12} />
                <span>{accountUser.email}</span>
              </span>
              <span className={styles.contactLink}>
                <span>{accountUser.role}</span>
              </span>
            </div>
          ) : (
            <p className={styles.emptyText}>{t("realtors.view.noAccount")}</p>
          )}
        </Card>

        {currentUser?.role === "Root" && (
          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("realtors.view.publicApiTitle")}</h3>
            <div className={styles.contactBlock}>
              <span className={styles.contactLink}>
                <span>{realtor.guid}</span>
              </span>
            </div>
            <p className={styles.emptyText}>{t("realtors.view.publicApiDescription")}</p>
          </Card>
        )}
      </div>

      <Card className={styles.card}>
        <EntityDetailTabs entityType="Realtor" entityId={realtor.id} />
      </Card>
    </div>
  );
}
