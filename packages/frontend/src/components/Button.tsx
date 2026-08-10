import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-ink hover:bg-primary-600 focus-visible:outline-primary-700",
  secondary: "bg-ink text-white hover:bg-black focus-visible:outline-black",
  outline: "border-2 border-ink text-ink hover:bg-ink hover:text-white focus-visible:outline-ink",
  ghost: "text-ink hover:bg-primary-50 focus-visible:outline-primary-700",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-700",
};

export function Button({ variant = "primary", fullWidth, className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-sm transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
