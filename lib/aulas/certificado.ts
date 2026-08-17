/**
 * Certificado de conclusão (§38).
 *
 * O que este módulo NÃO faz é tão importante quanto o que ele faz: nenhuma
 * decisão de elegibilidade acontece no navegador. A tela mostra o quanto falta;
 * quem confere se pode emitir é o servidor, com esta mesma função. Um
 * certificado é um documento que a pessoa mostra a terceiros — deixar a régua no
 * cliente seria oferecer um botão de "declarar-se aprovado".
 *
 * O código de verificação existe pelo mesmo motivo. Um PDF bonito não prova
 * nada; o que prova é haver um endereço público onde qualquer um confere que
 * aquele código corresponde àquela pessoa naquele curso. Por isso o código é
 * gerado com aleatoriedade suficiente para não ser adivinhado por tentativa.
 */

export interface RegrasDoCertificado {
  habilitado: boolean
  /** Percentual de aulas concluídas exigido. 100 = curso inteiro. */
  percentualMinimo: number
  /** Linha de assinatura impressa no documento. */
  textoAssinatura?: string
}

export const PERCENTUAL_MINIMO_PADRAO = 100

/**
 * Regras efetivas de um curso.
 *
 * Curso sem configuração explícita fica DESABILITADO. O contrário — emitir
 * certificado por omissão — faria toda a plataforma passar a emitir documentos
 * no dia do deploy, para cursos que nunca foram pensados para isso (§45).
 */
export function regrasDoCertificado(curso: {
  certificado?: Partial<RegrasDoCertificado> | null
}): RegrasDoCertificado {
  const bruto = curso?.certificado
  if (!bruto || bruto.habilitado !== true) {
    return { habilitado: false, percentualMinimo: PERCENTUAL_MINIMO_PADRAO }
  }

  const percentual = Number(bruto.percentualMinimo)
  return {
    habilitado: true,
    percentualMinimo:
      Number.isFinite(percentual) && percentual >= 1 && percentual <= 100
        ? Math.round(percentual)
        : PERCENTUAL_MINIMO_PADRAO,
    textoAssinatura: bruto.textoAssinatura
      ? String(bruto.textoAssinatura).slice(0, 160)
      : undefined,
  }
}

export interface VereditoDoCertificado {
  /** O curso oferece certificado? */
  oferecido: boolean
  /** Já pode emitir? */
  elegivel: boolean
  percentual: number
  concluidas: number
  total: number
  /** Quantas aulas ainda faltam para bater a régua. */
  faltam: number
}

/**
 * Pode emitir?
 *
 * `faltam` é calculado a partir do NÚMERO DE AULAS, não do percentual: dizer
 * "faltam 8%" não diz o que fazer, e "faltam 2 aulas" diz. O arredondamento é
 * para cima porque meia aula não existe — com 9 de 10 aulas e régua de 95%, a
 * resposta correta é "falta 1", nunca "falta 0,5".
 */
export function avaliarCertificado(
  regras: RegrasDoCertificado,
  progresso: { concluidas: number; total: number },
): VereditoDoCertificado {
  const total = Math.max(0, progresso.total)
  const concluidas = Math.max(0, Math.min(total, progresso.concluidas))
  const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0

  if (!regras.habilitado || total === 0) {
    return { oferecido: false, elegivel: false, percentual, concluidas, total, faltam: 0 }
  }

  const necessarias = Math.ceil((regras.percentualMinimo / 100) * total)
  const faltam = Math.max(0, necessarias - concluidas)

  return {
    oferecido: true,
    elegivel: faltam === 0,
    percentual,
    concluidas,
    total,
    faltam,
  }
}

/** Alfabeto sem os caracteres que se confundem ao ler em voz alta ou copiar. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const TAMANHO_DO_CODIGO = 12

/**
 * Código de verificação.
 *
 * Sem `0/O` e `1/I/L`: o código é lido em voz alta, digitado à mão e copiado de
 * um papel impresso, e cada par ambíguo vira um "não encontrado" que parece
 * fraude e é só erro de leitura.
 *
 * Recebe o gerador de aleatoriedade de fora para poder ser testado sem
 * mocar globais — e para usar `crypto` no servidor, que é onde ele roda.
 */
export function gerarCodigo(aleatorio: () => number = Math.random): string {
  let codigo = ''
  for (let i = 0; i < TAMANHO_DO_CODIGO; i += 1) {
    codigo += ALFABETO[Math.floor(aleatorio() * ALFABETO.length) % ALFABETO.length]
  }
  // Agrupado de quatro em quatro: é assim que se confere código longo sem
  // perder o lugar.
  return `${codigo.slice(0, 4)}-${codigo.slice(4, 8)}-${codigo.slice(8, 12)}`
}

/** Aceita o código com ou sem hífen, em qualquer caixa. */
export function normalizarCodigo(bruto: string): string {
  return String(bruto || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, TAMANHO_DO_CODIGO)
}

export function formatarCodigo(bruto: string): string {
  const limpo = normalizarCodigo(bruto)
  if (limpo.length !== TAMANHO_DO_CODIGO) return limpo
  return `${limpo.slice(0, 4)}-${limpo.slice(4, 8)}-${limpo.slice(8, 12)}`
}

export interface CertificadoEmitido {
  _id?: string
  codigo: string
  usuarioId: string
  nomeDoAluno: string
  setorId: string
  nomeDoCurso: string
  /** Retrato do momento da emissão — o curso pode crescer depois. */
  aulasConcluidas: number
  aulasTotais: number
  percentual: number
  emitidoEm: Date
}

/**
 * Texto da conclusão, usado no documento e na página de verificação.
 *
 * O retrato guardado na emissão é o que aparece, e não o progresso de hoje: o
 * curso ganha aulas com o tempo, e um certificado que passa a dizer "18 de 32"
 * porque o curso cresceu depois desmoraliza o documento de quem terminou as 18
 * que existiam.
 */
export function descreverCertificado(c: Pick<CertificadoEmitido, 'aulasConcluidas' | 'aulasTotais' | 'emitidoEm'>): string {
  const data = new Date(c.emitidoEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  return `Concluiu ${c.aulasConcluidas} de ${c.aulasTotais} aulas em ${data}.`
}
