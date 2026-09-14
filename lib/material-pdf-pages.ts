/**
 * Derivadas de página do visualizador de materiais.
 *
 * ## O problema que isto resolve
 *
 * `/api/materiais/[id]/pdf-viewer/page` entrega UMA página por requisição — é
 * o que impede o PDF inteiro de sair pelo cliente. Só que, para montar essa
 * página, ela baixava o documento **inteiro** do Blob e o parseava do zero:
 *
 *     1 página pedida  →  baixa 200 MB  →  parseia 3.000 páginas  →  devolve 250 KB
 *
 * O cache em memória de `fetchMaterialPdfBytes` amortiza isso dentro de uma
 * instância, mas tem três furos: o teto de `PDF_VIEWER_BLOB_CACHE_MAX_MB`
 * (160 MB por padrão) exclui justamente os escaneados grandes, o Fluid escala
 * horizontalmente e cada instância nova paga o download de novo, e o TTL é de
 * 10 minutos. As miniaturas do painel lateral usam o mesmo endpoint, então
 * abrir um material no desktop dispara dezenas dessas rodadas.
 *
 * O resultado apareceu na fatura: 63 GB de Blob Data Transfer para 1 GB
 * guardado — cada byte armazenado saiu 63 vezes.
 *
 * ## O conserto
 *
 * A primeira vez que uma página é pedida, o documento inteiro é baixado (não
 * tem como fugir disso), mas a página extraída — ainda **sem** marca d'água —
 * é gravada no Blob como um PDF de uma página só. Da segunda vez em diante,
 * aquela página custa um GET de algumas centenas de KB e um parse de uma
 * página.
 *
 *     1 página pedida  →  baixa 250 KB  →  parseia 1 página  →  devolve 250 KB
 *
 * Nada disso muda o que o aluno recebe: a marca d'água continua sendo aplicada
 * na requisição, com o nome, o e-mail, o horário e o QR de auditoria de quem
 * pediu. A derivada é só o insumo nu, equivalente à página que hoje sai de
 * `copyPages` sobre o documento completo.
 *
 * ## Por que é seguro guardar a página nua
 *
 * O PDF original do material já vive no mesmo store, sob `access: 'private'`
 * (ver `app/api/materiais/upload/route.ts`), e só é legível com o
 * `BLOB_READ_WRITE_TOKEN`. As derivadas usam exatamente o mesmo regime e o
 * mesmo token — uma página avulsa privada é estritamente menos exposição do que
 * o documento completo que já estava lá.
 *
 * ## Por que a versão entra na chave
 *
 * O upload grava com `addRandomSuffix: false`, então reenviar um arquivo com o
 * mesmo nome para o mesmo material produz a **mesma** `blobUrl` com conteúdo
 * diferente. Chavear a derivada só pela URL serviria a página antiga do
 * material novo. Por isso a chave inclui tamanho e data do upload: qualquer
 * reenvio muda o caminho das derivadas e as antigas simplesmente deixam de ser
 * consultadas. Elas viram órfãs no store (alguns KB por página, a centavos por
 * GB/mês) e reenvio de material é evento raro — trocar isso por uma varredura
 * de limpeza a cada upload não se paga.
 *
 * ## Tudo aqui falha para o lado seguro
 *
 * Nenhuma função deste módulo lança. Derivada ausente, corrompida, store fora
 * do ar, token faltando, `put` recusado: todos devolvem `null` ou não fazem
 * nada, e o chamador cai no caminho antigo — baixar o documento inteiro. O pior
 * caso desta otimização é o custo que já existia, nunca uma página que não abre.
 */

import { get, put } from '@vercel/blob'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { isPdfBuffer } from './pdf-watermark'

/** Prefixo das derivadas no store. Separado dos originais de propósito. */
const PREFIXO = 'material-paginas'

/**
 * Identidade do PDF-fonte de um material.
 *
 * `versao` é o que distingue conteúdos diferentes que compartilham a mesma
 * `blobUrl` — ver a nota sobre reenvio no topo do arquivo.
 */
export interface FonteDoPdf {
  blobUrl: string
  versao: string
  /** Chave estável para os caches em memória do render. */
  chave: string
}

/**
 * Monta a identidade da fonte a partir do `pdfFile` gravado no material.
 * Devolve `null` quando não há PDF vinculado — o chamador trata isso antes.
 */
export function fonteDoPdf(pdfFile: any): FonteDoPdf | null {
  const blobUrl = typeof pdfFile?.blobUrl === 'string' ? pdfFile.blobUrl : ''
  if (!blobUrl) return null

  const tamanho = Number(pdfFile?.sizeBytes) || 0
  // `uploadedAt` chega como Date do Mongo, mas pode vir como string de um
  // documento antigo ou de um dump — `new Date()` cobre os dois, e um valor
  // inválido vira 0 em vez de `NaN` (que envenenaria a chave).
  const enviadoEm = pdfFile?.uploadedAt ? new Date(pdfFile.uploadedAt).getTime() : 0
  const carimbo = Number.isFinite(enviadoEm) ? enviadoEm : 0

  const versao = createHash('sha256')
    .update(`${blobUrl}|${tamanho}|${carimbo}`)
    .digest('hex')
    .slice(0, 16)

  return { blobUrl, versao, chave: `${blobUrl}#${versao}` }
}

/** Interruptor geral. Desligar volta o viewer ao comportamento anterior. */
function habilitado(): boolean {
  const valor = process.env.PDF_VIEWER_PAGE_SLICES_ENABLED
  if (valor == null) return true
  return !['0', 'false', 'no', 'off'].includes(valor.toLowerCase())
}

/**
 * Caminho da derivada dentro do store.
 *
 * O nome é o hash de (versão da fonte + número da página): não vaza o id do
 * material nem a numeração, e as duas prateleiras hexadecimais evitam um
 * diretório único com dezenas de milhares de objetos.
 */
export function caminhoDaDerivada(fonte: FonteDoPdf, pagina: number): string {
  const digest = createHash('sha256').update(`${fonte.versao}#${pagina}`).digest('hex')
  return `${PREFIXO}/${digest.slice(0, 2)}/${digest}.pdf`
}

/**
 * Busca a derivada de uma página. `null` quando ela ainda não existe — que é o
 * caso normal na primeira leitura de cada página, não um erro.
 */
export async function buscarPaginaDerivada(
  fonte: FonteDoPdf,
  pagina: number
): Promise<ArrayBuffer | null> {
  if (!habilitado()) return null

  try {
    // `get` por pathname monta a URL a partir da store do próprio token e já
    // resolve a autenticação do objeto privado — não precisamos adivinhar o
    // endereço nem repassar o `BLOB_READ_WRITE_TOKEN` na mão. Devolve `null`
    // quando o objeto não existe, que é o caminho esperado enquanto a página
    // nunca foi lida por ninguém.
    const resultado = await get(caminhoDaDerivada(fonte, pagina), { access: 'private' })
    if (!resultado || resultado.statusCode !== 200 || !resultado.stream) return null

    const bytes = await new Response(resultado.stream).arrayBuffer()

    // Mesma checagem do download do original: uma leitura interrompida devolve
    // um arquivo que ainda começa com %PDF e ainda abre, só que sem os objetos
    // do fim — onde costumam estar as imagens. Preferimos descartar e
    // reconstruir a página a entregar uma figura faltando, sem nenhum erro.
    //
    // Só a leitura CURTA é recusada. Receber mais bytes do que o declarado não
    // é truncagem, e tratar qualquer divergência como erro desligaria o cache
    // em silêncio caso `size` passe a significar o tamanho armazenado em vez do
    // servido — a página continuaria abrindo, mas ao custo antigo, e nada no
    // log diria por quê.
    const tamanhoEsperado = Number(resultado.blob?.size)
    if (
      Number.isFinite(tamanhoEsperado) &&
      tamanhoEsperado > 0 &&
      bytes.byteLength < tamanhoEsperado
    ) {
      return null
    }

    if (!isPdfBuffer(bytes)) return null
    return bytes
  } catch (erro) {
    // Inclui o caso "objeto não encontrado" nas versões que preferem lançar a
    // devolver null. Seja qual for o motivo, o chamador reconstrói a página.
    console.warn('[pdf-viewer] Falha ao ler pagina derivada:', erro)
    return null
  }
}

/**
 * Grava a derivada de uma página.
 *
 * `allowOverwrite` porque duas requisições da mesma página podem chegar juntas
 * numa instância fria e as duas tentarem gravar: o conteúdo é idêntico, então
 * a última a escrever não causa dano — já uma exceção por caminho existente
 * poluiria o log sem motivo.
 */
export async function gravarPaginaDerivada(
  fonte: FonteDoPdf,
  pagina: number,
  bytes: Uint8Array
): Promise<void> {
  if (!habilitado()) return

  try {
    await put(caminhoDaDerivada(fonte, pagina), Buffer.from(bytes), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/pdf',
      // O caminho é imutável por construção (a versão da fonte está no hash),
      // então a borda pode segurar o objeto pelo prazo máximo.
      cacheControlMaxAge: 31_536_000,
    })
  } catch (erro) {
    // Gravar é otimização, nunca requisito: a página já foi renderizada e vai
    // ser entregue de qualquer jeito. Falhar aqui só significa que a próxima
    // leitura desta página volta a pagar o documento inteiro.
    console.warn('[pdf-viewer] Falha ao gravar pagina derivada:', erro)
  }
}
