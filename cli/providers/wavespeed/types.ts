export type WavespeedPredictionStatus =
  | "created"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout"
  | "deleted"
  | string;

export type WavespeedSubmitResult = {
  predictionId: string;
  raw: unknown;
};

export type WavespeedPollResult = {
  predictionId: string;
  status: WavespeedPredictionStatus;
  outputs: unknown;
  error?: string;
  raw: unknown;
};

export type CharacterAlignment = {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
};

export type TtsTimingResult = {
  audioUrl: string;
  alignment: CharacterAlignment | null;
  rawOutputs: unknown;
};

export class CliError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.code = code;
    this.name = "CliError";
  }
}
