import { Link } from "react-router";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-3xl font-medium text-foreground mb-4">404 — Page Not Found</h1>
      <Link to="/" className="text-primary hover:underline">Go to Dashboard</Link>
    </div>
  );
}
