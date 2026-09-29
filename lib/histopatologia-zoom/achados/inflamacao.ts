import type { AchadoPatologico } from '../tipos'

/** Achados de inflamação aguda e crônica, reparo e seus produtos. */
export const ACHADOS_INFLAMACAO: AchadoPatologico[] = [
  {
    id: 'infiltrado-neutrofilico',
    nome: 'Infiltrado neutrofílico (inflamação aguda)',
    sinonimos: ['neutrófilos', 'polimorfonucleares', 'PMN', 'inflamação aguda'],
    categoria: 'inflamacao',
    resumo:
      'Neutrófilos fora dos vasos, infiltrando o tecido: células de 12–15 µm com núcleo segmentado em 3–5 lóbulos e citoplasma rosa-pálido — a assinatura da inflamação aguda.',
    comoReconhecer: [
      'No pequeno aumento: áreas hipercelulares, "sujas", de tom azul-arroxeado mais intenso que o tecido vizinho.',
      'No médio aumento: células pequenas e redondas espalhadas entre as fibras ou em lençóis, sem a disposição organizada de um tecido.',
      'No grande aumento: núcleo multilobulado (3–5 lóbulos ligados por filamentos finos), cromatina densa, citoplasma claro ou levemente rosado. O linfócito, ao contrário, tem núcleo único, redondo e quase sem citoplasma.',
      'Neutrófilos degenerados perdem os lóbulos e viram fragmentos nucleares (cariorrexe) — a "poeira nuclear" típica do pus.',
    ],
    mecanismo: [
      'O agressor (bactéria, necrose, isquemia) libera padrões moleculares reconhecidos por macrófagos e mastócitos residentes, que secretam TNF, IL-1 e quimiocinas (IL-8/CXCL8).',
      'O endotélio da vênula pós-capilar expressa selectinas e integrinas: o neutrófilo rola, adere firmemente e atravessa a parede (diapedese) em minutos a poucas horas.',
      'Guiado pelo gradiente quimiotático (C5a, LTB4, IL-8, produtos bacterianos), migra até o foco e fagocita; ao degranular, libera proteases e radicais livres que também lesam o tecido do hospedeiro.',
      'Vive 1–2 dias no tecido: sua presença indica agressão em curso ou recente (horas a poucos dias).',
    ],
    significado: [
      'Indica inflamação aguda — resposta a infecção bacteriana, necrose ou isquemia recentes.',
      'A localização decide o diagnóstico: neutrófilos na muscular própria do apêndice definem apendicite; nas criptas do cólon, colite ativa; no epitélio gástrico, gastrite ativa.',
      'Em grande quantidade, com liquefação do tecido, formam pus e abscesso.',
    ],
    ondeOcorre: [
      'Apendicite, colecistite e diverticulite agudas.',
      'Pneumonia bacteriana (alvéolos cheios de neutrófilos).',
      'Colite e gastrite ativas, abscessos, úlceras, bordas de infarto recente (24–72 h).',
    ],
    armadilhas: [
      'Neutrófilos dentro dos vasos (marginação, sangue coletado) não são infiltrado: é preciso vê-los no tecido.',
      'Eosinófilos também são polimorfonucleares, mas têm núcleo bilobado e grânulos vermelho-alaranjados intensos.',
      'Linfócitos esmagados e núcleos picnóticos podem imitar neutrófilos no pequeno aumento — confirme os lóbulos no grande aumento.',
    ],
  },
  {
    id: 'inflamacao-aguda-transmural',
    nome: 'Inflamação aguda transmural (neutrófilos na muscular própria)',
    sinonimos: ['infiltração neutrofílica da muscular própria', 'inflamação transmural'],
    categoria: 'inflamacao',
    resumo:
      'Neutrófilos dissecando os feixes da muscular própria, separados por edema: a inflamação ultrapassou a mucosa e a submucosa e tomou toda a espessura da parede.',
    comoReconhecer: [
      'No pequeno aumento: a camada muscular, normalmente rosa homogênea e compacta, aparece "frouxa", com fendas claras entre os feixes.',
      'No médio aumento: células pequenas e escuras enfileiradas entre as fibras musculares lisas, paralelas a elas.',
      'No grande aumento: núcleos segmentados de neutrófilos entre células musculares lisas de núcleo alongado "em charuto"; espaços claros de edema afastam as fibras.',
    ],
    mecanismo: [
      'Na víscera oca obstruída, a pressão intraluminal sobe acima da pressão venosa: o retorno venoso para, a parede congestiona e fica isquêmica.',
      'A isquemia rompe a barreira mucosa; bactérias da luz invadem a parede e a resposta neutrofílica avança camada por camada, da mucosa à serosa.',
      'As proteases dos neutrófilos e a isquemia progressiva podem necrosar a parede (forma gangrenosa) e perfurá-la.',
    ],
    significado: [
      'É o critério histológico de apendicite aguda: neutrófilos na muscular própria. Neutrófilos só na mucosa ("apendicite mucosa"/catarral) têm significado clínico incerto.',
      'Na colecistite e na diverticulite, a transmuralidade indica doença estabelecida, com risco de perfuração.',
    ],
    ondeOcorre: ['Apendicite aguda', 'Colecistite aguda', 'Diverticulite aguda', 'Isquemia intestinal com infecção secundária'],
    armadilhas: [
      'Alguns neutrófilos na serosa por manipulação cirúrgica ou peritonite de outra origem ("periapendicite" isolada) não significam apendicite: a inflamação deve vir de dentro para fora.',
      'Hemácias extravasadas e núcleos de fibras musculares cortadas transversalmente podem ser confundidos com células inflamatórias no pequeno aumento.',
    ],
  },
  {
    id: 'exsudato-fibrinopurulento',
    nome: 'Exsudato fibrinopurulento (serosite)',
    sinonimos: ['serosite fibrinopurulenta', 'periapendicite', 'peritonite localizada', 'exsudato fibrinoso'],
    categoria: 'inflamacao',
    resumo:
      'Camada de fibrina — material rosa, amorfo ou em rede — misturada a neutrófilos, depositada sobre uma superfície serosa (peritônio, pleura, pericárdio).',
    comoReconhecer: [
      'No pequeno aumento: faixa rosa, irregular e "felpuda" colada à superfície externa do órgão, onde deveria haver só uma linha fina de mesotélio.',
      'No médio aumento: fibrina eosinofílica em filamentos ou placas, sem núcleos próprios, entremeada de células inflamatórias.',
      'No grande aumento: neutrófilos (núcleos segmentados) presos na malha de fibrina; o mesotélio abaixo está descamado ou reativo, e o tecido subseroso edemaciado e congesto.',
    ],
    mecanismo: [
      'A inflamação aumenta a permeabilidade vascular a ponto de deixar sair proteínas grandes, inclusive o fibrinogênio.',
      'No tecido, o fibrinogênio é convertido em fibrina pela via da coagulação ativada pelo fator tecidual: forma-se uma rede que prende neutrófilos e bactérias.',
      'Se o processo cede, a fibrina é removida por fibrinólise e macrófagos; se persiste, é organizada por fibroblastos e vasos — daí as aderências (bridas) pós-peritonite.',
    ],
    significado: [
      'Mostra que a inflamação atingiu a superfície serosa: no apêndice, a peritonite localizada explica a dor que migra para a fossa ilíaca direita e a defesa abdominal.',
      'Exsudato fibrinoso puro (sem pus) sobre o pericárdio é o "pão com manteiga" da pericardite fibrinosa urêmica ou pós-infarto.',
    ],
    ondeOcorre: ['Apendicite aguda com periapendicite', 'Peritonite bacteriana', 'Pleurite de pneumonia', 'Pericardite fibrinosa'],
    armadilhas: [
      'Coágulo sanguíneo aderido à superfície também tem fibrina, mas é dominado por hemácias em camadas (linhas de Zahn ausentes num coágulo recente).',
      'Tecido adiposo cauterizado na borda cirúrgica fica rosa e amorfo, mas não tem neutrófilos em rede nem mesotélio reativo.',
    ],
  },
  {
    id: 'ulceracao-da-mucosa',
    nome: 'Ulceração da mucosa',
    sinonimos: ['úlcera', 'erosão', 'perda do epitélio'],
    categoria: 'inflamacao',
    resumo:
      'Perda do epitélio de revestimento e de parte ou de toda a mucosa, substituídos por exsudato de fibrina, neutrófilos e restos necróticos — e, com o tempo, por tecido de granulação.',
    comoReconhecer: [
      'No pequeno aumento: falta o contorno regular de glândulas ou vilosidades; a luz é delimitada por um material rosa e sujo em vez de epitélio.',
      'No médio aumento: base com três camadas — exsudato fibrinopurulento na superfície, necrose fibrinoide logo abaixo, tecido de granulação (vasos novos e células inflamatórias) no fundo.',
      'Erosão = perda só do epitélio, sem ultrapassar a muscular da mucosa; úlcera = ultrapassa a muscular da mucosa.',
    ],
    mecanismo: [
      'Isquemia, ácido, toxinas, agentes infecciosos ou a própria resposta inflamatória matam as células epiteliais mais rápido do que elas se renovam.',
      'Sem o epitélio, a barreira se perde: bactérias e conteúdo luminal entram em contato com a lâmina própria, o que amplia a inflamação.',
      'A cicatrização começa pela borda: o epitélio vizinho migra sobre o tecido de granulação; úlceras profundas deixam fibrose e distorção da parede.',
    ],
    significado: [
      'Mostra lesão ativa com quebra da barreira epitelial; a profundidade (erosão × úlcera × perfuração) gradua a gravidade.',
      'O padrão das úlceras orienta o diagnóstico: contínuas e superficiais na colite ulcerativa, em fissura e profundas na doença de Crohn, em "saca-bocado" com fundo limpo na úlcera péptica.',
    ],
    ondeOcorre: ['Apendicite aguda', 'Úlcera péptica', 'Doenças inflamatórias intestinais', 'Colite isquêmica e infecciosa', 'Superfície de tumores ulcerados'],
    armadilhas: [
      'Epitélio descolado por artefato de manipulação deixa a lâmina própria nua, mas sem fibrina, sem neutrófilos e sem tecido de granulação na base.',
      'Na borda de uma úlcera o epitélio regenerativo tem núcleos grandes e nucléolos: não confundir com displasia.',
    ],
  },
  {
    id: 'edema-inflamatorio',
    nome: 'Edema inflamatório',
    sinonimos: ['edema', 'exsudato seroso'],
    categoria: 'inflamacao',
    resumo:
      'Acúmulo de líquido no interstício que afasta fibras e células, deixando espaços claros ou levemente rosados entre elas.',
    comoReconhecer: [
      'No pequeno aumento: o tecido parece "inchado" e pálido, com trama frouxa.',
      'No médio aumento: fendas e lagos claros separando feixes de colágeno ou de músculo; o líquido rico em proteína (exsudato) pode ter tom rosa-pálido granular.',
      'No grande aumento: células inflamatórias boiando nesses espaços; vasos dilatados ao redor.',
    ],
    mecanismo: [
      'Histamina, bradicinina e leucotrienos contraem as células endoteliais das vênulas e abrem espaços entre elas: o plasma escapa para o interstício.',
      'Na inflamação, o líquido é um exsudato (rico em proteínas); no edema cardíaco ou por hipoalbuminemia, um transudato (pobre em proteínas, sem células).',
    ],
    significado: [
      'É um dos primeiros sinais da inflamação aguda (tumor, o "inchaço" dos sinais cardinais).',
      'Na parede de víscera oca, o edema da muscular própria acompanha a inflamação transmural.',
    ],
    ondeOcorre: ['Qualquer inflamação aguda', 'Urticária e angioedema', 'Insuficiência cardíaca (transudato)'],
    armadilhas: [
      'Retração do tecido na fixação também abre fendas claras, mas elas são limpas, de bordas nítidas, e não contêm proteína nem células inflamatórias.',
    ],
  },
  {
    id: 'hiperemia-e-congestao',
    nome: 'Hiperemia e congestão vascular',
    sinonimos: ['vasos ingurgitados', 'congestão'],
    categoria: 'circulatorio',
    resumo:
      'Vasos dilatados e abarrotados de hemácias. Hiperemia é ativa (mais sangue chega, na inflamação); congestão é passiva (o sangue não consegue sair).',
    comoReconhecer: [
      'No pequeno aumento: pontos e trajetos vermelho-vivos numerosos, maiores que o calibre habitual dos vasos da região.',
      'No médio aumento: capilares e vênulas com a luz inteiramente cheia de hemácias, empilhadas.',
      'Na congestão crônica: hemácias extravasadas e macrófagos com hemossiderina (pigmento marrom-dourado) ao redor.',
    ],
    mecanismo: [
      'Hiperemia: mediadores vasoativos (histamina, óxido nítrico, prostaglandinas) relaxam as arteríolas e aumentam o fluxo — o "rubor" e o "calor" da inflamação.',
      'Congestão: obstrução do retorno venoso (trombose, compressão, insuficiência cardíaca) represa o sangue nos capilares; a hipóxia local pode evoluir para necrose.',
    ],
    significado: [
      'Na inflamação aguda, acompanha o edema e a saída de neutrófilos.',
      'Congestão com necrose hemorrágica sugere obstrução venosa (torção, volvo, infarto venoso).',
    ],
    ondeOcorre: ['Inflamação aguda de qualquer órgão', 'Congestão hepática ("fígado em noz-moscada")', 'Congestão pulmonar da insuficiência cardíaca'],
    armadilhas: [
      'Hemácias fora dos vasos por corte cirúrgico (artefato) não têm pigmento nem reação ao redor e ficam nas bordas da peça.',
    ],
  },
  {
    id: 'abscesso',
    nome: 'Abscesso',
    sinonimos: ['microabscesso', 'coleção purulenta', 'pus'],
    categoria: 'inflamacao',
    resumo:
      'Coleção localizada de pus — neutrófilos vivos e mortos, restos celulares e tecido liquefeito — que destrói a arquitetura do órgão.',
    comoReconhecer: [
      'No pequeno aumento: área densa, arroxeada, em que a arquitetura normal desapareceu; às vezes com centro mais pálido (liquefeito).',
      'No médio aumento: lençóis compactos de células inflamatórias sem nenhum tecido de sustentação entre elas.',
      'No grande aumento: neutrófilos íntegros e degenerados, poeira nuclear, fibrina; ao redor, com o tempo, uma cápsula de tecido de granulação e fibrose.',
    ],
    mecanismo: [
      'Bactérias piogênicas (estafilococos, estreptococos, entéricas) atraem neutrófilos em massa.',
      'As enzimas lisossomais liberadas pelos neutrófilos digerem o próprio tecido: é a necrose liquefativa.',
      'O organismo cerca a coleção com tecido de granulação, que pode isolá-la — daí a necessidade de drenagem.',
    ],
    significado: [
      'Indica infecção bacteriana estabelecida com destruição tecidual.',
      'No apêndice, o abscesso parietal ou periapendicular sinaliza fase avançada, com risco de perfuração e peritonite.',
    ],
    ondeOcorre: ['Apendicite supurativa e perfurada', 'Abscessos hepáticos e pulmonares', 'Pele (furúnculo)', 'Criptas do cólon (abscesso de cripta na colite ulcerativa)'],
    armadilhas: [
      'Infiltrado linfoide denso (folículos) também é "roxo e cheio", mas é formado por linfócitos monótonos, redondos, com centros germinativos organizados — não por neutrófilos e necrose.',
    ],
  },
  {
    id: 'hiperplasia-linfoide-reativa',
    nome: 'Hiperplasia linfoide reativa',
    sinonimos: ['hiperplasia folicular', 'folículos com centros germinativos proeminentes'],
    categoria: 'inflamacao',
    resumo:
      'Folículos linfoides aumentados, com centros germinativos grandes e claros cheios de células ativadas e macrófagos de corpos tingíveis — resposta imune benigna a um estímulo.',
    comoReconhecer: [
      'No pequeno aumento: nódulos azul-escuros grandes, com centro mais claro, ocupando a mucosa/submucosa ou o córtex do linfonodo.',
      'No médio aumento: centro germinativo polarizado (zona escura e zona clara) cercado por uma coroa de linfócitos pequenos (zona do manto).',
      'No grande aumento: centroblastos e centrócitos misturados a macrófagos com restos apoptóticos ("céu estrelado") e mitoses.',
    ],
    mecanismo: [
      'Antígenos (virais, bacterianos) apresentados às células B no folículo desencadeiam a reação do centro germinativo: proliferação, hipermutação somática e seleção.',
      'As células que não são selecionadas morrem por apoptose e são fagocitadas pelos macrófagos de corpos tingíveis.',
    ],
    significado: [
      'Benigna e reativa. No apêndice de crianças e adolescentes, pode estreitar a luz e desencadear a obstrução da apendicite.',
      'Distingue-se do linfoma folicular por folículos de tamanhos variados, polarização, macrófagos de corpos tingíveis e mitoses — que o linfoma folicular não tem.',
    ],
    ondeOcorre: ['Apêndice (infecções virais)', 'Linfonodos reativos', 'Tonsilas', 'Gastrite por H. pylori (folículos linfoides na mucosa gástrica)'],
    armadilhas: [
      'Folículos linfoides fazem parte do apêndice normal: só se fala em hiperplasia quando estão claramente aumentados e com centros germinativos exuberantes.',
    ],
  },
  {
    id: 'tecido-de-granulacao',
    nome: 'Tecido de granulação',
    sinonimos: ['granulação', 'neovascularização'],
    categoria: 'reparo',
    resumo:
      'Tecido de reparo jovem: muitos capilares novos, orientados perpendicularmente à superfície, entre fibroblastos ativados, edema e células inflamatórias.',
    comoReconhecer: [
      'No pequeno aumento: faixa rosa-pálida, frouxa, na base de uma úlcera ou ao redor de uma área de necrose.',
      'No médio aumento: capilares de parede fina, de luz aberta, em paralelo e subindo em direção à superfície.',
      'No grande aumento: endotélio volumoso, fibroblastos fusiformes ou estrelados, macrófagos, linfócitos e plasmócitos; colágeno ainda escasso.',
    ],
    mecanismo: [
      'Macrófagos e plaquetas liberam VEGF, PDGF, FGF e TGF-β: os vasos brotam a partir dos existentes (angiogênese) e os fibroblastos migram e proliferam.',
      'Ao longo de semanas, o tecido deposita colágeno, perde vasos e células e amadurece em cicatriz.',
    ],
    significado: [
      'Indica reparo em curso — lesão com dias a semanas de evolução.',
      'Em excesso, forma o "granuloma piogênico" (proliferação capilar exuberante).',
    ],
    ondeOcorre: ['Base de úlceras', 'Borda de infartos a partir de ~1 semana', 'Cicatrização de feridas', 'Parede de abscessos'],
    armadilhas: [
      'Não é "granuloma": o nome confunde, mas granuloma é agregado de macrófagos epitelioides, algo completamente diferente.',
    ],
  },
  {
    id: 'abscesso-de-cripta',
    nome: 'Abscesso de cripta (criptite)',
    sinonimos: ['criptite', 'abscesso críptico'],
    categoria: 'inflamacao',
    resumo:
      'Neutrófilos dentro da luz de uma cripta intestinal (abscesso de cripta) ou infiltrando seu epitélio (criptite) — marca de atividade na colite.',
    comoReconhecer: [
      'No médio aumento: uma cripta com a luz "suja", cheia de pontos escuros, em vez de muco claro.',
      'No grande aumento: neutrófilos (núcleos segmentados) e restos celulares na luz; o epitélio da cripta pode estar achatado ou destruído.',
    ],
    mecanismo: [
      'Na colite ativa, o epitélio e os macrófagos liberam IL-8 e outros quimioatraentes; os neutrófilos atravessam o epitélio da cripta e se acumulam na luz.',
      'As proteases dos neutrófilos destroem a cripta; várias criptas destruídas confluem em úlceras.',
    ],
    significado: [
      'Indica colite ATIVA — mas não é específico: ocorre na colite ulcerativa, na doença de Crohn e nas colites infecciosas.',
      'O que aponta para doença inflamatória intestinal crônica é a combinação com distorção das criptas e plasmocitose basal.',
    ],
    ondeOcorre: ['Colite ulcerativa ativa', 'Doença de Crohn', 'Colites infecciosas (Salmonella, Shigella, Campylobacter)', 'Diverticulite'],
    armadilhas: ['Muco com células descamadas na luz não é abscesso: procure núcleos segmentados de neutrófilos.'],
  },
  {
    id: 'distorcao-arquitetural-das-criptas',
    nome: 'Distorção arquitetural das criptas',
    sinonimos: ['criptas ramificadas', 'atrofia de criptas', 'distorção de criptas'],
    categoria: 'arquitetura',
    resumo:
      'Criptas ramificadas, encurtadas, de tamanhos e orientações variados e mais espaçadas — cicatriz de episódios repetidos de destruição e regeneração.',
    comoReconhecer: [
      'No pequeno aumento: a mucosa perde o aspecto de "fileira de tubos de ensaio" paralelos e iguais.',
      'Criptas ramificadas (em "Y"), dilatadas, tortuosas ou que não alcançam a muscular da mucosa (encurtamento), com lâmina própria mais ampla entre elas.',
    ],
    mecanismo: [
      'Cada surto de colite destrói criptas; na regeneração, as criptas se refazem de forma desordenada — ramificam e se encurtam.',
      'Por isso a distorção só aparece com semanas a meses de doença: é marca de CRONICIDADE.',
    ],
    significado: [
      'É o que separa a doença inflamatória intestinal crônica (colite ulcerativa, Crohn) de uma colite infecciosa aguda, que preserva a arquitetura.',
    ],
    ondeOcorre: ['Colite ulcerativa', 'Doença de Crohn', 'Colite crônica por radiação ou isquemia (menos intensa)'],
    armadilhas: [
      'Criptas cortadas obliquamente parecem ramificadas; perto de folículos linfoides e no reto distal a arquitetura é normalmente menos regular.',
    ],
  },
  {
    id: 'infiltrado-linfoplasmocitario',
    nome: 'Infiltrado linfoplasmocitário da lâmina própria (plasmocitose basal)',
    sinonimos: ['plasmocitose basal', 'inflamação crônica', 'infiltrado mononuclear'],
    categoria: 'inflamacao',
    resumo:
      'Lâmina própria expandida por linfócitos e plasmócitos, que ocupam inclusive o espaço entre a base das criptas e a muscular da mucosa (plasmocitose basal).',
    comoReconhecer: [
      'A lâmina própria, normalmente frouxa e com poucas células, fica "cheia" de núcleos redondos e escuros.',
      'Plasmócitos: núcleo excêntrico com cromatina "em roda de carroça" e halo claro perinuclear (Golgi); linfócitos: núcleo redondo, pequeno, sem citoplasma visível.',
      'Plasmocitose basal: essas células se acumulam logo acima da muscular da mucosa, afastando as criptas dela.',
    ],
    mecanismo: [
      'A resposta imune crônica contra antígenos luminais (microbiota) em hospedeiro geneticamente predisposto mantém linfócitos T e plasmócitos na mucosa.',
    ],
    significado: [
      'Sinal de inflamação CRÔNICA; a plasmocitose basal é um dos achados mais precoces e úteis para diagnosticar doença inflamatória intestinal.',
    ],
    ondeOcorre: ['Colite ulcerativa e doença de Crohn', 'Gastrite crônica', 'Endometrite crônica (plasmócitos no estroma)'],
    armadilhas: ['A lâmina própria do cólon normal tem alguns plasmócitos na metade superior: o anormal é a expansão e a posição basal.'],
  },
  {
    id: 'pseudopolipo-inflamatorio',
    nome: 'Pseudopólipo inflamatório',
    sinonimos: ['pólipo inflamatório', 'pseudopólipo'],
    categoria: 'arquitetura',
    resumo:
      'Ilha de mucosa preservada ou regenerada que fica em relevo entre áreas ulceradas — parece um pólipo, mas não é neoplasia.',
    comoReconhecer: [
      'No pequeno aumento: uma projeção de mucosa com criptas, cercada de ambos os lados por áreas sem mucosa (úlceras).',
      'As criptas da ilha são inflamadas e distorcidas, sem displasia.',
    ],
    mecanismo: ['Úlceras extensas destroem a mucosa em volta; o que sobra (ou regenera) fica mais alto que o fundo das úlceras vizinhas.'],
    significado: ['Marca de colite grave, atual ou passada; comum na colite ulcerativa extensa. Não tem potencial maligno próprio.'],
    ondeOcorre: ['Colite ulcerativa', 'Doença de Crohn', 'Outras colites ulceradas graves'],
    armadilhas: ['Precisa ser diferenciado de adenoma e de displasia associada à colite: não há núcleos displásicos.'],
  },
  {
    id: 'granuloma-epitelioide',
    nome: 'Granuloma epitelioide não caseoso',
    sinonimos: ['granuloma', 'granuloma não necrotizante', 'granuloma sarcoídico'],
    categoria: 'inflamacao',
    resumo:
      'Agregado compacto e arredondado de macrófagos epitelioides — células de citoplasma rosa-pálido, bordas indistintas e núcleo alongado "em sola de sapato" —, às vezes com células gigantes, cercado por uma coroa de linfócitos, sem necrose central.',
    comoReconhecer: [
      'No pequeno aumento: nódulo pálido, arredondado, bem delimitado, geralmente dentro ou ao lado de um infiltrado linfoide mais escuro.',
      'No grande aumento: células grandes, de citoplasma eosinofílico pálido e limites mal definidos, com núcleos ovais ou alongados e cromatina fina, dispostas em redemoinho.',
      'Pode haver células gigantes multinucleadas (tipo Langhans, com núcleos em ferradura na periferia, ou tipo corpo estranho).',
      'Não caseoso: o centro não tem necrose granular eosinofílica — isso separa Crohn e sarcoidose da tuberculose.',
    ],
    mecanismo: [
      'Um antígeno que o macrófago não consegue eliminar (micobactéria, fungo, corpo estranho ou, no Crohn, antígeno ainda indefinido) mantém a resposta Th1.',
      'Linfócitos T CD4 secretam IFN-γ, que transforma macrófagos em células epitelioides; TNF mantém o agregado organizado.',
      'Macrófagos se fundem em células gigantes multinucleadas; linfócitos formam o manto ao redor.',
    ],
    significado: [
      'Define a inflamação granulomatosa. No intestino, granulomas não caseosos sem agente identificável são o achado mais específico da doença de Crohn (presentes em cerca de metade dos casos).',
      'Com necrose caseosa central, pense primeiro em tuberculose; sempre descarte infecção (colorações para micobactérias e fungos).',
      'Explica por que bloqueadores de TNF funcionam no Crohn — e por que reativam tuberculose latente.',
    ],
    ondeOcorre: ['Doença de Crohn', 'Sarcoidose', 'Tuberculose (com caseose)', 'Infecções fúngicas', 'Reação a corpo estranho', 'Yersinia, esquistossomose'],
    armadilhas: [
      'Centro germinativo de folículo linfoide também é um nódulo pálido dentro de linfócitos, mas tem centroblastos, mitoses e macrófagos de corpos tingíveis, e é polarizado.',
      'Granuloma em torno de uma cripta rota (reação ao muco extravasado) não tem o mesmo valor diagnóstico — ocorre também na colite ulcerativa.',
    ],
  },
  {
    id: 'agregados-linfoides-transmurais',
    nome: 'Agregados linfoides transmurais',
    sinonimos: ['inflamação transmural', 'rosário de Crohn', 'agregados linfoides na subserosa'],
    categoria: 'inflamacao',
    resumo:
      'Nódulos de linfócitos espalhados por toda a espessura da parede — submucosa, entre os feixes da muscular própria e na subserosa —, como contas de um rosário.',
    comoReconhecer: [
      'No pequeno aumento: pontos azul-escuros enfileirados ao longo da face externa da muscular própria e na subserosa, longe da mucosa.',
      'No médio aumento: agregados de linfócitos pequenos, às vezes com centro germinativo, entre fibras musculares lisas ou no tecido adiposo subseroso.',
    ],
    mecanismo: [
      'A inflamação do Crohn não respeita a mucosa: linfócitos se acumulam ao longo de linfáticos e vasos que atravessam toda a parede.',
      'Essa transmuralidade é o que leva a fibrose de toda a parede (estenoses), fissuras, fístulas e aderências.',
    ],
    significado: [
      'Um dos critérios mais úteis para separar Crohn (transmural) de colite ulcerativa (restrita à mucosa, exceto na colite fulminante).',
    ],
    ondeOcorre: ['Doença de Crohn', 'Diverticulite crônica (localizada)'],
    armadilhas: ['Linfonodos pequenos e folículos normais da submucosa do íleo (placas de Peyer) não são inflamação transmural.'],
  },
  {
    id: 'fibrose-da-submucosa',
    nome: 'Espessamento fibroso da submucosa',
    sinonimos: ['fibrose submucosa', 'estenose fibrosa'],
    categoria: 'reparo',
    resumo:
      'Submucosa alargada por tecido conjuntivo frouxo a denso, fibroblastos, edema e células inflamatórias crônicas — a base da estenose intestinal.',
    comoReconhecer: [
      'No pequeno aumento: a faixa pálida entre a mucosa e a muscular própria está muito mais larga que o habitual.',
      'No médio e grande aumento: colágeno desorganizado, fibroblastos, pequenos vasos, linfócitos e plasmócitos; às vezes hiperplasia de nervos e da muscular da mucosa.',
    ],
    mecanismo: [
      'A inflamação crônica ativa fibroblastos e miofibroblastos (TGF-β, IL-13), que depositam colágeno; a parede endurece e o lúmen estreita.',
    ],
    significado: ['Explica a obstrução intestinal do Crohn ileal: a estenose é fibrosa e não responde ao anti-inflamatório — muitas vezes exige ressecção.'],
    ondeOcorre: ['Doença de Crohn', 'Enterite actínica', 'Isquemia crônica'],
    armadilhas: ['Edema puro (sem colágeno novo) também alarga a submucosa, sobretudo em peças fixadas tardiamente.'],
  },
  {
    id: 'helicobacter-pylori',
    nome: 'Helicobacter pylori',
    sinonimos: ['H. pylori', 'bacilos curvos', 'espirilos'],
    categoria: 'agente',
    resumo:
      'Bacilos curvos ou em forma de S, de 2–4 µm, no muco sobre o epitélio foveolar e dentro das fovéolas — pequenos demais para o H&E em aumento de varredura; confirmados com Giemsa ou imuno-histoquímica.',
    comoReconhecer: [
      'Em H&E, só na objetiva de imersão e com boa fixação: bastonetes finos e levemente azulados no muco da superfície, "em cardume".',
      'No Giemsa (azul) ou na imuno-histoquímica (marrom) ficam evidentes sobre o epitélio.',
      'Estão no muco, junto à superfície — não invadem a mucosa.',
    ],
    mecanismo: [
      'A urease converte ureia em amônia e cria um microambiente neutro; os flagelos e a forma espiral permitem atravessar o muco.',
      'Adesinas (BabA) fixam a bactéria ao epitélio; CagA e VacA lesam as células e disparam IL-8 — daí os neutrófilos (atividade).',
    ],
    significado: [
      'Causa mais comum de gastrite crônica no mundo e fator etiológico da úlcera péptica, do adenocarcinoma gástrico e do linfoma MALT.',
      'Erradicar a bactéria cura a gastrite ativa, previne recidiva da úlcera e pode regredir o linfoma MALT de baixo grau.',
    ],
    ondeOcorre: ['Antro e corpo gástrico', 'Metaplasia gástrica no bulbo duodenal'],
    armadilhas: [
      'Bactérias contaminantes da superfície e restos de muco podem imitar H. pylori em H&E.',
      'Após uso de inibidor de bomba de prótons, a bactéria migra para o corpo e diminui no antro: biópsias de ambos os lugares.',
    ],
  },
  {
    id: 'hemorragia-intersticial',
    nome: 'Hemorragia intersticial',
    sinonimos: ['hemorragia', 'extravasamento de hemácias', 'infarto hemorrágico'],
    categoria: 'circulatorio',
    resumo:
      'Hemácias fora dos vasos, espalhadas entre as células e fibras do tecido — sem parede vascular ao redor.',
    comoReconhecer: [
      'No pequeno aumento: manchas vermelho-vivas de contorno irregular, que não seguem o trajeto de um vaso.',
      'No grande aumento: lagos de hemácias dissecando o interstício, sem endotélio nem parede em volta.',
      'Hemorragias antigas deixam macrófagos com hemossiderina (pigmento marrom-dourado).',
    ],
    mecanismo: [
      'A isquemia e a inflamação lesam a parede dos capilares; quando o fluxo retorna (reperfusão) ou a pressão persiste, o sangue sai para o interstício.',
    ],
    significado: [
      'No infarto do miocárdio, a hemorragia é mais intensa quando houve reperfusão (trombólise, angioplastia).',
      'Em órgãos de circulação dupla ou venosa frouxa (pulmão, intestino), o infarto é tipicamente hemorrágico.',
    ],
    ondeOcorre: ['Infartos reperfundidos', 'Infarto pulmonar e intestinal', 'Traumatismos', 'Vasculites'],
    armadilhas: ['Vaso congesto cortado obliquamente também parece um lago de hemácias — procure a parede endotelial.'],
  },
  {
    id: 'fibrose-cicatricial',
    nome: 'Fibrose cicatricial (cicatriz)',
    sinonimos: ['cicatriz', 'fibrose de substituição', 'colagenização'],
    categoria: 'reparo',
    resumo:
      'Tecido destruído substituído por colágeno denso, rosa e pobre em células — o fim do reparo quando o tecido não se regenera.',
    comoReconhecer: [
      'No pequeno aumento: áreas homogêneas, rosa-pálidas, sem a textura do tecido original.',
      'No grande aumento: feixes de colágeno ondulados com poucos fibroblastos de núcleo fino e alongado; poucos vasos.',
      'Na borda, ilhas do tecido original presas na fibrose.',
    ],
    mecanismo: [
      'Quando as células do tecido não se dividem (cardiomiócito, neurônio) ou a arquitetura de suporte foi destruída, o tecido de granulação amadurece em colágeno: vasos e células regridem, fica a matriz.',
      'Leva semanas a meses: no miocárdio, a cicatriz está formada por volta de 6–8 semanas.',
    ],
    significado: [
      'Registro permanente de uma lesão antiga. No coração, a cicatriz não contrai (hipocinesia), pode se dilatar (aneurisma ventricular) e é substrato de arritmias.',
    ],
    ondeOcorre: ['Infarto do miocárdio antigo', 'Cicatrizes cutâneas', 'Fibrose de órgãos após inflamação crônica'],
    armadilhas: ['Fibrose intersticial difusa (hipertensão, cardiomiopatias) é diferente da cicatriz em bloco do infarto.'],
  },
  {
    id: 'celula-gigante-de-langhans',
    nome: 'Célula gigante de Langhans',
    sinonimos: ['célula gigante multinucleada', 'célula de Langhans'],
    categoria: 'inflamacao',
    resumo:
      'Célula enorme, formada pela fusão de macrófagos, com dezenas de núcleos dispostos na periferia em ferradura ou coroa e citoplasma eosinofílico abundante no centro.',
    comoReconhecer: [
      'No médio aumento: "manchas" grandes, rosadas, na borda dos granulomas.',
      'No grande aumento: muitos núcleos ovais enfileirados em arco na periferia da célula, como uma ferradura.',
      'A célula gigante de corpo estranho, ao contrário, tem os núcleos espalhados de forma desordenada e às vezes contém o material estranho.',
    ],
    mecanismo: ['IFN-γ e outras citocinas induzem a fusão de macrófagos ativados diante de um antígeno persistente e difícil de digerir.'],
    significado: [
      'Faz parte do granuloma imune — típico da tuberculose, mas não exclusivo (sarcoidose, hanseníase, fungos, Crohn).',
      'Não confundir com a célula de Langerhans (célula dendrítica da epiderme) — nomes parecidos, células completamente diferentes.',
    ],
    ondeOcorre: ['Tuberculose', 'Sarcoidose', 'Hanseníase tuberculoide', 'Infecções fúngicas'],
    armadilhas: ['Megacariócitos da medula e sinciciotrofoblasto também são multinucleados, em outros contextos.'],
  },
  {
    id: 'eosinofilos-teciduais',
    nome: 'Eosinófilos no tecido',
    sinonimos: ['eosinofilia tecidual', 'infiltrado eosinofílico'],
    categoria: 'inflamacao',
    resumo:
      'Eosinófilos fora do sangue, no tecido: células com núcleo bilobado e citoplasma cheio de grânulos vermelho-alaranjados intensos.',
    comoReconhecer: ['No grande aumento: grânulos eosinofílicos grosseiros e brilhantes que "acendem" em vermelho; núcleo com dois lóbulos em óculos.'],
    mecanismo: ['Recrutados por IL-5, eotaxina e outras citocinas — em alergias, parasitoses e em alguns tumores (as células de Reed-Sternberg secretam IL-5).'],
    significado: [
      'Sugere alergia, parasitose, reação a drogas ou esofagite eosinofílica; no linfonodo, fundo misto com eosinófilos é típico do linfoma de Hodgkin.',
    ],
    ondeOcorre: ['Linfoma de Hodgkin', 'Parasitoses (esquistossomose)', 'Alergias e asma', 'Esofagite eosinofílica', 'Reações a drogas'],
    armadilhas: ['Neutrófilos têm grânulos finos e pálidos e núcleo com 3–5 lóbulos.'],
  },
  {
    id: 'corpusculo-de-aschoff',
    nome: 'Corpúsculo (nódulo) de Aschoff',
    sinonimos: ['nódulo de Aschoff', 'células de Anitschkow', 'células em lagarta'],
    categoria: 'inflamacao',
    resumo:
      'Lesão patognomônica da cardite reumática aguda: foco de necrose fibrinoide do colágeno cercado por linfócitos, plasmócitos e macrófagos ativados (células de Anitschkow, de cromatina "em lagarta", e células de Aschoff multinucleadas).',
    comoReconhecer: [
      'Nódulos pequenos no interstício do miocárdio, geralmente perivasculares, ou no endocárdio e no pericárdio.',
      'Células de Anitschkow: núcleo com a cromatina condensada numa faixa central ondulada ("lagarta" em corte longitudinal, "olho de coruja" em corte transversal).',
    ],
    mecanismo: [
      'Mimetismo molecular: anticorpos e linfócitos T dirigidos contra a proteína M do estreptococo β-hemolítico do grupo A reagem com a miosina e proteínas da válvula (2–3 semanas após faringite).',
    ],
    significado: [
      'Diagnóstico de cardite reumática ATIVA (pancardite: endocardite, miocardite, pericardite).',
      'Some com o tempo, substituído por fibrose: na doença crônica raramente é encontrado.',
    ],
    ondeOcorre: ['Febre reumática aguda'],
    armadilhas: ['Células de Anitschkow isoladas aparecem em outras miocardites e até em corações normais; o diagnóstico exige o nódulo com necrose fibrinoide.'],
  },
  {
    id: 'neovascularizacao-valvar',
    nome: 'Neovascularização da válvula',
    sinonimos: ['vasos no folheto valvar', 'vascularização valvar'],
    categoria: 'reparo',
    resumo:
      'Vasos sanguíneos, muitas vezes de parede espessa, dentro do folheto de uma valva cardíaca — que normalmente é avascular e nutrida por difusão.',
    comoReconhecer: ['Arteríolas e capilares, com parede muscular ou hialina, espalhados no colágeno do folheto, acompanhados de linfócitos.'],
    mecanismo: ['A inflamação repetida (cardite reumática) e a fibrose espessam o folheto além do alcance da difusão; vasos crescem a partir da base do anel valvar.'],
    significado: ['Marca de valvulite crônica, especialmente reumática; os vasos de parede espessa são típicos da valvopatia reumática antiga.'],
    ondeOcorre: ['Cardiopatia reumática crônica', 'Endocardite infecciosa cicatrizada', 'Valvopatias degenerativas avançadas (menos)'],
    armadilhas: ['Vasos na base do folheto, junto ao anel, podem ser normais; o significativo é encontrá-los ao longo do folheto.'],
  },
  {
    id: 'inflamacao-portal-linfoide',
    nome: 'Inflamação portal linfocitária (com agregados)',
    sinonimos: ['hepatite portal', 'agregados linfoides portais', 'triadite'],
    categoria: 'inflamacao',
    resumo:
      'Espaços-porta alargados por linfócitos (e alguns plasmócitos), às vezes formando agregados ou folículos linfoides — o componente portal da hepatite crônica.',
    comoReconhecer: [
      'No pequeno aumento: espaços-porta que viraram manchas azul-escuras, maiores que os vizinhos.',
      'No médio aumento: linfócitos densos ao redor do ducto biliar, da artéria e da veia porta; na hepatite C, agregados nodulares e ducto biliar lesado são típicos.',
    ],
    mecanismo: ['Linfócitos T específicos contra antígenos virais (ou autoantígenos) se acumulam no espaço-porta e atacam os hepatócitos vizinhos.'],
    significado: [
      'Característica da hepatite crônica viral (sobretudo C) e autoimune; também de doenças biliares.',
      'Agregados linfoides portais com lesão do ducto biliar, esteatose e atividade lobular leve formam a tríade clássica da hepatite C.',
    ],
    ondeOcorre: ['Hepatite C e B crônicas', 'Hepatite autoimune', 'Colangite biliar primária', 'Hepatite por drogas'],
    armadilhas: ['Alguns linfócitos portais são normais no adulto; o anormal é a expansão do espaço-porta.'],
  },
  {
    id: 'hepatite-de-interface',
    nome: 'Hepatite de interface (necrose em saca-bocado)',
    sinonimos: ['piecemeal necrosis', 'necrose em saca-bocado', 'atividade periportal'],
    categoria: 'inflamacao',
    resumo:
      'Linfócitos que ultrapassam a placa limitante do espaço-porta e invadem o parênquima, cercando e destruindo hepatócitos da periferia do lóbulo.',
    comoReconhecer: [
      'A borda nítida entre o espaço-porta e os hepatócitos se torna irregular e "mordida".',
      'Hepatócitos isolados ou em pequenos grupos, envoltos por linfócitos, na interface porta-parênquima.',
    ],
    mecanismo: ['Linfócitos T citotóxicos matam hepatócitos periportais por apoptose; a destruição repetida da interface estimula fibrose que parte do espaço-porta.'],
    significado: [
      'Mede a atividade (grau) da hepatite crônica; quanto mais intensa, maior a chance de progressão para fibrose e cirrose.',
      'Muito intensa e com plasmócitos: sugere hepatite autoimune.',
    ],
    ondeOcorre: ['Hepatites crônicas virais e autoimunes', 'Hepatite por drogas'],
    armadilhas: ['Cortes tangenciais do espaço-porta podem imitar interface irregular.'],
  },
  {
    id: 'exsudato-alveolar-neutrofilico',
    nome: 'Exsudato alveolar neutrofílico (consolidação)',
    sinonimos: ['consolidação', 'hepatização', 'alvéolos cheios de pus', 'exsudato intra-alveolar'],
    categoria: 'inflamacao',
    resumo:
      'Alvéolos preenchidos por neutrófilos, fibrina, hemácias e macrófagos no lugar do ar — o pulmão fica sólido ("hepatizado"), mas as paredes alveolares continuam íntegras.',
    comoReconhecer: [
      'No pequeno aumento: o pulmão perde o aspecto rendado e fica compacto e arroxeado; os septos continuam desenhando os alvéolos.',
      'No grande aumento: dentro de cada alvéolo, lençóis de neutrófilos (núcleos segmentados) presos em fibrina rosa; hemácias nas fases iniciais, macrófagos na resolução.',
    ],
    mecanismo: [
      'Bactérias que alcançam os alvéolos (pneumococo, Haemophilus, Klebsiella, Staphylococcus) ativam macrófagos alveolares, que recrutam neutrófilos.',
      'Capilares septais congestos deixam sair plasma, fibrinogênio e hemácias; o exsudato preenche os alvéolos e se espalha pelos poros de Kohn.',
    ],
    significado: [
      'É a lesão da pneumonia bacteriana. Como a arquitetura septal é preservada, a pneumonia lobar costuma se resolver sem cicatriz.',
      'Fases da pneumonia lobar: congestão (dia 1–2), hepatização vermelha (hemácias + neutrófilos + fibrina, dias 2–4), hepatização cinzenta (fibrina e neutrófilos degenerando, dias 4–8) e resolução.',
    ],
    ondeOcorre: ['Pneumonia lobar', 'Broncopneumonia', 'Pneumonia aspirativa'],
    armadilhas: [
      'Edema pulmonar também enche os alvéolos, mas com líquido rosa homogêneo e poucas células.',
      'Hemorragia alveolar: hemácias sem neutrófilos nem fibrina organizada.',
    ],
  },
  {
    id: 'exsudato-espumoso-alveolar',
    nome: 'Exsudato alveolar espumoso (em favo de mel)',
    sinonimos: ['exsudato espumoso', 'exsudato em favo de mel', 'cast espumoso'],
    categoria: 'agente',
    resumo:
      'Alvéolos preenchidos por material eosinofílico espumoso, com pequenas bolhas claras ("favo de mel"), quase sem neutrófilos — os agregados de Pneumocystis jirovecii e restos celulares.',
    comoReconhecer: [
      'No pequeno aumento: alvéolos com um conteúdo rosa, "rendado", que não é líquido homogêneo (edema) nem células (pneumonia bacteriana).',
      'No grande aumento: textura espumosa com pontinhos; os microrganismos (4–6 µm) aparecem na prata de Grocott como cistos em forma de xícara ou uva-passa.',
      'Septos levemente espessados por linfócitos e pneumócitos tipo II reativos.',
    ],
    mecanismo: [
      'Pneumocystis jirovecii (fungo) se multiplica na superfície alveolar quando falta imunidade celular (CD4 < 200/µL).',
      'O exsudato é formado pelos próprios organismos, surfactante e restos de células, com pouca resposta neutrofílica.',
    ],
    significado: [
      'Praticamente diagnóstico de pneumocistose; confirmar com Grocott ou imunofluorescência. Doença definidora de aids.',
    ],
    ondeOcorre: ['Pneumonia por Pneumocystis (aids, transplantados, quimioterapia, corticoide em altas doses)'],
    armadilhas: ['Edema e proteinose alveolar também enchem alvéolos de material rosa; o edema é homogêneo, a proteinose é granular e PAS+ sem espuma.'],
  },
  {
    id: 'membranas-hialinas',
    nome: 'Membranas hialinas',
    sinonimos: ['membrana hialina', 'dano alveolar difuso exsudativo'],
    categoria: 'lesao-celular',
    resumo:
      'Faixas eosinofílicas densas e homogêneas que revestem as paredes dos alvéolos e ductos alveolares — proteínas plasmáticas e restos de pneumócitos necróticos.',
    comoReconhecer: ['Tiras rosa-vivo, vítreas, coladas à superfície interna dos alvéolos, acompanhando o contorno dos septos.'],
    mecanismo: [
      'Lesão difusa do endotélio capilar e dos pneumócitos tipo I (sepse, choque, pneumonia grave, aspiração, drogas, vírus) deixa sair plasma rico em fibrinogênio.',
      'Fibrina e restos celulares se depositam sobre a membrana basal desnuda, formando as membranas.',
    ],
    significado: [
      'Marca da fase exsudativa (primeira semana) do dano alveolar difuso, correlato histológico da síndrome do desconforto respiratório agudo (SDRA).',
      'Na fase organizante (após a primeira semana), sobram restos de membrana, com fibroblastos e hiperplasia de pneumócitos tipo II.',
    ],
    ondeOcorre: ['Dano alveolar difuso/SDRA', 'Doença da membrana hialina do recém-nascido prematuro', 'Pneumonias virais graves (influenza, COVID-19)'],
    armadilhas: ['Fibrina solta dentro dos alvéolos (pneumonia) não reveste as paredes como uma membrana.'],
  },
  {
    id: 'hiperplasia-de-pneumocitos-tipo-ii',
    nome: 'Hiperplasia de pneumócitos tipo II',
    sinonimos: ['pneumócitos reativos', 'hiperplasia pneumocitária'],
    categoria: 'reparo',
    resumo:
      'Revestimento alveolar formado por células cúbicas, volumosas, em fileira contínua ("em tacha"), com núcleos grandes e nucléolos — reepitelização após lesão.',
    comoReconhecer: ['Células cúbicas salientes, lado a lado, revestindo alvéolos cujo epitélio normal seria plano e quase invisível.'],
    mecanismo: ['Os pneumócitos tipo II são as células-tronco do alvéolo: proliferam para cobrir a membrana basal desnuda e depois se diferenciam em tipo I.'],
    significado: ['Sinal de lesão alveolar em reparo (dano alveolar difuso organizante, pneumonias virais). A atipia reativa pode imitar neoplasia.'],
    ondeOcorre: ['Dano alveolar difuso organizante', 'Pneumonias virais e por Pneumocystis', 'Fibrose pulmonar'],
    armadilhas: ['Não confundir com adenocarcinoma in situ, que tem atipia monótona e transição abrupta com alvéolos normais.'],
  },
  {
    id: 'pneumonite-intersticial-cronica',
    nome: 'Inflamação intersticial crônica (septos alveolares alargados)',
    sinonimos: ['pneumonite intersticial', 'infiltrado intersticial linfocitário', 'septos espessados'],
    categoria: 'inflamacao',
    resumo:
      'Septos alveolares alargados por linfócitos e plasmócitos, com os alvéolos relativamente vazios — a inflamação está NA PAREDE, não dentro do espaço aéreo.',
    comoReconhecer: [
      'No pequeno aumento: a "renda" pulmonar fica mais grossa e mais roxa, mas os alvéolos continuam abertos.',
      'No grande aumento: cada septo tem várias camadas de linfócitos e plasmócitos entre os capilares.',
    ],
    mecanismo: ['Resposta imune (antígenos inalados, vírus, autoimunidade, drogas) dirigida ao interstício, com recrutamento de linfócitos T.'],
    significado: [
      'Padrão das pneumonias "atípicas" (virais, Mycoplasma) e das doenças intersticiais: pneumonite de hipersensibilidade, pneumonia intersticial não específica, doenças do colágeno.',
      'Contrasta com a pneumonia bacteriana, em que o exsudato ocupa os alvéolos.',
    ],
    ondeOcorre: ['Pneumonite de hipersensibilidade', 'Pneumonias virais e atípicas', 'Pneumonia intersticial não específica', 'Colagenoses'],
    armadilhas: ['Septos colapsados (atelectasia) parecem grossos e celulares; o infiltrado verdadeiro é de células inflamatórias, não capilares justapostos.'],
  },
  {
    id: 'corpos-de-masson',
    nome: 'Corpos de Masson (plugs de tecido de granulação intra-alveolar)',
    sinonimos: ['corpos de Masson', 'plugs fibroblásticos', 'pólipos de granulação intraluminais'],
    categoria: 'reparo',
    resumo:
      'Tampões de fibroblastos e miofibroblastos em matriz frouxa, pálida e mixoide, dentro de alvéolos, ductos alveolares e bronquíolos — o exsudato que não foi reabsorvido e está sendo organizado.',
    comoReconhecer: [
      'No médio aumento: estruturas alongadas ou arredondadas, pálidas, "em forma de serpente", ocupando espaços aéreos.',
      'No grande aumento: fibroblastos fusiformes ou estrelados em matriz azul-rosada frouxa, frequentemente com capilares; revestidos por pneumócitos e às vezes ligados à parede por um pedículo.',
      'Arquitetura pulmonar preservada ao redor, com inflamação intersticial leve.',
    ],
    mecanismo: [
      'Lesão alveolar deixa fibrina no espaço aéreo; em vez de ser digerida por macrófagos, ela é invadida por fibroblastos vindos da parede, como numa cicatrização.',
    ],
    significado: [
      'Define o padrão de pneumonia em organização — que pode ser criptogênica ou secundária (pneumonia infecciosa que não resolveu, drogas, colagenoses, radiação, aspiração, borda de tumores ou abscessos).',
      'Diferente da fibrose madura, é potencialmente reversível: responde bem a corticoides.',
    ],
    ondeOcorre: ['Pneumonia em organização (criptogênica ou secundária)', 'Pneumonias bacterianas não resolvidas', 'Pneumonite de hipersensibilidade', 'Periferia de massas pulmonares'],
    armadilhas: [
      'Focos fibroblásticos da PIU ficam no interstício, na interface com fibrose densa, não dentro dos espaços aéreos.',
      'Em biópsias por agulha de uma "massa", encontrar só pneumonia em organização não exclui tumor ao lado.',
    ],
  },
  {
    id: 'ovos-de-schistosoma',
    nome: 'Ovos de Schistosoma no tecido',
    sinonimos: ['ovos de esquistossoma', 'ovos com miracídio', 'ovos calcificados'],
    categoria: 'agente',
    resumo:
      'Ovos ovais grandes (cerca de 110–170 × 40–70 µm) com casca fina e refringente, contendo um embrião (miracídio) com vários núcleos quando viáveis, ou casca vazia, colapsada e calcificada quando mortos; a espícula (terminal no S. haematobium, lateral no S. mansoni) só aparece em alguns cortes.',
    comoReconhecer: [
      'No pequeno aumento: estruturas ovais rosadas e bem delimitadas no meio de inflamação, isoladas ou em grupos.',
      'No grande aumento: casca como um contorno refringente; dentro, o miracídio granular com núcleos. Ovos velhos: casca amassada, escura ou calcificada (azul-arroxeada).',
      'Procure a espícula: terminal (S. haematobium — bexiga) ou lateral (S. mansoni — intestino e fígado).',
    ],
    mecanismo: [
      'As fêmeas vivem nas veias (plexo vesical no S. haematobium; mesentéricas no S. mansoni) e põem centenas de ovos por dia.',
      'Parte dos ovos atravessa a parede para sair na urina ou nas fezes; muitos ficam presos no tecido, onde os antígenos que liberam induzem resposta Th2: eosinófilos, granulomas e fibrose.',
    ],
    significado: [
      'Achado diagnóstico da esquistossomose: a espécie é inferida pelo órgão e pela posição da espícula.',
      'A reação granulomatosa e fibrosante aos ovos — e não o verme — é que causa a doença: fibrose periportal (hipertensão portal) no S. mansoni; fibrose, calcificação da bexiga e carcinoma escamoso no S. haematobium.',
    ],
    ondeOcorre: ['Bexiga e ureter (S. haematobium)', 'Intestino, fígado e baço (S. mansoni — o do Brasil)', 'Pulmão (hipertensão pulmonar), SNC, genitais'],
    armadilhas: ['Ovos cortados de través podem parecer células gigantes ou corpos estranhos; a casca refringente e o miracídio definem o ovo.'],
  },
  {
    id: 'trofozoitos-de-giardia',
    nome: 'Trofozoítos de Giardia',
    sinonimos: ['Giardia lamblia', 'Giardia intestinalis', 'Giardia duodenalis'],
    categoria: 'agente',
    resumo:
      'Protozoários flagelados na luz do intestino delgado, junto à superfície das vilosidades: de perfil têm forma de foice ou folha curva; de frente são piriformes, com dois núcleos simétricos ("rosto com olhos").',
    comoReconhecer: [
      'No médio aumento: pontinhos cinza-azulados, em grupos, soltos no muco ou encostados na borda em escova.',
      'No grande aumento: estruturas de 10–15 µm em crescente, pálidas; de frente, pera com dois núcleos. Não invadem a mucosa.',
    ],
    mecanismo: [
      'Os cistos são ingeridos com água ou alimento contaminados; no duodeno liberam trofozoítos, que se prendem ao epitélio por um disco ventral.',
      'Não invadem: a lesão das microvilosidades e a reação imune causam má absorção de gorduras e dissacaridases.',
    ],
    significado: [
      'Diagnóstico de giardíase em biópsia duodenal — muitas vezes a mucosa é normal e só os parasitas denunciam a doença.',
      'Infecção persistente sugere deficiência de IgA ou imunodeficiência comum variável (procure falta de plasmócitos).',
    ],
    ondeOcorre: ['Duodeno e jejuno', 'Raramente estômago e cólon'],
    armadilhas: ['Muco e fragmentos de células descamadas imitam trofozoítos; procure a forma de foice regular e repetida e os pares de núcleos.'],
  },
  {
    id: 'atrofia-vilositaria',
    nome: 'Atrofia vilositária',
    sinonimos: ['achatamento das vilosidades', 'vilosidades curtas', 'mucosa plana'],
    categoria: 'adaptacao',
    resumo:
      'Vilosidades do intestino delgado mais curtas, largas ou ausentes, com criptas alongadas (hiperplásicas) — a relação vilo:cripta, normalmente de 3–5:1, cai.',
    comoReconhecer: [
      'No pequeno aumento: a mucosa perde os "dedos" altos e fica plana ou com vilos baixos e grossos.',
      'Compare a altura do vilo com a profundidade da cripta; conte linfócitos intraepiteliais (> 25 por 100 enterócitos sugere doença celíaca).',
    ],
    mecanismo: ['Lesão do epitélio da superfície acelera a perda de enterócitos; as criptas proliferam para repor, mas os vilos encurtam.'],
    significado: [
      'Causa má absorção. Principal causa: doença celíaca; também giardíase intensa, imunodeficiências, enteropatia autoimune, drogas (olmesartana).',
    ],
    ondeOcorre: ['Doença celíaca', 'Giardíase (em parte dos casos)', 'Espru tropical', 'Imunodeficiência comum variável'],
    armadilhas: ['Biópsias cortadas de través ou sobre folículos linfoides e glândulas de Brunner parecem ter vilos curtos; avalie só áreas bem orientadas.'],
  },
  {
    id: 'trofozoitos-de-entamoeba',
    nome: 'Trofozoítos de Entamoeba histolytica',
    sinonimos: ['amebas', 'trofozoítos amebianos', 'eritrofagocitose'],
    categoria: 'agente',
    resumo:
      'Células redondas grandes (20–40 µm), de citoplasma espumoso e acinzentado, núcleo pequeno e redondo com cariossoma central, que frequentemente contêm hemácias fagocitadas — o que prova a patogenicidade.',
    comoReconhecer: [
      'No médio aumento: células grandes e pálidas, em grupos, no exsudato necrótico da superfície de úlceras.',
      'No grande aumento: citoplasma finamente vacuolado, contorno nítido, núcleo pequeno e excêntrico; hemácias dentro do citoplasma. PAS positivo.',
    ],
    mecanismo: [
      'Cistos ingeridos liberam trofozoítos no cólon; a lectina de adesão, amebaporos e proteases matam células do epitélio e da lâmina própria por contato.',
      'Os trofozoítos invadem a submucosa e se espalham lateralmente: úlceras em "botão de camisa" (colo estreito, base larga). Pela veia porta chegam ao fígado (abscesso amebiano).',
    ],
    significado: [
      'Diagnóstico de amebíase invasiva (colite amebiana). É fundamental: corticoide dado por engano, pensando em doença inflamatória intestinal, pode causar colite fulminante.',
    ],
    ondeOcorre: ['Ceco e cólon ascendente, reto', 'Abscesso hepático amebiano', 'Raramente pulmão, cérebro e pele'],
    armadilhas: ['Macrófagos são muito parecidos: têm núcleo maior e irregular, não têm cariossoma e raramente fagocitam hemácias. O PAS realça as amebas.'],
  },
  {
    id: 'enterobius-vermicularis',
    nome: 'Enterobius vermicularis (oxiúro) no tecido',
    sinonimos: ['oxiúro', 'pinworm', 'threadworm', 'Oxyuris'],
    categoria: 'agente',
    resumo:
      'Verme nematódeo cortado transversalmente na luz do apêndice ou do cólon: cutícula eosinofílica espessa com duas cristas laterais pontiagudas (asas laterais) e, dentro, intestino e órgãos genitais — nas fêmeas, útero com ovos.',
    comoReconhecer: [
      'No pequeno aumento: vários círculos e ovais de 100–500 µm soltos na luz, cada um com uma "casca" vermelha.',
      'No grande aumento: cutícula lisa e brilhante com duas espículas laterais simétricas; musculatura sob a cutícula; tubo intestinal central; ovos ovais achatados de um lado nas fêmeas grávidas.',
    ],
    mecanismo: [
      'Os ovos são ingeridos (mãos, roupa de cama); as larvas amadurecem no ceco e apêndice, e as fêmeas migram à noite até o ânus para pôr ovos — causando prurido anal.',
      'Na luz do apêndice, raramente invadem a mucosa; podem causar dor que imita apendicite.',
    ],
    significado: [
      'É o helminto mais encontrado em apendicectomias, sobretudo em crianças. Na maioria, o apêndice não está inflamado.',
      'Presença de vermes sem inflamação aguda da parede: não é apendicite aguda — mas o paciente e os contactantes devem ser tratados.',
    ],
    ondeOcorre: ['Apêndice cecal', 'Ceco e cólon', 'Região perianal e trato genital feminino (raro, com granulomas)'],
    armadilhas: ['Larvas de outros nematódeos (Strongyloides, Ascaris) têm tamanhos e estruturas diferentes; as asas laterais pontiagudas e a localização apontam oxiúro.'],
  },
]
