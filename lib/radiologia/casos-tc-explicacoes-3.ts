import type { ExplicacoesExtras } from './casos-imagem'

const x = (explicacao: string, dica?: string) => ({ explicacao, dica })

/**
 * Revisão dos comentários que ficaram curtos na primeira escrita. Sobrescreve
 * a explicação; a dica original é mantida quando esta não traz outra.
 */
export const EXPLICACOES_TC_3: ExplicacoesExtras = {
  'abscesso-peritonsilar': {
    Hypopharyngeal: x('A hipofaringe fica abaixo da orofaringe, atrás da laringe, e é o caminho comum do ar e do alimento. O edema inflamatório que desce da loja amigdaliana reduz a coluna de ar dessa região, o que explica a voz abafada, a sialorreia e o risco de obstrução da via aérea.'),
    'Right vallecula': x('A valécula é o recesso entre a base da língua e a epiglote; normalmente as duas são simétricas e cheias de ar. Uma valécula apagada ou assimétrica indica edema ou extensão do processo inflamatório para a região supraglótica, o que aumenta o risco para a via aérea.'),
  },
  'abscesso-retrofaringeo': {
    'visceral space': x('O espaço visceral é o compartimento do pescoço que envolve faringe, laringe, esôfago, traqueia e tireoide, delimitado pela camada média da fáscia cervical profunda. Uma coleção ali comprime a via aérea e o esôfago, o que explica o estridor e a disfagia, e pode descer ao mediastino.'),
  },
  'sindrome-de-lemierre': {
    'reactive lymph nodes': x('Linfonodos cervicais aumentados, ovais e com realce homogêneo acompanham a infecção da orofaringe — são reativos. O que mudaria a conduta seria um centro hipodenso, sinal de necrose e abscesso ganglionar, que também pode precisar de drenagem.'),
    'Post-procedural gas foci': x('Bolhas de gás no trajeto da drenagem recente do abscesso são esperadas e reabsorvem em dias. Sem o dado do procedimento, gás nos tecidos do pescoço sugeriria germe produtor de gás ou fístula com a faringe — por isso o contexto clínico sempre acompanha a leitura.'),
    'peritonsillar abscess,': x('Mesmo após a drenagem, persiste inflamação e uma pequena coleção residual junto à amígdala, com extensão para o espaço parafaríngeo. É exatamente esse caminho, lateral à faringe, que leva a infecção até a bainha carotídea e a parede da veia jugular.'),
  },
  'tep-a-cavaleiro': {
    left: x('O trombo em sela continua pela artéria pulmonar principal esquerda. Com as duas artérias principais obstruídas, boa parte do leito vascular fica fechada de uma vez; a resistência que o ventrículo direito precisa vencer sobe de forma súbita, e é isso que causa síncope e choque.'),
    'left upper': x('Falha de enchimento no ramo do lobo superior esquerdo. Para não perder nenhuma falha, siga cada artéria do hilo à periferia, lobo por lobo, usando os brônquios como guia — a artéria corre colada ao brônquio do mesmo segmento, como um par.'),
    upper: x('Trombos nos ramos segmentares do lobo superior direito mostram que a embolia não ficou só central: fragmentou-se e chegou à periferia. Quanto mais ramos ocluídos, maior a fração do leito vascular perdida, o que alguns escores de obstrução quantificam.'),
    middle: x('Trombo no ramo arterial do lobo médio. O lobo médio tem artérias finas e oblíquas, que ficam fáceis de reconhecer quando se segue o brônquio do lobo médio a partir do brônquio intermediário; a falha aparece como um defeito cinzento dentro de um vaso branco.'),
    subsegmental: x('Falhas em ramos subsegmentares, na periferia do pulmão, mostram a extensão distal da embolia. Isoladas, em paciente estável e sem trombose venosa, têm importância clínica discutida; aqui fazem parte de uma embolia maciça e não mudam a conduta, mas completam o mapa.'),
    'left subsegmental': x('Trombo em ramo subsegmentar do pulmão esquerdo. Avaliar ramos tão periféricos exige boa opacificação e cortes finos: artefato de respiração e mistura de sangue não contrastado simulam falhas, por isso a falha verdadeira deve aparecer em cortes consecutivos.'),
  },
  'disseccao-de-aorta-tipo-a': {
    SMA: x('Se o flap alcança a artéria mesentérica superior, o intestino pode ficar mal perfundido — seja porque o ramo nasce da luz falsa, seja porque o flap tampa a origem. Isquemia mesentérica na dissecção tem mortalidade altíssima, e dor abdominal desproporcional é sinal de alarme que muda a urgência.'),
    'intraluminal filling defects': x('Material sem contraste dentro da luz falsa é trombo. A luz falsa parcialmente trombosada, com fluxo de entrada e pouca saída, mantém pressão alta e se associa a maior crescimento e risco de ruptura no seguimento; luz falsa completamente trombosada tende a evoluir melhor.'),
    'left renal artery': x('Quando a artéria renal nasce da luz falsa ou é coberta pelo flap, o rim recebe menos sangue e realça menos que o outro na mesma fase. Isso explica piora da função renal e hipertensão de difícil controle e pode exigir tratamento endovascular do ramo.'),
  },
  'bronquiectasias-cisticas': {
    'string of pearls sign': x('Na bronquiectasia varicosa, o brônquio alterna segmentos dilatados e estreitados ao longo do trajeto, como contas de um colar, lembrando uma veia varicosa. Aparece melhor quando o brônquio é cortado no seu comprimento, em cortes que acompanham a árvore brônquica.'),
    'air–fluid levels': x('Bronquiectasias císticas retêm secreção porque o batimento ciliar e a tosse não conseguem esvaziá-las. Com o paciente deitado, a secreção decanta e forma linhas horizontais com o ar por cima. Esses níveis indicam muco estagnado e infecção ativa ou colonização.'),
    'bunch of grapes sign': x('Brônquios dilatados em sacos redondos, agrupados lado a lado, lembram um cacho de uvas. É a forma mais grave de bronquiectasia, a cística ou sacular, em que os brônquios perdem a ramificação normal e terminam em fundo cego, com pulmão em volta frequentemente destruído.'),
    'varicose bronchiectasis': x('Brônquio de contorno irregular, com calibre que varia ao longo do trajeto, sem as paredes paralelas da forma cilíndrica nem os sacos da forma cística. É o grau intermediário de dilatação e costuma coexistir com os outros dois no mesmo pulmão.'),
  },
  'fibrose-pulmonar-uip': {
    subpleural: x('A fibrose da pneumonia intersticial usual começa na periferia do lóbulo, colada à pleura e aos septos, e avança para o centro. Essa distribuição subpleural, junto com o predomínio nas bases, é a assinatura do padrão; doenças que poupam a região subpleural, como a pneumonia intersticial não específica, apontam outro diagnóstico.'),
  },
  'tuberculose-cavitaria': {
    consolidation: x('Em volta das cavidades, o pulmão está preenchido por exsudato inflamatório e granulomas, com densidade de partes moles e às vezes broncograma aéreo. A consolidação mostra a área de pneumonia tuberculosa da qual a cavidade nasceu e regride devagar com o tratamento, deixando fibrose e retração.'),
  },
  'empiema-pleura-dividida': {
    atelectasis: x('O pulmão vizinho à coleção é comprimido e perde ar — atelectasia passiva. Ele realça com contraste e tem forma de cunha ou de lâmina colada à coleção, o que o diferencia do empiema, que não realça. Depois da drenagem, deve reexpandir.'),
  },
  piopneumotorax: {
    multilobed: x('Septos de fibrina dividem a coleção em lojas separadas, típicas da fase fibrinopurulenta do empiema. Coleção septada drena mal por um dreno só, porque cada loja fica isolada, e muitas vezes exige fibrinolítico intrapleural ou videotoracoscopia para desfazer os septos.'),
  },
  'cancer-de-pulmao-espiculado': {
    nodule: x('Um nódulo adicional pode ser satélite no mesmo lobo do tumor, metástase em outro lobo ou lesão benigna sem relação. A localização muda o estadiamento — mesmo lobo, outro lobo do mesmo pulmão ou pulmão contralateral têm categorias diferentes —, por isso cada nódulo é descrito e medido.'),
    emphysema: x('O enfisema de fundo é o rastro do tabagismo, o mesmo fator que causou o câncer. Ele também reduz a reserva respiratória: a quantidade de pulmão funcionante que sobraria depois de uma lobectomia pesa na decisão entre cirurgia, radioterapia estereotáxica ou tratamento sistêmico.'),
  },
  'apendicite-complicada': {
    gas: x('Bolhas de gás fora da luz do apêndice, na gordura vizinha, indicam que a parede rompeu. Gás extraluminal, abscesso e apendicolito fora da luz definem a apendicite complicada, que geralmente exige cirurgia em vez de tratamento com antibiótico isolado.'),
  },
  'diverticulite-de-sigmoide': {
    'Cholecystectomy clips': x('Clipes metálicos no leito da vesícula indicam colecistectomia prévia. O metal é muito denso e gera artefato em estrias claras e escuras ao redor; reconhecê-lo evita confundi-lo com cálculo, corpo estranho ou contraste extravasado na leitura do abdome superior.'),
  },
  'colecistite-gangrenosa': {
    'gallbladder distension': x('O ducto cístico obstruído por cálculo impede a saída da bile, e a vesícula continua secretando muco: ela distende muito, acima de 4 por 10 cm. A pressão alta dentro dela comprime os vasos da parede, e é essa isquemia que leva da colecistite simples à gangrena.'),
  },
  'apendagite-epiploica': {
    'fat stranding': x('A gordura ao redor do apêndice epiploico inflamado fica densificada e o peritônio adjacente pode espessar. O cólon ao lado, porém, tem parede normal e não há divertículo inflamado — diferença essencial para a diverticulite, que exige antibiótico, enquanto a apendagite melhora com anti-inflamatório.'),
  },
  'ileo-biliar': {
    'collapsed distal small bowel.': x('Depois do obstáculo, o delgado fica vazio e colabado, sem gás nem líquido. O contraste entre as alças dilatadas antes e vazias depois define o ponto de transição — é exatamente ali que se procura a causa da obstrução, aqui o cálculo impactado.'),
    'dilated fluid filled proximal': x('Acima do cálculo, as alças acumulam líquido e gás e dilatam além de 2,5 a 3 cm. A distensão estira a parede e explica a cólica, os vômitos e o desequilíbrio hidroeletrolítico; alças muito dilatadas com parede fina e sem realce sugerem sofrimento isquêmico.'),
  },
  'perfuracao-intestinal': {
    'Focal mural thickening': x('Espessamento focal da parede do cólon junto à perfuração pode ser inflamação, como na diverticulite, ou tumor. No idoso, perfuração colônica com espessamento curto, assimétrico e em ombro pede investigação de câncer depois que a fase aguda passar.'),
    'focal wall defect': x('A falha na parede do cólon é o ponto exato da perfuração. Nem sempre é visível — muitas vezes é inferida pela concentração de gás e líquido extraluminal numa região —, e identificá-la orienta o cirurgião sobre qual segmento ressecar.'),
  },
  'volvo-de-sigmoide': {
    'transition points': x('Na alça fechada há dois pontos de transição muito próximos, um na entrada e outro na saída da torção, onde a alça afila em bico. Encontrar os dois juntos é o que diferencia o volvo de uma obstrução simples, que tem um ponto só.'),
    'whirl sign': x('O mesentério e os vasos mesentéricos enrolados em espiral em torno do eixo da torção formam o sinal do redemoinho, o achado mais específico de volvo na TC. Os vasos torcidos são também o que coloca a alça em risco de isquemia.'),
  },
  'isquemia-mesenterica-gas-portal': {
    'hyperdense material': x('Conteúdo denso dentro das alças pode ser contraste oral administrado ou sangue na luz de um intestino isquêmico. A mucosa necrosada sangra, e o paciente pode eliminar sangue escuro pelas fezes ou, como aqui, pelo estoma.'),
  },
  'carcinoma-hepatocelular': {
    'pericardial effusion': x('Pequeno derrame pericárdico é achado associado. Em pacientes com doença hepática avançada e hipoalbuminemia, derrames serosos são comuns; derrame volumoso ou com espessamento pericárdico mereceria investigação própria, inclusive de implantes tumorais.'),
  },
  'cirrose-hipertensao-portal': {
    'IVC compression': x('O lobo caudado hipertrofia na cirrose porque tem drenagem venosa própria, direto para a cava, e é relativamente poupado da fibrose. Grande, ele comprime e achata a veia cava inferior. A relação entre o caudado e o lobo direito acima de 0,65 é um dos sinais morfológicos de cirrose.'),
    diverticuli: x('Divertículos colônicos incidentais. Mencionar achados que não explicam o quadro faz parte do laudo completo, desde que sem confundi-los com a doença principal — eles podem ser fonte de sangramento ou inflamação no futuro.'),
  },
  'abscessos-hepaticos': {
    collections: x('Abscessos piogênicos formam coleções múltiplas, agrupadas, com septos internos e parede espessa que realça. Coleções pequenas tendem a se juntar em uma maior, como um cacho — o sinal do agrupamento —, que é muito característico de abscesso bacteriano.'),
    edema: x('Em volta das coleções, o parênquima inflamado realça menos e fica mais escuro que o fígado normal. Esse halo, somado à parede interna que realça, forma o sinal do duplo alvo, que ajuda a diferenciar abscesso de cisto simples e de metástase.'),
  },
  'pancreatite-aguda-edematosa': {
    'swelling of the pancreas': x('O edema do parênquima apaga o aspecto lobulado normal e borra a interface com a gordura. A TC feita nas primeiras 72 horas pode subestimar a necrose, que se define melhor depois; por isso a TC precoce é reservada à dúvida diagnóstica.'),
    'peripancreatic edema': x('A gordura em volta do pâncreas fica densificada e estriada pela inflamação e pelas enzimas que extravasam. É o achado mais constante da pancreatite aguda na TC e às vezes o único, quando o pâncreas ainda tem tamanho normal.'),
    'peri-pancreatic fluid': x('Coleção líquida aguda, sem parede, nas primeiras quatro semanas é exsudato inflamatório. A maioria reabsorve sem tratamento; as que persistem e formam parede fibrosa depois de quatro semanas passam a se chamar pseudocisto.'),
    'right paracolic gutter': x('O líquido inflamatório desce pelo espaço pararrenal anterior até a goteira parietocólica. Seguir o trajeto do líquido mostra a extensão da inflamação retroperitoneal, um dos componentes dos escores tomográficos de gravidade.'),
  },
  'calculo-ureteral-distal': {
    hydroureter: x('O ureter acima do cálculo dilata porque a urina continua descendo e não passa. Seguir o ureter dilatado de cima para baixo, corte a corte, leva direto ao cálculo, mesmo quando ele é pequeno e está perto de flebólitos que poderiam confundir.'),
    'perinephric fat stranding': x('A obstrução aguda aumenta a pressão no sistema coletor, que pode romper os fórnices e extravasar urina, causando densificação da gordura perirrenal. Indica obstrução recente; se houver febre, o rim obstruído e infectado precisa ser desobstruído com urgência.'),
  },
  'pielonefrite-enfisematosa': {
    'bilateral pleural effusions': x('Derrames pleurais bilaterais acompanham a sepse grave e a inflamação abaixo do diafragma. São reacionais, não infecção da pleura, mas reforçam a gravidade do quadro e podem contribuir para a hipoxemia.'),
    abscesses: x('Coleções com parede que realça dentro do rim mostram que a infecção destruiu parênquima e formou pus. Abscessos maiores que alguns centímetros não respondem bem só a antibiótico e pedem drenagem percutânea guiada por imagem.'),
    sludge: x('Material denso na vesícula é barro biliar, uma mistura de cristais e muco que se forma em pacientes graves, em jejum ou com nutrição parenteral. É achado associado, que só preocupa se houver colecistite.'),
    'air-containing collection': x('O gás ultrapassou a cápsula renal e ocupa o espaço perirrenal: a infecção se estendeu para fora do rim. Extensão perirrenal é um dos fatores de pior prognóstico e aumenta a chance de precisar de nefrectomia.'),
    'fistulous communication': x('Um trajeto liga a coleção renal ao cólon descendente. Fístulas assim podem surgir da infecção renal que erode o intestino ou do intestino que infecta o rim; a direção importa para o tratamento e para o tipo de cirurgia.'),
    'colon defect': x('Irregularidade focal da parede do cólon no ponto da fístula, com perda da estratificação normal. É ali que o contraste oral passa para fora da luz e onde o cirurgião vai precisar intervir.'),
    'contrast material': x('Contraste oral fora do intestino, dentro da coleção renal, prova a comunicação entre os dois. É a demonstração mais objetiva de uma fístula na TC e explica a urina com aspecto fecal.'),
  },
  'pielonefrite-aguda': {
    'UB mild mural thickening': x('A bexiga com parede discretamente espessada indica cistite, de onde a infecção subiu pelo ureter. A infecção urinária alta quase sempre começa embaixo, e a bexiga inflamada é o primeiro elo da cadeia.'),
    'enhancing ureteric wall': x('A parede do ureter inflamado fica espessa e realça com contraste, desenhando o trajeto ascendente da infecção da bexiga ao rim. Em gestantes, o ureter direito também dilata pela compressão do útero, o que facilita a subida.'),
    'renal pelves enhancing walls': x('O urotélio da pelve renal espessado e realçado indica pielite. Junto com as cunhas de menor realce no parênquima, que vão da papila ao córtex, compõe o quadro da pielonefrite aguda na TC.'),
  },
  'carcinoma-de-celulas-renais': {
    encapsulated: x('O carcinoma de células renais costuma ter pseudocápsula: uma borda nítida formada por parênquima comprimido e fibrose. Ela ajuda a definir margens e torna possível a nefrectomia parcial, que preserva o rim, em tumores pequenos e periféricos.'),
    necrosis: x('Áreas centrais sem realce são necrose, comuns em tumores maiores. O carcinoma de células claras realça intensamente na fase corticomedular, mais que os outros subtipos, com o centro necrótico escuro.'),
  },
  'cancer-colorretal-invasivo': {
    'eccentric thrombus': x('Trombo parcial e excêntrico numa veia próxima ao tumor. Câncer ativo aumenta a tendência à trombose venosa, e a invasão local também pode comprimir ou infiltrar veias; o achado entra no planejamento cirúrgico e na profilaxia.'),
    'dermal involvement': x('O tumor atravessou toda a parede abdominal — músculos, fáscia e subcutâneo — e chegou à pele. Invasão de estruturas vizinhas classifica o tumor como T4b e exige ressecção em bloco, levando a parede junto, geralmente depois de tratamento neoadjuvante.'),
  },
  'intussuscepcao-colocolica': {
    'lymph nodes': x('Linfonodos pericólicos pequenos podem ser reativos ou metastáticos; a TC não separa pela forma quando são pequenos. Na intussuscepção do adulto com lesão de base, eles entram no estadiamento e são retirados na ressecção oncológica.'),
    'skin lesion': x('Lesão cutânea sem relação com o quadro. A leitura sistemática passa também pela parede e pela pele, porque achados incidentais ali — um lipoma, um nódulo subcutâneo, uma hérnia — podem ter importância própria.'),
  },
  'trauma-hepatico-grau-v': {
    'right hepatic artery.': x('Identificar de qual artéria parte o sangramento guia o radiologista intervencionista: o cateter vai direto ao ramo responsável, aqui da artéria hepática direita, para embolizá-lo e parar o sangramento sem abrir o abdome.'),
  },
  'ruptura-esplenica-hemoperitonio': {
    'Free fluid surrounding the spl': x('Sangue em volta do baço, mais denso junto ao órgão que sangrou — o coágulo sentinela. A densidade entre 40 e 70 UH distingue sangue de ascite, que tem densidade próxima de água; é a pista que localiza a origem quando a laceração não aparece.'),
    'left pericolic gutter': x('O sangue que sai do baço desce pela goteira parietocólica esquerda até a pelve. Seguir o caminho do líquido, do ponto mais denso para o menos denso, ajuda a localizar a origem do sangramento.'),
    blood: x('Na pelve, o ponto mais baixo da cavidade com o paciente deitado, o sangue se acumula em maior volume. A quantidade de hemoperitônio, junto com a hemodinâmica, decide entre observação, embolização e cirurgia.'),
  },
  'politrauma-abdominal': {
    'liver laceration': x('Laceração é uma faixa ou área hipodensa no fígado, irregular, que não realça — parênquima rompido preenchido por sangue. A profundidade, a extensão e a presença de sangramento ativo definem o grau na escala AAST e orientam a conduta.'),
    'free fluid': x('Líquido livre em vários recessos — em volta do fígado e do baço, entre as alças e na pelve — indica hemoperitônio volumoso. O FAST positivo à beira do leito corresponde a esse achado e, no paciente instável, já indica cirurgia.'),
    'transverse pocess fracture': x('Fratura de processo transverso lombar marca impacto de alta energia no flanco e se associa a lesões renais, intestinais e mesentéricas. Isolada, é mecanicamente estável e não precisa de tratamento, mas é um alerta para procurar o resto.'),
    'arterial blush': x('Foco de contraste com densidade arterial fora do vaso na fase arterial é sangramento ativo — o blush. Ele indica o alvo para embolização e, em paciente instável, para controle cirúrgico.'),
    'Active bleeding': x('Na fase portal, o contraste extravasado aumenta e se espalha em relação à fase arterial, provando que o sangramento continua. Paciente instável com sangramento ativo vai para cirurgia ou embolização imediata, sem nova imagem.'),
    'pelvic binder': x('A cinta pélvica fecha a bacia instável e reduz o sangramento venoso pélvico. Como ela reduz a fratura, pode escondê-la na imagem: a avaliação da pelve deve considerar essa limitação e, quando seguro, repetir sem a cinta.'),
  },
  'fratura-de-plato-tibial-com-lesao-arterial': {
    'Muscular arterial branches': x('Ramos geniculares e musculares formam colaterais em volta do joelho e levam algum sangue além da oclusão. Elas mantêm parte da perfusão e às vezes até pulsos fracos, mas não bastam para manter a perna viável por muitas horas.'),
    'Reconstituted arterial flow': x('Abaixo da oclusão, o contraste reaparece nas artérias da perna, trazido pelas colaterais. Mostra até onde a artéria está pérvia e onde o cirurgião vascular pode ancorar a derivação ou o enxerto.'),
  },
}
