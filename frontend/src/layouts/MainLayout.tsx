import * as Sentry from "@sentry/react";
import { Link, Outlet, useNavigate, useLocation } from "react-router";
import { Role } from "shared";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MainLayout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          Sentry.setUser(null);
          navigate("/login");
        },
      },
    });
  };

  const navLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/tickets", label: "Tickets" },
    ...(session?.user.role === Role.ADMIN
      ? [{ to: "/users", label: "Users" }]
      : []),
  ];

  return (
    <>
      <nav className="flex items-center justify-between px-8 h-16 shrink-0 bg-card/70 sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <span className="font-heading text-xl text-foreground" style={{ fontOpticalSizing: "auto" }}>
              Ticket Management
            </span>
          </Link>
          {session && (
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.to);
                return (
                  <Button
                    key={link.to}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={cn(
                      "text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all",
                      isActive && "text-foreground bg-accent font-medium"
                    )}
                  >
                    <Link to={link.to}>{link.label}</Link>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
        {session && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{session.user.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              Sign out
            </Button>
          </div>
        )}
      </nav>
      {/* Soft divider */}
      <div className="h-px bg-border/60" />
      <main className="flex-1 px-8 py-8">
        <Outlet />
      </main>
    </>
  );
}
