import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Mail, Receipt, FilePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatCurrency } from "@/lib/mock-data";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/invoices")({
  head: () => ({ meta: [{ title: "PO & Invoices — VendorBridge" }] }),
  component: InvoicesPage,
});

function InvoicePreview({ inv }: { inv: any }) {
  const items = inv.items || [];
  const tax = inv.tax ?? 0;
  
  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm mb-3">VB</div>
          <p className="text-sm font-semibold text-foreground">VendorBridge Inc.</p>
          <p className="text-xs text-muted-foreground">340 Market Street, San Francisco, CA 94102</p>
          <p className="text-xs text-muted-foreground">accounts@vendorbridge.com</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight">{inv.type === "PO" ? "Purchase Order" : "Invoice"}</p>
          <p className="text-sm font-mono text-muted-foreground mt-1">{inv.number}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-border">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Bill to</p>
          <p className="text-sm font-medium">{inv.vendor ?? inv.vendor_name}</p>
          <p className="text-xs text-muted-foreground">{inv.vendorEmail ?? inv.vendor_email ?? "vendor@example.com"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Issued · Due</p>
          <p className="text-sm">{new Date(inv.issuedAt ?? inv.created_at ?? new Date()).toLocaleDateString()}</p>
          <p className="text-sm text-muted-foreground">Due {new Date(inv.dueAt ?? inv.due_date ?? new Date()).toLocaleDateString()}</p>
        </div>
      </div>
      <table className="w-full mb-6">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
            <th className="text-left font-medium py-2">Description</th>
            <th className="text-right font-medium py-2 w-20">Qty</th>
            <th className="text-right font-medium py-2 w-28">Rate</th>
            <th className="text-right font-medium py-2 w-28">Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {items.map((it: any, i: number) => {
            const qty = it.qty ?? it.quantity ?? 1;
            const rate = it.rate ?? it.unit_price ?? 0;
            return (
              <tr key={i} className="border-b border-border">
                <td className="py-3">{it.description ?? it.product}</td>
                <td className="py-3 text-right tabular-nums">{qty}</td>
                <td className="py-3 text-right tabular-nums">{formatCurrency(rate)}</td>
                <td className="py-3 text-right tabular-nums font-medium">{formatCurrency(qty * rate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatCurrency(inv.amount ?? (inv.total - tax))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums">{formatCurrency(tax)}</span></div>
        <div className="flex justify-between pt-2 border-t border-border text-base font-semibold">
          <span>Total</span><span className="tabular-nums">{formatCurrency(inv.total)}</span>
        </div>
      </div>
    </div>
  );
}

function InvoicesPage() {
  const [tab, setTab] = useState("all");
  const queryClient = useQueryClient();

  const createInvoiceMutation = useMutation({
    mutationFn: async (po: any) => {
      const res = await api.post("/invoices", {
        po_id: po.id,
        total_amount: po.total_amount ?? po.amount ?? po.total ?? 0,
        tax_amount: (po.total_amount ?? po.amount ?? po.total ?? 0) * 0.1, // Mock 10% tax
        pdf_url: null,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Invoice generated successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to generate invoice"),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (doc: any) => {
      const endpoint = doc.type === "PO" 
        ? `/purchase-orders/${doc.id}/send-email` 
        : `/invoices/${doc.id}/send-email`;
      const res = await api.post(endpoint);
      return res.data;
    },
    onSuccess: (data, doc) => {
      toast.success("Email sent successfully", { description: data.message });
      if (doc.type === "INVOICE") queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to send email"),
  });

  const { data: pos = [], isLoading: poLoading } = useQuery({
    queryKey: ["pos"],
    queryFn: async () => {
      const res = await api.get("/pos");
      return res.data;
    },
  });

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await api.get("/invoices");
      return res.data;
    },
  });

  const allDocuments = useMemo(() => {
    const p = pos.map((po: any) => ({
      ...po,
      type: "PO",
      number: po.po_number ?? po.number ?? `PO-${po.id.slice(0, 6)}`,
      total: po.total_amount ?? po.amount ?? 0,
      issuedAt: po.created_at ?? po.issuedAt ?? new Date().toISOString(),
      vendor: po.vendor_name ?? po.vendor_id ?? "Unknown Vendor",
    }));
    const i = invoices.map((inv: any) => ({
      ...inv,
      type: "INVOICE",
      number: inv.invoice_number ?? inv.number ?? `INV-${inv.id.slice(0, 6)}`,
      total: inv.total_amount ?? inv.amount ?? 0,
      issuedAt: inv.created_at ?? inv.issuedAt ?? new Date().toISOString(),
      vendor: inv.vendor_name ?? inv.vendor_id ?? "Unknown Vendor",
    }));
    return [...p, ...i].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }, [pos, invoices]);

  const filtered = allDocuments.filter((i) => tab === "all" || (tab === "po" ? i.type === "PO" : i.type === "INVOICE"));
  const isLoading = poLoading || invLoading;

  return (
    <div>
      <PageHeader title="Purchase Orders & Invoices" description={`${allDocuments.length} documents`} />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="invoice">Invoices</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="hidden md:table-cell">Due</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading documents...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No documents found.</TableCell></TableRow>
                ) : filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">{inv.type === "PO" ? "Purchase order" : "Invoice"}</p>
                          <p className="text-sm font-mono font-medium">{inv.number}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{inv.vendor}</TableCell>
                    <TableCell className="text-sm">{new Date(inv.issuedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{new Date(inv.dueAt ?? inv.due_date ?? inv.issuedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium tabular-nums">{formatCurrency(inv.total)}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild><Button variant="outline" size="sm">View</Button></SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto sm:!max-w-2xl">
                          <SheetHeader className="mb-4">
                            <SheetTitle>{inv.number}</SheetTitle>
                          </SheetHeader>
                          <InvoicePreview inv={inv} />
                          <div className="flex gap-2 mt-4">
                            <Button onClick={() => toast.success("PDF downloaded")} className="flex-1">
                              <Download className="h-4 w-4" />Download PDF
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => sendEmailMutation.mutate(inv)} 
                              className="flex-1"
                              disabled={sendEmailMutation.isPending}
                            >
                              <Mail className="h-4 w-4" />{sendEmailMutation.isPending && sendEmailMutation.variables?.id === inv.id ? "Sending..." : "Send email"}
                            </Button>
                            {inv.type === "PO" && (
                              <Button 
                                variant="default"
                                onClick={() => createInvoiceMutation.mutate(inv)}
                                className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                                disabled={createInvoiceMutation.isPending}
                              >
                                <FilePlus className="h-4 w-4" />{createInvoiceMutation.isPending && createInvoiceMutation.variables?.id === inv.id ? "Generating..." : "Generate Invoice"}
                              </Button>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
