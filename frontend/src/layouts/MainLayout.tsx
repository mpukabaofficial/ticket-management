import { Outlet, useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";

export default function MainLayout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">
        <span className="navbar-title">Ticket Management</span>
        {session && (
          <div className="navbar-user">
            <span>{session.user.name}</span>
            <button onClick={handleSignOut} className="btn-signout">
              Sign out
            </button>
          </div>
        )}
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}
