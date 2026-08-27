/**
 * Lembretes de avaliação: quando disparar e o que dizer.
 *
 * Módulo puro — o cron usa para decidir o envio, o painel do admin usa para
 * mostrar a agenda ("vai lembrar em 12/03, 15/03, 18/03…") ANTES de salvar, e
 * a página do aluno usa para explicar o que ele está ligando. As três telas
 * lendo a mesma função é o que garante que a prévia do admin seja a verdade.
 *
 * Sobre o tom das mensagens: a urgência aqui é sempre uma leitura do
 * calendário, nunca uma invenção. "Faltam 9 dias" é um fato; "últimas vagas",
 * "você vai reprovar" e contagem regressiva inflada não entram. O que muda com
 * a proximidade é o QUANTO se pede — de "começa a olhar" a três semanas para
 * "hoje é véspera, resolve questões" —, não o quanto se assusta.
 */

import type { Avaliacao, ConfigLembrete, UnidadeFrequencia } from './tipos'
import { getTipoAvaliacao } from './tipos'
import {
  diasEntre,
  faixaProximidade,
  formatarDiaCurto,
  formatarDiaLongo,
  isDiaValido,
  isHoraValida,
  somarDias,
  textoProximidade,
} from './brasilia'

/** Nenhuma avaliação dispara mais lembretes que isso, por mais longa que seja a janela. */
export const MAX_LEMBRETES_POR_AVALIACAO = 12

/** Teto de antecedência: lembrar de uma prova a 4 meses é ruído, não ajuda. */
export const MAX_DIAS_ANTES = 120

export function passoEmDias(config: Pick<ConfigLembrete, 'frequencia' | 'unidade'>): number {
  const base = Math.max(1, Math.round(Number(config.frequencia) || 1))
  return config.unidade === 'semanas' ? base * 7 : base
}

/**
 * Os dias em que essa avaliação lembra, do primeiro ao último.
 *
 * A contagem sai do DIA DA PROVA para trás, não do início para frente: o aluno
 * quer o último lembrete colado na véspera, e começar de frente deixaria o
 * último caindo em "faltam 4 dias" quando 14 não é múltiplo de 3.
 */
export function diasDeLembrete(avaliacao: Pick<Avaliacao, 'data' | 'lembrete'>): string[] {
  const { data, lembrete } = avaliacao
  if (!lembrete?.ativo || !isDiaValido(data)) return []

  const antecedencia = Math.min(MAX_DIAS_ANTES, Math.max(0, Math.round(Number(lembrete.iniciarDiasAntes) || 0)))
  const passo = passoEmDias(lembrete)

  const dias: string[] = []
  for (let atras = 0; atras <= antecedencia; atras += passo) {
    dias.push(somarDias(data, -atras))
    if (dias.length >= MAX_LEMBRETES_POR_AVALIACAO) break
  }

  return dias.reverse()
}

/**
 * Os próximos lembretes a partir de um dia de referência, com quantos dias
 * faltarão para a prova em cada um. É o que o painel mostra na configuração.
 */
export function proximosLembretes(
  avaliacao: Pick<Avaliacao, 'data' | 'lembrete'>,
  aPartirDe: string,
  limite = 5,
): Array<{ dia: string; diasRestantes: number }> {
  return diasDeLembrete(avaliacao)
    .filter(dia => dia >= aPartirDe)
    .slice(0, limite)
    .map(dia => ({ dia, diasRestantes: diasEntre(dia, avaliacao.data) }))
}

/** true quando hoje é um dos dias de lembrete e o horário de envio já passou. */
export function deveEnviarHoje(
  avaliacao: Pick<Avaliacao, 'data' | 'lembrete'>,
  hoje: string,
  minutosAgora: number,
): boolean {
  if (!diasDeLembrete(avaliacao).includes(hoje)) return false

  const horario = isHoraValida(avaliacao.lembrete.horario) ? avaliacao.lembrete.horario : '19:00'
  const [h, m] = horario.split(':').map(Number)
  return minutosAgora >= h * 60 + m
}

// ── Texto ───────────────────────────────────────────────────────────────────

export interface TextoLembrete {
  assunto: string
  /** Primeira linha, em negrito no e-mail e no card do app. */
  titulo: string
  /** Corpo: o fato, o que fazer, e por quê. */
  corpo: string[]
  /** Rótulo do botão. */
  cta: string
  /** Frase curta para a notificação in-app, onde não cabe o corpo. */
  resumo: string
}

const CTA_POR_FAIXA: Record<string, string> = {
  hoje: 'Fazer um aquecimento agora',
  critica: 'Resolver questões agora',
  proxima: 'Treinar por questões',
  distante: 'Abrir meu cronograma',
  passada: 'Abrir meu cronograma',
}

/**
 * Monta o lembrete de uma avaliação.
 *
 * A estrutura é sempre a mesma — fato, ação, motivo — e só o peso muda com a
 * proximidade. Isso é deliberado: um lembrete que muda de formato a cada
 * disparo cansa mais rápido do que um que o aluno aprende a ler em dois
 * segundos.
 */
export function montarLembrete(input: {
  avaliacao: Pick<Avaliacao, 'titulo' | 'tipo' | 'data' | 'hora' | 'local' | 'conteudo' | 'lembrete' | 'periodo'>
  nome: string
  diasRestantes: number
  /** Quantas questões o aluno já resolveu do assunto, se soubermos. */
  questoesResolvidas?: number
}): TextoLembrete {
  const { avaliacao, diasRestantes } = input
  const primeiroNome = (input.nome || '').trim().split(/\s+/)[0] || 'estudante'
  const tipo = getTipoAvaliacao(avaliacao.tipo)
  const faixa = faixaProximidade(diasRestantes)
  const quando = textoProximidade(diasRestantes)

  const dataLonga = formatarDiaLongo(avaliacao.data)
  const horaTexto = avaliacao.hora ? ` às ${avaliacao.hora}` : ''
  const localTexto = avaliacao.local ? ` · ${avaliacao.local}` : ''

  const corpo: string[] = [
    `${tipo.rotulo}: <strong>${avaliacao.titulo}</strong> — ${dataLonga}${horaTexto}${localTexto}.`,
  ]

  // O "porquê" muda com o tempo que ainda existe. Cada frase abaixo é uma
  // recomendação de estudo verdadeira para aquela distância — é daí que vem a
  // urgência, não de ameaça.
  if (faixa === 'distante') {
    corpo.push(
      'Ainda dá para fazer do jeito que funciona: um pouco por dia, com revisão espaçada. É a diferença entre chegar sabendo e chegar torcendo.',
    )
  } else if (faixa === 'proxima') {
    corpo.push(
      'Essa é a janela em que o estudo rende mais: conteúdo já visto uma vez, tempo suficiente para revisar duas. Resolver questões agora mostra o que ainda não está de pé.',
    )
  } else if (faixa === 'critica') {
    corpo.push(
      'Nesta reta, ler de novo rende pouco — o que fixa é testar. Resolva questões do assunto e revise só o que errar.',
    )
  } else if (faixa === 'hoje') {
    corpo.push(
      'Hoje não é dia de conteúdo novo. Um aquecimento curto com questões que você já viu acorda a memória sem cansar.',
    )
  } else {
    corpo.push('Se a prova já passou, aproveite para revisar o que caiu enquanto está fresco — é o que vale para a próxima.')
  }

  if (avaliacao.conteudo) {
    corpo.push(`<strong>Cai na prova:</strong> ${avaliacao.conteudo}`)
  }

  if (avaliacao.lembrete?.observacao) {
    corpo.push(avaliacao.lembrete.observacao)
  }

  if (typeof input.questoesResolvidas === 'number' && input.questoesResolvidas > 0) {
    corpo.push(
      `Você já resolveu ${input.questoesResolvidas} ${input.questoesResolvidas === 1 ? 'questão' : 'questões'} na plataforma. Continuar de onde parou leva menos tempo do que recomeçar.`,
    )
  }

  const titulo =
    faixa === 'hoje'
      ? `Hoje é ${avaliacao.titulo}, ${primeiroNome}`
      : faixa === 'passada'
        ? `${avaliacao.titulo} ${quando}`
        : `${primeiroNome}, ${quando} para ${avaliacao.titulo}`

  const assunto =
    faixa === 'hoje'
      ? `${tipo.emoji} Hoje: ${avaliacao.titulo}`
      : faixa === 'critica'
        ? `${tipo.emoji} ${quando} para ${avaliacao.titulo}`
        : `${tipo.emoji} ${avaliacao.titulo} — ${formatarDiaCurto(avaliacao.data)}`

  return {
    assunto,
    titulo,
    corpo,
    cta: CTA_POR_FAIXA[faixa] ?? 'Abrir meu cronograma',
    resumo: `${avaliacao.titulo}: ${quando} (${formatarDiaCurto(avaliacao.data)}).`,
  }
}

// ── Validação da configuração ───────────────────────────────────────────────

const UNIDADES: UnidadeFrequencia[] = ['dias', 'semanas']

/**
 * Normaliza o que veio do formulário do admin. Devolve sempre uma config
 * utilizável: um campo estranho vira o padrão em vez de derrubar o salvamento
 * — a alternativa seria o admin perder a edição inteira por causa de um
 * horário digitado torto.
 */
export function normalizarConfigLembrete(bruto: unknown): ConfigLembrete {
  const entrada = (bruto ?? {}) as Partial<ConfigLembrete>

  const iniciarDiasAntes = Math.min(
    MAX_DIAS_ANTES,
    Math.max(0, Math.round(Number(entrada.iniciarDiasAntes)) || 0),
  )
  const frequencia = Math.max(1, Math.min(60, Math.round(Number(entrada.frequencia)) || 1))
  const unidade = UNIDADES.includes(entrada.unidade as UnidadeFrequencia)
    ? (entrada.unidade as UnidadeFrequencia)
    : 'dias'
  const horario = isHoraValida(entrada.horario) ? entrada.horario : '19:00'
  const observacao = typeof entrada.observacao === 'string' ? entrada.observacao.trim().slice(0, 280) : undefined

  return {
    ativo: entrada.ativo !== false,
    iniciarDiasAntes,
    frequencia,
    unidade,
    horario,
    ...(observacao ? { observacao } : {}),
  }
}

/** Frase que descreve a config em uma linha, para a lista do admin. */
export function descreverLembrete(config: ConfigLembrete): string {
  if (!config.ativo) return 'Lembretes desligados'

  const cadencia =
    config.frequencia === 1
      ? config.unidade === 'semanas' ? 'toda semana' : 'todo dia'
      : `a cada ${config.frequencia} ${config.unidade}`

  const inicio =
    config.iniciarDiasAntes === 0
      ? 'só no dia'
      : `a partir de ${config.iniciarDiasAntes} ${config.iniciarDiasAntes === 1 ? 'dia' : 'dias'} antes`

  return `${inicio}, ${cadencia}, às ${config.horario}`
}
