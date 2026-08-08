"use client";

import { useEffect, useState } from "react";
import { Clock as ClockIcon, MessageSquare } from "lucide-react";
import { useAppSelector, useTranslation } from "@/store/hooks";
import type { MessageStyle } from "@/lib/types";
import styles from "./Footer.module.scss";

const MESSAGE_STYLE_CLASS: Record<MessageStyle, string> = {
  normal: styles.messageNormal,
  success: styles.messageSuccess,
  error: styles.messageError,
  warning: styles.messageWarning,
  info: styles.messageInfo,
};

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className={styles.clockText}>{time}</span>;
}

export default function Footer() {
  const message = useAppSelector((state) => state.footer.message);
  const t = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.messageArea}>
        <MessageSquare size={14} className={styles.messageIcon} />
        {message ? (
          // Plain text, not dangerouslySetInnerHTML — messages often embed user-controlled
          // data (emails, names); rendering that as raw HTML would be a stored-XSS vector.
          // backend.think.cms's footer does use dangerouslySetInnerHTML — deliberately not
          // copied here. See CLAUDE.md → Footer notifications.
          <span className={`${styles.messageText} ${MESSAGE_STYLE_CLASS[message.style]}`}>
            {message.text}
          </span>
        ) : (
          <span className={`${styles.messageText} ${styles.messageEmpty}`}>{t("common.noMessages")}</span>
        )}
      </div>

      <div className={styles.separator} />

      <div className={styles.clockArea}>
        <ClockIcon size={14} className={styles.clockIcon} />
        <Clock />
      </div>
    </footer>
  );
}
