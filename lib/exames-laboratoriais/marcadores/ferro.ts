import type { Marcador } from '../tipos'

/**
 * Metabolismo do ferro, vitaminas hematopoéticas e marcadores de hemólise.
 *
 * Este grupo existe porque nenhum de seus marcadores significa alguma coisa
 * sozinho. Ferritina alta pode ser sobrecarga de ferro ou inflamação — o que
 * decide é a saturação da transferrina. Ferro sérico baixo pode ser falta de
 * ferro ou ferro sequestrado — o que decide é a ferritina. A hepcidina é o
 * eixo que amarra tudo: entender que a inflamação a eleva, e que ela tranca o
 * ferro dentro do macrófago, explica de uma vez a anemia da doença crônica, a
 * ferritina alta com ferro baixo e a falha do ferro oral no paciente
 * inflamado.
 */
export const marcadores: Marcador[] = [
  {
    id: 'ferritina',
    nome: 'Ferritina',
    sinonimos: ['ferritina serica', 'estoque de ferro'],
    grupo: 'ferro',
    sistemas: ['hematologico', 'metabolico'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Homens', minimo: 30, maximo: 400, unidade: 'ng/mL' },
      { rotulo: 'Mulheres', minimo: 15, maximo: 200, unidade: 'ng/mL' },
      { rotulo: 'Deficiência de ferro', texto: '< 30 (< 15 é definitivo)', unidade: 'ng/mL', observacao: 'Com inflamação concomitante, valores até 100 ng/mL não afastam ferropenia.' },
    ],
    resumo:
      'A proteína que armazena ferro — e, ao mesmo tempo, um reagente de fase aguda. Ferritina baixa prova falta de ferro; ferritina alta não prova o contrário.',
    entenda:
      'A ferritina intracelular guarda ferro de forma atóxica; a fração sérica é um reflexo dos estoques. Isso torna a ferritina baixa o exame mais específico que existe para diagnosticar deficiência de ferro — nenhuma outra condição a derruba. Mas a mesma proteína é sintetizada em resposta à IL-6 na inflamação, e sobe em infecção, doença hepática, neoplasia, síndrome metabólica e obesidade. Por isso ferritina alta é ambígua e exige a saturação da transferrina para ser interpretada.',
    aprofundar: [
      'A hepcidina explica o comportamento aparentemente contraditório da ferritina na inflamação. A IL-6 estimula sua produção hepática; a hepcidina internaliza e degrada a ferroportina, o único canal de saída de ferro do enterócito e do macrófago. Resultado: o ferro para de ser absorvido no intestino e fica preso dentro do macrófago, que responde armazenando-o em ferritina. Ferro sérico cai, ferritina sobe, e o eritroblasto fica sem matéria-prima apesar de o corpo ter ferro. Essa é, integralmente, a anemia da doença crônica — e é também por que ferro oral funciona mal nesse cenário.',
      'Ferritina muito elevada (acima de 1.000 ng/mL) tem um diferencial próprio e frequentemente grave: linfo-histiocitose hemofagocítica (em que valores acima de 10.000 são característicos), doença de Still do adulto, hemocromatose avançada, hepatopatia com necrose, síndrome de ativação macrofágica e neoplasias. Nesses casos, a ferritina deixa de ser marcador de estoque e passa a ser marcador de gravidade inflamatória.',
    ],
    fisiologia: {
      oQueE: 'Proteína globular de 24 subunidades capaz de armazenar até 4.500 átomos de ferro na forma férrica, atóxica.',
      origem: 'Fígado, baço e medula óssea; a ferritina sérica provém sobretudo de macrófagos.',
      funcao: 'Armazenar ferro de forma segura, impedindo que ele catalise a formação de radicais livres pela reação de Fenton.',
      metabolismo: 'Sua síntese é regulada pelo ferro intracelular (via IRE/IRP) e induzida por citocinas inflamatórias.',
      orgaosEnvolvidos: ['Fígado', 'Baço', 'Medula óssea', 'Macrófagos'],
      percurso: ['Ferro absorvido ou reciclado', 'armazenado como ferritina no macrófago e no hepatócito', 'fração sérica proporcional ao estoque (na ausência de inflamação)'],
    },
    aumento: {
      resumo: 'Inflamação (a causa mais comum), sobrecarga de ferro, lesão hepática ou neoplasia. A saturação da transferrina separa os grupos.',
      mecanismos: [
        {
          titulo: 'Reação de fase aguda',
          explicacao: 'A IL-6 induz a síntese de ferritina e de hepcidina; o ferro é sequestrado e armazenado.',
          exemplos: [
            { causa: 'Infecção, doença reumatológica, neoplasia, obesidade, esteatose hepática', etapas: ['IL-6 ↑', 'hepcidina ↑', 'ferroportina internalizada', 'ferro retido no macrófago', 'ferritina ↑ com ferro sérico ↓ e saturação ↓'], nota: 'Ferritina alta com saturação baixa é inflamação, não sobrecarga.' },
          ],
        },
        {
          titulo: 'Sobrecarga de ferro',
          explicacao: 'Há ferro demais no corpo, e o estoque cresce. Aqui a saturação da transferrina sobe junto.',
          exemplos: [
            { causa: 'Hemocromatose hereditária', etapas: ['mutação HFE', 'hepcidina inapropriadamente baixa', 'absorção intestinal de ferro descontrolada', 'ferritina ↑ com saturação > 45%'], nota: 'Saturação de transferrina acima de 45% é o melhor rastreio inicial — mais precoce que a ferritina.' },
            { causa: 'Transfusões repetidas, hemocromatose secundária, talassemia', etapas: ['aporte de ferro que excede a capacidade de excreção (o corpo não tem via de eliminação ativa)', 'acúmulo tecidual', 'ferritina ↑↑'] },
          ],
        },
        {
          titulo: 'Lesão celular com liberação',
          explicacao: 'A ferritina intracelular é liberada quando as células que a contêm morrem.',
          exemplos: [{ causa: 'Hepatite aguda, necrose hepática, alcoolismo', etapas: ['lise de hepatócitos ricos em ferritina', 'ferritina sérica ↑ com transaminases ↑'] }],
        },
        {
          titulo: 'Hiperinflamação',
          explicacao: 'Ativação macrofágica descontrolada eleva a ferritina a valores extremos.',
          exemplos: [{ causa: 'Linfo-histiocitose hemofagocítica, doença de Still, síndrome de ativação macrofágica', etapas: ['ativação macrofágica maciça', 'ferritina > 1.000 e frequentemente > 10.000 ng/mL'], nota: 'Ferritina extrema com febre, citopenias, hipertrigliceridemia e esplenomegalia deve levantar HLH — é emergência.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Deficiência de ferro. Não há outra causa relevante — é o exame mais específico do painel.',
      mecanismos: [
        {
          titulo: 'Estoque esgotado',
          explicacao: 'Perde-se ou consome-se mais ferro do que se absorve. A ferritina cai primeiro, antes do ferro sérico e antes da anemia.',
          exemplos: [
            { causa: 'Perda sanguínea crônica (menstruação, trato digestivo)', etapas: ['perda de ferro contínua', 'mobilização e esgotamento do estoque', 'ferritina ↓', 'depois ferro sérico ↓ e anemia'], nota: 'Em homem e em mulher pós-menopausa, presume-se perda digestiva até investigação completa.' },
            { causa: 'Absorção reduzida (doença celíaca, gastrite atrófica, cirurgia bariátrica, inibidores de bomba de prótons)', etapas: ['absorção duodenal de ferro ↓', 'estoque não se repõe', 'ferritina ↓'], nota: 'Ferropenia sem sangramento identificado exige rastreio de doença celíaca.' },
            { causa: 'Demanda aumentada (gestação, lactação, infância, atletas)', etapas: ['necessidade excede a oferta', 'ferritina ↓'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Sangramento menstrual aumentado', 'Perda digestiva crônica', 'Dieta insuficiente e demanda aumentada'],
        comuns: ['Doença celíaca', 'Gastrite atrófica', 'Pós-bariátrica'],
        naoEsquecer: ['Neoplasia colorretal em homem ou mulher pós-menopausa com ferropenia'],
      },
    },
    comparacoes: [
      {
        id: 'ferritina-alta-diferenciais',
        titulo: 'Ferritina elevada: sobrecarga de ferro × inflamação × hepatopatia',
        pergunta: 'A ferritina subiu. Existe ferro demais, ou existe inflamação escondendo ferro de menos?',
        hipoteses: ['Sobrecarga de ferro', 'Inflamação', 'Hepatopatia'],
        linhas: [
          { marcador: 'Ferritina', celulas: ['↑↑', '↑', '↑'] },
          { marcador: 'Ferro sérico', celulas: ['↑', '↓', 'variável'] },
          { marcador: 'Transferrina / TIBC', celulas: ['↓ ou normal', '↓', '↓'] },
          { marcador: 'Saturação da transferrina', celulas: ['↑↑ (> 45%)', '↓ (< 20%)', 'variável'] },
          { marcador: 'PCR', celulas: ['normal', '↑', 'variável'] },
          { marcador: 'AST / ALT', celulas: ['↑ leve', 'normais', '↑'] },
        ],
        leitura:
          'A saturação da transferrina é o desempate, e o motivo é mecanístico. Na sobrecarga, o ferro transborda: circula em excesso e ocupa a transferrina — saturação alta. Na inflamação, a hepcidina tranca o ferro dentro do macrófago: a ferritina sobe porque é lá que ele está guardado, mas o que circula cai — saturação baixa. Duas ferritinas altas, com significados opostos, separadas por um único índice.',
        limites: 'Ferropenia e inflamação coexistem com frequência. Nesse cenário, ferritina até 100 ng/mL não afasta deficiência de ferro, e o receptor solúvel de transferrina — que não é reagente de fase aguda — ajuda a decidir.',
      },
    ],
    relacionados: [
      { titulo: 'O painel de ferro completo', ids: ['ferro-serico', 'transferrina', 'saturacao-transferrina'], leitura: 'Ferritina é estoque; ferro sérico é o que circula agora; transferrina é a capacidade de transporte; a saturação é a razão entre os dois últimos — e é ela que resolve a ambiguidade da ferritina.' },
      { titulo: 'Para separar da inflamação', ids: ['pcr', 'vhs'], leitura: 'Ferritina alta com PCR alta aponta fase aguda; com PCR normal, aponta sobrecarga ou hepatopatia.' },
    ],
    interferentes: {
      fisiologico: ['Obesidade, síndrome metabólica e consumo de álcool elevam sem sobrecarga verdadeira.'],
      preAnalitico: ['Hemólise da amostra eleva falsamente.'],
    },
    normalizacao: [
      { cenario: 'Ferritina baixa por perda crônica', caminho: 'Repor ferro e identificar a fonte da perda. Repor sem investigar corrige o número e mantém o problema.', prazo: 'Hemoglobina em 6 a 8 semanas; o estoque leva de 3 a 6 meses.' },
      { cenario: 'Ferritina alta por inflamação', caminho: 'Tratar a doença de base. A ferritina cai quando a IL-6 cai — não é alvo terapêutico em si.', prazo: 'Semanas.' },
      { cenario: 'Ferritina alta por sobrecarga', caminho: 'Flebotomias na hemocromatose; quelantes na sobrecarga transfusional. O corpo não tem via ativa de excreção de ferro.', prazo: 'Meses a anos.' },
    ],
    utilidade: ['diagnostico', 'rastreamento', 'acompanhamento'],
    padroes: ['anemia-microcitica-hipocromica', 'anemia-doenca-cronica'],
    estudarTambem: ['ferro-serico', 'saturacao-transferrina', 'transferrina', 'pcr'],
  },

  {
    id: 'ferro-serico',
    nome: 'Ferro sérico',
    sinonimos: ['ferro', 'sideremia', 'fe serico'],
    grupo: 'ferro',
    sistemas: ['hematologico'],
    material: 'Soro (coleta matinal, em jejum)',
    unidade: 'µg/dL',
    referencias: [
      { rotulo: 'Homens', minimo: 65, maximo: 175, unidade: 'µg/dL' },
      { rotulo: 'Mulheres', minimo: 50, maximo: 170, unidade: 'µg/dL', observacao: 'Variação circadiana de até 30%: valores mais altos pela manhã. Coletar sempre no mesmo horário.' },
    ],
    resumo: 'O ferro que circula ligado à transferrina neste momento. Muito variável ao longo do dia — nunca deve ser interpretado isoladamente.',
    entenda:
      'O ferro sérico representa uma fração ínfima do ferro corporal e oscila com a hora do dia, a refeição, a inflamação e a suplementação recente. Sozinho, ele não diagnostica nada: cai tanto na ferropenia (não há ferro) quanto na inflamação (o ferro está preso). Seu papel é entrar no cálculo da saturação da transferrina, que é o índice que de fato informa.',
    fisiologia: {
      oQueE: 'Ferro férrico ligado à transferrina no plasma.',
      origem: 'Absorção duodenal (1 a 2 mg/dia) e, sobretudo, reciclagem de hemácias senescentes pelos macrófagos (20 a 25 mg/dia).',
      funcao: 'Levar ferro ao eritroblasto da medula e aos demais tecidos.',
      metabolismo: 'A saída do ferro do enterócito e do macrófago depende da ferroportina, regulada pela hepcidina.',
      eliminacao: 'Não existe via ativa de excreção — a perda é passiva, por descamação celular e sangramento.',
      orgaosEnvolvidos: ['Duodeno', 'Macrófagos', 'Fígado (hepcidina)', 'Medula óssea'],
      percurso: ['Hemácia senescente ou dieta', 'macrófago ou enterócito', 'ferroportina (regulada pela hepcidina)', 'transferrina plasmática', 'receptor de transferrina no eritroblasto'],
    },
    aumento: {
      resumo: 'Sobrecarga de ferro, hemólise, hepatopatia, suplementação recente ou eritropoese ineficaz.',
      mecanismos: [
        {
          titulo: 'Aporte ou liberação aumentada',
          explicacao: 'Chega mais ferro ao plasma do que a medula consome.',
          exemplos: [
            { causa: 'Hemocromatose hereditária, transfusões repetidas', etapas: ['hepcidina baixa ou aporte excessivo', 'ferroportina ativa', 'ferro plasmático ↑ com saturação ↑'] },
            { causa: 'Hemólise', etapas: ['liberação de ferro do heme degradado', 'ferro sérico ↑'] },
            { causa: 'Suplementação oral nas horas anteriores à coleta', etapas: ['absorção recente', 'ferro sérico falsamente ↑'], nota: 'Suspender o ferro por 24 a 48 horas antes de dosar.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Falta de ferro ou ferro sequestrado pela inflamação — e é a ferritina que diz qual dos dois.',
      mecanismos: [
        {
          titulo: 'Estoque esgotado',
          explicacao: 'Não há ferro para mobilizar.',
          exemplos: [{ causa: 'Anemia ferropriva', etapas: ['estoque esgotado', 'ferro sérico ↓ com ferritina ↓ e transferrina ↑'] }],
        },
        {
          titulo: 'Sequestro pela hepcidina',
          explicacao: 'O ferro existe, mas não sai do macrófago.',
          exemplos: [{ causa: 'Inflamação, infecção, neoplasia', etapas: ['hepcidina ↑', 'ferroportina degradada', 'ferro retido', 'ferro sérico ↓ com ferritina ↑'], nota: 'Repor ferro oral nesse cenário costuma falhar — a hepcidina bloqueia justamente a absorção intestinal.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Nunca isolado', ids: ['ferritina', 'transferrina', 'saturacao-transferrina'], leitura: 'Ferro sérico baixo com ferritina baixa é ferropenia; com ferritina alta é inflamação. O ferro sérico sozinho não distingue as duas.' }],
    interferentes: {
      preAnalitico: ['Hemólise eleva falsamente.', 'Variação circadiana significativa — coletar pela manhã.'],
      medicamentos: ['Suplemento de ferro nas 24 a 48h anteriores eleva; anticoncepcionais orais elevam a transferrina e alteram a saturação.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['ferritina', 'transferrina', 'saturacao-transferrina'],
  },

  {
    id: 'transferrina',
    nome: 'Transferrina',
    sinonimos: ['tibc', 'capacidade total de ligacao do ferro', 'ctlf', 'siderofilina'],
    grupo: 'ferro',
    sistemas: ['hematologico'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Adultos', minimo: 200, maximo: 360, unidade: 'mg/dL' },
      { rotulo: 'TIBC equivalente', minimo: 250, maximo: 450, unidade: 'µg/dL', observacao: 'A TIBC é a mesma informação expressa como capacidade de ligação: TIBC ≈ transferrina × 1,25.' },
    ],
    resumo:
      'A proteína transportadora de ferro. Sobe quando falta ferro — o corpo fabrica mais caminhões para catar o pouco que existe — e cai na inflamação e na desnutrição.',
    entenda:
      'A transferrina é sintetizada no fígado, e sua produção é inversamente regulada pelo estoque de ferro: com estoque baixo, a síntese aumenta. Esse comportamento a torna o marcador que separa ferropenia de anemia da inflamação com mais elegância que qualquer outro. Na ferropenia, transferrina alta; na inflamação, transferrina baixa (é um reagente de fase aguda negativo, como a albumina). Ela também cai em hepatopatia e desnutrição, por falta de síntese.',
    fisiologia: {
      oQueE: 'Glicoproteína plasmática que liga dois átomos de ferro férrico e os transporta.',
      origem: 'Fígado.',
      funcao: 'Transportar ferro do intestino e dos macrófagos até a medula óssea e demais tecidos, mantendo-o na forma não reativa.',
      meiaVida: '8 a 10 dias.',
      orgaosEnvolvidos: ['Fígado (síntese)', 'Medula óssea (receptor)'],
      percurso: ['Estoque de ferro baixo', 'síntese hepática de transferrina ↑', 'mais sítios de ligação disponíveis', 'TIBC ↑ com saturação ↓'],
    },
    aumento: {
      resumo: 'Deficiência de ferro, gestação e uso de estrogênios.',
      mecanismos: [
        {
          titulo: 'Resposta ao estoque baixo',
          explicacao: 'O fígado aumenta a síntese quando o ferro intracelular cai.',
          exemplos: [{ causa: 'Anemia ferropriva', etapas: ['ferro intracelular hepático ↓', 'síntese de transferrina ↑', 'TIBC ↑ com saturação ↓'], nota: 'Transferrina alta com ferritina baixa é o padrão bioquímico completo da ferropenia.' }],
        },
        { titulo: 'Estímulo estrogênico', explicacao: 'Estrogênios aumentam a síntese hepática.', exemplos: [{ causa: 'Gestação, anticoncepcional oral, terapia hormonal', etapas: ['síntese hepática ↑', 'transferrina ↑ sem ferropenia'] }] },
      ],
    },
    reducao: {
      resumo: 'Inflamação, desnutrição, hepatopatia, síndrome nefrótica e sobrecarga de ferro.',
      mecanismos: [
        {
          titulo: 'Reagente de fase aguda negativo',
          explicacao: 'A IL-6 desvia a síntese hepática para proteínas de fase aguda; a transferrina é sacrificada.',
          exemplos: [{ causa: 'Inflamação, infecção, neoplasia', etapas: ['IL-6 ↑', 'síntese de transferrina ↓', 'TIBC ↓ com ferritina ↑'] }],
        },
        { titulo: 'Perda ou falha de síntese', explicacao: 'Falta fígado, falta substrato ou perde-se pela urina.', exemplos: [{ causa: 'Cirrose, desnutrição, síndrome nefrótica', etapas: ['síntese ↓ ou perda urinária', 'transferrina ↓'] }] },
      ],
    },
    relacionados: [{ titulo: 'Compõe a saturação', ids: ['ferro-serico', 'saturacao-transferrina', 'ferritina'], leitura: 'Transferrina alta com ferro baixo é ferropenia; transferrina baixa com ferro baixo é inflamação.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['ferritina', 'ferro-serico', 'saturacao-transferrina'],
  },

  {
    id: 'saturacao-transferrina',
    nome: 'Saturação da transferrina',
    sigla: 'IST',
    sinonimos: ['indice de saturacao da transferrina', 'ist', 'saturacao'],
    grupo: 'ferro',
    sistemas: ['hematologico'],
    material: 'Calculada: ferro sérico ÷ TIBC × 100',
    unidade: '%',
    referencias: [
      { rotulo: 'Adultos', minimo: 20, maximo: 45, unidade: '%' },
      { rotulo: 'Sugestivo de deficiência', texto: '< 20', unidade: '%' },
      { rotulo: 'Sugestivo de sobrecarga', texto: '> 45', unidade: '%', observacao: 'É o melhor exame de rastreio inicial para hemocromatose hereditária.' },
    ],
    resumo:
      'A proporção da transferrina realmente ocupada por ferro. É o índice que resolve a ambiguidade da ferritina e o rastreio inicial da hemocromatose.',
    entenda:
      'A saturação combina, em um único número, o ferro que circula e a capacidade de transporte disponível. Por isso é mais informativa que qualquer um dos dois isoladamente. Abaixo de 20%, o eritroblasto não recebe ferro suficiente — seja porque não há ferro (ferropenia), seja porque ele está sequestrado (inflamação). Acima de 45%, há mais ferro do que a transferrina consegue carregar com segurança, e o excedente circula como ferro livre, tóxico para fígado, coração e pâncreas.',
    fisiologia: {
      oQueE: 'Percentual dos sítios de ligação da transferrina ocupados por ferro.',
      origem: 'Razão entre o ferro sérico e a capacidade total de ligação.',
      funcao: 'Estimar a disponibilidade real de ferro para a eritropoese.',
      percurso: ['Ferro sérico ÷ TIBC × 100', 'saturação da transferrina', 'disponibilidade de ferro para o eritroblasto'],
    },
    aumento: {
      resumo: 'Sobrecarga de ferro — hereditária, transfusional ou por eritropoese ineficaz.',
      mecanismos: [
        {
          titulo: 'Ferro em excesso na circulação',
          explicacao: 'A oferta supera a capacidade de transporte; o ferro não ligado é tóxico.',
          exemplos: [
            { causa: 'Hemocromatose hereditária', etapas: ['hepcidina inapropriadamente baixa', 'absorção intestinal descontrolada', 'saturação > 45%', 'depósito em fígado, pâncreas, coração e articulações'], nota: 'Saturação persistentemente acima de 45% indica pesquisa genética HFE.' },
            { causa: 'Sobrecarga transfusional, talassemia, anemia sideroblástica', etapas: ['aporte transfusional ou eritropoese ineficaz', 'saturação ↑'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Ferro indisponível — por falta (ferropenia) ou por sequestro (inflamação). A ferritina diz qual.',
      mecanismos: [
        {
          titulo: 'Ferro insuficiente para a eritropoese',
          explicacao: 'Poucos sítios ocupados significa pouco ferro chegando ao eritroblasto.',
          exemplos: [
            { causa: 'Anemia ferropriva', etapas: ['ferro sérico ↓ e TIBC ↑', 'saturação ↓↓ com ferritina ↓'] },
            { causa: 'Anemia da inflamação', etapas: ['ferro sérico ↓ e TIBC ↓', 'saturação ↓ com ferritina ↑'] },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'O painel completo', ids: ['ferritina', 'ferro-serico', 'transferrina'], leitura: 'Saturação baixa com ferritina baixa é ferropenia; saturação baixa com ferritina alta é inflamação; saturação alta com ferritina alta é sobrecarga.' }],
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['ferritina', 'ferro-serico', 'transferrina'],
  },

  {
    id: 'vitamina-b12',
    nome: 'Vitamina B12',
    sinonimos: ['cobalamina', 'b12', 'cianocobalamina'],
    grupo: 'vitaminas',
    sistemas: ['hematologico', 'metabolico'],
    material: 'Soro',
    unidade: 'pg/mL',
    referencias: [
      { rotulo: 'Adultos', minimo: 200, maximo: 900, unidade: 'pg/mL' },
      { rotulo: 'Zona indeterminada', texto: '200 a 300', unidade: 'pg/mL', observacao: 'Nessa faixa, dosar ácido metilmalônico e homocisteína — ambos sobem antes de a B12 cair.' },
    ],
    resumo:
      'Cofator da síntese de DNA e da mielinização. Sua deficiência causa anemia macrocítica e lesão neurológica que pode preceder — e sobreviver a — a alteração hematológica.',
    entenda:
      'A absorção da B12 é uma sequência longa e frágil: precisa de ácido gástrico para liberá-la da proteína alimentar, de fator intrínseco produzido pelas células parietais, e de receptores íntegros no íleo terminal. Qualquer ponto dessa cadeia pode falhar — gastrite atrófica, anemia perniciosa (autoanticorpos anti-fator intrínseco e anticélula parietal), gastrectomia, uso crônico de metformina ou inibidores de bomba de prótons, doença de Crohn ileal. O ponto clínico decisivo: os sintomas neurológicos podem aparecer com hemograma normal, e a lesão medular (degeneração combinada subaguda) torna-se irreversível se o tratamento demorar.',
    fisiologia: {
      oQueE: 'Vitamina hidrossolúvel contendo cobalto, cofator de duas enzimas: a metionina-sintase e a metilmalonil-CoA mutase.',
      origem: 'Exclusivamente de fontes animais (carne, ovos, laticínios) e de bactérias.',
      metabolismo: 'Liberada do alimento pelo ácido gástrico, ligada ao fator intrínseco e absorvida no íleo terminal por receptor específico.',
      funcao: 'Regenerar metionina a partir de homocisteína (fornecendo grupos metila para a síntese de DNA) e converter metilmalonil-CoA em succinil-CoA (essencial para a integridade da mielina).',
      eliminacao: 'Estoque hepático de 2 a 5 anos, com circulação êntero-hepática eficiente — daí a deficiência levar anos para se manifestar.',
      orgaosEnvolvidos: ['Estômago (fator intrínseco)', 'Íleo terminal', 'Fígado (estoque)'],
      percurso: ['B12 da dieta', 'ácido gástrico libera da proteína', 'ligação ao fator intrínseco', 'absorção no íleo terminal', 'transcobalamina no plasma', 'tecidos'],
    },
    aumento: {
      resumo: 'Suplementação, hepatopatia e doenças mieloproliferativas — e, curiosamente, pode indicar doença grave.',
      mecanismos: [
        {
          titulo: 'Liberação e produção de transportadores',
          explicacao: 'A B12 sérica sobe quando o fígado libera seus estoques ou quando as proteínas transportadoras aumentam.',
          exemplos: [
            { causa: 'Hepatopatia, neoplasias mieloproliferativas, neoplasias sólidas', etapas: ['liberação hepática ou produção de haptocorrina por granulócitos', 'B12 ↑'], nota: 'B12 elevada não suplementada em paciente com sintomas sistêmicos merece atenção, e não tranquilidade.' },
            { causa: 'Suplementação oral ou parenteral', etapas: ['aporte exógeno', 'B12 ↑'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Má absorção (a causa dominante), dieta vegana estrita, medicamentos e consumo aumentado.',
      mecanismos: [
        {
          titulo: 'Má absorção',
          explicacao: 'Qualquer elo da cadeia de absorção pode romper-se.',
          exemplos: [
            { causa: 'Anemia perniciosa', etapas: ['autoanticorpos contra células parietais e fator intrínseco', 'gastrite atrófica autoimune', 'fator intrínseco ausente', 'B12 ↓ com anemia macrocítica e neuropatia'], nota: 'Associa-se a outras doenças autoimunes e aumenta o risco de neoplasia gástrica.' },
            { causa: 'Gastrectomia, cirurgia bariátrica, ressecção ileal, doença de Crohn', etapas: ['perda do sítio de produção ou de absorção', 'B12 ↓'] },
            { causa: 'Metformina e inibidores de bomba de prótons em uso prolongado', etapas: ['interferência na absorção ileal e na liberação gástrica', 'B12 ↓'], nota: 'Diabético em uso crônico de metformina com neuropatia: dosar B12 antes de atribuir tudo à hiperglicemia.' },
          ],
        },
        { titulo: 'Aporte insuficiente', explicacao: 'A B12 só existe em fontes animais.', exemplos: [{ causa: 'Dieta vegana estrita sem suplementação', etapas: ['aporte ausente', 'esgotamento do estoque hepático em anos', 'B12 ↓'] }] },
      ],
    },
    relacionados: [
      { titulo: 'Quando a B12 estiver limítrofe', ids: ['acido-folico'], leitura: 'Ácido metilmalônico e homocisteína sobem antes de a B12 cair. Metilmalônico alto indica B12; homocisteína alta isolada com metilmalônico normal indica folato.' },
      { titulo: 'No hemograma', ids: ['vcm', 'ldh', 'bilirrubina-indireta', 'reticulocitos'], leitura: 'VCM alto com LDH e bilirrubina indireta altos e reticulócitos baixos é o padrão de eritropoese ineficaz da anemia megaloblástica.' },
    ],
    interferentes: {
      medicamentos: ['Metformina, inibidores de bomba de prótons, antagonistas H2, colchicina e óxido nitroso reduzem.'],
      metodo: ['Anticorpos anti-fator intrínseco podem causar resultado falsamente normal em alguns ensaios.'],
    },
    normalizacao: [
      { cenario: 'Deficiência por má absorção', caminho: 'Reposição parenteral ou oral em altas doses — a via oral funciona mesmo sem fator intrínseco, por difusão passiva. A reposição é vitalícia quando a causa é irreversível.', prazo: 'Resposta reticulocitária em 5 a 7 dias; hemograma normaliza em 8 semanas; sintomas neurológicos podem levar meses e nem sempre revertem completamente.' },
    ],
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['anemia-macrocitica'],
    estudarTambem: ['acido-folico', 'vcm', 'ldh', 'reticulocitos'],
  },

  {
    id: 'acido-folico',
    nome: 'Ácido fólico',
    sinonimos: ['folato', 'vitamina b9', 'folato serico'],
    grupo: 'vitaminas',
    sistemas: ['hematologico', 'metabolico'],
    material: 'Soro (ou folato eritrocitário)',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Adultos (soro)', minimo: 3, maximo: 17, unidade: 'ng/mL' },
      { rotulo: 'Folato eritrocitário', minimo: 150, maximo: 450, unidade: 'ng/mL', observacao: 'Reflete o estoque dos últimos 3 meses e não sofre com a ingestão do dia anterior.' },
    ],
    resumo: 'Cofator da síntese de DNA. Deficiência causa anemia megaloblástica indistinguível da por B12 no hemograma — mas sem neuropatia.',
    entenda:
      'O estoque corporal de folato dura de 3 a 4 meses, contra anos no caso da B12. Por isso a deficiência se instala rápido em alcoolistas, gestantes, pacientes com hemólise crônica (alto consumo) e em uso de antagonistas do folato. A distinção com a deficiência de B12 é essencial e tem consequência prática grave: repor folato em quem tem deficiência de B12 corrige a anemia e deixa a neuropatia progredir — por isso a B12 deve ser dosada e reposta antes ou junto.',
    fisiologia: {
      oQueE: 'Vitamina hidrossolúvel do complexo B, cofator na transferência de unidades de um carbono.',
      origem: 'Vegetais folhosos verdes, leguminosas, fígado e alimentos fortificados (a farinha é fortificada no Brasil).',
      metabolismo: 'Absorvido no jejuno; convertido a tetra-hidrofolato, forma ativa.',
      funcao: 'Sintetizar timidilato e purinas — sem ele, o DNA não se replica —, além de participar do metabolismo da homocisteína.',
      eliminacao: 'Estoque hepático de apenas 3 a 4 meses.',
      orgaosEnvolvidos: ['Jejuno', 'Fígado'],
      percurso: ['Folato da dieta', 'absorção jejunal', 'tetra-hidrofolato', 'síntese de timidilato e purinas', 'replicação do DNA'],
    },
    aumento: { resumo: 'Suplementação e alimentos fortificados — sem significado clínico.', mecanismos: [{ titulo: 'Aporte exógeno', explicacao: 'A vitamina é hidrossolúvel e o excesso é excretado.', exemplos: [{ causa: 'Suplementação, fortificação alimentar', etapas: ['aporte ↑', 'folato sérico ↑'] }] }] },
    reducao: {
      resumo: 'Ingesta insuficiente, alcoolismo, má absorção, consumo aumentado ou antagonistas farmacológicos.',
      mecanismos: [
        {
          titulo: 'Aporte reduzido e alcoolismo',
          explicacao: 'O álcool prejudica a absorção, o armazenamento hepático e o ciclo êntero-hepático do folato.',
          exemplos: [{ causa: 'Alcoolismo, dieta pobre em vegetais, idoso institucionalizado', etapas: ['aporte e absorção ↓', 'estoque curto se esgota', 'folato ↓ com VCM ↑'] }],
        },
        {
          titulo: 'Consumo aumentado',
          explicacao: 'Situações de alta proliferação celular gastam folato rapidamente.',
          exemplos: [{ causa: 'Gestação, lactação, hemólise crônica, psoríase, neoplasias', etapas: ['demanda ↑', 'estoque esgotado em meses', 'folato ↓'], nota: 'A suplementação periconcepcional previne defeitos do tubo neural — indicação de saúde pública consolidada.' }],
        },
        {
          titulo: 'Antagonistas farmacológicos',
          explicacao: 'Fármacos bloqueiam a di-hidrofolato-redutase ou a absorção.',
          exemplos: [{ causa: 'Metotrexato, trimetoprima, fenitoína, sulfassalazina', etapas: ['bloqueio da via do folato', 'macrocitose e anemia megaloblástica'] }],
        },
      ],
    },
    relacionados: [{ titulo: 'Sempre com', ids: ['vitamina-b12', 'vcm'], leitura: 'Repor folato sem excluir deficiência de B12 corrige a anemia e permite a progressão da lesão neurológica. Dose sempre os dois.' }],
    interferentes: { preAnalitico: ['O folato sérico reflete a ingesta recente; o folato eritrocitário reflete os últimos 3 meses e é mais confiável.'] },
    utilidade: ['diagnostico'],
    padroes: ['anemia-macrocitica'],
    estudarTambem: ['vitamina-b12', 'vcm'],
  },

  {
    id: 'haptoglobina',
    nome: 'Haptoglobina',
    sinonimos: ['hp', 'haptoglobina serica'],
    grupo: 'ferro',
    sistemas: ['hematologico'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 30, maximo: 200, unidade: 'mg/dL' }],
    resumo: 'Proteína que captura a hemoglobina livre no plasma. É consumida na hemólise — e sua queda é um dos marcadores mais específicos que existem para isso.',
    entenda:
      'A haptoglobina liga a hemoglobina livre com altíssima afinidade, e o complexo é removido pelo fígado. Quando há hemólise, ela é consumida mais rápido do que o fígado a repõe, e o nível plasmático despenca — especialmente na hemólise intravascular. A armadilha: ela é reagente de fase aguda, então a inflamação a eleva e pode mascarar hemólise concomitante. Haptoglobina normal em paciente inflamado não exclui hemólise.',
    fisiologia: {
      oQueE: 'Alfa-2-glicoproteína plasmática de síntese hepática.',
      origem: 'Fígado.',
      funcao: 'Sequestrar hemoglobina livre, impedindo sua filtração glomerular (que é nefrotóxica) e a perda de ferro pela urina.',
      metabolismo: 'O complexo haptoglobina-hemoglobina é captado pelo receptor CD163 dos macrófagos e degradado.',
      orgaosEnvolvidos: ['Fígado (síntese)', 'Sistema reticuloendotelial (remoção)'],
      percurso: ['Hemólise', 'hemoglobina livre no plasma', 'ligação à haptoglobina', 'complexo captado por macrófagos (CD163)', 'haptoglobina consumida'],
    },
    aumento: {
      resumo: 'Reagente de fase aguda — sobe em inflamação, infecção e neoplasia.',
      mecanismos: [{ titulo: 'Fase aguda', explicacao: 'A IL-6 induz sua síntese hepática.', exemplos: [{ causa: 'Infecção, inflamação, corticoterapia, síndrome nefrótica', etapas: ['IL-6 ↑', 'síntese hepática ↑', 'haptoglobina ↑'], nota: 'Pode mascarar hemólise simultânea — leia sempre com LDH e bilirrubina indireta.' }] }],
    },
    reducao: {
      resumo: 'Hemólise (consumo) ou hepatopatia (falta de síntese).',
      mecanismos: [
        {
          titulo: 'Consumo por hemoglobina livre',
          explicacao: 'Cada molécula de hemoglobina liberada consome haptoglobina, que é removida junto e não retorna.',
          exemplos: [
            { causa: 'Hemólise intravascular (microangiopatia, transfusão incompatível, hemoglobinúria paroxística noturna, prótese valvar)', etapas: ['ruptura de hemácias no vaso', 'hemoglobina livre ↑', 'haptoglobina consumida', 'haptoglobina ↓↓ com LDH ↑↑'], nota: 'Na hemólise intravascular a queda é mais acentuada que na extravascular.' },
            { causa: 'Hemólise extravascular (autoimune, esferocitose)', etapas: ['destruição esplênica com algum extravasamento de hemoglobina', 'haptoglobina ↓ moderada'] },
          ],
        },
        { titulo: 'Síntese reduzida', explicacao: 'O fígado não produz.', exemplos: [{ causa: 'Hepatopatia avançada', etapas: ['síntese hepática ↓', 'haptoglobina ↓ sem hemólise'], nota: 'Interpretar com cautela no cirrótico.' }] },
      ],
    },
    relacionados: [{ titulo: 'O painel de hemólise', ids: ['ldh', 'bilirrubina-indireta', 'reticulocitos', 'hemoglobina'], leitura: 'Haptoglobina baixa com LDH alto, bilirrubina indireta alta e reticulocitose define hemólise. O Coombs direto separa imune de não imune.' }],
    utilidade: ['diagnostico'],
    padroes: ['hemolise'],
    estudarTambem: ['ldh', 'bilirrubina-indireta', 'reticulocitos'],
  },
]
