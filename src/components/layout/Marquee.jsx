export default function Marquee({ items, className = 'bg-sun text-ink' }) {
  const list = [...items, ...items];
  return (
    <div className={`w-full border-y-[3px] border-ink overflow-hidden py-2 select-none ${className}`}>
      <div className="inline-flex whitespace-nowrap gap-8 font-mono font-bold uppercase tracking-wider text-sm animate-marquee">
        {list.map((t, i) => <span key={i}>{t} ///</span>)}
      </div>
    </div>
  );
}
