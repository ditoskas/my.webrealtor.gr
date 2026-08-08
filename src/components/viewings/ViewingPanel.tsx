"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { useCanEdit, useCurrentUser, useTranslation } from "@/store/hooks";
import type {
  ApiResponse,
  Attachment,
  FloorLevel,
  Land,
  LandCategory,
  Property,
  PropertyCategory,
  Viewing,
} from "@/lib/types";
import ViewingTable from "./ViewingTable";
import AddViewingModal from "./AddViewingModal";
import EditViewingModal from "./EditViewingModal";
import DeleteViewingModal from "./DeleteViewingModal";

interface ViewingPanelProps {
  clientId: string;
  realtorId: string;
}

// The actual Viewings UI (fetch + table + add/edit/delete modals) — embedded as the third tab of
// EntityDetailTabs, Client only. Property/Land options are scoped by realtor — see CLAUDE.md →
// "Data scoping by realtor" (CRITICAL): a non-Root caller must only ever see their OWN realtor's
// data, so the effective realtorId here is the logged-in user's own realtorId, never the `realtorId`
// prop (the client's realtor, which the caller could in principle not belong to at all — the client
// object is fetched by id with no ownership check yet, see that section). Root has no realtorId of
// its own, so it falls back to the client's realtor — still one specific realtor's listings, not
// every realtor's, which is what makes sense while looking at one client's page.
export default function ViewingPanel({ clientId, realtorId }: ViewingPanelProps) {
  const t = useTranslation();
  const canEdit = useCanEdit();
  const user = useCurrentUser();
  const effectiveRealtorId = user?.role === "Root" ? realtorId : (user?.realtorId ?? undefined);

  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [propertyListings, setPropertyListings] = useState<Property[]>([]);
  const [landListings, setLandListings] = useState<Land[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [floorLevels, setFloorLevels] = useState<FloorLevel[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingToEdit, setViewingToEdit] = useState<Viewing | null>(null);
  const [viewingToDelete, setViewingToDelete] = useState<Viewing | null>(null);

  useEffect(() => {
    if (!effectiveRealtorId) return;
    apiClient
      .get<ApiResponse<Property[]>>(`/api/properties?realtorId=${effectiveRealtorId}`)
      .then((response) => setPropertyListings(response.data.data))
      .catch(() => setPropertyListings([]));
    apiClient
      .get<ApiResponse<Land[]>>(`/api/lands?realtorId=${effectiveRealtorId}`)
      .then((response) => setLandListings(response.data.data))
      .catch(() => setLandListings([]));
  }, [effectiveRealtorId]);

  // Category/Floor pool entities — used only to build a richer label per listing option in
  // ViewingForm's picker (Category · Floor · Address), same lookups PropertyDetail's own
  // dropdowns already fetch.
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

  const loadAttachments = useCallback(() => {
    if (!clientId) return;
    apiClient
      .get<ApiResponse<Attachment[]>>(`/api/attachments?entityType=Client&entityId=${clientId}`)
      .then((response) => setAttachments(response.data.data))
      .catch(() => setAttachments([]));
  }, [clientId]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const loadViewings = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<Viewing[]>>(`/api/clients/${clientId}/viewings`);
      setViewings(response.data.data);
      setError(null);
    } catch {
      setError(t("viewings.loadError"));
    } finally {
      setLoading(false);
    }
  }, [clientId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / entity-change, see NotesPanel for the general pattern
    loadViewings();
  }, [loadViewings]);

  const handleAttachmentUploaded = (attachment: Attachment) => {
    setAttachments((prev) => [attachment, ...prev]);
  };

  return (
    <div>
      {error && <p className="text-sm text-rose-500 mb-2">{error}</p>}

      {canEdit && (
        <Button variant="outline" className="mb-4" onClick={() => setIsAddOpen(true)}>
          <Plus size={14} />
          <span>{t("viewings.addButton")}</span>
        </Button>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("viewings.loading")}</p>
      ) : (
        <ViewingTable
          viewings={viewings}
          propertyListings={propertyListings}
          landListings={landListings}
          propertyCategories={propertyCategories}
          floorLevels={floorLevels}
          landCategories={landCategories}
          attachments={attachments}
          onEdit={setViewingToEdit}
          onDelete={setViewingToDelete}
        />
      )}

      <AddViewingModal
        isOpen={isAddOpen}
        clientId={clientId}
        propertyListings={propertyListings}
        landListings={landListings}
        propertyCategories={propertyCategories}
        floorLevels={floorLevels}
        landCategories={landCategories}
        attachments={attachments}
        onAttachmentUploaded={handleAttachmentUploaded}
        onClose={() => setIsAddOpen(false)}
        onSaved={loadViewings}
      />
      <EditViewingModal
        isOpen={!!viewingToEdit}
        clientId={clientId}
        viewing={viewingToEdit}
        propertyListings={propertyListings}
        landListings={landListings}
        propertyCategories={propertyCategories}
        floorLevels={floorLevels}
        landCategories={landCategories}
        attachments={attachments}
        onAttachmentUploaded={handleAttachmentUploaded}
        onClose={() => setViewingToEdit(null)}
        onSaved={loadViewings}
      />
      <DeleteViewingModal
        isOpen={!!viewingToDelete}
        clientId={clientId}
        viewing={viewingToDelete}
        onClose={() => setViewingToDelete(null)}
        onDeleted={loadViewings}
      />
    </div>
  );
}
