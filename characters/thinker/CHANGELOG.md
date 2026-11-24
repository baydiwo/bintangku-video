# Thinker rig changelog

## 0.1.1 — visual default = Explorer PNG

- Remotion default `visual="explorer"` memakai `mascot-explorer.png` (look cocok brand).
- `mascot-explorer.svg` disimpan di `_trace/` — wrapper PNG, bukan master ber-layer.
- Geometric `ThinkerRig` tetap ada (`visual="rig"`).

## 0.1.0 — SVG rig v1 (TASK-USR-001)

- Layered React SVG `src/characters/ThinkerRig.tsx` + `Thinker.tsx` (bukan PNG stand-in).
- Layer IDs TRD §07.2: `treads`, `body`, `arm-left`, `arm-right`, `tablet`, `head`, `visor`, `eye-*`, `eyelids`, `mouth-*`, `antenna`, `bulb`, `bulb-glow`.
- Warna maskot dikunci di `brand/tokens.json` dari sampling `brand/reference/thinker.png` (TASK-VAL-002).
- Pose maps + expression→mouth di `poses.json` / `expressions.json` + `src/characters/types.ts`.
- Lip-sync 5 bentuk mulut; blink deterministik; bulb on/dim/off per pose.
- `parts/master.svg` = snapshot statis untuk ilustrator (sumber produksi = React).

## 0.0.1 — placeholder SVG layers

- `parts/master.svg` dengan ID layer TRD (geometri kasar).

## 0.0.0 — scaffold

- Struktur folder `parts/` siap.
