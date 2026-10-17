'use client'

/**
 * Teste de som do saguão: gravar 4 s e ouvir (o jeito seguro, sem microfonia),
 * ouvir ao vivo (com fone) e um toque curto para conferir o alto-falante.
 * Tudo local: nada sai do aparelho.
 */

function tipoDeGravacao(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t
    } catch {
      /* segue */
    }
  }
  return undefined
}

export function podeGravar(): boolean {
  return typeof MediaRecorder !== 'undefined'
}

/** Grava `ms` do microfone. `null` se o navegador não gravar. */
export function gravarTrecho(trilha: MediaStreamTrack, ms = 4_000): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!podeGravar()) return resolve(null)
    let gravador: MediaRecorder
    try {
      const tipo = tipoDeGravacao()
      gravador = new MediaRecorder(new MediaStream([trilha]), tipo ? { mimeType: tipo } : undefined)
    } catch {
      return resolve(null)
    }
    const pedacos: Blob[] = []
    gravador.ondataavailable = (e) => e.data.size && pedacos.push(e.data)
    gravador.onstop = () => resolve(pedacos.length ? new Blob(pedacos, { type: gravador.mimeType || 'audio/webm' }) : null)
    gravador.onerror = () => resolve(null)
    gravador.start()
    setTimeout(() => gravador.state !== 'inactive' && gravador.stop(), ms)
  })
}

/** Toca um áudio pelo alto-falante escolhido (quando o navegador deixa escolher). */
export async function tocar(fonte: Blob | string, saidaId: string | null, aoTerminar?: () => void): Promise<() => void> {
  const url = typeof fonte === 'string' ? fonte : URL.createObjectURL(fonte)
  const audio = new Audio(url) as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }
  if (saidaId && audio.setSinkId) await audio.setSinkId(saidaId).catch(() => {})
  const limpar = () => {
    audio.pause()
    if (typeof fonte !== 'string') URL.revokeObjectURL(url)
  }
  audio.onended = () => {
    limpar()
    aoTerminar?.()
  }
  await audio.play().catch(() => aoTerminar?.())
  return limpar
}

let toque: string | null = null

/** Duas notas curtas (WAV gerado aqui, ~40 KB na memória, uma vez). */
export function toqueDeTeste(): string {
  if (toque) return toque
  const taxa = 22_050
  const notas: Array<[number, number]> = [
    [659.25, 0.22],
    [987.77, 0.34],
  ]
  const total = Math.floor(taxa * notas.reduce((t, [, d]) => t + d, 0))
  const dados = new Int16Array(total)
  let i = 0
  for (const [freq, dur] of notas) {
    const n = Math.floor(taxa * dur)
    for (let k = 0; k < n && i < total; k++, i++) {
      const t = k / taxa
      const env = Math.min(1, k / (taxa * 0.01)) * Math.exp(-4 * (k / n))
      dados[i] = Math.round(Math.sin(2 * Math.PI * freq * t) * env * 0.45 * 32767)
    }
  }
  const buf = new ArrayBuffer(44 + dados.byteLength)
  const v = new DataView(buf)
  const escrever = (o: number, s: string) => [...s].forEach((c, j) => v.setUint8(o + j, c.charCodeAt(0)))
  escrever(0, 'RIFF')
  v.setUint32(4, 36 + dados.byteLength, true)
  escrever(8, 'WAVE')
  escrever(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, taxa, true)
  v.setUint32(28, taxa * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  escrever(36, 'data')
  v.setUint32(40, dados.byteLength, true)
  new Int16Array(buf, 44).set(dados)
  toque = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
  return toque
}
