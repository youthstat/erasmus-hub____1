import { useApp } from '../../context/AppContext.jsx';

export default function RoleSwitcher() {
  const { isAdmin, openAuth, logoutAdmin } = useApp();
  return (
    <div className="flex items-center gap-1.5 border-[3px] border-ink bg-paper p-1.5 rounded-xl shadow-b4">
      <button onClick={logoutAdmin}
        className={`border-2 border-ink rounded-lg px-4 py-1.5 font-mono font-bold text-sm uppercase ${!isAdmin ? 'bg-neon shadow-b2' : 'bg-white'}`}>USER</button>
      <button onClick={() => !isAdmin && openAuth()}
        className={`border-2 border-ink rounded-lg px-4 py-1.5 font-mono font-bold text-sm uppercase ${isAdmin ? 'bg-sun shadow-b2' : 'bg-white hover:bg-sun'}`}>ADMIN</button>
    </div>
  );
}
