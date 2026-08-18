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
import type { ApiResponse, Asset, Client, PriceHistoryEntry, PropertyStatus, Realtor, User } from "@/lib/types";
import EntityDetailTabs from "@/components/entityDetails/EntityDetailTabs";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./AssetViewPage.module.scss";

const STATUS_VARIANT: Record<PropertyStatus, "active" | "pending" | "inactive"> = {
  active: "active",
  pending: "pending",
  inactive: "inactive",
};

interface PoolNames {
  propertyCategory: string | null;
  landCategory: string | null;
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
  slope: string | null;
}

const EMPTY_POOL_NAMES: PoolNames = {
  propertyCategory: null,
  landCategory: null,
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
  slope: null,
};

// Every boolean amenity/feature flag on Asset, paired with the existing i18n label key it already
// has on the edit form (assets.detail.*) — reused as-is rather than adding new "view.*" keys for
// the same concepts. Two lists (not one) since property-only and land-only flags don't overlap
// beyond a handful of shared ones already listed once.
const PROPERTY_FEATURE_FLAGS: Array<{ key: keyof Asset; labelKey: string }> = [
  { key: "isWholeFloorApartment", labelKey: "assets.detail.wholeFloorApartment" },
  { key: "hasStorage", labelKey: "assets.detail.storage" },
  { key: "hasAttic", labelKey: "assets.detail.attic" },
  { key: "hasPlayroom", labelKey: "assets.detail.playroom" },
  { key: "hasAC", labelKey: "assets.detail.ac" },
  { key: "hasSolarHeater", labelKey: "assets.detail.solarHeater" },
  { key: "hasUnderfloorHeating", labelKey: "assets.detail.underfloorHeating" },
  { key: "hasNightPower", labelKey: "assets.detail.nightPower" },
  { key: "hasElevator", labelKey: "assets.detail.elevator" },
  { key: "hasInternalStairs", labelKey: "assets.detail.internalStairs" },
  { key: "isNeoclassic", labelKey: "assets.detail.neoclassic" },
  { key: "isRenovated", labelKey: "assets.detail.renovated" },
  { key: "requiresRenovation", labelKey: "assets.detail.requiresRenovation" },
  { key: "isPreserved", labelKey: "assets.detail.preserved" },
  { key: "hasSecurityDoor", labelKey: "assets.detail.securityDoor" },
  { key: "hasAlarm", labelKey: "assets.detail.alarm" },
  { key: "isPainted", labelKey: "assets.detail.painted" },
  { key: "isFurnished", labelKey: "assets.detail.furnished" },
  { key: "hasPestNet", labelKey: "assets.detail.pestNet" },
  { key: "hasFireplace", labelKey: "assets.detail.fireplace" },
  { key: "isBright", labelKey: "assets.detail.bright" },
  { key: "isAiry", labelKey: "assets.detail.airy" },
  { key: "isLuxury", labelKey: "assets.detail.luxury" },
  { key: "hasEvCharger", labelKey: "assets.detail.evCharger" },
  { key: "hasMannedReception", labelKey: "assets.detail.mannedReception" },
  { key: "hasSatelliteDish", labelKey: "assets.detail.satelliteDish" },
  { key: "hasBalcony", labelKey: "assets.detail.balcony" },
  { key: "hasAwning", labelKey: "assets.detail.awning" },
  { key: "hasBuiltInBBQ", labelKey: "assets.detail.builtInBBQ" },
  { key: "hasGarden", labelKey: "assets.detail.garden" },
  { key: "hasPool", labelKey: "assets.detail.pool" },
  { key: "hasView", labelKey: "assets.detail.view" },
  { key: "isCorner", labelKey: "assets.detail.corner" },
  { key: "isFacade", labelKey: "assets.detail.facade" },
  { key: "isAccessibleForDisabled", labelKey: "assets.detail.accessibleForDisabled" },
  { key: "isCaveBuilding", labelKey: "assets.detail.caveBuilding" },
  { key: "hasParking", labelKey: "assets.detail.parking" },
  { key: "suitableForStudents", labelKey: "assets.detail.students" },
  { key: "suitableForHoliday", labelKey: "assets.detail.holidayHome" },
  { key: "suitableForCommercialUse", labelKey: "assets.detail.commercialUse" },
  { key: "suitableForShortTermLetting", labelKey: "assets.detail.shortTermLetting" },
  { key: "suitableForMedicalOffice", labelKey: "assets.detail.medicalOffice" },
  { key: "suitableForInvestment", labelKey: "assets.detail.investment" },
  { key: "isUnderConstruction", labelKey: "assets.detail.underConstruction" },
  { key: "isUnfinished", labelKey: "assets.detail.unfinished" },
  { key: "isAuction", labelKey: "assets.detail.auction" },
];

const LAND_FEATURE_FLAGS: Array<{ key: keyof Asset; labelKey: string }> = [
  { key: "isBuildable", labelKey: "assets.detail.buildable" },
  { key: "hasView", labelKey: "assets.detail.view" },
  { key: "isWithinSettlement", labelKey: "assets.detail.withinSettlement" },
  { key: "isCorner", labelKey: "assets.detail.corner" },
  { key: "isFacade", labelKey: "assets.detail.facade" },
  { key: "suitableForInvestment", labelKey: "assets.detail.investment" },
  { key: "suitableForAgriculturalUse", labelKey: "assets.detail.agriculturalUse" },
  { key: "isAntiparoxi", labelKey: "assets.detail.antiparoxi" },
  { key: "isWithinCityPlan", labelKey: "assets.detail.withinCityPlan" },
  { key: "isAuction", labelKey: "assets.detail.auction" },
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

interface AssetViewPageProps {
  assetId: string;
}

export default function AssetViewPage({ assetId }: AssetViewPageProps) {
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const isRoot = user?.role === "Root";

  const [asset, setAsset] = useState<Asset | null>(null);
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [poolNames, setPoolNames] = useState<PoolNames>(EMPTY_POOL_NAMES);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [priceHistoryUsers, setPriceHistoryUsers] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAsset = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<Asset>>(`/api/assets/${assetId}`);
      setAsset(response.data.data);
      setError(null);
    } catch {
      setError(t("assets.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [assetId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadAsset();
  }, [loadAsset]);

  useEffect(() => {
    apiClient
      .get<ApiResponse<PriceHistoryEntry[]>>(`/api/assets/${assetId}/price-history`)
      .then((response) => setPriceHistory(response.data.data))
      .catch(() => setPriceHistory([]));
  }, [assetId]);

  useEffect(() => {
    if (!asset) return;
    apiClient
      .get<ApiResponse<Realtor>>(`/api/realtors/${asset.realtorId}`)
      .then((response) => setRealtor(response.data.data))
      .catch(() => setRealtor(null));

    if (asset.clientId) {
      apiClient
        .get<ApiResponse<Client>>(`/api/clients/${asset.clientId}`)
        .then((response) => setClient(response.data.data))
        .catch(() => setClient(null));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see AssetDetail's clients effect for why
      setClient(null);
    }
  }, [asset]);

  useEffect(() => {
    if (!asset) return;
    const fields: Array<[keyof PoolNames, string]> = asset.isLand
      ? [
          ["landCategory", "land-categories"],
          ["orientation", "orientations"],
          ["zoningType", "zoning-types"],
          ["roadAccessType", "road-access-types"],
          ["slope", "slopes"],
        ]
      : [
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
      propertyCategory: asset.propertyCategoryId,
      landCategory: asset.landCategoryId,
      floorLevel: asset.floorLevelId,
      energyClass: asset.energyClassId,
      heatingSystem: asset.heatingSystemId,
      heatingMedium: asset.heatingMediumId,
      buildingFloors: asset.buildingFloorsId,
      joineryType: asset.joineryTypeId,
      glassType: asset.glassTypeId,
      floorType: asset.floorTypeId,
      gardenType: asset.gardenTypeId,
      orientation: asset.orientationId,
      zoningType: asset.zoningTypeId,
      roadAccessType: asset.roadAccessTypeId,
      slope: asset.slopeId,
    };
    Promise.all(fields.map(([key, route]) => fetchPoolName(route, idOf[key]))).then((results) => {
      const next = { ...EMPTY_POOL_NAMES };
      fields.forEach(([key], index) => {
        next[key] = results[index];
      });
      setPoolNames(next);
    });
  }, [asset]);

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

  const features = useMemo(() => {
    if (!asset) return [];
    const flags = asset.isLand ? LAND_FEATURE_FLAGS : PROPERTY_FEATURE_FLAGS;
    return flags.filter((flag) => asset[flag.key] === true);
  }, [asset]);

  const technicalDetails = useMemo(() => {
    if (!asset) return [];
    const rows: Array<{ label: string; value: string }> = [];
    const push = (labelKey: string, value: string | number | null | undefined) => {
      if (value === null || value === undefined || value === "") return;
      rows.push({ label: t(labelKey), value: String(value) });
    };
    push("assets.detail.category", asset.isLand ? poolNames.landCategory : poolNames.propertyCategory);
    if (asset.isLand) {
      push("assets.detail.orientation", poolNames.orientation);
      push("assets.detail.zoning", poolNames.zoningType);
      push("assets.detail.roadAccess", poolNames.roadAccessType);
      push("assets.detail.slope", poolNames.slope);
      push("assets.detail.facadeLength", asset.facadeLength);
      push("assets.detail.distanceFromSea", asset.distanceFromSea);
      push("assets.detail.coverageRatio", asset.coverageRatio);
      push("assets.detail.buildingCoefficient", asset.buildingCoefficient);
    } else {
      push("assets.detail.floorLevel", poolNames.floorLevel);
      push("assets.detail.energyClass", poolNames.energyClass);
      push("assets.detail.heatingSystem", poolNames.heatingSystem);
      push("assets.detail.heatingMedium", poolNames.heatingMedium);
      push("assets.detail.buildingFloors", poolNames.buildingFloors);
      push("assets.detail.joineryType", poolNames.joineryType);
      push("assets.detail.glassType", poolNames.glassType);
      push("assets.detail.floorType", poolNames.floorType);
      push("assets.detail.gardenType", poolNames.gardenType);
      push("assets.detail.orientation", poolNames.orientation);
      push("assets.detail.zoning", poolNames.zoningType);
      push("assets.detail.roadAccess", poolNames.roadAccessType);
      push("assets.detail.yearBuilt", asset.yearBuilt);
      push("assets.detail.renovationYear", asset.renovationYear);
      push("assets.detail.netArea", asset.netArea);
      push("assets.detail.grossArea", asset.grossArea);
      push("assets.detail.levels", asset.levels);
      push("assets.detail.storageArea", asset.storageArea);
      push("assets.detail.balconyArea", asset.balconyArea);
      push("assets.detail.distanceFromSea", asset.distanceFromSea);
    }
    return rows;
  }, [asset, poolNames, t]);

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("assets.view.loading")}</p>;
  }

  if (error || !asset) {
    return <p className={sharedStyles.errorText}>{error ?? t("assets.view.loadError")}</p>;
  }

  const locationLine = [asset.address, asset.neighborhood, asset.city, asset.postcode].filter(Boolean).join(", ");
  const fullLocationLine = [locationLine, asset.municipality, asset.region, asset.country].filter(Boolean).join(", ");
  const mapsHref =
    asset.googleMapsUrl ||
    (asset.latitude && asset.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${asset.latitude},${asset.longitude}`
      : null);

  const description = asset.descriptions?.el?.trim();
  const categoryName = asset.isLand ? poolNames.landCategory : poolNames.propertyCategory;

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <button type="button" className={styles.backLink} onClick={() => router.push("/assets")}>
            <ArrowLeft size={14} />
            <span>{t("assets.view.backToAssets")}</span>
          </button>
          <h2 className={sharedStyles.pageTitle}>
            {asset.title || t("assets.table.listingFallback", { id: asset.id.slice(-6) })}
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
        <Button onClick={() => router.push(`/assets/${asset.id}`)}>
          <Pencil size={14} />
          <span>{t("assets.view.editListing")}</span>
        </Button>
      </div>

      <Card className={styles.gallery}>
        {asset.images.length === 0 ? (
          <div className={styles.noImage}>
            <ImageOff size={32} />
            <span>{t("assets.view.noPhotos")}</span>
          </div>
        ) : (
          <>
            <div className={styles.heroImage}>
              {/* Uploaded listing photos are served from our own /uploads route, not a known-dimension CDN. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.images[activeImage]?.url} alt={asset.images[activeImage]?.alt || ""} />
            </div>
            {asset.images.length > 1 && (
              <div className={styles.thumbnailRow}>
                {asset.images.map((image, index) => (
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
            {asset.price.toLocaleString()} {asset.currency}
          </span>
          {asset.priceNegotiable && <span className={styles.negotiable}>{t("assets.view.negotiable")}</span>}
        </div>
        <Badge variant={STATUS_VARIANT[asset.status]}>{t(`assets.status.${asset.status}`)}</Badge>
        <span className={styles.transactionTag}>
          {asset.transactionType === "rent" ? t("assets.table.forRent") : t("assets.table.forSale")}
        </span>
        {!asset.isLand && !!asset.bedrooms && (
          <span className={styles.statPill}>
            <BedDouble size={14} /> {asset.bedrooms}
          </span>
        )}
        {!asset.isLand && !!asset.bathrooms && (
          <span className={styles.statPill}>
            <Bath size={14} /> {asset.bathrooms}
          </span>
        )}
        <span className={styles.statPill}>
          <Ruler size={14} /> {asset.area} m²
        </span>
        {categoryName && (
          <span className={styles.statPill}>
            <Layers size={14} /> {categoryName}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("assets.view.owner")}</h3>
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
              <p className={styles.emptyText}>{t("assets.view.noOwner")}</p>
            )}
          </Card>

          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("assets.detail.sectionDescription")}</h3>
            <p className={styles.description}>{description || t("assets.view.noDescription")}</p>
          </Card>

          {features.length > 0 && (
            <Card className={styles.card}>
              <h3 className={styles.cardTitle}>{t("assets.view.featuresAndAmenities")}</h3>
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
            <h3 className={styles.cardTitle}>{t("assets.view.priceHistory")}</h3>
            {priceHistory.length === 0 ? (
              <p className={styles.emptyText}>{t("assets.view.priceHistoryEmpty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>{t("assets.view.priceHistoryDate")}</th>
                      <th>{t("assets.view.priceHistoryPrice")}</th>
                      <th>{t("assets.view.priceHistoryChangedBy")}</th>
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
              <h3 className={styles.cardTitle}>{t("assets.view.technicalDetails")}</h3>
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
            <EntityDetailTabs entityType={asset.isLand ? "Land" : "Property"} entityId={asset.id} />
          </Card>
        </div>

        <div className={styles.sidebar}>
          {isRoot && (
            <Card className={styles.card}>
              <h3 className={styles.cardTitle}>{t("assets.view.contactRealtor")}</h3>
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
                <p className={styles.emptyText}>{t("assets.view.noRealtor")}</p>
              )}
            </Card>
          )}

          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>{t("assets.view.listingInformation")}</h3>
            <div className={styles.contactBlock}>
              <span className={styles.contactLink}>
                <Calendar size={12} />
                <span>{t("assets.view.createdOn")}: {formatDate(asset.createdAt)}</span>
              </span>
              <span className={styles.contactLink}>
                <Calendar size={12} />
                <span>{t("assets.view.updatedOn")}: {formatDate(asset.updatedAt)}</span>
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
