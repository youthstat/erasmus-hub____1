import { useGame, countryOf } from '../../hooks/useGame.js';

// Public board: who is still alive and who is already killed (crossed out)
export default function KillerBoard() {
  const { playing, dead } = useGame('kg');
  const sorted = [...playing].sort((a, b) => Number(dead.has(a.id)) - Number(dead.has(b.id)) || a.name.localeCompare(b.name));
  const aliveCount = playing.filter((u) => !dead.has(u.id)).length;
  const deadCount = playing.length - aliveCount;
  return (
    <section className="box shadow-b8 overflow-hidden" id="board">
      <div className="bg-ink text-white px-4 py-3 font-mono font-bold uppercase flex flex-wrap justify-between gap-2">
        <span>Who is still alive</span>
        <span><span className="text-neon">{aliveCount} alive</span> · <span className="text-hot">{deadCount} killed</span></span>
      </div>
      {aliveCount === 1 && deadCount > 0 && (
        <div className="bg-sun border-b-[3px] border-ink px-4 py-3 font-extrabold uppercase">
          🏆 Master Killer: {sorted[0].name}
        </div>
      )}
      <div className="p-4 sm:p-6 bg-paper grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sorted.map((u) => {
          const isDead = dead.has(u.id);
          return (
            <div key={u.id} className={`border-[3px] border-ink rounded-xl p-3 shadow-b2 flex items-center justify-between gap-2 ${isDead ? 'bg-white/60 text-mute' : 'bg-white'}`}>
              <div className="min-w-0">
                <div className={`font-bold uppercase truncate ${isDead ? 'line-through decoration-hot decoration-4' : ''}`}>{u.name}</div>
                <div className="font-mono text-[11px] text-mute truncate">{countryOf(u)}</div>
              </div>
              <span className={`tag shrink-0 ${isDead ? 'bg-hot text-white' : 'bg-neon text-ink'}`}>{isDead ? 'KILLED' : 'ALIVE'}</span>
            </div>
          );
        })}
        {sorted.length === 0 && <p className="font-mono text-sm col-span-full">No players yet.</p>}
      </div>
    </section>
  );
}
