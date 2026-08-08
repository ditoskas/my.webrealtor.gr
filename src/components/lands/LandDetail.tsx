"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, LocationMapPicker } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCurrentUser, useTranslation } from "@/store/hooks";
import type { ApiResponse, Client, Land, PropertyImage, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./LandDetail.module.scss";
import { SelectField, TextField, BoolField, SectionHeading } from "./LandFormFields";

interface PoolOption {
  id: string;
  name: string;
}

interface PoolOptionsState {
  landCategories: PoolOption[];
  orientations: PoolOption[];
  zoningTypes: PoolOption[];
  roadAccessTypes: PoolOption[];
  slopes: PoolOption[];
}

const EMPTY_POOL_OPTIONS: PoolOptionsState = {
  landCategories: [],
  orientations: [],
  zoningTypes: [],
  roadAccessTypes: [],
  slopes: [],
};

// Same convention as PropertyDetail's FormValues — every value is controlled-input-friendly
// (strings/booleans), distinct from the typed Land/LandInput domain interfaces. Server-side
// parseLandBody() handles all string → number/date/ObjectId coercion.
interface FormValues {
  realtorId: string;
  clientId: string;
  title: string;
  status: string;

  transactionType: string;
  currency: string;
  landCategoryId: string;
  isAuction: boolean;
  price: string;
  priceNegotiable: boolean;
  area: string;
  isBuildable: boolean;
  availableFrom: string;

  hasView: boolean;
  isWithinSettlement: boolean;
  orientationId: string;
  isCorner: boolean;
  isFacade: boolean;
  zoningTypeId: string;
  facadeLength: string;
  distanceFromSea: string;
  slopeId: string;
  suitableForInvestment: boolean;
  suitableForAgriculturalUse: boolean;
  roadAccessTypeId: string;
  coverageRatio: string;
  buildingCoefficient: string;
  isAntiparoxi: boolean;
  isWithinCityPlan: boolean;

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
  // components/lands/LandMediaPage. Carried through unmodified on save so an edit here never
  // wipes out images uploaded via that page.
  images: PropertyImage[];
}

const EMPTY_VALUES: FormValues = {
  realtorId: "",
  clientId: "",
  title: "",
  status: "active",

  transactionType: "sale",
  currency: "EUR",
  landCategoryId: "",
  isAuction: false,
  price: "",
  priceNegotiable: false,
  area: "",
  isBuildable: false,
  availableFrom: "",

  hasView: false,
  isWithinSettlement: false,
  orientationId: "",
  isCorner: false,
  isFacade: false,
  zoningTypeId: "",
  facadeLength: "",
  distanceFromSea: "",
  slopeId: "",
  suitableForInvestment: false,
  suitableForAgriculturalUse: false,
  roadAccessTypeId: "",
  coverageRatio: "",
  buildingCoefficient: "",
  isAntiparoxi: false,
  isWithinCityPlan: false,

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

function landToFormValues(land: Land): FormValues {
  const num = (value?: number | null) => (value === null || value === undefined ? "" : String(value));
  const dateOnly = (value?: string | null) => (value ? value.slice(0, 10) : "");
  return {
    ...EMPTY_VALUES,
    realtorId: land.realtorId,
    clientId: land.clientId ?? "",
    title: land.title ?? "",
    status: land.status,

    transactionType: land.transactionType,
    currency: land.currency,
    landCategoryId: land.landCategoryId ?? "",
    isAuction: land.isAuction,
    price: num(land.price),
    priceNegotiable: land.priceNegotiable,
    area: num(land.area),
    isBuildable: land.isBuildable,
    availableFrom: dateOnly(land.availableFrom),

    hasView: land.hasView,
    isWithinSettlement: land.isWithinSettlement,
    orientationId: land.orientationId ?? "",
    isCorner: land.isCorner,
    isFacade: land.isFacade,
    zoningTypeId: land.zoningTypeId ?? "",
    facadeLength: num(land.facadeLength),
    distanceFromSea: num(land.distanceFromSea),
    slopeId: land.slopeId ?? "",
    suitableForInvestment: land.suitableForInvestment,
    suitableForAgriculturalUse: land.suitableForAgriculturalUse,
    roadAccessTypeId: land.roadAccessTypeId ?? "",
    coverageRatio: num(land.coverageRatio),
    buildingCoefficient: num(land.buildingCoefficient),
    isAntiparoxi: land.isAntiparoxi,
    isWithinCityPlan: land.isWithinCityPlan,

    descriptionEl: land.descriptions?.el ?? "",

    country: land.country ?? "",
    region: land.region ?? "",
    municipality: land.municipality ?? "",
    neighborhood: land.neighborhood ?? "",
    city: land.city ?? "",
    address: land.address ?? "",
    postcode: land.postcode ?? "",
    latitude: num(land.latitude),
    longitude: num(land.longitude),
    googleMapsUrl: land.googleMapsUrl ?? "",

    images: land.images ?? [],
  };
}

interface LandDetailProps {
  mode: "create" | "edit";
  landId?: string;
}

export default function LandDetail({ mode, landId }: LandDetailProps) {
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

  // 5 pool-entity option lists, fetched once in parallel — see CLAUDE.md → "Land management".
  useEffect(() => {
    Promise.all([
      apiClient.get<ApiResponse<PoolOption[]>>("/api/land-categories"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/orientations"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/zoning-types"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/road-access-types"),
      apiClient.get<ApiResponse<PoolOption[]>>("/api/slopes"),
    ])
      .then(([landCategories, orientations, zoningTypes, roadAccessTypes, slopes]) => {
        setPoolOptions({
          landCategories: landCategories.data.data,
          orientations: orientations.data.data,
          zoningTypes: zoningTypes.data.data,
          roadAccessTypes: roadAccessTypes.data.data,
          slopes: slopes.data.data,
        });
      })
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
  // edit in progress already has its own realtorId from loadLand, so leave that alone).
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

  const loadLand = useCallback(async () => {
    if (mode !== "edit" || !landId) return;
    try {
      const response = await apiClient.get<ApiResponse<Land>>(`/api/lands/${landId}`);
      setValues(landToFormValues(response.data.data));
    } catch {
      setError(t("land.detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [mode, landId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see RealtorsPage for why
    loadLand();
  }, [loadLand]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const { descriptionEl, ...rest } = values;
    const payload = {
      ...rest,
      descriptions: descriptionEl.trim() ? { el: descriptionEl.trim() } : {},
    };

    try {
      if (mode === "create") {
        await apiClient.post("/api/lands", payload);
        MessageHandler.success(dispatch, t("land.detail.createSuccess", { title: values.title || "" }));
      } else {
        await apiClient.put(`/api/lands/${landId}`, payload);
        MessageHandler.success(dispatch, t("land.detail.editSuccess", { title: values.title || "" }));
      }
      router.push("/lands");
    } catch (err) {
      setError(getErrorMessage(err, t("land.detail.saveError")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">{t("land.detail.loadingDetail")}</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{mode === "create" ? t("land.detail.createTitle") : t("land.detail.editTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>
            {mode === "create" ? t("land.detail.createSubtitle") : t("land.detail.editSubtitle")}
          </p>
        </div>
      </div>

      {error && <p className={sharedStyles.errorText}>{error}</p>}

      <Card className={styles.card}>
        <SectionHeading>{t("land.detail.sectionOwnership")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          {isRoot && (
            <SelectField
              id="realtorId"
              label={t("land.detail.realtor")}
              required
              value={values.realtorId}
              onChange={(value) => setField("realtorId", value)}
              options={realtors.map((realtor) => ({ id: realtor.id, name: `${realtor.firstName} ${realtor.lastName}` }))}
            />
          )}
          <SelectField
            id="clientId"
            label={t("land.detail.clientOwner")}
            value={values.clientId}
            onChange={(value) => setField("clientId", value)}
            options={clients.map((client) => ({ id: client.id, name: `${client.firstName} ${client.lastName}` }))}
          />
          <TextField id="title" label={t("land.detail.internalTitle")} value={values.title} onChange={(value) => setField("title", value)} />
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="status">{t("land.detail.status")}</label>
            <select
              id="status"
              className={sharedStyles.input}
              value={values.status}
              onChange={(event) => setField("status", event.target.value)}
            >
              <option value="active">{t("land.status.active")}</option>
              <option value="pending">{t("land.status.pending")}</option>
              <option value="inactive">{t("land.status.inactive")}</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("land.detail.sectionBasicInfo")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="transactionType">{t("land.detail.transactionType")}</label>
            <select
              id="transactionType"
              className={sharedStyles.input}
              value={values.transactionType}
              onChange={(event) => setField("transactionType", event.target.value)}
            >
              <option value="sale">{t("land.detail.sale")}</option>
              <option value="rent">{t("land.detail.rent")}</option>
            </select>
          </div>
          <TextField id="currency" label={t("land.detail.currency")} value={values.currency} onChange={(v) => setField("currency", v)} />
          <SelectField
            id="landCategoryId"
            label={t("land.detail.category")}
            required
            value={values.landCategoryId}
            onChange={(v) => setField("landCategoryId", v)}
            options={poolOptions.landCategories}
          />
          <TextField id="price" label={t("land.detail.price")} type="number" required value={values.price} onChange={(v) => setField("price", v)} />
          <TextField id="area" label={t("land.detail.area")} type="number" required value={values.area} onChange={(v) => setField("area", v)} />
          <TextField id="availableFrom" label={t("land.detail.availableFrom")} type="date" value={values.availableFrom} onChange={(v) => setField("availableFrom", v)} />
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="isAuction" label={t("land.detail.auction")} checked={values.isAuction} onChange={(v) => setField("isAuction", v)} />
          <BoolField id="priceNegotiable" label={t("land.detail.priceNegotiable")} checked={values.priceNegotiable} onChange={(v) => setField("priceNegotiable", v)} />
          <BoolField id="isBuildable" label={t("land.detail.buildable")} checked={values.isBuildable} onChange={(v) => setField("isBuildable", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("land.detail.sectionOutdoor")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <SelectField id="orientationId" label={t("land.detail.orientation")} value={values.orientationId} onChange={(v) => setField("orientationId", v)} options={poolOptions.orientations} />
          <SelectField id="zoningTypeId" label={t("land.detail.zoning")} value={values.zoningTypeId} onChange={(v) => setField("zoningTypeId", v)} options={poolOptions.zoningTypes} />
          <SelectField id="roadAccessTypeId" label={t("land.detail.roadAccess")} value={values.roadAccessTypeId} onChange={(v) => setField("roadAccessTypeId", v)} options={poolOptions.roadAccessTypes} />
          <SelectField id="slopeId" label={t("land.detail.slope")} value={values.slopeId} onChange={(v) => setField("slopeId", v)} options={poolOptions.slopes} />
          <TextField id="facadeLength" label={t("land.detail.facadeLength")} type="number" value={values.facadeLength} onChange={(v) => setField("facadeLength", v)} />
          <TextField id="distanceFromSea" label={t("land.detail.distanceFromSea")} type="number" value={values.distanceFromSea} onChange={(v) => setField("distanceFromSea", v)} />
          <TextField id="coverageRatio" label={t("land.detail.coverageRatio")} type="number" value={values.coverageRatio} onChange={(v) => setField("coverageRatio", v)} />
          <TextField id="buildingCoefficient" label={t("land.detail.buildingCoefficient")} type="number" value={values.buildingCoefficient} onChange={(v) => setField("buildingCoefficient", v)} />
        </div>
        <div className={styles.checkboxGrid}>
          <BoolField id="hasView" label={t("land.detail.view")} checked={values.hasView} onChange={(v) => setField("hasView", v)} />
          <BoolField id="isWithinSettlement" label={t("land.detail.withinSettlement")} checked={values.isWithinSettlement} onChange={(v) => setField("isWithinSettlement", v)} />
          <BoolField id="isCorner" label={t("land.detail.corner")} checked={values.isCorner} onChange={(v) => setField("isCorner", v)} />
          <BoolField id="isFacade" label={t("land.detail.facade")} checked={values.isFacade} onChange={(v) => setField("isFacade", v)} />
          <BoolField id="suitableForInvestment" label={t("land.detail.investment")} checked={values.suitableForInvestment} onChange={(v) => setField("suitableForInvestment", v)} />
          <BoolField id="suitableForAgriculturalUse" label={t("land.detail.agriculturalUse")} checked={values.suitableForAgriculturalUse} onChange={(v) => setField("suitableForAgriculturalUse", v)} />
          <BoolField id="isAntiparoxi" label={t("land.detail.antiparoxi")} checked={values.isAntiparoxi} onChange={(v) => setField("isAntiparoxi", v)} />
          <BoolField id="isWithinCityPlan" label={t("land.detail.withinCityPlan")} checked={values.isWithinCityPlan} onChange={(v) => setField("isWithinCityPlan", v)} />
        </div>
      </Card>

      <Card className={styles.card}>
        <SectionHeading>{t("land.detail.sectionDescription")}</SectionHeading>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="descriptionEl">{t("land.detail.descriptionGreek")}</label>
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
        <SectionHeading>{t("land.detail.sectionLocation")}</SectionHeading>
        <div className={sharedStyles.formGrid}>
          <TextField id="country" label={t("land.detail.country")} value={values.country} onChange={(v) => setField("country", v)} />
          <TextField id="region" label={t("land.detail.region")} value={values.region} onChange={(v) => setField("region", v)} />
          <TextField id="municipality" label={t("land.detail.municipality")} value={values.municipality} onChange={(v) => setField("municipality", v)} />
          <TextField id="neighborhood" label={t("land.detail.neighborhood")} value={values.neighborhood} onChange={(v) => setField("neighborhood", v)} />
          <TextField id="city" label={t("land.detail.city")} value={values.city} onChange={(v) => setField("city", v)} />
          <TextField id="address" label={t("land.detail.address")} value={values.address} onChange={(v) => setField("address", v)} />
          <TextField id="postcode" label={t("land.detail.postcode")} value={values.postcode} onChange={(v) => setField("postcode", v)} />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label}>{t("land.detail.locationOnMap")}</label>
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
        <Button type="button" variant="outline" onClick={() => router.push("/lands")} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t("common.saving") : mode === "create" ? t("land.detail.createSubmit") : t("land.detail.saveSubmit")}
        </Button>
      </div>
    </form>
  );
}
