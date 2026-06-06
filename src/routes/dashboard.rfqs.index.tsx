import { createFileRoute, Link } from "@tanstack/react-router";
import { getUserRole } from "@/lib/auth-utils";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/rfqs/")({
  head: () => ({ meta: [{ title: "RFQs — VendorBridge" }] }),
  component: RFQList,
});

function RFQList() {
  const userRole = getUserRole();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const res = await api.get("/rfqs");
      return res.data;
    },
  });

  const filtered = useMemo(
    () => rfqs.filter((r: any) => (!q || r.title.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase())) && (status === "all" || r.status === status)),
    [rfqs, q, status],
  );

  return (
    <div>
      <PageHeader
        title="Request for Quotations"
        description={`${rfqs.length} RFQs total · ${rfqs.filter((r: any) => r.status === "open").length} open`}
        actions={
          userRole !== "VENDOR" ? (
            <Button asChild>
              <Link to="/dashboard/rfqs/new"><Plus className="h-4 w-4" />New RFQ</Link>
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search RFQs…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>RFQ</TableHead>
                  <TableHead className="hidden md:table-cell">Created by</TableHead>
                  <TableHead className="hidden lg:table-cell">Vendors</TableHead>
                  <TableHead className="hidden lg:table-cell">Quotes</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading RFQs...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No RFQs found.</TableCell></TableRow>
                ) : filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="text-xs font-mono text-muted-foreground">{r.code}</p>
                      <p className="font-medium text-foreground">{r.title}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{r.createdBy ?? r.created_by}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />{r.vendorIds?.length ?? r.vendors?.length ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm font-medium">{r.quotationCount ?? 0}</TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(r.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      {userRole === "VENDOR" ? (
                        <Button asChild variant="ghost" size="icon">
                          <Link to="/dashboard/quotations/submit/$id" params={{ id: r.id }}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild variant="ghost" size="icon">
                          <Link to="/dashboard/quotations" search={{ rfqId: r.id }}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
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
