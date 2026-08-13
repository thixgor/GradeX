/**
 * Classificação estrutural dos marcadores do Atlas.
 *
 * O acervo entrega apenas o nome da estrutura. A terminologia anatômica, no
 * entanto, é sistemática: "Músculo Braquiorradial", "Artéria Radial",
 * "Processo Espinhoso" e "Forame Vertebral" já declaram, no próprio nome, a
 * que classe pertencem. Este módulo lê esse nome e devolve a classe, que por
 * sua vez define o que faz sentido dizer sobre função, sobre como localizar a
 * estrutura na peça e sobre o que costuma ser cobrado dela na clínica.
 *
 * Cruzando classe (o que é) com região (onde está, quem irriga e inerva —
 * ver `regioes.ts`), sai uma ficha específica sem inventar dado nenhum.
 */

export type ClasseId =
  | 'musculo'
  | 'tendao'
  | 'ligamento'
  | 'fascia'
  | 'articulacao'
  | 'cartilagem'
  | 'osso'
  | 'osso-carpal'
  | 'acidente-osseo'
  | 'passagem-ossea'
  | 'sutura'
  | 'fonticulo'
  | 'ponto-craniometrico'
  | 'diametro-cefalico'
  | 'seio-paranasal'
  | 'arteria'
  | 'veia'
  | 'seio-venoso'
  | 'nervo'
  | 'plexo-nervoso'
  | 'ganglio'
  | 'snc'
  | 'meninge'
  | 'ventriculo'
  | 'camara-cardiaca'
  | 'valva'
  | 'via-aerea'
  | 'viscera'
  | 'glandula'
  | 'linfatico'
  | 'serosa'
  | 'dente'
  | 'cardiaco'
  | 'estrutura'

export interface ClasseEstrutural {
  id: ClasseId
  /** Etiqueta curta exibida como selo na ficha. */
  rotulo: string
  /** Frase de identidade: "o que é isso". */
  resumo: string
  /** Como achar a estrutura na peça e em que plano ela vive. */
  localizacao: string
  /** O que a estrutura faz. */
  funcao: string
  /** Correlação clínica genérica da classe (a região refina). */
  clinica: string
  /** Perguntas que o estudante deve saber responder sobre a estrutura. */
  pontos: string[]
  /** Faz sentido mostrar irrigação/inervação regional nesta classe? */
  mostraVasos?: boolean
  mostraNervos?: boolean
}

const CLASSES: Record<ClasseId, ClasseEstrutural> = {
  musculo: {
    id: 'musculo',
    rotulo: 'Músculo esquelético',
    resumo: 'Músculo estriado esquelético — ventre contrátil com origem e inserção definidas, sob controle voluntário.',
    localizacao:
      'Ocupa um compartimento delimitado por fáscias e septos intermusculares; sua direção de fibras aponta o movimento que ele produz, e o osso em que se insere define a articulação que ele cruza.',
    funcao:
      'Encurta-se para produzir movimento na articulação que cruza e, tão importante quanto isso, trabalha excentricamente para frear o movimento contrário e estabilizar a articulação durante a carga.',
    clinica:
      'Perda de força em um grupo muscular localiza a lesão no nervo que o comanda; atrofia, fasciculação e alteração de reflexo completam o mapeamento. Os compartimentos fasciais que o contêm são também o que torna possível a síndrome compartimental.',
    pontos: [
      'Origem, inserção e ação principal',
      'Nervo que o inerva e a raiz de onde esse nervo vem',
      'Movimento que se perde quando esse nervo é lesado',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
  tendao: {
    id: 'tendao',
    rotulo: 'Tendão',
    resumo: 'Continuação fibrosa e densa do ventre muscular, que transmite a força da contração até o osso.',
    localizacao:
      'Sucede o ventre muscular no sentido do movimento e costuma correr dentro de bainhas sinoviais ou sob retináculos, que o mantêm rente ao osso e evitam o efeito de corda de arco.',
    funcao:
      'Transmite a força muscular ao esqueleto, armazena e devolve energia elástica e concentra a tração de um ventre volumoso numa área de inserção pequena.',
    clinica:
      'Tendinopatias e rupturas seguem os pontos de menor vascularização e maior atrito. A perda do movimento com o ventre muscular íntegro aponta lesão tendínea, e não neurológica.',
    pontos: [
      'De qual músculo é a continuação e onde se insere',
      'Bainha ou retináculo que atravessa',
      'Movimento perdido na ruptura',
    ],
    mostraVasos: true,
    mostraNervos: false,
  },
  ligamento: {
    id: 'ligamento',
    rotulo: 'Ligamento',
    resumo: 'Faixa de tecido conjuntivo denso que une osso a osso e limita passivamente o movimento articular.',
    localizacao:
      'Cruza a articulação de um osso ao outro, reforçando a cápsula por fora (colaterais) ou correndo dentro dela (intracapsulares), sempre na direção da força que precisa conter.',
    funcao:
      'Restringe o movimento além do arco fisiológico, guia a cinemática articular e alimenta a propriocepção com terminações que informam a posição da articulação.',
    clinica:
      'Entorses graduam-se pela extensão da ruptura; a instabilidade residual é avaliada por testes que estressam exatamente a direção que o ligamento contém. A ressonância é o exame de escolha.',
    pontos: [
      'Quais ossos ele une',
      'Qual movimento ele limita',
      'Teste clínico que o estressa',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  fascia: {
    id: 'fascia',
    rotulo: 'Fáscia / retináculo',
    resumo: 'Lâmina de tecido conjuntivo que envolve, separa e contém músculos, vasos e nervos em compartimentos.',
    localizacao:
      'Reveste os planos musculares e emite septos que se fixam ao osso, criando compartimentos fechados; nos punhos e tornozelos espessa-se em retináculos que amarram os tendões.',
    funcao:
      'Compartimentaliza a região, mantém tendões em posição durante o movimento, orienta a disseminação (ou a contenção) de coleções e participa da bomba muscular venosa.',
    clinica:
      'Por serem inextensíveis, os compartimentos fasciais transformam edema em isquemia — é a base da síndrome compartimental e da indicação de fasciotomia. Também guiam o caminho de abscessos e hematomas.',
    pontos: [
      'Que compartimento ela delimita',
      'Que estruturas passam por baixo dela',
      'Consequência da pressão elevada nesse compartimento',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  articulacao: {
    id: 'articulacao',
    rotulo: 'Articulação',
    resumo: 'União entre dois ou mais ossos, classificada pelo tecido que os liga e pelos eixos de movimento que permite.',
    localizacao:
      'Situa-se no encontro das superfícies ósseas demonstradas, envolvida por cápsula e reforçada pelos ligamentos que aparecem na mesma prancha.',
    funcao:
      'Permite o movimento nos eixos compatíveis com a forma de suas superfícies e, ao mesmo tempo, transmite carga entre os segmentos ósseos.',
    clinica:
      'Derrame, dor à mobilização e limitação de arco são os sinais cardinais. A forma articular prediz o padrão de luxação e o tipo de artrose que costuma desenvolver.',
    pontos: [
      'Tipo morfológico e eixos de movimento',
      'Ligamentos que a estabilizam',
      'Direção mais comum de luxação',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
  cartilagem: {
    id: 'cartilagem',
    rotulo: 'Cartilagem / fibrocartilagem',
    resumo: 'Tecido cartilaginoso interposto às superfícies ósseas ou às margens articulares, sem vasos próprios em boa parte de sua extensão.',
    localizacao:
      'Reveste as superfícies de contato ou se interpõe entre elas como menisco, disco ou lábio, aprofundando e ajustando a congruência da articulação.',
    funcao:
      'Distribui carga sobre uma área maior, reduz o atrito a valores menores que os do gelo, absorve impacto e melhora o encaixe entre superfícies de raios diferentes.',
    clinica:
      'Como é pouco vascularizada, cicatriza mal: lesões na zona avascular tendem à ressecção, e na zona periférica vascularizada podem ser suturadas. Degeneração progressiva é a via final da artrose.',
    pontos: [
      'Que superfícies ela separa ou aprofunda',
      'Zona vascularizada versus avascular',
      'Manobra clínica que reproduz a dor',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  osso: {
    id: 'osso',
    rotulo: 'Osso',
    resumo: 'Peça óssea nomeada, com corpo e extremidades onde se concentram as superfícies articulares e as áreas de inserção.',
    localizacao:
      'Ocupa o eixo do segmento demonstrado; suas faces, margens e extremidades organizam os compartimentos musculares ao redor e definem as articulações proximal e distal.',
    funcao:
      'Sustenta carga, funciona como alavanca para os músculos que nele se inserem, protege estruturas vizinhas e abriga medula óssea hematopoética.',
    clinica:
      'Cada osso tem padrões próprios de fratura, conforme a direção da força e a espessura da cortical. A vascularização determina o risco de necrose avascular e a velocidade de consolidação.',
    pontos: [
      'Articulações que forma acima e abaixo',
      'Principais inserções musculares',
      'Padrão de fratura e estruturas em risco',
    ],
    mostraVasos: true,
    mostraNervos: false,
  },
  'osso-carpal': {
    id: 'osso-carpal',
    rotulo: 'Osso curto',
    resumo: 'Osso curto do carpo ou do tarso, quase totalmente revestido por cartilagem articular e integrado a um bloco funcional.',
    localizacao:
      'Ocupa uma posição fixa dentro da fileira a que pertence, articulando-se com vários vizinhos ao mesmo tempo — o que faz o movimento do conjunto ser a soma de pequenos deslizamentos.',
    funcao:
      'Distribui e transmite carga entre o segmento proximal e os raios distais, com movimentos pequenos e múltiplos que somados produzem grande adaptabilidade.',
    clinica:
      'A superfície quase toda articular deixa pouco espaço para entrada de vasos, o que explica a vulnerabilidade à necrose avascular após fratura ou luxação.',
    pontos: [
      'Fileira e vizinhos com que se articula',
      'Como é palpado no exame físico',
      'Risco vascular após fratura',
    ],
    mostraVasos: true,
    mostraNervos: false,
  },
  'acidente-osseo': {
    id: 'acidente-osseo',
    rotulo: 'Acidente ósseo',
    resumo: 'Relevo ou depressão da superfície óssea — a marca deixada por aquilo que se insere, se apoia ou passa por ali.',
    localizacao:
      'Ocupa um ponto constante da peça óssea demonstrada, e é justamente essa constância que o torna referência para localizar músculos, vasos e nervos vizinhos.',
    funcao:
      'Oferece área de inserção para músculos e ligamentos, superfície de contato articular ou leito para uma estrutura que corre rente ao osso.',
    clinica:
      'Acidentes palpáveis são os reparos do exame físico e as referências para punções, bloqueios e incisões; nas radiografias, servem de âncora para medir alinhamento e reconhecer traços de fratura.',
    pontos: [
      'O que se insere ou se apoia nesse relevo',
      'Se é palpável e como',
      'Estrutura vizinha que ele ajuda a localizar',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  'passagem-ossea': {
    id: 'passagem-ossea',
    rotulo: 'Forame / canal',
    resumo: 'Abertura, canal ou fissura que atravessa o osso e dá passagem protegida a vasos, nervos ou ductos.',
    localizacao:
      'Perfura a peça óssea demonstrada num ponto constante, comunicando dois compartimentos — e o que interessa aqui é sempre o que passa por dentro.',
    funcao:
      'Conduz e protege a estrutura que o atravessa, mantendo-a fixa em posição enquanto ossos e partes moles se movem em volta.',
    clinica:
      'A regra é simples e implacável: fratura, estenose ou massa nesse trajeto comprime o conteúdo. Localizar o forame é localizar o déficit — motor, sensitivo ou vascular.',
    pontos: [
      'O que passa por dentro',
      'Que compartimentos ele comunica',
      'Déficit esperado quando é comprometido',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  sutura: {
    id: 'sutura',
    rotulo: 'Sutura',
    resumo: 'Articulação fibrosa entre ossos do crânio, praticamente imóvel no adulto e ainda aberta na criança.',
    localizacao:
      'Corre na linha de encontro entre duas peças da calvária ou da face, formando um traço serrilhado característico.',
    funcao:
      'Une firmemente os ossos do crânio permitindo o crescimento perpendicular à sua linha durante a infância, e absorve pequenas deformações do crânio no adulto.',
    clinica:
      'O fechamento precoce (craniossinostose) deforma o crânio de modo previsível, no eixo perpendicular à sutura acometida. Nas radiografias, a sutura é o principal diagnóstico diferencial de traço de fratura.',
    pontos: [
      'Que ossos ela une',
      'Idade esperada de fechamento',
      'Como diferenciá-la de uma fratura na imagem',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  fonticulo: {
    id: 'fonticulo',
    rotulo: 'Fontículo',
    resumo: 'Área membranácea entre ossos ainda não ossificados do crânio do recém-nascido — a "moleira".',
    localizacao: 'Ocupa o encontro de suturas ainda abertas, onde só há membrana entre o couro cabeludo e as meninges.',
    funcao:
      'Permite o cavalgamento dos ossos durante a passagem pelo canal de parto e acomoda o crescimento rápido do encéfalo nos primeiros meses de vida.',
    clinica:
      'É janela clínica e janela de imagem: abaulada e tensa na hipertensão intracraniana, deprimida na desidratação, e via de acesso do ultrassom transfontanelar. O tempo de fechamento é marco do desenvolvimento.',
    pontos: [
      'Formato e localização',
      'Idade de fechamento',
      'O que a alteração de tensão significa',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  'ponto-craniometrico': {
    id: 'ponto-craniometrico',
    rotulo: 'Ponto craniométrico',
    resumo: 'Marco convencionado na superfície do crânio, quase sempre num encontro de suturas ou numa saliência constante.',
    localizacao: 'Ponto fixo e reproduzível da superfície craniana, definido por convenção internacional para medida e comparação.',
    funcao:
      'Serve de referência para medir o crânio, comparar populações e localizar, por fora, estruturas que estão por dentro — de vasos meníngeos a giros corticais.',
    clinica:
      'São o endereço da neurocirurgia e da antropologia forense: definem pontos de trepanação, orientam craniotomias e permitem estimativas de identificação em ossadas.',
    pontos: [
      'Que suturas ou relevos o definem',
      'Que estrutura profunda ele projeta',
      'Uso prático na medida ou no acesso cirúrgico',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  'diametro-cefalico': {
    id: 'diametro-cefalico',
    rotulo: 'Diâmetro cefálico',
    resumo: 'Medida entre dois pontos craniométricos do polo cefálico fetal, usada em obstetrícia.',
    localizacao: 'Traçado entre dois marcos ósseos definidos do crânio do recém-nascido, num plano fixo.',
    funcao:
      'Quantifica a dimensão do polo cefálico que se apresenta ao canal de parto — e é a atitude da cabeça fetal (fletida ou defletida) que decide qual diâmetro vai enfrentar a bacia.',
    clinica:
      'Quanto melhor a flexão, menor o diâmetro que se apresenta: o suboccipitobregmático (≈9,5 cm) é o mais favorável, e os diâmetros das deflexões são progressivamente maiores. É por isso que a deflexão da cabeça dificulta o parto.',
    pontos: [
      'Pontos entre os quais é medido',
      'Valor aproximado em centímetros',
      'Apresentação fetal correspondente',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  'seio-paranasal': {
    id: 'seio-paranasal',
    rotulo: 'Seio paranasal',
    resumo: 'Cavidade pneumática escavada em osso da face ou do crânio, revestida por mucosa respiratória e aberta na cavidade nasal.',
    localizacao:
      'Ocupa o interior do osso que lhe dá nome e drena por um óstio para um meato da parede lateral da cavidade nasal.',
    funcao:
      'Aligeira o crânio, aquece e umidifica o ar inspirado e contribui para a ressonância da voz; a mucosa produz muco levado ao óstio pelo transporte mucociliar.',
    clinica:
      'A obstrução do óstio é o evento central da sinusite. A proximidade com a órbita e com a fossa craniana anterior explica as complicações orbitárias e intracranianas.',
    pontos: [
      'Osso que o contém e meato onde drena',
      'Idade de pneumatização',
      'Complicações por vizinhança',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  arteria: {
    id: 'arteria',
    rotulo: 'Artéria',
    resumo: 'Vaso de parede espessa e elástica que conduz sangue sob pressão do coração para o território que irriga.',
    localizacao:
      'Corre em plano profundo, protegida por músculos e ossos, geralmente acompanhada de veias satélites e de um nervo, formando o feixe neurovascular da região.',
    funcao:
      'Distribui sangue, oxigênio e nutrientes ao território que leva seu nome, amortecendo a onda sistólica na parede elástica e regulando o fluxo local pelo tônus da musculatura lisa.',
    clinica:
      'Onde uma artéria é superficial e apoia-se em osso, há pulso palpável e ponto de compressão. Sua oclusão define território de isquemia; sua lesão, o sítio de hemorragia.',
    pontos: [
      'De qual tronco se origina',
      'Território que irriga e anastomoses de socorro',
      'Onde é palpável ou comprimível',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  veia: {
    id: 'veia',
    rotulo: 'Veia',
    resumo: 'Vaso de retorno, de parede fina e lúmen amplo, com valvas que impõem sentido único ao fluxo nos membros.',
    localizacao:
      'Ocupa dois planos: as veias profundas acompanham as artérias homônimas dentro dos compartimentos, e as superficiais correm na tela subcutânea, acima da fáscia.',
    funcao:
      'Devolve o sangue ao coração e serve de reservatório de volume; nos membros, depende da bomba muscular e das valvas para vencer a gravidade.',
    clinica:
      'As superficiais são a via de punção e de acesso venoso; as profundas, o sítio da trombose. A incompetência valvar produz varizes e insuficiência venosa crônica.',
    pontos: [
      'Território que drena e para onde desemboca',
      'Superficial ou profunda',
      'Uso clínico: punção, enxerto ou risco trombótico',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  'seio-venoso': {
    id: 'seio-venoso',
    rotulo: 'Seio venoso da dura-máter',
    resumo: 'Canal venoso escavado entre os folhetos da dura-máter, sem parede muscular e sem valvas.',
    localizacao:
      'Corre nas pregas e nas linhas de inserção da dura-máter, convergindo para a confluência dos seios e daí para o seio sigmóideo e a veia jugular interna.',
    funcao:
      'Recebe o sangue venoso do encéfalo, do diploe e das veias emissárias, e absorve o líquido cerebrospinal pelas granulações aracnóideas.',
    clinica:
      'Como não colapsa, sua lesão causa sangramento persistente e risco de embolia gasosa. A trombose de seio venoso cursa com cefaleia, hipertensão intracraniana e infartos venosos que não respeitam território arterial.',
    pontos: [
      'Que região drena e para onde vai',
      'Relação com as granulações aracnóideas',
      'Quadro clínico da trombose',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  nervo: {
    id: 'nervo',
    rotulo: 'Nervo',
    resumo: 'Feixe de fibras nervosas envolvido por epineuro, conduzindo sinais motores, sensitivos e/ou autonômicos.',
    localizacao:
      'Percorre planos definidos entre músculos e fáscias, quase sempre junto de artéria e veia; em alguns pontos aproxima-se do osso ou da superfície e fica vulnerável.',
    funcao:
      'Leva o comando motor aos músculos do seu território, traz a sensibilidade da pele e das articulações correspondentes e carrega fibras autonômicas para vasos e glândulas.',
    clinica:
      'A lesão produz um padrão previsível: fraqueza dos músculos que ele inerva, anestesia no seu território cutâneo e, com o tempo, atrofia. Localizar o ponto da lesão no trajeto é o que define conduta.',
    pontos: [
      'Raízes de origem e trajeto',
      'Músculos que inerva e território cutâneo',
      'Ponto de compressão e deformidade característica',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  'plexo-nervoso': {
    id: 'plexo-nervoso',
    rotulo: 'Plexo nervoso',
    resumo: 'Rede em que os ramos ventrais de vários nervos espinais se misturam antes de formar os nervos periféricos.',
    localizacao:
      'Organiza-se em raízes, troncos, divisões, fascículos e ramos terminais ao longo de um trajeto anatômico definido, em relação com vasos e músculos da região.',
    funcao:
      'Redistribui fibras de vários níveis medulares, de modo que cada nervo periférico carrega mais de uma raiz e cada raiz alcança mais de um nervo — o que dá redundância ao sistema.',
    clinica:
      'Essa mistura é o que separa lesão radicular de lesão troncular: a raiz dá um padrão em faixa (dermátomo/miótomo); o nervo periférico dá um padrão de território. Reconhecer o nível da lesão no plexo define prognóstico.',
    pontos: [
      'Raízes que o compõem',
      'Nervos terminais que dele saem',
      'Padrão clínico das lesões altas e baixas',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  ganglio: {
    id: 'ganglio',
    rotulo: 'Gânglio nervoso',
    resumo: 'Agrupamento de corpos de neurônios fora do sistema nervoso central.',
    localizacao:
      'Fica em ponto fixo do trajeto nervoso — na raiz dorsal, junto à coluna (cadeia simpática) ou próximo ao órgão-alvo, no caso parassimpático.',
    funcao:
      'Aloja os corpos celulares dos neurônios sensitivos (gânglio sensitivo) ou faz a sinapse entre o neurônio pré e o pós-ganglionar (gânglio autonômico).',
    clinica:
      'O gânglio da raiz dorsal é o reservatório latente do vírus varicela-zóster: a reativação produz o herpes-zóster restrito ao dermátomo correspondente.',
    pontos: [
      'Tipo: sensitivo ou autonômico',
      'Onde fica no trajeto',
      'O que a lesão produz',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  snc: {
    id: 'snc',
    rotulo: 'Sistema nervoso central',
    resumo: 'Componente do encéfalo ou da medula espinal, formado por substância cinzenta e branca e envolvido pelas meninges.',
    localizacao:
      'Ocupa posição fixa dentro da cavidade craniana ou do canal vertebral, com relações constantes com ventrículos, cisternas e vasos que servem de referência na imagem.',
    funcao:
      'Processa, integra ou conduz informação nervosa dentro do circuito a que pertence — sensitivo, motor, autonômico, cognitivo ou de coordenação.',
    clinica:
      'A neurologia funciona por localização: a combinação de sinais aponta a estrutura acometida antes mesmo do exame de imagem, e o território vascular envolvido explica por que aqueles sinais vieram juntos.',
    pontos: [
      'Que via ou função passa por aqui',
      'Território arterial correspondente',
      'Sinal clínico da lesão',
    ],
    mostraVasos: true,
    mostraNervos: false,
  },
  meninge: {
    id: 'meninge',
    rotulo: 'Meninge',
    resumo: 'Camada de revestimento do sistema nervoso central, interposta entre o tecido nervoso e seu envoltório ósseo.',
    localizacao:
      'Dispõe-se em camadas concêntricas — dura, aracnoide e pia — delimitando os espaços extradural, subdural e subaracnóideo.',
    funcao:
      'Protege mecanicamente o tecido nervoso, sustenta os vasos que entram no parênquima e delimita o compartimento por onde circula o líquido cerebrospinal.',
    clinica:
      'Cada espaço tem sua hemorragia e sua semiologia: extradural arterial e de instalação rápida, subdural venosa e às vezes arrastada, subaracnóidea com cefaleia súbita e rigidez de nuca.',
    pontos: [
      'Que espaço ela delimita',
      'Vaso que sangra nesse espaço',
      'Formato da coleção na tomografia',
    ],
    mostraVasos: true,
    mostraNervos: false,
  },
  ventriculo: {
    id: 'ventriculo',
    rotulo: 'Ventrículo / liquor',
    resumo: 'Cavidade do sistema ventricular encefálico, revestida por epêndima e preenchida por líquido cerebrospinal.',
    localizacao:
      'Faz parte de um circuito contínuo: ventrículos laterais → forames interventriculares → III ventrículo → aqueduto do mesencéfalo → IV ventrículo → espaço subaracnóideo.',
    funcao:
      'Abriga e conduz o líquido cerebrospinal produzido pelos plexos corióideos, que amortece o encéfalo, sustenta seu peso aparente e participa da homeostase do meio nervoso.',
    clinica:
      'Bloqueio em qualquer ponto do circuito produz hidrocefalia obstrutiva a montante; a dilatação ventricular na imagem aponta o nível da obstrução. Falha na absorção pelas granulações dá hidrocefalia comunicante.',
    pontos: [
      'Posição no circuito liquórico',
      'Estreitamento que costuma obstruir',
      'Padrão de dilatação na imagem',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  'camara-cardiaca': {
    id: 'camara-cardiaca',
    rotulo: 'Câmara cardíaca',
    resumo: 'Cavidade do coração, com parede de espessura proporcional à pressão que precisa gerar.',
    localizacao:
      'Ocupa posição definida dentro do saco pericárdico, no mediastino médio, com relações fixas com as valvas, os septos e os grandes vasos que dela partem ou nela desembocam.',
    funcao:
      'Recebe o sangue de um circuito e o impulsiona para o seguinte, num ciclo de enchimento e ejeção sincronizado pelo sistema de condução.',
    clinica:
      'Sobrecarga de pressão engrossa a parede (hipertrofia) e sobrecarga de volume a dilata — distinção que ecocardiograma, eletrocardiograma e radiografia de tórax traduzem em achados específicos.',
    pontos: [
      'De onde recebe e para onde ejeta',
      'Valvas de entrada e de saída',
      'Território coronariano correspondente',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
  valva: {
    id: 'valva',
    rotulo: 'Valva cardíaca',
    resumo: 'Conjunto de válvulas de tecido fibroso que garante fluxo unidirecional entre câmaras ou para os grandes vasos.',
    localizacao:
      'Fica no anel fibroso correspondente do esqueleto cardíaco, entre átrio e ventrículo (atrioventricular) ou entre ventrículo e grande vaso (semilunar).',
    funcao:
      'Abre-se passivamente pelo gradiente de pressão e fecha-se quando ele se inverte, impedindo o refluxo; as atrioventriculares dependem das cordas tendíneas e dos músculos papilares para não everter.',
    clinica:
      'Estenose e insuficiência produzem sopros com tempo, foco e irradiação característicos. Cada valva tem seu foco de ausculta, que não coincide exatamente com sua posição anatômica.',
    pontos: [
      'Câmaras ou vasos que separa',
      'Foco de ausculta e momento do sopro',
      'Repercussão da estenose e da insuficiência',
    ],
    mostraVasos: true,
    mostraNervos: false,
  },
  'via-aerea': {
    id: 'via-aerea',
    rotulo: 'Via aérea',
    resumo: 'Segmento do trato respiratório destinado à condução, ao condicionamento ou à troca de ar.',
    localizacao:
      'Integra a sequência contínua que vai das narinas aos alvéolos, com relações fixas com o esôfago, os grandes vasos e o mediastino no seu trajeto.',
    funcao:
      'Conduz, aquece, umidifica e filtra o ar, protege a via aérea inferior por reflexos e — nos segmentos distais — realiza a hematose.',
    clinica:
      'Os pontos naturalmente mais estreitos são os de obstrução e de impactação de corpo estranho, e são também os que definem o calibre máximo dos dispositivos de via aérea.',
    pontos: [
      'Nível vertebral ou anatômico correspondente',
      'Estruturas vizinhas de risco',
      'Ponto de estreitamento clinicamente relevante',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
  viscera: {
    id: 'viscera',
    rotulo: 'Víscera',
    resumo: 'Órgão de uma cavidade corporal, com relações peritoneais ou de compartimento que definem seu comportamento clínico.',
    localizacao:
      'Ocupa posição própria na cavidade demonstrada, com faces e margens em contato com vísceras vizinhas — as impressões visíveis na peça são o registro desses contatos.',
    funcao:
      'Executa a função específica do sistema a que pertence, integrada por controle autônomo e humoral aos órgãos vizinhos.',
    clinica:
      'A dor visceral é mal localizada e referida ao segmento medular de origem embriológica; quando o processo alcança o peritônio parietal, a dor se torna localizada e a defesa aparece. Essa transição é um dos raciocínios mais úteis da clínica.',
    pontos: [
      'Quadrante e relações de vizinhança',
      'Irrigação e drenagem (inclusive linfática)',
      'Padrão de dor referida',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
  glandula: {
    id: 'glandula',
    rotulo: 'Glândula',
    resumo: 'Órgão secretor, exócrino (com ducto) ou endócrino (lançando seu produto no sangue).',
    localizacao:
      'Ocupa posição constante na região, com o trajeto do seu ducto — quando existe — sendo tão importante quanto o corpo glandular.',
    funcao:
      'Produz e libera secreção sob controle autônomo ou hormonal, participando da digestão, da regulação metabólica, da reprodução ou da proteção de superfícies.',
    clinica:
      'Obstrução do ducto causa retenção, dor e infecção; hiperfunção e hipofunção produzem síndromes endócrinas específicas. A relação com nervos vizinhos define o risco cirúrgico.',
    pontos: [
      'Tipo de secreção e via de saída',
      'Controle nervoso ou hormonal',
      'Estrutura vizinha de risco na cirurgia',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
  linfatico: {
    id: 'linfatico',
    rotulo: 'Estrutura linfática',
    resumo: 'Componente do sistema linfático — linfonodo, vaso ou órgão linfoide — no caminho da linfa do território de drenagem.',
    localizacao:
      'Situa-se ao longo dos vasos da região, agrupado em cadeias que seguem os pedículos vasculares até os troncos linfáticos e o ducto torácico.',
    funcao:
      'Filtra a linfa, apresenta antígenos e monta a resposta imune adaptativa, além de devolver à circulação o líquido intersticial e as gorduras absorvidas no intestino.',
    clinica:
      'A cadeia acometida denuncia o território de origem: é assim que se estadia um câncer e se rastreia uma infecção. Linfadenomegalia dolorosa sugere processo inflamatório; endurecida e aderida, neoplasia.',
    pontos: [
      'Território que drena',
      'Cadeia seguinte no trajeto',
      'Significado do acometimento no estadiamento',
    ],
    mostraVasos: false,
    mostraNervos: false,
  },
  serosa: {
    id: 'serosa',
    rotulo: 'Membrana serosa',
    resumo: 'Membrana de dupla lâmina — parietal e visceral — que reveste uma cavidade e o órgão nela contido.',
    localizacao:
      'A lâmina visceral adere ao órgão e a parietal forra a parede, com uma cavidade virtual entre elas contendo apenas uma película de líquido.',
    funcao:
      'Permite o deslizamento sem atrito durante os movimentos do órgão e mantém, pela pressão negativa da cavidade virtual, a aposição entre órgão e parede.',
    clinica:
      'A lâmina parietal é inervada somaticamente e dói de forma localizada; a visceral, não. É essa diferença que explica a mudança de caráter da dor quando um processo alcança a parede — e o acúmulo de líquido, ar ou pus na cavidade virtual é o que define derrame, pneumotórax e empiema.',
    pontos: [
      'Lâmina parietal versus visceral',
      'Recesso onde o líquido se acumula',
      'Diferença de inervação e de dor',
    ],
    mostraVasos: false,
    mostraNervos: true,
  },
  dente: {
    id: 'dente',
    rotulo: 'Dente',
    resumo: 'Órgão dentário implantado no alvéolo, com coroa, colo e raiz, formado por esmalte, dentina, cemento e polpa.',
    localizacao: 'Implantado no processo alveolar da maxila ou da mandíbula, fixado por gonfose através do ligamento periodontal.',
    funcao: 'Corta, rasga ou tritura o alimento conforme o formato da coroa, e participa da fonação e da estética facial.',
    clinica:
      'A polpa concentra vasos e nervos: sua inflamação é a dor de dente clássica. A relação das raízes com o seio maxilar e com o canal mandibular orienta extrações e implantes.',
    pontos: [
      'Tipo e função na arcada',
      'Relação da raiz com estruturas vizinhas',
      'Inervação sensitiva correspondente',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
  estrutura: {
    id: 'estrutura',
    rotulo: 'Estrutura anatômica',
    resumo: 'Estrutura demonstrada nesta prancha, integrada ao conjunto anatômico da região.',
    localizacao:
      'Ocupa a posição indicada pelo marcador, em relação com os ossos, músculos, vasos e nervos que aparecem na mesma peça.',
    funcao:
      'Participa da função do sistema a que pertence, em conjunto com as demais estruturas identificadas na prancha.',
    clinica:
      'Reconhecer sua posição e suas relações é o que permite interpretar exame físico, imagem e acesso cirúrgico na região.',
    pontos: [
      'Relações com as estruturas vizinhas',
      'Função dentro do sistema',
      'Reparo anatômico correspondente',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
  cardiaco: {
    id: 'cardiaco',
    rotulo: 'Estrutura cardíaca',
    resumo: 'Componente do coração ou do pericárdio, no mediastino médio.',
    localizacao:
      'Ocupa posição definida dentro do saco pericárdico, com relações fixas com as câmaras, os septos, as valvas e os grandes vasos que entram e saem do coração.',
    funcao:
      'Participa do ciclo cardíaco — enchimento, contração e ejeção — seja como parede, revestimento, orifício, esqueleto fibroso ou via de condução.',
    clinica:
      'A anatomia cardíaca é lida diariamente por ecocardiograma, eletrocardiograma e tomografia: cada estrutura tem uma janela, um achado e uma repercussão hemodinâmica próprios.',
    pontos: [
      'Camada ou compartimento a que pertence',
      'Território coronariano correspondente',
      'Como aparece no ecocardiograma',
    ],
    mostraVasos: true,
    mostraNervos: true,
  },
}

/**
 * Quando a terminologia não denuncia a classe ("Óstio Ileal", "Pulvinar do
 * Tálamo", "Endocárdio"), o sistema do acervo já diz o suficiente para não cair
 * no texto totalmente genérico.
 */
const FALLBACK_POR_SISTEMA: Record<string, ClasseId> = {
  esqueletico: 'acidente-osseo',
  articular: 'articulacao',
  nervoso: 'snc',
  circulatorio: 'cardiaco',
  respiratorio: 'via-aerea',
  digestorio: 'viscera',
  urinario: 'viscera',
  'genital-masculino': 'viscera',
  'genital-feminino': 'viscera',
}

interface RegraClasse {
  classe: ClasseId
  /** Testado contra o título normalizado (minúsculas, sem acento). */
  padrao: RegExp
}

/** Ordem = prioridade. O primeiro padrão que casar define a classe. */
const REGRAS: RegraClasse[] = [
  { classe: 'diametro-cefalico', padrao: /^diametro\b/ },
  { classe: 'fonticulo', padrao: /^fonticul|^fontanela/ },
  {
    classe: 'ponto-craniometrico',
    padrao: /^(nasio|nasion|inio|inion|basio|basion|pterio|pterion|asterio|asterion|gonio|gonion|bregma|vertex|lambda|glabela|opistocranio|euri[oa]n|zigio)/,
  },
  { classe: 'tendao', padrao: /^tendao|^tendoes|^conexoes intertendineas|^expansao extensora/ },
  {
    classe: 'musculo',
    padrao: /^musculo|^musculos|^ventre |^porcao (longa|curta|clavicular|esternocostal|abdominal)|^cabeca (longa|curta|lateral|medial|obliqua|transversa|superficial|profunda|reta|angular)|^manguito rotador|^musculatura/,
  },
  { classe: 'ligamento', padrao: /^ligamento|^ligamentos|^ligamentum/ },
  { classe: 'fascia', padrao: /^fascia|^aponeurose|^retinaculo|^bainha|^septo intermuscular|^galea|^trato iliotibial|^membrana interossea/ },
  { classe: 'sutura', padrao: /^sutura|^suturas/ },
  { classe: 'articulacao', padrao: /^articulacao|^articulacoes|^sinfise|^sincondrose|^sindesmose|^capsula articular|^gonfose/ },
  {
    classe: 'cartilagem',
    padrao: /^cartilagem|^menisco|^disco (articular|intervertebral)|^discos intervertebrais|^labio (glenoidal|acetabular)|^limbo do acetabulo|^cartilagens/,
  },
  { classe: 'seio-paranasal', padrao: /^seio (frontal|maxilar|esfenoidal|etmoidal)|^seios paranasais|^celulas etmoidais/ },
  { classe: 'seio-venoso', padrao: /^seio (sagital|transverso|reto|sigmoide|cavernoso|occipital|petroso)|^confluencia dos seios|^seio venoso|^seios da dura/ },
  {
    classe: 'arteria',
    padrao: /^arteria|^arterias|^aorta|^arco (aortico|da aorta|palmar|plantar)|^tronco (pulmonar|braquiocefalico|celiaco|tireocervical|costocervical)|^circulo arterial|^poligono de willis|^vasos |^ramo .*(arteria|arterial)/,
  },
  { classe: 'veia', padrao: /^veia|^veias|^plexo (pampiniforme|venoso|venosos)|^cava|^sistema (azigo|porta)/ },
  { classe: 'plexo-nervoso', padrao: /^plexo (braquial|lombar|sacral|cervical|lombossacral|celiaco|cardiaco|pulmonar|mienterico|submucoso|hipogastrico|faringeo)|^plexos nervosos/ },
  { classe: 'ganglio', padrao: /^ganglio|^ganglios/ },
  {
    classe: 'nervo',
    padrao: /^nervo|^nervos|^tronco (superior|medio|inferior) do plexo|^fasciculo (lateral|medial|posterior)|^raiz (ventral|dorsal|anterior|posterior)|^ramo (ventral|dorsal|anterior|posterior|comunicante)|^ramo .*nervo|^cauda equina|^filamento terminal/,
  },
  { classe: 'meninge', padrao: /^dura-?mater|^aracnoide|^pia-?mater|^meninge|^leptomeninge|^tenda do cerebelo|^foice (do cerebro|do cerebelo)|^espaco (subaracnoideo|subdural|epidural|extradural)/ },
  { classe: 'ventriculo', padrao: /^ventriculo (lateral|terceiro|quarto|iii|iv)|^iii ventriculo|^iv ventriculo|^aqueduto|^plexo corioideo|^liquido cerebrospinal|^cisterna|^forame interventricular|^granulacoes/ },
  { classe: 'camara-cardiaca', padrao: /^atrio|^ventriculo (direito|esquerdo)|^auricula|^septo (interatrial|interventricular|atrioventricular)|^coracao|^apice do coracao|^musculos papilares|^cordas tendineas|^trabeculas carneas|^musculo papilar|^trabecula septomarginal/ },
  { classe: 'valva', padrao: /^valva|^valvula|^cuspide|^valvas/ },
  { classe: 'linfatico', padrao: /^linfonodo|^linfonodos|^vaso linfatico|^ducto toracico|^cisterna do quilo|^tonsila|^tonsilas|^baco|^timo|^nodulos linfaticos|^anel linfatico/ },
  { classe: 'serosa', padrao: /^pleura|^peritonio|^pericardio|^mesenterio|^omento|^mesocolon|^tunica vaginal|^ligamento (falciforme|redondo do figado|coronario|triangular)/ },
  { classe: 'dente', padrao: /^dente|^dentes|^incisiv|^canino|^pre-molar|^molar|^arcada dentaria|^esmalte|^dentina|^polpa dentaria/ },
  {
    classe: 'via-aerea',
    padrao: /^traqueia|^bronquio|^bronquios|^bronquiolo|^alveolo|^alveolos|^laringe|^epiglote|^glote|^rima|^cartilagem (tireoidea|cricoidea|aritenoidea)|^prega (vocal|vestibular)|^carina|^narina|^cavidade nasal|^concha nasal|^meato (nasal|medio|inferior|superior)|^coanas|^coanos|^vestibulo nasal|^septo nasal|^faringe|^nasofaringe|^orofaringe|^laringofaringe/,
  },
  {
    classe: 'snc',
    padrao: /^cerebro|^cerebelo|^ponte$|^ponte |^bulbo$|^bulbo |^mesencefalo|^diencefalo|^telencefalo|^talamo|^hipotalamo|^epitalamo|^subtalamo|^medula (espinal|oblonga)|^tronco encefalico|^corpo caloso|^hemisferio|^lobo (frontal|parietal|temporal|occipital)|^giro|^sulco (central|lateral|calcarino|parieto)|^insula|^fornice|^hipocampo|^amigdala|^nucleo|^nucleos|^substancia (branca|cinzenta|negra|gelatinosa)|^capsula interna|^corona radiata|^corpo estriado|^putame|^globo palido|^caudado|^pedunculo|^colicul|^verme|^tonsila cerebelar|^quiasma|^tracto|^trato (optico|corticoespinal|espinotalamico)|^funiculo|^corno (anterior|posterior|lateral) da medula|^cone medular|^intumescencia|^area \d|^cortex/,
  },
  { classe: 'glandula', padrao: /^glandula|^glandulas|^hipofise|^tireoide|^paratireoide|^suprarrenal|^adrenal|^parotida|^submandibular|^sublingual|^pancreas|^prostata|^vesicula seminal|^vesiculas seminais|^pineal|^mama|^papila mamaria|^areola|^lobulos? da (mama|glandula)/ },
  {
    classe: 'viscera',
    padrao: /^pulmao|^pulmoes|^lobo (superior|medio|inferior)|^figado|^vesicula biliar|^estomago|^esofago|^duodeno|^jejuno|^ileo|^intestino|^colon|^ceco|^apendice|^reto|^canal anal|^rim|^rins|^ureter|^bexiga|^uretra|^testiculo|^epididimo|^ducto deferente|^penis|^escroto|^ovario|^tuba uterina|^utero|^colo do utero|^vagina|^vulva|^clitoris|^labio (maior|menor)|^lingua|^palato|^uvula|^tonsila palatina|^pelve renal|^calice|^piramide renal|^cortex renal|^medula renal|^hilo/,
  },
  {
    classe: 'osso-carpal',
    padrao: /^escafoide|^semilunar|^piramidal|^pisiforme|^trapezio|^trapezoide|^capitato|^hamato|^talus|^calcaneo|^navicular|^cuboide|^cuneiforme|^cuneiformes|^ossos do carpo|^ossos do tarso|^carpo$|^tarso$/,
  },
  {
    classe: 'osso',
    padrao: /^osso|^ossos|^mandibula|^maxila|^cranio|^umero|^radio$|^radio |^ulna|^femur|^tibia|^fibula|^patela|^escapula|^clavicula|^esterno|^costela|^costelas|^vertebra|^vertebras|^sacro|^coccix|^ilio|^isquio|^pubis|^metacarpo|^metacarpos|^metatarso|^metatarsos|^falange|^falanges|^atlas$|^axis$|^manubrio|^processo xifoide|^coluna (cervical|toracica|lombar|vertebral)|^calvaria|^diploe/,
  },
]

/**
 * Regras que só valem no esqueleto.
 *
 * "Face", "ápice", "margem", "corpo", "colo", "sulco", "fissura" e "incisura"
 * são descritores morfológicos, não termos ósseos: existem na face do coração,
 * no ápice do pulmão, no corpo da língua e no sulco bulbopontino. Aplicá-las em
 * todo lugar transformava meia víscera em acidente ósseo — e o comentário do
 * quiz saía afirmando barbaridade com toda a confiança.
 */
const REGRAS_OSSEAS: RegraClasse[] = [
  {
    classe: 'passagem-ossea',
    padrao: /^forame|^forames|^canal|^canais|^fissura|^meato|^hiato|^abertura|^orificio|^incisura|^aqueduto do vestibulo|^sulco do nervo|^sulco da arteria|^sulco do seio|^tunel do carpo|^cavidade (nasal|orbital)|^orbita|^coanas/,
  },
  {
    classe: 'acidente-osseo',
    padrao: /^processo|^tuberculo|^tuberosidade|^tuber |^tuber$|^espinha|^crista|^fossa|^fovea|^foveola|^foveolas|^sulco|^linha|^face |^faces |^margem|^borda|^angulo|^colo|^cabeca|^corpo|^base|^apice|^condilo|^condilos|^epicondilo|^maleolo|^trocanter|^troclea|^capitulo|^olecrano|^acromio|^lamina|^pediculo|^arco|^ramo (da mandibula|ascendente)|^protuberancia|^eminencia|^asa |^asas |^dorso da sela|^sela turcica|^clivo|^rebordo|^limbo|^circunferencia articular|^area intercondilar|^promontorio|^corno|^hamulo|^lingula|^mento|^trigono|^sustentaculo|^tuberculos|^espinhas|^cristas|^extremidade|^diafise|^epifise|^metafise|^cavidade glenoidal|^acetabulo|^superficie|^impressao|^porcao (basilar|petrosa|escamosa|timpanica)|^parte (basilar|petrosa|escamosa|timpanica|lateral)|^trabeculas osseas|^bordas?$/,
  },
]

/** Sistemas em que os descritores morfológicos são, de fato, ósseos. */
const SISTEMAS_OSSEOS = new Set(['esqueletico', 'articular'])

/**
 * Acidentes que não são ambíguos em nenhum sistema: não existe "epicôndilo" de
 * víscera nem "trocanter" de nervo. Estes continuam valendo em toda prancha.
 */
const ACIDENTES_INEQUIVOCOS =
  /^epicondilo|^trocanter|^maleolo|^olecrano|^acromio|^condilo|^tuberosidade|^tuber isquiatico|^processo (espinhoso|transverso|articular|coracoide|estiloide|mastoide|xifoide|coronoide|odontoide|alveolar)|^espinha (iliaca|da escapula|isquiatica|nasal)|^crista iliaca|^sinfise|^diafise|^epifise|^metafise/

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export function classificar(titulo: string, sistemaSlug?: string): ClasseEstrutural {
  const nome = normalizar(titulo)

  const regra = REGRAS.find(candidata => candidata.padrao.test(nome))
  if (regra) return CLASSES[regra.classe]

  // Sem sistema informado, o léxico ósseo continua valendo: é o comportamento
  // que faz sentido para quem classifica um termo solto.
  if (!sistemaSlug || SISTEMAS_OSSEOS.has(sistemaSlug) || ACIDENTES_INEQUIVOCOS.test(nome)) {
    const ossea = REGRAS_OSSEAS.find(candidata => candidata.padrao.test(nome))
    if (ossea) return CLASSES[ossea.classe]
  }

  const porSistema = sistemaSlug ? FALLBACK_POR_SISTEMA[sistemaSlug] : undefined
  return CLASSES[porSistema || 'estrutura']
}

export function classePorId(id: ClasseId): ClasseEstrutural {
  return CLASSES[id]
}

export { CLASSES }
