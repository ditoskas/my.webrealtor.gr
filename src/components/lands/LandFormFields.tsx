import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./LandDetail.module.scss";

// Small reusable renderers for LandDetail's fields — same rationale as PropertyFormFields (see
// CLAUDE.md → Styling: "a utility combination used twice or more must become a named
// class/component"). Colocated here rather than shared with properties/ since each feature folder
// owns its full vertical slice per the component convention — not worth a cross-feature extraction
// for two consumers.

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
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function SectionHeading({ children }: { children: string }) {
  return <h3 className={styles.sectionHeading}>{children}</h3>;
}
