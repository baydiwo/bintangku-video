# Kontrak video scene-first (DEC-57)

`schemaVersion`: `2.0.0`  
`pacing`: `"scene"`  
`format`: `"kids-story"`

## `scenes[]`

| Field | Wajib | Keterangan |
|---|---|---|
| `id` | Ya | `S01`, `S02`, … |
| `beatId` | Ya | `B1`…`B9` atau gabungan `B1+B2` |
| `voText` | Ya | Narator TTS (bukan dialog maskot) |
| `speech` | Tidak | Varian ejaan untuk TTS |
| `durationHintSec` | Tidak | Estimasi sebelum VO; timeline final dari durasi MP3 |
| `delivery` | Tidak | `spoken` \| `sung` (B6) |
| `cast` | Tidak | Maskot visual: character, pose, expression, x, y |
| `action` | Tidak | Deskripsi aksi pantomim |
| `background` | Tidak | Latar |
| `sfx` | Tidak | Cue SFX |
| `captionStep` | Tidak | Teks caption langkah (B6) |

## Audio

- VO: `public/voiceover/<videoId>/<sceneId>.mp3`
- Satu `voice_id` dari `config/voice.json`
- Maskot tidak punya track suara

## Timeline

- Satu sequence per scene
- Total `durationInFrames` = 900 (30s) atau 1800 (60s)
- Remotion: composition `<videoId>` + `<videoId>-S01` …
