import type { Campo, Ferramenta, Nivel } from '../tipos'
import { campoNum, campoOpc, campoSeg, campoSimNao, fmtInt, num, opc, ptsOpc, sim, somaSimNao } from '../helpers'

/* ═════════════════ 1. Fenótipo de fragilidade e índice clínico ═════════════════ */

/**
 * Campos do fenótipo de Fried e da escala clínica, em constante nomeada,
 * para que `ptsOpc` possa resolver os pontos da alternativa escolhida.
 */
const fragilidadeCampos: Campo[] = [
  campoSeg('instrumento', 'Instrumento', [
    { valor: 'fried', rotulo: 'Fenótipo de Fried' },
    { valor: 'cfs', rotulo: 'Escala clínica (CFS)' },
  ], { ajuda: 'O fenótipo de Fried mede fragilidade física e é o padrão em pesquisa; a escala clínica é um julgamento global rápido, validada para triagem hospitalar e muito usada em terapia intensiva e pré-operatório.' }),
  campoSimNao('perdaPeso', 'Perda de peso não intencional ≥ 4,5 kg (ou ≥ 5% do peso) no último ano', 1, 'Perda não intencional, sem dieta nem exercício. Reflete a sarcopenia e o estado catabólico que definem o fenótipo.', ),
  campoSimNao('exaustao', 'Exaustão autorrelatada', 1, 'Perguntado como "sentiu que tudo o que fazia exigia esforço" ou "não conseguiu levar as coisas adiante" em 3 ou mais dias da semana.'),
  campoSimNao('forca', 'Redução da força de preensão palmar', 1, 'Medida por dinamômetro, no quintil inferior ajustado por sexo e índice de massa corporal. Sem dinamômetro, use a dificuldade para abrir potes e girar maçanetas como aproximação clínica.'),
  campoSimNao('marcha', 'Lentidão da marcha', 1, 'Tempo para caminhar 4,6 m no quintil inferior ajustado por sexo e altura. Uma velocidade abaixo de 0,8 m/s é o ponto de corte prático mais usado à beira do leito.'),
  campoSimNao('atividade', 'Baixo nível de atividade física', 1, 'Gasto semanal em atividade física no quintil inferior — na prática, sedentarismo quase completo.'),
  campoOpc('cfs', 'Escala clínica de fragilidade', [
    { valor: '1', rotulo: '1 — Muito apto: ativo, vigoroso, exercita-se com regularidade', pontos: 1 },
    { valor: '2', rotulo: '2 — Apto: sem sintoma de doença ativa, ativo ocasionalmente', pontos: 2 },
    { valor: '3', rotulo: '3 — Controlado: doenças bem controladas, não ativo além da caminhada', pontos: 3 },
    { valor: '4', rotulo: '4 — Vulnerável: não dependente, mas sintomas limitam a atividade', pontos: 4 },
    { valor: '5', rotulo: '5 — Levemente frágil: precisa de ajuda em atividades instrumentais', pontos: 5 },
    { valor: '6', rotulo: '6 — Moderadamente frágil: precisa de ajuda fora de casa e em tarefas domésticas', pontos: 6 },
    { valor: '7', rotulo: '7 — Gravemente frágil: dependente para autocuidado, estável', pontos: 7 },
    { valor: '8', rotulo: '8 — Muito gravemente frágil: dependente e próximo do fim da vida', pontos: 8 },
    { valor: '9', rotulo: '9 — Doente terminal: expectativa de vida menor que 6 meses', pontos: 9 },
  ], { padrao: '3', mostrarSe: (v) => opc(v, 'instrumento') === 'cfs', ajuda: 'Classifique pelo estado basal de **duas semanas antes** da doença aguda atual, não pelo estado no leito — é esse o estado que prediz o desfecho.' }),
]

const fragilidade: Ferramenta = {
  id: 'fragilidade-fried',
  nome: 'Fragilidade: fenótipo de Fried e escala clínica (CFS)',
  sigla: 'CFS',
  sinonimos: ['fragilidade', 'frailty', 'fried', 'clinical frailty scale', 'idoso fragil'],
  resumo: 'Classifica fragilidade pelos cinco critérios de Fried e pela escala clínica de 9 pontos, que prediz desfecho melhor que a idade.',
  categorias: ['geriatria'],
  campos: fragilidadeCampos,
  calcular: (v) => {
    if (opc(v, 'instrumento') === 'cfs') {
      const cfs = ptsOpc(fragilidadeCampos, v, 'cfs')
      if (cfs === null) return null
      const nivel: Nivel = cfs >= 8 ? 'critico' : cfs >= 6 ? 'alerta' : cfs >= 5 ? 'atencao' : 'ok'
      const rotulo = cfs >= 8 ? 'Fragilidade muito grave ou terminal' : cfs >= 5 ? 'Frágil' : cfs === 4 ? 'Vulnerável' : 'Não frágil'
      return {
        titulo: 'Escala clínica de fragilidade',
        valor: fmtInt(cfs),
        unidade: 'de 9',
        nivel,
        rotuloNivel: rotulo,
        detalhes: [
          { rotulo: 'Categoria', valor: rotulo, nota: '1-3 não frágil · 4 vulnerável · 5-6 leve a moderada · 7-9 grave' },
          { rotulo: 'Referência temporal', valor: 'Estado basal de 2 semanas antes da doença aguda' },
        ],
        interpretacao: [
          `**CFS de ${cfs}.** Cada ponto adicional associa-se a aumento aproximado de 20 a 25% na mortalidade e no risco de institucionalização. A partir de 5, a pessoa é considerada frágil, e a fragilidade prediz complicação pós-operatória, delirium, tempo de internação e mortalidade melhor que a idade cronológica ou que índices de comorbidade.`,
          cfs >= 5
            ? 'Fragilidade estabelecida muda o cálculo de risco-benefício de praticamente toda intervenção: cirurgia eletiva, quimioterapia, rastreamento de câncer, metas glicêmicas e pressóricas, e intensidade de suporte em doença crítica.'
            : 'Sem fragilidade estabelecida, o paciente tolera intervenções de forma semelhante a adultos mais jovens com as mesmas comorbidades — a idade isolada não justifica restringir tratamento.',
          'A escala é um **julgamento global**, não um somatório, e depende de quem aplica conhecer o estado funcional prévio. Sua confiabilidade entre observadores é boa quando aplicada por profissional treinado e cai quando estimada apenas pelo prontuário.',
          'Fragilidade **não é irreversível**: é um estado dinâmico. Exercício resistido, aporte proteico adequado, revisão de medicamentos e tratamento de causas contribuintes movem a pessoa para categorias melhores, e essa é a razão de medi-la.',
        ],
        conduta: [
          cfs >= 5
            ? '**Acione a avaliação geriátrica ampla**: funcionalidade, cognição, humor, nutrição, marcha e equilíbrio, continência, visão, audição, medicamentos e suporte social. Ela reduz delirium, tempo de internação e institucionalização quando aplicada antes de cirurgia e durante internação.'
            : 'Mantenha prevenção: atividade física com componente resistido, aporte proteico de 1,2 a 1,5 g/kg/dia, vitamina D conforme dosagem, vacinação em dia e rastreio periódico de fragilidade.',
          '**Desprescreva.** Aplique os critérios de Beers e STOPP/START: benzodiazepínicos, anticolinérgicos, antipsicóticos, anti-inflamatórios e hipoglicemiantes de longa duração causam queda, delirium, hospitalização e morte em idosos frágeis com frequência muito maior do que o benefício que entregam.',
          'Prescreva **exercício resistido progressivo** — é a intervenção isolada com maior efeito sobre fragilidade, superior a qualquer fármaco — associado a **proteína de 1,2 a 1,5 g/kg/dia** distribuída em 25 a 30 g por refeição.',
          'Antes de cirurgia, use a fragilidade para a conversa de decisão compartilhada: em CFS de 7 ou mais, discuta explicitamente objetivos de cuidado, e considere que a alternativa relevante pode não ser outra técnica cirúrgica, e sim o tratamento conservador.',
          cfs >= 7
            ? 'Em CFS de 7 a 9, inicie **planejamento antecipado de cuidados**: diretivas, preferências sobre hospitalização e suporte avançado, e envolvimento de cuidados paliativos — que melhoram qualidade de vida e, em várias doenças, não encurtam a sobrevida.'
            : 'Registre o CFS no prontuário: ele é o dado que permitirá comparar o estado basal com o de uma internação futura, e é justamente essa comparação que orienta decisões em crise.',
        ],
        alertas: [
          'A escala classifica o **estado basal prévio**, não o estado no leito durante a doença aguda. Classificar um paciente pelo dia da internação superestima a fragilidade e leva a decisões de limitação indevidas.',
          'A CFS não foi validada em adultos jovens nem em pessoas com deficiência estável de longa data, em que a dependência não reflete reserva fisiológica reduzida.',
        ],
      }
    }

    const criterios: [string, string][] = [
      ['Perda de peso não intencional', 'perdaPeso'],
      ['Exaustão', 'exaustao'],
      ['Fraqueza (preensão)', 'forca'],
      ['Lentidão da marcha', 'marcha'],
      ['Baixa atividade física', 'atividade'],
    ]
    const total = somaSimNao(v, criterios.map(([, id]) => ({ id, pontos: 1 })))
    const nivel: Nivel = total >= 3 ? 'alerta' : total >= 1 ? 'atencao' : 'ok'
    const rotulo = total >= 3 ? 'Frágil' : total >= 1 ? 'Pré-frágil' : 'Robusto'

    return {
      titulo: 'Fenótipo de fragilidade (Fried)',
      valor: fmtInt(total),
      unidade: 'de 5 critérios',
      nivel,
      rotuloNivel: rotulo,
      detalhes: criterios.map(([rotuloItem, id]) => ({
        rotulo: rotuloItem,
        valor: sim(v, id) ? 'Presente' : 'Ausente',
        nivel: (sim(v, id) ? 'alerta' : 'ok') as Nivel,
      })),
      interpretacao: [
        `**${total} de 5 critérios — ${rotulo.toLowerCase()}.** Zero critérios define robustez; 1 ou 2 definem pré-fragilidade; 3 ou mais definem fragilidade. A pré-fragilidade importa porque é reversível e porque identifica quem vai se tornar frágil nos próximos anos.`,
        'O fenótipo descreve um **ciclo que se retroalimenta**: sarcopenia reduz força e velocidade de marcha, o que reduz atividade, o que agrava a sarcopenia e o gasto energético, o que reduz o apetite e o aporte, fechando o círculo. Cada critério é ao mesmo tempo consequência e causa dos demais.',
        total >= 3
          ? 'Fragilidade estabelecida associa-se a quedas, hospitalização, incapacidade, institucionalização e mortalidade, de forma independente de idade e comorbidade. É preditor melhor que a idade em praticamente todos os desfechos cirúrgicos e clínicos estudados.'
          : 'Sem fragilidade estabelecida, mantenha o rastreio periódico — a transição de robusto para pré-frágil e de pré-frágil para frágil costuma ser silenciosa e é detectável antes do primeiro evento adverso.',
        'O fenótipo mede **fragilidade física**. Modelos de acúmulo de déficits, como o índice de fragilidade e a escala clínica, incluem cognição, humor e comorbidade e podem classificar de forma diferente o mesmo paciente — os dois são válidos e respondem a perguntas distintas.',
      ],
      conduta: [
        total >= 3
          ? '**Avaliação geriátrica ampla**, com plano interdisciplinar: é a intervenção com melhor evidência em fragilidade estabelecida, e reduz institucionalização e declínio funcional.'
          : '**Intervenção preventiva em pré-fragilidade**, que é o momento de maior retorno: exercício estruturado, aporte proteico, correção de deficiências e revisão de medicamentos revertem a condição em parte considerável dos casos.',
        '**Exercício resistido progressivo, 2 a 3 vezes por semana**, combinado com treino de equilíbrio e marcha. É a única intervenção com efeito consistente sobre todos os cinco critérios do fenótipo.',
        '**Proteína de 1,2 a 1,5 g/kg/dia**, distribuída em 25 a 30 g por refeição para superar o limiar anabólico, que é mais alto no idoso (resistência anabólica). Corrija vitamina D quando deficiente e rastreie causas de perda de peso.',
        'Revise a prescrição inteira com os critérios de Beers e STOPP/START, e retire o que causa queda, hipotensão postural, sedação e confusão. **Polifarmácia é causa tratável de fragilidade**, e não apenas sua consequência.',
        'Procure e trate as causas contribuintes: anemia, insuficiência cardíaca, doença pulmonar, hipotireoidismo, depressão, dor crônica, déficit visual e auditivo, problemas dentários que limitam a alimentação, e isolamento social.',
      ],
      alertas: [
        'Fragilidade **não é sinônimo de idade avançada nem de comorbidade**: há idosos de 90 anos robustos e pessoas de 65 anos frágeis. Usar a idade como substituto leva a negar tratamento a quem o toleraria bem.',
        'Perda de peso não intencional é sinal de alarme por si só — antes de atribuí-la à fragilidade, afaste neoplasia, tuberculose, hipertireoidismo, depressão, disfagia e insuficiência de órgão.',
      ],
    }
  },
  formula: ['Fenótipo de Fried: 0 robusto · 1-2 pré-frágil · ≥ 3 frágil', 'Escala clínica de fragilidade: 1 a 9, frágil a partir de 5'],
  fundamento:
    'Fragilidade é um estado de **reserva fisiológica reduzida em múltiplos sistemas**, que torna a pessoa incapaz de responder a um estressor sem desfecho desproporcional — uma infecção urinária que em um adulto robusto gera dois dias de mal-estar produz no idoso frágil delirium, queda, imobilidade e perda funcional definitiva. O substrato biológico envolve inflamação crônica de baixo grau (o chamado inflammaging, com interleucina 6 e proteína C-reativa cronicamente elevadas), resistência anabólica do músculo esquelético à insulina e aos aminoácidos, queda de hormônios anabólicos (testosterona, hormônio de crescimento, IGF-1), disfunção mitocondrial e desregulação do eixo hipotálamo-hipófise-adrenal. O resultado somático é a sarcopenia, e é ela que fecha o ciclo descrito por Fried: menos músculo significa menos força e marcha mais lenta, o que reduz a atividade, o que acelera a perda de músculo. Entender que o ciclo é circular é o que explica por que a intervenção eficaz também precisa ser dupla — estímulo mecânico pelo exercício resistido e substrato pela proteína —, e por que nenhuma das duas isoladamente funciona bem.',
  armadilhas: [
    'Aplicar a escala clínica usando o estado do paciente no leito, e não o basal de duas semanas antes, superestima a fragilidade e pode sustentar decisões de limitação indevidas.',
    'Fragilidade e sarcopenia não são sinônimos: sarcopenia é perda de massa e função muscular, e é um dos componentes da fragilidade, que é multissistêmica.',
    'Obesidade não exclui fragilidade — a obesidade sarcopênica é particularmente perigosa e é sistematicamente subdiagnosticada porque o peso "normal ou alto" tranquiliza.',
    'Nenhum dos dois instrumentos foi feito para justificar negar tratamento. Eles informam risco e ajudam a conversa sobre objetivos; a decisão é do paciente.',
  ],
  referencias: [
    { texto: 'Fried LP, Tangen CM, Walston J, et al. Frailty in older adults: evidence for a phenotype. J Gerontol A Biol Sci Med Sci. 2001;56(3):M146-M156.' },
    { texto: 'Rockwood K, Song X, MacKnight C, et al. A global clinical measure of fitness and frailty in elderly people. CMAJ. 2005;173(5):489-495.' },
    { texto: 'Dent E, Morley JE, Cruz-Jentoft AJ, et al. Physical Frailty: ICFSR International Clinical Practice Guidelines for Identification and Management. J Nutr Health Aging. 2019;23(9):771-787.' },
  ],
}

/* ═══════════════════ 2. Escalas de desempenho em paliativos ═══════════════════ */

/**
 * Campos das escalas de desempenho, em constante nomeada, pelo mesmo motivo.
 */
const desempenhoCampos: Campo[] = [
  campoOpc('ecog', 'ECOG / Zubrod', [
    { valor: '0', rotulo: '0 — Totalmente ativo, sem restrição', pontos: 0 },
    { valor: '1', rotulo: '1 — Restrito a atividade física intensa, deambula e faz trabalho leve', pontos: 1 },
    { valor: '2', rotulo: '2 — Deambula e cuida de si, incapaz de trabalhar; fora do leito > 50% do dia', pontos: 2 },
    { valor: '3', rotulo: '3 — Capacidade limitada de autocuidado; no leito ou cadeira > 50% do dia', pontos: 3 },
    { valor: '4', rotulo: '4 — Completamente incapaz; confinado ao leito ou cadeira', pontos: 4 },
  ], { padrao: '1', ajuda: 'O divisor prático está entre 2 e 3: a proporção do dia fora do leito. Acima de 50% do dia acordado fora do leito é ECOG 2; abaixo, é 3.' }),
  campoSimNao('declinio', 'Queda de 1 ou mais pontos no ECOG nas últimas 4 a 6 semanas', 0, 'A **velocidade** do declínio prediz melhor que o valor absoluto: queda rápida em semanas indica prognóstico de semanas a poucos meses, mesmo partindo de um valor razoável.'),
  campoSimNao('sintomas', 'Sintomas mal controlados (dor, dispneia, náusea, delirium)', 0, 'Sintoma descontrolado piora o desempenho de forma reversível — e nesse caso a escala está medindo o sintoma, não a doença.'),
]

const desempenhoPaliativo: Ferramenta = {
  id: 'ecog-karnofsky-pps',
  nome: 'ECOG, Karnofsky e PPS — desempenho e prognóstico',
  sigla: 'ECOG',
  sinonimos: ['ecog', 'karnofsky', 'pps', 'performance status', 'palliative performance scale', 'paliativo'],
  resumo: 'Converte entre as escalas de desempenho e traduz o resultado em elegibilidade para tratamento e em estimativa de prognóstico.',
  categorias: ['geriatria'],
  campos: desempenhoCampos,
  calcular: (v) => {
    const ecog = ptsOpc(desempenhoCampos, v, 'ecog')
    if (ecog === null) return null
    const karnofsky = [100, 80, 60, 40, 20][ecog]
    const pps = [100, 80, 60, 40, 20][ecog]
    const declinio = sim(v, 'declinio')
    const sintomas = sim(v, 'sintomas')

    const nivel: Nivel = ecog >= 4 ? 'critico' : ecog === 3 ? 'alerta' : ecog === 2 ? 'atencao' : 'ok'

    const conduta: string[] = []
    if (ecog <= 1) {
      conduta.push('**ECOG 0 a 1:** elegível para tratamento oncológico sistêmico pleno e para a maioria dos ensaios clínicos, que costumam exigir ECOG de 0 a 1 ou 0 a 2. Trate a doença de base com intenção plena.')
    } else if (ecog === 2) {
      conduta.push('**ECOG 2:** zona de decisão. Quimioterapia é possível, frequentemente com ajuste de dose ou esquema menos tóxico, e a decisão deve pesar a reversibilidade do desempenho ruim — se ele decorre da própria doença tratável, tratar pode melhorá-lo; se decorre de comorbidade ou fragilidade, dificilmente melhora.')
    } else {
      conduta.push('**ECOG 3 a 4:** o tratamento sistêmico citotóxico causa mais dano que benefício na maioria dos contextos. A exceção são doenças de resposta rápida e previsível — algumas neoplasias hematológicas, tumor germinativo, carcinoma de pequenas células — e situações com alvo molecular acionável, em que a resposta pode devolver desempenho.')
    }
    if (sintomas) {
      conduta.push('**Sintomas mal controlados foram assinalados.** Trate-os primeiro e reavalie o desempenho depois: dor, dispneia, náusea, constipação e delirium derrubam o ECOG de forma reversível, e decidir sobre tratamento oncológico com base em um desempenho artificialmente ruim nega terapia a quem se beneficiaria.')
    }
    if (declinio) {
      conduta.push('**Declínio rápido documentado.** Isso desloca a estimativa de prognóstico para semanas a poucos meses, independentemente do valor atual. É o momento de conversar sobre objetivos de cuidado, preferências de local de morte e diretivas antecipadas — enquanto o paciente ainda pode participar da decisão.')
    }
    conduta.push(
      'Acione **cuidados paliativos junto ao tratamento oncológico**, e não depois dele: o acompanhamento paliativo precoce melhora qualidade de vida, reduz sintomas depressivos, diminui quimioterapia nos últimos 30 dias de vida e, em alguns ensaios, prolongou a sobrevida.',
      'Use a escala em **série**, não uma vez: a trajetória é o dado prognóstico, e a comparação com a consulta anterior informa mais que qualquer valor isolado.',
      'Registre o desempenho no prontuário em **toda** consulta oncológica e paliativa. Ele é exigido para elegibilidade de ensaio, orienta ajuste de dose, e é o gatilho mais usado para iniciar a conversa sobre objetivos de cuidado.',
    )

    return {
      titulo: 'Desempenho funcional',
      valor: `ECOG ${ecog}`,
      nivel,
      rotuloNivel: ['Totalmente ativo', 'Restrito a esforço intenso', 'Fora do leito > 50% do dia', 'No leito > 50% do dia', 'Confinado ao leito'][ecog],
      detalhes: [
        { rotulo: 'ECOG / Zubrod', valor: fmtInt(ecog), nota: '0 a 4' },
        { rotulo: 'Karnofsky (equivalente)', valor: `${karnofsky}%`, nota: 'Conversão aproximada; a correspondência não é exata' },
        { rotulo: 'PPS (equivalente)', valor: `${pps}%`, nota: 'A PPS acrescenta ingestão e nível de consciência' },
        { rotulo: 'Declínio recente', valor: declinio ? 'Sim' : 'Não', nivel: (declinio ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Sintomas descontrolados', valor: sintomas ? 'Sim' : 'Não', nivel: (sintomas ? 'alerta' : 'ok') as Nivel },
      ],
      interpretacao: [
        `**ECOG ${ecog}**, equivalente aproximado a Karnofsky e PPS de ${karnofsky}%. A conversão entre as escalas é aproximada: o ECOG tem 5 níveis e o Karnofsky 11, de modo que um mesmo ECOG cobre uma faixa de Karnofsky, e a PPS acrescenta dois domínios que nenhuma das outras tem — **ingestão e nível de consciência** —, o que a torna mais útil na fase final de vida.`,
        'O desempenho funcional é, isoladamente, **o preditor mais forte de sobrevida em câncer avançado**, superando o tipo histológico e o estádio na maioria das séries. Ele é também o critério que define elegibilidade para quimioterapia e para ensaios clínicos.',
        declinio
          ? '**O declínio recente é o dado mais importante aqui.** Perda de 1 ponto ou mais em 4 a 6 semanas sugere prognóstico de semanas a poucos meses, ainda que o valor absoluto atual pareça aceitável. A trajetória informa mais que o ponto.'
          : 'Sem declínio recente documentado, o valor atual representa melhor o estado do paciente. Registre-o para que a próxima avaliação permita ler a trajetória.',
        sintomas
          ? '**Atenção: há sintomas mal controlados.** Nesse cenário a escala pode estar medindo o sintoma, e não a doença. Dor, dispneia, náusea, constipação, anemia, hipercalcemia, depressão e delirium reduzem o desempenho de forma reversível.'
          : 'Sem sintomas descontrolados relatados, o desempenho tende a refletir de fato a doença de base e a reserva funcional.',
      ],
      conduta,
      alertas: [
        'Desempenho ruim por **causa reversível** (dor, anemia, hipercalcemia, infecção, depressão, delirium, efeito de opioide mal ajustado) não deve ser usado para negar tratamento. Corrija o que é corrigível e reavalie.',
        'A conversão entre ECOG, Karnofsky e PPS é **aproximada** e não deve ser usada para decidir elegibilidade formal em protocolo que especifique uma escala — use a escala que o protocolo exige.',
      ],
    }
  },
  formula: ['ECOG 0-4 · Karnofsky 100-0% · PPS 100-0%', 'Correspondência aproximada: ECOG 0≈KPS 100 · 1≈80 · 2≈60 · 3≈40 · 4≈20'],
  fundamento:
    'As escalas de desempenho medem o que a doença fez com a capacidade de a pessoa viver sua vida, e é por isso que predizem sobrevida melhor que marcadores tumorais e, em muitos cenários, melhor que o estádio. O mecanismo por trás disso é a **caquexia neoplásica**: um estado catabólico sustentado por citocinas tumorais e do hospedeiro (TNF-alfa, interleucina 6, fator indutor de proteólise) que ativa a via ubiquitina-proteassoma no músculo esquelético, promove lipólise, gera anorexia por ação hipotalâmica e produz resistência anabólica — ou seja, a perda de massa não se recupera apenas oferecendo calorias. A escala de Karnofsky, criada em 1948 para avaliar resposta à mostarda nitrogenada, foi o primeiro instrumento a transformar essa percepção em número; o ECOG a simplificou para 5 níveis, ganhando reprodutibilidade ao custo de granularidade; e a PPS acrescentou ingestão e nível de consciência, que são justamente os domínios que mudam nas últimas semanas de vida e que as outras escalas não enxergam.',
  armadilhas: [
    'As escalas são subjetivas e a concordância entre observadores é moderada — o paciente costuma se avaliar melhor do que o médico o avalia, e o familiar, pior.',
    'A conversão entre as escalas é aproximada: um mesmo ECOG cobre uma faixa inteira de Karnofsky, e usá-la para decidir elegibilidade formal em protocolo é uso indevido.',
    'Desempenho ruim em paciente com doença hematológica de resposta rápida não tem o mesmo significado que em tumor sólido refratário — o mesmo número prediz coisas diferentes conforme a doença.',
    'Nenhuma dessas escalas substitui a pergunta surpresa ("eu ficaria surpreso se este paciente morresse nos próximos 12 meses?"), que é simples, barata e identifica candidatos a cuidados paliativos com desempenho razoável.',
  ],
  referencias: [
    { texto: 'Oken MM, Creech RH, Tormey DC, et al. Toxicity and response criteria of the Eastern Cooperative Oncology Group. Am J Clin Oncol. 1982;5(6):649-655.' },
    { texto: 'Anderson F, Downing GM, Hill J, Casorso L, Lerch N. Palliative Performance Scale (PPS): a new tool. J Palliat Care. 1996;12(1):5-11.' },
    { texto: 'Temel JS, Greer JA, Muzikansky A, et al. Early palliative care for patients with metastatic non-small-cell lung cancer. N Engl J Med. 2010;363(8):733-742.' },
  ],
}

/* ═══════════ Índice de Barthel, Katz e Lawton-Brody ═══════════ */

const barthelCampos: Campo[] = [
  campoSeg('instrumento', 'Instrumento', [
    { valor: 'barthel', rotulo: 'Barthel (básicas, 0-100)' },
    { valor: 'katz', rotulo: 'Katz (básicas, 0-6)' },
    { valor: 'lawton', rotulo: 'Lawton-Brody (instrumentais, 0-8)' },
  ], { ajuda: 'Barthel e Katz medem atividades **básicas** (autocuidado); Lawton mede as **instrumentais** (vida em comunidade). As instrumentais se perdem primeiro, e por isso o Lawton detecta declínio mais cedo — é o instrumento a usar quando a queixa é "ele está mais esquecido".' }),
  campoOpc('alimentacao', 'Alimentação', [
    { valor: '10', rotulo: 'Independente', pontos: 10 },
    { valor: '5', rotulo: 'Precisa de ajuda (cortar, passar manteiga)', pontos: 5 },
    { valor: '0', rotulo: 'Dependente', pontos: 0 },
  ], { padrao: '10', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('banho', 'Banho', [
    { valor: '5', rotulo: 'Independente', pontos: 5 },
    { valor: '0', rotulo: 'Dependente', pontos: 0 },
  ], { padrao: '5', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('higiene', 'Higiene pessoal (rosto, cabelo, dentes, barba)', [
    { valor: '5', rotulo: 'Independente', pontos: 5 },
    { valor: '0', rotulo: 'Dependente', pontos: 0 },
  ], { padrao: '5', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('vestir', 'Vestir-se', [
    { valor: '10', rotulo: 'Independente, inclusive botões e zíper', pontos: 10 },
    { valor: '5', rotulo: 'Precisa de ajuda, mas faz metade sozinho', pontos: 5 },
    { valor: '0', rotulo: 'Dependente', pontos: 0 },
  ], { padrao: '10', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('intestino', 'Controle intestinal', [
    { valor: '10', rotulo: 'Continente', pontos: 10 },
    { valor: '5', rotulo: 'Acidente ocasional', pontos: 5 },
    { valor: '0', rotulo: 'Incontinente', pontos: 0 },
  ], { padrao: '10', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('bexiga', 'Controle urinário', [
    { valor: '10', rotulo: 'Continente', pontos: 10 },
    { valor: '5', rotulo: 'Acidente ocasional', pontos: 5 },
    { valor: '0', rotulo: 'Incontinente ou sondado', pontos: 0 },
  ], { padrao: '10', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('banheiro', 'Uso do banheiro', [
    { valor: '10', rotulo: 'Independente', pontos: 10 },
    { valor: '5', rotulo: 'Precisa de alguma ajuda', pontos: 5 },
    { valor: '0', rotulo: 'Dependente', pontos: 0 },
  ], { padrao: '10', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('transferencia', 'Transferência (cama para cadeira)', [
    { valor: '15', rotulo: 'Independente', pontos: 15 },
    { valor: '10', rotulo: 'Ajuda mínima ou supervisão', pontos: 10 },
    { valor: '5', rotulo: 'Consegue sentar, mas precisa de muita ajuda', pontos: 5 },
    { valor: '0', rotulo: 'Incapaz, sem equilíbrio sentado', pontos: 0 },
  ], { padrao: '15', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('deambulacao', 'Deambulação', [
    { valor: '15', rotulo: 'Independente por 50 m (pode usar bengala)', pontos: 15 },
    { valor: '10', rotulo: 'Caminha 50 m com ajuda', pontos: 10 },
    { valor: '5', rotulo: 'Independente em cadeira de rodas por 50 m', pontos: 5 },
    { valor: '0', rotulo: 'Imóvel', pontos: 0 },
  ], { padrao: '15', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoOpc('escadas', 'Escadas', [
    { valor: '10', rotulo: 'Independente', pontos: 10 },
    { valor: '5', rotulo: 'Precisa de ajuda ou supervisão', pontos: 5 },
    { valor: '0', rotulo: 'Incapaz', pontos: 0 },
  ], { padrao: '10', mostrarSe: (v) => opc(v, 'instrumento') === 'barthel' }),
  campoNum('katzTotal', 'Atividades preservadas (banho, vestir, uso do banheiro, transferência, continência, alimentação)', { min: 0, max: 6, passo: 1, mostrarSe: (v) => opc(v, 'instrumento') === 'katz', ajuda: 'Conte quantas das seis o paciente faz **sem qualquer supervisão, direção ou assistência pessoal**. O Katz é hierárquico: a perda segue a ordem inversa do desenvolvimento infantil — banho primeiro, alimentação por último.' }),
  campoNum('lawtonTotal', 'Atividades instrumentais preservadas (telefone, compras, comida, casa, roupa, transporte, medicação, dinheiro)', { min: 0, max: 8, passo: 1, mostrarSe: (v) => opc(v, 'instrumento') === 'lawton', ajuda: 'Conte quantas das oito o paciente faz de forma independente. Em homens, a escala original dispensava comida, casa e roupa por convenção da época — hoje isso é considerado viés e a recomendação é aplicar as oito a todos.' }),
]

const barthel: Ferramenta = {
  id: 'barthel-katz-lawton',
  nome: 'Barthel, Katz e Lawton-Brody — atividades de vida diária',
  sinonimos: ['barthel', 'katz', 'lawton', 'avd', 'aivd', 'atividades de vida diaria', 'funcionalidade'],
  resumo: 'Mede independência em atividades básicas e instrumentais, o dado que prediz desfecho no idoso melhor que a lista de diagnósticos.',
  categorias: ['geriatria', 'neurologia'],
  campos: barthelCampos,
  calcular: (v) => {
    const qual = opc(v, 'instrumento') ?? 'barthel'

    if (qual === 'katz') {
      const n = num(v, 'katzTotal')
      if (n === null) return null
      const nivel: Nivel = n <= 2 ? 'critico' : n <= 4 ? 'alerta' : n === 5 ? 'atencao' : 'ok'
      return {
        titulo: 'Índice de Katz',
        valor: fmtInt(n),
        unidade: 'de 6 atividades',
        nivel,
        rotuloNivel: n === 6 ? 'Independente' : n >= 4 ? 'Dependência moderada' : 'Dependência grave',
        detalhes: [
          { rotulo: 'Atividades preservadas', valor: `${fmtInt(n)} de 6` },
          { rotulo: 'Leitura', valor: '6 independente · 4-5 dependência moderada · ≤ 3 dependência grave' },
        ],
        interpretacao: [
          `**${n} de 6 atividades básicas preservadas.** O Katz avalia banho, vestir-se, uso do banheiro, transferência, continência e alimentação, e considera independente apenas quem realiza a atividade **sem qualquer supervisão, direção ou assistência pessoal**.`,
          'A escala é **hierárquica**, e essa é sua contribuição conceitual: a perda segue uma ordem previsível, aproximadamente inversa à aquisição dessas mesmas habilidades na infância — o banho se perde primeiro e a alimentação por último. Uma perda fora dessa ordem sugere causa focal, como um acidente vascular, e não declínio global.',
          'O Katz é mais **grosseiro** que o Barthel: com apenas 6 itens dicotômicos, ele detecta mal mudanças pequenas e serve melhor para classificar do que para acompanhar resposta à reabilitação.',
          'Funcionalidade prediz mortalidade, institucionalização, reinternação e complicação cirúrgica **melhor que idade e melhor que a lista de comorbidades** — e é o dado que menos costuma estar registrado no prontuário.',
        ],
        conduta: [
          n < 6
            ? '**Há dependência.** Antes de aceitá-la como definitiva, procure causas reversíveis: dor não tratada, depressão, déficit visual e auditivo, efeito de medicamento (sedativo, anticolinérgico, anti-hipertensivo com hipotensão postural), anemia, hipotireoidismo, desnutrição e descondicionamento por imobilidade recente.'
            : '**Independente nas seis.** Registre isso como basal: é contra ele que uma internação futura será comparada, e é essa comparação que orienta decisão em crise.',
          'Acione **fisioterapia e terapia ocupacional**. A perda funcional adquirida no hospital é frequente, começa em poucos dias de repouso e é em grande parte evitável com mobilização precoce.',
          'Avalie o domicílio e o **cuidador**: barras de apoio, retirada de tapetes, iluminação noturna, altura do vaso e da cama, e sobrecarga de quem cuida — que se mede pela escala de Zarit e prediz institucionalização de forma independente.',
          'Aplique o **Lawton** em paralelo: as instrumentais se perdem antes das básicas, e um Katz de 6 com Lawton reduzido é o padrão do comprometimento cognitivo inicial.',
        ],
        alertas: [
          'Avalie o que a pessoa **faz**, não o que ela seria capaz de fazer. Idoso que pode tomar banho sozinho mas não toma há meses é dependente para efeito prognóstico.',
          'Informação colateral é indispensável: tanto o paciente quanto o familiar distorcem — um por autonomia percebida, outro por proteção.',
        ],
      }
    }

    if (qual === 'lawton') {
      const n = num(v, 'lawtonTotal')
      if (n === null) return null
      const nivel: Nivel = n <= 3 ? 'critico' : n <= 5 ? 'alerta' : n <= 7 ? 'atencao' : 'ok'
      return {
        titulo: 'Escala de Lawton-Brody',
        valor: fmtInt(n),
        unidade: 'de 8 atividades',
        nivel,
        rotuloNivel: n === 8 ? 'Independente' : n >= 6 ? 'Dependência leve' : n >= 4 ? 'Dependência moderada' : 'Dependência grave',
        detalhes: [
          { rotulo: 'Atividades instrumentais preservadas', valor: `${fmtInt(n)} de 8` },
          { rotulo: 'Avaliadas', valor: 'Telefone, compras, preparo de comida, tarefas domésticas, roupa, transporte, medicação e dinheiro' },
        ],
        interpretacao: [
          `**${n} de 8 atividades instrumentais preservadas.** As instrumentais exigem função executiva, memória e julgamento — planejar, sequenciar, calcular, antecipar —, e por isso **se perdem antes** das básicas, que dependem sobretudo de motricidade.`,
          'Essa precedência torna o Lawton o instrumento mais sensível para detectar declínio funcional precoce. Perda de instrumentais com básicas preservadas é o padrão do **comprometimento cognitivo leve e da demência inicial**, e é o achado que justifica investigação cognitiva formal.',
          'Os itens de maior valor discriminante são **gerenciar a própria medicação** e **administrar as finanças**: ambos exigem função executiva íntegra, e ambos têm consequências imediatas quando falham — erro de dose e vulnerabilidade a golpe financeiro.',
          'A versão original atribuía apenas 5 itens aos homens, excluindo preparo de comida, tarefas domésticas e lavar roupa por convenção da época. Hoje isso é reconhecido como viés, e a recomendação é aplicar as **oito atividades a todos**.',
        ],
        conduta: [
          n < 8
            ? '**Há perda de atividades instrumentais.** Investigue cognição com MoCA ou MMSE ajustados por escolaridade, rastreie depressão com a GDS-15, e revise a prescrição procurando fármacos com carga anticolinérgica.'
            : 'Independente nas oito. Registre como basal e reavalie periodicamente — a perda de instrumentais costuma ser o primeiro sinal objetivo de declínio.',
          'Priorize a segurança nos dois itens de maior risco: **organize a medicação** (caixa semanal, dispensador, supervisão de terceiro) e **proteja as finanças**, que é onde a perda executiva produz dano irreversível e onde a família costuma perceber o problema tarde demais.',
          'Ofereça **terapia ocupacional** para adaptação de tarefas e do ambiente: ela preserva independência por mais tempo e reduz sobrecarga do cuidador.',
          'Reavalie a cada 6 a 12 meses, ou antes se houver queixa. A **trajetória** informa mais que o valor isolado, e a queda rápida sugere causa aguda — delirium, depressão, fármaco novo, evento vascular.',
        ],
        alertas: [
          'Nunca pontue por presunção de papel: um homem que nunca cozinhou não é "dependente" para esse item por hábito, e uma mulher que nunca dirigiu tampouco. Pergunte se ele **conseguiria** fazer hoje o que fazia antes.',
          'Perda de instrumentais tem diagnóstico diferencial amplo — depressão, déficit sensorial, artrose, medicação — e não é sinônimo de demência.',
        ],
      }
    }

    const ids = ['alimentacao', 'banho', 'higiene', 'vestir', 'intestino', 'bexiga', 'banheiro', 'transferencia', 'deambulacao', 'escadas']
    const pontos = ids.map((id) => ptsOpc(barthelCampos, v, id))
    if (pontos.some((p) => p === null)) return null
    const total = (pontos as number[]).reduce((a, b) => a + b, 0)

    const nivel: Nivel = total < 20 ? 'critico' : total < 60 ? 'alerta' : total < 90 ? 'atencao' : 'ok'
    const faixa = total >= 100 ? 'Independente' : total >= 90 ? 'Dependência mínima' : total >= 60 ? 'Dependência leve' : total >= 20 ? 'Dependência moderada' : 'Dependência total'

    return {
      titulo: 'Índice de Barthel',
      valor: fmtInt(total),
      unidade: 'de 100 pontos',
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'Mobilidade (transferência + deambulação + escadas)', valor: fmtInt((pontos[7] as number) + (pontos[8] as number) + (pontos[9] as number)), nota: 'de 40 — é o bloco de maior peso' },
        { rotulo: 'Continência (intestinal + urinária)', valor: fmtInt((pontos[4] as number) + (pontos[5] as number)), nota: 'de 20' },
        { rotulo: 'Autocuidado', valor: fmtInt((pontos[0] as number) + (pontos[1] as number) + (pontos[2] as number) + (pontos[3] as number) + (pontos[6] as number)), nota: 'de 40' },
        { rotulo: 'Faixa', valor: faixa, nota: '100 independente · 90-99 mínima · 60-89 leve · 20-59 moderada · < 20 total' },
      ],
      interpretacao: [
        `**${total} de 100 pontos — ${faixa.toLowerCase()}.** O Barthel pontua em múltiplos de 5 e dá peso maior à **mobilidade** (transferência, deambulação e escadas somam 40 pontos), porque é ela que determina, na prática, se a pessoa consegue viver em casa.`,
        'Uma variação de **20 pontos** é a diferença clinicamente relevante habitualmente citada, e é o que se usa para medir resposta à reabilitação. O índice é mais granular que o Katz e por isso melhor para acompanhamento seriado.',
        'O Barthel tem **efeito teto**: um paciente com 100 pontos pode ainda assim ter perdas instrumentais importantes, e é por isso que ele deve ser lido em conjunto com o Lawton em avaliação ambulatorial.',
        'Em reabilitação de acidente vascular cerebral, o Barthel é um dos desfechos mais usados, e o valor na alta prediz destino (domicílio, instituição) e necessidade de cuidador de forma independente.',
      ],
      conduta: [
        total < 100
          ? '**Há dependência mensurável.** Procure causas reversíveis antes de aceitá-la: dor, depressão, déficit sensorial, medicação sedativa ou anticolinérgica, anemia, hipotireoidismo, desnutrição e descondicionamento.'
          : 'Independente. Registre como basal — é a referência contra a qual uma internação futura será comparada.',
        'Acione **fisioterapia e terapia ocupacional** precocemente. A perda funcional hospitalar começa em poucos dias de repouso e é em boa parte evitável com mobilização precoce, que reduz delirium, tempo de internação e institucionalização.',
        'Combine com **nutrição**: 1,2 a 1,5 g/kg/dia de proteína somados a exercício resistido são a base da recuperação funcional, e a oferta sem estímulo mecânico produz pouco ganho.',
        'Planeje a alta a partir do escore: avalie domicílio, escadas, banheiro, disponibilidade de cuidador e necessidade de equipamento. Escore baixo sem suporte domiciliar adequado é causa evitável de reinternação precoce.',
        'Reavalie na admissão, semanalmente e na alta. A **trajetória** é o que orienta o plano de reabilitação, e a comparação com o basal é o que define se o objetivo é recuperar ou compensar.',
      ],
      alertas: [
        'Pontue o **desempenho real nas últimas 24 a 48 horas**, não a capacidade teórica nem o que o paciente fazia antes de adoecer.',
        'Efeito teto: Barthel de 100 não significa ausência de declínio — aplique o Lawton em paralelo, porque as instrumentais se perdem antes.',
      ],
    }
  },
  formula: ['Barthel: 10 itens, 0 a 100 em múltiplos de 5', 'Katz: 6 atividades básicas preservadas, 0 a 6', 'Lawton-Brody: 8 atividades instrumentais preservadas, 0 a 8'],
  fundamento:
    'A funcionalidade é o desfecho que mais importa para o idoso e o preditor mais forte de praticamente tudo o que interessa clinicamente — mortalidade, institucionalização, reinternação, delirium e complicação cirúrgica —, superando idade e índices de comorbidade. A razão é conceitual: enquanto a lista de diagnósticos descreve quais sistemas estão doentes, a funcionalidade mede o que restou de **reserva integrada** depois que todos eles interagiram com o envelhecimento e com o ambiente. A distinção entre atividades básicas e instrumentais tem base neuropsicológica: as **básicas** (banho, vestir, higiene, transferência, continência, alimentação) dependem sobretudo de integridade motora, sensorial e de circuitos automatizados; as **instrumentais** (telefone, compras, cozinhar, finanças, medicação, transporte) exigem função executiva — planejar, sequenciar, monitorar, corrigir — que depende de circuitos frontoestriatais. Como o declínio cognitivo atinge o lobo frontal antes de comprometer a motricidade, as instrumentais se perdem primeiro, e essa precedência transforma o Lawton num detector precoce. O Katz acrescentou ainda a observação de que a perda das básicas é **hierárquica** e aproximadamente inversa à ordem em que a criança as adquire — uma regularidade que torna a perda fora de ordem um sinal de causa focal, e não de declínio global.',
  armadilhas: [
    'Pontuar capacidade presumida em vez de desempenho real é o erro mais comum e superestima a independência.',
    'O relato do paciente superestima e o do familiar subestima; a triangulação com observação direta é o que resolve.',
    'Barthel e Katz têm efeito teto e não detectam declínio inicial — nesse cenário, o Lawton é o instrumento.',
    'Avaliar funcionalidade durante a doença aguda mede a doença, não o basal. Registre os dois separadamente, e classifique o basal pelo estado de duas semanas antes.',
  ],
  referencias: [
    { texto: 'Mahoney FI, Barthel DW. Functional evaluation: the Barthel Index. Md State Med J. 1965;14:61-65.' },
    { texto: 'Katz S, Ford AB, Moskowitz RW, Jackson BA, Jaffe MW. Studies of illness in the aged. The index of ADL. JAMA. 1963;185:914-919.' },
    { texto: 'Lawton MP, Brody EM. Assessment of older people: self-maintaining and instrumental activities of daily living. Gerontologist. 1969;9(3):179-186.' },
  ],
}

/* ═══════════ Braden e Morse — lesão por pressão e risco de queda ═══════════ */

const bradenCampos: Campo[] = [
  campoSeg('escala', 'Escala', [
    { valor: 'braden', rotulo: 'Braden (lesão por pressão)' },
    { valor: 'morse', rotulo: 'Morse (risco de queda)' },
  ], { ajuda: 'As duas são aplicadas pela enfermagem na admissão e reavaliadas periodicamente. Braden pontua **de 6 a 23, e quanto menor pior**; Morse pontua de 0 a 125, e quanto maior pior — a inversão entre elas é fonte constante de erro de registro.' }),
  campoOpc('percepcao', 'Percepção sensorial', [
    { valor: '1', rotulo: '1 — Totalmente limitada: não responde a estímulo doloroso', pontos: 1 },
    { valor: '2', rotulo: '2 — Muito limitada: responde só a dor, não comunica desconforto', pontos: 2 },
    { valor: '3', rotulo: '3 — Levemente limitada: responde a comando, alguma dificuldade em comunicar', pontos: 3 },
    { valor: '4', rotulo: '4 — Nenhuma limitação', pontos: 4 },
  ], { padrao: '4', mostrarSe: (v) => opc(v, 'escala') === 'braden', ajuda: 'Capacidade de sentir e comunicar desconforto. Sedação, rebaixamento, neuropatia diabética e lesão medular abolem o sinal de alarme que faria a pessoa mudar de posição sozinha — é o mecanismo central da lesão por pressão.' }),
  campoOpc('umidade', 'Umidade da pele', [
    { valor: '1', rotulo: '1 — Constantemente úmida', pontos: 1 },
    { valor: '2', rotulo: '2 — Muito úmida: troca de roupa ao menos uma vez por turno', pontos: 2 },
    { valor: '3', rotulo: '3 — Ocasionalmente úmida', pontos: 3 },
    { valor: '4', rotulo: '4 — Raramente úmida', pontos: 4 },
  ], { padrao: '4', mostrarSe: (v) => opc(v, 'escala') === 'braden', ajuda: 'Incontinência, sudorese e drenagem maceram a pele e reduzem sua resistência ao cisalhamento — a dermatite associada à incontinência é um diagnóstico distinto da lesão por pressão e frequentemente confundido com ela.' }),
  campoOpc('atividade', 'Atividade', [
    { valor: '1', rotulo: '1 — Acamado', pontos: 1 },
    { valor: '2', rotulo: '2 — Restrito à cadeira', pontos: 2 },
    { valor: '3', rotulo: '3 — Anda ocasionalmente', pontos: 3 },
    { valor: '4', rotulo: '4 — Anda com frequência', pontos: 4 },
  ], { padrao: '4', mostrarSe: (v) => opc(v, 'escala') === 'braden' }),
  campoOpc('mobilidade', 'Mobilidade', [
    { valor: '1', rotulo: '1 — Totalmente imóvel', pontos: 1 },
    { valor: '2', rotulo: '2 — Muito limitada', pontos: 2 },
    { valor: '3', rotulo: '3 — Levemente limitada', pontos: 3 },
    { valor: '4', rotulo: '4 — Não limitada', pontos: 4 },
  ], { padrao: '4', mostrarSe: (v) => opc(v, 'escala') === 'braden', ajuda: 'Capacidade de **mudar e controlar a posição do corpo**. É diferente de atividade: um paciente restrito ao leito que se vira sozinho tem mobilidade preservada e risco bem menor.' }),
  campoOpc('nutricao', 'Nutrição', [
    { valor: '1', rotulo: '1 — Muito pobre: come menos de 1/3, sem suplemento', pontos: 1 },
    { valor: '2', rotulo: '2 — Provavelmente inadequada', pontos: 2 },
    { valor: '3', rotulo: '3 — Adequada', pontos: 3 },
    { valor: '4', rotulo: '4 — Excelente', pontos: 4 },
  ], { padrao: '4', mostrarSe: (v) => opc(v, 'escala') === 'braden' }),
  campoOpc('friccao', 'Fricção e cisalhamento', [
    { valor: '1', rotulo: '1 — Problema: precisa de assistência máxima, escorrega na cama', pontos: 1 },
    { valor: '2', rotulo: '2 — Problema potencial: move-se com alguma dificuldade', pontos: 2 },
    { valor: '3', rotulo: '3 — Sem problema aparente', pontos: 3 },
  ], { padrao: '3', mostrarSe: (v) => opc(v, 'escala') === 'braden', ajuda: 'Único item que vai só até 3. O **cisalhamento** — que ocorre quando o paciente escorrega com a cabeceira elevada e a pele fica presa enquanto o esqueleto desliza — angula e oclui os vasos perfurantes e causa lesão profunda com pele ainda íntegra.' }),
  campoOpc('quedaPrevia', 'História de queda (nos últimos 3 meses ou durante a internação)', [
    { valor: '0', rotulo: 'Não', pontos: 0 },
    { valor: '25', rotulo: 'Sim', pontos: 25 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'morse', ajuda: 'É o item de maior peso junto com o diagnóstico secundário. Queda prévia é o preditor isolado mais forte de nova queda.' }),
  campoOpc('diagSecundario', 'Diagnóstico secundário (mais de um diagnóstico ativo)', [
    { valor: '0', rotulo: 'Não', pontos: 0 },
    { valor: '15', rotulo: 'Sim', pontos: 15 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'morse' }),
  campoOpc('auxilio', 'Auxílio para deambular', [
    { valor: '0', rotulo: 'Nenhum, acamado, ou auxiliado por profissional', pontos: 0 },
    { valor: '15', rotulo: 'Muletas, bengala ou andador', pontos: 15 },
    { valor: '30', rotulo: 'Apoia-se em móveis e paredes', pontos: 30 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'morse', ajuda: 'Apoiar-se em móveis pontua **mais** que usar andador: indica necessidade de apoio sem o dispositivo adequado, que é a combinação de maior risco.' }),
  campoOpc('venoso', 'Terapia intravenosa ou dispositivo salinizado', [
    { valor: '0', rotulo: 'Não', pontos: 0 },
    { valor: '20', rotulo: 'Sim', pontos: 20 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'morse' }),
  campoOpc('marcha', 'Marcha', [
    { valor: '0', rotulo: 'Normal, acamado ou em cadeira de rodas', pontos: 0 },
    { valor: '10', rotulo: 'Fraca: passos curtos, apoia-se em mobiliário', pontos: 10 },
    { valor: '20', rotulo: 'Comprometida: dificuldade para levantar, equilíbrio instável', pontos: 20 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'morse' }),
  campoOpc('estadoMental', 'Estado mental', [
    { valor: '0', rotulo: 'Consciente das próprias limitações', pontos: 0 },
    { valor: '15', rotulo: 'Superestima a própria capacidade ou esquece as limitações', pontos: 15 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'morse', ajuda: 'Pergunte se o paciente pode ir ao banheiro sozinho e compare com a avaliação da equipe. A discordância entre o que ele acha que consegue e o que de fato consegue é o item.' }),
]

const bradenMorse: Ferramenta = {
  id: 'braden-morse',
  nome: 'Braden e Morse — lesão por pressão e risco de queda',
  sinonimos: ['braden', 'morse', 'lesao por pressao', 'ulcera de pressao', 'risco de queda', 'escala de enfermagem'],
  resumo: 'Estratifica o risco de lesão por pressão e de queda intra-hospitalar, e converte cada faixa em medidas preventivas concretas.',
  categorias: ['geriatria', 'emergencia'],
  campos: bradenCampos,
  calcular: (v) => {
    const morse = opc(v, 'escala') === 'morse'

    if (morse) {
      const ids = ['quedaPrevia', 'diagSecundario', 'auxilio', 'venoso', 'marcha', 'estadoMental']
      const pontos = ids.map((id) => ptsOpc(bradenCampos, v, id))
      if (pontos.some((p) => p === null)) return null
      const total = (pontos as number[]).reduce((a, b) => a + b, 0)
      const nivel: Nivel = total >= 45 ? 'alerta' : total >= 25 ? 'atencao' : 'ok'
      const faixa = total >= 45 ? 'Risco alto' : total >= 25 ? 'Risco baixo a moderado' : 'Sem risco'

      return {
        titulo: 'Escala de Morse',
        valor: fmtInt(total),
        unidade: 'de 125 pontos',
        nivel,
        rotuloNivel: faixa,
        detalhes: [
          { rotulo: 'Queda prévia', valor: (pontos[0] as number) > 0 ? 'Sim (25)' : 'Não', nivel: ((pontos[0] as number) > 0 ? 'alerta' : 'ok') as Nivel },
          { rotulo: 'Diagnóstico secundário', valor: (pontos[1] as number) > 0 ? 'Sim (15)' : 'Não' },
          { rotulo: 'Auxílio para deambular', valor: fmtInt(pontos[2] as number) },
          { rotulo: 'Terapia intravenosa', valor: (pontos[3] as number) > 0 ? 'Sim (20)' : 'Não' },
          { rotulo: 'Marcha', valor: fmtInt(pontos[4] as number) },
          { rotulo: 'Estado mental', valor: (pontos[5] as number) > 0 ? 'Superestima a capacidade (15)' : 'Consciente das limitações' },
          { rotulo: 'Faixa', valor: faixa, nota: '0-24 sem risco · 25-44 baixo a moderado · ≥ 45 alto' },
        ],
        interpretacao: [
          `**${total} de 125 pontos — ${faixa.toLowerCase()}.** Na escala de Morse, **quanto maior, pior** — o oposto da Braden, e a inversão entre as duas é uma fonte recorrente de erro de registro quando as duas são preenchidas na mesma admissão.`,
          'Apoiar-se em **móveis e paredes** pontua 30, mais que usar andador (15). A lógica é que o paciente precisa de apoio mas não tem o dispositivo adequado — e improvisar apoio em mobiliário instável é a combinação de maior risco.',
          'A **terapia intravenosa** pontua não pelo soro em si, mas pelo conjunto: suporte, equipo, cabos e a necessidade de levá-los ao banheiro no meio da noite.',
          'O item de **estado mental** captura a discordância entre a capacidade percebida e a real. O paciente que esquece que não pode andar sozinho é o que cai — e a demência, o delirium e o pós-operatório imediato são os cenários clássicos.',
        ],
        conduta: [
          total >= 45
            ? '**Alto risco: implante o protocolo completo.** Sinalização à beira do leito e no prontuário, campainha ao alcance, cama baixa e travada, grades conforme protocolo, calçado antiderrapante, iluminação noturna, banheiro desobstruído, acompanhamento nas idas ao banheiro e rondas horárias proativas.'
            : total >= 25
              ? '**Risco baixo a moderado:** medidas padrão de segurança, orientação ao paciente e ao acompanhante, e reavaliação a cada mudança clínica ou de medicação.'
              : '**Sem risco identificado:** mantenha as medidas universais de segurança e reavalie a cada 24 a 48 horas ou a qualquer mudança clínica.',
          '**Revise a prescrição procurando fármacos que derrubam.** Benzodiazepínicos, Z-drugs, antipsicóticos, antidepressivos, opioides, anticolinérgicos, anti-hipertensivos que causam hipotensão postural e hipoglicemiantes são a causa mais modificável de queda hospitalar — e a que menos costuma ser abordada.',
          'Meça a **pressão em pé** em quem tem tontura ao levantar: queda de 20 mmHg na sistólica ou de 10 mmHg na diastólica em 3 minutos define hipotensão postural, que é tratável.',
          'Corrija o que é corrigível: visão (catarata, óculos errados), audição, dor, sono, anemia, distúrbio eletrolítico, incontinência e pés — calçado inadequado e alterações podológicas respondem por parte relevante das quedas.',
          'Após qualquer queda, **investigue a causa** em vez de apenas registrar o evento: síncope, arritmia, acidente vascular, hipoglicemia, infecção e delirium se apresentam como queda, e a queda é sintoma antes de ser acidente.',
        ],
        alertas: [
          '**Contenção física não previne queda** e aumenta lesão, delirium e mortalidade. Grades elevadas em paciente agitado transformam queda de 50 cm em queda de 1,20 m.',
          'A escala de Morse identifica risco mas **não previne nada sozinha**: o que reduz queda é o pacote multicomponente implementado, não o escore registrado.',
        ],
      }
    }

    const ids = ['percepcao', 'umidade', 'atividade', 'mobilidade', 'nutricao', 'friccao']
    const pontos = ids.map((id) => ptsOpc(bradenCampos, v, id))
    if (pontos.some((p) => p === null)) return null
    const total = (pontos as number[]).reduce((a, b) => a + b, 0)

    const nivel: Nivel = total <= 9 ? 'critico' : total <= 12 ? 'alerta' : total <= 14 ? 'alerta' : total <= 18 ? 'atencao' : 'ok'
    const faixa = total <= 9 ? 'Risco muito alto' : total <= 12 ? 'Risco alto' : total <= 14 ? 'Risco moderado' : total <= 18 ? 'Risco leve' : 'Sem risco'

    return {
      titulo: 'Escala de Braden',
      valor: fmtInt(total),
      unidade: 'de 23 pontos',
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'Percepção sensorial', valor: fmtInt(pontos[0] as number) },
        { rotulo: 'Umidade', valor: fmtInt(pontos[1] as number) },
        { rotulo: 'Atividade', valor: fmtInt(pontos[2] as number) },
        { rotulo: 'Mobilidade', valor: fmtInt(pontos[3] as number) },
        { rotulo: 'Nutrição', valor: fmtInt(pontos[4] as number) },
        { rotulo: 'Fricção e cisalhamento', valor: fmtInt(pontos[5] as number), nota: 'Único item que vai só até 3' },
        { rotulo: 'Faixa', valor: faixa, nota: '≤ 9 muito alto · 10-12 alto · 13-14 moderado · 15-18 leve · ≥ 19 sem risco' },
      ],
      interpretacao: [
        `**${total} de 23 pontos — ${faixa.toLowerCase()}.** Na Braden, **quanto menor, pior**. O corte de 18 é o usado no Brasil e em boa parte dos serviços para iniciar medidas preventivas, e abaixo de 13 o risco é alto o bastante para exigir superfície de redistribuição de pressão.`,
        'Os seis itens cobrem os três mecanismos da lesão por pressão: **pressão** (atividade e mobilidade), **tolerância tecidual** (nutrição, umidade, percepção sensorial) e **cisalhamento** — este último com escala própria de 3 pontos, porque é o mecanismo que produz lesão profunda com a pele ainda íntegra.',
        'Atividade e mobilidade são itens **diferentes**: um paciente restrito ao leito que se vira sozinho tem risco muito menor que outro igualmente acamado e imóvel. É a incapacidade de **redistribuir a própria pressão** que causa a lesão, não o fato de estar na cama.',
        'A escala tem sensibilidade e especificidade apenas moderadas, e as revisões sistemáticas mostram que o uso isolado de escalas não reduz incidência — o que reduz é **a avaliação da pele combinada ao pacote de prevenção**, disparado por qualquer um dos dois.',
      ],
      conduta: [
        total <= 14
          ? '**Risco moderado a muito alto: implante o pacote completo.** Reposicionamento a cada 2 horas (ou conforme a superfície de suporte), **superfície de redistribuição de pressão** (colchão de espuma viscoelástica ou de pressão alternada), proteção de proeminências ósseas com curativo de espuma de silicone multicamadas — sacro, calcâneos, trocânteres —, cabeceira em no máximo 30° e elevação dos calcâneos fora do colchão.'
          : '**Risco leve ou ausente:** mantenha inspeção diária da pele, hidratação, mobilização e nutrição adequadas. Reavalie a cada 24 a 48 h e a cada mudança clínica.',
        '**Inspecione a pele diariamente**, com atenção a sacro, calcâneos, trocânteres, occipital, orelhas e pontos sob dispositivos — sonda, cânula, máscara de ventilação não invasiva, oxímetro e colar cervical. A lesão por **dispositivo médico** responde por uma fração crescente dos casos e não é capturada pela Braden.',
        'Garanta o suporte nutricional: **1,2 a 1,5 g/kg/dia de proteína**, calorias adequadas e hidratação. A desnutrição é fator de risco independente e é também o que impede a cicatrização depois que a lesão se instala.',
        'Trate a **umidade** como problema próprio: manejo de incontinência, produtos de barreira e troca imediata. A dermatite associada à incontinência é um diagnóstico distinto, tem tratamento diferente e é sistematicamente confundida com lesão por pressão estágio 1 ou 2.',
        'Documente o estágio quando houver lesão: 1 (eritema não branqueável com pele íntegra), 2 (perda parcial da derme), 3 (perda total da pele, gordura visível), 4 (exposição de músculo, tendão ou osso), **não classificável** (base coberta por esfacelo ou escara) e **lesão tecidual profunda** (descoloração vinhosa persistente com pele íntegra). Nunca "reestadie" uma lesão em cicatrização — uma lesão estágio 4 que melhora é "estágio 4 em cicatrização", não estágio 2.',
      ],
      alertas: [
        '**A escala não substitui a inspeção da pele.** Braden alto com lesão já presente é situação comum, e o escore tranquiliza enquanto a lesão avança.',
        'Lesão por **dispositivo médico** (cânula, sonda, máscara, oxímetro, colar) não é capturada pela escala e exige inspeção específica em cada troca de turno.',
        'A Braden pontua **de 6 a 23, e menor é pior**; a Morse pontua até 125, e maior é pior. Registrar uma no campo da outra é erro frequente e inverte completamente a leitura do risco.',
      ],
    }
  },
  formula: ['Braden = 5 itens de 1 a 4 + fricção de 1 a 3 (total de 6 a 23; menor é pior)', 'Morse = queda prévia (25) + diagnóstico secundário (15) + auxílio (0/15/30) + acesso venoso (20) + marcha (0/10/20) + estado mental (15)'],
  fundamento:
    'A lesão por pressão nasce de uma equação simples entre **intensidade e duração da pressão** contra a **tolerância do tecido**. Quando a pressão externa sobre uma proeminência óssea ultrapassa a pressão de fechamento capilar — historicamente citada em torno de 32 mmHg, embora seja muito variável —, o fluxo cessa, e a isquemia leva a acúmulo de metabólitos, acidose, aumento da permeabilidade capilar, edema e morte celular. O detalhe que explica a gravidade é a distribuição: a pressão se concentra na interface entre osso e tecido profundo, de modo que o **músculo, mais sensível à isquemia que a pele, morre primeiro** — e é por isso que existe a lesão tecidual profunda, em que a pele parece apenas descolorada enquanto há necrose extensa por baixo, e por isso que o estadiamento visual subestima o dano real. O **cisalhamento** agrava tudo: quando a cabeceira está elevada e o paciente escorrega, a pele fica aderida ao lençol enquanto o esqueleto desliza, angulando e ocluindo os vasos perfurantes com uma fração da pressão perpendicular necessária. É esse mecanismo que justifica o limite de 30° de cabeceira, e é ele que a Braden isola num item próprio. Em pessoas com percepção sensorial íntegra, micromovimentos inconscientes redistribuem a pressão continuamente, mesmo durante o sono — a lesão por pressão é, antes de tudo, a falência desse reflexo protetor.',
  armadilhas: [
    'A Braden subestima o risco em pacientes críticos com instabilidade hemodinâmica, uso de vasopressor e edema, em que a perfusão tecidual está comprometida independentemente do escore.',
    'Nenhuma das duas escalas previne por si: a evidência de redução de incidência vem do pacote de prevenção implementado, não do registro do número.',
    'Massagear área avermelhada é prática antiga e contraindicada — pode agravar a lesão tecidual profunda subjacente.',
    'Colchão de pressão alternada não dispensa reposicionamento, e o calcâneo continua precisando de elevação fora da superfície, porque nenhuma superfície redistribui pressão num ponto de contato tão pequeno.',
  ],
  referencias: [
    { texto: 'Bergstrom N, Braden BJ, Laguzza A, Holman V. The Braden Scale for Predicting Pressure Sore Risk. Nurs Res. 1987;36(4):205-210.' },
    { texto: 'Morse JM, Morse RM, Tylko SJ. Development of a scale to identify the fall-prone patient. Can J Aging. 1989;8(4):366-377.' },
    { texto: 'European Pressure Ulcer Advisory Panel, National Pressure Injury Advisory Panel, Pan Pacific Pressure Injury Alliance. Prevention and Treatment of Pressure Ulcers/Injuries: Clinical Practice Guideline. 3ª ed. 2019.' },
  ],
}

export const ferramentas: Ferramenta[] = [fragilidade, desempenhoPaliativo, barthel, bradenMorse]

export default ferramentas
