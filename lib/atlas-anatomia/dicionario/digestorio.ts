import type { EntradaDicionario } from './tipos'

/**
 * Sistema digestório.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const DIGESTORIO: EntradaDicionario[] = [
  {
    termos: ['Língua'],
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
    termos: ['Esôfago'],
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
    termos: ['Estômago'],
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
    termos: ['Fígado'],
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
    termos: ['Vesícula Biliar'],
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
    termos: ['Pâncreas'],
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
    termos: ['Apêndice Vermiforme'],
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
    termos: ['Duodeno'],
    resumo: 'Primeira porção do intestino delgado, em forma de C em torno da cabeça do pâncreas.',
    localizacao:
      'Quatro porções: superior (bulbo, intraperitoneal), descendente (com a papila duodenal maior), horizontal (cruzada pela mesentérica superior) e ascendente, terminando na flexura duodenojejunal, fixada pelo ligamento de Treitz.',
    funcao: 'Recebe o quimo, a bile e o suco pancreático, neutraliza a acidez e inicia a digestão intestinal.',
    inervacao:
      'Fronteira embriológica no meio do órgão: acima da papila maior é intestino anterior, com vago e simpático de T5 a T9, e dor referida ao epigástrio; abaixo dela é intestino médio, com simpático de T10, e dor periumbilical. A papila divide o duodeno em dois territórios de dor distintos.',
    vascularizacao: 'Pancreatoduodenais superiores (tronco celíaco) e inferiores (mesentérica superior) — a fronteira entre intestino anterior e médio.',
    clinica:
      'O ligamento de Treitz é o divisor entre hemorragia digestiva alta e baixa. A úlcera do bulbo é a mais comum e, quando posterior, sangra pela gastroduodenal; quando anterior, perfura. A terceira porção pode ser comprimida entre a aorta e a mesentérica superior.',
    pontos: ['Ligamento de Treitz divide HDA de HDB', 'Papila duodenal maior na segunda porção', 'Úlcera posterior sangra, anterior perfura'],
  },
  {
    termos: ['Glândula Tireoide'],
    classe: 'glandula',
    resumo: 'Maior glândula endócrina pura do corpo, em forma de borboleta sobre a traqueia.',
    localizacao:
      'Dois lobos unidos pelo istmo, que cruza a traqueia na altura do 2º ao 4º anel, entre C5 e T1. Envolvida pela bainha visceral, sobe junto da laringe na deglutição — sinal que a distingue de qualquer outra massa cervical.',
    funcao: 'Produz T3 e T4, que fixam a taxa metabólica basal, e calcitonina pelas células parafoliculares.',
    vascularizacao:
      'Artéria tireóidea superior (carótida externa) e inferior (tronco tireocervical); drenagem pelas veias tireóideas superior, média e inferior.',
    inervacao: 'Fibras simpáticas dos gânglios cervicais; o controle real é hormonal, pelo TSH da hipófise.',
    relacoes:
      'Dois nervos correm coladinhos: o laríngeo recorrente sobe no sulco traqueoesofágico, junto da tireóidea inferior, e o ramo externo do laríngeo superior acompanha a tireóidea superior. As paratireoides ficam na face posterior.',
    clinica:
      'A anatomia dita as complicações da tireoidectomia: rouquidão por lesão do recorrente, voz sem agudos por lesão do laríngeo superior externo, e hipocalcemia por remoção inadvertida das paratireoides. Bócio mergulhante pode comprimir traqueia e causar estridor.',
    pontos: [
      'Sobe à deglutição — diferencial de massa cervical',
      'Recorrente com a tireóidea inferior; laríngeo superior com a superior',
      'Paratireoides na face posterior',
    ],
  },
  {
    termos: ['Baço'],
    classe: 'linfatico',
    resumo: 'Maior órgão linfoide do corpo — filtro do sangue, e não da linfa.',
    localizacao:
      'Intraperitoneal, no hipocôndrio esquerdo, entre a 9ª e a 11ª costela, com o eixo longo acompanhando a 10ª. Encosta no diafragma, no estômago, no rim esquerdo, na cauda do pâncreas e na flexura cólica esquerda.',
    funcao:
      'Remove hemácias velhas e partículas opsonizadas, monta resposta imune contra antígenos circulantes e é reservatório de plaquetas. Na vida fetal, é hematopoético.',
    vascularizacao: 'Artéria esplênica, ramo tortuoso do tronco celíaco; a veia esplênica se une à mesentérica superior para formar a veia porta.',
    inervacao: 'Plexo celíaco. A irritação diafragmática refere dor ao ombro esquerdo — o sinal de Kehr.',
    clinica:
      'É o órgão mais lesado no trauma abdominal fechado, sobretudo com fratura de costelas baixas à esquerda. Quando cresce, avança em direção à fossa ilíaca direita e ganha a incisura palpável. A esplenectomia exige vacinar contra germes encapsulados: sem baço, pneumococo, meningococo e Haemophilus podem virar sepse fulminante.',
    pontos: [
      'Costelas 9 a 11 à esquerda — trauma fechado',
      'Cresce em direção à fossa ilíaca direita',
      'Sepse por encapsulados após esplenectomia',
    ],
  },
  {
    termos: ['Reto'],
    classe: 'viscera',
    resumo: 'Segmento final do intestino grosso, entre o sigmoide e o canal anal — reservatório antes da evacuação.',
    localizacao:
      'Começa em S3, acompanha a concavidade do sacro e termina no canal anal. Perde as tênias, as saculações e os apêndices omentais que caracterizam o cólon, e tem apenas o terço superior revestido por peritônio à frente.',
    funcao: 'Armazena as fezes e, ao distender, dispara o reflexo de defecação — que a continência voluntária, pelo esfíncter externo, é capaz de adiar.',
    vascularizacao:
      'Retal superior (mesentérica inferior), retais médias (ilíaca interna) e retais inferiores (pudenda interna). Essa tripla origem cria uma anastomose portossistêmica na submucosa.',
    inervacao: 'Plexo hipogástrico inferior; o esfíncter externo é do nervo pudendo (S2–S4), voluntário.',
    relacoes: 'À frente, a próstata e as vesículas seminais no homem, e a vagina na mulher — a razão de o toque retal alcançar a próstata.',
    clinica:
      'A anastomose portossistêmica retal participa das varizes na hipertensão portal. A drenagem linfática dupla — para os mesentéricos inferiores acima da linha pectínea e para os inguinais abaixo — decide o estadiamento e a via cirúrgica do câncer retal.',
    pontos: [
      'Sem tênias, saculações ou apêndices omentais',
      'Três artérias retais e a anastomose portossistêmica',
      'Linha pectínea divide a drenagem linfática',
    ],
  },
]
