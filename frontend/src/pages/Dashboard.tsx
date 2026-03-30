import { useEffect, useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState<string>("Checking...");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-medium text-foreground mb-4">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to the Ticket Management System.</p>
      <p className="text-muted-foreground mt-2">
        Backend status: <strong className="text-foreground">{status === "ok" ? "Connected" : "Disconnected"}</strong>
      </p>
    </div>
  );
}
