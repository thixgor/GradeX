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
  {
    id: 'ninhos-basaloides',
    nome: 'Ninhos de células basaloides',
    sinonimos: ['células basaloides', 'ilhas basaloides'],
    categoria: 'neoplasia',
    resumo:
      'Ilhas e cordões de células pequenas, azuladas, de núcleo ovalado e escasso citoplasma, parecidas com as células da camada basal da epiderme — o tumor do carcinoma basocelular.',
    comoReconhecer: [
      'No pequeno aumento: massas arroxeadas, bem delimitadas, na derme, ligadas ou não à epiderme.',
      'No grande aumento: núcleos ovais, uniformes, hipercromáticos, com pouco citoplasma e limites celulares mal visíveis; mitoses e células apoptóticas.',
    ],
    mecanismo: [
      'Mutações ativadoras da via Hedgehog (perda de PTCH1 ou ganho de SMO), induzidas pela radiação UV, fazem as células germinativas do folículo piloso proliferarem sem controle.',
    ],
    significado: [
      'Define o carcinoma basocelular: localmente invasivo e destrutivo, mas com metástase raríssima.',
    ],
    ondeOcorre: ['Carcinoma basocelular', 'Tumores anexiais (tricoepitelioma), que são benignos'],
    armadilhas: ['Tricoepitelioma e tricoblastoma também são basaloides, mas têm estroma próprio, sem fendas de retração e com diferenciação folicular.'],
  },
  {
    id: 'paliçada-periferica',
    nome: 'Paliçada periférica',
    sinonimos: ['paliçada nuclear', 'disposição em paliçada'],
    categoria: 'arquitetura',
    resumo:
      'Na borda de cada ninho tumoral, as células se alinham lado a lado, com os núcleos alongados perpendiculares à margem, como as estacas de uma cerca.',
    comoReconhecer: ['No grande aumento: uma fileira nítida de núcleos alongados e paralelos contornando o ninho, mais organizada que o centro, onde as células se dispõem ao acaso.'],
    mecanismo: ['As células da periferia do ninho conservam a polaridade da camada basal, orientada para a membrana basal e o estroma.'],
    significado: ['Um dos sinais mais característicos do carcinoma basocelular.'],
    ondeOcorre: ['Carcinoma basocelular', 'Ameloblastoma', 'Alguns tumores anexiais'],
    armadilhas: ['Paliçada parcial também aparece em outros tumores; deve ser vista junto com os demais critérios.'],
  },
  {
    id: 'fenda-de-retracao',
    nome: 'Fenda de retração peritumoral',
    sinonimos: ['artefato de retração', 'retração estromal'],
    categoria: 'arquitetura',
    resumo:
      'Espaço vazio em forma de fenda entre o ninho tumoral e o estroma que o cerca, formado durante o processamento.',
    comoReconhecer: ['Linha branca contornando o ninho, separando-o do estroma, sem células dentro dela.'],
    mecanismo: [
      'O estroma do carcinoma basocelular é rico em mucina, e a adesão entre o ninho e o estroma é frágil; na desidratação da peça, os dois se retraem de modo diferente e se separam.',
    ],
    significado: ['É um artefato, mas muito útil para o diagnóstico do carcinoma basocelular: os tumores benignos parecidos (tricoepitelioma) raramente a mostram.'],
    ondeOcorre: ['Carcinoma basocelular'],
    armadilhas: ['Não confundir com invasão vascular: a fenda não tem endotélio.'],
  },
  {
    id: 'perola-cornea',
    nome: 'Pérola córnea',
    sinonimos: ['pérola de queratina', 'globo córneo'],
    categoria: 'neoplasia',
    resumo:
      'Redemoinho concêntrico de queratina eosinofílica, lamelada, no centro de um ninho de células escamosas — a assinatura do carcinoma espinocelular bem diferenciado.',
    comoReconhecer: [
      'No pequeno aumento: círculos rosa-vivos, em "casca de cebola", dentro dos ninhos tumorais.',
      'No grande aumento: lamelas de queratina concêntricas, às vezes com núcleos residuais (paraqueratose), cercadas por células escamosas que se achatam em direção ao centro.',
    ],
    mecanismo: [
      'As células escamosas neoplásicas conservam o programa de diferenciação da epiderme: amadurecem do centro para dentro do ninho e produzem queratina, que se acumula em camadas.',
    ],
    significado: [
      'Prova a diferenciação escamosa do tumor. Quanto mais pérolas, mais bem diferenciado (e menos agressivo) o carcinoma.',
    ],
    ondeOcorre: ['Carcinoma espinocelular de pele, boca, esôfago, pulmão e colo uterino', 'Ceratoacantoma'],
    armadilhas: ['Cistos epidérmicos e folículos pilosos cortados transversalmente também têm queratina lamelada, mas sem células atípicas infiltrando o estroma.'],
  },
  {
    id: 'ninhos-escamosos-infiltrativos',
    nome: 'Ninhos escamosos infiltrativos',
    sinonimos: ['carcinoma escamoso invasivo', 'ilhas de células escamosas'],
    categoria: 'neoplasia',
    resumo:
      'Ilhas e cordões irregulares de células escamosas atípicas — grandes, de citoplasma eosinofílico abundante, núcleos pleomórficos e nucléolos — que se desprendem da epiderme e invadem a derme.',
    comoReconhecer: [
      'No pequeno aumento: massas róseas irregulares descendo da epiderme para a derme, com contornos angulosos.',
      'No grande aumento: células poligonais de citoplasma rosa, limites nítidos e pontes intercelulares; núcleos grandes, hipercromáticos ou vesiculosos, com nucléolos; mitoses, inclusive atípicas.',
      'Estroma em volta com linfócitos e reação desmoplásica.',
    ],
    mecanismo: [
      'Mutações de TP53 e outras, induzidas pela radiação UV (ou por HPV, tabaco e álcool em outras localizações), acumuladas nos queratinócitos.',
      'A displasia (ceratose actínica, doença de Bowen) progride até romper a membrana basal e invadir.',
    ],
    significado: [
      'Define o carcinoma espinocelular invasivo. A profundidade, a invasão perineural e o grau de diferenciação definem o risco de metástase.',
    ],
    ondeOcorre: ['Carcinoma espinocelular de pele, mucosas, esôfago, pulmão, colo uterino'],
    armadilhas: ['Hiperplasia pseudoepiteliomatosa (em volta de úlceras, infecções fúngicas, tumor de células granulares) imita invasão, mas sem atipia significativa.'],
  },
  {
    id: 'carcinoma-in-situ-comedo',
    nome: 'Carcinoma ductal in situ com comedonecrose',
    sinonimos: ['CDIS', 'carcinoma intraductal', 'comedocarcinoma', 'comedonecrose'],
    categoria: 'neoplasia',
    resumo:
      'Ducto mamário distendido e preenchido por células malignas, ainda contidas pela membrana basal e pela camada de células mioepiteliais, com necrose no centro (comedonecrose).',
    comoReconhecer: [
      'No médio aumento: estruturas redondas e bem delimitadas (o contorno do ducto preservado), cheias de células atípicas, com um tampão central de necrose eosinofílica.',
      'Ao redor, contorno liso e ininterrupto — diferente dos ninhos invasivos, irregulares e angulosos.',
      'A imuno-histoquímica (p63, calponina) mostra as células mioepiteliais em volta: prova de que é in situ.',
    ],
    mecanismo: [
      'Células ductais neoplásicas proliferam dentro do ducto; as do centro ficam longe dos vasos do estroma e morrem por hipóxia — necrose central, que pode calcificar.',
    ],
    significado: [
      'Precursor do carcinoma invasivo; as microcalcificações da comedonecrose são o que a mamografia detecta.',
      'Não dá metástase enquanto for puramente in situ; o grau nuclear alto e a comedonecrose indicam maior risco de progressão e recidiva.',
    ],
    ondeOcorre: ['Mama (junto a carcinoma invasivo ou isolado)'],
    armadilhas: [
      'Hiperplasia ductal usual também preenche ductos, mas com células heterogêneas, núcleos sobrepostos e luzes periféricas em fenda, sem necrose.',
      'Cancerização lobular (CDIS estendido a lóbulos) pode imitar invasão.',
    ],
  },
  {
    id: 'displasia-escamosa-espessura-total',
    nome: 'Displasia escamosa de espessura total (NIC 3 / HSIL)',
    sinonimos: ['NIC 3', 'CIN 3', 'lesão intraepitelial escamosa de alto grau', 'HSIL', 'carcinoma in situ escamoso'],
    categoria: 'neoplasia',
    resumo:
      'Epitélio escamoso em que células imaturas, de núcleo grande e hipercromático, ocupam toda a espessura, sem maturação para a superfície — mas com a membrana basal intacta.',
    comoReconhecer: [
      'No pequeno aumento: o epitélio fica escuro (roxo) de baixo a cima, contrastando com o epitélio normal, que clareia na superfície.',
      'No grande aumento: núcleos aumentados, hipercromáticos e desorganizados até a camada superficial; relação núcleo/citoplasma alta; mitoses acima da camada basal.',
      'Graduação: NIC 1 — atipia no terço inferior; NIC 2 — até dois terços; NIC 3 — toda a espessura.',
      'A borda inferior é lisa: sem ninhos nem células soltas no estroma.',
    ],
    mecanismo: [
      'Infecção persistente por HPV de alto risco (16, 18) na zona de transformação.',
      'As oncoproteínas E6 e E7 inativam p53 e Rb: as células não param o ciclo celular nem amadurecem.',
      'Com o tempo, a integração do DNA viral e mutações adicionais permitem romper a membrana basal (carcinoma invasivo).',
    ],
    significado: [
      'Lesão precursora do carcinoma escamoso do colo uterino — detectada pelo rastreamento (Papanicolau, teste de HPV) e tratada por excisão (cirurgia de alta frequência/conização).',
      'A imuno-histoquímica p16 difusa ("em bloco") confirma a lesão associada ao HPV de alto risco.',
    ],
    ondeOcorre: ['Colo uterino', 'Vulva (NIV), vagina (NIVA), ânus (NIA), orofaringe'],
    armadilhas: [
      'Metaplasia escamosa imatura e atrofia pós-menopausa também parecem "escuras", mas têm núcleos uniformes, sem pleomorfismo, e p16 negativo ou em mosaico.',
      'Extensão da NIC para dentro das glândulas endocervicais NÃO é invasão: os ninhos mantêm contorno liso e arredondado.',
    ],
  },
  {
    id: 'extensao-glandular-da-nic',
    nome: 'Extensão da displasia às glândulas endocervicais',
    sinonimos: ['envolvimento glandular', 'NIC com extensão glandular'],
    categoria: 'arquitetura',
    resumo:
      'Epitélio displásico que substitui o revestimento das criptas endocervicais, formando ilhas arredondadas de contorno liso sob a superfície — imita invasão, mas não é.',
    comoReconhecer: [
      'Blocos arredondados de epitélio escamoso displásico no estroma, com borda lisa e às vezes restos de epitélio colunar mucinoso na periferia ou na luz.',
      'Estão na mesma profundidade das glândulas endocervicais vizinhas.',
    ],
    mecanismo: ['A displasia avança pela superfície e desce pelas criptas, que fazem parte da zona de transformação.'],
    significado: [
      'Não muda o grau nem significa invasão, mas exige que a excisão tenha profundidade suficiente para incluir as criptas.',
    ],
    ondeOcorre: ['NIC 2 e 3 do colo uterino'],
    armadilhas: ['A invasão verdadeira forma línguas irregulares, com células de citoplasma eosinofílico ("maturação paradoxal") e reação estromal.'],
  },
  {
    id: 'celula-de-reed-sternberg',
    nome: 'Célula de Reed-Sternberg e suas variantes (lacunar, mononuclear)',
    sinonimos: ['célula de Reed-Sternberg', 'célula RS', 'célula de Hodgkin', 'célula lacunar', 'célula HRS'],
    categoria: 'neoplasia',
    resumo:
      'A célula tumoral do linfoma de Hodgkin clássico: grande, com núcleo bilobado ou multilobado e nucléolos eosinofílicos enormes ("olhos de coruja"); na esclerose nodular aparece como célula lacunar, com o citoplasma retraído deixando um halo claro.',
    comoReconhecer: [
      'Reed-Sternberg clássica: célula de 20–50 µm, dois núcleos (ou lobos) em espelho, cada um com um nucléolo grande, eosinofílico, do tamanho de um linfócito.',
      'Célula de Hodgkin (mononuclear): um núcleo grande com nucléolo proeminente.',
      'Célula lacunar (esclerose nodular): núcleo lobulado com nucléolos menores, dentro de um espaço claro — o citoplasma se retrai com a fixação em formol.',
      'Minoria (1–10 %) das células: o resto é o fundo reativo de linfócitos, eosinófilos, histiócitos e plasmócitos.',
      'Imuno-histoquímica: CD30+ e CD15+ (membrana e Golgi), CD45− e CD20 fraco ou negativo; PAX5 fraco.',
    ],
    mecanismo: [
      'Origina-se de células B do centro germinativo que perderam o programa de célula B e deveriam ter morrido por apoptose.',
      'Ativação constitutiva de NF-κB (às vezes pelo vírus Epstein-Barr, LMP1) e amplificação de 9p24 (PD-L1) mantêm a célula viva e escondida do sistema imune.',
      'As células RS secretam citocinas (IL-5, IL-13, CCL17) que atraem o fundo reativo e fibroblastos — daí a pouca proporção de células tumorais e a fibrose.',
    ],
    significado: [
      'Encontrar células RS no fundo inflamatório adequado define o linfoma de Hodgkin clássico.',
      'A expressão de PD-L1 explica a resposta excepcional aos anti-PD-1 nos casos refratários.',
    ],
    ondeOcorre: ['Linfoma de Hodgkin clássico (esclerose nodular, celularidade mista, rico em linfócitos, depleção linfocitária)'],
    armadilhas: [
      'Células semelhantes a RS aparecem em mononucleose infecciosa, linfomas não Hodgkin (anaplásico de grandes células, DLBCL) e alguns carcinomas: sempre confirmar com imuno-histoquímica.',
      'Imunoblastos reativos são grandes, mas têm um nucléolo único e central e são CD15−.',
    ],
  },
  {
    id: 'faixas-de-esclerose-colagena',
    nome: 'Faixas de colágeno que dividem o linfonodo em nódulos',
    sinonimos: ['esclerose nodular', 'bandas fibrosas', 'septos colágenos'],
    categoria: 'reparo',
    resumo:
      'Faixas largas de colágeno birrefringente, pouco celular, que partem da cápsula espessada e dividem o linfonodo em nódulos arredondados — marca do subtipo esclerose nodular.',
    comoReconhecer: [
      'No pequeno aumento: o linfonodo parece "gomos" roxos separados por faixas rosa-pálidas, e a cápsula está espessa.',
      'No médio aumento: colágeno denso e acelular, diferente das trabéculas finas do linfonodo normal.',
    ],
    mecanismo: ['Citocinas das células de Reed-Sternberg (TGF-β, FGF) ativam fibroblastos, que depositam colágeno em faixas.'],
    significado: [
      'Define o subtipo esclerose nodular, o mais comum (60–80 %), típico de adolescentes e adultos jovens, muitas vezes com massa mediastinal.',
    ],
    ondeOcorre: ['Linfoma de Hodgkin clássico, esclerose nodular'],
    armadilhas: ['Linfonodos com fibrose por outras causas (pós-tratamento, fibrose de hilo) não têm os nódulos com células lacunares.'],
  },
  {
    id: 'celulas-claras-neoplasicas',
    nome: 'Células neoplásicas de citoplasma claro',
    sinonimos: ['células claras', 'citoplasma opticamente vazio', 'clear cells'],
    categoria: 'neoplasia',
    resumo:
      'Células tumorais poligonais cujo citoplasma parece vazio ("água") porque o glicogênio e os lipídios que o enchiam foram dissolvidos no processamento; a membrana celular fica nítida, como uma parede fina.',
    comoReconhecer: [
      'No médio aumento: ninhos e ácinos de células pálidas, quase brancas, com membranas bem desenhadas — lembram células vegetais.',
      'No grande aumento: núcleo redondo, central, pequeno a médio; avalie o nucléolo (base da graduação ISUP/OMS).',
    ],
    mecanismo: [
      'No carcinoma renal de células claras, a perda do gene VHL (cromossomo 3p) estabiliza o HIF: a célula passa a agir como se estivesse em hipóxia, acumula glicogênio e lipídios e secreta VEGF.',
      'O álcool e o xilol do processamento dissolvem lipídios e o glicogênio não é corado pela eosina: o citoplasma fica claro.',
    ],
    significado: [
      'Achado central do carcinoma de células renais de células claras, o tipo mais comum de câncer renal (~70 %).',
      'Tumores de células claras de outros órgãos (metástases no pulmão, osso, tireoide, pele) devem sempre lembrar origem renal.',
    ],
    ondeOcorre: ['Carcinoma renal de células claras (primário e metástases)', 'Carcinoma de células claras de ovário e endométrio', 'Adenoma de paratireoide de células claras', 'Hemangioblastoma'],
    armadilhas: [
      'Artefato de retração e adipócitos também parecem vazios; as células claras têm núcleo e formam ninhos epiteliais.',
      'Células claras aparecem focalmente em outros tumores renais (papilífero, cromófobo): o diagnóstico depende do conjunto.',
    ],
  },
  {
    id: 'rede-capilar-delicada',
    nome: 'Rede capilar delicada ("tela de galinheiro")',
    sinonimos: ['vascularização sinusoidal', 'padrão em tela de galinheiro', 'chicken-wire', 'estroma vascular fino'],
    categoria: 'arquitetura',
    resumo:
      'Capilares finos e ramificados, com hemácias, que envolvem cada pequeno ninho de células tumorais — o tumor é dividido em compartimentos por uma malha vascular.',
    comoReconhecer: [
      'Linhas finas cor-de-rosa com hemácias contornando grupos de 5–20 células claras.',
      'Frequentemente com hemorragia recente e antiga (hemossiderina) no meio do tumor.',
    ],
    mecanismo: ['O HIF ativo (perda de VHL) faz as células secretarem VEGF, que induz angiogênese intensa.'],
    significado: [
      'Junto com as células claras, fecha o padrão do carcinoma renal de células claras.',
      'Explica por que o tumor é muito vascular, sangra, forma cistos hemorrágicos e responde a antiangiogênicos (inibidores de VEGF).',
    ],
    ondeOcorre: ['Carcinoma renal de células claras', 'Hemangioblastoma', 'Paraganglioma (padrão Zellballen)'],
    armadilhas: ['Tecido glandular normal também tem capilares; o padrão é diagnóstico quando envolve ninhos de células neoplásicas.'],
  },
  {
    id: 'pseudocapsula-fibrosa',
    nome: 'Pseudocápsula fibrosa',
    sinonimos: ['cápsula tumoral', 'pseudocápsula'],
    categoria: 'arquitetura',
    resumo:
      'Faixa de colágeno que separa um tumor expansivo do órgão ao redor, formada em parte pelo tecido normal comprimido e fibrosado.',
    comoReconhecer: [
      'No pequeno aumento: uma linha rosa de fibrose entre o tumor e o parênquima normal (túbulos e glomérulos no rim, hepatócitos no fígado).',
      'Avalie se o tumor atravessa a cápsula (invasão) — importante para o estadiamento.',
    ],
    mecanismo: ['O tumor cresce empurrando o tecido vizinho; o parênquima comprimido atrofia e é substituído por fibrose, reforçada por reação do estroma.'],
    significado: [
      'Indica crescimento expansivo. Não significa benignidade: carcinomas renais e hepatocelulares costumam ter pseudocápsula.',
      'A invasão da cápsula, da gordura perirrenal ou dos vasos piora o estadiamento.',
    ],
    ondeOcorre: ['Carcinomas de células renais', 'Carcinoma hepatocelular', 'Adenomas (tireoide, hepatocelular)', 'Tumores neuroendócrinos'],
    armadilhas: ['A cápsula normal do órgão (cápsula renal, de Glisson) é outra estrutura: a pseudocápsula fica entre tumor e parênquima.'],
  },
  {
    id: 'papilas-com-eixo-fibrovascular',
    nome: 'Papilas com eixo fibrovascular',
    sinonimos: ['arquitetura papilífera', 'padrão tubulopapilífero'],
    categoria: 'arquitetura',
    resumo:
      'Projeções digitiformes revestidas por células neoplásicas, cada uma com um eixo central de tecido conjuntivo e vaso — cortadas transversalmente, parecem círculos com um vaso no meio.',
    comoReconhecer: [
      'No médio aumento: espaços com dedos ou círculos de epitélio flutuando, com um miolo pálido ou vascular.',
      'Nos eixos, procure macrófagos espumosos, hemossiderina e corpos psamomatosos (calcificações lamelares).',
    ],
    mecanismo: ['As células proliferam sobre um arcabouço de vasos e estroma, empurrando-o para a luz e formando dobras ramificadas.'],
    significado: [
      'Define os tumores papilíferos: carcinoma papilífero renal, carcinoma papilífero de tireoide, carcinoma urotelial papilífero, tumores serosos do ovário.',
      'No rim, papilas com macrófagos espumosos nos eixos sugerem carcinoma papilífero (2º tipo mais comum, ~15 %).',
    ],
    ondeOcorre: ['Carcinoma papilífero renal', 'Carcinoma papilífero da tireoide', 'Carcinoma urotelial papilífero', 'Tumores serosos do ovário', 'Mesotelioma'],
    armadilhas: ['Descamação e cortes tangenciais criam pseudopapilas sem eixo conjuntivo.'],
  },
  {
    id: 'membranas-celulares-vegetais',
    nome: 'Membranas celulares nítidas ("células vegetais") com halo perinuclear',
    sinonimos: ['plant-like cells', 'halo perinuclear', 'núcleos em uva-passa', 'raisinoid nuclei'],
    categoria: 'neoplasia',
    resumo:
      'Células grandes e poligonais, de citoplasma pálido ou rosa finamente reticulado, com a membrana celular espessa e muito evidente, núcleos enrugados ("uva-passa"), halos claros ao redor do núcleo e células binucleadas.',
    comoReconhecer: [
      'No médio aumento: lençóis de células com contornos muito marcados, como um mosaico de azulejos.',
      'No grande aumento: núcleo de contorno irregular, enrugado, com halo claro em volta; células com dois núcleos.',
    ],
    mecanismo: ['O citoplasma é cheio de microvesículas (derivadas de mitocôndrias defeituosas), que o deixam pálido e reticulado e empurram o conteúdo para a periferia.'],
    significado: [
      'Aparência típica do carcinoma renal cromófobo (~5 % dos tumores renais), de prognóstico melhor que o de células claras.',
      'Diferencial principal: oncocitoma (benigno), que tem células de citoplasma rosa granular e núcleos redondos e regulares; o ferro coloidal de Hale cora difusamente o cromófobo.',
    ],
    ondeOcorre: ['Carcinoma renal cromófobo', 'Tumores oncocíticos híbridos (síndrome de Birt-Hogg-Dubé)'],
    armadilhas: ['Halos perinucleares também surgem como artefato de fixação em muitos tecidos; valorize junto com núcleos enrugados e membranas nítidas.'],
  },
  {
    id: 'vasos-de-parede-espessa-dismorficos',
    nome: 'Vasos de parede espessa, sem lâmina elástica organizada',
    sinonimos: ['vasos dismórficos', 'vasos hialinizados anômalos'],
    categoria: 'arquitetura',
    resumo:
      'Vasos sanguíneos anormais, de parede muscular grossa e desorganizada, dos quais o músculo liso parece "descascar" para o estroma ao redor.',
    comoReconhecer: [
      'No pequeno aumento: muitos vasos de paredes grossas e rosadas, espalhados dentro do tumor.',
      'No grande aumento: feixes de células musculares lisas saindo da parede do vaso em direção ao tumor (padrão radial).',
    ],
    mecanismo: ['No angiomiolipoma, a célula neoplásica (célula epitelioide perivascular, família PEComa) nasce ao redor dos vasos e se diferencia em músculo liso e gordura.'],
    significado: [
      'Um dos três componentes do angiomiolipoma (vasos dismórficos, músculo liso e gordura).',
      'Esses vasos sem elástica formam aneurismas e explicam o sangramento retroperitoneal (síndrome de Wunderlich) em tumores > 4 cm.',
    ],
    ondeOcorre: ['Angiomiolipoma renal e hepático', 'Outros PEComas', 'Malformações vasculares'],
    armadilhas: ['Artérias normais do hilo renal também têm parede grossa, mas com camadas organizadas e lâmina elástica.'],
  },
  {
    id: 'tecido-adiposo-no-tumor',
    nome: 'Adipócitos maduros dentro do tumor',
    sinonimos: ['componente lipomatoso', 'gordura intratumoral'],
    categoria: 'neoplasia',
    resumo:
      'Células de gordura maduras, grandes e vazias, misturadas às células tumorais — no angiomiolipoma, fazem parte do próprio tumor.',
    comoReconhecer: ['Vacúolos redondos grandes e vazios, com núcleo achatado na periferia, em grupos dentro da massa.'],
    mecanismo: ['A célula perivascular epitelioide neoplásica consegue se diferenciar em adipócito.'],
    significado: [
      'A gordura no tumor aparece na TC com densidade negativa e permite o diagnóstico radiológico do angiomiolipoma sem biópsia.',
      'Associação com esclerose tuberosa (angiomiolipomas múltiplos e bilaterais).',
    ],
    ondeOcorre: ['Angiomiolipoma', 'Lipoma e lipossarcoma', 'Teratoma'],
    armadilhas: ['Gordura do seio renal ou perirrenal aprisionada na borda de um carcinoma não é componente do tumor.'],
  },
  {
    id: 'trabeculas-hepatocelulares-espessas',
    nome: 'Trabéculas espessas de hepatócitos neoplásicos',
    sinonimos: ['padrão trabecular', 'trabéculas com mais de 3 células', 'pseudoácinos', 'padrão pseudoglandular'],
    categoria: 'arquitetura',
    resumo:
      'Células de aspecto hepatocitário organizadas em placas de 3 ou mais células de espessura (no fígado normal as placas têm 1–2 células), separadas por sinusoides e sem espaços-porta; às vezes formam pseudoácinos com bile.',
    comoReconhecer: [
      'No pequeno aumento: nódulo de hepatócitos sem espaços-porta nem veias centrais — a arquitetura lobular desapareceu.',
      'No médio aumento: cordões grossos de células poligonais separados por espaços vasculares finos; pseudoácinos (pequenas luzes redondas entre células).',
      'No grande aumento: núcleos maiores e mais escuros que os dos hepatócitos vizinhos, nucléolos evidentes, relação núcleo/citoplasma alta.',
    ],
    mecanismo: [
      'Hepatócitos com mutações acumuladas (TERT, CTNNB1, TP53) proliferam como clone; perdem a relação com a microcirculação portal e passam a ser nutridos por artérias novas, "não pareadas".',
    ],
    significado: [
      'Critério arquitetural do carcinoma hepatocelular; o reticulina mostra a perda da trama normal.',
      'Na biópsia, separa CHC de nódulo displásico ou de regeneração, cujas placas continuam finas e com espaços-porta.',
    ],
    ondeOcorre: ['Carcinoma hepatocelular', 'Hepatoblastoma (placas finas fetais e embrionárias)'],
    armadilhas: [
      'Regeneração intensa e adenoma hepatocelular podem ter placas de duas células; pesquise artérias isoladas, perda de reticulina e atipia.',
      'Metástases de tumores de células poligonais (rim, adrenal, melanoma) imitam CHC: imuno com HepPar-1, arginase-1 e glipicano-3.',
    ],
  },
  {
    id: 'crescimento-lepidico',
    nome: 'Crescimento lepídico',
    sinonimos: ['padrão lepídico', 'bronquioloalveolar', 'crescimento ao longo dos septos alveolares'],
    categoria: 'arquitetura',
    resumo:
      'Células neoplásicas cúbicas ou colunares revestindo septos alveolares preservados, como uma "tinta" sobre as paredes, sem invadir o estroma — a arquitetura pulmonar continua visível.',
    comoReconhecer: [
      'No pequeno aumento: os alvéolos mantêm o desenho, mas as paredes parecem "contornadas" por uma fileira de núcleos grandes e escuros.',
      'No grande aumento: células atípicas enfileiradas (às vezes em "tachinha") substituindo os pneumócitos; septos finos ou pouco espessados.',
    ],
    mecanismo: ['As células do adenocarcinoma (derivadas de pneumócitos tipo II ou de células de Clara) proliferam usando as paredes alveolares como arcabouço antes de invadir.'],
    significado: [
      'Componente in situ do adenocarcinoma de pulmão: o adenocarcinoma in situ (≤ 3 cm, só lepídico) e o minimamente invasivo têm sobrevida próxima de 100 % após ressecção.',
      'Para o estadiamento, mede-se apenas o componente invasivo.',
    ],
    ondeOcorre: ['Adenocarcinoma de pulmão (in situ, minimamente invasivo, predominante lepídico)', 'Metástases que se espalham pelos alvéolos (pâncreas, cólon)'],
    armadilhas: [
      'Pneumócitos tipo II reativos (pneumonia, dano alveolar) também ficam volumosos; são mais variados, sem transição abrupta e com inflamação.',
      'Em biópsias por agulha, alvéolos colapsados e cortes tangenciais simulam lepídico ou invasão — o padrão só é bem avaliado na peça.',
    ],
  },
  {
    id: 'celulas-pequenas-com-moldagem-nuclear',
    nome: 'Células pequenas com moldagem nuclear',
    sinonimos: ['células em grão de aveia', 'oat cells', 'moldagem nuclear', 'células azuis pequenas'],
    categoria: 'neoplasia',
    resumo:
      'Lençóis de células cerca de 2–3 vezes o tamanho de um linfócito, quase sem citoplasma, com núcleos escuros, redondos a fusiformes, de cromatina fina ("sal e pimenta") e sem nucléolo, que se amoldam uns aos outros.',
    comoReconhecer: [
      'No pequeno aumento: tecido muito azul-escuro, em lençóis ou ninhos, com necrose e esmagamento.',
      'No grande aumento: núcleos encostados e deformados pelo vizinho (moldagem), citoplasma quase invisível, cromatina granular fina, nucléolo ausente, muitas mitoses e apoptoses.',
    ],
    mecanismo: [
      'Carcinoma neuroendócrino de alto grau: perda quase universal de TP53 e RB1, proliferação altíssima (Ki-67 > 70 %).',
      'O núcleo ocupa quase toda a célula e é frágil — por isso as células se amoldam e se esmagam facilmente na biópsia.',
    ],
    significado: [
      'Define o carcinoma de pequenas células (~15 % dos cânceres de pulmão), quase exclusivo de fumantes e disseminado ao diagnóstico.',
      'Tratado com quimio-radioterapia (não com cirurgia); muito sensível no início, mas recidiva rapidamente.',
    ],
    ondeOcorre: ['Carcinoma de pequenas células do pulmão', 'Carcinomas neuroendócrinos extrapulmonares (colo uterino, esôfago, bexiga)', 'Carcinoma de células de Merkel'],
    armadilhas: [
      'Linfomas e infiltrados linfoides também são "azuis pequenos" e se esmagam; os linfócitos não se amoldam e são CD45+.',
      'O carcinoide típico tem núcleos semelhantes em cromatina, mas citoplasma evidente, poucas mitoses e sem necrose.',
    ],
  },
  {
    id: 'artefato-de-esmagamento',
    nome: 'Artefato de esmagamento (crush)',
    sinonimos: ['crush artifact', 'esmagamento nuclear', 'estiramento da cromatina'],
    categoria: 'arquitetura',
    resumo:
      'Faixas e borrões azul-escuros de cromatina estirada, sem contorno celular, produzidos pela pinça ou agulha ao retirar a biópsia.',
    comoReconhecer: ['Riscos basofílicos em "fios" ou manchas, sem núcleos individualizados, geralmente nas bordas do fragmento.'],
    mecanismo: ['Células com pouco citoplasma e núcleo frágil (pequenas células, linfócitos) se rompem sob pressão e a cromatina escorre.'],
    significado: [
      'Muito característico do carcinoma de pequenas células em biópsias brônquicas — mas é um artefato: sozinho não fecha o diagnóstico.',
      'Procure áreas preservadas para ver a morfologia e use imuno (TTF-1, sinaptofisina, CD56, Ki-67).',
    ],
    ondeOcorre: ['Carcinoma de pequenas células', 'Linfomas e tecido linfoide', 'Qualquer biópsia com pinça'],
    armadilhas: ['Linfócitos esmagados de um agregado linfoide dão o mesmo aspecto: nunca diagnostique pequenas células apenas em área esmagada.'],
  },
  {
    id: 'ninhos-neuroendocrinos-organoides',
    nome: 'Ninhos e trabéculas neuroendócrinos (padrão organoide)',
    sinonimos: ['padrão organoide', 'cromatina em sal e pimenta', 'padrão trabecular neuroendócrino'],
    categoria: 'neoplasia',
    resumo:
      'Células uniformes, de citoplasma moderado e eosinofílico, e núcleos redondos a ovais com cromatina finamente granular ("sal e pimenta"), organizadas em ninhos, trabéculas ou fitas separados por estroma rico em capilares.',
    comoReconhecer: [
      'No pequeno aumento: tumor bem delimitado, de aspecto uniforme, dividido em ninhos por septos vasculares finos.',
      'No grande aumento: núcleos iguais entre si, cromatina pontilhada, nucléolo discreto; mitoses raras e sem necrose (carcinoide típico).',
    ],
    mecanismo: ['Células neuroendócrinas (de Kulchitsky) produzem e armazenam peptídeos em grânulos; o crescimento lento e a vascularização rica reproduzem o arranjo das glândulas endócrinas.'],
    significado: [
      'Aspecto dos tumores neuroendócrinos bem diferenciados (carcinoides). No pulmão, o carcinoide típico tem < 2 mitoses/2 mm² e sem necrose; o atípico, 2–10 mitoses ou necrose focal.',
      'Confirmação por sinaptofisina, cromogranina e INSM1.',
    ],
    ondeOcorre: ['Carcinoide pulmonar típico e atípico', 'Tumores neuroendócrinos do trato gastrointestinal e do pâncreas', 'Paraganglioma'],
    armadilhas: ['Carcinoide fusocelular periférico pode lembrar tumor mesenquimal; carcinoide com esmagamento na biópsia pode imitar pequenas células — o Ki-67 separa.'],
  },
  {
    id: 'ninhos-melanociticos-juncionais-atipicos',
    nome: 'Ninhos melanocíticos juncionais atípicos',
    sinonimos: ['componente juncional', 'ninhos na junção dermoepidérmica', 'disseminação pagetoide'],
    categoria: 'neoplasia',
    resumo:
      'Grupos de melanócitos grandes e atípicos na junção entre epiderme e derme, de tamanhos e formas irregulares, que se fundem e sobem para as camadas altas da epiderme (disseminação pagetoide).',
    comoReconhecer: [
      'No médio aumento: ninhos de células claras ou pigmentadas encostados na base da epiderme, desiguais e confluentes.',
      'No grande aumento: melanócitos com núcleos grandes, nucléolos evidentes e citoplasma com pigmento fino; células isoladas acima da camada basal.',
    ],
    mecanismo: ['Mutações (BRAF V600E, NRAS, NF1) e perda de supressores (CDKN2A) permitem que os melanócitos proliferem e migrem pela epiderme sem o controle dos queratinócitos.'],
    significado: [
      'Componente in situ (fase de crescimento radial) do melanoma. A disseminação pagetoide e a assimetria dos ninhos separam o melanoma do nevo.',
      'A partir daí o tumor invade a derme (crescimento vertical); a espessura de Breslow mede essa invasão.',
    ],
    ondeOcorre: ['Melanoma extensivo superficial, lentigo maligno, melanoma acral', 'Nevo displásico (atipia leve, sem pagetoide extenso)'],
    armadilhas: ['Nevos de crianças, de pele acral e de Spitz podem ter ninhos grandes e algumas células pagetoides; a avaliação é do conjunto (simetria, maturação, mitoses).'],
  },
  {
    id: 'ausencia-de-maturacao',
    nome: 'Ausência de maturação com mitoses dérmicas',
    sinonimos: ['falta de maturação', 'lençóis dérmicos de melanócitos atípicos', 'mitoses dérmicas'],
    categoria: 'neoplasia',
    resumo:
      'Na derme, as células do melanoma continuam grandes e atípicas até a base da lesão, formam lençóis e expansões e se dividem — ao contrário do nevo, cujas células ficam menores e mais dispersas quanto mais profundas.',
    comoReconhecer: [
      'Compare as células superficiais e profundas: no melanoma são iguais (ou maiores na base); no nevo encolhem e parecem linfócitos ou células de Schwann no fundo.',
      'Procure figuras de mitose na derme, especialmente na metade profunda.',
    ],
    mecanismo: ['A célula maligna não responde aos sinais do estroma que induzem a senescência e a "neurotização" das células névicas.'],
    significado: [
      'Um dos critérios mais confiáveis para diagnosticar melanoma invasivo.',
      'O índice mitótico dérmico entra no laudo e no estadiamento; a espessura de Breslow e a ulceração definem o T.',
    ],
    ondeOcorre: ['Melanoma invasivo (fase de crescimento vertical e nodular)', 'Metástases de melanoma'],
    armadilhas: ['Nevos congênitos e nevos em gestantes podem ter mitoses raras e superficiais; o conjunto dos critérios decide.'],
  },
  {
    id: 'pigmento-melanico',
    nome: 'Pigmento melânico',
    sinonimos: ['melanina', 'melanófagos'],
    categoria: 'deposito',
    resumo:
      'Grânulos marrons finos dentro de melanócitos ou em grânulos grosseiros dentro de macrófagos (melanófagos) na derme.',
    comoReconhecer: ['Pigmento castanho a preto, não refringente, fino e poeirento nas células tumorais ou grosseiro em macrófagos.'],
    mecanismo: ['Os melanócitos sintetizam melanina nos melanossomos; quando células morrem, a melanina é fagocitada por macrófagos.'],
    significado: [
      'Ajuda a reconhecer a origem melanocítica, mas não é obrigatório: há melanomas amelanóticos.',
      'Melanófagos abundantes na derme superficial sugerem regressão.',
    ],
    ondeOcorre: ['Melanoma', 'Nevos', 'Ceratose seborreica pigmentada', 'Carcinoma basocelular pigmentado', 'Incontinência pigmentar pós-inflamatória'],
    armadilhas: ['Hemossiderina é mais dourada e refringente (cora pelo Perls); pigmento de formalina é preto e fora das células.'],
  },
  {
    id: 'pseudocistos-corneos',
    nome: 'Pseudocistos córneos',
    sinonimos: ['cistos córneos', 'horn cysts', 'pseudocistos de queratina'],
    categoria: 'arquitetura',
    resumo:
      'Espaços redondos cheios de queratina lamelar, dentro de uma proliferação epidérmica, que são na verdade invaginações da superfície cortadas transversalmente.',
    comoReconhecer: ['Círculos de queratina em camadas concêntricas ("casca de cebola"), sem atipia nas células ao redor, espalhados pela lesão.'],
    mecanismo: ['A epiderme hiperplásica se dobra; a queratina produzida nas invaginações fica aprisionada e, no corte, parece um cisto.'],
    significado: ['Marca da ceratose seborreica; diferente das pérolas córneas do carcinoma espinocelular, que são queratinização de células atípicas dentro de ninhos invasivos.'],
    ondeOcorre: ['Ceratose seborreica', 'Nevo dérmico papilomatoso', 'Tricoepitelioma'],
    armadilhas: ['Não confunda com pérola córnea: veja se há atipia e invasão ao redor.'],
  },
  {
    id: 'acantose-basaloide-exofitica',
    nome: 'Acantose basaloide exofítica',
    sinonimos: ['proliferação de células basaloides', 'lesão "colada" na pele', 'sinal da linha reta'],
    categoria: 'adaptacao',
    resumo:
      'Espessamento da epiderme por células basaloides pequenas e uniformes que crescem para cima, acima do nível da pele vizinha; a base da lesão fica numa linha reta.',
    comoReconhecer: [
      'No pequeno aumento: lesão elevada, com a base alinhada à epiderme normal vizinha, como se estivesse colada sobre a pele.',
      'No grande aumento: células pequenas, parecidas com as da camada basal, sem atipia, mitoses raras.',
    ],
    mecanismo: ['Mutações ativadoras em FGFR3 e PIK3CA nos queratinócitos: proliferação benigna e clonal.'],
    significado: ['Define a ceratose seborreica, a lesão epidérmica benigna mais comum do idoso. Sinal de Leser-Trélat: surgimento súbito de muitas ceratoses associado a neoplasia interna.'],
    ondeOcorre: ['Ceratose seborreica', 'Acantose nigricans (sem pseudocistos)'],
    armadilhas: ['Carcinoma basocelular também é basaloide, mas invade a derme, tem paliçada periférica, fendas e estroma próprio.'],
  },
  {
    id: 'proliferacao-fusocelular-com-colageno-aprisionado',
    nome: 'Proliferação fusocelular com colágeno aprisionado',
    sinonimos: ['colágeno aprisionado', 'collagen trapping', 'padrão estoriforme'],
    categoria: 'neoplasia',
    resumo:
      'Células fusiformes (fibro-histiocíticas) na derme, em arranjo desordenado, que envolvem feixes de colágeno pré-existente, dando na periferia a imagem de "bolas" de colágeno cercadas por células.',
    comoReconhecer: [
      'No pequeno aumento: área mal delimitada da derme mais celular e rosada, geralmente com a epiderme espessada por cima.',
      'Na periferia: células que se infiltram entre as fibras de colágeno e as isolam.',
      'No grande aumento: núcleos fusiformes, sem atipia importante; às vezes macrófagos espumosos, células gigantes e hemossiderina.',
    ],
    mecanismo: ['Proliferação clonal de fibroblastos/histiócitos da derme, frequentemente após trauma mínimo (picada de inseto, foliculite).'],
    significado: ['Aspecto do dermatofibroma (histiocitoma fibroso benigno). Diferencial principal: dermatofibrossarcoma protuberans.'],
    ondeOcorre: ['Dermatofibroma', 'Dermatofibrossarcoma protuberans (infiltra a gordura em "favo de mel")'],
    armadilhas: ['O dermatofibrossarcoma é mais celular, estoriforme, CD34+ e infiltra o subcutâneo; o dermatofibroma é fator XIIIa+ e CD34−.'],
  },
  {
    id: 'hiperplasia-epidermica-sobrejacente',
    nome: 'Hiperplasia epidérmica sobre lesão dérmica',
    sinonimos: ['indução epidérmica', 'hiperplasia da epiderme sobrejacente'],
    categoria: 'adaptacao',
    resumo:
      'A epiderme acima de uma lesão da derme fica mais grossa, com cristas alongadas e a camada basal mais pigmentada.',
    comoReconhecer: ['Cristas epidérmicas alongadas e de base achatada logo acima da lesão, comparadas com a epiderme nas bordas.'],
    mecanismo: ['Fatores de crescimento produzidos pelas células da lesão dérmica estimulam os queratinócitos e melanócitos.'],
    significado: ['Pista a favor de dermatofibroma; explica por que a lesão é escura na clínica e forma uma "covinha" ao ser pinçada.'],
    ondeOcorre: ['Dermatofibroma', 'Outras lesões dérmicas benignas'],
    armadilhas: ['Às vezes a epiderme induzida lembra carcinoma basocelular superficial; ela não tem atipia nem fendas.'],
  },
  {
    id: 'proliferacao-mesotelial-invasiva',
    nome: 'Proliferação mesotelial maligna invasiva',
    sinonimos: ['mesotelioma epitelioide', 'invasão da gordura pela pleura', 'células mesoteliais atípicas'],
    categoria: 'neoplasia',
    resumo:
      'Células mesoteliais poligonais, de citoplasma eosinofílico e núcleo redondo com nucléolo, formando túbulos, papilas e lençóis que atravessam a pleura e invadem a gordura da parede torácica.',
    comoReconhecer: [
      'No pequeno aumento: pleura espessada por tecido celular que ultrapassa a sua camada e entra na gordura subpleural ou no músculo.',
      'No grande aumento: células cúbicas uniformes, com citoplasma denso, "janelas" entre células vizinhas e atipia muitas vezes discreta.',
    ],
    mecanismo: ['Fibras de asbesto inaladas chegam à pleura, causam inflamação crônica e dano ao DNA; perda de BAP1 e CDKN2A transforma o mesotélio.'],
    significado: [
      'A invasão (da gordura, do músculo ou do pulmão) é o que separa mesotelioma de hiperplasia mesotelial reativa, que pode ser igualmente atípica.',
      'Imuno: calretinina, WT1 e D2-40 positivos; perda de BAP1 ou deleção de CDKN2A confirma malignidade.',
    ],
    ondeOcorre: ['Mesotelioma pleural e peritoneal'],
    armadilhas: ['Hiperplasia mesotelial em pleurites e derrames forma papilas e células atípicas, mas fica na superfície, sem invadir a gordura.'],
  },
  {
    id: 'ninhos-nevicos-com-maturacao',
    nome: 'Ninhos névicos com maturação',
    sinonimos: ['células névicas', 'maturação em profundidade', 'nevo dérmico', 'nevo composto'],
    categoria: 'neoplasia',
    resumo:
      'Ninhos regulares de melanócitos névicos na junção e na derme; quanto mais profundos, menores, mais dispersos e com menos pigmento ficam — lembrando linfócitos e, no fundo, células de Schwann.',
    comoReconhecer: [
      'No pequeno aumento: lesão simétrica, bem delimitada, com ninhos de tamanho semelhante.',
      'No grande aumento: células pequenas e redondas, sem nucléolo evidente, sem mitoses na derme profunda.',
    ],
    mecanismo: ['Mutação ativadora de BRAF (ou NRAS) faz o melanócito proliferar, mas ele entra em senescência (via p16): a lesão para de crescer.'],
    significado: ['Define o nevo melanocítico benigno. A maturação, a simetria e a ausência de mitoses profundas são os principais argumentos contra melanoma.'],
    ondeOcorre: ['Nevo juncional, composto e intradérmico', 'Nevo congênito'],
    armadilhas: ['Nevos traumatizados, de gestantes e de pele acral podem ter atipia e raras mitoses superficiais sem ser melanoma.'],
  },
  {
    id: 'nucleos-de-carcinoma-papilifero',
    nome: 'Núcleos do carcinoma papilífero da tireoide',
    sinonimos: ['núcleos em vidro fosco', 'núcleos de "Orphan Annie"', 'fendas nucleares', 'pseudoinclusões nucleares'],
    categoria: 'neoplasia',
    resumo:
      'Núcleos aumentados, alongados e sobrepostos, com cromatina clara ("vidro fosco"), contorno irregular, fendas longitudinais ("grãos de café") e pseudoinclusões de citoplasma.',
    comoReconhecer: [
      'No médio aumento: epitélio mais escuro e "apinhado" que o dos folículos normais, com núcleos que se sobrepõem.',
      'No grande aumento: núcleos pálidos, vazios no centro, com sulcos e membranas espessas; o nucléolo é pequeno.',
    ],
    mecanismo: ['Mutação BRAF V600E ou rearranjos RET/PTC ativam a via MAPK; a arquitetura nuclear se altera (proteínas da lâmina nuclear).'],
    significado: [
      'O diagnóstico do carcinoma papilífero é feito pelos núcleos, mesmo sem papilas (variante folicular). É o câncer de tireoide mais comum, com ótimo prognóstico.',
      'Os mesmos núcleos são vistos na punção aspirativa (Bethesda VI).',
    ],
    ondeOcorre: ['Carcinoma papilífero da tireoide e suas metástases linfonodais'],
    armadilhas: ['A fixação lenta clareia núcleos da tireoide normal; tireoidite de Hashimoto dá alterações nucleares focais — avalie a lesão como um todo.'],
  },
  {
    id: 'espirais-meningoteliais',
    nome: 'Espirais e lóbulos meningoteliais',
    sinonimos: ['células meningoteliais', 'arranjo em redemoinho', 'whorls'],
    categoria: 'neoplasia',
    resumo:
      'Células com núcleos ovais e uniformes, citoplasma rosado de limites pouco nítidos (sincicial), organizadas em lóbulos e em pequenos redemoinhos concêntricos; às vezes com pseudoinclusões nucleares.',
    comoReconhecer: ['Lóbulos separados por septos finos; no centro de alguns, células enroladas em espiral, que podem calcificar (corpos psamomatosos).'],
    mecanismo: ['Tumor das células aracnoides (capa meningotelial); perda de NF2 (cromossomo 22) na maioria.'],
    significado: ['Aspecto do meningioma meningotelial/transicional, o tumor intracraniano primário mais comum do adulto, geralmente benigno (grau 1 da OMS).'],
    ondeOcorre: ['Meningioma', 'Hiperplasia meningotelial'],
    armadilhas: ['Schwannoma e tumor fibroso solitário podem imitar meningioma fibroso; imuno (EMA, SSTR2) ajuda.'],
  },
  {
    id: 'celulas-germinativas-neoplasicas',
    nome: 'Células germinativas neoplásicas (tipo seminoma)',
    sinonimos: ['células de seminoma', 'células claras grandes com nucléolo'],
    categoria: 'neoplasia',
    resumo:
      'Lençóis de células grandes e uniformes, de citoplasma claro ou pálido (glicogênio), membranas nítidas e núcleo central grande com nucléolo proeminente, separadas por septos finos com linfócitos.',
    comoReconhecer: [
      'No pequeno aumento: tumor homogêneo, que substitui os túbulos seminíferos, dividido em lóbulos por septos fibrosos.',
      'No grande aumento: células "em ovo frito", núcleo com nucléolo evidente; linfócitos e às vezes granulomas nos septos.',
    ],
    mecanismo: ['Originam-se da neoplasia de células germinativas in situ, que por sua vez vem de gonócitos fetais que não amadureceram (isocromossomo 12p).'],
    significado: ['Define o seminoma, o tumor testicular mais comum (homens de 25–45 anos), muito sensível a radioterapia e quimioterapia, com cura acima de 95 %.'],
    ondeOcorre: ['Seminoma testicular', 'Disgerminoma do ovário', 'Germinoma do SNC e do mediastino'],
    armadilhas: ['Linfoma testicular (idosos) também forma lençóis, mas infiltra entre túbulos e é CD45+; o seminoma é OCT3/4 e SALL4 positivo.'],
  },
]
