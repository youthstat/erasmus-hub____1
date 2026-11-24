import { useApp } from '../../context/AppContext.jsx';
import { categoryColor } from '../../utils/categoryColor.js';
import { deadlineText, isExpired } from '../../utils/mission.js';

const STATUS = { pending: ['UNDER REVIEW', 'bg-sun'], approved: ['COMPLETED ✓', 'bg-neon'], rejected: ['REJECTED', 'bg-hot text-white'] };

export default function MissionCard({ mission }) {
  const { openMission, isAdmin, openEditor, statusFor, profile, submissions, clearSubmissions } = useApp();
  const doneCount = isAdmin ? submissions.filter((s) => s.missionId === mission.id).length : 0;
  const clearDone = (e) => {
    e.stopPropagation();
    if (confirm(`Clear everyone who completed “${mission.title}”? ${doneCount} record(s) will be deleted. Points already paid stay, and participants can send this mission again.`)) clearSubmissions(mission.id);
  };
  const st = !isAdmin && profile ? STATUS[statusFor(mission)] : null;
  return (
    <div onClick={() => openMission(mission)}
      className={`border-[3px] border-ink bg-white p-4 rounded-xl shadow-b4 hover:shadow-b6 transition-all flex flex-col justify-between cursor-pointer ${mission.active === false ? 'opacity-60' : ''}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1">
          <span className={`tag ${categoryColor(mission.category)}`}>{mission.category}</span>
          <span className="tag bg-neon">+{mission.points} PTS</span>
        </div>
        <h4 className="font-bold uppercase leading-tight mt-1">{mission.title}</h4>
        <p className="text-xs text-mute">{mission.short}</p>
      </div>
      <div className="mt-4 pt-3 border-t-2 border-ink flex items-center justify-between gap-2">
        <span className={`font-mono text-[10px] ${isExpired(mission) ? 'text-hot font-bold' : 'text-mute'}`}>
          {deadlineText(mission) && `${isExpired(mission) ? 'CLOSED ' : 'UNTIL '}${deadlineText(mission)}`}
        </span>
        <div className="flex gap-2">
          {mission.active === false && <span className="tag bg-paper">HIDDEN</span>}
          {isAdmin && doneCount > 0 && <button className="tag bg-hot text-white" onClick={clearDone}>CLEAR DONE · {doneCount}</button>}
          {isAdmin && <button className="tag bg-white" onClick={(e) => { e.stopPropagation(); openEditor(mission); }}>EDIT</button>}
          {st ? <span className={`tag ${st[1]}`}>{st[0]}</span> : <span className="tag bg-sun">DETAILS →</span>}
        </div>
      </div>
    </div>
  );
}
