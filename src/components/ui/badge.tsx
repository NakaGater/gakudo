import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  default: "bg-ink/10 text-fg border border-ink/20",
  enter: "bg-present-bg text-present border border-[#8BCFAA]",
  exit: "bg-absent-bg text-absent border border-[#F5AEAE]",
  success: "bg-present-bg text-present border border-[#8BCFAA]",
  warning: "bg-[#FFF3E0] text-[#8A6D00] border border-[#E8D5A0]",
  danger: "bg-absent-bg text-absent border border-[#F5AEAE]",
} as const;

export type BadgeVariant = keyof typeof variantStyles;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full font-sans",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
