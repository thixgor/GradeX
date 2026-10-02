import type { ExplicacoesExtras } from './casos-imagem'

const x = (explicacao: string, dica?: string) => ({ explicacao, dica })

/**
 * Comentário aprofundado das setas da primeira leva — crânio, face, pescoço e
 * tórax. Chave: slug do caso → rótulo original do autor.
 */
export const EXPLICACOES_TC_1: ExplicacoesExtras = {
  'avc-isquemico-acm': {
    hyperattenuating: x(
      'O sangue que circula tem cerca de 40 UH; um trombo recente, com hemácias compactadas e menos plasma, chega a 60–80 UH. Por isso o segmento ocluído da artéria cerebral média aparece mais branco que a artéria do outro lado — e muitas vezes antes de qualquer alteração no parênquima. Procure-o no plano das cisternas da base, seguindo a ACM desde a carótida até a fissura sylviana, e compare sempre com o lado oposto.',
      'Hematócrito alto e calcificação de parede deixam as duas artérias brancas: o sinal vale quando é assimétrico e linear, no trajeto do vaso.',
    ),
    hypoattenuation: x(
      'Minutos após a oclusão, a bomba de sódio e potássio falha e a água entra nas células (edema citotóxico). Cada 1% a mais de água reduz a densidade em cerca de 2,5 UH; ao fim de algumas horas, o território fica visivelmente mais escuro que o hemisfério sadio. O limite da hipoatenuação segue o mapa arterial — aqui, o território frontotemporoparietal da ACM.',
      'Quanto mais franca e extensa a hipoatenuação, mais tempo se passou e maior o risco de sangrar com trombólise; acima de um terço do território, a reperfusão costuma trazer mais dano que benefício.',
    ),
    'gray-white matter': x(
      'O córtex tem mais neurônios e capilares que a substância branca e, na TC, é discretamente mais denso. O edema do córtex isquêmico apaga essa diferença: a fita insular, o contorno do núcleo lentiforme e os giros do córtex perdem o brilho e se misturam à substância branca. É o primeiro sinal parenquimatoso confiável e o que o escore ASPECTS mede região por região.',
      'Use janela estreita (largura de 30 a 40 UH): a perda de diferenciação que some na janela padrão salta aos olhos quando o contraste da imagem é esticado.',
    ),
  },
  'hemorragia-intraparenquimatosa': {
    'Mild dilation': x(
      'Os cornos temporais são os primeiros a crescer quando o líquor tem dificuldade para sair dos ventrículos, porque ficam no fim da linha e normalmente quase não aparecem. Aqui, o hematoma e o edema comprimem o terceiro ventrículo e o forame de Monro: o líquor produzido continua chegando e não escoa. Corno temporal visível com sulcos apagados é sinal precoce de hidrocefalia obstrutiva.',
      'Em idosos atróficos os cornos temporais dilatam por perda de volume; aí os sulcos estão alargados, não apagados.',
    ),
    compression: x(
      'O terceiro ventrículo é uma fenda na linha média entre os tálamos. Um hematoma talâmico ocupa espaço e empurra a parede lateral do ventrículo, que vira uma linha deslocada ou some. Isso tem duas consequências: desvio da linha média e obstrução ao fluxo de líquor dos ventrículos laterais, que podem dilatar a montante.',
    ),
    'hyperdense mass': x(
      'Além do sangue, há um componente sólido e denso que não se comporta como coágulo puro — mais nodular e com edema desproporcional ao tempo de evolução. Quando um hematoma tem esse aspecto, ou aparece em paciente sem hipertensão, a pergunta passa a ser o que sangrou: tumores como glioblastoma e metástases de melanoma, rim, tireoide e coriocarcinoma sangram com frequência.',
      'Contraste e ressonância separam o tumor do coágulo; repetir a imagem depois que o sangue é reabsorvido também revela a lesão escondida.',
    ),
    'Intracerebral hemorrhage': x(
      'Sangue extravasado no parênquima forma coágulo, e o coágulo, com hemoglobina concentrada, mede 60 a 80 UH — por isso é branco na TC sem contraste nas primeiras horas e dias. Com o tempo, a hemoglobina é degradada e o hematoma escurece da periferia para o centro, ficando isodenso em uma a duas semanas. A topografia talâmica e putaminal é a das artérias perfurantes lesadas pela hipertensão crônica.',
      'O volume estimado pela fórmula ABC/2 (maior diâmetro × perpendicular × número de cortes, dividido por dois) entra no escore ICH e orienta prognóstico.',
    ),
    'cerebral edema': x(
      'O halo escuro em volta do hematoma é edema: plasma que sai do coágulo e do vaso lesado e, depois, inflamação causada pelos produtos de degradação do sangue. Ele cresce nos primeiros dias e pode piorar o efeito de massa mesmo sem o hematoma aumentar. Edema muito grande para um hematoma de poucas horas é pista de lesão subjacente.',
    ),
  },
  'hemorragia-pontina': {
    'Pontine haemorrhage': x(
      'As artérias paramedianas da basilar penetram a ponte em ângulo reto e sofrem com a hipertensão crônica, como as perfurantes dos núcleos da base. O sangue fica no centro da ponte, branco, e destrói núcleos e vias muito próximos: centros do olhar horizontal, vias simpáticas e tratos motores. Por isso coma, pupilas puntiformes e tetraparesia vêm juntos.',
      'O tronco fica entre os rochedos temporais, que geram artefatos em faixas escuras e brancas; confirme o sangue em mais de um corte antes de afirmar ou excluir.',
    ),
    'right thalamus extension': x(
      'O hematoma não respeita limites anatômicos: sobe pelo mesencéfalo até o tálamo, dissecando a substância. Quanto mais longa a coluna de sangue, mais vias são destruídas e pior o prognóstico. Seguir o sangue corte a corte, de baixo para cima, é o jeito de medir essa extensão.',
    ),
    'focal encephalomalacia': x(
      'Encefalomalácia é tecido que morreu e foi reabsorvido, substituído por líquor: tem densidade de água (0–15 UH), limites nítidos e às vezes puxa o ventrículo vizinho. Não é lesão aguda — é a cicatriz de um infarto antigo. Junto com a hemorragia pontina, conta a história da microangiopatia hipertensiva, que entope uns vasos e rompe outros.',
      'Diferencie de edema agudo: o edema é menos escuro, tem bordas borradas e empurra estruturas; a encefalomalácia é escura como líquor e retrai.',
    ),
  },
  'hematoma-extradural': {
    'colloid cyst': x(
      'O cisto coloide nasce do teto do terceiro ventrículo, junto ao forame de Monro, e tem conteúdo proteico denso — por isso costuma ser hiperdenso na TC sem contraste. Funciona como uma rolha: quando bloqueia os dois forames, os ventrículos laterais dilatam. É a lesão que motivou a derivação deste paciente.',
    ),
    hyperdensity: x(
      'A porção mais branca do hematoma extradural é sangue coagulado recente, de 60 a 80 UH. Ela costuma ficar na parte mais dependente ou mais periférica da coleção. Num hematoma de vários dias, esse componente convive com áreas já degradadas, o que dá o aspecto heterogêneo.',
    ),
    'isodense component': x(
      'Com a degradação da hemoglobina, o sangue perde densidade e passa por uma fase em que mede o mesmo que o córtex (30–40 UH). Nessa fase, a coleção pode ficar quase invisível em janela padrão. O que denuncia é o efeito: o córtex afastado da tábua interna, a forma biconvexa e o desvio das estruturas.',
      'Estreitar a janela e comparar com o lado oposto ajuda; na dúvida, contraste mostra a dura e o córtex deslocados.',
    ),
    'air bubbles': x(
      'Ar dentro do crânio aparece preto, com –1000 UH. Logo após cirurgia ou punção ventricular é esperado que bolhas fiquem no trajeto do cateter e no espaço subdural ou extradural. Elas mostram por onde o procedimento passou e são reabsorvidas em dias.',
    ),
    'Y-shaped branched VP shunt': x(
      'O cateter de derivação é de material radiopaco e aparece como uma linha muito branca, com artefato em estrias. Aqui ele se bifurca para drenar os dois ventrículos laterais, já que o cisto bloqueava os dois forames. A descompressão rápida de ventrículos muito dilatados descola a dura da tábua interna — e é esse espaço que se encheu de sangue.',
    ),
  },
  'hematoma-subdural-agudo-sobre-cronico': {
    infarcts: x(
      'Quando o cérebro é empurrado sob a foice ou pela incisura do tentório, artérias ficam presas contra essas bordas rígidas: a cerebral anterior na herniação subfalcina, a cerebral posterior na transtentorial. O território comprimido sofre isquemia e aparece hipodenso. São infartos secundários, sinal de que a herniação já causou dano estrutural.',
    ),
    'compression lateral ventricle': x(
      'O ventrículo lateral do lado da coleção é espremido e fica em fenda ou some. Esse apagamento é medida indireta do efeito de massa e acompanha o desvio da linha média, que se mede no septo pelúcido, ao nível do forame de Monro.',
    ),
    'trapping and dilatation': x(
      'O desvio da linha média dobra o forame de Monro do lado oposto: o ventrículo contralateral continua produzindo líquor e não consegue drená-lo, então dilata. Um ventrículo aprisionado e maior que o normal do lado sadio é sinal de herniação importante e de hipertensão intracraniana.',
    ),
    'falcine subdural': x(
      'O espaço subdural também se estende ao longo da foice do cérebro, entre os dois hemisférios. O sangue ali forma uma faixa vertical e espessa na fissura inter-hemisférica, que respeita a linha média e não entra nos sulcos — diferente da hemorragia subaracnoidea, que desenha os sulcos.',
    ),
    'acute component': x(
      'O sangue novo, mais denso, se deposita por gravidade na parte pendente da coleção, enquanto o sangue antigo, liquefeito, fica por cima. É a prova de que uma coleção crônica sangrou de novo — o ressangramento que explica a piora rápida do paciente.',
    ),
    'subfalcine herniation': x(
      'O giro do cíngulo é empurrado para baixo da borda livre da foice, passando para o outro lado. Na TC, o septo pelúcido e o terceiro ventrículo se deslocam além da linha média. Desvio maior que 5 mm, com sinais clínicos, é um dos critérios para drenagem cirúrgica.',
      'Meça o desvio no nível do forame de Monro, traçando a linha média pelas inserções anterior e posterior da foice.',
    ),
    'two separate hematocrit levels': x(
      'Uma interface horizontal entre líquido escuro em cima e mais claro embaixo é um nível de hematócrito: as hemácias decantaram. Dois níveis indicam pelo menos dois sangramentos em momentos diferentes. Também aparecem quando o sangue não coagula, como em pacientes anticoagulados.',
    ),
    'chronic component': x(
      'O hematoma subdural crônico é sangue liquefeito e envolto por membranas, com densidade próxima à do líquor. Ele cresce lentamente porque as membranas neoformadas têm vasos frágeis que voltam a sangrar. É a parte que explica as semanas de confusão e déficits que antecederam a piora.',
    ),
    'acute subdural haematoma': x(
      'O espaço subdural fica entre a dura e a aracnoide; as veias ponte que o atravessam rompem com movimentos de aceleração e desaceleração, mesmo em traumas pequenos no idoso atrófico. O sangue se espalha livremente pela convexidade e forma um crescente que cruza as suturas, mas não a foice.',
      'Crescente que cruza suturas é subdural; lente biconvexa que para nas suturas é extradural.',
    ),
    'sulcal effacement': x(
      'Os sulcos normais são finas linhas escuras de líquor entre os giros. Quando o hemisfério é comprimido ou incha, o líquor é expulso e os sulcos desaparecem. Apagamento de sulcos do lado da coleção é efeito de massa; apagamento difuso sugere edema cerebral e hipertensão intracraniana.',
    ),
  },
  'hemorragia-subaracnoidea': {
    'subarachnoid hemorrhage': x(
      'O espaço subaracnoideo é onde corre o líquor, entre a aracnoide e a pia, dentro dos sulcos e das cisternas. O sangue que entra ali se mistura ao líquor e desenha os sulcos em branco, como se o contorno dos giros fosse pintado. No trauma, aparece perto do impacto, na convexidade; no aneurisma roto, predomina nas cisternas da base.',
      'A sensibilidade da TC para hemorragia subaracnoidea é altíssima nas primeiras seis horas e cai depois, porque o sangue é diluído e lavado pelo líquor.',
    ),
  },
  'contusoes-cerebrais': {
    Contusion: x(
      'Contusões são machucados do córtex: o cérebro se move dentro do crânio e bate nas superfícies ósseas irregulares das fossas anterior e média. Por isso aparecem nos polos frontais, nas faces orbitárias e nos polos temporais, como focos hiperdensos de sangue misturados a edema. Costumam aumentar e coalescer nas primeiras 24 a 72 horas.',
      'Golpe e contragolpe: a contusão mais grave muitas vezes está do lado oposto ao impacto.',
    ),
    'Subarachnoid haemorrhage': x(
      'No trauma, o sangue subaracnoideo vem de pequenos vasos corticais rompidos e fica nos sulcos da convexidade, perto das contusões. Ele marca a energia do impacto e pode causar vasoespasmo dias depois, embora menos que no aneurisma.',
    ),
    'Intraventricular haemorrhage': x(
      'Sangue dentro do sistema ventricular aparece como material branco nos ventrículos. No trauma, vem de vasos subependimários rompidos ou de hemorragia que se estende do parênquima. Pode obstruir a drenagem do líquor e causar hidrocefalia aguda.',
    ),
    'CSF/blood level': x(
      'Com o paciente deitado, o sangue mais pesado decanta na parte pendente do ventrículo — o corno occipital — formando uma linha horizontal com o líquor por cima. É uma forma confiável de confirmar sangue intraventricular mesmo em pequena quantidade.',
    ),
    'Subdural haematoma': x(
      'Coleção em crescente sobre a convexidade, entre a dura e o cérebro, por ruptura de veias ponte. No trauma grave, frequentemente se associa às contusões e à hemorragia subaracnoidea. A espessura e o desvio da linha média decidem se é cirúrgica.',
    ),
    'Calvarial fracture': x(
      'A fratura da calota é vista na janela óssea como linha escura que interrompe a cortical, às vezes com afundamento. Ela marca o ponto de impacto e alerta para lesões vasculares próximas, como a artéria meníngea média, quando atravessa o osso temporal.',
      'Suturas cranianas também são linhas escuras; elas são simétricas, serrilhadas e estão em lugares previsíveis.',
    ),
  },
  pneumoencefalo: {
    'A small hyperdense focus': x(
      'Um pequeno foco branco junto ao ar pode ser sangue ou um fragmento ósseo deslocado pela fratura. Ele ajuda a localizar o trajeto da comunicação com o exterior: geralmente uma fratura da base anterior, junto ao seio frontal ou às células etmoidais.',
    ),
    gas: x(
      'Gás no crânio tem densidade de –1000 UH e aparece preto mesmo em janela óssea. Ele só entra se houver comunicação entre o espaço intracraniano e uma cavidade com ar — seio paranasal, mastoide ou o exterior — por fratura, cirurgia ou infecção por germe produtor de gás.',
    ),
    'air in the subarachnoid spaces': x(
      'Quando o ar está no espaço subaracnoideo, ele se espalha pelos sulcos e cisternas e desenha o contorno dos giros em preto, em bolhas pequenas e múltiplas. Ar extradural, ao contrário, forma uma coleção única e lenticular que não se move.',
      'Ar bifrontal separando os polos frontais com aspecto de montanha — o sinal do monte Fuji — indica pneumoencéfalo hipertensivo, uma emergência.',
    ),
  },
  'abscesso-cerebral': {
    mass: x(
      'O abscesso começa como cerebrite, uma área de inflamação mal definida, e em uma a duas semanas forma uma cápsula de colágeno com pus no centro. Na TC sem contraste, o centro é hipodenso e homogêneo, e a cápsula, discretamente mais densa. Com contraste, a cápsula realça em anel fino e regular, mais fino do lado ventricular, onde a vascularização é menor.',
      'Anel fino e liso sugere abscesso; anel grosso, irregular e nodular sugere tumor. A ressonância com difusão resolve: o pus restringe.',
    ),
    'mass effect': x(
      'O abscesso e o edema ao redor ocupam espaço e empurram o ventrículo e a linha média. Efeito de massa importante aumenta o risco de herniação e indica descompressão por aspiração ou cirurgia, além do antibiótico.',
    ),
    'cerebral edema': x(
      'Edema vasogênico é plasma que sai de capilares com barreira hematoencefálica rompida. Ele corre pelas fibras da substância branca e forma dedos de luva hipodensos, poupando o córtex. É desproporcionalmente grande em abscessos e metástases.',
    ),
  },
  glioblastoma: {
    'peripheral rim': x(
      'O glioblastoma cresce mais rápido que seu suprimento sanguíneo: o centro necrosa e a periferia, onde as células ainda são viáveis e há vasos novos e anômalos, forma uma borda irregular e grossa. Na TC sem contraste ela é iso a hiperdensa; com contraste, realça intensamente. É essa parede espessa e nodular que separa o tumor do abscesso.',
    ),
    'cortico-subcortical mass': x(
      'A lesão ocupa o córtex e a substância branca subjacente, com centro hipodenso de necrose. Gliomas nascem dentro do parênquima — são intra-axiais —, o que os separa de lesões como o meningioma, que nasce da dura e empurra o cérebro de fora para dentro.',
    ),
    'hyperattenuating foci': x(
      'Pequenos focos brancos na parede do tumor são hemorragias pelos vasos neoformados, frágeis, ou calcificações. Sangramento intratumoral é comum no glioblastoma e pode ser a apresentação inicial, simulando um AVC hemorrágico.',
    ),
    'white matter hypoattenuation': x(
      'A hipodensidade que se espalha em dedos pela substância branca é edema vasogênico, mas, no glioblastoma, também contém células tumorais infiltrando além da borda visível. Por isso a ressecção nunca é verdadeiramente completa e a radioterapia trata a área do edema.',
    ),
  },
  'metastases-cerebrais': {
    'dural-based': x(
      'Algumas metástases se implantam na dura e não no parênquima: formam lesões com base larga na meninge, que podem simular meningioma. Mama, próstata e pulmão são origens frequentes. Na suspeita, procure espessamento dural e destruição óssea adjacente.',
    ),
    'ring enhancement': x(
      'As metástases chegam pelo sangue e se alojam na junção entre córtex e substância branca, onde as arteríolas se estreitam. Crescem, necrosam no centro e realçam em anel. Lesões múltiplas, de tamanhos variados, em territórios diferentes, são o padrão da disseminação hematogênica.',
    ),
    'vasogenic edema': x(
      'Os vasos tumorais não têm barreira hematoencefálica, e o plasma vaza para a substância branca. O resultado é um edema muito maior que a lesão, que responde bem ao corticoide — por isso o paciente melhora em dias com dexametasona, antes de qualquer tratamento oncológico.',
    ),
  },
  'hidrocefalia-cisto-coloide': {
    'CSF permeation': x(
      'Quando a pressão nos ventrículos sobe de forma aguda, o líquor é forçado através do epêndima para a substância branca periventricular. Isso aparece como uma faixa hipodensa e borrada em volta dos cornos frontais. É sinal de hidrocefalia ativa, sob pressão, e não de dilatação crônica compensada.',
      'Em idosos, hipodensidade periventricular simétrica e de bordas irregulares costuma ser microangiopatia, não transudação; o contexto clínico e o tamanho dos ventrículos ajudam.',
    ),
    'leftward bowing': x(
      'O septo pelúcido separa os dois ventrículos laterais. Se um deles tem pressão maior — porque o cisto obstrui mais um forame que o outro —, o septo se curva para o lado de menor pressão. É um detalhe que mostra que o bloqueio está exatamente no forame de Monro.',
    ),
    dilatation: x(
      'Os ventrículos laterais estão grandes enquanto o terceiro e o quarto continuam normais. Esse padrão localiza a obstrução: o líquor não sai dos laterais, logo o bloqueio está no forame de Monro. É o raciocínio de seguir o líquor até encontrar o ponto em que o ventrículo volta a ter tamanho normal.',
    ),
    'cerebral edema': x(
      'O apagamento difuso dos sulcos traduz cérebro comprimido pela hipertensão intracraniana. Somado aos ventrículos dilatados e à transudação, compõe o quadro de hidrocefalia aguda descompensada, que pode levar à morte súbita se não for drenada.',
    ),
  },
  'abscesso-subperiosteal-da-orbita': {
    'maxillary sinusitis': x(
      'O seio maxilar normal é cheio de ar e aparece preto. Aqui está preenchido por material de partes moles, com espessamento da mucosa: secreção e inflamação. Isolada, a opacificação não diferencia infecção bacteriana de viral — o que pesa é o contexto e as complicações.',
    ),
    'the lamina papyracea': x(
      'A lâmina papirácea é a parede medial da órbita, um osso fino como papel que separa as células etmoidais da órbita. Ela tem pequenas deiscências por onde passam vasos, e a infecção etmoidal atravessa por ali. Quando perde definição, é sinal de que a barreira foi vencida.',
    ),
    'inter-ethmoidal septae': x(
      'As células etmoidais são separadas por septos ósseos finos. Na infecção agressiva, esses septos ficam irregulares ou desaparecem por osteíte e erosão. É marca de doença mais grave que uma sinusite comum.',
    ),
    'ethmoidal sinusitis': x(
      'O etmoide é vizinho direto da órbita e, na criança, é o seio mais desenvolvido. Por isso a celulite orbitária infantil quase sempre nasce de uma etmoidite. Células etmoidais opacificadas ao lado de uma órbita inflamada contam a origem.',
    ),
    'frontal sinusitis': x(
      'O seio frontal velado completa o quadro de pansinusite. Infecção frontal pode também ir para o osso da fronte e para dentro do crânio, então o seio frontal opacificado pede atenção à tábua posterior e ao espaço extradural.',
    ),
  },
  'tumor-de-pott': {
    'Mucosal enhancement': x(
      'A mucosa dos seios inflamada fica espessa e realça com o contraste, desenhando uma borda clara em volta do conteúdo líquido escuro. É sinal de inflamação ativa e ajuda a diferenciar secreção retida de espessamento mucoso crônico.',
    ),
    'subgaleal soft tissue swelling': x(
      'O tumor de Pott é a tumefação mole na fronte causada por osteomielite do osso frontal com abscesso sob a gálea. A infecção atravessa a tábua anterior pelas veias diploicas. Clinicamente é a bolsa na testa; na TC, uma coleção de partes moles sobre o osso.',
      'Sempre procure a tábua posterior: a mesma infecção vai para dentro do crânio e forma empiema extradural, subdural ou abscesso cerebral.',
    ),
    'frontal sinuses': x(
      'Os seios frontais preenchidos são a fonte. Eles se desenvolvem na adolescência, e é justamente no adolescente, com veias diploicas exuberantes, que a sinusite frontal mais complica para o osso e o crânio.',
    ),
  },
  'fratura-blowout-da-orbita': {
    Defect: x(
      'Quando um objeto maior que a abertura da órbita a atinge, a pressão dentro dela sobe e o osso mais fino cede: o assoalho, sobre o seio maxilar. O rebordo, mais grosso, fica íntegro — isso define o blowout puro. Na reconstrução coronal, o defeito aparece como uma falha no assoalho com conteúdo orbitário descendo para o seio.',
    ),
    'Fracture fragment': x(
      'O fragmento do assoalho deslocado para dentro do seio maxilar forma o sinal do alçapão. Às vezes ele se dobra e volta, prendendo o músculo — situação mais grave, comum em crianças, porque o osso é elástico.',
    ),
    'Left inferior rectus muscle': x(
      'O reto inferior corre logo acima do assoalho. Quando hernia pelo defeito ou fica preso, o olho não consegue olhar para cima e o paciente vê duplo. Na imagem coronal, o músculo perde a forma ovalada e aparece puxado para baixo, para dentro do seio.',
      'Músculo arredondado e descido, ou preso entre fragmentos, indica encarceramento e cirurgia precoce.',
    ),
  },
  'abscesso-peritonsilar': {
    'Palatine tonsils': x(
      'As amígdalas palatinas ficam nas paredes laterais da orofaringe. Na amigdalite, aumentam e podem se tocar na linha média — as amígdalas em beijo —, estreitando a via aérea. Realçam de forma heterogênea, com estrias, enquanto uma coleção mostra centro sem realce.',
    ),
    'Peritonsillar abscess': x(
      'O pus se forma entre a cápsula da amígdala e o músculo constritor superior. Na TC com contraste, é uma área hipodensa, de conteúdo líquido, envolta por anel que realça. O anel é o que separa o abscesso drenável da celulite, que realça de forma difusa sem coleção.',
      'Uma área hipodensa sem anel bem formado ainda pode ser flegmão; a TC indica a drenagem, mas a decisão é clínica.',
    ),
    Hypopharyngeal: x(
      'A hipofaringe fica abaixo da orofaringe, atrás da laringe. O edema inflamatório pode descer até ela e reduzir a coluna de ar, o que explica a voz abafada e o risco de obstrução.',
    ),
    'Right vallecula': x(
      'A valécula é o recesso entre a base da língua e a epiglote. Assimetria ou apagamento de uma valécula indica edema ou extensão do processo inflamatório para a região supraglótica.',
    ),
    'internal laryngocele': x(
      'Laringocele é dilatação aérea do sáculo do ventrículo laríngeo; quando fica dentro da laringe, é interna. Aqui é um achado associado, não a causa do quadro, mas vale reconhecer para não confundir com coleção gasosa infecciosa.',
    ),
    'Right pyriform sinus': x(
      'Os seios piriformes ficam de cada lado da laringe, na hipofaringe. A comparação entre os dois mostra assimetria por edema. Em adultos sem infecção, assimetria persistente é sinal de alerta para tumor.',
    ),
  },
  'abscesso-retrofaringeo': {
    'peritonsillar abscess': x(
      'O abscesso começa junto à amígdala, com gás e restos necróticos — o gás indica anaeróbios ou comunicação com a luz da faringe. Daí ele não ficou contido e avançou para os espaços profundos.',
    ),
    retropharyngeal: x(
      'O espaço retrofaríngeo fica atrás da faringe e à frente da fáscia pré-vertebral, e desce da base do crânio ao mediastino. Por isso é uma avenida: o pus que entra nele pode chegar ao tórax e causar mediastinite. Na TC, aparece como coleção na linha média ou ligeiramente lateral, achatando a faringe para frente.',
      'Inclua sempre o mediastino superior no exame quando houver coleção retrofaríngea.',
    ),
    'visceral space': x(
      'O espaço visceral envolve faringe, laringe, esôfago, traqueia e tireoide. Coleção ali comprime a via aérea e o esôfago, explicando o estridor e a disfagia.',
    ),
  },
  'sindrome-de-lemierre': {
    'septic pulmonary nodules': x(
      'Fragmentos de trombo infectado saem da jugular e chegam ao pulmão pela circulação. Formam nódulos periféricos, múltiplos, de tamanhos variados, frequentemente com um vaso chegando a eles e com cavitação central. É o retrato do embolismo séptico.',
      'Nódulos periféricos que cavitam rapidamente em paciente febril pedem busca da fonte: jugular, valva tricúspide ou cateter.',
    ),
    'reactive lymph nodes': x(
      'Linfonodos cervicais aumentados e realçados acompanham a infecção da orofaringe. São reativos; não confundir com abscesso ganglionar, que mostra centro hipodenso.',
    ),
    thrombosis: x(
      'A jugular interna trombosada não se enche de contraste: aparece como uma falha central, cercada por parede espessada que realça e gordura inflamada em volta. É a tromboflebite séptica que define a síndrome de Lemierre.',
    ),
    'Post-procedural gas foci': x(
      'Bolhas de gás no trajeto da drenagem recente do abscesso são esperadas. O contexto evita confundi-las com germe produtor de gás.',
    ),
    'peritonsillar abscess,': x(
      'Mesmo após a drenagem, persiste inflamação e uma coleção residual junto à amígdala, com extensão para o espaço parafaríngeo — o caminho até a jugular.',
    ),
  },
  'tep-a-cavaleiro': {
    right: x(
      'Na angiotomografia, o contraste deixa as artérias pulmonares brancas; o trombo aparece como falha cinzenta dentro da luz. Aqui o trombo cavalga a bifurcação e continua pela artéria pulmonar direita. Trombo agudo fica no centro da luz e forma ângulo agudo com a parede.',
      'Falha excêntrica, aderida à parede e com ângulo obtuso sugere trombo crônico.',
    ),
    left: x(
      'O mesmo trombo ocupa a artéria pulmonar principal esquerda. Obstrução bilateral das artérias principais reduz muito o leito vascular e sobrecarrega o ventrículo direito.',
    ),
    'left upper': x(
      'Trombo no ramo lobar superior esquerdo. Seguir cada artéria do centro à periferia, lobo por lobo, é o método para não perder falhas menores.',
    ),
    upper: x(
      'Falha de enchimento nos ramos segmentares do lobo superior direito, que mostra a extensão periférica da embolia.',
    ),
    middle: x(
      'Trombo no ramo do lobo médio. Ramos segmentares são acompanhados pelo brônquio correspondente, o que ajuda a identificá-los.',
    ),
    flattening: x(
      'Normalmente o septo interventricular se curva em direção ao ventrículo direito, porque a pressão do esquerdo é maior. Quando a pressão do direito sobe de forma aguda, o septo se retifica ou se curva para o lado esquerdo. É sinal de sobrecarga de pressão e de embolia com repercussão hemodinâmica.',
    ),
    'right ventricle': x(
      'Ventrículo direito maior que o esquerdo, com relação VD/VE acima de 1 no plano axial, indica disfunção aguda. Esse dado, e não o tamanho do trombo, é o que estratifica o risco de morte e orienta a trombólise.',
    ),
    subsegmental: x(
      'Falhas em ramos subsegmentares mostram como a embolia se fragmentou e chegou à periferia. Isoladas, em paciente estável, podem ter importância menor; aqui fazem parte de embolia maciça.',
    ),
    'left subsegmental': x(
      'Trombo em ramo subsegmentar do pulmão esquerdo. Avaliar ramos periféricos exige boa opacificação e cortes finos — artefato de movimento e de fluxo simulam falhas.',
    ),
  },
  'disseccao-de-aorta-tipo-a': {
    'intimal flap': x(
      'Uma ruptura da íntima deixa o sangue entrar na camada média e abrir um canal falso. A íntima descolada vira uma membrana fina e ondulada dentro da aorta, separando dois canais com contraste. Visto em vários cortes e em reconstruções, o flap confirma a dissecção.',
      'Artefato de movimento na raiz aórtica imita flap; ele some em reconstruções sincronizadas e não continua coerente nos cortes seguintes.',
    ),
    'true lumen': x(
      'A luz verdadeira é a continuação da luz normal da aorta, geralmente menor e mais densa na fase arterial, porque recebe o fluxo principal. É dela que saem habitualmente os ramos que mantêm a perfusão; identificá-la importa para o reparo endovascular.',
    ),
    'false lumen': x(
      'A luz falsa costuma ser maior, com fluxo mais lento e às vezes trombo parcial. Pode ter fios finos de tecido — o sinal da teia de aranha. Ela tende a crescer com o tempo e é a que rompe.',
    ),
    'coeliac trunk': x(
      'A dissecção que chega ao tronco celíaco pode reduzir o fluxo para fígado, baço e estômago. Avaliar se cada ramo nasce da luz verdadeira, da falsa ou de ambas é parte obrigatória do laudo.',
    ),
    SMA: x(
      'Se a mesentérica superior for comprometida, o intestino pode sofrer isquemia — complicação grave que muda a urgência do tratamento. Dor abdominal na dissecção é sinal de alarme.',
    ),
    'intraluminal filling defects': x(
      'Trombo dentro da luz falsa aparece como material sem contraste. Trombose parcial da luz falsa se associa a maior risco de crescimento e ruptura.',
    ),
    'left renal artery': x(
      'Comprometimento da artéria renal pode causar isquemia renal, hipertensão e insuficiência renal. O rim hipoperfundido aparece com realce reduzido.',
    ),
  },
  'aneurisma-de-aorta-toracica': {
    'thoracic aortic aneurysm': x(
      'Aneurisma é dilatação permanente acima de 1,5 vez o diâmetro esperado. A aorta descendente normal mede até cerca de 2,5 cm; aqui está muito maior e tortuosa. Mede-se perpendicularmente ao eixo do vaso, de parede externa a parede externa.',
      'Num vaso tortuoso, a medida em corte axial superestima o diâmetro; use reconstrução perpendicular ao eixo.',
    ),
    'eccentric luminal thrombus': x(
      'O fluxo lento nas paredes do aneurisma forma trombo em camadas, aderido e excêntrico, com a luz contrastada deslocada. O trombo não protege contra a ruptura; o que importa é o diâmetro total.',
      'Crescente hiperdenso dentro do trombo na fase sem contraste é sinal de ruptura iminente.',
    ),
  },
  'enfisema-centrolobular': {
    'destructive emphysema': x(
      'Nas áreas mais avançadas, a destruição dos septos alveolares é tão extensa que o pulmão vira grandes espaços pretos sem estrutura, com vasos escassos e afilados. A densidade fica abaixo de –950 UH, valor usado para quantificar enfisema.',
    ),
    centrilobular: x(
      'O enfisema centrolobular começa em volta do bronquíolo respiratório, no centro do lóbulo pulmonar secundário. Na TC, aparece como pequenos buracos redondos sem parede, com um ponto no meio — a artéria centrolobular. Predomina nos lobos superiores, porque ali a ventilação é maior e a fumaça se deposita mais.',
      'Cisto tem parede fina e visível; enfisema não tem parede.',
    ),
  },
  'bronquiectasias-cisticas': {
    'diffuse bronchial wall thicke': x(
      'A inflamação crônica espessa as paredes brônquicas, que aparecem como anéis mais grossos que o normal e como linhas paralelas — os trilhos de trem — quando o brônquio é cortado ao longo do seu eixo.',
    ),
    'string of pearls sign': x(
      'Na bronquiectasia varicosa, o brônquio alterna dilatações e estreitamentos ao longo do trajeto, como contas de um colar. O aspecto lembra veias varicosas, daí o nome.',
    ),
    'air–fluid levels': x(
      'Bronquiectasias císticas retêm secreção. Com o paciente deitado, a secreção decanta e forma níveis horizontais com o ar por cima. Indicam muco estagnado e infecção.',
    ),
    'bunch of grapes sign': x(
      'Brônquios císticos agrupados lado a lado lembram um cacho de uvas. É a forma mais grave de bronquiectasia, em que os brônquios terminam em sacos.',
    ),
    'cystic bronchiectasis': x(
      'Brônquios dilatados em sacos redondos, de paredes visíveis, que terminam em fundo cego. Diferenciam-se de cistos pulmonares porque se conectam à árvore brônquica e estão ao lado de uma artéria.',
    ),
    'signet-ring sign': x(
      'Em corte transversal, o brônquio e a artéria pulmonar correm juntos e têm calibre semelhante. Quando o brônquio fica maior que a artéria, o par lembra um anel de sinete: o anel é o brônquio, a pedra é a artéria. Relação broncoarterial acima de 1 é o critério de bronquiectasia.',
      'Na altitude e em idosos, o brônquio pode ser discretamente maior que a artéria sem doença; procure também a falta de afilamento e o brônquio a menos de 1 cm da pleura.',
    ),
    'varicose bronchiectasis': x(
      'Brônquio de contorno irregular, com calibre que varia ao longo do trajeto. É o grau intermediário entre a forma cilíndrica, de paredes paralelas, e a cística.',
    ),
  },
  'fibrose-pulmonar-uip': {
    basal: x(
      'O gradiente da fibrose na pneumonia intersticial usual é ápico-basal: as bases são as mais acometidas, provavelmente pela maior distensão mecânica a cada inspiração. Comparar ápices e bases no mesmo exame mostra o gradiente.',
    ),
    honeycombing: x(
      'Faveolamento são cistos aéreos de 3 a 10 mm, de paredes espessas e compartilhadas, empilhados em mais de uma camada junto à pleura. Representam pulmão destruído e remodelado — fibrose terminal e irreversível. É o marco do padrão UIP.',
      'Enfisema parasseptal também forma cistos subpleurais, mas em uma camada só, com paredes finas e sem reticulação ao redor.',
    ),
    subpleural: x(
      'A doença começa na periferia, colada à pleura, e avança para o centro. Essa distribuição subpleural, com bases mais acometidas, é a assinatura do padrão UIP.',
    ),
  },
  'fibrose-cistica': {
    bronchiectases: x(
      'O muco espesso da fibrose cística obstrui as vias aéreas, prende bactérias e mantém um ciclo de infecção e inflamação que destrói as paredes brônquicas. As bronquiectasias predominam nos lobos superiores, ao contrário das pós-infecciosas, que preferem as bases.',
    ),
    'tree-in-bud': x(
      'Bronquíolos cheios de muco ou pus ficam visíveis como pequenas ramificações com nódulos nas pontas, lembrando galhos com brotos. Estão a poucos milímetros da pleura, no centro dos lóbulos. Indicam doença das pequenas vias aéreas ativa.',
    ),
  },
  'tuberculose-cavitaria': {
    'tree in bud nodules': x(
      'O material caseoso da cavidade escorre pelos brônquios e preenche bronquíolos de outras regiões, formando árvore em brotamento. É sinal de disseminação broncogênica — doença ativa e transmissível.',
      'Árvore em brotamento ao lado de cavidade em paciente com tosse crônica é tuberculose ativa até prova contrária: isolamento respiratório.',
    ),
    cavities: x(
      'A necrose caseosa liquefeita é expectorada e deixa uma cavidade cheia de ar, de parede espessa. Nos lobos superiores, onde a tensão de oxigênio é maior e o bacilo prolifera melhor, é a forma clássica da tuberculose de reativação.',
    ),
    consolidation: x(
      'Em volta das cavidades, o pulmão está preenchido por exsudato inflamatório. A consolidação mostra a área de pneumonia tuberculosa da qual a cavidade nasceu.',
    ),
  },
  'empiema-pleura-dividida': {
    atelectasis: x(
      'O pulmão vizinho à coleção é comprimido e perde ar: atelectasia passiva. Ele realça com contraste e tem forma de cunha, o que o diferencia da coleção, que não realça.',
    ),
    'pleural fluid accumulation': x(
      'O empiema forma uma coleção lenticular de bordas lisas e ângulos obtusos com a parede, porque fica entre as pleuras. As pleuras visceral e parietal, espessadas e realçadas, são separadas pelo líquido — o sinal da pleura dividida. Diferente do abscesso pulmonar, que é redondo e destrói o parênquima.',
      'O sinal da pleura dividida sugere exsudato infectado, mas também aparece em hemotórax e após pleurodese; a punção confirma.',
    ),
  },
  piopneumotorax: {
    'partial collapse': x(
      'O pulmão comprimido pela coleção pleural perde volume e fica mais denso. Ao drenar a coleção, deve reexpandir; se não reexpandir, pode haver pleura espessa demais — a carapaça que exige decorticação.',
    ),
    multilobed: x(
      'Septos de fibrina dividem a coleção em lojas, típicas da fase fibrinopurulenta do empiema. Coleção septada drena mal por um dreno só e pode exigir fibrinolítico ou videotoracoscopia.',
    ),
    'air-fluid level': x(
      'Ar e líquido no espaço pleural formam uma interface reta. Sem procedimento prévio, ar na pleura indica fístula broncopleural ou germe produtor de gás. O nível pleural se estende ao longo da parede e tem comprimento diferente em incidências diferentes, ao contrário do nível dentro de um abscesso.',
    ),
  },
  'pericardite-purulenta': {
    'Rim-enhancing effusion': x(
      'O pericárdio normal é uma linha fina de até 2 a 3 mm. Aqui há líquido abundante e o pericárdio espessado realça com contraste, o que indica inflamação. Derrame volumoso dificulta o enchimento do coração e leva ao tamponamento — diagnóstico clínico e ecocardiográfico, não tomográfico.',
      'A densidade do líquido ajuda pouco a distinguir pus de transudato; quem decide é a punção.',
    ),
  },
  'cancer-de-pulmao-espiculado': {
    'high attenuation': x(
      'No estudo PET-CT, este foco pleural captava glicose marcada — sinal de células tumorais com metabolismo alto. Na TC, aparece como espessamento ou nódulo pleural. Implante pleural muda o estadiamento para doença metastática e tira a cirurgia curativa do horizonte.',
    ),
    'Spiculated mass': x(
      'Espículas são extensões finas do tumor para o parênquima vizinho e a tração da fibrose que ele provoca. Massa espiculada em fumante é carcinoma até prova contrária. O tamanho, a relação com a pleura e o mediastino e os linfonodos definem o estadiamento.',
    ),
    nodule: x(
      'Um nódulo adicional pode ser satélite no mesmo lobo, metástase em outro lobo ou lesão benigna. A localização muda o estadiamento, e por isso cada nódulo merece descrição.',
    ),
    emphysema: x(
      'O enfisema de fundo marca o tabagismo e reduz a reserva respiratória — dado que pesa na decisão de cirurgia ou radioterapia.',
    ),
  },
  'trauma-toracico-contuso': {
    'receding pulmonary contusions': x(
      'Contusão é sangue e edema nos alvéolos sem ruptura do pulmão. Aparece em horas após o trauma e regride em três a sete dias. Opacidade que piora depois desse prazo sugere pneumonia ou síndrome do desconforto respiratório, não contusão.',
    ),
    'pulmonary laceration': x(
      'Na laceração, o pulmão rompe e a retração elástica abre uma cavidade cheia de ar ou de sangue — a pneumatocele traumática. Pode persistir por semanas e confundir com abscesso se o contexto for esquecido.',
    ),
    pneumothorax: x(
      'Ar entre a pleura e o pulmão aparece como faixa preta sem vasos, geralmente anterior no paciente deitado. A TC detecta pneumotórax que a radiografia em supino não mostra — o pneumotórax oculto.',
      'Pneumotórax pequeno no paciente que vai ser ventilado com pressão positiva pode crescer rapidamente; considere drenagem.',
    ),
    'subcutaneous emphysema': x(
      'Ar nas partes moles da parede torácica forma estrias pretas entre músculos e gordura. Vem do pulmão lesado ou de fratura de costela e indica comunicação entre a via aérea ou a pleura e a parede.',
    ),
  },
}
