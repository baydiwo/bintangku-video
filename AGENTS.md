# AGENTS.md — Bintangku Video Studio

Urutan baca wajib sebelum mengerjakan video:

1. `rules/` (brand, script, storyboard, safe-area, qa-checklist)
2. `brand/tokens.json`
3. `skills/` yang relevan dengan langkah
4. `videos/<videoId>/storyboard.md` lalu `video.json`

## Larangan agent

- Jangan set status `approved` (render) atau jalankan `approve` (BR-006). Approval hanya user.
- Jangan anggap storyboard sudah OK tanpa status `storyboard_approved` (OQ-03 / `rules/storyboard.md`).
- Jangan jalankan `vo` / `gen` / aset berbayar / render final sebelum storyboard disetujui user.
- Jangan ubah warna maskot Thinker / `brand/tokens.json` warna maskot (BR-008).
- Jangan commit secret (`.env`, API key) (BR-009).
- Jangan publish ke Instagram (BR-012). Upload Drive hanya lewat perintah `handoff` setelah render approved.
- Jangan edit `timeline.json` manual — itu turunan dari `video.json` (BR-002).
- AI utama lewat WaveSpeed (`WAVESPEED_API_KEY`). ElevenLabs API langsung hanya cadangan jika VO WaveSpeed tidak sesuai harapan (OQ-25) — jangan dipakai default.

## Workflow singkat

```
brief → storyboard lengkap → review user (storyboard_approved) →
  video.json → validate → vo → timeline → qa → review → approve (user) → render → handoff
```

`npm run gen -- <videoId>` hanya setelah storyboard disetujui.

Karakter MVP: Thinker, Salman, Cheerleader (PNG di `brand/reference/`; produksi = SVG rig).
Blender off sampai user minta. Tidak ada image-to-video. Jingle suara = voice VO terkunci.
Keputusan OQ: `docs/OQ-LOCKS.md`.

## Referensi

- PRD: `docs/PRD-v1.3.md`
- TRD: `docs/TRD-v1.3.md`

