import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!localStorage.getItem("vb_token")) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: () => (
    <DashboardLayout>
      <Outlet />
      <Toaster position="top-right" />
    </DashboardLayout>
  ),
});
