import { execFileSync } from "node:child_process";
import { ffmpeg, probeDuration } from "../media.ts";
import type { VoiceProvider } from "./provider.ts";

/** macOS built-in TTS. Free, offline, no timestamps. */
export const sayProvider: VoiceProvider = {
  name: "say",
  async synthesize(text, outBase, config) {
    const aiff = `${outBase}.aiff`;
    const wav = `${outBase}.wav`;
    execFileSync("say", ["-v", config.voice, "-r", String(config.rate), "-o", aiff, text]);
    // Trim the leading/trailing silence `say` adds so beat timing is tight.
    ffmpeg([
      "-i", aiff, "-ar", "44100", "-ac", "1",
      "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
      wav,
    ]);
    return { file: wav, duration: probeDuration(wav), words: null };
  },
};
