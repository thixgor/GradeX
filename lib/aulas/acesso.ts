/**
 * Quem pode ver uma aula — a autoridade única.
 *
 * O problema que este módulo existe para resolver: até aqui a regra de acesso
 * das aulas morava no NAVEGADOR. `app/aulas/[id]/page.tsx` comparava
 * `visibilidade` com o cargo do usuário e escondia o player; só que
 * `GET /api/aulas/[id]` devolvia o documento inteiro — `videoEmbed` incluído —
 * sem sessão e sem checagem nenhuma. O cadeado estava desenhado na tela, não na
 * porta: bastava abrir a rota da API para ler o embed de qualquer aula paga.
 *
 * Aqui a decisão passa a ser tomada num lugar só, no servidor, e o mesmo
 * veredito serve para três coisas que antes divergiam:
 *
 *  1. decidir se o conteúdo sai do banco (o que fecha o vazamento);
 *  2. desenhar o cadeado na tela com o motivo certo (§17 — nunca "erro
 *     genérico", sempre "faz parte do Curso X" com o botão adequado);
 *  3. montar a vitrine sem mentir sobre o que a pessoa já tem.
 *
 * O módulo é puro: sem `window`, sem banco. Recebe a aula e um retrato do
 * usuário, devolve o veredito. É o que permite testá-lo com os casos reais
 * (visitante, aluno grátis, Plus+, comprador do material, turma) sem subir
 * nada.
 */

import type { AulaPostagem } from '@/lib/types'

/* =================== REGRAS =================== */

/**
 * Uma condição de liberação. A aula guarda uma LISTA delas e basta UMA ser
 * satisfeita — é o "OU" que o admin espera ao escrever "Plus+ **ou** quem
 * comprou o Combo SOI III".
 *
 * O "E" (restringir a um grupo mesmo para assinantes) é expresso por
 * `exigirTambem`, avaliado depois: quem passa nas condições ainda precisa
 * estar no grupo. Sem essa separação, uma lista achatada de condições não
 * consegue dizer a diferença entre "ou" e "e".
 */
export type CondicaoAcesso =
  | { tipo: 'publico' }
  | { tipo: 'cadastrado' }
  | { tipo: 'plus' }
  | { tipo: 'manual-clinico' }
  | { tipo: 'material'; itemId: string; titulo?: string }
  | { tipo: 'pacote'; itemId: string; titulo?: string }
  | { tipo: 'grupo'; grupoId: string; titulo?: string }

export interface RegrasDeAcessoAula {
  /** Basta uma condição desta lista ser verdadeira. */
  liberarPara: CondicaoAcesso[]
  /**
   * Filtro adicional obrigatório (o "E"). Ex.: só a Turma A, mesmo que a
   * pessoa seja Plus+.
   */
  exigirTambem?: Array<Extract<CondicaoAcesso, { tipo: 'grupo' }>>
  /**
   * Aula demonstrativa de um curso pago (§14): assistível por quem ainda não
   * cumpre nenhuma condição, e é o que sustenta "Aula 1 e 2 grátis, 3 a 30
   * bloqueadas" sem duplicar a aula.
   */
  amostra?: boolean
}

export type MotivoBloqueio =
  | 'rascunho'
  | 'agendada'
  | 'encerrada'
  | 'precisa-login'
  | 'precisa-plus'
  | 'precisa-manual-clinico'
  | 'precisa-compra'
  | 'precisa-grupo'

/** O que a tela precisa oferecer para a pessoa destravar o conteúdo. */
export interface RequisitoDeAcesso {
  motivo: MotivoBloqueio
  /** Texto curto para o cadeado. Ex.: "Disponível para assinantes Plus+". */
  titulo: string
  /** Rótulo do botão. Ex.: "Conhecer o Plus+". */
  acaoLabel?: string
  acaoHref?: string
  /** Quando o bloqueio é por data, quando ela abre. */
  liberaEm?: Date
}

export interface ContextoDoUsuario {
  logado: boolean
  isAdmin?: boolean
  isMonitor?: boolean
  ehPlus?: boolean
  temManualClinico?: boolean
  /** IDs de materiais já comprados (ou liberados por assinatura). */
  materiais?: string[]
  pacotes?: string[]
  grupos?: string[]
}

export interface VereditoDeAcesso {
  /** Pode consumir o conteúdo (o vídeo pode sair do banco). */
  liberado: boolean
  /** Está liberado por ser amostra, não por cumprir a regra paga. */
  porAmostra: boolean
  /** Existe na tela, mas cadeado. `null` quando liberado. */
  requisito: RequisitoDeAcesso | null
  /**
   * Some da listagem por completo. Diferente de bloqueado: aula agendada com
   * `ocultarAteLiberacao` não deve nem aparecer como "disponível em breve".
   */
  invisivel: boolean
}

/* =================== COMPATIBILIDADE =================== */

/**
 * Traduz o modelo antigo (`visibilidade: 'gratuita' | 'plus' | 'premium'`) para
 * as regras novas.
 *
 * É isto que permite reformular sem migração destrutiva (§45): aula antiga
 * continua respondendo exatamente como respondia, e passa a ter regras
 * explícitas só quando o admin editar. `'premium'` e `'essential'` são rótulos
 * legados que sempre significaram "assinante".
 */
export function regrasDaAula(aula: Pick<AulaPostagem, 'visibilidade'> & {
  regrasAcesso?: RegrasDeAcessoAula | null
}): RegrasDeAcessoAula {
  if (aula.regrasAcesso?.liberarPara?.length) return aula.regrasAcesso

  const visibilidade = String(aula.visibilidade || '').toLowerCase()
  const ehPaga = visibilidade === 'plus' || visibilidade === 'premium' || visibilidade === 'essential'
  return {
    liberarPara: ehPaga ? [{ tipo: 'plus' }] : [{ tipo: 'cadastrado' }],
    amostra: aula.regrasAcesso?.amostra === true,
  }
}

/* =================== AVALIAÇÃO =================== */

function cumpre(condicao: CondicaoAcesso, usuario: ContextoDoUsuario): boolean {
  switch (condicao.tipo) {
    case 'publico':
      return true
    case 'cadastrado':
      return usuario.logado === true
    case 'plus':
      return usuario.ehPlus === true
    case 'manual-clinico':
      return usuario.temManualClinico === true
    case 'material':
      return (usuario.materiais || []).includes(condicao.itemId)
    case 'pacote':
      return (usuario.pacotes || []).includes(condicao.itemId)
    case 'grupo':
      return (usuario.grupos || []).includes(condicao.grupoId)
    default:
      return false
  }
}

/**
 * Qual cadeado desenhar quando nenhuma condição foi cumprida.
 *
 * A ordem importa: mostramos o caminho mais provável de a pessoa destravar. Um
 * visitante deslogado precisa ouvir "entre na sua conta" antes de "assine" —
 * mandar assinar quem já tem assinatura e só não fez login é o jeito mais
 * rápido de perder um aluno que já pagou.
 */
function requisitoPara(
  regras: RegrasDeAcessoAula,
  usuario: ContextoDoUsuario,
): RequisitoDeAcesso {
  const tipos = new Set(regras.liberarPara.map((c) => c.tipo))

  if (!usuario.logado && (tipos.has('cadastrado') || tipos.size > 0)) {
    return {
      motivo: 'precisa-login',
      titulo: 'Entre na sua conta para assistir',
      acaoLabel: 'Entrar',
      acaoHref: '/auth/login',
    }
  }

  const material = regras.liberarPara.find((c) => c.tipo === 'material' || c.tipo === 'pacote') as
    | Extract<CondicaoAcesso, { tipo: 'material' | 'pacote' }>
    | undefined
  if (material) {
    return {
      motivo: 'precisa-compra',
      titulo: material.titulo
        ? `Esta aula faz parte de ${material.titulo}`
        : 'Esta aula faz parte de um material',
      acaoLabel: 'Adquirir acesso',
      acaoHref: material.tipo === 'pacote' ? `/pacotes/${material.itemId}` : `/materiais/${material.itemId}`,
    }
  }

  if (tipos.has('plus')) {
    return {
      motivo: 'precisa-plus',
      titulo: 'Disponível para assinantes Plus+',
      acaoLabel: 'Conhecer o Plus+',
      acaoHref: '/buy',
    }
  }

  if (tipos.has('manual-clinico')) {
    return {
      motivo: 'precisa-manual-clinico',
      titulo: 'Disponível para quem tem o Manual Clínico',
      acaoLabel: 'Conhecer o Manual',
      acaoHref: '/manual-clinico',
    }
  }

  const grupo = regras.liberarPara.find((c) => c.tipo === 'grupo') as
    | Extract<CondicaoAcesso, { tipo: 'grupo' }>
    | undefined
  return {
    motivo: 'precisa-grupo',
    titulo: grupo?.titulo ? `Exclusiva para ${grupo.titulo}` : 'Conteúdo exclusivo de turma',
  }
}

/** A aula já abriu / ainda não fechou? */
function janelaDePublicacao(
  aula: Pick<AulaPostagem, 'dataLiberacao' | 'ocultarAteLiberacao' | 'oculta'> & {
    ocultarEm?: Date | string | null
  },
  agora: Date,
): { estado: 'no-ar' | 'rascunho' | 'agendada' | 'encerrada'; liberaEm?: Date } {
  if (aula.oculta) return { estado: 'rascunho' }

  const libera = aula.dataLiberacao ? new Date(aula.dataLiberacao) : null
  if (libera && !Number.isNaN(libera.getTime()) && libera > agora) {
    return { estado: 'agendada', liberaEm: libera }
  }

  const encerra = aula.ocultarEm ? new Date(aula.ocultarEm) : null
  if (encerra && !Number.isNaN(encerra.getTime()) && encerra <= agora) {
    return { estado: 'encerrada' }
  }

  return { estado: 'no-ar' }
}

/**
 * O veredito completo de uma aula para um usuário.
 *
 * Chamar isto no servidor ANTES de montar a resposta é o que fecha o vazamento:
 * o `videoEmbed` só entra no payload quando `liberado` é verdadeiro.
 */
export function avaliarAcessoAula(
  aula: Pick<AulaPostagem, 'visibilidade' | 'dataLiberacao' | 'ocultarAteLiberacao' | 'oculta'> & {
    regrasAcesso?: RegrasDeAcessoAula | null
    ocultarEm?: Date | string | null
  },
  usuario: ContextoDoUsuario,
  agora = new Date(),
): VereditoDeAcesso {
  // Admin e monitor enxergam tudo — é a base do "Visualizar como aluno" (§28),
  // que funciona justamente passando um contexto de usuário fabricado no lugar
  // do real.
  if (usuario.isAdmin || usuario.isMonitor) {
    return { liberado: true, porAmostra: false, requisito: null, invisivel: false }
  }

  const janela = janelaDePublicacao(aula, agora)

  if (janela.estado === 'rascunho') {
    return {
      liberado: false,
      porAmostra: false,
      requisito: { motivo: 'rascunho', titulo: 'Aula não publicada' },
      invisivel: true,
    }
  }

  if (janela.estado === 'agendada') {
    return {
      liberado: false,
      porAmostra: false,
      requisito: {
        motivo: 'agendada',
        titulo: 'Ainda não liberada',
        liberaEm: janela.liberaEm,
      },
      // O admin escolhe entre criar expectativa ("Disponível em 18 de agosto")
      // e esconder por completo. As duas leituras são legítimas e a flag já
      // existia no modelo antigo.
      invisivel: aula.ocultarAteLiberacao === true,
    }
  }

  if (janela.estado === 'encerrada') {
    return {
      liberado: false,
      porAmostra: false,
      requisito: { motivo: 'encerrada', titulo: 'Esta aula não está mais disponível' },
      invisivel: true,
    }
  }

  const regras = regrasDaAula(aula)

  // O "E": grupo obrigatório derruba mesmo quem cumpriria as condições.
  const filtros = regras.exigirTambem || []
  if (filtros.length > 0 && !filtros.every((f) => cumpre(f, usuario))) {
    const alvo = filtros.find((f) => !cumpre(f, usuario))
    return {
      liberado: false,
      porAmostra: false,
      requisito: {
        motivo: 'precisa-grupo',
        titulo: alvo?.titulo ? `Exclusiva para ${alvo.titulo}` : 'Conteúdo exclusivo de turma',
      },
      invisivel: false,
    }
  }

  if (regras.liberarPara.some((condicao) => cumpre(condicao, usuario))) {
    return { liberado: true, porAmostra: false, requisito: null, invisivel: false }
  }

  // Amostra: assiste sem cumprir a regra paga, mas a tela ainda sabe que é
  // demonstração — é o gancho do CTA (§13) sem transformar a aula em gratuita.
  if (regras.amostra) {
    return { liberado: true, porAmostra: true, requisito: null, invisivel: false }
  }

  return {
    liberado: false,
    porAmostra: false,
    requisito: requisitoPara(regras, usuario),
    invisivel: false,
  }
}

/**
 * Remove do documento tudo que só quem tem acesso pode ver.
 *
 * A listagem precisa mostrar título, capa e cadeado de aula bloqueada — mas
 * nunca o endereço do vídeo. Passar todo documento por aqui antes de responder
 * é mais seguro do que lembrar, rota a rota, de apagar cada campo.
 */
export function ocultarConteudoRestrito<T extends Record<string, any>>(
  aula: T,
  veredito: VereditoDeAcesso,
): T {
  if (veredito.liberado) return aula
  const copia: Record<string, any> = { ...aula }
  delete copia.videoEmbed
  delete copia.linkOuEmbed
  delete copia.botoesAcesso
  delete copia.pdfs
  delete copia.transcricao
  delete copia.materiais
  return copia as T
}
