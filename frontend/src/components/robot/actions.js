import { pageHref } from '../../router';
import { setBlueprint } from '../../blueprintMode';
import { setMode } from '../../modes';
import { DEMOS } from '../../showcase/demos';

// Requests the robot made before the Showcase page had mounted; Showcase takes them on mount.
let pendingDemo = null;
let pendingDesign = null;
export function takePendingDemo() {
  const id = pendingDemo;
  pendingDemo = null;
  return id;
}
export function takePendingDesign() {
  const d = pendingDesign;
  pendingDesign = null;
  return d;
}

const pageLabel = (id) => id[0].toUpperCase() + id.slice(1);

/** Carries out one robot action in the browser. Returns a short log line for the chat. */
export function runAction(action) {
  switch (action.type) {
    case 'navigate':
      window.location.hash = pageHref(action.page);
      return `Opened ${pageLabel(action.page)}`;
    case 'play_demo': {
      const demo = DEMOS.find((d) => d.id === action.demo);
      if (!demo) return null;
      if (window.location.hash !== pageHref('showcase')) {
        pendingDemo = demo.id; // Showcase picks it up when it mounts
        window.location.hash = pageHref('showcase');
      } else {
        window.dispatchEvent(new CustomEvent('showcase:play', { detail: demo.id }));
      }
      return `Playing build: ${demo.title}`;
    }
    case 'design_site':
      if (window.location.hash !== pageHref('showcase')) {
        pendingDesign = action.description;
        window.location.hash = pageHref('showcase');
      } else {
        window.dispatchEvent(new CustomEvent('showcase:design', { detail: action.description }));
      }
      return 'Designing your website…';
    case 'set_view': {
      if (action.mode === 'blueprint') setBlueprint(action.on);
      else setMode(action.mode, action.on);
      const names = { xray: 'X-ray', blueprint: 'Blueprint', hud: 'Dev HUD' };
      return `${names[action.mode] ?? action.mode} ${action.on ? 'on' : 'off'}`;
    }
    case 'enquiry_sent':
      return 'Enquiry delivered to Manish’s inbox';
    default:
      return null;
  }
}
