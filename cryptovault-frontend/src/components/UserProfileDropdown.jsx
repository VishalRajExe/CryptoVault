import { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserProfileDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 hover:bg-abyss-600/30 rounded-xl p-2 transition-colors"
      >
        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-abyss-600/20">
          {user?.fullName ? (
            user.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          ) : (
            'U'
          )}
        </div>
        <div className="hidden md:block">
          <span className="text-sm font-medium text-ink">{user?.fullName || 'User'}</span>
          <svg className="ml-1 h-3 w-3 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-abyss-800/90 backdrop-blur-lg border border-abyss-600/30 shadow-xl py-1 z-20 transform opacity-100 scale-100 transition-all duration-200">
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-ink-muted">Account</div>
            <div className="text-sm font-medium text-ink">{user?.email || ''}</div>
          </div>
          <div className="divider divider-accent"></div>
          <div className="px-3 py-2">
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm flex items-center space-x-3 rounded hover:bg-abyss-600/30 p-2"
            >
              <LogOut className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-ink">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}