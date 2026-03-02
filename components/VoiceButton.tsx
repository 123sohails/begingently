'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../lib/types';

type Props = {
  locale: Locale;
  targetId?: string;
};

const voiceLangByLocale: Record<Locale, string> = {
  en: 'en-US',
  ur: 'ur-PK',
  te: 'te-IN',
};

const labels: Record<Locale, { listen: string; stop: string }> = {
  en: { listen: 'Listen to this page', stop: 'Stop audio' },
  ur: { listen: 'یہ صفحہ سنیں', stop: 'آڈیو بند کریں' },
  te: { listen: 'ఈ పేజీ వినండి', stop: 'ఆడియో ఆపు' },
};

export function VoiceButton({ locale, targetId = 'main-content' }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const queueRef = useRef<string[]>([]);
  const unmountedRef = useRef(false);

  const lang = voiceLangByLocale[locale] ?? 'en-US';
  const textLabel = useMemo(() => labels[locale] ?? labels.en, [locale]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const base = lang.split('-')[0].toLowerCase();
    return (
      voices.find((v) => (v.lang || '').toLowerCase().startsWith(base)) ||
      voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) ||
      voices[0] ||
      null
    );
  };

  const getReadableText = () => {
    const target = document.getElementById(targetId);
    if (!target) return '';
    const clone = target.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, nav, footer, button, .skip-link').forEach((el) => el.remove());
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  };

  const splitIntoChunks = (text: string, maxLength = 220) => {
    if (!text) return [];
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      const part = sentence.trim();
      if (!part) continue;

      if ((current + ' ' + part).trim().length <= maxLength) {
        current = (current + ' ' + part).trim();
        continue;
      }

      if (current) chunks.push(current);

      if (part.length <= maxLength) {
        current = part;
        continue;
      }

      let start = 0;
      while (start < part.length) {
        const slice = part.slice(start, start + maxLength).trim();
        if (slice) chunks.push(slice);
        start += maxLength;
      }
      current = '';
    }

    if (current) chunks.push(current);
    return chunks;
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    queueRef.current = [];
    if (!unmountedRef.current) setIsPlaying(false);
  };

  const speakNext = () => {
    if (!queueRef.current.length) {
      stopSpeech();
      return;
    }

    const text = queueRef.current.shift() as string;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    utterance.onend = speakNext;
    utterance.onerror = stopSpeech;
    window.speechSynthesis.speak(utterance);
  };

  const startSpeech = () => {
    const text = getReadableText();
    if (!text) return;
    queueRef.current = splitIntoChunks(text);
    setIsPlaying(true);
    speakNext();
  };

  const onClick = () => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      return;
    }
    if (isPlaying || window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      stopSpeech();
      return;
    }
    stopSpeech();
    startSpeech();
  };

  return (
    <button className="tts-toggle" type="button" aria-pressed={isPlaying ? 'true' : 'false'} onClick={onClick}>
      {isPlaying ? textLabel.stop : textLabel.listen}
    </button>
  );
}

