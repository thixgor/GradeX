import type { Marcador } from '../tipos'

/**
 * Marcadores cardíacos.
 *
 * Aqui a cinética é o conteúdo. Troponina elevada não significa infarto —
 * significa que morreu miócito, e existem dezenas de causas de morte de
 * miócito além da oclusão coronária. O que separa infarto de lesão miocárdica
 * crônica não é o valor, é a **curva**: elevação e queda com variação
 * significativa entre duas coletas, num contexto clínico compatível. É por
 * isso que as fichas deste grupo dedicam tanto espaço ao tempo.
 */
export const marcadores: Marcador[] = [
  {
    id: 'troponina',
    nome: 'Troponina',
    sigla: 'cTn',
    sinonimos: ['troponina t', 'troponina i', 'troponina ultrassensivel', 'hs-troponina', 'ctnt', 'ctni'],
    grupo: 'cardiaco',
    sistemas: ['cardiovascular'],
    material: 'Soro ou plasma',
    unidade: 'ng/L',
    referencias: [
      { rotulo: 'Percentil 99 (referência de corte)', texto: 'Depende do ensaio e do sexo', unidade: 'ng/L', observacao: 'Cada método tem seu próprio percentil 99, e há valores distintos para homens e mulheres. Usar sempre o corte informado pelo laboratório.' },
    ],
    resumo:
      'A proteína do aparelho contrátil do miócito. Sua presença no sangue significa que houve lesão miocárdica — o que não é sinônimo de infarto.',
    entenda:
      'As troponinas T e I cardíacas são específicas do miocárdio: não existem no músculo esquelético em formas detectáveis pelos ensaios atuais. Isso as tornou o padrão-ouro para detectar lesão miocárdica. O ganho de sensibilidade dos ensaios de alta sensibilidade veio com um custo interpretativo: hoje se detectam elevações mínimas em muitas condições sem doença coronária — insuficiência cardíaca, sepse, doença renal crônica, embolia pulmonar, taquiarritmias. O infarto exige, além da elevação, uma variação dinâmica entre coletas seriadas e um contexto de isquemia.',
    aprofundar: [
      'A definição universal de infarto exige duas condições simultâneas: elevação e/ou queda da troponina com pelo menos um valor acima do percentil 99, e evidência clínica de isquemia — sintoma, alteração eletrocardiográfica nova, alteração segmentar em imagem ou trombo à coronariografia. Sem o segundo componente, chama-se lesão miocárdica, não infarto. Essa distinção não é semântica: muda o tratamento inteiro, porque anticoagular e cateterizar um paciente com miocardite ou sepse não beneficia e pode prejudicar.',
      'Os protocolos de 0/1 hora e 0/3 horas usam a cinética para decidir rápido. Valores muito baixos na admissão, com dor iniciada há mais de 3 horas, permitem descartar infarto com alto valor preditivo negativo. Valores muito altos na admissão, ou uma variação (delta) significativa entre as duas coletas, confirmam lesão aguda. O que fica no meio — elevação estável, sem delta — aponta lesão crônica: insuficiência cardíaca, doença renal, hipertrofia. Ou seja, é a diferença entre duas dosagens, e não o número isolado, que carrega a informação diagnóstica.',
      'Na doença renal crônica a troponina é cronicamente elevada por redução do clearance e por lesão miocárdica subclínica associada à uremia e à sobrecarga. Isso não é falso-positivo: reflete lesão real e prediz mortalidade. Mas invalida o uso do percentil 99 como corte de infarto nesse grupo, e obriga a valorizar ainda mais a variação entre coletas.',
    ],
    fisiologia: {
      oQueE: 'Complexo proteico regulador da contração muscular, formado por três subunidades (C, I e T); as isoformas I e T do miocárdio são estruturalmente distintas das do músculo esquelético.',
      origem: 'Cardiomiócito — a maior parte ligada ao aparelho contrátil, com pequeno pool citoplasmático livre.',
      funcao: 'Regular a interação entre actina e miosina, mediada pelo cálcio, permitindo a contração.',
      metabolismo: 'Depuração renal e pelo sistema reticuloendotelial.',
      meiaVida: 'A liberação após lesão é bifásica: o pool citoplasmático sai primeiro, e a degradação lenta do aparelho contrátil mantém a elevação por 7 a 14 dias.',
      orgaosEnvolvidos: ['Coração', 'Rim (depuração)'],
      percurso: ['Lesão do cardiomiócito', 'liberação do pool citoplasmático (precoce)', 'degradação do aparelho contrátil (tardia)', 'troponina circulante por 7 a 14 dias'],
    },
    aumento: {
      resumo:
        'Qualquer coisa que mate ou lese miócito: isquemia por oclusão, desequilíbrio entre oferta e demanda, inflamação, sobrecarga, toxicidade ou redução do clearance renal.',
      significado:
        'Troponina elevada = lesão miocárdica. Se é infarto depende da curva e do contexto clínico — nunca do valor isolado.',
      mecanismos: [
        {
          titulo: 'Infarto tipo 1 — oclusão coronária',
          explicacao: 'Ruptura ou erosão de placa aterosclerótica com trombose oclui a artéria; o miocárdio a jusante necrosa.',
          exemplos: [
            { causa: 'Síndrome coronariana aguda', etapas: ['ruptura de placa', 'trombose coronária', 'isquemia e necrose miocárdica', 'liberação de troponina com curva de ascensão e queda'], nota: 'A curva é o que caracteriza: sobe em 1 a 3 horas, atinge o pico em 12 a 24 horas e permanece detectável por até 14 dias.' },
          ],
        },
        {
          titulo: 'Infarto tipo 2 — desequilíbrio entre oferta e demanda',
          explicacao: 'Não há oclusão: o miocárdio necrosa porque a demanda superou a oferta, ou a oferta caiu.',
          exemplos: [
            { causa: 'Taquiarritmia sustentada, anemia grave, hipotensão, sepse, crise hipertensiva, hipoxemia grave', etapas: ['demanda miocárdica ↑ ou oferta ↓', 'isquemia sem oclusão', 'necrose e troponina ↑'], nota: 'O tratamento é da causa desencadeante — cateterizar não resolve o que não é oclusão.' },
          ],
        },
        {
          titulo: 'Lesão miocárdica não isquêmica',
          explicacao: 'O miócito é lesado diretamente por inflamação, toxina, trauma ou sobrecarga mecânica.',
          exemplos: [
            { causa: 'Miocardite', etapas: ['inflamação do miocárdio', 'lesão de miócitos', 'troponina ↑ com coronárias normais'], nota: 'Jovem com dor torácica, troponina alta e supradesnivelamento difuso: pensar em miopericardite.' },
            { causa: 'Insuficiência cardíaca descompensada', etapas: ['estiramento e sobrecarga da parede', 'lesão subendocárdica', 'troponina ↑ com marcador prognóstico adverso'] },
            { causa: 'Embolia pulmonar', etapas: ['sobrecarga aguda do ventrículo direito', 'isquemia da parede livre do VD', 'troponina ↑'], nota: 'Sinaliza disfunção de VD e estratifica risco na embolia.' },
            { causa: 'Sepse, quimioterápicos cardiotóxicos, contusão cardíaca, cardioversão, ablação', etapas: ['lesão direta ou inflamatória do miócito', 'troponina ↑'] },
            { causa: 'Takotsubo', etapas: ['descarga catecolaminérgica', 'atordoamento miocárdico apical', 'troponina ↑ desproporcionalmente baixa para a extensão da alteração de contratilidade'], nota: 'A discordância entre troponina modesta e disfunção ventricular extensa é a pista.' },
          ],
        },
        {
          titulo: 'Redução do clearance',
          explicacao: 'A troponina é depurada pelo rim; com TFG baixa, ela se acumula.',
          exemplos: [{ causa: 'Doença renal crônica', etapas: ['clearance ↓ e lesão miocárdica subclínica', 'troponina cronicamente elevada e estável'], nota: 'Elevação estável, sem delta entre coletas, aponta cronicidade, não evento agudo.' }],
        },
      ],
      causas: {
        muitoComuns: ['Síndrome coronariana aguda', 'Insuficiência cardíaca descompensada', 'Doença renal crônica'],
        comuns: ['Taquiarritmias', 'Sepse', 'Embolia pulmonar'],
        menosComuns: ['Miocardite', 'Takotsubo', 'Contusão cardíaca'],
        naoEsquecer: ['Dissecção aórtica com acometimento coronário', 'Anticorpos heterófilos ou macrotroponina como falso-positivo'],
        emergencias: ['Infarto com supradesnivelamento de ST', 'Dissecção de aorta', 'Embolia pulmonar de alto risco'],
      },
    },
    comparacoes: [
      {
        id: 'lesao-aguda-vs-cronica',
        titulo: 'Lesão miocárdica aguda × crônica',
        pergunta: 'A troponina está alta. Isso aconteceu agora ou já estava assim?',
        hipoteses: ['Lesão aguda', 'Lesão crônica'],
        linhas: [
          { marcador: 'Delta entre coletas', celulas: ['variação significativa', 'estável'] },
          { marcador: 'Curva', celulas: ['ascensão e/ou queda', 'platô'] },
          { marcador: 'Contexto', celulas: ['dor, ECG alterado, instabilidade', 'assintomático ou sintoma crônico'] },
          { marcador: 'Causas típicas', celulas: ['infarto, miocardite, embolia, sepse', 'DRC, insuficiência cardíaca, hipertrofia'] },
        ],
        leitura:
          'É a segunda dosagem que diagnostica, não a primeira. Lesão aguda tem cinética: o miócito rompeu agora, então a concentração está mudando. Lesão crônica tem platô: a lesão de baixo grau é contínua e a taxa de liberação iguala a de depuração. Por isso o protocolo pede duas coletas — uma troponina isolada elevada, sem contexto e sem delta, não é diagnóstico de nada.',
      },
    ],
    relacionados: [
      { titulo: 'Na síndrome coronariana', ids: ['ck-mb', 'creatinina', 'hemoglobina'], leitura: 'Creatinina para interpretar o clearance e planejar contraste; hemoglobina porque anemia grave causa infarto tipo 2 e muda a estratégia antitrombótica.' },
      { titulo: 'Na dispneia', ids: ['bnp', 'nt-probnp', 'd-dimero'], leitura: 'Troponina e BNP elevados juntos apontam insuficiência cardíaca com lesão miocárdica; troponina com D-dímero alto levanta embolia pulmonar.' },
    ],
    interferentes: {
      preAnalitico: ['Hemólise interfere em alguns ensaios de troponina I.'],
      metodo: ['Anticorpos heterófilos, fator reumatoide e macrotroponina (complexo com imunoglobulina) causam falsos-positivos.', 'Biotina em altas doses interfere em ensaios de imunoensaio — comum em suplementos capilares.'],
    },
    cinetica: {
      inicio: 'Detectável em 1 a 3 horas com ensaios de alta sensibilidade.',
      pico: '12 a 24 horas.',
      normalizacao: '7 a 14 dias (troponina T tende a permanecer elevada mais tempo que a I).',
      tendencia: 'A variação entre duas coletas separadas por 1 a 3 horas é o que define lesão aguda — mais importante que qualquer valor isolado.',
    },
    normalizacao: [
      { cenario: 'Infarto tratado', caminho: 'A troponina cai à medida que o miocárdio necrosado é reabsorvido. Nova elevação após a queda sugere reinfarto ou nova lesão.', prazo: '7 a 14 dias.' },
      { cenario: 'Infarto tipo 2', caminho: 'Corrigir o desequilíbrio de oferta e demanda: tratar a arritmia, a anemia, a sepse, a hipotensão. A troponina cai com a causa.', prazo: 'Dias.' },
      { cenario: 'Elevação crônica na doença renal', caminho: 'Não normaliza. Passa a ser um novo basal, contra o qual futuras dosagens serão comparadas — e um marcador prognóstico.', prazo: 'Permanente.' },
    ],
    utilidade: ['diagnostico', 'prognostico', 'triagem'],
    padroes: ['sindrome-coronariana-aguda'],
    estudarTambem: ['ck-mb', 'bnp', 'd-dimero', 'creatinina'],
  },

  {
    id: 'ck-mb',
    nome: 'CK-MB',
    sinonimos: ['ckmb', 'creatinoquinase mb', 'cpk mb', 'fracao mb'],
    grupo: 'cardiaco',
    sistemas: ['cardiovascular'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [{ rotulo: 'Adultos (massa)', texto: '< 5', unidade: 'ng/mL', observacao: 'A relação CK-MB/CK total acima de 5% favorece origem miocárdica.' }],
    resumo:
      'Isoenzima da creatinoquinase enriquecida no miocárdio. Substituída pela troponina como exame de escolha, mas ainda útil por normalizar mais rápido.',
    entenda:
      'A CK-MB representa cerca de 20% da CK do miocárdio e de 1 a 3% da do músculo esquelético — por isso é sugestiva, mas não específica: rabdomiólise, miopatias e exercício extenuante podem elevá-la. Sua vantagem residual sobre a troponina é a cinética curta: normaliza em 48 a 72 horas, o que permite detectar reinfarto num paciente cuja troponina ainda está elevada do evento anterior.',
    fisiologia: {
      oQueE: 'Isoenzima dimérica da creatinoquinase, composta pelas subunidades M e B.',
      origem: 'Miocárdio (~20% da CK local) e, em menor proporção, músculo esquelético.',
      funcao: 'Catalisar a transferência de fosfato entre creatina e ADP, regenerando ATP no músculo em atividade.',
      meiaVida: 'Cerca de 12 horas.',
      percurso: ['Lesão do miócito', 'liberação de CK-MB', 'pico em 12 a 24 horas', 'normalização em 48 a 72 horas'],
    },
    aumento: {
      resumo: 'Lesão miocárdica, lesão de músculo esquelético e — mais raramente — neoplasias produtoras.',
      mecanismos: [
        {
          titulo: 'Lesão miocárdica',
          explicacao: 'A necrose do miócito libera a isoenzima.',
          exemplos: [{ causa: 'Infarto, miocardite, cardioversão, cirurgia cardíaca', etapas: ['necrose miocárdica', 'CK-MB ↑ com relação CK-MB/CK > 5%'], nota: 'A normalização rápida a torna útil para detectar reinfarto.' }],
        },
        {
          titulo: 'Lesão de músculo esquelético',
          explicacao: 'O músculo esquelético contém pouca CK-MB, mas em rabdomiólise a massa liberada é enorme.',
          exemplos: [{ causa: 'Rabdomiólise, exercício extenuante, miopatias, trauma muscular', etapas: ['lesão muscular maciça', 'CK total ↑↑↑ com CK-MB ↑ mas relação < 5%'], nota: 'A relação com a CK total é o que separa origem cardíaca de muscular.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Interprete junto', ids: ['troponina', 'ck'], leitura: 'A troponina é mais sensível e específica; a CK total contextualiza a CK-MB e revela origem muscular.' }],
    cinetica: { inicio: '3 a 6 horas', pico: '12 a 24 horas', normalizacao: '48 a 72 horas', tendencia: 'A normalização rápida é sua única vantagem sobre a troponina — permite diagnosticar reinfarto precoce.' },
    utilidade: ['diagnostico'],
    estudarTambem: ['troponina', 'ck'],
  },

  {
    id: 'ck',
    nome: 'Creatinoquinase total',
    sigla: 'CK',
    sinonimos: ['cpk', 'creatinofosfoquinase', 'creatinoquinase'],
    grupo: 'cardiaco',
    sistemas: ['cardiovascular', 'metabolico'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [
      { rotulo: 'Homens', minimo: 40, maximo: 320, unidade: 'U/L' },
      { rotulo: 'Mulheres', minimo: 25, maximo: 200, unidade: 'U/L', observacao: 'Massa muscular, etnia e atividade física deslocam bastante o basal.' },
    ],
    resumo: 'Enzima muscular. É o marcador de lesão de músculo esquelético — e o exame que define rabdomiólise.',
    entenda:
      'A CK existe em três isoformas: MM (músculo esquelético), MB (miocárdio) e BB (cérebro). A dosagem total reflete sobretudo a MM, então elevação isolada aponta músculo. Valores acima de cinco vezes o limite superior caracterizam rabdomiólise; acima de 5.000 U/L, o risco de lesão renal aguda por mioglobinúria torna-se relevante e a hidratação vigorosa é a intervenção que muda o desfecho.',
    fisiologia: {
      oQueE: 'Enzima que catalisa a transferência reversível de fosfato entre fosfocreatina e ADP.',
      origem: 'Músculo esquelético (predominante), miocárdio e cérebro.',
      funcao: 'Regenerar ATP rapidamente durante a contração muscular intensa.',
      meiaVida: 'Cerca de 36 horas.',
      percurso: ['Lesão da fibra muscular', 'liberação de CK e mioglobina', 'CK plasmática ↑', 'mioglobina filtrada — potencialmente nefrotóxica'],
    },
    aumento: {
      resumo: 'Lesão muscular de qualquer origem: exercício, trauma, medicamentos, miopatias, hipotireoidismo, isquemia.',
      mecanismos: [
        {
          titulo: 'Lesão da fibra muscular',
          explicacao: 'A ruptura do sarcolema despeja o conteúdo citoplasmático no plasma.',
          exemplos: [
            { causa: 'Rabdomiólise (trauma, compressão prolongada, exercício extremo, convulsão, hipertermia)', etapas: ['necrose muscular maciça', 'CK ↑↑↑, mioglobina ↑, potássio ↑, fósforo ↑, cálcio ↓', 'mioglobinúria e lesão renal aguda'], nota: 'Urina escura com fita positiva para sangue e sem hemácias no sedimento é mioglobinúria.' },
            { causa: 'Miopatia por estatinas', etapas: ['toxicidade muscular dose-dependente', 'mialgia com CK ↑'], nota: 'Elevação leve e assintomática é comum e não obriga a suspender; mialgia com CK acima de 10 vezes o normal, sim.' },
            { causa: 'Miopatias inflamatórias (polimiosite, dermatomiosite)', etapas: ['inflamação muscular autoimune', 'CK ↑ com fraqueza proximal'] },
            { causa: 'Hipotireoidismo', etapas: ['alteração do metabolismo muscular', 'CK ↑ com TSH ↑'], nota: 'CK elevada inexplicada pede dosagem de TSH — causa frequente e facilmente tratável.' },
            { causa: 'Injeção intramuscular, exercício intenso, convulsão', etapas: ['lesão muscular focal ou difusa', 'CK ↑ transitória'] },
          ],
        },
      ],
    },
    reducao: { resumo: 'Baixa massa muscular, imobilidade prolongada e corticoterapia — sem relevância clínica.', mecanismos: [] },
    relacionados: [
      { titulo: 'Na rabdomiólise', ids: ['creatinina', 'potassio', 'fosforo', 'calcio', 'mioglobina'], leitura: 'CK muito alta com potássio e fósforo altos, cálcio baixo e creatinina em elevação é o quadro completo — e o risco é renal e arrítmico.' },
      { titulo: 'Se a AST estiver alta com ALT normal', ids: ['ast'], leitura: 'AST alta com ALT normal aponta origem muscular: a CK confirma antes de qualquer investigação hepática.' },
    ],
    interferentes: {
      fisiologico: ['Exercício, massa muscular, etnia (valores basais mais altos em pessoas de ascendência africana) e injeção intramuscular elevam.'],
      medicamentos: ['Estatinas, fibratos, antipsicóticos (síndrome neuroléptica maligna), colchicina e zidovudina elevam.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['ck-mb', 'creatinina', 'potassio', 'ast'],
  },

  {
    id: 'bnp',
    nome: 'Peptídeo natriurético tipo B',
    sigla: 'BNP',
    sinonimos: ['peptideo natriuretico cerebral', 'bnp'],
    grupo: 'cardiaco',
    sistemas: ['cardiovascular'],
    material: 'Plasma com EDTA',
    unidade: 'pg/mL',
    referencias: [
      { rotulo: 'Improvável insuficiência cardíaca (agudo)', texto: '< 100', unidade: 'pg/mL' },
      { rotulo: 'Provável insuficiência cardíaca (agudo)', texto: '> 400', unidade: 'pg/mL' },
      { rotulo: 'Zona cinzenta', texto: '100 a 400', unidade: 'pg/mL', observacao: 'Exige interpretação clínica: idade, função renal, obesidade e fibrilação atrial deslocam os cortes.' },
    ],
    resumo:
      'Hormônio liberado pelo ventrículo em resposta ao estiramento da parede. É o exame que separa dispneia cardíaca de pulmonar na emergência.',
    entenda:
      'O BNP é sintetizado como pró-hormônio pelos miócitos ventriculares quando a pressão de enchimento aumenta. Sua ação é fisiologicamente compensatória: promove natriurese, vasodilatação e inibição do sistema renina-angiotensina-aldosterona — uma tentativa do coração de reduzir a própria sobrecarga. Clinicamente, seu maior valor é o valor preditivo negativo: BNP baixo em paciente com dispneia aguda torna a insuficiência cardíaca muito improvável.',
    fisiologia: {
      oQueE: 'Peptídeo de 32 aminoácidos derivado da clivagem do proBNP em BNP (ativo) e NT-proBNP (inativo).',
      origem: 'Miócitos ventriculares, sob estímulo do estiramento da parede.',
      funcao: 'Natriurese, diurese, vasodilatação e inibição do SRAA e do sistema simpático — contrarregulação da sobrecarga volêmica.',
      metabolismo: 'Degradado pela neprilisina e pelo receptor de clearance. É por isso que o sacubitril (inibidor da neprilisina) eleva o BNP e obriga a usar o NT-proBNP no acompanhamento.',
      meiaVida: 'Cerca de 20 minutos.',
      orgaosEnvolvidos: ['Ventrículos', 'Rim', 'Vasos'],
      percurso: ['Aumento da pressão de enchimento ventricular', 'estiramento do miócito', 'clivagem do proBNP', 'BNP + NT-proBNP no plasma', 'natriurese e vasodilatação'],
    },
    aumento: {
      resumo: 'Sobrecarga de pressão ou volume do ventrículo — de causa cardíaca ou pulmonar — e redução do clearance renal.',
      mecanismos: [
        {
          titulo: 'Estiramento ventricular',
          explicacao: 'A pressão de enchimento elevada distende o miócito, que responde secretando o peptídeo.',
          exemplos: [
            { causa: 'Insuficiência cardíaca descompensada', etapas: ['pressão de enchimento ↑', 'estiramento miocárdico', 'BNP ↑ proporcional à gravidade'], nota: 'Correlaciona-se com classe funcional e é marcador prognóstico independente.' },
            { causa: 'Embolia pulmonar, hipertensão pulmonar, cor pulmonale', etapas: ['sobrecarga do ventrículo direito', 'estiramento', 'BNP ↑'], nota: 'Na embolia, indica disfunção de VD e estratifica risco.' },
            { causa: 'Valvopatias, fibrilação atrial, hipertrofia ventricular', etapas: ['sobrecarga de pressão ou volume', 'BNP ↑'] },
          ],
        },
        {
          titulo: 'Redução do clearance',
          explicacao: 'A depuração é parcialmente renal.',
          exemplos: [{ causa: 'Doença renal crônica', etapas: ['clearance ↓', 'BNP ↑ sem descompensação cardíaca proporcional'], nota: 'Exige cortes mais altos para interpretar.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Obesidade reduz os níveis e pode gerar falso-negativo.',
      mecanismos: [
        {
          titulo: 'Depuração aumentada pelo tecido adiposo',
          explicacao: 'O adipócito expressa receptores de clearance de peptídeos natriuréticos.',
          exemplos: [{ causa: 'Obesidade', etapas: ['maior remoção pelo tecido adiposo', 'BNP mais baixo para o mesmo grau de sobrecarga'], nota: 'BNP "normal" em obeso com dispneia não afasta insuficiência cardíaca com a mesma segurança.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na dispneia aguda', ids: ['nt-probnp', 'troponina', 'd-dimero'], leitura: 'BNP separa dispneia cardíaca de pulmonar; troponina indica lesão miocárdica associada; D-dímero abre a hipótese de embolia.' },
      { titulo: 'Na insuficiência cardíaca crônica', ids: ['sodio', 'creatinina', 'hemoglobina'], leitura: 'Hiponatremia, piora de função renal e anemia são marcadores de gravidade e de prognóstico na insuficiência cardíaca.' },
    ],
    interferentes: {
      fisiologico: ['Idade avançada, sexo feminino e fibrilação atrial elevam; obesidade reduz.'],
      medicamentos: ['Sacubitril-valsartana eleva o BNP por inibir a neprilisina — nesses pacientes, acompanhar com NT-proBNP.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['insuficiencia-cardiaca'],
    estudarTambem: ['nt-probnp', 'troponina', 'sodio'],
  },

  {
    id: 'nt-probnp',
    nome: 'NT-proBNP',
    sinonimos: ['nt pro bnp', 'fragmento n terminal do probnp'],
    grupo: 'cardiaco',
    sistemas: ['cardiovascular'],
    material: 'Soro ou plasma',
    unidade: 'pg/mL',
    referencias: [
      { rotulo: 'Descarta IC aguda (< 50 anos)', texto: '< 300', unidade: 'pg/mL' },
      { rotulo: 'Sugere IC aguda — 50 a 75 anos', texto: '> 900', unidade: 'pg/mL' },
      { rotulo: 'Sugere IC aguda — > 75 anos', texto: '> 1.800', unidade: 'pg/mL', observacao: 'Os cortes sobem com a idade porque o valor basal aumenta fisiologicamente.' },
    ],
    resumo: 'O fragmento inativo liberado junto ao BNP. Tem meia-vida mais longa, é mais estável e não é afetado pelo sacubitril.',
    entenda:
      'BNP e NT-proBNP vêm da mesma clivagem, em quantidades equimolares. O NT-proBNP tem meia-vida de 60 a 120 minutos (contra 20 do BNP), o que o torna mais estável e menos sujeito a variação momentânea. Como não é substrato da neprilisina, é o exame de escolha em pacientes em uso de sacubitril-valsartana. Em compensação, depende mais do clearance renal, exigindo cortes mais altos em doença renal crônica.',
    fisiologia: {
      oQueE: 'Fragmento aminoterminal de 76 aminoácidos, biologicamente inativo, resultante da clivagem do proBNP.',
      origem: 'Miócitos ventriculares, em quantidade equimolar ao BNP.',
      funcao: 'Nenhuma atividade biológica — é apenas um marcador.',
      eliminacao: 'Predominantemente renal.',
      meiaVida: '60 a 120 minutos.',
      percurso: ['proBNP clivado', 'BNP (ativo) + NT-proBNP (inativo)', 'NT-proBNP depurado pelo rim'],
    },
    aumento: {
      resumo: 'As mesmas causas do BNP, com maior influência da função renal e da idade.',
      mecanismos: [
        {
          titulo: 'Estiramento ventricular e clearance reduzido',
          explicacao: 'A secreção acompanha a sobrecarga; a eliminação depende do rim.',
          exemplos: [
            { causa: 'Insuficiência cardíaca, embolia pulmonar, valvopatia, fibrilação atrial', etapas: ['sobrecarga ventricular', 'NT-proBNP ↑'] },
            { causa: 'Doença renal crônica', etapas: ['clearance ↓', 'NT-proBNP ↑ desproporcional'], nota: 'Com TFG < 60, usar cortes mais altos.' },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Escolha entre os dois', ids: ['bnp', 'creatinina'], leitura: 'Em uso de sacubitril, use NT-proBNP. Com disfunção renal importante, ambos sobem e exigem cortes ajustados.' }],
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['insuficiencia-cardiaca'],
    estudarTambem: ['bnp', 'troponina', 'creatinina'],
  },

  {
    id: 'mioglobina',
    nome: 'Mioglobina',
    sinonimos: ['mioglobina serica', 'mioglobinuria'],
    grupo: 'cardiaco',
    sistemas: ['cardiovascular', 'renal'],
    material: 'Soro ou urina',
    unidade: 'ng/mL',
    referencias: [{ rotulo: 'Adultos', texto: '< 90', unidade: 'ng/mL' }],
    resumo:
      'Proteína de armazenamento de oxigênio do músculo. Sobe muito precocemente após lesão muscular, mas não distingue coração de músculo esquelético.',
    entenda:
      'A mioglobina é pequena e sai rapidamente da célula lesada, sendo detectável em 1 a 3 horas — mais cedo que qualquer outro marcador. Essa precocidade perdeu relevância diante das troponinas de alta sensibilidade, e sua total falta de especificidade cardíaca a tirou do algoritmo do infarto. Seu papel hoje é outro: na rabdomiólise, a mioglobina filtrada precipita nos túbulos e causa lesão renal aguda — e é ela que explica a urina escura com fita positiva para sangue e sedimento sem hemácias.',
    fisiologia: {
      oQueE: 'Hemoproteína monomérica de baixo peso molecular que armazena oxigênio no músculo.',
      origem: 'Músculo esquelético e cardíaco.',
      funcao: 'Reservatório intracelular de oxigênio, facilitando sua difusão até a mitocôndria.',
      eliminacao: 'Filtração glomerular livre; em altas concentrações, precipita nos túbulos e é diretamente nefrotóxica.',
      meiaVida: '2 a 3 horas.',
      percurso: ['Lesão muscular', 'mioglobina no plasma', 'filtração glomerular', 'precipitação tubular em altas concentrações', 'lesão renal aguda'],
    },
    aumento: {
      resumo: 'Qualquer lesão muscular — esquelética ou cardíaca — e redução do clearance renal.',
      mecanismos: [
        {
          titulo: 'Lesão muscular',
          explicacao: 'A proteína é pequena e escapa rapidamente da célula lesada.',
          exemplos: [
            { causa: 'Rabdomiólise', etapas: ['necrose muscular', 'mioglobina ↑↑', 'mioglobinúria', 'obstrução e toxicidade tubular', 'lesão renal aguda'], nota: 'A hidratação precoce e vigorosa é a intervenção que muda o desfecho renal.' },
            { causa: 'Infarto agudo do miocárdio', etapas: ['necrose miocárdica', 'mioglobina ↑ em 1 a 3 horas'], nota: 'Precoce, porém inespecífica — a troponina a substituiu.' },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Na rabdomiólise', ids: ['ck', 'creatinina', 'potassio', 'eas'], leitura: 'CK confirma a lesão muscular; a fita positiva para sangue sem hemácias no sedimento confirma a mioglobinúria; creatinina e potássio medem a consequência.' }],
    cinetica: { inicio: '1 a 3 horas', pico: '6 a 12 horas', normalizacao: '24 horas' },
    utilidade: ['diagnostico'],
    estudarTambem: ['ck', 'creatinina', 'troponina'],
  },
]
