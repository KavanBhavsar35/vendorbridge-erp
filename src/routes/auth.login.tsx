import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthShell } from "@/components/auth/AuthShell";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — VendorBridge" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (formData: URLSearchParams) => {
      const res = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return res.data; // Expected { access_token: "...", token_type: "bearer" }
    },
    onSuccess: async (data) => {
      // Once logged in, fetch the user profile
      try {
        const userRes = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        login(data.access_token, userRes.data);
        toast.success(`Welcome back, ${userRes.data.name}`);
        navigate({ to: "/dashboard" });
      } catch (err) {
        toast.error("Failed to fetch user profile");
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    },
  });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    loginMutation.mutate(params);
  };

  return (
    <AuthShell
      title="Sign in to VendorBridge"
      subtitle="Welcome back. Enter your credentials to continue."
      footer={<>Don't have an account? <Link to="/auth/signup" className="text-primary font-medium hover:underline">Create one</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required placeholder="admin@example.com" defaultValue="admin@example.com" />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
          </div>
          <Input id="password" name="password" type="password" required placeholder="••••••••" defaultValue="admin123" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="role">Sign in as</Label>
          <Select defaultValue="buyer">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="buyer">Procurement</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="approver">Approver</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={() => toast("Google SSO (demo)")}>
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Continue with Google
        </Button>
      </form>
    </AuthShell>
  );
}

