import { CENAS_EXTRA_DE_VISTA, VISTAS_NOVAS } from './vistas-extra'
import { VISTAS_LEVA_4 } from './vistas-leva-4'
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
const VISTAS_BASE: Vista[] = [
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

  {
    slug: 'endoscopia-digestiva-alta',
    nome: 'Endoscopia digestiva alta',
    instrumento: 'endoscopio',
    resumo:
      'Esôfago, estômago e duodeno por dentro — onde a hemorragia digestiva mostra a fonte e o refluxo mostra o estrago.',
    paraQue:
      'Não é exame que o aluno faz; é exame que ele pede, acompanha e precisa saber ler no laudo e na foto. Responde: de onde sangra? Há esofagite, e de que grau? Isto é Barrett e precisa de biópsia? Esta úlcera é benigna ou é câncer? O que muda a conduta está na imagem — vaso visível, cordão varicoso, borda irregular — e é isso que estas cenas ensinam a reconhecer.',
    comoFazer: [
      {
        passo: 'Jejum de 6 a 8 horas, sedação e decúbito lateral esquerdo.',
        detalhe:
          'O estômago vazio é o que permite ver a mucosa; o decúbito esquerdo deixa a saliva escorrer para fora em vez de para a traqueia.',
      },
      {
        passo: 'Passagem pelo cricofaríngeo e descida pelo esôfago com insuflação mínima.',
        detalhe:
          'O esôfago se avalia na descida e na retirada. A junção escamocolunar (linha Z) é o ponto de referência de tudo o que importa aqui: esofagite acima dela, Barrett a partir dela.',
      },
      {
        passo: 'Estômago com insuflação, incluindo a retrovisão do fundo e da cárdia.',
        detalhe:
          'Sem retrovisão não se vê a pequena curvatura alta nem a cárdia — onde o câncer e as varizes gástricas se escondem.',
      },
      {
        passo: 'Duodeno até a segunda porção e biópsias conforme o achado.',
        detalhe:
          'Toda úlcera gástrica é biopsiada nas bordas; toda suspeita de Barrett, em quatro quadrantes a cada 1 a 2 cm. Sem biópsia, o laudo é só uma opinião.',
      },
    ],
    qualidade: [
      'Linha Z identificada e sua distância à arcada dentária registrada.',
      'Retrovisão gástrica realizada.',
      'Duodeno alcançado até a segunda porção.',
      'Achado descrito com a classificação que a conduta usa: Los Angeles, Praga, Forrest.',
    ],
    estruturas: [
      { slug: 'lumen', nome: 'Lúmen esofágico', original: 'lumen oesophagi', nota: 'O túnel escuro ao centro. A luz do aparelho o ilumina de perto e o perde ao fundo — o que se avalia é a parede em volta.', x: 50, y: 50 },
      { slug: 'pregas-esofagicas', nome: 'Pregas longitudinais', nota: 'Finas e pálidas, convergem para o lúmen e se apagam com a insuflação. O padrão vascular visível através delas é sinal de mucosa escamosa sadia.', x: 30, y: 30 },
      { slug: 'linha-z', nome: 'Junção escamocolunar (linha Z)', original: 'linea Z', nota: 'Onde a mucosa pálida do esôfago encontra a alaranjada do estômago, em geral a 38 a 40 cm dos dentes. É a régua da esofagite e do Barrett.', x: 50, y: 72 },
      { slug: 'padrao-vascular', nome: 'Padrão vascular', nota: 'Vasos finos e ramificados vistos através do epitélio. Somem onde há inflamação, edema ou metaplasia.', x: 72, y: 34 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Esôfago e estômago normais',
        estado: 'normal',
        diagnostico: 'Mucosa íntegra, linha Z regular, sem lesão.',
        achado:
          'Esôfago de mucosa pálida e brilhante, com padrão vascular fino visível e pregas que se apagam à insuflação; linha Z regular, sem línguas de mucosa colunar. Estômago com rugas alaranjadas, lago mucoso claro, sem erosão, úlcera ou massa.',
        leitura: ['Confirme o padrão vascular no esôfago.', 'Localize a linha Z e veja se é regular.', 'Percorra as rugas gástricas e a retrovisão.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Sintoma de refluxo com endoscopia normal é doença do refluxo não erosiva — o tratamento não depende da imagem.',
        diferencial: [],
        ilustracao: { id: 'endoscopia', params: { cena: 'eda-normal' }, alt: 'Esôfago normal à endoscopia, com lúmen central, pregas longitudinais e padrão vascular fino' },
      },
      {
        id: 'esofagite-erosiva',
        titulo: 'Esofagite erosiva',
        estado: 'alterado',
        diagnostico: 'Lesão da mucosa esofágica pelo refluxo ácido, graduada por Los Angeles.',
        achado:
          'Erosões lineares, avermelhadas, no esôfago distal, seguindo as pregas a partir da linha Z. Grau A: até 5 mm; B: maiores que 5 mm, sem confluência; C: confluentes entre pregas, ocupando menos de 75% da circunferência; D: 75% ou mais.',
        leitura: [
          'Meça a maior erosão: 5 mm é a fronteira entre A e B.',
          'Veja se elas se tocam entre uma prega e outra — é a confluência que define C.',
          'Estime a circunferência acometida para separar C de D.',
          'Procure estenose, úlcera profunda e Barrett associados.',
        ],
        diferencaDoNormal:
          'O esôfago normal é pálido e uniforme. O ácido que sobe queima primeiro o topo das pregas distais, e a erosão nasce ali, linear, seguindo a prega — por isso o desenho é de riscos radiais e não de manchas. Quando os riscos se unem, a doença deixou de ser focal: é a circunferência inteira que está exposta.',
        conduta:
          'Inibidor de bomba de prótons em dose plena por 8 semanas; nos graus C e D, manutenção contínua e endoscopia de controle para excluir Barrett por baixo da inflamação. Medidas antirrefluxo. Estenose ou sangramento mudam o plano.',
        diferencial: ['Esofagite eosinofílica (anéis e sulcos, exsudatos brancos)', 'Esofagite por comprimido (úlcera única no esôfago médio)', 'Esofagite infecciosa (cândida, herpes, CMV)', 'Esofagite cáustica'],
        ilustracao: { id: 'endoscopia', params: { cena: 'esofagite-erosiva', grau: 2 }, alt: 'Erosões lineares confluentes no esôfago distal, seguindo as pregas' },
      },
      {
        id: 'barrett',
        titulo: 'Esôfago de Barrett',
        estado: 'alterado',
        diagnostico: 'Metaplasia colunar do esôfago distal — lesão precursora do adenocarcinoma.',
        achado:
          'Línguas ou placas de mucosa cor de salmão, aveludada, subindo a partir da junção gastroesofágica sobre o esôfago pálido, com a linha Z irregular e deslocada para cima. Descreve-se pela classificação de Praga: extensão circunferencial (C) e máxima (M) em centímetros.',
        leitura: [
          'Localize a junção gastroesofágica pelo topo das pregas gástricas — não pela linha Z, que aqui subiu.',
          'Meça o segmento circunferencial e a língua mais longa.',
          'Procure nodularidade, ulceração ou irregularidade: são os sítios de biópsia dirigida.',
          'Biópsias em quatro quadrantes a cada 1 a 2 cm — sem elas o diagnóstico não existe.',
        ],
        diferencaDoNormal:
          'O esôfago é forrado de epitélio escamoso, pálido; o estômago, de epitélio colunar, alaranjado. Anos de ácido no esôfago distal trocam um pelo outro — a mucosa que aguenta ácido sobe para onde o ácido chegou. O que se vê é a fronteira entre os dois epitélios fora do lugar, e é essa mucosa trocada que pode virar câncer.',
        conduta:
          'Biópsias para confirmar metaplasia intestinal e graduar displasia. Sem displasia: inibidor de bomba de prótons e vigilância a cada 3 a 5 anos. Displasia de baixo grau: vigilância curta ou ablação; alto grau ou carcinoma precoce: ressecção endoscópica e ablação. A cirurgia antirrefluxo não elimina o Barrett.',
        diferencial: ['Linha Z irregular sem metaplasia intestinal', 'Hérnia de hiato com mucosa gástrica (abaixo da junção, não acima)', 'Esofagite em cicatrização', 'Adenocarcinoma precoce sobre Barrett'],
        ilustracao: { id: 'endoscopia', params: { cena: 'barrett', extensao: 4 }, alt: 'Línguas de mucosa salmão subindo da junção gastroesofágica sobre o esôfago pálido' },
      },
      {
        id: 'varizes-esofagicas',
        titulo: 'Varizes esofágicas',
        estado: 'alterado',
        diagnostico: 'Colaterais portossistêmicas submucosas do esôfago — hipertensão portal.',
        achado:
          'Cordões azulados, tortuosos e serpiginosos, projetando-se para o lúmen do esôfago distal, que não se apagam com a insuflação. Calibre pequeno (< 5 mm) ou grande (≥ 5 mm). Sinais vermelhos na superfície — estrias, manchas cereja — marcam risco iminente de sangramento.',
        leitura: [
          'Insufle: prega se apaga, variz não.',
          'Estime o calibre: 5 mm é o corte entre pequenas e grandes.',
          'Procure os sinais vermelhos — mudam a probabilidade de sangrar.',
          'Olhe a cárdia em retrovisão: varizes gástricas sangram mais e tratam-se diferente.',
        ],
        diferencaDoNormal:
          'O esôfago normal tem pregas longitudinais moles, que somem quando se insufla ar. A variz é uma veia: azul, cheia, que abaúla e não desaparece. Ela existe porque o sangue portal, sem passar pelo fígado cirrótico, achou caminho pelas veias do esôfago até a cava — e o esôfago distal virou a rodovia.',
        conduta:
          'Sem sangramento: profilaxia primária com betabloqueador não seletivo ou ligadura elástica se grandes ou com sinais vermelhos. Sangrando: reposição cautelosa, terlipressina ou octreotida, antibiótico profilático, ligadura elástica nas primeiras 12 horas; balão ou TIPS se refratário. Todo cirrótico com varizes tem indicação de rastreamento e reavaliação periódica.',
        diferencial: ['Pregas esofágicas proeminentes (apagam com ar)', 'Varizes downhill (esôfago proximal, obstrução de cava superior)', 'Esofagite com vasos ingurgitados', 'Hemangioma'],
        ilustracao: { id: 'endoscopia', params: { cena: 'varizes-esofagicas', calibre: 6 }, alt: 'Cordões azulados e tortuosos projetando-se para o lúmen do esôfago distal' },
      },
      {
        id: 'ulcera-sangrante',
        titulo: 'Sangramento por úlcera péptica',
        estado: 'alterado',
        diagnostico: 'Úlcera com estigma de sangramento — a classificação de Forrest decide a hemostasia.',
        achado:
          'Cratera ulcerada com um dos estigmas: sangramento ativo em jato ou babação (Forrest Ia/Ib), vaso visível não sangrante (IIa), coágulo aderido (IIb), mancha pigmentada plana (IIc) ou base limpa (III). O risco de ressangrar cai nessa ordem, e a conduta acompanha.',
        leitura: [
          'Lave a base da úlcera para ver o que há embaixo do sangue.',
          'Classifique pelo estigma de maior risco visível.',
          'Vaso visível é um ponto elevado, vermelho ou perolado, na base — não confunda com a mancha plana.',
          'Coágulo aderido se irriga e, se não sai, conta como IIb.',
        ],
        diferencaDoNormal:
          'A mucosa gástrica normal é contínua e coberta de muco. A úlcera é um buraco que atravessou a mucosa e chegou aos vasos da submucosa — e o que se vê na base dela é o estado desses vasos. O jato é a artéria aberta; o vaso visível é a artéria fechada por um tampão que pode cair; a base limpa é a artéria que já cicatrizou. Ler o estigma é ler quanto tempo se tem.',
        conduta:
          'Forrest Ia, Ib e IIa: hemostasia endoscópica dupla (injeção de adrenalina mais clipe ou termocoagulação), inibidor de bomba de prótons endovenoso em dose alta, internação. IIb: remover o coágulo e tratar o que aparecer. IIc e III: alta precoce possível. Investigar H. pylori e revisar anti-inflamatórios em todos.',
        diferencial: ['Lesão de Dieulafoy (vaso sem úlcera)', 'Mallory-Weiss (laceração da junção)', 'Neoplasia ulcerada sangrante', 'Angiectasia gástrica', 'Varizes'],
        ilustracao: { id: 'endoscopia', params: { cena: 'ulcera-sangrante', estigma: 3 }, alt: 'Cratera ulcerada com vaso visível e sangramento ativo escorrendo pela mucosa gástrica' },
      },
      {
        id: 'ulcera-gastrica',
        titulo: 'Úlcera gástrica',
        estado: 'alterado',
        diagnostico: 'Perda de substância da mucosa gástrica — benigna até a biópsia dizer.',
        achado:
          'Depressão arredondada ou oval, com base branca ou amarelada de fibrina e bordas regulares, levemente elevadas e edemaciadas, com as pregas convergindo até a margem. Costuma ficar na pequena curvatura ou no antro. Bordas irregulares, elevadas em massa ou pregas interrompidas sugerem malignidade.',
        leitura: [
          'Meça e localize.',
          'Olhe as bordas: lisas e regulares tranquilizam; irregulares, nodulares ou em pregas amputadas, não.',
          'Biópsias das bordas em vários pontos — sempre, em toda úlcera gástrica.',
          'Programe controle endoscópico em 8 a 12 semanas para documentar a cicatrização.',
        ],
        diferencaDoNormal:
          'No estômago normal, as rugas correm paralelas e a superfície é contínua. A úlcera péptica é um buraco de bordas limpas cavado pelo ácido numa mucosa que perdeu a proteção — e as pregas que convergem até ela são a mucosa vizinha sendo puxada pela cicatriz. O câncer também escava, mas destrói as pregas em vez de puxá-las; é essa diferença de borda que a biópsia confirma.',
        conduta:
          'Inibidor de bomba de prótons por 8 semanas, erradicação de H. pylori se presente, suspensão de anti-inflamatórios. Biópsia é obrigatória, e a endoscopia de controle também: úlcera gástrica que não cicatriza é câncer até prova em contrário.',
        diferencial: ['Adenocarcinoma gástrico ulcerado', 'Linfoma gástrico', 'Úlcera por anti-inflamatório (múltiplas, antrais)', 'Úlcera de estresse', 'Doença de Crohn gástrica'],
        ilustracao: { id: 'endoscopia', params: { cena: 'ulcera-gastrica', diametro: 12 }, alt: 'Depressão oval de base branca e bordas regulares com pregas gástricas convergindo até a margem' },
      },
      {
        id: 'cancer-gastrico',
        titulo: 'Câncer gástrico avançado',
        estado: 'alterado',
        diagnostico: 'Adenocarcinoma gástrico invasivo.',
        achado:
          'Massa irregular, vegetante ou ulceroinfiltrativa, de bordas elevadas e nodulares, base necrótica e suja, friável ao toque, com as pregas ao redor amputadas ou fundidas. Na forma infiltrativa difusa (linite plástica), o estômago não distende e as paredes ficam rígidas e espessadas.',
        leitura: [
          'Descreva a forma pela classificação de Borrmann: polipoide, ulcerada, ulceroinfiltrativa ou difusa.',
          'Olhe as pregas: amputadas e rígidas apontam infiltração.',
          'Teste a distensibilidade insuflando — o estômago que não abre é linite.',
          'Biópsias múltiplas das bordas; a base necrótica não dá diagnóstico.',
        ],
        diferencaDoNormal:
          'A úlcera benigna é um buraco na mucosa normal, que a puxa em pregas até a borda. O câncer é tecido novo que cresce por baixo e por dentro: as bordas se elevam porque há tumor nelas, as pregas param antes de chegar porque foram invadidas, e o fundo é necrótico porque o tumor cresceu mais depressa que o próprio sangue. A regularidade que falta é o diagnóstico.',
        conduta:
          'Biópsia e estadiamento: tomografia de tórax, abdome e pelve, ecoendoscopia para T e N, laparoscopia se candidato a cirurgia. Tratamento conforme o estádio — gastrectomia com linfadenectomia D2, quimioterapia perioperatória ou paliação. Testar HER2, MSI e PD-L1 na doença avançada.',
        diferencial: ['Úlcera péptica gigante', 'Linfoma MALT ou difuso', 'Tumor estromal (GIST, submucoso)', 'Metástase gástrica', 'Gastrite hipertrófica'],
        ilustracao: { id: 'endoscopia', params: { cena: 'cancer-gastrico', extensao: 4 }, alt: 'Massa ulceroinfiltrativa de bordas irregulares e base necrótica deformando as pregas gástricas' },
      },
      {
        id: 'gastrite-erosiva',
        titulo: 'Gastrite erosiva',
        estado: 'alterado',
        diagnostico: 'Erosões múltiplas da mucosa gástrica — anti-inflamatório, álcool, estresse ou H. pylori.',
        achado:
          'Múltiplas erosões puntiformes ou lineares, superficiais, de centro branco e halo vermelho, sobre uma mucosa eritematosa e edemaciada, por vezes com sangramento em lençol. Predominam no antro e no corpo; não ultrapassam a muscular da mucosa — é o que as separa da úlcera.',
        leitura: [
          'Conte e localize: dezenas de erosões antrais falam por anti-inflamatório.',
          'Procure sangue: a gastrite erosiva sangra em lençol, não em jato.',
          'Diferencie de úlcera pela profundidade e pelo tamanho.',
          'Biópsia de antro e corpo para H. pylori.',
        ],
        diferencaDoNormal:
          'A mucosa normal é homogênea e coberta de muco. Quando a barreira falha — por anti-inflamatório, álcool ou isquemia do choque — o ácido queima a superfície em muitos pontos ao mesmo tempo, e cada ponto vira uma erosão pequena, rasa, com o halo vermelho da inflamação ao redor. É lesão difusa de superfície, não um buraco.',
        conduta:
          'Retirar o agressor (anti-inflamatório, álcool), inibidor de bomba de prótons por 4 a 8 semanas, erradicar H. pylori se presente. No paciente crítico, é a lesão que a profilaxia de úlcera de estresse existe para evitar. Sangramento importante é raro e se trata como hemorragia digestiva.',
        diferencial: ['Úlceras múltiplas por anti-inflamatório', 'Gastropatia da hipertensão portal (mosaico)', 'Gastrite infecciosa (CMV, herpes)', 'Lesões de Cameron na hérnia de hiato'],
        ilustracao: { id: 'endoscopia', params: { cena: 'gastrite-erosiva', erosoes: 12 }, alt: 'Múltiplas erosões puntiformes de centro branco e halo vermelho sobre mucosa gástrica eritematosa' },
      },
      {
        id: 'corpo-estranho-esofagico',
        titulo: 'Corpo estranho esofágico',
        estado: 'alterado',
        diagnostico: 'Impactação de bolo alimentar ou objeto no esôfago — urgência se obstrução completa.',
        achado:
          'Objeto ou bolo alimentar ocupando o lúmen, com saliva acumulada acima, mucosa ao redor edemaciada ou erosada. Impacta nos estreitamentos: cricofaríngeo, arco aórtico e esôfago distal. Sialorreia e incapacidade de engolir a própria saliva indicam obstrução completa.',
        leitura: [
          'Identifique o que é: alimento, moeda, bateria, osso, objeto pontiagudo.',
          'Veja se há passagem de saliva ou líquido ao redor.',
          'Olhe a mucosa embaixo depois de retirar: a impactação de alimento quase sempre tem uma causa — anel, estenose, esofagite eosinofílica.',
          'Bateria de botão e objeto pontiagudo não esperam.',
        ],
        diferencaDoNormal:
          'O lúmen normal é um túnel vazio que se abre com o ar. Aqui ele está tomado, e o que fica acima da rolha é saliva que não desce — por isso o paciente baba. O esôfago não tem para onde desviar: ou o objeto passa, ou tudo para.',
        conduta:
          'Obstrução completa (não engole saliva), bateria de botão, objeto pontiagudo ou ímãs: endoscopia de urgência, em até 2 horas se bateria. Bolo alimentar sem obstrução completa: endoscopia em até 24 horas. Não usar amaciantes de carne nem induzir vômito. Após a retirada, investigar a causa da impactação.',
        diferencial: ['Estenose péptica ou anel de Schatzki', 'Esofagite eosinofílica', 'Acalasia', 'Neoplasia esofágica', 'Divertículo de Zenker (retém alimento acima do esôfago)'],
        ilustracao: { id: 'endoscopia', params: { cena: 'corpo-estranho-esofagico', obstrucao: 80 }, alt: 'Bolo alimentar impactado ocupando o lúmen do esôfago com saliva acumulada acima' },
      },
    ],
    armadilhas: [
      'Endoscopia normal não exclui refluxo: a maioria dos pacientes com sintoma tem doença não erosiva.',
      'Chamar de Barrett toda linha Z irregular. Sem metaplasia intestinal na biópsia, não é Barrett.',
      'Úlcera gástrica de aspecto benigno sem biópsia. O câncer precoce parece úlcera.',
      'Classificar o estigma de Forrest sem lavar a base — o coágulo esconde o vaso.',
      'Esperar a bateria de botão passar. Ela não passa; ela queima.',
    ],
    ondeVerFoto: [
      {
        titulo: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/Category:Gastroscopy',
        oQueProcurar: 'Imagens endoscópicas com licença livre: esofagite, varizes, úlceras e neoplasias. Confira autor e licença de cada uma.',
        licenciada: 'wikimedia-commons',
      },
      {
        titulo: 'Radiopaedia',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Correlação entre o achado endoscópico e a tomografia — estadiamento do câncer gástrico, complicações de úlcera.',
        licenciada: 'radiopaedia',
      },
    ],
    referencias: [
      'Lundell LR et al. Endoscopic assessment of oesophagitis: clinical and functional correlates and further validation of the Los Angeles classification. Gut, 1999.',
      'Sharma P et al. The development and validation of an endoscopic grading system for Barrett\'s esophagus: the Prague C & M criteria. Gastroenterology, 2006.',
      'Forrest JA et al. Endoscopy in gastrointestinal bleeding. Lancet, 1974.',
      'Gralnek IM et al. ESGE Guideline: diagnosis and management of nonvariceal upper gastrointestinal hemorrhage, 2021.',
    ],
  },

  {
    slug: 'colonoscopia',
    nome: 'Colonoscopia',
    instrumento: 'endoscopio',
    resumo:
      'O cólon inteiro, do reto ao ceco: onde o pólipo é retirado antes de virar câncer e a colite mostra sua extensão.',
    paraQue:
      'Rastreamento e diagnóstico. A pergunta que o aluno precisa saber responder olhando a imagem é: isto é pólipo ou câncer? Isto é diverticulose ou diverticulite? Esta colite é contínua (retocolite) ou salteada (Crohn)? E o sangramento oculto — angiodisplasia — que só a imagem mostra.',
    comoFazer: [
      {
        passo: 'Preparo intestinal adequado — sem ele, o exame não vale.',
        detalhe:
          'Escala de Boston: cada segmento pontuado de 0 a 3. Preparo ruim esconde pólipos pequenos e obriga a repetir.',
      },
      {
        passo: 'Intubação cecal confirmada pela válvula ileocecal e pelo orifício apendicular.',
        detalhe:
          'Só com o ceco documentado o exame é completo. A retirada é a fase diagnóstica: lenta, com pelo menos 6 minutos.',
      },
      {
        passo: 'Inspeção atrás das pregas, com retrovisão no reto.',
        detalhe:
          'Pólipos planos e lesões atrás de haustros são os que se perdem. Cromoscopia e magnificação ajudam a classificar o que se achou.',
      },
      {
        passo: 'Ressecar o que é ressecável e biopsiar o que não é.',
        detalhe:
          'Pólipo até 2 cm sai na mesma sessão. Massa que não sai é biopsiada e tatuada para o cirurgião encontrar.',
      },
    ],
    qualidade: [
      'Ceco alcançado e fotografado.',
      'Preparo com Boston ≥ 6, nenhum segmento abaixo de 2.',
      'Tempo de retirada de pelo menos 6 minutos.',
      'Todo pólipo descrito com tamanho, morfologia (Paris) e localização.',
    ],
    estruturas: [
      { slug: 'haustros', nome: 'Haustros', original: 'haustra coli', nota: 'As pregas semilunares que dão ao lúmen o formato triangular. Somem na colite crônica — o cólon vira um tubo liso.', x: 50, y: 30 },
      { slug: 'padrao-vascular-colon', nome: 'Padrão vascular submucoso', nota: 'Rede de vasos finos e ramificados vista através da mucosa transparente. É o primeiro sinal a desaparecer na inflamação.', x: 26, y: 62 },
      { slug: 'lumen-colon', nome: 'Lúmen', nota: 'Deve ser amplo e distensível. Estreitamento fixo é tumor, estenose inflamatória ou diverticular.', x: 50, y: 58 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Cólon normal',
        estado: 'normal',
        diagnostico: 'Mucosa íntegra com padrão vascular preservado.',
        achado: 'Mucosa rosada, lisa e brilhante, com padrão vascular submucoso nítido e haustros bem definidos. Lúmen amplo, sem pólipo, divertículo, erosão ou massa.',
        leitura: ['Confirme o padrão vascular.', 'Veja os haustros e o lúmen triangular.', 'Inspecione atrás de cada prega na retirada.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Rastreamento normal: repetir em 10 anos na população de risco médio.',
        diferencial: [],
        ilustracao: { id: 'endoscopia', params: { cena: 'colon-normal' }, alt: 'Cólon normal à colonoscopia com haustros e padrão vascular visível' },
      },
      {
        id: 'polipo-adenomatoso',
        titulo: 'Pólipo adenomatoso',
        estado: 'alterado',
        diagnostico: 'Adenoma colorretal — o precursor que se retira.',
        achado:
          'Lesão elevada, bem delimitada, que se projeta para o lúmen — pediculada (com haste) ou séssil —, de superfície lobulada e mais avermelhada que a mucosa vizinha, frequentemente com padrão de criptas alongadas à magnificação. Tamanho e número contam para a vigilância.',
        leitura: [
          'Meça pelo comparativo com a pinça aberta (7 a 8 mm).',
          'Classifique a morfologia: pediculado, séssil, plano (Paris).',
          'Olhe a superfície: depressão, ulceração ou padrão desestruturado sugerem invasão.',
          'Ressecção completa com recuperação do espécime — a histologia é que diz o que era.',
        ],
        diferencaDoNormal:
          'A mucosa normal é plana e transparente. O adenoma é um crescimento localizado de epitélio que perdeu o freio: forma uma bola que sobe do plano e projeta sombra. Ele não é câncer — mas é de onde a maioria dos cânceres do cólon vem, e leva anos para virar. É o intervalo que torna a colonoscopia preventiva.',
        conduta:
          'Polipectomia (alça fria até 10 mm; alça diatérmica ou mucosectomia acima disso) e histologia. Vigilância conforme número, tamanho e histologia: 1 a 2 adenomas pequenos, 7 a 10 anos; 3 a 4, ou qualquer um ≥ 10 mm ou com displasia de alto grau, 3 anos.',
        diferencial: ['Pólipo hiperplásico (pequeno, pálido, retossigmoide)', 'Adenoma serrilhado séssil (plano, com capa de muco, cólon direito)', 'Câncer precoce em pólipo', 'Pólipo inflamatório', 'Lipoma submucoso'],
        ilustracao: { id: 'endoscopia', params: { cena: 'polipo-adenomatoso', diametro: 12 }, alt: 'Pólipo pediculado de superfície lobulada projetando-se para o lúmen do cólon' },
      },
      {
        id: 'cancer-colorretal',
        titulo: 'Câncer colorretal',
        estado: 'alterado',
        diagnostico: 'Adenocarcinoma do cólon ou do reto.',
        achado:
          'Massa irregular, vegetante ou ulceroinfiltrativa, friável, que sangra ao toque, estreitando o lúmen — às vezes ao ponto de o aparelho não passar. Bordas elevadas e endurecidas, base necrótica, mucosa ao redor fixa. A lesão anular ("em anel de guardanapo") é a forma clássica do cólon esquerdo.',
        leitura: [
          'Descreva: vegetante, ulcerada, infiltrativa ou anular; e o percentual de estenose.',
          'Meça a distância da margem anal se for reto — decide a cirurgia.',
          'Biópsias múltiplas das bordas e tatuagem distal à lesão.',
          'Se o aparelho não passa, o cólon proximal precisa ser visto por outro método (colonografia por TC).',
        ],
        diferencaDoNormal:
          'O pólipo é uma elevação de superfície lisa que respeita a parede. O câncer invadiu: a superfície se ulcera e necrosa porque o tumor cresceu mais que o suprimento, sangra porque os vasos são novos e frágeis, e o lúmen se fecha porque a parede infiltrada não distende. Friabilidade, irregularidade e rigidez são a mesma coisa vista de três ângulos.',
        conduta:
          'Biópsia e estadiamento: tomografia de tórax e abdome, CEA, ressonância de pelve se reto. Cirurgia com linfadenectomia para a maioria; neoadjuvância no reto avançado; quimioterapia adjuvante pelo estádio. Testar instabilidade de microssatélites e RAS/BRAF na doença metastática.',
        diferencial: ['Adenoma grande', 'Massa inflamatória diverticular', 'Estenose de Crohn', 'Linfoma', 'Endometriose intestinal', 'Metástase'],
        ilustracao: { id: 'endoscopia', params: { cena: 'cancer-colorretal', estenose: 60 }, alt: 'Massa irregular e friável estreitando o lúmen do cólon' },
      },
      {
        id: 'diverticulose',
        titulo: 'Diverticulose colônica',
        estado: 'alterado',
        diagnostico: 'Herniações da mucosa através da parede muscular — comuns, em geral assintomáticas.',
        achado:
          'Múltiplos orifícios arredondados na parede do cólon, entre as tênias, de 5 a 10 mm, que se abrem em bolsas para fora do lúmen — o oposto do pólipo. Predominam no sigmoide. Mucosa ao redor normal; eritema, pus ou estreitamento indicam diverticulite.',
        leitura: [
          'Não confunda o orifício com o lúmen: o divertículo é uma bolsa cega, o lúmen segue adiante.',
          'Conte e localize — a densidade no sigmoide é típica.',
          'Olhe a mucosa ao redor: inflamada ou com pus é diverticulite, e a colonoscopia deveria esperar.',
          'Sangue vindo de um orifício é sangramento diverticular.',
        ],
        diferencaDoNormal:
          'A parede normal é contínua. Nos pontos em que os vasos a atravessam, ela é mais fraca, e décadas de pressão intraluminal alta empurram a mucosa por esses pontos para fora — como o dedo de uma luva virada. O que se vê são buracos para bolsas que não deveriam existir. Não é doença enquanto não inflama nem sangra.',
        conduta:
          'Diverticulose assintomática: nenhuma, além de dieta rica em fibras. Diverticulite aguda: não fazer colonoscopia na fase aguda (risco de perfuração); tratamento clínico e colonoscopia após 6 a 8 semanas para excluir câncer. Sangramento diverticular: costuma parar sozinho; hemostasia endoscópica ou embolização se persistir.',
        diferencial: ['Orifício apendicular (um só, no ceco)', 'Pseudodivertículos pós-inflamatórios', 'Fístula', 'Câncer com diverticulose associada (a armadilha: um não exclui o outro)'],
        ilustracao: { id: 'endoscopia', params: { cena: 'diverticulose', diverticulos: 8 }, alt: 'Múltiplos orifícios diverticulares arredondados na parede do sigmoide' },
      },
      {
        id: 'colite-ulcerativa',
        titulo: 'Colite ulcerativa ativa',
        estado: 'alterado',
        diagnostico: 'Retocolite ulcerativa em atividade — inflamação contínua a partir do reto.',
        achado:
          'Mucosa difusamente eritematosa, edemaciada e granular, com perda completa do padrão vascular, friabilidade (sangra ao toque do aparelho), erosões e úlceras superficiais, exsudato mucopurulento. A inflamação é contínua, começa no reto e sobe até um limite nítido; não há áreas poupadas.',
        leitura: [
          'Comece pelo reto: na retocolite ele está sempre acometido (salvo tratamento tópico).',
          'Veja se a inflamação é contínua ou salteada — é a divisa com o Crohn.',
          'Gradue por Mayo endoscópico: 1 eritema e perda vascular; 2 friabilidade e erosões; 3 úlceras e sangramento espontâneo.',
          'Registre a extensão: proctite, colite esquerda ou pancolite.',
          'Biópsias seriadas, inclusive de mucosa de aspecto normal.',
        ],
        diferencaDoNormal:
          'A mucosa normal é transparente o bastante para se verem os vasos por baixo. Inflamada, ela incha, se enche de células e perde a transparência: o padrão vascular some primeiro, depois a superfície fica granular, depois sangra ao menor toque. A continuidade — sem um centímetro poupado do reto para cima — é o que distingue esta colite de todas as outras.',
        conduta:
          'Tratamento por extensão e gravidade: mesalazina oral e tópica na doença leve a moderada; corticoide na moderada a grave; imunobiológicos ou tofacitinibe na refratária. Colite aguda grave (Truelove-Witts) interna: corticoide endovenoso, resgate com infliximabe ou ciclosporina, colectomia se falha. Vigilância de câncer após 8 anos de doença.',
        diferencial: ['Doença de Crohn (salteada, úlceras profundas, reto poupado)', 'Colite infecciosa (Shigella, Campylobacter, C. difficile)', 'Colite isquêmica (segmentar, cólon esquerdo, idoso)', 'Colite por anti-inflamatório', 'Colite actínica'],
        ilustracao: { id: 'endoscopia', params: { cena: 'colite-ulcerativa', extensao: 40 }, alt: 'Mucosa difusamente eritematosa e friável, sem padrão vascular, com erosões contínuas' },
      },
      {
        id: 'angiodisplasia',
        titulo: 'Angiodisplasia',
        estado: 'alterado',
        diagnostico: 'Ectasia vascular da mucosa — causa de sangramento oculto ou visível no idoso.',
        achado:
          'Mancha vermelho-viva, plana ou discretamente elevada, de 2 a 10 mm, com vasos finos irradiando do centro como uma teia ou uma samambaia, sobre mucosa normal. Frequente no ceco e cólon direito. Pode ser única ou múltipla e sangrar ativamente.',
        leitura: [
          'Diferencie do trauma de aspiração: a angiodisplasia tem vasos irradiando, o trauma é uma mancha homogênea.',
          'Localize e conte — múltiplas no cólon direito é o padrão.',
          'Procure a que está sangrando ou tem coágulo.',
          'Correlacione com o contexto: estenose aórtica, doença renal crônica, anticoagulação.',
        ],
        diferencaDoNormal:
          'Os vasos normais da submucosa são finos, ramificados e regulares. Na angiodisplasia, um grupo deles se dilatou e se tortuou com o tempo — a teoria é obstrução venosa crônica pela contração do cólon — e formou um novelo superficial, de parede fina, que sangra por nada. É lesão degenerativa: o cólon direito, mais largo e de parede mais tensa, é onde ela nasce.',
        conduta:
          'Sangramento atribuível: coagulação com plasma de argônio. Achado incidental sem sangramento: nenhuma. Sangramento recorrente e múltiplas lesões: tratar as acessíveis, avaliar o intestino delgado por cápsula, considerar octreotida ou talidomida nos casos refratários. Corrigir anemia e revisar anticoagulantes.',
        diferencial: ['Trauma de aspiração pelo aparelho', 'Petéquia ou hemorragia submucosa', 'Telangiectasia da síndrome de Rendu-Osler', 'Proctopatia actínica (múltiplas, no reto irradiado)'],
        ilustracao: { id: 'endoscopia', params: { cena: 'angiodisplasia', area: 8 }, alt: 'Mancha vermelho-viva com vasos irradiando do centro sobre mucosa colônica normal' },
      },
    ],
    armadilhas: [
      'Preparo ruim é exame não feito. Repita em vez de laudar "sem alterações".',
      'Pólipo plano atrás de prega é o que se perde; retirada rápida é a causa mais comum de câncer de intervalo.',
      'Diverticulose e câncer coexistem — achar divertículos não encerra a busca.',
      'Colonoscopia na diverticulite aguda perfura. Espere 6 a 8 semanas.',
      'Mancha vermelha após aspiração parece angiodisplasia. Procure os vasos irradiando.',
    ],
    ondeVerFoto: [
      {
        titulo: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/Category:Colonoscopy',
        oQueProcurar: 'Imagens colonoscópicas de pólipos, diverticulose, colite e angiodisplasia com licença livre.',
        licenciada: 'wikimedia-commons',
      },
    ],
    referencias: [
      'Gupta S et al. Recommendations for follow-up after colonoscopy and polypectomy: US Multi-Society Task Force on Colorectal Cancer, 2020.',
      'Schroeder KW et al. Coated oral 5-aminosalicylic acid therapy for mildly to moderately active ulcerative colitis. N Engl J Med, 1987 (escore de Mayo).',
      'The Paris endoscopic classification of superficial neoplastic lesions. Gastrointest Endosc, 2003.',
    ],
  },

  {
    slug: 'laringoscopia',
    nome: 'Laringoscopia',
    instrumento: 'endoscopio',
    resumo:
      'As pregas vocais vistas de cima: a disfonia que é paralisia, o edema que fecha a via aérea e a lesão que precisa de biópsia.',
    paraQue:
      'Toda disfonia com mais de duas a três semanas pede laringoscopia — é a regra que o aluno precisa levar. A imagem responde se as pregas se movem, se estão lisas e simétricas, e se há algo crescendo nelas. E no paciente com estridor, mostra o quanto de via aérea sobrou.',
    comoFazer: [
      {
        passo: 'Anestesia tópica do nariz ou da orofaringe e paciente sentado, inclinado para a frente.',
        detalhe:
          'A laringoscopia flexível pelo nariz é a rotina: menos reflexo de vômito, e permite ver a laringe fonando e respirando. A indireta com espelho ainda vale quando não há endoscópio.',
      },
      {
        passo: 'Passe pela nasofaringe e posicione acima da epiglote.',
        detalhe:
          'De cima se veem epiglote, aritenoides, pregas vestibulares e, entre elas, as pregas vocais brancas em V aberto para trás.',
      },
      {
        passo: 'Peça para respirar fundo e depois para dizer "iii" prolongado.',
        detalhe:
          'Na inspiração as pregas abduzem; na fonação aduzem até se tocar. É a comparação entre os dois momentos que mostra a paralisia.',
      },
      {
        passo: 'Inspecione a superfície de cada prega, a comissura anterior e o espaço subglótico.',
        detalhe:
          'Lesão em uma prega só, irregular e que altera a onda mucosa, pede biópsia sob laringoscopia de suspensão.',
      },
    ],
    qualidade: [
      'Ambas as pregas vistas em respiração e em fonação.',
      'Comissura anterior e aritenoides visualizadas.',
      'Mobilidade descrita para cada lado separadamente.',
      'Em estridor, o exame feito com material de via aérea à mão.',
    ],
    estruturas: [
      { slug: 'epiglote', nome: 'Epiglote', original: 'epiglottis', nota: 'A pétala no alto da imagem, que cobre a laringe ao engolir. Edemaciada e vermelha na epiglotite.', x: 50, y: 16 },
      { slug: 'prega-vocal-direita', nome: 'Prega vocal direita', original: 'plica vocalis dextra', nota: 'À esquerda da tela, como o examinador a vê pelo endoscópio. Branca, lisa, de borda reta; abduz na inspiração e aduz na fonação.', x: 40, y: 55 },
      { slug: 'prega-vocal-esquerda', nome: 'Prega vocal esquerda', original: 'plica vocalis sinistra', nota: 'À direita da tela. Lesão do nervo laríngeo recorrente esquerdo é mais comum — o trajeto dele desce até o arco aórtico.', x: 60, y: 55 },
      { slug: 'glote', nome: 'Glote', original: 'rima glottidis', nota: 'O triângulo escuro entre as pregas: a via aérea. Sua largura na inspiração é o que se mede quando há estridor.', x: 50, y: 62 },
      { slug: 'aritenoides', nome: 'Aritenoides', original: 'cartilagines arytenoideae', nota: 'Os dois montículos posteriores onde as pregas se inserem. Movem-se com elas; param na paralisia.', x: 50, y: 82 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Laringe normal',
        estado: 'normal',
        diagnostico: 'Pregas vocais lisas, simétricas e móveis.',
        achado: 'Pregas vocais brancas, de bordas retas e superfície lisa, que abduzem simetricamente na inspiração, abrindo a glote em V, e aduzem por completo na fonação. Epiglote fina, aritenoides móveis, mucosa rosada sem lesão.',
        leitura: ['Compare as duas pregas na inspiração.', 'Peça a fonação e veja se elas se tocam.', 'Inspecione a superfície de cada uma.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Disfonia com laringe normal pede avaliação fonoaudiológica e estroboscopia — a lesão pode ser funcional ou sutil demais para a luz comum.',
        diferencial: [],
        ilustracao: { id: 'endoscopia', params: { cena: 'laringe-normal' }, alt: 'Laringe normal vista de cima, com pregas vocais brancas abduzidas em V' },
      },
      {
        id: 'paralisia-prega-vocal',
        titulo: 'Paralisia unilateral de prega vocal',
        estado: 'alterado',
        diagnostico: 'Lesão do nervo laríngeo recorrente ou do vago de um lado.',
        achado:
          'Uma prega permanece imóvel, em posição paramediana, levemente arqueada e às vezes mais baixa, enquanto a contralateral abduz normalmente na inspiração e, na fonação, cruza a linha média tentando compensar. Fenda glótica na fonação — voz soprosa, fraca, fatigável; engasgos com líquidos.',
        leitura: [
          'Identifique qual prega não se move — descreva pelo lado do paciente, não da tela.',
          'Veja a posição: paramediana é o mais comum na lesão do recorrente.',
          'Meça a fenda na fonação: quanto maior, pior a voz e maior o risco de aspiração.',
          'Pergunte por cirurgia recente de tireoide, pescoço ou tórax, e por intubação.',
        ],
        diferencaDoNormal:
          'As duas pregas normais são espelhos: abrem juntas, fecham juntas. Quando o nervo de um lado para de funcionar, a prega daquele lado fica onde a musculatura restante a deixa — perto do meio, sem abrir para respirar nem fechar para falar. A imagem é a assimetria de movimento, não de forma; uma foto parada quase não a mostra. Por isso o exame é em dois tempos.',
        conduta:
          'Investigar a causa ao longo do trajeto do nervo: tomografia da base do crânio ao mediastino (tumor de tireoide, pulmão, esôfago; aneurisma; linfonodo). Fonoterapia; se a fenda causar aspiração ou a voz for incapacitante, medialização (injeção ou tireoplastia). Paralisia bilateral com estridor é emergência de via aérea.',
        diferencial: ['Fixação da articulação cricoaritenóidea (pós-intubação, artrite)', 'Luxação de aritenoide', 'Tumor infiltrando a prega', 'Disfonia funcional'],
        ilustracao: { id: 'endoscopia', params: { cena: 'paralisia-prega-vocal', amplitude: 10 }, alt: 'Prega vocal esquerda imóvel em posição paramediana enquanto a direita abduz' },
      },
      {
        id: 'edema-de-glote',
        titulo: 'Edema de glote',
        estado: 'alterado',
        diagnostico: 'Edema laríngeo — angioedema, anafilaxia, infecção ou pós-intubação — com ameaça à via aérea.',
        achado:
          'Pregas vocais e estruturas supraglóticas (aritenoides, pregas ariepiglóticas, epiglote) espessadas, pálidas ou hiperemiadas, com o espaço aéreo reduzido a uma fenda. Estridor, voz abafada, dispneia e ansiedade. O edema da anafilaxia é pálido e rápido; o infeccioso é vermelho e febril.',
        leitura: [
          'Estime o lúmen que sobrou — é o dado que decide intubar.',
          'Veja a cor: pálido fala por angioedema; vermelho, por infecção.',
          'Não demore no exame e não toque nas estruturas.',
          'Tenha via aérea cirúrgica planejada antes de começar.',
        ],
        diferencaDoNormal:
          'A laringe normal tem estruturas finas e um espaço aéreo largo entre elas. O edema enche as pregas de líquido — a mucosa laríngea é frouxa e acumula muito, depressa — e cada milímetro de espessura a mais é um milímetro de via aérea a menos. Como a resistência ao fluxo cresce com a quarta potência da redução do raio, um edema moderado já produz estridor.',
        conduta:
          'Adrenalina intramuscular se anafilaxia ou angioedema não hereditário; corticoide e anti-histamínico; concentrado de C1-inibidor ou icatibanto no angioedema hereditário; antibiótico se infeccioso. Via aérea precoce por quem sabe: intubação acordado com fibroscópio ou cricotireoidostomia se a glote não passa. Não sedar sem plano.',
        diferencial: ['Epiglotite', 'Abscesso retrofaríngeo ou parafaríngeo', 'Corpo estranho laríngeo', 'Tumor laríngeo obstrutivo', 'Estenose subglótica'],
        ilustracao: { id: 'endoscopia', params: { cena: 'edema-de-glote', edema: 2 }, alt: 'Pregas vocais e estruturas supraglóticas espessadas com o espaço aéreo reduzido a uma fenda' },
      },
      {
        id: 'lesao-laringea',
        titulo: 'Lesão laríngea suspeita de neoplasia',
        estado: 'alterado',
        diagnostico: 'Carcinoma espinocelular de laringe até prova em contrário.',
        achado:
          'Massa irregular, assimétrica, exofítica ou ulcerada, esbranquiçada ou avermelhada, friável, em geral numa prega vocal, que perde a borda reta e a onda mucosa. Fixação da prega indica invasão profunda. Fumante, etilista, com disfonia progressiva há semanas.',
        leitura: [
          'Descreva a localização: glótica (prega), supraglótica ou subglótica — muda prognóstico e tratamento.',
          'Veja se a prega acometida ainda se move.',
          'Note a extensão à comissura anterior e à outra prega.',
          'Palpe o pescoço: linfonodo é estádio.',
        ],
        diferencaDoNormal:
          'A prega vocal normal é uma lâmina branca, lisa, de borda reta, que vibra em onda. O tumor é tecido que cresceu sobre e dentro dela: a borda vira irregular, a superfície ganha relevo e cor, e a vibração para — e a voz muda antes de qualquer outra coisa, porque a prega é o instrumento mais sensível do corpo à própria forma. É por isso que a disfonia é o sintoma que salva: o câncer glótico avisa cedo.',
        conduta:
          'Biópsia sob laringoscopia de suspensão e estadiamento (tomografia de pescoço e tórax). Glótico precoce: radioterapia ou cirurgia a laser, com preservação da voz na maioria. Avançado: quimiorradioterapia ou laringectomia. Cessação do tabaco e do álcool; rastreamento de segundo tumor de via aerodigestiva.',
        diferencial: ['Papilomatose laríngea', 'Leucoplasia e displasia', 'Pólipo ou nódulo vocal (lisos, benignos)', 'Granuloma de contato (processo vocal, pós-intubação)', 'Laringite crônica'],
        ilustracao: { id: 'endoscopia', params: { cena: 'lesao-laringea', tamanho: 10 }, alt: 'Massa irregular e friável na prega vocal direita, deformando sua borda' },
      },
    ],
    armadilhas: [
      'Disfonia de mais de três semanas sem laringoscopia é a omissão que atrasa o câncer glótico.',
      'Descrever o lado pela tela e não pelo paciente. A prega direita fica à esquerda da imagem.',
      'Paralisia é diagnóstico de movimento: foto única não mostra.',
      'Laringoscopia no estridor sem via aérea preparada. O exame pode ser o gatilho da obstrução.',
      'Chamar toda lesão branca de leucoplasia benigna — 10 a 30% escondem displasia ou carcinoma.',
    ],
    ondeVerFoto: [
      {
        titulo: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/Category:Laryngoscopy',
        oQueProcurar: 'Laringe normal e lesões laríngeas em imagens endoscópicas com licença livre.',
        licenciada: 'wikimedia-commons',
      },
    ],
    referencias: [
      'Stachler RJ et al. Clinical Practice Guideline: Hoarseness (Dysphonia) (Update). Otolaryngol Head Neck Surg, 2018.',
      'Rosen CA, Simpson CB. Operative Techniques in Laryngology. Springer, 2008.',
    ],
  },

  {
    slug: 'broncoscopia',
    nome: 'Broncoscopia',
    instrumento: 'endoscopio',
    resumo:
      'A árvore brônquica por dentro: o corpo estranho que a criança aspirou, o sangue que precisa de fonte, a secreção que fechou o lobo.',
    paraQue:
      'É o exame que resolve o que a imagem só sugere: atelectasia que não melhora, hemoptise sem causa, corpo estranho suspeito. E é terapêutico na hora — aspira, retira, tampona. O aluno precisa reconhecer na imagem a carina normal e o que a obstrui.',
    comoFazer: [
      {
        passo: 'Anestesia tópica da via aérea, sedação e oxigênio suplementar.',
        detalhe:
          'Broncoscópio flexível pelo nariz ou pela boca, ou pelo tubo no paciente intubado. O rígido, sob anestesia geral, é o instrumento do corpo estranho grande e do sangramento maciço.',
      },
      {
        passo: 'Cordas vocais, traqueia e carina, em sequência.',
        detalhe:
          'A carina normal é uma crista fina e móvel. Alargada e fixa, é linfonodo ou tumor por baixo.',
      },
      {
        passo: 'Inspeção sistemática de todos os segmentos, começando pelo lado suposto sadio.',
        detalhe:
          'Assim o lado doente não contamina o outro com sangue ou secreção, e a nomenclatura segmentar orienta o laudo.',
      },
      {
        passo: 'Coleta e terapêutica conforme o achado.',
        detalhe:
          'Lavado broncoalveolar, escovado, biópsia; aspiração de tampão; pinça ou cesta para corpo estranho; soro gelado, adrenalina tópica ou bloqueador para o sangramento.',
      },
    ],
    qualidade: [
      'Carina e todos os brônquios segmentares descritos.',
      'Lado sadio examinado antes do doente.',
      'Saturação monitorada durante todo o exame.',
      'Material coletado identificado por segmento.',
    ],
    estruturas: [
      { slug: 'aneis', nome: 'Anéis cartilaginosos', original: 'cartilagines tracheales', nota: 'Os arcos brancos em C, abertos para trás, que mantêm a traqueia e os brônquios-fonte pérvios. A parede posterior membranosa, sem anel, é a que colaba na traqueomalácia.', x: 50, y: 22 },
      { slug: 'carina', nome: 'Carina', original: 'carina tracheae', nota: 'A crista afiada que divide os dois brônquios-fonte. Referência de tudo; alargada ou fixa sugere doença mediastinal.', x: 50, y: 48 },
      { slug: 'bronquio-direito', nome: 'Brônquio-fonte direito', original: 'bronchus principalis dexter', nota: 'À esquerda da tela. Mais largo, mais curto e mais vertical — é para onde o corpo estranho aspirado costuma ir.', x: 40, y: 54 },
      { slug: 'bronquio-esquerdo', nome: 'Brônquio-fonte esquerdo', original: 'bronchus principalis sinister', nota: 'À direita da tela, mais longo e mais horizontal.', x: 60, y: 54 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Árvore brônquica normal',
        estado: 'normal',
        diagnostico: 'Vias aéreas pérvias, mucosa íntegra.',
        achado: 'Traqueia com anéis cartilaginosos regulares e parede posterior membranosa lisa; carina afiada e móvel com a respiração; brônquios-fonte e segmentares pérvios, de mucosa rosada, brilhante, com padrão vascular fino e sem secreção.',
        leitura: ['Confira a carina: fina e móvel.', 'Percorra cada brônquio e nomeie os segmentos.', 'Note a mucosa: cor, brilho, vasos.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Broncoscopia normal em hemoptise não exclui a fonte — o sangramento pode ser distal ao alcance do aparelho.',
        diferencial: [],
        ilustracao: { id: 'endoscopia', params: { cena: 'bronquio-normal' }, alt: 'Carina afiada dividindo os dois brônquios-fonte pérvios, com anéis cartilaginosos regulares' },
      },
      {
        id: 'corpo-estranho-endobronquico',
        titulo: 'Corpo estranho endobrônquico',
        estado: 'alterado',
        diagnostico: 'Aspiração de objeto ou alimento para a via aérea — mais comum na criança e no brônquio direito.',
        achado:
          'Objeto (amendoim, semente, fragmento de dente, peça de brinquedo) ocupando parcial ou totalmente um brônquio, em geral o fonte direito ou o intermediário. Ao redor, mucosa edemaciada, tecido de granulação e secreção purulenta se já passaram dias. O lobo distal pode estar atelectasiado ou hiperinsuflado por mecanismo de válvula.',
        leitura: [
          'Identifique o objeto e o quanto obstrui.',
          'Veja a granulação: indica tempo de permanência e dificulta a retirada.',
          'Examine o lado oposto antes — fragmento pode ter migrado.',
          'Pergunte pelo episódio de engasgo, mesmo que tenha sido há semanas.',
        ],
        diferencaDoNormal:
          'O brônquio normal é um tubo livre e o ar entra e sai sem obstáculo. O objeto aspirado funciona como uma válvula: entra ar ao redor dele na inspiração, quando o brônquio alarga, e não sai na expiração — o lobo hiperinsufla primeiro e colaba depois. O que se vê na broncoscopia é o próprio objeto; o que se vê na radiografia é o efeito dele no ar.',
        conduta:
          'Retirada broncoscópica: flexível com cesta ou pinça em adulto e objeto pequeno; rígida sob anestesia geral na criança e no objeto grande ou impactado. Antibiótico se pneumonia distal. Depois da retirada, reinspeção para excluir fragmento e avaliar a mucosa. Corpo estranho crônico não diagnosticado é causa de bronquiectasia localizada.',
        diferencial: ['Tampão mucoso', 'Tumor endobrônquico', 'Broncolito (linfonodo calcificado erodindo o brônquio)', 'Coágulo'],
        ilustracao: { id: 'endoscopia', params: { cena: 'corpo-estranho-endobronquico', obstrucao: 70 }, alt: 'Objeto ocupando o lúmen do brônquio-fonte direito com granulação ao redor' },
      },
      {
        id: 'sangramento-endobronquico',
        titulo: 'Sangramento endobrônquico',
        estado: 'alterado',
        diagnostico: 'Hemoptise com fonte na via aérea — tumor, bronquiectasia, tuberculose, trauma de aspiração.',
        achado:
          'Sangue vermelho-vivo preenchendo ou escorrendo de um brônquio específico, ou coágulo aderido apontando a origem. Pode-se ver a lesão que sangra: massa friável, mucosa erosada, bronquiectasia com vasos ectásicos. Sangramento volumoso enche a via aérea e impede a visão.',
        leitura: [
          'Localize o brônquio de onde o sangue vem — é o dado que orienta embolização ou cirurgia.',
          'Estime o volume e a velocidade.',
          'Procure a lesão por trás do sangue depois de aspirar e lavar.',
          'Se a visão se perde, proteja o pulmão sadio: decúbito com o lado que sangra para baixo.',
        ],
        diferencaDoNormal:
          'A via aérea normal é seca e rosada. Sangue nela vem de artérias brônquicas — sistêmicas, de alta pressão — que se hipertrofiam ao redor de inflamação crônica ou tumor. Por isso a hemoptise de bronquiectasia e de câncer é vermelha, arterial e capaz de ser maciça; e por isso a embolização das brônquicas é o tratamento.',
        conduta:
          'Hemoptise leve: identificar a fonte, tratar a causa, soro gelado ou adrenalina tópica. Maciça (> 200 mL em 24 h ou instabilidade): proteção da via aérea, decúbito lateral com o lado afetado para baixo, broncoscópio rígido ou bloqueador brônquico, angiotomografia e embolização das artérias brônquicas; cirurgia se falha. Corrigir coagulopatia.',
        diferencial: ['Sangramento de vias aéreas superiores ou trato digestivo (pseudo-hemoptise)', 'Trauma pelo próprio aparelho ou aspiração', 'Hemorragia alveolar difusa (sangue de todos os segmentos, sem fonte)', 'Fístula aortobrônquica'],
        ilustracao: { id: 'endoscopia', params: { cena: 'sangramento-endobronquico', intensidade: 2 }, alt: 'Sangue vermelho-vivo preenchendo o brônquio-fonte esquerdo e escorrendo para a carina' },
      },
      {
        id: 'tampao-mucoso',
        titulo: 'Tampão mucoso',
        estado: 'alterado',
        diagnostico: 'Secreção espessa obstruindo um brônquio — atelectasia no paciente que não tosse.',
        achado:
          'Material espesso, amarelado ou esbranquiçado, aderente, ocupando o lúmen de um brônquio lobar ou segmentar e bloqueando a passagem; mucosa ao redor inflamada. Distalmente, o lobo colaba — a radiografia mostra atelectasia, o exame físico, murmúrio abolido e macicez.',
        leitura: [
          'Localize e aspire — o diagnóstico e o tratamento são o mesmo gesto.',
          'Veja o que aparece atrás depois da aspiração: tumor ou corpo estranho podem estar escondidos.',
          'Colha o material para cultura.',
          'Pergunte por que o paciente não conseguiu tossir: sedação, dor, fraqueza, tubo.',
        ],
        diferencaDoNormal:
          'O brônquio normal se limpa sozinho: o muco é fino, os cílios o empurram para cima e a tosse termina o serviço. Quando o muco engrossa (desidratação, infecção, asma) ou a tosse falha (pós-operatório, sedação, doença neuromuscular), ele para onde está e fecha o tubo. O ar do lobo distal é absorvido e o lobo colaba — a atelectasia é a consequência, e o tampão, a causa.',
        conduta:
          'Aspiração broncoscópica e reexpansão; fisioterapia respiratória, hidratação, nebulização, mobilização precoce e analgesia que permita tossir. Tratar a infecção se houver. Recorrência pede investigação da causa de base e, se necessário, mucolítico ou aspiração seriada.',
        diferencial: ['Corpo estranho', 'Tumor endobrônquico obstrutivo', 'Coágulo', 'Aspergilose broncopulmonar alérgica (tampões de muco eosinofílico)'],
        ilustracao: { id: 'endoscopia', params: { cena: 'tampao-mucoso', obstrucao: 80 }, alt: 'Material espesso amarelado ocupando e obstruindo o lúmen do brônquio-fonte direito' },
      },
    ],
    armadilhas: [
      'Corpo estranho na criança sem história de engasgo: a metade dos casos chega sem ela. Tosse crônica e pneumonia de repetição no mesmo lobo obrigam a olhar.',
      'Hemoptise maciça com broncoscópio flexível: o aparelho fino não protege a via aérea nem aspira o suficiente.',
      'Aspirar o tampão e não olhar atrás dele. O tumor obstrutivo se apresenta como atelectasia por secreção.',
      'Broncoscopia em hipoxemia grave sem plano: o exame ocupa a via aérea e piora a troca.',
    ],
    ondeVerFoto: [
      {
        titulo: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/Category:Bronchoscopy',
        oQueProcurar: 'Imagens broncoscópicas de carina normal e obstrução endobrônquica com licença livre.',
        licenciada: 'wikimedia-commons',
      },
    ],
    referencias: [
      'Du Rand IA et al. British Thoracic Society guideline for diagnostic flexible bronchoscopy in adults. Thorax, 2013.',
      'Ernst A, Herth FJF. Principles and Practice of Interventional Pulmonology. Springer, 2013.',
    ],
  },
]

/**
 * Terceira leva: cenas extras por vista e janelas novas, em
 * `vistas-extra.ts`. Anexadas na leitura, como no ultrassom — a prosa
 * original fica intocada e a normal continua sendo a primeira cena.
 */
export const VISTAS: Vista[] = [
  ...VISTAS_BASE.map((vista) => ({ ...vista, cenas: [...vista.cenas, ...(CENAS_EXTRA_DE_VISTA[vista.slug] ?? [])] })),
  ...VISTAS_NOVAS,
  ...VISTAS_LEVA_4,
]

export const TOTAL_DE_VISTAS = VISTAS.length
export const TOTAL_DE_CENAS = VISTAS.reduce((total, vista) => total + vista.cenas.length, 0)
export const TOTAL_DE_ESTRUTURAS_DE_VISTA = VISTAS.reduce((total, vista) => total + vista.estruturas.length, 0)

export function vistaPorSlug(slug: string): Vista | undefined {
  return VISTAS.find((vista) => vista.slug === slug)
}
