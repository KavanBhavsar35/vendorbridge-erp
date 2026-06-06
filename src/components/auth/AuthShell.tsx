import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col p-6 sm:p-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">VB</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">VendorBridge</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Procurement ERP</p>
          </div>
        </Link>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-center text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex relative bg-sidebar text-sidebar-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, var(--sidebar-primary), transparent 50%), radial-gradient(circle at 80% 80%, var(--sidebar-primary), transparent 40%)" }} />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-sidebar-foreground/60">Enterprise procurement</p>
        </div>
        <div className="relative space-y-6 max-w-md">
          <blockquote className="text-2xl font-medium leading-relaxed text-sidebar-foreground">
            "We cut our sourcing cycle by 47% in the first quarter — vendor responses now arrive in days, not weeks."
          </blockquote>
          <div>
            <p className="text-sm font-medium">Helena Marquez</p>
            <p className="text-xs text-sidebar-foreground/60">VP Supply Chain · Northbridge Industries</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-4 text-sm">
          <div><p className="text-2xl font-semibold">$2.4B</p><p className="text-xs text-sidebar-foreground/60">Annual GMV</p></div>
          <div><p className="text-2xl font-semibold">14k+</p><p className="text-xs text-sidebar-foreground/60">Vendors</p></div>
          <div><p className="text-2xl font-semibold">98.6%</p><p className="text-xs text-sidebar-foreground/60">SLA met</p></div>
        </div>
      </div>
    </div>
  );
}
