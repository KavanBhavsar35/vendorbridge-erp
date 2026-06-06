import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth-utils";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Clock, DollarSign, Award, ArrowRight, GitCompare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatCurrency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";

type QuotationsSearch = {
  rfqId?: string;
}

export const Route = createFileRoute("/dashboard/quotations/")({
  head: () => ({ meta: [{ title: "Quotations — VendorBridge" }] }),
  beforeLoad: () => requireRoles(["ADMIN", "MANAGER", "PROCUREMENT_OFFICER"]),
  validateSearch: (search: Record<string, unknown>): QuotationsSearch => {
    return {
      rfqId: search.rfqId as string | undefined,
    }
  },
  component: QuotationsMasterDetail,
});

function QuotationsMasterDetail() {
  const { rfqId: initialRfqId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [activeRfqId, setActiveRfqId] = useState<string | null>(initialRfqId ?? null);

  // Sync state to URL without reloading
  useEffect(() => {
    if (activeRfqId !== initialRfqId) {
      navigate({ search: { rfqId: activeRfqId || undefined }, replace: true });
    }
  }, [activeRfqId, navigate, initialRfqId]);

  const { data: rfqs = [], isLoading: rfqsLoading } = useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const res = await api.get("/rfqs");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Select an RFQ to view and compare its submitted quotations."
      />

      <Card>
        <CardHeader className="py-4"><CardTitle className="text-base">Active RFQs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-lg border-t border-border overflow-hidden max-h-64 overflow-y-auto">
            <Table>
              <TableHeader className="bg-secondary/30 sticky top-0 backdrop-blur-md">
                <TableRow>
                  <TableHead className="w-[120px]">RFQ Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqsLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading RFQs...</TableCell></TableRow>
                ) : rfqs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No RFQs found.</TableCell></TableRow>
                ) : rfqs.map((r: any) => (
                  <TableRow 
                    key={r.id} 
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-secondary/40", 
                      activeRfqId === r.id && "bg-secondary/60 font-medium"
                    )}
                    onClick={() => setActiveRfqId(r.id)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.code ?? r.id.substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(r.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      <ArrowRight className={cn("h-4 w-4 text-muted-foreground transition-transform", activeRfqId === r.id ? "translate-x-1 text-foreground" : "")} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {activeRfqId ? (
        <CompareBlock rfqId={activeRfqId} />
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg text-muted-foreground">
          <GitCompare className="h-8 w-8 mb-3 opacity-20" />
          <p>Select an RFQ above to compare quotations</p>
        </div>
      )}
    </div>
  );
}

function CompareBlock({ rfqId }: { rfqId: string }) {
  const queryClient = useQueryClient();
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const { data: rfq, isLoading: rfqLoading, isError: rfqError } = useQuery({
    queryKey: ["rfq", rfqId],
    queryFn: async () => {
      const res = await api.get(`/rfqs/${rfqId}`);
      return res.data;
    },
    enabled: !!rfqId,
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["quotations", rfqId],
    queryFn: async () => {
      const res = await api.get(`/quotations`, { params: { rfq_id: rfqId } });
      return res.data;
    },
    enabled: !!rfqId,
  });

  const acceptMutation = useMutation({
    mutationFn: async (quoteId: string) => await api.put(`/quotations/${quoteId}/accept`),
    onSuccess: (_, quoteId) => {
      setWinnerId(quoteId);
      queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
      queryClient.invalidateQueries({ queryKey: ["quotations", rfqId] });
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      toast.success("Winner selected", { description: "Quotation accepted and PO generated." });
    },
    onError: () => toast.error("Failed to accept quotation"),
  });

  if (rfqLoading || quotesLoading) {
    return <div className="p-8 text-center text-muted-foreground border rounded-lg">Loading quotation details...</div>;
  }

  if (rfqError || !rfq) {
    return <div className="p-8 text-center text-destructive border border-destructive/20 rounded-lg bg-destructive/5">Failed to load RFQ details.</div>;
  }

  const minPrice = quotes.length > 0 ? Math.min(...quotes.map((q: any) => q.price ?? q.totalPrice ?? q.total_amount ?? Infinity)) : 0;
  const minDelivery = quotes.length > 0 ? Math.min(...quotes.map((q: any) => q.deliveryDays ?? q.delivery_days ?? Infinity)) : 0;
  const maxScore = quotes.length > 0 ? Math.max(...quotes.map((q: any) => q.score ?? 85)) : 0;

  const handleSelect = (q: any) => {
    if (confirm(`Are you sure you want to award this RFQ to ${q.vendorName ?? q.vendor_id}?`)) {
      acceptMutation.mutate(q.id);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold">{rfq.title}</h3>
          <p className="text-sm text-muted-foreground font-mono">{rfq.code ?? rfq.id}</p>
        </div>
        <StatusBadge status={rfq.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10 text-success"><DollarSign className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Lowest price</p><p className="text-lg font-semibold">{formatCurrency(minPrice === Infinity ? 0 : minPrice)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10 text-info"><Clock className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Fastest delivery</p><p className="text-lg font-semibold">{minDelivery === Infinity ? 0 : minDelivery} days</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Trophy className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Top score</p><p className="text-lg font-semibold">{maxScore} / 100</p></div>
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="py-4"><CardTitle className="text-base">{quotes.length} quotations received</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-lg border-t border-border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No quotations submitted yet.</TableCell></TableRow>
                ) : quotes.map((q: any) => {
                  const isWinner = winnerId === q.id || q.status === "ACCEPTED" || q.status === "accepted";
                  const price = q.price ?? q.totalPrice ?? q.total_amount ?? 0;
                  const delivery = q.deliveryDays ?? q.delivery_days ?? 0;
                  const score = q.score ?? 85;

                  return (
                    <TableRow key={q.id} className={cn(isWinner && "bg-success/5")}>
                      <TableCell className="font-medium">{q.vendorName ?? q.vendor_id.substring(0, 8).toUpperCase()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium tabular-nums">{formatCurrency(price)}</span>
                          {price === minPrice && price > 0 && <Badge className="bg-success/10 text-success border-success/20" variant="outline">Lowest</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums">{delivery} days</span>
                          {delivery === minDelivery && delivery > 0 && <Badge className="bg-info/10 text-info border-info/20" variant="outline">Fastest</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-sm font-medium tabular-nums">{score}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground truncate">{q.notes}</TableCell>
                      <TableCell><StatusBadge status={isWinner ? "AWARDED" : q.status} /></TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={isWinner ? "secondary" : "default"}
                          disabled={isWinner || acceptMutation.isPending || rfq.status === "CLOSED" || rfq.status === "AWARDED" || rfq.status === "closed" || rfq.status === "awarded"}
                          onClick={() => handleSelect(q)}
                        >
                          <Award className="h-4 w-4 mr-1" />{isWinner ? "Winner" : "Select"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
