import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { subscribePunishments, deletePunishment, putBackPunishment, clearPunishments } from '../../firebase/punishment.js';

// Admin: every paper in the Punishment box. Authors are visible only here.
export default function PunishmentAdminPanel() {
  const { setError } = useApp();
  const [papers, setPapers] = useState([]);
  useEffect(() => subscribePunishments(setPapers, (e) => setError(e.message)), [setError]);
  const run = async (fn) => { try { await fn(); } catch (e) { setError(e.message); } };
  const inBox = papers.filter((p) => !p.drawn).length;
  const sorted = [...papers].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return (
    <section className="box overflow-hidden">
      <div className="bg-hot text-white border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap items-center justify-between gap-3">
        <span>📦 Punishment box · {inBox} in the box · {papers.length - inBox} drawn</span>
        <button className="tag bg-white text-ink disabled:opacity-40" disabled={!papers.length}
          onClick={() => confirm(`Delete all ${papers.length} punishments? This cannot be undone. Points already paid or taken stay.`) && run(clearPunishments)}>🗑 Clear all</button>
      </div>
      <div className="divide-y-2 divide-ink max-h-[28rem] overflow-y-auto">
        {sorted.map((p) => (
          <div key={p.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-line break-words font-bold">“{p.text}”</p>
              <div className="mt-1 font-mono text-xs text-mute">written by <b className="text-ink">{p.userName || 'Unknown'}</b>{p.drawn && <> · drawn by <b className="text-ink">{p.drawnByName || 'Unknown'}</b></>}</div>
            </div>
            <span className="flex items-center gap-2 shrink-0">
              <span className={`tag ${p.drawn ? 'bg-white' : 'bg-neon'}`}>{p.drawn ? 'DRAWN' : 'IN THE BOX'}</span>
              {p.drawn && <button className="tag bg-sun" onClick={() => run(() => putBackPunishment(p.id))}>↩ PUT BACK</button>}
              <button className="tag bg-white" onClick={() => confirm('Are you sure you want to delete this punishment? This cannot be undone.') && run(() => deletePunishment(p.id))}>🗑 DELETE</button>
            </span>
          </div>
        ))}
        {papers.length === 0 && <p className="p-4 font-mono text-sm">The box is empty.</p>}
      </div>
    </section>
  );
}
