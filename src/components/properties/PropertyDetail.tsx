"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, LocationMapPicker } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Client, Property, PropertyImage, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./PropertyDetail.module.scss";
import { SelectField, TextField, BoolField, SectionHeading } from "./PropertyFormFields";

interface PoolOption {
  id: string;
  name: string;
}

interface PoolOptionsState {
  propertyCategories: PoolOption[];
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
}

const EMPTY_POOL_OPTIONS: PoolOptionsState = {
  propertyCategories: [],
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
};

// Every value here is form-controlled-input-friendly (strings for text/number/date inputs, real
// booleans for checkboxes) — deliberately NOT the same shape as the typed `Property`/`PropertyInput`
// domain interfaces. The API routes' parsePropertyBody() already coerces strings → numbers/dates/
// ObjectIds server-side, so this component doesn't need a second parallel conversion layer; it just
// ships the form state close to as-is.
interface FormValues {
  realtorId: string;
  clientId: string;
  title: string;
  status: string;

  transactionType: string;
  currency: string;
  propertyCategoryId: string;
  isAuction: boolean;
  price: string;
  priceNegotiable: boolean;
  commonExpenses: string;
  area: string;
  lotSize: string;
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
  orientationId: string;
  isCorner: boolean;
  isFacade: boolean;
  zoningTypeId: string;
  isAccessibleForDisabled: boolean;
  isCaveBuilding: boolean;
  roadAccessTypeId: string;
  distanceFromSea: string;
  hasParking: boolean;

  suitableForStudents: boolean;
  suitableForHoliday: boolean;
  suitableForCommercialUse: boolean;
  suitableForShortTermLetting: boolean;
  suitableForMedicalOffice: boolean;
  suitableForInvestment: boolean;

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

  // Not editable here — managed on the dedicated Media page (table row action), see
  // components/properties/PropertyMediaPage. Carried through unmodified on save so an edit here
  // never wipes out images uploaded via that page.
  images: PropertyImage[];
}

const EMPTY_VALUES: FormValues = {
  realtorId: "",
  clientId: "",
  title: "",
  status: "active",

  transactionType: "sale",
  currency: "EUR",
  propertyCategoryId: "",
  isAuction: false,
  price: "",
  priceNegotiable: false,
  commonExpenses: "",
  area: "",
  lotSize: "",
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
  orientationId: "",
  isCorner: false,
  isFacade: false,
  zoningTypeId: "",
  isAccessibleForDisabled: false,
  isCaveBuilding: false,
  roadAccessTypeId: "",
  distanceFromSea: "",
  hasParking: false,

  suitableForStudents: false,
  suitableForHoliday: false,
  suitableForCommercialUse: false,
  suitableForShortTermLetting: false,
  suitableForMedicalOffice: false,
  suitableForInvestment: false,

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

  images: [],
};

function propertyToFormValues(property: Property): FormValues {
  const num = (value?: number | null) => (value === null || value === undefined ? "" : String(value));
  const dateOnly = (value?: string | null) => (value ? value.slice(0, 10) : "");
  return {
    ...EMPTY_VALUES,
    realtorId: property.realtorId,
    clientId: property.clientId ?? "",
    title: property.title ?? "",
    status: property.status,

    transactionType: property.transactionType,
    currency: property.currency,
    propertyCategoryId: property.propertyCategoryId ?? "",
    isAuction: property.isAuction,
    price: num(property.price),
    priceNegotiable: property.priceNegotiable,
    commonExpenses: num(property.commonExpenses),
    area: num(property.area),
    lotSize: num(property.lotSize),
    availableFrom: dateOnly(property.availableFrom),
    isLeased: property.isLeased,
    publishedAt: dateOnly(property.publishedAt),

    floorLevelId: property.floorLevelId ?? "",
    isWholeFloorApartment: property.isWholeFloorApartment,
    levels: num(property.levels),
    bedrooms: num(property.bedrooms),
    kitchens: num(property.kitchens),
    bathrooms: num(property.bathrooms),
    wc: num(property.wc),
    livingRooms: num(property.livingRooms),
    hasStorage: property.hasStorage,
    storageArea: num(property.storageArea),
    hasAttic: property.hasAttic,
    hasPlayroom: property.hasPlayroom,

    energyClassId: property.energyClassId ?? "",
    heatingSystemId: property.heatingSystemId ?? "",
    heatingMediumId: property.heatingMediumId ?? "",
    hasAC: property.hasAC,
    hasSolarHeater: property.hasSolarHeater,
    hasUnderfloorHeating: property.hasUnderfloorHeating,
    hasNightPower: property.hasNightPower,

    yearBuilt: num(property.yearBuilt),
    isUnderConstruction: property.isUnderConstruction,
    isUnfinished: property.isUnfinished,
    buildingFloorsId: property.buildingFloorsId ?? "",
    hasElevator: property.hasElevator,
    hasInternalStairs: property.hasInternalStairs,
    isNeoclassic: property.isNeoclassic,
    renovationYear: num(property.renovationYear),
    isRenovated: property.isRenovated,
    requiresRenovation: property.requiresRenovation,
    isPreserved: property.isPreserved,
    netArea: num(property.netArea),
    grossArea: num(property.grossArea),

    hasSecurityDoor: property.hasSecurityDoor,
    hasAlarm: property.hasAlarm,
    isPainted: property.isPainted,
    isFurnished: property.isFurnished,
    joineryTypeId: property.joineryTypeId ?? "",
    glassTypeId: property.glassTypeId ?? "",
    hasPestNet: property.hasPestNet,
    hasFireplace: property.hasFireplace,
    isBright: property.isBright,
    isAiry: property.isAiry,
    isLuxury: property.isLuxury,
    hasEvCharger: property.hasEvCharger,
    hasMannedReception: property.hasMannedReception,
    floorTypeId: property.floorTypeId ?? "",
    hasSatelliteDish: property.hasSatelliteDish,

    hasBalcony: property.hasBalcony,
    hasAwning: property.hasAwning,
    balconyArea: num(property.balconyArea),
    hasBuiltInBBQ: property.hasBuiltInBBQ,
    hasGarden: property.hasGarden,
    gardenTypeId: property.gardenTypeId ?? "",
    hasPool: property.hasPool,
    hasView: property.hasView,
    orientationId: property.orientationId ?? "",
    isCorner: property.isCorner,
    isFacade: property.isFacade,
    zoningTypeId: property.zoningTypeId ?? "",
    isAccessibleForDisabled: property.isAccessibleForDisabled,
    isCaveBuilding: property.isCaveBuilding,
    roadAccessTypeId: property.roadAccessTypeId ?? "",
    distanceFromSea: num(property.distanceFromSea),
    hasParking: property.hasParking,

    suitableForStudents: property.suitableForStudents,
    suitableForHoliday: property.suitableForHoliday,
    suitableForCommercialUse: property.suitableForCommercialUse,
    suitableForShortTermLetting: property.suitableForShortTermLetting,
    suitableForMedicalOffice: property.suitableForMedicalOffice,
    suitableForInvestment: property.suitableForInvestment,

    descriptionEl: property.descriptions?.el ?? "",

    country: property.country ?? "",
    region: property.region ?? "",
    municipality: property.municipality ?? "",
    neighborhood: property.neighborhood ?? "",
    city: property.city ?? "",
    address: property.address ?? "",
    postcode: property.postcode ?? "",
    latitude: num(property.latitude),
    longitude: num(property.longitude),
    googleMapsUrl: property.googleMapsUrl ?? "",

    images: property.images ?? [],
  };
}

interface PropertyDetailProps {
  mode: "create" | "edit";
  propertyId?: string;
}

export default function PropertyDetail({ mode, propertyId }: PropertyDetailProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const t = useTranslation();
  const user = useCurrentUser();
  const isRoot = user?.role === "Root";

  const [values, setValues] = useState<FormValues>({ ...EMPTY_VALUES, realtorId: user?.realtorId ?? "" });
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [poolOptions, setPoolOptions] = useState<PoolOptionsState>(EMPTY_POOL_OPTIONS);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  // All 13 pool-entity option lists, fetched once in parallel — see CLAUDE.md → "Property attribute
  // pool entities" for the full list of routes.
  useEffect(() => {
    Promise.all([
      apiClient.get<ApiResponse<PoolOption[]>>("/api/property-categories"),
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
    ])
      .then(
        ([
          propertyCategories,
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
        ]) => {
          setPoolOptions({
            propertyCategories: propertyCategories.data.data,
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
  // edit in progress already has its own realtorId from loadProperty, so leave that alone).
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

  const loadProperty = useCallback(async () => {
    if (mode !== "edit" || !propertyId) return;
    try {
      const response = await apiClient.get<ApiResponse<Property>>(`/api/properties/${propertyId}`);
      setValues(propertyToFormValues(response.data.data));
    } catch {
      setError(t("properties.detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [mode, propertyId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadProperty();
  }, [loadProperty]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const { descriptionEl, ...rest } = values;
    const payload = {
      ...rest,
      descriptions: descriptionEl.trim() ? { el: descriptionEl.trim() } : {},
    };

    const displayTitle = values.title || t("properties.detail.untitledListing");
    try {
      if (mode === "create") {
        await apiClient.post("/api/properties", payload);
        MessageHandler.success(dispatch, t("properties.detail.createSuccess", { title: displayTitle }));
      } else {
        await apiClient.put(`/api/properties/${propertyId}`, payload);
        MessageHandler.success(dispatch, t("properties.detail.editSuccess", { title: displayTitle }));
      }
      router.push("/properties");
    } catch (err) {
      setError(getErrorMessage(err, t("properties.detail.saveError")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("properties.detail.loadingDetail")}</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{mode === "create" ? t("properties.detail.createTitle") : t("properties.detail.editTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>
            {mode === "create" ? t("properties.detail.createSubtitle") : t("properties.detail.editSubtitle")}
          </p>
        </div>
      </div>

      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionOwnership")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          {isRoot && (
            <SelectField
              id="realtorId"
              label={t("properties.detail.realtor")}
              required
              value={values.realtorId}
              onChange={(value) => setField("realtorId", value)}
              options={realtors.map((realtor) => ({ id: realtor.id, name: `${realtor.firstName} ${realtor.lastName}` }))}
            />
          )}
          <SelectField
            id="clientId"
            label={t("properties.detail.clientOwner")}
            value={values.clientId}
            onChange={(value) => setField("clientId", value)}
            options={clients.map((client) => ({ id: client.id, name: `${client.firstName} ${client.lastName}` }))}
          />
          <TextField id="title" label={t("properties.detail.internalTitle")} value={values.title} onChange={(value) => setField("title", value)} />
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="status">{t("properties.detail.status")}</label>
            <select
              id="status"
              className={sharedStyles.input}
              value={values.status}
              onChange={(event) => setField("status", event.target.value)}
            >
              <option value="active">{t("properties.status.active")}</option>
              <option value="pending">{t("properties.status.pending")}</option>
              <option value="inactive">{t("properties.status.inactive")}</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionBasicInfo")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="transactionType">{t("properties.detail.transactionType")}</label>
            <select
              id="transactionType"
              className={sharedStyles.input}
              value={values.transactionType}
              onChange={(event) => setField("transactionType", event.target.value)}
            >
              <option value="sale">{t("properties.detail.sale")}</option>
              <option value="rent">{t("properties.detail.rent")}</option>
            </select>
          </div>
          <TextField id="currency" label={t("properties.detail.currency")} value={values.currency} onChange={(v) => setField("currency", v)} />
          <SelectField
            id="propertyCategoryId"
            label={t("properties.detail.category")}
            required
            value={values.propertyCategoryId}
            onChange={(v) => setField("propertyCategoryId", v)}
            options={poolOptions.propertyCategories}
          />
          <TextField id="price" label={t("properties.detail.price")} type="number" required value={values.price} onChange={(v) => setField("price", v)} />
          <TextField id="commonExpenses" label={t("properties.detail.commonExpenses")} type="number" value={values.commonExpenses} onChange={(v) => setField("commonExpenses", v)} />
          <TextField id="area" label={t("properties.detail.area")} type="number" required value={values.area} onChange={(v) => setField("area", v)} />
          <TextField id="lotSize" label={t("properties.detail.lotSize")} type="number" value={values.lotSize} onChange={(v) => setField("lotSize", v)} />
          <TextField id="availableFrom" label={t("properties.detail.availableFrom")} type="date" value={values.availableFrom} onChange={(v) => setField("availableFrom", v)} />
          <TextField id="publishedAt" label={t("properties.detail.publishedAt")} type="date" value={values.publishedAt} onChange={(v) => setField("publishedAt", v)} />
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="isAuction" label={t("properties.detail.auction")} checked={values.isAuction} onChange={(v) => setField("isAuction", v)} />
          <BoolField id="priceNegotiable" label={t("properties.detail.priceNegotiable")} checked={values.priceNegotiable} onChange={(v) => setField("priceNegotiable", v)} />
          <BoolField id="isLeased" label={t("properties.detail.leased")} checked={values.isLeased} onChange={(v) => setField("isLeased", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionPropertyDescription")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <SelectField id="floorLevelId" label={t("properties.detail.floorLevel")} value={values.floorLevelId} onChange={(v) => setField("floorLevelId", v)} options={poolOptions.floorLevels} />
          <TextField id="levels" label={t("properties.detail.levels")} type="number" value={values.levels} onChange={(v) => setField("levels", v)} />
          <TextField id="bedrooms" label={t("properties.detail.bedrooms")} type="number" value={values.bedrooms} onChange={(v) => setField("bedrooms", v)} />
          <TextField id="kitchens" label={t("properties.detail.kitchens")} type="number" value={values.kitchens} onChange={(v) => setField("kitchens", v)} />
          <TextField id="bathrooms" label={t("properties.detail.bathrooms")} type="number" value={values.bathrooms} onChange={(v) => setField("bathrooms", v)} />
          <TextField id="wc" label={t("properties.detail.wc")} type="number" value={values.wc} onChange={(v) => setField("wc", v)} />
          <TextField id="livingRooms" label={t("properties.detail.livingRooms")} type="number" value={values.livingRooms} onChange={(v) => setField("livingRooms", v)} />
          <TextField id="storageArea" label={t("properties.detail.storageArea")} type="number" value={values.storageArea} onChange={(v) => setField("storageArea", v)} />
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="isWholeFloorApartment" label={t("properties.detail.wholeFloorApartment")} checked={values.isWholeFloorApartment} onChange={(v) => setField("isWholeFloorApartment", v)} />
          <BoolField id="hasStorage" label={t("properties.detail.storage")} checked={values.hasStorage} onChange={(v) => setField("hasStorage", v)} />
          <BoolField id="hasAttic" label={t("properties.detail.attic")} checked={values.hasAttic} onChange={(v) => setField("hasAttic", v)} />
          <BoolField id="hasPlayroom" label={t("properties.detail.playroom")} checked={values.hasPlayroom} onChange={(v) => setField("hasPlayroom", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionHeating")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <SelectField id="energyClassId" label={t("properties.detail.energyClass")} required value={values.energyClassId} onChange={(v) => setField("energyClassId", v)} options={poolOptions.energyClasses} />
          <SelectField id="heatingSystemId" label={t("properties.detail.heatingSystem")} value={values.heatingSystemId} onChange={(v) => setField("heatingSystemId", v)} options={poolOptions.heatingSystems} />
          <SelectField id="heatingMediumId" label={t("properties.detail.heatingMedium")} value={values.heatingMediumId} onChange={(v) => setField("heatingMediumId", v)} options={poolOptions.heatingMediums} />
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="hasAC" label={t("properties.detail.ac")} checked={values.hasAC} onChange={(v) => setField("hasAC", v)} />
          <BoolField id="hasSolarHeater" label={t("properties.detail.solarHeater")} checked={values.hasSolarHeater} onChange={(v) => setField("hasSolarHeater", v)} />
          <BoolField id="hasUnderfloorHeating" label={t("properties.detail.underfloorHeating")} checked={values.hasUnderfloorHeating} onChange={(v) => setField("hasUnderfloorHeating", v)} />
          <BoolField id="hasNightPower" label={t("properties.detail.nightPower")} checked={values.hasNightPower} onChange={(v) => setField("hasNightPower", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionConstruction")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <TextField id="yearBuilt" label={t("properties.detail.yearBuilt")} type="number" value={values.yearBuilt} onChange={(v) => setField("yearBuilt", v)} />
          <SelectField id="buildingFloorsId" label={t("properties.detail.buildingFloors")} value={values.buildingFloorsId} onChange={(v) => setField("buildingFloorsId", v)} options={poolOptions.buildingFloors} />
          <TextField id="renovationYear" label={t("properties.detail.renovationYear")} type="number" value={values.renovationYear} onChange={(v) => setField("renovationYear", v)} />
          <TextField id="netArea" label={t("properties.detail.netArea")} type="number" value={values.netArea} onChange={(v) => setField("netArea", v)} />
          <TextField id="grossArea" label={t("properties.detail.grossArea")} type="number" value={values.grossArea} onChange={(v) => setField("grossArea", v)} />
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="isUnderConstruction" label={t("properties.detail.underConstruction")} checked={values.isUnderConstruction} onChange={(v) => setField("isUnderConstruction", v)} />
          <BoolField id="isUnfinished" label={t("properties.detail.unfinished")} checked={values.isUnfinished} onChange={(v) => setField("isUnfinished", v)} />
          <BoolField id="hasElevator" label={t("properties.detail.elevator")} checked={values.hasElevator} onChange={(v) => setField("hasElevator", v)} />
          <BoolField id="hasInternalStairs" label={t("properties.detail.internalStairs")} checked={values.hasInternalStairs} onChange={(v) => setField("hasInternalStairs", v)} />
          <BoolField id="isNeoclassic" label={t("properties.detail.neoclassic")} checked={values.isNeoclassic} onChange={(v) => setField("isNeoclassic", v)} />
          <BoolField id="isRenovated" label={t("properties.detail.renovated")} checked={values.isRenovated} onChange={(v) => setField("isRenovated", v)} />
          <BoolField id="requiresRenovation" label={t("properties.detail.requiresRenovation")} checked={values.requiresRenovation} onChange={(v) => setField("requiresRenovation", v)} />
          <BoolField id="isPreserved" label={t("properties.detail.preserved")} checked={values.isPreserved} onChange={(v) => setField("isPreserved", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionTechnical")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <SelectField id="joineryTypeId" label={t("properties.detail.joineryType")} value={values.joineryTypeId} onChange={(v) => setField("joineryTypeId", v)} options={poolOptions.joineryTypes} />
          <SelectField id="glassTypeId" label={t("properties.detail.glassType")} value={values.glassTypeId} onChange={(v) => setField("glassTypeId", v)} options={poolOptions.glassTypes} />
          <SelectField id="floorTypeId" label={t("properties.detail.floorType")} value={values.floorTypeId} onChange={(v) => setField("floorTypeId", v)} options={poolOptions.floorTypes} />
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="hasSecurityDoor" label={t("properties.detail.securityDoor")} checked={values.hasSecurityDoor} onChange={(v) => setField("hasSecurityDoor", v)} />
          <BoolField id="hasAlarm" label={t("properties.detail.alarm")} checked={values.hasAlarm} onChange={(v) => setField("hasAlarm", v)} />
          <BoolField id="isPainted" label={t("properties.detail.painted")} checked={values.isPainted} onChange={(v) => setField("isPainted", v)} />
          <BoolField id="isFurnished" label={t("properties.detail.furnished")} checked={values.isFurnished} onChange={(v) => setField("isFurnished", v)} />
          <BoolField id="hasPestNet" label={t("properties.detail.pestNet")} checked={values.hasPestNet} onChange={(v) => setField("hasPestNet", v)} />
          <BoolField id="hasFireplace" label={t("properties.detail.fireplace")} checked={values.hasFireplace} onChange={(v) => setField("hasFireplace", v)} />
          <BoolField id="isBright" label={t("properties.detail.bright")} checked={values.isBright} onChange={(v) => setField("isBright", v)} />
          <BoolField id="isAiry" label={t("properties.detail.airy")} checked={values.isAiry} onChange={(v) => setField("isAiry", v)} />
          <BoolField id="isLuxury" label={t("properties.detail.luxury")} checked={values.isLuxury} onChange={(v) => setField("isLuxury", v)} />
          <BoolField id="hasEvCharger" label={t("properties.detail.evCharger")} checked={values.hasEvCharger} onChange={(v) => setField("hasEvCharger", v)} />
          <BoolField id="hasMannedReception" label={t("properties.detail.mannedReception")} checked={values.hasMannedReception} onChange={(v) => setField("hasMannedReception", v)} />
          <BoolField id="hasSatelliteDish" label={t("properties.detail.satelliteDish")} checked={values.hasSatelliteDish} onChange={(v) => setField("hasSatelliteDish", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionOutdoor")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <TextField id="balconyArea" label={t("properties.detail.balconyArea")} type="number" value={values.balconyArea} onChange={(v) => setField("balconyArea", v)} />
          <SelectField id="gardenTypeId" label={t("properties.detail.gardenType")} value={values.gardenTypeId} onChange={(v) => setField("gardenTypeId", v)} options={poolOptions.gardenTypes} />
          <SelectField id="orientationId" label={t("properties.detail.orientation")} value={values.orientationId} onChange={(v) => setField("orientationId", v)} options={poolOptions.orientations} />
          <SelectField id="zoningTypeId" label={t("properties.detail.zoning")} value={values.zoningTypeId} onChange={(v) => setField("zoningTypeId", v)} options={poolOptions.zoningTypes} />
          <SelectField id="roadAccessTypeId" label={t("properties.detail.roadAccess")} value={values.roadAccessTypeId} onChange={(v) => setField("roadAccessTypeId", v)} options={poolOptions.roadAccessTypes} />
          <TextField id="distanceFromSea" label={t("properties.detail.distanceFromSea")} type="number" value={values.distanceFromSea} onChange={(v) => setField("distanceFromSea", v)} />
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="hasBalcony" label={t("properties.detail.balcony")} checked={values.hasBalcony} onChange={(v) => setField("hasBalcony", v)} />
          <BoolField id="hasAwning" label={t("properties.detail.awning")} checked={values.hasAwning} onChange={(v) => setField("hasAwning", v)} />
          <BoolField id="hasBuiltInBBQ" label={t("properties.detail.builtInBBQ")} checked={values.hasBuiltInBBQ} onChange={(v) => setField("hasBuiltInBBQ", v)} />
          <BoolField id="hasGarden" label={t("properties.detail.garden")} checked={values.hasGarden} onChange={(v) => setField("hasGarden", v)} />
          <BoolField id="hasPool" label={t("properties.detail.pool")} checked={values.hasPool} onChange={(v) => setField("hasPool", v)} />
          <BoolField id="hasView" label={t("properties.detail.view")} checked={values.hasView} onChange={(v) => setField("hasView", v)} />
          <BoolField id="isCorner" label={t("properties.detail.corner")} checked={values.isCorner} onChange={(v) => setField("isCorner", v)} />
          <BoolField id="isFacade" label={t("properties.detail.facade")} checked={values.isFacade} onChange={(v) => setField("isFacade", v)} />
          <BoolField id="isAccessibleForDisabled" label={t("properties.detail.accessibleForDisabled")} checked={values.isAccessibleForDisabled} onChange={(v) => setField("isAccessibleForDisabled", v)} />
          <BoolField id="isCaveBuilding" label={t("properties.detail.caveBuilding")} checked={values.isCaveBuilding} onChange={(v) => setField("isCaveBuilding", v)} />
          <BoolField id="hasParking" label={t("properties.detail.parking")} checked={values.hasParking} onChange={(v) => setField("hasParking", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionSuitableFor")}</SectionHeading>
        <div className={styles.checkboxGrid}>
          <BoolField id="suitableForStudents" label={t("properties.detail.students")} checked={values.suitableForStudents} onChange={(v) => setField("suitableForStudents", v)} />
          <BoolField id="suitableForHoliday" label={t("properties.detail.holidayHome")} checked={values.suitableForHoliday} onChange={(v) => setField("suitableForHoliday", v)} />
          <BoolField id="suitableForCommercialUse" label={t("properties.detail.commercialUse")} checked={values.suitableForCommercialUse} onChange={(v) => setField("suitableForCommercialUse", v)} />
          <BoolField id="suitableForShortTermLetting" label={t("properties.detail.shortTermLetting")} checked={values.suitableForShortTermLetting} onChange={(v) => setField("suitableForShortTermLetting", v)} />
          <BoolField id="suitableForMedicalOffice" label={t("properties.detail.medicalOffice")} checked={values.suitableForMedicalOffice} onChange={(v) => setField("suitableForMedicalOffice", v)} />
          <BoolField id="suitableForInvestment" label={t("properties.detail.investment")} checked={values.suitableForInvestment} onChange={(v) => setField("suitableForInvestment", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("properties.detail.sectionDescription")}</SectionHeading>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="descriptionEl">{t("properties.detail.descriptionGreek")}</label>
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
        <SectionHeading>{t("properties.detail.sectionLocation")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <TextField id="country" label={t("properties.detail.country")} value={values.country} onChange={(v) => setField("country", v)} />
          <TextField id="region" label={t("properties.detail.region")} value={values.region} onChange={(v) => setField("region", v)} />
          <TextField id="municipality" label={t("properties.detail.municipality")} value={values.municipality} onChange={(v) => setField("municipality", v)} />
          <TextField id="neighborhood" label={t("properties.detail.neighborhood")} value={values.neighborhood} onChange={(v) => setField("neighborhood", v)} />
          <TextField id="city" label={t("properties.detail.city")} value={values.city} onChange={(v) => setField("city", v)} />
          <TextField id="address" label={t("properties.detail.address")} value={values.address} onChange={(v) => setField("address", v)} />
          <TextField id="postcode" label={t("properties.detail.postcode")} value={values.postcode} onChange={(v) => setField("postcode", v)} />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label}>{t("properties.detail.locationOnMap")}</label>
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
          />
        </div>
      </Card>

      <div className={sharedStyles.formActions}>
        <Button type="button" variant="outline" onClick={() => router.push("/properties")} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t("common.saving") : mode === "create" ? t("properties.detail.createSubmit") : t("properties.detail.saveSubmit")}
        </Button>
      </div>
    </form>
  );
}
