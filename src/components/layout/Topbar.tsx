"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Home, LandPlot, UserRound, Settings, Handshake, LogOut, ChevronDown, Languages, Check, UserCircle,
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

// Realtors and Logs were dropped from here and moved into Settings' own sidebar instead — see
// CLAUDE.md → "Settings-embedded Realtors and Logs". Both were already Root-only (see
// ROOT_ONLY_PREFIXES in proxy.ts), same as Settings itself, so nothing else about their access
// changed, only where they're reached from.
const NAV_LINKS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/clients", labelKey: "nav.clients", icon: Users },
  { href: "/properties", labelKey: "nav.properties", icon: Home },
  { href: "/lands", labelKey: "nav.land", icon: LandPlot },
  { href: "/transactions", labelKey: "nav.transactions", icon: Handshake },
  { href: "/users", labelKey: "nav.users", icon: UserRound },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

// Root reaches every section; Administrator/Operator are restricted to these five — mirrors
// proxy.ts's ROOT_ONLY_PREFIXES (kept in sync by hand, see CLAUDE.md → Auth). Transactions is
// deliberately accessible here, same level as Clients/Properties/Land — see CLAUDE.md →
// "Transactions".
const NON_ROOT_ALLOWED_HREFS = new Set(["/dashboard", "/clients", "/properties", "/lands", "/transactions"]);

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
      router.push("/login");
    }
  };

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.brand}>
            <Image src={logo} alt="WebRealtor" className={styles.brandLogo} priority />
          </div>

          <nav className={styles.nav}>
            {NAV_LINKS.filter((link) => isVisible(user?.role, link.href)).map((link) => {
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
            })}
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
