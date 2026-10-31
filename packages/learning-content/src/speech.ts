import { bcp47Tag } from '@wp/game-core';

/**
 * Optional "read aloud" via the browser's speech synthesis. Best effort only: voices
 * differ per device and may be missing (then the button stays hidden). Speaks only when
 * the player presses the button; nothing is spoken automatically.
 */
export interface Speech {
  /** True when a voice for the language (or its base language) is installed. */
  canSpeak(lang: string): boolean;
  speak(text: string, lang: string): void;
  /** Voices often load asynchronously; `listener` runs when the list changes. Returns a disposer. */
  onVoicesChanged(listener: () => void): () => void;
}

export interface VoiceLike {
  lang: string;
}

interface SynthesisLike {
  getVoices(): readonly VoiceLike[];
  speak(utterance: unknown): void;
  cancel(): void;
  addEventListener?(type: 'voiceschanged', listener: () => void): void;
  removeEventListener?(type: 'voiceschanged', listener: () => void): void;
}

const normalize = (tag: string) => tag.toLowerCase().replace(/_/g, '-');
const base = (tag: string) => normalize(tag).split('-')[0] ?? '';

/**
 * Per base language: the tag to request, and same-language voices to use only as a last resort. Our Portuguese
 * is Brazilian (`pt` → `pt-BR`, as `bcp47Tag` declares it), so a European voice is only taken
 * when no other Portuguese voice exists; simplified Chinese prefers a Mainland Mandarin voice over Cantonese
 * (`zh-HK`) or Taiwanese ones. Languages not listed here keep their tag and take any voice of their base language.
 */
const VOICE_PREFERENCES: Readonly<Record<string, { tag: string; lastResort: readonly string[] }>> = {
  pt: { tag: 'pt-BR', lastResort: ['pt-pt', 'pt'] },
  'zh-hans': { tag: 'zh-CN', lastResort: ['zh-hk', 'zh-tw', 'zh-mo'] }
};

/**
 * Picks the best installed voice for a content language: the preferred regional tag (`pt` → `pt-BR`), then the
 * exact tag, then any voice of the same base language except the last-resort variants, then those (a device with
 * only a European Portuguese voice still reads Portuguese aloud). `undefined` when no voice of the language exists.
 */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], lang: string): V | undefined {
  const wanted = normalize(lang);
  const preference = VOICE_PREFERENCES[wanted];
  const tag = (voice: V) => normalize(voice.lang);
  const sameBase = voices.filter((voice) => base(voice.lang) === base(lang));
  const lastResort = new Set(preference?.lastResort ?? []);
  return (
    (preference && sameBase.find((voice) => tag(voice) === normalize(preference.tag))) ??
    sameBase.find((voice) => tag(voice) === wanted) ??
    sameBase.find((voice) => !lastResort.has(tag(voice))) ??
    sameBase[0]
  );
}

/** Matches a content language to installed voices: exact tag first, then base language (`zh-Hans` → any `zh-*`). */
export function hasVoice(voices: readonly VoiceLike[], lang: string): boolean {
  return pickVoice(voices, lang) !== undefined;
}

export function browserSpeech(win: { speechSynthesis?: unknown; SpeechSynthesisUtterance?: unknown } = globalThis as never): Speech | undefined {
  const synth = win.speechSynthesis as SynthesisLike | undefined;
  const Utterance = win.SpeechSynthesisUtterance as (new (text: string) => { lang: string; voice?: unknown }) | undefined;
  if (!synth || typeof synth.getVoices !== 'function' || typeof Utterance !== 'function') return undefined;
  return {
    canSpeak(lang) {
      try {
        return hasVoice(synth.getVoices(), lang);
      } catch {
        return false;
      }
    },
    speak(text, lang) {
      try {
        synth.cancel();
        const utterance = new Utterance(text);
        utterance.lang = bcp47Tag(lang);
        // Voices may still be loading (empty list before `voiceschanged`): then the browser picks one from `lang`.
        const voice = pickVoice(synth.getVoices(), lang);
        if (voice) utterance.voice = voice;
        synth.speak(utterance);
      } catch {
        /* best effort */
      }
    },
    onVoicesChanged(listener) {
      synth.addEventListener?.('voiceschanged', listener);
      return () => synth.removeEventListener?.('voiceschanged', listener);
    }
  };
}
