import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isPaidAccount } from '@/lib/account-tier'
import {
  ETAPAS_SOCRATICAS,
  HUMORES,
  LIMITES_DO_DOM,
  MAX_CARACTERES_HISTORICO,
  MAX_HISTORICO,
  type EtapaSocratica,
  type FonteDoDom,
  type HumorDoDom,
  type ModoDoDom,
  type RespostaDoDom,
} from '@/lib/dom/config'
import { verificarAcessoAoDom } from '@/lib/dom/acesso'
import { cortarResposta, detectarAtaque, limparMensagem, respostaParaAtaque, saidaVazou } from '@/lib/dom/guarda'
import { consumirMensagem, devolverMensagem, garantirIndicesDoDom, registrarIncidente, registrarUso, reservarBusca } from '@/lib/dom/limites'
import { candidatosDeDestino, hrefInternoSeguro } from '@/lib/dom/destinos'
import { assinarFala, falaAutentica, fichaDoMaterial, pedeConteudoDeSaude, xpDoAluno } from '@/lib/dom/contexto'
import { montarPromptDoSistema } from '@/lib/dom/prompt'
import { DomIndisponivel, perguntarAoModelo, type TurnoDoModelo } from '@/lib/dom/modelo'
import { fontesDaBusca, fontesDasReferencias } from '@/lib/dom/fontes'
import { cursoValido } from '@/lib/dom/temas'
import { temaPorId } from '@/lib/dom/temas-servidor'
import { falaDePreco, materiaisComoDestinos, materiaisDaMensagem, precosAtuais } from '@/lib/dom/catalogo'
import { conteudoDaBusca, pedeRecomendacao, sugestoesDeCompra } from '@/lib/dom/descobertas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * `POST /api/dom` — uma mensagem para o Dom.
 *
 * Ordem pensada para gastar o mínimo antes de saber se vale gastar:
 * sessão → tamanho do corpo → acesso → cota → guarda (ataque não chega à IA)
 * → contexto em paralelo → IA → validação de cada campo da saída.
 *
 * Corpo: `{ modo, mensagem, historico: [{ papel, texto, assinatura? }],
 * contexto: { rota?, materialId?, pagina?, tema?: { curso, periodo, id } | { livre } } }`.
 */

const TETO_DO_CORPO = 14_000

function ipDe(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''
}

function erro(status: number, corpo: Record<string, unknown>, headers?: HeadersInit) {
  return NextResponse.json(corpo, { status, headers: { 'Cache-Control': 'private, no-store', ...headers } })
}

function sugestoesLimpas(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((s): s is string => typeof s === 'string')
    .map((s) => limparMensagem(s, 48).replace(/[*_#`>[\]]/g, ''))
    .filter((s) => s.length >= 2)
    .slice(0, 3)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) return erro(401, { error: 'Entre na sua conta para falar com o Dom.' })

  const bruto = await request.text().catch(() => '')
  if (!bruto || bruto.length > TETO_DO_CORPO) return erro(413, { error: 'Mensagem grande demais.' })
  let corpo: any
  try {
    corpo = JSON.parse(bruto)
  } catch {
    return erro(400, { error: 'Pedido inválido.' })
  }

  const modo: ModoDoDom = corpo?.modo === 'socratico' || corpo?.modo === 'material' ? corpo.modo : 'geral'
  const mensagem = limparMensagem(corpo?.mensagem)
  if (!mensagem) return erro(400, { error: 'Escreva alguma coisa para o Dom.' })
  const ctx = corpo?.contexto && typeof corpo.contexto === 'object' ? corpo.contexto : {}
  const rota = hrefInternoSeguro(ctx.rota)?.split('?')[0] || undefined

  const db = await getDb()
  void garantirIndicesDoDom(db)

  const acesso = await verificarAcessoAoDom(db, session.userId, session.email)
  const usuario = acesso.usuario
  if (!acesso.liberado || !usuario) {
    return erro(403, {
      error:
        acesso.motivo === 'suspenso'
          ? 'O Dom está pausado na sua conta por uso fora das regras. Se achar que foi engano, fale com o suporte.'
          : 'O Dom é exclusivo para assinantes Plus+ e Quest+ ou para quem comprou um material nos últimos 3 dias.',
      motivo: acesso.motivo,
    })
  }

  const cota = await consumirMensagem(db, usuario.id)
  if (!cota.ok) {
    return erro(
      429,
      {
        error:
          cota.motivo === 'minuto'
            ? 'Calma, calma! Deixa eu respirar um segundinho e já te respondo.'
            : `Ufa, conversamos muito hoje! Seu limite de ${LIMITES_DO_DOM.porDia} mensagens volta amanhã.`,
        motivo: cota.motivo,
        retryAfterSeconds: cota.retryAfterSeconds,
      },
      { 'Retry-After': String(cota.retryAfterSeconds) },
    )
  }

  // Histórico: só papéis conhecidos, falas do Dom com assinatura válida, teto
  // de tamanho, e a guarda passa em TODAS as falas do aluno (as antigas também
  // vieram do navegador).
  const historicoBruto: any[] = Array.isArray(corpo?.historico) ? corpo.historico.slice(-MAX_HISTORICO) : []
  const turnos: TurnoDoModelo[] = []
  for (const h of historicoBruto) {
    const texto = limparMensagem(h?.texto, MAX_CARACTERES_HISTORICO)
    if (!texto) continue
    if (h?.papel === 'dom') {
      if (falaAutentica(usuario.id, String(h.texto || ''), h.assinatura)) turnos.push({ papel: 'dom', texto })
    } else if (h?.papel === 'aluno') {
      turnos.push({ papel: 'aluno', texto })
    }
  }

  const ataque = [mensagem, ...turnos.filter((t) => t.papel === 'aluno').map((t) => t.texto)].map(detectarAtaque).find(Boolean) || null
  if (ataque) {
    const suspendeu = await registrarIncidente(db, {
      userId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: ataque.tipo,
      gravidade: ataque.gravidade,
      trecho: ataque.trecho,
      mensagem,
      modo,
      rota,
      ip: ipDe(request),
    })
    registrarUso(db, usuario.id, { motor: 'local' })
    const texto = suspendeu
      ? `Vou dar uma pausa nas nossas conversas por hoje, ${usuario.primeiroNome || 'tá'}. Amanhã a gente volta a estudar juntinhos!`
      : respostaParaAtaque(ataque, usuario.primeiroNome)
    const resposta: RespostaDoDom = {
      texto,
      humor: 'preocupado',
      fontes: [],
      sugestoes: suspendeu ? [] : ['Me explica um conceito', 'Quero estudar', 'Como uso o site?'],
      restantes: cota.restantes,
      motor: 'local',
    }
    return NextResponse.json({ ...resposta, assinatura: assinarFala(usuario.id, texto) }, { headers: { 'Cache-Control': 'private, no-store' } })
  }

  // Contexto em paralelo (CLAUDE.md: consultas independentes num Promise.all).
  const materialId = modo === 'material' && typeof ctx.materialId === 'string' ? ctx.materialId : ''
  const pagina = Number.isInteger(ctx.pagina) && ctx.pagina > 0 && ctx.pagina < 5000 ? ctx.pagina : null
  const pagante = isPaidAccount(usuario.accountType, usuario.isAdmin)
  const querBusca = modo === 'geral' && pedeConteudoDeSaude(mensagem)
  const querPrecos = modo !== 'socratico' && falaDePreco(mensagem)
  const geral = modo === 'geral'
  const [xp, material, buscar, materiais, precos, achados] = await Promise.all([
    xpDoAluno(db, usuario.id),
    materialId ? fichaDoMaterial(db, materialId, pagina, usuario.isAdmin).catch(() => null) : Promise.resolve(null),
    querBusca ? reservarBusca(db, usuario.id) : Promise.resolve(false),
    modo === 'geral' ? materiaisDaMensagem(db, mensagem, usuario.isAdmin) : Promise.resolve([]),
    querPrecos ? precosAtuais(db) : Promise.resolve([]),
    geral ? conteudoDaBusca(db, mensagem, { userId: usuario.id, isAdmin: usuario.isAdmin }) : Promise.resolve([]),
  ])
  // "Quem estuda isto também leva": depende do material achado acima (ou da
  // última compra, quando o aluno pede indicação). O modelo do motor fica em
  // memória por 30 min; aqui custa uma consulta das compras da pessoa.
  // No leitor, só quando o aluno pede (cada pergunta sobre a página não precisa disso).
  const pediu = pedeRecomendacao(mensagem)
  const sementes = materialId ? (pediu ? [materialId] : []) : materiais.map((m) => m.id)
  const sugestoes = geral || pediu
    ? await sugestoesDeCompra(db, usuario.id, { sementes: sementes.slice(0, 2), pediu })
    : []

  let tema = null as Parameters<typeof montarPromptDoSistema>[0]['tema']
  if (modo === 'socratico' && ctx.tema && typeof ctx.tema === 'object') {
    const t = ctx.tema
    const periodo = Number(t.periodo) || null
    if (typeof t.livre === 'string' && limparMensagem(t.livre, 120)) {
      tema = { id: 'livre', titulo: limparMensagem(t.livre, 120), trilha: '', itens: [], curso: 'livre', periodo: null, livre: true }
      const ataqueNoTema = detectarAtaque(tema.titulo)
      if (ataqueNoTema) tema = { ...tema, titulo: 'tema inválido (peça outro ao aluno)' }
    } else if (cursoValido(t.curso) && periodo && typeof t.id === 'string') {
      const achado = await temaPorId(t.curso, periodo, t.id).catch(() => null)
      if (achado) tema = { ...achado, curso: t.curso, periodo }
    }
  }

  const destinos =
    modo === 'socratico'
      ? []
      : [
          ...candidatosDeDestino(mensagem, { accountType: usuario.accountType, isAdmin: usuario.isAdmin }),
          ...materiaisComoDestinos(materiais),
          ...achados,
          ...sugestoes.map((s) => s.destino),
        ]
  const canario = `DOM-${randomBytes(6).toString('hex')}`
  const sistema = montarPromptDoSistema({
    modo,
    aluno: {
      primeiroNome: usuario.primeiroNome,
      periodo: usuario.periodo,
      profissao: usuario.profissao,
      faculdade: usuario.faculdade,
      plano: usuario.plano,
      pagante,
      assinaturaAte: usuario.assinaturaAte,
      acessoPorCompraAte: acesso.acessoPorCompraAte,
      xp,
    },
    rota,
    agora: new Date(),
    canario,
    destinos,
    material,
    tema,
    materiais,
    precos,
    achados,
    sugestoes,
  })

  let resultado
  try {
    resultado = await perguntarAoModelo(db, {
      sistema,
      turnos: [...turnos, { papel: 'aluno', texto: mensagem }],
      buscar,
      profundo: modo === 'socratico',
    })
  } catch (e) {
    await devolverMensagem(db, usuario.id)
    const cheio = e instanceof DomIndisponivel
    return erro(503, {
      error: cheio
        ? 'Meu celular ficou sem sinal agora… Tenta de novo em alguns minutinhos? Essa mensagem não contou no seu limite.'
        : 'Algo deu errado aqui. Tenta de novo?',
      motivo: 'indisponivel',
    })
  }

  const j = resultado.json
  let texto = cortarResposta(String(j.texto || ''))
  if (!texto) {
    await devolverMensagem(db, usuario.id)
    return erro(503, { error: 'Fiquei sem palavras… Pode perguntar de novo?', motivo: 'vazio' })
  }

  if (saidaVazou(texto, canario)) {
    void registrarIncidente(db, {
      userId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: 'vazamento-de-prompt',
      gravidade: 2,
      trecho: 'resposta continha trechos do prompt',
      mensagem,
      modo,
      rota,
      ip: ipDe(request),
    })
    texto = respostaParaAtaque({ tipo: 'extracao-de-prompt', gravidade: 2, trecho: '' }, usuario.primeiroNome)
  }

  const humor: HumorDoDom = HUMORES.includes(j.humor as HumorDoDom) ? (j.humor as HumorDoDom) : 'feliz'
  const escolhido = typeof j.destino === 'string' ? destinos.find((d) => d.id === j.destino) : undefined
  const fontes: FonteDoDom[] = [...fontesDaBusca(resultado.dados), ...fontesDasReferencias(j.referencias)].slice(0, 4)
  const etapa = ETAPAS_SOCRATICAS.includes(j.etapa as EtapaSocratica) ? (j.etapa as EtapaSocratica) : null
  const progresso = Math.max(0, Math.min(100, Math.round(Number(j.progresso) || 0)))

  registrarUso(db, usuario.id, { motor: resultado.motor, entrada: resultado.entrada, saida: resultado.saida })

  const resposta: RespostaDoDom = {
    texto,
    humor,
    destino: escolhido ? { href: escolhido.href, titulo: escolhido.titulo, exclusivo: escolhido.exclusivo } : null,
    fontes,
    sugestoes: sugestoesLimpas(j.sugestoes),
    socratico: modo === 'socratico' && etapa ? { etapa, progresso } : null,
    restantes: cota.restantes,
    motor: resultado.motor,
  }
  return NextResponse.json({ ...resposta, assinatura: assinarFala(usuario.id, texto) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
