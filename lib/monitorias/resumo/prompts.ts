/**
 * Instruções do Gemini para o Resumo por IA. Regras que não mudam com o
 * modelo: português do Brasil correto, fidelidade ao que foi dito, nenhuma
 * fala atribuída a quem não falou (a voz vem rotulada pelo navegador que a
 * gravou), e o que for incerto nunca vira fato.
 */

export interface ContextoDaAula {
  materia: string
  conteudos: string[]
  titulo: string
  individual: boolean
}

function contexto(c: ContextoDaAula): string {
  const conteudos = c.conteudos.filter(Boolean).slice(0, 20).join('; ')
  return `Aula de monitoria de medicina. Anúncio: "${c.titulo}". Matéria: ${c.materia || 'não informada'}.${conteudos ? ` Conteúdos combinados: ${conteudos}.` : ''}`
}

export function instrucaoDeTranscricao(c: ContextoDaAula, quem: { papel: 'monitor' | 'aluno'; nome: string }): string {
  return [
    'Você transcreve áudio em português do Brasil.',
    contexto(c),
    `Este áudio tem a voz de UMA pessoa só: ${quem.papel === 'monitor' ? 'o MONITOR' : 'o ALUNO'} (${quem.nome}). As outras vozes da aula não estão aqui.`,
    'Regras:',
    '- Transcreva literalmente o que foi dito. Não resuma, não complete frases, não corrija o conteúdo médico, não acrescente nada.',
    '- Ajuste só a pontuação e a grafia de termos técnicos quando tiver certeza do termo (use o contexto da aula para acertar nomes de doenças, fármacos e estruturas).',
    '- Trecho que não dá para entender: escreva [inaudível] e marque incerto=true. Termo de que você não tem certeza: mantenha o que ouviu e marque incerto=true.',
    '- Ruído, música, silêncio ou fala de outra pessoa ao fundo não são transcritos.',
    '- Divida em falas de até ~25 segundos; inicio_s é o segundo, desde o começo deste áudio, em que a fala começa.',
    '- Sem fala nenhuma no áudio: devolva frases vazia.',
  ].join('\n')
}

const REGRAS_DO_RESUMO = [
  'Regras obrigatórias:',
  '- Escreva em português do Brasil correto, claro e didático, com a terminologia médica certa.',
  '- Use SOMENTE o que está na transcrição. Não acrescente conteúdo, condutas, doses, valores de referência ou classificações que não foram ditos — mesmo que você saiba.',
  '- Quem disse o quê vem SÓ dos rótulos MONITOR/ALUNO de cada linha. Nunca atribua uma fala a quem não a disse.',
  '- Linhas marcadas [trecho incerto], [inaudível] e intervalos [LACUNA] não podem virar afirmação: o que depender deles vai para "aVerificar" ou "lacunas".',
  '- Se algo dito parecer incorreto, ambíguo ou desatualizado, não reproduza como fato: registre em "aVerificar" com o motivo ("conferir em diretriz atual").',
  '- "raciocinioDoMonitor": o encadeamento que o MONITOR usou (pistas → hipóteses → conclusão), quando houver.',
  '- "questoes": de 3 a 8 questões originais de múltipla escolha, com 4 ou 5 alternativas, só sobre o que foi efetivamente discutido; o comentário explica a correta e por que as outras estão erradas, ligado ao que foi dito na aula. Se a aula teve pouco conteúdo, faça menos questões.',
  '- Seções sem conteúdo ficam com listas vazias. Não invente para preencher.',
]

export function instrucaoDoResumo(c: ContextoDaAula): string {
  return [
    'Você escreve o resumo de estudo de uma aula de monitoria a partir da transcrição rotulada.',
    contexto(c),
    c.individual
      ? 'Aula individual: há linhas do MONITOR e do ALUNO.'
      : 'Aula em grupo: só a voz do MONITOR foi gravada. Perguntas de alunos só aparecem quando o monitor as repetiu — nesse caso use quemPerguntou="aluno" apenas se o monitor deixou isso claro; senão "incerto".',
    ...REGRAS_DO_RESUMO,
    'Responda no formato JSON pedido.',
  ].join('\n')
}

/** Aula longa (map): notas fiéis de uma janela, para a redução final. */
export function instrucaoDaParcial(c: ContextoDaAula, janela: { de: string; ate: string; n: number; total: number }): string {
  return [
    `Você faz as notas de estudo de UM trecho (${janela.n} de ${janela.total}, de ${janela.de} a ${janela.ate}) de uma aula de monitoria, a partir da transcrição rotulada.`,
    contexto(c),
    'As notas serão juntadas às dos outros trechos para o resumo final, então:',
    '- Seja detalhado e fiel: tópicos, definições, mecanismos, comparações, dúvidas e respostas, alertas e o raciocínio do monitor, sempre dizendo quem falou (MONITOR/ALUNO, pelo rótulo).',
    '- Não acrescente nada que não foi dito. Marque [incerto] o que depende de trecho incerto/inaudível e liste as [LACUNA].',
    '- O começo e o fim do trecho repetem um pouco os vizinhos: anote normalmente; a redução final elimina repetições.',
    '- Português do Brasil correto. Texto corrido em tópicos (sem JSON).',
  ].join('\n')
}

export function instrucaoDaReducao(c: ContextoDaAula): string {
  return [
    'Você escreve o resumo de estudo final de uma aula de monitoria a partir das NOTAS de cada trecho (em ordem).',
    contexto(c),
    'Os trechos se sobrepõem nas bordas: junte sem repetir e mantenha a ordem da aula.',
    ...REGRAS_DO_RESUMO.map((r) => r.replace('transcrição', 'notas')),
    'Responda no formato JSON pedido.',
  ].join('\n')
}

export function pedidoDeReparo(erros: string[]): string {
  return [
    'O JSON abaixo não passou na validação. Devolva o MESMO conteúdo corrigindo só o formato (sem acrescentar informação):',
    ...erros.map((e) => `- ${e}`),
  ].join('\n')
}
