import { createFileRoute, Link } from "@tanstack/react-router";
import { getUserRole } from "@/lib/auth-utils";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  ClipboardCheck, FileText, Receipt, TrendingUp, ArrowUpRight,
  Plus, Users, FilePlus2, GitCompare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { formatCurrency } from "@/lib/mock-data";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — VendorBridge" }] }),
  component: DashboardHome,
});

const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function DashboardHome() {
  const userRole = getUserRole();
  const { data: approvals = [] } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => (await api.get("/approvals")).data,
  });
  const { data: rfqs = [] } = useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => (await api.get("/rfqs")).data,
  });
  const { data: pos = [] } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => (await api.get("/purchase-orders")).data,
  });
  const { data: activities = [] } = useQuery({
    queryKey: ["activity_logs"],
    queryFn: async () => (await api.get("/activity-logs")).data,
  });

  const { data: statsData } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => (await api.get("/dashboard/stats")).data,
  });

  const pendingApprovals = statsData?.pending_approvals ?? approvals.filter((a: any) => a.status === "pending").length;
  const activeRfqs = statsData?.active_rfqs ?? rfqs.filter((r: any) => r.status === "open").length;
  const recentPOs = statsData?.recent_pos ?? pos.length;
  const totalSpend = statsData?.total_spend ?? 0;
  
  const spendTrendData = statsData?.spend_trend ?? [];
  const categorySpendData = statsData?.category_spend ?? [];

  const stats = [
    { label: "Pending Approvals", value: pendingApprovals.toString(), change: "active", icon: ClipboardCheck, tint: "text-warning" },
    { label: "Active RFQs", value: activeRfqs.toString(), change: "current", icon: FileText, tint: "text-info" },
    { label: "Total POs", value: recentPOs.toString(), change: "issued", icon: Receipt, tint: "text-primary" },
    { label: "Total Spend", value: formatCurrency(totalSpend), change: "to date", icon: TrendingUp, tint: "text-success" },
  ];

  return (
    <div>
      <PageHeader
        title="Welcome back"
        description="Here's what's happening with your procurement pipeline today."
        actions={
          userRole !== "VENDOR" ? (
            <Button asChild>
              <Link to="/dashboard/rfqs/new"><Plus className="h-4 w-4" />New RFQ</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{s.value}</p>
                    <p className="mt-1 flex items-center text-xs text-muted-foreground font-medium">
                      <ArrowUpRight className="h-3 w-3 mr-1" />{s.change}
                    </p>
                  </div>
                  <div className={`rounded-lg bg-secondary p-2.5 ${s.tint}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Spend trend</CardTitle>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendTrendData} margin={{ left: -10, right: 8, top: 4 }}>
                  <defs>
                    <linearGradient id="spendG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="spend" stroke="var(--chart-1)" fill="url(#spendG)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend by category</CardTitle>
            <p className="text-xs text-muted-foreground">Q2 distribution</p>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categorySpendData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2}>
                    {categorySpendData.map((_: any, i: number) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {categorySpendData.map((c: any, i: number) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                    <span className="text-foreground">{c.name}</span>
                  </div>
                  <span className="text-muted-foreground">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activities.slice(0, 6).map((a: any) => (
                <li key={a.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{a.user_id?.substring(0, 8).toUpperCase() ?? "System"}</span>{" "}
                      <span className="text-muted-foreground">{a.action?.toLowerCase()}</span>{" "}
                      <span className="font-medium">{a.entity_type} {a.entity_id?.substring(0, 8).toUpperCase()}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(a.created_at ?? new Date()).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </li>
              ))}
              {activities.length === 0 && (
                <li className="text-sm text-muted-foreground">No recent activity.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {userRole !== "VENDOR" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/dashboard/rfqs/new"><FilePlus2 className="h-4 w-4" />Create RFQ</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/dashboard/vendors"><Users className="h-4 w-4" />Add Vendor</Link>
              </Button>
              {rfqs.length > 0 ? (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/dashboard/quotations" search={{ rfqId: rfqs[0].id }}>
                    <GitCompare className="h-4 w-4" />Compare Quotations
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start" disabled>
                  <GitCompare className="h-4 w-4" />Compare Quotations
                </Button>
              )}
              {userRole !== "PROCUREMENT_OFFICER" && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/dashboard/approvals"><ClipboardCheck className="h-4 w-4" />Review Approvals</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
