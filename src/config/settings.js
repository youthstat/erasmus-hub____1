/* =====================================================================================================
   ЄДИНИЙ ФАЙЛ НАЛАШТУВАНЬ — усе, що може змінюватися, змінюйте тільки тут.
   (паролі, контакти, посилання, розклад сесій, правила, тексти, бали). Після змін: збережіть і задеплойте.
   ===================================================================================================== */

/* ---------- Паролі та посилання ---------- */
export const ADMIN_PASSWORD = '1234';                           // пароль адміністратора
export const PADLET_URL = 'https://padlet.com/auth/login';      // посилання на Padlet (Daily reflection)

/* ---------- Контакти організаторів (сторінка "Ask the Team") ---------- */
export const CONTACTS = {
  dutyPhone: '+380 XX XXX XX XX',        // черговий координатор, 24/7
  telegram: '@erasmus_duty',             // Telegram чергового
  medicalRoom: 'Room 101 (1st floor)',   // медпункт / аптечка
  emergencyNumber: '112',                // єдиний номер екстрених служб
  infoDesk: 'Info desk in the central hall',
};

/* ---------- Rattie Patty (мишка) ---------- */
export const GOSSIP_POINTS = 1;          // балів за один госіп
export const GOSSIP_MIN_WORDS = 4;       // мінімум слів (більше трьох = 4+)
export const MAX_GOSSIP_LENGTH = 500;    // максимум символів

/* Категорії звернень. kind: 'absence' = окрема форма "запізнитись / відсутній на сесії"; решта мають однакові поля */
export const HELP_CATEGORIES = [
  { id: 'absence',  icon: '🏃', title: 'Late / absent notice', kind: 'absence', hint: 'Tell the organizers that you will be late or absent and why. Write in the comment anything they should know.' },
  { id: 'medical',  icon: '🏥', title: 'Medical & wellbeing', hint: 'Symptoms, medication, first aid. In an emergency call the number on the right first.' },
  { id: 'room',     icon: '🏠', title: 'Accommodation & room', hint: 'Lost key, heating, noise, linen, Wi-Fi in the room.' },
  { id: 'conflict', icon: '🛡️', title: 'Conflict & safeguarding', hint: 'Any uncomfortable or unsafe situation. You can stay anonymous.' },
  { id: 'mental',   icon: '🧠', title: 'Mental & emotional support', hint: 'Stress, homesickness, burnout. A facilitator will talk to you privately.' },
  { id: 'food',     icon: '🍽️', title: 'Food & allergies', hint: 'Dietary restrictions, allergies, meal problems.' },
  { id: 'logistics', icon: '📄', title: 'Logistics, passport & travel', hint: 'Tickets, transfers, documents, schedule changes.' },
  { id: 'other',    icon: '💬', title: 'Other question', hint: 'Anything else for the organizers and facilitators.' },
];
export const PRIORITIES = [
  { id: 'normal', label: 'Normal' },
  { id: 'urgent', label: 'Urgent (today / before the next session)' },
  { id: 'emergency', label: 'Emergency (immediately)' },
];
export const COMMON_RESOLUTIONS = [
  'Lost room key or participant badge',
  'Unable to attend a session / illness notice',
  'Medication or temperature check',
  'Interpersonal / team conflict resolution',
  'Schedule, travel tickets or meal adjustments',
];

/* ---------- Oscar Night ---------- */
export const MAX_TEAM_SIZE = 6;          // максимум людей у команді
export const OSCAR_STAGES = [            // етапи вечора (сторінка Oscar Night)
  { title: 'Squad formation', text: 'Create your film crew: title, director and up to 6 members.' },
  { title: 'Secret topic draw', text: 'Receive the mandatory constraints: a prop, a spoken keyphrase and a genre.' },
  { title: 'Shooting & editing sprint', text: 'Shoot across campus and render the final MP4. Finish before the screening.' },
  { title: 'Red carpet premiere', text: 'All films are screened in the auditorium. Before it, send your crew to the voting.' },
  { title: 'Voting & awards ceremony', text: 'Everybody votes once. The winners are announced live.' },
];
export const OSCAR_PRIZES = [
  { label: 'Grand jury prize', value: '+2,000 PTS', note: 'Best Movie' },
  { label: 'Category winners', value: '+1,000 PTS', note: 'Acting / sound / camera…' },
  { label: 'Official selection', value: '+500 PTS', note: 'All validated entries' },
];
/* Питання голосування за замовчуванням (адмін може змінювати їх в Admin panel → Oscar Night).
   target: 'person' = учасники команд, яких висунули  ·  'film' = фільм (команда)  ·  'text' = вільний текст.
   required: чи обов'язкове для відправки бюлетеня. */
export const OSCAR_QUESTIONS = [
  { id: 'sound',    title: 'Best sound',      text: 'Score, mixing, dialogue clarity and foley.', target: 'person', required: true },
  { id: 'camera',   title: 'Best camera',     text: 'Cinematography, framing, lighting.', target: 'person', required: true },
  { id: 'director', title: 'Best director',   text: 'Vision, cast coordination, pacing.', target: 'person', required: true },
  { id: 'creative', title: 'Most creative',   text: 'Original concept, bold experiments, inventive set design.', target: 'film', required: true },
  { id: 'actor',    title: 'Best actor',      text: 'Outstanding male lead or ensemble performance.', target: 'person', required: true },
  { id: 'actress',  title: 'Best actress',    text: 'Outstanding female lead or ensemble performance.', target: 'person', required: true },
  { id: 'movie',    title: 'Best movie',      text: 'The best film of the festival.', target: 'film', required: true },
  { id: 'script',   title: 'Best screenplay & storytelling', text: 'Narrative arc, dialogue, emotional payoff.', target: 'film', required: true },
  { id: 'editing',  title: 'Best editing & pacing', text: 'Rhythm, cuts and transitions.', target: 'film', required: true },
  { id: 'meme',     title: 'Funniest moment / meme', text: 'Describe the shot, blooper or quote that made the room laugh.', target: 'text', required: false },
  { id: 'praise',   title: 'Personal praise (optional)', text: 'A kind word for a team or a person.', target: 'text', required: false },
];
export const OSCAR_THANKS = 'Thank you for filling in the form! Your vote has been recorded.';

/* ---------- Головна сторінка ---------- */
export const HOME_MARQUEE_TOP = ['PROTOCOL V2.4 ONLINE', 'ALL-HANDS LIVE TRANSMISSION', 'DISPATCH SIGNALS ONLY'];
export const HOME_MARQUEE_BOTTOM = ['TERMINAL ACTIVE', 'NEXT SECRET GATHERING: ANNOUNCED SOON', 'BRING PHYSICAL BADGES'];

/* ---------- Punishment box ---------- */
export const PUNISHMENT_COST = 3;          // скільки балів віднімається за кожен витягнутий панішмент
export const PUNISHMENT_REWARD = 1;        // скільки балів додається за кожен написаний панішмент
export const PUNISHMENT_MIN_LENGTH = 5;    // мінімум символів
export const PUNISHMENT_MAX_LENGTH = 200;  // максимум символів

/* ---------- Що показується учасникам на головному екрані (Admin panel → Home screen) ---------- */
export const HOME_SECTIONS = [
  { id: 'missions', title: 'Missions', kind: 'block' },
  { id: 'ranking', title: 'Ranking (list of participants)', kind: 'block' },
  { id: 'schedule', title: 'Schedule & timeline', kind: 'card' },
  { id: 'secret-friend', title: 'Secret friend', kind: 'card' },
  { id: 'killer-game', title: 'Killer game', kind: 'card' },
  { id: 'oscar', title: 'Oscar Night', kind: 'card' },
  { id: 'punishment', title: 'Punishment box', kind: 'card' },
  { id: 'ask', title: 'Ask the Team', kind: 'card' },
  { id: 'gossips', title: 'Gossip board', kind: 'card' },
  { id: 'reflection', title: 'Daily reflection', kind: 'card' },
];
