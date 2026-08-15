import type { Marcador } from '../tipos'

/**
 * Coagulação.
 *
 * O coagulograma é lido como um mapa: cada tempo cobre um trecho da cascata, e
 * é a combinação de qual alargou e qual permaneceu normal que localiza o
 * problema. TP isolado alargado aponta a via extrínseca (fator VII, o mais
 * frágil); TTPa isolado aponta a via intrínseca; ambos alargados apontam a via
 * comum, consumo ou anticoagulação. O TP/INR está com o painel hepático, onde
 * ele é sobretudo marcador de função sintética.
 */
export const marcadores: Marcador[] = [
  {
    id: 'ttpa',
    nome: 'Tempo de tromboplastina parcial ativada',
    sigla: 'TTPa',
    sinonimos: ['ttpa', 'kptt', 'aptt', 'tempo de tromboplastina parcial'],
    grupo: 'coagulacao',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    unidade: 'segundos',
    referencias: [{ rotulo: 'Adultos', minimo: 25, maximo: 35, unidade: 'segundos', observacao: 'A faixa varia com o reagente; a relação paciente/controle é mais comparável entre laboratórios.' }],
    resumo: 'Avalia a via intrínseca e comum da coagulação. Alarga na hemofilia, na heparina não fracionada e na presença de inibidores.',
    entenda:
      'O TTPa depende dos fatores XII, XI, IX, VIII, X, V, II e do fibrinogênio. Diante de um TTPa alargado, o primeiro passo é o teste de mistura: se o plasma normal corrige, falta fator; se não corrige, existe um inibidor. Essa bifurcação separa hemofilia (corrige) de anticoagulante lúpico e inibidor adquirido de fator VIII (não corrigem) — três diagnósticos com condutas completamente distintas, e o teste de mistura custa quase nada.',
    aprofundar: [
      'O anticoagulante lúpico produz um paradoxo instrutivo: alarga o TTPa in vitro por interferir nos fosfolipídios do reagente, mas in vivo associa-se a trombose, não a sangramento. Um TTPa alargado descoberto no pré-operatório de um paciente sem história hemorrágica, que não corrige no teste de mistura, deve levantar síndrome antifosfolípide — e não adiar cirurgia por medo de sangramento.',
      'A deficiência de fator XII também alarga o TTPa e não causa sangramento algum: o fator XII é dispensável para a hemostasia in vivo. É achado laboratorial sem tradução clínica, e reconhecê-lo evita investigação e transfusão desnecessárias.',
    ],
    fisiologia: {
      oQueE: 'Tempo de coagulação do plasma após ativação por contato, na presença de fosfolipídios e cálcio.',
      origem: 'Reflete a atividade dos fatores da via intrínseca e comum, sintetizados no fígado.',
      funcao: 'Nenhuma — é um teste funcional da cascata.',
      percurso: ['Ativação por contato (XII)', 'XI → IX → VIII', 'via comum: X → V → II (trombina)', 'fibrinogênio → fibrina'],
    },
    aumento: {
      resumo: 'Heparina, deficiência de fatores, inibidores, hepatopatia, deficiência de vitamina K e CIVD.',
      mecanismos: [
        {
          titulo: 'Anticoagulação',
          explicacao: 'A heparina potencializa a antitrombina, que inibe a trombina e o fator Xa.',
          exemplos: [{ causa: 'Heparina não fracionada', etapas: ['antitrombina potencializada', 'inibição de trombina e fator Xa', 'TTPa alargado — usado para monitorar a dose'], nota: 'A heparina de baixo peso molecular praticamente não altera o TTPa: monitora-se por anti-Xa, quando necessário.' }],
        },
        {
          titulo: 'Deficiência de fatores',
          explicacao: 'Falta um componente da via, e o teste corrige com plasma normal.',
          exemplos: [
            { causa: 'Hemofilia A (fator VIII) e B (fator IX)', etapas: ['deficiência congênita', 'TTPa alargado com TP normal', 'hemartroses e sangramento muscular'], nota: 'Corrige no teste de mistura — é o que separa deficiência de inibidor.' },
            { causa: 'Doença de von Willebrand', etapas: ['fator de von Willebrand ↓', 'fator VIII carreado por ele também ↓', 'TTPa pode alargar com sangramento mucocutâneo'], nota: 'É a coagulopatia hereditária mais comum e frequentemente cursa com TTPa normal.' },
            { causa: 'Deficiência de fator XII', etapas: ['ativação por contato comprometida no tubo de ensaio', 'TTPa alargado', 'hemostasia in vivo intacta — o fator XII é dispensável para ela'], nota: 'Achado laboratorial sem tradução clínica: não causa sangramento. Reconhecê-lo evita investigação e transfusão desnecessárias.' },
          ],
        },
        {
          titulo: 'Inibidores',
          explicacao: 'Um anticorpo interfere no teste ou neutraliza um fator; o plasma normal não corrige.',
          exemplos: [
            { causa: 'Anticoagulante lúpico', etapas: ['anticorpo antifosfolípide interfere no reagente', 'TTPa alargado in vitro', 'risco trombótico in vivo'], nota: 'Paradoxo clássico: alarga o exame e causa trombose.' },
            { causa: 'Inibidor adquirido de fator VIII (hemofilia adquirida)', etapas: ['autoanticorpo neutraliza o fator VIII', 'TTPa alargado que não corrige', 'sangramento grave em idoso sem história prévia'], nota: 'Emergência hematológica.' },
          ],
        },
        {
          titulo: 'Falência de síntese e consumo',
          explicacao: 'O fígado não produz ou os fatores são consumidos.',
          exemplos: [{ causa: 'Hepatopatia, deficiência de vitamina K, CIVD', etapas: ['síntese ↓ ou consumo ↑', 'TTPa e TP alargados juntos'] }],
        },
      ],
    },
    reducao: { resumo: 'TTPa curto costuma ser artefato de coleta; não indica hipercoagulabilidade de forma confiável.', mecanismos: [] },
    relacionados: [
      { titulo: 'Localizar o defeito', ids: ['inr', 'fibrinogenio', 'plaquetas'], leitura: 'TTPa isolado: via intrínseca. TP isolado: via extrínseca. Ambos: via comum, consumo, hepatopatia ou anticoagulação.' },
      { titulo: 'Se houver consumo', ids: ['d-dimero', 'fibrinogenio', 'plaquetas'], leitura: 'TTPa e TP alargados com fibrinogênio baixo, plaquetopenia e D-dímero muito alto caracterizam CIVD.' },
    ],
    interferentes: {
      preAnalitico: ['Tubo de citrato mal preenchido, coleta em acesso heparinizado e hematócrito muito alto alargam falsamente.'],
      medicamentos: ['Heparina não fracionada, argatrobana e dabigatrana alargam; a varfarina alarga mais o TP que o TTPa.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['inr', 'fibrinogenio', 'plaquetas', 'd-dimero'],
  },

  {
    id: 'fibrinogenio',
    nome: 'Fibrinogênio',
    sinonimos: ['fator i', 'fibrinogenio plasmatico'],
    grupo: 'coagulacao',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 200, maximo: 400, unidade: 'mg/dL' }],
    resumo: 'O substrato final da coagulação e um reagente de fase aguda. Sobe na inflamação e cai no consumo — e é essa dupla natureza que o torna informativo na CIVD.',
    entenda:
      'O fibrinogênio é convertido em fibrina pela trombina, formando a rede que estabiliza o coágulo. Por ser reagente de fase aguda, ele sobe em qualquer inflamação — o que significa que, numa sepse com CIVD instalada, um fibrinogênio "normal" pode representar queda importante em relação ao valor esperado. Por isso, na suspeita de CIVD, a tendência de dosagens seriadas vale mais que um valor isolado.',
    fisiologia: {
      oQueE: 'Glicoproteína plasmática de 340 kDa, o fator I da coagulação.',
      origem: 'Fígado.',
      funcao: 'Precursor da fibrina; participa também da agregação plaquetária ligando-se ao receptor GPIIb/IIIa.',
      meiaVida: '3 a 5 dias.',
      percurso: ['Fibrinogênio plasmático', 'trombina cliva', 'monômeros de fibrina', 'polimerização e estabilização pelo fator XIII', 'coágulo'],
    },
    aumento: {
      resumo: 'Inflamação, infecção, gestação, tabagismo e neoplasia.',
      mecanismos: [{ titulo: 'Fase aguda', explicacao: 'A IL-6 induz sua síntese hepática.', exemplos: [{ causa: 'Infecção, inflamação, gestação, neoplasia', etapas: ['IL-6 ↑', 'síntese hepática ↑', 'fibrinogênio ↑ e VHS ↑ por consequência'], nota: 'É o principal determinante do VHS elevado.' }] }],
    },
    reducao: {
      resumo: 'Consumo (CIVD, hemorragia maciça), falência de síntese (hepatopatia), fibrinólise ou deficiência congênita.',
      mecanismos: [
        { titulo: 'Consumo', explicacao: 'A coagulação sistêmica gasta o fibrinogênio mais rápido do que o fígado o repõe.', exemplos: [{ causa: 'CIVD, descolamento prematuro de placenta, embolia amniótica, hemorragia maciça', etapas: ['ativação sistêmica da coagulação', 'consumo de fibrinogênio e fatores', 'fibrinogênio ↓ com D-dímero ↑↑'], nota: 'Fibrinogênio abaixo de 100 mg/dL em sangramento maciço indica reposição (crioprecipitado ou concentrado).' }] },
        { titulo: 'Síntese reduzida ou fibrinólise', explicacao: 'O fígado não produz, ou a plasmina degrada.', exemplos: [{ causa: 'Insuficiência hepática, terapia trombolítica, L-asparaginase, afibrinogenemia congênita', etapas: ['síntese ↓ ou degradação ↑', 'fibrinogênio ↓'] }] },
      ],
    },
    relacionados: [{ titulo: 'Na suspeita de CIVD', ids: ['d-dimero', 'plaquetas', 'inr', 'ttpa'], leitura: 'Fibrinogênio em queda com plaquetopenia, D-dímero muito alto e tempos alargados é o quadro completo — nenhum critério isolado fecha o diagnóstico.' }],
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['d-dimero', 'plaquetas', 'ttpa', 'inr'],
  },

  {
    id: 'd-dimero',
    nome: 'D-dímero',
    sinonimos: ['d dimero', 'ddimero', 'produtos de degradacao da fibrina'],
    grupo: 'coagulacao',
    sistemas: ['hematologico', 'cardiovascular'],
    material: 'Plasma citratado',
    unidade: 'ng/mL FEU',
    referencias: [
      { rotulo: 'Corte convencional', texto: '< 500', unidade: 'ng/mL FEU' },
      { rotulo: 'Corte ajustado por idade (> 50 anos)', texto: 'idade × 10', unidade: 'ng/mL FEU', observacao: 'Aumenta a especificidade em idosos sem perder sensibilidade — reduz exames de imagem desnecessários.' },
    ],
    resumo:
      'Produto de degradação da fibrina já formada e estabilizada. Um exame de exclusão: excelente para descartar trombose, ruim para confirmá-la.',
    entenda:
      'O D-dímero só existe se houve formação de fibrina reticulada e subsequente lise pela plasmina — ou seja, se houve coágulo e fibrinólise. Isso o torna muito sensível: valor normal em paciente com probabilidade clínica baixa ou intermediária afasta trombose venosa profunda e embolia pulmonar com segurança. Mas é pouquíssimo específico: infecção, câncer, gestação, cirurgia, trauma, idade avançada e internação elevam. Pedir D-dímero em paciente de alta probabilidade é erro de estratégia — nesse caso vai-se direto à imagem.',
    fisiologia: {
      oQueE: 'Fragmento resultante da degradação da fibrina reticulada pela plasmina.',
      origem: 'Qualquer sítio de formação e lise de coágulo no organismo.',
      funcao: 'Nenhuma — é resíduo do processo de fibrinólise.',
      meiaVida: 'Cerca de 8 horas.',
      percurso: ['Trombina forma fibrina', 'fator XIII reticula', 'plasmina degrada a fibrina reticulada', 'D-dímero no plasma'],
    },
    aumento: {
      resumo: 'Trombose, mas também qualquer estado com formação e lise de fibrina — que é quase toda condição inflamatória ou pós-operatória.',
      mecanismos: [
        {
          titulo: 'Trombose',
          explicacao: 'O trombo formado é parcialmente lisado, liberando D-dímero.',
          exemplos: [
            { causa: 'Trombose venosa profunda e embolia pulmonar', etapas: ['formação do trombo', 'fibrinólise endógena parcial', 'D-dímero ↑'], nota: 'Valor normal com probabilidade clínica não alta exclui — é assim que o exame deve ser usado.' },
            { causa: 'CIVD', etapas: ['coagulação e fibrinólise sistêmicas', 'D-dímero ↑↑ com fibrinogênio ↓ e plaquetas ↓'] },
            { causa: 'Dissecção de aorta', etapas: ['formação de trombo na falsa luz', 'D-dímero ↑ precocemente'], nota: 'Valor normal reduz — mas não elimina — a probabilidade de dissecção.' },
          ],
        },
        {
          titulo: 'Elevações não trombóticas',
          explicacao: 'Qualquer processo com deposição e lise local de fibrina eleva.',
          exemplos: [{ causa: 'Infecção, sepse, neoplasia, gestação, pós-operatório, trauma, hepatopatia, idade avançada, internação prolongada', etapas: ['ativação inflamatória da coagulação', 'D-dímero ↑ sem trombose'], nota: 'Por isso o exame é de exclusão: seu poder está no resultado negativo.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Na suspeita de tromboembolismo', ids: ['troponina', 'bnp'], leitura: 'Confirmada a embolia, troponina e BNP estratificam risco por indicarem sobrecarga do ventrículo direito.' }],
    interferentes: {
      fisiologico: ['Idade, gestação (sobe progressivamente e torna o exame pouco útil no 3º trimestre), pós-operatório e internação elevam.'],
      metodo: ['Unidades variam entre laboratórios (FEU × unidades de D-dímero) — comparar valores exige conferir a unidade.'],
    },
    utilidade: ['triagem', 'diagnostico'],
    estudarTambem: ['fibrinogenio', 'plaquetas', 'troponina'],
  },

  {
    id: 'tempo-trombina',
    nome: 'Tempo de trombina',
    sigla: 'TT',
    sinonimos: ['tt', 'tempo de trombina'],
    grupo: 'coagulacao',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    unidade: 'segundos',
    referencias: [{ rotulo: 'Adultos', minimo: 14, maximo: 21, unidade: 'segundos' }],
    resumo: 'Avalia apenas a etapa final: a conversão de fibrinogênio em fibrina. É extremamente sensível à heparina.',
    entenda:
      'O tempo de trombina isola o último passo da cascata, contornando todos os fatores anteriores. Alarga quando o fibrinogênio está baixo ou disfuncional, quando há produtos de degradação da fibrina em excesso, e — de forma muito sensível — na presença de heparina ou de inibidores diretos da trombina. Um TT normal praticamente exclui contaminação por heparina, o que é útil quando um TTPa alargado precisa ser explicado.',
    fisiologia: {
      oQueE: 'Tempo de coagulação após adição de trombina exógena ao plasma.',
      origem: 'Mede exclusivamente a etapa fibrinogênio → fibrina.',
      funcao: 'Isolar a etapa final da cascata.',
      percurso: ['Trombina exógena adicionada', 'clivagem do fibrinogênio', 'polimerização da fibrina', 'tempo medido'],
    },
    aumento: {
      resumo: 'Heparina, inibidores diretos da trombina, hipofibrinogenemia, disfibrinogenemia e produtos de degradação.',
      mecanismos: [
        { titulo: 'Inibição da trombina', explicacao: 'Heparina e inibidores diretos bloqueiam a ação da trombina adicionada.', exemplos: [{ causa: 'Heparina (mesmo em traços), dabigatrana, argatrobana', etapas: ['trombina inibida', 'TT muito alargado'], nota: 'Sensibilidade extrema à heparina — útil para detectar contaminação da amostra por cateter heparinizado.' }] },
        { titulo: 'Fibrinogênio insuficiente ou anômalo', explicacao: 'Falta substrato ou ele é disfuncional.', exemplos: [{ causa: 'Hipofibrinogenemia, disfibrinogenemia, CIVD, hepatopatia', etapas: ['substrato ↓ ou anômalo', 'TT alargado'] }] },
      ],
    },
    relacionados: [{ titulo: 'Para explicar um TTPa alargado', ids: ['ttpa', 'fibrinogenio'], leitura: 'TTPa alargado com TT normal afasta heparina e aponta deficiência de fator ou inibidor.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['ttpa', 'fibrinogenio'],
  },

  {
    id: 'antitrombina',
    nome: 'Antitrombina, proteína C e proteína S',
    sinonimos: ['antitrombina iii', 'proteina c', 'proteina s', 'trombofilia'],
    grupo: 'coagulacao',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    unidade: '%',
    referencias: [{ rotulo: 'Atividade — adultos', minimo: 70, maximo: 130, unidade: '%', observacao: 'Não dosar durante evento trombótico agudo, em uso de anticoagulante ou na gestação: os valores estarão alterados por consumo ou por efeito do fármaco.' }],
    resumo: 'Os anticoagulantes naturais do plasma. Sua deficiência causa trombofilia hereditária — e o momento da dosagem determina se o resultado tem algum valor.',
    entenda:
      'A antitrombina inibe a trombina e o fator Xa (e é o alvo da heparina, que a potencializa em mil vezes). As proteínas C e S formam um sistema dependente de vitamina K que inativa os fatores Va e VIIIa. Deficiências hereditárias predispõem a trombose venosa. O ponto prático mais importante é o timing: dosar durante trombose aguda, em uso de heparina (que consome antitrombina) ou de varfarina (que reduz proteínas C e S) produz resultados falsamente baixos e diagnósticos errados de trombofilia.',
    aprofundar: [
      'A proteína C tem meia-vida curta, o que explica a necrose cutânea induzida por varfarina: ao iniciar o fármaco, a proteína C cai antes dos fatores procoagulantes, criando um estado transitoriamente pró-trombótico. É a razão pela qual a varfarina é iniciada sob cobertura de heparina.',
      'Investigar trombofilia hereditária raramente muda a conduta imediata: a decisão sobre duração da anticoagulação depende sobretudo de o evento ter sido provocado ou não provocado. A investigação faz mais sentido em trombose em sítio atípico, em jovens, com forte história familiar, ou quando o resultado influenciará o aconselhamento de familiares — e sempre fora do evento agudo e longe do anticoagulante.',
    ],
    fisiologia: {
      oQueE: 'Antitrombina: serpina inibidora de trombina e fator Xa. Proteínas C e S: sistema anticoagulante dependente de vitamina K.',
      origem: 'Fígado (as três); o endotélio ativa a proteína C via trombomodulina.',
      funcao: 'Limitar a extensão do coágulo ao sítio da lesão, impedindo a coagulação sistêmica.',
      percurso: ['Trombina liga-se à trombomodulina endotelial', 'ativa a proteína C', 'proteína C ativada + proteína S', 'inativação dos fatores Va e VIIIa', 'coagulação contida'],
    },
    aumento: { resumo: 'Sem relevância clínica.', mecanismos: [] },
    reducao: {
      resumo: 'Deficiência hereditária, consumo em trombose ou CIVD, hepatopatia, síndrome nefrótica e efeito de anticoagulantes.',
      mecanismos: [
        { titulo: 'Deficiência hereditária', explicacao: 'Mutação reduz a produção ou a função do inibidor.', exemplos: [{ causa: 'Deficiência de antitrombina, de proteína C ou de proteína S', etapas: ['inibição insuficiente da cascata', 'trombose venosa recorrente, muitas vezes em jovens'], nota: 'A deficiência de antitrombina causa também resistência à heparina, que precisa dela para agir.' }] },
        { titulo: 'Causas adquiridas', explicacao: 'Consumo, perda ou falha de síntese.', exemplos: [{ causa: 'Trombose aguda, CIVD, sepse, hepatopatia, síndrome nefrótica (perde antitrombina na urina), varfarina, gestação, anticoncepcional', etapas: ['consumo, perda ou síntese ↓', 'níveis falsamente baixos'], nota: 'É por isso que a investigação de trombofilia não se faz no momento agudo nem sob anticoagulação.' }] },
      ],
    },
    relacionados: [{ titulo: 'Na investigação de trombofilia', ids: ['ttpa', 'd-dimero'], leitura: 'O anticoagulante lúpico (que alarga o TTPa e não corrige na mistura) é a trombofilia adquirida mais relevante e deve ser investigado junto.' }],
    interferentes: { medicamentos: ['Heparina reduz a antitrombina; varfarina reduz as proteínas C e S. A dosagem deve ser feita fora do uso.'] },
    utilidade: ['diagnostico'],
    estudarTambem: ['ttpa', 'inr', 'd-dimero'],
  },
]
