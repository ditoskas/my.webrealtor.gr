import { useTranslation } from "@/store/hooks";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./PropertyDetail.module.scss";

// Small reusable renderers for PropertyDetail's ~90 fields — written once here instead of repeating
// the same label/input JSX shape 90 times inline (see CLAUDE.md → Styling: "a utility combination
// used twice or more must become a named class/component", the same reasoning scaled up).

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
