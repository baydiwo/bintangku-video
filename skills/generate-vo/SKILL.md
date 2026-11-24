# Skill: generate-vo

```bash
npm run studio:vo -- <videoId>
# dry-run estimasi: npm run studio:vo -- <videoId> --dry-run
```

- Cek saldo & batas biaya dulu.
- Cache: teks+model+voice+settings sama → tidak submit ulang.
- Unduh MP3 + alignment segera (retensi WaveSpeed ≤ 7 hari).
- Provider: WaveSpeed saja (`WAVESPEED_API_KEY`).
