# Aturan naskah

- Bahasa: **Indonesia saja** (OQ-04 dikunci).
- Brand voice: hangat, energik, kalimat pendek (BR-013).
- **VO = narator 1 suara** (DEC-55). Maskot tidak punya dialog audio (DEC-56).
- Format cerita: scene-first (`pacing: "scene"`). Satu scene ≈ satu klausa VO + aksi visual maskot.
- `scenes[].voText` = teks TTS narator; `scenes[].speech` opsional jika angka/singkatan perlu dieja.
- Total durasi tepat 30 dtk (900 frame) atau 60 dtk (1800 frame) @30 fps — **tanpa** grid 2,7 detik (DEC-48 / DEC-57).
- Jingle B6: 4–8 baris acapella, suara sama VO (DEC-47, OQ-32).
- Setiap konten baru: **storyboard lengkap + review user dulu** sebelum aset (`rules/storyboard.md`, OQ-03).
- Draf AI selalu diedit manusia dan masuk storyboard sebelum produksi.
- Jangan menulis multi-voice / `character` sebagai pembicara TTS.
