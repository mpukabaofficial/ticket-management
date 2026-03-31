import { Link, Outlet, useNavigate } from "react-router";
import { Role } from "shared";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function MainLayout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/login");
        },
      },
    });
  };

  return (
    <>
      <nav className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-base text-foreground">Ticket Management</span>
          {session && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">Dashboard</Link>
              </Button>
              {session.user.role === Role.ADMIN && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/users">Users</Link>
                </Button>
              )}
            </div>
          )}
        </div>
        {session && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{session.user.name}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        )}
      </nav>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </>
  );
}
