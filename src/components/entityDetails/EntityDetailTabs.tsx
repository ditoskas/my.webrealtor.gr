"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import type { AttachableEntityType } from "@/lib/types";
import NotesPanel from "@/components/notes/NotesPanel";
import FilesPanel from "@/components/files/FilesPanel";
import InterestForPanel from "@/components/interestFor/InterestForPanel";
import OwnsPanel from "@/components/owns/OwnsPanel";
import ViewingPanel from "@/components/viewings/ViewingPanel";

type DetailTab = "owns" | "interestFor" | "viewings" | "notes" | "files";

interface EntityDetailTabsProps {
  entityType: AttachableEntityType;
  entityId: string;
  // Only used by the Viewings tab (Client only), to scope its Property/Land pickers to the
  // client's own realtor — see CLAUDE.md → "Viewings (Client)". Ignored for every other entityType.
  realtorId?: string;
}

// Notes and Files, tabbed — embedded directly as a page section on the Realtor/Client/Asset View
// Pages (inside a Card, no chrome of its own). See CLAUDE.md → "Files (Attachments)".
//
// Three more tabs — Owns, Interest For, Viewings — are added, in that order, before Notes/Files,
// only when entityType is "Client": unlike Notes/Attachments, none of them is polymorphic across
// all four entity types, all three are Client-only (see CLAUDE.md → "Owns (Client)", "Interest For
// (Client)", "Viewings (Client)"), so none belongs on the Realtor/Property/Land tab set at all.
export default function EntityDetailTabs({ entityType, entityId, realtorId }: EntityDetailTabsProps) {
  const t = useTranslation();
  const isClient = entityType === "Client";
  const [activeTab, setActiveTab] = useState<DetailTab>(isClient ? "owns" : "notes");

  const tabs = [
    ...(isClient
      ? [
          { id: "owns", label: t("owns.sectionTitle") },
          { id: "interestFor", label: t("interestFor.sectionTitle") },
          { id: "viewings", label: t("viewings.sectionTitle") },
        ]
      : []),
    { id: "notes", label: t("notes.sectionTitle") },
    { id: "files", label: t("files.sectionTitle") },
  ];

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as DetailTab)} />
      {activeTab === "owns" && isClient && <OwnsPanel clientId={entityId} />}
      {activeTab === "interestFor" && isClient && <InterestForPanel clientId={entityId} />}
      {activeTab === "viewings" && isClient && realtorId && (
        <ViewingPanel clientId={entityId} realtorId={realtorId} />
      )}
      {activeTab === "notes" && <NotesPanel entityType={entityType} entityId={entityId} />}
      {activeTab === "files" && <FilesPanel entityType={entityType} entityId={entityId} />}
    </div>
  );
}
