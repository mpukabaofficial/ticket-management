import * as Sentry from "@sentry/react";
import { Navigate, Outlet } from "react-router";
import { RiLoaderLine } from "@remixicon/react";
import { authClient } from "@/lib/auth-client";

export default function PrivateRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (session?.user) {
    Sentry.setUser({ id: session.user.id, email: session.user.email });
  }

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
