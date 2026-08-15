import type { Marcador } from '../tipos'

/**
 * Diabetes e metabolismo glicídico.
 *
 * Três exames medem a mesma coisa em três janelas de tempo diferentes:
 * a glicemia mede agora, a frutosamina mede as últimas 2 a 3 semanas, a
 * hemoglobina glicada mede os últimos 2 a 3 meses. Quando eles discordam, a
 * discordância é a informação — e quase sempre aponta para algo que alterou a
 * sobrevida da hemácia, não para erro do laboratório.
 */
export const marcadores: Marcador[] = [
  {
    id: 'glicemia-jejum',
    nome: 'Glicemia de jejum',
    sinonimos: ['glicemia', 'glicose', 'glicose de jejum', 'glicemia plasmatica'],
    grupo: 'glicemia',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Plasma com fluoreto, jejum de 8 horas',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Normal', minimo: 70, maximo: 99, unidade: 'mg/dL' },
      { rotulo: 'Glicemia de jejum alterada (pré-diabetes)', texto: '100 a 125', unidade: 'mg/dL' },
      { rotulo: 'Diabetes', texto: '≥ 126 em duas ocasiões', unidade: 'mg/dL', observacao: 'Ou glicemia casual ≥ 200 mg/dL com sintomas clássicos.' },
    ],
    resumo: 'A glicose plasmática naquele instante. É a base do diagnóstico de diabetes e o exame que define hipoglicemia.',
    entenda:
      'A glicemia de jejum reflete sobretudo a produção hepática de glicose durante a noite, controlada pela insulina basal. Quando a resistência hepática à insulina aumenta, a gliconeogênese não é suprimida e a glicemia de jejum sobe — é o primeiro parâmetro a se alterar em muitos pacientes. Já a glicemia pós-prandial reflete a capacidade de captação periférica e a secreção rápida de insulina, e pode estar alterada com jejum normal.',
    aprofundar: [
      'A glicólise continua dentro do tubo depois da coleta: em tubo sem inibidor, a glicose cai de 5 a 7% por hora à temperatura ambiente. Isso significa que uma amostra que demorou a ser processada pode transformar um diabético em normal. O tubo com fluoreto de sódio inibe a enolase e reduz esse efeito, mas mesmo ele não impede a queda na primeira hora — daí a recomendação de tubos com acidificante ou processamento rápido. É um erro pré-analítico com consequência diagnóstica direta.',
      'O diagnóstico de diabetes pode ser feito por glicemia de jejum, hemoglobina glicada, teste de tolerância à glicose ou glicemia casual com sintomas. Eles não são intercambiáveis: identificam populações parcialmente diferentes. Em pessoas com hemoglobinopatia, anemia ou doença renal, a glicada perde confiabilidade e a glicemia manda. Em quem tem glicemia de jejum normal mas alto risco, o teste de tolerância pode revelar diabetes que os outros perderiam.',
    ],
    fisiologia: {
      oQueE: 'Monossacarídeo que é o principal substrato energético circulante.',
      origem: 'Dieta, glicogenólise e gliconeogênese hepática (e, em jejum prolongado, renal).',
      funcao: 'Fonte energética obrigatória para o cérebro, as hemácias e a medula renal.',
      metabolismo: 'Captação insulino-dependente (músculo e tecido adiposo, via GLUT4) e insulino-independente (cérebro, hemácia, fígado).',
      orgaosEnvolvidos: ['Pâncreas', 'Fígado', 'Músculo', 'Tecido adiposo', 'Rim'],
      percurso: ['Refeição ou produção hepática', 'glicose plasmática', 'insulina das células beta', 'captação por GLUT4 no músculo e adipócito', 'glicemia normaliza'],
    },
    aumento: {
      resumo: 'Diabetes, estresse agudo, medicamentos, endocrinopatias e doença pancreática.',
      mecanismos: [
        {
          titulo: 'Resistência à insulina',
          explicacao: 'O tecido responde menos à insulina; o fígado não suprime a produção de glicose e o músculo não a capta adequadamente.',
          exemplos: [{ causa: 'Diabetes tipo 2, obesidade visceral, síndrome metabólica', etapas: ['resistência periférica e hepática', 'produção hepática de glicose não suprimida', 'glicemia de jejum ↑', 'células beta compensam até se esgotarem'], nota: 'A insulina pode estar alta por anos antes de a glicemia subir — a falência beta é o que revela o diabetes.' }],
        },
        {
          titulo: 'Deficiência de insulina',
          explicacao: 'Sem insulina, não há freio à lipólise nem à produção hepática de glicose.',
          exemplos: [{ causa: 'Diabetes tipo 1, pancreatite crônica, pancreatectomia, fibrose cística', etapas: ['destruição ou perda das células beta', 'insulina ↓', 'hiperglicemia e cetogênese', 'risco de cetoacidose'] }],
        },
        {
          titulo: 'Hormônios contrarreguladores e medicamentos',
          explicacao: 'Cortisol, GH, glucagon e catecolaminas antagonizam a insulina.',
          exemplos: [
            { causa: 'Síndrome de Cushing, acromegalia, feocromocitoma, hipertireoidismo', etapas: ['hormônios contrarreguladores ↑', 'resistência à insulina', 'hiperglicemia'] },
            { causa: 'Corticoides, tiazídicos, antipsicóticos atípicos, tacrolimo, antirretrovirais', etapas: ['resistência à insulina ou secreção ↓', 'hiperglicemia medicamentosa'], nota: 'Hiperglicemia por corticoide é predominantemente pós-prandial — a glicemia de jejum pode enganar.' },
            { causa: 'Estresse agudo (sepse, infarto, trauma, cirurgia)', etapas: ['catecolaminas e cortisol ↑', 'hiperglicemia de estresse'], nota: 'Não diagnostica diabetes: exige confirmação após a recuperação, com glicada.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Diabetes tipo 2', 'Corticoterapia', 'Hiperglicemia de estresse'],
        comuns: ['Diabetes tipo 1', 'Pancreatite crônica', 'Antipsicóticos atípicos'],
        menosComuns: ['Cushing', 'Acromegalia', 'Feocromocitoma'],
        emergencias: ['Cetoacidose diabética', 'Estado hiperglicêmico hiperosmolar'],
      },
    },
    reducao: {
      resumo: 'Hipoglicemia: medicamentos (a causa dominante), jejum com doença grave, insulinoma, insuficiência adrenal ou hepática.',
      significado:
        'Hipoglicemia é sempre relevante clinicamente: o cérebro depende de glicose contínua. A tríade de Whipple — sintomas, glicemia baixa documentada e melhora com a correção — é o que define o quadro como verdadeiro.',
      mecanismos: [
        {
          titulo: 'Excesso de insulina ou de secretagogos',
          explicacao: 'A insulina suprime a produção hepática de glicose e aumenta a captação periférica.',
          exemplos: [
            { causa: 'Insulina ou sulfonilureia em excesso', etapas: ['ação hipoglicemiante desproporcional à ingesta', 'glicemia ↓'], nota: 'É, de longe, a causa mais comum. Risco maior em idosos, na doença renal e no jejum.' },
            { causa: 'Insulinoma', etapas: ['secreção autônoma de insulina', 'hipoglicemia de jejum com insulina e peptídeo C altos'], nota: 'Peptídeo C alto separa insulinoma de insulina exógena, em que ele está suprimido.' },
          ],
        },
        {
          titulo: 'Produção hepática insuficiente',
          explicacao: 'Falta substrato, falta fígado ou faltam hormônios contrarreguladores.',
          exemplos: [
            { causa: 'Insuficiência hepática, insuficiência adrenal, desnutrição, sepse, alcoolismo', etapas: ['gliconeogênese e glicogenólise comprometidas', 'hipoglicemia'], nota: 'A hipoglicemia alcoólica ocorre por bloqueio da gliconeogênese em paciente com estoque de glicogênio esgotado.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para diagnóstico e controle', ids: ['hba1c', 'insulina', 'peptideo-c'], leitura: 'A glicada dá a média de 3 meses; insulina e peptídeo C separam deficiência de resistência e insulina exógena de endógena.' },
      { titulo: 'Na descompensação aguda', ids: ['bicarbonato', 'potassio', 'sodio', 'anion-gap'], leitura: 'Hiperglicemia com acidose e ânion gap alto é cetoacidose; sem acidose e com osmolalidade muito alta, estado hiperosmolar.' },
    ],
    interferentes: {
      preAnalitico: ['Sem inibidor da glicólise, a glicose cai 5 a 7% por hora — subestimando o resultado.', 'Jejum inadequado ou prolongado demais altera o valor.'],
      fisiologico: ['Estresse, dor, infecção e gestação alteram.'],
      medicamentos: ['Corticoides, tiazídicos, antipsicóticos, tacrolimo e beta-agonistas elevam; insulina, sulfonilureias, álcool e betabloqueadores reduzem (e os betabloqueadores ainda mascaram os sintomas adrenérgicos).'],
    },
    utilidade: ['diagnostico', 'rastreamento', 'acompanhamento'],
    padroes: ['cetoacidose-diabetica'],
    estudarTambem: ['hba1c', 'insulina', 'peptideo-c', 'bicarbonato'],
  },

  {
    id: 'hba1c',
    nome: 'Hemoglobina glicada',
    sigla: 'HbA1c',
    sinonimos: ['hemoglobina glicosilada', 'a1c', 'hba1c'],
    grupo: 'glicemia',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Sangue total com EDTA',
    unidade: '%',
    referencias: [
      { rotulo: 'Normal', texto: '< 5,7', unidade: '%' },
      { rotulo: 'Pré-diabetes', texto: '5,7 a 6,4', unidade: '%' },
      { rotulo: 'Diabetes', texto: '≥ 6,5', unidade: '%' },
      { rotulo: 'Meta usual no tratamento', texto: '< 7,0 (individualizar)', unidade: '%', observacao: 'Metas menos rígidas em idosos, em risco de hipoglicemia e com comorbidades avançadas.' },
    ],
    resumo:
      'A fração de hemoglobina que sofreu glicação não enzimática. Reflete a glicemia média dos últimos 2 a 3 meses — desde que a hemácia viva o tempo esperado.',
    entenda:
      'A glicose liga-se de forma lenta e irreversível à hemoglobina, em proporção à sua concentração. Como a hemácia vive cerca de 120 dias, a HbA1c integra a exposição glicêmica desse período — com peso maior para as últimas semanas (os 30 dias mais recentes respondem por cerca de metade do valor). Essa dependência da sobrevida eritrocitária é sua principal limitação: tudo que encurta a vida da hemácia reduz falsamente a glicada, e tudo que a prolonga a eleva.',
    aprofundar: [
      'Os cenários em que a HbA1c mente são previsíveis. Ela vem falsamente baixa quando a hemácia vive menos ou é diluída por células novas: hemólise, sangramento recente, transfusão, gestação, esplenomegalia, uso de eritropoetina e reposição de ferro em ferropenia (que produz uma safra de hemácias jovens). Vem falsamente alta quando a hemácia vive mais: ferropenia não tratada, deficiência de B12, esplenectomia. Hemoglobinopatias e uremia interferem em alguns métodos. Sempre que a glicada discordar da glicemia e do monitoramento capilar, é ela que deve ser questionada.',
      'A relação entre HbA1c e glicemia média estimada é aproximadamente linear: 6% corresponde a cerca de 126 mg/dL, e cada 1% adicional soma cerca de 29 mg/dL. Mas a glicada não informa variabilidade: dois pacientes com 7% podem ter perfis muito diferentes — um estável, outro alternando hipoglicemias e picos. Por isso a monitorização contínua e o tempo no alvo complementam, e não substituem, a glicada.',
    ],
    fisiologia: {
      oQueE: 'Hemoglobina A com glicose ligada de forma não enzimática ao aminoácido N-terminal da cadeia beta.',
      origem: 'Reação espontânea entre a glicose plasmática e a hemoglobina dentro da hemácia.',
      funcao: 'Nenhuma função fisiológica — é um registro cumulativo da exposição à glicose.',
      meiaVida: 'Acompanha a sobrevida da hemácia: cerca de 120 dias.',
      percurso: ['Glicose plasmática', 'difusão para a hemácia', 'glicação não enzimática e irreversível da hemoglobina', 'acúmulo proporcional ao tempo e à concentração'],
    },
    aumento: {
      resumo: 'Hiperglicemia crônica — ou situações que prolongam a vida da hemácia e falseiam o resultado para cima.',
      mecanismos: [
        { titulo: 'Exposição glicêmica aumentada', explicacao: 'Mais glicose por mais tempo significa mais glicação.', exemplos: [{ causa: 'Diabetes mal controlado', etapas: ['glicemia média ↑', 'glicação proporcional', 'HbA1c ↑', 'risco de complicações micro e macrovasculares'] }] },
        { titulo: 'Sobrevida eritrocitária aumentada', explicacao: 'A hemácia fica mais tempo exposta à glicose.', exemplos: [{ causa: 'Anemia ferropriva não tratada, deficiência de B12, esplenectomia', etapas: ['hemácias mais velhas em circulação', 'HbA1c falsamente ↑'], nota: 'Repor ferro pode reduzir a glicada em até 0,5% sem que a glicemia tenha mudado.' }] },
      ],
    },
    reducao: {
      resumo: 'Bom controle glicêmico — ou qualquer coisa que encurte a vida da hemácia.',
      mecanismos: [
        { titulo: 'Sobrevida eritrocitária reduzida', explicacao: 'Menos tempo de exposição à glicose significa menos glicação.', exemplos: [{ causa: 'Hemólise, sangramento recente, transfusão, gestação, eritropoetina, esplenomegalia', etapas: ['renovação eritrocitária acelerada', 'HbA1c falsamente ↓'], nota: 'Na gestação a glicada é sistematicamente mais baixa — o diagnóstico de diabetes gestacional usa o teste de tolerância, não a glicada.' }] },
      ],
    },
    relacionados: [
      { titulo: 'Quando discordar da glicemia', ids: ['hemoglobina', 'vcm', 'ferritina', 'reticulocitos', 'frutosamina'], leitura: 'Discordância entre glicada e glicemia pede avaliação do hemograma. A frutosamina, que não depende da hemácia, é a alternativa nesses casos.' },
    ],
    interferentes: {
      fisiologico: ['Gestação, altitude e etnia influenciam discretamente.'],
      metodo: ['Hemoglobinopatias (HbS, HbC, HbE), uremia e hipertrigliceridemia interferem em alguns métodos — a cromatografia líquida de alta performance identifica variantes.'],
    },
    cinetica: { tendencia: 'Após mudança terapêutica, a glicada leva de 8 a 12 semanas para refletir o novo patamar — repetir antes disso induz ajustes desnecessários.' },
    normalizacao: [
      { cenario: 'Diabetes descompensado', caminho: 'Controle glicêmico com dieta, atividade física e terapia farmacológica individualizada. A glicada acompanha a média — não há como baixá-la sem baixar a glicemia.', prazo: '3 meses para refletir integralmente a mudança.' },
      { cenario: 'Glicada discordante da glicemia', caminho: 'Investigar interferência (anemia, hemoglobinopatia, hemólise) antes de intensificar o tratamento — intensificar com base numa glicada falsamente alta causa hipoglicemia.', prazo: 'Imediato.' },
    ],
    utilidade: ['diagnostico', 'rastreamento', 'acompanhamento', 'prognostico'],
    estudarTambem: ['glicemia-jejum', 'frutosamina', 'hemoglobina'],
  },

  {
    id: 'insulina',
    nome: 'Insulina',
    sinonimos: ['insulinemia', 'insulina de jejum', 'homa ir'],
    grupo: 'glicemia',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Soro, em jejum',
    unidade: 'µUI/mL',
    referencias: [{ rotulo: 'Jejum', minimo: 2, maximo: 25, unidade: 'µUI/mL', observacao: 'Só se interpreta junto à glicemia da mesma amostra. O HOMA-IR combina os dois: (glicemia × insulina) ÷ 405.' }],
    resumo: 'O hormônio anabólico central. Sua dosagem só tem sentido acompanhada da glicemia — insulina alta com glicemia alta e com glicemia baixa significam coisas opostas.',
    entenda:
      'Insulina alta com glicemia normal ou alta indica resistência à insulina: o pâncreas está compensando. Insulina alta com glicemia baixa indica hiperinsulinismo — insulinoma, sulfonilureia ou insulina exógena, e o peptídeo C separa esses três. Insulina baixa com glicemia alta indica deficiência de secreção, como no diabetes tipo 1 ou na doença pancreática. É a combinação, nunca o valor isolado, que informa.',
    fisiologia: {
      oQueE: 'Hormônio peptídico de duas cadeias, derivado da clivagem da pró-insulina em insulina e peptídeo C.',
      origem: 'Células beta das ilhotas pancreáticas.',
      funcao: 'Promover a captação de glicose no músculo e no tecido adiposo, suprimir a produção hepática de glicose, inibir a lipólise e estimular a síntese proteica.',
      metabolismo: 'Sofre extração hepática de primeira passagem de 50 a 60% — motivo pelo qual o peptídeo C reflete melhor a secreção.',
      meiaVida: '4 a 6 minutos.',
      percurso: ['Glicose entra na célula beta (GLUT2)', 'ATP ↑ fecha canais de potássio', 'despolarização e influxo de cálcio', 'exocitose de insulina e peptídeo C'],
    },
    aumento: {
      resumo: 'Resistência à insulina, insulinoma, uso de secretagogos ou insulina exógena.',
      mecanismos: [
        { titulo: 'Compensação da resistência', explicacao: 'A célula beta secreta mais para vencer a resistência periférica.', exemplos: [{ causa: 'Obesidade visceral, síndrome metabólica, ovários policísticos', etapas: ['resistência periférica ↑', 'secreção compensatória ↑', 'hiperinsulinemia com glicemia ainda normal', 'HOMA-IR ↑'], nota: 'Precede o diabetes em anos.' }] },
        { titulo: 'Secreção autônoma ou aporte exógeno', explicacao: 'Insulina produzida ou administrada sem relação com a glicemia.', exemplos: [{ causa: 'Insulinoma, sulfonilureia, insulina exógena', etapas: ['hiperinsulinemia inapropriada', 'hipoglicemia'], nota: 'Peptídeo C alto: insulinoma ou sulfonilureia. Peptídeo C suprimido: insulina exógena.' }] },
      ],
    },
    reducao: {
      resumo: 'Deficiência de células beta — diabetes tipo 1, doença pancreática ou diabetes tipo 2 avançado.',
      mecanismos: [{ titulo: 'Perda de células beta', explicacao: 'A capacidade secretora se esgota ou é destruída.', exemplos: [{ causa: 'Diabetes tipo 1 (autoimune), pancreatite crônica, pancreatectomia, diabetes tipo 2 de longa data', etapas: ['massa de células beta ↓', 'insulina ↓ com glicemia ↑', 'dependência de insulina exógena'] }] }],
    },
    relacionados: [{ titulo: 'A tríade da hipoglicemia', ids: ['peptideo-c', 'glicemia-jejum'], leitura: 'Glicemia baixa com insulina alta e peptídeo C alto: insulinoma ou sulfonilureia. Com peptídeo C suprimido: insulina exógena.' }],
    interferentes: { preAnalitico: ['Deve ser colhida com a glicemia da mesma amostra; refeição recente invalida.'] },
    utilidade: ['diagnostico'],
    estudarTambem: ['peptideo-c', 'glicemia-jejum', 'hba1c'],
  },

  {
    id: 'peptideo-c',
    nome: 'Peptídeo C',
    sinonimos: ['peptideo c', 'c-peptideo', 'peptideo de conexao'],
    grupo: 'glicemia',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [{ rotulo: 'Jejum', minimo: 0.9, maximo: 4.0, unidade: 'ng/mL' }],
    resumo: 'Liberado em quantidade equimolar à insulina, mas sem extração hepática. É a medida fiel da secreção endógena — e a que desmascara insulina exógena.',
    entenda:
      'A pró-insulina é clivada em insulina e peptídeo C, em proporção de um para um. Como o peptídeo C não sofre extração hepática significativa e tem meia-vida mais longa, ele reflete a secreção pancreática melhor que a própria insulina. Duas aplicações decorrem disso: avaliar reserva de células beta (baixo no tipo 1, preservado ou alto no tipo 2) e investigar hipoglicemia — na hipoglicemia factícia por insulina, o peptídeo C está suprimido, porque a insulina veio de fora.',
    fisiologia: {
      oQueE: 'Fragmento de 31 aminoácidos que conecta as cadeias A e B na pró-insulina.',
      origem: 'Células beta pancreáticas, em quantidade equimolar à insulina.',
      funcao: 'Estruturalmente necessário ao dobramento da pró-insulina; sem atividade metabólica relevante conhecida.',
      eliminacao: 'Renal — acumula-se na doença renal crônica.',
      meiaVida: '20 a 30 minutos.',
      percurso: ['Pró-insulina', 'clivagem', 'insulina + peptídeo C em quantidades iguais', 'insulina extraída pelo fígado; peptídeo C não', 'peptídeo C reflete a secreção real'],
    },
    aumento: {
      resumo: 'Resistência à insulina, insulinoma, sulfonilureias e doença renal crônica.',
      mecanismos: [
        { titulo: 'Secreção aumentada', explicacao: 'A célula beta produz mais insulina — e mais peptídeo C junto.', exemplos: [{ causa: 'Resistência à insulina, insulinoma, sulfonilureia', etapas: ['secreção endógena ↑', 'peptídeo C ↑'] }] },
        { titulo: 'Excreção reduzida', explicacao: 'A eliminação é renal.', exemplos: [{ causa: 'Doença renal crônica', etapas: ['clearance ↓', 'peptídeo C ↑ sem hipersecreção'] }] },
      ],
    },
    reducao: {
      resumo: 'Deficiência de células beta ou supressão por insulina exógena.',
      mecanismos: [
        { titulo: 'Perda de células beta', explicacao: 'Não há produção endógena.', exemplos: [{ causa: 'Diabetes tipo 1, pancreatectomia', etapas: ['produção ↓', 'peptídeo C baixo ou indetectável'], nota: 'Ajuda a classificar o tipo de diabetes quando a clínica é ambígua.' }] },
        {
          titulo: 'Supressão fisiológica',
          explicacao: 'Insulina de fora suprime a produção endógena — e o peptídeo C, que só vem da célula beta, desaparece junto.',
          exemplos: [
            {
              causa: 'Administração de insulina exógena',
              etapas: ['insulina exógena no plasma', 'retroalimentação suprime a célula beta', 'produção de pró-insulina ↓', 'peptídeo C suprimido com insulina alta'],
              nota: 'Insulina alta com peptídeo C baixo em hipoglicemia é praticamente diagnóstico de administração exógena.',
            },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Na investigação de hipoglicemia', ids: ['insulina', 'glicemia-jejum'], leitura: 'A tríade glicemia-insulina-peptídeo C separa insulinoma, sulfonilureia e insulina exógena.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['insulina', 'glicemia-jejum'],
  },

  {
    id: 'frutosamina',
    nome: 'Frutosamina',
    sinonimos: ['proteinas glicadas', 'albumina glicada'],
    grupo: 'glicemia',
    sistemas: ['metabolico'],
    material: 'Soro',
    unidade: 'µmol/L',
    referencias: [{ rotulo: 'Adultos', minimo: 200, maximo: 285, unidade: 'µmol/L' }],
    resumo: 'Proteínas plasmáticas glicadas — sobretudo albumina. Reflete a glicemia das últimas 2 a 3 semanas e não depende da hemácia.',
    entenda:
      'A frutosamina é a alternativa à hemoglobina glicada quando esta não é confiável: hemoglobinopatias, hemólise, sangramento recente, transfusão, gestação e doença renal com uso de eritropoetina. Sua janela é mais curta (2 a 3 semanas, acompanhando a meia-vida da albumina), o que a torna útil também quando se quer avaliar rapidamente uma mudança terapêutica. Em contrapartida, perde validade quando a albumina está alterada — síndrome nefrótica, hepatopatia, desnutrição.',
    fisiologia: {
      oQueE: 'Cetoaminas formadas pela glicação não enzimática de proteínas plasmáticas, principalmente a albumina.',
      origem: 'Reação espontânea entre glicose e grupos amino das proteínas.',
      funcao: 'Marcador do controle glicêmico de curto prazo.',
      meiaVida: 'Acompanha a meia-vida da albumina: 14 a 20 dias.',
      percurso: ['Glicose plasmática', 'glicação da albumina e demais proteínas', 'frutosamina proporcional à média glicêmica de 2 a 3 semanas'],
    },
    aumento: { resumo: 'Hiperglicemia nas últimas semanas.', mecanismos: [{ titulo: 'Exposição glicêmica', explicacao: 'Mais glicose, mais glicação proteica.', exemplos: [{ causa: 'Diabetes descompensado', etapas: ['glicemia média ↑ nas últimas 2 a 3 semanas', 'frutosamina ↑'] }] }] },
    reducao: {
      resumo: 'Bom controle glicêmico — ou hipoalbuminemia e alto turnover proteico falseando para baixo.',
      mecanismos: [{ titulo: 'Turnover proteico acelerado', explicacao: 'Menos tempo de exposição das proteínas à glicose.', exemplos: [{ causa: 'Síndrome nefrótica, hepatopatia, hipertireoidismo, desnutrição', etapas: ['albumina ↓ ou turnover ↑', 'frutosamina falsamente ↓'] }] }],
    },
    relacionados: [{ titulo: 'Quando usar', ids: ['hba1c', 'albumina'], leitura: 'Use frutosamina quando a glicada não é confiável; não use quando a albumina está alterada.' }],
    utilidade: ['acompanhamento'],
    estudarTambem: ['hba1c', 'glicemia-jejum', 'albumina'],
  },

  {
    id: 'ttog',
    nome: 'Teste de tolerância à glicose',
    sigla: 'TOTG',
    sinonimos: ['curva glicemica', 'totg', 'ttog', 'curva insulinemica', 'teste oral de tolerancia a glicose'],
    grupo: 'glicemia',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Plasma, seriado após sobrecarga de 75 g de glicose',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Normal (2 horas)', texto: '< 140', unidade: 'mg/dL' },
      { rotulo: 'Tolerância diminuída (2 horas)', texto: '140 a 199', unidade: 'mg/dL' },
      { rotulo: 'Diabetes (2 horas)', texto: '≥ 200', unidade: 'mg/dL' },
      { rotulo: 'Diabetes gestacional (24 a 28 semanas)', texto: 'Jejum ≥ 92, 1h ≥ 180 ou 2h ≥ 153', unidade: 'mg/dL', observacao: 'Um único valor alterado já estabelece o diagnóstico na gestação.' },
    ],
    resumo: 'Mede a resposta a uma sobrecarga padronizada de glicose. É o exame mais sensível para detectar alteração precoce do metabolismo glicídico.',
    entenda:
      'A glicemia de jejum reflete a produção hepática; o teste de tolerância reflete a capacidade de disposição periférica e a secreção rápida de insulina. Por isso ele identifica pacientes que a glicemia de jejum e a glicada perderiam — sobretudo idosos e pessoas com resistência periférica predominante. É o padrão para o diagnóstico de diabetes gestacional, situação em que a glicada não é adequada.',
    fisiologia: {
      oQueE: 'Prova funcional dinâmica: mede a glicemia (e, opcionalmente, a insulina) antes e depois de uma sobrecarga oral de 75 g de glicose.',
      origem: 'Avalia a integração entre absorção intestinal, secreção de insulina, efeito incretínico e captação periférica.',
      funcao: 'Revelar deficiências funcionais que o jejum não mostra.',
      percurso: ['Sobrecarga de 75 g de glicose', 'absorção intestinal e resposta incretínica', 'secreção de insulina', 'captação periférica', 'glicemia de 2 horas'],
    },
    aumento: {
      resumo: 'Resposta glicêmica exagerada ou prolongada indica resistência à insulina ou secreção insuficiente.',
      mecanismos: [{ titulo: 'Disposição de glicose comprometida', explicacao: 'O músculo não capta e o fígado não suprime a produção adequadamente.', exemplos: [{ causa: 'Pré-diabetes, diabetes, diabetes gestacional', etapas: ['resistência periférica e/ou secreção de insulina insuficiente', 'glicemia de 2 horas ↑'], nota: 'Na gestação, os hormônios placentários (lactogênio placentário, cortisol, progesterona) induzem resistência fisiológica que desmascara a limitação secretora.' }] }],
    },
    relacionados: [{ titulo: 'Complementa', ids: ['glicemia-jejum', 'hba1c', 'insulina'], leitura: 'Os três identificam populações parcialmente diferentes: o TOTG é o mais sensível e o único adequado ao rastreio de diabetes gestacional.' }],
    interferentes: { preAnalitico: ['Exige jejum de 8 a 12 horas, dieta habitual sem restrição de carboidratos nos 3 dias anteriores e repouso durante o teste — restrição prévia produz falso-positivo.'] },
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['glicemia-jejum', 'hba1c', 'insulina'],
  },
]
