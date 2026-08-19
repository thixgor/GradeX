import type { Marcador } from '../tipos'

/**
 * Série vermelha, série branca e plaquetas.
 *
 * O hemograma é o exame mais pedido da medicina e o mais mal lido: quase todo
 * mundo aprende a decorar que "hemoglobina baixa é anemia" e para por aí. Aqui
 * a ordem é outra — cada índice existe porque responde a uma pergunta
 * específica sobre a produção, o tamanho ou a sobrevida da célula, e é a
 * combinação deles que dá o diagnóstico. Por isso as fichas de VCM, RDW e
 * reticulócitos são tão longas quanto a da hemoglobina: são elas que separam
 * as anemias umas das outras.
 */
export const marcadores: Marcador[] = [
  /* ─────────────────────────── Série vermelha ─────────────────────────── */
  {
    id: 'hemoglobina',
    nome: 'Hemoglobina',
    sigla: 'Hb',
    sinonimos: ['hb', 'hemoglobina serica', 'dosagem de hemoglobina'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: 'g/dL',
    referencias: [
      { rotulo: 'Homens adultos', minimo: 13, maximo: 17, unidade: 'g/dL' },
      { rotulo: 'Mulheres adultas', minimo: 12, maximo: 16, unidade: 'g/dL' },
      { rotulo: 'Gestantes', minimo: 11, maximo: 14, unidade: 'g/dL', observacao: 'A expansão do volume plasmático dilui a hemoglobina: o limite inferior cai fisiologicamente na gestação.' },
      { rotulo: 'Crianças (6 meses a 5 anos)', minimo: 11, maximo: 14, unidade: 'g/dL' },
      { rotulo: 'Recém-nascido', minimo: 14, maximo: 22, unidade: 'g/dL', observacao: 'Nasce policitêmico e cai até a "anemia fisiológica" dos 2 a 3 meses.' },
    ],
    resumo:
      'A proteína que carrega oxigênio dentro da hemácia. É ela — e não o número de hemácias — que define se existe anemia.',
    entenda:
      'Cada hemácia é essencialmente um saco de hemoglobina: uma proteína de quatro cadeias globínicas, cada uma abraçando um grupo heme com um átomo de ferro no centro. É esse ferro que liga o oxigênio no pulmão e o solta no tecido. Quando a hemoglobina cai, cai a capacidade de transportar oxigênio — e o organismo compensa com taquicardia, aumento do débito cardíaco e desvio da curva de dissociação. Anemia, por definição, é queda da hemoglobina; contagem de hemácias e hematócrito ajudam, mas o diagnóstico é feito por ela.',
    aprofundar: [
      'A molécula é um tetrâmero. No adulto, 97% é HbA (α2β2), 2 a 3% é HbA2 (α2δ2) e menos de 1% é HbF (α2γ2). A proporção entre elas é o que a eletroforese de hemoglobina mede — e é por isso que ela resolve talassemias e hemoglobinopatias que o hemograma apenas sugere: na beta-talassemia menor a HbA2 sobe acima de 3,5%, porque as cadeias delta compensam parcialmente a produção deficiente de beta.',
      'A ligação do oxigênio é cooperativa: a primeira molécula de O₂ que se liga muda a conformação do tetrâmero e facilita a ligação das seguintes. Daí a curva de dissociação em S. Acidose, hipercapnia, febre e aumento do 2,3-DPG deslocam a curva para a direita (a hemoglobina solta oxigênio mais facilmente no tecido) — efeito Bohr. Isso explica por que um paciente cronicamente anêmico tolera hemoglobinas que derrubariam alguém com anemia aguda: houve tempo para o 2,3-DPG subir e para o débito cardíaco se ajustar.',
      'A produção é comandada pela eritropoetina, secretada pelas células intersticiais peritubulares do rim quando o sensor de oxigênio renal (via HIF-2α) percebe hipóxia. Isso liga três informações que o laboratório separa em exames diferentes: rim doente produz pouca EPO e gera anemia normocítica; hipóxia crônica (DPOC, apneia, altitude) produz EPO em excesso e gera policitemia secundária; e a policitemia vera produz hemácias com EPO baixa, porque a mutação JAK2 dispensa o estímulo.',
      'Hemoglobina é concentração, não massa. Todo estado que muda o volume plasmático muda o número sem que uma única hemácia tenha sido criada ou destruída: desidratação concentra e "melhora" falsamente a hemoglobina; hiper-hidratação, gestação e insuficiência cardíaca diluem e criam pseudoanemia. É por isso que a hemoglobina de um paciente em choque hemorrágico agudo pode estar normal na primeira hora — a perda foi de sangue inteiro, e ainda não houve tempo para o líquido intersticial diluir o que restou.',
    ],
    fisiologia: {
      oQueE: 'Proteína tetramérica intraeritrocitária de transporte de oxigênio, com um átomo de ferro ferroso em cada um dos quatro grupos heme.',
      origem: 'Sintetizada nos precursores eritroides da medula óssea (do proeritroblasto ao reticulócito), a partir de ferro, protoporfirina IX e cadeias de globina.',
      sintese: 'A síntese do heme começa na mitocôndria (ALA-sintase, o passo limitante, dependente de vitamina B6) e termina com a incorporação do ferro pela ferroquelatase. As globinas são traduzidas no citoplasma. A montagem exige que os dois lados cheguem juntos: falta ferro e sobra protoporfirina; falta globina e sobra ferro.',
      circulacao: 'Confinada dentro da hemácia. A pequena fração que escapa no plasma por hemólise fisiológica é capturada pela haptoglobina — motivo pelo qual a haptoglobina cai quando há hemólise.',
      funcao: 'Transportar oxigênio do pulmão ao tecido e participar do transporte de CO₂ e do tamponamento do pH sanguíneo.',
      metabolismo: 'Ao fim dos ~120 dias, o macrófago esplênico fagocita a hemácia senescente, degrada o heme pela heme-oxigenase em biliverdina (depois bilirrubina indireta) e recicla o ferro para a transferrina.',
      eliminacao: 'O ferro é reciclado, quase sem perda; o anel porfirínico vira bilirrubina e é excretado pela bile.',
      meiaVida: 'A hemácia vive cerca de 120 dias — daí a HbA1c refletir a glicemia dos últimos 2 a 3 meses.',
      orgaosEnvolvidos: ['Medula óssea', 'Rim (eritropoetina)', 'Baço', 'Fígado', 'Intestino (absorção de ferro)'],
      percurso: [
        'Rim detecta hipóxia',
        'Eritropoetina',
        'Medula óssea: eritropoese',
        'Reticulócito no sangue',
        'Hemácia madura (120 dias)',
        'Macrófago esplênico',
        'Ferro reciclado + bilirrubina indireta',
      ],
    },
    aumento: {
      resumo:
        'Ou existe hemácia demais (policitemia verdadeira), ou existe plasma de menos (hemoconcentração). Separar as duas é o primeiro passo, e não exige exame sofisticado — exige perguntar sobre volemia.',
      significado:
        'Hemoglobina alta aumenta a viscosidade sanguínea e o risco trombótico. O sintoma não vem da falta de oxigênio, vem do sangue mais espesso.',
      mecanismos: [
        {
          titulo: 'Hemoconcentração — plasma de menos',
          explicacao:
            'A massa de hemácias não mudou; o denominador encolheu. Como hemoglobina é concentração, o número sobe sem que exista policitemia.',
          exemplos: [
            { causa: 'Desidratação', etapas: ['perda de água livre', 'queda do volume plasmático', 'mesma massa eritrocitária em menos plasma', 'Hb e Ht ↑'], nota: 'Ureia e sódio costumam subir junto — é a pista de que se trata de concentração, não de produção.' },
            { causa: 'Diurético em dose alta', etapas: ['depleção de volume', 'contração do plasma', 'Hb ↑ relativa'] },
            { causa: 'Grande queimado, vômitos e diarreia profusos', etapas: ['perda de plasma ou de água', 'hemoconcentração', 'Hb ↑'] },
          ],
        },
        {
          titulo: 'Policitemia secundária — eritropoetina alta',
          explicacao:
            'A hipóxia tecidual crônica é lida pelo rim como ordem de produzir mais hemácias. A medula obedece: a policitemia é apropriada ao estímulo, e o marcador de que é secundária é a EPO alta ou normal-alta.',
          exemplos: [
            { causa: 'DPOC, apneia obstrutiva do sono, cardiopatia cianótica', etapas: ['hipoxemia crônica', 'HIF-2α estabilizado no rim', 'EPO ↑', 'eritropoese ↑', 'Hb ↑'] },
            { causa: 'Tabagismo pesado', etapas: ['carboxi-hemoglobina ocupa sítios de O₂', 'hipóxia tecidual funcional', 'EPO ↑', 'Hb ↑'], nota: 'A oximetria de pulso pode estar normal: ela não distingue oxi de carboxi-hemoglobina.' },
            { causa: 'Grandes altitudes', etapas: ['pressão parcial de O₂ ambiente baixa', 'hipóxia', 'EPO ↑', 'Hb ↑'], nota: 'Adaptação fisiológica, não doença — o intervalo de referência da população local é mais alto.' },
            { causa: 'Tumores produtores de EPO (carcinoma renal, hepatocarcinoma, hemangioblastoma)', etapas: ['secreção ectópica ou inapropriada de EPO', 'estímulo medular sem hipóxia', 'Hb ↑'] },
            { causa: 'Uso de eritropoetina exógena ou testosterona', etapas: ['estímulo farmacológico da eritropoese', 'Hb ↑'] },
          ],
        },
        {
          titulo: 'Policitemia primária — medula autônoma',
          explicacao:
            'A célula progenitora ganhou uma mutação que dispensa o estímulo da EPO. A produção deixa de responder ao que o corpo precisa.',
          exemplos: [
            { causa: 'Policitemia vera', etapas: ['mutação JAK2 V617F', 'sinalização do receptor de EPO constitutivamente ativa', 'eritropoese autônoma', 'Hb ↑↑ com EPO baixa'], nota: 'EPO sérica baixa com hemoglobina alta é praticamente a assinatura da doença — o oposto do que se vê na policitemia secundária.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Desidratação', 'Tabagismo', 'Apneia obstrutiva do sono'],
        comuns: ['DPOC', 'Uso de testosterona', 'Diuréticos'],
        menosComuns: ['Policitemia vera', 'Cardiopatia congênita cianótica', 'Residência em grande altitude'],
        naoEsquecer: ['Tumor produtor de eritropoetina', 'Uso de EPO ou de anabolizantes não declarado'],
        emergencias: ['Hiperviscosidade sintomática (alteração visual, confusão, trombose)'],
      },
    },
    reducao: {
      resumo:
        'Anemia. Existem exatamente quatro caminhos: produz-se pouco, perde-se sangue, destrói-se a hemácia, ou dilui-se o que existe. Todo diagnóstico de anemia é a escolha entre esses quatro.',
      significado:
        'A queda da capacidade de transporte de oxigênio. Os sintomas dependem menos do valor absoluto que da velocidade da queda: 7 g/dL instalados em meses é tolerado; 9 g/dL instalados em horas descompensa.',
      mecanismos: [
        {
          titulo: 'Produção reduzida',
          explicacao:
            'A medula não consegue fabricar. Ou falta matéria-prima (ferro, B12, folato), ou falta estímulo (EPO), ou a fábrica está doente ou ocupada. A pista é o reticulócito baixo: a medula não está respondendo.',
          exemplos: [
            { causa: 'Deficiência de ferro', etapas: ['estoque de ferro esgotado', 'síntese de heme limitada', 'eritrócitos saem pequenos e pálidos', 'VCM ↓, HCM ↓, RDW ↑', 'Hb ↓'], nota: 'É a causa mais comum de anemia no mundo. Em homem adulto e em mulher pós-menopausa, presume-se perda digestiva até prova em contrário.' },
            { causa: 'Deficiência de vitamina B12 ou folato', etapas: ['síntese de DNA prejudicada no precursor eritroide', 'núcleo amadurece mais devagar que o citoplasma', 'eritropoese ineficaz e macrocitose', 'VCM ↑, Hb ↓'], nota: 'Vem com LDH alto e bilirrubina indireta alta pela destruição intramedular — imita hemólise sem sangramento nem icterícia franca.' },
            { causa: 'Doença renal crônica', etapas: ['massa de células peritubulares reduzida', 'EPO ↓', 'estímulo medular insuficiente', 'anemia normocítica normocrômica'], nota: 'Costuma acompanhar a queda da TFG a partir do estágio 3.' },
            { causa: 'Anemia de doença crônica / da inflamação', etapas: ['IL-6 ↑', 'hepcidina ↑', 'ferroportina internalizada', 'ferro sequestrado no macrófago e absorção intestinal bloqueada', 'ferro sérico ↓ com ferritina ↑', 'Hb ↓'], nota: 'O ferro existe — está preso. Por isso a ferritina não cai: ela é reagente de fase aguda e sobe justamente quando o ferro fica indisponível.' },
            { causa: 'Aplasia medular, mielodisplasia, infiltração neoplásica', etapas: ['falência ou substituição do tecido hematopoético', 'produção de todas as séries comprometida', 'citopenias'], nota: 'Quando cai mais de uma série, a suspeita muda de nutricional para medular.' },
            { causa: 'Hipotireoidismo', etapas: ['queda da demanda metabólica de oxigênio', 'menor estímulo à eritropoese', 'anemia normo ou macrocítica leve'] },
          ],
        },
        {
          titulo: 'Perda sanguínea',
          explicacao:
            'Sai sangue inteiro — hemácia, plasma e ferro juntos. No agudo, a hemoglobina demora horas a cair, porque a concentração só muda depois da reposição de volume. No crônico, o que se esgota primeiro é o ferro.',
          exemplos: [
            { causa: 'Hemorragia digestiva', etapas: ['perda de sangue no lúmen', 'reabsorção proteica intestinal', 'ureia ↑ com creatinina normal', 'Hb ↓ e ferro ↓ com o tempo'], nota: 'Ureia desproporcionalmente alta com creatinina normal é uma pista clássica de sangramento digestivo alto.' },
            { causa: 'Sangramento menstrual aumentado', etapas: ['perda crônica de ferro', 'estoque esgotado', 'anemia ferropriva'], nota: 'A causa mais comum de ferropenia em mulher em idade fértil.' },
            { causa: 'Trauma, cirurgia, ruptura de aneurisma', etapas: ['perda aguda de volume', 'após reposição volêmica, diluição', 'Hb ↓'] },
          ],
        },
        {
          titulo: 'Destruição aumentada — hemólise',
          explicacao:
            'A hemácia é fabricada, sai, e é destruída antes dos 120 dias. A medula responde aumentando a produção, então o reticulócito sobe. O conteúdo da hemácia rompida aparece no plasma: LDH sobe, bilirrubina indireta sobe, haptoglobina cai porque é consumida ligando a hemoglobina livre.',
          exemplos: [
            { causa: 'Anemia hemolítica autoimune', etapas: ['autoanticorpo contra antígenos eritrocitários', 'opsonização e captura esplênica', 'hemólise extravascular', 'Coombs direto positivo'], nota: 'Esferócitos no esfregaço e Coombs direto positivo definem o quadro.' },
            { causa: 'Esferocitose hereditária', etapas: ['defeito de proteínas do citoesqueleto (espectrina, anquirina)', 'perda de membrana e forma esférica', 'baço retém e destrói', 'hemólise crônica'], nota: 'CHCM elevado é a pista do hemograma — é dos poucos contextos em que a CHCM sobe de verdade.' },
            { causa: 'Anemia falciforme e outras hemoglobinopatias', etapas: ['HbS polimeriza em desoxigenação', 'hemácia se deforma e enrijece', 'hemólise e vaso-oclusão'] },
            { causa: 'Microangiopatia trombótica (PTT, SHU, CIVD)', etapas: ['trombos de fibrina/plaquetas na microcirculação', 'hemácia é cortada ao passar', 'esquizócitos e hemólise intravascular', 'plaquetas ↓'], nota: 'Anemia hemolítica com plaquetopenia e esquizócitos é emergência: PTT não espera investigação completa.' },
            { causa: 'Deficiência de G6PD após estresse oxidativo', etapas: ['incapacidade de regenerar glutationa reduzida', 'oxidação da hemoglobina (corpúsculos de Heinz)', 'hemólise aguda após infecção, fava ou fármaco oxidante'] },
          ],
        },
        {
          titulo: 'Diluição — plasma demais',
          explicacao:
            'A massa eritrocitária está intacta; o plasma aumentou. É pseudoanemia: nenhuma célula foi perdida, o denominador cresceu.',
          exemplos: [
            { causa: 'Gestação', etapas: ['expansão do volume plasmático em ~40%', 'aumento menor da massa eritrocitária', 'Hb ↓ fisiológica'], nota: 'Por isso a referência da gestante é mais baixa — chamar isso de anemia sem investigar ferro é erro nos dois sentidos.' },
            { causa: 'Hiper-hidratação, insuficiência cardíaca congestiva, cirrose com ascite', etapas: ['retenção hídrica', 'expansão plasmática', 'Hb ↓ relativa'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Deficiência de ferro', 'Anemia da inflamação/doença crônica', 'Sangramento menstrual aumentado'],
        comuns: ['Doença renal crônica', 'Deficiência de B12 ou folato', 'Hemorragia digestiva crônica'],
        menosComuns: ['Talassemias', 'Anemias hemolíticas', 'Mielodisplasia'],
        naoEsquecer: ['Neoplasia digestiva em homem ou mulher pós-menopausa com ferropenia', 'Doença celíaca', 'Anemia hemolítica autoimune associada a linfoproliferação'],
        emergencias: ['Sangramento ativo', 'Hemólise aguda com instabilidade', 'Microangiopatia trombótica (PTT/SHU)'],
      },
    },
    diferenciais: [
      { hipotese: 'Anemia ferropriva', pistas: ['VCM ↓', 'HCM ↓', 'RDW ↑ precoce', 'plaquetas frequentemente ↑'], comoConfirmar: 'Ferritina baixa fecha o diagnóstico. Com inflamação concomitante, use saturação de transferrina < 20% e receptor solúvel de transferrina.' },
      { hipotese: 'Talassemia menor', pistas: ['VCM muito baixo para o grau de anemia', 'RDW normal', 'contagem de hemácias normal ou alta'], comoConfirmar: 'Eletroforese de hemoglobina (HbA2 > 3,5% na beta-talassemia menor) com ferritina normal.' },
      { hipotese: 'Anemia da inflamação', pistas: ['normocítica na maioria', 'ferritina ↑', 'ferro sérico ↓', 'saturação ↓'], comoConfirmar: 'Contexto inflamatório com PCR/VHS elevados e ferritina não baixa.' },
      { hipotese: 'Anemia megaloblástica', pistas: ['VCM ↑↑', 'neutrófilos hipersegmentados', 'LDH ↑', 'bilirrubina indireta ↑'], comoConfirmar: 'B12 e folato séricos; se limítrofes, ácido metilmalônico e homocisteína.' },
      { hipotese: 'Hemólise', pistas: ['reticulócitos ↑', 'LDH ↑', 'haptoglobina ↓', 'bilirrubina indireta ↑'], comoConfirmar: 'Coombs direto separa imune de não imune; esfregaço mostra esquizócitos ou esferócitos.' },
    ],
    comparacoes: [
      {
        id: 'ferropriva-vs-talassemia-vs-doenca-cronica',
        titulo: 'Anemia ferropriva × Talassemia menor × Anemia da inflamação',
        pergunta: 'As três podem cursar com hemoglobina baixa e VCM baixo. O que separa uma da outra?',
        hipoteses: ['Ferropriva', 'Talassemia menor', 'Anemia da inflamação'],
        linhas: [
          { marcador: 'VCM', celulas: ['↓', '↓↓ (desproporcional)', 'normal ou ↓ leve'] },
          { marcador: 'RDW', celulas: ['↑', 'normal', 'normal ou ↑ leve'] },
          { marcador: 'Contagem de hemácias', celulas: ['↓', 'normal ou ↑', '↓'] },
          { marcador: 'Ferritina', celulas: ['↓', 'normal', '↑ ou normal'] },
          { marcador: 'Ferro sérico', celulas: ['↓', 'normal', '↓'] },
          { marcador: 'Transferrina / TIBC', celulas: ['↑', 'normal', '↓'] },
          { marcador: 'Saturação da transferrina', celulas: ['↓↓', 'normal', '↓'] },
          { marcador: 'Eletroforese de Hb', celulas: ['normal', 'HbA2 ↑ (beta)', 'normal'] },
        ],
        leitura:
          'O eixo que resolve é o estoque de ferro. Na ferropriva ele acabou: ferritina baixa, e o corpo responde fabricando mais transportador (transferrina alta) para catar o pouco que existe. Na inflamação o ferro existe, mas está sequestrado pela hepcidina dentro do macrófago: ferro sérico baixo com ferritina alta e transferrina baixa. Na talassemia o ferro está normal — o defeito é na cadeia de globina, então a hemácia sai pequena mas em quantidade normal, e o RDW não sobe porque toda a população é uniformemente pequena.',
        limites:
          'Ferropenia e inflamação coexistem com frequência (doença inflamatória intestinal, neoplasia, insuficiência cardíaca). Nesse cenário a ferritina perde o poder de excluir ferropenia e valores até 100 ng/mL não afastam deficiência.',
      },
      {
        id: 'hemolise-vs-perda-vs-producao',
        titulo: 'Hemólise × Perda sanguínea × Produção reduzida',
        pergunta: 'A hemoglobina caiu. Por onde a hemácia se foi — ou nunca chegou a existir?',
        hipoteses: ['Hemólise', 'Perda sanguínea', 'Produção reduzida'],
        linhas: [
          { marcador: 'Reticulócitos', celulas: ['↑↑', '↑ (após 3–5 dias)', '↓ ou inapropriadamente normal'] },
          { marcador: 'LDH', celulas: ['↑', 'normal', 'normal (↑ na megaloblástica)'] },
          { marcador: 'Haptoglobina', celulas: ['↓↓', 'normal', 'normal'] },
          { marcador: 'Bilirrubina indireta', celulas: ['↑', 'normal', 'normal (↑ na megaloblástica)'] },
          { marcador: 'Ferritina', celulas: ['normal ou ↑', '↓ se crônica', 'variável'] },
          { marcador: 'Esfregaço', celulas: ['esquizócitos/esferócitos', 'inespecífico', 'conforme a causa'] },
        ],
        leitura:
          'O reticulócito responde à pergunta "a medula está tentando?". Alto significa medula competente reagindo a uma perda — por destruição ou por sangramento. A partir daí, o que separa hemólise de sangramento é o conteúdo da hemácia no plasma: LDH e bilirrubina indireta sobem e a haptoglobina é consumida somente quando a célula se rompeu dentro do corpo. Reticulócito baixo diante de anemia significa que a fábrica é o problema.',
        limites:
          'A anemia megaloblástica imita hemólise (LDH e bilirrubina indireta altos) porque há destruição intramedular dos precursores — mas o reticulócito é baixo, e isso a desmascara.',
      },
    ],
    relacionados: [
      { titulo: 'Para classificar a anemia', ids: ['vcm', 'hcm', 'rdw', 'reticulocitos'], leitura: 'VCM define o tamanho, RDW diz se a população é uniforme e o reticulócito diz se a medula está respondendo. Esses três, lidos juntos, já dividem as anemias em grupos antes de qualquer exame adicional.' },
      { titulo: 'Para investigar ferro', ids: ['ferritina', 'ferro-serico', 'transferrina', 'saturacao-transferrina'], leitura: 'Ferritina é estoque, ferro sérico é o que circula agora, transferrina é a capacidade de transporte. Só o conjunto separa falta de ferro de ferro sequestrado.' },
      { titulo: 'Para investigar hemólise', ids: ['ldh', 'haptoglobina', 'bilirrubina-indireta', 'reticulocitos'], leitura: 'LDH e bilirrubina indireta sobem porque o conteúdo da hemácia vazou; a haptoglobina cai porque foi consumida. Os quatro juntos formam o painel de hemólise.' },
    ],
    interferentes: {
      preAnalitico: [
        'Coleta com garrote prolongado hemoconcentra localmente e eleva falsamente Hb e Ht.',
        'Coleta acima de acesso venoso com infusão dilui a amostra e produz pseudoanemia grave.',
        'Amostra coagulada ou com EDTA insuficiente altera todos os índices.',
      ],
      fisiologico: [
        'Sexo: a testosterona estimula a eritropoese — daí a referência masculina ser mais alta.',
        'Gestação: dilui fisiologicamente a partir do 2º trimestre.',
        'Altitude e tabagismo elevam o valor basal da população.',
        'Postura: em pé por 15 minutos concentra e eleva a Hb em até 5%.',
      ],
      medicamentos: [
        'Eritropoetina, testosterona e anabolizantes elevam.',
        'Quimioterápicos, antirretrovirais (zidovudina), metotrexato e linezolida reduzem.',
        'Metildopa e betalactâmicos podem provocar hemólise imune medicamentosa.',
      ],
      metodo: ['Hiperleucocitose extrema, crioaglutininas e lipemia interferem na leitura fotométrica e podem falsear a hemoglobina para cima.'],
    },
    cinetica: {
      inicio: 'Em hemorragia aguda, a hemoglobina só começa a cair quando o líquido intersticial redistribui — costuma levar de 4 a 12 horas, e a reposição volêmica antecipa a queda.',
      normalizacao: 'Com a causa corrigida e matéria-prima disponível, a medula produz cerca de 1 g/dL por semana; o reticulócito sobe antes, em 3 a 5 dias.',
      tendencia: 'Duas hemoglobinas separadas por horas valem mais que uma: a estabilidade afasta sangramento ativo com muito mais segurança que um valor isolado normal.',
    },
    normalizacao: [
      { cenario: 'Anemia por deficiência de ferro', caminho: 'Confirmar a deficiência, repor ferro e — sempre — investigar de onde o ferro está saindo. Repor sem procurar a fonte trata o número e deixa a causa.', prazo: 'Reticulócitos sobem em 5 a 7 dias; hemoglobina normaliza em 6 a 8 semanas; o estoque leva mais 3 a 6 meses.' },
      { cenario: 'Anemia por hemodiluição (gestação, sobrecarga hídrica)', caminho: 'Corrigir o estado volêmico quando patológico. Na gestação não há o que corrigir — há que reconhecer como fisiológico e garantir ferro adequado.', prazo: 'Acompanha a resolução da causa.' },
      { cenario: 'Anemia da inflamação', caminho: 'Tratar a doença de base. A hepcidina cai quando a IL-6 cai, e o ferro volta a circular. Ferro isolado, sem controlar a inflamação, corrige pouco.', prazo: 'Semanas após o controle da doença.' },
      { cenario: 'Anemia por sangramento agudo', caminho: 'Controlar o foco e repor conforme a clínica. O número volta pela produção medular, não pela transfusão isolada — que é ponte, não tratamento.', prazo: 'Dias a semanas, dependendo da reserva de ferro.' },
    ],
    utilidade: ['diagnostico', 'rastreamento', 'acompanhamento'],
    padroes: ['anemia-microcitica-hipocromica', 'anemia-macrocitica', 'hemolise'],
    doencas: ['anemia-ferropriva', 'anemia-megaloblastica', 'hemolise-autoimune', 'doenca-renal-cronica'],
    estudarTambem: ['vcm', 'rdw', 'reticulocitos', 'ferritina', 'ldh'],
  },

  {
    id: 'hematocrito',
    nome: 'Hematócrito',
    sigla: 'Ht',
    sinonimos: ['ht', 'hct', 'volume globular'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: '%',
    referencias: [
      { rotulo: 'Homens adultos', minimo: 39, maximo: 50, unidade: '%' },
      { rotulo: 'Mulheres adultas', minimo: 35, maximo: 45, unidade: '%' },
      { rotulo: 'Gestantes', minimo: 33, maximo: 42, unidade: '%' },
    ],
    resumo:
      'A fração do volume de sangue ocupada por hemácias. Anda junto com a hemoglobina e é ainda mais sensível ao estado de hidratação.',
    entenda:
      'Nos contadores automáticos o hematócrito não é medido diretamente: é calculado como o número de hemácias multiplicado pelo VCM. Por isso ele carrega os erros de ambos — e por isso, quando hemoglobina e hematócrito discordam de forma grosseira, quem se acredita é a hemoglobina, que é dosada por espectrofotometria. A regra prática dos três (Ht ≈ 3 × Hb) vale enquanto o VCM está normal e falha justamente nas anemias micro e macrocíticas.',
    fisiologia: {
      oQueE: 'Percentual do volume sanguíneo ocupado pelas hemácias, calculado a partir da contagem de hemácias e do volume corpuscular médio.',
      origem: 'Deriva da massa eritrocitária produzida pela medula e do volume plasmático regulado por rim, hormônio antidiurético e sistema renina-angiotensina-aldosterona.',
      funcao: 'Expressa, junto com a hemoglobina, a capacidade de transporte de oxigênio e é o principal determinante da viscosidade sanguínea.',
      orgaosEnvolvidos: ['Medula óssea', 'Rim', 'Baço'],
      percurso: ['Massa de hemácias', '÷ volume sanguíneo total', 'Hematócrito'],
    },
    aumento: {
      resumo: 'Mesmos caminhos da hemoglobina alta — hemoconcentração ou policitemia —, com sensibilidade ainda maior à volemia.',
      mecanismos: [
        {
          titulo: 'Hemoconcentração',
          explicacao: 'O volume plasmático caiu; a massa eritrocitária, não. A fração ocupada pelas hemácias sobe por aritmética.',
          exemplos: [
            { causa: 'Desidratação, diuréticos, queimadura extensa', etapas: ['queda do volume plasmático', 'mesma massa eritrocitária em menos volume', 'Ht ↑'] },
          ],
        },
        {
          titulo: 'Aumento verdadeiro da massa eritrocitária',
          explicacao: 'A medula produziu mais hemácias, por estímulo apropriado (hipóxia) ou autônomo (mutação).',
          exemplos: [
            { causa: 'Policitemia vera, hipoxemia crônica, EPO exógena', etapas: ['eritropoese aumentada', 'mais hemácias no mesmo volume', 'Ht ↑'], nota: 'Hematócrito acima de 55% aumenta de forma importante a viscosidade e o risco trombótico.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Acompanha a hemoglobina em toda anemia; isolado, sugere excesso de volume plasmático.',
      mecanismos: [
        {
          titulo: 'Anemia',
          explicacao: 'Menos hemácias, menor fração ocupada.',
          exemplos: [{ causa: 'Qualquer causa de anemia', etapas: ['queda da massa eritrocitária', 'Ht ↓ proporcional à Hb'] }],
        },
        {
          titulo: 'Hemodiluição',
          explicacao: 'O plasma aumentou e a fração celular encolheu, sem perda de hemácia alguma.',
          exemplos: [
            { causa: 'Reposição volêmica vigorosa, gestação, insuficiência cardíaca, cirrose com ascite', etapas: ['expansão do volume plasmático', 'Ht ↓ relativo'], nota: 'Após ressuscitação com cristaloide, o hematócrito cai sem que tenha havido nova perda sanguínea.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Leia sempre junto', ids: ['hemoglobina', 'vcm', 'hemacias'], leitura: 'Como o hematócrito é calculado a partir de hemácias × VCM, discordâncias entre ele e a hemoglobina apontam erro de índice ou interferência, não doença nova.' },
    ],
    interferentes: {
      preAnalitico: ['Amostra colhida em membro com infusão dilui e derruba o valor.', 'Demora prolongada até a leitura permite tumefação da hemácia e eleva o VCM — e, com ele, o hematócrito calculado.'],
      fisiologico: ['Postura, hidratação e altitude, exatamente como na hemoglobina.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['hemoglobina', 'vcm', 'hemacias'],
  },

  {
    id: 'hemacias',
    nome: 'Contagem de hemácias',
    sigla: 'RBC',
    sinonimos: ['eritrocitos', 'rbc', 'contagem de eritrocitos', 'serie vermelha'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: 'milhões/mm³',
    referencias: [
      { rotulo: 'Homens adultos', minimo: 4.5, maximo: 5.9, unidade: 'milhões/mm³' },
      { rotulo: 'Mulheres adultas', minimo: 4.0, maximo: 5.2, unidade: 'milhões/mm³' },
    ],
    resumo:
      'Quantas hemácias existem por volume. Sozinha diz pouco — seu valor está em confrontar a contagem com o tamanho da célula.',
    entenda:
      'A informação mais útil da contagem de hemácias aparece quando ela discorda da hemoglobina. Na talassemia menor, a medula produz muitas hemácias pequenas: a contagem fica normal ou alta enquanto o VCM despenca. Na ferropenia, produz poucas e pequenas: contagem e VCM caem juntos. É essa discordância que o índice de Mentzer (VCM ÷ hemácias) tenta capturar — abaixo de 13 sugere talassemia, acima sugere ferropenia — sempre como orientação, nunca como diagnóstico.',
    fisiologia: {
      oQueE: 'Número absoluto de eritrócitos por unidade de volume de sangue.',
      origem: 'Medula óssea, sob comando da eritropoetina renal.',
      funcao: 'Determina, junto ao conteúdo de hemoglobina de cada célula, a capacidade total de transporte de oxigênio.',
      percurso: ['Célula-tronco hematopoética', 'Proeritroblasto', 'Reticulócito', 'Hemácia madura'],
    },
    aumento: {
      resumo: 'Policitemia verdadeira, hemoconcentração — ou talassemia, em que muitas células pequenas convivem com anemia.',
      mecanismos: [
        {
          titulo: 'Eritrocitose',
          explicacao: 'Mais células produzidas, por estímulo hipóxico ou por autonomia clonal.',
          exemplos: [{ causa: 'Policitemia vera, hipoxemia crônica, tabagismo', etapas: ['eritropoese aumentada', 'contagem ↑'] }],
        },
        {
          titulo: 'Microcitose com contagem preservada',
          explicacao: 'A produção não caiu; o que caiu foi o tamanho de cada célula. É o padrão que distingue talassemia de ferropenia.',
          exemplos: [{ causa: 'Traço talassêmico', etapas: ['síntese deficiente de cadeia de globina', 'células pequenas em número normal ou alto', 'VCM ↓↓ com contagem preservada'] }],
        },
      ],
    },
    reducao: {
      resumo: 'Toda anemia por produção reduzida, perda ou destruição derruba também a contagem.',
      mecanismos: [
        {
          titulo: 'Menos células circulantes',
          explicacao: 'Produção insuficiente, perda ou destruição precoce.',
          exemplos: [{ causa: 'Ferropenia, hemólise, sangramento, doença medular', etapas: ['redução da massa eritrocitária', 'contagem ↓'] }],
        },
      ],
    },
    relacionados: [
      { titulo: 'O par que resolve a microcitose', ids: ['vcm', 'rdw', 'ferritina'], leitura: 'Contagem normal com VCM muito baixo e RDW normal aponta talassemia; contagem baixa com VCM baixo e RDW alto aponta ferropenia.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['vcm', 'hemoglobina', 'rdw'],
  },

  {
    id: 'vcm',
    nome: 'Volume corpuscular médio',
    sigla: 'VCM',
    sinonimos: ['mcv', 'volume corpuscular medio', 'tamanho da hemacia'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: 'fL',
    referencias: [
      { rotulo: 'Adultos', minimo: 80, maximo: 100, unidade: 'fL' },
      { rotulo: 'Crianças (1 a 5 anos)', minimo: 72, maximo: 88, unidade: 'fL', observacao: 'O limite inferior sobe com a idade: usar a referência do adulto em criança gera diagnóstico falso de microcitose.' },
    ],
    resumo:
      'O tamanho médio da hemácia. É o primeiro divisor de águas de qualquer anemia: micro, normo ou macrocítica.',
    entenda:
      'O VCM não é um detalhe morfológico — ele aponta qual etapa da produção falhou. Célula pequena significa hemoglobinização insuficiente: faltou ferro ou faltou cadeia de globina, e o precursor sofreu divisões extras tentando alcançar a concentração adequada de hemoglobina antes de sair. Célula grande significa maturação nuclear atrasada: o citoplasma continuou crescendo enquanto o DNA não conseguia se replicar (B12, folato) — ou a célula que está saindo é jovem demais (reticulocitose intensa), porque o reticulócito é naturalmente maior que a hemácia madura.',
    aprofundar: [
      'A microcitose obedece a uma lógica de "contagem de divisões". O eritroblasto continua se dividindo enquanto a concentração intracelular de hemoglobina não atinge o limiar. Se falta ferro ou globina, esse limiar demora, a célula divide-se uma ou duas vezes a mais, e cada divisão reduz pela metade o volume final. É por isso que ferropenia e talassemia — causas com origens completamente diferentes — produzem o mesmo achado.',
      'A macrocitose divide-se em megaloblástica e não megaloblástica, e essa separação muda a investigação inteira. Na megaloblástica (B12, folato, metotrexato, hidroxiureia, zidovudina) o defeito é de síntese de DNA: o núcleo atrasa, o citoplasma segue, e o esfregaço mostra neutrófilos hipersegmentados — o achado que confirma. Na não megaloblástica (alcoolismo, hepatopatia, hipotireoidismo, mielodisplasia, reticulocitose) não há defeito de DNA: a membrana ganha lipídios, ou a população circulante é jovem.',
      'O VCM é uma média, e médias escondem populações. Um paciente com deficiência simultânea de ferro e de B12 pode ter VCM perfeitamente normal, com metade das células pequenas e metade grandes — o RDW, nesse caso, vem muito alto e é a única pista no hemograma. Por isso VCM normal com RDW alto nunca deve ser lido como "série vermelha normal": pede esfregaço.',
    ],
    fisiologia: {
      oQueE: 'Volume médio de uma hemácia, medido diretamente por impedância ou dispersão de luz no contador automático.',
      origem: 'Definido durante a maturação eritroide na medula, pelo número de divisões celulares que o precursor executa antes de expelir o núcleo.',
      funcao: 'Não tem função própria — é a marca deixada pelo processo de produção, e é isso que o torna um marcador diagnóstico tão bom.',
      percurso: ['Precursor eritroide', 'divisões até atingir a concentração-alvo de hemoglobina', 'expulsão do núcleo', 'volume final da hemácia'],
    },
    aumento: {
      resumo: 'Macrocitose: ou o núcleo não acompanhou o citoplasma, ou a população circulante é jovem, ou a membrana ganhou lipídio.',
      significado: 'VCM alto não é doença — é uma pista sobre qual etapa da eritropoese está alterada.',
      mecanismos: [
        {
          titulo: 'Macrocitose megaloblástica — síntese de DNA prejudicada',
          explicacao:
            'A B12 e o folato são cofatores da timidilato-sintase. Sem eles, a replicação do DNA emperra, o núcleo amadurece devagar, e o citoplasma — que continua sintetizando hemoglobina normalmente — cresce demais. O resultado é uma célula grande com núcleo imaturo, e muitos precursores morrem ainda na medula (eritropoese ineficaz).',
          exemplos: [
            { causa: 'Deficiência de vitamina B12', etapas: ['falta de cofator para a metionina-sintase', 'folato preso na forma metil-tetra-hidrofolato', 'síntese de timidina bloqueada', 'assincronia núcleo-citoplasma', 'VCM ↑ e neutrófilos hipersegmentados'], nota: 'Sintomas neurológicos podem preceder a alteração hematológica — VCM normal não afasta deficiência de B12.' },
            { causa: 'Deficiência de folato', etapas: ['pool de folato esgotado (dieta, álcool, gestação, hemólise crônica)', 'síntese de DNA prejudicada', 'VCM ↑'] },
            { causa: 'Metotrexato, hidroxiureia, zidovudina, trimetoprima', etapas: ['bloqueio farmacológico da síntese de DNA', 'macrocitose sem deficiência nutricional'], nota: 'É a causa medicamentosa mais frequente e é reversível com a suspensão.' },
          ],
        },
        {
          titulo: 'Macrocitose não megaloblástica',
          explicacao: 'A síntese de DNA está íntegra. A célula é grande por outro motivo — excesso de lipídio na membrana, imaturidade da população ou displasia medular.',
          exemplos: [
            { causa: 'Alcoolismo', etapas: ['toxicidade direta sobre o precursor eritroide e alteração lipídica da membrana', 'macrocitose mesmo sem deficiência de folato'], nota: 'É a causa mais comum de macrocitose sem anemia — e costuma vir com GGT alta.' },
            { causa: 'Hepatopatia crônica', etapas: ['acúmulo de colesterol e fosfolipídios na membrana eritrocitária', 'aumento da superfície e do volume', 'VCM ↑'] },
            { causa: 'Reticulocitose intensa (hemólise, resposta a reposição de ferro)', etapas: ['muitos reticulócitos circulantes', 'reticulócito é ~20% maior que a hemácia madura', 'VCM ↑ transitório'], nota: 'Aqui o VCM alto é sinal de medula funcionando, não de doença.' },
            { causa: 'Hipotireoidismo', etapas: ['redução da demanda metabólica e da eritropoese', 'macrocitose leve'] },
            { causa: 'Síndrome mielodisplásica', etapas: ['hematopoese clonal displásica', 'macrocitose com citopenias e alterações morfológicas'], nota: 'Macrocitose persistente sem causa nutricional, alcoólica ou medicamentosa em idoso pede investigação medular.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Alcoolismo', 'Deficiência de B12 ou folato', 'Medicamentos (hidroxiureia, metotrexato, zidovudina)'],
        comuns: ['Hepatopatia', 'Reticulocitose', 'Hipotireoidismo'],
        menosComuns: ['Síndrome mielodisplásica', 'Anemia aplásica'],
        naoEsquecer: ['Deficiência de B12 com hemograma ainda normal, mas neuropatia já instalada'],
      },
    },
    reducao: {
      resumo: 'Microcitose: a célula saiu pequena porque não conseguiu se encher de hemoglobina — falta ferro, falta globina, ou o ferro existe mas está inacessível.',
      mecanismos: [
        {
          titulo: 'Falta de ferro disponível',
          explicacao: 'Sem ferro, não se monta o heme. O precursor divide-se mais vezes tentando atingir a concentração-alvo de hemoglobina e sai menor.',
          exemplos: [
            { causa: 'Anemia ferropriva', etapas: ['estoque esgotado', 'síntese de heme limitada', 'divisões extras do precursor', 'VCM ↓ com RDW ↑'], nota: 'O RDW sobe antes do VCM cair: a população nova é pequena enquanto as células antigas ainda são normais.' },
            { causa: 'Anemia da inflamação (fase avançada)', etapas: ['hepcidina ↑', 'ferro retido no macrófago', 'ferro indisponível para o eritroblasto', 'microcitose leve'], nota: 'Costuma ser normocítica; quando microcítica, é discreta e o ferro sérico está baixo com ferritina alta.' },
          ],
        },
        {
          titulo: 'Falta de cadeia de globina',
          explicacao: 'O ferro está disponível, mas não há proteína suficiente para montar o tetrâmero. A célula sai pequena, e em número preservado.',
          exemplos: [
            { causa: 'Alfa e beta-talassemia', etapas: ['produção deficiente de cadeia de globina', 'menos hemoglobina por célula', 'microcitose acentuada com contagem de hemácias normal ou alta', 'RDW normal'], nota: 'VCM muito baixo (< 70 fL) com anemia leve e ferritina normal é praticamente talassemia até prova em contrário.' },
          ],
        },
        {
          titulo: 'Defeito de incorporação do ferro ao heme',
          explicacao: 'O ferro chega ao eritroblasto e não é incorporado, acumulando-se na mitocôndria — o sideroblasto em anel.',
          exemplos: [
            { causa: 'Anemias sideroblásticas (hereditárias, alcoolismo, intoxicação por chumbo, isoniazida)', etapas: ['bloqueio da via da protoporfirina', 'ferro acumulado na mitocôndria perinuclear', 'população dimórfica: células micro e normocíticas'], nota: 'RDW muito alto com ferritina alta e saturação alta é a assinatura.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Anemia ferropriva'],
        comuns: ['Talassemia menor', 'Anemia da inflamação'],
        menosComuns: ['Anemia sideroblástica', 'Intoxicação por chumbo'],
        naoEsquecer: ['Ferropenia em homem ou mulher pós-menopausa: investigar trato digestivo'],
      },
    },
    comparacoes: [
      {
        id: 'macrocitose-megaloblastica-vs-nao',
        titulo: 'Macrocitose megaloblástica × não megaloblástica',
        pergunta: 'O VCM subiu. O problema é a síntese de DNA ou outra coisa?',
        hipoteses: ['Megaloblástica', 'Não megaloblástica'],
        linhas: [
          { marcador: 'VCM', celulas: ['frequentemente > 110 fL', 'geralmente 100–110 fL'] },
          { marcador: 'Neutrófilos hipersegmentados', celulas: ['presentes', 'ausentes'] },
          { marcador: 'LDH', celulas: ['↑↑', 'normal'] },
          { marcador: 'Bilirrubina indireta', celulas: ['↑', 'normal'] },
          { marcador: 'Reticulócitos', celulas: ['↓ (eritropoese ineficaz)', 'variável'] },
          { marcador: 'B12 / folato', celulas: ['↓', 'normais'] },
        ],
        leitura:
          'A megaloblástica destrói precursores dentro da própria medula: por isso LDH e bilirrubina indireta sobem — o padrão bioquímico de hemólise — enquanto o reticulócito permanece baixo. Essa combinação (marcadores de destruição altos com resposta medular baixa) não existe em nenhuma outra situação e é o que a identifica.',
      },
    ],
    relacionados: [
      { titulo: 'O trio que classifica a anemia', ids: ['hemoglobina', 'rdw', 'reticulocitos'], leitura: 'VCM diz o tamanho, RDW diz se as células são uniformes, reticulócito diz se a medula reagiu. Nenhum dos três sozinho fecha diagnóstico; os três juntos quase sempre indicam o próximo exame certo.' },
    ],
    interferentes: {
      preAnalitico: ['Amostra armazenada por muitas horas antes da leitura permite tumefação da hemácia e eleva falsamente o VCM.'],
      fisiologico: ['Crianças têm VCM fisiologicamente mais baixo; recém-nascidos, mais alto.'],
      medicamentos: ['Hidroxiureia, metotrexato, zidovudina e trimetoprima elevam de forma previsível e reversível.'],
      metodo: ['Hiperglicemia grave faz a hemácia inchar no diluente isotônico e eleva falsamente o VCM.', 'Crioaglutininas agregam hemácias e o contador lê o agregado como uma célula gigante: VCM falsamente alto e contagem falsamente baixa.'],
    },
    utilidade: ['diagnostico'],
    padroes: ['anemia-microcitica-hipocromica', 'anemia-macrocitica'],
    estudarTambem: ['rdw', 'ferritina', 'vitamina-b12', 'reticulocitos'],
  },

  {
    id: 'hcm',
    nome: 'Hemoglobina corpuscular média',
    sigla: 'HCM',
    sinonimos: ['mch', 'hemoglobina corpuscular media'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: 'pg',
    referencias: [{ rotulo: 'Adultos', minimo: 27, maximo: 32, unidade: 'pg' }],
    resumo: 'Quanta hemoglobina existe, em massa, dentro de cada hemácia. Acompanha o VCM quase sempre.',
    entenda:
      'A HCM é a hemoglobina dividida pelo número de hemácias — a massa média de hemoglobina por célula. Como célula pequena tem menos espaço, HCM e VCM caem juntos na ferropenia e nas talassemias (hipocromia). O termo "hipocrômica" que aparece no laudo vem daqui: a célula tem menos pigmento e, no esfregaço, mostra um halo central pálido aumentado.',
    fisiologia: {
      oQueE: 'Massa média de hemoglobina por hemácia, calculada como hemoglobina ÷ contagem de hemácias.',
      origem: 'Determinada pela disponibilidade de ferro e de cadeias de globina durante a maturação eritroide.',
      funcao: 'Indica o grau de hemoglobinização da célula — o quanto de carga de oxigênio cada hemácia consegue transportar.',
    },
    aumento: {
      resumo: 'Acompanha a macrocitose: célula maior comporta mais hemoglobina.',
      mecanismos: [
        {
          titulo: 'Macrocitose',
          explicacao: 'Volume maior implica mais conteúdo, sem que a concentração tenha mudado.',
          exemplos: [{ causa: 'Anemia megaloblástica, alcoolismo, hepatopatia', etapas: ['VCM ↑', 'mais hemoglobina por célula', 'HCM ↑'] }],
        },
      ],
    },
    reducao: {
      resumo: 'Hipocromia — a célula tem pouca hemoglobina, quase sempre por falta de ferro ou de globina.',
      mecanismos: [
        {
          titulo: 'Hemoglobinização deficiente',
          explicacao: 'Falta matéria-prima para encher a célula.',
          exemplos: [
            { causa: 'Anemia ferropriva', etapas: ['ferro insuficiente', 'menos heme por célula', 'HCM ↓ e VCM ↓'] },
            { causa: 'Talassemia', etapas: ['cadeia de globina deficiente', 'menos tetrâmero montado', 'HCM ↓'] },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Leia com', ids: ['vcm', 'chcm', 'rdw'], leitura: 'VCM e HCM caem juntos; a CHCM só cai em hipocromia acentuada, porque é uma concentração, não um total.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['vcm', 'chcm', 'ferritina'],
  },

  {
    id: 'chcm',
    nome: 'Concentração de hemoglobina corpuscular média',
    sigla: 'CHCM',
    sinonimos: ['mchc', 'concentracao de hemoglobina corpuscular media'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: 'g/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 32, maximo: 36, unidade: 'g/dL' }],
    resumo:
      'A concentração de hemoglobina dentro da hemácia. Move-se pouco — e é justamente por isso que, quando se move, vale muito.',
    entenda:
      'A CHCM é o índice mais estável do hemograma, porque a célula regula ativamente sua concentração interna. Duas situações a tiram do lugar e ambas são informativas: CHCM alta aponta esferocitose hereditária (a célula perdeu membrana e o conteúdo ficou mais concentrado) ou artefato — lipemia, hemólise da amostra, crioaglutininas. CHCM baixa aparece nas hipocromias intensas. Antes de aceitar uma CHCM alterada, vale conferir se a amostra estava íntegra: interferência é mais comum que doença.',
    fisiologia: {
      oQueE: 'Concentração de hemoglobina por unidade de volume eritrocitário, calculada como hemoglobina ÷ hematócrito.',
      origem: 'Reflete o equilíbrio entre o conteúdo de hemoglobina e o volume da célula, controlado por canais iônicos de membrana.',
      funcao: 'Indica se a célula está adequadamente hidratada e hemoglobinizada — é um marcador de integridade de membrana tanto quanto de hemoglobinização.',
    },
    aumento: {
      resumo: 'Praticamente só esferocitose e artefato de amostra.',
      mecanismos: [
        {
          titulo: 'Perda de membrana',
          explicacao: 'A célula perde superfície sem perder conteúdo: mesmo tanto de hemoglobina em menos volume, concentração maior.',
          exemplos: [{ causa: 'Esferocitose hereditária, anemia hemolítica autoimune com esferócitos', etapas: ['defeito ou remoção de membrana', 'redução do volume com conteúdo preservado', 'CHCM ↑'], nota: 'CHCM acima de 36 g/dL é dos poucos achados do hemograma que sugerem diagnóstico específico.' }],
        },
        {
          titulo: 'Interferência analítica',
          explicacao: 'A hemoglobina medida sobe sem que a célula tenha mudado, ou o hematócrito calculado cai indevidamente.',
          exemplos: [{ causa: 'Lipemia, hemólise da amostra, crioaglutininas', etapas: ['leitura fotométrica falseada', 'CHCM ↑ artefatual'], nota: 'Repetir com amostra íntegra e a 37 °C resolve.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Hipocromia acentuada — ferropenia estabelecida ou talassemia.',
      mecanismos: [
        {
          titulo: 'Hemoglobinização muito deficiente',
          explicacao: 'A célula tem pouco conteúdo mesmo relativamente ao seu volume reduzido.',
          exemplos: [{ causa: 'Ferropenia avançada, talassemia', etapas: ['síntese de hemoglobina muito limitada', 'CHCM ↓'] }],
        },
      ],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['vcm', 'hcm', 'rdw'],
  },

  {
    id: 'rdw',
    nome: 'Amplitude de distribuição eritrocitária',
    sigla: 'RDW',
    sinonimos: ['red cell distribution width', 'anisocitose', 'rdw-cv'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: '%',
    referencias: [{ rotulo: 'Adultos', minimo: 11.5, maximo: 14.5, unidade: '%' }],
    resumo:
      'O quanto as hemácias diferem de tamanho entre si — a anisocitose, medida. É o índice que mais precocemente se altera na ferropenia.',
    entenda:
      'O VCM é uma média; o RDW é o desvio em torno dela. Uma população uniforme, mesmo que toda pequena, tem RDW normal — é o caso da talassemia, em que o defeito genético afeta todas as células igualmente. Já uma deficiência adquirida cria duas populações: as células antigas, normais, e as novas, alteradas. Enquanto a mistura persiste, o RDW sobe. Por isso o RDW é o primeiro índice a se alterar na ferropenia, semanas antes de o VCM cair, e por isso ele é a única pista de dupla deficiência quando o VCM está "normal" por compensação entre células pequenas e grandes.',
    aprofundar: [
      'RDW elevado com VCM normal é um dos achados mais subestimados do hemograma. Significa população heterogênea sem desvio da média: ferropenia inicial, deficiência combinada de ferro e B12, ou resposta medular precoce a um tratamento recém-iniciado. Em todos os casos, pede esfregaço e painel de ferro — não observação.',
      'Fora da hematologia, o RDW virou marcador prognóstico independente em insuficiência cardíaca, sepse, doença renal crônica e pós-operatório. A associação é robusta mas inespecífica: reflete inflamação sistêmica, estresse oxidativo e turnover eritrocitário acelerado. Vale como sinal de gravidade, nunca como diagnóstico.',
    ],
    fisiologia: {
      oQueE: 'Coeficiente de variação do volume das hemácias — a largura da curva de distribuição de tamanhos.',
      origem: 'Resulta da mistura entre populações eritrocitárias produzidas sob condições diferentes.',
      funcao: 'Marcador de heterogeneidade: revela que algo mudou na produção em algum momento dos últimos 120 dias.',
    },
    aumento: {
      resumo: 'Existem no sangue populações de tamanhos diferentes — quase sempre porque a produção mudou em algum momento recente.',
      mecanismos: [
        {
          titulo: 'Deficiência nutricional em instalação',
          explicacao: 'As hemácias antigas ainda são normais, as novas já saem alteradas. Enquanto as duas populações convivem, o RDW sobe.',
          exemplos: [
            { causa: 'Ferropenia inicial', etapas: ['estoque esgotando', 'novas células saem menores', 'coexistência de populações', 'RDW ↑ antes de o VCM cair'] },
            { causa: 'Deficiência de B12 ou folato', etapas: ['novas células saem maiores', 'anisocitose', 'RDW ↑'] },
          ],
        },
        {
          titulo: 'Resposta medular ou transfusão',
          explicacao: 'Entram no sangue células de origem ou idade diferentes das existentes.',
          exemplos: [
            { causa: 'Reticulocitose (hemólise, resposta a reposição de ferro)', etapas: ['reticulócitos maiores entram em massa', 'heterogeneidade ↑', 'RDW ↑'], nota: 'Aqui o RDW alto é sinal de que o tratamento está funcionando.' },
            { causa: 'Transfusão recente', etapas: ['mistura de hemácias do doador e do receptor', 'RDW ↑'], nota: 'Confunde a leitura do hemograma pós-transfusional por várias semanas.' },
          ],
        },
        {
          titulo: 'Displasia e populações dimórficas',
          explicacao: 'A medula produz simultaneamente linhagens com maturação diferente.',
          exemplos: [{ causa: 'Mielodisplasia, anemia sideroblástica', etapas: ['hematopoese displásica', 'população dimórfica', 'RDW ↑↑'] }],
        },
      ],
    },
    reducao: { resumo: 'RDW baixo não tem significado clínico — apenas indica população uniforme.', mecanismos: [] },
    relacionados: [
      { titulo: 'A dupla que separa ferropenia de talassemia', ids: ['vcm', 'ferritina', 'hemacias'], leitura: 'Microcitose com RDW alto aponta ferropenia; microcitose com RDW normal e contagem de hemácias preservada aponta talassemia. A ferritina confirma.' },
    ],
    interferentes: {
      preAnalitico: ['Transfusão recente eleva por semanas.'],
      metodo: ['Crioaglutininas e agregados plaquetários distorcem a curva de distribuição.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    padroes: ['anemia-microcitica-hipocromica'],
    estudarTambem: ['vcm', 'ferritina', 'reticulocitos'],
  },

  {
    id: 'reticulocitos',
    nome: 'Reticulócitos',
    sinonimos: ['contagem de reticulocitos', 'retic', 'indice reticulocitario'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: '%',
    referencias: [
      { rotulo: 'Adultos (percentual)', minimo: 0.5, maximo: 2.5, unidade: '%' },
      { rotulo: 'Adultos (absoluto)', minimo: 25000, maximo: 100000, unidade: '/mm³', observacao: 'O valor absoluto é o que interpreta corretamente: em anemia grave, um percentual "normal" representa uma resposta medular insuficiente.' },
    ],
    resumo:
      'A hemácia recém-saída da medula. Responde à pergunta que organiza toda anemia: a medula está tentando compensar?',
    entenda:
      'O reticulócito ainda tem restos de RNA ribossômico e vive cerca de um dia no sangue antes de virar hemácia madura. Como só existe se a medula produziu há pouco, ele é a medida direta da atividade eritropoética. Diante de anemia, só há duas respostas possíveis: reticulócito alto significa medula competente reagindo a perda ou destruição; reticulócito baixo significa que o problema está na própria produção. Essa bifurcação divide as anemias antes de qualquer outro exame.',
    aprofundar: [
      'O percentual engana em anemia, porque é uma fração de um denominador reduzido. Duas correções resolvem. A primeira é o reticulócito absoluto (percentual × contagem de hemácias), que já basta na prática. A segunda é o índice de produção reticulocitária, que corrige também o tempo de maturação: sob estímulo intenso de EPO, a medula libera reticulócitos mais jovens, que sobrevivem 2 a 3 dias no sangue em vez de 1 — inflando a contagem sem que a produção real tenha aumentado na mesma proporção. Índice acima de 2 a 3 caracteriza resposta medular adequada.',
      'A cinética importa no acompanhamento: após iniciar ferro em anemia ferropriva, o pico reticulocitário ocorre entre o 5º e o 10º dia. Ausência desse pico significa que o diagnóstico está errado, que há deficiência associada (B12, folato), que a inflamação bloqueia a utilização do ferro, ou que o paciente não está tomando a medicação. É um teste terapêutico com leitura objetiva.',
    ],
    fisiologia: {
      oQueE: 'Eritrócito jovem, anucleado, que ainda contém RNA ribossômico residual — corado pelo azul de cresil brilhante ou detectado por fluorescência.',
      origem: 'Medula óssea, liberado após a expulsão do núcleo pelo eritroblasto ortocromático.',
      funcao: 'Já transporta oxigênio; termina a síntese de hemoglobina no primeiro dia de circulação.',
      meiaVida: 'Cerca de 24 horas como reticulócito, depois 120 dias como hemácia madura.',
      percurso: ['Eritroblasto ortocromático', 'expulsão do núcleo', 'reticulócito na medula (2–3 dias)', 'reticulócito no sangue (~1 dia)', 'hemácia madura'],
    },
    aumento: {
      resumo: 'A medula está produzindo acima do normal — porque perdeu hemácias, porque as está destruindo, ou porque recebeu o que lhe faltava.',
      significado: 'Reticulocitose diante de anemia é boa notícia sobre a medula e má notícia sobre o que está acontecendo com as hemácias no sangue.',
      mecanismos: [
        {
          titulo: 'Compensação a perda ou destruição',
          explicacao: 'A hipóxia resultante da anemia eleva a EPO, que acelera a eritropoese. Se a medula tem matéria-prima e está íntegra, ela responde.',
          exemplos: [
            { causa: 'Hemólise de qualquer causa', etapas: ['destruição periférica de hemácias', 'hipóxia relativa', 'EPO ↑', 'eritropoese acelerada', 'reticulócitos ↑↑'], nota: 'Reticulocitose com LDH alto, haptoglobina baixa e bilirrubina indireta alta fecha o padrão hemolítico.' },
            { causa: 'Hemorragia aguda', etapas: ['perda de sangue', 'estímulo eritropoético', 'pico reticulocitário em 3 a 5 dias'] },
          ],
        },
        {
          titulo: 'Resposta a tratamento',
          explicacao: 'A medula estava parada por falta de insumo; recebido o insumo, dispara.',
          exemplos: [
            { causa: 'Reposição de ferro, B12 ou folato', etapas: ['insumo disponível', 'eritropoese retomada', 'pico reticulocitário no 5º ao 10º dia'], nota: 'A ausência desse pico é um dos sinais mais úteis de que o diagnóstico ou a adesão estão errados.' },
            { causa: 'Eritropoetina exógena', etapas: ['estímulo farmacológico direto', 'reticulócitos ↑'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'A medula não está respondendo — falta insumo, falta estímulo, ou a fábrica está doente.',
      mecanismos: [
        {
          titulo: 'Falta de matéria-prima',
          explicacao: 'A medula quer produzir e não tem com quê.',
          exemplos: [{ causa: 'Ferropenia, deficiência de B12 ou folato', etapas: ['insumo ausente', 'eritropoese limitada ou ineficaz', 'reticulócitos ↓ apesar da anemia'] }],
        },
        {
          titulo: 'Falta de estímulo',
          explicacao: 'A EPO não é produzida em quantidade suficiente para a intensidade da anemia.',
          exemplos: [{ causa: 'Doença renal crônica', etapas: ['massa renal funcionante reduzida', 'EPO ↓', 'eritropoese insuficiente', 'anemia normocítica com reticulócitos baixos'] }],
        },
        {
          titulo: 'Doença da própria medula',
          explicacao: 'O tecido hematopoético foi destruído, substituído ou suprimido.',
          exemplos: [
            { causa: 'Aplasia medular, mielodisplasia, infiltração neoplásica, quimioterapia', etapas: ['perda ou substituição do tecido hematopoético', 'produção ↓', 'reticulócitos ↓ com outras citopenias'] },
            { causa: 'Aplasia pura da série vermelha (parvovírus B19 em hemólise crônica)', etapas: ['infecção do precursor eritroide', 'parada abrupta da eritropoese', 'reticulócitos ~0 com queda rápida da Hb'], nota: 'Crise aplásica em paciente com anemia falciforme ou esferocitose é emergência.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel de hemólise', ids: ['ldh', 'haptoglobina', 'bilirrubina-indireta'], leitura: 'Reticulocitose isolada indica resposta medular; somada a LDH alto, haptoglobina baixa e bilirrubina indireta alta, indica que a resposta é a uma hemólise.' },
    ],
    interferentes: {
      preAnalitico: ['Transfusão recente suprime a eritropoese endógena e derruba o valor.'],
      fisiologico: ['Recém-nascidos têm reticulocitose fisiológica nos primeiros dias.', 'Altitude eleva o basal.'],
    },
    cinetica: {
      inicio: 'Sobe 3 a 5 dias após o estímulo (sangramento, início de reposição).',
      pico: '5º ao 10º dia após reposição eficaz de ferro.',
      tendencia: 'A ausência do pico esperado após tratamento vale mais que o valor isolado — é o teste terapêutico do hemograma.',
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['hemolise'],
    estudarTambem: ['hemoglobina', 'ldh', 'haptoglobina', 'ferritina'],
  },

  /* ──────────────────────────── Série branca ──────────────────────────── */
  {
    id: 'leucocitos',
    nome: 'Leucócitos totais',
    sigla: 'WBC',
    sinonimos: ['globulos brancos', 'wbc', 'leucograma', 'contagem de leucocitos'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'infeccioso', 'imunologico'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Adultos', minimo: 4000, maximo: 11000, unidade: '/mm³' },
      { rotulo: 'Recém-nascido', minimo: 9000, maximo: 30000, unidade: '/mm³' },
      { rotulo: 'Criança (1 a 6 anos)', minimo: 5000, maximo: 15000, unidade: '/mm³', observacao: 'Predomínio linfocitário é normal até cerca de 4 a 5 anos — o contrário do adulto.' },
      { rotulo: 'Fórmula — neutrófilos segmentados', minimo: 40, maximo: 70, unidade: '%' },
      { rotulo: 'Fórmula — bastonetes', minimo: 0, maximo: 5, unidade: '%' },
      { rotulo: 'Fórmula — linfócitos', minimo: 20, maximo: 45, unidade: '%' },
      { rotulo: 'Fórmula — monócitos', minimo: 2, maximo: 10, unidade: '%' },
      { rotulo: 'Fórmula — eosinófilos', minimo: 1, maximo: 5, unidade: '%' },
      { rotulo: 'Fórmula — basófilos', minimo: 0, maximo: 2, unidade: '%', observacao: 'A fórmula percentual soma 100% por definição: qualquer linhagem que caia faz as outras subirem em percentual sem ter mudado em número. Converta sempre em absoluto — percentual × leucócitos totais ÷ 100 — antes de chamar de neutropenia, linfocitose ou eosinofilia.' },
    ],
    resumo:
      'A soma de todas as células de defesa circulantes. O número total quase nunca é a informação — quem informa é o diferencial.',
    entenda:
      'Leucocitose de 15.000 pode ser sepse bacteriana, corticoide, crise convulsiva ou simplesmente estresse físico. Leucopenia de 3.000 pode ser viral, medicamentosa ou aplasia. O total não distingue nada disso: é o diferencial — qual linhagem subiu ou caiu — que orienta. Por isso a leitura correta do leucograma sempre começa pelos valores absolutos de cada tipo celular, nunca pelo percentual, que muda quando qualquer outra linhagem se altera.',
    aprofundar: [
      'Os neutrófilos circulantes distribuem-se em dois compartimentos de tamanho semelhante: o pool circulante, que o exame mede, e o pool marginado, aderido ao endotélio. Adrenalina, exercício, estresse e convulsão desmarginam esse segundo compartimento em minutos, e o leucograma sobe sem que a medula tenha produzido uma única célula nova. Corticoide faz o mesmo e ainda bloqueia a saída para o tecido — daí a leucocitose com neutrofilia que aparece em quem usa prednisona sem nenhuma infecção.',
      'O "desvio à esquerda" — presença de bastonetes e formas mais jovens — indica que a demanda periférica excedeu o pool de reserva medular, obrigando a liberação de células imaturas. Ele acompanha infecção bacteriana grave, mas também aparece em qualquer estresse medular intenso. A reação leucemoide (leucócitos acima de 50.000 com desvio acentuado, sem clone neoplásico) imita leucemia e se diferencia dela pela ausência de blastos e por fosfatase alcalina leucocitária alta.',
    ],
    fisiologia: {
      oQueE: 'Conjunto das células nucleadas circulantes de defesa: neutrófilos, linfócitos, monócitos, eosinófilos e basófilos.',
      origem: 'Medula óssea (granulócitos, monócitos e precursores linfoides) e órgãos linfoides secundários (linfócitos maduros).',
      funcao: 'Defesa contra patógenos, vigilância imunológica, remoção de restos celulares e regulação da inflamação.',
      meiaVida: 'Neutrófilo circula 6 a 10 horas antes de migrar para o tecido; linfócitos podem viver anos.',
      percurso: ['Célula-tronco medular', 'maturação por linhagem', 'pool de reserva medular', 'pool marginado no endotélio', 'pool circulante (o que o exame mede)', 'migração tecidual'],
    },
    aumento: {
      resumo: 'Leucocitose. Ou a medula produziu mais, ou o que estava aderido ao endotélio soltou, ou existe um clone proliferando.',
      mecanismos: [
        {
          titulo: 'Demanda aumentada — infecção e inflamação',
          explicacao: 'Citocinas inflamatórias (IL-1, TNF, G-CSF) aceleram a produção medular e a liberação do pool de reserva.',
          exemplos: [
            { causa: 'Infecção bacteriana', etapas: ['reconhecimento do patógeno', 'liberação de G-CSF e IL-1', 'liberação do pool medular', 'neutrofilia com desvio à esquerda'] },
            { causa: 'Infecção viral', etapas: ['resposta linfocitária', 'linfocitose relativa ou absoluta, com linfócitos atípicos'], nota: 'Muitas viroses cursam com leucócitos totais normais ou baixos — leucograma normal não afasta infecção.' },
            { causa: 'Necrose tecidual (infarto, pancreatite, grande queimado)', etapas: ['inflamação estéril', 'estímulo medular', 'leucocitose sem infecção'] },
          ],
        },
        {
          titulo: 'Desmarginação — a célula já existia',
          explicacao: 'Metade dos neutrófilos está aderida ao endotélio e não é contada. Estímulos que soltam essa população elevam o número em minutos, sem produção nova.',
          exemplos: [
            { causa: 'Corticoide, adrenalina, estresse agudo, exercício intenso, convulsão', etapas: ['desmarginação do pool aderido', 'aumento do pool circulante', 'leucocitose em minutos a horas'], nota: 'É a causa mais frequente de leucocitose sem infecção — e a que mais gera antibiótico desnecessário.' },
          ],
        },
        {
          titulo: 'Proliferação clonal',
          explicacao: 'Uma célula-tronco alterada prolifera sem controle.',
          exemplos: [
            { causa: 'Leucemias e neoplasias mieloproliferativas', etapas: ['expansão clonal', 'leucócitos ↑↑ com formas imaturas ou blastos', 'citopenias das outras séries'], nota: 'Blastos no sangue periférico, ou leucocitose com anemia e plaquetopenia, exigem avaliação hematológica imediata.' },
          ],
        },
        {
          titulo: 'Asplenia e tabagismo',
          explicacao: 'Perde-se o principal sítio de remoção, ou instala-se inflamação crônica de baixo grau.',
          exemplos: [
            { causa: 'Esplenectomia', etapas: ['perda do sequestro esplênico', 'leucocitose e plaquetose persistentes', 'corpúsculos de Howell-Jolly no esfregaço'] },
            { causa: 'Tabagismo', etapas: ['inflamação crônica das vias aéreas', 'leucocitose leve persistente'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Infecção bacteriana', 'Corticoterapia', 'Estresse físico e exercício'],
        comuns: ['Infecção viral', 'Tabagismo', 'Necrose tecidual'],
        menosComuns: ['Neoplasias mieloproliferativas', 'Asplenia'],
        naoEsquecer: ['Reação leucemoide de infecção grave', 'Leucemia com blastos periféricos'],
        emergencias: ['Sepse', 'Leucostase por hiperleucocitose (> 100.000)'],
      },
    },
    reducao: {
      resumo: 'Leucopenia. Ou a medula não produz, ou a célula está sendo destruída, ou está sequestrada.',
      mecanismos: [
        {
          titulo: 'Produção reduzida',
          explicacao: 'A medula está suprimida, substituída ou sem insumo.',
          exemplos: [
            { causa: 'Quimioterapia, radioterapia, aplasia medular', etapas: ['supressão da granulopoese', 'neutropenia proporcional à dose e ao tempo'], nota: 'Neutrófilos abaixo de 500/mm³ com febre é neutropenia febril: antibiótico em até uma hora.' },
            { causa: 'Deficiência de B12 ou folato', etapas: ['síntese de DNA prejudicada em todas as linhagens', 'pancitopenia leve'] },
            { causa: 'Infiltração medular por neoplasia ou fibrose', etapas: ['substituição do tecido hematopoético', 'citopenias'] },
          ],
        },
        {
          titulo: 'Destruição ou consumo periférico',
          explicacao: 'A célula é produzida e removida antes do tempo.',
          exemplos: [
            { causa: 'Sepse grave', etapas: ['consumo maciço no foco infeccioso que excede a produção', 'leucopenia'], nota: 'Leucopenia na sepse é sinal de gravidade, não de ausência de infecção.' },
            { causa: 'Agranulocitose medicamentosa (dipirona, metimazol, clozapina, sulfas)', etapas: ['destruição imune ou tóxica de precursores', 'neutropenia grave abrupta'], nota: 'Febre e odinofagia em quem iniciou um desses fármacos exige hemograma no mesmo dia.' },
            { causa: 'Lúpus, HIV, síndrome de Felty', etapas: ['destruição imunomediada', 'leucopenia crônica'] },
          ],
        },
        {
          titulo: 'Sequestro',
          explicacao: 'A célula existe, mas está retida no baço aumentado.',
          exemplos: [{ causa: 'Hiperesplenismo (cirrose, hipertensão portal)', etapas: ['esplenomegalia congestiva', 'sequestro de leucócitos e plaquetas', 'citopenias com medula normal'] }],
        },
      ],
      causas: {
        muitoComuns: ['Infecções virais', 'Quimioterapia'],
        comuns: ['Medicamentos', 'Hiperesplenismo', 'Neutropenia étnica benigna'],
        menosComuns: ['Aplasia medular', 'Mielodisplasia'],
        naoEsquecer: ['Agranulocitose por dipirona, metimazol ou clozapina', 'HIV'],
        emergencias: ['Neutropenia febril', 'Sepse com leucopenia'],
      },
    },
    relacionados: [
      { titulo: 'Leia sempre o diferencial', ids: ['neutrofilos', 'linfocitos', 'monocitos', 'eosinofilos'], leitura: 'O total é a soma; a informação está em qual linhagem se moveu. Sempre em valores absolutos — percentuais mudam quando qualquer outra linhagem se altera.' },
      { titulo: 'Para separar inflamação de infecção bacteriana', ids: ['pcr', 'procalcitonina'], leitura: 'Leucocitose com PCR e procalcitonina altas favorece infecção bacteriana; leucocitose isolada com marcadores normais sugere desmarginação ou estresse.' },
    ],
    interferentes: {
      preAnalitico: ['Agregados plaquetários e eritroblastos podem ser contados como leucócitos, elevando falsamente o total.'],
      fisiologico: ['Exercício, estresse, dor, tabagismo e gestação elevam.', 'Neutropenia étnica benigna (frequente em pessoas de ascendência africana) cursa com neutrófilos entre 1.000 e 1.500/mm³ sem risco infeccioso aumentado.'],
      medicamentos: ['Corticoides, lítio e G-CSF elevam; quimioterápicos, dipirona, metimazol, clozapina, sulfas e carbamazepina reduzem.'],
    },
    utilidade: ['diagnostico', 'triagem', 'acompanhamento'],
    padroes: ['infeccao-bacteriana', 'infeccao-viral'],
    estudarTambem: ['neutrofilos', 'linfocitos', 'pcr', 'procalcitonina'],
  },

  {
    id: 'neutrofilos',
    nome: 'Neutrófilos',
    sinonimos: ['segmentados', 'bastonetes', 'polimorfonucleares', 'neutrofilia', 'neutropenia'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'infeccioso'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Adultos (absoluto)', minimo: 1500, maximo: 7500, unidade: '/mm³' },
      { rotulo: 'Adultos (percentual)', minimo: 40, maximo: 70, unidade: '%', observacao: 'O percentual só interpreta corretamente quando convertido em absoluto: multiplique pelos leucócitos totais e divida por 100.' },
      { rotulo: 'Bastonetes (percentual)', minimo: 0, maximo: 5, unidade: '%', observacao: 'Acima de 10% caracteriza desvio à esquerda relevante.' },
    ],
    resumo:
      'A primeira linha contra bactérias e fungos. O valor absoluto — não o percentual — é o que define risco infeccioso.',
    entenda:
      'Neutrófilo é a célula que chega primeiro ao foco bacteriano, fagocita e morre ali (o pus é, em grande parte, neutrófilo morto). Ele circula poucas horas, então a contagem reflete o equilíbrio instantâneo entre o que a medula libera e o que o tecido consome. Contagem absoluta abaixo de 1.500/mm³ é neutropenia; abaixo de 500/mm³ o risco de infecção grave sobe acentuadamente, e febre nesse cenário é urgência.',
    fisiologia: {
      oQueE: 'Granulócito polimorfonuclear com grânulos contendo mieloperoxidase, elastase e defensinas.',
      origem: 'Medula óssea; a maturação do mieloblasto ao neutrófilo maduro leva cerca de duas semanas.',
      funcao: 'Fagocitose e destruição de bactérias e fungos por explosão respiratória, degranulação e armadilhas extracelulares (NETs).',
      meiaVida: '6 a 10 horas no sangue; 1 a 2 dias no tecido.',
      percurso: ['Mieloblasto', 'promielócito', 'mielócito', 'metamielócito', 'bastonete', 'segmentado', 'pool marginado ou circulante', 'tecido'],
    },
    aumento: {
      resumo: 'Neutrofilia: infecção bacteriana, inflamação estéril, desmarginação por estresse ou corticoide, ou proliferação clonal.',
      mecanismos: [
        {
          titulo: 'Estímulo medular e liberação de reserva',
          explicacao: 'A medula guarda um pool de neutrófilos maduros muitas vezes maior que o circulante. Sob G-CSF, esse pool é liberado em horas.',
          exemplos: [
            { causa: 'Infecção bacteriana', etapas: ['citocinas inflamatórias', 'G-CSF ↑', 'liberação do pool medular', 'neutrofilia com bastonetes (desvio à esquerda)'] },
            { causa: 'Necrose tecidual, pós-operatório, grande queimado', etapas: ['inflamação estéril', 'estímulo medular', 'neutrofilia sem infecção'] },
          ],
        },
        {
          titulo: 'Desmarginação',
          explicacao: 'Metade dos neutrófilos está aderida ao endotélio. Adrenalina e corticoide soltam essa população.',
          exemplos: [
            { causa: 'Corticoide', etapas: ['desmarginação e bloqueio da migração tecidual', 'neutrofilia em horas'], nota: 'Neutrofilia com linfopenia e eosinopenia é a assinatura do corticoide.' },
            { causa: 'Estresse, exercício, dor, convulsão', etapas: ['descarga adrenérgica', 'desmarginação', 'neutrofilia transitória'] },
          ],
        },
        {
          titulo: 'Proliferação clonal',
          explicacao: 'Neoplasia mieloide produz granulócitos autonomamente.',
          exemplos: [{ causa: 'Leucemia mieloide crônica', etapas: ['BCR-ABL', 'granulopoese autônoma', 'leucocitose com toda a série granulocítica no sangue e basofilia'], nota: 'Basofilia associada é a pista que separa LMC de reação leucemoide.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Neutropenia: produção comprometida, destruição periférica ou sequestro esplênico. Abaixo de 500/mm³, é risco imediato.',
      mecanismos: [
        {
          titulo: 'Produção reduzida',
          explicacao: 'A granulopoese está suprimida, substituída ou carente de insumo.',
          exemplos: [
            { causa: 'Quimioterapia', etapas: ['toxicidade sobre precursores em divisão', 'nadir entre o 7º e o 14º dia', 'neutropenia previsível'] },
            { causa: 'Aplasia medular, mielodisplasia, infiltração neoplásica', etapas: ['perda do tecido hematopoético', 'neutropenia com outras citopenias'] },
          ],
        },
        {
          titulo: 'Destruição periférica',
          explicacao: 'A célula é produzida e removida precocemente — por anticorpo, toxicidade ou consumo.',
          exemplos: [
            { causa: 'Agranulocitose medicamentosa', etapas: ['destruição imune ou tóxica dos precursores', 'queda abrupta em dias'], nota: 'Dipirona, metimazol, propiltiouracil, clozapina e sulfas são os agentes clássicos.' },
            { causa: 'Sepse grave', etapas: ['consumo periférico maciço', 'neutropenia de mau prognóstico'] },
            { causa: 'Infecção viral (dengue, HIV, EBV, hepatites)', etapas: ['supressão medular transitória e consumo', 'neutropenia autolimitada'] },
          ],
        },
        {
          titulo: 'Sequestro e causas constitucionais',
          explicacao: 'A célula existe e não circula — ou o basal daquela pessoa é mais baixo.',
          exemplos: [
            { causa: 'Hiperesplenismo', etapas: ['esplenomegalia', 'sequestro', 'neutropenia com plaquetopenia'] },
            { causa: 'Neutropenia étnica benigna', etapas: ['variante do pool marginado', 'neutrófilos entre 1.000 e 1.500/mm³ sem risco aumentado'], nota: 'Reconhecer evita investigação e suspensão desnecessária de medicações.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para avaliar gravidade infecciosa', ids: ['pcr', 'procalcitonina', 'lactato'], leitura: 'Neutrofilia com desvio à esquerda, PCR e procalcitonina altas e lactato elevado compõem o quadro de infecção bacteriana grave.' },
    ],
    interferentes: {
      fisiologico: ['Exercício, estresse, tabagismo e gestação elevam.', 'Ascendência africana pode cursar com neutropenia benigna constitucional.'],
      medicamentos: ['Corticoides, lítio e G-CSF elevam; quimioterápicos, dipirona, metimazol e clozapina reduzem.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['infeccao-bacteriana'],
    estudarTambem: ['leucocitos', 'linfocitos', 'procalcitonina'],
  },

  {
    id: 'linfocitos',
    nome: 'Linfócitos',
    sinonimos: ['linfocitose', 'linfopenia'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'imunologico', 'infeccioso'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Adultos (absoluto)', minimo: 1000, maximo: 4000, unidade: '/mm³' },
      { rotulo: 'Adultos (percentual)', minimo: 20, maximo: 45, unidade: '%', observacao: 'Linfocitose relativa com absoluto normal é frequente quando os neutrófilos caem — o percentual sobe sem que nenhum linfócito tenha sido produzido a mais.' },
      { rotulo: 'Crianças até 4 anos (absoluto)', minimo: 3000, maximo: 9500, unidade: '/mm³', observacao: 'Predomínio linfocitário é fisiológico na primeira infância.' },
      { rotulo: 'Crianças até 4 anos (percentual)', minimo: 40, maximo: 70, unidade: '%', observacao: 'A inversão da fórmula em relação ao adulto é esperada e não indica infecção viral por si só.' },
    ],
    resumo: 'A imunidade adaptativa circulante: linfócitos T, B e NK. Sobem em viroses, caem em corticoide, HIV e estresse agudo.',
    entenda:
      'Linfocitose com linfócitos atípicos em adolescente ou adulto jovem sugere mononucleose (EBV) ou CMV. Linfopenia é achado frequente e subvalorizado: aparece em corticoterapia, sepse, desnutrição, lúpus, linfoma e — de forma característica e persistente — no HIV, em que a contagem de CD4 é o que quantifica a imunossupressão. Linfopenia persistente sem causa aparente pede sorologia para HIV.',
    fisiologia: {
      oQueE: 'Células mononucleares da imunidade adaptativa: linfócitos T (celular), B (humoral) e NK (citotoxicidade natural).',
      origem: 'Precursor linfoide medular; os T amadurecem no timo, os B na própria medula.',
      funcao: 'Reconhecimento antigênico específico, produção de anticorpos, citotoxicidade e memória imunológica.',
      meiaVida: 'De dias (efetores) a anos (memória).',
      percurso: ['Precursor linfoide medular', 'timo (T) ou medula (B)', 'órgãos linfoides secundários', 'recirculação sangue–linfa'],
    },
    aumento: {
      resumo: 'Resposta a vírus, expansão clonal ou redistribuição.',
      mecanismos: [
        {
          titulo: 'Resposta antigênica',
          explicacao: 'A infecção viral expande clones específicos, que aparecem no sangue como linfócitos ativados (atípicos).',
          exemplos: [
            { causa: 'Mononucleose infecciosa (EBV), CMV, toxoplasmose', etapas: ['proliferação de linfócitos T ativados', 'linfocitose com atipia'], nota: 'Linfócitos atípicos com transaminases moderadamente elevadas é um quadro clássico de mononucleose.' },
            { causa: 'Coqueluche', etapas: ['toxina pertussis bloqueia a saída dos linfócitos dos vasos', 'linfocitose acentuada'], nota: 'Linfocitose muito alta em lactente com tosse paroxística sugere coqueluche.' },
          ],
        },
        {
          titulo: 'Proliferação clonal',
          explicacao: 'Um clone linfoide prolifera de forma autônoma.',
          exemplos: [{ causa: 'Leucemia linfocítica crônica, linfomas leucemizados', etapas: ['expansão clonal', 'linfocitose persistente com células maduras monomórficas'], nota: 'Linfocitose persistente acima de 5.000/mm³ em adulto acima de 50 anos pede imunofenotipagem.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Corticoide, infecção aguda, imunodeficiência e desnutrição.',
      mecanismos: [
        {
          titulo: 'Redistribuição e apoptose induzida',
          explicacao: 'O corticoide desloca linfócitos para tecidos linfoides e induz apoptose.',
          exemplos: [{ causa: 'Corticoterapia, estresse agudo, cirurgia de grande porte', etapas: ['cortisol ↑', 'redistribuição e apoptose linfocitária', 'linfopenia em horas'] }],
        },
        {
          titulo: 'Destruição ou consumo',
          explicacao: 'A célula é destruída pelo agente ou consumida na resposta.',
          exemplos: [
            { causa: 'HIV', etapas: ['infecção e destruição de linfócitos T CD4+', 'linfopenia progressiva', 'imunossupressão'], nota: 'A contagem de CD4 é que quantifica o risco de infecção oportunista — não o linfócito total.' },
            { causa: 'Sepse, infecções virais agudas graves', etapas: ['apoptose linfocitária induzida por citocinas', 'linfopenia de mau prognóstico'] },
          ],
        },
        {
          titulo: 'Produção reduzida ou perda',
          explicacao: 'Falta insumo, falta tecido, ou perde-se linfa.',
          exemplos: [
            { causa: 'Desnutrição grave, quimioterapia, radioterapia', etapas: ['produção comprometida', 'linfopenia'] },
            { causa: 'Perda linfática (linfangiectasia intestinal, quilotórax)', etapas: ['drenagem de linfócitos para fora da circulação', 'linfopenia com hipoalbuminemia'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Leia junto', ids: ['neutrofilos', 'monocitos'], leitura: 'Neutrofilia com linfopenia e eosinopenia sugere corticoide ou estresse agudo; linfocitose com neutropenia sugere virose.' },
    ],
    interferentes: {
      fisiologico: ['Crianças pequenas têm predomínio linfocitário fisiológico.', 'Estresse e exercício reduzem transitoriamente.'],
      medicamentos: ['Corticoides e imunossupressores reduzem de forma marcante.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    padroes: ['infeccao-viral'],
    estudarTambem: ['leucocitos', 'neutrofilos'],
  },

  {
    id: 'monocitos',
    nome: 'Monócitos',
    sinonimos: ['monocitose', 'monocitopenia'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'infeccioso', 'imunologico'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Adultos (absoluto)', minimo: 200, maximo: 1000, unidade: '/mm³' },
      { rotulo: 'Adultos (percentual)', minimo: 2, maximo: 10, unidade: '%', observacao: 'Monocitose relativa acompanha qualquer neutropenia; confirme sempre no valor absoluto.' },
    ],
    resumo: 'O precursor circulante do macrófago tecidual. Sobe em inflamação crônica, infecções granulomatosas e recuperação medular.',
    entenda:
      'O monócito passa poucos dias no sangue e se transforma em macrófago ou célula dendrítica ao entrar no tecido. Monocitose sugere processo crônico: tuberculose, endocardite, doenças inflamatórias intestinais, colagenoses. Também aparece como sinal precoce de recuperação medular após quimioterapia — a monocitose antecede em dias a subida dos neutrófilos, e nesse contexto é boa notícia. Monocitose persistente acima de 1.000/mm³ em idoso levanta leucemia mielomonocítica crônica.',
    fisiologia: {
      oQueE: 'Célula mononuclear fagocítica circulante, precursora do macrófago tecidual e da célula dendrítica.',
      origem: 'Medula óssea, a partir do progenitor granulocítico-monocítico.',
      funcao: 'Fagocitose, apresentação de antígenos, produção de citocinas e formação do granuloma.',
      meiaVida: '1 a 3 dias no sangue; meses a anos como macrófago tecidual.',
      percurso: ['Monoblasto medular', 'monócito circulante', 'migração tecidual', 'macrófago ou célula dendrítica'],
    },
    aumento: {
      resumo: 'Inflamação crônica, infecção granulomatosa, recuperação medular ou clone mieloide.',
      mecanismos: [
        {
          titulo: 'Inflamação crônica e granulomatosa',
          explicacao: 'Processos que exigem macrófago sustentado aumentam a produção e a saída de monócitos.',
          exemplos: [
            { causa: 'Tuberculose, endocardite infecciosa, leishmaniose, doenças inflamatórias intestinais, colagenoses', etapas: ['estímulo crônico à linhagem monocítica', 'monocitose persistente'] },
          ],
        },
        {
          titulo: 'Recuperação medular',
          explicacao: 'A linhagem monocítica se recupera antes da neutrofílica após aplasia induzida.',
          exemplos: [{ causa: 'Pós-quimioterapia', etapas: ['retomada da hematopoese', 'monocitose precede a neutrofilia em 1 a 3 dias'], nota: 'É um sinal precoce e favorável.' }],
        },
        {
          titulo: 'Clone mieloide',
          explicacao: 'Proliferação neoplásica da linhagem monocítica.',
          exemplos: [{ causa: 'Leucemia mielomonocítica crônica', etapas: ['monocitose persistente > 1.000/mm³ por mais de 3 meses', 'displasia associada'] }],
        },
      ],
    },
    reducao: {
      resumo: 'Corticoide, aplasia medular e tricoleucemia — pouco frequente e raramente o achado principal.',
      mecanismos: [
        {
          titulo: 'Supressão da produção',
          explicacao: 'A linhagem é suprimida junto com as demais.',
          exemplos: [{ causa: 'Corticoterapia, aplasia medular, tricoleucemia', etapas: ['produção reduzida', 'monocitopenia'] }],
        },
      ],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['leucocitos', 'neutrofilos', 'linfocitos'],
  },

  {
    id: 'eosinofilos',
    nome: 'Eosinófilos',
    sinonimos: ['eosinofilia', 'eosinopenia'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'imunologico', 'infeccioso'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Adultos (absoluto)', minimo: 0, maximo: 500, unidade: '/mm³' },
      { rotulo: 'Adultos (percentual)', minimo: 1, maximo: 5, unidade: '%', observacao: 'O percentual isolado engana nas leucopenias: 8% de 3.000 leucócitos ainda é contagem absoluta normal.' },
    ],
    resumo:
      'A célula da alergia e das parasitoses teciduais. No Brasil, eosinofilia sem atopia evidente é helmintíase até prova em contrário.',
    entenda:
      'Eosinófilos respondem à IL-5 e agem contra helmintos grandes demais para serem fagocitados, degranulando sobre eles. Isso define as duas grandes causas: atopia (asma, rinite, dermatite, alergia medicamentosa) e parasitoses com fase tecidual — ascaridíase, estrongiloidíase, ancilostomíase, esquistossomose, toxocaríase. Verminose de ciclo exclusivamente intestinal, como oxiuríase, tipicamente não causa eosinofilia. Eosinofilia acima de 1.500/mm³ persistente pode lesar órgãos (coração, pulmão, sistema nervoso) e exige investigação.',
    fisiologia: {
      oQueE: 'Granulócito com grânulos contendo proteína básica principal, peroxidase eosinofílica e neurotoxina derivada do eosinófilo.',
      origem: 'Medula óssea, sob estímulo de IL-5, IL-3 e GM-CSF.',
      funcao: 'Defesa antiparasitária tecidual e participação na inflamação alérgica.',
      meiaVida: '8 a 12 horas no sangue; dias a semanas no tecido.',
      percurso: ['Precursor medular', 'IL-5', 'eosinófilo circulante', 'migração tecidual (pele, pulmão, trato digestivo)'],
    },
    aumento: {
      resumo: 'Alergia, parasitose tecidual, reação medicamentosa, insuficiência adrenal, vasculite ou neoplasia.',
      mecanismos: [
        {
          titulo: 'Resposta Th2',
          explicacao: 'A IL-5 produzida na resposta alérgica e antiparasitária expande e recruta eosinófilos.',
          exemplos: [
            { causa: 'Asma, rinite, dermatite atópica', etapas: ['resposta Th2', 'IL-5 ↑', 'eosinofilia leve a moderada'] },
            { causa: 'Helmintíases com migração tecidual', etapas: ['larva no tecido', 'IL-5 ↑', 'eosinofilia, por vezes acentuada'], nota: 'Antes de corticoide sistêmico em paciente de área endêmica, considerar estrongiloidíase — o corticoide pode desencadear hiperinfecção.' },
            { causa: 'Reação medicamentosa (DRESS, nefrite intersticial alérgica)', etapas: ['hipersensibilidade', 'eosinofilia com exantema, febre e disfunção orgânica'], nota: 'Eosinofilia com creatinina em elevação sugere nefrite intersticial alérgica.' },
          ],
        },
        {
          titulo: 'Perda do freio adrenal',
          explicacao: 'O cortisol suprime eosinófilos; sem ele, eles sobem.',
          exemplos: [{ causa: 'Insuficiência adrenal', etapas: ['cortisol ↓', 'perda da supressão fisiológica', 'eosinofilia com hiponatremia e hipercalemia'], nota: 'Eosinofilia associada a hiponatremia e hipercalemia deve fazer pensar em insuficiência adrenal.' }],
        },
        {
          titulo: 'Clonal e vasculítico',
          explicacao: 'Proliferação autônoma ou doença sistêmica com eosinofilia proeminente.',
          exemplos: [
            { causa: 'Granulomatose eosinofílica com poliangeíte, síndrome hipereosinofílica, leucemias eosinofílicas', etapas: ['eosinofilia persistente e acentuada', 'lesão de órgão-alvo'], nota: 'Eosinofilia > 1.500/mm³ mantida exige investigação de dano orgânico.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Corticoide e estresse agudo — eosinopenia é praticamente sinônimo de cortisol alto, endógeno ou exógeno.',
      mecanismos: [
        {
          titulo: 'Supressão pelo cortisol',
          explicacao: 'O cortisol induz apoptose e sequestro dos eosinófilos.',
          exemplos: [{ causa: 'Corticoterapia, sepse, estresse cirúrgico, síndrome de Cushing', etapas: ['cortisol ↑', 'eosinopenia'] }],
        },
      ],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['leucocitos', 'imunoglobulinas', 'cortisol'],
  },

  {
    id: 'basofilos',
    nome: 'Basófilos',
    sinonimos: ['basofilia'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'imunologico'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Adultos (absoluto)', minimo: 0, maximo: 200, unidade: '/mm³' },
      { rotulo: 'Adultos (percentual)', minimo: 0, maximo: 2, unidade: '%', observacao: 'Basofilia acima de 2% de forma persistente favorece doença mieloproliferativa.' },
    ],
    resumo: 'A linhagem menos numerosa do leucograma. Sua elevação é rara e, quando persistente, aponta para doença mieloproliferativa.',
    entenda:
      'Basófilos contêm histamina e heparina e participam de reações de hipersensibilidade imediata. Basofilia é achado incomum e tem um valor específico: em leucocitose com granulócitos imaturos, a presença de basofilia favorece leucemia mieloide crônica em vez de reação leucemoide infecciosa. Basofilia transitória também aparece em hipotireoidismo e em reações alérgicas.',
    fisiologia: {
      oQueE: 'Granulócito com grânulos ricos em histamina e heparina, portador de receptores de alta afinidade para IgE.',
      origem: 'Medula óssea.',
      funcao: 'Liberação de mediadores na hipersensibilidade imediata e modulação da resposta alérgica.',
    },
    aumento: {
      resumo: 'Neoplasias mieloproliferativas, hipotireoidismo e reações alérgicas.',
      mecanismos: [
        {
          titulo: 'Proliferação clonal',
          explicacao: 'A linhagem basofílica expande junto com o clone mieloide.',
          exemplos: [{ causa: 'Leucemia mieloide crônica, policitemia vera, mielofibrose', etapas: ['expansão clonal mieloide', 'basofilia persistente'], nota: 'Basofilia em leucocitose com desvio à esquerda é a pista que diferencia LMC de reação leucemoide.' }],
        },
        {
          titulo: 'Estímulo alérgico ou hormonal',
          explicacao: 'Reações de hipersensibilidade e hipotireoidismo elevam discretamente.',
          exemplos: [{ causa: 'Alergias, hipotireoidismo, colite ulcerativa', etapas: ['estímulo à linhagem basofílica', 'basofilia leve'] }],
        },
      ],
    },
    reducao: { resumo: 'Basopenia não tem valor clínico estabelecido: o limite inferior de referência é zero.', mecanismos: [] },
    utilidade: ['diagnostico'],
    estudarTambem: ['leucocitos', 'eosinofilos'],
  },

  /* ────────────────────────────── Plaquetas ────────────────────────────── */
  {
    id: 'plaquetas',
    nome: 'Plaquetas',
    sinonimos: ['plaquetograma', 'trombocitos', 'plaquetopenia', 'trombocitopenia', 'trombocitose'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [{ rotulo: 'Adultos', minimo: 150000, maximo: 450000, unidade: '/mm³' }],
    resumo:
      'Os fragmentos celulares da hemostasia primária. Contagem baixa não significa automaticamente risco de sangramento — depende da causa e da função.',
    entenda:
      'A plaqueta forma o tampão inicial: adere ao colágeno exposto via fator de von Willebrand, ativa-se, agrega e fornece a superfície onde a cascata da coagulação acontece. Toda plaquetopenia se explica por um de três mecanismos — produção reduzida, destruição ou consumo periférico, e sequestro esplênico. E o primeiro passo diante de qualquer plaquetopenia nova e isolada é excluir pseudoplaquetopenia: agregação in vitro induzida pelo EDTA, que o contador lê como contagem baixa em paciente sem nenhum sangramento.',
    aprofundar: [
      'O risco de sangramento não é função linear da contagem. Acima de 50.000/mm³, sangramento espontâneo é raro e procedimentos de médio porte costumam ser seguros. Entre 20.000 e 50.000, há risco em trauma e cirurgia. Abaixo de 10.000, o risco de sangramento espontâneo — inclusive em sistema nervoso central — torna-se significativo. Mas a causa modula tudo: na PTI as plaquetas circulantes são jovens e hiperfuncionantes, e o paciente sangra menos do que a contagem sugeriria; já em mielodisplasia, com plaquetas disfuncionais, sangra-se mais.',
      'Plaquetopenia com anemia hemolítica e esquizócitos configura microangiopatia trombótica e é emergência: PTT, SHU, CIVD e síndrome HELLP entram no diferencial, e a PTT exige plasmaférese antes de qualquer confirmação laboratorial definitiva. Já a trombocitopenia induzida por heparina (HIT) é o paradoxo que engana: a contagem cai, mas o risco é de trombose, não de sangramento — e transfundir plaquetas piora.',
    ],
    fisiologia: {
      oQueE: 'Fragmentos citoplasmáticos anucleados originados do megacariócito medular.',
      origem: 'Megacariócitos da medula óssea, sob estímulo da trombopoetina, produzida principalmente pelo fígado.',
      sintese: 'Cada megacariócito fragmenta-se em milhares de plaquetas por meio de prolongamentos citoplasmáticos (pró-plaquetas).',
      funcao: 'Hemostasia primária: adesão ao subendotélio, ativação, agregação e oferta de superfície fosfolipídica para a cascata da coagulação.',
      metabolismo: 'Um terço da massa plaquetária fica sequestrado no baço em equilíbrio dinâmico com a circulação.',
      meiaVida: '7 a 10 dias.',
      orgaosEnvolvidos: ['Medula óssea', 'Fígado (trombopoetina)', 'Baço'],
      percurso: ['Fígado produz trombopoetina', 'megacariócito medular', 'fragmentação em plaquetas', 'circulação (2/3) e baço (1/3)', 'remoção pelo sistema reticuloendotelial'],
    },
    aumento: {
      resumo: 'Trombocitose. Quase sempre reativa (inflamação, ferropenia, asplenia); raramente clonal.',
      mecanismos: [
        {
          titulo: 'Trombocitose reativa',
          explicacao: 'A IL-6 da inflamação estimula a produção hepática de trombopoetina, que aumenta a produção plaquetária. É resposta, não doença.',
          exemplos: [
            { causa: 'Infecção, inflamação, pós-operatório, neoplasia', etapas: ['IL-6 ↑', 'trombopoetina hepática ↑', 'megacariopoese ↑', 'plaquetas ↑'], nota: 'Costuma acompanhar PCR e ferritina elevadas — é fenômeno de fase aguda.' },
            { causa: 'Anemia ferropriva', etapas: ['ferropenia', 'estímulo cruzado à megacariopoese', 'trombocitose'], nota: 'Microcitose com trombocitose é combinação tão típica de ferropenia que sugere o diagnóstico.' },
            { causa: 'Esplenectomia ou asplenia funcional', etapas: ['perda do pool esplênico', 'todas as plaquetas passam a circular', 'trombocitose persistente'] },
          ],
        },
        {
          titulo: 'Trombocitose clonal',
          explicacao: 'Neoplasia mieloproliferativa com produção autônoma.',
          exemplos: [{ causa: 'Trombocitemia essencial, policitemia vera, LMC', etapas: ['mutação JAK2, CALR ou MPL', 'megacariopoese autônoma', 'plaquetas ↑↑ com risco trombótico e hemorrágico'], nota: 'Acima de 1.000.000/mm³, pode haver doença de von Willebrand adquirida e sangramento paradoxal.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Plaquetopenia: produz-se pouco, destrói-se ou consome-se muito, ou o baço sequestra. E antes de tudo: excluir pseudoplaquetopenia por EDTA.',
      mecanismos: [
        {
          titulo: 'Produção reduzida',
          explicacao: 'A megacariopoese está comprometida por lesão, substituição ou falta de insumo.',
          exemplos: [
            { causa: 'Quimioterapia, radioterapia, aplasia medular', etapas: ['supressão dos megacariócitos', 'plaquetopenia com outras citopenias'] },
            { causa: 'Deficiência de B12 ou folato', etapas: ['síntese de DNA prejudicada', 'trombopoese ineficaz'] },
            { causa: 'Hepatopatia crônica', etapas: ['produção hepática de trombopoetina ↓', 'somada ao hiperesplenismo', 'plaquetopenia'], nota: 'Plaquetopenia é frequentemente o primeiro sinal laboratorial de cirrose com hipertensão portal.' },
            { causa: 'Álcool', etapas: ['toxicidade direta sobre o megacariócito', 'plaquetopenia reversível em 5 a 7 dias de abstinência'] },
          ],
        },
        {
          titulo: 'Destruição imune',
          explicacao: 'Anticorpos revestem a plaqueta e o baço a remove.',
          exemplos: [
            { causa: 'Púrpura trombocitopênica imune (PTI)', etapas: ['autoanticorpo antiplaquetário', 'remoção esplênica acelerada', 'plaquetopenia isolada com demais séries normais'], nota: 'Plaquetopenia isolada, sem anemia, sem leucopenia e sem esplenomegalia, com o resto do hemograma normal, é o quadro típico.' },
            { causa: 'Trombocitopenia induzida por heparina (HIT)', etapas: ['anticorpo contra o complexo heparina–fator plaquetário 4', 'ativação plaquetária', 'trombose com queda da contagem'], nota: 'Queda de mais de 50% entre o 5º e o 10º dia de heparina. O risco é trombótico — transfundir plaquetas é contraindicado.' },
            { causa: 'Medicamentos (sulfas, vancomicina, quinina, linezolida), lúpus, HIV, hepatite C', etapas: ['destruição imunomediada', 'plaquetopenia'] },
          ],
        },
        {
          titulo: 'Consumo',
          explicacao: 'A plaqueta é gasta na formação de trombos ou fragmentada na microcirculação.',
          exemplos: [
            { causa: 'CIVD', etapas: ['ativação sistêmica da coagulação', 'consumo de plaquetas e fatores', 'plaquetopenia com INR e TTPa alargados, fibrinogênio ↓ e D-dímero ↑↑'] },
            { causa: 'PTT e SHU', etapas: ['deficiência de ADAMTS13 ou lesão endotelial', 'trombos plaquetários na microcirculação', 'plaquetopenia com anemia hemolítica e esquizócitos'], nota: 'Emergência hematológica: a suspeita já indica plasmaférese na PTT.' },
            { causa: 'Sepse, grandes hemorragias com transfusão maciça', etapas: ['consumo e diluição', 'plaquetopenia'] },
          ],
        },
        {
          titulo: 'Sequestro esplênico',
          explicacao: 'O baço aumentado retém uma fração muito maior que o normal.',
          exemplos: [{ causa: 'Hipertensão portal, esplenomegalia de qualquer causa', etapas: ['baço aumentado', 'sequestro de até 90% da massa plaquetária', 'plaquetopenia moderada e estável'] }],
        },
        {
          titulo: 'Pseudoplaquetopenia',
          explicacao: 'A contagem está errada: o EDTA induziu agregação in vitro e o contador leu os agregados como uma célula só.',
          exemplos: [{ causa: 'Aglutinação por EDTA', etapas: ['anticorpo dependente de EDTA', 'agregação in vitro', 'contagem falsamente baixa'], nota: 'Confirma-se com esfregaço (agregados visíveis) e recoleta em citrato. É a primeira hipótese diante de plaquetopenia nova em paciente sem sangramento.' }],
        },
      ],
      causas: {
        muitoComuns: ['Pseudoplaquetopenia por EDTA', 'Infecções virais (dengue, HIV, hepatites)', 'Medicamentos'],
        comuns: ['Hepatopatia com hiperesplenismo', 'PTI', 'Sepse'],
        menosComuns: ['Aplasia medular', 'Mielodisplasia'],
        naoEsquecer: ['HIT em paciente heparinizado', 'Síndrome HELLP na gestante'],
        emergencias: ['PTT/SHU', 'CIVD', 'Plaquetas < 10.000/mm³'],
      },
    },
    comparacoes: [
      {
        id: 'plaquetopenia-mecanismos',
        titulo: 'PTI × CIVD × PTT × Hiperesplenismo',
        pergunta: 'As plaquetas caíram. O que mais mudou junto diz qual é o mecanismo.',
        hipoteses: ['PTI', 'CIVD', 'PTT', 'Hiperesplenismo'],
        linhas: [
          { marcador: 'Plaquetas', celulas: ['↓↓', '↓', '↓↓', '↓ moderada'] },
          { marcador: 'INR / TTPa', celulas: ['normais', 'alargados', 'normais', 'normais'] },
          { marcador: 'Fibrinogênio', celulas: ['normal', '↓', 'normal', 'normal'] },
          { marcador: 'D-dímero', celulas: ['normal', '↑↑', 'normal ou ↑', 'normal'] },
          { marcador: 'Esquizócitos', celulas: ['ausentes', 'presentes', 'presentes', 'ausentes'] },
          { marcador: 'Hemoglobina', celulas: ['normal', '↓', '↓↓', '↓ leve'] },
          { marcador: 'Baço', celulas: ['normal', 'variável', 'normal', 'aumentado'] },
        ],
        leitura:
          'A pergunta que organiza é: a coagulação está sendo consumida junto? Na CIVD, sim — INR e TTPa alargam, o fibrinogênio cai e o D-dímero dispara. Na PTT, o consumo é só plaquetário e mecânico: a coagulação plasmática permanece normal enquanto as hemácias são cortadas na microcirculação (esquizócitos). Na PTI, nada mais se altera — é destruição isolada e periférica. No hiperesplenismo, tudo é moderado e estável, porque a plaqueta não foi destruída: está retida.',
        limites: 'A síndrome HELLP na gestante pode combinar achados de várias colunas e é diagnóstico de exclusão urgente.',
      },
    ],
    relacionados: [
      { titulo: 'Para separar consumo de destruição', ids: ['inr', 'ttpa', 'fibrinogenio', 'd-dimero'], leitura: 'Plaquetopenia com coagulograma normal aponta destruição periférica ou sequestro; com INR e TTPa alargados e fibrinogênio baixo, aponta consumo (CIVD).' },
    ],
    interferentes: {
      preAnalitico: ['Aglutinação por EDTA produz pseudoplaquetopenia — recoletar em citrato.', 'Coleta difícil com ativação plaquetária forma agregados e reduz falsamente a contagem.'],
      fisiologico: ['Queda fisiológica leve na gestação (plaquetopenia gestacional benigna, geralmente > 70.000/mm³).'],
      medicamentos: ['Heparina, sulfas, vancomicina, linezolida, quinina e valproato reduzem.'],
      metodo: ['Plaquetas gigantes podem ser contadas como hemácias, subestimando a contagem.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['inr', 'ttpa', 'fibrinogenio', 'd-dimero'],
  },

  {
    id: 'vpm',
    nome: 'Volume plaquetário médio',
    sigla: 'VPM',
    sinonimos: ['mpv', 'volume plaquetario medio'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: 'fL',
    referencias: [{ rotulo: 'Adultos', minimo: 7.5, maximo: 11.5, unidade: 'fL' }],
    resumo: 'O tamanho médio das plaquetas — e, indiretamente, a idade delas. Plaqueta jovem é grande.',
    entenda:
      'A lógica é a mesma do reticulócito: quando há destruição periférica, a medula libera plaquetas jovens, que são maiores. VPM alto com plaquetopenia sugere destruição ou consumo (PTI, microangiopatia) com medula respondendo. VPM baixo ou normal com plaquetopenia aponta produção reduzida — medula suprimida, infiltrada ou aplásica. Vale como orientação inicial, não como diagnóstico.',
    fisiologia: {
      oQueE: 'Volume médio das plaquetas circulantes.',
      origem: 'Determinado pela fragmentação do megacariócito e pela idade média da população plaquetária.',
      funcao: 'Plaquetas maiores são metabolicamente mais ativas e mais hemostáticas.',
    },
    aumento: {
      resumo: 'População jovem: destruição periférica com medula respondendo.',
      mecanismos: [
        {
          titulo: 'Turnover acelerado',
          explicacao: 'A medula libera plaquetas jovens, maiores, para repor as destruídas.',
          exemplos: [{ causa: 'PTI, microangiopatias, hiperesplenismo com resposta medular', etapas: ['destruição periférica', 'liberação de plaquetas jovens', 'VPM ↑'] }],
        },
      ],
    },
    reducao: {
      resumo: 'População envelhecida ou produção deficiente.',
      mecanismos: [
        {
          titulo: 'Produção comprometida',
          explicacao: 'Sem renovação, a população circulante envelhece e encolhe.',
          exemplos: [{ causa: 'Aplasia medular, quimioterapia, infiltração medular', etapas: ['megacariopoese reduzida', 'VPM normal ou ↓ com plaquetopenia'] }],
        },
      ],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['plaquetas'],
  },

  /* ───────────────────────── Marcador de fase aguda ───────────────────── */
  {
    id: 'vhs',
    nome: 'Velocidade de hemossedimentação',
    sigla: 'VHS',
    sinonimos: ['vsg', 'hemossedimentacao', 'velocidade de sedimentacao globular', 'esr'],
    grupo: 'inflamatorio',
    sistemas: ['hematologico', 'imunologico', 'infeccioso'],
    material: 'Sangue total com citrato ou EDTA',
    unidade: 'mm/h',
    referencias: [
      { rotulo: 'Homens', texto: '< 15', unidade: 'mm/h' },
      { rotulo: 'Mulheres', texto: '< 20', unidade: 'mm/h' },
      { rotulo: 'Idosos', texto: 'idade ÷ 2 (homens); (idade + 10) ÷ 2 (mulheres)', unidade: 'mm/h', observacao: 'Regra prática amplamente usada: o VHS sobe fisiologicamente com a idade.' },
    ],
    resumo:
      'A velocidade com que as hemácias sedimentam num tubo. Marcador inflamatório indireto, lento e inespecífico — mas útil justamente por ser lento.',
    entenda:
      'A hemácia sedimenta mais rápido quando se empilha em rouleaux, e ela se empilha quando o plasma tem muita proteína de carga assimétrica — sobretudo fibrinogênio e imunoglobulinas. Ou seja: o VHS não mede inflamação, mede a consequência plasmática dela. Isso explica suas duas características. Primeira: é lento — sobe em 24 a 48 horas e leva semanas para normalizar, então serve melhor para acompanhar doença crônica do que para avaliar quadro agudo. Segunda: é inespecífico — anemia, gestação, idade avançada e gamopatias o elevam sem inflamação nenhuma.',
    fisiologia: {
      oQueE: 'Distância, em milímetros, que as hemácias sedimentam em uma hora numa coluna vertical de sangue anticoagulado.',
      origem: 'Depende da concentração plasmática de proteínas de fase aguda, especialmente fibrinogênio, e do número e da forma das hemácias.',
      funcao: 'Não tem função biológica — é um fenômeno físico usado como marcador indireto.',
      percurso: ['Inflamação', 'IL-6 ↑', 'síntese hepática de fibrinogênio ↑', 'formação de rouleaux', 'sedimentação acelerada', 'VHS ↑'],
    },
    aumento: {
      resumo: 'Inflamação, infecção, neoplasia, gamopatia — e também anemia, gestação e idade, sem doença alguma.',
      mecanismos: [
        {
          titulo: 'Aumento de proteínas de fase aguda',
          explicacao: 'A IL-6 leva o fígado a produzir fibrinogênio, que neutraliza a repulsão eletrostática entre as hemácias e favorece o empilhamento.',
          exemplos: [
            { causa: 'Infecções, doenças reumatológicas, neoplasias', etapas: ['IL-6 ↑', 'fibrinogênio ↑', 'rouleaux', 'VHS ↑'] },
            { causa: 'Arterite de células gigantes e polimialgia reumática', etapas: ['inflamação de grandes vasos', 'VHS muito elevado, frequentemente > 100 mm/h'], nota: 'VHS acima de 100 mm/h em idoso com cefaleia temporal e claudicação de mandíbula obriga a considerar arterite de células gigantes — corticoide não deve esperar a biópsia.' },
          ],
        },
        {
          titulo: 'Aumento de imunoglobulinas',
          explicacao: 'Paraproteínas monoclonais são grandes e assimétricas, e favorecem intensamente o rouleaux.',
          exemplos: [{ causa: 'Mieloma múltiplo, macroglobulinemia de Waldenström', etapas: ['paraproteína ↑', 'rouleaux acentuado', 'VHS ↑↑'], nota: 'VHS muito alto com anemia e dor óssea em idoso levanta mieloma.' }],
        },
        {
          titulo: 'Causas não inflamatórias',
          explicacao: 'A física da sedimentação muda sem que exista inflamação.',
          exemplos: [
            { causa: 'Anemia', etapas: ['menos hemácias para atritar entre si', 'sedimentação mais rápida', 'VHS ↑'], nota: 'É a causa não inflamatória mais frequente de VHS alto.' },
            { causa: 'Gestação, idade avançada, sexo feminino, obesidade, insuficiência renal', etapas: ['alterações plasmáticas e eritrocitárias', 'VHS ↑ sem doença inflamatória'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Policitemia, alterações de forma da hemácia e hipofibrinogenemia impedem o empilhamento.',
      mecanismos: [
        {
          titulo: 'Impedimento físico ao rouleaux',
          explicacao: 'Hemácias em excesso, deformadas ou plasma pobre em fibrinogênio dificultam o empilhamento.',
          exemplos: [
            { causa: 'Policitemia', etapas: ['hemácias em excesso', 'atrito aumentado', 'sedimentação lenta', 'VHS ↓'] },
            { causa: 'Anemia falciforme, esferocitose', etapas: ['forma alterada impede o empilhamento', 'VHS ↓'] },
            { causa: 'Hipofibrinogenemia (CIVD, hepatopatia grave)', etapas: ['fibrinogênio ↓', 'sem rouleaux', 'VHS ↓'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Compare com a PCR', ids: ['pcr', 'ferritina', 'fibrinogenio'], leitura: 'A PCR sobe em horas e cai em dias; o VHS sobe em dias e cai em semanas. Discordância entre eles não é erro: é informação temporal. PCR normal com VHS alto sugere processo em resolução, gamopatia ou anemia.' },
    ],
    interferentes: {
      preAnalitico: ['Tubo inclinado, temperatura ambiente elevada e demora na execução elevam falsamente.'],
      fisiologico: ['Idade, sexo feminino, gestação, obesidade e anemia elevam sem doença.'],
      medicamentos: ['Corticoides e anti-inflamatórios reduzem por reduzirem a inflamação — e podem mascarar a doença de base.'],
    },
    cinetica: {
      inicio: 'Sobe em 24 a 48 horas após o estímulo inflamatório.',
      normalizacao: 'Normaliza em semanas — muito depois da resolução clínica.',
      tendencia: 'Por ser lento, presta-se bem ao acompanhamento de doenças crônicas (arterite, polimialgia, osteomielite) e mal ao seguimento de quadros agudos.',
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['pcr', 'ferritina', 'fibrinogenio'],
  },
]
