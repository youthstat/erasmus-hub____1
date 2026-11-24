const PALETTE = ['bg-sun', 'bg-cobalt text-white', 'bg-neon', 'bg-hot text-white'];
export function categoryColor(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return PALETTE[h % PALETTE.length];
}
