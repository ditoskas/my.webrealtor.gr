import type { ReactNode } from "react";
import styles from "@/styles/shared.module.scss";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className={styles.cardHeader}>{children}</div>;
}
