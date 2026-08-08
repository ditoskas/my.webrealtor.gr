"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Dropdown.module.scss";

interface DropdownProps {
  trigger: ReactNode;
  triggerClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  // Render-prop so callers can close the menu themselves after handling an item click
  // (e.g. sign out, or picking a language) instead of the menu staying open mid-action.
  children: (close: () => void) => ReactNode;
}

export default function Dropdown({
  trigger,
  triggerClassName,
  menuClassName,
  align = "right",
  children,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.dropdown} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${triggerClassName ?? ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`${styles.menu} ${align === "left" ? styles.menuLeft : styles.menuRight} ${menuClassName ?? ""}`}
          role="menu"
        >
          {children(() => setIsOpen(false))}
        </div>
      )}
    </div>
  );
}
