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
]
