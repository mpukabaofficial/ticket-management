import { Navigate, Outlet } from "react-router";
import { RiLoaderLine } from "@remixicon/react";
import { authClient } from "@/lib/auth-client";

export default function PrivateRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-svh gap-2 text-muted-foreground">
        <RiLoaderLine className="size-5 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
