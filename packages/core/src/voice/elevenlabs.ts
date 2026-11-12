import fs from "node:fs";
import { ffmpeg, probeDuration } from "../media.ts";
import type { WordTiming } from "../schemas.ts";
import type { VoiceProvider } from "./provider.ts";

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

function wordsFromAlignment(a: Alignment): WordTiming[] {
  const words: WordTiming[] = [];
  let cur: WordTiming | null = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { text: "", start: a.character_start_times_seconds[i], end: 0 };
    cur.text += ch;
    cur.end = a.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words;
}

/** ElevenLabs TTS with character-level timestamps. Needs ELEVENLABS_API_KEY. */
export const elevenlabsProvider: VoiceProvider = {
  name: "elevenlabs",
  async synthesize(text, outBase, config) {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
    const voiceId = config.elevenlabsVoiceId ?? config.voice;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { audio_base64: string; alignment: Alignment };
    const mp3 = `${outBase}.mp3`;
    const wav = `${outBase}.wav`;
    fs.writeFileSync(mp3, Buffer.from(body.audio_base64, "base64"));
    ffmpeg(["-i", mp3, "-ar", "44100", "-ac", "1", wav]);
    return { file: wav, duration: probeDuration(wav), words: wordsFromAlignment(body.alignment) };
  },
};
