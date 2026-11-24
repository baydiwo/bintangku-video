# Referensi: skill voiceover Remotion

Permalink terakhir (file dihapus dari main 18 Nov 2026):

https://github.com/remotion-dev/skills/blob/473352613039e718e46655a26df224851e84c4aa/skills/remotion-best-practices/remotion-markup/voiceover.md

Pengganti di main: `audio.md` di repo skills yang sama.

## Penyesuaian ke grid 2,7 detik (TRD §14)

| Skill resmi | Project ini |
|---|---|
| TTS per scene | TTS per beat → `public/voiceover/<videoId>/<beatId>.mp3` |
| ElevenLabs langsung | WaveSpeed `elevenlabs/eleven-v3/timing` |
| Durasi scene = durasi audio | Durasi beat = ceil(VO) ke kelipatan 81 frame |
| `ELEVENLABS_API_KEY` | `WAVESPEED_API_KEY` + `config/voice.json` |
