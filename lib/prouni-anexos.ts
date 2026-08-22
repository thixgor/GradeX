import { del, head } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import {
  ProuniError,
  PROUNI_ALLOWED_CONTENT_TYPES,
  PROUNI_MAX_ATTACHMENTS,
  PROUNI_MAX_ATTACHMENT_BYTES,
  PROUNI_MAX_TOTAL_BYTES,
  type ProuniAttachment,
} from '@/lib/prouni-fies'

/**
 * Conferência dos comprovantes DEPOIS do upload.
 *
 * O token emitido em `/api/prouni/upload` já limita tipo, tamanho e pasta. Este
 * módulo existe porque nada disso prova o que o arquivo É: o navegador escolhe
 * o `Content-Type` que declara ao Blob, e "meu-comprovante.pdf" pode ser um
 * executável, um HTML com script ou um zip-bomba renomeado.
 *
 * Então a solicitação só é aceita depois de três perguntas respondidas pelo
 * SERVIDOR, nunca pelo cliente:
 *
 * 1. **De quem é o arquivo?** O caminho no Blob precisa estar dentro da pasta
 *    de quem está enviando. Sem isso, bastaria colar a URL do comprovante de
 *    outra pessoa no corpo da requisição para anexá-lo à própria solicitação.
 * 2. **Que tamanho tem?** O tamanho vem do `head()` do Blob — o número que o
 *    cliente manda é ignorado. Há teto por arquivo e teto somado, para três
 *    anexos no limite não virarem uma solicitação de 24 MB.
 * 3. **O que tem dentro?** Os 16 primeiros bytes precisam bater com a
 *    assinatura do tipo declarado. É o que separa um PDF de um HTML com
 *    `.pdf` no nome — que, servido de volta ao admin, seria script rodando na
 *    origem do painel.
 *
 * Nada é decodificado, redimensionado ou renderizado no servidor: um PDF
 * malformado aqui é só um arquivo que não passa na assinatura, e não uma
 * biblioteca de imagem gastando CPU com o que um atacante escolheu.
 */

/**
 * Raiz dos comprovantes no Blob. Cada conta escreve só dentro da própria
 * pasta — é o que torna verificável a pergunta "este arquivo é mesmo seu?".
 */
export const PROUNI_BLOB_ROOT = 'prouni-comprovantes/'

export function prouniBlobPrefix(userId: string) {
  return `${PROUNI_BLOB_ROOT}${userId}/`
}

/** O que o cliente afirma ter enviado. Tudo aqui é suspeito até a conferência. */
export interface AnexoBruto {
  url: string
  pathname: string
  filename?: string
}

const ASSINATURAS: Record<string, (bytes: Uint8Array) => boolean> = {
  'application/pdf': (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  // RIFF....WEBP — só "RIFF" deixaria passar um .wav renomeado.
  'image/webp': (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN
}

/**
 * Lê só o começo do arquivo, com `Range`.
 *
 * Baixar o comprovante inteiro para olhar 16 bytes seria pagar 8 MB de tráfego
 * por anexo, três por solicitação — e daria a qualquer conta autenticada um
 * jeito barato de fazer o servidor puxar megabytes sob demanda.
 */
async function lerPrimeirosBytes(url: string): Promise<Uint8Array> {
  const token = blobToken()
  const resposta = await fetch(url, {
    headers: {
      Range: 'bytes=0-15',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })
  if (!resposta.ok && resposta.status !== 206) {
    throw new ProuniError('Não foi possível ler o arquivo enviado. Envie novamente.', 400)
  }
  const buffer = await resposta.arrayBuffer()
  return new Uint8Array(buffer.slice(0, 16))
}

function nomeSeguro(nome: string | undefined, contentType: string) {
  const extensaoPorTipo: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }
  const extensao = extensaoPorTipo[contentType] || ''
  const base = String(nome || 'comprovante')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60)
  return `${base || 'comprovante'}${extensao}`
}

/**
 * Valida os anexos declarados e devolve os metadados que ficam gravados.
 *
 * Lança `ProuniError` na primeira reprovação — a solicitação não é criada pela
 * metade, com um anexo bom e outro suspeito.
 */
export async function verificarAnexos(
  brutos: AnexoBruto[],
  input: { userId: string; prefixoPermitido: string }
): Promise<ProuniAttachment[]> {
  if (!Array.isArray(brutos) || brutos.length === 0) {
    throw new ProuniError('Envie pelo menos um comprovante.', 400)
  }
  if (brutos.length > PROUNI_MAX_ATTACHMENTS) {
    throw new ProuniError(`Envie no máximo ${PROUNI_MAX_ATTACHMENTS} arquivos.`, 400)
  }

  const vistos = new Set<string>()
  const validados: ProuniAttachment[] = []
  let total = 0

  for (const bruto of brutos) {
    const pathname = String(bruto?.pathname || '')
    const url = String(bruto?.url || '')
    if (!pathname || !url) {
      throw new ProuniError('Arquivo inválido.', 400)
    }
    if (!pathname.startsWith(input.prefixoPermitido)) {
      throw new ProuniError('Arquivo inválido.', 400)
    }
    if (vistos.has(pathname)) {
      throw new ProuniError('Você enviou o mesmo arquivo duas vezes.', 400)
    }
    vistos.add(pathname)

    let metadados
    try {
      metadados = await head(url, blobToken() ? { token: blobToken() } : undefined)
    } catch {
      throw new ProuniError('Não encontramos um dos arquivos enviados. Tente enviar de novo.', 400)
    }

    // A URL é do cliente: sem esta conferência, apontar `url` para o blob de
    // outra pessoa e `pathname` para um arquivo próprio passaria batido.
    if (metadados.pathname !== pathname) {
      throw new ProuniError('Arquivo inválido.', 400)
    }

    const contentType = String(metadados.contentType || '').split(';')[0].trim().toLowerCase()
    if (!(PROUNI_ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
      throw new ProuniError('Formato não aceito. Envie PDF, JPG, PNG ou WEBP.', 400)
    }

    const tamanho = Number(metadados.size || 0)
    if (tamanho <= 0) {
      throw new ProuniError('Arquivo vazio.', 400)
    }
    if (tamanho > PROUNI_MAX_ATTACHMENT_BYTES) {
      throw new ProuniError(
        `Cada arquivo deve ter no máximo ${Math.round(PROUNI_MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB.`,
        413
      )
    }
    total += tamanho
    if (total > PROUNI_MAX_TOTAL_BYTES) {
      throw new ProuniError(
        `A soma dos arquivos deve ter no máximo ${Math.round(PROUNI_MAX_TOTAL_BYTES / 1024 / 1024)} MB.`,
        413
      )
    }

    const cabecalho = await lerPrimeirosBytes(url)
    const confere = ASSINATURAS[contentType]
    if (!confere || !confere(cabecalho)) {
      throw new ProuniError(
        'O conteúdo do arquivo não corresponde ao formato declarado. Envie o comprovante original em PDF ou foto.',
        400
      )
    }

    validados.push({
      id: randomUUID(),
      blobUrl: url,
      blobPathname: pathname,
      filename: nomeSeguro(bruto.filename, contentType),
      contentType,
      sizeBytes: tamanho,
      uploadedAt: new Date(),
    })
  }

  return validados
}

/**
 * Apaga arquivos do Blob. Usado em dois momentos: quando a solicitação é
 * recusada pela validação (os arquivos já subiram e ficariam órfãos, ocupando
 * espaço para sempre) e quando o admin limpa os anexos depois da análise.
 *
 * Nunca lança: a limpeza é higiene, não pode derrubar a operação que a chamou.
 */
export async function apagarAnexos(urls: string[]) {
  const alvos = urls.filter(Boolean)
  if (alvos.length === 0) return { apagados: 0 }
  let apagados = 0
  await Promise.all(
    alvos.map(async (url) => {
      try {
        await del(url, blobToken() ? { token: blobToken() } : undefined)
        apagados += 1
      } catch (error) {
        console.warn('[prouni/anexos] falha ao apagar blob:', error)
      }
    })
  )
  return { apagados }
}
