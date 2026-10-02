import type { ExplicacoesExtras } from './casos-imagem'

const x = (explicacao: string, dica?: string) => ({ explicacao, dica })

/**
 * Comentário aprofundado das setas da primeira leva — abdome e trauma.
 * Chave: slug do caso → rótulo original do autor.
 */
export const EXPLICACOES_TC_2: ExplicacoesExtras = {
  'apendicite-complicada': {
    gallstone: x(
      'Cálculo dentro da vesícula, achado incidental. Ele lembra que a TC mostra tudo o que está no campo, e que o laudo deve separar o que explica o quadro do que é achado de passagem — e informar ambos.',
    ),
    'Several regional lymph nodes': x(
      'Linfonodos ileocólicos aumentados acompanham a inflamação do apêndice. São reativos. Isolados, sem apêndice doente, levantam adenite mesentérica, mais comum em crianças com quadro viral.',
    ),
    'focal discontinuity of the enh': x(
      'A parede do apêndice viável realça com contraste. Um trecho que deixa de realçar é parede necrosada — o ponto onde a perfuração aconteceu ou está para acontecer. É um dos critérios de apendicite complicada, junto com gás extraluminal, abscesso e apendicolito fora da luz.',
    ),
    gas: x(
      'Gás fora da luz do apêndice, nas gorduras vizinhas, indica perfuração. Na janela de pulmão aplicada ao abdome, bolhas pequenas ficam mais fáceis de ver.',
      'Procure gás junto ao ceco e na pelve; pequenas bolhas extraluminais mudam a conduta de antibiótico isolado para cirurgia.',
    ),
  },
  'diverticulite-de-sigmoide': {
    'Fatty liver': x(
      'Fígado gorduroso fica mais escuro que o baço na TC sem contraste, porque gordura tem densidade negativa. Diferença de mais de 10 UH a favor do baço sugere esteatose. É achado incidental neste caso.',
    ),
    'Cholecystectomy clips': x(
      'Clipes metálicos no leito da vesícula indicam colecistectomia prévia. O metal gera artefato em estrias; reconhecê-lo evita confundir com cálculo ou corpo estranho.',
    ),
    'colonic diverticulosis': x(
      'Divertículos são saculações da mucosa através de pontos fracos da parede do cólon, onde os vasos atravessam a musculatura. Cheios de ar, aparecem como pequenas bolhas pretas fora do contorno do cólon, sem inflamação ao redor.',
    ),
    'inflammed diverticulum': x(
      'O divertículo inflamado tem parede espessa e a gordura em volta fica borrada e mais densa — a densificação. É o foco da diverticulite: um divertículo obstruído que sofreu microperfuração. Procure gás livre, coleção e fístula para classificar como complicada.',
      'Espessamento longo, assimétrico, com linfonodos e sem divertículos lembra câncer; colonoscopia depois da crise.',
    ),
  },
  'colecistite-gangrenosa': {
    'irregularly thickened wall': x(
      'A parede da vesícula inflamada fica espessa; quando a pressão dentro dela comprime os vasos da parede, áreas morrem e deixam de realçar. Parede irregular, com falhas de realce e membranas soltas na luz, é a marca da gangrena.',
    ),
    'gallbladder distension': x(
      'O ducto cístico obstruído impede a saída da bile, e a vesícula distende. Quanto maior a distensão e a pressão, maior o risco de isquemia da parede e de gangrena.',
    ),
    'pericholecystic fat stranding': x(
      'A gordura em volta da vesícula inflamada fica densa e estriada, por edema e inflamação. Extensão até o duodeno e o cólon mostra a gravidade. Coleção pericolecística indica perfuração bloqueada.',
    ),
  },
  'apendagite-epiploica': {
    'hyperattenuating ring': x(
      'Os apêndices epiploicos são pingentes de gordura pendurados no cólon. Quando torcem ou trombosam, ficam inflamados e o peritônio visceral que os envolve forma um halo fino e mais denso em volta de um centro de gordura. Às vezes há um ponto central mais denso: a veia trombosada.',
    ),
    'fat stranding': x(
      'A gordura ao redor do apêndice epiploico inflamado fica densificada, e o peritônio adjacente pode espessar. O cólon, porém, está normal — diferença essencial para a diverticulite.',
    ),
  },
  'ileo-biliar': {
    'Gas and edema': x(
      'Ar dentro da vesícula e da via biliar não deveria existir sem cirurgia ou papilotomia. Aqui ele entrou pela fístula entre vesícula e duodeno. A parede edemaciada lembra a colecistite que originou a fístula.',
    ),
    'cholecystoduodenal fistula': x(
      'A inflamação crônica aderiu a vesícula ao duodeno e erodiu as duas paredes, criando um trajeto. Por ele o cálculo passou para o intestino. Ver o trajeto, ou o ar entrando na vesícula, completa a tríade de Rigler.',
    ),
    'collapsed distal small bowel.': x(
      'Depois do obstáculo, o delgado fica colabado, sem conteúdo. O contraste entre alças dilatadas antes e vazias depois define o ponto de transição — é ali que se procura a causa.',
    ),
    'dilated fluid filled proximal': x(
      'Acima do cálculo, as alças acumulam líquido e gás e dilatam além de 2,5 a 3 cm. A distensão empurra o intestino e explica a cólica e os vômitos.',
    ),
    gallstone: x(
      'O cálculo grande ficou preso na parte mais estreita do delgado, o íleo. Pode ter borda calcificada e centro de gordura ou gás. Cálculos de colesterol puro podem ser isodensos à bile e passar despercebidos.',
      'Procure um segundo cálculo: se ficar para trás, pode causar nova obstrução depois da cirurgia.',
    ),
  },
  'perfuracao-intestinal': {
    'pelvic abscess': x(
      'O fundo de saco é o ponto mais baixo da cavidade peritoneal com o paciente deitado, e é para lá que o pus escorre. Coleção com parede que realça e conteúdo líquido indica abscesso drenável.',
    ),
    'Focal mural thickening': x(
      'Espessamento focal da parede do cólon junto à perfuração pode ser inflamação ou tumor. No idoso, perfuração colônica com espessamento assimétrico pede investigação de câncer.',
    ),
    'intra-abdominal collection': x(
      'Coleção multiloculada com bolhas de gás e conteúdo de densidade heterogênea indica contaminação fecal. Gás dentro de coleção sem procedimento prévio é sinal de infecção ou de comunicação com a luz intestinal.',
    ),
    'focal wall defect': x(
      'A falha na parede do cólon é o ponto exato da perfuração. Nem sempre é visível; muitas vezes se infere pela concentração de gás e líquido extraluminal em uma região.',
    ),
  },
  'volvo-de-sigmoide': {
    'sigmoid colonic dilatation': x(
      'O sigmoide torcido forma uma alça fechada que acumula gás e dilata muito, subindo até o quadrante superior esquerdo. A parede fica fina; alça muito dilatada com parede sem realce indica isquemia.',
    ),
    'transition points': x(
      'Na alça fechada há dois pontos de transição próximos, um na entrada e outro na saída da torção. Encontrar os dois juntos é o que diferencia volvo de uma obstrução simples.',
    ),
    'whirl sign': x(
      'O mesentério e seus vasos enrolados em espiral em torno do eixo da torção formam o sinal do redemoinho. É o achado mais específico de volvo na TC.',
      'Quanto mais voltas no redemoinho, maior o risco de isquemia.',
    ),
  },
  'isquemia-mesenterica-gas-portal': {
    'portal venous gas': x(
      'Quando a mucosa intestinal necrosa, o gás da luz entra na parede e nas veias mesentéricas e é levado pelo fluxo portal até o fígado. Ali forma ramificações escuras que chegam à periferia, a menos de 2 cm da cápsula. Em adulto com dor abdominal, indica necrose intestinal até prova contrária.',
      'Pneumobilia fica central, perto do hilo, porque a bile corre para o centro; gás portal vai para a periferia, porque o sangue portal corre para fora.',
    ),
    'hyperdense material': x(
      'Conteúdo denso nas alças pode ser contraste oral ou sangue na luz de um intestino isquêmico. A mucosa necrosada sangra e o paciente pode ter fezes com sangue escuro.',
    ),
  },
  'aneurisma-de-aorta-abdominal-roto': {
    'intramural thrombus': x(
      'O trombo mural forra a parede do aneurisma. Na fase sem contraste, um crescente mais denso dentro dele indica sangue recente na parede — ruptura iminente ou contida. O tamanho total do aneurisma, não o da luz, é que define o risco.',
    ),
    'Retroperitoneal hematoma': x(
      'O sangue que escapa da aorta rota se espalha pelo retroperitônio, em volta da aorta e no espaço pararrenal, apagando os planos de gordura. Na fase arterial, contraste extravasando indica sangramento ativo.',
      'Paciente instável com aneurisma conhecido e dor lombar vai direto ao centro cirúrgico; a TC é para quem está estável.',
    ),
  },
  'carcinoma-hepatocelular': {
    'pericardial effusion': x(
      'Pequeno derrame pericárdico é achado associado. Em paciente com doença hepática avançada, derrames serosos são comuns pela hipoalbuminemia.',
    ),
    'heterogeneous mass': x(
      'O carcinoma hepatocelular recebe sangue quase só da artéria hepática; por isso realça intensamente na fase arterial e perde contraste na fase portal — a lavagem. Massas grandes ficam heterogêneas por necrose, hemorragia e gordura.',
      'Em fígado de risco, realce arterial com lavagem permite o diagnóstico sem biópsia pelo LI-RADS.',
    ),
    'Tumor thrombus': x(
      'Trombo tumoral expande a veia porta e realça na fase arterial, porque contém tumor vivo com vasos. Trombo brando, de sangue coagulado, não realça. A invasão portal coloca o tumor em estádio avançado.',
    ),
  },
  'hemangioma-hepatico': {
    'peripheral nodularity.': x(
      'O hemangioma é feito de espaços vasculares lentos. Na fase arterial, o contraste entra pela periferia em glóbulos descontínuos com a mesma densidade do sangue da aorta; nas fases seguintes, os glóbulos avançam para o centro até preencher a lesão. É esse realce periférico, nodular e centrípeto que permite o diagnóstico sem biópsia.',
      'Realce em anel contínuo e lavagem tardia não são de hemangioma: pensar em metástase.',
    ),
  },
  'cirrose-hipertensao-portal': {
    'esophageal varices': x(
      'Com a pressão portal alta, o sangue busca saídas pela veia gástrica esquerda até as veias do esôfago, que dilatam e ficam tortuosas na parede do esôfago distal. Na TC com contraste, aparecem como estruturas realçadas em torno do esôfago. São elas que sangram.',
    ),
    'IVC compression': x(
      'O lobo caudado hipertrofia na cirrose porque tem drenagem venosa própria, direto para a cava, e é poupado da fibrose. Grande, ele comprime a veia cava inferior, que fica achatada.',
    ),
    'portal hypertension': x(
      'Vasos tortuosos e dilatados no abdome — esplenorrenais, paraumbilicais, gástricos — são colaterais portossistêmicas. Mostram que a pressão no sistema porta subiu e o sangue está voltando ao coração por caminhos alternativos.',
    ),
    diverticuli: x(
      'Divertículos colônicos incidentais. Reconhecer e mencionar achados não relacionados faz parte do laudo completo, sem confundi-los com a doença principal.',
    ),
  },
  'abscessos-hepaticos': {
    collections: x(
      'Abscessos piogênicos formam coleções múltiplas, agrupadas, com septos internos e parede espessa que realça. Pequenas coleções tendem a se juntar em uma maior — o sinal do agrupamento.',
      'Abscesso amebiano costuma ser único, periférico e no lobo direito, em paciente com exposição a saneamento precário.',
    ),
    edema: x(
      'Em volta das coleções, o parênquima inflamado realça menos e fica mais escuro. Esse halo, somado à parede que realça, forma o sinal do duplo alvo.',
    ),
  },
  'pancreatite-aguda-edematosa': {
    'Enlarged pancreas': x(
      'O pâncreas inflamado aumenta de volume e perde o contorno lobulado normal. Na forma edematosa, realça por inteiro e de modo homogêneo — a ausência de áreas sem realce é o que exclui necrose.',
    ),
    'swelling of the pancreas': x(
      'O edema do parênquima apaga os lóbulos e borra a interface com a gordura. A TC precoce, nas primeiras 72 horas, pode subestimar a necrose, que se define melhor depois.',
    ),
    'peripancreatic edema': x(
      'A gordura em volta do pâncreas fica densificada pela inflamação e pelas enzimas extravasadas. É o achado mais constante da pancreatite aguda na TC.',
    ),
    'peri-pancreatic fluid': x(
      'Coleção líquida aguda sem parede, nas primeiras quatro semanas, é exsudato inflamatório. A maioria reabsorve; as que persistem e formam parede viram pseudocisto.',
    ),
    'right paracolic gutter': x(
      'O líquido inflamatório desce pelo espaço pararrenal anterior até a goteira parietocólica. Seguir o trajeto do líquido mostra a extensão da inflamação retroperitoneal.',
    ),
  },
  'calculo-ureteral-distal': {
    hydroureter: x(
      'O ureter acima do cálculo dilata porque a urina continua descendo e não passa. Seguir o ureter dilatado de cima para baixo leva direto ao cálculo, mesmo quando ele é pequeno.',
    ),
    'perinephric fat stranding': x(
      'A obstrução aguda aumenta a pressão no sistema coletor e pode romper fórnices, extravasando urina e causando densificação da gordura perirrenal. Indica obstrução recente.',
    ),
    'ureteric calculus': x(
      'Quase todos os cálculos urinários são densos na TC sem contraste, até os de ácido úrico, que não aparecem na radiografia. O cálculo dentro do ureter é cercado por um anel de partes moles — a parede ureteral edemaciada —, o sinal do anel que o separa de um flebólito.',
      'Flebólitos são calcificações venosas da pelve com centro mais claro e uma cauda de partes moles: o sinal da cauda de cometa.',
    ),
  },
  'pielonefrite-enfisematosa': {
    'bilateral pleural effusions': x(
      'Derrames pleurais acompanham a sepse e a inflamação subdiafragmática. São reacionais e reforçam a gravidade do quadro.',
    ),
    abscesses: x(
      'Coleções com parede que realça dentro do rim mostram que a infecção destruiu parênquima e formou pus. Abscessos grandes pedem drenagem.',
    ),
    'Large air containing collectio': x(
      'Gás no parênquima renal é produzido por bactérias que fermentam a glicose, em diabéticos descompensados. Na TC, aparece como áreas pretas dentro do rim que substituem o parênquima. É uma infecção necrosante e grave.',
      'Gás restrito ao sistema coletor é pielite enfisematosa, de prognóstico melhor.',
    ),
    sludge: x(
      'Material denso na vesícula é barro biliar, comum em pacientes graves e em jejum. Achado associado.',
    ),
    'air-containing collection': x(
      'O gás ultrapassou a cápsula renal e ocupa o espaço perirrenal: a infecção se estendeu para fora do rim, o que piora o prognóstico e pode exigir nefrectomia.',
    ),
    'fistulous communication': x(
      'Um trajeto liga a coleção renal ao cólon descendente. Fístulas assim podem surgir da infecção renal que erode o intestino, ou o contrário.',
    ),
    'colon defect': x(
      'Irregularidade focal da parede do cólon no ponto da fístula. É ali que o contraste oral passa para fora da luz.',
    ),
    'contrast material': x(
      'Contraste oral fora do intestino, dentro da coleção, prova a comunicação. É a demonstração mais objetiva de uma fístula na TC.',
    ),
  },
  'pielonefrite-aguda': {
    'UB mild mural thickening': x(
      'A bexiga com parede espessada indica cistite, de onde a infecção subiu. A infecção urinária alta quase sempre começa embaixo.',
    ),
    'enhancing ureteric wall': x(
      'A parede do ureter inflamado fica espessa e realça com contraste, mostrando o trajeto ascendente da infecção.',
    ),
    'renal pelves enhancing walls': x(
      'O urotélio da pelve renal espessado e realçado indica pielite. Junto com as cunhas de menor realce no parênquima, compõe a pielonefrite aguda na TC.',
    ),
  },
  'carcinoma-de-celulas-renais': {
    'claw sign': x(
      'Quando uma massa nasce do rim, o parênquima renal se estende ao redor dela como uma garra. Esse sinal prova a origem renal de massas exofíticas, que poderiam ser confundidas com lesões do fígado, da adrenal ou do retroperitônio.',
    ),
    encapsulated: x(
      'O carcinoma de células renais costuma ter pseudocápsula: borda nítida formada por parênquima comprimido e fibrose. Ajuda a definir margens para cirurgia preservadora.',
    ),
    necrosis: x(
      'Áreas centrais sem realce são necrose, comuns em tumores maiores. O carcinoma de células claras realça intensamente na fase corticomedular, com o centro necrótico escuro.',
      'Massa sólida renal sem gordura macroscópica é carcinoma até prova contrária; gordura com densidade negativa sugere angiomiolipoma.',
    ),
  },
  'cancer-colorretal-invasivo': {
    'eccentric thrombus': x(
      'Trombo parcial em uma veia próxima ao tumor. Câncer aumenta o risco de trombose venosa, e a invasão local também pode comprimir veias.',
    ),
    'colon wall thickening': x(
      'A parede do cólon normal tem até 3 mm. Aqui está espessa, nodular e circunferencial, com perda da estratificação das camadas. Espessamento assimétrico e em ombro, com linfonodos, sugere tumor; espessamento longo e simétrico sugere inflamação.',
    ),
    'dermal involvement': x(
      'O tumor atravessou toda a parede abdominal e chegou à pele. Invasão de estruturas vizinhas classifica o tumor como T4b e exige ressecção em bloco.',
    ),
  },
  'intussuscepcao-colocolica': {
    'lymph nodes': x(
      'Linfonodos pericólicos pequenos podem ser reativos ou metastáticos. Na intussuscepção do adulto com lesão de base, entram no estadiamento.',
    ),
    'colonic lesion': x(
      'A lesão dentro da luz funciona como cabeça da invaginação: o peristaltismo a empurra e arrasta a parede junto. Na imagem, forma o alvo — camadas de parede e gordura mesentérica dentro de outra alça. No adulto, a cabeça é tumor na maioria dos casos colônicos.',
    ),
    'skin lesion': x(
      'Lesão cutânea sem relação com o quadro. Achados incidentais na parede e na pele também fazem parte da leitura sistemática.',
    ),
  },
  'trauma-hepatico-grau-v': {
    'active arterial extravasation': x(
      'Contraste fora dos vasos, com densidade igual à da aorta na fase arterial e que aumenta e muda de forma na fase portal, é sangramento ativo. Indica embolização ou cirurgia, conforme a hemodinâmica.',
      'Pseudoaneurisma também é denso na fase arterial, mas mantém a forma e acompanha a densidade dos vasos nas fases seguintes.',
    ),
    'right hepatic artery.': x(
      'Identificar de qual artéria parte o sangramento guia o radiologista intervencionista: o cateter vai direto ao ramo responsável para embolizá-lo.',
    ),
  },
  'ruptura-esplenica-hemoperitonio': {
    'Free fluid surrounding the spl': x(
      'Sangue em volta do baço, mais denso junto ao órgão que sangrou — o coágulo sentinela. A densidade entre 40 e 70 UH distingue sangue de ascite.',
    ),
    'left pericolic gutter': x(
      'O sangue do baço desce pela goteira esquerda até a pelve. Seguir o caminho do líquido ajuda a localizar a origem do sangramento.',
    ),
    blood: x(
      'Na pelve, o ponto mais baixo da cavidade, o sangue se acumula em maior volume. A quantidade de hemoperitônio e a hemodinâmica decidem entre observação, embolização e cirurgia.',
    ),
  },
  'politrauma-abdominal': {
    'liver laceration': x(
      'Laceração é uma faixa ou área hipodensa no fígado, irregular, que não realça — parênquima rompido com sangue. A profundidade e a extensão definem o grau na escala AAST.',
    ),
    'free fluid': x(
      'Líquido livre em vários recessos — em volta do fígado e do baço, entre as alças e na pelve — indica hemoperitônio volumoso. O FAST positivo à beira do leito corresponde a esse achado.',
    ),
    'small bowel mural thickening': x(
      'Parede de alça espessada com líquido livre sem lesão de órgão sólido que o explique sugere lesão de víscera oca ou do mesentério, que exige laparotomia. O sinal do cinto aumenta essa suspeita.',
    ),
    'transverse pocess fracture': x(
      'Fratura de processo transverso lombar marca impacto de alta energia no flanco e se associa a lesões renais e intestinais. Isolada, é estável, mas é um alerta.',
    ),
    'arterial blush': x(
      'Foco de contraste com densidade arterial fora do vaso: sangramento ativo na fase arterial. É o alvo da embolização.',
    ),
    'Active bleeding': x(
      'Na fase portal, o contraste extravasado aumenta e se espalha — prova de que o sangramento continua. Paciente instável com sangramento ativo vai para cirurgia ou embolização imediata.',
    ),
    'pelvic binder': x(
      'A cinta pélvica fecha a bacia instável e reduz o sangramento venoso pélvico. Ela pode reduzir uma fratura e escondê-la na imagem; a avaliação da pelve deve considerar essa limitação.',
    ),
  },
  'fratura-de-plato-tibial-com-lesao-arterial': {
    'Popliteal artery occlusion': x(
      'A artéria poplítea fica presa entre o hiato dos adutores e o arco do sóleo e não tem como escapar quando o joelho é deslocado. A íntima rompe, forma trombo e o contraste para de forma abrupta no nível da fratura.',
      'Pulso pedioso palpável não exclui lesão arterial; índice tornozelo-braquial abaixo de 0,9 pede angiotomografia.',
    ),
    'Muscular arterial branches': x(
      'Ramos geniculares e musculares formam colaterais em volta do joelho e levam algum sangue além da oclusão. Elas não bastam para manter a perna viável por muito tempo.',
    ),
    'Reconstituted arterial flow': x(
      'Abaixo da oclusão, o contraste reaparece nas artérias da perna, trazido pelas colaterais. Mostra até onde a artéria está pérvia e onde o cirurgião pode ancorar o enxerto.',
    ),
  },
  'fratura-vertebral-em-explosao': {
    'L2 vertebral body': x(
      'Na fratura em explosão, a carga axial comprime o corpo vertebral e o fragmenta em várias direções, incluindo para trás. O muro posterior empurrado para o canal estreita o espaço da medula e da cauda equina. O que separa explosão de compressão simples é justamente o muro posterior acometido.',
      'Avalie os elementos posteriores e o complexo ligamentar: se estiverem lesados, a fratura é instável.',
    ),
  },
}
