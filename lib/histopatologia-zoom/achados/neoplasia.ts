import type { AchadoPatologico } from '../tipos'

/** Achados de neoplasia: atipia, arquitetura, invasão e o que acompanha o tumor. */
export const ACHADOS_NEOPLASIA: AchadoPatologico[] = [
  {
    id: 'atipia-citologica',
    nome: 'Atipia citológica',
    sinonimos: ['pleomorfismo nuclear', 'núcleos atípicos', 'anaplasia'],
    categoria: 'neoplasia',
    resumo:
      'Células com núcleos maiores, mais escuros ou vesiculosos, de formas e tamanhos variados, nucléolos evidentes e perda da organização normal — o aspecto individual da célula neoplásica.',
    comoReconhecer: [
      'Compare sempre com a célula normal do mesmo tecido, de preferência no mesmo campo.',
      'Núcleo aumentado em relação ao citoplasma (relação núcleo/citoplasma alta), hipercromático ou vesiculoso com cromatina grosseira.',
      'Pleomorfismo: núcleos de tamanhos e formas diferentes entre si; nucléolos grandes e às vezes múltiplos.',
      'Perda de polaridade: nos epitélios, os núcleos deixam de ficar alinhados na base e se empilham (estratificação) até a superfície.',
    ],
    mecanismo: [
      'Mutações acumuladas em genes de controle do ciclo celular, reparo do DNA e diferenciação produzem células que se dividem sem freio e não amadurecem.',
      'A instabilidade genômica (aneuploidia) aumenta o conteúdo de DNA: o núcleo cresce e cora mais.',
      'A síntese proteica intensa exige nucléolos grandes; a perda de moléculas de adesão e de polaridade desorganiza o epitélio.',
    ],
    significado: [
      'Sinal de neoplasia (ou de displasia, sua fase pré-invasiva). O grau de atipia contribui para a graduação histológica do tumor.',
      'Atipia sozinha não prova malignidade: é a invasão que define o carcinoma.',
    ],
    ondeOcorre: ['Carcinomas e sarcomas', 'Displasias (adenomas, NIC, Barrett com displasia)', 'Alterações reativas intensas (armadilha)'],
    armadilhas: [
      'Epitélio regenerativo na borda de úlceras e células sob radioterapia ou quimioterapia podem ter núcleos grandes e nucléolos — mas mantêm a maturação para a superfície e o contexto inflamatório.',
      'Artefatos de fixação e cortes espessos escurecem os núcleos (falsa hipercromasia).',
    ],
  },
  {
    id: 'glandulas-neoplasicas-complexas',
    nome: 'Glândulas neoplásicas de arquitetura complexa',
    sinonimos: ['glândulas back-to-back', 'padrão cribriforme', 'glândulas irregulares', 'adenocarcinoma'],
    categoria: 'arquitetura',
    resumo:
      'Glândulas irregulares, ramificadas e aglomeradas, encostadas umas nas outras sem estroma entre elas (back-to-back) ou com várias luzes dentro de um mesmo bloco celular (cribriformes).',
    comoReconhecer: [
      'No pequeno aumento: a organização regular do órgão (criptas paralelas, lóbulos) some; aparece uma massa de glândulas de tamanhos e formas diferentes.',
      'No médio aumento: glândulas ramificadas, anguladas, fundidas ou cribriformes, revestidas por epitélio estratificado e sem as células caliciformes normais.',
      'Compare com a mucosa normal vizinha: criptas retas, iguais, paralelas, com núcleos pequenos na base e muitas células caliciformes.',
    ],
    mecanismo: [
      'As células neoplásicas proliferam sem responder aos sinais que mantêm a arquitetura (contato célula-célula, polaridade, apoptose).',
      'Formam glândulas porque conservam parte do programa epitelial, mas de maneira desordenada: brotam, ramificam e se fundem.',
    ],
    significado: [
      'Define um tumor glandular (adeno-). O grau de formação de glândulas é a base da graduação: bem, moderadamente ou pouco diferenciado.',
      'Arquitetura complexa sem invasão ainda pode ser displasia de alto grau/carcinoma in situ; o diagnóstico de adenocarcinoma exige invasão.',
    ],
    ondeOcorre: ['Adenocarcinoma colorretal, gástrico, pancreático, de próstata, de endométrio e de pulmão', 'Adenomas com displasia de alto grau'],
    armadilhas: [
      'Criptas cortadas tangencialmente parecem irregulares; a hiperplasia e a adenomiose também formam glândulas agrupadas, mas sem atipia.',
    ],
  },
  {
    id: 'invasao-estromal',
    nome: 'Invasão do estroma',
    sinonimos: ['carcinoma invasivo', 'infiltração', 'frente de invasão'],
    categoria: 'neoplasia',
    resumo:
      'Células ou glândulas neoplásicas fora do seu compartimento natural, infiltrando o tecido conjuntivo, em geral cercadas por reação desmoplásica — é o que transforma displasia em carcinoma.',
    comoReconhecer: [
      'Glândulas pequenas, anguladas ou cordões e células isoladas espalhados no estroma, sem a disposição organizada do tecido de origem.',
      'Ao redor delas, estroma diferente do normal: fibroso, pálido ou edematoso, com fibroblastos ativados (desmoplasia).',
      'No trato digestivo, o marco é a muscular da mucosa: ultrapassá-la e chegar à submucosa é o critério de adenocarcinoma invasivo.',
    ],
    mecanismo: [
      'A célula tumoral perde E-caderina e se solta das vizinhas; secreta metaloproteinases que degradam a membrana basal e a matriz.',
      'Liga-se à matriz por integrinas, migra e recruta fibroblastos associados ao câncer, que remodelam o estroma a seu favor.',
    ],
    significado: [
      'É o critério de malignidade para os carcinomas: sem invasão, não há metástase.',
      'A profundidade da invasão define o estadiamento T (pT1 submucosa, pT2 muscular própria, pT3 subserosa/gordura pericólica, pT4 serosa ou órgãos vizinhos, no cólon).',
    ],
    ondeOcorre: ['Todos os carcinomas invasivos'],
    armadilhas: [
      'Glândulas deslocadas para a submucosa em pólipos pediculados torcidos (pseudoinvasão) vêm acompanhadas de lâmina própria e hemossiderina, sem desmoplasia.',
      'Cortes tangenciais podem simular ninhos isolados.',
    ],
  },
  {
    id: 'infiltracao-da-muscular-propria',
    nome: 'Infiltração da muscular própria pelo tumor',
    sinonimos: ['invasão da muscular própria', 'pT2'],
    categoria: 'neoplasia',
    resumo:
      'Glândulas ou ninhos tumorais entre os feixes de músculo liso da muscular própria — a invasão ultrapassou a submucosa.',
    comoReconhecer: [
      'No médio aumento: estruturas glandulares atípicas cercadas por feixes rosados de músculo liso, com núcleos alongados "em charuto".',
      'Os feixes musculares aparecem afastados, às vezes com desmoplasia entre eles.',
    ],
    mecanismo: [
      'O carcinoma avança pelas vias de menor resistência: septos conjuntivos entre os feixes musculares, espaços perineurais e vasculares.',
    ],
    significado: [
      'Marca, no mínimo, o estádio pT2 no cólon e em outras vísceras ocas; ultrapassá-la até a gordura é pT3.',
      'Quanto mais profunda a invasão, maior a chance de metástase linfonodal.',
    ],
    ondeOcorre: ['Adenocarcinoma colorretal e gástrico', 'Carcinoma urotelial da bexiga (invasão da detrusor = pT2)', 'Carcinoma de esôfago'],
    armadilhas: [
      'Não confundir com a muscular da mucosa, uma camada muito mais fina logo abaixo das criptas.',
    ],
  },
  {
    id: 'reacao-desmoplasica',
    nome: 'Reação desmoplásica',
    sinonimos: ['desmoplasia', 'estroma desmoplásico'],
    categoria: 'neoplasia',
    resumo:
      'Estroma fibroso novo em volta das células tumorais invasivas: fibroblastos ativados, colágeno frouxo ou denso e aspecto pálido, às vezes mixoide.',
    comoReconhecer: [
      'Estroma diferente do conjuntivo normal da região: mais celular, com fibroblastos grandes e fusiformes, colágeno em feixes desorganizados.',
      'Frequentemente pálido-azulado (mixoide) ou rosa-denso, circundando glândulas pequenas e anguladas.',
    ],
    mecanismo: [
      'As células tumorais secretam TGF-β, PDGF e FGF, que ativam fibroblastos em "fibroblastos associados ao câncer" (miofibroblastos).',
      'Eles depositam colágeno e remodelam a matriz — o que endurece o tumor (a consistência pétrea à palpação) e ajuda a invasão.',
    ],
    significado: [
      'Pista forte de invasão: glândulas atípicas cercadas por desmoplasia são carcinoma invasivo.',
      'Explica a retração e o endurecimento de tumores como o carcinoma de mama (retração do mamilo) e de pâncreas.',
    ],
    ondeOcorre: ['Carcinomas invasivos de mama, pâncreas, cólon, estômago e vias biliares'],
    armadilhas: ['Cicatrizes e fibrose pós-inflamatória também são fibrosas, mas não contêm glândulas atípicas.'],
  },
  {
    id: 'necrose-suja',
    nome: 'Necrose "suja" intraluminal',
    sinonimos: ['dirty necrosis', 'necrose intraglandular'],
    categoria: 'lesao-celular',
    resumo:
      'Restos necróticos eosinofílicos cheios de fragmentos nucleares dentro da luz das glândulas tumorais — assinatura clássica do adenocarcinoma colorretal.',
    comoReconhecer: [
      'Material rosa, granular, dentro da luz glandular, salpicado de pontos e grumos basofílicos (poeira nuclear, cariorrexe).',
      'Revestido por epitélio neoplásico estratificado e atípico.',
    ],
    mecanismo: [
      'Células tumorais que se descamam na luz e células do centro de glândulas grandes morrem por falta de suprimento (as glândulas crescem mais rápido que os vasos).',
      'Neutrófilos atraídos pela necrose se fragmentam e acrescentam restos nucleares.',
    ],
    significado: [
      'Muito sugestiva de origem colorretal quando se examina um adenocarcinoma metastático de origem desconhecida (no fígado, no pulmão, no ovário).',
    ],
    ondeOcorre: ['Adenocarcinoma colorretal (primário e metástases)', 'Mais raramente, outros adenocarcinomas'],
    armadilhas: ['Muco com células inflamatórias na luz de glândulas normais ou de adenomas não tem o aspecto granular e a poeira nuclear abundante.'],
  },
  {
    id: 'transicao-abrupta-para-mucosa-normal',
    nome: 'Transição abrupta entre mucosa normal e neoplasia',
    sinonimos: ['transição abrupta', 'frente de transição'],
    categoria: 'arquitetura',
    resumo:
      'Ponto em que o epitélio normal termina e começa, sem transição gradual, o epitélio neoplásico — o melhor lugar da lâmina para comparar os dois.',
    comoReconhecer: [
      'No pequeno aumento: muda a cor (o neoplásico é mais basofílico, "roxo"), a altura da mucosa e a arquitetura.',
      'No grande aumento: de um lado núcleos pequenos, basais e muitas células caliciformes; do outro, núcleos grandes, estratificados e poucas caliciformes.',
    ],
    mecanismo: [
      'O tumor é clonal: nasce de uma célula alterada e se expande lateralmente, empurrando ou substituindo a mucosa vizinha, sem se misturar a ela.',
    ],
    significado: [
      'Didático: permite comparar, no mesmo campo, normal e neoplásico. Diagnosticamente, favorece neoplasia em relação a alterações reativas, que costumam ser graduais.',
    ],
    ondeOcorre: ['Adenomas e adenocarcinomas do trato digestivo', 'Neoplasias intraepiteliais do colo uterino e de Barrett'],
    armadilhas: ['Uma borda de úlcera também muda o epitélio, mas de modo gradual e com inflamação.'],
  },
  {
    id: 'mucina-extracelular',
    nome: 'Mucina extracelular (lagos de muco)',
    sinonimos: ['componente mucinoso', 'lagos de mucina', 'adenocarcinoma mucinoso'],
    categoria: 'neoplasia',
    resumo:
      'Lagos de muco azul-pálido dissecando o estroma, com células tumorais flutuando dentro deles em fitas ou pequenos grupos.',
    comoReconhecer: [
      'Áreas amplas, pálidas, azul-acinzentadas ou levemente rosadas, de aspecto gelatinoso, na parede do órgão.',
      'Dentro delas, tiras ou ninhos de epitélio atípico; ao redor, septos fibrosos.',
    ],
    mecanismo: ['Células neoplásicas com diferenciação caliciforme secretam mucina em excesso, que se acumula fora das células e disseca o tecido.'],
    significado: [
      'Quando mais de 50 % do tumor é mucina, é adenocarcinoma mucinoso — associado à instabilidade de microssatélites no cólon direito.',
    ],
    ondeOcorre: ['Adenocarcinoma mucinoso colorretal', 'Carcinoma mucinoso da mama', 'Neoplasias mucinosas do apêndice e do ovário'],
    armadilhas: ['Muco extravasado de glândulas não neoplásicas (mucocele, divertículo) não contém epitélio atípico flutuando.'],
  },
  {
    id: 'celulas-em-anel-de-sinete',
    nome: 'Células em anel de sinete',
    sinonimos: ['signet ring cells'],
    categoria: 'neoplasia',
    resumo:
      'Células tumorais isoladas cujo citoplasma está tomado por um vacúolo de mucina que empurra o núcleo para a periferia, em forma de crescente — como um anel com sinete.',
    comoReconhecer: [
      'Células soltas, sem formar glândulas, infiltrando o estroma difusamente.',
      'Citoplasma claro ou azul-pálido, núcleo espremido na borda.',
    ],
    mecanismo: ['Perda de E-caderina (gene CDH1): as células não aderem umas às outras e infiltram isoladamente, acumulando mucina dentro de si.'],
    significado: ['Tipo difuso de carcinoma gástrico (linite plástica) e variante agressiva de carcinoma colorretal; pior prognóstico.'],
    ondeOcorre: ['Carcinoma gástrico difuso', 'Carcinoma colorretal com células em anel de sinete', 'Tumor de Krukenberg (metástase ovariana)'],
    armadilhas: ['Macrófagos espumosos (muciphages) e adipócitos pequenos imitam células em anel de sinete; os macrófagos têm núcleo central e não são atípicos.'],
  },
  {
    id: 'invasao-angiolinfatica',
    nome: 'Invasão angiolinfática',
    sinonimos: ['êmbolo tumoral', 'invasão vascular', 'invasão linfovascular'],
    categoria: 'neoplasia',
    resumo:
      'Células tumorais dentro da luz de um vaso sanguíneo ou linfático, revestido por endotélio — o caminho da metástase.',
    comoReconhecer: [
      'Grupo de células atípicas dentro de um espaço revestido por endotélio achatado, às vezes aderido à parede e misturado a fibrina e hemácias.',
      'Veias da submucosa e da subserosa (invasão venosa extramural) são os lugares para procurar no cólon.',
    ],
    mecanismo: ['Células tumorais degradam a parede do vaso, entram na circulação (intravasamento) e podem sobreviver e se implantar à distância.'],
    significado: ['Fator prognóstico independente: aumenta o risco de metástase linfonodal e hepática; influencia a indicação de quimioterapia.'],
    ondeOcorre: ['Qualquer carcinoma; especialmente relatada em cólon, mama, estômago e endométrio'],
    armadilhas: ['Retração do estroma em volta de ninhos tumorais cria um espaço claro que imita um vaso — mas sem endotélio.'],
  },
  {
    id: 'adenoma-residual',
    nome: 'Componente adenomatoso residual',
    sinonimos: ['adenoma remanescente', 'sequência adenoma-carcinoma'],
    categoria: 'neoplasia',
    resumo:
      'Restos do adenoma que deu origem ao carcinoma — displasia na superfície, sem invasão —, a prova morfológica da sequência adenoma-carcinoma.',
    comoReconhecer: [
      'Na superfície ou na borda do tumor, criptas tubulares ou vilosas com núcleos alongados e estratificados, porém organizadas e sem invasão do estroma.',
    ],
    mecanismo: [
      'A maioria dos carcinomas colorretais nasce de um adenoma: mutação de APC, depois KRAS, perda de 18q (SMAD4) e de TP53 transformam a displasia em carcinoma invasivo ao longo de anos.',
    ],
    significado: ['Explica o rastreamento com colonoscopia: remover o adenoma interrompe a sequência.'],
    ondeOcorre: ['Adenocarcinoma colorretal, especialmente os pequenos e precoces'],
    armadilhas: ['Em tumores grandes o carcinoma costuma ter destruído todo o adenoma de origem.'],
  },
  {
    id: 'displasia-epitelial',
    nome: 'Displasia epitelial (neoplasia intraepitelial)',
    sinonimos: ['displasia', 'neoplasia intraepitelial', 'epitélio adenomatoso'],
    categoria: 'neoplasia',
    resumo:
      'Epitélio neoplásico que ainda não invadiu: núcleos alongados, hipercromáticos e empilhados, perda da maturação e das células caliciformes — tudo acima da membrana basal.',
    comoReconhecer: [
      'No pequeno aumento: o epitélio fica mais escuro (roxo) que o normal, porque os núcleos são maiores e mais numerosos.',
      'No médio aumento: núcleos alongados "em lápis", em paliçada e estratificados; o citoplasma perde a mucina (poucas células caliciformes).',
      'Falta a maturação: na mucosa normal, as células ficam mais diferenciadas perto da superfície; na displasia, a superfície é tão atípica quanto a base.',
      'Baixo grau: núcleos alongados, ainda na metade basal, polaridade preservada. Alto grau: núcleos redondos, vesiculosos, com nucléolos, até a superfície, e arquitetura complexa (cribriforme).',
    ],
    mecanismo: [
      'Mutações que ativam a proliferação (APC/Wnt no cólon, HPV no colo uterino, p53 no Barrett) mantêm as células no estado de progenitor: elas se dividem e não amadurecem.',
      'Como a membrana basal está intacta, não há acesso a vasos linfáticos: a lesão ainda não dá metástase.',
    ],
    significado: [
      'É lesão precursora: com o tempo, parte das displasias adquire a capacidade de invadir e vira carcinoma.',
      'O grau (baixo × alto) e o tamanho da lesão definem o risco e o intervalo de vigilância.',
    ],
    ondeOcorre: ['Adenomas colorretais', 'Esôfago de Barrett com displasia', 'NIC do colo uterino', 'Neoplasia intraepitelial prostática (NIP)'],
    armadilhas: [
      'Epitélio regenerativo (colite, borda de úlcera) tem núcleos grandes, mas amadurece para a superfície e vem com inflamação.',
      'A displasia de alto grau pode coexistir com focos de invasão: é preciso procurar a submucosa em todo o pólipo.',
    ],
  },
  {
    id: 'displasia-de-alto-grau',
    nome: 'Displasia de alto grau',
    sinonimos: ['carcinoma intramucoso', 'carcinoma in situ'],
    categoria: 'neoplasia',
    resumo:
      'Displasia com atipia acentuada e arquitetura complexa — núcleos redondos e vesiculosos até a superfície, perda de polaridade, glândulas cribriformes —, ainda sem invasão da submucosa.',
    comoReconhecer: [
      'Núcleos arredondados, vesiculosos, com nucléolos, perdendo a orientação perpendicular à membrana basal.',
      'Glândulas fundidas, cribriformes ou com necrose intraluminal, ainda dentro da mucosa.',
    ],
    mecanismo: ['Acúmulo de mutações (no cólon, TP53 e perda de 18q) sobre a displasia de baixo grau.'],
    significado: [
      'Risco alto de carcinoma coexistente ou futuro: no pólipo removido inteiro, exige avaliação cuidadosa das margens e da base.',
    ],
    ondeOcorre: ['Adenomas avançados', 'Barrett', 'Colite ulcerativa de longa duração'],
    armadilhas: ['Cortes tangenciais e epitélio regenerativo intenso podem simular alto grau.'],
  },
  {
    id: 'arquitetura-vilosa',
    nome: 'Arquitetura vilosa',
    sinonimos: ['frondes vilosas', 'projeções digitiformes', 'adenoma viloso'],
    categoria: 'arquitetura',
    resumo:
      'Projeções longas em forma de dedo, com um eixo fino de lâmina própria e vasos, revestidas por epitélio displásico — como folhas de uma samambaia.',
    comoReconhecer: [
      'No pequeno aumento: frondes longas e paralelas saindo de uma base, com espaços claros entre elas.',
      'No médio aumento: cada fronde tem um eixo central delgado de conjuntivo e capilares, revestido nos dois lados por epitélio colunar displásico.',
      'Tubular = criptas tubulares; viloso = mais de 75 % de frondes; tubuloviloso = mistura (25–75 %).',
    ],
    mecanismo: ['O epitélio displásico prolifera para a luz em vez de formar criptas, arrastando consigo o eixo de lâmina própria.'],
    significado: [
      'Componente viloso, tamanho ≥ 1 cm e displasia de alto grau definem o adenoma "avançado", com maior risco de carcinoma.',
      'Adenomas vilosos grandes do reto podem secretar muco em excesso (diarreia com perda de potássio).',
    ],
    ondeOcorre: ['Adenomas vilosos e tubulovilosos colorretais', 'Adenomas duodenais e da ampola'],
    armadilhas: ['A mucosa do intestino delgado tem vilosidades normais — com enterócitos e caliciformes, sem displasia.'],
  },
]

