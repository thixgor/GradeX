import type { AtlasMarker } from './catalogo'

export interface MarkerInsight {
  location: string
  function: string
  clinical: string
  sourceNote?: string
}

interface InsightRule {
  terms: string[]
  location: string
  function: string
  clinical: string
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const rules: InsightRule[] = [
  {
    terms: ['arteria', 'aorta', 'tronco pulmonar'],
    location: 'Vaso de paredes espessas que parte do coração ou de outro tronco arterial e segue em direção ao território indicado pelo nome.',
    function: 'Conduz sangue sob pressão e distribui oxigênio, nutrientes ou fluxo pulmonar aos tecidos irrigados.',
    clinical: 'Seu trajeto orienta a palpação de pulsos, o controle de hemorragias e a leitura de exames angiográficos.',
  },
  {
    terms: ['veia', 'seio venoso', 'cava'],
    location: 'Vaso de retorno localizado no território apontado pela prancha, geralmente acompanhando artérias ou ocupando planos próprios.',
    function: 'Drena o sangue do território correspondente e o devolve progressivamente ao coração.',
    clinical: 'Variações de calibre, trombose e relações com estruturas vizinhas são relevantes em acessos vasculares e imagem.',
  },
  {
    terms: ['nervo', 'plexo', 'ganglio'],
    location: 'Estrutura do sistema nervoso periférico que percorre o plano anatômico indicado, relacionando-se com músculos, vasos e vísceras.',
    function: 'Transporta fibras sensitivas, motoras e/ou autonômicas entre o sistema nervoso central e o território inervado.',
    clinical: 'A topografia ajuda a localizar déficits neurológicos, planejar bloqueios anestésicos e evitar lesão iatrogênica.',
  },
  {
    terms: ['musculo', 'masseter', 'temporal', 'biceps', 'triceps', 'deltoide', 'gluteo', 'diafragma'],
    location: 'Músculo estriado situado no compartimento ou parede corporal mostrado, com origem e inserção em estruturas vizinhas.',
    function: 'Produz movimento e estabilidade; sua ação específica depende da direção das fibras e das articulações que cruza.',
    clinical: 'A relação com nervos, vasos e planos fasciais é essencial no exame motor, em infiltrações e em abordagens cirúrgicas.',
  },
  {
    terms: ['ligamento', 'retinaculo'],
    location: 'Faixa de tecido conjuntivo denso que une ou estabiliza estruturas no complexo articular identificado.',
    function: 'Limita movimentos excessivos, orienta a cinemática e reforça a cápsula ou os planos fasciais.',
    clinical: 'Entorses e rupturas alteram a estabilidade; testes provocativos e ressonância avaliam sua integridade.',
  },
  {
    terms: ['tendao', 'aponeurose'],
    location: 'Continuação fibrosa de um músculo, posicionada entre o ventre muscular e sua inserção óssea ou fascial.',
    function: 'Transmite força muscular e contribui para movimento, armazenamento elástico e estabilidade.',
    clinical: 'Tendinopatia, ruptura e atrito em túneis osteofibrosos são correlações frequentes.',
  },
  {
    terms: ['cartilagem', 'menisco', 'disco articular', 'labio'],
    location: 'Tecido fibrocartilaginoso ou hialino interposto nas superfícies ou margens da articulação mostrada.',
    function: 'Distribui carga, reduz atrito, melhora a congruência e absorve impacto.',
    clinical: 'Degeneração e lesões traumáticas podem causar dor, bloqueio mecânico e perda de estabilidade.',
  },
  {
    terms: ['osso', 'femur', 'tibia', 'fibula', 'ulna', 'radio', 'úmero', 'umero', 'escapula', 'clavicula', 'mandibula', 'patela', 'vertebra', 'costela', 'esterno'],
    location: 'Elemento do esqueleto identificado nesta vista; suas faces, margens e acidentes estabelecem relações com articulações e partes moles.',
    function: 'Fornece suporte e alavanca mecânica, protege estruturas e oferece áreas de inserção muscular e ligamentar.',
    clinical: 'Acidentes ósseos são referências para exame físico, interpretação radiológica, fraturas e acessos cirúrgicos.',
  },
  {
    terms: ['forame', 'canal', 'fissura', 'incisura', 'meato'],
    location: 'Abertura ou passagem anatômica delimitada por ossos e/ou tecidos adjacentes nesta região.',
    function: 'Permite a passagem protegida de nervos, vasos, ductos ou outras estruturas entre compartimentos.',
    clinical: 'Estreitamento, fratura ou massas nesse trajeto podem comprimir o conteúdo que o atravessa.',
  },
  {
    terms: ['atrio', 'ventriculo', 'coracao'],
    location: 'Componente cardíaco situado no mediastino médio, dentro do pericárdio e em relação íntima com os grandes vasos.',
    function: 'Recebe e impulsiona o sangue, mantendo os circuitos pulmonar e sistêmico por contração coordenada.',
    clinical: 'Morfologia, espessura de parede e fluxo são avaliados por ECG, ecocardiografia, tomografia e ressonância.',
  },
  {
    terms: ['valva', 'valvula'],
    location: 'Estrutura valvar na transição entre câmaras cardíacas ou entre ventrículo e grande vaso.',
    function: 'Garante fluxo predominantemente unidirecional durante o ciclo cardíaco.',
    clinical: 'Estenose e insuficiência produzem sopros, sobrecarga de câmaras e alterações hemodinâmicas.',
  },
  {
    terms: ['pulmao', 'lobo pulmonar', 'bronquio', 'bronquiolo', 'alveolo', 'traqueia', 'laringe', 'faringe'],
    location: 'Estrutura das vias aéreas ou do parênquima respiratório, relacionada ao tórax, mediastino ou região cervical conforme a prancha.',
    function: 'Participa da condução, proteção e condicionamento do ar ou das trocas gasosas entre alvéolos e capilares.',
    clinical: 'Sua segmentação orienta ausculta, broncoscopia, interpretação de imagem e ressecções pulmonares.',
  },
  {
    terms: ['encefalo', 'cerebro', 'cerebelo', 'telencefalo', 'diencefalo', 'medula espinal', 'tronco encefalico'],
    location: 'Parte do sistema nervoso central protegida pelo crânio ou canal vertebral e envolvida pelas meninges.',
    function: 'Integra informação sensorial, comando motor, funções autonômicas, equilíbrio e/ou cognição conforme a região.',
    clinical: 'A localização anatômica permite correlacionar sintomas focais com territórios neurais e vasculares.',
  },
  {
    terms: ['meninge', 'dura-mater', 'aracnoide', 'pia-mater'],
    location: 'Camada de revestimento situada entre o sistema nervoso central e seus envoltórios ósseos.',
    function: 'Protege, sustenta vasos e delimita espaços relacionados ao líquido cerebrospinal.',
    clinical: 'Hemorragias, meningites e alterações de pressão se distribuem segundo esses planos.',
  },
  {
    terms: ['figado', 'vesicula biliar', 'pancreas', 'baco'],
    location: 'Órgão abdominal localizado no quadrante e nas relações peritoneais demonstradas pela prancha.',
    function: 'Exerce funções digestivas, metabólicas, imunes ou de armazenamento específicas do órgão identificado.',
    clinical: 'Relações vasculares e peritoneais orientam palpação, ultrassom, tomografia e cirurgia abdominal.',
  },
  {
    terms: ['esofago', 'estomago', 'duodeno', 'jejuno', 'ileo', 'intestino', 'colon', 'reto'],
    location: 'Segmento do tubo digestório situado no trajeto entre a cavidade oral e o canal anal, com relações próprias ao peritônio e órgãos vizinhos.',
    function: 'Conduz e processa o conteúdo alimentar, participando de digestão, absorção, secreção e propulsão.',
    clinical: 'Irrigação, drenagem e pontos de estreitamento são importantes em endoscopia, obstrução e cirurgia.',
  },
  {
    terms: ['rim', 'ureter', 'bexiga', 'uretra'],
    location: 'Estrutura do trato urinário retroperitoneal ou pélvico, acompanhando o caminho da formação à eliminação da urina.',
    function: 'Filtra o sangue, transporta, armazena ou elimina a urina conforme o segmento identificado.',
    clinical: 'Cálculos, obstruções e infecções seguem a anatomia dos estreitamentos, relações e vias de drenagem.',
  },
  {
    terms: ['ovario', 'tuba uterina', 'utero', 'vagina', 'vulva', 'mama'],
    location: 'Estrutura do sistema genital feminino situada na pelve, períneo ou parede torácica anterior conforme o órgão.',
    function: 'Participa da produção hormonal e gamética, fecundação, gestação, parto, função sexual ou lactação.',
    clinical: 'Relações com peritônio, ureter, vasos e linfonodos orientam exame, imagem e cirurgia ginecológica.',
  },
  {
    terms: ['testiculo', 'epididimo', 'ducto deferente', 'penis', 'escroto', 'prostata', 'vesicula seminal'],
    location: 'Estrutura do sistema genital masculino localizada no escroto, períneo ou pelve, conectada pelas vias espermáticas.',
    function: 'Participa da produção, maturação e transporte dos espermatozoides, secreção seminal ou função sexual.',
    clinical: 'Drenagem vascular e linfática, relações uretrais e trajetos ductais são centrais no exame e na cirurgia urológica.',
  },
]

const systemFallbacks: Record<string, Omit<MarkerInsight, 'sourceNote'>> = {
  esqueletico: {
    location: 'Referência do esqueleto axial ou apendicular visível nesta incidência e relacionada às estruturas nomeadas na coleção.',
    function: 'Contribui para suporte, proteção, alavanca mecânica ou passagem de estruturas, conforme sua forma e posição.',
    clinical: 'Use os acidentes e relações da prancha como marcos para exame físico e leitura radiológica.',
  },
  articular: {
    location: 'Componente do complexo articular mostrado, entre superfícies ósseas e os tecidos estabilizadores ao redor.',
    function: 'Participa da estabilidade, congruência e amplitude de movimento da articulação.',
    clinical: 'A posição ajuda a correlacionar mecanismos de trauma com dor, instabilidade e limitação funcional.',
  },
  muscular: {
    location: 'Estrutura do compartimento muscular indicado, em relação com fáscias, ossos, vasos e nervos vizinhos.',
    function: 'Integra a produção ou transmissão de força necessária ao movimento e à postura.',
    clinical: 'Palpação, testes motores e o conhecimento dos planos reduzem o risco em procedimentos.',
  },
  nervoso: {
    location: 'Estrutura neural situada na região indicada pela coleção e conectada a vias sensitivas, motoras ou autonômicas.',
    function: 'Processa ou conduz informação nervosa no circuito anatômico correspondente.',
    clinical: 'A topografia permite localizar lesões pela combinação de sinais e sintomas.',
  },
  circulatorio: {
    location: 'Estrutura cardiovascular situada no tórax, abdome ou território vascular apontado na prancha.',
    function: 'Participa da propulsão, distribuição ou retorno do sangue.',
    clinical: 'Relações anatômicas orientam ausculta, acesso vascular e interpretação de exames.',
  },
  respiratorio: {
    location: 'Estrutura das vias aéreas ou dos pulmões apresentada em relação com o pescoço, tórax e mediastino.',
    function: 'Participa da ventilação, proteção da via aérea ou troca gasosa.',
    clinical: 'Nível anatômico e relações locais ajudam a interpretar obstruções, infecções e imagem.',
  },
  digestorio: {
    location: 'Estrutura do tubo digestório ou órgão anexo localizada no compartimento mostrado.',
    function: 'Participa de condução, digestão, absorção, metabolismo ou eliminação.',
    clinical: 'Relações peritoneais, vasculares e ductais orientam sintomas, exames e cirurgia.',
  },
  urinario: {
    location: 'Estrutura do trato urinário localizada no retroperitônio, pelve ou períneo conforme a coleção.',
    function: 'Participa da formação, transporte, armazenamento ou eliminação da urina.',
    clinical: 'A anatomia explica padrões de dor, obstrução, refluxo e disseminação de infecções.',
  },
  'genital-feminino': {
    location: 'Estrutura genital feminina localizada na pelve, períneo ou parede torácica, conforme a coleção.',
    function: 'Participa da reprodução, função endócrina, sexual ou lactação.',
    clinical: 'Relações pélvicas e drenagem linfática são importantes no exame e em procedimentos.',
  },
  'genital-masculino': {
    location: 'Estrutura genital masculina localizada no escroto, períneo ou pelve, conforme a coleção.',
    function: 'Participa da produção e condução dos gametas, secreção seminal ou função sexual.',
    clinical: 'Trajetos ductais, vasculares e linfáticos orientam exame, imagem e cirurgia.',
  },
}

export function getMarkerInsight(marker: AtlasMarker, systemSlug: string): MarkerInsight {
  const title = normalize(marker.title)
  const rule = rules.find(candidate => candidate.terms.some(term => title.includes(normalize(term))))
  const fallback = systemFallbacks[systemSlug] || systemFallbacks.esqueletico
  const sourceNote = marker.color === 'red' && marker.description.trim().length >= 12
    ? marker.description.trim()
    : undefined

  return { ...(rule || fallback), sourceNote }
}
