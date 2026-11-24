import { Link } from 'react-router-dom';
import RoleSwitcher from './RoleSwitcher.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function Header({ back }) {
  const { isAdmin, profile, openAccount, pendingCount } = useApp();
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex flex-wrap gap-3">
        {back && <Link to="/" className="btn bg-white">← Home</Link>}
        <Link to="/leaderboard" className="btn bg-cobalt text-white">Leaderboard</Link>
        {isAdmin && (
          <Link to="/admin" className="btn bg-sun">Admin panel{pendingCount > 0 && <span className="tag bg-hot text-white">{pendingCount}</span>}</Link>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {profile ? (
          <button onClick={() => openAccount(null)} title="My account"
            className="border-[3px] border-ink bg-white rounded-xl px-3 py-1.5 shadow-b4 font-mono text-sm font-bold hover:shadow-b6">
            👤 {profile.name} · {(profile.score ?? 0).toLocaleString('en-US')} PTS
          </button>
        ) : (
          <button className="btn bg-neon text-sm" onClick={() => openAccount(null)}>Sign in / Register</button>
        )}
        <RoleSwitcher />
      </div>
    </header>
  );
}
