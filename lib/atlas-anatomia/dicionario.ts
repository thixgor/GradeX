import type { ClasseId } from './classes'

/**
 * Dicionário curado do Atlas de Anatomia.
 *
 * A classe (`classes.ts`) e a região (`regioes.ts`) já produzem uma ficha
 * coerente para qualquer marcador do acervo. Este dicionário é a camada de
 * cima: para as estruturas que realmente importam — as que aparecem em prova,
 * em enfermaria e em centro cirúrgico — ele substitui o texto genérico por
 * localização, função, vascularização, inervação, relações e correlação
 * clínica específicas daquela estrutura.
 *
 * Regras da casa:
 * - `termos` são comparados contra o título normalizado (minúsculo, sem
 *   acento). A primeira entrada que casar vence, então o arquivo vai do mais
 *   específico para o mais genérico.
 * - Todo campo é opcional: o que não estiver aqui cai no texto da classe ou da
 *   região, sem buraco na ficha.
 */
export interface EntradaDicionario {
  termos: string[]
  /** Exige igualdade exata com o título normalizado (evita casar substring). */
  exato?: boolean
  /** Corrige a classe quando o nome engana o classificador léxico. */
  classe?: ClasseId
  resumo?: string
  localizacao?: string
  funcao?: string
  vascularizacao?: string
  inervacao?: string
  linfaticos?: string
  relacoes?: string
  clinica?: string
  pontos?: string[]
}

export const DICIONARIO: EntradaDicionario[] = [
  /* ═══════════════════════ Crânio e face ═══════════════════════ */
  {
    termos: ['osso frontal'],
    resumo: 'Osso ímpar que forma a testa, o teto das órbitas e a fossa craniana anterior.',
    localizacao:
      'Ocupa toda a porção anterior do crânio: a escama forma a fronte, as partes orbitais fazem o teto da órbita e a parte nasal se articula com os ossos nasais. Articula-se com o parietal pela sutura coronal.',
    funcao:
      'Protege os lobos frontais, sustenta o conteúdo orbital e aloja o seio frontal, que aligeira a estrutura e drena para o meato nasal médio.',
    vascularizacao:
      'Artérias supraorbital e supratroclear (ramos da oftálmica, sistema carotídeo interno) para o periósteo e a pele da fronte; a meníngea média irriga a dura-máter subjacente.',
    inervacao: 'Nervos supraorbital e supratroclear, ramos do nervo frontal (V1, oftálmico).',
    relacoes:
      'Abaixo, teto da órbita e conteúdo orbital; atrás, lobos frontais e a lâmina crivosa do etmoide, entre as partes orbitais.',
    clinica:
      'A fratura do seio frontal pode romper a parede posterior e abrir comunicação com a fossa craniana anterior (risco de fístula liquórica e meningite). A incisura/forame supraorbital é o ponto de compressão para pesquisar resposta à dor no paciente com rebaixamento de consciência.',
    pontos: [
      'Forma a fossa craniana anterior e o teto da órbita',
      'Sutura coronal com os parietais; sutura frontonasal e frontozigomática',
      'Seio frontal drena no meato nasal médio',
    ],
  },
  {
    termos: ['osso parietal'],
    resumo: 'Osso par que forma boa parte do teto e das paredes laterais da calvária.',
    localizacao:
      'Entre o frontal (sutura coronal), o occipital (sutura lambdóidea), o parietal do outro lado (sutura sagital) e o temporal (sutura escamosa).',
    funcao: 'Fecha e protege a caixa craniana sobre os lobos parietais, e transmite as forças de impacto para as demais peças da calvária.',
    vascularizacao:
      'Face externa pelas artérias temporal superficial e occipital; face interna sulcada pelos ramos da artéria meníngea média, cujos sulcos são visíveis na peça.',
    inervacao: 'Couro cabeludo suprajacente pelos nervos auriculotemporal (V3) e occipital maior (C2).',
    relacoes: 'Interiormente, lobos parietais, o seio sagital superior na linha média e as granulações aracnóideas, que escavam as fovéolas granulares.',
    clinica:
      'A região do ptério, onde o parietal encontra frontal, temporal e esfenoide, tem lâmina fina e a artéria meníngea média logo abaixo — sítio clássico do hematoma extradural. A fratura com afundamento parietal comprime o córtex sensitivo-motor adjacente.',
    pontos: [
      'Quatro suturas: coronal, sagital, lambdóidea e escamosa',
      'Sulcos da artéria meníngea média na face interna',
      'Participa do ptério, ponto frágil da calvária',
    ],
  },
  {
    termos: ['osso occipital', 'parte basilar do osso occipital', 'porcao basilar'],
    resumo: 'Osso ímpar posteroinferior do crânio, atravessado pelo forame magno.',
    localizacao:
      'Forma a parte posterior e inferior do crânio: escama atrás, partes laterais com os côndilos occipitais e parte basilar à frente, fundida ao esfenoide no clivo.',
    funcao:
      'Protege os lobos occipitais e o cerebelo, dá passagem ao tronco encefálico pelo forame magno e articula-se com o atlas pelos côndilos, permitindo o movimento de "sim" da cabeça.',
    vascularizacao: 'Artéria occipital (carótida externa) por fora; artérias vertebrais atravessam o forame magno rumo à cavidade craniana.',
    inervacao: 'Nervo occipital maior (C2) na pele suprajacente; o nervo hipoglosso (XII) atravessa o canal do hipoglosso.',
    relacoes: 'Cerebelo e lobos occipitais acima da tenda; bulbo no forame magno; nucais e trapézio inserindo-se nas linhas nucais.',
    clinica:
      'A protuberância occipital externa (ínio) é reparo palpável. A herniação das tonsilas cerebelares pelo forame magno comprime o bulbo e é causa de parada respiratória. Fraturas de côndilo occipital indicam trauma cervical de alta energia.',
    pontos: [
      'Forame magno: bulbo, artérias vertebrais e raízes espinais do XI',
      'Côndilos occipitais articulam com o atlas (articulação atlantoccipital)',
      'Canal do hipoglosso conduz o XII par',
    ],
  },
  {
    termos: ['osso temporal'],
    resumo: 'Osso par da parede lateral e da base do crânio, que aloja o aparelho auditivo e vestibular.',
    localizacao:
      'Entre o esfenoide à frente e o occipital atrás, com partes escamosa (lateral), timpânica (em torno do meato acústico externo), petrosa (a pirâmide da base) e mastóidea, além do processo estiloide.',
    funcao:
      'Protege as orelhas média e interna, forma a fossa mandibular da articulação temporomandibular e dá inserção a músculos do pescoço (esternocleidomastóideo na mastoide) e da mímica.',
    vascularizacao: 'Artéria temporal superficial e auricular posterior; a carótida interna atravessa o canal carótico dentro da parte petrosa.',
    inervacao: 'Nervo auriculotemporal (V3); o nervo facial (VII) percorre o canal facial dentro do osso e sai pelo forame estilomastóideo.',
    relacoes: 'Lobo temporal acima da parte escamosa; orelhas média e interna dentro da parte petrosa; seio sigmóideo escavando sua face posterior.',
    clinica:
      'A fratura de osso temporal pode lesar o VII par (paralisia facial periférica) e o VIII (surdez, vertigem), e cursa com hemotímpano e sinal de Battle. A mastoidite é complicação da otite média, e a proximidade do seio sigmóideo explica a trombose séptica.',
    pontos: [
      'Contém orelha média e interna e o canal do nervo facial',
      'Canal carótico: passagem da artéria carótida interna',
      'Processo mastoide: inserção do esternocleidomastóideo, reparo palpável',
    ],
  },
  {
    termos: ['osso esfenoide', 'esfenoide', 'asa maior do esfenoide', 'asa menor do esfenoide'],
    resumo: 'Osso ímpar em forma de morcego, no centro da base do crânio, articulando-se com quase todos os outros.',
    localizacao:
      'Ocupa o centro da base craniana, com corpo (que aloja a sela túrcica e o seio esfenoidal), asas menores (limite entre fossas anterior e média), asas maiores (assoalho da fossa média) e processos pterigoides.',
    funcao:
      'É a peça-chave que articula o neurocrânio ao viscerocrânio, abriga a hipófise na sela túrcica e dá passagem à maioria dos nervos cranianos que saem pela fossa média.',
    vascularizacao: 'Ramos da artéria maxilar e da meníngea média, que entra pelo forame espinhoso.',
    inervacao: 'Atravessado pelos nervos óptico (canal óptico), III, IV, V1 e VI (fissura orbital superior), V2 (forame redondo) e V3 (forame oval).',
    relacoes: 'Hipófise na sela túrcica; seio cavernoso lateralmente ao corpo, com a carótida interna e os nervos oculomotores em sua parede.',
    clinica:
      'O acesso transesfenoidal à hipófise passa pelo nariz e pelo seio esfenoidal. A síndrome do seio cavernoso combina oftalmoplegia (III, IV, VI) com hipoestesia de V1/V2. A fratura de asa maior ameaça a meníngea média.',
    pontos: [
      'Sela túrcica aloja a hipófise; clinoides como reparos cirúrgicos',
      'Fissura orbital superior: III, IV, V1, VI e veia oftálmica superior',
      'Forames redondo (V2), oval (V3) e espinhoso (meníngea média)',
    ],
  },
  {
    termos: ['osso etmoide', 'etmoide', 'lamina crivosa', 'crista galli', 'lamina cribriforme'],
    resumo: 'Osso ímpar, leve e pneumatizado, entre as órbitas — teto da cavidade nasal e assoalho da fossa craniana anterior.',
    localizacao:
      'Entre as duas órbitas, formando a lâmina crivosa no alto (com a crista galli na linha média), a lâmina perpendicular (parte óssea do septo nasal), as conchas superior e média e o labirinto etmoidal com suas células.',
    funcao:
      'Sustenta as vias olfatórias, forma parte do septo e da parede lateral do nariz e contém as células etmoidais, que drenam para os meatos nasais.',
    vascularizacao: 'Artérias etmoidais anterior e posterior, ramos da artéria oftálmica (sistema carotídeo interno).',
    inervacao: 'Filamentos do nervo olfatório (I) atravessando a lâmina crivosa; sensibilidade pelos nervos etmoidais (V1).',
    relacoes: 'Bulbos olfatórios repousam sobre a lâmina crivosa; a lâmina papirácea separa as células etmoidais da órbita — e é fina como papel.',
    clinica:
      'O trauma frontobasal cisalha os filamentos olfatórios na lâmina crivosa: anosmia e rinorreia liquórica. A celulite orbitária de origem etmoidal atravessa a lâmina papirácea, sendo a causa mais comum de infecção orbitária na criança.',
    pontos: [
      'Lâmina crivosa: passagem dos filamentos olfatórios',
      'Lâmina perpendicular forma o septo nasal ósseo com o vômer',
      'Lâmina papirácea: parede medial da órbita, extremamente fina',
    ],
  },
  {
    termos: ['osso zigomatico', 'zigomatico', 'arco zigomatico'],
    resumo: 'Osso da maçã do rosto, que liga a maxila ao temporal e forma a proeminência lateral da face.',
    localizacao:
      'Na parede lateral e no assoalho da órbita, articulando-se com maxila, frontal, esfenoide e temporal; seu processo temporal forma, com o processo zigomático do temporal, o arco zigomático.',
    funcao: 'Protege o conteúdo orbital lateral, dá inserção ao masseter e ao zigomático maior e define o contorno lateral da face.',
    vascularizacao: 'Artérias zigomático-orbital e transversa da face, ramos da temporal superficial.',
    inervacao: 'Nervos zigomaticofacial e zigomaticotemporal (ramos de V2).',
    relacoes: 'Arco zigomático cobre a fossa temporal e a incisura mandibular, sob o qual passa o tendão do temporal.',
    clinica:
      'A fratura do complexo zigomático-maxilar deprime a maçã do rosto, pode causar diplopia por acometimento do assoalho orbitário e trismo por bloqueio do processo coronoide sob o arco. Hipoestesia infraorbital é achado frequente.',
    pontos: [
      'Forma o arco zigomático com o processo zigomático do temporal',
      'Participa da parede lateral e do assoalho da órbita',
      'Inserção do masseter',
    ],
  },
  {
    termos: ['osso maxilar', 'maxila'],
    resumo: 'Osso par que forma o esqueleto do terço médio da face, o palato duro e a arcada dentária superior.',
    localizacao:
      'Ocupa o centro da face, com corpo pneumatizado pelo seio maxilar e quatro processos: frontal, zigomático, palatino (que forma os dois terços anteriores do palato duro) e alveolar (que aloja os dentes superiores).',
    funcao: 'Sustenta a arcada dentária superior, forma o assoalho da órbita, a parede lateral e o assoalho da cavidade nasal e transmite as forças da mastigação ao crânio.',
    vascularizacao: 'Artérias alveolares superiores, infraorbital e palatina maior, ramos da artéria maxilar.',
    inervacao: 'Nervo maxilar (V2), por meio dos nervos alveolares superiores e do nervo infraorbital, que emerge pelo forame infraorbital.',
    relacoes: 'Seio maxilar drena no meato nasal médio; as raízes dos pré-molares e molares superiores fazem relevo em seu assoalho.',
    clinica:
      'As fraturas de Le Fort (I, II e III) separam a maxila do crânio em planos previsíveis. A fratura em blow-out do assoalho orbitário aprisiona o reto inferior e causa diplopia no olhar para cima. Abscessos dentários podem drenar para o seio maxilar.',
    pontos: [
      'Seio maxilar drena no meato médio — óstio alto, drenagem contra a gravidade',
      'Forame infraorbital: saída do nervo infraorbital (V2)',
      'Processo palatino forma os 2/3 anteriores do palato duro',
    ],
  },
  {
    termos: ['osso nasal'],
    resumo: 'Pequeno osso par que forma o dorso ósseo do nariz.',
    localizacao: 'Entre os processos frontais das maxilas, abaixo da glabela, articulando-se acima com o frontal na sutura frontonasal (ponto násio).',
    funcao: 'Sustenta a pirâmide nasal e dá suporte à porção superior do dorso, continuando-se abaixo pelas cartilagens nasais.',
    vascularizacao: 'Artérias dorsal do nariz (oftálmica) e ramos da facial.',
    inervacao: 'Nervo infratroclear e ramo nasal externo do etmoidal anterior (V1).',
    relacoes: 'Continua-se distalmente pelas cartilagens laterais e alares, que dão a forma da ponta nasal.',
    clinica:
      'É o osso mais fraturado da face. A avaliação prioriza o hematoma de septo, que precisa ser drenado para evitar necrose da cartilagem e nariz em sela. A redução costuma ser feita nas duas primeiras semanas.',
    pontos: ['Osso mais fraturado da face', 'Sutura frontonasal define o ponto násio', 'Hematoma septal é a urgência associada'],
  },
  {
    termos: ['osso lacrimal', 'lacrimal'],
    resumo: 'O menor osso da face, na parede medial da órbita, alojando o saco lacrimal.',
    localizacao: 'Parede medial da órbita, à frente da lâmina papirácea do etmoide, formando com a maxila a fossa do saco lacrimal.',
    funcao: 'Aloja o saco lacrimal e delimita o início do ducto lacrimonasal, que desce para o meato nasal inferior.',
    vascularizacao: 'Ramos da artéria oftálmica.',
    inervacao: 'Nervo infratroclear (V1).',
    clinica: 'A dacriocistite acomete o saco lacrimal nesta fossa; a dacriocistorrinostomia cria uma comunicação direta com a cavidade nasal através deste osso.',
    pontos: ['Fossa do saco lacrimal', 'Ducto lacrimonasal drena no meato inferior', 'Menor osso da face'],
  },
  {
    termos: ['vomer'],
    resumo: 'Osso ímpar em forma de arado que forma a porção posteroinferior do septo nasal.',
    localizacao: 'Na linha média da cavidade nasal, entre as cóanas, articulando-se acima com o esfenoide e à frente com a lâmina perpendicular do etmoide.',
    funcao: 'Compõe o septo nasal ósseo e separa as duas cavidades nasais.',
    vascularizacao: 'Artéria esfenopalatina, cujo ramo septal participa da área de Kiesselbach.',
    inervacao: 'Nervo nasopalatino (V2).',
    clinica: 'O desvio de septo pode ser ósseo (vômer e etmoide) ou cartilaginoso; a septoplastia atua exatamente nesses componentes. A epistaxe posterior grave costuma vir da esfenopalatina, junto ao vômer.',
    pontos: ['Forma o septo ósseo com a lâmina perpendicular do etmoide', 'Delimita as cóanas', 'Relação com a artéria esfenopalatina'],
  },
  {
    termos: ['osso palatino', 'palatino'],
    resumo: 'Osso par em L, entre a maxila e os processos pterigoides, que completa o palato duro atrás.',
    localizacao: 'Sua lâmina horizontal forma o terço posterior do palato duro; a lâmina perpendicular participa da parede lateral da cavidade nasal e da fossa pterigopalatina.',
    funcao: 'Fecha o palato duro posteriormente, separando definitivamente as cavidades nasal e oral.',
    vascularizacao: 'Artérias palatinas maior e menor, ramos da artéria maxilar via canal palatino.',
    inervacao: 'Nervos palatinos maior e menor (V2), a partir do gânglio pterigopalatino.',
    clinica: 'A falha de fusão nesse plano produz a fenda palatina. O bloqueio do nervo palatino maior no forame palatino maior anestesia a mucosa palatina em procedimentos odontológicos.',
    pontos: ['Forma o 1/3 posterior do palato duro', 'Forame palatino maior', 'Participa da fossa pterigopalatina'],
  },
  {
    termos: ['concha nasal'],
    classe: 'via-aerea',
    resumo: 'Lâmina óssea encurvada na parede lateral da cavidade nasal, revestida por mucosa respiratória.',
    localizacao:
      'Projeta-se medialmente da parede lateral do nariz. As conchas superior e média pertencem ao etmoide; a inferior é osso independente. Abaixo de cada concha existe o meato correspondente.',
    funcao:
      'Cria turbulência no ar inspirado, aumentando o contato com a mucosa para aquecer, umidificar e filtrar; abaixo delas drenam os seios paranasais e o ducto lacrimonasal.',
    vascularizacao: 'Artéria esfenopalatina e ramos etmoidais, sobre um plexo venoso cavernoso que faz a mucosa ingurgitar e desingurgitar ciclicamente.',
    inervacao: 'Sensibilidade por V1 e V2; secreção pelo parassimpático do gânglio pterigopalatino.',
    relacoes:
      'Meato superior recebe as células etmoidais posteriores; o meato médio recebe frontal, maxilar e etmoidais anteriores (complexo ostiomeatal); o meato inferior recebe o ducto lacrimonasal.',
    clinica:
      'A hipertrofia de conchas obstrui o nariz e é alvo de turbinoplastia. O ciclo nasal fisiológico alterna a congestão entre os lados. O complexo ostiomeatal no meato médio é a área-chave da cirurgia endoscópica da sinusite.',
    pontos: [
      'Superior e média são do etmoide; a inferior é osso próprio',
      'Meato médio: frontal, maxilar e etmoidais anteriores',
      'Meato inferior: ducto lacrimonasal',
    ],
  },
  {
    termos: ['orbita', 'cavidade orbital'],
    classe: 'passagem-ossea',
    resumo: 'Cavidade óssea piramidal que aloja o bulbo do olho, seus músculos, vasos e nervos.',
    localizacao:
      'Formada por sete ossos — frontal, zigomático, maxila, lacrimal, etmoide, esfenoide e palatino —, com o ápice na fissura orbital superior e no canal óptico, e a base voltada para a frente.',
    funcao: 'Protege e orienta o bulbo do olho, ancora os músculos extrínsecos e conduz o feixe neurovascular do olho.',
    vascularizacao: 'Artéria oftálmica (primeiro ramo intracraniano da carótida interna) e drenagem pelas veias oftálmicas superior e inferior.',
    inervacao: 'Nervo óptico (II) pelo canal óptico; III, IV, V1 e VI pela fissura orbital superior; V2 pelo forame infraorbital.',
    relacoes:
      'Teto: fossa craniana anterior e seio frontal. Assoalho: seio maxilar. Parede medial: células etmoidais (lâmina papirácea). Parede lateral: fossa temporal — a mais espessa.',
    clinica:
      'A fratura em blow-out atinge assoalho e parede medial, as mais finas, com enoftalmia e diplopia. A veia oftálmica superior comunica-se com o seio cavernoso e não tem valvas: infecções do triângulo perigoso da face podem gerar trombose de seio cavernoso.',
    pontos: [
      'Sete ossos; assoalho e parede medial são os pontos fracos',
      'Canal óptico (II e artéria oftálmica) e fissura orbital superior (III, IV, V1, VI)',
      'Comunicação venosa com o seio cavernoso',
    ],
  },
  {
    termos: ['fissura orbital superior'],
    resumo: 'Fenda entre as asas maior e menor do esfenoide, comunicando a órbita com a fossa craniana média.',
    localizacao: 'No ápice da órbita, lateralmente ao canal óptico.',
    funcao: 'Dá passagem aos nervos oculomotor (III), troclear (IV), oftálmico (V1) e abducente (VI) e à veia oftálmica superior.',
    clinica:
      'A síndrome da fissura orbital superior combina oftalmoplegia completa, ptose, midríase e anestesia da fronte. Se houver também perda visual, o canal óptico está envolvido — é a síndrome do ápice orbitário.',
    pontos: ['III, IV, V1, VI e veia oftálmica superior', 'Separa asa maior de asa menor do esfenoide', 'Síndrome do ápice orbitário quando inclui o II'],
  },
  {
    termos: ['fissura orbital inferior'],
    resumo: 'Fenda entre a asa maior do esfenoide e a maxila, comunicando a órbita com as fossas pterigopalatina e infratemporal.',
    localizacao: 'Entre o assoalho e a parede lateral da órbita, posteriormente.',
    funcao: 'Dá passagem ao nervo infraorbital e ao nervo zigomático (V2), a ramos da artéria maxilar e à veia oftálmica inferior.',
    clinica: 'É a via de disseminação de tumores da fossa infratemporal para a órbita e um corredor cirúrgico de acesso à fossa pterigopalatina.',
    pontos: ['Comunica órbita com fossa pterigopalatina', 'V2 e veia oftálmica inferior', 'Via de disseminação tumoral'],
  },
  {
    termos: ['forame magno'],
    resumo: 'A maior abertura da base do crânio, no osso occipital, onde a cavidade craniana se continua com o canal vertebral.',
    localizacao: 'No centro da parte basilar/lateral do occipital, entre os côndilos occipitais.',
    funcao:
      'Dá passagem à transição bulbomedular, às artérias vertebrais e espinais, às raízes espinais do nervo acessório (XI) e às membranas tectória e ligamentos que estabilizam a junção craniovertebral.',
    clinica:
      'A herniação das tonsilas cerebelares por ele comprime o bulbo — apneia, bradicardia e morte. A malformação de Chiari é definida pela descida das tonsilas através dele.',
    pontos: ['Transição bulbomedular', 'Artérias vertebrais e raízes espinais do XI', 'Herniação tonsilar e Chiari'],
  },
  {
    termos: ['forame oval'],
    resumo: 'Abertura da asa maior do esfenoide para a fossa infratemporal.',
    localizacao: 'Na fossa craniana média, posterolateralmente ao forame redondo.',
    funcao: 'Dá passagem ao nervo mandibular (V3) e à artéria meníngea acessória.',
    clinica: 'É a via de acesso percutâneo ao gânglio trigeminal na rizotomia por radiofrequência para neuralgia do trigêmeo.',
    pontos: ['V3 — nervo mandibular', 'Acesso percutâneo ao gânglio trigeminal', 'Vizinho ao forame espinhoso'],
  },
  {
    termos: ['forame espinhoso'],
    resumo: 'Pequeno forame da asa maior do esfenoide, atrás do forame oval.',
    localizacao: 'Fossa craniana média, posterolateral ao forame oval.',
    funcao: 'Dá passagem à artéria meníngea média e ao ramo meníngeo de V3.',
    clinica: 'Sua ligadura ou embolização controla o sangramento da meníngea média; a fratura na região do ptério rompe justamente esse vaso.',
    pontos: ['Artéria meníngea média', 'Relação com o hematoma extradural', 'Reparo cirúrgico da fossa média'],
  },
  {
    termos: ['forame redondo'],
    resumo: 'Canal da asa maior do esfenoide que liga a fossa craniana média à fossa pterigopalatina.',
    localizacao: 'Fossa craniana média, à frente e medialmente ao forame oval.',
    funcao: 'Dá passagem ao nervo maxilar (V2).',
    clinica: 'É o corredor de disseminação perineural de tumores da face (carcinoma adenoide cístico, carcinoma espinocelular) rumo à cavidade craniana.',
    pontos: ['V2 — nervo maxilar', 'Comunica com a fossa pterigopalatina', 'Via de disseminação perineural'],
  },
  {
    termos: ['forame jugular'],
    resumo: 'Abertura entre o temporal e o occipital, na base do crânio.',
    localizacao: 'Fossa craniana posterior, lateralmente ao forame magno.',
    funcao: 'Dá passagem aos nervos glossofaríngeo (IX), vago (X) e acessório (XI) e ao início da veia jugular interna, continuação do seio sigmóideo.',
    clinica:
      'A síndrome do forame jugular (Vernet) combina disfagia, disfonia, perda do reflexo do vômito e fraqueza do trapézio e do esternocleidomastóideo. O glomus jugulare é o tumor típico da região.',
    pontos: ['IX, X, XI e veia jugular interna', 'Síndrome de Vernet', 'Continuação do seio sigmóideo'],
  },
  {
    termos: ['meato acustico interno', 'meato acustico externo'],
    resumo: 'Canal do osso temporal relacionado à condução do som e à passagem dos nervos da orelha interna.',
    localizacao:
      'O meato acústico externo vai do pavilhão à membrana timpânica; o meato acústico interno perfura a face posterior da parte petrosa, abrindo-se na fossa craniana posterior.',
    funcao:
      'O externo conduz a onda sonora até o tímpano; o interno dá passagem aos nervos facial (VII) e vestibulococlear (VIII) e à artéria labiríntica.',
    clinica:
      'O schwannoma vestibular cresce no meato acústico interno e comprime VII e VIII, evoluindo para a síndrome do ângulo pontocerebelar. No exame otoscópico, o meato externo é retificado tracionando o pavilhão para cima e para trás no adulto.',
    pontos: ['Interno: VII, VIII e artéria labiríntica', 'Externo: conduz som até o tímpano', 'Schwannoma vestibular'],
  },
  {
    termos: ['sela turcica', 'dorso da sela', 'fossa hipofisaria'],
    resumo: 'Depressão em forma de sela no corpo do esfenoide, que aloja a hipófise.',
    localizacao: 'No centro da fossa craniana média, entre os processos clinoides anteriores e posteriores, com o dorso da sela atrás.',
    funcao: 'Abriga e protege a glândula hipófise, ligada ao hipotálamo pelo infundíbulo através do diafragma da sela.',
    relacoes: 'Acima, o quiasma óptico; lateralmente, os seios cavernosos com a carótida interna e os nervos oculomotores; abaixo, o seio esfenoidal.',
    clinica:
      'O adenoma hipofisário que cresce para cima comprime o quiasma e produz hemianopsia bitemporal. A apoplexia hipofisária é emergência endócrina. O acesso cirúrgico padrão é transesfenoidal, pelo nariz.',
    pontos: ['Aloja a hipófise', 'Quiasma óptico logo acima', 'Seios cavernosos lateralmente'],
  },
  {
    termos: ['processo mastoide', 'mastoide'],
    resumo: 'Saliência cônica pneumatizada do osso temporal, atrás da orelha.',
    localizacao: 'Posteroinferior ao meato acústico externo, palpável atrás do pavilhão auricular.',
    funcao: 'Dá inserção ao esternocleidomastóideo, ao esplênio da cabeça e ao longuíssimo da cabeça, e contém células aéreas em comunicação com a orelha média.',
    relacoes: 'Internamente, o seio sigmóideo escava sua face medial; o nervo facial emerge no forame estilomastóideo, à sua frente e medialmente.',
    clinica:
      'A mastoidite é a complicação clássica da otite média não tratada, com dor, edema e desvio do pavilhão. O sinal de Battle (equimose retroauricular) sugere fratura de base do crânio.',
    pontos: ['Inserção do esternocleidomastóideo', 'Células mastóideas comunicam-se com a orelha média', 'Relação com seio sigmóideo e nervo facial'],
  },
  {
    termos: ['processo estiloide'],
    resumo: 'Projeção fina e pontiaguda do osso temporal, à frente do processo mastoide.',
    localizacao: 'Inferiormente à parte petrosa do temporal, apontando para baixo e para a frente.',
    funcao: 'Dá inserção ao aparelho estiloide: músculos estilo-hióideo, estiloglosso e estilofaríngeo, e ligamentos estilo-hióideo e estilomandibular.',
    clinica: 'O alongamento do processo ou a calcificação do ligamento estilo-hióideo causa a síndrome de Eagle: dor cervicofacial e disfagia, agravadas pela rotação da cabeça.',
    pontos: ['Três músculos e dois ligamentos', 'Síndrome de Eagle', 'Vizinho ao forame estilomastóideo'],
  },
  {
    termos: ['forame mentual', 'forame mentoniano'],
    resumo: 'Abertura na face lateral do corpo da mandíbula, saída do nervo mentual.',
    localizacao: 'Geralmente na vertical do segundo pré-molar inferior, a meio caminho entre as bordas alveolar e inferior da mandíbula.',
    funcao: 'Dá passagem ao nervo e aos vasos mentuais, que inervam a pele do mento e do lábio inferior e a mucosa gengival anterior.',
    clinica:
      'É o ponto do bloqueio do nervo mentual. No paciente desdentado, a reabsorção do rebordo alveolar aproxima o forame da borda superior, expondo o nervo à compressão pela prótese.',
    pontos: ['Nervo mentual, ramo do alveolar inferior (V3)', 'Referência no segundo pré-molar', 'Reabsorção alveolar aproxima o nervo da superfície'],
  },
  {
    termos: ['forame infraorbital', 'canal infraorbital'],
    resumo: 'Abertura na face anterior da maxila, abaixo da margem infraorbital.',
    localizacao: 'Cerca de 1 cm abaixo da margem infraorbital, alinhado com o forame supraorbital e o forame mentual.',
    funcao: 'Dá passagem ao nervo e aos vasos infraorbitais, para a pele da pálpebra inferior, asa do nariz e lábio superior.',
    clinica: 'É o ponto do bloqueio infraorbital, e a hipoestesia nesse território é sinal cardinal da fratura do assoalho da órbita ou do complexo zigomático-maxilar.',
    pontos: ['Nervo infraorbital (V2)', 'Alinhado com supraorbital e mentual', 'Hipoestesia sinaliza fratura orbitária'],
  },
  {
    termos: ['pterio', 'pterion'],
    resumo: 'Ponto craniométrico onde se encontram frontal, parietal, temporal e a asa maior do esfenoide.',
    localizacao: 'Na face lateral do crânio, cerca de 4 cm acima do arco zigomático e 3 cm atrás do processo frontal do zigomático.',
    funcao: 'Marca a região de menor espessura da calvária e projeta, por fora, o trajeto do ramo anterior da artéria meníngea média e o sulco lateral do cérebro.',
    clinica:
      'É o sítio clássico do hematoma extradural: um trauma temporal fratura a lâmina fina e rompe a meníngea média, com intervalo lúcido seguido de deterioração. É também a referência da craniotomia pterional, o acesso mais usado a aneurismas do polígono de Willis.',
    pontos: ['Quatro ossos se encontram', 'Ramo anterior da meníngea média por baixo', 'Craniotomia pterional'],
  },
  {
    termos: ['asterio', 'asterion'],
    resumo: 'Ponto craniométrico onde se encontram parietal, occipital e temporal.',
    localizacao: 'Na face lateral e posterior do crânio, no encontro das suturas lambdóidea, occipitomastóidea e parietomastóidea.',
    funcao: 'Projeta, por fora, a junção entre os seios transverso e sigmóideo.',
    clinica: 'É a referência das craniotomias retrossigmóideas para a fossa posterior e para o ângulo pontocerebelar — perfurar acima dele arrisca o seio transverso.',
    pontos: ['Três ossos se encontram', 'Projeta a junção transverso-sigmóidea', 'Referência da craniotomia retrossigmóidea'],
  },
  {
    termos: ['bregma'],
    resumo: 'Ponto craniométrico no encontro das suturas coronal e sagital.',
    localizacao: 'No teto do crânio, na linha média, onde a sutura coronal cruza a sagital.',
    funcao: 'Corresponde, no recém-nascido, ao fontículo anterior — a moleira grande.',
    clinica: 'É a referência de posicionamento em neurocirurgia estereotáxica e no acesso ao ventrículo lateral pelo ponto de Kocher, imediatamente à frente e lateralmente a ele.',
    pontos: ['Suturas coronal e sagital', 'Corresponde ao fontículo anterior', 'Referência da ventriculostomia'],
  },
  {
    termos: ['lambda'],
    resumo: 'Ponto craniométrico no encontro das suturas sagital e lambdóidea.',
    localizacao: 'Na parte posterior do teto do crânio, na linha média.',
    funcao: 'Corresponde, no recém-nascido, ao fontículo posterior.',
    clinica: 'Serve de referência posterior nas medidas craniométricas e no planejamento de acessos occipitais.',
    pontos: ['Suturas sagital e lambdóidea', 'Corresponde ao fontículo posterior', 'Ossos suturais (wormianos) são comuns aqui'],
  },
  {
    termos: ['nasio', 'nasion'],
    resumo: 'Ponto craniométrico na sutura frontonasal, na raiz do nariz.',
    localizacao: 'Na linha média, na depressão entre a glabela e o dorso do nariz.',
    funcao: 'Serve de origem para praticamente todas as medidas cefalométricas do plano sagital.',
    clinica: 'É referência obrigatória em cefalometria ortodôntica, em cirurgia ortognática e em neuronavegação.',
    pontos: ['Sutura frontonasal', 'Origem das medidas cefalométricas', 'Reparo palpável na linha média'],
  },
  {
    termos: ['inio', 'inion'],
    resumo: 'Ponto craniométrico na protuberância occipital externa.',
    localizacao: 'Na linha média, na saliência palpável da parte posterior do crânio.',
    funcao: 'Corresponde, por dentro, à confluência dos seios da dura-máter.',
    clinica: 'Reparo do eletroencefalograma (posição Oz do sistema 10-20) e referência para a craniotomia occipital, onde a proximidade da confluência dos seios exige cuidado.',
    pontos: ['Protuberância occipital externa', 'Projeta a confluência dos seios', 'Reparo do sistema 10-20 do EEG'],
  },
  {
    termos: ['basio', 'basion'],
    resumo: 'Ponto craniométrico na margem anterior do forame magno, na linha média.',
    localizacao: 'Borda anterior do forame magno, na parte basilar do occipital.',
    funcao: 'Define, junto ao ópistio, o diâmetro anteroposterior do forame magno.',
    clinica: 'É a referência das medidas de estabilidade da junção craniovertebral (linha de Wackenheim, intervalo básio-dental) usadas para reconhecer luxação atlantoccipital.',
    pontos: ['Margem anterior do forame magno', 'Medidas da junção craniovertebral', 'Par com o ópistio'],
  },
  {
    termos: ['gonio', 'gonion'],
    resumo: 'Ponto craniométrico no ângulo da mandíbula.',
    localizacao: 'No ponto mais posteroinferior do ângulo mandibular, palpável abaixo do lobo da orelha.',
    funcao: 'Define a largura bigoníaca da face e marca a inserção do masseter e do pterigóideo medial.',
    clinica: 'Reparo palpável do exame da mandíbula e do bloqueio anestésico; o ângulo é sítio frequente de fratura mandibular, sobretudo com terceiro molar incluso.',
    pontos: ['Ângulo da mandíbula', 'Inserção de masseter e pterigóideo medial', 'Sítio frequente de fratura'],
  },
  {
    termos: ['vertex', 'vertice do cranio'],
    resumo: 'O ponto mais alto do crânio em posição anatômica.',
    localizacao: 'Na linha média da calvária, geralmente sobre a sutura sagital.',
    funcao: 'Define a altura máxima do crânio nas medidas antropométricas.',
    clinica: 'Em obstetrícia, apresentação de vértice é a apresentação cefálica fletida — a mais favorável ao parto vaginal.',
    pontos: ['Ponto mais alto da calvária', 'Sobre a sutura sagital', 'Apresentação de vértice em obstetrícia'],
  },
  {
    termos: ['glabela'],
    resumo: 'Saliência lisa entre os arcos superciliares, acima da raiz do nariz.',
    localizacao: 'Na linha média do osso frontal, entre as sobrancelhas e acima do násio.',
    funcao: 'Ponto mais anterior da fronte no plano sagital; nela se inserem os músculos prócero e corrugador do supercílio.',
    clinica: 'É o alvo do reflexo glabelar (sinal de Myerson, persistente no parkinsonismo) e área frequente de aplicação de toxina botulínica.',
    pontos: ['Entre os arcos superciliares', 'Reflexo glabelar', 'Inserção do prócero'],
  },
  {
    termos: ['fonticulo anterior'],
    resumo: 'A moleira grande — fontículo losangular no encontro das suturas coronal, sagital e metópica.',
    localizacao: 'No teto do crânio, na linha média, na posição do futuro bregma.',
    funcao: 'Permite o cavalgamento dos ossos no parto e acomoda o crescimento encefálico rápido do primeiro ano.',
    clinica:
      'Fecha entre 18 e 24 meses. Abaulado e tenso, sugere hipertensão intracraniana (meningite, hidrocefalia); deprimido, desidratação. É a janela do ultrassom transfontanelar do neonato.',
    pontos: ['Losangular, fecha em 18–24 meses', 'Janela do ultrassom transfontanelar', 'Tensão avalia pressão intracraniana e hidratação'],
  },
  {
    termos: ['fonticulo posterior'],
    resumo: 'Fontículo triangular no encontro das suturas sagital e lambdóidea.',
    localizacao: 'Na parte posterior do teto do crânio, na posição do futuro lambda.',
    funcao: 'Participa da moldagem da cabeça no canal de parto.',
    clinica:
      'Fecha bem cedo, por volta de 2 a 3 meses. Na obstetrícia, sua palpação ao toque identifica a variedade de posição do polo cefálico durante o trabalho de parto.',
    pontos: ['Triangular, fecha em 2–3 meses', 'Reparo do toque obstétrico', 'Futuro lambda'],
  },
  {
    termos: ['fonticulo anterolateral', 'fonticulo esfenoidal', 'fonticulo posterolateral', 'fonticulo mastoideo'],
    resumo: 'Fontículos laterais pares, nas posições dos futuros ptério (anterolateral) e astério (posterolateral).',
    localizacao: 'Nas faces laterais do crânio do recém-nascido, à frente e atrás da orelha.',
    funcao: 'Completam a flexibilidade do crânio neonatal durante a moldagem no parto.',
    clinica: 'Fecham em torno de 6 meses (anterolateral) e 6 a 18 meses (posterolateral); seu fechamento tardio integra a investigação de displasias ósseas e hipotireoidismo congênito.',
    pontos: ['Anterolateral = futuro ptério', 'Posterolateral = futuro astério', 'Fechamento no primeiro ano e meio'],
  },
  {
    termos: ['diametro suboccipitobregmatico'],
    resumo: 'Diâmetro do polo cefálico entre o subocciput e o bregma — o menor e mais favorável.',
    localizacao: 'Medido do ponto abaixo da protuberância occipital externa até o bregma, com a cabeça bem fletida.',
    funcao: 'Representa a circunferência que se apresenta ao canal de parto na apresentação de vértice, com flexão completa.',
    clinica: 'Mede cerca de 9,5 cm. É o diâmetro da apresentação mais favorável — a razão pela qual as manobras obstétricas buscam flexão da cabeça fetal.',
    pontos: ['≈ 9,5 cm', 'Apresentação de vértice (flexão completa)', 'O menor diâmetro cefálico de apresentação'],
  },
  {
    termos: ['diametro suboccipitofrontal'],
    resumo: 'Diâmetro do polo cefálico entre o subocciput e a fronte.',
    localizacao: 'Do subocciput à glabela/fronte, com flexão incompleta da cabeça.',
    funcao: 'Corresponde à apresentação de bregma, com flexão intermediária.',
    clinica: 'Mede cerca de 10,5 cm — maior que o suboccipitobregmático, e por isso associado a trabalho de parto mais difícil.',
    pontos: ['≈ 10,5 cm', 'Flexão incompleta', 'Apresentação de bregma'],
  },
  {
    termos: ['diametro occipitofrontal'],
    resumo: 'Diâmetro entre a protuberância occipital externa e a glabela.',
    localizacao: 'Medido no plano sagital, com a cabeça em posição indiferente.',
    funcao: 'É também o diâmetro usado para calcular o perímetro cefálico do recém-nascido.',
    clinica: 'Mede cerca de 11,5 cm. É o diâmetro do perímetro cefálico aferido na sala de parto e acompanhado nas curvas de crescimento.',
    pontos: ['≈ 11,5 cm', 'Base do perímetro cefálico', 'Cabeça em posição indiferente'],
  },
  {
    termos: ['diametro occipitomentoniano'],
    resumo: 'Diâmetro entre a protuberância occipital e o mento — o maior diâmetro cefálico.',
    localizacao: 'Do occipúcio ao mento, com a cabeça em deflexão parcial.',
    funcao: 'Corresponde à apresentação de fronte, a mais desfavorável ao parto vaginal.',
    clinica: 'Mede cerca de 13,5 cm e é incompatível com o parto vaginal a termo na maioria das bacias — a apresentação de fronte persistente é indicação de cesariana.',
    pontos: ['≈ 13,5 cm — o maior', 'Apresentação de fronte', 'Geralmente indica cesariana'],
  },
  {
    termos: ['diametro submentobregmatico'],
    resumo: 'Diâmetro entre a região submentual e o bregma.',
    localizacao: 'Medido com a cabeça em deflexão completa (apresentação de face).',
    funcao: 'É o diâmetro que se apresenta na apresentação de face.',
    clinica: 'Mede cerca de 9,5 cm: apesar da deflexão máxima, é favorável, e a apresentação de face mento-anterior pode evoluir para parto vaginal.',
    pontos: ['≈ 9,5 cm', 'Apresentação de face', 'Mento-anterior pode nascer por via vaginal'],
  },
  {
    termos: ['diametro biparietal'],
    resumo: 'Maior distância transversal entre os dois ossos parietais.',
    localizacao: 'Medido entre as eminências parietais, perpendicular ao plano sagital.',
    funcao: 'Representa a maior largura do polo cefálico que precisa atravessar a bacia.',
    clinica: 'Mede cerca de 9,5 cm e é a medida ultrassonográfica central da biometria fetal, usada para estimar idade gestacional e peso.',
    pontos: ['≈ 9,5 cm', 'Principal medida da biometria fetal', 'Maior diâmetro transverso'],
  },
  {
    termos: ['diametro bitemporal'],
    resumo: 'Distância entre os pontos mais distantes das suturas coronais, na região temporal.',
    localizacao: 'Medido transversalmente, ao nível das fossas temporais.',
    funcao: 'É o menor diâmetro transverso do polo cefálico.',
    clinica: 'Mede cerca de 8 cm; complementa o biparietal na avaliação da relação entre o polo cefálico e a bacia.',
    pontos: ['≈ 8 cm', 'Menor diâmetro transverso', 'Complementa o biparietal'],
  },

  /* ═══════════════════════ Coluna vertebral ═══════════════════════ */
  {
    termos: ['corpo vertebral', 'corpo da vertebra'],
    resumo: 'A porção anterior, cilíndrica e maciça da vértebra — o pilar de sustentação da coluna.',
    localizacao:
      'À frente do forame vertebral, separado dos corpos vizinhos pelos discos intervertebrais e reforçado pelos ligamentos longitudinais anterior e posterior.',
    funcao:
      'Sustenta a carga axial e a transmite ao nível seguinte pelo disco. Cresce em altura de cima para baixo na coluna, acompanhando o aumento progressivo de peso suportado.',
    vascularizacao: 'Ramos das artérias segmentares (intercostais posteriores e lombares) que entram pela face posterior; drenagem pelas veias basivertebrais para o plexo interno.',
    inervacao: 'Nervo sinuvertebral (ramo meníngeo recorrente), que também inerva o ligamento longitudinal posterior e o anel fibroso.',
    relacoes: 'Atrás dele corre o ligamento longitudinal posterior e, mais atrás, o saco dural com a medula ou a cauda equina.',
    clinica:
      'É o sítio preferencial da fratura por compressão osteoporótica (cunha anterior) e da metástase vertebral, que chega pelo plexo de Batson. A vertebroplastia e a cifoplastia atuam exatamente aqui.',
    pontos: [
      'Sustenta carga axial e cresce em altura no sentido craniocaudal',
      'Inervado pelo nervo sinuvertebral',
      'Sítio da fratura osteoporótica e da metástase',
    ],
  },
  {
    termos: ['processo espinhoso'],
    resumo: 'Projeção posterior e mediana do arco vertebral, palpável através da pele.',
    localizacao:
      'Nasce da união das duas lâminas, na linha média. Sua direção muda por região: quase horizontal nas cervicais e lombares, e bem inclinado para baixo nas torácicas médias, onde se sobrepõem como telhas.',
    funcao: 'Alavanca para os músculos do dorso e para os ligamentos supraespinal e interespinais, ampliando o braço de força da extensão da coluna.',
    vascularizacao: 'Ramos dorsais das artérias segmentares.',
    inervacao: 'Ramos dorsais dos nervos espinais, que também inervam a musculatura profunda inserida nele.',
    relacoes: 'Entre dois processos espinhosos consecutivos está o espaço interespinhoso, porta de entrada da punção lombar e da peridural.',
    clinica:
      'O processo espinhoso de C7 (vértebra proeminente) é o reparo de contagem. A inclinação dos processos torácicos obriga a angular a agulha na peridural torácica. Dor à percussão sobre um processo espinhoso sugere fratura, infecção ou metástase.',
    pontos: [
      'C7 = vértebra proeminente, reparo de contagem',
      'Direção muda entre cervical, torácica e lombar',
      'Espaço interespinhoso é a via da punção lombar',
    ],
  },
  {
    termos: ['processo transverso'],
    resumo: 'Projeção lateral do arco vertebral, na junção do pedículo com a lâmina.',
    localizacao:
      'Projeta-se lateralmente de cada lado. Nas cervicais contém o forame transverso; nas torácicas apresenta a fóvea costal para o tubérculo da costela; nas lombares é longo e fino (processo costiforme).',
    funcao: 'Área de inserção para músculos profundos do dorso e para ligamentos, e ponto de articulação com as costelas na região torácica.',
    vascularizacao: 'Ramos das artérias segmentares; nas cervicais, a artéria vertebral atravessa o forame transverso.',
    inervacao: 'Ramos dorsais dos nervos espinais.',
    relacoes: 'Na coluna cervical, a artéria vertebral sobe pelos forames transversos de C6 a C1; na torácica, articula-se com o tubérculo costal.',
    clinica:
      'A fratura de processo transverso lombar sugere trauma de alta energia e associa-se a lesão renal. Na cervical, a fratura que envolve o forame transverso levanta a suspeita de dissecção da artéria vertebral.',
    pontos: [
      'Cervical: forame transverso com a artéria vertebral',
      'Torácica: fóvea costal para o tubérculo da costela',
      'Lombar: longo e fino, inserção muscular',
    ],
  },
  {
    termos: ['processo articular superior', 'processo articular inferior', 'processos articulares'],
    resumo: 'Projeções do arco vertebral que se articulam com as vértebras vizinhas, formando as articulações zigapofisárias.',
    localizacao:
      'Na junção do pedículo com a lâmina, apontando para cima (superior) e para baixo (inferior). A orientação de suas facetas muda por região e é o que define o movimento permitido em cada segmento.',
    funcao:
      'Guiam e limitam o movimento intervertebral: as facetas cervicais, quase horizontais, permitem ampla rotação; as torácicas, coronais, favorecem a rotação; as lombares, sagitais, permitem flexão e extensão mas travam a rotação.',
    vascularizacao: 'Ramos das artérias segmentares.',
    inervacao: 'Ramo medial do ramo dorsal do nervo espinal — o alvo da rizotomia por radiofrequência na dor facetária.',
    relacoes: 'Delimitam, com os pedículos, o forame intervertebral por onde emerge o nervo espinal.',
    clinica:
      'A artrose facetária é causa comum de lombalgia e de estenose de recesso lateral. Como a inervação vem do ramo medial, o bloqueio desse ramo é diagnóstico e terapêutico. A orientação sagital lombar explica a espondilolistese degenerativa em L4–L5.',
    pontos: [
      'Formam as articulações zigapofisárias (facetárias)',
      'Orientação das facetas define o movimento de cada região',
      'Inervadas pelo ramo medial do ramo dorsal',
    ],
  },
  {
    termos: ['forame vertebral', 'canal vertebral'],
    resumo: 'Abertura entre o corpo e o arco vertebral; o empilhamento de todos forma o canal vertebral.',
    localizacao: 'Entre a face posterior do corpo, os pedículos e as lâminas. É triangular e amplo nas cervicais e lombares, e circular e estreito nas torácicas.',
    funcao: 'Aloja e protege a medula espinal, suas meninges, o líquido cerebrospinal, o plexo venoso vertebral interno e, abaixo de L2, a cauda equina.',
    clinica:
      'O canal torácico estreito, somado à irrigação medular precária, torna a lesão medular torácica especialmente grave. A estenose de canal lombar produz claudicação neurogênica, que alivia com a flexão do tronco — sinal do carrinho de supermercado.',
    pontos: ['Estreito na coluna torácica, amplo nas cervicais e lombares', 'Contém medula, meninges e plexo venoso', 'Estenose lombar dá claudicação neurogênica'],
  },
  {
    termos: ['forame intervertebral'],
    resumo: 'Abertura entre duas vértebras adjacentes, por onde emerge o nervo espinal.',
    localizacao: 'Delimitado pelas incisuras vertebrais superior e inferior dos pedículos, pelo disco à frente e pela articulação zigapofisária atrás.',
    funcao: 'Dá passagem ao nervo espinal, à artéria e à veia espinais e ao nervo sinuvertebral.',
    clinica:
      'É onde a raiz é comprimida na hérnia foraminal e na artrose facetária. Na coluna lombar, a hérnia posterolateral comprime a raiz que emerge um nível abaixo (uma hérnia L4–L5 pega tipicamente a raiz L5).',
    pontos: ['Delimitado por pedículos, disco e faceta', 'Passagem do nervo espinal', 'Sítio da radiculopatia compressiva'],
  },
  {
    termos: ['disco intervertebral', 'discos intervertebrais'],
    classe: 'cartilagem',
    resumo: 'Fibrocartilagem entre dois corpos vertebrais, com anel fibroso periférico e núcleo pulposo central.',
    localizacao: 'Entre as faces adjacentes dos corpos vertebrais, aderido às placas terminais cartilaginosas; são 23 discos, do nível C2–C3 até L5–S1.',
    funcao:
      'Amortece e distribui a carga axial, permite pequenos movimentos entre as vértebras e, somados, respondem por cerca de um quarto da altura da coluna — e pela perda de estatura ao longo do dia e da vida.',
    vascularizacao: 'Avascular no adulto: nutre-se por difusão através das placas terminais, o que explica sua capacidade de reparo muito limitada.',
    inervacao: 'Apenas o terço externo do anel fibroso é inervado, pelo nervo sinuvertebral — base da dor discogênica.',
    relacoes: 'À frente, ligamento longitudinal anterior; atrás, ligamento longitudinal posterior, mais estreito na linha média lombar.',
    clinica:
      'O ligamento longitudinal posterior é estreito lateralmente na região lombar, e é por isso que a hérnia é tipicamente posterolateral, comprimindo a raiz que desce. A degeneração discal reduz a altura do espaço e sobrecarrega as facetas.',
    pontos: [
      'Anel fibroso + núcleo pulposo; avascular no adulto',
      'Hérnia posterolateral é a mais comum (ligamento posterior estreito)',
      'Só o anel externo dói',
    ],
  },
  {
    termos: ['atlas'],
    resumo: 'A primeira vértebra cervical (C1) — um anel sem corpo e sem processo espinhoso.',
    localizacao: 'Entre os côndilos occipitais e o áxis, com massas laterais unidas por arcos anterior e posterior.',
    funcao:
      'Sustenta o crânio e permite o movimento de "sim" na articulação atlantoccipital. Não tem corpo porque este se fundiu ao áxis como dente (processo odontoide).',
    vascularizacao: 'A artéria vertebral cruza o sulco da artéria vertebral, na face superior do arco posterior.',
    inervacao: 'Nervo suboccipital (C1), motor para os músculos suboccipitais.',
    relacoes: 'O dente do áxis encaixa-se atrás do arco anterior, mantido pelo ligamento transverso do atlas.',
    clinica:
      'A fratura de Jefferson é uma fratura em explosão do anel de C1 por carga axial, e pode romper o ligamento transverso, tornando a lesão instável. O trajeto da artéria vertebral em seu arco posterior é referência crítica na instrumentação cervical alta.',
    pontos: ['Sem corpo e sem processo espinhoso', 'Articulação atlantoccipital: movimento de "sim"', 'Fratura de Jefferson'],
  },
  {
    termos: ['axis', 'dente do axis', 'processo odontoide'],
    resumo: 'A segunda vértebra cervical (C2), reconhecível pelo dente que projeta para cima.',
    localizacao: 'Abaixo do atlas, com o dente (processo odontoide) subindo para dentro do anel de C1.',
    funcao: 'Serve de pivô para a rotação da cabeça — o movimento de "não" da articulação atlantoaxial mediana.',
    vascularizacao: 'Ramos das artérias vertebrais.',
    inervacao: 'Nervo occipital maior (C2) emerge entre C1 e C2, atrás.',
    relacoes: 'O dente é mantido em posição pelo ligamento transverso do atlas, à sua frente fica o arco anterior de C1 e atrás, a medula.',
    clinica:
      'As fraturas do dente (tipos I, II e III) são as mais comuns da coluna cervical alta, e o tipo II tem alta taxa de pseudartrose. Na artrite reumatoide, a frouxidão do ligamento transverso produz subluxação atlantoaxial, com risco de compressão medular na intubação.',
    pontos: ['Dente do áxis = pivô da rotação', 'Fratura do dente tipo II tem má consolidação', 'Instabilidade atlantoaxial na artrite reumatoide'],
  },
  {
    termos: ['forame transverso'],
    resumo: 'Abertura no processo transverso das vértebras cervicais.',
    localizacao: 'Presente em todas as sete cervicais, de C1 a C7.',
    funcao: 'Dá passagem à artéria vertebral (que entra em C6 e sobe até C1), à veia vertebral e a fibras simpáticas.',
    clinica: 'A artéria vertebral não passa pelo forame de C7 na maioria das pessoas. Fratura cervical que envolve o forame transverso obriga a investigar dissecção da artéria vertebral com angiotomografia.',
    pontos: ['Exclusivo das vértebras cervicais', 'Artéria vertebral entra em C6', 'Fratura obriga investigar dissecção vertebral'],
  },
  {
    termos: ['fovea costal', 'foveas costais'],
    resumo: 'Superfícies articulares das vértebras torácicas para as costelas.',
    localizacao:
      'As fóveas costais superior e inferior estão nas bordas do corpo vertebral e recebem a cabeça da costela; a fóvea costal do processo transverso recebe o tubérculo costal.',
    funcao: 'Formam as articulações costovertebral e costotransversária, que definem o eixo de rotação da costela na respiração.',
    clinica:
      'A orientação dessas articulações determina o movimento em "alça de balde" das costelas inferiores e em "braço de bomba" das superiores, o que explica a expansão torácica em dois planos durante a inspiração.',
    pontos: ['Fóveas do corpo recebem a cabeça da costela', 'Fóvea do processo transverso recebe o tubérculo', 'Definem o eixo do movimento respiratório costal'],
  },
  {
    termos: ['promontorio'],
    resumo: 'Borda anterior saliente do corpo da primeira vértebra sacral.',
    localizacao: 'Na transição lombossacral, projetando-se para dentro da entrada da pelve.',
    funcao: 'Define o limite posterior do estreito superior da pelve.',
    clinica:
      'É o ponto de referência do conjugado diagonal na pelvimetria clínica — a distância entre o promontório e a borda inferior da sínfise púbica, da qual se estima o conjugado obstétrico. Também é reparo de acesso na cirurgia pélvica e na sacrocolpopexia.',
    pontos: ['Limite posterior do estreito superior da pelve', 'Conjugado diagonal na pelvimetria', 'Reparo cirúrgico pélvico'],
  },
  {
    termos: ['hiato sacral'],
    resumo: 'Abertura na extremidade inferior do canal sacral, resultante da ausência das lâminas de S5.',
    localizacao: 'Na face posterior do sacro, entre os cornos sacrais, acima da articulação sacrococcígea.',
    funcao: 'Marca o fim do canal sacral, fechado pelo ligamento sacrococcígeo posterior.',
    clinica: 'É a via de acesso da anestesia peridural caudal, muito usada em pediatria e em procedimentos perineais; os cornos sacrais são os reparos palpáveis para a punção.',
    pontos: ['Ausência das lâminas de S5', 'Via da peridural caudal', 'Cornos sacrais como reparo'],
  },
  {
    termos: ['sacro'],
    resumo: 'Osso triangular formado pela fusão das cinco vértebras sacrais, encaixado entre os ossos do quadril.',
    localizacao: 'Na parte posterior da pelve, articulando-se acima com L5, lateralmente com os ílios (articulações sacroilíacas) e abaixo com o cóccix.',
    funcao: 'Transmite o peso do tronco para o cíngulo do membro inferior e forma a parede posterior da pelve.',
    vascularizacao: 'Artérias sacrais mediana e laterais.',
    inervacao: 'Raízes sacrais emergem pelos forames sacrais anteriores e posteriores, formando o plexo sacral.',
    clinica:
      'As fraturas do sacro classificam-se pelas zonas de Denis conforme a relação com os forames, e as zonas mediais têm maior risco neurológico. A articulação sacroilíaca é causa frequente e subdiagnosticada de dor lombar baixa.',
    pontos: ['Cinco vértebras fundidas', 'Forames sacrais dão passagem às raízes', 'Zonas de Denis nas fraturas'],
  },

  /* ═══════════════════════ Tórax ósseo ═══════════════════════ */
  {
    termos: ['manubrio'],
    resumo: 'A porção superior do esterno, articulada com a clavícula e com a primeira costela.',
    localizacao: 'Acima do corpo do esterno, com a incisura jugular no alto e as incisuras claviculares nas laterais.',
    funcao: 'Ancora o cíngulo do membro superior ao esqueleto axial pela articulação esternoclavicular e protege os grandes vasos da base do pescoço.',
    relacoes: 'Atrás dele passam o arco da aorta e seus ramos, a veia braquiocefálica esquerda e o timo (no jovem).',
    clinica:
      'A incisura jugular é reparo palpável da traqueia. O ângulo do esterno, na junção manúbrio-corpo, marca a 2ª costela e o plano transverso do tórax — nível da bifurcação da traqueia e do início e fim do arco aórtico.',
    pontos: ['Incisura jugular e incisuras claviculares', 'Ângulo do esterno marca a 2ª costela e T4–T5', 'Grandes vasos por trás'],
  },
  {
    termos: ['processo xifoide'],
    resumo: 'A extremidade inferior e cartilaginosa do esterno, que ossifica com a idade.',
    localizacao: 'Abaixo do corpo do esterno, na junção com as cartilagens costais inferiores.',
    funcao: 'Ponto de inserção do diafragma, do reto do abdome e da linha alba.',
    clinica:
      'É o reparo para posicionar as mãos na compressão torácica: dois dedos acima dele, para não fraturá-lo e lacerar o fígado. Também marca o ápice do ângulo infraesternal e o ponto de punção pericárdica subxifóidea.',
    pontos: ['Inserção do diafragma e do reto do abdome', 'Referência da RCP e da pericardiocentese', 'Ossifica com a idade'],
  },
  {
    termos: ['cabeca da costela', 'colo da costela', 'tuberculo da costela', 'angulo da costela', 'sulco da costela'],
    resumo: 'Partes da costela típica: cabeça (articula com os corpos vertebrais), colo, tubérculo (articula com o processo transverso), ângulo e corpo com o sulco costal.',
    localizacao:
      'A cabeça articula-se com as fóveas costais de duas vértebras e o disco entre elas; o tubérculo, com a fóvea do processo transverso; o ângulo é a curvatura mais acentuada, e o sulco corre na margem inferior da face interna.',
    funcao: 'A dupla articulação define um eixo fixo de rotação, transformando a contração dos intercostais em aumento dos diâmetros do tórax.',
    vascularizacao: 'Artérias intercostais posteriores (aorta) e anteriores (torácica interna).',
    inervacao: 'Nervos intercostais, que correm no sulco costal junto com a veia e a artéria.',
    relacoes: 'No sulco costal, a ordem de cima para baixo é Veia, Artéria, Nervo — o mnemônico VAN.',
    clinica:
      'A punção e a drenagem torácica passam rente à borda superior da costela inferior, justamente para escapar do feixe VAN. O bloqueio intercostal é feito no ângulo da costela, onde o nervo ainda está bem abrigado no sulco.',
    pontos: ['Cabeça → corpos vertebrais; tubérculo → processo transverso', 'Sulco costal contém Veia, Artéria e Nervo (VAN)', 'Puncionar sempre pela borda superior da costela inferior'],
  },
  {
    termos: ['costela', 'costelas'],
    resumo: 'Arcos ósseos que formam a parede lateral do tórax — doze pares, articulados atrás com as vértebras torácicas.',
    localizacao:
      'Da 1ª à 7ª são verdadeiras (cartilagem própria até o esterno), da 8ª à 10ª são falsas (cartilagem ligada à de cima) e a 11ª e a 12ª são flutuantes, sem articulação anterior.',
    funcao: 'Protegem as vísceras torácicas e servem de alavanca para os músculos respiratórios, mudando os diâmetros do tórax a cada ciclo.',
    vascularizacao: 'Artérias intercostais posteriores e anteriores; a medula óssea das costelas é hematopoética no adulto.',
    inervacao: 'Nervos intercostais correspondentes.',
    clinica:
      'Fratura das costelas 1 e 2 indica trauma de altíssima energia (procurar lesão de grandes vasos e plexo braquial). Fratura das costelas 9 a 12 à direita sugere lesão hepática; à esquerda, esplênica. O tórax instável (flail chest) surge quando três ou mais costelas fraturam em dois pontos.',
    pontos: ['7 verdadeiras, 3 falsas, 2 flutuantes', 'Costelas altas = trauma grave; baixas = lesão visceral', 'Tórax instável e respiração paradoxal'],
  },

  /* ═══════════════════════ Membro superior — ossos ═══════════════════════ */
  {
    termos: ['clavicula'],
    resumo: 'Osso longo em S que liga o esterno à escápula, o único elo ósseo entre o membro superior e o esqueleto axial.',
    localizacao: 'Subcutânea em toda a sua extensão, entre a incisura jugular e o acrômio.',
    funcao:
      'Mantém o ombro afastado do tórax, dando ao membro superior o seu arco de movimento, e transmite forças do membro ao esqueleto axial.',
    vascularizacao: 'Artéria supraescapular e toracoacromial.',
    inervacao: 'Nervos supraclaviculares (C3–C4) para a pele suprajacente.',
    relacoes: 'Abaixo dela passam a veia e a artéria subclávias e o plexo braquial — daí a referência infraclavicular na punção venosa central.',
    clinica:
      'É um dos ossos que mais fratura, tipicamente no terço médio, com o fragmento medial elevado pelo esternocleidomastóideo. É o primeiro osso a ossificar e o último a completar a ossificação. Sua relação com os vasos subclávios exige atenção nas fraturas desviadas.',
    pontos: ['Único elo ósseo com o esqueleto axial', 'Fratura no terço médio é a mais comum', 'Vasos subclávios e plexo braquial logo abaixo'],
  },
  {
    termos: ['escapula'],
    resumo: 'Osso triangular e plano que desliza sobre a parede torácica posterior.',
    localizacao:
      'Entre a 2ª e a 7ª costela, com a espinha da escápula dividindo a face posterior em fossas supraespinal e infraespinal, e terminando lateralmente no acrômio.',
    funcao: 'Serve de base móvel para a articulação glenoumeral, ampliando muito o arco do ombro pelo ritmo escapuloumeral.',
    vascularizacao: 'Rede anastomótica escapular: artérias supraescapular, circunflexa da escápula e dorsal da escápula.',
    inervacao: 'Nervos supraescapular, dorsal da escápula, torácico longo e subescapulares comandam os músculos que a movem.',
    relacoes: 'A cavidade glenoidal recebe a cabeça do úmero; o processo coracoide dá inserção a bíceps curto, coracobraquial e peitoral menor.',
    clinica:
      'A escápula alada denuncia lesão do nervo torácico longo (serrátil anterior) ou do dorsal da escápula (romboides). A rica anastomose escapular permite ligar a subclávia com preservação do fluxo distal.',
    pontos: ['Ritmo escapuloumeral amplia o arco do ombro', 'Ângulo inferior projeta-se em T7', 'Escápula alada = nervo torácico longo'],
  },
  {
    termos: ['acromio'],
    resumo: 'Processo achatado que continua a espinha da escápula e forma o teto do ombro.',
    localizacao: 'Na parte superolateral da escápula, articulando-se com a extremidade acromial da clavícula.',
    funcao: 'Forma, com o processo coracoide e o ligamento coracoacromial, o arco coracoacromial — o teto sob o qual desliza o supraespinal. Dá inserção ao deltoide e ao trapézio.',
    clinica:
      'A síndrome do impacto (impingement) comprime o supraespinal e a bolsa subacromial contra esse arco; a acromioplastia amplia o espaço. A luxação acromioclavicular produz o sinal da tecla.',
    pontos: ['Forma o arco coracoacromial', 'Impacto subacromial e tendinopatia do supraespinal', 'Articulação acromioclavicular'],
  },
  {
    termos: ['processo coracoide', 'coracoide'],
    resumo: 'Projeção em forma de bico de corvo, na face anterior da escápula.',
    localizacao: 'Abaixo da clavícula, palpável no sulco deltopeitoral, sob a borda anterior do deltoide.',
    funcao: 'Ancora o peitoral menor, a cabeça curta do bíceps braquial, o coracobraquial e os ligamentos coracoclaviculares e coracoacromial.',
    clinica:
      'É chamado o "farol do ombro" pela sua constância como reparo cirúrgico e de bloqueio infraclavicular do plexo braquial. Na cirurgia de Latarjet, é transferido para a borda anterior da glenoide para tratar instabilidade recidivante.',
    pontos: ['Três músculos e dois ligamentos', 'Reparo do bloqueio infraclavicular', 'Transferência na cirurgia de Latarjet'],
  },
  {
    termos: ['umero'],
    resumo: 'Osso longo do braço, entre o ombro e o cotovelo.',
    localizacao:
      'Cabeça articulada na glenoide; tubérculos maior e menor separados pelo sulco intertubercular; colo cirúrgico abaixo deles; diáfise com o sulco do nervo radial atrás; e distalmente, tróclea, capítulo e epicôndilos.',
    funcao: 'Alavanca principal do braço, ancorando o manguito rotador em cima e os flexores e extensores do antebraço embaixo.',
    vascularizacao: 'Artérias circunflexas umerais anterior e posterior em cima e artéria braquial profunda na diáfise.',
    inervacao: 'Nervo axilar contorna o colo cirúrgico; nervo radial percorre o sulco radial; nervo ulnar passa atrás do epicôndilo medial.',
    relacoes: 'O tendão da cabeça longa do bíceps corre no sulco intertubercular; o manguito rotador se insere nos tubérculos.',
    clinica:
      'Cada nível de fratura tem seu nervo em risco: colo cirúrgico → nervo axilar; diáfise → nervo radial (mão caída); supracondilar (criança) → artéria braquial e nervo mediano; epicôndilo medial → nervo ulnar.',
    pontos: [
      'Colo cirúrgico + nervo axilar',
      'Sulco do nervo radial na diáfise',
      'Fratura supracondilar da criança ameaça a artéria braquial',
    ],
  },
  {
    termos: ['epicondilo medial'],
    resumo: 'Saliência medial da extremidade distal do úmero, origem comum dos flexores do antebraço.',
    localizacao: 'Palpável na face medial do cotovelo, com o nervo ulnar correndo em seu sulco posterior.',
    funcao: 'Dá origem à massa comum dos flexores e pronadores e ao ligamento colateral ulnar.',
    clinica:
      'A epicondilite medial é o "cotovelo de golfista". O nervo ulnar logo atrás é o que produz o choque ao bater o cotovelo e é o alvo da neuropatia compressiva. Na criança, a fratura por avulsão do epicôndilo medial é comum e pode encarcerar o fragmento na articulação.',
    pontos: ['Origem comum dos flexores', 'Nervo ulnar no sulco posterior', 'Epicondilite medial / cotovelo de golfista'],
  },
  {
    termos: ['epicondilo lateral'],
    resumo: 'Saliência lateral da extremidade distal do úmero, origem comum dos extensores do antebraço.',
    localizacao: 'Palpável na face lateral do cotovelo, acima do capítulo.',
    funcao: 'Dá origem à massa comum dos extensores e supinadores e ao ligamento colateral radial.',
    clinica:
      'A epicondilite lateral (cotovelo de tenista) é a tendinopatia mais comum do cotovelo e envolve sobretudo o extensor radial curto do carpo. A dor piora à extensão resistida do punho.',
    pontos: ['Origem comum dos extensores', 'Epicondilite lateral / cotovelo de tenista', 'Extensor radial curto do carpo como tendão-chave'],
  },
  {
    termos: ['troclea do umero', 'troclea'],
    resumo: 'Superfície articular em carretel na extremidade distal do úmero, para a incisura troclear da ulna.',
    localizacao: 'Medialmente ao capítulo, na face distal do úmero.',
    funcao: 'Forma a articulação umeroulnar, um gínglimo puro que permite apenas flexão e extensão do cotovelo.',
    clinica: 'A congruência da tróclea com a incisura troclear é o que dá estabilidade ao cotovelo em extensão; sua lesão gera rigidez e artrose precoce.',
    pontos: ['Articula com a incisura troclear da ulna', 'Gínglimo: só flexão e extensão', 'Medial ao capítulo'],
  },
  {
    termos: ['capitulo do umero', 'capitulo'],
    resumo: 'Superfície articular esférica lateral do úmero distal, para a cabeça do rádio.',
    localizacao: 'Lateralmente à tróclea, na face distal do úmero.',
    funcao: 'Articula-se com a fóvea da cabeça do rádio, permitindo flexo-extensão e a rotação da pronossupinação.',
    clinica: 'A osteocondrite dissecante do capítulo acomete atletas de arremesso e ginastas adolescentes; a fratura de capítulo é rara e costuma exigir fixação.',
    pontos: ['Articula com a cabeça do rádio', 'Permite pronossupinação', 'Osteocondrite dissecante em atletas jovens'],
  },
  {
    termos: ['olecrano'],
    resumo: 'Proeminência posterior da ulna proximal, o "cotovelo" propriamente dito.',
    localizacao: 'Extremidade proximal e posterior da ulna, encaixando-se na fossa do olécrano do úmero em extensão.',
    funcao: 'Recebe a inserção do tríceps braquial e trava a extensão do cotovelo.',
    clinica:
      'A fratura do olécrano separa o fragmento pela tração do tríceps e abole a extensão ativa — indicação clássica de banda de tensão. A bursite olecraniana produz aumento de volume flutuante bem localizado.',
    pontos: ['Inserção do tríceps braquial', 'Trava a extensão na fossa do olécrano', 'Fratura abole a extensão ativa'],
  },
  {
    termos: ['radio'],
    exato: true,
    resumo: 'Osso lateral do antebraço, que gira em torno da ulna na pronossupinação e sustenta a mão.',
    localizacao: 'Do capítulo do úmero, em cima, até o carpo, embaixo, com a cabeça proximal e o processo estiloide distal.',
    funcao: 'Transmite a carga da mão ao cotovelo e é a peça móvel da pronossupinação, girando sobre a ulna, que permanece relativamente fixa.',
    vascularizacao: 'Artéria radial e artéria interóssea anterior.',
    inervacao: 'Ramo interósseo posterior do nervo radial, junto ao colo, e o ramo superficial ao longo da borda lateral.',
    relacoes: 'Unido à ulna pela membrana interóssea, que transfere carga do rádio para a ulna e daí para o úmero.',
    clinica:
      'A fratura de Colles (extremidade distal com desvio dorsal) é a fratura mais comum do adulto acima dos 50 anos, típica de queda com a mão espalmada. A fratura de Monteggia associa fratura da ulna com luxação da cabeça do rádio.',
    pontos: ['Peça móvel da pronossupinação', 'Fratura de Colles: dorsal, em "dorso de garfo"', 'Processo estiloide radial é mais distal que o ulnar'],
  },
  {
    termos: ['ulna'],
    resumo: 'Osso medial do antebraço, a peça estável da articulação do cotovelo.',
    localizacao: 'Do olécrano e da incisura troclear, em cima, até a cabeça e o processo estiloide, embaixo.',
    funcao: 'Forma a articulação principal do cotovelo com a tróclea umeral e serve de eixo em torno do qual o rádio gira.',
    vascularizacao: 'Artéria ulnar e artéria interóssea anterior.',
    inervacao: 'Nervo ulnar corre medialmente, e o interósseo anterior (mediano) irriga os planos profundos.',
    relacoes: 'A cabeça da ulna articula-se com a incisura ulnar do rádio na articulação radioulnar distal, estabilizada pela fibrocartilagem triangular.',
    clinica:
      'A fratura de Galeazzi combina fratura da diáfise radial com luxação radioulnar distal; a de Monteggia, fratura da ulna com luxação da cabeça do rádio. A variância ulnar positiva predispõe à síndrome do impacto ulnocarpal.',
    pontos: ['Peça estável do cotovelo', 'Monteggia (ulna) x Galeazzi (rádio)', 'Cabeça da ulna é distal; a do rádio é proximal'],
  },
  {
    termos: ['escafoide'],
    resumo: 'Osso da fileira proximal do carpo, o mais lateral, ponte entre as duas fileiras.',
    localizacao: 'No assoalho da tabaqueira anatômica, palpável entre os tendões do abdutor longo/extensor curto do polegar e o extensor longo do polegar.',
    funcao: 'Estabiliza e coordena o movimento entre as fileiras proximal e distal do carpo.',
    vascularizacao:
      'Recebe sangue por ramos da artéria radial que entram predominantemente pelo seu polo distal, de modo que o fluxo para o polo proximal é retrógrado.',
    clinica:
      'É o osso do carpo que mais fratura. Dor na tabaqueira após queda com a mão espalmada obriga a imobilizar e repetir a radiografia em 10–14 dias, mesmo com exame inicial normal, porque o traço pode não aparecer. O fluxo retrógrado explica a necrose avascular do polo proximal.',
    pontos: ['Fratura mais comum do carpo', 'Dor na tabaqueira anatômica', 'Necrose avascular do polo proximal por fluxo retrógrado'],
  },
  {
    termos: ['semilunar'],
    resumo: 'Osso central da fileira proximal do carpo, entre o escafoide e o piramidal.',
    localizacao: 'Articula-se acima com o rádio, sendo o osso do carpo mais frequentemente luxado.',
    funcao: 'Transmite carga do rádio para a fileira distal do carpo.',
    clinica:
      'A doença de Kienböck é a osteonecrose do semilunar, associada à variância ulnar negativa. A luxação do semilunar (com o sinal do "copo derramado" no perfil) pode comprimir o nervo mediano.',
    pontos: ['Osso do carpo mais luxado', 'Doença de Kienböck', 'Luxação comprime o nervo mediano'],
  },
  {
    termos: ['pisiforme'],
    resumo: 'Pequeno osso sesamoide da fileira proximal do carpo, no tendão do flexor ulnar do carpo.',
    localizacao: 'Face palmar e ulnar do punho, facilmente palpável na base da eminência hipotenar.',
    funcao: 'Aumenta o braço de alavanca do flexor ulnar do carpo.',
    relacoes: 'Forma, com o hâmulo do hamato, o canal de Guyon, por onde passam o nervo e a artéria ulnares.',
    clinica: 'É reparo palpável para localizar o canal de Guyon; a compressão do nervo ulnar aí (ciclistas, trauma repetitivo) causa fraqueza dos intrínsecos com sensibilidade dorsal preservada.',
    pontos: ['Sesamoide no flexor ulnar do carpo', 'Limite do canal de Guyon', 'Reparo palpável do punho ulnar'],
  },
  {
    termos: ['hamato', 'hamulo do hamato'],
    resumo: 'Osso da fileira distal do carpo, reconhecível pelo seu hâmulo em gancho.',
    localizacao: 'No lado ulnar da fileira distal, com o hâmulo projetando-se palmarmente.',
    funcao: 'Articula-se com o 4º e o 5º metacarpos e ancora o retináculo dos flexores.',
    relacoes: 'O hâmulo forma a parede lateral do canal de Guyon e o pilar ulnar do túnel do carpo.',
    clinica: 'A fratura do hâmulo do hamato ocorre em esportes de raquete e golfe e pode lesar o nervo ulnar; costuma ser invisível na radiografia simples e exigir tomografia.',
    pontos: ['Hâmulo forma o túnel do carpo e o canal de Guyon', 'Fratura em esportes de bastão', 'Risco para o nervo ulnar'],
  },
  {
    termos: ['tunel do carpo'],
    classe: 'passagem-ossea',
    resumo: 'Canal osteofibroso na face palmar do punho, fechado pelo retináculo dos flexores.',
    localizacao: 'Entre os pilares ósseos — escafoide e trapézio lateralmente, pisiforme e hâmulo do hamato medialmente — com o retináculo dos flexores como teto.',
    funcao: 'Conduz nove tendões flexores (quatro do flexor superficial, quatro do profundo e o flexor longo do polegar) e o nervo mediano.',
    relacoes: 'O nervo mediano é a estrutura mais superficial dentro do túnel, logo abaixo do retináculo — e por isso a primeira a sofrer com o aumento de pressão.',
    clinica:
      'A síndrome do túnel do carpo é a neuropatia compressiva mais comum: parestesia nos três primeiros dedos e metade radial do anular, com piora noturna e atrofia tenar tardia. Os testes de Phalen e Tinel apoiam o diagnóstico. A sensibilidade da eminência tenar é poupada porque o ramo cutâneo palmar passa por fora do túnel.',
    pontos: [
      '9 tendões + nervo mediano',
      'Poupa a sensibilidade da eminência tenar (ramo cutâneo palmar passa por fora)',
      'Phalen, Tinel e atrofia tenar',
    ],
  },

  /* ═══════════════════════ Membro inferior — ossos ═══════════════════════ */
  {
    termos: ['ilio', 'asa do ilio', 'crista iliaca'],
    resumo: 'A maior das três peças do osso do quadril, formando a asa larga da pelve.',
    localizacao: 'Superiormente no osso do quadril, com a crista ilíaca no alto e as espinhas ilíacas anterior e posterior nas extremidades.',
    funcao: 'Ancora os músculos abdominais, glúteos e o ilíaco, e transmite a carga do tronco ao membro inferior pela articulação sacroilíaca.',
    vascularizacao: 'Artérias ilíacas circunflexas profunda e superficial e glútea superior.',
    inervacao: 'Nervos ílio-hipogástrico, ilioinguinal e cutâneo femoral lateral, que cruza junto à espinha ilíaca anterossuperior.',
    clinica:
      'A crista ilíaca é o sítio clássico de coleta de enxerto ósseo e de punção de medula. A linha entre as cristas cruza a coluna em L4, guiando a punção lombar. A compressão do nervo cutâneo femoral lateral junto à espinha ilíaca anterossuperior causa meralgia parestésica.',
    pontos: ['Crista ilíaca cruza L4 — referência da punção lombar', 'Sítio de enxerto ósseo e punção medular', 'Meralgia parestésica na espinha ilíaca anterossuperior'],
  },
  {
    termos: ['isquio', 'tuber isquiatico', 'espinha isquiatica'],
    resumo: 'Peça posteroinferior do osso do quadril, sobre a qual nos sentamos.',
    localizacao: 'Inferoposteriormente no osso do quadril, com o túber isquiático embaixo e a espinha isquiática entre as incisuras isquiáticas maior e menor.',
    funcao: 'Suporta o peso na posição sentada e dá origem aos isquiotibiais e a parte do adutor magno.',
    inervacao: 'Nervo pudendo contorna a espinha isquiática ao voltar para o períneo.',
    clinica:
      'A espinha isquiática é o reparo palpável pelo toque vaginal para o bloqueio do nervo pudendo e é o ponto de referência do plano zero de De Lee na avaliação da descida fetal. A avulsão do túber isquiático acomete atletas adolescentes.',
    pontos: ['Espinha isquiática: bloqueio do pudendo e plano 0 de De Lee', 'Túber isquiático: origem dos isquiotibiais', 'Suporta o peso sentado'],
  },
  {
    termos: ['pubis', 'sinfise pubica', 'tuberculo pubico'],
    resumo: 'Peça anterior do osso do quadril, que se une à do lado oposto na sínfise púbica.',
    localizacao: 'Na parte anterior da pelve, com corpo, ramo superior e ramo inferior delimitando o forame obturado.',
    funcao: 'Fecha o anel pélvico à frente e dá inserção aos adutores, ao reto do abdome e ao ligamento inguinal.',
    clinica:
      'O tubérculo púbico é o reparo que diferencia a hérnia inguinal (acima e medial a ele) da femoral (abaixo e lateral). A diástase da sínfise integra as fraturas em livro aberto da pelve, com risco de sangramento maciço do plexo venoso pélvico.',
    pontos: ['Tubérculo púbico diferencia hérnia inguinal de femoral', 'Sínfise púbica é articulação cartilagínea', 'Fratura em livro aberto e sangramento pélvico'],
  },
  {
    termos: ['acetabulo', 'limbo do acetabulo', 'fossa do acetabulo'],
    resumo: 'Cavidade esférica na face lateral do osso do quadril, formada pela fusão de ílio, ísquio e púbis.',
    localizacao: 'Na face lateral do osso do quadril, voltada lateral, anterior e inferiormente, com a incisura acetabular embaixo.',
    funcao: 'Recebe a cabeça do fêmur; sua profundidade e a orientação são o que dá ao quadril estabilidade muito maior que a do ombro.',
    clinica:
      'A displasia do desenvolvimento do quadril é a cobertura acetabular insuficiente, rastreada com as manobras de Ortolani e Barlow no recém-nascido. As fraturas de acetábulo seguem a classificação de Judet-Letournel pelas colunas anterior e posterior.',
    pontos: ['Fusão de ílio, ísquio e púbis na cartilagem trirradiada', 'Lábio acetabular aprofunda a cavidade', 'Displasia do desenvolvimento e manobras de Ortolani/Barlow'],
  },
  {
    termos: ['femur'],
    exato: true,
    resumo: 'O osso mais longo e resistente do corpo, do quadril ao joelho.',
    localizacao:
      'Cabeça no acetábulo, colo em ângulo de inclinação com a diáfise, trocanteres maior e menor na junção, diáfise levemente arqueada e côndilos medial e lateral distalmente.',
    funcao: 'Transmite todo o peso do tronco ao joelho e serve de alavanca para os músculos mais potentes do corpo.',
    vascularizacao:
      'Artéria circunflexa femoral medial, principal fonte da cabeça do fêmur, com a artéria do ligamento da cabeça contribuindo pouco no adulto; perfurantes da femoral profunda na diáfise.',
    inervacao: 'Nervos femoral, obturatório e isquiático inervam os compartimentos que o cercam.',
    clinica:
      'A fratura do colo é intracapsular e interrompe a circunflexa femoral medial, com alto risco de necrose avascular — daí a artroplastia como conduta frequente no idoso. A fratura de diáfise sangra volumes que justificam choque hipovolêmico.',
    pontos: [
      'Colo intracapsular: risco de necrose avascular',
      'Circunflexa femoral medial é a principal irrigação da cabeça',
      'Fratura de diáfise pode causar choque hipovolêmico',
    ],
  },
  {
    termos: ['cabeca do femur', 'fovea da cabeca do femur'],
    resumo: 'Extremidade proximal esférica do fêmur, que se encaixa no acetábulo.',
    localizacao: 'Dentro do acetábulo, revestida por cartilagem, exceto na fóvea, onde se insere o ligamento da cabeça do fêmur.',
    funcao: 'Forma a articulação coxofemoral, esferóidea, que permite movimento em três eixos com grande estabilidade.',
    vascularizacao: 'Ramos retinaculares da artéria circunflexa femoral medial, ascendendo pelo colo; contribuição menor pela artéria do ligamento da cabeça.',
    clinica:
      'A necrose avascular da cabeça femoral segue fratura do colo, luxação, uso de corticoide e anemia falciforme. Na criança, a doença de Legg-Calvé-Perthes é a osteonecrose idiopática da cabeça.',
    pontos: ['Irrigação ascendente e vulnerável', 'Necrose avascular pós-fratura do colo', 'Perthes na infância'],
  },
  {
    termos: ['trocanter maior', 'trocanter menor'],
    resumo: 'Saliências na junção do colo com a diáfise femoral, onde se inserem os músculos do quadril.',
    localizacao: 'O trocanter maior é lateral e palpável; o menor é posteromedial e não é palpável.',
    funcao: 'O maior recebe glúteo médio, glúteo mínimo e os rotadores curtos; o menor recebe o iliopsoas.',
    clinica:
      'A dor sobre o trocanter maior sugere síndrome dolorosa do trocanter (antiga bursite trocantérica). As fraturas transtrocantéricas são extracapsulares, sangram mais que as do colo, mas preservam a irrigação da cabeça.',
    pontos: ['Maior: glúteos médio e mínimo', 'Menor: iliopsoas', 'Fratura transtrocantérica é extracapsular'],
  },
  {
    termos: ['patela'],
    resumo: 'O maior osso sesamoide do corpo, dentro do tendão do quadríceps.',
    localizacao: 'À frente do joelho, deslizando na tróclea femoral, ancorada abaixo pelo ligamento patelar até a tuberosidade da tíbia.',
    funcao:
      'Aumenta o braço de alavanca do quadríceps em cerca de 30%, tornando a extensão do joelho muito mais eficiente, e protege a articulação anteriormente.',
    vascularizacao: 'Rede anastomótica peripatelar, formada pelas artérias geniculares.',
    clinica:
      'A luxação patelar é quase sempre lateral, favorecida pelo ângulo Q aumentado. A fratura transversa separa os fragmentos pela tração do quadríceps e abole a extensão ativa. A síndrome femoropatelar é a causa mais comum de dor anterior do joelho no jovem.',
    pontos: ['Aumenta o braço de alavanca do quadríceps', 'Luxação é lateral', 'Fratura abole a extensão ativa'],
  },
  {
    termos: ['tibia'],
    exato: true,
    resumo: 'Osso medial e de sustentação da perna, o segundo mais longo do corpo.',
    localizacao:
      'Do platô tibial, que recebe os côndilos femorais, até o maléolo medial. Sua face anteromedial é subcutânea em toda a extensão — a "canela".',
    funcao: 'Transmite praticamente toda a carga do joelho ao tornozelo; a fíbula participa com uma fração mínima.',
    vascularizacao: 'Artéria nutrícia ramo da tibial posterior, com circulação periosteal escassa na face anteromedial.',
    inervacao: 'Nervo safeno (ramo do femoral) para a pele medial da perna.',
    clinica:
      'A fratura exposta mais comum do corpo, justamente por ser subcutânea. A tuberosidade da tíbia é o sítio da doença de Osgood-Schlatter no adolescente e o local da punção intraóssea de emergência, 2 cm abaixo e medial à tuberosidade.',
    pontos: ['Face anteromedial subcutânea: fratura exposta frequente', 'Punção intraóssea abaixo da tuberosidade', 'Osgood-Schlatter no adolescente'],
  },
  {
    termos: ['fibula'],
    resumo: 'Osso lateral e fino da perna, com função quase exclusivamente de inserção e estabilização.',
    localizacao: 'Lateralmente à tíbia, da cabeça (abaixo do joelho) ao maléolo lateral, unida por membrana interóssea e sindesmose tibiofibular distal.',
    funcao: 'Serve de origem aos músculos fibulares e à musculatura lateral e posterior da perna, e o maléolo lateral estabiliza o tornozelo.',
    vascularizacao: 'Artéria fibular.',
    inervacao: 'O nervo fibular comum contorna o colo da fíbula logo abaixo da cabeça, onde é superficial e vulnerável.',
    clinica:
      'A fratura do colo da fíbula, ou a compressão por gesso ou posicionamento cirúrgico, lesa o nervo fibular comum e produz pé caído com perda da sensibilidade dorsal do pé. É o osso doador clássico de enxerto vascularizado.',
    pontos: ['Nervo fibular comum no colo — pé caído', 'Sustenta pouca carga', 'Osso doador de enxerto vascularizado'],
  },
  {
    termos: ['talus', 'sustentaculo do talus'],
    resumo: 'Osso do tarso que recebe todo o peso do corpo vindo da perna e o distribui para o pé.',
    localizacao: 'Encaixado entre os maléolos, sobre o calcâneo, articulando-se à frente com o navicular.',
    funcao: 'Distribui a carga da tíbia para o retropé e o antepé; não tem nenhuma inserção muscular, o que é único no corpo.',
    vascularizacao: 'Irrigação frágil e em grande parte retrógrada, por ramos da artéria tibial posterior, dorsal do pé e fibular, com o seio do tarso como porta de entrada.',
    clinica:
      'A ausência de inserções musculares e a irrigação retrógrada explicam a alta taxa de necrose avascular após fratura do colo do tálus (classificação de Hawkins). O sustentáculo do tálus sustenta o tálus e é atravessado pelo tendão do flexor longo do hálux.',
    pontos: ['Nenhum músculo se insere nele', 'Necrose avascular após fratura do colo', 'Distribui carga para retropé e antepé'],
  },
  {
    termos: ['calcaneo'],
    resumo: 'O maior osso do tarso, que forma o calcanhar.',
    localizacao: 'Abaixo do tálus, com a tuberosidade posterior recebendo o tendão do calcâneo.',
    funcao: 'Serve de alavanca para o tríceps sural na propulsão e sustenta o arco longitudinal medial pela aponeurose plantar.',
    vascularizacao: 'Ramos calcâneos das artérias tibial posterior e fibular.',
    inervacao: 'Ramos calcâneos do nervo tibial e do nervo sural.',
    clinica:
      'A fratura do calcâneo tipicamente resulta de queda de altura e obriga a procurar fratura de coluna lombar associada. A fasciíte plantar dói na inserção medial da aponeurose na tuberosidade, com piora aos primeiros passos do dia.',
    pontos: ['Fratura por queda de altura → investigar coluna lombar', 'Inserção do tendão do calcâneo', 'Fasciíte plantar na tuberosidade medial'],
  },

  /* ═══════════════════════ Articulações e ligamentos ═══════════════════════ */
  {
    termos: ['articulacao temporomandibular'],
    resumo: 'Única articulação sinovial móvel do crânio, entre a cabeça da mandíbula e a fossa mandibular do temporal.',
    localizacao: 'À frente do meato acústico externo, palpável durante a abertura da boca; contém um disco articular que a divide em dois compartimentos.',
    funcao:
      'Faz dois movimentos distintos: rotação no compartimento inferior (abertura inicial) e translação no superior (abertura ampla), com o disco acompanhando a cabeça da mandíbula.',
    vascularizacao: 'Artérias temporal superficial e maxilar.',
    inervacao: 'Nervos auriculotemporal e massetérico, ramos de V3.',
    clinica:
      'A disfunção temporomandibular é causa muito frequente de dor facial, com estalido pelo deslocamento do disco. A luxação anterior trava a boca aberta e é reduzida pela manobra de Nélaton, com os polegares sobre os molares inferiores.',
    pontos: ['Disco divide em compartimentos de rotação e translação', 'Inervação por V3 (auriculotemporal)', 'Luxação anterior e manobra de redução'],
  },
  {
    termos: ['articulacao glenoumeral'],
    resumo: 'Articulação esferóidea entre a cabeça do úmero e a cavidade glenoidal da escápula.',
    localizacao: 'Entre a cabeça umeral, grande e esférica, e a glenoide, rasa e pequena, aprofundada pelo lábio glenoidal.',
    funcao: 'A articulação mais móvel do corpo, permitindo movimento em três eixos com amplitude máxima ao custo de estabilidade óssea mínima.',
    vascularizacao: 'Artérias circunflexas umerais anterior e posterior e supraescapular.',
    inervacao: 'Nervos axilar, supraescapular e peitoral lateral — a lei de Hilton em ação: quem move a articulação também a inerva.',
    relacoes: 'A cápsula é frouxa inferiormente para permitir a abdução, e é justamente por aí que a cabeça escapa nas luxações.',
    clinica:
      'É a articulação que mais luxa no corpo, e mais de 95% das luxações são anteroinferiores. A checagem do nervo axilar (sensibilidade sobre o deltoide) é obrigatória antes e depois da redução. A lesão de Bankart (lábio) e a de Hill-Sachs (cabeça umeral) explicam a recidiva.',
    pontos: ['Mais móvel e mais instável do corpo', 'Luxação anteroinferior; checar nervo axilar', 'Manguito rotador é o estabilizador dinâmico'],
  },
  {
    termos: ['labio glenoidal'],
    resumo: 'Anel fibrocartilaginoso que circunda e aprofunda a cavidade glenoidal.',
    localizacao: 'Na margem da glenoide, contínuo acima com o tendão da cabeça longa do bíceps braquial.',
    funcao: 'Aumenta a área e a profundidade da glenoide em cerca de 50%, criando um efeito de sucção que ajuda a conter a cabeça umeral.',
    clinica:
      'A lesão de Bankart é a avulsão do lábio anteroinferior na luxação anterior, e é o principal fator de recidiva. A lesão SLAP acomete o lábio superior na inserção do bíceps, típica de atletas de arremesso.',
    pontos: ['Aprofunda a glenoide e cria efeito de sucção', 'Lesão de Bankart na luxação anterior', 'Lesão SLAP em atletas de arremesso'],
  },
  {
    termos: ['ligamento cruzado anterior'],
    resumo: 'Ligamento intracapsular do joelho que impede o deslocamento anterior da tíbia sobre o fêmur.',
    localizacao: 'Da área intercondilar anterior da tíbia até a face medial do côndilo lateral do fêmur, cruzando o cruzado posterior.',
    funcao: 'Freia a translação anterior da tíbia e limita a rotação interna, sendo o principal estabilizador rotacional do joelho.',
    vascularizacao: 'Artéria genicular média — irrigação escassa, que explica a má cicatrização e a indicação frequente de reconstrução.',
    clinica:
      'A ruptura ocorre em desaceleração com rotação, com estalido audível e hemartrose precoce. Testes de Lachman (o mais sensível), gaveta anterior e pivot shift. Integra a tríade infeliz com o menisco medial e o colateral medial.',
    pontos: ['Impede a translação anterior da tíbia', 'Teste de Lachman é o mais sensível', 'Hemartrose precoce e tríade infeliz'],
  },
  {
    termos: ['ligamento cruzado posterior'],
    resumo: 'Ligamento intracapsular mais resistente do joelho, que impede o deslocamento posterior da tíbia.',
    localizacao: 'Da área intercondilar posterior da tíbia até a face lateral do côndilo medial do fêmur.',
    funcao: 'Freia a translação posterior da tíbia e é o estabilizador central do joelho em flexão.',
    clinica:
      'Rompe-se no trauma do painel do carro (dashboard injury), com a tíbia empurrada para trás com o joelho fletido. Avaliado pelo teste da gaveta posterior e pelo sinal do sulco (sagging) da tuberosidade tibial.',
    pontos: ['Impede a translação posterior da tíbia', 'Dashboard injury', 'Mais resistente que o cruzado anterior'],
  },
  {
    termos: ['ligamento colateral medial', 'ligamento colateral tibial'],
    resumo: 'Ligamento largo na face medial do joelho, aderido ao menisco medial.',
    localizacao: 'Do epicôndilo medial do fêmur à face medial da tíbia, com fibras profundas fixadas ao menisco medial.',
    funcao: 'Resiste ao estresse em valgo e à rotação externa da tíbia.',
    clinica:
      'É o ligamento mais lesado do joelho, por trauma em valgo. Sua aderência ao menisco medial é a razão anatômica de os dois se lesarem juntos na tríade infeliz. A maioria das lesões isoladas trata-se sem cirurgia.',
    pontos: ['Resiste ao valgo', 'Aderido ao menisco medial', 'Ligamento mais lesado do joelho'],
  },
  {
    termos: ['ligamento patelar'],
    resumo: 'Continuação do tendão do quadríceps abaixo da patela, até a tuberosidade da tíbia.',
    localizacao: 'Do polo inferior da patela à tuberosidade da tíbia, superficial e facilmente palpável.',
    funcao: 'Transmite a força do quadríceps à tíbia, completando o mecanismo extensor do joelho.',
    inervacao: 'Reflexo patelar mediado pela raiz L4 (nervo femoral) — o reflexo mais pesquisado do exame neurológico.',
    clinica:
      'É o tendão percutido no reflexo patelar. A tendinopatia patelar ("joelho do saltador") acomete sua inserção proximal. Sua ruptura, como a fratura de patela, abole a extensão ativa e produz patela alta.',
    pontos: ['Reflexo patelar avalia L4', 'Joelho do saltador na inserção proximal', 'Ruptura abole a extensão ativa'],
  },
  {
    termos: ['menisco medial'],
    resumo: 'Fibrocartilagem semilunar na face medial do platô tibial, em forma de C aberto.',
    localizacao: 'Sobre o côndilo medial da tíbia, aderido à cápsula e ao ligamento colateral medial.',
    funcao: 'Aprofunda a superfície de contato, distribui carga e aumenta a congruência entre côndilo femoral e platô tibial.',
    vascularizacao: 'Apenas o terço periférico é vascularizado (zona vermelha); os dois terços internos nutrem-se do líquido sinovial.',
    clinica:
      'Por ser menos móvel (fixo ao colateral medial), lesa-se mais que o lateral. Dor na interlinha medial, bloqueio articular e testes de McMurray e Apley. Lesões da zona vermelha podem ser suturadas; as da branca costumam ser ressecadas.',
    pontos: ['Em C, aderido ao colateral medial e menos móvel', 'Mais lesado que o lateral', 'Zona vermelha sutura, zona branca ressecção'],
  },
  {
    termos: ['menisco lateral'],
    resumo: 'Fibrocartilagem quase circular sobre o platô tibial lateral, mais móvel que o medial.',
    localizacao: 'Sobre o côndilo lateral da tíbia, sem aderência ao ligamento colateral lateral, com o tendão do poplíteo separando-o da cápsula.',
    funcao: 'Distribui carga e aumenta a congruência da compartimento lateral, acompanhando o grande deslocamento do côndilo femoral lateral.',
    clinica: 'A maior mobilidade o protege: lesa-se menos que o medial. O menisco discoide, variação anatômica congênita, é quase sempre lateral e causa estalido no joelho da criança.',
    pontos: ['Quase circular e mais móvel', 'Não adere ao colateral lateral', 'Menisco discoide é tipicamente lateral'],
  },
  {
    termos: ['membrana interossea'],
    resumo: 'Lâmina fibrosa que une as diáfises de dois ossos paralelos, dividindo compartimentos.',
    localizacao: 'Entre rádio e ulna no antebraço, e entre tíbia e fíbula na perna, com fibras predominantemente oblíquas.',
    funcao:
      'Transfere carga entre os dois ossos — no antebraço, do rádio para a ulna, protegendo o punho —, aumenta a área de inserção muscular e separa os compartimentos anterior e posterior.',
    clinica:
      'A lesão de Essex-Lopresti combina fratura da cabeça do rádio com ruptura da membrana interóssea e da articulação radioulnar distal, levando à migração proximal do rádio. Na perna, é o plano das fasciotomias de quatro compartimentos.',
    pontos: ['Transfere carga entre os dois ossos', 'Separa compartimentos anterior e posterior', 'Lesão de Essex-Lopresti no antebraço'],
  },
  {
    termos: ['ligamento inguinal'],
    resumo: 'Borda inferior espessada da aponeurose do oblíquo externo, entre a espinha ilíaca anterossuperior e o tubérculo púbico.',
    localizacao: 'Na transição entre a parede abdominal e a coxa, formando o teto do canal inguinal e o limite superior do trígono femoral.',
    funcao: 'Sustenta o assoalho da parede abdominal anterior e divide o espaço entre a pelve e a coxa em lacunas muscular e vascular.',
    relacoes: 'Sob ele passam, de lateral para medial: nervo femoral, artéria femoral, veia femoral e o canal femoral com o linfonodo de Cloquet.',
    clinica:
      'É o divisor de águas das hérnias: a inguinal emerge acima e medialmente ao tubérculo púbico, a femoral abaixo e lateralmente. A hérnia femoral encarcera com muito mais frequência, pelo anel femoral rígido.',
    pontos: ['Espinha ilíaca anterossuperior → tubérculo púbico', 'Sob ele: NAVL de lateral para medial', 'Divide hérnia inguinal de femoral'],
  },

  /* ═══════════════════════ Músculos — cabeça e tronco ═══════════════════════ */
  {
    termos: ['musculo masseter'],
    resumo: 'O mais potente dos músculos da mastigação, formando o relevo do ângulo da mandíbula.',
    localizacao: 'Do arco zigomático até a face lateral do ramo e do ângulo da mandíbula; endurece sob os dedos quando se pede ao paciente para cerrar os dentes.',
    funcao: 'Eleva a mandíbula com grande força, sendo o principal responsável pela força de mordida.',
    vascularizacao: 'Artéria massetérica, ramo da artéria maxilar.',
    inervacao: 'Nervo massetérico, ramo do nervo mandibular (V3).',
    clinica:
      'A palpação bilateral durante a mordida testa a função motora de V3. A hipertrofia do masseter causa alargamento do terço inferior da face, e o trismo (dificuldade de abrir a boca) frequentemente envolve espasmo deste músculo.',
    pontos: ['Eleva a mandíbula — o músculo da força de mordida', 'Inervação por V3 (nervo massetérico)', 'Palpação testa a função motora do trigêmeo'],
  },
  {
    termos: ['musculo temporal'],
    resumo: 'Músculo em leque da fossa temporal, que passa sob o arco zigomático até o processo coronoide.',
    localizacao: 'Preenche a fossa temporal, convergindo em um tendão que passa por baixo do arco zigomático e se insere no processo coronoide da mandíbula.',
    funcao: 'Eleva a mandíbula (fibras verticais anteriores) e a retrai (fibras horizontais posteriores).',
    vascularizacao: 'Artérias temporais profundas, ramos da maxilar.',
    inervacao: 'Nervos temporais profundos (V3).',
    clinica:
      'A atrofia do temporal escava a fossa temporal e é sinal de lesão de V3 ou de desnutrição avançada. A cefaleia da arterite temporal e a dor da disfunção temporomandibular costumam ser referidas aqui.',
    pontos: ['Eleva e retrai a mandíbula', 'Tendão passa sob o arco zigomático', 'Atrofia denuncia lesão de V3'],
  },
  {
    termos: ['musculo orbicular do olho', 'musculo orbicular da boca', 'musculo zigomatico', 'musculo bucinador', 'musculo frontal', 'musculo occipitofrontal'],
    resumo: 'Músculo da expressão facial — nasce no osso ou na fáscia e se insere na pele.',
    localizacao: 'No plano subcutâneo da face, sem fáscia profunda, o que permite que a contração mova diretamente a pele.',
    funcao: 'Produz a mímica facial e controla os orifícios da face: fechamento palpebral, oclusão labial e manutenção do bolo alimentar entre os dentes.',
    vascularizacao: 'Artérias facial e temporal superficial.',
    inervacao: 'Nervo facial (VII), pelos ramos temporal, zigomático, bucal, marginal da mandíbula e cervical.',
    clinica:
      'Na paralisia facial periférica, a hemiface inteira é acometida e o paciente não fecha o olho (risco de úlcera de córnea) nem franze a testa. Na paralisia central, a testa é poupada pela inervação bilateral da parte superior do núcleo facial.',
    pontos: ['Inserção cutânea, sem fáscia profunda', 'Todos inervados pelo nervo facial (VII)', 'Periférica pega a testa; central poupa'],
  },
  {
    termos: ['musculo esternocleidomastoide', 'musculo esternocleidomastoideo'],
    resumo: 'Músculo em faixa que cruza obliquamente o pescoço, dividindo-o nos trígonos anterior e posterior.',
    localizacao: 'Do manúbrio do esterno e da extremidade medial da clavícula até o processo mastoide e a linha nucal superior.',
    funcao: 'Unilateralmente, roda a cabeça para o lado oposto e a inclina para o mesmo lado; bilateralmente, flete o pescoço e atua como músculo acessório da inspiração.',
    vascularizacao: 'Ramos das artérias occipital e tireóidea superior.',
    inervacao: 'Nervo acessório (XI) para a motricidade e ramos de C2–C3 para a propriocepção.',
    relacoes: 'Cobre a bainha carótica, com a artéria carótida comum, a veia jugular interna e o nervo vago.',
    clinica:
      'É o reparo do acesso venoso central pela jugular interna, cuja punção é feita no ápice do triângulo entre suas duas cabeças. Seu uso visível na respiração é sinal de esforço ventilatório. O torcicolo congênito resulta de sua fibrose.',
    pontos: ['Divide o pescoço em trígonos anterior e posterior', 'Nervo acessório (XI)', 'Reparo da punção de jugular interna'],
  },
  {
    termos: ['musculo trapezio'],
    resumo: 'Grande músculo triangular do dorso superior, que move a escápula em três direções.',
    localizacao: 'Da linha nucal superior, do ligamento nucal e dos processos espinhosos de C7 a T12 até a clavícula, o acrômio e a espinha da escápula.',
    funcao: 'As fibras superiores elevam a escápula, as médias a retraem e as inferiores a deprimem e ajudam na rotação superior durante a abdução do braço.',
    vascularizacao: 'Artéria transversa do pescoço (cervical transversa).',
    inervacao: 'Nervo acessório (XI), com contribuição sensitiva de C3–C4.',
    clinica:
      'A lesão do nervo acessório — clássica em biópsia de linfonodo no trígono cervical posterior — causa queda do ombro, dificuldade de abduzir acima de 90° e escápula alada discreta. Testa-se pedindo elevação dos ombros contra resistência.',
    pontos: ['Três porções com ações distintas', 'Nervo acessório (XI)', 'Lesão em cirurgia do trígono cervical posterior'],
  },
  {
    termos: ['musculo latissimo do dorso', 'musculo grande dorsal'],
    resumo: 'O músculo mais largo do corpo, que liga o tronco ao úmero.',
    localizacao: 'Da fáscia toracolombar, dos processos espinhosos de T7 ao sacro, da crista ilíaca e das costelas inferiores até o sulco intertubercular do úmero.',
    funcao: 'Extensão, adução e rotação medial do braço — o movimento de puxar o corpo para cima (barra) e de nadar.',
    vascularizacao: 'Artéria toracodorsal, ramo da subescapular.',
    inervacao: 'Nervo toracodorsal (C6–C8), do fascículo posterior do plexo braquial.',
    clinica: 'É o retalho miocutâneo de escolha na reconstrução mamária e de grandes defeitos de parede torácica, justamente pelo pedículo toracodorsal longo e confiável.',
    pontos: ['Extensão, adução e rotação medial do braço', 'Nervo toracodorsal', 'Retalho miocutâneo de reconstrução'],
  },
  {
    termos: ['musculo peitoral maior'],
    resumo: 'Grande músculo em leque da parede torácica anterior, que forma a prega axilar anterior.',
    localizacao: 'Da clavícula, do esterno e das cartilagens costais até a crista do tubérculo maior do úmero, com as fibras torcendo-se na inserção.',
    funcao: 'Adução e rotação medial do braço; a porção clavicular flexiona e a esternocostal estende o braço fletido.',
    vascularizacao: 'Artéria toracoacromial (ramo peitoral) e artéria torácica lateral.',
    inervacao: 'Nervos peitorais lateral e medial (C5–T1).',
    clinica:
      'Sua borda inferior forma a prega axilar anterior, reparo do exame da axila e da mama. A ausência congênita integra a síndrome de Poland. A ruptura do tendão ocorre em levantamento de peso e deforma o contorno axilar.',
    pontos: ['Forma a prega axilar anterior', 'Adução e rotação medial do braço', 'Nervos peitorais lateral e medial'],
  },
  {
    termos: ['musculo serratil anterior', 'musculo serratil'],
    resumo: 'Músculo em digitações na parede lateral do tórax, que fixa a escápula ao gradil costal.',
    localizacao: 'Das oito ou nove primeiras costelas até a borda medial da escápula, passando por baixo dela.',
    funcao: 'Protrai a escápula e a mantém aplicada à parede torácica; faz a rotação superior que permite elevar o braço acima da cabeça.',
    vascularizacao: 'Artéria torácica lateral.',
    inervacao: 'Nervo torácico longo (C5–C7), que desce superficialmente sobre o músculo.',
    clinica:
      'A lesão do nervo torácico longo — em esvaziamento axilar, trauma ou mochila pesada — produz a escápula alada clássica, evidenciada ao empurrar a parede com os braços estendidos.',
    pontos: ['Protrai a escápula e permite elevar o braço acima de 90°', 'Nervo torácico longo (C5, C6, C7)', 'Escápula alada na lesão'],
  },
  {
    termos: ['musculo reto do abdome', 'musculo reto abdominal'],
    resumo: 'Músculo longo e segmentado da parede abdominal anterior, dentro da bainha do reto.',
    localizacao: 'Da sínfise e da crista púbica até as cartilagens costais 5 a 7 e o processo xifoide, dividido por intersecções tendíneas.',
    funcao: 'Flexiona o tronco, aumenta a pressão intra-abdominal e estabiliza a pelve.',
    vascularizacao: 'Artérias epigástricas superior (torácica interna) e inferior (ilíaca externa), que se anastomosam dentro da bainha.',
    inervacao: 'Nervos toracoabdominais (T7–T12), que entram pela margem lateral.',
    clinica:
      'A linha arqueada marca onde a bainha perde o folheto posterior: abaixo dela, a parede posterior é apenas fáscia transversal — ponto de fraqueza. O retalho TRAM usa este músculo e a epigástrica inferior profunda na reconstrução mamária. A diástase dos retos é comum no pós-parto.',
    pontos: ['Bainha do reto e linha arqueada', 'Anastomose epigástrica superior-inferior', 'Retalho TRAM e diástase dos retos'],
  },
  {
    termos: ['musculo obliquo externo', 'musculo obliquo interno', 'musculo transverso do abdome'],
    resumo: 'Os três músculos planos da parede anterolateral do abdome, com fibras em direções cruzadas.',
    localizacao:
      'Sobrepostos em camadas: oblíquo externo com fibras "para dentro do bolso", oblíquo interno em direção oposta e transverso com fibras horizontais. Suas aponeuroses formam a bainha do reto e a linha alba.',
    funcao: 'Comprimem as vísceras, elevam a pressão intra-abdominal (tosse, defecação, parto), flexionam e giram o tronco.',
    vascularizacao: 'Artérias intercostais inferiores, subcostal, lombares e circunflexa ilíaca profunda.',
    inervacao: 'Nervos toracoabdominais (T7–T11), subcostal (T12), ílio-hipogástrico e ilioinguinal (L1).',
    clinica:
      'O bloqueio TAP deposita anestésico no plano entre o oblíquo interno e o transverso, onde correm os nervos. As camadas aponeuróticas definem os anéis inguinais e o trajeto das hérnias; o tendão conjunto reforça a parede posterior do canal inguinal.',
    pontos: ['Três camadas com fibras cruzadas', 'Formam a bainha do reto e a linha alba', 'Plano do bloqueio TAP entre oblíquo interno e transverso'],
  },
  {
    termos: ['musculo eretor da espinha', 'musculo iliocostal', 'musculo longuissimo', 'musculo espinal'],
    resumo: 'Coluna muscular profunda do dorso, dividida em iliocostal (lateral), longuíssimo (intermédio) e espinal (medial).',
    localizacao: 'De uma origem comum no sacro, na crista ilíaca e nos processos espinhosos lombares, sobe em três colunas até costelas, processos transversos e crânio.',
    funcao: 'Estende e inclina lateralmente a coluna; em pé, trabalha excentricamente para controlar a flexão do tronco contra a gravidade.',
    vascularizacao: 'Ramos dorsais das artérias segmentares.',
    inervacao: 'Ramos dorsais dos nervos espinais — a marca de todo músculo intrínseco do dorso.',
    clinica:
      'O espasmo do eretor da espinha acompanha a maioria das lombalgias mecânicas. O plano do bloqueio ESP (erector spinae plane) é a face profunda desse músculo, sobre o processo transverso.',
    pontos: ['Três colunas: iliocostal, longuíssimo e espinal', 'Inervação por ramos dorsais', 'Trabalha excentricamente no controle da flexão'],
  },
  {
    termos: ['musculo diafragma', 'diafragma'],
    resumo: 'O músculo respiratório principal — uma cúpula musculotendínea que separa tórax e abdome.',
    localizacao:
      'Insere-se no processo xifoide, nas seis últimas cartilagens costais e nos pilares que descem até L1–L3, convergindo para o centro tendíneo.',
    funcao:
      'Ao contrair, achata-se e aumenta o diâmetro vertical do tórax, gerando a pressão negativa da inspiração — responde por cerca de 70% do volume corrente em repouso.',
    vascularizacao: 'Artérias frênicas inferiores (aorta abdominal), pericardicofrênica e musculofrênica.',
    inervacao: 'Nervo frênico (C3–C5) para toda a porção motora; a periferia recebe sensibilidade dos nervos intercostais inferiores.',
    relacoes: 'Hiato da veia cava em T8 (no centro tendíneo), hiato esofágico em T10 (nos pilares, com os troncos vagais) e hiato aórtico em T12 (atrás dos pilares, com o ducto torácico e a veia ázigo).',
    clinica:
      'A irritação da cúpula refere dor ao ombro (C3–C5) — sinal de Kehr. A lesão medular acima de C3 abole a ventilação espontânea. O hiato esofágico é a sede da hérnia de hiato e do refluxo gastroesofágico.',
    pontos: ['C3, C4 e C5 mantêm o diafragma vivo', 'Hiatos: cava T8, esôfago T10, aorta T12', 'Dor referida no ombro por irritação diafragmática'],
  },

  /* ═══════════════════════ Músculos — membro superior ═══════════════════════ */
  {
    termos: ['musculo deltoide'],
    resumo: 'Músculo triangular que cobre o ombro e lhe dá o contorno arredondado.',
    localizacao: 'Da clavícula lateral, do acrômio e da espinha da escápula até a tuberosidade deltóidea do úmero.',
    funcao: 'A porção acromial (média) é a principal abdutora do braço acima de 15°; a clavicular flexiona e roda medialmente, e a espinal estende e roda lateralmente.',
    vascularizacao: 'Artéria circunflexa umeral posterior, que acompanha o nervo axilar pelo espaço quadrangular.',
    inervacao: 'Nervo axilar (C5–C6), que contorna o colo cirúrgico do úmero.',
    clinica:
      'É o músculo da injeção intramuscular no braço, aplicada 2–3 dedos abaixo do acrômio para evitar o nervo axilar. Na luxação do ombro ou na fratura do colo cirúrgico, testa-se a sensibilidade sobre o deltoide para avaliar o nervo axilar.',
    pontos: ['Principal abdutor acima de 15°', 'Nervo axilar contorna o colo cirúrgico', 'Sítio da injeção intramuscular no braço'],
  },
  {
    termos: ['musculo supraespinal', 'musculo supraespinhal'],
    resumo: 'Músculo do manguito rotador que ocupa a fossa supraespinal e passa sob o arco coracoacromial.',
    localizacao: 'Da fossa supraespinal da escápula até a faceta superior do tubérculo maior do úmero, passando sob o acrômio.',
    funcao: 'Inicia a abdução do braço (primeiros 15°) e mantém a cabeça umeral centrada na glenoide durante todo o movimento.',
    vascularizacao: 'Artéria supraescapular, com uma zona crítica de hipovascularização perto da inserção.',
    inervacao: 'Nervo supraescapular (C5–C6), que passa pela incisura da escápula.',
    clinica:
      'É o tendão mais lesado do manguito rotador, tanto por impacto subacromial quanto pela zona crítica de baixa vascularização. Testado pelo teste de Jobe (lata vazia); dor no arco de 60° a 120° sugere impacto.',
    pontos: ['Inicia a abdução (0–15°)', 'Nervo supraescapular', 'Tendão mais lesado do manguito rotador'],
  },
  {
    termos: ['musculo infraespinal', 'musculo redondo menor', 'musculo subescapular', 'musculo redondo maior'],
    resumo: 'Músculos escapuloumerais que, com o supraespinal, formam e completam o manguito rotador.',
    localizacao: 'Infraespinal e redondo menor na face posterior da escápula, inserindo-se no tubérculo maior; subescapular na face costal, no tubérculo menor; redondo maior na borda lateral, no sulco intertubercular.',
    funcao:
      'Infraespinal e redondo menor rodam lateralmente o braço; o subescapular roda medialmente. Juntos, comprimem a cabeça contra a glenoide. O redondo maior, que não faz parte do manguito, aduz e roda medialmente.',
    vascularizacao: 'Artérias supraescapular, circunflexa da escápula e subescapular.',
    inervacao: 'Nervo supraescapular (infraespinal), axilar (redondo menor), subescapulares (subescapular) e subescapular inferior (redondo maior).',
    clinica:
      'O manguito rotador (SITS: supraespinal, infraespinal, redondo menor e subescapular) é o estabilizador dinâmico do ombro. Teste de Patte e rotação externa resistida avaliam o infraespinal; o lift-off e o belly-press, o subescapular.',
    pontos: ['SITS = supraespinal, infraespinal, redondo menor, subescapular', 'Redondo maior não faz parte do manguito', 'Estabilizadores dinâmicos da glenoumeral'],
  },
  {
    termos: ['musculo biceps braquial'],
    resumo: 'Músculo de duas cabeças na face anterior do braço, o flexor e supinador do antebraço.',
    localizacao:
      'A cabeça longa nasce no tubérculo supraglenoidal e corre pelo sulco intertubercular; a curta, no processo coracoide. Ambas convergem para a tuberosidade do rádio e para a aponeurose bicipital.',
    funcao: 'Supinação do antebraço (sua ação mais potente, com o cotovelo fletido) e flexão do cotovelo; a cabeça longa auxilia na estabilização da cabeça umeral.',
    vascularizacao: 'Artéria braquial e sua colateral.',
    inervacao: 'Nervo musculocutâneo (C5–C6).',
    relacoes: 'A aponeurose bicipital protege a artéria braquial e o nervo mediano na fossa cubital, separando-os da veia mediana cubital.',
    clinica:
      'O reflexo bicipital avalia C5–C6. A ruptura da cabeça longa produz o sinal de Popeye (ventre deslocado distalmente) e costuma ser bem tolerada. A aponeurose bicipital é a "graça de Deus" da punção venosa na fossa cubital.',
    pontos: ['Supinação é a ação principal', 'Nervo musculocutâneo; reflexo bicipital = C5–C6', 'Sinal de Popeye na ruptura da cabeça longa'],
  },
  {
    termos: ['musculo triceps braquial'],
    resumo: 'Único músculo do compartimento posterior do braço, com três cabeças convergindo no olécrano.',
    localizacao: 'Cabeça longa no tubérculo infraglenoidal, lateral e medial na face posterior do úmero, com o sulco do nervo radial entre elas.',
    funcao: 'Extensão do cotovelo; a cabeça longa também estende e aduz o braço.',
    vascularizacao: 'Artéria braquial profunda, que acompanha o nervo radial no sulco.',
    inervacao: 'Nervo radial (C6–C8).',
    clinica: 'O reflexo tricipital avalia C7. A fratura da diáfise umeral no sulco radial poupa a cabeça longa (inervada mais proximalmente), o que ajuda a localizar o nível da lesão do nervo radial.',
    pontos: ['Extensor do cotovelo', 'Nervo radial; reflexo tricipital = C7', 'Sulco do nervo radial entre as cabeças lateral e medial'],
  },
  {
    termos: ['musculo braquiorradial'],
    resumo: 'Músculo superficial da borda lateral do antebraço, exceção que confirma a regra da inervação.',
    localizacao: 'Da crista supracondilar lateral do úmero até o processo estiloide do rádio, formando o relevo lateral da fossa cubital.',
    funcao: 'Flexiona o cotovelo, sobretudo com o antebraço em posição neutra (como ao segurar uma caneca) e leva o antebraço à posição intermediária.',
    vascularizacao: 'Artéria radial recorrente.',
    inervacao: 'Nervo radial (C5–C6) — é flexor, mas é inervado pelo nervo dos extensores, o que o torna a exceção clássica cobrada em prova.',
    clinica: 'O reflexo braquiorradial (estilorradial) avalia C6. A inversão desse reflexo sugere lesão medular no nível C5–C6.',
    pontos: ['Flexor inervado pelo nervo radial — a exceção', 'Reflexo braquiorradial = C6', 'Relevo lateral da fossa cubital'],
  },
  {
    termos: ['musculo flexor radial do carpo', 'musculo palmar longo', 'musculo flexor ulnar do carpo', 'musculo pronador redondo'],
    resumo: 'Músculos da camada superficial do compartimento anterior do antebraço, com origem comum no epicôndilo medial.',
    localizacao: 'Da origem comum no epicôndilo medial até o carpo e a base dos metacarpos; seus tendões são visíveis à flexão resistida do punho.',
    funcao: 'Flexionam o punho, com desvio radial (flexor radial do carpo) ou ulnar (flexor ulnar do carpo); o pronador redondo prona o antebraço; o palmar longo tensiona a aponeurose palmar.',
    vascularizacao: 'Artérias ulnar e radial.',
    inervacao:
      'Nervo mediano para todos, exceto o flexor ulnar do carpo, que é do nervo ulnar — junto com a metade medial do flexor profundo dos dedos, é a dupla de exceções do compartimento anterior.',
    relacoes: 'O tendão do palmar longo (ausente em cerca de 15% das pessoas) é o reparo que aponta o nervo mediano logo abaixo dele.',
    clinica:
      'O tendão do palmar longo é o enxerto tendíneo de escolha por ser dispensável. O flexor radial do carpo delimita o local de punção da artéria radial. A síndrome do pronador comprime o mediano entre as cabeças do pronador redondo.',
    pontos: ['Origem comum no epicôndilo medial', 'Flexor ulnar do carpo é a exceção ulnar', 'Palmar longo: ausente em ~15% e enxerto de escolha'],
  },
  {
    termos: ['musculo flexor superficial dos dedos', 'musculo flexor profundo dos dedos', 'musculo flexor longo do polegar'],
    resumo: 'Flexores longos dos dedos, que passam pelo túnel do carpo até as falanges.',
    localizacao:
      'O flexor superficial ocupa a camada intermédia e se insere nas falanges médias; o profundo e o flexor longo do polegar ficam na camada profunda e alcançam as falanges distais.',
    funcao:
      'O superficial flexiona a interfalângica proximal; o profundo, a distal — e é o único que consegue fletir a interfalângica distal, o que permite testá-los separadamente à beira do leito.',
    vascularizacao: 'Artérias ulnar, radial e interóssea anterior.',
    inervacao:
      'Nervo mediano, exceto a metade medial do flexor profundo (4º e 5º dedos), que é do nervo ulnar. O flexor longo do polegar e a metade lateral do profundo recebem o nervo interósseo anterior.',
    clinica:
      'A lesão do nervo interósseo anterior abole o sinal do "OK" (incapacidade de fletir a interfalângica do polegar e a distal do indicador), sem déficit sensitivo. Os nove tendões desses músculos, com o mediano, atravessam o túnel do carpo.',
    pontos: [
      'Superficial → falange média; profundo → falange distal',
      'Metade medial do profundo é ulnar; o resto é mediano',
      'Sinal do "OK" testa o nervo interósseo anterior',
    ],
  },
  {
    termos: ['musculo extensor dos dedos', 'musculo extensor radial longo do carpo', 'musculo extensor radial curto do carpo', 'musculo extensor ulnar do carpo', 'musculo extensor do dedo minimo'],
    resumo: 'Músculos do compartimento posterior do antebraço, com origem comum no epicôndilo lateral.',
    localizacao: 'Da origem comum no epicôndilo lateral, descem pelo dorso do antebraço e passam sob o retináculo dos extensores em seis compartimentos.',
    funcao: 'Estendem o punho e os dedos; os extensores radiais fazem desvio radial e o ulnar do carpo, desvio ulnar.',
    vascularizacao: 'Artérias interóssea posterior e radial.',
    inervacao: 'Nervo radial e seu ramo interósseo posterior (C7–C8) — sem exceções neste compartimento.',
    clinica:
      'A epicondilite lateral envolve principalmente o extensor radial curto do carpo. A lesão alta do nervo radial produz mão caída; a lesão do interósseo posterior poupa a extensão do punho (o extensor radial longo é inervado antes) e a sensibilidade.',
    pontos: ['Origem comum no epicôndilo lateral', 'Todos inervados pelo radial/interósseo posterior', 'Mão caída na lesão radial alta'],
  },
  {
    termos: ['musculo abdutor longo do polegar', 'musculo extensor curto do polegar', 'musculo extensor longo do polegar'],
    resumo: 'Músculos do polegar que delimitam a tabaqueira anatômica.',
    localizacao:
      'Abdutor longo e extensor curto formam a borda lateral (anterior) da tabaqueira; o extensor longo do polegar, contornando o tubérculo dorsal do rádio, forma a borda medial (posterior).',
    funcao: 'Abduzem e estendem o polegar nas suas várias articulações.',
    inervacao: 'Nervo interósseo posterior (ramo profundo do radial).',
    relacoes: 'No assoalho da tabaqueira está o escafoide; nela cruzam a artéria radial e o ramo superficial do nervo radial.',
    clinica:
      'A tenossinovite de De Quervain acomete o abdutor longo e o extensor curto no primeiro compartimento extensor, com teste de Finkelstein positivo. Dor na tabaqueira após trauma sugere fratura do escafoide.',
    pontos: ['Delimitam a tabaqueira anatômica', 'De Quervain e teste de Finkelstein', 'Escafoide no assoalho, artéria radial cruzando'],
  },
  {
    termos: ['musculo interosseo', 'musculo lumbrical', 'musculos interosseos', 'musculos lumbricais', 'musculo abdutor do dedo minimo', 'musculo oponente do polegar', 'musculo abdutor curto do polegar', 'musculo adutor do polegar'],
    resumo: 'Musculatura intrínseca da mão, responsável pelos movimentos finos dos dedos.',
    localizacao: 'Entre os metacarpos (interósseos), originando-se dos tendões do flexor profundo (lumbricais) ou formando as eminências tenar e hipotenar.',
    funcao:
      'Interósseos dorsais abduzem e os palmares aduzem os dedos (DAB e PAD); lumbricais fletem as metacarpofalângicas e estendem as interfalângicas; a musculatura tenar faz a oposição do polegar.',
    vascularizacao: 'Arcos palmares superficial e profundo.',
    inervacao:
      'Nervo ulnar (ramo profundo) para quase toda a musculatura intrínseca; o mediano fica com os três músculos tenares (abdutor curto, flexor curto e oponente) e os dois lumbricais laterais.',
    clinica:
      'A lesão ulnar produz a mão em garra (hiperextensão das metacarpofalângicas e flexão das interfalângicas do 4º e 5º dedos) e o sinal de Froment. A lesão do mediano compromete a oposição e atrofia a eminência tenar — a "mão do pregador".',
    pontos: ['DAB e PAD: dorsais abduzem, palmares aduzem', 'Ulnar comanda quase todos os intrínsecos', 'Garra ulnar x mão do pregador (mediano)'],
  },

  /* ═══════════════════════ Músculos — membro inferior ═══════════════════════ */
  {
    termos: ['musculo gluteo maximo'],
    resumo: 'O maior e mais superficial músculo da nádega, extensor potente do quadril.',
    localizacao: 'Do ílio, do sacro e do ligamento sacrotuberal até o trato iliotibial e a tuberosidade glútea do fêmur.',
    funcao: 'Extensão e rotação lateral do quadril, recrutado sobretudo para subir escadas, levantar da cadeira e correr — não na marcha em terreno plano.',
    vascularizacao: 'Artérias glúteas superior e inferior.',
    inervacao: 'Nervo glúteo inferior (L5–S2).',
    clinica: 'Sua função explica por que a fraqueza aparece ao subir escadas antes de aparecer na marcha. O quadrante superolateral da nádega é a zona segura da injeção intramuscular, distante do nervo isquiático.',
    pontos: ['Extensor potente do quadril', 'Nervo glúteo inferior', 'Difícil subir escadas quando fraco'],
  },
  {
    termos: ['musculo gluteo medio', 'musculo gluteo minimo'],
    resumo: 'Abdutores do quadril, profundos ao glúteo máximo.',
    localizacao: 'Da face lateral do ílio até o trocanter maior do fêmur.',
    funcao:
      'Abduzem o quadril e, sobretudo, estabilizam a pelve no plano frontal durante o apoio unipodal — impedem que a pelve caia para o lado oposto a cada passo.',
    vascularizacao: 'Artéria glútea superior.',
    inervacao: 'Nervo glúteo superior (L4–S1).',
    clinica:
      'A insuficiência produz o sinal de Trendelenburg: no apoio sobre o lado acometido, a pelve contralateral cai. A marcha compensatória inclina o tronco para o lado do apoio — marcha em Duchenne.',
    pontos: ['Estabilizam a pelve no apoio unipodal', 'Nervo glúteo superior', 'Sinal de Trendelenburg'],
  },
  {
    termos: ['musculo piriforme'],
    resumo: 'Músculo em pera que sai da pelve pelo forame isquiático maior — a referência da região glútea.',
    localizacao: 'Da face anterior do sacro até o trocanter maior, atravessando o forame isquiático maior.',
    funcao: 'Roda lateralmente o quadril estendido e abduz o quadril fletido.',
    inervacao: 'Ramos do plexo sacral (S1–S2).',
    relacoes: 'Divide o forame isquiático maior: acima dele passam os vasos e o nervo glúteos superiores; abaixo, os glúteos inferiores, o nervo isquiático, o pudendo e o cutâneo femoral posterior.',
    clinica:
      'É o marco anatômico de toda a região glútea. A síndrome do piriforme comprime o nervo isquiático em seu trajeto e simula ciatalgia de origem discal; em cerca de 10% das pessoas o nervo fibular comum atravessa o próprio músculo.',
    pontos: ['Referência do forame isquiático maior', 'Divide a passagem supra e infrapiriforme', 'Síndrome do piriforme simula ciatalgia'],
  },
  {
    termos: ['musculo iliopsoas', 'musculo psoas maior', 'musculo iliaco'],
    resumo: 'Principal flexor do quadril, formado pela união do psoas maior com o ilíaco.',
    localizacao: 'Do corpo e dos processos transversos das vértebras lombares (psoas) e da fossa ilíaca (ilíaco) até o trocanter menor do fêmur, passando sob o ligamento inguinal.',
    funcao: 'Flexiona o quadril e, com o membro fixo, flexiona o tronco sobre a coxa (o movimento do abdominal).',
    vascularizacao: 'Ramos lombares e artéria ilíaca circunflexa profunda.',
    inervacao: 'Ramos ventrais de L1–L3 diretamente para o psoas; nervo femoral (L2–L4) para o ilíaco.',
    relacoes: 'O nervo femoral emerge entre o psoas e o ilíaco; o ureter cruza sua face anterior.',
    clinica:
      'O sinal do psoas (dor à extensão do quadril) sugere apendicite retrocecal ou abscesso do psoas. O hematoma do psoas em anticoagulados comprime o nervo femoral e causa fraqueza do quadríceps com anestesia da face anterior da coxa.',
    pontos: ['Principal flexor do quadril', 'Nervo femoral emerge entre psoas e ilíaco', 'Sinal do psoas na apendicite retrocecal'],
  },
  {
    termos: ['musculo quadriceps', 'musculo reto femoral', 'musculo vasto lateral', 'musculo vasto medial', 'musculo vasto intermedio'],
    resumo: 'Grupo extensor do joelho, com quatro ventres que convergem no tendão do quadríceps.',
    localizacao: 'Compartimento anterior da coxa; o reto femoral vem da espinha ilíaca anteroinferior e os vastos, do próprio fêmur.',
    funcao: 'Extensão do joelho; o reto femoral, por cruzar duas articulações, também flexiona o quadril.',
    vascularizacao: 'Artéria femoral profunda e circunflexa femoral lateral.',
    inervacao: 'Nervo femoral (L2–L4).',
    clinica:
      'O reflexo patelar avalia L4. O vasto lateral é o sítio preferencial da injeção intramuscular em lactentes. A atrofia do vasto medial oblíquo desequilibra a tração patelar e contribui para a dor femoropatelar.',
    pontos: ['Nervo femoral; reflexo patelar = L4', 'Reto femoral cruza duas articulações', 'Vasto lateral: injeção intramuscular no lactente'],
  },
  {
    termos: ['musculo biceps femoral', 'musculo semitendineo', 'musculo semimembranaceo', 'isquiotibiais'],
    resumo: 'Os isquiotibiais — grupo posterior da coxa que estende o quadril e flexiona o joelho.',
    localizacao: 'Do túber isquiático até a cabeça da fíbula (bíceps femoral) e a face medial da tíbia (semitendíneo e semimembranáceo), delimitando a fossa poplítea.',
    funcao: 'Estendem o quadril e flexionam o joelho; com o joelho fletido, o bíceps roda a perna lateralmente e os mediais, medialmente.',
    vascularizacao: 'Perfurantes da artéria femoral profunda.',
    inervacao:
      'Divisão tibial do nervo isquiático para todos, exceto a cabeça curta do bíceps femoral, inervada pela divisão fibular comum.',
    clinica:
      'A distensão dos isquiotibiais é uma das lesões mais frequentes do esporte, e o encurtamento limita a elevação da perna estendida (teste de Lasègue precisa ser interpretado com isso em mente). O tendão do semitendíneo é enxerto para reconstrução do cruzado anterior.',
    pontos: ['Estendem o quadril e flexionam o joelho', 'Nervo isquiático (divisão tibial)', 'Semitendíneo como enxerto do LCA'],
  },
  {
    termos: ['musculo sartorio'],
    resumo: 'O músculo mais longo do corpo, cruzando a coxa em diagonal.',
    localizacao: 'Da espinha ilíaca anterossuperior até a face medial superior da tíbia, na pata de ganso.',
    funcao: 'Flexiona, abduz e roda lateralmente o quadril e flexiona o joelho — a posição de sentar de pernas cruzadas, que lhe deu o nome (alfaiate).',
    inervacao: 'Nervo femoral (L2–L3).',
    relacoes: 'Forma o limite lateral do trígono femoral e o teto do canal dos adutores.',
    clinica: 'Sua borda medial é reparo do trígono femoral, onde se palpa o pulso femoral. A pata de ganso (sartório, grácil e semitendíneo) é sítio de bursite, causa comum de dor medial do joelho.',
    pontos: ['O músculo mais longo do corpo', 'Limite lateral do trígono femoral', 'Pata de ganso: sartório, grácil e semitendíneo'],
  },
  {
    termos: ['musculo adutor longo', 'musculo adutor magno', 'musculo adutor curto', 'musculo gracil', 'musculo pectineo'],
    resumo: 'Compartimento medial da coxa — os adutores do quadril.',
    localizacao: 'Do púbis e do ísquio até a linha áspera do fêmur; o grácil alcança a tíbia, na pata de ganso.',
    funcao: 'Aduzem a coxa e estabilizam a pelve na marcha; o adutor magno tem uma porção isquiocondilar que também estende o quadril.',
    vascularizacao: 'Artéria obturatória e perfurantes da femoral profunda.',
    inervacao:
      'Nervo obturatório (L2–L4) para o grupo; a porção isquiocondilar do adutor magno recebe a divisão tibial do isquiático, e o pectíneo pode receber o femoral.',
    clinica:
      'O hiato dos adutores, no adutor magno, é a passagem da artéria femoral para a fossa poplítea, onde vira artéria poplítea. A pubalgia do atleta acomete a inserção do adutor longo. A dor do quadril pode ser referida ao joelho pelo nervo obturatório.',
    pontos: ['Nervo obturatório', 'Hiato dos adutores: femoral vira poplítea', 'Adutor magno tem dupla inervação'],
  },
  {
    termos: ['musculo tibial anterior'],
    resumo: 'Principal dorsiflexor do pé, no compartimento anterior da perna.',
    localizacao: 'Da face lateral da tíbia e da membrana interóssea até o cuneiforme medial e a base do 1º metatarsal; seu tendão é o mais medial no dorso do tornozelo.',
    funcao: 'Dorsiflexão e inversão do pé; controla excentricamente a descida do pé após o toque do calcanhar na marcha.',
    vascularizacao: 'Artéria tibial anterior.',
    inervacao: 'Nervo fibular profundo (L4–L5).',
    clinica:
      'Sua fraqueza é o pé caído, com marcha escarvante. A lesão do nervo fibular comum no colo da fíbula é a causa mais comum. A dorsiflexão contra resistência é o teste motor de L4–L5.',
    pontos: ['Dorsiflexão e inversão', 'Nervo fibular profundo', 'Pé caído e marcha escarvante'],
  },
  {
    termos: ['musculo gastrocnemio', 'musculo soleo', 'triceps sural'],
    resumo: 'Tríceps sural — gastrocnêmio (duas cabeças) e sóleo, que formam a panturrilha e o tendão do calcâneo.',
    localizacao: 'Do fêmur (gastrocnêmio) e da tíbia e fíbula (sóleo) até o calcâneo, pelo tendão do calcâneo.',
    funcao: 'Flexão plantar potente, essencial à propulsão na marcha e à corrida; o gastrocnêmio também flexiona o joelho.',
    vascularizacao: 'Artérias surais, ramos da poplítea.',
    inervacao: 'Nervo tibial (S1–S2).',
    clinica:
      'O reflexo aquileu avalia S1. O sóleo é a "bomba muscular" do retorno venoso e as veias em seu interior são sítio frequente de trombose venosa profunda. O teste de Thompson diagnostica a ruptura do tendão do calcâneo.',
    pontos: ['Flexão plantar; reflexo aquileu = S1', 'Sóleo é a bomba venosa da panturrilha', 'Teste de Thompson na ruptura do tendão'],
  },
  {
    termos: ['musculo fibular longo', 'musculo fibular curto', 'musculos fibulares'],
    resumo: 'Músculos do compartimento lateral da perna, os eversores do pé.',
    localizacao: 'Da face lateral da fíbula, seus tendões passam atrás do maléolo lateral: o curto vai à base do 5º metatarsal e o longo cruza a planta até o 1º metatarsal e o cuneiforme medial.',
    funcao: 'Eversão e flexão plantar do pé; o fibular longo sustenta ativamente o arco transverso da planta.',
    vascularizacao: 'Artéria fibular.',
    inervacao: 'Nervo fibular superficial (L5–S1).',
    clinica:
      'A lesão do nervo fibular comum ou superficial abole a eversão e predispõe a entorses em inversão recorrentes. A avulsão da base do 5º metatarsal, pela tração do fibular curto, é achado comum na entorse de tornozelo.',
    pontos: ['Eversores do pé', 'Nervo fibular superficial', 'Fibular curto e a avulsão da base do 5º metatarsal'],
  },
  {
    termos: ['tendao do calcaneo', 'tendao de aquiles'],
    resumo: 'O tendão mais espesso e forte do corpo, formado pelo gastrocnêmio e pelo sóleo.',
    localizacao: 'Da junção musculotendínea da panturrilha até a tuberosidade do calcâneo, envolvido por paratendão e não por bainha sinovial.',
    funcao: 'Transmite toda a força da flexão plantar, suportando cargas de várias vezes o peso corporal na corrida e no salto.',
    vascularizacao: 'Zona hipovascular a 2–6 cm da inserção, onde ocorrem a maioria das rupturas.',
    clinica:
      'A ruptura ocorre na zona hipovascular, com estalo audível e teste de Thompson positivo (a compressão da panturrilha não produz flexão plantar). Fluoroquinolonas e corticoides aumentam o risco de tendinopatia e ruptura.',
    pontos: ['Zona hipovascular a 2–6 cm da inserção', 'Teste de Thompson', 'Risco aumentado por fluoroquinolonas'],
  },
  {
    termos: ['trato iliotibial'],
    resumo: 'Faixa espessada da fáscia lata na face lateral da coxa.',
    localizacao: 'Do tubérculo ilíaco até o tubérculo de Gerdy, na tíbia, recebendo o tensor da fáscia lata e parte do glúteo máximo.',
    funcao: 'Estabiliza o joelho lateralmente e a pelve no apoio unipodal, transmitindo a força dos abdutores do quadril até a perna.',
    clinica: 'A síndrome da banda iliotibial ("joelho do corredor") é atrito sobre o epicôndilo lateral do fêmur, com dor lateral do joelho por volta dos 30° de flexão. O teste de Ober avalia seu encurtamento.',
    pontos: ['Tensor da fáscia lata e glúteo máximo se inserem nele', 'Estabilizador lateral do joelho', 'Síndrome da banda iliotibial'],
  },

  /* ═══════════════════════ Artérias ═══════════════════════ */
  {
    termos: ['aorta'],
    resumo: 'A maior artéria do corpo, origem de toda a circulação sistêmica.',
    localizacao:
      'Sai do ventrículo esquerdo como aorta ascendente, curva-se no arco aórtico (nível T4), desce como aorta torácica atrás do coração, atravessa o hiato aórtico em T12 e termina bifurcando-se em L4 nas ilíacas comuns.',
    funcao: 'Distribui todo o débito sistêmico e, pela elasticidade de sua parede, transforma o fluxo pulsátil em fluxo contínuo (efeito Windkessel).',
    relacoes:
      'Do arco saem, nesta ordem: tronco braquiocefálico, carótida comum esquerda e subclávia esquerda. O ligamento arterial e o nervo laríngeo recorrente esquerdo contornam o arco.',
    clinica:
      'A dissecção aórtica dá dor torácica lacerante com irradiação para o dorso e diferença de pulsos entre os membros. A coarctação produz hipertensão nos membros superiores com pulsos femorais diminuídos. O aneurisma de aorta abdominal fica tipicamente abaixo das renais.',
    pontos: [
      'Três ramos do arco: braquiocefálico, carótida comum E e subclávia E',
      'Bifurca-se em L4',
      'Dissecção: dor lacerante e assimetria de pulsos',
    ],
  },
  {
    termos: ['arteria carotida comum', 'arteria carotida'],
    resumo: 'Tronco arterial do pescoço que se bifurca em carótidas interna e externa.',
    localizacao:
      'Sobe no pescoço dentro da bainha carótica, com a veia jugular interna lateralmente e o nervo vago entre elas, bifurcando-se na altura da borda superior da cartilagem tireóidea (C4).',
    funcao: 'Conduz sangue para o encéfalo (interna) e para a face e o pescoço (externa).',
    relacoes: 'O seio carótico e o glomo carótico ficam na bifurcação, inervados pelo nervo glossofaríngeo (IX).',
    clinica:
      'A bifurcação é o sítio preferencial da placa aterosclerótica e da endarterectomia. A massagem do seio carótico ativa o barorreflexo e reduz a frequência cardíaca — manobra vagal usada na taquicardia supraventricular, contraindicada com sopro carotídeo.',
    pontos: ['Bifurca-se em C4', 'Bainha carótica: artéria, jugular interna e vago', 'Seio carótico e barorreflexo (IX)'],
  },
  {
    termos: ['arteria carotida interna'],
    resumo: 'Ramo da carótida comum que entra no crânio e irriga a maior parte do encéfalo anterior.',
    localizacao: 'Sobe sem emitir ramos no pescoço, entra pelo canal carótico, atravessa o seio cavernoso (sifão carotídeo) e se divide em cerebrais anterior e média.',
    funcao: 'Irriga a maior parte dos hemisférios cerebrais, a órbita (pela artéria oftálmica) e a hipófise.',
    clinica:
      'A ausência de ramos cervicais a distingue da externa na angiografia. A amaurose fugaz é embolia para a artéria oftálmica, primeiro ramo intracraniano, e sinaliza estenose carotídea. A dissecção carotídea pode cursar com síndrome de Horner por lesão do plexo simpático periarterial.',
    pontos: ['Sem ramos no pescoço', 'Primeiro ramo intracraniano: artéria oftálmica', 'Amaurose fugaz e Horner na dissecção'],
  },
  {
    termos: ['arteria carotida externa'],
    resumo: 'Ramo da carótida comum que irriga a face, o couro cabeludo e o pescoço.',
    localizacao: 'Sobe à frente e medialmente à interna no início, terminando na glândula parótida ao dividir-se em maxilar e temporal superficial.',
    funcao: 'Irriga face, cavidade oral, nariz, faringe, laringe, glândula tireoide e couro cabeludo.',
    relacoes: 'Emite oito ramos: tireóidea superior, faríngea ascendente, lingual, facial, occipital, auricular posterior, maxilar e temporal superficial.',
    clinica:
      'A ligadura ou embolização de seus ramos controla epistaxes graves (esfenopalatina, ramo da maxilar) e hemorragias faciais. O pulso da temporal superficial é palpado na suspeita de arterite de células gigantes.',
    pontos: ['Oito ramos, terminando em maxilar e temporal superficial', 'Emite ramos já no pescoço (diferente da interna)', 'Embolização na epistaxe grave'],
  },
  {
    termos: ['arteria vertebral'],
    resumo: 'Ramo da artéria subclávia que sobe pelos forames transversos cervicais até o crânio.',
    localizacao: 'Entra no forame transverso de C6, sobe até C1, contorna o atlas e entra pelo forame magno, unindo-se à contralateral para formar a artéria basilar.',
    funcao: 'Forma o sistema vertebrobasilar, que irriga tronco encefálico, cerebelo, lobos occipitais e parte do tálamo.',
    clinica:
      'A dissecção vertebral é causa importante de AVC no jovem, associada a manipulação cervical e trauma. A síndrome do roubo da subclávia inverte o fluxo vertebral e causa sintomas de fossa posterior ao exercitar o braço.',
    pontos: ['Entra no forame transverso de C6', 'Forma a artéria basilar', 'Dissecção causa AVC no jovem'],
  },
  {
    termos: ['arteria basilar'],
    resumo: 'Artéria única formada pela união das duas vertebrais, na face anterior da ponte.',
    localizacao: 'No sulco basilar, à frente da ponte, terminando na bifurcação em artérias cerebrais posteriores.',
    funcao: 'Irriga a ponte, o cerebelo (AICA e cerebelar superior) e a orelha interna (artéria labiríntica).',
    clinica:
      'A trombose da basilar é catastrófica e pode gerar a síndrome do encarceramento (locked-in), com tetraplegia e preservação apenas dos movimentos oculares verticais e da consciência.',
    pontos: ['União das duas vertebrais', 'Ramos: AICA, cerebelar superior, labiríntica', 'Trombose e síndrome locked-in'],
  },
  {
    termos: ['arteria cerebral media'],
    resumo: 'O maior ramo terminal da carótida interna, que irriga a face lateral do hemisfério.',
    localizacao: 'Corre no sulco lateral, distribuindo-se pelo córtex da convexidade e, por ramos perfurantes (lenticuloestriadas), pelos núcleos da base e pela cápsula interna.',
    funcao: 'Irriga as áreas motora e sensitiva da face e do membro superior, as áreas de Broca e Wernicke e a cápsula interna.',
    clinica:
      'É o território mais acometido no AVC isquêmico: hemiparesia e hemi-hipoestesia contralaterais com predomínio braquiofacial, desvio do olhar para o lado da lesão e afasia se o hemisfério dominante estiver envolvido. As lenticuloestriadas são as artérias do AVC lacunar e da hemorragia hipertensiva.',
    pontos: ['Predomínio braquiofacial no déficit', 'Áreas de Broca e Wernicke', 'Lenticuloestriadas: lacunas e hemorragia hipertensiva'],
  },
  {
    termos: ['arteria cerebral anterior'],
    resumo: 'Ramo terminal da carótida interna que contorna o corpo caloso na face medial do hemisfério.',
    localizacao: 'Da bifurcação carotídea, segue medialmente, une-se à contralateral pela comunicante anterior e sobe na fissura longitudinal.',
    funcao: 'Irriga a face medial dos lobos frontal e parietal — o território do membro inferior no homúnculo motor e sensitivo.',
    clinica:
      'Sua oclusão causa hemiparesia e hipoestesia contralaterais com predomínio no membro inferior, além de abulia e incontinência urinária por acometimento frontal medial. É o inverso do padrão da cerebral média.',
    pontos: ['Predomínio no membro inferior', 'Face medial dos hemisférios', 'Comunicante anterior é o sítio aneurismático mais comum'],
  },
  {
    termos: ['arteria meningea media'],
    resumo: 'Ramo da artéria maxilar que irriga a dura-máter e o osso da calvária.',
    localizacao: 'Entra no crânio pelo forame espinhoso e sulca a face interna do parietal, com o ramo anterior passando junto ao ptério.',
    funcao: 'Irriga a dura-máter e a díploe; não irriga o encéfalo.',
    clinica:
      'Sua ruptura no ptério produz o hematoma extradural: intervalo lúcido, deterioração rápida, midríase ipsilateral e imagem em lente biconvexa que não cruza suturas. É emergência neurocirúrgica.',
    pontos: ['Entra pelo forame espinhoso', 'Ramo anterior corre sob o ptério', 'Hematoma extradural biconvexo'],
  },
  {
    termos: ['arteria subclavia'],
    resumo: 'Artéria que conduz sangue ao membro superior e emite ramos importantes para pescoço e tórax.',
    localizacao: 'Passa entre os músculos escalenos anterior e médio, sobre a 1ª costela, tornando-se artéria axilar ao cruzar a borda lateral dessa costela.',
    funcao: 'Irriga o membro superior e emite as artérias vertebral, torácica interna e o tronco tireocervical.',
    relacoes: 'O plexo braquial acompanha a artéria no espaço interescalênico; a veia subclávia passa à frente do escaleno anterior.',
    clinica:
      'A síndrome do desfiladeiro torácico comprime a artéria e/ou o plexo entre a clavícula, a 1ª costela e os escalenos. A referência do bloqueio interescalênico é justamente esse triângulo. A costela cervical é causa clássica de compressão.',
    pontos: ['Passa entre os escalenos anterior e médio', 'Emite vertebral, torácica interna e tronco tireocervical', 'Síndrome do desfiladeiro torácico'],
  },
  {
    termos: ['arteria axilar'],
    resumo: 'Continuação da subclávia na axila, dividida em três partes pelo músculo peitoral menor.',
    localizacao: 'Da borda lateral da 1ª costela até a borda inferior do redondo maior, quando passa a chamar-se artéria braquial.',
    funcao: 'Irriga o ombro, a parede torácica lateral e o membro superior.',
    relacoes: 'Envolvida pelos fascículos do plexo braquial, que a acompanham e são nomeados pela posição em relação a ela.',
    clinica: 'A rica anastomose escapular permite ligar a artéria entre a subclávia e a subescapular com preservação do fluxo distal. As lesões traumáticas se associam a fraturas de úmero proximal e luxação do ombro.',
    pontos: ['Três partes definidas pelo peitoral menor', 'Fascículos do plexo nomeados por sua posição', 'Anastomose escapular protege o fluxo distal'],
  },
  {
    termos: ['arteria braquial'],
    resumo: 'Artéria principal do braço, continuação da axilar.',
    localizacao: 'Corre no sulco bicipital medial, superficial e palpável, até bifurcar-se na fossa cubital em artérias radial e ulnar.',
    funcao: 'Irriga o braço e conduz o fluxo para o antebraço e a mão.',
    relacoes: 'O nervo mediano cruza a artéria de lateral para medial no braço; na fossa cubital, a aponeurose bicipital a separa da veia mediana cubital.',
    clinica:
      'É a artéria onde se ausculta a pressão arterial. A fratura supracondilar do úmero na criança pode lesá-la e causar a contratura isquêmica de Volkmann. É também o pulso central usado na reanimação do lactente.',
    pontos: ['Sulco bicipital medial: ausculta da pressão arterial', 'Bifurca-se na fossa cubital', 'Risco na fratura supracondilar (Volkmann)'],
  },
  {
    termos: ['arteria radial'],
    resumo: 'Ramo lateral da bifurcação da braquial, o pulso mais palpado da medicina.',
    localizacao:
      'Desce no antebraço lateralmente ao flexor radial do carpo, torna-se superficial acima do processo estiloide do rádio, cruza a tabaqueira anatômica e forma o arco palmar profundo.',
    funcao: 'Irriga o lado lateral do antebraço e, pelo arco palmar profundo, a maior parte da mão profunda.',
    clinica:
      'É o sítio do pulso radial, da gasometria arterial e do acesso do cateterismo. O teste de Allen verifica a perviedade do arco palmar antes da punção. É também a artéria doadora do enxerto radial na revascularização miocárdica.',
    pontos: ['Pulso radial e gasometria arterial', 'Teste de Allen antes da punção', 'Cruza a tabaqueira anatômica'],
  },
  {
    termos: ['arteria ulnar'],
    resumo: 'O maior ramo da bifurcação da artéria braquial, no lado medial do antebraço.',
    localizacao: 'Desce medialmente, acompanhada pelo nervo ulnar na metade distal, passa pelo canal de Guyon e forma o arco palmar superficial.',
    funcao: 'Irriga o lado medial do antebraço e a maior parte da mão superficial, além de originar a artéria interóssea comum.',
    clinica: 'Sua contribuição dominante ao arco palmar superficial é o que torna segura a punção radial quando o teste de Allen é normal. No canal de Guyon, pode ser comprimida junto ao nervo ulnar (síndrome do martelo hipotenar).',
    pontos: ['Forma o arco palmar superficial', 'Origina a interóssea comum', 'Canal de Guyon com o nervo ulnar'],
  },
  {
    termos: ['arteria femoral'],
    resumo: 'Principal artéria do membro inferior, continuação da ilíaca externa abaixo do ligamento inguinal.',
    localizacao:
      'Entra na coxa no trígono femoral, medialmente ao nervo femoral, desce pelo canal dos adutores e atravessa o hiato dos adutores, tornando-se artéria poplítea.',
    funcao: 'Irriga todo o membro inferior; a artéria femoral profunda é a principal fonte dos compartimentos da coxa.',
    relacoes: 'No trígono femoral, de lateral para medial: Nervo, Artéria, Veia, Linfáticos (NAVL).',
    clinica:
      'É o acesso vascular de escolha para cateterismo cardíaco, angiografia e balão intra-aórtico. O pulso femoral é o pulso central mais confiável no choque. Sua punção é feita abaixo do ligamento inguinal, sobre a cabeça do fêmur, para permitir compressão.',
    pontos: ['NAVL de lateral para medial no trígono', 'Vira poplítea no hiato dos adutores', 'Acesso de cateterismo e pulso central'],
  },
  {
    termos: ['arteria poplitea'],
    resumo: 'Continuação da femoral atrás do joelho, a artéria mais profunda da fossa poplítea.',
    localizacao: 'Do hiato dos adutores até a borda inferior do poplíteo, onde se divide em tibial anterior e tronco tibiofibular.',
    funcao: 'Irriga o joelho pela rede genicular e conduz o fluxo para a perna e o pé.',
    clinica:
      'Está firmemente fixada acima e abaixo, o que a torna vulnerável na luxação do joelho e na fratura supracondilar do fêmur — a checagem dos pulsos distais é obrigatória. O aneurisma poplíteo é o aneurisma periférico mais comum e costuma ser bilateral.',
    pontos: ['Estrutura mais profunda da fossa poplítea', 'Risco na luxação do joelho', 'Aneurisma periférico mais comum'],
  },
  {
    termos: ['arteria tibial posterior'],
    resumo: 'Principal artéria do compartimento posterior da perna e da planta do pé.',
    localizacao: 'Desce entre os planos superficial e profundo da panturrilha e passa atrás do maléolo medial, no túnel do tarso, dividindo-se em plantares medial e lateral.',
    funcao: 'Irriga o compartimento posterior da perna e a planta do pé, formando o arco plantar profundo.',
    clinica:
      'O pulso tibial posterior, palpado atrás do maléolo medial, é essencial na avaliação vascular do pé diabético e da doença arterial periférica, e entra no cálculo do índice tornozelo-braço.',
    pontos: ['Pulso atrás do maléolo medial', 'Túnel do tarso com o nervo tibial', 'Índice tornozelo-braço'],
  },
  {
    termos: ['arteria dorsal do pe', 'arteria pediosa'],
    resumo: 'Continuação da artéria tibial anterior no dorso do pé.',
    localizacao: 'Lateralmente ao tendão do extensor longo do hálux, entre o 1º e o 2º metatarsais.',
    funcao: 'Irriga o dorso do pé e contribui para o arco plantar profundo pelo ramo plantar profundo.',
    clinica: 'É o segundo pulso do exame vascular do pé; está ausente por variação anatômica em até 10% das pessoas, o que exige interpretar sua ausência junto com o pulso tibial posterior.',
    pontos: ['Lateral ao tendão do extensor longo do hálux', 'Ausente por variação em até 10%', 'Exame vascular do pé diabético'],
  },
  {
    termos: ['tronco celiaco'],
    resumo: 'Primeiro ramo ímpar da aorta abdominal, que irriga o intestino anterior.',
    localizacao: 'Emerge da aorta em T12, logo abaixo do hiato aórtico, e se divide em gástrica esquerda, esplênica e hepática comum.',
    funcao: 'Irriga esôfago distal, estômago, duodeno proximal, fígado, vesícula biliar, pâncreas e baço.',
    clinica:
      'A úlcera da parede posterior do bulbo duodenal erode a artéria gastroduodenal (ramo da hepática comum) e causa hemorragia digestiva grave. A síndrome do ligamento arqueado mediano comprime o tronco celíaco e causa dor abdominal pós-prandial.',
    pontos: ['T12 — três ramos: gástrica esquerda, esplênica e hepática comum', 'Irriga o intestino anterior', 'Gastroduodenal e a úlcera duodenal posterior'],
  },
  {
    termos: ['arteria mesenterica superior'],
    resumo: 'Ramo ímpar da aorta que irriga todo o intestino médio.',
    localizacao: 'Sai da aorta em L1, atrás do colo do pâncreas, e cruza à frente do processo uncinado e da terceira porção do duodeno.',
    funcao: 'Irriga do duodeno distal até os dois terços proximais do cólon transverso.',
    clinica:
      'A embolia da mesentérica superior causa isquemia mesentérica aguda: dor desproporcional ao exame físico, com acidose e má evolução se não for revascularizada. A síndrome da pinça aortomesentérica comprime a terceira porção do duodeno entre a artéria e a aorta.',
    pontos: ['L1 — irriga o intestino médio', 'Isquemia mesentérica: dor desproporcional ao exame', 'Síndrome da pinça aortomesentérica'],
  },
  {
    termos: ['arteria mesenterica inferior'],
    resumo: 'Ramo ímpar da aorta que irriga o intestino posterior.',
    localizacao: 'Sai da aorta em L3, dividindo-se em cólica esquerda, sigmóideas e retal superior.',
    funcao: 'Irriga do terço distal do cólon transverso até a porção superior do reto.',
    clinica:
      'A flexura esplênica é área de watershed entre os territórios da mesentérica superior e inferior — sítio preferencial da colite isquêmica. A arcada de Riolan e a artéria marginal de Drummond são as anastomoses de socorro entre as duas.',
    pontos: ['L3 — irriga o intestino posterior', 'Flexura esplênica é zona de watershed', 'Artéria marginal de Drummond como colateral'],
  },
  {
    termos: ['arteria coronaria direita'],
    resumo: 'Artéria que nasce do seio aórtico direito e percorre o sulco coronário direito.',
    localizacao: 'Corre entre o átrio e o ventrículo direitos, contornando a margem direita do coração até a face diafragmática.',
    funcao:
      'Irriga o átrio direito, a maior parte do ventrículo direito, o nó sinoatrial (em cerca de 60% das pessoas), o nó atrioventricular (em cerca de 80%) e, na dominância direita, a parede inferior do ventrículo esquerdo pela interventricular posterior.',
    clinica:
      'Sua oclusão causa infarto de parede inferior (elevação de ST em DII, DIII e aVF), frequentemente com bradicardia e bloqueio atrioventricular pelo comprometimento nodal. O infarto de ventrículo direito associado contraindica nitrato e exige volume.',
    pontos: ['Irriga os nós sinoatrial e atrioventricular na maioria', 'Infarto inferior: DII, DIII, aVF', 'Bradiarritmia e infarto de VD associados'],
  },
  {
    termos: ['arteria coronaria esquerda', 'arteria interventricular anterior', 'arteria circunflexa'],
    resumo: 'Tronco coronário esquerdo e seus dois ramos: interventricular anterior e circunflexa.',
    localizacao:
      'O tronco sai do seio aórtico esquerdo e logo se divide: a interventricular anterior desce no sulco interventricular anterior; a circunflexa corre no sulco coronário esquerdo até a face posterior.',
    funcao:
      'A interventricular anterior irriga a parede anterior do ventrículo esquerdo, os dois terços anteriores do septo e o ápice; a circunflexa irriga a parede lateral e, na dominância esquerda, a parede inferior.',
    clinica:
      'A interventricular anterior é a "viúva" (widow maker): sua oclusão proximal produz infarto anterior extenso (V1–V4), com alto risco de choque cardiogênico e arritmia. A circunflexa dá o infarto lateral (DI, aVL, V5–V6), frequentemente eletrocardiograficamente silencioso.',
    pontos: ['Interventricular anterior = widow maker; V1–V4', 'Circunflexa: parede lateral; DI, aVL, V5–V6', 'Dominância definida por quem dá a interventricular posterior'],
  },
  {
    termos: ['arteria renal'],
    resumo: 'Ramo par e curto da aorta abdominal que irriga o rim.',
    localizacao: 'Sai da aorta entre L1 e L2, abaixo da mesentérica superior; a direita é mais longa e passa atrás da veia cava inferior.',
    funcao: 'Conduz cerca de 20–25% do débito cardíaco aos rins, sustentando a filtração glomerular.',
    clinica:
      'A estenose de artéria renal causa hipertensão renovascular por ativação do sistema renina-angiotensina, com sopro abdominal e piora da função renal após inibidor da ECA. Suas artérias segmentares são terminais — a oclusão de uma causa infarto do segmento correspondente.',
    pontos: ['L1–L2; a direita passa atrás da cava', 'Hipertensão renovascular', 'Artérias segmentares são terminais'],
  },

  /* ═══════════════════════ Veias ═══════════════════════ */
  {
    termos: ['veia cava superior'],
    resumo: 'Tronco venoso que devolve ao coração o sangue da metade superior do corpo.',
    localizacao: 'Formada pela união das veias braquiocefálicas atrás do 1º cartilagem costal direita, desce no mediastino superior e desemboca no átrio direito.',
    funcao: 'Drena cabeça, pescoço, membros superiores e parede torácica.',
    clinica:
      'A síndrome da veia cava superior — mais comumente por neoplasia pulmonar — causa edema em esclavina, cianose facial, turgência jugular e circulação colateral no tórax. A ponta do cateter venoso central deve ficar na junção cavo-atrial.',
    pontos: ['União das veias braquiocefálicas', 'Síndrome da cava superior por tumor', 'Alvo da ponta do cateter central'],
  },
  {
    termos: ['veia cava inferior'],
    resumo: 'A maior veia do corpo, que devolve ao coração o sangue da metade inferior.',
    localizacao: 'Formada pela união das ilíacas comuns em L5, sobe à direita da aorta, atravessa o centro tendíneo do diafragma em T8 e entra no átrio direito.',
    funcao: 'Drena membros inferiores, pelve, abdome e as veias hepáticas.',
    clinica:
      'Sua compressão pelo útero gravídico causa a síndrome da hipotensão supina, corrigida com decúbito lateral esquerdo. O diâmetro e a colapsabilidade da cava ao ultrassom estimam a volemia. Filtros de cava previnem embolia pulmonar quando a anticoagulação está contraindicada.',
    pontos: ['Atravessa o diafragma em T8', 'Compressão pelo útero gravídico', 'Ultrassom da cava estima volemia'],
  },
  {
    termos: ['veia porta', 'veia porta hepatica'],
    resumo: 'Veia que leva ao fígado o sangue drenado de todo o tubo digestório e do baço.',
    localizacao: 'Formada atrás do colo do pâncreas pela união das veias mesentérica superior e esplênica, sobe no ligamento hepatoduodenal até o hilo hepático.',
    funcao: 'Conduz ao fígado os nutrientes absorvidos no intestino, sujeitando-os ao metabolismo de primeira passagem antes da circulação sistêmica.',
    relacoes: 'No ligamento hepatoduodenal está a tríade portal: veia porta atrás, artéria hepática à esquerda e ducto colédoco à direita.',
    clinica:
      'A hipertensão portal desvia sangue pelas anastomoses portossistêmicas: varizes esofágicas, hemorroidas e cabeça de medusa. É por drenar para a porta que a metástase colorretal vai primeiro ao fígado, e por isso que fármacos sublinguais e retais baixos escapam da primeira passagem.',
    pontos: [
      'Mesentérica superior + esplênica atrás do colo do pâncreas',
      'Anastomoses portossistêmicas: esôfago, reto e umbigo',
      'Metabolismo de primeira passagem',
    ],
  },
  {
    termos: ['veia jugular interna'],
    resumo: 'Principal veia de drenagem do encéfalo e da face, dentro da bainha carótica.',
    localizacao: 'Começa no forame jugular como continuação do seio sigmóideo e desce lateralmente à artéria carótida, unindo-se à subclávia para formar a veia braquiocefálica.',
    funcao: 'Drena encéfalo, face e pescoço.',
    clinica:
      'É a via preferencial do acesso venoso central pelo lado direito, por seu trajeto retilíneo até o átrio. A turgência jugular reflete a pressão do átrio direito e é sinal de insuficiência cardíaca direita, tamponamento e pneumotórax hipertensivo.',
    pontos: ['Continuação do seio sigmóideo', 'Acesso venoso central preferencial à direita', 'Turgência reflete pressão atrial direita'],
  },
  {
    termos: ['veia safena magna'],
    resumo: 'A veia mais longa do corpo, superficial, na face medial do membro inferior.',
    localizacao: 'Do arco venoso dorsal do pé, passa à frente do maléolo medial, sobe pela face medial da perna e da coxa e desemboca na veia femoral pelo hiato safeno.',
    funcao: 'Drena o território superficial medial do membro inferior, dependendo de valvas e da bomba muscular.',
    inervacao: 'Acompanhada pelo nervo safeno na perna — daí a parestesia medial após safenectomia.',
    clinica:
      'É o enxerto clássico da revascularização miocárdica e de bypass periférico. Sua posição constante à frente do maléolo medial é o local da dissecção venosa de emergência. A incompetência da junção safenofemoral produz varizes.',
    pontos: ['À frente do maléolo medial — dissecção venosa', 'Enxerto de revascularização', 'Junção safenofemoral e varizes'],
  },
  {
    termos: ['veia safena parva'],
    resumo: 'Veia superficial da face posterior da perna.',
    localizacao: 'Do arco venoso dorsal, passa atrás do maléolo lateral e sobe na linha média da panturrilha até a fossa poplítea, onde desemboca na veia poplítea.',
    funcao: 'Drena a face posterolateral da perna e do pé.',
    inervacao: 'Acompanhada pelo nervo sural, referência da biópsia de nervo.',
    clinica: 'A insuficiência da junção safenopoplítea é causa de varizes posteriores; o nervo sural, que a acompanha, é o nervo doador padrão para enxerto e biópsia.',
    pontos: ['Atrás do maléolo lateral', 'Desemboca na veia poplítea', 'Acompanhada pelo nervo sural'],
  },
  {
    termos: ['veia cefalica', 'veia basilica', 'veia mediana cubital'],
    resumo: 'Veias superficiais do membro superior, o alvo de quase toda punção venosa.',
    localizacao:
      'A cefálica corre lateralmente e sobe pelo sulco deltopeitoral até a axilar; a basílica corre medialmente e perfura a fáscia no braço; a mediana cubital as conecta na fossa cubital.',
    funcao: 'Drenam o território superficial do membro superior e participam da termorregulação.',
    clinica:
      'A veia mediana cubital é a mais puncionada do corpo. Está separada da artéria braquial e do nervo mediano apenas pela aponeurose bicipital. A cefálica é usada para marca-passo e a basílica, para PICC, por seu calibre e trajeto retilíneo.',
    pontos: ['Mediana cubital: punção venosa e coleta', 'Aponeurose bicipital protege artéria e nervo', 'Basílica é a preferida para PICC'],
  },
  {
    termos: ['plexo pampiniforme'],
    resumo: 'Rede venosa que envolve a artéria testicular dentro do funículo espermático.',
    localizacao: 'No funículo espermático, envolvendo a artéria testicular e drenando para a veia testicular.',
    funcao: 'Faz troca de calor em contracorrente com a artéria testicular, mantendo o testículo alguns graus abaixo da temperatura corporal.',
    clinica:
      'Sua dilatação é a varicocele, predominantemente esquerda pela drenagem em ângulo reto na veia renal esquerda. Descrita como "saco de vermes" à palpação, é causa corrigível de infertilidade masculina. Varicocele à direita de início recente exige investigar massa retroperitoneal.',
    pontos: ['Troca de calor em contracorrente', 'Varicocele é predominantemente esquerda', 'Varicocele direita nova: investigar retroperitônio'],
  },
  {
    termos: ['seio sagital superior'],
    resumo: 'Seio venoso da dura-máter que corre na margem superior da foice do cérebro.',
    localizacao: 'Da crista galli até a confluência dos seios, na linha média da convexidade.',
    funcao: 'Recebe as veias cerebrais superficiais superiores e absorve o líquido cerebrospinal pelas granulações aracnóideas que se projetam em suas lacunas laterais.',
    clinica:
      'As veias-ponte que desembocam nele são as que rompem no hematoma subdural, sobretudo no idoso com atrofia cerebral. A trombose do seio sagital superior causa cefaleia, papiledema, crises e infartos venosos parassagitais bilaterais.',
    pontos: ['Absorção liquórica pelas granulações aracnóideas', 'Veias-ponte e hematoma subdural', 'Trombose com infartos parassagitais'],
  },
  {
    termos: ['seio cavernoso'],
    resumo: 'Seio venoso pareado nas laterais do corpo do esfenoide, atravessado por nervos e pela carótida.',
    localizacao: 'De cada lado da sela túrcica, entre a fissura orbital superior e o ápice da parte petrosa do temporal.',
    funcao: 'Recebe as veias oftálmicas, as cerebrais médias superficiais e o seio esfenoparietal, drenando para os seios petrosos.',
    relacoes:
      'Na parede lateral, de cima para baixo: nervos oculomotor (III), troclear (IV), oftálmico (V1) e maxilar (V2). Por dentro, atravessando o seio: a artéria carótida interna e o nervo abducente (VI).',
    clinica:
      'A trombose do seio cavernoso, clássica a partir de infecções do triângulo perigoso da face por veias sem valvas, cursa com oftalmoplegia, proptose, quemose e febre. O VI par é o mais precocemente acometido, por correr livre dentro do seio.',
    pontos: ['III, IV, V1, V2 na parede; VI e carótida por dentro', 'Triângulo perigoso da face', 'VI é o primeiro a falhar'],
  },

  /* ═══════════════════════ Nervos e plexos ═══════════════════════ */
  {
    termos: ['plexo braquial'],
    resumo: 'Rede nervosa formada pelos ramos ventrais de C5 a T1, que inerva todo o membro superior.',
    localizacao:
      'Organiza-se em Raízes (C5–T1), Troncos (superior, médio, inferior), Divisões (anteriores e posteriores), Fascículos (lateral, posterior, medial) e Ramos terminais — do espaço interescalênico à axila.',
    funcao: 'Redistribui as fibras dos cinco níveis medulares nos cinco nervos terminais: musculocutâneo, axilar, radial, mediano e ulnar.',
    relacoes: 'Passa entre os escalenos anterior e médio junto à artéria subclávia, sobre a 1ª costela, e depois envolve a artéria axilar.',
    clinica:
      'A paralisia de Erb-Duchenne (C5–C6, tronco superior) dá o braço em "gorjeta de garçom" — típica de distocia de ombro e de tração no parto. A paralisia de Klumpke (C8–T1) compromete os intrínsecos da mão e pode vir com Horner. O bloqueio interescalênico e o infraclavicular usam níveis diferentes do plexo.',
    pontos: [
      'Raízes, Troncos, Divisões, Fascículos, Ramos terminais',
      'Erb-Duchenne (C5–C6) x Klumpke (C8–T1)',
      'Cinco ramos terminais para o membro superior',
    ],
  },
  {
    termos: ['nervo mediano'],
    resumo: 'Nervo do compartimento anterior do antebraço e da musculatura tenar — o nervo da preensão fina.',
    localizacao:
      'Formado pelos fascículos lateral e medial, desce no braço junto à artéria braquial sem inervar nada nele, cruza a fossa cubital, passa entre as cabeças do pronador redondo e entra na mão pelo túnel do carpo.',
    funcao:
      'Inerva quase todos os flexores do antebraço (exceto o flexor ulnar do carpo e a metade medial do flexor profundo), os três músculos tenares e os dois lumbricais laterais; sensibilidade dos três dedos e meio laterais na palma.',
    clinica:
      'Lesão alta: "mão do pregador", com incapacidade de fletir os dedos indicador e médio ao tentar fechar a mão. Lesão no túnel do carpo: parestesia noturna, atrofia tenar e perda da oposição, com a pele da eminência tenar poupada. Testes de Phalen e Tinel.',
    pontos: [
      'Não inerva nada no braço',
      'Mão do pregador (lesão alta) x atrofia tenar (túnel do carpo)',
      'Ramo cutâneo palmar passa por fora do túnel',
    ],
  },
  {
    termos: ['nervo ulnar'],
    resumo: 'Nervo do fascículo medial, comandante da musculatura intrínseca da mão.',
    localizacao:
      'Desce medialmente no braço, atravessa o septo intermuscular medial, passa pelo sulco do nervo ulnar atrás do epicôndilo medial e entra na mão pelo canal de Guyon, superficial ao retináculo dos flexores.',
    funcao:
      'Inerva o flexor ulnar do carpo e a metade medial do flexor profundo dos dedos, além de quase toda a musculatura intrínseca da mão; sensibilidade do dedo mínimo e da metade medial do anular.',
    clinica:
      'Lesão no cotovelo ou no punho produz a mão em garra, mais evidente na lesão distal (paradoxo ulnar: quanto mais distal, pior a garra, porque o flexor profundo continua funcionando). O sinal de Froment testa o adutor do polegar. O canal de Guyon poupa a sensibilidade dorsal.',
    pontos: [
      'Sulco atrás do epicôndilo medial e canal de Guyon',
      'Mão em garra e sinal de Froment',
      'Paradoxo ulnar: lesão distal dá garra maior',
    ],
  },
  {
    termos: ['nervo radial'],
    resumo: 'Maior ramo do plexo braquial, comandante de todos os extensores do membro superior.',
    localizacao:
      'Do fascículo posterior, percorre o sulco do nervo radial na diáfise umeral, cruza para o compartimento anterior no epicôndilo lateral e divide-se em ramo superficial (sensitivo) e interósseo posterior (motor).',
    funcao: 'Inerva o tríceps, o braquiorradial e todo o compartimento extensor do antebraço; sensibilidade do dorso lateral da mão e da tabaqueira.',
    clinica:
      'A lesão na diáfise umeral — fratura ou "paralisia do sábado à noite" pela compressão no encosto da cadeira — produz a mão caída, com perda da extensão do punho e dos dedos. A lesão do interósseo posterior poupa a extensão do punho e a sensibilidade.',
    pontos: ['Sulco do nervo radial na diáfise umeral', 'Mão caída na lesão alta', 'Interósseo posterior: déficit puramente motor'],
  },
  {
    termos: ['nervo axilar'],
    resumo: 'Ramo do fascículo posterior que contorna o colo cirúrgico do úmero.',
    localizacao: 'Atravessa o espaço quadrangular junto à artéria circunflexa umeral posterior e contorna o colo cirúrgico.',
    funcao: 'Inerva o deltoide e o redondo menor; sensibilidade da região lateral do ombro (o "distintivo de sargento").',
    clinica:
      'Vulnerável na luxação anterior do ombro, na fratura do colo cirúrgico e na injeção intramuscular mal posicionada. A avaliação obrigatória é a sensibilidade sobre o deltoide, antes e depois da redução de uma luxação.',
    pontos: ['Contorna o colo cirúrgico do úmero', 'Deltoide e redondo menor', 'Sensibilidade lateral do ombro é o teste rápido'],
  },
  {
    termos: ['nervo musculocutaneo'],
    resumo: 'Ramo do fascículo lateral que inerva o compartimento anterior do braço.',
    localizacao: 'Perfura o músculo coracobraquial e desce entre o bíceps e o braquial, emergindo lateralmente como nervo cutâneo lateral do antebraço.',
    funcao: 'Inerva coracobraquial, bíceps braquial e braquial; sensibilidade da face lateral do antebraço.',
    clinica: 'Sua lesão isolada é rara; quando ocorre, a flexão do cotovelo é preservada em parte pelo braquiorradial (nervo radial), o que pode mascarar o déficit. O reflexo bicipital fica abolido.',
    pontos: ['Perfura o coracobraquial', 'Bíceps, braquial e coracobraquial', 'Flexão do cotovelo parcialmente preservada pelo braquiorradial'],
  },
  {
    termos: ['nervo isquiatico', 'nervo ciatico'],
    resumo: 'O maior e mais calibroso nervo do corpo, formado por L4 a S3.',
    localizacao: 'Sai da pelve pelo forame isquiático maior, abaixo do piriforme, desce na face posterior da coxa e se divide, geralmente na fossa poplítea, em tibial e fibular comum.',
    funcao: 'Inerva os isquiotibiais e, por seus ramos terminais, toda a musculatura da perna e do pé; sensibilidade de quase todo o membro abaixo do joelho.',
    clinica:
      'A ciatalgia é mais comumente radicular (hérnia L4–L5 ou L5–S1) que troncular. Lesão alta abole a flexão do joelho e tudo abaixo dele. A injeção intramuscular no quadrante superolateral da nádega existe justamente para evitá-lo.',
    pontos: ['L4–S3; sai abaixo do piriforme', 'Divide-se em tibial e fibular comum', 'Injeção no quadrante superolateral da nádega'],
  },
  {
    termos: ['nervo femoral'],
    resumo: 'Maior ramo do plexo lombar, nervo do compartimento anterior da coxa.',
    localizacao: 'Emerge entre o psoas maior e o ilíaco, passa sob o ligamento inguinal lateralmente à artéria femoral e se ramifica no trígono femoral.',
    funcao: 'Inerva o iliopsoas, o sartório, o pectíneo e o quadríceps; pelo nervo safeno, dá sensibilidade à face medial da perna e do pé.',
    clinica:
      'Sua lesão abole a extensão do joelho e o reflexo patelar. O hematoma do psoas em anticoagulados o comprime. O bloqueio femoral é padrão na analgesia da fratura de fêmur e na artroplastia de joelho.',
    pontos: ['Lateral à artéria femoral sob o ligamento inguinal', 'Quadríceps e reflexo patelar (L4)', 'Nervo safeno é seu ramo sensitivo terminal'],
  },
  {
    termos: ['nervo fibular comum', 'nervo peroneal comum'],
    resumo: 'Ramo do isquiático que contorna o colo da fíbula — o nervo mais vulnerável do membro inferior.',
    localizacao: 'Desce lateralmente na fossa poplítea, contorna o colo da fíbula sob a pele e se divide em fibular superficial e profundo.',
    funcao: 'Pelo fibular profundo, comanda a dorsiflexão; pelo superficial, a eversão; sensibilidade do dorso do pé.',
    clinica:
      'Sua lesão no colo da fíbula — gesso apertado, cruzar as pernas, posicionamento cirúrgico, trauma — causa o pé caído com marcha escarvante e anestesia do dorso do pé. É a mononeuropatia mais comum do membro inferior.',
    pontos: ['Superficial no colo da fíbula', 'Pé caído e marcha escarvante', 'Mononeuropatia mais comum do membro inferior'],
  },
  {
    termos: ['nervo tibial'],
    resumo: 'Ramo maior do isquiático, nervo do compartimento posterior da perna e da planta do pé.',
    localizacao: 'Desce pela fossa poplítea e pelo compartimento posterior profundo, passando atrás do maléolo medial no túnel do tarso.',
    funcao: 'Inerva o tríceps sural e os flexores dos dedos; pelos nervos plantares, quase toda a musculatura intrínseca do pé e a sensibilidade da planta.',
    clinica:
      'A síndrome do túnel do tarso comprime o nervo atrás do maléolo medial, com dor e parestesia plantar. Sua lesão abole a flexão plantar e o reflexo aquileu (S1) e anestesia a planta — um risco grave no paciente diabético.',
    pontos: ['Túnel do tarso atrás do maléolo medial', 'Reflexo aquileu = S1', 'Sensibilidade plantar e risco de úlcera'],
  },
  {
    termos: ['nervo frenico'],
    resumo: 'Nervo motor do diafragma, formado por C3, C4 e C5.',
    localizacao: 'Desce sobre a face anterior do músculo escaleno anterior, entra no tórax e corre pelo mediastino, à frente do hilo pulmonar, até o diafragma.',
    funcao: 'É o único nervo motor do diafragma; carrega também sensibilidade do pericárdio, da pleura mediastinal e do peritônio diafragmático.',
    clinica:
      '"C3, 4 e 5 mantêm o diafragma vivo": lesão medular acima de C3 abole a ventilação espontânea. Sua lesão unilateral eleva a hemicúpula na radiografia. A irritação diafragmática refere dor no ombro (sinal de Kehr), e o soluço persistente pode indicar irritação frênica.',
    pontos: ['C3, C4, C5', 'À frente do hilo pulmonar (o vago passa atrás)', 'Dor referida no ombro'],
  },
  {
    termos: ['nervo vago'],
    resumo: 'O décimo par craniano, o nervo de maior distribuição do corpo.',
    localizacao: 'Sai pelo forame jugular, desce na bainha carótica entre a carótida e a jugular interna, entra no tórax e segue atrás do hilo pulmonar até o abdome.',
    funcao:
      'Parassimpático de coração, pulmões e tubo digestório até a flexura esquerda do cólon; motor da laringe e da faringe; sensibilidade visceral e da laringe.',
    clinica:
      'O laríngeo recorrente esquerdo contorna o arco aórtico e o direito, a artéria subclávia — daí a rouquidão como sinal de tumor mediastinal ou de aneurisma. A estimulação vagal (Valsalva, massagem carotídea) reverte taquicardias supraventriculares.',
    pontos: ['Parassimpático até a flexura esplênica', 'Laríngeos recorrentes com trajetos assimétricos', 'Manobras vagais e reflexo do vômito'],
  },
  {
    termos: ['nervo facial'],
    resumo: 'Sétimo par craniano — motor da mímica facial, com componentes gustativo e parassimpático.',
    localizacao: 'Emerge no ângulo pontocerebelar, percorre o meato acústico interno e o canal facial no temporal, sai pelo forame estilomastóideo e se ramifica na parótida.',
    funcao:
      'Motricidade de toda a mímica facial e do estapédio; gustação dos dois terços anteriores da língua (corda do tímpano); secreção lacrimal, submandibular e sublingual.',
    clinica:
      'A paralisia de Bell é periférica e acomete a hemiface inteira, com lagoftalmo e risco de ceratite. A paralisia central poupa a testa. A localização da lesão no trajeto é deduzida pela presença de hiperacusia (estapédio), disgeusia (corda do tímpano) e olho seco (nervo petroso maior).',
    pontos: ['Periférica pega a testa; central poupa', 'Corda do tímpano: gustação dos 2/3 anteriores', 'Ramifica-se dentro da parótida'],
  },
  {
    termos: ['nervo trigemeo'],
    resumo: 'Quinto par craniano, principal nervo sensitivo da face e motor da mastigação.',
    localizacao: 'Emerge da face lateral da ponte, forma o gânglio trigeminal no cavo trigeminal e se divide em oftálmico (V1, fissura orbital superior), maxilar (V2, forame redondo) e mandibular (V3, forame oval).',
    funcao: 'Sensibilidade de toda a face, dos seios paranasais, dos dentes e dos dois terços anteriores da língua (sensibilidade geral); motor dos músculos da mastigação (V3).',
    clinica:
      'A neuralgia do trigêmeo dá dor lancinante em choque, mais frequente em V2 e V3, tipicamente por compressão vascular na entrada do nervo na ponte. O reflexo corneopalpebral tem V1 como via aferente e o facial como eferente.',
    pontos: ['V1 fissura orbital superior, V2 forame redondo, V3 forame oval', 'Só V3 é misto (motor da mastigação)', 'Reflexo corneopalpebral: V1 aferente, VII eferente'],
  },
  {
    termos: ['nervo laringeo recorrente'],
    resumo: 'Ramo do vago que inerva quase toda a musculatura intrínseca da laringe.',
    localizacao:
      'À direita contorna a artéria subclávia; à esquerda, o arco aórtico, sob o ligamento arterial. Ambos sobem no sulco traqueoesofágico até a laringe.',
    funcao: 'Motor de todos os músculos intrínsecos da laringe exceto o cricotireóideo; sensitivo abaixo das pregas vocais.',
    clinica:
      'Sua lesão em tireoidectomia é a complicação clássica: unilateral causa rouquidão; bilateral, obstrução da via aérea que pode exigir traqueostomia. Rouquidão de instalação insidiosa exige investigar tumor de pulmão ou de mediastino ao longo do trajeto esquerdo.',
    pontos: ['Trajetos assimétricos: subclávia à direita, arco aórtico à esquerda', 'Poupa o cricotireóideo (laríngeo superior externo)', 'Risco na tireoidectomia'],
  },
  {
    termos: ['nervo pudendo'],
    resumo: 'Principal nervo do períneo, formado por S2, S3 e S4.',
    localizacao: 'Sai da pelve pelo forame isquiático maior, contorna a espinha isquiática e retorna pelo forame isquiático menor, correndo no canal do pudendo (de Alcock).',
    funcao: 'Inerva o esfíncter externo do ânus e da uretra, a musculatura perineal e a sensibilidade da genitália externa.',
    clinica:
      '"S2, S3, S4 mantêm o períneo fora do chão." O bloqueio do pudendo, referenciado na espinha isquiática palpada pela vagina, é usado no parto vaginal e na episiotomia. A neuralgia do pudendo dá dor perineal que piora sentado.',
    pontos: ['S2–S4', 'Contorna a espinha isquiática', 'Esfíncteres externos voluntários'],
  },
  {
    termos: ['cauda equina'],
    classe: 'nervo',
    resumo: 'Feixe de raízes lombares, sacrais e coccígeas que desce no canal vertebral abaixo do cone medular.',
    localizacao: 'No saco dural, de L1–L2 até o fim do canal, em torno do filamento terminal.',
    funcao: 'Conduz as raízes que inervam os membros inferiores, o períneo e os esfíncteres até seus respectivos forames.',
    clinica:
      'A síndrome da cauda equina — hérnia volumosa, tumor ou abscesso — cursa com anestesia em sela, retenção urinária, incontinência fecal e déficit assimétrico dos membros inferiores. É emergência cirúrgica de descompressão.',
    pontos: ['Abaixo do cone medular (L1–L2)', 'Espaço seguro para a punção lombar', 'Síndrome da cauda equina é emergência'],
  },

  /* ═══════════════════════ Sistema nervoso central ═══════════════════════ */
  {
    termos: ['bulbo'],
    resumo: 'Porção mais caudal do tronco encefálico, entre a ponte e a medula espinal.',
    localizacao: 'Da decussação das pirâmides, no forame magno, até o sulco bulbopontino; contém as pirâmides à frente e as olivas lateralmente.',
    funcao:
      'Abriga os centros respiratório e vasomotor, os núcleos dos nervos cranianos IX, X, XI e XII e a decussação das pirâmides — onde a via corticoespinal cruza.',
    vascularizacao: 'Ramos paramedianos da artéria vertebral (bulbo medial) e artéria cerebelar póstero-inferior/PICA (bulbo lateral).',
    clinica:
      'A síndrome de Wallenberg (bulbo lateral, PICA) combina síndrome de Horner ipsilateral, hipoestesia térmico-dolorosa da hemiface ipsilateral e do corpo contralateral, disfagia e ataxia. A lesão bulbar medial dá hemiparesia contralateral com desvio da língua para o lado da lesão.',
    pontos: ['Centros respiratório e vasomotor', 'Decussação das pirâmides', 'Síndrome de Wallenberg (PICA)'],
  },
  {
    termos: ['ponte'],
    resumo: 'Porção média e volumosa do tronco encefálico, entre o mesencéfalo e o bulbo.',
    localizacao: 'À frente do cerebelo, ao qual se liga pelos pedúnculos cerebelares médios; contém o IV ventrículo em sua face posterior.',
    funcao: 'Contém os núcleos dos nervos cranianos V, VI, VII e VIII, os núcleos pontinos que fazem a ponte córtico-ponto-cerebelar e o centro pneumotáxico.',
    vascularizacao: 'Ramos perfurantes da artéria basilar.',
    clinica:
      'A lesão pontina ventral extensa pode produzir a síndrome do encarceramento (locked-in): tetraplegia e anartria com consciência preservada e movimentos oculares verticais intactos. A hemorragia pontina hipertensiva cursa com pupilas puntiformes reativas.',
    pontos: ['Núcleos de V, VI, VII e VIII', 'Pedúnculos cerebelares médios', 'Síndrome locked-in'],
  },
  {
    termos: ['mesencefalo'],
    resumo: 'Porção mais rostral do tronco encefálico, atravessada pelo aqueduto do mesencéfalo.',
    localizacao: 'Entre o diencéfalo e a ponte, com os pedúnculos cerebrais à frente e a lâmina do teto (colículos) atrás.',
    funcao:
      'Contém os núcleos dos nervos III e IV, a substância negra, o núcleo rubro e os colículos superior (reflexos visuais) e inferior (via auditiva).',
    vascularizacao: 'Ramos da artéria cerebral posterior e da comunicante posterior.',
    clinica:
      'A síndrome de Weber (base do pedúnculo) associa paralisia do III ipsilateral com hemiparesia contralateral. A degeneração da substância negra é a base da doença de Parkinson. A compressão do aqueduto causa hidrocefalia obstrutiva.',
    pontos: ['Núcleos de III e IV', 'Substância negra e Parkinson', 'Aqueduto do mesencéfalo e hidrocefalia obstrutiva'],
  },
  {
    termos: ['talamo'],
    resumo: 'Grande massa de substância cinzenta do diencéfalo — a estação de retransmissão sensorial do encéfalo.',
    localizacao: 'De cada lado do III ventrículo, acima do hipotálamo, medialmente à cápsula interna.',
    funcao:
      'Retransmite ao córtex praticamente toda a informação sensorial (exceto a olfatória), além de participar dos circuitos motores, límbicos e da regulação da consciência.',
    vascularizacao: 'Ramos perfurantes da cerebral posterior e da comunicante posterior.',
    clinica:
      'O infarto talâmico causa hemianestesia contralateral completa e pode evoluir para a síndrome de Déjerine-Roussy, com dor central intratável. A hemorragia talâmica hipertensiva costuma cursar com desvio ocular para baixo e para dentro.',
    pontos: ['Estação de todas as vias sensitivas, menos a olfatória', 'Hemianestesia contralateral no infarto', 'Dor central de Déjerine-Roussy'],
  },
  {
    termos: ['hipotalamo'],
    resumo: 'Pequena região do diencéfalo que comanda o sistema autônomo e o eixo endócrino.',
    localizacao: 'Abaixo do tálamo, formando o assoalho e as paredes inferiores do III ventrículo, ligado à hipófise pelo infundíbulo.',
    funcao: 'Regula temperatura, fome, sede, sono, comportamento sexual, resposta ao estresse e controla a hipófise por hormônios liberadores e pela neuro-hipófise.',
    clinica:
      'Lesões hipotalâmicas produzem diabetes insípido central, alterações de temperatura, distúrbios do apetite e do ciclo sono-vigília. O núcleo supraquiasmático é o relógio biológico central.',
    pontos: ['Controla a hipófise e o sistema autônomo', 'Termorregulação, fome, sede e sono', 'Diabetes insípido central nas lesões'],
  },
  {
    termos: ['corpo caloso'],
    resumo: 'A maior comissura do encéfalo, unindo os dois hemisférios cerebrais.',
    localizacao: 'No fundo da fissura longitudinal, com rostro, joelho, tronco e esplênio, formando o teto dos ventrículos laterais.',
    funcao: 'Transfere informação entre os hemisférios, permitindo a integração bilateral da percepção, do movimento e da linguagem.',
    vascularizacao: 'Artéria cerebral anterior (pericalosa) e ramos da cerebral posterior no esplênio.',
    clinica:
      'A síndrome de desconexão calosa produz alexia sem agrafia e a mão alienígena. A calosotomia foi usada como tratamento de epilepsia refratária. Lesões no esplênio aparecem em encefalopatias e desmielinização.',
    pontos: ['Maior comissura inter-hemisférica', 'Teto dos ventrículos laterais', 'Síndromes de desconexão'],
  },
  {
    termos: ['capsula interna'],
    resumo: 'Feixe compacto de substância branca entre os núcleos da base, por onde passam as vias motoras e sensitivas.',
    localizacao: 'Entre o núcleo caudado e o tálamo (medialmente) e o núcleo lentiforme (lateralmente), com perna anterior, joelho e perna posterior.',
    funcao: 'Conduz as fibras corticoespinais, corticobulbares e talamocorticais entre o córtex e o tronco/medula, concentrando num espaço pequeno vias de todo o corpo.',
    vascularizacao: 'Artérias lenticuloestriadas, ramos perfurantes da cerebral média.',
    clinica:
      'É por essa compactação que uma lesão minúscula ali produz hemiplegia completa contralateral — o AVC lacunar motor puro. É também o sítio típico da hemorragia hipertensiva.',
    pontos: ['Perna posterior conduz a via corticoespinal', 'Lenticuloestriadas: lacunas e hemorragia hipertensiva', 'Hemiplegia completa por lesão pequena'],
  },
  {
    termos: ['ventriculo lateral', 'iii ventriculo', 'iv ventriculo', 'aqueduto'],
    resumo: 'Cavidades encefálicas por onde circula o líquido cerebrospinal.',
    localizacao:
      'Dois ventrículos laterais nos hemisférios, ligados pelos forames interventriculares ao III ventrículo (diencéfalo), que se liga pelo aqueduto do mesencéfalo ao IV ventrículo, entre a ponte e o cerebelo.',
    funcao: 'Contêm os plexos corióideos, que produzem cerca de 500 mL de líquido cerebrospinal por dia, e o conduzem até o espaço subaracnóideo pelos forames de Luschka e Magendie.',
    clinica:
      'O aqueduto do mesencéfalo é o ponto mais estreito do circuito e o local clássico de estenose causadora de hidrocefalia obstrutiva. A dilatação ventricular na imagem indica o nível do bloqueio, e o ventrículo lateral é o alvo da derivação ventricular externa.',
    pontos: [
      'Laterais → III (forame interventricular) → aqueduto → IV → subaracnóideo',
      'Plexos corióideos produzem ~500 mL/dia',
      'Estenose de aqueduto e hidrocefalia obstrutiva',
    ],
  },
  {
    termos: ['dura-mater', 'dura mater'],
    resumo: 'A meninge mais externa, espessa e resistente, com dois folhetos no crânio.',
    localizacao: 'Adere ao periósteo interno do crânio e envia pregas para dentro — foice do cérebro, tenda do cerebelo, foice do cerebelo e diafragma da sela.',
    funcao: 'Protege o encéfalo, compartimenta a cavidade craniana limitando deslocamentos e aloja os seios venosos entre seus folhetos.',
    vascularizacao: 'Artéria meníngea média, principalmente.',
    inervacao: 'Ramos meníngeos do trigêmeo e dos nervos cervicais superiores — é sensível à dor, ao contrário do parênquima encefálico.',
    clinica:
      'Suas pregas definem os padrões de herniação: subfalcina sob a foice, uncal pela incisura da tenda e tonsilar pelo forame magno. Sua inervação explica a cefaleia da meningite, da hemorragia subaracnóidea e da hipotensão liquórica pós-punção.',
    pontos: ['Foice e tenda definem os padrões de herniação', 'Sensível à dor (o encéfalo não é)', 'Seios venosos entre seus folhetos'],
  },
  {
    termos: ['aracnoide', 'espaco subaracnoideo'],
    resumo: 'Meninge intermédia, avascular, que delimita com a pia-máter o espaço do líquido cerebrospinal.',
    localizacao: 'Aplicada à face interna da dura-máter, com trabéculas cruzando o espaço subaracnóideo até a pia-máter.',
    funcao: 'Delimita o espaço subaracnóideo, onde circulam o líquido cerebrospinal e os vasos cerebrais, e absorve o liquor pelas granulações aracnóideas.',
    clinica:
      'A hemorragia subaracnóidea, geralmente por ruptura de aneurisma sacular, dá cefaleia em trovoada e rigidez de nuca; a tomografia sem contraste é o primeiro exame, seguida de punção lombar se negativa. As cisternas são dilatações desse espaço, importantes na leitura da tomografia.',
    pontos: ['Contém o líquido cerebrospinal e os vasos cerebrais', 'Hemorragia subaracnóidea: cefaleia em trovoada', 'Granulações aracnóideas absorvem o liquor'],
  },
  {
    termos: ['pia-mater', 'pia mater'],
    resumo: 'Meninge mais interna, finíssima e vascularizada, aderida à superfície do tecido nervoso.',
    localizacao: 'Reveste intimamente giros e sulcos do encéfalo e a superfície da medula, acompanhando os vasos que penetram o parênquima.',
    funcao: 'Sustenta os vasos superficiais, forma o espaço perivascular (de Virchow-Robin) e, na medula, os ligamentos denticulados e o filamento terminal.',
    clinica: 'Os espaços de Virchow-Robin são vias de disseminação de infecções e de células neoplásicas; sua dilatação aparece na ressonância como pequenos focos liquóricos.',
    pontos: ['Aderida ao tecido nervoso', 'Espaços de Virchow-Robin', 'Forma os ligamentos denticulados na medula'],
  },

  /* ═══════════════════════ Coração ═══════════════════════ */
  {
    termos: ['atrio direito'],
    resumo: 'Câmara de recepção do sangue venoso sistêmico, à direita e à frente no coração.',
    localizacao: 'Forma a margem direita do coração; recebe as veias cavas superior e inferior e o seio coronário, com a aurícula direita à frente.',
    funcao: 'Recebe todo o retorno venoso sistêmico e coronário e o entrega ao ventrículo direito pela valva tricúspide.',
    vascularizacao: 'Artéria coronária direita.',
    inervacao: 'O nó sinoatrial, seu marca-passo, fica junto à desembocadura da cava superior, na crista terminal.',
    relacoes: 'A fossa oval, na parede septal, é o vestígio do forame oval fetal.',
    clinica:
      'A pressão do átrio direito é o que se estima pela turgência jugular e pela cava inferior ao ultrassom. A forame oval patente (em ~25% dos adultos) permite embolia paradoxal. É a câmara-alvo do cateter venoso central e do marca-passo transvenoso.',
    pontos: ['Recebe cavas e seio coronário', 'Nó sinoatrial na crista terminal', 'Fossa oval e embolia paradoxal'],
  },
  {
    termos: ['ventriculo direito'],
    resumo: 'Câmara de bombeamento da circulação pulmonar, a mais anterior do coração.',
    localizacao: 'Forma a maior parte da face esternocostal do coração, atrás do esterno, com parede fina (3–5 mm) e trabéculas carnosas grosseiras.',
    funcao: 'Bombeia o sangue venoso ao tronco pulmonar contra a baixa resistência do circuito pulmonar — por isso a parede é fina.',
    vascularizacao: 'Artéria coronária direita.',
    relacoes: 'A trabécula septomarginal (banda moderadora) conduz o ramo direito do feixe atrioventricular até o músculo papilar anterior.',
    clinica:
      'Por ser a câmara mais anterior, é a mais lesada no trauma torácico penetrante e a puncionada acidentalmente na pericardiocentese. O infarto de ventrículo direito, associado ao infarto inferior, é pré-carga-dependente: contraindica nitrato e exige volume.',
    pontos: ['Câmara mais anterior — trauma e pericardiocentese', 'Parede fina, baixa resistência pulmonar', 'Banda moderadora conduz o ramo direito'],
  },
  {
    termos: ['atrio esquerdo'],
    resumo: 'Câmara mais posterior do coração, que recebe o sangue oxigenado dos pulmões.',
    localizacao: 'Na face posterior do coração, à frente do esôfago, recebendo as quatro veias pulmonares.',
    funcao: 'Recebe o sangue arterializado e o entrega ao ventrículo esquerdo pela valva mitral.',
    vascularizacao: 'Artéria circunflexa.',
    relacoes: 'Sua relação posterior com o esôfago é o que torna possível o ecocardiograma transesofágico com imagens tão nítidas dessa câmara.',
    clinica:
      'A estenose mitral dilata o átrio esquerdo, que pode comprimir o esôfago (disfagia) e o laríngeo recorrente esquerdo (rouquidão — sinal de Ortner). Sua dilatação é substrato da fibrilação atrial, e a aurícula esquerda é o sítio de formação de trombos e origem de AVC cardioembólico.',
    pontos: ['Câmara mais posterior — janela do eco transesofágico', 'Recebe as quatro veias pulmonares', 'Aurícula esquerda e trombo na fibrilação atrial'],
  },
  {
    termos: ['ventriculo esquerdo'],
    resumo: 'Câmara de maior pressão do coração, que bombeia o sangue para toda a circulação sistêmica.',
    localizacao: 'Forma o ápice e a margem esquerda do coração, com parede de 8 a 12 mm — cerca de três vezes a do direito.',
    funcao: 'Ejeta o sangue na aorta contra a alta resistência sistêmica; sua fração de ejeção é a medida central da função cardíaca.',
    vascularizacao: 'Artérias interventricular anterior, circunflexa e, na parede inferior, coronária direita ou circunflexa conforme a dominância.',
    clinica:
      'O ictus cordis, no 5º espaço intercostal esquerdo na linha hemiclavicular, corresponde ao seu ápice; desvio lateral indica dilatação. A hipertrofia por sobrecarga de pressão (hipertensão, estenose aórtica) difere da dilatação por sobrecarga de volume (insuficiência mitral ou aórtica).',
    pontos: ['Parede ~3x mais espessa que a do VD', 'Ictus cordis no 5º EIC, linha hemiclavicular', 'Hipertrofia (pressão) x dilatação (volume)'],
  },
  {
    termos: ['valva mitral', 'valva atrioventricular esquerda', 'valva bicuspide'],
    resumo: 'Valva atrioventricular esquerda, de duas cúspides, entre o átrio e o ventrículo esquerdos.',
    localizacao: 'No anel fibroso mitral, com cúspides anterior e posterior ancoradas por cordas tendíneas aos músculos papilares anterolateral e posteromedial.',
    funcao: 'Impede o refluxo do ventrículo para o átrio esquerdo durante a sístole.',
    clinica:
      'Ausculta-se no foco mitral, no ápice. A estenose mitral (quase sempre reumática) dá ruflar diastólico com estalido de abertura; a insuficiência, sopro holossistólico irradiado para a axila. O músculo papilar posteromedial tem irrigação única e pode romper no infarto inferior, causando insuficiência mitral aguda.',
    pontos: ['Duas cúspides; foco de ausculta no ápice', 'Estenose reumática x insuficiência holossistólica', 'Papilar posteromedial rompe no infarto inferior'],
  },
  {
    termos: ['valva tricuspide', 'valva atrioventricular direita'],
    resumo: 'Valva de três cúspides entre o átrio e o ventrículo direitos.',
    localizacao: 'No anel fibroso direito, com cúspides anterior, posterior e septal ancoradas por cordas tendíneas a três músculos papilares.',
    funcao: 'Impede o refluxo para o átrio direito durante a sístole ventricular.',
    clinica:
      'Ausculta-se no 4º–5º espaço intercostal, junto à borda esternal esquerda, com reforço do sopro à inspiração (manobra de Rivero-Carvallo). É a valva mais acometida na endocardite de usuários de drogas injetáveis. Sua insuficiência produz onda v gigante no pulso venoso e pulso hepático.',
    pontos: ['Três cúspides', 'Sopro aumenta à inspiração (Rivero-Carvallo)', 'Endocardite em usuários de drogas injetáveis'],
  },
  {
    termos: ['valva aortica'],
    resumo: 'Valva semilunar de três válvulas entre o ventrículo esquerdo e a aorta.',
    localizacao: 'Na saída do ventrículo esquerdo, com os seios aórticos direito e esquerdo dando origem às artérias coronárias.',
    funcao: 'Impede o refluxo da aorta para o ventrículo durante a diástole; sua abertura define o início da ejeção.',
    clinica:
      'A estenose aórtica dá sopro sistólico em ejeção irradiado para as carótidas, com a tríade angina, síncope e dispneia. A valva aórtica bicúspide é a malformação cardíaca mais comum e antecipa a estenose. A insuficiência aórtica dá sopro diastólico aspirativo e pulso amplo (martelo d\'água).',
    pontos: ['Coronárias nascem dos seios aórticos', 'Estenose: angina, síncope e dispneia', 'Valva bicúspide é a malformação mais comum'],
  },
  {
    termos: ['valva pulmonar'],
    resumo: 'Valva semilunar entre o ventrículo direito e o tronco pulmonar.',
    localizacao: 'Na via de saída do ventrículo direito, no infundíbulo (cone arterial).',
    funcao: 'Impede o refluxo do tronco pulmonar para o ventrículo direito na diástole.',
    clinica:
      'Ausculta-se no 2º espaço intercostal esquerdo. O desdobramento fisiológico da segunda bulha na inspiração acontece porque o componente pulmonar atrasa com o aumento do retorno venoso. A estenose pulmonar integra a tetralogia de Fallot.',
    pontos: ['2º EIC esquerdo', 'Desdobramento fisiológico de B2', 'Estenose na tetralogia de Fallot'],
  },
  {
    termos: ['septo interventricular'],
    resumo: 'Parede que separa os dois ventrículos, com uma porção muscular espessa e uma membranácea fina.',
    localizacao: 'Entre os ventrículos, com a parte membranácea logo abaixo da valva aórtica e a muscular formando o restante.',
    funcao: 'Separa as circulações e conduz, na sua porção subendocárdica, os ramos do feixe atrioventricular.',
    vascularizacao: 'Dois terços anteriores pela interventricular anterior; terço posterior pela interventricular posterior.',
    clinica:
      'A comunicação interventricular é a cardiopatia congênita mais comum e acomete tipicamente a porção membranácea. A ruptura do septo pós-infarto é complicação mecânica grave, com sopro holossistólico novo e choque.',
    pontos: ['Porção membranácea é o sítio da CIV congênita', 'Conduz os ramos do feixe atrioventricular', 'Ruptura pós-infarto é complicação mecânica'],
  },
  {
    termos: ['no sinoatrial', 'no sinusal', 'no atrioventricular', 'feixe atrioventricular', 'feixe de his', 'fibras de purkinje'],
    resumo: 'Componentes do sistema de condução cardíaco, responsáveis por gerar e distribuir o impulso.',
    localizacao:
      'O nó sinoatrial fica na crista terminal, junto à cava superior; o nó atrioventricular, no trígono de Koch do septo interatrial; o feixe atrioventricular desce pelo septo membranáceo e se divide em ramos direito e esquerdo, terminando nas fibras de Purkinje.',
    funcao:
      'O nó sinoatrial é o marca-passo fisiológico (60–100 bpm); o nó atrioventricular atrasa o impulso, permitindo o enchimento ventricular, e é a única via elétrica entre átrios e ventrículos.',
    vascularizacao: 'Coronária direita irriga o nó sinoatrial em ~60% e o atrioventricular em ~80% das pessoas.',
    inervacao: 'Vago reduz a frequência e a condução; simpático faz o oposto.',
    clinica:
      'O infarto de parede inferior (coronária direita) cursa com bradicardia e bloqueio atrioventricular. O trígono de Koch é a referência da ablação de via nodal e a zona de risco de bloqueio total na cirurgia valvar. As vias acessórias curto-circuitam o nó atrioventricular na síndrome de Wolff-Parkinson-White.',
    pontos: [
      'Nó sinoatrial na crista terminal; nó atrioventricular no trígono de Koch',
      'Coronária direita irriga ambos na maioria',
      'Infarto inferior e bloqueio atrioventricular',
    ],
  },
  {
    termos: ['pericardio'],
    resumo: 'Saco fibrosseroso que envolve o coração e as raízes dos grandes vasos.',
    localizacao: 'Pericárdio fibroso por fora, aderido ao centro tendíneo do diafragma, e seroso por dentro, com lâminas parietal e visceral (epicárdio).',
    funcao: 'Fixa o coração no mediastino, limita sua distensão aguda e reduz o atrito durante os batimentos.',
    vascularizacao: 'Artéria pericardicofrênica, ramo da torácica interna.',
    inervacao: 'Nervo frênico (C3–C5) — daí a dor pericárdica referida ao ombro e o alívio ao inclinar-se para a frente.',
    clinica:
      'Por ser inextensível de forma aguda, um acúmulo pequeno e rápido de líquido causa tamponamento cardíaco: tríade de Beck (hipotensão, turgência jugular e abafamento de bulhas) e pulso paradoxal. A pericardiocentese subxifóidea é o tratamento imediato.',
    pontos: ['Inervação frênica: dor referida no ombro', 'Tamponamento: tríade de Beck e pulso paradoxal', 'Pericardiocentese subxifóidea'],
  },

  /* ═══════════════════════ Respiratório e digestório ═══════════════════════ */
  {
    termos: ['traqueia'],
    resumo: 'Tubo cartilaginoso que conduz o ar da laringe aos brônquios principais.',
    localizacao: 'De C6 (borda inferior da cricoide) até a carina, em T4–T5, com 16 a 20 anéis incompletos e o músculo traqueal fechando a parede posterior, junto ao esôfago.',
    funcao: 'Conduz, aquece e umidifica o ar, e mantém a via aérea permanentemente aberta pela sustentação cartilaginosa.',
    vascularizacao: 'Artérias tireóideas inferiores em cima e brônquicas embaixo.',
    inervacao: 'Vago e laríngeos recorrentes; fibras simpáticas do tronco cervical.',
    clinica:
      'A traqueostomia eletiva é feita entre o 2º e o 4º anel. O desvio da traqueia é sinal de pneumotórax hipertensivo (empurra) ou atelectasia (puxa). A parede posterior membranácea é a que pode ser lesada na intubação difícil.',
    pontos: ['C6 até a carina em T4–T5', 'Traqueostomia entre o 2º e o 4º anel', 'Desvio traqueal: pneumotórax x atelectasia'],
  },
  {
    termos: ['bronquio principal direito', 'bronquio principal esquerdo', 'bronquio principal', 'carina'],
    resumo: 'Brônquios que nascem da bifurcação da traqueia na carina e entram nos pulmões pelos hilos.',
    localizacao: 'O direito é mais curto, largo e vertical; o esquerdo é mais longo, estreito e horizontal, por ter de contornar o coração.',
    funcao: 'Conduzem o ar até os brônquios lobares e segmentares, iniciando a árvore brônquica.',
    clinica:
      'A anatomia do brônquio direito explica dois fatos clínicos diários: corpos estranhos aspirados vão preferencialmente para ele, e a intubação profunda demais seleciona o pulmão direito, colapsando o esquerdo. A carina é o reparo broncoscópico e o alvo do posicionamento do tubo (2–4 cm acima).',
    pontos: ['Direito: curto, largo e vertical', 'Aspiração e intubação seletiva à direita', 'Ponta do tubo 2–4 cm acima da carina'],
  },
  {
    termos: ['epiglote'],
    resumo: 'Cartilagem elástica em forma de folha, na entrada da laringe.',
    localizacao: 'Atrás da raiz da língua, ligada à cartilagem tireóidea pelo ligamento tireoepiglótico; entre ela e a língua ficam as valéculas.',
    funcao: 'Fecha o ádito da laringe durante a deglutição, desviando o bolo alimentar para os seios piriformes e a laringofaringe.',
    vascularizacao: 'Artéria laríngea superior.',
    inervacao: 'Ramo interno do nervo laríngeo superior (do vago) — aferência do reflexo de tosse.',
    clinica:
      'A valécula é onde se apoia a lâmina curva do laringoscópio (Macintosh) para elevar indiretamente a epiglote; a lâmina reta (Miller) a eleva diretamente. A epiglotite aguda é emergência de via aérea na criança, com o sinal do polegar na radiografia cervical.',
    pontos: ['Valécula: apoio da lâmina Macintosh', 'Laríngeo superior interno (reflexo de tosse)', 'Epiglotite e sinal do polegar'],
  },
  {
    termos: ['prega vocal', 'pregas vocais', 'rima da glote', 'glote'],
    resumo: 'Pregas que delimitam a rima da glote — a parte mais estreita da via aérea do adulto.',
    localizacao: 'Entre a cartilagem tireóidea, à frente, e os processos vocais das aritenóideas, atrás.',
    funcao: 'Produzem o som pela vibração ao passar o ar e protegem a via aérea inferior fechando-se reflexamente.',
    inervacao: 'Motora pelo laríngeo recorrente (todos os músculos, exceto o cricotireóideo); sensitiva pelo laríngeo superior interno acima e pelo recorrente abaixo.',
    clinica:
      'A glote é o ponto mais estreito da via aérea do adulto (na criança, é a cricoide) — o que define o calibre do tubo orotraqueal. A paralisia recorrencial bilateral fecha a via aérea. A visualização das pregas é o padrão-ouro da confirmação da intubação.',
    pontos: ['Ponto mais estreito da via aérea do adulto', 'Cricoide é o mais estreito na criança', 'Laríngeo recorrente comanda a mobilidade'],
  },
  {
    termos: ['lingua'],
    resumo: 'Órgão musculoso da cavidade oral, essencial à mastigação, à deglutição, à gustação e à fala.',
    localizacao: 'No assoalho da boca, com corpo à frente e raiz atrás do sulco terminal, ancorada ao hioide e à mandíbula.',
    funcao: 'Manipula o bolo alimentar, inicia a deglutição, participa da articulação da fala e aloja os botões gustativos nas papilas.',
    vascularizacao: 'Artéria lingual, ramo da carótida externa.',
    inervacao:
      'Nos 2/3 anteriores: sensibilidade geral pelo lingual (V3) e gustação pela corda do tímpano (VII). No 1/3 posterior: ambas pelo glossofaríngeo (IX). Motricidade pelo hipoglosso (XII), exceto o palatoglosso (X).',
    clinica:
      'Na lesão do hipoglosso a língua protruída desvia para o lado da lesão ("a língua aponta a lesão"). A queda da língua é a causa mais comum de obstrução de via aérea no paciente inconsciente — corrigida pela elevação do mento ou tração da mandíbula.',
    pontos: [
      'Gustação anterior: VII (corda do tímpano); posterior: IX',
      'Motricidade: XII, exceto o palatoglosso (X)',
      'Língua desvia para o lado da lesão do XII',
    ],
  },
  {
    termos: ['lobo superior do pulmao', 'lobo medio do pulmao', 'lobo inferior do pulmao', 'lobo superior', 'lobo medio', 'lobo inferior', 'lingula'],
    classe: 'viscera',
    resumo: 'Divisão maior do pulmão, delimitada por fissuras e ventilada por um brônquio lobar próprio.',
    localizacao:
      'O pulmão direito tem três lobos (superior, médio e inferior), separados pelas fissuras oblíqua e horizontal; o esquerdo tem dois, separados apenas pela fissura oblíqua, com a língula como equivalente do lobo médio. Cada lobo se subdivide em segmentos broncopulmonares.',
    funcao: 'Recebe um brônquio lobar e realiza a hematose na sua porção alveolar, funcionando como unidade ventilatória relativamente independente.',
    vascularizacao:
      'Ramos lobares das artérias pulmonares levam o sangue venoso para as trocas; veias pulmonares devolvem o sangue arterializado ao átrio esquerdo. O parênquima em si é nutrido pelas artérias brônquicas, ramos da aorta torácica.',
    inervacao: 'Plexo pulmonar — vago (broncoconstrição e secreção) e simpático (broncodilatação).',
    linfaticos: 'Linfonodos pulmonares e broncopulmonares (hilares), depois traqueobrônquicos e paratraqueais.',
    relacoes:
      'O lobo superior direito e a língula esquerda encostam na parede torácica anterior; os lobos inferiores ocupam a maior parte da face posterior, o que muda o ponto de ausculta de cada um.',
    clinica:
      'A independência lobar é o que torna possível a lobectomia. Na ausculta, o lobo médio e a língula são ouvidos à frente e os lobos inferiores atrás — por isso auscultar só o dorso deixa passar consolidações anteriores. A pneumonia aspirativa em decúbito costuma acometer o segmento posterior do lobo superior direito e o segmento superior do lobo inferior direito.',
    pontos: [
      'Direito: 3 lobos (fissuras oblíqua e horizontal); esquerdo: 2 + língula',
      'Cada lobo tem brônquio lobar próprio — base da lobectomia',
      'Lobos inferiores auscultam-se no dorso; médio e língula, à frente',
    ],
  },
  {
    termos: ['esofago'],
    resumo: 'Tubo muscular de cerca de 25 cm que conduz o bolo alimentar da faringe ao estômago.',
    localizacao: 'De C6 até T10, atrás da traqueia e do átrio esquerdo, atravessando o hiato esofágico do diafragma.',
    funcao: 'Transporta o bolo por peristalse e impede o refluxo pelo esfíncter esofágico inferior, reforçado pelo pinçamento diafragmático.',
    vascularizacao: 'Tireóideas inferiores, ramos esofágicos da aorta e gástrica esquerda no terço distal.',
    inervacao: 'Plexos vagais e simpáticos; o terço superior é de músculo estriado, com controle voluntário inicial.',
    clinica:
      'Tem três estreitamentos — cricofaríngeo, cruzamento do arco aórtico/brônquio esquerdo e hiato diafragmático — onde impactam corpos estranhos e se concentram as lesões cáusticas. A anastomose portossistêmica do terço distal é a origem das varizes esofágicas.',
    pontos: ['Três estreitamentos anatômicos', 'C6 a T10; hiato esofágico em T10', 'Varizes por anastomose portossistêmica'],
  },
  {
    termos: ['estomago'],
    resumo: 'Dilatação do tubo digestório entre o esôfago e o duodeno, no andar supramesocólico.',
    localizacao: 'No hipocôndrio esquerdo e epigástrio, com cárdia, fundo, corpo, antro e piloro, curvatura menor à direita e maior à esquerda.',
    funcao: 'Armazena o alimento, secreta ácido e pepsina, mistura o conteúdo em quimo e o libera de forma controlada pelo piloro.',
    vascularizacao:
      'Gástrica esquerda e direita na curvatura menor, gastromental esquerda e direita na maior, gástricas curtas no fundo — todas do tronco celíaco.',
    inervacao: 'Vago (secreção e motilidade) e simpático pelo plexo celíaco, que conduz a dor visceral ao epigástrio.',
    clinica:
      'A úlcera da curvatura menor sangra pela gástrica esquerda; a da parede posterior do bulbo duodenal, pela gastroduodenal. A vagotomia reduz a secreção ácida. O câncer gástrico pode metastatizar para o linfonodo supraclavicular esquerdo (Virchow) e para o umbigo (nódulo da irmã Maria José).',
    pontos: ['Todos os ramos vêm do tronco celíaco', 'Dor visceral referida ao epigástrio', 'Linfonodo de Virchow no câncer gástrico'],
  },
  {
    termos: ['figado'],
    resumo: 'A maior glândula do corpo, no hipocôndrio direito, com dupla irrigação.',
    localizacao:
      'Sob a cúpula diafragmática direita, com lobos direito e esquerdo divididos anatomicamente pelo ligamento falciforme e funcionalmente pela linha de Cantlie, em oito segmentos de Couinaud.',
    funcao: 'Metaboliza nutrientes e fármacos, sintetiza proteínas e fatores de coagulação, produz bile e armazena glicogênio.',
    vascularizacao:
      'Dupla: artéria hepática própria (~25% do fluxo, 50% do oxigênio) e veia porta (~75% do fluxo). Drena pelas veias hepáticas direita, média e esquerda para a veia cava inferior.',
    inervacao: 'Plexo hepático; a cápsula é inervada e a distensão aguda dói no hipocôndrio direito, com irradiação ao ombro pelo frênico.',
    clinica:
      'A segmentação de Couinaud é o que torna possíveis as hepatectomias regradas. A dupla irrigação protege o fígado de infartos e explica por que metástases se nutrem preferencialmente da artéria (base da quimioembolização). A manobra de Pringle clampeia a tríade portal no ligamento hepatoduodenal.',
    pontos: ['Oito segmentos de Couinaud', 'Dupla irrigação: artéria hepática + veia porta', 'Manobra de Pringle no ligamento hepatoduodenal'],
  },
  {
    termos: ['vesicula biliar'],
    resumo: 'Reservatório em forma de pera na face visceral do fígado, que armazena e concentra a bile.',
    localizacao: 'Na fossa da vesícula, entre os lobos hepáticos direito e quadrado, com fundo, corpo, infundíbulo e colo, seguido do ducto cístico.',
    funcao: 'Armazena e concentra a bile entre as refeições e a libera na presença de gordura, por ação da colecistocinina.',
    vascularizacao: 'Artéria cística, ramo da artéria hepática direita, dentro do trígono de Calot.',
    inervacao: 'Plexo celíaco; a dor biliar é referida ao epigástrio e ao hipocôndrio direito, com irradiação à escápula.',
    clinica:
      'O sinal de Murphy (interrupção da inspiração à palpação do ponto cístico) sugere colecistite. O trígono de Calot (ducto cístico, hepático comum e borda hepática) é a referência de segurança da colecistectomia laparoscópica, onde se identifica a artéria cística.',
    pontos: ['Trígono de Calot e artéria cística', 'Sinal de Murphy', 'Dor referida na escápula direita'],
  },
  {
    termos: ['pancreas'],
    resumo: 'Glândula mista retroperitoneal, com função exócrina digestiva e endócrina metabólica.',
    localizacao: 'Cruza o retroperitônio de L1–L2, da alça duodenal (cabeça e processo uncinado) até o hilo esplênico (cauda), com colo, corpo e cauda.',
    funcao:
      'Exócrino: secreta enzimas e bicarbonato no duodeno pelo ducto pancreático. Endócrino: as ilhotas pancreáticas produzem insulina, glucagon e somatostatina.',
    vascularizacao: 'Artérias pancreatoduodenais superiores (gastroduodenal) e inferiores (mesentérica superior) e ramos da esplênica.',
    inervacao: 'Plexo celíaco; a dor pancreática é epigástrica com irradiação em faixa para o dorso, aliviando na posição genupeitoral.',
    relacoes: 'A veia mesentérica superior e a esplênica se unem atrás do colo do pâncreas para formar a veia porta; o colédoco atravessa a cabeça.',
    clinica:
      'O tumor de cabeça de pâncreas comprime o colédoco e causa icterícia obstrutiva indolor com vesícula palpável (sinal de Courvoisier). A pancreatite pode gerar coleções que dissecam o retroperitônio e sinais de Grey Turner e Cullen.',
    pontos: ['Retroperitoneal, cruza L1–L2', 'Colédoco atravessa a cabeça — icterícia obstrutiva', 'Veia porta se forma atrás do colo'],
  },
  {
    termos: ['apendice vermiforme', 'apendice'],
    resumo: 'Divertículo cego que nasce do ceco, com posição variável e rica em tecido linfoide.',
    localizacao: 'Na convergência das tênias do cólon, na face posteromedial do ceco; a ponta é mais frequentemente retrocecal, mas pode ser pélvica ou subcecal.',
    funcao: 'Tecido linfoide associado ao intestino, com papel imunológico e de reservatório da microbiota.',
    vascularizacao: 'Artéria apendicular, ramo terminal da ileocólica — uma artéria terminal, sem colaterais.',
    inervacao: 'Dor visceral referida a T10 (região periumbilical); quando a inflamação alcança o peritônio parietal, a dor migra e localiza-se.',
    clinica:
      'A migração da dor da região periumbilical para a fossa ilíaca direita, no ponto de McBurney, é a tradução perfeita dessa inervação dupla. O apêndice retrocecal dá sinal do psoas positivo; o pélvico, sinal do obturador. Ser artéria terminal explica a rápida evolução para gangrena.',
    pontos: [
      'Base na convergência das tênias do cólon',
      'Dor visceral T10 → parietal em McBurney',
      'Artéria apendicular é terminal: gangrena rápida',
    ],
  },
  {
    termos: ['duodeno'],
    resumo: 'Primeira porção do intestino delgado, em forma de C em torno da cabeça do pâncreas.',
    localizacao:
      'Quatro porções: superior (bulbo, intraperitoneal), descendente (com a papila duodenal maior), horizontal (cruzada pela mesentérica superior) e ascendente, terminando na flexura duodenojejunal, fixada pelo ligamento de Treitz.',
    funcao: 'Recebe o quimo, a bile e o suco pancreático, neutraliza a acidez e inicia a digestão intestinal.',
    vascularizacao: 'Pancreatoduodenais superiores (tronco celíaco) e inferiores (mesentérica superior) — a fronteira entre intestino anterior e médio.',
    clinica:
      'O ligamento de Treitz é o divisor entre hemorragia digestiva alta e baixa. A úlcera do bulbo é a mais comum e, quando posterior, sangra pela gastroduodenal; quando anterior, perfura. A terceira porção pode ser comprimida entre a aorta e a mesentérica superior.',
    pontos: ['Ligamento de Treitz divide HDA de HDB', 'Papila duodenal maior na segunda porção', 'Úlcera posterior sangra, anterior perfura'],
  },
  {
    termos: ['rim', 'rins'],
    resumo: 'Órgãos retroperitoneais em forma de feijão, responsáveis pela filtração do sangue e pela formação da urina.',
    localizacao: 'Entre T12 e L3, o direito mais baixo pelo fígado, envolvidos por cápsula, gordura perirrenal e fáscia renal (de Gerota).',
    funcao: 'Filtram o plasma, regulam volume, eletrólitos e equilíbrio acidobásico e produzem eritropoetina, renina e calcitriol.',
    vascularizacao: 'Artéria renal (L1–L2) e suas segmentares terminais; veia renal para a cava, com a esquerda passando entre aorta e mesentérica superior.',
    inervacao: 'Plexo renal (T10–L1); a dor renal é referida ao flanco e ao ângulo costovertebral.',
    clinica:
      'O sinal de Giordano (punho-percussão do ângulo costovertebral) sugere pielonefrite. A biópsia renal é feita no polo inferior, que tem menos vasos. As artérias segmentares serem terminais explica os infartos renais segmentares bem delimitados.',
    pontos: ['T12–L3, retroperitoneais; direito mais baixo', 'Artérias segmentares terminais', 'Sinal de Giordano'],
  },
  {
    termos: ['ureter'],
    resumo: 'Tubo muscular retroperitoneal de 25–30 cm que conduz a urina do rim à bexiga.',
    localizacao: 'Desce sobre o psoas maior, cruza os vasos ilíacos na bifurcação e entra obliquamente na parede da bexiga.',
    funcao: 'Conduz a urina por peristalse, e sua entrada oblíqua na bexiga funciona como válvula antirrefluxo.',
    vascularizacao: 'Ramos das artérias renal, gonadal, aorta, ilíacas e vesical inferior — irrigação segmentar longitudinal.',
    inervacao: 'Plexos renal, aórtico e hipogástrico; a dor é referida em cólica do flanco à região inguinal e à genitália.',
    relacoes: 'Na mulher, passa sob a artéria uterina ("a água passa sob a ponte"); no homem, sob o ducto deferente.',
    clinica:
      'Os três estreitamentos — junção ureteropélvica, cruzamento dos vasos ilíacos e junção ureterovesical — são onde o cálculo impacta. A relação com a artéria uterina é a causa clássica de lesão ureteral em histerectomia.',
    pontos: [
      'Três estreitamentos anatômicos',
      '"A água passa sob a ponte" (ureter sob a artéria uterina)',
      'Entrada oblíqua na bexiga é antirrefluxo',
    ],
  },
  {
    termos: ['prostata'],
    resumo: 'Glândula acessória masculina que envolve a uretra prostática, abaixo da bexiga.',
    localizacao: 'Entre o colo vesical e o diafragma urogenital, atrás da sínfise púbica e à frente do reto — palpável ao toque retal.',
    funcao: 'Produz a secreção alcalina que compõe cerca de 30% do sêmen, protegendo os espermatozoides da acidez vaginal.',
    vascularizacao: 'Artérias vesicais inferiores e retais médias; plexo venoso prostático comunicante com o plexo vertebral de Batson.',
    inervacao: 'Plexo prostático, com os feixes neurovasculares posterolaterais responsáveis pela ereção.',
    clinica:
      'A hiperplasia benigna acomete a zona de transição e obstrui a uretra; o adenocarcinoma nasce na zona periférica, e por isso é palpável ao toque retal. A comunicação com o plexo de Batson explica as metástases vertebrais osteoblásticas. A preservação dos feixes neurovasculares é o objetivo da prostatectomia nerve-sparing.',
    pontos: [
      'Zona de transição = hiperplasia; zona periférica = câncer',
      'Palpável ao toque retal',
      'Plexo de Batson e metástase vertebral osteoblástica',
    ],
  },
  {
    termos: ['utero'],
    resumo: 'Órgão muscular oco da pelve feminina, onde se implanta e se desenvolve o embrião.',
    localizacao: 'Entre a bexiga e o reto, em anteversoflexão na maioria das mulheres, com fundo, corpo, istmo e colo, sustentado pelos ligamentos largo, redondo e uterossacrais.',
    funcao: 'Recebe o blastocisto, abriga a gestação e, pelo miométrio, gera as contrações do parto.',
    vascularizacao: 'Artéria uterina (ilíaca interna), que cruza por cima do ureter, com anastomose com a artéria ovárica.',
    inervacao: 'Plexo uterovaginal; a dor do corpo sobe por T10–L1 e a do colo, por S2–S4 — base da analgesia em dois tempos no trabalho de parto.',
    linfaticos: 'Fundo para linfonodos lombares; corpo para ilíacos externos; colo para ilíacos internos, obturatórios e sacrais.',
    clinica:
      'A relação ureter–artéria uterina é a causa clássica de lesão ureteral em histerectomia. A drenagem linfática distinta explica os campos de linfadenectomia no câncer de colo e de endométrio. O ligamento redondo termina no lábio maior, o que explica a dor inguinal na gestação.',
    pontos: [
      '"A água passa sob a ponte": ureter sob a artéria uterina',
      'Dor do corpo T10–L1; do colo S2–S4',
      'Drenagem linfática diferente por segmento',
    ],
  },
  {
    termos: ['ovario'],
    resumo: 'Gônada feminina, produtora de ovócitos e de hormônios sexuais.',
    localizacao: 'Na fossa ovárica da parede lateral da pelve, suspenso pelo ligamento suspensor (que carrega os vasos gonadais) e ligado ao útero pelo ligamento próprio.',
    funcao: 'Abriga os folículos, libera o ovócito na ovulação e produz estrogênio e progesterona.',
    vascularizacao: 'Artéria ovárica, ramo direto da aorta em L2. Veia ovárica direita para a cava inferior; a esquerda, para a veia renal esquerda.',
    inervacao: 'Plexo ovárico (T10–T11) — a dor ovárica é referida à região periumbilical e ao flanco.',
    linfaticos: 'Linfonodos lombares (para-aórticos), acompanhando os vasos gonadais — e não os inguinais.',
    clinica:
      'A origem abdominal alta explica por que a dor da torção ovárica pode simular apendicite e por que o estadiamento do câncer de ovário é retroperitoneal. A torção compromete primeiro o retorno venoso, e a viabilidade pode ser recuperada com destorção precoce.',
    pontos: ['Artéria ovárica sai da aorta em L2', 'Drenagem linfática para-aórtica', 'Dor referida periumbilical (T10)'],
  },
  {
    termos: ['testiculo'],
    resumo: 'Gônada masculina, alojada no escroto, produtora de espermatozoides e testosterona.',
    localizacao: 'No escroto, envolvido pela túnica vaginal, com o epidídimo em sua face posterolateral e o funículo espermático acima.',
    funcao: 'Espermatogênese nos túbulos seminíferos e produção de testosterona pelas células intersticiais.',
    vascularizacao: 'Artéria testicular, ramo direto da aorta em L2; plexo pampiniforme e veia testicular — direita para a cava, esquerda para a renal esquerda.',
    inervacao: 'Plexo testicular (T10–T11); a dor testicular é referida à região periumbilical.',
    linfaticos: 'Linfonodos lombares (para-aórticos) — a pele do escroto é que drena para os inguinais.',
    clinica:
      'A dissociação linfática é decisiva no estadiamento: tumor de testículo se estadia no retroperitônio. A torção testicular é emergência de horas, com abolição do reflexo cremastérico e elevação do testículo — o sinal de Prehn ajuda a diferenciar de epididimite.',
    pontos: [
      'Vasos e linfáticos acompanham a origem abdominal (L2)',
      'Testículo drena para para-aórticos; escroto para inguinais',
      'Torção: reflexo cremastérico abolido, emergência cirúrgica',
    ],
  },
  {
    termos: ['bexiga urinaria', 'bexiga'],
    resumo: 'Reservatório muscular da urina, na pelve, atrás da sínfise púbica.',
    localizacao: 'Subperitoneal; vazia, é pélvica, e ao encher sobe para o abdome, descolando o peritônio da parede anterior.',
    funcao: 'Armazena a urina em baixa pressão pela complacência do detrusor e a expulsa na micção coordenada com o relaxamento esfincteriano.',
    vascularizacao: 'Artérias vesicais superior e inferior, ramos da ilíaca interna.',
    inervacao:
      'Parassimpático S2–S4 contrai o detrusor (esvaziamento); simpático L1–L2 mantém o enchimento e fecha o esfíncter interno; nervo pudendo comanda o esfíncter externo voluntário.',
    clinica:
      'A bexiga cheia sobe acima do púbis, permitindo punção suprapúbica sem atravessar o peritônio. O trígono é a região de maior incidência de tumor urotelial. A bexiga neurogênica se explica pelo mapa de inervação acima.',
    pontos: ['Cheia, sobe acima do púbis: punção suprapúbica', 'S2–S4 esvazia; simpático enche', 'Trígono: sítio dos tumores uroteliais'],
  },
  {
    termos: ['pleura', 'pleura parietal', 'pleura visceral', 'recesso costodiafragmatico'],
    resumo: 'Membrana serosa dupla que reveste o pulmão e a cavidade torácica.',
    localizacao: 'A pleura visceral adere ao pulmão e a parietal forra a parede, o diafragma e o mediastino, refletindo-se no hilo. Entre elas, a cavidade pleural virtual.',
    funcao: 'Permite o deslizamento do pulmão e mantém, pela pressão negativa, a aposição do pulmão à parede — condição da expansão pulmonar.',
    vascularizacao: 'Parietal pelas intercostais e torácica interna; visceral pelas artérias brônquicas.',
    inervacao:
      'A parietal é inervada pelos nervos intercostais e frênico e dói de forma localizada (dor pleurítica); a visceral não tem inervação somática.',
    clinica:
      'O recesso costodiafragmático é o ponto mais baixo e onde o derrame se acumula — sítio da toracocentese, feita no 5º ao 7º espaço intercostal na linha axilar média, sempre pela borda superior da costela. O pneumotórax hipertensivo desloca o mediastino e é diagnóstico clínico, não radiológico.',
    pontos: [
      'Só a parietal dói (dor pleurítica)',
      'Recesso costodiafragmático: onde o derrame se acumula',
      'Puncionar pela borda superior da costela inferior',
    ],
  },
  {
    termos: ['peritonio', 'cavidade peritoneal'],
    resumo: 'A maior membrana serosa do corpo, revestindo a cavidade abdominal e suas vísceras.',
    localizacao: 'Lâmina parietal forrando a parede abdominal e lâmina visceral cobrindo os órgãos, com mesos, omentos e ligamentos ligando os dois.',
    funcao: 'Permite o deslizamento das vísceras, conduz seus vasos e nervos pelos mesos e, pelo omento maior, limita a disseminação de processos inflamatórios.',
    inervacao:
      'O peritônio parietal recebe nervos somáticos (intercostais e frênico) e dói de forma bem localizada; o visceral responde apenas a distensão e isquemia, com dor difusa referida à linha média.',
    clinica:
      'A transição da dor visceral difusa para a dor parietal localizada, com defesa e descompressão dolorosa, é o marco clínico da peritonite — e o raciocínio central da apendicite. A escavação retovesical (homem) e a retouterina (mulher) são os pontos mais baixos, onde as coleções se acumulam.',
    pontos: [
      'Parietal dói localizado; visceral dói difuso e referido',
      'Fundo de saco de Douglas acumula coleções',
      'Omento maior como "polícia do abdome"',
    ],
  },
]

