import { useApp } from '../../context/AppContext.jsx';
import { isHttp } from '../../utils/mission.js';

function Proof({ s }) {
  if (s.proofType === 'link' && isHttp(s.proofValue))
    return <a href={s.proofValue} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-cobalt underline break-all">🔗 {s.proofValue}</a>;
  if (s.proofType === 'comment') return <p className="mt-1 text-sm bg-paper border-2 border-ink/20 rounded-lg px-3 py-2 whitespace-pre-line break-words">💬 {s.proofValue}</p>;
  return <span className="font-mono text-xs text-mute">✔ confirmed by participant (no link or comment)</span>;
}

export default function SubmissionsPanel() {
  const { submissions, approve, reject, clearSubmissions } = useApp();
  const pending = submissions.filter((s) => s.status === 'pending');
  const done = submissions.filter((s) => s.status !== 'pending').slice(0, 10);
  return (
    <section className="box overflow-hidden">
      <div className="bg-sun border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap items-center justify-between gap-2">
        <span>Mission submissions · {pending.length} waiting</span>
        <button className="tag bg-hot text-white disabled:opacity-40" disabled={!submissions.length}
          onClick={() => confirm(`Clear ALL ${submissions.length} mission completions of everybody? Points already paid stay, and every mission can be done again.`) && clearSubmissions(null)}>🗑 Clear all completions</button>
      </div>
      <div className="divide-y-2 divide-ink">
        {pending.map((s) => (
          <div key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <b>{s.userName}</b> completed <b>{s.missionTitle}</b>
              <div className="font-mono text-xs text-mute">+{s.points} PTS</div>
              <div className="mt-1"><Proof s={s} /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn bg-hot text-white text-xs" onClick={() => reject(s.id)}>✕ Reject</button>
              <button className="btn bg-neon text-xs" onClick={() => approve(s)}>✓ Approve +{s.points}</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="p-4 font-mono text-sm">Nothing to review.</p>}
        {done.map((s) => (
          <div key={s.id} className="p-3 text-sm flex justify-between gap-3 text-mute">
            <span className="min-w-0"><span>{s.userName} — {s.missionTitle}</span><div><Proof s={s} /></div></span>
            <span className={`font-mono font-bold shrink-0 ${s.status === 'approved' ? 'text-[#007a33]' : 'text-hot'}`}>{s.status === 'approved' ? '✓ APPROVED' : '✕ REJECTED'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
