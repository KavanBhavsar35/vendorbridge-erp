import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  draft: "bg-muted text-muted-foreground border-border",
  open: "bg-info/10 text-info border-info/20",
  closed: "bg-muted text-muted-foreground border-border",
  awarded: "bg-success/10 text-success border-success/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  submitted: "bg-info/10 text-info border-info/20",
  shortlisted: "bg-primary/10 text-primary border-primary/20",
  paid: "bg-success/10 text-success border-success/20",
  sent: "bg-info/10 text-info border-info/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", map[key] ?? "bg-muted text-muted-foreground")}>
      {status}
    </Badge>
  );
}
