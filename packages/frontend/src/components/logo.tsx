import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground", className)}>
      <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
      Casa Creadores
    </span>
  );
}
