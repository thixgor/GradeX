import type { Ferramenta, Nivel } from '../tipos'
import { campoNum, campoOpc, campoSeg, campoSimNao, fmt, fmtInt, fmtPct, num, opc, ptsOpc, sim, somaSimNao } from '../helpers'

/* ═════════════════════ 1. Regras de Ottawa (tornozelo e joelho) ═════════════════════ */

const ottawa: Ferramenta = {
  id: 'regras-ottawa',
  nome: 'Regras de Ottawa para tornozelo, pé e joelho',
  sinonimos: ['ottawa', 'ottawa ankle rules', 'entorse tornozelo', 'radiografia joelho', 'trauma tornozelo'],
  resumo: 'Decide quem precisa de radiografia após trauma de tornozelo, pé ou joelho, com sensibilidade próxima de 100% para fratura clinicamente relevante.',
  categorias: ['especialidades', 'emergencia'],
  campos: [
    campoSeg('regiao', 'Região', [
      { valor: 'tornozelo', rotulo: 'Tornozelo e pé' },
      { valor: 'joelho', rotulo: 'Joelho' },
    ], { ajuda: 'As regras são distintas e não intercambiáveis: a de tornozelo e pé é de Ottawa, e a de joelho tem duas versões validadas — a de Ottawa e a de Pittsburgh.' }),
    campoSimNao('idade', 'Idade menor que 18 ou maior que 55 anos', 0, 'Fora dessa faixa etária a regra de tornozelo não foi validada com a mesma segurança: a criança tem placa de crescimento e o idoso tem osso osteoporótico, e ambos fraturam com mecanismo trivial.'),
    campoSimNao('carga', 'Incapacidade de dar 4 passos imediatamente após o trauma E na avaliação', 0, 'Os quatro passos são dois com cada pé, mesmo mancando. É o item de maior peso e o mais mal aplicado: não basta relatar dor, é preciso testar de fato.'),
    campoSimNao('maleoloLateral', 'Dor à palpação da borda posterior ou da ponta do maléolo lateral (6 cm distais)', 0, 'Palpe a **borda posterior** da fíbula nos 6 cm distais, não a face lateral do tornozelo: dor em partes moles laterais é a regra em qualquer entorse e não é o critério.', ),
    campoSimNao('maleoloMedial', 'Dor à palpação da borda posterior ou da ponta do maléolo medial (6 cm distais)', 0, 'Mesma lógica: borda posterior da tíbia nos 6 cm distais.'),
    campoSimNao('base5', 'Dor à palpação da base do quinto metatarso', 0, 'Local da fratura de Jones e da avulsão da base do quinto metatarso, que é a fratura mais comum do pé em entorse por inversão.'),
    campoSimNao('navicular', 'Dor à palpação do navicular', 0, 'Palpe a proeminência óssea na face medial do médio-pé.'),
    campoSimNao('j55', 'Idade de 55 anos ou mais', 0, undefined),
    campoSimNao('patela', 'Dor isolada à palpação da patela', 0, 'Isolada significa: sem dor óssea em nenhum outro ponto do joelho.'),
    campoSimNao('fibula', 'Dor à palpação da cabeça da fíbula', 0, undefined),
    campoSimNao('flexao', 'Incapacidade de flexionar o joelho a 90°', 0, undefined),
    campoSimNao('carga4', 'Incapacidade de dar 4 passos no momento do trauma e na avaliação', 0, undefined),
  ],
  calcular: (v) => {
    const joelho = opc(v, 'regiao') === 'joelho'

    if (joelho) {
      const criterios: [string, string][] = [
        ['Idade ≥ 55 anos', 'j55'],
        ['Dor isolada na patela', 'patela'],
        ['Dor na cabeça da fíbula', 'fibula'],
        ['Incapaz de flexionar a 90°', 'flexao'],
        ['Incapaz de dar 4 passos', 'carga4'],
      ]
      const positivos = criterios.filter(([, id]) => sim(v, id))
      const indicaRx = positivos.length > 0
      return {
        titulo: 'Regra de Ottawa para joelho',
        valor: indicaRx ? 'Radiografia indicada' : 'Radiografia dispensável',
        nivel: indicaRx ? 'alerta' : 'ok',
        rotuloNivel: `${positivos.length} de 5 critérios`,
        detalhes: criterios.map(([rotulo, id]) => ({
          rotulo,
          valor: sim(v, id) ? 'Presente' : 'Ausente',
          nivel: (sim(v, id) ? 'alerta' : 'ok') as Nivel,
        })),
        interpretacao: [
          indicaRx
            ? `**${positivos.length} critério(s) presente(s): radiografia indicada.** Basta um para indicar. A regra tem sensibilidade próxima de 100% para fratura de joelho clinicamente significativa, ao custo de especificidade baixa — ela foi calibrada para não perder fratura, e não para evitar o máximo de exames.`
            : '**Nenhum critério presente: radiografia dispensável.** Com todos os cinco itens negativos, a probabilidade de fratura clinicamente relevante é próxima de zero, e a regra evita cerca de 30% das radiografias de joelho sem perder fraturas.',
          'A regra se aplica a **trauma agudo** (menos de 7 dias) em pacientes com mais de 2 anos, alertas e cooperativos. Ela não vale em trauma antigo, reavaliação, lesão penetrante, politrauma, déficit neurológico ou intoxicação.',
          'A regra de **Pittsburgh** é uma alternativa validada, com especificidade maior: exige mecanismo de trauma direto ou queda, mais idade abaixo de 12 ou acima de 50 anos, ou incapacidade de dar 4 passos. Os dois conjuntos são aceitáveis.',
          'Radiografia normal **não exclui lesão**: ligamento cruzado anterior, menisco, ligamento colateral e fratura osteocondral não aparecem na radiografia. Derrame articular de instalação rápida (hemartrose em menos de 2 horas) aponta lesão intra-articular significativa em cerca de 70% dos casos.',
        ],
        conduta: [
          indicaRx
            ? 'Solicite radiografia em **anteroposterior e perfil**; acrescente incidência axial de patela se houver suspeita de fratura patelar, e oblíquas se houver dor em platô tibial com radiografia inicial normal.'
            : 'Dispense a radiografia e trate como lesão de partes moles: gelo, elevação, analgesia, carga conforme tolerância e mobilização precoce. Oriente retorno se a dor não melhorar em 5 a 7 dias.',
          'Diante de **hemartrose de instalação rápida** (menos de 2 horas), suspeite de lesão do ligamento cruzado anterior, fratura osteocondral ou luxação patelar, mesmo com radiografia normal — indique ressonância e avaliação ortopédica.',
          'Aplique os testes ligamentares após analgesia adequada: **Lachman** (o mais sensível para cruzado anterior), gaveta anterior e posterior, estresse em varo e valgo a 0° e 30°, e testes meniscais. Na fase aguda, a dor e o espasmo limitam o exame — reavalie em 5 a 7 dias.',
          'Mobilize cedo: imobilização prolongada em lesão de partes moles do joelho piora rigidez, atrofia quadricipital e tempo de recuperação. Fisioterapia precoce com fortalecimento de quadríceps é a base do tratamento.',
        ],
        alertas: [
          'A regra **não se aplica** a trauma com mais de 7 dias, reavaliações, lesão penetrante, politrauma, déficit neurológico, intoxicação ou paciente não cooperativo.',
          'Radiografia normal não afasta lesão ligamentar, meniscal ou osteocondral. A ausência de fratura não encerra a investigação quando há instabilidade ou derrame significativo.',
        ],
      }
    }

    const criteriosTornozelo: [string, string][] = [
      ['Idade < 18 ou > 55 anos', 'idade'],
      ['Incapaz de dar 4 passos', 'carga'],
      ['Dor no maléolo lateral (borda posterior)', 'maleoloLateral'],
      ['Dor no maléolo medial (borda posterior)', 'maleoloMedial'],
      ['Dor na base do 5º metatarso', 'base5'],
      ['Dor no navicular', 'navicular'],
    ]
    const rxTornozelo = sim(v, 'carga') || sim(v, 'maleoloLateral') || sim(v, 'maleoloMedial')
    const rxPe = sim(v, 'carga') || sim(v, 'base5') || sim(v, 'navicular')
    const indicaRx = rxTornozelo || rxPe

    return {
      titulo: 'Regras de Ottawa para tornozelo e pé',
      valor: indicaRx ? 'Radiografia indicada' : 'Radiografia dispensável',
      nivel: indicaRx ? 'alerta' : 'ok',
      rotuloNivel: indicaRx ? `${rxTornozelo ? 'Tornozelo' : ''}${rxTornozelo && rxPe ? ' e ' : ''}${rxPe ? 'pé' : ''}` : 'Nenhum critério',
      detalhes: [
        ...criteriosTornozelo.map(([rotulo, id]) => ({
          rotulo,
          valor: sim(v, id) ? 'Presente' : 'Ausente',
          nivel: (sim(v, id) ? 'alerta' : 'ok') as Nivel,
        })),
        { rotulo: 'Radiografia de tornozelo', valor: rxTornozelo ? 'Indicada' : 'Dispensável', nivel: (rxTornozelo ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Radiografia de pé', valor: rxPe ? 'Indicada' : 'Dispensável', nivel: (rxPe ? 'alerta' : 'ok') as Nivel },
      ],
      interpretacao: [
        'As duas regras são **separadas e têm gatilhos distintos**. A de **tornozelo** dispara com dor na borda posterior ou ponta de um dos maléolos, ou incapacidade de dar 4 passos. A de **pé** dispara com dor na base do quinto metatarso ou no navicular, ou a mesma incapacidade de carga. Um paciente pode precisar de uma radiografia e não da outra.',
        indicaRx
          ? `Há critério positivo: ${rxTornozelo ? 'radiografia de tornozelo indicada' : ''}${rxTornozelo && rxPe ? ' e ' : ''}${rxPe ? 'radiografia de pé indicada' : ''}.`
          : '**Nenhum critério positivo: as duas radiografias podem ser dispensadas.** A sensibilidade das regras é de aproximadamente 98 a 100% para fratura clinicamente relevante, e sua aplicação sistemática reduz em cerca de 30 a 40% as radiografias de tornozelo, com economia de tempo, custo e radiação.',
        'O item de carga é o mais mal aplicado: exige **dar quatro passos, dois com cada pé, mesmo mancando**, tanto no momento do trauma quanto na avaliação. Relato de dor não substitui o teste.',
        'A palpação deve ser da **borda posterior** do maléolo, nos 6 cm distais, e não da face lateral — dor em partes moles laterais existe em praticamente toda entorse e não é o critério da regra.',
      ],
      conduta: [
        indicaRx
          ? 'Solicite a radiografia indicada, em anteroposterior, perfil e incidência com rotação interna de 15° (mortalha) para o tornozelo. Descreva a suspeita, porque a fratura de base do quinto metatarso e a do navicular escapam de incidências mal posicionadas.'
          : 'Dispense a radiografia e trate como entorse: analgesia, gelo, compressão, elevação e **carga conforme tolerância com mobilização precoce**, que recupera mais rápido que a imobilização rígida na entorse de grau leve a moderado.',
        'Classifique a entorse: grau I (estiramento, sem instabilidade), II (ruptura parcial, dor e edema importantes) e III (ruptura completa, instabilidade). Os graus I e II tratam-se funcionalmente; o grau III pode exigir imobilização por período curto e avaliação ortopédica.',
        'Prescreva **reabilitação proprioceptiva**: é a intervenção que reduz a recorrência da entorse, que é alta — cerca de um terço dos pacientes tem novo episódio, e a instabilidade crônica de tornozelo nasce daí.',
        'Reavalie em 5 a 7 dias se a dor persistir apesar de radiografia normal: fraturas ocultas (talus, processo lateral do talus, cuboide), lesão sindesmótica (teste de compressão e rotação externa) e lesão osteocondral aparecem tardiamente e podem exigir tomografia ou ressonância.',
        'Suspeite de **lesão da sindesmose** (entorse alta) quando o mecanismo foi rotação externa com dor acima do tornozelo: ela demora muito mais para recuperar, frequentemente exige imobilização sem carga e às vezes fixação cirúrgica.',
      ],
      alertas: [
        'As regras valem para trauma agudo com menos de 10 dias, em pacientes alertas, cooperativos e sem déficit neurológico ou distração por outra lesão dolorosa. Fora disso, não se aplicam.',
        'Em crianças, considere a **fratura de Salter-Harris tipo I da fíbula distal**, que pode não aparecer na radiografia inicial — dor sobre a placa de crescimento com radiografia normal merece imobilização e reavaliação.',
      ],
    }
  },
  formula: ['Tornozelo: dor no maléolo lateral OU medial (borda posterior, 6 cm) OU incapaz de dar 4 passos', 'Pé: dor na base do 5º metatarso OU no navicular OU incapaz de dar 4 passos', 'Joelho: idade ≥ 55 OU dor isolada na patela OU dor na cabeça da fíbula OU incapaz de flexionar 90° OU incapaz de dar 4 passos'],
  fundamento:
    'As regras de Ottawa são o exemplo canônico de **regra de decisão clínica de alta sensibilidade**: foram derivadas e validadas prospectivamente com o objetivo explícito de não perder nenhuma fratura clinicamente significativa, aceitando em troca uma especificidade modesta. Essa assimetria é deliberada e reflete a assimetria das consequências — uma fratura perdida pode evoluir com consolidação viciosa, artrose pós-traumática e incapacidade, enquanto uma radiografia desnecessária custa tempo, dinheiro e uma dose trivial de radiação. A escolha anatômica dos pontos de palpação também não é arbitrária: os 6 cm distais da borda posterior dos maléolos correspondem ao local de inserção dos ligamentos e ao trajeto das linhas de fratura por avulsão e por cisalhamento na entorse por inversão e eversão; a base do quinto metatarso é onde traciona o tendão fibular curto, produzindo a fratura por avulsão mais comum do pé; e a capacidade de sustentar carga integra, num único teste funcional, a integridade estrutural de todo o complexo do tornozelo. A adoção sistemática dessas regras reduziu radiografias em 30 a 40% em estudos de implementação, mantendo a segurança — o que as torna também um exemplo de que reduzir exame pode ser uma medida de qualidade, e não de racionamento.',
  armadilhas: [
    'Palpar a face lateral do tornozelo em vez da borda posterior do maléolo gera falsos positivos: dor lateral em partes moles existe em praticamente toda entorse.',
    'Não testar de fato os quatro passos e aceitar o relato do paciente é a falha de aplicação mais comum e a que mais compromete a sensibilidade da regra.',
    'A regra não se aplica em crianças abaixo de 5 anos, gestantes, pacientes intoxicados, com déficit sensitivo (neuropatia diabética) ou com lesão distrativa que desvia a atenção da dor do tornozelo.',
    'Radiografia normal não exclui fratura oculta do talus, lesão osteocondral ou lesão sindesmótica — dor persistente após 5 a 7 dias exige reavaliação, não alta definitiva.',
  ],
  referencias: [
    { texto: 'Stiell IG, Greenberg GH, McKnight RD, et al. Decision rules for the use of radiography in acute ankle injuries. JAMA. 1993;269(9):1127-1132.' },
    { texto: 'Stiell IG, Wells GA, Hoag RH, et al. Implementation of the Ottawa Knee Rule for the use of radiography in acute knee injuries. JAMA. 1997;278(23):2075-2079.' },
    { texto: 'Bachmann LM, Kolb E, Koller MT, Steurer J, ter Riet G. Accuracy of Ottawa ankle rules to exclude fractures of the ankle and mid-foot: systematic review. BMJ. 2003;326(7386):417.' },
  ],
}

/* ═════════════════ 2. Probabilidade de eliminação espontânea de cálculo ═════════════════ */

const calculoUreteral: Ferramenta = {
  id: 'calculo-ureteral',
  nome: 'Cálculo ureteral: probabilidade de eliminação espontânea',
  sinonimos: ['colica renal', 'calculo ureteral', 'litiase', 'nefrolitiase', 'eliminacao espontanea'],
  resumo: 'Estima a chance de o cálculo sair sozinho pelo tamanho e posição, e define quem precisa de intervenção urológica.',
  categorias: ['especialidades', 'nefrologia', 'emergencia'],
  campos: [
    campoNum('tamanho', 'Maior diâmetro do cálculo', { unidade: 'mm', min: 1, max: 30, passo: 0.5, ajuda: 'Medido na tomografia sem contraste, que é o exame de escolha (sensibilidade e especificidade acima de 95%). O tamanho é o preditor mais forte de eliminação espontânea, e a diferença entre 4 e 6 mm muda a conduta.' }),
    campoOpc('posicao', 'Posição', [
      { valor: 'proximal', rotulo: 'Ureter proximal', pontos: 0 },
      { valor: 'medio', rotulo: 'Ureter médio', pontos: 1 },
      { valor: 'distal', rotulo: 'Ureter distal / junção ureterovesical', pontos: 2 },
    ], { padrao: 'distal', ajuda: 'Quanto mais distal, maior a chance de eliminação: o cálculo já percorreu a maior parte do trajeto e a musculatura ureteral distal tem peristalse mais eficaz para expulsá-lo.' }),
    campoSimNao('febre', 'Febre, calafrio ou sinais de infecção', 0, 'Cálculo obstrutivo com infecção é **pionefrose**: uma emergência urológica com mortalidade real, que exige descompressão em horas e não responde a antibiótico isolado.'),
    campoSimNao('rimUnico', 'Rim único, transplantado ou obstrução bilateral', 0, 'Qualquer dessas condições transforma obstrução unilateral em risco de anúria e lesão renal aguda — a indicação de desobstrução é imediata.'),
    campoSimNao('dorRefratária', 'Dor refratária a analgesia adequada', 0, 'Refratária significa: sem controle apesar de anti-inflamatório parenteral associado a opioide, em doses plenas.'),
    campoNum('creatinina', 'Creatinina sérica', { unidade: 'mg/dL', min: 0.3, max: 15, passo: 0.01, opcional: true, ajuda: 'Elevação da creatinina em obstrução unilateral com rim contralateral normal é incomum e sugere obstrução bilateral, rim único funcionante ou doença renal prévia.' }),
  ],
  calcular: (v) => {
    const tam = num(v, 'tamanho')
    if (tam === null) return null
    const posicao = opc(v, 'posicao') ?? 'distal'
    const febre = sim(v, 'febre')
    const rimUnico = sim(v, 'rimUnico')
    const dor = sim(v, 'dorRefratária')
    const creat = num(v, 'creatinina')

    // Probabilidades das séries clássicas, ajustadas pela posição.
    const base = tam <= 2 ? 0.95 : tam <= 4 ? 0.8 : tam <= 6 ? 0.6 : tam <= 8 ? 0.35 : 0.1
    const ajustePosicao = posicao === 'distal' ? 1.15 : posicao === 'medio' ? 1.0 : 0.8
    const prob = Math.max(0.03, Math.min(0.97, base * ajustePosicao))

    const urgencia = febre || rimUnico || dor || (creat !== null && creat > 2)
    const nivel: Nivel = urgencia ? 'critico' : prob < 0.3 ? 'alerta' : prob < 0.6 ? 'atencao' : 'ok'

    const interpretacao: string[] = [
      `**Cálculo de ${fmt(tam, 1)} mm em ureter ${posicao === 'distal' ? 'distal' : posicao === 'medio' ? 'médio' : 'proximal'} — probabilidade estimada de eliminação espontânea em torno de ${fmtPct(prob * 100, 0)}.** As séries clássicas mostram cerca de 95% para cálculos de até 2 mm, 80% até 4 mm, 60% até 6 mm e menos de 35% acima de 6 mm, com a posição distal favorecendo a passagem.`,
      'O tempo médio até a eliminação também cresce com o tamanho: cerca de 8 dias para cálculos de até 2 mm, 12 dias entre 2 e 4 mm, e 22 dias entre 4 e 6 mm. É esse dado que sustenta o período de tentativa expectante de 4 a 6 semanas.',
      tam > 10
        ? '**Acima de 10 mm, a eliminação espontânea é improvável** e a conduta expectante apenas adia a intervenção, com risco de perda funcional do rim por obstrução prolongada.'
        : 'Abaixo de 10 mm, a tentativa expectante é razoável desde que a dor esteja controlada, não haja infecção nem comprometimento da função renal.',
    ]
    if (urgencia) {
      interpretacao.push(
        `**Há critério de intervenção urgente:** ${[febre ? 'infecção associada' : '', rimUnico ? 'rim único ou obstrução bilateral' : '', dor ? 'dor refratária' : '', creat !== null && creat > 2 ? 'creatinina elevada' : ''].filter(Boolean).join(', ')}. A probabilidade de eliminação espontânea deixa de ser relevante — a descompressão vem primeiro.`,
      )
    }

    const conduta: string[] = []
    if (febre) {
      conduta.push(
        '**Cálculo obstrutivo com febre é pionefrose até prova em contrário — emergência urológica.** Colha hemoculturas e urocultura, inicie antibiótico de amplo espectro e providencie **descompressão imediata** por cateter duplo J ou nefrostomia percutânea. Antibiótico sem drenagem não resolve pus sob pressão, e o quadro evolui para choque séptico em horas.',
      )
    }
    if (rimUnico) {
      conduta.push('**Rim único, transplantado ou obstrução bilateral:** desobstrução imediata, pelo risco de anúria e lesão renal aguda. Não há espaço para conduta expectante.')
    }
    if (!febre && !rimUnico) {
      if (tam <= 6 && !dor) {
        conduta.push(
          '**Tentativa de eliminação espontânea por 4 a 6 semanas** é apropriada. Prescreva analgesia com **anti-inflamatório** (que é superior ao opioide na cólica renal, porque reduz a pressão intraureteral pela inibição da síntese de prostaglandinas), hidratação conforme sede — não hiper-hidratação, que não acelera a passagem e aumenta a dor — e orientação de coar a urina.',
        )
        conduta.push(
          'Considere **terapia médica expulsiva com tansulosina** para cálculos distais entre 5 e 10 mm: o benefício é modesto e concentrado nessa faixa, e os ensaios maiores não mostraram efeito em cálculos menores. Alfabloqueador relaxa a musculatura lisa do ureter distal por bloqueio alfa-1A e alfa-1D.',
        )
      } else {
        conduta.push(
          '**Intervenção urológica indicada.** As opções são **litotripsia extracorpórea** (melhor para cálculos proximais de até 10 mm, não radiopacos de baixa densidade), **ureteroscopia com litotripsia a laser** (maior taxa de eliminação em sessão única, preferida em cálculo distal, impactado ou de alta densidade) e **nefrolitotripsia percutânea** para cálculos renais grandes.',
        )
      }
    }
    conduta.push(
      'Oriente **retorno imediato** diante de febre, vômitos incoercíveis, dor não controlada ou anúria. Reavalie com imagem em 4 a 6 semanas se o cálculo não for eliminado — obstrução silenciosa e prolongada causa perda funcional irreversível do rim, muitas vezes sem sintoma.',
      'Após o episódio, faça a **investigação metabólica**: analise o cálculo eliminado (a composição muda a prevenção), dose cálcio, ácido úrico, paratormônio e função renal, e colha urina de 24 horas em pacientes recorrentes, com cálculo bilateral, rim único, história familiar ou cálculo não cálcico.',
      'Prevenção que funciona para praticamente todos os tipos: **ingestão hídrica suficiente para diurese acima de 2,5 L/dia**, redução de sódio (o sódio arrasta cálcio na urina), manutenção do cálcio dietético normal (restringir cálcio **aumenta** o risco, porque deixa mais oxalato livre para absorção), redução de proteína animal e de oxalato. Em hipercalciúria, tiazídico; em cálculo úrico, alopurinol e alcalinização urinária; em cálculo de estruvita, erradicação da infecção por germes produtores de urease.',
    )

    return {
      titulo: 'Cálculo ureteral',
      valor: fmtPct(prob * 100, 0),
      unidade: 'de eliminação espontânea',
      nivel,
      rotuloNivel: urgencia ? 'Intervenção urgente indicada' : prob >= 0.6 ? 'Eliminação provável' : prob >= 0.3 ? 'Eliminação incerta' : 'Eliminação improvável',
      detalhes: [
        { rotulo: 'Tamanho', valor: `${fmt(tam, 1)} mm`, nivel: (tam > 6 ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Posição', valor: posicao === 'distal' ? 'Ureter distal' : posicao === 'medio' ? 'Ureter médio' : 'Ureter proximal' },
        { rotulo: 'Infecção associada', valor: febre ? 'Sim' : 'Não', nivel: (febre ? 'critico' : 'ok') as Nivel, nota: febre ? 'Pionefrose: descompressão em horas' : undefined },
        { rotulo: 'Rim único ou bilateral', valor: rimUnico ? 'Sim' : 'Não', nivel: (rimUnico ? 'critico' : 'ok') as Nivel },
        { rotulo: 'Dor refratária', valor: dor ? 'Sim' : 'Não', nivel: (dor ? 'alerta' : 'ok') as Nivel },
        ...(creat !== null ? [{ rotulo: 'Creatinina', valor: `${fmt(creat, 2)} mg/dL`, nivel: (creat > 2 ? 'alerta' : 'ok') as Nivel }] : []),
      ],
      interpretacao,
      conduta,
      alertas: [
        '**Cálculo obstrutivo com febre é emergência**: pionefrose exige descompressão em horas, não antibiótico isolado. A mortalidade do atraso é real, e o quadro pode evoluir de febre a choque séptico em menos de um dia.',
        'Obstrução prolongada causa perda funcional **silenciosa** do rim: a dor cede quando a pressão se acomoda, e a ausência de sintoma é frequentemente interpretada como eliminação do cálculo. Confirme com imagem, não com a melhora clínica.',
      ],
    }
  },
  formula: ['Probabilidade estimada por tamanho (séries clássicas) ajustada pela posição ureteral'],
  fundamento:
    'A cólica renal não dói pelo cálculo, e sim pela **obstrução**: o cálculo impacta, a urina continua sendo produzida, a pressão intraureteral e intrapélvica sobe, e a distensão do sistema coletor ativa fibras nociceptivas. A obstrução estimula a síntese local de prostaglandina E2, que produz vasodilatação da arteríola aferente e aumenta ainda mais o fluxo urinário para dentro de um sistema fechado, elevando a pressão — é exatamente esse mecanismo que explica por que o anti-inflamatório não esteroidal, ao inibir a ciclo-oxigenase, é superior ao opioide nessa dor específica, atacando a causa da pressão em vez de apenas a percepção. Os três pontos de estreitamento fisiológico do ureter — junção ureteropélvica, cruzamento dos vasos ilíacos e junção ureterovesical — são onde os cálculos impactam, e o último é o mais estreito, o que faz dele simultaneamente o local mais comum de impactação e o de melhor prognóstico, já que o cálculo ali já percorreu quase todo o trajeto. A probabilidade de eliminação depende sobretudo da relação entre o diâmetro do cálculo e o do lúmen ureteral, e por isso o tamanho é o preditor dominante.',
  armadilhas: [
    'A hiper-hidratação forçada na cólica aguda não acelera a eliminação e aumenta a pressão e a dor. Hidrate conforme a sede e a tolerância.',
    'A ausência de hematúria não exclui litíase: até 15% dos cálculos obstrutivos cursam com sumário de urina normal.',
    'Dor que cede espontaneamente não significa cálculo eliminado — pode significar acomodação da pressão com obstrução mantida. Confirme por imagem antes de dar alta definitiva.',
    'Em gestantes, evite tomografia: a **ultrassonografia** é o exame inicial, e a ressonância sem contraste é a alternativa. Anti-inflamatórios são contraindicados, sobretudo após 20 semanas, pelo risco de fechamento do ducto arterioso.',
  ],
  referencias: [
    { texto: 'Coll DM, Varanelli MJ, Smith RC. Relationship of spontaneous passage of ureteral calculi to stone size and location as revealed by unenhanced helical CT. AJR Am J Roentgenol. 2002;178(1):101-103.' },
    { texto: 'Assimos D, Krambeck A, Miller NL, et al. Surgical Management of Stones: AUA/Endourology Society Guideline. J Urol. 2016;196(4):1153-1160.' },
    { texto: 'Pickard R, Starr K, MacLennan G, et al. Medical expulsive therapy in adults with ureteric colic: a multicentre, randomised, placebo-controlled trial (SUSPEND). Lancet. 2015;386(9991):341-349.' },
  ],
}

export const ferramentas: Ferramenta[] = [ottawa, calculoUreteral]

export default ferramentas
