import type { CategoriaCasoRaioX } from './casos-raio-x'

/**
 * A consulta que antecede o filme.
 *
 * O acervo de `casos-raio-x.ts` guarda a alteração pronta: título, sinais,
 * armadilhas e as duas metades do sprite — o filme limpo e o mesmo filme com as
 * marcações. O que faltava era o começo da história. Radiografia de tórax não
 * chega sozinha no negatoscópio: chega depois de alguém contar que está sem ar
 * há três dias, depois de uma ausculta assimétrica e de uma saturação de 88%.
 *
 * Este arquivo escreve esse começo. Cada entrada é uma consulta inteira —
 * identificação, queixa, história da doença atual, antecedentes, sinais vitais,
 * exame físico e a pergunta que motivou o pedido — seguida do achado que a
 * radiografia responde e dos três achados errados que aquele quadro clínico
 * torna plausíveis.
 *
 * ## Por que os distratores são escritos à mão
 *
 * Sortear alternativas entre os outros 71 casos produziria provas fáceis:
 * "hérnia hiatal" ao lado de "pneumotórax hipertensivo" se elimina sem olhar o
 * filme. O que ensina é o erro que a própria história convida a cometer — o
 * hemitórax branco que tanto pode ser derrame quanto colapso, a bolha gigante
 * que parece pneumotórax, a prega cutânea que parece linha pleural. Cada
 * distrator vem com o que o separa do certo *na imagem*, e é esse texto que a
 * resposta comentada devolve.
 *
 * ## Escopo
 *
 * As vinhetas são construídas para ensinar leitura de imagem. Os pacientes são
 * fictícios; a apresentação clínica segue a que a literatura descreve para cada
 * alteração, e nenhuma delas descreve uma pessoa real.
 */

/* ────────────────────────────────── Tipos ────────────────────────────────── */

export interface SinaisVitais {
  pa: string
  fc: string
  fr: string
  satO2: string
  temp?: string
}

/** Alternativa errada que este quadro clínico torna tentadora. */
export interface DistratorClinico {
  /** O achado errado, escrito como o aluno o marcaria. */
  nome: string
  /** O que o separa do certo — no filme, não no livro. */
  porQue: string
}

export interface VinhetaClinica {
  /** Onde a consulta acontece: muda o que é urgente e o que pode esperar. */
  cenario: string
  identificacao: string
  queixa: string
  /** História da doença atual, narrada como o paciente conta. */
  historia: string
  antecedentes: string[]
  vitais: SinaisVitais
  /** Achados do exame físico, na ordem em que são procurados. */
  exame: string[]
  /** A pergunta clínica que fez alguém pedir a radiografia. */
  pedido: string
  /** O que se pergunta ao aluno depois que o filme sobe no negatoscópio. */
  pergunta: string
  /**
   * A resposta certa, escrita como item de diagnóstico diferencial.
   *
   * Curta e paralela aos distratores de propósito. A primeira versão deste
   * banco trazia aqui o achado *explicado* — "Cardiomegalia — índice
   * cardiotorácico acima de 50%" — enquanto os distratores eram rótulos secos
   * de três palavras. O resultado, medido: a alternativa certa era a mais longa
   * nas 72 questões e a única com travessão em 64 delas. Dava para gabaritar o
   * banco inteiro sem olhar uma única radiografia.
   *
   * A explicação não sumiu: ela mora em `veredito`, que só aparece **depois**
   * da resposta, e em `correlacao`. O que o aluno lê antes de decidir são
   * quatro rótulos indistinguíveis pela forma.
   */
  achado: string
  /**
   * O achado por extenso, para o cabeçalho da resposta comentada.
   *
   * É o que `achado` era antes de encurtar. Ausente, vale o próprio `achado`.
   */
  veredito?: string
  /** Como a história e o filme se encaixam — abre a resposta comentada. */
  correlacao: string
  distratores: DistratorClinico[]
  /**
   * Qual imagem do caso é o filme da questão (1-based).
   *
   * Casos com série temporal ou com três graus da mesma alteração têm mais de
   * um filme; a vinheta escolhe o que corresponde à história que ela conta.
   * Ausente, vale a primeira imagem.
   */
  imagem?: number
}

const d = (nome: string, porQue: string): DistratorClinico => ({ nome, porQue })

// ══════════════════════════════════ Cardiovascular ══════════════════════════════════

const CARDIOVASCULAR: Record<string, VinhetaClinica> = {
  cardiomegalia: {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Mulher de 67 anos, costureira aposentada, mora com a filha.',
    queixa: 'Falta de ar aos esforços há cerca de oito meses, pior no último mês.',
    historia:
      'Conta que antes subia o lance de escada de casa sem parar e hoje precisa descansar no meio. Nos últimos trinta dias passou a acordar de madrugada com sensação de sufocamento, que melhora quando senta na beira da cama, e trocou o travesseiro por dois. Nega dor torácica, febre ou tosse produtiva. Refere que os pés incham no fim do dia e desincham durante a noite.',
    antecedentes: [
      'Hipertensão arterial há 20 anos, em uso irregular de losartana',
      'Diabetes tipo 2 há 9 anos, em metformina',
      'Nunca fumou; sem etilismo',
      'Duas gestações, sem intercorrências',
    ],
    vitais: { pa: '158 × 94 mmHg', fc: '92 bpm', fr: '20 irpm', satO2: '95% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Ictus cordis palpável no 6º espaço intercostal, desviado para fora da linha hemiclavicular',
      'Ritmo cardíaco regular em 2 tempos, com terceira bulha audível em foco mitral',
      'Murmúrio vesicular presente, com estertores finos nas bases',
      'Edema depressível +/4+ em ambos os tornozelos',
    ],
    pedido:
      'Dispneia progressiva com ortopneia e dispneia paroxística noturna: a pergunta é se há aumento da silhueta cardíaca e sinais de congestão que sustentem insuficiência cardíaca.',
    pergunta: 'Radiografia de tórax em PA, ortostática e com boa inspiração. Qual é o achado que responde à pergunta clínica?',
    achado: 'Cardiomegalia',
    veredito: 'Cardiomegalia — índice cardiotorácico acima de 50%',
    correlacao:
      'A história é de insuficiência cardíaca esquerda: ortopneia, dispneia paroxística noturna e terceira bulha. O ictus deslocado para fora da linha hemiclavicular já anuncia, ao dedo, o que o filme confirma ao olho — a silhueta cardíaca ocupa mais da metade da largura interna do tórax.',
    distratores: [
      d(
        'Derrame pericárdico',
        'Também alarga a silhueta, mas o contorno fica globoso e uniforme, sem que se distingam os segmentos — botão aórtico, tronco da pulmonar e ventrículo esquerdo deixam de ser individualizáveis. Aqui os segmentos continuam reconhecíveis, e a radiografia não distingue os dois com segurança: quem decide é o ecocardiograma.',
      ),
      d(
        'Efeito da projeção AP',
        'É a armadilha técnica desta medida: em AP o coração fica mais longe do filme e a silhueta cresce por geometria, sem doença. Esta radiografia é PA, ortostática e com inspiração adequada — condições em que o índice cardiotorácico pode ser calculado.',
      ),
      d(
        'Inspiração incompleta',
        'Inspiração incompleta horizontaliza o diafragma, comprime o coração contra ele e alarga a base — mas então se contam menos de seis arcos costais anteriores acima da cúpula. A contagem aqui é adequada, e o alargamento não se explica pela técnica.',
      ),
    ],
  },

  'redistribuicao-vascular': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 74 anos, ex-motorista de ônibus.',
    queixa: 'Piora da falta de ar há três dias, agora em repouso.',
    historia:
      'Já convivia com cansaço aos médios esforços, mas há três dias precisa dormir sentado na poltrona. Refere que ganhou 4 kg em duas semanas sem mudar a alimentação e que as pernas estão "duras". Parou de tomar o diurético por conta própria porque "estava indo muito ao banheiro à noite". Nega febre, dor torácica ou expectoração purulenta.',
    antecedentes: [
      'Insuficiência cardíaca com fração de ejeção reduzida, em acompanhamento',
      'Infarto agudo do miocárdio há 6 anos, com angioplastia',
      'Ex-tabagista, 30 anos-maço, parou há 6 anos',
      'Furosemida suspensa por conta própria há 3 semanas',
    ],
    vitais: { pa: '146 × 88 mmHg', fc: '104 bpm', fr: '26 irpm', satO2: '91% em ar ambiente', temp: '36,1 °C' },
    exame: [
      'Turgência jugular a 45° visível até o ângulo da mandíbula',
      'Estertores crepitantes até o terço médio de ambos os hemitórax',
      'Ritmo cardíaco regular, com terceira bulha',
      'Edema de membros inferiores ++/4+ até os joelhos',
    ],
    pedido:
      'Descompensação de insuficiência cardíaca após suspensão do diurético: a pergunta é qual o grau de congestão pulmonar no momento.',
    pergunta: 'A radiografia mostra o grau de congestão. Qual é o achado vascular que abre essa sequência?',
    achado: 'Redistribuição vascular para os ápices',
    veredito: 'Redistribuição do fluxo para os ápices — vasos dos campos superiores tão ou mais calibrosos que os basais',
    correlacao:
      'A suspensão do diurético elevou a pressão de enchimento do ventrículo esquerdo, e a pressão venosa pulmonar subiu atrás dela. Antes de encharcar alvéolo, esse aumento inverte a distribuição do fluxo: as bases, onde o edema perivascular e a vasoconstrição hipóxica aumentam a resistência, cedem fluxo para os ápices. É o primeiro degrau radiográfico da congestão — e o que a turgência jugular já sugeria.',
    distratores: [
      d(
        'Enfisema de predomínio apical',
        'Também torna os ápices diferentes das bases, mas no sentido oposto: no enfisema os vasos apicais ficam rarefeitos e atenuados, com hipertransparência. Aqui os vasos superiores estão mais grossos, não mais finos.',
      ),
      d(
        'Nódulos pulmonares nos ápices',
        'Vasos vistos de topo podem simular nódulos, mas se resolvem quando seguidos em continuidade até o hilo — o que é possível fazer neste filme. Nódulo verdadeiro tem contorno próprio e não se prolonga em ramo vascular.',
      ),
      d(
        'Distribuição normal alterada pelo decúbito',
        'Correta como princípio: deitado, a gravidade deixa de separar ápices de bases e a redistribuição não pode ser afirmada. Mas este exame foi feito em ortostatismo, condição em que a comparação é válida — e o achado, portanto, é real.',
      ),
    ],
  },

  'edema-intersticial': {
    cenario: 'Pronto-socorro',
    identificacao: 'Mulher de 71 anos, dona de casa.',
    queixa: 'Cansaço e tosse seca há dois dias.',
    historia:
      'Refere cansaço que começou aos esforços e hoje aparece ao caminhar dentro de casa, acompanhado de tosse seca e irritativa, sem catarro. Dormiu mal, com sensação de peso no peito ao deitar. Fez uso recente de anti-inflamatório para dor no joelho. Nega febre, calafrios ou dor pleurítica.',
    antecedentes: [
      'Hipertensão arterial de longa data',
      'Fibrilação atrial permanente, anticoagulada',
      'Doença renal crônica estágio 3',
      'Uso de diclofenaco por conta própria na última semana',
    ],
    vitais: { pa: '162 × 96 mmHg', fc: '88 bpm irregular', fr: '24 irpm', satO2: '93% em ar ambiente', temp: '36,5 °C' },
    exame: [
      'Ritmo cardíaco irregular, sem sopros audíveis',
      'Estertores finos, "em velcro", nas bases, sem roncos ou sibilos',
      'Sem sinais de consolidação à percussão',
      'Edema discreto de tornozelos',
    ],
    pedido:
      'Dispneia subaguda com anti-inflamatório recente em portadora de cardiopatia e doença renal: a pergunta é se há congestão pulmonar antes de encharcamento alveolar.',
    pergunta: 'Sem consolidação e sem broncograma aéreo, que achado periférico responde à suspeita de congestão?',
    achado: 'Linhas B de Kerley',
    veredito: 'Linhas B de Kerley — septos interlobulares espessados por edema intersticial',
    correlacao:
      'O anti-inflamatório reteve sódio e água em quem já tinha cardiopatia e rim limitado. A pressão venosa pulmonar subiu o suficiente para extravasar líquido para o interstício, mas ainda não para o alvéolo — por isso o exame físico tem estertores finos sem broncofonia e a radiografia tem linha, não mancha. O septo interlobular espessado é exatamente essa linha.',
    distratores: [
      d(
        'Atelectasias laminares',
        'Também produzem linhas basais, mas costumam ser mais longas, mais grosseiras e acompanham perda de volume, com elevação diafragmática ou aproximação de costelas. As linhas septais são curtas, finas e tocam a pleura perpendicularmente.',
      ),
      d(
        'Fibrose de padrão reticular',
        'O retículo fibrótico é periférico e basal como aqui, mas persistente e associado a faveolamento e perda de volume ao longo do tempo. Linha septal de origem congestiva é reversível: some quando o paciente é depletado, o que a fibrose não faz.',
      ),
      d(
        'Linfangite carcinomatosa',
        'Bloqueio linfático por tumor produz linhas septais indistinguíveis destas — é o diferencial legítimo do achado. O que decide não é a imagem, mas o contexto: aqui há cardiopatia, anti-inflamatório recente e sobrecarga hídrica, não neoplasia conhecida.',
      ),
    ],
  },

  'edema-alveolar': {
    cenario: 'Sala de emergência',
    identificacao: 'Homem de 66 anos, pedreiro.',
    queixa: 'Falta de ar súbita e intensa iniciada há duas horas.',
    historia:
      'Acordou de madrugada com sensação de afogamento, não conseguiu deitar de novo e veio ao serviço sentado no carro. Tosse com expectoração rósea e espumosa. Refere dor no peito em aperto há cerca de três horas, antes de a falta de ar começar. Muito agitado e sudoreico à admissão.',
    antecedentes: [
      'Hipertensão arterial sem tratamento regular',
      'Tabagista, 40 anos-maço',
      'Dislipidemia sem tratamento',
      'Nunca investigou dor torácica prévia',
    ],
    vitais: { pa: '190 × 112 mmHg', fc: '128 bpm', fr: '34 irpm', satO2: '84% em ar ambiente', temp: '36,0 °C' },
    exame: [
      'Sudorese fria, extremidades pálidas, uso de musculatura acessória',
      'Estertores crepitantes difusos até os ápices, bilaterais',
      'Taquicardia, terceira bulha, sem sopros novos',
      'Expectoração rósea espumosa durante o atendimento',
    ],
    pedido:
      'Edema agudo de pulmão clínico com dor torácica prévia: a radiografia é feita à beira do leito para confirmar a extensão do encharcamento e afastar outra causa de insuficiência respiratória.',
    pergunta: 'Radiografia portátil, em AP. Qual padrão o filme mostra?',
    achado: 'Edema pulmonar alveolar',
    veredito: 'Edema pulmonar alveolar — opacidades perihilares bilaterais em "asa de borboleta"',
    correlacao:
      'A pressão hidrostática ultrapassou o que o interstício e os linfáticos conseguiam drenar, e o líquido passou a preencher alvéolos. Preenchimento alveolar dá consolidação, não linha: por isso o exame físico saiu de estertores finos para crepitação difusa até os ápices, e a expectoração ficou rósea e espumosa. A distribuição central, poupando a periferia, desenha a asa de borboleta.',
    distratores: [
      d(
        'Pneumonia bilateral extensa',
        'Consolidação infecciosa bilateral pode ter aparência muito parecida — a imagem sozinha não separa as duas. O que pesa aqui é o conjunto: instalação em duas horas, hipertensão grave, dor torácica prévia, expectoração rósea e ausência de febre. Infecção difusa não se instala em duas horas.',
      ),
      d(
        'Síndrome do desconforto respiratório agudo',
        'Também é preenchimento alveolar difuso, mas costuma ser mais periférico, poupar menos a periferia e ocorrer num contexto de sepse, aspiração, trauma ou pancreatite — que não existe nesta história. O padrão central perihilar com cardiomegalia favorece a origem cardiogênica.',
      ),
      d(
        'Hemorragia alveolar difusa',
        'Preenche alvéolo do mesmo jeito e também cursa com hipoxemia grave, mas a expectoração é francamente hemoptoica, não rósea espumosa, e o contexto costuma ser de vasculite, anticoagulação ou doença autoimune, com queda de hemoglobina.',
      ),
    ],
    imagem: 3,
  },

  'derrame-pleural': {
    cenario: 'Enfermaria de clínica médica',
    identificacao: 'Mulher de 79 anos, internada há dois dias.',
    queixa: 'Dispneia persistente apesar do tratamento iniciado.',
    historia:
      'Internou por descompensação de insuficiência cardíaca e vem em uso de diurético endovenoso. Melhorou do edema de membros inferiores, mas mantém desconforto respiratório ao deitar do lado direito. Sem febre, sem dor pleurítica e sem tosse produtiva desde a admissão.',
    antecedentes: [
      'Insuficiência cardíaca de longa data, com internações prévias',
      'Valvopatia mitral conhecida',
      'Hipotireoidismo em reposição',
      'Sem história de neoplasia ou tuberculose',
    ],
    vitais: { pa: '118 × 70 mmHg', fc: '86 bpm', fr: '22 irpm', satO2: '92% em ar ambiente', temp: '36,2 °C' },
    exame: [
      'Murmúrio vesicular abolido no terço inferior de ambos os hemitórax, mais à direita',
      'Percussão maciça nas bases, com submacicez móvel',
      'Frêmito toracovocal reduzido nas mesmas regiões',
      'Edema de membros inferiores em regressão',
    ],
    pedido:
      'Melhora do edema periférico sem melhora respiratória proporcional: a pergunta é se há coleção pleural residual sustentando a dispneia.',
    pergunta: 'Que achado explica o murmúrio abolido e a macicez nas bases?',
    achado: 'Derrames pleurais bilaterais',
    veredito: 'Derrames pleurais bilaterais — velamento dos seios costofrênicos com sinal do menisco',
    correlacao:
      'O mesmo aumento de pressão que congestionou o pulmão empurra líquido para o espaço pleural, e ele se acumula onde a gravidade manda: nos recessos costofrênicos. A tríade do exame — murmúrio abolido, percussão maciça e frêmito reduzido — é a assinatura de líquido entre o pulmão e a parede, e o menisco no filme é a mesma coisa vista de outro ângulo.',
    distratores: [
      d(
        'Consolidação pneumônica das bases',
        'Consolidação também apaga a base, mas mantém broncogramas aéreos e não forma menisco: a borda superior é irregular e não sobe pela parede lateral. Ao exame, daria frêmito aumentado e broncofonia, o oposto do que se palpa aqui.',
      ),
      d(
        'Elevação de ambos os hemidiafragmas',
        'Diafragma elevado também reduz o volume aerado das bases, mas mantém o seio costofrênico agudo e nítido, e a linha superior da opacidade é a própria cúpula, convexa para cima. O menisco tem concavidade superior — curvatura oposta.',
      ),
      d(
        'Atelectasia de compressão sem líquido',
        'Existe atelectasia associada, e ela é consequência: o líquido comprime o parênquima vizinho. Mas atelectasia isolada puxa estruturas para o lado doente, e aqui não há desvio mediastinal ipsilateral — o que domina o quadro é a coleção, não a perda de volume.',
      ),
    ],
  },

  'derrame-pericardico': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 58 anos, comerciante.',
    queixa: 'Cansaço progressivo e desconforto no peito há duas semanas.',
    historia:
      'Descreve peso retroesternal que melhora quando se inclina para a frente e piora ao deitar. Vem perdendo fôlego para tarefas simples e sente o coração "abafado". Teve quadro gripal há um mês. Nega dor em aperto irradiada, nega ortopneia franca e nega edema de membros inferiores.',
    antecedentes: [
      'Sem doença cardiovascular conhecida',
      'Sem cirurgia cardíaca prévia',
      'Não tabagista',
      'Quadro viral de vias aéreas superiores há um mês',
    ],
    vitais: { pa: '104 × 74 mmHg', fc: '112 bpm', fr: '22 irpm', satO2: '96% em ar ambiente', temp: '37,1 °C' },
    exame: [
      'Bulhas cardíacas hipofonéticas',
      'Turgência jugular presente com pulmões limpos à ausculta',
      'Pulso com redução da amplitude na inspiração',
      'Sem estertores, sem edema periférico significativo',
    ],
    pedido:
      'Bulhas abafadas, turgência jugular e pulmão limpo: a pergunta é se a silhueta cardíaca está alargada de forma compatível com coleção pericárdica.',
    pergunta: 'A dissociação entre coração grande e pulmão limpo aponta para qual achado?',
    achado: 'Derrame pericárdico',
    veredito: 'Derrame pericárdico — silhueta cardíaca globosa, aumentada de forma uniforme',
    correlacao:
      'Congestão sistêmica com pulmão limpo é a pista central: na falência ventricular esquerda o pulmão encharca antes das jugulares estufarem, e aqui a sequência está invertida. Líquido no saco pericárdico comprime as câmaras de fora para dentro, aumenta a pressão de enchimento sem encharcar o pulmão e desenha uma silhueta que cresce para todos os lados de uma vez — globosa, com perda dos ângulos entre os segmentos.',
    distratores: [
      d(
        'Cardiomiopatia dilatada',
        'Produz silhueta grande e pode ficar globosa, e a radiografia não separa as duas com segurança — por isso o ecocardiograma é obrigatório. O que inclina para coleção aqui é a clínica: bulhas hipofonéticas, pulso paradoxal e pulmão limpo apesar da congestão sistêmica.',
      ),
      d(
        'Massa mediastinal anterior',
        'Também alarga o mediastino inferior, mas costuma ser assimétrica e apagar seletivamente contornos vizinhos, preservando outras linhas mediastinais. O aumento aqui é concêntrico e mantém a simetria em torno da linha média.',
      ),
      d(
        'Cardiomegalia com congestão',
        'Congestão é justamente o que falta: não há redistribuição vascular, linhas septais nem derrame pleural. Coração grande com pulmão limpo é a combinação que separa a coleção pericárdica da falência ventricular esquerda descompensada.',
      ),
    ],
  },

  'calcificacoes-cardiacas': {
    cenario: 'Ambulatório de cardiologia',
    identificacao: 'Homem de 69 anos, aposentado.',
    queixa: 'Consulta de rotina, com queixa de cansaço aos médios esforços.',
    historia:
      'Refere que o fôlego encurtou desde o infarto, mas nega piora recente, dor torácica ou palpitações. Faz caminhadas curtas e para por cansaço, não por dor. Traz exames de rotina e uma radiografia solicitada na consulta anterior.',
    antecedentes: [
      'Infarto agudo do miocárdio de parede anterior extensa há 8 anos',
      'Hipertensão arterial e dislipidemia em tratamento',
      'Ex-tabagista, parou após o infarto',
      'Ecocardiograma antigo com acinesia apical',
    ],
    vitais: { pa: '132 × 80 mmHg', fc: '68 bpm', fr: '16 irpm', satO2: '97% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Ictus difuso, palpável em área ampla na região apical',
      'Bulhas normofonéticas, sem sopros',
      'Pulmões limpos à ausculta',
      'Sem edema, sem turgência jugular',
    ],
    pedido:
      'Sequela de infarto anterior extenso com ictus difuso: a pergunta é se há alteração estrutural do contorno cardíaco visível na radiografia.',
    pergunta: 'Que achado do contorno cardíaco esquerdo o filme demonstra?',
    achado: 'Aneurisma ventricular calcificado',
    veredito: 'Calcificação curvilínea em "casca de ovo" na borda esquerda — aneurisma ventricular pós-infarto',
    correlacao:
      'Infarto anterior extenso destrói miocárdio e deixa uma parede fina que se abaúla a cada sístole; com anos, esse tecido cicatricial calcifica. O ictus difuso e amplo que se palpa é a mesma parede discinética que o filme mostra como linha calcificada acompanhando a borda ventricular esquerda.',
    distratores: [
      d(
        'Calcificação pericárdica',
        'É o diferencial direto, e a distinção é topográfica: a calcificação pericárdica acompanha todo o contorno cardíaco, inclusive as câmaras direitas e o sulco atrioventricular, enquanto esta é localizada na borda esquerda, no território do infarto. A pericárdica associa-se a constrição, com congestão sistêmica que aqui não existe.',
      ),
      d(
        'Calcificação do anel mitral',
        'Fica na topografia valvar, mais central e inferior na silhueta, com formato de C ou vírgula, e é achado comum e banal em idosos. Não desenha a curva longa que acompanha a borda livre do ventrículo.',
      ),
      d(
        'Calcificação da aorta ascendente',
        'Ocupa o contorno superior direito e o botão aórtico, não a borda cardíaca esquerda inferior. É marcador de aterosclerose e não tem relação com a sequela de infarto que a história descreve.',
      ),
    ],
  },

  'cardiopatias-congenitas': {
    cenario: 'Ambulatório de cardiologia',
    identificacao: 'Mulher de 34 anos, professora.',
    queixa: 'Cansaço aos esforços e palpitações há cerca de um ano.',
    historia:
      'Sempre foi considerada "cansada para esporte", mas nos últimos meses passou a se cansar subindo um lance de escada e sente o coração acelerar sem motivo. Nunca teve cianose, nunca foi internada por causa cardíaca. Um médico já comentou que ela tinha "um sopro que não era importante".',
    antecedentes: [
      'Sopro cardíaco detectado na infância, sem investigação',
      'Duas gestações, com cansaço acentuado no terceiro trimestre',
      'Sem hipertensão, sem tabagismo',
      'Sem uso de medicações contínuas',
    ],
    vitais: { pa: '112 × 68 mmHg', fc: '88 bpm', fr: '18 irpm', satO2: '97% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Sopro sistólico suave em foco pulmonar, com desdobramento fixo da segunda bulha',
      'Impulsão de ventrículo direito palpável em borda esternal esquerda',
      'Pulmões limpos, sem estertores',
      'Sem cianose, sem baqueteamento digital',
    ],
    pedido:
      'Desdobramento fixo da segunda bulha em adulta jovem com cansaço progressivo: a pergunta é se há sinais de hiperfluxo pulmonar.',
    pergunta: 'Comparando artéria pulmonar e botão aórtico, que achado o filme mostra?',
    achado: 'Hiperfluxo por shunt esquerda-direita',
    veredito: 'Aumento do fluxo pulmonar por shunt esquerda-direita — artéria pulmonar desproporcionalmente grande em relação ao botão aórtico',
    correlacao:
      'O desdobramento fixo da segunda bulha é o sinal semiológico de uma comunicação interatrial: o volume que passa do átrio esquerdo para o direito atravessa a valva pulmonar em excesso, atrasando seu fechamento de forma constante. Esse volume extra dilata o tronco da pulmonar e enche demais a vasculatura pulmonar — e no filme a pulmonar fica grande enquanto o botão aórtico, que recebe menos volume, fica pequeno.',
    distratores: [
      d(
        'Hipertensão pulmonar sem shunt',
        'Também dilata o tronco da pulmonar, mas o padrão distal é oposto: os vasos periféricos afilam abruptamente e a periferia fica pobre. Aqui a vascularização periférica acompanha o aumento central, o que caracteriza hiperfluxo, não obstrução.',
      ),
      d(
        'Massa mediastinal média à esquerda',
        'Uma massa junto ao hilo esquerdo pode simular tronco da pulmonar aumentado, mas não se prolonga em ramos vasculares que possam ser seguidos até a periferia. O contorno aqui continua em vasos, e não termina numa borda própria.',
      ),
      d(
        'Dilatação pós-estenótica da aorta',
        'É o achado da valva aórtica bicúspide, e aumenta justamente o contorno oposto: a aorta ascendente à direita. Aqui a desproporção é a favor da pulmonar, com botão aórtico pequeno.',
      ),
    ],
  },

  marcapassos: {
    cenario: 'Sala de recuperação pós-procedimento',
    identificacao: 'Homem de 77 anos, aposentado.',
    queixa: 'Dor no ombro esquerdo e desconforto respiratório iniciados após o implante.',
    historia:
      'Submetido há duas horas a implante de marcapasso definitivo por bloqueio atrioventricular total com síncopes de repetição. O procedimento exigiu mais de uma punção da veia subclávia esquerda. Na primeira hora após o retorno ao leito começou a referir dor pontual no ombro e sensação de falta de ar, com desconforto ao inspirar fundo.',
    antecedentes: [
      'Bloqueio atrioventricular total com síncopes',
      'Hipertensão arterial em tratamento',
      'Implante de marcapasso definitivo há 2 horas, por punção subclávia esquerda',
      'Sem doença pulmonar prévia conhecida',
    ],
    vitais: { pa: '128 × 76 mmHg', fc: '72 bpm (ritmo de marcapasso)', fr: '24 irpm', satO2: '93% em ar ambiente', temp: '36,2 °C' },
    exame: [
      'Curativo limpo em região infraclavicular esquerda, sem hematoma expansivo',
      'Murmúrio vesicular reduzido no ápice esquerdo',
      'Percussão com hipertimpanismo no mesmo campo',
      'Sem desvio traqueal palpável, sem instabilidade hemodinâmica',
    ],
    pedido:
      'Radiografia de controle pós-implante: confirmar posição dos eletrodos e — diante da dor e da dessaturação — procurar complicação da punção.',
    pergunta: 'Além de conferir os eletrodos, qual complicação o filme demonstra?',
    achado: 'Pneumotórax após o implante',
    veredito: 'Pneumotórax após inserção do marcapasso — complicação da punção subclávia',
    correlacao:
      'A punção subclávia passa rente à cúpula pleural, e mais de uma tentativa multiplica o risco de atravessá-la. O murmúrio reduzido com hipertimpanismo no ápice esquerdo é ar no espaço pleural, e a radiografia de controle — feita justamente para isso — mostra a linha pleural que confirma. Sem desvio mediastinal nem instabilidade, não há tensão: é pneumotórax simples, e o controle radiográfico existe para achá-lo antes que cresça.',
    distratores: [
      d(
        'Fratura do eletrodo de marcapasso',
        'A fratura explica falha de comando ou de sensibilidade do dispositivo, não dor pleurítica com hipertimpanismo. Além disso, o marcapasso está capturando — o ritmo é de marcapasso a 72 bpm —, o que torna descontinuidade elétrica improvável duas horas após o implante.',
      ),
      d(
        'Eletrodo mal posicionado no seio coronário',
        'É um achado de trajeto, visível no filme, mas não causa hipoxemia nem hipertimpanismo à percussão. Mau posicionamento se manifesta como falha de captura ou estimulação diafragmática, não como quadro pleural agudo.',
      ),
      d(
        'Hematoma da loja do gerador',
        'É a complicação local mais comum e deve ser procurada, mas se manifesta como abaulamento e equimose no sítio, com curativo tenso — e o curativo aqui está limpo e sem hematoma expansivo. Também não explicaria a alteração da ausculta no ápice.',
      ),
    ],
    imagem: 2,
  },

  'artefatos-cirurgia-cardiaca': {
    cenario: 'Ambulatório de pós-operatório',
    identificacao: 'Homem de 64 anos, torneiro mecânico aposentado.',
    queixa: 'Retorno de rotina, referindo cansaço que voltou a piorar.',
    historia:
      'Operado há quatro anos, ficou bem por três anos e há alguns meses voltou a se cansar, agora com edema de pernas no fim do dia e necessidade de travesseiro alto. Não sabe informar quais enxertos foram feitos e não trouxe o resumo da cirurgia. Nega dor torácica anginosa e nega febre.',
    antecedentes: [
      'Revascularização miocárdica há 4 anos, por esternotomia',
      'Hipertensão arterial e diabetes tipo 2',
      'Ex-tabagista pesado',
      'Sem relatório cirúrgico disponível na consulta',
    ],
    vitais: { pa: '140 × 86 mmHg', fc: '94 bpm', fr: '20 irpm', satO2: '94% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Cicatriz mediana de esternotomia bem consolidada',
      'Terceira bulha audível, ritmo regular',
      'Estertores finos em bases',
      'Edema de membros inferiores +/4+',
    ],
    pedido:
      'Paciente operado do coração sem documentação, com sinais de congestão: a radiografia serve para reconhecer o material implantado e, principalmente, para não parar nele.',
    pergunta: 'Que material a radiografia identifica — e o que a leitura não pode deixar de procurar depois dele?',
    achado: 'Material de revascularização com congestão',
    veredito: 'Artefatos de cirurgia cardíaca — fios de esternotomia e clipes de enxerto, com congestão pulmonar associada',
    correlacao:
      'Os fios medianos e os clipes ao longo do trajeto das artérias mamárias internas contam a história cirúrgica que o paciente não sabe relatar: houve esternotomia e houve revascularização. Mas reconhecer o material é o começo da leitura, não o fim — a terceira bulha e os estertores pedem que se continue olhando, e é aí que aparecem a cardiomegalia, a redistribuição vascular e as linhas septais que explicam a piora.',
    distratores: [
      d(
        'Apenas fios de esternotomia',
        'Fio de esternotomia diz que o esterno foi aberto, e nada além disso: vale para troca valvar, revascularização ou correção congênita. Os clipes metálicos alinhados fora da linha média acrescentam a informação que faltava — houve dissecção de mamária interna para enxerto.',
      ),
      d(
        'Prótese valvar metálica em posição mitral',
        'Prótese valvar tem anel denso e compacto, com forma reconhecível, projetado na topografia da valva. Clipes de enxerto são pequenos, múltiplos e distribuídos ao longo de um trajeto vascular — não formam anel.',
      ),
      d(
        'Material cirúrgico sem outras alterações',
        'É a armadilha central deste caso, e tem nome: satisfação de busca. Encontrar o material esperado encerra a leitura antes da hora, e o que muda a conduta hoje não é o clipe de quatro anos atrás, mas a congestão nova.',
      ),
    ],
    imagem: 3,
  },

  'outros-artefatos-cardiacos': {
    cenario: 'Unidade de terapia intensiva',
    identificacao: 'Mulher de 70 anos, no terceiro dia de internação.',
    queixa: 'Radiografia diária de controle em paciente sob ventilação mecânica.',
    historia:
      'Internada por choque séptico de foco abdominal, mantém-se sedada, em ventilação mecânica e em uso de droga vasoativa. Nas últimas 24 horas houve troca de acesso venoso central e instalação de fio de estimulação temporária por bradicardia. A equipe pede a radiografia diária para conferir dispositivos.',
    antecedentes: [
      'Choque séptico de foco abdominal, pós-operatória',
      'Ventilação mecânica invasiva desde a admissão',
      'Múltiplos dispositivos instalados nas últimas 48 horas',
      'Bradicardia com necessidade de estimulação temporária',
    ],
    vitais: { pa: '96 × 58 mmHg (em noradrenalina)', fc: '64 bpm', fr: '18 irpm (ventilador)', satO2: '95% sob ventilação', temp: '37,8 °C' },
    exame: [
      'Sedada, sem resposta a comando verbal',
      'Múltiplos dispositivos: tubo orotraqueal, acesso central, sonda enteral, eletrodos de monitorização',
      'Murmúrio vesicular presente bilateralmente',
      'Abdome com curativo cirúrgico limpo',
    ],
    pedido:
      'Controle diário de dispositivos em paciente crítica: identificar cada objeto projetado sobre o tórax e distinguir o que está dentro do que está fora do paciente.',
    pergunta: 'Diante de tantos objetos sobrepostos, qual é a leitura correta do filme?',
    achado: 'Artefatos externos sobre o tórax',
    veredito: 'Múltiplos artefatos médicos, incluindo objetos externos e fio de estimulação temporária — nenhum simulando doença pulmonar',
    correlacao:
      'Na terapia intensiva, o tórax é atravessado por camadas: o que está dentro do paciente, o que está sobre a pele e o que está apenas sobre o colchão. Botões de eletrodo de monitorização são redondos, muito densos, de contorno perfeitamente nítido e se repetem em posições simétricas — características que nenhum nódulo pulmonar tem. Reconhecê-los como externos evita a investigação de uma lesão que não existe; e seguir cada fio de ponta a ponta é o que garante que o de estimulação temporária está onde deveria.',
    distratores: [
      d(
        'Nódulos pulmonares múltiplos',
        'É exatamente o erro que o caso previne. Nódulo verdadeiro tem densidade de partes moles, bordas que se fundem ao parênquima e não respeita a geometria de um monitor. Estes objetos têm densidade metálica, contorno perfeitamente circular e distribuição regular sobre a parede.',
      ),
      d(
        'Calcificações pulmonares residuais',
        'Calcificação de granuloma é densa, mas irregular, pequena e disposta ao acaso no parênquima, frequentemente com outras cicatrizes. Não tem o contorno geométrico nem a simetria de posição que estes artefatos apresentam.',
      ),
      d(
        'Corpos estranhos aspirados na via aérea',
        'Corpo estranho intrabrônquico segue o trajeto da árvore brônquica e costuma vir com aprisionamento aéreo ou atelectasia distal — nada disso aparece aqui, e os objetos não estão sobre a topografia dos brônquios.',
      ),
    ],
    imagem: 3,
  },
}

// ══════════════════════════════════ Variantes ══════════════════════════════════

const VARIANTES: Record<string, VinhetaClinica> = {
  dextrocardia: {
    cenario: 'Admissão em pronto-socorro',
    identificacao: 'Homem de 41 anos, motoboy, vítima de queda de moto.',
    queixa: 'Dor torácica à esquerda após trauma há uma hora.',
    historia:
      'Caiu da moto em baixa velocidade, com impacto do hemitórax esquerdo no meio-fio. Chegou consciente, orientado, queixando dor localizada que piora à inspiração profunda. Nega perda de consciência, nega dispneia importante. Nunca fez radiografia de tórax antes.',
    antecedentes: [
      'Hígido, sem doenças crônicas',
      'Refere infecções respiratórias e sinusites de repetição desde a infância',
      'Sem cirurgias prévias',
      'Não tabagista',
    ],
    vitais: { pa: '126 × 78 mmHg', fc: '92 bpm', fr: '20 irpm', satO2: '97% em ar ambiente', temp: '36,5 °C' },
    exame: [
      'Dor à palpação do gradil costal esquerdo, sem crepitação',
      'Ictus cordis palpável à direita do esterno',
      'Bulhas mais audíveis em hemitórax direito',
      'Murmúrio vesicular presente e simétrico',
    ],
    pedido:
      'Trauma torácico fechado: procurar fratura de arcos costais, pneumotórax e hemotórax. O marcador de lateralidade foi conferido na sala.',
    pergunta: 'O coração aparece à direita. Com marcador de lateralidade conferido e ictus palpável à direita, qual é a leitura?',
    achado: 'Dextrocardia com situs inversus',
    veredito: 'Dextrocardia com situs inversus — coração e bolha gástrica à direita, confirmados pelo exame físico',
    correlacao:
      'Aqui a radiografia não é o único dado: o ictus foi palpado à direita antes do filme subir. Essa convergência entre exame físico e imagem é o que transforma uma imagem estranha em diagnóstico. A bolha gástrica acompanhando o coração para a direita confirma inversão visceral completa, e a história de infecções respiratórias de repetição levanta a possibilidade de síndrome de Kartagener.',
    distratores: [
      d(
        'Imagem invertida por erro de rotulagem',
        'É o diferencial mais importante e, na prática, mais frequente que a própria dextrocardia — uma radiografia espelhada produz imagem idêntica. O que resolve é o que foi feito aqui: conferir o marcador de lateralidade e palpar o ictus. Nenhum erro de arquivo desloca um ictus.',
      ),
      d(
        'Desvio mediastinal por colapso pulmonar',
        'Deslocamento adquirido puxa o coração, mas não leva a bolha gástrica junto, e vem acompanhado de perda de volume: hemitórax menor, costelas aproximadas e hemidiafragma elevado. Nada disso existe neste filme.',
      ),
      d(
        'Pneumotórax hipertensivo à esquerda',
        'Empurraria o coração para a direita, sim — mas com hipertransparência à esquerda, ausência de trama vascular além da linha pleural e um paciente em franca instabilidade. O exame está estável e o murmúrio é simétrico.',
      ),
    ],
  },

  'arco-aortico-direito': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Mulher de 29 anos, auxiliar administrativa.',
    queixa: 'Tosse seca persistente há dois meses e sensação de engasgo com alimentos sólidos.',
    historia:
      'A tosse é seca, sem relação com esforço e sem sibilância. Nas últimas semanas passou a sentir que o alimento sólido "para" atrás do esterno e precisa beber água para descer. Já usou antialérgico e inibidor de bomba de prótons sem melhora. Nega febre, perda de peso ou sudorese noturna.',
    antecedentes: [
      'Sem doenças crônicas conhecidas',
      'Sem tabagismo',
      'Sem história de cardiopatia congênita diagnosticada',
      'Sem uso de inibidores da enzima conversora de angiotensina',
    ],
    vitais: { pa: '110 × 70 mmHg', fc: '76 bpm', fr: '16 irpm', satO2: '98% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Ausculta pulmonar sem ruídos adventícios',
      'Sem estridor em repouso',
      'Bulhas normofonéticas, sem sopros',
      'Sem linfonodomegalias cervicais ou supraclaviculares',
    ],
    pedido:
      'Tosse seca crônica com disfagia para sólidos em adulta jovem: a pergunta é se há alteração mediastinal comprimindo traqueia ou esôfago.',
    pergunta: 'Onde está o botão aórtico neste filme, e o que ele explica?',
    achado: 'Arco aórtico à direita',
    veredito: 'Arco aórtico à direita, com desvio traqueal — variante com efeito compressivo',
    correlacao:
      'A combinação de tosse seca crônica e disfagia para sólidos, sem infecção e sem refluxo respondendo a tratamento, sugere compressão extrínseca das duas estruturas que passam pelo mediastino superior. O botão aórtico à direita, com a traqueia empurrada e estreitada, explica os dois sintomas de uma vez: o mesmo vaso que comprime a via aérea comprime o esôfago atrás dela.',
    distratores: [
      d(
        'Massa mediastinal superior',
        'Uma massa teria borda própria e densidade de partes moles, e apagaria contornos vizinhos de forma localizada. O que se vê aqui tem a densidade, a curvatura e a continuidade de um vaso, prolongando-se na aorta descendente — e continua sendo aorta, apenas do lado errado.',
      ),
      d(
        'Bócio mergulhante',
        'É a causa clássica de desvio traqueal alto e também produz disfagia. Mas o bócio desloca a traqueia a partir da região cervical, alarga a coluna aérea acima da fúrcula e costuma ser palpável no pescoço — o exame cervical aqui é normal.',
      ),
      d(
        'Desvio traqueal por rotação do paciente',
        'É a checagem obrigatória antes de valorizar qualquer desvio traqueal, e por isso merece ser considerada. Mas rotação não muda o lado do botão aórtico: ela desloca clavículas em relação aos processos espinhosos, e a aorta continua onde estava.',
      ),
    ],
    imagem: 2,
  },

  'fissura-azigos': {
    cenario: 'Ambulatório de medicina do trabalho',
    identificacao: 'Homem de 26 anos, candidato a vaga em indústria alimentícia.',
    queixa: 'Assintomático — radiografia solicitada em exame admissional.',
    historia:
      'Nega qualquer sintoma respiratório. Pratica futebol duas vezes por semana sem limitação. Nunca fumou, nunca teve pneumonia ou tuberculose e nunca fez cirurgia torácica. Procura o serviço apenas para a avaliação admissional.',
    antecedentes: [
      'Hígido, sem medicações contínuas',
      'Sem internações prévias',
      'Sem contato conhecido com tuberculose',
      'Sem exposição ocupacional a poeiras',
    ],
    vitais: { pa: '118 × 72 mmHg', fc: '64 bpm', fr: '14 irpm', satO2: '99% em ar ambiente', temp: '36,2 °C' },
    exame: [
      'Ausculta pulmonar limpa e simétrica',
      'Expansibilidade torácica preservada',
      'Sem alterações à percussão',
      'Exame cardiovascular normal',
    ],
    pedido:
      'Radiografia admissional de rotina em jovem assintomático. Achado incidental de linha curva no ápice direito.',
    pergunta: 'Uma linha fina e curva atravessa o ápice direito, terminando numa pequena densidade. O que é?',
    achado: 'Fissura ázigos',
    veredito: 'Fissura ázigos — fissura acessória com a veia ázigos formando a "cabeça de girino"',
    correlacao:
      'Um paciente assintomático, com ausculta limpa e sem história respiratória, muda o peso da imagem: uma linha apical nesse contexto é muito mais provavelmente variante que doença. E a variante aqui tem assinatura própria — a veia ázigos, envolta por quatro folhetos pleurais, migrou através do ápice arrastando a pleura, e desenha a cabeça do girino na base da linha. Ocorre em 1 a 2% das radiografias e apenas à direita.',
    distratores: [
      d(
        'Pneumotórax apical',
        'A linha pleural do pneumotórax separa pulmão com trama vascular de um espaço sem trama alguma — e além dela não há vasos. Aqui há vasculatura normal dos dois lados da linha, e a linha termina numa densidade venosa, o que o pneumotórax não faz.',
      ),
      d(
        'Cicatriz de tuberculose',
        'Sequela apical é irregular, associa-se a retração, espessamento pleural e perda de volume do ápice, com desvio traqueal para o lado afetado. Esta linha é lisa, fina, de curvatura suave e sem qualquer retração ao redor.',
      ),
      d(
        'Cateter venoso central',
        'Um cateter tem densidade metálica ou plástica, calibre uniforme e trajeto que pode ser seguido até fora do tórax. Esta linha tem densidade de tecido, afila progressivamente e não sai do gradil — e o paciente não tem acesso venoso algum.',
      ),
    ],
  },

  'fissura-acessoria': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Mulher de 38 anos, professora do ensino fundamental.',
    queixa: 'Tosse há dez dias após quadro gripal, em melhora.',
    historia:
      'Teve febre baixa e coriza há duas semanas, que cederam; ficou apenas com tosse seca ocasional, que já está diminuindo. Procura o serviço porque a diretora exigiu atestado. Sem dispneia, sem dor pleurítica, sem expectoração purulenta.',
    antecedentes: [
      'Sem doenças crônicas',
      'Sem tabagismo',
      'Sem internações por causa respiratória',
      'Vacinação em dia',
    ],
    vitais: { pa: '114 × 70 mmHg', fc: '72 bpm', fr: '16 irpm', satO2: '98% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Ausculta pulmonar sem ruídos adventícios',
      'Sem sinais de consolidação',
      'Orofaringe sem alterações',
      'Sem taquipneia ou tiragem',
    ],
    pedido:
      'Tosse pós-viral em resolução: radiografia solicitada para afastar pneumonia antes de liberar o atestado.',
    pergunta: 'Há uma linha fina e reta no parênquima. Ela representa doença?',
    achado: 'Fissura pulmonar acessória',
    veredito: 'Fissura pulmonar acessória — linha fissural congênita, sem perda de volume associada',
    correlacao:
      'A pergunta a fazer diante de qualquer linha pulmonar é se ela vem acompanhada de alteração de volume. Fissura acessória é uma separação incompleta ou adicional entre segmentos, presente desde sempre: contorno fino, liso, em posição anatômica previsível e — o que decide — sem elevação diafragmática, sem aproximação de costelas e sem qualquer retração. Numa paciente em melhora clínica, é achado incidental.',
    distratores: [
      d(
        'Atelectasia laminar',
        'É o principal imitador e a distinção é justamente o volume: atelectasia linear costuma vir com perda de volume regional ou num contexto agudo — pós-operatório, dor que impede inspirar, imobilidade. Aqui não há nem contexto nem sinal indireto de perda de volume.',
      ),
      d(
        'Espessamento pleural residual',
        'Sequela pleural é irregular, mais espessa, frequentemente com obliteração do seio costofrênico correspondente, e acompanha uma pneumonia que de fato existiu. A história aqui é de quadro viral alto, sem consolidação.',
      ),
      d(
        'Consolidação segmentar inicial',
        'Consolidação tem densidade de preenchimento alveolar, bordas mal definidas e frequentemente broncograma aéreo. Uma linha de um pixel de espessura não é preenchimento alveolar — é interface.',
      ),
    ],
  },

  'costela-cervical': {
    cenario: 'Ambulatório de ortopedia',
    identificacao: 'Mulher de 32 anos, cabeleireira.',
    queixa: 'Formigamento e perda de força no braço direito há seis meses.',
    historia:
      'O formigamento acomete a face interna do antebraço e os dois últimos dedos, piora quando trabalha com o braço elevado por muito tempo e melhora ao baixar o braço. Nos últimos dois meses passou a notar que deixa cair a escova. Refere que a mão às vezes fica pálida e fria em relação à outra.',
    antecedentes: [
      'Sem trauma cervical prévio',
      'Sem hérnia discal diagnosticada',
      'Trabalha 8 horas por dia com os braços elevados',
      'Sem diabetes ou hipotireoidismo',
    ],
    vitais: { pa: '116 × 74 mmHg', fc: '70 bpm', fr: '15 irpm', satO2: '98% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Hipoestesia em território de C8-T1 à direita',
      'Redução de força para a musculatura intrínseca da mão direita',
      'Redução do pulso radial direito com a abdução e rotação externa do braço',
      'Sem atrofia muscular evidente',
    ],
    pedido:
      'Suspeita de síndrome do desfiladeiro torácico: a radiografia procura anomalia óssea da transição cervicotorácica.',
    pergunta: 'Que achado ósseo o filme demonstra na transição cervicotorácica?',
    achado: 'Costela cervical',
    veredito: 'Costela cervical — arco supranumerário originado de C7',
    correlacao:
      'A distribuição dos sintomas em C8-T1 e a redução do pulso à manobra de abdução apontam para compressão do tronco inferior do plexo braquial e da artéria subclávia na passagem entre a primeira costela e a clavícula. A costela cervical estreita esse desfiladeiro por cima. O achado é a explicação anatômica da queixa — mas a costela em si é comum e quase sempre assintomática, e só ganha significado porque a clínica bate.',
    distratores: [
      d(
        'Fratura consolidada',
        'Fratura antiga deixa calo ósseo irregular, com espessamento local e contorno grosseiro, e interrompe a continuidade cortical antes de consolidar. Este arco tem cortical lisa e contínua e nasce de uma vértebra acima da primeira costela — é estrutura formada, não reparada.',
      ),
      d(
        'Apófise transversa de C7',
        'É o diferencial anatômico mais próximo e a distinção é o ponto de saída e a direção: o processo transverso aponta para baixo e para fora e não articula; a costela cervical se dirige para baixo e para a frente, com articulação própria, e pode ser completa ou rudimentar.',
      ),
      d(
        'Tumor de Pancoast',
        'Também comprime o tronco inferior do plexo e produz sintomas em C8-T1 — é o diferencial que não se pode perder. Mas cursa com massa apical de partes moles, frequentemente com destruição costal, e num contexto de tabagismo, dor intensa e perda de peso. Aqui há apenas osso a mais, sem massa.',
      ),
    ],
  },

  'variantes-costais': {
    cenario: 'Pronto atendimento',
    identificacao: 'Homem de 23 anos, entregador de aplicativo.',
    queixa: 'Dor torácica após esbarrão em porta de vidro há um dia.',
    historia:
      'Bateu o lado direito do tórax na porta e sentiu dor local imediata, que persiste ao respirar fundo e ao deitar sobre o lado. Nega falta de ar, nega tosse, nega sangramento. Veio por insistência da mãe, preocupada com "costela quebrada".',
    antecedentes: [
      'Hígido',
      'Sem cirurgias torácicas',
      'Sem doença óssea conhecida',
      'Nunca havia feito radiografia de tórax',
    ],
    vitais: { pa: '122 × 74 mmHg', fc: '78 bpm', fr: '16 irpm', satO2: '99% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Dor à palpação do gradil costal anterior direito, sem crepitação óssea',
      'Sem equimose ou deformidade visível',
      'Murmúrio vesicular presente e simétrico, sem enfisema subcutâneo',
      'Percussão normal em ambos os hemitórax',
    ],
    pedido:
      'Trauma torácico leve: afastar fratura de arco costal, pneumotórax e contusão pulmonar.',
    pergunta: 'O gradil tem uma alteração de forma. Ela é traumática?',
    achado: 'Costela bífida',
    veredito: 'Variante congênita do gradil costal — costela bífida, com cortical lisa e contínua',
    correlacao:
      'A pergunta do trauma é se o osso foi quebrado, e a resposta está na cortical: fratura interrompe a linha cortical e produz degrau, com partes moles adjacentes edemaciadas. Aqui a cortical percorre toda a extensão do arco sem descontinuidade, e a bifurcação tem margens lisas e arredondadas — forma construída, não rompida. Costela bífida é variante de desenvolvimento sem significado clínico, e o achado é incidental em relação ao trauma.',
    distratores: [
      d(
        'Fratura de arco costal',
        'É o que se veio procurar, e por isso merece ser afastado explicitamente: fratura produz interrupção nítida da cortical, linha radiotransparente atravessando o osso e, quando há desvio, degrau entre os fragmentos. Nada disso está presente.',
      ),
      d(
        'Lesão lítica expansiva',
        'Lesão agressiva destrói cortical, produz falha óssea de margens mal definidas e frequentemente massa de partes moles associada. A cortical aqui está íntegra em toda a volta, o que praticamente exclui processo destrutivo.',
      ),
      d(
        'Calo ósseo antigo',
        'Calo é espessamento fusiforme irregular sobre um traço prévio, com aumento de densidade local. A alteração aqui é uma bifurcação simétrica com contorno regular, e o paciente nunca teve fratura costal.',
      ),
    ],
  },

  'calcificacao-costocondral': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Homem de 68 anos, aposentado.',
    queixa: 'Radiografia de controle solicitada por tosse crônica de fumante.',
    historia:
      'Fuma há décadas e tosse pela manhã, com expectoração clara, há anos, sem mudança recente no padrão. Nega hemoptise, perda de peso, febre ou dor torácica. Veio buscar o resultado do exame pedido na consulta anterior.',
    antecedentes: [
      'Tabagista, 45 anos-maço, ainda fumando',
      'Bronquite crônica sem exacerbação recente',
      'Hipertensão em tratamento',
      'Sem história de neoplasia',
    ],
    vitais: { pa: '134 × 82 mmHg', fc: '76 bpm', fr: '17 irpm', satO2: '96% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Ausculta com murmúrio vesicular difusamente reduzido, sem crepitações',
      'Sem baqueteamento digital',
      'Sem linfonodomegalias',
      'Sem massa palpável na parede torácica',
    ],
    pedido:
      'Tosse crônica em tabagista de longa data: rastrear alteração parenquimatosa. Há opacidades arredondadas junto às extremidades anteriores das costelas.',
    pergunta: 'As opacidades junto às junções costocondrais representam nódulos pulmonares?',
    achado: 'Calcificação das cartilagens costais',
    veredito: 'Calcificação das cartilagens costais — mineralização relacionada à idade, bilateral e simétrica',
    correlacao:
      'Em tabagista de longa data, todo pseudonódulo merece um segundo olhar — e é justamente por isso que reconhecer este padrão importa. As cartilagens costais não são visíveis no jovem, mas calcificam progressivamente com a idade: a distribuição bilateral, simétrica, restrita às extremidades anteriores mediais das costelas e em continuidade com o osso é o que identifica a origem. Nódulo pulmonar não respeita a simetria do gradil.',
    distratores: [
      d(
        'Nódulos pulmonares múltiplos',
        'É a leitura que a densidade sugere e que o contexto de tabagismo torna assustadora — mas nódulo parenquimatoso se distribui ao acaso, não em pares espelhados sobre as junções costocondrais, e não se prolonga em continuidade com a cortical costal.',
      ),
      d(
        'Metástases em bala de canhão',
        'Metástases hematogênicas são arredondadas, de tamanhos variados e espalhadas por ambos os pulmões, inclusive nas bases e na periferia posterior. Estas opacidades ocupam uma faixa anatômica estreita e previsível.',
      ),
      d(
        'Granulomas calcificados residuais',
        'Granulomas calcificados são realmente densos, mas pequenos, irregulares e dispersos no parênquima, com frequência acompanhados de linfonodos hilares calcificados. Não seguem o desenho das cartilagens costais.',
      ),
    ],
  },

  'pectus-excavatum': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Homem de 24 anos, estudante universitário.',
    queixa: 'Cansaço aos esforços e preocupação com o formato do peito.',
    historia:
      'Refere que sempre teve o peito "afundado" no meio, mais evidente desde a adolescência. Cansa em atividades esportivas mais do que os colegas, mas consegue subir escadas normalmente. Procurou o serviço porque um médico anterior comentou que a radiografia dele tinha "uma mancha no pulmão direito".',
    antecedentes: [
      'Deformidade da parede torácica desde a infância, progressiva na puberdade',
      'Sem asma ou doença pulmonar diagnosticada',
      'Sem cirurgias',
      'Sem tabagismo',
    ],
    vitais: { pa: '112 × 68 mmHg', fc: '74 bpm', fr: '16 irpm', satO2: '98% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Depressão evidente do terço inferior do esterno, com escavação central',
      'Ictus cordis palpável desviado para a esquerda',
      'Ausculta pulmonar limpa, sem crepitações ou sopro tubário',
      'Sem febre, sem sinais de infecção',
    ],
    pedido:
      'Esclarecer a "mancha" descrita em radiografia anterior num paciente com deformidade evidente da parede torácica.',
    pergunta: 'A borda cardíaca direita está apagada. Isso é doença do lobo médio?',
    achado: 'Pectus excavatum',
    veredito: 'Pectus excavatum — esterno posteriorizado, com apagamento da borda cardíaca direita e costelas em "7"',
    correlacao:
      'O exame físico já entrega a resposta: há uma escavação esternal palpável e o ictus está desviado para a esquerda porque o esterno empurra o coração. Na incidência frontal, o tecido mole da parede deprimida encosta na borda cardíaca direita e a apaga pelo sinal da silhueta, imitando consolidação do lobo médio — mas a ausculta é limpa e não há febre. As costelas anteriores, que descem oblíquas, completam o padrão em "7", e o perfil mostra o esterno posteriorizado de forma direta.',
    distratores: [
      d(
        'Pneumonia do lobo médio',
        'É exatamente a leitura errada que este caso previne, e o sinal da silhueta é o mesmo nos dois. O que separa é o resto: consolidação teria broncograma aéreo, opacidade com densidade própria e um paciente com febre e ausculta alterada. Aqui não há nada além do apagamento da borda.',
      ),
      d(
        'Atelectasia do lobo médio',
        'Também apaga a borda cardíaca direita, mas com perda de volume: fissura horizontal deslocada para baixo e opacidade triangular no perfil. O perfil aqui mostra esterno deprimido, não colapso lobar.',
      ),
      d(
        'Massa mediastinal anterior',
        'Uma massa teria borda convexa própria e deslocaria estruturas, e seria vista como densidade adicional no perfil. O perfil demonstra a deformidade óssea diretamente — a causa é a parede, não um conteúdo novo no mediastino.',
      ),
    ],
  },

  escoliose: {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Mulher de 57 anos, auxiliar de limpeza.',
    queixa: 'Falta de ar aos esforços há um ano.',
    historia:
      'Cansa ao subir escadas e ao carregar peso, sem chiado e sem tosse. Tem deformidade da coluna conhecida desde a adolescência, nunca operada. Preocupa-se porque um exame anterior teria mostrado "coração grande". Nega ortopneia, edema ou dor torácica.',
    antecedentes: [
      'Escoliose torácica diagnosticada na adolescência, sem tratamento cirúrgico',
      'Sem cardiopatia diagnosticada',
      'Sem tabagismo',
      'Sem internações prévias',
    ],
    vitais: { pa: '124 × 78 mmHg', fc: '80 bpm', fr: '18 irpm', satO2: '95% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Assimetria evidente dos ombros e gibosidade à flexão do tronco',
      'Expansibilidade torácica reduzida à direita',
      'Ausculta pulmonar sem ruídos adventícios',
      'Bulhas normofonéticas, sem sopros ou terceira bulha',
    ],
    pedido:
      'Dispneia de esforço com relato prévio de "coração grande": a pergunta é se a silhueta é realmente anormal ou se a técnica não permite medi-la.',
    pergunta: 'A silhueta cardíaca parece alargada. É possível afirmar cardiomegalia neste filme?',
    achado: 'Rotação da escoliose torácica',
    veredito: 'Escoliose torácica — curvatura e rotação que distorcem a projeção e invalidam a medida do índice cardiotorácico',
    correlacao:
      'A rotação imposta pela curva vertebral muda a geometria de tudo o que se projeta sobre o filme: hilos, mediastino e coração aparecem em plano oblíquo, e a maior largura cardíaca medida deixa de corresponder à real. Some-se a isso a assimetria do gradil, que distorce o denominador da medida. Antes de rotular cardiomegalia, é preciso reconhecer que este filme não permite o cálculo — e a ausculta sem terceira bulha, sem sopros e sem congestão apoia essa cautela.',
    distratores: [
      d(
        'Cardiomegalia ao índice cardiotorácico',
        'É a conclusão apressada que a imagem convida a tirar. O índice cardiotorácico exige PA sem rotação, e a rotação aqui é estrutural e não corrigível pelo posicionamento — medir produziria um número que não representa o coração.',
      ),
      d(
        'Massa mediastinal deslocando o coração',
        'Massa desloca por efeito de pressão e tem borda própria adicional. O deslocamento aqui acompanha a curvatura da coluna e a rotação do gradil, que são visíveis no próprio filme e explicam a posição sem acrescentar nenhuma estrutura.',
      ),
      d(
        'Derrame pericárdico',
        'Também alarga a silhueta, mas de forma globosa e simétrica em relação à linha média, e costuma vir com sinais clínicos de restrição ao enchimento. Aqui a assimetria acompanha a deformidade óssea, e o exame cardiovascular é normal.',
      ),
    ],
  },
}

// ══════════════════════════════════ Vias aéreas ══════════════════════════════════

const VIAS_AEREAS: Record<string, VinhetaClinica> = {
  'fibrose-pos-radioterapia': {
    cenario: 'Ambulatório de oncologia',
    identificacao: 'Mulher de 62 anos, em seguimento oncológico.',
    queixa: 'Dispneia leve e estável há cerca de um ano.',
    historia:
      'Tratou câncer de mama esquerda com cirurgia, quimioterapia e radioterapia, concluída há dois anos. Desde então nota um cansaço discreto que não progride e uma tosse seca ocasional. Nega febre, perda de peso, hemoptise ou dor torácica nova. Vem para revisão anual.',
    antecedentes: [
      'Câncer de mama esquerda tratado, em remissão',
      'Radioterapia de parede torácica esquerda concluída há 2 anos',
      'Quimioterapia adjuvante concluída',
      'Sem tabagismo',
    ],
    vitais: { pa: '126 × 78 mmHg', fc: '78 bpm', fr: '18 irpm', satO2: '96% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Cicatriz de mastectomia à esquerda, com alteração de coloração da pele irradiada',
      'Redução da expansibilidade do hemitórax esquerdo',
      'Ausculta com murmúrio reduzido no ápice esquerdo, sem crepitações grosseiras',
      'Sem linfonodomegalias axilares ou supraclaviculares',
    ],
    pedido:
      'Revisão oncológica anual com dispneia estável: a pergunta é se há progressão de doença ou sequela do tratamento.',
    pergunta: 'A traqueia está desviada. Para que lado, e o que isso significa?',
    achado: 'Fibrose actínica do lobo superior',
    veredito: 'Fibrose pós-radioterapia do lobo superior esquerdo — perda de volume que puxa a traqueia para o mesmo lado',
    correlacao:
      'Excluída a rotação, o desvio traqueal é verdadeiro e a pergunta passa a ser direcional: traqueia puxada indica perda de volume do lado para onde ela vai; traqueia empurrada indica ganho. Aqui ela vai para a esquerda, onde a expansibilidade está reduzida e onde a radioterapia atuou. A opacidade retrátil, geométrica e restrita ao território irradiado, num quadro estável há um ano, é sequela — e o diagnóstico depende dessa correspondência com o campo de tratamento.',
    distratores: [
      d(
        'Recidiva tumoral com colapso lobar',
        'É o que não se pode perder, e por isso a comparação com exames anteriores é obrigatória. O que fala contra é o comportamento no tempo: recidiva progride e produz sintomas novos, enquanto este achado está estável e a paciente não perdeu peso nem tem dor nova.',
      ),
      d(
        'Pneumonia do lobo superior esquerdo',
        'Consolidação infecciosa aumenta ou mantém o volume do lobo e não puxa a traqueia; quando muito, empurra. Além disso viria com febre, tosse produtiva e ausculta alterada — o quadro é afebril e estável há um ano.',
      ),
      d(
        'Derrame pleural encapsulado à esquerda',
        'Líquido adiciona volume e empurra o mediastino para o lado oposto, ou pelo menos não o puxa. A direção do desvio traqueal, sozinha, já afasta essa hipótese.',
      ),
    ],
  },

  pneumonectomia: {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 70 anos, ex-tabagista.',
    queixa: 'Febre e tosse há três dias.',
    historia:
      'Refere febre de até 38,5 °C, tosse com expectoração amarelada e piora do cansaço habitual. Não trouxe documentos e informa apenas que "tirou um pulmão faz uns anos" por causa de um tumor. Nega dor torácica intensa e nega hemoptise.',
    antecedentes: [
      'Pneumonectomia esquerda por carcinoma há 5 anos',
      'Ex-tabagista, 50 anos-maço',
      'Hipertensão em tratamento irregular',
      'Sem exames prévios disponíveis no serviço',
    ],
    vitais: { pa: '132 × 80 mmHg', fc: '104 bpm', fr: '24 irpm', satO2: '90% em ar ambiente', temp: '38,3 °C' },
    exame: [
      'Hemitórax esquerdo com menor volume e cicatriz de toracotomia lateral',
      'Murmúrio vesicular abolido em todo o hemitórax esquerdo',
      'Estertores crepitantes na base direita',
      'Traqueia desviada para a esquerda à palpação da fúrcula',
    ],
    pedido:
      'Febre e hipoxemia em paciente com cirurgia torácica prévia não documentada: reconhecer a anatomia pós-operatória antes de procurar a pneumonia.',
    pergunta: 'O hemitórax esquerdo está opaco e o mediastino, deslocado. Qual é a leitura?',
    achado: 'Pneumonectomia esquerda',
    veredito: 'Pneumonectomia esquerda — hemitórax opacificado com perda de volume e desvio ipsilateral do mediastino',
    correlacao:
      'Quando um pulmão inteiro é retirado, o espaço vazio é preenchido por líquido e depois se retrai: traqueia, coração e grandes vasos migram para o lado operado, o brônquio principal termina abruptamente e o pulmão remanescente hiperexpande, podendo cruzar a linha média. Reconhecer esse estado esperado é o que evita tratar a anatomia como doença — e libera a atenção para a base direita, onde os estertores e a febre apontam a pneumonia que de fato motivou a vinda.',
    distratores: [
      d(
        'Derrame pleural maciço à esquerda',
        'Também opacifica o hemitórax, mas empurra o mediastino para o lado oposto porque adiciona volume. O desvio aqui é para o mesmo lado da opacidade — sinal de perda de volume, não de ganho.',
      ),
      d(
        'Colapso total do pulmão esquerdo',
        'Produz desvio ipsilateral idêntico e é o diferencial radiográfico legítimo. O que decide é a cicatriz de toracotomia e o coto brônquico terminando de forma abrupta, sem árvore brônquica distal — no colapso o pulmão continua lá, apenas sem ar.',
      ),
      d(
        'Pneumonia de todo o pulmão esquerdo',
        'Consolidação mantém o volume do hemitórax e preserva broncogramas aéreos; não retrai o gradil nem puxa o mediastino. E não explicaria a ausência completa de murmúrio associada à redução do volume do hemitórax.',
      ),
    ],
  },

  'grande-derrame-pleural': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Homem de 68 anos, ex-trabalhador de estaleiro.',
    queixa: 'Falta de ar progressiva há dois meses e dor no lado esquerdo do tórax.',
    historia:
      'A dispneia começou aos grandes esforços e hoje ocorre ao caminhar dentro de casa. A dor é surda, contínua, no hemitórax esquerdo, e não melhora com analgésico comum. Perdeu 6 kg em dois meses sem dieta. Trabalhou 22 anos em estaleiro, com exposição a amianto no isolamento de tubulações.',
    antecedentes: [
      'Exposição ocupacional prolongada ao asbesto',
      'Ex-tabagista, 20 anos-maço',
      'Sem tratamento para tuberculose prévia',
      'Perda ponderal de 6 kg em 2 meses',
    ],
    vitais: { pa: '128 × 80 mmHg', fc: '98 bpm', fr: '24 irpm', satO2: '91% em ar ambiente', temp: '36,6 °C' },
    exame: [
      'Murmúrio vesicular abolido em dois terços inferiores do hemitórax esquerdo',
      'Percussão maciça e frêmito toracovocal abolido nas mesmas regiões',
      'Traqueia desviada para a direita à palpação',
      'Sem edema de membros inferiores, sem turgência jugular',
    ],
    pedido:
      'Dispneia progressiva com perda de peso e exposição ao asbesto: caracterizar a opacificação do hemitórax e definir o sentido do desvio mediastinal.',
    pergunta: 'O hemitórax esquerdo está opaco. O mediastino foi empurrado ou puxado?',
    achado: 'Grande derrame pleural à esquerda',
    veredito: 'Grande derrame pleural à esquerda — ganho de volume que empurra o mediastino para o lado oposto',
    correlacao:
      'A tríade semiológica de murmúrio abolido, macicez e frêmito abolido já diz que há líquido entre o pulmão e a parede. O filme acrescenta o que o exame não mede: o volume é grande o bastante para deslocar o mediastino para a direita, e o menisco confirma a natureza líquida da opacificação. Numa história de exposição ao asbesto com perda ponderal, o derrame não é o diagnóstico final — é a porta de entrada para investigar mesotelioma.',
    distratores: [
      d(
        'Colapso total do pulmão esquerdo',
        'Colapso puxa o mediastino para o lado opaco, e aqui ele foi empurrado para o lado oposto. Essa direção é o critério que separa perda de ganho de volume, e resolve a questão sem depender de nenhum outro sinal.',
      ),
      d(
        'Pneumonia lobar extensa',
        'Consolidação não desloca o mediastino e mantém broncogramas aéreos visíveis dentro da opacidade. O quadro também é subagudo, afebril e com perda de peso — evolução de dois meses não é pneumonia aguda.',
      ),
      d(
        'Pneumonectomia prévia',
        'Produz hemitórax opaco, mas com retração: mediastino puxado, gradil estreitado e cicatriz cirúrgica. O paciente não tem história cirúrgica e o desvio é contralateral.',
      ),
    ],
  },

  'derrame-e-colapso': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 72 anos, tabagista.',
    queixa: 'Falta de ar há três semanas, em piora.',
    historia:
      'Refere dispneia que começou aos esforços e agora ocorre em repouso, com tosse seca persistente e dois episódios de escarro com raias de sangue. Perdeu 8 kg em três meses. Nega febre alta. Vem trazido pela filha, que notou que ele "não completa as frases".',
    antecedentes: [
      'Tabagista, 55 anos-maço, ainda fumando',
      'Doença pulmonar obstrutiva crônica sem tratamento regular',
      'Perda ponderal significativa nos últimos meses',
      'Sem história de tuberculose ou insuficiência cardíaca',
    ],
    vitais: { pa: '134 × 82 mmHg', fc: '110 bpm', fr: '28 irpm', satO2: '88% em ar ambiente', temp: '36,8 °C' },
    exame: [
      'Murmúrio abolido em todo o hemitórax esquerdo, com macicez à percussão',
      'Traqueia desviada para a esquerda à palpação da fúrcula',
      'Redução do volume do hemitórax esquerdo à inspeção',
      'Linfonodo supraclavicular esquerdo endurecido, de 2 cm',
    ],
    pedido:
      'Hemitórax branco em tabagista com perda de peso: decidir se há ganho, perda ou equilíbrio de volume — e por quê.',
    pergunta: 'Há menisco pleural, mas a traqueia está desviada para o lado opaco. Como explicar?',
    achado: 'Derrame pleural com colapso pulmonar',
    veredito: 'Derrame pleural associado a colapso pulmonar por obstrução brônquica tumoral — a perda de volume supera o líquido',
    correlacao:
      'O menisco confirma que existe líquido, e líquido empurra. A traqueia, porém, foi para o lado opaco: alguma coisa está puxando com mais força do que o derrame empurra. Essa força é o colapso do pulmão inteiro, e o brônquio principal esquerdo interrompido de forma abrupta mostra a causa. Em tabagista com perda de peso e linfonodo supraclavicular endurecido, a obstrução é tumoral até prova em contrário — o hemitórax branco aqui é a soma de duas coisas, não uma só.',
    distratores: [
      d(
        'Derrame pleural maciço isolado',
        'Se só houvesse líquido, o mediastino teria sido empurrado para a direita. O desvio ipsilateral é incompatível com derrame isolado e é justamente o sinal que obriga a procurar a segunda alteração.',
      ),
      d(
        'Pneumonia com derrame parapneumônico',
        'Explicaria opacidade e líquido juntos, mas não a perda de volume nem a interrupção abrupta do brônquio principal — infecção não corta a árvore brônquica. Além disso, o quadro é subagudo, afebril e com perda ponderal.',
      ),
      d(
        'Pneumonectomia antiga não relatada',
        'Daria desvio ipsilateral e hemitórax opaco, mas não haveria menisco pleural nem árvore brônquica distal ao coto, e existiria cicatriz de toracotomia. O paciente não tem cicatriz e o brônquio principal está presente até o ponto da obstrução.',
      ),
    ],
  },

  'colapso-lobo-inferior-direito': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Mulher de 66 anos, ex-tabagista.',
    queixa: 'Tosse persistente há três meses e dois episódios de pneumonia no mesmo local.',
    historia:
      'Tratou duas pneumonias em quatro meses, ambas na base direita, com melhora parcial dos sintomas mas sem normalização da radiografia. Mantém tosse seca e cansaço leve. Perdeu 4 kg. Nega febre atual. O médico anterior estranhou que a alteração "não sumiu depois do antibiótico".',
    antecedentes: [
      'Ex-tabagista, 35 anos-maço, parou há 3 anos',
      'Dois episódios de pneumonia no mesmo lobo em 4 meses',
      'Hipertensão em tratamento',
      'Sem imunossupressão conhecida',
    ],
    vitais: { pa: '130 × 80 mmHg', fc: '86 bpm', fr: '19 irpm', satO2: '94% em ar ambiente', temp: '36,5 °C' },
    exame: [
      'Murmúrio vesicular reduzido na base direita',
      'Percussão submaciça na mesma região',
      'Sem estertores grosseiros ou sopro tubário',
      'Sem baqueteamento digital, sem linfonodomegalias palpáveis',
    ],
    pedido:
      'Pneumonia de repetição no mesmo lobo, sem resolução radiográfica: a pergunta é se há obstrução brônquica subjacente.',
    pergunta: 'Que achado explica a alteração persistente na base direita?',
    achado: 'Colapso do lobo inferior direito',
    veredito: 'Colapso do lobo inferior direito — opacidade com perda de volume e mediastino puxado para a direita',
    correlacao:
      'Pneumonia que se repete no mesmo lobo e não resolve depois do antibiótico é obstrução até prova em contrário: o brônquio bloqueado retém secreção, infecta e não drena. O filme mostra a consequência mecânica — o lobo perdeu ar, o hemitórax direito perdeu volume e o mediastino foi puxado para esse lado. A massa obstrutiva pode não ser visível, e essa ausência não tranquiliza: em adulto, colapso lobar sem causa evidente exige broncoscopia e tomografia.',
    distratores: [
      d(
        'Pneumonia da base ainda em resolução',
        'Consolidação em resolução mantém ou aumenta o volume do lobo e não puxa o mediastino. A perda de volume é o que transforma "pneumonia arrastada" em "obstrução a investigar", e é o achado que muda a conduta.',
      ),
      d(
        'Derrame pleural à direita',
        'Líquido empurra o mediastino e produz menisco com borda de concavidade superior. Aqui o mediastino foi puxado e a opacidade tem contorno triangular de base inferior, característico de colapso lobar.',
      ),
      d(
        'Elevação do hemidiafragma direito',
        'Também reduz o volume aerado da base e pode acompanhar o quadro, mas a cúpula elevada mantém contorno convexo próprio e não explica a persistência após tratamento nem a retração mediastinal.',
      ),
    ],
  },

  'colapso-lobo-inferior-esquerdo': {
    cenario: 'Enfermaria cirúrgica',
    identificacao: 'Homem de 59 anos, quarto dia de pós-operatório.',
    queixa: 'Febre baixa e queda da saturação.',
    historia:
      'Operado de laparotomia por obstrução intestinal. Vem referindo dor abdominal ao tossir e por isso evita respirar fundo. Mobiliza-se pouco no leito. Nos últimos dois dias a saturação caiu e apareceu febre de 37,9 °C, sem calafrios. Nega dor torácica pleurítica.',
    antecedentes: [
      'Laparotomia há 4 dias, com incisão mediana',
      'Tabagista, 25 anos-maço',
      'Analgesia insuficiente, com tosse inibida pela dor',
      'Restrição ao leito desde a cirurgia',
    ],
    vitais: { pa: '124 × 76 mmHg', fc: '98 bpm', fr: '22 irpm', satO2: '91% em ar ambiente', temp: '37,9 °C' },
    exame: [
      'Murmúrio vesicular reduzido na base esquerda, sem sopro tubário',
      'Ferida operatória limpa, sem sinais flogísticos',
      'Respiração superficial, com recusa a inspirar profundamente',
      'Sem edema ou assimetria de membros inferiores',
    ],
    pedido:
      'Hipoxemia e febre no pós-operatório: diferenciar atelectasia, pneumonia e complicação tromboembólica.',
    pergunta: 'A borda cardíaca esquerda tem um segundo contorno. O que ele representa?',
    achado: 'Colapso do lobo inferior esquerdo',
    veredito: 'Colapso do lobo inferior esquerdo — sinal da vela retrocardíaco, com duplo contorno da borda cardíaca',
    correlacao:
      'A dor da laparotomia impede inspirar fundo e tossir; sem isso, a secreção se acumula, o brônquio se obstrui e o lobo inferior esquerdo colapsa — o quadro clássico do quarto dia de pós-operatório. O lobo colapsado se retrai contra a coluna, atrás do coração, e forma uma opacidade triangular que cria uma segunda borda dentro da silhueta cardíaca: o sinal da vela. O hemidiafragma esquerdo deixa de ser seguido até a coluna porque dois tecidos de mesma densidade passam a se tocar.',
    distratores: [
      d(
        'Duplo contorno por átrio esquerdo aumentado',
        'O duplo contorno do átrio esquerdo aparece na borda direita da silhueta, não na esquerda, e vem acompanhado de carina alargada e apêndice atrial convexo. Aqui a segunda borda está à esquerda e vem com perda da linha diafragmática posterior.',
      ),
      d(
        'Derrame pleural esquerdo de pequeno volume',
        'Derrame se acumula no seio costofrênico e produz menisco lateral, sem criar borda vertical retrocardíaca nem apagar a cúpula em sua porção medial. Também não explicaria a perda de volume.',
      ),
      d(
        'Hérnia hiatal',
        'Também produz densidade retrocardíaca, mas com nível hidroaéreo e conteúdo gasoso identificável, e não altera o volume pulmonar. O contexto de pós-operatório com hipoxemia e respiração superficial aponta para colapso.',
      ),
    ],
  },

  'colapso-lobo-superior-direito': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Homem de 64 anos, tabagista.',
    queixa: 'Tosse com raias de sangue há um mês.',
    historia:
      'Tosse crônica de fumante que mudou de característica: ficou mais seca, mais intensa e passou a vir com raias de sangue algumas vezes por semana. Refere cansaço novo e perda de 5 kg em dois meses. Nega febre e nega dor torácica. Nunca fez tomografia.',
    antecedentes: [
      'Tabagista, 45 anos-maço, ainda fumando',
      'Doença pulmonar obstrutiva crônica',
      'Hemoptise de pequeno volume recorrente há 1 mês',
      'Sem tratamento prévio para tuberculose',
    ],
    vitais: { pa: '138 × 84 mmHg', fc: '92 bpm', fr: '20 irpm', satO2: '93% em ar ambiente', temp: '36,5 °C' },
    exame: [
      'Murmúrio vesicular reduzido no ápice direito',
      'Percussão submaciça no terço superior direito',
      'Traqueia discretamente desviada para a direita',
      'Sem linfonodomegalias supraclaviculares palpáveis',
    ],
    pedido:
      'Hemoptise em tabagista com perda de peso: procurar massa, colapso e sinais indiretos de obstrução brônquica.',
    pergunta: 'O campo superior direito está denso e a fissura horizontal subiu. Qual é o achado?',
    achado: 'Colapso do lobo superior direito',
    veredito: 'Colapso do lobo superior direito — fissura horizontal elevada com tração traqueal ipsilateral',
    correlacao:
      'Hemoptise em tabagista de 45 anos-maço com perda ponderal é câncer de pulmão até prova em contrário, e o filme mostra o sinal indireto que frequentemente aparece antes da massa: o lobo superior direito perdeu ar, ficou denso e se retraiu para cima, levando a fissura horizontal e puxando a traqueia para o mesmo lado. Em adulto, esse colapso raramente se explica por muco ou corpo estranho — a obstrução neoplásica precisa ser excluída com broncoscopia.',
    distratores: [
      d(
        'Consolidação do lobo superior direito',
        'Pneumonia preenche o lobo sem encolhê-lo: a fissura fica no lugar ou é empurrada para baixo, e a traqueia não se desloca. A elevação da fissura é o que caracteriza perda de volume e reorienta toda a investigação.',
      ),
      d(
        'Sequela fibrótica de tuberculose apical',
        'Também retrai o ápice e desvia a traqueia, e é um diferencial real. O que pesa contra é o tempo: sequela é estável por anos e assintomática, enquanto aqui há hemoptise nova, perda de peso e mudança recente do padrão da tosse.',
      ),
      d(
        'Espessamento pleural apical',
        'Capuz pleural apical é periférico, de espessura relativamente uniforme e não desloca a fissura horizontal nem produz opacidade lobar com perda de volume interna.',
      ),
    ],
  },

  'paralisia-frenica': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Homem de 67 anos, ex-tabagista.',
    queixa: 'Falta de ar que piora ao deitar, há dois meses.',
    historia:
      'Nota que dorme melhor sentado e que a falta de ar aparece principalmente ao se abaixar para calçar os sapatos. Tem tosse seca e rouquidão nova há algumas semanas. Perdeu 7 kg em três meses. Nega ortopneia com edema, nega dor torácica.',
    antecedentes: [
      'Ex-tabagista, 40 anos-maço',
      'Rouquidão progressiva há 6 semanas',
      'Sem cardiopatia diagnosticada',
      'Sem cirurgia cervical ou torácica prévia',
    ],
    vitais: { pa: '128 × 78 mmHg', fc: '90 bpm', fr: '20 irpm', satO2: '92% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Murmúrio vesicular reduzido na base esquerda',
      'Redução da expansibilidade do hemitórax esquerdo',
      'Voz rouca, sem estridor',
      'Sem edema de membros inferiores, sem turgência jugular',
    ],
    pedido:
      'Dispneia posicional com rouquidão e perda de peso: procurar massa mediastinal ou hilar e avaliar a posição dos hemidiafragmas.',
    pergunta: 'O hemidiafragma esquerdo está elevado e há uma massa hilar. Como os dois se conectam?',
    achado: 'Paralisia frênica por massa hilar',
    veredito: 'Paralisia do nervo frênico por massa hilar — hemidiafragma elevado com perda de volume do lado da lesão',
    correlacao:
      'A dispneia que piora ao deitar e ao se abaixar é a assinatura clínica de um hemidiafragma que não trabalha: sem a contração, o conteúdo abdominal empurra a cúpula para cima toda vez que a gravidade favorece. O nervo frênico corre junto ao mediastino e ao hilo, e uma massa naquele território pode invadi-lo — a mesma massa que, ao envolver o nervo laríngeo recorrente, explica a rouquidão. Note que a massa impede que a traqueia se desloque livremente em direção à perda de volume.',
    distratores: [
      d(
        'Eventração diafragmática congênita',
        'Produz elevação idêntica da cúpula, mas é achado antigo, estável e assintomático, sem massa associada. Aqui há massa hilar, rouquidão nova e perda de peso — o conjunto exige explicação adquirida.',
      ),
      d(
        'Derrame pleural subpulmonar à esquerda',
        'Simula elevação diafragmática, e é um imitador clássico. A diferença está no contorno e no comportamento: o líquido subpulmonar desloca o ponto mais alto da cúpula lateralmente e muda com o decúbito, o que a paralisia não faz.',
      ),
      d(
        'Colapso do lobo inferior esquerdo',
        'Também eleva a cúpula por perda de volume, mas produz opacidade triangular retrocardíaca com duplo contorno da borda cardíaca. Aqui a base está elevada, e não substituída por lobo colapsado, e a massa é hilar.',
      ),
    ],
  },

  'colapso-lobo-superior-esquerdo': {
    cenario: 'Pronto-socorro',
    identificacao: 'Mulher de 61 anos, tabagista.',
    queixa: 'Cansaço e tosse há seis semanas, com piora nos últimos dias.',
    historia:
      'Tosse seca que não melhorou com dois ciclos de antibiótico prescritos em outro serviço. Refere cansaço progressivo, dor surda no ombro esquerdo e perda de 6 kg. Nos últimos dias a falta de ar piorou o suficiente para procurar a emergência. Sem febre alta.',
    antecedentes: [
      'Tabagista, 40 anos-maço',
      'Dois cursos de antibiótico sem melhora',
      'Sem cardiopatia conhecida',
      'Perda ponderal de 6 kg em 2 meses',
    ],
    vitais: { pa: '130 × 80 mmHg', fc: '102 bpm', fr: '24 irpm', satO2: '90% em ar ambiente', temp: '37,2 °C' },
    exame: [
      'Murmúrio vesicular reduzido em todo o hemitórax esquerdo, mais no terço superior',
      'Redução da expansibilidade à esquerda',
      'Traqueia desviada para a esquerda',
      'Linfonodo supraclavicular esquerdo palpável, endurecido',
    ],
    pedido:
      'Tosse refratária a antibiótico com perda de peso e adenopatia supraclavicular: procurar massa e sinais de colapso lobar.',
    pergunta: 'Há opacidade "em véu" à esquerda com um crescente aéreo junto ao arco aórtico. Qual é o achado?',
    achado: 'Colapso do lobo superior esquerdo',
    veredito: 'Colapso do lobo superior esquerdo — opacidade em véu com sinal da Luftsichel',
    correlacao:
      'O lobo superior esquerdo, quando colapsa, não se retrai para cima como o direito: ele se achata contra a parede anterior, e na incidência frontal isso produz um véu difuso que apaga a borda cardíaca esquerda sem apagar o hemidiafragma. O lobo inferior, hiperinsuflado, sobe medialmente para ocupar o espaço vazio e se interpõe entre o arco aórtico e o lobo colapsado — esse crescente de ar é a Luftsichel. Tosse que não responde a antibiótico, perda de peso e linfonodo supraclavicular apontam a causa obstrutiva.',
    distratores: [
      d(
        'Pneumonia do lobo superior esquerdo',
        'Explicaria a opacidade, mas não a redução do volume do hemitórax nem o desvio traqueal ipsilateral — e sobretudo não explicaria a falha de dois ciclos de antibiótico. Consolidação infecciosa não cria o crescente aéreo da Luftsichel.',
      ),
      d(
        'Derrame pleural esquerdo laminar',
        'Líquido laminar produz opacidade difusa que pode enganar, mas se acumula na periferia e no seio costofrênico, muda com o decúbito e empurra, em vez de puxar, o mediastino.',
      ),
      d(
        'Massa mediastinal anterior à esquerda',
        'Uma massa teria borda convexa própria e deslocaria estruturas para longe, sem perda de volume do hemitórax. O véu aqui é difuso, sem borda definida, e vem acompanhado de retração.',
      ),
    ],
  },
}

// ══════════════════════════════════ Dispositivos ══════════════════════════════════

const DISPOSITIVOS: Record<string, VinhetaClinica> = {
  'pneumocistose-e-piercing': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 34 anos, garçom.',
    queixa: 'Falta de ar progressiva há três semanas e febre baixa.',
    historia:
      'Começou com cansaço ao subir escadas e hoje se cansa ao tomar banho. Tem tosse seca persistente e febre vespertina de até 37,8 °C. Perdeu 9 kg em dois meses e refere lesões esbranquiçadas na boca há algumas semanas. Nunca fez sorologia para HIV.',
    antecedentes: [
      'Sem diagnóstico prévio de imunossupressão; sorologia para HIV nunca realizada',
      'Candidíase oral atual',
      'Perda ponderal de 9 kg em 2 meses',
      'Piercing mamilar colocado há 2 anos',
    ],
    vitais: { pa: '112 × 70 mmHg', fc: '112 bpm', fr: '28 irpm', satO2: '86% em ar ambiente', temp: '37,9 °C' },
    exame: [
      'Placas esbranquiçadas removíveis em orofaringe',
      'Ausculta pulmonar com poucos achados, desproporcional à hipoxemia',
      'Dessaturação acentuada ao caminhar poucos metros',
      'Piercing metálico em mamilo esquerdo',
    ],
    pedido:
      'Hipoxemia grave com ausculta pobre e candidíase oral: caracterizar o padrão pulmonar e identificar objetos externos projetados sobre o tórax.',
    pergunta: 'Que padrão pulmonar o filme mostra — e o que é o objeto metálico sobre a parede torácica?',
    achado: 'Pneumocistose com artefato de piercing',
    veredito: 'Opacidades intersticiais peri-hilares bilaterais compatíveis com pneumocistose, com artefato de piercing mamilar',
    correlacao:
      'A dissociação clássica entre ausculta pobre e hipoxemia grave, num paciente com candidíase oral e perda ponderal, aponta para pneumonia por Pneumocystis em imunossupressão avançada. O padrão radiográfico típico é intersticial, peri-hilar, bilateral e simétrico — mas a pneumocistose pode assumir qualquer padrão, inclusive radiografia normal, e um filme limpo jamais a exclui. O anel metálico com fecho menos denso é externo: reconhecê-lo evita investigar um nódulo que não existe.',
    distratores: [
      d(
        'Edema pulmonar cardiogênico',
        'Também produz opacidades peri-hilares bilaterais, mas viria com cardiomegalia, redistribuição vascular, linhas septais e derrames — e num paciente de 34 anos sem cardiopatia, com febre e perda de peso, o contexto não sustenta.',
      ),
      d(
        'Nódulo pulmonar a esclarecer',
        'É o erro que o caso previne: densidade metálica, contorno perfeitamente circular e um fecho de densidade diferente denunciam objeto externo. Nódulo parenquimatoso não tem componentes de densidades distintas com geometria de joia.',
      ),
      d(
        'Tuberculose de padrão miliar',
        'É diferencial obrigatório neste contexto de imunossupressão, mas o padrão miliar é de micronódulos uniformes distribuídos por todos os campos, e não de opacidade intersticial peri-hilar confluente.',
      ),
    ],
  },

  'cateter-jugular-tunelizado': {
    cenario: 'Sala de procedimentos',
    identificacao: 'Mulher de 54 anos, em tratamento oncológico.',
    queixa: 'Controle após instalação de cateter de longa permanência.',
    historia:
      'Em quimioterapia adjuvante para câncer de mama, com veias periféricas exauridas após seis ciclos. Foi submetida há uma hora à colocação de cateter tunelizado por punção da veia jugular interna direita. Está confortável, sem dor torácica e sem dispneia.',
    antecedentes: [
      'Câncer de mama em quimioterapia adjuvante',
      'Acesso venoso periférico esgotado',
      'Cateter tunelizado implantado há 1 hora, por via jugular interna direita',
      'Sem doença pulmonar prévia',
    ],
    vitais: { pa: '118 × 72 mmHg', fc: '80 bpm', fr: '16 irpm', satO2: '98% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Curativo limpo em região cervical direita e em região infraclavicular',
      'Murmúrio vesicular presente e simétrico',
      'Sem enfisema subcutâneo à palpação cervical',
      'Refluxo de sangue presente nas duas vias do cateter',
    ],
    pedido:
      'Radiografia de controle pós-implante: confirmar trajeto e posição da ponta e afastar pneumotórax antes de liberar o uso.',
    pergunta: 'Siga o cateter de uma extremidade à outra. Qual é a leitura correta do trajeto?',
    achado: 'Cateter tunelizado bem posicionado',
    veredito: 'Cateter jugular interno tunelizado com ponta na junção cavoatrial — trajeto e posicionamento adequados',
    correlacao:
      'A leitura de um cateter é sempre a mesma sequência: onde entra, por onde passa, onde termina e o que complicou. Aqui o cateter entra pela jugular interna, desce pela veia braquiocefálica e cava superior e termina na junção cavoatrial — a posição que garante fluxo alto e reduz risco de trombose e de erosão. Entre a saída na pele e a entrada venosa há um segmento que percorre um túnel subcutâneo anterior, característica dos cateteres de longa permanência, feita para reduzir infecção. Sem pneumotórax, o acesso pode ser liberado.',
    distratores: [
      d(
        'Ponta intra-atrial exigindo tração',
        'Posição intra-atrial profunda deve ser corrigida por risco de arritmia e perfuração, e por isso a checagem importa. A referência é a junção cavoatrial, aproximadamente na altura do brônquio-fonte direito ou dois corpos vertebrais abaixo da carina — e a ponta aqui não a ultrapassa.',
      ),
      d(
        'Cateter refluído para jugular contralateral',
        'Mau posicionamento por refluxo faz o cateter subir de volta pelo pescoço, formando uma curva ascendente reconhecível acima da clavícula. O trajeto aqui é descendente e contínuo até o mediastino.',
      ),
      d(
        'Pneumotórax pós-punção',
        'É a complicação que a radiografia de controle existe para procurar, e afastá-la é parte da leitura. Não há linha pleural, a trama vascular alcança a periferia em ambos os ápices e a ausculta é simétrica.',
      ),
    ],
  },

  'port-a-cath': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Mulher de 27 anos, com doença pulmonar crônica.',
    queixa: 'Aumento do volume e da purulência do escarro há uma semana.',
    historia:
      'Convive com tosse produtiva diária desde a infância e infecções respiratórias frequentes. Nesta semana o escarro ficou mais volumoso, esverdeado e apareceu febre baixa. Já usa antibiótico endovenoso periódico, administrado por um dispositivo implantado no tórax.',
    antecedentes: [
      'Fibrose cística diagnosticada na infância',
      'Bronquiectasias difusas conhecidas',
      'Port-a-cath implantado há 3 anos para antibioticoterapia periódica',
      'Colonização crônica das vias aéreas',
    ],
    vitais: { pa: '106 × 66 mmHg', fc: '96 bpm', fr: '22 irpm', satO2: '92% em ar ambiente', temp: '37,6 °C' },
    exame: [
      'Reservatório subcutâneo palpável em região infraclavicular direita',
      'Estertores grossos e roncos difusos em ambos os hemitórax',
      'Baqueteamento digital presente',
      'Índice de massa corporal reduzido',
    ],
    pedido:
      'Exacerbação infecciosa em fibrose cística: avaliar o parênquima e conferir a integridade do dispositivo antes de iniciar antibiótico endovenoso.',
    pergunta: 'Que dispositivo está implantado — e o que o pulmão sob ele mostra?',
    achado: 'Port-a-cath sobre bronquiectasias',
    veredito: 'Port-a-cath com ponta em posição venosa central, sobre pulmão com bronquiectasias difusas',
    correlacao:
      'O reservatório subcutâneo puncionável ligado a um cateter que entra na subclávia é um port totalmente implantado, escolhido justamente para terapias repetidas de longa duração como as desta paciente. Reconhecê-lo é rápido — e a leitura não pode parar aí: sob o dispositivo, o pulmão mostra retículo grosseiro e linhas paralelas em "trilho de trem", que são paredes brônquicas espessadas e dilatadas. Essa é a alteração que explica a exacerbação e o baqueteamento digital.',
    distratores: [
      d(
        'Marcapasso definitivo',
        'Gerador e reservatório ficam ambos em bolsa subcutânea infraclavicular, o que os aproxima. A distinção está no que sai deles: do marcapasso partem eletrodos que terminam dentro das câmaras cardíacas; do port sai um cateter que termina no sistema venoso, sem entrar no ventrículo.',
      ),
      d(
        'Cateter tunelizado de longa permanência',
        'Também é acesso central prolongado, mas tem porção externa visível saindo pela pele, com acessos manipuláveis. O port é inteiramente implantado e puncionado através da pele — nada atravessa a barreira cutânea entre os usos.',
      ),
      d(
        'Pulmão sem alterações parenquimatosas',
        'É a armadilha da satisfação de busca: identificado o dispositivo, a leitura para. As linhas paralelas e o retículo grosseiro são a doença de base da paciente e o motivo real da consulta.',
      ),
    ],
  },

  'cateter-tunelizado': {
    cenario: 'Ambulatório de oncologia',
    identificacao: 'Homem de 61 anos, em quimioterapia paliativa.',
    queixa: 'Dificuldade para infundir a medicação pelo cateter.',
    historia:
      'Usa cateter venoso central de longa permanência há oito meses. Na última sessão a enfermagem relatou resistência à infusão e ausência de refluxo em uma das vias. O paciente nega dor, febre ou secreção no sítio de saída. Nega dispneia.',
    antecedentes: [
      'Neoplasia em tratamento quimioterápico paliativo',
      'Cateter tunelizado por veia subclávia esquerda há 8 meses',
      'Sem trombose venosa diagnosticada',
      'Sem infecção de cateter prévia',
    ],
    vitais: { pa: '122 × 74 mmHg', fc: '84 bpm', fr: '17 irpm', satO2: '96% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Sítio de saída do cateter limpo, sem hiperemia ou secreção',
      'Sem edema de membro superior esquerdo ou circulação colateral no tórax',
      'Murmúrio vesicular presente e simétrico',
      'Ausência de refluxo em uma das vias do cateter',
    ],
    pedido:
      'Disfunção de cateter de longa permanência: documentar ponto de entrada, trajeto, continuidade e posição da ponta.',
    pergunta: 'O que a radiografia documenta sobre este acesso?',
    achado: 'Cateter com trajeto e ponta adequados',
    veredito: 'Cateter tunelizado por subclávia esquerda, com trajeto contínuo e ponta em posição venosa central',
    correlacao:
      'Diante de disfunção, a radiografia responde ao que é mecânico e visível: se o cateter migrou, se dobrou, se fraturou ou se a ponta saiu da posição. Aqui o trajeto entra pela subclávia esquerda, cruza para a cava superior sem angulação abrupta e a ponta permanece central — o material está onde deveria. Isso não encerra a investigação da disfunção, que passa a ter causas que a radiografia não mostra, como trombo na ponta ou bainha de fibrina.',
    distratores: [
      d(
        'Fratura do cateter com embolização',
        'É a complicação grave a excluir, e se manifesta como interrupção da linha radiopaca com fragmento em posição vascular distante. A linha aqui é contínua de ponta a ponta.',
      ),
      d(
        'Ponta refluída para a veia jugular',
        'Mau posicionamento por refluxo é causa mecânica frequente de disfunção e explicaria a queixa — mas exige ver o cateter curvar-se para cima em direção ao pescoço, o que não ocorre neste trajeto.',
      ),
      d(
        'Trombose de veia subclávia esquerda',
        'É uma das causas mais prováveis da disfunção neste paciente, mas não é achado de radiografia simples: exigiria ultrassonografia com Doppler ou venografia. Além disso, não há edema de membro nem circulação colateral que a sugiram clinicamente.',
      ),
    ],
  },

  'stent-esofagico': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 66 anos, com neoplasia esofágica avançada.',
    queixa: 'Dor torácica à direita e piora da falta de ar há uma semana.',
    historia:
      'Tratou câncer de esôfago e recebeu prótese esofágica por disfagia importante, com melhora da deglutição. Nas últimas semanas surgiu dor contínua na parede torácica direita, que piora ao movimento e não cede com analgésico simples, além de cansaço progressivo. Perdeu peso de forma acentuada.',
    antecedentes: [
      'Carcinoma de esôfago em estágio avançado',
      'Stent esofágico expansível implantado há 4 meses',
      'Esternotomia prévia por revascularização miocárdica',
      'Perda ponderal acentuada',
    ],
    vitais: { pa: '116 × 70 mmHg', fc: '104 bpm', fr: '24 irpm', satO2: '91% em ar ambiente', temp: '36,7 °C' },
    exame: [
      'Dor exquisita à palpação do gradil costal anterior direito, com abaulamento local',
      'Murmúrio vesicular reduzido nas bases, com macicez',
      'Cicatriz mediana de esternotomia',
      'Caquexia evidente',
    ],
    pedido:
      'Dor óssea localizada e dispneia em paciente oncológico: identificar o material implantado e procurar doença metastática.',
    pergunta: 'Além do stent, o que a leitura sistemática encontra?',
    achado: 'Stent esofágico com metástase costal',
    veredito: 'Stent esofágico com doença metastática associada — destruição costal, massa de partes moles e derrames pleurais',
    correlacao:
      'O stent é o achado mais chamativo e o menos importante hoje: ele explica a deglutição, não a dor. Ao seguir a leitura, a quinta costela direita mostra falha cortical com massa de partes moles adjacente — exatamente onde o dedo encontra dor exquisita e abaulamento —, e os seios costofrênicos estão velados. É o caso que demonstra por que identificar o dispositivo não substitui a varredura sistemática de ossos, pleura e parênquima.',
    distratores: [
      d(
        'Apenas o stent esofágico',
        'É a armadilha do caso: o dispositivo chama a atenção e a leitura para nele. A dor localizada à palpação com abaulamento é justamente a pista de que existe algo na parede — e existe.',
      ),
      d(
        'Fratura costal traumática',
        'Também interrompe a cortical e dói à palpação, mas ocorre num contexto de trauma e não vem acompanhada de massa de partes moles expansiva. Destruição óssea com massa é lesão lítica, não fratura.',
      ),
      d(
        'Derrames de origem cardíaca',
        'Os derrames existem, mas atribuí-los à insuficiência cardíaca ignora o resto: não há cardiomegalia, redistribuição vascular nem linhas septais, e há destruição óssea concomitante num paciente com neoplasia avançada.',
      ),
    ],
  },

  'tubo-endotraqueal-mal-posicionado': {
    cenario: 'Sala de emergência',
    identificacao: 'Homem de 58 anos, recém-intubado.',
    queixa: 'Queda da saturação após intubação orotraqueal.',
    historia:
      'Intubado há vinte minutos por rebaixamento do nível de consciência secundário a intoxicação exógena. A intubação foi descrita como difícil, com necessidade de duas tentativas. Após acoplar ao ventilador, a saturação, que havia subido, caiu novamente e as pressões de via aérea aumentaram.',
    antecedentes: [
      'Intoxicação exógena com rebaixamento de consciência',
      'Intubação orotraqueal há 20 minutos, descrita como difícil',
      'Sem doença pulmonar prévia conhecida',
      'Sem trauma torácico',
    ],
    vitais: { pa: '110 × 66 mmHg', fc: '124 bpm', fr: '20 irpm (ventilador)', satO2: '87% sob ventilação com FiO₂ elevada', temp: '36,0 °C' },
    exame: [
      'Murmúrio vesicular audível à direita e praticamente ausente à esquerda',
      'Expansibilidade assimétrica, com hemitórax esquerdo pouco móvel',
      'Aumento das pressões de pico no ventilador',
      'Sem enfisema subcutâneo, sem desvio traqueal palpável',
    ],
    pedido:
      'Assimetria de ausculta imediatamente após intubação difícil: conferir a posição da ponta do tubo em relação à carina.',
    pergunta: 'Onde termina o tubo, e o que isso causou no pulmão contralateral?',
    achado: 'Intubação seletiva do brônquio direito',
    veredito: 'Tubo endotraqueal no brônquio principal direito — intubação seletiva com colapso do pulmão esquerdo',
    correlacao:
      'O brônquio principal direito é mais vertical e mais calibroso que o esquerdo: um tubo que avança além da carina entra nele por gravidade anatômica. A partir daí só o pulmão direito é ventilado, e o esquerdo, sem receber ar, colapsa — daí o murmúrio ausente à esquerda, a expansibilidade assimétrica, a queda da saturação e o aumento das pressões, já que todo o volume corrente passa a caber em um pulmão só. A correção é imediata e mecânica: tracionar o tubo até posição supracarinal.',
    distratores: [
      d(
        'Pneumotórax hipertensivo à esquerda',
        'Também produz murmúrio abolido unilateral com hipoxemia e alta pressão de via aérea, e é o diferencial urgente. A diferença é a densidade: no pneumotórax o hemitórax fica hipertransparente e sem trama vascular; aqui ele está opaco, com broncogramas aéreos — pulmão sem ar, não espaço com ar.',
      ),
      d(
        'Intubação esofágica',
        'Causaria ausência de murmúrio bilateral, distensão gástrica progressiva e capnografia sem curva — e não ventilaria bem nenhum dos lados. Aqui o pulmão direito ventila normalmente.',
      ),
      d(
        'Broncoaspiração maciça à esquerda',
        'Explicaria opacidade unilateral em paciente com rebaixamento de consciência, e é plausível pelo contexto. Mas não explica a ponta do tubo além da carina, e a correção do posicionamento reverte o quadro — o que a aspiração não faria.',
      ),
    ],
  },

  'artefatos-de-cirurgia-cardiaca': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Mulher de 71 anos, primeira consulta no serviço.',
    queixa: 'Consulta inicial para acompanhamento, sem queixa aguda.',
    historia:
      'Mudou-se de cidade e vem estabelecer acompanhamento. Refere que "operou o coração" e que "tirou um pedaço da mama" há muitos anos, mas não sabe detalhar os procedimentos e não trouxe relatórios. Sente-se bem, caminha diariamente, sem dispneia ou dor torácica.',
    antecedentes: [
      'Cirurgia cardíaca prévia, sem documentação',
      'Cirurgia mamária prévia, sem documentação',
      'Hipertensão arterial em tratamento',
      'Sem internações recentes',
    ],
    vitais: { pa: '128 × 76 mmHg', fc: '72 bpm', fr: '16 irpm', satO2: '97% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Cicatriz mediana de esternotomia',
      'Cicatriz em quadrante superior externo da mama esquerda, com assimetria mamária',
      'Clique metálico audível na ausculta cardíaca',
      'Pulmões limpos, sem edema',
    ],
    pedido:
      'Reconstituir a história cirúrgica de paciente sem documentação: a radiografia é usada como registro do material implantado.',
    pergunta: 'Que procedimentos os materiais visíveis permitem reconstituir?',
    achado: 'Prótese aórtica com clipes de mastectomia',
    veredito: 'Fios de esternotomia com prótese valvar aórtica e clipes axilares de cirurgia mamária prévia',
    correlacao:
      'Cada material tem topografia própria e conta uma parte da história. Os fios medianos dizem que o esterno foi aberto; o anel denso na topografia valvar aórtica explica o clique metálico da ausculta e identifica troca valvar; os clipes na região axilar ficam fora do mediastino e pertencem a esvaziamento axilar da cirurgia mamária, não à cirurgia cardíaca. Ler a posição de cada um evita atribuir tudo ao mesmo procedimento.',
    distratores: [
      d(
        'Revascularização com enxertos de mamária',
        'Clipes de revascularização acompanham o trajeto das mamárias internas, ou seja, paramedianos e junto ao esterno. Estes estão na axila, território de drenagem linfática da mama — mesma aparência, endereço diferente.',
      ),
      d(
        'Prótese valvar mitral',
        'A distinção é posicional: a prótese mitral se projeta mais inferior e posterior, e a aórtica mais superior e anterior. A incidência e a rotação influenciam a projeção, e por isso a topografia deve ser avaliada com cuidado antes de nomear a valva.',
      ),
      d(
        'Marcapasso definitivo com eletrodos',
        'Exigiria gerador em bolsa subcutânea e eletrodos com trajeto venoso terminando nas câmaras direitas. Não há gerador nem fios contínuos partindo dele — apenas materiais fixos, sem trajeto.',
      ),
    ],
  },

  'protese-valvar-mitral': {
    cenario: 'Serviço de imagem',
    identificacao: 'Homem de 63 anos, encaminhado para tomografia.',
    queixa: 'Investigação de nódulo pulmonar detectado em exame prévio.',
    historia:
      'Encaminhado para tomografia de tórax para caracterizar nódulo visto em radiografia de rotina. Assintomático do ponto de vista respiratório. Relata cirurgia cardíaca há sete anos por doença valvar reumática, com boa evolução, e uso contínuo de anticoagulante oral.',
    antecedentes: [
      'Troca valvar por doença reumática há 7 anos',
      'Anticoagulação oral contínua, com controle de INR',
      'Ex-tabagista, 15 anos-maço',
      'Sem sintomas respiratórios atuais',
    ],
    vitais: { pa: '124 × 74 mmHg', fc: '70 bpm', fr: '15 irpm', satO2: '97% em ar ambiente', temp: '36,2 °C' },
    exame: [
      'Cicatriz mediana de esternotomia',
      'Clique metálico protossistólico audível',
      'Ausculta pulmonar limpa',
      'Sem sinais de congestão',
    ],
    pedido:
      'Imagem de planejamento (scout) da tomografia: reconhecer o material implantado antes da aquisição dos cortes.',
    pergunta: 'Nesta projeção de planejamento, que material está identificado e onde?',
    achado: 'Prótese valvar mitral',
    veredito: 'Prótese valvar mitral com fios de esternotomia, reconhecidos no scout da tomografia',
    correlacao:
      'A projeção de planejamento da tomografia não é uma radiografia diagnóstica — tem resolução menor e técnica diferente — mas serve perfeitamente para reconhecer material metálico. Os fios medianos indicam a via de acesso, e o anel denso, projetado mais inferior e posterior em relação ao plano aórtico, identifica a posição mitral. Saber disso antes dos cortes importa também na prática: próteses metálicas geram artefato de endurecimento do feixe que degrada a imagem ao redor.',
    distratores: [
      d(
        'Prótese valvar aórtica',
        'É a confusão esperada e depende inteiramente da topografia: a aórtica se projeta mais alta e anterior, acima da linha que une o ângulo esternal ao ápice cardíaco. Rotação e incidência deslocam essas referências, o que exige cautela em qualquer projeção não padronizada.',
      ),
      d(
        'Anel de anuloplastia tricúspide',
        'Anéis de anuloplastia são menos densos, incompletos e ficam mais à direita, na topografia da valva tricúspide. A estrutura aqui é fechada, densa e projetada à esquerda da linha média.',
      ),
      d(
        'Corpo estranho na parede torácica',
        'Objeto de parede não respeita topografia valvar nem acompanha o movimento cardíaco, e costuma ser irregular. Este material tem forma anelar regular, característica de prótese.',
      ),
    ],
  },

  'marcapasso-ocultando-massa': {
    cenario: 'Ambulatório de cardiologia',
    identificacao: 'Homem de 72 anos, portador de marcapasso.',
    queixa: 'Revisão anual do dispositivo, sem queixas cardiológicas.',
    historia:
      'Marcapasso implantado há três anos por doença do nó sinusal, funcionando bem. Refere tosse seca ocasional que atribui ao "tempo seco" e leve perda de apetite. Nega dor torácica, palpitações, síncope ou dispneia significativa. Ex-tabagista.',
    antecedentes: [
      'Marcapasso definitivo há 3 anos, por doença do nó sinusal',
      'Ex-tabagista, 30 anos-maço, parou há 10 anos',
      'Hipertensão arterial controlada',
      'Sem rastreamento de câncer de pulmão prévio',
    ],
    vitais: { pa: '130 × 78 mmHg', fc: '68 bpm', fr: '16 irpm', satO2: '96% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Gerador palpável em região infraclavicular esquerda, sem sinais inflamatórios',
      'Ausculta pulmonar sem alterações',
      'Sem linfonodomegalias palpáveis',
      'Sem baqueteamento digital',
    ],
    pedido:
      'Radiografia de rotina para conferir eletrodos e integridade do sistema em paciente com marcapasso.',
    pergunta: 'Os eletrodos estão íntegros. Há algo mais no filme?',
    achado: 'Opacidade pulmonar na borda do gerador',
    veredito: 'Pequena opacidade pulmonar junto à margem do gerador — lesão parcialmente encoberta pelo dispositivo',
    correlacao:
      'O gerador é o objeto mais denso e mais chamativo do filme, e é exatamente por isso que ele é perigoso: a atenção converge para ele, confirma que os três eletrodos estão íntegros e a leitura se encerra satisfeita. Na borda do gerador, porém, há uma opacidade pulmonar de contorno próprio, que não pertence ao dispositivo. Em ex-tabagista de 72 anos, essa opacidade precisa de tomografia — e o seguimento deste mesmo paciente mostra o que acontece quando ela é ignorada.',
    distratores: [
      d(
        'Radiografia normal apenas com o marcapasso',
        'É a leitura que a satisfação de busca produz e o motivo de este caso existir. A regra prática é obrigatória: depois de identificar qualquer dispositivo, revise deliberadamente o parênquima e os ossos que ele encobre.',
      ),
      d(
        'Sombra do próprio gerador no pulmão',
        'O gerador tem densidade metálica homogênea e bordas retas, e não produz opacidade de densidade intermediária adjacente. Esta opacidade tem contorno independente e continua visível fora do contorno do dispositivo.',
      ),
      d(
        'Hematoma da loja do gerador',
        'Coleção na bolsa subcutânea fica no plano da parede torácica, é superficial e ocorre nas semanas seguintes ao implante — não três anos depois, e não com contorno dentro do campo pulmonar.',
      ),
    ],
  },

  'marcapasso-com-massa-pulmonar': {
    cenario: 'Ambulatório de cardiologia',
    identificacao: 'Homem de 73 anos, o mesmo paciente, um ano depois.',
    queixa: 'Tosse persistente e perda de peso desde a última consulta.',
    historia:
      'Voltou para revisão anual do marcapasso. No intervalo, a tosse seca tornou-se diária e perdeu 8 kg sem dieta. Refere cansaço novo e dor surda no ombro esquerdo. Não realizou a tomografia sugerida no ano anterior por dificuldade de agendamento.',
    antecedentes: [
      'Marcapasso definitivo há 4 anos',
      'Opacidade pulmonar descrita na radiografia do ano anterior, sem investigação complementar',
      'Ex-tabagista, 30 anos-maço',
      'Perda ponderal de 8 kg em 12 meses',
    ],
    vitais: { pa: '126 × 76 mmHg', fc: '70 bpm', fr: '19 irpm', satO2: '94% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Redução do murmúrio vesicular no terço superior esquerdo',
      'Gerador de marcapasso em posição habitual',
      'Perda de massa muscular evidente',
      'Sem linfonodomegalias cervicais palpáveis',
    ],
    pedido:
      'Comparação com a radiografia do ano anterior em paciente com perda ponderal e tosse persistente.',
    pergunta: 'Comparando com o exame anterior, qual é o achado?',
    achado: 'Massa pulmonar em crescimento',
    veredito: 'Massa pulmonar adjacente ao gerador, com crescimento em relação ao exame anterior',
    correlacao:
      'O que era uma opacidade discreta na borda do gerador tornou-se massa evidente, com contorno próprio independente do dispositivo. A comparação com o exame anterior é o que transforma uma imagem em informação: crescimento documentado num intervalo de doze meses, em ex-tabagista com perda ponderal, define a urgência da investigação. A tomografia realizada em seguida demonstrou doença já inoperável à época da primeira radiografia — o custo de a leitura ter parado no marcapasso.',
    distratores: [
      d(
        'Consolidação pneumônica recente',
        'Pneumonia se instala em dias e responde a antibiótico, com contexto febril. Esta lesão tem um ano de história documentada, cresceu progressivamente e vem com perda ponderal — evolução incompatível com processo infeccioso agudo.',
      ),
      d(
        'Artefato ampliado do gerador',
        'Artefatos não crescem entre exames e não mudam de forma. O contorno da lesão avança sobre o parênquima, independentemente da posição do dispositivo, que permanece o mesmo.',
      ),
      d(
        'Massa nova sem correspondente anterior',
        'A comparação mostra o contrário, e essa distinção importa: reconhecer que a lesão já estava presente muda o estadiamento presumido, a expectativa de ressecabilidade e a lição sobre leitura sistemática.',
      ),
    ],
  },

  'eletrodo-de-marcapasso-fraturado': {
    cenario: 'Pronto-socorro',
    identificacao: 'Mulher de 80 anos, portadora de marcapasso.',
    queixa: 'Tontura, cansaço intenso e um episódio de quase-síncope hoje.',
    historia:
      'Portadora de marcapasso há nove anos. Nas últimas semanas voltou a sentir tontura ao levantar e cansaço para atividades que fazia sem dificuldade. Hoje quase desmaiou ao caminhar. A telemetria do dispositivo mostrou falha intermitente de captura. Vem sentada, dispneica.',
    antecedentes: [
      'Marcapasso definitivo há 9 anos, sem troca de eletrodos',
      'Insuficiência cardíaca com internações prévias',
      'Hipertensão arterial de longa data',
      'Falha intermitente de captura na telemetria',
    ],
    vitais: { pa: '108 × 64 mmHg', fc: '44 bpm (intermitente)', fr: '24 irpm', satO2: '92% em ar ambiente', temp: '36,2 °C' },
    exame: [
      'Bradicardia intermitente, com pausas perceptíveis ao pulso',
      'Turgência jugular presente',
      'Estertores finos em bases',
      'Edema de membros inferiores ++/4+',
    ],
    pedido:
      'Falha de captura do marcapasso com quase-síncope: examinar a integridade do sistema de estimulação.',
    pergunta: 'Que alteração do sistema de estimulação a radiografia mostra?',
    achado: 'Fratura do eletrodo de marcapasso',
    veredito: 'Fratura do eletrodo de marcapasso — descontinuidade do fio, com cardiomegalia e congestão associadas',
    correlacao:
      'Falha de captura tem causas elétricas que a imagem não vê e causas mecânicas que ela vê muito bem — e a fratura do condutor é a principal delas, favorecida por nove anos de flexões repetidas na transição entre clavícula e primeira costela. A interrupção da linha radiopaca explica a bradicardia intermitente e a quase-síncope. E, como sempre, a leitura continua: a silhueta muito aumentada e os vasos superiores ingurgitados correspondem à congestão que o exame físico já mostrava.',
    distratores: [
      d(
        'Deslocamento da ponta do eletrodo',
        'Também causa falha de captura e é diferencial legítimo, mas se manifesta como ponta fora da posição habitual na câmara, com trajeto íntegro. O trajeto aqui é que está rompido.',
      ),
      d(
        'Sobreposição simulando descontinuidade',
        'Cautela justa: costela, clavícula e o próprio gerador podem cruzar o fio e simular interrupção. A confirmação exige outra projeção ou ampliação — e é por isso que a suspeita radiográfica deve ser correlacionada com a telemetria, que aqui já mostra falha de captura.',
      ),
      d(
        'Esgotamento da bateria do gerador',
        'É causa comum de disfunção em dispositivo com nove anos e deve ser verificada, mas não produz achado radiográfico: a bateria se avalia por telemetria, não por imagem.',
      ),
    ],
  },
}

// ══════════════════════════════════ Pneumotórax ══════════════════════════════════

const PNEUMOTORAX: Record<string, VinhetaClinica> = {
  'pneumotorax-hipertensivo': {
    cenario: 'Sala vermelha',
    identificacao: 'Homem de 25 anos, entregador, vítima de colisão de moto.',
    queixa: 'Falta de ar intensa e dor torácica à esquerda após trauma.',
    historia:
      'Colidiu com um carro em velocidade moderada há trinta minutos. Chegou consciente, muito agitado, referindo dor no lado esquerdo do tórax e falta de ar que piora rapidamente. Durante o atendimento inicial tornou-se progressivamente mais taquipneico e agitado.',
    antecedentes: [
      'Previamente hígido',
      'Trauma torácico fechado há 30 minutos',
      'Sem doença pulmonar prévia',
      'Sem uso de medicações',
    ],
    vitais: { pa: '82 × 54 mmHg', fc: '138 bpm', fr: '38 irpm', satO2: '82% sob máscara com reservatório', temp: '36,0 °C' },
    exame: [
      'Murmúrio vesicular abolido em todo o hemitórax esquerdo',
      'Hipertimpanismo à percussão do mesmo lado',
      'Traqueia desviada para a direita, turgência jugular presente',
      'Extremidades frias, tempo de enchimento capilar prolongado',
    ],
    pedido:
      'Instabilidade hemodinâmica com murmúrio abolido e hipertimpanismo unilateral. A radiografia é registrada, mas a decisão terapêutica não a aguarda.',
    pergunta: 'Que achado o filme confirma — e qual é o erro de conduta que ele não pode induzir?',
    achado: 'Pneumotórax hipertensivo',
    veredito: 'Pneumotórax hipertensivo à esquerda — colapso pulmonar total com desvio mediastinal contralateral',
    correlacao:
      'O hemitórax esquerdo está hipertransparente e sem trama vascular, o pulmão comprimido junto ao hilo, a traqueia e o coração deslocados para a direita e o hemidiafragma esquerdo deprimido. O ar entra no espaço pleural e não sai; a pressão positiva colapsa o pulmão, torce as veias cavas e reduz o retorno venoso — daí a hipotensão com turgência jugular, que é choque obstrutivo. O erro que este filme não pode induzir é o de existir: pneumotórax hipertensivo é diagnóstico clínico, e a descompressão não deve esperar imagem.',
    distratores: [
      d(
        'Pneumotórax simples de grande volume',
        'A diferença não é o tamanho, é a repercussão: aqui há desvio mediastinal contralateral, depressão diafragmática, hipotensão e turgência jugular. Sem esses sinais, seria simples — com eles, é uma emergência que exige agulha ou dedo antes do dreno.',
      ),
      d(
        'Ruptura diafragmática com herniação',
        'Também causa hipertransparência e desvio mediastinal no trauma, e é diferencial importante. Mas o conteúdo herniado tem paredes, haustrações ou nível hidroaéreo, e frequentemente a sonda nasogástrica aparece dentro do tórax. Aqui o espaço é uniformemente aéreo.',
      ),
      d(
        'Enfisema bolhoso gigante',
        'Bolha pode ocupar um hemitórax e simular pneumotórax, com o risco grave de drenar o pulmão. Mas ocorre em pacientes com doença enfisematosa, não em jovem hígido, e não desvia agudamente o mediastino nem causa choque em trinta minutos.',
      ),
    ],
  },

  'tamanho-do-pneumotorax': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 22 anos, estudante, alto e magro.',
    queixa: 'Dor súbita no peito à direita e falta de ar há quatro horas.',
    historia:
      'Estava sentado estudando quando sentiu pontada súbita no hemitórax direito, seguida de falta de ar que melhorou parcialmente em repouso. Nega trauma, esforço ou tosse prévia. É a primeira vez que isso acontece. Fuma cigarro eletrônico diariamente.',
    antecedentes: [
      'Biótipo longilíneo, sem doença pulmonar diagnosticada',
      'Uso diário de cigarro eletrônico',
      'Sem trauma recente',
      'Primeiro episódio, sem cirurgias prévias',
    ],
    vitais: { pa: '124 × 74 mmHg', fc: '96 bpm', fr: '22 irpm', satO2: '95% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Murmúrio vesicular reduzido no hemitórax direito, mais evidente no ápice',
      'Hipertimpanismo à percussão do terço superior direito',
      'Sem desvio traqueal, sem turgência jugular',
      'Hemodinamicamente estável, falando frases completas',
    ],
    pedido:
      'Pneumotórax espontâneo primário: além de confirmar, é preciso dimensionar a coleção para decidir entre observação, aspiração e drenagem.',
    pergunta: 'Como se mede este pneumotórax, e o que a medida significa?',
    achado: 'Pneumotórax grande ao nível do hilo',
    veredito: 'Pneumotórax grande — separação superior a 2 cm entre pulmão e parede no nível do hilo',
    correlacao:
      'A regra britânica clássica considera grande a separação maior que 2 cm medida no nível do hilo, e essa medida orienta a conduta. Mas ela tem uma condição de validade que costuma ser esquecida: só se aplica quando a borda pulmonar é aproximadamente paralela à parede torácica. Se a compressão for irregular, com coleções localizadas, a medida hilar subestima o volume. E o número nunca decide sozinho: sintomas, reserva pulmonar e recorrência pesam tanto quanto os centímetros.',
    distratores: [
      d(
        'Pneumotórax pequeno e apical',
        'Coleção apical isolada tem menos de 2 cm no nível do hilo e frequentemente permite conduta expectante com oxigênio. A medida aqui, feita no plano correto, ultrapassa esse limite — e a diferença muda a decisão terapêutica.',
      ),
      d(
        'Pneumotórax hipertensivo',
        'Exigiria desvio mediastinal contralateral, depressão diafragmática e instabilidade hemodinâmica. O paciente está estável, com traqueia centrada e falando frases completas: é grande, não hipertensivo.',
      ),
      d(
        'Bolha enfisematosa gigante',
        'Bolha tem parede própria, contorno côncavo em relação à parede torácica e não acompanha o ápice ao longo da pleura. Além disso não se instala de forma súbita com dor pleurítica em quatro horas.',
      ),
    ],
  },

  'pneumotorax-sutil': {
    cenario: 'Pronto-socorro',
    identificacao: 'Mulher de 31 anos, professora de educação física.',
    queixa: 'Dor no ombro direito e desconforto respiratório leve há um dia.',
    historia:
      'Sentiu pontada no ombro e na base do pescoço à direita durante uma aula, com leve desconforto ao inspirar fundo. Não interrompeu as atividades. Procurou o serviço no dia seguinte porque a dor persistiu. Nega trauma, tosse ou febre.',
    antecedentes: [
      'Hígida, atleta',
      'Sem tabagismo',
      'Sem doença pulmonar prévia',
      'Sem procedimentos torácicos recentes',
    ],
    vitais: { pa: '116 × 72 mmHg', fc: '82 bpm', fr: '18 irpm', satO2: '97% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Ausculta pulmonar praticamente simétrica, com discreta redução no ápice direito',
      'Percussão sem alterações evidentes',
      'Sem enfisema subcutâneo palpável',
      'Estável, sem taquipneia',
    ],
    pedido:
      'Dor pleurítica sem alterações significativas ao exame: procurar ativamente linha pleural em todos os campos, especialmente nos ápices.',
    pergunta: 'O exame parece normal à primeira vista. Que achado a busca dirigida encontra?',
    achado: 'Pneumotórax pequeno e sutil',
    veredito: 'Pneumotórax pequeno e sutil — linha pleural visceral fina, sem trama vascular além dela',
    correlacao:
      'Quando o exame físico é quase normal e a queixa é pleurítica, a radiografia precisa ser interrogada e não apenas olhada: percorre-se deliberadamente o ápice e as margens laterais procurando uma linha fina como traço de lápis. Encontrada a linha, o critério que confirma é a ausência de trama vascular além dela — o espaço entre a linha e a parede está vazio. A radiografia expiratória não acrescenta benefício rotineiro; em dúvida persistente, a tomografia resolve.',
    distratores: [
      d(
        'Prega cutânea simulando linha pleural',
        'É o imitador mais comum e o que mais gera dreno desnecessário. A prega é uma borda de densidade que se prolonga para fora do gradil costal e, decisivamente, tem trama vascular dos dois lados. A linha pleural termina no gradil e tem vazio de um lado.',
      ),
      d(
        'Borda medial da escápula sobreposta',
        'Também produz linha vertical no campo superior, mas pode ser seguida para fora do tórax até o contorno escapular, e não acompanha a curvatura do ápice pulmonar.',
      ),
      d(
        'Bolha enfisematosa de parede fina',
        'Bolha tem parede curva com concavidade voltada para a parede torácica e não segue o contorno pleural. Em mulher jovem, atleta e não tabagista, é hipótese improvável — mas confundir as duas antes de drenar pode causar dano grave.',
      ),
    ],
  },

  'grande-pneumotorax-tensao-inicial': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 28 anos, pintor.',
    queixa: 'Dor torácica direita súbita e falta de ar há duas horas, piorando.',
    historia:
      'Dor iniciada em repouso, seguida de dispneia progressiva. Chegou andando, mas nos últimos vinte minutos ficou visivelmente mais taquipneico e ansioso, com dificuldade para completar frases. Nega trauma. Fumante de longa data para a idade.',
    antecedentes: [
      'Tabagista, 10 anos-maço',
      'Sem doença pulmonar diagnosticada',
      'Sem episódios prévios semelhantes',
      'Sem uso de medicações',
    ],
    vitais: { pa: '104 × 62 mmHg', fc: '124 bpm', fr: '32 irpm', satO2: '88% em ar ambiente', temp: '36,1 °C' },
    exame: [
      'Murmúrio vesicular abolido em todo o hemitórax direito',
      'Hipertimpanismo à percussão direita',
      'Traqueia discretamente desviada para a esquerda',
      'Taquicardia, extremidades ainda quentes, jugulares discretamente ingurgitadas',
    ],
    pedido:
      'Pneumotórax extenso com sinais incipientes de repercussão: definir se há tensão em instalação.',
    pergunta: 'Os desvios são discretos. Isso permite adiar a conduta?',
    achado: 'Grande pneumotórax com tensão inicial',
    veredito: 'Grande pneumotórax direito com sinais iniciais de tensão — desvio cardíaco, hemidiafragma deprimido e traqueia discretamente desviada',
    correlacao:
      'O filme mostra deslocamentos modestos: coração empurrado para a esquerda, hemidiafragma direito discretamente rebaixado e traqueia levemente desviada. A tentação é considerar que "ainda não está hipertensivo" e ganhar tempo. Mas a pressão intrapleural sobe de forma não linear e a deterioração pode ser rápida — o paciente já piorou em vinte minutos, com taquicardia e queda de saturação. A prioridade é via aérea, ventilação, circulação e ajuda imediata, não a discussão terminológica sobre o rótulo.',
    distratores: [
      d(
        'Pneumotórax simples apto a observação',
        'Observação isolada só cabe em coleções pequenas e pacientes estáveis. Aqui há colapso extenso, hipoxemia, taquicardia e desvios já presentes — a trajetória é de piora, e ela já se manifestou durante o atendimento.',
      ),
      d(
        'Enfisema bolhoso unilateral',
        'Bolha não desvia o mediastino agudamente nem se instala em duas horas com dor pleurítica. E drená-la como pneumotórax pode causar fístula persistente — motivo pelo qual a distinção importa.',
      ),
      d(
        'Hérnia diafragmática à direita',
        'Cursa com estruturas abdominais no tórax, o que exige conteúdo com paredes e gás intestinal identificável, além de contexto traumático ou congênito. O hemitórax aqui é uniformemente aéreo, sem conteúdo.',
      ),
    ],
  },

  'dreno-toracico': {
    cenario: 'Enfermaria',
    identificacao: 'Homem de 28 anos, o mesmo paciente, após drenagem.',
    queixa: 'Reavaliação após inserção de dreno torácico.',
    historia:
      'Submetido à drenagem torácica em selo d\'água há seis horas. Refere melhora importante da falta de ar logo após o procedimento. O sistema oscila com a respiração e houve borbulhamento nas primeiras horas, que cessou. Mantém dor no sítio do dreno.',
    antecedentes: [
      'Pneumotórax espontâneo direito drenado há 6 horas',
      'Tabagista, 10 anos-maço',
      'Sem intercorrências durante o procedimento',
      'Sistema em selo d\'água, oscilando',
    ],
    vitais: { pa: '122 × 74 mmHg', fc: '84 bpm', fr: '18 irpm', satO2: '96% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Murmúrio vesicular recuperado em quase todo o hemitórax direito',
      'Dreno fixado em quinto espaço intercostal, linha axilar média',
      'Sem enfisema subcutâneo palpável',
      'Curativo limpo, sem sinais inflamatórios',
    ],
    pedido:
      'Radiografia de controle pós-drenagem: confirmar reexpansão pulmonar e a posição do dreno, incluindo seus orifícios laterais.',
    pergunta: 'O que a radiografia de controle demonstra após a drenagem?',
    achado: 'Reexpansão com pneumotórax residual',
    veredito: 'Reexpansão pulmonar com dreno torácico posicionado e pneumotórax residual mínimo no ápice',
    correlacao:
      'O pulmão voltou a preencher o hemitórax e resta apenas uma pequena coleção apical — desfecho esperado e que não exige, por si só, nova intervenção. A leitura do dreno tem quatro perguntas: onde está a ponta, onde estão os orifícios laterais, o trajeto é contínuo e sem dobras, e há material fora do espaço pleural. O último orifício lateral precisa estar dentro da cavidade; se ficar entre os planos da parede, o sistema aspira ar do subcutâneo e produz enfisema subcutâneo em vez de drenar.',
    distratores: [
      d(
        'Orifício do dreno fora da cavidade',
        'É a complicação a procurar, e se manifesta com enfisema subcutâneo progressivo e drenagem ineficaz. Aqui o pulmão reexpandiu, o borbulhamento cessou e não há ar nos tecidos moles — o funcionamento está adequado.',
      ),
      d(
        'Pneumotórax persistente de grande volume',
        'Coleção residual apical mínima não é o mesmo que falha de drenagem. Falha manteria separação significativa ao longo da parede lateral, com borbulhamento contínuo e sem recuperação da ausculta.',
      ),
      d(
        'Edema de reexpansão',
        'É complicação real da reexpansão rápida de pulmão colapsado por muito tempo, e apareceria como opacidade alveolar no pulmão reexpandido, com hipoxemia. O parênquima aqui está aerado e a saturação melhorou.',
      ),
    ],
  },

  'enfisema-subcutaneo': {
    cenario: 'Enfermaria',
    identificacao: 'Mulher de 45 anos, com dreno torácico há dois dias.',
    queixa: 'Inchaço no pescoço e na parede do tórax, com sensação de estalido à palpação.',
    historia:
      'Drenada por pneumotórax secundário. Nas últimas doze horas notou o pescoço "inchando" e a face começando a ficar volumosa, com voz alterada. A equipe percebeu crepitação à palpação e redução do borbulhamento no sistema, com piora do desconforto respiratório.',
    antecedentes: [
      'Pneumotórax secundário drenado há 2 dias',
      'Doença pulmonar crônica de base',
      'Sem trauma adicional após o procedimento',
      'Dreno com fixação frouxa observada na manhã de hoje',
    ],
    vitais: { pa: '128 × 78 mmHg', fc: '98 bpm', fr: '24 irpm', satO2: '91% em ar ambiente', temp: '36,6 °C' },
    exame: [
      'Crepitação à palpação de pescoço, parede torácica e região supraclavicular, semelhante a plástico-bolha',
      'Edema de face e pálpebras',
      'Murmúrio vesicular reduzido à direita',
      'Dreno com aparente exteriorização parcial',
    ],
    pedido:
      'Enfisema subcutâneo progressivo em paciente drenada: avaliar posição do dreno e a possibilidade de coleção pleural subjacente.',
    pergunta: 'Que achado a radiografia mostra nos tecidos moles — e o que ele pode estar escondendo?',
    achado: 'Enfisema subcutâneo extenso',
    veredito: 'Enfisema subcutâneo extenso após drenagem — ar dissecando planos da parede torácica e do pescoço',
    correlacao:
      'O ar disseca os planos fasciais e desenha lucências lineares que contornam feixes musculares, produzindo o padrão em "penas" sobre a parede e o pescoço. A causa aqui é mecânica: o dreno se exteriorizou parcialmente e um orifício lateral passou a ficar fora da cavidade pleural, aspirando ar para o subcutâneo em vez de retirá-lo do tórax. E há um risco de leitura: enfisema extenso aumenta a transparência da parede e pode mascarar um pneumotórax subjacente que continua crescendo.',
    distratores: [
      d(
        'Pneumomediastino isolado',
        'Também produz lucências lineares e pode dissecar para o pescoço, mas o gás contorna estruturas mediastinais e desloca a pleura mediastinal como linha branca fina. Aqui o ar está predominantemente nos planos da parede torácica, e há uma causa mecânica identificada.',
      ),
      d(
        'Resolução completa do pneumotórax',
        'É a conclusão perigosa: a hipertransparência da parede pode simular pulmão bem aerado e esconder ar pleural residual. Com dreno disfuncional, presumir resolução é justamente o que não se pode fazer.',
      ),
      d(
        'Necrose de tecidos moles com gás',
        'Infecção por germes produtores de gás cursa com toxemia, febre alta, dor intensa desproporcional e alterações cutâneas — quadro clínico completamente diferente do desta paciente, afebril e com causa mecânica evidente.',
      ),
    ],
  },

  'pneumotorax-iatrogenico': {
    cenario: 'Enfermaria de clínica médica',
    identificacao: 'Homem de 69 anos, submetido a toracocentese.',
    queixa: 'Dor torácica e piora da falta de ar logo após o procedimento.',
    historia:
      'Realizada toracocentese diagnóstica e de alívio à direita há uma hora, com retirada de 900 mL de líquido. Durante o procedimento houve tosse intensa. Logo depois passou a referir dor à direita e piora do desconforto respiratório, ao contrário da melhora esperada.',
    antecedentes: [
      'Derrame pleural direito em investigação',
      'Toracocentese realizada há 1 hora',
      'Sem doença pulmonar obstrutiva conhecida',
      'Sem anticoagulação',
    ],
    vitais: { pa: '126 × 76 mmHg', fc: '100 bpm', fr: '24 irpm', satO2: '90% em ar ambiente', temp: '36,5 °C' },
    exame: [
      'Murmúrio vesicular reduzido em todo o hemitórax direito',
      'Hipertimpanismo no terço superior e macicez na base, à direita',
      'Sem instabilidade hemodinâmica',
      'Curativo do sítio de punção limpo',
    ],
    pedido:
      'Piora respiratória imediatamente após punção pleural: procurar pneumotórax iatrogênico e caracterizar o líquido residual.',
    pergunta: 'Há interface horizontal na base direita. O que isso indica?',
    achado: 'Hidropneumotórax pós-toracocentese',
    veredito: 'Hidropneumotórax após toracocentese — ar e líquido coexistindo, com nível hidroaéreo horizontal',
    correlacao:
      'Depois de qualquer instrumentação pleural, procurar pneumotórax é obrigatório — e a piora paradoxal do paciente já anuncia. O detalhe que fecha o raciocínio é a forma da interface: derrame isolado forma menisco, com concavidade superior, porque o líquido sobe pela parede por capilaridade contra o pulmão expandido. Quando existe ar acima, essa força desaparece e a interface fica reta e horizontal. Nível horizontal no espaço pleural significa duas fases — ar e líquido.',
    distratores: [
      d(
        'Derrame pleural residual isolado',
        'Explicaria a macicez basal, mas não a hipertransparência superior nem, principalmente, a interface horizontal. O menisco do derrame isolado tem concavidade voltada para cima, e não é o que se vê.',
      ),
      d(
        'Abscesso pulmonar com nível hidroaéreo',
        'Também produz nível horizontal, mas dentro de uma cavidade de paredes espessas circunscritas ao parênquima, com febre e toxemia. Aqui o nível se estende por toda a largura do hemitórax, o que caracteriza espaço pleural.',
      ),
      d(
        'Hérnia hiatal volumosa',
        'Produz nível hidroaéreo retrocardíaco, contido por parede gástrica identificável e em topografia mediastinal posterior — não na periferia do hemitórax, e sem relação temporal com a punção.',
      ),
    ],
  },

  'pneumotorax-bilateral-na-dpoc': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 71 anos, com doença pulmonar obstrutiva grave.',
    queixa: 'Piora súbita da falta de ar há seis horas.',
    historia:
      'Convive com dispneia aos mínimos esforços e usa oxigênio domiciliar. Hoje a falta de ar piorou de forma abrupta, sem febre e sem aumento de secreção. Refere dor mal localizada nos dois lados do tórax. Já teve várias exacerbações, mas descreve esta como diferente.',
    antecedentes: [
      'Doença pulmonar obstrutiva crônica grave, com enfisema e múltiplas bolhas',
      'Oxigenoterapia domiciliar contínua',
      'Ex-tabagista, 60 anos-maço',
      'Internações prévias por exacerbação',
    ],
    vitais: { pa: '138 × 82 mmHg', fc: '116 bpm', fr: '30 irpm', satO2: '84% sob O₂ suplementar', temp: '36,3 °C' },
    exame: [
      'Tórax em tonel, com hipertimpanismo difuso bilateral',
      'Murmúrio vesicular globalmente reduzido, difícil de comparar entre os lados',
      'Uso de musculatura acessória, respiração com lábios semicerrados',
      'Sem desvio traqueal palpável',
    ],
    pedido:
      'Piora abrupta em doença pulmonar avançada: procurar pneumotórax em ambos os lados, não apenas onde a ausculta parece pior.',
    pergunta: 'Encontrado ar pleural de um lado, a busca deve parar?',
    achado: 'Pneumotórax bilateral',
    veredito: 'Pneumotórax bilateral em enfisema grave — bordas pulmonares visíveis nos dois hemitórax',
    correlacao:
      'Em pulmão enfisematoso a ausculta já é reduzida de base e a percussão já é hipertimpânica, o que torna o exame físico pouco discriminativo — a comparação entre os lados perde valor justamente quando mais se precisa dela. Por isso a regra: encontrar pneumotórax de um lado não encerra a busca. Aqui há borda pulmonar visível nos dois hemitórax, entre bolhas de paredes curvas. E o contexto importa: com reserva pulmonar mínima, mesmo coleções pequenas têm grande repercussão clínica.',
    distratores: [
      d(
        'Pneumotórax unilateral',
        'É a leitura incompleta que o caso previne. Hiperinsuflação por enfisema não produz borda pulmonar definida com ausência de trama além dela — e essa borda está presente dos dois lados.',
      ),
      d(
        'Bolhas sem pneumotórax',
        'As bolhas existem e tornam a leitura difícil, mas a parede de bolha é curva com concavidade voltada para a parede torácica, enquanto a pleura visceral acompanha o contorno do pulmão. Quando a distinção não é possível, a tomografia é o caminho — drenar uma bolha causa dano grave.',
      ),
      d(
        'Exacerbação infecciosa',
        'Explicaria piora da dispneia, mas viria com aumento e mudança de aspecto da secreção, frequentemente febre, e instalação em dias. Esta piora foi abrupta, em horas, sem secreção nova.',
      ),
    ],
  },

  'pseudopneumotorax-bolha': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 64 anos, enfisematoso.',
    queixa: 'Dispneia habitual, encaminhado com suspeita de pneumotórax.',
    historia:
      'Veio encaminhado de uma unidade básica com radiografia sugerindo "pneumotórax à esquerda" e indicação de drenagem. O paciente refere que a falta de ar é a mesma de sempre, sem piora súbita, e que já ouviu falar de "bolhas no pulmão" em exames anteriores. Não trouxe as imagens antigas, mas há registros no sistema.',
    antecedentes: [
      'Enfisema pulmonar avançado, com bolhas descritas em tomografia prévia',
      'Ex-tabagista, 50 anos-maço',
      'Radiografias anteriores disponíveis no sistema do hospital',
      'Sem piora aguda dos sintomas',
    ],
    vitais: { pa: '130 × 80 mmHg', fc: '86 bpm', fr: '20 irpm', satO2: '92% em ar ambiente (habitual do paciente)', temp: '36,4 °C' },
    exame: [
      'Hipertimpanismo difuso, sem assimetria nítida',
      'Murmúrio globalmente reduzido, estável em relação a avaliações prévias',
      'Sem desvio traqueal, sem turgência jugular',
      'Sem taquipneia significativa, falando frases completas',
    ],
    pedido:
      'Suspeita de pneumotórax encaminhada para drenagem: confirmar ou afastar antes de qualquer procedimento invasivo.',
    pergunta: 'A hipertransparência à esquerda justifica a drenagem imediata?',
    achado: 'Bolha gigante simulando pneumotórax',
    veredito: 'Bolha enfisematosa gigante simulando pneumotórax — pseudopneumotórax, sem indicação de dreno',
    correlacao:
      'Três elementos separam a bolha do ar pleural. A curvatura: a parede da bolha é convexa em relação ao hilo e côncava em relação à parede torácica, enquanto a linha pleural acompanha o contorno do pulmão. A trama: dentro de bolha podem persistir septos e vasos finos atravessando, o que não existe no espaço pleural. E o tempo: comparação com exames anteriores mostrando estabilidade praticamente resolve a questão. Somando isso a um paciente sem piora aguda, drenar seria criar uma fístula broncopleural em quem não tinha problema nenhum.',
    distratores: [
      d(
        'Pneumotórax com indicação de drenagem',
        'É a conclusão do serviço que encaminhou, e o erro que o caso existe para prevenir. Faltam os elementos que sustentariam o diagnóstico: linha pleural acompanhando o contorno pulmonar, ausência absoluta de trama além dela e — sobretudo — mudança clínica aguda.',
      ),
      d(
        'Pneumotórax hipertensivo iminente',
        'Exigiria desvio mediastinal, hemidiafragma deprimido e comprometimento hemodinâmico. O paciente está estável, com traqueia centrada e saturação no valor habitual dele.',
      ),
      d(
        'Cavidade tuberculosa gigante',
        'Cavidade tem parede espessa e irregular, costuma ser apical e vir com nódulos satélites, cicatrizes e sintomas constitucionais. A bolha tem parede finíssima, quase imperceptível, e parênquima vizinho apenas comprimido.',
      ),
    ],
  },
}

// ══════════════════════════════════ Câncer de pulmão ══════════════════════════════════

const CANCER: Record<string, VinhetaClinica> = {
  'massa-versus-consolidacao': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Homem de 63 anos, marceneiro.',
    queixa: 'Tosse há dois meses e cansaço, sem melhora com antibiótico.',
    historia:
      'Tratou o que foi chamado de pneumonia há seis semanas, com melhora parcial e retorno dos sintomas. Mantém tosse seca, cansaço e febre baixa esporádica. Perdeu 5 kg. A radiografia de controle "continua alterada", motivo do encaminhamento.',
    antecedentes: [
      'Tabagista, 40 anos-maço',
      'Um curso de antibiótico com resposta apenas parcial',
      'Sem imunossupressão',
      'Sem tratamento prévio para tuberculose',
    ],
    vitais: { pa: '132 × 80 mmHg', fc: '88 bpm', fr: '19 irpm', satO2: '94% em ar ambiente', temp: '37,0 °C' },
    exame: [
      'Redução localizada do murmúrio vesicular no campo médio direito',
      'Sem sopro tubário evidente',
      'Sem linfonodomegalias supraclaviculares',
      'Sem baqueteamento digital',
    ],
    pedido:
      'Alteração radiográfica persistente após antibiótico em tabagista: descrever o padrão sem presumir a causa.',
    pergunta: 'A opacidade é arredondada e bem delimitada. O que a radiografia permite afirmar sobre a etiologia?',
    achado: 'Massa pulmonar de etiologia indefinida',
    veredito: 'Massa pulmonar — o padrão descreve a lesão, mas a radiografia não distingue neoplasia de infecção',
    correlacao:
      'A resposta honesta desta questão é sobre os limites do método. Massa arredondada e consolidação podem, ambas, representar câncer; e ambas podem representar infecção. O que a radiografia entrega é a descrição — localização, tamanho, contorno, densidade, presença de cavitação, efeito sobre estruturas vizinhas — e é isso que deve constar do laudo. Etiologia se define por evolução, tomografia, broncoscopia e histologia. Em tabagista de 40 anos-maço com perda ponderal e resposta parcial ao antibiótico, a probabilidade pré-teste de neoplasia é alta, mas probabilidade não é diagnóstico.',
    distratores: [
      d(
        'Pneumonia arredondada a retratar',
        'Repetir antibiótico diante de lesão persistente é o erro que mais atrasa diagnóstico de câncer. A pneumonia arredondada existe, sobretudo em crianças, mas não se assume em adulto tabagista com perda de peso e resposta incompleta ao primeiro tratamento.',
      ),
      d(
        'Nódulo benigno para seguimento anual',
        'A distinção de tamanho é operacional e importa: nódulo tem até 3 cm, massa é maior — e o limiar existe justamente porque a probabilidade de malignidade sobe com o diâmetro. Uma massa não entra em seguimento anual, entra em investigação.',
      ),
      d(
        'Tuberculose pulmonar em atividade',
        'É diferencial obrigatório no Brasil e pode produzir massa ou consolidação persistente. Mas ela também não é diagnosticada por imagem: exige pesquisa de bacilo no escarro e teste molecular rápido, que fazem parte da mesma investigação.',
      ),
    ],
  },

  'massa-hilar-e-derrame': {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 67 anos, tabagista.',
    queixa: 'Falta de ar progressiva há um mês e tosse com sangue.',
    historia:
      'Dispneia que evoluiu de grandes para pequenos esforços em quatro semanas, com tosse seca e escarro com raias de sangue em várias ocasiões. Perdeu 10 kg em três meses e refere sudorese noturna. Nega febre alta.',
    antecedentes: [
      'Tabagista, 50 anos-maço, ainda fumando',
      'Hemoptise recorrente de pequeno volume',
      'Perda ponderal de 10 kg em 3 meses',
      'Sem tratamento oncológico prévio',
    ],
    vitais: { pa: '128 × 78 mmHg', fc: '104 bpm', fr: '24 irpm', satO2: '90% em ar ambiente', temp: '36,7 °C' },
    exame: [
      'Murmúrio abolido no terço inferior direito, com macicez à percussão',
      'Frêmito toracovocal reduzido na base direita',
      'Linfonodo supraclavicular direito endurecido, aderido, de 2,5 cm',
      'Emagrecimento acentuado',
    ],
    pedido:
      'Hemoptise com perda ponderal e adenopatia supraclavicular: avaliar hilos, mediastino e espaço pleural.',
    pergunta: 'Comparando os dois hilos, qual é o achado — e o que o acompanha?',
    achado: 'Massa hilar direita com derrame',
    veredito: 'Massa hilar direita com adenopatia paratraqueal e derrame pleural — apagamento da faixa paratraqueal e menisco',
    correlacao:
      'Hilos normais são assimétricos em formato, mas semelhantes em densidade e volume, e a comparação deve ser feita nesses termos. Aqui o hilo direito está maior e mais denso, e as estruturas vasculares que normalmente o compõem deixaram de ser individualizáveis — sinal de que algo sólido ocupou o espaço. Acima, os linfonodos alargam o mediastino e apagam a faixa paratraqueal direita; abaixo, o seio costofrênico forma menisco. É a tríade de doença hilar avançada, e o linfonodo supraclavicular palpável oferece o alvo de biópsia mais acessível.',
    distratores: [
      d(
        'Artéria pulmonar direita proeminente',
        'Vaso aumentado se prolonga em ramos que podem ser seguidos até a periferia e mantém contorno vascular. A opacidade aqui apaga a arquitetura vascular do hilo em vez de continuá-la — e não explica a faixa paratraqueal apagada.',
      ),
      d(
        'Pneumonia com derrame parapneumônico',
        'Explicaria opacidade basal e líquido, mas não o hilo denso com perda de arquitetura nem a adenopatia paratraqueal — e o quadro é subagudo, com perda ponderal e hemoptise, não febril agudo.',
      ),
      d(
        'Tuberculose ganglionar com derrame',
        'Diferencial legítimo, capaz de produzir adenopatia hilar e derrame. O que inclina a balança é o conjunto: 50 anos-maço, hemoptise, idade e linfonodo supraclavicular endurecido e aderido. A definição, em ambos os casos, é histológica.',
      ),
    ],
  },

  'massa-cavitada': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Homem de 70 anos, ex-tabagista, revascularizado.',
    queixa: 'Tosse com expectoração há dois meses e febre baixa intermitente.',
    historia:
      'Tosse produtiva com expectoração por vezes com odor desagradável, febre baixa vespertina e perda de 6 kg. Já usou dois antibióticos diferentes com melhora transitória. Nega dor torácica anginosa e mantém boa tolerância aos esforços habituais.',
    antecedentes: [
      'Revascularização miocárdica prévia, por esternotomia',
      'Ex-tabagista, 45 anos-maço',
      'Dois cursos de antibiótico sem resolução',
      'Sem imunossupressão conhecida',
    ],
    vitais: { pa: '134 × 82 mmHg', fc: '90 bpm', fr: '19 irpm', satO2: '94% em ar ambiente', temp: '37,4 °C' },
    exame: [
      'Sopro anfórico audível no terço superior direito',
      'Redução do murmúrio na mesma região',
      'Cicatriz mediana de esternotomia',
      'Sem linfonodomegalias palpáveis',
    ],
    pedido:
      'Lesão pulmonar persistente com febre baixa e perda de peso: caracterizar contorno, parede e conteúdo.',
    pergunta: 'A lesão tem centro escavado. O que a espessura e o contorno da parede sugerem?',
    achado: 'Massa pulmonar cavitada',
    veredito: 'Massa pulmonar cavitada — necrose central com parede espessa e irregular',
    correlacao:
      'Tumores sólidos crescem além da própria vascularização, necrosam no centro e drenam o material necrótico pelo brônquio, deixando uma cavidade. A parede é o dado que orienta: espessa e irregular, com nódulo mural, favorece neoplasia — o carcinoma escamoso é o que mais cavita; fina e regular favorece processo infeccioso ou bolha infectada. Mas favorecer não é definir: abscesso e vasculite também cavitam, e só clínica, tomografia e histologia fecham. Os fios e clipes são de revascularização prévia e não têm relação com a lesão.',
    distratores: [
      d(
        'Abscesso pulmonar',
        'É o diferencial mais próximo e clinicamente plausível, com expectoração fétida e febre. A parede do abscesso costuma ser mais lisa por dentro e ele responde a antibiótico com redução progressiva — dois cursos sem resolução, com perda ponderal, deslocam a suspeita.',
      ),
      d(
        'Caverna tuberculosa',
        'Cavitação tuberculosa é tipicamente apical ou no segmento superior do lobo inferior, com nódulos satélites e disseminação broncogênica ao redor. Continua sendo obrigatório pesquisar bacilo, mas a topografia e o padrão aqui não são os clássicos.',
      ),
      d(
        'Bolha enfisematosa infectada',
        'Bolha tem parede finíssima e o nível hidroaéreo dentro dela aparece sem massa sólida associada. A parede espessa e irregular com componente sólido não corresponde a esse padrão.',
      ),
    ],
  },

  'colapso-lobar-sinal-s-dourado': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Mulher de 65 anos, tabagista.',
    queixa: 'Tosse persistente e chiado localizado há dois meses.',
    historia:
      'Tosse seca que não cede, com sensação de chiado que ela localiza "de um lado só" — algo que nunca havia notado. Refere cansaço novo e perda de 6 kg. Fez tratamento para asma sem qualquer melhora. Nega febre.',
    antecedentes: [
      'Tabagista, 40 anos-maço',
      'Tratamento empírico para asma sem resposta',
      'Sibilância localizada, unilateral',
      'Perda ponderal de 6 kg',
    ],
    vitais: { pa: '130 × 78 mmHg', fc: '88 bpm', fr: '20 irpm', satO2: '93% em ar ambiente', temp: '36,5 °C' },
    exame: [
      'Sibilo localizado e fixo no terço superior direito, que não muda com a tosse',
      'Redução do murmúrio no mesmo território',
      'Ausculta contralateral normal',
      'Sem linfonodomegalias palpáveis',
    ],
    pedido:
      'Sibilância fixa e unilateral sem resposta a broncodilatador: procurar obstrução brônquica central.',
    pergunta: 'A fissura horizontal está elevada e tem uma convexidade focal. Que sinal é esse?',
    achado: 'Colapso lobar com S de Golden',
    veredito: 'Colapso do lobo superior direito com sinal do S dourado — massa central deformando a fissura elevada',
    correlacao:
      'Sibilo fixo, unilateral e que não muda com a tosse é obstrução de via aérea central, não broncoespasmo difuso — por isso o tratamento para asma falhou. No filme, a perda de volume eleva a fissura horizontal, e a massa que obstrui o brônquio do lobo superior direito empurra a porção medial dessa fissura para baixo, criando uma convexidade. A soma das duas curvaturas desenha um S invertido, e esse sinal é altamente sugestivo de neoplasia central. Note que o sinal indireto costuma ser mais evidente que a própria massa.',
    distratores: [
      d(
        'Colapso lobar por rolha de secreção',
        'É a causa mais comum de atelectasia em pacientes internados ou pós-operados, mas incomum como explicação isolada em adulto ambulatorial com perda de peso. E rolha não produz a convexidade focal que deforma a fissura — isso exige massa.',
      ),
      d(
        'Derrame pleural encistado na fissura',
        'Coleção intrafissural produz opacidade lenticular de bordas suaves acompanhando o trajeto da fissura, sem perda de volume lobar e sem elevação da fissura como um todo.',
      ),
      d(
        'Espessamento pleural apical',
        'Fica na periferia do ápice, não desloca a fissura horizontal e não produz o contorno em S. Também não explicaria sibilância fixa por obstrução brônquica.',
      ),
    ],
  },

  'paralisia-do-nervo-frenico': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Homem de 68 anos, em seguimento de nódulo pulmonar.',
    queixa: 'Retorno de seguimento, com cansaço novo há dois meses.',
    historia:
      'Havia um pequeno nódulo próximo ao hilo direito em exame realizado há dezoito meses, na época interpretado como achado a acompanhar. O paciente não retornou nas datas marcadas. Agora refere cansaço que piora ao deitar e perda de 7 kg.',
    antecedentes: [
      'Nódulo hilar direito documentado há 18 meses, sem seguimento adequado',
      'Ex-tabagista, 35 anos-maço',
      'Hemidiafragma direito normal no exame anterior',
      'Perda ponderal recente',
    ],
    vitais: { pa: '132 × 80 mmHg', fc: '92 bpm', fr: '21 irpm', satO2: '92% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Murmúrio vesicular reduzido na base direita',
      'Redução da expansibilidade do hemitórax direito',
      'Dispneia que piora em decúbito dorsal',
      'Sem edema, sem turgência jugular',
    ],
    pedido:
      'Comparação com o exame de dezoito meses atrás em paciente com nódulo previamente documentado.',
    pergunta: 'Comparando os dois exames, que mudança indica progressão?',
    achado: 'Progressão tumoral com paralisia frênica',
    veredito: 'Progressão tumoral com paralisia frênica — massa que cresceu até o hilo, com nova elevação do hemidiafragma',
    correlacao:
      'A comparação seriada é o instrumento mais potente da radiografia de tórax, e aqui ela mostra duas coisas: o nódulo cresceu até se tornar massa em contato com o hilo e a borda cardíaca, e o hemidiafragma direito, antes normal, subiu. Essa elevação nova é o sinal de que o nervo frênico foi invadido ou comprimido — e explica a dispneia que piora ao deitar, quando o conteúdo abdominal empurra a cúpula paralisada. Uma alteração do hemidiafragma pode ser a primeira pista de progressão, antes mesmo de sintomas respiratórios francos.',
    distratores: [
      d(
        'Elevação diafragmática por má inspiração',
        'É a checagem correta, porque inspiração incompleta eleva ambas as cúpulas. Mas aqui a elevação é unilateral, é nova em relação a um exame anterior adequado e acompanha crescimento tumoral documentado.',
      ),
      d(
        'Derrame pleural subpulmonar à direita',
        'Simula elevação diafragmática e muda com o decúbito, o que permite distingui-lo. Também não explicaria o crescimento da massa hilar nem a evolução em dezoito meses.',
      ),
      d(
        'Hepatomegalia elevando a cúpula',
        'Produz elevação da cúpula, mas seria acompanhada de fígado palpável e de alterações hepáticas ao exame. Não há hepatomegalia, e a massa hilar contígua ao nervo frênico oferece explicação direta.',
      ),
    ],
    imagem: 2,
  },

  'destruicao-ossea': {
    cenario: 'Ambulatório de ortopedia',
    identificacao: 'Homem de 62 anos, encanador.',
    queixa: 'Dor no ombro direito há três meses, sem melhora com fisioterapia.',
    historia:
      'A dor começou como incômodo ao levantar o braço e virou dor contínua, que acorda à noite e não melhora com anti-inflamatório nem com dez sessões de fisioterapia. Refere que não faz esforço diferente do habitual. Perdeu 7 kg no período e tem tosse seca leve, que não valoriza.',
    antecedentes: [
      'Tabagista, 40 anos-maço',
      'Dor de ritmo não mecânico, com piora noturna',
      'Fisioterapia sem resposta',
      'Perda ponderal de 7 kg em 3 meses',
    ],
    vitais: { pa: '134 × 84 mmHg', fc: '86 bpm', fr: '18 irpm', satO2: '95% em ar ambiente', temp: '36,5 °C' },
    exame: [
      'Dor à palpação da parede torácica anterossuperior direita, com abaulamento discreto',
      'Amplitude de movimento do ombro preservada, com dor em toda a amplitude',
      'Murmúrio vesicular reduzido no ápice direito',
      'Sem sinais inflamatórios locais',
    ],
    pedido:
      'Dor de ritmo inflamatório sem resposta a tratamento conservador, com perda de peso: investigar parede torácica e ápice pulmonar.',
    pergunta: 'A dor não é do ombro. Que achado o filme mostra?',
    achado: 'Massa pulmonar com destruição costal',
    veredito: 'Massa pulmonar com destruição da terceira e quarta costelas — invasão direta da parede torácica',
    correlacao:
      'Dor que não respeita o movimento, acorda à noite e não responde a fisioterapia não é dor mecânica de ombro. No filme, a massa do campo superior direito atravessa a pleura e destrói segmentos costais, e é essa invasão que explica a dor — o osso é ricamente inervado no periósteo. A lição de leitura é revisar deliberadamente as costelas atrás de qualquer massa e nos ápices: a destruição óssea muda o estadiamento e frequentemente é a manifestação dominante do tumor de sulco superior.',
    distratores: [
      d(
        'Tendinopatia do manguito rotador',
        'É o diagnóstico presumido que levou à fisioterapia e o motivo do atraso. Dor do manguito é mecânica, piora em arcos específicos de movimento e melhora em repouso — não acorda o paciente todas as noites nem vem com perda ponderal.',
      ),
      d(
        'Fratura patológica sem lesão primária',
        'A falha cortical existe, mas há massa de partes moles contígua ao osso, o que identifica a origem: a lesão pulmonar invadiu a parede. Descrever apenas a fratura perderia o essencial.',
      ),
      d(
        'Espessamento pleural apical benigno',
        'Capuz pleural apical é fino, de contorno regular, geralmente bilateral e não destrói costelas. Destruição cortical com massa é achado agressivo por definição.',
      ),
    ],
  },

  'resposta-a-radioterapia': {
    cenario: 'Ambulatório de oncologia',
    identificacao: 'Mulher de 70 anos, em seguimento após radioterapia.',
    queixa: 'Reavaliação após tratamento, assintomática.',
    historia:
      'Tinha nódulo pulmonar de contorno espiculado no campo médio direito, confirmado por biópsia como carcinoma. Por comorbidades, foi tratada com radioterapia estereotáxica em vez de cirurgia. Concluiu o tratamento há quatro meses e vem para controle. Não refere tosse, dor ou perda de peso.',
    antecedentes: [
      'Carcinoma pulmonar confirmado por biópsia',
      'Radioterapia estereotáxica concluída há 4 meses',
      'Comorbidades que contraindicaram ressecção cirúrgica',
      'Sem sintomas respiratórios atuais',
    ],
    vitais: { pa: '128 × 76 mmHg', fc: '76 bpm', fr: '17 irpm', satO2: '96% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Ausculta pulmonar sem ruídos adventícios',
      'Sem linfonodomegalias palpáveis',
      'Peso estável desde o fim do tratamento',
      'Sem dor à palpação da parede torácica',
    ],
    pedido:
      'Controle pós-radioterapia estereotáxica: comparar dimensões da lesão com o exame pré-tratamento.',
    pergunta: 'Comparando com o exame anterior, o que aconteceu com a lesão?',
    achado: 'Redução da lesão após radioterapia',
    veredito: 'Redução significativa do nódulo espiculado após radioterapia — resposta ao tratamento',
    correlacao:
      'As margens espiculadas eram o achado que motivou a biópsia: espículas representam extensão do tumor ao longo de septos e linfáticos e têm alto valor preditivo de malignidade. No controle, a lesão diminuiu de forma expressiva. A comparação precisa seguir regras para valer: mesma incidência, mesma técnica quando possível, e medida do mesmo eixo. E há um cuidado permanente no seguimento — a fibrose actínica que se desenvolve no território irradiado pode mascarar ou simular recidiva nos exames seguintes.',
    distratores: [
      d(
        'Progressão com aumento de dimensões',
        'A comparação mostra o oposto, e é justamente a comparação — e não a impressão sobre um único filme — que estabelece a direção da mudança. Ler o exame atual isoladamente não permitiria essa conclusão.',
      ),
      d(
        'Resolução completa da lesão',
        'Redução expressiva não é o mesmo que desaparecimento, e a diferença importa: resposta parcial mantém a paciente em vigilância ativa, com controle por imagem em intervalos definidos.',
      ),
      d(
        'Fibrose actínica substituindo a lesão',
        'Alterações actínicas realmente surgem no território irradiado e podem coexistir. Mas fibrose tem contorno retrátil e geométrico, acompanhando o campo de tratamento, e não é o que caracteriza a mudança de tamanho da lesão medida aqui.',
      ),
    ],
    imagem: 3,
  },

  'progressao-da-doenca': {
    cenario: 'Ambulatório de oncologia',
    identificacao: 'Homem de 66 anos, em quimioterapia.',
    queixa: 'Piora do cansaço e da tosse após período de melhora.',
    historia:
      'Diagnosticado com carcinoma pulmonar com massa hilar, iniciou quimioterapia e teve boa resposta nos primeiros três meses, com melhora dos sintomas. No quarto mês voltou a piorar: tosse aumentou, o cansaço retornou e surgiu desconforto torácico. Perdeu novamente peso.',
    antecedentes: [
      'Carcinoma pulmonar com massa hilar, em quimioterapia',
      'Resposta documentada aos 3 meses de tratamento',
      'Paralisia frênica persistente desde o diagnóstico',
      'Piora clínica no quarto mês',
    ],
    vitais: { pa: '120 × 74 mmHg', fc: '100 bpm', fr: '24 irpm', satO2: '90% em ar ambiente', temp: '36,6 °C' },
    exame: [
      'Murmúrio reduzido em base esquerda, com macicez',
      'Hemidiafragma elevado à esquerda, mantido desde o diagnóstico',
      'Redução da expansibilidade à esquerda',
      'Emagrecimento progressivo',
    ],
    pedido:
      'Piora clínica após resposta inicial: comparar a série de exames para documentar recidiva e definir extensão.',
    pergunta: 'Na série temporal, que achados caracterizam a progressão?',
    achado: 'Recidiva com extensão pleuromediastinal',
    veredito: 'Recidiva com consolidação distal, perda de volume, derrame pleural e extensão mediastinal',
    correlacao:
      'A série conta uma história em capítulos: a massa hilar respondeu à quimioterapia, mas a paralisia frênica persistiu — sinal indireto que não regride porque o nervo já estava lesado. Depois vem a recidiva, com consolidação distal à obstrução, fissura que sobe acompanhando a perda de volume, derrame pleural e extensão para o mediastino contralateral. A regra prática que o caso ensina: compare sempre na mesma ordem, use fissuras e hemidiafragma para julgar volume, e pleura e mediastino para julgar extensão. Resposta parcial não encerra vigilância.',
    distratores: [
      d(
        'Pneumonia pós-obstrutiva isolada',
        'Consolidação distal à obstrução realmente ocorre e faz parte do quadro, mas não explica o derrame progressivo nem a extensão mediastinal contralateral. Tratar apenas a infecção deixaria a progressão sem resposta.',
      ),
      d(
        'Manutenção da resposta ao tratamento',
        'A comparação seriada mostra aumento de massa, novo derrame e nova perda de volume. A melhora dos três primeiros meses não se sustenta no quarto, e é exatamente isso que a série documenta.',
      ),
      d(
        'Derrame pleural de origem cardíaca',
        'Faltam cardiomegalia, redistribuição vascular e linhas septais, e o derrame surge junto com crescimento tumoral documentado. Atribuí-lo ao coração adiaria a mudança de linha terapêutica.',
      ),
    ],
    imagem: 4,
  },

  'metastases-do-pulmao': {
    cenario: 'Ambulatório de oncologia',
    identificacao: 'Mulher de 61 anos, com câncer de pulmão conhecido.',
    queixa: 'Dor nas costelas à direita e piora do cansaço há um mês.',
    historia:
      'Em acompanhamento por carcinoma pulmonar. Refere dor localizada em um ponto do gradil costal direito, que piora à respiração profunda e à palpação, além de cansaço crescente. Não houve trauma. Nega febre.',
    antecedentes: [
      'Carcinoma pulmonar primário conhecido',
      'Dor óssea localizada de início recente',
      'Sem trauma no período',
      'Estadiamento em atualização',
    ],
    vitais: { pa: '124 × 76 mmHg', fc: '94 bpm', fr: '20 irpm', satO2: '93% em ar ambiente', temp: '36,5 °C' },
    exame: [
      'Dor exquisita à palpação de um ponto do sexto arco costal direito, com abaulamento',
      'Murmúrio vesicular reduzido difusamente',
      'Sem sinais flogísticos na parede torácica',
      'Emagrecimento',
    ],
    pedido:
      'Dor óssea localizada em paciente oncológica: avaliar disseminação pulmonar e óssea.',
    pergunta: 'Que padrão de disseminação a radiografia documenta?',
    achado: 'Metástases pulmonares e costal',
    veredito: 'Metástases do câncer pulmonar — nódulos no pulmão contralateral e lesão expansiva de costela',
    correlacao:
      'Um tumor pulmonar dissemina por duas vias que a radiografia consegue mostrar: pelo próprio pulmão, gerando nódulos múltiplos inclusive no lado oposto, e pelo osso, invadindo ou metastatizando para o gradil. A expansão focal do sexto arco costal direito corresponde exatamente ao ponto de dor exquisita à palpação — a correlação entre o dedo e a imagem é o que dá segurança ao achado. Ainda assim, nem todo nódulo adicional é metástase, e a tomografia é necessária para caracterizar número, tamanho e localização.',
    distratores: [
      d(
        'Fratura costal patológica sem lesão',
        'A alteração aqui é expansiva, com remodelamento do arco costal — o osso está sendo substituído, não apenas rompido. Descrever só a fratura perderia a natureza da lesão.',
      ),
      d(
        'Nódulos por êmbolos sépticos',
        'Êmbolos sépticos produzem nódulos periféricos, frequentemente cavitados, num contexto de febre alta, endocardite ou foco infeccioso a distância. A paciente é afebril e tem neoplasia conhecida.',
      ),
      d(
        'Granulomas calcificados residuais',
        'Granulomas são densos, calcificados, pequenos e estáveis por anos, sem lesão óssea associada. Nada disso corresponde a nódulos novos com lesão costal expansiva dolorosa.',
      ),
    ],
    imagem: 2,
  },

  'metastases-para-o-pulmao': {
    cenario: 'Ambulatório de oncologia',
    identificacao: 'Homem de 58 anos, nefrectomizado há três anos.',
    queixa: 'Tosse seca e cansaço há dois meses.',
    historia:
      'Operou o rim direito por tumor renal há três anos e vinha em seguimento irregular. Há dois meses começou tosse seca e cansaço aos esforços, sem febre. Perdeu 5 kg. Nega hemoptise e dor torácica.',
    antecedentes: [
      'Nefrectomia por carcinoma de células renais há 3 anos',
      'Seguimento oncológico irregular',
      'Sem tabagismo significativo',
      'Perda ponderal de 5 kg',
    ],
    vitais: { pa: '136 × 84 mmHg', fc: '88 bpm', fr: '20 irpm', satO2: '93% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Ausculta pulmonar com murmúrio presente, sem ruídos adventícios significativos',
      'Cicatriz de lombotomia à direita',
      'Sem linfonodomegalias periféricas',
      'Sem baqueteamento digital',
    ],
    pedido:
      'Sintomas respiratórios em paciente com neoplasia renal prévia: procurar disseminação hematogênica pulmonar.',
    pergunta: 'Os nódulos são múltiplos, bilaterais e de tamanhos variados. O padrão identifica o tumor primário?',
    achado: 'Metástases hematogênicas pulmonares',
    veredito: 'Metástases pulmonares hematogênicas — nódulos múltiplos e bilaterais, em "bala de canhão"',
    correlacao:
      'A distribuição bilateral, aleatória, com predomínio periférico e basal e nódulos de tamanhos diferentes é a assinatura da via hematogênica: cada nódulo nasceu de um êmbolo tumoral em momento distinto, e por isso os diâmetros não coincidem. O carcinoma de células renais é classicamente associado a metástases grandes e arredondadas, chamadas de "bala de canhão" — mas a aparência sugere a via de disseminação, não identifica o primário. Um paciente com nefrectomia há três anos e este padrão precisa de tomografia e reestadiamento.',
    distratores: [
      d(
        'Câncer de pulmão primário multifocal',
        'Primário multifocal é bem menos frequente que doença metastática num paciente com neoplasia prévia conhecida. E o padrão de nódulos arredondados bilaterais de tamanhos variados é típico de disseminação hematogênica, não de tumor sincrônico.',
      ),
      d(
        'Tuberculose miliar',
        'O padrão miliar é de micronódulos de 1 a 3 mm, uniformes em tamanho e distribuídos homogeneamente por todos os campos — justamente o contrário de nódulos grandes e de dimensões variadas.',
      ),
      d(
        'Nódulos reumatoides pulmonares',
        'Ocorrem em artrite reumatoide de longa data, com doença articular evidente, são geralmente periféricos, podem cavitar e não vêm com perda ponderal e neoplasia prévia.',
      ),
    ],
    imagem: 2,
  },

  'armadilha-massa-retrocardiaca': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Homem de 64 anos, tabagista.',
    queixa: 'Tosse seca há três meses, com radiografia "normal" há um mês.',
    historia:
      'Procurou atendimento há um mês pela mesma tosse e foi liberado com radiografia considerada normal. A tosse persiste, agora com cansaço leve e perda de 4 kg. Retorna insatisfeito, dizendo que "alguma coisa não está certa".',
    antecedentes: [
      'Tabagista, 45 anos-maço',
      'Radiografia anterior laudada como normal',
      'Perda ponderal de 4 kg em 3 meses',
      'Sem tratamento oncológico prévio',
    ],
    vitais: { pa: '134 × 82 mmHg', fc: '84 bpm', fr: '18 irpm', satO2: '95% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Ausculta pulmonar sem alterações evidentes',
      'Sem linfonodomegalias palpáveis',
      'Sem baqueteamento digital',
      'Emagrecimento discreto',
    ],
    pedido:
      'Tosse persistente em tabagista com radiografia prévia considerada normal: revisar deliberadamente as zonas cegas do filme.',
    pergunta: 'À primeira vista o filme parece normal. Onde está o achado?',
    achado: 'Massa pulmonar retrocardíaca',
    veredito: 'Massa pulmonar retrocardíaca — lesão do lobo inferior esquerdo oculta pela silhueta cardíaca',
    correlacao:
      'Existem regiões do filme onde a densidade de fundo é alta e a percepção falha: atrás do coração, atrás dos hemidiafragmas, nos ápices sobrepostos às clavículas e nos hilos. Este caso mora na primeira delas. A massa arredondada do lobo inferior esquerdo se projeta sobre o coração e só aparece a quem procura por aumento focal de densidade através da silhueta cardíaca e por assimetria retrocardíaca. Não é a imagem que muda entre um exame e outro — é o olhar.',
    distratores: [
      d(
        'Radiografia sem alterações',
        'Foi a conclusão do exame anterior, e é o erro perceptivo que o caso demonstra. Aumentar brilho e contraste apenas no centro dos campos pulmonares reforça a falha: a revisão precisa incluir explicitamente as zonas de sobreposição.',
      ),
      d(
        'Duplo contorno por átrio esquerdo',
        'O átrio aumentado produz duplo contorno que acompanha a curva atrial e vem acompanhado de carina alargada e apêndice atrial convexo. Esta densidade é arredondada, de contorno próprio, e não segue a anatomia de nenhuma câmara.',
      ),
      d(
        'Hérnia hiatal',
        'É causa comum de densidade retrocardíaca, mas costuma conter gás e apresentar nível hidroaéreo, e não tem contorno sólido homogêneo. A ausência de conteúdo aéreo afasta a hipótese.',
      ),
    ],
  },

  'armadilha-massa-subdiafragmatica': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Mulher de 66 anos, ex-tabagista.',
    queixa: 'Tosse persistente e dois episódios de escarro hemoptoico.',
    historia:
      'Tosse há dois meses, com dois episódios de escarro com sangue. Fez radiografia em outro serviço, laudada como sem alterações significativas. Refere cansaço leve e perda de 3 kg. Preocupada com a hemoptise, procurou segunda opinião.',
    antecedentes: [
      'Ex-tabagista, 30 anos-maço, parou há 5 anos',
      'Radiografia prévia sem alterações descritas',
      'Escarro hemoptoico em duas ocasiões',
      'Sem anticoagulação',
    ],
    vitais: { pa: '128 × 78 mmHg', fc: '82 bpm', fr: '18 irpm', satO2: '95% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Ausculta pulmonar sem ruídos adventícios',
      'Sem dor à palpação da parede torácica',
      'Sem linfonodomegalias',
      'Abdome sem massas palpáveis',
    ],
    pedido:
      'Hemoptise em ex-tabagista com radiografia prévia normal: revisar recessos costofrênicos e o pulmão projetado abaixo da cúpula diafragmática.',
    pergunta: 'A lesão está fora dos campos pulmonares habituais. Onde ela se esconde?',
    achado: 'Massa pulmonar abaixo da cúpula',
    veredito: 'Massa pulmonar projetada abaixo da cúpula diafragmática — lesão espiculada e cavitada no recesso posterior',
    correlacao:
      'A cúpula diafragmática não marca o limite inferior do pulmão: na periferia, sobretudo posteriormente, o parênquima desce bem abaixo dela, nos recessos costofrênicos. Uma lesão nessa região se projeta sobre os tecidos moles do abdome superior e desaparece para quem só varre a área entre as clavículas e as cúpulas. Vista com atenção, a massa tem margens espiculadas e cavitação — características de alta suspeição. A regra prática: em toda radiografia, percorrer também o que está abaixo do diafragma no filme.',
    distratores: [
      d(
        'Densidade de origem abdominal',
        'É a leitura que perde o diagnóstico. Uma densidade abaixo da cúpula pode ser pulmonar, e o que a identifica é o contorno próprio, independente das vísceras abdominais, e a presença de espículas e cavitação — características parenquimatosas.',
      ),
      d(
        'Elevação do hemidiafragma direito',
        'Alteraria a posição da cúpula, mantendo seu contorno convexo e liso. Aqui a cúpula está em posição habitual e existe uma opacidade adicional com borda própria projetada sob ela.',
      ),
      d(
        'Hérnia diafragmática com alça intestinal',
        'Conteúdo herniado teria gás, haustrações ou pregas identificáveis e paredes próprias. A lesão é sólida, com centro escavado — cavitação de massa, não alça intestinal.',
      ),
    ],
    imagem: 2,
  },
}

// ══════════════════════════════════ Mediastino ══════════════════════════════════

const MEDIASTINO: Record<string, VinhetaClinica> = {
  'massa-mediastinal-anterior': {
    cenario: 'Ambulatório de neurologia',
    identificacao: 'Mulher de 44 anos, bancária.',
    queixa: 'Queda das pálpebras e visão dupla no fim do dia, há quatro meses.',
    historia:
      'Nota que as pálpebras "pesam" à tarde e que a visão duplica quando está cansada, melhorando após repouso. Nas últimas semanas passou a se engasgar com líquidos no jantar e a sentir os braços fracos ao secar o cabelo. Os sintomas são claramente piores no fim do dia.',
    antecedentes: [
      'Sintomas com padrão de fatigabilidade, poupando o período da manhã',
      'Sem doença tireoidiana diagnosticada',
      'Sem tabagismo',
      'Investigação para miastenia gravis em curso',
    ],
    vitais: { pa: '114 × 72 mmHg', fc: '76 bpm', fr: '16 irpm', satO2: '98% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Ptose palpebral bilateral que piora ao olhar fixo para cima',
      'Diplopia à manutenção do olhar lateral',
      'Fraqueza proximal de membros superiores que piora à repetição do movimento',
      'Reflexos preservados, sem alterações sensitivas',
    ],
    pedido:
      'Suspeita de miastenia gravis: rastrear massa em mediastino anterior, dada a associação com timoma.',
    pergunta: 'Que linhas mediastinais permanecem visíveis — e o que isso diz sobre a localização da massa?',
    achado: 'Massa mediastinal anterior',
    veredito: 'Massa mediastinal anterior — timoma, com preservação das linhas dos compartimentos médio e posterior',
    correlacao:
      'A radiografia frontal não tem profundidade, mas tem uma ferramenta que a substitui: o sinal da silhueta. Uma massa só apaga o contorno de estruturas que estão no mesmo plano que ela. Aqui os contornos mediastinais abaúlam, mas o botão aórtico, a linha ázigo-esofágica e a aorta descendente continuam visíveis — nenhuma delas está encostada na massa, o que a coloca à frente de todas. Em paciente com quadro de fatigabilidade sugestivo de miastenia, massa anterior é timoma até que a tomografia diga o contrário.',
    distratores: [
      d(
        'Massa mediastinal posterior',
        'Massa posterior apaga a linha da aorta descendente e a linha paravertebral, porque encosta nelas. Essas linhas estão preservadas — a lesão não pode estar naquele compartimento.',
      ),
      d(
        'Adenopatia hilar bilateral',
        'Alteração hilar altera densidade e tamanho dos hilos e apaga a arquitetura vascular local. Aqui os hilos estão preservados e o abaulamento se faz nos contornos mediastinais superiores e médios.',
      ),
      d(
        'Bócio mergulhante',
        'É a outra grande causa de massa mediastinal anterior e superior, e o diferencial é razoável. Mas o bócio tipicamente estreita e desvia a traqueia no nível da massa e apaga a faixa paratraqueal ali, além de ser contíguo à tireoide cervical — sinais que este caso não apresenta.',
      ),
    ],
  },

  'massa-mediastinal-superior': {
    cenario: 'Ambulatório de hematologia',
    identificacao: 'Homem de 31 anos, professor.',
    queixa: 'Suores noturnos, febre e emagrecimento há dois meses.',
    historia:
      'Acorda com o pijama encharcado quase toda noite, tem febre vespertina sem foco aparente e perdeu 11 kg em dois meses. Nota "caroços" no pescoço que apareceram no período e que não doem. Refere prurido difuso, sem lesões de pele.',
    antecedentes: [
      'Sintomas B: febre, sudorese noturna e perda ponderal',
      'Linfonodomegalias cervicais indolores',
      'Sem imunossupressão conhecida',
      'Sem tabagismo',
    ],
    vitais: { pa: '116 × 70 mmHg', fc: '96 bpm', fr: '20 irpm', satO2: '95% em ar ambiente', temp: '37,9 °C' },
    exame: [
      'Linfonodos cervicais e supraclaviculares aumentados, elásticos, indolores e coalescentes',
      'Murmúrio reduzido nas bases, com macicez bilateral',
      'Sem hepatoesplenomegalia significativa à palpação',
      'Sem edema de face ou circulação colateral no tórax',
    ],
    pedido:
      'Sintomas B com adenopatia periférica: avaliar mediastino e espaço pleural para estadiamento inicial.',
    pergunta: 'O mediastino superior está alargado. Que estrutura desapareceu e o que isso significa?',
    achado: 'Massa mediastinal superior',
    veredito: 'Massa mediastinal superior por linfoma — alargamento com apagamento da faixa paratraqueal direita',
    correlacao:
      'A faixa paratraqueal direita é uma linha fina de tecido mole entre o ar da traqueia e o ar do pulmão; qualquer coisa que se interponha ali a espessa ou a apaga. Aqui ela desapareceu e o mediastino superior está alargado, misturando-se ao topo do botão aórtico — massa de partes moles ocupando o compartimento. Somado a sintomas B, adenopatia periférica coalescente e derrames bilaterais, o quadro aponta para linfoma; a biópsia de linfonodo, e não a imagem, dá o diagnóstico e o subtipo.',
    distratores: [
      d(
        'Alargamento apenas por técnica AP',
        'A projeção AP realmente amplia o mediastino e essa checagem é obrigatória. Mas ampliação técnica não apaga a faixa paratraqueal nem produz contorno com borda própria — ela aumenta proporcionalmente o que já existe.',
      ),
      d(
        'Bócio mergulhante',
        'Também alarga o mediastino superior, mas é contíguo à tireoide, desloca e estreita a traqueia no nível da massa e frequentemente é palpável no pescoço. O que se palpa aqui são linfonodos, não tireoide aumentada.',
      ),
      d(
        'Aneurisma de aorta torácica',
        'Produziria alargamento com contorno vascular contínuo com a aorta e frequentemente calcificação mural, num paciente mais velho e com fatores de risco. Não explicaria sintomas B nem adenopatia periférica em jovem de 31 anos.',
      ),
    ],
  },

  'massa-mediastinal-posterior': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Homem de 38 anos, motorista.',
    queixa: 'Dor nas costas há três meses e formigamento no tronco.',
    historia:
      'Dor interescapular à esquerda, contínua, que não melhora com repouso nem com anti-inflamatório, acompanhada há algumas semanas de sensação de formigamento em faixa no tronco. Nega tosse, febre ou perda de peso. Fez tratamento para "contratura muscular" sem melhora.',
    antecedentes: [
      'Dor de ritmo não mecânico, com piora noturna',
      'Parestesia em faixa no dermátomo torácico',
      'Sem trauma prévio',
      'Sem tabagismo',
    ],
    vitais: { pa: '124 × 76 mmHg', fc: '78 bpm', fr: '17 irpm', satO2: '98% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Dor à palpação profunda da região paravertebral esquerda, sem contratura',
      'Hipoestesia em faixa em dermátomo torácico à esquerda',
      'Força muscular preservada em membros inferiores',
      'Ausculta pulmonar sem alterações',
    ],
    pedido:
      'Dor dorsal de padrão inflamatório com sintoma radicular: procurar lesão no mediastino posterior e no sulco paravertebral.',
    pergunta: 'A borda cardíaca e o hilo estão preservados, mas uma linha sumiu. Qual, e o que ela localiza?',
    achado: 'Massa mediastinal posterior',
    veredito: 'Massa mediastinal posterior — apagamento da linha da aorta descendente com borda cardíaca e hilo preservados',
    correlacao:
      'O sinal da silhueta funciona por eliminação: a massa arredondada à esquerda não apaga a borda cardíaca nem os vasos hilares, o que a afasta dos compartimentos anterior e médio; mas apaga a linha da aorta descendente, com a qual precisa estar em contato. Isso a localiza no compartimento posterior, o sulco paravertebral — território dos tumores de origem neurogênica, o que combina com a dor de padrão inflamatório e a parestesia em faixa deste paciente. Uma massa "hilar" na frontal pode, portanto, ser posterior.',
    distratores: [
      d(
        'Massa hilar esquerda',
        'É a leitura que a posição na imagem frontal sugere, e a razão de o caso existir. Massa hilar apagaria os vasos do hilo e alteraria sua densidade e arquitetura — aqui o hilo continua nítido e identificável através da opacidade.',
      ),
      d(
        'Massa mediastinal anterior',
        'Massa anterior apaga a borda cardíaca esquerda, que aqui está preservada, e não teria contato com a aorta descendente. As linhas apagadas e as preservadas apontam para o compartimento oposto.',
      ),
      d(
        'Aneurisma da aorta descendente',
        'Está no lugar certo e é diferencial válido, mas seria contínuo com o contorno aórtico, com o qual formaria ângulos obtusos, e frequentemente apresenta calcificação mural. A lesão aqui tem contorno próprio, arredondado e independente.',
      ),
    ],
  },

  'aumento-hilar-unilateral': {
    cenario: 'Ambulatório de pneumologia',
    identificacao: 'Homem de 69 anos, tabagista.',
    queixa: 'Tosse crônica que mudou de padrão e rouquidão há dois meses.',
    historia:
      'Tosse de fumante de longa data que se tornou mais seca e persistente, acompanhada de rouquidão progressiva que não melhorou com repouso vocal. Perdeu 6 kg. Nega febre. Foi tratado como laringite sem resposta.',
    antecedentes: [
      'Tabagista, 50 anos-maço',
      'Rouquidão progressiva há 2 meses',
      'Tratamento para laringite sem resposta',
      'Perda ponderal de 6 kg',
    ],
    vitais: { pa: '136 × 82 mmHg', fc: '86 bpm', fr: '18 irpm', satO2: '94% em ar ambiente', temp: '36,4 °C' },
    exame: [
      'Voz rouca e bitonal, sem estridor',
      'Murmúrio vesicular discretamente reduzido no campo médio esquerdo',
      'Sem linfonodomegalias supraclaviculares palpáveis',
      'Sem baqueteamento digital',
    ],
    pedido:
      'Rouquidão persistente em tabagista: procurar lesão no trajeto do nervo laríngeo recorrente, que contorna o arco aórtico à esquerda.',
    pergunta: 'Comparando densidade e tamanho dos hilos, qual é o achado?',
    achado: 'Aumento hilar unilateral',
    veredito: 'Aumento hilar unilateral à esquerda — hilo denso, aumentado e com perda da arquitetura vascular',
    correlacao:
      'A rouquidão aponta o caminho: o nervo laríngeo recorrente esquerdo desce até o tórax e contorna o arco aórtico antes de voltar à laringe, e uma lesão na janela aortopulmonar ou no hilo esquerdo pode comprometê-lo. No filme, os hilos são comparados por densidade e volume — formato normalmente difere, densidade não. O hilo esquerdo está maior, mais denso e perdeu a arquitetura vascular normal, o que significa que algo sólido substituiu ou envolveu os vasos.',
    distratores: [
      d(
        'Artéria pulmonar esquerda proeminente',
        'É a confusão anatômica esperada, já que o hilo esquerdo é normalmente mais alto e o tronco da pulmonar pode ser saliente. A diferença está nos ramos: um vaso aumentado se prolonga em ramos rastreáveis; uma massa interrompe essa continuidade.',
      ),
      d(
        'Aumento hilar bilateral por sarcoidose',
        'Exigiria alteração dos dois hilos, tipicamente simétrica, com frequência acompanhada de adenopatia paratraqueal. Aqui apenas um hilo está alterado, e assimetria é o que mais preocupa.',
      ),
      d(
        'Consolidação peri-hilar',
        'Consolidação tem bordas mal definidas que se fundem ao parênquima e costuma apresentar broncograma aéreo, sem contorno próprio. A opacidade aqui tem borda definida e substitui a arquitetura hilar.',
      ),
    ],
  },

  'aumento-hilar-bilateral': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Mulher de 33 anos, enfermeira.',
    queixa: 'Tosse seca há dois meses, dor nas pernas e lesões na pele.',
    historia:
      'Tosse seca persistente, sem febre alta, acompanhada de nódulos dolorosos e avermelhados na face anterior das pernas, que surgiram há três semanas. Refere dor nos tornozelos e cansaço. Nega perda de peso importante e nega contato conhecido com tuberculose.',
    antecedentes: [
      'Lesões cutâneas compatíveis com eritema nodoso',
      'Artralgia de tornozelos',
      'Sem imunossupressão',
      'Sem tabagismo',
    ],
    vitais: { pa: '112 × 70 mmHg', fc: '84 bpm', fr: '18 irpm', satO2: '97% em ar ambiente', temp: '37,2 °C' },
    exame: [
      'Nódulos subcutâneos eritematosos e dolorosos em face anterior das pernas',
      'Ausculta pulmonar limpa, desproporcional à extensão radiográfica',
      'Artralgia de tornozelos sem sinais inflamatórios exuberantes',
      'Sem linfonodomegalias periféricas volumosas',
    ],
    pedido:
      'Tosse seca com eritema nodoso e artralgia: avaliar hilos e mediastino.',
    pergunta: 'Ambos os hilos estão aumentados e simétricos. Isso fecha o diagnóstico?',
    achado: 'Adenopatia hilar bilateral',
    veredito: 'Aumento hilar bilateral e simétrico — padrão clássico de sarcoidose, mas não específico',
    correlacao:
      'A tríade de eritema nodoso, artralgia e adenopatia hilar bilateral tem nome — síndrome de Löfgren — e é uma apresentação aguda da sarcoidose com bom prognóstico. A radiografia mostra o achado clássico: hilos aumentados de forma bilateral e simétrica, frequentemente com adenopatia paratraqueal direita associada. Mas "bilateral" não significa automaticamente sarcoidose: o linfoma pode produzir padrão quase idêntico, e a distinção depende de distribuição, clínica e, quando necessário, biópsia. A ausculta limpa apesar da extensão radiográfica é característica.',
    distratores: [
      d(
        'Linfoma com acometimento hilar',
        'É o diferencial que a imagem não resolve — o padrão pode ser praticamente idêntico. O que inclina para sarcoidose aqui é o conjunto clínico: eritema nodoso, artralgia, simetria e ausência de sintomas B francos.',
      ),
      d(
        'Hipertensão arterial pulmonar',
        'Aumenta os hilos de forma bilateral, mas as estruturas aumentadas são vasculares e se prolongam em ramos, com afilamento periférico abrupto. Não produz contornos nodulares nem adenopatia paratraqueal.',
      ),
      d(
        'Tuberculose ganglionar',
        'Adenopatia tuberculosa costuma ser assimétrica e unilateral, frequentemente com alterações parenquimatosas associadas, e vem com febre e perda ponderal mais evidentes. Continua sendo diferencial obrigatório no Brasil, mas a simetria não é o seu padrão.',
      ),
    ],
  },

  'fibrose-pos-radioterapia-mediastinal': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Homem de 49 anos, tratado de linfoma na juventude.',
    queixa: 'Cansaço leve e estável, em consulta de rotina.',
    historia:
      'Tratou doença de Hodgkin aos 24 anos com quimioterapia e radioterapia em manto, e está em remissão desde então. Refere apenas cansaço leve para atividades intensas, estável há anos. Nega tosse produtiva, febre, perda de peso ou sudorese noturna.',
    antecedentes: [
      'Doença de Hodgkin tratada há 25 anos, em remissão',
      'Radioterapia mediastinal em campo em manto',
      'Sem tabagismo',
      'Sem internações respiratórias',
    ],
    vitais: { pa: '122 × 76 mmHg', fc: '74 bpm', fr: '16 irpm', satO2: '96% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Ausculta com murmúrio reduzido nas regiões peri-hilares, sem crepitações',
      'Sem linfonodomegalias periféricas',
      'Peso estável há anos',
      'Sem sinais de congestão',
    ],
    pedido:
      'Consulta de rotina em sobrevivente de linfoma: distinguir sequela de tratamento de recidiva.',
    pergunta: 'Há opacidade e retração peri-hilares. Isso indica recidiva?',
    achado: 'Fibrose actínica peri-hilar',
    veredito: 'Fibrose pós-radioterapia peri-hilar — cicatrização retrátil na distribuição do campo irradiado',
    correlacao:
      'Dois elementos sustentam o diagnóstico de sequela e nenhum deles é a aparência isolada da opacidade. O primeiro é a geometria: a alteração respeita o território irradiado, com bordas que não seguem limites anatômicos de lobos ou segmentos, mas o desenho do campo de tratamento. O segundo é o comportamento no tempo: fibrose actínica estabiliza e permanece igual por anos, enquanto recidiva cresce. Sem história de radioterapia, esse diagnóstico não pode ser feito por aparência.',
    distratores: [
      d(
        'Recidiva de linfoma com massa',
        'É o que não se pode perder, e por isso a comparação com exames prévios é essencial. Recidiva produz massa com contorno convexo próprio, adenopatia e progressão documentável — não retração. E o paciente está assintomático e com peso estável há anos.',
      ),
      d(
        'Fibrose pulmonar idiopática',
        'Tem distribuição periférica e basal, com faveolamento, e progride ao longo dos anos com piora funcional. Esta alteração é peri-hilar, geométrica e estável — distribuição incompatível.',
      ),
      d(
        'Sequela de tuberculose peri-hilar',
        'Sequela tuberculosa costuma predominar em ápices e segmentos superiores, com calcificações e nódulos associados. Não desenha um campo retangular de tratamento ao redor dos hilos.',
      ),
    ],
  },

  'aumento-da-aorta': {
    cenario: 'Ambulatório de cardiologia',
    identificacao: 'Homem de 58 anos, com sopro cardíaco.',
    queixa: 'Cansaço aos esforços e um episódio de tontura ao subir escadas.',
    historia:
      'Refere que cansa mais do que os pares em atividades semelhantes e teve um episódio de tontura intensa subindo escadas, sem perda de consciência. Nega dor torácica em aperto. Um médico já havia comentado sobre um sopro no coração, nunca investigado.',
    antecedentes: [
      'Sopro cardíaco conhecido, sem investigação prévia',
      'Sem hipertensão diagnosticada',
      'Sem tabagismo significativo',
      'Sem história familiar de dissecção aórtica',
    ],
    vitais: { pa: '126 × 72 mmHg', fc: '72 bpm', fr: '16 irpm', satO2: '97% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Sopro sistólico rude em foco aórtico, com irradiação para carótidas',
      'Pulso carotídeo de ascensão lenta',
      'Segunda bulha hipofonética no foco aórtico',
      'Pulmões limpos, sem sinais de congestão',
    ],
    pedido:
      'Sopro aórtico com pulso de ascensão lenta e tontura de esforço: avaliar o contorno da aorta.',
    pergunta: 'Que segmento da aorta está alargado, e por qual mecanismo?',
    achado: 'Dilatação pós-estenótica da aorta ascendente',
    veredito: 'Dilatação pós-estenótica da aorta ascendente — alargamento do contorno superior direito',
    correlacao:
      'A semiologia já indica estenose aórtica: sopro rude com irradiação carotídea, pulso de ascensão lenta e segunda bulha hipofonética, num paciente com sopro desde sempre — quadro típico de valva aórtica bicúspide. O jato de alta velocidade que atravessa a valva estreitada bate na parede da aorta logo adiante e a dilata: é a dilatação pós-estenótica, que pode aparecer antes de qualquer cardiomegalia ou falência ventricular. Identificar o segmento acometido é o que separa este achado do aneurisma de aorta descendente.',
    distratores: [
      d(
        'Aneurisma da aorta descendente',
        'Ocupa o contorno posterior e esquerdo, projetando-se sobre a coluna e sobrepondo-se à silhueta cardíaca à esquerda. A dilatação aqui está no contorno superior direito, território da aorta ascendente — segmento diferente, mecanismo diferente.',
      ),
      d(
        'Massa mediastinal superior direita',
        'Uma massa teria borda própria e não seria contínua com o contorno aórtico. Esta dilatação se prolonga sem interrupção no restante da aorta, o que identifica sua natureza vascular.',
      ),
      d(
        'Desenrolamento senil da aorta',
        'É alongamento difuso relacionado à idade, que torna o botão mais proeminente sem dilatação focal de um segmento, e é esperado em pacientes bem mais velhos. Aqui há aumento localizado da ascendente com explicação hemodinâmica.',
      ),
      ],
    imagem: 2,
  },

  'desenrolamento-da-aorta': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Mulher de 81 anos, aposentada.',
    queixa: 'Avaliação pré-operatória para cirurgia de catarata.',
    historia:
      'Assintomática do ponto de vista cardiovascular e respiratório. Caminha diariamente, sem dor torácica, dispneia ou palpitações. Traz radiografia solicitada na avaliação pré-operatória de rotina e está preocupada porque "apareceu alguma coisa na aorta".',
    antecedentes: [
      'Hipertensão arterial de longa data, controlada',
      'Dislipidemia em tratamento',
      'Nunca fumou',
      'Sem episódios de dor torácica',
    ],
    vitais: { pa: '138 × 78 mmHg', fc: '70 bpm', fr: '16 irpm', satO2: '96% em ar ambiente', temp: '36,2 °C' },
    exame: [
      'Bulhas normofonéticas, com sopro sistólico suave em foco aórtico',
      'Pulsos periféricos simétricos e presentes',
      'Ausculta pulmonar limpa',
      'Sem diferença de pressão entre os membros superiores',
    ],
    pedido:
      'Avaliação pré-operatória de rotina em idosa assintomática, com contorno aórtico proeminente.',
    pergunta: 'O botão aórtico está proeminente. Isso configura aneurisma?',
    achado: 'Desenrolamento senil da aorta',
    veredito: 'Desenrolamento da aorta — alongamento senil com calcificação parietal, sem dilatação focal',
    correlacao:
      'Com a idade, a aorta perde elastina, alonga-se e, presa em suas extremidades, acomoda o comprimento extra tornando-se mais tortuosa: o botão fica mais proeminente e a aorta descendente mais visível junto à coluna. É achado comum em idosos e não constitui aneurisma por si só, que exige dilatação focal do calibre. A calcificação da parede indica aterosclerose e permite, de quebra, ver onde a parede está — útil para julgar o calibre real. Numa paciente assintomática, com pulsos simétricos e sem diferença pressórica entre os braços, não há nada a investigar com urgência.',
    distratores: [
      d(
        'Aneurisma de aorta torácica',
        'Aneurisma é dilatação focal do calibre, com contorno convexo localizado que se destaca do restante do vaso. Aqui a aorta está alongada e tortuosa em toda a extensão, com calibre preservado — a diferença entre comprimento e diâmetro é o ponto.',
      ),
      d(
        'Dissecção aórtica',
        'É emergência e exige dor torácica intensa de início súbito, assimetria de pulsos ou de pressão entre os membros e frequentemente alargamento mediastinal agudo. A paciente está assintomática, com pulsos simétricos — e a radiografia jamais exclui dissecção quando há suspeita clínica.',
      ),
      d(
        'Massa mediastinal superior',
        'Massa tem contorno próprio e não se prolonga em continuidade com a aorta ao longo de todo o trajeto. A calcificação linear parietal identifica a estrutura como vaso.',
      ),
    ],
  },

  'coarctacao-da-aorta': {
    cenario: 'Ambulatório de clínica médica',
    identificacao: 'Homem de 26 anos, militar.',
    queixa: 'Hipertensão detectada em exame periódico, sem sintomas.',
    historia:
      'Pressão elevada detectada em avaliação de rotina e confirmada em três medidas. Assintomático, pratica atividade física regular, mas refere que as pernas "cansam" e ficam frias em corridas longas. Nega cefaleia, edema ou dispneia. Sem uso de substâncias que elevem a pressão.',
    antecedentes: [
      'Hipertensão arterial de início precoce, sem causa identificada',
      'Sem obesidade, sem doença renal conhecida',
      'Sem uso de anabolizantes ou descongestionantes',
      'Atividade física regular',
    ],
    vitais: { pa: '172 × 96 mmHg em membros superiores; 118 × 70 mmHg em membros inferiores', fc: '68 bpm', fr: '15 irpm', satO2: '98% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Pulsos femorais reduzidos e atrasados em relação aos radiais',
      'Sopro sistólico audível na região interescapular',
      'Diferença pressórica marcada entre membros superiores e inferiores',
      'Ausculta pulmonar limpa',
    ],
    pedido:
      'Hipertensão de início precoce com pulsos femorais reduzidos e diferença pressórica entre membros: procurar sinais radiográficos de coarctação.',
    pergunta: 'Que dois sinais radiográficos confirmam a suspeita clínica?',
    achado: 'Coarctação da aorta',
    veredito: 'Coarctação da aorta — entalhes na borda inferior das costelas e sinal do número 3',
    correlacao:
      'O gradiente pressórico entre braços e pernas com pulso femoral atrasado praticamente fecha o diagnóstico à beira do leito, e a radiografia mostra as duas consequências crônicas. A primeira é a circulação colateral: para contornar o estreitamento, as artérias intercostais dilatam e erodem a borda inferior das costelas, da quarta à oitava, bilateralmente — os entalhes. A segunda é o contorno do próprio vaso: dilatação pré-estenótica, ponto de coarctação e dilatação pós-estenótica desenham um 3. Os sinais podem ser discretos; a suspeita clínica é que orienta a angiotomografia ou a ressonância.',
    distratores: [
      d(
        'Hipertensão essencial',
        'É o rótulo que a maioria dos hipertensos recebe, e o que não cabe aqui: hipertensão essencial não produz gradiente entre membros superiores e inferiores, não atrasa o pulso femoral e não gera entalhes costais. Hipertensão antes dos 30 anos exige causa secundária.',
      ),
      d(
        'Variantes costais bilaterais',
        'Variantes do gradil têm cortical lisa e contínua e não se limitam à borda inferior de uma sequência específica de arcos. Os entalhes da coarctação são erosões da margem inferior por vasos dilatados, com distribuição característica da quarta à oitava costela.',
      ),
      d(
        'Neurofibromatose',
        'É a outra causa clássica de entalhe costal e merece ser lembrada, mas costuma vir com lesões cutâneas, manchas café com leite e alterações vertebrais — ausentes aqui —, e não produz o contorno aórtico em 3 nem gradiente pressórico.',
      ),
    ],
    imagem: 2,
  },

  'hernia-hiatal': {
    cenario: 'Ambulatório de gastroenterologia',
    identificacao: 'Mulher de 68 anos, aposentada.',
    queixa: 'Queimação retroesternal e regurgitação há anos, com piora recente.',
    historia:
      'Convive há anos com azia e regurgitação ao deitar, controladas parcialmente com medicação. Nos últimos meses passou a sentir o alimento "entalar" e a ter tosse noturna. Refere plenitude após pequenas refeições. Nega perda de peso significativa e nega vômitos com sangue.',
    antecedentes: [
      'Doença do refluxo gastroesofágico de longa data',
      'Uso crônico de inibidor de bomba de prótons',
      'Sem cirurgia abdominal prévia',
      'Sem tabagismo',
    ],
    vitais: { pa: '132 × 78 mmHg', fc: '74 bpm', fr: '16 irpm', satO2: '97% em ar ambiente', temp: '36,3 °C' },
    exame: [
      'Abdome flácido, sem massas ou visceromegalias',
      'Ausculta pulmonar limpa',
      'Sem linfonodomegalias',
      'Sem sinais de anemia à inspeção',
    ],
    pedido:
      'Refluxo de longa data com disfagia e tosse noturna: procurar herniação gástrica acima do diafragma.',
    pergunta: 'Há um nível hidroaéreo atrás do coração. O que ele representa?',
    achado: 'Hérnia hiatal',
    veredito: 'Hérnia hiatal — estômago intratorácico com nível hidroaéreo retrocardíaco',
    correlacao:
      'A herniação de parte do estômago através do hiato esofágico coloca uma víscera oca no tórax, e víscera oca com conteúdo líquido e gasoso produz nível hidroaéreo. Encontrá-lo atrás do coração, acima do diafragma, é a pista central — e explica os sintomas: o mecanismo antirrefluxo do hiato se perde, o refluxo piora e o conteúdo aspirado causa tosse noturna. A ressalva importante é a sensibilidade: hérnias pequenas frequentemente não aparecem na radiografia, e um filme normal não exclui o diagnóstico.',
    distratores: [
      d(
        'Abscesso pulmonar',
        'Também produz nível hidroaéreo, mas dentro de cavidade de paredes espessas e irregulares no parênquima, com febre, toxemia e expectoração purulenta. A paciente está afebril e o nível está em topografia mediastinal posterior, não intraparenquimatosa.',
      ),
      d(
        'Hidropneumotórax',
        'Produz nível horizontal que se estende por toda a largura do hemitórax, no espaço pleural, com linha pleural visível acima. Este nível está contido por paredes próprias, em posição retrocardíaca central.',
      ),
      d(
        'Massa paravertebral',
        'Massa é sólida e homogênea, sem gás em seu interior. A presença de conteúdo aéreo com nível líquido identifica uma víscera oca, não uma lesão sólida.',
      ),
    ],
  },

  pneumomediastino: {
    cenario: 'Pronto-socorro',
    identificacao: 'Homem de 21 anos, estudante.',
    queixa: 'Dor no peito e no pescoço após vômitos intensos há seis horas.',
    historia:
      'Após uma noite com ingestão alcoólica e vários episódios de vômito forçado, começou a sentir dor retroesternal contínua que irradia para o pescoço e piora ao engolir e ao inspirar. Notou que a voz mudou e que o pescoço parece "inchado". Nega febre e nega trauma direto.',
    antecedentes: [
      'Vômitos repetidos e forçados nas últimas horas',
      'Sem doença esofágica conhecida',
      'Sem asma ou doença pulmonar prévia',
      'Sem procedimentos endoscópicos recentes',
    ],
    vitais: { pa: '124 × 74 mmHg', fc: '104 bpm', fr: '22 irpm', satO2: '96% em ar ambiente', temp: '37,1 °C' },
    exame: [
      'Crepitação à palpação da região cervical e supraclavicular',
      'Dor à deglutição, sem disfagia completa',
      'Ausculta pulmonar sem ruídos adventícios',
      'Sem instabilidade hemodinâmica',
    ],
    pedido:
      'Dor torácica e enfisema cervical após vômitos forçados: procurar gás no mediastino e sinais de perfuração esofágica.',
    pergunta: 'Que achado o filme mostra — e por que ele é urgente nesta história?',
    achado: 'Pneumomediastino',
    veredito: 'Pneumomediastino — gás delineando estruturas mediastinais e deslocando a pleura mediastinal',
    correlacao:
      'O ar disseca os tecidos do mediastino e produz dois achados: linhas de gás contornando estruturas que normalmente não têm borda própria — aorta, timo, traqueia — e a pleura mediastinal deslocada lateralmente, aparecendo como uma linha branca fina paralela ao mediastino. O achado pode ser muito sutil, e a crepitação cervical à palpação é frequentemente o que obriga a procurá-lo. O contexto é o que define a urgência: pneumomediastino espontâneo em jovem costuma ser benigno e autolimitado, mas depois de vômitos forçados é preciso excluir perfuração esofágica — a síndrome de Boerhaave — com tomografia e esofagograma com contraste hidrossolúvel.',
    distratores: [
      d(
        'Pneumotórax bilateral',
        'A linha pleural do pneumotórax fica na periferia, entre pulmão e parede torácica, com ausência de trama além dela. Estas linhas são centrais, acompanhando o contorno mediastinal — embora pneumotórax possa coexistir e deva ser procurado ativamente.',
      ),
      d(
        'Enfisema subcutâneo',
        'O ar realmente disseca para o subcutâneo cervical e é o que se palpa, mas as lucências que contornam aorta e traqueia estão dentro do mediastino. Chamar o quadro de enfisema subcutâneo isolado perderia a origem do ar e a urgência esofágica.',
      ),
      d(
        'Pneumopericárdio',
        'O gás pericárdico fica confinado pelo saco pericárdico, não ultrapassa a reflexão sobre os grandes vasos e não disseca para o pescoço. A extensão cervical do ar exclui essa localização.',
      ),
    ],
  },
}

// ══════════════════════════════════ Índice ══════════════════════════════════

/** Vinheta clínica de cada caso, indexada pelo slug. */
export const VINHETAS_CASOS_RAIO_X: Record<string, VinhetaClinica> = {
  ...CARDIOVASCULAR,
  ...VARIANTES,
  ...VIAS_AEREAS,
  ...DISPOSITIVOS,
  ...PNEUMOTORAX,
  ...CANCER,
  ...MEDIASTINO,
}

export function vinhetaDoCaso(slug: string): VinhetaClinica | null {
  return VINHETAS_CASOS_RAIO_X[slug] ?? null
}

/** Casos que já têm consulta escrita — os únicos que viram questão clínica. */
export function slugsComVinheta(): string[] {
  return Object.keys(VINHETAS_CASOS_RAIO_X)
}

/** Tipagem auxiliar para quem monta catálogos por capítulo. */
export type CategoriaComVinheta = CategoriaCasoRaioX
