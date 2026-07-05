import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      login(token).then(() => navigate('/app', { replace: true }));
    } else {
      navigate('/auth?mode=login&error=oauth_failed', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-void-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-ink-muted">
        <Loader2 size={28} className="animate-spin text-mint" />
        <p className="text-sm font-mono-tab">Signing you in…</p>
      </div>
    </div>
  );
}
