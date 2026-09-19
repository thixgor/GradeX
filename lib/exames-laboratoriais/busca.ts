/**
 * Busca da central de exames.
 *
 * Três coisas precisam funcionar aqui, e nenhuma delas é busca por prefixo:
 *
 * 1. **Sinônimos.** No Brasil, TGO, AST e aspartato aminotransferase são o
 *    mesmo exame com três nomes em uso simultâneo, e quem digita um deles
 *    frequentemente não sabe que os outros existem. Cada marcador carrega a
 *    lista de como pode ser chamado, e a busca pesa igual quem digitou "tgo" e
 *    quem digitou "ast".
 *
 * 2. **Alterações como termo de busca.** "Hiponatremia" não é o nome de um
 *    exame — é o nome de um achado. A tabela `ALTERACOES` descreve esses
 *    achados e os liga ao marcador que os explica, em uma direção declarada.
 *    Quem busca por um deles cai na página do achado, não na ficha inteira do
 *    marcador: a ficha explica o marcador nos dois sentidos, e quem digitou
 *    "hiponatremia" só tem um deles na mão.
 *
 * 3. **Perguntas.** Quem digita "por que a ferritina aumenta na inflamação?"
 *    não quer uma lista de resultados: quer a explicação. `PERGUNTAS` leva
 *    direto ao trecho relevante — e quando nenhuma pergunta bate, as palavras
 *    da frase alimentam a busca normal.
 */

import type { Doenca, Exame, Marcador, Padrao, Sistema } from './tipos'

/** Remove acentos e caixa para que "anion gap" encontre "ânion gap". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/* ═════════════════════ Alterações como atalho ═════════════════════ */

/**
 * Uma alteração laboratorial — o achado com nome próprio.
 *
 * "Hiponatremia" não é um exame nem uma doença: é o nome que o achado recebe
 * quando o sódio está baixo, e é assim que a pessoa pensa ao ler um laudo. Por
 * isso a alteração tem página própria (`/alteracao/[id]`), e não é apenas um
 * atalho para a ficha do marcador: a ficha explica o marcador inteiro — nos dois
 * sentidos —, enquanto a alteração explica **um** sentido, que é justamente o
 * que a pessoa tem na mão.
 *
 * `direcao` é o que liga uma coisa à outra: diz qual bloco da ficha do marcador
 * (`aumento` ou `reducao`) responde por aquele achado.
 */
export interface AlteracaoLaboratorial {
  /** Identificador estável — é o que vira rota. */
  id: string
  /** O nome do achado, como aparece no laudo e na conversa clínica. */
  termo: string
  /** Outros nomes em uso para o mesmo achado ('hiperpotassemia' = 'hipercalemia'). */
  sinonimos?: string[]
  /** Id do marcador que mede o achado. */
  marcador: string
  /** Para que lado o marcador se moveu — governa qual bloco da ficha abrir. */
  direcao: 'alta' | 'baixa'
  /** O achado em uma linha: qual valor, em relação a qual limite. */
  descricao: string
}

/**
 * Termos de alteração laboratorial, cada um ligado ao marcador que o explica.
 * São o vocabulário com que a pessoa realmente pensa quando lê um laudo.
 */
export const ALTERACOES: AlteracaoLaboratorial[] = [
  { id: 'anemia', termo: 'anemia', marcador: 'hemoglobina', direcao: 'baixa', descricao: 'Hemoglobina abaixo da referência para sexo e idade' },
  { id: 'policitemia', termo: 'policitemia', sinonimos: ['eritrocitose'], marcador: 'hemoglobina', direcao: 'alta', descricao: 'Hemoglobina e hematócrito elevados' },
  { id: 'microcitose', termo: 'microcitose', marcador: 'vcm', direcao: 'baixa', descricao: 'VCM abaixo de 80 fL' },
  { id: 'macrocitose', termo: 'macrocitose', marcador: 'vcm', direcao: 'alta', descricao: 'VCM acima de 100 fL' },
  { id: 'anisocitose', termo: 'anisocitose', marcador: 'rdw', direcao: 'alta', descricao: 'RDW elevado — população eritrocitária heterogênea' },
  { id: 'leucocitose', termo: 'leucocitose', marcador: 'leucocitos', direcao: 'alta', descricao: 'Leucócitos acima de 11.000/mm³' },
  { id: 'leucopenia', termo: 'leucopenia', marcador: 'leucocitos', direcao: 'baixa', descricao: 'Leucócitos abaixo de 4.000/mm³' },
  { id: 'neutrofilia', termo: 'neutrofilia', marcador: 'neutrofilos', direcao: 'alta', descricao: 'Neutrófilos absolutos elevados' },
  { id: 'neutropenia', termo: 'neutropenia', marcador: 'neutrofilos', direcao: 'baixa', descricao: 'Neutrófilos absolutos abaixo de 1.500/mm³' },
  { id: 'linfocitose', termo: 'linfocitose', marcador: 'linfocitos', direcao: 'alta', descricao: 'Linfócitos absolutos elevados' },
  { id: 'linfopenia', termo: 'linfopenia', marcador: 'linfocitos', direcao: 'baixa', descricao: 'Linfócitos absolutos reduzidos' },
  { id: 'eosinofilia', termo: 'eosinofilia', marcador: 'eosinofilos', direcao: 'alta', descricao: 'Eosinófilos acima de 500/mm³' },
  { id: 'plaquetopenia', termo: 'plaquetopenia', sinonimos: ['trombocitopenia'], marcador: 'plaquetas', direcao: 'baixa', descricao: 'Plaquetas abaixo de 150.000/mm³' },
  { id: 'trombocitose', termo: 'trombocitose', marcador: 'plaquetas', direcao: 'alta', descricao: 'Plaquetas acima de 450.000/mm³' },
  { id: 'hiponatremia', termo: 'hiponatremia', marcador: 'sodio', direcao: 'baixa', descricao: 'Sódio abaixo de 135 mEq/L' },
  { id: 'hipernatremia', termo: 'hipernatremia', marcador: 'sodio', direcao: 'alta', descricao: 'Sódio acima de 145 mEq/L' },
  { id: 'hipercalemia', termo: 'hipercalemia', sinonimos: ['hiperpotassemia'], marcador: 'potassio', direcao: 'alta', descricao: 'Potássio acima de 5,0 mEq/L' },
  { id: 'hipocalemia', termo: 'hipocalemia', sinonimos: ['hipopotassemia'], marcador: 'potassio', direcao: 'baixa', descricao: 'Potássio abaixo de 3,5 mEq/L' },
  { id: 'hipercalcemia', termo: 'hipercalcemia', marcador: 'calcio', direcao: 'alta', descricao: 'Cálcio corrigido acima de 10,5 mg/dL' },
  { id: 'hipocalcemia', termo: 'hipocalcemia', marcador: 'calcio', direcao: 'baixa', descricao: 'Cálcio corrigido abaixo de 8,5 mg/dL' },
  { id: 'hipomagnesemia', termo: 'hipomagnesemia', marcador: 'magnesio', direcao: 'baixa', descricao: 'Magnésio abaixo de 1,7 mg/dL' },
  { id: 'hipofosfatemia', termo: 'hipofosfatemia', marcador: 'fosforo', direcao: 'baixa', descricao: 'Fósforo abaixo de 2,5 mg/dL' },
  { id: 'hiperfosfatemia', termo: 'hiperfosfatemia', marcador: 'fosforo', direcao: 'alta', descricao: 'Fósforo acima de 4,5 mg/dL' },
  { id: 'azotemia', termo: 'azotemia', sinonimos: ['uremia'], marcador: 'ureia', direcao: 'alta', descricao: 'Retenção de produtos nitrogenados' },
  { id: 'proteinuria', termo: 'proteinúria', marcador: 'proteinuria', direcao: 'alta', descricao: 'Proteína na urina acima de 150 mg/24h' },
  { id: 'hematuria', termo: 'hematúria', marcador: 'eas', direcao: 'alta', descricao: 'Hemácias na urina acima do esperado' },
  { id: 'piuria', termo: 'piúria', marcador: 'eas', direcao: 'alta', descricao: 'Leucócitos na urina' },
  { id: 'colestase', termo: 'colestase', marcador: 'fosfatase-alcalina', direcao: 'alta', descricao: 'FA e GGT elevadas com bilirrubina direta alta' },
  { id: 'hiperbilirrubinemia', termo: 'hiperbilirrubinemia', sinonimos: ['ictericia'], marcador: 'bilirrubina-total', direcao: 'alta', descricao: 'Bilirrubina total elevada' },
  { id: 'transaminases-elevadas', termo: 'transaminases elevadas', sinonimos: ['hipertransaminasemia'], marcador: 'alt', direcao: 'alta', descricao: 'AST e ALT acima da referência' },
  { id: 'hipoalbuminemia', termo: 'hipoalbuminemia', marcador: 'albumina', direcao: 'baixa', descricao: 'Albumina abaixo de 3,5 g/dL' },
  { id: 'hiperglicemia', termo: 'hiperglicemia', marcador: 'glicemia-jejum', direcao: 'alta', descricao: 'Glicemia acima da referência' },
  { id: 'hipoglicemia', termo: 'hipoglicemia', marcador: 'glicemia-jejum', direcao: 'baixa', descricao: 'Glicemia abaixo de 70 mg/dL com sintomas' },
  { id: 'dislipidemia', termo: 'dislipidemia', marcador: 'ldl', direcao: 'alta', descricao: 'Alteração do perfil lipídico' },
  { id: 'hipertrigliceridemia', termo: 'hipertrigliceridemia', marcador: 'triglicerideos', direcao: 'alta', descricao: 'Triglicerídeos acima de 150 mg/dL' },
  { id: 'hiperuricemia', termo: 'hiperuricemia', marcador: 'acido-urico', direcao: 'alta', descricao: 'Ácido úrico acima da referência' },
  { id: 'acidose-metabolica', termo: 'acidose metabólica', marcador: 'bicarbonato', direcao: 'baixa', descricao: 'pH baixo com bicarbonato reduzido' },
  { id: 'alcalose-metabolica', termo: 'alcalose metabólica', marcador: 'bicarbonato', direcao: 'alta', descricao: 'pH alto com bicarbonato elevado' },
  { id: 'acidose-respiratoria', termo: 'acidose respiratória', marcador: 'paco2', direcao: 'alta', descricao: 'pH baixo com PaCO₂ elevada' },
  { id: 'hipoxemia', termo: 'hipoxemia', marcador: 'pao2', direcao: 'baixa', descricao: 'PaO₂ abaixo de 80 mmHg' },
  { id: 'hiperlactatemia', termo: 'hiperlactatemia', marcador: 'lactato', direcao: 'alta', descricao: 'Lactato acima de 2 mmol/L' },
  { id: 'ferropenia', termo: 'ferropenia', marcador: 'ferritina', direcao: 'baixa', descricao: 'Estoque de ferro reduzido' },
  { id: 'hipotireoidismo', termo: 'hipotireoidismo', marcador: 'tsh', direcao: 'alta', descricao: 'TSH elevado com T4 livre reduzido' },
  { id: 'hipertireoidismo', termo: 'hipertireoidismo', marcador: 'tsh', direcao: 'baixa', descricao: 'TSH suprimido com T4 livre elevado' },
  { id: 'hiperprolactinemia', termo: 'hiperprolactinemia', marcador: 'prolactina', direcao: 'alta', descricao: 'Prolactina acima da referência' },
  { id: 'hipercortisolismo', termo: 'hipercortisolismo', marcador: 'cortisol', direcao: 'alta', descricao: 'Cortisol elevado e não suprimível' },
  { id: 'rabdomiolise', termo: 'rabdomiólise', marcador: 'ck', direcao: 'alta', descricao: 'CK muito elevada com risco de lesão renal' },
]

export const ALTERACAO_POR_ID = new Map(ALTERACOES.map((a) => [a.id, a]))

export function alteracaoPorId(id: string): AlteracaoLaboratorial | undefined {
  return ALTERACAO_POR_ID.get(id)
}

/** As alterações que um marcador nomeia — hiponatremia e hipernatremia, para o sódio. */
export function alteracoesDoMarcador(marcador: string): AlteracaoLaboratorial[] {
  return ALTERACOES.filter((a) => a.marcador === marcador)
}

/* ═════════════════════ Perguntas diretas ═════════════════════ */

export interface PerguntaMapeada {
  pergunta: string
  /** Para onde levar: marcador, padrão, comparação ou doença. */
  destino: { tipo: 'marcador' | 'padrao' | 'comparacao' | 'doenca'; id: string }
  /** A resposta curta, mostrada antes de abrir o conteúdo completo. */
  resposta: string
}

export const PERGUNTAS: PerguntaMapeada[] = [
  {
    pergunta: 'Por que a ferritina aumenta na inflamação?',
    destino: { tipo: 'marcador', id: 'ferritina' },
    resposta:
      'Porque a ferritina é reagente de fase aguda. A IL-6 induz sua síntese e a da hepcidina; a hepcidina degrada a ferroportina e tranca o ferro dentro do macrófago — a ferritina sobe justamente porque é onde o ferro está guardado, enquanto o ferro sérico cai.',
  },
  {
    pergunta: 'Por que a ureia aumenta na desidratação?',
    destino: { tipo: 'marcador', id: 'ureia' },
    resposta:
      'Porque a ureia é reabsorvida no túbulo coletor junto com a água, sob ação da ADH — e a creatinina não. Na hipovolemia, o corpo retém água e arrasta ureia junto, produzindo relação ureia/creatinina acima de 40.',
  },
  {
    pergunta: 'Qual a diferença entre TGO e TGP?',
    destino: { tipo: 'marcador', id: 'ast' },
    resposta:
      'TGO é a AST e TGP é a ALT. A ALT é praticamente exclusiva do fígado e citoplasmática — vaza primeiro. A AST existe também em músculo, coração e hemácias, e tem fração mitocondrial: por isso predomina na lesão alcoólica e pode subir sem doença hepática alguma.',
  },
  {
    pergunta: 'Como diferenciar anemia ferropriva de talassemia?',
    destino: { tipo: 'comparacao', id: 'ferropriva-vs-talassemia-vs-doenca-cronica' },
    resposta:
      'Pelo RDW, pela contagem de hemácias e pela ferritina. Na ferropenia o RDW sobe (duas populações), as hemácias caem e a ferritina é baixa. Na talassemia o RDW é normal (todas as células são igualmente pequenas), a contagem é normal ou alta e a ferritina é normal.',
  },
  {
    pergunta: 'Por que o potássio aumenta na insuficiência renal?',
    destino: { tipo: 'marcador', id: 'potassio' },
    resposta:
      'Porque 90% do potássio é excretado pelo rim, e a secreção ocorre no túbulo coletor — dependendo de fluxo distal e de aldosterona. Com a filtração reduzida, ambos caem, e o potássio se acumula. A acidose associada agrava, deslocando potássio de dentro da célula.',
  },
  {
    pergunta: 'Por que a albumina cai na cirrose?',
    destino: { tipo: 'marcador', id: 'albumina' },
    resposta:
      'Porque a albumina é sintetizada exclusivamente pelo fígado. Com a perda de massa hepatocitária funcionante, a produção cai. Como sua meia-vida é de cerca de 20 dias, a queda indica doença estabelecida — enquanto o INR, dependente do fator VII (meia-vida de 6 horas), se altera bem antes.',
  },
  {
    pergunta: 'Por que a creatinina sobe com trimetoprima sem haver lesão renal?',
    destino: { tipo: 'marcador', id: 'creatinina' },
    resposta:
      'Porque 10 a 20% da creatinina é eliminada por secreção tubular, e a trimetoprima bloqueia esse transportador. A filtração glomerular não muda — a creatinina sobe por fechamento de uma via de saída acessória. A ureia permanece estável, e a cistatina C confirma que a função está preservada.',
  },
  {
    pergunta: 'Por que a hemoglobina glicada pode enganar?',
    destino: { tipo: 'marcador', id: 'hba1c' },
    resposta:
      'Porque ela depende de a hemácia viver 120 dias. Tudo que encurta essa vida (hemólise, sangramento, transfusão, gestação, eritropoetina) a reduz falsamente; tudo que a prolonga (ferropenia não tratada, deficiência de B12, esplenectomia) a eleva.',
  },
  {
    pergunta: 'Por que o sódio baixo nem sempre significa falta de sal?',
    destino: { tipo: 'marcador', id: 'sodio' },
    resposta:
      'Porque a natremia é uma razão entre sódio e água, e o corpo regula as duas por vias independentes. Hiponatremia quase sempre significa água em excesso, e não sal de menos — o que muda tudo é a volemia: hipovolêmica, euvolêmica (SIADH) ou hipervolêmica.',
  },
  {
    pergunta: 'Por que a troponina pode estar alta sem infarto?',
    destino: { tipo: 'marcador', id: 'troponina' },
    resposta:
      'Porque a troponina marca lesão do miócito, e não oclusão coronária. Miocardite, sepse, embolia pulmonar, taquiarritmia, insuficiência cardíaca e doença renal crônica a elevam. O que caracteriza infarto é a variação entre coletas somada ao contexto de isquemia.',
  },
  {
    pergunta: 'Por que a fosfatase alcalina pode subir sem doença hepática?',
    destino: { tipo: 'marcador', id: 'fosfatase-alcalina' },
    resposta:
      'Porque a mesma enzima existe no osso, na placenta e no intestino. FA alta com GGT normal aponta origem óssea (crescimento, Paget, metástases, hiperparatireoidismo), placentária (gestação) ou intestinal. A GGT é o desempate.',
  },
  {
    pergunta: 'Por que o VHS e a PCR podem discordar?',
    destino: { tipo: 'marcador', id: 'vhs' },
    resposta:
      'Porque medem tempos diferentes. A PCR sobe em horas e cai em dias; o VHS sobe em dias e leva semanas para normalizar. PCR normal com VHS alto costuma indicar processo em resolução — ou anemia, gamopatia e idade avançada, que elevam o VHS sem inflamação.',
  },
  {
    pergunta: 'Por que a hipocalemia não corrige com reposição de potássio?',
    destino: { tipo: 'marcador', id: 'magnesio' },
    resposta:
      'Quase sempre por hipomagnesemia. Sem magnésio, os canais ROMK do túbulo coletor ficam desinibidos e o rim continua perdendo potássio. Nenhuma reposição sustenta o nível enquanto o magnésio não for corrigido.',
  },
  {
    pergunta: 'Por que o cálcio total engana?',
    destino: { tipo: 'marcador', id: 'calcio' },
    resposta:
      'Porque cerca de 40% dele circula ligado à albumina, e só a fração ionizada é ativa. Hipoalbuminemia derruba o cálcio total sem alterar o ionizado. Corrija somando 0,8 mg/dL por cada 1,0 g/dL de albumina abaixo de 4,0 — ou dose o ionizado.',
  },
  {
    pergunta: 'Como interpretar uma gasometria passo a passo?',
    destino: { tipo: 'marcador', id: 'ph' },
    resposta:
      'Em sequência: há acidemia ou alcalemia? O distúrbio é respiratório ou metabólico? A compensação é adequada? Qual o ânion gap corrigido pela albumina? Existe distúrbio misto? Como está a oxigenação? E o lactato?',
  },
  {
    pergunta: 'Por que os marcadores tumorais não servem para rastrear câncer?',
    destino: { tipo: 'marcador', id: 'cea' },
    resposta:
      'Porque são expressos também por tecido normal e inflamado, e porque em população de baixa prevalência quase todo resultado positivo é falso — uma consequência aritmética do valor preditivo positivo. Seu uso adequado é o seguimento de doença já diagnosticada.',
  },
  {
    pergunta: 'Por que o reticulócito é tão importante na anemia?',
    destino: { tipo: 'marcador', id: 'reticulocitos' },
    resposta:
      'Porque responde à pergunta que organiza toda anemia: a medula está tentando compensar? Alto significa medula competente reagindo a perda ou destruição. Baixo significa que o problema está na própria produção.',
  },
  {
    pergunta: 'Como diferenciar lesão renal pré-renal de necrose tubular?',
    destino: { tipo: 'comparacao', id: 'pre-renal-vs-renal-vs-pos-renal' },
    resposta:
      'Pela capacidade tubular de reabsorver sódio. No pré-renal o túbulo está vivo: sódio urinário abaixo de 20, FENa abaixo de 1%, urina concentrada e ureia/creatinina acima de 40. Na necrose tubular ele está lesado: sódio urinário acima de 40, isostenúria e cilindros granulosos.',
  },
  {
    pergunta: 'Por que a bilirrubina indireta não aparece na urina?',
    destino: { tipo: 'marcador', id: 'bilirrubina-indireta' },
    resposta:
      'Porque ela é lipossolúvel e circula ligada à albumina, não sendo filtrada pelo glomérulo. Só a bilirrubina direta, hidrossolúvel, escurece a urina. Por isso icterícia sem colúria aponta hemólise ou defeito de conjugação, e nunca colestase.',
  },
  {
    pergunta: 'Por que o INR alarga antes da albumina cair na doença hepática?',
    destino: { tipo: 'comparacao', id: 'inr-vitamina-k-vs-hepatica' },
    resposta:
      'Por causa das meias-vidas. O fator VII dura cerca de 6 horas; a albumina, cerca de 20 dias. Quando a síntese hepática falha, o INR alarga em horas e a albumina só cai semanas depois — e é essa diferença que data a lesão.',
  },
]

/* ═════════════════════ Motor de busca ═════════════════════ */

export type TipoDeResultado = 'marcador' | 'exame' | 'padrao' | 'doenca' | 'sistema' | 'alteracao' | 'pergunta'

export interface ResultadoBusca {
  tipo: TipoDeResultado
  id: string
  titulo: string
  /** Linha de apoio: sigla, resumo curto ou descrição da alteração. */
  detalhe?: string
  href: string
  peso: number
}

/**
 * Índice leve — o que atravessa a rede para a busca no cliente.
 *
 * Só nome, sigla, sinônimos e uma linha de resumo. O conteúdo completo (que
 * soma centenas de kilobytes) fica no servidor e só é carregado quando a
 * pessoa abre a ficha.
 */
export interface ItemDoIndice {
  tipo: TipoDeResultado
  id: string
  titulo: string
  detalhe?: string
  termos: string[]
  href: string
}

export function indiceDeMarcadores(marcadores: Marcador[]): ItemDoIndice[] {
  return marcadores.map((m) => ({
    tipo: 'marcador' as const,
    id: m.id,
    titulo: m.nome,
    detalhe: m.sigla ? `${m.sigla} · ${m.resumo}` : m.resumo,
    termos: [m.nome, m.sigla ?? '', ...(m.sinonimos ?? [])].filter(Boolean).map(normalizar),
    href: `/manual-clinico/exames-laboratoriais/marcador/${m.id}`,
  }))
}

export function indiceDeExames(exames: Exame[]): ItemDoIndice[] {
  return exames.map((e) => ({
    tipo: 'exame' as const,
    id: e.id,
    titulo: e.nome,
    detalhe: e.oQueAvalia,
    termos: [e.nome, e.sigla ?? '', ...(e.sinonimos ?? [])].filter(Boolean).map(normalizar),
    href: `/manual-clinico/exames-laboratoriais/exame/${e.id}`,
  }))
}

export function indiceDePadroes(padroes: Padrao[]): ItemDoIndice[] {
  return padroes.map((p) => ({
    tipo: 'padrao' as const,
    id: p.id,
    titulo: p.nome,
    detalhe: p.assinatura,
    termos: [p.nome, p.assinatura].map(normalizar),
    href: `/manual-clinico/exames-laboratoriais/padroes#${p.id}`,
  }))
}

export function indiceDeDoencas(doencas: Doenca[]): ItemDoIndice[] {
  return doencas.map((d) => ({
    tipo: 'doenca' as const,
    id: d.id,
    titulo: d.nome,
    detalhe: d.fisiopatologia.slice(0, 140) + (d.fisiopatologia.length > 140 ? '…' : ''),
    termos: [d.nome, ...(d.sinonimos ?? [])].map(normalizar),
    href: `/manual-clinico/exames-laboratoriais/doenca/${d.id}`,
  }))
}

export function indiceDeSistemas(sistemas: Sistema[]): ItemDoIndice[] {
  return sistemas.map((s) => ({
    tipo: 'sistema' as const,
    id: s.id,
    titulo: s.nome,
    detalhe: s.chamada,
    termos: [s.nome, s.chamada].map(normalizar),
    href: `/manual-clinico/exames-laboratoriais/sistemas#${s.id}`,
  }))
}

export function indiceDeAlteracoes(): ItemDoIndice[] {
  return ALTERACOES.map((a) => ({
    tipo: 'alteracao' as const,
    id: a.id,
    titulo: a.termo.charAt(0).toUpperCase() + a.termo.slice(1),
    detalhe: a.descricao,
    termos: [a.termo, ...(a.sinonimos ?? [])].map(normalizar),
    href: `/manual-clinico/exames-laboratoriais/alteracao/${a.id}`,
  }))
}

export function indiceDePerguntas(): ItemDoIndice[] {
  return PERGUNTAS.map((p, i) => ({
    tipo: 'pergunta' as const,
    id: String(i),
    titulo: p.pergunta,
    detalhe: p.resposta,
    termos: [normalizar(p.pergunta)],
    href:
      p.destino.tipo === 'marcador'
        ? `/manual-clinico/exames-laboratoriais/marcador/${p.destino.id}`
        : p.destino.tipo === 'comparacao'
          ? `/manual-clinico/exames-laboratoriais/comparar#${p.destino.id}`
          : p.destino.tipo === 'padrao'
            ? `/manual-clinico/exames-laboratoriais/padroes#${p.destino.id}`
            : `/manual-clinico/exames-laboratoriais/doenca/${p.destino.id}`,
  }))
}

/**
 * Ordem de prioridade dos tipos quando o peso empata.
 *
 * Perguntas primeiro: quem digitou uma frase inteira quer a explicação, não a
 * lista. Alterações logo em seguida, porque são o vocabulário do laudo.
 */
const PRIORIDADE: Record<TipoDeResultado, number> = {
  pergunta: 6,
  alteracao: 5,
  marcador: 4,
  exame: 3,
  padrao: 2,
  doenca: 2,
  sistema: 1,
}

export function buscar(indice: ItemDoIndice[], consulta: string, limite = 24): ResultadoBusca[] {
  const q = normalizar(consulta)
  if (q.length < 2) return []

  const palavras = q.split(/\s+/).filter((p) => p.length > 2)
  const resultados: ResultadoBusca[] = []

  for (const item of indice) {
    let peso = 0

    for (const termo of item.termos) {
      if (termo === q) { peso = Math.max(peso, 100); continue }
      if (termo.startsWith(q)) { peso = Math.max(peso, 70); continue }
      if (termo.includes(q)) { peso = Math.max(peso, 45); continue }
    }

    // Consulta em forma de frase: conta quantas palavras dela aparecem no item.
    if (peso === 0 && palavras.length > 1) {
      const alvo = `${normalizar(item.titulo)} ${normalizar(item.detalhe ?? '')} ${item.termos.join(' ')}`
      const encontradas = palavras.filter((p) => alvo.includes(p)).length
      if (encontradas > 0) peso = Math.round((encontradas / palavras.length) * 35)
    }

    if (peso > 0) {
      resultados.push({
        tipo: item.tipo,
        id: item.id,
        titulo: item.titulo,
        detalhe: item.detalhe,
        href: item.href,
        peso: peso + PRIORIDADE[item.tipo],
      })
    }
  }

  return resultados.sort((a, b) => b.peso - a.peso || a.titulo.localeCompare(b.titulo, 'pt-BR')).slice(0, limite)
}
