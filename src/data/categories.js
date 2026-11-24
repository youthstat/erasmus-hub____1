// Mission categories for a youth-work project. The admin picks one in the mission editor
// (a custom category can still be typed via "Other…").
export const CATEGORIES = [
  'SOCIAL MEDIA',
  'ACTIVITIES',
  'HELPING',
  'CLEANING',
  'TEAMWORK',
  'INTERCULTURAL',
  'LANGUAGES',
  'CREATIVITY',
  'SPORT & WELLBEING',
  'ECO & NATURE',
  'LEARNING',
  'EXPLORATION',
  'CULTURE & TRADITIONS',
  'FUN & GAMES',
];

// What the participant has to send when they confirm a mission
export const PROOF_TYPES = {
  link: { label: 'Link', participant: 'Paste a link as proof', short: 'LINK' },
  comment: { label: 'Comment', participant: 'Write a short comment as proof', short: 'COMMENT' },
  confirm: { label: 'Just confirmation', participant: 'Tick the box to confirm you did it', short: 'CONFIRMATION' },
};
