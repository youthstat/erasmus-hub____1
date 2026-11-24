import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { categoryColor } from '../../utils/categoryColor.js';
import { PROOF_TYPES } from '../../data/categories.js';
import { proofTypeOf, proofHintOf, normalizeUrl, deadlineText, isExpired } from '../../utils/mission.js';
import ModalShell from './ModalShell.jsx';

export default function MissionModal({ mission }) {
  const { closeModal, openThanks, openAccount, openEditor, deleteMission, submitMission, isAdmin, profile, statusFor, submissions, clearSubmissions } = useApp();
  const doneCount = isAdmin ? submissions.filter((s) => s.missionId === mission.id).length : 0;
  const status = profile ? statusFor(mission) : null;
  const expired = isExpired(mission);
  const blocked = status === 'pending' || status === 'approved' || expired;
  const type = proofTypeOf(mission);
  const hint = proofHintOf(mission);

  const [link, setLink] = useState('');
  const [comment, setComment] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  const confirmMission = async () => {
    if (!profile) return openAccount(mission);
    let value = 'confirmed';
    if (type === 'link') {
      value = normalizeUrl(link);
      if (!value) return setErr('Paste a valid link, e.g. https://instagram.com/…');
    } else if (type === 'comment') {
      value = comment.trim();
      if (value.length < 3) return setErr('Write a short comment.');
    } else if (!ok) return setErr('Tick the box to confirm.');
    await submitMission(mission, { type, value });
    openThanks();
  };

  return (
    <ModalShell title="Mission briefing" onClose={closeModal} maxW="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-ink">
        <div className="flex flex-wrap gap-2">
          <span className={`tag shadow-b2 ${categoryColor(mission.category)}`}>{mission.category}</span>
          <span className="tag bg-sun shadow-b2">+{mission.points} PTS</span>
        </div>
        <span className={`font-mono text-xs font-bold ${expired ? 'text-hot' : 'text-[#4b4731]'}`}>
          {mission.recurrence}{deadlineText(mission) && ` // ${expired ? 'CLOSED' : 'UNTIL'} ${deadlineText(mission)}`}
        </span>
      </div>
      <h2 className="text-xl md:text-2xl font-bold uppercase leading-tight">{mission.title}</h2>
      <div className="p-5 bg-[#f6f3f2] border-[3px] border-ink rounded-xl shadow-b4">
        <div className="font-mono text-xs font-bold uppercase mb-2">What to do</div>
        <p className="leading-relaxed whitespace-pre-line">{mission.details}</p>
      </div>
      <div className="p-4 bg-sun border-[3px] border-ink rounded-xl shadow-b4">
        <div className="font-mono text-xs font-extrabold uppercase">Required proof: {PROOF_TYPES[type].short}</div>
        {hint && <p className="text-sm font-medium mt-1">{hint}</p>}
        <p className="font-mono text-xs font-bold text-[#4b4731] mt-1">Moderators check it, then points are credited.</p>
      </div>

      {!isAdmin && !blocked && (
        <div className="flex flex-col gap-2">
          {type === 'link' && <input className="input" placeholder="https://…" value={link} onChange={(e) => { setLink(e.target.value); setErr(''); }} />}
          {type === 'comment' && <textarea className="input" rows="4" placeholder="Write your comment…" value={comment} onChange={(e) => { setComment(e.target.value); setErr(''); }} />}
          {type === 'confirm' && (
            <label className="flex items-center gap-2 font-mono text-sm font-bold">
              <input type="checkbox" checked={ok} onChange={(e) => { setOk(e.target.checked); setErr(''); }} /> I confirm that I completed this mission
            </label>
          )}
          {err && <p className="font-mono text-sm font-bold text-hot">{err}</p>}
          {!profile && <p className="font-mono text-xs text-mute">You will be asked to sign in or register first.</p>}
        </div>
      )}
      {status && !isAdmin && (
        <p className="font-mono font-bold">
          {status === 'pending' && '⏳ Already sent — waiting for moderator review.'}
          {status === 'approved' && '✓ Completed. Points credited.'}
          {status === 'rejected' && '✕ Rejected by moderator. You can send it again.'}
        </p>
      )}
      {expired && !isAdmin && <p className="font-mono font-bold text-hot">The deadline has passed.</p>}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t-2 border-ink">
        <button className="btn bg-white" onClick={closeModal}>← Back to missions</button>
        {isAdmin ? (
          <div className="flex gap-3">
            {doneCount > 0 && <button className="btn bg-white" onClick={() => confirm(`Clear everyone who completed this mission (${doneCount})? Points already paid stay.`) && clearSubmissions(mission.id)}>Clear done ({doneCount})</button>}
            <button className="btn bg-hot text-white" onClick={() => { if (confirm('Delete this mission?')) { deleteMission(mission.id); closeModal(); } }}>Delete</button>
            <button className="btn bg-sun" onClick={() => openEditor(mission)}>Edit</button>
          </div>
        ) : (
          <button className="btn bg-sun disabled:opacity-40" disabled={blocked} onClick={confirmMission}>Send mission →</button>
        )}
      </div>
    </ModalShell>
  );
}
