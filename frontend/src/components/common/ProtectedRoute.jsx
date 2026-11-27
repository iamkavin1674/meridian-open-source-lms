import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink dark:bg-ink-deep dark:text-white">
        <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-6 py-4 text-sm font-medium shadow-sm dark:border-white/10 dark:bg-ink">
          <Loader2 size={18} className="animate-spin text-lagoon dark:text-emerald-300" aria-hidden />
          <span>Checking your session…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
