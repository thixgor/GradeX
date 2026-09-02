import type { EntradaDicionario } from './tipos'

/**
 * Crânio, face e pescoço.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const CRANIO_FACE: EntradaDicionario[] = [
  {
    termos: ['Osso Frontal'],
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
    termos: ['Osso Parietal'],
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
    termos: ['Osso Occipital', 'Parte Basilar do Osso Occipital'],
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
    termos: ['Osso Temporal'],
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
    termos: ['Osso Esfenoide', 'Asa Maior do Esfenoide', 'Asa Menor do Esfenoide'],
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
    termos: ['Osso Zigomático', 'Arco Zigomático'],
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
    termos: ['Osso Maxilar'],
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
    termos: ['Osso Nasal'],
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
    termos: ['Órbita'],
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
    termos: ['Fissura Orbital Superior'],
    resumo: 'Fenda entre as asas maior e menor do esfenoide, comunicando a órbita com a fossa craniana média.',
    localizacao: 'No ápice da órbita, lateralmente ao canal óptico.',
    funcao: 'Dá passagem aos nervos oculomotor (III), troclear (IV), oftálmico (V1) e abducente (VI) e à veia oftálmica superior.',
    clinica:
      'A síndrome da fissura orbital superior combina oftalmoplegia completa, ptose, midríase e anestesia da fronte. Se houver também perda visual, o canal óptico está envolvido — é a síndrome do ápice orbitário.',
    pontos: ['III, IV, V1, VI e veia oftálmica superior', 'Separa asa maior de asa menor do esfenoide', 'Síndrome do ápice orbitário quando inclui o II'],
  },
  {
    termos: ['Fissura Orbital Inferior'],
    resumo: 'Fenda entre a asa maior do esfenoide e a maxila, comunicando a órbita com as fossas pterigopalatina e infratemporal.',
    localizacao: 'Entre o assoalho e a parede lateral da órbita, posteriormente.',
    funcao: 'Dá passagem ao nervo infraorbital e ao nervo zigomático (V2), a ramos da artéria maxilar e à veia oftálmica inferior.',
    clinica: 'É a via de disseminação de tumores da fossa infratemporal para a órbita e um corredor cirúrgico de acesso à fossa pterigopalatina.',
    pontos: ['Comunica órbita com fossa pterigopalatina', 'V2 e veia oftálmica inferior', 'Via de disseminação tumoral'],
  },
  {
    termos: ['Forame Magno'],
    resumo: 'A maior abertura da base do crânio, no osso occipital, onde a cavidade craniana se continua com o canal vertebral.',
    localizacao: 'No centro da parte basilar/lateral do occipital, entre os côndilos occipitais.',
    funcao:
      'Dá passagem à transição bulbomedular, às artérias vertebrais e espinais, às raízes espinais do nervo acessório (XI) e às membranas tectória e ligamentos que estabilizam a junção craniovertebral.',
    clinica:
      'A herniação das tonsilas cerebelares por ele comprime o bulbo — apneia, bradicardia e morte. A malformação de Chiari é definida pela descida das tonsilas através dele.',
    pontos: ['Transição bulbomedular', 'Artérias vertebrais e raízes espinais do XI', 'Herniação tonsilar e Chiari'],
  },
  {
    termos: ['Forame Oval'],
    resumo: 'Abertura da asa maior do esfenoide para a fossa infratemporal.',
    localizacao: 'Na fossa craniana média, posterolateralmente ao forame redondo.',
    funcao: 'Dá passagem ao nervo mandibular (V3) e à artéria meníngea acessória.',
    clinica: 'É a via de acesso percutâneo ao gânglio trigeminal na rizotomia por radiofrequência para neuralgia do trigêmeo.',
    pontos: ['V3 — nervo mandibular', 'Acesso percutâneo ao gânglio trigeminal', 'Vizinho ao forame espinhoso'],
  },
  {
    termos: ['Forame Espinhoso'],
    resumo: 'Pequeno forame da asa maior do esfenoide, atrás do forame oval.',
    localizacao: 'Fossa craniana média, posterolateral ao forame oval.',
    funcao: 'Dá passagem à artéria meníngea média e ao ramo meníngeo de V3.',
    clinica: 'Sua ligadura ou embolização controla o sangramento da meníngea média; a fratura na região do ptério rompe justamente esse vaso.',
    pontos: ['Artéria meníngea média', 'Relação com o hematoma extradural', 'Reparo cirúrgico da fossa média'],
  },
  {
    termos: ['Forame Redondo'],
    resumo: 'Canal da asa maior do esfenoide que liga a fossa craniana média à fossa pterigopalatina.',
    localizacao: 'Fossa craniana média, à frente e medialmente ao forame oval.',
    funcao: 'Dá passagem ao nervo maxilar (V2).',
    clinica: 'É o corredor de disseminação perineural de tumores da face (carcinoma adenoide cístico, carcinoma espinocelular) rumo à cavidade craniana.',
    pontos: ['V2 — nervo maxilar', 'Comunica com a fossa pterigopalatina', 'Via de disseminação perineural'],
  },
  {
    termos: ['Forame Jugular'],
    resumo: 'Abertura entre o temporal e o occipital, na base do crânio.',
    localizacao: 'Fossa craniana posterior, lateralmente ao forame magno.',
    funcao: 'Dá passagem aos nervos glossofaríngeo (IX), vago (X) e acessório (XI) e ao início da veia jugular interna, continuação do seio sigmóideo.',
    clinica:
      'A síndrome do forame jugular (Vernet) combina disfagia, disfonia, perda do reflexo do vômito e fraqueza do trapézio e do esternocleidomastóideo. O glomus jugulare é o tumor típico da região.',
    pontos: ['IX, X, XI e veia jugular interna', 'Síndrome de Vernet', 'Continuação do seio sigmóideo'],
  },
  {
    termos: ['Meato Acústico Externo'],
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
    termos: ['Dorso da Sela', 'Fossa Hipofisária'],
    resumo: 'Depressão em forma de sela no corpo do esfenoide, que aloja a hipófise.',
    localizacao: 'No centro da fossa craniana média, entre os processos clinoides anteriores e posteriores, com o dorso da sela atrás.',
    funcao: 'Abriga e protege a glândula hipófise, ligada ao hipotálamo pelo infundíbulo através do diafragma da sela.',
    relacoes: 'Acima, o quiasma óptico; lateralmente, os seios cavernosos com a carótida interna e os nervos oculomotores; abaixo, o seio esfenoidal.',
    clinica:
      'O adenoma hipofisário que cresce para cima comprime o quiasma e produz hemianopsia bitemporal. A apoplexia hipofisária é emergência endócrina. O acesso cirúrgico padrão é transesfenoidal, pelo nariz.',
    pontos: ['Aloja a hipófise', 'Quiasma óptico logo acima', 'Seios cavernosos lateralmente'],
  },
  {
    termos: ['Processo Mastoide'],
    resumo: 'Saliência cônica pneumatizada do osso temporal, atrás da orelha.',
    localizacao: 'Posteroinferior ao meato acústico externo, palpável atrás do pavilhão auricular.',
    funcao: 'Dá inserção ao esternocleidomastóideo, ao esplênio da cabeça e ao longuíssimo da cabeça, e contém células aéreas em comunicação com a orelha média.',
    relacoes: 'Internamente, o seio sigmóideo escava sua face medial; o nervo facial emerge no forame estilomastóideo, à sua frente e medialmente.',
    clinica:
      'A mastoidite é a complicação clássica da otite média não tratada, com dor, edema e desvio do pavilhão. O sinal de Battle (equimose retroauricular) sugere fratura de base do crânio.',
    pontos: ['Inserção do esternocleidomastóideo', 'Células mastóideas comunicam-se com a orelha média', 'Relação com seio sigmóideo e nervo facial'],
  },
  {
    termos: ['Processo Estiloide'],
    resumo: 'Projeção fina e pontiaguda do osso temporal, à frente do processo mastoide.',
    localizacao: 'Inferiormente à parte petrosa do temporal, apontando para baixo e para a frente.',
    funcao: 'Dá inserção ao aparelho estiloide: músculos estilo-hióideo, estiloglosso e estilofaríngeo, e ligamentos estilo-hióideo e estilomandibular.',
    clinica: 'O alongamento do processo ou a calcificação do ligamento estilo-hióideo causa a síndrome de Eagle: dor cervicofacial e disfagia, agravadas pela rotação da cabeça.',
    pontos: ['Três músculos e dois ligamentos', 'Síndrome de Eagle', 'Vizinho ao forame estilomastóideo'],
  },
  {
    termos: ['Forame Mentual'],
    resumo: 'Abertura na face lateral do corpo da mandíbula, saída do nervo mentual.',
    localizacao: 'Geralmente na vertical do segundo pré-molar inferior, a meio caminho entre as bordas alveolar e inferior da mandíbula.',
    funcao: 'Dá passagem ao nervo e aos vasos mentuais, que inervam a pele do mento e do lábio inferior e a mucosa gengival anterior.',
    clinica:
      'É o ponto do bloqueio do nervo mentual. No paciente desdentado, a reabsorção do rebordo alveolar aproxima o forame da borda superior, expondo o nervo à compressão pela prótese.',
    pontos: ['Nervo mentual, ramo do alveolar inferior (V3)', 'Referência no segundo pré-molar', 'Reabsorção alveolar aproxima o nervo da superfície'],
  },
  {
    termos: ['Forame Infraorbital'],
    resumo: 'Abertura na face anterior da maxila, abaixo da margem infraorbital.',
    localizacao: 'Cerca de 1 cm abaixo da margem infraorbital, alinhado com o forame supraorbital e o forame mentual.',
    funcao: 'Dá passagem ao nervo e aos vasos infraorbitais, para a pele da pálpebra inferior, asa do nariz e lábio superior.',
    clinica: 'É o ponto do bloqueio infraorbital, e a hipoestesia nesse território é sinal cardinal da fratura do assoalho da órbita ou do complexo zigomático-maxilar.',
    pontos: ['Nervo infraorbital (V2)', 'Alinhado com supraorbital e mentual', 'Hipoestesia sinaliza fratura orbitária'],
  },
  {
    termos: ['Ptérion'],
    resumo: 'Ponto craniométrico onde se encontram frontal, parietal, temporal e a asa maior do esfenoide.',
    localizacao: 'Na face lateral do crânio, cerca de 4 cm acima do arco zigomático e 3 cm atrás do processo frontal do zigomático.',
    funcao: 'Marca a região de menor espessura da calvária e projeta, por fora, o trajeto do ramo anterior da artéria meníngea média e o sulco lateral do cérebro.',
    clinica:
      'É o sítio clássico do hematoma extradural: um trauma temporal fratura a lâmina fina e rompe a meníngea média, com intervalo lúcido seguido de deterioração. É também a referência da craniotomia pterional, o acesso mais usado a aneurismas do polígono de Willis.',
    pontos: ['Quatro ossos se encontram', 'Ramo anterior da meníngea média por baixo', 'Craniotomia pterional'],
  },
  {
    termos: ['Astérion'],
    resumo: 'Ponto craniométrico onde se encontram parietal, occipital e temporal.',
    localizacao: 'Na face lateral e posterior do crânio, no encontro das suturas lambdóidea, occipitomastóidea e parietomastóidea.',
    funcao: 'Projeta, por fora, a junção entre os seios transverso e sigmóideo.',
    clinica: 'É a referência das craniotomias retrossigmóideas para a fossa posterior e para o ângulo pontocerebelar — perfurar acima dele arrisca o seio transverso.',
    pontos: ['Três ossos se encontram', 'Projeta a junção transverso-sigmóidea', 'Referência da craniotomia retrossigmóidea'],
  },
  {
    termos: ['Bregma'],
    resumo: 'Ponto craniométrico no encontro das suturas coronal e sagital.',
    localizacao: 'No teto do crânio, na linha média, onde a sutura coronal cruza a sagital.',
    funcao: 'Corresponde, no recém-nascido, ao fontículo anterior — a moleira grande.',
    clinica: 'É a referência de posicionamento em neurocirurgia estereotáxica e no acesso ao ventrículo lateral pelo ponto de Kocher, imediatamente à frente e lateralmente a ele.',
    pontos: ['Suturas coronal e sagital', 'Corresponde ao fontículo anterior', 'Referência da ventriculostomia'],
  },
  {
    termos: ['Lambda'],
    resumo: 'Ponto craniométrico no encontro das suturas sagital e lambdóidea.',
    localizacao: 'Na parte posterior do teto do crânio, na linha média.',
    funcao: 'Corresponde, no recém-nascido, ao fontículo posterior.',
    clinica: 'Serve de referência posterior nas medidas craniométricas e no planejamento de acessos occipitais.',
    pontos: ['Suturas sagital e lambdóidea', 'Corresponde ao fontículo posterior', 'Ossos suturais (wormianos) são comuns aqui'],
  },
  {
    termos: ['Násio', 'Násion'],
    resumo: 'Ponto craniométrico na sutura frontonasal, na raiz do nariz.',
    localizacao: 'Na linha média, na depressão entre a glabela e o dorso do nariz.',
    funcao: 'Serve de origem para praticamente todas as medidas cefalométricas do plano sagital.',
    clinica: 'É referência obrigatória em cefalometria ortodôntica, em cirurgia ortognática e em neuronavegação.',
    pontos: ['Sutura frontonasal', 'Origem das medidas cefalométricas', 'Reparo palpável na linha média'],
  },
  {
    termos: ['Ínion'],
    resumo: 'Ponto craniométrico na protuberância occipital externa.',
    localizacao: 'Na linha média, na saliência palpável da parte posterior do crânio.',
    funcao: 'Corresponde, por dentro, à confluência dos seios da dura-máter.',
    clinica: 'Reparo do eletroencefalograma (posição Oz do sistema 10-20) e referência para a craniotomia occipital, onde a proximidade da confluência dos seios exige cuidado.',
    pontos: ['Protuberância occipital externa', 'Projeta a confluência dos seios', 'Reparo do sistema 10-20 do EEG'],
  },
  {
    termos: ['Básion'],
    resumo: 'Ponto craniométrico na margem anterior do forame magno, na linha média.',
    localizacao: 'Borda anterior do forame magno, na parte basilar do occipital.',
    funcao: 'Define, junto ao ópistio, o diâmetro anteroposterior do forame magno.',
    clinica: 'É a referência das medidas de estabilidade da junção craniovertebral (linha de Wackenheim, intervalo básio-dental) usadas para reconhecer luxação atlantoccipital.',
    pontos: ['Margem anterior do forame magno', 'Medidas da junção craniovertebral', 'Par com o ópistio'],
  },
  {
    termos: ['Gônion'],
    resumo: 'Ponto craniométrico no ângulo da mandíbula.',
    localizacao: 'No ponto mais posteroinferior do ângulo mandibular, palpável abaixo do lobo da orelha.',
    funcao: 'Define a largura bigoníaca da face e marca a inserção do masseter e do pterigóideo medial.',
    clinica: 'Reparo palpável do exame da mandíbula e do bloqueio anestésico; o ângulo é sítio frequente de fratura mandibular, sobretudo com terceiro molar incluso.',
    pontos: ['Ângulo da mandíbula', 'Inserção de masseter e pterigóideo medial', 'Sítio frequente de fratura'],
  },
  {
    termos: ['Vértex'],
    resumo: 'O ponto mais alto do crânio em posição anatômica.',
    localizacao: 'Na linha média da calvária, geralmente sobre a sutura sagital.',
    funcao: 'Define a altura máxima do crânio nas medidas antropométricas.',
    clinica: 'Em obstetrícia, apresentação de vértice é a apresentação cefálica fletida — a mais favorável ao parto vaginal.',
    pontos: ['Ponto mais alto da calvária', 'Sobre a sutura sagital', 'Apresentação de vértice em obstetrícia'],
  },
  {
    termos: ['Glabela'],
    resumo: 'Saliência lisa entre os arcos superciliares, acima da raiz do nariz.',
    localizacao: 'Na linha média do osso frontal, entre as sobrancelhas e acima do násio.',
    funcao: 'Ponto mais anterior da fronte no plano sagital; nela se inserem os músculos prócero e corrugador do supercílio.',
    clinica: 'É o alvo do reflexo glabelar (sinal de Myerson, persistente no parkinsonismo) e área frequente de aplicação de toxina botulínica.',
    pontos: ['Entre os arcos superciliares', 'Reflexo glabelar', 'Inserção do prócero'],
  },
  {
    termos: ['Fontículo Anterior'],
    resumo: 'A moleira grande — fontículo losangular no encontro das suturas coronal, sagital e metópica.',
    localizacao: 'No teto do crânio, na linha média, na posição do futuro bregma.',
    funcao: 'Permite o cavalgamento dos ossos no parto e acomoda o crescimento encefálico rápido do primeiro ano.',
    clinica:
      'Fecha entre 18 e 24 meses. Abaulado e tenso, sugere hipertensão intracraniana (meningite, hidrocefalia); deprimido, desidratação. É a janela do ultrassom transfontanelar do neonato.',
    pontos: ['Losangular, fecha em 18–24 meses', 'Janela do ultrassom transfontanelar', 'Tensão avalia pressão intracraniana e hidratação'],
  },
  {
    termos: ['Fontículo Posterior'],
    resumo: 'Fontículo triangular no encontro das suturas sagital e lambdóidea.',
    localizacao: 'Na parte posterior do teto do crânio, na posição do futuro lambda.',
    funcao: 'Participa da moldagem da cabeça no canal de parto.',
    clinica:
      'Fecha bem cedo, por volta de 2 a 3 meses. Na obstetrícia, sua palpação ao toque identifica a variedade de posição do polo cefálico durante o trabalho de parto.',
    pontos: ['Triangular, fecha em 2–3 meses', 'Reparo do toque obstétrico', 'Futuro lambda'],
  },
  {
    termos: ['Diâmetro Suboccipitobregmático'],
    resumo: 'Diâmetro do polo cefálico entre o subocciput e o bregma — o menor e mais favorável.',
    localizacao: 'Medido do ponto abaixo da protuberância occipital externa até o bregma, com a cabeça bem fletida.',
    funcao: 'Representa a circunferência que se apresenta ao canal de parto na apresentação de vértice, com flexão completa.',
    clinica: 'Mede cerca de 9,5 cm. É o diâmetro da apresentação mais favorável — a razão pela qual as manobras obstétricas buscam flexão da cabeça fetal.',
    pontos: ['≈ 9,5 cm', 'Apresentação de vértice (flexão completa)', 'O menor diâmetro cefálico de apresentação'],
  },
  {
    termos: ['Diâmetro Suboccipitofrontal'],
    resumo: 'Diâmetro do polo cefálico entre o subocciput e a fronte.',
    localizacao: 'Do subocciput à glabela/fronte, com flexão incompleta da cabeça.',
    funcao: 'Corresponde à apresentação de bregma, com flexão intermediária.',
    clinica: 'Mede cerca de 10,5 cm — maior que o suboccipitobregmático, e por isso associado a trabalho de parto mais difícil.',
    pontos: ['≈ 10,5 cm', 'Flexão incompleta', 'Apresentação de bregma'],
  },
  {
    termos: ['Diâmetro Occipitofrontal'],
    resumo: 'Diâmetro entre a protuberância occipital externa e a glabela.',
    localizacao: 'Medido no plano sagital, com a cabeça em posição indiferente.',
    funcao: 'É também o diâmetro usado para calcular o perímetro cefálico do recém-nascido.',
    clinica: 'Mede cerca de 11,5 cm. É o diâmetro do perímetro cefálico aferido na sala de parto e acompanhado nas curvas de crescimento.',
    pontos: ['≈ 11,5 cm', 'Base do perímetro cefálico', 'Cabeça em posição indiferente'],
  },
  {
    termos: ['Diâmetro Occipitomentoniano'],
    resumo: 'Diâmetro entre a protuberância occipital e o mento — o maior diâmetro cefálico.',
    localizacao: 'Do occipúcio ao mento, com a cabeça em deflexão parcial.',
    funcao: 'Corresponde à apresentação de fronte, a mais desfavorável ao parto vaginal.',
    clinica: 'Mede cerca de 13,5 cm e é incompatível com o parto vaginal a termo na maioria das bacias — a apresentação de fronte persistente é indicação de cesariana.',
    pontos: ['≈ 13,5 cm — o maior', 'Apresentação de fronte', 'Geralmente indica cesariana'],
  },
  {
    termos: ['Diâmetro Submentobregmático'],
    resumo: 'Diâmetro entre a região submentual e o bregma.',
    localizacao: 'Medido com a cabeça em deflexão completa (apresentação de face).',
    funcao: 'É o diâmetro que se apresenta na apresentação de face.',
    clinica: 'Mede cerca de 9,5 cm: apesar da deflexão máxima, é favorável, e a apresentação de face mento-anterior pode evoluir para parto vaginal.',
    pontos: ['≈ 9,5 cm', 'Apresentação de face', 'Mento-anterior pode nascer por via vaginal'],
  },
  {
    termos: ['Diâmetro Biparietal'],
    resumo: 'Maior distância transversal entre os dois ossos parietais.',
    localizacao: 'Medido entre as eminências parietais, perpendicular ao plano sagital.',
    funcao: 'Representa a maior largura do polo cefálico que precisa atravessar a bacia.',
    clinica: 'Mede cerca de 9,5 cm e é a medida ultrassonográfica central da biometria fetal, usada para estimar idade gestacional e peso.',
    pontos: ['≈ 9,5 cm', 'Principal medida da biometria fetal', 'Maior diâmetro transverso'],
  },
  {
    termos: ['Diâmetro Bitemporal'],
    resumo: 'Distância entre os pontos mais distantes das suturas coronais, na região temporal.',
    localizacao: 'Medido transversalmente, ao nível das fossas temporais.',
    funcao: 'É o menor diâmetro transverso do polo cefálico.',
    clinica: 'Mede cerca de 8 cm; complementa o biparietal na avaliação da relação entre o polo cefálico e a bacia.',
    pontos: ['≈ 8 cm', 'Menor diâmetro transverso', 'Complementa o biparietal'],
  },
  {
    termos: ['Articulação Temporomandibular'],
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
    termos: ['Músculo Masseter'],
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
    termos: ['Músculo Temporal'],
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
    termos: ['Osso Hioide'],
    classe: 'osso',
    resumo: 'Único osso do corpo que não se articula com nenhum outro — fica suspenso por músculos e ligamentos.',
    localizacao: 'No pescoço, ao nível de C3, entre a mandíbula e a cartilagem tireóidea, com corpo, cornos maiores e cornos menores.',
    funcao: 'Ancora a musculatura supra e infra-hióidea, sustentando o assoalho da boca e a laringe; é a peça de apoio da deglutição e da fala.',
    vascularizacao: 'Ramos das artérias lingual e tireóidea superior.',
    inervacao: 'Musculatura supra-hióidea por V3, VII e C1; infra-hióidea pela alça cervical (C1–C3).',
    clinica:
      'Sua elevação é o que fecha a laringe durante a deglutição — perdida, instala-se broncoaspiração. A fratura do hioide é rara e, na necropsia, é achado clássico de estrangulamento.',
    pontos: [
      'Não se articula com nenhum osso',
      'Nível de C3; ancora supra e infra-hióideos',
      'Fratura sugere estrangulamento na medicina legal',
    ],
  },
  {
    termos: ['Palato Duro'],
    classe: 'viscera',
    resumo: 'Teto ósseo da boca e assoalho da cavidade nasal, revestido por mucosa firmemente aderida.',
    localizacao: 'Formado pelos processos palatinos das maxilas à frente e pelas lâminas horizontais dos ossos palatinos atrás, com o forame incisivo na frente e os palatinos maior e menor atrás.',
    funcao: 'Separa definitivamente as vias respiratória e digestória, e serve de anteparo para a língua comprimir o alimento e articular a fala.',
    vascularizacao: 'Artéria palatina maior, que emerge pelo forame palatino maior, e a esfenopalatina pelo forame incisivo.',
    inervacao: 'Nervos palatino maior e nasopalatino, ramos de V2 vindos do gânglio pterigopalatino.',
    clinica:
      'A falha de fusão nesse plano produz a fenda palatina, com dificuldade de sucção e voz hipernasal. O bloqueio do palatino maior é rotina em odontologia, e o torus palatino é uma exostose benigna comum na linha média.',
    pontos: [
      'Maxilas à frente, palatinos atrás',
      'Palatino maior (V2) e nasopalatino',
      'Fenda palatina e voz hipernasal',
    ],
  },
]
