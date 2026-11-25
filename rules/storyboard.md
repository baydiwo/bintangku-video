# Aturan storyboard (OQ-03 — dikunci user)

Setiap konten **baru** wajib punya storyboard lengkap dan sudah direview user **sebelum** membuat aset produksi (VO, ornamen baru, render draft/final, handoff).

## Wajib ada di storyboard

File: `videos/<videoId>/storyboard.md`.

Minimal berisi:

1. **Brief** — topik, tujuan, CTA
2. **Durasi target** — 30 atau 60 detik (900 / 1800 frame @30 fps)
3. **Scene-by-scene** — untuk tiap scene (S01…): `beatId` (B1–B9), teks **VO narator**, cast visual + pose/ekspresi, latar/ornamen, SFX, caption langkah (B6), `delivery` (`spoken` / `sung`)
4. **Estimasi durasi** per scene (detik), bukan slot 2,7 detik
5. **Caption** — on/off; catatan ejaan
6. **Checklist brand** — warna/font/safe area

## Gerbang review

| Status | Artinya | Boleh VO / aset? |
|---|---|---|
| `storyboard_draft` | Agent/manusia menulis storyboard | Tidak |
| `storyboard_in_review` | Menunggu user | Tidak |
| `storyboard_approved` | User sudah setuju | Ya — baru `vo` / aset / `gen` |
| revisi | User minta ubah | Kembali draft; aset berbayar jangan dijalankan |

Approval storyboard **hanya dari user** (BR-006). Agent tidak boleh menganggap storyboard sudah OK.

## Urutan kerja

```
ide/brief → tulis storyboard scene → review user →
  baru: video.json (pacing: scene) → validate → vo → timeline → …
```

Preview Studio: composition penuh + **satu composition per scene** (DEC-57).

Jangan generate VO WaveSpeed, jangan draft ornamen berbayar, jangan render final sebelum `storyboard_approved`.
