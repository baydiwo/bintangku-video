/** Grid constants — BR-003, ADR-08 */
export const FPS = 30;
export const SLOT_FRAMES = 81; // 2.7s @ 30fps
export const MIN_SLOTS = 11;
export const MAX_SLOTS = 22;

export function slotsToFrames(slots: number): number {
  return slots * SLOT_FRAMES;
}

export function ceilVoToSlots(
  voDurationSec: number,
  padStartFrames = 6,
  padEndFrames = 6,
  minSlots = 1,
): number {
  const voFrames = Math.ceil(voDurationSec * FPS);
  const need = padStartFrames + voFrames + padEndFrames;
  return Math.max(minSlots, Math.ceil(need / SLOT_FRAMES));
}
