import type { VoiceConfig, WordTiming } from "../schemas.ts";

export interface BeatAudio {
  /** path to a wav file for this beat */
  file: string;
  duration: number;
  /** word timings relative to the start of this beat; null = estimate later */
  words: WordTiming[] | null;
}

export interface VoiceProvider {
  name: string;
  synthesize(text: string, outBase: string, config: VoiceConfig): Promise<BeatAudio>;
}
