"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Home, Settings, Handshake, LogOut, ChevronDown, Languages, Check, UserCircle, Wrench, Receipt, FileSignature, ClipboardList,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Dropdown } from "@/components/ui";
import { useAppDispatch, useAppSelector, useLocale, useTranslation } from "@/store/hooks";
import { clearUser } from "@/store/authSlice";
import { setLocale } from "@/store/localeSlice";
import { LOCALE_OPTIONS } from "@/lib/i18n/locales";
import { getDisplayName } from "@/lib/displayName";
import type { UserRole } from "@/lib/types";
import logo from "@/assets/img/webrealtor-logo.png";
import styles from "./Topbar.module.scss";
import dropdownStyles from "@/components/ui/Dropdown.module.scss";

// Realtors, Logs, and Messages were dropped from here and moved into Settings' own sidebar
// instead — see CLAUDE.md → "Settings-embedded Realtors and Logs". Realtors/Logs were already
// Root-only (see ROOT_ONLY_PREFIXES in proxy.ts), same as Settings itself; Messages used to be
// realtor-scoped and reachable by every role, now Root-only too, so nothing else about
// Realtors'/Logs' access changed but Messages' access did — only where all three are reached
// from is new.
//
// Rendered in two groups, not one flat map, because the "Tools" dropdown is interspersed between
// these rather than trailing them — see the nav markup below.
const NAV_LINKS_BEFORE_TOOLS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/clients", labelKey: "nav.clients", icon: Users },
  // Properties and Land were merged into one Asset entity/page — see CLAUDE.md → "Asset
  // management". One top-level link now, replacing the old "Listing" dropdown that grouped two.
  { href: "/assets", labelKey: "nav.assets", icon: Home },
  { href: "/transactions", labelKey: "nav.transactions", icon: Handshake },
];
const NAV_LINKS_AFTER_TOOLS = [{ href: "/settings", labelKey: "nav.settings", icon: Settings }];

// Root reaches every section; Administrator/Operator are restricted to these — mirrors
// proxy.ts's ROOT_ONLY_PREFIXES (kept in sync by hand, see CLAUDE.md → Auth). Transactions is
// deliberately accessible here, same level as Clients/Assets — see CLAUDE.md → "Transactions".
// Messages moved into Settings' own sidebar and is Root-only now — see CLAUDE.md → "Messages".
const NON_ROOT_ALLOWED_HREFS = new Set([
  "/dashboard",
  "/clients",
  "/assets",
  "/transactions",
  "/tools",
]);

function isVisible(role: UserRole | undefined, href: string): boolean {
  if (!role) return false;
  if (role === "Root") return true;
  return NON_ROOT_ALLOWED_HREFS.has(href);
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const locale = useLocale();
  const t = useTranslation();

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      dispatch(clearUser());
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      // Hard navigation, not router.push — a client-side transition keeps the Redux store and
      // Next's client router cache alive across the login screen, so whatever the next person
      // logs in as can end up rendering a screen that still has the previous user's data baked
      // into it. A full reload guarantees nothing survives the session boundary.
      window.location.href = "/login";
    }
  };

  const renderLink = (link: { href: string; labelKey: string; icon: typeof LayoutDashboard }) => {
    if (!isVisible(user?.role, link.href)) return null;
    const isActive = pathname?.startsWith(link.href);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
      >
        <Icon size={14} />
        <span>{t(link.labelKey)}</span>
      </Link>
    );
  };

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.brand}>
            <Image src={logo} alt="WebRealtor" className={styles.brandLogo} priority />
          </div>

          <nav className={styles.nav}>
            {NAV_LINKS_BEFORE_TOOLS.map(renderLink)}

            {isVisible(user?.role, "/tools") && (
              <Dropdown
                align="left"
                triggerClassName={`${styles.navLink} ${styles.navDropdown} ${pathname?.startsWith("/tools") ? styles.navLinkActive : ""}`}
                trigger={
                  <>
                    <Wrench size={14} />
                    <span>{t("nav.tools")}</span>
                    <ChevronDown size={12} className={styles.navDropdownChevron} />
                  </>
                }
              >
                {(close) => (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      className={dropdownStyles.item}
                      onClick={() => {
                        close();
                        router.push("/tools/receipt");
                      }}
                    >
                      <Receipt size={14} />
                      <span>{t("receipt.menuLabel")}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={dropdownStyles.item}
                      onClick={() => {
                        close();
                        router.push("/tools/contract");
                      }}
                    >
                      <FileSignature size={14} />
                      <span>{t("contract.menuLabel")}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={dropdownStyles.item}
                      onClick={() => {
                        close();
                        router.push("/tools/order");
                      }}
                    >
                      <ClipboardList size={14} />
                      <span>{t("order.menuLabel")}</span>
                    </button>
                  </>
                )}
              </Dropdown>
            )}

            {NAV_LINKS_AFTER_TOOLS.map(renderLink)}
          </nav>
        </div>

        <div className={styles.actions}>
          <Dropdown
            align="right"
            triggerClassName={styles.langMenuTrigger}
            trigger={
              <>
                <Languages size={16} className={styles.langMenuIcon} />
                <ChevronDown size={14} className={styles.userMenuChevron} />
              </>
            }
          >
            {(close) => (
              <>
                {LOCALE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitem"
                    className={`${dropdownStyles.item} ${option.value === locale ? dropdownStyles.itemActive : ""}`}
                    onClick={() => {
                      dispatch(setLocale(option.value));
                      close();
                    }}
                  >
                    <span>{option.label}</span>
                    {option.value === locale && <Check size={14} />}
                  </button>
                ))}
              </>
            )}
          </Dropdown>

          {user && (
            <Dropdown
              align="right"
              triggerClassName={styles.userMenuTrigger}
              trigger={
                <>
                  <span className={styles.userMenuInfo}>
                    <span className={styles.userMenuEmail}>{getDisplayName(user)}</span>
                    <span className={styles.roleTag}>{user.role}</span>
                  </span>
                  <ChevronDown size={14} className={styles.userMenuChevron} />
                </>
              }
            >
              {(close) => (
                <>
                  <div className={dropdownStyles.header}>
                    <span className={styles.userMenuHeaderEmail}>{getDisplayName(user)}</span>
                    <span className={styles.userMenuHeaderRole}>{user.role}</span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className={dropdownStyles.item}
                    onClick={() => {
                      close();
                      router.push("/profile");
                    }}
                  >
                    <UserCircle size={14} />
                    <span>{t("nav.profile")}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={dropdownStyles.item}
                    onClick={() => {
                      close();
                      handleLogout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>{t("common.signOut")}</span>
                  </button>
                </>
              )}
            </Dropdown>
          )}
        </div>
      </div>
    </header>
  );
}
