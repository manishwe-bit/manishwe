import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import Projects from './components/Projects.jsx';
import Skills from './components/Skills.jsx';
import SocialLinks from './components/SocialLinks.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import WebsiteConstructionAnimation from './components/WebsiteConstructionAnimation.jsx';
import { NAV_LINKS, SITE } from './config';
import { usePage } from './router';

const PAGES = {
  home: () => <Hero />,
  about: () => <About />,
  services: () => <Services />,
  projects: () => <Projects />,
  skills: () => <Skills />,
  contact: () => (
    <>
      <Contact />
      <SocialLinks />
    </>
  ),
};

export default function App() {
  const page = usePage();
  const Page = PAGES[page];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const label = NAV_LINKS.find((l) => l.id === page)?.label;
    document.title = page === 'home' ? `${SITE.name} — Web Developer` : `${label} — ${SITE.name}`;
  }, [page]);

  return (
    <>
      <Navbar page={page} />
      {/* key: each page mounts fresh so its construction animation plays again */}
      <main key={page} className="min-h-svh">
        <Page />
      </main>
      <Footer />
      <WebsiteConstructionAnimation page={page} />
    </>
  );
}
