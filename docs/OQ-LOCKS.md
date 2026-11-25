# Open question locks (dari user)

Tanggal: 24–25 Nov 2026. Status: OQ yang ditanyakan sudah dikunci (kecuali tugas aset/SVG).

## Amandemen aktif (25 Nov 2026) — produksi MVP

| ID | Keputusan |
|---|---|
| DEC-55 | VO = **1 suara narator** (bukan suara maskot). Tetap `config/voice.json` |
| DEC-56 | Maskot **tidak bicara** — hanya gerak / pose / ekspresi (pantomim) |
| DEC-57 | Timeline & preview Studio = **per scene storyboard** (`pacing: "scene"`). Bukan multi-voice dialog; bukan grid 2,7 dtk |
| DEC-58 | Topik uji: **sikat gigi sebelum tidur, 60 detik** (OQ-38) |
| OQ-32 | Jingle B6: **suara sama dengan VO** |
| OQ-34 | **Tidak berlaku** (tidak ada voice per maskot) |
| ~~DEC-49 / 50 / 52~~ | Diganti untuk MVP aktif oleh DEC-55..57 (multi-tokoh bicara, multi-voice, lip-sync per tokoh bicara) |

Cast visual format cerita tetap: Dreamer (surrogate), Explorer (catalyst), Dream Keeper / Thinker (guide) — **hanya visual**.

## Lock sebelumnya (24 Nov 2026)

| ID | Keputusan |
|---|---|
| OQ-02 | **Setuju semua** usulan DEC (kecuali diganti OQ/DEC lain) |
| OQ-03 | Konten generate baru; wajib **storyboard lengkap + review user** sebelum aset. Lihat `rules/storyboard.md` |
| OQ-04 | Bahasa Indonesia saja |
| OQ-07 | Safe area Meta ads: top 14% / bottom 35% / side 6% → @1080×1920: 269 / 672 / 65 px |
| OQ-08 | Tanpa batas biaya; `voice_id` di `config/voice.json` |
| OQ-11 | Tidak ada image-to-video — **full SVG** |
| OQ-12 | Blender **off** sampai user minta |
| OQ-14 | Volume ~**1–2 video/minggu** |
| OQ-15 | Render: **laptop** + **computer Grok bot** |
| OQ-16 | PNG & aset di `brand/reference/`; produksi butuh SVG/React rig |
| OQ-17 | Karakter tamu MVP awal: Salman + Cheerleader (+ Thinker). Format cerita visual: Dreamer/Explorer/Dream Keeper |
| OQ-18 | **Langsung push** |
| OQ-19 | WaveSpeed: **polling** |
| OQ-20 | Codec/bitrate: **default Remotion** (H.264) |
| OQ-21/22 | TTS via WaveSpeed Eleven v3 Timing; voice ID dikunci di config |
| OQ-23 | AI Story Generator boleh diuji |
| OQ-24 | Moderasi otomatis **tidak** — review manual |
| OQ-25 | Cadangan ElevenLabs API langsung boleh jika VO WaveSpeed jelek |
| OQ-26 | Slug repo: `bintangku-video-studio` |
| OQ-31 | SFX **wajib**; sumber free / berlisensi bebas |
| OQ-33 | Folder Google Drive **baru** untuk handoff |

## Ditutup sebelumnya (PRD)

OQ-01, 05, 06, 09, 10, 13, 27–30, 38.

## Bukan OQ — masih kerja

| ID | Tugas | Status |
|---|---|---|
| TASK-USR-001 | Rig SVG maskot (Thinker + Dreamer/Explorer/DK) | Thinker/Explorer visual sementara; rig ber-layer open |
| TASK-USR-002 | Font Fredoka + Nunito Sans | ✅ |
| TASK-USR-006 | Google Drive OAuth Desktop | Open |
| SFX | Pustaka free | ✅ Kenney CC0 awal |
