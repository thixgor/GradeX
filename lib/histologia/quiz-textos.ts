/**
 * Tradução dos quizzes — enunciado, alternativas e devolutiva.
 *
 * ## Por que um dicionário, e não tradução por questão
 *
 * As 388 questões do acervo compartilham apenas 159 enunciados: "Identify the
 * structure indicated by the arrows." sozinho aparece 42 vezes. O mesmo vale
 * para as alternativas, que são majoritariamente nomes de estrutura já
 * traduzidos em `glossario.ts`, e para a devolutiva errada, em que duas
 * variantes de "Incorrect, try again." cobrem 1.501 das 1.539 ocorrências.
 * Traduzir por *texto*, e não por questão, faz cada tradução valer em todas as
 * questões que a usam e mantém tudo num lugar só.
 *
 * ## Ordem de resolução
 *
 * Alternativa: dicionário próprio → `glossario.ts` → `null`. O glossário já
 * cobre 484 dos 889 textos distintos, então repeti-los aqui seria duplicar uma
 * fonte de verdade e deixá-las divergir com o tempo.
 *
 * ## O que é, e o que não é
 *
 * É tradução editorial, escrita à mão, com a terminologia do restante do
 * módulo. **Não passou por revisão biomédica.** Onde não há tradução escrita,
 * a interface mostra o texto original com aviso — nunca uma tradução
 * automática silenciosa, que num quiz produziria alternativa errada.
 */

import type { Quiz } from './esquemas'

/** Devolutiva genérica de erro, responsável por 1.501 das 1.539 ocorrências. */
const ERRO_GENERICO = /^\s*incorrect,\s*try\s*again\.?\s*$/i

/** Prefixo que o acervo usa para marcar a alternativa certa. */
const PREFIXO_CORRETA = /^CORRECT[.:]?\s*/i

export const ENUNCIADOS: Record<string, string> = {
  'classify the cell indicated by the double arrow according to its shape.':
    'Classifique a célula indicada pela seta dupla de acordo com sua forma.',
  'classify the cells indicated by the double arrows according to their shape.':
    'Classifique as células indicadas pelas setas duplas de acordo com sua forma.',
  'classify the epithelium indicated by the arrow.':
    'Classifique o epitélio indicado pela seta.',
  'classify the epithelium indicated by the arrows.':
    'Classifique o epitélio indicado pelas setas.',
  'classify the epithelium indicated by the double arrow.':
    'Classifique o epitélio indicado pela seta dupla.',
  'classify the epithelium indicated by the double arrows.':
    'Classifique o epitélio indicado pelas setas duplas.',
  'classify the gland indicated by the rectangle according to its structure.':
    'Classifique a glândula indicada pelo retângulo de acordo com sua estrutura.',
  'classify the gland seen in this image.': 'Classifique a glândula vista nesta imagem.',
  'classify the gland that fills the field according to its structure.':
    'Classifique a glândula que preenche o campo de acordo com sua estrutura.',
  'classify the glands indicated by the rectangles according to their shape.':
    'Classifique as glândulas indicadas pelos retângulos de acordo com sua forma.',
  'classify the glands outlined in this image according to their structure.':
    'Classifique as glândulas contornadas nesta imagem de acordo com sua estrutura.',
  'classify the tissue identified by the arrows':
    'Classifique o tecido identificado pelas setas.',
  'classify the tissue indicated by the "x"s.':
    'Classifique o tecido indicado pelos "X".',
  'classify the tissue indicated by the arrow.': 'Classifique o tecido indicado pela seta.',
  'classify the tissue indicated by the arrows.':
    'Classifique o tecido indicado pelas setas.',
  'classify the tissue indicated by the double arrow.':
    'Classifique o tecido indicado pela seta dupla.',
  'classify the tissue shown in these images':
    'Classifique o tecido mostrado nestas imagens.',
  'classify the tissue shown in this image.': 'Classifique o tecido mostrado nesta imagem.',
  'classify the tissue that fills the field': 'Classifique o tecido que preenche o campo.',
  'classify the tissue that fills the field.': 'Classifique o tecido que preenche o campo.',
  // O acervo grafa "tisue"; a tradução corrige.
  'classify the tisue that fills the field.': 'Classifique o tecido que preenche o campo.',
  'classify the vessel indicated by the square.':
    'Classifique o vaso indicado pelo quadrado.',
  'classify the vessel that fills the field.': 'Classifique o vaso que preenche o campo.',
  'classify the vessel, seen here in cross section, that fills the field.':
    'Classifique o vaso, visto aqui em corte transversal, que preenche o campo.',
  'identify the aggregate of lymphoid tissue that fills the field.':
    'Identifique o agregado de tecido linfoide que preenche o campo.',
  'identify the cell indicated by double arrow.':
    'Identifique a célula indicada pela seta dupla.',
  'identify the cell indicated by the arrows.': 'Identifique a célula indicada pelas setas.',
  'identify the cell indicated by the double arrow.':
    'Identifique a célula indicada pela seta dupla.',
  'identify the cell indicated the arrows.': 'Identifique a célula indicada pelas setas.',
  'identify the cell type whose nuclei are indicated by the arrows.':
    'Identifique o tipo celular cujos núcleos estão indicados pelas setas.',
  'identify the cell whose nucleus is indicated by the double arrow.':
    'Identifique a célula cujo núcleo está indicado pela seta dupla.',
  'identify the cells at the tips of the arrows.':
    'Identifique as células nas pontas das setas.',
  'identify the cells indicated by the arrows in these images .':
    'Identifique as células indicadas pelas setas nestas imagens.',
  'identify the cells indicated by the arrows.':
    'Identifique as células indicadas pelas setas.',
  'identify the cells indicated by the double arrows.':
    'Identifique as células indicadas pelas setas duplas.',
  'identify the cells indicated by the oval.': 'Identifique as células indicadas pela elipse.',
  'identify the cells shown in these images': 'Identifique as células mostradas nestas imagens.',
  'identify the cells shown in these images.':
    'Identifique as células mostradas nestas imagens.',
  'identify the cells shown in this image.': 'Identifique as células mostradas nesta imagem.',
  'identify the cells whose nuclei are indicated by the arrows.':
    'Identifique as células cujos núcleos estão indicados pelas setas.',
  'identify the clear-staining layer indicated by the arrows.':
    'Identifique a camada de coloração clara indicada pelas setas.',
  'identify the cytoskeletal element seen in these images.':
    'Identifique o elemento do citoesqueleto visto nestas imagens.',
  'identify the cytoskeletal elements indicated by the arrows.':
    'Identifique os elementos do citoesqueleto indicados pelas setas.',
  'identify the encircled structures in this image.':
    'Identifique as estruturas circuladas nesta imagem.',
  'identify the entire structure shown in the right half of the image.':
    'Identifique a estrutura inteira mostrada na metade direita da imagem.',
  'identify the epiphyseal zone enclosed by the outline.':
    'Identifique a zona epifisária delimitada pelo contorno.',
  'identify the epiphyseal zone that fills the outline.':
    'Identifique a zona epifisária que preenche o contorno.',
  'identify the layer at the tip of the arrows.':
    'Identifique a camada na ponta das setas.',
  'identify the layer at the tips of the arrows.':
    'Identifique a camada nas pontas das setas.',
  'identify the layer indicated by the arrows.': 'Identifique a camada indicada pelas setas.',
  'identify the layer indicated by the black arrows.':
    'Identifique a camada indicada pelas setas pretas.',
  'identify the layer indicated by the double arrow in this longitudinal section.':
    'Identifique a camada indicada pela seta dupla neste corte longitudinal.',
  'identify the layer indicated by the double arrow.':
    'Identifique a camada indicada pela seta dupla.',
  'identify the layer indicated by the double arrows.':
    'Identifique a camada indicada pelas setas duplas.',
  'identify the layer indicated by the rectangle in the image on the right.':
    'Identifique a camada indicada pelo retângulo na imagem à direita.',
  'identify the layer indicated by the rectangle.':
    'Identifique a camada indicada pelo retângulo.',
  'identify the layer indicated in these images.':
    'Identifique a camada indicada nestas imagens.',
  'identify the layer of cells indicated by the arrows.':
    'Identifique a camada de células indicada pelas setas.',
  'identify the layers indicated by the arrows.':
    'Identifique as camadas indicadas pelas setas.',
  'identify the material indicated by the double arrow.':
    'Identifique o material indicado pela seta dupla.',
  'identify the organ indicated by the double arrow.':
    'Identifique o órgão indicado pela seta dupla.',
  'identify the organ shown in these images.': 'Identifique o órgão mostrado nestas imagens.',
  'identify the organ subdivision that fills the field.':
    'Identifique a subdivisão do órgão que preenche o campo.',
  // O acervo grafa "than fills"; a tradução corrige.
  'identify the organ than fills the field.': 'Identifique o órgão que preenche o campo.',
  'identify the organ that fills the field.': 'Identifique o órgão que preenche o campo.',
  'identify the outlined structure in this image.':
    'Identifique a estrutura contornada nesta imagem.',
  'identify the outlined structures in this image.':
    'Identifique as estruturas contornadas nesta imagem.',
  'identify the passage enclosed by the rectangle.':
    'Identifique a via delimitada pelo retângulo.',
  'identify the passage in whose lumen the "x" is located.':
    'Identifique a via em cuja luz está o "X".',
  'identify the passage indicated by the "x."': 'Identifique a via indicada pelo "X".',
  'identify the passageway enclosed by the outline.':
    'Identifique a via delimitada pelo contorno.',
  'identify the region indicated by the double arrow.':
    'Identifique a região indicada pela seta dupla.',
  'identify the region indicated by the double arrows.':
    'Identifique a região indicada pelas setas duplas.',
  'identify the region indicated by the rectangle.':
    'Identifique a região indicada pelo retângulo.',
  'identify the region of the digestive tract that fills the field.':
    'Identifique a região do tubo digestório que preenche o campo.',
  'identify the region of the specific renal subdivision indicated by the double arrow.':
    'Identifique a região da subdivisão renal indicada pela seta dupla.',
  'identify the region outlined in this image.':
    'Identifique a região contornada nesta imagem.',
  'identify the region that fills the field.': 'Identifique a região que preenche o campo.',
  'identify the regions indicated by the arrows.':
    'Identifique as regiões indicadas pelas setas.',
  'identify the space around the tips of the arrows.':
    'Identifique o espaço ao redor das pontas das setas.',
  'identify the space indicated by the double arrow.':
    'Identifique o espaço indicado pela seta dupla.',
  'identify the space indicated by the double arrows.':
    'Identifique o espaço indicado pelas setas duplas.',
  'identify the specific layer indicated by the arrows':
    'Identifique a camada específica indicada pelas setas.',
  'identify the specific layer indicated by the double arrows.':
    'Identifique a camada específica indicada pelas setas duplas.',
  'identify the specific region of the organ indicated by the double arrow.':
    'Identifique a região específica do órgão indicada pela seta dupla.',
  'identify the specific region of the organ that fills the field.':
    'Identifique a região específica do órgão que preenche o campo.',
  'identify the specific stage indicated by the arrows.':
    'Identifique o estágio específico indicado pelas setas.',
  'identify the specific stage indicated by the oval.':
    'Identifique o estágio específico indicado pela elipse.',
  'identify the specific structure indicated by the arrows.':
    'Identifique a estrutura específica indicada pelas setas.',
  'identify the specific subdivision indicated by the double arrow.':
    'Identifique a subdivisão específica indicada pela seta dupla.',
  'identify the structure enclosed by the rectangle.':
    'Identifique a estrutura delimitada pelo retângulo.',
  'identify the structure in which the "x" is located.':
    'Identifique a estrutura em que está o "X".',
  'identify the structure in whose lumen the arrow is located.':
    'Identifique a estrutura em cuja luz está a seta.',
  'identify the structure indicated by an "x."':
    'Identifique a estrutura indicada por um "X".',
  'identify the structure indicated by arrows':
    'Identifique a estrutura indicada pelas setas.',
  'identify the structure indicated by arrows.':
    'Identifique a estrutura indicada pelas setas.',
  'identify the structure indicated by the "x\'s".':
    'Identifique a estrutura indicada pelos "X".',
  'identify the structure indicated by the "x."': 'Identifique a estrutura indicada pelo "X".',
  'identify the structure indicated by the arrow.':
    'Identifique a estrutura indicada pela seta.',
  'identify the structure indicated by the arrows':
    'Identifique a estrutura indicada pelas setas.',
  'identify the structure indicated by the arrows.':
    'Identifique a estrutura indicada pelas setas.',
  'identify the structure indicated by the bars.':
    'Identifique a estrutura indicada pelas barras.',
  'identify the structure indicated by the blue rectangles.':
    'Identifique a estrutura indicada pelos retângulos azuis.',
  'identify the structure indicated by the circle.':
    'Identifique a estrutura indicada pelo círculo.',
  'identify the structure indicated by the double arrow.':
    'Identifique a estrutura indicada pela seta dupla.',
  'identify the structure indicated by the double arrows.':
    'Identifique a estrutura indicada pelas setas duplas.',
  'identify the structure indicated by the oval.':
    'Identifique a estrutura indicada pela elipse.',
  'identify the structure indicated by the rectangle.':
    'Identifique a estrutura indicada pelo retângulo.',
  'identify the structure indicated by the two pairs of arrows.':
    'Identifique a estrutura indicada pelos dois pares de setas.',
  'identify the structure indicated in this image.':
    'Identifique a estrutura indicada nesta imagem.',
  'identify the structure outlined by the oval.':
    'Identifique a estrutura contornada pela elipse.',
  'identify the structure outlined by the rectangle.':
    'Identifique a estrutura contornada pelo retângulo.',
  'identify the structure outlined in the image on the right.':
    'Identifique a estrutura contornada na imagem à direita.',
  'identify the structure outlined in this electron micrograph?':
    'Identifique a estrutura contornada nesta eletromicrografia.',
  'identify the structure outlined in this image.':
    'Identifique a estrutura contornada nesta imagem.',
  'identify the structure shown in this image.':
    'Identifique a estrutura mostrada nesta imagem.',
  'identify the structure that fills the field.':
    'Identifique a estrutura que preenche o campo.',
  'identify the structure(s) indicated by the arrows.':
    'Identifique a estrutura (ou estruturas) indicada pelas setas.',
  'identify the structures at the tips of the arrows.':
    'Identifique as estruturas nas pontas das setas.',
  'identify the structures circled in this image.':
    'Identifique as estruturas circuladas nesta imagem.',
  'identify the structures identified by the arrows.':
    'Identifique as estruturas assinaladas pelas setas.',
  'identify the structures indicated by arrows':
    'Identifique as estruturas indicadas pelas setas.',
  'identify the structures indicated by arrows.':
    'Identifique as estruturas indicadas pelas setas.',
  'identify the structures indicated by the x\'s.':
    'Identifique as estruturas indicadas pelos "X".',
  'identify the structures indicated by the arrows':
    'Identifique as estruturas indicadas pelas setas.',
  'identify the structures indicated by the arrows in the electron micrograph.':
    'Identifique as estruturas indicadas pelas setas na eletromicrografia.',
  'identify the structures indicated by the arrows.':
    'Identifique as estruturas indicadas pelas setas.',
  'identify the structures indicated by the double arrow.':
    'Identifique as estruturas indicadas pela seta dupla.',
  'identify the structures indicated by the double arrows.':
    'Identifique as estruturas indicadas pelas setas duplas.',
  'identify the structures indicated by the ovals.':
    'Identifique as estruturas indicadas pelas elipses.',
  'identify the structures indicated by the rectangles.':
    'Identifique as estruturas indicadas pelos retângulos.',
  'identify the structures indicated in these images.':
    'Identifique as estruturas indicadas nestas imagens.',
  'identify the structures outlined in this image.':
    'Identifique as estruturas contornadas nesta imagem.',
  // O acervo grafa "strucure"; a tradução corrige.
  'identify the strucure indicated by the arrow.':
    'Identifique a estrutura indicada pela seta.',
  'identify the tissue indicated by the arrow.': 'Identifique o tecido indicado pela seta.',
  'identify the tissue outlined in these images.':
    'Identifique o tecido contornado nestas imagens.',
  'identify the tubular structures shown in these images.':
    'Identifique as estruturas tubulares mostradas nestas imagens.',
  'identify the type of neuron located in the outlined area.':
    'Identifique o tipo de neurônio localizado na área contornada.',
  'identify the type of tissue growth occurring in the cluster of cells included in the oval.':
    'Identifique o tipo de crescimento tecidual que ocorre no agrupamento de células dentro da elipse.',
  'identify the vessels indicated by the arrows in these images.':
    'Identifique os vasos indicados pelas setas nestas imagens.',
  'identify the vessels indicated by the arrows.':
    'Identifique os vasos indicados pelas setas.',
  'identify the vessels indicated by the rectangle.':
    'Identifique os vasos indicados pelo retângulo.',
  'identify the vessels shown in these images.':
    'Identifique os vasos mostrados nestas imagens.',
  'identify the white blood cell in these images.':
    'Identifique o leucócito mostrado nestas imagens.',
  'identify the white blood cells in this image.':
    'Identifique os leucócitos mostrados nesta imagem.',
  'in life what would occupy the hair-like structures at the tips of the arrows?':
    'No organismo vivo, o que ocuparia as estruturas filiformes nas pontas das setas?',
  'increased pressure in the perilymph of the structure in which the "x" is located is relieved by a bulging of the _______.':
    'O aumento de pressão na perilinfa da estrutura em que está o "X" é aliviado pelo abaulamento do(a) _______.',
  'name the mode of secretion of the cells that make up the structure indicated by the double arrow.':
    'Indique o modo de secreção das células que compõem a estrutura assinalada pela seta dupla.',
  'name the protein that composes the structures indicated by the arrows.':
    'Indique a proteína que compõe as estruturas assinaladas pelas setas.',
  'the cells indicated by the arrows are examples of:':
    'As células indicadas pelas setas são exemplos de:',
  'what is the function of the cell at the tip of the arrow?':
    'Qual é a função da célula na ponta da seta?',
  'what is the function of the cell at the tips of the arrows?':
    'Qual é a função das células nas pontas das setas?',
  'what is the specific name for the region in which the "x"s are located?':
    'Qual é o nome específico da região em que estão os "X"?',
  'what is the specific name of the region around the tips of the arrows?':
    'Qual é o nome específico da região ao redor das pontas das setas?',
  'what term best describes the shape of the cells indicated by the double arrows?':
    'Que termo melhor descreve a forma das células indicadas pelas setas duplas?',
  'what term best describes the staining properties of the structure indicated by the arrows?':
    'Que termo melhor descreve as propriedades tintoriais da estrutura indicada pelas setas?',
  'what type of bone formation produced the bone at the tips of the arrows?':
    'Que tipo de formação óssea produziu o osso nas pontas das setas?',
  'what type of growth occurs at this site?': 'Que tipo de crescimento ocorre neste local?',
  'which of the labels is indicating a peripheral nerve?':
    'Qual dos marcadores está apontando um nervo periférico?',
}

/** Textos de alternativa que o glossário de estruturas não cobre. */
export const ALTERNATIVAS: Record<string, string> = {
  'a.': 'A.',
  'b.': 'B.',
  'c.': 'C.',
  'd.': 'D.',
  'acidophilic': 'Acidófilo',
  'actin': 'Actina',
  'actin microfilaments': 'Microfilamentos de actina',
  'active fibroblast': 'Fibroblasto ativo',
  'active fibroblasts': 'Fibroblastos ativos',
  'active osteoblasts': 'Osteoblastos ativos',
  'adipocyte': 'Adipócito',
  'adipose connective tissue': 'Tecido conjuntivo adiposo',
  'adrenal capsule': 'Cápsula da suprarrenal',
  'adrenal cortex': 'Córtex da suprarrenal',
  'adrenal medulla': 'Medula da suprarrenal',
  'adrenal medullla': 'Medula da suprarrenal',
  'afferent arterioles': 'Arteríolas aferentes',
  'afferent lymphatic vessel': 'Vaso linfático aferente',
  'alveolar macrophages': 'Macrófagos alveolares',
  'alveolus': 'Alvéolo',
  'ampulla of semicircular canal': 'Ampola do canal semicircular',
  'ampulla of the oviduct': 'Ampola da tuba uterina',
  'anchoring villi': 'Vilosidades de ancoragem',
  'annulus fibrosis': 'Ânulo fibroso',
  'antral space': 'Espaço antral',
  'aorta': 'Aorta',
  'apocrine': 'Apócrina',
  'appositional': 'Aposicional',
  'appositional growth': 'Crescimento aposicional',
  'arcuate arteries': 'Artérias arqueadas',
  'argyrophilic': 'Argirófilo',
  'astroctyes': 'Astrócitos',
  'astrocyte': 'Astrócito',
  'astrocyte process': 'Prolongamento de astrócito',
  'atretic follicle': 'Folículo atrésico',
  'atretic follicles': 'Folículos atrésicos',
  'atrioventricular valve': 'Valva atrioventricular',
  'axonemes': 'Axonemas',
  'basement membrane of the endothelium': 'Membrana basal do endotélio',
  'bases of hair follicles': 'Bases dos folículos pilosos',
  'basophil': 'Basófilo',
  'basophilic': 'Basófilo',
  'bipolar cell': 'Célula bipolar',
  'bipolar motor neuron': 'Neurônio motor bipolar',
  'bipolar neuron': 'Neurônio bipolar',
  'bipolar neurons': 'Neurônios bipolares',
  'bipolar sensory neuron': 'Neurônio sensitivo bipolar',
  'body of the epididymis': 'Corpo do epidídimo',
  'bone resorption': 'Reabsorção óssea',
  'bowman\'s gland': 'Glândula de Bowman',
  'breast during pregnancy': 'Mama na gravidez',
  'bronchial blood vessel': 'Vaso sanguíneo brônquico',
  'brunner\'s gland': 'Glândula de Brunner',
  'cardiac gland': 'Glândula cárdica',
  'cardiac muscle cell': 'Célula muscular cardíaca',
  'cardiac muscle cells': 'Células musculares cardíacas',
  'cardiac region of the stomach': 'Região cárdica do estômago',
  'cartilage rings': 'Anéis de cartilagem',
  'cavernous space': 'Espaço cavernoso',
  'chondrocyte': 'Condrócito',
  'chromosome': 'Cromossomo',
  'ciliary muscle': 'Músculo ciliar',
  'ciliary process': 'Processo ciliar',
  'clear cells': 'Células claras',
  'collagen fiber': 'Fibra colágena',
  'collagen synthesis': 'Síntese de colágeno',
  'colorectal junction': 'Junção colorretal',
  'compact lamellar bone': 'Osso compacto lamelar',
  'compact woven and lamellar bone': 'Osso compacto primário e lamelar',
  'compact woven bone': 'Osso compacto primário (imaturo)',
  'compound acinar': 'Acinar composta',
  'compound tubular': 'Tubular composta',
  'compound tubulo-acinar': 'Tubuloacinar composta',
  'compound tubulo-alveolar': 'Tubuloalveolar composta',
  'cone': 'Cone',
  'conjuctiva': 'Conjuntiva',
  'conjunctiva': 'Conjuntiva',
  'constrictor pupillae muscle': 'Músculo esfíncter da pupila',
  'continuous capillaries': 'Capilares contínuos',
  'continuous capillary': 'Capilar contínuo',
  'continuous capillary >': 'Capilar contínuo',
  'conus vasculosus': 'Cone vascular',
  'coronal radiata': 'Corona radiata',
  'corpora amylacea': 'Corpos amiláceos',
  'corpus albicans': 'Corpo albicante',
  'corpus cavernosum': 'Corpo cavernoso',
  'corpus luteum': 'Corpo lúteo',
  'cortical sinus': 'Seio cortical',
  'cross striation': 'Estriação transversal',
  'crypt of lieberkuhn': 'Cripta de Lieberkühn',
  'crypts': 'Criptas',
  'cuboidal': 'Cúbica',
  'cystic remnant of rathke\'s pouch': 'Resquício cístico da bolsa de Rathke',
  'dendrite': 'Dendrito',
  'dense, regular connective tissue': 'Tecido conjuntivo denso modelado',
  'dentinal tubule': 'Túbulo dentinário',
  'diffuse lymphatic tissue': 'Tecido linfoide difuso',
  'diffusion': 'Difusão',
  'diplosomes': 'Diplossomos',
  'duct cells': 'Células do ducto',
  'duct of a uterine gland': 'Ducto de glândula uterina',
  'duct of seromucous gland': 'Ducto de glândula seromucosa',
  'ducuts deferens': 'Ducto deferente',
  'efferent duct': 'Dúctulo eferente',
  'efferent lymphatic vessel': 'Vaso linfático eferente',
  'elastic artery': 'Artéria elástica',
  'elastic connective tissue': 'Tecido conjuntivo elástico',
  'elastic fiber': 'Fibra elástica',
  'elastic ligament': 'Ligamento elástico',
  'elastin': 'Elastina',
  'enamel tubules': 'Túbulos do esmalte',
  'endochondral': 'Endocondral',
  'endochondral and appositional': 'Endocondral e aposicional',
  'endochondral growth': 'Crescimento endocondral',
  'endochrondral and interstitial': 'Endocondral e intersticial',
  'endocrine': 'Endócrina',
  'endosteal': 'Endosteal',
  'endosteal layer': 'Camada endosteal',
  'ensheathing schwann cells': 'Células de Schwann envolventes',
  'eosinophilic': 'Eosinófilo (acidófilo)',
  'epididymis': 'Epidídimo',
  'eponychium': 'Eponíquio',
  'false vocal fold': 'Prega vestibular (falsa prega vocal)',
  'fenestrated capillaries': 'Capilares fenestrados',
  'fibrous layer of periosteum': 'Camada fibrosa do periósteo',
  'filiform papilla': 'Papila filiforme',
  'fissures': 'Fissuras',
  'foliate papilla': 'Papila folhada',
  'follicle cell': 'Célula folicular',
  'follicle cells': 'Células foliculares',
  'fornix': 'Fórnice',
  'foveola': 'Fovéola',
  'gall bladder': 'Vesícula biliar',
  'ganglion cell': 'Célula ganglionar',
  'gap junction': 'Junção comunicante',
  'gap junctions': 'Junções comunicantes',
  'gastric gland': 'Glândula gástrica',
  'gastroduodenal junction': 'Junção gastroduodenal',
  'gastroesophageal junction': 'Junção esofagogástrica',
  'gland of littre': 'Glândula de Littré',
  'glycosaminoglycans': 'Glicosaminoglicanos',
  'golgi bodies': 'Complexos de Golgi',
  'golgi body': 'Complexo de Golgi',
  'gonocytes': 'Gonócitos',
  'graafian follicle': 'Folículo de Graaf (maduro)',
  'graafian follicles': 'Folículos de Graaf (maduros)',
  'granulosal cells': 'Células da granulosa',
  'granulosal luteal cells': 'Células granulosa-luteínicas',
  'granulosal lutein cells': 'Células granulosa-luteínicas',
  'hassall\'s corpuscle': 'Corpúsculo de Hassall',
  'head of the epididymis': 'Cabeça do epidídimo',
  'hemidesmosome': 'Hemidesmossomo',
  'hemopoiesis': 'Hemopoese',
  'hepatic sinusoid': 'Sinusoide hepático',
  'hepatic vein': 'Veia hepática',
  'heterchromatin': 'Heterocromatina',
  'high endothelial venule': 'Vênula de endotélio alto',
  'holocrine': 'Holócrina',
  'hydroxyapatite': 'Hidroxiapatita',
  'hyponychium': 'Hiponíquio',
  'immunoblast': 'Imunoblasto',
  'inactive breast': 'Mama em repouso',
  'inactive fibroblast': 'Fibroblasto quiescente',
  'inactive fibroblasts': 'Fibroblastos quiescentes',
  'inactive osteoblasts': 'Osteoblastos inativos',
  'inner circumferential lamella': 'Lamela circunferencial interna',
  'interatrial septum': 'Septo interatrial',
  'intercalated disc': 'Disco intercalar',
  'interlobar arteries': 'Artérias interlobares',
  'interlobular arteries': 'Artérias interlobulares',
  'interstitial': 'Intersticial',
  'interstitial cell of leydig': 'Célula intersticial de Leydig',
  'interstitial growth': 'Crescimento intersticial',
  'interstitial lamella': 'Lamela intersticial',
  'intestinal-colon junction': 'Junção entre intestino delgado e cólon',
  'intramembranous': 'Intramembranosa',
  'intramembranous and appositional': 'Intramembranosa e aposicional',
  'intramembranous and interstitial': 'Intramembranosa e intersticial',
  'intramembranous growth': 'Crescimento intramembranoso',
  'intramural portion of the oviduct': 'Porção intramural da tuba uterina',
  'involuntary muscle': 'Músculo involuntário',
  'ischemic (pre-menstrual) uterus': 'Útero isquêmico (fase pré-menstrual)',
  'ischemic uterus': 'Útero isquêmico',
  'isogenous growth': 'Crescimento por grupos isógenos',
  'keratin': 'Queratina',
  'keratinocytes': 'Queratinócitos',
  'lactating breast': 'Mama em lactação',
  'lactiferous ducts': 'Ductos lactíferos',
  'lactiferous sinuses': 'Seios lactíferos',
  'langerhans cells': 'Células de Langerhans',
  'large vein': 'Veia de grande calibre',
  'large veins': 'Veias de grande calibre',
  'layer of surfactant': 'Camada de surfactante',
  'limbus': 'Limbo',
  'lipid-secreting cells': 'Células secretoras de lipídio',
  'liver': 'Fígado',
  'lobe': 'Lobo',
  'lower esophagus': 'Esôfago distal',
  'lucent': 'Elétron-lucente',
  'luteal cells': 'Células luteínicas',
  'lymph': 'Linfa',
  'lymph node': 'Linfonodo',
  'lymphatic vessel': 'Vaso linfático',
  'lymphoblast': 'Linfoblasto',
  'lymphoblasts': 'Linfoblastos',
  'm band': 'Banda M',
  'm bands': 'Bandas M',
  'macula': 'Mácula',
  'malleus': 'Martelo',
  'matrix maintenance': 'Manutenção da matriz',
  'medullary cord': 'Cordão medular',
  'medullary sinus': 'Seio medular',
  'medullary vein': 'Veia medular',
  'meibomium gland': 'Glândula de Meibômio',
  'meissner\'s corpuscles': 'Corpúsculos de Meissner',
  'membranous septum': 'Septo membranáceo',
  'menstrual uterus': 'Útero na fase menstrual',
  'merocrine': 'Merócrina',
  'mesenchymal cells': 'Células mesenquimais',
  'microglial cells': 'Células da micróglia',
  'microtubule organizing center': 'Centro organizador de microtúbulos',
  'mitotic cells': 'Células em mitose',
  'monocyte': 'Monócito',
  'motor neurons': 'Neurônios motores',
  'mucous acini': 'Ácinos mucosos',
  'mucous connective tissue': 'Tecido conjuntivo mucoso',
  'mucous gland': 'Glândula mucosa',
  'mucus-secreting cells': 'Células secretoras de muco',
  'muller cell': 'Célula de Müller',
  'multipolar motor neuron': 'Neurônio motor multipolar',
  'multipolar sensory neuron': 'Neurônio sensitivo multipolar',
  'muscular arteries': 'Artérias musculares',
  'muscular portion of the interventricular septum': 'Porção muscular do septo interventricular',
  'muscularis mucosa': 'Muscular da mucosa',
  'myoepithelial cells': 'Células mioepiteliais',
  'myofibers': 'Fibras musculares',
  'nail matrix': 'Matriz ungueal',
  'nail plate': 'Placa ungueal',
  'nail root': 'Raiz da unha',
  'nasal concha': 'Concha nasal',
  'neurons of cranial nerve viii': 'Neurônios do nervo craniano VIII',
  'nissl body': 'Corpúsculo de Nissl',
  'non-pigmented retina': 'Retina não pigmentada',
  'nucleolar organizing center': 'Região organizadora do nucléolo',
  'optic disk': 'Disco óptico',
  'optic papilla': 'Papila óptica',
  'orbicular oculi muscle': 'Músculo orbicular do olho',
  'osseous labyrinth': 'Labirinto ósseo',
  'osteoblast': 'Osteoblasto',
  'osteoblast processes': 'Prolongamentos de osteoblasto',
  'osteocyte': 'Osteócito',
  'osteocyte processes': 'Prolongamentos de osteócito',
  'osteogenic layer of periosteum': 'Camada osteogênica do periósteo',
  'otoliths': 'Otólitos (otocônias)',
  'outer circumferential lamella': 'Lamela circunferencial externa',
  'ovary': 'Ovário',
  'oviduct': 'Tuba uterina',
  'oxyphil cell': 'Célula oxífila',
  'oxyphils': 'Células oxífilas',
  'pals': 'Bainha linfoide periarteriolar (PALS)',
  'pacian corpuscle': 'Corpúsculo de Pacini',
  'pancreas': 'Pâncreas',
  'papillary ducts of bellini': 'Ductos papilares de Bellini',
  'papillary layer of the dermis': 'Camada papilar da derme',
  'papillary muscle': 'Músculo papilar',
  'parafollicular cells': 'Células parafoliculares',
  'parathyroid gland': 'Glândula paratireoide',
  'parietal pleura': 'Pleura parietal',
  'parotid gland': 'Glândula parótida',
  'penile urethra': 'Uretra peniana',
  'perichondrium, chondrogenic layer': 'Pericôndrio, camada condrogênica',
  'perichondrium, fibrous layer': 'Pericôndrio, camada fibrosa',
  'perimetrium': 'Perimétrio',
  'periosteum, fibrous layer': 'Periósteo, camada fibrosa',
  'periosteum, osteogenic layer': 'Periósteo, camada osteogênica',
  'phagocytosis of dust particles': 'Fagocitose de partículas inaladas',
  'pituitary gland': 'Hipófise',
  'planum semilunatum': 'Plano semilunar',
  'plica palmatae': 'Pregas palmadas',
  'plicae circularis': 'Pregas circulares',
  'podocyte layer': 'Camada de podócitos',
  'portal canal': 'Espaço porta',
  'postsynaptic cell': 'Célula pós-sináptica',
  'pre-menstrual uterus': 'Útero na fase pré-menstrual',
  'presynaptic terminal': 'Terminal pré-sináptico',
  'primary bronchus': 'Brônquio principal',
  'primary nodule': 'Nódulo linfoide primário',
  'primary, multilaminar follicle': 'Folículo primário multilaminar',
  'primary, multilaminar follicles': 'Folículos primários multilaminares',
  'primary, unilaminar follicle': 'Folículo primário unilaminar',
  'production of surfactant': 'Produção de surfactante',
  'proliferative uterus': 'Útero na fase proliferativa',
  'prostate gland': 'Próstata',
  'pseudostratified': 'Pseudoestratificado',
  'pseudostratified columnar epithelium with cilia': 'Epitélio pseudoestratificado colunar ciliado',
  'pseudounipolar neuron': 'Neurônio pseudounipolar',
  'pseudounipolar sensory neuron': 'Neurônio sensitivo pseudounipolar',
  'rathke\'s pouch': 'Bolsa de Rathke',
  'renal arteries': 'Artérias renais',
  'renal column': 'Coluna renal',
  'renal cortex': 'Córtex renal',
  'renal lobes': 'Lobos renais',
  'renal lobules': 'Lóbulos renais',
  'renal medulla': 'Medula renal',
  'resorbing bone': 'Osso em reabsorção',
  'reticular cell': 'Célula reticular',
  'reticular connective tissue': 'Tecido conjuntivo reticular',
  'reticular epithelial cells': 'Células epiteliorreticulares',
  'reticular layer of the dermis': 'Camada reticular da derme',
  'rod': 'Bastonete',
  'round window': 'Janela redonda',
  'rugae': 'Rugas',
  'sarcomere': 'Sarcômero',
  'satellite schwann cells': 'Células satélites',
  'schwann cell': 'Célula de Schwann',
  'secondary bronchus': 'Brônquio lobar (secundário)',
  'secondary follicle': 'Folículo secundário (antral)',
  'secondary follicles': 'Folículos secundários (antrais)',
  'secondary oocytes': 'Oócitos secundários',
  'secretion of mucus': 'Secreção de muco',
  'secretory alveoli': 'Alvéolos secretores',
  'secretory uterus': 'Útero na fase secretora',
  'semicircular canal': 'Canal semicircular',
  'semicircular duct': 'Ducto semicircular',
  'semilunar valve': 'Valva semilunar',
  'seminal vesicle': 'Vesícula seminal',
  'seminiferous tubule': 'Túbulo seminífero',
  'septal cells': 'Pneumócitos tipo II (células septais)',
  'serous demilune': 'Semilua serosa',
  'serous-secreting cells': 'Células secretoras serosas',
  'sheet glands': 'Glândulas em lâmina',
  'simple branched acinar': 'Acinar simples ramificada',
  'simple branched tubular': 'Tubular simples ramificada',
  'simple columnar': 'Simples colunar',
  'simple cuboidal': 'Simples cúbico',
  'simple squamous': 'Simples pavimentoso',
  'simple tubular': 'Tubular simples',
  'simple, branched tubular': 'Tubular simples ramificada',
  'simple, coiled tubular': 'Tubular simples enovelada',
  'small lymphocytes': 'Linfócitos pequenos',
  'smooth muscle cell': 'Célula muscular lisa',
  'spindle': 'Fusiforme',
  'spines': 'Espinhos (pontes intercelulares)',
  'spiral arteries': 'Artérias espiraladas',
  'spiral artery': 'Artéria espiralada',
  'spiral ganglion': 'Gânglio espiral',
  'splenic sinus': 'Sinusoide esplênico',
  'spongy lamellar bone': 'Osso esponjoso lamelar',
  'spongy woven bone': 'Osso esponjoso primário (imaturo)',
  'squamous': 'Pavimentosa',
  'stellate': 'Estrelada',
  'stem villi': 'Vilosidades-tronco',
  'steroid-secreting cells': 'Células secretoras de esteroides',
  'straight portion of the distal tubules': 'Porção reta dos túbulos distais',
  'straight portions of seminiferous tubules': 'Túbulos retos',
  'stratified columnar': 'Estratificado colunar',
  'stratified cuboidal': 'Estratificado cúbico',
  'stratified squamous dry': 'Estratificado pavimentoso queratinizado',
  'stratified squamous moist >': 'Estratificado pavimentoso não queratinizado',
  'stratified squamous, dry': 'Estratificado pavimentoso queratinizado',
  'stratified squamous, moist': 'Estratificado pavimentoso não queratinizado',
  'striae': 'Estrias',
  'striated muscle': 'Músculo estriado',
  'subendocardial connective tissue': 'Tecido conjuntivo subendocárdico',
  'sublingual gland': 'Glândula sublingual',
  'submandibular gland': 'Glândula submandibular',
  'sweat gland': 'Glândula sudorípara',
  'tenia coli': 'Tênia do cólon',
  'teniae coli': 'Tênias do cólon',
  'testis': 'Testículo',
  'theca interna cells': 'Células da teca interna',
  'theca luteal cells': 'Células teca-luteínicas',
  'thecal cells': 'Células da teca',
  'thyroid follicle': 'Folículo tireoidiano',
  'thyroid gland': 'Glândula tireoide',
  'tonsil': 'Tonsila',
  'trabecular meshwork': 'Rede trabecular',
  'trabecular sinus': 'Seio trabecular',
  'transition vesicles': 'Vesículas de transição',
  'transport of oxygen and carbon dioxide': 'Transporte de oxigênio e gás carbônico',
  'tropocollagen': 'Tropocolágeno',
  'true vocal fold': 'Prega vocal verdadeira',
  'tubular glands': 'Glândulas tubulares',
  'tubulin': 'Tubulina',
  'tunic adventitia': 'Túnica adventícia',
  'tunic intima': 'Túnica íntima',
  'unicellular': 'Unicelular',
  'unipolar neuron': 'Neurônio unipolar',
  'uterine gland': 'Glândula uterina',
  'uterine glands': 'Glândulas uterinas',
  'vermillion border': 'Zona vermelha do lábio (vermelhão)',
  'vestibular division of cranial nerve viii': 'Divisão vestibular do nervo craniano VIII',
  'vestibulocochlear nerve - cn viii': 'Nervo vestibulococlear (NC VIII)',
  'villus': 'Vilosidade',
  'visceral layer of bowman\'s capsule': 'Folheto visceral da cápsula de Bowman',
  'visceral muscle': 'Músculo visceral',
  'vitreous space': 'Câmara vítrea',
  'voluntary muscle': 'Músculo voluntário',
  'woven lamellar bone': 'Osso primário e lamelar',
  'z-line': 'Linha Z',
  'zone of maturation-hypertrophy-calcification': 'Zona de maturação, hipertrofia e calcificação',
  'zonular fiber': 'Fibra zonular',
  'zonule fibers': 'Fibras zonulares',
}

/** Devolutivas da alternativa correta, texto a texto. */
export const FEEDBACKS: Record<string, string> = {}

function normalizar(texto: string): string {
  // O acervo mistura apóstrofo reto e curvo no mesmo termo ("Meissner's" e
  // "Meissner’s"). Unificar aqui evita duas entradas para a mesma estrutura.
  return texto.trim().replace(/\s+/g, ' ').replace(/[‘’]/g, "'").toLowerCase()
}

/** Enunciado em português, ou `null` se ainda não foi escrito. */
export function traduzirEnunciado(original: string): string | null {
  return ENUNCIADOS[normalizar(original)] ?? null
}

/**
 * Texto de alternativa em português.
 *
 * Resolve pelo dicionário próprio e, em seguida, pelo glossário de estruturas —
 * que já traduz a maioria, já que quase toda alternativa é um nome de estrutura.
 */
export function traduzirAlternativa(
  original: string,
  traduzirTermo: (t: string) => string | null,
): string | null {
  const chave = normalizar(original)
  // O glossário faz a própria normalização, mas não unifica apóstrofo curvo —
  // por isso repassamos a chave já normalizada, e não o texto cru.
  return ALTERNATIVAS[chave] ?? traduzirTermo(original) ?? traduzirTermo(chave)
}

/**
 * Devolutiva em português.
 *
 * A devolutiva genérica de erro é tratada à parte porque cobre quase todas as
 * ocorrências e não faz sentido mantê-la no dicionário em duas grafias.
 */
export function traduzirFeedback(original: string): string | null {
  const limpo = original.trim()
  if (!limpo) return null
  if (ERRO_GENERICO.test(limpo)) return 'Não é essa. Tente de novo.'
  const escrito = FEEDBACKS[normalizar(limpo)]
  if (escrito) return escrito
  return null
}

/** Quantos textos já têm tradução escrita à mão. */
export const TOTAIS_DE_TRADUCAO = {
  enunciados: Object.keys(ENUNCIADOS).length,
  alternativas: Object.keys(ALTERNATIVAS).length,
  feedbacks: Object.keys(FEEDBACKS).length,
}

export { PREFIXO_CORRETA }

/**
 * Devolve o quiz com enunciado, alternativas e devolutivas em português.
 *
 * O texto original é preservado em `*Original` e o que segue sem tradução é
 * marcado com `*Pendente`, para que a interface avise em vez de fingir que o
 * inglês é a versão final. Aplicado num ponto só — `obterQuiz` —, o gabarito
 * servido pela API e o que a página renderiza não podem divergir.
 */
export function traduzirQuiz(quiz: Quiz, traduzirTermo: (t: string) => string | null): Quiz {
  return {
    ...quiz,
    questoes: quiz.questoes.map((questao) => {
      const original = questao.enunciadoOriginal || questao.enunciado
      const enunciado = traduzirEnunciado(original)
      return {
        ...questao,
        enunciado: enunciado ?? original,
        enunciadoOriginal: original,
        enunciadoPendente: enunciado === null,
        alternativas: questao.alternativas.map((alternativa) => {
          const texto = traduzirAlternativa(alternativa.texto, traduzirTermo)
          const feedback = alternativa.feedback
            ? traduzirFeedback(alternativa.feedback)
            : null
          return {
            ...alternativa,
            texto: texto ?? alternativa.texto,
            textoOriginal: alternativa.texto,
            textoPendente: texto === null,
            feedback: feedback ?? alternativa.feedback,
            feedbackOriginal: alternativa.feedback,
            feedbackPendente: Boolean(alternativa.feedback) && feedback === null,
          }
        }),
      }
    }),
  }
}
