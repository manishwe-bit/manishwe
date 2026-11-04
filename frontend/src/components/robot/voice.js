import { useEffect, useRef, useState } from 'react';

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = Boolean(Recognition);
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

const DEVANAGARI = /[ऀ-ॿ]/;

// Chrome fills the voice list asynchronously: ask early so it's ready by the first reply.
if (canSpeak) {
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices());
}

function pickVoice(text) {
  const voices = speechSynthesis.getVoices();
  const hindi = DEVANAGARI.test(text);
  const want = hindi ? ['hi-IN'] : ['en-IN', 'en-GB', 'en-US'];
  for (const lang of want) {
    const v = voices.find((x) => x.lang === lang) ?? voices.find((x) => x.lang.startsWith(lang.slice(0, 2)));
    if (v) return v;
  }
  return null;
}

/** Speaks text in a low, slightly fast "robot" voice. onStart/onEnd drive the mouth animation. */
export function speak(text, { onStart, onEnd } = {}) {
  if (!canSpeak || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = pickVoice(text);
  u.lang = u.voice?.lang ?? 'en-IN';
  u.pitch = 0.55;
  u.rate = 1.05;
  u.onstart = () => onStart?.();
  u.onend = u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
}

export const stopSpeaking = () => canSpeak && speechSynthesis.cancel();

/**
 * Push-to-talk speech recognition. Interim words go to onText as they're heard;
 * onFinal gets the full sentence when the visitor stops talking.
 */
export function useListen({ onText, onFinal }) {
  const [listening, setListening] = useState(false);
  const rec = useRef(null);
  const cbs = useRef({ onText, onFinal });
  cbs.current = { onText, onFinal };

  useEffect(() => () => rec.current?.abort(), []);

  const start = () => {
    if (!canListen || listening) return;
    stopSpeaking();
    const r = new Recognition();
    r.lang = navigator.language?.startsWith('hi') ? 'hi-IN' : 'en-IN';
    r.interimResults = true;
    r.maxAlternatives = 1;
    let finalText = '';
    r.onresult = (e) => {
      let text = '';
      for (const res of e.results) text += res[0].transcript;
      finalText = text;
      cbs.current.onText?.(text);
    };
    r.onend = () => {
      setListening(false);
      rec.current = null;
      if (finalText.trim()) cbs.current.onFinal?.(finalText.trim());
    };
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };
  const stop = () => rec.current?.stop();

  return { listening, start, stop };
}
