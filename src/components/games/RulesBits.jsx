// Маленькі блоки для сторінок правил (у стилі сайту)
export const Step = ({ n, tag, title, children, cls = 'bg-sun' }) => (
  <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-white overflow-hidden flex flex-col">
    <div className={`${cls} border-b-[3px] border-ink px-4 py-2 font-mono text-xs font-bold uppercase flex justify-between`}>
      <span>Step {n}</span><span>{tag}</span>
    </div>
    <div className="p-4 flex flex-col gap-2">
      <h3 className="text-xl font-extrabold uppercase leading-tight">{title}</h3>
      {children}
    </div>
  </div>
);

export const Card = ({ title, children, cls = 'bg-white' }) => (
  <div className={`border-[3px] border-ink rounded-xl shadow-b4 p-4 ${cls}`}>
    <h4 className="font-mono text-xs font-bold uppercase mb-2">{title}</h4>
    <div className="text-sm font-medium flex flex-col gap-1.5">{children}</div>
  </div>
);

export const List = ({ items, mark = '•' }) => (
  <ul className="flex flex-col gap-1.5 text-sm font-medium">
    {items.map((t, i) => <li key={i} className="flex gap-2"><span className="font-mono font-bold">{mark}</span><span>{t}</span></li>)}
  </ul>
);

export const Banner = ({ title, children, cls = 'bg-sun' }) => (
  <div className={`box shadow-b8 p-6 md:p-10 ${cls}`}>
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase leading-tight tracking-tight">{title}</h1>
    <p className="text-base sm:text-lg mt-3 font-bold max-w-3xl">{children}</p>
  </div>
);
