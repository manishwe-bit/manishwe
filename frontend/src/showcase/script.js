// Turns a demo into a timed build script: what gets typed, in which file, and
// what the preview shows at the end of each step. Times are in seconds.

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fonts = { serif: 'Georgia, serif', sans: 'Inter, sans-serif', display: 'Anton, sans-serif' };

const LABELS = { nav: 'navbar', hero: 'hero section', features: 'features', grid: '', quote: 'testimonial', footer: 'footer' };

function jsx(section, d) {
  switch (section) {
    case 'nav':
      return `function Navbar() {
  return (
    <nav className="nav">
      <a className="logo">${d.nav.brand}</a>
      <ul className="links">
${d.nav.links.map((l) => `        <li><a href="#${slug(l)}">${l}</a></li>`).join('\n')}
      </ul>
      <a className="btn">${d.nav.cta}</a>
    </nav>
  );
}`;
    case 'hero':
      return `function Hero() {
  return (
    <header className="hero ${d.hero.layout}">
      <p className="eyebrow">${d.hero.eyebrow}</p>
      <h1>${d.hero.title}</h1>
      <p className="lead">${d.hero.text}</p>
      <a className="btn">${d.hero.cta}</a>
      <img className="hero-art" src="/hero.webp" alt="" />
    </header>
  );
}`;
    case 'features':
      return `const FEATURES = [
${d.features.items.map((f) => `  { icon: '${f.icon}', title: '${f.title}' },`).join('\n')}
];

function Features() {
  return (
    <section className="features">
      <h2>${d.features.title}</h2>
      {FEATURES.map((f) => (
        <article className="card" key={f.title}>
          <Icon name={f.icon} />
          <h3>{f.title}</h3>
        </article>
      ))}
    </section>
  );
}`;
    case 'grid':
      return `const ITEMS = [
${d.grid.items.map((it) => `  { name: '${it.name}'${it.price ? `, price: '${it.price}'` : ''} },`).join('\n')}
];

function ${cap(d.grid.layout)}() {
  return (
    <section className="${d.grid.layout}">
      <h2>${d.grid.title}</h2>
      <div className="grid">
        {ITEMS.map((item) => <${cap(d.grid.layout)}Card key={item.name} {...item} />)}
      </div>
    </section>
  );
}`;
    case 'quote':
      return `function Testimonial() {
  return (
    <blockquote className="quote">
      “${d.quote.text}”
      <cite>${d.quote.author}</cite>
    </blockquote>
  );
}`;
    default:
      return `function Footer() {
  return (
    <footer className="footer">
      <strong>${d.nav.brand}</strong>
      <small>${d.footer.text}</small>
    </footer>
  );
}`;
  }
}

function css(section, d) {
  const t = d.theme;
  switch (section) {
    case 'nav':
      return `:root {
  --bg: ${t.bg};
  --text: ${t.text};
  --accent: ${t.accent};
  --radius: ${t.radius};
  font-family: ${fonts[t.font]};
}
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
}
.btn {
  background: var(--accent);
  color: ${t.onAccent};
  border-radius: var(--radius);
  padding: 12px 24px;
}`;
    case 'hero':
      return `.hero {
  display: grid;
  ${d.hero.layout === 'split' ? 'grid-template-columns: 1fr 1fr;' : 'text-align: center;'}
  gap: 56px;
  padding: 80px 48px;
}
.hero h1 {
  font-size: clamp(2.5rem, 6vw, 4rem);
  line-height: 1.02;
}
.eyebrow { color: var(--accent); letter-spacing: .2em; }
.lead { color: ${t.muted}; font-size: 1.125rem; }`;
    case 'features':
      return `.features {
  background: ${t.surface};
  padding: 80px 48px;
}
.features .grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}
.card {
  background: var(--bg);
  border-radius: var(--radius);
  padding: 28px;
}`;
    case 'grid':
      return `.${d.grid.layout} {
  padding: 80px 48px;
}
.${d.grid.layout} .grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}
.price { color: var(--accent); font-weight: 700; }`;
    case 'quote':
      return `.quote {
  background: ${t.surface};
  font-size: 2.25rem;
  text-align: center;
  padding: 80px 48px;
}
.quote cite { color: var(--accent); }`;
    default:
      return `.footer {
  display: flex;
  justify-content: space-between;
  padding: 40px 48px;
  color: ${t.muted};
}

@media (max-width: 768px) {
  .hero, .grid { grid-template-columns: 1fr; }
}`;
  }
}

function cap(s) {
  return s[0].toUpperCase() + s.slice(1);
}

/**
 * Steps: { label, file, code, dur, apply(state, p) } where apply mutates the preview
 * state for progress p (0..1) through the step.
 */
export function buildScript(d) {
  const name = slug(d.title);
  const steps = [
    {
      label: 'Creating the project',
      file: 'terminal',
      dur: 3.5,
      code: `$ npm create vite@latest ${name} -- --template react
  Scaffolding project in ./${name}...
  Done.
$ cd ${name} && npm install
  added 214 packages in 4s
$ npm run dev
  VITE ready on http://localhost:5173`,
      apply: () => {},
    },
  ];

  const order = ['nav', 'hero', 'features', 'grid', 'quote', 'footer'];
  for (const s of order) {
    const label = LABELS[s] || d.grid.title.toLowerCase();
    steps.push({
      label: `Laying out the ${label}`,
      file: 'App.jsx',
      dur: 2.8,
      code: jsx(s, d),
      apply: (st, p) => p > 0.25 && (st.stages[s] = 'wire'),
      section: s,
    });
    steps.push({
      label: `Styling the ${label}`,
      file: 'styles.css',
      dur: 3,
      code: css(s, d),
      apply: (st, p) => (st.stages[s] = p > 0.8 ? 'styled' : 'wire'),
      section: s,
    });
  }

  steps.push({
    label: 'Adding motion and hover effects',
    file: 'animations.js',
    dur: 3.2,
    code: `import gsap from 'gsap';

gsap.from('.hero > *', { y: 40, opacity: 0, stagger: 0.12 });

document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointerenter', () =>
    gsap.to(card, { y: -8, duration: 0.3 })
  );
  card.addEventListener('pointerleave', () =>
    gsap.to(card, { y: 0, duration: 0.3 })
  );
});`,
    apply: (st, p) => p > 0.6 && (st.live = true),
    section: 'hero',
  });

  steps.push({
    label: 'Deploying to the internet',
    file: 'terminal',
    dur: 3.8,
    code: `$ npm run build
  ✓ 48 modules transformed
  dist/index.html        0.6 kB
  dist/assets/app.js    62.1 kB
$ netlify deploy --prod
  Deploying to main site...
  ✔ Live: https://${d.domain}`,
    apply: (st, p) => p > 0.75 && (st.deployed = true),
    section: 'nav',
  });

  let at = 0;
  for (const s of steps) {
    s.start = at;
    at += s.dur;
  }
  return { steps, total: at };
}

/** Everything the player needs to draw time t. */
export function frameAt({ steps }, t) {
  const st = { stages: {}, live: false, deployed: false };
  let index = 0;
  steps.forEach((s, i) => {
    if (t >= s.start) index = i;
  });
  for (let i = 0; i < index; i++) steps[i].apply(st, 1);
  const step = steps[index];
  const p = Math.min(Math.max((t - step.start) / step.dur, 0), 1);
  step.apply(st, p);

  // The editor shows the whole file so far, with the current step being typed.
  const typed = Math.floor(step.code.length * Math.min(p / 0.8, 1));
  const before = steps
    .slice(0, index)
    .filter((s) => s.file === step.file)
    .map((s) => s.code);
  const text = [...before, step.code.slice(0, typed)].join(step.file === 'terminal' ? '\n' : '\n\n');
  return { ...st, index, step, p, text, typing: typed < step.code.length };
}
