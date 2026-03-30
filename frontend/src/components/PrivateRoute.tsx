import { Navigate, Outlet } from "react-router";
import { authClient } from "../lib/auth-client";

export default function PrivateRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
