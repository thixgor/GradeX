import type { EntradaDicionario } from './tipos'

/**
 * Sistema respiratório.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const RESPIRATORIO: EntradaDicionario[] = [
  {
    termos: ['Traqueia', 'Traquéia'],
    resumo: 'Tubo cartilaginoso que conduz o ar da laringe aos brônquios principais.',
    localizacao: 'De C6 (borda inferior da cricoide) até a carina, em T4–T5, com 16 a 20 anéis incompletos e o músculo traqueal fechando a parede posterior, junto ao esôfago.',
    funcao: 'Conduz, aquece e umidifica o ar, e mantém a via aérea permanentemente aberta pela sustentação cartilaginosa.',
    vascularizacao: 'Artérias tireóideas inferiores em cima e brônquicas embaixo.',
    inervacao: 'Vago e laríngeos recorrentes; fibras simpáticas do tronco cervical.',
    clinica:
      'A traqueostomia eletiva é feita entre o 2º e o 4º anel. O desvio da traqueia é sinal de pneumotórax hipertensivo (empurra) ou atelectasia (puxa). A parede posterior membranácea é a que pode ser lesada na intubação difícil.',
    pontos: ['C6 até a carina em T4–T5', 'Traqueostomia entre o 2º e o 4º anel', 'Desvio traqueal: pneumotórax x atelectasia'],
  },
  {
    termos: ['Brônquio Principal Direito', 'Brônquio Principal Esquerdo', 'Carina'],
    resumo: 'Brônquios que nascem da bifurcação da traqueia na carina e entram nos pulmões pelos hilos.',
    localizacao: 'O direito é mais curto, largo e vertical; o esquerdo é mais longo, estreito e horizontal, por ter de contornar o coração.',
    funcao: 'Conduzem o ar até os brônquios lobares e segmentares, iniciando a árvore brônquica.',
    clinica:
      'A anatomia do brônquio direito explica dois fatos clínicos diários: corpos estranhos aspirados vão preferencialmente para ele, e a intubação profunda demais seleciona o pulmão direito, colapsando o esquerdo. A carina é o reparo broncoscópico e o alvo do posicionamento do tubo (2–4 cm acima).',
    pontos: ['Direito: curto, largo e vertical', 'Aspiração e intubação seletiva à direita', 'Ponta do tubo 2–4 cm acima da carina'],
  },
  {
    termos: ['Epiglote'],
    resumo: 'Cartilagem elástica em forma de folha, na entrada da laringe.',
    localizacao: 'Atrás da raiz da língua, ligada à cartilagem tireóidea pelo ligamento tireoepiglótico; entre ela e a língua ficam as valéculas.',
    funcao: 'Fecha o ádito da laringe durante a deglutição, desviando o bolo alimentar para os seios piriformes e a laringofaringe.',
    vascularizacao: 'Artéria laríngea superior.',
    inervacao: 'Ramo interno do nervo laríngeo superior (do vago) — aferência do reflexo de tosse.',
    clinica:
      'A valécula é onde se apoia a lâmina curva do laringoscópio (Macintosh) para elevar indiretamente a epiglote; a lâmina reta (Miller) a eleva diretamente. A epiglotite aguda é emergência de via aérea na criança, com o sinal do polegar na radiografia cervical.',
    pontos: ['Valécula: apoio da lâmina Macintosh', 'Laríngeo superior interno (reflexo de tosse)', 'Epiglotite e sinal do polegar'],
  },
  {
    termos: ['Prega Vocal', 'Glote'],
    resumo: 'Pregas que delimitam a rima da glote — a parte mais estreita da via aérea do adulto.',
    localizacao: 'Entre a cartilagem tireóidea, à frente, e os processos vocais das aritenóideas, atrás.',
    funcao: 'Produzem o som pela vibração ao passar o ar e protegem a via aérea inferior fechando-se reflexamente.',
    inervacao: 'Motora pelo laríngeo recorrente (todos os músculos, exceto o cricotireóideo); sensitiva pelo laríngeo superior interno acima e pelo recorrente abaixo.',
    clinica:
      'A glote é o ponto mais estreito da via aérea do adulto (na criança, é a cricoide) — o que define o calibre do tubo orotraqueal. A paralisia recorrencial bilateral fecha a via aérea. A visualização das pregas é o padrão-ouro da confirmação da intubação.',
    pontos: ['Ponto mais estreito da via aérea do adulto', 'Cricoide é o mais estreito na criança', 'Laríngeo recorrente comanda a mobilidade'],
  },
  {
    termos: ['Lobo Médio', 'Língula'],
    classe: 'viscera',
    resumo: 'Divisão maior do pulmão, delimitada por fissuras e ventilada por um brônquio lobar próprio.',
    localizacao:
      'O pulmão direito tem três lobos (superior, médio e inferior), separados pelas fissuras oblíqua e horizontal; o esquerdo tem dois, separados apenas pela fissura oblíqua, com a língula como equivalente do lobo médio. Cada lobo se subdivide em segmentos broncopulmonares.',
    funcao: 'Recebe um brônquio lobar e realiza a hematose na sua porção alveolar, funcionando como unidade ventilatória relativamente independente.',
    vascularizacao:
      'Ramos lobares das artérias pulmonares levam o sangue venoso para as trocas; veias pulmonares devolvem o sangue arterializado ao átrio esquerdo. O parênquima em si é nutrido pelas artérias brônquicas, ramos da aorta torácica.',
    inervacao: 'Plexo pulmonar — vago (broncoconstrição e secreção) e simpático (broncodilatação).',
    linfaticos: 'Linfonodos pulmonares e broncopulmonares (hilares), depois traqueobrônquicos e paratraqueais.',
    relacoes:
      'O lobo superior direito e a língula esquerda encostam na parede torácica anterior; os lobos inferiores ocupam a maior parte da face posterior, o que muda o ponto de ausculta de cada um.',
    clinica:
      'A independência lobar é o que torna possível a lobectomia. Na ausculta, o lobo médio e a língula são ouvidos à frente e os lobos inferiores atrás — por isso auscultar só o dorso deixa passar consolidações anteriores. A pneumonia aspirativa em decúbito costuma acometer o segmento posterior do lobo superior direito e o segmento superior do lobo inferior direito.',
    pontos: [
      'Direito: 3 lobos (fissuras oblíqua e horizontal); esquerdo: 2 + língula',
      'Cada lobo tem brônquio lobar próprio — base da lobectomia',
      'Lobos inferiores auscultam-se no dorso; médio e língula, à frente',
    ],
  },
  {
    termos: ['Pulmão Direito', 'Pulmão Esquerdo'],
    classe: 'viscera',
    resumo: 'Órgão da respiração, alojado na cavidade pleural e moldado pelas estruturas que encosta.',
    localizacao:
      'O direito tem três lobos e é mais largo e curto, empurrado para cima pelo fígado. O esquerdo tem dois lobos, a incisura cardíaca e a língula, porque cede espaço ao coração. Cada um tem ápice acima da clavícula e base sobre o diafragma.',
    funcao: 'Conduz o ar até os alvéolos e realiza a hematose, oferecendo à circulação uma superfície de troca de dezenas de metros quadrados.',
    vascularizacao:
      'Artérias pulmonares para as trocas e artérias brônquicas, da aorta torácica, para nutrir o próprio tecido; veias pulmonares devolvem o sangue arterializado ao átrio esquerdo.',
    inervacao: 'Plexo pulmonar — vago (broncoconstrição e secreção) e simpático (broncodilatação).',
    relacoes: 'No hilo, a disposição muda de lado: à direita o brônquio é a estrutura mais posterior; à esquerda, a artéria pulmonar é a mais alta.',
    clinica:
      'A assimetria explica a clínica: o brônquio principal direito, mais vertical e largo, recebe corpos estranhos e a intubação seletiva. O ápice ultrapassa a clavícula, e por isso um tumor de Pancoast comprime o plexo braquial e a cadeia simpática.',
    pontos: [
      'Direito: 3 lobos; esquerdo: 2 + língula e incisura cardíaca',
      'Dupla irrigação: pulmonares e brônquicas',
      'Ápice acima da clavícula — tumor de Pancoast',
    ],
  },
  {
    termos: ['Septo Nasal'],
    classe: 'via-aerea',
    resumo: 'Parede mediana que divide a cavidade nasal em duas metades, com parte óssea e parte cartilaginosa.',
    localizacao: 'Formado pela lâmina perpendicular do etmoide em cima, pelo vômer atrás e embaixo, e pela cartilagem septal à frente.',
    funcao: 'Sustenta o dorso nasal e reparte o fluxo aéreo entre as duas fossas, permitindo o ciclo nasal fisiológico.',
    vascularizacao:
      'Área de Kiesselbach, no septo anteroinferior, onde se anastomosam esfenopalatina, etmoidal anterior, palatina maior e o ramo septal da labial superior — carótida interna e externa se encontrando num só ponto.',
    inervacao: 'Nervos nasopalatino e etmoidal anterior; o epitélio olfatório ocupa a parte mais alta.',
    clinica:
      'Mais de 90% das epistaxes vêm de Kiesselbach, e é por isso que comprimir a asa do nariz resolve a maioria. O desvio de septo obstrui e favorece sinusite; o hematoma septal precisa ser drenado, sob pena de necrose da cartilagem e nariz em sela.',
    pontos: [
      'Etmoide + vômer + cartilagem septal',
      'Área de Kiesselbach: 90% das epistaxes',
      'Hematoma septal → nariz em sela',
    ],
  },
  {
    termos: ['Ádito da Laringe', 'Vestíbulo da Laringe'],
    classe: 'via-aerea',
    resumo: 'Entrada da laringe, delimitada pela epiglote, pelas pregas ariepiglóticas e pelas aritenoides.',
    localizacao: 'Voltado para trás e para cima, abrindo-se na laringofaringe; de cada lado ficam os recessos piriformes.',
    funcao: 'Porta de passagem do ar e ponto onde o reflexo de fechamento protege a via aérea inferior durante a deglutição.',
    inervacao: 'Ramo interno do nervo laríngeo superior — a aferência do reflexo de tosse.',
    clinica:
      'É a estrutura que se procura na laringoscopia, e o recesso piriforme ao lado é onde corpos estranhos pontiagudos, como espinha de peixe, costumam encravar. A remoção às cegas ali arrisca o laríngeo superior interno.',
    pontos: [
      'Epiglote, pregas ariepiglóticas e aritenoides',
      'Recesso piriforme: corpo estranho encravado',
      'Laríngeo superior interno e o reflexo de tosse',
    ],
  },
]
