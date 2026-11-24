import { useApp } from '../../context/AppContext.jsx';
import MissionCard from './MissionCard.jsx';

export default function MissionsSection() {
  const { missions, isAdmin, openEditor } = useApp();
  return (
    <section className="box shadow-b8 overflow-hidden">
      <div className="bg-sun border-b-[3px] border-ink px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-extrabold uppercase">⚡ Active missions // earn extra points</h2>
          <span className="tag bg-hot text-white shadow-b2">{missions.length} AVAILABLE</span>
        </div>
        {isAdmin && <button className="btn bg-ink text-sun text-xs" onClick={() => openEditor(null)}>+ New mission</button>}
      </div>
      <div className="p-4 sm:p-6 bg-paper grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {missions.map((m) => <MissionCard key={m.id} mission={m} />)}
        {missions.length === 0 && <p className="font-mono col-span-full">No missions yet. {isAdmin ? 'Create the first one or load demo missions in the Admin panel.' : 'Check back soon.'}</p>}
      </div>
    </section>
  );
}
