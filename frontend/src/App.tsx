import * as Sentry from "@sentry/react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Users from "@/pages/Users";
import Tickets from "@/pages/Tickets";
import TicketDetail from "@/pages/TicketDetail";
import MainLayout from "@/layouts/MainLayout";
import PrivateRoute from "@/components/PrivateRoute";
import AdminRoute from "@/components/AdminRoute";

function ErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">An unexpected error occurred.</p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<MainLayout />}>
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route element={<AdminRoute />}>
                <Route path="/users" element={<Users />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </Sentry.ErrorBoundary>
  );
}

export default App;
