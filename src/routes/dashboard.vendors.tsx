import { createFileRoute } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth-utils";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Star, Mail, Phone, Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/vendors")({
  head: () => ({ meta: [{ title: "Vendors — VendorBridge" }] }),
  beforeLoad: () => requireRoles(["ADMIN", "MANAGER", "PROCUREMENT_OFFICER"]),
  component: VendorsPage,
});

function VendorsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/vendors");
      return res.data;
    },
  });

  const categories = useMemo(() => Array.from(new Set<string>(vendors.map((v: any) => v.category))), [vendors]);

  const filtered = useMemo(() => {
    return vendors.filter((v: any) => {
      const matchQ = !q || v.name.toLowerCase().includes(q.toLowerCase()) || v.email.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "all" || v.status === status;
      const matchC = category === "all" || v.category === category;
      return matchQ && matchS && matchC;
    });
  }, [vendors, q, status, category]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor removed");
    },
    onError: () => toast.error("Failed to remove vendor"),
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => await api.post("/vendors", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setOpen(false);
      toast.success("Vendor added", { description: `${data.data.name} pending verification.` });
    },
    onError: () => toast.error("Failed to add vendor"),
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this vendor?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newV = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      gst: String(fd.get("gst") ?? ""),
      category: String(fd.get("category") ?? "Other"),
    };
    addMutation.mutate(newV);
  };

  return (
    <div>
      <PageHeader
        title="Vendors"
        description={`${vendors.length} suppliers in your network`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />Add vendor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New vendor</DialogTitle>
                <DialogDescription>Onboard a new supplier. They'll start as pending verification.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Company name</Label>
                  <Input id="name" name="name" required placeholder="Acme Industrial Supply" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="sales@acme.com" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" required placeholder="+1 (415) 555-0102" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="gst">GST / Tax ID</Label>
                    <Input id="gst" name="gst" required placeholder="27AABCU9603R1ZM" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" required placeholder="e.g. Raw Materials" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending ? "Adding..." : "Add vendor"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full lg:w-52"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Vendor</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">GST</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading vendors...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No vendors match your filters.</TableCell></TableRow>
                ) : filtered.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                            {v.name.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{v.name}</p>
                          <p className="text-xs text-muted-foreground">
                             {/* The backend might not have totalOrders yet, default to 0 */}
                             {v.total_orders ?? 0} orders
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm text-foreground flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" />{v.email}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><Phone className="h-3 w-3" />{v.phone}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{v.category}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">{v.gst}</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="font-medium">{(v.rating ?? 0).toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                          <DropdownMenuItem><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(v.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

