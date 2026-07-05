import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Gate for the /app/admin/* tree. Mirrors ProtectedRoute but additionally
 *  requires ROLE_ADMIN. The backend enforces this independently on every
 *  /api/admin/** call - this is purely a frontend UX guard so a non-admin
 *  never sees the admin shell at all, not a security boundary by itself. */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-void-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-mint" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (user.role !== 'ROLE_ADMIN') {
    return <Navigate to="/app" replace />;
  }

  return children;
}
