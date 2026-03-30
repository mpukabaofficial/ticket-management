import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/auth-client";

export default function PrivateRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="flex items-center justify-center min-h-svh text-muted-foreground">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
