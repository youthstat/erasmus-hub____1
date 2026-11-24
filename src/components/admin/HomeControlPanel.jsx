import { useApp } from '../../context/AppContext.jsx';
import { HOME_SECTIONS } from '../../config/settings.js';

// Admin: what participants see on the home screen. A hidden block disappears from the home page and its page
// shows "not open yet" to participants (the admin still sees everything, marked as hidden).
export default function HomeControlPanel() {
  const { homeHidden, setHomeHidden, setAllHomeHidden } = useApp();
  const ids = HOME_SECTIONS.map((s) => s.id);
  const hiddenCount = ids.filter((id) => homeHidden[id]).length;
  return (
    <section className="box overflow-hidden">
      <div className="bg-sun border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase flex flex-wrap items-center justify-between gap-3">
        <span>🏠 Home screen · {ids.length - hiddenCount} visible · {hiddenCount} hidden</span>
        <span className="flex gap-2">
          <button className="tag bg-white" onClick={() => setAllHomeHidden(ids, false)}>SHOW ALL</button>
          <button className="tag bg-white" onClick={() => setAllHomeHidden(ids, true)}>HIDE ALL</button>
        </span>
      </div>
      <div className="p-4 bg-paper grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOME_SECTIONS.map((s) => {
          const hidden = !!homeHidden[s.id];
          return (
            <label key={s.id} className={`border-[3px] border-ink rounded-xl px-3 py-2 flex items-center justify-between gap-3 cursor-pointer ${hidden ? 'bg-white opacity-70' : 'bg-neon'}`}>
              <span className="min-w-0"><span className="font-bold uppercase block truncate">{s.title}</span><span className="font-mono text-[11px]">{s.kind === 'block' ? 'block on the home page' : 'card + its page'}</span></span>
              <span className="flex items-center gap-2 font-mono text-xs font-bold shrink-0">
                {hidden ? 'HIDDEN' : 'VISIBLE'}
                <input type="checkbox" className="w-5 h-5 accent-ink" checked={!hidden} onChange={() => setHomeHidden(s.id, !hidden)} />
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
