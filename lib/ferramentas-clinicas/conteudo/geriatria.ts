import type { Campo, Ferramenta, Nivel } from '../tipos'
import { campoOpc, campoSeg, campoSimNao, fmtInt, opc, ptsOpc, sim, somaSimNao } from '../helpers'

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

export const ferramentas: Ferramenta[] = [fragilidade, desempenhoPaliativo]

export default ferramentas
