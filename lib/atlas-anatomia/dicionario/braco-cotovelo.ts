import type { EntradaDicionario } from './tipos'

/**
 * Braço e cotovelo.
 *
 * O úmero é um osso com nervos amarrados a ele em três pontos — colo cirúrgico,
 * sulco radial e epicôndilo medial — e é exatamente por isso que cada fratura
 * do úmero tem um déficit neurológico previsível. Ensinar o osso sem ensinar o
 * nervo que passa por ele é deixar metade da aula de fora.
 */
export const BRACO_COTOVELO: EntradaDicionario[] = [
  /* ─────────────────── Úmero proximal ─────────────────── */
  {
    termos: ['Cabeça do Úmero'],
    classe: 'acidente-osseo',
    resumo: 'Hemisfério articular do úmero, voltado para cima, para dentro e para trás, que se encaixa na glenoide.',
    localizacao:
      'Extremidade proximal do úmero, separada dos tubérculos pelo colo anatômico. Faz cerca de 130° com a diáfise e é retrovertida em torno de 30° em relação ao plano dos epicôndilos.',
    funcao:
      'É a peça móvel da articulação glenoumeral. Sua área é cerca de três vezes a da glenoide, o que dá amplitude à custa de estabilidade. A retroversão orienta a cabeça para a glenoide, que também é levemente retrovertida.',
    vascularizacao:
      'Ramos ascendentes da artéria circunflexa umeral anterior (artéria arqueada) e da circunflexa umeral posterior, que hoje se sabe ser a fonte dominante do suprimento da cabeça.',
    relacoes: 'Coberta pelo manguito rotador e pela cápsula; medialmente estão o feixe axilar e o plexo braquial.',
    clinica:
      'A dependência de vasos que sobem pelo colo é o que torna a necrose avascular uma complicação real das fraturas em quatro partes do úmero proximal. Na luxação anterior, a cabeça desliza para a posição subcoracóidea e o ombro perde o contorno arredondado, ganhando o "sinal da dragona".',
    memoria:
      'Bola grande em prato pequeno, com o sangue chegando por baixo. Fratura que separa a cabeça do colo é fratura que a deixa sem sangue.',
    pontos: [
      'Qual a relação de área entre cabeça umeral e glenoide?',
      'Qual a principal fonte de irrigação da cabeça?',
      'Por que fraturas em quatro partes evoluem com necrose avascular?',
    ],
  },
  {
    termos: ['Colo Anatômico'],
    classe: 'acidente-osseo',
    resumo: 'Sulco raso que circunda a cabeça do úmero, na linha de inserção da cápsula articular.',
    localizacao: 'Imediatamente lateral e distal à borda da superfície articular, separando a cabeça dos dois tubérculos.',
    funcao: 'Marca o limite da cartilagem articular e a linha de inserção da cápsula — é o resto da placa epifisária embrionária.',
    relacoes: 'A cápsula insere-se nele em quase toda a circunferência, descendo apenas medialmente para o colo cirúrgico.',
    clinica:
      'A fratura do colo anatômico é rara, mas é a de pior prognóstico do úmero proximal: por estar dentro da inserção capsular, interrompe a vascularização terminal da cabeça e evolui quase sempre para necrose. É o contraponto exato da fratura do colo cirúrgico, muito mais comum e muito mais benigna.',
    memoria:
      'Anatômico é o colo "de verdade", raro de quebrar e péssimo quando quebra. Cirúrgico é o colo que quebra sempre e costuma dar certo.',
    pontos: [
      'O que o colo anatômico representa embriologicamente?',
      'Por que sua fratura tem mau prognóstico?',
      'Onde a cápsula articular se insere?',
    ],
  },
  {
    termos: ['Colo Cirúrgico'],
    classe: 'acidente-osseo',
    resumo: 'Estreitamento do úmero abaixo dos tubérculos, na transição para a diáfise — o ponto que mais fratura.',
    localizacao: 'Logo abaixo dos tubérculos maior e menor, na junção entre a epífise proximal e a diáfise.',
    funcao: 'Zona de transição entre osso esponjoso e cortical, e por isso ponto de concentração de tensão.',
    relacoes:
      'O nervo axilar e a artéria circunflexa umeral posterior contornam o osso exatamente nesse nível, passando pelo espaço quadrangular.',
    clinica:
      'É a fratura proximal do úmero mais comum, típica de idoso que cai da própria altura, e o exame neurológico obrigatório é o do nervo axilar: sensibilidade na face lateral do ombro e contração do deltoide. Recebe o nome de "cirúrgico" justamente por ser o colo que interessa ao cirurgião, e não ao anatomista.',
    memoria:
      'Colo cirúrgico + nervo axilar formam par fixo. Toda vez que ler "colo cirúrgico", pergunte pelo deltoide e pela sensibilidade lateral do ombro.',
    pontos: [
      'Que nervo e que artéria contornam o colo cirúrgico?',
      'Por que essa é a região que mais fratura no úmero proximal?',
      'Que exame neurológico é obrigatório nessa fratura?',
    ],
  },
  {
    termos: ['Tubérculo Maior'],
    classe: 'acidente-osseo',
    resumo: 'Proeminência lateral do úmero proximal, com três facetas para os rotadores posteriores do manguito.',
    localizacao: 'Face lateral da extremidade proximal, lateralmente ao sulco intertubercular; é o ponto ósseo mais lateral do ombro.',
    funcao:
      'Recebe, de cima para baixo, o supraespinal, o infraespinal e o redondo menor — três tendões, três facetas, uma sequência que vale a pena memorizar porque explica a ordem de rotura do manguito.',
    relacoes: 'Desliza sob o arco coracoacromial na abdução; a bolsa subacromial o separa do acrômio.',
    clinica:
      'Sua fratura isolada acompanha a luxação anterior do ombro e é o principal motivo de radiografia obrigatória após redução. Quando o fragmento se desloca mais de 5 mm, tende à cirurgia, porque o supraespinal traciona o fragmento para cima e bloqueia a abdução.',
    memoria:
      'Três facetas, três músculos, de cima para baixo: Supraespinal, Infraespinal, Redondo menor. "SIR", na ordem em que você lê a peça.',
    pontos: [
      'Que músculos se inserem no tubérculo maior e em que ordem?',
      'Que lesão frequentemente acompanha sua fratura?',
      'Por que o fragmento desviado bloqueia a abdução?',
    ],
  },
  {
    termos: ['Tubérculo Menor'],
    classe: 'acidente-osseo',
    resumo: 'Proeminência anterior do úmero proximal, exclusiva do músculo subescapular.',
    localizacao: 'Face anterior da extremidade proximal, medialmente ao sulco intertubercular.',
    funcao: 'Recebe o tendão do subescapular, único componente anterior do manguito e principal rotador interno do ombro.',
    relacoes: 'É o limite medial do sulco intertubercular; o ligamento umeral transverso vai dele ao tubérculo maior, cobrindo o sulco.',
    clinica:
      'Sua fratura isolada é rara e sugere luxação posterior do ombro — lesão que passa despercebida em até metade dos casos na radiografia em AP e que se associa classicamente a crises convulsivas e choque elétrico. Diante de tubérculo menor fraturado, peça o perfil axilar.',
    memoria:
      'Menor = subescapular = rotação interna. Fratura de tubérculo menor deve fazer você pensar em luxação posterior, não anterior.',
    pontos: [
      'Que músculo se insere no tubérculo menor?',
      'Que lesão sua fratura isolada sugere?',
      'Que ligamento une os dois tubérculos?',
    ],
  },
  {
    termos: ['Sulco Intertubercular'],
    classe: 'acidente-osseo',
    resumo: 'Goteira entre os dois tubérculos por onde desliza o tendão da cabeça longa do bíceps.',
    localizacao: 'Face anterior do úmero proximal, entre os tubérculos maior e menor, prolongando-se distalmente por alguns centímetros.',
    funcao:
      'Guia o tendão da cabeça longa do bíceps, mantido no lugar pelo ligamento umeral transverso e pela polia do bíceps. Suas bordas recebem inserções: o peitoral maior no lábio lateral, o redondo maior no medial e o latíssimo do dorso no assoalho.',
    relacoes: 'O ramo deltóideo da artéria toracoacromial e o ramo ascendente da circunflexa umeral anterior acompanham o tendão no sulco.',
    clinica:
      'A luxação medial do tendão do bíceps, que escapa do sulco, é praticamente patognomônica de lesão do subescapular — a polia depende dele. Um sulco raso predispõe a essa instabilidade. É também o ponto de dor à palpação na tendinite bicipital, com o braço em rotação neutra.',
    memoria:
      'Do lábio de fora para dentro: Peitoral maior, Redondo maior no meio? Não — "Senhorita entre dois maiores": peitoral maior por fora, latíssimo no fundo, redondo maior por dentro.',
    pontos: [
      'Que tendão corre no sulco intertubercular?',
      'Que três músculos se inserem nas suas bordas e assoalho?',
      'O que a luxação medial do tendão do bíceps indica?',
    ],
  },
  /* ─────────────────── Diáfise ─────────────────── */
  {
    termos: ['Corpo do Úmero'],
    classe: 'acidente-osseo',
    resumo: 'Diáfise do úmero, cilíndrica em cima e triangular embaixo, cruzada atrás pelo sulco do nervo radial.',
    localizacao: 'Entre o colo cirúrgico e a região supracondilar; a tuberosidade deltóidea marca sua face lateral, no terço médio.',
    funcao: 'Transmite a força do ombro ao cotovelo e serve de origem aos músculos do braço: braquial à frente, tríceps atrás.',
    vascularizacao: 'Artéria braquial profunda e artéria nutrícia, que entra no terço médio.',
    relacoes:
      'O nervo radial percorre a face posterior no sulco radial, do terço médio para o distal, e depois perfura o septo intermuscular lateral; o nervo ulnar corre no compartimento posterior distal.',
    clinica:
      'A fratura de diáfise umeral tem a lesão do nervo radial como complicação clássica — presente em cerca de 10% dos casos —, com punho caído e perda da extensão dos dedos. Na esmagadora maioria é neuropraxia e recupera em semanas, o que muda a conduta: observar antes de explorar. A fratura de Holstein-Lewis, oblíqua no terço distal, é a exceção que costuma exigir exploração.',
    memoria:
      'Punho caído após fratura de braço = nervo radial. E, na maioria, o nervo está contundido, não cortado: espere antes de operar.',
    pontos: [
      'Que nervo corre no sulco radial e o que sua lesão causa?',
      'Qual a conduta inicial na paralisia radial pós-fratura?',
      'Que músculos nascem da diáfise umeral?',
    ],
  },
  {
    termos: ['Tuberosidade do Úmero'],
    classe: 'acidente-osseo',
    resumo: 'Rugosidade em V na face lateral da diáfise, onde o deltoide se insere.',
    localizacao: 'Face anterolateral do corpo do úmero, no limite entre o terço proximal e o médio.',
    funcao:
      'Recebe as três porções do deltoide convergindo num único tendão. É o ponto onde a força de abdução se aplica ao osso, com braço de alavanca curto e, portanto, grande exigência de força muscular.',
    relacoes: 'Logo atrás e distalmente a ela começa o sulco do nervo radial, na face posterior.',
    clinica:
      'É a referência do limite distal seguro da via de acesso lateral ao úmero: descer além dela aproxima o campo do nervo radial. A tuberosidade também marca, na radiografia, a transição em que a fratura passa a ser "de diáfise" com risco radial.',
    memoria: 'Um V na lateral do braço onde o deltoide termina. Abaixo desse V, o nervo radial já está do outro lado do osso.',
    pontos: [
      'Que músculo se insere na tuberosidade deltóidea?',
      'Que estrutura nervosa está próxima, na face posterior?',
      'Por que ela é limite em vias de acesso laterais?',
    ],
  },
  {
    termos: ['Sulco do Nervo Radial'],
    classe: 'acidente-osseo',
    resumo: 'Goteira oblíqua na face posterior da diáfise umeral onde correm o nervo radial e a artéria braquial profunda.',
    localizacao: 'Desce em espiral pela face posterior do úmero, de medial e superior para lateral e inferior, entre as cabeças lateral e medial do tríceps.',
    funcao: 'Guia o nervo radial e a artéria braquial profunda do compartimento posterior para o anterolateral, onde o nervo perfura o septo intermuscular lateral.',
    relacoes: 'O nervo está em contato direto com o periósteo em boa parte do trajeto — nada o separa do osso.',
    clinica:
      'É essa aderência ao periósteo que explica a alta frequência de paralisia radial nas fraturas do terço médio. A mesma anatomia produz a "paralisia do sábado à noite", quando alguém dorme com o braço apoiado no encosto de uma cadeira e comprime o nervo contra o osso. E o uso prolongado de muleta que apoia na axila comprime o radial mais proximalmente, com o mesmo resultado.',
    memoria:
      'O nervo radial dá a volta no úmero como uma cobra numa árvore, encostado no osso. Osso que quebra ou que é comprimido leva o nervo junto.',
    pontos: [
      'Que estruturas correm no sulco radial?',
      'Por que o radial é tão vulnerável nas fraturas de diáfise?',
      'O que é a paralisia do sábado à noite?',
    ],
  },
  {
    termos: ['Sulco para o Nervo Ulnar'],
    classe: 'acidente-osseo',
    resumo: 'Goteira atrás do epicôndilo medial por onde o nervo ulnar cruza o cotovelo, imediatamente sob a pele.',
    localizacao: 'Face posterior do epicôndilo medial do úmero, entre ele e o olécrano, coberta apenas pelo retináculo e pela pele.',
    funcao: 'Conduz o nervo ulnar do compartimento posterior do braço para o antebraço, onde ele entra entre as duas cabeças do flexor ulnar do carpo.',
    relacoes: 'É o túnel cubital; a artéria colateral ulnar superior acompanha o nervo.',
    clinica:
      'Bater aqui produz o choque no 4º e 5º dedos que todo mundo conhece. A compressão crônica no túnel cubital é a segunda neuropatia compressiva mais comum, atrás só do túnel do carpo: parestesia ulnar que piora com o cotovelo flexionado, atrofia do primeiro interósseo dorsal e, tardiamente, a "mão em garra". Fraturas supracondilares e o valgo pós-traumático causam a paralisia ulnar tardia.',
    memoria:
      'O "osso engraçado" não tem graça nenhuma: é nervo, não osso. E ele está literalmente na superfície, entre duas saliências.',
    pontos: [
      'Onde exatamente o nervo ulnar cruza o cotovelo?',
      'Que sintomas a síndrome do túnel cubital produz?',
      'Por que a flexão do cotovelo agrava os sintomas?',
    ],
  },
  /* ─────────────────── Úmero distal e cotovelo ─────────────────── */
  {
    termos: ['Fossa do Olécrano'],
    classe: 'acidente-osseo',
    resumo: 'Depressão profunda na face posterior do úmero distal que recebe o olécrano na extensão completa.',
    localizacao: 'Face posterior da extremidade distal do úmero, acima da tróclea.',
    funcao:
      'Acomoda o ápice do olécrano quando o cotovelo se estende por completo, permitindo os últimos graus de extensão. Sua parede é tão fina que, em muitos crânios ósseos, o osso é translúcido ou perfurado (forame supratroclear).',
    relacoes: 'Está separada da fossa coronoide, anterior, por uma lâmina óssea de poucos milímetros.',
    clinica:
      'É o ponto mais frágil do úmero distal e o traço por onde correm as fraturas supracondilares da criança — a fratura mais comum do cotovelo infantil, tipicamente por queda com a mão espalmada. O deslocamento posterior do fragmento distal ameaça a artéria braquial e o nervo mediano, e a mão sem pulso com fratura supracondilar é emergência.',
    memoria:
      'Duas fossas, uma na frente e outra atrás, separadas por uma folha de osso. É onde o úmero é fino — e onde ele quebra na criança.',
    pontos: [
      'Que estrutura ocupa a fossa do olécrano na extensão?',
      'Por que essa região é a mais frágil do úmero distal?',
      'Que estruturas correm risco na fratura supracondilar?',
    ],
  },
  {
    termos: ['Fossa Coronoide'],
    classe: 'acidente-osseo',
    resumo: 'Depressão na face anterior do úmero distal, acima da tróclea, que recebe o processo coronoide na flexão.',
    localizacao: 'Face anterior da extremidade distal do úmero, medialmente, acima da tróclea.',
    funcao: 'Acomoda o processo coronoide da ulna quando o cotovelo se flexiona totalmente, permitindo que o antebraço encoste no braço.',
    relacoes: 'Lateralmente a ela está a fossa radial; atrás, separada por lâmina fina, a fossa do olécrano.',
    clinica:
      'Sua obliteração por ossificação heterotópica ou por calo ósseo é uma causa mecânica de rigidez em flexão do cotovelo após trauma — o osso simplesmente não tem mais para onde ir. A liberação artroscópica dessas fossas é procedimento estabelecido na rigidez pós-traumática.',
    memoria:
      'Na flexão, o coronoide precisa de um lugar para se esconder. Entupiu o esconderijo, o cotovelo não fecha.',
    pontos: [
      'Que estrutura a fossa coronoide recebe?',
      'Em que movimento ela é ocupada?',
      'Como sua obliteração causa rigidez?',
    ],
  },
  {
    termos: ['Fossa Radial'],
    classe: 'acidente-osseo',
    resumo: 'Depressão rasa acima do capítulo do úmero, que recebe a borda da cabeça do rádio na flexão.',
    localizacao: 'Face anterior do úmero distal, lateralmente à fossa coronoide, acima do capítulo.',
    funcao: 'Acomoda a margem da cabeça do rádio na flexão máxima do cotovelo.',
    relacoes: 'Está imediatamente acima do capítulo, superfície articular esférica que recebe a fóvea do rádio.',
    clinica:
      'É uma das áreas afetadas na osteocondrite dissecante do capítulo, lesão típica de ginastas e de arremessadores adolescentes, que produz dor lateral do cotovelo, bloqueios e derrame. A anatomia explica a localização: o capítulo recebe carga compressiva no valgo repetitivo.',
    memoria: 'Três fossas no úmero distal: duas na frente (coronoide e radial) e uma atrás (olécrano). Cada uma guarda uma peça.',
    pontos: [
      'Que estrutura a fossa radial acomoda?',
      'Com que superfície articular ela se relaciona?',
      'Que lesão típica de adolescente atinge o capítulo?',
    ],
  },
  {
    termos: ['Articulação do Cotovelo'],
    classe: 'articulacao',
    resumo: 'Articulação sinovial composta que reúne três articulações numa só cápsula: umeroulnar, umerorradial e radioulnar proximal.',
    localizacao:
      'Entre a extremidade distal do úmero (tróclea e capítulo) e as extremidades proximais da ulna (incisura troclear) e do rádio (fóvea da cabeça).',
    funcao:
      'Combina duas funções em uma cavidade: flexão e extensão, na umeroulnar em dobradiça, e pronossupinação, na radioulnar proximal em pivô. A tróclea é assimétrica, o que produz o ângulo de carregamento (cúbito valgo) de cerca de 11° no homem e 13° na mulher.',
    vascularizacao: 'Rede anastomótica periarticular formada pelas colaterais ulnares, pela radial colateral e pelas recorrentes do antebraço — garante fluxo mesmo com a braquial ocluída na flexão.',
    inervacao: 'Nervos musculocutâneo, mediano, ulnar e radial — todos contribuem, o que faz da dor do cotovelo uma dor mal localizada.',
    relacoes:
      'À frente, a fossa cubital com o tendão do bíceps, a artéria braquial e o nervo mediano, de lateral para medial; atrás, o olécrano e o nervo ulnar no seu sulco.',
    clinica:
      'Os três pontos ósseos — epicôndilo medial, epicôndilo lateral e olécrano — formam um triângulo equilátero na flexão e uma linha reta na extensão: se essa relação está alterada, há luxação; se está preservada com dor, pensa-se em fratura supracondilar. É o teste de exame físico mais rentável do cotovelo. A pronação dolorosa da criança pequena é a subluxação da cabeça do rádio sob o ligamento anular, e se reduz em segundos.',
    memoria:
      'Triângulo de Hueter: dois epicôndilos e o olécrano. Triângulo desfeito = luxação; triângulo intacto = fratura.',
    pontos: [
      'Que três articulações compõem o cotovelo?',
      'O que é o triângulo de Hueter e para que serve?',
      'O que é a pronação dolorosa e como ocorre?',
    ],
  },
  {
    termos: ['Ligamento Colateral Ulnar'],
    classe: 'ligamento',
    resumo: 'Complexo triangular na face medial do cotovelo, principal freio contra o estresse em valgo.',
    localizacao:
      'Do epicôndilo medial do úmero ao processo coronoide e ao olécrano da ulna, em três bandas: anterior, posterior e transversa (de Cooper).',
    funcao:
      'A banda anterior é a mais importante: é o estabilizador primário contra o valgo entre 20° e 120° de flexão — justamente o arco usado no arremesso.',
    relacoes: 'O nervo ulnar corre imediatamente atrás dele, no túnel cubital, e é rotineiramente exposto na sua reconstrução.',
    clinica:
      'A lesão da banda anterior é a lesão do arremessador: dor medial na fase de aceleração, com instabilidade em valgo. Sua reconstrução — a cirurgia de Tommy John, com enxerto de tendão palmar longo ou grácil em túneis ósseos — é uma das cirurgias esportivas mais realizadas do mundo. Na criança, o mesmo estresse arranca o epicôndilo medial em vez de romper o ligamento.',
    memoria:
      'Valgo no arremesso rompe o colateral ulnar no adulto e arranca o epicôndilo medial na criança. Mesmo gesto, esqueletos diferentes.',
    pontos: [
      'Qual banda do ligamento colateral ulnar é a mais importante?',
      'Que estresse ela resiste e em que arco de movimento?',
      'O que é a cirurgia de Tommy John?',
    ],
  },
  {
    termos: ['Ligamento Colateral Radial'],
    classe: 'ligamento',
    resumo: 'Complexo lateral do cotovelo, que estabiliza contra o varo e contra a instabilidade rotatória posterolateral.',
    localizacao:
      'Do epicôndilo lateral ao ligamento anular e à crista do supinador da ulna. Compõe-se do colateral radial propriamente dito e do colateral ulnar lateral, sua banda mais posterior.',
    funcao:
      'O colateral ulnar lateral é o estabilizador-chave: ele impede que o rádio e a ulna rodem juntos para fora sob o úmero. Sem ele, o cotovelo pode subluxar mesmo com todo o resto íntegro.',
    relacoes: 'Está profundamente ao tendão comum dos extensores, que se origina do mesmo epicôndilo lateral.',
    clinica:
      'Sua insuficiência causa a instabilidade rotatória posterolateral, diagnosticada pelo teste do pivot-shift lateral e classicamente iatrogênica — produzida por liberações agressivas na cirurgia da epicondilite lateral. É a razão pela qual, ao tratar cotovelo de tenista, não se desce além do equador do capítulo.',
    memoria:
      'Do lado de fora, quem segura não é o colateral radial "clássico": é a banda ulnar lateral, atrás. Cortou ela sem querer, o cotovelo desengata.',
    pontos: [
      'Que banda é o principal estabilizador lateral do cotovelo?',
      'O que é instabilidade rotatória posterolateral?',
      'Por que ela pode ser iatrogênica?',
    ],
  },
  /* ─────────────────── Músculos do braço ─────────────────── */
  {
    termos: ['Cabeça Longa do Músculo Bíceps Braquial'],
    classe: 'musculo',
    resumo: 'Cabeça lateral do bíceps, que nasce dentro do ombro, no tubérculo supraglenoidal.',
    localizacao:
      'Origina-se no tubérculo supraglenoidal e no lábio superior, atravessa a articulação glenoumeral, sai pelo sulco intertubercular e desce lateralmente no braço até se unir à cabeça curta.',
    funcao:
      'Além de fletir o cotovelo e supinar o antebraço com a cabeça curta, o segmento intra-articular ajuda a deprimir a cabeça do úmero durante a elevação, funcionando como estabilizador acessório do ombro.',
    vascularizacao: 'Artéria braquial e ramos da circunflexa umeral anterior no segmento proximal.',
    inervacao: 'Nervo musculocutâneo (C5–C6).',
    relacoes: 'Corre dentro do sulco intertubercular, contido pelo ligamento umeral transverso e pela polia do bíceps.',
    clinica:
      'Sua rotura proximal produz o sinal de Popeye — o ventre muscular desce e forma uma bola no braço —, e é surpreendentemente bem tolerada, com perda de apenas 10 a 20% da força de supinação, porque a cabeça curta permanece. Por isso muitos casos são tratados sem cirurgia, ao contrário da rotura distal.',
    memoria:
      'Popeye no braço = rompeu a cabeça longa lá em cima, e o músculo desabou. Rotura proximal quase não faz falta; a distal, sim.',
    pontos: [
      'Onde nasce a cabeça longa do bíceps e qual seu trajeto?',
      'Que papel ela exerce no ombro?',
      'O que é o sinal de Popeye e o que ele indica?',
    ],
  },
  {
    termos: ['Cabeça Curta do Músculo Bíceps Braquial', 'Cabeça Curta do Músculo Bíceps Braquial Rebatido'],
    classe: 'musculo',
    resumo: 'Cabeça medial do bíceps, que nasce do processo coracoide junto com o coracobraquial.',
    localizacao: 'Ápice do processo coracoide, em tendão conjunto com o coracobraquial, descendo medialmente no braço.',
    funcao: 'Flexiona o cotovelo, supina o antebraço e auxilia a flexão do ombro. Sua origem no coracoide faz dela um flexor também da articulação glenoumeral.',
    vascularizacao: 'Ramos musculares da artéria braquial.',
    inervacao: 'Nervo musculocutâneo (C5–C6), que perfura o coracobraquial logo abaixo do tendão conjunto.',
    relacoes:
      'O tendão conjunto é o "ligamento protetor" da axila: as estruturas neurovasculares importantes ficam mediais a ele, e por isso a dissecção lateral ao tendão é segura.',
    clinica:
      'Essa regra orienta o acesso deltopeitoral: manter-se lateral ao tendão conjunto protege o plexo braquial e os vasos axilares. A transferência do coracoide com o tendão conjunto para a glenoide anterior é a cirurgia de Latarjet, cujo efeito estabilizador vem em boa parte do "efeito rede" desse tendão sobre o subescapular.',
    memoria:
      'O tendão conjunto é a fronteira: tudo o que é perigoso está do lado de dentro dele. Fique por fora e você está seguro.',
    pontos: [
      'Onde nasce a cabeça curta do bíceps?',
      'Por que o tendão conjunto é chamado de ligamento protetor da axila?',
      'Que cirurgia transfere o coracoide para a glenoide?',
    ],
  },
  {
    termos: ['Aponeurose Bicipital', 'Aponeurose do Músculo Bíceps Braquial'],
    classe: 'fascia',
    resumo: 'Lâmina fibrosa que se destaca do tendão do bíceps e se espalha sobre a fáscia do antebraço medial.',
    localizacao: 'Na fossa cubital, cruzando obliquamente de lateral para medial, sobre a artéria braquial e o nervo mediano.',
    funcao:
      'Distribui parte da força do bíceps para a fáscia antebraquial e para a ulna, protegendo o tendão de sobrecarga. Ao mesmo tempo, forma um teto sobre o feixe vasculonervoso da fossa cubital.',
    relacoes: 'Sob ela passam a artéria braquial e o nervo mediano; a veia mediana cubital corre por cima dela.',
    clinica:
      'É a estrutura que separa a veia da artéria na punção venosa da fossa cubital — a razão anatômica de a punção ali ser segura. Já a sua rigidez pode comprimir o nervo mediano e o feixe em edemas e hematomas. Na rotura distal do bíceps, uma aponeurose íntegra impede a retração do músculo e mascara o diagnóstico.',
    memoria:
      'Uma "capa" fibrosa entre a veia por cima e a artéria por baixo. Ela é o motivo de a coleta de sangue no cotovelo não furar artéria.',
    pontos: [
      'Que estruturas a aponeurose bicipital separa?',
      'Por que ela torna segura a punção venosa cubital?',
      'Como ela pode mascarar uma rotura distal do bíceps?',
    ],
  },
  {
    termos: ['Músculo Coracobraquial'],
    classe: 'musculo',
    resumo: 'Músculo delgado do compartimento anterior do braço, perfurado pelo nervo musculocutâneo.',
    localizacao: 'Do ápice do processo coracoide, em tendão conjunto com a cabeça curta do bíceps, até o terço médio da face medial do úmero.',
    funcao: 'Flete e aduz o braço na articulação do ombro. É um músculo de estabilização mais que de força.',
    vascularizacao: 'Artéria braquial e circunflexa umeral anterior.',
    inervacao: 'Nervo musculocutâneo (C5–C7), que o perfura — característica única e o modo mais fácil de identificar o nervo numa dissecção.',
    relacoes: 'A artéria axilar e o nervo mediano correm medialmente a ele; é o marco que define o limite proximal seguro do braço medial.',
    clinica:
      'A referência prática é a ponta do coracoide: bloqueios do plexo por via infraclavicular a usam como reparo. A perfuração pelo musculocutâneo é a razão de a lesão isolada desse nervo produzir fraqueza da flexão do cotovelo com sensibilidade alterada na face lateral do antebraço (nervo cutâneo lateral do antebraço, seu ramo terminal).',
    memoria:
      'É o único músculo do corpo perfurado por um nervo importante. Achou o furo, achou o musculocutâneo.',
    pontos: [
      'Que nervo perfura o coracobraquial?',
      'Qual a ação do músculo?',
      'Que déficit a lesão do musculocutâneo produz?',
    ],
  },
  {
    termos: ['Músculo Braquial'],
    classe: 'musculo',
    resumo: 'Flexor puro do cotovelo, situado profundamente ao bíceps, que se insere na tuberosidade da ulna.',
    localizacao: 'Da metade distal da face anterior do úmero e dos septos intermusculares até a tuberosidade e o processo coronoide da ulna.',
    funcao:
      'É o "cavalo de carga" da flexão do cotovelo: como se insere na ulna, que não roda, ele flete em qualquer posição de pronação ou supinação, enquanto o bíceps perde eficiência com o antebraço pronado.',
    vascularizacao: 'Artéria braquial, recorrente radial e braquial profunda.',
    inervacao: 'Nervo musculocutâneo (C5–C6) na maior parte, com uma pequena porção lateral inervada pelo nervo radial — uma dupla inervação clássica de prova.',
    relacoes: 'O nervo radial desce entre ele e o braquiorradial; a artéria braquial e o mediano cruzam sua face anterior.',
    clinica:
      'Sua íntima relação com o úmero distal faz do braquial a fonte mais comum de ossificação heterotópica após luxação do cotovelo — hematoma dentro do músculo que se calcifica e limita a flexão. É também por essa aderência que a mobilização passiva forçada do cotovelo traumatizado é contraindicada.',
    memoria:
      'Teste o bíceps com o antebraço pronado e você isola o braquial: quem continua fletindo é ele. Ele flete sempre, o bíceps só quando pode supinar.',
    pontos: [
      'Por que o braquial flete o cotovelo em qualquer posição?',
      'Qual sua dupla inervação?',
      'Por que ele é sede de ossificação heterotópica?',
    ],
  },
  {
    termos: ['Cabeça Longa do Músculo Tríceps Braquial'],
    classe: 'musculo',
    resumo: 'Única cabeça do tríceps que cruza o ombro, nascendo do tubérculo infraglenoidal da escápula.',
    localizacao: 'Do tubérculo infraglenoidal, descendo entre o redondo maior e o redondo menor, até o tendão comum no olécrano.',
    funcao: 'Estende o cotovelo e, por cruzar o ombro, também estende e aduz o braço — e ajuda a estabilizar a cabeça umeral na adução.',
    vascularizacao: 'Artéria braquial profunda e circunflexa umeral posterior.',
    inervacao: 'Nervo radial (C6–C8).',
    relacoes: 'Ao passar entre os dois redondos, divide o intervalo em espaço quadrangular (lateral, com nervo axilar e circunflexa umeral posterior) e espaço triangular (medial, com a artéria circunflexa da escápula).',
    clinica:
      'Essa divisão é a chave para localizar lesões da região posterior do ombro: um cisto ou uma fibrose no espaço quadrangular comprime o nervo axilar e produz dor posterior e atrofia do redondo menor, quadro conhecido como síndrome do espaço quadrangular, típico de arremessadores.',
    memoria:
      'A cabeça longa é a "coluna" que separa os dois buracos da axila posterior. Lateral a ela: nervo axilar. Medial: artéria circunflexa da escápula.',
    pontos: [
      'Por que a cabeça longa também age sobre o ombro?',
      'Que espaços ela delimita e o que passa em cada um?',
      'O que é a síndrome do espaço quadrangular?',
    ],
  },
  {
    termos: ['Cabeça Lateral do Músculo Tríceps Braquial'],
    classe: 'musculo',
    resumo: 'Cabeça superficial e lateral do tríceps, que nasce acima do sulco radial.',
    localizacao: 'Face posterior do úmero, acima e lateralmente ao sulco do nervo radial, até o tendão comum.',
    funcao: 'Extensão do cotovelo. É a porção mais forte e mais rápida, recrutada nos movimentos de extensão contra resistência.',
    vascularizacao: 'Artéria braquial profunda.',
    inervacao: 'Nervo radial (C6–C8).',
    relacoes: 'Sua borda inferior forma o limite superior do intervalo por onde o nervo radial e a braquial profunda entram no sulco radial.',
    clinica:
      'É a referência da abordagem posterior do úmero: a dissecção entre as cabeças lateral e longa permite chegar ao osso identificando o nervo radial no seu sulco. Sem esse referencial, a fixação de fraturas de diáfise por via posterior seria cega.',
    memoria: 'Lateral e longa nascem acima do sulco; a medial nasce abaixo. O sulco é a linha divisória do tríceps.',
    pontos: [
      'Onde nasce a cabeça lateral em relação ao sulco radial?',
      'Qual sua função predominante?',
      'Como isso orienta a abordagem posterior do úmero?',
    ],
  },
  {
    termos: ['Cabeça Medial do Músculo Tríceps Braquial'],
    classe: 'musculo',
    resumo: 'Cabeça profunda do tríceps, que nasce abaixo do sulco radial e cobre toda a face posterior distal do úmero.',
    localizacao: 'Face posterior do úmero, abaixo e medialmente ao sulco radial, estendendo-se até o olécrano; fica coberta pelas outras duas.',
    funcao:
      'Extensão do cotovelo, sobretudo nos movimentos finos e de baixa carga — é a porção ativa em quase toda extensão, com as outras duas sendo recrutadas conforme a força necessária. Algumas de suas fibras se inserem na cápsula posterior e a tracionam, evitando que ela seja pinçada.',
    vascularizacao: 'Artéria braquial profunda e colateral ulnar superior.',
    inervacao: 'Nervo radial (C7–C8), incluindo o nervo do ancôneo, que a atravessa.',
    relacoes: 'O nervo ulnar corre sobre sua face medial, no compartimento posterior distal do braço.',
    clinica:
      'Como cobre o úmero distal, é o músculo elevado nas abordagens posteriores poupadoras de tríceps para fraturas do úmero distal. A relação com o nervo ulnar exige identificá-lo e protegê-lo em qualquer via medial do cotovelo.',
    memoria:
      'É a cabeça "que trabalha sempre": as outras duas entram quando o esforço aumenta. Trabalhadora e escondida.',
    pontos: [
      'Onde nasce a cabeça medial em relação ao sulco radial?',
      'Que papel ela exerce sobre a cápsula posterior?',
      'Que nervo corre sobre sua face medial?',
    ],
  },
]
