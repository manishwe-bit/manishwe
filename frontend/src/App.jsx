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

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Projects />
        <Skills />
        <SocialLinks />
        <Contact />
      </main>
      <Footer />
      <WebsiteConstructionAnimation />
    </>
  );
}
