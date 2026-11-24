# Brand reference

Sumber visual maskot. File di sini = referensi; produksi Remotion memakai salinan di `public/characters/` atau komponen React.

| File | Karakter | Catatan |
|---|---|---|
| `thinker.png` | Thinker (roda rantai + bohlam) | Referensi Thinker; geometric rig di `ThinkerRig.tsx` |
| `mascot-explorer.png` / `.svg` | Explorer (astronaut + jetpack) | **Visual default Remotion saat ini.** `.svg` = PNG di dalam SVG (bukan path ber-layer) |
| `Salman.png` | Salman (MVP, OQ-17) | Perlu SVG rig |
| `cheerleader.png` | Cheerleader (MVP, OQ-17) | Perlu SVG rig |
| `grover.png` | Grower/Grover | Cadangan |
| `3bd463….svg` | Recraft AI export | Trace/bahan, bukan master rig |

## Catatan `mascot-explorer.svg`

File ini **boleh dipakai sebagai visual**, tapi:

1. Isinya image PNG tertanam (`<image xlink:href="data:image/png…">`), bukan path SVG terpisah.
2. Tidak bisa di-rig per layer (`arm-left`, `mouth-open`, …) tanpa digambar ulang.
3. Remotion memakai `mascot-explorer.png` lewat `staticFile("characters/explorer.png")`.

Alur ideal (DEC-13): PNG → gambar ulang SVG ber-layer → komponen React. Warna maskot dikunci di `brand/tokens.json`.
