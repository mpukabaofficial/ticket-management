import { Navigate, Outlet } from "react-router";
import { RiLoaderLine } from "@remixicon/react";
import { Role } from "shared";
import { authClient } from "@/lib/auth-client";

export default function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <RiLoaderLine className="size-5 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (session?.user.role !== Role.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
