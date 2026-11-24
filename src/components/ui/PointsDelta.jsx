// Last point change next to a score: translucent green "+50" / red "−10"
export default function PointsDelta({ change }) {
  if (!change || !change.delta) return null;
  const plus = change.delta > 0;
  return (
    <span title={change.reason || ''}
      className={`ml-2 align-middle rounded px-1.5 py-0.5 font-mono text-xs font-bold ${plus ? 'bg-neon/30 text-[#007a33]' : 'bg-hot/20 text-hot'}`}>
      {plus ? '+' : '−'}{Math.abs(change.delta)}
    </span>
  );
}
