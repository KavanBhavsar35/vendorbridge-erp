import { createFileRoute } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth-utils";
import { useQuery } from "@tanstack/react-query";
import { FileText, Users, ShieldCheck, Receipt, GitCompare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/activity")({
  head: () => ({ meta: [{ title: "Activity Log — VendorBridge" }] }),
  beforeLoad: () => requireRoles(["ADMIN"]),
  component: ActivityPage,
});

const iconMap: Record<string, { icon: any; tint: string }> = {
  rfq: { icon: FileText, tint: "bg-info/10 text-info" },
  vendor: { icon: Users, tint: "bg-primary/10 text-primary" },
  approval: { icon: ShieldCheck, tint: "bg-warning/15 text-warning-foreground" },
  invoice: { icon: Receipt, tint: "bg-success/10 text-success" },
  po: { icon: Receipt, tint: "bg-success/10 text-success" },
  quotation: { icon: GitCompare, tint: "bg-accent text-accent-foreground" },
};

function ActivityPage() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const res = await api.get("/activity-logs");
      return res.data;
    },
  });

  return (
    <div>
      <PageHeader title="Activity log" description="A timeline of every action across your procurement workspace." />
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading activity log...</div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No recent activity.</div>
          ) : (
            <ol className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {activities.map((a: any) => {
                const cfg = iconMap[a.entity_type?.toLowerCase()] || { icon: FileText, tint: "bg-secondary text-foreground" };
                const Icon = cfg.icon;
                return (
                  <li key={a.id} className="relative pl-12">
                    <span className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-card ${cfg.tint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{a.user_id?.substring(0, 8).toUpperCase() ?? "System"}</span>{" "}
                        <span className="text-muted-foreground">{a.action?.toLowerCase()}</span>{" "}
                        <span className="font-medium">{a.entity_type} {a.entity_id?.substring(0, 8).toUpperCase()}</span>
                      </p>
                      <time className="text-xs text-muted-foreground tabular-nums">
                        {new Date(a.created_at ?? new Date()).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
