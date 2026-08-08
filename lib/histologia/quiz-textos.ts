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
export const FEEDBACKS: Record<string, string> = {
  'correct! this image shows the periosteum which deposits bone by intramembranous ossification on the surface of existing bone, which is an example of appositional growth.': 'CORRETO. A imagem mostra o periósteo, que deposita osso por ossificação intramembranosa sobre a superfície do osso já existente — um exemplo de crescimento aposicional.',
  'correct. a peyer\'s patch is an accumulation of lymphoid nodules in the lamina propria of the ileum. lymphoid tissue can occur in this location along the entire digestive tract; however, the term peyer\'s patch is reserved for these large accumulations in the ileum. accumulations of lymphoid tissue appear highly basophilic due to the presence of large numbers of lymphocytes.': 'CORRETO. A placa de Peyer é um acúmulo de nódulos linfoides na lâmina própria do íleo. Tecido linfoide pode aparecer nessa posição ao longo de todo o tubo digestório, mas o nome placa de Peyer fica reservado a esses grandes acúmulos ileais. Agregados linfoides são intensamente basófilos pela enorme quantidade de linfócitos.',
  'correct. a circumvallate papilla is surrounded by a deep sulcus that receives ducts of the serous glands of von ebner. the connective tissue core is covered on its lateral surfaces with moist stratified squamous epithelium containing many taste buds. the surface epithelium is keratinized.': 'CORRETO. A papila circunvalada é cercada por um sulco profundo que recebe os ductos das glândulas serosas de von Ebner. O eixo de tecido conjuntivo é recoberto, nas faces laterais, por epitélio estratificado pavimentoso não queratinizado com muitos botões gustativos. Já o epitélio da superfície superior é queratinizado.',
  'correct. a compound gland is subdivided into numerous lobules, which are connected by interlobular ducts. intervening interlobular connective tissue separates the lobules.': 'CORRETO. A glândula composta se subdivide em vários lóbulos, ligados entre si por ductos interlobulares. O tecido conjuntivo interlobular interposto é o que separa um lóbulo do outro.',
  'correct. a feature of large veins, like the vena cava shown here, is a significant amount of smooth muscle in the tunica adventitia. smooth muscle fibers in the adventitia are oriented longitudinally, thus they are seen in cross section. smooth muscle fibers in the media are arranged circularly and thus are seen in longitudinal section. this stain for elastin clearly shows the internal elastic lamina and elastic fibers throughout the adventitia.': 'CORRETO. Uma marca das veias de grande calibre, como esta cava, é a quantidade expressiva de músculo liso na túnica adventícia. Ali as fibras musculares correm longitudinalmente e por isso aparecem em corte transversal; na média elas se dispõem circularmente e aparecem em corte longitudinal. A coloração para elastina evidencia a lâmina elástica interna e as fibras elásticas por toda a adventícia.',
  'correct. a plica circularis is a circular fold extending around the entire inner circumference of the small intestine. each plica has a central core of submucosa covered by the overlying mucosa with its villi. in contrast, a villus has a core of lamina propria that is overlain by the simple columnar epithelium lining the small intestine.': 'CORRETO. A prega circular é uma dobra que percorre toda a circunferência interna do intestino delgado. Cada prega tem eixo central de submucosa, recoberto pela mucosa com suas vilosidades. A vilosidade, em contraste, tem eixo apenas de lâmina própria, revestido pelo epitélio simples colunar do intestino delgado.',
  'correct. a primary, multilaminar follicle (late primary follicle) forms as the follicle cells of a primary, unilaminar follicle proliferate to form a stratified epithelium. when antral spaces begin to appear between these cells, the follicle is then referred to as a secondary follicle. antral spaces eventually fuse into a single space called the antrum.': 'CORRETO. O folículo primário multilaminar (folículo primário tardio) surge quando as células foliculares de um folículo primário unilaminar proliferam e formam um epitélio estratificado. Quando espaços antrais começam a aparecer entre essas células, o folículo passa a ser chamado de secundário. Esses espaços acabam confluindo em uma cavidade única, o antro.',
  'correct. a secondary bronchus resembles a primary bronchus except that all layers are thinner; the passageway is surrounded by plates rather than rings of cartilage; and the smooth muscle becomes more prominent. abundant, longitudinal elastic fibers remain in the lamina propria, but they are more dispersed than in the trachea and primary bronchi.': 'CORRETO. O brônquio lobar se parece com o brônquio principal, mas todas as camadas são mais finas, a via é envolvida por placas de cartilagem em vez de anéis, e o músculo liso ganha destaque. Fibras elásticas longitudinais continuam abundantes na lâmina própria, embora mais dispersas que na traqueia e nos brônquios principais.',
  'correct. a secondary follicle is defined as a follicle which contains antral spaces. here, all of the original antral spaces have fused into one large cavity which is filled with follicular fluid. this space is the antrum.': 'CORRETO. O folículo secundário é definido pela presença de espaços antrais. Aqui, todos os espaços originais já se fundiram em uma cavidade única, preenchida por líquido folicular: esse espaço é o antro.',
  'correct. a sweat gland is a simple, coiled tubular gland. its long straight duct extends from the epidermis to the lower portion of the dermis or upper portion of the hypodermis where it connects to the coiled, secretory portion of the gland. the duct generally stains more intensely than the glandular portion and its distal end often coils with the secretory portion.': 'CORRETO. A glândula sudorípara é uma glândula tubular simples enovelada. Seu ducto longo e retilíneo desce da epiderme até a derme profunda ou a hipoderme, onde se liga ao novelo secretor. O ducto costuma corar mais intensamente que a porção glandular, e sua extremidade distal frequentemente se enovela junto com ela.',
  'correct. accumulations of rough endoplasmic reticulum stain with hematoxylin and thus are basophilic. the basophilia results from the ribosomes located along the membranes of the rough endoplasmic reticulum. also stained is heterochromtin within the nucleus.': 'CORRETO. Acúmulos de retículo endoplasmático rugoso se coram pela hematoxilina e são, portanto, basófilos. A basofilia vem dos ribossomos aderidos às membranas do retículo. A heterocromatina do núcleo também se cora pelo mesmo motivo.',
  'correct. actin filaments form stress fibers that form a complex network throughout the cytoplasm to provide support for the cell and its processes. microfilaments are also concentrated beneath the plasma membrane and supporting microvilli.': 'CORRETO. Os filamentos de actina formam fibras de tensão que se organizam em uma rede complexa por todo o citoplasma, sustentando a célula e seus prolongamentos. Os microfilamentos também se concentram logo abaixo da membrana plasmática e no eixo das microvilosidades.',
  'correct. active osteoblasts are cuboidal in shape and lie directly on developing bone. they are actively secreting osteoid, the organic component of bone.': 'CORRETO. Osteoblastos ativos são cúbicos e assentam diretamente sobre o osso em formação. Estão secretando osteoide, o componente orgânico da matriz óssea.',
  'correct. after ovulation, the follicle wall collapses resulting in the deeply folded structure of the corpus luteum. during the formation of the corpus luteum, cells of both the granulosa and theca interna of the graafian follicle differentiate forming granulosa lutein and theca lutein cells, respectively. this process is called luteinization. both populations of luteal cells secrete progesterone and estrogens.': 'CORRETO. Depois da ovulação, a parede folicular colapsa, e daí vem o aspecto intensamente pregueado do corpo lúteo. Na formação dele, as células da granulosa e as da teca interna do folículo de Graaf se diferenciam em células granulosa-luteínicas e teca-luteínicas, respectivamente — processo chamado luteinização. As duas populações secretam progesterona e estrogênios.',
  'correct. all developing follicles, except the graafian follicle, contain primary oocytes. they are arrested in prophase of meiosis 1. just prior to ovulation, the first meiotic division is completed, resulting in the formation of a secondary oocyte and the first polar body. the secondary oocyte, which arrests in metaphase, is haploid and is released from the ovary at ovulation. completion of meiosis occurs upon fertilization.': 'CORRETO. Todos os folículos em desenvolvimento, exceto o de Graaf, contêm oócitos primários, parados na prófase da meiose I. Pouco antes da ovulação, a primeira divisão meiótica se completa e origina um oócito secundário e o primeiro corpúsculo polar. O oócito secundário, haploide, para na metáfase e é liberado do ovário na ovulação; a meiose só se conclui se houver fecundação.',
  'correct. an alveolar duct is formed as alveoli increase in number in a respiratory bronchiole, reducing the wall to a series of knobs. the knobs are really cross-sectional views of the rings that support the opening of the alveoli attached to them.': 'CORRETO. O ducto alveolar se forma à medida que os alvéolos se multiplicam ao longo do bronquíolo respiratório, reduzindo a parede a uma série de botões. Esses botões são, na verdade, cortes transversais dos anéis que sustentam a abertura dos alvéolos ali ancorados.',
  'correct. an epithelial cell is anchored to its underlying basal lamina by hemidesmosomes. as the name indicates, these structures consist of one half of a desmosome. these adherent junctions are prominent in electron micrographs due to the large number of intermediate filaments and attachment proteins on the cytoplasmic surface of the membrane.': 'CORRETO. A célula epitelial se ancora à lâmina basal subjacente por hemidesmossomos. Como o nome indica, cada um corresponde a metade de um desmossomo. Essas junções de adesão saltam à vista em eletromicrografias pela quantidade de filamentos intermediários e proteínas de ancoragem na face citoplasmática da membrana.',
  'correct. arcuate arteries are found at the junction of the renal cortex with the medulla. they give rise to interlobular arteries, which form the boundaries of renal lobules in the cortex.': 'CORRETO. As artérias arqueadas correm no limite entre o córtex e a medula renal. Delas partem as artérias interlobulares, que delimitam os lóbulos renais no córtex.',
  'correct. arterioles have a narrow lumen with a relatively thick wall consisting of up to three layers of smooth muscle cells in the tunica media.': 'CORRETO. A arteríola tem luz estreita e parede relativamente espessa, com até três camadas de células musculares lisas na túnica média.',
  'correct. at high magnification of a ground bone preparation, the lacunae (housing osteocytes) and canaliculi (housing osteocyte processes radiating from the osteocytes) are very distinct.': 'CORRETO. Em grande aumento de uma preparação de osso desgastado, as lacunas (que alojam os osteócitos) e os canalículos (que alojam os prolongamentos irradiados a partir deles) ficam muito nítidos.',
  'correct. at the electron microscopic level, collagen fibrils can be resolved with their characteristic banding pattern. these fibrils can assemble into larger fibers and collagen bundles in the dense connective tissues.': 'CORRETO. Em microscopia eletrônica, as fibrilas de colágeno são resolvidas com seu padrão de bandas característico. Essas fibrilas se agrupam em fibras maiores e, nos tecidos conjuntivos densos, em feixes.',
  'correct. beneath the capsule of the lymph node is the subcapsular sinus, which receives and filters the lymph entering via the afferent lymphatic vessels.': 'CORRETO. Logo abaixo da cápsula do linfonodo está o seio subcapsular, que recebe e filtra a linfa trazida pelos vasos linfáticos aferentes.',
  'correct. blood enters the adrenal gland through the capsule and percolates through the wide-diameter, fenestrated capillaries of the cortex. steroid secretions of the cortical cells are released into these capillaries. blood eventually exits the organ via veins located in the medulla.': 'CORRETO. O sangue entra na suprarrenal pela cápsula e percola pelos capilares fenestrados de grande calibre do córtex. É neles que as células corticais lançam seus esteroides. O sangue deixa o órgão por veias situadas na medula.',
  'correct. bowman\'s capsule is the expanded beginning of the renal tubule. it is indented by the glomerulus, thereby forming two layers, with bowman\'s space between them. the visceral layer is composed of podocytes which lie on the basal lamina of the endothelial cells of the glomerulus. the parietal layer contacts the parenchyma of the kidney.': 'CORRETO. A cápsula de Bowman é o início dilatado do túbulo renal. O glomérulo a invagina, o que cria dois folhetos com o espaço de Bowman entre eles. O folheto visceral é formado por podócitos apoiados na lâmina basal do endotélio glomerular; o parietal faz limite com o parênquima renal.',
  'correct. branches of bronchial arteries and veins travel within the respiratory passagways and, therefore, have to be smaller than the wall of the passageway they are supplying.': 'CORRETO. Ramos das artérias e veias brônquicas correm dentro da parede das vias respiratórias e, por isso, precisam ser menores que a própria parede que irrigam.',
  'correct. brunner\'s glands are mucus-secreting glands located in the submucosa. brunner\'s glands are present only in the duodenal portion of the small intestine and, thus, are diagnostic for this region of small intestine.': 'CORRETO. As glândulas de Brunner são glândulas secretoras de muco alojadas na submucosa. Só existem no duodeno e, por isso, identificam essa região do intestino delgado.',
  'correct. capillaries are lined only by an endothelium and its basal lamina. continuous capillaries are composed of one or two endothelial cells and the surrounding basal lamina. occluding junctions unite adjacent cells and because of their narrow lumen, these capillaries only allow erythrocytes pass through in single file. continuous capillaries are the most prevalent type as seen in this adipose tissue.': 'CORRETO. O capilar é revestido apenas por endotélio e sua lâmina basal. No capilar contínuo, uma ou duas células endoteliais fecham a circunferência, unidas por junções de oclusão. A luz é tão estreita que as hemácias passam em fila indiana. É o tipo mais comum, como se vê aqui no tecido adiposo.',
  'correct. capillaries are lined only by an endothelium and its basal lamina. continuous capillaries are composed of one or two endothelial cells and the surrounding basal lamina. occluding junctions unite adjacent cells and because of their narrow lumen, these capillaries only allow erythrocytes pass through in single file. continuous capillaries are the most prevalent type.': 'CORRETO. O capilar é revestido apenas por endotélio e sua lâmina basal. No capilar contínuo, uma ou duas células endoteliais fecham a circunferência, unidas por junções de oclusão. A luz é tão estreita que as hemácias passam em fila indiana. É o tipo mais comum do corpo.',
  'correct. chief cells secrete pepsinogen and are concentrated in the lower part of the gastric gland, away from the stomach lumen. they have a basal, basophilic cytoplasm, and the apex of the cell appears foamy due to the presence of the secretory granules.': 'CORRETO. As células principais secretam pepsinogênio e se concentram na porção profunda da glândula gástrica, longe da luz do estômago. Têm citoplasma basal basófilo, e o ápice parece espumoso por causa dos grânulos de secreção.',
  'correct. chondroblasts in the chondrogenic layer secrete cartilage matrix around themselves, becoming chondrocytes and increasing cartilage thickness by appositional growth. the exact point at which a chondroblast becomes a chondrocyte is hard to visualize. the transition, however, of inactive, flattened cells to plump, secretory chondroblasts to spherical chondrocytes is well shown.': 'CORRETO. Os condroblastos da camada condrogênica secretam matriz ao redor de si, tornam-se condrócitos e engrossam a cartilagem por crescimento aposicional. O momento exato em que um condroblasto vira condrócito é difícil de flagrar, mas a transição está bem representada aqui: células achatadas e inativas, depois condroblastos volumosos e secretores, e por fim condrócitos esféricos.',
  'correct. chondrocytes lying within the cartilages divide and lay down cartilage matrix around themselves. this growth is termed interstitial growth.': 'CORRETO. Os condrócitos já instalados na cartilagem se dividem e depositam matriz ao redor de si. Esse mecanismo é o crescimento intersticial.',
  'correct. chondrocytes, chondroblasts that have completely surrounded themselves by matrix, lie in potential spaces called lacunae. although surrounded by a firm, rubbery matrix that seems difficult to manipulate, chondrocytes produce matrix and divide (interstitial growth), forming isogenous groups. black spheres within these cells are lipid droplets.': 'CORRETO. Os condrócitos — condroblastos que se cercaram completamente de matriz — ocupam cavidades chamadas lacunas. Mesmo envoltos por uma matriz firme e elástica, que pareceria impossível de remodelar, eles produzem matriz e se dividem (crescimento intersticial), formando grupos isógenos. As esferas escuras no interior das células são gotículas lipídicas.',
  'correct. chromatin is a complex of protein and dna within the nucleus. heteochromatin is electron dense and transcriptionally less active than the more electron lucent, euchromatin which is transcriptionally active. heterochromatin is frequently distributed in a perinuclear distribution immediately beneath the nuclear envelope.': 'CORRETO. A cromatina é um complexo de proteína e DNA dentro do núcleo. A heterocromatina é elétron-densa e transcricionalmente menos ativa; a eucromatina, mais elétron-lucente, é a transcricionalmente ativa. A heterocromatina costuma se dispor em faixa perinuclear, logo abaixo do envoltório.',
  'correct. cilia appear as densely packed, hair-like, motile extensions from the apical cell surface, 5-10 microns in length. each cilium has a basal body from which microtubules emanate forming the core of the cilium, called the axoneme. seen in this light microscopic image, the basal bodies collectively appear as a dark band along the apical surface of the cell.': 'CORRETO. Os cílios aparecem como projeções móveis, filiformes e densamente agrupadas na superfície apical, com 5 a 10 µm de comprimento. Cada cílio tem um corpúsculo basal do qual partem os microtúbulos que formam seu eixo, o axonema. Nesta imagem de microscopia de luz, os corpúsculos basais em conjunto formam a faixa escura ao longo do ápice celular.',
  'correct. cilia appear as densely packed, hair-like, motile extensions from the apical cell surface, 5-10 microns in length. each cilium has a basal body from which microtubules emanate, forming the core of the cilium, called the axoneme.': 'CORRETO. Os cílios aparecem como projeções móveis, filiformes e densamente agrupadas na superfície apical, com 5 a 10 µm de comprimento. Cada cílio tem um corpúsculo basal do qual partem os microtúbulos que formam seu eixo, o axonema.',
  'correct. collagen bundles are large, greater than five microns, and are composed of many collagen fibrils. collagen fibers are eosinophilic and inelastic.': 'CORRETO. Os feixes de colágeno são espessos, com mais de cinco micrômetros, e reúnem muitas fibrilas. As fibras colágenas são acidófilas e inelásticas.',
  'correct. cones are less numerous than rods and provide greater visual acuity than the rods. cones are so named based of the conical shape of their outer segments which contain the visual pigment iodopsin. cones are concentrated in the central retina, notably in the fovea, the region of greatest visual acuity.': 'CORRETO. Os cones são menos numerosos que os bastonetes e proporcionam acuidade visual maior. O nome vem da forma cônica de seu segmento externo, que contém o pigmento visual iodopsina. Concentram-se na retina central, sobretudo na fóvea, região de acuidade máxima.',
  'correct. cranial nerve viii, the vestibulocochlear innervates the receptors in the inner ear, the maculae, the cristae ampullares and the organ of corti. the nerve seen here is the cochlear division of the nerve located in the modiolus of the cochlea.': 'CORRETO. O nervo craniano VIII, vestibulococlear, inerva os receptores do ouvido interno: as máculas, as cristas ampulares e o órgão de Corti. O que se vê aqui é sua divisão coclear, alojada no modíolo da cóclea.',
  'correct. dense irregular connective tissue has relatively few cells, mostly inactive fibroblasts. in addition, the tissue has large-caliber collagen bundles in an irregular arrangement. a layer of loose connective lies just above this tissue beneath the epithelium.': 'CORRETO. O tecido conjuntivo denso não modelado tem poucas células, em sua maioria fibroblastos quiescentes, e feixes espessos de colágeno dispostos sem orientação preferencial. Logo acima dele, abaixo do epitélio, há uma faixa de tecido conjuntivo frouxo.',
  'correct. dense irregular connective tissue has relatively few cells; those that are present are nearly all fibroblasts, many of which are inactive. in addition, the tissue has large-caliber collagen bundles, which have no organized arrangement.': 'CORRETO. O tecido conjuntivo denso não modelado tem poucas células, quase todas fibroblastos e boa parte deles quiescentes. Seus feixes de colágeno são espessos e não seguem arranjo organizado.',
  'correct. dense regular connective tissue is exclusively found in tendons and ligaments and displays a parallel arrangement of collagen bundles. inactive fibroblasts are arranged in rows between the bundles of collagen.': 'CORRETO. O tecido conjuntivo denso modelado ocorre em tendões e ligamentos e exibe feixes de colágeno paralelos entre si. Entre os feixes, fibroblastos quiescentes se alinham em fileiras.',
  'correct. dentinal tubules radiate through the dentin and contain the cellular extensions of odontoblasts. the cell bodies of the odontoblasts line the pulp cavity.': 'CORRETO. Os túbulos dentinários irradiam pela dentina e contêm os prolongamentos dos odontoblastos, cujos corpos celulares forram a cavidade pulpar.',
  'correct. dermal papillae are elevations of the papillary layer of the dermis that alternate with epidermal pegs, which are descending folds of the epidermis. the papillae are composed of loose connective tissue and may contain blood vessels or meissner\'s corpuscles.': 'CORRETO. As papilas dérmicas são elevações da camada papilar da derme que se alternam com as cristas epidérmicas, dobras descendentes da epiderme. São feitas de tecido conjuntivo frouxo e podem conter vasos sanguíneos ou corpúsculos de Meissner.',
  'correct. desmosomes are a type of adherent junction that serve to attach cell to one another. desmosomes are a symmetrical junctions with mirror-image protein complexes in adjacent cells. membrane proteins extend from these complexes to overlap with similar proteins from neighboring cells to provide the attachment.': 'CORRETO. O desmossomo é uma junção de adesão que prende uma célula à outra. É simétrico: as duas células vizinhas têm complexos proteicos em imagem espelhada. Proteínas de membrana partem desses complexos e se sobrepõem às proteínas equivalentes da célula ao lado, garantindo a ancoragem.',
  'correct. distal tubules are distinguished from proximal tubules by their low cuboidal epithelium, the irregular placement of nuclei around the lumen, and lack of a brush border. this is a convoluted portion of the distal tubule tubule because it is in the convoluted portion of the kidney, as indicated by the presence of renal corpuscles.': 'CORRETO. O túbulo distal se distingue do proximal pelo epitélio cúbico baixo, pelos núcleos distribuídos irregularmente ao redor da luz e pela ausência de borda em escova. Trata-se aqui da porção contorcida do túbulo distal, já que estamos na porção contorcida do rim — o que a presença de corpúsculos renais confirma.',
  'correct. during endochondral ossification, hyaline cartilage becomes calcified and nutrients cannot reach the chondrocytes. consequently, the chondrocytes degenerate and die, leaving behind the calcified cartilage spicules surrounding the chondrocyte lacunae. these remaining spicules form a framework on which bone can be deposited.': 'CORRETO. Na ossificação endocondral, a cartilagem hialina se calcifica e os nutrientes deixam de alcançar os condrócitos, que degeneram e morrem. Restam as espículas de cartilagem calcificada ao redor das antigas lacunas, e são elas que servem de arcabouço para a deposição do osso.',
  'correct. during follicular development, following the primary multilaminar stage (late primary follicle), spaces begin to appear between the follicle cells. the spaces eventually coalesce into a single antral space or antrum. the presence of an antrum or antral spaces defines a secondary or antral follicle.': 'CORRETO. No desenvolvimento folicular, depois do estágio primário multilaminar (folículo primário tardio), começam a surgir espaços entre as células foliculares. Eles acabam confluindo em uma cavidade única, o antro. A presença de antro ou de espaços antrais é o que define o folículo secundário, ou antral.',
  'correct. during pregnancy, the tubular duct elements of the mammary glands elongate and branch, and alveoli begin to develop from the ducts. some secretory product may be present in the alveoli and the ducts, particularly during the third trimester of pregnancy. at this stage, the amount of parenchymal and stromal components appear about equal.': 'CORRETO. Na gravidez, os ductos tubulares da mama se alongam e se ramificam, e alvéolos começam a brotar deles. Pode haver secreção nos alvéolos e nos ductos, sobretudo no terceiro trimestre. Nesse estágio, parênquima e estroma ocupam áreas aproximadamente iguais.',
  'correct. during the proliferative phase of the menstrual cycle, the stratum basale regenerates the stratum functionalis. the proliferative phase displays a relatively thin endometrium with straight glands that do not contain secretory material. the spiral arteries are not coiled nor readily visible.': 'CORRETO. Na fase proliferativa do ciclo menstrual, a camada basal regenera a camada funcional. O endométrio ainda é relativamente fino, com glândulas retas e sem secreção na luz. As artérias espiraladas ainda não estão enoveladas nem são facilmente visíveis.',
  'correct. during the secretory phase of the menstrual cycle, the uterine endometrium attains its greatest thickness and contains large, dilated glands and prominent spiral arteries. these changes are the result of progesterone and estrogen secretion from the corpus luteum. in addition the cells of the stroma, called pre-decidual cells, accumulate glycogen that serves as an early nutrient source for the embryo during implantation.': 'CORRETO. Na fase secretora, o endométrio atinge sua espessura máxima, com glândulas largas e dilatadas e artérias espiraladas proeminentes. Essas mudanças respondem à progesterona e ao estrogênio produzidos pelo corpo lúteo. As células do estroma, chamadas pré-deciduais, acumulam glicogênio, primeira fonte de nutrientes para o embrião na implantação.',
  'correct. each of the paired seminal vesicles consists of a single, highly coiled tube, which is surrounded by smooth muscle. the epithelium and its underlying connective tissue form complex folds and interconnecting arches diagnostic for this gland.': 'CORRETO. Cada uma das duas vesículas seminais é um tubo único e intensamente enovelado, envolvido por músculo liso. O epitélio e o conjuntivo subjacente formam pregas complexas e arcos interligados — o achado que identifica a glândula.',
  'correct. each sweat gland in the skin has a long, unbranched duct, which ends in the coiled secretory portion of the gland. in this section, the portions of the ducts that connect with the glands are not visible, as they pass out of the plane of section.': 'CORRETO. Cada glândula sudorípara tem um ducto longo e não ramificado que termina no novelo secretor. Neste corte, os trechos de ducto que se conectam às porções secretoras não aparecem, porque saem do plano de secção.',
  'correct. efferent ducts are located in the head of the epididymis. they are characterized by a scalloped epithelium, due to the presence of both tall and short cells. some cells posses cilia, the only place cilia are present in the male reproductive tract.': 'CORRETO. Os dúctulos eferentes ficam na cabeça do epidídimo e se caracterizam pelo epitélio festonado, resultado da alternância entre células altas e baixas. Algumas delas são ciliadas — o único ponto com cílios em toda a via reprodutora masculina.',
  'correct. elastic fibers are present in both loose and dense connective tissues, where they can be distinguished from collagen fibers by their higher electron density and amorphous appearance. the majority of the fiber is composed of elastin protein and the entire fiber is surrounded by microfibrils composed of fibrillin protein.': 'CORRETO. Fibras elásticas existem tanto no conjuntivo frouxo quanto no denso, e se distinguem das colágenas pela densidade eletrônica maior e pelo aspecto amorfo. O corpo da fibra é feito de elastina, e todo o conjunto é envolvido por microfibrilas de fibrilina.',
  'correct. enamel forms the outer layer of the tooth and is acellular, unlike the dentin to the right, which contains the processes of odontoblasts in dentinal tubules.': 'CORRETO. O esmalte forma a camada externa do dente e é acelular, ao contrário da dentina à direita, que aloja os prolongamentos dos odontoblastos dentro dos túbulos dentinários.',
  'correct. enteroendocrine cells are distinguished by their pale cytoplasm and the presence of secretory granules oriented toward the basement membrane. in most cases, the nucleus is positioned toward the lumen of the gland. the hormones released by these cells enter the blood stream, they are not secreted into the gland lumen.': 'CORRETO. As células enteroendócrinas se reconhecem pelo citoplasma pálido e pelos grânulos de secreção voltados para a membrana basal. Na maioria dos casos o núcleo fica do lado da luz da glândula. Os hormônios que elas liberam caem na corrente sanguínea, e não na luz.',
  'correct. enteroendocrine cells are located throughout the gi tract and are a component of the diffuse neuroendocrine system of cells and tissues. they contain secretory granules, which are oriented away from the lumen of the gland in which they are located, thus indicating that they are not exocrine cells.': 'CORRETO. As células enteroendócrinas se espalham por todo o tubo digestório e compõem o sistema neuroendócrino difuso. Seus grânulos de secreção ficam voltados para o lado oposto ao da luz da glândula — sinal claro de que não são células exócrinas.',
  'correct. eosinophils are granular leucocytes with a heterochromatic, bilobed nucleus and bright eosinophilic granules that fill the cytoplasm. like neutrophils, eosinophils function in tissues and readily exit the blood stream. eosinophils play a role in allergic reactions and parasitic infections as well as phagocytosis.': 'CORRETO. Os eosinófilos são leucócitos granulares com núcleo bilobado e heterocromático e grânulos intensamente acidófilos que preenchem o citoplasma. Como os neutrófilos, atuam nos tecidos e deixam o sangue com facilidade. Participam das reações alérgicas, das infecções parasitárias e da fagocitose.',
  'correct. eosinophils are granular white blood cells that migrate into connective tissues from the blood stream. they are phagocytic and function in parasitic infections. an eosinophil has intensely eosinophilic granules in its cytoplasm and a bilobed nucleus.': 'CORRETO. Os eosinófilos são leucócitos granulares que migram do sangue para o tecido conjuntivo. São fagocíticos e atuam nas infecções parasitárias. Reconhecem-se pelos grânulos intensamente acidófilos e pelo núcleo bilobado.',
  'correct. erythrocytes are, by far, the most numerous cell in blood. in normal blood they are biconcave disks and lack a nucleus.': 'CORRETO. As hemácias são, de longe, as células mais numerosas do sangue. No sangue normal são discos bicôncavos e não têm núcleo.',
  'correct. euchromatin is highly dispersed, dna and, as such, stains highly electron-lucent. euchromatin indicates areas of active dna transcription. the nuclei of most cells contain a mixture of euchromatin and heterochromatin. the nucleus of this highly active liver cell appears almost entirely euchromatic.': 'CORRETO. A eucromatina é DNA muito disperso e, por isso, aparece elétron-lucente. Ela marca as áreas de transcrição ativa. O núcleo da maioria das células mistura eucromatina e heterocromatina; o desta célula hepática, altamente ativa, é quase inteiramente eucromático.',
  'correct. fenestrated capillaries are characterized by fenestrations or pores that are spanned by a diaphragm. fenestrations facilitate transport across the endothelium in organs where abundant and rapid transport occurs, such as in the digestive and endocrine systems. fenestrated capillaries are also present in renal glomeruli, but these lack diaphragms.': 'CORRETO. O capilar fenestrado se caracteriza por fenestras, poros fechados por um diafragma. Elas facilitam o transporte através do endotélio em órgãos de troca intensa e rápida, como os dos sistemas digestório e endócrino. Também existem no glomérulo renal, mas ali as fenestras não têm diafragma.',
  'correct. fibrocartilage can be difficult to differentiate from dense connective tissue. rounded chondrocytes, frequently with visible cytoplasm and lacunae, differentiate fibrocartilage from connective tissue proper. fibroblasts are distinguished by their flattened, heterochromatic nuclei and lack of visible cytoplasm and lacunae.': 'CORRETO. A fibrocartilagem pode ser difícil de separar do conjuntivo denso. O que a distingue são os condrócitos arredondados, em geral com citoplasma visível e alojados em lacunas. O fibroblasto, por contraste, tem núcleo achatado e heterocromático, sem citoplasma aparente e sem lacuna.',
  'correct. fibrocartilage, the strongest of the cartilages, blends the strength of dense ct with that of cartilage: obvious collagen fiber bundles (similar to dense ct) and a flexible, noncompressible ground substance (similar to cartilage). fibrocartilage exists in isolated pockets where extra strength is needed, rather than as an independent cartilage; therefore, it has no perichondrium.': 'CORRETO. A fibrocartilagem é a mais resistente das cartilagens e combina a força do conjuntivo denso com as propriedades da cartilagem: feixes colágenos evidentes, como no denso, e uma substância fundamental flexível e incompressível, como na cartilagem. Ocorre em bolsões isolados, onde é preciso resistência extra, e não como peça independente — por isso não tem pericôndrio.',
  'correct. filiform papilla are flame-shaped structures located over the entire dorsum and lateral surfaces of the tongue. they consist of a keratinized stratified squamous epithelium, which overlies a core of connective tissue.': 'CORRETO. As papilas filiformes têm forma de chama e cobrem todo o dorso e as faces laterais da língua. São feitas de epitélio estratificado pavimentoso queratinizado sobre um eixo de tecido conjuntivo.',
  'correct. follicle cells surround and support the oocyte. in a secondary follicle these cells collectively form the stratum granulosum. they are responsive to follicle stimulating hormone (fsh) and secrete estrogen.': 'CORRETO. As células foliculares envolvem e sustentam o oócito. No folículo secundário, elas formam em conjunto a camada granulosa. Respondem ao hormônio folículo-estimulante (FSH) e secretam estrogênio.',
  'correct. gastric pits extend into the lamina propria from the stomach surface. although not called ducts, gastric pits serve as conduits for the secretions of the gastric glands, which originate at the base of the pits. in the fundic stomach, the pits are much shorter than the glands.': 'CORRETO. As fossetas gástricas descem da superfície do estômago para dentro da lâmina própria. Embora não recebam o nome de ductos, funcionam como conduto para a secreção das glândulas gástricas, que nascem no fundo delas. No estômago fúndico, as fossetas são bem mais curtas que as glândulas.',
  'correct. glomeruli are tufts of capillaries arranged in rows on either side of an interlobular artery in the convoluted portion of the cortex. each capillary is supplied by an afferent arteriole. the renal corpuscle consists of the glomerulus and the surrounding bowman\'s capsule, which is technically a component of the renal tubule.': 'CORRETO. Os glomérulos são novelos capilares alinhados em fileiras dos dois lados de uma artéria interlobular, na porção contorcida do córtex. Cada novelo recebe uma arteríola aferente. O corpúsculo renal é o conjunto do glomérulo com a cápsula de Bowman ao redor, que tecnicamente já faz parte do túbulo renal.',
  'correct. glycogen granules are highly electron-dense structures in the cytoplasm. they readily aggregate into clusters, as seen in this liver cell and would stain positively with the periodic-schiff stain (pas) by light microscopy. glycogen granules are not surrounded by a membrane.': 'CORRETO. Os grânulos de glicogênio são estruturas muito elétron-densas no citoplasma. Agregam-se com facilidade em cachos, como nesta célula hepática, e seriam PAS-positivos em microscopia de luz. Não têm membrana ao redor.',
  'correct. glycogen granules are present in most cells, but are highly abundant in these liver cells. due to the carbohydrate in these granules, they react positively with the periodic acid-schiff (pas) stain seen here.': 'CORRETO. Grânulos de glicogênio existem na maioria das células, mas são especialmente abundantes nestes hepatócitos. Por serem carboidrato, reagem positivamente ao PAS, a coloração usada aqui.',
  'correct. hair follicles have a terminal dilation called the hair bulb which surrounds a central papilla composed of dermal connective tissue. within the papilla are numerous blood vessels necessary for survival of the follicle. sebaceous glands (not seen in this image) are most often associated with hair follicles. hair follicles are derived from the epidermis and are present only in thin skin.': 'CORRETO. O folículo piloso termina em uma dilatação, o bulbo, que envolve uma papila central de conjuntivo dérmico. Dentro da papila correm os vasos indispensáveis à sobrevivência do folículo. Glândulas sebáceas, ausentes nesta imagem, quase sempre acompanham o folículo. Os folículos derivam da epiderme e só existem na pele fina.',
  'correct. hassall\'s corpuscles are located in the medullary regions of the thymus and are composed of deteriorating reticular epithelial cells that form the framework of this organ.': 'CORRETO. Os corpúsculos de Hassall ficam na medula do timo e são formados por células epiteliorreticulares em degeneração — as mesmas que compõem o arcabouço do órgão.',
  'correct. herring bodies are the expanded axon terminals of hypothalamic neurons. herring bodies are most numerous in the pars nervosa and are eosinophilic with a granular appearance. they can vary in size, depending on the number of hormone-containing vesicles they contain. the nuclei adjacent to herring bodies are those of pituicytes.': 'CORRETO. Os corpos de Herring são as dilatações terminais dos axônios de neurônios hipotalâmicos. São mais numerosos na pars nervosa, acidófilos e de aspecto granular, e variam de tamanho conforme a quantidade de vesículas de hormônio que carregam. Os núcleos ao redor deles pertencem aos pituícitos.',
  'correct. high endothelial venules are unique blood vessels because their endothelium is a simple cuboidal epithelium rather than the typical simple squamous. this shape allows ready passage of lymphocytes through their walls.': 'CORRETO. As vênulas de endotélio alto são vasos singulares porque seu endotélio é simples cúbico, e não simples pavimentoso como o habitual. Essa forma facilita a passagem de linfócitos através da parede.',
  'correct. hyaline cartilage proper is composed of cells (chondrocytes) and their surrounding extracellular matrix. chondrocytes are usually present as isogenous groups. the glassy (hyaline) extracellular matrix is composed of a firm-rubber ground substance and collagen (type ii) fibrils.': 'CORRETO. A cartilagem hialina propriamente dita é feita de células, os condrócitos, e da matriz extracelular ao redor delas. Os condrócitos costumam aparecer em grupos isógenos. A matriz, de aspecto vítreo, combina uma substância fundamental firme e elástica com fibrilas de colágeno tipo II.',
  'correct. immunoblasts, which are present within the germinal center, are large lymphocytes with a euchromatic nucleus. cell division of these cells produces additional lymphocytes, which accumulate around the darker staining periphery of the nodule.': 'CORRETO. Os imunoblastos, presentes no centro germinativo, são linfócitos grandes de núcleo eucromático. Sua divisão gera novos linfócitos, que se acumulam na periferia mais escura do nódulo.',
  'correct. in a muscular artery, as in all arteries, the tunica media forms the largest portion of the vessel wall. in a muscular artery (seen here), this tunic is composed of smooth muscle cells, which are oriented circularly around the lumen.': 'CORRETO. Na artéria muscular, como em toda artéria, a túnica média é a maior parte da parede. Nesta imagem, ela é formada por células musculares lisas dispostas circularmente ao redor da luz.',
  'correct. in a muscular artery, the tunica media forms the largest portion of the vessel wall. it is composed of smooth muscle cells, which are oriented circularly. the presence of internal and external elastic laminae is indicative of a muscular artery. arteries generally have thicker walls and narrower lumens compared with similarly sized veins.': 'CORRETO. Na artéria muscular, a túnica média é a maior parte da parede e se compõe de células musculares lisas em disposição circular. A presença das lâminas elásticas interna e externa aponta para artéria muscular. Em geral, artérias têm parede mais espessa e luz mais estreita que veias de calibre semelhante.',
  'correct. in a pseudostratified epithelium all cells rest on the basement membrane, however they are of differing heights with some that reach the free surface and others that do not. it appears stratified, hence the classification “pseudostratified”, because nuclei appear at different heights. this epithelium displays the surface specialization, stereocilia.': 'CORRETO. No epitélio pseudoestratificado todas as células se apoiam na membrana basal, mas têm alturas diferentes: algumas alcançam a superfície livre e outras não. Ele parece estratificado — daí o "pseudo" — porque os núcleos se distribuem em alturas variadas. Este epitélio exibe estereocílios como especialização de superfície.',
  'correct. in arteries, the tunica media forms the largest portion of the vessel wall. except for elastic arteries, it is composed of smooth muscle cells which are oriented circularly.': 'CORRETO. Nas artérias, a túnica média é a maior parte da parede. Exceto nas artérias elásticas, ela é formada por células musculares lisas em disposição circular.',
  'correct. in hematoxylin and eosin stained sections, the cell bodies of glial cells are not well visualized. glial cells are more numerous than neurons, and their nuclei, which are generally smaller than those of neurons, are present throughout central nervous tissue.': 'CORRETO. Em cortes corados por hematoxilina e eosina, os corpos das células gliais não se distinguem bem. A glia é mais numerosa que os neurônios, e seus núcleos, em geral menores que os neuronais, aparecem por todo o tecido nervoso central.',
  'correct. in the left image, numerous, longitudinally oriented elastic fibers, typical for the respiratory system, are dispersed in the lamina propria.': 'CORRETO. Na imagem à esquerda, numerosas fibras elásticas de orientação longitudinal, típicas do sistema respiratório, estão dispersas pela lâmina própria.',
  'correct. in the zone of ossification, woven bone is deposited on the surface of the calcified cartilage spicules. the red-staining bone can be easily differentiated from the purple, calcified cartilage spicules. no osteoclasts are present, so this is not be the zone of resorption.': 'CORRETO. Na zona de ossificação, osso primário é depositado sobre a superfície das espículas de cartilagem calcificada. O osso, avermelhado, distingue-se facilmente das espículas arroxeadas. Não há osteoclastos no campo, então não se trata da zona de reabsorção.',
  'correct. in this cell the rough endoplasmic reticulum is not well developed and appears as single, isolated cisterns. the electron-dense staining is due to the presence of ribosomes attached to the cytoplasmic surface of the membranes.': 'CORRETO. Nesta célula o retículo endoplasmático rugoso é pouco desenvolvido e aparece como cisternas isoladas. A densidade eletrônica vem dos ribossomos aderidos à face citoplasmática das membranas.',
  'correct. in this cross section of a peripheral nerve, the myelin sheaths appear as densely stained rings surrounding pale-staining axons. this tissue was fixed with osmium tetroxide and, thus, the lipid-rich myelin is well preserved. clusters of smaller, unmyelinated axons are also visible.': 'CORRETO. Neste corte transversal de nervo periférico, as bainhas de mielina aparecem como anéis intensamente corados em torno de axônios pálidos. O tecido foi fixado em tetróxido de ósmio, o que preserva bem a mielina, rica em lipídio. Também se veem grupos de axônios amielínicos, menores.',
  'correct. in this germinal center, macrophages (tingible body macrophages) with phagosomes in their cytoplasm, indicate the phagocytic activity occurring in this region. these macrophages are phagocytosing apoptotic cells in various stages of degradation that occurs during immune selection. the term “tangible” refers to the fact that the phagocytosed material is stainable, mostly condensed chromatin fragments.': 'CORRETO. Neste centro germinativo, macrófagos de corpo tingível com fagossomos no citoplasma denunciam a atividade fagocítica da região. Eles estão removendo células apoptóticas em vários estágios de degradação, resultado da seleção imunológica. O nome vem justamente de o material fagocitado ser corável — em geral fragmentos de cromatina condensada.',
  'correct. in this horizontal section of the pituitary gland, the pars distalis is distinguished by its overall basophila compared with the pars nervosa above it. the pars intermedia occupies the region at the interface of these two major subdivisions. the pars distalis contains a mixture of basophils and acidophils, each with its distinctively staining secretory granules, not visible at this low magnification.': 'CORRETO. Neste corte horizontal da hipófise, a pars distalis se destaca pela basofilia geral em comparação com a pars nervosa acima dela. A pars intermedia ocupa a faixa entre as duas grandes subdivisões. A pars distalis reúne células basófilas e acidófilas, cada uma com seus grânulos de secreção característicos, que não se resolvem neste pequeno aumento.',
  'correct. in this longitudinal section of a large vein (vena cava), the circular smooth muscle of the tunica media is cut in cross section. in veins, the tunica adventitia is the dominant layer of the vessel wall. in the tunica adventitia and tunica intima, the smooth muscle runs longitudinally.': 'CORRETO. Neste corte longitudinal de veia de grande calibre (cava), o músculo liso circular da túnica média aparece seccionado transversalmente. Nas veias, a adventícia é a camada dominante da parede; nela e na íntima, o músculo liso corre longitudinalmente.',
  'correct. in this section of the proliferative uterus, the entire endometrium, with both the functional zone and the basal zone, are visible. estrogen from ovarian follicles supports this stage.': 'CORRETO. Neste corte de útero em fase proliferativa aparece o endométrio inteiro, com a camada funcional e a basal. É o estrogênio dos folículos ovarianos que sustenta esse estágio.',
  'correct. intercalated discs in this longitudinal section of cardiac muscle are very prominent. intercalated discs are complex cell junctions between adjacent cardiac muscle fibers and are unique to cardiac muscle. they provide attachment as well as ionic continuity between adjacent fibers.': 'CORRETO. Os discos intercalares saltam à vista neste corte longitudinal de músculo cardíaco. São junções celulares complexas entre fibras vizinhas, exclusivas do miocárdio, e garantem tanto a ancoragem mecânica quanto a continuidade iônica entre as fibras.',
  'correct. intercalated ducts are the smallest ducts in salivary glands and generally are smaller than the surrounding acini. they are composed of a low cuboidal epithelium. striated ducts are lined by a taller epithelium with basal striations.': 'CORRETO. Os ductos intercalares são os menores das glândulas salivares, em geral mais estreitos que os ácinos ao redor, e têm epitélio cúbico baixo. Já os ductos estriados são revestidos por epitélio mais alto, com estriações basais.',
  'correct. interlobular arteries in the cortex arise from arcuate arteries found at the junction of the renal cortex with the medulla. interlobular arteries, forming the boundaries of the renal lobule, give rise to afferent arterioles that supply each glomerulus.': 'CORRETO. As artérias interlobulares do córtex nascem das artérias arqueadas, situadas no limite entre córtex e medula. Elas delimitam o lóbulo renal e dão origem às arteríolas aferentes que irrigam cada glomérulo.',
  'correct. interlobular ducts, receiving the secretory products from multiple lobules, are located in the dense, irregular, interlobular connective tissue. these ducts often have a stratified cuboidal or stratified columnar epithelium.': 'CORRETO. Os ductos interlobulares recolhem a secreção de vários lóbulos e correm dentro do tecido conjuntivo denso não modelado interlobular. Costumam ter epitélio estratificado cúbico ou estratificado colunar.',
  'correct. intralobular ducts are surrounded by the secretory parenchyma of the gland. in some cases, a small amount of loose, intralobular connective tissue is visible. these ducts are lined by an epithelium which ranges from low cuboidal to low columnar.': 'CORRETO. Os ductos intralobulares ficam cercados pelo parênquima secretor da glândula. Às vezes se vê ao redor deles um pouco de conjuntivo frouxo intralobular. O epitélio varia de cúbico baixo a colunar baixo.',
  'correct. intralobular ducts are surrounded by the secretory parenchyma of the mammary gland and lie completely within the mammary gland lobule. these ducts eventually join others to form interlobular ducts that are surrounded by connective tissue in the interlobular stroma.': 'CORRETO. Os ductos intralobulares ficam cercados pelo parênquima secretor da mama e permanecem inteiramente dentro do lóbulo. Mais adiante confluem com outros e formam os ductos interlobulares, envolvidos pelo conjuntivo do estroma interlobular.',
  'correct. inward movement of the stapes in the oval window increases pressure in the perilymph of the vestibule, which is transmitted through scali vestibuli and scala tympani (indicated here) to be relieved by a bulging of the round window.': 'CORRETO. O movimento do estribo para dentro da janela oval aumenta a pressão da perilinfa no vestíbulo. Essa pressão se transmite pela rampa vestibular e pela rampa timpânica, indicada aqui, e é aliviada pelo abaulamento da janela redonda.',
  'correct. lacunae are small spaces in bone where osteocyte cell bodies are/were located.': 'CORRETO. As lacunas são pequenas cavidades no osso onde estão, ou estavam, os corpos celulares dos osteócitos.',
  'correct. late spermatids are completing the process of spermiogenesis, a cytomorphological differentiation from round, early spermatids to become spermatozoa. late spermatids remain attached to sertoli cells and possess a highly thin heterochromatic nucleus and elaborate a long flagellum. once released from the sertoli cell, the cells is referred as a spermatozoa.': 'CORRETO. As espermátides tardias estão concluindo a espermiogênese, a diferenciação que transforma a espermátide inicial, arredondada, em espermatozoide. Permanecem aderidas às células de Sertoli, têm núcleo muito delgado e heterocromático e já constroem um longo flagelo. Ao serem liberadas da Sertoli, passam a se chamar espermatozoides.',
  'correct. like most endocrine organs, the principal cells of the parathyroid gland are arranged in plates or cords with large numbers of capillaries between them. the main distinguishing feature of the parathyroid gland is the presence of the large oxyphil cells.': 'CORRETO. Como na maioria dos órgãos endócrinos, as células principais da paratireoide se organizam em placas ou cordões com muitos capilares entre eles. O traço que mais distingue a glândula é a presença das grandes células oxífilas.',
  'correct. like the lymph node, the spleen is entirely encapsulated; however, in the spleen, connective tissue trabeculae extend farther into the organ than do those of the lymph node. in lymph nodes, lymphoid nodules are confined to the cortex; lymphoid nodules in the spleen are present throughout the organ, forming part of the white pulp.': 'CORRETO. Como o linfonodo, o baço é inteiramente encapsulado, mas suas trabéculas de conjuntivo penetram bem mais fundo no órgão. No linfonodo os nódulos linfoides ficam restritos ao córtex; no baço eles se distribuem por todo o órgão, compondo a polpa branca.',
  'correct. lipid droplets can be found throughout the cytoplasm, occurring singly or in groups. their contents appear grainy with moderate electron density due to the osmium fixation. lipid droplets are not surrounded by a membrane and thus coalescence with neighboring droplets.': 'CORRETO. Gotículas lipídicas aparecem por todo o citoplasma, isoladas ou em grupos. Seu conteúdo tem aspecto granuloso e densidade eletrônica moderada por causa da fixação em ósmio. Não são envolvidas por membrana e, por isso, coalescem com as gotículas vizinhas.',
  'correct. loose connective tissue generally contains large numbers of cells of varying types. furthermore, the collagen fibers are of much smaller caliber than the collagen bundles present in the dense connective tissues.': 'CORRETO. O tecido conjuntivo frouxo costuma ter muitas células, de tipos variados. Além disso, suas fibras colágenas são bem mais finas que os feixes encontrados nos conjuntivos densos.',
  'correct. lymphatic tissue occurs all along the gi tract, both as diffuse lymphoid tissue and, as seen here, in discrete nodules. usually this lymphoid tissue is located in the lamina propria, although it may also invade the submucosa. in the ileum, aggregates of lymphoid nodules are called peyer\'s patches.': 'CORRETO. Tecido linfoide ocorre ao longo de todo o tubo digestório, tanto na forma difusa quanto, como aqui, em nódulos individualizados. Em geral fica na lâmina própria, mas pode invadir a submucosa. No íleo, os agregados de nódulos recebem o nome de placas de Peyer.',
  'correct. lymphocytes, small, spherical cells with minimal cytoplasm, have rounded, very heterochromatic nuclei. lymphocytes are agranular white blood cells transported via the blood, but are active only after entering connective tissue. lymphocytes function in the immune response; some differentiate into plasma cells and produce antibodies.': 'CORRETO. Os linfócitos são células pequenas e esféricas, de citoplasma escasso e núcleo redondo intensamente heterocromático. São leucócitos agranulares transportados pelo sangue, mas só entram em atividade depois de alcançar o tecido conjuntivo. Atuam na resposta imune, e alguns se diferenciam em plasmócitos e produzem anticorpos.',
  'correct. lysosomes are organelles that contain hydrolytic enzymes and are surrounded by a single membrane. the contents of a lysosome can appear highly heterogeneous depending on the type of material that is being broken down. lysosomes form by the fusion of golgi-derived, pre-lysosomal vesicles with either internalized materials or autophagosomes.': 'CORRETO. Os lisossomos são organelas com enzimas hidrolíticas, delimitadas por uma única membrana. Seu conteúdo pode parecer muito heterogêneo, conforme o material que está sendo digerido. Formam-se pela fusão de vesículas pré-lisossômicas vindas do Golgi com material internalizado ou com autofagossomos.',
  'correct. macrophages are present among the numerous lymphocytes in the subcapsular sinus of the lymph node. macrophages can be distinguished by their larger nuclei, the presence of phagocytosed material in their cytoplasm and ruffled cell borders.': 'CORRETO. Há macrófagos entre os numerosos linfócitos do seio subcapsular do linfonodo. Reconhecem-se pelo núcleo maior, pelo material fagocitado no citoplasma e pelas bordas celulares pregueadas.',
  'correct. macrophages are the major phagocytic cell in connective tissue. the macrophage nucleus has a prominent indentation, reflective of its origin as a monocyte, and accumulations of heterochromatin beneath the nuclear envelope. macrophages process, folds and plasma membrane ruffling are prominent. numerous heterogeneous lysosomes are also visible.': 'CORRETO. O macrófago é a principal célula fagocítica do tecido conjuntivo. Seu núcleo tem uma indentação marcada, herança da origem monocítica, e blocos de heterocromatina sob o envoltório nuclear. Prolongamentos, dobras e pregueamento da membrana plasmática são evidentes, assim como numerosos lisossomos heterogêneos.',
  'correct. macrophages are the next most common cell present in connective tissue, after fibroblasts. macrophages have an oval nucleus, which is smaller than that of an active fibroblast, prominent heterochromatin located adjacent to the nuclear envelope, and an indentation in the nuclear envelope, reflecting its origin from a monocyte.': 'CORRETO. Depois do fibroblasto, o macrófago é a célula mais comum do tecido conjuntivo. Tem núcleo oval, menor que o de um fibroblasto ativo, com heterocromatina abundante junto ao envoltório e uma indentação característica que denuncia sua origem monocítica.',
  'correct. many of the components of the interalveolar septum are shown. the attenuation of type i cell cytoplasm and the protrusion of the capillaries are most evident. surfactant is not preserved during fixation of lung tissue, and no septal cells nor macrophages are present in this image.': 'CORRETO. Vários componentes do septo interalveolar estão visíveis. O que mais se destaca é a extrema delgadeza do citoplasma do pneumócito tipo I e a protrusão dos capilares. O surfactante não se preserva na fixação do pulmão, e não há pneumócitos tipo II nem macrófagos nesta imagem.',
  'correct. mast cells have large numbers of granules in their cytoplasm, which are clearly seen in this electron micrograph. the nucleus is spherical and can be located in the center or the periphery of the cell.': 'CORRETO. Os mastócitos têm grande quantidade de grânulos no citoplasma, bem visíveis nesta eletromicrografia. O núcleo é esférico e pode estar no centro ou na periferia da célula.',
  'correct. mast cells have large numbers of uniformly sized granules in their cytoplasm, which can stain with either hematoxylin or eosin depending on the contents of the granule. the nucleus is spherical and can either be located in the center of the cell or toward the periphery.': 'CORRETO. Os mastócitos têm muitos grânulos de tamanho uniforme no citoplasma, que podem corar tanto pela hematoxilina quanto pela eosina, dependendo do conteúdo. O núcleo é esférico e ocupa o centro ou a periferia da célula.',
  'correct. meissner\'s corpuscles, encapsulated sensory receptors located in connective tissue dermal papillae of skin beneath the epithelium (epidermis), provide fine touch discrimination and are most concentrated in finger tips and lips. these corpuscles consist of schwann cells, spiraling like a spring around an unmyelinated sensory axon. deformation of the spring generates action potentials in the axon.': 'CORRETO. Os corpúsculos de Meissner são receptores sensoriais encapsulados alojados nas papilas dérmicas de conjuntivo, logo abaixo da epiderme. Respondem pelo tato discriminativo fino e se concentram na polpa dos dedos e nos lábios. São feitos de células de Schwann enroladas como mola em torno de um axônio sensitivo amielínico; deformar essa mola gera potenciais de ação no axônio.',
  'correct. melanocytes are most often found in the stratum basale and, to a lesser extent, in the stratum spinosum. these cells often show a clear cytoplasm. melanocytes synthesize melanin, package it into melanosomes and then pass them into neighboring cells of the stratum basale.': 'CORRETO. Os melanócitos ficam sobretudo na camada basal e, em menor número, na espinhosa. Costumam exibir citoplasma claro. Sintetizam melanina, empacotam-na em melanossomos e os transferem para os queratinócitos vizinhos da camada basal.',
  'correct. microtubules are the hollow only cytoskeletal element, shaped like a soda straw. they provide a network within the cell for intracellular transport. in dividing cells, microtubules form the mitotic spindle. in addition, microtubules form aggregate structures, centrioles, basal bodies and the axoneme of cilia and flagella.': 'CORRETO. Os microtúbulos são o único elemento oco do citoesqueleto, com formato de canudo. Formam a malha sobre a qual ocorre o transporte intracelular. Em células em divisão, montam o fuso mitótico. Também se agrupam em estruturas maiores: centríolos, corpúsculos basais e o axonema de cílios e flagelos.',
  'correct. microvilli are extensions of the plasma membrane, that are approximately 1.0 micron in height. they contain a core of actin microfilaments and serve to increase surface area. when microvilli occur across the entire free surface of a cell (as seen here), they form a brush, or striated, border.': 'CORRETO. As microvilosidades são projeções da membrana plasmática com cerca de 1 µm de altura. Têm eixo de microfilamentos de actina e servem para ampliar a área de superfície. Quando cobrem toda a face livre da célula, como aqui, formam a borda em escova, ou estriada.',
  'correct. mitochondria are composed of an inner and an outer membrane, the inner membrane has shelf-like or tubular folds called cristae. mitochondrial shape and size can be highly variable and reflects the metabolic requirements of the cell. it is estimated that each liver cell (seen here) has over 800 mitochondria.': 'CORRETO. A mitocôndria tem duas membranas; a interna forma dobras em prateleira ou tubulares, as cristas. Forma e tamanho variam bastante e refletem a demanda metabólica da célula. Estima-se que cada hepatócito, como os desta imagem, tenha mais de 800 mitocôndrias.',
  'correct. monocyte are the largest circulating white blood cells and are characterized by a pale-staining, horseshoe-shaped nucleus and slightly basophilic cytoplasm. monocytes leave the blood and enter the tissue, where they transform into macrophages.': 'CORRETO. O monócito é o maior leucócito circulante e se caracteriza pelo núcleo pálido em forma de ferradura e pelo citoplasma discretamente basófilo. Deixa o sangue, entra no tecido e ali se transforma em macrófago.',
  'correct. mucous connective tissue is composed of fibroblast-like cells, which can be spindle or stellate shaped. they produce the surrounding, abundant, gelatinous ground substance (wharton\'s jelly) and delicate collagen and reticular fibers.': 'CORRETO. O tecido conjuntivo mucoso é formado por células semelhantes a fibroblastos, fusiformes ou estreladas. São elas que produzem a abundante substância fundamental gelatinosa ao redor — a geleia de Wharton — e as delicadas fibras colágenas e reticulares.',
  'correct. myoepithelial cells are octopus-shaped cells that lie just inside the basement membrane of the sweat gland. these cells contain contractile filaments; the contraction of myoepithelial cells aids in the expulsion of the secretory product of the gland.': 'CORRETO. As células mioepiteliais têm forma de polvo e se alojam logo por dentro da membrana basal da glândula sudorípara. Contêm filamentos contráteis, e sua contração ajuda a expulsar o produto da glândula.',
  'correct. myofibrils are longitudinally-oriented in the sarcoplasm of striated muscle. thus in cross section they appear as small circular dots. myofibrils consist of longitudinally-oriented myofilaments. in this section of skeletal muscle, note also the peripherally-located nuclei.': 'CORRETO. As miofibrilas correm longitudinalmente no sarcoplasma do músculo estriado, e por isso aparecem como pontinhos circulares em corte transversal. Elas próprias são feitas de miofilamentos longitudinais. Neste corte de músculo esquelético, note também os núcleos na periferia da fibra.',
  'correct. neutrophils, or polymorphonuclear (pmn) leucocytes, are highly motile, phagocytic white blood cells that migrate from the blood to sites of tissue damage and infection. each cell has a distinctive, 3-5 lobed nucleus. its numerous granules are not visible with hematoxylin and eosin staining.': 'CORRETO. Os neutrófilos, ou leucócitos polimorfonucleares, são células muito móveis e fagocíticas que migram do sangue para os focos de lesão e infecção. Cada um tem o núcleo característico de três a cinco lobos. Seus numerosos grânulos não se resolvem em hematoxilina e eosina.',
  'correct. new bone is deposited on internal bony surfaces by an endosteum possessing active osteoblasts. this forming osteon is lined by such an endosteum and is depositing new bony lamellae on pre-existing bone.': 'CORRETO. Osso novo é depositado sobre as superfícies internas por um endósteo com osteoblastos ativos. Este ósteon em formação é forrado por esse endósteo e está depositando novas lamelas sobre o osso preexistente.',
  'correct. nissl bodies (nissl substance) consists of large aggregations of rough endoplasmic reticulum and polysomes in neurons, hence the intense basophilic staining. this arrangement of protein synthetic organelles is unique to neurons and thus the term nissl is used only for neurons.': 'CORRETO. Os corpúsculos de Nissl, ou substância de Nissl, são grandes agregados de retículo endoplasmático rugoso e polissomos dentro do neurônio — daí a basofilia intensa. Esse arranjo de organelas de síntese proteica é exclusivo dos neurônios, e por isso o termo só se aplica a eles.',
  'correct. olfactory epithelium (classified as pseudostratified columnar with cilia) of the olfactory region in the nose is much thicker than is respiratory epithelium, seen on the opposite surface. in addition to the usual epithelial cells, bipolar neurons are also present. their nuclei are located in the middle of the epithelium with nuclei of supporting cells above and those of basal cells below the neuronal nuclei.': 'CORRETO. O epitélio olfatório, classificado como pseudoestratificado colunar ciliado, é bem mais espesso que o epitélio respiratório visível na superfície oposta. Além das células epiteliais habituais, ele contém neurônios bipolares, cujos núcleos ocupam a faixa média do epitélio — com os núcleos das células de sustentação acima e os das células basais abaixo.',
  'correct. osteoclasts, large cells with multiple nuclei and pink-staining cytoplasm, breakdown (resorb) bone. osteoclasts, not related to osteoblasts or osteocytes, lie in the endosteum on external and internal bony surfaces.': 'CORRETO. Os osteoclastos são células grandes, multinucleadas e de citoplasma acidófilo, responsáveis por degradar (reabsorver) o osso. Não pertencem à mesma linhagem dos osteoblastos e osteócitos, e assentam no endósteo das superfícies ósseas externas e internas.',
  'correct. osteocytes are osteoblasts that have completely surrounded themselves with bony matrix. in this woven bone they show a random arrangement and more rounded lacunae than they would in mature, lamellar bone.': 'CORRETO. Os osteócitos são osteoblastos que se cercaram completamente de matriz óssea. Neste osso primário eles se distribuem sem orientação definida e ocupam lacunas mais arredondadas do que teriam no osso lamelar maduro.',
  'correct. osteoid, the organic matrix, is deposited first during bone formation and appears as a narrow, pale strip on the bone surface beneath active osteoblasts. the inorganic matrix is deposited in the osteoid.': 'CORRETO. O osteoide, a matriz orgânica, é depositado primeiro na formação óssea e aparece como uma faixa fina e pálida sobre a superfície do osso, logo abaixo dos osteoblastos ativos. É nele que a matriz inorgânica se deposita em seguida.',
  'correct. oxyphil cells are the minor cell type in the parathyroid gland. they are larger than the principal cells and have abundant cytoplasm that contains numerous mitochondria.': 'CORRETO. As células oxífilas são a população minoritária da paratireoide. São maiores que as células principais e têm citoplasma abundante, repleto de mitocôndrias.',
  'correct. paired sister chromatids are tightly aligned in the center of the cell forming the metaphase plate. though not visible in these examples, the spindle apparatus composed of microtubules are present, as are two diplosomes at opposite ends of the spindle.': 'CORRETO. Os pares de cromátides irmãs estão firmemente alinhados no centro da célula, formando a placa metafásica. Embora não apareçam nestes exemplos, o fuso de microtúbulos está presente, assim como os dois diplossomos nos polos opostos.',
  'correct. paneth cells are located in intestinal glands, usually toward their base. the prominent, large red granules contain lysozyme and other bacteriostatic molecules. these granules are oriented toward the lumen of the gland, indicating their exocrine function.': 'CORRETO. As células de Paneth ficam nas glândulas intestinais, em geral no fundo delas. Seus grânulos grandes e intensamente avermelhados contêm lisozima e outras moléculas bacteriostáticas, e estão voltados para a luz da glândula — sinal de função exócrina.',
  'correct. parafollicular or clear cells in the thyroid gland are located both in the interfollicular connective tissue and the follicle epithelium. these cells secrete calcitonin in response to elevated blood calcium levels.': 'CORRETO. As células parafoliculares, ou células claras, da tireoide ocupam tanto o conjuntivo interfolicular quanto o próprio epitélio do folículo. Secretam calcitonina em resposta à elevação do cálcio sanguíneo.',
  'correct. patency of the trachea and primary bronchi is maintained by a series of hyaline cartilage rings. as bronchi decrease in diameter to become secondary bronchi, the rings are replaced by hyaline cartilage plates, as seen here. a perichondrium surrounds each plate.': 'CORRETO. A traqueia e os brônquios principais se mantêm abertos graças a uma série de anéis de cartilagem hialina. À medida que o calibre diminui e se chega aos brônquios lobares, os anéis dão lugar a placas de cartilagem hialina, como nesta imagem. Cada placa é envolvida por pericôndrio.',
  'correct. pigment epithelium constitutes the outermost layer of the retina and consists of a simple cuboidal epithelium with melanin granules. pigment epithelial cells phagocytose worn-out components of photoreceptors, absorb light passing through the retina to prevent reflection, and form the blood-retinal barrier. the basal lamina of this epithelium is a component of bruch\'s membrane.': 'CORRETO. O epitélio pigmentar é a camada mais externa da retina: um epitélio simples cúbico carregado de grânulos de melanina. Suas células fagocitam as porções gastas dos fotorreceptores, absorvem a luz que atravessa a retina para evitar reflexão e compõem a barreira hematorretiniana. Sua lâmina basal faz parte da membrana de Bruch.',
  'correct. pituicytes are modified astrocytes that are found throughout the infundibulum and pars nervosa. in addition to the herring bodies, the other major structures seen in this section are the numerous, small-caliber axons of hypothalamic neurons.': 'CORRETO. Os pituícitos são astrócitos modificados espalhados pelo infundíbulo e pela pars nervosa. Além dos corpos de Herring, as outras estruturas dominantes neste corte são os numerosos axônios de pequeno calibre vindos dos neurônios hipotalâmicos.',
  'correct. plasma cells are distinguished by a \'clock-face\' arrangement of heterochromatin around the nuclear envelope and a prominent \'negative golgi\' image near the nucleus. the well-developed golgi membranes do not stain and, therefore, this region appears pale. the peripheral cytoplasm of plasma cells is highly basophilic, due to the large amount of rough endoplasmic reticulum.': 'CORRETO. O plasmócito se reconhece pela heterocromatina disposta em "mostrador de relógio" junto ao envoltório nuclear e pela imagem negativa do Golgi ao lado do núcleo: as membranas do complexo, bem desenvolvidas, não se coram, e a região aparece pálida. O citoplasma periférico é intensamente basófilo pela grande quantidade de retículo endoplasmático rugoso.',
  'correct. plicae palmatae are secretory folds of the cervical epithelium that secrete mucus. the quantity and consistency of the mucus changes during the menstrual cycle under the influence of the ovarian hormones.': 'CORRETO. As pregas palmadas são dobras secretoras do epitélio cervical que produzem muco. A quantidade e a consistência desse muco variam ao longo do ciclo menstrual sob influência dos hormônios ovarianos.',
  'correct. podocytes form the visceral layer of bowman\'s capsule and lie directly on the basal lamina of the endothelial cells of the glomerulus. podocytes can be distinguished from endothelial cells because they face bowman\'s space, rather than the lumen of the capillary.': 'CORRETO. Os podócitos formam o folheto visceral da cápsula de Bowman e assentam diretamente sobre a lâmina basal do endotélio glomerular. Distinguem-se das células endoteliais porque estão voltados para o espaço de Bowman, e não para a luz do capilar.',
  'correct. polysomes, or polyribosomes, are clusters of ribosomes arranged as circles or spirals, which are threaded onto a single messenger rna molecule (not resolved in this image). ribosomes are electron dense and approximately one-fourth the size of glycogen granules. proteins synthesized on polysomes are used within the cell.': 'CORRETO. Polissomos, ou poliribossomos, são conjuntos de ribossomos dispostos em círculo ou espiral, enfileirados sobre uma única molécula de RNA mensageiro, que não se resolve nesta imagem. Os ribossomos são elétron-densos e têm cerca de um quarto do tamanho dos grânulos de glicogênio. As proteínas sintetizadas em polissomos livres são de uso interno da célula.',
  'correct. primary lymphoid nodules are clusters of lymphoid cells located as solitary nodules in the lamina propria of tubular organs (as here) and as aggregates in tonsils and peyer\'s patches. a primary lymphoid nodule consist mostly of small lymphocytes aggregated in the lamina propria and filter tissue fluid. the absence of a pale, germinal center distinguishes this primary nodule from a secondary nodule.': 'CORRETO. Os nódulos linfoides primários são agrupamentos de células linfoides que aparecem isolados na lâmina própria de órgãos tubulares, como aqui, ou reunidos em tonsilas e placas de Peyer. Consistem sobretudo em linfócitos pequenos agregados na lâmina própria, e filtram o fluido tecidual. A ausência de um centro germinativo pálido é o que separa o nódulo primário do secundário.',
  'correct. prophase is the initial phase of mitosis. the replicated chromosomes are highly condensed and clearly evident, appearing randomly distributed. the nuclear envelope and nucleolus have disappeared at this stage. during prophase, diplosomes migrate to opposite poles of the nucleus.': 'CORRETO. A prófase é a primeira fase da mitose. Os cromossomos já replicados estão muito condensados e bem visíveis, distribuídos sem ordem aparente. Nesse estágio o envoltório nuclear e o nucléolo já desapareceram, e os diplossomos migram para polos opostos.',
  'correct. prostatic concretions (seen in the image on the right) are diagnostic for the prostate. they are composed of glycoprotein and calcify with age. the epithelium lining the glands is pseudostratified with stereocilia.': 'CORRETO. As concreções prostáticas, visíveis na imagem à direita, identificam a próstata. São feitas de glicoproteína e se calcificam com a idade. O epitélio que reveste as glândulas é pseudoestratificado com estereocílios.',
  'correct. pseudounipolar neurons are exclusively sensory neurons that are mostly located in the peripheral nervous system. the cell body is spherical; the single process that emerges from the cell body bifurcates to form a central and peripheral axon.': 'CORRETO. Os neurônios pseudounipolares são exclusivamente sensitivos e ficam sobretudo no sistema nervoso periférico. O corpo celular é esférico, e o único prolongamento que dele parte se bifurca em um ramo central e um periférico, ambos com comportamento de axônio.',
  'correct. renal pyramids are subdivisions of the renal medulla that contain portions of the renal tubules, portions of the collecting ducts, and the ducts of bellini. renal pyramids project into the renal pelvis where they are covered by a minor calyx. the tip of the pyramid is termed the papilla.': 'CORRETO. As pirâmides renais são subdivisões da medula e contêm porções dos túbulos renais, dos ductos coletores e os ductos de Bellini. Projetam-se para dentro da pelve renal, onde são abraçadas por um cálice menor. O ápice da pirâmide é a papila.',
  'correct. resorption canals have irregular outlines, contain a blood vessel, and are lined with an endosteum containing osteoclasts. they have no concentric lamellae. these canals form the eroding tips of columnar-shaped remodeling units, which are oriented parallel to the long axis of the bone.': 'CORRETO. Os canais de reabsorção têm contorno irregular, contêm um vaso e são forrados por endósteo com osteoclastos. Não possuem lamelas concêntricas. São a ponta escavadora das unidades de remodelação, cilíndricas e orientadas paralelamente ao eixo longo do osso.',
  'correct. reticular connective tissue is composed of a meshwork of reticular fibers that forms the stroma for hemopoietic tissues and lymphoid structures and organs, except the thymus. reticular fibers are composed of collagen type iii and are unique from type i collagen fibers in that they branch and require special stains to be identified; silver (seen here) or periodic acid schiff (pas).': 'CORRETO. O tecido conjuntivo reticular é uma malha de fibras reticulares que serve de estroma aos tecidos hemocitopoéticos e aos órgãos linfoides — com exceção do timo. As fibras reticulares são de colágeno tipo III e se diferenciam das de tipo I por se ramificarem e por só aparecerem com colorações especiais: prata, usada aqui, ou PAS.',
  'correct. rough endoplasmic reticulum is well developed in this cell and appears as multiple, stacked cisterns. the electron-dense staining is due to the presence of ribosomes attached to the cytoplasmic surface of the membranes.': 'CORRETO. O retículo endoplasmático rugoso é bem desenvolvido nesta célula e aparece como cisternas múltiplas e empilhadas. A densidade eletrônica vem dos ribossomos aderidos à face citoplasmática das membranas.',
  'correct. schwann cells are only found in the peripheral nervous system where they either surround axons or, as seen here, surround neuronal cells bodies. in this location, they are called satellite schwann cells.': 'CORRETO. As células de Schwann só existem no sistema nervoso periférico, onde envolvem axônios ou, como nesta imagem, corpos celulares de neurônios. Nessa posição elas recebem o nome de células satélites.',
  'correct. schwann cells are the supporting cells in the peripheral nervous system. they surround and myelinate axons in peripheral nerves, as shown here. in ganglia, they surround neuronal cell bodies, where they are called satellite schwann cells.': 'CORRETO. As células de Schwann são a glia do sistema nervoso periférico. Nos nervos, envolvem e mielinizam os axônios, como se vê aqui. Nos gânglios, envolvem corpos celulares de neurônios e passam a se chamar células satélites.',
  'correct. sebaceous glands are most often associated with hair follicles and, thus, do not occur in thick skin. these glands are simple branched acinar glands that secrete a thick oily material, sebum, onto the hair shaft, as well as distributing the sebum onto the skin surface via the hair follicles. sebum is released by the holocrine mode of secretion.': 'CORRETO. As glândulas sebáceas quase sempre acompanham folículos pilosos e, por isso, não existem na pele espessa. São glândulas acinares simples ramificadas que lançam sobre a haste do pelo um material oleoso e espesso, o sebo, distribuído à superfície da pele pelo próprio folículo. A liberação se dá por secreção holócrina.',
  'correct. secretory vesicles are distinct, membrane-enclosed structures in the cytoplasm of secretory cells. in the exocrine pancreas, shown here, large numbers of secretory granules accumulate at the apex of the cell. secretory granules can vary in their staining properties, depending on the contents of the granules.': 'CORRETO. As vesículas de secreção são estruturas nítidas, delimitadas por membrana, no citoplasma das células secretoras. No pâncreas exócrino, mostrado aqui, grande quantidade de grânulos se acumula no ápice celular. Suas propriedades tintoriais variam conforme o conteúdo.',
  'correct. serous demilunes consist of a cap of serous-secreting cells at the end of a mucous tubule. the secretory products of these cells pass into the lumen of the tubule.': 'CORRETO. A semilua serosa é uma calota de células secretoras serosas na extremidade de um túbulo mucoso. O produto dessas células é lançado na luz do próprio túbulo.',
  'correct. skeletal muscle fibers are unbranched cylinders with multiple, peripherally-located nuclei. also visible are the heavy cross striations.': 'CORRETO. As fibras musculares esqueléticas são cilindros não ramificados, com vários núcleos na periferia. Também se veem aqui as marcadas estriações transversais.',
  'correct. smooth endoplasmic reticulum, well developed in this steroid-secreting cell, consists of a membranous network of tubules lacking ribosomes. smooth endoplasmic reticulum is distinguished from the golgi, which also has smooth membranes, but is organized as stacks of cisternae. ser is the major site of lipid and cholesterol synthesis.': 'CORRETO. O retículo endoplasmático liso, bem desenvolvido nesta célula secretora de esteroides, é uma rede membranosa de túbulos sem ribossomos. Distingue-se do Golgi, que também tem membranas lisas mas se organiza em pilhas de cisternas. É o principal sítio de síntese de lipídios e colesterol.',
  'correct. smooth muscle reaches it greatest relative thickness in the bronchioles and is present as a meshwork of tissue embedded in the passageway. the contraction of the thick smooth muscle layer produced the folding typical in the lining of this passageway.': 'CORRETO. O músculo liso atinge sua maior espessura relativa nos bronquíolos, onde forma uma malha embutida na parede da via. Foi a contração dessa camada espessa que produziu o pregueamento típico do revestimento desta passagem.',
  'correct. spiral arteries are "cork-screw" shaped vessels that emerge at the junction of the basal and functional layers of the endometrium and extend into the functional layer. because of their spiral configuration, spiral arteries appear as clusters of isolated, tubular profiles when sectioned longtitudinally.': 'CORRETO. As artérias espiraladas têm formato de saca-rolhas, surgem no limite entre a camada basal e a funcional do endométrio e sobem pela funcional. Por causa dessa configuração, aparecem como grupos de perfis tubulares isolados mesmo quando o corte é longitudinal.',
  'correct. spleen is differentiated from lymph node and thymus because it lacks the cortex and medulla these organs possess. lymphoid nodules, part of white pulp, are scattered throughout the spleen; their distinguishing feature is their central arteriole, which is displaced toward the margin when a nodule develops within the pals surrounding the arteriole.': 'CORRETO. O baço se diferencia do linfonodo e do timo por não ter a divisão em córtex e medula desses órgãos. Seus nódulos linfoides, parte da polpa branca, espalham-se por todo o parênquima, e a marca deles é a arteríola central — deslocada para a margem quando o nódulo se desenvolve dentro da bainha linfoide periarteriolar.',
  'correct. stereocilia are actually tall microvilli, not cilia. they extend into the lumen of the epididymis and aid in absorption of the some of the luminal contents. like microvilli, they are supported by a core of actin filaments.': 'CORRETO. Os estereocílios são, na verdade, microvilosidades altas, e não cílios. Projetam-se na luz do epidídimo e ajudam a absorver parte do conteúdo luminal. Como toda microvilosidade, são sustentados por um eixo de filamentos de actina.',
  'correct. stria vascularis, along with related cells in the maculae and cristae ampullares, produces endolymph. the stria vascularis, an epithelium located on the outer wall of the cochlear duct, is unique in that it is the only vascularized epitheliium in mammals.': 'CORRETO. A estria vascular, junto com células aparentadas das máculas e das cristas ampulares, produz a endolinfa. Situada na parede externa do ducto coclear, ela é singular por ser o único epitélio vascularizado dos mamíferos.',
  'correct. the a-band is formed by the overlap of myosin and actin myofilaments and, thus, appears darker than the adjacent i bands, which contain actin myofilaments only.': 'CORRETO. A banda A resulta da sobreposição dos miofilamentos de miosina e actina e, por isso, aparece mais escura que as bandas I vizinhas, que contêm apenas miofilamentos de actina.',
  'correct. the a-band is formed by the overlap of the myosin and actin myofilaments and, thus, appears darker than the adjacent i bands, which contain actin only.': 'CORRETO. A banda A resulta da sobreposição dos miofilamentos de miosina e actina e, por isso, aparece mais escura que as bandas I vizinhas, que contêm apenas actina.',
  'correct. the golgi apparatus consists of flattened membranous sacs (cisterns) and vesicles and is usually located near the nucleus. though resembling rough endoplasmic reticulum, golgi is distinguished by the lack of ribosomes. multiple golgi are present in this cell.': 'CORRETO. O complexo de Golgi é formado por sacos membranosos achatados (cisternas) e vesículas, e costuma ficar próximo ao núcleo. Embora se pareça com o retículo endoplasmático rugoso, distingue-se dele pela ausência de ribossomos. Esta célula tem vários complexos de Golgi.',
  'correct. the z-line marks the boundaries of each sarcomere and serves as the attachment point for actin myofilaments.': 'CORRETO. A linha Z delimita cada sarcômero e serve de ponto de ancoragem para os miofilamentos de actina.',
  'correct. the acinus is a spherical structure composed of pyramidal-shaped cells and forms the basic secretory unit of some glands. in this case, this acinus produces a serous product, as evidenced by the presence of distinct secretory granules, and the individual cells release their secretory product by the merocrine mode of section. two pale-staining interlobular ducts are also visible.': 'CORRETO. O ácino é uma estrutura esférica de células piramidais e constitui a unidade secretora básica de algumas glândulas. Este produz secreção serosa, como mostram os grânulos bem definidos, e suas células liberam o produto por secreção merócrina. Também se veem dois ductos interlobulares de coloração pálida.',
  'correct. the adrenal medulla forms the core of the adrenal gland and is composed of modified neurons called chromaffin cells. large veins, also located in the medulla, drain blood from the entire gland.': 'CORRETO. A medula forma o miolo da suprarrenal e é composta por neurônios modificados, as células cromafins. Veias de grande calibre, também alojadas na medula, drenam o sangue de toda a glândula.',
  'correct. the afferent arteriole supplies the glomerulus and can only be positively identified when it is seen as part of the juxtaglomerular complex, as seen here. the afferent arteriole is larger than the efferent arteriole, and this size differential results in elevated blood pressure in the glomerulus, thereby aiding in the formation of the glomerular filtrate.': 'CORRETO. A arteríola aferente irriga o glomérulo e só pode ser identificada com segurança quando aparece como parte do aparelho justaglomerular, como nesta imagem. Ela é mais calibrosa que a eferente, e essa diferença mantém a pressão elevada dentro do glomérulo — condição para a formação do filtrado.',
  'correct. the ampulla of the oviduct (seen here) is characterized by numerous, branching folds of the mucosa. the lining epithelium is highly ciliated to propel the oocyte and also contains peg cells, whose secretory product nourishes the oocyte.': 'CORRETO. A ampola da tuba uterina, mostrada aqui, caracteriza-se pelas numerosas pregas ramificadas da mucosa. O epitélio de revestimento é muito ciliado, para impulsionar o oócito, e contém também células em tacha, cuja secreção o nutre.',
  'correct. the annulus fibrosus lies at the junction of the membranous septum and the atrioventricular valve. this ring of dense connective tissue is the part of the cardiac skeleton that encircles each valve. the annulus provides support for that valve and anchorage for the insertion of cardiac muscle fibers. the connective tissue core of each valve leaflet is continuous with the annulus fibrosus.': 'CORRETO. O ânulo fibroso fica na junção entre o septo membranáceo e a valva atrioventricular. Esse anel de tecido conjuntivo denso é a parte do esqueleto cardíaco que circunda cada valva, dando-lhe sustentação e servindo de ancoragem para a inserção das fibras miocárdicas. O eixo conjuntivo de cada cúspide se continua com o ânulo.',
  'correct. the anterior chamber is bounded by the cornea, iris and anterior surface of the lens. the chamber is filled with aqueous humor, a watery fluid produced by the ciliary body. aqueous humor flows through the posterior chamber into the anterior chamber and exits at the limbus via the trabecular meshwork and the canal of schlemm.': 'CORRETO. A câmara anterior é delimitada pela córnea, pela íris e pela face anterior do cristalino, e está preenchida por humor aquoso, líquido produzido pelo corpo ciliar. O aquoso passa da câmara posterior para a anterior e sai no limbo, pela rede trabecular e pelo canal de Schlemm.',
  'correct. the arachnoid membrane is located between the dura mater and the pia mater. it encloses a space called the subarachnoid space, which contains cerebrospinal fluid.': 'CORRETO. A aracnoide fica entre a dura-máter e a pia-máter e delimita o espaço subaracnóideo, preenchido por líquido cefalorraquidiano.',
  'correct. the atrioventricular bundle lies in the connective tissue beneath the endocardium. the a-v bundle divides to form the right and left bundle branches. purkinje cells, modified cardiac muscle fibers, leave the bundle branches to supply the cardiac muscle fibers of the myocardium.': 'CORRETO. O feixe atrioventricular corre no tecido conjuntivo logo abaixo do endocárdio e se divide nos ramos direito e esquerdo. Das ramificações partem as células de Purkinje, cardiomiócitos modificados, que levam o impulso às fibras contráteis do miocárdio.',
  'correct. the atrioventricular valves are composed of a central core of dense connective tissue covered on both sides by endothelium. the connective tissue core of each the valve is attached to the annulus fibrosus for that valve. the annulus fibrosus is a component of the fibrous skeleton of the heart.': 'CORRETO. As valvas atrioventriculares têm um eixo central de tecido conjuntivo denso revestido dos dois lados por endotélio. Esse eixo se prende ao ânulo fibroso correspondente, que por sua vez faz parte do esqueleto fibroso do coração.',
  'correct. the axon of a neuron can be distinguished from dendrites by its lack of nissl and by the fact that it originates from a nissl-free region of the cell body called the axon hillock.': 'CORRETO. O axônio se distingue dos dendritos por não conter substância de Nissl e por emergir de uma região do corpo celular igualmente livre de Nissl, o cone de implantação.',
  'correct. the basilar membrane is a layer underlying the organ of corti, supporting it and separating it from the scala tympani below.': 'CORRETO. A membrana basilar é a lâmina sobre a qual assenta o órgão de Corti: sustenta-o e o separa da rampa timpânica, situada abaixo.',
  'correct. the central region of a lymph node is termed the medulla and contains medullary cords and medullary sinuses. these sinuses receive lymph which has percolated through the cortex.': 'CORRETO. A região central do linfonodo é a medula, formada por cordões e seios medulares. Esses seios recebem a linfa que já percolou pelo córtex.',
  'correct. the central vein lies at the center of the classic liver lobule and receives blood from the liver sinusoids. central veins anastomose to form the hepatic veins which exit the liver.': 'CORRETO. A veia centrolobular ocupa o centro do lóbulo hepático clássico e recebe o sangue dos sinusoides. As veias centrolobulares se anastomosam e formam as veias hepáticas, que deixam o fígado.',
  'correct. the cervix is the lower, cylindrical portion of the uterus and contains the endocervical canal. the lower part of the cervix extends into the vagina as the ectocervix. the abrupt junction of the simple columnar epithelium of the endocervical canal with the stratified squamous moist epithelium of the vaginal portion of the cervix is the external os. the endocervical canal is lined by a simple columnar epithelium with mucus-secreting glands or folds called plica palmatae.': 'CORRETO. O colo é a porção inferior e cilíndrica do útero e aloja o canal endocervical. Sua parte mais baixa se projeta na vagina como ectocérvice. A transição abrupta entre o epitélio simples colunar do canal endocervical e o estratificado pavimentoso não queratinizado da porção vaginal é o orifício externo. O canal endocervical é revestido por epitélio simples colunar com glândulas mucosas e pregas chamadas pregas palmadas.',
  'correct. the chondrogenic layer of the perichondrium is interposed between the fibrous layer and cartilage tissue proper. this layer contains chondroblasts lying adjacent to the cartilage. chondroblasts surround themselves with cartilage matrix, thus becoming chondrocytes and increasing the thickness of the cartilage by appositional growth.': 'CORRETO. A camada condrogênica do pericôndrio fica entre a camada fibrosa e a cartilagem propriamente dita, e contém os condroblastos encostados na peça. Eles se cercam de matriz, tornam-se condrócitos e engrossam a cartilagem por crescimento aposicional.',
  'correct. the chorionic plate is composed of fetal tissue and is located outside the amnion surrounding the fetus. it is composed of fetal connective tissue covered by trophoblast. fetal blood vessels penetrate the chorionic plate to enter the chorionic villi.': 'CORRETO. A placa coriônica é tecido fetal e fica por fora do âmnio que envolve o feto. Compõe-se de conjuntivo fetal recoberto por trofoblasto. Os vasos fetais atravessam essa placa para alcançar as vilosidades coriônicas.',
  'correct. the choroid forms the majority of the vascular or middle tunic (uvea), covering the posterior portion of the eye. the choroid is composed of loose connective tissue, with an abundant vascular supply and pigmented cells. the choroid supplies nutrients to the deep layers of the retina; its pigmented cells serve to absorb reflected and stray light within the globe.': 'CORRETO. A coroide forma a maior parte da túnica vascular, ou úvea, e recobre a porção posterior do olho. É tecido conjuntivo frouxo com irrigação abundante e muitas células pigmentadas. Nutre as camadas profundas da retina, e seu pigmento absorve a luz refletida e dispersa dentro do bulbo.',
  'correct. the chromatin in the nucleus of these fibroblasts is highly dispersed and, thus, the cell is metabolically active. the dispersed chromatin binds hematoxylin at low density, resulting in the pale staining of the nucleus. in general, the nucleus of an active fibroblast is the largest nucleus seen in connective tissues.': 'CORRETO. A cromatina no núcleo destes fibroblastos está muito dispersa, sinal de célula metabolicamente ativa. Cromatina dispersa liga hematoxilina em baixa densidade, e daí a palidez do núcleo. Em regra, o núcleo do fibroblasto ativo é o maior núcleo visível no tecido conjuntivo.',
  'correct. the chromatin in the nucleus of this inactive fibroblast is highly condensed and, thus, the cell is metabolically inactive. the condensed chromatin binds a high density of the heavy metals used for electron microscopy staining which which results in the high electron density of heterochromatin.': 'CORRETO. A cromatina no núcleo deste fibroblasto quiescente está muito condensada, sinal de célula metabolicamente inativa. Cromatina condensada retém grande quantidade dos metais pesados usados no contraste para microscopia eletrônica, e é por isso que a heterocromatina aparece tão elétron-densa.',
  'correct. the ciliary body is the anterior expansion of the choroid, forming a ring encircling the lens. when cut in cross section, the ciliary body appears triangular in shape. the ciliary body contains the ciliary muscle, three subdivisions of smooth muscle that alter the shape of the lens via suspensory fibers that extend between the ciliary body and the lens.': 'CORRETO. O corpo ciliar é a expansão anterior da coroide e forma um anel em torno do cristalino. Em corte transversal tem contorno triangular. Aloja o músculo ciliar, com três grupos de fibras lisas que mudam a forma do cristalino por meio das fibras zonulares estendidas entre um e outro.',
  'correct. the ciliary muscle, located within the ciliary body, is composed of smooth muscle fibers oriented in three planes. the fibers insert onto the sclera and ciliary body and contraction releases tension on the zonule fibers, allowing the lens to become more spherical during the process of accommodation.': 'CORRETO. O músculo ciliar, dentro do corpo ciliar, tem fibras lisas orientadas em três planos, inseridas na esclera e no próprio corpo ciliar. Sua contração alivia a tensão sobre as fibras zonulares e permite que o cristalino assuma forma mais esférica — o mecanismo da acomodação.',
  'correct. the ciliary processes are ridge-like extensions of the ciliary body and are also covered by ciliary epithelium. zonular fibers are delicate microfibrils that arise from the basal lamina of the ciliary epithelium in the grooves separating the ciliary processes. zonular fibers attach to the lens capsule and contraction of ciliary body muscles alters the tension on these fibers and, thus, affects the shape of the lens.': 'CORRETO. Os processos ciliares são projeções em crista do corpo ciliar, recobertas pelo mesmo epitélio ciliar. As fibras zonulares são microfibrilas delicadas que nascem da lâmina basal desse epitélio, nos sulcos entre os processos, e se prendem à cápsula do cristalino. A contração do músculo ciliar altera a tensão nelas e, com isso, a forma do cristalino.',
  'correct. the cochlear duct is the portion of the membranous labyrinth located in the cochlea. its location is intermediary between the scala vestibuli above and the scala tympani below. the cochlear duct houses the receptor for sound, the organ of corti.': 'CORRETO. O ducto coclear é a porção do labirinto membranoso alojada na cóclea, entre a rampa vestibular acima e a rampa timpânica abaixo. É nele que fica o receptor auditivo, o órgão de Corti.',
  'correct. the coni vasculosi are located in the head of the epididymis. each consists of a coiled efferent duct, the surrounding connective tissue and accompanying vasculature. the individual efferent ducts in each of these structures drain into the single duct of the epididymis.': 'CORRETO. Os cones vasculares ficam na cabeça do epidídimo. Cada um reúne um dúctulo eferente enovelado, o conjuntivo ao redor e os vasos que o acompanham. Todos esses dúctulos desembocam no ducto único do epidídimo.',
  'correct. the cornea, located in the anterior one-fifth of the eye, is the transparent portion of the outer tunic, where major refraction occurs. its convex curvature aids in focusing light. the cornea consists of inner and outer epithelial layers that sandwich a stroma of collagen fibers that are precisely aligned to provide transparency to the cornea. the cornea is surfaced by the corneal epithelium that transitions to the bulbar conjunctiva that covers the sclera.': 'CORRETO. A córnea ocupa o quinto anterior do olho e é a porção transparente da túnica externa, onde ocorre a maior parte da refração; sua curvatura convexa ajuda a focalizar a luz. É formada por camadas epiteliais interna e externa que sanduícham um estroma de fibras colágenas precisamente alinhadas — é esse alinhamento que garante a transparência. Na superfície, o epitélio corneano se continua com a conjuntiva bulbar, que recobre a esclera.',
  'correct. the corpora cavernosae are paired cylinders of erectile tissue that are surrounded by a dense connective tissue, the tunica albuginea. they are the major erectile component of the penis.': 'CORRETO. Os corpos cavernosos são dois cilindros pares de tecido erétil envolvidos por conjuntivo denso, a túnica albugínea. São o principal componente erétil do pênis.',
  'correct. the corpus albicans is the scar tissue remains of the corpus luteum. it has a shape similar to the corpus luteum, but since it is composed of scar tissue, it contains very few cells, mostly inactive fibroblasts. in contrast, the corpus luteum is highly cellular, filled with large, vacuolated, secretory cells.': 'CORRETO. O corpo albicante é a cicatriz que resta do corpo lúteo. Guarda contorno semelhante, mas, por ser tecido cicatricial, tem pouquíssimas células, quase todas fibroblastos quiescentes. O corpo lúteo, ao contrário, é muito celular, repleto de células secretoras grandes e vacuoladas.',
  'correct. the corpus spongiosum is an unpaired cylinder of erectile tissue that surrounds the urethra. the tunica albuginea of the corpus spongiosum is less dense than that which surrounds the dorsal corpora cavernosae.': 'CORRETO. O corpo esponjoso é um cilindro ímpar de tecido erétil que envolve a uretra. Sua túnica albugínea é menos densa que a dos corpos cavernosos dorsais.',
  'correct. the crista ampullaris is the ridge-shaped receptor in the ampulla of each semicircular duct. the gelatinous cupula of each crista extends across the width of the ampulla and responds to body position after angular acceleration.': 'CORRETO. A crista ampular é o receptor em forma de crista alojado na ampola de cada ducto semicircular. A cúpula gelatinosa que a cobre atravessa toda a largura da ampola e responde ao deslocamento provocado pela aceleração angular.',
  'correct. the cumulus oophorus is a specialized region of the stratum granulosum in a secondary follicle. the cumulus surrounds the oocyte as it projects into the antral space. the subset of cumulus cells that immediately surround the oocyte is called the corona radiate and are released with oocyte at ovulation.': 'CORRETO. O cúmulo oóforo é uma região especializada da camada granulosa no folículo secundário. Ele envolve o oócito enquanto este se projeta para dentro do antro. As células do cúmulo imediatamente ao redor do oócito formam a corona radiata e são liberadas junto com ele na ovulação.',
  'correct. the darkly staining extracellular matrix immediately around an isogenous group is called the territorial matrix and represents an area where glycosaminoglycans are highly concentrated.': 'CORRETO. A matriz extracelular intensamente corada ao redor de um grupo isógeno é a matriz territorial, região em que os glicosaminoglicanos estão especialmente concentrados.',
  'correct. the darkly staining perimeter of a secondary nodule is the mantle (corona), composed mainly of tightly packed b lymphocytes formed in the germinal center. after antigenic stimulation, large immunoblasts in the germinal center divide to form b lymphocytes that accumulate in the peripheral mantle.': 'CORRETO. A borda escura de um nódulo secundário é o manto, ou coroa, formado sobretudo por linfócitos B compactados, produzidos no centro germinativo. Depois do estímulo antigênico, grandes imunoblastos do centro se dividem e geram os linfócitos B que se acumulam nesse manto periférico.',
  'correct. the dendrites of a neuron can be distinguished from axons because there are multiple dendrites per cell and because dendrites contain nissl substance and branch at acute angles.': 'CORRETO. Os dendritos se distinguem do axônio porque são vários por célula, contêm substância de Nissl e se ramificam em ângulos agudos.',
  'correct. the dermis, the connective tissue component of skin, consists of the reticular and papillary layers. the dermis lies between the epidermis and the hypodermis (which is not a subdivision of the skin).': 'CORRETO. A derme, componente conjuntivo da pele, tem duas camadas: a papilar e a reticular. Fica entre a epiderme e a hipoderme — esta última não faz parte da pele em sentido estrito.',
}

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
