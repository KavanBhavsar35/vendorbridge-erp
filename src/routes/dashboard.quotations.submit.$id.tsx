import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { requireRoles } from "@/lib/auth-utils";
import { Calendar, Package, Building2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/quotations/submit/$id")({
  head: () => ({ meta: [{ title: "Submit Quotation — VendorBridge" }] }),
  beforeLoad: () => requireRoles(["VENDOR"]),
  component: SubmitQuote,
});

function SubmitQuote() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: rfq, isLoading } = useQuery({
    queryKey: ["rfq", id],
    queryFn: async () => {
      const res = await api.get(`/rfqs/${id}`);
      return res.data;
    },
  });

  const quoteMutation = useMutation({
    mutationFn: async (data: any) => await api.post("/quotations", data),
    onSuccess: () => {
      toast.success("Quotation submitted", { description: "Your quote has been sent for review." });
      navigate({ to: "/dashboard/rfqs" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to submit quotation");
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    quoteMutation.mutate({
      rfq_id: id,
      price: Number(fd.get("price")),
      delivery_days: Number(fd.get("days")),
      notes: String(fd.get("notes")),
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading RFQ...</div>;
  }

  if (!rfq) {
    return <div className="p-8 text-center text-muted-foreground">RFQ not found.</div>;
  }

  return (
    <div>
      <PageHeader title="Submit quotation" description={`Respond to RFQ ${rfq.code}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-muted-foreground">{rfq.code}</p>
                <CardTitle className="text-lg mt-1">{rfq.title}</CardTitle>
              </div>
              <StatusBadge status={rfq.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{rfq.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" />Deadline</p>
                <p className="text-sm font-medium mt-1">{new Date(rfq.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3 w-3" />Buyer</p>
                <p className="text-sm font-medium mt-1">{rfq.createdBy ?? rfq.created_by}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Package className="h-3 w-3" />Items</p>
                <p className="text-sm font-medium mt-1">{rfq.items?.length ?? 0}</p>
              </div>
            </div>
            {rfq.items && rfq.items.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Requested items</p>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {rfq.items.map((it: any, i: number) => (
                    <div key={it.id || i} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{it.product}</p>
                        <p className="text-xs text-muted-foreground">{it.description}</p>
                      </div>
                      <p className="text-sm font-medium tabular-nums">{it.quantity ?? it.qty} {it.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={onSubmit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Your quotation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="price">Total price (INR)</Label>
                <Input id="price" name="price" type="number" min={0} step="0.01" required placeholder="0.00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="days">Delivery (days)</Label>
                <Input id="days" name="days" type="number" min={1} required placeholder="14" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={4} placeholder="Terms, warranties, conditions…" />
              </div>
              <Button type="submit" className="w-full" disabled={quoteMutation.isPending}>
                <Send className="h-4 w-4" />
                {quoteMutation.isPending ? "Submitting..." : "Submit quotation"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
