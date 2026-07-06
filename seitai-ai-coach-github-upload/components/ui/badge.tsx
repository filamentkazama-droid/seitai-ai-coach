import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "danger";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  const tones = {
    default: "bg-muted text-foreground",
    success: "bg-green-50 text-success",
    warning: "bg-amber-50 text-warning",
    danger: "bg-rose-50 text-danger"
  };

  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}
