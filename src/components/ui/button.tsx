import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  primary:
    "bg-accent text-white border-2 border-[#92400E] shadow-[0_3px_0_#92400E] hover:shadow-[0_4px_0_#92400E] active:shadow-[0_1px_0_#92400E]",
  secondary:
    "bg-bg-elev text-fg border-2 border-border shadow-[0_2px_0_var(--page-edge)] hover:border-cr-orange hover:text-cr-orange",
  ghost: "bg-transparent text-accent hover:bg-accent-light",
  destructive:
    "bg-danger text-white border-2 border-[#A83C32] shadow-[0_3px_0_#A83C32] hover:shadow-[0_4px_0_#A83C32] active:shadow-[0_1px_0_#A83C32]",
  enter:
    "bg-enter text-white border-2 border-[#1F5E3D] shadow-[0_3px_0_#1F5E3D] hover:shadow-[0_4px_0_#1F5E3D] active:shadow-[0_1px_0_#1F5E3D]",
  exit: "bg-exit text-white border-2 border-[#A83C32] shadow-[0_3px_0_#A83C32] hover:shadow-[0_4px_0_#A83C32] active:shadow-[0_1px_0_#A83C32]",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-base",
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

function Spinner() {
  return (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-story font-bold transition-all",
          "hover:-translate-y-0.5 active:translate-y-0.5",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
