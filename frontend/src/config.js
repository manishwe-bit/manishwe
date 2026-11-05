// Edit this file to replace placeholders with your real details.

export const SITE = {
  name: 'MANISH KUMAR KAIWARTY',
  firstName: 'MANISH KUMAR',
  lastName: 'KAIWARTY',
  title: 'WEB DEVELOPER',
  tagline: 'Building modern, interactive and responsive digital experiences through creative web development.',
  about: 'I enjoy building modern websites that combine clean design, interactive experiences and functional technology.',
  email: 'manishkaiwarty00@gmail.com',
  phone: '+91 91090 17468',
  phoneHref: 'tel:+919109017468',
  location: 'Bilaspur, Chhattisgarh',
};

// Backend base URL. Empty = same origin: the one-service deploy serves the site and /api together,
// and in dev Vite proxies /api to the local server.
// A Netlify copy of the site has no /api of its own, so it always talks to the Render service directly
// (the API allows the Netlify origin); no environment variable needed. Change this if the Render URL changes.
const RENDER_API = 'https://manish-kaiwarty.onrender.com';
export const API_URL = import.meta.env.VITE_API_URL ?? (location.hostname.endsWith('.netlify.app') ? RENDER_API : '');

// Live cursors WebSocket. Default: the API on the same host (the one-service deploy, and Vite's proxy in dev).
// If the frontend is hosted separately from the API, set VITE_LIVE_URL (wss://<api-host>/api/live).
const API_BASE = API_URL ? new URL(API_URL) : location;
export const LIVE_URL = import.meta.env.VITE_LIVE_URL ?? `${API_BASE.protocol === 'https:' ? 'wss' : 'ws'}://${API_BASE.host}/api/live`;

// Empty url = shown as "Link coming soon".
export const SOCIALS = [
  { id: 'instagram', label: 'Instagram', handle: '@imanishh02', url: 'https://www.instagram.com/imanishh02' },
  { id: 'linkedin', label: 'LinkedIn', handle: 'Manish Kumar Kaiwarty', url: 'https://www.linkedin.com/in/manish-kumar-kaiwarty-b27678438' },
  { id: 'github', label: 'GitHub', handle: 'manishkaiwarty00-dotcom', url: 'https://github.com/manishkaiwarty00-dotcom' },
  { id: 'email', label: 'Email', handle: SITE.email, url: `mailto:${SITE.email}` },
];

export const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'projects', label: 'Projects' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
];

export const SERVICES = [
  { title: 'Frontend Development', desc: 'Clean, accessible user interfaces built with HTML, CSS, JavaScript and React.' },
  { title: 'Backend Development', desc: 'Server-side logic and APIs with Python and FastAPI, backed by MySQL or MongoDB.' },
  { title: 'Responsive Web Design', desc: 'Layouts that adapt smoothly across desktop, tablet and mobile screens.' },
  { title: 'Interactive Website Development', desc: 'Motion, scroll and cursor interactions that make a site feel alive.' },
  { title: 'UI/UX Implementation', desc: 'Turning designs into precise, pixel-faithful working interfaces.' },
  { title: 'Website Optimization', desc: 'Faster load times, lighter assets and smoother rendering.' },
];

// image: file name (without extension) in src/assets/images/. Missing image = placeholder.
export const PROJECTS = [
  {
    title: 'Manish Poetry',
    description:
      'A midnight library of feelings — my personal Hinglish poetry website with 50 poems across moods, a poem of the day, search, a music station with calm instrumentals and a personal favourites collection.',
    tech: ['HTML', 'CSS', 'JavaScript', 'Netlify'],
    url: 'https://manishpoetry.netlify.app/',
    image: 'manish-poetry',
  },
  { title: 'Project 02', placeholder: true },
  { title: 'Project 03', placeholder: true },
];

export const SKILLS = [
  { group: 'Frontend', items: ['HTML', 'CSS', 'JavaScript', 'React'] },
  { group: 'Backend', items: ['Python', 'FastAPI'] },
  { group: 'Database', items: ['MySQL', 'MongoDB'] },
];
