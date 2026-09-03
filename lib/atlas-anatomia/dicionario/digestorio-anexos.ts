import type { EntradaDicionario } from './tipos'

/**
 * Fígado, vias biliares e pâncreas.
 *
 * Os órgãos anexos compartilham um mesmo ponto de encontro — a porta hepática e
 * a papila duodenal — e é dele que nasce quase toda a clínica: a icterícia, a
 * pancreatite, a colangite e a hipertensão portal são, todas, problemas de
 * trânsito num cruzamento muito estreito.
 */
export const DIGESTORIO_ANEXOS: EntradaDicionario[] = [
  /* ─────────────────── Fígado: lobos e ligamentos ─────────────────── */
  {
    termos: ['Lobo Hepático Direito', 'Lobo Direito'],
    classe: 'viscera',
    sistemas: ['digestorio'],
    resumo: 'Maior lobo anatômico do fígado, à direita do ligamento falciforme.',
    localizacao: 'Ocupa o hipocôndrio direito e parte do epigástrio, sob a cúpula diafragmática direita, da 5ª costela ao rebordo.',
    funcao:
      'A divisão anatômica pelo ligamento falciforme não corresponde à divisão funcional: a linha de Cantlie, que vai da fossa da vesícula à veia cava inferior, é a verdadeira fronteira entre os lobos funcionais direito e esquerdo, porque separa os territórios da veia porta direita e esquerda.',
    inervacao:
      'Plexo hepático, do celíaco, com simpático de T7 a T9 e parassimpático do vago. A cápsula de Glisson, porém, recebe também ramos do nervo frênico direito (C3–C5) — e é por isso que a distensão hepática aguda dói no ombro direito, e não no fígado.',
    vascularizacao: 'Ramo direito da artéria hepática própria e da veia porta; drena pelas veias hepáticas direita e média.',
    relacoes: 'Abaixo dele estão a flexura cólica direita, o rim e a glândula suprarrenal direitos e o duodeno.',
    clinica:
      'A distinção entre anatomia morfológica e funcional é a base de toda a cirurgia hepática moderna: uma hepatectomia direita segue a linha de Cantlie, e não o ligamento falciforme. E os oito segmentos de Couinaud, cada um com pedículo próprio, são o que permite ressecções segmentares poupadoras de parênquima.',
    memoria:
      'O ligamento falciforme engana: o fígado se divide de verdade pela linha da vesícula até a cava. Essa é a linha de Cantlie.',
    pontos: [
      'Qual a diferença entre divisão anatômica e funcional do fígado?',
      'O que é a linha de Cantlie?',
      'O que são os segmentos de Couinaud?',
    ],
  },
  {
    termos: ['Lobo Hepático Esquerdo', 'Lobo Esquerdo'],
    classe: 'viscera',
    sistemas: ['digestorio'],
    resumo: 'Lobo hepático à esquerda do ligamento falciforme, que se estende ao epigástrio.',
    localizacao: 'Cruza a linha média e alcança o hipocôndrio esquerdo, repousando sobre o estômago e o esôfago abdominal.',
    funcao: 'Compreende os segmentos II e III (setor lateral esquerdo) e o IV (setor medial esquerdo).',
    inervacao:
      'Plexo hepático (T7–T9 e vago), com contribuição do frênico esquerdo na cápsula. Vale a diferença embriológica: a irrigação do lobo esquerdo pela artéria gástrica esquerda, presente como variante em cerca de 15% das pessoas, é um resquício da origem comum com o estômago.',
    vascularizacao: 'Ramo esquerdo da artéria hepática e da veia porta; drena pelas veias hepáticas esquerda e média.',
    relacoes: 'Sua face inferior apresenta a impressão gástrica e a esofágica.',
    clinica:
      'Os segmentos II e III são os mais usados no transplante intervivos para receptores pediátricos, e o lobo direito, no transplante para adultos — decisões que dependem inteiramente do volume e da anatomia vascular de cada setor. A posição anterior e superficial do lobo esquerdo o torna também o mais lesado no trauma abdominal por compressão contra a coluna.',
    memoria:
      'Segmentos II e III para criança, lobo direito para adulto. O transplante intervivos é anatomia aplicada em estado puro.',
    pontos: [
      'Que segmentos compõem o lobo esquerdo?',
      'Que setores são usados no transplante intervivos?',
      'Por que o lobo esquerdo é vulnerável no trauma?',
    ],
  },
  {
    termos: ['Lobo Caudado'],
    classe: 'viscera',
    resumo: 'Segmento I do fígado, entre a veia cava inferior e a fissura do ligamento venoso, com drenagem própria.',
    localizacao: 'Face posterior do fígado, entre a veia cava inferior, à direita, e a fissura do ligamento venoso, à esquerda.',
    funcao:
      'É o único segmento que recebe sangue dos ramos portais direito e esquerdo e que drena diretamente para a veia cava inferior por veias próprias, sem passar pelas veias hepáticas principais.',
    vascularizacao:
      'Único no fígado inteiro: recebe ramos das artérias hepáticas direita E esquerda e de ambos os ramos da veia porta, e drena por veias hepáticas curtas diretamente para a veia cava inferior, sem passar pelas três veias hepáticas principais. Essa autonomia é o que faz o lobo caudado hipertrofiar na síndrome de Budd-Chiari, quando todo o resto do fígado congestiona.',
    inervacao:
      'Plexo hepático (T7–T9 e vago). É o segmento I de Couinaud, e sua ressecção isolada é tecnicamente das mais difíceis por estar encaixado entre a cava e a porta.',
    relacoes: 'Está imediatamente à frente da veia cava inferior e atrás do omento menor.',
    clinica:
      'Essa autonomia vascular é o que explica sua hipertrofia compensatória na síndrome de Budd-Chiari, em que as veias hepáticas principais se ocluem mas as veias caudadas permanecem pérvias — o caudado aumentado com o restante do fígado atrofiado é o achado de imagem mais característico da síndrome. Sua ressecção é uma das mais difíceis da cirurgia hepática, pela proximidade com a cava.',
    memoria:
      'O caudado é o segmento independente: recebe dos dois lados e drena direto na cava. Por isso ele sobrevive quando o resto do fígado congestiona.',
    pontos: [
      'Por que o lobo caudado tem drenagem independente?',
      'Que segmento de Couinaud ele corresponde?',
      'Que achado ele produz na síndrome de Budd-Chiari?',
    ],
  },
  {
    termos: ['Lobo Quadrado'],
    classe: 'viscera',
    resumo: 'Segmento IV do fígado, na face visceral, entre a vesícula biliar e a fissura do ligamento redondo.',
    localizacao: 'Face inferior do fígado, delimitado pela fossa da vesícula à direita, pela fissura do ligamento redondo à esquerda e pela porta hepática atrás.',
    funcao: 'Apesar de estar à direita do ligamento falciforme na face visceral, pertence funcionalmente ao lobo esquerdo, por ser irrigado pelo ramo portal esquerdo.',
    vascularizacao:
      'Ramos da artéria hepática esquerda, com contribuição frequente da direita. Corresponde ao segmento IVb de Couinaud — e não a um lobo verdadeiro: a divisão funcional do fígado é pela veia hepática média, e não pelo ligamento falciforme.',
    inervacao:
      'Plexo hepático (T7–T9 e vago). Está entre a vesícula e o ligamento redondo, e é o segmento que se ressecа junto com a vesícula no câncer de vesícula.',
    relacoes: 'Repousa sobre o piloro e a parte superior do duodeno.',
    clinica:
      'Esse descompasso entre aparência e função é o exemplo clássico da diferença entre anatomia morfológica e cirúrgica: quadrado e caudado parecem do lobo direito, mas pertencem ao esquerdo. Na colecistectomia, o segmento IV forma o teto do triângulo hepatocístico e é a referência superior da dissecção.',
    memoria:
      'Quadrado e caudado ficam à direita mas pertencem à esquerda. É a pegadinha que separa quem decorou de quem entendeu.',
    pontos: [
      'Que estruturas delimitam o lobo quadrado?',
      'A que lobo funcional ele pertence e por quê?',
      'Que relação ele tem com a colecistectomia?',
    ],
  },
  {
    termos: ['Ligamento Falciforme'],
    classe: 'ligamento',
    resumo: 'Prega peritoneal em foice que liga o fígado ao diafragma e à parede abdominal anterior.',
    localizacao: 'Da face diafragmática do fígado à parede abdominal anterior e ao umbigo, contendo o ligamento redondo na borda livre.',
    funcao: 'Divide morfologicamente o fígado em lobos direito e esquerdo e é o remanescente do mesogástrio ventral.',
    relacoes: 'Suas duas lâminas se separam superiormente para formar o ligamento coronário e a área nua do fígado.',
    clinica:
      'A área nua, onde não há peritônio, é a via pela qual um abscesso hepático pode alcançar diretamente o diafragma e o espaço pleural. Na laparoscopia, o ligamento falciforme é a referência de entrada e um obstáculo à visão; e a presença de ar entre ele e a parede — o "sinal do ligamento falciforme" — é um dos sinais de pneumoperitônio na radiografia de abdome em decúbito dorsal.',
    memoria:
      'Uma foice de peritônio prendendo o fígado no umbigo. Onde ela se abre, sobra uma área sem peritônio grudada no diafragma.',
    pontos: [
      'Que estruturas o ligamento falciforme conecta?',
      'O que é a área nua do fígado?',
      'Que sinal radiográfico ele pode produzir?',
    ],
  },
  {
    termos: ['Ligamento Redondo do Fígado', 'Ligamento Redondo'],
    classe: 'ligamento',
    sistemas: ['digestorio'],
    resumo: 'Cordão fibroso na borda livre do ligamento falciforme — resto da veia umbilical esquerda.',
    localizacao: 'Do umbigo à fissura do ligamento redondo, na face visceral do fígado, onde alcança o ramo esquerdo da veia porta.',
    funcao: 'Na vida fetal, a veia umbilical trazia sangue oxigenado da placenta ao fígado; após o nascimento, oblitera-se e vira ligamento.',
    relacoes: 'Continua-se, dentro do fígado, com o ligamento venoso — resto do ducto venoso.',
    clinica:
      'A obliteração não é definitiva: na hipertensão portal, a veia umbilical pode se recanalizar e desviar sangue para as veias da parede abdominal, produzindo a cabeça de medusa periumbilical — uma anastomose portossistêmica que é literalmente a reabertura de um vaso fetal. O ligamento redondo é também usado como via de acesso à veia porta esquerda para cateterismo.',
    memoria:
      'A veia umbilical fecha ao nascer, mas não some. Na cirrose ela reabre — e o umbigo vira uma medusa.',
    pontos: [
      'De que estrutura fetal o ligamento redondo deriva?',
      'O que acontece com ele na hipertensão portal?',
      'Onde ele termina no fígado?',
    ],
  },
  {
    termos: ['Ligamento Venoso'],
    classe: 'ligamento',
    resumo: 'Cordão fibroso na fissura entre o lobo caudado e o lobo esquerdo — resto do ducto venoso.',
    localizacao: 'Face visceral do fígado, na fissura do ligamento venoso, entre o lobo caudado e o esquerdo.',
    funcao:
      'O ducto venoso de Arâncio, na vida fetal, desviava a maior parte do sangue umbilical diretamente para a veia cava inferior, poupando a circulação hepática e levando sangue oxigenado ao coração e ao cérebro.',
    relacoes: 'Sua fissura, com a do ligamento redondo, delimita o lobo caudado do esquerdo.',
    clinica:
      'O ducto venoso normalmente fecha nas primeiras duas semanas de vida. Sua persistência é causa rara de encefalopatia hepática no lactente, por desvio portossistêmico congênito, com hiperamonemia sem doença hepática — diagnóstico que só se faz se alguém lembrar dessa anatomia fetal. A fissura é também a referência que delimita o caudado na ressecção.',
    memoria:
      'Umbilical vira ligamento redondo; ducto venoso vira ligamento venoso. Dois atalhos fetais que viram cordas.',
    pontos: [
      'De que estrutura fetal o ligamento venoso deriva?',
      'Que função o ducto venoso tinha no feto?',
      'Que quadro sua persistência pode causar?',
    ],
  },
  {
    termos: ['Porta Hepática'],
    classe: 'viscera',
    resumo: 'Fissura transversal na face visceral do fígado por onde entram e saem as estruturas do pedículo hepático.',
    localizacao: 'Face visceral do fígado, entre o lobo quadrado, à frente, e o caudado, atrás.',
    funcao:
      'Dá passagem, de trás para a frente, à veia porta, à artéria hepática própria e aos ductos hepáticos — a regra é que o ducto é anterior e à direita, a artéria anterior e à esquerda, e a veia porta posterior às duas.',
    vascularizacao:
      'É o pedículo: a veia porta atrás, a artéria hepática própria à esquerda e à frente, e o ducto colédoco à direita e à frente — a disposição que o cirurgião confirma antes de qualquer manobra. O forame omental fica imediatamente atrás dele, e por ele se passa o dedo para a manobra de Pringle, que clampeia o pedículo e interrompe o sangramento hepático.',
    inervacao:
      'Plexo hepático, formado por fibras do gânglio celíaco (T7–T9) e do vago, que envolvem a artéria hepática ao entrar.',
    relacoes: 'O pedículo é envolvido pelo ligamento hepatoduodenal, borda livre do omento menor, que forma a parede anterior do forame omental.',
    clinica:
      'Essa disposição é o que orienta toda dissecção do hilo: o ducto colédoco é a primeira estrutura encontrada na dissecção anterior direita. A manobra de Pringle clampeia o ligamento hepatoduodenal inteiro e controla a hemorragia de fígado — se o sangramento persiste apesar dela, a origem é das veias hepáticas ou da cava, e não do pedículo. Um teste diagnóstico feito com uma pinça.',
    memoria:
      'No pedículo: Ducto à Direita, Artéria à esquerdA, porta atrás. Duas letras iniciais resolvem a topografia.',
    pontos: [
      'Que estruturas atravessam a porta hepática e em que disposição?',
      'O que é o ligamento hepatoduodenal?',
      'O que a manobra de Pringle diferencia?',
    ],
  },
  {
    termos: ['Artéria Hepática Própria'],
    classe: 'arteria',
    resumo: 'Continuação da artéria hepática comum após a gastroduodenal, que sobe no pedículo até o fígado.',
    localizacao: 'No ligamento hepatoduodenal, à esquerda do ducto colédoco e à frente da veia porta; divide-se em ramos direito e esquerdo.',
    funcao: 'Fornece cerca de 25% do fluxo sanguíneo hepático, mas metade do oxigênio — o restante vem da veia porta, que traz sangue com pouco oxigênio e muitos nutrientes.',
    relacoes: 'Do ramo direito nasce, na maioria das pessoas, a artéria cística.',
    clinica:
      'Essa dupla irrigação é o que torna o fígado resistente à isquemia — e o que permite a quimioembolização do carcinoma hepatocelular: o tumor é irrigado quase exclusivamente pela artéria, enquanto o parênquima normal sobrevive pela porta. Embolizar a artéria mata o tumor e poupa o fígado. Variações são frequentes: a hepática direita acessória da mesentérica superior existe em cerca de 15% das pessoas e precisa ser identificada antes de qualquer cirurgia hepatobiliar.',
    memoria:
      'Tumor de fígado vive da artéria; fígado sadio vive da porta. É essa diferença que a quimioembolização explora.',
    pontos: [
      'Qual a contribuição da artéria hepática ao fluxo e ao oxigênio do fígado?',
      'Como isso viabiliza a quimioembolização?',
      'Que variação anatômica é frequente?',
    ],
  },
  /* ─────────────────── Vias biliares ─────────────────── */
  {
    termos: ['Ducto Hepático Comum'],
    classe: 'viscera',
    resumo: 'Ducto formado pela união dos ductos hepáticos direito e esquerdo, na porta hepática.',
    localizacao: 'Da confluência hilar até a junção com o ducto cístico, com cerca de 3 cm de comprimento.',
    funcao: 'Conduz a bile produzida pelo fígado; sua confluência, no hilo, é a placa hilar.',
    vascularizacao:
      'Artérias axiais nas posições de 3 e 9 horas, vindas da hepática direita e da cística. Irrigação longitudinal e delicada, e sua lesão na colecistectomia produz a estenose biliar iatrogênica — a complicação que transforma uma cirurgia de rotina numa hepatectomia.',
    inervacao:
      'Plexo hepático (T7–T9 e vago). Sua compressão por um cálculo impactado no ducto cístico ou no infundíbulo é a síndrome de Mirizzi, que simula tumor de via biliar.',
    relacoes: 'Corre à direita da artéria hepática e à frente da veia porta.',
    clinica:
      'A confluência é o sítio do tumor de Klatskin, o colangiocarcinoma peri-hilar, que produz icterícia obstrutiva com vesícula não palpável — porque a obstrução está acima da entrada do cístico. A comparação com o sinal de Courvoisier é elegante: vesícula palpável indica obstrução abaixo do cístico; vesícula vazia, obstrução acima. A anatomia diz o nível pela palpação.',
    memoria:
      'Icterícia com vesícula murcha: a obstrução está acima do cístico. Com vesícula cheia: está abaixo.',
    pontos: [
      'Como se forma o ducto hepático comum?',
      'O que é o tumor de Klatskin?',
      'Como a vesícula indica o nível da obstrução biliar?',
    ],
  },
  {
    termos: ['Ducto Cístico'],
    classe: 'viscera',
    resumo: 'Ducto que liga a vesícula biliar ao ducto hepático comum, com a válvula espiral de Heister.',
    localizacao: 'Do colo da vesícula até a junção com o hepático comum, com 2 a 4 cm e trajeto muito variável.',
    funcao:
      'Permite o enchimento e o esvaziamento da vesícula. A válvula espiral de Heister, uma prega mucosa helicoidal, mantém o ducto pérvio e impede seu colapso ou distensão brusca.',
    vascularizacao:
      'Artéria cística, ramo da hepática direita, que o acompanha. Ducto cístico, ducto hepático comum e borda inferior do fígado delimitam o triângulo de Calot — dentro do qual a artéria cística deve ser encontrada antes de qualquer clipe, na chamada visão crítica de segurança.',
    inervacao:
      'Plexo hepático (T7–T9 e vago). Suas pregas espirais (válvula de Heister) mantêm a luz pérvia, mas dificultam a passagem de cateter e de cálculo.',
    relacoes: 'Com o ducto hepático comum e a borda inferior do fígado, delimita o triângulo hepatocístico (de Calot), onde corre a artéria cística.',
    clinica:
      'Identificar o triângulo de Calot e obter a "visão crítica de segurança" — apenas duas estruturas entrando na vesícula, com o infundíbulo liberado — é o padrão que reduziu drasticamente a lesão iatrogênica de via biliar na colecistectomia laparoscópica. A válvula de Heister é também o motivo de a canulação retrógrada do cístico ser difícil. A obstrução do cístico por cálculo produz colecistite aguda sem icterícia.',
    memoria:
      'Cálculo no cístico: dor e colecistite, sem icterícia. Cálculo no colédoco: icterícia. O endereço decide a doença.',
    pontos: [
      'O que é a válvula espiral de Heister?',
      'Que estruturas delimitam o triângulo de Calot?',
      'O que é a visão crítica de segurança?',
    ],
  },
  {
    termos: ['Artéria Cística'],
    classe: 'arteria',
    resumo: 'Ramo da artéria hepática direita que irriga a vesícula biliar, dentro do triângulo de Calot.',
    localizacao: 'Nasce no triângulo hepatocístico e cruza atrás do ducto hepático comum na maioria das pessoas.',
    funcao: 'Única fonte arterial da vesícula; divide-se em ramos superficial e profundo ao alcançá-la.',
    relacoes: 'O linfonodo cístico (de Mascagni ou de Lund) marca sua posição no triângulo.',
    clinica:
      'Ser uma artéria terminal, sem colaterais significativas, é a razão de a colecistite evoluir para gangrena e perfuração quando a inflamação compromete o vaso — o que faz da colecistite gangrenosa uma indicação de cirurgia sem espera. Sua ligadura inadvertida rente à hepática direita é uma das causas de isquemia biliar pós-operatória.',
    memoria:
      'A vesícula tem uma artéria só. Comprometeu a artéria, a parede necrosa — e colecistite gangrenosa não espera.',
    pontos: [
      'De que artéria nasce a cística?',
      'Onde ela é encontrada na cirurgia?',
      'Por que a colecistite pode evoluir para gangrena?',
    ],
  },
  {
    termos: ['Ducto Colédoco'],
    classe: 'viscera',
    resumo: 'Ducto biliar principal, da junção do hepático comum com o cístico até a papila duodenal maior.',
    localizacao:
      'Percorre quatro segmentos: supraduodenal, no ligamento hepatoduodenal; retroduodenal; pancreático, dentro da cabeça do pâncreas; e intramural, na parede duodenal.',
    funcao: 'Conduz a bile ao duodeno; seu calibre normal é de até 6 mm, aumentando cerca de 1 mm por década após os 60 anos e após colecistectomia.',
    vascularizacao:
      'Aqui a anatomia é milimétrica: duas artérias axiais correm nas posições de 3 e 9 horas ao longo do ducto, alimentadas de baixo pela retroduodenal e de cima pela hepática direita e pela cística. Toda a irrigação é longitudinal — e é por isso que dissecar circunferencialmente o colédoco produz estenose isquêmica meses depois, uma das complicações mais temidas da cirurgia biliar.',
    inervacao:
      'Plexo hepático, com simpático de T7 a T9 e parassimpático do vago. A dor da obstrução biliar é epigástrica e no hipocôndrio direito, com irradiação para a escápula direita.',
    relacoes: 'No pedículo, é a estrutura mais anterior e à direita; o segmento pancreático é envolvido pela cabeça do pâncreas.',
    clinica:
      'O trajeto intrapancreático explica a icterícia obstrutiva do tumor de cabeça de pâncreas e da pancreatite crônica. E é a passagem pela ampola que faz um único cálculo produzir colangite — a tríade de Charcot: febre, icterícia e dor no hipocôndrio direito; com hipotensão e confusão, é a pêntade de Reynolds, que indica drenagem biliar de urgência.',
    memoria:
      'Charcot são três: febre, icterícia e dor. Reynolds são cinco: some choque e confusão — e a urgência muda de patamar.',
    pontos: [
      'Quais são os quatro segmentos do ducto colédoco?',
      'Qual seu calibre normal?',
      'Qual a diferença entre a tríade de Charcot e a pêntade de Reynolds?',
    ],
  },
  {
    termos: ['Óstios das Veias Hepáticas'],
    classe: 'veia',
    resumo: 'Aberturas das três veias hepáticas na veia cava inferior, imediatamente abaixo do diafragma.',
    localizacao: 'Face posterossuperior do fígado, onde as veias hepáticas direita, média e esquerda desembocam na cava.',
    funcao:
      'Drenam todo o sangue do fígado. As veias hepáticas correm nas fissuras entre os setores — são intersegmentares —, enquanto os ramos portais são intrassegmentares. Essa alternância define os planos de ressecção.',
    vascularizacao:
      'São a própria via de saída do fígado: as veias hepáticas direita, média e esquerda desembocam na veia cava inferior imediatamente abaixo do diafragma, com as veias curtas do lobo caudado entrando separadamente.',
    inervacao:
      'Fibras autonômicas do plexo hepático. Sua obstrução é a síndrome de Budd-Chiari, com a tríade de dor abdominal, hepatomegalia e ascite — e o lobo caudado hipertrofiado, que drena por outra via, é a pista diagnóstica na imagem.',
    relacoes: 'A veia hepática média corre no plano da linha de Cantlie; a esquerda frequentemente forma um tronco comum com ela.',
    clinica:
      'A obstrução desses óstios é a síndrome de Budd-Chiari, com hepatomegalia dolorosa, ascite e insuficiência hepática. E o segmento suprahepático da cava é o ponto de controle nas hepatectomias e nos traumas hepáticos graves — a exclusão vascular total do fígado clampeia a cava acima e abaixo, além do pedículo.',
    memoria:
      'Veia hepática corre entre os segmentos; veia porta corre dentro deles. É por isso que se corta pela veia hepática.',
    pontos: [
      'Quantas veias hepáticas existem e onde desembocam?',
      'Por que elas são intersegmentares?',
      'O que é a síndrome de Budd-Chiari?',
    ],
  },
  /* ─────────────────── Pâncreas ─────────────────── */
  {
    termos: ['Cabeça do Pâncreas'],
    classe: 'glandula',
    resumo: 'Porção mais volumosa do pâncreas, encaixada na curva do duodeno, com o processo uncinado.',
    localizacao: 'Retroperitoneal, ao nível de L2, abraçada pelas três primeiras porções do duodeno; o processo uncinado passa atrás dos vasos mesentéricos superiores.',
    funcao: 'Contém o ducto pancreático principal em seu trajeto final e o ducto acessório; compartilha com o duodeno as arcadas pancreaticoduodenais.',
    inervacao:
      'Plexo celíaco, com simpático de T5 a T9 pelos nervos esplâncnicos maior e menor, e parassimpático do vago. As aferentes de dor sobem por essas fibras até a medula torácica baixa — e é por isso que a dor pancreática é epigástrica, em faixa, com irradiação para o dorso, e alivia quando o paciente se curva para a frente.',
    vascularizacao: 'Artérias pancreaticoduodenais superior e inferior — irrigação compartilhada com o duodeno.',
    relacoes: 'O ducto colédoco atravessa sua face posterior; a veia porta se forma atrás do seu colo.',
    clinica:
      'Compartilhar a irrigação com o duodeno é a razão de não existir "pancreatectomia de cabeça": a operação é a duodenopancreatectomia (Whipple), que remove cabeça, duodeno, vesícula e colédoco distal em bloco. O trajeto do colédoco explica a icterícia progressiva e indolor do tumor de cabeça, e o processo uncinado, atrás dos vasos mesentéricos, é o que define ressecabilidade.',
    memoria:
      'Cabeça de pâncreas e duodeno dividem as mesmas artérias. Não dá para tirar um sem o outro — daí o Whipple.',
    pontos: [
      'Por que não se ressecam cabeça do pâncreas e duodeno separadamente?',
      'Que ducto atravessa a cabeça do pâncreas?',
      'O que é o processo uncinado?',
    ],
  },
  {
    termos: ['Corpo do Pâncreas'],
    classe: 'glandula',
    resumo: 'Porção média do pâncreas, que cruza a coluna à frente da aorta e da mesentérica superior.',
    localizacao: 'Retroperitoneal, ao nível de L1, cruzando a linha média; sua face anterior forma parte da parede posterior da bolsa omental.',
    funcao: 'Contém a maior parte do ducto pancreático principal e das ilhotas pancreáticas.',
    inervacao:
      'Plexo celíaco (T5–T9 e vago). O gânglio celíaco fica imediatamente atrás dele, o que explica a intensidade da dor do câncer de corpo de pâncreas — e fundamenta a neurólise do plexo celíaco, bloqueio que alivia essa dor quando os opioides já não bastam.',
    vascularizacao: 'Artéria esplênica, que corre sinuosa ao longo da sua borda superior, e artéria pancreática dorsal.',
    relacoes: 'A veia esplênica corre no seu sulco posterior, unindo-se à mesentérica superior atrás do colo.',
    clinica:
      'Estar apoiado sobre a coluna é o que torna o corpo do pâncreas o segmento mais lesado no trauma abdominal fechado — o clássico guidão de bicicleta no epigástrio da criança —, com transecção pancreática e elevação tardia de amilase. E o contato da veia esplênica com o corpo explica sua trombose na pancreatite crônica, com hipertensão portal segmentar e varizes gástricas isoladas.',
    memoria:
      'Guidão de bicicleta no epigástrio de criança: pense em transecção de pâncreas sobre a coluna.',
    pontos: [
      'Por que o corpo do pâncreas é vulnerável no trauma fechado?',
      'Que vasos correm em contato com ele?',
      'O que é hipertensão portal segmentar?',
    ],
  },
  {
    termos: ['Cauda do Pâncreas'],
    classe: 'glandula',
    resumo: 'Extremidade esquerda do pâncreas, a única porção intraperitoneal, que alcança o hilo esplênico.',
    localizacao: 'No ligamento esplenorrenal, junto com os vasos esplênicos, chegando ao hilo do baço em cerca de 30% a 50% das pessoas.',
    funcao: 'Contém a maior concentração de ilhotas pancreáticas de toda a glândula.',
    inervacao:
      'Plexo celíaco (T5–T9 e vago). É a porção mais móvel e a única intraperitoneal, alojada no ligamento esplenorrenal — vizinhança que faz a pancreatite de cauda trombosar a veia esplênica e produzir hipertensão portal segmentar.',
    vascularizacao: 'Artéria esplênica e artéria pancreática caudal.',
    relacoes: 'É a única parte do pâncreas revestida por peritônio em quase toda a circunferência.',
    clinica:
      'Sua proximidade com o hilo esplênico faz da fístula pancreática uma complicação conhecida da esplenectomia, e da esplenectomia uma etapa frequente da pancreatectomia corpo-caudal. A maior densidade de ilhotas é a razão de a cauda ser a região preferida para biópsia e para a coleta em transplante de ilhotas no diabetes tipo 1.',
    memoria:
      'A cauda do pâncreas encosta no baço. Tirou o baço sem cuidado, vaza suco pancreático.',
    pontos: [
      'Por que a cauda é a única porção intraperitoneal do pâncreas?',
      'Que relação ela tem com o baço?',
      'Por que ela é preferida no transplante de ilhotas?',
    ],
  },
  /* ─────────────────── Vizinhos ─────────────────── */
  {
    termos: ['Rim Esquerdo'],
    classe: 'viscera',
    sistemas: ['digestorio'],
    resumo: 'Rim situado no retroperitônio esquerdo, ligeiramente mais alto que o direito.',
    localizacao: 'De T11 a L2 aproximadamente, mais alto que o direito porque não é empurrado para baixo pelo fígado.',
    funcao: 'Filtra o plasma e regula volume, eletrólitos e equilíbrio ácido-base; nesta prancha aparece como vizinho posterior dos órgãos digestórios.',
    vascularizacao:
      'Artéria renal esquerda, mais curta que a direita porque a aorta está à esquerda da linha média. A veia renal esquerda, ao contrário, é cerca de três vezes mais longa: ela precisa cruzar a linha média por diante da aorta e sob a artéria mesentérica superior para alcançar a cava — passagem apertada que é a base da síndrome do quebra-nozes, com hematúria e dor em flanco. Ela recebe ainda a veia suprarrenal e a gonadal esquerdas.',
    inervacao:
      'Plexo renal, de fibras simpáticas de T10 a L1 pelos esplâncnicos menor e imo. As aferentes de dor sobem por esses mesmos segmentos — daí a dor de flanco irradiando para a virilha e para o testículo esquerdo.',
    relacoes:
      'À frente estão o estômago, o baço, o pâncreas, a flexura cólica esquerda e alças de jejuno; atrás, o diafragma, o quadrado do lombo e o psoas.',
    clinica:
      'Essa vizinhança é o que faz a nefrectomia esquerda exigir cuidado com o baço e com a cauda do pâncreas, e o que explica a dor lombar irradiada da pielonefrite e do cálculo. A veia renal esquerda, mais longa, passa entre a aorta e a mesentérica superior — e seu aprisionamento nessa pinça é a síndrome do quebra-nozes, com hematúria e dor no flanco esquerdo.',
    memoria:
      'O rim esquerdo é mais alto porque não tem fígado por cima. E sua veia é longa porque precisa atravessar a linha média.',
    pontos: [
      'Por que o rim esquerdo é mais alto que o direito?',
      'Que órgãos estão à sua frente?',
      'O que é a síndrome do quebra-nozes?',
    ],
  },
  {
    termos: ['Parede Abdominal Anterior'],
    classe: 'musculo',
    resumo: 'Conjunto de camadas musculoaponeuróticas que fecham o abdome à frente e nos lados.',
    localizacao:
      'Da margem costal e do processo xifoide, acima, às cristas ilíacas, ao ligamento inguinal e ao púbis, abaixo. Suas camadas, de fora para dentro: pele, tela subcutânea (fáscias de Camper e de Scarpa), músculos, fáscia transversal, gordura extraperitoneal e peritônio.',
    funcao: 'Contém e protege as vísceras, gera pressão intra-abdominal e move o tronco.',
    vascularizacao:
      'Artérias epigástricas superior, ramo da torácica interna, e inferior, ramo da ilíaca externa, que se anastomosam dentro da bainha do reto — a comunicação que sustenta a circulação colateral na coarctação da aorta e o retalho TRAM na reconstrução mamária. Lateralmente, as intercostais posteriores e a circunflexa ilíaca profunda.',
    inervacao: 'Nervos intercostais T7 a T11, subcostal (T12), ílio-hipogástrico e ilioinguinal (L1), com distribuição em dermátomos.',
    clinica:
      'Os dermátomos da parede são a régua da anestesia e do exame: T10 é o umbigo, T7 o processo xifoide, L1 a região inguinal. A fáscia de Scarpa, por se continuar com a fáscia de Colles no períneo, explica o trajeto do extravasamento urinário na rotura de uretra: o líquido sobe pela parede abdominal e não desce para a coxa. O teste de Carnett — dor que piora ao contrair a parede — distingue dor parietal de dor visceral em segundos.',
    memoria:
      'Umbigo é T10. Xifoide é T7. Virilha é L1. Três marcos que você usa em toda anestesia e todo exame de abdome.',
    pontos: [
      'Quais são as camadas da parede abdominal anterior?',
      'Que dermátomos correspondem ao umbigo e ao xifoide?',
      'O que é o teste de Carnett?',
    ],
  },
]
