import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { validateFileMagicBytes } from '@/lib/api-security'
import { hojeBrasilia } from '@/lib/cronogramas/brasilia'
import { expandirLinhas, MAX_PROPOSTAS, type PropostaAvaliacao } from '@/lib/cronogramas/extracao'
import { lerCalendarios, type ArquivoParaLer } from '@/lib/cronogramas/extrair-imagem'
import { normalizarConfigLembrete } from '@/lib/cronogramas/lembretes'
import { normalizarSecao } from '@/lib/cronogramas/tipos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Ler uma tabela densa passa de um minuto: o tempo de transcrição cresce com o
// número de linhas, não com o tamanho do arquivo. O teto aqui é o mesmo que o
// projeto já usa nas rotas longas; quem se protege de demora é o orçamento
// interno da leitura, que devolve erro explicado em vez de deixar a função
// morrer em 504.
export const maxDuration = 300

/**
 * Leitura do calendário de provas divulgado em imagem.
 *
 * Esta rota NÃO grava nada. Ela devolve propostas — o admin confere e aprova
 * na tela, e a criação continua passando pela rota de sempre, com a mesma
 * validação. Ler e gravar em chamadas separadas é o que torna "apenas
 * aprovar" verdade: nada entra na agenda dos alunos sem alguém ter olhado.
 *
 * O que chega aqui é o print da tabela que a coordenação publicou; o que sai
 * é uma avaliação por período coberto, com data e horário de Brasília.
 */

/**
 * Uma imagem por requisição.
 *
 * O painel manda os arquivos em série, um por chamada, e não é economia de
 * código: é o que dá a CADA imagem os 60s da função inteira. Quando as cinco
 * dividiam uma requisição só, as duas primeiras consumiam o orçamento e as
 * outras voltavam sem leitura nenhuma. O teto de dois é folga para quem chamar
 * a rota na mão, não o caminho normal.
 */
const MAX_ARQUIVOS = 2

/**
 * O corpo inteiro de uma função na Vercel não passa de ~4,5MB, e o multipart
 * ainda infla o que vai dentro. O painel já reduz a imagem antes de enviar;
 * este teto é a rede de segurança de quem não passou por ele.
 */
const MAX_BYTES = 4 * 1024 * 1024

const MIMES_ACEITOS = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let formulario: FormData
  try {
    formulario = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Envie as imagens como multipart/form-data.' }, { status: 400 })
  }

  const enviados = formulario.getAll('arquivos').filter((item): item is File => item instanceof File)
  if (enviados.length === 0) {
    return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 })
  }
  if (enviados.length > MAX_ARQUIVOS) {
    return NextResponse.json(
      { error: `Envie no máximo ${MAX_ARQUIVOS} arquivos por chamada.` },
      { status: 400 },
    )
  }

  const secaoPadrao = normalizarSecao(formulario.get('secao')) ?? 'medicina'
  const anoBruto = Math.round(Number(formulario.get('ano')))
  const anoReferencia = Number.isFinite(anoBruto) && anoBruto >= 2000 && anoBruto <= 2100 ? anoBruto : null
  const lembrete = normalizarConfigLembrete(lerJson(formulario.get('lembrete')))
  const publicada = formulario.get('publicada') !== 'false'

  const arquivos: ArquivoParaLer[] = []
  for (const arquivo of enviados) {
    if (arquivo.size === 0) continue
    if (arquivo.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `"${arquivo.name}" tem ${(arquivo.size / 1024 / 1024).toFixed(1)}MB e o limite é ${MAX_BYTES / 1024 / 1024}MB. Reduza a imagem ou recorte só a tabela.`,
        },
        { status: 400 },
      )
    }
    if (!MIMES_ACEITOS.includes(arquivo.type)) {
      return NextResponse.json(
        { error: `"${arquivo.name}" não é PNG, JPG, WEBP ou PDF.` },
        { status: 400 },
      )
    }

    // O tipo declarado no upload é palpite do navegador; o conteúdo é a
    // verdade. Um arquivo que mente sobre o que é não deveria virar prompt.
    const bytes = await arquivo.arrayBuffer()
    const assinatura = await validateFileMagicBytes(bytes)
    if (!assinatura.valid || !MIMES_ACEITOS.includes(assinatura.detectedType ?? '')) {
      return NextResponse.json(
        { error: `"${arquivo.name}" não parece ser uma imagem ou PDF de verdade.` },
        { status: 400 },
      )
    }

    arquivos.push({
      nome: arquivo.name,
      mime: assinatura.detectedType!,
      base64: Buffer.from(bytes).toString('base64'),
    })
  }

  if (arquivos.length === 0) {
    return NextResponse.json({ error: 'Nenhuma imagem legível no envio.' }, { status: 400 })
  }

  const hoje = hojeBrasilia()

  let leituras
  try {
    leituras = await lerCalendarios(arquivos)
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Não foi possível ler as imagens.'
    return NextResponse.json({ error: mensagem }, { status: 502 })
  }

  const propostas: PropostaAvaliacao[] = []
  const porArquivo = leituras.map(leitura => {
    const doArquivo = leitura.erro
      ? []
      : expandirLinhas(leitura.linhas, {
          origem: leitura.nome,
          secaoPadrao,
          hoje,
          anoReferencia,
          lembrete,
          publicada,
        })

    // O teto vale para o lote inteiro, não por arquivo: é ele que garante que
    // uma leitura desgovernada não vire uma lista impossível de revisar.
    for (const proposta of doArquivo) {
      if (propostas.length < MAX_PROPOSTAS) propostas.push(proposta)
    }

    return {
      nome: leitura.nome,
      linhas: leitura.linhas.length,
      propostas: doArquivo.length,
      erro: leitura.erro,
    }
  })

  return NextResponse.json({ propostas, arquivos: porArquivo, hoje, ano: anoReferencia })
}

function lerJson(valor: FormDataEntryValue | null): unknown {
  if (typeof valor !== 'string' || !valor) return null
  try {
    return JSON.parse(valor)
  } catch {
    return null
  }
}
