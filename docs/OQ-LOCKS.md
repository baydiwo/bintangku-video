# Open question locks (dari user)

Tanggal: 24 Nov 2026. Status: **semua OQ PRD/TRD yang ditanyakan sudah dikunci** (kecuali tugas aset/SVG yang masih kerja, bukan pertanyaan).

| ID | Keputusan |
|---|---|
| OQ-02 | **Setuju semua** usulan DEC (kecuali yang diganti keputusan OQ lain, mis. no i2v, no musik, no moderasi otomatis) |
| OQ-03 | Konten generate baru; wajib **storyboard lengkap + review user** sebelum aset. Lihat `rules/storyboard.md` |
| OQ-04 | Bahasa Indonesia saja |
| OQ-07 | Safe area Meta ads: top 14% / bottom 35% / side 6% → @1080×1920: 269 / 672 / 65 px (`config/safe-area.json`) |
| OQ-08 | Tanpa batas biaya; `voice_id` di `config/voice.json` (ElevenLabs ID via WaveSpeed) |
| OQ-11 | Tidak ada image-to-video — **full SVG** |
| OQ-12 | Blender **off** sampai user minta |
| OQ-14 | Volume ~**1–2 video/minggu** |
| OQ-15 | Render: **laptop** + **computer Grok bot** |
| OQ-16 | PNG & aset ada di `brand/reference/` (masih PNG); produksi tetap butuh SVG/React rig |
| OQ-17 | Karakter tamu MVP: **Salman** + **Cheerleader** (plus Thinker). Referensi: `brand/reference/Salman.png`, `cheerleader.png`, `thinker.png` |
| OQ-18 | **Langsung push** (tanpa proteksi branch / wajib PR) |
| OQ-19 | WaveSpeed: **polling** (bukan webhook) |
| OQ-20 | Codec/bitrate: **default Remotion** (H.264) |
| OQ-21/22 | TTS via WaveSpeed Eleven v3 Timing; voice ID dari ElevenLabs dikunci di config |
| OQ-23 | AI Story Generator boleh diuji |
| OQ-24 | Moderasi otomatis **tidak** — review manual |
| OQ-25 | Cadangan ElevenLabs API langsung boleh jika VO WaveSpeed jelek |
| OQ-26 | Slug repo: `bintangku-video-studio` |
| OQ-31 | SFX **wajib**; sumber = **SFX free / berlisensi bebas** (cari & catat di `audio-library/LICENSES.md`) |
| OQ-32 | Jingle boleh **di-mix** sesuai storyboard; **suara sama dengan VO** terkunci |
| OQ-33 | Folder Google Drive **baru** untuk handoff; ID/URL di `config/handoff.json` |

## Ditutup sebelumnya (PRD)

OQ-01, 05, 06, 09, 10, 13, 27–30.

## Bukan OQ — masih kerja

| ID | Tugas | Status |
|---|---|---|
| TASK-USR-001 | Rig SVG Thinker (+ Salman, Cheerleader) dari PNG | Thinker SVG rig v0.1 di Remotion (warna dikunci). Salman/Cheerleader masih scaffold |
| TASK-USR-002 | Font Fredoka + Nunito Sans ke `brand/fonts/` | ✅ TTF OFL di-download; Remotion pakai `@remotion/google-fonts` |
| TASK-USR-006 | Google Drive OAuth Desktop untuk `drive-auth` | Open — `handoff` lokal siap; upload tunggu OAuth |
| SFX | Cari & unduh SFX free → `audio-library/sfx/` | ✅ Kenney UI Audio CC0 (7 file) + `LICENSES.md` |
