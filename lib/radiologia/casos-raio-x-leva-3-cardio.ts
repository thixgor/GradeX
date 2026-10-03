import type { DefinicaoCasoRaioX } from './casos-raio-x-leva-2'
import type { AchadoMarcado, DetalheCaso, EstruturaCaso, TipoMarcacao } from './casos-raio-x-detalhes'

/**
 * Terceira leva — coração e grandes vasos.
 *
 * Dezesseis radiografias do Radiopaedia (termo conjunto de 18/09/2026) com as
 * setas do autor do caso. As marcações seguem, na mesma ordem, os rótulos
 * dessas setas: é por isso que cada uma tem posição em `casos-raio-x-setas`.
 * A consulta de cada caso é a mesma dos casos com apontamentos que usam a mesma
 * radiografia (`VINHETAS_LEVA_3_CARDIO`, montada em `casos-clinicos`).
 */

const d = (
  slug: string,
  titulo: string,
  resumo: string,
  explicacao: string,
  imagens: string[],
  sinais: string[],
  armadilhas: string[],
): DefinicaoCasoRaioX => ({ categoria: 'cardiovascular', slug, titulo, resumo, explicacao, imagens, sinais, armadilhas })

const e = (nome: string, anatomia: string, normal: string, neste: string, alerta?: string): EstruturaCaso =>
  ({ nome, anatomia, normal, neste, alerta })
const m = (titulo: string, descricao: string, tipo: TipoMarcacao = 'achado'): AchadoMarcado => ({ titulo, descricao, tipo })

export const LEVA_3_CARDIO: DefinicaoCasoRaioX[] = [
  d('estenose-mitral-reumatica', 'Aumento do átrio esquerdo na estenose mitral', 'Átrio esquerdo aumentado empurrando o brônquio esquerdo para trás e abrindo a carina: o sinal do homem caminhando.', 'A valva mitral estreitada pela febre reumática represa o sangue no átrio esquerdo, que dilata. Como o átrio é a câmara mais posterior e fica logo abaixo da carina, ele cresce para trás e para cima: no perfil, o contorno posterior do coração abaúla e o brônquio principal esquerdo é empurrado para trás, enquanto o direito fica no lugar, como as pernas de alguém caminhando. No frontal, a carina se abre e pode surgir um duplo contorno à direita.', ['Perfil — átrio esquerdo e brônquio esquerdo deslocados para trás', 'Frontal — abertura da carina'], ['Abaulamento posterior do contorno cardíaco no perfil', 'Brônquio esquerdo para trás, direito no lugar', 'Carina com ângulo acima de 90 graus'], ['Massa subcarinal também abre a carina.', 'Perfil mal posicionado separa os brônquios sem doença.']),
  d('insuficiencia-mitral-reumatica', 'Insuficiência mitral com câmaras esquerdas aumentadas', 'Duplo contorno à direita, terceira corcova na borda esquerda e ponta do coração rebaixada.', 'Na insuficiência mitral, parte do sangue volta ao átrio a cada sístole. O átrio esquerdo cresce e aparece como um segundo arco por dentro da borda direita — a dupla densidade — e seu apêndice abaúla a borda esquerda entre o tronco pulmonar e o ventrículo. O ventrículo esquerdo recebe esse volume de volta, dilata e empurra a ponta para baixo e para fora, ao contrário da estenose mitral pura, em que o ventrículo fica pequeno.', ['Frontal — átrio e ventrículo esquerdos aumentados'], ['Dupla densidade à direita', 'Apêndice atrial esquerdo saliente', 'Ponta rebaixada'], ['Radiografia AP aumenta o coração artificialmente.', 'Estenose mitral isolada não aumenta o ventrículo esquerdo.']),
  d('estenose-aortica-calcificada', 'Valva aórtica calcificada e implante por cateter', 'Calcificação na topografia da valva aórtica e, no controle, prótese implantada por cateter.', 'Com a idade, os folhetos da valva aórtica calcificam e deixam de abrir. A calcificação raramente é vista na radiografia; quando aparece, quase sempre corresponde a estenose importante. Ela fica no meio da silhueta cardíaca, acima e à direita da posição mitral. O tratamento em idosos de alto risco é o implante de valva por cateter, uma prótese montada num stent que aparece como malha metálica no mesmo lugar.', ['Antes do implante — calcificação valvar aórtica', 'Após o implante — prótese por cateter'], ['Cálcio grosseiro no centro da silhueta', 'Malha metálica da prótese no controle'], ['Calcificação do anel mitral fica mais baixa e em forma de C.', 'Radiografia normal não exclui estenose grave.']),
  d('pericardite-constritiva', 'Calcificação pericárdica na pericardite constritiva', 'Linha calcificada acompanhando o contorno do coração.', 'O pericárdio inflamado por muito tempo — tuberculose, cirurgia cardíaca, radioterapia — engrossa, fibrosa e calcifica em casca. O coração preso não se enche na diástole, e o sangue se acumula nas veias: jugulares túrgidas que sobem na inspiração, fígado grande, ascite e edema. A calcificação segue o contorno do coração, mais nas faces inferior e anterior, e é melhor vista no perfil.', ['Frontal — calcificação pericárdica'], ['Linha calcificada contornando o coração', 'Silhueta normal ou pouco aumentada'], ['Muitas constrições não calcificam.', 'Calcificação só na ponta sugere aneurisma ventricular antigo.']),
  d('pseudoaneurisma-ventricular', 'Pseudoaneurisma do ventrículo esquerdo', 'Abaulamento focal na ponta do coração após infarto.', 'Depois de um infarto extenso, a parede morta pode se dilatar — aneurisma verdadeiro, com parede de cicatriz — ou romper e ser contida só pelo pericárdio aderido — pseudoaneurisma. Na radiografia, os dois aparecem como saliência no contorno do ventrículo esquerdo. O pseudoaneurisma tem colo estreito e alto risco de romper, por isso é tratado com cirurgia.', ['Frontal AP — abaulamento da ponta'], ['Saliência focal no contorno da ponta', 'Pulmões limpos'], ['Coxim de gordura pericárdica também abaula a ponta, mas é menos denso.', 'O ecocardiograma ou a ressonância separam aneurisma de pseudoaneurisma.']),
  d('protese-valvar-aortica-biologica', 'Prótese biológica aórtica e marca-passo', 'Três anéis radiopacos na altura da valva aórtica, esternotomia e marca-passo de dupla câmara.', 'Próteses biológicas são feitas de tecido animal montado numa armação, e algumas têm marcadores metálicos nas hastes, que aparecem como pequenos anéis. A posição aórtica fica no meio da silhueta, acima de uma linha traçada do hilo direito até a ponta; a mitral fica abaixo e à esquerda. A cirurgia perto do sistema de condução pode exigir marca-passo, cujos eletrodos devem terminar no átrio e no ápice do ventrículo direito.', ['Tórax — prótese aórtica e marca-passo', 'Ampliação — anéis da prótese'], ['Marcadores na posição aórtica', 'Eletrodos no átrio e no ventrículo direitos', 'Fios de cerclagem do esterno'], ['Prótese mecânica tem anel completo e discos.', 'Eletrodo fraturado pode parecer íntegro numa incidência só.']),
  d('aneurisma-da-aorta-toracica', 'Aneurisma da aorta torácica com superposição hilar', 'Opacidade mediastinal esquerda de parede calcificada, contínua com o arco, através da qual se vê o hilo.', 'A aorta dilatada além de 1,5 vez o normal forma uma massa contínua com o arco ou a descendente. A parede calcificada que segue o contorno mostra que a opacidade é a própria aorta. O sinal da superposição hilar localiza: se os vasos do hilo aparecem através da massa, ela não nasce do hilo, mas está à frente ou atrás dele. O aneurisma do arco pode esticar o nervo laríngeo recorrente esquerdo e causar rouquidão.', ['Frontal — massa contínua com o arco aórtico'], ['Massa contínua com o arco', 'Parede fina e calcificada', 'Hilo visível através da massa'], ['AP e rotação alargam o mediastino falsamente.', 'Dor nova em paciente com aneurisma é ruptura até prova em contrário.']),
  d('hipertensao-arterial-pulmonar', 'Hipertensão pulmonar com artérias centrais dilatadas', 'Tronco e artérias pulmonares direita e esquerda muito dilatados, com pulmões limpos.', 'Quando a pressão nas artérias pulmonares sobe, elas se dilatam a partir do tronco, que forma o segundo arco da borda esquerda. A interlobar direita passa de 16 mm. Na doença estabelecida, os vasos centrais ficam grossos e os periféricos afinam de repente, a poda. As causas vão de doença do coração esquerdo e do pulmão ao tromboembolismo crônico e à doença das próprias arteríolas.', ['Frontal — artérias pulmonares centrais dilatadas'], ['Tronco pulmonar saliente', 'Artérias hilares calibrosas', 'Periferia pobre em vasos'], ['Estenose valvar pulmonar dilata o tronco e a artéria esquerda, mas não a direita.', 'Linfonodos hilares têm contorno lobulado.']),
  d('sindrome-de-eisenmenger', 'Síndrome de Eisenmenger com situs inversus abdominal', 'Coração grande, artérias pulmonares centrais dilatadas com poda, arco à direita, ázigo saliente e órgãos abdominais espelhados.', 'Um defeito congênito não tratado manda sangue demais aos pulmões por anos; as arteríolas engrossam e a pressão pulmonar ultrapassa a sistêmica. O fluxo pelo defeito se inverte e aparece a cianose tardia. Na radiografia, as artérias centrais ficam enormes e a periferia, podada. Alterações da lateralidade, como o estômago à direita, apontam para cardiopatia congênita complexa.', ['Frontal — hipertensão pulmonar e situs inversus abdominal'], ['Artérias centrais grandes com poda', 'Arco aórtico pequeno à direita', 'Estômago à direita, fígado à esquerda'], ['Hiperfluxo de comunicação interatrial tem vasos grossos até a periferia.', 'Na Eisenmenger, fechar o defeito piora o paciente.']),
  d('tetralogia-de-fallot-operada', 'Arco aórtico à direita após correção de Fallot', 'Botão aórtico à direita da traqueia em adulto operado de tetralogia de Fallot.', 'O arco aórtico normal passa sobre o brônquio esquerdo e forma o botão à esquerda da traqueia. No arco à direita com ramificação em espelho, o botão fica à direita e empurra a traqueia para a esquerda; essa forma se associa fortemente a cardiopatia congênita — cerca de um quarto das tetralogias de Fallot o tem. O arco permanece depois da correção cirúrgica.', ['Frontal — arco aórtico à direita'], ['Botão aórtico à direita da traqueia', 'Ausência de botão à esquerda', 'Fios de esternotomia'], ['Arco à direita pode ser confundido com massa mediastinal.', 'Antes da correção, a tetralogia tem coração em bota e hipofluxo.']),
  d('sindrome-da-cimitarra', 'Síndrome da cimitarra com hipoplasia pulmonar', 'Pulmão direito pequeno, traqueia e mediastino desviados para a direita e opacidades na base direita.', 'Na síndrome da cimitarra, o pulmão direito é hipoplásico e drena parte do seu sangue por uma veia anômala para a veia cava inferior. A veia, quando vista, desce pela base direita em curva, como uma espada turca. Com menos volume à direita, o mediastino e o coração são puxados para lá, o que pode imitar dextrocardia — é a dextroposição.', ['Frontal — hipoplasia pulmonar direita'], ['Hemitórax direito pequeno', 'Desvio da traqueia e do mediastino', 'Opacidade curva na base direita'], ['Coração à direita por desvio não é dextrocardia verdadeira.', 'Atelectasia ou pneumonectomia também puxam o mediastino.']),
  d('sindrome-de-kartagener', 'Síndrome de Kartagener', 'Dextrocardia, bolha gástrica à direita e bronquiectasias na base direita.', 'A discinesia ciliar primária deixa os cílios parados: o muco não sai e as infecções repetidas dilatam os brônquios, mais nos lobos médio e inferiores. Os cílios também orientam a posição dos órgãos no embrião, por isso metade dos pacientes tem situs inversus. A tríade de Kartagener é situs inversus, sinusite crônica e bronquiectasias, e os espermatozoides, imóveis, causam infertilidade.', ['Frontal — dextrocardia e bronquiectasias'], ['Ponta do coração à direita', 'Bolha gástrica à direita', 'Brônquios dilatados em trilhos e anéis'], ['Confira o marcador de lado antes de diagnosticar dextrocardia.', 'Fibrose cística predomina nos lobos superiores.']),
  d('pneumopericardio', 'Pneumopericárdio', 'Faixa de ar contornando o coração, com enfisema subcutâneo no pescoço.', 'Ar dentro do saco pericárdico desenha uma faixa escura em volta do coração que para na altura dos grandes vasos, onde o pericárdio se fixa — no pneumomediastino, o ar sobe além dela, pelo pescoço. Em crises de asma ou na ventilação mecânica, alvéolos rompidos mandam ar pelas bainhas dos vasos até o mediastino e, às vezes, até o pericárdio. Na forma hipertensiva, o ar pode tamponar o coração.', ['Frontal — ar em volta do coração'], ['Faixa de ar contornando a borda cardíaca', 'Ar subcutâneo no pescoço'], ['Banda de Mach imita ar na borda do coração.', 'Em adulto sem trauma, procure fístula com o esôfago.']),
  d('coarctacao-com-erosoes-costais', 'Coarctação da aorta com sinal do três', 'Erosões na borda inferior das costelas, contorno aórtico em três e cardiomegalia.', 'A aorta estreitada logo após a subclávia esquerda obriga o sangue a contornar o obstáculo pelas artérias intercostais, que dilatam e erodem a borda inferior das costelas. As duas primeiras costelas são poupadas porque suas artérias não fazem parte do circuito. O botão aórtico, o ponto estreitado e a dilatação depois dele desenham o número três no contorno esquerdo do mediastino.', ['Frontal — sinal do três e erosões costais'], ['Entalhes bilaterais na borda inferior das costelas', 'Contorno aórtico em três', 'Cardiomegalia'], ['Erosões costais só aparecem depois dos 5 a 8 anos.', 'Erosão unilateral sugere origem anômala de uma subclávia.']),
  d('derrame-pericardico-volumoso', 'Derrame pericárdico volumoso em moringa', 'Silhueta globosa de parede a parede com pulmões sem congestão.', 'O líquido no saco pericárdico aumenta a silhueta para os dois lados e apaga as saliências das câmaras, deixando-a globosa como uma moringa. Como o coração em si pode ser normal, os pulmões ficam limpos, ao contrário da cardiomegalia da insuficiência cardíaca. Silhueta que cresce rápido entre radiografias também sugere derrame. O ecocardiograma confirma e mostra se há tamponamento.', ['Frontal — silhueta em moringa'], ['Silhueta globosa e simétrica', 'Pulmões sem congestão', 'Derrame pleural associado'], ['A radiografia não diagnostica tamponamento.', 'Cardiomiopatia dilatada vem com congestão.']),
  d('protese-de-aorta-ascendente', 'Prótese na aorta ascendente após dissecção', 'Prótese tubular sobre a aorta ascendente com derrame pleural esquerdo em véu.', 'A dissecção da aorta ascendente é emergência cirúrgica, porque pode romper para o pericárdio. O segmento doente é substituído ou reforçado com um tubo ou prótese. Na radiografia de controle, reconheça o dispositivo, confira a posição e procure complicações: derrame pleural esquerdo, que pode ser sangue, alargamento novo do mediastino e derrame pericárdico.', ['Frontal AP — prótese aórtica no pós-operatório'], ['Estrutura metálica tubular sobre a aorta ascendente', 'Derrame pleural esquerdo', 'Fios de esternotomia'], ['Radiografia normal não exclui dissecção.', 'Mediastino que alarga após cirurgia aórtica pede TC urgente.']),
]

/**
 * Dossiê da terceira leva. As marcações seguem a ordem das setas do autor em
 * cada filme — a posição de cada uma está em `casos-raio-x-setas`.
 */
export const DETALHES_LEVA_3_CARDIO: Record<string, DetalheCaso> = {
  'estenose-mitral-reumatica': {
    mecanismo: 'A valva mitral fundida pela febre reumática impede o esvaziamento do átrio esquerdo, que dilata. Por ser a câmara mais posterior, o átrio cresce para trás e para cima, empurra o brônquio principal esquerdo e abre a carina. A pressão transmitida às veias pulmonares explica a congestão e a hemoptise.',
    estruturas: [
      e('Átrio esquerdo', 'Câmara posterior do coração, logo abaixo da carina e à frente do esôfago.', 'Não forma borda no frontal; no perfil, o contorno posterior é discreto.', 'Abaúla para trás no perfil e forma duplo contorno à direita no frontal.', 'Esôfago contrastado mostra a impressão do átrio aumentado.'),
      e('Brônquios principais', 'O direito desce quase reto; o esquerdo passa sobre o átrio esquerdo.', 'No perfil, quase sobrepostos.', 'O esquerdo é empurrado para trás e se separa do direito: o homem caminhando.'),
      e('Carina', 'Bifurcação da traqueia.', 'Ângulo de cerca de 70 graus.', 'Abre acima de 90 graus.', 'Linfonodos subcarinais também abrem a carina.'),
    ],
    marcacoes: {
      1: [
        m('Átrio esquerdo para trás', 'O contorno posterior do coração abaúla atrás, na altura da carina.'),
        m('Traqueia', 'O tronco do homem caminhando: a referência para seguir os brônquios.', 'referencia'),
        m('Brônquio direito', 'Em posição normal, a perna da frente.', 'referencia'),
        m('Brônquio esquerdo deslocado', 'Empurrado para trás pelo átrio, a perna de trás.'),
      ],
      2: [m('Carina aberta', 'O ângulo entre os brônquios principais passa de 90 graus.')],
    },
    conduta: 'Ecocardiograma para a valva mitral e o átrio, eletrocardiograma para fibrilação atrial, anticoagulação se houver fibrilação e valvotomia por balão ou cirurgia conforme a anatomia.',
  },
  'insuficiencia-mitral-reumatica': {
    mecanismo: 'A valva mitral deformada não fecha, e o sangue reflui ao átrio a cada sístole. O átrio recebe volume extra e cresce; o ventrículo esquerdo recebe esse volume de volta na diástole e dilata. Os dois juntos aumentam a silhueta e rebaixam a ponta.',
    estruturas: [
      e('Átrio esquerdo', 'Câmara posterior, logo abaixo da carina.', 'Não forma borda no frontal.', 'Cria o duplo contorno à direita e abaúla o apêndice à esquerda.'),
      e('Ventrículo esquerdo', 'Forma a ponta e a borda esquerda inferior.', 'Ponta acima do diafragma, dentro do contorno.', 'Ponta rebaixada e desviada para fora.'),
    ],
    marcacoes: {
      1: [
        m('Dupla densidade', 'Segundo arco por dentro da borda direita: o átrio esquerdo aumentado.'),
        m('Apêndice atrial esquerdo', 'Terceira corcova na borda esquerda, entre o tronco pulmonar e o ventrículo.'),
        m('Ponta rebaixada', 'O ventrículo esquerdo dilatado empurra a ponta para baixo e para fora.'),
      ],
    },
    conduta: 'Ecocardiograma para quantificar a regurgitação e a função ventricular, profilaxia secundária da febre reumática e cirurgia valvar conforme sintomas e dilatação.',
  },
  'estenose-aortica-calcificada': {
    mecanismo: 'Os folhetos da valva aórtica calcificam com a idade e endurecem. O ventrículo esquerdo trabalha contra a obstrução e não aumenta o débito no esforço, o que causa angina, síncope e insuficiência cardíaca.',
    estruturas: [
      e('Valva aórtica', 'Fica no centro da silhueta, acima e à direita da mitral.', 'Invisível na radiografia.', 'Aparece como cálcio grosseiro no meio da silhueta.', 'No perfil, fica acima da linha do brônquio ao ângulo cardiofrênico anterior.'),
      e('Prótese por cateter', 'Malha metálica montada em stent dentro da valva doente.', 'Ausente.', 'Ocupa a posição da valva aórtica no controle.'),
    ],
    marcacoes: {
      1: [m('Calcificação valvar aórtica', 'Cálcio no centro da silhueta, na posição da valva aórtica.')],
      2: [m('Prótese aórtica por cateter', 'Malha metálica da valva implantada dentro da valva calcificada.')],
    },
    conduta: 'Ecocardiograma para gradiente e área valvar e troca valvar cirúrgica ou por cateter nos sintomáticos com estenose grave.',
  },
  'pericardite-constritiva': {
    mecanismo: 'O pericárdio inflamado por muito tempo cicatriza duro e calcifica. O coração preso não se enche, e o sangue represa nas veias sistêmicas; na inspiração, o coração não acomoda o sangue que chega e as jugulares sobem.',
    estruturas: [
      e('Pericárdio', 'Saco fibroso que envolve o coração.', 'Invisível, com menos de 2 mm.', 'Espessado e calcificado em casca.', 'Calcificação melhor vista no perfil.'),
      e('Silhueta cardíaca', 'Contorno do coração.', 'Índice abaixo de 50%.', 'Normal ou pouco aumentada, apesar da congestão sistêmica.'),
    ],
    marcacoes: {
      1: [m('Calcificação pericárdica', 'Linha calcificada acompanhando o contorno do coração.')],
    },
    conduta: 'Ecocardiograma, TC ou ressonância para medir o pericárdio, diuréticos para sintomas e pericardiectomia como tratamento definitivo.',
  },
  'pseudoaneurisma-ventricular': {
    mecanismo: 'A parede necrótica do infarto rompe e é contida pelo pericárdio aderido, formando uma bolsa de colo estreito. A bolsa abaúla o contorno do ventrículo e pode romper sem aviso.',
    estruturas: [
      e('Ventrículo esquerdo', 'Forma a ponta e a borda esquerda inferior.', 'Contorno liso e convexo.', 'Saliência focal na ponta.', 'Coxim gorduroso é menos denso.'),
    ],
    marcacoes: {
      1: [m('Abaulamento focal da ponta', 'Saliência no contorno da ponta do ventrículo esquerdo.')],
    },
    conduta: 'Ecocardiograma, ressonância ou TC para confirmar e correção cirúrgica do pseudoaneurisma.',
  },
  'protese-valvar-aortica-biologica': {
    mecanismo: 'A valva aórtica doente foi substituída por uma prótese biológica; a cirurgia perto do sistema de condução causou bloqueio, tratado com marca-passo de dupla câmara.',
    estruturas: [
      e('Prótese aórtica', 'Marcadores metálicos na altura da valva aórtica.', 'Ausente.', 'Três anéis no centro da silhueta.', 'A prótese mitral fica mais abaixo e à esquerda.'),
      e('Marca-passo', 'Gerador abaixo da clavícula e eletrodos nas câmaras direitas.', 'Ausente.', 'Eletrodos no apêndice atrial e no ápice do ventrículo direito.'),
    ],
    marcacoes: {
      1: [
        m('Anéis da prótese', 'Três marcadores radiopacos na posição aórtica.'),
        m('Eletrodo atrial', 'Ponta em J no apêndice do átrio direito.', 'referencia'),
        m('Eletrodo ventricular', 'Ponta no ápice do ventrículo direito.', 'referencia'),
        m('Fios de cerclagem', 'Fios de aço fechando a esternotomia.', 'referencia'),
        m('Gerador do marca-passo', 'Gerador abaixo da clavícula esquerda.', 'referencia'),
      ],
      2: [m('Anéis da prótese', 'A ampliação destaca os três marcadores da prótese biológica.')],
    },
    conduta: 'Ecocardiograma periódico da prótese, controle do marca-passo e profilaxia de endocardite em procedimentos de risco.',
  },
  'aneurisma-da-aorta-toracica': {
    mecanismo: 'Hipertensão, tabagismo e predisposição familiar enfraquecem a parede da aorta, que dilata no arco. A massa resultante é contínua com a aorta e pode esticar o nervo laríngeo recorrente esquerdo.',
    estruturas: [
      e('Arco aórtico', 'Passa sobre o brônquio esquerdo e forma o botão aórtico.', 'Botão pequeno à esquerda da traqueia.', 'Massa grande contínua com o arco.'),
      e('Hilo esquerdo', 'Artéria pulmonar e brônquio esquerdos.', 'Visível no frontal.', 'Visto através da massa: sinal da superposição hilar.'),
    ],
    marcacoes: {
      1: [
        m('Parede calcificada', 'Linha fina e densa na borda da massa, contínua com o arco.'),
        m('Opacidade mediastinal esquerda', 'Massa arredondada contínua com a aorta.'),
        m('Opacidade na base esquerda', 'Discreta opacidade no lobo inferior esquerdo.', 'referencia'),
      ],
    },
    conduta: 'Angiotomografia da aorta, controle rigoroso da pressão e tratamento endovascular ou cirúrgico conforme diâmetro e sintomas.',
  },
  'hipertensao-arterial-pulmonar': {
    mecanismo: 'As arteríolas pulmonares engrossam e estreitam, a pressão sobe e dilata o tronco e as artérias centrais. O ventrículo direito, sobrecarregado, não aumenta o débito no esforço.',
    estruturas: [
      e('Tronco pulmonar', 'Segundo arco da borda esquerda.', 'Discreto ou plano.', 'Muito saliente.'),
      e('Artérias pulmonares', 'Ramos direito e esquerdo nos hilos.', 'Interlobar direita até 16 mm.', 'Calibrosas, com afilamento brusco na periferia.'),
    ],
    marcacoes: {
      1: [
        m('Tronco pulmonar dilatado', 'Abaulamento grande na borda esquerda.'),
        m('Artéria pulmonar direita', 'Calibrosa no hilo direito.'),
        m('Artéria pulmonar esquerda', 'Calibrosa no hilo esquerdo.'),
      ],
    },
    conduta: 'Ecocardiograma, cateterismo cardíaco direito, investigação das causas e tratamento em centro de referência.',
  },
  'sindrome-de-eisenmenger': {
    mecanismo: 'O defeito congênito não tratado elevou a pressão pulmonar até superar a sistêmica; o fluxo pelo defeito se inverteu e o sangue sem oxigênio passou para a aorta.',
    estruturas: [
      e('Artérias pulmonares', 'Tronco e ramos centrais.', 'Calibre normal.', 'Muito dilatadas, com poda periférica.'),
      e('Situs abdominal', 'Posição do estômago e do fígado.', 'Estômago à esquerda, fígado à direita.', 'Invertido: estômago à direita, fígado à esquerda.', 'Lateralidade alterada aponta para cardiopatia complexa.'),
    ],
    marcacoes: {
      1: [
        m('Coração aumentado', 'Silhueta cardíaca grande.'),
        m('Arco aórtico à direita', 'Botão aórtico pequeno à direita da traqueia.'),
        m('Veia ázigo saliente', 'Ázigo dilatada no ângulo traqueobrônquico direito.'),
        m('Artérias pulmonares centrais', 'Tronco e ramos principais muito grandes.'),
        m('Poda periférica', 'Vasos que afinam bruscamente na periferia.'),
        m('Estômago à direita', 'Bolha gástrica sob o hemidiafragma direito.'),
        m('Fígado à esquerda', 'Sombra hepática no hipocôndrio esquerdo.'),
      ],
    },
    conduta: 'Acompanhamento em centro de hipertensão pulmonar e cardiopatia congênita, vasodilatadores pulmonares e evitar gravidez e desidratação.',
  },
  'tetralogia-de-fallot-operada': {
    mecanismo: 'O arco aórtico à direita com ramificação em espelho acompanha a tetralogia de Fallot e permanece após a correção cirúrgica.',
    estruturas: [
      e('Arco aórtico', 'Normalmente à esquerda da traqueia.', 'Botão aórtico à esquerda.', 'Botão à direita, traqueia empurrada para a esquerda.'),
    ],
    marcacoes: {
      1: [m('Arco aórtico à direita', 'O botão aórtico fica à direita da traqueia.')],
    },
    conduta: 'Seguimento em cardiopatias congênitas do adulto, com ecocardiograma e ressonância para o ventrículo direito e a valva pulmonar.',
  },
  'sindrome-da-cimitarra': {
    mecanismo: 'O pulmão direito hipoplásico drena por veia anômala para a cava inferior. Com menos volume à direita, o mediastino é puxado para esse lado.',
    estruturas: [
      e('Pulmão direito', 'Três lobos.', 'Volume semelhante ao esquerdo.', 'Pequeno, com opacidades na base.'),
      e('Mediastino', 'Coração, traqueia e grandes vasos.', 'Central.', 'Desviado para a direita.'),
    ],
    marcacoes: {
      1: [
        m('Desvio da traqueia', 'Traqueia e mediastino puxados para a direita.'),
        m('Pulmão direito pequeno', 'Hemitórax direito com volume reduzido.'),
        m('Opacidades na base direita', 'Opacidades nos campos médio e inferior direitos.'),
      ],
    },
    conduta: 'Ecocardiograma e angiotomografia, avaliação de hipertensão pulmonar e correção cirúrgica da drenagem quando indicada.',
  },
  'sindrome-de-kartagener': {
    mecanismo: 'Os cílios parados não removem o muco e não orientam a lateralidade no embrião: infecções repetidas dilatam os brônquios e metade dos pacientes tem situs inversus.',
    estruturas: [
      e('Coração', 'Ponta normalmente à esquerda.', 'Dextrocardia ausente.', 'Ponta voltada para a direita.', 'Confira o marcador de lado.'),
      e('Brônquios basais', 'Ramos dos lobos inferiores.', 'Invisíveis.', 'Dilatados, em trilhos e anéis.'),
    ],
    marcacoes: {
      1: [
        m('Dextrocardia', 'Ponta do coração voltada para a direita.'),
        m('Bolha gástrica à direita', 'Estômago sob o hemidiafragma direito.'),
        m('Bronquiectasias', 'Brônquios dilatados na base direita.'),
        m('Opacidades lineares', 'Atelectasias e cicatrizes apagando o hemidiafragma.'),
      ],
    },
    conduta: 'Confirmar com óxido nítrico nasal e teste genético, fisioterapia respiratória diária e antibióticos nas exacerbações.',
  },
  pneumopericardio: {
    mecanismo: 'Alvéolos rompidos mandam ar pelas bainhas dos vasos até o mediastino e, às vezes, até o saco pericárdico.',
    estruturas: [
      e('Pericárdio', 'Saco que envolve o coração até a base dos grandes vasos.', 'Invisível.', 'Afastado do coração por uma faixa de ar.'),
    ],
    marcacoes: {
      1: [
        m('Pneumopericárdio', 'Faixa de ar contornando a borda esquerda do coração.'),
        m('Enfisema subcutâneo', 'Linhas de ar nas partes moles do pescoço.'),
      ],
    },
    conduta: 'Observação nos casos espontâneos, tratamento da causa e drenagem pericárdica se houver tamponamento.',
  },
  'coarctacao-com-erosoes-costais': {
    mecanismo: 'A aorta estreitada após a subclávia esquerda força o sangue pelas intercostais, que dilatam e erodem as costelas; o ventrículo esquerdo, sobrecarregado, cresce.',
    estruturas: [
      e('Costelas', 'Artéria intercostal corre na borda inferior.', 'Borda inferior lisa.', 'Entalhes bilaterais, poupando as duas primeiras.'),
      e('Aorta descendente', 'Contorno esquerdo do mediastino.', 'Linha contínua.', 'Contorno em três.'),
    ],
    marcacoes: {
      1: [
        m('Erosões costais', 'Entalhes na borda inferior das costelas.'),
        m('Sinal do três', 'Botão aórtico, ponto estreitado e dilatação depois dele.'),
        m('Cefalização', 'Vasos dos lobos superiores mais calibrosos que os inferiores.'),
      ],
    },
    conduta: 'Angiotomografia ou angiorressonância da aorta, controle da pressão e correção por stent ou cirurgia.',
  },
  'derrame-pericardico-volumoso': {
    mecanismo: 'O líquido no saco pericárdico aumenta a silhueta de forma simétrica; quando se acumula rápido ou em grande volume, comprime o coração.',
    estruturas: [
      e('Silhueta cardíaca', 'Contorno do coração e do pericárdio.', 'Arcos das câmaras visíveis.', 'Globosa, de parede a parede.'),
    ],
    marcacoes: {
      1: [m('Silhueta em moringa', 'Sombra cardíaca enorme, globosa e de contornos lisos.')],
    },
    conduta: 'Ecocardiograma urgente, pericardiocentese se houver tamponamento e investigação da causa.',
  },
  'protese-de-aorta-ascendente': {
    mecanismo: 'A aorta ascendente dissecada foi substituída ou reforçada por prótese; o derrame pleural esquerdo é comum no pós-operatório e pode ser sangue.',
    estruturas: [
      e('Aorta ascendente', 'Forma a borda superior direita do mediastino.', 'Sem dispositivos.', 'Prótese tubular metálica.'),
    ],
    marcacoes: {
      1: [m('Prótese na aorta ascendente', 'Estrutura metálica tubular sobre a aorta ascendente.')],
    },
    conduta: 'Controle da pressão, toracocentese se o derrame crescer e angiotomografia de seguimento da aorta.',
  },
}

/** Caso da terceira leva → caso com apontamentos que usa a mesma radiografia e a mesma consulta. */
export const ORIGEM_LEVA_3_CARDIO: Record<string, string> = {
  'estenose-mitral-reumatica': 'aumento-do-atrio-esquerdo',
  'insuficiencia-mitral-reumatica': 'insuficiencia-mitral',
  'estenose-aortica-calcificada': 'estenose-aortica',
  'pericardite-constritiva': 'pericardite-constritiva',
  'pseudoaneurisma-ventricular': 'pseudoaneurisma-de-ventriculo-esquerdo',
  'protese-valvar-aortica-biologica': 'protese-valvar-aortica',
  'aneurisma-da-aorta-toracica': 'aneurisma-da-aorta-toracica',
  'hipertensao-arterial-pulmonar': 'hipertensao-arterial-pulmonar',
  'sindrome-de-eisenmenger': 'sindrome-de-eisenmenger',
  'tetralogia-de-fallot-operada': 'tetralogia-de-fallot',
  'sindrome-da-cimitarra': 'sindrome-da-cimitarra',
  'sindrome-de-kartagener': 'sindrome-de-kartagener',
  pneumopericardio: 'pneumopericardio',
  'coarctacao-com-erosoes-costais': 'coarctacao-da-aorta',
  'derrame-pericardico-volumoso': 'derrame-pericardico',
  'protese-de-aorta-ascendente': 'disseccao-de-aorta-no-raio-x',
}
