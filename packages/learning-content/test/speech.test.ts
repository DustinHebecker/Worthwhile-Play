import { describe, expect, it, vi } from 'vitest';
import { browserSpeech, hasVoice, pickVoice } from '../src/speech';

const voices = (...tags: string[]) => tags.map((lang, i) => ({ lang, name: `voice-${i}` }));

describe('pickVoice', () => {
  it('Portuguese: pt-BR beats pt-PT, whatever the order', () => {
    expect(pickVoice(voices('pt-PT', 'pt-BR'), 'pt')?.lang).toBe('pt-BR');
    expect(pickVoice(voices('pt-BR', 'pt-PT'), 'pt')?.lang).toBe('pt-BR');
    expect(pickVoice(voices('en-US', 'pt_PT', 'pt_BR'), 'pt')?.lang).toBe('pt_BR');
  });

  it('Portuguese: another regional voice beats European, European is the last resort', () => {
    expect(pickVoice(voices('pt-PT', 'pt-AO'), 'pt')?.lang).toBe('pt-AO');
    expect(pickVoice(voices('en-GB', 'pt-PT'), 'pt')?.lang).toBe('pt-PT');
    expect(pickVoice(voices('pt'), 'pt')?.lang).toBe('pt');
  });

  it('an explicit pt-PT deck side still gets the European voice', () => {
    expect(pickVoice(voices('pt-BR', 'pt-PT'), 'pt-PT')?.lang).toBe('pt-PT');
  });

  it('no voice of the language → undefined', () => {
    expect(pickVoice([], 'pt')).toBeUndefined();
    expect(pickVoice(voices('es-ES', 'en-US'), 'pt')).toBeUndefined();
  });

  it('other languages: exact tag first, then the first voice of the base language', () => {
    expect(pickVoice(voices('en-US', 'en-GB'), 'en-GB')?.lang).toBe('en-GB');
    expect(pickVoice(voices('de-AT', 'de-DE'), 'de')?.lang).toBe('de-AT');
    expect(pickVoice(voices('ja-JP'), 'ja')?.lang).toBe('ja-JP');
  });

  it('simplified Chinese prefers a Mainland voice over Cantonese / Taiwanese ones', () => {
    expect(pickVoice(voices('zh-HK', 'zh-TW', 'zh-CN'), 'zh-Hans')?.lang).toBe('zh-CN');
    expect(pickVoice(voices('zh_HK', 'zh_CN'), 'zh-Hans')?.lang).toBe('zh_CN');
    expect(pickVoice(voices('zh-HK'), 'zh-Hans')?.lang).toBe('zh-HK');
  });

  it('hasVoice agrees with pickVoice', () => {
    expect(hasVoice(voices('pt-PT'), 'pt')).toBe(true);
    expect(hasVoice([], 'pt')).toBe(false);
    expect(hasVoice(voices('en-US'), 'de')).toBe(false);
  });
});

describe('browserSpeech', () => {
  const setup = (list: { lang: string; name: string }[]) => {
    const synth = { getVoices: vi.fn(() => list), speak: vi.fn(), cancel: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() };
    class Utterance {
      lang = '';
      voice: unknown = undefined;
      constructor(readonly text: string) {}
    }
    const speech = browserSpeech({ speechSynthesis: synth, SpeechSynthesisUtterance: Utterance });
    const spoken = () => synth.speak.mock.calls.at(-1)?.[0] as Utterance | undefined;
    return { synth, speech, spoken, list };
  };

  it('speaks Portuguese as pt-BR with the Brazilian voice when one is installed', () => {
    const { speech, spoken, list } = setup(voices('pt-PT', 'pt-BR'));
    speech?.speak('Olá', 'pt');
    expect(spoken()).toMatchObject({ text: 'Olá', lang: 'pt-BR' });
    expect(spoken()?.voice).toBe(list[1]);
  });

  it('falls back to the European voice when it is the only one, still declaring pt-BR', () => {
    const { speech, spoken, list } = setup(voices('en-US', 'pt-PT'));
    expect(speech?.canSpeak('pt')).toBe(true);
    speech?.speak('Olá', 'pt');
    expect(spoken()).toMatchObject({ lang: 'pt-BR' });
    expect(spoken()?.voice).toBe(list[1]);
  });

  it('with no voices loaded yet it sets only the language and lets the browser choose', () => {
    const { speech, spoken } = setup([]);
    expect(speech?.canSpeak('pt')).toBe(false);
    speech?.speak('Olá', 'pt');
    expect(spoken()).toMatchObject({ lang: 'pt-BR' });
    expect(spoken()?.voice).toBeUndefined();
  });

  it('leaves other languages as they are', () => {
    const { speech, spoken, list } = setup(voices('de-DE'));
    speech?.speak('Hallo', 'de');
    expect(spoken()).toMatchObject({ lang: 'de' });
    expect(spoken()?.voice).toBe(list[0]);
  });

  it('subscribes to voiceschanged and unsubscribes on dispose', () => {
    const { speech, synth } = setup([]);
    const listener = () => undefined;
    const dispose = speech?.onVoicesChanged(listener);
    expect(synth.addEventListener).toHaveBeenCalledWith('voiceschanged', listener);
    dispose?.();
    expect(synth.removeEventListener).toHaveBeenCalledWith('voiceschanged', listener);
  });
});
