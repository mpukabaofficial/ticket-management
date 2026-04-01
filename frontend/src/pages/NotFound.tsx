import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <h1 className="font-heading text-6xl text-foreground" style={{ fontOpticalSizing: "auto" }}>
        404
      </h1>
      <p className="text-muted-foreground text-lg">Page not found</p>
      <Button variant="outline" asChild className="rounded-xl">
        <Link to="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
