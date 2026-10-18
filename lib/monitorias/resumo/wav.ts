/**
 * WAV PCM 16 bits mono com um tom baixo de 440 Hz, para o autoteste do Resumo
 * por IA. Puro (DataView): o navegador do admin manda este arquivo direto ao
 * Google, e o servidor manda o mesmo quando o navegador não consegue.
 */
export function wavDeTeste(ms = 1_000, taxa = 16_000): Uint8Array {
  const amostras = Math.round((ms / 1000) * taxa)
  const dados = amostras * 2
  const v = new DataView(new ArrayBuffer(44 + dados))
  const texto = (pos: number, s: string) => [...s].forEach((ch, i) => v.setUint8(pos + i, ch.charCodeAt(0)))
  texto(0, 'RIFF')
  v.setUint32(4, 36 + dados, true)
  texto(8, 'WAVE')
  texto(12, 'fmt ')
  v.setUint32(16, 16, true) // tamanho do bloco fmt
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true) // mono
  v.setUint32(24, taxa, true)
  v.setUint32(28, taxa * 2, true) // bytes por segundo
  v.setUint16(32, 2, true) // bytes por amostra
  v.setUint16(34, 16, true) // bits
  texto(36, 'data')
  v.setUint32(40, dados, true)
  for (let i = 0; i < amostras; i++) v.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * 440 * i) / taxa) * 3000), true)
  return new Uint8Array(v.buffer)
}
