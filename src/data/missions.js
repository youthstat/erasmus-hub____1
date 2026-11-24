// Демо-місії: адмін може завантажити їх у базу однією кнопкою (Admin -> Load demo missions)
export const SEED_MISSIONS = [
  { title: 'Solve daily archive cipher', category: 'LEARNING', points: 150, short: 'Decrypt encrypted text blocks found in the pod archive terminal.',
    details: 'Decrypt the Erasmus historic monument hex code hidden in the central library square archive. Discover the secret 6-character codename etched into the bronze plinth, decode the cipher using the festival handbook key, and log your findings.',
    proofType: 'comment', proofHint: 'Write the codename you found', deadline: '', recurrence: 'DAILY', active: true },
  { title: 'Geo-tag 3 local architectural gargoyles', category: 'EXPLORATION', points: 200, short: 'Scout festival perimeter, snap proof coords, and submit to vault.',
    details: 'Wander through the old district and find 3 architectural gargoyles. Take a clear photo of each with GPS location enabled and upload all three.',
    proofType: 'link', proofHint: 'Link to a shared album with the 3 photos', deadline: '', recurrence: 'ONE-OFF', active: true },
  { title: 'Host community tea & vocabulary exchange', category: 'INTERCULTURAL', points: 300, short: 'Gather at least 5 multinational delegates and swap 10 phrases.',
    details: 'Gather at least 5 delegates from different countries, drink tea together and swap 10 phrases of your native languages. An organizer must sign off.',
    proofType: 'link', proofHint: 'Link to a group photo', deadline: '', recurrence: 'ONE-OFF', active: true },
  { title: 'Midnight ambient sound recording', category: 'CREATIVITY', points: 250, short: 'Capture 60 seconds of festival grounds field audio after midnight.',
    details: 'After midnight, record 60 seconds of ambient sound on the festival grounds. No talking, only the atmosphere. Upload the file to the cloud and share the link.',
    proofType: 'link', proofHint: 'Link to the audio file', deadline: '', recurrence: 'ONE-OFF', active: true },
];
