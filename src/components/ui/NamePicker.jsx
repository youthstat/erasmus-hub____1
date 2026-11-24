import { useMemo, useState } from 'react';
import { countryOf } from '../../hooks/useGame.js';

// Type to search, click a name from the list. `value` is the chosen user id.
export default function NamePicker({ options, value, onChange, placeholder = 'Start typing your name…' }) {
  const [text, setText] = useState(() => options.find((o) => o.id === value)?.name || '');
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    return [...options].filter((o) => !q || o.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 40);
  }, [options, text]);

  const choose = (o) => { setText(o.name); setOpen(false); onChange(o); };
  const type = (e) => { setText(e.target.value); setOpen(true); if (value) onChange(null); };
  const onKey = (e) => {
    if (e.key === 'Enter' && open && !value && matches.length) { e.preventDefault(); choose(matches[0]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="relative">
      <input className="input" autoComplete="off" placeholder={placeholder} value={text}
        onChange={type} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKey} />
      {value && <span className="absolute right-3 top-1/2 -translate-y-1/2 tag bg-neon">✓</span>}
      {open && !value && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border-[3px] border-ink rounded-xl shadow-b4 divide-y-2 divide-ink/10">
          {matches.map((o) => (
            <li key={o.id}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); choose(o); }}
                className="w-full text-left px-4 py-2 hover:bg-sun/40 font-mono text-sm">
                <b>{o.name}</b>{countryOf(o) && <span className="text-mute"> — {countryOf(o)}</span>}
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="px-4 py-3 font-mono text-xs text-mute">No such name in the list. Ask the organizers to add you.</li>}
        </ul>
      )}
    </div>
  );
}
