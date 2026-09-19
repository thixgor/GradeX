import type { Campo, Ferramenta, Nivel } from '../tipos'
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

/* ═══════════════════ IPSS — sintomas do trato urinário inferior ═══════════════════ */

const ipssItens: [string, string, string][] = [
  ['esvaziamento', '1. Sensação de não esvaziar a bexiga completamente', 'Sintoma de esvaziamento (obstrutivo).'],
  ['frequencia', '2. Ter de urinar de novo em menos de 2 horas', 'Sintoma de armazenamento (irritativo).'],
  ['intermitencia', '3. Parar e recomeçar várias vezes ao urinar', 'Sintoma de esvaziamento.'],
  ['urgencia', '4. Dificuldade para adiar a micção', 'Sintoma de armazenamento — o mais incômodo da lista, e o que melhor responde a antimuscarínico ou a mirabegrona.'],
  ['jato', '5. Jato urinário fraco', 'Sintoma de esvaziamento, o mais clássico da obstrução prostática.'],
  ['esforco', '6. Ter de fazer força para começar a urinar', 'Sintoma de esvaziamento.'],
  ['noturia', '7. Quantas vezes levanta à noite para urinar', 'Conte apenas as vezes em que acordou **para urinar**. Noctúria isolada tem causas próprias — insuficiência cardíaca, apneia do sono, diabetes, diurético à noite, ingestão tardia de líquido — e frequentemente não é prostática.'],
]

const ipssCampos: Campo[] = [
  ...ipssItens.map(([id, rotulo, ajuda]) =>
    campoOpc(id, rotulo, [
      { valor: '0', rotulo: '0 — Nenhuma vez', pontos: 0 },
      { valor: '1', rotulo: '1 — Menos de 1 vez em 5', pontos: 1 },
      { valor: '2', rotulo: '2 — Menos da metade das vezes', pontos: 2 },
      { valor: '3', rotulo: '3 — Cerca de metade das vezes', pontos: 3 },
      { valor: '4', rotulo: '4 — Mais da metade das vezes', pontos: 4 },
      { valor: '5', rotulo: '5 — Quase sempre', pontos: 5 },
    ], { padrao: '0', ajuda: `${ajuda} Todas as perguntas se referem ao **último mês**.` }),
  ),
  campoOpc('qualidade', 'Qualidade de vida: se tivesse de viver assim pelo resto da vida, como se sentiria?', [
    { valor: '0', rotulo: '0 — Muito satisfeito', pontos: 0 },
    { valor: '1', rotulo: '1 — Satisfeito', pontos: 1 },
    { valor: '2', rotulo: '2 — Mais satisfeito que insatisfeito', pontos: 2 },
    { valor: '3', rotulo: '3 — Indiferente', pontos: 3 },
    { valor: '4', rotulo: '4 — Mais insatisfeito que satisfeito', pontos: 4 },
    { valor: '5', rotulo: '5 — Infeliz', pontos: 5 },
    { valor: '6', rotulo: '6 — Péssimo', pontos: 6 },
  ], { padrao: '0', ajuda: 'Esta oitava pergunta **não entra na soma** e é, na prática, a que mais decide tratamento: um IPSS de 12 com qualidade de vida 5 incomoda mais que um IPSS de 20 com qualidade de vida 1.' }),
]

const ipss: Ferramenta = {
  id: 'ipss',
  nome: 'IPSS — sintomas do trato urinário inferior e qualidade de vida',
  sigla: 'IPSS',
  sinonimos: ['ipss', 'ahai', 'prostata sintomas', 'hpb', 'hiperplasia prostatica', 'lutss'],
  resumo: 'Gradua os sintomas urinários em sete itens e mede o incômodo separadamente, que é o que decide tratar.',
  categorias: ['especialidades', 'geriatria'],
  campos: ipssCampos,
  calcular: (v) => {
    const pontos = ipssItens.map(([id]) => ptsOpc(ipssCampos, v, id))
    if (pontos.some((p) => p === null)) return null
    const total = (pontos as number[]).reduce((a, b) => a + b, 0)
    const qv = ptsOpc(ipssCampos, v, 'qualidade') ?? 0
    const esvaziamento = (pontos[0] as number) + (pontos[2] as number) + (pontos[4] as number) + (pontos[5] as number)
    const armazenamento = (pontos[1] as number) + (pontos[3] as number) + (pontos[6] as number)

    const nivel: Nivel = total >= 20 ? 'alerta' : total >= 8 ? 'atencao' : 'ok'
    const faixa = total >= 20 ? 'Sintomas graves' : total >= 8 ? 'Sintomas moderados' : 'Sintomas leves'

    const conduta: string[] = []
    if (total <= 7 && qv <= 3) {
      conduta.push('**Sintomas leves com pouco incômodo: conduta expectante com orientação.** Reduza líquido à noite, cafeína e álcool; revise diurético, descongestionante e anticolinérgico; trate constipação; e ensine micção dupla. Reavalie em 6 a 12 meses com o próprio IPSS.')
    } else if (esvaziamento > armazenamento) {
      conduta.push('**Predomínio de sintomas de esvaziamento:** comece por **alfabloqueador** (tansulosina, alfuzosina, doxazosina), que age em dias por relaxar a musculatura lisa do colo vesical e da próstata. Avise sobre hipotensão postural, tontura e ejaculação retrógrada, e sobre a **síndrome da íris flácida** — informe o oftalmologista antes de qualquer cirurgia de catarata.')
      conduta.push('Acrescente **inibidor da 5-alfa-redutase** (finasterida, dutasterida) quando a próstata for volumosa (acima de 30 a 40 g) ou o PSA acima de 1,5 ng/mL: ele reduz o volume prostático em 20 a 30%, diminui retenção e necessidade de cirurgia, mas leva **6 meses** para efeito pleno e **reduz o PSA à metade** — dobre o valor medido ao interpretar o rastreamento.')
    } else {
      conduta.push('**Predomínio de sintomas de armazenamento (urgência, frequência, noctúria):** considere **antimuscarínico** (solifenacina, oxibutinina) ou **mirabegrona**, esta preferível no idoso pela ausência de carga anticolinérgica. Antes de prescrever, **meça o resíduo pós-miccional**: acima de 150 a 200 mL, o antimuscarínico pode precipitar retenção urinária.')
    }
    conduta.push(
      'Complete a avaliação mínima antes de tratar: **toque retal**, **sumário de urina** (afasta infecção, hematúria e glicosúria), **creatinina**, **PSA** quando o diagnóstico de câncer mudar a conduta, e **resíduo pós-miccional** por ultrassonografia.',
      'Encaminhe ao urologista diante de **retenção urinária, hematúria macroscópica, infecções urinárias de repetição, cálculo vesical, insuficiência renal pós-renal ou falha do tratamento clínico** — são as indicações cirúrgicas clássicas, e a ressecção transuretral continua sendo o padrão contra o qual as técnicas novas se comparam.',
      'Reavalie com o **próprio IPSS**: uma queda de **3 pontos** é a diferença mínima perceptível pelo paciente, e de 5 a 6 pontos é melhora expressiva. Sem medir antes e depois, não há como saber se o fármaco funcionou.',
      'Pense nas causas não prostáticas quando o quadro não fechar: **bexiga hiperativa, diabetes, doença neurológica, apneia do sono, insuficiência cardíaca** (noctúria por mobilização do edema ao deitar) e **poliúria noturna** — esta última se confirma com diário miccional de 3 dias, que é barato e frequentemente dispensa exame.',
    )

    return {
      titulo: 'IPSS',
      valor: fmtInt(total),
      unidade: 'de 35 pontos',
      nivel,
      rotuloNivel: `${faixa} · qualidade de vida ${qv}/6`,
      detalhes: [
        { rotulo: 'Sintomas de esvaziamento', valor: `${fmtInt(esvaziamento)} de 20`, nota: 'Jato fraco, esforço, intermitência, esvaziamento incompleto' },
        { rotulo: 'Sintomas de armazenamento', valor: `${fmtInt(armazenamento)} de 15`, nota: 'Frequência, urgência, noctúria' },
        { rotulo: 'Qualidade de vida', valor: `${fmtInt(qv)} de 6`, nivel: (qv >= 4 ? 'alerta' : 'ok') as Nivel, nota: 'Não entra na soma, mas é o que decide tratar' },
        { rotulo: 'Faixa', valor: faixa, nota: '0-7 leves · 8-19 moderados · 20-35 graves' },
      ],
      interpretacao: [
        `**${total} de 35 pontos — ${faixa.toLowerCase()}**, com qualidade de vida ${qv} de 6. As faixas são 0 a 7 (leves), 8 a 19 (moderados) e 20 a 35 (graves).`,
        esvaziamento > armazenamento
          ? '**Predomínio de sintomas de esvaziamento**, que apontam obstrução infravesical e respondem melhor a alfabloqueador e a inibidor da 5-alfa-redutase.'
          : '**Predomínio de sintomas de armazenamento**, que apontam hiperatividade detrusora — secundária à obstrução ou primária — e respondem a antimuscarínico ou mirabegrona, desde que o resíduo pós-miccional permita.',
        'A **oitava pergunta, de qualidade de vida, não entra na soma** e é a que mais pesa na decisão: um homem com IPSS de 12 e incômodo 5 quer tratamento; outro com IPSS de 20 e incômodo 1 pode preferir observar. Tratar o número em vez da pessoa é o erro central no uso desta escala.',
        'O IPSS **não diagnostica hiperplasia prostática** nem se correlaciona bem com o volume da próstata: ele mede sintomas, que podem vir de bexiga hiperativa, diabetes, doença neurológica, infecção, cálculo, estenose de uretra ou câncer de bexiga. O mesmo questionário é válido em mulheres para sintomas do trato urinário inferior.',
      ],
      conduta,
      alertas: [
        'Descartar **retenção urinária crônica** antes de prescrever antimuscarínico: resíduo pós-miccional alto com antimuscarínico é receita para retenção aguda.',
        '**Hematúria, dor, perda de peso ou sintomas de instalação rápida** não são hiperplasia prostática benigna até que câncer de bexiga, cálculo e infecção sejam afastados.',
        'Inibidor da 5-alfa-redutase **reduz o PSA pela metade** em 6 a 12 meses: dobre o valor medido ao interpretar o rastreamento, sob pena de deixar passar um câncer.',
      ],
    }
  },
  formula: ['IPSS = soma de 7 itens de 0 a 5 (0 a 35)', 'Qualidade de vida: item separado de 0 a 6, não somado', '0-7 leves · 8-19 moderados · 20-35 graves'],
  fundamento:
    'Os sintomas do trato urinário inferior no homem resultam de dois mecanismos que coexistem e que o IPSS separa em seus dois blocos. O **componente estático** da obstrução vem do crescimento do tecido prostático na zona de transição, dependente de di-hidrotestosterona produzida localmente pela 5-alfa-redutase tipo 2 — é ele que os inibidores dessa enzima reduzem, encolhendo a glândula em 20 a 30% ao longo de meses. O **componente dinâmico** vem do tônus da musculatura lisa do estroma prostático, do colo vesical e da cápsula, mediado por receptores alfa-1A adrenérgicos — é ele que o alfabloqueador relaxa em dias, e é por isso que o alívio com essa classe é rápido enquanto o da 5-alfa-redutase é lento. Os sintomas de **armazenamento** têm origem distinta: a obstrução crônica leva o detrusor à hipertrofia, à denervação parcial e à instabilidade, gerando contrações não inibidas que produzem urgência e frequência — e que frequentemente persistem por meses mesmo depois de a obstrução ser removida cirurgicamente, o que precisa ser dito ao paciente antes da cirurgia para que a expectativa seja realista.',
  armadilhas: [
    'O IPSS não se correlaciona bem com o volume prostático nem com a velocidade do jato — sintoma intenso com próstata pequena é comum.',
    'Noctúria isolada raramente é prostática: pense em poliúria noturna, insuficiência cardíaca, apneia do sono, diabetes e horário do diurético.',
    'O questionário é autoaplicável e exige alfabetização; aplicado por terceiro com paráfrase, perde reprodutibilidade.',
    'Nunca dispense o toque retal e o sumário de urina: a escala mede sintoma e não enxerga câncer, infecção nem cálculo.',
  ],
  referencias: [
    { texto: 'Barry MJ, Fowler FJ Jr, O\'Leary MP, et al. The American Urological Association symptom index for benign prostatic hyperplasia. J Urol. 1992;148(5):1549-1557.' },
    { texto: 'Lerner LB, McVary KT, Barry MJ, et al. Management of Lower Urinary Tract Symptoms Attributed to Benign Prostatic Hyperplasia: AUA Guideline. J Urol. 2021;206(4):806-817.' },
  ],
}

/* ═══════════════════ TWIST — probabilidade de torção testicular ═══════════════════ */

const twistCampos: Campo[] = [
  campoOpc('endurecimento', 'Endurecimento testicular', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '2', rotulo: 'Presente', pontos: 2 },
  ], { padrao: '0', ajuda: 'Palpe comparando com o testículo contralateral. O endurecimento reflete o edema por congestão venosa e é o item de maior peso junto com o testículo elevado.' }),
  campoOpc('edema', 'Edema escrotal', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '2', rotulo: 'Presente', pontos: 2 },
  ], { padrao: '0', ajuda: 'Aumento de volume do hemiescroto acometido, com ou sem eritema.' }),
  campoOpc('nausea', 'Náusea ou vômito', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '1', rotulo: 'Presente', pontos: 1 },
  ], { padrao: '0', ajuda: 'Reflexo vagal desencadeado pela isquemia e pela distensão do cordão — sintoma que quase nunca acompanha epididimite e que por isso ajuda a discriminar.' }),
  campoOpc('elevado', 'Testículo elevado (posição alta no escroto)', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '1', rotulo: 'Presente', pontos: 1 },
  ], { padrao: '0', ajuda: 'O encurtamento do cordão pela torção puxa o testículo para cima, frequentemente com orientação horizontal. Compare a altura com o lado contralateral.' }),
  campoOpc('cremasterico', 'Reflexo cremastérico ausente', [
    { valor: '0', rotulo: 'Presente (normal)', pontos: 0 },
    { valor: '1', rotulo: 'Ausente', pontos: 1 },
  ], { padrao: '0', ajuda: 'Estimule a face medial da coxa e observe a elevação do testículo ipsilateral. A ausência é sugestiva, mas o reflexo é normalmente ausente em menores de 30 meses e pode faltar em até 30% dos meninos sem torção.' }),
]

const twist: Ferramenta = {
  id: 'twist',
  nome: 'TWIST — probabilidade de torção testicular',
  sigla: 'TWIST',
  sinonimos: ['twist', 'torcao testicular', 'escroto agudo', 'dor testicular'],
  resumo: 'Estratifica o escroto agudo em cinco achados de exame e decide quem vai direto ao centro cirúrgico, sem esperar ultrassonografia.',
  categorias: ['especialidades', 'emergencia', 'pediatria'],
  campos: twistCampos,
  calcular: (v) => {
    const ids = ['endurecimento', 'edema', 'nausea', 'elevado', 'cremasterico']
    const pontos = ids.map((id) => ptsOpc(twistCampos, v, id))
    if (pontos.some((p) => p === null)) return null
    const total = (pontos as number[]).reduce((a, b) => a + b, 0)

    const faixa = total >= 5 ? 'Alto risco' : total >= 3 ? 'Risco intermediário' : 'Baixo risco'
    const nivel: Nivel = total >= 5 ? 'critico' : total >= 3 ? 'alerta' : 'atencao'

    return {
      titulo: 'TWIST',
      valor: fmtInt(total),
      unidade: 'de 7 pontos',
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'Endurecimento testicular', valor: (pontos[0] as number) > 0 ? 'Presente (2)' : 'Ausente', nivel: ((pontos[0] as number) > 0 ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Edema escrotal', valor: (pontos[1] as number) > 0 ? 'Presente (2)' : 'Ausente', nivel: ((pontos[1] as number) > 0 ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Náusea ou vômito', valor: (pontos[2] as number) > 0 ? 'Presente (1)' : 'Ausente' },
        { rotulo: 'Testículo elevado', valor: (pontos[3] as number) > 0 ? 'Presente (1)' : 'Ausente' },
        { rotulo: 'Reflexo cremastérico ausente', valor: (pontos[4] as number) > 0 ? 'Sim (1)' : 'Não' },
        { rotulo: 'Faixa', valor: faixa, nota: '0-2 baixo · 3-4 intermediário · 5-7 alto' },
      ],
      interpretacao: [
        `**${total} de 7 pontos — ${faixa.toLowerCase()}.** As faixas são: 0 a 2 baixo risco (valor preditivo negativo próximo de 100%), 3 a 4 intermediário, 5 a 7 alto risco (valor preditivo positivo próximo de 100% nas séries de derivação).`,
        total >= 5
          ? '**Alto risco: leve ao centro cirúrgico.** Nessa faixa, a ultrassonografia com Doppler só atrasa — e o tempo é a variável que decide se o testículo será salvo. A taxa de salvamento é de cerca de 90% em até 6 horas, 50% entre 6 e 12 horas, e menos de 10% após 24 horas.'
          : total >= 3
            ? '**Risco intermediário: solicite ultrassonografia com Doppler**, que é onde ela de fato muda conduta. Fluxo ausente ou reduzido confirma; fluxo presente não exclui por completo — a torção intermitente e a torção parcial podem cursar com fluxo preservado.'
            : '**Baixo risco:** torção é improvável. Investigue epididimite, orquite, torção de apêndice testicular (com o clássico "ponto azul" e dor localizada no polo superior), hérnia encarcerada, trauma e púrpura de Henoch-Schönlein.',
        'O reflexo cremastérico é o item mais mal aplicado: ele é **normalmente ausente em menores de 30 meses** e falta em até 30% dos meninos sem torção. Sua ausência isolada não indica nada; sua presença tampouco exclui.',
        'A torção tem **dois picos etários** — o período neonatal (extravaginal, geralmente irreversível ao nascimento) e a puberdade, entre 12 e 18 anos (intravaginal, por deformidade em badalo de sino). Mas ela ocorre em qualquer idade, e o adulto com dor escrotal aguda merece o mesmo raciocínio.',
      ],
      conduta: [
        total >= 5
          ? '**Cirurgia imediata, sem esperar imagem.** Acione a urologia e prepare o centro cirúrgico. A exploração confirma o diagnóstico, distorce o cordão, avalia a viabilidade e — em qualquer cenário — realiza **orquidopexia bilateral**, porque a deformidade em badalo de sino é bilateral em cerca de 80% dos casos e o testículo contralateral corre o mesmo risco.'
          : total >= 3
            ? '**Ultrassonografia com Doppler com prioridade máxima**, sem sair da emergência e sem aguardar agendamento. Enquanto isso, mantenha jejum e a urologia avisada: se a imagem for inconclusiva e a suspeita persistir, a conduta é explorar.'
            : '**Conduza como escroto agudo não torcido**, mas com rede de segurança explícita: oriente retorno imediato se a dor piorar, e reavalie em 24 horas. Torção intermitente se apresenta com episódios que cedem, e o intervalo assintomático engana.',
        'Não deixe a **ultrassonografia negativa** sobrepor-se à suspeita clínica forte: fluxo preservado ocorre na torção parcial, na torção intermitente e na fase inicial, em que apenas o fluxo venoso está comprometido. Nesses casos, a exploração cirúrgica é diagnóstica e terapêutica.',
        'A **distorção manual** (girando o testículo de medial para lateral, como "abrir um livro") pode ser tentada como medida de ponte enquanto o centro cirúrgico é preparado, mas nunca substitui a cirurgia: mesmo com alívio da dor, a fixação é obrigatória, e a torção pode ser no sentido inverso em cerca de um terço dos casos.',
        'Registre com precisão o **horário de início da dor**. Ele é o dado que define a probabilidade de salvamento e o que a família vai perguntar depois — e é o que costuma ficar impreciso no prontuário.',
      ],
      alertas: [
        '**Torção testicular é diagnóstico clínico e emergência cirúrgica.** Esperar ultrassonografia em paciente de alto risco consome a janela de salvamento, e o testículo perdido não volta.',
        'Ultrassonografia com fluxo presente **não exclui** torção parcial ou intermitente. A clínica manda.',
        'A orquidopexia deve ser **bilateral**, mesmo quando só um lado torceu: a deformidade em badalo de sino é bilateral na grande maioria dos casos.',
      ],
    }
  },
  formula: ['TWIST = endurecimento (2) + edema (2) + náusea/vômito (1) + testículo elevado (1) + cremastérico ausente (1)', '0-2 baixo · 3-4 intermediário · 5-7 alto risco'],
  fundamento:
    'A torção testicular é uma isquemia por estrangulamento do pedículo vascular, e sua fisiopatologia explica tanto a urgência quanto os achados do exame. A forma intravaginal, própria do adolescente, depende de uma variante anatômica: a túnica vaginal se insere alto no cordão, deixando o testículo suspenso livremente dentro dela como o badalo de um sino — daí o nome da deformidade —, o que permite a rotação sobre o próprio eixo. A obstrução é **sequencial**: primeiro cede o fluxo venoso, de baixa pressão, gerando congestão, edema e endurecimento; a pressão intratesticular sobe até superar a pressão arterial, e só então o fluxo arterial cessa. Essa sequência explica dois fenômenos práticos — a ultrassonografia pode mostrar fluxo arterial preservado numa torção precoce ou parcial, e o testículo já está endurecido e aumentado antes de estar isquêmico. O tempo é a variável determinante porque o epitélio germinativo é muito sensível à isquemia: a taxa de salvamento passa de cerca de 90% em 6 horas para menos de 10% após 24. E a deformidade em badalo de sino é **bilateral em cerca de 80%** dos casos, razão pela qual a orquidopexia contralateral é obrigatória mesmo com o outro testículo assintomático.',
  armadilhas: [
    'O reflexo cremastérico é normalmente ausente abaixo de 30 meses e falta em parte dos meninos sem torção — sua ausência isolada não decide nada.',
    'Dor abdominal baixa ou inguinal isolada, sem queixa escrotal, é apresentação reconhecida em crianças: examine o escroto de todo menino com dor abdominal aguda.',
    'Torção intermitente cursa com episódios que cedem espontaneamente, e o intervalo assintomático com exame normal engana — a história de episódios prévios é indicação de orquidopexia eletiva.',
    'O TWIST foi derivado em população pediátrica; em adultos o desempenho é menos estabelecido, embora o raciocínio clínico seja o mesmo.',
  ],
  referencias: [
    { texto: 'Barbosa JA, Tiseo BC, Barayan GA, et al. Development and initial validation of a scoring system to diagnose testicular torsion in children. J Urol. 2013;189(5):1859-1864.' },
    { texto: 'Sheth KR, Keays M, Grimsby GM, et al. Diagnosing testicular torsion before urological consultation and imaging: validation of the TWIST score. J Urol. 2016;195(6):1870-1876.' },
  ],
}

export const ferramentas: Ferramenta[] = [ottawa, calculoUreteral, ipss, twist]

export default ferramentas
