# AGENTS.md — Bintangku Video Studio

Urutan baca wajib sebelum mengerjakan video:

1. `rules/` (brand, script, storyboard, safe-area, qa-checklist)
2. `brand/tokens.json`
3. `docs/OQ-LOCKS.md` (amandemen VO narator)
4. `skills/` yang relevan dengan langkah
5. `videos/<videoId>/storyboard.md` lalu `video.json`

## Larangan agent

- Jangan set status `approved` (render) atau jalankan `approve` (BR-006). Approval hanya user.
- Jangan anggap storyboard sudah OK tanpa status `storyboard_approved` (OQ-03 / `rules/storyboard.md`).
- Jangan jalankan `vo` / `gen` / aset berbayar / render final sebelum storyboard disetujui user.
- Jangan ubah warna maskot / `brand/tokens.json` warna maskot (BR-008).
- Jangan commit secret (`.env`, API key) (BR-009).
- Jangan publish ke Instagram (BR-012). Upload Drive hanya lewat perintah `handoff` setelah render approved.
- Jangan edit `timeline.json` manual — itu turunan dari `video.json` (BR-002).
- AI utama lewat WaveSpeed (`WAVESPEED_API_KEY`). ElevenLabs API langsung hanya cadangan (OQ-25).
- Jangan generate multi-voice / dialog per maskot — VO = **narator 1 suara**; maskot bisu (DEC-55, DEC-56).

## Workflow singkat

```
brief → storyboard scene → review user (storyboard_approved) →
  video.json (pacing: scene) → validate → vo → timeline → qa →
  review Studio (penuh + per scene) → approve (user) → render → handoff
```

`npm run gen -- <videoId>` hanya setelah storyboard disetujui.

Format cerita: 8 beat (B1–B9), jingle B6 acapella, tanpa grid 2,7 dtk, preview **per scene**.
Cast visual default uji: Dreamer + Explorer + Dream Keeper (sikat gigi 60 dtk).
Keputusan OQ: `docs/OQ-LOCKS.md`. Spek: `docs/PRD-v1.4.md`, `docs/TRD-v1.4.md`, `docs/PANDUAN-FORMAT-CERITA-v1.md`.

## Referensi

- PRD: `docs/PRD-v1.4.md` (amandemen DEC-55..58)
- TRD: `docs/TRD-v1.4.md`
- Panduan cerita: `docs/PANDUAN-FORMAT-CERITA-v1.md`
