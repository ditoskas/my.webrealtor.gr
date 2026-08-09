"use client";

import { useState, type ReactElement } from "react";
import { Card } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./SettingsPage.module.scss";
import SettingsSidebar, { type SettingsSection } from "./SettingsSidebar";
import RealtorsPage from "@/components/realtors/RealtorsPage";
import LogsPage from "@/components/logs/LogsPage";
import UsersPage from "@/components/users/UsersPage";
import EnergyClassSection from "./energyClass/EnergyClassSection";
import HeatingSystemSection from "./heatingSystem/HeatingSystemSection";
import PropertyCategorySection from "./propertyCategory/PropertyCategorySection";
import FloorLevelSection from "./floorLevel/FloorLevelSection";
import BuildingFloorsSection from "./buildingFloors/BuildingFloorsSection";
import HeatingMediumSection from "./heatingMedium/HeatingMediumSection";
import JoineryTypeSection from "./joineryType/JoineryTypeSection";
import GlassTypeSection from "./glassType/GlassTypeSection";
import FloorTypeSection from "./floorType/FloorTypeSection";
import GardenTypeSection from "./gardenType/GardenTypeSection";
import ZoningTypeSection from "./zoningType/ZoningTypeSection";
import OrientationSection from "./orientation/OrientationSection";
import RoadAccessTypeSection from "./roadAccessType/RoadAccessTypeSection";
import LandCategorySection from "./landCategory/LandCategorySection";
import SlopeSection from "./slope/SlopeSection";

const SECTION_COMPONENTS: Partial<Record<SettingsSection, () => ReactElement>> = {
  realtors: RealtorsPage,
  logs: LogsPage,
  users: UsersPage,
  energyClass: EnergyClassSection,
  heating: HeatingSystemSection,
  propertyCategory: PropertyCategorySection,
  floorLevel: FloorLevelSection,
  buildingFloors: BuildingFloorsSection,
  heatingMedium: HeatingMediumSection,
  joineryType: JoineryTypeSection,
  glassType: GlassTypeSection,
  floorType: FloorTypeSection,
  gardenType: GardenTypeSection,
  zoningType: ZoningTypeSection,
  orientation: OrientationSection,
  roadAccessType: RoadAccessTypeSection,
  landCategory: LandCategorySection,
  slope: SlopeSection,
};

export default function SettingsPage() {
  const t = useTranslation();
  const [active, setActive] = useState<SettingsSection>("realtors");
  const ActiveSection = SECTION_COMPONENTS[active];

  return (
    <div>
      <div className={sharedStyles.pageHeaderSimple}>
        <div>
          <h2 className={sharedStyles.pageTitle}>{t("settings.pageTitle")}</h2>
          <p className={sharedStyles.pageSubtitle}>{t("settings.pageSubtitle")}</p>
        </div>
      </div>

      <div className={styles.layout}>
        <SettingsSidebar active={active} onSelect={setActive} />

        <div className={styles.content}>
          {ActiveSection ? (
            <ActiveSection />
          ) : (
            <Card className="p-10 text-center">
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">{t("settings.propertyOptionsLabel")}</h3>
              <p className="text-sm text-neutral-500">{t("settings.propertyOptionsDescription")}</p>
              <p className="text-xs text-neutral-400 mt-4">{t("settings.comingSoon")}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
