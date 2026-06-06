import { createFileRoute } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth-utils";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatCurrency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/approvals")({
  head: () => ({ meta: [{ title: "Approvals — VendorBridge" }] }),
  beforeLoad: () => requireRoles(["ADMIN", "MANAGER"]),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState<any | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [remarks, setRemarks] = useState("");

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      const res = await api.get("/approvals");
      return res.data;
    },
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: string, status: string, comments: string }) => {
      await api.put(`/approvals/${id}`, { status, comments });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success(variables.status === "approved" ? "Approval granted" : "Approval rejected");
      setDecision(null);
      setRemarks("");
      setActive(null);
    },
    onError: () => toast.error("Failed to submit decision"),
  });

  const submit = () => {
    if (!active || !decision) return;
    decisionMutation.mutate({ id: active.id, status: decision, comments: remarks });
  };

  return (
    <div>
      <PageHeader title="Approvals" description={`${list.filter((a: any) => a.status === "pending").length} pending your decision`} />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Queue</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading approvals...</div>
            ) : list.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No approvals found.</div>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((a: any) => (
                  <li key={a.id}>
                    <button
                      onClick={() => setActive(a)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-secondary/60 transition-colors",
                        active?.id === a.id && "bg-secondary",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-muted-foreground">{a.rfq?.id?.substring(0, 8).toUpperCase() ?? "REQ"}</p>
                          <p className="text-sm font-medium text-foreground truncate">{a.rfq?.title ?? "Purchase Request"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{a.rfq?.description ?? "Awaiting approval decision"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={a.status} />
                          <StatusBadge status={a.priority ?? "medium"} />
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          {active ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{active.rfq?.id?.substring(0, 8).toUpperCase() ?? "REQ"}</p>
                    <CardTitle className="text-lg mt-1">{active.rfq?.title ?? "Purchase Request"}</CardTitle>
                  </div>
                  <StatusBadge status={active.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Requested by</p><p className="text-sm font-medium mt-0.5">{active.rfq?.created_by_id?.substring(0, 8).toUpperCase() ?? "System"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Submitted</p><p className="text-sm font-medium mt-0.5">{new Date(active.created_at ?? new Date()).toLocaleDateString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">Deadline</p><p className="text-sm font-medium mt-0.5">{active.rfq?.deadline ? new Date(active.rfq.deadline).toLocaleDateString() : "N/A"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Scope</p><p className="text-sm font-semibold mt-0.5">Global Procurement</p></div>
                </div>
                <div className="rounded-lg bg-secondary/60 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Details</p>
                  <p className="text-sm">{active.rfq?.description ?? "Please review this request against your procurement budget and vendor compliance rules."}</p>
                </div>
                {active.status === "pending" ? (
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-success text-success-foreground hover:bg-success/90" onClick={() => setDecision("approved")}>
                      <Check className="h-4 w-4" />Approve
                    </Button>
                    <Button className="flex-1" variant="outline" onClick={() => setDecision("rejected")}>
                      <X className="h-4 w-4" />Reject
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Decision already recorded.</div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="py-20 text-center text-muted-foreground">Select an approval to review</CardContent>
          )}
        </Card>
      </div>

      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision === "approved" ? "Approve" : "Reject"} request</DialogTitle>
            <DialogDescription>Add remarks for the audit trail.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
            <Button onClick={submit} disabled={decisionMutation.isPending} className={decision === "approved" ? "bg-success text-success-foreground hover:bg-success/90" : ""} variant={decision === "rejected" ? "destructive" : "default"}>
              {decisionMutation.isPending ? "Submitting..." : `Confirm ${decision === "approved" ? "approval" : "rejection"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
