import type { DoencaZoom } from '../tipos'

/** Trato digestivo: esôfago, estômago, intestinos e apêndice. */
export const DOENCAS_DIGESTORIO: DoencaZoom[] = [
  {
    id: 'apendicite-aguda',
    nome: 'Apendicite aguda',
    sinonimos: ['apendicite supurativa', 'apendicite flegmonosa', 'apendicite gangrenosa'],
    nomesEmIngles: ['acute appendicitis'],
    sistema: 'digestorio',
    orgao: 'apendice',
    prioridade: 1,
    resumo:
      'Inflamação aguda do apêndice cecal, quase sempre desencadeada por obstrução da luz, cujo critério histológico é a presença de neutrófilos infiltrando a muscular própria.',
    epidemiologia:
      'A emergência cirúrgica abdominal mais comum: risco ao longo da vida de 7–8 %, pico entre 10 e 30 anos. Em crianças pequenas e idosos o diagnóstico tende a atrasar e a perfuração é mais frequente.',
    patogenese: [
      'Obstrução da luz — fecalito no adulto, hiperplasia linfoide na criança, mais raramente corpo estranho, parasita ou tumor.',
      'A mucosa continua secretando muco na luz fechada: a pressão sobe e ultrapassa a pressão venosa da parede.',
      'O retorno venoso para, a parede congestiona e fica isquêmica; a barreira mucosa se rompe e ulcera.',
      'Bactérias da luz invadem a parede; neutrófilos migram da mucosa em direção à serosa — a inflamação fica transmural.',
      'Ao chegar à serosa, surge peritonite localizada (exsudato fibrinopurulento) — é quando a dor migra do epigástrio para a fossa ilíaca direita.',
      'Se a isquemia progride, a parede necrosa (forma gangrenosa) e pode perfurar, com abscesso ou peritonite difusa.',
    ],
    roteiro: [
      'Panorâmico: identifique o apêndice em corte transversal — luz central, mucosa com folículos linfoides, submucosa, muscular própria em duas camadas e serosa com o mesoapêndice (gordura).',
      'Procure onde a mucosa perdeu as glândulas: a luz passa a ser delimitada por exsudato purulento (ulceração).',
      'Siga a parede de dentro para fora e, na muscular própria, procure fendas de edema com células pequenas entre os feixes: são neutrófilos — o critério diagnóstico.',
      'Na superfície externa, veja se há uma faixa rosa felpuda com neutrófilos (exsudato fibrinopurulento): periapendicite.',
      'Grande aumento: confirme os núcleos segmentados dos neutrófilos na muscular e procure necrose (gangrena) e perfuração.',
    ],
    achados: [
      {
        achado: 'inflamacao-aguda-transmural',
        tipo: 'especifico',
        comoAparece: 'Neutrófilos entre os feixes da muscular própria, separados por edema. É o critério diagnóstico.',
        peso: 'criterio',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Mucosa com perda de glândulas e epitélio, substituída por exsudato purulento voltado para a luz.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Lençóis de neutrófilos na mucosa, na luz e na submucosa — pus.',
        peso: 'criterio',
      },
      {
        achado: 'exsudato-fibrinopurulento',
        tipo: 'especifico',
        comoAparece: 'Fibrina e neutrófilos sobre a serosa (periapendicite): a inflamação chegou ao peritônio.',
        peso: 'frequente',
      },
      {
        achado: 'edema-inflamatorio',
        tipo: 'geral',
        comoAparece: 'Fendas claras afastando os feixes musculares e a trama da submucosa e da subserosa.',
        peso: 'frequente',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Vasos da submucosa, da subserosa e do mesoapêndice dilatados e cheios de hemácias.',
        peso: 'frequente',
      },
      {
        achado: 'abscesso',
        tipo: 'geral',
        comoAparece: 'Coleções de pus na parede ou no mesoapêndice, nas formas supurativas avançadas.',
        peso: 'ocasional',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Parede sem núcleos, hipereosinofílica, na forma gangrenosa.',
        peso: 'ocasional',
      },
      {
        achado: 'hiperplasia-linfoide-reativa',
        tipo: 'especifico',
        comoAparece: 'Folículos linfoides grandes, com centros germinativos, que podem estreitar a luz — causa comum de obstrução em jovens.',
        peso: 'ocasional',
      },
      {
        achado: 'fecalito',
        tipo: 'especifico',
        comoAparece: 'Concreção lamelar na luz; muitas vezes não aparece no corte examinado.',
        peso: 'ocasional',
      },
      {
        achado: 'perfuracao-da-parede',
        tipo: 'especifico',
        comoAparece: 'Descontinuidade transmural com necrose e pus comunicando luz e serosa.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Apêndice normal com folículos linfoides proeminentes',
        comoSeparar:
          'Folículos com centros germinativos são normais no jovem; sem neutrófilos na muscular própria não há apendicite, por mais "roxa" que a mucosa pareça.',
      },
      {
        nome: 'Periapendicite secundária (peritonite de outra origem)',
        comoSeparar:
          'Inflamação só na serosa, com mucosa e muscular poupadas: vem de fora (salpingite, diverticulite, perfuração de outra víscera). Na apendicite, o gradiente vai de dentro para fora.',
      },
      {
        nome: 'Apendicite granulomatosa (Crohn, Yersinia, tuberculose)',
        comoSeparar: 'Granulomas epitelioides e inflamação crônica transmural com fibrose — não o predomínio de neutrófilos.',
      },
      {
        nome: 'Neoplasia do apêndice (tumor neuroendócrino, neoplasia mucinosa)',
        comoSeparar:
          'Pode causar a obstrução: sempre procure ninhos de células uniformes na ponta (neuroendócrino) ou epitélio mucinoso displásico e muco dissecando a parede.',
      },
    ],
    correlacaoClinica: [
      'Dor periumbilical que migra para a fossa ilíaca direita (ponto de McBurney) = a inflamação passou da mucosa (dor visceral, mal localizada) à serosa (dor somática, localizada).',
      'Febre baixa e leucocitose com neutrofilia refletem a mesma resposta neutrofílica vista na parede.',
      'Tratamento: apendicectomia; antibiótico isolado é opção em casos não complicados selecionados. O exame histológico confirma o diagnóstico e exclui tumor.',
    ],
    comparacaoComNormal: [
      'No normal, a mucosa tem glândulas (criptas) regulares, com células caliciformes, sobre uma lâmina própria cheia de folículos linfoides.',
      'A muscular própria normal é compacta e rosa homogênea, sem fendas nem células inflamatórias entre os feixes.',
      'A serosa normal é uma linha fina de mesotélio sobre tecido conjuntivo frouxo, sem fibrina.',
    ],
    doencaDoManual: 'apendicite-aguda',
  },
  {
    id: 'adenocarcinoma-colorretal',
    nome: 'Adenocarcinoma colorretal',
    sinonimos: ['câncer colorretal', 'carcinoma do cólon', 'câncer de reto'],
    nomesEmIngles: ['colorectal adenocarcinoma', 'colon cancer'],
    sistema: 'digestorio',
    orgao: 'colon',
    prioridade: 2,
    resumo:
      'Neoplasia maligna do epitélio glandular do cólon e do reto: glândulas atípicas de arquitetura complexa que invadem, a partir da mucosa, a submucosa e as camadas mais profundas da parede.',
    epidemiologia:
      'Terceiro câncer mais comum no mundo e segunda causa de morte por câncer; no Brasil, entre os três mais incidentes em ambos os sexos. Pico após os 50 anos, com aumento recente em adultos jovens. Fatores: dieta rica em carne processada e pobre em fibras, obesidade, sedentarismo, tabagismo, doença inflamatória intestinal e síndromes hereditárias (polipose adenomatosa familiar, síndrome de Lynch).',
    patogenese: [
      'Uma cripta sofre mutação de APC (via Wnt/β-catenina): a célula deixa de parar de proliferar e forma um adenoma — displasia sem invasão.',
      'Mutações adicionais (KRAS, perda de SMAD4 em 18q) aumentam o tamanho e o grau da displasia ao longo de anos (sequência adenoma-carcinoma).',
      'A perda de TP53 remove a última barreira contra a instabilidade genômica: surgem células capazes de degradar a membrana basal e invadir.',
      'Ao atravessar a muscular da mucosa, as glândulas chegam à submucosa, onde há linfáticos — a partir daqui o tumor pode dar metástase.',
      'O tumor recruta fibroblastos (desmoplasia) e vasos; o centro das glândulas grandes necrosa ("necrose suja").',
      'Numa via alternativa (15 %), a falha do reparo de erros de pareamento (MLH1, MSH2 — Lynch ou metilação) gera tumores com instabilidade de microssatélites, muitas vezes mucinosos e com muitos linfócitos.',
    ],
    roteiro: [
      'Panorâmico: localize a mucosa normal (criptas regulares, roxo-claras) e a área onde ela é substituída por uma massa mais escura e desorganizada — o tumor.',
      'Encontre a transição abrupta: é o melhor ponto para comparar criptas normais e glândulas neoplásicas lado a lado.',
      'Siga o tumor em profundidade: submucosa, muscular própria (feixes rosados de músculo liso) e além — a camada mais profunda atingida define o estádio T.',
      'Médio aumento: glândulas irregulares, ramificadas, cribriformes, cercadas por estroma desmoplásico.',
      'Grande aumento: núcleos grandes, estratificados, vesiculosos, com nucléolos; na luz das glândulas, restos necróticos com poeira nuclear ("necrose suja").',
    ],
    achados: [
      {
        achado: 'glandulas-neoplasicas-complexas',
        tipo: 'especifico',
        comoAparece: 'Glândulas irregulares, alongadas, ramificadas e aglomeradas, sem células caliciformes, substituindo as criptas.',
        peso: 'criterio',
      },
      {
        achado: 'invasao-estromal',
        tipo: 'especifico',
        comoAparece: 'Glândulas atípicas além da muscular da mucosa, infiltrando a submucosa e as camadas profundas, em estroma desmoplásico.',
        peso: 'criterio',
      },
      {
        achado: 'infiltracao-da-muscular-propria',
        tipo: 'especifico',
        comoAparece: 'Glândulas tumorais entre os feixes de músculo liso da muscular própria (pelo menos pT2).',
        peso: 'frequente',
      },
      {
        achado: 'necrose-suja',
        tipo: 'especifico',
        comoAparece: 'Restos necróticos com poeira nuclear dentro da luz das glândulas tumorais — muito característica de origem colorretal.',
        peso: 'frequente',
      },
      {
        achado: 'transicao-abrupta-para-mucosa-normal',
        tipo: 'especifico',
        comoAparece: 'A mucosa normal termina de repente onde começa o tumor.',
        peso: 'frequente',
      },
      {
        achado: 'mucina-extracelular',
        tipo: 'especifico',
        comoAparece: 'Lagos de muco com células tumorais flutuando (componente ou tipo mucinoso).',
        peso: 'ocasional',
      },
      {
        achado: 'celulas-em-anel-de-sinete',
        tipo: 'especifico',
        comoAparece: 'Células isoladas com vacúolo de mucina e núcleo em crescente (variante agressiva).',
        peso: 'ocasional',
      },
      {
        achado: 'adenoma-residual',
        tipo: 'especifico',
        comoAparece: 'Restos do adenoma de origem na superfície ou na borda do tumor.',
        peso: 'ocasional',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos grandes, alongados ou vesiculosos, estratificados até a superfície, com nucléolos evidentes.',
        peso: 'criterio',
      },
      {
        achado: 'reacao-desmoplasica',
        tipo: 'geral',
        comoAparece: 'Estroma fibroso, celular e pálido em torno das glândulas invasivas.',
        peso: 'frequente',
      },
      {
        achado: 'invasao-angiolinfatica',
        tipo: 'geral',
        comoAparece: 'Êmbolos tumorais em vasos da submucosa ou da subserosa (fator prognóstico).',
        peso: 'ocasional',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Superfície do tumor ulcerada, com fibrina e neutrófilos — explica o sangramento oculto nas fezes.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Adenoma com displasia de alto grau',
        comoSeparar:
          'Mesma atipia e arquitetura complexa, mas confinada à mucosa, sem ultrapassar a muscular da mucosa e sem desmoplasia. A invasão da submucosa é o divisor.',
      },
      {
        nome: 'Pseudoinvasão em pólipo pediculado',
        comoSeparar:
          'Glândulas deslocadas para a submucosa por torção do pedículo vêm com lâmina própria ao redor, hemossiderina e muco extravasado — e não com desmoplasia.',
      },
      {
        nome: 'Metástase de outro adenocarcinoma no cólon',
        comoSeparar:
          'Cresce de fora para dentro (serosa → mucosa), sem displasia na superfície; imuno-histoquímica (CK7−/CK20+/CDX2+ no colorretal) ajuda.',
      },
      {
        nome: 'Criptas reativas da colite',
        comoSeparar: 'Atipia regenerativa com inflamação, sem invasão e com maturação para a superfície.',
      },
    ],
    correlacaoClinica: [
      'Cólon direito: tumores volumosos que sangram de forma oculta — anemia ferropriva no idoso é câncer de cólon até prova em contrário.',
      'Cólon esquerdo e reto: tumores anulares e estenosantes — alteração do hábito intestinal, fezes afiladas, sangue vivo e obstrução.',
      'O estadiamento (TNM) usa exatamente o que a lâmina mostra: profundidade de invasão (T), linfonodos (N), invasão vascular e margens.',
      'Rastreamento com pesquisa de sangue oculto e colonoscopia a partir dos 45–50 anos remove adenomas antes da invasão.',
      'O CEA sérico serve para seguimento, não para diagnóstico.',
    ],
    comparacaoComNormal: [
      'No cólon normal, as criptas são tubos retos, iguais e paralelos, cheios de células caliciformes, com núcleos pequenos na base.',
      'No tumor, as glândulas são irregulares, ramificadas e fundidas, com núcleos grandes empilhados e quase sem células caliciformes.',
      'A muscular própria normal é só músculo liso; no tumor, glândulas se infiltram entre os feixes.',
    ],
    doencaDoManual: 'adenocarcinoma-colorretal',
  },
  {
    id: 'adenoma-colorretal',
    nome: 'Adenoma colorretal',
    sinonimos: ['pólipo adenomatoso', 'adenoma tubular', 'adenoma viloso', 'adenoma tubuloviloso'],
    nomesEmIngles: ['colorectal adenoma', 'adenomatous polyp', 'villous adenoma', 'tubular adenoma'],
    sistema: 'digestorio',
    orgao: 'colon',
    prioridade: 3,
    resumo:
      'Neoplasia benigna do epitélio do cólon — displasia sem invasão —, que forma um pólipo tubular, viloso ou tubuloviloso e é a lesão precursora da maioria dos adenocarcinomas colorretais.',
    epidemiologia:
      'Encontrado em 25–40 % das colonoscopias de rastreamento após os 50 anos. A maioria é pequena e tubular; o risco de conter carcinoma cresce com o tamanho (≥ 1 cm), o componente viloso e a displasia de alto grau.',
    patogenese: [
      'Uma célula-tronco da cripta perde APC (β-catenina ativa a via Wnt): as células continuam proliferando enquanto sobem a cripta, em vez de amadurecer.',
      'As células displásicas se acumulam no topo das criptas e crescem para a luz, formando um pólipo.',
      'Com novas mutações (KRAS, SMAD4), a lesão cresce e a arquitetura se complica (tubular → viloso) e a displasia se agrava.',
      'Enquanto a membrana basal e a muscular da mucosa estão intactas, não há acesso a linfáticos: não há risco de metástase — por isso a polipectomia cura.',
      'Se células displásicas atravessam a muscular da mucosa e chegam à submucosa, o adenoma virou adenocarcinoma.',
    ],
    roteiro: [
      'Panorâmico: identifique o pólipo, seu eixo (pedículo de submucosa) e a mucosa colônica normal na base.',
      'Na junção pólipo–mucosa normal, compare: criptas normais claras, cheias de caliciformes × epitélio adenomatoso escuro.',
      'Médio aumento: defina a arquitetura — criptas tubulares ou frondes vilosas com eixo fino.',
      'Grande aumento: núcleos alongados em lápis, estratificados, com depleção de caliciformes (displasia); gradue baixo × alto grau.',
      'Por último e mais importante: examine o eixo e a base à procura de glândulas na submucosa — se houver invasão, é carcinoma.',
    ],
    achados: [
      {
        achado: 'displasia-epitelial',
        tipo: 'especifico',
        comoAparece: 'Epitélio de núcleos alongados, hipercromáticos e estratificados, com poucas células caliciformes, em toda a superfície do pólipo.',
        peso: 'criterio',
      },
      {
        achado: 'arquitetura-vilosa',
        tipo: 'especifico',
        comoAparece: 'Frondes longas com eixo delgado de lâmina própria (adenoma viloso ou tubuloviloso).',
        peso: 'frequente',
      },
      {
        achado: 'transicao-abrupta-para-mucosa-normal',
        tipo: 'especifico',
        comoAparece: 'Na base do pólipo, o epitélio adenomatoso termina e começa a mucosa normal.',
        peso: 'frequente',
      },
      {
        achado: 'displasia-de-alto-grau',
        tipo: 'especifico',
        comoAparece: 'Focos com núcleos redondos e vesiculosos até a superfície e glândulas cribriformes (adenoma avançado).',
        peso: 'ocasional',
      },
      {
        achado: 'invasao-estromal',
        tipo: 'especifico',
        comoAparece: 'Se glândulas atípicas atravessam a muscular da mucosa e infiltram a submucosa do eixo, já não é adenoma: é adenocarcinoma originado em adenoma.',
        peso: 'ocasional',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos maiores, mais escuros e empilhados que os da mucosa normal vizinha.',
        peso: 'frequente',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Eixos das frondes com capilares dilatados e cheios de hemácias — explica o sangramento dos pólipos.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Pólipo hiperplásico',
        comoSeparar:
          'Criptas com luz serrilhada ("dente de serra") na metade superior, núcleos pequenos e basais, sem displasia; geralmente pequeno e no reto.',
      },
      {
        nome: 'Lesão serrilhada séssil',
        comoSeparar:
          'Arquitetura serrilhada com criptas dilatadas em "L" ou "bota" na base, no cólon direito; sem a displasia convencional do adenoma.',
      },
      {
        nome: 'Adenocarcinoma originado em adenoma',
        comoSeparar: 'Presença de invasão da submucosa com desmoplasia — procure sempre no eixo e na base.',
      },
      {
        nome: 'Pseudoinvasão (deslocamento epitelial)',
        comoSeparar:
          'Glândulas adenomatosas na submucosa por torção do pedículo, acompanhadas de lâmina própria, hemossiderina e muco, sem desmoplasia nem atipia maior que a da superfície.',
      },
    ],
    correlacaoClinica: [
      'Geralmente assintomático; pode sangrar (sangue oculto nas fezes, hematoquezia) — é o que o rastreamento com pesquisa de sangue oculto detecta.',
      'Polipectomia remove a lesão e interrompe a sequência adenoma-carcinoma; o laudo (tamanho, arquitetura, grau, margens) define o intervalo da próxima colonoscopia.',
      'Múltiplos adenomas (centenas a milhares) em jovem sugerem polipose adenomatosa familiar (APC germinativo).',
    ],
    comparacaoComNormal: [
      'Na mucosa normal, as criptas são curtas, retas e cheias de células caliciformes claras; os núcleos são pequenos e ficam na base.',
      'No adenoma, o epitélio é escuro, com núcleos alongados empilhados e pouca mucina, e forma frondes ou criptas alongadas para a luz.',
      'Nos dois, a muscular da mucosa está íntegra: a displasia não a atravessa.',
    ],
  },
  {
    id: 'colite-ulcerativa',
    nome: 'Colite ulcerativa',
    sinonimos: ['retocolite ulcerativa', 'RCU', 'retocolite ulcerativa idiopática'],
    nomesEmIngles: ['ulcerative colitis'],
    sistema: 'digestorio',
    orgao: 'colon',
    prioridade: 4,
    resumo:
      'Doença inflamatória intestinal crônica que acomete a mucosa do reto e se estende de forma contínua pelo cólon, com surtos de colite ativa (neutrófilos, abscessos de cripta, úlceras) sobre sinais de cronicidade (criptas distorcidas, plasmocitose basal).',
    epidemiologia:
      'Pico entre 15 e 30 anos, com segundo pico menor após os 50. Mais comum em países industrializados, em crescimento no Brasil. Curiosamente, o tabagismo é fator protetor (ao contrário do Crohn).',
    patogenese: [
      'Em hospedeiro geneticamente predisposto, a barreira epitelial da mucosa colônica é mais permeável e a resposta à microbiota é desregulada.',
      'Linfócitos T (perfil Th2 atípico/Th17) e plasmócitos se acumulam na lâmina própria — a inflamação crônica de base.',
      'Nos surtos, neutrófilos atravessam o epitélio das criptas (criptite) e se acumulam na luz (abscesso de cripta).',
      'As criptas destruídas confluem em úlceras; o que sobra da mucosa entre elas fica em relevo (pseudopólipos).',
      'Na regeneração, as criptas se refazem ramificadas e encurtadas: a distorção arquitetural registra a cronicidade.',
      'A inflamação é contínua a partir do reto e, em geral, limitada à mucosa — exceto em colite grave/fulminante, em que ultrapassa para a submucosa e a muscular (risco de megacólon tóxico).',
    ],
    roteiro: [
      'Panorâmico: veja a mucosa inteira — onde há criptas, onde a mucosa sumiu (úlceras) e ilhas de mucosa entre úlceras (pseudopólipos).',
      'Médio aumento: avalie a arquitetura das criptas (paralelas e iguais × ramificadas, encurtadas, de tamanhos diferentes).',
      'Lâmina própria: está expandida por linfócitos e plasmócitos, inclusive na base das criptas?',
      'Grande aumento: procure neutrófilos no epitélio das criptas e na sua luz (abscessos de cripta).',
      'Na parede profunda, note se a inflamação se restringe à mucosa (típico) ou chega à submucosa (colite grave) — e verifique a AUSÊNCIA de granulomas e fissuras, que fariam pensar em Crohn.',
    ],
    achados: [
      {
        achado: 'distorcao-arquitetural-das-criptas',
        tipo: 'especifico',
        comoAparece: 'Criptas ramificadas, encurtadas e irregulares, difusamente, a partir do reto.',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'especifico',
        comoAparece: 'Lâmina própria expandida por plasmócitos e linfócitos, com plasmocitose basal.',
        peso: 'criterio',
      },
      {
        achado: 'abscesso-de-cripta',
        tipo: 'especifico',
        comoAparece: 'Neutrófilos na luz das criptas: marca de atividade (surto).',
        peso: 'frequente',
      },
      {
        achado: 'pseudopolipo-inflamatorio',
        tipo: 'especifico',
        comoAparece: 'Ilhas de mucosa em relevo entre úlceras, na doença grave ou de longa duração.',
        peso: 'ocasional',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Úlceras largas e superficiais, com fundo de tecido de granulação; a mucosa vizinha pode ficar "escavada".',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos na lâmina própria, no epitélio das criptas e nas úlceras.',
        peso: 'frequente',
      },
      {
        achado: 'tecido-de-granulacao',
        tipo: 'geral',
        comoAparece: 'No fundo das úlceras: capilares novos e dilatados, fibroblastos e células inflamatórias.',
        peso: 'frequente',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Vasos da mucosa e da submucosa dilatados e cheios — explica a diarreia com sangue.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Doença de Crohn',
        comoSeparar:
          'Crohn é segmentar ("lesões salteadas"), transmural (agregados linfoides até a serosa), com úlceras em fissura e granulomas não caseosos, e pode acometer do íleo ao ânus. A colite ulcerativa é contínua desde o reto e limitada à mucosa, sem granulomas.',
      },
      {
        nome: 'Colite infecciosa aguda',
        comoSeparar:
          'Neutrófilos e abscessos de cripta também aparecem, mas a arquitetura das criptas está PRESERVADA e não há plasmocitose basal — a doença tem dias, não meses.',
      },
      {
        nome: 'Colite isquêmica',
        comoSeparar: 'Criptas atróficas "em fantasma", lâmina própria hialinizada e hemorrágica, distribuição nas áreas de fronteira vascular (ângulo esplênico); pouca inflamação crônica.',
      },
      {
        nome: 'Colite microscópica (linfocítica/colagenosa)',
        comoSeparar: 'Arquitetura preservada; aumento de linfócitos intraepiteliais ou banda de colágeno subepitelial espessa, sem úlceras.',
      },
    ],
    correlacaoClinica: [
      'Diarreia com sangue e muco, tenesmo e urgência evacuatória — a mucosa ulcerada e congesta sangra e não absorve.',
      'Complicações: megacólon tóxico na colite grave (a inflamação atinge a muscular, que perde o tônus), anemia, e manifestações extraintestinais (colangite esclerosante primária, artrite, eritema nodoso, uveíte).',
      'Risco de adenocarcinoma aumenta após 8–10 anos de pancolite: exige colonoscopias de vigilância com biópsias para displasia.',
      'Tratamento: aminossalicilatos, corticoides nos surtos, imunossupressores e biológicos; a colectomia total é curativa.',
    ],
    comparacaoComNormal: [
      'No normal, as criptas são tubos retos, paralelos e iguais, que tocam a muscular da mucosa, cheios de células caliciformes.',
      'Na colite ulcerativa, as criptas ficam ramificadas, encurtadas e espaçadas, com neutrófilos na luz; em áreas, a mucosa desaparece (úlcera).',
      'A lâmina própria normal é frouxa e pouco celular; na colite, está abarrotada de linfócitos e plasmócitos.',
    ],
  },
  {
    id: 'doenca-de-crohn',
    nome: 'Doença de Crohn',
    sinonimos: ['enterite regional', 'ileíte terminal', 'DII'],
    nomesEmIngles: ["Crohn's disease", 'regional enteritis'],
    sistema: 'digestorio',
    orgao: 'ileo',
    prioridade: 5,
    resumo:
      'Doença inflamatória intestinal crônica, segmentar e transmural, que pode acometer qualquer ponto do trato digestivo (mais o íleo terminal), com granulomas não caseosos, agregados linfoides em toda a parede, úlceras em fissura e fibrose que leva a estenoses e fístulas.',
    epidemiologia:
      'Pico entre 15 e 35 anos. Incidência crescente no Brasil. O tabagismo aumenta o risco e a gravidade (ao contrário da colite ulcerativa). Associação com variantes de NOD2, ATG16L1 e IRGM.',
    patogenese: [
      'Em hospedeiros com defeito na detecção e eliminação de bactérias intracelulares (NOD2, autofagia), a microbiota atravessa uma barreira epitelial defeituosa.',
      'A resposta imune Th1/Th17 exagerada (IFN-γ, TNF, IL-12/23) recruta e ativa macrófagos — que formam granulomas.',
      'A inflamação se espalha por toda a parede ao longo de linfáticos: agregados linfoides na submucosa, na muscular e na subserosa.',
      'Úlceras aftoides sobre folículos linfoides se aprofundam em fissuras, que podem atravessar a parede e formar fístulas e abscessos.',
      'A cronicidade ativa fibroblastos: a parede se espessa e o lúmen estreita (estenose), causando obstrução.',
      'O processo é segmentar: trechos doentes intercalados com mucosa normal ("lesões salteadas").',
    ],
    roteiro: [
      'Panorâmico: veja a parede inteira — espessada? Procure pontos azuis (agregados linfoides) na muscular própria e na subserosa, longe da mucosa: é a inflamação transmural.',
      'Avalie a submucosa: alargada por fibrose e edema (base da estenose)?',
      'Mucosa: procure úlceras (áreas sem epitélio) e, no íleo, alteração das vilosidades e das criptas.',
      'Médio e grande aumento: dentro ou perto dos agregados linfoides, procure nódulos pálidos de macrófagos epitelioides — granulomas não caseosos.',
      'Por fim, busque fissuras (úlceras estreitas e profundas) e trajetos fistulosos.',
    ],
    achados: [
      {
        achado: 'granuloma-epitelioide',
        tipo: 'especifico',
        comoAparece: 'Granulomas pequenos, não caseosos, em qualquer camada da parede — presentes em cerca de metade dos casos.',
        peso: 'criterio',
      },
      {
        achado: 'agregados-linfoides-transmurais',
        tipo: 'especifico',
        comoAparece: 'Agregados linfoides na submucosa, entre os feixes da muscular própria e na subserosa ("rosário de Crohn").',
        peso: 'criterio',
      },
      {
        achado: 'fibrose-da-submucosa',
        tipo: 'especifico',
        comoAparece: 'Submucosa espessada por fibrose e edema — causa das estenoses.',
        peso: 'frequente',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Úlceras aftoides iniciais que se aprofundam em fissuras.',
        peso: 'frequente',
      },
      {
        achado: 'distorcao-arquitetural-das-criptas',
        tipo: 'geral',
        comoAparece: 'Criptas distorcidas e, no íleo, atrofia vilositária e metaplasia pilórica — sinais de cronicidade.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Inflamação crônica da lâmina própria, irregular e segmentar.',
        peso: 'frequente',
      },
      {
        achado: 'abscesso-de-cripta',
        tipo: 'geral',
        comoAparece: 'Atividade focal, geralmente menos difusa que na colite ulcerativa.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Colite ulcerativa',
        comoSeparar:
          'Contínua a partir do reto, limitada à mucosa, sem granulomas nem fissuras; não acomete o íleo (exceto ileíte de refluxo discreta).',
      },
      {
        nome: 'Tuberculose intestinal',
        comoSeparar:
          'Granulomas grandes, confluentes, com necrose caseosa e células de Langhans; úlceras transversais; BAAR/cultura/PCR positivos. Crucial antes de iniciar anti-TNF.',
      },
      {
        nome: 'Yersiniose',
        comoSeparar: 'Ileíte aguda com granulomas supurativos (centro com neutrófilos) e linfadenite mesentérica; curso autolimitado.',
      },
      {
        nome: 'Enterite isquêmica ou actínica',
        comoSeparar: 'Fibrose e úlceras, mas sem granulomas nem agregados linfoides transmurais; vasos alterados.',
      },
    ],
    correlacaoClinica: [
      'Dor abdominal em fossa ilíaca direita, diarreia (geralmente sem sangue), perda de peso e febre; pode simular apendicite.',
      'Estenoses causam obstrução; fissuras transmurais causam fístulas (enteroentéricas, enterovesicais, perianais) e abscessos.',
      'O íleo terminal doente absorve mal vitamina B12 e sais biliares: anemia megaloblástica, diarreia colerética e cálculos.',
      'Tratamento: corticoides, imunomoduladores e biológicos (anti-TNF, anti-integrina, anti-IL-12/23); cirurgia para estenoses e fístulas, poupando intestino porque a doença recorre.',
    ],
    comparacaoComNormal: [
      'No íleo normal, a mucosa tem vilosidades altas e finas; a submucosa é fina e a muscular própria e a serosa não têm inflamação.',
      'No Crohn, a submucosa fica larga e fibrosa, e aparecem agregados linfoides até a face externa da parede.',
      'Os nódulos pálidos de macrófagos epitelioides (granulomas) não existem no íleo normal — os nódulos normais são folículos linfoides das placas de Peyer, na mucosa e submucosa.',
    ],
  },
  {
    id: 'gastrite-cronica-h-pylori',
    nome: 'Gastrite crônica por Helicobacter pylori',
    sinonimos: ['gastrite do tipo B', 'gastrite crônica ativa', 'pangastrite'],
    nomesEmIngles: ['Helicobacter pylori gastritis', 'chronic active gastritis'],
    sistema: 'digestorio',
    orgao: 'estomago-piloro',
    prioridade: 6,
    resumo:
      'Inflamação crônica da mucosa gástrica causada pelo H. pylori: infiltrado linfoplasmocitário na lâmina própria, folículos linfoides e, na fase ativa, neutrófilos; com os anos, atrofia e metaplasia intestinal.',
    epidemiologia:
      'Infecta cerca de metade da população mundial, adquirida na infância; no Brasil a prevalência em adultos passa de 60 % em muitas regiões. A maioria é assintomática, mas 10–15 % desenvolvem úlcera péptica e 1–3 %, câncer gástrico.',
    patogenese: [
      'A bactéria coloniza o muco do antro, protegida pela urease que neutraliza o ácido à sua volta.',
      'CagA e VacA lesam o epitélio e induzem IL-8: neutrófilos migram para as fovéolas (gastrite ATIVA).',
      'A persistência da infecção recruta linfócitos e plasmócitos e forma folículos linfoides com centros germinativos (gastrite CRÔNICA) — folículos não existem na mucosa gástrica normal.',
      'A inflamação de anos destrói glândulas (atrofia) e as células-tronco passam a produzir epitélio intestinal (metaplasia intestinal).',
      'Sobre a metaplasia podem surgir displasia e adenocarcinoma do tipo intestinal; o estímulo linfoide crônico pode originar linfoma MALT.',
    ],
    roteiro: [
      'Panorâmico: identifique fragmentos de mucosa gástrica — fovéolas na superfície, glândulas na profundidade.',
      'Lâmina própria: está expandida por linfócitos e plasmócitos? Há folículos linfoides?',
      'Procure neutrófilos no epitélio das fovéolas (atividade).',
      'Procure metaplasia intestinal: glândulas com células caliciformes em cálice e, às vezes, células de Paneth.',
      'Examine o muco da superfície no maior aumento (ou peça Giemsa/imuno-histoquímica) à procura dos bacilos.',
    ],
    achados: [
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Lâmina própria superficial e profunda expandida por linfócitos e plasmócitos.',
        peso: 'criterio',
      },
      {
        achado: 'helicobacter-pylori',
        tipo: 'especifico',
        comoAparece: 'Bacilos curvos no muco sobre o epitélio foveolar (melhor vistos em Giemsa/imuno-histoquímica).',
        peso: 'criterio',
      },
      {
        achado: 'hiperplasia-linfoide-reativa',
        tipo: 'especifico',
        comoAparece: 'Folículos linfoides com centros germinativos na mucosa — muito sugestivos de H. pylori.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos no epitélio das fovéolas e das glândulas: gastrite ativa.',
        peso: 'frequente',
      },
      {
        achado: 'metaplasia-intestinal',
        tipo: 'especifico',
        comoAparece: 'Glândulas com células caliciformes e de Paneth substituindo glândulas gástricas, nas infecções de longa data.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Gastrite autoimune',
        comoSeparar:
          'Atrofia restrita ao corpo e fundo (antro poupado), perda das células parietais, hiperplasia de células endócrinas; anti-célula parietal e anti-fator intrínseco; anemia perniciosa. Sem H. pylori.',
      },
      {
        nome: 'Gastropatia reativa (química)',
        comoSeparar: 'Hiperplasia foveolar em saca-rolhas, edema e fibras musculares na lâmina própria, POUCA inflamação — por AINE ou refluxo biliar.',
      },
      {
        nome: 'Linfoma MALT',
        comoSeparar: 'Infiltrado linfoide denso e monótono de células B marginais que destrói glândulas (lesões linfoepiteliais); clonalidade.',
      },
    ],
    correlacaoClinica: [
      'Muitas vezes assintomática; pode causar dispepsia. Associada a úlcera duodenal (antro inflamado → mais gastrina → mais ácido) e gástrica.',
      'Diagnóstico: teste da urease em biópsia, histologia, teste respiratório com ureia marcada, antígeno fecal.',
      'Tratamento: inibidor de bomba de prótons + dois antibióticos (terapia tríplice) ou quádrupla com bismuto; confirmar erradicação.',
      'Erradicar reduz o risco de câncer gástrico, sobretudo antes que a atrofia e a metaplasia se instalem.',
    ],
    comparacaoComNormal: [
      'Na mucosa antral normal, a lâmina própria entre as glândulas é frouxa, com poucas células, e não há folículos linfoides.',
      'O epitélio foveolar normal tem muco em "capuz" uniforme em todas as células; na metaplasia, aparecem células caliciformes isoladas, como no intestino.',
    ],
  },
]
