import type { EntradaDicionario } from './tipos'

/**
 * Coluna vertebral e tórax ósseo.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const COLUNA_TORAX: EntradaDicionario[] = [
  {
    termos: ['Corpo Vertebral'],
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
    termos: ['Processo Espinhoso'],
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
    termos: ['Processo Transverso'],
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
    termos: ['Processo Articular Superior', 'Processo Articular Inferior'],
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
    termos: ['Forame Vertebral'],
    resumo: 'Abertura entre o corpo e o arco vertebral; o empilhamento de todos forma o canal vertebral.',
    localizacao: 'Entre a face posterior do corpo, os pedículos e as lâminas. É triangular e amplo nas cervicais e lombares, e circular e estreito nas torácicas.',
    funcao: 'Aloja e protege a medula espinal, suas meninges, o líquido cerebrospinal, o plexo venoso vertebral interno e, abaixo de L2, a cauda equina.',
    clinica:
      'O canal torácico estreito, somado à irrigação medular precária, torna a lesão medular torácica especialmente grave. A estenose de canal lombar produz claudicação neurogênica, que alivia com a flexão do tronco — sinal do carrinho de supermercado.',
    pontos: ['Estreito na coluna torácica, amplo nas cervicais e lombares', 'Contém medula, meninges e plexo venoso', 'Estenose lombar dá claudicação neurogênica'],
  },
  {
    termos: ['Disco Intervertebral', 'Discos Intervertebrais'],
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
    termos: ['Forame Transverso'],
    resumo: 'Abertura no processo transverso das vértebras cervicais.',
    localizacao: 'Presente em todas as sete cervicais, de C1 a C7.',
    funcao: 'Dá passagem à artéria vertebral (que entra em C6 e sobe até C1), à veia vertebral e a fibras simpáticas.',
    clinica: 'A artéria vertebral não passa pelo forame de C7 na maioria das pessoas. Fratura cervical que envolve o forame transverso obriga a investigar dissecção da artéria vertebral com angiotomografia.',
    pontos: ['Exclusivo das vértebras cervicais', 'Artéria vertebral entra em C6', 'Fratura obriga investigar dissecção vertebral'],
  },
  {
    termos: ['Promontório'],
    resumo: 'Borda anterior saliente do corpo da primeira vértebra sacral.',
    localizacao: 'Na transição lombossacral, projetando-se para dentro da entrada da pelve.',
    funcao: 'Define o limite posterior do estreito superior da pelve.',
    clinica:
      'É o ponto de referência do conjugado diagonal na pelvimetria clínica — a distância entre o promontório e a borda inferior da sínfise púbica, da qual se estima o conjugado obstétrico. Também é reparo de acesso na cirurgia pélvica e na sacrocolpopexia.',
    pontos: ['Limite posterior do estreito superior da pelve', 'Conjugado diagonal na pelvimetria', 'Reparo cirúrgico pélvico'],
  },
  {
    termos: ['Hiato Sacral'],
    resumo: 'Abertura na extremidade inferior do canal sacral, resultante da ausência das lâminas de S5.',
    localizacao: 'Na face posterior do sacro, entre os cornos sacrais, acima da articulação sacrococcígea.',
    funcao: 'Marca o fim do canal sacral, fechado pelo ligamento sacrococcígeo posterior.',
    clinica: 'É a via de acesso da anestesia peridural caudal, muito usada em pediatria e em procedimentos perineais; os cornos sacrais são os reparos palpáveis para a punção.',
    pontos: ['Ausência das lâminas de S5', 'Via da peridural caudal', 'Cornos sacrais como reparo'],
  },
  {
    termos: ['Sacro'],
    resumo: 'Osso triangular formado pela fusão das cinco vértebras sacrais, encaixado entre os ossos do quadril.',
    localizacao: 'Na parte posterior da pelve, articulando-se acima com L5, lateralmente com os ílios (articulações sacroilíacas) e abaixo com o cóccix.',
    funcao: 'Transmite o peso do tronco para o cíngulo do membro inferior e forma a parede posterior da pelve.',
    vascularizacao: 'Artérias sacrais mediana e laterais.',
    inervacao: 'Raízes sacrais emergem pelos forames sacrais anteriores e posteriores, formando o plexo sacral.',
    clinica:
      'As fraturas do sacro classificam-se pelas zonas de Denis conforme a relação com os forames, e as zonas mediais têm maior risco neurológico. A articulação sacroilíaca é causa frequente e subdiagnosticada de dor lombar baixa.',
    pontos: ['Cinco vértebras fundidas', 'Forames sacrais dão passagem às raízes', 'Zonas de Denis nas fraturas'],
  },
  {
    termos: ['Manúbrio'],
    resumo: 'A porção superior do esterno, articulada com a clavícula e com a primeira costela.',
    localizacao: 'Acima do corpo do esterno, com a incisura jugular no alto e as incisuras claviculares nas laterais.',
    funcao: 'Ancora o cíngulo do membro superior ao esqueleto axial pela articulação esternoclavicular e protege os grandes vasos da base do pescoço.',
    vascularizacao:
      'Ramos da artéria torácica interna e do tronco costocervical, com rica medula óssea hematopoiética mantida por toda a vida — a razão de o manúbrio ser sítio alternativo de punção intraóssea no adulto.',
    relacoes: 'Atrás dele passam o arco da aorta e seus ramos, a veia braquiocefálica esquerda e o timo (no jovem).',
    clinica:
      'A incisura jugular é reparo palpável da traqueia. O ângulo do esterno, na junção manúbrio-corpo, marca a 2ª costela e o plano transverso do tórax — nível da bifurcação da traqueia e do início e fim do arco aórtico.',
    pontos: ['Incisura jugular e incisuras claviculares', 'Ângulo do esterno marca a 2ª costela e T4–T5', 'Grandes vasos por trás'],
  },
  {
    termos: ['Processo Xifoide'],
    resumo: 'A extremidade inferior e cartilaginosa do esterno, que ossifica com a idade.',
    localizacao: 'Abaixo do corpo do esterno, na junção com as cartilagens costais inferiores.',
    funcao: 'Ponto de inserção do diafragma, do reto do abdome e da linha alba.',
    vascularizacao:
      'Ramos da artéria torácica interna e da musculofrênica, com irrigação escassa — cartilagem no jovem, osso no adulto, e sempre pouco vascularizado. É por isso que a fratura do xifoide na reanimação consolida mal e dói por meses.',
    clinica:
      'É o reparo para posicionar as mãos na compressão torácica: dois dedos acima dele, para não fraturá-lo e lacerar o fígado. Também marca o ápice do ângulo infraesternal e o ponto de punção pericárdica subxifóidea.',
    pontos: ['Inserção do diafragma e do reto do abdome', 'Referência da RCP e da pericardiocentese', 'Ossifica com a idade'],
  },
  {
    termos: ['Cabeça da Costela', 'Colo da Costela', 'Tubérculo da Costela', 'Sulco da Costela'],
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
    termos: ['Costelas'],
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
  {
    termos: ['Lábio Glenoidal'],
    resumo: 'Anel fibrocartilaginoso que circunda e aprofunda a cavidade glenoidal.',
    localizacao: 'Na margem da glenoide, contínuo acima com o tendão da cabeça longa do bíceps braquial.',
    funcao: 'Aumenta a área e a profundidade da glenoide em cerca de 50%, criando um efeito de sucção que ajuda a conter a cabeça umeral.',
    clinica:
      'A lesão de Bankart é a avulsão do lábio anteroinferior na luxação anterior, e é o principal fator de recidiva. A lesão SLAP acomete o lábio superior na inserção do bíceps, típica de atletas de arremesso.',
    pontos: ['Aprofunda a glenoide e cria efeito de sucção', 'Lesão de Bankart na luxação anterior', 'Lesão SLAP em atletas de arremesso'],
  },
  {
    termos: ['Ligamento Colateral Medial', 'Ligamento Colateral Tibial'],
    resumo: 'Ligamento largo na face medial do joelho, aderido ao menisco medial.',
    localizacao: 'Do epicôndilo medial do fêmur à face medial da tíbia, com fibras profundas fixadas ao menisco medial.',
    funcao: 'Resiste ao estresse em valgo e à rotação externa da tíbia.',
    clinica:
      'É o ligamento mais lesado do joelho, por trauma em valgo. Sua aderência ao menisco medial é a razão anatômica de os dois se lesarem juntos na tríade infeliz. A maioria das lesões isoladas trata-se sem cirurgia.',
    pontos: ['Resiste ao valgo', 'Aderido ao menisco medial', 'Ligamento mais lesado do joelho'],
  },
  {
    termos: ['Membrana Interóssea'],
    resumo: 'Lâmina fibrosa que une as diáfises de dois ossos paralelos, dividindo compartimentos.',
    localizacao: 'Entre rádio e ulna no antebraço, e entre tíbia e fíbula na perna, com fibras predominantemente oblíquas.',
    funcao:
      'Transfere carga entre os dois ossos — no antebraço, do rádio para a ulna, protegendo o punho —, aumenta a área de inserção muscular e separa os compartimentos anterior e posterior.',
    clinica:
      'A lesão de Essex-Lopresti combina fratura da cabeça do rádio com ruptura da membrana interóssea e da articulação radioulnar distal, levando à migração proximal do rádio. Na perna, é o plano das fasciotomias de quatro compartimentos.',
    pontos: ['Transfere carga entre os dois ossos', 'Separa compartimentos anterior e posterior', 'Lesão de Essex-Lopresti no antebraço'],
  },
  {
    termos: ['Ligamento Inguinal'],
    resumo: 'Borda inferior espessada da aponeurose do oblíquo externo, entre a espinha ilíaca anterossuperior e o tubérculo púbico.',
    localizacao: 'Na transição entre a parede abdominal e a coxa, formando o teto do canal inguinal e o limite superior do trígono femoral.',
    funcao: 'Sustenta o assoalho da parede abdominal anterior e divide o espaço entre a pelve e a coxa em lacunas muscular e vascular.',
    relacoes: 'Sob ele passam, de lateral para medial: nervo femoral, artéria femoral, veia femoral e o canal femoral com o linfonodo de Cloquet.',
    clinica:
      'É o divisor de águas das hérnias: a inguinal emerge acima e medialmente ao tubérculo púbico, a femoral abaixo e lateralmente. A hérnia femoral encarcera com muito mais frequência, pelo anel femoral rígido.',
    pontos: ['Espinha ilíaca anterossuperior → tubérculo púbico', 'Sob ele: NAVL de lateral para medial', 'Divide hérnia inguinal de femoral'],
  },
  {
    termos: ['Lâmina do Arco Vertebral', 'Pedículo do Arco Vertebral'],
    resumo: 'Componentes do arco vertebral: os pedículos ligam o corpo ao arco e as lâminas se fundem atrás, fechando o canal.',
    localizacao: 'Os pedículos saem da face posterolateral do corpo e suas incisuras formam o forame intervertebral; as lâminas seguem deles até o processo espinhoso.',
    funcao: 'Fecham o forame vertebral, protegendo a medula, e transmitem carga do arco posterior para o corpo.',
    clinica:
      'A lâmina é o osso removido na laminectomia, a descompressão clássica da estenose de canal. O pedículo é a via de entrada do parafuso pedicular na artrodese e, na radiografia, o "pedículo ausente" é sinal clássico de metástase vertebral. A falha de fusão das lâminas produz a espinha bífida.',
    pontos: [
      'Pedículos delimitam o forame intervertebral',
      'Laminectomia e parafuso pedicular',
      'Pedículo ausente na radiografia = metástase',
    ],
  },
  {
    termos: ['Sutura Sagital', 'Sutura Coronal', 'Sutura Lambdóidea', 'Sutura Escamosa'],
    classe: 'sutura',
    resumo: 'Articulações fibrosas da calvária, cada uma unindo um par definido de ossos.',
    localizacao:
      'A sagital corre na linha média entre os parietais; a coronal separa o frontal dos parietais; a lambdóidea separa os parietais do occipital; a escamosa contorna a escama do temporal.',
    funcao: 'Permitem o crescimento do crânio perpendicular à sua linha durante a infância e travam no adulto.',
    clinica:
      'O fechamento precoce deforma o crânio de modo previsível: sinostose sagital dá escafocefalia (crânio longo e estreito), coronal bilateral dá braquicefalia, e a lambdóidea, plagiocefalia posterior. Nas radiografias, a sutura é o principal diagnóstico diferencial de traço de fratura — a sutura é serrilhada e bilateral; a fratura, retilínea e mais radiotransparente.',
    pontos: [
      'Sagital = escafocefalia quando fecha cedo',
      'Sutura serrilhada x fratura retilínea',
      'Crescimento perpendicular à linha da sutura',
    ],
  },
  {
    termos: [
      'Canal Vertebral',
    ],
    classe: 'passagem-ossea',
    resumo:
      'O tubo formado pela soma de todos os forames vertebrais empilhados — o continente da medula, não um forame isolado.',
    localizacao:
      'Do forame magno ao hiato sacral, formado pela sobreposição dos forames vertebrais unidos pelos discos, pelos ligamentos amarelos e pelo ligamento longitudinal posterior.',
    funcao:
      'Aloja a medula espinal, as meninges, o líquido cerebrospinal, as raízes e o plexo venoso vertebral interno. Muda de forma ao longo do trajeto: triangular e amplo na cervical e na lombar, onde há intumescências, e circular e estreito na torácica.',
    vascularizacao:
      'Ramos espinais das artérias segmentares entram por cada forame intervertebral; o plexo venoso vertebral interno de Batson, sem válvulas, forra suas paredes em toda a extensão.',
    inervacao:
      'Nervo sinuvertebral de Luschka, ramo recorrente de cada nervo espinal, que reentra pelo forame e inerva o ligamento longitudinal posterior, a dura-máter e o anel fibroso — a via da dor discogênica.',
    linfaticos:
      'Ausentes no espaço subaracnóideo; a drenagem do líquido cerebrospinal faz-se por vias linfáticas perineurais ao longo das raízes.',
    relacoes:
      'O diâmetro anteroposterior normal do canal lombar é de 15 a 25 mm; abaixo de 10 mm é estenose absoluta. O forame VERTEBRAL é o buraco de uma vértebra; o canal é o tubo que todos eles formam juntos.',
    clinica:
      'Pensar em canal, e não em forame, é o que torna a estenose de canal lombar inteligível: nenhuma vértebra isolada está doente — o estreitamento é a soma de hipertrofia facetária, abaulamento discal e espessamento do ligamento amarelo em vários níveis. Daí a claudicação neurogênica, com dor que aparece ao andar e alivia ao sentar ou inclinar-se para a frente, porque a flexão AUMENTA o diâmetro do canal. É o sinal do carrinho de supermercado — o paciente anda longe empurrando o carrinho e não anda um quarteirão ereto.',
    memoria:
      'Forame é um buraco; canal é o corredor inteiro. Quem se curva alarga o corredor — por isso o paciente empurra o carrinho e anda.',
    pontos: [
      'Qual a diferença entre forame vertebral e canal vertebral?',
      'Que nervo inerva as estruturas do canal?',
      'Por que a flexão alivia a claudicação neurogênica?',
    ],
  },
]
