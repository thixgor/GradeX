import type { Vista } from './esquemas'

/**
 * As janelas do exame com instrumento simples.
 *
 * ## O problema que gerou esta ala
 *
 * O aluno chega à clínica da família com o otoscópio na mão e descobre, ali,
 * que "translúcida, nacarada, com triângulo luminoso ântero-inferior" é um
 * conjunto de palavras que ele sabe repetir e não sabe reconhecer. A descrição
 * verbal só vira competência visual quando existe alguma imagem contra a qual
 * comparar — e é exatamente isso que falta.
 *
 * ## Estrutura ≠ cena
 *
 * A separação vem do atlas de Raio-X e resolve uma confusão que atrapalha o
 * ensino. **Estrutura** é anatomia: cabo do martelo, umbo, pars flaccida. Ela
 * mora na cena normal e o aluno a acende uma a uma até saber nomeá-la sozinho.
 * **Cena** é achado: a membrana abaulada da otite média aguda, o nível
 * hidroaéreo da otite com efusão. Quem não separa as duas decora "triângulo
 * luminoso" sem entender que ele desaparece porque a membrana perdeu a
 * planura — e, portanto, sem conseguir prever nada.
 *
 * Cada cena carrega um campo que não existe em atlas nenhum: `diferencaDoNormal`.
 * É o delta escrito por extenso. Aprender achado patológico sem a referência
 * normal explícita ao lado é o motivo de tanta gente terminar a graduação
 * capaz de descrever otite média aguda e incapaz de dizer se o ouvido da
 * frente está bem.
 *
 * ## Sobre as figuras
 *
 * São esquemáticas e desenhadas por nós, não fotografias (a justificativa está
 * em `esquemas.ts`). O desenho ensina o **padrão**; a fotografia ensina a
 * **variação**, e as duas competências são necessárias — por isso `ondeVerFoto`
 * aponta onde conferir o caso real.
 *
 * Onde a fonte tem autorização escrita para a DomineAqui — hoje o Radiopaedia,
 * marcado com `licenciada` — o caso pode ser exibido aqui dentro, ao lado do
 * esquema, com o crédito exigido. Onde não tem, o vínculo continua sendo só um
 * ponteiro para fora, e a interface diz isso.
 */
export const VISTAS: Vista[] = [
  {
    slug: 'otoscopia',
    nome: 'Otoscopia',
    instrumento: 'otoscopio',
    resumo:
      'A membrana timpânica normal e as seis que aparecem no plantão — com o que muda em cada uma e por quê.',
    paraQue:
      'Decide entre otite média aguda, otite média com efusão, otite externa e ouvido normal com dor referida. Essas quatro respondem pela esmagadora maioria das otalgias, e a conduta difere completamente: antibiótico sistêmico, observação, gota tópica ou procurar a dor em outro lugar (dente, ATM, faringe, cervical).',
    comoFazer: [
      {
        passo: 'Escolha o maior espéculo que entre confortavelmente.',
        detalhe:
          'Espéculo pequeno demais entra fundo, dói e mostra menos. O maior que couber alarga o campo e aproxima a fonte de luz da membrana.',
      },
      {
        passo: 'Tracione o pavilhão para cima e para trás no adulto; para baixo e para trás na criança.',
        detalhe:
          'O conduto do adulto tem uma curva em S que a tração retifica. Na criança, o conduto é mais curto e angulado para baixo — a tração é inversa, e quem usa a manobra do adulto vê parede em vez de tímpano.',
      },
      {
        passo: 'Apoie a mão do otoscópio na face do paciente.',
        detalhe:
          'A mão apoiada acompanha o movimento da cabeça. Sem apoio, um movimento súbito da criança transforma o espéculo em trauma de conduto.',
      },
      {
        passo: 'Identifique o cabo do martelo primeiro, e só depois olhe o resto.',
        detalhe:
          'É a referência de orientação da membrana inteira: ele aponta para baixo e para trás, e o umbo fica na sua extremidade. Sem essa âncora, não dá para dizer se o que se vê é pars tensa ou pars flaccida.',
      },
      {
        passo: 'Faça otoscopia pneumática quando a dúvida for efusão.',
        detalhe:
          'A mobilidade da membrana ao insuflar é o dado que separa membrana opaca com líquido de membrana apenas cicatricial. Sem pneumática, a otite média com efusão é sobrediagnosticada e subdiagnosticada ao mesmo tempo.',
      },
    ],
    qualidade: [
      'O cabo do martelo está identificável — sem ele, a membrana não tem orientação.',
      'Vê-se a pars tensa em pelo menos três quadrantes.',
      'O conduto está livre de cerume obstrutivo; se não está, remova antes de concluir qualquer coisa.',
      'A luz do otoscópio está branca e forte — lâmpada gasta amarela a membrana e simula opacidade.',
    ],
    estruturas: [
      { slug: 'cabo-do-martelo', nome: 'Cabo do martelo', original: 'manubrium mallei', nota: 'Traço esbranquiçado que cruza a membrana de cima para baixo e para trás. É a bússola da otoscopia: tudo se localiza a partir dele.', x: 46, y: 42 },
      { slug: 'umbo', nome: 'Umbo', original: 'umbo membranae tympanicae', nota: 'Ponto mais deprimido da membrana, na extremidade inferior do cabo do martelo. Dele parte o triângulo luminoso.', x: 49, y: 57 },
      { slug: 'triangulo-luminoso', nome: 'Triângulo luminoso (cone de luz)', original: 'cone of light', nota: 'Reflexo da luz do otoscópio na porção ântero-inferior. Existe porque a membrana normal é plana e inclinada; some quando ela abaula ou retrai — é um detector de geometria, não um enfeite.', x: 62, y: 66 },
      { slug: 'pars-tensa', nome: 'Pars tensa', original: 'pars tensa', nota: 'A maior parte da membrana, tensionada pelo anel fibrocartilaginoso. Translúcida no normal, deixa entrever o promontório.', x: 35, y: 62 },
      { slug: 'pars-flaccida', nome: 'Pars flaccida (membrana de Shrapnell)', original: 'pars flaccida', nota: 'Porção superior, sem camada fibrosa e por isso frouxa. É onde nasce o colesteatoma adquirido — e é a parte que quase todo mundo esquece de examinar.', x: 50, y: 22 },
      { slug: 'processo-lateral', nome: 'Processo lateral do martelo', original: 'processus lateralis mallei', nota: 'Pequena saliência no topo do cabo do martelo, marcando o limite entre pars tensa e pars flaccida. Fica proeminente quando a membrana retrai.', x: 45, y: 29 },
      { slug: 'anulo', nome: 'Ânulo timpânico', original: 'anulus fibrosus', nota: 'Anel fibroso que fixa a pars tensa ao sulco timpânico. Delimita a periferia da membrana.', x: 20, y: 50 },
      { slug: 'promontorio', nome: 'Promontório (por transparência)', original: 'promontorium', nota: 'Relevo da cóclea visto através da membrana translúcida. Enxergá-lo é sinal de que a membrana está transparente — e, portanto, sem líquido atrás.', x: 60, y: 45 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Membrana timpânica normal',
        estado: 'normal',
        diagnostico: 'Ouvido médio aerado, membrana íntegra e móvel.',
        achado:
          'Membrana translúcida, cinza-perolada, levemente côncava. Cabo do martelo visível cruzando de cima para trás e para baixo, umbo no centro, triângulo luminoso ântero-inferior bem definido. Pars flaccida sem retração nem crosta. Mobilidade normal à otoscopia pneumática.',
        leitura: [
          'Localize o cabo do martelo e defina anterior e posterior.',
          'Siga até o umbo e confirme o triângulo luminoso partindo dele para a frente e para baixo.',
          'Procure o promontório por transparência — se o vê, não há líquido atrás.',
          'Suba até a pars flaccida e procure retração, crosta ou bolsa.',
          'Insufle e observe o movimento.',
        ],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Se há otalgia com membrana normal, procure a dor fora do ouvido: ATM, dente, faringe, coluna cervical, nevralgia.',
        diferencial: ['Dor referida de ATM', 'Faringite', 'Dor dentária', 'Nevralgia do glossofaríngeo'],
        ilustracao: { id: 'otoscopia', params: { cena: 'normal' }, alt: 'Membrana timpânica normal, translúcida, com cabo do martelo e triângulo luminoso' },
      },
      {
        id: 'otite-media-aguda',
        titulo: 'Otite média aguda',
        estado: 'alterado',
        diagnostico: 'Infecção bacteriana do ouvido médio com efusão sob pressão.',
        achado:
          'Membrana **abaulada**, hiperemiada, opaca, com o cabo do martelo obscurecido e o triângulo luminoso ausente. Mobilidade reduzida ou ausente. Pode haver nível hidroaéreo ou aspecto amarelado por pus retroilimpânico.',
        leitura: [
          'Abaulamento é o achado que mais pesa — hiperemia isolada não faz diagnóstico.',
          'Procure o cabo do martelo: no abaulamento franco ele desaparece sob a convexidade.',
          'O triângulo luminoso some porque a superfície deixou de ser plana.',
          'Confirme mobilidade reduzida à pneumática.',
        ],
        diferencaDoNormal:
          'A membrana normal é côncava e translúcida; aqui ela está **convexa** e opaca. A convexidade é o que a pressão do pus produz, e é ela — não a cor — que define o diagnóstico. Criança chorando fica com a membrana vermelha sem ter otite nenhuma; criança com membrana abaulada tem.',
        conduta:
          'Analgesia sempre. Antibiótico (amoxicilina em primeira linha) para menores de 6 meses, quadro grave, otorreia ou bilateral em menor de 2 anos; observação vigiada por 48–72 h é opção razoável nos demais casos selecionados.',
        diferencial: ['Otite média com efusão', 'Miringite bolhosa', 'Membrana hiperemiada por choro ou febre'],
        ilustracao: { id: 'otoscopia', params: { cena: 'otite-media-aguda' }, alt: 'Membrana timpânica abaulada, hiperemiada e opaca da otite média aguda' },
        patologia: 'otite-media-aguda',
      },
      {
        id: 'otite-media-com-efusao',
        titulo: 'Otite média com efusão',
        estado: 'alterado',
        diagnostico: 'Líquido no ouvido médio sem sinais de infecção aguda.',
        achado:
          'Membrana **retraída** ou em posição neutra, opaca ou âmbar, com nível hidroaéreo ou bolhas visíveis por transparência. Cabo do martelo proeminente e horizontalizado. Mobilidade reduzida à pneumática. Sem hiperemia importante e sem dor.',
        leitura: [
          'Procure nível hidroaéreo e bolhas — quando presentes, são praticamente diagnósticos.',
          'Repare no cabo do martelo: a retração o torna mais horizontal e o processo lateral, mais saliente.',
          'A cor âmbar traduz efusão serosa.',
          'Confirme com pneumática: a mobilidade é o achado mais sensível.',
        ],
        diferencaDoNormal:
          'A normal é côncava discreta e translúcida, com promontório visível. Aqui a concavidade é **exagerada** (pressão negativa por disfunção tubária) e a transparência se perde pelo líquido. O contraste com a otite média aguda é o vetor: lá a membrana é empurrada para fora, aqui é puxada para dentro.',
        conduta:
          'Observação por até 3 meses na maioria das crianças. Avaliar audição; tubo de ventilação se persistente com perda auditiva ou atraso de linguagem. Antibiótico não está indicado.',
        diferencial: ['Otite média aguda em resolução', 'Timpanoesclerose', 'Disfunção tubária isolada'],
        ilustracao: { id: 'otoscopia', params: { cena: 'otite-media-com-efusao' }, alt: 'Membrana retraída e âmbar com nível hidroaéreo da otite média com efusão' },
        patologia: 'otite-media-com-efusao',
      },
      {
        id: 'perfuracao',
        titulo: 'Perfuração timpânica',
        estado: 'alterado',
        diagnostico: 'Solução de continuidade da membrana, traumática ou pós-infecciosa.',
        achado:
          'Defeito na membrana com bordas visíveis, através do qual se enxerga a mucosa do promontório. Perfurações centrais poupam o ânulo; perfurações marginais o atingem e são as de risco. Pode haver otorreia.',
        leitura: [
          'Defina se a perfuração é central ou marginal — a marginal é a que permite migração de epitélio e formação de colesteatoma.',
          'Estime o tamanho em relação aos quadrantes.',
          'Procure otorreia e caracterize: purulenta, mucoide, fétida.',
          'Avalie audição: perda condutiva proporcional à área perdida.',
        ],
        diferencaDoNormal:
          'A membrana normal é uma superfície contínua; aqui há um buraco através do qual se vê a mucosa do ouvido médio — mais rósea e brilhante que a membrana. O reflexo luminoso fica distorcido ou ausente ao redor do defeito.',
        conduta:
          'Manter o ouvido seco, evitar gotas ototóxicas (aminoglicosídeos), analgesia. A maioria das perfurações traumáticas fecha sozinha em semanas. Encaminhar ao otorrinolaringologista se marginal, persistente, com otorreia crônica ou com suspeita de colesteatoma.',
        diferencial: ['Bolsa de retração profunda', 'Colesteatoma', 'Tubo de ventilação in situ'],
        ilustracao: { id: 'otoscopia', params: { cena: 'perfuracao' }, alt: 'Perfuração central da pars tensa com mucosa do promontório visível' },
        patologia: 'perfuracao-timpanica',
      },
      {
        id: 'otite-externa',
        titulo: 'Otite externa aguda',
        estado: 'alterado',
        diagnostico: 'Infecção do conduto auditivo externo (ouvido de piscina).',
        achado:
          'Conduto edemaciado, hiperemiado, com debris e secreção; dor intensa à tração do pavilhão e à pressão do trago. A membrana timpânica, quando visível, está normal — e frequentemente não é visível pelo edema do conduto.',
        leitura: [
          'A dor à tração do pavilhão e à pressão no trago é o achado que separa de otite média: na média, essas manobras não doem.',
          'Avalie o grau de estreitamento do conduto — decide se cabe gota ou se é preciso mecha.',
          'Procure ver a membrana; se não conseguir, registre isso em vez de presumir normalidade.',
          'Em diabético ou imunossuprimido com dor desproporcional, pense em otite externa necrosante.',
        ],
        diferencaDoNormal:
          'Aqui o problema não está na membrana — está no caminho até ela. O conduto normal é amplo, com pele fina e alguns pelos no terço externo; na otite externa ele está tumefeito a ponto de a luz não alcançar o fundo.',
        conduta:
          'Gota otológica tópica (quinolona ± corticoide) por 7 a 10 dias, analgesia, manter seco. Mecha se o conduto estiver muito estreito. Antibiótico sistêmico só com celulite periauricular, imunossupressão ou suspeita de necrosante.',
        diferencial: ['Otite média aguda com otorreia', 'Furunculose do conduto', 'Otomicose', 'Otite externa necrosante'],
        ilustracao: { id: 'otoscopia', params: { cena: 'otite-externa' }, alt: 'Conduto auditivo edemaciado e hiperemiado, com membrana pouco visível' },
        patologia: 'otite-externa',
      },
      {
        id: 'cerume-obstrutivo',
        titulo: 'Rolha de cerume',
        estado: 'alterado',
        diagnostico: 'Obstrução do conduto por cerume impactado.',
        achado:
          'Massa amarelo-acastanhada ocupando o conduto e impedindo a visualização da membrana. Pode causar hipoacusia condutiva, plenitude auricular, zumbido e tontura.',
        leitura: [
          'Confirme que é cerume e não corpo estranho ou colesteatoma do conduto.',
          'Avalie se há pele do conduto lesada antes de tentar remoção.',
          'Pergunte por uso de cotonete — ele empurra o cerume para dentro e é a causa mais comum de impactação.',
        ],
        diferencaDoNormal:
          'Não há achado de membrana nenhum: o exame simplesmente **não foi feito**. É o motivo mais comum de otoscopia não diagnóstica, e registrar "membrana normal" aqui é inventar um achado.',
        conduta:
          'Remoção por curetagem sob visão, irrigação morna (contraindicada se houver suspeita de perfuração) ou ceruminolítico por alguns dias. Reexaminar a membrana depois — a queixa pode não ser o cerume.',
        diferencial: ['Corpo estranho', 'Otomicose', 'Colesteatoma de conduto'],
        ilustracao: { id: 'otoscopia', params: { cena: 'cerume' }, alt: 'Conduto obstruído por rolha de cerume impedindo a visualização da membrana' },
      },
    ],
    armadilhas: [
      'Hiperemia isolada não é otite média aguda. Criança que chora, febril ou com o espéculo forçado fica com a membrana vermelha. **O achado é o abaulamento.**',
      'Concluir "membrana normal" sem ter visto a membrana. Se o cerume obstruiu, o exame não foi feito.',
      'Esquecer a pars flaccida. É lá que a bolsa de retração e o colesteatoma começam, e ela fica fora do campo de quem só olha o centro.',
      'Usar a tração do adulto na criança. O conduto infantil aponta para baixo, e a manobra errada mostra parede.',
      'Otoscopia sem pneumática em suspeita de efusão: sem testar mobilidade, o diagnóstico é chute.',
    ],
    ondeVerFoto: [
      {
        titulo: 'Radiopaedia — Ear, nose and throat',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Correlação entre o achado otoscópico e a tomografia de mastoide e ouvido médio — mastoidite, colesteatoma, otite crônica.',
        licenciada: 'radiopaedia',
        nota: 'Acervo de radiologia: a correlação é forte, mas a fotografia otoscópica em si é escassa lá.',
      },
      { titulo: 'Open i / National Library of Medicine', url: 'https://openi.nlm.nih.gov/', oQueProcurar: 'Fotografias otoscópicas publicadas em artigos de acesso aberto — verifique a licença de cada imagem antes de reutilizar.' },
    ],
    referencias: [
      'Lieberthal AS et al. The Diagnosis and Management of Acute Otitis Media. AAP Clinical Practice Guideline, Pediatrics, 2013.',
      'Rosenfeld RM et al. Clinical Practice Guideline: Otitis Media with Effusion. Otolaryngol Head Neck Surg, 2016.',
      'Porto CC. Semiologia Médica, 8ª ed.',
    ],
  },

  {
    slug: 'fundoscopia',
    nome: 'Fundo de olho',
    instrumento: 'oftalmoscopio',
    resumo:
      'O único lugar do corpo onde se vê artéria, veia e nervo diretamente, sem cortar nada — e o mais abandonado dos exames.',
    paraQue:
      'Responde a perguntas que nenhum outro exame de beira-leito responde: há hipertensão intracraniana (papiledema)? Há retinopatia diabética que ameaça a visão? Que tempo de hipertensão este paciente tem? Há embolia retiniana? É o exame que torna visível o dano microvascular sistêmico.',
    comoFazer: [
      {
        passo: 'Escureça a sala e peça ao paciente que fixe um ponto distante.',
        detalhe:
          'A midríase fisiológica do escuro dá margem de manobra sem colírio. Fixar o olhar longe reduz a acomodação e estabiliza o eixo.',
      },
      {
        passo: 'Olho direito seu para olho direito do paciente; esquerdo para esquerdo.',
        detalhe:
          'Evita o choque de narizes e permite aproximar o suficiente. Parece detalhe de etiqueta e é o que determina a distância de trabalho.',
      },
      {
        passo: 'Comece a 30 cm, encontre o reflexo vermelho e só então se aproxime.',
        detalhe:
          'O reflexo vermelho é a estrada: seguindo-o, você chega à retina. Perder o reflexo e continuar avançando é como andar às cegas — e é o que faz o exame falhar.',
      },
      {
        passo: 'Aproxime-se seguindo um vaso em direção ao disco.',
        detalhe:
          'Os vasos convergem para o disco óptico e os ramos apontam para ele como setas — o ângulo da bifurcação indica o caminho. É o atalho mais confiável para achar o disco.',
      },
      {
        passo: 'Examine em ordem fixa: disco, vasos, mácula, periferia.',
        detalhe:
          'Ordem fixa impede esquecimento. A mácula por último porque a luz sobre ela provoca miose e desconforto, encerrando o exame.',
      },
      {
        passo: 'Dilate quando necessário — e saiba quando não dilatar.',
        detalhe:
          'Tropicamida melhora enormemente o exame. Evite em suspeita de glaucoma de ângulo fechado e quando o acompanhamento neurológico depende da pupila.',
      },
    ],
    qualidade: [
      'O disco óptico foi localizado e suas bordas, avaliadas.',
      'A relação escavação/disco foi estimada.',
      'Artérias e veias foram comparadas em calibre e nos cruzamentos.',
      'A mácula foi vista, com ou sem reflexo foveal.',
      'O exame registra qual olho, se houve dilatação e o que não foi possível ver.',
    ],
    estruturas: [
      { slug: 'disco-optico', nome: 'Disco óptico (papila)', original: 'optic disc', nota: 'Entrada do nervo óptico. Redondo a levemente oval, amarelo-alaranjado, com bordas nítidas. É a referência de tamanho do fundo: tudo se mede em "diâmetros de disco".', x: 30, y: 50 },
      { slug: 'escavacao', nome: 'Escavação fisiológica', original: 'optic cup', nota: 'Depressão central mais pálida do disco. Relação escavação/disco normal até ~0,3–0,5; acima disso, ou assimétrica entre os olhos, levanta suspeita de glaucoma.', x: 30, y: 50 },
      { slug: 'arteriolas', nome: 'Arteríolas retinianas', original: 'retinal arterioles', nota: 'Mais finas e mais claras que as vênulas, com reflexo luminoso central estreito. Relação arteríola/vênula normal ~2:3.', x: 52, y: 32 },
      { slug: 'venulas', nome: 'Vênulas retinianas', original: 'retinal venules', nota: 'Mais calibrosas e escuras. Pulsação venosa espontânea no disco, quando presente, torna hipertensão intracraniana improvável.', x: 52, y: 66 },
      { slug: 'macula', nome: 'Mácula', original: 'macula lutea', nota: 'Região de maior acuidade, cerca de 2 diâmetros de disco temporal à papila, sem vasos de grande calibre e mais escura que a retina em volta.', x: 70, y: 52 },
      { slug: 'fovea', nome: 'Fóvea / reflexo foveal', original: 'fovea centralis', nota: 'Centro da mácula. O reflexo puntiforme brilhante é sinal de arquitetura preservada; sua perda é achado precoce de edema macular.', x: 72, y: 52 },
      { slug: 'arcadas', nome: 'Arcadas vasculares temporais', original: 'temporal vascular arcades', nota: 'Os grandes vasos que contornam a mácula acima e abaixo. Delimitam o polo posterior, onde mora quase toda a doença que ameaça a visão.', x: 62, y: 24 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Fundo de olho normal',
        estado: 'normal',
        diagnostico: 'Retina, disco e vasos sem alteração.',
        achado:
          'Disco óptico de bordas nítidas, coloração amarelo-alaranjada, escavação fisiológica em torno de 0,3. Relação arteríola/vênula ~2:3, cruzamentos arteriovenosos sem compressão. Mácula com reflexo foveal presente. Retina aplicada, sem hemorragias, exsudatos ou manchas algodonosas.',
        leitura: [
          'Disco: bordas, cor, escavação.',
          'Vasos: calibre relativo, trajeto, cruzamentos.',
          'Mácula: reflexo foveal presente?',
          'Retina: procurar hemorragias, exsudatos duros, manchas algodonosas, neovasos.',
        ],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em diabético, repetir conforme o rastreio recomendado mesmo com fundo normal.',
        diferencial: [],
        ilustracao: { id: 'fundoscopia', params: { cena: 'normal' }, alt: 'Fundo de olho normal com disco de bordas nítidas, vasos e mácula' },
      },
      {
        id: 'papiledema',
        titulo: 'Papiledema',
        estado: 'alterado',
        diagnostico: 'Edema de disco óptico por hipertensão intracraniana.',
        achado:
          'Disco com **bordas borradas**, elevado, hiperemiado, com apagamento da escavação. Vasos que emergem do disco parecem "mergulhar" na elevação. Hemorragias em chama de vela peripapilares e manchas algodonosas nos casos mais intensos. Ausência de pulsação venosa espontânea. Bilateral em quase todos os casos.',
        leitura: [
          'Comece pelas bordas nasais do disco — são as primeiras a borrar.',
          'Procure a escavação: seu apagamento indica elevação real.',
          'Siga os vasos sobre a borda: no papiledema eles somem sob o tecido edemaciado.',
          'Procure pulsação venosa espontânea; se presente, papiledema é improvável.',
          'Examine o outro olho — papiledema unilateral é raro e muda o diferencial.',
        ],
        diferencaDoNormal:
          'O disco normal é plano e de bordas nítidas, com escavação visível. Aqui ele está **elevado**, as bordas se dissolvem na retina em volta e a escavação desaparece. A acuidade visual costuma estar preservada no início — o que distingue papiledema de neurite óptica, em que a visão cai cedo e o acometimento é tipicamente unilateral e doloroso à movimentação ocular.',
        conduta:
          'Urgência. Neuroimagem imediata para excluir massa, trombose venosa cerebral e hidrocefalia; se a imagem for normal, punção lombar com medida de pressão de abertura. Nunca puncionar antes da imagem.',
        diferencial: ['Pseudopapiledema (drusas de disco)', 'Neurite óptica', 'Neuropatia óptica isquêmica anterior', 'Hipertensão maligna'],
        ilustracao: { id: 'fundoscopia', params: { cena: 'papiledema' }, alt: 'Disco óptico elevado, hiperemiado e de bordas borradas, com hemorragias peripapilares' },
        patologia: 'hipertensao-intracraniana',
      },
      {
        id: 'retinopatia-diabetica',
        titulo: 'Retinopatia diabética',
        estado: 'alterado',
        diagnostico: 'Microangiopatia retiniana do diabetes, não proliferativa ou proliferativa.',
        achado:
          'Microaneurismas (os primeiros achados), hemorragias em ponto e borrão, **exsudatos duros** amarelados de bordas nítidas, manchas algodonosas, veias em rosário. Na forma proliferativa, **neovasos** finos e desordenados no disco ou na retina, com risco de hemorragia vítrea e descolamento tracional.',
        leitura: [
          'Varra o polo posterior procurando microaneurismas — pontos vermelhos puntiformes.',
          'Diferencie exsudato duro (amarelo, bordas nítidas, lipídico) de mancha algodonosa (branca, bordas esfumaçadas, infarto de fibra nervosa).',
          'Procure exsudatos circinados ao redor da mácula — sugerem edema macular, a principal causa de perda visual.',
          'Procure neovasos no disco e nas arcadas: sua presença muda o estadiamento e a urgência.',
        ],
        diferencaDoNormal:
          'A retina normal é uniforme, sem pontos vermelhos nem manchas. Aqui aparecem lesões que traduzem o colapso da barreira hematorretiniana: o microaneurisma é a dilatação do capilar enfraquecido, a hemorragia é o seu extravasamento, o exsudato duro é o lipídio que ficou depois que o soro reabsorveu, e o neovaso é a resposta ao VEGF liberado pela retina isquêmica.',
        conduta:
          'Controle glicêmico, pressórico e lipídico. Encaminhamento oftalmológico conforme o estadiamento; anti-VEGF intravítreo para edema macular e fotocoagulação panretiniana para doença proliferativa. Rastreio anual a partir do diagnóstico no DM2 e após 5 anos no DM1.',
        diferencial: ['Retinopatia hipertensiva', 'Oclusão de ramo venoso', 'Retinopatia da anemia falciforme', 'Retinopatia por radiação'],
        ilustracao: { id: 'fundoscopia', params: { cena: 'retinopatia-diabetica' }, alt: 'Retina com microaneurismas, hemorragias em borrão, exsudatos duros e neovasos' },
        patologia: 'diabetes-mellitus-tipo-2',
      },
      {
        id: 'retinopatia-hipertensiva',
        titulo: 'Retinopatia hipertensiva',
        estado: 'alterado',
        diagnostico: 'Dano vascular retiniano pela hipertensão arterial.',
        achado:
          'Estreitamento arteriolar difuso e focal, aumento do reflexo luminoso arteriolar (fio de cobre, depois fio de prata), **cruzamentos arteriovenosos patológicos** (sinal de Gunn, sinal de Salus). Nos graus avançados, hemorragias em chama de vela, manchas algodonosas, exsudatos em estrela macular e papiledema — este último definindo hipertensão maligna.',
        leitura: [
          'Compare o calibre das arteríolas com o das vênulas adjacentes.',
          'Olhe os cruzamentos: a arteríola endurecida comprime a vênula e ela parece interrompida (Gunn) ou desviada (Salus).',
          'Avalie o brilho da coluna arteriolar — o reflexo alargado indica espessamento da parede.',
          'Procure estrela macular e edema de disco: mudam o diagnóstico para emergência hipertensiva.',
        ],
        diferencaDoNormal:
          'A relação arteríola/vênula normal é de aproximadamente 2:3 e os cruzamentos são discretos, sem deformar a veia. Aqui a arteríola está estreitada e com a parede espessada, e é essa parede que comprime a vênula no cruzamento — o achado registra **anos** de pressão alta, e não a pressão de hoje.',
        conduta:
          'Controle pressórico. Retinopatia grau III–IV (hemorragias, exsudatos, papiledema) com pressão muito elevada configura emergência hipertensiva com lesão de órgão-alvo: redução controlada da pressão em ambiente monitorizado.',
        diferencial: ['Retinopatia diabética', 'Retinopatia da doença renal crônica', 'Oclusão venosa retiniana', 'Retinopatia por anemia'],
        ilustracao: { id: 'fundoscopia', params: { cena: 'retinopatia-hipertensiva' }, alt: 'Arteríolas estreitadas, cruzamentos patológicos e hemorragias em chama de vela' },
        patologia: 'hipertensao-arterial-sistemica',
      },
      {
        id: 'oclusao-venosa-central',
        titulo: 'Oclusão da veia central da retina',
        estado: 'alterado',
        diagnostico: 'Trombose da veia central com estase retiniana difusa.',
        achado:
          'Hemorragias em chama de vela em **todos os quatro quadrantes**, vênulas tortuosas e dilatadas, edema de disco, manchas algodonosas. A imagem clássica é descrita como "retina em molho de tomate". Perda visual súbita e indolor, unilateral.',
        leitura: [
          'Confirme a distribuição nos quatro quadrantes — na oclusão de ramo, as hemorragias respeitam um setor.',
          'Avalie o calibre e a tortuosidade venosa.',
          'Procure manchas algodonosas: quanto mais, maior a chance de forma isquêmica, com pior prognóstico e risco de glaucoma neovascular.',
          'Examine a íris em busca de neovasos (rubeosis iridis) nas semanas seguintes.',
        ],
        diferencaDoNormal:
          'O fundo normal não tem hemorragia nenhuma. Aqui o sangue toma a retina inteira porque a via de saída venosa fechou: a pressão retrógrada rompe capilares em todo o território drenado. É o oposto topográfico da oclusão arterial, em que a retina fica **pálida** por falta de fluxo, com a mancha vermelho-cereja da fóvea.',
        conduta:
          'Encaminhamento oftalmológico urgente. Investigar hipertensão, diabetes, glaucoma, dislipidemia e, em jovens, trombofilia e síndrome antifosfolípide. Anti-VEGF para edema macular.',
        diferencial: ['Oclusão de ramo venoso', 'Retinopatia diabética grave', 'Síndrome de hiperviscosidade', 'Papiledema'],
        ilustracao: { id: 'fundoscopia', params: { cena: 'oclusao-venosa-central' }, alt: 'Hemorragias em chama de vela nos quatro quadrantes com veias tortuosas' },
        patologia: 'oclusao-venosa-retiniana',
      },
    ],
    armadilhas: [
      'Não encontrar o disco e desistir. Siga um vaso: os ramos apontam para a papila, e a bifurcação indica a direção.',
      'Confundir mancha algodonosa (branca, esfumaçada, infarto de fibra nervosa) com exsudato duro (amarelo, bordas nítidas, lipídico). São mecanismos diferentes e pesos diferentes.',
      'Drusas de disco simulam papiledema (pseudopapiledema) — bordas irregulares, sem hiperemia, com pulsação venosa presente.',
      'Dilatar sem checar câmara anterior em paciente com risco de glaucoma de ângulo fechado.',
      'Dilatar paciente neurológico sob vigilância pupilar sem avisar a equipe. A pupila é um dado de monitorização.',
    ],
    ondeVerFoto: [
      {
        titulo: 'Radiopaedia',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Correlação com neuroimagem no papiledema e na hipertensão intracraniana idiopática — sela vazia, distensão das bainhas do nervo óptico, estenose de seio transverso.',
        licenciada: 'radiopaedia',
      },
      { titulo: 'Open i / National Library of Medicine', url: 'https://openi.nlm.nih.gov/', oQueProcurar: 'Retinografias publicadas em artigos de acesso aberto; confira a licença de cada imagem.' },
    ],
    referencias: [
      'Wong TY, Mitchell P. Hypertensive Retinopathy. NEJM, 2004;351:2310-7.',
      'Solomon SD et al. Diabetic Retinopathy: A Position Statement by the American Diabetes Association. Diabetes Care, 2017.',
      'Porto CC. Semiologia Médica, 8ª ed.',
    ],
  },

  {
    slug: 'orofaringoscopia',
    nome: 'Orofaringoscopia',
    instrumento: 'abaixador',
    resumo:
      'O exame que decide entre antibiótico e sintomático em milhões de consultas — e o que reconhece a emergência que se esconde entre elas.',
    paraQue:
      'Separa faringite viral de estreptocócica, reconhece o abscesso peritonsilar e identifica candidíase e lesões que pedem investigação. É também onde se avalia a via aérea antes de sedar alguém (Mallampati).',
    comoFazer: [
      {
        passo: 'Boa luz e abaixador apoiado nos dois terços anteriores da língua.',
        detalhe: 'Apoio posterior demais dispara o reflexo de vômito e encerra o exame antes de começar.',
      },
      {
        passo: 'Peça "ah" sustentado.',
        detalhe: 'Eleva o palato mole, abre a visão da orofaringe e permite avaliar a simetria da úvula — assimetria é o achado do abscesso peritonsilar.',
      },
      {
        passo: 'Descreva as amígdalas em grau e em conteúdo.',
        detalhe: 'Hipertrofia (graus 1 a 4) e presença de exsudato são coisas distintas e devem ser registradas separadamente.',
      },
      {
        passo: 'Palpe as cadeias cervicais anteriores.',
        detalhe: 'Adenomegalia cervical anterior dolorosa é um dos critérios de Centor e muda a probabilidade pré-teste.',
      },
      {
        passo: 'Procure trismo, voz "de batata quente" e sialorreia.',
        detalhe: 'Esse trio, com ou sem exsudato, aponta para infecção profunda — e o exame deixa de ser de consultório.',
      },
    ],
    qualidade: [
      'As duas amígdalas foram vistas, e a parede posterior também.',
      'A úvula foi avaliada quanto à posição e à simetria.',
      'Registrou-se presença ou ausência de trismo.',
      'As cadeias cervicais foram palpadas.',
    ],
    estruturas: [
      { slug: 'uvula', nome: 'Úvula', original: 'uvula palatina', nota: 'Central e móvel. Desvio lateral é o achado que levanta abscesso peritonsilar; edema isolado sugere angioedema ou uvulite.', x: 50, y: 40 },
      { slug: 'amigdalas', nome: 'Amígdalas palatinas', original: 'tonsilla palatina', nota: 'Entre os pilares anterior e posterior. Gradue a hipertrofia de 1 a 4 e descreva o exsudato separadamente.', x: 30, y: 50 },
      { slug: 'pilar-anterior', nome: 'Pilar amigdaliano anterior', original: 'arcus palatoglossus', nota: 'Prega do palatoglosso. Abaulamento do pilar com desvio da úvula é a assinatura do abscesso peritonsilar.', x: 38, y: 44 },
      { slug: 'parede-posterior', nome: 'Parede posterior da faringe', original: 'paries posterior pharyngis', nota: 'Onde se veem gotejamento pós-nasal, hiperemia difusa e folículos linfoides proeminentes da faringite viral.', x: 50, y: 60 },
      { slug: 'palato-mole', nome: 'Palato mole', original: 'palatum molle', nota: 'Petéquias no palato são sugestivas de faringite estreptocócica; vesículas apontam para herpangina e mão-pé-boca.', x: 50, y: 26 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Orofaringe normal',
        estado: 'normal',
        diagnostico: 'Mucosa íntegra, amígdalas sem exsudato, úvula central.',
        achado: 'Mucosa rósea e úmida, amígdalas grau 1, sem exsudato nem criptas purulentas, úvula central e móvel, palato sem petéquias, parede posterior sem hiperemia importante.',
        leitura: ['Confirme simetria da úvula.', 'Gradue as amígdalas.', 'Procure exsudato, petéquias e vesículas.', 'Olhe a parede posterior.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Odinofagia com orofaringe normal amplia o diferencial para refluxo, tireoidite, corpo estranho e causa cervical.',
        diferencial: ['Doença do refluxo', 'Tireoidite subaguda', 'Corpo estranho'],
        ilustracao: { id: 'orofaringe', params: { cena: 'normal' }, alt: 'Orofaringe normal com amígdalas pequenas e úvula central' },
      },
      {
        id: 'faringite-estreptococica',
        titulo: 'Faringite estreptocócica',
        estado: 'alterado',
        diagnostico: 'Faringoamigdalite por estreptococo beta-hemolítico do grupo A.',
        achado:
          'Amígdalas hipertrofiadas e hiperemiadas com exsudato esbranquiçado, petéquias no palato mole, úvula edemaciada, adenomegalia cervical anterior dolorosa. Ausência de tosse e de coriza é parte do quadro.',
        leitura: [
          'Some os critérios de Centor: febre > 38 °C, ausência de tosse, exsudato amigdaliano, adenomegalia cervical anterior dolorosa (e idade).',
          'Procure petéquias no palato — achado com boa especificidade.',
          'Confirme que não há tosse nem coriza: a presença de sintomas de via aérea superior desloca para viral.',
        ],
        diferencaDoNormal:
          'A amígdala normal é rósea e sem conteúdo nas criptas. Aqui há exsudato e hiperemia intensa, com petéquias palatinas — mas exsudato **não** é exclusivo de bactéria: mononucleose e adenovírus produzem exsudato igualmente exuberante. É por isso que a decisão usa escore mais teste, e não a aparência.',
        conduta:
          'Escore de Centor/McIsaac guia teste rápido e/ou cultura. Positivo: penicilina ou amoxicilina por 10 dias (objetivo principal é prevenir febre reumática). Escore baixo: sintomáticos, sem antibiótico.',
        diferencial: ['Faringite viral', 'Mononucleose infecciosa', 'Abscesso peritonsilar', 'Difteria (raro, membrana acinzentada aderente)'],
        ilustracao: { id: 'orofaringe', params: { cena: 'faringite-estreptococica' }, alt: 'Amígdalas hipertrofiadas com exsudato e petéquias no palato' },
        patologia: 'faringoamigdalite-estreptococica',
      },
      {
        id: 'abscesso-peritonsilar',
        titulo: 'Abscesso peritonsilar',
        estado: 'alterado',
        diagnostico: 'Coleção purulenta no espaço peritonsilar — emergência de via aérea.',
        achado:
          'Abaulamento unilateral do pilar anterior e do palato mole, **desvio contralateral da úvula**, amígdala deslocada medialmente. Trismo, voz abafada ("batata quente"), sialorreia e odinofagia intensa unilateral.',
        leitura: [
          'Compare os dois lados: a assimetria é o achado.',
          'Localize a úvula — empurrada para o lado são.',
          'Avalie trismo: dificulta o exame e sinaliza acometimento do pterigoideo.',
          'Avalie a via aérea antes de qualquer procedimento.',
        ],
        diferencaDoNormal:
          'Na faringite, mesmo intensa, a orofaringe permanece **simétrica** e a úvula, central. Aqui há massa de um lado só empurrando a linha média — e essa assimetria é o que transforma uma dor de garganta em emergência.',
        conduta:
          'Drenagem (punção ou incisão) por profissional habilitado, antibiótico com cobertura para anaeróbios, analgesia, hidratação, corticoide em casos selecionados. Avaliar via aérea; tomografia se houver suspeita de extensão para espaço parafaríngeo.',
        diferencial: ['Celulite peritonsilar', 'Abscesso parafaríngeo ou retrofaríngeo', 'Mononucleose com amígdalas volumosas', 'Neoplasia de amígdala'],
        ilustracao: { id: 'orofaringe', params: { cena: 'abscesso-peritonsilar' }, alt: 'Abaulamento peritonsilar unilateral com desvio da úvula' },
        patologia: 'abscesso-peritonsilar',
      },
      {
        id: 'candidiase-oral',
        titulo: 'Candidíase oral',
        estado: 'alterado',
        diagnostico: 'Infecção fúngica da mucosa oral.',
        achado:
          'Placas brancas cremosas em língua, mucosa jugal e palato, **destacáveis à raspagem**, deixando base eritematosa e por vezes sangrante. Pode haver queilite angular e forma eritematosa (atrófica) sem placas.',
        leitura: [
          'Raspe com o abaixador: a placa da candidíase sai; leucoplasia não sai e exige biópsia.',
          'Procure queilite angular.',
          'Investigue o contexto: corticoide inalatório sem lavar a boca, antibiótico recente, prótese mal higienizada, diabetes, imunossupressão.',
        ],
        diferencaDoNormal:
          'A mucosa normal é rósea e uniforme. Aqui há placas brancas removíveis — e a remoção é o teste: o que sai e revela base eritematosa é cândida; o que não sai é outra coisa, e essa distinção de dez segundos decide entre nistatina e biópsia.',
        conduta:
          'Nistatina tópica ou fluconazol conforme extensão. Corrigir o fator predisponente. Candidíase extensa ou recorrente em adulto sem causa aparente exige investigação de imunossupressão, incluindo HIV.',
        diferencial: ['Leucoplasia', 'Líquen plano oral', 'Leucoplasia pilosa oral', 'Queimadura química'],
        ilustracao: { id: 'orofaringe', params: { cena: 'candidiase' }, alt: 'Placas brancas destacáveis na língua e mucosa jugal' },
        patologia: 'candidiase-oral',
      },
    ],
    armadilhas: [
      'Exsudato não prova bactéria. Mononucleose e adenovírus produzem exsudato exuberante — e amoxicilina em mononucleose provoca exantema.',
      'Não avaliar a simetria da úvula: é o que separa faringite de abscesso peritonsilar.',
      'Forçar o abaixador em criança com sialorreia, estridor e posição de tripé. Suspeita de epiglotite é contraindicação ao exame na sala de consulta.',
      'Tratar como faringite a odinofagia unilateral com trismo. Unilateralidade é sinal de doença de espaço profundo.',
    ],
    ondeVerFoto: [
      { titulo: 'Open i / National Library of Medicine', url: 'https://openi.nlm.nih.gov/', oQueProcurar: 'Imagens de faringoamigdalite, abscesso peritonsilar e candidíase em artigos abertos; confira a licença de cada uma.' },
    ],
    referencias: [
      'Shulman ST et al. IDSA Clinical Practice Guideline for Group A Streptococcal Pharyngitis. Clin Infect Dis, 2012.',
      'Centor RM et al. The diagnosis of strep throat in adults in the emergency room. Med Decis Making, 1981.',
    ],
  },

  {
    slug: 'rinoscopia-anterior',
    nome: 'Rinoscopia anterior',
    instrumento: 'especulo-nasal',
    resumo:
      'Trinta segundos de exame que separam rinite alérgica de rinossinusite, encontram o pólipo e localizam o ponto do sangramento.',
    paraQue:
      'Avalia obstrução nasal, rinorreia e epistaxe. Identifica a mucosa pálida e edemaciada da rinite alérgica, a hiperemia com secreção purulenta da rinossinusite bacteriana, o desvio septal obstrutivo, o pólipo e a área de Kiesselbach nas epistaxes anteriores.',
    comoFazer: [
      { passo: 'Introduza o espéculo fechado e abra no sentido vertical.', detalhe: 'A abertura vertical respeita a anatomia da narina e evita pressionar o septo, que dói e sangra.' },
      { passo: 'Não apoie o espéculo no septo.', detalhe: 'A mucosa septal é fina e ricamente vascularizada; a pressão provoca epistaxe iatrogênica e apaga o achado que se foi procurar.' },
      { passo: 'Examine primeiro com a cabeça em posição neutra, depois em extensão.', detalhe: 'A posição neutra mostra o assoalho e o corneto inferior; a extensão dá acesso ao meato médio, onde drenam os seios maxilar, frontal e etmoidal anterior.' },
      { passo: 'Use vasoconstritor tópico quando o edema impedir a visão.', detalhe: 'A descongestão revela estruturas posteriores e diferencia edema reversível de massa.' },
      { passo: 'Na epistaxe, procure o ponto sangrante na porção ântero-inferior do septo.', detalhe: 'A área de Kiesselbach responde por ~90% das epistaxes; identificá-la permite cauterização dirigida em vez de tamponamento às cegas.' },
    ],
    qualidade: [
      'Ambas as fossas foram examinadas.',
      'O septo foi avaliado quanto a desvio, perfuração e pontos sangrantes.',
      'O corneto inferior foi visto e sua mucosa, descrita (cor, volume).',
      'Registrou-se presença ou ausência de pólipo e de secreção, e de onde a secreção vem.',
    ],
    estruturas: [
      { slug: 'septo', nome: 'Septo nasal', original: 'septum nasi', nota: 'Divide as fossas. Avalie desvio, esporão, perfuração e a área de Kiesselbach na porção ântero-inferior.', x: 50, y: 50 },
      { slug: 'corneto-inferior', nome: 'Corneto inferior', original: 'concha nasalis inferior', nota: 'A estrutura mais visível à rinoscopia anterior. Pálido e edemaciado na rinite alérgica; hiperemiado na infecciosa. Frequentemente confundido com pólipo por quem está começando.', x: 30, y: 58 },
      { slug: 'corneto-medio', nome: 'Corneto médio', original: 'concha nasalis media', nota: 'Visível com a cabeça em extensão. Sob ele está o meato médio.', x: 33, y: 34 },
      { slug: 'meato-medio', nome: 'Meato médio', original: 'meatus nasi medius', nota: 'Onde drenam os seios maxilar, frontal e etmoidal anterior. Secreção purulenta saindo daqui é o achado da rinossinusite bacteriana.', x: 38, y: 42 },
      { slug: 'area-kiesselbach', nome: 'Área de Kiesselbach (plexo de Little)', original: 'locus Kiesselbachi', nota: 'Anastomose vascular na porção ântero-inferior do septo. Origem de cerca de 90% das epistaxes.', x: 56, y: 64 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Fossa nasal normal',
        estado: 'normal',
        diagnostico: 'Mucosa íntegra, cornetos sem hipertrofia, septo centrado.',
        achado: 'Mucosa rósea e úmida, corneto inferior de volume normal, septo na linha média sem esporão, sem secreção, sem pólipo.',
        leitura: ['Avalie o septo.', 'Avalie cor e volume do corneto inferior.', 'Procure secreção e de onde ela vem.', 'Com a cabeça em extensão, procure o meato médio.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma.',
        diferencial: [],
        ilustracao: { id: 'rinoscopia', params: { cena: 'normal' }, alt: 'Fossa nasal normal com septo centrado e corneto inferior de volume normal' },
      },
      {
        id: 'rinite-alergica',
        titulo: 'Rinite alérgica',
        estado: 'alterado',
        diagnostico: 'Inflamação nasal mediada por IgE.',
        achado: 'Mucosa **pálida, azulada ou acinzentada**, corneto inferior edemaciado, secreção clara e aquosa. Frequentemente com prega nasal transversa, olheiras alérgicas e hipertrofia de tecido linfoide.',
        leitura: ['Repare na cor: palidez e tom azulado, não hiperemia.', 'Avalie o volume do corneto inferior e se ele reduz com vasoconstritor.', 'Caracterize a secreção: clara e aquosa.', 'Procure os sinais associados na face.'],
        diferencaDoNormal: 'A mucosa normal é rósea; aqui ela está **pálida** — o edema da inflamação alérgica afasta os capilares da superfície e descora a mucosa. É o oposto da rinite infecciosa, em que a vasodilatação a deixa vermelha. Cor, aqui, é um dado diagnóstico.',
        conduta: 'Corticoide nasal tópico como primeira linha, anti-histamínico de segunda geração, controle ambiental. Considerar imunoterapia em casos selecionados.',
        diferencial: ['Rinite não alérgica', 'Rinite medicamentosa (uso crônico de vasoconstritor)', 'Rinossinusite crônica', 'Polipose nasal'],
        ilustracao: { id: 'rinoscopia', params: { cena: 'rinite-alergica' }, alt: 'Mucosa nasal pálida e azulada com corneto inferior edemaciado' },
        patologia: 'rinite-alergica',
      },
      {
        id: 'polipo-nasal',
        titulo: 'Pólipo nasal',
        estado: 'alterado',
        diagnostico: 'Polipose nasossinusal.',
        achado: 'Massa lisa, translúcida, acinzentada, **insensível ao toque e móvel**, geralmente originada do meato médio. Obstrução nasal progressiva e hiposmia.',
        leitura: [
          'Diferencie do corneto inferior: o pólipo é pálido, translúcido e não dói ao toque; o corneto é rosado, sensível e fixo.',
          'Identifique a origem — o meato médio é o local típico.',
          'Pólipo unilateral em adulto exige investigação: pode ser papiloma invertido ou neoplasia.',
        ],
        diferencaDoNormal: 'Na fossa normal não há massa alguma entre septo e parede lateral. O erro clássico é chamar o corneto inferior hipertrofiado de "pólipo" — o toque resolve: o corneto dói, o pólipo não.',
        conduta: 'Corticoide nasal tópico, avaliação otorrinolaringológica, tomografia de seios paranasais. Cirurgia endoscópica nos refratários. Investigar asma, intolerância a AINE (tríade de Samter) e fibrose cística em crianças.',
        diferencial: ['Corneto inferior hipertrofiado', 'Papiloma invertido', 'Encefalocele (em criança — não biopsiar antes de imagem)', 'Neoplasia'],
        ilustracao: { id: 'rinoscopia', params: { cena: 'polipo' }, alt: 'Pólipo nasal translúcido emergindo do meato médio' },
        patologia: 'polipose-nasal',
      },
    ],
    armadilhas: [
      'Confundir corneto inferior hipertrofiado com pólipo. O corneto é rosado, sensível ao toque e reduz com vasoconstritor; o pólipo é pálido, insensível e não reduz.',
      'Apoiar o espéculo no septo e provocar epistaxe.',
      'Não examinar a fossa contralateral. Pólipo e secreção unilaterais têm significado diferente dos bilaterais.',
      'Massa nasal unilateral em criança pode ser encefalocele ou glioma — imagem antes de qualquer biópsia.',
    ],
    ondeVerFoto: [
      {
        titulo: 'Radiopaedia',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Tomografia de seios paranasais correlacionando polipose e rinossinusite crônica com o achado da rinoscopia.',
        licenciada: 'radiopaedia',
      },
    ],
    referencias: [
      'Fokkens WJ et al. EPOS 2020: European Position Paper on Rhinosinusitis and Nasal Polyps.',
      'Porto CC. Semiologia Médica, 8ª ed.',
    ],
  },
]

export const TOTAL_DE_VISTAS = VISTAS.length
export const TOTAL_DE_CENAS = VISTAS.reduce((total, vista) => total + vista.cenas.length, 0)
export const TOTAL_DE_ESTRUTURAS_DE_VISTA = VISTAS.reduce((total, vista) => total + vista.estruturas.length, 0)

export function vistaPorSlug(slug: string): Vista | undefined {
  return VISTAS.find((vista) => vista.slug === slug)
}
