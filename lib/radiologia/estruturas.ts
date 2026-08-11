/**
 * Dossiê aprofundado de cada estrutura demarcada no Atlas de Raio-X.
 *
 * As sobreposições do atlas apenas *acendem* a estrutura sobre o filme. O que
 * transforma isso em estudo é saber, para cada demarcação: o que a estrutura é,
 * como encontrá-la sem a marcação, o que avaliar nela e qual erro ela costuma
 * provocar. Este arquivo carrega esse texto — uma entrada por nome de estrutura
 * usado em `ESTUDOS_RAIO_X`.
 *
 * A chave é o nome em pt-BR exatamente como aparece no catálogo. Nomes no
 * plural (`Escápulas`, `Acetábulos`) recebem entrada própria porque a leitura
 * pedida é outra: comparação bilateral, e não análise de uma peça isolada.
 */

export interface NotaEstrutura {
  /** O que a estrutura é, em uma frase densa. */
  resumo: string
  /** Como localizá-la no filme sem a sobreposição: posição, forma, densidade, vizinhos. */
  identificar: string
  /** O que se avalia nela e por que isso muda conduta. */
  clinica: string
  /** Armadilha específica desta estrutura, quando existe uma clássica. */
  alerta?: string
}

export const NOTAS_ESTRUTURAS: Record<string, NotaEstrutura> = {
  // ───────────────────────────── Tórax · arcabouço ─────────────────────────────
  'Clavículas': {
    resumo:
      'Ossos longos em S que ligam o esterno à escápula e cruzam os ápices pulmonares no terço superior do filme.',
    identificar:
      'São as duas barras horizontais mais superiores e densas do tórax. Siga cada uma da extremidade medial, junto ao manúbrio, até a articulação acromioclavicular.',
    clinica:
      'Na PA, a distância entre as extremidades mediais e os processos espinhosos é o método padrão para julgar rotação. Percorra também as corticais: fratura de clavícula é comum e frequentemente única alteração de um trauma de ombro.',
    alerta:
      'A companheira da clavícula — a sombra de partes moles supraclavicular — pode simular uma linha de pneumotórax apical em filmes penetrados.',
  },
  'Manúbrio do esterno': {
    resumo:
      'Segmento superior do esterno, que se articula com as clavículas e a primeira costela e forma o ângulo esternal com o corpo.',
    identificar:
      'Densidade central sobreposta ao mediastino superior na PA; na prática, só se delimita bem no perfil ou em incidências oblíquas.',
    clinica:
      'É o reparo do ângulo de Louis (nível de T4-T5, carina e arco aórtico). Alargamento de partes moles ao seu redor no trauma sugere hematoma mediastinal.',
    alerta:
      'A radiografia frontal praticamente não avalia o esterno: dor esternal pós-trauma pede perfil dedicado ou tomografia.',
  },
  'Escápulas': {
    resumo:
      'Lâminas triangulares posteriores, projetadas sobre os campos pulmonares nas radiografias mal posicionadas.',
    identificar:
      'Procure duas bordas verticais nítidas nos terços laterais dos pulmões. Na PA bem feita, os braços em abdução as rodam para fora dos campos pulmonares.',
    clinica:
      'Comparar as duas escápulas ajuda a julgar posicionamento e simetria de partes moles. Fraturas de escápula indicam trauma de alta energia e obrigam a procurar lesões associadas.',
    alerta:
      'A borda medial da escápula é a causa mais frequente de "pneumotórax" falso-positivo: siga a linha — se ela continua para fora do gradil costal, é escápula.',
  },
  'Processos espinhosos': {
    resumo:
      'Projeções posteriores dos arcos vertebrais, vistas de topo na incidência frontal como densidades ovais na linha média.',
    identificar:
      'Alinhe-os mentalmente em uma coluna vertical central. Cada um se projeta sobre o corpo da vértebra imediatamente inferior.',
    clinica:
      'Servem como referência de linha média para julgar rotação e desvio do mediastino. Na coluna, o alargamento súbito do espaço interespinhoso é sinal de lesão do complexo ligamentar posterior.',
    alerta:
      'Um processo espinhoso que "salta" da linha em relação aos vizinhos pode indicar rotação do posicionamento ou luxação facetária unilateral — não conclua sem o perfil.',
  },
  'Corpos vertebrais': {
    resumo:
      'Blocos ósseos anteriores que sustentam a carga axial e definem, empilhados, o alinhamento da coluna.',
    identificar:
      'São os retângulos regulares empilhados na linha média. Compare altura anterior e posterior de cada um e a nitidez dos platôs superior e inferior.',
    clinica:
      'Avalie altura, densidade, integridade cortical dos platôs e alinhamento das bordas anterior e posterior. Perda focal de altura, degrau cortical ou esclerose em banda apontam fratura por compressão.',
    alerta:
      'Em um tórax penetrado, ver os corpos vertebrais através do coração é normal e esperado; em um filme claro, não vê-los sugere subpenetração, não doença.',
  },
  'Sombras mamárias': {
    resumo:
      'Densidades de partes moles da mama projetadas sobre os campos pulmonares inferiores.',
    identificar:
      'Opacidades simétricas de bordas suaves nas bases, com limite inferior curvo que ultrapassa o gradil costal lateralmente.',
    clinica:
      'Reconhecê-las evita interpretar velamento basal como derrame ou consolidação. A assimetria após mastectomia produz hipertransparência unilateral — um achado a explicar, não um erro técnico.',
    alerta:
      'A sombra do mamilo pode simular nódulo pulmonar: costuma ser bilateral, de mesma altura e desaparece ou se desloca na incidência com marcador.',
  },
  'Largura cardíaca': {
    resumo:
      'Maior diâmetro transverso da silhueta cardíaca, base do índice cardiotorácico.',
    identificar:
      'Some a maior distância da linha média até a borda cardíaca direita com a maior distância até a borda esquerda.',
    clinica:
      'Índice cardiotorácico acima de 0,5 em PA ortostática bem inspirada sugere aumento da área cardíaca — que pode ser dilatação de câmaras ou derrame pericárdico, e não se distingue só pela radiografia.',
    alerta:
      'AP, decúbito, baixa inspiração e pectus excavatum ampliam a silhueta. Cardiomegalia diagnosticada em filme portátil é, na melhor hipótese, uma suspeita.',
  },
  'Largura torácica': {
    resumo:
      'Maior diâmetro interno do gradil costal, denominador do índice cardiotorácico.',
    identificar:
      'Meça de face interna a face interna das costelas, no ponto mais largo, em geral logo acima dos seios costofrênicos.',
    clinica:
      'É a referência que torna a largura cardíaca comparável entre pacientes de portes diferentes e entre exames sucessivos do mesmo paciente.',
    alerta:
      'Só faz sentido comparar largura cardíaca e torácica medidas no mesmo filme, na mesma incidência e no mesmo grau de inspiração.',
  },
  'Ângulos costofrênicos': {
    resumo:
      'Recessos agudos entre o diafragma e a parede torácica, ponto mais baixo do espaço pleural em ortostase.',
    identificar:
      'Procure o vértice agudo lateral onde a linha do diafragma encontra o gradil. Na PA, os laterais; no perfil, os posteriores, que são mais profundos.',
    clinica:
      'O apagamento (velamento com menisco ascendente) é o sinal mais precoce de derrame pleural na radiografia. O recesso posterior no perfil detecta volumes menores que a PA.',
    alerta:
      'Ângulo apagado nem sempre é líquido: espessamento pleural crônico, gordura e cicatriz também obliteram o seio — e não se deslocam em decúbito lateral.',
  },
  'Bolha gástrica': {
    resumo:
      'Ar do fundo gástrico, aprisionado sob a cúpula diafragmática esquerda na posição ortostática.',
    identificar:
      'Transparência arredondada com nível hidroaéreo logo abaixo do hemidiafragma esquerdo.',
    clinica:
      'Confirma que o filme foi feito em ortostase e marca o lado esquerdo. A distância entre a bolha e o topo da cúpula deve ser pequena; se aumenta, pense em conteúdo subfrênico ou lesão da base esquerda.',
    alerta:
      'Bolha gástrica no lado direito significa situs inversus ou erro de marcação de lado — verifique antes de descrever qualquer outro achado.',
  },

  // ───────────────────────────── Tórax · mediastino ─────────────────────────────
  'Arco aórtico': {
    resumo:
      'Curvatura entre a aorta ascendente e a descendente, que forma o botão aórtico na borda mediastinal esquerda.',
    identificar:
      'Primeira convexidade do contorno esquerdo, logo abaixo da clavícula; a aorta descendente continua dela como linha oblíqua para baixo e para a direita.',
    clinica:
      'Avalie tamanho, contorno e calcificação da parede. Alargamento com apagamento da janela aortopulmonar em trauma levanta a hipótese de lesão aórtica e exige angiotomografia.',
    alerta:
      'Ectasia e alongamento aórtico são achados quase universais no idoso hipertenso; chamá-los de "aneurisma" pela radiografia é excesso.',
  },
  'Diafragma': {
    resumo:
      'Músculo em cúpula que separa tórax e abdome e forma o limite inferior dos campos pulmonares.',
    identificar:
      'Duas linhas curvas suaves. A direita costuma ficar meio espaço intercostal acima da esquerda, empurrada pelo fígado.',
    clinica:
      'Compare altura, contorno e nitidez. Elevação unilateral sugere paralisia frênica, perda de volume pulmonar ou processo subfrênico; ar livre subdiafragmático em ortostase indica perfuração de víscera oca.',
    alerta:
      'A interposição do cólon entre fígado e diafragma (sinal de Chilaiditi) simula pneumoperitônio — procure haustrações dentro da transparência.',
  },
  'Hilos pulmonares': {
    resumo:
      'Ponto de entrada de artérias, veias, brônquios e linfonodos em cada pulmão; a densidade radiográfica é sobretudo arterial.',
    identificar:
      'Densidades ramificadas nos terços médios, junto ao mediastino. O hilo esquerdo está normalmente 1 a 2 cm mais alto que o direito.',
    clinica:
      'Compare tamanho, densidade e altura. Aumento bilateral lobulado sugere adenomegalia; aumento com vasos afilando abruptamente sugere hipertensão pulmonar; deslocamento indica perda de volume.',
    alerta:
      'Hilo "denso" unilateral em fumante deve ser levado a sério: massa central pode se manifestar apenas como assimetria hilar antes de qualquer opacidade parenquimatosa.',
  },
  'Apêndice atrial esquerdo': {
    resumo:
      'Prolongamento anterolateral do átrio esquerdo, terceiro arco do contorno cardíaco esquerdo.',
    identificar:
      'Segmento entre o tronco da pulmonar e o ventrículo esquerdo. Normalmente é reto ou discretamente côncavo.',
    clinica:
      'A retificação ou abaulamento desse segmento é sinal clássico de aumento atrial esquerdo, típico da doença mitral e da fibrilação atrial crônica.',
    alerta:
      'Um contorno reto isolado, sem duplo contorno à direita nem elevação do brônquio principal esquerdo, é fraco: procure o conjunto de sinais.',
  },
  'Ventrículo esquerdo': {
    resumo:
      'Câmara de ejeção sistêmica; forma o arco inferior esquerdo e o ápice da silhueta cardíaca.',
    identificar:
      'Convexidade inferior esquerda, que desce até o ângulo cardiofrênico. No perfil, ocupa a borda posteroinferior do coração.',
    clinica:
      'A hipertrofia concêntrica pode não alterar a silhueta; a dilatação desloca o ápice para baixo e para a esquerda e aumenta o índice cardiotorácico.',
    alerta:
      'No perfil, a borda posterior do ventrículo esquerdo ultrapassar a linha da veia cava inferior em mais de 1,8 cm acima do diafragma sugere aumento — mas exige um perfil verdadeiro.',
  },
  'Átrio direito': {
    resumo:
      'Câmara que recebe as cavas; forma o arco inferior do contorno cardíaco direito.',
    identificar:
      'Convexidade suave à direita da coluna, acima do ângulo cardiofrênico direito e abaixo da confluência cava-ázigos.',
    clinica:
      'Abaulamento excessivo acompanha sobrecarga de câmaras direitas: hipertensão pulmonar, insuficiência tricúspide, cardiopatias congênitas.',
    alerta:
      'Um coxim adiposo cardiofrênico volumoso simula proeminência atrial direita — sua densidade é menor e as bordas são mais indistintas.',
  },
  'Ventrículo direito': {
    resumo:
      'Câmara de ejeção pulmonar, situada anteriormente; não forma contorno na incidência frontal.',
    identificar:
      'Só é avaliável no perfil, onde constitui a borda anterior do coração, encostada no esterno.',
    clinica:
      'A dilatação preenche o espaço retroesternal claro no perfil — um dos poucos sinais radiográficos diretos de sobrecarga ventricular direita.',
    alerta:
      'Porque não faz borda na PA, um ventrículo direito muito aumentado pode dar índice cardiotorácico quase normal: o perfil não é opcional quando a suspeita é direita.',
  },
  'Átrio esquerdo': {
    resumo:
      'Câmara posterior que recebe as veias pulmonares; é a estrutura cardíaca mais posterior.',
    identificar:
      'No perfil, ocupa a porção superior da borda posterior do coração, abaixo da carina.',
    clinica:
      'Seu aumento produz duplo contorno na borda direita, elevação do brônquio principal esquerdo (ângulo da carina alargado), deslocamento posterior do esôfago e retificação do arco atrial esquerdo.',
    alerta:
      'É a câmara cujo aumento mais engana na PA: a silhueta pode parecer normal enquanto o átrio cresce para trás.',
  },
  'Confluência VCS-ázigos': {
    resumo:
      'Ponto onde a veia ázigos desemboca na veia cava superior, no ângulo traqueobrônquico direito.',
    identificar:
      'Pequena densidade oval no ângulo entre a traqueia e o brônquio principal direito, no alto do contorno mediastinal direito.',
    clinica:
      'O calibre da ázigos responde ao estado volêmico e à pressão venosa central: acima de ~10 mm em ortostase sugere hipervolemia ou insuficiência cardíaca; reduz-se com hipovolemia.',
    alerta:
      'Em decúbito a ázigos normalmente ingurgita — não interprete calibre aumentado em filme deitado como sobrecarga.',
  },
  'Traqueia': {
    resumo:
      'Via aérea central cartilaginosa, da laringe à carina, visível como coluna de ar de baixa densidade.',
    identificar:
      'Faixa escura vertical na linha média do pescoço e mediastino superior, com discreto desvio fisiológico à direita ao passar pelo arco aórtico.',
    clinica:
      'É o primeiro item do roteiro ABCDE. Desvio *para* o lado da lesão indica perda de volume (atelectasia, fibrose); desvio *contralateral* indica efeito de massa (pneumotórax hipertensivo, derrame volumoso, massa).',
    alerta:
      'Rotação do paciente desvia aparentemente a traqueia. Cheque clavículas e processos espinhosos antes de chamar desvio de verdadeiro.',
  },
  'Esterno': {
    resumo:
      'Osso chato anterior formado por manúbrio, corpo e processo xifoide.',
    identificar:
      'Só se individualiza no perfil, como faixa densa anterior que delimita o espaço retroesternal claro.',
    clinica:
      'Procure degrau cortical e hematoma retroesternal no trauma. Fratura esternal associa-se a contusão miocárdica e a lesões da coluna torácica.',
    alerta:
      'O espaço retroesternal claro é tão informativo quanto o osso: sua obliteração aponta massa do mediastino anterior ou aumento de câmaras direitas.',
  },
  'Escápula': {
    resumo:
      'Osso triangular plano que conecta úmero e clavícula e desliza sobre o gradil costal.',
    identificar:
      'No perfil de tórax, aparece como duas linhas oblíquas sobrepostas aos campos pulmonares posteriores; no ombro, é a lâmina que sustenta a glenoide.',
    clinica:
      'Avalie continuidade das bordas, dos ângulos e do colo. Fratura escapular denuncia trauma de alta energia; procure costelas, pneumotórax e lesão do plexo.',
    alerta:
      'A borda medial sobreposta ao pulmão é confundida com linha pleural — a escápula se estende além do gradil, a pleura não.',
  },
  'Pedículos': {
    resumo:
      'Pilares ósseos curtos que unem o corpo vertebral ao arco posterior, formando as paredes laterais do canal.',
    identificar:
      'Na incidência frontal são os pares de anéis ovais densos sobre cada corpo vertebral, como "olhos de coruja".',
    clinica:
      'A simetria dos pares confirma ausência de rotação; a distância interpedicular deve aumentar suavemente em direção caudal na coluna lombar. Erosão ou desaparecimento de um pedículo ("coruja piscando") é sinal clássico de metástase.',
    alerta:
      'Alargamento abrupto da distância interpedicular em um nível sugere fratura por explosão com componente de canal — não é variação anatômica.',
  },

  // ───────────────────────────── Crânio e face ─────────────────────────────
  'Osso frontal': {
    resumo:
      'Osso da porção anterior da calota, que forma a testa e o teto das órbitas.',
    identificar:
      'Densidade curva superior nas duas incidências; no perfil, delimita o contorno anterior do crânio até a glabela.',
    clinica:
      'Procure descontinuidade cortical, afundamento e linhas radiotransparentes de bordas nítidas. Fratura frontal levanta risco de lesão do seio frontal e de fístula liquórica.',
    alerta:
      'A sutura metópica persistente corre na linha média e é uma variante normal em cerca de 10% dos adultos — não é fratura.',
  },
  'Osso parietal': {
    resumo:
      'Par de ossos que forma a maior parte do teto e das paredes laterais da calota craniana.',
    identificar:
      'No perfil, ocupa a convexidade superior entre as suturas coronal e lambdoide.',
    clinica:
      'É o local mais comum de fratura linear de calota. Percorra a curva completa procurando linhas que atravessem sulcos vasculares e suturas.',
    alerta:
      'Sulcos das artérias meníngeas médias são radiotransparentes e ramificados, com bordas escleróticas — fraturas são retas, mais escuras e sem esclerose.',
  },
  'Osso occipital': {
    resumo:
      'Osso posteroinferior que contém o forame magno e se articula com o atlas.',
    identificar:
      'Contorno posterior do crânio no perfil, descendo até a base e a junção craniocervical.',
    clinica:
      'Fratura occipital é marcador de trauma de alta energia e associa-se a lesão de fossa posterior e da junção craniocervical.',
    alerta:
      'A sutura lambdoide e os ossos wormianos que a habitam simulam fragmentos — reconheça o trajeto serrilhado típico da sutura.',
  },
  'Osso temporal': {
    resumo:
      'Osso lateral da base que aloja as estruturas auditivas, o processo mastoide e a articulação temporomandibular.',
    identificar:
      'Na incidência frontal, sua porção petrosa é a barra densa horizontal projetada sobre as órbitas; no perfil, a área densa acima do conduto auditivo.',
    clinica:
      'Compare a densidade das duas porções petrosas e a aeração das mastoides. Fratura de temporal cursa com hemotímpano, otorragia, paralisia facial e perda auditiva.',
    alerta:
      'A radiografia simples é insuficiente para o osso temporal: a suspeita clínica manda direto para tomografia de alta resolução.',
  },
  'Osso esfenoide': {
    resumo:
      'Osso central da base do crânio, em forma de borboleta, que abriga a sela túrcica e o seio esfenoidal.',
    identificar:
      'No perfil, a área na porção central da base, à frente da porção petrosa e abaixo da fossa anterior; as asas maiores formam o "S" esfenoidal.',
    clinica:
      'Nível líquido no seio esfenoidal em um politraumatizado é sinal indireto de fratura da base do crânio.',
    alerta:
      'A sobreposição de estruturas na base torna a leitura radiográfica pouco confiável: use-a para suspeitar, nunca para excluir.',
  },
  'Osso zigomático': {
    resumo:
      'Osso da bochecha, que se articula com maxila, frontal, temporal e esfenoide formando o arco zigomático.',
    identificar:
      'Contorno lateral da órbita descendo para a eminência malar; o arco projeta-se lateralmente na incidência frontal.',
    clinica:
      'É o centro da fratura tripé (zigomático-maxilar): procure degrau na borda infraorbitária, na sutura frontozigomática e no arco, com opacificação do seio maxilar homolateral.',
    alerta:
      'Rotação mínima da cabeça cria assimetria zigomática convincente — julgue a técnica antes de descrever afundamento.',
  },
  'Maxila': {
    resumo:
      'Osso que forma a arcada dentária superior, o assoalho orbitário e as paredes do seio maxilar.',
    identificar:
      'Densidade central inferior da face, entre as órbitas e a mandíbula, contendo os alvéolos dentários superiores.',
    clinica:
      'Base da classificação de Le Fort. Procure descontinuidade dos pilares, opacificação sinusal e alteração de oclusão dentária.',
    alerta:
      'Sobreposição dentária e do palato produz linhas transparentes horizontais que imitam traços de fratura.',
  },
  'Mandíbula': {
    resumo:
      'Único osso móvel da face, em forma de ferradura, com corpo, ângulo, ramo, côndilo e processo coronoide.',
    identificar:
      'Arco denso inferior da face; no frontal, corpo e ângulos são bem visíveis, os ramos sobem em direção às ATMs.',
    clinica:
      'Fratura mandibular é frequentemente dupla, porque o anel se quebra em dois pontos: encontrada uma, procure ativamente a segunda, sobretudo no côndilo contralateral.',
    alerta:
      'A sobreposição da coluna cervical na linha média esconde fraturas de sínfise — a panorâmica ou a tomografia resolve.',
  },
  'Septo nasal': {
    resumo:
      'Parede osteocartilaginosa mediana que divide as fossas nasais, formada por lâmina perpendicular do etmoide e vômer.',
    identificar:
      'Linha vertical densa na linha média, entre as duas fossas nasais transparentes.',
    clinica:
      'Desvios são muito comuns e, isolados, têm pouco valor radiográfico; a relevância é maior no trauma nasal com obstrução.',
    alerta:
      'A porção cartilaginosa anterior não é vista na radiografia: um septo "normal" no filme não exclui desvio sintomático.',
  },
  'Sutura coronal': {
    resumo:
      'Articulação fibrosa entre o osso frontal e os parietais.',
    identificar:
      'No perfil, linha transparente que sobe da região pterional em direção ao vértice, com trajeto previsível e serrilhado.',
    clinica:
      'Serve de referência anatômica e de controle: conhecer as suturas evita chamar de fratura o que é normal.',
    alerta:
      'Suturas têm bordas corticais escleróticas e trajeto anatômico conhecido; fraturas são mais radiotransparentes, retas e cruzam sulcos vasculares sem respeitar limites ósseos.',
  },
  'Sutura lambdoide': {
    resumo:
      'Articulação entre os parietais e o occipital, em forma de lambda.',
    identificar:
      'Linha serrilhada oblíqua na região posterior do crânio no perfil.',
    clinica:
      'Frequentemente contém ossos wormianos (suturais). Numerosos ossos wormianos apontam para osteogênese imperfeita, disostose cleidocraniana e outras displasias.',
    alerta:
      'É a sutura mais confundida com fratura occipital pela orientação oblíqua — compare com o lado oposto.',
  },
  'Processo mastoide': {
    resumo:
      'Projeção óssea pneumatizada do temporal, atrás do pavilhão auricular.',
    identificar:
      'Área com padrão em favo de mel logo atrás e abaixo do conduto auditivo externo, no perfil.',
    clinica:
      'Compare a aeração dos dois lados. Velamento com perda das septações sugere mastoidite — quadro que exige avaliação de complicação intracraniana.',
    alerta:
      'Velamento mastóideo pode ser apenas efusão de via aérea superior; a correlação clínica separa efusão de mastoidite coalescente.',
  },
  'Sela túrcica': {
    resumo:
      'Depressão do corpo do esfenoide que aloja a hipófise, limitada pelos processos clinoides.',
    identificar:
      'No perfil, a pequena "cadeira" na porção central da base, imediatamente atrás do plano esfenoidal.',
    clinica:
      'Avalie tamanho, profundidade do assoalho e integridade do dorso. Alargamento com duplo assoalho, erosão de clinoides ou dorso adelgaçado sugere massa selar.',
    alerta:
      'Sela pequena e sela vazia parcialmente aumentada são variantes comuns: o achado radiográfico só orienta a pedir ressonância.',
  },
  'Seio frontal': {
    resumo:
      'Cavidade aérea no osso frontal, acima das órbitas, muito variável em tamanho e frequentemente assimétrica.',
    identificar:
      'Transparência de contorno festonado acima da glabela, com septo mediano incompleto.',
    clinica:
      'Procure opacificação, nível líquido e espessamento mucoso. No trauma, fratura da parede posterior implica risco de fístula liquórica e complicação intracraniana.',
    alerta:
      'A assimetria acentuada e até a agenesia unilateral são normais — não confunda um seio pequeno com um seio velado.',
  },
  'Seio maxilar': {
    resumo:
      'Maior dos seios paranasais, ocupando o corpo da maxila, com o assoalho da órbita como teto.',
    identificar:
      'Transparências triangulares pareadas abaixo das órbitas, com paredes finas e nítidas.',
    clinica:
      'Compare aeração, contorno das paredes e espessura mucosa. Nível hidroaéreo aponta sinusite aguda ou, no trauma, hemossinus por fratura de assoalho orbitário.',
    alerta:
      'Rotação e má angulação criam falsa assimetria de transparência: confirme a simetria orbitária e petrosa antes de descrever velamento.',
  },
  'Seio esfenoidal': {
    resumo:
      'Cavidade aérea no corpo do esfenoide, imediatamente abaixo da sela túrcica.',
    identificar:
      'Transparência central profunda no perfil, sob a sela; na incidência frontal, projeta-se sobre as fossas nasais.',
    clinica:
      'Nível líquido nesse seio em politrauma é um dos sinais indiretos mais úteis de fratura de base de crânio.',
    alerta:
      'Sua profundidade na linha média torna a avaliação frontal pouco confiável — use o perfil ou a tomografia.',
  },
  'Células etmoidais': {
    resumo:
      'Conjunto de pequenas cavidades aéreas entre as órbitas e as fossas nasais, divididas em grupos anterior, médio e posterior.',
    identificar:
      'Padrão areolar transparente entre os globos oculares, medialmente às paredes orbitárias mediais.',
    clinica:
      'São a via mais comum de disseminação de infecção sinusal para a órbita (celulite orbitária), sobretudo em crianças.',
    alerta:
      'A radiografia simples avalia mal o etmoide: uma imagem "normal" não exclui etmoidite em criança com edema periorbitário.',
  },
  'Células mastoideas': {
    resumo:
      'Rede de cavidades aéreas comunicantes dentro do processo mastoide, contínuas com a orelha média.',
    identificar:
      'Trabeculado fino e aerado atrás do conduto auditivo; compare lado a lado no mesmo filme.',
    clinica:
      'A perda de septações com opacificação — e não apenas o velamento — é o que caracteriza mastoidite coalescente e indica avaliação cirúrgica.',
    alerta:
      'O grau de pneumatização varia muito entre indivíduos; mastoide esclerótica pode refletir otite crônica antiga, e não doença aguda.',
  },
  'Lâmina cribriforme / teto olfatório': {
    resumo:
      'Porção horizontal e perfurada do etmoide, que separa a cavidade nasal da fossa craniana anterior e dá passagem aos filetes olfatórios.',
    identificar:
      'Fina linha densa na linha média superior das fossas nasais, entre as órbitas.',
    clinica:
      'É um ponto de fragilidade da base anterior: fratura aqui cursa com anosmia, rinorreia liquórica e risco de meningite.',
    alerta:
      'A finura e a sobreposição tornam essa região praticamente ilegível na radiografia — suspeita clínica manda para tomografia.',
  },

  // ───────────────────────────── Abdome ─────────────────────────────
  'Gás na flexura hepática': {
    resumo:
      'Ar contido na angulação do cólon entre o ascendente e o transverso, sob o lobo hepático direito.',
    identificar:
      'Transparência com haustrações no quadrante superior direito, abaixo da borda inferior do fígado.',
    clinica:
      'Ajuda a delimitar o contorno hepático e a confirmar que a transparência subdiafragmática direita é intraluminal, e não pneumoperitônio.',
    alerta:
      'Quando o cólon se interpõe entre fígado e diafragma, o quadro imita ar livre: a presença de haustrações dentro da transparência resolve a dúvida.',
  },
  'Fígado': {
    resumo:
      'Maior víscera sólida, ocupando o quadrante superior direito e cruzando a linha média pelo lobo esquerdo.',
    identificar:
      'Densidade homogênea de partes moles no hipocôndrio direito, com borda inferior delineada pelo gás do cólon e pela gordura peritoneal.',
    clinica:
      'Estime o tamanho pelo deslocamento da flexura hepática e do rim direito. A radiografia detecta apenas hepatomegalia importante, calcificações e aerobilia.',
    alerta:
      'Ar na árvore biliar (ramificado, central) e ar na veia porta (periférico, atinge a cápsula) têm significados diferentes e prognósticos muito distintos.',
  },
  'Baço': {
    resumo:
      'Órgão linfoide no quadrante superior esquerdo, entre o estômago, o diafragma e o rim esquerdo.',
    identificar:
      'Densidade curva no hipocôndrio esquerdo, mais bem vista quando delineada pela gordura e pelo gás do estômago e do ângulo esplênico.',
    clinica:
      'Esplenomegalia desloca a bolha gástrica medialmente e o ângulo esplênico do cólon para baixo — sinais indiretos úteis quando o órgão em si não se delimita.',
    alerta:
      'Baço normal frequentemente não é individualizado na radiografia simples: não vê-lo não é achado.',
  },
  'Estômago': {
    resumo:
      'Víscera oca entre esôfago e duodeno, com fundo posterossuperior à esquerda.',
    identificar:
      'Transparência gasosa em faixa no quadrante superior esquerdo, com pregas rugosas grosseiras quando distendido.',
    clinica:
      'Distensão gástrica maciça pode indicar obstrução pilórica, gastroparesia ou volvo gástrico — este último é emergência.',
    alerta:
      'É a referência para conferir posição de sonda nasogástrica: a ponta precisa estar abaixo do diafragma e projetada sobre a câmara gástrica.',
  },
  'Rins': {
    resumo:
      'Órgãos retroperitoneais pares, situados entre T12 e L3, com o direito discretamente mais baixo pelo fígado.',
    identificar:
      'Contornos ovais de partes moles ao lado da coluna, visíveis graças à gordura perirrenal.',
    clinica:
      'Avalie tamanho (cerca de três corpos vertebrais), eixo e contorno; procure calcificações projetadas sobre o trajeto urinário.',
    alerta:
      'Cálculos coraliformes podem ser confundidos com gás intestinal sobreposto; e a radiografia não vê cálculos de ácido úrico, que são radiotransparentes.',
  },
  'Músculos psoas': {
    resumo:
      'Músculos retroperitoneais que descem da coluna lombar até o pequeno trocânter, delineados pela gordura.',
    identificar:
      'Duas linhas oblíquas em "V" invertido, divergindo da coluna lombar em direção à pelve.',
    clinica:
      'O apagamento unilateral é sinal inespecífico de processo retroperitoneal — hematoma, abscesso, massa —, mas só tem valor quando o outro lado está nítido.',
    alerta:
      'Em pacientes magros, com pouca gordura retroperitoneal, e em filmes rodados, o contorno some sem qualquer doença.',
  },
  'Intestino delgado': {
    resumo:
      'Segmento entre piloro e válvula ileocecal, com posição predominantemente central no abdome.',
    identificar:
      'Alças de calibre menor (até ~3 cm), centrais, com pregas finas e numerosas que atravessam toda a luz.',
    clinica:
      'Dilatação acima de 3 cm com níveis hidroaéreos escalonados e cólon vazio caracteriza o padrão de obstrução de delgado.',
    alerta:
      'Níveis hidroaéreos isolados também ocorrem em gastroenterite e íleo adinâmico: o padrão de distribuição, e não o nível em si, faz o diagnóstico.',
  },
  'Válvulas coniventes': {
    resumo:
      'Pregas circulares (de Kerckring) da mucosa do delgado, dispostas perpendicularmente ao eixo da alça.',
    identificar:
      'Linhas finas, próximas entre si, que cruzam toda a largura da alça de parede a parede ("pilha de moedas").',
    clinica:
      'São o critério morfológico que distingue delgado de cólon em uma alça dilatada — decisão que muda todo o raciocínio da obstrução.',
    alerta:
      'Quando muito espessadas e com alça pouco distendida, sugerem edema de parede: isquemia, hipoalbuminemia ou enterite.',
  },
  'Intestino grosso': {
    resumo:
      'Do ceco ao reto, ocupando a periferia do abdome como uma moldura em torno do delgado.',
    identificar:
      'Alças periféricas, de maior calibre, com haustrações espaçadas e conteúdo fecal moteado.',
    clinica:
      'Ceco acima de 9 cm ou cólon acima de 6 cm é dilatação preocupante; ceco muito distendido tem risco de perfuração por lei de Laplace.',
    alerta:
      'A imagem em "grão de café" que se projeta do quadrante inferior esquerdo em direção ao hipocôndrio direito é volvo de sigmoide até prova em contrário.',
  },
  'Haustrações': {
    resumo:
      'Saculações da parede colônica produzidas pelas tênias, separadas por pregas semilunares.',
    identificar:
      'Indentações espaçadas que não atravessam completamente a luz da alça.',
    clinica:
      'Sua presença marca cólon; a perda de haustrações em cólon dilatado, com parede fina, compõe o quadro de megacólon tóxico.',
    alerta:
      'O cólon crônico da colite ulcerativa perde haustrações e vira um "tubo liso" — achado crônico, não agudo.',
  },
  'Reto': {
    resumo:
      'Segmento terminal do intestino grosso, na linha média da pelve, à frente do sacro.',
    identificar:
      'Transparência central baixa na pelve, muitas vezes com conteúdo fecal, projetada sobre o sacro.',
    clinica:
      'Gás retal presente favorece íleo adinâmico ou obstrução parcial; ausência completa em quadro suboclusivo apoia obstrução distal completa.',
    alerta:
      'A avaliação é indireta: sangramento, massa e obstrução retal exigem toque, endoscopia ou tomografia, não radiografia.',
  },

  // ───────────────────────────── Ombro ─────────────────────────────
  'Extremidade acromial da clavícula': {
    resumo:
      'Terço lateral da clavícula, que se articula com o acrômio formando a articulação acromioclavicular.',
    identificar:
      'Ponta lateral da clavícula, logo acima do processo do acrômio.',
    clinica:
      'A borda inferior da clavícula deve estar alinhada com a borda inferior do acrômio. Degrau nesse alinhamento indica luxação acromioclavicular.',
    alerta:
      'Um espaço acromioclavicular assimétrico pode decorrer de rotação: comparar com o lado oposto ou usar incidência com carga aumenta a segurança.',
  },
  'Extremidade esternal da clavícula': {
    resumo:
      'Terço medial da clavícula, articulado com o manúbrio na articulação esternoclavicular.',
    identificar:
      'Ponta medial arredondada, junto à linha média, acima do primeiro arco costal.',
    clinica:
      'É a referência clássica para julgar rotação na radiografia de tórax. Luxação esternoclavicular posterior é rara e perigosa pela proximidade de traqueia e grandes vasos.',
    alerta:
      'A sobreposição da coluna e do manúbrio torna a articulação difícil de avaliar: a suspeita clínica pede tomografia.',
  },
  'Cabeça do úmero': {
    resumo:
      'Superfície articular esférica proximal do úmero, que se apoia na cavidade glenoidal.',
    identificar:
      'Esfera densa medial e superior no úmero proximal, encaixada na glenoide.',
    clinica:
      'Avalie esfericidade, contorno cortical e congruência glenoumeral. Na luxação anterior, desloca-se medial e inferiormente ("subcoracoide").',
    alerta:
      'O sinal da "lâmpada" — cabeça arredondada com rotação interna fixa — na AP indica luxação posterior, que é o diagnóstico mais perdido do ombro.',
  },
  'Colo anatômico do úmero': {
    resumo:
      'Sulco estreito imediatamente distal à superfície articular, na inserção da cápsula.',
    identificar:
      'Linha oblíqua sutil que separa a superfície articular da cabeça umeral dos dois tubérculos.',
    clinica:
      'Fratura nesse nível é rara, porém grave: interrompe o suprimento arterial da cabeça e leva a osteonecrose.',
    alerta:
      'É facilmente confundido com o colo cirúrgico; a diferença anatômica muda inteiramente o prognóstico vascular.',
  },
  'Colo cirúrgico do úmero': {
    resumo:
      'Estreitamento metafisário abaixo dos tubérculos, ponto mais frágil do úmero proximal.',
    identificar:
      'Transição entre a região tuberositária alargada e a diáfise cilíndrica.',
    clinica:
      'Sítio mais comum de fratura do úmero proximal, sobretudo em idosos após queda. O nervo axilar e a artéria circunflexa posterior correm ali — teste sensibilidade deltóidea.',
    alerta:
      'Fraturas impactadas podem se manifestar apenas como uma banda de esclerose e um degrau cortical mínimo: compare as corticais nas duas incidências.',
  },
  'Tubérculo maior': {
    resumo:
      'Proeminência lateral do úmero proximal, inserção de supraespinal, infraespinal e redondo menor.',
    identificar:
      'Saliência lateral na AP em rotação externa, onde o contorno umeral se alarga.',
    clinica:
      'Fratura por avulsão acompanha luxação anterior e simula lesão do manguito no exame clínico. Desvio maior que 5 mm costuma indicar cirurgia.',
    alerta:
      'Em rotação interna o tubérculo maior gira para posterior e some do perfil lateral — a fratura pode desaparecer do filme.',
  },
  'Tubérculo menor': {
    resumo:
      'Proeminência anterior do úmero proximal, inserção do subescapular.',
    identificar:
      'Saliência anteromedial, mais bem perfilada com o braço em rotação interna.',
    clinica:
      'Avulsão do tubérculo menor é o marcador ósseo clássico da luxação posterior do ombro.',
    alerta:
      'Sua avaliação depende da rotação: uma única AP em rotação externa pode escondê-lo por completo.',
  },
  'Cavidade glenoidal': {
    resumo:
      'Superfície articular rasa da escápula que recebe a cabeça umeral.',
    identificar:
      'Elipse densa na porção lateral da escápula; na AP verdadeira (com ~40° de obliquidade) suas bordas anterior e posterior se sobrepõem.',
    clinica:
      'Avalie congruência e o espaço glenoumeral. Fratura da borda anteroinferior (lesão de Bankart óssea) acompanha luxação anterior recidivante.',
    alerta:
      'Na AP convencional a glenoide aparece de perfil oblíquo e o espaço articular parece falsamente irregular — a AP verdadeira de Grashey resolve.',
  },
  'Processo coracoide': {
    resumo:
      'Projeção anterior em gancho da escápula, origem do bíceps curto e do coracobraquial.',
    identificar:
      'Densidade em vírgula projetada medialmente à cabeça umeral, abaixo da clavícula.',
    clinica:
      'É o reparo que nomeia a luxação anterior "subcoracoide". Fratura isolada é rara e sugere trauma direto ou avulsão.',
    alerta:
      'A sobreposição sobre a cabeça umeral produz uma imagem densa que pode ser lida como lesão de Hill-Sachs em quem não conhece o reparo.',
  },
  'Tubérculo supraglenoidal': {
    resumo:
      'Pequena elevação acima da glenoide, origem da cabeça longa do bíceps.',
    identificar:
      'Pequeno relevo no polo superior da elipse glenoidal, na transição para a base do processo coracoide.',
    clinica:
      'Avulsão nesse ponto corresponde à lesão SLAP com componente ósseo — bem mais bem avaliada por artrorressonância.',
  },
  'Tubérculo infraglenoidal': {
    resumo:
      'Elevação abaixo da glenoide, origem da cabeça longa do tríceps.',
    identificar:
      'Ponto ósseo no polo inferior da glenoide, na transição para a borda lateral da escápula.',
    clinica:
      'Serve de reparo do polo inferior glenoidal, onde se buscam fraturas de borda após luxação anterior.',
  },
  'Ângulo superior': {
    resumo:
      'Vértice superomedial da escápula, ao nível aproximado de T2.',
    identificar:
      'Canto superior interno do triângulo escapular, onde as bordas superior e medial se encontram.',
    clinica:
      'Reparo para conferir posicionamento e altura escapular; útil na avaliação de escápula alada e assimetria de cintura.',
  },
  'Ângulo inferior': {
    resumo:
      'Vértice inferior da escápula, ao nível aproximado de T7.',
    identificar:
      'Ponta inferior do triângulo, o reparo escapular mais fácil de achar no filme.',
    clinica:
      'É referência de contagem costal e de nível vertebral, além de marcador da posição escapular na cintura.',
  },
  'Ângulo lateral': {
    resumo:
      'Porção lateral espessada da escápula que sustenta a cavidade glenoidal.',
    identificar:
      'Região densa entre a borda lateral e a glenoide, chamada colo da escápula.',
    clinica:
      'Fratura do colo escapular pode desestabilizar o ombro quando associada a fratura de clavícula (ombro flutuante), situação que muda a indicação cirúrgica.',
  },
  'Borda medial': {
    resumo:
      'Margem vertebral da escápula, paralela à coluna torácica.',
    identificar:
      'Linha reta longa mais próxima da coluna, sobreposta ao gradil costal.',
    clinica:
      'É o reparo para avaliar escápula alada e assimetrias de posicionamento.',
    alerta:
      'A causa número um de falso pneumotórax na radiografia de tórax: acompanhe a linha e veja se ela sai do gradil.',
  },
  'Borda lateral': {
    resumo:
      'Margem axilar espessa da escápula, que sobe do ângulo inferior até a glenoide.',
    identificar:
      'Linha densa oblíqua, mais espessa que a medial, apontando para a articulação.',
    clinica:
      'Faz parte do "anel escapular" avaliado no trauma: descontinuidade aqui indica fratura de corpo com trauma de alta energia.',
  },
  'Borda superior': {
    resumo:
      'Margem mais curta e fina da escápula, que se estende até a incisura escapular.',
    identificar:
      'Linha superior curta entre o ângulo superior e a base do coracoide.',
    clinica:
      'Reparo para localizar a incisura escapular e o trajeto do nervo supraescapular.',
  },
  'Incisura da escápula': {
    resumo:
      'Entalhe na borda superior, medial ao coracoide, por onde passa o nervo supraescapular.',
    identificar:
      'Pequena concavidade na margem superior, imediatamente medial à base do processo coracoide.',
    clinica:
      'Ponto de compressão do nervo supraescapular; a síndrome cursa com atrofia de supra e infraespinal e dor profunda no ombro.',
    alerta:
      'A radiografia raramente demonstra a causa da compressão (cisto paralabral, ligamento ossificado): a suspeita clínica pede ressonância.',
  },
  'Tuberosidade deltoidea': {
    resumo:
      'Rugosidade na face lateral da diáfise umeral, no ponto de inserção do deltoide.',
    identificar:
      'Espessamento cortical discreto no terço médio lateral do úmero.',
    clinica:
      'Reparo anatômico da diáfise; é útil como referência para localizar o trajeto do nervo radial no sulco espiral, logo posterior a ela.',
    alerta:
      'A irregularidade cortical fisiológica dessa inserção pode ser confundida com reação periosteal em quem não a conhece.',
  },
  'Úmero': {
    resumo:
      'Osso longo do braço, da cabeça articular proximal ao capítulo e à tróclea distais.',
    identificar:
      'Diáfise cilíndrica central do braço, entre a cintura escapular e o cotovelo.',
    clinica:
      'Percorra toda a cortical nas duas incidências. Fratura de terço médio arrisca o nervo radial: teste a extensão do punho antes e depois de qualquer manipulação.',
    alerta:
      'Uma radiografia de úmero deve incluir ombro e cotovelo; fraturas segmentares e luxações associadas escapam de filmes centrados só na dor.',
  },

  // ───────────────────────────── Joelho e perna ─────────────────────────────
  'Côndilo femoral lateral': {
    resumo:
      'Superfície articular lateral da extremidade distal do fêmur, que se apoia no platô tibial lateral.',
    identificar:
      'Na AP, o côndilo do lado da fíbula; no perfil verdadeiro, sobrepõe-se quase inteiramente ao medial.',
    clinica:
      'Sede da impactação óssea associada à ruptura do ligamento cruzado anterior; procure irregularidade do sulco condilar terminal.',
    alerta:
      'A não sobreposição dos côndilos no perfil indica rotação e invalida a maioria das medidas de alinhamento.',
  },
  'Côndilo femoral medial': {
    resumo:
      'Superfície articular medial do fêmur distal, maior e mais projetada distalmente que o lateral.',
    identificar:
      'Côndilo do lado oposto à fíbula na AP; sua projeção distal maior é o que gera o ângulo fisiológico em valgo.',
    clinica:
      'Local frequente de osteonecrose espontânea do joelho e de osteocondrite dissecante na sua face lateral, junto à incisura.',
  },
  'Patela': {
    resumo:
      'Maior osso sesamoide do corpo, dentro do tendão do quadríceps, aumentando o braço de alavanca da extensão.',
    identificar:
      'Na AP projeta-se sobre a região intercondilar; no perfil, é o osso triangular anterior ao fêmur distal.',
    clinica:
      'Avalie altura (patela alta ou baixa), contorno e fraturas transversas com diástase. A relação de Insall-Salvati usa a razão entre tendão patelar e a altura da patela.',
    alerta:
      'A patela bipartita — fragmento no quadrante superolateral, com bordas corticais arredondadas — é variante normal e o falso-positivo mais comum de fratura.',
  },
  'Recesso suprapatelar': {
    resumo:
      'Extensão proximal da cavidade sinovial do joelho, entre o quadríceps e o fêmur distal.',
    identificar:
      'No perfil, a faixa de densidade de partes moles entre os coxins adiposos pré-femoral e suprapatelar.',
    clinica:
      'Distensão maior que 5 mm indica derrame articular. Um derrame após trauma agudo, com nível gorduroso (lipo-hemartrose), significa fratura intra-articular até prova em contrário.',
    alerta:
      'A lipo-hemartrose só aparece no perfil com raio horizontal: deitar o paciente e usar raio vertical apaga o nível.',
  },
  'Coxins adiposos': {
    resumo:
      'Acúmulos de gordura intracapsular e extrassinovial que envolvem a articulação e servem de marcador indireto de derrame.',
    identificar:
      'Áreas de menor densidade em torno da articulação, no perfil: no joelho, suprapatelar e pré-femoral; no cotovelo, anterior e posterior.',
    clinica:
      'O deslocamento dos coxins é frequentemente o único sinal radiográfico de uma fratura oculta — sobretudo no cotovelo da criança e no rádio proximal do adulto.',
    alerta:
      'Coxim adiposo posterior visível no cotovelo em perfil a 90° é sempre anormal; o anterior discretamente visível pode ser normal.',
  },
  'Fêmur': {
    resumo:
      'Osso mais longo do corpo, da cabeça articular no acetábulo aos côndilos do joelho.',
    identificar:
      'Diáfise cilíndrica única da coxa, com discreta convexidade anterior no perfil.',
    clinica:
      'Fratura diafisária é lesão de alta energia com perda sanguínea significativa. Fratura de baixa energia em diáfise femoral levanta suspeita de lesão patológica ou fratura atípica por bifosfonato.',
    alerta:
      'Espessamento cortical lateral focal com dor em coxa em usuário crônico de bifosfonato é fratura atípica incipiente — não é achado degenerativo.',
  },
  'Tíbia': {
    resumo:
      'Osso medial e de carga da perna, do platô articular ao maléolo medial.',
    identificar:
      'Osso mais espesso da perna, com face anteromedial subcutânea e ausência de cobertura muscular.',
    clinica:
      'Percorra as três corticais em ambas as incidências. Fratura de tíbia frequentemente é exposta e tem risco de síndrome compartimental.',
    alerta:
      'Fraturas por estresse podem se manifestar apenas como banda esclerótica ou reação periosteal sutil semanas após o início da dor.',
  },
  'Fíbula': {
    resumo:
      'Osso lateral fino da perna; suporta pouca carga, mas é essencial para a estabilidade do tornozelo.',
    identificar:
      'Osso delgado lateral, com cabeça proximal abaixo do platô lateral e maléolo lateral distalmente.',
    clinica:
      'Em lesão do tornozelo com dor medial, procure ativamente fratura do colo da fíbula proximal (Maisonneuve) — ela obriga a incluir o joelho no exame.',
    alerta:
      'Uma radiografia de tornozelo isolada não exclui Maisonneuve: sem incluir a fíbula proximal, a lesão passa despercebida.',
  },
  'Cabeça da fíbula': {
    resumo:
      'Extremidade proximal alargada da fíbula, articulada com a face posterolateral do platô tibial.',
    identificar:
      'Massa óssea arredondada lateral, logo abaixo do platô tibial lateral.',
    clinica:
      'Serve para confirmar o lado lateral do joelho. Avulsão da estilóide fibular ("sinal do arqueado") indica lesão do canto posterolateral.',
    alerta:
      'O nervo fibular comum contorna o colo: fratura ou imobilização apertada nessa altura provoca pé caído.',
  },
  'Colo da fíbula': {
    resumo:
      'Estreitamento logo distal à cabeça da fíbula, onde o nervo fibular comum contorna o osso.',
    identificar:
      'Segmento afilado imediatamente abaixo da cabeça fibular.',
    clinica:
      'Fratura aqui associa-se a lesão do nervo fibular comum e, no contexto de trauma do tornozelo, à lesão de Maisonneuve com ruptura sindesmótica.',
  },
  'Platô tibial lateral': {
    resumo:
      'Superfície articular lateral da tíbia proximal, discretamente convexa.',
    identificar:
      'Metade lateral do platô tibial, do lado da cabeça da fíbula na AP; sua superfície é discretamente convexa.',
    clinica:
      'É o platô mais fraturado, por mecanismo em valgo. Procure degrau articular e depressão: acima de 2 mm costuma mudar a conduta para cirúrgica.',
    alerta:
      'Fraturas com depressão pura são sutis na AP e frequentemente exigem tomografia para medir o afundamento.',
  },
  'Platô tibial medial': {
    resumo:
      'Superfície articular medial da tíbia proximal, côncava e mais robusta que a lateral.',
    identificar:
      'Metade medial do platô, oposta à fíbula; sua superfície é côncava e projeta-se discretamente mais distalmente que a lateral.',
    clinica:
      'Fratura do platô medial isolada indica trauma de energia alta e frequentemente vem acompanhada de lesão ligamentar e neurovascular.',
  },
  'Espinha tibial lateral': {
    resumo:
      'Tubérculo lateral da eminência intercondilar da tíbia, um dos dois picos centrais do platô.',
    identificar:
      'Pico ósseo lateral da eminência intercondilar, no centro do platô tibial na incidência AP.',
    clinica:
      'Faz parte do reparo central do joelho; a eminência é local de avulsão do ligamento cruzado anterior, sobretudo na criança e no adolescente.',
  },
  'Espinha tibial medial': {
    resumo:
      'Tubérculo medial da eminência intercondilar, local de inserção do cruzado anterior.',
    identificar:
      'Pico ósseo medial da eminência intercondilar, no centro do platô tibial, entre os dois côndilos femorais.',
    clinica:
      'Fragmento avulsionado nessa região é o equivalente ósseo pediátrico da ruptura do cruzado anterior e tem tratamento próprio.',
  },
  'Tendão do quadríceps': {
    resumo:
      'Tendão que insere o quadríceps no polo superior da patela.',
    identificar:
      'Faixa de partes moles anterior ao fêmur distal, acima da patela, delimitada pela gordura no perfil.',
    clinica:
      'A ruptura provoca patela baixa e perda da extensão ativa; procure a descontinuidade da faixa e um derrame associado.',
    alerta:
      'A radiografia mostra apenas o sinal indireto: a confirmação é ultrassonográfica ou por ressonância.',
  },
  'Tendão patelar': {
    resumo:
      'Tendão entre o polo inferior da patela e a tuberosidade da tíbia.',
    identificar:
      'Banda de partes moles retilínea abaixo da patela, no perfil.',
    clinica:
      'Sua altura define a relação de Insall-Salvati. Ruptura eleva a patela; a doença de Osgood-Schlatter fragmenta a tuberosidade tibial na inserção.',
  },
  'Tálus': {
    resumo:
      'Osso que transmite a carga da perna ao pé; não recebe inserção muscular e tem vascularização retrógrada.',
    identificar:
      'Osso encaixado entre os maléolos, acima do calcâneo, com a tróclea articulando-se com a tíbia distal.',
    clinica:
      'Fratura de colo do tálus tem alto risco de osteonecrose, proporcional ao desvio (classificação de Hawkins).',
    alerta:
      'A vascularização precária faz com que o desvio, e não o traço, seja o principal determinante do prognóstico.',
  },
  'Calcâneo': {
    resumo:
      'Maior osso do tarso, formando o calcanhar e sustentando o tálus.',
    identificar:
      'Osso posterior e inferior do pé, com tuberosidade posterior proeminente.',
    clinica:
      'Fratura por queda de altura reduz o ângulo de Böhler (normal 20-40°). Achada uma, procure fratura de coluna toracolombar e do calcâneo contralateral.',
    alerta:
      'Ângulo de Böhler achatado é frequentemente o único sinal de uma fratura intra-articular com afundamento.',
  },
  'Metatarsos': {
    resumo:
      'Cinco ossos longos entre o tarso e as falanges, formando o arco transverso do pé.',
    identificar:
      'Feixe de ossos longos paralelos no antepé, numerados de medial para lateral.',
    clinica:
      'A base do quinto metatarso é local clássico de avulsão e de fratura de Jones, com prognósticos e tratamentos distintos. Fraturas por estresse concentram-se no segundo e terceiro.',
    alerta:
      'A apófise da base do quinto metatarso, no adolescente, é longitudinal ao osso; a fratura de avulsão é transversa.',
  },

  // ───────────────────────────── Pelve e quadril ─────────────────────────────
  'Ílio': {
    resumo:
      'Maior dos três ossos do quadril, cuja asa forma a parede lateral da pelve maior.',
    identificar:
      'Grande lâmina óssea em leque acima do acetábulo, terminando na crista ilíaca.',
    clinica:
      'Percorra as linhas iliopectínea e ilioisquiática: descontinuidade sinaliza fratura acetabular envolvendo as colunas anterior e posterior.',
    alerta:
      'Gás intestinal sobreposto à asa ilíaca cria pseudolinhas de fratura; siga a linha até ver se ela respeita o contorno ósseo.',
  },
  'Crista ilíaca': {
    resumo:
      'Borda superior espessa da asa do ílio, entre as espinhas ilíacas anterossuperior e posterossuperior.',
    identificar:
      'Curva superior densa do osso ilíaco, palpável na cintura.',
    clinica:
      'Reparo para punção de medula e para o nível L4-L5 na punção lombar. A ossificação progressiva da apófise (sinal de Risser) estima a maturidade esquelética na escoliose.',
  },
  'Cristas ilíacas': {
    resumo:
      'As duas cristas, comparadas entre si, indicam nivelamento e rotação da pelve.',
    identificar:
      'As duas curvas superiores das asas ilíacas na incidência frontal.',
    clinica:
      'Diferença de altura entre elas em ortostase sugere discrepância de comprimento dos membros ou obliquidade pélvica com repercussão na coluna.',
    alerta:
      'Rotação pélvica no filme torna uma asa mais larga e a outra mais estreita: cheque a simetria dos forames obturatórios antes de medir.',
  },
  'Espinha ilíaca anterossuperior': {
    resumo:
      'Extremidade anterior da crista ilíaca, origem do sartório e do ligamento inguinal.',
    identificar:
      'Ponta óssea anterior e superior do ílio, no extremo anterior da crista ilíaca e lateral à asa.',
    clinica:
      'Local de avulsão apofisária em atletas adolescentes durante arranque de corrida; reparo palpável para medida de comprimento dos membros.',
  },
  'Espinha ilíaca anteroinferior': {
    resumo:
      'Proeminência abaixo da anterossuperior, origem da cabeça reta do reto femoral.',
    identificar:
      'Saliência óssea acima do teto acetabular, entre a anterossuperior e o acetábulo.',
    clinica:
      'Sede de avulsão do reto femoral em chutes e sprints; sua ossificação exuberante pode causar impacto subespinhal com bloqueio de flexão do quadril.',
  },
  'Corpo do púbis': {
    resumo:
      'Porção medial do púbis que se articula com o lado oposto na sínfise.',
    identificar:
      'Bloco ósseo mediano inferior, de cada lado da linha média pélvica.',
    clinica:
      'Faz parte do arco anterior do anel pélvico. Osteíte púbica produz irregularidade e esclerose das superfícies articulares.',
  },
  'Ramo superior do púbis': {
    resumo:
      'Braço que se estende do corpo do púbis até o acetábulo, formando o teto do forame obturatório.',
    identificar:
      'Barra óssea oblíqua ascendente e lateral a partir da sínfise.',
    clinica:
      'Fratura muito comum na queda do idoso; percorra também a região sacroilíaca do mesmo lado, porque o anel raramente quebra em um único ponto.',
    alerta:
      'Fratura de ramo púbico em idoso com dor persistente e radiografia duvidosa merece ressonância: fratura sacral por insuficiência é frequentemente oculta.',
  },
  'Ramo inferior do púbis': {
    resumo:
      'Braço descendente do púbis, que se funde ao ramo do ísquio formando o arco isquiopúbico.',
    identificar:
      'Barra óssea inferior e medial, contornando o forame obturatório por baixo.',
    clinica:
      'Compõe o arco anterior; fratura isolada é estável, mas a busca ativa de segunda lesão continua obrigatória.',
    alerta:
      'A sincondrose isquiopúbica na criança é irregular e assimétrica por natureza — não é fratura nem lesão lítica.',
  },
  'Tubérculo púbico': {
    resumo:
      'Pequena proeminência na borda superior do corpo do púbis, inserção medial do ligamento inguinal.',
    identificar:
      'Saliência na margem superior do púbis, próxima da sínfise.',
    clinica:
      'Reparo anatômico que separa hérnia inguinal (superomedial ao tubérculo) de hérnia femoral (inferolateral).',
  },
  'Sínfise púbica': {
    resumo:
      'Articulação cartilaginosa mediana entre os dois corpos púbicos.',
    identificar:
      'Espaço central estreito na linha média inferior da pelve.',
    clinica:
      'Largura normal até cerca de 5 mm no adulto. Diástase maior indica lesão em livro aberto do anel pélvico, com risco hemorrágico alto.',
    alerta:
      'Um degrau vertical entre os corpos púbicos é ainda mais preocupante que a simples diástase: sinaliza instabilidade vertical.',
  },
  'Espinha isquiática': {
    resumo:
      'Projeção posteromedial do ísquio, entre as incisuras isquiáticas maior e menor.',
    identificar:
      'Ponta óssea medial que se projeta no interior da pelve, medial ao acetábulo.',
    clinica:
      'Reparo do bloqueio do nervo pudendo e referência do plano das espinhas na obstetrícia. Sua proeminência excessiva na radiografia sugere retroversão acetabular.',
  },
  'Tuberosidade isquiática': {
    resumo:
      'Robusta proeminência inferior do ísquio, apoio do corpo sentado e origem dos isquiotibiais.',
    identificar:
      'Massa óssea inferior e lateral, abaixo do forame obturatório.',
    clinica:
      'Local de avulsão apofisária em atletas jovens e de bursite isquiática; a apófise pode permanecer aberta até por volta dos 25 anos.',
    alerta:
      'A apófise não fundida é simétrica e com bordas corticais; a avulsão é assimétrica e dolorosa à palpação.',
  },
  'Forame obturatório': {
    resumo:
      'Grande abertura entre os ramos púbicos e isquiáticos, fechada em vida pela membrana obturatória.',
    identificar:
      'Anel transparente oval de cada lado, abaixo do acetábulo.',
    clinica:
      'A comparação dos dois forames é o teste rápido de rotação da pelve: rotação torna um menor e o outro maior.',
    alerta:
      'Não julgue simetria de asas ilíacas, colos femorais ou espaço articular do quadril antes de conferir os forames obturatórios.',
  },
  'Estreito superior da pelve': {
    resumo:
      'Anel ósseo que separa a pelve maior da menor, formado pelo promontório, linhas arqueadas e borda superior da sínfise.',
    identificar:
      'Contorno oval contínuo que se desenha do promontório sacral às linhas iliopectíneas até o púbis.',
    clinica:
      'Sua continuidade é o teste estrutural do anel pélvico. Uma quebra em qualquer ponto obriga a procurar a segunda, quase sempre presente.',
    alerta:
      'Fraturas posteriores (sacro, sacroilíaca) são as que sangram e as mais fáceis de perder na radiografia frontal.',
  },
  'Sacro': {
    resumo:
      'Osso triangular formado por cinco vértebras fundidas, que transmite a carga da coluna para os ossos do quadril.',
    identificar:
      'Bloco ósseo central triangular na pelve, com forames sacrais como pares de arcos transparentes.',
    clinica:
      'Avalie a continuidade das linhas arqueadas dos forames: sua interrupção é o sinal radiográfico mais confiável de fratura sacral.',
    alerta:
      'Gás retal sobreposto ao sacro imita e esconde fraturas; dor persistente com radiografia normal merece ressonância.',
  },
  'Cóccix': {
    resumo:
      'Segmento terminal da coluna, formado por três a cinco vértebras rudimentares fundidas.',
    identificar:
      'Pequena estrutura curva inferior ao sacro, na linha média.',
    clinica:
      'Coccidínia raramente muda de conduta com a radiografia, porque angulação e segmentação variam muito no normal.',
    alerta:
      'A grande variação anatômica torna quase impossível afirmar fratura de cóccix por imagem isolada; o diagnóstico é clínico.',
  },
  'Articulação sacroilíaca': {
    resumo:
      'Articulação entre a face auricular do sacro e a do ílio, com porções sinovial e ligamentar.',
    identificar:
      'Faixa oblíqua transparente entre sacro e ílio, com duas linhas por lado devido à obliquidade.',
    clinica:
      'Espaço deve ser uniforme, de 2 a 4 mm. Erosão, esclerose subcondral e anquilose compõem a sacroiliíte das espondiloartrites.',
    alerta:
      'A obliquidade natural gera duas linhas por articulação e cria falsa impressão de irregularidade em filmes rodados.',
  },
  'Articulações sacroilíacas': {
    resumo:
      'As duas articulações comparadas entre si, base da avaliação de sacroiliíte e de estabilidade do anel posterior.',
    identificar:
      'Duas faixas oblíquas simétricas ladeando o sacro na incidência frontal.',
    clinica:
      'A sacroiliíte da espondilite anquilosante é tipicamente bilateral e simétrica; a das artrites reativa e psoriásica tende a ser assimétrica.',
    alerta:
      'Alargamento assimétrico após trauma de alta energia significa disjunção sacroilíaca — lesão instável e potencialmente hemorrágica.',
  },
  'Acetábulo': {
    resumo:
      'Cavidade formada pela fusão de ílio, ísquio e púbis, que recebe a cabeça femoral.',
    identificar:
      'Concavidade em taça na face lateral do osso do quadril, delimitada pelo teto e pelas paredes anterior e posterior.',
    clinica:
      'Avalie as seis linhas de Judet: iliopectínea, ilioisquiática, teto, gota de lágrima, parede anterior e parede posterior. Cada uma quebrada aponta um padrão de fratura diferente.',
    alerta:
      'O sinal do cruzamento entre as paredes anterior e posterior indica retroversão acetabular, causa de impacto femoroacetabular.',
  },
  'Acetábulos': {
    resumo:
      'Os dois acetábulos avaliados em conjunto, o que revela displasia, protrusão e assimetria de cobertura.',
    identificar:
      'As duas cavidades articulares na incidência frontal da pelve.',
    clinica:
      'Compare cobertura do teto, profundidade e ângulo de Wiberg. Cobertura reduzida bilateral aponta displasia do desenvolvimento; protrusão bilateral aponta doença metabólica ou inflamatória.',
  },
  'Cabeça do fêmur': {
    resumo:
      'Superfície articular esférica proximal do fêmur, coberta por cartilagem exceto na fóvea.',
    identificar:
      'Esfera densa encaixada no acetábulo, com contorno cortical contínuo.',
    clinica:
      'Deve ser esférica e congruente. Achatamento, esclerose em faixa subcondral e o sinal do crescente são estágios sucessivos de osteonecrose.',
    alerta:
      'Na fase inicial da osteonecrose a radiografia é normal: dor com fatores de risco (corticoide, álcool, anemia falciforme) manda pedir ressonância.',
  },
  'Cabeças femorais': {
    resumo:
      'As duas cabeças comparadas, base da avaliação de altura, esfericidade e congruência na pelve.',
    identificar:
      'Duas esferas simétricas nos acetábulos, na incidência frontal.',
    clinica:
      'Diferença de altura sugere luxação, displasia, epifisiólise ou colapso por necrose. Compare também densidade e largura do espaço articular.',
    alerta:
      'Na epifisiólise proximal do fêmur, a linha de Klein traçada pela borda superior do colo deixa de cruzar a epífise — sinal sutil na AP e frequentemente visível só na incidência em rã.',
  },
  'Colo do fêmur': {
    resumo:
      'Ponte óssea entre a cabeça e a região trocantérica, orientada em cerca de 125° com a diáfise.',
    identificar:
      'Segmento estreito entre a esfera articular e os trocânteres.',
    clinica:
      'Fratura de colo é intracapsular e ameaça a vascularização da cabeça — daí a preferência por artroplastia em desviadas do idoso. Siga as corticais superior e inferior separadamente.',
    alerta:
      'Fratura impactada em valgo pode aparecer só como uma banda de esclerose e um degrau mínimo na cortical: dor com carga e radiografia normal pedem ressonância.',
  },
  'Trocânter maior': {
    resumo:
      'Proeminência lateral na junção do colo com a diáfise, inserção dos glúteos médio e mínimo.',
    identificar:
      'Massa óssea lateral proeminente na junção do colo com a diáfise femoral, palpável na face lateral do quadril.',
    clinica:
      'Reparo palpável para medida de comprimento e sede de bursite trocantérica. Fratura isolada é rara e sugere avulsão ou lesão patológica.',
  },
  'Trocânter menor': {
    resumo:
      'Proeminência posteromedial do fêmur proximal, inserção do iliopsoas.',
    identificar:
      'Pequena projeção medial abaixo do colo; sua visibilidade depende da rotação do membro.',
    clinica:
      'É o melhor indicador de rotação: muito proeminente significa rotação externa, o que costuma acompanhar fratura de quadril.',
    alerta:
      'Fratura isolada do trocânter menor no adulto sem trauma é sinal de lesão patológica — quase sempre metástase — até prova em contrário.',
  },
  'Espaço articular do quadril': {
    resumo:
      'Distância radiográfica entre cabeça femoral e acetábulo, correspondente à cartilagem articular.',
    identificar:
      'Faixa transparente uniforme entre as duas superfícies articulares.',
    clinica:
      'Redução do espaço, esclerose subcondral, cistos e osteófitos formam a tétrade da osteoartrose. O padrão de redução superolateral é o mais típico.',
    alerta:
      'A largura muda com rotação e com carga: comparar sempre no mesmo tipo de incidência e, quando possível, em ortostase.',
  },

  // ───────────────────────────── Coluna cervical ─────────────────────────────
  'Processos transversos': {
    resumo:
      'Projeções laterais dos arcos vertebrais; na coluna cervical contêm o forame transversário para a artéria vertebral.',
    identificar:
      'Projeções laterais pareadas em cada nível na incidência frontal.',
    clinica:
      'Fratura de processo transverso cervical envolve o forame e levanta a hipótese de lesão da artéria vertebral. Na lombar, associa-se a lesão renal e retroperitoneal.',
    alerta:
      'Fratura de processo transverso lombar não é lesão isolada inocente: procure hematoma retroperitoneal e lesão de órgão sólido.',
  },
  'Arco anterior do atlas (C1)': {
    resumo:
      'Segmento anterior do anel de C1, que se articula com a face anterior do odontoide.',
    identificar:
      'No perfil, pequeno bloco ósseo oval à frente do processo odontoide.',
    clinica:
      'O intervalo atlanto-odontoide deve ser até 3 mm no adulto e até 5 mm na criança. Alargamento indica lesão do ligamento transverso.',
    alerta:
      'Em artrite reumatoide a instabilidade atlantoaxial pode ser silenciosa e é motivo de cuidado adicional na intubação.',
  },
  'Arco posterior do atlas (C1)': {
    resumo:
      'Segmento posterior do anel de C1, que completa o canal vertebral e sustenta a linha espinolaminar.',
    identificar:
      'Arco fino posterior no perfil, entre o occipital e o processo espinhoso de C2.',
    clinica:
      'A linha espinolaminar de C1 a C3 deve formar curva suave; desvio maior que 2 mm indica lesão. Fratura de Jefferson envolve arcos anterior e posterior.',
    alerta:
      'Defeito congênito de fusão do arco posterior é variante comum: bordas corticais lisas e ausência de edema clínico ajudam a diferenciar de fratura.',
  },
  'Processo odontoide (dente)': {
    resumo:
      'Projeção superior do corpo de C2 que funciona como pivô da rotação da cabeça.',
    identificar:
      'Estrutura vertical central na incidência transoral, entre as massas laterais de C1.',
    clinica:
      'As fraturas do odontoide seguem a classificação de Anderson-D\'Alonzo; o tipo II, na base, é o mais comum e o de maior risco de pseudartrose.',
    alerta:
      'A sobreposição dos incisivos e do occipital cria linhas transparentes horizontais que imitam fratura de base — repita a incidência antes de concluir.',
  },
  'Massas laterais do atlas (C1)': {
    resumo:
      'Pilares laterais de C1 que sustentam os côndilos occipitais e se articulam com C2.',
    identificar:
      'Blocos ósseos quadrangulares de cada lado do odontoide na incidência transoral.',
    clinica:
      'As bordas laterais de C1 devem alinhar-se com as de C2. Deslocamento lateral somado maior que 7 mm caracteriza fratura de Jefferson com ruptura do ligamento transverso.',
    alerta:
      'Rotação da cabeça produz assimetria dos espaços entre dente e massas laterais sem qualquer lesão — o achado só vale em incidência simétrica.',
  },
  'Massas laterais do áxis (C2)': {
    resumo:
      'Pilares laterais de C2 que recebem a carga de C1 pelas articulações atlantoaxiais laterais.',
    identificar:
      'Blocos ósseos abaixo das massas de C1, separados por espaços articulares simétricos.',
    clinica:
      'Compare os dois espaços articulares e o alinhamento das bordas laterais para detectar subluxação rotatória atlantoaxial.',
  },
  'Processo espinhoso do áxis (C2)': {
    resumo:
      'Processo espinhoso bífido e volumoso de C2, o maior reparo posterior cervical alto.',
    identificar:
      'Grande projeção posterior logo abaixo do arco posterior de C1.',
    clinica:
      'Ancoragem da linha espinolaminar; na espondilolistese traumática (fratura do enforcado), o corpo de C2 desliza anteriormente enquanto o arco posterior permanece.',
  },
  'Processos articulares superiores': {
    resumo:
      'Facetas voltadas para cima em cada vértebra, que se articulam com os processos inferiores da vértebra acima.',
    identificar:
      'No perfil cervical, formam com os inferiores a coluna de "pilares articulares" posterior aos corpos.',
    clinica:
      'Devem estar empilhados como telhas. Perda desse padrão indica luxação facetária uni ou bilateral.',
    alerta:
      'A luxação facetária unilateral produz o "sinal da gravata borboleta": acima do nível lesado o perfil vira oblíquo e abaixo permanece verdadeiro.',
  },
  'Processos articulares inferiores': {
    resumo:
      'Facetas voltadas para baixo, que se articulam com os processos superiores da vértebra subjacente.',
    identificar:
      'Componente inferior de cada pilar articular no perfil, articulado com a faceta superior da vértebra de baixo.',
    clinica:
      'Fratura ou salto de faceta desestabiliza o segmento e comprime a raiz correspondente.',
  },
  'Facetas articulares': {
    resumo:
      'Superfícies das articulações zigapofisárias, que orientam e limitam o movimento vertebral.',
    identificar:
      'Superfícies planas paralelas entre processos articulares adjacentes.',
    clinica:
      'A orientação das facetas define o movimento do segmento; degeneração facetária é causa comum de dor axial e de estenose foraminal.',
  },
  'Articulações zigapofisárias': {
    resumo:
      'Articulações sinoviais entre processos articulares de vértebras vizinhas, também chamadas interapofisárias.',
    identificar:
      'Espaços articulares paralelos e regulares na coluna posterior, no perfil.',
    clinica:
      'Espaços devem ser uniformes e as facetas paralelas. Divergência, alargamento ou perda de paralelismo indica lesão ligamentar ou luxação.',
    alerta:
      'A artrose facetária é achado quase universal após a meia-idade; correlacione com o quadro clínico antes de atribuir a dor a ela.',
  },
  'Espaços discais intervertebrais': {
    resumo:
      'Espaços radiotransparentes entre corpos vertebrais, ocupados pelos discos intervertebrais.',
    identificar:
      'Faixas transparentes regulares entre os platôs vertebrais adjacentes.',
    clinica:
      'Estreitamento focal com esclerose e osteófitos indica degeneração; estreitamento com erosão dos platôs e destruição sugere espondilodiscite infecciosa.',
    alerta:
      'A radiografia não mostra o disco em si: hérnia discal e compressão radicular não se diagnosticam por radiografia simples.',
  },
  'Forames intervertebrais': {
    resumo:
      'Aberturas laterais entre pedículos de vértebras adjacentes, por onde saem as raízes nervosas.',
    identificar:
      'Anéis transparentes ovais, mais bem perfilados nas incidências oblíquas cervicais.',
    clinica:
      'Estreitamento por osteófitos uncovertebrais ou facetários corresponde ao substrato da radiculopatia cervical.',
    alerta:
      'Rotação inadequada altera o calibre aparente do forame nos dois sentidos — compare níveis apenas em uma oblíqua bem posicionada.',
  },
  'Pars interarticularis': {
    resumo:
      'Segmento ósseo entre os processos articulares superior e inferior de uma mesma vértebra.',
    identificar:
      'Istmo estreito no arco posterior, entre as facetas superior e inferior.',
    clinica:
      'Defeito da pars é espondilólise; quando bilateral, permite o deslizamento anterior do corpo (espondilolistese ístmica), típica de L5.',
    alerta:
      'Na oblíqua lombar, o defeito aparece como a "coleira no pescoço do cachorrinho escocês" — sinal clássico, embora hoje a tomografia seja mais sensível.',
  },

  // ───────────────────────────── Cotovelo, punho e mão ─────────────────────────────
  'Capítulo do úmero': {
    resumo:
      'Eminência arredondada lateral do úmero distal, que se articula com a cabeça do rádio.',
    identificar:
      'Superfície esférica lateral na extremidade distal do úmero.',
    clinica:
      'A linha radiocapitelar — eixo do colo do rádio prolongado — deve cruzar o capítulo em qualquer incidência; se não cruza, há luxação da cabeça do rádio.',
    alerta:
      'Na criança com "cotovelo puxado" ou fratura de ulna, essa linha é o que revela a luxação de Monteggia; ela é o passo mais esquecido do roteiro.',
  },
  'Tróclea do úmero': {
    resumo:
      'Superfície em carretel do úmero distal medial, que se articula com a incisura troclear da ulna.',
    identificar:
      'Superfície articular medial em forma de polia, entre os epicôndilos.',
    clinica:
      'Sua congruência com a incisura troclear define a estabilidade em flexoextensão; fraturas intra-articulares aqui exigem redução anatômica.',
  },
  'Epicôndilo medial': {
    resumo:
      'Proeminência medial do úmero distal, origem da musculatura flexora-pronadora.',
    identificar:
      'Saliência medial acima da tróclea, posterior ao plano da articulação.',
    clinica:
      'Sede da epicondilite medial. Na criança, a avulsão pode se alojar dentro da articulação e ser confundida com a tróclea ainda não ossificada.',
    alerta:
      'A ordem de ossificação (CRITOE) é obrigatória na criança: se há núcleo troclear sem núcleo do epicôndilo medial, o "núcleo" é na verdade um epicôndilo avulsionado e encarcerado.',
  },
  'Epicôndilo lateral': {
    resumo:
      'Proeminência lateral do úmero distal, origem da musculatura extensora-supinadora.',
    identificar:
      'Saliência lateral do úmero distal, imediatamente acima do capítulo e da interlinha umerorradial.',
    clinica:
      'Sede da epicondilite lateral ("cotovelo de tenista"), diagnóstico clínico — a radiografia serve para excluir outras causas.',
  },
  'Crista supracondilar lateral': {
    resumo:
      'Crista óssea que sobe do epicôndilo lateral pela borda lateral da diáfise umeral.',
    identificar:
      'Borda lateral levemente elevada da diáfise umeral, subindo a partir do epicôndilo lateral em direção proximal.',
    clinica:
      'Compõe a coluna lateral do úmero distal; sua integridade orienta o planejamento de fraturas supracondilares.',
  },
  'Crista supracondilar medial': {
    resumo:
      'Crista óssea que sobe do epicôndilo medial pela borda medial da diáfise.',
    identificar:
      'Borda medial elevada da diáfise umeral, subindo a partir do epicôndilo medial em direção proximal.',
    clinica:
      'Coluna medial do úmero distal; o processo supracondilar, variante rara nessa crista, pode comprimir o nervo mediano e a artéria braquial.',
  },
  'Fossa do olécrano': {
    resumo:
      'Depressão posterior do úmero distal que aloja o olécrano na extensão completa.',
    identificar:
      'Área de menor densidade entre as colunas medial e lateral do úmero distal na AP.',
    clinica:
      'Sua transparência é normal e reflete apenas a espessura óssea reduzida; corpos livres e osteófitos alojam-se ali e limitam a extensão.',
    alerta:
      'A transparência fisiológica da fossa é lida como lesão lítica por olhos destreinados — o contorno é regular e bilateral.',
  },
  'Cabeça do rádio': {
    resumo:
      'Extremidade proximal em disco do rádio, que gira contra o capítulo e a incisura radial da ulna.',
    identificar:
      'Disco ósseo lateral no cotovelo, articulado com o capítulo.',
    clinica:
      'Fratura mais comum do cotovelo adulto; frequentemente sutil, revelada apenas pelo deslocamento dos coxins adiposos.',
    alerta:
      'Com sinal de coxim adiposo positivo e nenhuma fratura visível, trate como fratura oculta de cabeça do rádio e reavalie em 7 a 10 dias.',
  },
  'Colo do rádio': {
    resumo:
      'Segmento estreito entre a cabeça do rádio e a tuberosidade radial.',
    identificar:
      'Estreitamento imediatamente distal ao disco articular do rádio.',
    clinica:
      'Sede frequente de fratura na criança; a angulação residual é o que define a conduta.',
  },
  'Tuberosidade do rádio': {
    resumo:
      'Rugosidade medial abaixo do colo, inserção do tendão distal do bíceps.',
    identificar:
      'Espessamento na face medial do rádio proximal, mais visível em supinação.',
    clinica:
      'Avulsão óssea nessa inserção indica ruptura do bíceps distal, lesão de tratamento cirúrgico precoce.',
  },
  'Incisura radial da ulna': {
    resumo:
      'Faceta lateral da ulna proximal que recebe a cabeça do rádio na articulação radioulnar proximal.',
    identificar:
      'Concavidade lateral da ulna, ao nível do processo coronoide.',
    clinica:
      'Junto ao ligamento anular, mantém a cabeça do rádio no lugar; sua incongruência acompanha instabilidade radioulnar proximal.',
  },
  'Processo coronoide': {
    resumo:
      'Projeção anterior da ulna proximal, que bloqueia a translação posterior do cotovelo.',
    identificar:
      'Bico ósseo anterior da ulna, abaixo da incisura troclear, mais bem visto no perfil.',
    clinica:
      'Compõe a "tríade terrível" com fratura da cabeça do rádio e luxação do cotovelo. Fragmentos pequenos indicam instabilidade importante.',
    alerta:
      'É pequeno e frequentemente perdido na AP: o perfil verdadeiro é indispensável.',
  },
  'Incisura troclear': {
    resumo:
      'Grande concavidade da ulna proximal que abraça a tróclea umeral.',
    identificar:
      'Curva côncava entre olécrano e processo coronoide, no perfil.',
    clinica:
      'A congruência dessa concavidade com a tróclea é o eixo da estabilidade do cotovelo em flexoextensão.',
  },
  'Olécrano': {
    resumo:
      'Projeção posterior proximal da ulna, inserção do tríceps e ponta palpável do cotovelo.',
    identificar:
      'Massa óssea posterior no perfil, encaixada na fossa do olécrano em extensão.',
    clinica:
      'Fratura com diástase impede a extensão ativa contra a gravidade e costuma requerer fixação.',
  },
  'Rádio': {
    resumo:
      'Osso lateral do antebraço, que gira em torno da ulna na pronossupinação.',
    identificar:
      'Osso do lado do polegar, mais estreito proximalmente e mais largo no punho.',
    clinica:
      'A fratura distal do rádio é a mais comum do esqueleto adulto. Avalie inclinação radial, altura radial e inclinação volar no perfil.',
    alerta:
      'Fratura de rádio distal com dor na articulação radioulnar distal pode esconder lesão de Galeazzi — inclua o antebraço todo.',
  },
  'Ulna': {
    resumo:
      'Osso medial do antebraço, que forma a maior parte da articulação do cotovelo e apenas parte do punho.',
    identificar:
      'Osso do lado do dedo mínimo, largo proximalmente e afilado no punho.',
    clinica:
      'A variância ulnar no punho influencia impacto ulnocarpal e lesões do complexo da fibrocartilagem triangular.',
    alerta:
      'Fratura isolada da diáfise ulnar obriga a examinar o cotovelo: pode ser Monteggia com luxação da cabeça do rádio.',
  },
  'Tuberosidade da ulna': {
    resumo:
      'Rugosidade abaixo do processo coronoide, inserção do músculo braquial.',
    identificar:
      'Espessamento na face anterior da ulna proximal, visível no perfil.',
    clinica:
      'Reparo anatômico da ulna proximal, útil para orientar o nível de fraturas do coronoide.',
  },
  'Processo estiloide do rádio': {
    resumo:
      'Projeção distal lateral do rádio, ancoragem de ligamentos radiocarpais.',
    identificar:
      'Ponta óssea distal do rádio, do lado do polegar, projetando-se cerca de 1 cm além do estiloide ulnar.',
    clinica:
      'Deve projetar-se cerca de 1 cm distalmente ao estiloide ulnar. A fratura de Hutchinson (do chauffeur) é intra-articular e desestabiliza o carpo.',
  },
  'Processo estiloide da ulna': {
    resumo:
      'Projeção distal da ulna, ancoragem do complexo da fibrocartilagem triangular.',
    identificar:
      'Ponta óssea distal da ulna, do lado do dedo mínimo, mais curta que o estiloide radial.',
    clinica:
      'Fratura de base associa-se a lesão do complexo triangular e a instabilidade radioulnar distal; fratura de ponta costuma ser benigna.',
  },
  'Escafoide': {
    resumo:
      'Osso em barco da fileira proximal do carpo, ponte entre as duas fileiras e o mais fraturado do carpo.',
    identificar:
      'Osso radial da fileira proximal, na base da tabaqueira anatômica.',
    clinica:
      'A vascularização é retrógrada, de distal para proximal: fratura do polo proximal tem alto risco de necrose e pseudartrose.',
    alerta:
      'Dor na tabaqueira com radiografia normal é fratura de escafoide até prova em contrário: imobilize e reavalie, ou peça ressonância.',
  },
  'Semilunar': {
    resumo:
      'Osso em meia-lua da fileira proximal, entre escafoide e piramidal, na coluna central do punho.',
    identificar:
      'Osso central da fileira proximal, entre o rádio e o capitato.',
    clinica:
      'Deve alinhar-se com rádio e capitato no perfil. Perda desse alinhamento define luxação perilunar ou do semilunar.',
    alerta:
      'Na AP, um semilunar triangular em vez de quadrangular é o sinal de luxação — a incidência frontal isolada engana quem não conhece o achado.',
  },
  'Piramidal': {
    resumo:
      'Osso ulnar da fileira proximal do carpo, que se articula com o hamato e o pisiforme.',
    identificar:
      'Osso mais ulnar da fileira proximal, parcialmente coberto pelo pisiforme na AP.',
    clinica:
      'Segundo osso do carpo mais fraturado; a fratura dorsal em lasca é vista sobretudo no perfil.',
  },
  'Pisiforme': {
    resumo:
      'Sesamoide dentro do tendão do flexor ulnar do carpo, sobre a face palmar do piramidal.',
    identificar:
      'Densidade oval sobreposta ao piramidal na AP; destaca-se em incidência oblíqua supinada.',
    clinica:
      'Forma a parede ulnar do canal de Guyon, onde o nervo ulnar pode ser comprimido.',
  },
  'Trapézio': {
    resumo:
      'Osso radial da fileira distal, articulado com o primeiro metacarpo em sela.',
    identificar:
      'Osso da base do polegar, distal ao escafoide e proximal ao primeiro metacarpo, com superfície em sela.',
    clinica:
      'A rizartrose (artrose trapeziometacárpica) é uma das artroses mais comuns e incapacitantes da mão.',
  },
  'Trapezoide': {
    resumo:
      'Menor osso da fileira distal, encaixado entre trapézio, capitato e o segundo metacarpo.',
    identificar:
      'Pequeno osso entre trapézio e capitato, na base do indicador.',
    clinica:
      'Fratura isolada é rara; sua lesão costuma indicar trauma carpal complexo.',
  },
  'Capitato': {
    resumo:
      'Maior osso do carpo, eixo central de movimento entre as duas fileiras.',
    identificar:
      'Osso central grande da fileira distal, encaixado na concavidade do semilunar.',
    clinica:
      'Rádio, semilunar e capitato devem formar uma linha reta no perfil neutro; o desvio define instabilidade DISI ou VISI.',
  },
  'Hamato': {
    resumo:
      'Osso ulnar da fileira distal, com o hâmulo projetando-se palmarmente.',
    identificar:
      'Osso distal do lado ulnar, articulado com o quarto e o quinto metacarpos.',
    clinica:
      'Fratura do hâmulo é típica de esportes com taco e ameaça o nervo ulnar no canal de Guyon; é mal vista na AP.',
    alerta:
      'Suspeita de fratura do hâmulo exige incidência de túnel do carpo ou tomografia — a radiografia padrão frequentemente é normal.',
  },
  'Metacarpos': {
    resumo:
      'Cinco ossos longos da palma, entre o carpo e as falanges proximais.',
    identificar:
      'Feixe de ossos longos paralelos, numerados do polegar para o dedo mínimo.',
    clinica:
      'A fratura do colo do quinto metacarpo (fratura do boxeador) é a mais frequente; a angulação aceitável aumenta do segundo para o quinto raio.',
    alerta:
      'Rotação residual, e não angulação, é o que provoca cruzamento de dedos na flexão — e ela se avalia clinicamente, não na radiografia.',
  },
  'Primeiro metacarpo': {
    resumo:
      'Metacarpo do polegar, mais curto e robusto, articulado em sela com o trapézio.',
    identificar:
      'Osso curto e largo na base do polegar, com plano de movimento próprio.',
    clinica:
      'Fratura de Bennett é intra-articular da base, com subluxação da diáfise pela tração do abdutor longo do polegar; a de Rolando é cominutiva em T ou Y.',
  },
  'Falanges proximais': {
    resumo:
      'Primeira fileira de falanges, articuladas com as cabeças dos metacarpos.',
    identificar:
      'Ossos longos logo distais às articulações metacarpofalângicas.',
    clinica:
      'Avalie desvio, rotação e comprometimento articular; fraturas da base condicionam rigidez se imobilizadas em posição inadequada.',
  },
  'Falanges médias': {
    resumo:
      'Fileira intermediária, presente do indicador ao dedo mínimo.',
    identificar:
      'Ossos entre as articulações interfalângicas proximal e distal.',
    clinica:
      'Fratura-luxação da base é lesão instável e frequentemente subestimada; o perfil de cada dedo é indispensável.',
  },
  'Falanges distais': {
    resumo:
      'Falanges terminais, que sustentam a polpa digital e a unha.',
    identificar:
      'Ossos mais distais de cada dedo, curtos e com tufo alargado na extremidade, sob o leito ungueal.',
    clinica:
      'Avulsão dorsal da base corresponde ao dedo em martelo; fratura do tufo é comum em esmagamento e frequentemente exposta pelo leito ungueal.',
  },
  'Falange proximal do polegar': {
    resumo:
      'Primeira falange do polegar, articulada com o primeiro metacarpo.',
    identificar:
      'Osso curto distal à articulação metacarpofalângica do polegar.',
    clinica:
      'Avulsão da base ulnar corresponde à lesão do ligamento colateral ulnar (polegar do esquiador), que pode exigir cirurgia quando há lesão de Stener.',
  },
  'Falange distal do polegar': {
    resumo:
      'Falange terminal do polegar, que sustenta a polpa e o leito ungueal do primeiro raio.',
    identificar:
      'Osso mais distal do polegar, curto e com tufo alargado na extremidade, distal à interfalângica.',
    clinica:
      'Fraturas de tufo acompanham esmagamento e lesão do leito ungueal; a conduta é sobretudo de partes moles.',
  },

  // ───────────────────────────── Coluna lombar / tronco ─────────────────────────────
  'Costelas': {
    resumo:
      'Doze pares de arcos que formam o gradil torácico e protegem as vísceras torácicas e abdominais superiores.',
    identificar:
      'Arcos posteriores mais horizontais e densos, arcos anteriores mais oblíquos e menos definidos.',
    clinica:
      'A contagem dos arcos posteriores mede a inspiração no tórax. Fraturas do primeiro ao terceiro arco indicam alta energia; do nono ao décimo segundo, lesão de fígado, baço e rim.',
    alerta:
      'Três ou mais costelas fraturadas em dois pontos configuram tórax instável — diagnóstico clínico com repercussão ventilatória imediata.',
  },
}

/** Fallback estruturado para nomes ainda sem dossiê dedicado. */
export function notaDeFallback(nome: string, regiaoTitulo: string): NotaEstrutura {
  const alvo = nome.toLowerCase()
  return {
    resumo: `A sobreposição do atlas demarca ${alvo} nesta incidência.`,
    identificar: `Localize a estrutura pela posição relativa aos reparos vizinhos e confirme-a alternando entre a imagem com e sem demarcação.`,
    clinica: `Avalie simetria, continuidade do contorno, densidade e alinhamento dentro do roteiro de leitura de ${regiaoTitulo.toLowerCase()}.`,
  }
}
