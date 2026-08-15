import type { Marcador } from '../tipos'

/**
 * Marcadores tumorais — e a advertência que precisa vir antes de qualquer
 * valor de referência.
 *
 * Nenhum marcador deste arquivo diagnostica câncer. Nenhum. Eles são proteínas
 * que células tumorais produzem em maior quantidade — e que tecidos normais,
 * inflamados ou regenerando também produzem. Um CA 19-9 alto tem como causa
 * mais frequente a colestase benigna; um CA 125 alto em mulher na
 * pré-menopausa tem como causa mais frequente a endometriose ou a própria
 * menstruação; uma alfafetoproteína alta tem como causa mais frequente a
 * gestação.
 *
 * O uso legítimo destes exames é quase sempre o **acompanhamento**: uma vez
 * estabelecido o diagnóstico por histologia e sabendo-se que aquele tumor
 * secreta aquele marcador, a curva ao longo do tempo informa resposta e
 * recidiva melhor que qualquer imagem isolada. Fora dessa situação — pedidos
 * em rastreamento populacional, em check-up, em investigação de sintoma
 * inespecífico — eles produzem muito mais dano por investigação em cascata,
 * biópsia desnecessária e angústia do que benefício.
 *
 * As exceções em que um marcador tem papel diagnóstico real são poucas e estão
 * explicitadas nas fichas: alfafetoproteína no carcinoma hepatocelular em
 * cirrótico, hCG e AFP nos tumores germinativos, calcitonina no carcinoma
 * medular de tireoide, tireoglobulina no seguimento pós-tireoidectomia.
 */
export const marcadores: Marcador[] = [
  {
    id: 'alfafetoproteina',
    nome: 'Alfafetoproteína',
    sigla: 'AFP',
    sinonimos: ['afp', 'alfa fetoproteina', 'alfa-fetoproteina', 'alfafeto'],
    grupo: 'tumorais',
    sistemas: ['oncologico', 'hepatobiliar'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Adultos não gestantes', texto: '< 10', unidade: 'ng/mL' },
      { rotulo: 'Suspeita de carcinoma hepatocelular em cirrótico', texto: '> 200 com nódulo compatível', unidade: 'ng/mL', observacao: 'Valores entre 20 e 200 são inespecíficos e ocorrem em hepatite ativa e regeneração hepática.' },
      { rotulo: 'Gestação', texto: 'Elevada fisiologicamente, com faixa própria por idade gestacional', unidade: 'ng/mL' },
    ],
    resumo:
      'A principal proteína plasmática do feto, que o adulto praticamente não produz. Volta a subir em tumores hepáticos e germinativos — e também em qualquer fígado que esteja regenerando.',
    entenda:
      'A AFP é a albumina do feto: sintetizada pelo saco vitelino e pelo fígado fetal, cai após o nascimento até valores mínimos. Nos adultos, ela reaparece quando hepatócitos voltam a se comportar como fetais — em regeneração intensa ou em transformação maligna — e quando surge um tumor de células germinativas com componente de saco vitelino. Essa dupla origem explica todo o comportamento clínico do marcador, e explica também por que hepatite ativa a eleva sem que haja câncer.',
    aprofundar: [
      'No carcinoma hepatocelular, a AFP tem sensibilidade limitada: cerca de um terço dos tumores, inclusive alguns grandes, não a produzem. Por isso o rastreio em cirróticos se apoia principalmente na ultrassonografia semestral, com a AFP como complemento. Um valor normal jamais exclui o tumor, e a decisão diagnóstica se apoia no padrão de realce por imagem contrastada, que em cirrótico é suficiente para diagnóstico sem biópsia.',
      'Nos tumores germinativos, a AFP tem um papel diferente e muito mais decisivo: ela participa do estadiamento e da classificação de risco junto com hCG e LDH, orienta a intensidade da quimioterapia e monitora resposta. Um dado de raciocínio que costuma cair em prova e importa na clínica: seminoma puro **não** produz AFP. Uma AFP elevada num tumor histologicamente descrito como seminoma puro significa que existe componente não seminomatoso não amostrado — e o tratamento muda.',
      'A cinética também informa. A meia-vida da AFP é de 5 a 7 dias; após ressecção completa ou quimioterapia eficaz, espera-se queda seguindo essa meia-vida. Um declínio mais lento que o esperado indica doença residual mesmo com imagem negativa, e é critério formal de resposta insuficiente nos protocolos de tumor germinativo.',
      'Na gestação, a AFP materna faz parte do rastreio de segundo trimestre: elevada em defeitos de fechamento do tubo neural e em gastrosquise, reduzida em trissomias. Interpretá-la exige idade gestacional exata — um erro de duas semanas na datação altera completamente o múltiplo da mediana.',
    ],
    fisiologia: {
      oQueE: 'Glicoproteína de 70 kDa, homóloga da albumina, principal proteína transportadora do plasma fetal.',
      origem: 'Saco vitelino e fígado fetal; no adulto, hepatócitos em regeneração ou transformados e tumores germinativos.',
      funcao: 'Transporte de ácidos graxos e hormônios na vida fetal; possível papel imunomodulador.',
      meiaVida: '5 a 7 dias.',
      orgaosEnvolvidos: ['Fígado', 'Saco vitelino', 'Gônadas'],
      percurso: [
        'Fígado fetal produz AFP em grande quantidade',
        'queda progressiva após o nascimento',
        'valores mínimos no adulto',
        'reexpressão em hepatócito regenerando ou transformado',
        'AFP sérica ↑',
      ],
    },
    aumento: {
      resumo: 'Regeneração hepática, carcinoma hepatocelular, tumor germinativo não seminomatoso ou gestação.',
      mecanismos: [
        {
          titulo: 'Reexpressão pelo hepatócito',
          explicacao: 'Hepatócitos em proliferação reativam o programa transcricional fetal, e a AFP volta a ser sintetizada — em regeneração benigna e em transformação maligna igualmente.',
          exemplos: [
            { causa: 'Carcinoma hepatocelular', etapas: ['transformação maligna do hepatócito em fígado cirrótico', 'reexpressão de AFP', 'valores > 200 ng/mL com nódulo à imagem tornam o diagnóstico muito provável'], nota: 'Um terço dos casos não produz AFP — valor normal não exclui.' },
            { causa: 'Hepatite viral ou alcoólica ativa, regeneração pós-lesão', etapas: ['necrose hepatocelular seguida de proliferação', 'reexpressão transitória de AFP', 'valores tipicamente entre 20 e 200 ng/mL', 'queda com a melhora das transaminases'], nota: 'É a causa mais frequente de AFP moderadamente elevada — repetir após controlar a hepatite antes de investigar câncer.' },
          ],
        },
        {
          titulo: 'Produção por tumor germinativo',
          explicacao: 'Componentes de saco vitelino e carcinoma embrionário sintetizam AFP; teratoma e seminoma puro não.',
          exemplos: [
            { causa: 'Tumor germinativo não seminomatoso', etapas: ['componente de saco vitelino ou carcinoma embrionário', 'AFP ↑ com ou sem hCG ↑', 'entra no estadiamento e na estratificação de risco'], nota: 'AFP elevada em "seminoma puro" indica componente não seminomatoso não identificado — muda o tratamento.' },
          ],
        },
        {
          titulo: 'Elevação fisiológica gestacional',
          explicacao: 'A AFP fetal atravessa para o líquido amniótico e para o soro materno, elevando-se de forma esperada.',
          exemplos: [
            { causa: 'Gestação normal', etapas: ['produção pelo fígado fetal', 'passagem para a circulação materna', 'AFP ↑ progressiva com a idade gestacional'], nota: 'Interpretar sem a idade gestacional exata não faz sentido.' },
            { causa: 'Defeito de fechamento do tubo neural', etapas: ['exposição direta do tecido nervoso fetal ao líquido amniótico', 'AFP amniótica e materna ↑↑ acima do esperado para a idade gestacional'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'No rastreio do carcinoma hepatocelular', ids: ['carga-viral-hbv', 'anti-hcv', 'plaquetas', 'albumina'], leitura: 'A AFP complementa a ultrassonografia semestral em cirróticos; plaquetas baixas e albumina baixa indicam a cirrose que justifica o rastreio.' },
      { titulo: 'Nos tumores germinativos', ids: ['beta-hcg', 'ldh'], leitura: 'AFP, hCG e LDH compõem o estadiamento e a classificação de risco. Os três se movem juntos e são acompanhados juntos.' },
    ],
    advertencia:
      'AFP normal não exclui carcinoma hepatocelular, e AFP elevada tem causas benignas frequentes — sobretudo hepatite ativa e gestação. Nunca use este marcador isoladamente para diagnosticar câncer.',
    cinetica: {
      normalizacao: 'Queda conforme meia-vida de 5 a 7 dias após ressecção completa ou resposta terapêutica.',
      tendencia: 'A velocidade de queda pós-tratamento é critério de resposta em tumores germinativos — mais informativa que o valor absoluto.',
    },
    utilidade: ['acompanhamento', 'prognostico', 'rastreamento'],
    estudarTambem: ['beta-hcg', 'ldh', 'alt'],
  },

  {
    id: 'ca-125',
    nome: 'CA 125',
    sigla: 'CA 125',
    sinonimos: ['ca125', 'ca 125', 'muc16', 'antigeno carboidrato 125'],
    grupo: 'tumorais',
    sistemas: ['oncologico'],
    material: 'Soro',
    unidade: 'U/mL',
    referencias: [{ rotulo: 'Adultos', texto: '< 35', unidade: 'U/mL', observacao: 'Faixa derivada de população feminina saudável; elevações discretas são comuns e frequentemente benignas.' }],
    resumo:
      'Glicoproteína do epitélio celômico. Serve para acompanhar câncer de ovário já diagnosticado — e produz mais confusão que informação quando pedido fora desse contexto, porque qualquer irritação peritoneal a eleva.',
    entenda:
      'O CA 125 é expresso pelo mesotélio: pleura, pericárdio, peritônio e endométrio. Isso significa que ele sobe sempre que uma dessas superfícies é irritada — por endometriose, doença inflamatória pélvica, miomas, cirrose com ascite, insuficiência cardíaca, pancreatite, tuberculose peritoneal, e até pela menstruação. A especificidade para câncer de ovário é, portanto, baixa na pré-menopausa e razoavelmente melhor na pós-menopausa, quando essas causas se tornam menos frequentes.',
    aprofundar: [
      'A tentativa de usar CA 125 em rastreamento populacional de câncer de ovário foi estudada em grandes ensaios e não reduziu mortalidade, ao custo de cirurgias desnecessárias em mulheres saudáveis. Essa é uma lição que vale para todo o arquivo: um marcador com sensibilidade modesta aplicado a uma doença de baixa prevalência gera predominantemente falso-positivos, por mais alta que seja sua especificidade aparente.',
      'O uso apropriado é o seguimento. Em paciente com câncer de ovário epitelial que produzia CA 125, a curva do marcador antecipa a recidiva por meses em relação à imagem. Curiosamente, essa antecipação não se traduziu em ganho de sobrevida quando o tratamento foi iniciado apenas pelo marcador — outro lembrete de que detectar antes não é necessariamente tratar melhor.',
      'Na avaliação de uma massa anexial, o CA 125 entra em índices combinados junto com o HE4 (o índice ROMA) e com achados de imagem e estado menopausal. O objetivo desses índices não é diagnosticar, e sim decidir quem deve ser operada por um cirurgião oncológico — decisão que comprovadamente melhora o desfecho.',
    ],
    fisiologia: {
      oQueE: 'Domínio solúvel da mucina MUC16, glicoproteína de alto peso molecular da superfície de epitélios derivados do celoma.',
      origem: 'Mesotélio pleural, pericárdico e peritoneal; epitélio endometrial, tubário e endocervical.',
      funcao: 'Proteção e lubrificação de superfícies epiteliais.',
      orgaosEnvolvidos: ['Ovário', 'Peritônio', 'Pleura', 'Endométrio'],
      percurso: [
        'Expressão em epitélio celômico',
        'irritação, inflamação ou proliferação tumoral',
        'liberação do domínio solúvel',
        'CA 125 sérico ↑',
      ],
    },
    aumento: {
      resumo: 'Irritação de qualquer superfície mesotelial, ou proliferação de tumor epitelial de ovário, endométrio, trompa ou peritônio.',
      mecanismos: [
        {
          titulo: 'Irritação mesotelial benigna',
          explicacao: 'Qualquer processo que inflame pleura, peritônio ou endométrio libera MUC16 solúvel — não há nada de tumoral nisso.',
          exemplos: [
            { causa: 'Endometriose, doença inflamatória pélvica, miomatose, menstruação, gestação inicial', etapas: ['estímulo do epitélio endometrial e peritoneal', 'liberação de CA 125', 'valores frequentemente entre 35 e 200 U/mL'], nota: 'Na pré-menopausa, essas causas superam largamente a neoplasia em frequência.' },
            { causa: 'Cirrose com ascite, insuficiência cardíaca, pancreatite, tuberculose peritoneal', etapas: ['distensão e inflamação do mesotélio', 'CA 125 ↑ por vezes acentuadamente', 'ausência de neoplasia'], nota: 'Ascite de qualquer origem eleva o CA 125 — não use o marcador para diferenciar ascite benigna de maligna.' },
          ],
        },
        {
          titulo: 'Produção tumoral',
          explicacao: 'Tumores epiteliais serosos derivados do mesmo epitélio celômico superexpressam a mucina.',
          exemplos: [
            { causa: 'Carcinoma epitelial de ovário, tuba ou peritônio', etapas: ['proliferação de epitélio seroso', 'CA 125 ↑↑, frequentemente centenas ou milhares', 'a curva ao longo do tratamento reflete resposta e recidiva'], nota: 'Cerca de metade dos tumores em estádio I não eleva o marcador — por isso ele falha no rastreio.' },
            { causa: 'Adenocarcinomas de endométrio, pâncreas, mama e pulmão com disseminação peritoneal', etapas: ['carcinomatose peritoneal', 'CA 125 ↑ sem que o primário seja ovariano'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na massa anexial', ids: ['he4'], leitura: 'O HE4 é menos afetado por endometriose e por condições benignas; combinado ao CA 125 no índice ROMA, melhora a discriminação e orienta o encaminhamento cirúrgico.' },
    ],
    advertencia:
      'Não use CA 125 para rastreamento de câncer de ovário em mulheres assintomáticas: os grandes ensaios não demonstraram redução de mortalidade e o dano por cirurgias desnecessárias é real. Elevações discretas na pré-menopausa quase sempre têm causa benigna.',
    utilidade: ['acompanhamento', 'prognostico'],
    estudarTambem: ['he4', 'cea'],
  },

  {
    id: 'ca-19-9',
    nome: 'CA 19-9',
    sigla: 'CA 19-9',
    sinonimos: ['ca19-9', 'ca 19 9', 'antigeno carboidrato 19-9', 'gicaa'],
    grupo: 'tumorais',
    sistemas: ['oncologico', 'digestivo', 'hepatobiliar'],
    material: 'Soro',
    unidade: 'U/mL',
    referencias: [{ rotulo: 'Adultos', texto: '< 37', unidade: 'U/mL', observacao: 'Indivíduos Lewis-negativos (5 a 10% da população) não produzem o antígeno e têm valores indetectáveis mesmo com tumor avançado.' }],
    resumo:
      'Antígeno relacionado ao câncer de pâncreas e vias biliares. Sua causa mais comum de elevação, no entanto, é a colestase benigna — e cerca de uma pessoa em cada dez não o produz.',
    entenda:
      'O CA 19-9 é um epítopo carboidrato construído sobre o antígeno de grupo sanguíneo Lewis. Quem não expressa a enzima fucosiltransferase — os Lewis-negativos, 5 a 10% da população — simplesmente não sintetiza o antígeno, e terá CA 19-9 indetectável ainda que tenha um adenocarcinoma pancreático extenso. É uma limitação estrutural do exame que nenhuma otimização de corte resolve.',
    aprofundar: [
      'A colestase eleva o CA 19-9 de forma marcante e independente de neoplasia: o epitélio biliar produz o antígeno e a obstrução impede sua drenagem. Um valor de várias centenas em paciente ictérico não distingue tumor de coledocolitíase. A conduta correta é desobstruir e repetir: se o valor cai proporcionalmente à bilirrubina, a elevação era colestática.',
      'O uso legítimo do marcador está no acompanhamento do adenocarcinoma de pâncreas já diagnosticado. A queda pós-operatória e a ausência de reascensão correlacionam-se com controle da doença, e uma elevação sustentada precede a recidiva por imagem. Também tem valor prognóstico pré-operatório: valores muito altos apesar de bilirrubina normal sugerem doença mais extensa do que a imagem mostra.',
      'Valores muito elevados — acima de mil — em paciente sem colestase têm probabilidade alta de doença maligna, geralmente já avançada. Mas mesmo aí o diagnóstico é histológico ou citológico; o marcador orienta a intensidade da investigação, não a substitui.',
    ],
    fisiologia: {
      oQueE: 'Epítopo carboidrato sialilado (sialil-Lewis a) presente em mucinas de epitélios ductais.',
      origem: 'Epitélio ductal pancreático, biliar, gástrico e colônico.',
      funcao: 'Componente de mucinas de superfície; participa de adesão celular.',
      eliminacao: 'Excreção biliar — daí a elevação acentuada em qualquer colestase.',
      orgaosEnvolvidos: ['Pâncreas', 'Vias biliares', 'Estômago', 'Cólon'],
      percurso: [
        'Síntese em epitélio ductal',
        'secreção nas mucinas',
        'excreção pela bile',
        'obstrução biliar ou proliferação tumoral',
        'CA 19-9 sérico ↑',
      ],
    },
    aumento: {
      resumo: 'Colestase de qualquer causa, inflamação pancreatobiliar ou adenocarcinoma ductal.',
      mecanismos: [
        {
          titulo: 'Retenção por colestase',
          explicacao: 'A excreção normal é biliar; qualquer obstrução ao fluxo eleva a concentração sérica sem participação tumoral.',
          exemplos: [
            { causa: 'Coledocolitíase, colangite, estenose biliar benigna', etapas: ['obstrução do fluxo biliar', 'retenção do antígeno', 'CA 19-9 ↑ proporcional à bilirrubina', 'queda após desobstrução'], nota: 'Repetir após resolver a colestase é o passo que evita investigação oncológica desnecessária.' },
            { causa: 'Cirrose, pancreatite crônica, colangite esclerosante', etapas: ['inflamação crônica do epitélio ductal', 'CA 19-9 moderadamente ↑ de forma persistente'] },
          ],
        },
        {
          titulo: 'Produção tumoral',
          explicacao: 'Adenocarcinomas ductais superexpressam mucinas com o epítopo sialil-Lewis a.',
          exemplos: [
            { causa: 'Adenocarcinoma de pâncreas', etapas: ['proliferação de epitélio ductal maligno', 'CA 19-9 frequentemente > 1.000 U/mL', 'queda pós-ressecção e reascensão na recidiva'], nota: 'A curva no seguimento é o uso mais defensável do exame.' },
            { causa: 'Colangiocarcinoma, câncer gástrico, colorretal e de ovário mucinoso', etapas: ['expressão do antígeno pelo tumor', 'CA 19-9 ↑ sem especificidade de sítio'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para interpretar uma elevação', ids: ['bilirrubina-total', 'fosfatase-alcalina', 'ggt'], leitura: 'Antes de atribuir um CA 19-9 alto a neoplasia, verifique se há colestase. Bilirrubina, fosfatase alcalina e GGT respondem essa pergunta.' },
    ],
    advertencia:
      'Não serve para rastreamento. Indivíduos Lewis-negativos não produzem o antígeno e podem ter câncer com marcador indetectável; a colestase benigna é a causa mais comum de valores altos.',
    utilidade: ['acompanhamento', 'prognostico'],
    estudarTambem: ['cea', 'bilirrubina-total', 'lipase'],
  },

  {
    id: 'ca-15-3',
    nome: 'CA 15-3 e CA 27.29',
    sigla: 'CA 15-3',
    sinonimos: ['ca15-3', 'ca 15 3', 'ca 27.29', 'ca 27-29', 'muc1', 'marcador de mama'],
    grupo: 'tumorais',
    sistemas: ['oncologico'],
    material: 'Soro',
    unidade: 'U/mL',
    referencias: [{ rotulo: 'Adultos', texto: '< 30', unidade: 'U/mL' }],
    resumo:
      'Fragmentos solúveis da mucina MUC1 do epitélio mamário. Usados apenas no acompanhamento de câncer de mama metastático — jamais em rastreamento ou em doença localizada.',
    entenda:
      'CA 15-3 e CA 27.29 medem epítopos diferentes da mesma molécula, a MUC1, e se comportam de forma equivalente. Sua sensibilidade em doença localizada é baixíssima — a maioria dos tumores iniciais não os eleva — e sua especificidade é comprometida por hepatopatias, doenças benignas da mama e outras neoplasias. O único uso com respaldo é acompanhar a resposta em doença metastática, e mesmo aí como complemento à avaliação clínica e de imagem.',
    aprofundar: [
      'Uma armadilha do seguimento merece nota: no início de uma quimioterapia eficaz, o marcador pode subir transitoriamente por lise tumoral — o chamado "flare". Interpretar essa subida como progressão e trocar o tratamento no primeiro ciclo é um erro que retira do paciente um esquema que estava funcionando. A regra é confirmar com nova dosagem e com imagem antes de qualquer decisão.',
      'Diretrizes de sociedades oncológicas desaconselham explicitamente o uso desses marcadores no seguimento de rotina de câncer de mama tratado com intenção curativa. A detecção precoce de recidiva assintomática por marcador não demonstrou ganho de sobrevida, e o custo em ansiedade e exames adicionais é alto.',
    ],
    fisiologia: {
      oQueE: 'Epítopos solúveis da mucina transmembrana MUC1, liberados da superfície do epitélio glandular.',
      origem: 'Epitélio mamário, e também pulmonar, ovariano e endometrial.',
      funcao: 'Componente do glicocálice epitelial; participa de proteção e sinalização celular.',
      orgaosEnvolvidos: ['Mama', 'Fígado'],
      percurso: ['MUC1 na superfície do epitélio glandular', 'clivagem do ectodomínio', 'liberação na circulação', 'aumento proporcional à massa tumoral em doença avançada'],
    },
    aumento: {
      resumo: 'Doença metastática com carga tumoral significativa, hepatopatia ou outras condições benignas.',
      mecanismos: [
        {
          titulo: 'Carga tumoral em doença avançada',
          explicacao: 'A quantidade liberada é proporcional à massa de células expressando MUC1 — o que só alcança níveis mensuráveis em doença volumosa.',
          exemplos: [
            { causa: 'Câncer de mama metastático', etapas: ['massa tumoral significativa, sobretudo hepática ou óssea', 'liberação de MUC1 solúvel', 'CA 15-3 ↑ com curva acompanhando a resposta'], nota: 'A tendência ao longo dos ciclos vale; um valor isolado não.' },
            { causa: 'Flare por resposta ao tratamento', etapas: ['lise tumoral no início da quimioterapia', 'liberação abrupta de mucina', 'elevação transitória do marcador', 'queda subsequente'], nota: 'Subida nas primeiras semanas de tratamento eficaz não é progressão.' },
          ],
        },
        {
          titulo: 'Elevação benigna',
          explicacao: 'Hepatopatia crônica e doenças benignas da mama elevam moderadamente por aumento de expressão ou redução de depuração.',
          exemplos: [
            { causa: 'Cirrose, hepatite crônica, doença mamária benigna, gestação', etapas: ['expressão aumentada ou depuração reduzida', 'CA 15-3 discretamente ↑', 'sem neoplasia'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'No seguimento oncológico', ids: ['cea', 'fosfatase-alcalina', 'calcio'], leitura: 'CEA e CA 15-3 costumam ser acompanhados juntos; fosfatase alcalina e cálcio altos sugerem progressão óssea.' },
    ],
    advertencia:
      'Não indicado para rastreamento nem para seguimento de rotina de câncer de mama tratado com intenção curativa. Elevação isolada não justifica mudança de tratamento sem confirmação clínica e de imagem.',
    utilidade: ['acompanhamento'],
    estudarTambem: ['cea', 'ca-125'],
  },

  {
    id: 'he4',
    nome: 'HE4 e índice ROMA',
    sigla: 'HE4',
    sinonimos: ['he4', 'proteina 4 do epididimo humano', 'roma', 'indice roma'],
    grupo: 'tumorais',
    sistemas: ['oncologico'],
    material: 'Soro',
    unidade: 'pmol/L',
    referencias: [
      { rotulo: 'Pré-menopausa', texto: '< 70', unidade: 'pmol/L' },
      { rotulo: 'Pós-menopausa', texto: '< 140', unidade: 'pmol/L' },
      { rotulo: 'Índice ROMA — alto risco (pré-menopausa)', texto: '≥ 11,4%', unidade: '%' },
      { rotulo: 'Índice ROMA — alto risco (pós-menopausa)', texto: '≥ 29,9%', unidade: '%' },
    ],
    resumo:
      'Marcador que complementa o CA 125 na avaliação de massa anexial. Sua vantagem é não se elevar na endometriose — exatamente a causa benigna que mais confunde o CA 125.',
    entenda:
      'O HE4 é uma proteína inibidora de protease expressa no epitélio do trato reprodutivo. Sua utilidade não está em ser mais sensível que o CA 125, e sim em ser afetado por causas benignas diferentes: enquanto o CA 125 sobe em endometriose, miomas e doença inflamatória pélvica, o HE4 permanece normal nessas condições. Combinar os dois num índice (ROMA), junto com o estado menopausal, melhora a capacidade de estimar risco de malignidade de uma massa anexial.',
    aprofundar: [
      'O objetivo do índice ROMA é operacional, não diagnóstico: decidir se aquela mulher deve ser operada em serviço com cirurgião oncológico especializado. Essa decisão tem impacto documentado em sobrevida no câncer de ovário, porque a citorredução completa depende da experiência do cirurgião. Um marcador que melhora o encaminhamento vale mais, nesse caso, do que um que apenas descreve.',
      'A limitação importante: o HE4 é depurado pelo rim e se eleva na insuficiência renal, o que pode inflar o índice em pacientes com doença renal crônica. Também sobe em fibrose pulmonar e, discretamente, com a idade. Interpretar sem olhar a creatinina produz falso alarme.',
    ],
    fisiologia: {
      oQueE: 'Proteína 4 do epidídimo humano (WFDC2), inibidora de protease de baixo peso molecular.',
      origem: 'Epitélio do trato reprodutivo, glândulas salivares e trato respiratório.',
      funcao: 'Provável papel em defesa inata e em maturação de espermatozoides.',
      eliminacao: 'Depuração renal — daí a elevação na insuficiência renal.',
      orgaosEnvolvidos: ['Ovário', 'Trompa', 'Rim'],
      percurso: ['Expressão epitelial', 'superexpressão em carcinoma seroso e endometrioide', 'liberação sérica', 'depuração renal'],
    },
    aumento: {
      resumo: 'Carcinoma epitelial de ovário e de endométrio — ou insuficiência renal, que precisa ser descartada antes.',
      mecanismos: [
        {
          titulo: 'Superexpressão tumoral',
          explicacao: 'Carcinomas serosos e endometrioides expressam HE4 em níveis muito superiores ao epitélio normal.',
          exemplos: [
            { causa: 'Carcinoma epitelial de ovário', etapas: ['superexpressão de WFDC2', 'HE4 ↑ com CA 125 ↑', 'índice ROMA acima do corte', 'encaminhamento para cirurgia oncológica especializada'] },
            { causa: 'Massa anexial por endometriose', etapas: ['CA 125 ↑ pela irritação peritoneal', 'HE4 permanece normal', 'índice ROMA baixo'], nota: 'É exatamente a situação em que o HE4 corrige o erro do CA 125.' },
          ],
        },
        {
          titulo: 'Retenção renal',
          explicacao: 'A depuração é renal; a queda da filtração eleva o marcador sem qualquer neoplasia.',
          exemplos: [
            { causa: 'Doença renal crônica', etapas: ['TFG ↓', 'HE4 ↑', 'índice ROMA falsamente elevado'], nota: 'Sempre interpretar com a creatinina ao lado.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O par da avaliação anexial', ids: ['ca-125', 'creatinina'], leitura: 'CA 125 e HE4 compõem o ROMA; a creatinina é obrigatória para não superestimar o risco em doença renal.' },
    ],
    advertencia: 'Não é teste de rastreamento populacional. O índice ROMA estima risco e orienta encaminhamento cirúrgico — não substitui histologia.',
    utilidade: ['prognostico', 'acompanhamento'],
    estudarTambem: ['ca-125', 'creatinina'],
  },

  {
    id: 'cyfra-21-1',
    nome: 'CYFRA 21-1, NSE e ProGRP',
    sigla: 'CYFRA',
    sinonimos: ['cyfra 21-1', 'cyfra', 'nse', 'enolase neuronio especifica', 'progrp', 'marcadores de pulmao'],
    grupo: 'tumorais',
    sistemas: ['oncologico', 'respiratorio', 'neurologico'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'CYFRA 21-1', texto: '< 3,3', unidade: 'ng/mL' },
      { rotulo: 'NSE (enolase neurônio-específica)', texto: '< 16,3', unidade: 'ng/mL', observacao: 'A hemólise da amostra eleva falsamente — a enolase está dentro da hemácia.' },
      { rotulo: 'ProGRP', texto: '< 63', unidade: 'pg/mL' },
    ],
    resumo:
      'Marcadores do câncer de pulmão, com divisão de trabalho: o CYFRA acompanha carcinomas não pequenas células, enquanto NSE e ProGRP acompanham o carcinoma de pequenas células e outros tumores neuroendócrinos.',
    entenda:
      'O CYFRA 21-1 é um fragmento da citoqueratina 19, proteína do citoesqueleto epitelial liberada na morte celular — sobe, portanto, em qualquer tumor epitelial com turnover alto, especialmente o carcinoma escamoso de pulmão. A NSE é a enolase das células neuroendócrinas e dos neurônios, elevando-se no carcinoma de pequenas células, no neuroblastoma e em lesão neuronal aguda. O ProGRP é mais específico para pequenas células e menos sujeito a interferência.',
    aprofundar: [
      'A NSE tem uma armadilha pré-analítica severa: as hemácias contêm enolase, e qualquer hemólise, ainda que discreta e invisível, eleva o resultado substancialmente. Amostra que demorou a ser centrifugada, coleta difícil com garrote prolongado ou tubo agitado geram valores altos sem doença. Antes de interpretar uma NSE elevada, é obrigatório perguntar sobre a qualidade da amostra.',
      'A NSE tem também um uso fora da oncologia que vale conhecer: como marcador de lesão neuronal em prognóstico neurológico após parada cardiorrespiratória. Valores muito elevados nas primeiras 48 a 72 horas associam-se a mau prognóstico neurológico — mas nunca isoladamente, e sempre dentro de protocolos que combinam exame neurológico, eletroencefalograma e imagem. Prognosticar com base num único marcador seria inaceitável.',
      'Nenhum destes marcadores serve para rastreamento de câncer de pulmão; o rastreio com respaldo é a tomografia de baixa dose em população de risco definida por tabagismo e idade.',
    ],
    fisiologia: {
      oQueE: 'CYFRA 21-1: fragmento solúvel da citoqueratina 19. NSE: isoenzima gama da enolase, das células neuroendócrinas. ProGRP: precursor do peptídeo liberador de gastrina.',
      origem: 'Epitélio escamoso (CYFRA); células neuroendócrinas e neurônios (NSE e ProGRP).',
      funcao: 'Citoqueratina: citoesqueleto epitelial. Enolase: glicólise. GRP: neuropeptídeo regulador.',
      orgaosEnvolvidos: ['Pulmão', 'Sistema nervoso', 'Sistema neuroendócrino difuso'],
      percurso: ['Turnover ou necrose de células tumorais', 'liberação de proteínas intracelulares', 'aumento sérico proporcional à carga tumoral e à taxa de morte celular'],
    },
    aumento: {
      resumo: 'Carga tumoral pulmonar ou neuroendócrina — e, no caso da NSE, também hemólise da amostra e lesão neuronal.',
      mecanismos: [
        {
          titulo: 'Liberação por morte de células tumorais',
          explicacao: 'Proteínas estruturais e enzimas intracelulares alcançam a circulação quando a célula tumoral morre — daí a correlação com massa e com atividade proliferativa.',
          exemplos: [
            { causa: 'Carcinoma pulmonar não pequenas células, sobretudo escamoso', etapas: ['turnover elevado de células epiteliais malignas', 'liberação de fragmentos de citoqueratina 19', 'CYFRA 21-1 ↑ proporcional ao estádio'] },
            { causa: 'Carcinoma de pequenas células e neuroblastoma', etapas: ['proliferação de células neuroendócrinas', 'NSE e ProGRP ↑', 'curva acompanha resposta à quimioterapia'], nota: 'No neuroblastoma infantil, a NSE integra a estratificação de risco.' },
          ],
        },
        {
          titulo: 'Elevações não oncológicas',
          explicacao: 'Insuficiência renal, doenças pulmonares crônicas e — no caso da NSE — hemólise e lesão neuronal elevam sem tumor.',
          exemplos: [
            { causa: 'Hemólise da amostra', etapas: ['ruptura de hemácias durante coleta ou transporte', 'liberação de enolase eritrocitária', 'NSE falsamente elevada'], nota: 'É a causa mais frequente de NSE alta na prática — verificar sempre.' },
            { causa: 'Insuficiência renal, fibrose pulmonar, DPOC', etapas: ['depuração reduzida ou turnover epitelial aumentado', 'CYFRA ↑ moderadamente sem neoplasia'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'No acompanhamento do câncer de pulmão', ids: ['cea', 'ldh'], leitura: 'CEA e LDH complementam; LDH muito alta em pequenas células indica alta carga tumoral e pior prognóstico.' },
    ],
    advertencia:
      'Nenhum destes marcadores serve para rastreamento de câncer de pulmão. A NSE é muito sensível à hemólise e não deve ser interpretada em amostra de qualidade duvidosa.',
    interferentes: {
      preAnalitico: ['Hemólise, mesmo discreta, eleva acentuadamente a NSE.', 'Demora na centrifugação libera enolase plaquetária e eritrocitária.'],
    },
    utilidade: ['acompanhamento', 'prognostico'],
    estudarTambem: ['cea', 'ldh', 'cromogranina-a'],
  },

  {
    id: 'cromogranina-a',
    nome: 'Cromogranina A',
    sigla: 'CgA',
    sinonimos: ['cromogranina a', 'cga', 'chromogranin a'],
    grupo: 'tumorais',
    sistemas: ['oncologico', 'endocrino', 'digestivo'],
    material: 'Soro (jejum, sem inibidor de bomba de prótons)',
    unidade: 'ng/mL',
    referencias: [{ rotulo: 'Adultos', texto: '< 100', unidade: 'ng/mL', observacao: 'Extremamente sensível ao uso de inibidores de bomba de prótons, que devem ser suspensos por pelo menos duas semanas antes da coleta quando clinicamente possível.' }],
    resumo:
      'Proteína dos grânulos secretores neuroendócrinos. Marcador geral dos tumores neuroendócrinos — e o exame mais frequentemente invalidado por uso de omeprazol.',
    entenda:
      'A cromogranina A é armazenada e liberada junto com hormônios pelas células neuroendócrinas de todo o organismo. Por isso ela sobe em tumores neuroendócrinos de qualquer sítio, independentemente do hormônio que secretem — inclusive nos não funcionantes, que não produzem síndrome clínica. Essa amplitude é sua força e sua fraqueza: ela detecta amplamente e localiza nada.',
    aprofundar: [
      'O erro mais comum com este exame não é de interpretação, é de preparo. Os inibidores de bomba de prótons suprimem o ácido gástrico, o que estimula as células enterocromafins-like do estômago por via da gastrina, elevando a cromogranina A várias vezes acima do normal. Um paciente em uso crônico de omeprazol pode ter valores que sugerem tumor neuroendócrino sem ter nenhum. A suspensão prévia por duas semanas, quando segura, é parte do exame.',
      'Outras causas de elevação sem tumor precisam ser lembradas: insuficiência renal (depuração reduzida), gastrite atrófica com hipergastrinemia, insuficiência cardíaca, hepatopatia e uso de corticoide. Em conjunto, elas fazem com que uma cromogranina moderadamente elevada tenha valor preditivo positivo baixo fora de um contexto clínico dirigido.',
      'O uso mais defensável é o seguimento de tumor neuroendócrino já diagnosticado: a curva acompanha carga tumoral e antecipa progressão. No tumor carcinoide, ela complementa o ácido 5-hidroxindolacético urinário, que é mais específico para o componente funcionante.',
    ],
    fisiologia: {
      oQueE: 'Glicoproteína ácida da matriz dos grânulos de secreção das células neuroendócrinas.',
      origem: 'Células neuroendócrinas do trato gastrointestinal, pâncreas, medula adrenal e sistema nervoso.',
      funcao: 'Organizar a matriz granular e servir de precursor de peptídeos como pancreastatina e vasostatina.',
      eliminacao: 'Depuração renal e hepática.',
      orgaosEnvolvidos: ['Trato gastrointestinal', 'Pâncreas', 'Medula adrenal', 'Pulmão'],
      percurso: [
        'Armazenamento no grânulo secretor',
        'exocitose junto com o hormônio',
        'liberação na circulação',
        'concentração proporcional à massa de tecido neuroendócrino',
      ],
    },
    aumento: {
      resumo: 'Tumor neuroendócrino — ou, muito mais frequentemente, uso de inibidor de bomba de prótons, insuficiência renal ou gastrite atrófica.',
      mecanismos: [
        {
          titulo: 'Massa neuroendócrina tumoral',
          explicacao: 'A quantidade circulante é proporcional ao número de células com grânulos secretores.',
          exemplos: [
            { causa: 'Tumor neuroendócrino gastroenteropancreático', etapas: ['expansão de células com grânulos', 'liberação basal aumentada', 'CgA ↑ proporcional à carga tumoral', 'curva acompanha resposta e progressão'], nota: 'Detecta também tumores não funcionantes, que não produzem síndrome clínica.' },
            { causa: 'Feocromocitoma e paraganglioma', etapas: ['tecido cromafim expandido', 'CgA ↑ junto com metanefrinas'], nota: 'As metanefrinas são o exame diagnóstico; a CgA complementa no seguimento.' },
          ],
        },
        {
          titulo: 'Estímulo fisiológico e retenção',
          explicacao: 'Hipocloridria estimula as células enterocromafins-like; a insuficiência renal reduz a depuração.',
          exemplos: [
            { causa: 'Uso de inibidor de bomba de prótons', etapas: ['supressão ácida', 'gastrina ↑ como resposta', 'hiperplasia e estímulo das células ECL gástricas', 'CgA ↑ várias vezes o normal sem tumor'], nota: 'Causa mais frequente de resultado alterado — suspender por duas semanas antes da coleta quando possível.' },
            { causa: 'Gastrite atrófica autoimune, insuficiência renal, insuficiência cardíaca', etapas: ['hipergastrinemia ou depuração reduzida', 'CgA ↑ moderadamente'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na investigação de síndrome carcinoide', ids: ['acido-5-hidroxiindolacetico', 'histamina'], leitura: 'O 5-HIAA urinário é mais específico para o carcinoide funcionante; a CgA detecta a massa tumoral, funcionante ou não.' },
      { titulo: 'Antes de valorizar um resultado alto', ids: ['creatinina', 'gastrina'], leitura: 'Creatinina alta e gastrina alta explicam a maioria das elevações benignas.' },
    ],
    advertencia: 'Resultado sem valor interpretativo em paciente usando inibidor de bomba de prótons. Não use para rastreamento.',
    interferentes: {
      medicamentos: ['Inibidores de bomba de prótons elevam acentuadamente — a interferência mais importante deste exame.', 'Corticoides elevam.'],
      fisiologico: ['Alimentação recente eleva — colher em jejum.'],
    },
    utilidade: ['acompanhamento', 'prognostico'],
    estudarTambem: ['acido-5-hidroxiindolacetico', 'metanefrinas', 'gastrina'],
  },

  {
    id: 'calcitonina',
    nome: 'Calcitonina',
    sinonimos: ['calcitonina', 'ct serica', 'calcitonina serica'],
    grupo: 'tumorais',
    sistemas: ['endocrino', 'oncologico', 'metabolico'],
    material: 'Soro',
    unidade: 'pg/mL',
    referencias: [
      { rotulo: 'Homens', texto: '< 8,4', unidade: 'pg/mL' },
      { rotulo: 'Mulheres', texto: '< 5,0', unidade: 'pg/mL' },
      { rotulo: 'Altamente sugestivo de carcinoma medular', texto: '> 100', unidade: 'pg/mL' },
    ],
    resumo:
      'Hormônio das células parafoliculares C da tireoide. É um dos raros marcadores tumorais com valor diagnóstico real: define e acompanha o carcinoma medular de tireoide.',
    entenda:
      'A calcitonina reduz o cálcio sérico inibindo a reabsorção óssea, mas seu papel fisiológico no adulto é modesto — tireoidectomizados não desenvolvem distúrbio do cálcio por falta dela. Seu valor é outro: as células C são as únicas que a produzem, e o carcinoma medular deriva delas. Isso faz da calcitonina um marcador quase específico de tecido, com correlação estreita com massa tumoral — propriedade que quase nenhum outro marcador oncológico tem.',
    aprofundar: [
      'Valores acima de 100 pg/mL em paciente com nódulo tireoidiano são altamente sugestivos de carcinoma medular, e valores muito elevados indicam doença extensa ou metastática. Após a tireoidectomia, a calcitonina deve se tornar indetectável; sua persistência indica doença residual, e o tempo de duplicação no seguimento é um dos melhores preditores prognósticos disponíveis em oncologia endócrina.',
      'Elevações moderadas — entre o limite superior e 100 pg/mL — têm diagnóstico diferencial amplo: hiperplasia de células C, tireoidite de Hashimoto, insuficiência renal, hipergastrinemia, uso de inibidor de bomba de prótons, tabagismo e mesmo sepse. O teste de estímulo com cálcio ou pentagastrina ajuda a separar hiperplasia de neoplasia nesses casos.',
      'O carcinoma medular pode ser esporádico ou hereditário, como parte das neoplasias endócrinas múltiplas tipo 2, ligadas a mutações do proto-oncogene RET. Todo diagnóstico novo deve levar à pesquisa genética, porque um resultado positivo muda o cuidado de toda a família — inclusive indicando tireoidectomia profilática em portadores assintomáticos. É um dos casos em que um exame laboratorial num paciente altera decisões cirúrgicas em parentes que ainda não adoeceram.',
    ],
    fisiologia: {
      oQueE: 'Hormônio peptídeo de 32 aminoácidos produzido pelas células parafoliculares C.',
      origem: 'Células C da tireoide, de origem neuroendócrina.',
      funcao: 'Inibir a atividade osteoclástica e reduzir a reabsorção tubular de cálcio — papel fisiológico limitado no adulto.',
      eliminacao: 'Depuração renal e hepática.',
      orgaosEnvolvidos: ['Tireoide', 'Osso', 'Rim'],
      percurso: ['Cálcio sérico ↑', 'estímulo das células C', 'secreção de calcitonina', 'inibição de osteoclastos', 'redução discreta do cálcio'],
    },
    aumento: {
      resumo: 'Carcinoma medular de tireoide, hiperplasia de células C, ou causas não tireoidianas de menor magnitude.',
      mecanismos: [
        {
          titulo: 'Proliferação de células C',
          explicacao: 'A concentração é proporcional à massa de células C — normais, hiperplásicas ou malignas.',
          exemplos: [
            { causa: 'Carcinoma medular de tireoide', etapas: ['proliferação maligna de células C', 'calcitonina ↑↑ proporcional ao volume tumoral', 'CEA frequentemente elevado em paralelo', 'persistência pós-operatória indica doença residual'], nota: 'CEA e calcitonina se acompanham; a dissociação — CEA subindo com calcitonina estável — sugere desdiferenciação e pior prognóstico.' },
            { causa: 'Neoplasia endócrina múltipla tipo 2', etapas: ['mutação germinativa no RET', 'hiperplasia de células C evoluindo para carcinoma', 'associação com feocromocitoma e hiperparatireoidismo'], nota: 'Diagnóstico obriga pesquisa de RET e rastreio familiar.' },
          ],
        },
        {
          titulo: 'Elevações não neoplásicas',
          explicacao: 'Redução da depuração ou estímulo crônico das células C elevam moderadamente.',
          exemplos: [
            { causa: 'Insuficiência renal, tireoidite de Hashimoto, uso de inibidor de bomba de prótons, tabagismo', etapas: ['depuração reduzida ou estímulo por gastrina', 'calcitonina discretamente ↑', 'teste de estímulo ajuda a diferenciar'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'No carcinoma medular', ids: ['cea', 'calcio', 'pth', 'metanefrinas'], leitura: 'CEA acompanha a calcitonina no seguimento. Cálcio, PTH e metanefrinas rastreiam os outros componentes da NEM 2 antes de qualquer cirurgia — operar um feocromocitoma não diagnosticado é catastrófico.' },
    ],
    advertencia:
      'Antes de tireoidectomia por carcinoma medular, é obrigatório excluir feocromocitoma: a manipulação cirúrgica de um feocromocitoma não diagnosticado pode desencadear crise hipertensiva fatal.',
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    estudarTambem: ['cea', 'metanefrinas', 'pth'],
  },

  {
    id: 'tireoglobulina',
    nome: 'Tireoglobulina e anticorpo antitireoglobulina',
    sigla: 'Tg',
    sinonimos: ['tireoglobulina', 'tg', 'anti-tg', 'anti tireoglobulina', 'antitireoglobulina'],
    grupo: 'tumorais',
    sistemas: ['endocrino', 'oncologico'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Tireoide íntegra', minimo: 1.4, maximo: 78, unidade: 'ng/mL' },
      { rotulo: 'Pós-tireoidectomia total com ablação', texto: '< 0,2 (indetectável)', unidade: 'ng/mL' },
      { rotulo: 'Anticorpo antitireoglobulina', texto: 'Ausente', unidade: '', observacao: 'Sua presença invalida a dosagem da tireoglobulina — deve ser dosado sempre junto.' },
    ],
    resumo:
      'A proteína de armazenamento do hormônio tireoidiano. Depois de uma tireoidectomia total por carcinoma diferenciado, ela só pode vir de tecido tireoidiano remanescente ou de metástase — e é por isso que se torna o marcador de seguimento.',
    entenda:
      'A tireoglobulina é produzida exclusivamente por células foliculares tireoidianas, normais ou neoplásicas. Numa pessoa com tireoide íntegra ela não informa nada sobre câncer — sobe em bócio, tireoidite e qualquer condição que aumente a massa ou a permeabilidade folicular. Seu valor aparece depois da remoção completa da glândula: com nenhum tecido tireoidiano restante, qualquer tireoglobulina detectável indica tecido remanescente ou doença.',
    aprofundar: [
      'A regra que não pode ser esquecida: **sempre dosar o anticorpo antitireoglobulina junto**. Presente em cerca de 20 a 25% dos pacientes com carcinoma diferenciado, ele interfere no imunoensaio e produz tireoglobulina falsamente baixa ou indetectável — exatamente no paciente que tem doença. Um laudo de tireoglobulina sem o anticorpo é um laudo incompleto e potencialmente perigoso.',
      'Nesses pacientes com anticorpo positivo, a própria curva do anticorpo passa a servir de marcador substituto: sua queda progressiva após o tratamento sugere ausência de antígeno (ou seja, ausência de tecido tireoidiano), enquanto sua reascensão sugere recidiva.',
      'A tireoglobulina estimulada — medida após suspensão da levotiroxina ou após TSH recombinante — tem sensibilidade maior que a basal, porque o TSH alto estimula a produção pelo tecido remanescente. Com os ensaios ultrassensíveis atuais, a dosagem basal passou a ser suficiente na maioria dos casos de baixo risco, poupando o paciente do hipotireoidismo de preparo.',
    ],
    fisiologia: {
      oQueE: 'Glicoproteína de alto peso molecular que serve de matriz para a síntese e o armazenamento dos hormônios tireoidianos.',
      origem: 'Células foliculares da tireoide; armazenada no coloide.',
      funcao: 'Fornecer os resíduos de tirosina que serão iodados para formar T3 e T4.',
      orgaosEnvolvidos: ['Tireoide'],
      percurso: [
        'Síntese pela célula folicular',
        'secreção no coloide',
        'iodação dos resíduos de tirosina',
        'endocitose e proteólise liberando T3 e T4',
        'pequena fração de tireoglobulina íntegra alcança a circulação',
      ],
    },
    aumento: {
      resumo: 'Presença de tecido tireoidiano — normal, hiperplásico, inflamado ou neoplásico.',
      significado: 'Após tireoidectomia total com ablação, qualquer valor detectável indica tecido remanescente ou doença persistente/recidivada.',
      mecanismos: [
        {
          titulo: 'Massa ou permeabilidade folicular aumentada',
          explicacao: 'Mais tecido, ou tecido com folículos rompidos, libera mais tireoglobulina na circulação.',
          exemplos: [
            { causa: 'Recidiva ou metástase de carcinoma diferenciado', etapas: ['tecido tireoidiano neoplásico produzindo tireoglobulina', 'valor detectável ou ascendente após tireoidectomia', 'investigação por imagem e pesquisa de corpo inteiro'], nota: 'A tendência entre medidas vale mais que um valor isolado.' },
            { causa: 'Tireoidite subaguda ou de Hashimoto', etapas: ['ruptura folicular com extravasamento de coloide', 'tireoglobulina ↑ sem neoplasia'], nota: 'Em paciente com tireoide íntegra, o exame não tem valor oncológico.' },
            { causa: 'Tireotoxicose factícia', etapas: ['ingestão exógena de hormônio tireoidiano', 'supressão da glândula', 'T4 alto com tireoglobulina ↓↓'], nota: 'Aqui a tireoglobulina baixa é o achado que resolve o caso — diferencia de tireoidite, em que ela está alta.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O par obrigatório', ids: ['tsh', 't4-livre'], leitura: 'O TSH contextualiza: tireoglobulina medida sob TSH suprimido subestima o tecido remanescente.' },
    ],
    advertencia:
      'Nunca interprete a tireoglobulina sem o anticorpo antitireoglobulina: sua presença produz resultado falsamente baixo e pode mascarar doença ativa.',
    interferentes: {
      metodo: ['Anticorpos antitireoglobulina interferem no imunoensaio; ensaios por espectrometria de massa contornam parcialmente o problema.', 'Métodos diferentes não são comparáveis — o seguimento exige o mesmo laboratório.'],
    },
    utilidade: ['acompanhamento', 'prognostico'],
    estudarTambem: ['tsh', 't4-livre', 'calcitonina'],
  },

  {
    id: 'psa-livre',
    nome: 'PSA livre, densidade e velocidade de PSA',
    sigla: 'PSA livre',
    sinonimos: ['psa livre', 'relacao psa livre total', 'densidade de psa', 'velocidade de psa', 'psa fracoes'],
    grupo: 'tumorais',
    sistemas: ['oncologico'],
    material: 'Soro',
    unidade: '% e ng/mL',
    referencias: [
      { rotulo: 'Relação PSA livre/total — favorável a doença benigna', texto: '> 25%', unidade: '%' },
      { rotulo: 'Relação PSA livre/total — maior risco de câncer', texto: '< 10%', unidade: '%' },
      { rotulo: 'Densidade de PSA', texto: '< 0,15 ng/mL por cm³ de próstata', unidade: 'ng/mL/cm³' },
    ],
    resumo:
      'Refinamentos do PSA total para a faixa cinzenta entre 4 e 10 ng/mL. Não diagnosticam câncer — ajudam a decidir quem precisa de biópsia e quem pode ser apenas acompanhado.',
    entenda:
      'O PSA circula ligado a inibidores de protease e em forma livre. O tecido prostático maligno produz proporcionalmente mais PSA complexado, de modo que a fração livre cai. Por isso a relação livre/total ajuda a estratificar dentro da zona de indefinição: com PSA total entre 4 e 10, uma relação acima de 25% torna o câncer improvável, enquanto abaixo de 10% o risco é substancialmente maior. É uma ferramenta de decisão sobre biópsia, não de diagnóstico.',
    aprofundar: [
      'A densidade de PSA — o total dividido pelo volume prostático medido por ultrassonografia — resolve outro problema: uma próstata grande produz mais PSA por hiperplasia benigna. Um total de 8 ng/mL numa próstata de 90 cm³ significa algo muito diferente de 8 ng/mL numa próstata de 30 cm³. A densidade normaliza essa diferença.',
      'A velocidade de PSA (variação por ano) tem uso mais limitado do que se supunha, porque a variabilidade biológica e analítica do PSA é alta: variações de 20 a 30% entre dosagens ocorrem sem qualquer mudança clínica. Por isso qualquer decisão baseada em elevação deve se apoiar em pelo menos duas dosagens confirmatórias, colhidas com intervalo adequado e sem manipulação prostática recente.',
      'A prostatite é a grande confundidora: pode elevar o PSA a valores de dezenas de ng/mL, e a normalização leva semanas a meses após o tratamento. Biopsiar durante ou logo após uma prostatite produz resultados desnecessariamente alarmantes e sofrimento evitável.',
    ],
    fisiologia: {
      oQueE: 'Frações do antígeno prostático específico: a forma livre e a complexada a inibidores de protease.',
      origem: 'Epitélio dos ácinos prostáticos.',
      funcao: 'Liquefazer o coágulo seminal por proteólise das semenogelinas.',
      orgaosEnvolvidos: ['Próstata'],
      percurso: [
        'Secreção pelo epitélio prostático no lúmen acinar',
        'pequena fração alcança a circulação',
        'no plasma liga-se a antiquimotripsina e outros inibidores',
        'tecido maligno desloca a proporção para a forma complexada',
        'relação livre/total ↓',
      ],
    },
    aumento: {
      resumo: 'Relação livre/total alta favorece hiperplasia benigna; baixa aumenta a probabilidade de neoplasia — sem nunca estabelecê-la.',
      mecanismos: [
        {
          titulo: 'Alteração da proporção entre frações',
          explicacao: 'O epitélio maligno perde a arquitetura acinar e libera PSA que se complexa preferencialmente aos inibidores plasmáticos, reduzindo a fração livre.',
          exemplos: [
            { causa: 'Hiperplasia prostática benigna', etapas: ['aumento do volume glandular', 'PSA total ↑ proporcional ao volume', 'relação livre/total > 25%', 'densidade de PSA baixa'] },
            { causa: 'Adenocarcinoma de próstata', etapas: ['epitélio maligno com liberação alterada', 'fração livre reduzida', 'relação < 10% com densidade elevada', 'indicação de biópsia dirigida, preferencialmente após ressonância multiparamétrica'] },
            { causa: 'Prostatite', etapas: ['inflamação com ruptura da barreira epitelial', 'PSA total muito elevado transitoriamente', 'normalização em semanas a meses'], nota: 'Repetir após o tratamento antes de indicar biópsia.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A base do raciocínio', ids: ['psa'], leitura: 'As frações só fazem sentido dentro da faixa de indefinição do PSA total; acima de 10 ng/mL elas não acrescentam à decisão.' },
    ],
    advertencia:
      'Manipulação prostática, ejaculação recente, cateterismo, ciclismo e prostatite elevam o PSA. Nenhum valor ou relação estabelece diagnóstico — apenas a biópsia o faz. A decisão de rastrear deve ser compartilhada com o paciente, considerando o risco de sobrediagnóstico.',
    interferentes: {
      preAnalitico: ['A fração livre é instável: amostra que demora a ser separada ou congelada subestima a relação livre/total.'],
      medicamentos: ['Inibidores da 5-alfa-redutase (finasterida, dutasterida) reduzem o PSA total em cerca de 50% — o valor precisa ser dobrado para interpretação.'],
    },
    utilidade: ['triagem', 'diagnostico'],
    estudarTambem: ['psa'],
  },
]
