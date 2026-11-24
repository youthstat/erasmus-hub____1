import { useApp } from '../../context/AppContext.jsx';
import { countryOf } from '../../hooks/useGame.js';
import PointsDelta from '../ui/PointsDelta.jsx';

export default function LeaderboardTable() {
  const { users, accountId, isAdmin, adjustPoints, removeUser, openUserEditor, lastChange, resetAccount } = useApp();

  const custom = (u) => {
    const v = parseInt(prompt(`Points for ${u.name} (use a minus to subtract, e.g. -50):`, '50'), 10);
    if (!v) return;
    adjustPoints(u.id, v, prompt('Reason (optional):', 'Manual') || 'Manual');
  };

  return (
    <div className="box shadow-b8 overflow-hidden">
      <div className="bg-ink text-white px-6 py-3 font-mono font-bold uppercase flex justify-between">
        <span>Leaderboard</span>
        <span className="flex items-center gap-3">{users.length} participants
          {isAdmin && <button className="tag bg-sun text-ink" onClick={() => openUserEditor(null)}>+ ADD PARTICIPANT</button>}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#ebe7e7] border-b-[3px] border-ink font-mono text-xs uppercase">
              <th className="p-3 text-center">Rank</th><th className="p-3">Participant / country</th>
              <th className="p-3 text-right">Total</th>{isAdmin && <th className="p-3 text-center">Adjust points</th>}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink">
            {users.map((p, i) => (
              <tr key={p.id} className={p.id === accountId ? 'bg-sun/25' : 'hover:bg-sun/20'}>
                <td className="p-3 text-center font-bold">{String(i + 1).padStart(2, '0')}</td>
                <td className="p-3">
                  <div className="font-bold uppercase">{p.name} {p.id === accountId && <span className="tag bg-sun">YOU</span>}</div>
                  <div className="font-mono text-xs text-mute">{countryOf(p)}{isAdmin && <span> · {p.registered ? 'account ✓' : 'no account'}</span>}</div>
                </td>
                <td className="p-3 text-right text-xl font-bold">{(p.score ?? 0).toLocaleString('en-US')}<PointsDelta change={lastChange[p.id]} /></td>
                {isAdmin && (
                  <td className="p-3 text-center whitespace-nowrap space-x-1">
                    <button className="tag bg-white" onClick={() => adjustPoints(p.id, -10, 'Manual')}>-10</button>
                    <button className="tag bg-sun" onClick={() => adjustPoints(p.id, 10, 'Manual')}>+10</button>
                    <button className="tag bg-neon" onClick={() => custom(p)}>CUSTOM</button>
                    <button className="tag bg-cobalt text-white" onClick={() => openUserEditor(p)}>EDIT</button>
                    {p.registered && <button className="tag bg-white" title="Forgot password: frees the name so the person can register again" onClick={() => confirm(`Reset account of ${p.name}? They will register again with a new password. Points are kept.`) && resetAccount(p.id)}>RESET PW</button>}
                    <button className="tag bg-hot text-white" onClick={() => confirm(`Remove ${p.name}?`) && removeUser(p.id)}>✕</button>
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="4" className="p-6 font-mono">No participants yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
