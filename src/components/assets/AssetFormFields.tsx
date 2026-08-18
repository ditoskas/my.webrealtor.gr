import { Building2, Trees } from "lucide-react";
import { useTranslation } from "@/store/hooks";
import type { Tag } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./AssetDetail.module.scss";

// Small reusable renderers for AssetDetail's fields — merges the old, byte-identical
// PropertyFormFields.tsx/LandFormFields.tsx into one (see CLAUDE.md → "Asset management"). Same
// rationale as those two: CLAUDE.md → Styling, "a utility combination used twice or more must
// become a named class/component".

interface PoolOption {
  id: string;
  name: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: PoolOption[];
  required?: boolean;
}) {
  const t = useTranslation();
  return (
    <div className={sharedStyles.field}>
      <label className={sharedStyles.label} htmlFor={id}>
        {label}
        {required ? "*" : ""}
      </label>
      <select
        id={id}
        required={required}
        className={sharedStyles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t("common.selectPlaceholder")}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date" | "email" | "url";
  required?: boolean;
}) {
  return (
    <div className={sharedStyles.field}>
      <label className={sharedStyles.label} htmlFor={id}>
        {label}
        {required ? "*" : ""}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        className={sharedStyles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function BoolField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className={styles.checkboxField}>
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function SectionHeading({ children }: { children: string }) {
  return <h3 className={styles.sectionHeading}>{children}</h3>;
}

// Multi-select chip toggle for the realtor's own Tags (see CLAUDE.md → "Tags") — managed from
// Profile, not here; this only assigns/unassigns already-existing tags to the asset being edited.
// Empty state (no tags yet) just shows a hint pointing at Profile rather than an empty box.
export function TagsField({
  tags,
  selectedIds,
  onChange,
}: {
  tags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const t = useTranslation();
  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((tagId) => tagId !== id) : [...selectedIds, id]);
  };
  return (
    <div className={sharedStyles.field}>
      <span className={sharedStyles.label}>{t("assets.detail.tags")}</span>
      {tags.length === 0 ? (
        <p className="text-xs text-neutral-400">{t("assets.detail.tagsEmpty")}</p>
      ) : (
        <div className={styles.tagToggleGrid}>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`${styles.tagToggle} ${selectedIds.includes(tag.id) ? styles.tagToggleActive : ""}`}
              onClick={() => toggle(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Create-only Type selector — locked (non-interactive) once `locked` is true, i.e. on every edit
// (an asset's type is fixed after creation, see CLAUDE.md → "Asset management").
export function TypeField({
  isLand,
  onChange,
  locked,
}: {
  isLand: boolean;
  onChange: (isLand: boolean) => void;
  locked: boolean;
}) {
  const t = useTranslation();
  return (
    <div className={sharedStyles.field}>
      <span className={sharedStyles.label}>{t("assets.detail.type")}*</span>
      <div className={styles.typeGrid}>
        <button
          type="button"
          disabled={locked}
          className={[styles.typeOption, !isLand ? styles.typeOptionActive : "", locked ? styles.typeOptionDisabled : ""].join(" ")}
          onClick={() => onChange(false)}
        >
          <Building2 size={16} />
          <span>{t("assets.detail.typeProperty")}</span>
        </button>
        <button
          type="button"
          disabled={locked}
          className={[styles.typeOption, isLand ? styles.typeOptionActive : "", locked ? styles.typeOptionDisabled : ""].join(" ")}
          onClick={() => onChange(true)}
        >
          <Trees size={16} />
          <span>{t("assets.detail.typeLand")}</span>
        </button>
      </div>
    </div>
  );
}
