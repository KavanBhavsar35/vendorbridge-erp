import { redirect } from "@tanstack/react-router";

/**
 * Synchronously gets the user's role by decoding the JWT from localStorage.
 */
export function getUserRole(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("vb_token");
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
}

/**
 * Route guard for TanStack Router's `beforeLoad`.
 * Redirects to login if unauthenticated, or to the dashboard home if unauthorized.
 */
export function requireRoles(allowedRoles: string[]) {
  const role = getUserRole();
  if (!role) {
    throw redirect({ to: "/auth/login" });
  }
  
  if (!allowedRoles.includes(role)) {
    throw redirect({ to: "/dashboard" });
  }
}
