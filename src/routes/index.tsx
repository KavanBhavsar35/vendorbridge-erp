import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VendorBridge — Modern Procurement ERP" },
      { name: "description", content: "Centralize vendors, RFQs, quotations, approvals, and invoices in one enterprise-grade procurement platform." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">VB</div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">VendorBridge</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Procurement ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/auth/login">Sign in</Link></Button>
            <Button asChild><Link to="/auth/signup">Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />Built for modern supply chains
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight text-foreground">
          Procurement, <span className="text-primary">unbottled.</span>
        </h1>
        <p className="mt-5 mx-auto max-w-xl text-base sm:text-lg text-muted-foreground">
          From RFQ to PO in days, not weeks. VendorBridge unifies your vendor network, quotations,
          approvals, and invoicing in one calm workspace.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link to="/dashboard">Open dashboard<ArrowRight className="h-4 w-4" /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth/login">Sign in</Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 grid gap-6 md:grid-cols-3">
        {[
          { icon: Zap, title: "Faster sourcing", body: "Send RFQs to your vendor network in seconds and track every response in real time." },
          { icon: ShieldCheck, title: "Built-in governance", body: "Multi-level approvals, audit trails, and policy gates keep procurement compliant by default." },
          { icon: BarChart3, title: "Spend you can see", body: "Live dashboards, category breakdowns, and supplier scorecards put data at your fingertips." },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
