import type { EntradaDicionario } from './tipos'

/**
 * Mandíbula.
 *
 * O único osso móvel do crânio, e o único que carrega um nervo dentro de si de
 * ponta a ponta. Quase toda a clínica da mandíbula sai de dois fatos: ela é um
 * arco (então quebra em dois lugares) e o nervo alveolar inferior mora no seu
 * interior (então quase toda fratura e quase toda cirurgia mexem com ele).
 */
export const MANDIBULA: EntradaDicionario[] = [
  {
    termos: ['Mandíbula'],
    classe: 'osso',
    resumo: 'Único osso móvel do crânio, em forma de ferradura, que carrega os dentes inferiores e articula-se com o temporal.',
    localizacao:
      'Ocupa o terço inferior da face. Um corpo horizontal em ferradura, dois ramos verticais que sobem nos ângulos, e no alto de cada ramo dois processos: o coronoide, à frente, para o músculo temporal, e o condilar, atrás, para a articulação temporomandibular.',
    funcao:
      'É a alavanca da mastigação: recebe a força dos músculos elevadores (masseter, temporal e pterigóideo medial) e a converte em pressão sobre os dentes. Sustenta ainda o assoalho da boca, a língua e o osso hioide pela musculatura supra-hióidea.',
    vascularizacao:
      'Artéria alveolar inferior, ramo da maxilar, que entra pelo forame da mandíbula, percorre o canal mandibular e sai pelo forame mentual. O periósteo recebe ramos faciais e linguais.',
    inervacao:
      'Nervo alveolar inferior (V3) para os dentes e para a mandíbula, terminando como nervo mentual para o lábio inferior e o mento. A pele sobre o ângulo é do nervo auricular magno (C2–C3) — e não do trigêmeo.',
    relacoes:
      'A artéria facial cruza a margem inferior à frente do masseter, onde se palpa o pulso; o ramo marginal da mandíbula (VII) corre logo acima dessa margem; medialmente, a glândula submandibular ocupa a fóvea correspondente.',
    clinica:
      'Como é um arco, raramente quebra em um só ponto: fratura no corpo de um lado costuma vir acompanhada de fratura do côndilo contralateral, e por isso toda fratura de mandíbula obriga a procurar a segunda. A luxação é anterior, com a boca travada aberta, e se reduz empurrando a mandíbula para baixo e para trás. Na cirurgia submandibular, a incisão fica dois dedos abaixo da margem para poupar o ramo marginal — lesá-lo produz assimetria do sorriso.',
    memoria:
      'Ferradura com dois braços. Quebrou a ferradura de um lado, procure onde ela quebrou do outro. E lembre: o nervo entra por dentro do ramo e sai no queixo.',
    pontos: [
      'Por que toda fratura de mandíbula exige procurar uma segunda fratura?',
      'Qual o trajeto do nervo alveolar inferior dentro do osso?',
      'Que nervo corre acima da margem inferior e o que sua lesão causa?',
    ],
  },
  {
    termos: ['Corpo da Mandíbula'],
    classe: 'acidente-osseo',
    resumo: 'Porção horizontal em ferradura que carrega o arco alveolar e os dentes inferiores.',
    localizacao: 'Da sínfise mentual, na linha média, até o ângulo de cada lado, onde se continua com o ramo.',
    funcao:
      'Suporta os dentes na sua borda superior (arco alveolar) e resiste à flexão na inferior (base da mandíbula), que é osso compacto e espesso. É essa diferença entre borda superior frágil e borda inferior forte que decide para onde a fratura se desloca.',
    relacoes:
      'Sua face medial tem a linha milo-hióidea, que separa a fóvea sublingual (acima) da submandibular (abaixo); a face lateral tem a linha oblíqua e o forame mentual.',
    clinica:
      'A região do canino e a do terceiro molar são pontos de fraqueza — raiz longa em um, dente incluso no outro. O deslocamento da fratura é ditado pelos músculos: os supra-hióideos puxam o fragmento anterior para baixo e para trás, os elevadores puxam o posterior para cima. Reconhecer isso é o que explica a mordida aberta anterior no paciente fraturado.',
    memoria:
      'Borda de cima carrega dentes e é fraca; borda de baixo é a viga e é forte. A fratura corre da fraca para a forte.',
    pontos: [
      'Que estruturas marcam a face medial do corpo da mandíbula?',
      'Como os músculos deslocam os fragmentos numa fratura de corpo?',
      'Por que canino e terceiro molar são zonas de fraqueza?',
    ],
  },
  {
    termos: ['Ramo da Mandíbula'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina quadrilátera vertical que sobe do ângulo até os processos coronoide e condilar.',
    localizacao: 'Atrás do corpo, com face lateral voltada para o masseter e face medial para o pterigóideo medial e o espaço pterigomandibular.',
    funcao:
      'É a placa de inserção dos dois maiores elevadores da mandíbula, que a abraçam em sanduíche: masseter por fora, pterigóideo medial por dentro. Essa alça muscular é o que dá potência à mordida.',
    relacoes:
      'Na face medial abre-se o forame da mandíbula, guardado pela língula, por onde entram o nervo e os vasos alveolares inferiores. Atrás dele está a glândula parótida.',
    clinica:
      'A alça masseter–pterigóideo medial mantém os fragmentos de uma fratura de ramo relativamente estáveis — por isso muitas se tratam sem placa. Já o trismo intenso em infecções odontogênicas vem do espasmo desses mesmos músculos. A anestesia do bloqueio mandibular é depositada exatamente na face medial do ramo, acima da língula.',
    memoria:
      'Duas fatias de músculo com o osso no meio: masseter por fora, pterigóideo medial por dentro. É um sanduíche, e o sanduíche segura o osso no lugar.',
    pontos: [
      'Que músculos se inserem nas duas faces do ramo?',
      'Onde se localiza o forame da mandíbula e o que entra por ele?',
      'Por que fraturas do ramo tendem a ser pouco desviadas?',
    ],
  },
  {
    termos: ['Ângulo da Mandíbula'],
    classe: 'acidente-osseo',
    resumo: 'Junção entre o corpo e o ramo, ponto de inserção do masseter e do pterigóideo medial.',
    localizacao: 'Na esquina posteroinferior da mandíbula, palpável logo abaixo e à frente do lobo da orelha.',
    funcao:
      'É onde as fibras do masseter e do pterigóideo medial se encontram no osso, formando a alça pterigomassetérica. O valor do ângulo (goníaco) muda com a idade: aberto no bebê e no desdentado, mais fechado no adulto dentado.',
    relacoes: 'A artéria e a veia faciais cruzam a margem inferior imediatamente à frente dele; a parótida o recobre por trás.',
    clinica:
      'É a fratura mandibular mais comum em agressão, favorecida pelo terceiro molar incluso, que funciona como linha de perfuração. Nos casos infecciosos, o abscesso do espaço submassetérico se instala aqui, com trismo e edema que não flutuam à palpação — porque estão sob um músculo espesso.',
    memoria:
      'A "quina" da mandíbula. Ângulo aberto no bebê e no idoso sem dentes; fechado no adulto com dentes. O osso segue a função.',
    pontos: [
      'Que músculos se inserem no ângulo da mandíbula?',
      'Por que o terceiro molar incluso favorece a fratura de ângulo?',
      'Como o ângulo goníaco muda ao longo da vida?',
    ],
  },
  {
    termos: ['Processo Condilar'],
    classe: 'acidente-osseo',
    resumo: 'Processo posterior do ramo, com colo estreito e cabeça articular que forma a ATM.',
    localizacao: 'Sobe da borda posterossuperior do ramo, separado do processo coronoide pela incisura mandibular. Cabeça alongada transversalmente sobre um colo fino.',
    funcao:
      'Sua cabeça articula-se com a fossa mandibular e realiza os dois movimentos da ATM: rotação nos primeiros 20–25 mm de abertura e translação para o tubérculo articular depois disso. O pterigóideo lateral se insere na fóvea do colo e é quem puxa o côndilo para a frente.',
    relacoes: 'É coberto pelo disco articular; a artéria maxilar passa medialmente ao colo.',
    clinica:
      'O colo é o ponto mais fraco da mandíbula: funciona como fusível, e a fratura de côndilo é a mais frequente do osso — geralmente indireta, por trauma no mento. Na criança, a lesão da cartilagem condilar, que é centro de crescimento, produz assimetria facial e anquilose anos depois; por isso trauma de mento em criança nunca é banal.',
    memoria:
      'Bateu no queixo, quebrou o côndilo. O colo fino é o fusível que protege a base do crânio — e na criança é também o centro de crescimento.',
    pontos: [
      'Que músculo se insere no colo do côndilo?',
      'Por que a fratura de côndilo costuma ser indireta?',
      'Qual a consequência tardia do trauma condilar na criança?',
    ],
  },
  {
    termos: ['Incisura Mandibular'],
    classe: 'acidente-osseo',
    resumo: 'Entalhe entre os processos coronoide e condilar, atravessado pelos vasos e nervos massetéricos.',
    localizacao: 'Borda superior do ramo da mandíbula, entre os dois processos.',
    funcao: 'Deixa passar o nervo massetérico e os vasos massetéricos, que vêm da fossa infratemporal para o masseter.',
    relacoes: 'Fica logo abaixo do arco zigomático, coberta pelo masseter.',
    clinica:
      'É a porta de entrada da via de acesso à fossa infratemporal por punção (bloqueio do nervo mandibular pela via lateral, com a agulha passando pela incisura). O nervo massetérico que a atravessa é hoje o doador preferido para reanimação do sorriso na paralisia facial de longa data.',
    memoria: 'A "sela" entre os dois processos do ramo. Por essa sela passa o nervo que faz o masseter morder.',
    pontos: [
      'O que atravessa a incisura mandibular?',
      'Que dois processos ela separa?',
      'Que uso cirúrgico moderno tem o nervo massetérico?',
    ],
  },
  {
    termos: ['Tuberosidade Massetérica'],
    classe: 'acidente-osseo',
    resumo: 'Rugosidade na face lateral do ângulo, onde o masseter se fixa.',
    localizacao: 'Face externa do ângulo e da parte inferior do ramo da mandíbula.',
    funcao:
      'Recebe a inserção do masseter, o músculo mais potente do corpo por área de secção. A rugosidade é a assinatura da tração: onde músculo puxa forte, o osso responde com relevo.',
    relacoes: 'O masseter é recoberto pela fáscia parotídea e cruzado pelo ducto parotídeo e pelos ramos do facial.',
    clinica:
      'A hipertrofia massetérica — por bruxismo — alarga o terço inferior da face e é tratada com toxina botulínica aplicada justamente nessa área. É também onde se palpa a contração do masseter para testar o V3 motor no exame dos nervos cranianos.',
    memoria:
      'Rugosidade = pegada de músculo forte. Peça ao paciente para cerrar os dentes: o volume que salta sob seu dedo está preso aqui.',
    pontos: [
      'Que músculo se insere na tuberosidade massetérica?',
      'Como se testa clinicamente o masseter?',
      'O que causa hipertrofia massetérica?',
    ],
  },
  {
    termos: ['Linha Oblíqua'],
    classe: 'acidente-osseo',
    resumo: 'Crista que desce obliquamente da borda anterior do ramo para a face lateral do corpo.',
    localizacao: 'Continua para baixo e para a frente a borda anterior do ramo, terminando perto do forame mentual.',
    funcao: 'Dá inserção aos músculos abaixador do lábio inferior, abaixador do ângulo da boca e, mais atrás, ao platisma.',
    relacoes: 'O forame mentual abre-se abaixo dela, entre os ápices dos pré-molares.',
    clinica:
      'É referência de osteotomia: a linha oblíqua externa marca o plano de corte da osteotomia sagital do ramo, a cirurgia ortognática mais usada para avanço mandibular. Também guia a remoção de terceiros molares inclusos, cujo osso de recobrimento se apoia nela.',
    memoria: 'Uma "rampa" que desce do ramo para o queixo. É a régua do cirurgião nessa região.',
    pontos: [
      'Que músculos se inserem na linha oblíqua?',
      'Que relação ela guarda com o forame mentual?',
      'Que procedimento cirúrgico a usa como referência?',
    ],
  },
  {
    termos: ['Mento'],
    classe: 'acidente-osseo',
    resumo: 'O queixo: protuberância mentual triangular na linha média anterior da mandíbula.',
    localizacao: 'Face anterior do corpo, na linha média, formado pela protuberância mentual e por dois tubérculos mentuais laterais.',
    funcao:
      'Dá inserção aos músculos mentual e abaixador do lábio inferior. É estrutura exclusivamente humana entre os primatas atuais — e por isso um marcador antropológico de primeira ordem.',
    relacoes: 'Corresponde à sínfise mentual, linha de fusão das duas metades da mandíbula, que se completa no primeiro ano de vida.',
    clinica:
      'Trauma direto no mento é o mecanismo clássico de fratura indireta do côndilo, e por isso a laceração do queixo obriga a examinar a ATM e a oclusão. Em cirurgia, o mento é a fonte preferida de enxerto ósseo intraoral pequeno, e o alvo da mentoplastia.',
    memoria:
      'O queixo é o para-choque da mandíbula: o impacto entra aqui e a fratura sai lá atrás, no côndilo.',
    pontos: [
      'Por que trauma no mento pode fraturar o côndilo?',
      'O que é a sínfise mentual e quando ela se funde?',
      'Que músculos se inserem no mento?',
    ],
  },
  {
    termos: ['Trígono Retromolar'],
    classe: 'acidente-osseo',
    resumo: 'Área triangular de osso atrás do último molar inferior, entre as cristas temporal e oblíqua.',
    localizacao: 'Imediatamente distal ao terceiro molar inferior, na transição entre o corpo e a borda anterior do ramo.',
    funcao: 'É a zona onde o corpo se transforma em ramo; recebe fibras do músculo bucinador e do temporal por meio da rafe pterigomandibular.',
    relacoes: 'A mucosa que o recobre é fina e móvel; medialmente está o espaço pterigomandibular, alvo do bloqueio do alveolar inferior.',
    clinica:
      'É a referência palpável do bloqueio do nervo alveolar inferior: o dedo procura a crista temporal e a agulha entra medialmente a ela. É também sítio de carcinoma epidermoide de mau prognóstico, porque invade cedo o osso e o espaço pterigomandibular, e local onde a pericoronarite do siso se instala.',
    memoria: 'Triângulo atrás do último dente. É a porta do bloqueio anestésico e a porta que o tumor usa para entrar no ramo.',
    pontos: [
      'Onde exatamente fica o trígono retromolar?',
      'Que referência ele fornece para anestesia?',
      'Por que o carcinoma dessa área é de pior prognóstico?',
    ],
  },
  {
    termos: ['Forame da Mandíbula', 'Forame Mandibular'],
    classe: 'passagem-ossea',
    resumo: 'Entrada do canal mandibular, na face medial do ramo, protegida pela língula.',
    localizacao:
      'No meio da face medial do ramo, aproximadamente na altura do plano oclusal dos molares inferiores, com a língula — uma lingueta óssea — cobrindo sua borda anterior.',
    funcao: 'Deixa entrar o nervo e os vasos alveolares inferiores, que percorrem o canal mandibular até o forame mentual, inervando todos os dentes inferiores daquele lado.',
    relacoes: 'O nervo lingual corre à frente e medialmente, mais superficialmente; o ligamento esfenomandibular fixa-se na língula.',
    clinica:
      'É o alvo do bloqueio do nervo alveolar inferior, a anestesia mais realizada da odontologia. Dois acidentes explicam-se pela vizinhança: injetar posteriormente demais alcança a parótida e provoca paralisia facial transitória; injetar à frente anestesia só o lingual, e o paciente sente a língua dormente mas continua sentindo o dente.',
    memoria:
      'O nervo entra pelo buraco do meio do ramo, por dentro, e sai no queixo. A "lingueta" (língula) é a marca do endereço.',
    pontos: [
      'O que entra pelo forame da mandíbula e por onde sai?',
      'O que é a língula e qual sua importância?',
      'Por que o bloqueio mal posicionado pode paralisar a face?',
    ],
  },
  {
    termos: ['Linha Milo-Hióidea', 'Linha Milo-hioidea'],
    classe: 'acidente-osseo',
    resumo: 'Crista oblíqua na face medial do corpo, origem do músculo milo-hióideo e divisor do assoalho da boca.',
    localizacao: 'Face interna do corpo da mandíbula, correndo do terceiro molar para baixo e para a frente, até a sínfise.',
    funcao:
      'Dá origem ao milo-hióideo, o músculo que forma o diafragma do assoalho da boca e eleva o assoalho na primeira fase da deglutição. A linha é também a fronteira anatômica entre dois compartimentos.',
    relacoes:
      'Acima e à frente dela fica a fóvea sublingual, com a glândula sublingual; abaixo e atrás, a fóvea submandibular, com a glândula submandibular. A glândula submandibular contorna a borda posterior livre do músculo, ficando com uma parte acima e outra abaixo.',
    clinica:
      'Essa fronteira decide o rumo das infecções do assoalho da boca: raízes dos molares terminam abaixo da linha milo-hióidea e drenam para o espaço submandibular; raízes dos pré-molares terminam acima e drenam para o sublingual. A angina de Ludwig é justamente a celulite que toma os dois espaços dos dois lados e empurra a língua para cima — emergência de via aérea.',
    memoria:
      'Uma linha diagonal por dentro da mandíbula divide o assoalho em "andar de cima" (sublingual) e "andar de baixo" (submandibular). O molar drena para baixo; o pré-molar, para cima.',
    pontos: [
      'Que músculo nasce da linha milo-hióidea?',
      'Que dois espaços ela separa?',
      'Por que essa divisão define o trajeto das infecções odontogênicas?',
    ],
  },
  {
    termos: ['Sulco Milo-Hióideo'],
    classe: 'acidente-osseo',
    resumo: 'Goteira na face medial do ramo por onde descem o nervo e os vasos milo-hióideos.',
    localizacao: 'Corre para baixo e para a frente a partir da borda inferior do forame da mandíbula.',
    funcao: 'Aloja o nervo milo-hióideo, ramo do alveolar inferior emitido pouco antes de ele entrar no canal, que inerva o milo-hióideo e o ventre anterior do digástrico.',
    relacoes: 'Está imediatamente abaixo da língula; a artéria milo-hióidea acompanha o nervo.',
    clinica:
      'Explica uma falha anestésica comum: o nervo milo-hióideo sai antes do forame e às vezes leva fibras sensitivas acessórias para os molares inferiores, de modo que um bloqueio tecnicamente correto pode deixar o dente parcialmente sensível. Nesses casos, complementa-se com anestesia intraligamentar.',
    memoria:
      'Um ramo que "escapa antes da porta". Nervo que sai antes do forame é nervo que o bloqueio não pega.',
    pontos: [
      'Que nervo percorre o sulco milo-hióideo e o que ele inerva?',
      'Em que ponto ele se separa do alveolar inferior?',
      'Como isso explica falhas do bloqueio mandibular?',
    ],
  },
  {
    termos: ['Fóvea Submandibular', 'Fossa Submandibular'],
    classe: 'acidente-osseo',
    resumo: 'Depressão na face medial do corpo, abaixo da linha milo-hióidea, que aloja a glândula submandibular.',
    localizacao: 'Face interna do corpo da mandíbula, na região dos molares, abaixo e atrás da linha milo-hióidea.',
    funcao: 'Acomoda a parte superficial da glândula submandibular, que produz a maior parte da saliva em repouso — cerca de 70% do volume não estimulado.',
    relacoes:
      'A glândula abraça a borda posterior do milo-hióideo; o ducto submandibular (de Wharton) segue daí para a frente, no assoalho da boca, cruzando por cima do nervo lingual.',
    clinica:
      'A submandibular é a glândula que mais forma cálculos, porque sua saliva é mais mucosa e o ducto sobe contra a gravidade. O quadro é clássico: dor e aumento da glândula às refeições, que cedem depois. Na exérese da glândula, os nervos em risco são o lingual, o hipoglosso e o ramo marginal do facial.',
    memoria:
      'A submandibular tem que empurrar saliva "para cima" pelo ducto. Encanamento que sobe entope: é a glândula dos cálculos.',
    pontos: [
      'Que glândula ocupa a fóvea submandibular?',
      'Por que ela é a que mais forma cálculos?',
      'Que nervos correm risco na sua exérese?',
    ],
  },
  {
    termos: ['Fóvea Sublingual'],
    classe: 'acidente-osseo',
    resumo: 'Depressão rasa na face medial do corpo, acima da linha milo-hióidea, para a glândula sublingual.',
    localizacao: 'Face interna do corpo da mandíbula, na região dos pré-molares e caninos, acima da linha milo-hióidea.',
    funcao: 'Aloja a glândula sublingual, a menor das três maiores, que produz saliva predominantemente mucosa e se abre por múltiplos ductos pequenos diretamente no assoalho da boca.',
    relacoes: 'A glândula levanta a prega sublingual da mucosa; o nervo lingual e o ducto submandibular correm medialmente a ela.',
    clinica:
      'É a origem da rânula: o extravasamento de muco da sublingual forma um cisto azulado no assoalho da boca. Quando ele mergulha por baixo do milo-hióideo e aparece no pescoço, chama-se rânula mergulhante — e a explicação é puramente anatômica, o muco encontrando a borda livre do músculo.',
    memoria:
      'Acima da linha milo-hióidea mora a sublingual; abaixo, a submandibular. A rânula é a sublingual "vazando" para cima da linha.',
    pontos: [
      'Que glândula ocupa a fóvea sublingual?',
      'Como a glândula sublingual drena sua saliva?',
      'O que é uma rânula mergulhante e por que ela ocorre?',
    ],
  },
  {
    termos: ['Espinha Geniana'],
    classe: 'acidente-osseo',
    resumo: 'Pequenas espículas na face interna da sínfise, onde nascem os músculos genioglosso e gênio-hióideo.',
    localizacao: 'Na linha média da face medial do corpo, atrás da sínfise mentual, geralmente em quatro tubérculos — dois superiores e dois inferiores.',
    funcao:
      'As espinhas superiores dão origem ao genioglosso e as inferiores ao gênio-hióideo. O genioglosso é o músculo que protrai a língua e, com isso, mantém a orofaringe aberta durante o sono.',
    relacoes: 'Abaixo delas está a fossa digástrica; à frente, a espessura da sínfise.',
    clinica:
      'É a base anatômica do avanço geniogloso, cirurgia para apneia obstrutiva do sono: traciona-se para a frente o bloco ósseo que contém as espinhas, e com ele a língua, ampliando o espaço aéreo retrolingual. É também por perda do tônus do genioglosso que a língua cai e obstrui a via aérea no paciente inconsciente — daí a manobra de elevação do mento.',
    memoria:
      '"Gênio" = queixo. Genioglosso liga queixo à língua; gênio-hióideo liga queixo ao hioide. Puxe o queixo e a língua vem junto — é isso que desobstrui a via aérea.',
    pontos: [
      'Que músculos nascem das espinhas genianas?',
      'Por que o genioglosso mantém a via aérea aberta?',
      'Qual a lógica anatômica da elevação do mento na reanimação?',
    ],
  },
  {
    termos: ['Fossa Digástrica'],
    classe: 'acidente-osseo',
    resumo: 'Depressão na borda inferior da sínfise onde se insere o ventre anterior do digástrico.',
    localizacao: 'Na face interna da margem inferior do corpo, dos dois lados da linha média, abaixo das espinhas genianas.',
    funcao:
      'Dá inserção ao ventre anterior do músculo digástrico, que abaixa a mandíbula quando o hioide está fixo e eleva o hioide quando a mandíbula está fixa — um músculo com duas funções conforme o ponto fixo.',
    relacoes: 'Delimita, com o ventre anterior contralateral e o hioide, o trígono submentual.',
    clinica:
      'O trígono submentual contém os linfonodos submentuais, primeira estação de drenagem do lábio inferior, do mento e da ponta da língua — por isso a palpação submentual é obrigatória diante de qualquer lesão dessas regiões. O digástrico é ainda a referência cirúrgica do nível I do pescoço.',
    memoria:
      '"Digástrico" = dois ventres. O ventre da frente nasce aqui; o de trás, no mastoide. Entre eles, um tendão que corre numa alça presa ao hioide.',
    pontos: [
      'Que músculo se insere na fossa digástrica?',
      'Que dupla função o digástrico exerce?',
      'Que região linfonodal ele delimita?',
    ],
  },
]
