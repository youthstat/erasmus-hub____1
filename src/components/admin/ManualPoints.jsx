import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function ManualPoints() {
  const { users, adjustPoints } = useApp();
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState('');

  const apply = (sign) => {
    if (!userId || !amount) return;
    adjustPoints(userId, sign * Math.abs(Number(amount)), reason || 'Manual');
    setReason('');
  };

  return (
    <section className="box overflow-hidden">
      <div className="bg-sun border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase">Add or subtract points</div>
      <div className="p-4 grid md:grid-cols-4 gap-3 items-end">
        <select className="input shadow-none" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Choose participant…</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.score})</option>)}
        </select>
        <input className="input shadow-none" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="input shadow-none" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn bg-hot text-white flex-1" onClick={() => apply(-1)}>− Subtract</button>
          <button className="btn bg-neon flex-1" onClick={() => apply(1)}>+ Add</button>
        </div>
      </div>
    </section>
  );
}
