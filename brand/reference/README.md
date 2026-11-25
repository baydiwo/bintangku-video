# Brand reference

Sumber visual maskot / karakter. File di sini = referensi; produksi Remotion memakai salinan di `public/characters/` atau komponen React.

| File | Karakter | Catatan |
|---|---|---|
| `Salman.png` | **Salman** (anak, surrogate uji) | Character sheet 3×3 — dikunci untuk video sikat gigi. Pose: `public/characters/salman/*.png` |
| `Chibi Cosmic Astronaut Sticker Squad.png` | 6 maskot brand | Sumber crop Dream Keeper → `public/characters/dream-keeper/default.png` |
| `thinker.png` | Thinker (roda rantai + bohlam) | Referensi Thinker; geometric rig di `ThinkerRig.tsx` |
| `mascot-explorer.png` / `.svg` | Explorer (astronaut + jetpack) | `public/characters/explorer/default.png` |
| `cheerleader.png` | Cheerleader (MVP, OQ-17) | Perlu SVG rig |
| `grover.png` | Grower/Grover | Cadangan |
| `3bd463….svg` | Recraft AI export | Trace/bahan, bukan master rig |

## Salman (character sheet)

- Style: chibi 3D-ish, wajah **tanpa mata/mulut** (blush pink saja) — ekspresi lewat pose/badan
- Rambut: cokelat tebal, berantakan
- Baju: kaos kuning + bintang putih besar
- Celana: jeans biru cuff; sepatu putih-biru; ransel navy
- Grid sheet: front / 3⁄4 / side / cheer-fist / top-down / genggam strap / close-up / back / front ulang
- Bukan maskot Bintangku — **anak surrogate** (pengganti Dreamer di video uji)
- Warna maskot resmi di `tokens.json` **tidak** diganti untuk Salman (BR-008)

## Catatan `mascot-explorer.svg`

File ini **boleh dipakai sebagai visual**, tapi:

1. Isinya image PNG tertanam (`<image xlink:href="data:image/png…">`), bukan path SVG terpisah.
2. Tidak bisa di-rig per layer (`arm-left`, `mouth-open`, …) tanpa digambar ulang.
3. Remotion memakai `mascot-explorer.png` lewat `staticFile("characters/explorer.png")`.

Alur ideal (DEC-13): PNG → gambar ulang SVG ber-layer → komponen React. Warna maskot dikunci di `brand/tokens.json`.
