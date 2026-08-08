import { Search } from "lucide-react";
import { Card } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./PropertySearchBar.module.scss";

interface PoolOption {
  id: string;
  name: string;
}

interface PropertySearchBarProps {
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  categories: PoolOption[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
}

export default function PropertySearchBar({
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  searchText,
  onSearchTextChange,
}: PropertySearchBarProps) {
  const t = useTranslation();

  return (
    <Card className={styles.card}>
      <div className={styles.grid}>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="propertySearchType">
            {t("properties.search.type")}
          </label>
          <select
            id="propertySearchType"
            className={sharedStyles.input}
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value)}
          >
            <option value="">{t("properties.search.typeAll")}</option>
            <option value="sale">{t("properties.table.forSale")}</option>
            <option value="rent">{t("properties.table.forRent")}</option>
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="propertySearchStatus">
            {t("properties.search.status")}
          </label>
          <select
            id="propertySearchStatus"
            className={sharedStyles.input}
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            <option value="">{t("properties.search.statusAll")}</option>
            <option value="active">{t("properties.status.active")}</option>
            <option value="pending">{t("properties.status.pending")}</option>
            <option value="inactive">{t("properties.status.inactive")}</option>
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="propertySearchCategory">
            {t("properties.search.category")}
          </label>
          <select
            id="propertySearchCategory"
            className={sharedStyles.input}
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
          >
            <option value="">{t("properties.search.categoryAll")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="propertySearchMinPrice">
            {t("properties.search.minPrice")}
          </label>
          <input
            id="propertySearchMinPrice"
            type="number"
            className={sharedStyles.input}
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="propertySearchMaxPrice">
            {t("properties.search.maxPrice")}
          </label>
          <input
            id="propertySearchMaxPrice"
            type="number"
            className={sharedStyles.input}
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
          />
        </div>

        <div className={`${sharedStyles.field} ${styles.searchField}`}>
          <label className={sharedStyles.label} htmlFor="propertySearchText">
            {t("properties.search.text")}
          </label>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              id="propertySearchText"
              type="text"
              placeholder={t("properties.search.textPlaceholder")}
              className={`${sharedStyles.input} ${styles.searchInput}`}
              value={searchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
