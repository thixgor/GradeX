/**
 * Contexto regional do Atlas de Anatomia.
 *
 * O acervo da UFJF nomeia as estruturas, mas não diz *onde* elas estão nem
 * quem as irriga e inerva. Como cada prancha vive dentro de uma coleção com
 * caminho conhecido (ex.: `Membro Superior › Antebraço`), dá para reconstruir
 * esse contexto com precisão a partir do caminho: a irrigação do compartimento
 * anterior do antebraço é a mesma para todos os flexores mostrados ali.
 *
 * É esse mapa que transforma "Músculo Braquiorradial" em uma ficha com
 * topografia, vascularização, inervação e drenagem linfática — sem inventar
 * dado nenhum, apenas aplicando a anatomia regional que vale para o conjunto.
 *
 * A resolução é feita por palavras-chave do caminho da coleção (`breadcrumb`),
 * da mais específica para a mais genérica, com o sistema como desempate.
 */

export interface RegiaoAnatomica {
  id: string
  /** Nome curto exibido no cabeçalho da ficha. */
  nome: string
  /** Onde a região fica, em uma frase que serve de moldura para a estrutura. */
  topografia: string
  /** Irrigação arterial predominante da região. */
  arterias: string
  /** Drenagem venosa predominante. */
  veias: string
  /** Inervação motora e sensitiva predominante. */
  nervos: string
  /** Drenagem linfática regional (quando clinicamente relevante). */
  linfaticos?: string
  /** Referências ósseas/palpáveis usadas no exame físico da região. */
  reparos?: string
  /** Correlação clínica que vale para praticamente tudo o que a região contém. */
  clinica?: string
}

/**
 * Ordem importa: a primeira regra cujo padrão casar com o caminho da coleção
 * vence. Regras específicas (Antebraço, Joelho) vêm antes das genéricas
 * (Membro Superior, Tronco).
 */
interface RegraRegiao {
  /** Sistemas aos quais a regra se aplica; vazio = todos. */
  sistemas?: string[]
  /** Termos que precisam aparecer no caminho da coleção. */
  termos: string[]
  regiao: RegiaoAnatomica
}

const REGIOES: RegraRegiao[] = [
  /* ───────────────────────── Cabeça e pescoço ───────────────────────── */
  {
    termos: ['pontos craniometricos'],
    regiao: {
      id: 'craniometria',
      nome: 'Crânio · pontos craniométricos',
      topografia:
        'Os pontos craniométricos são marcos convencionados na superfície do crânio — quase sempre encontros de suturas ou saliências ósseas constantes — usados para medir, comparar e localizar estruturas profundas a partir do exterior da cabeça.',
      arterias:
        'A superfície onde eles se projetam é irrigada pela artéria temporal superficial e pela artéria occipital (ramos da carótida externa); por dentro, correm os ramos da artéria meníngea média, cujo trajeto é justamente o que alguns desses pontos denunciam.',
      veias: 'Veias emissárias atravessam o crânio nesses níveis e ligam as veias do couro cabeludo aos seios da dura-máter — um caminho de disseminação de infecção.',
      nervos: 'A pele sobrejacente é inervada pelos ramos do trigêmeo (V1 e V3) à frente e pelos nervos occipitais maior e menor atrás.',
      reparos: 'Todos são palpáveis ou localizáveis por palpação, o que é exatamente o motivo de existirem.',
      clinica:
        'São a régua da neurocirurgia, da antropologia forense e da obstetrícia: definem pontos de trepanação, orientam a craniometria e nomeiam os diâmetros do polo cefálico no parto.',
    },
  },
  {
    termos: ['cranios infantis', 'cranio de recem'],
    regiao: {
      id: 'cranio-infantil',
      nome: 'Crânio do recém-nascido',
      topografia:
        'No recém-nascido o neurocrânio ainda é um mosaico: os ossos estão separados por suturas largas e por fontículos (moleiras) membranáceos, e o viscerocrânio é proporcionalmente pequeno diante da calvária.',
      arterias: 'Couro cabeludo irrigado pelos ramos das carótidas externas; a dura-máter, pela meníngea média, ainda pouco sulcada no osso.',
      veias: 'O seio sagital superior corre logo abaixo do fontículo anterior — motivo pelo qual a punção do seio já foi usada como via de acesso venoso no lactente.',
      nervos: 'Trigêmeo à frente e nervos occipitais atrás, como no adulto.',
      reparos: 'Fontículo anterior (losangular, fecha entre 18 e 24 meses) e fontículo posterior (triangular, fecha até 2–3 meses).',
      clinica:
        'A moleira é janela clínica e janela de imagem: abaulada na hipertensão intracraniana, deprimida na desidratação, e porta de entrada do ultrassom transfontanelar. A elasticidade das suturas permite o cavalgamento ósseo que molda a cabeça durante o parto.',
    },
  },
  {
    termos: ['base do cranio'],
    regiao: {
      id: 'base-cranio',
      nome: 'Base do crânio',
      topografia:
        'A base do crânio é o assoalho da cavidade craniana, dividido em fossa anterior (lobos frontais), fossa média (lobos temporais e hipófise) e fossa posterior (cerebelo e tronco encefálico). Vista por fora, é a face onde se apoiam a faringe, os músculos do pescoço e a articulação temporomandibular.',
      arterias:
        'Atravessada pelas artérias carótidas internas (canal carótico) e vertebrais (forame magno), que se unem no polígono arterial da base do encéfalo; a meníngea média entra pelo forame espinhoso.',
      veias: 'Contém os seios da dura-máter — cavernoso, petrosos, sigmóideo — que convergem para a veia jugular interna no forame jugular.',
      nervos: 'Todos os doze pares cranianos deixam a cavidade craniana por forames e fissuras da base, o que faz da região um mapa de correlação neurológica.',
      reparos: 'Forame magno, canal carótico, forame jugular, forame oval, forame espinhoso, lâmina crivosa e canal óptico.',
      clinica:
        'Fraturas de base cursam com fístula liquórica (rinorreia/otorreia), equimose periorbital ou retroauricular e lesão de pares cranianos conforme o forame comprometido. Tumores da base são classificados justamente pela fossa que ocupam.',
    },
  },
  {
    termos: ['mandibula'],
    regiao: {
      id: 'mandibula',
      nome: 'Mandíbula',
      topografia:
        'Único osso móvel do crânio, em forma de ferradura, com um corpo horizontal que aloja os dentes inferiores e dois ramos que sobem até os processos condilar (articular) e coronoide (inserção do temporal).',
      arterias: 'Artéria alveolar inferior, ramo da maxilar, que entra pelo forame da mandíbula e percorre o canal mandibular.',
      veias: 'Veia alveolar inferior para o plexo pterigóideo e daí para a veia retromandibular.',
      nervos: 'Nervo alveolar inferior (ramo de V3), que emerge pelo forame mentual como nervo mentual e dá sensibilidade ao lábio inferior e ao mento.',
      reparos: 'Ângulo (gônio), borda inferior, forame mentual (na vertical do segundo pré-molar) e cabeça da mandíbula, palpável à frente do trago durante a abertura bucal.',
      clinica:
        'É o osso da face que mais fratura, tipicamente em dois pontos (fratura em espelho). O bloqueio do alveolar inferior é a anestesia odontológica mais executada do mundo, e a reabsorção do rebordo alveolar no desdentado aproxima perigosamente o nervo mentual da superfície.',
    },
  },
  {
    termos: ['cranio', 'vistas do cranio'],
    regiao: {
      id: 'cranio',
      nome: 'Crânio',
      topografia:
        'O crânio divide-se em neurocrânio, a caixa que aloja o encéfalo, e viscerocrânio, o esqueleto da face. Os ossos se articulam por suturas — articulações fibrosas praticamente imóveis no adulto.',
      arterias: 'Couro cabeludo pelas artérias temporal superficial, occipital e supratroclear/supraorbital; dura-máter e díploe pela artéria meníngea média.',
      veias: 'Veias diploicas e emissárias comunicam o exterior com os seios da dura-máter, o que explica a disseminação intracraniana de infecções da face.',
      nervos: 'Sensibilidade da face pelos três ramos do trigêmeo; do couro cabeludo posterior, pelos nervos occipitais (C2–C3).',
      reparos: 'Glabela, arco superciliar, processo zigomático, mastoide, protuberância occipital externa e as suturas coronal, sagital e lambdóidea.',
      clinica:
        'A espessura desigual da calvária define pontos frágeis: o ptério, onde a lâmina é fina e a meníngea média passa logo abaixo, é o sítio clássico do hematoma extradural.',
    },
  },
  {
    sistemas: ['muscular'],
    termos: ['cabeca'],
    regiao: {
      id: 'muscular-cabeca',
      nome: 'Cabeça · musculatura',
      topografia:
        'A musculatura da cabeça tem duas naturezas distintas: os músculos da expressão facial, que nascem no osso e se inserem na pele, e os músculos da mastigação, que movem a mandíbula sobre a articulação temporomandibular.',
      arterias: 'Artéria facial e artéria temporal superficial para a mímica; artéria maxilar (ramos massetérico, temporais profundos e pterigóideos) para a mastigação.',
      veias: 'Veia facial e veia retromandibular, que drenam para a jugular interna e externa; a veia facial comunica-se com o seio cavernoso pela veia oftálmica.',
      nervos:
        'Divisão radical e cobrada: mímica pelo nervo facial (VII), mastigação pelo nervo mandibular (V3). A sensibilidade da face é do trigêmeo em toda a sua extensão.',
      reparos: 'Ventre do masseter à mordida, ventre anterior do temporal na fossa temporal e a saída dos ramos do facial na borda da parótida.',
      clinica:
        'A paralisia facial periférica compromete toda a hemiface (inclusive a testa) e impede o fechamento do olho; na paralisia central a testa é poupada. A dor da disfunção temporomandibular tipicamente irradia pelo masseter e pelo temporal.',
    },
  },

  /* ───────────────────────── Tronco ───────────────────────── */
  {
    termos: ['coluna vertebral', 'coluna'],
    regiao: {
      id: 'coluna',
      nome: 'Coluna vertebral',
      topografia:
        'Coluna de 33 vértebras — 7 cervicais, 12 torácicas, 5 lombares, 5 sacrais fundidas e 4 coccígeas — empilhadas em quatro curvaturas alternadas, com os discos intervertebrais entre os corpos e as articulações zigapofisárias entre os processos articulares.',
      arterias: 'Ramos segmentares: vertebrais e cervicais ascendentes no pescoço, intercostais posteriores no tórax, lombares no abdome — todos emitindo ramos espinhais que entram pelo forame intervertebral.',
      veias: 'Plexos venosos vertebrais interno e externo (plexos de Batson), sem valvas, comunicando-se livremente com as veias pélvicas e torácicas.',
      nervos:
        'De cada forame intervertebral emerge um nervo espinal; o ramo dorsal inerva as articulações zigapofisárias e a musculatura profunda do dorso, e o nervo sinuvertebral inerva o disco e o ligamento longitudinal posterior.',
      reparos: 'Processo espinhoso de C7 (vértebra proeminente), ângulo inferior da escápula (~T7) e a linha das cristas ilíacas (~L4).',
      clinica:
        'Os plexos de Batson, sem valvas, explicam a metástase vertebral de próstata e mama sem passar pelo pulmão. A hérnia de disco comprime tipicamente a raiz que emerge um nível abaixo, e o nível medular não coincide com o nível vertebral — a medula termina em L1–L2, o que define o espaço seguro da punção lombar abaixo de L3.',
    },
  },
  {
    termos: ['esterno e gradil costal', 'gradil costal', 'esterno'],
    regiao: {
      id: 'gradil-costal',
      nome: 'Tórax · esterno e gradil costal',
      topografia:
        'A caixa torácica é formada atrás pelas doze vértebras torácicas, lateralmente pelos doze pares de costelas e à frente pelo esterno (manúbrio, corpo e processo xifoide), fechada abaixo pelo diafragma.',
      arterias: 'Artérias intercostais posteriores (aorta torácica) e anteriores (torácica interna), correndo no sulco da costela junto com veia e nervo.',
      veias: 'Veias intercostais drenam para os sistemas ázigo e hemiázigo à direita e à esquerda; à frente, para as veias torácicas internas.',
      nervos: 'Nervos intercostais (ramos ventrais de T1–T11) e nervo subcostal (T12), no feixe veia–artéria–nervo abrigado sob a margem inferior de cada costela.',
      reparos:
        'Ângulo do esterno (ângulo de Louis), que marca a 2ª costela, o disco T4–T5 e o plano transverso do tórax; processo xifoide; e a contagem dos espaços intercostais a partir daí.',
      clinica:
        'A posição do feixe neurovascular na margem inferior da costela obriga a puncionar o tórax rente à borda superior da costela de baixo. As costelas 11 e 12 são flutuantes e mais frágeis; fraturas baixas à direita levantam suspeita de lesão hepática e, à esquerda, esplênica.',
    },
  },
  {
    sistemas: ['muscular'],
    termos: ['torax'],
    regiao: {
      id: 'muscular-torax',
      nome: 'Tórax · musculatura',
      topografia:
        'A parede torácica tem uma camada superficial de músculos que ligam o tronco ao membro superior (peitoral maior e menor, serrátil anterior) e uma camada intrínseca de músculos intercostais que ocupam os espaços entre as costelas.',
      arterias: 'Artéria toracoacromial e torácica lateral para os peitorais; intercostais posteriores e torácica interna para a parede.',
      veias: 'Veias homônimas para a veia axilar e para os sistemas ázigo/torácico interno.',
      nervos:
        'Nervos peitorais lateral e medial para os peitorais, nervo torácico longo para o serrátil anterior e nervos intercostais para os músculos da parede.',
      reparos: 'Prega axilar anterior (borda inferior do peitoral maior) e as digitações do serrátil na parede lateral.',
      clinica:
        'A lesão do nervo torácico longo — em esvaziamento axilar ou trauma — produz a escápula alada. Os músculos intercostais e acessórios tornam-se visivelmente ativos no desconforto respiratório, sinal de esforço ventilatório.',
    },
  },
  {
    sistemas: ['muscular'],
    termos: ['abdome'],
    regiao: {
      id: 'muscular-abdome',
      nome: 'Abdome · parede muscular',
      topografia:
        'A parede anterolateral do abdome tem três camadas planas sobrepostas — oblíquo externo, oblíquo interno e transverso do abdome — cujas aponeuroses formam a bainha do reto, envolvendo o músculo reto do abdome de cada lado da linha alba.',
      arterias: 'Epigástricas superior (torácica interna) e inferior (ilíaca externa), que se anastomosam dentro da bainha do reto, além das intercostais inferiores e lombares.',
      veias: 'Veias homônimas; as veias paraumbilicais ligam a rede portal à parede, base anatômica da cabeça de medusa.',
      nervos: 'Nervos toracoabdominais (T7–T11), subcostal (T12), ílio-hipogástrico e ilioinguinal (L1).',
      reparos: 'Linha alba, umbigo (nível de T10 na dermatomia), linha semilunar e o ligamento inguinal entre a espinha ilíaca anterossuperior e o tubérculo púbico.',
      clinica:
        'Os limites aponeuróticos definem os pontos fracos por onde saem as hérnias: inguinal, femoral, umbilical e de Spiegel. A contração voluntária da parede diferencia massa intraparietal de intra-abdominal (manobra de Carnett).',
    },
  },
  {
    sistemas: ['muscular'],
    termos: ['dorso'],
    regiao: {
      id: 'muscular-dorso',
      nome: 'Dorso · musculatura',
      topografia:
        'O dorso tem músculos extrínsecos superficiais, que movem o membro superior (trapézio, latíssimo do dorso, romboides, levantador da escápula), e músculos intrínsecos profundos (eretor da espinha e transverso-espinhais), que movem e estabilizam a própria coluna.',
      arterias: 'Artéria transversa do pescoço, dorsal da escápula, toracodorsal e ramos dorsais das artérias segmentares.',
      veias: 'Veias homônimas e plexo venoso vertebral externo.',
      nervos:
        'Distinção que cai em prova: os extrínsecos são inervados por ramos ventrais (acessório XI para o trapézio, toracodorsal para o latíssimo, dorsal da escápula para os romboides); os intrínsecos, exclusivamente por ramos dorsais dos nervos espinais.',
      reparos: 'Processos espinhosos na linha média, borda medial da escápula e o relevo do eretor da espinha lateralmente à linha média.',
      clinica:
        'Lombalgia mecânica costuma envolver a musculatura intrínseca e as articulações zigapofisárias. O latíssimo do dorso é retalho miocutâneo de escolha em reconstrução de mama e de parede torácica.',
    },
  },

  /* ───────────────────────── Membro superior ───────────────────────── */
  {
    termos: ['cingulo do membro superior', 'ombro'],
    regiao: {
      id: 'ombro',
      nome: 'Ombro e cíngulo do membro superior',
      topografia:
        'O cíngulo é formado pela escápula e pela clavícula; a única articulação óssea com o esqueleto axial é a esternoclavicular. A articulação glenoumeral é esferóidea, rasa, e troca estabilidade por amplitude — quem a mantém no lugar é o manguito rotador.',
      arterias: 'Artéria axilar e seus ramos — circunflexas umeral anterior e posterior, subescapular e toracoacromial —, com rica anastomose escapular.',
      veias: 'Veia axilar e veia cefálica, que corre no sulco deltopeitoral até desaguar na axilar.',
      nervos:
        'Plexo braquial (C5–T1) na axila; nervo axilar (C5–C6) contornando o colo cirúrgico do úmero e nervo supraescapular passando pela incisura da escápula.',
      linfaticos: 'Linfonodos axilares — o território de drenagem de todo o membro superior e da mama.',
      reparos: 'Acrômio, processo coracoide, espinha da escápula, tubérculo maior e o sulco deltopeitoral.',
      clinica:
        'A luxação glenoumeral é a mais frequente do corpo e desloca a cabeça anteroinferiormente, colocando em risco o nervo axilar — daí a checagem obrigatória da sensibilidade sobre o deltoide. A fratura do colo cirúrgico ameaça o mesmo nervo.',
    },
  },
  {
    termos: ['braco'],
    regiao: {
      id: 'braco',
      nome: 'Braço',
      topografia:
        'Segmento entre o ombro e o cotovelo, com um único osso — o úmero — e dois compartimentos separados por septos intermusculares: o anterior (flexor: bíceps braquial, braquial e coracobraquial) e o posterior (extensor: tríceps braquial).',
      arterias: 'Artéria braquial, no sulco bicipital medial, com a artéria braquial profunda acompanhando o nervo radial no sulco do nervo radial.',
      veias: 'Veias braquiais profundas e, na superfície, veias cefálica (lateral) e basílica (medial).',
      nervos:
        'Musculocutâneo para o compartimento anterior, radial para o posterior; mediano e ulnar apenas atravessam o braço, sem inervar nada nele.',
      linfaticos: 'Linfonodos axilares, com passagem por linfonodos cubitais para o território ulnar da mão.',
      reparos: 'Sulco bicipital medial (pulso braquial e local do manguito), epicôndilos medial e lateral e o tendão distal do bíceps na fossa cubital.',
      clinica:
        'A fratura de diáfise umeral pode lesar o nervo radial no sulco e produzir a mão caída. O pulso braquial no sulco bicipital medial é o ponto de ausculta da pressão arterial.',
    },
  },
  {
    termos: ['antebraco'],
    regiao: {
      id: 'antebraco',
      nome: 'Antebraço',
      topografia:
        'Segmento entre o cotovelo e o punho, com dois ossos paralelos — rádio (lateral) e ulna (medial) — unidos pela membrana interóssea. Divide-se no compartimento anterior (flexor-pronador) e no posterior (extensor-supinador).',
      arterias: 'Artérias radial e ulnar, ramos da braquial na fossa cubital, com a interóssea comum irrigando os planos profundos.',
      veias: 'Veias profundas satélites e, na superfície, cefálica, basílica e mediana do antebraço, que formam o M venoso da fossa cubital.',
      nervos:
        'Divisão clássica: nervo mediano comanda os flexores, com duas exceções entregues ao ulnar (flexor ulnar do carpo e metade medial do flexor profundo dos dedos); o nervo radial, pelo ramo interósseo posterior, comanda todo o compartimento extensor.',
      linfaticos: 'Linfonodos cubitais e, adiante, axilares.',
      reparos: 'Pulso radial acima do processo estiloide do rádio, tendão do palmar longo e a proeminência do braquiorradial na flexão contra resistência.',
      clinica:
        'A fossa cubital é o sítio padrão de punção venosa — e a veia mediana cubital fica logo acima da artéria braquial, separada apenas pela aponeurose bicipital. Síndrome compartimental do antebraço evolui para a contratura isquêmica de Volkmann se não for descomprimida.',
    },
  },
  {
    termos: ['cotovelo'],
    regiao: {
      id: 'cotovelo',
      nome: 'Cotovelo',
      topografia:
        'Complexo de três articulações em uma cápsula só: umeroulnar e umerorradial (gínglimo, flexão e extensão) e radioulnar proximal (trocoide, pronossupinação). Estabilizado pelos ligamentos colaterais ulnar e radial e pelo ligamento anular do rádio.',
      arterias: 'Rede anastomótica do cotovelo, formada por ramos colaterais da braquial e recorrentes da radial, ulnar e interóssea.',
      veias: 'Veias profundas satélites e o plexo venoso superficial da fossa cubital.',
      nervos: 'Nervo ulnar no sulco do nervo ulnar, atrás do epicôndilo medial; mediano e radial cruzando a fossa cubital.',
      reparos:
        'Triângulo de Hüter: epicôndilo medial, epicôndilo lateral e olécrano, alinhados em extensão e em triângulo na flexão — a distorção desse triângulo diferencia luxação de fratura supracondilar.',
      clinica:
        'A epicondilite lateral (cotovelo de tenista) acomete a origem comum dos extensores; a medial, a dos flexores. O nervo ulnar no sulco é o "osso da comédia" e o alvo da neuropatia compressiva do cotovelo.',
    },
  },
  {
    termos: ['punho e mao', 'mao', 'punho'],
    regiao: {
      id: 'mao',
      nome: 'Punho e mão',
      topografia:
        'Oito ossos carpais em duas fileiras, cinco metacarpos e catorze falanges. O retináculo dos flexores fecha o túnel do carpo à frente; os tendões extensores correm sob o retináculo dos extensores no dorso.',
      arterias: 'Artérias radial e ulnar formando os arcos palmares superficial (predominantemente ulnar) e profundo (predominantemente radial).',
      veias: 'Rede venosa dorsal da mão, origem das veias cefálica e basílica.',
      nervos:
        'Mediano no túnel do carpo (polegar, indicador, médio e metade radial do anular), ulnar no canal de Guyon (dedo mínimo e metade ulnar do anular) e radial para a pele do dorso lateral. A musculatura intrínseca é quase toda ulnar; o mediano fica com os tenares e os dois lumbricais laterais.',
      reparos: 'Tabaqueira anatômica (escafoide no assoalho), tubérculo do escafoide, pisiforme e o tendão do palmar longo apontando o mediano.',
      clinica:
        'O teste de Allen confirma a dupla irrigação antes da punção radial. A fratura do escafoide dói na tabaqueira, pode não aparecer na radiografia inicial e evolui para necrose avascular pelo fluxo retrógrado. A síndrome do túnel do carpo é a neuropatia compressiva mais comum.',
    },
  },

  /* ───────────────────────── Membro inferior ───────────────────────── */
  {
    termos: ['cingulo do membro inferior', 'quadril'],
    regiao: {
      id: 'quadril',
      nome: 'Quadril e cíngulo do membro inferior',
      topografia:
        'O osso do quadril nasce da fusão de ílio, ísquio e púbis no acetábulo. Articula-se atrás com o sacro (sacroilíaca, quase imóvel) e à frente com o do lado oposto (sínfise púbica). A articulação coxofemoral é esferóidea, profunda e revestida por um lábio acetabular que aumenta a contenção.',
      arterias: 'Circunflexas femorais medial e lateral, com a medial responsável pela maior parte do suprimento da cabeça do fêmur; ramos das ilíacas interna e externa e a artéria do ligamento da cabeça do fêmur.',
      veias: 'Veias femoral e ilíacas, com o plexo venoso pélvico próximo.',
      nervos: 'Femoral, obturatório e isquiático circundam a articulação; o glúteo superior e inferior comandam os abdutores e o glúteo máximo.',
      linfaticos: 'Linfonodos inguinais superficiais e profundos e, adiante, ilíacos externos.',
      reparos: 'Crista ilíaca, espinha ilíaca anterossuperior, tubérculo púbico, trocanter maior e túber isquiático.',
      clinica:
        'A fratura do colo do fêmur interrompe a circunflexa femoral medial e leva à necrose avascular da cabeça. O sinal de Trendelenburg denuncia insuficiência dos abdutores (nervo glúteo superior), e o quadrante superolateral da nádega é a zona segura da injeção intramuscular por evitar o nervo isquiático.',
    },
  },
  {
    sistemas: ['muscular'],
    termos: ['gluteo'],
    regiao: {
      id: 'gluteo',
      nome: 'Região glútea',
      topografia:
        'Entre a crista ilíaca e a prega glútea, organizada em torno do músculo piriforme: tudo o que entra ou sai da pelve para a nádega passa acima ou abaixo dele, pelos forames isquiáticos maior e menor.',
      arterias: 'Artérias glúteas superior (acima do piriforme) e inferior (abaixo), ramos da ilíaca interna.',
      veias: 'Veias glúteas homônimas para a ilíaca interna.',
      nervos:
        'Nervo glúteo superior (glúteo médio, mínimo e tensor da fáscia lata), glúteo inferior (glúteo máximo) e o nervo isquiático, que emerge abaixo do piriforme rumo à coxa.',
      reparos: 'Crista ilíaca, trocanter maior, túber isquiático e a linha entre a espinha ilíaca posterossuperior e o trocanter, que estima o trajeto do isquiático.',
      clinica:
        'A injeção intramuscular é feita no quadrante superolateral justamente para ficar longe do isquiático. A síndrome do piriforme comprime o nervo em seu trajeto, simulando ciatalgia discal.',
    },
  },
  {
    termos: ['coxa'],
    regiao: {
      id: 'coxa',
      nome: 'Coxa',
      topografia:
        'Segmento entre o quadril e o joelho, com o fêmur ao centro e três compartimentos: anterior (quadríceps e sartório), medial (adutores e grácil) e posterior (isquiotibiais).',
      arterias: 'Artéria femoral no trígono femoral e no canal dos adutores, com a femoral profunda e suas perfurantes irrigando os compartimentos medial e posterior.',
      veias: 'Veia femoral e a veia safena magna, a mais longa do corpo, que desemboca no hiato safeno.',
      nervos:
        'Um nervo por compartimento: femoral à frente, obturatório medialmente e isquiático atrás — divisão que torna o exame neurológico da coxa muito objetivo.',
      linfaticos: 'Linfonodos inguinais superficiais e profundos, incluindo o linfonodo de Cloquet no anel femoral.',
      reparos: 'Trígono femoral (ligamento inguinal, sartório e adutor longo), com a ordem lateral→medial do feixe: Nervo, Artéria, Veia, Linfáticos.',
      clinica:
        'O pulso femoral no trígono é o acesso vascular de escolha em cateterismo e em choque. A safena magna é o enxerto clássico de revascularização e a veia da dissecção venosa no tornozelo, junto ao maléolo medial.',
    },
  },
  {
    termos: ['joelho', 'patela'],
    regiao: {
      id: 'joelho',
      nome: 'Joelho',
      topografia:
        'Maior articulação sinovial do corpo, gínglimo modificado entre os côndilos femorais e o platô tibial, com a patela — o maior osso sesamoide — deslizando na tróclea femoral. Meniscos medial e lateral aumentam a congruência; cruzados e colaterais garantem a estabilidade.',
      arterias: 'Rede articular do joelho, formada pelas artérias geniculares ramos da poplítea, descendente do joelho e recorrente tibial anterior.',
      veias: 'Veia poplítea, com a safena parva desembocando na fossa poplítea.',
      nervos: 'Ramos articulares do femoral, do obturatório e do isquiático (tibial e fibular comum) — a base anatômica da dor referida do quadril no joelho.',
      reparos: 'Patela, tuberosidade da tíbia, linha articular, cabeça da fíbula e os tendões dos isquiotibiais delimitando a fossa poplítea.',
      clinica:
        'A tríade infeliz de O\'Donoghue associa lesão do ligamento colateral medial, do menisco medial e do cruzado anterior. O menisco medial é mais lesado por estar aderido ao colateral medial. O nervo fibular comum contorna o colo da fíbula, superficial e vulnerável, e sua lesão produz o pé caído.',
    },
  },
  {
    termos: ['perna'],
    regiao: {
      id: 'perna',
      nome: 'Perna',
      topografia:
        'Entre o joelho e o tornozelo, com tíbia (medial, de carga) e fíbula (lateral, de inserção) unidas pela membrana interóssea, distribuídas em três compartimentos: anterior (dorsiflexores), lateral (fibulares, eversores) e posterior (flexores plantares, em plano superficial e profundo).',
      arterias: 'Artéria tibial anterior no compartimento anterior; tibial posterior e fibular atrás. A poplítea se bifurca abaixo do joelho e origina todas elas.',
      veias: 'Veias profundas satélites e o par superficial safena magna (medial) e safena parva (posterior).',
      nervos:
        'Nervo fibular profundo à frente, fibular superficial lateralmente e nervo tibial atrás — todos derivados do isquiático pela divisão na fossa poplítea.',
      reparos: 'Crista da tíbia, cabeça e colo da fíbula, tendão do calcâneo e o pulso tibial posterior atrás do maléolo medial.',
      clinica:
        'A perna é o sítio clássico de síndrome compartimental, sobretudo no compartimento anterior. Trombose venosa profunda nasce nas veias da panturrilha. O pé caído por lesão do fibular comum no colo da fíbula é a mononeuropatia mais frequente do membro inferior.',
    },
  },
  {
    termos: ['tornozelo e pe', 'pe'],
    regiao: {
      id: 'pe',
      nome: 'Tornozelo e pé',
      topografia:
        'O tornozelo é um gínglimo em pinça: tíbia e fíbula abraçam a tróclea do tálus. O pé tem sete ossos tarsais, cinco metatarsais e catorze falanges, organizados em arcos longitudinais e transverso sustentados por ligamentos, aponeurose plantar e músculos.',
      arterias: 'Artéria dorsal do pé (continuação da tibial anterior) no dorso e artérias plantares medial e lateral (da tibial posterior) na planta, formando o arco plantar profundo.',
      veias: 'Arco venoso dorsal, origem das safenas magna e parva.',
      nervos:
        'Fibular profundo (primeiro espaço interdigital dorsal), fibular superficial (dorso do pé), tibial e seus ramos plantares (planta) e sural (borda lateral).',
      reparos: 'Maléolos medial e lateral, tuberosidade do 5º metatarsal, sustentáculo do tálus e os pulsos tibial posterior e dorsal do pé.',
      clinica:
        'A entorse em inversão lesa o ligamento talofibular anterior, o mais acometido do corpo. As regras de Ottawa definem quando radiografar. Os pulsos do pé são o exame vascular básico do diabético, e a fasciíte plantar dói no calcâneo aos primeiros passos do dia.',
    },
  },

  /* ───────────────────────── Sistema nervoso ───────────────────────── */
  {
    sistemas: ['nervoso'],
    termos: ['medula espinal'],
    regiao: {
      id: 'medula',
      nome: 'Medula espinal',
      topografia:
        'Cilindro nervoso dentro do canal vertebral, do forame magno até o cone medular em L1–L2 no adulto, com intumescências cervical (C4–T1, membro superior) e lombossacral (L2–S3, membro inferior). Abaixo do cone segue a cauda equina.',
      arterias: 'Artéria espinal anterior (2/3 anteriores) e duas espinais posteriores, reforçadas pelas artérias radiculares — a maior delas, a artéria de Adamkiewicz, geralmente à esquerda entre T9 e L2.',
      veias: 'Plexos venosos vertebrais interno e externo, sem valvas.',
      nervos: '31 pares de nervos espinais, cada um formado pela raiz dorsal (sensitiva, com gânglio) e pela raiz ventral (motora).',
      reparos: 'Nível de L4 na linha das cristas ilíacas orienta a punção lombar em L3–L4 ou L4–L5.',
      clinica:
        'A síndrome da artéria espinal anterior poupa cordões posteriores: perde-se motricidade, dor e temperatura, preserva-se propriocepção. A dissociação entre nível vertebral e nível medular é o que torna segura a punção lombar abaixo de L2.',
    },
  },
  {
    sistemas: ['nervoso'],
    termos: ['tronco encefalico'],
    regiao: {
      id: 'tronco-encefalico',
      nome: 'Tronco encefálico',
      topografia:
        'Formado, de cima para baixo, por mesencéfalo, ponte e bulbo, ligando o diencéfalo à medula espinal e conectando-se ao cerebelo pelos pedúnculos cerebelares. Dele emergem os nervos cranianos III a XII.',
      arterias: 'Sistema vertebrobasilar: artérias vertebrais, basilar e seus ramos paramedianos, circunferenciais curtos e longos (PICA, AICA, cerebelar superior).',
      veias: 'Veias do tronco drenam para os seios petrosos e para o seio reto.',
      nervos: 'Aloja os núcleos dos nervos cranianos e as vias longas — corticoespinal, lemnisco medial, espinotalâmico — que o atravessam de ponta a ponta.',
      clinica:
        'As síndromes alternas são a assinatura do tronco: déficit de nervo craniano ipsilateral com déficit motor ou sensitivo contralateral, porque as vias longas ainda vão cruzar. A formação reticular ali contida controla o nível de consciência, e é ali que se define a morte encefálica.',
    },
  },
  {
    sistemas: ['nervoso'],
    termos: ['cerebelo'],
    regiao: {
      id: 'cerebelo',
      nome: 'Cerebelo',
      topografia:
        'Ocupa a fossa craniana posterior, abaixo da tenda do cerebelo, com dois hemisférios e o vérmis entre eles; conecta-se ao tronco por três pares de pedúnculos cerebelares (superior, médio e inferior).',
      arterias: 'Cerebelares superior (basilar), ântero-inferior/AICA (basilar) e póstero-inferior/PICA (vertebral).',
      veias: 'Veias cerebelares para os seios petroso superior, transverso e reto.',
      nervos: 'Não emite nervos periféricos; comunica-se com o resto do encéfalo pelos pedúnculos e pelos núcleos profundos, sobretudo o núcleo denteado.',
      clinica:
        'O cerebelo age ipsilateralmente: a lesão de um hemisfério causa ataxia, dismetria e disdiadococinesia do mesmo lado. Lesões do vérmis dão ataxia de tronco e marcha. Por estar em compartimento estreito, o edema cerebelar comprime o IV ventrículo e causa hidrocefalia aguda.',
    },
  },
  {
    sistemas: ['nervoso'],
    termos: ['diencefalo'],
    regiao: {
      id: 'diencefalo',
      nome: 'Diencéfalo',
      topografia:
        'Núcleo profundo do encéfalo em torno do III ventrículo, formado por tálamo, hipotálamo, epitálamo e subtálamo, entre o tronco encefálico e os hemisférios cerebrais.',
      arterias: 'Ramos perfurantes da cerebral posterior e da comunicante posterior para o tálamo; a hipófise é irrigada pelas artérias hipofisárias superior e inferior.',
      veias: 'Veias cerebrais internas e veia magna do cérebro (de Galeno) para o seio reto.',
      nervos: 'O tálamo é a estação obrigatória de quase toda via sensitiva rumo ao córtex; o hipotálamo comanda o sistema autônomo e a hipófise.',
      clinica:
        'O infarto talâmico causa hemianestesia contralateral e, mais tarde, a dor central de Déjerine-Roussy. Lesões hipotalâmicas desregulam temperatura, apetite, sono e o eixo endócrino inteiro.',
    },
  },
  {
    sistemas: ['nervoso'],
    termos: ['telencefalo'],
    regiao: {
      id: 'telencefalo',
      nome: 'Telencéfalo',
      topografia:
        'Os dois hemisférios cerebrais, com córtex pregueado em giros e sulcos, substância branca subjacente e núcleos da base em profundidade, unidos pelo corpo caloso e organizados em lobos frontal, parietal, temporal, occipital e ínsula.',
      arterias:
        'Cerebral anterior (face medial e o terço superior da faixa motora — território do membro inferior), cerebral média (face lateral, incluindo áreas da linguagem) e cerebral posterior (lobo occipital e face inferior do temporal), unidas pelo círculo arterial do cérebro.',
      veias: 'Veias cerebrais superficiais para o seio sagital superior e profundas para o sistema da veia magna do cérebro.',
      nervos: 'Origem da via corticoespinal e destino final das vias sensitivas, com representação somatotópica no giro pré e pós-central.',
      clinica:
        'A somatotopia explica o padrão do AVC: a oclusão da cerebral média poupa relativamente o membro inferior, e a da cerebral anterior faz o oposto. Área de Broca (frontal inferior) dá afasia de expressão; Wernicke (temporal superior), afasia de compreensão.',
    },
  },
  {
    sistemas: ['nervoso'],
    termos: ['meninges'],
    regiao: {
      id: 'meninges',
      nome: 'Meninges',
      topografia:
        'Três envoltórios concêntricos do sistema nervoso central: dura-máter externa e espessa, aracnoide-máter intermédia e pia-máter, aderida ao tecido nervoso. Entre aracnoide e pia corre o líquido cerebrospinal no espaço subaracnóideo.',
      arterias: 'Artéria meníngea média para a dura-máter (entre dura e osso), ramo da maxilar.',
      veias: 'Veias emissárias e os seios da dura-máter, escavados entre os folhetos durais.',
      nervos: 'A dura-máter é sensível à dor (ramos meníngeos do trigêmeo e dos nervos cervicais superiores); o parênquima encefálico não é.',
      clinica:
        'Os três espaços definem três hemorragias distintas: extradural (arterial, meníngea média, lente biconvexa), subdural (venosa, veias-ponte, crescente) e subaracnóidea (aneurisma, cefaleia em trovoada). O fato de o encéfalo não doer e a dura doer é a razão da cefaleia meníngea.',
    },
  },
  {
    sistemas: ['nervoso'],
    termos: ['vascularizacao'],
    regiao: {
      id: 'vascularizacao-encefalica',
      nome: 'Vascularização do encéfalo',
      topografia:
        'O encéfalo recebe sangue de dois sistemas: carotídeo interno (anterior) e vertebrobasilar (posterior), unidos na base do crânio pelo círculo arterial do cérebro (polígono de Willis).',
      arterias:
        'Carótidas internas → cerebrais anterior e média; vertebrais → basilar → cerebrais posteriores. As comunicantes anterior e posteriores fecham o polígono e sustentam a circulação colateral.',
      veias: 'Veias superficiais para o seio sagital superior e profundas para a veia magna do cérebro; tudo converge para os seios transverso e sigmóideo e daí para a jugular interna.',
      nervos: 'A parede arterial recebe inervação simpática do gânglio cervical superior e fibras trigeminais, envolvidas na fisiopatologia da enxaqueca.',
      clinica:
        'Território arterial é sinônimo de síndrome clínica no AVC. O polígono de Willis é o sítio mais comum de aneurismas saculares — sobretudo na comunicante anterior — e sua ruptura causa hemorragia subaracnóidea.',
    },
  },
  {
    sistemas: ['nervoso'],
    termos: ['visao geral'],
    regiao: {
      id: 'nervoso-geral',
      nome: 'Sistema nervoso · visão geral',
      topografia:
        'O sistema nervoso divide-se em central (encéfalo e medula espinal, protegidos por crânio, coluna e meninges) e periférico (nervos cranianos e espinais, gânglios e terminações), com uma divisão funcional autônoma simpática e parassimpática sobreposta a ambos.',
      arterias: 'Carótidas internas e vertebrais para o encéfalo; artérias espinais e radiculares para a medula.',
      veias: 'Seios da dura-máter e plexos venosos vertebrais.',
      nervos: '12 pares cranianos e 31 pares espinais compõem a saída periférica do sistema.',
      clinica:
        'Toda a semiologia neurológica é anatomia aplicada: localizar a lesão antes de nomeá-la é o raciocínio que separa o exame neurológico de uma lista de sintomas.',
    },
  },

  /* ───────────────────────── Circulatório ───────────────────────── */
  {
    sistemas: ['circulatorio'],
    termos: ['coracao'],
    regiao: {
      id: 'coracao',
      nome: 'Coração',
      topografia:
        'Ocupa o mediastino médio, dentro do pericárdio, entre os pulmões e sobre o diafragma, com dois terços à esquerda da linha mediana. Quatro câmaras: átrios direito e esquerdo, ventrículos direito e esquerdo, separados por septos e valvas.',
      arterias:
        'Artérias coronárias direita e esquerda, primeiros ramos da aorta ascendente, saindo dos seios aórticos. A esquerda dá a interventricular anterior e a circunflexa; a direita irriga o átrio direito, o nó sinoatrial na maioria e, em 80–85% das pessoas, a interventricular posterior (dominância direita).',
      veias: 'Veias cardíacas magna, média e parva convergem para o seio coronário, que desemboca no átrio direito.',
      nervos:
        'Plexo cardíaco: simpático dos gânglios cervicais e torácicos superiores (aumenta frequência e força) e parassimpático pelo vago (reduz a frequência). A dor visceral cardíaca sobe por fibras simpáticas até T1–T4.',
      reparos: 'Ictus cordis no 5º espaço intercostal esquerdo na linha hemiclavicular; focos de ausculta aórtico, pulmonar, tricúspide e mitral.',
      clinica:
        'A distribuição das coronárias mapeia o infarto: interventricular anterior para a parede anterior e septo, circunflexa para a lateral, coronária direita para a inferior e para o nó sinoatrial. A dor referida no membro superior esquerdo e na mandíbula segue os mesmos segmentos medulares da inervação simpática.',
    },
  },
  {
    sistemas: ['circulatorio'],
    termos: ['baco'],
    regiao: {
      id: 'baco',
      nome: 'Baço',
      topografia:
        'Órgão linfoide intraperitoneal do hipocôndrio esquerdo, entre as costelas 9 e 11, encostado no diafragma, no estômago, no rim esquerdo e na flexura cólica esquerda. Não é palpável quando normal.',
      arterias: 'Artéria esplênica, ramo tortuoso do tronco celíaco, correndo pela borda superior do pâncreas.',
      veias: 'Veia esplênica, que se une à mesentérica superior atrás do colo do pâncreas para formar a veia porta.',
      nervos: 'Plexo celíaco (simpático); a dor referida vai para o ombro esquerdo pelo nervo frênico quando há irritação diafragmática — o sinal de Kehr.',
      linfaticos: 'Linfonodos pancreatoesplênicos e celíacos.',
      reparos: 'Projeta-se sobre a linha axilar média, entre a 9ª e a 11ª costela do lado esquerdo.',
      clinica:
        'É o órgão mais lesado no trauma abdominal fechado, sobretudo com fratura de costelas baixas à esquerda. Esplenomegalia cresce em direção à fossa ilíaca direita. A esplenectomia obriga a vacinação contra germes encapsulados pelo risco de sepse fulminante.',
    },
  },

  /* ───────────────────────── Respiratório ───────────────────────── */
  {
    sistemas: ['respiratorio'],
    termos: ['nariz'],
    regiao: {
      id: 'nariz',
      nome: 'Nariz e cavidade nasal',
      topografia:
        'A cavidade nasal vai das narinas às cóanas, dividida pelo septo e ocupada lateralmente pelas conchas nasais superior, média e inferior, que criam os meatos onde drenam os seios paranasais e o ducto lacrimonasal.',
      arterias:
        'Área de Kiesselbach, no septo anterior, onde se anastomosam a esfenopalatina, a etmoidal anterior, a palatina maior e o ramo septal da labial superior — carótidas interna e externa se encontrando ali.',
      veias: 'Veias para o plexo pterigóideo, a veia facial e as veias oftálmicas, com comunicação para o seio cavernoso.',
      nervos: 'Olfatório (I) no teto, sensibilidade geral pelos ramos do trigêmeo (V1 e V2) e secreção pelo parassimpático do gânglio pterigopalatino.',
      clinica:
        'Mais de 90% das epistaxes vêm da área de Kiesselbach, o que justifica a compressão da asa do nariz como primeira medida. A drenagem dos seios pelos meatos explica a sinusite, e a lâmina crivosa é a via da anosmia pós-traumática e da rinorreia liquórica.',
    },
  },
  {
    sistemas: ['respiratorio', 'digestorio'],
    termos: ['faringe'],
    regiao: {
      id: 'faringe',
      nome: 'Faringe',
      topografia:
        'Tubo muscular de cerca de 12–14 cm da base do crânio até a borda inferior da cartilagem cricoide, dividido em nasofaringe, orofaringe e laringofaringe — via comum de ar e alimento.',
      arterias: 'Artéria faríngea ascendente, ramos tonsilares da facial, palatina ascendente e ramos das tireóideas.',
      veias: 'Plexo venoso faríngeo para a veia jugular interna.',
      nervos:
        'Plexo faríngeo (IX e X): o glossofaríngeo dá a sensibilidade da orofaringe (aferência do reflexo do vômito) e o vago dá a motricidade de toda a musculatura, exceto o estilofaríngeo (IX).',
      linfaticos: 'Anel linfático de Waldeyer — tonsilas faríngea, tubárias, palatinas e lingual.',
      clinica:
        'A tonsila palatina fica ao lado da artéria carótida interna, e a hemorragia pós-amigdalectomia é a complicação temida. A tuba auditiva abre na nasofaringe: nas crianças ela é curta e horizontal, o que explica a otite média de repetição.',
    },
  },
  {
    sistemas: ['respiratorio'],
    termos: ['laringe'],
    regiao: {
      id: 'laringe',
      nome: 'Laringe',
      topografia:
        'Entre C3 e C6, ligando a laringofaringe à traqueia, com um esqueleto de cartilagens (tireóidea, cricóidea, epiglote e as aritenóideas pares) e as pregas vocais delimitando a rima da glote.',
      arterias: 'Artérias laríngeas superior (da tireóidea superior) e inferior (da tireóidea inferior).',
      veias: 'Veias laríngeas para as tireóideas superior e inferior.',
      nervos:
        'Nervo laríngeo superior: ramo interno sensitivo acima das pregas vocais, ramo externo motor para o cricotireóideo. Nervo laríngeo recorrente: motor para todos os demais músculos intrínsecos e sensitivo abaixo das pregas.',
      reparos: 'Proeminência laríngea, membrana cricotireóidea (entre tireóidea e cricóidea) e a cartilagem cricoide, o único anel completo da via aérea.',
      clinica:
        'A lesão do laríngeo recorrente — em tireoidectomia ou por tumor — causa rouquidão; bilateral, obstrução da via aérea. A membrana cricotireóidea é o sítio da cricotireoidostomia de emergência, e a cricoide é o ponto da manobra de Sellick.',
    },
  },
  {
    sistemas: ['respiratorio'],
    termos: ['traqueia'],
    regiao: {
      id: 'traqueia',
      nome: 'Traqueia',
      topografia:
        'Tubo de 10–12 cm da cartilagem cricoide (C6) até a carina (T4–T5), sustentado por 16 a 20 anéis cartilaginosos incompletos atrás, onde o músculo traqueal fecha a parede em contato com o esôfago.',
      arterias: 'Ramos das artérias tireóideas inferiores em cima e das artérias brônquicas embaixo.',
      veias: 'Veias tireóideas inferiores e plexo venoso tireóideo.',
      nervos: 'Vago e laríngeos recorrentes (motor e sensitivo) e fibras simpáticas do tronco cervical.',
      reparos: 'Palpável na fúrcula esternal; os anéis 2º a 4º são o sítio da traqueostomia eletiva.',
      clinica:
        'O brônquio principal direito é mais largo, curto e vertical: corpos estranhos e a intubação seletiva acidental vão para ele. O desvio de traqueia é sinal clássico de pneumotórax hipertensivo (afasta) ou de atelectasia (atrai).',
    },
  },
  {
    sistemas: ['respiratorio'],
    termos: ['pulmoes', 'pulmao'],
    regiao: {
      id: 'pulmoes',
      nome: 'Pulmões',
      topografia:
        'Ocupam as cavidades pleurais, à direita com três lobos e à esquerda com dois (mais a língula e a incisura cardíaca). O hilo recebe brônquio, artérias e veias pulmonares e é envolvido pela pleura visceral, contínua com a parietal no recesso costodiafragmático.',
      arterias: 'Artérias pulmonares levam sangue venoso para as trocas; artérias brônquicas, ramos da aorta torácica, nutrem o próprio parênquima.',
      veias: 'Quatro veias pulmonares devolvem sangue arterializado ao átrio esquerdo; veias brônquicas drenam para o sistema ázigo.',
      nervos: 'Plexo pulmonar: vago (broncoconstrição e secreção) e simpático (broncodilatação).',
      linfaticos: 'Linfonodos pulmonares, broncopulmonares (hilares), traqueobrônquicos e paratraqueais — a via do estadiamento do câncer de pulmão.',
      reparos: 'Ápice acima da clavícula, base sobre o diafragma; recesso costodiafragmático como zona de expansão e de acúmulo de derrame.',
      clinica:
        'A segmentação broncopulmonar orienta ausculta, broncoscopia, drenagem postural e ressecção. O recesso costodiafragmático é onde o derrame pleural se acumula e onde se punciona — sempre pela borda superior da costela.',
    },
  },
  {
    sistemas: ['respiratorio'],
    termos: ['diafragma'],
    regiao: {
      id: 'diafragma',
      nome: 'Diafragma',
      topografia:
        'Músculo em cúpula que separa tórax e abdome, com porções esternal, costal e lombar (pilares) convergindo para o centro tendíneo. Tem três aberturas principais: cava (T8), esofágica (T10) e aórtica (T12).',
      arterias: 'Artérias frênicas superiores e inferiores, pericardicofrênica e musculofrênica.',
      veias: 'Veias frênicas para a veia cava inferior e para o sistema ázigo.',
      nervos:
        'Nervo frênico (C3, C4 e C5 — "C3, 4, 5 mantêm o diafragma vivo") para toda a motricidade; a periferia recebe sensibilidade dos intercostais inferiores.',
      reparos: 'Cúpula direita mais alta que a esquerda pelo fígado; excursão avaliada à percussão.',
      clinica:
        'A irritação da porção central do diafragma dói no ombro (C3–C5) — sinal de Kehr no hemoperitônio. Lesão medular acima de C3 abole a ventilação espontânea. As três aberturas explicam a hérnia de hiato e a compressão da cava.',
    },
  },

  /* ───────────────────────── Digestório ───────────────────────── */
  {
    sistemas: ['digestorio'],
    termos: ['cavidade oral'],
    regiao: {
      id: 'cavidade-oral',
      nome: 'Cavidade oral',
      topografia:
        'Vai dos lábios ao istmo das fauces, com o palato duro e mole no teto, a língua e o assoalho embaixo e as arcadas dentárias separando o vestíbulo da cavidade oral propriamente dita.',
      arterias: 'Artérias lingual, facial e maxilar (palatinas), todas ramos da carótida externa.',
      veias: 'Veias lingual e facial para a jugular interna.',
      nervos:
        'Sensibilidade geral dos 2/3 anteriores da língua pelo lingual (V3) e gustação pela corda do tímpano (VII); no terço posterior, ambas pelo glossofaríngeo (IX). Motricidade da língua pelo hipoglosso (XII), exceto o palatoglosso (X).',
      linfaticos: 'Linfonodos submentuais, submandibulares e cervicais profundos — a rota da disseminação do câncer de boca.',
      clinica:
        'A lesão do hipoglosso desvia a língua protruída para o lado da lesão. O assoalho da boca é rico em vasos e absorve fármacos sublinguais rapidamente, sem primeira passagem hepática.',
    },
  },
  {
    sistemas: ['digestorio'],
    termos: ['esofago e estomago', 'esofago', 'estomago'],
    regiao: {
      id: 'esofago-estomago',
      nome: 'Esôfago e estômago',
      topografia:
        'O esôfago desce de C6 até T10, atravessa o diafragma e se abre no cárdia. O estômago ocupa o hipocôndrio esquerdo e o epigástrio, com fundo, corpo, antro e piloro, curvaturas maior e menor.',
      arterias:
        'Tronco celíaco em quase tudo: gástrica esquerda e gástrica direita na curvatura menor, gastromental direita e esquerda na maior, e gástricas curtas no fundo (da esplênica).',
      veias: 'Veias gástricas para o sistema porta; as veias do esôfago distal fazem anastomose portossistêmica com o sistema ázigo.',
      nervos: 'Vago (troncos anterior e posterior) para a secreção e a motilidade; simpático pelo plexo celíaco, carregando a dor visceral referida ao epigástrio.',
      linfaticos: 'Linfonodos gástricos, celíacos e, no esôfago, mediastinais e cervicais.',
      clinica:
        'A anastomose portossistêmica do esôfago distal é a origem das varizes esofágicas na hipertensão portal. A úlcera da parede posterior do bulbo duodenal e da curvatura menor sangra pelas artérias gastroduodenal e gástrica esquerda.',
    },
  },
  {
    sistemas: ['digestorio'],
    termos: ['intestinos', 'intestino'],
    regiao: {
      id: 'intestinos',
      nome: 'Intestinos',
      topografia:
        'Delgado — duodeno (retroperitoneal, exceto o bulbo), jejuno e íleo (móveis no mesentério) — seguido do grosso: ceco e apêndice, cólons ascendente (retroperitoneal), transverso, descendente (retroperitoneal), sigmoide e reto.',
      arterias:
        'A divisão embriológica manda: tronco celíaco até a papila duodenal maior (intestino anterior), mesentérica superior até os dois terços proximais do cólon transverso (médio) e mesentérica inferior daí até o reto (posterior).',
      veias: 'Veias mesentéricas superior e inferior convergem para a veia porta — por isso a metástase colorretal vai primeiro ao fígado.',
      nervos:
        'Simpático dos plexos celíaco e mesentéricos, parassimpático do vago até a flexura esquerda e dos esplâncnicos pélvicos (S2–S4) daí em diante. A dor visceral é referida ao epigástrio, à região periumbilical ou ao hipogástrio conforme o segmento.',
      linfaticos: 'Linfonodos mesentéricos, ileocólicos, cólicos e mesentéricos inferiores acompanhando os pedículos arteriais.',
      clinica:
        'A migração da dor apendicular da região periumbilical (visceral, T10) para a fossa ilíaca direita (parietal, ponto de McBurney) é a tradução clínica exata dessa inervação dupla. As flexuras e o ângulo esplênico são zonas de watershed, vulneráveis à colite isquêmica.',
    },
  },
  {
    sistemas: ['digestorio'],
    termos: ['orgaos anexos'],
    regiao: {
      id: 'anexos-digestorios',
      nome: 'Órgãos anexos do digestório',
      topografia:
        'Fígado no hipocôndrio direito sob o diafragma, com vesícula biliar na face visceral; pâncreas retroperitoneal cruzando de C para a esquerda, da alça duodenal ao hilo esplênico; vias biliares convergindo para a papila duodenal maior.',
      arterias: 'Artéria hepática própria e suas divisões, artéria cística (do ramo direito) e as pancreatoduodenais superiores (gastroduodenal) e inferiores (mesentérica superior).',
      veias: 'Veia porta traz o sangue de todo o tubo digestório; as veias hepáticas devolvem à cava inferior.',
      nervos: 'Plexo celíaco; a irritação peritoneal sob o diafragma refere dor ao ombro direito pelo frênico.',
      linfaticos: 'Linfonodos do hilo hepático, celíacos e pancreatoduodenais.',
      reparos: 'Ponto cístico na intersecção da borda lateral do reto abdominal com o rebordo costal direito — onde se pesquisa o sinal de Murphy.',
      clinica:
        'O trígono de Calot (ducto cístico, ducto hepático comum e borda hepática) é a referência de segurança da colecistectomia. A cabeça do pâncreas abraça o colédoco: o tumor ali causa icterícia obstrutiva indolor com vesícula palpável (sinal de Courvoisier).',
    },
  },

  /* ───────────────────────── Urinário ───────────────────────── */
  {
    sistemas: ['urinario'],
    termos: ['rins e ureteres', 'rim', 'ureter'],
    regiao: {
      id: 'rins',
      nome: 'Rins e ureteres',
      topografia:
        'Órgãos retroperitoneais entre T12 e L3, o direito mais baixo pelo fígado, envolvidos por cápsula, gordura perirrenal e fáscia renal. Os ureteres descem sobre o músculo psoas maior, cruzam os vasos ilíacos e entram obliquamente na bexiga.',
      arterias: 'Artérias renais, ramos diretos da aorta abdominal em L1–L2; o ureter recebe ramos da renal, da aorta, das gonadais, das ilíacas e da vesical inferior.',
      veias: 'Veias renais para a cava inferior; a esquerda é mais longa, passa entre a aorta e a mesentérica superior e recebe a gonadal e a suprarrenal esquerdas.',
      nervos: 'Plexo renal (T10–L1). A dor ureteral é referida do flanco à região inguinal e à genitália — a clássica dor em cólica que "desce".',
      linfaticos: 'Linfonodos lombares (para-aórticos e paracavais).',
      reparos: 'Ângulo costovertebral, onde se pesquisa o sinal de Giordano; trajeto ureteral projetado sobre as pontas dos processos transversos lombares.',
      clinica:
        'Os três estreitamentos do ureter — junção ureteropélvica, cruzamento dos vasos ilíacos e junção ureterovesical — são onde o cálculo impacta. A veia gonadal esquerda drena em ângulo reto na renal esquerda, e essa anatomia explica a varicocele predominantemente à esquerda.',
    },
  },
  {
    sistemas: ['urinario'],
    termos: ['bexiga'],
    regiao: {
      id: 'bexiga',
      nome: 'Bexiga urinária',
      topografia:
        'Órgão pélvico subperitoneal atrás da sínfise púbica; vazia, é pélvica, e cheia sobe para o abdome, descolando o peritônio da parede anterior. O trígono vesical, entre os óstios ureterais e o óstio interno da uretra, tem mucosa lisa e aderida.',
      arterias: 'Artérias vesicais superior e inferior, ramos da ilíaca interna.',
      veias: 'Plexo venoso vesical (e prostático no homem) para as veias ilíacas internas.',
      nervos:
        'Parassimpático S2–S4 (nervos esplâncnicos pélvicos) contrai o detrusor e esvazia; simpático (L1–L2) mantém o enchimento; o nervo pudendo comanda o esfíncter externo, voluntário.',
      linfaticos: 'Linfonodos ilíacos externos e internos.',
      reparos: 'Palpável e percutível acima da sínfise quando distendida — o globo vesical.',
      clinica:
        'A bexiga cheia sobe acima do púbis e permite a punção suprapúbica sem atravessar o peritônio. A bexiga neurogênica se explica pelo par simpático/parassimpático descrito acima, e o trígono é a área de maior incidência de tumores uroteliais.',
    },
  },
  {
    sistemas: ['urinario'],
    termos: ['uretra'],
    regiao: {
      id: 'uretra',
      nome: 'Uretra',
      topografia:
        'No homem tem cerca de 18–20 cm e três partes — prostática, membranácea (a mais estreita e fixa) e esponjosa; na mulher tem 3–4 cm e trajeto retilíneo, abrindo-se no vestíbulo à frente do óstio vaginal.',
      arterias: 'Ramos da artéria vesical inferior, da retal média e das artérias do bulbo do pênis.',
      veias: 'Plexos venosos vesical e prostático.',
      nervos: 'Esfíncter interno pelo simpático, esfíncter externo pelo nervo pudendo (S2–S4).',
      clinica:
        'A curva e o estreitamento da uretra masculina explicam a dificuldade da sondagem e a preferência pela sonda de ponta curva na hiperplasia prostática. A brevidade da uretra feminina é a razão anatômica da maior incidência de infecção urinária em mulheres.',
    },
  },

  /* ───────────────────────── Genital ───────────────────────── */
  {
    sistemas: ['genital-feminino'],
    termos: ['ovarios e tubas', 'ovario', 'tuba'],
    regiao: {
      id: 'ovarios',
      nome: 'Ovários e tubas uterinas',
      topografia:
        'Os ovários ficam na fossa ovárica da parede lateral da pelve, suspensos pelo ligamento suspensor (que carrega os vasos gonadais) e pelo ligamento próprio do ovário. As tubas correm na margem livre do ligamento largo, com infundíbulo e fímbrias abraçando o ovário.',
      arterias: 'Artéria ovárica, ramo direto da aorta abdominal em L2, anastomosando-se com o ramo ovárico da artéria uterina.',
      veias: 'Veia ovárica direita para a cava inferior; a esquerda para a veia renal esquerda.',
      nervos: 'Plexo ovárico (T10–T11) — daí a dor ovárica referida à região periumbilical e ao flanco.',
      linfaticos: 'Linfonodos lombares (para-aórticos), acompanhando os vasos gonadais — e não os inguinais.',
      clinica:
        'A fecundação ocorre na ampola tubária, o sítio mais comum de gravidez ectópica. O ureter passa logo abaixo da artéria uterina ("a água passa sob a ponte"), relação crítica na histerectomia. A drenagem para linfonodos para-aórticos define o estadiamento do câncer de ovário.',
    },
  },
  {
    sistemas: ['genital-feminino'],
    termos: ['utero e vagina', 'utero', 'vagina'],
    regiao: {
      id: 'utero',
      nome: 'Útero e vagina',
      topografia:
        'Útero em anteversoflexão sobre a bexiga, com fundo, corpo, istmo e colo; a vagina desce do colo ao vestíbulo, atrás da bexiga e à frente do reto. Atrás, a escavação retouterina (fundo de saco de Douglas) é o ponto mais baixo da cavidade peritoneal na mulher em pé.',
      arterias: 'Artéria uterina (da ilíaca interna), que cruza o ureter, com as artérias vaginal e ovárica completando a rede.',
      veias: 'Plexo venoso uterino e vaginal para as veias ilíacas internas.',
      nervos: 'Plexo uterovaginal; dor do corpo uterino por T10–L1 e do colo e da vagina superior por S2–S4.',
      linfaticos: 'Fundo para linfonodos lombares, corpo para ilíacos externos, colo para ilíacos internos e obturatórios — mapa que orienta o estadiamento do câncer de colo.',
      clinica:
        'O fundo de saco de Douglas acumula sangue e pus e pode ser puncionado pelo fórnice vaginal posterior. A relação do ureter com a artéria uterina é a causa clássica de lesão ureteral iatrogênica em histerectomia.',
    },
  },
  {
    sistemas: ['genital-feminino'],
    termos: ['vulva'],
    regiao: {
      id: 'vulva',
      nome: 'Vulva e períneo',
      topografia:
        'Conjunto da genitália externa feminina: monte do púbis, lábios maiores e menores, clitóris, vestíbulo com os óstios uretral e vaginal e as glândulas vestibulares maiores (de Bartholin).',
      arterias: 'Artérias pudendas internas (ilíaca interna) e pudendas externas (femoral).',
      veias: 'Veias pudendas internas e externas.',
      nervos: 'Nervo pudendo (S2–S4), com o ramo perineal e o nervo dorsal do clitóris; ílio-inguinal e genitofemoral à frente.',
      linfaticos: 'Linfonodos inguinais superficiais — diferente das gônadas, que drenam para os lombares.',
      clinica:
        'O bloqueio do pudendo é feito com referência na espinha isquiática, palpada pela vagina. O corpo do períneo é a estrutura preservada ou seccionada na episiotomia, e sua integridade sustenta o assoalho pélvico.',
    },
  },
  {
    sistemas: ['genital-feminino'],
    termos: ['mama'],
    regiao: {
      id: 'mama',
      nome: 'Mama',
      topografia:
        'Repousa sobre a fáscia peitoral entre a 2ª e a 6ª costela, da borda do esterno à linha axilar média, com o processo axilar (cauda de Spence) penetrando a axila. É formada por 15–20 lobos drenados por ductos lactíferos, sustentada pelos ligamentos suspensores de Cooper.',
      arterias: 'Ramos perfurantes da torácica interna (medial), torácica lateral e toracoacromial (lateral) e intercostais posteriores.',
      veias: 'Veias homônimas; a comunicação com o plexo vertebral (Batson) explica metástases vertebrais diretas.',
      nervos: 'Ramos cutâneos anteriores e laterais dos nervos intercostais 2º a 6º; o mamilo corresponde ao dermátomo T4.',
      linfaticos:
        'Cerca de 75% para os linfonodos axilares (níveis I, II e III de Berg), o restante para os paraesternais (torácicos internos) e para a mama contralateral.',
      clinica:
        'A retração de pele ("casca de laranja") vem da tração dos ligamentos de Cooper pelo tumor. O linfonodo sentinela e o esvaziamento axilar seguem exatamente essa drenagem, e a lesão dos nervos torácico longo e toracodorsal são complicações conhecidas do procedimento.',
    },
  },
  {
    sistemas: ['genital-masculino'],
    termos: ['testiculo'],
    regiao: {
      id: 'testiculos',
      nome: 'Testículos',
      topografia:
        'Alojados no escroto, envolvidos pela túnica vaginal, com o epidídimo em sua face posterolateral. Descem do retroperitônio abdominal durante a vida fetal, arrastando consigo vasos, nervos e drenagem linfática de origem.',
      arterias: 'Artéria testicular, ramo direto da aorta abdominal em L2, dentro do funículo espermático.',
      veias: 'Plexo pampiniforme → veia testicular; a direita drena na cava inferior e a esquerda, em ângulo reto, na veia renal esquerda.',
      nervos: 'Plexo testicular (T10–T11), motivo pelo qual a dor testicular é referida à região periumbilical.',
      linfaticos: 'Linfonodos lombares (para-aórticos) — o escroto é que drena para os inguinais.',
      clinica:
        'Essa dissociação linfática é decisiva: tumor de testículo estadia-se no retroperitônio, não na virilha. A torção testicular é emergência de horas, e o reflexo cremastérico (L1–L2) desaparece. A varicocele é predominantemente esquerda pela drenagem em ângulo reto na renal.',
    },
  },
  {
    sistemas: ['genital-masculino'],
    termos: ['penis e escroto', 'penis', 'escroto'],
    regiao: {
      id: 'penis',
      nome: 'Pênis e escroto',
      topografia:
        'O pênis tem dois corpos cavernosos dorsais e o corpo esponjoso ventral, que envolve a uretra esponjosa e termina na glande. O escroto é uma bolsa cutânea com o músculo dartos, dividida por um septo.',
      arterias: 'Artérias profundas do pênis, dorsal do pênis e do bulbo, todas ramos da pudenda interna; escroto pelas pudendas externas e internas.',
      veias: 'Veia dorsal profunda para o plexo prostático; veias superficiais para as pudendas externas.',
      nervos: 'Nervo dorsal do pênis (ramo do pudendo, S2–S4) para a sensibilidade; parassimpático (nervos cavernosos) para a ereção e simpático para a ejaculação.',
      linfaticos: 'Pele do pênis e escroto para linfonodos inguinais superficiais; glande e estruturas profundas para inguinais profundos e ilíacos.',
      clinica:
        '"Point and Shoot": ereção é parassimpática, ejaculação é simpática. A drenagem linfática superficial explica por que o câncer de pênis se apresenta com adenomegalia inguinal, enquanto o de testículo não.',
    },
  },
  {
    sistemas: ['genital-masculino'],
    termos: ['glandulas anexas'],
    regiao: {
      id: 'glandulas-masculinas',
      nome: 'Glândulas genitais anexas',
      topografia:
        'Próstata abaixo da bexiga, envolvendo a uretra prostática, com base, ápice e os lobos; vesículas seminais atrás da bexiga, acima da próstata; glândulas bulbouretrais no diafragma urogenital.',
      arterias: 'Artérias vesicais inferiores e retais médias, ramos da ilíaca interna.',
      veias: 'Plexo venoso prostático, comunicante com o plexo vertebral interno.',
      nervos: 'Plexo prostático (parassimpático S2–S4 e simpático), com os feixes neurovasculares laterais responsáveis pela ereção.',
      linfaticos: 'Linfonodos ilíacos internos, obturatórios e sacrais.',
      clinica:
        'A hiperplasia benigna cresce na zona de transição e obstrui a uretra; o adenocarcinoma nasce na zona periférica, o que o torna palpável ao toque retal. A comunicação com o plexo de Batson explica a metástase vertebral osteoblástica típica.',
    },
  },
  {
    sistemas: ['genital-masculino'],
    termos: ['orgaos in situ'],
    regiao: {
      id: 'genital-in-situ',
      nome: 'Órgãos genitais masculinos in situ',
      topografia:
        'Visão de conjunto da pelve masculina em corte: bexiga à frente, próstata abaixo dela, vesículas seminais e ductos deferentes atrás, reto posteriormente, com a escavação retovesical entre eles.',
      arterias: 'Ramos da artéria ilíaca interna para todas as vísceras pélvicas.',
      veias: 'Plexos venosos vesical e prostático para as veias ilíacas internas.',
      nervos: 'Plexo hipogástrico inferior, com componentes simpático (L1–L2) e parassimpático (S2–S4).',
      clinica:
        'A escavação retovesical é o ponto mais baixo do peritônio no homem e onde coleções pélvicas se acumulam. O toque retal alcança a próstata, as vesículas seminais e o fundo de saco.',
    },
  },
]

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Fallback quando nenhuma regra casa — mantém a ficha coerente sem inventar dado. */
const REGIAO_GENERICA: RegiaoAnatomica = {
  id: 'geral',
  nome: 'Anatomia geral',
  topografia:
    'Estrutura apresentada na região demonstrada por esta prancha, em relação com os planos, ossos, vasos e nervos vizinhos.',
  arterias: 'Irrigada pelos ramos arteriais próprios da região demonstrada.',
  veias: 'Drenagem venosa acompanhando os vasos arteriais da região.',
  nervos: 'Inervação segmentar correspondente ao território demonstrado.',
}

/**
 * Comparação por palavra inteira, e não por substring: "antebraço" contém
 * "braço", "perna" contém "pé" e "cóccix" contém "coco". Sem a borda de
 * palavra, a coleção do antebraço cairia na região do braço.
 */
function contemTermo(nivel: string, termo: string) {
  const alvo = normalizar(termo)
  return new RegExp(`(^|[^a-z0-9])${alvo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`).test(nivel)
}

/**
 * Resolve a região a partir do caminho da coleção (do mais específico para o
 * mais genérico) e do sistema. `caminho` é o breadcrumb da coleção.
 */
export function resolverRegiao(sistemaSlug: string, caminho: string[]): RegiaoAnatomica {
  const trilhaInvertida = caminho.map(normalizar).reverse()

  for (const nivel of trilhaInvertida) {
    for (const regra of REGIOES) {
      if (regra.sistemas && !regra.sistemas.includes(sistemaSlug)) continue
      if (regra.termos.some(termo => contemTermo(nivel, termo))) return regra.regiao
    }
  }

  // Segunda passada ignorando o filtro de sistema: coleções como "Coluna
  // Vertebral" aparecem tanto no esquelético quanto no articular.
  for (const nivel of trilhaInvertida) {
    for (const regra of REGIOES) {
      if (regra.termos.some(termo => contemTermo(nivel, termo))) return regra.regiao
    }
  }

  return REGIAO_GENERICA
}

export { REGIAO_GENERICA }
