import type { Comparador } from './esquemas'

/**
 * Os comparadores: o mesmo achado, causa por causa.
 *
 * ## Por que isto não existe em livro
 *
 * O livro-texto é organizado por doença. Abre-se "insuficiência cardíaca" e lá
 * está o edema; abre-se "síndrome nefrótica" e lá está o edema de novo, escrito
 * por outro autor, em outro capítulo, com outras palavras. O aluno que leu os
 * dois capítulos sabe que as duas doenças dão edema — e continua sem saber
 * olhar uma perna e dizer qual é qual.
 *
 * O sentido do exame físico é justamente o inverso do índice do livro: a pessoa
 * chega com o **achado**, não com o diagnóstico. Quem organiza por achado
 * precisa fazer o corte transversal que nenhum capítulo faz — pôr as cinco
 * causas lado a lado e perguntar, eixo por eixo, no que elas diferem.
 *
 * ## O formato
 *
 * Matriz: eixos nas linhas, causas nas colunas. Cada célula tem o valor curto
 * (o que cabe na tabela) e o detalhe (por que é assim). O detalhe é obrigatório
 * nas células decisivas — sem ele a tabela vira cartão de memória, que é
 * exatamente o que se quer evitar: decorar "edema renal é mole e matinal" sem
 * entender que a face incha porque o tecido periorbital tem pouca pressão
 * tecidual e a noite inteira é decúbito não ensina nada transferível.
 *
 * As células marcadas como `decisiva` são as que sozinhas mudam a aposta. A
 * interface as destaca — e essa é a informação que o aluno leva para o plantão.
 */
export const COMPARADORES: Comparador[] = [
  {
    slug: 'edema-por-causa',
    titulo: 'Edema: qual é qual',
    pergunta: 'Olhei a perna inchada. Coração, rim, fígado, veia ou linfa?',
    sistema: 'cardiovascular',
    introducao:
      'Cinco mecanismos produzem a mesma palavra e pedem condutas diferentes — uma delas, o linfedema, piora com o diurético que as outras exigem. O exame físico separa os cinco com razoável confiança, desde que se examine mais do que "tem cacifo".',
    eixos: [
      {
        id: 'distribuicao',
        rotulo: 'Distribuição',
        comoAvaliar: 'Onde começa e até onde vai. Examine tornozelo, pernas, coxas, parede abdominal, face e sacro.',
      },
      {
        id: 'cacifo',
        rotulo: 'Cacifo (Godet)',
        comoAvaliar: 'Compressão de 10 a 15 s sobre proeminência óssea; observe a profundidade e o tempo de retorno.',
      },
      {
        id: 'simetria',
        rotulo: 'Simetria',
        comoAvaliar: 'Compare panturrilhas a 10 cm abaixo da tuberosidade tibial; diferença > 3 cm é assimetria real.',
      },
      { id: 'pele', rotulo: 'Pele e cor', comoAvaliar: 'Cor, temperatura, espessura, presença de úlcera e de dermatite.' },
      { id: 'horario', rotulo: 'Comportamento no dia', comoAvaliar: 'Pergunte como está ao acordar e ao fim do dia.' },
      { id: 'acompanha', rotulo: 'O que vem junto', comoAvaliar: 'Jugular, ausculta pulmonar e cardíaca, ascite, urina, estigmas hepáticos.' },
      { id: 'conduta', rotulo: 'O que muda na conduta', comoAvaliar: '—' },
    ],
    colunas: [
      {
        id: 'cardiaco',
        titulo: 'Cardíaco',
        subtitulo: 'Pressão hidrostática alta por congestão venosa sistêmica.',
        ilustracao: { id: 'edema', params: { tipo: 'cardiaco' }, alt: 'Edema cardíaco: bilateral, ascendente, com cacifo de retorno lento' },
        chave: 'Turgência jugular junto com o edema.',
        celulas: {
          distribuicao: {
            valor: 'Bilateral, ascendente, começa no tornozelo',
            detalhe: 'Sobe conforme a congestão piora: tornozelo → perna → coxa → parede abdominal. No acamado, aparece no sacro.',
          },
          cacifo: { valor: 'Presente, retorno lento', detalhe: 'Proteína intersticial relativamente alta faz a depressão demorar a desfazer.' },
          simetria: { valor: 'Simétrico' },
          pele: { valor: 'Fria, pode ter cianose periférica', detalhe: 'Baixo débito e vasoconstrição acompanham a congestão.' },
          horario: { valor: 'Pior à tarde e à noite', detalhe: 'O dia inteiro em pé soma gravidade à pressão venosa já elevada.' },
          acompanha: {
            valor: 'Turgência jugular, B3, crepitações, hepatomegalia dolorosa, ortopneia',
            detalhe: 'A jugular é o divisor de águas: edema de perna sem jugular alta raramente é insuficiência cardíaca.',
            decisiva: true,
          },
          conduta: { valor: 'Diurético de alça, restrição de sódio, tratar a cardiopatia de base' },
        },
      },
      {
        id: 'renal',
        titulo: 'Renal (nefrótico)',
        subtitulo: 'Pressão oncótica baixa por proteinúria maciça.',
        ilustracao: { id: 'edema', params: { tipo: 'renal' }, alt: 'Edema renal: generalizado, muito mole, com edema periorbital' },
        chave: 'Edema periorbital ao acordar e urina espumosa.',
        celulas: {
          distribuicao: {
            valor: 'Generalizado, com face e periórbita',
            detalhe: 'O tecido periorbital é frouxo e tem pressão tecidual baixíssima: é o primeiro a infiltrar quando falta oncótica.',
            decisiva: true,
          },
          cacifo: { valor: 'Presente, muito fácil, retorno rápido', detalhe: 'Líquido pobre em proteína — deprime com pouca força e volta depressa.' },
          simetria: { valor: 'Simétrico' },
          pele: { valor: 'Pálida, tensa, brilhante' },
          horario: {
            valor: 'Pior ao acordar; melhora ao longo do dia',
            detalhe: 'A noite inteira em decúbito redistribui o líquido para a face; ao levantar, a gravidade o devolve às pernas.',
            decisiva: true,
          },
          acompanha: { valor: 'Urina espumosa, proteinúria, hipoalbuminemia, hiperlipidemia' },
          conduta: { valor: 'Investigar proteinúria, tratar a glomerulopatia, restringir sódio; diurético com cautela' },
        },
      },
      {
        id: 'hepatico',
        titulo: 'Hepático',
        subtitulo: 'Hipertensão portal mais hipoalbuminemia.',
        ilustracao: { id: 'edema', params: { tipo: 'hepatico' }, alt: 'Edema hepático: ascite desproporcional ao edema de membros' },
        chave: 'Ascite desproporcional ao edema das pernas.',
        celulas: {
          distribuicao: {
            valor: 'Ascite primeiro; pernas depois',
            detalhe: 'A hipertensão portal represa no território esplâncnico antes de alcançar o sistêmico — por isso a barriga precede a perna.',
            decisiva: true,
          },
          cacifo: { valor: 'Presente, mole' },
          simetria: { valor: 'Simétrico' },
          pele: { valor: 'Aranhas vasculares, eritema palmar, icterícia, circulação colateral' },
          horario: { valor: 'Pouca variação diurna' },
          acompanha: { valor: 'Esplenomegalia, asterixe, ginecomastia, plaquetopenia' },
          conduta: { valor: 'Restrição de sódio, espironolactona (± furosemida), paracentese; GASA na ascite nova' },
        },
      },
      {
        id: 'venoso',
        titulo: 'Venoso crônico',
        subtitulo: 'Hipertensão venosa local por refluxo valvar ou obstrução.',
        ilustracao: { id: 'edema', params: { tipo: 'venoso' }, alt: 'Edema venoso: dermatite ocre, varizes e úlcera maleolar medial' },
        chave: 'Dermatite ocre e úlcera acima do maléolo medial.',
        celulas: {
          distribuicao: { valor: 'Uni ou bilateral, até o joelho', detalhe: 'Raramente ultrapassa o joelho; poupa a face sempre.' },
          cacifo: { valor: 'Presente no início; some com a fibrose' },
          simetria: { valor: 'Frequentemente assimétrico' },
          pele: {
            valor: 'Dermatite ocre, varizes, lipodermatosclerose, úlcera maleolar medial',
            detalhe: 'A hemossiderina de hemácias extravasadas pigmenta a pele de marrom-ocre — marca registrada e irreversível.',
            decisiva: true,
          },
          horario: { valor: 'Pior à tarde; melhora com elevação e à noite' },
          acompanha: { valor: 'História de trombose, gestações, ocupação em pé, prurido e peso na perna' },
          conduta: { valor: 'Compressão elástica, elevação, cuidado de pele; diurético não trata' },
        },
      },
      {
        id: 'linfatico',
        titulo: 'Linfedema',
        subtitulo: 'Drenagem linfática obstruída; líquido rico em proteína.',
        ilustracao: { id: 'edema', params: { tipo: 'linfatico' }, alt: 'Linfedema: dorso do pé abaulado, pele espessada, sinal de Stemmer' },
        chave: 'Sinal de Stemmer positivo — não se pinça a pele do 2º pododáctilo.',
        celulas: {
          distribuicao: {
            valor: 'Inclui o dorso do pé e os dedos',
            detalhe: 'Edema que "sobe no pé" e apaga os sulcos dos dedos é linfático; os outros tipos poupam o dorso.',
          },
          cacifo: {
            valor: 'Ausente ou mínimo (fase tardia)',
            detalhe: 'Proteína e fibrose no interstício resistem à compressão — não é água livre.',
            decisiva: true,
          },
          simetria: { valor: 'Quase sempre unilateral' },
          pele: {
            valor: 'Espessada, verrucosa; Stemmer positivo',
            detalhe: 'Não conseguir pinçar a pele do dorso do segundo dedo do pé é quase patognomônico.',
            decisiva: true,
          },
          horario: { valor: 'Não melhora com repouso noturno' },
          acompanha: { valor: 'Esvaziamento ganglionar, radioterapia, erisipelas de repetição, filariose' },
          conduta: { valor: 'Terapia descongestiva complexa e compressão; diurético é inútil e desidrata' },
        },
      },
    ],
    desempate:
      'Quando a tabela empata, três perguntas resolvem quase tudo. **A jugular está alta?** Se sim, coração. **Incha a face de manhã?** Se sim, rim. **Dá para pinçar a pele do segundo dedo do pé?** Se não, linfa. Sobrando fígado e veia, a barriga decide: ascite desproporcional é fígado; dermatite ocre com úlcera medial é veia. E em qualquer edema agudo e unilateral, a pergunta muda de figura — calcule o escore de Wells e peça o ultrassom, porque trombose venosa profunda não se descarta com a mão.',
    referencias: [
      'Trayes KP et al. Edema: Diagnosis and Management. Am Fam Physician, 2013;88(2):102-10.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
      'Porto CC. Semiologia Médica, 8ª ed.',
    ],
  },

  {
    slug: 'ictericia-por-compartimento',
    titulo: 'Icterícia: onde a cadeia quebrou',
    pergunta: 'O paciente está amarelo. Hemólise, fígado ou via biliar?',
    sistema: 'abdome',
    introducao:
      'Duas perguntas de anamnese — cor da urina e cor das fezes — e um exame de pele separam os três compartimentos antes de qualquer laboratório. A lógica é a solubilidade: bilirrubina não conjugada não passa pelo glomérulo, conjugada passa.',
    eixos: [
      { id: 'fracao', rotulo: 'Fração predominante', comoAvaliar: 'Bilirrubina total e frações.' },
      { id: 'urina', rotulo: 'Cor da urina', comoAvaliar: 'Pergunte diretamente; colúria precede a icterícia visível.' },
      { id: 'fezes', rotulo: 'Cor das fezes', comoAvaliar: 'Pergunte por fezes claras, "cor de massa de vidraceiro".' },
      { id: 'prurido', rotulo: 'Prurido', comoAvaliar: 'Pergunte por coceira, marcas de arranhadura, piora noturna.' },
      { id: 'exame', rotulo: 'Exame físico dirigido', comoAvaliar: 'Fígado, baço, vesícula, estigmas hepáticos, palidez.' },
      { id: 'laboratorio', rotulo: 'Padrão laboratorial', comoAvaliar: 'Relação entre aminotransferases e fosfatase alcalina/GGT.' },
      { id: 'primeiro-exame', rotulo: 'Primeiro exame a pedir', comoAvaliar: '—' },
    ],
    colunas: [
      {
        id: 'pre-hepatica',
        titulo: 'Pré-hepática',
        subtitulo: 'Produção de bilirrubina acima da capacidade de conjugação.',
        ilustracao: { id: 'ictericia', params: { bilirrubina: 4, compartimento: 'pre' }, alt: 'Icterícia leve com palidez associada' },
        chave: 'Amarelo **com** palidez, e urina clara.',
        celulas: {
          fracao: { valor: 'Não conjugada (indireta)' },
          urina: {
            valor: 'Clara',
            detalhe: 'A fração não conjugada circula ligada à albumina e não é filtrada. Urina normal em paciente ictérico é praticamente diagnóstica de compartimento pré-hepático.',
            decisiva: true,
          },
          fezes: { valor: 'Normais ou escurecidas' },
          prurido: { valor: 'Ausente', detalhe: 'Não há retenção de sais biliares.' },
          exame: { valor: 'Palidez, esplenomegalia, icterícia geralmente leve (< 5 mg/dL)' },
          laboratorio: { valor: 'LDH alto, haptoglobina baixa, reticulócitos altos; transaminases e FA normais' },
          'primeiro-exame': { valor: 'Hemograma com reticulócitos, LDH, haptoglobina, Coombs, esfregaço' },
        },
      },
      {
        id: 'hepatocelular',
        titulo: 'Hepatocelular',
        subtitulo: 'O hepatócito lesado não conjuga nem excreta.',
        ilustracao: { id: 'ictericia', params: { bilirrubina: 10, compartimento: 'hepatica' }, alt: 'Icterícia moderada com estigmas de hepatopatia' },
        chave: 'Aminotransferases desproporcionalmente altas.',
        celulas: {
          fracao: { valor: 'Mista' },
          urina: { valor: 'Escura (colúria)' },
          fezes: { valor: 'Normais ou levemente claras' },
          prurido: { valor: 'Variável' },
          exame: { valor: 'Hepatomegalia dolorosa, estigmas de hepatopatia, ascite e asterixe se avançada' },
          laboratorio: {
            valor: 'ALT/AST muito elevadas, FA pouco alterada',
            detalhe: 'A desproporção entre aminotransferases e fosfatase alcalina é o que nomeia o padrão — e é ela, não a bilirrubina, que localiza a lesão.',
            decisiva: true,
          },
          'primeiro-exame': { valor: 'Sorologias virais, história medicamentosa e de álcool, INR e albumina para gravidade' },
        },
      },
      {
        id: 'colestatica',
        titulo: 'Colestática / obstrutiva',
        subtitulo: 'O fluxo biliar parou; a bile não chega ao intestino.',
        ilustracao: { id: 'ictericia', params: { bilirrubina: 16, compartimento: 'colestatica' }, alt: 'Icterícia intensa com escoriações de prurido' },
        chave: 'Acolia fecal com colúria — a bile não chega ao intestino e sai pelo rim.',
        celulas: {
          fracao: { valor: 'Conjugada (direta)' },
          urina: { valor: 'Escura (colúria)' },
          fezes: {
            valor: 'Claras / acolia',
            detalhe: 'Sem bilirrubina no intestino não há estercobilina, e a fezes perde a cor. Acolia é o achado mais específico de obstrução completa.',
            decisiva: true,
          },
          prurido: { valor: 'Frequente e intenso', detalhe: 'Sais biliares retidos na pele; escoriações podem ser o primeiro achado visível.' },
          exame: { valor: 'Vesícula palpável indolor (Courvoisier) sugere obstrução maligna distal; febre com dor sugere colangite' },
          laboratorio: { valor: 'FA e GGT muito elevadas, aminotransferases relativamente poupadas' },
          'primeiro-exame': { valor: 'Ultrassom de vias biliares — procurando dilatação; seguir com colangiorressonância ou TC' },
        },
      },
    ],
    desempate:
      'Urina clara em paciente amarelo fecha pré-hepático com pouquíssimo esforço — é a pergunta mais barata da consulta. Com colúria, a escolha entre hepatocelular e colestático é do laboratório, pela desproporção entre aminotransferases e fosfatase alcalina, e do ultrassom, pela presença ou ausência de dilatação de vias biliares. Três situações furam a fila e não esperam investigação: **icterícia com febre e dor** (colangite — drenagem), **icterícia com encefalopatia e INR alargado** (insuficiência hepática aguda — centro de transplante) e **icterícia indolor progressiva com perda de peso** (neoplasia periampular).',
    referencias: [
      'Fargo MV et al. Evaluation of Jaundice in Adults. Am Fam Physician, 2017;95(3):164-168.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
    ],
  },

  {
    slug: 'cianose-central-vs-periferica',
    titulo: 'Cianose: central ou periférica',
    pergunta: 'Está azul. É o pulmão, é o coração, ou é só frio?',
    sistema: 'cardiovascular',
    introducao:
      'A distinção se faz em trinta segundos, com a língua e com as mãos do examinador — e ela decide entre gasometria imediata e um cobertor.',
    eixos: [
      { id: 'onde', rotulo: 'Onde aparece', comoAvaliar: 'Examine língua e mucosa oral; depois leito ungueal, nariz e orelhas.' },
      { id: 'temperatura', rotulo: 'Temperatura da extremidade', comoAvaliar: 'Encoste o dorso da mão na extremidade do paciente.' },
      { id: 'aquecimento', rotulo: 'Resposta ao aquecimento', comoAvaliar: 'Aqueça a extremidade por alguns minutos e reexamine.' },
      { id: 'saturacao', rotulo: 'Saturação arterial', comoAvaliar: 'Oximetria e, se houver dúvida, gasometria arterial.' },
      { id: 'oxigenio', rotulo: 'Resposta ao oxigênio', comoAvaliar: 'Ofereça O₂ suplementar e reavalie saturação e cor.' },
      { id: 'conduta', rotulo: 'Conduta imediata', comoAvaliar: '—' },
    ],
    colunas: [
      {
        id: 'central',
        titulo: 'Central',
        subtitulo: 'O sangue arterial já sai dessaturado do pulmão, ou é desviado sem passar por ele.',
        ilustracao: { id: 'cianose', params: { tipo: 'central', intensidade: 3 }, alt: 'Cianose central: língua e lábios azulados' },
        chave: 'Língua azulada.',
        celulas: {
          onde: {
            valor: 'Língua, mucosa oral, conjuntiva — além das extremidades',
            detalhe: 'Mucosas são quentes e de alto fluxo: não azulam por vasoconstrição. Cianose de língua é sempre central.',
            decisiva: true,
          },
          temperatura: { valor: 'Extremidades quentes (em geral)' },
          aquecimento: { valor: 'Não muda' },
          saturacao: { valor: 'Reduzida (< 85% para ser visível)' },
          oxigenio: {
            valor: 'Melhora — exceto em shunt direita-esquerda e metemoglobinemia',
            detalhe: 'A ausência de resposta ao O₂ a 100% é justamente o que caracteriza o shunt; no recém-nascido, é o teste da hiperóxia.',
          },
          conduta: { valor: 'Oxigênio, gasometria arterial, investigar causa pulmonar ou cardíaca — é emergência' },
        },
      },
      {
        id: 'periferica',
        titulo: 'Periférica',
        subtitulo: 'Saturação arterial normal; o fluxo local é lento e a extração local, alta.',
        ilustracao: { id: 'cianose', params: { tipo: 'periferica', intensidade: 3 }, alt: 'Cianose periférica: dedos azulados com mucosa oral rósea' },
        chave: 'Mucosa oral rósea com dedos azulados.',
        celulas: {
          onde: { valor: 'Só extremidades: leito ungueal, pontas dos dedos, nariz, orelhas', detalhe: 'Mucosas permanecem róseas.', decisiva: true },
          temperatura: { valor: 'Extremidades frias' },
          aquecimento: { valor: 'Melhora ou desaparece', detalhe: 'É a manobra que separa vasoconstrição fisiológica de hipoxemia.', decisiva: true },
          saturacao: { valor: 'Normal' },
          oxigenio: { valor: 'Sem efeito sobre a cor' },
          conduta: { valor: 'Aquecer e procurar baixo débito ou obstrução arterial; se o paciente está chocado, tratar o choque' },
        },
      },
      {
        id: 'pseudocianose',
        titulo: 'Pseudocianose',
        subtitulo: 'Pigmento anômalo — não há hemoglobina reduzida em excesso.',
        ilustracao: { id: 'cianose', params: { tipo: 'metemoglobina', intensidade: 3 }, alt: 'Coloração cinza-achocolatada da metemoglobinemia' },
        chave: 'Oximetria travada perto de 85% e sangue achocolatado.',
        celulas: {
          onde: { valor: 'Difusa, tonalidade acinzentada ou achocolatada' },
          temperatura: { valor: 'Normal' },
          aquecimento: { valor: 'Não muda' },
          saturacao: {
            valor: 'Oximetria "travada" perto de 85% independentemente do O₂',
            detalhe: 'O oxímetro de dois comprimentos de onda interpreta a metemoglobina como uma mistura fixa — o número converge para ~85% e não se move.',
            decisiva: true,
          },
          oxigenio: { valor: 'Sem resposta, com PaO₂ normal na gasometria', detalhe: 'PaO₂ normal com cianose e oximetria baixa é a assinatura da metemoglobinemia.' },
          conduta: { valor: 'Co-oximetria, suspender o agente oxidante, azul de metileno se sintomático' },
        },
      },
    ],
    desempate:
      'Olhe a língua. Azul, é central — gasometria e oxigênio agora. Rósea com dedos azuis, aqueça a mão: melhorou, era vasoconstrição; não melhorou em paciente frio e taquicárdico, procure choque ou obstrução arterial. E quando a cor não bate com o número — cianose com PaO₂ normal, oximetria imóvel em 85%, sangue que não fica vermelho ao ar — pare de ajustar o oxigênio e peça co-oximetria.',
    referencias: [
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
      'Sjoding MW et al. Racial Bias in Pulse Oximetry Measurement. NEJM, 2020;383:2477-2478.',
    ],
  },
]

export const TOTAL_DE_COMPARADORES = COMPARADORES.length

export function comparadorPorSlug(slug: string): Comparador | undefined {
  return COMPARADORES.find((comparador) => comparador.slug === slug)
}
