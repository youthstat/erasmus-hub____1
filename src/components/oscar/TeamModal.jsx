import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useOscar } from '../../hooks/useOscar.js';
import { saveTeam, MIN_TEAM_SIZE } from '../../firebase/oscar.js';
import { MAX_TEAM_SIZE } from '../../config/settings.js';
import { countryOf } from '../../hooks/useGame.js';
import ModalShell from '../modals/ModalShell.jsx';

// Create (or edit) a film crew: title, members (flags) and the director
export default function TeamModal({ team, onClose }) {
  const { users, accountId, isAdmin } = useApp();
  const { teams, nameOf } = useOscar();
  const [title, setTitle] = useState(team?.title || '');
  const [members, setMembers] = useState(team?.memberIds || (accountId ? [accountId] : []));
  const [director, setDirector] = useState(team?.directorId || accountId || '');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const crewOf = useMemo(() => {                                   // who is already in another crew
    const m = new Map();
    teams.filter((t) => t.id !== team?.id).forEach((t) => (t.memberIds || []).forEach((u) => m.set(u, t.title)));
    return m;
  }, [teams, team]);
  const list = useMemo(() => [...users].filter((u) => u.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)), [users, q]);

  const toggle = (id) => {
    setMsg('');
    if (members.includes(id)) { const next = members.filter((x) => x !== id); setMembers(next); if (director === id) setDirector(next[0] || ''); return; }
    if (members.length >= MAX_TEAM_SIZE) return setMsg(`A crew can have at most ${MAX_TEAM_SIZE} people.`);
    setMembers([...members, id]); if (!director) setDirector(id);
  };

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await saveTeam({ title, directorId: director, memberIds: members }, team?.id, accountId, nameOf, isAdmin); onClose(); }
    catch (err) { setMsg(err.message); setBusy(false); }
  };

  return (
    <ModalShell title={team ? 'Edit film crew' : 'Create film crew'} onClose={onClose} maxW="max-w-3xl">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <p className="text-sm text-[#4b4731]">Register your team. Everybody you select will see the crew name and the roster in their profile.</p>
        <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">1. Film / team title *
          <input className="input" required maxLength={60} placeholder="e.g. Life Without AI: Back to Reality" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-bold uppercase">
            <span>2. Select crew members * (tap to toggle)</span>
            <span className="tag bg-sun">{members.length} / {MAX_TEAM_SIZE} selected</span>
          </div>
          <input className="input !py-2 !shadow-none" placeholder="Search a name…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-paper border-[3px] border-ink rounded-xl">
            {list.map((u) => {
              const on = members.includes(u.id); const other = crewOf.get(u.id);
              return (
                <button type="button" key={u.id} disabled={!!other} onClick={() => toggle(u.id)}
                  className={`text-left border-[3px] border-ink rounded-lg px-3 py-2 font-mono text-sm flex items-center justify-between gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${on ? 'bg-neon font-bold' : 'bg-white'}`}>
                  <span className="min-w-0"><span className="block truncate">{u.name}</span>
                    <span className="block text-[11px] font-normal text-mute truncate">{other ? `in “${other}”` : countryOf(u)}</span></span>
                  <span className="font-bold">{on ? '✓' : '+'}</span>
                </button>
              );
            })}
            {list.length === 0 && <p className="font-mono text-xs text-mute p-2">Nobody found.</p>}
          </div>
        </div>
        <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">3. Director * (one of the selected)
          <select className="input" required value={director} onChange={(e) => setDirector(e.target.value)}>
            <option value="" disabled>Choose…</option>
            {members.map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
          </select>
        </label>
        {msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>}
        <div className="flex flex-wrap justify-end gap-3 pt-2 border-t-2 border-ink">
          <button type="button" className="btn bg-white" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy || members.length < MIN_TEAM_SIZE} className="btn bg-neon disabled:opacity-50">{busy ? '…' : team ? 'Save crew' : 'Register crew'}</button>
        </div>
      </form>
    </ModalShell>
  );
}
