import { Search } from "lucide-react";
import { Card } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import type { Tag } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./AssetSearchBar.module.scss";

interface PoolOption {
  id: string;
  name: string;
}

interface AssetSearchBarProps {
  kindFilter: string;
  onKindFilterChange: (value: string) => void;
  transactionTypeFilter: string;
  onTransactionTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  propertyCategories: PoolOption[];
  landCategories: PoolOption[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  // The realtor's own Tags (see CLAUDE.md → "Tags") — matches an asset carrying *any* of the
  // selected tags (OR, not AND), the more common "filter by tags" convention.
  tags: Tag[];
  tagFilter: string[];
  onTagFilterChange: (ids: string[]) => void;
}

// Merges the old PropertySearchBar + LandSearchBar into one — see CLAUDE.md → "Asset management".
// Adds a Kind filter (Property/Land/All); the Category filter swaps its option pool based on Kind
// and is hidden when Kind is "All" (a single dropdown can't meaningfully mix two different pools).
export default function AssetSearchBar({
  kindFilter,
  onKindFilterChange,
  transactionTypeFilter,
  onTransactionTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  propertyCategories,
  landCategories,
  categoryFilter,
  onCategoryFilterChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  searchText,
  onSearchTextChange,
  tags,
  tagFilter,
  onTagFilterChange,
}: AssetSearchBarProps) {
  const t = useTranslation();
  const categoryOptions = kindFilter === "land" ? landCategories : propertyCategories;

  const toggleTag = (id: string) => {
    onTagFilterChange(tagFilter.includes(id) ? tagFilter.filter((tagId) => tagId !== id) : [...tagFilter, id]);
  };

  return (
    <Card className={styles.card}>
      <div className={styles.grid}>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="assetSearchKind">
            {t("assets.search.kind")}
          </label>
          <select
            id="assetSearchKind"
            className={sharedStyles.input}
            value={kindFilter}
            onChange={(event) => {
              onKindFilterChange(event.target.value);
              onCategoryFilterChange("");
            }}
          >
            <option value="">{t("assets.search.kindAll")}</option>
            <option value="property">{t("assets.kind.property")}</option>
            <option value="land">{t("assets.kind.land")}</option>
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="assetSearchType">
            {t("assets.search.type")}
          </label>
          <select
            id="assetSearchType"
            className={sharedStyles.input}
            value={transactionTypeFilter}
            onChange={(event) => onTransactionTypeFilterChange(event.target.value)}
          >
            <option value="">{t("assets.search.typeAll")}</option>
            <option value="sale">{t("assets.table.forSale")}</option>
            <option value="rent">{t("assets.table.forRent")}</option>
          </select>
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="assetSearchStatus">
            {t("assets.search.status")}
          </label>
          <select
            id="assetSearchStatus"
            className={sharedStyles.input}
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            <option value="">{t("assets.search.statusAll")}</option>
            <option value="active">{t("assets.status.active")}</option>
            <option value="pending">{t("assets.status.pending")}</option>
            <option value="inactive">{t("assets.status.inactive")}</option>
          </select>
        </div>

        {kindFilter && (
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label} htmlFor="assetSearchCategory">
              {t("assets.search.category")}
            </label>
            <select
              id="assetSearchCategory"
              className={sharedStyles.input}
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
            >
              <option value="">{t("assets.search.categoryAll")}</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="assetSearchMinPrice">
            {t("assets.search.minPrice")}
          </label>
          <input
            id="assetSearchMinPrice"
            type="number"
            className={sharedStyles.input}
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
          />
        </div>

        <div className={sharedStyles.field}>
          <label className={sharedStyles.label} htmlFor="assetSearchMaxPrice">
            {t("assets.search.maxPrice")}
          </label>
          <input
            id="assetSearchMaxPrice"
            type="number"
            className={sharedStyles.input}
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
          />
        </div>

        <div className={`${sharedStyles.field} ${styles.searchField}`}>
          <label className={sharedStyles.label} htmlFor="assetSearchText">
            {t("assets.search.text")}
          </label>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              id="assetSearchText"
              type="text"
              placeholder={t("assets.search.textPlaceholder")}
              className={`${sharedStyles.input} ${styles.searchInput}`}
              value={searchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      {tags.length > 0 && (
        <div className={styles.tagRow}>
          <span className={sharedStyles.label}>{t("assets.search.tags")}</span>
          <div className={styles.tagToggleGrid}>
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`${styles.tagToggle} ${tagFilter.includes(tag.id) ? styles.tagToggleActive : ""}`}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
