import * as path from "path";
import { readJson } from "./atomic";
import { configDir } from "./paths";

export type VoiceConfig = {
  provider: string;
  model: string;
  voice_id: string | null;
  settings?: { stability?: number; [k: string]: unknown };
  returns_alignment?: boolean;
  locked?: boolean;
};

export type BudgetConfig = {
  perVideoUsd: number | null;
  perMonthUsd: number | null;
  minBalanceUsd: number;
  rates: Array<{
    model: string;
    unit: string;
    priceUsd: number;
  }>;
};

export type ModelsConfig = {
  tts: { model: string; enabled: boolean };
  story: { model: string; enabled: boolean };
  moderateVideo: { model: string; enabled: boolean };
  [k: string]: unknown;
};

export type RenderConfig = {
  fps: number;
  slotFrames: number;
  width: number;
  height: number;
  codec: string;
  draft?: { scale: number; watermark: string };
};

export type LipsyncConfig = {
  T1: number | null;
  T2: number | null;
  minHoldFrames: number;
  padStartFrames: number;
  padEndFrames: number;
};

export type ApproversConfig = {
  approvers: Array<{ name?: string; email?: string }>;
};

const load = <T>(name: string): T =>
  readJson<T>(path.join(configDir(), name));

export const loadVoice = () => load<VoiceConfig>("voice.json");
export const loadBudget = () => load<BudgetConfig>("budget.json");
export const loadModels = () => load<ModelsConfig>("models.json");
export const loadRender = () => load<RenderConfig>("render.json");
export const loadLipsync = () => load<LipsyncConfig>("lipsync.json");
export const loadApprovers = () => load<ApproversConfig>("approvers.json");
