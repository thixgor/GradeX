import type { EntradaDicionario } from './tipos'

/**
 * Membro superior.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const MEMBRO_SUPERIOR: EntradaDicionario[] = [
  {
    termos: ['Escápula'],
    resumo: 'Osso triangular e plano que desliza sobre a parede torácica posterior.',
    localizacao:
      'Entre a 2ª e a 7ª costela, com a espinha da escápula dividindo a face posterior em fossas supraespinal e infraespinal, e terminando lateralmente no acrômio.',
    funcao: 'Serve de base móvel para a articulação glenoumeral, ampliando muito o arco do ombro pelo ritmo escapuloumeral.',
    vascularizacao: 'Rede anastomótica escapular: artérias supraescapular, circunflexa da escápula e dorsal da escápula.',
    inervacao: 'Nervos supraescapular, dorsal da escápula, torácico longo e subescapulares comandam os músculos que a movem.',
    relacoes: 'A cavidade glenoidal recebe a cabeça do úmero; o processo coracoide dá inserção a bíceps curto, coracobraquial e peitoral menor.',
    clinica:
      'A escápula alada denuncia lesão do nervo torácico longo (serrátil anterior) ou do dorsal da escápula (romboides). A rica anastomose escapular permite ligar a subclávia com preservação do fluxo distal.',
    pontos: ['Ritmo escapuloumeral amplia o arco do ombro', 'Ângulo inferior projeta-se em T7', 'Escápula alada = nervo torácico longo'],
  },
  {
    termos: ['Acrômio'],
    resumo: 'Processo achatado que continua a espinha da escápula e forma o teto do ombro.',
    localizacao: 'Na parte superolateral da escápula, articulando-se com a extremidade acromial da clavícula.',
    funcao: 'Forma, com o processo coracoide e o ligamento coracoacromial, o arco coracoacromial — o teto sob o qual desliza o supraespinal. Dá inserção ao deltoide e ao trapézio.',
    clinica:
      'A síndrome do impacto (impingement) comprime o supraespinal e a bolsa subacromial contra esse arco; a acromioplastia amplia o espaço. A luxação acromioclavicular produz o sinal da tecla.',
    pontos: ['Forma o arco coracoacromial', 'Impacto subacromial e tendinopatia do supraespinal', 'Articulação acromioclavicular'],
  },
  {
    termos: ['Processo Coracoide'],
    resumo: 'Projeção em forma de bico de corvo, na face anterior da escápula.',
    localizacao: 'Abaixo da clavícula, palpável no sulco deltopeitoral, sob a borda anterior do deltoide.',
    funcao: 'Ancora o peitoral menor, a cabeça curta do bíceps braquial, o coracobraquial e os ligamentos coracoclaviculares e coracoacromial.',
    clinica:
      'É chamado o "farol do ombro" pela sua constância como reparo cirúrgico e de bloqueio infraclavicular do plexo braquial. Na cirurgia de Latarjet, é transferido para a borda anterior da glenoide para tratar instabilidade recidivante.',
    pontos: ['Três músculos e dois ligamentos', 'Reparo do bloqueio infraclavicular', 'Transferência na cirurgia de Latarjet'],
  },
  {
    termos: ['Úmero'],
    resumo: 'Osso longo do braço, entre o ombro e o cotovelo.',
    localizacao:
      'Cabeça articulada na glenoide; tubérculos maior e menor separados pelo sulco intertubercular; colo cirúrgico abaixo deles; diáfise com o sulco do nervo radial atrás; e distalmente, tróclea, capítulo e epicôndilos.',
    funcao: 'Alavanca principal do braço, ancorando o manguito rotador em cima e os flexores e extensores do antebraço embaixo.',
    vascularizacao: 'Artérias circunflexas umerais anterior e posterior em cima e artéria braquial profunda na diáfise.',
    inervacao: 'Nervo axilar contorna o colo cirúrgico; nervo radial percorre o sulco radial; nervo ulnar passa atrás do epicôndilo medial.',
    relacoes: 'O tendão da cabeça longa do bíceps corre no sulco intertubercular; o manguito rotador se insere nos tubérculos.',
    clinica:
      'Cada nível de fratura tem seu nervo em risco: colo cirúrgico → nervo axilar; diáfise → nervo radial (mão caída); supracondilar (criança) → artéria braquial e nervo mediano; epicôndilo medial → nervo ulnar.',
    pontos: [
      'Colo cirúrgico + nervo axilar',
      'Sulco do nervo radial na diáfise',
      'Fratura supracondilar da criança ameaça a artéria braquial',
    ],
  },
  {
    termos: ['Epicôndilo Medial'],
    resumo: 'Saliência medial da extremidade distal do úmero, origem comum dos flexores do antebraço.',
    localizacao: 'Palpável na face medial do cotovelo, com o nervo ulnar correndo em seu sulco posterior.',
    funcao: 'Dá origem à massa comum dos flexores e pronadores e ao ligamento colateral ulnar.',
    clinica:
      'A epicondilite medial é o "cotovelo de golfista". O nervo ulnar logo atrás é o que produz o choque ao bater o cotovelo e é o alvo da neuropatia compressiva. Na criança, a fratura por avulsão do epicôndilo medial é comum e pode encarcerar o fragmento na articulação.',
    pontos: ['Origem comum dos flexores', 'Nervo ulnar no sulco posterior', 'Epicondilite medial / cotovelo de golfista'],
  },
  {
    termos: ['Epicôndilo Lateral'],
    resumo: 'Saliência lateral da extremidade distal do úmero, origem comum dos extensores do antebraço.',
    localizacao: 'Palpável na face lateral do cotovelo, acima do capítulo.',
    funcao: 'Dá origem à massa comum dos extensores e supinadores e ao ligamento colateral radial.',
    clinica:
      'A epicondilite lateral (cotovelo de tenista) é a tendinopatia mais comum do cotovelo e envolve sobretudo o extensor radial curto do carpo. A dor piora à extensão resistida do punho.',
    pontos: ['Origem comum dos extensores', 'Epicondilite lateral / cotovelo de tenista', 'Extensor radial curto do carpo como tendão-chave'],
  },
  {
    termos: ['Tróclea do Úmero', 'Tróclea'],
    resumo: 'Superfície articular em carretel na extremidade distal do úmero, para a incisura troclear da ulna.',
    localizacao: 'Medialmente ao capítulo, na face distal do úmero.',
    funcao: 'Forma a articulação umeroulnar, um gínglimo puro que permite apenas flexão e extensão do cotovelo.',
    clinica: 'A congruência da tróclea com a incisura troclear é o que dá estabilidade ao cotovelo em extensão; sua lesão gera rigidez e artrose precoce.',
    pontos: ['Articula com a incisura troclear da ulna', 'Gínglimo: só flexão e extensão', 'Medial ao capítulo'],
  },
  {
    termos: ['Capítulo do Úmero', 'Capítulo'],
    resumo: 'Superfície articular esférica lateral do úmero distal, para a cabeça do rádio.',
    localizacao: 'Lateralmente à tróclea, na face distal do úmero.',
    funcao: 'Articula-se com a fóvea da cabeça do rádio, permitindo flexo-extensão e a rotação da pronossupinação.',
    clinica: 'A osteocondrite dissecante do capítulo acomete atletas de arremesso e ginastas adolescentes; a fratura de capítulo é rara e costuma exigir fixação.',
    pontos: ['Articula com a cabeça do rádio', 'Permite pronossupinação', 'Osteocondrite dissecante em atletas jovens'],
  },
  {
    termos: ['Olécrano'],
    resumo: 'Proeminência posterior da ulna proximal, o "cotovelo" propriamente dito.',
    localizacao: 'Extremidade proximal e posterior da ulna, encaixando-se na fossa do olécrano do úmero em extensão.',
    funcao: 'Recebe a inserção do tríceps braquial e trava a extensão do cotovelo.',
    clinica:
      'A fratura do olécrano separa o fragmento pela tração do tríceps e abole a extensão ativa — indicação clássica de banda de tensão. A bursite olecraniana produz aumento de volume flutuante bem localizado.',
    pontos: ['Inserção do tríceps braquial', 'Trava a extensão na fossa do olécrano', 'Fratura abole a extensão ativa'],
  },
  {
    termos: ['Rádio'],
    resumo: 'Osso lateral do antebraço, que gira em torno da ulna na pronossupinação e sustenta a mão.',
    localizacao: 'Do capítulo do úmero, em cima, até o carpo, embaixo, com a cabeça proximal e o processo estiloide distal.',
    funcao: 'Transmite a carga da mão ao cotovelo e é a peça móvel da pronossupinação, girando sobre a ulna, que permanece relativamente fixa.',
    vascularizacao: 'Artéria radial e artéria interóssea anterior.',
    inervacao: 'Ramo interósseo posterior do nervo radial, junto ao colo, e o ramo superficial ao longo da borda lateral.',
    relacoes: 'Unido à ulna pela membrana interóssea, que transfere carga do rádio para a ulna e daí para o úmero.',
    clinica:
      'A fratura de Colles (extremidade distal com desvio dorsal) é a fratura mais comum do adulto acima dos 50 anos, típica de queda com a mão espalmada. A fratura de Monteggia associa fratura da ulna com luxação da cabeça do rádio.',
    pontos: ['Peça móvel da pronossupinação', 'Fratura de Colles: dorsal, em "dorso de garfo"', 'Processo estiloide radial é mais distal que o ulnar'],
  },
  {
    termos: ['Ulna'],
    resumo: 'Osso medial do antebraço, a peça estável da articulação do cotovelo.',
    localizacao: 'Do olécrano e da incisura troclear, em cima, até a cabeça e o processo estiloide, embaixo.',
    funcao: 'Forma a articulação principal do cotovelo com a tróclea umeral e serve de eixo em torno do qual o rádio gira.',
    vascularizacao: 'Artéria ulnar e artéria interóssea anterior.',
    inervacao: 'Nervo ulnar corre medialmente, e o interósseo anterior (mediano) irriga os planos profundos.',
    relacoes: 'A cabeça da ulna articula-se com a incisura ulnar do rádio na articulação radioulnar distal, estabilizada pela fibrocartilagem triangular.',
    clinica:
      'A fratura de Galeazzi combina fratura da diáfise radial com luxação radioulnar distal; a de Monteggia, fratura da ulna com luxação da cabeça do rádio. A variância ulnar positiva predispõe à síndrome do impacto ulnocarpal.',
    pontos: ['Peça estável do cotovelo', 'Monteggia (ulna) x Galeazzi (rádio)', 'Cabeça da ulna é distal; a do rádio é proximal'],
  },
  {
    termos: ['Escafoide'],
    resumo: 'Osso da fileira proximal do carpo, o mais lateral, ponte entre as duas fileiras.',
    localizacao: 'No assoalho da tabaqueira anatômica, palpável entre os tendões do abdutor longo/extensor curto do polegar e o extensor longo do polegar.',
    funcao: 'Estabiliza e coordena o movimento entre as fileiras proximal e distal do carpo.',
    vascularizacao:
      'Recebe sangue por ramos da artéria radial que entram predominantemente pelo seu polo distal, de modo que o fluxo para o polo proximal é retrógrado.',
    clinica:
      'É o osso do carpo que mais fratura. Dor na tabaqueira após queda com a mão espalmada obriga a imobilizar e repetir a radiografia em 10–14 dias, mesmo com exame inicial normal, porque o traço pode não aparecer. O fluxo retrógrado explica a necrose avascular do polo proximal.',
    pontos: ['Fratura mais comum do carpo', 'Dor na tabaqueira anatômica', 'Necrose avascular do polo proximal por fluxo retrógrado'],
  },
  {
    termos: ['Semilunar'],
    resumo: 'Osso central da fileira proximal do carpo, entre o escafoide e o piramidal.',
    localizacao: 'Articula-se acima com o rádio, sendo o osso do carpo mais frequentemente luxado.',
    funcao: 'Transmite carga do rádio para a fileira distal do carpo.',
    clinica:
      'A doença de Kienböck é a osteonecrose do semilunar, associada à variância ulnar negativa. A luxação do semilunar (com o sinal do "copo derramado" no perfil) pode comprimir o nervo mediano.',
    pontos: ['Osso do carpo mais luxado', 'Doença de Kienböck', 'Luxação comprime o nervo mediano'],
  },
  {
    termos: ['Pisiforme'],
    resumo: 'Pequeno osso sesamoide da fileira proximal do carpo, no tendão do flexor ulnar do carpo.',
    localizacao: 'Face palmar e ulnar do punho, facilmente palpável na base da eminência hipotenar.',
    funcao: 'Aumenta o braço de alavanca do flexor ulnar do carpo.',
    relacoes: 'Forma, com o hâmulo do hamato, o canal de Guyon, por onde passam o nervo e a artéria ulnares.',
    clinica: 'É reparo palpável para localizar o canal de Guyon; a compressão do nervo ulnar aí (ciclistas, trauma repetitivo) causa fraqueza dos intrínsecos com sensibilidade dorsal preservada.',
    pontos: ['Sesamoide no flexor ulnar do carpo', 'Limite do canal de Guyon', 'Reparo palpável do punho ulnar'],
  },
  {
    termos: ['Hamato'],
    resumo: 'Osso da fileira distal do carpo, reconhecível pelo seu hâmulo em gancho.',
    localizacao: 'No lado ulnar da fileira distal, com o hâmulo projetando-se palmarmente.',
    funcao: 'Articula-se com o 4º e o 5º metacarpos e ancora o retináculo dos flexores.',
    relacoes: 'O hâmulo forma a parede lateral do canal de Guyon e o pilar ulnar do túnel do carpo.',
    clinica: 'A fratura do hâmulo do hamato ocorre em esportes de raquete e golfe e pode lesar o nervo ulnar; costuma ser invisível na radiografia simples e exigir tomografia.',
    pontos: ['Hâmulo forma o túnel do carpo e o canal de Guyon', 'Fratura em esportes de bastão', 'Risco para o nervo ulnar'],
  },
  {
    termos: ['Túnel do Carpo'],
    classe: 'passagem-ossea',
    resumo: 'Canal osteofibroso na face palmar do punho, fechado pelo retináculo dos flexores.',
    localizacao: 'Entre os pilares ósseos — escafoide e trapézio lateralmente, pisiforme e hâmulo do hamato medialmente — com o retináculo dos flexores como teto.',
    funcao: 'Conduz nove tendões flexores (quatro do flexor superficial, quatro do profundo e o flexor longo do polegar) e o nervo mediano.',
    relacoes: 'O nervo mediano é a estrutura mais superficial dentro do túnel, logo abaixo do retináculo — e por isso a primeira a sofrer com o aumento de pressão.',
    clinica:
      'A síndrome do túnel do carpo é a neuropatia compressiva mais comum: parestesia nos três primeiros dedos e metade radial do anular, com piora noturna e atrofia tenar tardia. Os testes de Phalen e Tinel apoiam o diagnóstico. A sensibilidade da eminência tenar é poupada porque o ramo cutâneo palmar passa por fora do túnel.',
    pontos: [
      '9 tendões + nervo mediano',
      'Poupa a sensibilidade da eminência tenar (ramo cutâneo palmar passa por fora)',
      'Phalen, Tinel e atrofia tenar',
    ],
  },
  {
    termos: ['Articulação Glenoumeral'],
    resumo: 'Articulação esferóidea entre a cabeça do úmero e a cavidade glenoidal da escápula.',
    localizacao: 'Entre a cabeça umeral, grande e esférica, e a glenoide, rasa e pequena, aprofundada pelo lábio glenoidal.',
    funcao: 'A articulação mais móvel do corpo, permitindo movimento em três eixos com amplitude máxima ao custo de estabilidade óssea mínima.',
    vascularizacao: 'Artérias circunflexas umerais anterior e posterior e supraescapular.',
    inervacao: 'Nervos axilar, supraescapular e peitoral lateral — a lei de Hilton em ação: quem move a articulação também a inerva.',
    relacoes: 'A cápsula é frouxa inferiormente para permitir a abdução, e é justamente por aí que a cabeça escapa nas luxações.',
    clinica:
      'É a articulação que mais luxa no corpo, e mais de 95% das luxações são anteroinferiores. A checagem do nervo axilar (sensibilidade sobre o deltoide) é obrigatória antes e depois da redução. A lesão de Bankart (lábio) e a de Hill-Sachs (cabeça umeral) explicam a recidiva.',
    pontos: ['Mais móvel e mais instável do corpo', 'Luxação anteroinferior; checar nervo axilar', 'Manguito rotador é o estabilizador dinâmico'],
  },
  {
    termos: ['Músculo Deltoide'],
    resumo: 'Músculo triangular que cobre o ombro e lhe dá o contorno arredondado.',
    localizacao: 'Da clavícula lateral, do acrômio e da espinha da escápula até a tuberosidade deltóidea do úmero.',
    funcao: 'A porção acromial (média) é a principal abdutora do braço acima de 15°; a clavicular flexiona e roda medialmente, e a espinal estende e roda lateralmente.',
    vascularizacao: 'Artéria circunflexa umeral posterior, que acompanha o nervo axilar pelo espaço quadrangular.',
    inervacao: 'Nervo axilar (C5–C6), que contorna o colo cirúrgico do úmero.',
    clinica:
      'É o músculo da injeção intramuscular no braço, aplicada 2–3 dedos abaixo do acrômio para evitar o nervo axilar. Na luxação do ombro ou na fratura do colo cirúrgico, testa-se a sensibilidade sobre o deltoide para avaliar o nervo axilar.',
    pontos: ['Principal abdutor acima de 15°', 'Nervo axilar contorna o colo cirúrgico', 'Sítio da injeção intramuscular no braço'],
  },
  {
    termos: ['Músculo Supraespinal'],
    resumo: 'Músculo do manguito rotador que ocupa a fossa supraespinal e passa sob o arco coracoacromial.',
    localizacao: 'Da fossa supraespinal da escápula até a faceta superior do tubérculo maior do úmero, passando sob o acrômio.',
    funcao: 'Inicia a abdução do braço (primeiros 15°) e mantém a cabeça umeral centrada na glenoide durante todo o movimento.',
    vascularizacao: 'Artéria supraescapular, com uma zona crítica de hipovascularização perto da inserção.',
    inervacao: 'Nervo supraescapular (C5–C6), que passa pela incisura da escápula.',
    clinica:
      'É o tendão mais lesado do manguito rotador, tanto por impacto subacromial quanto pela zona crítica de baixa vascularização. Testado pelo teste de Jobe (lata vazia); dor no arco de 60° a 120° sugere impacto.',
    pontos: ['Inicia a abdução (0–15°)', 'Nervo supraescapular', 'Tendão mais lesado do manguito rotador'],
  },
  {
    termos: ['Músculo Infraespinal', 'Músculo Redondo Menor', 'Músculo Redondo Maior'],
    resumo: 'Músculos escapuloumerais que, com o supraespinal, formam e completam o manguito rotador.',
    localizacao: 'Infraespinal e redondo menor na face posterior da escápula, inserindo-se no tubérculo maior; subescapular na face costal, no tubérculo menor; redondo maior na borda lateral, no sulco intertubercular.',
    funcao:
      'Infraespinal e redondo menor rodam lateralmente o braço; o subescapular roda medialmente. Juntos, comprimem a cabeça contra a glenoide. O redondo maior, que não faz parte do manguito, aduz e roda medialmente.',
    vascularizacao: 'Artérias supraescapular, circunflexa da escápula e subescapular.',
    inervacao: 'Nervo supraescapular (infraespinal), axilar (redondo menor), subescapulares (subescapular) e subescapular inferior (redondo maior).',
    clinica:
      'O manguito rotador (SITS: supraespinal, infraespinal, redondo menor e subescapular) é o estabilizador dinâmico do ombro. Teste de Patte e rotação externa resistida avaliam o infraespinal; o lift-off e o belly-press, o subescapular.',
    pontos: ['SITS = supraespinal, infraespinal, redondo menor, subescapular', 'Redondo maior não faz parte do manguito', 'Estabilizadores dinâmicos da glenoumeral'],
  },
  {
    termos: ['Músculo Bíceps Braquial'],
    resumo: 'Músculo de duas cabeças na face anterior do braço, o flexor e supinador do antebraço.',
    localizacao:
      'A cabeça longa nasce no tubérculo supraglenoidal e corre pelo sulco intertubercular; a curta, no processo coracoide. Ambas convergem para a tuberosidade do rádio e para a aponeurose bicipital.',
    funcao: 'Supinação do antebraço (sua ação mais potente, com o cotovelo fletido) e flexão do cotovelo; a cabeça longa auxilia na estabilização da cabeça umeral.',
    vascularizacao: 'Artéria braquial e sua colateral.',
    inervacao: 'Nervo musculocutâneo (C5–C6).',
    relacoes: 'A aponeurose bicipital protege a artéria braquial e o nervo mediano na fossa cubital, separando-os da veia mediana cubital.',
    clinica:
      'O reflexo bicipital avalia C5–C6. A ruptura da cabeça longa produz o sinal de Popeye (ventre deslocado distalmente) e costuma ser bem tolerada. A aponeurose bicipital é a "graça de Deus" da punção venosa na fossa cubital.',
    pontos: ['Supinação é a ação principal', 'Nervo musculocutâneo; reflexo bicipital = C5–C6', 'Sinal de Popeye na ruptura da cabeça longa'],
  },
  {
    termos: ['Músculo Tríceps Braquial'],
    resumo: 'Único músculo do compartimento posterior do braço, com três cabeças convergindo no olécrano.',
    localizacao: 'Cabeça longa no tubérculo infraglenoidal, lateral e medial na face posterior do úmero, com o sulco do nervo radial entre elas.',
    funcao: 'Extensão do cotovelo; a cabeça longa também estende e aduz o braço.',
    vascularizacao: 'Artéria braquial profunda, que acompanha o nervo radial no sulco.',
    inervacao: 'Nervo radial (C6–C8).',
    clinica: 'O reflexo tricipital avalia C7. A fratura da diáfise umeral no sulco radial poupa a cabeça longa (inervada mais proximalmente), o que ajuda a localizar o nível da lesão do nervo radial.',
    pontos: ['Extensor do cotovelo', 'Nervo radial; reflexo tricipital = C7', 'Sulco do nervo radial entre as cabeças lateral e medial'],
  },
  {
    termos: ['Músculo Braquiorradial'],
    resumo: 'Músculo superficial da borda lateral do antebraço, exceção que confirma a regra da inervação.',
    localizacao: 'Da crista supracondilar lateral do úmero até o processo estiloide do rádio, formando o relevo lateral da fossa cubital.',
    funcao: 'Flexiona o cotovelo, sobretudo com o antebraço em posição neutra (como ao segurar uma caneca) e leva o antebraço à posição intermediária.',
    vascularizacao: 'Artéria radial recorrente.',
    inervacao: 'Nervo radial (C5–C6) — é flexor, mas é inervado pelo nervo dos extensores, o que o torna a exceção clássica cobrada em prova.',
    clinica: 'O reflexo braquiorradial (estilorradial) avalia C6. A inversão desse reflexo sugere lesão medular no nível C5–C6.',
    pontos: ['Flexor inervado pelo nervo radial — a exceção', 'Reflexo braquiorradial = C6', 'Relevo lateral da fossa cubital'],
  },
  {
    termos: ['Músculo Flexor Radial do Carpo', 'Músculo Palmar Longo', 'Músculo Flexor Ulnar do Carpo', 'Músculo Pronador Redondo'],
    resumo: 'Músculos da camada superficial do compartimento anterior do antebraço, com origem comum no epicôndilo medial.',
    localizacao: 'Da origem comum no epicôndilo medial até o carpo e a base dos metacarpos; seus tendões são visíveis à flexão resistida do punho.',
    funcao: 'Flexionam o punho, com desvio radial (flexor radial do carpo) ou ulnar (flexor ulnar do carpo); o pronador redondo prona o antebraço; o palmar longo tensiona a aponeurose palmar.',
    vascularizacao: 'Artérias ulnar e radial.',
    inervacao:
      'Nervo mediano para todos, exceto o flexor ulnar do carpo, que é do nervo ulnar — junto com a metade medial do flexor profundo dos dedos, é a dupla de exceções do compartimento anterior.',
    relacoes: 'O tendão do palmar longo (ausente em cerca de 15% das pessoas) é o reparo que aponta o nervo mediano logo abaixo dele.',
    clinica:
      'O tendão do palmar longo é o enxerto tendíneo de escolha por ser dispensável. O flexor radial do carpo delimita o local de punção da artéria radial. A síndrome do pronador comprime o mediano entre as cabeças do pronador redondo.',
    pontos: ['Origem comum no epicôndilo medial', 'Flexor ulnar do carpo é a exceção ulnar', 'Palmar longo: ausente em ~15% e enxerto de escolha'],
  },
  {
    termos: ['Músculo Flexor Superficial dos Dedos', 'Músculo Flexor Profundo dos Dedos', 'Músculo Flexor Longo do Polegar'],
    resumo: 'Flexores longos dos dedos, que passam pelo túnel do carpo até as falanges.',
    localizacao:
      'O flexor superficial ocupa a camada intermédia e se insere nas falanges médias; o profundo e o flexor longo do polegar ficam na camada profunda e alcançam as falanges distais.',
    funcao:
      'O superficial flexiona a interfalângica proximal; o profundo, a distal — e é o único que consegue fletir a interfalângica distal, o que permite testá-los separadamente à beira do leito.',
    vascularizacao: 'Artérias ulnar, radial e interóssea anterior.',
    inervacao:
      'Nervo mediano, exceto a metade medial do flexor profundo (4º e 5º dedos), que é do nervo ulnar. O flexor longo do polegar e a metade lateral do profundo recebem o nervo interósseo anterior.',
    clinica:
      'A lesão do nervo interósseo anterior abole o sinal do "OK" (incapacidade de fletir a interfalângica do polegar e a distal do indicador), sem déficit sensitivo. Os nove tendões desses músculos, com o mediano, atravessam o túnel do carpo.',
    pontos: [
      'Superficial → falange média; profundo → falange distal',
      'Metade medial do profundo é ulnar; o resto é mediano',
      'Sinal do "OK" testa o nervo interósseo anterior',
    ],
  },
  {
    termos: ['Músculo Extensor dos Dedos', 'Músculo Extensor Radial Longo do Carpo', 'Músculo Extensor Radial Curto do Carpo', 'Músculo Extensor Ulnar do Carpo', 'Músculo Extensor do Dedo Mínimo'],
    resumo: 'Músculos do compartimento posterior do antebraço, com origem comum no epicôndilo lateral.',
    localizacao: 'Da origem comum no epicôndilo lateral, descem pelo dorso do antebraço e passam sob o retináculo dos extensores em seis compartimentos.',
    funcao: 'Estendem o punho e os dedos; os extensores radiais fazem desvio radial e o ulnar do carpo, desvio ulnar.',
    vascularizacao: 'Artérias interóssea posterior e radial.',
    inervacao: 'Nervo radial e seu ramo interósseo posterior (C7–C8) — sem exceções neste compartimento.',
    clinica:
      'A epicondilite lateral envolve principalmente o extensor radial curto do carpo. A lesão alta do nervo radial produz mão caída; a lesão do interósseo posterior poupa a extensão do punho (o extensor radial longo é inervado antes) e a sensibilidade.',
    pontos: ['Origem comum no epicôndilo lateral', 'Todos inervados pelo radial/interósseo posterior', 'Mão caída na lesão radial alta'],
  },
  {
    termos: ['Músculo Abdutor Longo do Polegar', 'Músculo Extensor Curto do Polegar', 'Músculo Extensor Longo do Polegar'],
    resumo: 'Músculos do polegar que delimitam a tabaqueira anatômica.',
    localizacao:
      'Abdutor longo e extensor curto formam a borda lateral (anterior) da tabaqueira; o extensor longo do polegar, contornando o tubérculo dorsal do rádio, forma a borda medial (posterior).',
    funcao: 'Abduzem e estendem o polegar nas suas várias articulações.',
    inervacao: 'Nervo interósseo posterior (ramo profundo do radial).',
    relacoes: 'No assoalho da tabaqueira está o escafoide; nela cruzam a artéria radial e o ramo superficial do nervo radial.',
    clinica:
      'A tenossinovite de De Quervain acomete o abdutor longo e o extensor curto no primeiro compartimento extensor, com teste de Finkelstein positivo. Dor na tabaqueira após trauma sugere fratura do escafoide.',
    pontos: ['Delimitam a tabaqueira anatômica', 'De Quervain e teste de Finkelstein', 'Escafoide no assoalho, artéria radial cruzando'],
  },
  {
    termos: ['Músculos Lumbricais', 'Músculo Abdutor do Dedo Mínimo', 'Músculo Abdutor Curto do Polegar', 'Músculo Adutor do Polegar'],
    resumo: 'Musculatura intrínseca da mão, responsável pelos movimentos finos dos dedos.',
    localizacao: 'Entre os metacarpos (interósseos), originando-se dos tendões do flexor profundo (lumbricais) ou formando as eminências tenar e hipotenar.',
    funcao:
      'Interósseos dorsais abduzem e os palmares aduzem os dedos (DAB e PAD); lumbricais fletem as metacarpofalângicas e estendem as interfalângicas; a musculatura tenar faz a oposição do polegar.',
    vascularizacao: 'Arcos palmares superficial e profundo.',
    inervacao:
      'Nervo ulnar (ramo profundo) para quase toda a musculatura intrínseca; o mediano fica com os três músculos tenares (abdutor curto, flexor curto e oponente) e os dois lumbricais laterais.',
    clinica:
      'A lesão ulnar produz a mão em garra (hiperextensão das metacarpofalângicas e flexão das interfalângicas do 4º e 5º dedos) e o sinal de Froment. A lesão do mediano compromete a oposição e atrofia a eminência tenar — a "mão do pregador".',
    pontos: ['DAB e PAD: dorsais abduzem, palmares aduzem', 'Ulnar comanda quase todos os intrínsecos', 'Garra ulnar x mão do pregador (mediano)'],
  },
  {
    termos: ['Processo Coronoide'],
    resumo: 'Projeção anterior da ulna proximal, na mandíbula também o nome da lâmina que recebe o músculo temporal.',
    localizacao: 'Na ulna, forma a parede anterior da incisura troclear e se encaixa na fossa coronóidea do úmero na flexão máxima do cotovelo.',
    funcao: 'É o principal bloqueio ósseo contra o deslocamento posterior da ulna — o estabilizador que impede o cotovelo de escapar para trás.',
    clinica:
      'Sua fratura integra a "tríade terrível" do cotovelo, com luxação e fratura da cabeça do rádio, e a instabilidade resultante costuma exigir fixação. Perder mais de metade da altura do processo praticamente garante recidiva da luxação.',
    pontos: [
      'Trava o deslocamento posterior da ulna',
      'Tríade terrível: coronoide + cabeça do rádio + luxação',
      'Na mandíbula, recebe o tendão do temporal',
    ],
  },
  {
    termos: ['Falanges Proximais', 'Falanges Médias', 'Falanges Distais', 'Falanges'],
    classe: 'osso',
    resumo: 'Ossos dos dedos: três por dedo, exceto o polegar e o hálux, que têm duas.',
    localizacao: 'Distalmente aos metacarpos e metatarsos, articuladas em metacarpofalângicas/metatarsofalângicas e interfalângicas proximais e distais.',
    funcao: 'Formam as alavancas finais da preensão e da propulsão; a falange distal sustenta a polpa digital e a unha.',
    vascularizacao: 'Artérias digitais palmares e dorsais, que correm nas faces laterais do dedo.',
    inervacao: 'Nervos digitais próprios, também laterais — a razão de o bloqueio digital ser feito na base do dedo, dos dois lados.',
    clinica:
      'O dedo em martelo é a avulsão do extensor na base da falange distal; a lesão em botoeira acomete a bandeleta central na interfalângica proximal. O bloqueio digital nunca usa vasoconstritor, pelo risco de isquemia — as digitais são artérias terminais.',
    pontos: [
      '3 falanges por dedo; 2 no polegar e no hálux',
      'Bloqueio digital nas laterais da base',
      'Dedo em martelo x deformidade em botoeira',
    ],
  },
]
