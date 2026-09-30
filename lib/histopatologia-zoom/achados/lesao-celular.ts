import type { AchadoPatologico } from '../tipos'

/** Lesão e morte celular, e alterações da luz de vísceras. */
export const ACHADOS_LESAO_CELULAR: AchadoPatologico[] = [
  {
    id: 'necrose-coagulativa',
    nome: 'Necrose coagulativa',
    sinonimos: ['necrose isquêmica', 'infarto', 'gangrena'],
    categoria: 'lesao-celular',
    resumo:
      'Morte celular em que o contorno das células e a arquitetura do tecido persistem por dias, mas os núcleos desaparecem e o citoplasma fica rosa-intenso e homogêneo — "células-fantasma".',
    comoReconhecer: [
      'No pequeno aumento: área mais rosa (hipereosinofílica) e mais pálida de azul que o tecido vivo ao lado, com o desenho geral do órgão ainda reconhecível.',
      'No médio aumento: contornos celulares preservados, sem núcleos corados.',
      'No grande aumento: alterações nucleares em sequência — picnose (núcleo pequeno e escuro), cariorrexe (fragmentação) e cariólise (núcleo que "some").',
      'Na borda, com o tempo: neutrófilos (1–3 dias), macrófagos (3–7 dias), tecido de granulação (a partir de ~1 semana).',
    ],
    mecanismo: [
      'A isquemia derruba a produção de ATP: as bombas iônicas falham, a célula incha e a glicólise anaeróbia acidifica o citoplasma.',
      'A acidose desnatura as proteínas estruturais e também as enzimas que digeririam a célula — por isso a "silhueta" se mantém em vez de liquefazer.',
      'A membrana se rompe, o conteúdo vaza (troponina, transaminases, CK) e desencadeia inflamação na borda.',
    ],
    significado: [
      'Padrão típico do infarto de órgãos sólidos (coração, rim, baço) — exceto o cérebro, que liquefaz.',
      'Na parede intestinal ou do apêndice, a necrose transmural define a forma gangrenosa e antecede a perfuração.',
    ],
    ondeOcorre: ['Infarto do miocárdio', 'Infarto renal e esplênico', 'Apendicite gangrenosa', 'Isquemia intestinal', 'Centro de tumores de crescimento rápido'],
    armadilhas: [
      'Autólise (demora na fixação) também apaga núcleos, mas de forma difusa e sem inflamação na borda.',
      'Tecido cauterizado fica rosa e sem núcleos nítidos, porém só na margem cirúrgica e com núcleos "estirados".',
    ],
  },
  {
    id: 'fecalito',
    nome: 'Fecalito (apendicolito)',
    sinonimos: ['apendicolito', 'coprólito'],
    categoria: 'agente',
    resumo:
      'Concreção de fezes endurecidas, às vezes calcificada, dentro da luz do apêndice: material amorfo em camadas, com restos vegetais e bactérias.',
    comoReconhecer: [
      'No pequeno aumento: massa dentro da luz, de bordas nítidas, com lamelas concêntricas.',
      'No médio aumento: restos vegetais (paredes celulares retangulares refráteis), bactérias em massa basofílica, muco; cálcio aparece em roxo-escuro.',
    ],
    mecanismo: [
      'Fezes retidas na luz estreita do apêndice perdem água e se compactam; sais de cálcio podem se depositar.',
      'O fecalito oclui a luz: a secreção de muco continua, a pressão sobe e começa a cadeia obstrução → isquemia → invasão bacteriana.',
    ],
    significado: [
      'Causa mais comum da obstrução que inicia a apendicite no adulto; associado a maior risco de perfuração.',
      'Frequentemente não aparece no corte: a peça é seccionada em fragmentos e o fecalito pode ter se deslocado.',
    ],
    ondeOcorre: ['Apendicite aguda', 'Divertículos colônicos'],
    armadilhas: [
      'Fezes soltas na luz não são fecalito: falta a organização compacta e lamelar.',
    ],
  },
  {
    id: 'perfuracao-da-parede',
    nome: 'Perfuração da parede',
    sinonimos: ['perfuração', 'ruptura'],
    categoria: 'lesao-celular',
    resumo:
      'Descontinuidade de toda a espessura da parede de uma víscera, com necrose e exsudato comunicando a luz com a serosa ou com o tecido ao redor.',
    comoReconhecer: [
      'No pequeno aumento: a muscular própria se interrompe; no lugar, necrose e pus em continuidade da mucosa ao tecido periorgânico.',
      'No médio aumento: bordas da parede necróticas, cercadas de neutrófilos; abscesso ou peritonite fibrinopurulenta do lado de fora.',
    ],
    mecanismo: [
      'A necrose transmural (isquêmica e inflamatória) destrói a camada muscular, que é o que dá resistência à parede.',
      'A pressão intraluminal rompe o tecido enfraquecido e o conteúdo contaminado sai para a cavidade.',
    ],
    significado: [
      'Complicação grave: peritonite, abscesso e sepse. No apêndice, mais comum em crianças pequenas e idosos, que chegam tarde ao diagnóstico.',
    ],
    ondeOcorre: ['Apendicite perfurada', 'Diverticulite', 'Úlcera péptica perfurada', 'Colite fulminante'],
    armadilhas: ['Rasgo pela manipulação cirúrgica tem bordas limpas, sem necrose nem inflamação.'],
  },
  {
    id: 'esteatose-macrovesicular',
    nome: 'Esteatose macrovesicular',
    sinonimos: ['gota grande', 'degeneração gordurosa', 'esteatose'],
    categoria: 'lesao-celular',
    resumo:
      'Hepatócito ocupado por um único vacúolo grande e redondo de gordura, que empurra o núcleo para a periferia — em H&E o vacúolo é "vazio" porque a gordura se dissolve no processamento.',
    comoReconhecer: [
      'No pequeno aumento: o parênquima fica pálido e "rendado", salpicado de buracos brancos redondos.',
      'No grande aumento: vacúolos claros, nítidos, do tamanho do próprio hepatócito, com o núcleo achatado na borda (como um adipócito).',
      'Na esteatose de gotas pequenas a médias, várias gotas convivem na mesma célula; na microvesicular verdadeira, o citoplasma fica espumoso e o núcleo continua central.',
    ],
    mecanismo: [
      'Entra mais ácido graxo no fígado (obesidade, resistência à insulina, álcool) ou sai menos (menos β-oxidação, menos exportação como VLDL).',
      'Os triglicerídeos se acumulam em gotas que se fundem numa gota única e grande.',
    ],
    significado: [
      'É reversível e, isolada, benigna (esteatose simples). Mais de 5 % dos hepatócitos acometidos define esteatose.',
      'O que faz ela progredir para cirrose é a esteato-hepatite: balonização, inflamação e fibrose.',
    ],
    ondeOcorre: ['Doença hepática esteatótica associada à disfunção metabólica (DHGNA/MASLD)', 'Álcool', 'Corticoides, metotrexato', 'Desnutrição (kwashiorkor)'],
    armadilhas: ['Espaços sinusoidais dilatados e artefato de congelamento também deixam buracos; o vacúolo de gordura é redondo, de borda lisa e dentro da célula.'],
  },
  {
    id: 'esteatose-microvesicular',
    nome: 'Esteatose de gotas pequenas / microvesicular',
    sinonimos: ['microesteatose', 'esteatose de pequenas gotas'],
    categoria: 'lesao-celular',
    resumo:
      'Múltiplas gotas pequenas de gordura no citoplasma do hepatócito, com o núcleo ainda central; na forma microvesicular verdadeira, o citoplasma fica espumoso.',
    comoReconhecer: [
      'Vários vacúolos pequenos por célula, de tamanhos iguais ou variados; o núcleo continua no centro.',
      'Na microvesicular verdadeira, as gotas são tão pequenas que o citoplasma parece "espumoso", sem vacúolos individualizados.',
    ],
    mecanismo: [
      'Gotas pequenas podem ser só uma fase de formação da gota grande.',
      'A microvesicular verdadeira reflete falência mitocondrial (β-oxidação bloqueada) e é mais grave.',
    ],
    significado: [
      'Gotas pequenas misturadas a gotas grandes são comuns na esteatose metabólica e alcoólica.',
      'A microvesicular verdadeira difusa é marca de doenças graves: esteatose aguda da gravidez, síndrome de Reye, toxicidade por valproato ou tetraciclina.',
    ],
    ondeOcorre: ['Esteatose metabólica e alcoólica (mista)', 'Esteatose aguda da gravidez', 'Síndrome de Reye', 'Toxicidade mitocondrial por fármacos'],
    armadilhas: ['Hepatócitos com glicogênio abundante também ficam claros, mas sem vacúolos redondos.'],
  },
  {
    id: 'balonizacao-hepatocitaria',
    nome: 'Balonização hepatocitária',
    sinonimos: ['degeneração balonizante', 'hepatócito balonizado'],
    categoria: 'lesao-celular',
    resumo:
      'Hepatócito aumentado, arredondado, de citoplasma claro e rarefeito (em "teia"), às vezes com corpúsculo de Mallory — a lesão celular que distingue a esteato-hepatite da esteatose simples.',
    comoReconhecer: [
      'Célula 1,5–2 vezes maior que as vizinhas, redonda, com citoplasma pálido e floculado, sem o vacúolo nítido da gordura.',
      'Muitas vezes na zona 3 (perto da veia centrolobular), com inflamação e fibrose pericelular ao redor.',
    ],
    mecanismo: ['Lesão do citoesqueleto (queratinas 8/18 degradadas pelo estresse oxidativo) e retenção de líquido.'],
    significado: ['Critério de esteato-hepatite (MASH/NASH ou alcoólica): indica lesão ativa com risco de fibrose.'],
    ondeOcorre: ['Esteato-hepatite metabólica e alcoólica'],
    armadilhas: ['Hepatócitos claros por glicogênio ou edema de artefato não são balonizados.'],
  },
  {
    id: 'necrose-caseosa',
    nome: 'Necrose caseosa',
    sinonimos: ['caseificação', 'caseum', 'necrose caseificante'],
    categoria: 'lesao-celular',
    resumo:
      'Necrose em que a arquitetura do tecido desaparece por completo e fica um material eosinofílico, amorfo e granuloso, com poeira nuclear — "como queijo" na macroscopia —, cercado por granulomas.',
    comoReconhecer: [
      'No pequeno aumento: áreas rosa-pálidas, homogêneas e amorfas, sem nenhum contorno de célula, vaso ou fibra, com borda arroxeada (a reação granulomatosa).',
      'No grande aumento: material granular fino, eosinofílico, com fragmentos nucleares esparsos; ao redor, macrófagos epitelioides em paliçada, células gigantes de Langhans e linfócitos.',
      'Diferente da necrose coagulativa, as "células-fantasma" não se reconhecem.',
    ],
    mecanismo: [
      'A resposta imune celular (Th1, IFN-γ, TNF) contra antígenos da micobactéria mata os macrófagos infectados e o tecido ao redor.',
      'Os lipídios da parede micobacteriana (ácidos micólicos) e a hipóxia do centro do granuloma dão o aspecto seco e granular.',
      'O caseum pode calcificar (lesão cicatrizada) ou liquefazer e drenar, formando cavidades (tuberculose pulmonar cavitária).',
    ],
    significado: [
      'Muito sugestiva de tuberculose; também ocorre em infecções fúngicas (histoplasmose, criptococose) — confirme com Ziehl-Neelsen, cultura ou PCR.',
      'Granuloma com necrose caseosa × sem necrose (sarcoidose, Crohn) é uma das distinções mais cobradas em prova.',
    ],
    ondeOcorre: ['Tuberculose (pulmão, linfonodos, rim, osso)', 'Infecções fúngicas', 'Algumas micobacterioses atípicas'],
    armadilhas: [
      'Necrose de tumores e de infartos antigos pode ficar amorfa, mas não é cercada por granulomas epitelioides com células de Langhans.',
      'Necrose supurativa (abscesso) é cheia de neutrófilos, não de restos granulares.',
    ],
  },
  {
    id: 'fendas-de-colesterol',
    nome: 'Fendas de colesterol',
    sinonimos: ['cristais de colesterol', 'clefts de colesterol'],
    categoria: 'deposito',
    resumo:
      'Espaços vazios em forma de agulha ou de fuso, pontiagudos nas extremidades, deixados pelos cristais de colesterol que se dissolvem no processamento da lâmina.',
    comoReconhecer: [
      'No pequeno aumento: "fendas" brancas, alongadas e paralelas ou em leque, dentro de um material rosa-pálido.',
      'No grande aumento: bordas nítidas, sem células dentro; às vezes com células gigantes de corpo estranho ao redor.',
    ],
    mecanismo: [
      'O colesterol livre se acumula fora das células (macrófagos espumosos que morrem liberam o conteúdo) e cristaliza.',
      'O álcool e o xilol da preparação dissolvem os cristais: resta o molde vazio.',
    ],
    significado: [
      'Marca o núcleo lipídico-necrótico da placa aterosclerótica; também aparece em hemorragias antigas, colesteatoma e xantogranulomas.',
    ],
    ondeOcorre: ['Placa aterosclerótica', 'Êmbolos de colesterol (ateroembolia)', 'Colesteatoma', 'Hemorragias antigas'],
    armadilhas: ['Retração em torno de fibras (artefato) é irregular; a fenda de colesterol tem forma de agulha com pontas agudas.'],
  },
  {
    id: 'celulas-espumosas',
    nome: 'Células espumosas (macrófagos carregados de lipídio)',
    sinonimos: ['foam cells', 'macrófagos xantomatosos', 'histiócitos espumosos'],
    categoria: 'deposito',
    resumo:
      'Macrófagos com citoplasma claro, cheio de vacúolos pequenos de lipídio ("espuma"), e núcleo pequeno e central.',
    comoReconhecer: [
      'Células redondas ou poligonais, maiores que as vizinhas, de citoplasma pálido e finamente vacuolado.',
      'Em grupos na íntima (estrias gordurosas, placas) ou no interstício de órgãos com lipídio retido.',
    ],
    mecanismo: [
      'A LDL que atravessa o endotélio lesado fica retida na íntima e é oxidada; macrófagos a captam por receptores scavenger, sem freio, e se enchem de ésteres de colesterol.',
    ],
    significado: ['Primeira lesão da aterosclerose (estria gordurosa); nas placas avançadas, cercam o núcleo necrótico.'],
    ondeOcorre: ['Aterosclerose', 'Xantomas e xantelasma', 'Pielonefrite xantogranulomatosa', 'Colecistite (colesterolose)', 'Carcinoma papilífero de células renais (nos eixos das papilas)'],
    armadilhas: ['Células em anel de sinete e adipócitos pequenos são diferentes: o núcleo não fica central e a gota é única.'],
  },
  {
    id: 'trombo-com-linhas-de-zahn',
    nome: 'Trombo (com linhas de Zahn)',
    sinonimos: ['trombo', 'linhas de Zahn', 'trombose', 'trombo mural', 'trombo oclusivo'],
    categoria: 'circulatorio',
    resumo:
      'Massa sólida formada dentro de um vaso ou câmara cardíaca em vida, composta de plaquetas, fibrina e hemácias dispostas em camadas alternadas — as linhas de Zahn — e aderida à parede.',
    comoReconhecer: [
      'No pequeno aumento: massa vermelha ocupando a luz do vaso, parcial (mural) ou totalmente (oclusiva).',
      'No médio aumento: lâminas alternadas rosa-pálidas (plaquetas e fibrina) e vermelhas (hemácias) — as linhas de Zahn.',
      'Ponto de fixação à parede, onde o endotélio foi lesado; com o tempo, células e capilares invadem o trombo a partir dele (organização).',
    ],
    mecanismo: [
      'Tríade de Virchow: lesão endotelial (placa rota, vasculite), alteração do fluxo (estase, turbulência) e hipercoagulabilidade.',
      'Plaquetas aderem ao colágeno exposto, agregam e ativam a coagulação; a fibrina prende hemácias. Em fluxo, esse processo se repete em camadas — daí as linhas de Zahn.',
    ],
    significado: [
      'Linhas de Zahn provam que o trombo se formou com sangue circulando (em vida); o coágulo post-mortem é homogêneo, gelatinoso, sem camadas e sem aderência.',
      'Destinos: propagação, embolização, dissolução, organização com recanalização. Nas artérias causa infarto; nas veias, edema e embolia pulmonar.',
    ],
    ondeOcorre: ['Artérias coronárias e cerebrais sobre placas', 'Veias profundas dos membros inferiores', 'Átrio esquerdo na fibrilação atrial', 'Aneurismas (trombo mural)'],
    armadilhas: [
      'Coágulo post-mortem: "gordura de galinha" (camada amarela de plasma) sobre "geleia de groselha" (hemácias), sem camadas e sem aderência à parede.',
      'Sangue retido no vaso durante a fixação não tem fibrina organizada nem plaquetas em lâminas.',
    ],
  },
  {
    id: 'organizacao-do-trombo',
    nome: 'Organização do trombo',
    sinonimos: ['recanalização', 'trombo em organização'],
    categoria: 'reparo',
    resumo:
      'Invasão do trombo, a partir da parede do vaso, por células musculares lisas, fibroblastos e capilares — o trombo vira tecido conjuntivo, às vezes com novos canais (recanalização).',
    comoReconhecer: ['No ponto de fixação, células fusiformes e capilares penetrando a massa de fibrina e hemácias.'],
    mecanismo: ['O trombo persistente é tratado como corpo estranho: o tecido de granulação da parede o incorpora.'],
    significado: [
      'Data o trombo: organização indica pelo menos dias de evolução.',
      'A recanalização pode restaurar parte do fluxo; o trombo organizado fica incorporado à parede e espessa a íntima.',
    ],
    ondeOcorre: ['Trombos arteriais e venosos persistentes'],
    armadilhas: ['Parede espessada por placa aterosclerótica pode imitar trombo organizado; procure camadas de fibrina.'],
  },
  {
    id: 'antracose',
    nome: 'Antracose (pigmento de carvão)',
    sinonimos: ['pigmento antracótico', 'antracose pulmonar'],
    categoria: 'deposito',
    resumo:
      'Grânulos pretos de carbono inalado, dentro de macrófagos, ao longo dos vasos, septos, pleura e linfonodos do pulmão.',
    comoReconhecer: ['Depósitos pretos, finos e granulares, sem refringência, em torno de bronquíolos e vasos e sob a pleura.'],
    mecanismo: ['Partículas de fuligem e fumaça (tabaco, poluição) são fagocitadas por macrófagos alveolares e drenadas pelos linfáticos.'],
    significado: ['Achado comum e em geral inócuo em moradores urbanos e fumantes; em grande quantidade com fibrose, pneumoconiose do mineiro de carvão.'],
    ondeOcorre: ['Pulmões e linfonodos hilares de adultos urbanos', 'Pneumoconiose (antracossilicose)'],
    armadilhas: ['Hemossiderina é marrom-dourada e refringente; pigmento de formalina é marrom e fora das células.'],
  },
  {
    id: 'emaranhados-neurofibrilares',
    nome: 'Emaranhados neurofibrilares',
    sinonimos: ['novelos neurofibrilares', 'neurofibrillary tangles', 'NFT', 'emaranhados de tau'],
    categoria: 'deposito',
    resumo:
      'Feixes de filamentos de proteína tau hiperfosforilada dentro do corpo do neurônio, que ocupam o citoplasma e assumem a forma da célula: em "chama de vela" nos neurônios piramidais e globosos nos do tronco.',
    comoReconhecer: [
      'No H&E: difíceis — fibrilas levemente basofílicas no citoplasma de neurônios piramidais; ficam evidentes com prata (Bielschowsky, Gallyas) ou imuno para tau.',
      'Na imuno para tau: neurônios inteiros escuros, triangulares, com a cauda do dendrito apical ("chama"); emaranhados "fantasmas" extracelulares quando o neurônio morre.',
    ],
    mecanismo: [
      'A tau normalmente estabiliza os microtúbulos do axônio. Hiperfosforilada, ela se solta, forma filamentos helicoidais pareados e se agrega no corpo celular.',
      'O transporte axonal falha e o neurônio morre; a tau anômala se propaga de neurônio a neurônio por conexões sinápticas — da região entorrinal ao hipocampo e depois ao neocórtex (estágios de Braak I–VI).',
    ],
    significado: [
      'Com as placas neuríticas, define a doença de Alzheimer. O número e a extensão dos emaranhados correlacionam-se melhor com a demência do que as placas.',
      'Também aparecem em outras taupatias: paralisia supranuclear progressiva, degeneração corticobasal, encefalopatia traumática crônica.',
    ],
    ondeOcorre: ['Doença de Alzheimer', 'Envelhecimento (poucos, na região entorrinal)', 'Encefalopatia traumática crônica', 'Paralisia supranuclear progressiva'],
    armadilhas: ['Neurônios "escuros" por artefato de manipulação do cérebro fresco são hipercromáticos, mas sem fibrilas; a imuno para tau resolve.'],
  },
  {
    id: 'placas-neuriticas',
    nome: 'Placas neuríticas (senis)',
    sinonimos: ['placas senis', 'placas amiloides', 'neuritic plaques'],
    categoria: 'deposito',
    resumo:
      'Lesões esféricas de 20–200 µm no neurópilo, com um núcleo de β-amiloide extracelular cercado por neuritos distróficos (prolongamentos neuronais dilatados e cheios de tau), micróglia e astrócitos.',
    comoReconhecer: [
      'No H&E: área arredondada do neurópilo levemente eosinofílica e granular, às vezes com núcleo amiloide central; pouco visível.',
      'Na imuno para tau: aglomerado arredondado de neuritos escuros e grossos (a coroa da placa); o núcleo amiloide é demonstrado por imuno para β-amiloide, Congo ou prata.',
    ],
    mecanismo: [
      'A proteína precursora do amiloide (APP) é clivada pelas β e γ-secretases, formando o peptídeo Aβ42, que se agrega em oligômeros tóxicos e fibrilas.',
      'O amiloide lesa sinapses e neuritos vizinhos, ativa micróglia e desencadeia a propagação da patologia tau (hipótese da cascata amiloide).',
    ],
    significado: [
      'Critério neuropatológico da doença de Alzheimer (escore CERAD de placas neuríticas; fases de Thal do amiloide).',
      'O mesmo Aβ se deposita na parede dos vasos (angiopatia amiloide cerebral), causando hemorragias lobares em idosos.',
    ],
    ondeOcorre: ['Doença de Alzheimer', 'Síndrome de Down (após os 40 anos — gene da APP no cromossomo 21)', 'Idosos sem demência (placas difusas)'],
    armadilhas: ['Placas difusas, sem neuritos distróficos, são comuns no envelhecimento normal e não bastam para o diagnóstico.'],
  },
  {
    id: 'fios-do-neuropilo',
    nome: 'Fios do neurópilo (neuropil threads)',
    sinonimos: ['neuropil threads', 'neuritos com tau'],
    categoria: 'deposito',
    resumo:
      'Pequenos fragmentos curtos e retorcidos de tau em dendritos e axônios, espalhados por todo o neurópilo como "pelos" ou "vírgulas".',
    comoReconhecer: ['Só na imuno para tau (ou prata): inúmeros traços finos e escuros no fundo, entre os neurônios.'],
    mecanismo: ['A mesma tau hiperfosforilada dos emaranhados se acumula nos prolongamentos dos neurônios doentes.'],
    significado: ['Acompanham os emaranhados e indicam a extensão da patologia tau no córtex; densos no Alzheimer avançado.'],
    ondeOcorre: ['Doença de Alzheimer', 'Outras taupatias'],
    armadilhas: ['Precisam de coloração especial; no H&E não se veem.'],
  },
  {
    id: 'necrose-fibrinoide',
    nome: 'Necrose fibrinoide',
    sinonimos: ['necrose fibrinoide segmentar', 'fibrinoide'],
    categoria: 'lesao-celular',
    resumo:
      'Material eosinofílico vivo, amorfo e "sujo" de restos nucleares na parede de vasos ou no tufo glomerular — plasma e fibrina extravasados sobre uma parede destruída.',
    comoReconhecer: ['Rosa-intenso, parecido com fibrina, borrando a estrutura da parede; restos nucleares (cariorrexe) e neutrófilos em volta.'],
    mecanismo: ['Imunocomplexos, anticorpos anti-MBG, neutrófilos ativados por ANCA ou hipertensão maligna rompem a parede; a fibrina do plasma infiltra e as células morrem.'],
    significado: ['Marca de lesão vascular ativa e grave: vasculites, glomerulonefrite crescêntica, hipertensão maligna, microangiopatia trombótica. Quase sempre precede o crescente no glomérulo.'],
    ondeOcorre: ['Glomerulonefrites necrosantes e crescênticas', 'Vasculites (poliarterite, ANCA)', 'Hipertensão maligna', 'Lúpus'],
    armadilhas: ['Hialinose (no diabetes e na hipertensão benigna) também é rosa, mas é homogênea, lisa e sem restos nucleares.'],
  },
  {
    id: 'esclerose-glomerular-global',
    nome: 'Esclerose glomerular global',
    sinonimos: ['glomérulo obsoleto', 'glomérulo hialinizado', 'glomeruloesclerose global'],
    categoria: 'reparo',
    resumo:
      'Glomérulo inteiramente substituído por matriz hialina acelular e colapsada dentro da cápsula de Bowman — um néfron perdido de forma definitiva.',
    comoReconhecer: ['Bola rosada e homogênea, sem capilares abertos nem núcleos, às vezes com a cápsula espessada e retraída.'],
    mecanismo: ['Fim comum de qualquer lesão glomerular persistente (diabetes, hipertensão, glomerulonefrites, isquemia): o tufo colapsa e é preenchido por colágeno.'],
    significado: [
      'A proporção de glomérulos globalmente esclerosados, junto com atrofia tubular e fibrose intersticial, mede a cronicidade e o prognóstico renal.',
      'Alguns glomérulos obsoletos são normais no envelhecimento (até cerca de idade/2 − 10 %).',
    ],
    ondeOcorre: ['Nefropatia diabética e hipertensiva', 'Glomerulonefrites crônicas', 'Envelhecimento'],
    armadilhas: ['Não confundir com esclerose segmentar (só parte do tufo), que tem outro significado (GESF).'],
  },
  {
    id: 'corpos-psamomatosos',
    nome: 'Corpos psamomatosos',
    sinonimos: ['psamomas', 'calcificações lamelares'],
    categoria: 'deposito',
    resumo:
      'Pequenas esferas de cálcio em lamelas concêntricas, basofílicas (roxas), dentro de tumores — calcificação distrófica de células que morreram em espiral.',
    comoReconhecer: ['Círculos roxos, com anéis concêntricos como cebola cortada, de 20–100 µm.'],
    mecanismo: ['Células isoladas degeneram e servem de núcleo para deposição de fosfato de cálcio em camadas sucessivas.'],
    significado: ['Pista para tumores papilíferos e meningiomas: carcinoma papilífero da tireoide, carcinoma seroso do ovário, meningioma, mesotelioma.'],
    ondeOcorre: ['Meningioma', 'Carcinoma papilífero da tireoide', 'Tumores serosos do ovário', 'Carcinoma papilífero renal'],
    armadilhas: ['Calcificações grosseiras e irregulares (distróficas comuns) não têm lamelas.'],
  },
  {
    id: 'congestao-centrolobular',
    nome: 'Congestão e necrose centrolobular',
    sinonimos: ['fígado em noz-moscada', 'congestão passiva crônica', 'necrose hemorrágica centrolobular'],
    categoria: 'circulatorio',
    resumo:
      'Sinusoides dilatados e cheios de sangue em volta das veias centrais (zona 3), com hepatócitos atróficos ou necróticos ali e preservados em volta dos espaços-porta; com o tempo, fibrose.',
    comoReconhecer: [
      'No pequeno aumento: áreas vermelhas ao redor das veias centrais que se ligam umas às outras, alternando com parênquima claro periportal.',
      'No grande aumento: trabéculas finas e atróficas, hemácias ocupando os sinusoides e o espaço entre as placas, macrófagos com hemossiderina.',
    ],
    mecanismo: [
      'A insuficiência cardíaca direita aumenta a pressão venosa central; o sangue se acumula no fígado a partir da veia hepática.',
      'A zona 3 é a última a receber oxigênio: com a estase, os hepatócitos centrolobulares sofrem hipóxia e morrem.',
    ],
    significado: ['Explica o fígado aumentado e doloroso, as transaminases elevadas e, a longo prazo, a "cirrose cardíaca" da insuficiência cardíaca.'],
    ondeOcorre: ['Insuficiência cardíaca direita e global', 'Pericardite constritiva', 'Síndrome de Budd-Chiari'],
    armadilhas: ['Choque e hipotensão também causam necrose centrolobular, mas com menos congestão; artefato de coleta dilata sinusoides sem hemorragia nas placas.'],
  },
]
