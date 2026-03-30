import { Outlet, useNavigate } from "react-router";
import { authClient } from "@/lib/auth-client";

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
        <span className="font-semibold text-base text-foreground">Ticket Management</span>
        {session && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{session.user.name}</span>
            <button
              onClick={handleSignOut}
              className="bg-transparent border border-input rounded-md px-3 py-1 text-[13px] text-muted-foreground cursor-pointer hover:border-ring hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </>
  );
}
