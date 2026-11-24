import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { CATEGORIES, PROOF_TYPES } from '../../data/categories.js';
import { proofTypeOf, proofHintOf } from '../../utils/mission.js';
import ModalShell from './ModalShell.jsx';

// NB: defined OUTSIDE the modal. Inside it, React re-creates the component on every keystroke,
// the input loses focus and you can type only one letter at a time.
const L = ({ t, children }) => <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">{t}{children}</label>;

const EMPTY = { title: '', category: '', points: 100, short: '', details: '', proofType: 'confirm', proofHint: '', deadlineAt: '', recurrence: 'ONE-OFF', active: true };

export default function MissionEditorModal({ mission }) {
  const { closeModal, saveMission, allMissions } = useApp();
  const [f, setF] = useState(mission
    ? { ...EMPTY, ...mission, proofType: proofTypeOf(mission), proofHint: proofHintOf(mission), deadlineAt: String(mission.deadlineAt || '').slice(0, 10) }
    : EMPTY);
  const [custom, setCustom] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const categories = [...new Set([...CATEGORIES, ...allMissions.map((m) => m.category).filter(Boolean)])];

  const pickCategory = (e) => {
    if (e.target.value === '__other__') { setCustom(true); setF((p) => ({ ...p, category: '' })); }
    else { setCustom(false); setF((p) => ({ ...p, category: e.target.value })); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const { id, createdAt, ...data } = f;
    await saveMission({ ...data, points: Number(data.points), category: data.category.trim().toUpperCase() }, mission?.id);
    closeModal();
  };

  return (
    <ModalShell title={mission ? 'Edit mission' : 'New mission'} onClose={closeModal} maxW="max-w-3xl">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <L t="Title *"><input className="input" required value={f.title} onChange={set('title')} /></L>
        <div className="grid sm:grid-cols-3 gap-4">
          <L t="Category *">
            <select className="input" required={!custom} value={custom ? '__other__' : f.category} onChange={pickCategory}>
              <option value="">Choose category…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__other__">Other (type my own)…</option>
            </select>
            {custom && <input className="input mt-2" required placeholder="New category name" value={f.category} onChange={set('category')} />}
          </L>
          <L t="Reward points *"><input className="input" type="number" required value={f.points} onChange={set('points')} /></L>
          <L t="Repeat"><select className="input" value={f.recurrence} onChange={set('recurrence')}><option value="ONE-OFF">One-off</option><option value="DAILY">Every day</option></select></L>
        </div>
        <L t="Short description (card)"><textarea className="input" rows="2" value={f.short} onChange={set('short')} /></L>
        <L t="Full instructions (popup) *"><textarea className="input" rows="6" required value={f.details} onChange={set('details')} /></L>

        <div className="grid sm:grid-cols-2 gap-4">
          <L t="Required proof *">
            <select className="input" value={f.proofType} onChange={set('proofType')}>
              {Object.entries(PROOF_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="normal-case font-normal text-mute">{PROOF_TYPES[f.proofType].participant}. You approve or reject it in the admin panel.</span>
          </L>
          <L t="Deadline (date)">
            <div className="flex gap-2">
              <input className="input" type="date" value={f.deadlineAt} onChange={set('deadlineAt')} />
              {f.deadlineAt && <button type="button" className="btn bg-white px-3" title="Remove deadline" onClick={() => setF((p) => ({ ...p, deadlineAt: '' }))}>✕</button>}
            </div>
            <span className="normal-case font-normal text-mute">The mission stays open until the end of this day. Empty = no deadline.</span>
          </L>
        </div>
        {f.proofType !== 'confirm' && (
          <L t="What exactly should they send? (hint for participants)">
            <textarea className="input" rows="2" placeholder={f.proofType === 'link' ? 'e.g. Link to your Instagram story or a shared album' : 'e.g. Describe in 2–3 sentences what you learned'}
              value={f.proofHint} onChange={set('proofHint')} />
          </L>
        )}

        <label className="flex items-center gap-2 font-mono text-sm font-bold">
          <input type="checkbox" checked={f.active} onChange={set('active')} /> Visible to participants
        </label>
        <div className="flex justify-between gap-3 pt-3 border-t-2 border-ink">
          <button type="button" className="btn bg-white" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn bg-sun">Save mission</button>
        </div>
      </form>
    </ModalShell>
  );
}
