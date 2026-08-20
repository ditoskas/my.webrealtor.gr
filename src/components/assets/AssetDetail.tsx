"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, LocationMapPicker, SearchableSelect } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Asset, Client, PropertyImage, Realtor, Tag } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./AssetDetail.module.scss";
import { SelectField, TextField, BoolField, SectionHeading, TypeField, TagsField } from "./AssetFormFields";

interface PoolOption {
  id: string;
  name: string;
}

interface PoolOptionsState {
  propertyCategories: PoolOption[];
  landCategories: PoolOption[];
  floorLevels: PoolOption[];
  energyClasses: PoolOption[];
  heatingSystems: PoolOption[];
  heatingMediums: PoolOption[];
  buildingFloors: PoolOption[];
  joineryTypes: PoolOption[];
  glassTypes: PoolOption[];
  floorTypes: PoolOption[];
  gardenTypes: PoolOption[];
  orientations: PoolOption[];
  zoningTypes: PoolOption[];
  roadAccessTypes: PoolOption[];
  slopes: PoolOption[];
}

const EMPTY_POOL_OPTIONS: PoolOptionsState = {
  propertyCategories: [],
  landCategories: [],
  floorLevels: [],
  energyClasses: [],
  heatingSystems: [],
  heatingMediums: [],
  buildingFloors: [],
  joineryTypes: [],
  glassTypes: [],
  floorTypes: [],
  gardenTypes: [],
  orientations: [],
  zoningTypes: [],
  roadAccessTypes: [],
  slopes: [],
};

// Every value here is form-controlled-input-friendly (strings for text/number/date inputs, real
// booleans for checkboxes) — deliberately NOT the same shape as the typed `Asset`/`AssetInput`
// domain interface. The API route's parseAssetBody() already coerces strings → numbers/dates/
// ObjectIds server-side, so this component doesn't need a second parallel conversion layer; it
// just ships the form state close to as-is. Merges the old PropertyDetail + LandDetail FormValues
// into one — see CLAUDE.md → "Asset management".
interface FormValues {
  realtorId: string;
  clientId: string;
  title: string;
  status: string;
  isLand: boolean;

  transactionType: string;
  currency: string;
  propertyCategoryId: string;
  landCategoryId: string;
  isAuction: boolean;
  price: string;
  priceNegotiable: boolean;
  commonExpenses: string;
  area: string;
  lotSize: string;
  isBuildable: boolean;
  availableFrom: string;
  isLeased: boolean;
  publishedAt: string;

  floorLevelId: string;
  isWholeFloorApartment: boolean;
  levels: string;
  bedrooms: string;
  kitchens: string;
  bathrooms: string;
  wc: string;
  livingRooms: string;
  hasStorage: boolean;
  storageArea: string;
  hasAttic: boolean;
  hasPlayroom: boolean;

  energyClassId: string;
  heatingSystemId: string;
  heatingMediumId: string;
  hasAC: boolean;
  hasSolarHeater: boolean;
  hasUnderfloorHeating: boolean;
  hasNightPower: boolean;

  yearBuilt: string;
  isUnderConstruction: boolean;
  isUnfinished: boolean;
  buildingFloorsId: string;
  hasElevator: boolean;
  hasInternalStairs: boolean;
  isNeoclassic: boolean;
  renovationYear: string;
  isRenovated: boolean;
  requiresRenovation: boolean;
  isPreserved: boolean;
  netArea: string;
  grossArea: string;

  hasSecurityDoor: boolean;
  hasAlarm: boolean;
  isPainted: boolean;
  isFurnished: boolean;
  joineryTypeId: string;
  glassTypeId: string;
  hasPestNet: boolean;
  hasFireplace: boolean;
  isBright: boolean;
  isAiry: boolean;
  isLuxury: boolean;
  hasEvCharger: boolean;
  hasMannedReception: boolean;
  floorTypeId: string;
  hasSatelliteDish: boolean;

  hasBalcony: boolean;
  hasAwning: boolean;
  balconyArea: string;
  hasBuiltInBBQ: boolean;
  hasGarden: boolean;
  gardenTypeId: string;
  hasPool: boolean;
  hasView: boolean;
  isWithinSettlement: boolean;
  orientationId: string;
  isCorner: boolean;
  isFacade: boolean;
  zoningTypeId: string;
  facadeLength: string;
  isAccessibleForDisabled: boolean;
  isCaveBuilding: boolean;
  roadAccessTypeId: string;
  distanceFromSea: string;
  hasParking: boolean;
  slopeId: string;
  coverageRatio: string;
  buildingCoefficient: string;
  isAntiparoxi: boolean;
  isWithinCityPlan: boolean;

  suitableForStudents: boolean;
  suitableForHoliday: boolean;
  suitableForCommercialUse: boolean;
  suitableForShortTermLetting: boolean;
  suitableForMedicalOffice: boolean;
  suitableForInvestment: boolean;
  suitableForAgriculturalUse: boolean;

  descriptionEl: string;

  country: string;
  region: string;
  municipality: string;
  neighborhood: string;
  city: string;
  address: string;
  postcode: string;
  latitude: string;
  longitude: string;
  googleMapsUrl: string;

  // The plot's own boundary polygon, drawn on the Location map — see models/Asset.ts's `boundary`.
  boundary: { lat: number; lng: number }[];

  // Not editable here — managed on the dedicated Media page (table row action), see
  // components/assets/AssetMediaPage. Carried through unmodified on save so an edit here never
  // wipes out images uploaded via that page.
  images: PropertyImage[];

  // The realtor's own tags (see CLAUDE.md → "Tags"), assigned/unassigned via AssetFormFields'
  // TagsField. Managed (created/renamed/deleted) from Profile, not here.
  tagIds: string[];
}

const EMPTY_VALUES: FormValues = {
  realtorId: "",
  clientId: "",
  title: "",
  status: "active",
  isLand: false,

  transactionType: "sale",
  currency: "EUR",
  propertyCategoryId: "",
  landCategoryId: "",
  isAuction: false,
  price: "",
  priceNegotiable: false,
  commonExpenses: "",
  area: "",
  lotSize: "",
  isBuildable: false,
  availableFrom: "",
  isLeased: false,
  publishedAt: "",

  floorLevelId: "",
  isWholeFloorApartment: false,
  levels: "",
  bedrooms: "",
  kitchens: "",
  bathrooms: "",
  wc: "",
  livingRooms: "",
  hasStorage: false,
  storageArea: "",
  hasAttic: false,
  hasPlayroom: false,

  energyClassId: "",
  heatingSystemId: "",
  heatingMediumId: "",
  hasAC: false,
  hasSolarHeater: false,
  hasUnderfloorHeating: false,
  hasNightPower: false,

  yearBuilt: "",
  isUnderConstruction: false,
  isUnfinished: false,
  buildingFloorsId: "",
  hasElevator: false,
  hasInternalStairs: false,
  isNeoclassic: false,
  renovationYear: "",
  isRenovated: false,
  requiresRenovation: false,
  isPreserved: false,
  netArea: "",
  grossArea: "",

  hasSecurityDoor: false,
  hasAlarm: false,
  isPainted: false,
  isFurnished: false,
  joineryTypeId: "",
  glassTypeId: "",
  hasPestNet: false,
  hasFireplace: false,
  isBright: false,
  isAiry: false,
  isLuxury: false,
  hasEvCharger: false,
  hasMannedReception: false,
  floorTypeId: "",
  hasSatelliteDish: false,

  hasBalcony: false,
  hasAwning: false,
  balconyArea: "",
  hasBuiltInBBQ: false,
  hasGarden: false,
  gardenTypeId: "",
  hasPool: false,
  hasView: false,
  isWithinSettlement: false,
  orientationId: "",
  isCorner: false,
  isFacade: false,
  zoningTypeId: "",
  facadeLength: "",
  isAccessibleForDisabled: false,
  isCaveBuilding: false,
  roadAccessTypeId: "",
  distanceFromSea: "",
  hasParking: false,
  slopeId: "",
  coverageRatio: "",
  buildingCoefficient: "",
  isAntiparoxi: false,
  isWithinCityPlan: false,

  suitableForStudents: false,
  suitableForHoliday: false,
  suitableForCommercialUse: false,
  suitableForShortTermLetting: false,
  suitableForMedicalOffice: false,
  suitableForInvestment: false,
  suitableForAgriculturalUse: false,

  descriptionEl: "",

  country: "",
  region: "",
  municipality: "",
  neighborhood: "",
  city: "",
  address: "",
  postcode: "",
  latitude: "",
  longitude: "",
  googleMapsUrl: "",
  boundary: [],

  images: [],
  tagIds: [],
};

function assetToFormValues(asset: Asset): FormValues {
  const num = (value?: number | null) => (value === null || value === undefined ? "" : String(value));
  const dateOnly = (value?: string | null) => (value ? value.slice(0, 10) : "");
  return {
    ...EMPTY_VALUES,
    realtorId: asset.realtorId,
    clientId: asset.clientId ?? "",
    title: asset.title ?? "",
    status: asset.status,
    isLand: asset.isLand,

    transactionType: asset.transactionType,
    currency: asset.currency,
    propertyCategoryId: asset.propertyCategoryId ?? "",
    landCategoryId: asset.landCategoryId ?? "",
    isAuction: asset.isAuction,
    price: num(asset.price),
    priceNegotiable: asset.priceNegotiable,
    commonExpenses: num(asset.commonExpenses),
    area: num(asset.area),
    lotSize: num(asset.lotSize),
    isBuildable: asset.isBuildable,
    availableFrom: dateOnly(asset.availableFrom),
    isLeased: asset.isLeased,
    publishedAt: dateOnly(asset.publishedAt),

    floorLevelId: asset.floorLevelId ?? "",
    isWholeFloorApartment: asset.isWholeFloorApartment,
    levels: num(asset.levels),
    bedrooms: num(asset.bedrooms),
    kitchens: num(asset.kitchens),
    bathrooms: num(asset.bathrooms),
    wc: num(asset.wc),
    livingRooms: num(asset.livingRooms),
    hasStorage: asset.hasStorage,
    storageArea: num(asset.storageArea),
    hasAttic: asset.hasAttic,
    hasPlayroom: asset.hasPlayroom,

    energyClassId: asset.energyClassId ?? "",
    heatingSystemId: asset.heatingSystemId ?? "",
    heatingMediumId: asset.heatingMediumId ?? "",
    hasAC: asset.hasAC,
    hasSolarHeater: asset.hasSolarHeater,
    hasUnderfloorHeating: asset.hasUnderfloorHeating,
    hasNightPower: asset.hasNightPower,

    yearBuilt: num(asset.yearBuilt),
    isUnderConstruction: asset.isUnderConstruction,
    isUnfinished: asset.isUnfinished,
    buildingFloorsId: asset.buildingFloorsId ?? "",
    hasElevator: asset.hasElevator,
    hasInternalStairs: asset.hasInternalStairs,
    isNeoclassic: asset.isNeoclassic,
    renovationYear: num(asset.renovationYear),
    isRenovated: asset.isRenovated,
    requiresRenovation: asset.requiresRenovation,
    isPreserved: asset.isPreserved,
    netArea: num(asset.netArea),
    grossArea: num(asset.grossArea),

    hasSecurityDoor: asset.hasSecurityDoor,
    hasAlarm: asset.hasAlarm,
    isPainted: asset.isPainted,
    isFurnished: asset.isFurnished,
    joineryTypeId: asset.joineryTypeId ?? "",
    glassTypeId: asset.glassTypeId ?? "",
    hasPestNet: asset.hasPestNet,
    hasFireplace: asset.hasFireplace,
    isBright: asset.isBright,
    isAiry: asset.isAiry,
    isLuxury: asset.isLuxury,
    hasEvCharger: asset.hasEvCharger,
    hasMannedReception: asset.hasMannedReception,
    floorTypeId: asset.floorTypeId ?? "",
    hasSatelliteDish: asset.hasSatelliteDish,

    hasBalcony: asset.hasBalcony,
    hasAwning: asset.hasAwning,
    balconyArea: num(asset.balconyArea),
    hasBuiltInBBQ: asset.hasBuiltInBBQ,
    hasGarden: asset.hasGarden,
    gardenTypeId: asset.gardenTypeId ?? "",
    hasPool: asset.hasPool,
    hasView: asset.hasView,
    isWithinSettlement: asset.isWithinSettlement,
    orientationId: asset.orientationId ?? "",
    isCorner: asset.isCorner,
    isFacade: asset.isFacade,
    zoningTypeId: asset.zoningTypeId ?? "",
    facadeLength: num(asset.facadeLength),
    isAccessibleForDisabled: asset.isAccessibleForDisabled,
    isCaveBuilding: asset.isCaveBuilding,
    roadAccessTypeId: asset.roadAccessTypeId ?? "",
    distanceFromSea: num(asset.distanceFromSea),
    hasParking: asset.hasParking,
    slopeId: asset.slopeId ?? "",
    coverageRatio: num(asset.coverageRatio),
    buildingCoefficient: num(asset.buildingCoefficient),
    isAntiparoxi: asset.isAntiparoxi,
    isWithinCityPlan: asset.isWithinCityPlan,

    suitableForStudents: asset.suitableForStudents,
    suitableForHoliday: asset.suitableForHoliday,
    suitableForCommercialUse: asset.suitableForCommercialUse,
    suitableForShortTermLetting: asset.suitableForShortTermLetting,
    suitableForMedicalOffice: asset.suitableForMedicalOffice,
    suitableForInvestment: asset.suitableForInvestment,
    suitableForAgriculturalUse: asset.suitableForAgriculturalUse,

    descriptionEl: asset.descriptions?.el ?? "",

    country: asset.country ?? "",
    region: asset.region ?? "",
    municipality: asset.municipality ?? "",
    neighborhood: asset.neighborhood ?? "",
    city: asset.city ?? "",
    address: asset.address ?? "",
    postcode: asset.postcode ?? "",
    latitude: num(asset.latitude),
    longitude: num(asset.longitude),
    googleMapsUrl: asset.googleMapsUrl ?? "",
    boundary: asset.boundary ?? [],

    images: asset.images ?? [],
    tagIds: asset.tagIds ?? [],
  };
}

interface AssetDetailProps {
  mode: "create" | "edit";
  assetId?: string;
}

export default function AssetDetail({ mode, assetId }: AssetDetailProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const isRoot = user?.role === "Root";

  const [values, setValues] = useState<FormValues>({ ...EMPTY_VALUES, realtorId: user?.realtorId ?? "" });
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [poolOptions, setPoolOptions] = useState<PoolOptionsState>(EMPTY_POOL_OPTIONS);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  // Union of both the old Property (13) and Land (5, 3 shared) pool-entity option lists, fetched
  // once in parallel — see CLAUDE.md → "Asset management".
  useEffect(() => {
    Promise.all([
      apiClient.get<ApiResponse<PoolOption[]>>("/api/property-categories"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/land-categories"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/floor-levels"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/energy-classes"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/heating-systems"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/heating-mediums"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/building-floors"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/joinery-types"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/glass-types"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/floor-types"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/garden-types"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/orientations"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/zoning-types"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/road-access-types"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/slopes"),
    ])
      .then(
        ([
          propertyCategories,
          landCategories,
          floorLevels,
          energyClasses,
          heatingSystems,
          heatingMediums,
          buildingFloors,
          joineryTypes,
          glassTypes,
          floorTypes,
          gardenTypes,
          orientations,
          zoningTypes,
          roadAccessTypes,
          slopes,
        ]) => {
          setPoolOptions({
            propertyCategories: propertyCategories.data.data,
            landCategories: landCategories.data.data,
            floorLevels: floorLevels.data.data,
            energyClasses: energyClasses.data.data,
            heatingSystems: heatingSystems.data.data,
            heatingMediums: heatingMediums.data.data,
            buildingFloors: buildingFloors.data.data,
            joineryTypes: joineryTypes.data.data,
            glassTypes: glassTypes.data.data,
            floorTypes: floorTypes.data.data,
            gardenTypes: gardenTypes.data.data,
            orientations: orientations.data.data,
            zoningTypes: zoningTypes.data.data,
            roadAccessTypes: roadAccessTypes.data.data,
            slopes: slopes.data.data,
          });
        }
      )
      .catch(() => setPoolOptions(EMPTY_POOL_OPTIONS));
  }, []);

  useEffect(() => {
    if (!isRoot) return;
    apiClient
      .get<ApiResponse<Realtor[]>>("/api/realtors")
      .then((response) => setRealtors(response.data.data))
      .catch(() => setRealtors([]));
  }, [isRoot]);

  // Redux's auth state hydrates asynchronously (see DashboardShell), so `user` can still be null on
  // the very first render — the useState initializer above would then have captured realtorId: "" for
  // good. Once the current user is known, backfill it for a non-Root caller creating a new listing (an
  // edit in progress already has its own realtorId from loadAsset, so leave that alone).
  useEffect(() => {
    if (mode !== "create" || isRoot || !user?.realtorId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- backfilling from async auth hydration, see comment above
    setField("realtorId", user.realtorId);
  }, [mode, isRoot, user?.realtorId]);

  // Client list: Root sees every client (no realtor picked yet on a fresh form); Administrator/Operator
  // are scoped to their own realtor, same as ClientsPage.
  useEffect(() => {
    if (isRoot) {
      apiClient
        .get<ApiResponse<Client[]>>("/api/clients")
        .then((response) => setClients(response.data.data))
        .catch(() => setClients([]));
      return;
    }
    if (!values.realtorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClients([]);
      return;
    }
    apiClient
      .get<ApiResponse<Client[]>>(`/api/clients?realtorId=${values.realtorId}`)
      .then((response) => setClients(response.data.data))
      .catch(() => setClients([]));
  }, [isRoot, values.realtorId]);

  // Tags are always realtor-scoped (see CLAUDE.md → "Tags") — no unscoped list exists, unlike
  // Clients above, so this always passes realtorId once one is known, for every role including Root.
  useEffect(() => {
    if (!values.realtorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTags([]);
      return;
    }
    apiClient
      .get<ApiResponse<Tag[]>>(`/api/tags?realtorId=${values.realtorId}`)
      .then((response) => setTags(response.data.data))
      .catch(() => setTags([]));
  }, [values.realtorId]);

  // The selected realtor's own address — used by the Location map to center on somewhere relevant
  // before this listing has a location of its own. Fetched by id rather than read off `realtors`
  // (which is only populated for Root) so it works for every role.
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null);
  useEffect(() => {
    if (!values.realtorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRealtor(null);
      return;
    }
    apiClient
      .get<ApiResponse<Realtor>>(`/api/realtors/${values.realtorId}`)
      .then((response) => setSelectedRealtor(response.data.data))
      .catch(() => setSelectedRealtor(null));
  }, [values.realtorId]);

  const realtorFallbackAddress = selectedRealtor
    ? [selectedRealtor.address, selectedRealtor.city, selectedRealtor.postcode].filter(Boolean).join(", ")
    : "";

  const listingAddressQuery = [values.address, values.city, values.municipality, values.region, values.postcode, values.country]
    .filter((part) => part.trim())
    .join(", ");

  const loadAsset = useCallback(async () => {
    if (mode !== "edit" || !assetId) return;
    try {
      const response = await apiClient.get<ApiResponse<Asset>>(`/api/assets/${assetId}`);
      setValues(assetToFormValues(response.data.data));
    } catch {
      setError(t("assets.detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [mode, assetId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadAsset();
  }, [loadAsset]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const { descriptionEl, ...rest } = values;
    const payload = {
      ...rest,
      descriptions: descriptionEl.trim() ? { el: descriptionEl.trim() } : {},
    };

    const displayTitle = values.title || t("assets.detail.untitledListing");
    try {
      if (mode === "create") {
        await apiClient.post("/api/assets", payload);
        MessageHandler.success(dispatch, t("assets.detail.createSuccess", { title: displayTitle }));
      } else {
        await apiClient.put(`/api/assets/${assetId}`, payload);
        MessageHandler.success(dispatch, t("assets.detail.editSuccess", { title: displayTitle }));
      }
      router.push("/assets");
    } catch (err) {
      setError(getErrorMessage(err, t("assets.detail.saveError")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("assets.detail.loadingDetail")}</p>;
  }

  const isLand = values.isLand;

  return (
    <form onSubmit={handleSubmit}>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{mode === "create" ? t("assets.detail.createTitle") : t("assets.detail.editTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>
            {mode === "create" ? t("assets.detail.createSubtitle") : t("assets.detail.editSubtitle")}
          </p>
        </div>
      </div>

      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <Card className={styles.card}>
        <TypeField isLand={isLand} onChange={(value) => setField("isLand", value)} locked={mode === "edit"} />
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("assets.detail.sectionOwnership")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          {isRoot && (
            <SelectField
              id="realtorId"
              label={t("assets.detail.realtor")}
              required
              value={values.realtorId}
              onChange={(value) => setField("realtorId", value)}
              options={realtors.map((realtor) => ({ id: realtor.id, name: `${realtor.firstName} ${realtor.lastName}` }))}
            />
          )}
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="clientId">
              {t("assets.detail.clientOwner")}
            </label>
            <SearchableSelect
              id="clientId"
              value={values.clientId}
              onChange={(value) => setField("clientId", value)}
              placeholder={t("common.selectPlaceholder")}
              options={[
                { value: "", label: t("assets.detail.clientOwnerNone") },
                ...clients.map((client) => ({ value: client.id, label: `${client.firstName} ${client.lastName}` })),
              ]}
            />
          </div>
          <TextField id="title" label={t("assets.detail.internalTitle")} value={values.title} onChange={(value) => setField("title", value)} />
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="status">{t("assets.detail.status")}</label>
            <select
              id="status"
              className={sharedStyles.input}
              value={values.status}
              onChange={(event) => setField("status", event.target.value)}
            >
              <option value="active">{t("assets.status.active")}</option>
              <option value="pending">{t("assets.status.pending")}</option>
              <option value="inactive">{t("assets.status.inactive")}</option>
            </select>
          </div>
        </div>
        <TagsField tags={tags} selectedIds={values.tagIds} onChange={(ids) => setField("tagIds", ids)} />
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("assets.detail.sectionBasicInfo")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="transactionType">{t("assets.detail.transactionType")}</label>
            <select
              id="transactionType"
              className={sharedStyles.input}
              value={values.transactionType}
              onChange={(event) => setField("transactionType", event.target.value)}
            >
              <option value="sale">{t("assets.detail.sale")}</option>
              <option value="rent">{t("assets.detail.rent")}</option>
            </select>
          </div>
          <TextField id="currency" label={t("assets.detail.currency")} value={values.currency} onChange={(v) => setField("currency", v)} />
          {isLand ? (
            <SelectField
              id="landCategoryId"
              label={t("assets.detail.category")}
              required
              value={values.landCategoryId}
              onChange={(v) => setField("landCategoryId", v)}
              options={poolOptions.landCategories}
            />
          ) : (
            <SelectField
              id="propertyCategoryId"
              label={t("assets.detail.category")}
              required
              value={values.propertyCategoryId}
              onChange={(v) => setField("propertyCategoryId", v)}
              options={poolOptions.propertyCategories}
            />
          )}
          <TextField id="price" label={t("assets.detail.price")} type="number" required value={values.price} onChange={(v) => setField("price", v)} />
          {!isLand && (
            <TextField id="commonExpenses" label={t("assets.detail.commonExpenses")} type="number" value={values.commonExpenses} onChange={(v) => setField("commonExpenses", v)} />
          )}
          <TextField id="area" label={t("assets.detail.area")} type="number" required value={values.area} onChange={(v) => setField("area", v)} />
          {!isLand && (
            <TextField id="lotSize" label={t("assets.detail.lotSize")} type="number" value={values.lotSize} onChange={(v) => setField("lotSize", v)} />
          )}
          <TextField id="availableFrom" label={t("assets.detail.availableFrom")} type="date" value={values.availableFrom} onChange={(v) => setField("availableFrom", v)} />
          {!isLand && (
            <TextField id="publishedAt" label={t("assets.detail.publishedAt")} type="date" value={values.publishedAt} onChange={(v) => setField("publishedAt", v)} />
          )}
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="isAuction" label={t("assets.detail.auction")} checked={values.isAuction} onChange={(v) => setField("isAuction", v)} />
          <BoolField id="priceNegotiable" label={t("assets.detail.priceNegotiable")} checked={values.priceNegotiable} onChange={(v) => setField("priceNegotiable", v)} />
          {isLand ? (
            <BoolField id="isBuildable" label={t("assets.detail.buildable")} checked={values.isBuildable} onChange={(v) => setField("isBuildable", v)} />
          ) : (
            <BoolField id="isLeased" label={t("assets.detail.leased")} checked={values.isLeased} onChange={(v) => setField("isLeased", v)} />
          )}
        </div>
      </Card>

      {!isLand && (
        <>
          <Card className={styles.card}>
            <SectionHeading>{t("assets.detail.sectionPropertyDescription")}</SectionHeading>
            <div className={sharedStyles.formGrid}>
              <SelectField id="floorLevelId" label={t("assets.detail.floorLevel")} value={values.floorLevelId} onChange={(v) => setField("floorLevelId", v)} options={poolOptions.floorLevels} />
              <TextField id="levels" label={t("assets.detail.levels")} type="number" value={values.levels} onChange={(v) => setField("levels", v)} />
              <TextField id="bedrooms" label={t("assets.detail.bedrooms")} type="number" value={values.bedrooms} onChange={(v) => setField("bedrooms", v)} />
              <TextField id="kitchens" label={t("assets.detail.kitchens")} type="number" value={values.kitchens} onChange={(v) => setField("kitchens", v)} />
              <TextField id="bathrooms" label={t("assets.detail.bathrooms")} type="number" value={values.bathrooms} onChange={(v) => setField("bathrooms", v)} />
              <TextField id="wc" label={t("assets.detail.wc")} type="number" value={values.wc} onChange={(v) => setField("wc", v)} />
              <TextField id="livingRooms" label={t("assets.detail.livingRooms")} type="number" value={values.livingRooms} onChange={(v) => setField("livingRooms", v)} />
              <TextField id="storageArea" label={t("assets.detail.storageArea")} type="number" value={values.storageArea} onChange={(v) => setField("storageArea", v)} />
            </div>
            <div className={styles.checkboxGrid}>
              <BoolField id="isWholeFloorApartment" label={t("assets.detail.wholeFloorApartment")} checked={values.isWholeFloorApartment} onChange={(v) => setField("isWholeFloorApartment", v)} />
              <BoolField id="hasStorage" label={t("assets.detail.storage")} checked={values.hasStorage} onChange={(v) => setField("hasStorage", v)} />
              <BoolField id="hasAttic" label={t("assets.detail.attic")} checked={values.hasAttic} onChange={(v) => setField("hasAttic", v)} />
              <BoolField id="hasPlayroom" label={t("assets.detail.playroom")} checked={values.hasPlayroom} onChange={(v) => setField("hasPlayroom", v)} />
            </div>
          </Card>

          <Card className={styles.card}>
            <SectionHeading>{t("assets.detail.sectionHeating")}</SectionHeading>
            <div className={sharedStyles.formGrid}>
              <SelectField id="energyClassId" label={t("assets.detail.energyClass")} required value={values.energyClassId} onChange={(v) => setField("energyClassId", v)} options={poolOptions.energyClasses} />
              <SelectField id="heatingSystemId" label={t("assets.detail.heatingSystem")} value={values.heatingSystemId} onChange={(v) => setField("heatingSystemId", v)} options={poolOptions.heatingSystems} />
              <SelectField id="heatingMediumId" label={t("assets.detail.heatingMedium")} value={values.heatingMediumId} onChange={(v) => setField("heatingMediumId", v)} options={poolOptions.heatingMediums} />
            </div>
            <div className={styles.checkboxGrid}>
              <BoolField id="hasAC" label={t("assets.detail.ac")} checked={values.hasAC} onChange={(v) => setField("hasAC", v)} />
              <BoolField id="hasSolarHeater" label={t("assets.detail.solarHeater")} checked={values.hasSolarHeater} onChange={(v) => setField("hasSolarHeater", v)} />
              <BoolField id="hasUnderfloorHeating" label={t("assets.detail.underfloorHeating")} checked={values.hasUnderfloorHeating} onChange={(v) => setField("hasUnderfloorHeating", v)} />
              <BoolField id="hasNightPower" label={t("assets.detail.nightPower")} checked={values.hasNightPower} onChange={(v) => setField("hasNightPower", v)} />
            </div>
          </Card>

          <Card className={styles.card}>
            <SectionHeading>{t("assets.detail.sectionConstruction")}</SectionHeading>
            <div className={sharedStyles.formGrid}>
              <TextField id="yearBuilt" label={t("assets.detail.yearBuilt")} type="number" value={values.yearBuilt} onChange={(v) => setField("yearBuilt", v)} />
              <SelectField id="buildingFloorsId" label={t("assets.detail.buildingFloors")} value={values.buildingFloorsId} onChange={(v) => setField("buildingFloorsId", v)} options={poolOptions.buildingFloors} />
              <TextField id="renovationYear" label={t("assets.detail.renovationYear")} type="number" value={values.renovationYear} onChange={(v) => setField("renovationYear", v)} />
              <TextField id="netArea" label={t("assets.detail.netArea")} type="number" value={values.netArea} onChange={(v) => setField("netArea", v)} />
              <TextField id="grossArea" label={t("assets.detail.grossArea")} type="number" value={values.grossArea} onChange={(v) => setField("grossArea", v)} />
            </div>
            <div className={styles.checkboxGrid}>
              <BoolField id="isUnderConstruction" label={t("assets.detail.underConstruction")} checked={values.isUnderConstruction} onChange={(v) => setField("isUnderConstruction", v)} />
              <BoolField id="isUnfinished" label={t("assets.detail.unfinished")} checked={values.isUnfinished} onChange={(v) => setField("isUnfinished", v)} />
              <BoolField id="hasElevator" label={t("assets.detail.elevator")} checked={values.hasElevator} onChange={(v) => setField("hasElevator", v)} />
              <BoolField id="hasInternalStairs" label={t("assets.detail.internalStairs")} checked={values.hasInternalStairs} onChange={(v) => setField("hasInternalStairs", v)} />
              <BoolField id="isNeoclassic" label={t("assets.detail.neoclassic")} checked={values.isNeoclassic} onChange={(v) => setField("isNeoclassic", v)} />
              <BoolField id="isRenovated" label={t("assets.detail.renovated")} checked={values.isRenovated} onChange={(v) => setField("isRenovated", v)} />
              <BoolField id="requiresRenovation" label={t("assets.detail.requiresRenovation")} checked={values.requiresRenovation} onChange={(v) => setField("requiresRenovation", v)} />
              <BoolField id="isPreserved" label={t("assets.detail.preserved")} checked={values.isPreserved} onChange={(v) => setField("isPreserved", v)} />
            </div>
          </Card>

          <Card className={styles.card}>
            <SectionHeading>{t("assets.detail.sectionTechnical")}</SectionHeading>
            <div className={sharedStyles.formGrid}>
              <SelectField id="joineryTypeId" label={t("assets.detail.joineryType")} value={values.joineryTypeId} onChange={(v) => setField("joineryTypeId", v)} options={poolOptions.joineryTypes} />
              <SelectField id="glassTypeId" label={t("assets.detail.glassType")} value={values.glassTypeId} onChange={(v) => setField("glassTypeId", v)} options={poolOptions.glassTypes} />
              <SelectField id="floorTypeId" label={t("assets.detail.floorType")} value={values.floorTypeId} onChange={(v) => setField("floorTypeId", v)} options={poolOptions.floorTypes} />
            </div>
            <div className={styles.checkboxGrid}>
              <BoolField id="hasSecurityDoor" label={t("assets.detail.securityDoor")} checked={values.hasSecurityDoor} onChange={(v) => setField("hasSecurityDoor", v)} />
              <BoolField id="hasAlarm" label={t("assets.detail.alarm")} checked={values.hasAlarm} onChange={(v) => setField("hasAlarm", v)} />
              <BoolField id="isPainted" label={t("assets.detail.painted")} checked={values.isPainted} onChange={(v) => setField("isPainted", v)} />
              <BoolField id="isFurnished" label={t("assets.detail.furnished")} checked={values.isFurnished} onChange={(v) => setField("isFurnished", v)} />
              <BoolField id="hasPestNet" label={t("assets.detail.pestNet")} checked={values.hasPestNet} onChange={(v) => setField("hasPestNet", v)} />
              <BoolField id="hasFireplace" label={t("assets.detail.fireplace")} checked={values.hasFireplace} onChange={(v) => setField("hasFireplace", v)} />
              <BoolField id="isBright" label={t("assets.detail.bright")} checked={values.isBright} onChange={(v) => setField("isBright", v)} />
              <BoolField id="isAiry" label={t("assets.detail.airy")} checked={values.isAiry} onChange={(v) => setField("isAiry", v)} />
              <BoolField id="isLuxury" label={t("assets.detail.luxury")} checked={values.isLuxury} onChange={(v) => setField("isLuxury", v)} />
              <BoolField id="hasEvCharger" label={t("assets.detail.evCharger")} checked={values.hasEvCharger} onChange={(v) => setField("hasEvCharger", v)} />
              <BoolField id="hasMannedReception" label={t("assets.detail.mannedReception")} checked={values.hasMannedReception} onChange={(v) => setField("hasMannedReception", v)} />
              <BoolField id="hasSatelliteDish" label={t("assets.detail.satelliteDish")} checked={values.hasSatelliteDish} onChange={(v) => setField("hasSatelliteDish", v)} />
            </div>
          </Card>
        </>
      )}

      <Card className={styles.card}>
        <SectionHeading>{t("assets.detail.sectionOutdoor")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          {!isLand && (
            <>
              <TextField id="balconyArea" label={t("assets.detail.balconyArea")} type="number" value={values.balconyArea} onChange={(v) => setField("balconyArea", v)} />
              <SelectField id="gardenTypeId" label={t("assets.detail.gardenType")} value={values.gardenTypeId} onChange={(v) => setField("gardenTypeId", v)} options={poolOptions.gardenTypes} />
            </>
          )}
          <SelectField id="orientationId" label={t("assets.detail.orientation")} value={values.orientationId} onChange={(v) => setField("orientationId", v)} options={poolOptions.orientations} />
          <SelectField id="zoningTypeId" label={t("assets.detail.zoning")} value={values.zoningTypeId} onChange={(v) => setField("zoningTypeId", v)} options={poolOptions.zoningTypes} />
          <SelectField id="roadAccessTypeId" label={t("assets.detail.roadAccess")} value={values.roadAccessTypeId} onChange={(v) => setField("roadAccessTypeId", v)} options={poolOptions.roadAccessTypes} />
          <TextField id="distanceFromSea" label={t("assets.detail.distanceFromSea")} type="number" value={values.distanceFromSea} onChange={(v) => setField("distanceFromSea", v)} />
          {isLand && (
            <>
              <SelectField id="slopeId" label={t("assets.detail.slope")} value={values.slopeId} onChange={(v) => setField("slopeId", v)} options={poolOptions.slopes} />
              <TextField id="facadeLength" label={t("assets.detail.facadeLength")} type="number" value={values.facadeLength} onChange={(v) => setField("facadeLength", v)} />
              <TextField id="coverageRatio" label={t("assets.detail.coverageRatio")} type="number" value={values.coverageRatio} onChange={(v) => setField("coverageRatio", v)} />
              <TextField id="buildingCoefficient" label={t("assets.detail.buildingCoefficient")} type="number" value={values.buildingCoefficient} onChange={(v) => setField("buildingCoefficient", v)} />
            </>
          )}
        </div>
        <div className={styles.checkboxGrid}>
          {!isLand && (
            <>
              <BoolField id="hasBalcony" label={t("assets.detail.balcony")} checked={values.hasBalcony} onChange={(v) => setField("hasBalcony", v)} />
              <BoolField id="hasAwning" label={t("assets.detail.awning")} checked={values.hasAwning} onChange={(v) => setField("hasAwning", v)} />
              <BoolField id="hasBuiltInBBQ" label={t("assets.detail.builtInBBQ")} checked={values.hasBuiltInBBQ} onChange={(v) => setField("hasBuiltInBBQ", v)} />
              <BoolField id="hasGarden" label={t("assets.detail.garden")} checked={values.hasGarden} onChange={(v) => setField("hasGarden", v)} />
              <BoolField id="hasPool" label={t("assets.detail.pool")} checked={values.hasPool} onChange={(v) => setField("hasPool", v)} />
            </>
          )}
          <BoolField id="hasView" label={t("assets.detail.view")} checked={values.hasView} onChange={(v) => setField("hasView", v)} />
          <BoolField id="isCorner" label={t("assets.detail.corner")} checked={values.isCorner} onChange={(v) => setField("isCorner", v)} />
          <BoolField id="isFacade" label={t("assets.detail.facade")} checked={values.isFacade} onChange={(v) => setField("isFacade", v)} />
          {!isLand && (
            <>
              <BoolField id="isAccessibleForDisabled" label={t("assets.detail.accessibleForDisabled")} checked={values.isAccessibleForDisabled} onChange={(v) => setField("isAccessibleForDisabled", v)} />
              <BoolField id="isCaveBuilding" label={t("assets.detail.caveBuilding")} checked={values.isCaveBuilding} onChange={(v) => setField("isCaveBuilding", v)} />
              <BoolField id="hasParking" label={t("assets.detail.parking")} checked={values.hasParking} onChange={(v) => setField("hasParking", v)} />
            </>
          )}
          {isLand && (
            <>
              <BoolField id="isWithinSettlement" label={t("assets.detail.withinSettlement")} checked={values.isWithinSettlement} onChange={(v) => setField("isWithinSettlement", v)} />
              <BoolField id="isAntiparoxi" label={t("assets.detail.antiparoxi")} checked={values.isAntiparoxi} onChange={(v) => setField("isAntiparoxi", v)} />
              <BoolField id="isWithinCityPlan" label={t("assets.detail.withinCityPlan")} checked={values.isWithinCityPlan} onChange={(v) => setField("isWithinCityPlan", v)} />
              <BoolField id="suitableForAgriculturalUse" label={t("assets.detail.agriculturalUse")} checked={values.suitableForAgriculturalUse} onChange={(v) => setField("suitableForAgriculturalUse", v)} />
            </>
          )}
          <BoolField id="suitableForInvestment" label={t("assets.detail.investment")} checked={values.suitableForInvestment} onChange={(v) => setField("suitableForInvestment", v)} />
        </div>
      </Card>

      {!isLand && (
        <Card className={styles.card}>
          <SectionHeading>{t("assets.detail.sectionSuitableFor")}</SectionHeading>
          <div className={styles.checkboxGrid}>
            <BoolField id="suitableForStudents" label={t("assets.detail.students")} checked={values.suitableForStudents} onChange={(v) => setField("suitableForStudents", v)} />
            <BoolField id="suitableForHoliday" label={t("assets.detail.holidayHome")} checked={values.suitableForHoliday} onChange={(v) => setField("suitableForHoliday", v)} />
            <BoolField id="suitableForCommercialUse" label={t("assets.detail.commercialUse")} checked={values.suitableForCommercialUse} onChange={(v) => setField("suitableForCommercialUse", v)} />
            <BoolField id="suitableForShortTermLetting" label={t("assets.detail.shortTermLetting")} checked={values.suitableForShortTermLetting} onChange={(v) => setField("suitableForShortTermLetting", v)} />
            <BoolField id="suitableForMedicalOffice" label={t("assets.detail.medicalOffice")} checked={values.suitableForMedicalOffice} onChange={(v) => setField("suitableForMedicalOffice", v)} />
          </div>
        </Card>
      )}

      <Card className={styles.card}>
        <SectionHeading>{t("assets.detail.sectionDescription")}</SectionHeading>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="descriptionEl">{t("assets.detail.descriptionGreek")}</label>
          <textarea
            id="descriptionEl"
            rows={6}
            className={sharedStyles.input}
            value={values.descriptionEl}
            onChange={(event) => setField("descriptionEl", event.target.value)}
          />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("assets.detail.sectionLocation")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <TextField id="country" label={t("assets.detail.country")} value={values.country} onChange={(v) => setField("country", v)} />
          <TextField id="region" label={t("assets.detail.region")} value={values.region} onChange={(v) => setField("region", v)} />
          <TextField id="municipality" label={t("assets.detail.municipality")} value={values.municipality} onChange={(v) => setField("municipality", v)} />
          <TextField id="neighborhood" label={t("assets.detail.neighborhood")} value={values.neighborhood} onChange={(v) => setField("neighborhood", v)} />
          <TextField id="city" label={t("assets.detail.city")} value={values.city} onChange={(v) => setField("city", v)} />
          <TextField id="address" label={t("assets.detail.address")} value={values.address} onChange={(v) => setField("address", v)} />
          <TextField id="postcode" label={t("assets.detail.postcode")} value={values.postcode} onChange={(v) => setField("postcode", v)} />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label}>{t("assets.detail.locationOnMap")}</label>
          <LocationMapPicker
            latitude={values.latitude}
            longitude={values.longitude}
            fallbackAddress={realtorFallbackAddress}
            addressQuery={listingAddressQuery}
            alwaysFollowAddress={mode === "create"}
            onLocationChange={(lat, lng, mapsUrl) => {
              setValues((prev) => ({
                ...prev,
                latitude: String(lat),
                longitude: String(lng),
                googleMapsUrl: mapsUrl,
              }));
            }}
            boundary={values.boundary}
            onBoundaryChange={(points) => setField("boundary", points)}
          />
        </div>
      </Card>

      <div className={sharedStyles.formActions}>
        <Button type="button" variant="outline" onClick={() => router.push("/assets")} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t("common.saving") : mode === "create" ? t("assets.detail.createSubmit") : t("assets.detail.saveSubmit")}
        </Button>
      </div>
    </form>
  );
}
