import type { Exam } from '@/lib/types'
import {
  eProvaSemJanela,
  resolverJanelaDaProva,
  type ContextoDaPessoa,
} from '@/lib/provas/janela-da-prova'

/**
 * Os horários de uma prova, do jeito que cabem num cartão da lista.
 *
 * ## O problema que isto resolve
 *
 * Em `/provas` o cartão de uma prova geral dizia "Aguardando" e nada mais.
 * Aguardando o quê, até quando? O horário existia no banco, existia no
 * formulário do admin e aparecia inteiro na tela da prova — mas só depois de
 * abrir a prova, que é exatamente o lugar onde a pessoa já não precisa mais
 * dele. Quem olha o catálogo está decidindo *quando voltar*, e o cartão não
 * respondia a pergunta.
 *
 * O selo de fase (`ROTULO_DA_FASE`) diz o ESTADO; estes marcos dizem a AGENDA.
 * São coisas diferentes: "Aguardando" mais "Portão abre hoje, 13:00" é a
 * informação completa, e nenhuma das duas metades substitui a outra.
 *
 * ## Por que nem sempre são quatro marcos
 *
 * `resolverJanelaDaProva` normaliza a prova sem portões para
 * `gatesOpen = startTime` e `gatesClose = endTime` — o que é certo para
 * DECIDIR e péssimo para MOSTRAR: a maioria das provas não tem portão próprio,
 * e repetir o mesmo horário sob dois rótulos ("Portão abre 13:00" / "Prova
 * começa 13:00") faz o cartão parecer mais complicado do que a prova é.
 *
 * Aqui um marco de portão só aparece quando ele diz algo que os horários da
 * prova já não diziam. Prova sem portão próprio mostra dois marcos; o
 * vestibular clássico (portão das 13h às 13h50, prova às 14h) mostra os
 * quatro.
 *
 * ## Prova de treino e prova pessoal não têm agenda
 *
 * Nascem com `endTime` um ano à frente só para liberar o acesso (ver
 * `lib/provas/janela-da-prova.ts`). Mostrar "Prova termina 12/09/2027" numa
 * prova de treino seria exibir um detalhe de implementação como se fosse um
 * prazo. Por isso `horariosDaProva` devolve lista vazia para elas — é a mesma
 * regra do `fase: 'livre'`, e é o que o pedido "só quando é prova geral e não
 * é treino" quer dizer.
 */

export interface HorarioNaLista {
  /** 'Portão abre', 'Prova começa', 'Prova termina', 'Portão fecha'. */
  rotulo: string
  quando: Date
  /** O horário já escrito para a tela: `hoje, 13:00`. */
  texto: string
  /** Quanto falta, em linguagem de gente (`em 2 h 15 min`), ou `null`. */
  espera: string | null
  jaPassou: boolean
  /** O próximo a acontecer — o único que muda o que a pessoa faz agora. */
  eOProximo: boolean
}

function paraData(valor: unknown): Date | null {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor as string)
  return Number.isFinite(data.getTime()) ? data : null
}

/** Quantos dias de calendário separam duas datas, no fuso de quem lê. */
function distanciaEmDias(quando: Date, agora: Date): number {
  const diaDe = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((diaDe(quando) - diaDe(agora)) / 86_400_000)
}

/**
 * O horário escrito como alguém falaria.
 *
 * `10/05/2026, 13:00` é preciso e não responde "é hoje?" sem que a pessoa
 * confira o calendário. Perto do agora o dia vira palavra ("hoje", "amanhã");
 * longe, vira data — e o ano só aparece quando ele próprio é a novidade.
 */
export function formatarDiaEHora(quando: Date | string | null | undefined, agora: Date = new Date()): string {
  const data = paraData(quando)
  if (!data) return '—'

  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dias = distanciaEmDias(data, agora)

  if (dias === 0) return `hoje, ${hora}`
  if (dias === 1) return `amanhã, ${hora}`
  if (dias === -1) return `ontem, ${hora}`

  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const anoDiferente = data.getFullYear() !== agora.getFullYear()
  return anoDiferente ? `${dia}/${data.getFullYear()}, ${hora}` : `${dia}, ${hora}`
}

/**
 * Quanto falta — e só quando isso ainda muda alguma coisa.
 *
 * "em 12 min" é uma decisão (fico por aqui); "em 43 dias" não é decisão
 * nenhuma, é a data por escrito de novo. Acima de uma semana devolve `null` e
 * a tela mostra só a data.
 *
 * ## Por que o resto sempre aparece
 *
 * Truncar "1 dia e 12 h" para "em 1 dia" não é arredondar: é dizer outro dia.
 * Às 23h de segunda, uma prova de quarta às 11h fica a 1 dia e 12 horas — e
 * "em 1 dia" lido às 23h de segunda é terça. A pessoa se programa para o dia
 * errado, e o texto que a enganou estava tecnicamente correto.
 *
 * O erro nasce de truncar a unidade GRANDE perto da virada dela, e é o mesmo
 * em "em 2 h" para 2 h 55 min. Por isso a unidade menor acompanha sempre que
 * existe — e some quando é zero, que é quando ela não tem nada a corrigir.
 */
export function descreverEspera(ms: number): string | null {
  if (ms <= 0) return null

  const minutos = Math.floor(ms / 60_000)
  if (minutos < 1) return 'em instantes'
  if (minutos < 60) return `em ${minutos} min`

  const horas = Math.floor(minutos / 60)
  const restoEmMin = minutos % 60
  if (horas < 24) return restoEmMin === 0 ? `em ${horas} h` : `em ${horas} h ${restoEmMin} min`

  const dias = Math.floor(horas / 24)
  if (dias > 7) return null

  const restoEmHoras = horas % 24
  const nomeDoDia = dias === 1 ? '1 dia' : `${dias} dias`
  return restoEmHoras === 0 ? `em ${nomeDoDia}` : `em ${nomeDoDia} e ${restoEmHoras} h`
}

/**
 * Os marcos que valem a pena mostrar nesta prova, em ordem de relógio.
 *
 * Devolve lista vazia quando não há agenda a mostrar: prova de treino, prova
 * pessoal, ou prova antiga sem datas (que `resolverJanelaDaProva` também trata
 * como livre, em vez de trancar para sempre).
 */
export function horariosDaProva(
  prova: Partial<Exam> | null | undefined,
  agora: Date = new Date(),
  pessoa: ContextoDaPessoa = {},
): HorarioNaLista[] {
  if (!prova || eProvaSemJanela(prova)) return []

  const janela = resolverJanelaDaProva(prova, agora, pessoa)
  if (janela.fase === 'livre') return []

  const { abrePortaoEm, comecaEm, terminaEm, fechaPortaoEm } = janela
  if (!comecaEm || !terminaEm) return []

  const candidatos: Array<{ rotulo: string; quando: Date | null }> = [
    // O portão só entra quando tem horário próprio: sem isso ele repete o
    // início da prova sob outro nome (ver o cabeçalho deste arquivo).
    ...(abrePortaoEm && abrePortaoEm.getTime() !== comecaEm.getTime()
      ? [{ rotulo: 'Portão abre', quando: abrePortaoEm }]
      : []),
    { rotulo: 'Prova começa', quando: comecaEm },
    ...(fechaPortaoEm && fechaPortaoEm.getTime() !== terminaEm.getTime()
      ? [{ rotulo: 'Portão fecha', quando: fechaPortaoEm }]
      : []),
    { rotulo: 'Prova termina', quando: terminaEm },
  ]

  const t = agora.getTime()
  const marcos = candidatos
    .filter((c): c is { rotulo: string; quando: Date } => c.quando !== null)
    .sort((a, b) => a.quando.getTime() - b.quando.getTime())
    .map((c) => ({
      rotulo: c.rotulo,
      quando: c.quando,
      texto: formatarDiaEHora(c.quando, agora),
      espera: descreverEspera(c.quando.getTime() - t),
      jaPassou: c.quando.getTime() <= t,
      eOProximo: false,
    }))

  const proximo = marcos.findIndex((m) => !m.jaPassou)
  if (proximo >= 0) marcos[proximo].eOProximo = true

  return marcos
}

/**
 * O instante em que esta prova muda de fase — o momento exato em que a tela
 * precisa se redesenhar sozinha.
 *
 * ## O problema que isto resolve
 *
 * A fase de uma prova não vem do servidor: ela é DERIVADA da hora atual
 * (`resolverJanelaDaProva`). Quer dizer que o selo "Aguardando" e o botão
 * travado do cartão não são um dado que chega — são o resultado de uma conta
 * feita na renderização. E uma conta só é refeita quando algo redesenha o
 * componente.
 *
 * Sem isso, quem abre `/provas` às 12h50 para esperar o portão das 13h fica
 * olhando "Aguardando" às 13h05, às 13h30, para sempre: o portão abriu no
 * relógio e não abriu na tela. O único jeito de descobrir era apertar F5 — e
 * exigir F5 de quem está esperando é fazer a pessoa desconfiar da página
 * justamente na hora em que ela mais depende dela.
 *
 * Devolve `null` quando não há mais nada a acontecer (prova encerrada, prova
 * de treino, prova sem datas): nesses casos não há o que acordar.
 */
export function proximoInstanteDaJanela(
  prova: Partial<Exam> | null | undefined,
  agora: Date = new Date(),
  pessoa: ContextoDaPessoa = {},
): number | null {
  const proximo = horariosDaProva(prova, agora, pessoa).find((m) => m.eOProximo)
  return proximo ? proximo.quando.getTime() : null
}
