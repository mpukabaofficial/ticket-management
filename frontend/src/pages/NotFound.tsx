import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <h1 className="text-4xl font-semibold text-foreground">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button variant="outline" asChild>
        <Link to="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
