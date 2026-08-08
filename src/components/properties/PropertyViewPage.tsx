"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  ImageOff,
  Mail,
  Phone,
  Smartphone,
  BedDouble,
  Bath,
  Ruler,
  Layers,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Client, PriceHistoryEntry, Property, PropertyStatus, Realtor, User } from "@/lib/types";
import EntityDetailTabs from "@/components/entityDetails/EntityDetailTabs";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./PropertyViewPage.module.scss";

const STATUS_VARIANT: Record<PropertyStatus, "active" | "pending" | "inactive"> = {
  active: "active",
  pending: "pending",
  inactive: "inactive",
};

interface PoolNames {
  propertyCategory: string | null;
  floorLevel: string | null;
  energyClass: string | null;
  heatingSystem: string | null;
  heatingMedium: string | null;
  buildingFloors: string | null;
  joineryType: string | null;
  glassType: string | null;
  floorType: string | null;
  gardenType: string | null;
  orientation: string | null;
  zoningType: string | null;
  roadAccessType: string | null;
}

const EMPTY_POOL_NAMES: PoolNames = {
  propertyCategory: null,
  floorLevel: null,
  energyClass: null,
  heatingSystem: null,
  heatingMedium: null,
  buildingFloors: null,
  joineryType: null,
  glassType: null,
  floorType: null,
  gardenType: null,
  orientation: null,
  zoningType: null,
  roadAccessType: null,
};

// Every boolean amenity/feature flag on Property, paired with the existing i18n label key it
// already has on the edit form (properties.detail.*) — reused as-is rather than adding ~45 new
// "view.*" keys for the same concepts.
const FEATURE_FLAGS: Array<{ key: keyof Property; labelKey: string }> = [
  { key: "isWholeFloorApartment", labelKey: "properties.detail.wholeFloorApartment" },
  { key: "hasStorage", labelKey: "properties.detail.storage" },
  { key: "hasAttic", labelKey: "properties.detail.attic" },
  { key: "hasPlayroom", labelKey: "properties.detail.playroom" },
  { key: "hasAC", labelKey: "properties.detail.ac" },
  { key: "hasSolarHeater", labelKey: "properties.detail.solarHeater" },
  { key: "hasUnderfloorHeating", labelKey: "properties.detail.underfloorHeating" },
  { key: "hasNightPower", labelKey: "properties.detail.nightPower" },
  { key: "hasElevator", labelKey: "properties.detail.elevator" },
  { key: "hasInternalStairs", labelKey: "properties.detail.internalStairs" },
  { key: "isNeoclassic", labelKey: "properties.detail.neoclassic" },
  { key: "isRenovated", labelKey: "properties.detail.renovated" },
  { key: "requiresRenovation", labelKey: "properties.detail.requiresRenovation" },
  { key: "isPreserved", labelKey: "properties.detail.preserved" },
  { key: "hasSecurityDoor", labelKey: "properties.detail.securityDoor" },
  { key: "hasAlarm", labelKey: "properties.detail.alarm" },
  { key: "isPainted", labelKey: "properties.detail.painted" },
  { key: "isFurnished", labelKey: "properties.detail.furnished" },
  { key: "hasPestNet", labelKey: "properties.detail.pestNet" },
  { key: "hasFireplace", labelKey: "properties.detail.fireplace" },
  { key: "isBright", labelKey: "properties.detail.bright" },
  { key: "isAiry", labelKey: "properties.detail.airy" },
  { key: "isLuxury", labelKey: "properties.detail.luxury" },
  { key: "hasEvCharger", labelKey: "properties.detail.evCharger" },
  { key: "hasMannedReception", labelKey: "properties.detail.mannedReception" },
  { key: "hasSatelliteDish", labelKey: "properties.detail.satelliteDish" },
  { key: "hasBalcony", labelKey: "properties.detail.balcony" },
  { key: "hasAwning", labelKey: "properties.detail.awning" },
  { key: "hasBuiltInBBQ", labelKey: "properties.detail.builtInBBQ" },
  { key: "hasGarden", labelKey: "properties.detail.garden" },
  { key: "hasPool", labelKey: "properties.detail.pool" },
  { key: "hasView", labelKey: "properties.detail.view" },
  { key: "isCorner", labelKey: "properties.detail.corner" },
  { key: "isFacade", labelKey: "properties.detail.facade" },
  { key: "isAccessibleForDisabled", labelKey: "properties.detail.accessibleForDisabled" },
  { key: "isCaveBuilding", labelKey: "properties.detail.caveBuilding" },
  { key: "hasParking", labelKey: "properties.detail.parking" },
  { key: "suitableForStudents", labelKey: "properties.detail.students" },
  { key: "suitableForHoliday", labelKey: "properties.detail.holidayHome" },
  { key: "suitableForCommercialUse", labelKey: "properties.detail.commercialUse" },
  { key: "suitableForShortTermLetting", labelKey: "properties.detail.shortTermLetting" },
  { key: "suitableForMedicalOffice", labelKey: "properties.detail.medicalOffice" },
  { key: "suitableForInvestment", labelKey: "properties.detail.investment" },
  { key: "isUnderConstruction", labelKey: "properties.detail.underConstruction" },
  { key: "isUnfinished", labelKey: "properties.detail.unfinished" },
  { key: "isAuction", labelKey: "properties.detail.auction" },
];

async function fetchPoolName(route: string, id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  try {
    const response = await apiClient.get<ApiResponse<{ name: string }>>(`/api/${route}/${id}`);
    return response.data.data.name;
  } catch {
    return null;
  }
}

interface PropertyViewPageProps {
  propertyId: string;
}

export default function PropertyViewPage({ propertyId }: PropertyViewPageProps) {
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const isRoot = user?.role === "Root";

  const [property, setProperty] = useState<Property | null>(null);
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [poolNames, setPoolNames] = useState<PoolNames>(EMPTY_POOL_NAMES);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [priceHistoryUsers, setPriceHistoryUsers] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperty = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<Property>>(`/api/properties/${propertyId}`);
      setProperty(response.data.data);
      setError(null);
    } catch {
      setError(t("properties.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [propertyId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadProperty();
  }, [loadProperty]);

  useEffect(() => {
    apiClient
      .get<ApiResponse<PriceHistoryEntry[]>>(`/api/properties/${propertyId}/price-history`)
      .then((response) => setPriceHistory(response.data.data))
      .catch(() => setPriceHistory([]));
  }, [propertyId]);

  useEffect(() => {
    if (!property) return;
    apiClient
      .get<ApiResponse<Realtor>>(`/api/realtors/${property.realtorId}`)
      .then((response) => setRealtor(response.data.data))
      .catch(() => setRealtor(null));

    if (property.clientId) {
      apiClient
        .get<ApiResponse<Client>>(`/api/clients/${property.clientId}`)
        .then((response) => setClient(response.data.data))
        .catch(() => setClient(null));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see PropertyDetail's clients effect for why
      setClient(null);
    }
  }, [property]);

  useEffect(() => {
    if (!property) return;
    const fields: Array<[keyof PoolNames, string]> = [
      ["propertyCategory", "property-categories"],
      ["floorLevel", "floor-levels"],
      ["energyClass", "energy-classes"],
      ["heatingSystem", "heating-systems"],
      ["heatingMedium", "heating-mediums"],
      ["buildingFloors", "building-floors"],
      ["joineryType", "joinery-types"],
      ["glassType", "glass-types"],
      ["floorType", "floor-types"],
      ["gardenType", "garden-types"],
      ["orientation", "orientations"],
      ["zoningType", "zoning-types"],
      ["roadAccessType", "road-access-types"],
    ];
    const idOf: Record<keyof PoolNames, string | null | undefined> = {
      propertyCategory: property.propertyCategoryId,
      floorLevel: property.floorLevelId,
      energyClass: property.energyClassId,
      heatingSystem: property.heatingSystemId,
      heatingMedium: property.heatingMediumId,
      buildingFloors: property.buildingFloorsId,
      joineryType: property.joineryTypeId,
      glassType: property.glassTypeId,
      floorType: property.floorTypeId,
      gardenType: property.gardenTypeId,
      orientation: property.orientationId,
      zoningType: property.zoningTypeId,
      roadAccessType: property.roadAccessTypeId,
    };
    Promise.all(fields.map(([key, route]) => fetchPoolName(route, idOf[key]))).then((results) => {
      const next = { ...EMPTY_POOL_NAMES };
      fields.forEach(([key], index) => {
        next[key] = results[index];
      });
      setPoolNames(next);
    });
  }, [property]);

  // Resolve only the users actually referenced in this listing's price history, not the whole
  // /api/users list — this page is visible to every role, unlike LogsPage (Root-only) which fetches
  // every user up front.
  useEffect(() => {
    const ids = Array.from(new Set(priceHistory.map((entry) => entry.userId).filter((id): id is string => !!id)));
    if (ids.length === 0) return;
    Promise.all(
      ids.map((id) =>
        apiClient
          .get<ApiResponse<User>>(`/api/users/${id}`)
          .then((response) => [id, response.data.data.email] as const)
          .catch(() => [id, null] as const)
      )
    ).then((entries) => {
      setPriceHistoryUsers((prev) => {
        const next = { ...prev };
        entries.forEach(([id, email]) => {
          if (email) next[id] = email;
        });
        return next;
      });
    });
  }, [priceHistory]);

  const features = useMemo(
    () => (property ? FEATURE_FLAGS.filter((flag) => property[flag.key] === true) : []),
    [property]
  );

  const technicalDetails = useMemo(() => {
    if (!property) return [];
    const rows: Array<{ label: string; value: string }> = [];
    const push = (labelKey: string, value: string | number | null | undefined) => {
      if (value === null || value === undefined || value === "") return;
      rows.push({ label: t(labelKey), value: String(value) });
    };
    push("properties.detail.category", poolNames.propertyCategory);
    push("properties.detail.floorLevel", poolNames.floorLevel);
    push("properties.detail.energyClass", poolNames.energyClass);
    push("properties.detail.heatingSystem", poolNames.heatingSystem);
    push("properties.detail.heatingMedium", poolNames.heatingMedium);
    push("properties.detail.buildingFloors", poolNames.buildingFloors);
    push("properties.detail.joineryType", poolNames.joineryType);
    push("properties.detail.glassType", poolNames.glassType);
    push("properties.detail.floorType", poolNames.floorType);
    push("properties.detail.gardenType", poolNames.gardenType);
    push("properties.detail.orientation", poolNames.orientation);
    push("properties.detail.zoning", poolNames.zoningType);
    push("properties.detail.roadAccess", poolNames.roadAccessType);
    push("properties.detail.yearBuilt", property.yearBuilt);
    push("properties.detail.renovationYear", property.renovationYear);
    push("properties.detail.netArea", property.netArea);
    push("properties.detail.grossArea", property.grossArea);
    push("properties.detail.levels", property.levels);
    push("properties.detail.storageArea", property.storageArea);
    push("properties.detail.balconyArea", property.balconyArea);
    push("properties.detail.distanceFromSea", property.distanceFromSea);
    return rows;
  }, [property, poolNames, t]);

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("properties.view.loading")}</p>;
  }

  if (error || !property) {
    return <p className={sharedStyles.errorText}>{error ?? t("properties.view.loadError")}</p>;
  }

  const locationLine = [property.address, property.neighborhood, property.city, property.postcode]
    .filter(Boolean)
    .join(", ");
  const fullLocationLine = [locationLine, property.municipality, property.region, property.country]
    .filter(Boolean)
    .join(", ");
  const mapsHref =
    property.googleMapsUrl ||
    (property.latitude && property.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
      : null);

  const description = property.descriptions?.el?.trim();

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <button type="button" className={styles.backLink} onClick={() => router.push("/properties")}>
            <ArrowLeft size={14} />
            <span>{t("properties.view.backToProperties")}</span>
          </button>
          <h2 className={sharedStyles.pageTitle}>
            {property.title || t("properties.table.listingFallback", { id: property.id.slice(-6) })}
          </h2>
          {fullLocationLine ? (
            mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${sharedStyles.pageSubtitle} ${styles.subtitleLink}`}
              >
                {fullLocationLine}
              </a>
            ) : (
              <p className={sharedStyles.pageSubtitle}>{fullLocationLine}</p>
            )
          ) : (
            <p className={sharedStyles.pageSubtitle}>—</p>
          )}
        </div>
        <Button onClick={() => router.push(`/properties/${property.id}`)}>
          <Pencil size={14} />
          <span>{t("properties.view.editListing")}</span>
        </Button>
      </div>

      <Card className={styles.gallery}>
        {property.images.length === 0 ? (
          <div className={styles.noImage}>
            <ImageOff size={32} />
            <span>{t("properties.view.noPhotos")}</span>
          </div>
        ) : (
          <>
            <div className={styles.heroImage}>
              {/* Uploaded listing photos are served from our own /uploads route, not a known-dimension CDN. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={property.images[activeImage]?.url} alt={property.images[activeImage]?.alt || ""} />
            </div>
            {property.images.length > 1 && (
              <div className={styles.thumbnailRow}>
                {property.images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className={`${styles.thumbnail} ${index === activeImage ? styles.thumbnailActive : ""}`}
                    onClick={() => setActiveImage(index)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={image.alt || ""} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <div className={styles.statsBar}>
        <div className={styles.priceBlock}>
          <span className={styles.price}>
            {property.price.toLocaleString()} {property.currency}
          </span>
          {property.priceNegotiable && <span className={styles.negotiable}>{t("properties.view.negotiable")}</span>}
        </div>
        <Badge variant={STATUS_VARIANT[property.status]}>{t(`properties.status.${property.status}`)}</Badge>
        <span className={styles.transactionTag}>
          {property.transactionType === "rent" ? t("properties.table.forRent") : t("properties.table.forSale")}
        </span>
        {!!property.bedrooms && (
          <span className={styles.statPill}>
            <BedDouble size={14} /> {property.bedrooms}
          </span>
        )}
        {!!property.bathrooms && (
          <span className={styles.statPill}>
            <Bath size={14} /> {property.bathrooms}
          </span>
        )}
        <span className={styles.statPill}>
          <Ruler size={14} /> {property.area} m²
        </span>
        {poolNames.propertyCategory && (
          <span className={styles.statPill}>
            <Layers size={14} /> {poolNames.propertyCategory}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("properties.view.owner")}</h3>
            {client ? (
              <div className={styles.contactBlock}>
                <span className={styles.contactName}>
                  {client.firstName} {client.lastName}
                </span>
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
              </div>
            ) : (
              <p className={styles.emptyText}>{t("properties.view.noOwner")}</p>
            )}
          </Card>

          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("properties.detail.sectionDescription")}</h3>
            <p className={styles.description}>{description || t("properties.view.noDescription")}</p>
          </Card>

          {features.length > 0 && (
            <Card className={styles.card}>
              <h3 className={styles.cardTitle}>{t("properties.view.featuresAndAmenities")}</h3>
              <div className={styles.featureGrid}>
                {features.map((flag) => (
                  <span key={String(flag.key)} className={styles.featurePill}>
                    <CheckCircle2 size={14} />
                    {t(flag.labelKey)}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("properties.view.priceHistory")}</h3>
            {priceHistory.length === 0 ? (
              <p className={styles.emptyText}>{t("properties.view.priceHistoryEmpty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>{t("properties.view.priceHistoryDate")}</th>
                      <th>{t("properties.view.priceHistoryPrice")}</th>
                      <th>{t("properties.view.priceHistoryChangedBy")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDateTime(entry.createdAt)}</td>
                        <td className={styles.historyPrice}>
                          {entry.price.toLocaleString()} {entry.currency}
                        </td>
                        <td>{entry.userId ? priceHistoryUsers[entry.userId] ?? "—" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {technicalDetails.length > 0 && (
            <Card className={styles.card}>
              <h3 className={styles.cardTitle}>{t("properties.view.technicalDetails")}</h3>
              <dl className={styles.detailGrid}>
                {technicalDetails.map((row) => (
                  <div key={row.label} className={styles.detailRow}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          <Card className={styles.card}>
            <EntityDetailTabs entityType="Property" entityId={property.id} />
          </Card>
        </div>

        <div className={styles.sidebar}>
          {isRoot && (
            <Card className={styles.card}>
              <h3 className={styles.cardTitle}>{t("properties.view.contactRealtor")}</h3>
              {realtor ? (
                <div className={styles.contactBlock}>
                  <span className={styles.contactName}>
                    {realtor.firstName} {realtor.lastName}
                  </span>
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
                </div>
              ) : (
                <p className={styles.emptyText}>{t("properties.view.noRealtor")}</p>
              )}
            </Card>
          )}

          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("properties.view.listingInformation")}</h3>
            <div className={styles.contactBlock}>
              <span className={styles.contactLink}>
                <Calendar size={12} />
                <span>{t("properties.view.createdOn")}: {formatDate(property.createdAt)}</span>
              </span>
              <span className={styles.contactLink}>
                <Calendar size={12} />
                <span>{t("properties.view.updatedOn")}: {formatDate(property.updatedAt)}</span>
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
