import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import ModalShell from './ModalShell.jsx';

export default function JoinModal({ next }) {
  const { closeModal, register, openMission } = useApp();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    await register({ name: name.trim(), country: country.trim() });
    next ? openMission(next) : closeModal();
  };

  return (
    <ModalShell title="Join the game" onClose={closeModal} maxW="max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm text-[#4b4731]">Enter your name so we can credit points to you. You start with 0.</p>
        <input className="input" required maxLength={40} placeholder="Your name or callsign" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" required maxLength={30} placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        <button type="submit" className="btn bg-neon w-full">Start playing</button>
      </form>
    </ModalShell>
  );
}
