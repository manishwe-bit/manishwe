import { useSyncExternalStore } from 'react';

// English / Hindi switch for the site's own text. Names, tech terms and the demo websites stay in English.
const KEY = 'site-lang';
const listeners = new Set();
let lang = (() => {
  try {
    return localStorage.getItem(KEY) === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
})();
document.documentElement.lang = lang;

export function setLang(next) {
  lang = next;
  document.documentElement.lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Storage blocked: the choice lasts for this visit.
  }
  listeners.forEach((l) => l());
}
export const toggleLang = () => setLang(lang === 'hi' ? 'en' : 'hi');

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export const useLang = () => useSyncExternalStore(subscribe, () => lang);

const EN = {
  'nav.home': 'Home', 'nav.about': 'About', 'nav.services': 'Services', 'nav.projects': 'Projects',
  'nav.showcase': 'Showcase', 'nav.skills': 'Skills', 'nav.contact': 'Contact', 'nav.talk': "Let's talk",
  'nav.lang': 'हिं', 'nav.langLabel': 'हिन्दी में देखें',

  'hero.hello': "Hello, I'm", 'hero.title': 'WEB DEVELOPER',
  'hero.tagline': 'Building modern, interactive and responsive digital experiences through creative web development.',
  'hero.cta': 'View projects', 'hero.about': 'About me', 'site.location': 'Bilaspur, Chhattisgarh',

  'about.label': 'About', 'about.title': 'About\nme',
  'about.text': 'I enjoy building modern websites that combine clean design, interactive experiences and functional technology.',
  'about.discipline': 'Discipline', 'about.disciplineValue': 'Web development', 'about.stack': 'Core stack', 'about.location': 'Location',

  'services.label': 'Services', 'services.title': 'What I do',
  'projects.label': 'Projects', 'projects.title': 'Selected\nwork', 'projects.view': 'View project',
  'projects.soon': 'Link coming soon', 'projects.reserved': 'This slot is reserved for an upcoming project.', 'projects.comingSoon': '— COMING SOON',
  'skills.label': 'Skills', 'skills.title': 'Technologies',

  'showcase.label': 'Showcase', 'showcase.title': 'Watch a site\nget built',
  'showcase.intro': 'Pick an example below and press play. You will see the whole build, from an empty folder to a live website: code typing itself on the left, the site assembling on the right.',
  'showcase.replay': 'Live replay', 'showcase.video': 'Video', 'showcase.yours': 'Your AI design',
  'showcase.ctaTitle': 'Want yours built like this?',
  'showcase.ctaText': 'Café, gym, shop, startup or portfolio: tell me about your business and I will build it, fast and mobile-friendly.',
  'showcase.ctaButton': 'Start a project',
  'process.plan': 'Plan', 'process.planText': 'Your goals, pages and content.',
  'process.wire': 'Wireframe', 'process.wireText': 'Layout of every section.',
  'process.design': 'Design', 'process.designText': 'Colours, type and brand.',
  'process.animate': 'Animate', 'process.animateText': 'Motion that feels alive.',
  'process.launch': 'Launch', 'process.launchText': 'Fast, secure and online.',

  'gen.kicker': 'AI Website Generator · powered by MK-01', 'gen.title': 'Design my website',
  'gen.text': 'Describe your business in a line, in English or Hindi. The AI designs a website for it (name, colours, copy, layout) and builds it live in front of you.',
  'gen.placeholder': 'e.g. A café in Bilaspur called Chai Point, cosy and modern', 'gen.button': 'Design it', 'gen.busy': 'Designing…',

  'contact.label': 'Contact', 'contact.title1': "Let's work", 'contact.title2': 'together',
  'contact.email': 'Send an email', 'contact.or': 'Or send your requirement here',
  'form.name': 'Name', 'form.namePh': 'Your name', 'form.email': 'Email', 'form.phone': 'Phone / WhatsApp (optional)',
  'form.need': 'What do you need?', 'form.budget': 'Budget (optional)', 'form.timeline': 'Timeline (optional)', 'form.choose': 'Choose…',
  'form.req': 'Your requirement', 'form.reqPh': 'Tell me about your business and what the website should do…',
  'form.send': 'Send requirement', 'form.sending': 'Sending', 'form.sent': "Thanks! Your requirement has reached Manish's inbox. He'll reply soon.",
  'form.invalid': 'Please check your details: name, a valid email, and a message of at least 10 characters.',
  'form.offline': 'Could not reach the server. Please try again in a minute, or send it by email instead.', 'form.error': 'Something went wrong. Please try again.',
  'form.waking': 'The server is waking up, this can take up to a minute. Please wait…', 'form.mailto': 'Send by email instead',

  'social.label': 'Social', 'social.title': 'Find me\nonline',
  'next.next': 'Next page', 'next.back': 'Back to', 'footer.top': 'Back to top',

  'home.tryLabel': 'Try it', 'home.tryTitle': 'Talk to\nmy site',
  'home.tryText': 'This portfolio has a working terminal. Type {help}, explore my {projects}, or try {hire}.',
  'home.exploreLabel': 'Explore', 'home.exploreTitle': 'Inside the\nsite', 'home.quick': 'Quick menu', 'home.quickText': 'Press Ctrl + K anywhere on the site.',
  'blurb.about': 'Who I am and how I like to work.', 'blurb.services': '{n} ways I can help, from frontend to backend.',
  'blurb.projects': '{n} live project(s), with more on the way.', 'blurb.showcase': 'Press play and watch a website get built, start to finish.',
  'blurb.skills': '{n} technologies across frontend, backend and data.', 'blurb.contact': 'Have an idea? Send me a message.',
};

const HI = {
  'nav.home': 'होम', 'nav.about': 'परिचय', 'nav.services': 'सेवाएँ', 'nav.projects': 'प्रोजेक्ट्स',
  'nav.showcase': 'शोकेस', 'nav.skills': 'स्किल्स', 'nav.contact': 'संपर्क', 'nav.talk': 'बात करें',
  'nav.lang': 'EN', 'nav.langLabel': 'View in English',

  'hero.hello': 'नमस्ते, मैं हूँ', 'hero.title': 'वेब डेवलपर',
  'hero.tagline': 'क्रिएटिव वेब डेवलपमेंट से आधुनिक, इंटरैक्टिव और हर स्क्रीन पर चलने वाली वेबसाइटें बनाता हूँ।',
  'hero.cta': 'प्रोजेक्ट्स देखें', 'hero.about': 'मेरे बारे में', 'site.location': 'बिलासपुर, छत्तीसगढ़',

  'about.label': 'परिचय', 'about.title': 'मेरे\nबारे में',
  'about.text': 'मुझे ऐसी आधुनिक वेबसाइटें बनाना पसंद है जिनमें साफ़ डिज़ाइन, इंटरैक्टिव अनुभव और काम की टेक्नोलॉजी एक साथ हों।',
  'about.discipline': 'क्षेत्र', 'about.disciplineValue': 'वेब डेवलपमेंट', 'about.stack': 'मुख्य स्टैक', 'about.location': 'स्थान',

  'services.label': 'सेवाएँ', 'services.title': 'मैं क्या करता हूँ',
  'projects.label': 'प्रोजेक्ट्स', 'projects.title': 'चुनिंदा\nकाम', 'projects.view': 'प्रोजेक्ट देखें',
  'projects.soon': 'लिंक जल्द आएगा', 'projects.reserved': 'यह जगह आने वाले प्रोजेक्ट के लिए है।', 'projects.comingSoon': '— जल्द आ रहा है',
  'skills.label': 'स्किल्स', 'skills.title': 'टेक्नोलॉजी',

  'showcase.label': 'शोकेस', 'showcase.title': 'वेबसाइट बनते\nहुए देखें',
  'showcase.intro': 'नीचे कोई उदाहरण चुनें और प्ले दबाएँ। खाली फ़ोल्डर से लाइव वेबसाइट तक पूरा काम दिखेगा: बाईं ओर कोड खुद टाइप होता है, दाईं ओर साइट बनती जाती है।',
  'showcase.replay': 'लाइव रीप्ले', 'showcase.video': 'वीडियो', 'showcase.yours': 'आपका AI डिज़ाइन',
  'showcase.ctaTitle': 'आपकी वेबसाइट भी ऐसी बने?',
  'showcase.ctaText': 'कैफ़े, जिम, दुकान, स्टार्टअप या पोर्टफ़ोलियो: अपने बिज़नेस के बारे में बताइए, मैं तेज़ और मोबाइल-फ़्रेंडली वेबसाइट बना दूँगा।',
  'showcase.ctaButton': 'प्रोजेक्ट शुरू करें',
  'process.plan': 'योजना', 'process.planText': 'आपके लक्ष्य, पेज और कंटेंट।',
  'process.wire': 'ढाँचा', 'process.wireText': 'हर सेक्शन का लेआउट।',
  'process.design': 'डिज़ाइन', 'process.designText': 'रंग, फ़ॉन्ट और ब्रांड।',
  'process.animate': 'एनिमेशन', 'process.animateText': 'जीवंत लगने वाली मोशन।',
  'process.launch': 'लॉन्च', 'process.launchText': 'तेज़, सुरक्षित और ऑनलाइन।',

  'gen.kicker': 'AI वेबसाइट जनरेटर · MK-01 द्वारा', 'gen.title': 'मेरी वेबसाइट डिज़ाइन करो',
  'gen.text': 'अपने बिज़नेस के बारे में एक लाइन लिखिए, हिंदी या अंग्रेज़ी में। AI उसके लिए वेबसाइट डिज़ाइन करेगा (नाम, रंग, टेक्स्ट, लेआउट) और आपकी आँखों के सामने बनाएगा।',
  'gen.placeholder': 'जैसे: बिलासपुर में "चाय पॉइंट" नाम का एक मॉडर्न कैफ़े', 'gen.button': 'डिज़ाइन करो', 'gen.busy': 'डिज़ाइन हो रहा है…',

  'contact.label': 'संपर्क', 'contact.title1': 'आइए साथ', 'contact.title2': 'काम करें',
  'contact.email': 'ईमेल भेजें', 'contact.or': 'या अपनी ज़रूरत यहाँ भेजें',
  'form.name': 'नाम', 'form.namePh': 'आपका नाम', 'form.email': 'ईमेल', 'form.phone': 'फ़ोन / WhatsApp (वैकल्पिक)',
  'form.need': 'आपको क्या चाहिए?', 'form.budget': 'बजट (वैकल्पिक)', 'form.timeline': 'समय-सीमा (वैकल्पिक)', 'form.choose': 'चुनें…',
  'form.req': 'आपकी ज़रूरत', 'form.reqPh': 'अपने बिज़नेस के बारे में और वेबसाइट से क्या चाहिए, बताइए…',
  'form.send': 'ज़रूरत भेजें', 'form.sending': 'भेजा जा रहा है', 'form.sent': 'धन्यवाद! आपकी ज़रूरत मनीष के ईमेल पर पहुँच गई है। वे जल्द जवाब देंगे।',
  'form.invalid': 'कृपया जाँचें: नाम, सही ईमेल और कम से कम 10 अक्षरों का मैसेज।',
  'form.offline': 'सर्वर से जुड़ नहीं पाए। एक मिनट बाद फिर कोशिश करें, या इसे ईमेल से भेज दें।', 'form.error': 'कुछ गड़बड़ हुई। फिर से कोशिश करें।',
  'form.waking': 'सर्वर जाग रहा है, एक मिनट तक लग सकता है। कृपया रुकिए…', 'form.mailto': 'ईमेल से भेजें',

  'social.label': 'सोशल', 'social.title': 'मुझे ऑनलाइन\nखोजें',
  'next.next': 'अगला पेज', 'next.back': 'वापस', 'footer.top': 'ऊपर जाएँ',

  'home.tryLabel': 'आज़माएँ', 'home.tryTitle': 'मेरी साइट से\nबात करें',
  'home.tryText': 'इस पोर्टफ़ोलियो में एक चलता हुआ टर्मिनल है। {help} टाइप करें, मेरे {projects} देखें, या {hire} आज़माएँ।',
  'home.exploreLabel': 'देखें', 'home.exploreTitle': 'साइट के\nअंदर', 'home.quick': 'क्विक मेन्यू', 'home.quickText': 'साइट पर कहीं भी Ctrl + K दबाएँ।',
  'blurb.about': 'मैं कौन हूँ और कैसे काम करता हूँ।', 'blurb.services': 'फ़्रंटएंड से बैकएंड तक, {n} तरह से मदद।',
  'blurb.projects': '{n} लाइव प्रोजेक्ट, और भी आ रहे हैं।', 'blurb.showcase': 'प्ले दबाइए और वेबसाइट शुरू से अंत तक बनते देखिए।',
  'blurb.skills': 'फ़्रंटएंड, बैकएंड और डेटा की {n} टेक्नोलॉजी।', 'blurb.contact': 'कोई आइडिया है? मुझे मैसेज भेजिए।',
};

// Per-language versions of list content in config.js (matched by index).
const SERVICES_HI = [
  { title: 'फ़्रंटएंड डेवलपमेंट', desc: 'HTML, CSS, JavaScript और React से साफ़ और सबके लिए आसान इंटरफ़ेस।' },
  { title: 'बैकएंड डेवलपमेंट', desc: 'Python और FastAPI से सर्वर लॉजिक और API, MySQL या MongoDB के साथ।' },
  { title: 'रिस्पॉन्सिव वेब डिज़ाइन', desc: 'डेस्कटॉप, टैबलेट और मोबाइल पर बराबर अच्छे लगने वाले लेआउट।' },
  { title: 'इंटरैक्टिव वेबसाइट', desc: 'मोशन, स्क्रॉल और कर्सर इंटरैक्शन जो साइट को जीवंत बनाएँ।' },
  { title: 'UI/UX इम्प्लीमेंटेशन', desc: 'डिज़ाइन को हूबहू चलते-फिरते इंटरफ़ेस में बदलना।' },
  { title: 'वेबसाइट ऑप्टिमाइज़ेशन', desc: 'तेज़ लोडिंग, हल्की फ़ाइलें और स्मूद चलती साइट।' },
];
const PROJECTS_HI = {
  'Manish Poetry':
    'भावनाओं की आधी रात वाली लाइब्रेरी: मेरी अपनी हिंग्लिश कविताओं की वेबसाइट, जिसमें अलग-अलग मूड की 50 कविताएँ, आज की कविता, सर्च, शांत संगीत वाला म्यूज़िक स्टेशन और पसंदीदा कविताओं का कलेक्शन है।',
};

const DICT = { en: EN, hi: HI };

/** t('key', { n: 3 }) -> text in the current language, falling back to English. */
export function translate(key, vars) {
  let s = DICT[lang][key] ?? EN[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

/** Re-renders the component when the language changes; returns t(). */
export function useT() {
  useLang();
  return translate;
}

export const localService = (s, i) => (lang === 'hi' ? SERVICES_HI[i] ?? s : s);
export const localProjectText = (p) => (lang === 'hi' ? PROJECTS_HI[p.title] ?? p.description : p.description);
