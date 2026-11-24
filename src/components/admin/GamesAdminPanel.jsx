import { useApp } from '../../context/AppContext.jsx';
import * as games from '../../firebase/games.js';
import { isJoined } from '../../firebase/games.js';
import { useGame, countryOf } from '../../hooks/useGame.js';

// Admin: choose who plays which game
function WhoPlays() {
  const { users, setError } = useApp();
  const sf = useGame('sf');
  const kg = useGame('kg');
  const toggle = async (game, g, id) => {
    const plays = g.excluded.has(id);                       // currently off -> switch on
    if (!plays && !confirm(`Remove ${g.nameOf(id)} from ${game === 'sf' ? 'Secret friend' : 'Killer game'}? ${game === 'kg' ? 'They will be marked as killed and their hunter inherits the contract.' : 'Their link will be removed and freed.'}`)) return;
    try { await games.setPlays(game, id, plays, g.nameOf); } catch (e) { setError(e.message); }
  };
  const Box = ({ game, g, id }) => (
    <input type="checkbox" className="w-5 h-5 accent-ink" checked={!g.excluded.has(id)} onChange={() => toggle(game, g, id)} />
  );
  return (
    <section className="box overflow-hidden">
      <div className="bg-sun border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase">Who plays which game</div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-[#ebe7e7] border-b-[3px] border-ink font-mono text-xs uppercase">
            <th className="p-3">Participant</th><th className="p-3">Country</th>
            <th className="p-3 text-center">Secret friend</th><th className="p-3 text-center">Killer game</th>
          </tr></thead>
          <tbody className="divide-y-2 divide-ink">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3 font-bold">{u.name}</td>
                <td className="p-3 text-mute">{countryOf(u)}</td>
                <td className="p-3 text-center"><Box game="sf" g={sf} id={u.id} /></td>
                <td className="p-3 text-center"><Box game="kg" g={kg} id={u.id} /></td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="4" className="p-4 font-mono">No participants yet. Add them in the leaderboard below.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="p-3 font-mono text-xs text-mute border-t-[3px] border-ink">Tip: set this before the draw. Checked = plays. A person switched off in Killer game is counted as killed.</p>
    </section>
  );
}

function Links({ game, title, cls }) {
  const { setError } = useApp();
  const g = useGame(game);
  const { players, playing, dead, nameOf } = g;
  const reset = async () => {
    if (!confirm(`Reset "${title}"? All players, numbers and links will be deleted.`)) return;
    try { await games.resetGame(game); } catch (e) { setError(e.message); }
  };
  const kill = async (id) => {
    if (!confirm(`Eliminate ${nameOf(id)}? Their hunter inherits the contract.`)) return;
    try { await games.adminEliminate(id, nameOf); } catch (e) { setError(e.message); }
  };
  const revive = async (id) => {
    if (!confirm(`Bring ${nameOf(id)} back to the game? Their hunter gets them as the target again.`)) return;
    try {
      await games.revivePlayer(id, nameOf);
      if (g.excluded.has(id)) await games.setPlays(game, id, true, nameOf);   // they were also switched off in "Who plays"
    } catch (e) { setError(e.message); }
  };
  const rows = players.filter((p) => isJoined(p) || p.dead);
  return (
    <section className="box overflow-hidden">
      <div className={`${cls} border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap justify-between gap-2`}>
        <span>{title} · {rows.filter(isJoined).length} joined · {rows.filter((p) => p.targetId).length} received a name{game === 'kg' ? ` · ${playing.length - playing.filter((u) => dead.has(u.id)).length} alive` : ''}</span>
        <button className="tag bg-white text-ink" onClick={reset}>RESET GAME</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-[#ebe7e7] border-b-[3px] border-ink font-mono text-xs uppercase">
            <th className="p-3">Player</th><th className="p-3">{game === 'sf' ? '→ Secret friend of' : '→ Hunts'}</th>
            {game === 'kg' && <><th className="p-3">Weapon</th><th className="p-3">Own item</th><th className="p-3">Status</th><th className="p-3" /></>}
          </tr></thead>
          <tbody className="divide-y-2 divide-ink">
            {rows.map((p) => (
              <tr key={p.id} className={p.dead ? 'text-mute' : ''}>
                <td className={`p-3 font-bold ${p.dead ? 'line-through' : ''}`}>{nameOf(p.id)}</td>
                <td className="p-3">{p.targetId && !p.dead ? nameOf(p.targetId) : <span className="text-mute">—</span>}</td>
                {game === 'kg' && <>
                  <td className="p-3">{p.itemText || <span className="text-mute">—</span>}</td>
                  <td className="p-3">{p.item}</td>
                  <td className="p-3"><span className={`tag ${p.dead ? 'bg-hot text-white' : 'bg-neon text-ink'}`}>{p.dead ? 'KILLED' : 'ALIVE'}</span></td>
                  <td className="p-3">{p.dead
                    ? <button className="tag bg-neon text-ink" onClick={() => revive(p.id)} title="Undo the kill">↩ REVIVE</button>
                    : <button className="tag bg-white" onClick={() => kill(p.id)}>ELIMINATE</button>}</td>
                </>}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="6" className="p-4 font-mono">Nobody joined yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function GamesAdminPanel() {
  return (
    <>
      <WhoPlays />
      <Links game="sf" title="Secret friend links" cls="bg-neon" />
      <Links game="kg" title="Killer game contracts" cls="bg-hot text-white" />
    </>
  );
}
