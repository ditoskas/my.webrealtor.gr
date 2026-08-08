import { Search } from "lucide-react";
import { Card } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
// Same grid/search-input layout as PropertySearchBar — reused directly rather than colocating a
// near-duplicate stylesheet, since there's nothing feature-specific to differentiate (same reasoning
// SignupPage reuses LoginPage.module.scss, see CLAUDE.md → Registration).
import styles from "../properties/PropertySearchBar.module.scss";

interface LandSearchBarProps {
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
}

export default function LandSearchBar({
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  location,
  onLocationChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
}: LandSearchBarProps) {
  const t = useTranslation();

  return (
    <Card className={styles.card}>
      <div className={styles.grid}>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="landSearchType">
            {t("land.search.type")}
          </label>
          <select
            id="landSearchType"
            className={sharedStyles.input}
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value)}
          >
            <option value="">{t("land.search.typeAll")}</option>
            <option value="sale">{t("land.table.forSale")}</option>
            <option value="rent">{t("land.table.forRent")}</option>
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="landSearchStatus">
            {t("land.search.status")}
          </label>
          <select
            id="landSearchStatus"
            className={sharedStyles.input}
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            <option value="">{t("land.search.statusAll")}</option>
            <option value="active">{t("land.status.active")}</option>
            <option value="pending">{t("land.status.pending")}</option>
            <option value="inactive">{t("land.status.inactive")}</option>
          </select>
        </div>

        <div className={`${sharedStyles.field} ${styles.searchField}`}>
          <label className={sharedStyles.label} htmlFor="landSearchLocation">
            {t("land.search.location")}
          </label>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              id="landSearchLocation"
              type="text"
              placeholder={t("land.search.locationPlaceholder")}
              className={`${sharedStyles.input} ${styles.searchInput}`}
              value={location}
              onChange={(event) => onLocationChange(event.target.value)}
            />
          </div>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="landSearchMinPrice">
            {t("land.search.minPrice")}
          </label>
          <input
            id="landSearchMinPrice"
            type="number"
            className={sharedStyles.input}
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="landSearchMaxPrice">
            {t("land.search.maxPrice")}
          </label>
          <input
            id="landSearchMaxPrice"
            type="number"
            className={sharedStyles.input}
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
