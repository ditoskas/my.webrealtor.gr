"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button, SearchableSelect } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { listingLabel } from "@/lib/listingLabel";
import { useCurrentUser, useTranslation } from "@/store/hooks";
import {
  type ApiResponse,
  type Client,
  type FloorLevel,
  type Land,
  type LandCategory,
  type Property,
  type PropertyCategory,
  type Realtor,
  type TransactionInput,
} from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";

interface TransactionFormValues {
  realtorId: string;
  clientId: string;
  date: string;
  listingType: TransactionInput["listingType"];
  listingId: string;
  action: TransactionInput["action"];
  price: number;
  buyerCommission: number;
  sellerCommission: number;
  tax: number;
  comment: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// realtor.saleCommission drives a "buy" action, realtor.rentCommission drives "rent" — see
// CLAUDE.md → "Realtor commission rates". Returns null (leave commission untouched) when the
// realtor has no rate set for that action. Only auto-fills buyerCommission (the rate configured
// on the realtor) — sellerCommission is always manual, since not every deal collects from both
// sides and there's no second rate to derive it from.
function computeCommission(price: number, action: TransactionInput["action"], realtor: Realtor | null): number | null {
  if (!realtor) return null;
  const rate = action === "rent" ? realtor.rentCommission : realtor.saleCommission;
  if (rate == null) return null;
  return Math.round(price * rate * 100) / 100;
}

interface TransactionFormProps {
  initialValues?: Partial<TransactionFormValues>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: TransactionInput) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  initialValues,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const t = useTranslation();
  const user = useCurrentUser();
  // Only Root manages transactions across every realtor — Administrator/Operator are always
  // scoped to their own, same reasoning as ClientForm's realtor field.
  const isRoot = user?.role === "Root";

  const [values, setValues] = useState<TransactionFormValues>({
    realtorId: user?.realtorId ?? "",
    clientId: "",
    listingType: "Property",
    listingId: "",
    action: "buy",
    price: 0,
    buyerCommission: 0,
    sellerCommission: 0,
    tax: 0,
    comment: "",
    ...initialValues,
    date: initialValues?.date ? initialValues.date.slice(0, 10) : todayIsoDate(),
  });

  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [propertyListings, setPropertyListings] = useState<Property[]>([]);
  const [landListings, setLandListings] = useState<Land[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [floorLevels, setFloorLevels] = useState<FloorLevel[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [listingError, setListingError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null);

  useEffect(() => {
    if (!isRoot) return;
    apiClient
      .get<ApiResponse<Realtor[]>>("/api/realtors")
      .then((response) => setRealtors(response.data.data))
      .catch(() => setRealtors([]));
  }, [isRoot]);

  // The full Realtor record (with saleCommission/rentCommission), independent of the `realtors`
  // list above (which is Root-only, for the realtor picker) — fetched by id so the price/
  // commission auto-fill below has the current realtor's rates regardless of role.
  useEffect(() => {
    if (!values.realtorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing on an unset realtor, same pattern as the clients/listings effect below
      setSelectedRealtor(null);
      return;
    }
    apiClient
      .get<ApiResponse<Realtor>>(`/api/realtors/${values.realtorId}`)
      .then((response) => setSelectedRealtor(response.data.data))
      .catch(() => setSelectedRealtor(null));
  }, [values.realtorId]);

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

  // Client/Property/Land options scoped to the currently chosen realtor — see CLAUDE.md → "Data
  // scoping by realtor" (CRITICAL). Refetched whenever realtorId changes (Root switching realtors).
  // `clients` is no longer a picker's options list (see handleListingSelect below) — it's only
  // used to resolve the read-only client display's name.
  useEffect(() => {
    if (!values.realtorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing dependent lists when realtorId is unset, mirrors PropertyDetail's own client-list effect
      setClients([]);
      setPropertyListings([]);
      setLandListings([]);
      return;
    }
    apiClient
      .get<ApiResponse<Client[]>>(`/api/clients?realtorId=${values.realtorId}`)
      .then((response) => setClients(response.data.data))
      .catch(() => setClients([]));
    apiClient
      .get<ApiResponse<Property[]>>(`/api/properties?realtorId=${values.realtorId}`)
      .then((response) => setPropertyListings(response.data.data))
      .catch(() => setPropertyListings([]));
    apiClient
      .get<ApiResponse<Land[]>>(`/api/lands?realtorId=${values.realtorId}`)
      .then((response) => setLandListings(response.data.data))
      .catch(() => setLandListings([]));
  }, [values.realtorId]);

  // Clears clientId/listingId (and the price/commission auto-filled from that listing) only on a
  // REAL realtor change (not the initial mount value, whether that's "" for create or a real id
  // for edit) — same reasoning ViewingForm's listingType clear uses, guarded here with a ref
  // since this fires from an effect rather than a direct handler.
  const isFirstRealtorRender = useRef(true);
  useEffect(() => {
    if (isFirstRealtorRender.current) {
      isFirstRealtorRender.current = false;
      return;
    }
    setValues((prev) => ({ ...prev, clientId: "", listingId: "", price: 0, buyerCommission: 0, sellerCommission: 0 }));
  }, [values.realtorId]);

  // One merged Property+Land list — the separate "Type" picker was removed (see CLAUDE.md →
  // "Transactions"): picking a listing here determines listingType implicitly, tagged onto each
  // option's label so Property and Land entries stay distinguishable in one combobox. Only
  // active/pending listings are offered — an inactive listing isn't a deal in progress, so it's
  // excluded from the picker (not from propertyListings/landListings themselves, which
  // handleListingSelect still searches in full for edit-mode's already-saved listingId).
  const listingOptions = [
    ...propertyListings
      .filter((listing) => listing.status === "active" || listing.status === "pending")
      .map((listing) => ({
        value: listing.id,
        label: `${listingLabel(listing, "Property", propertyCategories, floorLevels, landCategories)} (${t("transactions.listingType.Property")})`,
      })),
    ...landListings
      .filter((listing) => listing.status === "active" || listing.status === "pending")
      .map((listing) => ({
        value: listing.id,
        label: `${listingLabel(listing, "Land", propertyCategories, floorLevels, landCategories)} (${t("transactions.listingType.Land")})`,
      })),
  ];

  const selectedClient = values.clientId ? clients.find((client) => client.id === values.clientId) : undefined;

  // Reads the selected listing's price, type, owning client (Property/Land.clientId — the
  // transaction's client is no longer picked by hand, it's read off the listing, see CLAUDE.md →
  // "Transactions"), and action — derived from the listing's own `transactionType` ("rent" stays
  // "rent", "sale" becomes "buy", matching Transaction.action's own "rent"/"buy" vocabulary, see
  // CLAUDE.md → "Transactions"). action/clientId are no longer user-editable but are still saved
  // on the transaction (for the Action column/filtering and the client relationship), just derived
  // instead of picked. Then, when the current realtor has a rate for that action, auto-fills
  // commission from it (price × rate) — a listing with no matching rate leaves commission as-is
  // for manual entry.
  const handleListingSelect = (listingId: string) => {
    const propertyMatch = propertyListings.find((listing) => listing.id === listingId);
    const listing = propertyMatch ?? landListings.find((option) => option.id === listingId);
    const listingType: TransactionFormValues["listingType"] = propertyMatch ? "Property" : "Land";
    setValues((prev) => {
      if (!listing) return { ...prev, listingId };
      const action: TransactionFormValues["action"] = listing.transactionType === "rent" ? "rent" : "buy";
      const buyerCommission = computeCommission(listing.price, action, selectedRealtor);
      return {
        ...prev,
        listingId,
        listingType,
        action,
        price: listing.price,
        buyerCommission: buyerCommission ?? prev.buyerCommission,
        clientId: listing.clientId ?? "",
      };
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // SearchableSelect isn't a native form control, so the browser's own `required` validation
    // can't reach it — this is the manual equivalent, same field the API itself also validates.
    let hasError = false;
    if (!values.listingId) {
      setListingError(t("transactions.form.listingRequired"));
      hasError = true;
    } else {
      setListingError(null);
    }
    if (values.listingId && !values.clientId) {
      setClientError(t("transactions.form.clientMissing"));
      hasError = true;
    } else {
      setClientError(null);
    }
    if (hasError) return;
    onSubmit({
      realtorId: values.realtorId,
      clientId: values.clientId,
      date: values.date,
      listingType: values.listingType,
      listingId: values.listingId,
      action: values.action,
      price: values.price,
      buyerCommission: values.buyerCommission,
      sellerCommission: values.sellerCommission,
      tax: values.tax,
      comment: values.comment,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      {isRoot && (
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="tx-realtorId">
            {t("transactions.form.realtor")}
          </label>
          <select
            id="tx-realtorId"
            required
            className={sharedStyles.input}
            value={values.realtorId}
            onChange={(event) => setValues((prev) => ({ ...prev, realtorId: event.target.value }))}
          >
            <option value="">{t("transactions.form.realtorPlaceholder")}</option>
            {realtors.map((realtor) => (
              <option key={realtor.id} value={realtor.id}>
                {realtor.firstName} {realtor.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="tx-listing">
          {t("transactions.form.listing")}
        </label>
        <SearchableSelect
          id="tx-listing"
          disabled={!values.realtorId}
          value={values.listingId}
          onChange={handleListingSelect}
          placeholder={t("common.selectPlaceholder")}
          options={listingOptions}
        />
        {listingError && <p className={sharedStyles.errorText}>{listingError}</p>}
      </div>

      <div className={sharedStyles.field}>
        <span className={sharedStyles.label}>{t("transactions.form.client")}</span>
        <p className={sharedStyles.input}>
          {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : "—"}
        </p>
        {clientError && <p className={sharedStyles.errorText}>{clientError}</p>}
      </div>

      <div className={sharedStyles.formGrid}>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="tx-date">
            {t("transactions.form.date")}
          </label>
          <input
            id="tx-date"
            type="date"
            required
            className={sharedStyles.input}
            value={values.date}
            onChange={(event) => setValues((prev) => ({ ...prev, date: event.target.value }))}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="tx-price">
            {t("transactions.form.price")}
          </label>
          <input
            id="tx-price"
            type="number"
            min="0"
            step="0.01"
            required
            className={sharedStyles.input}
            value={values.price}
            onChange={(event) => setValues((prev) => ({ ...prev, price: Number(event.target.value) }))}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="tx-buyerCommission">
            {t("transactions.form.buyerCommission")}
          </label>
          <input
            id="tx-buyerCommission"
            type="number"
            min="0"
            step="0.01"
            className={sharedStyles.input}
            value={values.buyerCommission}
            onChange={(event) => setValues((prev) => ({ ...prev, buyerCommission: Number(event.target.value) }))}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="tx-sellerCommission">
            {t("transactions.form.sellerCommission")}
          </label>
          <input
            id="tx-sellerCommission"
            type="number"
            min="0"
            step="0.01"
            className={sharedStyles.input}
            value={values.sellerCommission}
            onChange={(event) => setValues((prev) => ({ ...prev, sellerCommission: Number(event.target.value) }))}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="tx-tax">
            {t("transactions.form.tax")}
          </label>
          <input
            id="tx-tax"
            type="number"
            min="0"
            step="0.01"
            className={sharedStyles.input}
            value={values.tax}
            onChange={(event) => setValues((prev) => ({ ...prev, tax: Number(event.target.value) }))}
          />
        </div>
      </div>

      <div className={sharedStyles.field}>
        <label className={sharedStyles.label} htmlFor="tx-comment">
          {t("transactions.form.comment")}
        </label>
        <textarea
          id="tx-comment"
          rows={3}
          className={sharedStyles.input}
          value={values.comment}
          onChange={(event) => setValues((prev) => ({ ...prev, comment: event.target.value }))}
        />
      </div>

      <div className={sharedStyles.formActions}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
