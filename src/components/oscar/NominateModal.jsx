import { useState } from 'react';
import { useOscar } from '../../hooks/useOscar.js';
import { useApp } from '../../context/AppContext.jsx';
import { nominateTeam, returnToEditing } from '../../firebase/oscar.js';
import { fileToCover } from '../../utils/image.js';
import ModalShell from '../modals/ModalShell.jsx';

// The crew chooses who (and which film) goes to the voting in every category.
export default function NominateModal({ team, questions, onClose }) {
  const { nameOf } = useOscar();
  const { isAdmin } = useApp();
  const asked = questions.filter((q) => q.target === 'person' || q.target === 'film');
  const [sel, setSel] = useState(() => {
    const init = {};
    asked.forEach((q) => { const v = team.nominations?.[q.id]; init[q.id] = q.target === 'film' ? v === true : (Array.isArray(v) ? v : []); });
    return init;
  });
  const [cover, setCover] = useState(team.cover || '');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const cast = team.memberIds || [];

  const toggle = (qid, uid) => setSel((s) => ({ ...s, [qid]: s[qid].includes(uid) ? s[qid].filter((x) => x !== uid) : [...s[qid], uid] }));
  const all = (qid) => setSel((s) => ({ ...s, [qid]: s[qid].length === cast.length ? [] : [...cast] }));
  const count = Object.values(sel).filter((v) => (Array.isArray(v) ? v.length : v)).length;

  const run = async (fn) => { setBusy(true); setMsg(''); try { await fn(); onClose(); } catch (e) { setMsg(e.message); setBusy(false); } };
  const pickCover = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { setCover(await fileToCover(file)); setMsg(''); } catch (err) { setMsg(err.message); }
  };
  const send = (e) => {
    e.preventDefault();
    if (!cover) return setMsg('Add the cover image of your film.');
    if (!count) return setMsg('Choose at least one candidate for at least one category.');
    const out = {};
    asked.forEach((q) => { const v = sel[q.id]; if (q.target === 'film' ? v : v.length) out[q.id] = v; });
    if (!isAdmin && !confirm('Send your crew to the voting? After that NOTHING can be changed — not the crew, not the nominations. Only the organizers can return it to editing. Continue?')) return;
    run(() => nominateTeam(team.id, out, cover, isAdmin));
  };

  return (
    <ModalShell title={`Send to voting — ${team.title}`} onClose={onClose} maxW="max-w-3xl">
      <form onSubmit={send} className="flex flex-col gap-5">
        <p className="text-sm text-[#4b4731]">For every category tick who from your crew goes to the voting. In the ballot each name appears together with your film title. Check everything carefully: once you press “Send to voting” nothing can be changed or taken back — only the organizers can return the crew to editing.</p>
        <div className="border-[3px] border-ink rounded-xl overflow-hidden">
          <div className="bg-paper border-b-[3px] border-ink px-4 py-2"><div className="font-extrabold uppercase">Film cover *</div><div className="text-xs text-mute">The picture is shown at the top of every card of your film in the ballot.</div></div>
          <div className="p-3 flex flex-wrap items-center gap-4">
            <div className="w-48 aspect-video border-[3px] border-ink rounded-lg bg-ink overflow-hidden flex items-center justify-center text-white text-3xl">
              {cover ? <img src={cover} alt="Film cover" className="w-full h-full object-cover" /> : '🎬'}
            </div>
            <label className="btn bg-sun cursor-pointer text-xs">{cover ? 'Change cover' : '+ Add cover'}<input type="file" accept="image/*" className="hidden" onChange={pickCover} /></label>
          </div>
        </div>
        {asked.map((q) => (
          <div key={q.id} className="border-[3px] border-ink rounded-xl overflow-hidden">
            <div className="bg-paper border-b-[3px] border-ink px-4 py-2 flex flex-wrap items-center justify-between gap-2">
              <div><div className="font-extrabold uppercase">{q.title}</div><div className="text-xs text-mute">{q.text}</div></div>
              {q.target === 'person' && <button type="button" className="tag bg-sun" onClick={() => all(q.id)}>{sel[q.id].length === cast.length ? 'Clear all' : 'All cast'}</button>}
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {q.target === 'film' ? (
                <label className={`flex items-center gap-2 border-[3px] border-ink rounded-lg px-3 py-2 font-mono text-sm cursor-pointer ${sel[q.id] ? 'bg-neon font-bold' : 'bg-white'}`}>
                  <input type="checkbox" className="w-4 h-4 accent-ink" checked={sel[q.id]} onChange={(e) => setSel((s) => ({ ...s, [q.id]: e.target.checked }))} />
                  Our film: {team.title}
                </label>
              ) : cast.map((uid) => (
                <label key={uid} className={`flex items-center gap-2 border-[3px] border-ink rounded-lg px-3 py-2 font-mono text-sm cursor-pointer ${sel[q.id].includes(uid) ? 'bg-neon font-bold' : 'bg-white'}`}>
                  <input type="checkbox" className="w-4 h-4 accent-ink" checked={sel[q.id].includes(uid)} onChange={() => toggle(q.id, uid)} />
                  {nameOf(uid)}
                </label>
              ))}
            </div>
          </div>
        ))}
        {asked.length === 0 && <p className="font-mono text-sm">There are no categories with nominees yet.</p>}
        {msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>}
        <div className="flex flex-wrap justify-between gap-3 pt-2 border-t-2 border-ink">
          {isAdmin && team.nominated ? <button type="button" disabled={busy} className="btn bg-white" onClick={() => run(() => returnToEditing(team.id))}>Return to editing</button> : <span />}
          <div className="flex gap-3">
            <button type="button" className="btn bg-white" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy} className="btn bg-neon disabled:opacity-50">{busy ? '…' : team.nominated ? 'Update nomination' : 'Send to voting'}</button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
