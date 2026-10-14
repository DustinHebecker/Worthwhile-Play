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

interface SynthesisLike {
  getVoices(): readonly { lang: string }[];
  speak(utterance: unknown): void;
  cancel(): void;
  addEventListener?(type: 'voiceschanged', listener: () => void): void;
  removeEventListener?(type: 'voiceschanged', listener: () => void): void;
}

const base = (tag: string) => tag.toLowerCase().replace('_', '-').split('-')[0] ?? '';

/** Matches a content language to installed voices: exact tag first, then base language (`zh-Hans` → any `zh-*`). */
export function hasVoice(voices: readonly { lang: string }[], lang: string): boolean {
  const wanted = lang.toLowerCase();
  return voices.some((voice) => voice.lang.toLowerCase().replace('_', '-') === wanted) || voices.some((voice) => base(voice.lang) === base(lang));
}

export function browserSpeech(win: { speechSynthesis?: unknown; SpeechSynthesisUtterance?: unknown } = globalThis as never): Speech | undefined {
  const synth = win.speechSynthesis as SynthesisLike | undefined;
  const Utterance = win.SpeechSynthesisUtterance as (new (text: string) => { lang: string }) | undefined;
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
        utterance.lang = lang;
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
