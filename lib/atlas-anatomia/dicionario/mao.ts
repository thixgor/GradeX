import type { EntradaDicionario } from './tipos'

/**
 * Punho e mão.
 *
 * A mão é o órgão em que anatomia e função mais se confundem: aqui, um
 * milímetro de tendão fora do lugar é uma pinça que não fecha. As fichas desta
 * região insistem no gesto — o que essa estrutura permite fazer, e o que se
 * perde quando ela falha.
 */
export const MAO: EntradaDicionario[] = [
  /* ─────────────────── Carpo ─────────────────── */
  {
    termos: ['Ossos do Carpo'],
    classe: 'osso-carpal',
    resumo: 'Oito ossos curtos dispostos em duas fileiras entre o antebraço e os metacarpos.',
    localizacao:
      'Fileira proximal, de radial para ulnar: escafoide, semilunar, piramidal e pisiforme. Fileira distal: trapézio, trapezoide, capitato e hamato. Formam um arco côncavo para a frente, o sulco do carpo.',
    funcao:
      'O movimento do punho não acontece em uma articulação, e sim distribuído entre a radiocárpica e a mediocárpica, e entre os próprios ossos. A fileira proximal não tem nenhuma inserção tendínea própria — ela é um "segmento intercalado" que se acomoda passivamente, e é justamente essa liberdade que a torna instável.',
    vascularizacao: 'Arcos dorsais e palmares formados por ramos das artérias radial, ulnar e interósseas; a irrigação do escafoide e do semilunar é precária e retrógrada.',
    relacoes: 'O sulco do carpo é convertido em túnel do carpo pelo retináculo dos flexores, que se fixa no escafoide e trapézio, de um lado, e no pisiforme e hamato, do outro.',
    clinica:
      'Duas consequências dominam a clínica do carpo. A vascularização retrógrada do escafoide faz a fratura do seu polo proximal evoluir para necrose e pseudartrose. E a ausência de tendões na fileira proximal explica as instabilidades: rompido o ligamento escafossemilunar, o escafoide flete e o semilunar estende, produzindo o padrão DISI, visível na radiografia em perfil.',
    memoria:
      '"Se Sofia Piscar, Perde Também Todo Career Hoje": Escafoide, Semilunar, Piramidal, Pisiforme / Trapézio, Trapezoide, Capitato, Hamato — de radial para ulnar, fileira de cima e depois de baixo.',
    pontos: [
      'Quais são os oito ossos do carpo, em ordem?',
      'Por que a fileira proximal é chamada de segmento intercalado?',
      'Por que a fratura do escafoide tem risco de necrose?',
    ],
  },
  {
    termos: ['Capitato'],
    classe: 'osso-carpal',
    resumo: 'O maior osso do carpo, no centro geométrico do punho, em torno do qual todos os outros se movem.',
    localizacao: 'Centro da fileira distal, articulando-se com o semilunar em cima e com o 3º metacarpo embaixo; sua cabeça arredondada encaixa na concavidade escafossemilunar.',
    funcao:
      'É o eixo do punho: o centro de rotação de todos os movimentos do carpo passa pela cabeça do capitato. Por isso ele é a referência de qualquer artrodese parcial e o osso que se procura primeiro ao ler uma radiografia de punho.',
    vascularizacao: 'Suprimento predominantemente retrógrado, entrando pela porção distal — a cabeça é a região de risco.',
    relacoes: 'Articula-se com sete ossos: semilunar, escafoide, trapezoide, hamato e os metacarpos II, III e IV.',
    clinica:
      'A necrose avascular da cabeça do capitato é rara mas descrita, e segue a mesma lógica do escafoide. Nas luxações perilunares, a lesão progride em arco em torno do semilunar — o "arco maior" atravessa escafoide, capitato e piramidal, e é por isso que uma luxação do punho quase nunca vem sozinha.',
    memoria:
      '"Capitato" = com cabeça. A cabeça encaixa no semilunar e é o pivô de todo o punho. Ache o capitato e você se orienta na radiografia.',
    pontos: [
      'Por que o capitato é o eixo de rotação do punho?',
      'Com quantos ossos ele se articula?',
      'Como sua vascularização o expõe à necrose?',
    ],
  },
  {
    termos: ['Trapézio'],
    classe: 'osso-carpal',
    resumo: 'Osso em sela da fileira distal que sustenta o primeiro metacarpo e permite a oponência do polegar.',
    localizacao: 'Extremidade radial da fileira distal, entre o escafoide e o primeiro metacarpo; tem um tubérculo palmar e um sulco para o flexor radial do carpo.',
    funcao:
      'Sua superfície em sela é o que torna o polegar humano oponível: permite flexão-extensão, abdução-adução e, na combinação das duas, rotação axial. É a articulação que separa a mão humana da mão de qualquer outro primata em precisão.',
    vascularizacao:
      'Ramos da artéria radial e do arco palmar profundo, entrando pelas faces dorsal e palmar. Irrigação redundante, e por isso não sofre necrose avascular — ao contrário do escafoide, seu vizinho.',
    relacoes: 'O tendão do flexor radial do carpo corre num sulco próprio na sua face palmar; o retináculo dos flexores se prende ao seu tubérculo.',
    clinica:
      'A rizartrose — artrose da articulação trapeziometacarpal — é a artrose sintomática mais comum da mão, especialmente em mulheres após os 50 anos, com dor na base do polegar e perda da força de pinça. O teste de grind (compressão e rotação) reproduz a dor. Nos casos avançados, a trapeziectomia resolve o sintoma trocando estabilidade por alívio.',
    memoria:
      'Sela de cavalo: o metacarpo do polegar "monta" no trapézio. Sela permite girar; por isso só o polegar se opõe.',
    pontos: [
      'Que tipo de articulação o trapézio forma com o primeiro metacarpo?',
      'Por que essa forma permite a oponência?',
      'O que é rizartrose e como se testa?',
    ],
  },
  {
    termos: ['Trapezoide'],
    classe: 'osso-carpal',
    resumo: 'O menor osso da fileira distal, encravado entre o trapézio e o capitato, base do segundo metacarpo.',
    localizacao: 'Fileira distal, entre trapézio (radial) e capitato (ulnar), articulando-se com o escafoide acima e o 2º metacarpo abaixo.',
    funcao:
      'Forma, com o segundo metacarpo, uma articulação praticamente imóvel. Essa rigidez é proposital: os dedos indicador e médio são as colunas fixas da mão, contra as quais o polegar e os dedos móveis fazem força.',
    vascularizacao:
      'Ramos da rede carpal dorsal e do arco palmar profundo. É o menor osso da fileira distal e o mais protegido: encaixado entre trapézio e capitato, quase nunca fratura ou luxa isoladamente.',
    relacoes: 'Está profundamente encaixado, protegido pelos ossos vizinhos.',
    clinica:
      'É o osso do carpo que menos fratura e menos luxa, justamente por estar tão encaixado — sua lesão isolada indica trauma de altíssima energia. A rigidez do 2º e 3º raios é o que se procura preservar em qualquer reconstrução da mão: uma mão sem coluna central estável não faz pinça.',
    memoria:
      'A mão tem colunas fixas (2º e 3º metacarpos) e colunas móveis (polegar, anular e mínimo). O trapezoide é a base de uma coluna fixa.',
    pontos: [
      'Com que metacarpo o trapezoide se articula?',
      'Por que essa articulação é praticamente imóvel?',
      'Por que o trapezoide raramente é lesado?',
    ],
  },
  {
    termos: ['Piramidal'],
    classe: 'osso-carpal',
    resumo: 'Osso da fileira proximal no lado ulnar, que se articula com o disco triangular e recebe o pisiforme.',
    localizacao: 'Fileira proximal, medialmente ao semilunar; sua face palmar tem uma faceta oval para o pisiforme.',
    funcao:
      'Não toca a ulna diretamente: entre eles está a fibrocartilagem triangular. Articula-se com o hamato numa superfície helicoidal, e é esse encaixe que traduz o desvio ulnar do punho em extensão da fileira proximal.',
    vascularizacao:
      'Ramos da artéria ulnar e da rede carpal dorsal, entrando pela face dorsal — em cerca de 20% das pessoas por um único vaso, o que explica a pseudartrose ocasional das suas fraturas.',
    relacoes: 'O ligamento lunopiramidal o une ao semilunar; sua ruptura produz o padrão de instabilidade VISI.',
    clinica:
      'É o segundo osso do carpo que mais fratura, geralmente por avulsão dorsal em queda com o punho em extensão e desvio ulnar — a fratura aparece como uma pequena lasca dorsal no perfil, facilmente perdida. A dor ulnar do punho tem no piramidal e no complexo triangular seus dois suspeitos principais.',
    memoria:
      'Lado ulnar do punho doendo: pense em piramidal, no disco triangular e no pisiforme. Três estruturas vizinhas, três diagnósticos.',
    pontos: [
      'O piramidal se articula com a ulna? Por quê?',
      'Que osso repousa sobre sua face palmar?',
      'Qual o mecanismo típico da sua fratura?',
    ],
  },
  {
    termos: ['Ossos Metacarpais', 'Metacarpos'],
    classe: 'osso',
    resumo: 'Os cinco ossos longos da palma, que formam o esqueleto do dorso da mão e as articulações dos nós dos dedos.',
    localizacao:
      'Entre o carpo e as falanges; cada um tem base, corpo e cabeça. As cabeças formam os nós dos dedos, visíveis quando se fecha o punho.',
    funcao:
      'Sustentam os arcos da mão. O 2º e o 3º são fixos; o 4º e o 5º têm mobilidade crescente na sua carpometacarpal, e o 1º é livre — é essa gradação que permite a mão se "concavizar" para segurar objetos redondos.',
    vascularizacao: 'Arcos palmares e arco dorsal do carpo, por meio das artérias metacarpais.',
    relacoes: 'Os interósseos ocupam os espaços entre eles; o ligamento metacarpal transverso profundo une as cabeças do 2º ao 5º.',
    clinica:
      'A fratura do colo do 5º metacarpo é a fratura do boxeador, resultado de soco com o punho fechado, e tolera angulação de até 40° porque a carpometacarpal do 5º compensa — o mesmo desvio no 2º metacarpo seria inaceitável. A rotação, porém, nunca se tolera: qualquer sobreposição dos dedos ao fechar a mão exige correção.',
    memoria:
      'Angulação o 5º perdoa; rotação nenhum dedo perdoa. Peça ao paciente para fechar a mão: dedos que se cruzam significam cirurgia.',
    pontos: [
      'Que metacarpos são fixos e quais são móveis?',
      'O que é a fratura do boxeador e quanto desvio ela tolera?',
      'Por que a deformidade rotacional é sempre inaceitável?',
    ],
  },
  {
    termos: ['Falange Proximal do Polegar'],
    classe: 'osso',
    resumo: 'Primeira falange do polegar, que recebe os tendões dos músculos tenares e o extensor curto.',
    localizacao: 'Entre a cabeça do primeiro metacarpo e a falange distal; o polegar tem apenas duas falanges.',
    funcao:
      'Sua base recebe, na face palmar, o flexor curto e o abdutor curto (lateralmente) e o adutor do polegar (medialmente), e, no dorso, o extensor curto. É o ponto onde a força dos tenares se converte em pinça.',
    vascularizacao:
      'Artéria principal do polegar, ramo da radial, que se divide nas digitais próprias e emite ramos nutrícios para a diáfise.',
    relacoes: 'Dois ossos sesamoides costumam existir na face palmar da metacarpofalângica, dentro dos tendões tenares.',
    clinica:
      'A avulsão do ligamento colateral ulnar dessa articulação é o "polegar do esquiador" (agudo) ou "do guarda-caça" (crônico): perde-se a pinça lateral. Na lesão de Stener, a aponeurose do adutor se interpõe entre o ligamento roto e o osso, impedindo a cicatrização — e por isso essa lesão é cirúrgica, ao contrário da maioria das entorses.',
    memoria:
      'Polegar tem duas falanges, não três. E o ligamento que segura a pinça é o do lado de dentro: rompeu, a chave não gira mais.',
    pontos: [
      'Quantas falanges tem o polegar e por quê?',
      'Que músculos se inserem na base da falange proximal?',
      'O que é a lesão de Stener e por que ela é cirúrgica?',
    ],
  },
  {
    termos: ['Falange Distal do Polegar'],
    classe: 'osso',
    resumo: 'Última falange do polegar, larga e achatada, que sustenta a unha e a polpa digital.',
    localizacao: 'Extremidade do polegar, articulando-se com a falange proximal na interfalângica; sua tuberosidade alarga a ponta.',
    funcao:
      'Recebe o tendão do flexor longo do polegar na face palmar e o do extensor longo no dorso. É o segmento que aplica pressão na pinça de precisão.',
    vascularizacao:
      'Arcada terminal das artérias digitais próprias do polegar, na polpa. É a mesma arcada que nutre o leito ungueal, e sua interrupção produz necrose de ponta com perda da unha.',
    relacoes: 'A matriz ungueal repousa sobre sua face dorsal, e a polpa, densamente septada, está na palmar.',
    clinica:
      'A perda de sensibilidade da polpa do polegar equivale funcionalmente a perder metade da mão — daí o esforço para preservá-la em qualquer amputação. A rotura do flexor longo produz incapacidade de fletir a interfalângica: o polegar fica reto. E o panarício da polpa, por causa dos septos fibrosos, é uma infecção em compartimento fechado, que provoca dor desproporcional e exige drenagem precoce.',
    memoria:
      'O polegar vale metade da mão. E a polpa dele é um compartimento fechado: infecção ali não espera antibiótico oral.',
    pontos: [
      'Que tendões se inserem na falange distal do polegar?',
      'Por que o panarício da polpa exige drenagem precoce?',
      'Qual o impacto funcional de perder a sensibilidade do polegar?',
    ],
  },
  /* ─────────────────── Articulações do punho e da mão ─────────────────── */
  {
    termos: ['Articulação Radiocárpica'],
    classe: 'articulacao',
    resumo: 'Articulação elipsóidea entre o rádio, o disco triangular e a fileira proximal do carpo.',
    localizacao: 'Entre a face articular cárpica do rádio mais a fibrocartilagem triangular, acima, e o escafoide, o semilunar e o piramidal, abaixo.',
    funcao:
      'Permite flexão, extensão e desvios radial e ulnar — mas não rotação: a pronossupinação vem das radioulnares. Divide o movimento com a mediocárpica, e o desvio radial acontece quase todo na mediocárpica, porque o processo estiloide do rádio bloqueia o escafoide.',
    vascularizacao: 'Arcos dorsal e palmar do carpo, de ramos radiais, ulnares e interósseos.',
    inervacao: 'Ramos dos nervos interósseo anterior e posterior — a base anatômica da denervação parcial do punho para dor crônica.',
    relacoes: 'À frente, o túnel do carpo; atrás, os seis compartimentos extensores.',
    clinica:
      'É a articulação em que se instala a artrose pós-traumática após fratura do rádio distal e após a pseudartrose do escafoide (padrão SNAC) ou a instabilidade escafossemilunar crônica (padrão SLAC). A sequência de degeneração é previsível e orienta a cirurgia — outro exemplo de anatomia guiando conduta.',
    memoria:
      'O punho dobra na radiocárpica e na mediocárpica, mas não gira. Girar é papel do rádio em torno da ulna, mais acima.',
    pontos: [
      'Que ossos participam da articulação radiocárpica?',
      'Por que o punho não roda nessa articulação?',
      'O que são os padrões SLAC e SNAC?',
    ],
  },
  {
    termos: ['Articulação Radioulnar Distal'],
    classe: 'articulacao',
    resumo: 'Pivô entre a cabeça da ulna e a incisura ulnar do rádio, onde termina a pronossupinação.',
    localizacao: 'Entre a incisura ulnar do rádio e a circunferência articular da cabeça da ulna, com a fibrocartilagem triangular como assoalho.',
    funcao:
      'Funciona sempre em conjunto com a radioulnar proximal: o rádio gira em torno de um eixo que passa da fóvea da cabeça do rádio até a fóvea da cabeça da ulna. Um só eixo, duas articulações.',
    vascularizacao:
      'Artérias interósseas anterior e posterior e ramos da rede carpal palmar. O disco articular (fibrocartilagem triangular) é avascular no seu terço central e vascularizado apenas na periferia — motivo de as lesões centrais não cicatrizarem e serem apenas desbridadas, enquanto as periféricas se suturam.',
    inervacao:
      'Ramo interósseo posterior do nervo radial e ramo interósseo anterior do mediano, ambos puramente proprioceptivos nesta altura. Sua secção — a denervação do punho — alivia a dor sem perder força, e é uma cirurgia real de salvamento na artrose do punho.',
    relacoes: 'O complexo da fibrocartilagem triangular — disco, ligamentos radioulnares dorsal e palmar, bainha do extensor ulnar do carpo — é o estabilizador principal.',
    clinica:
      'Sua instabilidade é subdiagnosticada e responde por boa parte da dor ulnar do punho após fratura do rádio distal. Testa-se pela manobra da tecla de piano, comparando com o lado contralateral. A lesão de Galeazzi (fratura do rádio distal com luxação radioulnar distal) é chamada "fratura da necessidade" porque exige fixação — o tratamento conservador falha sempre.',
    memoria:
      'Duas articulações, um só eixo, um só movimento. Lesou uma, a outra deixa de funcionar direito.',
    pontos: [
      'Onde passa o eixo da pronossupinação?',
      'Que estrutura estabiliza a radioulnar distal?',
      'Por que a lesão de Galeazzi é chamada fratura da necessidade?',
    ],
  },
  {
    termos: ['Articulação Carpometacarpal do Polegar (entre o osso trapézio e o primeiro metacarpo)'],
    classe: 'articulacao',
    resumo: 'Articulação selar entre trapézio e primeiro metacarpo — a articulação que faz a mão humana ser humana.',
    localizacao: 'Base do polegar, entre a superfície em sela do trapézio e a base recíproca do 1º metacarpo.',
    funcao:
      'A geometria em sela permite dois eixos de movimento e, na combinação deles, uma rotação axial de cerca de 90°. É o que traz a polpa do polegar para a frente das polpas dos outros dedos: a oponência.',
    vascularizacao: 'Ramos da artéria radial, que cruza a tabaqueira anatômica logo acima.',
    inervacao: 'Ramos dos nervos radial, mediano e musculocutâneo.',
    relacoes: 'O ligamento oblíquo anterior (beak ligament) é o estabilizador principal contra a subluxação dorsorradial.',
    clinica:
      'A frouxidão do ligamento oblíquo anterior é o evento inicial da rizartrose: o metacarpo subluxa dorsalmente e a cartilagem se desgasta na borda palmar. Por isso a doença é mais comum em mulheres, com maior frouxidão ligamentar. Em estágios iniciais, órtese e fortalecimento resolvem; em avançados, trapeziectomia com ou sem suspensão.',
    memoria:
      'Sela permite dobrar, abrir e — na combinação — girar. Sem esse giro não há oponência, e sem oponência não há pinça.',
    pontos: [
      'Que forma articular permite a oponência do polegar?',
      'Qual o principal ligamento estabilizador?',
      'Como se inicia a rizartrose?',
    ],
  },
  {
    termos: ['Articulações Metacarpofalângicas'],
    classe: 'articulacao',
    resumo: 'Articulações condilares entre as cabeças dos metacarpos e as bases das falanges proximais — os nós dos dedos.',
    localizacao: 'Entre a cabeça de cada metacarpo e a base da falange proximal correspondente, com placa volar à frente e capuz extensor atrás.',
    funcao:
      'Permitem flexão, extensão, abdução e adução. Mas há um detalhe decisivo: a cabeça do metacarpo é mais larga na frente do que atrás, o que faz os ligamentos colaterais ficarem frouxos em extensão e tensos em flexão. Por isso os dedos só se abrem com a mão estendida.',
    vascularizacao:
      'Artérias metacarpais palmares e dorsais, com ramos das digitais próprias formando um anel periarticular.',
    inervacao:
      'Nervos digitais palmares do mediano e do ulnar e digitais dorsais do radial e do ulnar. São articulações condilares que fazem flexão, extensão e abdução — mas só em extensão: fletidas, os ligamentos colaterais tensionam e a abdução desaparece, e é por isso que a mão é imobilizada com as metacarpofalângicas fletidas a 70 graus.',
    relacoes: 'O ligamento metacarpal transverso profundo une as placas volares do 2º ao 5º dedo.',
    clinica:
      'Essa mecânica dita a posição de imobilização da mão — a "posição intrínseca plus", com metacarpofalângicas em 70–90° de flexão e interfalângicas estendidas. Imobilizar com as MCF estendidas encurta os colaterais e produz rigidez permanente em extensão, um erro clássico e evitável.',
    memoria:
      'Cabeça em came: colateral frouxo esticado, tenso dobrado. Imobilize a mão sempre com os nós dobrados, ou ela endurece aberta.',
    pontos: [
      'Por que os dedos só se afastam com a mão estendida?',
      'Qual a posição correta de imobilização da mão e por quê?',
      'Que estrutura une as placas volares entre si?',
    ],
  },
  {
    termos: ['Articulação Metacarpofalângica do Polegar'],
    classe: 'articulacao',
    resumo: 'Articulação em dobradiça na base do polegar, com dois sesamoides palmares e colaterais fortes.',
    localizacao: 'Entre a cabeça do 1º metacarpo e a base da falange proximal do polegar; sua amplitude de flexão varia muito entre indivíduos.',
    funcao:
      'Contribui pouco com movimento e muito com estabilidade: é o batente contra o qual a pinça faz força. Os sesamoides, dentro dos tendões tenares, aumentam o braço de alavanca da flexão.',
    vascularizacao: 'Artéria principal do polegar e ramos da radial.',
    inervacao:
      'Ramos do nervo mediano e do radial. Sua estabilidade depende do ligamento colateral ulnar, cuja rotura é o polegar do esquiador — e cuja lesão de Stener, em que a aponeurose do adutor se interpõe entre os cotos, impede a cicatrização e obriga à cirurgia.',
    relacoes: 'A aponeurose do adutor do polegar cobre o colateral ulnar — relação decisiva na lesão de Stener.',
    clinica:
      'É a articulação do polegar do esquiador. O teste é o estresse em valgo comparativo, e a suspeita de interposição da aponeurose (lesão de Stener) indica cirurgia. Instabilidade crônica dessa articulação inviabiliza a pinça lateral, o gesto de virar uma chave.',
    memoria:
      'É o batente da pinça, não a dobradiça do movimento. Batente frouxo = chave que não gira.',
    pontos: [
      'Qual a principal função dessa articulação?',
      'Que estruturas aumentam o braço de alavanca da flexão?',
      'Como se testa a instabilidade do colateral ulnar?',
    ],
  },
  {
    termos: ['Articulações Interfalângicas Proximais'],
    classe: 'articulacao',
    resumo: 'Dobradiças puras entre as falanges proximal e média, com estabilidade em três lados.',
    localizacao: 'Entre a cabeça da falange proximal e a base da média, nos quatro dedos longos.',
    funcao:
      'Movem-se em um só plano. Sua estabilidade vem de uma "caixa": os dois colaterais nas laterais e a placa volar à frente, que impede a hiperextensão. É a articulação mais importante para a preensão — cerca de 85% do arco de movimento útil do dedo passa por ela.',
    vascularizacao:
      'Ramos das artérias digitais palmares próprias, que formam arcadas transversais ao nível de cada articulação.',
    inervacao:
      'Nervos digitais palmares próprios e dorsais. É a articulação que mais enrijece de toda a mão, porque sua placa volar retrai com facilidade — e a razão de a imobilização das interfalângicas ser sempre em extensão, ao contrário das metacarpofalângicas.',
    relacoes: 'A banda central do aparelho extensor se insere na base da falange média; as bandas laterais correm nas laterais.',
    clinica:
      'Duas deformidades clássicas nascem aqui. A lesão da banda central produz o dedo em botoeira: a IFP fica fletida e a distal estendida, porque as bandas laterais escorregam para baixo do eixo. E a rigidez em flexão da IFP é a mais difícil de recuperar da mão inteira — por isso ela nunca é imobilizada por muito tempo.',
    memoria:
      'Botoeira: a IFP "passa pelo buraco do botão" formado pelas bandas laterais. Se você entendeu essa imagem, entendeu a deformidade.',
    pontos: [
      'Que estruturas estabilizam a articulação interfalângica proximal?',
      'O que é o dedo em botoeira e como ele se forma?',
      'Por que essa articulação não pode ficar imobilizada por muito tempo?',
    ],
  },
  {
    termos: ['Articulações Interfalângicas Distais'],
    classe: 'articulacao',
    resumo: 'Dobradiças terminais dos dedos, movidas apenas pelo flexor profundo e pelo tendão terminal extensor.',
    localizacao: 'Entre a cabeça da falange média e a base da distal, nos quatro dedos longos.',
    funcao: 'Ajustam a ponta do dedo ao objeto; contribuem com pouca amplitude, mas são decisivas na pinça de precisão e no toque fino.',
    vascularizacao: 'Arcadas terminais das artérias digitais próprias, que se anastomosam na polpa.',
    inervacao:
      'Ramos terminais dos nervos digitais palmares próprios. É a articulação acometida pelos nódulos de Heberden na osteoartrite — e a que a artrite reumatoide caracteristicamente poupa, distinção que se faz à inspeção, antes de qualquer exame.',
    relacoes: 'O tendão terminal do aparelho extensor insere-se na base dorsal da falange distal; o flexor profundo, na base palmar.',
    clinica:
      'A avulsão do tendão terminal produz o dedo em martelo, com queda da ponta do dedo — trata-se com órtese em extensão contínua por 6 a 8 semanas, e qualquer flexão nesse período reinicia a contagem. Já a avulsão do flexor profundo é o "jersey finger", típico de quem agarra a camisa de um adversário, e essa é cirúrgica.',
    memoria:
      'Martelo cai (extensor de fora); jersey não dobra (flexor de dentro). Duas avulsões opostas na mesma articulação.',
    pontos: [
      'Que tendões movem a articulação interfalângica distal?',
      'O que é o dedo em martelo e como se trata?',
      'O que é o jersey finger?',
    ],
  },
  {
    termos: ['Articulação Interfalângica do Polegar'],
    classe: 'articulacao',
    resumo: 'Única interfalângica do polegar, movida pelo flexor e pelo extensor longos.',
    localizacao: 'Entre a falange proximal e a distal do polegar.',
    funcao: 'Permite fletir a ponta do polegar contra a do indicador; a flexão depende exclusivamente do flexor longo do polegar.',
    vascularizacao: 'Ramos terminais da artéria principal do polegar.',
    inervacao:
      'Nervos digitais próprios do mediano. É uma articulação em dobradiça pura, e sua rigidez pouco compromete a função — ao contrário da trapeziometacarpal, cuja artrose incapacita a pinça.',
    relacoes: 'O tendão do extensor longo do polegar se insere na sua base dorsal.',
    clinica:
      'A incapacidade de fletir essa articulação, com o "sinal do O" alterado, é o achado da síndrome do interósseo anterior — uma neuropatia puramente motora, sem alteração de sensibilidade, que costuma ser confundida com rotura tendínea. A distinção se faz pelo efeito tenodese: no nervo, o tendão está íntegro e o dedo se move passivamente com o punho.',
    memoria:
      'Peça o gesto de "OK". Se o O virou um triângulo, é interósseo anterior — nervo, não tendão.',
    pontos: [
      'Que músculo flete a interfalângica do polegar?',
      'O que é o sinal do O e o que ele avalia?',
      'Como distinguir lesão nervosa de rotura tendínea?',
    ],
  },
  /* ─────────────────── Músculos e tendões da mão ─────────────────── */
  {
    termos: ['Músculos Tenares'],
    classe: 'musculo',
    resumo: 'Os três músculos da eminência tenar, que posicionam o polegar para a pinça.',
    localizacao:
      'Eminência tenar, na base do polegar: abdutor curto (superficial), flexor curto (medial a ele) e oponente do polegar (profundo). O adutor do polegar, apesar do nome, pertence ao compartimento adutor, não ao tenar.',
    funcao:
      'Levam o polegar para fora do plano da palma e o rodam. A oponência não é um movimento simples: é abdução, flexão e rotação medial combinadas, e cada um dos três contribui com uma parte.',
    vascularizacao: 'Artéria principal do polegar, ramo do arco palmar profundo, e ramos da radial.',
    inervacao:
      'Ramo recorrente do nervo mediano (C8–T1) — que é o alvo cirúrgico mais delicado da mão. A cabeça profunda do flexor curto costuma ser ulnar.',
    relacoes: 'O ramo recorrente emerge do mediano logo distalmente ao retináculo, na chamada "área proibida" da palma.',
    clinica:
      'A compressão crônica do mediano no túnel do carpo atrofia a eminência tenar e produz a mão do pregador, com o polegar caindo no plano da palma e incapacidade de oponência. A "área proibida" é assim chamada porque uma incisão palmar transversal ali secciona o ramo recorrente e destrói a oponência de forma permanente.',
    memoria:
      'A eminência tenar afundada é a assinatura do túnel do carpo avançado. Olhe as duas mãos lado a lado: a diferença salta aos olhos.',
    pontos: [
      'Quais músculos formam a eminência tenar?',
      'Que nervo os inerva e onde ele é vulnerável?',
      'Que movimentos compõem a oponência?',
    ],
  },
  {
    termos: ['Músculos Hipotenares'],
    classe: 'musculo',
    resumo: 'Os três músculos da eminência hipotenar, que dão profundidade à concavidade da palma.',
    localizacao:
      'Borda ulnar da palma: abdutor do dedo mínimo, flexor curto do dedo mínimo e oponente do dedo mínimo, do superficial ao profundo. O palmar curto, cutâneo, é o quarto e mais superficial.',
    funcao:
      'Abduzem, fletem e opõem o dedo mínimo, aprofundando o arco transverso distal da mão. É esse aprofundamento que permite segurar objetos cilíndricos com firmeza — a preensão de força.',
    vascularizacao: 'Ramos da artéria ulnar e do arco palmar profundo.',
    inervacao: 'Ramo profundo do nervo ulnar (C8–T1), que entra pelo canal de Guyon.',
    relacoes: 'O ramo profundo do ulnar contorna o hâmulo do hamato para alcançá-los.',
    clinica:
      'Sua atrofia é o sinal mais precoce da compressão ulnar em Guyon ou no cotovelo, e costuma passar despercebida — compare sempre as duas mãos. O sinal de Wartenberg, com o dedo mínimo abduzido em repouso, indica fraqueza dos interósseos palmares e é achado precoce da mesma neuropatia.',
    memoria:
      'Mediano faz a tenar, ulnar faz a hipotenar. Duas eminências, dois nervos, dois padrões de atrofia.',
    pontos: [
      'Quais músculos formam a eminência hipotenar?',
      'Que nervo os inerva?',
      'O que é o sinal de Wartenberg?',
    ],
  },
  {
    termos: ['Músculo Flexor Curto do Polegar'],
    classe: 'musculo',
    resumo: 'Músculo tenar de dupla origem e dupla inervação, que flete o polegar na metacarpofalângica.',
    localizacao: 'Eminência tenar, com cabeça superficial (do retináculo dos flexores e do trapézio) e cabeça profunda (do trapezoide e do capitato), inserindo-se no sesamoide lateral e na base da falange proximal.',
    funcao: 'Flete a metacarpofalângica do polegar e participa da oponência. As duas cabeças formam um túnel por onde passa o tendão do flexor longo do polegar.',
    vascularizacao: 'Ramos da artéria radial e do arco palmar superficial.',
    inervacao: 'Cabeça superficial pelo ramo recorrente do mediano; cabeça profunda pelo ramo profundo do ulnar — uma das poucas duplas inervações constantes do corpo.',
    relacoes: 'Está entre o abdutor curto, lateralmente, e o adutor do polegar, medialmente.',
    clinica:
      'Essa dupla inervação explica por que a flexão do polegar pode persistir parcialmente mesmo com lesão completa do mediano na altura do punho, o que às vezes confunde o examinador. Testar oponência — e não flexão — é o modo confiável de avaliar o mediano distal.',
    memoria:
      'Duas cabeças, dois nervos: superficial é do mediano, profunda é do ulnar. É a exceção que aparece em toda prova de neuroanatomia da mão.',
    pontos: [
      'Qual a dupla inervação do flexor curto do polegar?',
      'Que tendão passa entre suas duas cabeças?',
      'Por que testar oponência é melhor que testar flexão?',
    ],
  },
  {
    termos: ['Músculos Interósseos Dorsais'],
    classe: 'musculo',
    resumo: 'Quatro músculos bipenados entre os metacarpos que afastam os dedos da linha média da mão.',
    localizacao:
      'Nos quatro espaços intermetacarpais, cada um nascendo das faces adjacentes de dois metacarpos e inserindo-se na base da falange proximal e no capuz extensor. O primeiro é o mais volumoso, entre o polegar e o indicador.',
    funcao:
      'Abduzem os dedos em relação ao eixo do dedo médio (DAB — dorsal abduz) e, por se inserirem no capuz extensor, também fletem as metacarpofalângicas e estendem as interfalângicas.',
    vascularizacao: 'Arco palmar profundo e artérias metacarpais dorsais.',
    inervacao: 'Ramo profundo do nervo ulnar (C8–T1).',
    relacoes: 'O primeiro interósseo dorsal é atravessado pela artéria radial, que passa do dorso para a palma entre suas duas cabeças.',
    clinica:
      'O primeiro interósseo dorsal é o músculo-sentinela do nervo ulnar: sua atrofia produz um afundamento visível no dorso do primeiro espaço, o sinal mais precoce e mais fácil de ver de uma neuropatia ulnar. O sinal de Froment — flexão da interfalângica do polegar ao segurar um papel — nasce da fraqueza do adutor, do mesmo nervo.',
    memoria:
      'DAB e PAD: Dorsais ABduzem, Palmares ADuzem. E o primeiro dorsal, entre polegar e indicador, é o "termômetro" do nervo ulnar.',
    pontos: [
      'Qual a ação dos interósseos dorsais?',
      'Que nervo os inerva?',
      'Por que o primeiro interósseo dorsal é sentinela da neuropatia ulnar?',
    ],
  },
  {
    termos: ['Aponeurose Palmar'],
    classe: 'fascia',
    resumo: 'Lâmina fibrosa triangular sob a pele da palma, que ancora a pele e protege os tendões.',
    localizacao:
      'Do retináculo dos flexores e do tendão do palmar longo, no ápice, abrindo-se em quatro bandas longitudinais que vão até a base dos dedos e se continuam nas bainhas digitais.',
    funcao:
      'Fixa a pele da palma ao esqueleto, impedindo que ela deslize sobre os tendões ao segurar objetos — é o que torna a preensão firme. E protege os tendões flexores e os feixes neurovasculares subjacentes.',
    relacoes: 'Sob ela correm os arcos palmares e os nervos digitais; entre suas bandas emergem os feixes para os dedos.',
    clinica:
      'É a estrutura que se retrai na doença de Dupuytren, produzindo cordas palpáveis e contratura em flexão progressiva dos dedos, mais comum no anular e no mínimo, em homens de ascendência do norte europeu. O teste da mesa — não conseguir apoiar a palma inteiramente sobre uma superfície plana — é o critério prático de indicação cirúrgica.',
    memoria:
      'A palma não desliza porque a pele está amarrada ao osso. Quando essa amarra encolhe, o dedo fecha e não abre mais: Dupuytren.',
    pontos: [
      'Qual a função mecânica da aponeurose palmar?',
      'O que é a doença de Dupuytren e quais dedos ela atinge mais?',
      'O que é o teste da mesa?',
    ],
  },
  {
    termos: ['Tendão do Músculo Flexor Superficial dos Dedos'],
    classe: 'tendao',
    resumo: 'Tendão que se divide em duas bandas na base do dedo para deixar passar o flexor profundo.',
    localizacao:
      'Desce pelo túnel do carpo em dois planos (III e IV superficiais, II e V profundos), entra na bainha digital, divide-se no quiasma de Camper e insere-se nas laterais da falange média.',
    funcao:
      'Flete a articulação interfalângica proximal. Seu tendão se abre em Y para permitir que o profundo, que estava por baixo, passe para a frente e alcance a falange distal — uma solução mecânica elegante para dois tendões no mesmo canal.',
    vascularizacao: 'Vínculas, pequenas pregas vasculares que chegam pela face dorsal do tendão dentro da bainha.',
    inervacao: 'Nervo mediano (C7–T1).',
    relacoes: 'Corre com o profundo dentro da bainha sinovial digital, contido pelas polias anulares A1 a A5.',
    clinica:
      'A zona II da mão — da prega palmar distal à inserção do superficial — é a "terra de ninguém" de Bunnell: dois tendões num túnel apertado, onde a aderência pós-operatória é a regra e não a exceção. Testa-se o superficial bloqueando os outros dedos em extensão e pedindo flexão da IFP, manobra que anula o profundo, que tem ventre comum.',
    memoria:
      'Superficial vira profundo e profundo vira superficial. Eles trocam de lugar dentro do dedo — e por isso um se abre em Y.',
    pontos: [
      'Onde o flexor superficial se insere?',
      'O que é o quiasma de Camper?',
      'Por que a zona II é chamada terra de ninguém?',
    ],
  },
  {
    termos: ['Tendão do Músculo Flexor Longo do Polegar'],
    classe: 'tendao',
    resumo: 'Único tendão flexor longo do polegar, com bainha sinovial própria que atravessa o punho.',
    localizacao: 'Do antebraço, passa pelo túnel do carpo na sua bainha radial, corre entre as duas cabeças do flexor curto e insere-se na base da falange distal.',
    funcao: 'Flete a interfalângica e auxilia a flexão da metacarpofalângica e da carpometacarpal do polegar. É o motor da força de pinça.',
    vascularizacao: 'Artéria interóssea anterior e ramos da radial.',
    inervacao: 'Nervo interósseo anterior, ramo do mediano (C7–C8).',
    relacoes: 'Sua bainha (bursa radial) comunica-se frequentemente com a bursa ulnar dos demais flexores no punho.',
    clinica:
      'Essa comunicação explica a infecção "em ferradura", em que uma tenossinovite purulenta do polegar atravessa o punho e alcança o dedo mínimo. Os sinais de Kanavel — dedo em flexão, tumefação fusiforme, dor à extensão passiva e dor ao longo da bainha — indicam drenagem cirúrgica de urgência, não antibiótico isolado.',
    memoria:
      'Bursa radial do polegar e ulnar do mínimo se dão as mãos no punho. Infecção num, dias depois no outro: infecção em ferradura.',
    pontos: [
      'Onde o flexor longo do polegar se insere?',
      'Que nervo o inerva?',
      'Quais são os sinais de Kanavel e o que indicam?',
    ],
  },
  {
    termos: ['Tendão do Músculo Flexor Ulnar do Carpo'],
    classe: 'tendao',
    resumo: 'Tendão flexor mais ulnar do punho, que se insere no pisiforme e é o guia do nervo ulnar.',
    localizacao: 'Desce na borda ulnar do antebraço e insere-se no pisiforme, continuando nos ligamentos pisi-hamato e pisimetacarpal até o hamato e o 5º metacarpo.',
    funcao:
      'Flete e faz o desvio ulnar do punho. O pisiforme funciona como sesamoide dentro do seu tendão, aumentando o braço de alavanca — a mesma solução mecânica da patela no joelho.',
    vascularizacao: 'Artéria ulnar.',
    inervacao: 'Nervo ulnar (C7–T1) — é o único flexor do antebraço inervado por ele, junto com metade do flexor profundo.',
    relacoes: 'A artéria e o nervo ulnares correm imediatamente radiais a ele em todo o antebraço distal — é o guia cirúrgico do feixe.',
    clinica:
      'Achar esse tendão é achar o nervo ulnar: em qualquer exploração do punho ulnar, ele é o primeiro reparo. Sua tendinite, com dor no pisiforme, é frequente em quem faz apoio de punho, e a calcificação do tendão é achado radiográfico comum nesses quadros.',
    memoria:
      'Siga o flexor ulnar do carpo e você encontra o nervo ulnar do lado do polegar dele. Um tendão que serve de mapa.',
    pontos: [
      'Onde se insere o flexor ulnar do carpo?',
      'Que papel o pisiforme desempenha nesse tendão?',
      'Por que ele é o guia do nervo ulnar?',
    ],
  },
  {
    termos: ['Tendões dos Músculos Extensores dos Dedos', 'Tendão do Músculo Extensor dos Dedos'],
    classe: 'tendao',
    resumo: 'Quatro tendões que se abrem no dorso dos dedos formando o capuz extensor.',
    localizacao: 'Do quarto compartimento extensor até o dorso dos dedos, unidos entre si pelas conexões intertendíneas no dorso da mão.',
    funcao:
      'Estendem as metacarpofalângicas diretamente. A extensão das interfalângicas, porém, não é feita por eles sozinhos: depende dos lumbricais e interósseos, que se inserem no mesmo capuz. É por isso que a mão em garra da lesão ulnar tem MCF estendidas e IF fletidas.',
    vascularizacao: 'Rede dorsal do carpo e artérias metacarpais dorsais.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'O capuz extensor recebe a banda central para a falange média e as bandas laterais para a distal.',
    clinica:
      'Ferimentos dorsais dos dedos exigem exame cuidadoso da banda central: uma lesão parcial que passa despercebida se transforma em botoeira semanas depois. E a subluxação ulnar dos tendões extensores sobre as cabeças metacarpais é sinal característico da mão reumatoide.',
    memoria:
      'O extensor longo estende o nó do dedo; os pequenos músculos intrínsecos estendem as pontas. Divisão de trabalho que a garra ulnar denuncia.',
    pontos: [
      'Que articulação os extensores longos estendem diretamente?',
      'Quem estende as interfalângicas e por quê?',
      'Que deformidade a lesão da banda central produz?',
    ],
  },
  {
    termos: ['Conexões Intertendíneas'],
    classe: 'tendao',
    resumo: 'Bandas oblíquas que unem os tendões extensores entre si no dorso da mão.',
    localizacao: 'No dorso da mão, próximo às cabeças dos metacarpos, ligando os tendões do extensor dos dedos uns aos outros.',
    funcao:
      'Distribuem a tração entre os tendões e limitam a extensão independente dos dedos. São a razão de você não conseguir estender o anular sozinho com os outros dedos fletidos — a conexão o prende ao médio e ao mínimo.',
    vascularizacao:
      'Rede dorsal do carpo e ramos da interóssea posterior, por vasos delgados no paratendão. Essas bandas ligam os tendões extensores entre si sobre os metacarpos, e é por causa delas que a secção isolada de um tendão extensor proximal ainda permite alguma extensão do dedo — armadilha que faz uma lesão parcial parecer íntegra no exame.',
    relacoes: 'São mais fortes entre o 3º, 4º e 5º dedos; entre o indicador e o médio costumam ser tênues, o que dá ao indicador maior independência.',
    clinica:
      'Elas mascaram roturas: um tendão extensor seccionado proximalmente às conexões pode manter alguma extensão passiva do dedo, retardando o diagnóstico. Diante de uma ferida no dorso da mão, testa-se cada dedo isoladamente e contra resistência, nunca em conjunto.',
    memoria:
      'Tente estender só o anular com os outros dobrados: não vai. A culpa é dessas bandas — e é por elas que uma rotura pode se esconder.',
    pontos: [
      'Que efeito funcional as conexões intertendíneas produzem?',
      'Por que o indicador é mais independente?',
      'Como elas podem mascarar uma rotura tendínea?',
    ],
  },
  {
    termos: ['Tendão do Músculo Extensor do Indicador'],
    classe: 'tendao',
    resumo: 'Tendão próprio do indicador, situado sempre ulnarmente ao tendão comum.',
    localizacao: 'Quarto compartimento extensor, unindo-se ao capuz extensor do indicador; sua posição ulnar em relação ao comum é constante.',
    funcao: 'Estende o indicador de forma independente, permitindo apontar.',
    vascularizacao:
      'Artéria interóssea posterior e rede dorsal do carpo. Corre no quarto compartimento, medialmente ao extensor dos dedos, e é o tendão de escolha para transferência quando o extensor longo do polegar rompe — porque o indicador tem dois extensores e sobrevive bem com um.',
    relacoes: 'Seu ventre muscular é o mais distal do dorso do antebraço, o que permite reconhecê-lo em cirurgia.',
    clinica:
      'É o tendão doador padrão para transferência ao extensor longo do polegar após rotura — a cirurgia mais comum de transferência tendínea da mão. A posição sempre ulnar é o que permite identificá-lo com segurança no dorso do dedo.',
    memoria: 'Do lado ulnar do tendão comum, sempre. Regra fixa que resolve a identificação em segundos.',
    pontos: [
      'Onde corre o tendão do extensor do indicador?',
      'Qual sua principal aplicação cirúrgica?',
      'Como identificá-lo em cirurgia?',
    ],
  },
  {
    termos: ['Tendão do Músculo Extensor do Dedo Mínimo'],
    classe: 'tendao',
    resumo: 'Tendão do quinto compartimento extensor, que dá extensão independente ao dedo mínimo.',
    localizacao: 'Quinto compartimento, sobre a articulação radioulnar distal, dividindo-se frequentemente em duas bandas antes do capuz.',
    funcao: 'Estende o dedo mínimo isoladamente, permitindo o gesto de separar o dedo dos demais.',
    vascularizacao:
      'Artéria interóssea posterior e rede dorsal do carpo. Ocupa sozinho o quinto compartimento extensor, sobre a articulação radioulnar distal — posição que o torna o primeiro a romper na artrite reumatoide, pelo atrito com a cabeça da ulna.',
    relacoes: 'Sua posição sobre a radioulnar distal o torna vulnerável nas cirurgias dessa articulação.',
    clinica:
      'É o primeiro tendão a romper na mão reumatoide, por atrito com a cabeça da ulna dorsalmente subluxada — a rotura em cascata de Vaughan-Jackson começa por ele e progride para o anular e o médio. A perda da extensão do dedo mínimo em um paciente com artrite reumatoide é, portanto, um sinal de alerta cirúrgico.',
    memoria:
      'Na mão reumatoide, os tendões caem em fila indiana do lado ulnar para o radial. O mínimo é o primeiro a tombar.',
    pontos: [
      'Em que compartimento corre esse tendão?',
      'Por que ele é o primeiro a romper na artrite reumatoide?',
      'O que é a rotura em cascata de Vaughan-Jackson?',
    ],
  },
  {
    termos: ['Tendão do Músculo Extensor Radial Longo do Carpo'],
    classe: 'tendao',
    resumo: 'Tendão do segundo compartimento que estende e desvia radialmente o punho, inserindo-se no 2º metacarpo.',
    localizacao: 'Segundo compartimento extensor, radialmente ao tubérculo dorsal, até a base do 2º metacarpo.',
    funcao:
      'Estende e faz desvio radial do punho. Como é o único extensor do punho inervado pelo nervo radial antes da divisão em interósseo posterior, ele permanece funcionante nas lesões do interósseo posterior.',
    vascularizacao:
      'Artéria radial e rede dorsal do carpo. Divide o segundo compartimento extensor com o curto, e o cruzamento dos tendões do primeiro compartimento sobre eles é o que produz a síndrome da intersecção, com crepitação palpável no antebraço distal.',
    inervacao: 'Nervo radial, ramo direto (C6–C7).',
    relacoes: 'Corre com o extensor radial curto sob o abdutor longo e o extensor curto do polegar, que os cruzam obliquamente.',
    clinica:
      'É essa inervação precoce que explica a dissociação da síndrome do interósseo posterior: o paciente não estende os dedos, mas estende o punho — em desvio radial, porque só o radial longo funciona. Reconhecer esse padrão evita confundir a lesão com uma paralisia radial alta.',
    memoria:
      'Punho que sobe torto para o lado do polegar = interósseo posterior. Punho que não sobe = radial lá em cima.',
    pontos: [
      'Onde se insere o extensor radial longo do carpo?',
      'Por que ele é poupado na lesão do interósseo posterior?',
      'Que sinal clínico essa preservação produz?',
    ],
  },
  {
    termos: ['Tendão do Músculo Extensor Radial Curto do Carpo'],
    classe: 'tendao',
    resumo: 'Companheiro do radial longo no segundo compartimento, inserindo-se na base do 3º metacarpo.',
    localizacao: 'Segundo compartimento extensor, medialmente ao radial longo, até a base do 3º metacarpo.',
    funcao: 'Extensor puro do punho: como se insere no 3º metacarpo, que está no eixo da mão, ele estende sem desviar. É o principal estabilizador do punho durante a preensão.',
    vascularizacao:
      'Artéria interóssea posterior e artéria radial, pela rede dorsal do carpo. Sua origem no epicôndilo lateral tem uma zona hipovascular na face profunda — e é ali, e não no tendão inteiro, que começa a epicondilite lateral.',
    inervacao: 'Ramo profundo do nervo radial (C7–C8).',
    relacoes: 'Sua origem no epicôndilo lateral é a mais profunda do tendão extensor comum.',
    clinica:
      'É a origem do extensor radial curto que degenera na epicondilite lateral, o cotovelo de tenista — que não é inflamação, e sim tendinose angiofibroblástica. O músculo é tensionado toda vez que se estabiliza o punho para pegar um objeto, o que explica por que a dor aparece ao segurar uma xícara.',
    memoria:
      'Longo vai no 2º metacarpo e desvia; curto vai no 3º e só estende. E é o curto que dói no cotovelo de tenista.',
    pontos: [
      'Por que o extensor radial curto estende sem desviar?',
      'Que quadro clínico envolve sua origem?',
      'Qual sua função na preensão?',
    ],
  },
  {
    termos: ['Tendão do Músculo Extensor Longo do Polegar'],
    classe: 'tendao',
    resumo: 'Tendão do terceiro compartimento que contorna o tubérculo de Lister e retropulsa o polegar.',
    localizacao: 'Terceiro compartimento, contornando o tubérculo dorsal do rádio, cruzando os radiais do carpo e formando a borda posterior da tabaqueira anatômica.',
    funcao:
      'Estende a interfalângica do polegar e, sobretudo, retropulsa o polegar — levanta o polegar do plano da mesa com a palma apoiada, movimento que só ele faz.',
    vascularizacao:
      'Artéria interóssea posterior, com uma zona hipovascular exatamente onde ele contorna o tubérculo dorsal do rádio (de Lister). É essa avascularidade relativa que explica a rotura tardia do tendão depois de uma fratura de Colles, às vezes semanas após o trauma e sem novo esforço.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Sua mudança de direção sobre o tubérculo de Lister cria um ponto de atrito e de vascularização precária.',
    clinica:
      'A rotura tardia após fratura de Colles é o exemplo clássico, e ocorre até em fraturas sem desvio — o mecanismo é isquêmico e atrítico, não traumático direto. O teste é pedir a retropulsão com a palma sobre a mesa: se o polegar não sobe, o tendão está roto. A reconstrução padrão é a transferência do extensor do indicador.',
    memoria:
      'Palma na mesa, levante só o polegar. Não subiu? Extensor longo do polegar roto — procure uma fratura de punho no passado.',
    pontos: [
      'Que movimento único o extensor longo do polegar realiza?',
      'Por que ele rompe tardiamente após fratura do rádio distal?',
      'Como se testa sua integridade?',
    ],
  },
  {
    termos: ['Tendão do Músculo Extensor Curto do Polegar'],
    classe: 'tendao',
    resumo: 'Tendão do primeiro compartimento que estende a metacarpofalângica do polegar.',
    localizacao: 'Primeiro compartimento extensor, junto ao abdutor longo do polegar, formando a borda anterior da tabaqueira anatômica.',
    funcao: 'Estende a articulação metacarpofalângica do polegar e auxilia a abdução da carpometacarpal.',
    vascularizacao:
      'Artéria radial e ramos da interóssea posterior. Forma a borda anterior da tabaqueira anatômica e divide o primeiro compartimento extensor com o abdutor longo — os dois tendões da tenossinovite de De Quervain.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Em cerca de 30% das pessoas ocupa um subcompartimento separado, com septo próprio.',
    clinica:
      'Esse septo é a razão anatômica do insucesso de infiltrações na De Quervain: o corticoide fica no compartimento do abdutor longo e não alcança o extensor curto. Por isso, na liberação cirúrgica, é obrigatório procurar e abrir o subcompartimento separado.',
    memoria:
      'Duas bordas da tabaqueira: na frente, abdutor longo e extensor curto; atrás, extensor longo. Entre elas, o escafoide e a artéria radial.',
    pontos: [
      'Que compartimento o extensor curto do polegar ocupa?',
      'Que variante anatômica ele apresenta com frequência?',
      'Por que essa variante causa falha de tratamento?',
    ],
  },
  /* ─────────────────── Vasos da mão ─────────────────── */
  {
    termos: ['Arco Palmar Superficial'],
    classe: 'arteria',
    resumo: 'Arco arterial da palma formado principalmente pela artéria ulnar, mais distal que o profundo.',
    localizacao:
      'Sob a aponeurose palmar, no nível da prega palmar distal — que corresponde à borda distal do polegar em abdução total, a régua clássica para localizá-lo.',
    funcao: 'Dá origem às artérias digitais palmares comuns, que se dividem nas próprias e irrigam as faces adjacentes dos dedos.',
    vascularizacao: 'Formado pela continuação da artéria ulnar, completado pelo ramo palmar superficial da radial em cerca de 80% das pessoas.',
    relacoes: 'Está superficialmente aos tendões flexores e aos nervos digitais, ao contrário do arco profundo.',
    clinica:
      'A dupla origem dos arcos é o que permite ao teste de Allen verificar se uma artéria pode ser sacrificada: comprime-se radial e ulnar, o paciente abre e fecha a mão, e libera-se uma delas para observar o reenchimento. É o exame obrigatório antes da cateterização radial e da coleta da artéria radial para revascularização coronária.',
    memoria:
      'Superficial = ulnar, na prega palmar distal. Profundo = radial, um dedo acima. Dois arcos, duas origens, uma rede de segurança.',
    pontos: [
      'Que artéria forma principalmente o arco palmar superficial?',
      'Que reparo de superfície marca sua posição?',
      'Para que serve o teste de Allen?',
    ],
  },
  {
    termos: ['Artérias Digitais Palmares Comuns'],
    classe: 'arteria',
    resumo: 'Ramos do arco palmar superficial que se dividem em artérias digitais próprias na base dos dedos.',
    localizacao: 'Descem nos espaços intermetacarpais, dividindo-se ao nível das pregas interdigitais.',
    funcao: 'Levam sangue às faces adjacentes de dois dedos vizinhos; cada dedo recebe, portanto, duas artérias próprias, uma de cada lado.',
    relacoes: 'Os nervos digitais palmares comuns correm superficialmente às artérias na palma, mas as artérias passam a ser dorsais aos nervos nos dedos — inversão constante e cobrada.',
    clinica:
      'Como cada dedo tem duas artérias, é possível seccionar uma sem necrose — o que dá margem aos retalhos digitais e ao reparo microcirúrgico. Nos ferimentos digitais, o bloqueio anestésico deve evitar vasoconstritor em soluções antigas e nunca ser feito em anel circunferencial sob pressão, pelo risco de isquemia.',
    memoria:
      'Na palma, nervo por cima; no dedo, artéria por cima. Eles trocam de andar na base do dedo.',
    pontos: [
      'Quantas artérias irrigam cada dedo?',
      'Qual a relação entre nervos e artérias na palma e nos dedos?',
      'Por que é possível seccionar uma artéria digital sem necrose?',
    ],
  },
  {
    termos: ['Artéria Principal do Polegar'],
    classe: 'arteria',
    resumo: 'Ramo do arco palmar profundo que irriga os dois lados do polegar.',
    localizacao: 'Nasce da artéria radial quando esta atravessa o primeiro espaço interósseo, e desce sob o adutor do polegar até se dividir nas digitais próprias do polegar.',
    funcao: 'É a principal fonte de sangue do polegar, com contribuição menor de ramos do arco superficial e da artéria radial do indicador.',
    relacoes: 'Corre profundamente ao adutor do polegar, protegida por ele.',
    clinica:
      'Sua identificação é decisiva nos retalhos da mão e no reimplante do polegar — o único dedo cujo reimplante se tenta em quase todas as circunstâncias, dada a sua importância funcional. Na síndrome do martelo hipotenar, ao contrário, é a artéria ulnar que trombosa por trauma repetido contra o hamato.',
    memoria:
      'O polegar tem artéria com nome próprio, porque é o dedo que vale por metade da mão. Vem do arco profundo, que é o radial.',
    pontos: [
      'De que arco a artéria principal do polegar se origina?',
      'Por que o polegar tem prioridade em reimplantes?',
      'Que estrutura a protege no seu trajeto?',
    ],
  },
  {
    termos: ['Ramo Palmar Profundo da Artéria Radial'],
    classe: 'arteria',
    resumo: 'Segmento da artéria radial que atravessa o primeiro espaço interósseo e forma o arco palmar profundo.',
    localizacao:
      'Da tabaqueira anatômica, a radial mergulha entre as duas cabeças do primeiro interósseo dorsal, chega à palma profunda e cruza as bases dos metacarpos sob os tendões flexores.',
    funcao: 'Forma o arco palmar profundo, que dá as artérias metacarpais palmares e a principal do polegar, e se anastomosa com o ramo profundo da ulnar.',
    relacoes: 'O arco profundo corre cerca de um centímetro proximal ao superficial e é acompanhado pelo ramo profundo do nervo ulnar.',
    clinica:
      'Esse trajeto explica por que a artéria radial pode ser retirada para enxerto coronário sem comprometer a mão — desde que o teste de Allen confirme a dominância ulnar. A ferida profunda da palma que sangra abundantemente e não cede à compressão superficial costuma envolver o arco profundo, e exige exploração.',
    memoria:
      'A radial some na tabaqueira, atravessa o primeiro espaço e reaparece no fundo da palma. Ela dá a volta pela lateral da mão.',
    pontos: [
      'Por onde a radial passa do dorso para a palma?',
      'Que arco ela forma e o que ele origina?',
      'Por que a radial pode ser usada como enxerto?',
    ],
  },
  {
    termos: [
      'Músculo Interósseo Dorsal I',
    ],
    classe: 'musculo',
    resumo:
      'O maior dos interósseos, entre o polegar e o indicador — e o músculo que denuncia a lesão do nervo ulnar antes de qualquer exame.',
    localizacao:
      'Preenche o primeiro espaço interósseo, entre o primeiro e o segundo metacarpos, com duas cabeças que abraçam a artéria radial na sua passagem para a palma.',
    funcao:
      'Abduz o indicador e, sobretudo, estabiliza-o contra o polegar na pinça lateral. É o único interósseo com massa suficiente para ser visível e palpável no dorso da mão.',
    vascularizacao:
      'Ramo da artéria radial, que atravessa o próprio músculo entre suas duas cabeças a caminho do arco palmar profundo — passagem que faz do primeiro interósseo o único músculo da mão perfurado por uma artéria de grande calibre.',
    inervacao: 'Ramo profundo do nervo ulnar (C8–T1), como todos os interósseos.',
    linfaticos: 'Linfonodos supratrocleares e axilares.',
    relacoes:
      'Sua borda proximal delimita a tabaqueira anatômica, no assoalho da qual a artéria radial pode ser palpada.',
    clinica:
      'É o músculo intrínseco mais volumoso da mão, e por isso o primeiro cuja atrofia se vê: na lesão do nervo ulnar, o primeiro espaço interósseo afunda e o dorso da mão fica escavado — um sinal visível a metros de distância, antes de qualquer teste de força. É também o músculo cuja fraqueza produz o sinal de Froment: ao segurar um papel entre polegar e indicador, o paciente compensa fletindo a interfalângica do polegar, recrutando o flexor longo, que é do mediano. Uma inspeção e um pedaço de papel bastam para o diagnóstico.',
    memoria:
      'Ulnar lesado: o buraco entre polegar e indicador afunda. Peça para segurar um papel — se o polegar dobrar, é Froment.',
    pontos: [
      'Que artéria atravessa o primeiro interósseo dorsal?',
      'Por que sua atrofia é o sinal mais visível da lesão ulnar?',
      'O que é o sinal de Froment?',
    ],
  },
]
