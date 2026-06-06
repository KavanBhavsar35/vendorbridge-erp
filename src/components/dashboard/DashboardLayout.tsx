import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/mock-data";
import { getUserRole } from "@/lib/auth-utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, FileText, FilePlus2, GitCompare, ShieldCheck,
  Receipt, Activity, Menu, Bell, Search, ChevronDown, LogOut, Settings, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: number;
  roles?: string[];
};

const nav: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/vendors", label: "Vendors", icon: Users, roles: ["ADMIN", "MANAGER", "PROCUREMENT_OFFICER"] },
  { to: "/dashboard/rfqs", label: "RFQs", icon: FileText },
  { to: "/dashboard/rfqs/new", label: "New RFQ", icon: FilePlus2, roles: ["ADMIN", "MANAGER", "PROCUREMENT_OFFICER"] },
  { to: "/dashboard/quotations", label: "Quotations", icon: GitCompare, roles: ["ADMIN", "MANAGER", "PROCUREMENT_OFFICER"] },
  { to: "/dashboard/approvals", label: "Approvals", icon: ShieldCheck, badge: 3, roles: ["ADMIN", "MANAGER"] },
  { to: "/dashboard/invoices", label: "PO & Invoices", icon: Receipt },
  { to: "/dashboard/activity", label: "Activity", icon: Activity, roles: ["ADMIN"] },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const userRole = getUserRole();
  const visibleNav = nav.filter(item => !item.roles || (userRole && item.roles.includes(userRole)));
  
  const { data: statsData } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => (await api.get("/dashboard/stats")).data,
  });
  
  const totalSpend = statsData?.total_spend ?? 0;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          VB
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">VendorBridge</span>
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Procurement ERP</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleNav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to.split("/").slice(0, 3).join("/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as never}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {"badge" in item && item.badge && (
                <Badge className="h-5 px-1.5 bg-sidebar-primary text-sidebar-primary-foreground border-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="text-xs font-medium text-sidebar-accent-foreground">Total Spend</p>
          <p className="mt-1 text-lg font-semibold text-sidebar-accent-foreground">{formatCurrency(totalSpend)}</p>
          <p className="text-[11px] text-sidebar-foreground/60">Dynamic tracking active</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    if (!name) return "VB";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };
  
  const formatRole = (role?: string) => {
    if (!role) return "";
    return role.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-64 flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative hidden md:block flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search RFQs, vendors, POs…" className="pl-9 bg-secondary border-0" />
          </div>
          <div className="flex-1 md:hidden" />
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-secondary transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {user ? getInitials(user.name) : "SC"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium">{user?.name || "Loading..."}</span>
                  <span className="text-[11px] text-muted-foreground">{formatRole(user?.role)}</span>
                </div>
                <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/auth/login"><LogOut className="mr-2 h-4 w-4" />Sign out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
