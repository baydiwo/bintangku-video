# Salman — catatan produksi

- Role: anak surrogate (bukan 6 maskot brand)
- Master sheet: `brand/reference/Salman.png`
- Sheet copy: `public/characters/salman.png`
- Pose crop (alpha): `public/characters/salman/<pose>.png` (+ mirror `characters/salman/poses/`)
- Komponen Remotion: `src/characters/Salman.tsx`

## Pose dari sheet

| File | Sheet | Dipakai untuk |
|---|---|---|
| `stand` | depan, tangan di saku | idle / sleepy / sit |
| `stand-34` | ¾ | dismissive / point |
| `side` | profil | brush-side |
| `cheer` | tinju naik | proud / confident (B7) |
| `topdown` | dari atas | opsional |
| `straps` | genggam strap | scared / worried / huddle |
| `closeup` | bust | brush-front / lidah |
| `back` | belakang | opsional |
| `stand-alt` | depan ulang | cadangan |

Wajah blank → tanpa mouthTrack; ekspresi = ganti pose PNG.
