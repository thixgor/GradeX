/**
 * Dossiê aprofundado dos casos de Raio-X de tórax.
 *
 * `casos-raio-x.ts` guarda o esqueleto de cada tema: título, resumo, um
 * parágrafo de explicação, sinais e armadilhas. Isso é suficiente para
 * reconhecer o padrão, mas não para *entender* o filme — e é o entendimento
 * que sobrevive à prova e ao plantão.
 *
 * Este arquivo carrega a camada densa, em três eixos:
 *
 * 1. `mecanismo` — por que a imagem ficou assim. A física e a fisiopatologia
 *    que transformam a doença em densidade, linha ou desvio.
 * 2. `estruturas` — cada estrutura envolvida, dissecada em quatro perguntas:
 *    o que é, como aparece no filme normal, o que mudou neste caso e qual
 *    erro ela costuma provocar.
 * 3. `marcacoes` — o que exatamente cada marcação da imagem está apontando,
 *    por índice de imagem. É o texto que o visualizador revela no topo quando
 *    o aluno liga o modo "Com marcações": a marcação deixa de ser uma seta
 *    colorida e passa a ser uma frase que ensina.
 *
 * Sem entrada aqui, a página continua funcionando — a UI degrada para o
 * conteúdo base. Toda adição é aditiva por design.
 */

export type TipoMarcacao = 'achado' | 'medida' | 'referencia' | 'armadilha'

export interface AchadoMarcado {
  /** Nome curto do que está marcado. */
  titulo: string
  /** O que a marcação aponta e como reconhecê-la sem ela. */
  descricao: string
  tipo: TipoMarcacao
}

export interface EstruturaCaso {
  nome: string
  /** O que a estrutura é e onde fica. */
  anatomia: string
  /** Como ela se comporta num filme normal — o padrão de comparação. */
  normal: string
  /** O que mudou neste caso e por qual mecanismo. */
  neste: string
  /** Erro clássico ligado a esta estrutura. */
  alerta?: string
}

export interface DetalheCaso {
  mecanismo: string
  estruturas: EstruturaCaso[]
  /** Chave = índice da imagem (1-based), igual ao `indice` de `ImagemCasoRaioX`. */
  marcacoes: Record<number, AchadoMarcado[]>
  /** O que a radiografia não resolve e qual é o passo seguinte. */
  conduta?: string
}

const e = (nome: string, anatomia: string, normal: string, neste: string, alerta?: string): EstruturaCaso =>
  ({ nome, anatomia, normal, neste, alerta })

const m = (titulo: string, descricao: string, tipo: TipoMarcacao = 'achado'): AchadoMarcado =>
  ({ titulo, descricao, tipo })

// ══════════════════════════════════ Cardiovascular ══════════════════════════════════

const CARDIOVASCULAR: Record<string, DetalheCaso> = {
  cardiomegalia: {
    mecanismo:
      'O coração só aparece na radiografia porque músculo e sangue têm densidade de água e o pulmão ao redor é ar. Quando uma câmara dilata — por sobrecarga de volume, de pressão ou por miocardiopatia —, essa interface água/ar se desloca lateralmente e a silhueta cresce. A radiografia mede o envelope externo, não a espessura da parede: hipertrofia concêntrica pode cursar com silhueta normal, enquanto dilatação discreta já alarga o contorno.',
    estruturas: [
      e(
        'Silhueta cardíaca',
        'Contorno formado, à direita, por átrio direito e veia cava; à esquerda, por botão aórtico, tronco da pulmonar, apêndice atrial esquerdo e ventrículo esquerdo.',
        'Em PA bem feita, ocupa menos da metade da largura interna do tórax e dois terços dela ficam à esquerda da linha média.',
        'A maior largura transversa cresce progressivamente nos três exemplos: 53%, 68% e 79% do diâmetro torácico interno.',
        'Silhueta grande não é diagnóstico — é um achado que exige definir qual câmara cresceu e por quê.',
      ),
      e(
        'Bordas internas do gradil costal',
        'Face interna das costelas no ponto mais largo do tórax, logo acima dos seios costofrênicos.',
        'É o denominador do índice cardiotorácico: mede-se de cortical interna a cortical interna, nunca de pele a pele.',
        'Serve de régua nos três filmes; usar a borda externa reduz artificialmente o ICT e mascara cardiomegalia real.',
        'Derrame pleural, obesidade e escoliose distorcem esse denominador e invalidam a medida.',
      ),
      e(
        'Átrio esquerdo',
        'Câmara posterior, encostada no esôfago e sob a carina; na frontal não faz borda, ela se projeta por dentro da silhueta.',
        'Invisível no filme normal — só se percebe indiretamente pela ausência de duplo contorno e por uma carina de ângulo agudo.',
        'No terceiro exemplo dilata tanto que cria um segundo contorno dentro da borda cardíaca direita e abaula o apêndice atrial à esquerda.',
        'O duplo contorno direito é frequentemente confundido com massa; siga a linha — ela acompanha a curva atrial.',
      ),
      e(
        'Carina e brônquios principais',
        'Bifurcação traqueal apoiada sobre o teto do átrio esquerdo, ao nível de T4-T5.',
        'Ângulo de bifurcação habitualmente entre 60° e 75°, com brônquio direito mais vertical.',
        'O átrio esquerdo aumentado empurra o brônquio principal esquerdo para cima e abre a carina acima de 90°.',
        'Rotação e inspiração ruim alteram o ângulo aparente: confirme a técnica antes de valorizar a abertura.',
      ),
    ],
    marcacoes: {
      1: [
        m('Maior largura cardíaca', 'Segmento horizontal que soma a maior projeção à direita e à esquerda da linha média — o numerador do índice.', 'medida'),
        m('Maior largura torácica interna', 'Traçada entre as corticais internas das costelas no ponto mais largo; é o denominador do índice.', 'medida'),
        m('ICT de 53%', 'Discretamente acima do limite de 50%. Em PA tecnicamente adequada já configura cardiomegalia leve, sem dizer a causa.', 'medida'),
      ],
      2: [
        m('ICT de 68%', 'Aumento inequívoco: o coração ocupa mais de dois terços do tórax e a borda esquerda avança sobre o campo pulmonar.', 'medida'),
        m('Contorno globoso', 'A silhueta perde os ângulos habituais entre segmentos e assume aspecto arredondado, típico de dilatação de múltiplas câmaras.'),
      ],
      3: [
        m('ICT de 79%', 'Aumento maciço. Nesse território, medir tem menos valor que identificar qual câmara domina a silhueta.', 'medida'),
        m('Duplo contorno na borda direita', 'Segunda linha curva projetada dentro da silhueta: parede do átrio esquerdo dilatado vista através do coração.'),
        m('Carina alargada acima de 90°', 'O átrio esquerdo eleva o brônquio principal esquerdo e abre a bifurcação traqueal.'),
        m('Apêndice atrial esquerdo convexo', 'O segmento entre tronco da pulmonar e ventrículo esquerdo, normalmente retificado ou côncavo, torna-se saliente.'),
      ],
    },
    conduta:
      'O índice cardiotorácico levanta a suspeita; ecocardiograma define câmara, função e valva. Radiografia em AP, portátil, sentada ou com inspiração incompleta não permite calcular ICT — descreva a silhueta e repita em PA quando possível.',
  },

  'redistribuicao-vascular': {
    mecanismo:
      'Em pé, a gravidade dirige mais fluxo às bases: os vasos inferiores são normalmente mais calibrosos que os superiores. Quando a pressão do átrio esquerdo sobe (acima de ~15 mmHg), o edema perivascular e a vasoconstrição hipóxica das bases aumentam a resistência basal e o fluxo migra para os ápices. É a primeira etapa radiográfica da congestão — antes das linhas septais e muito antes do edema alveolar.',
    estruturas: [
      e(
        'Artérias pulmonares dos campos superiores',
        'Ramos segmentares que sobem do hilo em direção aos ápices, acompanhados pelos brônquios.',
        'Em ortostatismo, são visivelmente mais finos que os vasos basais à mesma distância do hilo.',
        'Tornam-se tão ou mais calibrosos que os vasos das bases — o "cefalização" ou redistribuição.',
        'Compare sempre vasos equidistantes do hilo; comparar um vaso apical com um basal proximal produz falso positivo.',
      ),
      e(
        'Interstício peribroncovascular',
        'Bainha de tecido conjuntivo que envolve artéria e brônquio até a periferia.',
        'Fino demais para ser visto; as paredes brônquicas aparecem como linhas quase imperceptíveis.',
        'Ingurgitado por líquido, borra o contorno dos vasos e espessa a parede brônquica vista de topo (cuffing peribrônquico).',
      ),
      e(
        'Seios costofrênicos',
        'Recessos pleurais mais baixos e laterais, onde o líquido se acumula primeiro no paciente em pé.',
        'Ângulos agudos e nítidos entre diafragma e parede lateral.',
        'Apagados por derrame, fechando a sequência congestão → edema intersticial → edema alveolar → derrame.',
      ),
    ],
    marcacoes: {
      1: [
        m('Vasos apicais proeminentes', 'Ramos dos campos superiores com calibre igual ou maior que os basais equivalentes: hipertensão venosa pulmonar.'),
        m('Linhas septais nas bases', 'Opacidades horizontais curtas tocando a pleura — septos interlobulares espessados por líquido.'),
        m('Opacidades alveolares', 'Preenchimento aéreo já estabelecido, sinal de que a congestão ultrapassou o interstício.'),
        m('Seios costofrênicos velados', 'Derrames pleurais bilaterais completando o quadro de congestão sistêmica.'),
      ],
    },
    conduta:
      'Redistribuição é sinal de pressão, não de volume absoluto — correlacione com peso, BNP e ecocardiograma. Em decúbito e em técnica AP a distribuição vascular muda por razões puramente posturais e o sinal perde valor.',
  },

  'edema-intersticial': {
    mecanismo:
      'Os septos interlobulares carregam veias e linfáticos e delimitam os lóbulos pulmonares secundários. Quando a pressão hidrostática vence a drenagem linfática, esses septos se enchem de líquido e ganham espessura suficiente para atenuar o feixe: aparecem como linhas. Só se tornam visíveis onde estão perpendiculares ao raio e tocam a pleura — daí a predileção pelas bases laterais.',
    estruturas: [
      e(
        'Septos interlobulares (linhas B de Kerley)',
        'Lâminas de tecido conjuntivo que separam lóbulos pulmonares secundários, com linfáticos e veias em seu interior.',
        'Invisíveis: têm espessura muito abaixo da resolução do método.',
        'Espessados por edema, formam linhas de 1 a 2 cm, horizontais, periféricas e que alcançam a superfície pleural.',
        'Linhas septais são específicas mas pouco sensíveis: sua ausência não exclui edema intersticial.',
      ),
      e(
        'Pleura visceral lateral',
        'Superfície que reveste o pulmão e recebe a extremidade dos septos.',
        'Contorno único, liso, encostado no gradil costal.',
        'É o ponto de chegada obrigatório das linhas B — o detalhe que as separa de vasos e cicatrizes.',
      ),
      e(
        'Vasos periféricos',
        'Ramos arteriais e venosos que se afilam da região central para a periferia.',
        'Ramificam-se, orientam-se em direção ao hilo e não tocam a pleura.',
        'São o principal imitador: no edema ficam borrados, o que aumenta a confusão com linhas septais.',
        'Uma linha que se bifurca é vaso; linha B não se ramifica.',
      ),
      e(
        'Sistema linfático pulmonar',
        'Rede de drenagem que corre nos septos e no interstício peribroncovascular até os linfonodos hilares.',
        'Não visível.',
        'Seu bloqueio, e não apenas a pressão venosa, também espessa septos — daí linhas B em linfangite carcinomatosa e sarcoidose.',
      ),
    ],
    marcacoes: {
      1: [m('Linhas B basais', 'Traços horizontais curtos na periferia da base, perpendiculares à parede e tocando a pleura.')],
      2: [
        m('Linhas B no seio costofrênico', 'Local de maior rendimento: amplie mentalmente essa janela em toda suspeita de insuficiência cardíaca.'),
        m('Interstício borrado', 'Perda de nitidez dos contornos vasculares ao redor — edema perivascular associado.'),
      ],
      3: [
        m('Linhas septais sutis', 'Poucas linhas, finas e discretas: o achado real costuma ser bem menos exuberante que o das ilustrações.'),
        m('Vaso periférico ramificado', 'Contraponto útil: ramifica-se, converge ao hilo e não alcança a pleura — não é linha B.', 'armadilha'),
      ],
    },
    conduta:
      'Interprete linhas septais dentro do contexto: com cardiomegalia e redistribuição, favorecem congestão; sem cardiopatia, considere linfangite carcinomatosa, sarcoidose, pneumonite viral e sobrecarga volêmica.',
  },

  'edema-alveolar': {
    mecanismo:
      'Quando a pressão capilar ultrapassa a capacidade de drenagem do interstício, o líquido rompe o epitélio alveolar e preenche o espaço aéreo. O ar que gerava contraste desaparece e surge consolidação: opacidade confluente, de margens indefinidas, frequentemente com broncogramas aéreos. A distribuição perihilar em asa de borboleta reflete a maior perfusão central e a melhor drenagem linfática periférica.',
    estruturas: [
      e(
        'Espaço aéreo perihilar',
        'Alvéolos das regiões centrais dos dois pulmões, ao redor dos hilos.',
        'Máxima transparência do filme, atravessada apenas por vasos.',
        'Preenchido por líquido, forma opacidade bilateral confluente que se irradia dos hilos — a "asa de borboleta".',
        'Pneumonia bilateral, hemorragia alveolar e proteinose podem reproduzir exatamente esse padrão.',
      ),
      e(
        'Brônquios centrais',
        'Vias aéreas cartilaginosas que emergem do hilo.',
        'Não visíveis dentro do pulmão aerado, por falta de contraste com o alvéolo cheio de ar.',
        'Tornam-se visíveis como broncogramas aéreos: colunas escuras contra o alvéolo opacificado.',
      ),
      e(
        'Periferia pulmonar (córtex)',
        'Faixa subpleural de 2 a 3 cm.',
        'Pobre em vasos, é a região mais escura do filme.',
        'No edema cardiogênico clássico permanece relativamente poupada, criando o contraste que desenha as "asas".',
      ),
      e(
        'Silhueta cardíaca e pleura',
        'Coração e recessos pleurais avaliados junto com o parênquima.',
        'ICT abaixo de 50% e seios livres.',
        'Cardiomegalia, linhas septais e derrames apoiam a origem cardiogênica; coração normal desloca a suspeita para causas não cardiogênicas.',
        'Coração de tamanho normal não exclui edema cardiogênico agudo — infarto extenso pode cursar com silhueta normal.',
      ),
    ],
    marcacoes: {
      1: [
        m('Opacidade perihilar bilateral', 'Consolidação confluente irradiando dos hilos, com periferia comparativamente poupada.'),
        m('Periferia preservada', 'A faixa subpleural mais escura é o que dá o desenho de asa de borboleta.', 'referencia'),
      ],
      2: [
        m('Predomínio unilateral', 'Distribuição assimétrica não afasta edema: decúbito preferencial, insuficiência mitral excêntrica e enfisema focal a explicam.'),
        m('Interface entre pulmão cheio e aerado', 'Margem indefinida, típica de preenchimento alveolar — diferente da borda nítida de um processo pleural.', 'referencia'),
      ],
      3: [
        m('Técnica AP portátil', 'Ampliação da silhueta e inspiração incompleta: o filme mostra a gravidade, mas não permite medir o coração.', 'armadilha'),
        m('Consolidação difusa aguda', 'Opacificação extensa dos dois campos, com broncogramas aéreos centrais.'),
      ],
      4: [
        m('Edema com silhueta cardíaca normal', 'Sem cardiomegalia, considere hipoalbuminemia, SDRA, lesão inalatória, neurogênico e sobrecarga iatrogênica.'),
        m('Distribuição mais periférica', 'O edema por lesão capilar tende a ser mais heterogêneo e periférico que o cardiogênico.'),
      ],
    },
    conduta:
      'A radiografia estabelece o padrão e a extensão; a causa vem de história, exame, ECG, marcadores e ecocardiograma. Melhora radiográfica atrasa horas em relação à clínica — não titule diurético apenas pelo filme.',
  },

  'derrame-pleural': {
    mecanismo:
      'O líquido pleural obedece à gravidade e ocupa primeiro os recessos posteriores e laterais. Como tem densidade de água e faz contato direto com o diafragma e o coração, apaga essas bordas (sinal da silhueta). A concavidade superior — o menisco — resulta da tensão superficial e da retração elástica do pulmão, não de um nível real inclinado.',
    estruturas: [
      e(
        'Recesso costofrênico posterior',
        'Ponto mais baixo do espaço pleural no paciente em pé, mais profundo atrás que lateralmente.',
        'Ângulo agudo e límpido na PA; ainda mais profundo no perfil.',
        'É o primeiro a velar: 50 a 75 mL já apagam o seio posterior no perfil, contra 200 mL ou mais na frontal.',
        'Um seio lateral livre não exclui derrame — o perfil é mais sensível.',
      ),
      e(
        'Hemidiafragmas',
        'Cúpulas musculotendíneas que separam tórax e abdome; a direita fica cerca de 1,5 a 2,5 cm mais alta.',
        'Contorno nítido em toda a extensão porque há ar de pulmão acima e ar/vísceras abaixo.',
        'Deixa de ser identificável onde o líquido encosta: mesma densidade de ambos os lados apaga a interface.',
      ),
      e(
        'Interface líquido-pulmão (menisco)',
        'Superfície superior da coleção, mais alta na parede lateral que no centro.',
        'Não existe no filme normal.',
        'Curva de concavidade superior que sobe pela parede — a assinatura de líquido pleural livre.',
        'Em decúbito o líquido lamina e produz apenas um véu difuso, sem menisco: derrame volumoso pode passar despercebido.',
      ),
      e(
        'Silhueta cardíaca e vasos pulmonares',
        'Contexto obrigatório do derrame na insuficiência cardíaca.',
        'ICT abaixo de 50% e vasos de base mais calibrosos.',
        'Cardiomegalia e redistribuição favorecem origem cardíaca; sua ausência amplia o diferencial.',
      ),
    ],
    marcacoes: {
      1: [
        m('Menisco bilateral', 'Concavidade superior nos dois lados, subindo pelas paredes laterais.'),
        m('Seios costofrênicos apagados', 'Perda do ângulo agudo habitual — primeiro sinal frontal de derrame.'),
        m('Sinais de congestão associados', 'Cardiomegalia e redistribuição vascular sustentam origem cardíaca.', 'referencia'),
      ],
      2: [
        m('Assimetria de volume', 'Derrame cardíaco pode ser francamente assimétrico, tipicamente maior à direita.'),
        m('Hemidiafragma apagado do lado do derrame', 'Sinal da silhueta: o contorno some onde o líquido encosta.'),
        m('Lado contralateral como controle', 'Compare a nitidez do outro hemidiafragma para calibrar o achado.', 'referencia'),
      ],
    },
    conduta:
      'Derrame unilateral volumoso, febril ou sem cardiopatia justifica ultrassom e toracocentese. O ultrassom à beira do leito supera a radiografia para detectar, quantificar e guiar punção.',
  },

  'derrame-pericardico': {
    mecanismo:
      'O saco pericárdico normalmente contém 15 a 50 mL. Como líquido e miocárdio têm a mesma densidade, o derrame não se distingue do músculo: apenas aumenta o envelope, tornando a silhueta grande, simétrica e de contornos suavizados — o clássico "coração em moringa". A repercussão hemodinâmica depende da velocidade de acúmulo, não do volume: 150 mL agudos tamponam, 1 L crônico pode não tamponar.',
    estruturas: [
      e(
        'Saco pericárdico',
        'Membrana fibrosserosa de dupla camada que envolve o coração e a raiz dos grandes vasos.',
        'Não individualizável na radiografia; contribui com uma fração milimétrica da silhueta.',
        'Distendido por líquido, arredonda a silhueta e apaga os ângulos entre os segmentos do contorno esquerdo.',
        'Radiografia não diagnostica tamponamento: essa é uma decisão clínica e ecocardiográfica.',
      ),
      e(
        'Contorno cardíaco esquerdo',
        'Sequência botão aórtico → tronco pulmonar → apêndice atrial esquerdo → ventrículo esquerdo.',
        'Segmentos identificáveis, com transições angulosas.',
        'Torna-se uma curva única e lisa: a perda dos ângulos é mais sugestiva que o tamanho absoluto.',
      ),
      e(
        'Vasculatura pulmonar',
        'Trama arterial e venosa que reflete o estado de enchimento.',
        'Nítida, com gradiente base-ápice preservado.',
        'A dissociação é a pista: coração muito grande e sem congestão pulmonar favorece derrame; com congestão, favorece falência ventricular.',
      ),
    ],
    marcacoes: {
      1: [
        m('Silhueta globosa', 'Contorno arredondado e simétrico, sem os ângulos habituais.'),
        m('Congestão pulmonar associada', 'Aqui coexistem derrame e falência: a radiografia não separa as duas contribuições.', 'referencia'),
      ],
      2: [
        m('Aumento pós-operatório da silhueta', 'Crescimento novo após cirurgia cardíaca, sem redistribuição vascular — padrão típico de coleção pericárdica.'),
        m('Fios de esternotomia', 'Contexto cirúrgico que sustenta a hipótese; confirme comparando com o filme pré-operatório.', 'referencia'),
      ],
      3: [
        m('Silhueta aumentada por derrame maligno', 'Envelope cardíaco alargado no contexto de doença metastática.'),
        m('Nódulos pulmonares', 'Metástases sustentando a etiologia neoplásica do derrame.'),
        m('Derrames pleurais associados', 'Comprometimento seroso combinado, frequente em carcinomatose.'),
      ],
    },
    conduta:
      'Ecocardiograma transtorácico é o exame decisivo: demonstra líquido, mede espessura e avalia colapso de câmaras. Hipotensão com turgência jugular e bulhas abafadas é tamponamento até prova em contrário — não espere imagem para agir.',
  },

  'calcificacoes-cardiacas': {
    mecanismo:
      'O cálcio atenua muito mais o feixe que partes moles, então mesmo depósitos finos aparecem se estiverem tangentes ao raio. O valor diagnóstico vem inteiramente da topografia e da forma: calcificação que segue o contorno externo é pericárdica; calcificação curvilínea numa região previamente infartada é aneurisma; calcificação nodular na topografia valvar é degeneração ou reumatismo.',
    estruturas: [
      e(
        'Parede do ventrículo esquerdo',
        'Miocárdio da borda cardíaca esquerda, região mais frequentemente infartada.',
        'Contorno liso, sem densidades internas.',
        'Após infarto transmural, a área discinética pode calcificar em casca de ovo e abaular localmente o contorno.',
        'Abaulamento focal do contorno esquerdo em paciente com infarto prévio sugere aneurisma, mesmo sem cálcio visível.',
      ),
      e(
        'Pericárdio',
        'Envelope fibroso do coração.',
        'Não visível.',
        'Calcifica após pericardite tuberculosa, urêmica, purulenta ou pós-cirúrgica, formando uma casca que acompanha o contorno cardíaco.',
        'Pericárdio calcificado não é sinônimo de constrição: o diagnóstico é hemodinâmico.',
      ),
      e(
        'Anel e valva mitral',
        'Estrutura fibrosa entre átrio e ventrículo esquerdos, projetada centralmente e um pouco à esquerda e abaixo da aórtica.',
        'Não visível.',
        'Calcificação em C ou vírgula na topografia mitral, achado comum e frequentemente benigno em idosos e renais crônicos.',
        'A projeção frontal sobrepõe as valvas: distinguir mitral de aórtica exige perfil ou tomografia.',
      ),
    ],
    marcacoes: {
      1: [
        m('Calcificação curvilínea da borda esquerda', 'Casca de cálcio delimitando aneurisma ventricular pós-infarto.'),
        m('Abaulamento focal do contorno', 'Deformidade localizada que não acompanha a curva normal do ventrículo.'),
      ],
      2: [
        m('Cálcio acompanhando o contorno cardíaco', 'Trajeto que segue o envelope externo, e não uma câmara — assinatura pericárdica.'),
        m('Extensão até o contorno direito', 'Envolvimento circunferencial aumenta a preocupação com constrição.'),
      ],
      3: [
        m('Calcificação na topografia mitral', 'Densidade nodular ou em vírgula projetada no centro da silhueta, abaixo e à esquerda do plano aórtico.'),
        m('Plano valvar aórtico como referência', 'Mais superior e anterior; o perfil separa as duas topografias com segurança.', 'referencia'),
      ],
    },
    conduta:
      'Tomografia sem contraste localiza e quantifica o cálcio; ecocardiograma mede repercussão funcional. Na suspeita de constrição, ressonância e cateterismo definem a fisiologia.',
  },

  'cardiopatias-congenitas': {
    mecanismo:
      'A radiografia não mostra o defeito: mostra suas consequências hemodinâmicas. Shunts esquerda-direita aumentam o fluxo pulmonar e dilatam artérias pulmonares e câmaras a montante; lesões obstrutivas geram dilatação pós-estenótica; lesões cianóticas com fluxo reduzido produzem pulmões hipovascularizados. A pergunta útil é sempre a mesma: a vascularização está aumentada, normal ou reduzida?',
    estruturas: [
      e(
        'Tronco e artérias pulmonares centrais',
        'Segmento entre botão aórtico e apêndice atrial esquerdo, à esquerda, e artéria interlobar, à direita.',
        'Tronco discretamente convexo; artéria interlobar direita com até cerca de 16 mm.',
        'Desproporcionalmente grandes em relação ao botão aórtico — assinatura de hiperfluxo por shunt.',
        'Em jovens magros e mulheres o tronco é normalmente proeminente: compare com a aorta antes de valorizar.',
      ),
      e(
        'Botão aórtico',
        'Arco aórtico visto de perfil no contorno mediastinal superior esquerdo.',
        'Convexidade discreta, proporcional ao tronco pulmonar.',
        'Pequeno em relação à pulmonar nos shunts; na persistência do canal pode ser proeminente pelo fluxo aumentado.',
      ),
      e(
        'Vascularização periférica',
        'Trama vascular além do terço médio dos campos pulmonares.',
        'Vasos afilam progressivamente e quase somem na faixa subpleural.',
        'Vasos periféricos visíveis e calibrosos indicam plétora; trama esparsa indica hipofluxo.',
      ),
      e(
        'Arco aórtico e artefatos cirúrgicos',
        'Posição do arco e material implantado.',
        'Arco à esquerda em cerca de 99% das pessoas.',
        'Arco à direita associa-se a tetralogia de Fallot; fios, clipes e conduítes marcam o novo basal pós-correção.',
        'Sem a história cirúrgica, um pós-operatório estável pode ser lido como doença ativa.',
      ),
    ],
    marcacoes: {
      1: [
        m('Artérias pulmonares aumentadas', 'Hiperfluxo por shunt esquerda-direita ao nível atrial.'),
        m('Botão aórtico relativamente pequeno', 'A desproporção entre pulmonar e aorta é o sinal, mais que o tamanho isolado.', 'referencia'),
        m('Plétora periférica', 'Vasos identificáveis mais perto da pleura que o habitual.'),
      ],
      2: [
        m('Tronco pulmonar proeminente', 'Fluxo aumentado pelo canal arterial persistente.'),
        m('Aorta também proeminente', 'Diferente da comunicação interatrial, aqui a aorta participa do shunt e pode crescer.'),
      ],
      3: [
        m('Artérias pulmonares dilatadas pós-correção', 'Estado esperado após reconstrução de via de saída direita.'),
        m('Arco aórtico à direita', 'A traqueia é impelida para a esquerda; associação clássica com tetralogia de Fallot.'),
        m('Material cirúrgico', 'Fios e clipes definem o basal do paciente e evitam leitura alarmista.', 'referencia'),
      ],
    },
    conduta:
      'Ecocardiograma define anatomia e shunt; ressonância quantifica volumes e fluxos. Peça sempre o relatório cirúrgico antes de chamar de anormal um tórax operado.',
  },

  marcapassos: {
    mecanismo:
      'Gerador e eletrodos são metálicos e aparecem com densidade máxima. A radiografia responde a três perguntas mecânicas: quantos eletrodos existem, onde termina cada um e houve complicação do acesso venoso. O implante é feito por punção subclávia ou cefálica — daí o pneumotórax ser a complicação precoce a excluir em todo controle pós-procedimento.',
    estruturas: [
      e(
        'Gerador',
        'Cápsula metálica alojada em bolsa subcutânea ou subpeitoral infraclavicular, quase sempre à esquerda.',
        'Ausente.',
        'Retângulo denso de cantos arredondados projetado sobre o ápice pulmonar esquerdo.',
        'O gerador oculta parênquima: revise deliberadamente o pulmão sob e ao redor dele.',
      ),
      e(
        'Eletrodos e suas pontas',
        'Cabos que descem pela veia subclávia/braquiocefálica, cava superior e câmaras direitas.',
        'Ausentes.',
        'Ponta atrial voltada para cima na aurícula direita; ponta ventricular apontando para o ápice, à esquerda da coluna e abaixo do diafragma na projeção frontal.',
        'Ponta que cruza para a esquerda da linha média acima do diafragma pode indicar posição no seio coronário ou no ventrículo esquerdo.',
      ),
      e(
        'Espaço pleural apical',
        'Vértice do hemitórax do lado puncionado.',
        'Trama vascular visível até a periferia.',
        'Pneumotórax pós-punção aparece como linha pleural fina com ausência de vasos além dela.',
        'Filme pós-implante normal não exclui pneumotórax tardio: sintomas novos pedem repetição.',
      ),
      e(
        'Bobinas de choque do cardiodesfibrilador',
        'Segmentos condutores espessados do eletrodo, em cava superior/braquiocefálica e no ventrículo direito.',
        'Ausentes.',
        'Trechos nitidamente mais largos e densos do cabo — parte do desenho, não defeito.',
        'A transição abrupta entre eletrodo fino e bobina é rotineiramente confundida com fratura.',
      ),
    ],
    marcacoes: {
      1: [
        m('Gerador infraclavicular esquerdo', 'Posição habitual da bolsa; a lateralidade depende da dominância e do acesso.'),
        m('Eletrodo em ventrículo direito', 'Cabo descendo até o ápice, com ponta projetada à esquerda da coluna.'),
        m('Trajeto venoso contínuo', 'Siga o cabo do gerador à ponta procurando angulações, dobras e descontinuidades.', 'referencia'),
      ],
      2: [
        m('Linha pleural apical', 'Pneumotórax após punção subclávia — a complicação precoce que todo controle deve excluir.'),
        m('Ausência de trama além da linha', 'Confirmação do ar pleural: nenhum vaso cruza a linha.'),
      ],
      3: [
        m('Bobina de choque proximal', 'Segmento espesso em cava superior/braquiocefálica, parte normal do CDI.', 'referencia'),
        m('Bobina de choque distal', 'Segundo segmento espesso, no ventrículo direito.', 'referencia'),
        m('Gerador de maior volume', 'A cápsula do desfibrilador é maior que a de um marcapasso convencional.'),
      ],
    },
    conduta:
      'Suspeita de deslocamento ou mau funcionamento exige comparação com o filme pós-implante e interrogação do dispositivo. Perfil ajuda a diferenciar ápice do ventrículo direito de posições no seio coronário.',
  },

  'artefatos-cirurgia-cardiaca': {
    mecanismo:
      'Cada material conta um pedaço da história cirúrgica: fios medianos indicam esternotomia; clipes na topografia das mamárias internas indicam enxerto arterial; anéis densos na topografia valvar indicam prótese. Reconhecer o material é a metade fácil. A metade que importa é continuar a leitura, porque o dispositivo chama a atenção e favorece a satisfação de busca.',
    estruturas: [
      e(
        'Fios de esternotomia',
        'Fios de aço que reaproximam as metades do esterno, na linha média.',
        'Ausentes.',
        'Série de fios ou laços simétricos sobre o mediastino; conte-os e verifique alinhamento.',
        'Fio rompido, migrado ou com distância crescente entre bordas sugere deiscência ou instabilidade esternal.',
      ),
      e(
        'Artérias mamárias internas e seus clipes',
        'Vasos que descem por dentro da parede anterior, paraesternais; usados como enxerto coronário.',
        'Não visíveis.',
        'Fileira vertical paramediana de clipes metálicos, marcando o trajeto dissecado do enxerto.',
        'Clipes axilares pertencem a cirurgia mamária, não cardíaca — a topografia decide.',
      ),
      e(
        'Próteses valvares',
        'Anéis e discos metálicos ou biológicos com armação radiopaca.',
        'Ausentes.',
        'Anel aórtico mais alto, anterior e à direita; anel mitral mais baixo, posterior e à esquerda.',
        'Sem perfil, a atribuição da prótese à valva certa é insegura.',
      ),
      e(
        'Pulmão e pleura sob o material',
        'Parênquima e recessos frequentemente sobrepostos pelos artefatos.',
        'Trama regular e seios livres.',
        'No terceiro exemplo há cardiomegalia, redistribuição, linhas septais e derrames — a doença nova que o material poderia esconder.',
        'Identificar o dispositivo não encerra a leitura; é onde ela costuma ser abandonada.',
      ),
    ],
    marcacoes: {
      1: [
        m('Fios de esternotomia', 'Acesso mediano prévio; conte e verifique integridade e alinhamento.'),
        m('Gerador de marcapasso', 'Dispositivo adicional que precisa ser inventariado antes de olhar o pulmão.'),
      ],
      2: [
        m('Clipes paraesternais', 'Trajeto da mamária interna dissecada para enxerto coronário.'),
        m('Distribuição vertical dos clipes', 'A fileira acompanha o vaso; clipes dispersos sugerem outra cirurgia.', 'referencia'),
      ],
      3: [
        m('Prótese em posição aórtica', 'Anel mais alto e anterior no plano valvar.'),
        m('Prótese em posição mitral', 'Anel mais baixo e posterior, projetado à esquerda.'),
        m('Congestão pulmonar concomitante', 'Cardiomegalia, redistribuição, linhas septais e derrames — o achado que o material tende a ofuscar.'),
      ],
    },
    conduta:
      'Compare sempre com o pós-operatório imediato: ele é o novo normal do paciente. Alteração de posição, número ou integridade do material é que constitui achado.',
  },

  'outros-artefatos-cardiacos': {
    mecanismo:
      'Objetos externos projetam-se sobre o tórax com contorno nítido demais e densidade uniforme demais para uma lesão pulmonar, e frequentemente ultrapassam os limites anatômicos do tórax. Essa combinação — bordas perfeitamente definidas, simetria industrial e continuidade além do gradil — é o que separa artefato de doença.',
    estruturas: [
      e(
        'Stents coronários',
        'Malhas metálicas finas no trajeto epicárdico das coronárias.',
        'Ausentes.',
        'Densidade tubular sutil, mais visível em filmes bem penetrados; pode passar despercebida.',
        'A radiografia não avalia patência: stent visível não significa artéria aberta.',
      ),
      e(
        'Eletrodos cutâneos de ECG',
        'Botões metálicos com adesivo, colados na parede torácica.',
        'Ausentes.',
        'Discos perfeitamente redondos, de densidade homogênea e borda muito nítida, distribuídos de forma padronizada.',
        'São o imitador nº 1 de nódulo pulmonar; a borda excessivamente nítida entrega o artefato.',
      ),
      e(
        'Linhas, tubos e fios do paciente crítico',
        'Cateteres, extensões, fios de estimulação temporária e monitores sobrepostos ao tórax.',
        'Ausentes.',
        'Trajetos lineares que cruzam limites anatômicos e frequentemente saem do campo da imagem.',
        'Um objeto que atravessa a borda do filme é externo; um que respeita o contorno anatômico exige mais análise.',
      ),
    ],
    marcacoes: {
      1: [
        m('Densidade linear coronária', 'Stent no trajeto epicárdico, sutil e facilmente ignorado.'),
        m('Filme bem penetrado', 'A penetração adequada é o que torna o stent perceptível.', 'referencia'),
      ],
      2: [
        m('Botões de ECG', 'Discos externos redondos, homogêneos e de borda nítida — não são nódulos.', 'armadilha'),
        m('Distribuição padronizada', 'A disposição regular na parede denuncia a origem externa.', 'referencia'),
      ],
      3: [
        m('Fio de estimulação temporária', 'Eletrodo epicárdico ou transvenoso provisório, com trajeto até fora do tórax.'),
        m('Múltiplos dispositivos sobrepostos', 'Faça o inventário completo antes de interpretar o parênquima.'),
        m('Regiões ocultas pelos artefatos', 'Reveja deliberadamente ápices, retrocardíaco e bases sob o material.', 'referencia'),
      ],
    },
    conduta:
      'Na dúvida entre artefato externo e lesão, examine o paciente, remova o que for removível e repita a incidência. Nem todo objeto pode ser retirado com segurança — confira o prontuário antes.',
  },
}

// ══════════════════════════════════ Variantes anatômicas ══════════════════════════════════

const VARIANTES: Record<string, DetalheCaso> = {
  dextrocardia: {
    mecanismo:
      'No situs inversus totalis, a lateralização embrionária se inverte por completo: coração, arco aórtico, estômago, baço e fígado trocam de lado. A radiografia mostra a imagem em espelho de um tórax normal. O problema é que um arquivo digital invertido produz exatamente a mesma figura — e erro de rotulagem é muitas ordens de grandeza mais comum que dextrocardia verdadeira.',
    estruturas: [
      e(
        'Marcador de lateralidade',
        'Letra R ou L de chumbo, colocada pelo técnico no lado correspondente durante a aquisição.',
        'Fica sobre a parede lateral, do lado indicado, com a letra legível na orientação normal.',
        'É o primeiro elemento a checar: letra espelhada ou ausente resolve — ou desmonta — o diagnóstico.',
        'Marcador digital aplicado depois pela estação de trabalho não prova nada sobre a anatomia real.',
      ),
      e(
        'Ápice cardíaco',
        'Extremidade inferior do ventrículo esquerdo, que define para onde o coração "aponta".',
        'Voltado para a esquerda e para baixo, com dois terços da silhueta à esquerda da linha média.',
        'Aponta para a direita, com a maior parte da silhueta no hemitórax direito.',
      ),
      e(
        'Bolha gástrica',
        'Ar do fundo gástrico sob o hemidiafragma esquerdo.',
        'Lucência arredondada sob a cúpula esquerda; o fígado, denso, ocupa a direita.',
        'No situs inversus verdadeiro, migra para sob a cúpula direita, acompanhando a inversão visceral.',
        'É a checagem mais barata: numa imagem apenas invertida, todo o conjunto vira junto e o marcador fica espelhado.',
      ),
      e(
        'Botão aórtico',
        'Arco aórtico no contorno mediastinal superior.',
        'À esquerda em cerca de 99% das pessoas.',
        'À direita, acompanhando a inversão completa.',
      ),
    ],
    marcacoes: {
      1: [
        m('Ápice cardíaco à direita', 'Coração voltado para o hemitórax direito.'),
        m('Bolha gástrica à direita', 'Inversão visceral acompanhando o coração — situs inversus.'),
        m('Marcador de lateralidade coerente', 'A letra confirma que a orientação da imagem está correta.', 'referencia'),
      ],
      2: [
        m('Imagem digital invertida', 'Aparência idêntica à dextrocardia, mas de origem técnica.', 'armadilha'),
        m('Marcador espelhado ou incoerente', 'A pista que desfaz o engano: sempre procure antes de laudar.', 'referencia'),
      ],
    },
    conduta:
      'Palpe o ictus e confira o marcador antes de escrever dextrocardia. Situs inversus com bronquiectasias e sinusite sugere síndrome de Kartagener e exige investigação de discinesia ciliar.',
  },

  'arco-aortico-direito': {
    mecanismo:
      'O arco aórtico direito resulta da persistência do quarto arco branquial direito com regressão do esquerdo. Ocorre em cerca de 0,1% da população. Em vez de cruzar à esquerda da traqueia, a aorta passa à direita e pode formar, com o ligamento arterioso, um anel vascular que comprime traqueia e esôfago.',
    estruturas: [
      e(
        'Botão aórtico',
        'Perfil do arco no contorno mediastinal superior.',
        'Convexidade à esquerda, com a faixa paratraqueal direita fina e retilínea ao lado.',
        'A convexidade aparece à direita e a faixa paratraqueal direita desaparece; o contorno esquerdo fica retificado.',
        'Mediastino alargado por técnica AP pode borrar o botão e simular ausência do contorno esquerdo.',
      ),
      e(
        'Traqueia',
        'Coluna aérea mediana que desce do pescoço até a carina.',
        'Discretamente desviada para a direita pelo arco esquerdo — desvio fisiológico.',
        'Empurrada para a esquerda pelo arco direito; estreitamento localizado sugere anel vascular sintomático.',
        'Rotação do paciente desloca a traqueia aparente: confira as extremidades mediais das clavículas antes.',
      ),
      e(
        'Esôfago',
        'Tubo muscular posterior à traqueia, invisível sem contraste.',
        'Não avaliável na radiografia simples.',
        'Comprimido pelo anel vascular quando presente; disfagia lusória é a manifestação clássica.',
      ),
    ],
    marcacoes: {
      1: [
        m('Botão aórtico à direita', 'Convexidade no lado direito do mediastino superior.'),
        m('Contorno esquerdo retificado', 'Ausência da saliência esperada à esquerda.', 'referencia'),
        m('Traqueia sem estreitamento', 'Variante incidental, sem compressão.'),
      ],
      2: [
        m('Traqueia desviada para a esquerda', 'Efeito de massa do arco direito sobre a via aérea.'),
        m('Estreitamento traqueal focal', 'Sinal de compressão; sintomas respiratórios ou disfagia pedem investigação seccional.'),
      ],
    },
    conduta:
      'Angiotomografia ou ressonância definem a configuração dos vasos e a existência de anel vascular. Arco direito em criança obriga a procurar cardiopatia congênita associada, sobretudo tetralogia de Fallot.',
  },

  'fissura-azigos': {
    mecanismo:
      'Durante o desenvolvimento, a veia ázigos migra para o mediastino atravessando o ápice do pulmão direito em vez de contorná-lo. Ao fazer isso, arrasta consigo quatro camadas de pleura — duas viscerais e duas parietais — que formam uma fissura acessória. O lobo separado medialmente é o "lobo da ázigos", que não é um lobo verdadeiro por não ter brônquio próprio.',
    estruturas: [
      e(
        'Fissura da ázigos',
        'Prega de quatro folhetos pleurais que desce do ápice direito em direção ao hilo.',
        'Ausente em 98 a 99% das pessoas.',
        'Linha fina e curva no campo superior direito, de concavidade lateral.',
        'É facilmente lida como linha de pneumotórax apical; a diferença é que há trama vascular dos dois lados da fissura.',
      ),
      e(
        'Veia ázigos',
        'Veia que drena o sistema ázigos para a cava superior, junto ao ângulo traqueobrônquico direito.',
        'Densidade ovalada de poucos milímetros no ângulo traqueobrônquico, variável com a volemia.',
        'Fica deslocada lateralmente, na extremidade inferior da fissura — a "cabeça do girino", com a fissura como cauda.',
        'Ázigos maior que 10 mm em ortostatismo sugere aumento de pressão venosa central ou hipervolemia.',
      ),
      e(
        'Ápice pulmonar direito',
        'Vértice do hemitórax, acima da clavícula.',
        'Trama vascular fina, visível até a periferia.',
        'Preserva a trama de ambos os lados da fissura — o argumento decisivo contra pneumotórax.',
      ),
    ],
    marcacoes: {
      1: [
        m('Linha fissural apical direita', 'Trajeto curvo descendo do ápice em direção ao hilo.'),
        m('Cabeça da ázigos', 'Densidade ovalada na extremidade inferior da linha, completando o desenho do girino.'),
        m('Trama vascular lateral à linha', 'Vasos visíveis além da fissura excluem pneumotórax.', 'referencia'),
      ],
    },
    conduta:
      'Achado incidental sem repercussão clínica. Vale registrar no laudo porque altera a anatomia cirúrgica de lobectomias superiores direitas e pode confundir leituras futuras.',
  },

  'fissura-acessoria': {
    mecanismo:
      'Fissuras acessórias surgem quando a separação entre segmentos broncopulmonares é mais completa que o habitual, deixando um plano pleural extra. As mais frequentes são a fissura inferior acessória, a superior acessória e a fissura menor esquerda. São achados anatômicos estáveis, sem qualquer repercussão funcional.',
    estruturas: [
      e(
        'Fissura acessória',
        'Interface pleural entre segmentos, em posição anatômica previsível.',
        'Ausente na maioria das pessoas.',
        'Linha fina, lisa, de espessura uniforme e trajeto regular, sem convergência de vasos.',
        'A confusão clássica é com atelectasia laminar — que costuma ser mais grossa, irregular e acompanhada de perda de volume.',
      ),
      e(
        'Volume pulmonar',
        'Posição de diafragma, fissuras e espaçamento intercostal.',
        'Simétrico, com cúpulas em posição habitual.',
        'Absolutamente preservado — a ausência de perda de volume é o que confirma a natureza congênita da linha.',
      ),
      e(
        'Trama vascular adjacente',
        'Vasos que percorrem o parênquima ao redor da linha.',
        'Distribuição regular, convergindo para o hilo.',
        'Sem aglomeração nem desvio; na atelectasia, os vasos se aproximam do segmento colapsado.',
      ),
    ],
    marcacoes: {
      1: [
        m('Linha fissural fina e lisa', 'Calibre uniforme e trajeto regular, típicos de plano pleural.'),
        m('Ausência de perda de volume', 'Diafragma, fissuras e costelas em posição normal.', 'referencia'),
        m('Trama vascular preservada', 'Sem aglomeração de vasos, o que afasta atelectasia.', 'referencia'),
      ],
    },
    conduta:
      'Nenhuma investigação é necessária. Registrar a fissura evita que ela seja lida como doença nova em exames futuros e ajuda o planejamento cirúrgico.',
  },

  'costela-cervical': {
    mecanismo:
      'A costela cervical é uma costela supranumerária originada do processo transverso de C7, presente em cerca de 0,5 a 1% da população. Na maioria das vezes é assintomática. Quando é longa ou continua como banda fibrosa até a primeira costela, pode estreitar o triângulo interescalênico e comprimir o plexo braquial inferior ou a artéria subclávia — a síndrome do desfiladeiro torácico.',
    estruturas: [
      e(
        'Sétima vértebra cervical',
        'Última vértebra cervical, identificada pelo processo transverso dirigido para baixo.',
        'Processos transversos de C7 apontam caudalmente; os de T1 apontam cranialmente — a regra que separa as duas.',
        'É a origem da costela extra; contar corretamente os níveis é o passo que valida o diagnóstico.',
        'Contar mal os níveis transforma uma primeira costela hipoplásica em "costela cervical".',
      ),
      e(
        'Primeira costela torácica',
        'Costela curta, larga e muito angulada, que forma o limite do desfiladeiro.',
        'Arco robusto e horizontalizado logo abaixo da clavícula.',
        'Serve de referência de contagem e de contraponto de forma; a costela cervical é mais fina e retilínea.',
      ),
      e(
        'Desfiladeiro torácico',
        'Espaço entre escalenos, clavícula e primeira costela por onde passam plexo braquial e vasos subclávios.',
        'Não avaliável diretamente na radiografia.',
        'Pode ser estreitado pela costela extra ou por sua banda fibrosa, invisível ao raio-X.',
        'A radiografia não mede a compressão: sintomas mandam mais que a imagem.',
      ),
    ],
    marcacoes: {
      1: [m('Costela supranumerária em C7', 'Arco costal extra articulado ao processo transverso da sétima cervical.'), m('Primeira costela torácica de referência', 'Contraponto de forma e nível para a contagem.', 'referencia')],
      2: [m('Costelas cervicais bilaterais', 'A variante costuma ser bilateral, embora frequentemente assimétrica.'), m('Extensão variável dos arcos', 'Do rudimento a um arco completo; o tamanho não prediz sintoma.', 'referencia')],
    },
    conduta:
      'Sintomas neurológicos ou vasculares do membro superior pedem avaliação clínica dirigida, eletroneuromiografia e estudo vascular. A presença radiográfica isolada não indica cirurgia.',
  },

  'variantes-costais': {
    mecanismo:
      'Costelas podem se fundir, bifurcar, faltar ou ser hipoplásicas por variações da segmentação embrionária dos somitos. O que separa variante de doença é o comportamento da cortical: variantes mantêm cortical contínua, lisa e sem reação periosteal, e são estáveis ao longo do tempo.',
    estruturas: [
      e(
        'Cortical costal',
        'Camada compacta que delimita cada arco.',
        'Linha fina, contínua e nítida em toda a extensão do arco.',
        'Permanece íntegra nas variantes — o oposto da destruição lítica ou da fratura.',
        'Sobreposição de costela anterior e posterior simula falha cortical: siga cada arco individualmente.',
      ),
      e(
        'Espaços intercostais',
        'Intervalos entre arcos adjacentes.',
        'Aproximadamente regulares e simétricos.',
        'Alargados ou reduzidos localmente por fusão ou bifurcação, sem perda de volume pulmonar associada.',
      ),
      e(
        'Gradil como conjunto',
        'Os doze pares contados bilateralmente.',
        'Simetria de número e de forma.',
        'A contagem bilateral é o que revela hipoplasia, ausência ou arco supranumerário.',
        'Um arco "faltando" pode ser sequela cirúrgica: procure clipes, fios e alterações de partes moles.',
      ),
    ],
    marcacoes: {
      1: [m('Bifurcação do arco costal', 'Extremidade anterior dividida em dois ramos, com cortical contínua.'), m('Cortical íntegra', 'Ausência de reação óssea agressiva — o que define variante.', 'referencia')],
      2: [m('Fusão entre primeira e segunda costelas', 'Ponte óssea congênita unindo os dois arcos.'), m('Espaço intercostal ausente no nível', 'Consequência geométrica da fusão, sem repercussão pulmonar.')],
      3: [m('Quarto arco direito hipoplásico', 'Costela curta e afilada, de cortical preservada.'), m('Comparação com o lado contralateral', 'A assimetria só é interpretável contando os dois gradis.', 'referencia')],
    },
    conduta:
      'Nenhuma investigação é necessária quando a cortical é lisa e o achado é estável. Dor localizada, expansão óssea ou destruição cortical mudam completamente a abordagem.',
  },

  'calcificacao-costocondral': {
    mecanismo:
      'As cartilagens costais são radiotransparentes na juventude e mineralizam progressivamente com a idade — mais precocemente e de forma mais central nas mulheres, mais periférica nos homens. Vistas de topo, essas calcificações irregulares projetam densidades arredondadas sobre o pulmão e imitam nódulos.',
    estruturas: [
      e(
        'Cartilagens costais',
        'Segmentos cartilaginosos que unem as extremidades anteriores das costelas ao esterno.',
        'Invisíveis antes da terceira década.',
        'Mineralizam em faixas ou pontilhados nas extremidades anteriores mediais, tipicamente bilaterais e simétricos.',
        'A calcificação vista de topo é causa frequente de pseudonódulo — reveja o mesmo ponto em outra incidência.',
      ),
      e(
        'Extremidade anterior das costelas',
        'Porção medial dos arcos, próxima ao esterno.',
        'Termina abruptamente onde começa a cartilagem, sem continuidade visível.',
        'Ganha continuidade aparente com o cálcio; a densidade acompanha exatamente o eixo do arco.',
      ),
      e(
        'Parênquima subjacente',
        'Pulmão projetado atrás das junções costocondrais.',
        'Trama regular.',
        'A dúvida se resolve por localização: a densidade se move junto com a costela entre incidências, o nódulo não.',
      ),
    ],
    marcacoes: {
      1: [
        m('Calcificação nas junções costocondrais', 'Densidades nas extremidades anteriores mediais, bilaterais.'),
        m('Simetria do padrão', 'Distribuição espelhada favorece fenômeno relacionado à idade.', 'referencia'),
        m('Pseudonódulo por projeção de topo', 'Cálcio visto de frente parece nódulo; comparar com exames prévios resolve.', 'armadilha'),
      ],
    },
    conduta:
      'Achado esperado com a idade, sem indicação de seguimento. Dúvida persistente sobre nódulo se resolve com incidência complementar ou tomografia de baixa dose.',
  },

  'pectus-excavatum': {
    mecanismo:
      'No pectus excavatum o esterno é deslocado posteriormente, comprimindo o coração contra a coluna e empurrando-o para a esquerda. Duas consequências dominam a frontal: a borda cardíaca direita perde contato com pulmão aerado e desaparece, e as costelas assumem obliquidade acentuada, com os arcos anteriores caindo abruptamente — o padrão descrito como costelas "em 7".',
    estruturas: [
      e(
        'Esterno',
        'Osso plano anterior do tórax.',
        'Praticamente não avaliável na frontal; bem demonstrado no perfil.',
        'Deprimido posteriormente, visível diretamente apenas na incidência lateral.',
        'Tentar diagnosticar ou graduar pectus só pela frontal é fonte garantida de erro.',
      ),
      e(
        'Borda cardíaca direita',
        'Contorno do átrio direito contra o pulmão médio.',
        'Linha nítida ao longo da margem direita da silhueta.',
        'Apagada pelo contato com partes moles deslocadas — sinal da silhueta sem doença pulmonar.',
        'Reproduz exatamente o achado de consolidação do lobo médio; a chave é a ausência de opacidade verdadeira.',
      ),
      e(
        'Arcos costais anteriores',
        'Porções anteriores das costelas, mais horizontais que as posteriores no tórax normal.',
        'Descem suavemente da lateral para o esterno.',
        'Assumem inclinação acentuada, quase vertical, desenhando o "7" característico.',
      ),
      e(
        'Coração deslocado',
        'Silhueta empurrada para a esquerda pelo esterno deprimido.',
        'Dois terços à esquerda da linha média.',
        'Deslocamento adicional à esquerda, com aparente aumento da área cardíaca sem cardiomegalia real.',
      ),
    ],
    marcacoes: {
      1: [
        m('Borda cardíaca direita apagada', 'Perda do contorno por contato com partes moles, não por doença do lobo médio.'),
        m('Costelas em "7"', 'Arcos anteriores muito oblíquos, o marcador frontal mais confiável.'),
        m('Coração deslocado à esquerda', 'Compressão esternal empurra a silhueta lateralmente.'),
      ],
      2: [
        m('Depressão esternal no perfil', 'Demonstração direta da deformidade e do estreitamento anteroposterior.'),
        m('Espaço retroesternal reduzido', 'Distância esterno-coluna diminuída, base do índice de Haller.', 'medida'),
      ],
    },
    conduta:
      'Tomografia calcula o índice de Haller quando há indicação cirúrgica ou repercussão funcional. Na maioria dos casos o achado é estético e a radiografia serve apenas para não confundir com doença pulmonar.',
  },

  escoliose: {
    mecanismo:
      'A escoliose combina curvatura lateral com rotação vertebral. A rotação altera a relação entre estruturas e o feixe: um hemitórax fica mais projetado que o outro, os hilos mudam de posição aparente e a silhueta cardíaca se distorce. O resultado é um tórax em que quase todas as medidas convencionais perdem validade.',
    estruturas: [
      e(
        'Coluna torácica',
        'Eixo vertebral com corpos, pedículos e processos espinhosos.',
        'Processos espinhosos alinhados e equidistantes dos pedículos.',
        'Processos espinhosos deslocados em relação aos pedículos, denunciando o componente rotacional.',
        'A radiografia de tórax não serve para medir ângulo de Cobb nem para acompanhar tratamento.',
      ),
      e(
        'Gradil costal',
        'Arcos que rodam junto com as vértebras.',
        'Espaçamento simétrico e obliquidade equivalente nos dois lados.',
        'Costelas do lado convexo ficam afastadas e horizontalizadas; as do côncavo, apinhadas.',
      ),
      e(
        'Silhueta cardíaca e mediastino',
        'Estruturas centrais deslocadas pela deformidade.',
        'ICT abaixo de 50% e contornos previsíveis.',
        'Distorcida e frequentemente rodada: o índice cardiotorácico torna-se pouco confiável.',
        'Não diagnostique cardiomegalia em tórax escoliótico sem ressalva explícita no laudo.',
      ),
      e(
        'Campos pulmonares',
        'Parênquima assimetricamente projetado.',
        'Transparência comparável dos dois lados.',
        'Assimetria de densidade puramente geométrica, que pode mascarar ou simular doença.',
      ),
    ],
    marcacoes: {
      1: [
        m('Curvatura lateral da coluna', 'Desvio do eixo vertebral no plano frontal.'),
        m('Rotação vertebral', 'Processos espinhosos deslocados em relação à linha média dos corpos.'),
        m('Assimetria das costelas', 'Apinhamento no lado côncavo e afastamento no convexo.'),
        m('Silhueta cardíaca distorcida', 'Medidas convencionais perdem validade neste tórax.', 'armadilha'),
      ],
    },
    conduta:
      'Avaliação e seguimento da escoliose exigem radiografia panorâmica de coluna em ortostatismo. Na radiografia de tórax, o papel é apenas reconhecer a deformidade e ajustar a interpretação de todo o resto.',
  },
}

// ══════════════════════════════════ Vias aéreas e colapso ══════════════════════════════════

const VIAS_AEREAS: Record<string, DetalheCaso> = {
  'fibrose-pos-radioterapia': {
    mecanismo:
      'A radioterapia provoca pneumonite nos primeiros meses e, depois, fibrose com retração. O tecido cicatricial encurta e puxa tudo que está preso a ele: fissuras, hilo, traqueia e mediastino migram para o lado doente. A distribuição não respeita limites lobares — respeita o campo de irradiação, e é isso que a torna reconhecível.',
    estruturas: [
      e(
        'Traqueia',
        'Coluna aérea mediana, referência mais sensível de tração ou empurrão mediastinal.',
        'Central ou minimamente desviada à direita pelo arco aórtico, com bordas paralelas.',
        'Puxada para o lado da perda de volume, com o paciente sem rotação — logo, desvio verdadeiro.',
        'Rotação simula desvio: cheque a simetria das extremidades mediais das clavículas em relação aos processos espinhosos antes.',
      ),
      e(
        'Lobo superior esquerdo',
        'Território irradiado neste caso, com retração cicatricial.',
        'Transparência homogênea, com vasos afilando para a periferia.',
        'Denso e reduzido de volume, com trama vascular aglomerada e contornos retificados.',
      ),
      e(
        'Interface fibrose-pulmão normal',
        'Limite entre o campo irradiado e o parênquima poupado.',
        'Não existe.',
        'Borda relativamente retilínea, que corta a anatomia lobar — a assinatura de dano por campo de tratamento.',
        'Sem história de radioterapia, essa geometria "não anatômica" perde o valor: reconsidere infecção, tumor e fibrose de outra causa.',
      ),
      e(
        'Hilo ipsilateral',
        'Conjunto de artéria pulmonar, veias e brônquios.',
        'Hilo esquerdo até 2 cm mais alto que o direito.',
        'Elevado e tracionado, acompanhando a retração do lobo superior.',
      ),
    ],
    marcacoes: {
      1: [
        m('Traqueia tracionada', 'Desviada para o lado da perda de volume, sem rotação do paciente.'),
        m('Opacidade retrátil do lobo superior', 'Densidade com redução de volume, não uma consolidação expansiva.'),
        m('Limite geométrico da lesão', 'Borda que acompanha o campo irradiado, e não a anatomia lobar.', 'referencia'),
      ],
    },
    conduta:
      'O diagnóstico exige história e correspondência com o campo tratado. Tomografia diferencia fibrose estável de recidiva tumoral; PET-TC ajuda quando a dúvida persiste.',
  },

  pneumonectomia: {
    mecanismo:
      'Retirado o pulmão, o hemitórax vazio é ocupado ao longo de semanas a meses por líquido, retração da parede e migração do mediastino. O resultado final é um hemitórax completamente opaco com perda de volume máxima: costelas apinhadas, hemidiafragma elevado e coração deslocado para o lado operado. É o extremo da escala "hemitórax branco com perda de volume".',
    estruturas: [
      e(
        'Coto brônquico',
        'Extremidade suturada do brônquio principal do lado operado.',
        'Brônquio principal contínuo até as divisões lobares.',
        'Termina abruptamente, em fundo cego — a assinatura da ressecção.',
        'Ar novo no hemitórax operado ou queda súbita do nível líquido levanta fístula broncopleural.',
      ),
      e(
        'Mediastino',
        'Conjunto central que responde a diferenças de volume entre os hemitórax.',
        'Centrado, com contornos previsíveis.',
        'Deslocado intensamente para o lado operado, arrastando traqueia, coração e grandes vasos.',
      ),
      e(
        'Pulmão remanescente',
        'Único pulmão em atividade.',
        'Ocupa seu hemitórax, sem cruzar a linha média.',
        'Hiperexpandido, podendo herniar através da linha média por trás do esterno.',
      ),
      e(
        'Gradil costal do lado operado',
        'Arcos que acompanham a retração.',
        'Espaçamento simétrico ao contralateral.',
        'Apinhados, com espaços intercostais estreitados — confirmação da perda de volume.',
      ),
    ],
    marcacoes: {
      1: [
        m('Hemitórax opacificado', 'Preenchimento completo do espaço após a ressecção.'),
        m('Mediastino puxado para o lado operado', 'Deslocamento ipsilateral, marca da perda de volume.'),
        m('Coto brônquico', 'Interrupção abrupta do brônquio principal.'),
        m('Hiperinsuflação contralateral', 'O pulmão remanescente expande e pode cruzar a linha média.'),
      ],
    },
    conduta:
      'Compare sempre com o pós-operatório de referência. Mudança de posição do mediastino, aparecimento de ar ou queda do nível líquido em paciente febril sugere fístula ou empiema e exige tomografia urgente.',
  },

  'grande-derrame-pleural': {
    mecanismo:
      'Líquido pleural em grande volume adiciona conteúdo ao hemitórax. Quando ultrapassa a capacidade de acomodação por colapso passivo do pulmão, a pressão intrapleural sobe e o mediastino é empurrado para o lado oposto. Esse "para onde foi o mediastino" é a pergunta que organiza toda a leitura do hemitórax opaco.',
    estruturas: [
      e(
        'Espaço pleural',
        'Cavidade virtual entre pleura visceral e parietal.',
        'Contém apenas alguns mililitros, invisíveis.',
        'Ocupado por volume suficiente para opacificar o hemitórax e gerar efeito de massa.',
      ),
      e(
        'Menisco',
        'Interface superior do líquido livre.',
        'Inexistente.',
        'Curva de concavidade superior que sobe pela parede lateral, confirmando líquido livre e não colapso.',
        'Em decúbito ou em derrame loculado o menisco desaparece, e o volume real pode ser subestimado.',
      ),
      e(
        'Mediastino e traqueia',
        'Estruturas centrais que sinalizam o balanço de volume.',
        'Centradas.',
        'Empurradas para o lado contralateral — ganho de volume, e não perda.',
        'Se estiverem puxadas para o lado opaco, existe colapso associado e a leitura muda inteiramente.',
      ),
      e(
        'Pleura contralateral e parede',
        'Superfícies a revisar quando se suspeita de doença pleural difusa.',
        'Lisas e finas.',
        'Espessamento ou placas apontam exposição ao asbesto — aqui, mesotelioma como causa do derrame.',
      ),
    ],
    marcacoes: {
      1: [
        m('Opacificação do hemitórax inferior', 'Grande volume de líquido pleural.'),
        m('Menisco lateral', 'Concavidade superior subindo pela parede — líquido livre.'),
        m('Mediastino empurrado', 'Desvio contralateral: o hemitórax ganhou volume.'),
        m('Espessamento pleural', 'Pista etiológica de doença pleural relacionada ao asbesto.'),
      ],
    },
    conduta:
      'Ultrassom quantifica e guia a toracocentese com segurança. Derrame volumoso unilateral sem causa cardíaca evidente exige análise do líquido, citologia e tomografia com contraste.',
  },

  'derrame-e-colapso': {
    mecanismo:
      'Quando um brônquio principal é obstruído, o pulmão distal reabsorve o ar e colapsa. Se houver também derrame, o hemitórax fica branco por duas razões opostas — uma que perde volume, outra que ganha. Quem vence define para onde o mediastino vai. Aqui a perda de volume domina, e a traqueia é puxada para o lado opaco apesar do líquido presente.',
    estruturas: [
      e(
        'Brônquio principal esquerdo',
        'Via aérea que emerge da carina em direção ao pulmão esquerdo.',
        'Coluna aérea contínua, seguindo até as divisões lobares.',
        'Interrompido abruptamente — sinal direto de obstrução, aqui tumoral.',
        'A interrupção pode ser sutil no hemitórax branco: procure-a especificamente antes de atribuir tudo ao derrame.',
      ),
      e(
        'Traqueia',
        'Referência do balanço de volume.',
        'Central.',
        'Desviada para o lado opacificado — perda de volume predominante.',
        'A presença de menisco não garante que o derrame domine: sempre confira o sentido do desvio.',
      ),
      e(
        'Menisco pleural',
        'Interface do líquido livre.',
        'Inexistente.',
        'Presente, comprovando que há derrame coexistente ao colapso.',
      ),
      e(
        'Hilo esquerdo',
        'Local da provável massa obstrutiva.',
        'Densidade previsível formada por artéria e veias.',
        'Deslocado e frequentemente encoberto pela opacidade; a massa pode não ser individualizável.',
      ),
    ],
    marcacoes: {
      1: [
        m('Hemitórax branco', 'Opacificação completa, cuja causa exige definir o sentido do desvio mediastinal.'),
        m('Corte abrupto do brônquio principal', 'Obstrução endobrônquica — em adulto, tumor até prova em contrário.'),
        m('Desvio traqueal ipsilateral', 'A perda de volume supera o volume de líquido.'),
        m('Menisco', 'Componente de derrame associado.'),
      ],
    },
    conduta:
      'Tomografia com contraste e broncoscopia são obrigatórias: definem a massa, avaliam a via aérea e permitem biópsia. Drenar o derrame sem esclarecer a obstrução não resolve o problema.',
  },

  'colapso-lobo-inferior-direito': {
    mecanismo:
      'O lobo inferior direito colapsa medial e posteriormente, contra a coluna e o diafragma. Como se afasta da parede lateral e mantém contato com a coluna, produz opacidade triangular de base inferior, apaga o hemidiafragma posterior e desloca a fissura maior. É uma perda de volume que puxa o mediastino para o mesmo lado.',
    estruturas: [
      e(
        'Lobo inferior direito',
        'Território dos segmentos basais e do segmento superior, posterior no tórax.',
        'Aerado e homogêneo, permitindo seguir o hemidiafragma até a coluna.',
        'Colapsado em cunha triangular medial e basal, com aumento de densidade retrocardíaco.',
        'A opacidade pode ficar escondida atrás do coração: subexpor mentalmente a região retrocardíaca é onde o caso se perde.',
      ),
      e(
        'Hemidiafragma direito',
        'Cúpula que se projeta acima do fígado.',
        'Contorno nítido em toda a extensão.',
        'Perde nitidez na porção medial, onde o lobo colapsado encosta — sinal da silhueta.',
      ),
      e(
        'Mediastino',
        'Referência de volume.',
        'Centrado.',
        'Puxado para a direita, confirmando perda de volume.',
      ),
      e(
        'Brônquio do lobo inferior direito',
        'Ramo que segue posteriormente após a origem do lobo médio.',
        'Coluna aérea acompanhável.',
        'Obstruído; em adulto, obriga a excluir neoplasia mesmo quando a massa não é visível.',
        'Colapso lobar em adulto sem causa evidente é um sinal indireto de câncer, não um achado benigno.',
      ),
    ],
    marcacoes: {
      1: [
        m('Opacidade triangular basal', 'Cunha de base inferior e vértice hilar, medial na projeção frontal.'),
        m('Hemidiafragma medial apagado', 'Contato direto entre o lobo colapsado e o músculo.'),
        m('Mediastino puxado à direita', 'Perda de volume ipsilateral.'),
        m('Massa não visível', 'A ausência de massa não afasta obstrução tumoral.', 'armadilha'),
      ],
    },
    conduta:
      'Tomografia com contraste e broncoscopia definem a causa da obstrução. Colapso persistente após fisioterapia e aspiração em adulto é indicação formal de investigação endoscópica.',
  },

  'colapso-lobo-inferior-esquerdo': {
    mecanismo:
      'O lobo inferior esquerdo colapsa para trás e para dentro, atrás do coração. Torna-se uma cunha triangular retrocardíaca que cria uma segunda borda dentro da silhueta cardíaca — o sinal da vela ou "sail sign". Como encosta no diafragma posterior, apaga essa borda: o hemidiafragma deixa de ser seguido até a coluna.',
    estruturas: [
      e(
        'Lobo inferior esquerdo',
        'Segmentos basais e superior, posteriores e mediais.',
        'Aerado; a região retrocardíaca é transparente e permite ver vasos através do coração.',
        'Colapsado em triângulo retrocardíaco, criando densidade dentro da silhueta.',
        'A região retrocardíaca é o ponto cego clássico da radiografia de tórax — revise-a em todo filme.',
      ),
      e(
        'Borda cardíaca esquerda',
        'Contorno do ventrículo esquerdo contra a língula aerada.',
        'Linha única e nítida.',
        'Ganha uma segunda linha interna, formada pelo lobo colapsado — o duplo contorno.',
        'Duplo contorno esquerdo também ocorre por aumento atrial esquerdo: aqui vem acompanhado de perda de volume.',
      ),
      e(
        'Hemidiafragma esquerdo',
        'Cúpula acompanhada até a coluna no filme normal.',
        'Contorno contínuo em toda a extensão medial.',
        'Interrompido medialmente, porque o lobo colapsado tem a mesma densidade do músculo.',
      ),
      e(
        'Hilo esquerdo',
        'Estruturas hilares que acompanham a retração.',
        'Mais alto que o direito, com vasos identificáveis.',
        'Deslocado inferiormente e frequentemente encoberto pela opacidade retrocardíaca.',
      ),
    ],
    marcacoes: {
      1: [
        m('Sinal da vela', 'Triângulo denso retrocardíaco com vértice hilar.'),
        m('Duplo contorno cardíaco esquerdo', 'Segunda linha dentro da silhueta, criada pelo lobo colapsado.'),
        m('Hemidiafragma medial não seguido', 'Sinal da silhueta pelo contato entre densidades iguais.'),
        m('Perda de volume à esquerda', 'Hilo rebaixado e redução do hemitórax.'),
      ],
    },
    conduta:
      'Confirme com perfil, que mostra a cunha posterior com clareza. Em adulto, investigue obstrução brônquica com tomografia e broncoscopia; em pós-operatório e intubados, rolha mucosa é causa frequente e reversível.',
  },

  'colapso-lobo-superior-direito': {
    mecanismo:
      'Perdido o ar do lobo superior direito, ele retrai para cima e medialmente, contra o mediastino e o ápice. A fissura horizontal, que normalmente cruza o hemitórax na altura do quarto arco anterior, sobe e se torna côncava para baixo. A traqueia é tracionada para a direita e o hilo direito se eleva.',
    estruturas: [
      e(
        'Fissura horizontal (menor)',
        'Plano pleural que separa lobo superior e médio à direita.',
        'Linha fina e retilínea na altura do quarto arco costal anterior, presente em cerca de dois terços das pessoas.',
        'Elevada e arqueada, delimitando inferiormente o lobo colapsado — o marcador mais fiel do colapso.',
        'A fissura pode ser invisível no filme normal; sua ausência não é achado.',
      ),
      e(
        'Lobo superior direito',
        'Segmentos apical, anterior e posterior.',
        'Transparência homogênea acima da fissura.',
        'Denso, retraído contra o mediastino superior e o ápice.',
      ),
      e(
        'Traqueia',
        'Referência de tração.',
        'Central ou minimamente à direita.',
        'Puxada para a direita, acompanhando a perda de volume.',
      ),
      e(
        'Hilo direito',
        'Artéria interlobar e veias.',
        'Habitualmente mais baixo que o esquerdo.',
        'Elevado, sinal indireto que reforça o diagnóstico quando a fissura não é bem vista.',
      ),
    ],
    marcacoes: {
      1: [
        m('Fissura horizontal elevada', 'Deslocamento superior do plano pleural — o achado central.'),
        m('Opacidade apical direita', 'Lobo colapsado retraído contra ápice e mediastino.'),
        m('Traqueia desviada à direita', 'Tração ipsilateral por perda de volume.'),
        m('Hilo direito elevado', 'Sinal indireto de retração superior.'),
      ],
    },
    conduta:
      'Em adulto, colapso do lobo superior direito exige tomografia e broncoscopia para excluir tumor endobrônquico. Procure ativamente convexidade na fissura elevada — o sinal do S de Golden aponta massa central.',
  },

  'paralisia-frenica': {
    mecanismo:
      'O nervo frênico desce pelo mediastino junto ao pericárdio e pode ser invadido por massas hilares ou mediastinais. Denervado, o hemidiafragma perde tônus, sobe e passa a se mover paradoxalmente. Quando existe uma massa fixando as estruturas, o mediastino não migra livremente para o lado da perda de volume — o que torna a leitura menos óbvia.',
    estruturas: [
      e(
        'Nervo frênico',
        'Nervo motor do diafragma (C3-C5), com trajeto mediastinal ao lado do pericárdio.',
        'Não visível.',
        'Invadido ou comprimido pela massa hilar superior esquerda.',
      ),
      e(
        'Hemidiafragma esquerdo',
        'Cúpula normalmente mais baixa que a direita.',
        'Cerca de 1,5 a 2,5 cm abaixo da direita.',
        'Elevado, com contorno liso e mantido — elevação sem massa abdominal aparente.',
        'Elevação também ocorre por eventração, técnica AP em expiração, hepatomegalia e distensão gástrica.',
      ),
      e(
        'Massa hilar superior esquerda',
        'Lesão responsável pela invasão neural.',
        'Hilo com densidade e contorno previsíveis.',
        'Opacidade que distorce a traqueia e apaga a arquitetura hilar.',
      ),
      e(
        'Traqueia',
        'Referência de deslocamento.',
        'Central.',
        'Distorcida pela massa e não simplesmente puxada — o efeito de massa restringe o deslocamento.',
      ),
    ],
    marcacoes: {
      1: [
        m('Hemidiafragma esquerdo elevado', 'Consequência da denervação frênica.'),
        m('Massa hilar/superior esquerda', 'Lesão responsável pela invasão do nervo.'),
        m('Traqueia distorcida', 'Efeito de massa local sobre a via aérea.'),
        m('Perda de volume à esquerda', 'Hemitórax menor, com costelas mais próximas.'),
      ],
    },
    conduta:
      'Elevação diafragmática nova em adulto obriga a procurar causa torácica. Fluoroscopia ou ultrassom com teste de sniff confirmam a paralisia; tomografia com contraste caracteriza a massa.',
  },

  'colapso-lobo-superior-esquerdo': {
    mecanismo:
      'O lobo superior esquerdo não tem fissura horizontal: ele colapsa anteriormente, achatando-se contra a parede anterior do tórax. Por isso, na frontal, não produz uma opacidade densa e delimitada, e sim um véu difuso que apaga a borda cardíaca esquerda. O lobo inferior hiperinsuflado sobe medialmente e se interpõe entre o lobo colapsado e o arco aórtico, criando um crescente aéreo — a Luftsichel.',
    estruturas: [
      e(
        'Lobo superior esquerdo',
        'Segmentos apicoposterior, anterior e lingulares.',
        'Transparente, com vasos afilando para a periferia.',
        'Colapsado contra a parede anterior; na frontal aparece como opacidade em véu, sem borda definida.',
        'Por ser difusa, essa opacidade é subestimada — compare a transparência global dos dois hemitórax.',
      ),
      e(
        'Borda cardíaca esquerda',
        'Contorno do ventrículo esquerdo contra a língula.',
        'Nítida.',
        'Apagada, porque a língula colapsada encosta no coração.',
      ),
      e(
        'Segmento superior do lobo inferior',
        'Porção do lobo inferior que sobe medialmente quando hiperinsuflada.',
        'Não individualizável.',
        'Interpõe-se entre o lobo colapsado e o arco aórtico, formando o crescente aéreo da Luftsichel.',
      ),
      e(
        'Hemidiafragma esquerdo',
        'Cúpula abaixo do lobo inferior.',
        'Contorno nítido.',
        'Preservado, porque o lobo inferior aerado permanece em contato com ele — detalhe que separa colapso superior de inferior.',
      ),
    ],
    marcacoes: {
      1: [
        m('Opacidade em véu', 'Densidade difusa do hemitórax esquerdo, sem borda nítida.'),
        m('Luftsichel', 'Crescente aéreo entre o lobo colapsado e o arco aórtico.'),
        m('Borda cardíaca esquerda apagada', 'Contato da língula colapsada com o coração.'),
        m('Hemidiafragma esquerdo preservado', 'O lobo inferior aerado mantém a interface.', 'referencia'),
        m('Massa hilar oval', 'Possível causa obstrutiva a ser confirmada.'),
      ],
    },
    conduta:
      'O perfil demonstra a faixa anterior densa e confirma o diagnóstico. Em adulto, siga com tomografia e broncoscopia: obstrução tumoral é a causa a excluir primeiro.',
  },
}

// ══════════════════════════════════ Dispositivos e artefatos ══════════════════════════════════

const DISPOSITIVOS: Record<string, DetalheCaso> = {
  'pneumocistose-e-piercing': {
    mecanismo:
      'Pneumocystis jirovecii coloniza o alvéolo e provoca exsudato espumoso com pneumócitos lesados, gerando padrão intersticial ou em vidro fosco de predomínio perihilar e simétrico. O achado é sensível ao estágio: nas primeiras horas a radiografia pode ser normal, e é justamente aí que a confiança excessiva no filme custa caro.',
    estruturas: [
      e(
        'Interstício perihilar',
        'Tecido de sustentação em torno de vasos e brônquios centrais.',
        'Praticamente invisível; só a trama vascular se destaca.',
        'Espessado bilateral e simetricamente, com aspecto granular ou reticular partindo dos hilos.',
        'Radiografia normal não exclui pneumocistose: em suspeita clínica alta, siga com tomografia.',
      ),
      e(
        'Periferia pulmonar',
        'Faixa subpleural.',
        'Pobre em trama, mais escura.',
        'Frequentemente poupada nas fases iniciais, reforçando a distribuição central.',
      ),
      e(
        'Parede torácica e artefatos externos',
        'Partes moles superficiais e objetos sobre a pele.',
        'Sem densidades metálicas.',
        'Anel metálico com fecho de densidade diferente, projetado sobre o campo pulmonar — externo, não pulmonar.',
        'Piercings, correntes e botões são lidos como nódulos com frequência desconcertante.',
      ),
    ],
    marcacoes: {
      1: [
        m('Opacidades intersticiais bilaterais', 'Padrão perihilar simétrico, sugestivo em paciente imunossuprimido.'),
        m('Piercing mamilar', 'Anel metálico externo com fecho menos denso — artefato de superfície.', 'armadilha'),
        m('Periferia relativamente poupada', 'Ajuda a caracterizar a distribuição central.', 'referencia'),
      ],
    },
    conduta:
      'Tomografia de alta resolução é bem mais sensível; a confirmação vem de escarro induzido ou lavado broncoalveolar. Trate empiricamente quando a suspeita clínica for forte, sem esperar imagem alterada.',
  },

  'cateter-jugular-tunelizado': {
    mecanismo:
      'O cateter tunelizado entra na pele longe do ponto de punção venosa e percorre um trajeto subcutâneo antes de alcançar a veia. Esse túnel, somado ao cuff de dacron, cria uma barreira mecânica e biológica à infecção, permitindo uso por meses. Na radiografia, o dispositivo tem duas assinaturas: um segmento intravascular retilíneo e um segmento subcutâneo que muda de direção fora do trajeto venoso.',
    estruturas: [
      e(
        'Veia jugular interna',
        'Veia cervical lateral à carótida, ponto de punção habitual.',
        'Não visível.',
        'Contém o segmento inicial do cateter, que desce em linha reta pelo pescoço.',
      ),
      e(
        'Junção cavoatrial',
        'Encontro da veia cava superior com o átrio direito, cerca de dois corpos vertebrais abaixo da carina.',
        'Não individualizável, mas estimável pela carina como referência.',
        'Alvo da ponta: fluxo alto o suficiente para diluir o infundido, sem tocar a parede atrial.',
        'Ponta profunda demais no átrio aumenta risco de arritmia e perfuração; muito alta, de trombose e disfunção.',
      ),
      e(
        'Túnel subcutâneo',
        'Trajeto do cateter sob a pele da parede torácica anterior.',
        'Ausente.',
        'Segmento que muda de direção fora do eixo venoso, ligando a saída cutânea ao ponto de entrada na veia.',
      ),
      e(
        'Espaço pleural apical',
        'Ápice do lado puncionado.',
        'Trama visível até a periferia.',
        'Deve ser inspecionado em todo controle pós-inserção — pneumotórax é a complicação imediata mais comum.',
      ),
    ],
    marcacoes: {
      1: [
        m('Ponta na junção cavoatrial', 'Posição ideal, cerca de dois corpos vertebrais abaixo da carina.', 'medida'),
        m('Segmento intravenoso', 'Trajeto retilíneo pela jugular e cava superior.'),
        m('Túnel subcutâneo', 'Mudança de direção fora do eixo venoso, na parede anterior.'),
        m('Ápices livres', 'Ausência de pneumotórax pós-punção.', 'referencia'),
      ],
    },
    conduta:
      'Todo controle pós-inserção precisa responder a três perguntas: onde está a ponta, o trajeto é venoso e há pneumotórax. Dúvida sobre posição arterial ou extravascular exige tomografia ou injeção sob controle.',
  },

  'port-a-cath': {
    mecanismo:
      'O port é totalmente implantado: um reservatório com septo de silicone alojado em bolsa subcutânea infraclavicular, ligado por um cateter à circulação venosa central. Como não há solução de continuidade com o exterior entre as punções, tem a menor taxa de infecção entre os acessos de longa permanência.',
    estruturas: [
      e(
        'Reservatório',
        'Câmara metálica ou plástica com septo puncionável, sob a pele da região infraclavicular.',
        'Ausente.',
        'Densidade arredondada ou triangular de contorno nítido na parede anterior do tórax.',
      ),
      e(
        'Cateter e sua conexão',
        'Tubo que liga o reservatório à veia subclávia e daí à cava superior.',
        'Ausente.',
        'Trajeto contínuo; a conexão com o reservatório é o ponto de falha mais frequente (síndrome de pinch-off).',
        'Fratura e embolização do cateter ocorrem quando ele é comprimido entre clavícula e primeira costela.',
      ),
      e(
        'Parênquima pulmonar sob o dispositivo',
        'Pulmão frequentemente esquecido depois que o dispositivo é identificado.',
        'Trama regular.',
        'Aqui mostra retículo grosseiro e linhas paralelas — bronquiectasias de fibrose cística.',
        'Satisfação de busca: encontrar o port não é encontrar tudo.',
      ),
      e(
        'Bronquiectasias',
        'Dilatações brônquicas irreversíveis.',
        'Brônquios periféricos não são identificáveis no filme normal.',
        'Aparecem como trilhos paralelos e anéis, com espessamento de parede.',
      ),
    ],
    marcacoes: {
      1: [
        m('Reservatório subcutâneo', 'Câmara implantada na parede torácica anterior.'),
        m('Ponta venosa central', 'Extremidade no território cavoatrial.'),
        m('Trilhos paralelos de bronquiectasia', 'Brônquios dilatados de paredes espessadas.'),
        m('Retículo grosseiro difuso', 'Doença pulmonar crônica de base — o achado que o dispositivo tende a esconder.'),
      ],
    },
    conduta:
      'Disfunção do port exige avaliar trajeto, integridade e posição da ponta; estudo com contraste identifica trombose e fratura. Sempre laude o parênquima, mesmo quando o motivo do exame é o dispositivo.',
  },

  'cateter-tunelizado': {
    mecanismo:
      'A punção subclávia oferece conforto e menor taxa de infecção que a femoral, mas atravessa um corredor estreito entre clavícula e primeira costela. Isso explica as duas complicações características: pneumotórax na inserção e compressão crônica do cateter com fratura tardia.',
    estruturas: [
      e(
        'Veia subclávia',
        'Continuação da axilar, passando entre clavícula e primeira costela.',
        'Não visível.',
        'Contém o segmento inicial do cateter, com angulação mais acentuada que na via jugular.',
        'Angulação abrupta na entrada aumenta o risco de pinch-off e fratura.',
      ),
      e(
        'Trajeto e ponta',
        'Percurso completo do dispositivo.',
        'Ausente.',
        'Deve ser seguido continuamente até a junção cavoatrial, sem dobras ou trajetos aberrantes.',
        'Ponta ascendente na jugular ou cruzando para o lado oposto indica mau posicionamento.',
      ),
      e(
        'Espaço pleural do lado puncionado',
        'Ápice e recessos pleurais.',
        'Trama até a periferia.',
        'Local obrigatório de checagem de pneumotórax e de hemotórax.',
      ),
    ],
    marcacoes: {
      1: [
        m('Entrada subclávia esquerda', 'Ponto de acesso venoso do dispositivo.'),
        m('Trajeto sem angulação abrupta', 'Curva suave reduz o risco de fratura por compressão.', 'referencia'),
        m('Ponta em posição central', 'Extremidade no território cavoatrial.'),
      ],
    },
    conduta:
      'Reveja sempre o filme pós-inserção antes de liberar o uso. Dor no ombro, dificuldade de infusão ou refluxo ausente sugerem pinch-off e pedem avaliação dirigida.',
  },

  'stent-esofagico': {
    mecanismo:
      'Stents esofágicos autoexpansíveis são colocados para manter a luz em estenoses malignas. Na radiografia aparecem como malha metálica tubular no trajeto do esôfago, discretamente à esquerda da linha média no terço inferior. Reconhecê-lo é trivial; o valor do exame está em tudo que existe ao redor.',
    estruturas: [
      e(
        'Esôfago',
        'Tubo muscular posterior à traqueia, descendo pelo mediastino posterior.',
        'Invisível sem contraste.',
        'Delineado pela malha do stent, que revela seu trajeto e a extensão tratada.',
      ),
      e(
        'Costelas',
        'Arcos a serem percorridos um a um.',
        'Cortical contínua e lisa.',
        'Quinto arco direito destruído, com massa de partes moles associada — metástase.',
        'Lesões costais são das omissões mais frequentes: elas ficam na periferia do campo de atenção.',
      ),
      e(
        'Espaço pleural',
        'Recessos que acompanham a doença.',
        'Seios livres.',
        'Derrames bilaterais, coerentes com disseminação.',
      ),
      e(
        'Mediastino',
        'Compartimento que aloja o tumor primário.',
        'Contornos regulares.',
        'Pode estar alargado pela massa esofágica e por linfonodos.',
      ),
    ],
    marcacoes: {
      1: [
        m('Stent no trajeto esofágico', 'Malha tubular no mediastino posterior, à esquerda da linha média.'),
        m('Destruição da quinta costela direita', 'Falha cortical com massa de partes moles — doença metastática.'),
        m('Derrames pleurais', 'Comprometimento pleural bilateral.'),
        m('Fios de esternotomia', 'Antecedente cirúrgico, contexto e não achado novo.', 'referencia'),
      ],
    },
    conduta:
      'Tomografia estadia a doença e avalia complicações do stent (migração, fístula, obstrução). Identificar o dispositivo é o começo da leitura, nunca o fim.',
  },

  'tubo-endotraqueal-mal-posicionado': {
    mecanismo:
      'O brônquio principal direito é mais curto, largo e verticalizado que o esquerdo. Um tubo avançado além da carina segue naturalmente para a direita e passa a ventilar só aquele pulmão. O esquerdo, excluído da ventilação, reabsorve o ar e colapsa — opacificando-se com broncogramas aéreos e perdendo volume em minutos a horas.',
    estruturas: [
      e(
        'Traqueia e carina',
        'Via aérea central e sua bifurcação, geralmente entre T4 e T7.',
        'Coluna aérea mediana com bifurcação identificável.',
        'A carina é a régua: a ponta do tubo deve ficar 3 a 5 cm acima dela, com a cabeça em posição neutra.',
        'Flexão do pescoço avança a ponta até 2 cm; extensão a recua o mesmo tanto.',
      ),
      e(
        'Ponta do tubo endotraqueal',
        'Extremidade radiopaca do tubo.',
        'Ausente.',
        'Situada dentro do brônquio principal direito, além da carina — intubação seletiva.',
      ),
      e(
        'Pulmão esquerdo',
        'Território excluído da ventilação.',
        'Aerado e simétrico ao direito.',
        'Opacificado por colapso, com perda de volume e broncogramas aéreos.',
      ),
      e(
        'Pulmão direito',
        'Território que recebe todo o volume corrente.',
        'Ventilação equilibrada com o contralateral.',
        'Hiperinsuflado, com risco de barotrauma e pneumotórax.',
      ),
    ],
    marcacoes: {
      1: [
        m('Ponta no brônquio principal direito', 'Intubação seletiva: além da carina, para o lado mais verticalizado.'),
        m('Carina como referência', 'A ponta deveria estar 3 a 5 cm acima dela.', 'medida'),
        m('Colapso do pulmão esquerdo', 'Opacificação com perda de volume por exclusão ventilatória.'),
        m('Broncogramas aéreos', 'Vias aéreas visíveis contra o parênquima colapsado.'),
      ],
    },
    conduta:
      'Tracione o tubo sob ausculta e confirme com nova radiografia. Hipoxemia súbita em paciente intubado sempre pede checagem de posição do tubo antes de escalonar terapia.',
  },

  'artefatos-de-cirurgia-cardiaca': {
    mecanismo:
      'Material implantado é o registro radiográfico da história cirúrgica. Fios medianos indicam esternotomia; próteses valvares indicam troca; clipes axilares indicam cirurgia mamária ou esvaziamento axilar. A topografia de cada grupo de artefatos, mais que sua aparência, é o que revela o procedimento.',
    estruturas: [
      e(
        'Esterno e seus fios',
        'Linha média anterior com fios de aço.',
        'Sem material.',
        'Fios alinhados e íntegros marcam esternotomia prévia bem consolidada.',
        'Fios migrados, rompidos ou com afastamento progressivo sugerem deiscência.',
      ),
      e(
        'Plano valvar aórtico',
        'Topografia mais alta, anterior e à direita entre as valvas.',
        'Não individualizável.',
        'Ocupada pelo anel da prótese; a distinção segura da mitral exige perfil.',
      ),
      e(
        'Região axilar',
        'Partes moles laterais, fora do mediastino.',
        'Sem densidades metálicas.',
        'Clipes agrupados indicam abordagem mamária ou axilar, não cardíaca.',
        'Atribuir clipes axilares a cirurgia cardíaca é erro comum de leitura apressada.',
      ),
    ],
    marcacoes: {
      1: [
        m('Fios de esternotomia', 'Acesso mediano prévio.'),
        m('Prótese em posição aórtica', 'Anel no plano valvar superior e anterior.'),
        m('Clipes axilares', 'Marcadores de cirurgia mamária ou axilar.', 'referencia'),
      ],
    },
    conduta:
      'Correlacione cada grupo de artefatos com o histórico documentado. Na dúvida sobre qual valva foi trocada, peça perfil ou consulte o relatório cirúrgico.',
  },

  'protese-valvar-mitral': {
    mecanismo:
      'O topograma (scout) da tomografia é uma projeção rápida de baixa dose, feita para planejar o corte. Não tem a resolução nem a técnica de uma radiografia diagnóstica, mas permite reconhecer material metálico com clareza — e serve para lembrar que topogramas frequentemente contêm achados que ninguém revisa.',
    estruturas: [
      e(
        'Anel da prótese mitral',
        'Estrutura circular metálica no plano atrioventricular esquerdo.',
        'Ausente.',
        'Projeta-se mais baixa e posterior que a aórtica, centrada e discretamente à esquerda.',
        'Na frontal, aórtica e mitral se sobrepõem: o perfil é o que separa as duas com segurança.',
      ),
      e(
        'Fios de esternotomia',
        'Material mediano de fechamento.',
        'Ausente.',
        'Confirmam o acesso cirúrgico e contextualizam a prótese.',
      ),
      e(
        'Topograma como método',
        'Projeção de planejamento da tomografia.',
        'Não se aplica.',
        'Baixa resolução e técnica não diagnóstica: serve para reconhecer material, não para laudar o pulmão.',
        'Não use scout para excluir doença pulmonar — mas revise-o, porque achados incidentais aparecem ali.',
      ),
    ],
    marcacoes: {
      1: [
        m('Anel valvar mitral', 'Prótese em topografia atrioventricular esquerda.'),
        m('Fios medianos', 'Esternotomia prévia.', 'referencia'),
        m('Baixa resolução do scout', 'Limite do método: reconhecer material sim, laudar parênquima não.', 'armadilha'),
      ],
    },
    conduta:
      'Avaliação de prótese exige ecocardiograma e, quando indicado, fluoroscopia ou tomografia sincronizada. O topograma serve para reconhecimento, não para conclusão.',
  },

  'marcapasso-ocultando-massa': {
    mecanismo:
      'A satisfação de busca é o erro perceptivo em que o achado óbvio encerra a procura. Um gerador de marcapasso é grande, denso e chama toda a atenção — enquanto uma opacidade de poucos centímetros na sua borda tem contraste baixo e fica exatamente na zona que o olho já considerou "resolvida".',
    estruturas: [
      e(
        'Gerador e sua margem',
        'Cápsula metálica infraclavicular e o parênquima imediatamente ao redor.',
        'Ausente.',
        'A opacidade maligna está na margem do gerador, região sistematicamente negligenciada.',
        'Reveja deliberadamente os contornos de todo dispositivo antes de encerrar a leitura.',
      ),
      e(
        'Eletrodos e suas pontas',
        'Cabos que terminam em átrio direito, ventrículo direito e seio coronário.',
        'Ausentes.',
        'Três eletrodos indicam ressincronizador; a ponta em seio coronário cruza para a esquerda na frontal.',
      ),
      e(
        'Opacidade pulmonar adjacente',
        'Lesão parenquimatosa próxima ao dispositivo.',
        'Trama regular.',
        'Densidade de contorno próprio, que não pertence ao gerador nem ao trajeto dos cabos.',
      ),
    ],
    marcacoes: {
      1: [
        m('Opacidade na margem do gerador', 'Lesão com contorno independente, retrospectivamente já maligna.'),
        m('Ponta em seio coronário', 'Eletrodo que cruza para a esquerda — configuração de ressincronizador.', 'referencia'),
        m('Zona de atenção reduzida', 'Perímetro de todo dispositivo: revise-o antes de fechar o laudo.', 'armadilha'),
      ],
    },
    conduta:
      'Toda leitura precisa de uma varredura final dedicada a ápices, região retrocardíaca, seios costofrênicos e perímetro dos dispositivos. Opacidade nova ou não explicada exige tomografia.',
  },

  'marcapasso-com-massa-pulmonar': {
    mecanismo:
      'A mesma lesão do caso anterior, meses depois. O crescimento a torna inequívoca — e demonstra que o achado inicial não era invisível, apenas não procurado. É o argumento mais forte a favor de comparar sempre com exames anteriores.',
    estruturas: [
      e(
        'Massa pulmonar',
        'Lesão adjacente ao gerador.',
        'Ausente.',
        'Agora nítida, com contorno próprio e dimensões claramente maiores que no exame prévio.',
      ),
      e(
        'Comparação temporal',
        'Série de exames do mesmo paciente.',
        'Não se aplica.',
        'A comparação transforma um achado duvidoso em diagnóstico; sem ela, o crescimento passa despercebido.',
        'Laudar sem os exames anteriores é abrir mão da informação mais valiosa disponível.',
      ),
      e(
        'Gerador',
        'Dispositivo que se mantém idêntico entre os exames.',
        'Ausente.',
        'Serve de referência estável: o que mudou não foi o dispositivo.',
      ),
    ],
    marcacoes: {
      1: [
        m('Massa pulmonar evidente', 'Lesão de contorno próprio, independente do gerador.'),
        m('Crescimento em relação ao exame prévio', 'Progressão documentada, definidora do prognóstico.', 'referencia'),
        m('Gerador inalterado', 'Referência estável entre os dois exames.', 'referencia'),
      ],
    },
    conduta:
      'Tomografia com contraste e biópsia definem estadiamento e histologia. Registre no laudo o comparativo: a data do exame anterior e o que mudou entre eles.',
  },

  'eletrodo-de-marcapasso-fraturado': {
    mecanismo:
      'Eletrodos sofrem flexão repetida a cada batimento e a cada movimento do ombro. Pontos de estresse — a passagem entre clavícula e primeira costela e a conexão com o gerador — concentram fadiga do material e podem fraturar, produzindo falha de captura ou de sensing.',
    estruturas: [
      e(
        'Eletrodo',
        'Cabo condutor entre gerador e câmara cardíaca.',
        'Ausente.',
        'Descontinuidade ou angulação anormal em ponto de estresse mecânico.',
        'Sobreposição de estruturas simula fratura; confirme em outra incidência antes de afirmar.',
      ),
      e(
        'Pontos de estresse',
        'Passagem costoclavicular e conexão ao gerador.',
        'Não se aplica.',
        'Locais preferenciais de fadiga: percorra-os com atenção redobrada.',
      ),
      e(
        'Silhueta cardíaca',
        'Coração avaliado no contexto do dispositivo.',
        'ICT abaixo de 50% em PA adequada.',
        'Muito aumentada — considerando a técnica AP sentada, o tamanho real precisa de ressalva.',
        'Não calcule ICT em AP sentada: a ampliação geométrica infla a medida.',
      ),
      e(
        'Vasos dos campos superiores',
        'Marcadores de pressão venosa pulmonar.',
        'Mais finos que os basais em ortostatismo.',
        'Aumentados, indicando hipertensão venosa pulmonar concomitante.',
      ),
    ],
    marcacoes: {
      1: [
        m('Descontinuidade do eletrodo', 'Interrupção do cabo em ponto de estresse — explica o mau funcionamento.'),
        m('Cardiomegalia', 'Silhueta aumentada, com a ressalva da técnica AP sentada.', 'medida'),
        m('Vasos superiores proeminentes', 'Hipertensão venosa pulmonar associada.'),
        m('Sobreposição simulando fratura', 'Confirme em outra incidência antes de concluir.', 'armadilha'),
      ],
    },
    conduta:
      'Interrogação do dispositivo confirma a falha elétrica; incidências oblíquas ou fluoroscopia confirmam a fratura. A conduta é do eletrofisiologista: revisão ou implante de novo eletrodo.',
  },
}

// ══════════════════════════════════ Pneumotórax ══════════════════════════════════

const PNEUMOTORAX: Record<string, DetalheCaso> = {
  'pneumotorax-hipertensivo': {
    mecanismo:
      'Quando a lesão pleural funciona como válvula unidirecional, cada inspiração adiciona ar que a expiração não devolve. A pressão intrapleural torna-se positiva, colapsa o pulmão, desloca o mediastino, comprime a cava e reduz o retorno venoso. A parada é hemodinâmica, não respiratória — e ocorre em minutos.',
    estruturas: [
      e(
        'Espaço pleural',
        'Cavidade virtual entre os folhetos.',
        'Pressão negativa, alguns mililitros de líquido.',
        'Ocupado por ar sob pressão positiva, expandindo o hemitórax.',
      ),
      e(
        'Pulmão colapsado',
        'Parênquima retraído em direção ao hilo.',
        'Preenche todo o hemitórax, com trama até a periferia.',
        'Reduzido a um coto denso junto ao hilo, sem trama vascular além da linha pleural.',
        'Um pulmão totalmente colapsado é denso e pode ser confundido com massa hilar.',
      ),
      e(
        'Mediastino',
        'Estruturas centrais deslocáveis.',
        'Centrado.',
        'Empurrado para o lado contralateral, com compressão do pulmão sadio e das veias cavas.',
      ),
      e(
        'Hemidiafragma ipsilateral',
        'Cúpula que responde à pressão pleural.',
        'Convexa para cima.',
        'Deprimida ou retificada pela pressão positiva — um dos sinais mais objetivos de tensão.',
      ),
    ],
    marcacoes: {
      1: [
        m('Hemitórax hiperlúcido', 'Ar pleural ocupando o espaço, sem trama vascular.'),
        m('Pulmão completamente colapsado', 'Coto denso junto ao hilo.'),
        m('Mediastino desviado para a direita', 'Efeito de massa do ar sob pressão.'),
        m('Hemidiafragma esquerdo deprimido', 'Sinal objetivo de tensão.'),
      ],
    },
    conduta:
      'Pneumotórax hipertensivo é diagnóstico clínico: descomprima imediatamente com punção ou toracostomia, sem esperar imagem. A radiografia serve apenas para confirmar depois e avaliar o dreno.',
  },

  'tamanho-do-pneumotorax': {
    mecanismo:
      'Medir pneumotórax em radiografia é uma aproximação bidimensional de um volume tridimensional. A regra britânica (separação maior que 2 cm no nível do hilo indica pneumotórax grande, aproximadamente 50% do volume) só vale quando a borda do pulmão é razoavelmente paralela à parede. Compressão não uniforme e coleções loculadas quebram completamente essa premissa.',
    estruturas: [
      e(
        'Linha pleural visceral',
        'Borda do pulmão colapsado.',
        'Não visível: pleura visceral e parietal estão em contato.',
        'Linha fina e nítida, separada da parede pelo ar pleural — a distância entre elas é o que se mede.',
        'Prega cutânea produz uma borda com densidade que se degrada gradualmente, e trama vascular além dela.',
      ),
      e(
        'Nível hilar',
        'Altura de referência para a medida britânica.',
        'Não se aplica.',
        'Ponto padronizado onde se mede a separação; medir no ápice superestima.',
        'Medir onde a separação é maior, em vez do nível hilar, superdimensiona o pneumotórax.',
      ),
      e(
        'Ápice pulmonar',
        'Local mais frequente de pneumotórax pequeno em ortostatismo.',
        'Trama visível até o vértice.',
        'Faixa de ar apical sem vasos, muitas vezes o único sinal em coleções pequenas.',
      ),
      e(
        'Coleção localizada',
        'Ar pleural confinado por aderências.',
        'Não se aplica.',
        'Pode conter volume grande sem produzir separação hilar — a regra dos 2 cm não se aplica.',
      ),
    ],
    marcacoes: {
      1: [
        m('Separação maior que 2 cm no hilo', 'Critério britânico clássico de pneumotórax grande.', 'medida'),
        m('Borda pulmonar paralela à parede', 'Premissa necessária para a regra ser válida.', 'referencia'),
      ],
      2: [
        m('Faixa apical de ar', 'Pneumotórax pequeno, restrito ao vértice.'),
        m('Ausência de trama além da linha', 'Confirmação do ar pleural.', 'referencia'),
      ],
      3: [
        m('Coleção localizada', 'Ar confinado por aderências, sem separação hilar significativa.'),
        m('Compressão não uniforme', 'Aqui a regra dos 2 cm perde validade — julgue por volume e clínica.', 'armadilha'),
      ],
    },
    conduta:
      'A conduta depende de sintomas, reserva pulmonar e se é primário ou secundário — não apenas do tamanho. Em doença pulmonar de base, coleções pequenas já justificam intervenção.',
  },

  'pneumotorax-sutil': {
    mecanismo:
      'Em ortostatismo, o ar sobe: o pneumotórax pequeno se acumula no ápice, onde a linha pleural é fina, o contraste é baixo e a sobreposição de costelas, clavícula e partes moles é máxima. É um dos achados mais perdidos da radiografia de tórax — e o mais dependente de procurar deliberadamente.',
    estruturas: [
      e(
        'Linha pleural visceral',
        'Borda do pulmão separada da parede.',
        'Invisível.',
        'Traço fino como marca de lápis, contínuo e nítido, acompanhando o contorno do pulmão.',
        'A borda medial da escápula é o imitador mais comum: ela continua para fora do gradil costal, a pleura não.',
      ),
      e(
        'Ápice pulmonar',
        'Vértice do hemitórax, acima da clavícula.',
        'Trama vascular fina, porém presente.',
        'Faixa avascular entre a linha e a parede — a ausência de vasos é o argumento decisivo.',
      ),
      e(
        'Pregas cutâneas',
        'Dobras de pele comprimidas contra o detector.',
        'Podem existir em qualquer filme, sobretudo em portáteis.',
        'Produzem borda com transição gradual de densidade e trama vascular visível além dela.',
      ),
      e(
        'Trama vascular periférica',
        'Vasos subpleurais.',
        'Visíveis até quase a pleura.',
        'Ausentes na faixa de ar: procure vasos, não apenas a linha.',
      ),
    ],
    marcacoes: {
      1: [
        m('Linha pleural fina', 'Traço nítido acompanhando o contorno pulmonar.'),
        m('Faixa avascular periférica', 'Ausência de vasos além da linha, confirmando ar pleural.'),
        m('Diferencial de prega cutânea', 'Prega tem transição gradual e mantém vasos além dela.', 'armadilha'),
      ],
    },
    conduta:
      'Radiografia em expiração não aumenta o rendimento de forma consistente e não é recomendada de rotina. Em dúvida com repercussão clínica, tomografia resolve — e o ultrassom à beira do leito é altamente sensível no trauma.',
  },

  'grande-pneumotorax-tensao-inicial': {
    mecanismo:
      'A tensão é um contínuo, não um estado binário. Antes do desvio mediastinal exuberante, surgem sinais discretos: hemidiafragma discretamente deprimido, coração levemente deslocado, traqueia minimamente desviada. Já nesse ponto o retorno venoso começa a cair — a deterioração é rápida e o gatilho para agir é clínico.',
    estruturas: [
      e(
        'Coração',
        'Estrutura mediastinal mais móvel.',
        'Dois terços à esquerda da linha média.',
        'Deslocado adicionalmente à esquerda pelo pneumotórax direito.',
      ),
      e(
        'Hemidiafragma direito',
        'Cúpula do lado do pneumotórax.',
        'Convexa e mais alta que a esquerda.',
        'Discretamente deprimida — sinal precoce e frequentemente subvalorizado de tensão.',
        'Depressão sutil é fácil de ignorar; compare a curvatura com a do lado oposto.',
      ),
      e(
        'Traqueia',
        'Referência mediastinal superior.',
        'Central.',
        'Minimamente desviada: pouco desvio não significa pouca gravidade.',
      ),
      e(
        'Pulmão direito colapsado',
        'Parênquima retraído.',
        'Trama até a periferia.',
        'Colapso importante, com grande faixa de ar pleural.',
      ),
    ],
    marcacoes: {
      1: [
        m('Grande pneumotórax direito', 'Ampla faixa avascular com pulmão retraído.'),
        m('Coração desviado à esquerda', 'Efeito de massa em progressão.'),
        m('Hemidiafragma direito deprimido', 'Sinal precoce de tensão.'),
        m('Desvio traqueal discreto', 'Sutil, mas coerente com o conjunto.', 'referencia'),
      ],
    },
    conduta:
      'Priorize ABC e chame ajuda: com instabilidade, descomprima antes de discutir a terminologia. A imagem não deve atrasar o tratamento de um paciente que está deteriorando.',
  },

  'dreno-toracico': {
    mecanismo:
      'O dreno restabelece a pressão negativa pleural e permite a reexpansão. A radiografia de controle avalia três coisas: se o pulmão reexpandiu, onde estão a ponta e os orifícios laterais, e se persistem coleções. O último orifício lateral precisa estar dentro da cavidade pleural — caso contrário, o sistema aspira o subcutâneo.',
    estruturas: [
      e(
        'Dreno torácico',
        'Tubo radiopaco com orifícios laterais e linha marcadora interrompida no último orifício.',
        'Ausente.',
        'Projetado em direção ao tórax superior; ponta e trajeto devem ser seguidos integralmente.',
        'A interrupção da linha radiopaca marca o último orifício — ele precisa estar intrapleural.',
      ),
      e(
        'Pulmão reexpandido',
        'Parênquima que reocupa o hemitórax.',
        'Trama até a periferia.',
        'Reexpandido, com trama recuperada quase até a parede.',
      ),
      e(
        'Coleção residual apical',
        'Ar remanescente após drenagem.',
        'Ausente.',
        'Pequena faixa apical, comum e geralmente sem significado se estável e assintomática.',
      ),
      e(
        'Trajeto na parede torácica',
        'Percurso do dreno entre os arcos costais.',
        'Não se aplica.',
        'Dreno em posição extrapleural ou intrafissural drena mal, mesmo com aspecto "bem posicionado" na frontal.',
      ),
    ],
    marcacoes: {
      1: [
        m('Trajeto e ponta do dreno', 'Percurso íntegro em direção ao ápice.'),
        m('Último orifício lateral', 'Marcado pela interrupção da linha radiopaca; deve estar intrapleural.', 'referencia'),
        m('Pneumotórax residual apical', 'Coleção pequena remanescente após reexpansão.'),
        m('Trama recuperada', 'Vasos visíveis novamente até perto da parede.', 'referencia'),
      ],
    },
    conduta:
      'Posição da ponta isolada não define funcionamento: avalie oscilação da coluna líquida, borbulhamento e resposta clínica. Falha de reexpansão pede tomografia para procurar loculação, mau posicionamento ou pulmão encarcerado.',
  },

  'enfisema-subcutaneo': {
    mecanismo:
      'Quando um orifício lateral do dreno fica fora da pleura, ou quando a pressão pleural encontra um trajeto para os tecidos moles, o ar disseca os planos fasciais da parede, do pescoço e da face. As lucências lineares que aparecem seguem as fibras musculares e podem cobrir todo o hemitórax — e, ao fazê-lo, esconder o pneumotórax que originou tudo.',
    estruturas: [
      e(
        'Tecido celular subcutâneo',
        'Planos fasciais da parede torácica.',
        'Densidade de partes moles homogênea.',
        'Atravessado por lucências lineares e ramificadas que desenham os feixes musculares.',
      ),
      e(
        'Músculo peitoral',
        'Massa muscular anterior.',
        'Densidade uniforme.',
        'Delineado pelo ar entre suas fibras — o padrão "em penas" característico.',
      ),
      e(
        'Orifícios laterais do dreno',
        'Aberturas próximas à ponta.',
        'Ausentes.',
        'Um orifício fora da cavidade pleural aspira ar para o subcutâneo e perpetua o quadro.',
        'A frontal pode não distinguir intra de extrapleural: se o enfisema piora, reavalie a posição.',
      ),
      e(
        'Espaço pleural sob o enfisema',
        'Cavidade que continua precisando ser avaliada.',
        'Trama regular.',
        'Difícil de julgar sob o ar dos tecidos moles — pneumotórax pode ficar mascarado.',
      ),
    ],
    marcacoes: {
      1: [
        m('Lucências nos tecidos moles', 'Ar dissecando os planos fasciais da parede.'),
        m('Padrão em penas no peitoral', 'Ar delineando feixes musculares.'),
        m('Posição dos orifícios laterais', 'Verifique se o último orifício está intrapleural.', 'referencia'),
        m('Pneumotórax mascarado', 'O enfisema extenso pode esconder ar pleural residual.', 'armadilha'),
      ],
    },
    conduta:
      'Enfisema progressivo exige reavaliar posição e funcionamento do dreno; tomografia esclarece quando a frontal não resolve. Crepitação cervical extensa e disfagia pedem avaliação urgente de via aérea.',
  },

  'pneumotorax-iatrogenico': {
    mecanismo:
      'Toracocentese, biópsia transtorácica, punção de veia central e ventilação com pressão positiva são as causas iatrogênicas clássicas. Quando ar e líquido coexistem no mesmo espaço pleural, a interface entre eles fica horizontal — não em menisco. Esse nível horizontal é a assinatura do hidropneumotórax.',
    estruturas: [
      e(
        'Interface ar-líquido',
        'Superfície entre os dois conteúdos pleurais.',
        'Não existe.',
        'Linha horizontal reta, que atravessa o hemitórax de parede a parede.',
        'Confundir esse nível com menisco leva a subestimar o componente aéreo.',
      ),
      e(
        'Linha pleural',
        'Borda do pulmão acima do líquido.',
        'Invisível.',
        'Visível acima do nível, delimitando o ar pleural.',
      ),
      e(
        'Base pulmonar direita',
        'Território puncionado.',
        'Aerado, com seio livre.',
        'Consolidação e derrame residual, contexto do procedimento.',
      ),
      e(
        'Recessos pleurais',
        'Locais de acúmulo do líquido remanescente.',
        'Ângulos agudos.',
        'Velados pelo líquido que restou após a punção.',
      ),
    ],
    marcacoes: {
      1: [
        m('Nível ar-líquido horizontal', 'Assinatura do hidropneumotórax, diferente do menisco.'),
        m('Linha pleural acima do nível', 'Delimita o componente aéreo.'),
        m('Derrame residual', 'Líquido remanescente após a toracocentese.'),
      ],
    },
    conduta:
      'Radiografia pós-procedimento de rotina não é obrigatória em toda toracocentese guiada por ultrassom, mas é mandatória se houver sintoma novo. Drenagem depende do tamanho, dos sintomas e da reserva pulmonar.',
  },

  'pneumotorax-bilateral-na-dpoc': {
    mecanismo:
      'No enfisema, a destruição alveolar cria bolhas de parede fina que rompem com facilidade — o pneumotórax secundário. Como a reserva funcional já está comprometida, mesmo coleções pequenas causam grande repercussão. E encontrar um pneumotórax não encerra a busca: bolhas bilaterais rompem bilateralmente.',
    estruturas: [
      e(
        'Bolhas enfisematosas',
        'Espaços aéreos maiores que 1 cm, de parede fina.',
        'Ausentes.',
        'Lucências delimitadas por finas paredes curvas, frequentemente múltiplas e bilaterais.',
        'A parede de uma bolha imita linha pleural: uma tem concavidade voltada para o hilo, a outra acompanha a parede.',
      ),
      e(
        'Linha pleural bilateral',
        'Bordas dos dois pulmões.',
        'Invisíveis.',
        'Presentes dos dois lados — o achado que se perde quando a busca para no primeiro pneumotórax.',
      ),
      e(
        'Hiperinsuflação',
        'Estado crônico do tórax enfisematoso.',
        'Cúpulas convexas, menos de 10 arcos posteriores acima do diafragma.',
        'Diafragmas retificados, aumento do espaço retroesternal e gradil horizontalizado.',
      ),
      e(
        'Trama vascular',
        'Vasos pulmonares.',
        'Distribuição regular.',
        'Rarefeita e desorganizada pela destruição parenquimatosa, dificultando avaliar o "além da linha".',
      ),
    ],
    marcacoes: {
      1: [
        m('Linha pleural à direita', 'Primeiro pneumotórax identificado.'),
        m('Linha pleural à esquerda', 'Segundo pneumotórax — encontrar um não encerra a busca.'),
        m('Bolhas de parede fina', 'Substrato do pneumotórax secundário.'),
        m('Hiperinsuflação crônica', 'Diafragmas retificados e gradil horizontalizado.', 'referencia'),
      ],
    },
    conduta:
      'Pneumotórax secundário quase sempre exige drenagem, mesmo quando pequeno. Tomografia é frequentemente necessária para diferenciar bolha gigante de ar pleural antes de qualquer intervenção.',
  },

  'pseudopneumotorax-bolha': {
    mecanismo:
      'Uma bolha gigante pode ocupar mais de um terço do hemitórax e parecer ar pleural. A diferença é geométrica: a bolha tem parede própria, com concavidade voltada para o hilo, e comprime o pulmão em vez de deixá-lo retrair simetricamente. Drenar uma bolha por engano provoca fístula broncopleural persistente e pode ser catastrófico.',
    estruturas: [
      e(
        'Parede da bolha',
        'Membrana fina que delimita o espaço aéreo.',
        'Ausente.',
        'Linha curva com concavidade voltada para o hilo — o oposto da linha pleural, que acompanha a parede torácica.',
        'Essa inversão de concavidade é o sinal isolado mais útil, e ainda assim falha em casos limítrofes.',
      ),
      e(
        'Ângulos com a parede torácica',
        'Interface entre a lucência e o gradil.',
        'Não se aplica.',
        'A bolha forma ângulos obtusos com a parede; o pneumotórax acompanha o contorno pleural continuamente.',
      ),
      e(
        'Vasos dentro da lucência',
        'Trama residual no interior do espaço.',
        'Trama regular.',
        'Bolhas podem conter septos e vasos finos atravessando; ar pleural é absolutamente avascular.',
      ),
      e(
        'Exames prévios',
        'Comparação temporal.',
        'Não se aplica.',
        'Estabilidade ao longo de meses ou anos é o argumento mais forte a favor de bolha.',
        'Sem comparativo e com dúvida clínica, peça tomografia antes de drenar.',
      ),
    ],
    marcacoes: {
      1: [
        m('Parede da bolha', 'Linha curva de concavidade voltada para o hilo.'),
        m('Ângulos obtusos com a parede', 'Geometria oposta à do pneumotórax.', 'referencia'),
        m('Septos e vasos internos', 'Estruturas dentro da lucência afastam ar pleural puro.'),
        m('Estabilidade em exames prévios', 'Argumento decisivo a favor de bolha.', 'referencia'),
      ],
    },
    conduta:
      'Na dúvida, tomografia antes do dreno — sempre. Puncionar uma bolha gigante gera fístula persistente, infecção e piora clínica em paciente já com pouca reserva.',
  },
}

// ══════════════════════════════════ Câncer de pulmão ══════════════════════════════════

const CANCER: Record<string, DetalheCaso> = {
  'massa-versus-consolidacao': {
    mecanismo:
      'A radiografia mostra densidade, não histologia. Uma neoplasia pode crescer como nódulo/massa de contorno definido ou infiltrar o espaço aéreo e produzir consolidação indistinguível de pneumonia — como no carcinoma de crescimento lepídico. O papel do laudo é descrever o padrão com precisão e explicitar o diferencial, sem presumir causa.',
    estruturas: [
      e(
        'Massa pulmonar',
        'Lesão sólida maior que 3 cm (abaixo disso, nódulo).',
        'Ausente.',
        'Opacidade arredondada de contorno relativamente definido, com interface nítida contra o pulmão aerado.',
        'Tamanho não define malignidade, mas acima de 3 cm a probabilidade sobe muito.',
      ),
      e(
        'Consolidação',
        'Preenchimento do espaço aéreo por líquido, células ou tecido.',
        'Ausente.',
        'Opacidade de margens indefinidas, frequentemente com broncogramas aéreos, que não desloca estruturas.',
        'Consolidação que não resolve após tratamento adequado exige investigação de neoplasia.',
      ),
      e(
        'Broncogramas aéreos',
        'Vias aéreas visíveis dentro da opacidade.',
        'Invisíveis no pulmão aerado.',
        'Presentes na consolidação e também em tumores de crescimento lepídico — não excluem câncer.',
      ),
      e(
        'Espaço pleural',
        'Recessos a avaliar em ambos os padrões.',
        'Livres.',
        'Derrame ocorre em infecção e em neoplasia; sua presença não decide a etiologia.',
      ),
    ],
    marcacoes: {
      1: [
        m('Massa arredondada', 'Contorno definido e interface nítida com o pulmão.'),
        m('Ausência de perda de volume', 'A lesão ocupa espaço em vez de retrair.', 'referencia'),
      ],
      2: [
        m('Consolidação', 'Opacidade de margens indefinidas — padrão, não diagnóstico.'),
        m('Broncogramas aéreos', 'Presentes tanto em pneumonia quanto em tumor lepídico.', 'armadilha'),
      ],
    },
    conduta:
      'Tomografia com contraste caracteriza a lesão e o estadiamento; broncoscopia ou biópsia definem a histologia. Consolidação persistente por mais de 6 a 8 semanas apesar de tratamento adequado é indicação formal de investigar câncer.',
  },

  'massa-hilar-e-derrame': {
    mecanismo:
      'Tumores centrais crescem no hilo e nos linfonodos regionais. Como massa e vasos hilares têm a mesma densidade, a arquitetura vascular normal do hilo é apagada — e é exatamente essa perda de definição, mais que o tamanho, que denuncia a lesão. Adenopatia mediastinal apaga as linhas paratraqueais e alarga o mediastino.',
    estruturas: [
      e(
        'Hilo direito',
        'Artéria interlobar, veias superiores e brônquios.',
        'Densidade com vasos individualizáveis; hilo direito mais baixo que o esquerdo.',
        'Aumentado e denso, com perda da arquitetura vascular.',
        'Compare os hilos por densidade e definição, não só por altura e tamanho.',
      ),
      e(
        'Faixa paratraqueal direita',
        'Interface entre pulmão e traqueia, à direita do mediastino superior.',
        'Linha fina, com menos de 4 mm de espessura.',
        'Apagada por linfonodos aumentados — sinal sensível de adenopatia mediastinal.',
      ),
      e(
        'Linfonodos mediastinais',
        'Cadeias paratraqueais, subcarinais e hilares.',
        'Não individualizáveis.',
        'Aumentados, alargando o mediastino superior.',
      ),
      e(
        'Seio costofrênico',
        'Recesso pleural inferior.',
        'Ângulo agudo.',
        'Velado, com menisco — derrame associado que impacta o estadiamento.',
      ),
    ],
    marcacoes: {
      1: [
        m('Hilo direito aumentado e denso', 'Massa com perda da arquitetura vascular normal.'),
        m('Faixa paratraqueal apagada', 'Adenopatia mediastinal.'),
        m('Menisco pleural', 'Derrame associado.'),
        m('Hilo esquerdo como controle', 'Compare densidade e definição entre os lados.', 'referencia'),
      ],
    },
    conduta:
      'Tomografia com contraste, PET-TC e amostragem linfonodal (EBUS ou mediastinoscopia) definem o estadiamento. Derrame maligno confirmado muda a classificação para M1a e afasta a cirurgia curativa.',
  },

  'massa-cavitada': {
    mecanismo:
      'O tumor cresce e supera o suprimento vascular; a porção central necrosa e drena por um brônquio, deixando uma cavidade. É mais frequente no carcinoma escamoso. Parede espessa (acima de 15 mm) e irregular favorece malignidade, mas abscesso, tuberculose, êmbolo séptico e vasculite também cavitam.',
    estruturas: [
      e(
        'Parede da cavidade',
        'Tecido remanescente ao redor da necrose.',
        'Não se aplica.',
        'Espessa e irregular, com contorno interno nodular — padrão que favorece neoplasia.',
        'Parede fina e regular não exclui câncer, apenas reduz a probabilidade.',
      ),
      e(
        'Conteúdo da cavidade',
        'Espaço central após drenagem.',
        'Não se aplica.',
        'Ar, eventualmente com nível líquido; nódulo mural sugere componente sólido residual.',
      ),
      e(
        'Parênquima ao redor',
        'Pulmão adjacente.',
        'Trama regular.',
        'Procure satélites, disseminação broncogênica e outras lesões cavitadas.',
      ),
      e(
        'Artefatos de revascularização',
        'Fios e clipes de cirurgia cardíaca prévia.',
        'Ausentes.',
        'Contexto clínico do paciente; não têm relação causal com a lesão pulmonar.',
        'Material cirúrgico é distração: não deixe a atenção parar nele.',
      ),
    ],
    marcacoes: {
      1: [
        m('Parede espessa e irregular', 'Contorno interno nodular, favorecendo neoplasia.'),
        m('Cavidade central', 'Necrose drenada por via brônquica.'),
        m('Fios e clipes cardíacos', 'Antecedente cirúrgico sem relação com a lesão.', 'referencia'),
      ],
    },
    conduta:
      'Tomografia mede a parede com precisão e procura lesões adicionais; broncoscopia ou punção definem histologia e afastam infecção. Nunca decida entre abscesso e câncer apenas pela radiografia.',
  },

  'colapso-lobar-sinal-s-dourado': {
    mecanismo:
      'Quando um tumor central obstrui o brônquio do lobo superior direito, o lobo colapsa e a fissura horizontal sobe. Mas a massa impede que a porção medial da fissura suba junto: ali ela é empurrada para baixo, criando uma convexidade. A soma — concavidade periférica e convexidade central — desenha um S reverso. É um sinal indireto altamente específico de massa obstrutiva.',
    estruturas: [
      e(
        'Fissura horizontal',
        'Plano entre lobo superior e médio à direita.',
        'Linha retilínea na altura do quarto arco anterior.',
        'Elevada na periferia e abaulada centralmente — o contorno em S.',
        'O S pode ser mais evidente que a própria massa: procure o contorno antes de procurar a lesão.',
      ),
      e(
        'Massa central',
        'Tumor no hilo ou no brônquio lobar.',
        'Ausente.',
        'Responsável pela convexidade medial; frequentemente indistinguível do hilo normal.',
      ),
      e(
        'Lobo superior direito',
        'Território colapsado.',
        'Aerado.',
        'Denso e retraído contra o ápice e o mediastino.',
      ),
      e(
        'Hilo direito',
        'Estruturas centrais tracionadas.',
        'Mais baixo que o esquerdo.',
        'Elevado, acompanhando a retração.',
      ),
    ],
    marcacoes: {
      1: [
        m('Contorno em S da fissura', 'Concavidade periférica e convexidade central — sinal do S de Golden.'),
        m('Massa hilar responsável', 'Lesão que impede a elevação da porção medial da fissura.'),
        m('Perda de volume do lobo superior', 'Opacidade retraída contra o ápice.'),
      ],
    },
    conduta:
      'Sinal do S é indicação direta de tomografia com contraste e broncoscopia. Não trate como pneumonia sem antes excluir obstrução tumoral.',
  },

  'paralisia-do-nervo-frenico': {
    mecanismo:
      'A comparação temporal transforma dois filmes medianos em um diagnóstico claro. Entre eles, um nódulo hilar cresceu até alcançar a borda cardíaca e invadiu o nervo frênico. A elevação nova do hemidiafragma é a tradução radiográfica dessa invasão — e frequentemente aparece antes de qualquer sintoma respiratório.',
    estruturas: [
      e(
        'Nódulo hilar inicial',
        'Lesão pequena junto ao hilo, no exame de base.',
        'Hilo com arquitetura vascular preservada.',
        'Densidade discreta que ainda não distorce contornos — o momento em que o diagnóstico seria mais barato.',
        'Lesões justa-hilares se confundem com vasos vistos de topo; compare os dois hilos com atenção.',
      ),
      e(
        'Hemidiafragma direito',
        'Cúpula do lado acometido.',
        'Cerca de 1,5 a 2,5 cm acima da esquerda, com contorno liso.',
        'Normal no primeiro exame, francamente elevado no segundo — a mudança é o achado.',
      ),
      e(
        'Massa em progressão',
        'Lesão no exame de seguimento.',
        'Não se aplica.',
        'Alcança hilo e borda cardíaca, com invasão mediastinal.',
      ),
      e(
        'Nervo frênico',
        'Nervo motor do diafragma, com trajeto pericárdico.',
        'Não visível.',
        'Invadido pela massa, produzindo denervação e elevação diafragmática.',
      ),
    ],
    marcacoes: {
      1: [
        m('Nódulo justa-hilar', 'Lesão inicial, discreta e facilmente subvalorizada.'),
        m('Hemidiafragma direito normal', 'Estado de base para comparação futura.', 'referencia'),
      ],
      2: [
        m('Massa alcançando hilo e coração', 'Progressão com extensão mediastinal.'),
        m('Hemidiafragma direito elevado', 'Paralisia frênica nova por invasão neural.'),
        m('Comparação temporal', 'A mudança entre exames é o que fecha o raciocínio.', 'referencia'),
      ],
    },
    conduta:
      'Elevação diafragmática nova exige tomografia com contraste. Confirme a paralisia com ultrassom diafragmático ou teste de sniff e estadie a doença: invasão frênica altera ressecabilidade.',
  },

  'destruicao-ossea': {
    mecanismo:
      'Tumores periféricos, sobretudo os do sulco superior, invadem a pleura parietal e a parede torácica por contiguidade. A destruição costal aparece como perda da cortical, e a massa de partes moles associada frequentemente é mais evidente que a lise óssea. Dor no ombro e no braço pode dominar o quadro, mascarando a origem pulmonar.',
    estruturas: [
      e(
        'Terceira e quarta costelas direitas',
        'Arcos vizinhos ao tumor.',
        'Cortical contínua e nítida.',
        'Segmentos destruídos, com perda da cortical e do contorno do arco.',
        'Lise costal é achado facilmente omitido: percorra os arcos um a um, sobretudo sob massas.',
      ),
      e(
        'Massa pulmonar apical',
        'Lesão do campo superior direito.',
        'Ápice aerado.',
        'Opacidade que atravessa a pleura e se continua com partes moles da parede.',
      ),
      e(
        'Interface pleuroparietal',
        'Limite entre pulmão e parede.',
        'Linha nítida.',
        'Perdida no ponto de invasão; ângulos obtusos com a parede sugerem origem extrapleural.',
      ),
      e(
        'Ápice pulmonar',
        'Região do sulco superior.',
        'Trama fina, difícil de avaliar pela sobreposição de clavícula e costelas.',
        'Ponto cego clássico — tumores de Pancoast crescem meses antes de serem notados.',
      ),
    ],
    marcacoes: {
      1: [
        m('Destruição da terceira costela', 'Falha cortical com perda do contorno do arco.'),
        m('Destruição da quarta costela', 'Segundo nível acometido, definindo extensão.'),
        m('Massa de partes moles', 'Componente extrapleural contínuo com a lesão pulmonar.'),
        m('Ápice como ponto cego', 'Sobreposição óssea esconde tumores dessa região.', 'armadilha'),
      ],
    },
    conduta:
      'Tomografia e ressonância definem invasão de parede, plexo braquial e vasos subclávios. Dor no ombro persistente sem explicação musculoesquelética justifica imagem do ápice pulmonar.',
  },

  'resposta-a-radioterapia': {
    mecanismo:
      'A radioterapia estereotáxica corporal entrega dose alta e focada em poucas frações, com controle local elevado em tumores iniciais. A resposta radiográfica é lenta e ambígua: a lesão diminui, mas alterações actínicas ao redor — consolidação, retração e fibrose — surgem no mesmo território e podem ser confundidas com recidiva.',
    estruturas: [
      e(
        'Margem do nódulo',
        'Interface entre lesão e pulmão.',
        'Não se aplica.',
        'Espiculada, com prolongamentos radiados — característica de alta suspeição de malignidade.',
        'Espiculação também ocorre em cicatriz e granuloma; a suspeita é probabilística, não absoluta.',
      ),
      e(
        'Nódulo',
        'Lesão medida ao longo do tratamento.',
        'Ausente.',
        'Reduz significativamente após o tratamento; a medida deve ser feita no mesmo eixo e na mesma incidência.',
      ),
      e(
        'Parênquima peritumoral',
        'Pulmão dentro do campo irradiado.',
        'Trama regular.',
        'Desenvolve consolidação e depois retração fibrótica no território tratado.',
      ),
      e(
        'Volume pulmonar local',
        'Comportamento do parênquima ao redor.',
        'Preservado.',
        'Perda de volume localizada por fibrose actínica, com desvio de fissuras e estruturas adjacentes.',
      ),
    ],
    marcacoes: {
      1: [
        m('Nódulo pré-tratamento', 'Lesão de referência, com medida documentada.', 'medida'),
        m('Localização no campo médio direito', 'Posição que orienta a comparação futura.', 'referencia'),
      ],
      2: [
        m('Margem espiculada', 'Prolongamentos radiados, característica de alta suspeição.'),
        m('Interface com pulmão normal', 'Detalhe ampliado que evidencia a irregularidade.', 'referencia'),
      ],
      3: [
        m('Redução do nódulo', 'Resposta ao tratamento, medida no mesmo eixo.', 'medida'),
        m('Alterações actínicas peritumorais', 'Consolidação e retração no campo irradiado.'),
        m('Fibrose confundindo a leitura', 'Alterações pós-radioterapia dificultam identificar recidiva.', 'armadilha'),
      ],
    },
    conduta:
      'Seguimento é tomográfico e comparativo. Aumento de densidade dentro do campo irradiado após 12 meses, especialmente com crescimento progressivo, sugere recidiva e pede PET-TC ou biópsia.',
  },

  'progressao-da-doenca': {
    mecanismo:
      'Uma série temporal ensina mais que qualquer filme isolado. Aqui a doença responde à quimioterapia, recidiva, invade a pleura, produz derrame subpulmonar e finalmente se estende ao lado contralateral. Sinais indiretos — altura da fissura, posição do hemidiafragma, volume dos hemitórax — antecipam a progressão antes que a massa evidencie o crescimento.',
    estruturas: [
      e(
        'Massa hilar',
        'Lesão primária acompanhada ao longo do tempo.',
        'Ausente.',
        'Reduz com quimioterapia, depois volta a crescer — a trajetória é o dado, não cada ponto isolado.',
      ),
      e(
        'Fissuras',
        'Planos pleurais que denunciam volume.',
        'Posição anatômica estável.',
        'Sobem com o colapso progressivo, mostrando perda de volume antes de a massa ser visível.',
        'Mudança de posição da fissura entre exames é um sinal precoce subutilizado.',
      ),
      e(
        'Hemidiafragma',
        'Cúpula sensível a paralisia e a líquido.',
        'Direito acima do esquerdo.',
        'Mantém-se elevado pela paralisia frênica, mesmo com resposta tumoral parcial — resposta não é reversão de tudo.',
      ),
      e(
        'Espaço pleural',
        'Compartimento de disseminação.',
        'Seios livres.',
        'Desenvolve derrame subpulmonar e, depois, derrame contralateral — progressão para além do hemitórax inicial.',
        'Derrame subpulmonar simula hemidiafragma elevado: o ápice da "cúpula" fica deslocado lateralmente.',
      ),
    ],
    marcacoes: {
      1: [m('Massa hilar de base', 'Lesão inicial, referência para toda a série.', 'medida'), m('Hemidiafragma elevado', 'Paralisia frênica já presente no diagnóstico.')],
      2: [m('Redução da massa', 'Resposta parcial à quimioterapia.'), m('Paralisia frênica persistente', 'A resposta tumoral não reverte a denervação.', 'referencia')],
      3: [m('Consolidação distal', 'Recidiva com obstrução e preenchimento alveolar.'), m('Perda de volume', 'Fissura elevada indicando colapso associado.'), m('Derrame novo', 'Comprometimento pleural em progressão.')],
      4: [m('Derrame subpulmonar', 'Líquido entre pulmão e diafragma, com ápice deslocado lateralmente.', 'armadilha'), m('Fissura mais elevada', 'Progressão da perda de volume.')],
      5: [m('Aumento da massa mediastinal', 'Extensão para o mediastino contralateral.'), m('Derrame contralateral', 'Disseminação para o outro hemitórax.'), m('Comparação da série completa', 'Sempre revise na mesma ordem cronológica.', 'referencia')],
    },
    conduta:
      'Avaliação de resposta segue critérios tomográficos padronizados. Sinais indiretos na radiografia orientam quando antecipar a tomografia — não substituem a medida formal.',
  },

  'metastases-do-pulmao': {
    mecanismo:
      'O câncer de pulmão dissemina por via linfática, hematogênica e por contiguidade. Nódulos no pulmão contralateral e lesões ósseas expansivas ou líticas mudam radicalmente o estadiamento e o prognóstico — e ambos podem ser vistos na radiografia simples, quando procurados.',
    estruturas: [
      e(
        'Nódulos secundários',
        'Lesões em ambos os pulmões.',
        'Ausentes.',
        'Múltiplos, arredondados, de tamanhos variados e distribuição aleatória, predominando nas bases.',
        'Nem todo nódulo adicional é metástase: granulomas e nódulos benignos coexistem.',
      ),
      e(
        'Sexta costela direita',
        'Arco acometido por metástase.',
        'Cortical contínua, calibre uniforme.',
        'Expansão focal com adelgaçamento cortical — lesão óssea secundária.',
      ),
      e(
        'Massa primária',
        'Lesão dominante.',
        'Ausente.',
        'Maior e mais definida que os nódulos secundários; ancora a interpretação.',
      ),
      e(
        'Gradil costal completo',
        'Todos os arcos, percorridos sistematicamente.',
        'Cortical íntegra.',
        'Lesões ósseas são frequentemente perdidas por falta de busca dirigida.',
      ),
    ],
    marcacoes: {
      1: [m('Nódulos bilaterais', 'Disseminação hematogênica para ambos os pulmões.'), m('Massa primária dominante', 'Lesão maior que ancora a interpretação.', 'referencia')],
      2: [m('Expansão da sexta costela', 'Metástase óssea com adelgaçamento cortical.'), m('Percurso sistemático dos arcos', 'Lesões ósseas exigem busca dirigida.', 'referencia')],
    },
    conduta:
      'Tomografia de tórax, abdome superior e crânio, mais PET-TC ou cintilografia óssea, completam o estadiamento. Lesão óssea sintomática ou com risco de fratura exige avaliação ortopédica e radioterapia paliativa.',
  },

  'metastases-para-o-pulmao': {
    mecanismo:
      'Metástases hematogênicas alcançam o pulmão pelo filtro capilar da circulação pulmonar. Por isso predominam nas bases, onde o fluxo é maior, e na periferia. O tamanho reflete o momento da embolização de cada foco: nódulos de tamanhos variados no mesmo pulmão sugerem eventos repetidos ao longo do tempo.',
    estruturas: [
      e(
        'Nódulos metastáticos',
        'Lesões secundárias no parênquima.',
        'Ausentes.',
        'Arredondados, de contorno definido, tamanhos variados e distribuição periférica e basal.',
        'A aparência não identifica o tumor primário — apenas sugere a via de disseminação.',
      ),
      e(
        'Distribuição basal e periférica',
        'Territórios de maior fluxo capilar.',
        'Trama regular.',
        'Concentração de nódulos onde o fluxo é maior, coerente com disseminação hematogênica.',
      ),
      e(
        'Micronódulos',
        'Lesões milimétricas, no limite da resolução.',
        'Ausentes.',
        'Padrão miliar ou micronodular difuso, típico de disseminação maciça.',
        'Nódulos abaixo de 5 a 8 mm frequentemente não são vistos na radiografia.',
      ),
      e(
        'Nódulos em bala de canhão',
        'Lesões grandes e bem delimitadas.',
        'Ausentes.',
        'Massas arredondadas múltiplas, classicamente associadas a carcinoma renal — sem exclusividade.',
      ),
    ],
    marcacoes: {
      1: [m('Micronódulos difusos', 'Padrão de disseminação hematogênica maciça.'), m('Predomínio basal', 'Coerente com a distribuição do fluxo pulmonar.', 'referencia')],
      2: [m('Nódulos em bala de canhão', 'Massas arredondadas múltiplas, clássicas do carcinoma renal.'), m('Tamanhos variados', 'Sugerem embolizações em momentos diferentes.', 'referencia')],
    },
    conduta:
      'Tomografia é muito mais sensível e obrigatória no estadiamento. Procure o primário com exame clínico dirigido e imagem abdominopélvica; biópsia com painel imuno-histoquímico define a origem.',
  },

  'armadilha-massa-retrocardiaca': {
    mecanismo:
      'O coração é uma estrutura de densidade de água que se sobrepõe a cerca de um terço do pulmão esquerdo. Uma lesão atrás dele produz apenas um aumento sutil de densidade através da silhueta — que a janela de visualização habitual, ajustada para os campos pulmonares, esconde. É um erro de busca, não de conhecimento.',
    estruturas: [
      e(
        'Região retrocardíaca',
        'Segmentos posteriores do lobo inferior esquerdo, projetados sobre o coração.',
        'Deve ser possível ver vasos através da silhueta cardíaca num filme bem penetrado.',
        'Contém a massa; a densidade aumenta focalmente sem apagar a borda cardíaca.',
        'Um filme pouco penetrado apaga essa região por completo e impede qualquer avaliação.',
      ),
      e(
        'Borda cardíaca esquerda',
        'Contorno do ventrículo esquerdo.',
        'Linha nítida.',
        'Preservada, porque a lesão é posterior e não encosta na borda — o que a torna ainda mais discreta.',
      ),
      e(
        'Hemidiafragma esquerdo',
        'Cúpula acompanhada até a coluna.',
        'Contorno contínuo por trás do coração.',
        'Deve ser rastreado até a coluna: interrupção sinaliza doença retrocardíaca.',
      ),
      e(
        'Região paravertebral',
        'Faixa ao lado da coluna torácica.',
        'Linhas paravertebrais finas e retilíneas.',
        'Área de revisão obrigatória junto com a retrocardíaca.',
      ),
    ],
    marcacoes: {
      1: [
        m('Massa retrocardíaca', 'Aumento focal de densidade visto através da silhueta cardíaca.'),
        m('Borda cardíaca preservada', 'A lesão é posterior e não toca o contorno.', 'referencia'),
        m('Assimetria de densidade', 'Compare os dois lados do mesmo nível para perceber o achado.', 'referencia'),
        m('Zona de revisão obrigatória', 'Retrocardíaca, ápices, seios e abaixo do diafragma.', 'armadilha'),
      ],
    },
    conduta:
      'Inclua uma varredura final dedicada às zonas ocultas em todo laudo. Ajuste janela e brilho especificamente para a região retrocardíaca; na dúvida, perfil ou tomografia.',
  },

  'armadilha-massa-subdiafragmatica': {
    mecanismo:
      'O pulmão não termina no ponto mais alto da cúpula: os recessos costofrênicos posteriores descem bem abaixo dela. Lesões nessa faixa se projetam sobre fígado, baço e conteúdo abdominal, perdendo contraste. Elas continuam sendo pulmonares — e continuam sendo perdidas.',
    estruturas: [
      e(
        'Recesso costofrênico posterior',
        'Porção mais inferior do espaço pleural, atrás e abaixo da cúpula.',
        'Aerado, mas com pouco contraste contra as vísceras.',
        'Contém a lesão, sobreposta às partes moles abdominais.',
        'Densidades sob a cúpula são atribuídas ao abdome por reflexo — reveja essa faixa deliberadamente.',
      ),
      e(
        'Cúpula diafragmática',
        'Ponto mais alto do músculo.',
        'Contorno nítido.',
        'Referência que engana: o pulmão continua abaixo dela na periferia.',
      ),
      e(
        'Contorno da lesão',
        'Interface entre nódulo e estruturas ao redor.',
        'Não se aplica.',
        'Contorno próprio, independente das vísceras — o que a identifica como pulmonar.',
      ),
      e(
        'Características da lesão em detalhe',
        'Margem e conteúdo.',
        'Não se aplica.',
        'Espiculada e cavitada, características de alta suspeição de malignidade.',
      ),
    ],
    marcacoes: {
      1: [
        m('Massa abaixo da cúpula', 'Nódulo pulmonar projetado sobre partes moles abdominais.'),
        m('Contorno independente', 'Borda própria, distinta das estruturas abdominais.', 'referencia'),
        m('Recesso costofrênico posterior', 'Zona de revisão obrigatória em todo filme.', 'armadilha'),
      ],
      2: [
        m('Margem espiculada', 'Prolongamentos radiados, característica suspeita.'),
        m('Cavitação', 'Necrose central dentro da lesão.'),
      ],
    },
    conduta:
      'Perfil e tomografia localizam a lesão e caracterizam suas margens. Incorpore ápices, retrocardíaco, seios e região infradiafragmática a uma checagem final fixa de toda leitura.',
  },
}

// ══════════════════════════════════ Mediastino e hilos ══════════════════════════════════

const MEDIASTINO: Record<string, DetalheCaso> = {
  'massa-mediastinal-anterior': {
    mecanismo:
      'O mediastino é dividido em compartimentos, e cada um tem seu próprio elenco de doenças. A radiografia localiza a massa não por vê-la em profundidade, mas pelo sinal da silhueta: a lesão apaga apenas as linhas que toca. Se o botão aórtico, a linha ázigo-esofágica e a aorta descendente permanecem visíveis, a massa não está no compartimento delas — é anterior.',
    estruturas: [
      e(
        'Compartimento anterior',
        'Espaço entre esterno e pericárdio, contendo timo, tireoide ectópica, linfonodos e tecido germinativo.',
        'Praticamente vazio na radiografia do adulto; o timo involui.',
        'Ocupado pela massa, que abaula os contornos sem apagar as linhas posteriores.',
        'Os "4 T": timoma, teratoma, tireoide e linfoma ("terrible lymphoma") — o diferencial obrigatório.',
      ),
      e(
        'Botão aórtico',
        'Arco visto de perfil no contorno esquerdo.',
        'Convexidade nítida.',
        'Preservado — a massa anterior não o toca, logo não o apaga.',
      ),
      e(
        'Linha ázigo-esofágica e aorta descendente',
        'Interfaces do mediastino médio e posterior.',
        'Linhas finas e contínuas, visíveis através da silhueta cardíaca em filme penetrado.',
        'Também preservadas — o conjunto de linhas intactas é o que localiza a lesão.',
        'Filme pouco penetrado apaga essas linhas por técnica, invalidando o raciocínio.',
      ),
      e(
        'Traqueia',
        'Coluna aérea central.',
        'Bordas paralelas, calibre uniforme.',
        'No bócio, é estreitada e desviada; a faixa paratraqueal some apenas no nível da massa.',
      ),
    ],
    marcacoes: {
      1: [
        m('Abaulamento do contorno mediastinal', 'Massa anterior alargando a silhueta.'),
        m('Botão aórtico preservado', 'A massa não toca o compartimento médio.', 'referencia'),
        m('Aorta descendente visível', 'Compartimento posterior íntegro.', 'referencia'),
      ],
      2: [
        m('Estreitamento traqueal', 'Compressão pela massa tireoidiana.'),
        m('Faixa paratraqueal apagada no nível da massa', 'A perda de linha é focal e localizadora.'),
        m('Extensão cervicotorácica', 'Massa que continua acima da clavícula sugere origem tireoidiana.'),
      ],
    },
    conduta:
      'Tomografia com contraste caracteriza compartimento, densidade e relação com vasos. Marcadores tumorais (AFP, beta-HCG) e avaliação de miastenia complementam a investigação de massa anterior.',
  },

  'massa-mediastinal-superior': {
    mecanismo:
      'Linfonodos aumentados no mediastino superior alargam a silhueta e apagam as interfaces normais. A faixa paratraqueal direita é a mais sensível dessas interfaces: qualquer tecido interposto entre pulmão e traqueia a espessa ou a elimina. No linfoma, a adenopatia costuma ser volumosa, bilateral e acompanhada de derrames.',
    estruturas: [
      e(
        'Faixa paratraqueal direita',
        'Interface entre pulmão direito e parede traqueal.',
        'Linha de até 4 mm, retilínea.',
        'Espessada ou apagada pela massa linfonodal.',
        'Sua ausência também ocorre por técnica AP e por rotação — confirme antes de valorizar.',
      ),
      e(
        'Mediastino superior',
        'Compartimento acima do arco aórtico.',
        'Largura proporcional, com contornos bem definidos.',
        'Alargado por tecido de partes moles, misturando-se ao topo do botão aórtico.',
      ),
      e(
        'Botão aórtico',
        'Referência de localização.',
        'Convexidade isolada e definida.',
        'Seu topo se funde com a massa, indicando contiguidade.',
      ),
      e(
        'Espaço pleural',
        'Recessos que refletem a extensão da doença.',
        'Livres.',
        'Derrames bilaterais, coerentes com doença linfoproliferativa.',
      ),
    ],
    marcacoes: {
      1: [
        m('Alargamento mediastinal superior', 'Massa de partes moles ocupando o compartimento.'),
        m('Faixa paratraqueal direita apagada', 'Interface perdida por tecido interposto.'),
        m('Fusão com o botão aórtico', 'Contiguidade entre massa e arco.'),
        m('Derrames bilaterais', 'Extensão pleural da doença.'),
      ],
    },
    conduta:
      'Tomografia com contraste e PET-TC definem extensão; biópsia linfonodal excisional é preferível à punção para classificar linfoma. Massa mediastinal com síndrome de veia cava superior é urgência oncológica.',
  },

  'massa-mediastinal-posterior': {
    mecanismo:
      'O sinal da silhueta funciona como um localizador em profundidade. Uma massa que apaga a linha da aorta descendente está em contato com ela — logo, é posterior. Se, ao mesmo tempo, preserva a borda cardíaca e os vasos hilares, ela não está no plano deles. Duas observações negativas e uma positiva bastam para localizar a lesão sem tomografia.',
    estruturas: [
      e(
        'Aorta descendente',
        'Vaso que desce à esquerda da coluna, no mediastino posterior.',
        'Linha contínua visível através da silhueta cardíaca em filme adequado.',
        'Apagada no nível da lesão — sinal da silhueta positivo, localizando a massa posteriormente.',
        'Filme pouco penetrado apaga a linha por técnica: verifique se ela é visível fora do nível da massa.',
      ),
      e(
        'Borda cardíaca esquerda',
        'Contorno anterior do coração.',
        'Nítida.',
        'Preservada — a massa não está no plano do coração.',
      ),
      e(
        'Vasos hilares',
        'Artérias e veias pulmonares centrais.',
        'Identificáveis individualmente.',
        'Visíveis através da massa: sinal do hilo sobreposto, indicando que a lesão não é hilar.',
        'Uma massa "hilar" na frontal pode ser inteiramente posterior — o hilo visível através dela é a pista.',
      ),
      e(
        'Compartimento posterior',
        'Espaço paravertebral, com nervos, gânglios simpáticos e cadeia linfática.',
        'Linhas paravertebrais finas.',
        'Sede da lesão; tumores neurogênicos dominam o diferencial em adultos jovens.',
      ),
    ],
    marcacoes: {
      1: [
        m('Aorta descendente apagada', 'Contato direto com a massa — localiza a lesão posteriormente.'),
        m('Borda cardíaca preservada', 'A lesão não está no plano anterior.', 'referencia'),
        m('Hilo visível através da massa', 'Sinal do hilo sobreposto: a lesão não é hilar.', 'referencia'),
      ],
    },
    conduta:
      'Tomografia e ressonância caracterizam a lesão e sua relação com o forame neural — extensão intrarraquidiana muda a abordagem cirúrgica. Procure erosão de costela e alargamento de forames na própria radiografia.',
  },

  'aumento-hilar-unilateral': {
    mecanismo:
      'Os hilos são compostos quase inteiramente por artérias e veias pulmonares. São normalmente assimétricos em forma e altura — o esquerdo até 2 cm mais alto —, mas equivalentes em densidade e volume. Uma massa ou adenopatia adiciona tecido de mesma densidade que os vasos e apaga sua arquitetura: o hilo fica maior, mais denso e "sem desenho".',
    estruturas: [
      e(
        'Hilo esquerdo',
        'Artéria pulmonar esquerda cavalgando o brônquio e veias associadas.',
        'Mais alto que o direito, com vasos individualizáveis.',
        'Aumentado, denso e com perda da arquitetura vascular — massa ou adenopatia.',
        'Assimetria de altura é normal; assimetria de densidade e definição não é.',
      ),
      e(
        'Hilo direito',
        'Artéria interlobar e veias superiores.',
        'Mais baixo, com artéria interlobar de até 16 mm.',
        'Serve de controle interno para a comparação.',
      ),
      e(
        'Ramos vasculares',
        'Vasos que se afastam do hilo.',
        'Podem ser seguidos individualmente para a periferia.',
        'Não atravessam a opacidade: quando não se consegue rastrear vasos dentro da densidade, ela é massa.',
        'Artéria pulmonar proeminente por hipertensão pulmonar mantém ramos rastreáveis — massa não.',
      ),
      e(
        'Mediastino adjacente',
        'Compartimento vizinho ao hilo.',
        'Contornos definidos.',
        'Avalie em conjunto: adenopatia hilar frequentemente vem com mediastinal.',
      ),
    ],
    marcacoes: {
      1: [
        m('Hilo esquerdo aumentado e denso', 'Massa ou adenopatia substituindo a arquitetura vascular.'),
        m('Vasos indistintos', 'Impossibilidade de rastrear ramos dentro da opacidade.'),
        m('Hilo direito como controle', 'Comparação de densidade e definição entre os lados.', 'referencia'),
      ],
    },
    conduta:
      'Tomografia com contraste é obrigatória: separa vaso de massa e avalia linfonodos. Aumento hilar unilateral em adulto fumante é câncer broncogênico até prova em contrário.',
  },

  'aumento-hilar-bilateral': {
    mecanismo:
      'Adenopatia hilar bilateral simétrica é a imagem clássica da sarcoidose, frequentemente com adenopatia paratraqueal direita associada (a "tríade de Garland" ou sinal 1-2-3). Mas linfoma, tuberculose, silicose e metástases produzem padrão semelhante. A imagem sugere; o contexto e a histologia decidem.',
    estruturas: [
      e(
        'Hilos bilaterais',
        'Estruturas hilares dos dois lados.',
        'Simétricos em densidade, com vasos individualizáveis.',
        'Aumentados nos dois lados, com contornos lobulados típicos de adenopatia.',
        'Simetria não é sinônimo de sarcoidose — linfoma pode ser praticamente idêntico.',
      ),
      e(
        'Contorno das massas hilares',
        'Interface entre linfonodos e pulmão.',
        'Vasos com contorno liso e afilamento progressivo.',
        'Contorno lobulado ou polilobulado, que denuncia conglomerado ganglionar.',
      ),
      e(
        'Região paratraqueal direita',
        'Cadeia linfonodal frequentemente envolvida na sarcoidose.',
        'Faixa fina.',
        'Alargada, completando a tríade clássica.',
      ),
      e(
        'Parênquima pulmonar',
        'Território de doença associada.',
        'Trama regular.',
        'Padrão reticulonodular de predomínio superior sugere sarcoidose em estágio mais avançado.',
      ),
    ],
    marcacoes: {
      1: [
        m('Adenopatia hilar bilateral simétrica', 'Padrão clássico da sarcoidose.'),
        m('Adenopatia paratraqueal direita', 'Completa a tríade 1-2-3.'),
        m('Contornos lobulados', 'Conglomerado ganglionar, e não vaso dilatado.', 'referencia'),
      ],
      2: [
        m('Adenopatia bilateral no linfoma', 'Aparência praticamente idêntica à da sarcoidose.', 'armadilha'),
        m('Envolvimento mediastinal associado', 'Mais frequente e volumoso no linfoma.'),
      ],
    },
    conduta:
      'Tomografia define a distribuição das cadeias e do padrão parenquimatoso. Sintomas B, adenopatia assimétrica ou mediastinal volumosa direcionam para biópsia; sarcoidose assintomática clássica pode ser acompanhada.',
  },

  'fibrose-pos-radioterapia-mediastinal': {
    mecanismo:
      'A radioterapia mediastinal usada no linfoma de Hodgkin irradia um campo em manto, que inclui as regiões perihilares. Anos depois, o pulmão nesse território fica retraído e denso. O que identifica a fibrose actínica não é a aparência da opacidade, mas sua geometria: bordas relativamente retas que cortam a anatomia lobar e correspondem ao campo tratado.',
    estruturas: [
      e(
        'Regiões perihilares',
        'Pulmão adjacente aos hilos, dentro do campo irradiado.',
        'Trama regular e transparência preservada.',
        'Densas e retraídas bilateralmente, acompanhando a distribuição do tratamento.',
      ),
      e(
        'Interface fibrose-pulmão',
        'Limite da lesão.',
        'Não existe.',
        'Borda retilínea que não respeita fissuras nem limites segmentares — assinatura do campo de radiação.',
        'Sem a história de radioterapia, essa geometria perde valor diagnóstico.',
      ),
      e(
        'Volume pulmonar',
        'Estado global dos hemitórax.',
        'Simétrico.',
        'Reduzido nas regiões tratadas, com tração de hilos e fissuras.',
      ),
      e(
        'Mediastino',
        'Compartimento previamente tratado.',
        'Contornos normais.',
        'Pode estar retraído e com contornos irregulares pela fibrose.',
      ),
    ],
    marcacoes: {
      1: [
        m('Opacidade perihilar bilateral', 'Fibrose no território irradiado.'),
        m('Bordas geométricas', 'Limite que não acompanha a anatomia lobar.', 'referencia'),
        m('Retração e perda de volume', 'Tração de hilos e fissuras pela cicatriz.'),
      ],
    },
    conduta:
      'Confirme com a história e o campo de tratamento. Sobreviventes de Hodgkin têm risco aumentado de neoplasia secundária e doença coronariana: alteração nova nesse território exige tomografia, não presunção de fibrose.',
  },

  'aumento-da-aorta': {
    mecanismo:
      'A aorta torácica aumenta por dois mecanismos distintos. Aneurisma verdadeiro envolve degeneração da parede e dilatação progressiva, tipicamente na descendente. Dilatação pós-estenótica resulta do jato de alta velocidade que atravessa uma valva estenótica — clássica na valva aórtica bicúspide — e atinge preferencialmente a aorta ascendente.',
    estruturas: [
      e(
        'Aorta descendente',
        'Segmento que desce à esquerda da coluna.',
        'Linha retilínea acompanhável através da silhueta cardíaca.',
        'Grosseiramente alargada e tortuosa no aneurisma, com contorno convexo.',
        'Tortuosidade senil é comum e não é aneurisma: compare com exames prévios.',
      ),
      e(
        'Aorta ascendente',
        'Segmento que sobe à direita, antes do arco.',
        'Não forma borda distinta em condições normais.',
        'Torna-se convexa à direita na dilatação pós-estenótica, antes mesmo de haver cardiomegalia.',
      ),
      e(
        'Calcificação mural',
        'Cálcio na parede aórtica.',
        'Ausente em jovens.',
        'Delimita o contorno real do vaso e permite medir o calibre com mais confiança.',
        'Deslocamento do cálcio para dentro da silhueta pode indicar dissecção — achado sutil e crítico.',
      ),
      e(
        'Estruturas adjacentes',
        'Traqueia, brônquio esquerdo e esôfago.',
        'Posição habitual.',
        'Deslocados por efeito de massa quando a dilatação é significativa.',
      ),
    ],
    marcacoes: {
      1: [
        m('Alargamento da aorta descendente', 'Contorno convexo e tortuoso, sugestivo de aneurisma.'),
        m('Calcificação mural', 'Delimita o calibre real do vaso.', 'medida'),
        m('Deslocamento de estruturas vizinhas', 'Efeito de massa sobre traqueia e brônquio.'),
      ],
      2: [
        m('Convexidade da aorta ascendente', 'Dilatação pós-estenótica, típica de valva bicúspide.'),
        m('Silhueta cardíaca ainda normal', 'A dilatação precede a cardiomegalia e a falência.', 'referencia'),
      ],
    },
    conduta:
      'Angiotomografia mede o diâmetro com precisão e define conduta; ecocardiograma avalia valva e raiz. Dor torácica aguda com mediastino alargado é síndrome aórtica até prova em contrário — a radiografia normal não exclui.',
  },

  'desenrolamento-da-aorta': {
    mecanismo:
      'Com o envelhecimento, a elastina da parede aórtica degenera e o vaso alonga. Como está fixado em suas extremidades, o alongamento se traduz em tortuosidade: a ascendente projeta-se mais à direita, o botão fica mais proeminente e a descendente se torna sinuosa. É remodelamento fisiológico, não aneurisma.',
    estruturas: [
      e(
        'Botão aórtico',
        'Arco visto de perfil.',
        'Convexidade discreta.',
        'Mais proeminente e frequentemente calcificado — achado esperado na idade avançada.',
        'Botão proeminente isolado não justifica investigação em idoso assintomático.',
      ),
      e(
        'Aorta ascendente',
        'Segmento antes do arco.',
        'Não faz borda distinta.',
        'Alongada, pode formar convexidade à direita do mediastino.',
      ),
      e(
        'Calcificação parietal',
        'Cálcio na parede.',
        'Ausente em jovens.',
        'Indica aterosclerose; sua distribuição desenha o contorno real do vaso.',
      ),
      e(
        'Contorno global do mediastino',
        'Silhueta mediastinal como um todo.',
        'Bordas definidas e proporcionais.',
        'Alargamento difuso e simétrico pela tortuosidade, sem massa focal.',
      ),
    ],
    marcacoes: {
      1: [
        m('Aorta alongada e tortuosa', 'Remodelamento relacionado à idade, sem dilatação focal.'),
        m('Calcificação parietal', 'Marcador de aterosclerose.'),
        m('Ausência de massa focal', 'O contorno é sinuoso, não abaulado localmente.', 'referencia'),
      ],
    },
    conduta:
      'Achado esperado que não exige investigação isolada. Dúvida entre tortuosidade e aneurisma, ou alargamento novo em relação a exame prévio, indica angiotomografia.',
  },

  'coarctacao-da-aorta': {
    mecanismo:
      'A coarctação estreita a aorta logo após a subclávia esquerda. O sangue precisa alcançar a metade inferior do corpo por caminhos alternativos: as artérias mamárias internas e intercostais dilatam e se tornam vias colaterais. Cronicamente ingurgitadas, as intercostais erodem a borda inferior das costelas — os entalhes de Rösler. O contorno aórtico, com dilatação pré e pós-estenótica separadas pelo ponto de coarctação, desenha o número 3.',
    estruturas: [
      e(
        'Bordas inferiores das costelas',
        'Sulco costal onde corre o feixe intercostal.',
        'Contorno inferior liso e regular.',
        'Entalhado e irregular da quarta à oitava costelas, bilateralmente.',
        'Entalhes nas três primeiras costelas não ocorrem na coarctação — as intercostais superiores nascem antes da estenose.',
      ),
      e(
        'Artérias intercostais',
        'Ramos que correm no sulco costal.',
        'Não visíveis.',
        'Dilatadas como colaterais, erodindo o osso ao longo de anos.',
      ),
      e(
        'Contorno aórtico',
        'Botão e segmentos adjacentes.',
        'Convexidade única e lisa.',
        'Dilatação pré-estenótica, entalhe no ponto de coarctação e dilatação pós-estenótica — o sinal do 3.',
      ),
      e(
        'Silhueta cardíaca',
        'Coração sob sobrecarga pressórica.',
        'ICT abaixo de 50%.',
        'Pode mostrar hipertrofia ventricular esquerda com ápice arredondado e rebaixado.',
      ),
    ],
    marcacoes: {
      1: [
        m('Entalhes costais bilaterais', 'Erosão da borda inferior da quarta à oitava costelas.'),
        m('Três primeiras costelas poupadas', 'Distribuição que confirma o mecanismo colateral.', 'referencia'),
      ],
      2: [
        m('Sinal do número 3', 'Dilatação pré-estenótica, coarctação e dilatação pós-estenótica.'),
        m('Botão aórtico anormal', 'Contorno que perde a convexidade única habitual.'),
      ],
    },
    conduta:
      'Hipertensão em jovem com pulsos femorais reduzidos ou gradiente entre membros exige investigar coarctação. Angiotomografia ou ressonância definem anatomia e gradiente; ecocardiograma avalia valva bicúspide associada.',
  },

  'hernia-hiatal': {
    mecanismo:
      'O estômago hernia através do hiato esofágico para o mediastino posterior. Como contém ar e líquido, produz uma imagem inconfundível quando volumosa: nível hidroaéreo projetado atrás do coração. Hérnias pequenas podem não conter ar suficiente e passar completamente despercebidas na radiografia.',
    estruturas: [
      e(
        'Hiato esofágico',
        'Abertura diafragmática por onde passa o esôfago, ao nível de T10.',
        'Não identificável.',
        'Alargado, permitindo a passagem do estômago para o tórax.',
      ),
      e(
        'Estômago intratorácico',
        'Porção herniada acima do diafragma.',
        'Bolha gástrica abaixo do hemidiafragma esquerdo.',
        'Estrutura com nível hidroaéreo projetada na região retrocardíaca.',
        'Pode ser confundida com abscesso, cavidade ou cisto — a continuidade com o estômago resolve.',
      ),
      e(
        'Região retrocardíaca',
        'Área atrás da silhueta cardíaca.',
        'Transparente em filme adequado.',
        'Sede do achado; revisá-la é o que permite encontrar hérnias pequenas.',
      ),
      e(
        'Contorno diafragmático',
        'Linha do músculo.',
        'Contínua.',
        'A hérnia se projeta acima dele, mantendo continuidade com a bolha gástrica abdominal.',
      ),
    ],
    marcacoes: {
      1: [
        m('Nível hidroaéreo retrocardíaco', 'Estômago intratorácico volumoso.'),
        m('Continuidade com o abdome', 'Segue-se do tórax ao estômago através do hiato.', 'referencia'),
        m('Localização posterior', 'Compartimento mediastinal posterior, atrás do coração.'),
      ],
      2: [
        m('Pequena imagem aérea retrocardíaca', 'Hérnia discreta, fácil de ignorar.'),
        m('Ausência de repercussão', 'Achado incidental frequente e sem urgência.', 'referencia'),
      ],
    },
    conduta:
      'Endoscopia e esofagograma caracterizam tipo e tamanho; tomografia avalia hérnias paraesofágicas e complicações. Radiografia normal não exclui hérnia hiatal — sintomas de refluxo pedem investigação própria.',
  },

  pneumomediastino: {
    mecanismo:
      'Ar chega ao mediastino por ruptura alveolar com dissecção ao longo das bainhas broncovasculares (efeito Macklin), por lesão da via aérea ou por perfuração esofágica. Ao dissecar os tecidos, o gás delineia estruturas que normalmente não têm contorno próprio e destaca a pleura mediastinal como uma linha branca fina.',
    estruturas: [
      e(
        'Pleura mediastinal',
        'Folheto pleural que reveste a face medial do pulmão.',
        'Não individualizável.',
        'Deslocada lateralmente pelo gás, aparecendo como linha branca fina paralela ao mediastino.',
        'Essa linha é sutil: em portáteis de baixa qualidade, passa despercebida com facilidade.',
      ),
      e(
        'Estruturas mediastinais delineadas',
        'Aorta, timo, traqueia e artéria pulmonar.',
        'Sem contorno próprio na maior parte da extensão.',
        'Contornadas por gás, ganhando bordas visíveis onde antes não havia.',
      ),
      e(
        'Tecidos moles cervicais e da parede',
        'Planos fasciais contíguos ao mediastino.',
        'Densidade homogênea.',
        'Frequentemente contêm ar dissecado — enfisema subcutâneo associado.',
      ),
      e(
        'Espaço pleural',
        'Cavidade que pode ser envolvida simultaneamente.',
        'Livre.',
        'Pneumotórax pode coexistir; procure ativamente antes de encerrar a leitura.',
      ),
    ],
    marcacoes: {
      1: [
        m('Linha da pleura mediastinal', 'Gás deslocando a pleura lateralmente.'),
        m('Gás contornando estruturas mediastinais', 'Bordas visíveis onde normalmente não existem.'),
        m('Enfisema subcutâneo cervical', 'Ar dissecando planos contíguos.'),
        m('Pneumotórax associado', 'Procure sempre — pode coexistir e mudar a conduta.', 'referencia'),
      ],
    },
    conduta:
      'Pneumomediastino espontâneo em jovem costuma ser benigno e autolimitado. Após vômitos, trauma ou instrumentação, é preciso excluir perfuração esofágica com urgência: tomografia e esofagograma com contraste hidrossolúvel.',
  },
}

// ══════════════════════════════════ Índice ══════════════════════════════════

/** Dossiê completo, indexado pelo slug do caso. */
export const DETALHES_CASOS_RAIO_X: Record<string, DetalheCaso> = {
  ...CARDIOVASCULAR,
  ...VARIANTES,
  ...VIAS_AEREAS,
  ...DISPOSITIVOS,
  ...PNEUMOTORAX,
  ...CANCER,
  ...MEDIASTINO,
}

export function detalheDoCaso(slug: string): DetalheCaso | null {
  return DETALHES_CASOS_RAIO_X[slug] ?? null
}

/** Marcações de uma imagem específica, na ordem em que devem ser reveladas. */
export function marcacoesDaImagem(slug: string, indice: number): AchadoMarcado[] {
  return DETALHES_CASOS_RAIO_X[slug]?.marcacoes[indice] ?? []
}
