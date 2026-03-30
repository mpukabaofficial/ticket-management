import { useEffect, useState } from "react";
import { RiLoaderLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [status, setStatus] = useState<string>("checking");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

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
