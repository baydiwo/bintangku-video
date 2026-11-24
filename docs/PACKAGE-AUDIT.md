# Audit `package.json` vs TRD v1.1

Tanggal: 24 Nov 2026.

## Selaras TRD

| Package | Peran TRD |
|---|---|
| `remotion`, `@remotion/cli` | Framework + Studio + render |
| `@remotion/captions` | Caption per kata (ADR-04) |
| `@remotion/three`, `@react-three/fiber`, `three` | Efek `fx3d` opsional (ADR-03) |
| `@remotion/animation-utils`, `@remotion/layout-utils`, `@remotion/media`, `@remotion/zod-types` | Motion, layout caption, media, schema Remotion |
| `react`, `react-dom` | Komponen |
| `zod` | Validasi props composition (template) |
| `ajv`, `ajv-formats` | **Ditambah** — JSON Schema draft 2020-12 untuk `video.json` / `timeline.json` |
| `mediabunny` | Dekode/ukur media (dukung envelope VO di CLI) |
| `tsx`, `yargs`, `chalk`, `ora`, `prompts`, `dotenv`, `uuid` | CLI |

## Dihapus (tidak sesuai TRD)

| Package | Alasan |
|---|---|
| `@elevenlabs/elevenlabs-js` | DEC-24 / BR-014: tidak ada ElevenLabs API langsung; TTS lewat WaveSpeed |
| `@remotion/install-whisper-cpp` | TRD alignment fallback = WaveSpeed STT atau WhisperX lokal (Python), bukan whisper-cpp |

## CLI WaveSpeed (selesai)

Template OpenAI/ElevenLabs dihapus. Entry: `tsx cli/cli.ts <cmd>`.

Perintah: `new`, `validate`, `vo`, `timeline`, `qa`, `review`, `approve`, `request-changes`, `draft`, `render`, `gen`, `story`, `balance`.

Adapter: `cli/providers/wavespeed/` — submit sekali, poll + backoff, unduh segera, cek saldo.

## Dipertahankan sementara (bukan target akhir)

| Package | Catatan |
|---|---|
| `@remotion/google-fonts` | Template Audiogram masih memakainya. Target TRD: font lokal di `brand/fonts/` (Fredoka, Nunito Sans). Hapus setelah font brand terpasang (TASK-USR-002). |

## WaveSpeed

Tidak ada SDK resmi di TRD. Adapter sendiri di `cli/providers/wavespeed/` memakai `fetch` Node (Node ≥ 20).

## ADR-09 — versi Remotion seragam

Semua `remotion` / `@remotion/*` masih `^4.0.0`. Setelah `npm install`, jalankan `npx remotion upgrade` lalu commit lockfile agar versi **persis sama** (bukan caret).
