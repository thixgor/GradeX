import type { EntradaDicionario } from './tipos'

/**
 * Tronco encefálico e cerebelo.
 *
 * No tronco, cada milímetro conta: em nenhum outro lugar do corpo tantas vias e
 * tantos núcleos convivem em tão pouco espaço. Por isso a regra de ouro que
 * organiza este arquivo é a "regra dos quatro": quatro estruturas na linha
 * média, quatro laterais, quatro nervos cranianos por andar. Quem entende que
 * um déficit cruzado — nervo craniano de um lado, corpo do outro — é sinônimo de
 * lesão de tronco, já localiza metade das síndromes sem decorar nome próprio.
 */
export const NEURO_TRONCO_CEREBELO: EntradaDicionario[] = [
  /* ─────────────────── Bulbo ─────────────────── */
  {
    termos: ['Pirâmide Bulbar'],
    classe: 'snc',
    resumo: 'Coluna longitudinal na face anterior do bulbo, formada pelas fibras do trato corticoespinal.',
    localizacao: 'Face anterior do bulbo, de cada lado da fissura mediana anterior, entre o sulco bulbopontino e a decussação.',
    funcao: 'Conduz o trato corticoespinal — a via do movimento voluntário — do córtex motor à medula. É a via mais direta e mais rápida do sistema motor.',
    vascularizacao: 'Artéria espinal anterior e ramos paramedianos da artéria vertebral.',
    relacoes: 'A oliva bulbar está lateralmente, separada pelo sulco lateral anterior, por onde emerge o nervo hipoglosso.',
    clinica:
      'A síndrome medular medial (de Déjerine) reúne exatamente as três estruturas paramedianas desse nível: pirâmide (hemiparesia contralateral), lemnisco medial (perda de propriocepção e tato fino contralaterais) e nervo hipoglosso (língua desviando para o lado da lesão). É a demonstração mais limpa da regra dos quatro na linha média.',
    memoria:
      'Na linha média do bulbo há três coisas: Motor, lemnisco Medial e o XII (Motor da língua). Todas começam com M — e todas caem juntas.',
    pontos: [
      'Que via a pirâmide bulbar conduz?',
      'Que estruturas compõem a síndrome medular medial?',
      'Para que lado a língua desvia nessa síndrome?',
    ],
  },
  {
    termos: ['Decussação das Pirâmides'],
    classe: 'snc',
    resumo: 'Cruzamento das fibras corticoespinais na transição bulbomedular.',
    localizacao: 'Extremidade inferior do bulbo, onde as pirâmides se entrecruzam antes de entrar na medula.',
    funcao:
      'Cerca de 85 a 90% das fibras corticoespinais cruzam aqui para o lado oposto, formando o trato corticoespinal lateral; o restante desce sem cruzar como trato corticoespinal anterior e cruza mais abaixo, no próprio segmento medular.',
    vascularizacao:
      'Artéria espinal anterior e ramos paramedianos das artérias vertebrais. Território estritamente paramediano, sem colateral — e é essa dependência de um vaso único na linha média que faz a síndrome bulbar medial existir como quadro isolado.',
    relacoes: 'Marca o limite anatômico entre o bulbo e a medula espinal.',
    clinica:
      'É a razão de o cérebro comandar o lado oposto do corpo — e a explicação de um sinal raro e elegante: a hemiplegia cruzada, em que uma lesão exatamente na decussação paralisa o braço de um lado e a perna do outro, porque as fibras do membro superior cruzam acima das do inferior. Nenhuma outra lesão no sistema nervoso produz esse padrão.',
    memoria:
      'É aqui que o corpo "troca de lado". Acima da decussação, lesão dá déficit contralateral; abaixo, ipsilateral.',
    pontos: [
      'Que proporção das fibras corticoespinais cruza na decussação?',
      'Que limite anatômico ela marca?',
      'O que é a hemiplegia cruzada?',
    ],
  },
  {
    termos: ['Oliva Bulbar'],
    classe: 'snc',
    resumo: 'Elevação oval na face lateral do bulbo, produzida pelo núcleo olivar inferior.',
    localizacao: 'Face anterolateral do bulbo, entre os sulcos lateral anterior e lateral posterior.',
    funcao:
      'O núcleo olivar inferior é a única fonte das fibras trepadeiras que chegam ao córtex cerebelar — a via pela qual o cerebelo recebe o "sinal de erro" que permite corrigir e aprender movimentos.',
    vascularizacao:
      'Artéria cerebelar inferior posterior (PICA) e ramos bulbares laterais da vertebral. É território lateral — o oposto da pirâmide, que é paramediano —, e essa fronteira vascular é a linha que separa a síndrome de Wallenberg da síndrome de Déjerine.',
    relacoes: 'Suas fibras cruzam a linha média e entram no cerebelo pelo pedúnculo cerebelar inferior.',
    clinica:
      'A lesão do triângulo de Guillain-Mollaret — que liga núcleo denteado, núcleo rubro e oliva — produz degeneração hipertrófica olivar e mioclonia palatal, um tremor rítmico do palato que persiste até no sono. É um dos poucos lugares do sistema nervoso em que uma lesão causa hipertrofia, e não atrofia.',
    memoria:
      'A oliva é o "professor" do cerebelo: ela manda o sinal de erro que ensina o movimento a ficar mais preciso.',
    pontos: [
      'Que tipo de fibra o núcleo olivar inferior origina?',
      'Qual o papel funcional dessas fibras no cerebelo?',
      'O que é a mioclonia palatal?',
    ],
  },
  {
    termos: ['Sulco Lateral Anterior'],
    classe: 'snc',
    resumo: 'Sulco entre a pirâmide e a oliva, de onde emergem as raízes do nervo hipoglosso.',
    localizacao: 'Face anterolateral do bulbo, entre a pirâmide, medialmente, e a oliva, lateralmente.',
    funcao: 'Dá saída às raízes do XII par craniano, que se reúnem e deixam o crânio pelo canal do hipoglosso.',
    vascularizacao:
      'Ramos paramedianos da artéria vertebral e artéria espinal anterior, os mesmos que irrigam a pirâmide e o lemnisco medial ao lado — e a razão de a lesão do XII par na síndrome bulbar medial vir sempre acompanhada de hemiparesia contralateral.',
    relacoes: 'É o correspondente bulbar do sulco lateral anterior da medula, por onde saem as raízes ventrais motoras.',
    clinica:
      'A continuidade entre a saída do XII no bulbo e a saída das raízes motoras na medula ilustra um princípio geral: nervos motores emergem ventralmente, nervos sensitivos dorsalmente. Saber isso permite prever de que sulco um nervo craniano sai apenas conhecendo sua função.',
    memoria:
      'Motor sai pela frente, sensitivo sai por trás. Vale para a medula inteira e vale para o tronco.',
    pontos: [
      'Que nervo emerge do sulco lateral anterior?',
      'Que princípio geral essa saída ilustra?',
      'Que estruturas o delimitam?',
    ],
  },
  {
    termos: ['Sulco Lateral Posterior'],
    classe: 'snc',
    resumo: 'Sulco atrás da oliva, de onde emergem os nervos glossofaríngeo, vago e acessório.',
    localizacao: 'Face lateral do bulbo, posteriormente à oliva.',
    funcao: 'Dá saída, de cima para baixo, às raízes do IX, do X e da porção craniana do XI par.',
    vascularizacao:
      'Artéria cerebelar inferior posterior (PICA). É o território cuja oclusão produz a síndrome de Wallenberg — e a saída do IX, do X e do XI por este sulco explica a disfagia, a rouquidão e a perda do reflexo de vômito que a caracterizam.',
    relacoes: 'Esses três nervos deixam o crânio juntos pelo forame jugular.',
    clinica:
      'A saída conjunta pelo forame jugular explica a síndrome de Vernet: uma lesão nesse forame — tumor glômico, fratura de base, trombose — compromete os três de uma vez, com disfagia, desvio da úvula, perda do reflexo de vômito, rouquidão e fraqueza do trapézio e do esternocleidomastóideo. Três nervos, um buraco, uma síndrome.',
    memoria:
      'IX, X e XI saem juntos por trás da oliva e juntos pelo forame jugular. Lesão ali derruba os três.',
    pontos: [
      'Que nervos emergem do sulco lateral posterior?',
      'Por que forame deixam o crânio?',
      'O que é a síndrome de Vernet?',
    ],
  },
  {
    termos: ['Sulco Bulbopontino'],
    classe: 'snc',
    resumo: 'Sulco transversal que separa o bulbo da ponte, de onde emergem três nervos cranianos.',
    localizacao: 'Face anterior do tronco encefálico, na transição entre bulbo e ponte.',
    funcao: 'Dá saída, de medial para lateral, ao nervo abducente (VI), ao facial (VII) e ao vestibulococlear (VIII).',
    vascularizacao:
      'Artéria cerebelar inferior anterior (AICA), que cruza a região, com ramos da basilar. A oclusão da AICA produz a síndrome pontina lateral inferior, cuja marca é a surdez súbita ipsilateral — porque só a AICA dá a artéria labiríntica, e o labirinto não tem colateral.',
    relacoes: 'A artéria basilar corre na linha média, imediatamente acima; a artéria cerebelar inferior anterior cruza a região.',
    clinica:
      'O ângulo pontocerebelar, na extremidade lateral desse sulco, é onde crescem os schwannomas vestibulares: a sequência clínica segue a anatomia — primeiro perda auditiva neurossensorial e zumbido (VIII), depois hipoestesia facial e abolição do reflexo corneano (V), e por fim paresia facial (VII). A ordem dos sintomas conta o tamanho do tumor.',
    memoria:
      'Do meio para fora no sulco bulbopontino: VI, VII, VIII. E no cantinho, o ângulo pontocerebelar — endereço do schwannoma.',
    pontos: [
      'Que nervos emergem do sulco bulbopontino?',
      'O que é o ângulo pontocerebelar?',
      'Qual a sequência clínica do schwannoma vestibular?',
    ],
  },
  /* ─────────────────── Ponte ─────────────────── */
  {
    termos: ['Base da Ponte'],
    classe: 'snc',
    resumo: 'Porção anterior da ponte, com as fibras descendentes e os núcleos pontinos.',
    localizacao: 'Face anterior da ponte, entre o sulco basilar e o tegmento.',
    funcao:
      'Contém os tratos corticoespinal e corticobulbar, os núcleos pontinos e as fibras pontocerebelares transversas, que cruzam a linha média e entram no cerebelo pelo pedúnculo cerebelar médio. É a estação em que o córtex "conversa" com o cerebelo.',
    vascularizacao: 'Ramos paramedianos e circunferenciais curtos da artéria basilar.',
    relacoes: 'O tegmento, atrás, contém os núcleos dos nervos cranianos e as vias sensitivas.',
    clinica:
      'O infarto extenso da base pontina produz a síndrome do encarceramento (locked-in): o paciente fica tetraplégico e anártrico, mas plenamente consciente, comunicando-se apenas por movimentos verticais dos olhos e piscar — porque o núcleo do III, no mesencéfalo, está acima da lesão. É a razão de sempre se pesquisar o olhar vertical antes de assumir coma.',
    memoria:
      'Locked-in: o paciente está inteiro por dentro e imóvel por fora. Pergunte piscando — ele responde.',
    pontos: [
      'Que estruturas a base da ponte contém?',
      'Que via conecta a ponte ao cerebelo?',
      'O que é a síndrome do encarceramento?',
    ],
  },
  {
    termos: ['Tegmento da Ponte'],
    classe: 'snc',
    resumo: 'Porção posterior da ponte, com os núcleos dos nervos cranianos e as vias sensitivas ascendentes.',
    localizacao: 'Entre a base da ponte, à frente, e o quarto ventrículo, atrás.',
    funcao:
      'Contém os núcleos do V, VI, VII e VIII, o lemnisco medial, o trato espinotalâmico, o fascículo longitudinal medial e a formação reticular — inclusive o centro pontino do olhar horizontal.',
    vascularizacao: 'Ramos circunferenciais longos da basilar e artéria cerebelar inferior anterior.',
    relacoes: 'O assoalho do quarto ventrículo está imediatamente atrás.',
    clinica:
      'O fascículo longitudinal medial liga o núcleo do VI de um lado ao do III do outro; sua lesão produz a oftalmoplegia internuclear — o olho aduzido não passa da linha média e o abduzido faz nistagmo. Em jovem e bilateral, é praticamente sinônimo de esclerose múltipla; em idoso e unilateral, de infarto pontino.',
    memoria:
      'Base é motor descendo; tegmento é sensitivo subindo e núcleos de nervo craniano. Frente desce, trás sobe.',
    pontos: [
      'Que núcleos e vias o tegmento pontino contém?',
      'O que é a oftalmoplegia internuclear?',
      'Que diagnóstico ela sugere em jovem?',
    ],
  },
  {
    termos: ['Sulco Basilar'],
    classe: 'snc',
    resumo: 'Goteira mediana na face anterior da ponte que aloja a artéria basilar.',
    localizacao: 'Linha média da face anterior da ponte, entre as duas metades da base.',
    funcao: 'Acomoda a artéria basilar, formada pela união das duas vertebrais no sulco bulbopontino e que termina bifurcando-se nas cerebrais posteriores.',
    vascularizacao:
      'É o próprio leito da artéria basilar, que corre dentro dele. Dela partem os ramos paramedianos, para a base da ponte, e os circunferenciais curtos e longos, para o tegmento e para o cerebelo — a divisão que organiza todas as síndromes pontinas.',
    relacoes: 'Da basilar partem os ramos paramedianos, os circunferenciais e as cerebelares.',
    clinica:
      'A trombose da artéria basilar é uma das emergências neurológicas mais graves, com mortalidade acima de 80% sem recanalização. O quadro clássico é flutuante e enganoso — vertigem, diplopia, disartria, rebaixamento —, e o dado que salva vidas é lembrar que sintomas de tronco intermitentes em paciente com fatores de risco exigem angiotomografia imediata.',
    memoria:
      'Uma artéria só irriga o tronco inteiro. Se ela fecha, o paciente perde tudo abaixo do mesencéfalo de uma vez.',
    pontos: [
      'Que artéria corre no sulco basilar e como ela se forma?',
      'Em que artérias ela se bifurca?',
      'Por que a trombose basilar é tão grave?',
    ],
  },
  {
    termos: ['Raiz Sensitiva do Nervo Trigêmeo'],
    classe: 'nervo',
    resumo: 'Raiz maior do V par, que emerge da face lateral da ponte levando toda a sensibilidade da face.',
    localizacao: 'Emerge da face lateral da ponte, na junção com o pedúnculo cerebelar médio, e segue para o gânglio trigeminal, no cavo de Meckel.',
    funcao:
      'Conduz sensibilidade tátil, térmica e dolorosa da face, da córnea, da mucosa oral e nasal e da dura-máter supratentorial, além da propriocepção dos músculos mastigadores.',
    vascularizacao:
      'Artéria cerebelar superior e artéria cerebelar inferior anterior, que fazem alças no ângulo pontocerebelar. Essa vizinhança é a própria causa da neuralgia do trigêmeo clássica: uma alça arterial pulsando contra a raiz desmieliniza as fibras, e a descompressão microvascular — afastar a artéria da raiz — cura o quadro.',
    relacoes: 'A artéria cerebelar superior costuma cruzar a raiz na sua saída da ponte.',
    clinica:
      'Esse contato vascular é a causa mais aceita da neuralgia do trigêmeo: a pulsação da artéria desmieliniza a raiz na sua zona de entrada, gerando choques lancinantes em território de V2 ou V3, desencadeados por estímulos banais. A descompressão microvascular, que interpõe um coxim entre artéria e nervo, cura a maioria dos casos — cirurgia que nasceu inteiramente de uma observação anatômica.',
    memoria:
      'Choque na face ao escovar os dentes: uma artéria batendo no nervo. Afaste a artéria e a dor acaba.',
    pontos: [
      'Que modalidades a raiz sensitiva do trigêmeo conduz?',
      'Que artéria costuma comprimi-la?',
      'Qual o tratamento cirúrgico da neuralgia do trigêmeo?',
    ],
  },
  {
    termos: ['Pedúnculo Cerebelar Médio'],
    classe: 'snc',
    resumo: 'O maior dos três pedúnculos cerebelares, formado pelas fibras pontocerebelares.',
    localizacao: 'Liga a face lateral da ponte ao cerebelo, de cada lado.',
    funcao:
      'Conduz exclusivamente fibras aferentes: as fibras pontocerebelares que trazem, do córtex cerebral pelo núcleo pontino, a cópia da intenção motora. É por ele que o cerebelo sabe o que o córtex mandou fazer.',
    vascularizacao:
      'Artéria cerebelar inferior anterior (AICA), principalmente, com contribuição da cerebelar superior. É o maior dos três pedúnculos e o que conduz as fibras pontocerebelares — a via pela qual o córtex cerebral fala com o cerebelo, sempre cruzando.',
    relacoes: 'O nervo trigêmeo emerge na sua junção com a ponte.',
    clinica:
      'É a via da ataxia cerebelar em lesões pontinas. Sua hipersinal bilateral na ressonância é o "sinal do pedúnculo cerebelar médio", achado característico da síndrome do tremor-ataxia associada ao X frágil (FXTAS), diagnóstico frequentemente confundido com Parkinson em homens idosos.',
    memoria:
      'Médio é o maior e só entra informação por ele: é a "linha de entrada" do plano motor no cerebelo.',
    pontos: [
      'Que fibras o pedúnculo cerebelar médio conduz?',
      'Ele é aferente ou eferente?',
      'Que nervo craniano emerge na sua junção com a ponte?',
    ],
  },
  {
    termos: ['Pedúnculo Cerebelar Inferior'],
    classe: 'snc',
    resumo: 'Corpo restiforme: pedúnculo que liga o bulbo ao cerebelo, com fibras predominantemente aferentes.',
    localizacao: 'Face posterolateral do bulbo, subindo até o cerebelo.',
    funcao:
      'Conduz o trato espinocerebelar posterior, as fibras olivocerebelares e as vestibulocerebelares — a informação proprioceptiva vinda da medula e o equilíbrio vindo do labirinto. Contém também eferências para os núcleos vestibulares.',
    vascularizacao:
      'Artéria cerebelar inferior posterior (PICA). Por ele passam as fibras do trato espinocerebelar posterior e as olivocerebelares, e sua lesão na síndrome de Wallenberg é o que produz a ataxia ipsilateral desse quadro.',
    relacoes: 'Delimita lateralmente o assoalho do quarto ventrículo.',
    clinica:
      'Sua lesão faz parte da síndrome bulbar lateral (de Wallenberg), a síndrome de tronco mais frequente: ataxia ipsilateral, síndrome de Horner ipsilateral, perda termoalgésica na face ipsilateral e no corpo contralateral, disfagia e rouquidão. É o exemplo perfeito do déficit cruzado que denuncia lesão de tronco.',
    memoria:
      'Wallenberg: cara de um lado, corpo do outro, sem dor e sem temperatura. Se você viu isso, é bulbo lateral.',
    pontos: [
      'Que tratos o pedúnculo cerebelar inferior conduz?',
      'Que síndrome envolve sua lesão?',
      'Qual o padrão sensitivo da síndrome de Wallenberg?',
    ],
  },
  /* ─────────────────── Mesencéfalo ─────────────────── */
  {
    termos: ['Pedúnculo Cerebral', 'Pedúnculo Cerebral (Mesencéfalo)'],
    classe: 'snc',
    resumo: 'Cada uma das duas colunas anteriores do mesencéfalo, que carregam as vias descendentes do córtex.',
    localizacao: 'Face anterior do mesencéfalo, de cada lado da fossa interpeduncular, de onde emerge o nervo oculomotor.',
    funcao: 'A base do pedúnculo conduz os tratos corticoespinal, corticobulbar e corticopontino; o tegmento, atrás da substância negra, contém núcleos e vias ascendentes.',
    vascularizacao: 'Ramos perfurantes da artéria cerebral posterior e da comunicante posterior.',
    relacoes: 'O nervo oculomotor emerge entre os dois pedúnculos, na fossa interpeduncular.',
    clinica:
      'A síndrome de Weber é a combinação clássica: lesão do pedúnculo com o III par que o atravessa, produzindo paralisia do oculomotor ipsilateral (olho para baixo e para fora, ptose, midríase) com hemiparesia contralateral. É o déficit cruzado do mesencéfalo.',
    memoria:
      'Weber: olho caído de um lado, corpo fraco do outro. O nervo sai por dentro da via que ele acompanha.',
    pontos: [
      'Que vias a base do pedúnculo cerebral conduz?',
      'Que nervo emerge entre os pedúnculos?',
      'O que caracteriza a síndrome de Weber?',
    ],
  },
  {
    termos: ['Base do Pedúnculo Cerebral'],
    classe: 'snc',
    resumo: 'Porção anterior do pedúnculo cerebral, ocupada pelas fibras descendentes corticofugais.',
    localizacao: 'Anterior à substância negra, no mesencéfalo.',
    funcao:
      'Sua organização é somatotópica e vale conhecer: as fibras corticobulbares ocupam o terço medial, as corticoespinais o terço médio, e as corticopontinas as bordas. É a compactação máxima de toda a saída motora do córtex.',
    vascularizacao:
      'Ramos perfurantes da artéria cerebral posterior e da comunicante posterior, mais a artéria coroidea anterior. É o território cuja lesão produz a síndrome de Weber: paralisia do III par ipsilateral, porque o nervo atravessa aqui, e hemiparesia contralateral, porque o trato corticoespinal desce por dentro.',
    relacoes: 'A substância negra a separa do tegmento.',
    clinica:
      'Essa compactação explica por que um infarto pequeno aqui produz hemiparesia densa e completa — bem mais grave que um infarto do mesmo tamanho na coroa radiada, onde as fibras ainda estão dispersas. Tamanho da lesão e tamanho do déficit não são proporcionais no sistema nervoso; o que importa é a densidade de vias.',
    memoria:
      'Quanto mais fundo a via desce, mais apertada ela fica. Lesão pequena em lugar apertado dá déficit grande.',
    pontos: [
      'Como as fibras se organizam na base do pedúnculo?',
      'Que estrutura a separa do tegmento?',
      'Por que pequenas lesões aqui causam déficits densos?',
    ],
  },
  {
    termos: ['Substância Negra'],
    classe: 'snc',
    resumo: 'Núcleo pigmentado do mesencéfalo, entre a base do pedúnculo e o tegmento, fonte da dopamina nigroestriatal.',
    localizacao: 'Mesencéfalo, com a parte compacta, posterior e pigmentada por neuromelanina, e a parte reticulada, anterior.',
    funcao:
      'A parte compacta projeta dopamina ao estriado, modulando as vias direta e indireta dos núcleos da base; a parte reticulada é, com o globo pálido medial, uma via de saída dos núcleos da base.',
    vascularizacao: 'Ramos perfurantes da cerebral posterior.',
    relacoes: 'Está entre a base do pedúnculo, à frente, e o tegmento, atrás.',
    clinica:
      'A degeneração da parte compacta é a doença de Parkinson: os sintomas motores só aparecem quando cerca de 60 a 80% dos neurônios dopaminérgicos já se perderam, o que explica o longo período pré-motor com constipação, hiposmia e distúrbio do sono REM. Na peça, a despigmentação da substância negra é visível a olho nu — um diagnóstico anatomopatológico macroscópico.',
    memoria:
      'Uma faixa preta no meio do mesencéfalo. No parkinsoniano, ela empalidece — e dá para ver sem microscópio.',
    pontos: [
      'Que partes compõem a substância negra e o que cada uma faz?',
      'Que proporção de neurônios se perde antes dos sintomas motores?',
      'Que sintomas precedem a fase motora do Parkinson?',
    ],
  },
  {
    termos: ['Tegmento do Mesencéfalo'],
    classe: 'snc',
    resumo: 'Porção média do mesencéfalo, entre a substância negra e o aqueduto, com os núcleos do III e IV e o núcleo rubro.',
    localizacao: 'Entre a substância negra, à frente, e o teto, atrás, circundando o aqueduto cerebral.',
    funcao:
      'Contém os núcleos oculomotor e troclear, o núcleo rubro, a formação reticular mesencefálica, a substância cinzenta periaquedutal e as vias sensitivas ascendentes.',
    vascularizacao:
      'Ramos paramedianos da artéria cerebral posterior e ramos da cerebelar superior. Território da síndrome de Benedikt — III par mais tremor e movimentos involuntários contralaterais, por lesão do núcleo rubro, que fica justamente aqui e não na base.',
    relacoes: 'A substância cinzenta periaquedutal circunda o aqueduto.',
    clinica:
      'A substância cinzenta periaquedutal é o centro da analgesia descendente endógena, onde agem os opioides — é dela que parte a via que inibe a transmissão dolorosa no corno dorsal. É também alvo de estimulação cerebral profunda em dor crônica refratária, o que dá base anatômica direta ao efeito analgésico da morfina.',
    memoria:
      'Em volta do aqueduto está o "botão de desligar a dor" do próprio corpo. É onde a morfina se encaixa.',
    pontos: [
      'Que núcleos o tegmento mesencefálico contém?',
      'Qual a função da substância cinzenta periaquedutal?',
      'Que relação isso tem com os opioides?',
    ],
  },
  {
    termos: ['Núcleo Rubro'],
    classe: 'snc',
    resumo: 'Núcleo arredondado e avermelhado do tegmento mesencefálico, estação do circuito cerebelo-tálamo-cortical.',
    localizacao: 'Tegmento do mesencéfalo, medialmente à substância negra, ao nível do colículo superior.',
    funcao:
      'Recebe fibras do núcleo denteado do cerebelo pelo pedúnculo cerebelar superior e projeta ao tálamo e à oliva inferior. Sua porção magnocelular origina o trato rubroespinal, importante em outros mamíferos e vestigial no ser humano.',
    vascularizacao:
      'Ramos paramedianos da artéria cerebral posterior e da comunicante posterior. É o vértice superior do triângulo de Guillain-Mollaret — e a lesão desse circuito, que liga núcleo denteado, núcleo rubro e oliva, produz a mioclonia palatal e a hipertrofia olivar.',
    relacoes: 'As fibras do III par o atravessam a caminho da fossa interpeduncular.',
    clinica:
      'A síndrome de Benedikt combina lesão do III par com lesão do núcleo rubro: paralisia oculomotora ipsilateral com tremor, ataxia e movimentos coreiformes contralaterais. E é o núcleo rubro que fecha o triângulo de Guillain-Mollaret, cuja interrupção produz a mioclonia palatal e a hipertrofia olivar.',
    memoria:
      'Weber é pedúnculo (só fraqueza); Benedikt é núcleo rubro (fraqueza mais tremor). Quanto mais atrás a lesão, mais movimento anormal.',
    pontos: [
      'Que conexões o núcleo rubro estabelece?',
      'O que diferencia as síndromes de Weber e de Benedikt?',
      'Que triângulo funcional ele integra?',
    ],
  },
  {
    termos: ['Teto do Mesencéfalo'],
    classe: 'snc',
    resumo: 'Lâmina quadrigeminal, atrás do aqueduto, com os quatro colículos.',
    localizacao: 'Face posterior do mesencéfalo, atrás do aqueduto cerebral, coberta pela glândula pineal e pelo esplênio.',
    funcao: 'Os colículos superiores integram reflexos visuais e o controle de sacadas; os inferiores são estação obrigatória da via auditiva.',
    vascularizacao:
      'Artéria quadrigeminal, ramo da cerebral posterior, e ramos da cerebelar superior. Sua lesão, por tumor de pineal ou hidrocefalia, produz a síndrome de Parinaud: paralisia do olhar vertical para cima, pupilas que não reagem à luz mas reagem à convergência e nistagmo de retração.',
    relacoes: 'O nervo troclear é o único nervo craniano que emerge da face posterior do tronco, logo abaixo dos colículos inferiores, e o único que cruza antes de sair.',
    clinica:
      'Essa singularidade do IV par explica sua vulnerabilidade: por ser o mais fino, o mais longo e o único posterior, é o nervo craniano mais lesado no traumatismo cranioencefálico. A paralisia do troclear dá diplopia vertical que piora ao olhar para baixo — descer escadas — e o paciente inclina a cabeça para o lado oposto para compensar.',
    memoria:
      'O IV par é o esquisito: sai por trás, cruza e é o mais fino. Por isso é o que mais quebra no trauma.',
    pontos: [
      'Que funções têm os colículos superiores e inferiores?',
      'Que nervo craniano emerge da face posterior do tronco?',
      'Como se manifesta a paralisia do troclear?',
    ],
  },
  {
    termos: ['Colículo Superior'],
    classe: 'snc',
    resumo: 'Par superior de eminências do teto mesencefálico, centro reflexo visual e de sacadas.',
    localizacao: 'Metade superior da lâmina quadrigeminal; conecta-se ao corpo geniculado lateral pelo braço do colículo superior.',
    funcao:
      'Recebe aferências retinianas diretas e do córtex visual, e comanda movimentos reflexos de olhos e cabeça em direção a um estímulo. Participa também do reflexo fotomotor pela região pré-tectal, imediatamente à sua frente.',
    vascularizacao:
      'Artéria quadrigeminal, ramo da cerebral posterior, com contribuição da cerebelar superior. Território de irrigação terminal, muito sensível à hipóxia — e é por isso que o reflexo de orientação visual é dos primeiros a se perder na parada cardíaca prolongada.',
    relacoes: 'A área pré-tectal, entre o colículo superior e o tálamo, é o núcleo do reflexo fotomotor.',
    clinica:
      'Como as fibras pupilares cruzam duas vezes na região pré-tectal, a luz num olho contrai as duas pupilas — o reflexo consensual. A lesão pré-tectal produz a dissociação luz-perto da síndrome de Parinaud e da pupila de Argyll Robertson (que acomoda mas não reage à luz), classicamente associada à neurossífilis.',
    memoria:
      'Colículo superior é visão reflexa; inferior é audição. "Ver é em cima, ouvir é embaixo" — e o número dos pares segue: II sobe para o superior, VIII para o inferior.',
    pontos: [
      'Que funções o colículo superior desempenha?',
      'Onde fica o núcleo do reflexo fotomotor?',
      'Por que o reflexo consensual existe?',
    ],
  },
  {
    termos: ['Colículo Inferior'],
    classe: 'snc',
    resumo: 'Par inferior de eminências do teto mesencefálico, estação obrigatória da via auditiva.',
    localizacao: 'Metade inferior da lâmina quadrigeminal; conecta-se ao corpo geniculado medial pelo braço do colículo inferior.',
    funcao: 'Recebe todas as fibras do lemnisco lateral e projeta ao corpo geniculado medial — nenhuma informação auditiva chega ao córtex sem passar por ele.',
    vascularizacao:
      'Artéria quadrigeminal e ramos da cerebelar superior. É a estação obrigatória de toda a via auditiva ascendente, e sua integridade é o que o potencial evocado auditivo de tronco encefálico mede na onda V — o exame usado para confirmar morte encefálica e triar surdez em recém-nascidos.',
    relacoes: 'O nervo troclear emerge imediatamente abaixo dele.',
    clinica:
      'É a base neural do potencial evocado auditivo de tronco encefálico (BERA), exame que registra a passagem do sinal por cada estação e é usado na triagem auditiva neonatal e no monitoramento intraoperatório de cirurgias do ângulo pontocerebelar. Cada onda do exame corresponde a uma estrutura anatômica.',
    memoria:
      'Toda audição passa pelo colículo inferior — sem exceção. É o pedágio obrigatório do som.',
    pontos: [
      'Qual o papel do colículo inferior na via auditiva?',
      'A que estrutura ele projeta?',
      'Que exame se baseia nessa via?',
    ],
  },
  {
    termos: ['Aqueduto Cerebral'],
    classe: 'ventriculo',
    resumo: 'Canal estreito que liga o terceiro ao quarto ventrículo através do mesencéfalo.',
    localizacao: 'No mesencéfalo, entre o tegmento e o teto, circundado pela substância cinzenta periaquedutal.',
    funcao: 'Conduz o líquor do terceiro para o quarto ventrículo. É o ponto mais estreito de todo o sistema ventricular, com poucos milímetros de diâmetro.',
    relacoes: 'Não possui plexo corióideo.',
    clinica:
      'Ser o ponto mais estreito faz dele o local mais comum de obstrução: a estenose de aqueduto é a causa mais frequente de hidrocefalia congênita, e sua obstrução adquirida — por tumor de pineal ou de tronco — produz hidrocefalia com dilatação dos ventrículos laterais e do terceiro, com o quarto normal. Esse padrão de "três dilatados, um normal" localiza a obstrução sem mais nenhum exame.',
    memoria:
      'Três ventrículos grandes e o quarto normal: o entupimento está no aqueduto. A imagem já diz onde é.',
    pontos: [
      'Que ventrículos o aqueduto conecta?',
      'Por que ele é o ponto de obstrução mais frequente?',
      'Que padrão ventricular sua obstrução produz?',
    ],
  },
  /* ─────────────────── Assoalho do IV ventrículo ─────────────────── */
  {
    termos: ['Sulco Mediano'],
    classe: 'snc',
    sistemas: ['nervoso'],
    resumo: 'Sulco longitudinal que divide ao meio o assoalho do quarto ventrículo.',
    localizacao: 'Linha média da fossa romboide, entre os dois sulcos limitantes.',
    funcao: 'Divide o assoalho em duas metades simétricas; medialmente a ele ficam as colunas de núcleos motores.',
    vascularizacao:
      'Ramos paramedianos das artérias basilar, na ponte, e vertebral, no bulbo. Divide o assoalho do quarto ventrículo em duas metades simétricas — e a incisão cirúrgica por ele, na linha média, é a única via segura de acesso ao assoalho, porque não corta núcleo nenhum.',
    relacoes: 'De cada lado, a eminência medial contém, de cima para baixo, o colículo facial e o trígono do hipoglosso.',
    clinica:
      'É a referência da incisão mediana do assoalho do quarto ventrículo — a via telovelar moderna evita justamente essa abertura, preferindo o acesso pela tela corióidea, porque a incisão mediana lesa os núcleos e as fibras que a cruzam. A anatomia funcional do assoalho é o que definiu a mudança de técnica.',
    memoria:
      'O assoalho do IV ventrículo é uma "sala de controle" com os núcleos dos nervos cranianos afl or. Cortar ali cobra caro.',
    pontos: [
      'Que estrutura o sulco mediano divide?',
      'Que eminências ficam de cada lado dele?',
      'Por que a incisão mediana do assoalho é evitada?',
    ],
  },
  {
    termos: ['Sulco Limitante'],
    classe: 'snc',
    resumo: 'Sulco longitudinal do assoalho do quarto ventrículo que separa as áreas motoras das sensitivas.',
    localizacao: 'Lateralmente ao sulco mediano, percorrendo o assoalho da fossa romboide de cima a baixo.',
    funcao:
      'É a marca embriológica que separa a placa basal, medial e motora, da placa alar, lateral e sensitiva. Essa divisão explica toda a topografia dos núcleos dos nervos cranianos no tronco.',
    vascularizacao:
      'Ramos circunferenciais da basilar, na ponte, e da PICA, no bulbo. É a fronteira embriológica entre a lâmina alar, lateral e sensitiva, e a lâmina basal, medial e motora — uma linha traçada no assoalho do ventrículo que ainda separa, no adulto, os núcleos motores dos sensitivos.',
    relacoes: 'Medialmente a ele estão os núcleos motores; lateralmente, os sensitivos e vestibulares.',
    clinica:
      'Daí sai a regra mais econômica da neuroanatomia do tronco: núcleo motor é medial, núcleo sensitivo é lateral, e a fronteira é o sulco limitante — a mesma lógica do corno anterior e posterior da medula. Com ela, deduz-se a posição de qualquer núcleo em vez de decorar dezenas de mapas.',
    memoria:
      'Motor perto do meio, sensitivo mais para fora. Vale para a medula, vale para o tronco: é o mesmo tubo neural.',
    pontos: [
      'Que placas embrionárias o sulco limitante separa?',
      'Como os núcleos se organizam em relação a ele?',
      'Que analogia existe com a medula espinal?',
    ],
  },
  {
    termos: ['Colículo Facial'],
    classe: 'snc',
    resumo: 'Elevação no assoalho do quarto ventrículo formada pelas fibras do facial contornando o núcleo do abducente.',
    localizacao: 'Parte pontina do assoalho do quarto ventrículo, na eminência medial, ao lado do sulco mediano.',
    funcao:
      'A saliência não é o núcleo do facial: são as fibras do VII que dão a volta em torno do núcleo do VI — o joelho interno do facial — antes de seguir para a frente. O relevo é do facial; o núcleo por baixo é do abducente.',
    vascularizacao:
      'Ramos paramedianos da artéria basilar. É onde as fibras do nervo facial contornam o núcleo do abducente, e por isso uma lesão vascular aqui produz o quadro característico: paralisia facial periférica somada à paralisia do olhar horizontal, ambas do mesmo lado.',
    relacoes: 'É a estrutura mais superficial dessa região do assoalho.',
    clinica:
      'Como o relevo é do facial e o núcleo é do abducente, uma lesão do colículo facial produz paralisia facial periférica com paralisia do reto lateral do mesmo lado — a síndrome de Foville. A cirurgia do assoalho do quarto ventrículo mapeia essa área eletricamente antes de qualquer incisão, e o colículo facial é uma zona proibida.',
    memoria:
      'O relevo é do facial, o núcleo é do abducente. É a pegadinha mais clássica da neuroanatomia do tronco.',
    pontos: [
      'Que estrutura forma o relevo do colículo facial?',
      'Que núcleo está por baixo dele?',
      'Que déficits sua lesão produz?',
    ],
  },
  {
    termos: ['Trígono do Hipoglosso'],
    classe: 'snc',
    resumo: 'Elevação triangular na parte bulbar do assoalho do quarto ventrículo, sobre o núcleo do XII.',
    localizacao: 'Porção inferior e medial do assoalho, medialmente ao trígono do vago.',
    funcao: 'Corresponde ao núcleo do nervo hipoglosso, motor da língua.',
    vascularizacao:
      'Ramos paramedianos da artéria vertebral e da espinal anterior. Marca a posição do núcleo do XII par no assoalho do ventrículo, e sua vizinhança com a linha média é o que o inclui na síndrome bulbar medial.',
    relacoes: 'Está imediatamente medial ao trígono do vago, na porção bulbar da fossa romboide.',
    clinica:
      'A posição medial confirma a regra do sulco limitante: o XII é motor puro e, portanto, o mais medial dos núcleos bulbares. Sua lesão produz atrofia e fasciculações da hemilíngua, com desvio para o lado da lesão à protrusão — sinal que localiza a lesão com uma manobra de dois segundos.',
    memoria:
      'Motor é medial. O núcleo mais medial do bulbo é o do XII, o mais motor de todos os nervos cranianos.',
    pontos: [
      'Que núcleo o trígono do hipoglosso recobre?',
      'Por que ele é medial no assoalho?',
      'Como se identifica clinicamente a lesão do XII?',
    ],
  },
  {
    termos: ['Trígono do Vago'],
    classe: 'snc',
    resumo: 'Elevação no assoalho do quarto ventrículo sobre o núcleo dorsal do vago.',
    localizacao: 'Lateralmente ao trígono do hipoglosso, na porção bulbar do assoalho.',
    funcao: 'Recobre o núcleo dorsal do vago, o maior núcleo parassimpático do corpo, que inerva vísceras torácicas e abdominais até a flexura esquerda do cólon.',
    vascularizacao:
      'Ramos da artéria cerebelar inferior posterior (PICA). Marca o núcleo dorsal do vago, parassimpático, e ao lado dele, na área postrema, está a zona de gatilho quimiorreceptora — o único ponto do encéfalo sem barreira hematoencefálica, e o alvo dos antieméticos.',
    relacoes: 'Lateralmente está a área vestibular; a área postrema fica na extremidade inferior do assoalho.',
    clinica:
      'A área postrema, vizinha, é um dos órgãos circunventriculares: não tem barreira hematoencefálica e funciona como zona de gatilho quimiorreceptora do vômito, monitorando toxinas no sangue. É onde agem os antieméticos antagonistas de dopamina e de serotonina — e a razão de a quimioterapia provocar êmese mesmo sem irritar o estômago.',
    memoria:
      'A área postrema é a "janela" do cérebro para o sangue. É por ela que o corpo detecta veneno e manda vomitar.',
    pontos: [
      'Que núcleo o trígono do vago recobre?',
      'Que território ele inerva?',
      'O que é a área postrema e qual sua função?',
    ],
  },
  /* ─────────────────── Cerebelo: divisões ─────────────────── */
  {
    termos: ['Hemisfério Cerebelar Direito'],
    classe: 'snc',
    resumo: 'Cada uma das duas metades laterais do cerebelo, responsáveis pela coordenação dos membros.',
    localizacao: 'Fossa craniana posterior, de cada lado do verme, sob a tenda do cerebelo.',
    funcao:
      'A porção lateral (cerebrocerebelo) planeja e coordena o movimento fino dos membros; a intermédia ajusta o movimento em curso pela comparação entre intenção e execução.',
    vascularizacao: 'Artérias cerebelares superior, inferior anterior e inferior posterior.',
    relacoes: 'Conectam-se ao tronco pelos três pedúnculos cerebelares.',
    clinica:
      'A regra que mais importa é a da lateralidade: o cerebelo comanda o mesmo lado do corpo, porque suas vias cruzam duas vezes — no pedúnculo superior e novamente na cápsula interna. Por isso a lesão cerebelar direita dá dismetria, disdiadococinesia e tremor de intenção à direita, ao contrário de tudo o que acontece no cérebro.',
    memoria:
      'Cerebelo é ipsilateral; cérebro é contralateral. Duas decussações se anulam.',
    pontos: [
      'Por que a lesão cerebelar produz déficit ipsilateral?',
      'Que funções a porção lateral do hemisfério exerce?',
      'Que artérias irrigam o cerebelo?',
    ],
  },
  {
    termos: ['Verme'],
    classe: 'snc',
    resumo: 'Porção mediana e ímpar do cerebelo, entre os dois hemisférios, responsável pelo equilíbrio do tronco.',
    localizacao: 'Linha média do cerebelo, formando um relevo alongado entre os hemisférios.',
    funcao:
      'O verme (espinocerebelo medial) controla a postura, o tônus axial e a marcha; é a porção que mantém o corpo em pé antes de qualquer movimento voluntário dos membros.',
    vascularizacao: 'Artérias cerebelares superior e inferior posterior.',
    relacoes: 'Forma o teto do quarto ventrículo, junto com os véus medulares.',
    clinica:
      'A degeneração cerebelar alcoólica atinge preferencialmente o verme anterior, e por isso produz ataxia de tronco e de marcha com membros superiores relativamente preservados — o paciente cambaleia mas escreve. Já o meduloblastoma da criança nasce no verme e no teto do quarto ventrículo, cursando com ataxia de tronco e hidrocefalia.',
    memoria:
      'Verme cuida do tronco e da marcha; hemisférios cuidam dos membros. Cambaleia mas acerta o dedo-nariz: é verme.',
    pontos: [
      'Que funções o verme controla?',
      'Que quadro a degeneração cerebelar alcoólica produz?',
      'Que tumor infantil nasce nessa região?',
    ],
  },
  {
    termos: ['Lobo Floculonodular'],
    classe: 'snc',
    resumo: 'Lobo mais antigo do cerebelo, formado pelo flóculo e pelo nódulo — o vestibulocerebelo.',
    localizacao: 'Face inferior e anterior do cerebelo, separado do restante pela fissura posterolateral.',
    funcao:
      'Recebe aferências vestibulares diretas e controla o equilíbrio, a postura da cabeça e os movimentos oculares de fixação — inclusive o reflexo vestíbulo-ocular.',
    vascularizacao:
      'Artéria cerebelar inferior posterior (PICA). É o vestibulocerebelo, o mais antigo dos três, e sua lesão produz ataxia de tronco e nistagmo com marcha cambaleante — sem incoordenação dos membros, porque os membros são território dos outros lobos.',
    relacoes: 'É a única porção do cerebelo com conexões vestibulares diretas, sem passar por núcleos cerebelares profundos.',
    clinica:
      'Sua lesão produz ataxia com nistagmo e desequilíbrio sem dismetria de membros — o paciente cai mas coordena bem as mãos. É a região invadida pelo meduloblastoma e comprimida na malformação de Chiari, o que explica a vertigem e o nistagmo desses quadros.',
    memoria:
      'Flóculo e nódulo: a parte mais antiga do cerebelo, que só cuida de equilíbrio e olhos. Nistagmo é a assinatura dela.',
    pontos: [
      'Que estruturas compõem o lobo floculonodular?',
      'Que função ele desempenha?',
      'Que sinal ocular sua lesão produz?',
    ],
  },
  {
    termos: ['Lobo Posterior'],
    classe: 'snc',
    sistemas: ['nervoso'],
    resumo: 'Maior lobo do cerebelo, entre a fissura prima e a posterolateral — o neocerebelo.',
    localizacao: 'Ocupa a maior parte dos hemisférios cerebelares, atrás da fissura prima.',
    funcao:
      'Corresponde ao cerebrocerebelo: recebe do córtex cerebral pela ponte e participa do planejamento, do timing e da precisão do movimento — e, cada vez mais reconhecido, de funções cognitivas e afetivas.',
    vascularizacao:
      'Artéria cerebelar superior na porção superior e cerebelar inferior posterior na inferior, com a fissura horizontal entre os dois territórios. É o cerebelo cerebral — o neocerebelo, que recebe do córtex pelo pedúnculo médio e planeja o movimento fino.',
    relacoes: 'Projeta ao núcleo denteado e daí ao tálamo e ao córtex motor.',
    clinica:
      'A lesão do lobo posterior, sobretudo à direita e no verme posterior, produz a síndrome cerebelar cognitivo-afetiva de Schmahmann: disfunção executiva, alteração de linguagem, dificuldade visuoespacial e desinibição afetiva — a demonstração de que o cerebelo não é apenas motor. É a explicação do mutismo cerebelar após ressecção de meduloblastoma na criança.',
    memoria:
      'Cerebelo não faz só movimento: ele "afina" também o pensamento. Lesão posterior muda comportamento, não só marcha.',
    pontos: [
      'Que divisão funcional o lobo posterior representa?',
      'A que núcleo profundo ele projeta?',
      'O que é a síndrome cerebelar cognitivo-afetiva?',
    ],
  },
  {
    termos: ['Tonsila'],
    classe: 'snc',
    resumo: 'Lóbulo arredondado da face inferior do hemisfério cerebelar, adjacente ao forame magno.',
    localizacao: 'Face inferomedial de cada hemisfério cerebelar, próxima à linha média e ao bulbo.',
    funcao: 'Faz parte do lobo posterior; sua importância clínica supera em muito sua função conhecida.',
    relacoes: 'Está imediatamente acima do forame magno, ao lado do bulbo.',
    clinica:
      'É a estrutura que hernia na herniação tonsilar: empurrada pelo aumento de pressão na fossa posterior, desce pelo forame magno e comprime o bulbo, com parada respiratória e morte. É a razão de a punção lombar ser contraindicada diante de sinais de hipertensão intracraniana com efeito de massa. A malformação de Chiari tipo I é a descida crônica das tonsilas além de 5 mm, com cefaleia à tosse e siringomielia.',
    memoria:
      'Tonsila que desce pelo forame magno esmaga o bulbo — o centro respiratório. É a herniação que mata mais rápido.',
    pontos: [
      'O que é a herniação tonsilar e por que ela é fatal?',
      'Por que a punção lombar pode precipitá-la?',
      'O que é a malformação de Chiari tipo I?',
    ],
  },
  {
    termos: ['Córtex Cerebelar'],
    classe: 'snc',
    resumo: 'Camada de substância cinzenta que reveste o cerebelo, com apenas três camadas e cinco tipos celulares.',
    localizacao: 'Superfície de todas as folhas cerebelares, com camadas molecular, de Purkinje e granular.',
    funcao:
      'Toda a saída do córtex cerebelar é feita pelas células de Purkinje, que são inibitórias e projetam aos núcleos profundos. As entradas são as fibras musgosas (via núcleos pontinos e medula) e as trepadeiras (da oliva inferior).',
    vascularizacao: 'Ramos corticais das três artérias cerebelares.',
    relacoes: 'A camada granular contém mais neurônios que todo o resto do encéfalo somado.',
    clinica:
      'A uniformidade dessa arquitetura — a mesma em todo o cerebelo — sugere que ele executa uma única operação computacional aplicada a conteúdos diferentes, e é isso que explica sua participação tanto em movimento quanto em cognição. As células de Purkinje são também alvo de anticorpos nas degenerações cerebelares paraneoplásicas, associadas a câncer de ovário, mama e pulmão.',
    memoria:
      'Uma só saída: a célula de Purkinje, e ela é inibitória. Tudo o que o cerebelo faz, faz freando.',
    pontos: [
      'Quais são as camadas do córtex cerebelar?',
      'Que célula constitui sua única via de saída?',
      'Que fibras trazem informação ao córtex cerebelar?',
    ],
  },
  {
    termos: ['Corpo Medular do Cerebelo'],
    classe: 'snc',
    resumo: 'Massa central de substância branca do cerebelo, cujas ramificações formam a árvore da vida.',
    localizacao: 'Interior do cerebelo, ramificando-se para dentro de cada folha.',
    funcao: 'Contém as fibras aferentes e eferentes do cerebelo e abriga os quatro pares de núcleos profundos: denteado, emboliforme, globoso e fastigial.',
    vascularizacao:
      'Ramos profundos das artérias cerebelares superior e inferior posterior, que penetram a partir da superfície. É a substância branca que reúne todas as fibras aferentes e eferentes do cerebelo e abriga os quatro núcleos profundos.',
    relacoes: 'No corte sagital mediano, o padrão ramificado recebe o nome de arbor vitae — árvore da vida.',
    clinica:
      'Os quatro núcleos se organizam de lateral para medial acompanhando as divisões funcionais: denteado para os hemisférios laterais, interpostos (emboliforme e globoso) para a zona intermédia e fastigial para o verme. Essa correspondência permite prever, pela topografia da lesão, se o déficit será de membro, de ajuste fino ou de equilíbrio axial.',
    memoria:
      '"Don\'t Eat Greasy Food": Denteado, Emboliforme, Globoso, Fastigial — de lateral para medial.',
    pontos: [
      'Que núcleos o corpo medular do cerebelo abriga?',
      'Como eles se organizam em relação às zonas funcionais?',
      'O que é a árvore da vida?',
    ],
  },
  {
    termos: ['Núcleo Denteado'],
    classe: 'snc',
    resumo: 'O maior e mais lateral dos núcleos cerebelares profundos, com aspecto de saco pregueado.',
    localizacao: 'Substância branca de cada hemisfério cerebelar, lateralmente aos demais núcleos.',
    funcao:
      'Recebe do córtex dos hemisférios laterais e é a origem da maior parte das fibras do pedúnculo cerebelar superior, que cruzam a linha média e alcançam o núcleo rubro e o tálamo, e daí o córtex motor.',
    vascularizacao:
      'Artéria cerebelar superior, principalmente, com contribuição da cerebelar inferior posterior. É o maior dos núcleos cerebelares e a via de saída de quase todo o cerebelo — e o vértice inferior do triângulo de Guillain-Mollaret.',
    relacoes: 'Sua via de saída, o pedúnculo cerebelar superior, decussa no mesencéfalo.',
    clinica:
      'Essa decussação é o que torna o cerebelo ipsilateral: as fibras cruzam no mesencéfalo e cruzam de novo com o trato corticoespinal. É também o núcleo cuja lesão produz o tremor de intenção mais evidente, e o alvo de estimulação cerebral profunda em tremores refratários. O núcleo denteado fecha, com o rubro e a oliva, o triângulo de Guillain-Mollaret.',
    memoria:
      'Denteado é a "saída principal" do cerebelo. Suas fibras cruzam no mesencéfalo — e é essa cruzada que cancela a outra.',
    pontos: [
      'Que porção do cerebelo projeta ao núcleo denteado?',
      'Por onde saem suas fibras e onde elas cruzam?',
      'Que sinal clínico sua lesão produz?',
    ],
  },
  /* ─────────────────── Fissuras e lóbulos do verme ─────────────────── */
  {
    termos: ['Fissura Prima'],
    classe: 'snc',
    resumo: 'Fissura mais profunda do cerebelo, que separa os lobos anterior e posterior.',
    localizacao: 'Face superior do cerebelo, atrás do cúlmen, visível no corte sagital mediano como a fissura mais funda.',
    funcao: 'Marca o limite entre o lobo anterior — espinocerebelo, ligado à propriocepção do corpo — e o lobo posterior, cerebrocerebelo.',
    vascularizacao:
      'Território da artéria cerebelar superior nas duas vertentes. Separa o lobo anterior do posterior e é a fissura mais profunda do cerebelo — a referência que orienta qualquer corte sagital da peça.',
    relacoes: 'É a primeira fissura a aparecer no desenvolvimento, daí o nome.',
    clinica:
      'A divisão que ela marca tem tradução clínica direta: a atrofia do lobo anterior, típica do alcoolismo, dá ataxia de marcha e de membros inferiores com preservação relativa dos superiores — porque a representação corporal do espinocerebelo tem as pernas na porção anterior.',
    memoria:
      'A fissura mais funda separa "o cerebelo do corpo" (anterior) do "cerebelo do córtex" (posterior).',
    pontos: [
      'Que lobos a fissura prima separa?',
      'Que divisões funcionais correspondem a eles?',
      'Por que o alcoolismo afeta preferencialmente o lobo anterior?',
    ],
  },
  {
    termos: ['Fissura Posterolateral'],
    classe: 'snc',
    resumo: 'Fissura que separa o lobo floculonodular do restante do cerebelo.',
    localizacao: 'Face inferior do cerebelo, entre o nódulo e a úvula, e entre o flóculo e o restante do hemisfério.',
    funcao: 'Delimita o lobo mais antigo filogeneticamente, o arquicerebelo.',
    vascularizacao:
      'Artéria cerebelar inferior posterior. Separa o lobo floculonodular do restante do cerebelo e é a primeira fissura a se formar no desenvolvimento — coerente com separar a parte filogeneticamente mais antiga.',
    relacoes: 'É a primeira fissura a se formar no desenvolvimento embrionário, apesar do nome.',
    clinica:
      'A separação anatômica corresponde a uma separação funcional completa: o vestibulocerebelo é a única parte do cerebelo que projeta diretamente aos núcleos vestibulares sem passar pelos núcleos profundos. Isso explica por que sua lesão isolada dá desequilíbrio e nistagmo sem qualquer dismetria de membros.',
    memoria:
      'A fissura que separa o cerebelo "do equilíbrio" do cerebelo "do movimento". Duas funções, dois territórios.',
    pontos: [
      'Que lobo a fissura posterolateral delimita?',
      'Qual a peculiaridade das projeções desse lobo?',
      'Que déficit isolado sua lesão produz?',
    ],
  },
  {
    termos: ['Fissura Horizontal'],
    classe: 'snc',
    sistemas: ['nervoso'],
    resumo: 'Fissura profunda que circunda a margem lateral do cerebelo, dividindo-o em faces superior e inferior.',
    localizacao: 'Margem lateral de cada hemisfério cerebelar, do pedúnculo cerebelar médio até a linha média posterior.',
    funcao: 'Separa as faces superior e inferior do cerebelo; é a fissura mais longa e a mais fácil de identificar numa peça.',
    vascularizacao:
      'Divide os territórios da artéria cerebelar superior, acima, e da cerebelar inferior posterior, abaixo — a fronteira vascular mais nítida do cerebelo, visível como divisor de águas nos infartos cerebelares.',
    inervacao:
      'Como todo o cerebelo, não recebe inervação sensitiva própria; suas fibras aferentes são as vias espinocerebelares e pontocerebelares, e a dor de uma lesão cerebelar vem da dura-máter e dos vasos, nunca do parênquima.',
    relacoes: 'Aloja, no seu fundo, ramos da artéria cerebelar superior.',
    clinica:
      'É o plano de dissecção usado para separar as faces do cerebelo na abordagem supracerebelar infratentorial à região pineal — via que aproveita um espaço anatômico já existente em vez de criar um. É também a referência para orientar-se numa peça isolada de cerebelo.',
    memoria: 'A "linha do equador" do cerebelo. Acima dela, face superior; abaixo, inferior.',
    pontos: [
      'Que faces do cerebelo a fissura horizontal separa?',
      'Que artéria corre no seu fundo?',
      'Que uso cirúrgico ela tem?',
    ],
  },
  {
    termos: ['Fissura Pré Central'],
    classe: 'snc',
    resumo: 'Fissuras do lobo anterior do cerebelo, que delimitam o lóbulo central e o cúlmen.',
    localizacao: 'Face superior do verme, no lobo anterior: a pré-central antes do lóbulo central e a pré-culminar antes do cúlmen.',
    funcao: 'Subdividem o lobo anterior nos seus lóbulos vermianos, cada um correspondendo a um segmento da representação corporal.',
    vascularizacao: 'Ramos vermianos da artéria cerebelar superior.',
    relacoes: 'A pré-culminar precede o cúlmen, o maior lóbulo do verme anterior.',
    clinica:
      'A subdivisão detalhada do verme é a base do mapeamento somatotópico do cerebelo por ressonância funcional, hoje usada para planejar ressecções e para entender a topografia da ataxia. Na prática clínica de rotina, o que importa é saber que o lobo anterior representa o corpo — e por isso sua atrofia dá ataxia axial e de marcha.',
    memoria:
      'O verme anterior tem um "homúnculo" com as pernas na frente. Álcool ataca aí, e o paciente cambaleia.',
    pontos: [
      'Que estruturas essas fissuras delimitam?',
      'Que representação corporal existe no lobo anterior?',
      'Qual a tradução clínica dessa topografia?',
    ],
  },
  {
    termos: ['Fissura Pós Clival'],
    classe: 'snc',
    resumo: 'Fissuras do verme posterior, que separam declive, folium, túber, pirâmide e úvula.',
    localizacao: 'Face inferior e posterior do verme, subdividindo os lóbulos do lobo posterior.',
    funcao: 'Delimitam os lóbulos vermianos posteriores, que integram o cerebelo posterior e suas conexões corticais.',
    vascularizacao:
      'Artéria cerebelar superior no vérmis e ramos da cerebelar inferior posterior nas porções mais baixas.',
    relacoes: 'A pós-piramidal separa a pirâmide da úvula; a pré-piramidal, o túber da pirâmide.',
    clinica:
      'A nomenclatura detalhada do verme é usada sobretudo em imagem e em anatomia comparada; na clínica, o que orienta é a divisão em verme anterior (postura e marcha) e posterior (cognição e afeto). Reconhecer as fissuras permite localizar com precisão lesões vermianas na ressonância sagital.',
    memoria:
      'As fissuras do verme dividem lóbulos com nomes curiosos — pirâmide, úvula, túber. São subdivisões de um verme só.',
    pontos: [
      'Que lóbulos essas fissuras separam?',
      'Qual a divisão funcional prática do verme?',
      'Onde essas fissuras são melhor visualizadas?',
    ],
  },
  {
    termos: ['Lóbulo Central'],
    classe: 'snc',
    resumo: 'Lóbulo do verme anterior, entre a língula e o cúlmen.',
    localizacao: 'Face superior do verme, no lobo anterior, atrás da língula.',
    funcao: 'Integra o espinocerebelo: recebe aferências proprioceptivas dos membros inferiores e do tronco pelos tratos espinocerebelares.',
    vascularizacao:
      'Ramos vermianos superiores da artéria cerebelar superior. Faz parte do lobo anterior, o espinocerebelo, que recebe as vias espinocerebelares e ajusta o tônus e a marcha.',
    relacoes: 'Suas asas se estendem lateralmente para os hemisférios.',
    clinica:
      'É parte do território atrofiado na degeneração cerebelar alcoólica e na deficiência de vitamina E, ambas com ataxia de marcha predominante. A correspondência entre lóbulo vermiano e segmento corporal explica por que a ataxia pode ser de tronco, de marcha ou de membros conforme a região acometida.',
    memoria:
      'Verme anterior recebe as pernas. Por isso as ataxias que começam pela marcha nascem aqui.',
    pontos: [
      'Que aferências o lóbulo central recebe?',
      'A que divisão funcional ele pertence?',
      'Que doenças o atrofiam preferencialmente?',
    ],
  },
  {
    termos: ['Cúlmen'],
    classe: 'snc',
    resumo: 'O maior lóbulo do verme anterior, no ponto mais alto do cerebelo.',
    localizacao: 'Face superior do verme, entre o lóbulo central e a fissura prima.',
    funcao: 'Parte do espinocerebelo, com representação do tronco e dos membros inferiores.',
    vascularizacao:
      'Artéria cerebelar superior, por seus ramos vermianos. É a porção mais alta do vérmis e a mais atingida na degeneração cerebelar alcoólica — daí a marcha atáxica de base alargada com membros superiores relativamente poupados.',
    relacoes: 'É o ponto mais elevado do cerebelo, em contato com a tenda.',
    clinica:
      'Por ser o ponto mais alto, é a região comprimida contra a tenda do cerebelo nas lesões expansivas da fossa posterior, e a primeira a herniar para cima na herniação transtentorial ascendente — quadro raro que pode ocorrer após drenagem ventricular em paciente com massa infratentorial, com compressão do mesencéfalo.',
    memoria:
      'Cúlmen é o "cume" do cerebelo. Quando a fossa posterior incha, é o cume que sobe e bate na tenda.',
    pontos: [
      'Onde se localiza o cúlmen?',
      'Que função ele integra?',
      'O que é a herniação transtentorial ascendente?',
    ],
  },
  {
    termos: ['Declive'],
    classe: 'snc',
    resumo: 'Lóbulos do verme posterior, entre a fissura prima e a pré-piramidal.',
    localizacao: 'Face superior e posterior do verme: declive logo atrás da fissura prima, seguido pelo folium e pelo túber.',
    funcao:
      'Integram o cerebelo posterior; o declive e o folium recebem aferências visuais e auditivas, e o túber participa das conexões cerebrocerebelares.',
    vascularizacao: 'Ramos vermianos da artéria cerebelar superior.',
    relacoes: 'O folium é o lóbulo mais fino, com poucas folhas.',
    clinica:
      'A região do declive e do folium recebe projeções tectocerebelares e participa da coordenação entre olhar e movimento. Lesões do verme posterior estão associadas à síndrome cerebelar cognitivo-afetiva, com desinibição e alteração da regulação emocional.',
    memoria:
      'Descendo o verme por trás: declive, folium, túber, pirâmide, úvula, nódulo. Uma sequência que segue a curva do cerebelo.',
    pontos: [
      'Onde se localizam declive, folium e túber?',
      'Que aferências essa região recebe?',
      'Que síndrome se associa ao verme posterior?',
    ],
  },
  {
    termos: ['Pirâmide'],
    classe: 'snc',
    sistemas: ['nervoso'],
    resumo: 'Lóbulo do verme posterior, entre as fissuras pré e pós-piramidal, na face inferior do cerebelo.',
    localizacao: 'Face inferior do verme, entre o túber e a úvula.',
    funcao: 'Integra o espinocerebelo posterior, com representação corporal e conexões com o núcleo fastigial.',
    vascularizacao:
      'Ramos vermianos da artéria cerebelar inferior posterior. É o ponto de referência do vérmis inferior e vizinho da úvula, com quem forma o alvo dos meduloblastomas da infância.',
    relacoes: 'Está próxima ao teto do quarto ventrículo.',
    clinica:
      'O verme inferior, com a pirâmide e a úvula, é a região invadida pelo meduloblastoma na criança — o tumor maligno mais comum do sistema nervoso central pediátrico. A localização explica a tríade de apresentação: ataxia de tronco, cefaleia matinal e vômitos por hidrocefalia obstrutiva do quarto ventrículo.',
    memoria:
      'Criança com ataxia de tronco e vômito matinal: pense em tumor de verme inferior obstruindo o IV ventrículo.',
    pontos: [
      'Onde se localiza a pirâmide do verme?',
      'Que tumor infantil acomete essa região?',
      'Que tríade clínica ele produz?',
    ],
  },
  {
    termos: ['Úvula'],
    classe: 'snc',
    sistemas: ['nervoso'],
    resumo: 'Lóbulo do verme inferior, entre a pirâmide e o nódulo.',
    localizacao: 'Face inferior do verme, entre as tonsilas cerebelares.',
    funcao: 'Faz parte do verme posterior e tem conexões vestibulares, participando do controle postural.',
    vascularizacao: 'Artéria cerebelar inferior posterior, por seus ramos vermianos inferiores.',
    inervacao:
      'Não tem inervação própria; suas aferentes são vestibulares. Vale a nota clínica: a úvula e as tonsilas cerebelares vizinhas são o que hernia pelo forame magno na hipertensão intracraniana, comprimindo o bulbo — a herniação que mata.',
    relacoes: 'Está encaixada entre as duas tonsilas cerebelares.',
    clinica:
      'A úvula cerebelar e o nódulo são as regiões que, junto com o flóculo, controlam o reflexo vestíbulo-ocular. Sua lesão produz nistagmo de rebote e desequilíbrio, e sua estimulação está implicada na fisiopatologia da cinetose — o enjoo de movimento.',
    memoria:
      'A úvula do cerebelo não tem nada a ver com a da garganta: aqui é equilíbrio, ali é deglutição. Mesmo nome, mundos diferentes.',
    pontos: [
      'Onde se localiza a úvula cerebelar?',
      'Que função ela integra?',
      'Que estruturas vizinhas a ladeiam?',
    ],
  },
  {
    termos: ['Nódulo'],
    classe: 'snc',
    resumo: 'Lóbulo mais anterior do verme inferior, componente vermiano do lobo floculonodular.',
    localizacao: 'Face inferior e anterior do verme, formando parte do teto do quarto ventrículo.',
    funcao: 'Com os flóculos, constitui o vestibulocerebelo, que processa informação do labirinto e ajusta postura e movimentos oculares.',
    vascularizacao:
      'Artéria cerebelar inferior posterior. É a porção vermiana do lobo floculonodular, e junto com a úvula forma o centro do reflexo vestibular e a região cuja lesão produz vertigem central com nistagmo que não se esgota.',
    relacoes: 'Está ligado aos flóculos pelos pedúnculos do flóculo; forma o ápice do teto do quarto ventrículo.',
    clinica:
      'O nódulo é a estrutura cuja disfunção explica a vertigem posicional de origem central, e sua compressão por tumores do quarto ventrículo produz vertigem, nistagmo e vômitos que se confundem com labirintopatia periférica. A diferenciação se faz pelo nistagmo — vertical ou que muda de direção aponta origem central.',
    memoria:
      'Nistagmo vertical ou que troca de direção nunca é labirinto: é cerebelo ou tronco. Essa regra evita erros graves.',
    pontos: [
      'Que estrutura funcional o nódulo integra?',
      'Que relação ele tem com o quarto ventrículo?',
      'Como distinguir vertigem central de periférica pelo nistagmo?',
    ],
  },
  {
    termos: [
      'Hemisfério Cerebelar Esquerdo',
    ],
    classe: 'snc',
    resumo: 'Metade esquerda do cerebelo — que coordena o lado ESQUERDO do corpo, e não o direito.',
    localizacao: 'À esquerda do vérmis, na fossa craniana posterior, abaixo do tentório e atrás do tronco encefálico.',
    funcao:
      'Coordena o movimento do hemicorpo esquerdo. Aqui está a regra que separa o cerebelo de todo o resto do sistema nervoso: ele é IPSILATERAL. As vias cerebelares cruzam duas vezes — uma na saída para o córtex, outra no trajeto corticoespinal — e duas travessias devolvem o sinal ao mesmo lado.',
    vascularizacao:
      'Artérias cerebelar superior esquerda, na face superior, cerebelar inferior anterior esquerda, na face anterior e no pedúnculo médio, e cerebelar inferior posterior esquerda, na face inferior. Três artérias, três territórios com fronteiras nítidas.',
    inervacao:
      'Não tem inervação sensitiva. Suas aferentes são as vias espinocerebelares e pontocerebelares; a dor de uma lesão cerebelar vem da dura-máter da fossa posterior, inervada pelo nervo vago e pelos primeiros nervos cervicais — daí a cefaleia occipital e a rigidez de nuca.',
    linfaticos: 'Ausentes; drenagem perivascular.',
    relacoes: 'A tonsila cerebelar esquerda, na sua face inferomedial, está a poucos milímetros do forame magno.',
    clinica:
      'A regra da ipsilateralidade é o que localiza a lesão à beira do leito: um paciente com dismetria, disdiadococinesia e tremor de intenção à esquerda, e que cai para a esquerda ao andar, tem lesão no cerebelo do mesmo lado — o oposto do que acontece em qualquer lesão cortical. Quando a dismetria de um lado vem acompanhada de hemiparesia do mesmo lado, a lesão não é cerebelar: é do pedúnculo ou do tronco.',
    memoria: 'Cerebelo não cruza. Cai para a esquerda, erra o dedo-nariz à esquerda: a lesão é do cerebelo esquerdo.',
    pontos: [
      'Por que o cerebelo é ipsilateral?',
      'Que três artérias irrigam cada hemisfério cerebelar?',
      'Para que lado o paciente cai numa lesão cerebelar esquerda?',
    ],
  },
  {
    termos: [
      'Fissura Pré Piramidal',
    ],
    classe: 'snc',
    resumo: 'Fissura do vérmis inferior que separa o túber, à frente, da pirâmide, atrás.',
    localizacao:
      'Na face inferior do vérmis, entre o túber e a pirâmide; também chamada fissura pré-piramidal ou pós-tuberal.',
    funcao:
      'Delimita os lóbulos do vérmis inferior. Junto com as demais fissuras vermianas, subdivide o cerebelo numa sequência que a ressonância sagital lê como um mapa — cada fissura é uma coordenada.',
    vascularizacao: 'Ramos vermianos inferiores da artéria cerebelar inferior posterior (PICA).',
    inervacao: 'Sem inervação própria; aferentes espinocerebelares e vestibulares.',
    linfaticos: 'Ausentes.',
    relacoes: 'Marca o limite anterior da pirâmide do vérmis.',
    clinica:
      'As fissuras do vérmis inferior são a régua da ressonância sagital do cerebelo: identificar a pré-piramidal permite localizar com precisão a pirâmide e a úvula, região de origem da maioria dos meduloblastomas da infância — o tumor cerebral maligno mais comum na criança, que nasce no vérmis e obstrui o quarto ventrículo, com hidrocefalia e ataxia de tronco.',
    memoria: 'Fissuras do vérmis são as marcas de régua do corte sagital. Perder a referência é errar o lóbulo do tumor.',
    pontos: [
      'Que lóbulos a fissura pré-piramidal separa?',
      'Que artéria irriga essa região?',
      'Que tumor nasce no vérmis inferior?',
    ],
  },
  {
    termos: [
      'Fissura Pós Piramidal',
    ],
    classe: 'snc',
    resumo: 'Fissura entre a pirâmide e a úvula do vérmis, na face inferior do cerebelo.',
    localizacao: 'Face inferior do vérmis, atrás da pirâmide e à frente da úvula; também chamada fissura secundária.',
    funcao:
      'Separa a pirâmide da úvula. A úvula, logo atrás dela, pertence funcionalmente ao vestibulocerebelo, e a pirâmide, ao espinocerebelo — a fissura é também uma fronteira funcional.',
    vascularizacao: 'Ramos vermianos inferiores da artéria cerebelar inferior posterior (PICA).',
    inervacao: 'Sem inervação própria; aferentes vestibulares e espinocerebelares.',
    linfaticos: 'Ausentes.',
    relacoes: 'É a fissura mais profunda da face inferior do vérmis, e por isso a mais fácil de reconhecer.',
    clinica:
      'A úvula e as tonsilas cerebelares, imediatamente atrás dela, são as estruturas que descem pelo forame magno na herniação tonsilar — a que comprime o bulbo e para a respiração. Na malformação de Chiari tipo I, a medida da descida tonsilar abaixo do forame magno é o critério diagnóstico, e é a partir desta fissura que a referência é tomada.',
    memoria:
      'Depois desta fissura vêm a úvula e as tonsilas — as peças que descem pelo forame magno e comprimem o bulbo.',
    pontos: [
      'Que lóbulos ela separa?',
      'Que fronteira funcional ela marca?',
      'Que estruturas herniam pelo forame magno?',
    ],
  },
  {
    termos: [
      'Fissura Pré Culminar',
    ],
    classe: 'snc',
    resumo: 'Fissura do vérmis superior que separa o lóbulo central, à frente, do cúlmen, atrás.',
    localizacao: 'Face superior do vérmis, no lobo anterior, entre o lóbulo central e o cúlmen.',
    funcao:
      'Subdivide o lobo anterior do cerebelo, o espinocerebelo — a porção que recebe as vias espinocerebelares e ajusta o tônus muscular e a marcha.',
    vascularizacao: 'Ramos vermianos da artéria cerebelar superior.',
    inervacao: 'Sem inervação própria; aferentes espinocerebelares.',
    linfaticos: 'Ausentes.',
    relacoes: 'Está no lobo anterior, à frente da fissura prima, que é a divisória principal do cerebelo.',
    clinica:
      'O lobo anterior e o vérmis superior, que esta fissura subdivide, são o alvo da degeneração cerebelar alcoólica — a atrofia começa no cúlmen e nos lóbulos vizinhos e produz um quadro muito característico: ataxia de marcha com base alargada, sem tremor de intenção nos braços e sem nistagmo. É a ataxia que se vê andando, e não no exame do dedo-nariz.',
    memoria:
      'Álcool ataca o vérmis de cima. O paciente anda mal e faz o dedo-nariz normalmente — a ataxia é só das pernas.',
    pontos: [
      'Que lóbulos a fissura pré-culminar separa?',
      'A que divisão funcional do cerebelo essa região pertence?',
      'Qual o padrão clínico da degeneração cerebelar alcoólica?',
    ],
  },
  {
    termos: [
      'Folium',
    ],
    classe: 'snc',
    resumo: 'Lóbulo estreito do vérmis, entre o declive e o túber — o ponto mais posterior do cerebelo.',
    localizacao:
      'Face posterior do vérmis, no fundo da fissura horizontal, entre o declive acima e o túber abaixo. Também chamado fólio do vérmis.',
    funcao:
      'Faz parte do vérmis do lobo posterior. Nele projeta-se parte da representação visual e auditiva do cerebelo — junto com o túber, é a região que integra informação sensorial ao ajuste do movimento.',
    vascularizacao:
      'Está exatamente na fronteira entre os territórios da artéria cerebelar superior, acima, e da cerebelar inferior posterior, abaixo — a fissura horizontal é o divisor de águas, e o folium fica no seu fundo.',
    inervacao: 'Sem inervação própria; aferentes pontocerebelares.',
    linfaticos: 'Ausentes.',
    relacoes: 'É o lóbulo mais estreito do vérmis, uma lâmina fina no fundo da fissura horizontal.',
    clinica:
      'Por ficar exatamente no divisor de águas entre duas artérias, é uma das regiões cerebelares que sofrem em hipoperfusão global — parada cardíaca, hipotensão prolongada — mesmo sem oclusão arterial nenhuma. Infartos de zona limítrofe no cerebelo são subdiagnosticados justamente porque não correspondem ao território de nenhuma artéria nomeada.',
    memoria:
      'O folium mora no fundo da fissura horizontal, na fronteira de duas artérias. Território de ninguém é o primeiro a sofrer quando a pressão cai.',
    pontos: [
      'Onde exatamente o folium se situa?',
      'Que fronteira vascular passa por ele?',
      'O que é um infarto de zona limítrofe?',
    ],
  },
  {
    termos: [
      'Túber',
    ],
    classe: 'snc',
    resumo: 'Lóbulo do vérmis posterior, entre o folium e a pirâmide.',
    localizacao: 'Face posteroinferior do vérmis, abaixo da fissura horizontal e à frente da fissura pré-piramidal.',
    funcao:
      'Pertence ao vérmis do lobo posterior. Junto com o folium, recebe aferências visuais e auditivas e participa do ajuste do movimento à informação sensorial — o cerebelo corrigindo o corpo pelo que os olhos e os ouvidos informam.',
    vascularizacao:
      'Ramos vermianos da artéria cerebelar inferior posterior (PICA), já abaixo do divisor de águas da fissura horizontal.',
    inervacao: 'Sem inervação própria; aferentes pontocerebelares e vestibulares.',
    linfaticos: 'Ausentes.',
    relacoes: 'Continua-se abaixo com a pirâmide do vérmis, separado dela pela fissura pré-piramidal.',
    clinica:
      'O vérmis posterior, do qual o túber faz parte, é o substrato da síndrome cognitivo-afetiva cerebelar de Schmahmann — a demonstração de que o cerebelo não é só motor. Lesões vermianas produzem desinibição, embotamento afetivo, déficit de planejamento e alteração da prosódia, sem qualquer ataxia. É o quadro que faz um paciente com lesão cerebelar ser encaminhado à psiquiatria.',
    memoria: 'O cerebelo também pensa. Lesão do vérmis posterior muda o comportamento sem tirar o equilíbrio.',
    pontos: [
      'Onde o túber se localiza no vérmis?',
      'Que artéria o irriga?',
      'O que é a síndrome cognitivo-afetiva cerebelar?',
    ],
  },
]
