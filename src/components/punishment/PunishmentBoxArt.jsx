// The black "PUNISHMENT BOX" drawn in SVG, animated like the storyboards:
//   lid frames: 0 closed · 1 ajar · 2 half-open · 3 open   (the page steps through them one by one)
//   flight 'in'  : a folded paper arcs over the box and drops inside
//   flight 'out' : a folded paper pops out of the open box
//   pulse        : the little "impact" ticks next to the box (changes every time the lid closes)
const INK = '#111';
const LINE = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };

function FoldedPaper() {
  return (
    <g {...LINE} strokeWidth="2.5">
      <polygon points="-17,12 19,8 20,14 -16,18" fill="#d9d2c3" />
      <polygon points="-18,-10 16,-15 20,8 -14,12" fill="#f6f1e7" />
      <path d="M0,-12 L3,10" fill="none" strokeWidth="1.6" />
    </g>
  );
}

function Lid({ frame }) {
  if (frame === 0) return (
    <g {...LINE}>
      <polygon points="54,110 206,110 256,80 104,80" fill="#2b2b2b" />
      <polygon points="54,110 206,110 206,136 54,136" fill="#1c1c1c" />
      <polygon points="206,110 256,80 256,106 206,136" fill="#101010" />
    </g>
  );
  if (frame === 1) return (
    <g {...LINE} transform="translate(-6,-18) rotate(-5 130 110)">
      <polygon points="54,110 206,110 256,80 104,80" fill="#2b2b2b" />
      <polygon points="54,110 206,110 206,136 54,136" fill="#1c1c1c" />
      <polygon points="206,110 256,80 256,106 206,136" fill="#101010" />
    </g>
  );
  if (frame === 2) return (
    <g {...LINE}>
      <polygon points="104,100 250,100 268,52 118,42" fill="#242424" />
      <polygon points="118,42 268,52 269,62 119,52" fill="#101010" />
    </g>
  );
  return null;                                                    // frame 3 is drawn behind the box
}

export default function PunishmentBoxArt({ lid = 0, flight = null, flightKey = 0, pulse = 0, onClick, disabled, label = 'Open the box' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="block w-full max-w-md mx-auto bg-transparent border-0 p-0 cursor-pointer disabled:cursor-wait focus:outline-none focus-visible:ring-4 focus-visible:ring-sun rounded-xl">
      <svg viewBox="-20 -20 340 290" className="w-full h-auto overflow-visible" role="img" aria-hidden="true">
        {/* shadow on the floor */}
        <polygon points="40,244 210,244 300,214 140,214" fill="rgba(0,0,0,.16)" />

        {/* fully open lid stands behind the box */}
        {lid === 3 && (
          <g {...LINE}>
            <polygon points="108,100 250,100 276,8 128,-4" fill="#232323" />
            <polygon points="128,-4 276,8 277,18 129,6" fill="#101010" />
            <polygon points="118,88 240,88 262,18 134,8" fill="none" stroke="#444" strokeWidth="1.5" />
          </g>
        )}

        {/* opening of the box */}
        <g {...LINE}>
          <polygon points="60,130 200,130 250,100 110,100" fill="#050505" />
          <polygon points="74,127 192,127 236,104 118,104" fill="#161616" stroke="#2f2f2f" strokeWidth="1.5" />
        </g>

        {/* papers travel BEHIND the front wall, so they disappear into / come out of the box */}
        {flight === 'in' && (
          <g transform="translate(150,60)"><g key={flightKey} className="pb-paper-in"><FoldedPaper /></g></g>
        )}
        {flight === 'out' && (
          <g transform="translate(152,126)"><g key={flightKey} className="pb-paper-out"><FoldedPaper /></g></g>
        )}

        {/* body */}
        <g {...LINE}>
          <polygon points="60,130 200,130 200,240 60,240" fill="#1a1a1a" />
          <polygon points="200,130 250,100 250,210 200,240" fill="#0f0f0f" />
        </g>
        <g fill="#efe7da" fontFamily="'Space Grotesk', sans-serif" fontWeight="800" textAnchor="middle" style={{ textTransform: 'uppercase' }}>
          <text x="130" y="178" fontSize="17" letterSpacing="0.5">Punishment</text>
          <text x="130" y="216" fontSize="38" letterSpacing="1">Box</text>
        </g>

        <Lid frame={lid} />

        {/* impact ticks, like in the storyboard */}
        {pulse > 0 && (
          <g key={pulse} className="pb-burst" fill={INK}>
            <polygon points="262,52 296,26 270,64" />
            <polygon points="268,40 292,0 278,48" />
            <polygon points="256,34 262,-10 270,38" />
          </g>
        )}
      </svg>
    </button>
  );
}
