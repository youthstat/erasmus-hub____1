import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { subscribeGossipAccess, openGossipBoard, closeGossipBoard } from '../../firebase/services.js';

const when = (g) => {
  const d = g.createdAt?.toDate?.();                      // null for a moment while the server timestamp is pending
  return d ? d.toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'just now';
};

// Everything the participants whispered to Rattie Patty. Only here (admin) the authors are visible (if they chose to show their name).
// The admin can also open a read-only "Gossip board" for participants — only with a password the admin sets.
export default function GossipsPanel() {
  const { gossips, clearGossips, deleteGossip, setError } = useApp();
  const [access, setAccess] = useState({ open: false });
  const [pw, setPw] = useState('');
  useEffect(() => subscribeGossipAccess(setAccess, (e) => setError(e.message)), [setError]);

  const clearAll = () => {
    if (gossips.length && confirm(`Delete all ${gossips.length} gossips? This cannot be undone. Points that were already paid stay.`)) clearGossips();
  };
  const del = (g) => { if (confirm('Are you sure you want to delete this gossip? This cannot be undone.')) deleteGossip(g.id); };
  const open = async () => { try { await openGossipBoard(pw); setPw(''); } catch (e) { setError(e.message); } };
  const close = async () => { if (confirm('Close the Gossip board? Participants will not be able to read it.')) { try { await closeGossipBoard(); } catch (e) { setError(e.message); } } };

  return (
    <section className="box overflow-hidden">
      <div className="bg-sun border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap items-center justify-between gap-3">
        <span>🐭 Gossips for Rattie Patty · {gossips.length}</span>
        <span className="flex items-center gap-2">
          <span className="tag bg-white normal-case">authors visible to admins only</span>
          <button className="tag bg-hot text-white disabled:opacity-40" disabled={!gossips.length} onClick={clearAll}>🗑 Clear all</button>
        </span>
      </div>

      {/* reading access for participants */}
      <div className="p-4 border-b-[3px] border-ink bg-paper flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold uppercase">
          Gossip board for participants (read-only)
          <span className={`tag ${access.open ? 'bg-neon' : 'bg-white'}`}>{access.open ? 'OPEN' : 'CLOSED'}</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input className="input !py-2 !shadow-none max-w-xs" placeholder="Set a password for readers" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn bg-neon text-xs disabled:opacity-50" disabled={pw.trim().length < 3} onClick={open}>{access.open ? 'Change password' : '▶ Open for readers'}</button>
          <button className="btn bg-white text-xs" disabled={!access.open} onClick={close}>■ Close access</button>
        </div>
        <p className="font-mono text-[11px] text-mute">Set the password first, then give it to the people you trust. Readers see only the texts and dates — never the authors. The password is not shown again, set a new one any time.</p>
      </div>

      <div className="divide-y-2 divide-ink max-h-[28rem] overflow-y-auto">
        {gossips.map((g) => (
          <div key={g.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-line break-words">“{g.text}”</p>
              <div className="mt-1 font-mono text-xs text-mute">from {g.anonymous ? <b className="text-ink">Anonymous 🤫</b> : <b className="text-ink">{g.userName || 'Unknown'}</b>} · {when(g)} · {g.words} words{g.via === 'board' ? ' · written on the Gossip board' : ''}</div>
            </div>
            <span className="flex items-center gap-2 shrink-0">
              {g.points > 0 ? <span className="tag bg-neon">+{g.points} PTS</span> : <span className="tag bg-white">{g.via === 'board' ? 'FROM BOARD' : 'NO PTS'}</span>}
              <button className="tag bg-white" onClick={() => del(g)}>🗑 DELETE</button>
            </span>
          </div>
        ))}
        {gossips.length === 0 && <p className="p-4 font-mono text-sm">No gossips yet. Rattie is waiting…</p>}
      </div>
    </section>
  );
}
