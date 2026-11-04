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
import NextPage from './components/NextPage.jsx';
import BlueprintInspector from './components/BlueprintInspector.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import GuideCursor from './components/GuideCursor.jsx';
import XRayLens from './components/XRayLens.jsx';
import { Marquee, TerminalSection, Explore } from './components/home/HomeSections.jsx';
import { NAV_LINKS, SITE } from './config';
import { usePage } from './router';

const PAGES = {
  home: () => (
    <>
      <Hero />
      <Marquee />
      <TerminalSection />
      <Explore />
    </>
  ),
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
        {page !== 'home' && <NextPage page={page} />}
      </main>
      <Footer />
      <WebsiteConstructionAnimation page={page} />
      <GuideCursor page={page} />
      <BlueprintInspector />
      <XRayLens page={page} />
      <CommandPalette />
    </>
  );
}
