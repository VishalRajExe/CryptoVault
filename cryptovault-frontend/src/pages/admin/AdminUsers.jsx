import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllUsers } from '../../api/admin';
import Pagination from '../../components/Pagination';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getAllUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const currentUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="People" title="Users" description={`${users.length} registered account${users.length === 1 ? '' : 's'}.`} />

      <div className="px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden"
        >
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-ink-muted">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={28} className="mx-auto text-ink-faint mb-3" />
              <p className="text-sm text-ink-muted">No users yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-faint text-xs uppercase tracking-wide font-mono-tab">
                    <th className="px-5 sm:px-6 py-3 font-normal">User</th>
                    <th className="px-4 py-3 font-normal">Mobile</th>
                    <th className="px-4 py-3 font-normal">Role</th>
                    <th className="px-4 py-3 font-normal">Verified</th>
                    <th className="px-4 py-3 font-normal">2FA</th>
                    <th className="px-5 sm:px-6 py-3 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((u) => (
                    <tr key={u.id} className="border-t border-white/[0.05]">
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-display text-[10px] font-semibold shrink-0">
                            {(u.fullName || u.email || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-ink font-medium truncate">{u.fullName}</div>
                            <div className="text-xs text-ink-faint truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted font-mono-tab text-xs">{u.mobile || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[11px] font-mono-tab px-2 py-1 rounded-full border ${
                            u.role === 'ROLE_ADMIN'
                              ? 'text-violet-400 bg-violet-600/10 border-violet/20'
                              : 'text-ink-muted bg-white/5 border-white/10'
                          }`}
                        >
                          {u.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.isVerified ? (
                          <CheckCircle2 size={15} className="text-mint" />
                        ) : (
                          <span className="text-xs text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {u.twoFactorAuth?.isEnabled ? (
                          <ShieldCheck size={15} className="text-mint" />
                        ) : (
                          <span className="text-xs text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-right">
                        <span className="text-[11px] font-mono-tab px-2 py-1 rounded-full border border-white/10 text-ink-muted">
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
