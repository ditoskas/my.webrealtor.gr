import type { ButtonHTMLAttributes } from "react";
import styles from "@/styles/shared.module.scss";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.buttonPrimary,
  outline: styles.buttonOutline,
  ghost: styles.buttonGhost,
  danger: styles.buttonDanger,
};

export default function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`${styles.button} ${VARIANT_CLASS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
