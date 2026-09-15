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
      {
        id: 'colesteatoma',
        titulo: 'Colesteatoma',
        estado: 'alterado',
        diagnostico: 'Massa de queratina no ouvido médio, que erode osso e não para de crescer.',
        achado:
          'Massa branca, nacarada ou com detritos amarelados, na pars flaccida ou no quadrante póstero-superior, dentro de uma bolsa de retração ou de uma perfuração marginal. Frequentemente com granulação vermelha na borda e otorreia fétida. A membrana ao redor costuma estar retraída e opaca.',
        leitura: [
          'Vá direto à pars flaccida: é onde o colesteatoma adquirido começa, e é a região que a otoscopia apressada não olha.',
          'Procure a bolsa de retração e o que há dentro dela — escama branca é queratina, não cerume.',
          'Note a borda: perfuração marginal (que toca o ânulo) é suspeita; a central da otite crônica simples, não.',
          'Pergunte por otorreia crônica fétida e hipoacusia progressiva.',
        ],
        diferencaDoNormal:
          'A pars flaccida normal é lisa e discreta. Aqui ela foi sugada para dentro pela pressão negativa crônica, virou uma bolsa, e a pele que reveste a bolsa continuou descamando queratina para um espaço que não tem saída. A massa branca é essa queratina acumulada — pele no lugar errado, com enzimas que dissolvem osso. Não é infecção; é a anatomia comendo a si mesma.',
        conduta:
          'Encaminhamento ao otorrinolaringologista, sem urgência mas sem demora: tomografia de mastoide para a extensão, e cirurgia — não há tratamento clínico que resolva. Antibiótico tópico só para a otorreia enquanto se espera. Complicações (paralisia facial, vertigem, abscesso, meningite) mudam para urgência.',
        diferencial: ['Otite média crônica com granulação', 'Cerume ou escama de pele na pars flaccida', 'Timpanoesclerose (placa branca, mas plana e na pars tensa)', 'Colesteatoma congênito (atrás de membrana íntegra)'],
        ilustracao: { id: 'otoscopia', params: { cena: 'colesteatoma', area: 30 }, alt: 'Massa branca nacarada na pars flaccida, dentro de bolsa de retração, com granulação na borda' },
      },
      {
        id: 'otite-media-cronica',
        titulo: 'Otite média crônica com perfuração',
        estado: 'alterado',
        diagnostico: 'Perfuração timpânica persistente com otorreia intermitente.',
        achado:
          'Perfuração central ampla, de bordas espessadas e regulares, através da qual se vê a mucosa do promontório — rosada quando quieta, vermelha e úmida na agudização. Restos de membrana retraídos ou esclerosados. Otorreia mucoide ou purulenta sem dor.',
        leitura: [
          'Meça a perfuração e diga onde está: central poupa o ânulo; marginal o alcança.',
          'Olhe o que está atrás — mucosa lisa ou pólipo e granulação.',
          'Procure escama branca na borda: colesteatoma associado muda tudo.',
          'Teste a audição com diapasão: hipoacusia condutiva é a regra; neurossensorial pede investigação.',
        ],
        diferencaDoNormal:
          'A perfuração traumática recente tem bordas finas e irregulares e fecha sozinha. Esta não fecha: a mucosa do ouvido médio migrou para a borda e a epitelizou, e o tímpano perdeu a capacidade de regenerar. O que se vê pelo buraco é o ouvido médio ao vivo — e é por ele que a água da piscina entra e a otorreia sai.',
        conduta:
          'Ouvido seco: proteger da água, tratar agudizações com gotas de quinolona (não aminoglicosídeo, ototóxico com tímpano aberto). Encaminhar para timpanoplastia quando seco e sem colesteatoma. Se houver escama branca na borda ou perfuração marginal, tomografia e cirurgia mais cedo.',
        diferencial: ['Perfuração traumática recente', 'Colesteatoma com perfuração marginal', 'Otite média crônica com granulação (polipoide)', 'Tuberculose de ouvido médio (múltiplas perfurações)'],
        ilustracao: { id: 'otoscopia', params: { cena: 'otite-media-cronica', diametro: 7 }, alt: 'Perfuração central ampla de bordas espessadas com mucosa do promontório visível' },
      },
      {
        id: 'timpano-retraido',
        titulo: 'Tímpano retraído',
        estado: 'alterado',
        diagnostico: 'Disfunção da tuba auditiva com pressão negativa no ouvido médio.',
        achado:
          'Membrana côncava, puxada para dentro: cabo do martelo horizontalizado e encurtado, processo lateral proeminente, triângulo luminoso deslocado ou fragmentado. Sem líquido visível. Na retração mais profunda, a membrana se apoia sobre a bigorna ou o promontório.',
        leitura: [
          'Repare no cabo do martelo: retraído, ele parece mais curto e mais horizontal.',
          'Procure o processo lateral — ele "salta" quando a membrana afunda.',
          'Localize o cone de luz: fora do lugar ou quebrado é sinal de que a membrana perdeu a planura.',
          'Veja a pars flaccida: bolsa de retração ali é o começo do colesteatoma.',
          'Insufle: a membrana retraída mal se move.',
        ],
        diferencaDoNormal:
          'A membrana normal é levemente côncava e devolve a luz num cone limpo. Quando a tuba não ventila o ouvido médio, o ar ali é absorvido, a pressão cai e a membrana é sugada — a mesma física do vácuo numa embalagem. O cone de luz se desfaz porque a superfície deixou de ser plana; e o martelo, preso à membrana, é puxado junto.',
        conduta:
          'Tratar a causa da disfunção tubária (rinite, adenoide na criança, refluxo), manobras de autoinsuflação, e reavaliar em semanas. Retração da pars flaccida ou bolsa que não se limpa: encaminhar, pelo risco de colesteatoma. Efusão associada segue a conduta da otite média com efusão.',
        diferencial: ['Otite média com efusão (retraída, mas com líquido ou nível)', 'Atelectasia timpânica (retração fixa sobre o promontório)', 'Bolsa de retração com colesteatoma'],
        ilustracao: { id: 'otoscopia', params: { cena: 'timpano-retraido', retracao: 4 }, alt: 'Membrana timpânica côncava e retraída com processo lateral do martelo proeminente' },
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
      {
        id: 'descolamento-de-retina',
        titulo: 'Descolamento de retina',
        estado: 'alterado',
        diagnostico: 'Separação da retina neurossensorial do epitélio pigmentar — emergência para a visão.',
        achado:
          'Área de retina elevada, cinza-esbranquiçada e ondulada, que perde o vermelho do fundo e treme com o movimento do olho; os vasos correm escuros por cima das dobras. Começa pela periferia, em geral temporal superior, e avança para a mácula. Rasgadura em ferradura pode ser visível na borda.',
        leitura: [
          'Compare o quadrante suspeito com o oposto: a retina descolada é opaca e mais clara.',
          'Siga um vaso da papila para a periferia e veja onde ele sobe de nível.',
          'Diga se a mácula está envolvida — muda a urgência.',
          'Pergunte pelos sintomas: flashes, chuva de moscas volantes e a cortina que avança.',
        ],
        diferencaDoNormal:
          'A retina é transparente; o vermelho que se vê é a coroide atrás dela. Descolada, ela se afasta da coroide, deixa de ser irrigada por ela e fica edemaciada e opaca — vira uma membrana cinza flutuando no vítreo. O que muda a cor não é a retina: é o que se perdeu atrás dela.',
        conduta:
          'Oftalmologia no mesmo dia. Mácula ainda colada é a janela de tempo: cirurgia (retinopexia, vitrectomia ou introflexão) antes que ela solte. Não instile colírio midriático se houver dúvida sobre glaucoma agudo, e não deixe o paciente esperar deitado do lado errado.',
        diferencial: ['Retinosquise', 'Descolamento de coroide', 'Tumor de coroide (melanoma)', 'Descolamento exsudativo (sem rasgadura, líquido muda com a posição)'],
        ilustracao: { id: 'fundoscopia', params: { cena: 'descolamento-de-retina', extensao: 45 }, alt: 'Retina elevada, cinza-esbranquiçada e ondulada na periferia temporal superior' },
      },
      {
        id: 'oclusao-arterial-central',
        titulo: 'Oclusão da artéria central da retina',
        estado: 'alterado',
        diagnostico: 'Infarto da retina — o AVC do olho.',
        achado:
          'Retina difusamente pálida e edemaciada, com as arteríolas afiladas e, às vezes, segmentadas ("em vagões de trem"). No centro, a fóvea mantém a cor da coroide e se destaca como uma mancha vermelho-cereja. Perda visual súbita, indolor e profunda; defeito pupilar aferente presente.',
        leitura: [
          'Veja a retina inteira, não só a mácula: a palidez é difusa.',
          'Confirme a mancha vermelho-cereja — é a fóvea normal cercada de retina branca.',
          'Siga as arteríolas: finas, com fluxo interrompido em segmentos.',
          'Teste as pupilas: o defeito aferente relativo é a regra.',
          'Procure êmbolo visível na papila ou numa bifurcação.',
        ],
        diferencaDoNormal:
          'Sem sangue, a retina interna incha e fica opaca — branca. A fóvea é fina demais para inchar e é nutrida pela coroide, que não parou; por isso ela continua vermelha. A "cereja" não é um achado novo: é o único pedaço de fundo normal que sobrou, cercado de retina morta.',
        conduta:
          'Emergência: oftalmologia imediata (massagem ocular, redução da pressão intraocular nas primeiras horas) e, sobretudo, investigação vascular como num AVC — carótidas, ritmo cardíaco, VHS e PCR em maiores de 50 anos para arterite de células gigantes, que pode cegar o outro olho em dias.',
        diferencial: ['Oclusão de ramo arterial (setor pálido)', 'Doenças de depósito com mancha em cereja (Tay-Sachs, Niemann-Pick)', 'Neuropatia óptica isquêmica', 'Oclusão da artéria oftálmica (sem cereja — a coroide também parou)'],
        ilustracao: { id: 'fundoscopia', params: { cena: 'oclusao-arterial-central', palidez: 2 }, alt: 'Retina pálida e edemaciada com mancha vermelho-cereja na mácula e arteríolas afiladas' },
      },
      {
        id: 'hemorragia-vitrea',
        titulo: 'Hemorragia vítrea',
        estado: 'alterado',
        diagnostico: 'Sangue no vítreo obscurecendo o fundo de olho.',
        achado:
          'Reflexo vermelho apagado ou irregular; detalhes do fundo turvos ou totalmente invisíveis, atrás de um véu vermelho-escuro com grumos móveis. Perda visual súbita e indolor, com "chuva de pontos" ou "teia" que precede a queda da visão.',
        leitura: [
          'Comece pelo reflexo vermelho a 30 cm: apagado ou com sombras é o primeiro sinal.',
          'Tente ver a papila — não conseguir, num olho sem catarata, já é o achado.',
          'Compare com o outro olho para excluir opacidade de meios bilateral.',
          'Pergunte pela causa provável: diabetes, trauma, descolamento posterior do vítreo, anticoagulação.',
        ],
        diferencaDoNormal:
          'Nada mudou na retina — o que mudou é o meio entre ela e você. O sangue no vítreo funciona como fumaça na frente da fotografia: quanto mais denso, menos se vê. Por isso o exame que decide aqui não é a oftalmoscopia, e sim o ultrassom ocular, que enxerga através do sangue e diz se a retina está no lugar.',
        conduta:
          'Oftalmologia com urgência para ultrassom ocular: descolamento de retina por trás do sangue é o que não pode esperar. Sem descolamento, repouso com cabeceira elevada e reavaliação; a maioria clareia em semanas. Tratar a causa — fotocoagulação da retinopatia proliferativa, revisão da anticoagulação.',
        diferencial: ['Catarata densa', 'Uveíte com vitreíte', 'Hemorragia sub-hialóidea (nível líquido, retina visível ao redor)', 'Descolamento de retina com hemorragia'],
        ilustracao: { id: 'fundoscopia', params: { cena: 'hemorragia-vitrea', obscurecido: 60 }, alt: 'Fundo de olho turvo atrás de véu vermelho-escuro com grumos de sangue no vítreo' },
      },
      {
        id: 'papila-palida',
        titulo: 'Papila óptica pálida',
        estado: 'alterado',
        diagnostico: 'Atrofia óptica — perda de axônios do nervo óptico.',
        achado:
          'Disco branco, giz ou amarelado, com perda do rosa normal e bordas geralmente nítidas; escavação pode estar aumentada. Redução da acuidade, do campo visual e da visão de cores, com defeito pupilar aferente se unilateral ou assimétrico. Vasos de calibre normal ou afilados.',
        leitura: [
          'Compare a cor do disco com a do outro olho — a palidez unilateral é a mais fácil de ver e a mais significativa.',
          'Diga se a palidez é difusa ou de um setor (temporal, na neurite e nas tóxicas).',
          'Veja a borda: nítida na atrofia, borrada no papiledema atual.',
          'Teste pupilas, cores e campo: papila pálida sem déficit funcional pede segunda opinião.',
        ],
        diferencaDoNormal:
          'O rosa do disco normal vem dos capilares que correm entre os axônios. Quando os axônios morrem, os capilares somem com eles e sobra a lâmina crivosa — tecido branco. A papila não fica pálida por falta de sangue: fica pálida por falta de nervo, e o sangue foi embora depois.',
        conduta:
          'Investigar a causa, que quase sempre está atrás do olho: ressonância de órbitas e crânio (compressão, esclerose múltipla), história de neurite, glaucoma, tóxicos (etambutol, metanol), deficiências (B12), hereditárias. Papiledema crônico que virou atrofia significa hipertensão intracraniana antiga não tratada.',
        diferencial: ['Disco miópico com crescente (palidez aparente)', 'Hipoplasia de nervo óptico', 'Drusas de papila', 'Glaucoma avançado (escavação, não só palidez)'],
        ilustracao: { id: 'fundoscopia', params: { cena: 'papila-palida', palidez: 2 }, alt: 'Disco óptico esbranquiçado, de bordas nítidas, com perda da coloração rósea' },
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
      {
        id: 'abscesso-retrofaringeo',
        titulo: 'Abscesso retrofaríngeo',
        estado: 'alterado',
        diagnostico: 'Coleção purulenta entre a faringe e a fáscia pré-vertebral — ameaça à via aérea.',
        achado:
          'Abaulamento assimétrico e liso da parede posterior da faringe, de um lado da linha média, com mucosa hiperemiada. Criança febril, tóxica, com rigidez de pescoço, torcicolo, disfagia, sialorreia e voz abafada; pode haver estridor. Trismo é menos comum que no peritonsilar.',
        leitura: [
          'Olhe a parede posterior, não as amígdalas: o abaulamento é atrás.',
          'Compare os dois lados da linha média — a coleção é unilateral.',
          'Não force a boca nem use o abaixador com vigor em criança com estridor.',
          'Some os sinais de pescoço: rigidez, torcicolo, dor à mobilização.',
        ],
        diferencaDoNormal:
          'A parede posterior normal é um plano liso, simétrico e discretamente rosado. O espaço retrofaríngeo, atrás dela, tem linfonodos que drenam a nasofaringe e que involuem depois dos 5 anos — por isso o abscesso é doença de criança pequena. Quando um deles supura, a coleção só tem para onde crescer: para a frente, empurrando a mucosa para dentro da via aérea.',
        conduta:
          'Emergência: internação, via aérea avaliada por quem sabe garanti-la, tomografia de pescoço com contraste, antibiótico endovenoso de amplo espectro (cobrindo anaeróbios e estafilococo) e drenagem cirúrgica se a coleção for grande ou houver comprometimento respiratório. Não deitar a criança nem sedar sem plano de via aérea.',
        diferencial: ['Abscesso peritonsilar', 'Epiglotite', 'Linfadenite retrofaríngea sem supuração', 'Osteomielite ou tumor cervical'],
        ilustracao: { id: 'orofaringe', params: { cena: 'abscesso-retrofaringeo', abaulamento: 12 }, alt: 'Abaulamento assimétrico e liso da parede posterior da faringe' },
      },
      {
        id: 'epiglotite',
        titulo: 'Epiglotite',
        estado: 'alterado',
        diagnostico: 'Celulite da epiglote e supraglote — obstrução iminente da via aérea.',
        achado:
          'Epiglote edemaciada, vermelho-cereja, que pode aparecer atrás da base da língua quando o paciente abre a boca sem esforço. Paciente sentado inclinado para a frente, queixo projetado, boca aberta, salivando, com voz abafada ("batata quente"), odinofagia intensa e estridor inspiratório de instalação rápida. A orofaringe costuma parecer desproporcionalmente normal para o quadro.',
        leitura: [
          'Reconheça pela postura e pela sialorreia antes de qualquer instrumento.',
          'Não use abaixador de língua: pode precipitar obstrução completa.',
          'Se a epiglote se mostra sozinha ao abrir a boca, não peça mais nada.',
          'Faringe normal com dor de garganta desproporcional é o padrão — a doença está abaixo do que se vê.',
        ],
        diferencaDoNormal:
          'A epiglote normal é uma lâmina fina que se esconde atrás da base da língua e não entra no exame de rotina. Inflamada, ela incha até muitas vezes o tamanho e sobe para o campo de visão — e o mesmo edema estreita a entrada da laringe. É por isso que o exame que mostra o achado é o mesmo que pode matar: qualquer estímulo pode transformar a via aérea estreita em fechada.',
        conduta:
          'Emergência: não deitar, não examinar a garganta, não puncionar, não agitar. Oxigênio, chamar quem garante a via aérea (anestesia ou otorrino) e preparar intubação em ambiente controlado, com material de via aérea cirúrgica à mão. Depois da via aérea segura: culturas, antibiótico endovenoso (cefalosporina de terceira geração) e, em adulto estável, laringoscopia flexível pode ser o diagnóstico.',
        diferencial: ['Crupe (laringotraqueíte — tosse ladrante, criança menor, evolução mais lenta)', 'Abscesso retrofaríngeo', 'Corpo estranho de via aérea', 'Angioedema', 'Traqueíte bacteriana'],
        ilustracao: { id: 'orofaringe', params: { cena: 'epiglotite', edema: 2 }, alt: 'Epiglote edemaciada e vermelho-cereja aparecendo atrás da base da língua' },
      },
      {
        id: 'moniliase-extensa',
        titulo: 'Monilíase oral extensa',
        estado: 'alterado',
        diagnostico: 'Candidíase pseudomembranosa difusa — quase sempre com fator predisponente por trás.',
        achado:
          'Placas brancas cremosas, confluentes, cobrindo grande parte da língua, palato, mucosa jugal e orofaringe, que se destacam à raspagem deixando base eritematosa e por vezes sangrante. Dor, disgeusia, e odinofagia quando desce para o esôfago.',
        leitura: [
          'Estime a área: placas isoladas são uma coisa; boca inteira coberta é outra.',
          'Raspe uma placa com o abaixador — se sai e deixa vermelho, é cândida; se não sai, pense em leucoplasia ou líquen.',
          'Pergunte pelo esôfago: odinofagia junto sugere candidíase esofágica.',
          'Procure o motivo: corticoide inalado sem enxaguar, antibiótico, diabetes descompensado, HIV, quimioterapia, prótese.',
        ],
        diferencaDoNormal:
          'A candidíase comum é focal e tem um culpado óbvio — o corticoide inalado, o antibiótico da semana passada. Quando as placas tomam a boca inteira, o fungo não está mais aproveitando um descuido: está aproveitando um hospedeiro que não se defende. A extensão é o sinal; o diagnóstico que importa é o que a permitiu.',
        conduta:
          'Antifúngico sistêmico (fluconazol) em vez de só tópico, especialmente se houver odinofagia. Investigar o fator predisponente: glicemia, sorologia para HIV se não conhecida, revisão de medicamentos e da técnica do inalador. Candidíase esofágica em adulto sem causa aparente é doença definidora de AIDS até prova em contrário.',
        diferencial: ['Leucoplasia pilosa (bordas laterais da língua, não destacável)', 'Líquen plano oral', 'Leucoplasia', 'Queimadura química', 'Restos alimentares'],
        ilustracao: { id: 'orofaringe', params: { cena: 'moniliase-extensa', area: 60 }, alt: 'Placas brancas confluentes cobrindo língua, palato e mucosa' },
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
      {
        id: 'hematoma-septal',
        titulo: 'Hematoma de septo nasal',
        estado: 'alterado',
        diagnostico: 'Sangue entre a cartilagem septal e o pericôndrio, após trauma — a cartilagem necrosa em dias.',
        achado:
          'Abaulamento mole, flutuante, azul-violáceo ou vermelho-escuro do septo, uni ou bilateral, que reduz ou fecha a fossa nasal e não diminui com vasoconstritor. Obstrução nasal completa após trauma, dor à palpação com cotonete, febre se já infectado.',
        leitura: [
          'Olhe as duas fossas: o abaulamento bilateral é típico.',
          'Toque o septo com um cotonete — hematoma é mole e flutuante; septo desviado é duro.',
          'Aplique vasoconstritor tópico: a mucosa edemaciada encolhe, o hematoma não.',
          'Em toda fratura nasal, olhe o septo antes de mandar para casa.',
        ],
        diferencaDoNormal:
          'O septo normal é uma parede fina e firme, coberta por mucosa rosada. A cartilagem não tem vasos próprios: é alimentada por difusão a partir do pericôndrio. Quando o sangue se acumula entre os dois, a cartilagem fica sem nutrição — e em três a quatro dias começa a morrer. O que se vê é um abaulamento; o que está acontecendo é uma isquemia com prazo.',
        conduta:
          'Drenagem urgente (incisão ou aspiração) por quem sabe, tamponamento bilateral para reaproximar o pericôndrio e antibiótico anti-estafilocócico. Não esperar: hematoma não drenado vira abscesso, perfuração e nariz em sela. Reexaminar em 24 a 48 horas.',
        diferencial: ['Desvio de septo traumático (duro, não flutuante)', 'Edema de mucosa pós-trauma (responde ao vasoconstritor)', 'Abscesso septal (hematoma que já infectou)', 'Pólipo ou massa septal'],
        ilustracao: { id: 'rinoscopia', params: { cena: 'hematoma-septal', reducao: 60 }, alt: 'Abaulamento violáceo e flutuante do septo reduzindo a luz da fossa nasal' },
      },
      {
        id: 'desvio-septal',
        titulo: 'Desvio importante do septo',
        estado: 'alterado',
        diagnostico: 'Deformidade do septo que estreita uma fossa nasal e obstrui.',
        achado:
          'Septo deslocado ou angulado para um lado, com crista ou esporão ântero-inferior, encostando ou quase encostando no corneto inferior e reduzindo a luz da fossa. Do lado côncavo, corneto compensatoriamente hipertrofiado. Mucosa de cor normal; a obstrução é fixa, não melhora com vasoconstritor.',
        leitura: [
          'Compare a luz das duas fossas — a assimetria é o achado.',
          'Localize onde o septo toca: crista, esporão ou desvio em C.',
          'Aplique vasoconstritor: obstrução que persiste é estrutural.',
          'Pergunte por trauma antigo, epistaxe de repetição do lado convexo e ronco.',
        ],
        diferencaDoNormal:
          'O septo normal divide a fossa em duas metades semelhantes, e a respiração alterna entre elas pelo ciclo nasal. Desviado, uma metade fica permanentemente estreita e a outra recebe o fluxo todo — o corneto de lá cresce para compensar. É o oposto da rinite: a mucosa está saudável; é o esqueleto que está fora do lugar.',
        conduta:
          'Só trata desvio que causa sintoma: obstrução, sinusite de repetição, epistaxe ou apneia. Primeiro afastar e tratar a rinite associada (corticoide nasal); persistindo a obstrução, septoplastia. Desvio assintomático achado ao acaso não se opera.',
        diferencial: ['Hipertrofia de corneto por rinite (responde ao vasoconstritor)', 'Hematoma septal (mole, pós-trauma)', 'Pólipo ou massa nasal', 'Colapso de válvula nasal'],
        ilustracao: { id: 'rinoscopia', params: { cena: 'desvio-septal', obstrucao: 60 }, alt: 'Septo desviado estreitando a fossa nasal contra o corneto inferior' },
      },
      {
        id: 'epistaxe',
        titulo: 'Epistaxe anterior ativa',
        estado: 'alterado',
        diagnostico: 'Sangramento do plexo de Kiesselbach, no septo anterior.',
        achado:
          'Ponto sangrante ou vaso proeminente na porção ântero-inferior do septo (área de Little), com sangue escorrendo pelo assoalho e pela narina. Mucosa ao redor pode estar seca, erosada ou com crosta. Sangramento que sai pela frente, não pela faringe.',
        leitura: [
          'Assoe o nariz para tirar os coágulos e só então olhe — o coágulo esconde o ponto.',
          'Use vasoconstritor com anestésico e olhe o septo anterior: é onde está em 90% dos casos.',
          'Confirme que é anterior: sangue na orofaringe sem ponto anterior sugere sangramento posterior.',
          'Pergunte por anticoagulante, antiagregante, hipertensão e episódios prévios.',
        ],
        diferencaDoNormal:
          'A área de Kiesselbach é onde quatro artérias se encontram numa mucosa fina, colada à cartilagem, na parte do nariz que o dedo alcança e o ar seco resseca. É a encruzilhada vascular mais exposta do corpo. Sangra porque foi feita para sangrar — e é por isso que a pressão local resolve: o sangramento é superficial e o vaso está contra uma parede dura.',
        conduta:
          'Compressão das asas do nariz por 10 a 15 minutos cronometrados, paciente sentado e inclinado para a frente. Se persistir: vasoconstritor tópico, cauterização química (nitrato de prata) do ponto visível, ou tampão anterior. Sangramento posterior, volumoso ou em anticoagulado: tampão posterior e avaliação otorrinolaringológica. Corrigir a pressão arterial e revisar a anticoagulação.',
        diferencial: ['Epistaxe posterior (esfenopalatina)', 'Sangramento de tumor nasal ou de nasofaringe (unilateral, recorrente, em adolescente masculino: angiofibroma)', 'Telangiectasia hemorrágica hereditária', 'Coagulopatia'],
        ilustracao: { id: 'rinoscopia', params: { cena: 'epistaxe', intensidade: 2 }, alt: 'Ponto sangrante no septo anterior com sangue escorrendo pelo assoalho da fossa nasal' },
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

  {
    slug: 'pupilas',
    nome: 'Pupilas',
    instrumento: 'lanterna',
    resumo:
      'Dois círculos pretos que contam, em segundos, se o nervo óptico vê, se o terceiro nervo funciona e se o tronco cerebral está comprimido.',
    paraQue:
      'Responde perguntas que decidem urgência: a anisocoria é benigna ou é herniação? A perda visual é do olho ou do nervo? O paciente em coma tem tronco preservado? O exame leva um minuto, precisa só de uma lanterna, e o erro mais comum é não fazê-lo com a luz da sala apagada.',
    comoFazer: [
      {
        passo: 'Meça as duas pupilas na luz e depois no escuro.',
        detalhe:
          'Anisocoria que é igual nas duas condições é fisiológica. A que aumenta no escuro é a pupila pequena que não dilata (Horner); a que aumenta na luz é a pupila grande que não contrai (terceiro nervo, farmacológica).',
      },
      {
        passo: 'Ilumine cada olho por fora, de baixo, sem fazer o paciente fixar a luz.',
        detalhe:
          'Luz de frente induz acomodação e a pupila contrai por convergência, não por reflexo fotomotor. O paciente fixa um ponto distante enquanto a lanterna vem de lado.',
      },
      {
        passo: 'Registre a resposta direta e a consensual.',
        detalhe:
          'A pupila do olho não iluminado deve contrair junto. Direta ausente com consensual presente aponta para a via eferente daquele olho; as duas ausentes ao iluminar um olho, para a aferente.',
      },
      {
        passo: 'Faça o teste da lanterna oscilante.',
        detalhe:
          'Alterne a luz entre os olhos a cada 2 a 3 segundos. A pupila que dilata quando a luz chega a ela tem defeito aferente relativo: o nervo daquele lado conduz menos que o do outro.',
      },
    ],
    qualidade: [
      'Sala escurecida — no claro as pupilas já estão contraídas e a assimetria some.',
      'Paciente olhando para longe, sem fixar a lanterna.',
      'Medida em milímetros, não em "normal": 3 e 4 mm é anisocoria de 1 mm.',
      'Teste feito nas duas condições de luz antes de qualquer conclusão.',
    ],
    estruturas: [
      { slug: 'pupila-direita', nome: 'Pupila direita', original: 'pupilla dextra', nota: 'À esquerda da tela, como o examinador a vê. Diâmetro normal de 2 a 4 mm na luz e 4 a 8 mm no escuro.', x: 28, y: 50 },
      { slug: 'pupila-esquerda', nome: 'Pupila esquerda', original: 'pupilla sinistra', nota: 'À direita da tela. Deve ser igual à outra em todas as condições de luz — até 0,4 mm de diferença é normal em um quinto das pessoas.', x: 72, y: 50 },
      { slug: 'iris', nome: 'Íris', original: 'iris', nota: 'O esfíncter (parassimpático, pelo III nervo) contrai a pupila; o dilatador (simpático) a abre. Cada pupila tem dois motores, e o exame descobre qual falhou.', x: 36, y: 44 },
      { slug: 'reflexo-corneano', nome: 'Reflexo luminoso corneano', nota: 'O brilho da lanterna na córnea. Serve para conferir o alinhamento dos olhos — se cai em pontos diferentes nos dois, há estrabismo.', x: 27, y: 47 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Pupilas isocóricas e fotorreagentes',
        estado: 'normal',
        diagnostico: 'Vias aferente e eferente íntegras dos dois lados.',
        achado:
          'Pupilas redondas, centrais, de mesmo diâmetro na luz e no escuro, que contraem prontamente à luz direta e consensual e não dilatam no teste da lanterna oscilante.',
        leitura: ['Meça no claro e no escuro.', 'Ilumine cada olho e veja as duas pupilas.', 'Alterne a luz.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em coma, pupilas iguais e reativas dizem que o mesencéfalo está preservado — o problema é difuso ou está em outro lugar.',
        diferencial: [],
        ilustracao: { id: 'pupilas', params: { cena: 'normal' }, alt: 'Duas pupilas iguais, redondas e reativas à luz' },
      },
      {
        id: 'anisocoria-fisiologica',
        titulo: 'Anisocoria fisiológica',
        estado: 'alterado',
        diagnostico: 'Diferença pupilar pequena e constante, sem doença.',
        achado:
          'Diferença de até 1 mm (raramente até 2 mm) entre as pupilas, que se mantém igual na luz e no escuro, com reflexos direto e consensual normais nos dois olhos, sem ptose, sem diplopia e sem alteração da motricidade ocular. Presente em cerca de 20% das pessoas; fotos antigas costumam mostrar o mesmo.',
        leitura: [
          'Meça a diferença na luz e no escuro: se é a mesma, é fisiológica.',
          'Confira que as duas contraem bem à luz.',
          'Procure ptose e olhe a motricidade — a ausência delas é parte do diagnóstico.',
          'Peça uma foto antiga: a anisocoria já estar lá encerra a investigação.',
        ],
        diferencaDoNormal:
          'Não há diferença de mecanismo — as duas pupilas têm os dois motores funcionando; apenas o ponto de equilíbrio de uma ficou um pouco diferente do da outra. O que separa isto de doença é a **constância**: a anisocoria patológica cresce numa das condições de luz, porque um dos motores de um dos lados falhou.',
        conduta:
          'Nenhuma investigação. Registrar a medida no prontuário para que o próximo examinador, num pronto-socorro, não confunda com sinal novo. Se a diferença mudar entre as condições de luz ou surgir ptose, o raciocínio recomeça.',
        diferencial: ['Síndrome de Horner (diferença maior no escuro, ptose leve)', 'Paralisia do III nervo (diferença maior na luz, ptose, olho para fora e para baixo)', 'Pupila tônica de Adie', 'Midríase farmacológica'],
        ilustracao: { id: 'pupilas', params: { cena: 'anisocoria-fisiologica', diferenca: 1 }, alt: 'Pupilas com pequena diferença de diâmetro e reflexos normais' },
      },
      {
        id: 'defeito-pupilar-aferente',
        titulo: 'Defeito pupilar aferente relativo',
        estado: 'alterado',
        diagnostico: 'Lesão do nervo óptico ou de retina extensa de um lado.',
        achado:
          'No teste da lanterna oscilante, ao passar a luz do olho sadio para o afetado, as duas pupilas dilatam em vez de contrair — ou contraem menos e relaxam depressa. Isocoria em repouso: o defeito é da via de entrada, e a saída é bilateral. Acuidade e visão de cores reduzidas do lado afetado.',
        leitura: [
          'Alterne a luz a cada 2 a 3 segundos, várias vezes.',
          'Observe a pupila do olho que acabou de receber a luz: dilatar é o sinal.',
          'Confirme que em repouso as pupilas são iguais — DPAR não causa anisocoria.',
          'Gradue: leve (contrai e solta), moderado (não muda), grave (dilata francamente).',
        ],
        diferencaDoNormal:
          'Cada pupila contrai em resposta à luz que entra pelos **dois** olhos, somada no tronco. Quando um nervo óptico conduz menos, a luz naquele olho vale menos que a luz no outro; ao mudar a lanterna do sadio para o doente, o tronco recebe menos sinal do que recebia um segundo antes — e as duas pupilas relaxam. Nenhuma pupila está doente. O que está doente é o que ela mede.',
        conduta:
          'Investigar o nervo óptico e a retina do lado afetado: acuidade, cores, campo, fundo de olho, e ressonância de órbitas se o fundo não explica (neurite, compressão). Perda visual aguda com DPAR é oftalmologia no mesmo dia. Catarata, por mais densa, não causa DPAR — se há DPAR, há outra coisa.',
        diferencial: ['Neurite óptica', 'Neuropatia óptica isquêmica', 'Oclusão da artéria central da retina', 'Descolamento de retina extenso', 'Compressão do nervo óptico (tumor, orbitopatia)', 'Glaucoma assimétrico avançado'],
        ilustracao: { id: 'pupilas', params: { cena: 'defeito-pupilar-aferente', assimetria: 70 }, alt: 'Teste da lanterna oscilante: as pupilas dilatam quando a luz passa para o olho afetado' },
      },
    ],
    armadilhas: [
      'Examinar só na luz da sala: a anisocoria de Horner some no claro, e a do III nervo se disfarça no escuro.',
      'Confundir DPAR com anisocoria: o defeito aferente **não** deixa as pupilas diferentes em repouso.',
      'Atribuir DPAR a catarata. Opacidade de meios não causa defeito aferente; se há, procure o nervo.',
      'Esquecer o colírio e a planta: midríase farmacológica (tropicamida, escopolamina de adesivo, plantas da família da beladona) é a causa mais comum de pupila dilatada fixa em paciente acordado.',
      'Em coma, pupila fixa e dilatada unilateral é herniação até prova em contrário — não é achado para anotar, é para agir.',
    ],
    ondeVerFoto: [
      {
        titulo: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/Category:Anisocoria',
        oQueProcurar: 'Fotografias de anisocoria em diferentes condições de luz; procure as com licença livre e autor identificado.',
        licenciada: 'wikimedia-commons',
      },
    ],
    referencias: [
      'Kawasaki A. Physiology, assessment, and disorders of the pupil. Curr Opin Ophthalmol, 1999.',
      'Broadway DC. How to test for a relative afferent pupillary defect (RAPD). Community Eye Health, 2012.',
      'Campbell WW. DeJong — O Exame Neurológico, 7ª ed.',
    ],
  },
]

export const TOTAL_DE_VISTAS = VISTAS.length
export const TOTAL_DE_CENAS = VISTAS.reduce((total, vista) => total + vista.cenas.length, 0)
export const TOTAL_DE_ESTRUTURAS_DE_VISTA = VISTAS.reduce((total, vista) => total + vista.estruturas.length, 0)

export function vistaPorSlug(slug: string): Vista | undefined {
  return VISTAS.find((vista) => vista.slug === slug)
}
