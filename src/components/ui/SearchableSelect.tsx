"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/store/hooks";
import styles from "./SearchableSelect.module.scss";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// A type-to-filter dropdown — a plain <select> has no search, and native <datalist> can't map a
// typed label back to an id safely once two options share text. Built as a generic ui/ primitive
// (not colocated under viewings/) since "pick one from a long list by typing" is a reusable need,
// not specific to Viewings' Property/Land picker.
export default function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled = false,
}: SearchableSelectProps) {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const filtered = query.trim()
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className={`${styles.wrapper} ${className ?? ""}`}>
      <div className={styles.control}>
        <input
          id={id}
          type="text"
          disabled={disabled}
          className={styles.input}
          value={isOpen ? query : (selectedOption?.label ?? "")}
          placeholder={placeholder}
          onFocus={() => {
            if (disabled) return;
            setIsOpen(true);
            setQuery("");
          }}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ChevronDown size={14} className={styles.chevron} />
      </div>
      {isOpen && (
        <ul className={styles.menu} role="listbox">
          {filtered.length === 0 ? (
            <li className={styles.empty}>{t("common.noMatches")}</li>
          ) : (
            filtered.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`${styles.option} ${option.value === value ? styles.optionActive : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
