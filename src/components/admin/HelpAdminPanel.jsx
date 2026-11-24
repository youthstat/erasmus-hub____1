import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { subscribeTickets, setTicketStatus, removeTicket } from '../../firebase/help.js';
import { PRIORITIES } from '../../config/settings.js';

const when = (t) => t.createdAt?.toDate?.().toLocaleDateString([], { day: '2-digit', month: 'short' }) || 'just now';
const fmt = (v) => (v ? String(v).replace('T', ' ') : '—');

// Admin: questions and absence notices from "Ask the Team"
export default function HelpAdminPanel() {
  const { setError } = useApp();
  const [tickets, setTickets] = useState([]);
  const [onlyNew, setOnlyNew] = useState(true);
  useEffect(() => subscribeTickets(setTickets, (e) => setError(e.message)), [setError]);
  const run = async (fn) => { try { await fn(); } catch (e) { setError(e.message); } };
  const fresh = tickets.filter((t) => t.status !== 'done').length;
  const rows = onlyNew ? tickets.filter((t) => t.status !== 'done') : tickets;

  return (
    <section className="box overflow-hidden">
      <div className="bg-hot text-white border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap items-center justify-between gap-2">
        <span>🆘 Ask the Team · {fresh} new · {tickets.length} total</span>
        <button className="tag bg-white text-ink" onClick={() => setOnlyNew(!onlyNew)}>{onlyNew ? 'SHOW ALL' : 'SHOW NEW ONLY'}</button>
      </div>
      <div className="divide-y-2 divide-ink max-h-[32rem] overflow-y-auto">
        {rows.map((t) => (
          <div key={t.id} className={`p-4 flex flex-col gap-2 ${t.status === 'done' ? 'opacity-60' : ''} ${t.priority === 'emergency' && t.status !== 'done' ? 'bg-hot/15' : ''}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag bg-ink text-white">CASE #{t.caseNo}</span>
              <span className="tag bg-sun">{t.categoryTitle}</span>
              {t.priority && t.priority !== 'normal' && <span className="tag bg-hot text-white">{PRIORITIES.find((p) => p.id === t.priority)?.id.toUpperCase()}</span>}
              <span className="font-mono text-xs text-mute ml-auto">{when(t)}</span>
            </div>
            <div className="font-mono text-xs">from <b>{t.anonymous ? 'Anonymous 🔒' : t.userName}</b>{t.contact && <> · contact: {t.contact}</>}{t.location && <> · location: {t.location}</>}</div>
            {t.absence ? (
              <div className="text-sm border-[3px] border-ink rounded-lg bg-white p-3 grid sm:grid-cols-2 gap-x-4 gap-y-1">
                <div className="sm:col-span-2"><b>Reason:</b> {t.absence.reason}</div>
                {t.absence.comment && <div className="sm:col-span-2"><b>Comment:</b> {t.absence.comment}</div>}
              </div>
            ) : <p className="whitespace-pre-line break-words text-sm">{t.text}</p>}
            <div className="flex gap-2">
              <button className="tag bg-neon" onClick={() => run(() => setTicketStatus(t.id, t.status === 'done' ? 'new' : 'done'))}>{t.status === 'done' ? 'REOPEN' : '✓ DONE'}</button>
              <button className="tag bg-white" onClick={() => confirm('Delete this message?') && run(() => removeTicket(t.id))}>DELETE</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="p-4 font-mono text-sm">{onlyNew ? 'No new messages.' : 'No messages yet.'}</p>}
      </div>
    </section>
  );
}
