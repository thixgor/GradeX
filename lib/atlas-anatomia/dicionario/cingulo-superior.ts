import type { EntradaDicionario } from './tipos'

/**
 * Cíngulo do membro superior: clavícula, escápula e ombro.
 *
 * O ombro humano trocou estabilidade por alcance. Praticamente tudo aqui — a
 * glenoide rasa, a clavícula em S, a escápula que flutua sobre o tórax, o
 * manguito que aperta a cabeça contra a cavidade — é consequência dessa troca,
 * e é também de onde vem toda a patologia da região.
 */
export const CINGULO_SUPERIOR: EntradaDicionario[] = [
  /* ─────────────────── Clavícula ─────────────────── */
  {
    termos: ['Extremidade Esternal'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade medial e arredondada da clavícula, que se articula com o manúbrio.',
    localizacao: 'Ponta medial do osso, palpável nos dois lados da incisura jugular; é mais volumosa e triangular que a extremidade lateral.',
    funcao:
      'Fecha a única articulação óssea entre o membro superior e o tronco. Um disco articular completo divide a cavidade em dois compartimentos e é o que permite ao osso girar sobre o próprio eixo quando você levanta o braço.',
    relacoes: 'Atrás dela estão a veia braquiocefálica e, do lado direito, o tronco braquiocefálico; a cúpula pleural fica logo abaixo e atrás.',
    clinica:
      'É a última epífise do corpo a fechar — entre 23 e 25 anos —, o que faz dela um dos melhores estimadores de idade em radiologia forense. A luxação esternoclavicular posterior é rara e grave: comprime traqueia e vasos, e é uma das poucas luxações que se reduzem em centro cirúrgico com equipe de cirurgia torácica de prontidão.',
    memoria:
      'Última epífise a fechar do esqueleto inteiro. Se ela ainda está aberta na tomografia, a pessoa tem menos de 25 anos.',
    pontos: [
      'Que articulação a extremidade esternal forma e que tipo ela é?',
      'Por que a luxação posterior é grave?',
      'Qual sua importância na estimativa de idade?',
    ],
  },
  {
    termos: ['Extremidade Acromial'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade lateral e achatada da clavícula, que se apoia no acrômio.',
    localizacao: 'Ponta lateral do osso, palpável no alto do ombro, formando com o acrômio um degrau perceptível.',
    funcao:
      'Forma a articulação acromioclavicular, uma sinovial plana com pouca mobilidade própria, mas indispensável: é por meio dela que o movimento da clavícula chega à escápula e permite a elevação completa do braço.',
    relacoes:
      'Estabilizada em dois planos: os ligamentos acromioclaviculares controlam o deslocamento horizontal, e os coracoclaviculares (conoide e trapezoide) impedem o deslocamento vertical.',
    clinica:
      'É a base da classificação das luxações acromioclaviculares: se só os acromioclaviculares se rompem, o desvio é pequeno (tipos I e II, tratamento conservador); se os coracoclaviculares também se rompem, a clavícula sobe e aparece o "sinal da tecla" (tipo III em diante). A anatomia decide a conduta inteira.',
    memoria:
      'Dois grupos de ligamentos: um segura de lado, outro segura de cima. Rompeu o de cima, a clavícula "salta" como tecla de piano.',
    pontos: [
      'Que ligamentos estabilizam a articulação acromioclavicular?',
      'O que é o sinal da tecla e o que ele indica?',
      'Por que a articulação AC é essencial para elevar o braço?',
    ],
  },
  {
    termos: ['Impressão do Ligamento Costoclavicular'],
    classe: 'acidente-osseo',
    resumo: 'Área rugosa na face inferior da extremidade medial da clavícula, onde se fixa o ligamento costoclavicular.',
    localizacao: 'Face inferior do terço medial do osso, próxima à articulação esternoclavicular.',
    funcao:
      'Ancora o ligamento costoclavicular, que prende a clavícula à primeira costela e é o verdadeiro pivô do movimento clavicular: o osso gira em torno dele como uma gangorra em torno do seu apoio.',
    relacoes: 'Abaixo dele está a primeira costela; medialmente, a articulação esternoclavicular.',
    clinica:
      'É esse ligamento que impede a extremidade medial de subir e que mantém a articulação esternoclavicular estável mesmo com carga no braço. Sua integridade é o que explica por que a clavícula fratura no terço médio em vez de luxar medialmente.',
    memoria:
      'Um apoio de gangorra na primeira costela. A ponta de fora sobe porque a de dentro está presa.',
    pontos: [
      'Que ligamento se insere nessa impressão?',
      'Qual seu papel mecânico no movimento da clavícula?',
      'Por que a clavícula tende a fraturar em vez de luxar medialmente?',
    ],
  },
  {
    termos: ['Sulco para o Músculo Subclávio'],
    classe: 'acidente-osseo',
    resumo: 'Goteira longitudinal na face inferior do corpo da clavícula, para a inserção do músculo subclávio.',
    localizacao: 'Face inferior do terço médio da clavícula, entre as impressões costoclavicular e conoide.',
    funcao:
      'Recebe o músculo subclávio, que abaixa e estabiliza a clavícula. Mais importante: o músculo funciona como amortecedor, protegendo os vasos subclávios que correm imediatamente abaixo.',
    relacoes: 'Sob o músculo passam a veia subclávia, a artéria subclávia e o plexo braquial — nessa ordem, de medial para lateral.',
    clinica:
      'A fratura de clavícula no terço médio é a mais comum do adulto jovem e, ainda assim, raramente lesa os vasos — é o subclávio que faz de anteparo entre o osso e o feixe. Quando a lesão vascular ocorre, é emergência. E o calo hipertrofiado dessa mesma região pode, anos depois, estreitar o desfiladeiro e comprimir o plexo braquial.',
    memoria:
      'Um músculo pequeno servindo de colchão entre o osso que quebra e os vasos que não podem quebrar.',
    pontos: [
      'Que músculo se insere nesse sulco e qual sua função protetora?',
      'Que estruturas correm abaixo da clavícula?',
      'Por que a fratura de clavícula raramente lesa os vasos?',
    ],
  },
  {
    termos: ['Tubérculo Conoide'],
    classe: 'acidente-osseo',
    resumo: 'Saliência na face inferior da clavícula, junto à borda posterior, para o ligamento conoide.',
    localizacao: 'Face inferior do terço lateral, na junção com o terço médio, na borda posterior do osso.',
    funcao:
      'Ancora o ligamento conoide, a porção medial e triangular do ligamento coracoclavicular, que sobe do processo coracoide. É o freio principal contra o deslocamento superior da clavícula.',
    relacoes: 'Faz par com a linha trapezoidea, mais lateral e anterior; juntos formam o complexo coracoclavicular.',
    clinica:
      'A junção entre o terço médio e o lateral, exatamente aqui, é a zona de transição mecânica do osso e a segunda localização mais comum de fratura de clavícula. Fraturas laterais a esse ponto, com ruptura dos coracoclaviculares, são instáveis e frequentemente cirúrgicas — a distinção entre operar ou não passa por saber onde o ligamento se prende.',
    memoria:
      '"Conoide" é o triângulo de trás, "trapezoide" é a lâmina da frente. Os dois amarram a clavícula ao coracoide, como dois tirantes.',
    pontos: [
      'Que ligamento se insere no tubérculo conoide?',
      'Que movimento ele impede?',
      'Por que fraturas laterais da clavícula podem ser instáveis?',
    ],
  },
  {
    termos: ['Linha Trapezoidea'],
    classe: 'acidente-osseo',
    resumo: 'Crista oblíqua na face inferior do terço lateral da clavícula, para o ligamento trapezoide.',
    localizacao: 'Face inferior do terço lateral, correndo anterolateralmente a partir do tubérculo conoide.',
    funcao: 'Recebe o ligamento trapezoide, a lâmina lateral do complexo coracoclavicular, que resiste ao deslocamento posterior da clavícula e transmite a força do braço para o osso.',
    relacoes: 'Com o conoide, forma o par que suspende a escápula da clavícula.',
    clinica:
      'A reconstrução do complexo coracoclavicular — com enxerto ou com botões corticais — é a cirurgia das luxações acromioclaviculares altas, e reproduz exatamente esses dois vetores. Reproduzir apenas um deles resulta em instabilidade rotacional residual.',
    memoria:
      'Trapezoide na frente, conoide atrás. Um segura contra o deslizamento para trás; o outro, contra a subida.',
    pontos: [
      'Que ligamento se insere na linha trapezoidea?',
      'Qual a diferença funcional entre conoide e trapezoide?',
      'Como isso orienta a reconstrução cirúrgica?',
    ],
  },
  /* ─────────────────── Escápula ─────────────────── */
  {
    termos: ['Espinha da Escápula'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular', 'muscular'],
    resumo: 'Crista transversal que divide a face posterior da escápula e termina no acrômio.',
    localizacao: 'Atravessa obliquamente a face dorsal da escápula, do terço superior da margem medial até o acrômio; é facilmente palpável no dorso.',
    funcao:
      'Separa a fossa supraespinhal da infraespinhal e serve de alavanca para o trapézio, que se insere na sua borda superior, e para o deltoide, que nasce da sua borda inferior. Sua raiz medial corresponde à altura de T3.',
    relacoes: 'A incisura espinoglenoidal, na sua base lateral, dá passagem ao nervo supraescapular e aos vasos supraescapulares para a fossa infraespinhal.',
    clinica:
      'A compressão do nervo supraescapular na incisura espinoglenoidal — por cisto paralabral, comum em atletas de arremesso — poupa o supraespinal e atrofia apenas o infraespinal, produzindo perda isolada da rotação externa. Já a compressão mais proximal, na incisura da escápula, atinge os dois. A altura da lesão define o déficit.',
    memoria:
      'A espinha divide a escápula em andar de cima (supraespinal) e andar de baixo (infraespinal). Quem passa pela porta de baixo só afeta o de baixo.',
    pontos: [
      'Que fossas a espinha da escápula separa?',
      'Que nervo passa pela incisura espinoglenoidal?',
      'Como diferenciar compressão do supraescapular proximal e distal?',
    ],
  },
  {
    termos: ['Fossa Supraespinhal'],
    classe: 'acidente-osseo',
    resumo: 'Depressão acima da espinha da escápula, ocupada pelo músculo supraespinal.',
    localizacao: 'Face dorsal da escápula, entre a margem superior e a espinha.',
    funcao: 'Aloja e dá origem ao supraespinal, cujo tendão passa sob o arco coracoacromial para se inserir no tubérculo maior do úmero.',
    relacoes: 'O nervo supraescapular entra na fossa pela incisura da escápula, sob o ligamento transverso superior.',
    clinica:
      'O supraespinal inicia a abdução nos primeiros 15° e é o tendão mais rompido do manguito rotador, porque é o que passa no espaço mais apertado. A atrofia da fossa supraespinhal, visível como um afundamento acima da espinha, é sinal clínico de rotura crônica ou de lesão do nervo supraescapular.',
    memoria:
      'Fossa cheia = músculo sadio. Fossa cavada, com a espinha saltando à vista, é manguito roto de longa data.',
    pontos: [
      'Que músculo ocupa a fossa supraespinhal e qual sua ação?',
      'Que nervo o inerva e por onde entra?',
      'Que sinal clínico indica atrofia dessa fossa?',
    ],
  },
  {
    termos: ['Fossa Infraespinhal'],
    classe: 'acidente-osseo',
    resumo: 'Ampla depressão abaixo da espinha da escápula, ocupada pelo músculo infraespinal.',
    localizacao: 'Face dorsal da escápula, entre a espinha e o ângulo inferior; é a maior das fossas escapulares.',
    funcao: 'Dá origem ao infraespinal, o principal rotador externo do ombro, que responde por cerca de 60% da força dessa rotação.',
    relacoes: 'O nervo supraescapular chega até ela contornando a base da espinha; o redondo menor ocupa a margem lateral, logo abaixo.',
    clinica:
      'O teste de Patte e o de rotação externa resistida avaliam esse músculo. A atrofia infraespinhal isolada aponta para compressão espinoglenoidal, e é achado frequente em jogadores de vôlei — muitas vezes assintomático, descoberto apenas no exame.',
    memoria: 'Supraespinal levanta o braço; infraespinal gira para fora. Um por cima, outro por baixo da espinha.',
    pontos: [
      'Qual a principal ação do infraespinal?',
      'Como se testa clinicamente esse músculo?',
      'Que quadro causa sua atrofia isolada?',
    ],
  },
  {
    termos: ['Fossa Subescapular'],
    classe: 'acidente-osseo',
    resumo: 'Grande concavidade da face costal da escápula, ocupada pelo músculo subescapular.',
    localizacao: 'Toda a face anterior da escápula, voltada para o gradil costal, com cristas oblíquas para as inserções tendíneas.',
    funcao:
      'Aloja o subescapular, o único componente anterior do manguito rotador e o mais potente deles, principal rotador interno e barreira contra a luxação anterior do ombro.',
    relacoes: 'Entre a face costal e o gradil existe o espaço escapulotorácico, uma articulação fisiológica de deslizamento, não sinovial.',
    clinica:
      'A lesão do subescapular é a menos diagnosticada do manguito; testa-se com a manobra de lift-off ou do belly-press. A escápula que estala ao mover-se — a bursite escapulotorácica — nasce das bursas desse espaço de deslizamento, e é queixa frequente em quem trabalha com os braços elevados.',
    memoria:
      'Três rotadores externos atrás, um rotador interno na frente: o subescapular sozinho equilibra os outros três.',
    pontos: [
      'Que músculo ocupa a fossa subescapular e qual sua ação?',
      'Como se testa clinicamente o subescapular?',
      'O que é a articulação escapulotorácica?',
    ],
  },
  {
    termos: ['Face Costal'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular', 'muscular'],
    resumo: 'Face anterior da escápula, côncava e voltada para as costelas.',
    localizacao: 'Superfície anterior do osso, apoiada da 2ª à 7ª costela, separada delas por músculo e tecido areolar.',
    funcao: 'Sua concavidade acompanha a convexidade do tórax, permitindo que a escápula deslize sobre o gradil em todas as direções — protração, retração, elevação, depressão e rotação.',
    relacoes: 'O serrátil anterior se insere na sua margem medial e mantém a escápula colada ao tórax; o subescapular ocupa a face.',
    clinica:
      'Essa aposição depende inteiramente do serrátil: lesado o nervo torácico longo, a face costal descola e aparece a escápula alada. A discinesia escapular — alteração do ritmo escapuloumeral — é hoje reconhecida como causa importante de dor no ombro, e o exame começa observando essa face pelas costas do paciente.',
    memoria:
      'A escápula não tem articulação com o tórax: ela boia sobre ele, presa por músculo. Perdeu o músculo, descola.',
    pontos: [
      'Sobre quais costelas a escápula se apoia?',
      'Que músculo a mantém aposta ao tórax?',
      'O que é discinesia escapular?',
    ],
  },
  {
    termos: ['Face Dorsal'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular', 'muscular'],
    resumo: 'Face posterior da escápula, dividida pela espinha nas fossas supra e infraespinhal.',
    localizacao: 'Superfície posterior do osso, subcutânea e coberta pelo trapézio e pelo deltoide na sua porção superior.',
    funcao: 'Oferece as duas fossas de origem dos rotadores posteriores do manguito e o apoio da espinha para trapézio e deltoide.',
    relacoes: 'Sua margem lateral dá origem ao redondo menor e ao redondo maior, de cima para baixo.',
    clinica:
      'É a face que se observa e se palpa no exame do ombro: simetria das fossas, posição do ângulo inferior e ritmo do movimento durante a elevação dizem mais sobre patologia escapular do que qualquer manobra isolada.',
    memoria: 'Uma espinha atravessando, duas fossas e uma margem lateral com dois "redondos". É o mapa inteiro da face de trás.',
    pontos: [
      'Que estruturas dividem e ocupam a face dorsal?',
      'Que músculos nascem da margem lateral?',
      'Que músculos superficiais a recobrem?',
    ],
  },
  {
    termos: ['Margem Medial'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular', 'muscular'],
    resumo: 'Borda vertical da escápula voltada para a coluna, também chamada margem vertebral.',
    localizacao: 'Do ângulo superior ao ângulo inferior, paralela à coluna, a cerca de 5 cm dos processos espinhosos.',
    funcao:
      'Recebe, na face anterior, o serrátil anterior, e na posterior os romboides maior e menor e o elevador da escápula. É a corda de um cabo de guerra: o serrátil puxa para a frente, os romboides puxam para trás.',
    relacoes: 'O nervo dorsal da escápula (C5) desce ao longo dela, sob os romboides, junto com a artéria escapular dorsal.',
    clinica:
      'A dor interescapular crônica frequentemente vem do desequilíbrio dessa dupla, com romboides sobrecarregados. A lesão do nervo dorsal da escápula produz um alamento medial discreto e lateralização da escápula em repouso, que se distingue do alado clássico do serrátil pela direção do desvio.',
    memoria:
      'Serrátil puxa para a frente, romboide puxa para trás. Se um dos dois falha, a escápula "vaza" para o lado do que restou.',
    pontos: [
      'Que músculos se inserem na margem medial?',
      'Que nervo corre ao longo dela?',
      'Como diferenciar alamento por serrátil e por romboide?',
    ],
  },
  {
    termos: ['Margem Lateral'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular', 'muscular'],
    resumo: 'Borda espessa da escápula que desce da cavidade glenoidal ao ângulo inferior — a margem axilar.',
    localizacao: 'Do tubérculo infraglenoidal ao ângulo inferior, voltada para a axila; é a borda mais espessa do osso.',
    funcao: 'Dá origem ao redondo menor, em cima, e ao redondo maior, embaixo. Sua espessura é a resposta à tração desses músculos e à transmissão de carga do braço para o osso.',
    relacoes: 'A artéria circunflexa da escápula contorna a margem lateral pelo espaço triangular; o nervo axilar e a artéria circunflexa umeral posterior atravessam o espaço quadrangular, mais acima.',
    clinica:
      'A margem lateral é o "pilar" da escápula e o corredor onde as placas de fixação são posicionadas nas fraturas do corpo escapular. Os espaços triangular e quadrangular, delimitados por ela, são sedes de síndromes compressivas raras mas cobradas — a do espaço quadrangular cursa com dor e atrofia do redondo menor e do deltoide.',
    memoria:
      'Borda grossa porque puxa muito peso. Nela se penduram os dois "redondos" e por ela contornam os vasos da axila.',
    pontos: [
      'Que músculos nascem da margem lateral?',
      'Que estruturas atravessam os espaços triangular e quadrangular?',
      'Por que essa margem é o pilar de fixação nas fraturas?',
    ],
  },
  {
    termos: ['Margem Superior'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular', 'muscular'],
    resumo: 'Borda mais curta e delgada da escápula, interrompida pela incisura da escápula.',
    localizacao: 'Do ângulo superior até a base do processo coracoide, onde se abre a incisura da escápula.',
    funcao: 'Dá inserção ao ventre inferior do omo-hióideo e é atravessada, na incisura, pelo nervo supraescapular.',
    relacoes: 'O ligamento transverso superior da escápula converte a incisura em forame; a artéria supraescapular passa acima do ligamento, o nervo passa abaixo.',
    clinica:
      'A regra "Army over the bridge, Navy under the bridge" — artéria por cima, nervo por baixo — resolve a questão clássica e explica por que a compressão nervosa é possível sem comprometer a circulação.',
    memoria:
      'Artéria por cima da ponte, nervo por baixo. Ponte é o ligamento transverso superior.',
    pontos: [
      'O que passa acima e abaixo do ligamento transverso superior?',
      'Que músculo se insere na margem superior?',
      'Por que a compressão nervosa aí é isolada?',
    ],
  },
  {
    termos: ['Incisura da Escápula'],
    classe: 'passagem-ossea',
    resumo: 'Entalhe na margem superior da escápula, junto ao coracoide, que o ligamento transforma em forame.',
    localizacao: 'Margem superior do osso, imediatamente medial à base do processo coracoide.',
    funcao: 'Deixa passar o nervo supraescapular (C5–C6), que vai inervar o supraespinal e o infraespinal.',
    relacoes: 'Coberta pelo ligamento transverso superior, que pode estar ossificado; a artéria supraescapular passa por cima dele.',
    clinica:
      'É o local mais frequente de neuropatia do supraescapular, com dor profunda no ombro e fraqueza da abdução e da rotação externa. A liberação artroscópica do ligamento é o tratamento. Em anatomia variante, o ligamento ossificado transforma a incisura em forame verdadeiro e aumenta o risco de compressão.',
    memoria: 'Um entalhe que um ligamento transforma em túnel. Todo túnel do corpo é um lugar onde nervo pode ser preso.',
    pontos: [
      'Que nervo passa pela incisura da escápula?',
      'Que estrutura a converte em forame?',
      'Que quadro clínico resulta da sua compressão?',
    ],
  },
  {
    termos: ['Ângulo Superior'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular', 'muscular'],
    resumo: 'Canto superomedial da escápula, onde se insere o músculo elevador da escápula.',
    localizacao: 'Encontro das margens superior e medial, na altura da 2ª costela, coberto pelo trapézio.',
    funcao: 'Recebe o elevador da escápula, que eleva e roda a escápula para baixo, e participa da inclinação lateral do pescoço quando a escápula está fixa.',
    relacoes: 'Está profundamente ao trapézio e superficialmente ao serrátil anterior.',
    clinica:
      'É o ponto-gatilho mais frequente do dorso alto: a dor do "peso no ombro" após horas ao computador localiza-se exatamente aqui e reproduz-se à palpação do ângulo superior. O elevador da escápula é encurtado em praticamente todo paciente com cervicalgia postural.',
    memoria: 'O canto onde dói quando você passa o dia com o ombro tenso. Aperte o canto de cima da escápula e confirme.',
    pontos: [
      'Que músculo se insere no ângulo superior?',
      'Em que nível costal ele se situa?',
      'Por que é ponto-gatilho comum?',
    ],
  },
  {
    termos: ['Ângulo Inferior'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular', 'muscular'],
    resumo: 'Ponta inferior da escápula, o reparo de superfície mais útil do dorso.',
    localizacao: 'Encontro das margens medial e lateral; com o braço ao lado do corpo, corresponde ao nível da 7ª costela e do processo espinhoso de T7.',
    funcao: 'Recebe fibras do latíssimo do dorso e do serrátil anterior; é o ponto que mais se desloca na rotação da escápula, descrevendo um arco amplo quando o braço se eleva.',
    relacoes: 'Coberto pelo latíssimo do dorso; abaixo dele está o triângulo de ausculta.',
    clinica:
      'É a régua do exame do tórax: o ângulo inferior marca T7 e a linha de referência para a percussão e a ausculta pulmonar posterior, e para escolher o espaço de uma toracocentese. Acompanhar seu deslocamento durante a elevação do braço é o modo mais simples de avaliar o ritmo escapuloumeral, que é de 2:1 entre glenoumeral e escapulotorácica.',
    memoria:
      'Ângulo inferior = T7 = 7ª costela. Uma ponta óssea que você acha em dois segundos e que organiza todo o exame do tórax.',
    pontos: [
      'Que nível vertebral e costal o ângulo inferior marca?',
      'Que músculos se relacionam com ele?',
      'O que é o ritmo escapuloumeral?',
    ],
  },
  {
    termos: ['Cavidade Glenoidal'],
    classe: 'acidente-osseo',
    resumo: 'Superfície articular rasa e piriforme da escápula, que recebe a cabeça do úmero.',
    localizacao: 'No ângulo lateral da escápula, voltada lateralmente, para a frente e para cima; é aprofundada pelo lábio glenoidal.',
    funcao:
      'Recebe a cabeça do úmero numa relação de área de cerca de 1 para 3 — a glenoide cobre apenas um terço da cabeça. É essa desproporção que dá ao ombro a maior amplitude de movimento do corpo e, ao mesmo tempo, faz dele a articulação que mais luxa.',
    relacoes: 'O lábio glenoidal a aprofunda em cerca de 50%; a cápsula, os ligamentos glenoumerais e o manguito completam a estabilidade.',
    clinica:
      'Como o osso quase não trava nada, a estabilidade é toda de partes moles: por isso a luxação anterior recorrente costuma vir com lesão de Bankart (avulsão do lábio anteroinferior) e Hill-Sachs (impactação na cabeça umeral). Perda óssea glenoidal maior que 20–25% muda a cirurgia de reparo labral para transferência óssea (Latarjet).',
    memoria:
      'Uma bola de golfe apoiada num tee: pouquíssimo encaixe, muita liberdade. Quem segura não é o osso, é o tecido mole.',
    pontos: [
      'Qual a proporção entre cavidade glenoidal e cabeça umeral?',
      'O que estabiliza o ombro, já que o osso não o faz?',
      'O que são as lesões de Bankart e de Hill-Sachs?',
    ],
  },
  {
    termos: ['Tubérculo Supraglenoidal'],
    classe: 'acidente-osseo',
    resumo: 'Pequena saliência acima da cavidade glenoidal, origem da cabeça longa do bíceps braquial.',
    localizacao: 'Imediatamente superior à borda da cavidade glenoidal, dentro da cápsula articular.',
    funcao:
      'Dá origem ao tendão da cabeça longa do bíceps, que é intra-articular mas extrassinovial: ele atravessa a articulação do ombro e sai pelo sulco intertubercular do úmero. É o único tendão do corpo com esse trajeto tão peculiar.',
    relacoes: 'Sua inserção mistura-se com as fibras do lábio glenoidal superior.',
    clinica:
      'Essa continuidade explica a lesão SLAP (superior labrum anterior to posterior): a tração do bíceps arranca o complexo bíceps-lábio superior, típica de arremessadores e de quedas com o braço em extensão. E é por o tendão passar dentro da articulação que a tendinite bicipital dá dor anterior do ombro difícil de distinguir da lesão do manguito.',
    memoria:
      'O bíceps nasce dentro do ombro e sai por um sulco. Um tendão que atravessa a articulação inteira é um tendão que sofre.',
    pontos: [
      'Que tendão nasce no tubérculo supraglenoidal?',
      'Por que ele é intra-articular e extrassinovial?',
      'O que é uma lesão SLAP?',
    ],
  },
  {
    termos: ['Tubérculo Infraglenoidal'],
    classe: 'acidente-osseo',
    resumo: 'Saliência abaixo da cavidade glenoidal, origem da cabeça longa do tríceps braquial.',
    localizacao: 'Imediatamente inferior à borda da glenoide, no início da margem lateral da escápula.',
    funcao:
      'Dá origem à cabeça longa do tríceps, o único componente do músculo que cruza a articulação do ombro e, portanto, o único que também faz extensão e adução do braço, além da extensão do cotovelo.',
    relacoes: 'A cabeça longa do tríceps divide o espaço abaixo do redondo menor em espaço quadrangular (lateral) e triangular (medial).',
    clinica:
      'É essa divisão que organiza a topografia da axila posterior: pelo quadrangular passam o nervo axilar e a circunflexa umeral posterior — lesados na luxação anterior do ombro e na fratura do colo cirúrgico do úmero. A perda de sensibilidade no "distintivo de sargento" sobre o deltoide é o teste rápido do nervo axilar.',
    memoria:
      'A cabeça longa do tríceps é a "trave" que divide dois buracos. No buraco de fora passa o nervo axilar.',
    pontos: [
      'Que músculo nasce no tubérculo infraglenoidal?',
      'Que espaços a cabeça longa do tríceps delimita?',
      'Como se testa o nervo axilar clinicamente?',
    ],
  },
  /* ─────────────────── Articulação do ombro ─────────────────── */
  {
    termos: ['Cápsula Articular'],
    classe: 'articulacao',
    sistemas: ['articular'],
    resumo: 'Manga fibrosa frouxa que envolve a articulação glenoumeral, do lábio ao colo anatômico do úmero.',
    localizacao:
      'Insere-se medialmente na margem da cavidade glenoidal, além do lábio, e lateralmente no colo anatômico do úmero, descendo cerca de um centímetro no colo cirúrgico medialmente.',
    funcao:
      'É deliberadamente frouxa — tem cerca do dobro do volume da cabeça umeral —, o que permite a amplitude do ombro. A estabilidade vem dos reforços: os ligamentos glenoumerais superior, médio e inferior, e o coracoumeral. O ligamento glenoumeral inferior é o principal freio à luxação anterior com o braço em abdução e rotação externa — a posição do arremesso.',
    vascularizacao: 'Artérias circunflexas umerais anterior e posterior e ramos da supraescapular e circunflexa da escápula.',
    inervacao: 'Nervos axilar, supraescapular e peitoral lateral — o que explica a dor referida difusa do ombro.',
    relacoes:
      'O recesso axilar, a parte inferior e mais frouxa da cápsula, é o ponto por onde a cabeça escapa nas luxações inferiores; a bolsa subescapular comunica-se com a articulação pelo forame de Weitbrecht.',
    clinica:
      'A capsulite adesiva (ombro congelado) é a retração dessa cápsula, sobretudo do intervalo dos rotadores e do ligamento coracoumeral, com perda característica primeiro da rotação externa passiva — o dado que a distingue de qualquer tendinopatia. Já a frouxidão capsular difusa é a base da instabilidade multidirecional, que se trata primeiro com reabilitação, não com cirurgia.',
    memoria:
      'Uma cápsula com o dobro do tamanho da bola: folga é liberdade. Quando ela encolhe, o ombro congela e a rotação externa é a primeira a ir embora.',
    pontos: [
      'Por que a cápsula do ombro é frouxa?',
      'Qual o principal ligamento contra a luxação anterior?',
      'Que movimento se perde primeiro na capsulite adesiva?',
    ],
  },
  {
    termos: ['Ligamento Coracoacromial'],
    classe: 'ligamento',
    resumo: 'Lâmina fibrosa triangular entre o coracoide e o acrômio, que fecha o teto do ombro.',
    localizacao: 'Estende-se da borda lateral do processo coracoide até a ponta do acrômio, formando com esses dois processos o arco coracoacromial.',
    funcao:
      'Cria um teto osteofibroso sobre a cabeça do úmero. É um dos raros ligamentos que unem dois pontos do mesmo osso, e sua função não é limitar movimento, e sim impedir o deslocamento superior da cabeça umeral.',
    relacoes: 'Entre o arco e o supraespinal está a bolsa subacromial; o tendão do supraespinal desliza sob o ligamento a cada elevação do braço.',
    clinica:
      'É o palco da síndrome do impacto: com a elevação repetida, o supraespinal e a bolsa são comprimidos entre o úmero e o arco, produzindo bursite, tendinopatia e, com o tempo, rotura. A acromioplastia amplia esse espaço. Mas atenção — em rotura maciça do manguito, o arco é o último anteparo contra a migração superior da cabeça, e ressecá-lo piora tudo.',
    memoria:
      'Um telhado sobre a cabeça do úmero. Bom telhado protege; telhado baixo demais esmaga o tendão que passa embaixo.',
    pontos: [
      'Que estruturas formam o arco coracoacromial?',
      'O que passa entre o arco e a cabeça do úmero?',
      'Por que ressecar o ligamento pode ser prejudicial?',
    ],
  },
  /* ─────────────────── Músculos do ombro ─────────────────── */
  {
    termos: ['Manguito Rotador'],
    classe: 'musculo',
    resumo: 'Conjunto de quatro tendões que envolve a cabeça do úmero e a mantém centrada na glenoide.',
    localizacao:
      'Supraespinal em cima, infraespinal e redondo menor atrás, subescapular à frente. Os três primeiros se inserem no tubérculo maior; o subescapular, no menor.',
    funcao:
      'A função do manguito não é mover o braço — é segurá-lo. Ele comprime a cabeça contra a glenoide e cria o ponto fixo em torno do qual o deltoide gera movimento. Sem ele, o deltoide simplesmente empurra a cabeça para cima em vez de elevar o braço.',
    vascularizacao:
      'Artérias supraescapular, circunflexa da escápula e circunflexas umerais. O supraespinal tem uma zona crítica hipovascular a cerca de 1 cm da inserção, onde a maioria das roturas começa.',
    inervacao: 'Supraescapular (supra e infraespinal), axilar (redondo menor) e subescapulares superior e inferior (subescapular).',
    relacoes: 'Desliza sob o arco coracoacromial e a bolsa subacromial-subdeltóidea; o intervalo dos rotadores, entre supraespinal e subescapular, aloja o tendão do bíceps.',
    clinica:
      'A rotura do manguito é a causa mais comum de dor crônica no ombro após os 50 anos. O quadro clássico é dor noturna ao deitar sobre o lado e arco doloroso entre 60° e 120°. A sequência clínica de testes segue a anatomia: Jobe para o supraespinal, rotação externa resistida para o infraespinal, lift-off para o subescapular. Roturas maciças levam à artropatia do manguito, com ascensão da cabeça umeral visível na radiografia simples.',
    memoria:
      'SIRS: Supraespinal, Infraespinal, Redondo menor, Subescapular. Três atrás e um na frente, abraçando a bola para que o deltoide possa girá-la.',
    pontos: [
      'Quais são os quatro músculos e onde cada um se insere?',
      'Por que o manguito é indispensável para a ação do deltoide?',
      'Que teste avalia cada componente?',
    ],
  },
  {
    termos: ['Músculo Deltoide - Porção Clavicular'],
    classe: 'musculo',
    resumo: 'Porção anterior do deltoide, que nasce do terço lateral da clavícula e flete o braço.',
    localizacao: 'Terço lateral da margem anterior da clavícula até a tuberosidade deltóidea do úmero.',
    funcao: 'Flexiona e roda medialmente o braço; trabalha junto com o peitoral maior nos movimentos de alcançar para a frente.',
    vascularizacao: 'Artéria toracoacromial (ramo deltóideo) e circunflexa umeral posterior.',
    inervacao: 'Nervo axilar (C5–C6).',
    relacoes: 'Com o peitoral maior, delimita o sulco deltopeitoral, por onde corre a veia cefálica.',
    clinica:
      'O sulco deltopeitoral é a via de acesso padrão à articulação do ombro e o local de punção da veia cefálica para implante de marca-passo. Preservar a veia cefálica nesse acesso é regra: ela é o único caminho venoso superficial calibroso da região.',
    memoria: 'Deltoide anterior empurra para a frente, junto com o peitoral. Entre os dois corre a veia cefálica, num sulco visível.',
    pontos: [
      'Qual a ação da porção clavicular do deltoide?',
      'Que estrutura corre no sulco deltopeitoral?',
      'Que uso cirúrgico tem esse sulco?',
    ],
  },
  {
    termos: ['Músculo Deltoide - Porção Acromial'],
    classe: 'musculo',
    resumo: 'Porção média e multipenada do deltoide, o principal abdutor do braço.',
    localizacao: 'Da margem lateral do acrômio até a tuberosidade deltóidea, com arquitetura multipenada que lhe dá grande força.',
    funcao:
      'Abduz o braço a partir de cerca de 15° — os primeiros graus são do supraespinal. É a porção mais potente, e sua arquitetura multipenada é o que lhe permite gerar força sem grande amplitude de encurtamento.',
    vascularizacao: 'Artérias circunflexas umerais posterior e anterior.',
    inervacao: 'Nervo axilar (C5–C6), que contorna o colo cirúrgico do úmero e entra pela face profunda.',
    relacoes: 'O nervo axilar cruza a face profunda a cerca de 5 a 7 cm abaixo do acrômio — limite obrigatório de qualquer abordagem lateral.',
    clinica:
      'Essa distância é regra cirúrgica: incisões deltóideas que descem mais que 5 cm do acrômio arriscam denervar a porção anterior. A injeção intramuscular no deltoide também respeita esse limite, aplicando-se dois a três dedos abaixo do acrômio. Lesão do axilar produz perda da abdução e anestesia sobre a face lateral do ombro.',
    memoria:
      'Cinco centímetros abaixo do acrômio passa o nervo axilar. É a "linha vermelha" da agulha e do bisturi.',
    pontos: [
      'Que porção do deltoide é a principal abdutora?',
      'Onde o nervo axilar cruza o músculo?',
      'Onde se aplica corretamente a injeção deltóidea?',
    ],
  },
  {
    termos: ['Músculo Deltoide - Porção Espinal'],
    classe: 'musculo',
    resumo: 'Porção posterior do deltoide, que nasce da espinha da escápula e estende o braço.',
    localizacao: 'Borda inferior da espinha da escápula até a tuberosidade deltóidea.',
    funcao: 'Estende e roda lateralmente o braço; é a porção que atua ao puxar o braço para trás e é antagonista direta da porção clavicular.',
    vascularizacao: 'Artéria circunflexa umeral posterior e ramos da subescapular.',
    inervacao: 'Nervo axilar (C5–C6).',
    relacoes: 'Cobre o espaço quadrangular por onde o nervo axilar entra na região.',
    clinica:
      'A oposição funcional entre as três porções do deltoide é o que permite ao músculo participar de movimentos opostos, e é por isso que a paralisia do axilar não se compensa: perde-se abdução, flexão e extensão do ombro ao mesmo tempo. O ombro fica "quadrado" pela atrofia — sinal visível a distância.',
    memoria:
      'Três porções, três direções: frente, lado e trás. Um só nervo para as três — e por isso uma só lesão apaga todas.',
    pontos: [
      'Qual a ação da porção espinal do deltoide?',
      'Por que as três porções podem ser antagonistas entre si?',
      'Que sinal visual indica atrofia deltóidea?',
    ],
  },
]
