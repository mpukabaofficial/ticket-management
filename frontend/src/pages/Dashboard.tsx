import { useEffect, useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState<string>("Checking...");

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the Ticket Management System.</p>
      <p>
        Backend status: <strong>{status === "ok" ? "Connected" : "Disconnected"}</strong>
      </p>
    </div>
  );
}
