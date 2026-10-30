#!/usr/bin/env node
/**
 * Trata as falas gravadas do Dom (ElevenLabs) para o site:
 *
 *   node scripts/dom/tratar-audios.mjs <pasta-com-os-mp3-brutos>
 *
 * Saída em `public/dom/audio/v1/<id>.mp3` (mesmo nome do arquivo de entrada).
 * Depois rode `node scripts/dom/indexar-audios.mjs`.
 *
 * A cadeia, medida sobre o primeiro lote (233 falas, out/2026: centro
 * espectral médio de ~2,6 kHz, 19% da energia entre 2,5 e 6 kHz, pausas
 * internas de até 0,8 s, média de 4,7 s por fala):
 *
 * 0. **Sem apito**: alguns arquivos trazem um tom constante (1–6 kHz, um
 *    diferente em cada) até nos silêncios; `afftdn` adaptativo o remove.
 * 1. **Menos arrastado**: silêncio das pontas aparado e pausas internas
 *    limitadas a ~0,3 s; 6% mais rápido com o tom preservado (`atempo`).
 * 2. **Menos estridente** (a voz é bem "gralha"): passa-alta em 80 Hz,
 *    calor de +2 dB em 200 Hz, −4 dB em 3 kHz e −3 dB em 5,5 kHz, de-esser e
 *    passa-baixa em 10 kHz.
 * 3. **Volume igual em todas**: compressão leve e loudness em −19 LUFS
 *    (duas passadas do `loudnorm`, a segunda com as medidas da primeira),
 *    pico real em −2 dBTP.
 * 4. **Fundo relaxante**: ruído marrom passado em 120–700 Hz, ~22 dB abaixo
 *    da voz, com fade de entrada e saída — preenche o silêncio entre as
 *    palavras e tira o "seco" de estúdio, sem competir com a fala.
 * 5. MP3 mono, 44,1 kHz, VBR ~64 kbps.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ENTRADA = process.argv[2]
const SAIDA = join(RAIZ, 'public', 'dom', 'audio', 'v1')
if (!ENTRADA) {
  console.error('uso: node scripts/dom/tratar-audios.mjs <pasta-com-os-mp3-brutos>')
  process.exit(1)
}
mkdirSync(SAIDA, { recursive: true })
const TEMP = mkdtempSync(join(tmpdir(), 'dom-audio-'))

const LUFS = -19
const LIMPEZA = [
  // Tons e chiados estacionários (alguns arquivos trazem um apito constante,
  // em frequência diferente a cada um): redução espectral adaptativa e leve.
  'afftdn=nr=12:nf=-48:tn=1',
  'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03',
  'areverse',
  'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08',
  'areverse',
  'silenceremove=stop_periods=-1:stop_threshold=-42dB:stop_duration=0.32:stop_silence=0.28',
  'atempo=1.06',
  'highpass=f=80',
  'equalizer=f=200:t=q:w=0.8:g=2',
  'equalizer=f=3000:t=q:w=1:g=-4',
  'equalizer=f=5500:t=q:w=1.2:g=-3',
  'deesser=i=0.4:m=0.5:f=0.5',
  'lowpass=f=10000',
  'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2',
].join(',')

const arquivos = readdirSync(ENTRADA).filter((n) => n.toLowerCase().endsWith('.mp3')).sort()
let antes = 0
let depois = 0
for (const nome of arquivos) {
  const origem = join(ENTRADA, nome)
  const destino = join(SAIDA, basename(nome).toLowerCase())
  // Passada 1: mede a loudness depois da limpeza (o JSON sai no stderr).
  const r = ffmpeg(['-i', origem, '-af', `${LIMPEZA},loudnorm=I=${LUFS}:TP=-2:LRA=9:print_format=json`, '-f', 'null', '-'])
  const json = JSON.parse(r.slice(r.lastIndexOf('{'), r.lastIndexOf('}') + 1))
  const norm = `loudnorm=I=${LUFS}:TP=-2:LRA=9:measured_I=${json.input_i}:measured_TP=${json.input_tp}:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}:offset=${json.target_offset}:linear=true`
  // Passada 2: a voz tratada e normalizada, num WAV temporário.
  const voz = join(TEMP, `${basename(nome, '.mp3')}.wav`)
  ffmpeg(['-y', '-i', origem, '-af', `${LIMPEZA},${norm},aresample=44100,apad=pad_dur=0.35`, '-ac', '1', voz])
  const segundos = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voz], { encoding: 'utf8' }).stdout) || 1
  // Passada 3: o fundo do tamanho exato da voz, com fade, somado por baixo.
  const fundo = `anoisesrc=d=${segundos.toFixed(3)}:color=brown:amplitude=0.6:sample_rate=44100,highpass=f=120,lowpass=f=700,volume=-30dB,afade=t=in:d=0.15,afade=t=out:st=${Math.max(0, segundos - 0.4).toFixed(3)}:d=0.4`
  ffmpeg(['-y', '-i', voz, '-filter_complex', `${fundo}[f];[0:a][f]amix=inputs=2:duration=first:normalize=0[mix]`, '-map', '[mix]', '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '7', destino])
  rmSync(voz, { force: true })
  antes += statSync(origem).size
  depois += statSync(destino).size
}
rmSync(TEMP, { recursive: true, force: true })
console.log(`${arquivos.length} falas tratadas: ${(antes / 1048576).toFixed(1)} MB → ${(depois / 1048576).toFixed(1)} MB em public/dom/audio/v1/`)

/** Roda o ffmpeg e devolve o stderr (onde o `loudnorm` escreve as medidas). */
function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`ffmpeg falhou: ${String(r.stderr).slice(-400)}`)
  return r.stderr
}
