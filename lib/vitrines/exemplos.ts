/**
 * Os dados de EXEMPLO das vitrines — tudo o que os fragmentos de interface
 * mostram e que não vem do banco.
 *
 * Moram aqui, juntos, por uma razão: um número de exemplo espalhado pelo JSX
 * vira, com o tempo, "o número da plataforma". Aqui ele tem nome de exemplo.
 * O que é real (provas gerais, capas, catálogo, tamanho do acervo) vem de
 * `lib/vitrines/dados.ts`.
 *
 * A questão é de anatomia básica e foi escrita para ser incontestável: a
 * vitrine pode ser aberta por professor.
 */

/** A prova que a vitrine mostra quando o banco não devolve nenhuma prova geral. */
export const PROVA_DE_EXEMPLO = {
  titulo: 'N1 SOI I - 2026.2',
  capa: null,
  questoes: 40,
  duracao: 120,
}

/** Os quatro marcos de uma prova com portões. */
export const MARCOS_DE_EXEMPLO = [
  { nome: 'Portões abrem', hora: '13:50' },
  { nome: 'Início', hora: '14:00' },
  { nome: 'Portões fecham', hora: '14:20' },
  { nome: 'Término', hora: '16:00' },
]

export const QUESTAO_DE_EXEMPLO = {
  numero: 7,
  total: 40,
  modulo: 'SOI I',
  topico: 'Sistema cardiovascular',
  semestre: '2026.1',
  enunciado: 'No coração de um adulto, qual valva separa o átrio esquerdo do ventrículo esquerdo?',
  alternativas: [
    { letra: 'A', texto: 'Valva tricúspide' },
    { letra: 'B', texto: 'Valva pulmonar' },
    { letra: 'C', texto: 'Valva mitral' },
    { letra: 'D', texto: 'Valva aórtica' },
    { letra: 'E', texto: 'Valva da veia cava inferior' },
  ],
  correta: 'C',
  comentario:
    'A mitral (ou bicúspide) fica entre o átrio e o ventrículo esquerdos. A tricúspide separa as câmaras direitas; a pulmonar e a aórtica são as valvas de saída dos ventrículos; a valva da veia cava inferior é um resquício embrionário na entrada do átrio direito.',
}

/** A nota de quem entregou: 31 de 40 nas objetivas. */
export const RESULTADO_DE_EXEMPLO = { acertos: 31, total: 40 }

/**
 * A turma: 62 alunos em dez faixas de nota (0–1 … 9–10). A faixa 7 (7 a 8)
 * contém o 7,75 do resultado acima.
 */
export const TURMA_DE_EXEMPLO = {
  faixas: [0, 1, 2, 4, 7, 10, 13, 12, 8, 5],
  suaFaixa: 7,
  suaNota: '7,75',
  gabarito: { questao: 7, letra: 'C', acertaram: 41 },
}

export const FILTROS_DE_EXEMPLO = {
  filtros: ['SOI I', 'Sistema cardiovascular', '2026.1'],
  resultado: '48 questões',
}

export const SALDO_DE_EXEMPLO = [
  'Valvas cardíacas · SOI I',
  'Surfactante pulmonar · SOI I',
  'Folhetos embrionários · SOI I',
]

/** Acertos por tópico; o mais baixo é o "ponto fraco". */
export const DESEMPENHO_DE_EXEMPLO = [
  { topico: 'Sistema cardiovascular', acertos: 18, total: 24 },
  { topico: 'Sistema respiratório', acertos: 11, total: 20 },
  { topico: 'Embriologia', acertos: 9, total: 16 },
  { topico: 'Histologia geral', acertos: 5, total: 12 },
]

