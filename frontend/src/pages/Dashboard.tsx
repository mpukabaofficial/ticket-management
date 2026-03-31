import { useQuery } from "@tanstack/react-query";
import { RiLoaderLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

export default function Dashboard() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: () =>
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/health`)
        .then((res) => res.data.status as string),
  });

  const status = isPending ? "checking" : isError ? "unreachable" : data;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-4">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to the Ticket Management System.</p>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-sm text-muted-foreground">Backend status:</span>
        {status === "checking" ? (
          <Badge variant="secondary">
            <RiLoaderLine className="size-3 animate-spin" />
            Checking...
          </Badge>
        ) : status === "ok" ? (
          <Badge variant="default">Connected</Badge>
        ) : (
          <Badge variant="destructive">Disconnected</Badge>
        )}
      </div>
    </div>
  );
}
