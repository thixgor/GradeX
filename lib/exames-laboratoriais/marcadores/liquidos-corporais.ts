import type { Marcador } from '../tipos'

/**
 * Líquidos corporais — e os cálculos que decidem conduta na beira do leito.
 *
 * Três raciocínios organizam este arquivo, e os três são comparações entre o
 * líquido e o sangue do mesmo paciente. Os critérios de Light comparam
 * proteína e LDH do derrame pleural com os do soro para separar transudato de
 * exsudato. O GASA subtrai a albumina do líquido ascítico da albumina sérica
 * para dizer se há hipertensão portal. O índice de IgG do líquor compara a
 * produção intratecal de anticorpo com a permeabilidade da barreira. Em todos,
 * o número do líquido isolado não significa nada — o par é que informa.
 *
 * A proteína total sérica abre o arquivo justamente porque é a metade sérica
 * do primeiro desses cálculos, e porque sua interpretação isolada, sem a
 * albumina ao lado, é uma das mais enganosas da bioquímica de rotina.
 */
export const marcadores: Marcador[] = [
  {
    id: 'proteinas-totais',
    nome: 'Proteínas totais e relação albumina/globulina',
    sigla: 'PT',
    sinonimos: ['proteinas totais', 'proteina total', 'relacao albumina globulina', 'globulinas'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'imunologico', 'renal'],
    material: 'Soro',
    unidade: 'g/dL',
    referencias: [
      { rotulo: 'Proteínas totais', minimo: 6.0, maximo: 8.0, unidade: 'g/dL' },
      { rotulo: 'Globulinas (proteínas totais − albumina)', minimo: 2.0, maximo: 3.5, unidade: 'g/dL' },
      { rotulo: 'Relação albumina/globulina', minimo: 1.1, maximo: 2.5, unidade: 'razão' },
    ],
    resumo:
      'A soma de albumina e globulinas — duas coisas que se movem por motivos opostos. O valor total pode estar normal com albumina despencando e globulinas subindo, e é a relação entre elas que revela isso.',
    entenda:
      'A albumina é sintetizada pelo fígado e cai na hepatopatia, na desnutrição, na perda renal ou intestinal e na inflamação. As globulinas vêm sobretudo dos plasmócitos e sobem na inflamação crônica, na hepatopatia e nas gamopatias. Numa cirrose, a albumina cai e a globulina sobe: as proteínas totais podem permanecer perfeitamente normais enquanto a doença avança. Por isso a proteína total sem a albumina ao lado é um exame quase sem informação.',
    aprofundar: [
      'A relação albumina/globulina invertida — abaixo de 1 — é um achado que merece investigação e é frequentemente ignorado. Suas causas principais são cirrose (albumina baixa com IgA policlonal alta), gamopatia monoclonal (globulina alta às custas da paraproteína), infecção crônica e doença autoimune. Uma relação invertida em paciente com anemia, dor óssea ou insuficiência renal deve levar direto à eletroforese de proteínas.',
      'Proteínas totais muito elevadas com albumina normal apontam para excesso de globulina, e o diferencial é estreito: mieloma múltiplo, macroglobulinemia de Waldenström, hepatopatia crônica, infecção crônica como HIV ou leishmaniose, e doenças autoimunes. Nesses casos, a eletroforese distingue elevação policlonal de pico monoclonal — e essa distinção muda inteiramente a investigação.',
      'A pseudo-hiperproteinemia por desidratação é a causa mais comum de proteína total alta e não é doença: a hemoconcentração eleva todas as proteínas proporcionalmente, junto com hematócrito e albumina. Reidratar e repetir resolve a questão antes de qualquer investigação hematológica.',
      'O uso de garrote prolongado durante a coleta produz hemoconcentração local e eleva as proteínas em até 10% — outro motivo para desconfiar de uma elevação isolada sem correspondência clínica.',
    ],
    fisiologia: {
      oQueE: 'Soma de todas as proteínas circulantes, predominantemente albumina e imunoglobulinas.',
      origem: 'Fígado (albumina e a maior parte das globulinas alfa e beta); plasmócitos (gamaglobulinas).',
      funcao: 'Pressão oncótica, transporte de substâncias, defesa imune, coagulação e tamponamento.',
      orgaosEnvolvidos: ['Fígado', 'Medula óssea e tecido linfoide', 'Rim', 'Intestino'],
      percurso: [
        'Síntese hepática de albumina e de globulinas de transporte',
        'síntese de imunoglobulinas por plasmócitos',
        'distribuição entre plasma e interstício',
        'catabolismo e perdas renais ou intestinais mínimas em condições normais',
      ],
    },
    aumento: {
      resumo: 'Desidratação, gamopatia monoclonal ou elevação policlonal de globulinas.',
      mecanismos: [
        {
          titulo: 'Hemoconcentração',
          explicacao: 'A perda de água plasmática eleva a concentração de todas as proteínas sem que sua massa total tenha mudado.',
          exemplos: [
            { causa: 'Desidratação e garrote prolongado', etapas: ['redução do volume plasmático', 'proteínas totais e albumina ↑ proporcionalmente', 'hematócrito também elevado', 'normalização com hidratação'] },
          ],
        },
        {
          titulo: 'Aumento das globulinas',
          explicacao: 'Produção monoclonal por um clone plasmocitário ou policlonal por estímulo antigênico crônico eleva a fração globulínica.',
          exemplos: [
            { causa: 'Mieloma múltiplo e macroglobulinemia', etapas: ['clone plasmocitário produz paraproteína', 'globulinas ↑↑ com albumina normal ou baixa', 'relação albumina/globulina invertida', 'eletroforese revela pico estreito'], nota: 'Proteína total alta com albumina baixa em paciente com anemia e dor óssea pede eletroforese sem demora.' },
            { causa: 'Cirrose, HIV, leishmaniose visceral, doença autoimune', etapas: ['estímulo antigênico crônico', 'hipergamaglobulinemia policlonal', 'gama larga na eletroforese, sem pico'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Perda renal ou intestinal, falência de síntese hepática, desnutrição ou hemodiluição.',
      mecanismos: [
        {
          titulo: 'Perda ou síntese reduzida',
          explicacao: 'Proteínas de peso intermediário escapam quando a barreira glomerular ou a mucosa intestinal falham, e faltam quando o fígado não as produz.',
          exemplos: [
            { causa: 'Síndrome nefrótica', etapas: ['proteinúria maciça', 'albumina ↓↓ e gamaglobulinas ↓', 'alfa-2 ↑ por ser grande demais para ser filtrada', 'edema e dislipidemia'] },
            { causa: 'Enteropatia perdedora de proteína', etapas: ['perda intestinal de albumina e imunoglobulinas', 'proteínas totais ↓ sem proteinúria', 'clearance de alfa-1-antitripsina fecal confirma'] },
            { causa: 'Cirrose e desnutrição', etapas: ['capacidade de síntese reduzida ou aporte insuficiente', 'albumina ↓', 'globulinas frequentemente ↑ na cirrose, mascarando o total'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A leitura obrigatória em conjunto', ids: ['albumina', 'eletroforese-proteinas', 'imunoglobulinas'], leitura: 'Proteína total sem albumina não informa. Relação albumina/globulina invertida pede eletroforese.' },
      { titulo: 'Para localizar a perda', ids: ['proteinuria', 'alfa-1-antitripsina-fecal', 'inr'], leitura: 'Proteinúria aponta o rim, alfa-1-antitripsina fecal aponta o intestino, INR alargado aponta o fígado.' },
    ],
    utilidade: ['triagem', 'diagnostico'],
    estudarTambem: ['albumina', 'eletroforese-proteinas', 'alfa-1-antitripsina-fecal'],
  },

  {
    id: 'liquido-pleural',
    nome: 'Líquido pleural e critérios de Light',
    sigla: 'Light',
    sinonimos: ['liquido pleural', 'derrame pleural', 'criterios de light', 'toracocentese', 'exsudato transudato', 'ada pleural'],
    grupo: 'liquidos',
    sistemas: ['respiratorio', 'infeccioso', 'oncologico'],
    material: 'Líquido pleural e soro colhidos simultaneamente',
    unidade: 'razões, g/dL, U/L',
    referencias: [
      { rotulo: 'Critério de Light 1 — proteína pleural/proteína sérica', texto: 'Exsudato se > 0,5', unidade: 'razão' },
      { rotulo: 'Critério de Light 2 — LDH pleural/LDH sérica', texto: 'Exsudato se > 0,6', unidade: 'razão' },
      { rotulo: 'Critério de Light 3 — LDH pleural', texto: 'Exsudato se > 2/3 do limite superior sérico', unidade: 'U/L' },
      { rotulo: 'Glicose pleural', texto: '< 60 mg/dL sugere empiema, neoplasia, tuberculose ou artrite reumatoide', unidade: 'mg/dL' },
      { rotulo: 'pH pleural', texto: '< 7,20 em derrame parapneumônico indica drenagem', unidade: '' },
      { rotulo: 'ADA pleural', texto: '> 40 U/L sugere tuberculose em contexto compatível', unidade: 'U/L' },
    ],
    resumo:
      'Um único critério de Light positivo já define exsudato — e essa é a decisão que separa "trate a insuficiência cardíaca" de "investigue o pulmão e a pleura".',
    entenda:
      'A distinção nasce da fisiologia. O transudato se forma por desequilíbrio de pressões: pressão hidrostática alta ou pressão oncótica baixa empurram líquido pobre em proteína para o espaço pleural, com a pleura íntegra. O exsudato se forma por aumento da permeabilidade ou por bloqueio da drenagem linfática: a pleura está doente, e proteínas e enzimas atravessam. Os critérios de Light medem exatamente isso — quanta proteína e quanta LDH conseguiram passar, sempre em relação ao que existe no sangue.',
    aprofundar: [
      'Os critérios de Light são muito sensíveis para exsudato — quase não deixam passar um — ao custo de classificar erroneamente como exsudato cerca de 25% dos transudatos, sobretudo em pacientes já diureticados. O diurético concentra as proteínas do líquido pleural e desloca as razões para cima. Quando o quadro clínico é inequívoco de insuficiência cardíaca e Light diz exsudato, o gradiente de albumina soro-líquido resolve: acima de 1,2 g/dL, trata-se de transudato apesar de Light. O gradiente de proteína acima de 3,1 g/dL cumpre a mesma função.',
      'O derrame parapneumônico tem uma sequência de decisão que depende do laboratório. Derrame simples, com pH acima de 7,20, glicose preservada e LDH pouco elevada, responde a antibiótico. Derrame complicado, com pH abaixo de 7,20, glicose abaixo de 40 mg/dL e LDH muito alta, exige drenagem — a inflamação já loculou e o antibiótico sozinho não resolve. O empiema, com pus franco ou bactérias visíveis, é drenagem sempre. O pH pleural precisa ser colhido em seringa heparinizada e processado como gasometria; contato com ar ou com lidocaína altera o resultado.',
      'Alguns achados apontam quase diretamente para uma etiologia. Amilase pleural elevada indica pancreatite, ruptura esofágica ou neoplasia. Triglicerídeos acima de 110 mg/dL com aspecto leitoso definem quilotórax, por lesão ou obstrução do ducto torácico. Hematócrito pleural acima de metade do sérico define hemotórax e muda a conduta para cirúrgica. Glicose muito baixa com pH muito baixo em derrame crônico sugere artrite reumatoide.',
      'A adenosina deaminase é particularmente valiosa em países de alta prevalência de tuberculose como o Brasil: valores acima de 40 U/L em derrame linfocitário de paciente jovem têm alto valor preditivo positivo, e frequentemente permitem iniciar tratamento sem biópsia pleural. O cuidado é que empiema, linfoma e artrite reumatoide também elevam a ADA.',
      'A predominância celular orienta o tempo e a causa: neutrófilos indicam processo agudo — pneumonia, embolia, pancreatite; linfócitos indicam processo crônico — tuberculose, neoplasia, linfoma; eosinófilos acima de 10% geralmente indicam ar ou sangue prévios no espaço pleural, e paradoxalmente reduzem a probabilidade de tuberculose e de neoplasia.',
    ],
    fisiologia: {
      oQueE: 'Líquido do espaço pleural, normalmente presente em pequena quantidade e renovado continuamente.',
      origem: 'Filtração a partir dos capilares da pleura parietal, com drenagem pelos linfáticos parietais.',
      funcao: 'Lubrificar o deslizamento entre as pleuras durante a respiração.',
      orgaosEnvolvidos: ['Pleura', 'Pulmão', 'Linfáticos', 'Coração'],
      percurso: [
        'Filtração capilar na pleura parietal',
        'absorção pelos linfáticos parietais',
        'equilíbrio mantém volume mínimo',
        'desequilíbrio de pressões → transudato',
        'aumento de permeabilidade ou bloqueio linfático → exsudato',
      ],
    },
    aumento: {
      resumo: 'Exsudato indica doença da própria pleura ou do pulmão adjacente; transudato indica doença sistêmica de pressões.',
      significado:
        'A classificação define o caminho da investigação: transudato é tratado pela doença de base, exsudato exige análise citológica, microbiológica e frequentemente imagem ou biópsia.',
      mecanismos: [
        {
          titulo: 'Aumento da permeabilidade ou bloqueio linfático — exsudato',
          explicacao: 'A inflamação ou a infiltração da pleura permitem a passagem de proteínas e enzimas e comprometem a drenagem linfática.',
          exemplos: [
            { causa: 'Derrame parapneumônico e empiema', etapas: ['inflamação pleural adjacente à pneumonia', 'exsudato neutrofílico', 'consumo de glicose e queda do pH pelas bactérias e neutrófilos', 'pH < 7,20 indica drenagem'] },
            { causa: 'Tuberculose pleural', etapas: ['hipersensibilidade tardia à proteína micobacteriana', 'exsudato linfocítico', 'ADA > 40 U/L', 'baciloscopia frequentemente negativa'], nota: 'A negatividade da baciloscopia não afasta — a carga bacilar no líquido é baixa.' },
            { causa: 'Neoplasia com comprometimento pleural', etapas: ['implantes pleurais e bloqueio linfático', 'exsudato frequentemente hemorrágico e linfocítico', 'citologia oncótica positiva em cerca de 60% em primeira amostra'], nota: 'Citologia negativa não exclui — repetir e considerar toracoscopia.' },
          ],
        },
        {
          titulo: 'Desequilíbrio de pressões — transudato',
          explicacao: 'A pleura está normal; o líquido se acumula por excesso de pressão hidrostática ou falta de pressão oncótica.',
          exemplos: [
            { causa: 'Insuficiência cardíaca', etapas: ['pressão hidrostática pulmonar elevada', 'filtração aumentada com pleura íntegra', 'transudato bilateral, maior à direita'], nota: 'Se diureticado, Light pode classificar como exsudato — use o gradiente de albumina.' },
            { causa: 'Cirrose com hidrotórax hepático e síndrome nefrótica', etapas: ['pressão oncótica reduzida e passagem de ascite pelo diafragma', 'transudato', 'tratamento é da doença de base'] },
          ],
        },
      ],
    },
    comparacoes: [
      {
        id: 'transudato-vs-exsudato',
        titulo: 'Transudato × exsudato × exsudato mal classificado',
        pergunta: 'Paciente com insuficiência cardíaca em uso de furosemida: Light diz exsudato. E agora?',
        hipoteses: ['Transudato', 'Exsudato verdadeiro', 'Transudato sob diurético'],
        linhas: [
          { marcador: 'Proteína pleural/sérica', celulas: ['< 0,5', '> 0,5', '> 0,5'] },
          { marcador: 'LDH pleural/sérica', celulas: ['< 0,6', '> 0,6', 'limítrofe'] },
          { marcador: 'Gradiente de albumina (soro − líquido)', celulas: ['> 1,2', '< 1,2', '> 1,2'] },
          { marcador: 'Aspecto', celulas: ['claro', 'turvo, hemorrágico ou purulento', 'claro'] },
          { marcador: 'Conduta', celulas: ['tratar doença de base', 'investigar pleura', 'tratar doença de base'] },
        ],
        leitura:
          'O gradiente de albumina resolve o principal ponto cego dos critérios de Light. O diurético concentra as proteínas do líquido e desloca as razões para cima, mas não altera o gradiente de albumina, que permanece elevado no transudato verdadeiro.',
        limites: 'O gradiente só deve ser usado quando o quadro clínico é fortemente sugestivo de transudato e apenas um critério de Light está positivo por pequena margem.',
      },
    ],
    relacionados: [
      { titulo: 'Os exames séricos que o cálculo exige', ids: ['proteinas-totais', 'ldh', 'albumina'], leitura: 'Os critérios de Light são razões: sem a coleta simultânea de sangue, não podem ser calculados.' },
      { titulo: 'A causa sistêmica por trás', ids: ['nt-probnp', 'albumina', 'creatinina'], leitura: 'NT-proBNP alto no sangue — e mesmo no líquido pleural — apoia origem cardíaca do derrame.' },
    ],
    advertencia:
      'Um único critério de Light positivo define exsudato. Em paciente diureticado com quadro típico de insuficiência cardíaca, use o gradiente de albumina antes de investigar a pleura desnecessariamente.',
    interferentes: {
      preAnalitico: ['O pH pleural exige seringa heparinizada, sem ar e sem contato com lidocaína — o mesmo cuidado de uma gasometria.', 'Punção traumática eleva proteína e LDH e simula exsudato.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['proteinas-totais', 'ldh', 'albumina', 'liquido-ascitico'],
  },

  {
    id: 'liquido-ascitico',
    nome: 'Líquido ascítico e GASA (gradiente de albumina soro-ascite)',
    sigla: 'GASA',
    sinonimos: ['liquido ascitico', 'ascite', 'gasa', 'saag', 'gradiente de albumina', 'paracentese', 'pbe', 'peritonite bacteriana espontanea'],
    grupo: 'liquidos',
    sistemas: ['hepatobiliar', 'infeccioso', 'oncologico'],
    material: 'Líquido ascítico e soro colhidos simultaneamente',
    unidade: 'g/dL e células/mm³',
    referencias: [
      { rotulo: 'GASA — hipertensão portal', texto: '≥ 1,1', unidade: 'g/dL' },
      { rotulo: 'GASA — sem hipertensão portal', texto: '< 1,1', unidade: 'g/dL' },
      { rotulo: 'Polimorfonucleares no líquido', texto: '< 250/mm³', unidade: 'células/mm³', observacao: '≥ 250 define peritonite bacteriana espontânea e indica antibiótico imediato, independentemente da cultura.' },
      { rotulo: 'Proteína total do líquido', texto: '< 1,5 g/dL identifica alto risco de peritonite bacteriana espontânea', unidade: 'g/dL' },
    ],
    resumo:
      'O GASA substituiu a classificação em transudato e exsudato porque responde melhor a pergunta que importa: há hipertensão portal? E a contagem de polimorfonucleares decide, sozinha, o início de antibiótico.',
    entenda:
      'O gradiente entre a albumina do soro e a do líquido reflete a pressão oncótica que se opõe à pressão hidrostática portal. Quando há hipertensão portal, essa pressão é alta e "espreme" para fora um líquido pobre em albumina — o gradiente fica grande, acima de 1,1 g/dL. Quando a ascite se forma por doença peritoneal (carcinomatose, tuberculose), o líquido é rico em proteína, e o gradiente fica pequeno. O GASA acerta a origem em mais de 95% dos casos, desempenho que a antiga classificação por proteína total não alcançava.',
    aprofundar: [
      'A peritonite bacteriana espontânea é a razão pela qual toda ascite nova, e toda internação de cirrótico com ascite, exige paracentese diagnóstica. O diagnóstico é feito por polimorfonucleares acima de 250/mm³ no líquido, e o antibiótico começa nesse momento — não se aguarda a cultura, que é negativa em até 40% dos casos mesmo com infecção real. A demora de horas aumenta a mortalidade de forma mensurável.',
      'A inoculação do líquido em frascos de hemocultura à beira do leito, antes de enviá-lo ao laboratório, aumenta substancialmente o rendimento da cultura. Enviar o líquido em frasco seco e cultivá-lo depois reduz a positividade — é um detalhe de coleta que muda o resultado.',
      'A peritonite bacteriana secundária, por perfuração de víscera, precisa ser separada da espontânea porque exige cirurgia. As pistas laboratoriais são: proteína total do líquido acima de 1 g/dL, glicose abaixo de 50 mg/dL, LDH do líquido acima do limite sérico e cultura polimicrobiana. A peritonite espontânea é monomicrobiana, com glicose e LDH pouco alteradas.',
      'A combinação de GASA com a proteína total do líquido refina o diagnóstico dentro do grupo com hipertensão portal. GASA alto com proteína baixa (abaixo de 2,5 g/dL) indica cirrose — o sinusoide já está capilarizado e retém proteína. GASA alto com proteína alta indica hipertensão portal pós-sinusoidal, como insuficiência cardíaca direita, pericardite constritiva ou síndrome de Budd-Chiari — o sinusoide está íntegro e deixa passar proteína.',
      'A ascite de carcinomatose peritoneal tem GASA baixo, proteína alta e citologia oncótica positiva em grande parte dos casos. Já a ascite por metástase hepática maciça pode ter GASA alto, porque ali o mecanismo é hipertensão portal por substituição do parênquima — um lembrete de que o GASA classifica o mecanismo, não a etiologia.',
    ],
    fisiologia: {
      oQueE: 'Líquido acumulado na cavidade peritoneal, com composição determinada pela pressão portal e pela integridade do peritônio.',
      origem: 'Ultrafiltração dos sinusoides hepáticos e dos capilares peritoneais.',
      funcao: 'Em condições normais, existe apenas em volume mínimo para lubrificação.',
      orgaosEnvolvidos: ['Fígado', 'Peritônio', 'Sistema porta', 'Linfáticos'],
      percurso: [
        'Hipertensão portal eleva a pressão sinusoidal',
        'linfa hepática produzida em excesso extravasa pela cápsula',
        'vasodilatação esplâncnica ativa renina-angiotensina-aldosterona',
        'retenção renal de sódio e água',
        'acúmulo de líquido pobre em albumina na cavidade',
      ],
    },
    aumento: {
      resumo: 'GASA alto indica hipertensão portal; GASA baixo indica doença peritoneal; polimorfonucleares altos indicam infecção.',
      mecanismos: [
        {
          titulo: 'Hipertensão portal — GASA ≥ 1,1',
          explicacao: 'A pressão sinusoidal elevada extravasa líquido pobre em proteína, mantendo um gradiente oncótico alto entre o soro e a ascite.',
          exemplos: [
            { causa: 'Cirrose hepática', etapas: ['fibrose e capilarização sinusoidal', 'hipertensão portal', 'GASA ≥ 1,1 com proteína do líquido < 2,5 g/dL', 'retenção renal de sódio agravando o acúmulo'] },
            { causa: 'Insuficiência cardíaca direita, pericardite constritiva, Budd-Chiari', etapas: ['hipertensão portal pós-sinusoidal', 'sinusoide íntegro deixa passar proteína', 'GASA ≥ 1,1 com proteína do líquido alta'], nota: 'A proteína alta é o que separa a causa cardíaca da cirrose.' },
          ],
        },
        {
          titulo: 'Doença peritoneal — GASA < 1,1',
          explicacao: 'O peritônio doente produz um exsudato rico em proteína, reduzindo o gradiente com o soro.',
          exemplos: [
            { causa: 'Carcinomatose peritoneal', etapas: ['implantes tumorais no peritônio', 'exsudação rica em proteína', 'GASA < 1,1 com citologia oncótica positiva'] },
            { causa: 'Tuberculose peritoneal', etapas: ['granulomas peritoneais', 'ascite linfocítica com ADA elevada', 'GASA < 1,1'], nota: 'Em cirrótico com tuberculose peritoneal, o GASA pode ser alto pela cirrose — situação em que o gradiente engana.' },
          ],
        },
        {
          titulo: 'Infecção do líquido',
          explicacao: 'A translocação bacteriana intestinal em cirrótico coloniza um líquido com baixa capacidade opsonizante, e o recrutamento neutrofílico é a resposta.',
          exemplos: [
            { causa: 'Peritonite bacteriana espontânea', etapas: ['translocação bacteriana em cirrótico', 'polimorfonucleares ≥ 250/mm³', 'cultura monomicrobiana ou negativa', 'antibiótico imediato e albumina para prevenir síndrome hepatorrenal'], nota: 'Não aguarde a cultura — o antibiótico começa com a contagem celular.' },
            { causa: 'Peritonite bacteriana secundária', etapas: ['perfuração de víscera oca', 'proteína > 1 g/dL, glicose < 50 mg/dL, LDH alta', 'cultura polimicrobiana', 'necessidade de imagem e de cirurgia'], nota: 'Confundir com a forma espontânea e tratar apenas com antibiótico é fatal.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O exame sérico que o cálculo exige', ids: ['albumina', 'proteinas-totais'], leitura: 'O GASA é uma subtração: sem albumina sérica colhida no mesmo momento, não existe.' },
      { titulo: 'A gravidade da hepatopatia', ids: ['inr', 'bilirrubina-total', 'creatinina', 'sodio'], leitura: 'Bilirrubina, INR e creatinina compõem escores prognósticos; hiponatremia dilucional marca doença avançada.' },
    ],
    advertencia:
      'Toda ascite nova e toda internação de cirrótico com ascite exigem paracentese diagnóstica. Polimorfonucleares ≥ 250/mm³ indicam antibiótico imediato, sem aguardar cultura.',
    interferentes: {
      preAnalitico: ['Inocular o líquido em frascos de hemocultura à beira do leito aumenta substancialmente o rendimento da cultura.', 'Punção traumática exige correção da contagem de neutrófilos pelo sangue presente.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['albumina', 'proteinas-totais', 'liquido-pleural', 'inr'],
  },

  {
    id: 'liquor',
    nome: 'Líquido cefalorraquidiano (celularidade, proteína, glicose, lactato e bandas oligoclonais)',
    sigla: 'LCR',
    sinonimos: ['liquor', 'lcr', 'liquido cefalorraquidiano', 'puncao lombar', 'bandas oligoclonais', 'indice de igg', 'ada liquorico'],
    grupo: 'liquidos',
    sistemas: ['neurologico', 'infeccioso', 'imunologico'],
    material: 'Líquido cefalorraquidiano e soro pareado',
    unidade: 'células/mm³, mg/dL',
    referencias: [
      { rotulo: 'Celularidade', texto: '< 5 células/mm³, mononucleares', unidade: 'células/mm³' },
      { rotulo: 'Proteína', minimo: 15, maximo: 45, unidade: 'mg/dL' },
      { rotulo: 'Relação glicose liquórica/glicemia', texto: '> 0,6', unidade: 'razão', observacao: 'A glicose do líquor só é interpretável com a glicemia colhida simultaneamente.' },
      { rotulo: 'Lactato liquórico', texto: '< 2,1 mmol/L; > 3,5 sugere etiologia bacteriana', unidade: 'mmol/L' },
      { rotulo: 'Bandas oligoclonais', texto: 'Ausentes ou presentes também no soro', unidade: '' },
    ],
    resumo:
      'O exame que separa meningite bacteriana de viral em minutos — e, em outro contexto, prova produção intratecal de anticorpo, sustentando o diagnóstico de esclerose múltipla.',
    entenda:
      'O padrão liquórico da meningite bacteriana é reconhecível e coerente: milhares de neutrófilos, proteína muito alta e glicose baixa. A glicose cai porque bactérias e neutrófilos a consomem e porque o transporte através da barreira é comprometido. Na meningite viral, a celularidade é menor, predominantemente linfocítica, a proteína é pouco elevada e a glicose é normal — porque o vírus não consome glicose extracelular da mesma forma.',
    aprofundar: [
      'A glicose liquórica precisa ser lida como razão, nunca como valor absoluto. Uma glicose de 60 mg/dL no líquor parece normal, mas num paciente com glicemia de 300 mg/dL a razão é 0,2 — francamente baixa, compatível com meningite bacteriana. A coleta simultânea da glicemia é parte do exame, e sua ausência é um erro comum que compromete a interpretação.',
      'Três padrões de líquor com glicose baixa e predomínio linfocitário formam um diferencial estreito e importante: tuberculose (com ADA elevada e proteína muito alta), meningite fúngica (criptococose, com antígeno criptocócico e tinta da China) e carcinomatose meníngea (com citologia oncótica). A meningite viral, que é a causa mais comum de líquor linfocitário, cursa com glicose normal — e é esse detalhe que a separa das três anteriores.',
      'Na meningite bacteriana parcialmente tratada, o padrão se altera e pode enganar: o antibiótico prévio reduz a celularidade, negativa a cultura e desloca o predomínio para linfócitos. O lactato liquórico ajuda nesse cenário porque se mantém elevado, e a pesquisa de antígenos ou a biologia molecular resolvem quando disponíveis.',
      'As bandas oligoclonais respondem uma pergunta diferente: há produção de imunoglobulina **dentro** do sistema nervoso central? Por isso elas precisam ser comparadas com o soro. Bandas presentes no líquor e ausentes no soro indicam síntese intratecal e apoiam o diagnóstico de esclerose múltipla — servindo, nos critérios atuais, como substituto da disseminação no tempo. Bandas presentes nos dois compartimentos apenas refletem passagem passiva de uma resposta sistêmica.',
      'A punção traumática contamina a amostra com sangue e distorce celularidade e proteína. A correção aproximada subtrai uma leucócito para cada 500 a 1.000 hemácias, mas a prova dos três tubos — clareamento progressivo — é mais confiável para distinguir acidente de punção de hemorragia subaracnóidea. Na hemorragia verdadeira, a xantocromia do sobrenadante após centrifugação é o achado que confirma, e ela leva algumas horas para se desenvolver.',
    ],
    fisiologia: {
      oQueE: 'Líquido produzido pelo plexo coroide que circula pelos ventrículos e pelo espaço subaracnóideo.',
      origem: 'Plexo coroide, com produção aproximada de 500 mL por dia e volume total de cerca de 150 mL.',
      funcao: 'Proteção mecânica, homeostase iônica do sistema nervoso e remoção de metabólitos.',
      orgaosEnvolvidos: ['Plexo coroide', 'Meninges', 'Granulações aracnóideas'],
      percurso: [
        'Produção pelo plexo coroide',
        'circulação pelos ventrículos e espaço subaracnóideo',
        'absorção pelas granulações aracnóideas',
        'barreira hematoencefálica restringe a passagem de proteínas e células',
        'sua ruptura ou a inflamação altera a composição de forma característica',
      ],
    },
    aumento: {
      resumo: 'Celularidade e proteína elevadas indicam inflamação, infecção ou ruptura da barreira; o perfil celular e a glicose apontam a causa.',
      mecanismos: [
        {
          titulo: 'Inflamação meníngea',
          explicacao: 'A infecção ou a inflamação rompem a barreira hematoencefálica, permitindo entrada de células e proteínas e comprometendo o transporte de glicose.',
          exemplos: [
            { causa: 'Meningite bacteriana', etapas: ['invasão bacteriana do espaço subaracnóideo', 'neutrófilos aos milhares', 'proteína muito elevada', 'relação glicose liquor/sangue < 0,4 e lactato > 3,5 mmol/L'], nota: 'O antibiótico não deve aguardar o resultado — nem a punção, se houver indicação de tomografia antes.' },
            { causa: 'Meningite viral', etapas: ['inflamação linfocítica', 'celularidade em geral abaixo de 500/mm³', 'proteína pouco elevada', 'glicose normal'], nota: 'Nas primeiras horas pode haver predomínio neutrofílico — a repetição em 12 a 24 horas mostra a virada para linfócitos.' },
            { causa: 'Meningite tuberculosa', etapas: ['inflamação granulomatosa da base do crânio', 'linfocitose com proteína muito alta', 'glicose baixa e ADA elevada', 'acometimento de pares cranianos e hidrocefalia'] },
            { causa: 'Meningite criptocócica', etapas: ['paciente com imunossupressão, tipicamente CD4 < 100', 'linfocitose discreta com glicose baixa', 'antígeno criptocócico positivo', 'pressão de abertura frequentemente muito elevada'], nota: 'A medida da pressão de abertura é parte do tratamento — o alívio por punções repetidas reduz mortalidade.' },
          ],
        },
        {
          titulo: 'Produção intratecal de imunoglobulina',
          explicacao: 'Linfócitos B que atravessaram a barreira produzem anticorpo dentro do compartimento, gerando bandas ausentes no soro.',
          exemplos: [
            { causa: 'Esclerose múltipla', etapas: ['inflamação desmielinizante crônica', 'plasmócitos intratecais', 'bandas oligoclonais no líquor e ausentes no soro', 'índice de IgG elevado'], nota: 'Substituem a disseminação no tempo nos critérios diagnósticos atuais.' },
            { causa: 'Neurossífilis e infecções crônicas do sistema nervoso', etapas: ['resposta imune local persistente', 'bandas oligoclonais e pleocitose linfocítica', 'VDRL liquórico específico quando reagente'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O exame sérico pareado', ids: ['glicemia-jejum', 'imunoglobulinas', 'albumina'], leitura: 'Glicemia, albumina e IgG séricas são necessárias para calcular a razão de glicose e o índice de IgG — sem elas, o líquor informa menos da metade.' },
      { titulo: 'No paciente imunossuprimido', ids: ['cd4', 'carga-viral-hiv'], leitura: 'CD4 abaixo de 100 amplia o diferencial para criptococo, toxoplasmose e linfoma primário do sistema nervoso central.' },
    ],
    advertencia:
      'Em suspeita de meningite bacteriana, o antibiótico não deve aguardar a punção nem o resultado. A glicose liquórica só é interpretável com a glicemia colhida simultaneamente.',
    interferentes: {
      preAnalitico: ['Punção traumática eleva celularidade e proteína — a prova dos três tubos e a xantocromia diferenciam de hemorragia subaracnóidea.', 'Demora no processamento lisa as células e reduz a contagem.'],
      medicamentos: ['Antibiótico prévio reduz celularidade, negativa a cultura e desloca o predomínio para linfócitos.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['glicemia-jejum', 'imunoglobulinas', 'cd4', 'lactato'],
  },

  {
    id: 'liquido-sinovial',
    nome: 'Líquido sinovial (celularidade e pesquisa de cristais)',
    sigla: 'Sinovial',
    sinonimos: ['liquido sinovial', 'artrocentese', 'cristais', 'gota', 'pseudogota', 'artrite septica', 'urato monossodico', 'pirofosfato'],
    grupo: 'liquidos',
    sistemas: ['musculoesqueletico', 'infeccioso'],
    material: 'Líquido sinovial obtido por artrocentese',
    unidade: 'células/mm³',
    referencias: [
      { rotulo: 'Normal', texto: '< 200 células/mm³, com menos de 25% de neutrófilos', unidade: 'células/mm³' },
      { rotulo: 'Não inflamatório', texto: '200 a 2.000', unidade: 'células/mm³' },
      { rotulo: 'Inflamatório', texto: '2.000 a 50.000', unidade: 'células/mm³' },
      { rotulo: 'Séptico (provável)', texto: '> 50.000 com mais de 90% de neutrófilos', unidade: 'células/mm³' },
    ],
    resumo:
      'A artrocentese responde, em minutos, a pergunta que decide tudo numa monoartrite aguda: é infecção ou é cristal? E a resposta muda entre internar e drenar ou tratar ambulatorialmente.',
    entenda:
      'Monoartrite aguda tem três causas principais — artrite séptica, gota e pseudogota — e elas são clinicamente muito parecidas: articulação quente, vermelha, dolorosa, com febre e leucocitose. A diferença entre um quadro que exige drenagem cirúrgica urgente e outro que se trata com anti-inflamatório está no líquido. Nenhum exame de sangue faz essa distinção com segurança, e a artrocentese é, por isso, um procedimento diagnóstico obrigatório.',
    aprofundar: [
      'Os cristais se distinguem pela morfologia e pela birrefringência à luz polarizada. O urato monossódico da gota forma agulhas finas com birrefringência negativa — amarelas quando paralelas ao eixo do compensador. O pirofosfato de cálcio da pseudogota forma romboides curtos com birrefringência positiva, azuis na mesma orientação. A mnemônica que ajuda: a**g**ulha = **g**ota = ne**g**ativa.',
      'A armadilha mais perigosa é presumir que a presença de cristais exclui infecção. Elas coexistem: um paciente com gota crônica pode ter artrite séptica sobreposta, e a articulação previamente lesada é mais suscetível. Por isso a cultura é obrigatória mesmo com cristais identificados, e a suspeita clínica de infecção mantém a conduta antimicrobiana independentemente do achado cristalográfico.',
      'A celularidade define probabilidade, não certeza. Acima de 50.000 células com predomínio neutrofílico, a artrite séptica é provável — mas gota e pseudogota podem produzir contagens igualmente altas, e a artrite séptica em imunossuprimido, em prótese ou por gonococo pode cursar com contagens bem menores. A cultura e a coloração de Gram são o que confirma, e a decisão inicial se apoia no conjunto.',
      'A glicose e a LDH do líquido sinovial acrescentam pouco à celularidade e à cultura, e o ácido úrico sérico é francamente enganoso na crise aguda: ele pode estar normal ou baixo durante a crise de gota, porque o urato está sendo depositado na articulação. Diagnosticar ou excluir gota pelo ácido úrico sérico é um erro frequente — o diagnóstico é a identificação do cristal.',
    ],
    fisiologia: {
      oQueE: 'Ultrafiltrado do plasma acrescido de ácido hialurônico produzido pelos sinoviócitos.',
      origem: 'Membrana sinovial.',
      funcao: 'Lubrificar a articulação e nutrir a cartilagem, que é avascular.',
      orgaosEnvolvidos: ['Membrana sinovial', 'Cartilagem articular'],
      percurso: [
        'Ultrafiltração do plasma através da membrana sinovial',
        'adição de ácido hialurônico pelos sinoviócitos',
        'volume mínimo em articulação normal',
        'inflamação aumenta a permeabilidade e recruta células',
        'composição reflete a natureza do processo',
      ],
    },
    aumento: {
      resumo: 'Celularidade elevada indica inflamação; o predomínio celular, a presença de cristais e a cultura definem a causa.',
      mecanismos: [
        {
          titulo: 'Inflamação articular aguda',
          explicacao: 'Bactérias ou cristais ativam o inflamassoma e recrutam neutrófilos em massa para a cavidade articular.',
          exemplos: [
            { causa: 'Artrite séptica', etapas: ['invasão bacteriana, geralmente hematogênica', 'celularidade > 50.000 com > 90% de neutrófilos', 'Gram e cultura positivos em parte dos casos', 'destruição cartilaginosa em dias sem drenagem'], nota: 'Emergência: a cartilagem lesada não se recupera. Drenagem e antibiótico não aguardam a cultura.' },
            { causa: 'Gota', etapas: ['deposição de urato monossódico', 'ativação do inflamassoma NLRP3 pelos cristais', 'agulhas com birrefringência negativa', 'ácido úrico sérico pode estar normal na crise'], nota: 'Ácido úrico normal não exclui gota — o cristal é o diagnóstico.' },
            { causa: 'Pseudogota (doença por deposição de pirofosfato)', etapas: ['cristais romboides com birrefringência positiva', 'condrocalcinose na radiografia', 'associação com hiperparatireoidismo, hemocromatose e hipomagnesemia'], nota: 'Pseudogota em jovem obriga a investigar essas causas metabólicas.' },
            { causa: 'Artrite por cristais com infecção sobreposta', etapas: ['cristais presentes e cultura positiva', 'articulação previamente lesada mais suscetível'], nota: 'Achar cristal nunca dispensa a cultura.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O que o sangue acrescenta — e o que não acrescenta', ids: ['acido-urico', 'pcr', 'leucocitos', 'culturas'], leitura: 'PCR e leucocitose indicam inflamação sem dizer a causa; o ácido úrico é enganoso na crise; a hemocultura é positiva em boa parte das artrites sépticas.' },
      { titulo: 'Nas causas metabólicas de pseudogota', ids: ['calcio', 'pth', 'ferritina', 'magnesio'], leitura: 'Hiperparatireoidismo, hemocromatose e hipomagnesemia predispõem à deposição de pirofosfato e devem ser rastreados em pacientes jovens.' },
    ],
    advertencia:
      'A presença de cristais não exclui artrite séptica — as duas coexistem. Cultura é obrigatória em toda monoartrite aguda, e a suspeita clínica de infecção mantém o antibiótico independentemente do achado cristalográfico.',
    interferentes: {
      preAnalitico: ['Demora no processamento dissolve cristais de pirofosfato e reduz a sensibilidade.', 'Uso de heparina de lítio no tubo pode gerar artefatos cristalinos.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['acido-urico', 'pcr', 'culturas', 'calcio'],
  },
]
