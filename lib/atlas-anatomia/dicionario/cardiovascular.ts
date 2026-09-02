import type { EntradaDicionario } from './tipos'

/**
 * Coração e vasos.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const CARDIOVASCULAR: EntradaDicionario[] = [
  {
    termos: ['Artéria Basilar'],
    resumo: 'Artéria única formada pela união das duas vertebrais, na face anterior da ponte.',
    localizacao: 'No sulco basilar, à frente da ponte, terminando na bifurcação em artérias cerebrais posteriores.',
    funcao: 'Irriga a ponte, o cerebelo (AICA e cerebelar superior) e a orelha interna (artéria labiríntica).',
    clinica:
      'A trombose da basilar é catastrófica e pode gerar a síndrome do encarceramento (locked-in), com tetraplegia e preservação apenas dos movimentos oculares verticais e da consciência.',
    pontos: ['União das duas vertebrais', 'Ramos: AICA, cerebelar superior, labiríntica', 'Trombose e síndrome locked-in'],
  },
  {
    termos: ['Artéria Meníngea Média'],
    resumo: 'Ramo da artéria maxilar que irriga a dura-máter e o osso da calvária.',
    localizacao: 'Entra no crânio pelo forame espinhoso e sulca a face interna do parietal, com o ramo anterior passando junto ao ptério.',
    funcao: 'Irriga a dura-máter e a díploe; não irriga o encéfalo.',
    clinica:
      'Sua ruptura no ptério produz o hematoma extradural: intervalo lúcido, deterioração rápida, midríase ipsilateral e imagem em lente biconvexa que não cruza suturas. É emergência neurocirúrgica.',
    pontos: ['Entra pelo forame espinhoso', 'Ramo anterior corre sob o ptério', 'Hematoma extradural biconvexo'],
  },
  {
    termos: ['Artéria Radial'],
    resumo: 'Ramo lateral da bifurcação da braquial, o pulso mais palpado da medicina.',
    localizacao:
      'Desce no antebraço lateralmente ao flexor radial do carpo, torna-se superficial acima do processo estiloide do rádio, cruza a tabaqueira anatômica e forma o arco palmar profundo.',
    funcao: 'Irriga o lado lateral do antebraço e, pelo arco palmar profundo, a maior parte da mão profunda.',
    clinica:
      'É o sítio do pulso radial, da gasometria arterial e do acesso do cateterismo. O teste de Allen verifica a perviedade do arco palmar antes da punção. É também a artéria doadora do enxerto radial na revascularização miocárdica.',
    pontos: ['Pulso radial e gasometria arterial', 'Teste de Allen antes da punção', 'Cruza a tabaqueira anatômica'],
  },
  {
    termos: ['Artéria Ulnar'],
    resumo: 'O maior ramo da bifurcação da artéria braquial, no lado medial do antebraço.',
    localizacao: 'Desce medialmente, acompanhada pelo nervo ulnar na metade distal, passa pelo canal de Guyon e forma o arco palmar superficial.',
    funcao: 'Irriga o lado medial do antebraço e a maior parte da mão superficial, além de originar a artéria interóssea comum.',
    clinica: 'Sua contribuição dominante ao arco palmar superficial é o que torna segura a punção radial quando o teste de Allen é normal. No canal de Guyon, pode ser comprimida junto ao nervo ulnar (síndrome do martelo hipotenar).',
    pontos: ['Forma o arco palmar superficial', 'Origina a interóssea comum', 'Canal de Guyon com o nervo ulnar'],
  },
  {
    termos: ['Artéria Mesentérica Superior'],
    resumo: 'Ramo ímpar da aorta que irriga todo o intestino médio.',
    localizacao: 'Sai da aorta em L1, atrás do colo do pâncreas, e cruza à frente do processo uncinado e da terceira porção do duodeno.',
    funcao: 'Irriga do duodeno distal até os dois terços proximais do cólon transverso.',
    clinica:
      'A embolia da mesentérica superior causa isquemia mesentérica aguda: dor desproporcional ao exame físico, com acidose e má evolução se não for revascularizada. A síndrome da pinça aortomesentérica comprime a terceira porção do duodeno entre a artéria e a aorta.',
    pontos: ['L1 — irriga o intestino médio', 'Isquemia mesentérica: dor desproporcional ao exame', 'Síndrome da pinça aortomesentérica'],
  },
  {
    termos: ['Artéria Interventricular Anterior'],
    resumo: 'Tronco coronário esquerdo e seus dois ramos: interventricular anterior e circunflexa.',
    localizacao:
      'O tronco sai do seio aórtico esquerdo e logo se divide: a interventricular anterior desce no sulco interventricular anterior; a circunflexa corre no sulco coronário esquerdo até a face posterior.',
    funcao:
      'A interventricular anterior irriga a parede anterior do ventrículo esquerdo, os dois terços anteriores do septo e o ápice; a circunflexa irriga a parede lateral e, na dominância esquerda, a parede inferior.',
    clinica:
      'A interventricular anterior é a "viúva" (widow maker): sua oclusão proximal produz infarto anterior extenso (V1–V4), com alto risco de choque cardiogênico e arritmia. A circunflexa dá o infarto lateral (DI, aVL, V5–V6), frequentemente eletrocardiograficamente silencioso.',
    pontos: ['Interventricular anterior = widow maker; V1–V4', 'Circunflexa: parede lateral; DI, aVL, V5–V6', 'Dominância definida por quem dá a interventricular posterior'],
  },
  {
    termos: ['Artéria Renal'],
    resumo: 'Ramo par e curto da aorta abdominal que irriga o rim.',
    localizacao: 'Sai da aorta entre L1 e L2, abaixo da mesentérica superior; a direita é mais longa e passa atrás da veia cava inferior.',
    funcao: 'Conduz cerca de 20–25% do débito cardíaco aos rins, sustentando a filtração glomerular.',
    clinica:
      'A estenose de artéria renal causa hipertensão renovascular por ativação do sistema renina-angiotensina, com sopro abdominal e piora da função renal após inibidor da ECA. Suas artérias segmentares são terminais — a oclusão de uma causa infarto do segmento correspondente.',
    pontos: ['L1–L2; a direita passa atrás da cava', 'Hipertensão renovascular', 'Artérias segmentares são terminais'],
  },
  {
    termos: ['Veia Cava Superior'],
    resumo: 'Tronco venoso que devolve ao coração o sangue da metade superior do corpo.',
    localizacao: 'Formada pela união das veias braquiocefálicas atrás do 1º cartilagem costal direita, desce no mediastino superior e desemboca no átrio direito.',
    funcao: 'Drena cabeça, pescoço, membros superiores e parede torácica.',
    clinica:
      'A síndrome da veia cava superior — mais comumente por neoplasia pulmonar — causa edema em esclavina, cianose facial, turgência jugular e circulação colateral no tórax. A ponta do cateter venoso central deve ficar na junção cavo-atrial.',
    pontos: ['União das veias braquiocefálicas', 'Síndrome da cava superior por tumor', 'Alvo da ponta do cateter central'],
  },
  {
    termos: ['Veia Cava Inferior'],
    resumo: 'A maior veia do corpo, que devolve ao coração o sangue da metade inferior.',
    localizacao: 'Formada pela união das ilíacas comuns em L5, sobe à direita da aorta, atravessa o centro tendíneo do diafragma em T8 e entra no átrio direito.',
    funcao: 'Drena membros inferiores, pelve, abdome e as veias hepáticas.',
    clinica:
      'Sua compressão pelo útero gravídico causa a síndrome da hipotensão supina, corrigida com decúbito lateral esquerdo. O diâmetro e a colapsabilidade da cava ao ultrassom estimam a volemia. Filtros de cava previnem embolia pulmonar quando a anticoagulação está contraindicada.',
    pontos: ['Atravessa o diafragma em T8', 'Compressão pelo útero gravídico', 'Ultrassom da cava estima volemia'],
  },
  {
    termos: ['Veia Porta'],
    resumo: 'Veia que leva ao fígado o sangue drenado de todo o tubo digestório e do baço.',
    localizacao: 'Formada atrás do colo do pâncreas pela união das veias mesentérica superior e esplênica, sobe no ligamento hepatoduodenal até o hilo hepático.',
    funcao: 'Conduz ao fígado os nutrientes absorvidos no intestino, sujeitando-os ao metabolismo de primeira passagem antes da circulação sistêmica.',
    relacoes: 'No ligamento hepatoduodenal está a tríade portal: veia porta atrás, artéria hepática à esquerda e ducto colédoco à direita.',
    clinica:
      'A hipertensão portal desvia sangue pelas anastomoses portossistêmicas: varizes esofágicas, hemorroidas e cabeça de medusa. É por drenar para a porta que a metástase colorretal vai primeiro ao fígado, e por isso que fármacos sublinguais e retais baixos escapam da primeira passagem.',
    pontos: [
      'Mesentérica superior + esplênica atrás do colo do pâncreas',
      'Anastomoses portossistêmicas: esôfago, reto e umbigo',
      'Metabolismo de primeira passagem',
    ],
  },
  {
    termos: ['Veia Safena Magna'],
    resumo: 'A veia mais longa do corpo, superficial, na face medial do membro inferior.',
    localizacao: 'Do arco venoso dorsal do pé, passa à frente do maléolo medial, sobe pela face medial da perna e da coxa e desemboca na veia femoral pelo hiato safeno.',
    funcao: 'Drena o território superficial medial do membro inferior, dependendo de valvas e da bomba muscular.',
    inervacao: 'Acompanhada pelo nervo safeno na perna — daí a parestesia medial após safenectomia.',
    clinica:
      'É o enxerto clássico da revascularização miocárdica e de bypass periférico. Sua posição constante à frente do maléolo medial é o local da dissecção venosa de emergência. A incompetência da junção safenofemoral produz varizes.',
    pontos: ['À frente do maléolo medial — dissecção venosa', 'Enxerto de revascularização', 'Junção safenofemoral e varizes'],
  },
  {
    termos: ['Veia Safena Parva'],
    resumo: 'Veia superficial da face posterior da perna.',
    localizacao: 'Do arco venoso dorsal, passa atrás do maléolo lateral e sobe na linha média da panturrilha até a fossa poplítea, onde desemboca na veia poplítea.',
    funcao: 'Drena a face posterolateral da perna e do pé.',
    inervacao: 'Acompanhada pelo nervo sural, referência da biópsia de nervo.',
    clinica: 'A insuficiência da junção safenopoplítea é causa de varizes posteriores; o nervo sural, que a acompanha, é o nervo doador padrão para enxerto e biópsia.',
    pontos: ['Atrás do maléolo lateral', 'Desemboca na veia poplítea', 'Acompanhada pelo nervo sural'],
  },
  {
    termos: ['Veia Cefálica'],
    resumo: 'Veias superficiais do membro superior, o alvo de quase toda punção venosa.',
    localizacao:
      'A cefálica corre lateralmente e sobe pelo sulco deltopeitoral até a axilar; a basílica corre medialmente e perfura a fáscia no braço; a mediana cubital as conecta na fossa cubital.',
    funcao: 'Drenam o território superficial do membro superior e participam da termorregulação.',
    clinica:
      'A veia mediana cubital é a mais puncionada do corpo. Está separada da artéria braquial e do nervo mediano apenas pela aponeurose bicipital. A cefálica é usada para marca-passo e a basílica, para PICC, por seu calibre e trajeto retilíneo.',
    pontos: ['Mediana cubital: punção venosa e coleta', 'Aponeurose bicipital protege artéria e nervo', 'Basílica é a preferida para PICC'],
  },
  {
    termos: ['Seio Sagital Superior'],
    resumo: 'Seio venoso da dura-máter que corre na margem superior da foice do cérebro.',
    localizacao: 'Da crista galli até a confluência dos seios, na linha média da convexidade.',
    funcao: 'Recebe as veias cerebrais superficiais superiores e absorve o líquido cerebrospinal pelas granulações aracnóideas que se projetam em suas lacunas laterais.',
    clinica:
      'As veias-ponte que desembocam nele são as que rompem no hematoma subdural, sobretudo no idoso com atrofia cerebral. A trombose do seio sagital superior causa cefaleia, papiledema, crises e infartos venosos parassagitais bilaterais.',
    pontos: ['Absorção liquórica pelas granulações aracnóideas', 'Veias-ponte e hematoma subdural', 'Trombose com infartos parassagitais'],
  },
  {
    termos: ['Átrio Direito'],
    resumo: 'Câmara de recepção do sangue venoso sistêmico, à direita e à frente no coração.',
    localizacao: 'Forma a margem direita do coração; recebe as veias cavas superior e inferior e o seio coronário, com a aurícula direita à frente.',
    funcao: 'Recebe todo o retorno venoso sistêmico e coronário e o entrega ao ventrículo direito pela valva tricúspide.',
    vascularizacao: 'Artéria coronária direita.',
    inervacao: 'O nó sinoatrial, seu marca-passo, fica junto à desembocadura da cava superior, na crista terminal.',
    relacoes: 'A fossa oval, na parede septal, é o vestígio do forame oval fetal.',
    clinica:
      'A pressão do átrio direito é o que se estima pela turgência jugular e pela cava inferior ao ultrassom. A forame oval patente (em ~25% dos adultos) permite embolia paradoxal. É a câmara-alvo do cateter venoso central e do marca-passo transvenoso.',
    pontos: ['Recebe cavas e seio coronário', 'Nó sinoatrial na crista terminal', 'Fossa oval e embolia paradoxal'],
  },
  {
    termos: ['Ventrículo Direito'],
    resumo: 'Câmara de bombeamento da circulação pulmonar, a mais anterior do coração.',
    localizacao: 'Forma a maior parte da face esternocostal do coração, atrás do esterno, com parede fina (3–5 mm) e trabéculas carnosas grosseiras.',
    funcao: 'Bombeia o sangue venoso ao tronco pulmonar contra a baixa resistência do circuito pulmonar — por isso a parede é fina.',
    vascularizacao: 'Artéria coronária direita.',
    relacoes: 'A trabécula septomarginal (banda moderadora) conduz o ramo direito do feixe atrioventricular até o músculo papilar anterior.',
    clinica:
      'Por ser a câmara mais anterior, é a mais lesada no trauma torácico penetrante e a puncionada acidentalmente na pericardiocentese. O infarto de ventrículo direito, associado ao infarto inferior, é pré-carga-dependente: contraindica nitrato e exige volume.',
    pontos: ['Câmara mais anterior — trauma e pericardiocentese', 'Parede fina, baixa resistência pulmonar', 'Banda moderadora conduz o ramo direito'],
  },
  {
    termos: ['Átrio Esquerdo', 'Àtrio Esquerdo'],
    resumo: 'Câmara mais posterior do coração, que recebe o sangue oxigenado dos pulmões.',
    localizacao: 'Na face posterior do coração, à frente do esôfago, recebendo as quatro veias pulmonares.',
    funcao: 'Recebe o sangue arterializado e o entrega ao ventrículo esquerdo pela valva mitral.',
    vascularizacao: 'Artéria circunflexa.',
    relacoes: 'Sua relação posterior com o esôfago é o que torna possível o ecocardiograma transesofágico com imagens tão nítidas dessa câmara.',
    clinica:
      'A estenose mitral dilata o átrio esquerdo, que pode comprimir o esôfago (disfagia) e o laríngeo recorrente esquerdo (rouquidão — sinal de Ortner). Sua dilatação é substrato da fibrilação atrial, e a aurícula esquerda é o sítio de formação de trombos e origem de AVC cardioembólico.',
    pontos: ['Câmara mais posterior — janela do eco transesofágico', 'Recebe as quatro veias pulmonares', 'Aurícula esquerda e trombo na fibrilação atrial'],
  },
  {
    termos: ['Ventrículo Esquerdo'],
    resumo: 'Câmara de maior pressão do coração, que bombeia o sangue para toda a circulação sistêmica.',
    localizacao: 'Forma o ápice e a margem esquerda do coração, com parede de 8 a 12 mm — cerca de três vezes a do direito.',
    funcao: 'Ejeta o sangue na aorta contra a alta resistência sistêmica; sua fração de ejeção é a medida central da função cardíaca.',
    vascularizacao: 'Artérias interventricular anterior, circunflexa e, na parede inferior, coronária direita ou circunflexa conforme a dominância.',
    clinica:
      'O ictus cordis, no 5º espaço intercostal esquerdo na linha hemiclavicular, corresponde ao seu ápice; desvio lateral indica dilatação. A hipertrofia por sobrecarga de pressão (hipertensão, estenose aórtica) difere da dilatação por sobrecarga de volume (insuficiência mitral ou aórtica).',
    pontos: ['Parede ~3x mais espessa que a do VD', 'Ictus cordis no 5º EIC, linha hemiclavicular', 'Hipertrofia (pressão) x dilatação (volume)'],
  },
  {
    termos: ['Valva Aórtica'],
    resumo: 'Valva semilunar de três válvulas entre o ventrículo esquerdo e a aorta.',
    localizacao: 'Na saída do ventrículo esquerdo, com os seios aórticos direito e esquerdo dando origem às artérias coronárias.',
    funcao: 'Impede o refluxo da aorta para o ventrículo durante a diástole; sua abertura define o início da ejeção.',
    clinica:
      'A estenose aórtica dá sopro sistólico em ejeção irradiado para as carótidas, com a tríade angina, síncope e dispneia. A valva aórtica bicúspide é a malformação cardíaca mais comum e antecipa a estenose. A insuficiência aórtica dá sopro diastólico aspirativo e pulso amplo (martelo d\'água).',
    pontos: ['Coronárias nascem dos seios aórticos', 'Estenose: angina, síncope e dispneia', 'Valva bicúspide é a malformação mais comum'],
  },
  {
    termos: ['Valva Pulmonar'],
    resumo: 'Valva semilunar entre o ventrículo direito e o tronco pulmonar.',
    localizacao: 'Na via de saída do ventrículo direito, no infundíbulo (cone arterial).',
    funcao: 'Impede o refluxo do tronco pulmonar para o ventrículo direito na diástole.',
    clinica:
      'Ausculta-se no 2º espaço intercostal esquerdo. O desdobramento fisiológico da segunda bulha na inspiração acontece porque o componente pulmonar atrasa com o aumento do retorno venoso. A estenose pulmonar integra a tetralogia de Fallot.',
    pontos: ['2º EIC esquerdo', 'Desdobramento fisiológico de B2', 'Estenose na tetralogia de Fallot'],
  },
  {
    termos: ['Septo Interventricular'],
    resumo: 'Parede que separa os dois ventrículos, com uma porção muscular espessa e uma membranácea fina.',
    localizacao: 'Entre os ventrículos, com a parte membranácea logo abaixo da valva aórtica e a muscular formando o restante.',
    funcao: 'Separa as circulações e conduz, na sua porção subendocárdica, os ramos do feixe atrioventricular.',
    vascularizacao: 'Dois terços anteriores pela interventricular anterior; terço posterior pela interventricular posterior.',
    clinica:
      'A comunicação interventricular é a cardiopatia congênita mais comum e acomete tipicamente a porção membranácea. A ruptura do septo pós-infarto é complicação mecânica grave, com sopro holossistólico novo e choque.',
    pontos: ['Porção membranácea é o sítio da CIV congênita', 'Conduz os ramos do feixe atrioventricular', 'Ruptura pós-infarto é complicação mecânica'],
  },
  {
    termos: ['Coração'],
    classe: 'camara-cardiaca',
    resumo: 'Órgão muscular oco do mediastino médio: duas bombas em série dentro do mesmo saco pericárdico.',
    localizacao:
      'Entre os pulmões, sobre o diafragma e atrás do esterno, com dois terços à esquerda da linha mediana. Tem base voltada para cima e para trás (átrios e grandes vasos) e ápice para baixo, à frente e à esquerda, no 5º espaço intercostal.',
    funcao:
      'O lado direito recebe o retorno venoso e o manda aos pulmões; o esquerdo recebe o sangue arterializado e o ejeta na aorta. As duas bombas trabalham em série, com o mesmo débito, e é por isso que a falência de uma repercute na outra.',
    vascularizacao:
      'Coronárias direita e esquerda, os primeiros ramos da aorta, saindo dos seios aórticos; drenagem pelas veias cardíacas para o seio coronário e daí para o átrio direito.',
    inervacao:
      'Plexo cardíaco: simpático acelera e aumenta a força, vago desacelera. A dor cardíaca sobe por fibras simpáticas até T1–T4, o que explica a irradiação para o membro superior esquerdo e para a mandíbula.',
    relacoes: 'À frente, o esterno; atrás, o esôfago (janela do ecocardiograma transesofágico); abaixo, o diafragma; dos lados, os pulmões e os nervos frênicos.',
    clinica:
      'O ictus cordis no 5º espaço intercostal esquerdo, na linha hemiclavicular, é a projeção do ápice — seu desvio lateral indica dilatação. Como a bomba direita é anterior, ela é a mais lesada no trauma torácico penetrante.',
    pontos: [
      'Mediastino médio, dentro do pericárdio',
      'Ápice no 5º EIC esquerdo, linha hemiclavicular',
      'Duas bombas em série, mesmo débito',
    ],
  },
  {
    termos: ['Tronco Pulmonar'],
    classe: 'arteria',
    resumo: 'Grande vaso que sai do ventrículo direito levando sangue venoso aos pulmões — a artéria que carrega sangue pobre em oxigênio.',
    localizacao:
      'Emerge do cone arterial do ventrículo direito, à frente e à esquerda da aorta ascendente, e após cerca de 5 cm se bifurca, sob o arco aórtico, nas artérias pulmonares direita e esquerda.',
    funcao: 'Conduz todo o débito do ventrículo direito à circulação pulmonar, num regime de baixa pressão e baixa resistência.',
    relacoes:
      'O ligamento arterial — resquício do ducto arterial fetal — liga sua bifurcação ao arco aórtico, e é justamente por baixo dele que o nervo laríngeo recorrente esquerdo faz a curva.',
    clinica:
      'A bifurcação é onde impacta o êmbolo em sela do tromboembolismo pulmonar maciço. A persistência do ducto arterial mantém o desvio esquerda-direita do período fetal e produz sopro contínuo, em maquinaria.',
    pontos: [
      'Artéria com sangue venoso, do VD aos pulmões',
      'Ligamento arterial e o laríngeo recorrente esquerdo',
      'Êmbolo em sela na bifurcação',
    ],
  },
  {
    termos: ['Aurícula Direita', 'Aurícula Esquerda'],
    classe: 'camara-cardiaca',
    resumo: 'Apêndice em forma de orelha que prolonga cada átrio para a frente, com parede trabeculada por músculos pectíneos.',
    localizacao: 'A direita cobre a raiz da aorta; a esquerda contorna o tronco pulmonar, na face anterior do coração.',
    funcao: 'Aumenta a complacência do átrio e acrescenta um pequeno volume ao enchimento ventricular na sístole atrial.',
    clinica:
      'A aurícula esquerda é o principal sítio de formação de trombo na fibrilação atrial — o fluxo lento numa cavidade trabeculada é o cenário perfeito. É de lá que sai a maior parte dos AVC cardioembólicos, e é por isso que existem a anticoagulação e o oclusor de aurícula.',
    pontos: [
      'Músculos pectíneos revestem sua parede',
      'Aurícula esquerda: trombo na fibrilação atrial',
      'Origem do AVC cardioembólico',
    ],
  },
]
