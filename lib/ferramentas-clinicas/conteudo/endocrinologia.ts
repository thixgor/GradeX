import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoAltura,
  campoIdade,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSexo,
  campoSimNao,
  fmt,
  fmtInt,
  fmtLivre,
  fmtPct,
  imc as calcImc,
  num,
  numOu,
  opc,
  sim,
  somaSimNao,
} from '../helpers'

const imcFerramenta: Ferramenta = {
  id: 'imc',
  nome: 'Índice de massa corporal, relação cintura-estatura e composição',
  sigla: 'IMC',
  sinonimos: ['imc', 'bmi', 'obesidade', 'cintura estatura', 'circunferencia abdominal'],
  resumo: 'Classifica o IMC e complementa com os índices de adiposidade central, mais preditivos.',
  categorias: ['endocrinologia', 'nutricao'],
  campos: [
    campoPeso(),
    campoAltura(),
    campoSexo(),
    campoNum('cintura', 'Circunferência da cintura', { unidade: 'cm', min: 40, max: 200, passo: 0.5, opcional: true, ajuda: 'Meça no ponto médio entre a última costela e a crista ilíaca, com a pessoa em pé, ao fim de uma expiração normal, com a fita horizontal e sem comprimir a pele. Medir sobre a roupa ou na linha do umbigo altera o resultado. Esta medida prediz risco cardiometabólico melhor que o IMC.' }),
    campoNum('quadril', 'Circunferência do quadril', { unidade: 'cm', min: 50, max: 200, passo: 0.5, opcional: true, ajuda: 'No maior perímetro da região glútea. Opcional — serve para a relação cintura-quadril. Curiosamente, adiposidade glúteo-femoral maior associa-se a perfil metabólico MELHOR, porque esse tecido drena pela circulação sistêmica e funciona como reservatório seguro.' }),
    campoSeg('etnia', 'Ascendência', [
      { valor: 'geral', rotulo: 'Geral' },
      { valor: 'asiatica', rotulo: 'Asiática' },
    ], { ajuda: 'Populações asiáticas desenvolvem complicações metabólicas com IMC menor; a OMS sugere pontos de corte mais baixos.' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    const cintura = num(v, 'cintura')
    const quadril = num(v, 'quadril')
    if (peso === null || altura === null || altura <= 0) return null
    const bmi = calcImc(peso, altura)
    const asiatico = opc(v, 'etnia') === 'asiatica'
    const f = opc(v, 'sexo') === 'f'
    const cortes = asiatico ? [18.5, 23, 27.5, 32.5, 37.5] : [18.5, 25, 30, 35, 40]
    let classe = ''
    let nivel: Nivel = 'ok'
    if (bmi < cortes[0]) { classe = 'Baixo peso'; nivel = 'alerta' }
    else if (bmi < cortes[1]) { classe = 'Eutrofia'; nivel = 'ok' }
    else if (bmi < cortes[2]) { classe = 'Sobrepeso'; nivel = 'atencao' }
    else if (bmi < cortes[3]) { classe = 'Obesidade grau I'; nivel = 'alerta' }
    else if (bmi < cortes[4]) { classe = 'Obesidade grau II'; nivel = 'alerta' }
    else { classe = 'Obesidade grau III'; nivel = 'critico' }
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Faixa de peso para IMC entre 18,5 e 25', valor: `${fmt(18.5 * Math.pow(altura / 100, 2), 1)} a ${fmt(25 * Math.pow(altura / 100, 2), 1)} kg` },
    ]
    if (cintura !== null) {
      const rce = cintura / altura
      const corteCintura = f ? 80 : 94
      const corteCinturaAlto = f ? 88 : 102
      detalhes.push({
        rotulo: 'Relação cintura-estatura',
        valor: fmt(rce, 3),
        nota: rce < 0.5 ? 'Abaixo de 0,50: adiposidade central dentro do desejável. A regra "mantenha a cintura abaixo de metade da altura" é simples, funciona em todas as etnias e prediz risco cardiometabólico melhor do que o IMC.' : rce < 0.6 ? 'Entre 0,50 e 0,60: risco aumentado.' : 'Acima de 0,60: risco substancialmente aumentado.',
        nivel: rce >= 0.6 ? 'critico' : rce >= 0.5 ? 'alerta' : 'ok',
      })
      detalhes.push({
        rotulo: 'Circunferência da cintura',
        valor: `${fmt(cintura, 1)} cm`,
        nota: `Ponto de corte de risco aumentado: ${corteCintura} cm; muito aumentado: ${corteCinturaAlto} cm (critério para ${f ? 'mulheres' : 'homens'}).`,
        nivel: cintura >= corteCinturaAlto ? 'alerta' : cintura >= corteCintura ? 'atencao' : 'ok',
      })
      if (quadril !== null && quadril > 0) {
        const rcq = cintura / quadril
        const corteRcq = f ? 0.85 : 0.9
        detalhes.push({ rotulo: 'Relação cintura-quadril', valor: fmt(rcq, 2), nota: `Acima de ${fmt(corteRcq, 2)} indica distribuição androide de gordura, com maior risco cardiometabólico.`, nivel: rcq > corteRcq ? 'alerta' : 'ok' })
      }
    }
    return {
      titulo: 'Índice de massa corporal',
      valor: fmt(bmi, 1),
      unidade: 'kg/m²',
      nivel,
      rotuloNivel: classe,
      detalhes,
      interpretacao: [
        'O IMC é uma medida populacional aplicada a indivíduos, e é aí que ele falha: não distingue massa magra de massa gorda, nem gordura visceral de subcutânea. Um atleta com muita massa muscular pode ter IMC de 30 sem risco metabólico algum; uma pessoa sarcopênica com gordura visceral pode ter IMC de 24 e síndrome metabólica completa.',
        '**A adiposidade central prediz melhor do que o IMC.** A gordura visceral drena diretamente para a veia porta, expondo o fígado a ácidos graxos livres e a citocinas inflamatórias — mecanismo que a gordura subcutânea de coxa e quadril não tem. Por isso a relação cintura-estatura e a circunferência da cintura acrescentam informação real.',
        bmi >= 30
          ? '**Obesidade é doença crônica**, com base neuroendócrina e forte determinação genética. O tratamento combina mudança de estilo de vida, farmacoterapia (agonistas de GLP-1 como semaglutida e liraglutida, agonista duplo GIP/GLP-1 tirzepatida, e as opções mais antigas) e cirurgia bariátrica com IMC ≥ 40, ou ≥ 35 com comorbidade.'
          : bmi >= cortes[1]
            ? 'Sobrepeso: perda de 5 a 10% do peso já melhora pressão arterial, glicemia, lipídios e esteatose hepática de forma clinicamente relevante.'
            : bmi < 18.5
              ? 'Baixo peso: rastreie desnutrição, doença consumptiva, transtorno alimentar, má absorção e hipertireoidismo.'
              : 'IMC dentro da faixa de eutrofia. Ainda assim, avalie a distribuição da gordura — obesidade metabólica com peso normal existe.',
        'A diferença entre gordura visceral e subcutânea é anatômica antes de ser metabólica, e explica por que a cintura prediz melhor que o peso. O tecido adiposo **visceral** drena pela circulação porta, de modo que os ácidos graxos livres da sua lipólise acelerada e as adipocinas que ele secreta (TNF-α, IL-6, resistina, com adiponectina reduzida) chegam ao fígado em primeira passagem e em concentração muito superior à sistêmica. Já o tecido **subcutâneo**, sobretudo o glúteo-femoral, drena pela circulação sistêmica, tem lipólise menos ativa e funciona como reservatório seguro — é por isso que a adiposidade de quadril e coxa se associa a perfil metabólico **melhor**, e não pior. No fígado, o fluxo portal de ácidos graxos livres ativa SREBP-1c e ChREBP, aumenta a lipogênese e a gliconeogênese, e gera metabólitos lipotóxicos (diacilglicerol, ceramidas) que interrompem a sinalização da insulina por fosforilação em serina do substrato do receptor. Daí o mesmo IMC significar coisas opostas conforme a distribuição: o conceito de **obesidade metabolicamente saudável** e o de **peso normal metabolicamente obeso** decorrem exatamente disso.',
        'A relação **cintura-estatura** tem uma vantagem prática sobre a circunferência isolada: o corte de 0,5 vale para adultos de ambos os sexos e para crianças acima de 6 anos, dispensando tabelas por sexo e etnia. A regra memorizável é que a cintura deve medir menos da metade da altura.',
      ],
      conduta: bmi >= 30
        ? [
            '**Trate a obesidade como doença crônica**, com base neuroendócrina e forte determinação genética — não como falha de disciplina. Abordagens que responsabilizam moralmente reduzem adesão e pioram desfecho. Investigue e trate as comorbidades: hipertensão, diabetes, dislipidemia, esteatose hepática (calcule FIB-4), apneia do sono (aplique STOP-BANG), osteoartrose, refluxo e depressão.',
            'Estabeleça meta realista: **perda de 5 a 10%** já produz melhora clinicamente relevante de pressão, glicemia, lipídios e esteatose. Perda acima de 10% é necessária para regressão de fibrose hepática e para remissão de diabetes.',
            'Combine **mudança de estilo de vida estruturada** (déficit calórico sustentável com a dieta que o paciente consiga manter, atividade física com componente resistido para preservar massa magra, e acompanhamento regular) com **farmacoterapia**: agonistas de GLP-1 (semaglutida, liraglutida) e o agonista duplo GIP/GLP-1 tirzepatida são hoje as opções de maior eficácia.',
            bmi >= 40
              ? 'Com IMC ≥ 40, a **cirurgia bariátrica** está formalmente indicada, e também com IMC ≥ 35 na presença de comorbidade. Ela é o tratamento com maior efeito sobre peso, remissão de diabetes e mortalidade a longo prazo. Avalie em equipe multiprofissional, com preparo nutricional e psicológico e plano de suplementação vitamínica vitalícia.'
              : 'Considere cirurgia bariátrica com IMC ≥ 35 na presença de comorbidade relevante (diabetes tipo 2, apneia do sono, esteato-hepatite, osteoartrose incapacitante).',
            'Meça **cintura** e acompanhe-a junto do peso: a redução da adiposidade visceral é o que mais se correlaciona com melhora metabólica, e ela pode ocorrer com perda de peso modesta.',
          ]
        : bmi >= cortes[1]
          ? [
              'Sobrepeso. **Perda de 5 a 10% do peso** já melhora pressão arterial, glicemia, lipídios e esteatose hepática de forma clinicamente relevante — a meta não precisa ser o peso "ideal".',
              'Meça a **circunferência da cintura**: ela decide mais que o IMC nesta faixa. Cintura aumentada com IMC de 27 tem risco maior que cintura normal com IMC de 29.',
              'Rastreie o que já pode existir: glicemia de jejum e hemoglobina glicada (aplique o FINDRISC), lipidograma, pressão arterial, transaminases com índices de esteatose, e apneia do sono se houver roncos, sonolência ou hipertensão resistente.',
              'Priorize intervenções sustentáveis e resistência muscular. Dietas muito restritivas produzem perda rápida com recuperação e perda de massa magra — o que piora a composição corporal a médio prazo.',
            ]
          : bmi < 18.5
            ? [
                '**Baixo peso: investigue a causa antes de prescrever ganho de peso.** Rastreie desnutrição, doença consumptiva (neoplasia, tuberculose, HIV), transtorno alimentar, má absorção (doença celíaca, doença inflamatória intestinal, insuficiência pancreática), hipertireoidismo, insuficiência adrenal e depressão.',
                'Aplique um rastreio nutricional estruturado (MUST ou NRS-2002 conforme o cenário) e confirme desnutrição pelos critérios GLIM. Avalie massa e força muscular — força de preensão palmar é medida simples e informativa.',
                'Se houver perda de peso **não intencional** significativa (mais de 5% em um mês, 10% em seis meses), a investigação é prioritária e não deve aguardar resposta a suplemento.',
                'Antes de iniciar suporte nutricional em paciente muito magro ou com jejum prolongado, avalie risco de **síndrome de realimentação**: comece devagar, reponha tiamina antes da primeira caloria e monitore fósforo, potássio e magnésio.',
              ]
            : [
                'IMC na faixa de eutrofia — mas isso **não** encerra a avaliação. Meça a circunferência da cintura: peso normal com adiposidade visceral e massa muscular reduzida (peso normal metabolicamente obeso) tem risco metabólico alto e passa despercebido justamente porque o número tranquiliza.',
                'Se a relação cintura-estatura for ≥ 0,5, rastreie síndrome metabólica: glicemia, lipidograma, pressão arterial e transaminases.',
                'Reforce manutenção: atividade física regular com componente resistido, alimentação adequada e acompanhamento do peso e da cintura ao longo do tempo. A trajetória informa mais que o valor isolado.',
              ],
      alertas: [
        'O IMC mede **massa, não composição**. Não o use isoladamente em atletas, idosos com sarcopenia, gestantes, pessoas com edema ou ascite, e amputados.',
        'Os cortes da OMS foram derivados em populações europeias. Em **ascendência asiática**, o risco começa antes: use 23 para sobrepeso e 27,5 para obesidade.',
        'No **idoso**, IMC baixo tem mais risco que IMC levemente elevado, e a faixa de eutrofia se desloca para 22 a 27. Perseguir IMC de 22 em idoso frágil frequentemente causa dano.',
        'Perda de peso **não intencional** é sinal de alarme em qualquer faixa de IMC, inclusive na obesidade, e exige investigação — não comemoração.',
        'Obesidade é doença crônica de base neuroendócrina e genética. Tratá-la como questão de força de vontade é tecnicamente errado e clinicamente contraproducente.',
      ],
      tabela: {
        titulo: asiatico ? 'Classificação (pontos de corte asiáticos)' : 'Classificação da OMS',
        colunas: ['IMC (kg/m²)', 'Classificação'],
        linhas: [
          [`< ${fmt(cortes[0], 1)}`, 'Baixo peso'],
          [`${fmt(cortes[0], 1)} – ${fmt(cortes[1], 1)}`, 'Eutrofia'],
          [`${fmt(cortes[1], 1)} – ${fmt(cortes[2], 1)}`, 'Sobrepeso'],
          [`${fmt(cortes[2], 1)} – ${fmt(cortes[3], 1)}`, 'Obesidade grau I'],
          [`${fmt(cortes[3], 1)} – ${fmt(cortes[4], 1)}`, 'Obesidade grau II'],
          [`≥ ${fmt(cortes[4], 1)}`, 'Obesidade grau III'],
        ],
        destaque: bmi < cortes[0] ? 0 : bmi < cortes[1] ? 1 : bmi < cortes[2] ? 2 : bmi < cortes[3] ? 3 : bmi < cortes[4] ? 4 : 5,
      },
    }
  },
  formula: ['IMC = peso (kg) / altura² (m)', 'Relação cintura-estatura = cintura (cm) / altura (cm) — alvo < 0,50'],
  fundamento:
    'O índice foi proposto por Quetelet no século XIX como ferramenta estatística para descrever populações, não indivíduos. O expoente 2 na altura é uma aproximação empírica: ele não normaliza perfeitamente o peso pela estatura, o que faz o IMC superestimar a adiposidade em pessoas altas e subestimá-la em pessoas baixas. Além desse problema de escala, há uma limitação mais fundamental: o IMC mede **massa**, e o risco metabólico depende de **composição e distribuição**. Ele não distingue músculo de gordura, nem gordura visceral de subcutânea — e a diferença entre as duas é anatômica antes de ser metabólica. O tecido adiposo visceral drena pela veia porta, entregando ao fígado, em primeira passagem e em alta concentração, os ácidos graxos livres da sua lipólise acelerada e as adipocinas que secreta (TNF-α, IL-6, resistina, com adiponectina reduzida). No hepatócito, esse fluxo ativa SREBP-1c e ChREBP, aumenta lipogênese e gliconeogênese e gera diacilglicerol e ceramidas, que interrompem a sinalização da insulina por fosforilação em serina do substrato do receptor. O tecido subcutâneo glúteo-femoral, ao contrário, drena pela circulação sistêmica, tem lipólise menos ativa e funciona como reservatório seguro — daí sua associação com perfil metabólico **melhor**. É essa assimetria que sustenta os conceitos de obesidade metabolicamente saudável e de peso normal metabolicamente obeso, e é por isso que a relação **cintura-estatura** supera o IMC como rastreio: seu corte de 0,5 vale para ambos os sexos e para crianças acima de 6 anos, com a regra memorizável de que a cintura deve medir menos da metade da altura. Vale registrar, por fim, que os cortes de IMC da OMS foram derivados de populações europeias; em pessoas de ascendência asiática, o risco cardiometabólico começa em valores menores, o que motivou cortes específicos de 23 para sobrepeso e 27,5 para obesidade.',
  armadilhas: [
    'Não use IMC isoladamente em atletas, idosos com sarcopenia, gestantes, pessoas com edema ou ascite, e amputados.',
    'Meça a cintura no ponto médio entre a última costela e a crista ilíaca, com a pessoa em pé e ao final de uma expiração normal. Medir sobre a roupa ou no umbigo altera o resultado.',
    'O IMC mede massa, não composição. Peso normal com adiposidade visceral e sarcopenia é comum e tem risco metabólico alto — obesidade com peso normal existe e passa despercebida justamente porque o número tranquiliza.',
    'Os cortes da OMS foram derivados em populações europeias. Em ascendência asiática, use 23 para sobrepeso e 27,5 para obesidade; em outras populações, a calibração também difere.',
    'No idoso, IMC baixo tem mais risco que IMC levemente elevado, e o corte de eutrofia se desloca para cima (22 a 27). Perseguir IMC de 22 em idoso é frequentemente prejudicial.',
    'O expoente 2 não normaliza perfeitamente pela estatura: o IMC superestima adiposidade em pessoas altas e subestima em pessoas baixas.',
    'Obesidade é doença crônica com base neuroendócrina e forte determinação genética, não falha de disciplina. Abordagens que responsabilizam moralmente o paciente reduzem adesão e pioram desfecho.',
  ],
  referencias: [
    { texto: 'World Health Organization. Obesity: preventing and managing the global epidemic. WHO Technical Report Series 894. 2000.' },
    { texto: 'Ashwell M, Gunn P, Gibson S. Waist-to-height ratio is a better screening tool than waist circumference and BMI for adult cardiometabolic risk factors. Obes Rev. 2012;13(3):275-286.' },
  ],
}

const pesoIdeal: Ferramenta = {
  id: 'peso-ideal-ajustado',
  nome: 'Peso ideal e peso ajustado',
  sinonimos: ['peso ideal', 'peso ajustado', 'devine', 'robinson', 'hamwi'],
  resumo: 'As quatro fórmulas de peso ideal e o peso ajustado usado em dose e nutrição.',
  categorias: ['endocrinologia', 'farmacologia', 'nutricao'],
  campos: [campoAltura(), campoSexo(), campoPeso({ opcional: true, ajuda: 'Necessário para calcular o peso ajustado.' })],
  calcular: (v) => {
    const altura = num(v, 'altura')
    const peso = num(v, 'peso')
    if (altura === null) return null
    const f = opc(v, 'sexo') === 'f'
    const pol = altura / 2.54
    const acima5pes = Math.max(0, pol - 60)
    const devine = (f ? 45.5 : 50) + 2.3 * acima5pes
    const robinson = (f ? 49 : 52) + (f ? 1.7 : 1.9) * acima5pes
    const miller = (f ? 53.1 : 56.2) + (f ? 1.36 : 1.41) * acima5pes
    const hamwi = (f ? 45.5 : 48) + (f ? 2.2 : 2.7) * acima5pes
    const predito = (f ? 45.5 : 50) + 0.91 * (altura - 152.4)
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Devine (1974)', valor: `${fmt(devine, 1)} kg`, nota: 'A mais usada em farmacologia e a base do peso ajustado.' },
      { rotulo: 'Robinson (1983)', valor: `${fmt(robinson, 1)} kg` },
      { rotulo: 'Miller (1983)', valor: `${fmt(miller, 1)} kg` },
      { rotulo: 'Hamwi (1964)', valor: `${fmt(hamwi, 1)} kg`, nota: 'Comum em nutrição clínica.' },
      { rotulo: 'Peso corporal predito (ARDSNet)', valor: `${fmt(predito, 1)} kg`, nota: 'Exclusivo para volume corrente em ventilação mecânica — não use para dose de medicamento.' },
    ]
    if (peso !== null) {
      const ajustado = devine + 0.4 * (peso - devine)
      const magro = f ? (9270 * peso) / (8780 + 244 * calcImc(peso, altura)) : (9270 * peso) / (6680 + 216 * calcImc(peso, altura))
      detalhes.push({ rotulo: 'Peso ajustado (fator 0,4)', valor: `${fmt(ajustado, 1)} kg`, nota: 'Peso ideal + 40% do excesso. Usado para aminoglicosídeos, clearance de creatinina em obesos e cálculo de necessidades nutricionais.' })
      detalhes.push({ rotulo: 'Massa corporal magra (Janmahasatian)', valor: `${fmt(magro, 1)} kg`, nota: 'Preferível ao peso ajustado para propofol, rocurônio, remifentanil e vários outros anestésicos.' })
      detalhes.push({ rotulo: 'Percentual acima do peso ideal', valor: fmtPct(((peso - devine) / devine) * 100, 0) })
    }
    return {
      titulo: 'Peso ideal (Devine)',
      valor: fmt(devine, 1),
      unidade: 'kg',
      nivel: 'neutro',
      detalhes,
      conduta: [
        'Escolha o descritor de peso pela **farmacocinética do agente, não por hábito**: fármacos hidrofílicos, que se distribuem pouco no tecido adiposo (aminoglicosídeos, betalactâmicos, bloqueadores neuromusculares não despolarizantes, heparina de baixo peso molecular profilática), dosam-se por **peso ideal ou ajustado**; lipofílicos (propofol, benzodiazepínicos, fentanil, succinilcolina) aproximam-se do **peso real**.',
        'Use o **peso ajustado (peso ideal + 0,4 × excesso de peso)** quando o índice de massa corporal ultrapassar 30: ele reconhece que o tecido adiposo contribui com alguma massa magra e alguma perfusão, sem tratar a gordura como se fosse músculo. É o descritor de escolha para a maioria dos antimicrobianos em obesos.',
        'Aplique o **peso ideal** para calcular o **volume corrente na ventilação mecânica** (6 mL/kg de peso predito): o pulmão não cresce com o ganho de peso, e usar o peso real gera volumes que causam lesão induzida pela ventilação. Esse é um dos usos com maior impacto direto em mortalidade.',
        'Recorra ao **peso ideal também para estimativas nutricionais** em obesidade grave e para a fórmula de Cockcroft-Gault, em que o peso real infla o clearance calculado e leva à superdosagem — o erro mais perigoso da fórmula.',
        'Lembre das limitações das fórmulas de peso ideal (Devine, Robinson, Hamwi): foram derivadas de populações específicas, são pouco precisas em baixas estaturas e não distinguem composição corporal. Em atleta muito musculoso, em idoso sarcopênico e em amputado, o julgamento clínico e, quando disponível, a bioimpedância ou a densitometria corrigem o que a fórmula erra.',
      ],
      interpretacao: [
        '**Qual peso usar depende do que o fármaco faz no corpo.** Fármacos **hidrofílicos** (aminoglicosídeos, betalactâmicos, heparina de baixo peso molecular, relaxantes musculares despolarizantes) distribuem-se pouco no tecido adiposo: use peso ideal ou ajustado. Fármacos **lipofílicos** (propofol, benzodiazepínicos, fentanil, anestésicos inalatórios) distribuem-se no tecido adiposo: a dose de ataque se aproxima do peso real, mas a manutenção não.',
        'O **peso ajustado** com fator 0,4 nasceu da observação de que o tecido adiposo, embora pobre em água, não é totalmente inerte: cerca de 30 a 40% da massa gorda contribui para o volume de distribuição de fármacos hidrofílicos.',
        'Em nutrição, use peso ideal ou ajustado para calcular necessidades em obesos — calcular sobre o peso real gera hiperalimentação com hiperglicemia, esteatose e retenção de CO₂.',
      ],
      alertas: ['Não confunda peso ideal com peso corporal predito. O predito serve exclusivamente para volume corrente em ventilação mecânica; as duas famílias de fórmulas dão valores próximos, mas com finalidades incompatíveis.'],
    }
  },
  formula: [
    'Devine ♂: 50 + 2,3 × (polegadas acima de 5 pés) | ♀: 45,5 + 2,3 × …',
    'Peso ajustado = peso ideal + 0,4 × (peso real − peso ideal)',
    '1 polegada = 2,54 cm; 5 pés = 152,4 cm',
  ],
  fundamento:
    'A fórmula de Devine foi criada em 1974 especificamente para dose de gentamicina, e não para descrever o peso "saudável" de ninguém. Isso importa: ela é uma ferramenta farmacocinética que ganhou uso muito além do original. Todas as fórmulas partem de um peso base a 152,4 cm de altura e acrescentam um incremento por polegada adicional, o que as torna imprecisas nos extremos de estatura. O fator 0,4 do peso ajustado não é arbitrário: o tecido adiposo contém aproximadamente 30% de massa magra e é perfundido, embora com fluxo por grama muito menor que o do músculo. Assim, a gordura contribui para o **volume de distribuição** de fármacos hidrofílicos com cerca de um terço da eficiência do tecido magro, e o coeficiente empírico de 0,3 a 0,4 reproduz essa contribuição parcial. Já os fármacos lipofílicos se distribuem avidamente no tecido adiposo, e para eles o peso real é o descritor apropriado.',
  armadilhas: [
    'Em pessoas muito baixas (abaixo de 150 cm) as fórmulas podem dar valores absurdos ou negativos — use o peso real com julgamento clínico.',
    'Peso ideal não é meta de tratamento. Metas realistas de perda de peso (5 a 15%) produzem benefício metabólico muito maior do que perseguir uma tabela.',
  ],
  referencias: [
    { texto: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-655.' },
    { texto: 'Janmahasatian S, Duffull SB, Ash S, et al. Quantification of lean bodyweight. Clin Pharmacokinet. 2005;44(10):1051-1065.' },
  ],
}

const homa: Ferramenta = {
  id: 'homa-ir',
  nome: 'HOMA-IR e HOMA-β',
  sinonimos: ['homa', 'resistencia insulinica', 'homa beta', 'insulina jejum'],
  resumo: 'Estima resistência à insulina e função de célula beta com glicemia e insulina de jejum.',
  categorias: ['endocrinologia'],
  campos: [
    campoNum('glicose', 'Glicemia de jejum', { unidade: 'mg/dL', min: 40, max: 500, passo: 1, normalMin: 70, normalMax: 99 }),
    campoNum('insulina', 'Insulina de jejum', { unidade: 'µU/mL', min: 0.5, max: 200, passo: 0.1, normalMin: 2, normalMax: 15 }),
    campoNum('triglicerides', 'Triglicerídeos', { unidade: 'mg/dL', min: 20, max: 1500, passo: 1, opcional: true }),
    campoNum('hdl', 'HDL-colesterol', { unidade: 'mg/dL', min: 15, max: 120, passo: 1, opcional: true }),
  ],
  calcular: (v) => {
    const g = num(v, 'glicose')
    const i = num(v, 'insulina')
    const tg = num(v, 'triglicerides')
    const hdl = num(v, 'hdl')
    if (g === null || i === null) return null
    const homaIr = (g * i) / 405
    const gMmol = g / 18
    const homaBeta = gMmol > 3.5 ? (20 * i) / (gMmol - 3.5) : null
    const quicki = 1 / (Math.log10(i) + Math.log10(g))
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'HOMA-IR', valor: fmt(homaIr, 2), nota: 'Referência brasileira usual: até 2,7. Valores acima sugerem resistência à insulina. O ponto de corte varia com a população e com o ensaio de insulina.', nivel: homaIr > 3.5 ? 'alerta' : homaIr > 2.7 ? 'atencao' : 'ok' },
      { rotulo: 'HOMA-β (função de célula beta)', valor: homaBeta === null ? '—' : fmtPct(homaBeta, 0), nota: 'Referência 100%. Valores baixos com glicemia alta indicam falência secretora; valores altos indicam compensação por resistência.' },
      { rotulo: 'QUICKI', valor: fmt(quicki, 3), nota: 'Índice alternativo de sensibilidade. Abaixo de 0,33 sugere resistência.' },
    ]
    if (tg !== null && hdl !== null && hdl > 0) {
      detalhes.push({ rotulo: 'Relação triglicerídeos/HDL', valor: fmt(tg / hdl, 2), nota: 'Acima de 3,0 (ou 3,5 em algumas populações) é marcador indireto de resistência à insulina e de partículas de LDL pequenas e densas — e não exige dosar insulina.', nivel: tg / hdl > 3.5 ? 'alerta' : 'ok' })
      const tyg = Math.log((tg * g) / 2)
      detalhes.push({ rotulo: 'Índice TyG', valor: fmt(tyg, 2), nota: 'ln[(triglicerídeos × glicemia)/2]. Acima de 4,68 sugere resistência à insulina; correlaciona-se bem com o clamp euglicêmico e usa apenas exames de rotina.' })
    }
    const nivel: Nivel = homaIr > 3.5 ? 'alerta' : homaIr > 2.7 ? 'atencao' : 'ok'
    return {
      titulo: 'HOMA-IR',
      valor: fmt(homaIr, 2),
      nivel,
      rotuloNivel: homaIr > 2.7 ? 'Resistência à insulina provável' : 'Sensibilidade preservada',
      detalhes,
      conduta: [
        'Use o HOMA-IR como **ferramenta epidemiológica e de pesquisa**, e com cautela na decisão individual: não há ponto de corte universalmente validado, e os valores de referência variam por etnia, idade e método de dosagem da insulina. No Brasil, valores acima de 2,7 a 3,0 são frequentemente citados, mas devem ser lidos como sinal, não como diagnóstico.',
        'Diante de resistência insulínica sugerida, a conduta é a mesma independentemente do número: **intervenção de estilo de vida**. Perda de 5 a 10% do peso, 150 minutos semanais de atividade aeróbica somada a exercício resistido, redução de açúcar de adição e de ultraprocessados, e sono adequado — a privação de sono e a apneia obstrutiva pioram a sensibilidade à insulina de forma mensurável.',
        'Rastreie o que costuma acompanhar a resistência insulínica: **pré-diabetes e diabetes** (glicemia de jejum e hemoglobina glicada, ou teste oral de tolerância à glicose, que é mais sensível), **dislipidemia aterogênica** (triglicerídeos altos e HDL baixo), **hipertensão**, **doença hepática esteatótica** (calcule FIB-4) e **síndrome dos ovários policísticos** em mulheres.',
        'Considere **metformina** quando houver pré-diabetes com alto risco de progressão — especialmente abaixo de 60 anos, com índice de massa corporal ≥ 35, ou com história de diabetes gestacional. Em obesidade associada, **agonistas de GLP-1 e tirzepatida** produzem perda de peso e melhora metabólica de magnitude muito superior.',
        'Não peça HOMA-IR em quem **já tem diabetes estabelecido**: com a falência progressiva da célula beta, a insulina cai e o índice perde sentido interpretativo. Ele também é inválido em uso de insulina exógena e tem reprodutibilidade limitada, o que torna a comparação entre dois exames pouco confiável.',
      ],
      interpretacao: [
        'O HOMA é um modelo matemático de equilíbrio: em jejum, a glicemia é determinada pela produção hepática de glicose, que por sua vez é suprimida pela insulina. Se é preciso muita insulina para manter a glicemia normal, há resistência; se a glicemia está alta apesar de insulina normal, há falência secretora.',
        '**O HOMA-IR não é exame de rastreio e não faz diagnóstico de nada.** Não existe indicação de dosá-lo para diagnosticar síndrome metabólica ou pré-diabetes — para isso servem a glicemia de jejum, a hemoglobina glicada e o teste de tolerância oral. Seu uso principal é em pesquisa e em situações específicas como a investigação de síndrome dos ovários policísticos e de lipodistrofias.',
        'A **variabilidade do ensaio de insulina** entre laboratórios é grande, o que torna os pontos de corte pouco transferíveis. Índices que dispensam insulina — relação triglicerídeos/HDL e índice TyG — são mais reprodutíveis e quase tão informativos.',
        'O padrão-ouro de sensibilidade à insulina é o **clamp euglicêmico hiperinsulinêmico**, que é caro, demorado e restrito à pesquisa. O HOMA foi construído justamente como aproximação prática dele.',
      ],
      alertas: ['Não se aplica a quem usa insulina exógena nem a diabéticos tipo 1. Em diabéticos tipo 2 avançados, o HOMA-IR pode ser "normal" apenas porque a célula beta falhou.'],
    }
  },
  formula: [
    'HOMA-IR = (glicemia mg/dL × insulina µU/mL) / 405',
    'HOMA-β = (20 × insulina µU/mL) / (glicemia mmol/L − 3,5)',
    'QUICKI = 1 / [log(insulina) + log(glicemia)]',
    'TyG = ln[(triglicerídeos × glicemia) / 2]',
  ],
  fundamento:
    'Matthews e colaboradores publicaram o modelo em 1985, resolvendo matematicamente o equilíbrio entre secreção de insulina e captação de glicose. A constante 405 (ou 22,5 quando a glicemia está em mmol/L) representa o produto glicose × insulina de um indivíduo idealmente sensível — de modo que HOMA-IR de 1,0 corresponde à sensibilidade "normal" de referência. O modelo parte de uma relação de retroalimentação: em jejum, glicemia e insulinemia se equilibram num ponto que depende simultaneamente da **sensibilidade periférica e hepática à insulina** e da **capacidade secretora da célula beta**. Na resistência insulínica, a célula beta compensa secretando mais, de modo que a glicemia permanece normal à custa de insulina alta — e é esse produto glicemia × insulina que o índice captura. Quando a célula beta falha e a insulina cai, o modelo perde validade, o que é exatamente o caso do diabetes estabelecido.',
  armadilhas: [
    'Exige jejum verdadeiro de 8 a 12 horas e amostras simultâneas.',
    'Insulina exógena, anticorpos anti-insulina e insuficiência renal (que reduz a depuração de insulina) distorcem o índice.',
  ],
  referencias: [
    { texto: 'Matthews DR, Hosker JP, Rudenski AS, et al. Homeostasis model assessment: insulin resistance and beta-cell function from fasting plasma glucose and insulin concentrations in man. Diabetologia. 1985;28(7):412-419.' },
    { texto: 'Simental-Mendía LE, Rodríguez-Morán M, Guerrero-Romero F. The product of fasting glucose and triglycerides as surrogate for identifying insulin resistance. Metab Syndr Relat Disord. 2008;6(4):299-304.' },
  ],
}

const hba1c: Ferramenta = {
  id: 'hba1c-glicemia-media',
  nome: 'Hemoglobina glicada e glicemia média estimada',
  sinonimos: ['hba1c', 'a1c', 'glicada', 'glicemia media', 'gmi', 'tempo no alvo'],
  resumo: 'Converte nos dois sentidos entre glicada e glicemia média, com as armadilhas de cada uma.',
  categorias: ['endocrinologia'],
  campos: [
    campoSeg('direcao', 'O que você tem', [
      { valor: 'a1c', rotulo: 'Hemoglobina glicada' },
      { valor: 'gm', rotulo: 'Glicemia média' },
    ]),
    campoNum('a1c', 'Hemoglobina glicada', { unidade: '%', min: 3, max: 20, passo: 0.1, mostrarSe: (v) => opc(v, 'direcao') === 'a1c' }),
    campoNum('gm', 'Glicemia média', { unidade: 'mg/dL', min: 40, max: 500, passo: 1, mostrarSe: (v) => opc(v, 'direcao') === 'gm' }),
  ],
  calcular: (v) => {
    const dir = opc(v, 'direcao')
    let a1c: number | null = null
    let gm: number | null = null
    if (dir === 'a1c') {
      a1c = num(v, 'a1c')
      if (a1c === null) return null
      gm = 28.7 * a1c - 46.7
    } else {
      gm = num(v, 'gm')
      if (gm === null) return null
      a1c = (gm + 46.7) / 28.7
    }
    const ifcc = (a1c - 2.15) * 10.929
    const nivel: Nivel = a1c >= 9 ? 'critico' : a1c >= 7 ? 'alerta' : a1c >= 5.7 ? 'atencao' : 'ok'
    const classe = a1c >= 6.5 ? 'Faixa diagnóstica de diabetes' : a1c >= 5.7 ? 'Pré-diabetes' : 'Normal'
    return {
      titulo: dir === 'a1c' ? 'Glicemia média estimada' : 'Hemoglobina glicada estimada',
      valor: dir === 'a1c' ? fmtInt(gm) : fmt(a1c, 1),
      unidade: dir === 'a1c' ? 'mg/dL' : '%',
      nivel,
      rotuloNivel: classe,
      detalhes: [
        { rotulo: 'Hemoglobina glicada (NGSP)', valor: fmtPct(a1c, 1) },
        { rotulo: 'Glicemia média estimada', valor: `${fmtInt(gm)} mg/dL` },
        { rotulo: 'Unidade IFCC', valor: `${fmtInt(ifcc)} mmol/mol`, nota: 'Padrão europeu. Conversão: IFCC = (NGSP − 2,15) × 10,929.' },
        { rotulo: 'Alvo geral em adultos', valor: '< 7,0%', nota: 'Individualize: alvos mais rigorosos (< 6,5%) em jovens com doença recente e sem comorbidade; mais frouxos (< 8,0%) em idosos frágeis, com hipoglicemias ou expectativa de vida limitada.' },
      ],
      conduta: [
        'Use a glicemia média estimada para **traduzir a hemoglobina glicada em linguagem que o paciente compreende** e para confrontá-la com o automonitoramento. Uma glicada de 8% corresponde a uma média de cerca de 183 mg/dL — quando o paciente relata glicemias de 110, a discrepância aponta hipoglicemias noturnas não percebidas, coleta seletiva ou um problema na medida.',
        'Individualize a **meta**: < 7% para a maioria dos adultos; **< 6,5%** em jovens, diagnóstico recente, longa expectativa de vida e sem doença cardiovascular; **< 8% ou menos rigorosa** em idosos frágeis, expectativa de vida limitada, hipoglicemia grave prévia, hipoglicemia assintomática ou complicações avançadas. Meta apertada demais em idoso causa mais dano do que a hiperglicemia que evita.',
        'Prefira o **tempo no alvo (70–180 mg/dL, meta > 70%) e o tempo abaixo do alvo (< 4%)** quando houver monitorização contínua de glicose: a glicada não enxerga variabilidade nem hipoglicemia, e dois pacientes com a mesma glicada podem ter perfis de risco opostos.',
        'Desconfie da glicada nas condições em que ela **não é válida**: anemia hemolítica, hemorragia recente, transfusão, eritropoetina e gestação a reduzem falsamente (menor sobrevida das hemácias); deficiência de ferro, anemia por deficiência de vitamina B12 e esplenectomia a elevam; hemoglobinopatias e doença renal crônica avançada a distorcem em ambas as direções. Nesses casos, use **frutosamina, albumina glicada ou monitorização contínua**.',
        'Reavalie a glicada a cada **3 meses** enquanto a meta não for atingida e a cada 6 meses depois disso — o intervalo reflete a meia-vida da hemácia, e repetir antes de 3 meses não informa nada novo. Lembre que os últimos 30 dias contribuem com cerca de 50% do valor, o que explica a melhora rápida após intensificação do tratamento.',
      ],
      interpretacao: [
        'A hemoglobina glicada reflete a média das glicemias dos **últimos 2 a 3 meses**, ponderada: cerca de 50% do valor vem do último mês, 25% do penúltimo e 25% dos anteriores. É por isso que ela responde a uma mudança de tratamento em cerca de 6 a 8 semanas, e não antes.',
        '**A glicada não vê a variabilidade.** Um paciente com glicemias oscilando entre 40 e 350 mg/dL pode ter a mesma glicada de outro com glicemias estáveis em 150 — e prognósticos completamente diferentes. Por isso a monitorização contínua de glicose introduziu métricas complementares: **tempo no alvo** (70 a 180 mg/dL, meta > 70%), tempo abaixo do alvo (< 70 mg/dL, meta < 4%) e coeficiente de variação (meta < 36%).',
        'O **indicador de manejo de glicose (GMI)**, derivado da monitorização contínua, é diferente da glicada laboratorial e frequentemente diverge dela em até 0,5 ponto percentual. Não são intercambiáveis.',
        classe === 'Pré-diabetes' ? 'Faixa de pré-diabetes: a intervenção com maior eficácia comprovada é o programa intensivo de estilo de vida, que reduziu a progressão para diabetes em 58% no Diabetes Prevention Program — superior à metformina, que reduziu 31%.' : '',
      ].filter(Boolean),
      alertas: [
        '**A glicada é falseada por qualquer coisa que altere a sobrevida da hemácia.** Falsamente **baixa** em: anemia hemolítica, hemorragia recente, transfusão, gestação, esplenomegalia, uso de eritropoetina, doença renal crônica. Falsamente **alta** em: anemia ferropriva não tratada, deficiência de B12, esplenectomia, uremia, alcoolismo.',
        'Hemoglobinopatias (S, C, E, F) interferem em vários métodos de dosagem. Nesses casos, use frutosamina, albumina glicada ou monitorização contínua.',
      ],
    }
  },
  formula: [
    'Glicemia média (mg/dL) = 28,7 × HbA1c − 46,7',
    'HbA1c (%) = (glicemia média + 46,7) / 28,7',
    'IFCC (mmol/mol) = (NGSP % − 2,15) × 10,929',
  ],
  fundamento:
    'A hemoglobina glicada é o produto da ligação não enzimática e irreversível da glicose à valina N-terminal da cadeia beta da hemoglobina. Como essa reação é proporcional à concentração de glicose e a hemácia vive cerca de 120 dias, a fração glicada funciona como um registro integrado da glicemia. A equação de conversão vem do estudo A1c-Derived Average Glucose, que correlacionou glicada com monitorização contínua em 507 participantes.',
  armadilhas: [
    'A conversão é uma média populacional. Indivíduos têm "glicadores" rápidos e lentos — dois pacientes com a mesma glicemia média podem ter glicadas diferindo em 1 ponto percentual.',
    'A glicada não serve para diagnosticar diabetes em gestantes, em crianças com suspeita de tipo 1, nem em quadros de instalação rápida — nesses casos, use glicemia.',
  ],
  referencias: [
    { texto: 'Nathan DM, Kuenen J, Borg R, et al. Translating the A1C assay into estimated average glucose values. Diabetes Care. 2008;31(8):1473-1478.' },
    { texto: 'Battelino T, Danne T, Bergenstal RM, et al. Clinical targets for continuous glucose monitoring data interpretation. Diabetes Care. 2019;42(8):1593-1603.' },
    { texto: 'American Diabetes Association. Standards of Care in Diabetes — 2024. Diabetes Care. 2024;47(Suppl 1).' },
  ],
}

const cetoacidose: Ferramenta = {
  id: 'cetoacidose-diabetica',
  nome: 'Cetoacidose diabética e estado hiperglicêmico hiperosmolar',
  sinonimos: ['cad', 'cetoacidose', 'ehh', 'estado hiperosmolar', 'cetonas'],
  resumo: 'Aplica os critérios diagnósticos, calcula o ânion gap e monta a conduta inicial.',
  categorias: ['endocrinologia', 'emergencia'],
  campos: [
    campoNum('glicose', 'Glicemia', { unidade: 'mg/dL', min: 50, max: 2000, passo: 1 }),
    campoNum('ph', 'pH arterial ou venoso', { min: 6.6, max: 7.6, passo: 0.01 }),
    campoNum('hco3', 'HCO₃⁻', { unidade: 'mEq/L', min: 1, max: 40, passo: 0.1 }),
    campoNum('na', 'Sódio medido', { unidade: 'mEq/L', min: 100, max: 190, passo: 1 }),
    campoNum('cl', 'Cloro', { unidade: 'mEq/L', min: 60, max: 160, passo: 1 }),
    campoNum('k', 'Potássio', { unidade: 'mEq/L', min: 1.5, max: 9, passo: 0.1 }),
    campoNum('betaHidroxi', 'Beta-hidroxibutirato', { unidade: 'mmol/L', min: 0, max: 15, passo: 0.1, opcional: true, ajuda: 'Acima de 3,0 mmol/L é critério diagnóstico e é mais confiável que a cetonúria.' }),
    campoPeso({ opcional: true }),
  ],
  calcular: (v) => {
    const g = num(v, 'glicose')
    const ph = num(v, 'ph')
    const hco3 = num(v, 'hco3')
    const na = num(v, 'na')
    const cl = num(v, 'cl')
    const k = num(v, 'k')
    const bhb = num(v, 'betaHidroxi')
    const peso = num(v, 'peso')
    if (g === null || ph === null || hco3 === null || na === null || cl === null || k === null) return null
    const ag = na - (cl + hco3)
    const naCorrigido = na + 1.6 * ((g - 100) / 100)
    const osmEfetiva = 2 * na + g / 18
    const cad = g > 250 && ph < 7.3 && hco3 < 18 && ag > 10
    const ehh = g > 600 && ph >= 7.3 && hco3 > 18 && osmEfetiva > 320
    const gravidade = !cad ? '' : ph < 7.0 || hco3 < 10 ? 'grave' : ph < 7.24 || hco3 < 15 ? 'moderada' : 'leve'
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Ânion gap', valor: `${fmt(ag, 1)} mEq/L`, nota: 'Acima de 10 a 12 é critério. O fechamento do gap — e não a normalização da glicemia — define a resolução da cetoacidose.', nivel: ag > 12 ? 'alerta' : 'ok' },
      { rotulo: 'Sódio corrigido pela glicemia', valor: `${fmt(naCorrigido, 1)} mEq/L`, nota: 'É o que deve ser acompanhado durante o tratamento. Ele deve **subir** lentamente conforme a glicemia cai.' },
      { rotulo: 'Osmolalidade efetiva', valor: `${fmt(osmEfetiva, 1)} mOsm/kg`, nota: 'Acima de 320 é critério de estado hiperglicêmico hiperosmolar e correlaciona-se com rebaixamento do sensório.', nivel: osmEfetiva > 320 ? 'critico' : 'ok' },
      { rotulo: 'Potássio', valor: `${fmt(k, 1)} mEq/L`, nota: k < 3.3 ? '**Abaixo de 3,3 mEq/L: não inicie insulina.** Reponha potássio primeiro (20 a 30 mEq/h) — a insulina desloca potássio para dentro da célula e pode causar parada cardíaca.' : k < 5.3 ? 'Entre 3,3 e 5,3: reponha 20 a 30 mEq de potássio em cada litro de soro, mirando 4 a 5 mEq/L.' : 'Acima de 5,3: não reponha ainda; dose novamente a cada 2 horas.', nivel: k < 3.3 ? 'critico' : k > 5.5 ? 'alerta' : 'ok' },
    ]
    if (bhb !== null) detalhes.push({ rotulo: 'Beta-hidroxibutirato', valor: `${fmt(bhb, 1)} mmol/L`, nota: 'Acima de 3,0 mmol/L confirma cetose significativa. É o corpo cetônico predominante e o único que a cetonúria por nitroprussiato **não** detecta.', nivel: bhb > 3 ? 'alerta' : 'ok' })
    if (peso !== null) {
      detalhes.push({ rotulo: 'Bolus inicial de cristaloide', valor: `${fmtInt(peso * 15)} a ${fmtInt(peso * 20)} mL`, nota: '15 a 20 mL/kg na primeira hora (1 a 1,5 L no adulto), com salina 0,9% ou solução balanceada.' })
      detalhes.push({ rotulo: 'Infusão de insulina regular', valor: `${fmt(peso * 0.1, 1)} U/h`, nota: '0,1 U/kg/h em infusão contínua. O bolus inicial de 0,1 U/kg é opcional e dispensável se a infusão começar imediatamente.' })
      detalhes.push({ rotulo: 'Déficit hídrico estimado', valor: `${fmt(peso * 0.1, 1)} L`, nota: 'Cerca de 100 mL/kg na cetoacidose e 100 a 200 mL/kg no estado hiperosmolar. Reponha metade nas primeiras 12 a 24 h.' })
    }
    const nivel: Nivel = ehh || gravidade === 'grave' ? 'critico' : cad ? 'alerta' : 'atencao'
    return {
      titulo: ehh ? 'Estado hiperglicêmico hiperosmolar' : cad ? `Cetoacidose diabética ${gravidade}` : 'Critérios não preenchidos',
      valor: ehh ? 'EHH' : cad ? `CAD ${gravidade}` : 'Reavaliar',
      nivel,
      rotuloNivel: `pH ${fmt(ph, 2)} · HCO₃⁻ ${fmt(hco3, 1)} · ânion gap ${fmt(ag, 1)}`,
      detalhes,
      conduta: [
        'Execute a sequência na ordem correta: **volume primeiro, potássio segundo, insulina terceiro**. Comece com 15–20 mL/kg de cristaloide isotônico na primeira hora, e **não inicie insulina se o potássio estiver abaixo de 3,3 mEq/L** — a insulina empurra potássio para dentro da célula e pode precipitar arritmia fatal. Reponha potássio primeiro.',
        'Mantenha **insulina regular em infusão contínua de 0,1 U/kg/h** (o bolus inicial é opcional e dispensável). Quando a glicemia chegar a 200–250 mg/dL, **acrescente glicose ao soro e reduza a insulina**, mas não a suspenda: o objetivo é fechar o **ânion gap e negativar a cetonemia**, não normalizar a glicose. Suspender a insulina cedo demais é o erro que perpetua a cetoacidose.',
        'Reponha **potássio de forma antecipada**: o déficit corporal total é de 3 a 5 mEq/kg mesmo quando a caliemia inicial parece normal ou alta, porque a acidose e a falta de insulina deslocam potássio para fora da célula. Mantenha entre 4 e 5 mEq/L durante todo o tratamento, com dosagens a cada 2–4 h.',
        '**Não reponha bicarbonato** de rotina: ele não melhora desfecho e pode piorar a acidose intracelular e a hipocalemia. Reserve-o para pH < 6,9, e ainda assim com cautela. Fosfato também só se repõe em déficit grave com repercussão (fraqueza muscular, disfunção respiratória, hemólise).',
        'Procure o **fator precipitante** desde a admissão — infecção, omissão de insulina, infarto, pancreatite, gestação, uso de corticoide, cocaína, ou **inibidor de SGLT2**, que causa cetoacidose euglicêmica com glicemia normal ou pouco elevada e engana o diagnóstico. E antes da alta, faça a **transição correta**: aplique a insulina subcutânea basal **1 a 2 horas antes** de desligar a bomba, sob pena de recidiva imediata.',
      ],
      interpretacao: [
        '**Critérios de cetoacidose:** glicemia acima de 250 mg/dL (pode ser normal na cetoacidose euglicêmica), pH abaixo de 7,30, bicarbonato abaixo de 18 mEq/L, cetonemia ou cetonúria e ânion gap elevado. **Critérios do estado hiperosmolar:** glicemia acima de 600, osmolalidade efetiva acima de 320, pH acima de 7,30, bicarbonato acima de 18 e cetose mínima.',
        '**A ordem do tratamento importa e é a mesma nos dois quadros:** (1) volume, (2) potássio, (3) insulina — nunca insulina antes de checar o potássio. (4) Acrescente glicose ao soro quando a glicemia chegar a 200 mg/dL na cetoacidose ou a 300 no estado hiperosmolar, **mantendo a insulina** até o gap fechar.',
        '**Resolução da cetoacidose:** glicemia abaixo de 200 **e** dois dos três — bicarbonato ≥ 15, pH > 7,30, ânion gap ≤ 12. Só então se faz a transição para insulina subcutânea, com **sobreposição de 1 a 2 horas** entre a última dose subcutânea e o desligamento da infusão. Desligar a bomba sem sobreposição é a causa mais comum de recidiva.',
        '**Bicarbonato só se discute com pH abaixo de 6,9**, e mesmo aí sem benefício demonstrado em desfechos. A acidose se corrige quando os cetoácidos são metabolizados.',
        '**Cetoacidose euglicêmica** ocorre com inibidores de SGLT2, em gestantes, em jejum prolongado e no etilismo — glicemia normal ou pouco elevada com acidose de ânion gap alto e cetonemia. Suspeitar dela é o que evita o diagnóstico perdido.',
        'Procure sempre o fator precipitante: infecção, infarto, acidente vascular cerebral, pancreatite, medicamentos (corticoide, antipsicótico atípico, inibidor de SGLT2), gestação e — a causa mais frequente em jovens — omissão de insulina.',
      ],
      alertas: [
        'Em crianças, o **edema cerebral** é a principal causa de morte na cetoacidose. Evite reposição volêmica excessiva, queda rápida da osmolalidade e bicarbonato. Cefaleia, bradicardia, hipertensão e rebaixamento durante o tratamento são sinais de alarme.',
        'A cetonúria por nitroprussiato detecta acetoacetato e acetona, **não** beta-hidroxibutirato — que é o corpo cetônico predominante. Durante a melhora, o beta-hidroxibutirato se converte em acetoacetato e a cetonúria pode **aumentar** enquanto o paciente melhora.',
      ],
    }
  },
  formula: [
    'Ânion gap = Na⁺ − (Cl⁻ + HCO₃⁻)',
    'Na corrigido = Na medido + 1,6 × (glicemia − 100)/100',
    'Osmolalidade efetiva = 2 × Na⁺ + glicemia/18',
    'Insulina: 0,1 U/kg/h em infusão contínua',
  ],
  fundamento:
    'A cetoacidose resulta de deficiência absoluta ou relativa de insulina somada a excesso de hormônios contrarreguladores. Sem insulina, a lipólise fica desinibida, os ácidos graxos livres chegam em massa ao fígado e são desviados para a betaoxidação, gerando corpos cetônicos. O estado hiperosmolar ocorre quando resta insulina suficiente para suprimir a cetogênese, mas não para conter a hiperglicemia — daí a osmolalidade extrema sem acidose, e a instalação mais lenta, ao longo de dias.',
  armadilhas: [
    'Leucocitose de até 25.000/mm³ é comum na cetoacidose sem infecção, por desmarginação induzida por catecolaminas. Desvio à esquerda importante, contudo, sugere infecção.',
    'A amilase e a lipase podem estar elevadas sem pancreatite.',
    'Hipofosfatemia surge durante o tratamento; reponha apenas se abaixo de 1 mg/dL ou se houver disfunção cardíaca, respiratória ou anemia hemolítica.',
  ],
  referencias: [
    { texto: 'Kitabchi AE, Umpierrez GE, Miles JM, Fisher JN. Hyperglycemic crises in adult patients with diabetes. Diabetes Care. 2009;32(7):1335-1343.' },
    { texto: 'Umpierrez G, Korytkowski M. Diabetic emergencies — ketoacidosis, hyperglycaemic hyperosmolar state and hypoglycaemia. Nat Rev Endocrinol. 2016;12(4):222-232.' },
  ],
}

const insulina: Ferramenta = {
  id: 'dose-insulina',
  nome: 'Dose de insulina, fator de correção e relação insulina-carboidrato',
  sinonimos: ['insulina', 'contagem de carboidratos', 'fator de sensibilidade', 'bolus', 'basal bolus'],
  resumo: 'Monta o esquema basal-bolus e calcula os três parâmetros da terapia intensiva.',
  categorias: ['endocrinologia'],
  campos: [
    campoPeso(),
    campoSeg('tipo', 'Tipo de diabetes', [
      { valor: 'dm1', rotulo: 'Tipo 1' },
      { valor: 'dm2', rotulo: 'Tipo 2' },
    ]),
    campoNum('doseTotal', 'Dose diária total de insulina já em uso', { unidade: 'U/dia', min: 2, max: 300, passo: 1, opcional: true, ajuda: 'Se já houver esquema em curso, é preferível calcular os fatores sobre a dose real.' }),
    campoSeg('analogo', 'Insulina de bolus', [
      { valor: 'rapida', rotulo: 'Análogo ultrarrápido (lispro, asparte, glulisina)' },
      { valor: 'regular', rotulo: 'Regular humana' },
    ]),
    campoNum('glicemiaAtual', 'Glicemia atual', { unidade: 'mg/dL', min: 40, max: 600, passo: 1, opcional: true }),
    campoNum('alvo', 'Glicemia alvo', { unidade: 'mg/dL', min: 80, max: 200, passo: 5, padrao: '120' }),
    campoNum('carboidratos', 'Carboidratos da refeição', { unidade: 'g', min: 0, max: 300, passo: 1, opcional: true }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const doseInformada = num(v, 'doseTotal')
    if (peso === null) return null
    const dm1 = opc(v, 'tipo') === 'dm1'
    const estimada = dm1 ? peso * 0.5 : peso * 0.3
    const total = doseInformada ?? estimada
    const basal = total * 0.5
    const bolusRefeicao = (total * 0.5) / 3
    const rapida = opc(v, 'analogo') === 'rapida'
    const fatorCorrecao = (rapida ? 1800 : 1500) / total
    const relacaoCarb = 500 / total
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Dose diária total', valor: `${fmtInt(total)} U/dia`, nota: doseInformada !== null ? 'Dose informada.' : dm1 ? 'Estimativa de 0,5 U/kg/dia — a faixa vai de 0,2 U/kg (fase de lua de mel) a 1,0 U/kg (puberdade, infecção, corticoide).' : 'Estimativa de 0,3 U/kg/dia. Em diabetes tipo 2, o início habitual é ainda mais conservador: 10 U de basal ao deitar, ou 0,1 a 0,2 U/kg/dia.' },
      { rotulo: 'Insulina basal (50%)', valor: `${fmtInt(basal)} U/dia`, nota: 'Glargina, degludeca ou detemir, uma vez ao dia (degludeca e glargina U-300 têm ação mais longa e menos hipoglicemia noturna). Com NPH, divida em 2 a 3 aplicações.' },
      { rotulo: 'Bolus por refeição (50% divididos em 3)', valor: `${fmtInt(bolusRefeicao)} U`, nota: 'Ponto de partida antes de iniciar a contagem de carboidratos.' },
      { rotulo: 'Fator de sensibilidade (regra dos 1800/1500)', valor: `1 U reduz ${fmtInt(fatorCorrecao)} mg/dL`, nota: rapida ? 'Regra dos 1800, para análogos ultrarrápidos.' : 'Regra dos 1500, para insulina regular humana.' },
      { rotulo: 'Relação insulina-carboidrato (regra dos 500)', valor: `1 U para cada ${fmtInt(relacaoCarb)} g`, nota: 'Ponto de partida; ajuste conforme as glicemias pós-prandiais de 2 horas.' },
    ]
    const glicemia = num(v, 'glicemiaAtual')
    const alvo = numOu(v, 'alvo', 120)
    const carbo = num(v, 'carboidratos')
    let doseAgora = 0
    if (glicemia !== null) {
      const correcao = Math.max(0, (glicemia - alvo) / fatorCorrecao)
      doseAgora += correcao
      detalhes.push({ rotulo: 'Dose de correção', valor: `${fmtLivre(correcao, 1)} U`, nota: `(${fmtInt(glicemia)} − ${fmtInt(alvo)}) ÷ ${fmtInt(fatorCorrecao)}` })
    }
    if (carbo !== null) {
      const doseCarb = carbo / relacaoCarb
      doseAgora += doseCarb
      detalhes.push({ rotulo: 'Dose para a refeição', valor: `${fmtLivre(doseCarb, 1)} U`, nota: `${fmtInt(carbo)} g ÷ ${fmtInt(relacaoCarb)} g/U` })
    }
    if (glicemia !== null || carbo !== null) detalhes.push({ rotulo: 'Bolus total agora', valor: `${fmtLivre(doseAgora, 1)} U`, nivel: 'alerta' })
    return {
      titulo: 'Esquema de insulina',
      valor: fmtInt(total),
      unidade: 'U/dia',
      nivel: 'neutro',
      rotuloNivel: dm1 ? 'Diabetes tipo 1 — basal-bolus obrigatório' : 'Diabetes tipo 2',
      detalhes,
      conduta: [
        'Comece com **0,4 a 0,5 U/kg/dia** de dose total diária no diabetes tipo 1 (0,2 a 0,3 U/kg/dia em idosos, magros ou com função renal reduzida), dividida em **metade basal e metade em bolus** distribuídos nas refeições. Titule a partir daí — o cálculo inicial é ponto de partida, não prescrição definitiva.',
        'Derive os parâmetros pelas regras clássicas e **ajuste-os pela resposta real**: **fator de sensibilidade (regra de 1800 ou 1500) ÷ dose total diária** para saber quanto 1 unidade abaixa a glicemia; **relação insulina-carboidrato (regra de 500) ÷ dose total diária** para saber quantos gramas de carboidrato 1 unidade cobre. Esses números mudam ao longo do dia, com exercício, com doença e com o ciclo menstrual.',
        'Titule a **basal pela glicemia de jejum** e os **bolus pela glicemia pós-prandial de 2 horas**. Antes de aumentar a basal por hiperglicemia matinal, exclua **hipoglicemia noturna com hiperglicemia de rebote (efeito Somogyi)** e o **fenômeno do alvorecer** — as condutas são opostas, e aumentar a basal no primeiro caso agrava o problema.',
        'Corrija a hipoglicemia pela **regra dos 15**: 15 g de carboidrato de absorção rápida, reavaliação em 15 minutos, repetição se necessário. Em hipoglicemia grave com rebaixamento, use **glucagon (intramuscular ou nasal)** e ensine um familiar a aplicá-lo — a prescrição do glucagon é frequentemente esquecida em quem mais precisa dela.',
        'Revise a **técnica de aplicação** sempre que houver variabilidade inexplicada: rodízio de sítios (a **lipo-hipertrofia** por aplicação repetida no mesmo ponto altera de forma imprevisível a absorção e é causa comum de descontrole), agulha de 4 mm sem prega em adultos, e conservação adequada. Em uso hospitalar, abandone a prescrição exclusivamente por escala móvel: ela trata a hiperglicemia depois do fato e produz oscilação — o esquema basal-bolus-correção é superior.',
      ],
      interpretacao: [
        '**As três regras da terapia intensiva:** a regra dos **1800** (ou 1500 para insulina regular) dá o fator de sensibilidade — quanto 1 unidade baixa a glicemia. A regra dos **500** dá a relação insulina-carboidrato — quantos gramas 1 unidade cobre. A divisão **50/50** entre basal e bolus é o ponto de partida da distribuição.',
        'Todos esses números são **estimativas iniciais**. O ajuste real vem do padrão glicêmico: glicemias de jejum altas ajustam a basal; glicemias pós-prandiais de 2 horas ajustam a relação insulina-carboidrato; glicemias pré-prandiais fora do alvo ajustam o fator de correção.',
        'A **insulina basal só deve ser titulada pela glicemia de jejum**. Aumentar a basal para corrigir hiperglicemia pós-prandial é o erro mais comum e produz hipoglicemia noturna — o fenômeno da "superbasalização".',
        dm1
          ? 'No diabetes tipo 1, o esquema basal-bolus ou a bomba de infusão são obrigatórios. Insulina NPH duas vezes ao dia com regular é aceitável quando há restrição de acesso, mas com mais hipoglicemia e menos flexibilidade.'
          : 'No diabetes tipo 2, a insulina basal costuma ser acrescentada aos antidiabéticos orais. Mantenha metformina e, sempre que possível, inibidor de SGLT2 e agonista de GLP-1 — ambos com benefício cardiovascular e renal independente do controle glicêmico.',
        '**Esquema de correção isolado ("escala móvel") é inadequado** como tratamento único no paciente internado: ele trata a hiperglicemia depois que ela aconteceu, em vez de preveni-la. O padrão é o esquema basal-bolus-correção.',
      ],
      alertas: ['Hipoglicemia grave (nível 3, com necessidade de terceiros) é o principal fator limitante da intensificação. Rastreie hipoglicemias despercebidas e considere afrouxar os alvos em quem as tem.'],
    }
  },
  formula: [
    'Dose total ≈ 0,5 U/kg/dia (tipo 1) ou 0,1 a 0,3 U/kg/dia (tipo 2)',
    'Basal = 50% da dose total | Bolus = 50% divididos entre as refeições',
    'Fator de sensibilidade = 1800 ÷ dose total (análogo) ou 1500 ÷ dose total (regular)',
    'Relação insulina-carboidrato = 500 ÷ dose total',
  ],
  fundamento:
    'As constantes 1800, 1500 e 500 foram derivadas empiricamente de coortes de pacientes em terapia intensiva com insulina, a partir da observação de quanto cada unidade efetivamente reduzia a glicemia e cobria carboidrato. Elas funcionam porque a sensibilidade à insulina é aproximadamente inversa à dose diária total — quem precisa de mais insulina é mais resistente, e cada unidade rende menos. As regras de 1800, 1500 e 500 são consequências aritméticas de um mesmo pressuposto: a dose total diária de insulina é inversamente proporcional à sensibilidade do paciente. A regra de **1800 dividida pela dose total** estima quantos mg/dL 1 unidade abaixa (1500 para insulina regular, mais lenta); a regra de **500 dividida pela dose total** estima quantos gramas de carboidrato 1 unidade cobre. A divisão em metade basal e metade prandial reproduz a secreção fisiológica, em que a célula beta mantém liberação tônica contínua entre as refeições e picos em resposta à ingestão.',
  armadilhas: [
    'Corticoide, infecção, cirurgia e gestação aumentam a necessidade de insulina de forma abrupta e substancial. Corticoide de manhã eleva sobretudo a glicemia da tarde e da noite.',
    'Doença renal crônica avançada **reduz** a necessidade de insulina (menor depuração renal) e aumenta o risco de hipoglicemia.',
    'Lipo-hipertrofia nos locais de aplicação altera drasticamente a absorção. Inspecione os sítios em toda consulta e oriente rodízio.',
  ],
  referencias: [
    { texto: 'American Diabetes Association. Standards of Care in Diabetes — 2024: pharmacologic approaches to glycemic treatment. Diabetes Care. 2024;47(Suppl 1):S158-S178.' },
    { texto: 'Walsh J, Roberts R. Pumping Insulin. 6ª ed. Torrey Pines Press; 2016.' },
  ],
}

const findrisc: Ferramenta = {
  id: 'findrisc',
  nome: 'FINDRISC — risco de diabetes tipo 2 em 10 anos',
  sinonimos: ['findrisc', 'risco de diabetes', 'rastreio diabetes'],
  resumo: 'Estima o risco de desenvolver diabetes tipo 2 sem nenhum exame de sangue.',
  categorias: ['endocrinologia'],
  campos: [
    campoOpc('idade', 'Idade', [
      { valor: '0', rotulo: 'Menos de 45 anos', pontos: 0 },
      { valor: '2', rotulo: '45 a 54 anos', pontos: 2 },
      { valor: '3', rotulo: '55 a 64 anos', pontos: 3 },
      { valor: '4', rotulo: '65 anos ou mais', pontos: 4 },
    ], { ajuda: 'Item não modificável. A idade agrega perda progressiva de função de célula beta somada a aumento de adiposidade visceral e redução de massa muscular.' }),
    campoOpc('imc', 'Índice de massa corporal', [
      { valor: '0', rotulo: 'Menos de 25 kg/m²', pontos: 0 },
      { valor: '1', rotulo: '25 a 30 kg/m²', pontos: 1 },
      { valor: '3', rotulo: 'Mais de 30 kg/m²', pontos: 3 },
    ], { ajuda: 'Item modificável. Em ascendência asiática, o risco começa em valores menores (23 e 27,5), e o escore original subestima nesse grupo.' }),
    campoSexo(),
    campoOpc('cintura', 'Circunferência da cintura', [
      { valor: '0', rotulo: 'Menor que 94 cm (♂) ou 80 cm (♀)', pontos: 0 },
      { valor: '3', rotulo: '94 a 102 cm (♂) ou 80 a 88 cm (♀)', pontos: 3 },
      { valor: '4', rotulo: 'Maior que 102 cm (♂) ou 88 cm (♀)', pontos: 4 },
    ], { ajuda: 'Meça no ponto médio entre a última costela e a crista ilíaca, ao fim de uma expiração normal — não estime. A cintura pesa mais que o IMC aqui porque mede adiposidade VISCERAL, que drena para a veia porta e é a metabolicamente ativa.' }),
    campoSimNao('atividade', 'Faz MENOS de 30 minutos de atividade física por dia', 2, 'Item INVERTIDO: pontua quem NÃO se exercita. Inclui atividade do trabalho e do lazer. O exercício tem via própria de captação de glicose, independente de insulina (translocação de GLUT4 mediada por AMPK) — por isso funciona mesmo com resistência insulínica instalada.'),
    campoSimNao('vegetais', 'NÃO come frutas, vegetais ou verduras todos os dias', 1, 'Também INVERTIDO: pontua a AUSÊNCIA do hábito. Item de menor peso, mas modificável e útil como gancho educativo na consulta.'),
    campoSimNao('antiHipertensivo', 'Já usou ou usa medicação anti-hipertensiva regularmente', 2, 'Marca hipertensão, que compartilha com o diabetes a mesma base de resistência insulínica e disfunção endotelial. Alguns anti-hipertensivos (tiazídicos, betabloqueadores) também aumentam discretamente o risco.'),
    campoSimNao('glicemiaAlta', 'Já teve glicemia elevada detectada (exame, gestação ou doença)', 5, 'Item de maior peso, junto com história familiar em primeiro grau. Inclui diabetes gestacional, hiperglicemia de estresse em doença aguda e uso de corticoide — todos revelam reserva de célula beta já limitada.'),
    campoOpc('familia', 'História familiar de diabetes', [
      { valor: '0', rotulo: 'Não', pontos: 0 },
      { valor: '3', rotulo: 'Sim: avós, tios, primos', pontos: 3 },
      { valor: '5', rotulo: 'Sim: pais, irmãos ou filhos', pontos: 5 },
    ], { ajuda: 'Primeiro grau vale 5 pontos e segundo grau vale 3. O diabetes tipo 2 tem herdabilidade alta, maior que a do tipo 1 — a concordância entre gêmeos idênticos passa de 70%.' }),
  ],
  calcular: (v) => {
    const ids = ['idade', 'imc', 'cintura', 'familia']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    total += somaSimNao(v, [
      { id: 'atividade', pontos: 2 },
      { id: 'vegetais', pontos: 1 },
      { id: 'antiHipertensivo', pontos: 2 },
      { id: 'glicemiaAlta', pontos: 5 },
    ])
    const faixa = total < 7 ? 0 : total <= 11 ? 1 : total <= 14 ? 2 : total <= 20 ? 3 : 4
    const risco = ['1% (1 em 100)', '4% (1 em 25)', '17% (1 em 6)', '33% (1 em 3)', '50% (1 em 2)'][faixa]
    const rotulos = ['Risco baixo', 'Risco levemente aumentado', 'Risco moderado', 'Risco alto', 'Risco muito alto']
    return {
      titulo: 'FINDRISC',
      valor: String(total),
      unidade: 'de 26 pontos',
      nivel: (['ok', 'ok', 'atencao', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: rotulos[faixa],
      detalhes: [{ rotulo: 'Risco de desenvolver diabetes tipo 2 em 10 anos', valor: risco }],
      interpretacao: [
        faixa >= 2
          ? 'Risco moderado ou maior: **solicite glicemia de jejum e hemoglobina glicada**, ou teste de tolerância oral à glicose se houver dúvida. Encaminhe para programa estruturado de mudança de estilo de vida.'
          : 'Risco baixo: reforce hábitos protetores e reavalie periodicamente.',
        'O grande mérito do FINDRISC é não exigir exame algum — pode ser aplicado em campanha, farmácia, unidade básica ou pelo próprio paciente. Ele identifica quem vale a pena testar.',
        'A prevenção funciona e tem evidência forte. O Diabetes Prevention Program mostrou redução de 58% na progressão de pré-diabetes para diabetes com intervenção intensiva de estilo de vida (perda de 7% do peso e 150 minutos semanais de atividade física), contra 31% com metformina. O efeito da mudança de estilo de vida persistiu por mais de 15 anos de seguimento.',
        'Note que **quatro dos oito itens são modificáveis**: IMC, cintura, atividade física e alimentação. É deliberado — o questionário é também um instrumento educativo.',
        'A fisiopatologia explica por que esses itens específicos predizem. O diabetes tipo 2 resulta de **resistência insulínica** somada à **falência progressiva da célula beta**, e as duas coisas evoluem em ritmos diferentes. A resistência insulínica se instala cedo, sobretudo pela adiposidade visceral: o adipócito visceral hipertrofiado é resistente à insulina, tem lipólise acelerada e entrega ácidos graxos livres ao fígado pela veia porta, além de secretar TNF-α, IL-6 e resistina e reduzir adiponectina. No músculo e no fígado, o excesso de ácidos graxos gera metabólitos lipotóxicos (diacilglicerol e ceramidas) que ativam proteína quinase C e serina-quinases, fosforilando o substrato do receptor de insulina em serina em vez de tirosina e interrompendo a sinalização — daí a menor translocação de GLUT4 no músculo e a falha em suprimir a gliconeogênese hepática. Por anos a célula beta compensa aumentando a secreção, e a glicemia permanece normal. O diabetes só aparece quando ela falha, por lipotoxicidade, glicotoxicidade, estresse de retículo endoplasmático e deposição de amilina — e, quando o diagnóstico é feito, cerca de metade da função de célula beta já se perdeu. É por isso que a **atividade física** entra no escore com peso próprio: a contração muscular promove translocação de GLUT4 por via independente de insulina (mediada por AMPK), oferecendo um caminho alternativo de captação de glicose que não depende da sinalização já comprometida.',
      ],
      conduta: faixa >= 2
        ? [
            '**Solicite exame confirmatório agora**: glicemia de jejum e hemoglobina glicada; teste oral de tolerância à glicose se houver discordância ou suspeita clínica forte. O escore identifica quem vale a pena testar — ele não diagnostica nada.',
            'Se houver **pré-diabetes** (glicemia de jejum de 100 a 125 mg/dL, glicada de 5,7 a 6,4%, ou glicemia de 140 a 199 mg/dL duas horas após sobrecarga), encaminhe a programa estruturado de mudança de estilo de vida com as metas do Diabetes Prevention Program: **perda de 7% do peso** e **150 minutos semanais de atividade física moderada**. Essa combinação reduziu a progressão para diabetes em 58%, contra 31% com metformina, e o efeito persistiu por mais de 15 anos.',
            'Considere **metformina** como adjuvante em quem tem maior risco: menos de 60 anos, IMC acima de 35, história de diabetes gestacional, ou glicada que sobe apesar da mudança de estilo de vida. Ela não substitui a intervenção comportamental, que é mais eficaz.',
            'Avalie o risco cardiovascular global no mesmo encontro: pressão arterial, lipidograma, tabagismo e circunferência abdominal. Pré-diabetes e diabetes compartilham fatores e desfechos com a doença aterosclerótica, e tratar só a glicemia deixa a maior parte do risco intacta.',
            'Use os **quatro itens modificáveis** (IMC, cintura, atividade física e alimentação) como pauta da conversa: mostrar ao paciente quantos pontos ele pode reduzir com mudanças concretas transforma o questionário em instrumento educativo, que é parte do desenho original.',
            'Reavalie anualmente com glicada ou glicemia de jejum em quem tem pré-diabetes, e a cada 3 anos em quem tem risco moderado com exames normais.',
          ]
        : [
            'Risco baixo. Reforce os hábitos protetores de forma específica, não genérica: atividade física regular (a contração muscular capta glicose por via independente de insulina), consumo diário de frutas, verduras e legumes, e manutenção do peso e da circunferência abdominal.',
            'Meça e registre a **circunferência abdominal** mesmo com IMC normal — a adiposidade central prediz melhor que o peso, e existe resistência insulínica com IMC de 24.',
            'Reavalie o escore a cada 3 a 5 anos, ou antes se houver ganho de peso, mudança de hábitos, gestação com diabetes gestacional ou surgimento de hipertensão ou dislipidemia.',
            'Escore baixo **não** dispensa rastreio laboratorial quando há indicação independente: história de diabetes gestacional, síndrome dos ovários policísticos, doença cardiovascular estabelecida, HIV, uso crônico de corticoide ou antipsicótico atípico, e acantose nigricans.',
          ],
      alertas: [
        'O escore **não diagnostica nem exclui** diabetes. Ele estima risco de desenvolver a doença em 10 anos e identifica quem testar — pessoas com diabetes não diagnosticado podem ter escore baixo.',
        'Foi derivado em população finlandesa e tende a **subestimar** em populações de maior prevalência, como a brasileira, e em pessoas de ascendência asiática, africana ou indígena, que desenvolvem resistência insulínica com IMC e cintura menores.',
        'Não se aplica a quem já tem diagnóstico de diabetes, nem a gestantes — o rastreio de diabetes gestacional segue protocolo próprio, com teste oral de tolerância à glicose entre 24 e 28 semanas.',
        'Escore baixo não afasta indicação de rastreio por outros critérios: diabetes gestacional prévio, síndrome dos ovários policísticos, doença cardiovascular, HIV, corticoterapia crônica e antipsicótico atípico justificam testar independentemente da pontuação.',
      ],
    }
  },
  formula: ['Soma ponderada de 8 itens (0 a 26 pontos)'],
  fundamento:
    'O FINDRISC foi desenvolvido na Finlândia a partir de coortes populacionais acompanhadas por 10 anos, com o objetivo explícito de ser aplicável sem laboratório. Suas variáveis capturam os três determinantes do diabetes tipo 2: predisposição genética (história familiar), adiposidade e sua distribuição (IMC e cintura) e comportamento (atividade física e alimentação). A doença que ele antecipa tem dois componentes que evoluem em ritmos diferentes, e é essa assimetria que torna o rastreio sem exame possível e útil. A **resistência insulínica** se instala cedo e é impulsionada sobretudo pela adiposidade visceral: o adipócito visceral hipertrofiado tem lipólise acelerada e entrega ácidos graxos livres ao fígado pela veia porta, além de secretar TNF-α, IL-6 e resistina e reduzir adiponectina. No músculo e no fígado, o excesso de lipídios gera diacilglicerol e ceramidas, que ativam proteína quinase C e serina-quinases e fosforilam o substrato do receptor de insulina em serina em vez de tirosina, interrompendo a cascata — daí a menor translocação de GLUT4 no músculo e a falha em suprimir a gliconeogênese hepática. A **falência da célula beta** vem depois: por anos ela compensa hipersecretando, e a glicemia permanece normal; o diabetes só aparece quando a compensação falha, por lipotoxicidade, glicotoxicidade, estresse de retículo endoplasmático e deposição de amilina. Quando o diagnóstico laboratorial é feito, cerca de metade da função de célula beta já se perdeu. É por isso que um escore de fatores de risco, sem nenhuma dosagem, consegue identificar pessoas anos antes: ele detecta o primeiro componente enquanto o segundo ainda compensa. Vale notar a escolha deliberada de incluir **atividade física** como item próprio: a contração muscular promove translocação de GLUT4 por via independente de insulina, mediada por AMPK, oferecendo um caminho alternativo de captação de glicose que não depende da sinalização já comprometida — mecanismo que sustenta a eficácia do exercício na prevenção. E quatro dos oito itens são modificáveis, o que torna o questionário também um instrumento educativo, como seus autores pretendiam.',
  armadilhas: [
    'Foi derivado em população finlandesa. Em populações com prevalência maior, como a brasileira, tende a subestimar — mas mantém boa capacidade de ordenar o risco.',
    'Não se aplica a quem já tem diagnóstico de diabetes.',
    'Estima risco de DESENVOLVER diabetes, não de já tê-lo. Um paciente com diabetes não diagnosticado pode pontuar baixo, e o escore não substitui rastreio laboratorial quando há indicação independente.',
    'Os cortes de IMC e de cintura foram calibrados para população europeia. Pessoas de ascendência asiática desenvolvem resistência insulínica com valores menores, e usar os cortes originais subestima nesse grupo.',
    'Não vale para gestantes: o rastreio de diabetes gestacional tem protocolo próprio, com teste oral de tolerância à glicose entre 24 e 28 semanas.',
    'A cintura precisa ser medida, não estimada — no ponto médio entre a última costela e a crista ilíaca, ao fim de uma expiração normal, sem roupa e sem comprimir.',
    'Quando o diagnóstico é feito, cerca de metade da função de célula beta já se perdeu. Escore alto é janela de prevenção, e adiar o exame confirmatório consome justamente a fase em que a intervenção é mais eficaz.',
  ],
  referencias: [
    { texto: 'Lindström J, Tuomilehto J. The diabetes risk score: a practical tool to predict type 2 diabetes risk. Diabetes Care. 2003;26(3):725-731.' },
    { texto: 'Knowler WC, Barrett-Connor E, Fowler SE, et al. Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin. N Engl J Med. 2002;346(6):393-403.' },
  ],
}

const corticoides: Ferramenta = {
  id: 'conversor-glicocorticoides',
  nome: 'Conversor de glicocorticoides',
  sinonimos: ['corticoide', 'prednisona', 'dexametasona', 'hidrocortisona', 'equivalencia corticoide'],
  resumo: 'Converte entre corticoides e mostra potência mineralocorticoide e duração de ação.',
  categorias: ['endocrinologia', 'farmacologia'],
  campos: [
    campoOpc('de', 'Converter de', [
      { valor: 'hidrocortisona', rotulo: 'Hidrocortisona' },
      { valor: 'cortisona', rotulo: 'Acetato de cortisona' },
      { valor: 'prednisona', rotulo: 'Prednisona' },
      { valor: 'prednisolona', rotulo: 'Prednisolona' },
      { valor: 'metilprednisolona', rotulo: 'Metilprednisolona' },
      { valor: 'triancinolona', rotulo: 'Triancinolona' },
      { valor: 'dexametasona', rotulo: 'Dexametasona' },
      { valor: 'betametasona', rotulo: 'Betametasona' },
      { valor: 'deflazacorte', rotulo: 'Deflazacorte' },
    ]),
    campoNum('dose', 'Dose', { unidade: 'mg', min: 0.05, max: 2000, passo: 0.05 }),
  ],
  calcular: (v) => {
    const de = opc(v, 'de')
    const dose = num(v, 'dose')
    if (dose === null) return null
    const tabela: Record<string, { nome: string; equiv: number; mineralo: string; duracao: string }> = {
      hidrocortisona: { nome: 'Hidrocortisona', equiv: 20, mineralo: 'Alta (1,0)', duracao: 'Curta (8 a 12 h)' },
      cortisona: { nome: 'Acetato de cortisona', equiv: 25, mineralo: 'Alta (0,8)', duracao: 'Curta (8 a 12 h)' },
      prednisona: { nome: 'Prednisona', equiv: 5, mineralo: 'Intermediária (0,8)', duracao: 'Intermediária (12 a 36 h)' },
      prednisolona: { nome: 'Prednisolona', equiv: 5, mineralo: 'Intermediária (0,8)', duracao: 'Intermediária (12 a 36 h)' },
      metilprednisolona: { nome: 'Metilprednisolona', equiv: 4, mineralo: 'Baixa (0,5)', duracao: 'Intermediária (12 a 36 h)' },
      triancinolona: { nome: 'Triancinolona', equiv: 4, mineralo: 'Nenhuma (0)', duracao: 'Intermediária (12 a 36 h)' },
      dexametasona: { nome: 'Dexametasona', equiv: 0.75, mineralo: 'Nenhuma (0)', duracao: 'Longa (36 a 72 h)' },
      betametasona: { nome: 'Betametasona', equiv: 0.6, mineralo: 'Nenhuma (0)', duracao: 'Longa (36 a 72 h)' },
      deflazacorte: { nome: 'Deflazacorte', equiv: 6, mineralo: 'Baixa', duracao: 'Intermediária' },
    }
    const origem = tabela[de]
    const emHidrocortisona = (dose / origem.equiv) * 20
    const linhas = Object.values(tabela).map((t) => [t.nome, `${fmtLivre((emHidrocortisona / 20) * t.equiv, 2)} mg`, t.mineralo, t.duracao])
    return {
      titulo: 'Equivalência',
      valor: `${fmtLivre(emHidrocortisona, 1)} mg`,
      unidade: 'de hidrocortisona',
      nivel: 'neutro',
      rotuloNivel: `${fmtLivre(dose, 2)} mg de ${origem.nome.toLowerCase()}`,
      detalhes: [
        { rotulo: 'Potência anti-inflamatória relativa', valor: fmt(20 / origem.equiv, 1), nota: 'Tomando a hidrocortisona como 1.' },
        { rotulo: 'Atividade mineralocorticoide', valor: origem.mineralo, nota: 'Determina retenção de sódio e água, hipocalemia e hipertensão.' },
        { rotulo: 'Duração de ação', valor: origem.duracao, nota: 'Determina o grau de supressão do eixo hipotálamo-hipófise-adrenal.' },
      ],
      conduta: [
        'Ao converter, compare as **três propriedades separadamente**: potência anti-inflamatória, potência mineralocorticoide e meia-vida biológica. Trocar prednisona por dexametasona na \'dose equivalente\' anti-inflamatória entrega um fármaco sem efeito mineralocorticoide e com duração muito maior — o que importa, por exemplo, na insuficiência adrenal, onde a fludrocortisona é indispensável.',
        'Em **hepatopatia**, prefira **prednisolona a prednisona**: a prednisona é um pró-fármaco que depende de conversão hepática pela 11-beta-hidroxiesteroide desidrogenase. Esse detalhe é a razão de as diretrizes de hepatite alcoólica especificarem prednisolona.',
        'Faça o **desmame** em qualquer paciente que tenha usado dose supressora por mais de 3 semanas: o eixo hipotálamo-hipófise-adrenal leva semanas a meses para se recuperar, e a retirada abrupta causa insuficiência adrenal aguda. Reduza mais devagar abaixo de 7,5 mg de prednisona por dia, que é a faixa próxima da produção fisiológica.',
        'Aplique a **dose de estresse** em quem usa corticoide cronicamente e enfrenta cirurgia, trauma, infecção grave ou parto: hidrocortisona 50–100 mg intravenosa, com ajuste pela magnitude do estresse. A ausência dessa cobertura produz choque refratário a vasopressor, com diagnóstico frequentemente tardio.',
        'Antecipe os efeitos adversos previsíveis e trate-os antes de aparecerem: **profilaxia de osteoporose** (cálcio, vitamina D e bisfosfonato conforme risco) a partir de 3 meses de uso, controle glicêmico (o corticoide eleva sobretudo a glicemia pós-prandial), monitorização de pressão e potássio, e **profilaxia de pneumocistose** com sulfametoxazol-trimetoprima quando a dose equivaler a 20 mg ou mais de prednisona por 4 semanas ou mais, especialmente com outro imunossupressor associado.',
      ],
      alertas: [
        'A equivalência anti-inflamatória **não** carrega junto a potência mineralocorticoide nem a meia-vida. Trocar por dexametasona na dose \'equivalente\' entrega um fármaco sem efeito mineralocorticoide — o que é perigoso na insuficiência adrenal, onde a fludrocortisona é indispensável.',
        'Quem usou dose supressora por mais de 3 semanas precisa de desmame e de dose de estresse em cirurgia, trauma ou infecção grave. A ausência dessa cobertura produz choque refratário a vasopressor, com diagnóstico frequentemente tardio.',
      ],
      interpretacao: [
        '**A equivalência é apenas anti-inflamatória.** Ela não transfere as outras propriedades: dexametasona equipotente a hidrocortisona não repõe mineralocorticoide, e por isso não serve para insuficiência adrenal primária sem fludrocortisona associada.',
        '**Escolha pelo perfil, não pela potência.** Hidrocortisona para reposição fisiológica (imita o cortisol, meia-vida curta, tem ação mineralocorticoide). Prednisona/prednisolona para anti-inflamatório crônico. Dexametasona quando se quer evitar retenção hídrica ou aproveitar a passagem pela barreira hematoencefálica (edema cerebral, maturação pulmonar fetal). Metilprednisolona em pulsoterapia.',
        '**Prednisona é pró-fármaco**: precisa ser convertida em prednisolona no fígado. Em hepatopatia grave, prefira prednisolona diretamente.',
        '**Supressão do eixo adrenal:** considere risco em quem usou o equivalente a mais de 20 mg/dia de prednisona por mais de 3 semanas, ou qualquer dose por mais de um mês. A retirada deve ser gradual, e o paciente precisa de dose de estresse (100 mg de hidrocortisona, seguida de 50 mg a cada 6 a 8 horas) em cirurgia, trauma ou doença grave.',
        'Doses fisiológicas de reposição equivalem a 15 a 25 mg/dia de hidrocortisona (cerca de 5 a 7,5 mg/m²), divididas com a maior parte pela manhã para imitar o ritmo circadiano.',
      ],
      tabela: { titulo: 'Doses equivalentes', colunas: ['Corticoide', 'Dose equivalente', 'Mineralocorticoide', 'Duração'], linhas },
    }
  },
  formula: ['Hidrocortisona 20 mg = cortisona 25 = prednisona 5 = prednisolona 5 = metilprednisolona 4 = triancinolona 4 = dexametasona 0,75 = betametasona 0,6'],
  fundamento:
    'As modificações estruturais na molécula do cortisol explicam as diferenças. A dupla ligação entre C1 e C2 (prednisona) aumenta a potência anti-inflamatória e reduz a mineralocorticoide. A metilação em C6 (metilprednisolona) reduz ainda mais a atividade mineralocorticoide. A fluoração em C9 com hidroxila em C16 (dexametasona, betametasona) elimina a atividade mineralocorticoide e prolonga muito a meia-vida biológica.',
  armadilhas: [
    'Corticoide inalatório e tópico em dose alta também suprimem o eixo — não são "seguros por definição".',
    'A conversão não vale para uso tópico, inalatório ou intra-articular, cujas potências relativas são outras.',
    'Efeitos adversos a rastrear em uso prolongado: hiperglicemia, osteoporose (profilaxia com cálcio, vitamina D e bisfosfonato conforme o risco), catarata, glaucoma, miopatia, imunossupressão (profilaxia para pneumocistose acima de 20 mg/dia de prednisona por mais de 4 semanas), úlcera péptica com anti-inflamatório associado, e alterações do humor.',
  ],
  referencias: [
    { texto: 'Liu D, Ahmet A, Ward L, et al. A practical guide to the monitoring and management of the complications of systemic corticosteroid therapy. Allergy Asthma Clin Immunol. 2013;9(1):30.' },
    { texto: 'Bornstein SR, Allolio B, Arlt W, et al. Diagnosis and treatment of primary adrenal insufficiency: an Endocrine Society clinical practice guideline. J Clin Endocrinol Metab. 2016;101(2):364-389.' },
  ],
}

const tireoide: Ferramenta = {
  id: 'conversor-hormonios-tireoidianos',
  nome: 'Conversor de hormônios tireoidianos e índice de tiroxina livre',
  sinonimos: ['levotiroxina', 't3', 't4', 'tireoide', 'itl', 'indice de tiroxina livre'],
  resumo: 'Converte entre preparações tireoidianas, calcula a dose por peso e o índice de tiroxina livre.',
  categorias: ['endocrinologia', 'farmacologia'],
  campos: [
    campoPeso(),
    campoSeg('cenario', 'Cenário', [
      { valor: 'hipo', rotulo: 'Reposição no hipotireoidismo' },
      { valor: 'conversao', rotulo: 'Conversão entre preparações' },
      { valor: 'itl', rotulo: 'Índice de tiroxina livre' },
    ]),
    campoSeg('perfil', 'Perfil do paciente', [
      { valor: 'jovem', rotulo: 'Adulto jovem hígido' },
      { valor: 'idoso', rotulo: 'Idoso ou coronariopata' },
      { valor: 'gestante', rotulo: 'Gestante' },
      { valor: 'subclinico', rotulo: 'Hipotireoidismo subclínico' },
    ], { mostrarSe: (v) => opc(v, 'cenario') === 'hipo' }),
    campoNum('levo', 'Dose de levotiroxina', { unidade: 'µg/dia', min: 12.5, max: 400, passo: 12.5, mostrarSe: (v) => opc(v, 'cenario') === 'conversao' }),
    campoNum('t4total', 'T4 total', { unidade: 'µg/dL', min: 1, max: 30, passo: 0.1, mostrarSe: (v) => opc(v, 'cenario') === 'itl' }),
    campoNum('captacao', 'Captação de T3 em resina (ou THBR)', { unidade: '%', min: 10, max: 80, passo: 0.1, padrao: '30', mostrarSe: (v) => opc(v, 'cenario') === 'itl' }),
  ],
  calcular: (v) => {
    const cenario = opc(v, 'cenario')
    const peso = num(v, 'peso')
    if (cenario === 'itl') {
      const t4 = num(v, 't4total')
      const capt = num(v, 'captacao')
      if (t4 === null || capt === null) return null
      const itl = (t4 * capt) / 30
      return {
        titulo: 'Índice de tiroxina livre',
        valor: fmt(itl, 2),
        nivel: itl > 12 ? 'alerta' : itl < 4.5 ? 'alerta' : 'ok',
        rotuloNivel: itl > 12 ? 'Elevado' : itl < 4.5 ? 'Reduzido' : 'Faixa de referência (4,5 a 12)',
        detalhes: [
          { rotulo: 'T4 total', valor: `${fmt(t4, 1)} µg/dL` },
          { rotulo: 'Captação de T3 em resina', valor: fmtPct(capt, 1), nota: 'Mede indiretamente os sítios livres da globulina ligadora de tiroxina.' },
        ],
        conduta: [
          'Use o índice de tiroxina livre quando o **T4 livre não estiver disponível** ou quando houver suspeita de alteração das proteínas transportadoras: gestação, uso de estrogênio, anticoncepcional, tamoxifeno, síndrome nefrótica, hepatopatia e doenças com alteração da globulina ligadora de tiroxina.',
          'Índice **elevado** com TSH suprimido confirma tireotoxicose: investigue a causa (doença de Graves, bócio multinodular tóxico, tireoidite, excesso de levotiroxina) com anticorpo antirreceptor de TSH e, quando necessário, cintilografia — o tratamento difere completamente entre elas.',
          'Índice **reduzido** com TSH elevado confirma hipotireoidismo primário e indica reposição. Com TSH baixo ou inapropriadamente normal, suspeite de **hipotireoidismo central** e investigue o eixo hipofisário por inteiro, incluindo cortisol: repor hormônio tireoidiano antes de corrigir insuficiência adrenal pode precipitar crise adrenal.',
          'Em paciente **internado e grave**, desconfie da **síndrome do doente eutireoidiano**: T3 baixo, T4 variável e TSH normal ou baixo refletem adaptação à doença aguda, não doença tireoidiana. Não trate, e reavalie 6 semanas após a recuperação.',
          'Quando possível, prefira a dosagem direta de **T4 livre por diálise de equilíbrio ou espectrometria de massa**, que é o método de referência e não sofre interferência das proteínas transportadoras — o índice é uma aproximação histórica, útil onde esse método não existe.',
        ],
        interpretacao: [
          'O índice de tiroxina livre existe para corrigir o T4 total pelas variações da proteína carreadora. Gestação, estrogênio e hepatite elevam a globulina ligadora de tiroxina, aumentando o T4 total sem que o hormônio livre mude; síndrome nefrótica, androgênios e desnutrição fazem o contrário.',
          'Hoje o T4 livre é medido diretamente pela maioria dos laboratórios e o índice caiu em desuso. Ele permanece útil onde a dosagem direta é indisponível ou pouco confiável, e é conceitualmente instrutivo.',
          'Discordância entre TSH e T4 livre exige investigação: TSH alto com T4 livre alto sugere adenoma hipofisário secretor de TSH ou resistência ao hormônio tireoidiano; TSH baixo com T4 livre baixo sugere hipotireoidismo central.',
        ],
      }
    }
    if (cenario === 'conversao') {
      const levo = num(v, 'levo')
      if (levo === null) return null
      const t3 = levo / 4
      const dessecada = (levo / 100) * 60
      return {
        titulo: 'Equivalências',
        valor: `${fmtInt(levo)} µg`,
        unidade: 'de levotiroxina',
        nivel: 'neutro',
        detalhes: [
          { rotulo: 'Liotironina (T3)', valor: `${fmtLivre(t3, 1)} µg/dia`, nota: 'Relação aproximada de 4:1. A liotironina tem meia-vida curta (cerca de 1 dia contra 7 do T4) e produz picos séricos — exige fracionamento e raramente é usada isolada.' },
          { rotulo: 'Tireoide dessecada', valor: `${fmtLivre(dessecada, 0)} mg`, nota: '1 grão = 60 a 65 mg ≈ 100 µg de levotiroxina. Contém T4 e T3 numa proporção não fisiológica para humanos (cerca de 4:1, enquanto a tireoide humana secreta 14:1).' },
          { rotulo: 'Levotiroxina endovenosa', valor: `${fmtInt(levo * 0.75)} µg`, nota: 'A dose endovenosa corresponde a 70 a 80% da oral, pela absorção intestinal incompleta do comprimido.' },
        ],
        conduta: [
          'Ao converter entre apresentações, **redosar o TSH em 6 a 8 semanas é obrigatório**: a equivalência é uma estimativa de ponto de partida, e a bioequivalência entre marcas e entre formulações (comprimido, cápsula mole, solução) não é exata.',
          'Evite a **combinação T4 com T3 e a tireoide dessecada** fora de protocolo: a maioria dos ensaios não mostrou superioridade sobre a levotiroxina isolada, e essas preparações produzem picos suprafisiológicos de T3, com risco de fibrilação atrial e perda de massa óssea.',
          'Se o paciente insistir na troca por sintomas persistentes com TSH normal, **procure primeiro outras causas** — anemia, deficiência de ferro ou de vitamina B12, apneia do sono, depressão, doença celíaca. Atribuir tudo à tireoide mantém o paciente sem o diagnóstico que de fato explica o quadro.',
          'Ao trocar de marca ou de formulação, **mantenha o paciente na mesma apresentação** depois de estabilizado: a troca repetida entre fabricantes é fonte reconhecida de oscilação do TSH.',
          'Lembre que a levotiroxina tem **janela terapêutica estreita e meia-vida de cerca de 7 dias**: uma dose esquecida pode ser reposta no dia seguinte sem prejuízo, mas a supressão crônica do TSH aumenta o risco de fibrilação atrial e de osteoporose, sobretudo em idosos e pós-menopausa.',
        ],
        interpretacao: [
          '**Levotiroxina isolada é o tratamento de escolha** do hipotireoidismo. A conversão periférica de T4 em T3 pela deiodinase permite que o corpo regule a quantidade de hormônio ativo em cada tecido — vantagem que preparações com T3 não oferecem.',
          'A terapia combinada T4 + T3 permanece controversa. As diretrizes a consideram experimental, reservada a pacientes que permanecem sintomáticos com TSH normalizado, após exclusão de outras causas, e sempre em ensaio terapêutico com desfecho definido.',
          'Tireoide dessecada não é recomendada pelas diretrizes: a proporção T4:T3 não é fisiológica e a padronização entre lotes é menos confiável.',
        ],
      }
    }
    if (peso === null) return null
    const perfil = opc(v, 'perfil')
    const doseKg = perfil === 'gestante' ? 1.9 : perfil === 'jovem' ? 1.6 : perfil === 'subclinico' ? 1.0 : 0.5
    const dose = peso * doseKg
    const inicial = perfil === 'idoso' ? 25 : perfil === 'subclinico' ? Math.min(dose, 50) : dose
    return {
      titulo: 'Dose de levotiroxina',
      valor: fmtInt(dose),
      unidade: 'µg/dia',
      nivel: 'neutro',
      rotuloNivel: `${fmt(doseKg, 1)} µg/kg/dia`,
      detalhes: [
        { rotulo: 'Dose plena estimada', valor: `${fmtInt(dose)} µg/dia` },
        { rotulo: 'Dose inicial recomendada', valor: `${fmtInt(inicial)} µg/dia`, nota: perfil === 'idoso' ? 'Em idosos e coronariopatas, comece com 12,5 a 25 µg/dia e aumente a cada 4 a 6 semanas — iniciar com dose plena pode precipitar angina, arritmia e infarto.' : perfil === 'gestante' ? 'Na gestação, a necessidade aumenta 30 a 50% já no primeiro trimestre; quem já usa levotiroxina deve aumentar a dose assim que a gestação for confirmada (uma estratégia prática é acrescentar 2 doses por semana).' : 'Adulto jovem sem cardiopatia pode iniciar com a dose plena.' },
        { rotulo: 'Intervalo de reavaliação do TSH', valor: '6 a 8 semanas após qualquer ajuste', nota: 'Antes disso, o TSH ainda não refletiu a mudança — a meia-vida da levotiroxina é de 7 dias e o equilíbrio leva 5 meias-vidas.' },
      ],
      conduta: [
        'Prescreva a dose cheia (**cerca de 1,6 µg/kg/dia**) em adulto jovem e hígido, mas comece com **12,5 a 25 µg/dia** em idosos e coronariopatas, titulando devagar: a reposição rápida eleva o consumo miocárdico de oxigênio e pode precipitar angina, arritmia ou infarto.',
        'Ajuste pelo **TSH e espere 6 a 8 semanas** entre a mudança de dose e a nova dosagem — é o tempo que o eixo leva para reequilibrar. Redosar antes disso produz ajustes sucessivos sobre ruído.',
        'Oriente a tomada **em jejum, 30 a 60 minutos antes do café** (ou ao deitar, 3 h após a última refeição), longe de cálcio, ferro, inibidor de bomba de prótons, colestiramina e soja. Absorção errática por interação é a causa mais comum de TSH alterado apesar de dose aparentemente correta.',
        'Na **gestação**, aumente a dose em 25 a 30% assim que a gravidez for confirmada e use faixas de TSH por trimestre: a necessidade sobe já nas primeiras semanas, e o hipotireoidismo materno afeta o desenvolvimento neurológico fetal.',
        'Antes de concluir por \'resistência à levotiroxina\', investigue adesão, interação medicamentosa e má absorção — doença celíaca, gastrite atrófica, infecção por *Helicobacter pylori*, cirurgia bariátrica — e interferência laboratorial por biotina ou anticorpos heterófilos.',
      ],
      interpretacao: [
        '**Alvo de TSH:** faixa de referência do laboratório na maioria dos casos; 0,5 a 2,5 mU/L na gestação (primeiro trimestre) e em quem planeja engravidar; alvo mais frouxo (4 a 6 mU/L) em idosos acima de 70 a 80 anos, em quem sobretratar aumenta risco de fibrilação atrial e fratura.',
        '**Absorção:** tome em jejum, 30 a 60 minutos antes do café, ou ao deitar 3 horas após a última refeição. Cálcio, ferro, inibidores de bomba de prótons, sucralfato, colestiramina, sevelâmer, soja e café reduzem a absorção — espace pelo menos 4 horas.',
        'Hipotireoidismo subclínico (TSH elevado com T4 livre normal): trate se TSH acima de 10 mU/L, se houver anticorpo antitireoperoxidase positivo com sintomas, se houver bócio, ou em gestação e planejamento de gestação. Entre 4 e 10 mU/L em idoso assintomático, a observação costuma ser a melhor conduta.',
      ],
      alertas: ['Coma mixedematoso é emergência: levotiroxina endovenosa em dose de ataque (200 a 400 µg), hidrocortisona **antes** do hormônio tireoidiano (para não precipitar crise adrenal), aquecimento passivo e tratamento do fator precipitante.'],
    }
  },
  formula: [
    'Reposição plena: 1,6 µg/kg/dia de levotiroxina',
    'Levotiroxina 100 µg ≈ liotironina 25 µg ≈ 60 a 65 mg de tireoide dessecada',
    'Índice de tiroxina livre = T4 total × captação de T3 em resina / 30',
  ],
  fundamento:
    'A tireoide secreta predominantemente T4, que funciona como pró-hormônio: as deiodinases tipo 1 e 2 o convertem em T3, o hormônio ativo, em cada tecido conforme a necessidade local. Repor apenas T4 preserva esse mecanismo regulatório — é a razão farmacológica de a levotiroxina isolada ser o padrão, apesar de a tireoide fisiológica secretar também alguma quantidade de T3. A levotiroxina funciona como pró-hormônio: cerca de 80% do T3 circulante vem da **desiodação periférica do T4** pelas desiodases tipo 1 e 2, em fígado, rim, músculo, tecido adiposo, hipófise e sistema nervoso central. Essa conversão local é regulada tecido a tecido, o que permite ao organismo ajustar a disponibilidade de hormônio ativo em cada órgão — e é a razão pela qual repor apenas T4 reproduz a fisiologia melhor do que impor picos exógenos de T3, além de explicar a meia-vida longa de cerca de 7 dias e o intervalo de 6 a 8 semanas para novo equilíbrio.',
  armadilhas: [
    'Não ajuste a dose antes de 6 semanas: o TSH tem inércia e ajustes precipitados geram oscilação.',
    'Síndrome do doente eutireóideo (T3 baixo, TSH normal ou baixo, em paciente crítico) **não** deve ser tratada. É adaptação, não doença — e a reposição não melhora desfechos.',
  ],
  referencias: [
    { texto: 'Jonklaas J, Bianco AC, Bauer AJ, et al. Guidelines for the treatment of hypothyroidism. Thyroid. 2014;24(12):1670-1751.' },
    { texto: 'Alexander EK, Pearce EN, Brent GA, et al. 2017 Guidelines of the American Thyroid Association for the diagnosis and management of thyroid disease during pregnancy and the postpartum. Thyroid. 2017;27(3):315-389.' },
  ],
}

export const ferramentas: Ferramenta[] = [imcFerramenta, pesoIdeal, homa, hba1c, cetoacidose, insulina, findrisc, corticoides, tireoide]

export default ferramentas
