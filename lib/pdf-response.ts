/**
 * Entrega de PDF grande a partir de uma Vercel Function.
 *
 * O problema que este módulo resolve:
 *   Uma função que devolve o arquivo inteiro de uma vez (`new Response(buffer)`)
 *   tem o corpo cortado pela borda da Vercel acima de ~4,5 MB. O corte acontece
 *   DEPOIS de os cabeçalhos já terem saído, então o navegador registra
 *   "200 (OK)" seguido de `net::ERR_FAILED` — foi exatamente o que apareceu no
 *   console em `POST /api/materiais/download`. Do lado do usuário, o material
 *   simplesmente não baixava, e a mensagem exibida culpava a internet dele.
 *
 *   Entregue em pedaços, o corpo é tratado como resposta em streaming e o teto
 *   deixa de valer. Vale notar que o PDF carimbado costuma ser MAIOR que o
 *   original — `pdf-lib` reserializa sem object streams (ver `pdf-watermark`) —,
 *   então materiais que cabiam no limite no armazenamento passavam a estourá-lo
 *   depois da marca d'água.
 *
 * O `pull` (e não um `enqueue` de tudo na criação) é o que faz o corpo sair no
 * ritmo em que o cliente consome, em vez de empilhar o arquivo inteiro numa
 * fila interna antes do primeiro byte chegar à rede.
 */

/**
 * Tamanho de cada pedaço. 256 KB é grande o bastante para o custo por pedaço
 * ser irrelevante e pequeno o bastante para a resposta começar a fluir de
 * imediato.
 */
export const PDF_STREAM_CHUNK_BYTES = 256 * 1024

export function pdfBytesToStream(
  bytes: Uint8Array,
  chunkBytes: number = PDF_STREAM_CHUNK_BYTES
): ReadableStream<Uint8Array> {
  const size = Math.max(1, Math.floor(chunkBytes))
  let offset = 0

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.byteLength) {
        controller.close()
        return
      }
      const end = Math.min(offset + size, bytes.byteLength)
      controller.enqueue(bytes.subarray(offset, end))
      offset = end
    },
  })
}
