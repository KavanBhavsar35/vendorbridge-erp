import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth-utils";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/rfqs/new")({
  head: () => ({ meta: [{ title: "New RFQ — VendorBridge" }] }),
  beforeLoad: () => requireRoles(["ADMIN", "MANAGER", "PROCUREMENT_OFFICER"]),
  component: NewRFQ,
});

type Item = { id: string; product: string; qty: number; unit: string };

function NewRFQ() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Item[]>([{ id: "1", product: "", qty: 1, unit: "pcs" }]);
  const [selected, setSelected] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/vendors");
      return res.data;
    },
  });

  const addItem = () => setItems((i) => [...i, { id: String(Date.now()), product: "", qty: 1, unit: "pcs" }]);
  const removeItem = (id: string) => setItems((i) => i.length > 1 ? i.filter((x) => x.id !== id) : i);
  const update = (id: string, patch: Partial<Item>) =>
    setItems((i) => i.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const toggleVendor = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const rfqMutation = useMutation({
    mutationFn: async (data: any) => await api.post("/rfqs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      toast.success("RFQ created", { description: `Sent to ${selected.length} vendor(s).` });
      navigate({ to: "/dashboard/rfqs" });
    },
    onError: () => toast.error("Failed to create RFQ"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selected.length === 0) {
      toast.error("Select at least one vendor");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const deadlineStr = String(fd.get("deadline"));
    
    // Ensure deadline is an ISO string for FastAPI
    const deadline = new Date(deadlineStr).toISOString();

    rfqMutation.mutate({
      title: String(fd.get("title")),
      description: String(fd.get("desc")),
      deadline: deadline,
      products: items.map(it => ({ product: it.product, qty: it.qty, unit: it.unit })),
      vendor_ids: selected,
    });
  };

  return (
    <div>
      <PageHeader title="Create new RFQ" description="Request quotations from your vendor network." />
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">RFQ details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="e.g. Q3 Steel Procurement" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" name="desc" required rows={4} placeholder="Describe the scope, specifications, terms…" />
              </div>
              <div className="grid gap-1.5 max-w-xs">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" name="deadline" type="date" required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" />Add item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((it, idx) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-12 sm:col-span-6 grid gap-1.5">
                    {idx === 0 && <Label className="text-xs">Product / Service</Label>}
                    <Input value={it.product} onChange={(e) => update(it.id, { product: e.target.value })} placeholder="Product name & specs" required />
                  </div>
                  <div className="col-span-5 sm:col-span-2 grid gap-1.5">
                    {idx === 0 && <Label className="text-xs">Quantity</Label>}
                    <Input type="number" min={1} value={it.qty} onChange={(e) => update(it.id, { qty: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-5 sm:col-span-3 grid gap-1.5">
                    {idx === 0 && <Label className="text-xs">Unit</Label>}
                    <Input value={it.unit} onChange={(e) => update(it.id, { unit: e.target.value })} placeholder="pcs / kg / m" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    {idx === 0 && <div className="h-4" />}
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(it.id)} aria-label="Remove">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => setAttachments((a) => [...a, `specification-${a.length + 1}.pdf`])}
                className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-secondary/40 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">Click to upload attachments</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX up to 10MB</p>
              </button>
              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((a, i) => (
                    <Badge key={i} variant="secondary" className="gap-1.5 pr-1">
                      {a}
                      <button type="button" onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invite vendors</CardTitle>
              <p className="text-xs text-muted-foreground">{selected.length} selected</p>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {vendors.filter((v: any) => v.status === "ACTIVE").map((v: any) => (
                <label key={v.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-secondary/60 cursor-pointer">
                  <Checkbox checked={selected.includes(v.id)} onCheckedChange={() => toggleVendor(v.id)} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.category}</p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Button type="submit" className="w-full" disabled={rfqMutation.isPending}>
                <Check className="h-4 w-4" />
                {rfqMutation.isPending ? "Sending..." : "Send RFQ"}
              </Button>
              <Button type="button" variant="outline" className="w-full">Save as draft</Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
