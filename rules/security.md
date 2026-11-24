# Keamanan secret

- Secret hanya di `.env` lokal / secret store; tidak pernah di-commit.
- Variabel: `WAVESPEED_API_KEY` (lihat `.env.example`).
- Jika key bocor: cabut key di WaveSpeed → buat key baru → bersihkan riwayat git bila perlu.
- Pre-commit / CI: secret scanner (gitleaks atau setara).
- File upload ke WaveSpeed hanya draf resolusi rendah; retensi WaveSpeed ≤ 7 hari.
