import { PROOF_TYPES } from '../data/categories.js';

// old missions only have a free-text `proof` field
export const proofTypeOf = (m) => (PROOF_TYPES[m?.proofType] ? m.proofType : m?.proof ? 'comment' : 'confirm');
export const proofHintOf = (m) => m?.proofHint ?? m?.proof ?? '';

export const isHttp = (s) => /^https?:\/\//i.test(String(s || '').trim());
export function normalizeUrl(s) {
  let v = String(s || '').trim();
  if (!v || /\s/.test(v)) return '';
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.') ? u.href : '';
  } catch { return ''; }
}

// deadlines are dates only (no hours): the mission stays open until the end of that day
const endOfDay = (s) => new Date(`${String(s).slice(0, 10)}T23:59:59`);
export const deadlineText = (m) => (m?.deadlineAt ? endOfDay(m.deadlineAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : m?.deadline || '');
export const isExpired = (m) => !!m?.deadlineAt && endOfDay(m.deadlineAt).getTime() < Date.now();
