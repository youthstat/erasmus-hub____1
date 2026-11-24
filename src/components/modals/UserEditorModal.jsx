import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { countryOf } from '../../hooks/useGame.js';
import ModalShell from './ModalShell.jsx';

// Admin: add a new participant or edit name / country / points of an existing one
export default function UserEditorModal({ user }) {
  const { closeModal, saveUser } = useApp();
  const [f, setF] = useState({ name: user?.name || '', country: countryOf(user), score: user?.score ?? 0 });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    await saveUser({ name: f.name.trim(), country: f.country.trim(), score: f.score }, user?.id);
    closeModal();
  };

  return (
    <ModalShell title={user ? 'Edit participant' : 'Add participant'} onClose={closeModal} maxW="max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">Name *
          <input className="input" required maxLength={40} value={f.name} onChange={set('name')} />
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">Country *
          <input className="input" required maxLength={30} value={f.country} onChange={set('country')} />
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">Points
          <input className="input" type="number" value={f.score} onChange={set('score')} />
        </label>
        <div className="flex justify-between gap-3 pt-3 border-t-2 border-ink">
          <button type="button" className="btn bg-white" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn bg-sun">{user ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </ModalShell>
  );
}
