import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  // Check if user is unverified and trying to access financial pages
  const isEmailVerified = !!(user.isVerified || user.verified);
  const isUnverified = !isEmailVerified;
  const currentPath = location.pathname;
  
  if (isUnverified && currentPath.startsWith('/app') && !currentPath.startsWith('/app/security') && !currentPath.startsWith('/app/admin')) {
    return <Navigate to="/app/security" replace />;
  }

  return children;
}
