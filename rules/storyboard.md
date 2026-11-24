# Aturan storyboard (OQ-03 — dikunci user)

Setiap konten **baru** wajib punya storyboard lengkap dan sudah direview user **sebelum** membuat aset produksi (VO, ornamen baru, render draft/final, handoff).

## Wajib ada di storyboard

File: `videos/<videoId>/storyboard.md` (atau setara yang disepakati di folder video).

Minimal berisi:

1. **Brief** — topik, tujuan, CTA
2. **Durasi target** — 30 atau 60 detik (11 / 22 slot)
3. **Beat-by-beat** — untuk tiap beat: teks VO (`text` / `speech`), teks layar, pose/ekspresi Thinker, ornamen/latar, SFX (jika ada), `delivery` (`spoken` / `sung`)
4. **Alokasi slot** — estimasi slot per beat (kelipatan 2,7 detik)
5. **Caption** — on/off; catatan ejaan penting
6. **Checklist brand** — warna/font/safe area tidak dilanggar di rencana

## Gerbang review

| Status | Artinya | Boleh VO / aset? |
|---|---|---|
| `storyboard_draft` | Agent/manusia menulis storyboard | Tidak |
| `storyboard_in_review` | Menunggu user | Tidak |
| `storyboard_approved` | User sudah setuju | Ya — baru `vo` / aset / `gen` |
| revisi | User minta ubah | Kembali draft; aset berbayar jangan dijalankan |

Approval storyboard **hanya dari user** (sama semangat BR-006). Agent tidak boleh menganggap storyboard sudah OK.

## Urutan kerja

```
ide/brief → tulis storyboard lengkap → review user →
  baru: video.json final / beats → validate → vo → timeline → …
```

Jangan generate VO WaveSpeed, jangan draft ornamen berbayar, jangan render final sebelum `storyboard_approved`.
