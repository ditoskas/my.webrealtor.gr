import type { ReactNode } from "react";
import styles from "@/styles/shared.module.scss";

type BadgeVariant = "active" | "pending" | "inactive" | "danger";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  active: styles.badgeActive,
  pending: styles.badgePending,
  inactive: styles.badgeInactive,
  danger: styles.badgeDanger,
};

export default function Badge({ variant = "inactive", children }: { variant?: BadgeVariant; children: ReactNode }) {
  return <span className={`${styles.badge} ${VARIANT_CLASS[variant]}`}>{children}</span>;
}
