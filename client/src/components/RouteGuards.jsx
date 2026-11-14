import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { FullPageSpinner } from "./ui";

// Only for logged-in users; others are sent to /login.
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Only for guests (login/register); logged-in users are sent to their tasks.
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/" replace />;
  return children;
}
