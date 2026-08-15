import type { Marcador } from '../tipos'

/**
 * Hemostasia avançada — o que se pede quando o TP e o TTPa já não bastam.
 *
 * Os testes de triagem da coagulação medem **tempo até formar coágulo num
 * tubo**, e isso os torna cegos para tudo o que acontece antes e depois: a
 * função plaquetária, o fator de von Willebrand, os anticoagulantes naturais,
 * a fibrinólise. Um paciente com sangramento mucoso importante e doença de
 * von Willebrand tem, com frequência, TP e TTPa perfeitamente normais.
 *
 * Este arquivo se organiza em torno de duas perguntas clínicas opostas. A
 * primeira é "por que este paciente sangra?" — e a resposta está nos fatores,
 * no von Willebrand e na função plaquetária. A segunda é "por que este
 * paciente trombosa?" — e a resposta está nos anticoagulantes naturais e nas
 * trombofilias. Há uma terceira, transversal e frequentemente esquecida: **em
 * que momento pedir**. Quase todos estes exames são falseados pela fase aguda
 * do evento trombótico e pelo anticoagulante em uso, e a investigação feita na
 * hora errada produz um diagnóstico que acompanhará o paciente para sempre.
 */
export const marcadores: Marcador[] = [
  {
    id: 'fator-viii',
    nome: 'Fator VIII',
    sigla: 'FVIII',
    sinonimos: ['fator 8', 'fator viii', 'fator anti-hemofilico', 'hemofilia a'],
    grupo: 'hemostasia',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    unidade: '% de atividade (UI/dL)',
    referencias: [
      { rotulo: 'Adultos', minimo: 50, maximo: 150, unidade: '%' },
      { rotulo: 'Hemofilia A leve', texto: '5 a 40', unidade: '%' },
      { rotulo: 'Hemofilia A moderada', texto: '1 a 5', unidade: '%' },
      { rotulo: 'Hemofilia A grave', texto: '< 1', unidade: '%', observacao: 'Sangramentos espontâneos em articulações e músculos.' },
    ],
    resumo:
      'O cofator da via intrínseca cuja deficiência causa a hemofilia A. É também proteína de fase aguda — e por isso pode estar falsamente normal justamente quando se investiga sangramento.',
    entenda:
      'O fator VIII circula ligado ao fator de von Willebrand, que o protege da degradação. Essa dependência explica um achado que confunde: na doença de von Willebrand, o fator VIII também cai, porque perde seu transportador. Um FVIII baixo, portanto, não significa automaticamente hemofilia — é preciso dosar o von Willebrand para saber se o problema é a produção do fator ou a do seu carreador.',
    aprofundar: [
      'A hemofilia A tem herança ligada ao X, e o padrão de sangramento é característico e distinto dos distúrbios plaquetários: hemartrose e hematomas musculares profundos, não petéquias nem sangramento mucoso. Essa diferença clínica é o que orienta a investigação antes de qualquer exame — sangramento de "coagulação" é profundo e tardio; sangramento de "plaqueta" é superficial e imediato.',
      'O desenvolvimento de inibidores — aloanticorpos contra o fator infundido — é a complicação mais temida do tratamento. Suspeita-se dele quando o paciente deixa de responder à reposição, e a confirmação é o teste de mistura, que não corrige, seguido da quantificação em unidades Bethesda. É um exemplo em que o exame laboratorial explica uma falha terapêutica que seria atribuída à dose.',
      'A hemofilia A adquirida é rara, grave e frequentemente diagnosticada tarde: um autoanticorpo contra o FVIII surge em idoso, no pós-parto ou em contexto de neoplasia e autoimunidade, causando sangramento grave em quem nunca sangrou. O achado laboratorial é TTPa prolongado que **não corrige** na mistura com plasma normal, e a correção só ocorre parcialmente e piora com a incubação. Reconhecer esse padrão é o que salva o paciente.',
      'Como proteína de fase aguda, o FVIII sobe em inflamação, gestação, exercício e estresse. Isso tem duas consequências: pode mascarar uma hemofilia leve se o exame for colhido em vigência de doença aguda, e um FVIII persistentemente elevado é, por si só, um fator de risco trombótico independente.',
    ],
    fisiologia: {
      oQueE: 'Glicoproteína cofator que acelera em milhares de vezes a ativação do fator X pelo fator IXa.',
      origem: 'Células endoteliais sinusoidais hepáticas.',
      circulacao: 'Ligado ao fator de von Willebrand, que o estabiliza e prolonga sua meia-vida.',
      funcao: 'Componente do complexo tenase intrínseco, essencial para a amplificação da geração de trombina.',
      meiaVida: '8 a 12 horas.',
      orgaosEnvolvidos: ['Fígado', 'Endotélio'],
      percurso: [
        'Síntese endotelial hepática',
        'ligação ao fator de von Willebrand no plasma',
        'ativação pela trombina',
        'formação do complexo tenase com FIXa',
        'ativação do fator X e amplificação da trombina',
      ],
    },
    aumento: {
      resumo: 'Fase aguda, gestação, estrogênio — e, quando persistente, fator de risco trombótico independente.',
      mecanismos: [
        {
          titulo: 'Resposta de fase aguda',
          explicacao: 'O endotélio aumenta a liberação de FVIII em inflamação e sob estímulo adrenérgico ou estrogênico.',
          exemplos: [
            { causa: 'Inflamação, gestação, exercício, estresse', etapas: ['estímulo endotelial', 'liberação aumentada de FVIII', 'atividade acima de 150%'], nota: 'Pode normalizar falsamente uma hemofilia leve — repetir fora da fase aguda.' },
            { causa: 'FVIII persistentemente elevado', etapas: ['níveis mantidos acima de 150% em medidas repetidas', 'geração acelerada de trombina', 'risco aumentado de tromboembolismo venoso'], nota: 'É um dos fatores de risco trombótico mais prevalentes e menos lembrados.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hemofilia A, doença de von Willebrand (por perda do transportador), autoanticorpo adquirido ou consumo.',
      mecanismos: [
        {
          titulo: 'Deficiência de produção',
          explicacao: 'Mutações no gene F8, ligado ao X, reduzem ou abolem a síntese do fator.',
          exemplos: [
            { causa: 'Hemofilia A', etapas: ['mutação no gene F8', 'atividade reduzida proporcional à gravidade', 'TTPa prolongado com TP normal', 'hemartroses e hematomas musculares'], nota: 'A gravidade clínica é previsível pelo nível de atividade — abaixo de 1%, sangramento espontâneo.' },
          ],
        },
        {
          titulo: 'Perda do transportador',
          explicacao: 'Sem o fator de von Willebrand para protegê-lo, o FVIII é depurado rapidamente e sua atividade cai.',
          exemplos: [
            { causa: 'Doença de von Willebrand', etapas: ['deficiência quantitativa ou qualitativa de vWF', 'FVIII sem proteção é degradado', 'FVIII ↓ com vWF ↓', 'sangramento mucocutâneo, diferente do padrão hemofílico'], nota: 'FVIII baixo sem história familiar ligada ao X obriga a dosar vWF.' },
          ],
        },
        {
          titulo: 'Inibidor adquirido e consumo',
          explicacao: 'Autoanticorpos neutralizam o fator; a coagulação intravascular disseminada o consome junto com os demais.',
          exemplos: [
            { causa: 'Hemofilia A adquirida', etapas: ['autoanticorpo contra o FVIII', 'TTPa prolongado que não corrige na mistura', 'piora da correção com incubação a 37 °C', 'sangramento grave em quem nunca sangrou'], nota: 'Idoso, puérpera ou paciente com neoplasia que começa a sangrar — pense nisso.' },
            { causa: 'Coagulação intravascular disseminada', etapas: ['ativação generalizada da coagulação', 'consumo de fatores e plaquetas', 'FVIII ↓ junto com fibrinogênio ↓ e D-dímero ↑↑'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para separar hemofilia de von Willebrand', ids: ['fator-von-willebrand', 'ttpa'], leitura: 'FVIII baixo com vWF normal é hemofilia; com vWF baixo é doença de von Willebrand. O padrão de sangramento clínico já sugere qual antes do exame.' },
      { titulo: 'Quando o TTPa não corrige', ids: ['teste-mistura', 'anticorpos-antifosfolipide'], leitura: 'TTPa prolongado que não corrige tem duas explicações opostas: inibidor de fator (sangra) ou anticoagulante lúpico (trombosa).' },
    ],
    interferentes: {
      preAnalitico: ['Tubo mal preenchido altera a relação citrato/plasma e prolonga artificialmente os tempos.', 'Amostra hemolisada ou lipêmica interfere na leitura óptica.'],
      fisiologico: ['Estresse da própria punção pode elevar o FVIII — o que mascara deficiências leves.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['fator-von-willebrand', 'ttpa', 'teste-mistura'],
  },

  {
    id: 'fator-von-willebrand',
    nome: 'Fator de von Willebrand (antígeno e atividade)',
    sigla: 'vWF',
    sinonimos: ['fator de von willebrand', 'vwf', 'cofator de ristocetina', 'doenca de von willebrand', 'vwf ag'],
    grupo: 'hemostasia',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    unidade: '% (UI/dL)',
    referencias: [
      { rotulo: 'vWF antígeno', minimo: 50, maximo: 160, unidade: '%' },
      { rotulo: 'vWF atividade (cofator de ristocetina)', minimo: 50, maximo: 160, unidade: '%' },
      { rotulo: 'Relação atividade/antígeno', texto: '> 0,7', unidade: 'razão', observacao: 'Relação abaixo de 0,6 indica defeito qualitativo — tipo 2.' },
      { rotulo: 'Grupo sanguíneo O', texto: 'Valores fisiologicamente 25 a 35% menores', unidade: '%' },
    ],
    resumo:
      'A ponte entre a plaqueta e o subendotélio lesado, e o transportador do fator VIII. Sua deficiência é o distúrbio hemorrágico hereditário mais comum — e passa despercebida porque TP e TTPa costumam ser normais.',
    entenda:
      'O fator de von Willebrand faz duas coisas independentes. Sob alto fluxo, ele se desenrola e liga a glicoproteína Ib da plaqueta ao colágeno exposto — sem ele, a plaqueta não adere onde deveria. E ele transporta o fator VIII, protegendo-o da degradação. Por isso sua deficiência produz um quadro híbrido: sangramento mucocutâneo (típico de plaqueta) somado a FVIII reduzido (típico de coagulação).',
    aprofundar: [
      'O exame precisa ser interpretado com o grupo sanguíneo em mãos. Indivíduos do grupo O têm vWF fisiologicamente 25 a 35% mais baixo, porque os antígenos ABO na molécula influenciam sua depuração. Um valor de 45% num paciente do grupo O sem história de sangramento provavelmente não é doença; o mesmo valor num paciente do grupo A, com sangramento, provavelmente é.',
      'A classificação orienta o tratamento e depende da relação entre atividade e antígeno. O tipo 1 é deficiência quantitativa parcial, com atividade e antígeno reduzidos proporcionalmente, e responde bem à desmopressina. O tipo 2 é qualitativo, com atividade desproporcionalmente baixa em relação ao antígeno, e alguns subtipos não respondem ou até pioram com desmopressina — o 2B causa plaquetopenia porque o multímero anômalo se liga espontaneamente às plaquetas. O tipo 3 é ausência praticamente completa, com FVIII muito baixo e quadro semelhante ao hemofílico.',
      'A forma adquirida existe e é subdiagnosticada: estenose aórtica grave, dispositivos de assistência ventricular e trombocitose extrema geram forças de cisalhamento que desenrolam e degradam os multímeros de alto peso. Daí a associação entre estenose aórtica e sangramento digestivo por angiodisplasia — a síndrome de Heyde, em que a troca valvar corrige o sangramento.',
      'A grande armadilha diagnóstica é o vWF ser proteína de fase aguda: sobe na inflamação, na gestação, com estrogênio e com estresse. Um exame colhido durante uma infecção ou logo após um episódio hemorrágico pode vir normal num paciente com doença de von Willebrand tipo 1. Diante de história clínica convincente, a repetição em condições basais é obrigatória.',
    ],
    fisiologia: {
      oQueE: 'Glicoproteína multimérica que medeia a adesão plaquetária ao subendotélio e transporta o fator VIII.',
      origem: 'Células endoteliais (corpos de Weibel-Palade) e megacariócitos (grânulos alfa plaquetários).',
      funcao: 'Adesão plaquetária sob alto cisalhamento e estabilização do fator VIII.',
      metabolismo: 'Multímeros de alto peso são clivados pela ADAMTS13, que regula seu tamanho e sua atividade.',
      orgaosEnvolvidos: ['Endotélio', 'Megacariócito', 'Fígado'],
      percurso: [
        'Síntese endotelial e armazenamento nos corpos de Weibel-Palade',
        'liberação após estímulo',
        'clivagem pela ADAMTS13 controlando o tamanho dos multímeros',
        'desenrolamento sob alto cisalhamento',
        'ligação ao colágeno e à GPIb plaquetária',
        'adesão plaquetária no sítio de lesão',
      ],
    },
    aumento: {
      resumo: 'Fase aguda, lesão endotelial, gestação, estrogênio — e marcador de disfunção endotelial em doenças graves.',
      mecanismos: [
        {
          titulo: 'Liberação endotelial aumentada',
          explicacao: 'Qualquer agressão ao endotélio libera os corpos de Weibel-Palade, elevando o vWF circulante.',
          exemplos: [
            { causa: 'Sepse, inflamação, gestação, diabetes', etapas: ['ativação ou lesão endotelial', 'liberação maciça de multímeros', 'vWF ↑'], nota: 'Em sepse grave, o vWF muito alto com ADAMTS13 consumida contribui para a microangiopatia.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Doença de von Willebrand hereditária, ou destruição adquirida por alto cisalhamento.',
      mecanismos: [
        {
          titulo: 'Deficiência hereditária',
          explicacao: 'Mutações reduzem a quantidade (tipo 1 e 3) ou a função (tipo 2) da molécula.',
          exemplos: [
            { causa: 'Doença de von Willebrand tipo 1', etapas: ['redução quantitativa parcial', 'atividade e antígeno reduzidos proporcionalmente', 'epistaxe, menorragia, sangramento após extração dentária', 'resposta boa à desmopressina'], nota: 'É o distúrbio hemorrágico hereditário mais frequente na população.' },
            { causa: 'Tipo 2B', etapas: ['multímero com afinidade aumentada pela GPIb', 'ligação espontânea às plaquetas e sua remoção', 'plaquetopenia associada', 'desmopressina pode agravar'], nota: 'É o subtipo em que o tratamento habitual piora o quadro — classificar importa.' },
          ],
        },
        {
          titulo: 'Destruição adquirida por cisalhamento',
          explicacao: 'Fluxo turbulento e alta velocidade desenrolam os multímeros grandes, expondo-os à clivagem pela ADAMTS13.',
          exemplos: [
            { causa: 'Estenose aórtica grave (síndrome de Heyde)', etapas: ['alto cisalhamento no orifício valvar estreito', 'perda de multímeros de alto peso', 'sangramento por angiodisplasia intestinal', 'resolução após troca valvar'] },
            { causa: 'Dispositivo de assistência ventricular, trombocitose extrema', etapas: ['degradação mecânica dos multímeros', 'vWF funcional ↓ com antígeno por vezes normal', 'sangramento mucoso'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A avaliação conjunta', ids: ['fator-viii', 'plaquetas', 'adamts13'], leitura: 'FVIII cai junto por perda do transportador; plaquetopenia sugere tipo 2B; a ADAMTS13 é quem regula o tamanho dos multímeros e liga este marcador à púrpura trombocitopênica trombótica.' },
    ],
    advertencia:
      'Resultado normal em vigência de inflamação, gestação ou estresse não exclui doença de von Willebrand. Interprete sempre considerando o grupo sanguíneo ABO.',
    interferentes: {
      fisiologico: ['Grupo sanguíneo O reduz os valores em 25 a 35%.', 'Gestação, estrogênio, exercício e estresse elevam.'],
      preAnalitico: ['Coleta traumática e demora no processamento reduzem a atividade medida.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['fator-viii', 'plaquetas', 'adamts13'],
  },

  {
    id: 'adamts13',
    nome: 'ADAMTS13 (atividade e inibidor)',
    sigla: 'ADAMTS13',
    sinonimos: ['adamts13', 'adamts 13', 'protease clivadora do von willebrand', 'ptt'],
    grupo: 'hemostasia',
    sistemas: ['hematologico'],
    material: 'Plasma citratado, colhido antes de qualquer transfusão de plasma',
    unidade: '% de atividade',
    referencias: [
      { rotulo: 'Adultos', minimo: 50, maximo: 150, unidade: '%' },
      { rotulo: 'Diagnóstico de púrpura trombocitopênica trombótica', texto: '< 10', unidade: '%' },
    ],
    resumo:
      'A protease que corta os multímeros gigantes de von Willebrand. Sua falha causa a púrpura trombocitopênica trombótica — e o exame precisa ser colhido antes da primeira plasmaférese, ou perde-se o diagnóstico.',
    entenda:
      'O endotélio libera multímeros ultragrandes de von Willebrand, e a ADAMTS13 os corta para um tamanho seguro. Sem essa clivagem, os multímeros gigantes permanecem ancorados ao endotélio e capturam plaquetas à força, formando trombos ricos em plaquetas na microcirculação. As hemácias que atravessam essa malha se fragmentam — daí os esquizócitos —, as plaquetas se consomem, e os órgãos isquemiam. É uma doença em que a fisiopatologia molecular explica exatamente cada achado laboratorial.',
    aprofundar: [
      'A regra operacional mais importante: **colher a amostra antes da primeira infusão de plasma**. Depois da plasmaférese, a atividade se normaliza e o inibidor pode desaparecer, tornando impossível confirmar retrospectivamente o diagnóstico. Como o tratamento não pode esperar o resultado, a sequência correta é colher e tratar imediatamente — nunca esperar para colher.',
      'O escore PLASMIC foi criado para essa decisão: ele combina plaquetas, hemólise, ausência de câncer ativo, ausência de transplante, VCM, INR e creatinina para estimar a probabilidade de ADAMTS13 abaixo de 10%. Um escore alto autoriza iniciar plasmaférese sem aguardar o exame, e essa antecipação reduz mortalidade de forma significativa.',
      'A distinção com a síndrome hemolítico-urêmica importa: ali a lesão é da via alternativa do complemento ou da toxina Shiga, a ADAMTS13 está normal, a insuficiência renal é proeminente e a plasmaférese não é o tratamento — no caso mediado por complemento, o eculizumabe é. Duas microangiopatias com apresentação semelhante e tratamentos completamente diferentes.',
      'A forma adquirida, por autoanticorpo, é muito mais comum que a congênita (síndrome de Upshaw-Schulman). Nas formas adquiridas, além da plasmaférese, o rituximabe e o caplacizumabe modificaram o desfecho — e a dosagem seriada da ADAMTS13 no seguimento prediz recidiva, permitindo intervenção preemptiva.',
    ],
    fisiologia: {
      oQueE: 'Metaloprotease plasmática que cliva o fator de von Willebrand no domínio A2.',
      origem: 'Células estreladas hepáticas, principalmente.',
      funcao: 'Regular o tamanho dos multímeros de von Willebrand, impedindo agregação plaquetária espontânea.',
      orgaosEnvolvidos: ['Fígado', 'Endotélio', 'Microcirculação'],
      percurso: [
        'Endotélio libera multímeros ultragrandes de vWF',
        'ADAMTS13 os cliva sob tensão de cisalhamento',
        'multímeros de tamanho fisiológico',
        'sem ADAMTS13: multímeros gigantes ancorados capturam plaquetas',
        'trombos plaquetários microvasculares, esquizócitos e consumo',
      ],
    },
    aumento: {
      resumo: 'Sem significado clínico estabelecido.',
      mecanismos: [
        {
          titulo: 'Variação sem repercussão',
          explicacao: 'Valores acima da faixa não se associam a fenótipo clínico conhecido e não orientam conduta.',
          exemplos: [
            { causa: 'Variação individual', etapas: ['atividade acima de 150%', 'ausência de manifestação clínica', 'nenhuma conduta indicada'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Deficiência grave (abaixo de 10%) define púrpura trombocitopênica trombótica; reduções moderadas ocorrem em sepse, cirrose e gestação.',
      mecanismos: [
        {
          titulo: 'Autoanticorpo inibidor',
          explicacao: 'Anticorpos neutralizam a protease, permitindo o acúmulo de multímeros ultragrandes.',
          exemplos: [
            { causa: 'Púrpura trombocitopênica trombótica adquirida', etapas: ['autoanticorpo anti-ADAMTS13', 'atividade < 10%', 'multímeros gigantes capturam plaquetas', 'plaquetopenia, esquizócitos, LDH ↑↑, haptoglobina consumida', 'plasmaférese em caráter de urgência'], nota: 'Insuficiência renal costuma ser leve — proeminente, sugere síndrome hemolítico-urêmica.' },
          ],
        },
        {
          titulo: 'Deficiência congênita',
          explicacao: 'Mutações bialélicas no gene ADAMTS13 abolem a atividade desde o nascimento.',
          exemplos: [
            { causa: 'Síndrome de Upshaw-Schulman', etapas: ['atividade muito baixa sem inibidor', 'crises desencadeadas por infecção, gestação ou cirurgia', 'tratamento com infusão profilática de plasma'] },
          ],
        },
        {
          titulo: 'Consumo em outras condições',
          explicacao: 'Estados de ativação endotelial intensa consomem a protease sem aboli-la.',
          exemplos: [
            { causa: 'Sepse, cirrose, gestação, neoplasia disseminada', etapas: ['liberação maciça de vWF', 'consumo da protease', 'atividade entre 20 e 50%', 'não configura púrpura trombocitopênica trombótica'], nota: 'Só abaixo de 10% o diagnóstico se sustenta.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A microangiopatia completa', ids: ['plaquetas', 'ldh', 'haptoglobina', 'esfregaco', 'creatinina'], leitura: 'Plaquetopenia + esquizócitos no esfregaço + LDH alta + haptoglobina consumida define microangiopatia. Creatinina muito alta desloca a suspeita para síndrome hemolítico-urêmica.' },
    ],
    advertencia:
      'Colher antes da primeira infusão de plasma. O tratamento não deve aguardar o resultado — a demora aumenta a mortalidade de forma significativa.',
    interferentes: {
      preAnalitico: ['Transfusão de plasma antes da coleta normaliza a atividade e inviabiliza o diagnóstico.', 'Hemólise da amostra interfere em alguns métodos.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['fator-von-willebrand', 'plaquetas', 'ldh', 'haptoglobina'],
  },

  {
    id: 'proteina-c-s',
    nome: 'Proteína C e proteína S',
    sigla: 'PC / PS',
    sinonimos: ['proteina c', 'proteina s', 'anticoagulantes naturais', 'deficiencia de proteina c', 'deficiencia de proteina s'],
    grupo: 'hemostasia',
    sistemas: ['hematologico', 'cardiovascular'],
    material: 'Plasma citratado',
    unidade: '% de atividade',
    referencias: [
      { rotulo: 'Proteína C — atividade', minimo: 70, maximo: 140, unidade: '%' },
      { rotulo: 'Proteína S livre — atividade', minimo: 60, maximo: 130, unidade: '%' },
      { rotulo: 'Condição de coleta', texto: 'Fora do evento agudo e fora do uso de varfarina (mínimo 2 semanas de suspensão)', unidade: '', observacao: 'São proteínas dependentes de vitamina K — a varfarina as reduz e cria falsa deficiência.' },
    ],
    resumo:
      'Os anticoagulantes naturais dependentes de vitamina K. Sua deficiência causa trombofilia — e a investigação feita no momento errado gera diagnósticos falsos que acompanham o paciente por décadas.',
    entenda:
      'A trombina, ao se ligar à trombomodulina no endotélio, muda de função e passa a ativar a proteína C. A proteína C ativada, com a proteína S como cofator, degrada os fatores Va e VIIIa — freando a própria cascata que a gerou. É um circuito de retroalimentação negativa elegante, e sua falha desloca o equilíbrio para trombose.',
    aprofundar: [
      'O erro mais frequente na prática é dosar essas proteínas no momento errado. Elas são dependentes de vitamina K, então a varfarina as reduz — um paciente anticoagulado terá proteína C e S baixas sem ter deficiência alguma. E são consumidas na trombose aguda, então a dosagem durante o evento também vem falsamente baixa. A janela correta é pelo menos duas semanas após suspender a varfarina e, idealmente, três meses após o evento trombótico.',
      'A necrose cutânea induzida por varfarina é a consequência clínica mais dramática dessa fisiologia: no início do tratamento, a proteína C — que tem meia-vida curta, de 6 a 8 horas — cai antes dos fatores II, IX e X, que têm meias-vidas mais longas. Cria-se uma janela de horas em que o paciente está transitoriamente **mais** trombogênico. Em deficientes de proteína C, isso produz trombose da microcirculação cutânea com necrose. É a razão de se sobrepor heparina no início da anticoagulação oral.',
      'A proteína S circula em duas formas: livre (ativa) e ligada à proteína ligadora de C4b. Como essa proteína ligadora é reagente de fase aguda, a inflamação sequestra proteína S e reduz a fração livre — outra fonte de falsa deficiência. Por isso se dosa a proteína S **livre**, e ainda assim fora de contexto inflamatório. Gestação e estrogênio também a reduzem substancialmente.',
      'A deficiência homozigótica de proteína C é uma emergência neonatal: causa púrpura fulminante nas primeiras horas de vida, com trombose extensa da microcirculação cutânea. É rara, mas o reconhecimento imediato com reposição de concentrado de proteína C é o que evita amputações e morte.',
    ],
    fisiologia: {
      oQueE: 'Proteína C: zimogênio de serina protease dependente de vitamina K. Proteína S: cofator não enzimático, também dependente de vitamina K.',
      origem: 'Hepatócito; a proteína S também é produzida por células endoteliais e megacariócitos.',
      funcao: 'A proteína C ativada, com a proteína S, inativa os fatores Va e VIIIa, limitando a geração de trombina.',
      meiaVida: 'Proteína C: 6 a 8 horas — a mais curta entre os fatores dependentes de vitamina K.',
      orgaosEnvolvidos: ['Fígado', 'Endotélio'],
      percurso: [
        'Trombina liga-se à trombomodulina endotelial',
        'ativação da proteína C',
        'proteína C ativada + proteína S como cofator',
        'clivagem dos fatores Va e VIIIa',
        'freio à geração de trombina',
      ],
    },
    aumento: {
      resumo: 'Sem significado clínico.',
      mecanismos: [
        {
          titulo: 'Variação sem repercussão',
          explicacao: 'Valores acima da faixa de referência não se associam a fenótipo hemorrágico nem exigem conduta.',
          exemplos: [
            { causa: 'Variação individual ou de método', etapas: ['atividade acima do limite superior', 'nenhuma manifestação clínica', 'nenhuma investigação indicada'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Deficiência hereditária, consumo agudo, hepatopatia, uso de varfarina ou — no caso da proteína S — inflamação, gestação e estrogênio.',
      mecanismos: [
        {
          titulo: 'Deficiência hereditária',
          explicacao: 'Mutações reduzem a produção ou a função, deslocando permanentemente o equilíbrio hemostático para a trombose.',
          exemplos: [
            { causa: 'Trombofilia hereditária', etapas: ['atividade persistentemente reduzida em duas medidas fora de evento agudo', 'freio da cascata insuficiente', 'trombose venosa espontânea ou em idade jovem', 'história familiar frequentemente presente'] },
            { causa: 'Deficiência homozigótica de proteína C', etapas: ['ausência quase completa da proteína', 'púrpura fulminante neonatal', 'trombose extensa da microcirculação', 'emergência com necessidade de reposição imediata'] },
          ],
        },
        {
          titulo: 'Redução adquirida — as causas de falso diagnóstico',
          explicacao: 'Quase tudo que altera o fígado, a vitamina K, a inflamação ou o próprio evento trombótico reduz esses anticoagulantes sem que haja deficiência congênita.',
          exemplos: [
            { causa: 'Uso de varfarina', etapas: ['inibição da gama-carboxilação dependente de vitamina K', 'proteína C e S ↓', 'falsa deficiência'], nota: 'Suspender por pelo menos duas semanas antes de investigar, com ponte por heparina se necessário.' },
            { causa: 'Trombose aguda', etapas: ['consumo dos anticoagulantes naturais no trombo', 'níveis reduzidos transitoriamente', 'diagnóstico falso se colhido nesse momento'], nota: 'Investigar preferencialmente três meses após o evento.' },
            { causa: 'Gestação, estrogênio, inflamação (proteína S)', etapas: ['aumento da proteína ligadora de C4b na fase aguda', 'sequestro da proteína S', 'fração livre ↓ sem deficiência real'] },
            { causa: 'Hepatopatia e deficiência de vitamina K', etapas: ['síntese hepática comprometida', 'redução conjunta de fatores pró e anticoagulantes', 'sem significado trombofílico isolado'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel de trombofilia', ids: ['antitrombina', 'fator-v-leiden', 'anticorpos-antifosfolipide'], leitura: 'Investigar tudo junto e no momento certo. A síndrome antifosfolípide é a única trombofilia adquirida que muda a escolha do anticoagulante.' },
      { titulo: 'O contexto que invalida o exame', ids: ['inr', 'albumina', 'pcr'], leitura: 'INR alterado indica varfarina ou hepatopatia; PCR alta indica fase aguda. Qualquer um dos dois torna a interpretação insegura.' },
    ],
    advertencia:
      'Não investigue trombofilia durante o evento agudo nem em uso de varfarina: os resultados serão falsamente baixos e o rótulo de deficiência hereditária acompanhará o paciente indevidamente.',
    utilidade: ['diagnostico'],
    estudarTambem: ['antitrombina', 'fator-v-leiden', 'inr'],
  },

  {
    id: 'fator-v-leiden',
    nome: 'Fator V Leiden e mutação da protrombina G20210A',
    sigla: 'FVL',
    sinonimos: ['fator v leiden', 'fvl', 'resistencia a proteina c ativada', 'protrombina g20210a', 'mutacao da protrombina', 'f2 g20210a'],
    grupo: 'hemostasia',
    sistemas: ['hematologico', 'cardiovascular'],
    material: 'Sangue total com EDTA (DNA)',
    unidade: 'ausente / heterozigoto / homozigoto',
    referencias: [
      { rotulo: 'Fator V Leiden', texto: 'Ausente', unidade: '' },
      { rotulo: 'Protrombina G20210A', texto: 'Ausente', unidade: '' },
    ],
    resumo:
      'As duas trombofilias hereditárias mais prevalentes. São de risco modesto quando heterozigóticas — e sua pesquisa indiscriminada gera mais ansiedade e restrição do que benefício clínico.',
    entenda:
      'O fator V Leiden é uma mutação pontual que troca uma arginina no sítio onde a proteína C ativada cliva o fator Va. Sem esse sítio, o fator Va resiste à inativação e a geração de trombina se prolonga — é a "resistência à proteína C ativada". A mutação da protrombina eleva a concentração plasmática de protrombina em cerca de 30%, com o mesmo resultado final. Por serem genéticas, não sofrem interferência de anticoagulante nem de fase aguda: são os únicos exames do painel de trombofilia que podem ser colhidos a qualquer momento.',
    aprofundar: [
      'A questão mais importante sobre estes exames não é como interpretá-los, e sim se devem ser pedidos. Na maioria das situações, o resultado **não muda a conduta**: a duração da anticoagulação após um tromboembolismo venoso é decidida principalmente por o evento ter sido provocado ou não provocado, e um heterozigoto para fator V Leiden com trombose provocada por cirurgia não recebe tratamento diferente de quem não tem a mutação. Pedir um exame cujo resultado não altera decisão é gerar rótulo sem benefício.',
      'Há situações em que o resultado é relevante: história familiar forte de trombose em idade jovem, trombose de sítio incomum, e aconselhamento sobre contracepção hormonal e gestação em familiares de portadores. Mesmo aí, a decisão deve ser tomada com aconselhamento, porque o rótulo tem consequências reais — de seguro de vida a decisões reprodutivas.',
      'O risco absoluto merece contexto. Heterozigose para fator V Leiden multiplica o risco de tromboembolismo venoso por cerca de 3 a 5 vezes, o que soa alto até se lembrar que o risco basal é muito baixo. Homozigose eleva muito mais. E combinações — fator V Leiden com anticoncepcional oral, por exemplo — são multiplicativas, o que dá ao aconselhamento contraceptivo em familiares seu principal valor.',
      'O teste funcional de resistência à proteína C ativada pode ser usado como triagem, mas é afetado por anticoagulantes e por gestação; a genotipagem não. Quando disponível, a genotipagem direta é preferível pela robustez.',
    ],
    fisiologia: {
      oQueE: 'Polimorfismos genéticos: substituição no gene F5 que elimina um sítio de clivagem, e variante na região 3’ não traduzida do gene da protrombina que aumenta sua expressão.',
      origem: 'Linhagem germinativa — presentes em todas as células.',
      funcao: 'Deslocam o equilíbrio hemostático no sentido pró-trombótico.',
      percurso: [
        'Fator V Leiden: sítio de clivagem pela proteína C ativada ausente',
        'fator Va permanece ativo por mais tempo',
        'geração de trombina prolongada',
        'ou: protrombina G20210A eleva a concentração de protrombina em ~30%',
        'maior potencial de geração de trombina',
      ],
    },
    aumento: {
      resumo: 'A presença da mutação indica risco aumentado de tromboembolismo venoso — modesto em heterozigose, substancial em homozigose ou em combinação com outros fatores.',
      significado:
        'O achado raramente altera a duração da anticoagulação. Seu maior valor está no aconselhamento de familiares sobre contracepção hormonal e gestação.',
      mecanismos: [
        {
          titulo: 'Desequilíbrio pró-coagulante constitucional',
          explicacao: 'A alteração genética mantém, ao longo de toda a vida, um limiar mais baixo para a formação de trombo diante de qualquer gatilho.',
          exemplos: [
            { causa: 'Fator V Leiden heterozigoto', etapas: ['fator Va resistente à inativação', 'risco de tromboembolismo venoso 3 a 5 vezes maior', 'risco absoluto ainda baixo na ausência de gatilho'], nota: 'Isoladamente, raramente justifica anticoagulação profilática prolongada.' },
            { causa: 'Associação com contraceptivo oral combinado', etapas: ['estrogênio reduz proteína S e eleva fatores procoagulantes', 'efeito multiplicativo com a mutação', 'risco de trombose substancialmente aumentado'], nota: 'É a informação que mais justifica testar familiares de portadores.' },
            { causa: 'Homozigose ou dupla heterozigose', etapas: ['duas alterações somadas', 'risco consideravelmente maior', 'trombose em idade jovem ou de sítio incomum'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel completo', ids: ['proteina-c-s', 'antitrombina', 'anticorpos-antifosfolipide'], leitura: 'Ao contrário dos anticoagulantes naturais, os testes genéticos não sofrem interferência de anticoagulante ou de fase aguda.' },
    ],
    advertencia:
      'A pesquisa de trombofilia hereditária raramente altera a conduta de quem já teve trombose. Pedir sem indicação clara produz rótulos com consequências pessoais e sem benefício clínico.',
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['proteina-c-s', 'antitrombina', 'd-dimero'],
  },

  {
    id: 'teste-mistura',
    nome: 'Teste de mistura (correção com plasma normal)',
    sigla: 'Mistura 1:1',
    sinonimos: ['teste de mistura', 'prova de mistura', 'mistura 1:1', 'correcao com plasma normal'],
    grupo: 'hemostasia',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    unidade: 'corrige / não corrige',
    referencias: [{ rotulo: 'Interpretação', texto: 'Correção indica deficiência de fator; ausência de correção indica inibidor', unidade: '' }],
    resumo:
      'O passo lógico depois de um TP ou TTPa prolongado: mistura-se o plasma do paciente com plasma normal em partes iguais. Se corrige, falta fator. Se não corrige, existe um inibidor.',
    entenda:
      'A lógica é simples e poderosa. O plasma normal contém todos os fatores em concentração de 100%; ao misturar meio a meio, mesmo uma deficiência grave passa a ter pelo menos 50% de cada fator — suficiente para normalizar o tempo. Se o tempo continua prolongado, é porque existe algo no plasma do paciente que inibe a coagulação **do plasma normal também**. Um único teste separa dois mundos opostos: o paciente que sangra por falta de fator e o que tem um anticorpo.',
    aprofundar: [
      'A incubação a 37 °C por uma a duas horas antes de repetir a leitura é o refinamento que identifica os inibidores tempo-dependentes, sobretudo o anti-fator VIII da hemofilia adquirida. Esses anticorpos precisam de tempo para neutralizar o fator, e o padrão característico é: correção inicial na mistura imediata seguida de prolongamento após a incubação. Sem essa etapa, o diagnóstico escapa.',
      'A distinção entre os dois tipos de inibidor é clinicamente decisiva e frequentemente confundida. O inibidor de fator específico (anti-FVIII) **causa sangramento grave**. O anticoagulante lúpico **causa trombose** e não sangra, apesar de prolongar o TTPa. Os dois produzem a mesma ausência de correção no teste de mistura, e é o quadro clínico e os testes confirmatórios de fosfolipídio que os separam.',
      'Uma limitação prática: heparina no plasma produz ausência de correção e imita um inibidor. Antes de interpretar, é preciso excluir contaminação por heparina — coleta de cateter heparinizado é a causa mais comum, e o tempo de trombina, junto com a correção pela protamina, resolve a dúvida.',
    ],
    fisiologia: {
      oQueE: 'Ensaio funcional em que o plasma do paciente é misturado a plasma normal em proporção 1:1 e o tempo de coagulação é reavaliado.',
      origem: 'Não mede uma substância — testa uma hipótese.',
      funcao: 'Discriminar deficiência de fator de presença de inibidor circulante.',
      percurso: [
        'TP ou TTPa prolongado',
        'mistura 1:1 com plasma normal',
        'cada fator passa a ter pelo menos 50% da atividade',
        'se corrige: deficiência',
        'se não corrige: inibidor',
        'incubação a 37 °C revela inibidores tempo-dependentes',
      ],
    },
    aumento: {
      resumo: 'A ausência de correção indica inibidor: específico de fator (sangra) ou antifosfolípide (trombosa).',
      significado: 'É o resultado que redireciona toda a investigação — de reposição de fator para imunossupressão, ou de coagulopatia para trombofilia.',
      mecanismos: [
        {
          titulo: 'Inibidor circulante',
          explicacao: 'Uma substância no plasma do paciente interfere na coagulação também do plasma normal adicionado.',
          exemplos: [
            { causa: 'Hemofilia A adquirida (anti-FVIII)', etapas: ['autoanticorpo tempo-dependente', 'correção inicial seguida de prolongamento após incubação', 'sangramento grave em quem nunca sangrou', 'quantificação em unidades Bethesda'], nota: 'Idoso, puérpera ou paciente com neoplasia que passa a sangrar.' },
            { causa: 'Anticoagulante lúpico', etapas: ['anticorpo antifosfolípide interfere no reagente', 'TTPa prolongado sem correção', 'ausência de sangramento', 'risco trombótico aumentado'], nota: 'O oposto clínico do anterior, com o mesmo achado laboratorial.' },
            { causa: 'Contaminação por heparina', etapas: ['coleta por cateter heparinizado', 'ausência de correção que imita inibidor', 'tempo de trombina prolongado que corrige com protamina'], nota: 'Sempre excluir antes de concluir.' },
          ],
        },
        {
          titulo: 'Correção com plasma normal',
          explicacao: 'A adição de fatores em concentração normal restaura o tempo, indicando que faltava substrato, não que havia inibição.',
          exemplos: [
            { causa: 'Deficiência de fator', etapas: ['tempo corrige na mistura', 'dosagem individual dos fatores da via prolongada', 'identificação do fator deficiente', 'reposição específica'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O que investigar conforme o resultado', ids: ['fator-viii', 'anticorpos-antifosfolipide', 'ttpa', 'inr'], leitura: 'Corrigiu: dose os fatores da via prolongada. Não corrigiu: separe inibidor de fator de anticoagulante lúpico pelo quadro clínico e pelos testes confirmatórios.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['ttpa', 'fator-viii', 'anticorpos-antifosfolipide'],
  },

  {
    id: 'anti-fator-xa',
    nome: 'Atividade anti-fator Xa',
    sigla: 'Anti-Xa',
    sinonimos: ['anti xa', 'anti fator xa', 'atividade anti-xa', 'nivel de heparina'],
    grupo: 'hemostasia',
    sistemas: ['hematologico'],
    material: 'Plasma citratado, colhido em horário definido em relação à dose',
    unidade: 'UI/mL',
    referencias: [
      { rotulo: 'Heparina de baixo peso — dose terapêutica, pico (4h após a dose)', minimo: 0.5, maximo: 1.0, unidade: 'UI/mL' },
      { rotulo: 'Heparina de baixo peso — dose profilática, pico', minimo: 0.2, maximo: 0.5, unidade: 'UI/mL' },
      { rotulo: 'Heparina não fracionada — terapêutica', minimo: 0.3, maximo: 0.7, unidade: 'UI/mL' },
      { rotulo: 'Calibração', texto: 'Específica para heparina ou para anticoagulante oral direto — não são intercambiáveis', unidade: '' },
    ],
    resumo:
      'Mede diretamente o efeito anticoagulante sobre o fator Xa. É o exame de escolha quando o TTPa não é confiável e o único capaz de monitorar heparina de baixo peso molecular.',
    entenda:
      'A heparina de baixo peso molecular inibe predominantemente o fator Xa e quase não prolonga o TTPa — por isso não pode ser monitorada por ele. O anti-Xa mede exatamente a atividade inibitória sobre o Xa e resolve esse problema. Também é mais confiável que o TTPa na heparina não fracionada em pacientes com fase aguda intensa, em que o fibrinogênio e o fator VIII muito elevados encurtam o TTPa e simulam anticoagulação insuficiente.',
    aprofundar: [
      'A heparina de baixo peso molecular não requer monitoramento na maioria dos pacientes — a dose por peso é previsível. As exceções em que o anti-Xa muda a conduta são bem definidas: insuficiência renal (a depuração é renal e o fármaco acumula), obesidade extrema e peso muito baixo, gestação (o volume de distribuição e a filtração mudam ao longo dos trimestres) e pediatria.',
      'O horário da coleta é parte do exame, não um detalhe: a amostra deve ser colhida no pico, cerca de 4 horas após a dose subcutânea. Um valor colhido no vale é ininterpretável em relação às faixas terapêuticas publicadas, e essa é uma das causas mais comuns de decisão errada de ajuste de dose.',
      'A calibração importa criticamente. Um ensaio anti-Xa calibrado para heparina dará um número em unidades de heparina mesmo quando o paciente usa rivaroxabana — e esse número não corresponde à concentração do fármaco. Para anticoagulantes orais diretos existem calibradores específicos, e o laudo precisa informar qual foi usado. Interpretar sem essa informação é interpretar outro exame.',
      'Nos anticoagulantes orais diretos, o objetivo raramente é ajuste de dose: é responder perguntas binárias em situações críticas — há fármaco ativo antes de uma trombólise? Antes de uma cirurgia de urgência? A ausência de atividade detectável é a informação clinicamente útil.',
    ],
    fisiologia: {
      oQueE: 'Ensaio cromogênico que quantifica a inibição do fator Xa exercida pela amostra.',
      origem: 'Reflete a concentração funcional do anticoagulante presente.',
      funcao: 'Medir diretamente o efeito farmacológico, em vez de inferi-lo pelo tempo de coagulação global.',
      percurso: [
        'Heparina liga-se à antitrombina e potencializa sua ação',
        'complexo antitrombina-heparina inibe o fator Xa',
        'no ensaio, o Xa residual cliva um substrato cromogênico',
        'menos cor = mais inibição = mais anticoagulante',
      ],
    },
    aumento: {
      resumo: 'Excesso de efeito anticoagulante — acúmulo por insuficiência renal, dose alta ou coleta em horário inadequado.',
      mecanismos: [
        {
          titulo: 'Acúmulo do fármaco',
          explicacao: 'A depuração renal reduzida prolonga a exposição, elevando a atividade medida acima da faixa-alvo.',
          exemplos: [
            { causa: 'Insuficiência renal em uso de heparina de baixo peso', etapas: ['depuração renal reduzida', 'acúmulo do fármaco', 'anti-Xa acima da faixa terapêutica', 'risco hemorrágico aumentado e necessidade de ajuste'], nota: 'É a indicação clássica de monitorar um fármaco que normalmente não se monitora.' },
            { causa: 'Coleta fora do pico', etapas: ['amostra colhida muito próxima da administração', 'valor alto sem significado', 'ajuste de dose indevido'], nota: 'O horário é parte do exame.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Efeito insuficiente — dose baixa, não adesão, deficiência de antitrombina ou coleta no vale.',
      mecanismos: [
        {
          titulo: 'Anticoagulação inadequada',
          explicacao: 'A heparina depende da antitrombina para agir; sem ela, a dose habitual não produz efeito.',
          exemplos: [
            { causa: 'Deficiência de antitrombina', etapas: ['heparina sem cofator suficiente', 'anti-Xa baixo apesar de dose adequada', 'resistência à heparina'], nota: 'Resistência aparente à heparina obriga a dosar antitrombina.' },
            { causa: 'Não adesão ou subdose em obesidade extrema', etapas: ['exposição insuficiente', 'anti-Xa abaixo da faixa', 'risco de falha terapêutica'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A alternativa e seus limites', ids: ['ttpa', 'antitrombina', 'creatinina'], leitura: 'O TTPa é impreciso na fase aguda e cego para heparina de baixo peso. A antitrombina explica resistência à heparina; a creatinina explica acúmulo.' },
    ],
    advertencia:
      'O resultado só é interpretável com o horário da coleta em relação à dose e com a calibração usada (heparina ou anticoagulante oral direto específico) informados no laudo.',
    interferentes: {
      preAnalitico: ['Coleta fora do pico torna o valor não comparável às faixas de referência.', 'Hemólise e amostra armazenada por muito tempo reduzem a atividade medida.'],
      metodo: ['Calibradores diferentes produzem resultados não intercambiáveis entre fármacos.'],
    },
    utilidade: ['acompanhamento'],
    estudarTambem: ['ttpa', 'antitrombina', 'inr'],
  },

  {
    id: 'agregacao-plaquetaria',
    nome: 'Agregação plaquetária e tempo de fechamento (PFA)',
    sigla: 'Agregometria',
    sinonimos: ['agregacao plaquetaria', 'agregometria', 'pfa-100', 'tempo de fechamento', 'funcao plaquetaria', 'tempo de sangramento'],
    grupo: 'hemostasia',
    sistemas: ['hematologico'],
    material: 'Plasma rico em plaquetas ou sangue total citratado, processado em poucas horas',
    unidade: '% de agregação e segundos',
    referencias: [
      { rotulo: 'Agregação com ADP, colágeno, epinefrina, ácido araquidônico', texto: 'Resposta normal a todos os agonistas', unidade: '%' },
      { rotulo: 'Agregação com ristocetina', texto: 'Normal — reduzida na doença de von Willebrand e na síndrome de Bernard-Soulier', unidade: '%' },
      { rotulo: 'PFA — tempo de fechamento', texto: 'Dependente do cartucho e do método', unidade: 's' },
    ],
    resumo:
      'Testa se a plaqueta funciona, não quantas existem. É o exame para o paciente que sangra em mucosas com contagem plaquetária e testes de coagulação normais.',
    entenda:
      'A plaquetometria conta células; a agregometria testa se elas respondem. Ao expor as plaquetas a agonistas específicos — ADP, colágeno, epinefrina, ácido araquidônico, ristocetina — e medir a agregação, é possível localizar o defeito na via de ativação. O padrão de quais agonistas falham é o que aponta o diagnóstico: falha só com ácido araquidônico sugere efeito de aspirina; falha só com ADP sugere clopidogrel ou defeito do receptor P2Y12; falha com todos exceto ristocetina sugere trombastenia de Glanzmann.',
    aprofundar: [
      'A causa mais comum de agregação alterada não é doença: é medicamento. Aspirina, clopidogrel, anti-inflamatórios não esteroidais e mesmo alguns antidepressivos inibidores de recaptação de serotonina alteram a função plaquetária. Antes de investigar defeito congênito, é necessário um período livre de fármacos de pelo menos 7 a 10 dias — e obter essa história com precisão é mais produtivo que qualquer exame.',
      'A resposta isolada à ristocetina tem valor diagnóstico particular: a ristocetina promove a ligação do vWF à GPIb. Agregação reduzida com ristocetina e normal com os demais agonistas aponta para doença de von Willebrand ou para síndrome de Bernard-Soulier (ausência de GPIb) — e a mistura com plaquetas normais separa as duas.',
      'O tempo de sangramento, historicamente usado como triagem, foi abandonado por ser mal reprodutível, dependente do operador, doloroso e sem valor preditivo de sangramento cirúrgico. Sua substituição pelo PFA e pela agregometria é um exemplo de exame que saiu da prática por não resistir à avaliação de desempenho.',
      'O PFA (tempo de fechamento) é uma triagem rápida e sensível à doença de von Willebrand e a defeitos plaquetários graves, mas tem sensibilidade limitada para defeitos leves de secreção. Um PFA normal em paciente com história hemorrágica convincente não encerra a investigação.',
    ],
    fisiologia: {
      oQueE: 'Ensaios funcionais que medem a capacidade das plaquetas de aderir, ativar e agregar em resposta a agonistas.',
      origem: 'Plaquetas circulantes do próprio paciente.',
      funcao: 'Localizar o defeito na via de ativação plaquetária.',
      percurso: [
        'Agonista adicionado ao plasma rico em plaquetas',
        'ativação do receptor específico',
        'mudança de forma e secreção de grânulos',
        'ativação da GPIIb/IIIa e ligação ao fibrinogênio',
        'agregação medida por aumento da transmissão de luz',
      ],
    },
    aumento: {
      resumo: 'Hiperagregabilidade tem valor clínico limitado e não orienta conduta de forma estabelecida.',
      mecanismos: [
        {
          titulo: 'Resposta aumentada aos agonistas',
          explicacao: 'Observada em alguns estados pró-trombóticos, mas sem padronização suficiente para decisão clínica.',
          exemplos: [
            { causa: 'Diabetes, tabagismo, síndrome metabólica', etapas: ['plaquetas mais reativas', 'agregação aumentada in vitro', 'sem conduta específica derivada do exame'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Efeito de fármaco (a causa mais comum), defeito congênito de receptor ou de grânulos, doença de von Willebrand ou uremia.',
      mecanismos: [
        {
          titulo: 'Inibição farmacológica',
          explicacao: 'Cada classe de antiplaquetário bloqueia uma via específica, e o padrão de falha identifica o fármaco.',
          exemplos: [
            { causa: 'Aspirina', etapas: ['inibição irreversível da ciclo-oxigenase 1', 'ausência de agregação com ácido araquidônico', 'resposta preservada aos demais agonistas'] },
            { causa: 'Clopidogrel e congêneres', etapas: ['bloqueio do receptor P2Y12', 'agregação reduzida com ADP', 'demais vias preservadas'] },
          ],
        },
        {
          titulo: 'Defeito intrínseco da plaqueta',
          explicacao: 'A ausência de um receptor ou de conteúdo granular impede etapas específicas da ativação.',
          exemplos: [
            { causa: 'Trombastenia de Glanzmann', etapas: ['ausência ou disfunção da GPIIb/IIIa', 'agregação ausente com todos os agonistas exceto ristocetina', 'sangramento mucocutâneo grave desde a infância'], nota: 'A ristocetina preservada é a chave: ela testa adesão, não agregação.' },
            { causa: 'Síndrome de Bernard-Soulier', etapas: ['ausência da GPIb', 'agregação com ristocetina ausente', 'plaquetas gigantes com plaquetopenia moderada'] },
            { causa: 'Doença do pool de armazenamento', etapas: ['deficiência de grânulos densos ou alfa', 'segunda onda de agregação ausente', 'sangramento leve a moderado'] },
          ],
        },
        {
          titulo: 'Disfunção adquirida',
          explicacao: 'Toxinas urêmicas e paraproteínas revestem a plaqueta e impedem sua ativação normal.',
          exemplos: [
            { causa: 'Uremia', etapas: ['acúmulo de toxinas que interferem na função plaquetária', 'sangramento mucoso com contagem normal', 'melhora com diálise e desmopressina'] },
            { causa: 'Gamopatia monoclonal, sobretudo IgM', etapas: ['paraproteína reveste a superfície plaquetária', 'disfunção adquirida', 'sangramento em paciente com contagem normal'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O contexto do sangramento mucocutâneo', ids: ['plaquetas', 'fator-von-willebrand', 'ttpa', 'inr'], leitura: 'Sangramento mucoso com plaquetas, TP e TTPa normais aponta para função plaquetária ou von Willebrand. A agregometria e o vWF respondem juntos.' },
    ],
    advertencia:
      'Investigação inválida sem período livre de antiplaquetários e anti-inflamatórios de 7 a 10 dias. A amostra é frágil e precisa ser processada em poucas horas — resultados de amostras antigas não são confiáveis.',
    interferentes: {
      medicamentos: ['Aspirina, clopidogrel, anti-inflamatórios não esteroidais e inibidores de recaptação de serotonina alteram a agregação.'],
      preAnalitico: ['Coleta traumática ativa as plaquetas e reduz a resposta.', 'Amostra refrigerada ou processada tardiamente inviabiliza o exame.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['plaquetas', 'fator-von-willebrand', 'indices-plaquetarios'],
  },

  {
    id: 'produtos-degradacao-fibrina',
    nome: 'Produtos de degradação da fibrina e alfa-2-antiplasmina',
    sigla: 'PDF',
    sinonimos: ['pdf', 'produtos de degradacao da fibrina', 'alfa 2 antiplasmina', 'plasminogenio', 'fibrinolise'],
    grupo: 'hemostasia',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    unidade: 'µg/mL e % de atividade',
    referencias: [
      { rotulo: 'Produtos de degradação da fibrina', texto: '< 5', unidade: 'µg/mL' },
      { rotulo: 'Plasminogênio', minimo: 75, maximo: 140, unidade: '%' },
      { rotulo: 'Alfa-2-antiplasmina', minimo: 80, maximo: 120, unidade: '%' },
    ],
    resumo:
      'Os marcadores do outro lado da hemostasia: a dissolução do coágulo. Distinguem fibrinólise secundária ao consumo (CIVD) de hiperfibrinólise primária — situações com tratamentos opostos.',
    entenda:
      'A plasmina degrada tanto fibrinogênio quanto fibrina, e os produtos dessa degradação circulam. O D-dímero é específico da fibrina já polimerizada e ligada de forma cruzada — ou seja, indica que houve coágulo formado e depois dissolvido. Os produtos de degradação da fibrina, mais amplos, sobem também na degradação do fibrinogênio ainda não coagulado. Por isso PDF muito alto com D-dímero desproporcionalmente menor sugere fibrinólise primária, em que a plasmina ataca o fibrinogênio sem que tenha havido trombose.',
    aprofundar: [
      'A distinção tem consequência terapêutica direta. Na coagulação intravascular disseminada, a fibrinólise é **secundária** ao consumo, e o antifibrinolítico é potencialmente perigoso porque pode agravar a trombose microvascular. Na hiperfibrinólise **primária** — como na leucemia promielocítica, em algumas hepatopatias e no trauma grave —, o antifibrinolítico é parte do tratamento. Confundir as duas em um paciente que sangra pode piorar o quadro.',
      'A deficiência congênita de alfa-2-antiplasmina é rara e produz um fenótipo hemorrágico peculiar: os testes de triagem da coagulação são normais, e o paciente sangra tardiamente depois de trauma ou cirurgia, porque o coágulo se forma normalmente e é dissolvido antes da cicatrização. É um dos poucos distúrbios em que a hemostasia primária e secundária estão intactas e o paciente ainda assim sangra.',
      'O plasminogênio deficiente produz um quadro completamente diferente e não hemorrágico: conjuntivite lenhosa, com depósitos de fibrina em mucosas que não são removidos. É um bom lembrete de que a fibrinólise não existe só para prevenir trombose — ela é essencial para a remodelação tecidual normal.',
    ],
    fisiologia: {
      oQueE: 'PDF: fragmentos gerados pela ação da plasmina sobre fibrina e fibrinogênio. Plasminogênio: zimogênio da plasmina. Alfa-2-antiplasmina: seu principal inibidor.',
      origem: 'Fígado (plasminogênio e alfa-2-antiplasmina); endotélio (ativador tecidual do plasminogênio).',
      funcao: 'Dissolver o coágulo de forma controlada e permitir remodelação tecidual.',
      orgaosEnvolvidos: ['Fígado', 'Endotélio'],
      percurso: [
        'Ativador tecidual do plasminogênio liberado pelo endotélio',
        'plasminogênio convertido em plasmina sobre a fibrina',
        'degradação da fibrina gerando D-dímero e outros fragmentos',
        'alfa-2-antiplasmina neutraliza a plasmina livre',
        'fibrinólise restrita ao coágulo',
      ],
    },
    aumento: {
      resumo: 'Fibrinólise ativa — secundária a consumo, primária por excesso de ativador, ou por falha do inibidor.',
      mecanismos: [
        {
          titulo: 'Fibrinólise secundária ao consumo',
          explicacao: 'A trombina gerada de forma difusa forma fibrina; a plasmina a degrada, gerando PDF e D-dímero em paralelo.',
          exemplos: [
            { causa: 'Coagulação intravascular disseminada', etapas: ['ativação difusa da coagulação', 'consumo de fatores e plaquetas', 'fibrinogênio ↓, D-dímero ↑↑, PDF ↑↑', 'sangramento e trombose microvascular simultâneos'], nota: 'Antifibrinolítico é geralmente contraindicado aqui.' },
          ],
        },
        {
          titulo: 'Hiperfibrinólise primária',
          explicacao: 'Excesso de ativador ou falta de inibidor faz a plasmina degradar fibrinogênio circulante mesmo sem coágulo formado.',
          exemplos: [
            { causa: 'Leucemia promielocítica aguda', etapas: ['anexina II no promielócito acelera a ativação do plasminogênio', 'plasmina livre degrada fibrinogênio', 'PDF ↑↑ com fibrinogênio muito baixo', 'sangramento desproporcional à plaquetopenia'] },
            { causa: 'Hepatopatia avançada e trauma grave', etapas: ['depuração reduzida do ativador tecidual e alfa-2-antiplasmina baixa', 'hiperfibrinólise', 'sangramento difuso'], nota: 'No trauma, o antifibrinolítico precoce reduz mortalidade.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Deficiência de plasminogênio (conjuntivite lenhosa) ou de alfa-2-antiplasmina (sangramento tardio com triagem normal).',
      mecanismos: [
        {
          titulo: 'Falha dos componentes do sistema fibrinolítico',
          explicacao: 'A falta do zimogênio impede a remoção de fibrina; a falta do inibidor permite fibrinólise descontrolada.',
          exemplos: [
            { causa: 'Deficiência de plasminogênio', etapas: ['fibrina não removida das mucosas', 'conjuntivite lenhosa e lesões pseudomembranosas', 'sem tendência trombótica sistêmica marcante'] },
            { causa: 'Deficiência de alfa-2-antiplasmina', etapas: ['plasmina livre não neutralizada', 'coágulo formado e dissolvido precocemente', 'sangramento tardio após trauma com triagem normal', 'resposta a antifibrinolítico'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A avaliação da CIVD', ids: ['d-dimero', 'fibrinogenio', 'plaquetas', 'inr'], leitura: 'Fibrinogênio caindo, D-dímero subindo, plaquetas caindo e INR alargando, em série, definem CIVD melhor que qualquer valor isolado.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['d-dimero', 'fibrinogenio', 'plaquetas'],
  },
]
