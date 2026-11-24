import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import ModalShell from './ModalShell.jsx';

export default function AdminAuthModal() {
  const { closeModal, tryAdminLogin } = useApp();
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (tryAdminLogin(pw)) navigate('/admin');
    else setError(true);
  };

  return (
    <ModalShell title="Admin access" onClose={closeModal} maxW="max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm text-[#4b4731]">Enter the administrator password to unlock admin mode.</p>
        <input type="password" autoFocus className="input" placeholder="••••" value={pw}
          onChange={(e) => { setPw(e.target.value); setError(false); }} />
        {error && <p className="font-mono text-sm font-bold text-hot">Wrong password. Try again.</p>}
        <button type="submit" className="btn bg-sun w-full">Confirm</button>
      </form>
    </ModalShell>
  );
}
