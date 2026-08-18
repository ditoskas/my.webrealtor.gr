import {
  Contact,
  ScrollText,
  MessagesSquare,
  UserRound,
  Flame,
  Zap,
  SlidersHorizontal,
  Building2,
  Layers,
  Building,
  Thermometer,
  DoorOpen,
  PanelTop,
  SquareStack,
  Trees,
  MapPinned,
  Compass,
  Route,
  LandPlot,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import styles from "./SettingsPage.module.scss";

export type SettingsSection =
  | "realtors"
  | "logs"
  | "messages"
  | "users"
  | "heating"
  | "energyClass"
  | "propertyOptions"
  | "propertyCategory"
  | "floorLevel"
  | "buildingFloors"
  | "heatingMedium"
  | "joineryType"
  | "glassType"
  | "floorType"
  | "gardenType"
  | "zoningType"
  | "orientation"
  | "roadAccessType"
  | "landCategory"
  | "slope";

const SECTIONS: { id: SettingsSection; labelKey: string; icon: typeof Flame }[] = [
  // Moved here from the Topbar's main nav — see CLAUDE.md → "Settings-embedded Realtors and Logs".
  { id: "realtors", labelKey: "nav.realtors", icon: Contact },
  { id: "logs", labelKey: "nav.logs", icon: ScrollText },
  // Messages was realtor-scoped and reachable by every role from the main nav; now Root-only,
  // same reasoning as Realtors/Logs above — see CLAUDE.md → "Messages".
  { id: "messages", labelKey: "nav.messages", icon: MessagesSquare },
  { id: "users", labelKey: "nav.users", icon: UserRound },
  { id: "heating", labelKey: "settings.heatingTabLabel", icon: Flame },
  { id: "energyClass", labelKey: "settingsEntities.energyClass", icon: Zap },
  { id: "propertyOptions", labelKey: "settings.propertyOptionsLabel", icon: SlidersHorizontal },
  { id: "propertyCategory", labelKey: "settingsEntities.propertyCategory", icon: Building2 },
  { id: "floorLevel", labelKey: "settingsEntities.floorLevel", icon: Layers },
  { id: "buildingFloors", labelKey: "settingsEntities.buildingFloors", icon: Building },
  { id: "heatingMedium", labelKey: "settingsEntities.heatingMedium", icon: Thermometer },
  { id: "joineryType", labelKey: "settingsEntities.joineryType", icon: DoorOpen },
  { id: "glassType", labelKey: "settingsEntities.glassType", icon: PanelTop },
  { id: "floorType", labelKey: "settingsEntities.floorType", icon: SquareStack },
  { id: "gardenType", labelKey: "settingsEntities.gardenType", icon: Trees },
  { id: "zoningType", labelKey: "settingsEntities.zoningType", icon: MapPinned },
  { id: "orientation", labelKey: "settingsEntities.orientation", icon: Compass },
  { id: "roadAccessType", labelKey: "settingsEntities.roadAccessType", icon: Route },
  { id: "landCategory", labelKey: "settingsEntities.landCategory", icon: LandPlot },
  { id: "slope", labelKey: "settingsEntities.slope", icon: TrendingUp },
];

interface SettingsSidebarProps {
  active: SettingsSection;
  onSelect: (section: SettingsSection) => void;
}

export default function SettingsSidebar({ active, onSelect }: SettingsSidebarProps) {
  const t = useTranslation();
  return (
    <Card className={styles.sidebar}>
      <nav className={styles.sidebarNav}>
        {SECTIONS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`${styles.sidebarLink} ${active === id ? styles.sidebarLinkActive : ""}`}
            onClick={() => onSelect(id)}
          >
            <Icon size={14} />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </nav>
    </Card>
  );
}
