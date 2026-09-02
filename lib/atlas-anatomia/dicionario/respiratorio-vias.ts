import type { EntradaDicionario } from './tipos'

/**
 * Nariz, seios paranasais, faringe e laringe.
 *
 * A via aérea superior resolve, no mesmo tubo, três tarefas que se estorvam:
 * respirar, engolir e falar. Quase toda a patologia daqui — da apneia à
 * broncoaspiração, da sinusite à rouquidão — é o preço desse compartilhamento,
 * e é por aí que as fichas desta seção explicam cada estrutura.
 */
export const RESPIRATORIO_VIAS: EntradaDicionario[] = [
  /* ─────────────────── Nariz externo e vestíbulo ─────────────────── */
  {
    termos: ['Raiz do Nariz', 'Dorso do Nariz'],
    classe: 'via-aerea',
    resumo: 'Parte superior e crista do nariz externo, sustentadas por osso em cima e cartilagem embaixo.',
    localizacao: 'A raiz está entre os olhos, na sutura frontonasal (o násio); o dorso desce dela até o ápice, com terço superior ósseo e dois terços inferiores cartilagíneos.',
    funcao: 'Sustentam a pirâmide nasal e definem o perfil facial; a transição osso-cartilagem é o ponto de maior mobilidade.',
    relacoes: 'Os ossos nasais e os processos frontais das maxilas formam a parte óssea; as cartilagens laterais e alares, a parte móvel.',
    clinica:
      'A fratura nasal é a fratura facial mais comum, e ocorre justamente na transição entre osso e cartilagem. A avaliação obrigatória é a do septo: um hematoma septal não drenado necrosa a cartilagem em poucos dias e produz o nariz em sela, deformidade permanente e de correção difícil.',
    memoria:
      'Todo trauma nasal exige olhar dentro do nariz. Hematoma de septo é urgência de drenagem, não de estética.',
    pontos: [
      'Que estruturas sustentam a raiz e o dorso do nariz?',
      'Por que a fratura ocorre na transição osso-cartilagem?',
      'O que acontece se um hematoma septal não for drenado?',
    ],
  },
  {
    termos: ['Ápice do Nariz', 'Asa do Nariz'],
    classe: 'via-aerea',
    resumo: 'Ponta e paredes laterais móveis do nariz, sustentadas pelas cartilagens alares.',
    localizacao: 'Extremidade inferior do nariz externo; as asas delimitam lateralmente as narinas.',
    funcao:
      'As cartilagens alares mantêm as narinas abertas contra a pressão negativa da inspiração. Os músculos dilatadores da narina, inervados pelo facial, aumentam ativamente essa abertura no esforço.',
    inervacao: 'Sensibilidade pelo nervo etmoidal anterior (V1) na ponta e pelo infraorbital (V2) nas asas; motricidade pelo facial.',
    clinica:
      'O batimento de asa de nariz é um dos sinais de desconforto respiratório mais precoces e mais confiáveis no lactente, e nada mais é do que o recrutamento visível desses dilatadores. O colapso alar na inspiração — teste de Cottle positivo — é causa frequente de obstrução nasal que nenhuma cirurgia de septo resolve.',
    memoria:
      'Asa de nariz batendo em criança é sinal de esforço respiratório. É músculo tentando abrir a porta.',
    pontos: [
      'Que estruturas mantêm as narinas abertas?',
      'O que significa o batimento de asa de nariz?',
      'O que é o teste de Cottle?',
    ],
  },
  {
    termos: ['Narina Direita', 'Narina Esquerda'],
    classe: 'via-aerea',
    resumo: 'Aberturas anteriores das cavidades nasais, entrada da via aérea.',
    localizacao: 'Face inferior do nariz externo, separadas na linha média pela columela.',
    funcao: 'Entrada do ar; sua área e forma determinam a resistência inicial ao fluxo.',
    relacoes: 'Conduzem ao vestíbulo do nariz, revestido de pele com vibrissas.',
    clinica:
      'O recém-nascido é respirador nasal obrigatório nas primeiras semanas, porque a laringe é alta e a epiglote toca o palato mole — por isso a obstrução nasal bilateral nele é emergência. E é pela narina que se estima o calibre de sondas e cânulas: a sonda nasogástrica segue o assoalho do nariz, paralela ao palato duro, e não para cima, erro que causa dor e sangramento.',
    memoria:
      'Sonda nasal entra reto para trás, acompanhando o assoalho — nunca apontando para cima. O nariz é mais fundo do que parece.',
    pontos: [
      'Por que o recém-nascido é respirador nasal obrigatório?',
      'Qual a direção correta de introdução de uma sonda nasal?',
      'O que separa as duas narinas?',
    ],
  },
  {
    termos: ['Vestíbulo do Nariz', 'Vestíbulo', 'Limiar do Nariz'],
    classe: 'via-aerea',
    resumo: 'Porção mais anterior da cavidade nasal, revestida de pele com pelos, até o limiar do nariz.',
    localizacao: 'Imediatamente atrás da narina, delimitado acima pelo limiar do nariz — a crista onde a pele dá lugar à mucosa respiratória.',
    funcao: 'Filtra partículas grandes pelas vibrissas e contém glândulas sebáceas e sudoríparas, como qualquer pele.',
    relacoes: 'A área da válvula nasal, logo acima, é o ponto mais estreito de toda a via aérea.',
    clinica:
      'Por ser pele, o vestíbulo é colonizado por Staphylococcus aureus e é a sede da foliculite e do furúnculo nasal — que ocupa o "triângulo da morte" da face, cujas veias drenam sem válvulas para o seio cavernoso. Espremer um furúnculo nessa região é a via clássica descrita de trombose do seio cavernoso.',
    memoria:
      'Do nariz até os cantos da boca: o triângulo perigoso. Ali as veias correm para dentro do crânio, não para fora.',
    pontos: [
      'Que tipo de epitélio reveste o vestíbulo do nariz?',
      'O que é o limiar do nariz?',
      'Por que infecções dessa região são perigosas?',
    ],
  },
  {
    termos: ['Região Respiratória'],
    classe: 'via-aerea',
    resumo: 'Maior parte da mucosa nasal, com epitélio ciliado pseudoestratificado que condiciona o ar.',
    localizacao: 'Ocupa a maior parte das cavidades nasais, abaixo da região olfatória, incluindo as conchas e os meatos.',
    funcao:
      'Aquece o ar até cerca de 37 °C, umidifica-o a quase 100% de saturação e filtra partículas — tudo em uma fração de segundo, graças à enorme superfície criada pelas conchas e aos plexos venosos submucosos.',
    vascularizacao: 'Artéria esfenopalatina, etmoidais anterior e posterior, palatina maior e labial superior.',
    inervacao: 'Nervos nasais posteriores (V2) e etmoidal anterior (V1).',
    clinica:
      'O transporte mucociliar move o muco em direção à nasofaringe a cerca de 1 cm por minuto, e sua falência — na fibrose cística, na discinesia ciliar primária, no tabagismo — é o mecanismo comum de sinusite e bronquiectasia. É também por isso que a intubação orotraqueal prolongada exige umidificação: o tubo curto-circuita todo esse condicionamento.',
    memoria:
      'O nariz é um ar-condicionado com filtro. Quando o paciente é intubado, você precisa fazer o trabalho dele com um umidificador.',
    pontos: [
      'Que funções a região respiratória exerce sobre o ar inspirado?',
      'O que é o transporte mucociliar?',
      'Por que a intubação exige umidificação artificial?',
    ],
  },
  {
    termos: ['Região Olfatória'],
    classe: 'via-aerea',
    resumo: 'Pequena área de mucosa especializada no teto da cavidade nasal, com os neurônios olfatórios.',
    localizacao: 'Teto da cavidade nasal, na lâmina cribiforme, e nas faces adjacentes do septo e da concha superior — cerca de 2 a 5 cm² de cada lado.',
    funcao:
      'Contém neurônios bipolares olfatórios, células de sustentação e células basais. Os neurônios olfatórios são as únicas células nervosas do corpo que se renovam continuamente ao longo da vida, a partir das células basais.',
    inervacao: 'Nervo olfatório (I par), cujos filamentos atravessam a lâmina cribiforme.',
    clinica:
      'A capacidade de regeneração explica por que a anosmia pós-viral pode melhorar ao longo de meses — e por que o treinamento olfatório funciona. Já a anosmia pós-traumática, por secção dos filamentos na lâmina cribiforme, raramente recupera, porque o problema não é o neurônio e sim a via.',
    memoria:
      'É o único neurônio que se renova a vida toda. Perdeu o cheiro por vírus, pode voltar; perdeu por trauma, quase nunca.',
    pontos: [
      'Onde se localiza a região olfatória?',
      'Que célula ali se renova continuamente?',
      'Por que a anosmia pós-traumática tem pior prognóstico?',
    ],
  },
  {
    termos: ['Concha Nasal Superior'],
    classe: 'osso',
    resumo: 'A menor das conchas, projeção do etmoide que cobre o meato superior.',
    localizacao: 'Parede lateral da cavidade nasal, acima da concha média, próxima ao teto.',
    funcao: 'Delimita o meato superior, para onde drenam as células etmoidais posteriores, e protege a fenda olfatória, medialmente a ela.',
    relacoes: 'Acima e atrás dela, o recesso esfenoetmoidal recebe a abertura do seio esfenoidal.',
    clinica:
      'É a referência endoscópica para localizar o óstio do seio esfenoidal e, portanto, o passo inicial de toda cirurgia hipofisária transesfenoidal. Sua proximidade com a fenda olfatória exige cuidado: manipulação excessiva nessa altura provoca anosmia iatrogênica.',
    memoria:
      'Superior é a mais alta e a menor. Acima dela, o recesso esfenoetmoidal — a porta do seio esfenoidal e da hipófise.',
    pontos: [
      'Que células drenam para o meato superior?',
      'O que é o recesso esfenoetmoidal?',
      'Por que a concha superior é referência na cirurgia hipofisária?',
    ],
  },
  {
    termos: ['Meato Nasal Inferior'],
    classe: 'via-aerea',
    resumo: 'Espaço sob a concha inferior, onde se abre o ducto nasolacrimal.',
    localizacao: 'Entre a concha nasal inferior e o assoalho da cavidade nasal.',
    funcao: 'Recebe exclusivamente o ducto nasolacrimal, protegido por uma prega de mucosa — a válvula de Hasner.',
    relacoes: 'É o mais amplo dos meatos, e o caminho por onde a sonda nasal deve passar.',
    clinica:
      'A obstrução congênita da válvula de Hasner é a causa mais comum de lacrimejamento persistente no lactente, e se resolve espontaneamente na maioria dos casos no primeiro ano. E é no meato inferior que se cria a janela na dacriocistorrinostomia, quando o ducto obstrui no adulto.',
    memoria:
      'Só uma coisa drena no meato inferior: a lágrima. Por isso você funga quando chora.',
    pontos: [
      'O que drena para o meato nasal inferior?',
      'O que é a válvula de Hasner?',
      'Por onde deve passar uma sonda nasogástrica?',
    ],
  },
  {
    termos: ['Meato Nasal Médio'],
    classe: 'via-aerea',
    resumo: 'Espaço sob a concha média, para onde drena a maioria dos seios paranasais.',
    localizacao: 'Entre a concha média e a parede lateral do nariz; contém o processo uncinado, a bula etmoidal e o hiato semilunar.',
    funcao: 'Recebe o seio frontal, o seio maxilar e as células etmoidais anteriores — o conjunto conhecido como complexo ostiomeatal.',
    relacoes: 'O infundíbulo etmoidal, no hiato semilunar, é o funil comum de drenagem.',
    clinica:
      'A obstrução do complexo ostiomeatal é a causa central da rinossinusite crônica, e sua desobstrução endoscópica é o princípio de toda a cirurgia funcional dos seios. Uma pólipo ou uma concha bolhosa que ocupe esse espaço bloqueia três seios de uma vez — o que explica por que a sinusite raramente é de um seio só.',
    memoria:
      'Meato médio é a "boca de lobo" de três seios: frontal, maxilar e etmoidal anterior. Entupiu ali, entope tudo.',
    pontos: [
      'Que seios drenam para o meato médio?',
      'O que é o complexo ostiomeatal?',
      'Por que a sinusite costuma envolver vários seios?',
    ],
  },
  {
    termos: ['Meato Nasal Superior'],
    classe: 'via-aerea',
    resumo: 'Espaço sob a concha superior, drenagem das células etmoidais posteriores.',
    localizacao: 'Entre as conchas superior e média, na parte posterossuperior da parede lateral do nariz.',
    funcao: 'Recebe as células etmoidais posteriores; o seio esfenoidal drena mais acima, no recesso esfenoetmoidal.',
    relacoes: 'Está próximo do forame esfenopalatino, atrás da cauda da concha média.',
    clinica:
      'A etmoidite posterior pode se estender para o ápice orbitário e produzir a síndrome do ápice orbitário, com perda visual e oftalmoplegia — complicação rara, mas de reconhecimento urgente. A proximidade com o nervo óptico nessa região é a razão de a cirurgia endoscópica posterior ser a de maior risco visual.',
    memoria:
      'Meato inferior: lágrima. Médio: maxilar, frontal e etmoide anterior. Superior: etmoide posterior. Esfenoide: acima de tudo.',
    pontos: [
      'Que células drenam para o meato superior?',
      'Onde drena o seio esfenoidal?',
      'Que complicação a etmoidite posterior pode causar?',
    ],
  },
  {
    termos: ['Seio Maxilar'],
    classe: 'seio-paranasal',
    resumo: 'O maior dos seios paranasais, ocupando o corpo da maxila, com óstio alto e drenagem contra a gravidade.',
    localizacao: 'No corpo da maxila, com teto formado pelo assoalho da órbita, assoalho pelo processo alveolar e parede medial pela parede lateral do nariz.',
    funcao: 'Aligeira o esqueleto facial e ressoa a voz; drena para o hiato semilunar do meato médio por um óstio situado no alto da sua parede medial.',
    vascularizacao: 'Artérias alveolares superiores e infraorbital.',
    inervacao: 'Nervos alveolares superiores e infraorbital (V2) — daí a dor dentária na sinusite.',
    relacoes: 'As raízes dos pré-molares e molares superiores frequentemente projetam-se para dentro do seio.',
    clinica:
      'O óstio alto é um defeito de projeto: a drenagem depende inteiramente do batimento ciliar, contra a gravidade, e é por isso que o maxilar é o seio que mais infecta. A relação com as raízes dentárias explica a sinusite odontogênica e a comunicação bucossinusal após extração de molares. Na fratura blow-out do assoalho da órbita, o conteúdo orbitário hernia para dentro do seio, com diplopia ao olhar para cima e hipoestesia infraorbital.',
    memoria:
      'O ralo do seio maxilar fica no teto. É a pia com o ralo em cima — só esvazia porque os cílios empurram.',
    pontos: [
      'Por que o seio maxilar é o que mais infecta?',
      'Que relação ele tem com os dentes superiores?',
      'O que é a fratura blow-out?',
    ],
  },
  {
    termos: ['Seio Frontal'],
    classe: 'seio-paranasal',
    resumo: 'Seio par e assimétrico dentro do osso frontal, ausente ao nascimento.',
    localizacao: 'No osso frontal, acima das órbitas e da raiz do nariz; drena pelo ducto nasofrontal ao meato médio.',
    funcao: 'Aligeira a fronte e participa da ressonância vocal. Só começa a se desenvolver por volta dos 6 a 8 anos, alcançando o tamanho adulto na adolescência.',
    inervacao: 'Nervo supraorbital (V1).',
    relacoes: 'Sua parede posterior separa-o da fossa craniana anterior; o assoalho é o teto da órbita.',
    clinica:
      'Ser ausente na criança pequena é o que exclui a sinusite frontal como diagnóstico antes dos 6 anos. Já no adolescente e no adulto, sua parede posterior fina é a via da complicação intracraniana: abscesso epidural, empiema subdural e trombose do seio sagital. O tumor inflamatório de Pott — abscesso subperiosteal com edema flutuante na testa — é o sinal externo de uma infecção que já erodiu o osso.',
    memoria:
      'Criança pequena não tem seio frontal — logo, não tem sinusite frontal. E adulto com testa inchada e mole tem osso comido.',
    pontos: [
      'Quando o seio frontal se desenvolve?',
      'Para onde ele drena?',
      'O que é o tumor inflamatório de Pott?',
    ],
  },
  {
    termos: ['Seio Etmoidal'],
    classe: 'seio-paranasal',
    resumo: 'Conjunto de células aéreas no labirinto etmoidal, entre a órbita e a cavidade nasal.',
    localizacao: 'No labirinto etmoidal, divididas em células anteriores, médias e posteriores; separadas da órbita apenas pela lâmina papirácea.',
    funcao: 'As células anteriores e médias drenam para o meato médio; as posteriores, para o meato superior.',
    relacoes: 'A lâmina papirácea, medial à órbita, tem espessura de papel — daí o nome.',
    clinica:
      'É o único seio presente e pneumatizado ao nascimento, e por isso a etmoidite é a sinusite do lactente. Através da lâmina papirácea, a infecção alcança a órbita: a celulite orbitária em criança é, quase sempre, uma etmoidite complicada, e sua classificação de Chandler — do edema palpebral ao abscesso e à trombose cavernosa — segue exatamente esse caminho anatômico.',
    memoria:
      'Lâmina papirácea: uma folha de papel entre o etmoide e o olho. É por ela que a sinusite vira celulite orbitária.',
    pontos: [
      'Que seio já está pneumatizado ao nascimento?',
      'O que é a lâmina papirácea?',
      'Como a etmoidite complica para a órbita?',
    ],
  },
  {
    termos: ['Seio Esfenoidal'],
    classe: 'seio-paranasal',
    resumo: 'Seio dentro do corpo do esfenoide, o mais posterior e o mais próximo de estruturas nobres.',
    localizacao: 'No corpo do esfenoide, abaixo da sela túrcica; drena no recesso esfenoetmoidal, acima da concha superior.',
    funcao: 'Aligeira o corpo do esfenoide; sua pneumatização é muito variável e define a via de acesso à hipófise.',
    relacoes: 'Seu teto é o assoalho da sela; nas paredes laterais fazem relevo a carótida interna e o nervo óptico.',
    clinica:
      'É a estrada da cirurgia transesfenoidal, e o grau de pneumatização decide se a abordagem é simples ou exige fresagem. As saliências da carótida e do óptico nas paredes laterais são deiscentes em parte das pessoas — cobertas apenas por mucosa —, o que faz da esfenoidite uma causa rara de perda visual e da cirurgia um procedimento de precisão milimétrica. A cefaleia da esfenoidite é retro-orbital e occipital, difícil de localizar.',
    memoria:
      'É o seio mais fundo do crânio, com a hipófise em cima, a carótida de um lado e o nervo óptico do outro. Vizinhança perigosa.',
    pontos: [
      'Para onde drena o seio esfenoidal?',
      'Que estruturas fazem relevo em suas paredes?',
      'Que cirurgia o utiliza como via de acesso?',
    ],
  },
  /* ─────────────────── Faringe ─────────────────── */
  {
    termos: ['Porção Nasal da Faringe'],
    classe: 'via-aerea',
    resumo: 'Nasofaringe: porção puramente respiratória da faringe, atrás das coanas.',
    localizacao: 'Da base do crânio ao palato mole, atrás das coanas; comunica-se com a orofaringe pelo istmo faríngeo.',
    funcao:
      'Conduz o ar do nariz à orofaringe e abriga o óstio da tuba auditiva e a tonsila faríngea. Durante a deglutição, o palato mole se eleva e fecha o istmo faríngeo, impedindo o refluxo nasal.',
    vascularizacao: 'Artéria faríngea ascendente e ramos da maxilar.',
    inervacao: 'Plexo faríngeo (IX e X) e ramo nasofaríngeo do V2.',
    relacoes: 'Reveste-se de epitélio respiratório ciliado, não de epitélio escamoso como o resto da faringe.',
    clinica:
      'O carcinoma de nasofaringe, associado ao vírus Epstein-Barr, é silencioso e se apresenta tardiamente: massa cervical por metástase linfonodal, otite média serosa unilateral no adulto, obstrução nasal e epistaxe. Adulto com otite serosa de um lado só exige nasofibroscopia — não existe outra explicação aceitável até que se prove.',
    memoria:
      'Otite serosa unilateral em adulto = examine a nasofaringe. Em criança é adenoide; em adulto, até prova em contrário, é tumor.',
    pontos: [
      'Que estruturas a nasofaringe abriga?',
      'Como o istmo faríngeo se fecha na deglutição?',
      'Que sinal de alerta indica carcinoma de nasofaringe?',
    ],
  },
  {
    termos: ['Porção Oral da Faringe', 'Parte Oral da Faringe'],
    classe: 'via-aerea',
    resumo: 'Orofaringe: porção comum às vias respiratória e digestória, do palato mole à epiglote.',
    localizacao: 'Do palato mole à borda superior da epiglote, comunicando-se com a boca pelo istmo das fauces.',
    funcao: 'Passagem de ar e de alimento; contém as tonsilas palatinas, entre os arcos palatoglosso e palatofaríngeo.',
    inervacao: 'Nervo glossofaríngeo (IX), responsável pelo componente aferente do reflexo de vômito.',
    relacoes: 'Reveste-se de epitélio escamoso estratificado, adaptado ao atrito do bolo alimentar.',
    clinica:
      'É o segmento que colapsa na apneia obstrutiva do sono — a parede posterior e as paredes laterais cedem quando o tônus muscular cai no sono, e é por isso que o CPAP funciona: ele é um "tala pneumática" que mantém o tubo aberto. O carcinoma de orofaringe associado ao HPV tem hoje incidência crescente e prognóstico melhor que o associado ao tabaco.',
    memoria:
      'A orofaringe é um tubo sem esqueleto: só músculo. No sono, o músculo relaxa e o tubo fecha. Isso é apneia obstrutiva.',
    pontos: [
      'Que limites definem a orofaringe?',
      'Que nervo medeia o reflexo de vômito?',
      'Por que a orofaringe colapsa na apneia do sono?',
    ],
  },
  {
    termos: ['Porção Laríngea da Faringe'],
    classe: 'via-aerea',
    resumo: 'Laringofaringe: porção inferior da faringe, da epiglote à borda inferior da cartilagem cricóidea.',
    localizacao: 'Da borda superior da epiglote até C6, onde se continua com o esôfago; envolve a laringe por trás e pelos lados.',
    funcao: 'Encaminha o bolo alimentar pelos recessos piriformes, de cada lado da laringe, para o esôfago — desviando-o da via aérea.',
    inervacao: 'Nervo laríngeo interno (X) na mucosa; plexo faríngeo na musculatura.',
    relacoes: 'A junção faringoesofágica é marcada pelo músculo cricofaríngeo, o esfíncter esofágico superior.',
    clinica:
      'O trígono de Killian, entre as fibras oblíquas e transversas do constritor inferior, é o ponto fraco por onde a mucosa hernia formando o divertículo de Zenker: disfagia, regurgitação de alimento não digerido horas depois e halitose. É um divertículo de pulsão que nasce inteiramente de uma falha anatômica da parede.',
    memoria:
      'Um ponto fraco na parede de trás da faringe. A mucosa escapa por ali e vira um bolso onde a comida fica guardada.',
    pontos: [
      'Que limites definem a laringofaringe?',
      'Qual o papel dos recessos piriformes?',
      'O que é o divertículo de Zenker?',
    ],
  },
  {
    termos: ['Cóano'],
    classe: 'passagem-ossea',
    resumo: 'Abertura posterior de uma cavidade nasal para a nasofaringe.',
    localizacao: 'Limite entre a cavidade nasal e a nasofaringe, delimitada pelo vômer, pelo palatino, pelo esfenoide e pela lâmina medial do pterigoide.',
    funcao: 'Passagem do ar já condicionado do nariz para a faringe.',
    relacoes: 'Imediatamente atrás está a nasofaringe, com a tonsila faríngea no teto.',
    clinica:
      'A hipertrofia da tonsila faríngea (adenoide) obstrui as coanas na criança e produz a fácies adenoideana: respiração bucal, boca entreaberta, palato ogival e alterações do crescimento facial. O pólipo antrocoanal, que nasce no seio maxilar e cresce pela coana, é a causa de obstrução nasal unilateral com massa visível na nasofaringe.',
    memoria:
      'Criança que respira de boca aberta e ronca: olhe atrás do nariz. A adenoide está tampando a coana.',
    pontos: [
      'Que ossos delimitam a coana?',
      'O que é a fácies adenoideana?',
      'Que massa cresce do seio maxilar para a coana?',
    ],
  },
  {
    termos: ['Óstio Faríngeo da Tuba Auditiva'],
    classe: 'via-aerea',
    resumo: 'Abertura da tuba auditiva na parede lateral da nasofaringe.',
    localizacao: 'Parede lateral da nasofaringe, cerca de 1 a 1,5 cm atrás da cauda da concha inferior, limitado atrás pelo toro tubário.',
    funcao:
      'Permite equalizar a pressão da orelha média com a atmosférica. A tuba fica fechada em repouso e abre-se pela contração do tensor do véu palatino ao deglutir e ao bocejar.',
    inervacao: 'Ramos do plexo faríngeo e do nervo mandibular.',
    relacoes: 'Na criança, a tuba é mais curta, mais horizontal e mais larga que no adulto.',
    clinica:
      'Essa geometria infantil é o que faz a otite média ser doença de criança: o refluxo de secreção da nasofaringe para a orelha média é fácil, e a drenagem é ruim. É também a razão de o cateterismo tubário e a inserção de tubos de ventilação serem procedimentos pediátricos por excelência, e de a otite se tornar rara depois que a tuba se verticaliza na adolescência.',
    memoria:
      'Tuba de criança é curta, larga e deitada: tudo o que está no nariz sobe para a orelha. Na adolescência ela "levanta" e a otite acaba.',
    pontos: [
      'Que músculo abre a tuba auditiva?',
      'Como a tuba difere entre criança e adulto?',
      'Por que a otite média é mais comum na infância?',
    ],
  },
  {
    termos: ['Toro Tubário'],
    classe: 'via-aerea',
    resumo: 'Elevação de mucosa atrás do óstio da tuba, produzida pela cartilagem tubária.',
    localizacao: 'Parede lateral da nasofaringe, contornando o óstio da tuba auditiva por cima e por trás.',
    funcao: 'Marca a extremidade da porção cartilagínea da tuba e origina as pregas salpingofaríngea e salpingopalatina.',
    relacoes: 'Atrás dele está o recesso faríngeo (fosseta de Rosenmüller).',
    clinica:
      'É a referência endoscópica que orienta toda a nasofibroscopia: encontrado o toro, encontram-se o óstio tubário à frente e a fosseta de Rosenmüller atrás — o ponto que se deve inspecionar obrigatoriamente em qualquer suspeita de tumor de nasofaringe. É também o reparo da dilatação tubária por balão.',
    memoria:
      'Um "lábio" de cartilagem contornando a boca da tuba. Na frente dele, a porta da orelha; atrás, o esconderijo do tumor.',
    pontos: [
      'O que forma o toro tubário?',
      'Que pregas partem dele?',
      'Que estrutura fica imediatamente atrás dele?',
    ],
  },
  {
    termos: ['Recesso Faríngeo'],
    classe: 'via-aerea',
    resumo: 'Fosseta de Rosenmüller: depressão da parede lateral da nasofaringe atrás do toro tubário.',
    localizacao: 'Parede lateral e posterior da nasofaringe, atrás e acima do toro tubário.',
    funcao: 'É o ponto mais alto e mais lateral da nasofaringe; não tem função conhecida além de ser um recesso da mucosa.',
    relacoes: 'Separado do forame lacerado e da carótida interna por poucos milímetros.',
    clinica:
      'É o sítio de origem da grande maioria dos carcinomas de nasofaringe — motivo pelo qual toda nasofibroscopia por suspeita de tumor precisa visualizar essa fosseta, e não apenas o centro da nasofaringe. Sua proximidade com a base do crânio explica a invasão precoce e o acometimento de nervos cranianos como primeira manifestação.',
    memoria:
      'A fosseta de Rosenmüller é o esconderijo favorito do câncer de nasofaringe. Quem não olha lá, não faz o diagnóstico.',
    pontos: [
      'Onde se localiza o recesso faríngeo?',
      'Por que ele é clinicamente importante?',
      'Que estruturas estão próximas a ele?',
    ],
  },
  {
    termos: ['Prega Salpingofaríngea'],
    classe: 'via-aerea',
    resumo: 'Prega vertical de mucosa que desce do toro tubário, cobrindo o músculo salpingofaríngeo.',
    localizacao: 'Parede lateral da faringe, descendo do toro tubário em direção à parede lateral da laringofaringe.',
    funcao: 'Recobre o músculo salpingofaríngeo, que eleva a faringe na deglutição e auxilia a abertura da tuba auditiva.',
    relacoes: 'Faz par com a prega salpingopalatina, mais anterior.',
    clinica:
      'A ação desse músculo na abertura tubária é complementar à do tensor do véu palatino, e sua disfunção contribui para a otite média com efusão no adulto. Em cirurgia da apneia do sono, as pregas faríngeas laterais são parte da anatomia que se reposiciona nas faringoplastias modernas.',
    memoria:
      '"Salpingo" é tuba. Todo músculo com esse prefixo tem algo a ver com abrir a tuba auditiva.',
    pontos: [
      'Que músculo a prega salpingofaríngea recobre?',
      'Que funções esse músculo exerce?',
      'Que prega faz par com ela?',
    ],
  },
  {
    termos: ['Tonsila Faríngea'],
    classe: 'linfatico',
    resumo: 'Adenoide: acúmulo de tecido linfoide no teto e na parede posterior da nasofaringe.',
    localizacao: 'Teto e parede posterior da nasofaringe, na linha média, sem cápsula verdadeira e sem criptas profundas.',
    funcao: 'É o componente superior do anel linfático de Waldeyer, primeira barreira imunológica da via aerodigestiva. Cresce até os 5 a 7 anos e involui na adolescência.',
    vascularizacao: 'Artéria faríngea ascendente e ramos da maxilar.',
    relacoes: 'Com as tonsilas palatinas, tubárias e linguais, completa o anel de Waldeyer.',
    clinica:
      'Sua hipertrofia é a principal causa de apneia obstrutiva do sono na criança, com roncos, sono agitado, respiração bucal e, em casos graves, déficit de crescimento e alterações comportamentais confundidas com transtorno de déficit de atenção. A adenoidectomia reverte o quadro — e é um dos exemplos mais nítidos de como uma estrutura anatômica pode alterar o desenvolvimento infantil.',
    memoria:
      'Anel de Waldeyer: faríngea em cima, palatinas nos lados, lingual embaixo, tubárias nos cantos. Um anel de defesa em volta da entrada.',
    pontos: [
      'Que estruturas compõem o anel de Waldeyer?',
      'Quando a tonsila faríngea cresce e involui?',
      'Que quadro sua hipertrofia produz na criança?',
    ],
  },
  {
    termos: ['Fossa Tonsilar'],
    classe: 'via-aerea',
    resumo: 'Depressão entre os arcos palatoglosso e palatofaríngeo, onde se aloja a tonsila palatina.',
    localizacao: 'Parede lateral da orofaringe, entre os dois arcos palatinos.',
    funcao: 'Aloja a tonsila palatina, com suas criptas profundas que ampliam enormemente a superfície de contato com antígenos.',
    vascularizacao: 'Artéria tonsilar, ramo da facial, com contribuição das palatinas ascendente e descendente e da lingual dorsal.',
    inervacao: 'Nervo glossofaríngeo e ramo tonsilar do palatino menor — daí a otalgia reflexa.',
    relacoes: 'Lateralmente ao leito tonsilar, a cerca de 2 cm, corre a artéria carótida interna.',
    clinica:
      'Essa distância de 2 cm é o que torna a tonsilectomia uma cirurgia com respeito: a dissecção deve manter-se no plano capsular. A dor de ouvido após amigdalectomia é otalgia referida pelo IX par, e não infecção. O abscesso peritonsilar desvia a úvula para o lado oposto e produz trismo e voz de "batata quente" — três sinais que fecham o diagnóstico à inspeção.',
    memoria:
      'Voz de batata quente, trismo e úvula desviada: abscesso peritonsilar. Não precisa de exame nenhum para suspeitar.',
    pontos: [
      'Que estruturas delimitam a fossa tonsilar?',
      'Por que há otalgia após amigdalectomia?',
      'Quais os sinais do abscesso peritonsilar?',
    ],
  },
  {
    termos: ['Arco Palatoglosso'],
    classe: 'via-aerea',
    resumo: 'Prega anterior da fossa tonsilar, que forma o limite entre a boca e a orofaringe.',
    localizacao: 'Da borda do palato mole à lateral da língua, cobrindo o músculo palatoglosso.',
    funcao:
      'Delimita o istmo das fauces — a fronteira entre cavidade oral e orofaringe. O músculo palatoglosso eleva a raiz da língua e estreita esse istmo, iniciando a deglutição.',
    inervacao: 'Plexo faríngeo (X) — é o único músculo da língua não inervado pelo hipoglosso.',
    relacoes: 'Está à frente da tonsila palatina.',
    clinica:
      'A exceção de inervação é cobrada com frequência: o palatoglosso é considerado músculo da língua pela terminologia, mas é funcionalmente palatino e obedece ao vago. Na avaliação da via aérea difícil, a visibilidade dos arcos e da úvula define a classificação de Mallampati, que prevê dificuldade de intubação.',
    memoria:
      'Todos os músculos da língua são do XII, menos o palatoglosso, que é do X. A exceção que sempre cai.',
    pontos: [
      'Que estrutura o arco palatoglosso delimita?',
      'Qual a inervação do músculo palatoglosso e por que ela é excepcional?',
      'O que é a classificação de Mallampati?',
    ],
  },
  {
    termos: ['Arco Palatofaríngeo'],
    classe: 'via-aerea',
    resumo: 'Prega posterior da fossa tonsilar, que cobre o músculo palatofaríngeo.',
    localizacao: 'Do palato mole à parede lateral da faringe, atrás da tonsila palatina.',
    funcao: 'O músculo palatofaríngeo eleva a faringe e a laringe na deglutição e traciona o palato para baixo, participando do fechamento do istmo faríngeo.',
    inervacao: 'Plexo faríngeo (X).',
    relacoes: 'Contribui para formar a prega de Passavant, um rebordo muscular na parede posterior da faringe.',
    clinica:
      'A prega de Passavant é o rebordo contra o qual o palato mole se apoia para vedar a nasofaringe — e sua insuficiência é a base da insuficiência velofaríngea, com fala hipernasal e refluxo nasal de líquidos, comum após palatoplastia e adenoidectomia em pacientes com palato submucoso. Por isso se examina o palato antes de indicar adenoidectomia.',
    memoria:
      'Palatoglosso puxa a língua para cima; palatofaríngeo puxa a faringe para cima. Os dois arcos, dois vetores da deglutição.',
    pontos: [
      'Que ações o músculo palatofaríngeo realiza?',
      'O que é a prega de Passavant?',
      'O que é insuficiência velofaríngea?',
    ],
  },
  {
    termos: ['Palato Mole'],
    classe: 'via-aerea',
    resumo: 'Prega muscular móvel que continua o palato duro e separa nasofaringe de orofaringe na deglutição.',
    localizacao: 'Da borda posterior do palato duro até a úvula, com a aponeurose palatina como esqueleto.',
    funcao:
      'Cinco músculos o movem: tensor do véu palatino (V3), levantador do véu, palatoglosso, palatofaríngeo e músculo da úvula (todos pelo plexo faríngeo, X). Sua elevação fecha o istmo faríngeo e impede o refluxo nasal do alimento.',
    inervacao: 'Todos os músculos pelo vago, exceto o tensor do véu palatino, pelo V3.',
    clinica:
      'A regra "todos pelo X, menos o tensor pelo V3" é a mais cobrada da região. Clinicamente, a paralisia unilateral do vago faz a úvula desviar para o lado sadio ao dizer "a" — o palato sobe só de um lado. E é o palato mole flácido e alongado que vibra no ronco e colapsa na apneia, alvo das uvulopalatofaringoplastias.',
    memoria:
      'A úvula foge do lado doente. Se ela puxa para a direita, o vago lesado é o esquerdo.',
    pontos: [
      'Quais músculos movem o palato mole e qual sua inervação?',
      'Para que lado a úvula desvia na paralisia do vago?',
      'Qual o papel do palato mole na deglutição?',
    ],
  },
  {
    termos: ['Recesso Piriforme'],
    classe: 'via-aerea',
    resumo: 'Goteira de cada lado da entrada da laringe, por onde escorre o bolo alimentar.',
    localizacao: 'Na laringofaringe, entre a prega ariepiglótica, medialmente, e a cartilagem tireóidea e a membrana tireo-hióidea, lateralmente.',
    funcao: 'Canaliza o bolo alimentar em torno da laringe, dos dois lados, até o esôfago — a solução anatômica para o cruzamento entre as vias aérea e digestória.',
    inervacao: 'Nervo laríngeo interno, que corre submucoso no seu assoalho.',
    relacoes: 'A submucosa do recesso é fina, e o nervo é palpável logo abaixo dela.',
    clinica:
      'É o local mais frequente de impactação de corpos estranhos, sobretudo espinhas de peixe. E é onde se aplicava classicamente a anestesia tópica do laríngeo interno, com um cotonete embebido no recesso, para intubação com paciente acordado. O carcinoma de recesso piriforme é silencioso e se manifesta tarde, com metástase cervical — o que explica seu mau prognóstico.',
    memoria:
      'Duas calhas em volta da laringe: a comida escorre pelos lados e o ar entra pelo meio. Espinha de peixe fica presa na calha.',
    pontos: [
      'Que estruturas delimitam o recesso piriforme?',
      'Que nervo corre no seu assoalho?',
      'Por que ele é sítio comum de corpo estranho?',
    ],
  },
  {
    termos: ['Lábio Superior', 'Lábio Inferior'],
    classe: 'via-aerea',
    resumo: 'Pregas musculocutâneas que fecham a boca, com o orbicular da boca no seu esqueleto.',
    localizacao: 'Delimitam a rima da boca; o superior estende-se até o sulco nasolabial e o filtro, o inferior até o sulco mentolabial.',
    funcao: 'Vedam a cavidade oral, participam da articulação da fala, da sucção e da contenção do bolo alimentar na primeira fase da deglutição.',
    vascularizacao: 'Artérias labiais superior e inferior, ramos da artéria facial, que correm submucosas na borda do lábio.',
    inervacao: 'Sensitiva pelo infraorbital (V2) no superior e mentual (V3) no inferior; motora pelo nervo facial.',
    clinica:
      'A posição submucosa das artérias labiais é o que faz a laceração do lábio sangrar tanto e o que permite controlá-la pinçando o lábio entre os dedos. O alinhamento exato da linha do vermelhão é o ponto crítico da sutura: um degrau de 1 mm ali é visível a metros de distância. E a incompetência labial por paralisia facial produz escape de líquidos e dificuldade de fala.',
    memoria:
      'Ao suturar lábio, o primeiro ponto é sempre na linha do vermelhão. Errar ali é uma cicatriz que todos vão ver.',
    pontos: [
      'Que artérias irrigam os lábios e onde elas correm?',
      'Qual a inervação sensitiva de cada lábio?',
      'Por que o alinhamento do vermelhão é crítico na sutura?',
    ],
  },
  /* ─────────────────── Laringe ─────────────────── */
  {
    termos: ['Laringe'],
    classe: 'via-aerea',
    resumo: 'Órgão cartilagíneo entre a faringe e a traqueia, esfíncter da via aérea e órgão da fonação.',
    localizacao: 'Região cervical anterior, de C3 a C6 no adulto; mais alta na criança e no recém-nascido.',
    funcao:
      'Três funções, em ordem de importância biológica: proteger a via aérea na deglutição, permitir a tosse e produzir a voz. Nove cartilagens — três ímpares (tireóidea, cricóidea, epiglote) e três pares (aritenóideas, corniculadas, cuneiformes).',
    vascularizacao: 'Artérias laríngeas superior (da tireóidea superior) e inferior (da tireóidea inferior).',
    inervacao:
      'Laríngeo superior: ramo interno sensitivo acima das pregas vocais, ramo externo motor para o cricotireóideo. Laríngeo recorrente: motor para todos os demais músculos e sensitivo abaixo das pregas.',
    clinica:
      'Essa divisão é a base de toda a clínica laríngea. A lesão do recorrente paralisa a prega vocal em posição paramediana, com rouquidão; bilateral, produz estridor e obstrução, porque as duas pregas ficam próximas da linha média. A lesão do laríngeo superior interno abole a sensibilidade supraglótica e leva à aspiração silenciosa — o paciente aspira sem tossir, e é o que mais mata no pós-operatório de cabeça e pescoço.',
    memoria:
      'Recorrente move quase tudo; laríngeo superior sente por cima e move só um músculo. Rouquidão é recorrente; engasgo silencioso é superior.',
    pontos: [
      'Quais são as três funções da laringe, em ordem de importância?',
      'Como se divide a inervação laríngea?',
      'O que é aspiração silenciosa e por que ela ocorre?',
    ],
  },
  {
    termos: ['Cartilagem Tireóidea', 'Proeminência Laríngea', 'Proeminência da Laringe'],
    classe: 'cartilagem',
    resumo: 'Maior cartilagem da laringe, formada por duas lâminas que se encontram na linha média no pomo de Adão.',
    localizacao: 'Ao nível de C4–C5; suas lâminas formam um ângulo de cerca de 90° no homem e 120° na mulher.',
    funcao:
      'Protege as pregas vocais, que se inserem na sua face interna, na comissura anterior. O ângulo mais fechado do homem alonga as pregas vocais e é a razão anatômica da voz mais grave após a puberdade.',
    relacoes: 'Os cornos superiores ligam-se ao hioide pela membrana tireo-hióidea; os inferiores articulam-se com a cricóidea.',
    clinica:
      'A diferença de ângulo entre os sexos é a base da cirurgia de feminilização vocal e da condrolaringoplastia. Na fratura laríngea por trauma cervical direto, a perda da proeminência com enfisema subcutâneo, disfonia e hemoptise é uma emergência de via aérea — em que a intubação pode ser catastrófica e a traqueostomia é a conduta.',
    memoria:
      'O pomo de Adão é o ângulo fechado da tireóidea. Ângulo fechado, prega vocal longa, voz grave.',
    pontos: [
      'Por que a voz masculina é mais grave?',
      'Onde as pregas vocais se inserem anteriormente?',
      'Que conduta se toma na fratura laríngea?',
    ],
  },
  {
    termos: ['Cartilagem Cricóidea', 'Cartilagem Cricóidea - Lâmina', 'Cartilagem Cricóidea (Lâmina)'],
    classe: 'cartilagem',
    resumo: 'Único anel cartilagíneo completo de toda a via aérea, em forma de anel de sinete.',
    localizacao: 'Ao nível de C6, abaixo da tireóidea, com arco estreito à frente e lâmina larga atrás.',
    funcao:
      'Sustenta a laringe e serve de base para as cartilagens aritenóideas, que se articulam na borda superior da lâmina. Por ser um anel completo, é o único ponto da via aérea que não colapsa.',
    relacoes: 'Marca o nível em que a faringe se torna esôfago e a laringe se torna traqueia; corresponde ao tubérculo carotídeo de C6.',
    clinica:
      'Ser um anel completo tem duas consequências opostas. Permite a manobra de Sellick, a compressão cricóidea que oclui o esôfago na indução anestésica. E faz da região subglótica o ponto mais estreito da via aérea infantil — motivo pelo qual o crupe obstrui aí e pelo qual tubos com balão eram evitados em crianças, para prevenir estenose subglótica.',
    memoria:
      'É o único anel completo da via aérea. Aperte a cricóide e você fecha o esôfago sem fechar a traqueia.',
    pontos: [
      'Por que a cricóidea é única entre as cartilagens da via aérea?',
      'Que nível vertebral ela marca e o que muda ali?',
      'Por que a região subglótica é crítica na criança?',
    ],
  },
  {
    termos: ['Prega Vestibular'],
    classe: 'via-aerea',
    resumo: 'Prega superior da laringe — a falsa prega vocal —, que participa da proteção, não da fonação.',
    localizacao: 'Acima das pregas vocais verdadeiras, separada delas pelo ventrículo da laringe.',
    funcao:
      'Contém o ligamento vestibular e glândulas mucosas abundantes, que lubrificam as pregas vocais verdadeiras — estas não têm glândulas próprias. Fecham-se na manobra de Valsalva, trancando o ar nos pulmões.',
    inervacao: 'Nervo laríngeo interno (sensitiva).',
    relacoes: 'A prega vocal verdadeira é branca e nacarada; a vestibular é rosada e vascularizada — a diferença de cor é o que as distingue na laringoscopia.',
    clinica:
      'A ausência de glândulas nas pregas vocais verdadeiras explica por que a hidratação e o vapor são tratamento e não folclore: a lubrificação vem inteiramente de cima. E a disfonia por tensão muscular, em que o paciente fona com as pregas vestibulares, produz voz áspera e esforçada, tratada com fonoterapia e não com cirurgia.',
    memoria:
      'Branca é verdadeira, rosada é falsa. E a falsa é quem molha a verdadeira — porque a verdadeira não tem glândula.',
    pontos: [
      'Qual a função das pregas vestibulares?',
      'Como distingui-las das pregas vocais na laringoscopia?',
      'Por que as pregas vocais dependem das vestibulares?',
    ],
  },
  {
    termos: ['Ventrículo da Laringe'],
    classe: 'via-aerea',
    resumo: 'Recesso entre a prega vestibular e a prega vocal de cada lado.',
    localizacao: 'Entre as duas pregas, estendendo-se lateralmente e para cima como sáculo laríngeo.',
    funcao: 'Aloja as glândulas que lubrificam as pregas vocais e funciona como câmara de ressonância.',
    relacoes: 'O sáculo, sua extensão anterossuperior, pode dilatar-se anormalmente.',
    clinica:
      'A dilatação do sáculo forma a laringocele, que se apresenta como massa cervical que aumenta à manobra de Valsalva — clássica em sopradores de instrumentos de vidro e de instrumentos de sopro. Uma laringocele em adulto sem essa história obriga a excluir tumor obstruindo o ventrículo.',
    memoria:
      'Um bolso entre a prega falsa e a verdadeira. Bolso que enche de ar vira laringocele e aparece no pescoço quando a pessoa assopra.',
    pontos: [
      'Que estruturas delimitam o ventrículo da laringe?',
      'Qual sua função?',
      'O que é uma laringocele?',
    ],
  },
  {
    termos: ['Cavidade Infraglótica'],
    classe: 'via-aerea',
    resumo: 'Porção da laringe abaixo das pregas vocais, até a borda inferior da cricóidea.',
    localizacao: 'Da face inferior das pregas vocais até o início da traqueia, delimitada pela cartilagem cricóidea.',
    funcao: 'Conduz o ar entre a glote e a traqueia; sua mucosa é frouxamente aderida, ao contrário da glote.',
    inervacao: 'Nervo laríngeo recorrente (sensitiva abaixo das pregas).',
    relacoes: 'A membrana cricotireóidea, à frente, é subcutânea e palpável.',
    clinica:
      'A frouxidão da submucosa nessa região é o que permite o edema rápido e maciço do crupe e do angioedema — e a cricotireoidostomia de emergência é feita justamente aqui, atravessando a membrana cricotireóidea, o ponto em que a via aérea está mais superficial e mais acessível. Saber palpar essa membrana é uma habilidade que salva vidas.',
    memoria:
      'Entre a tireóidea e a cricóide há uma membrana logo sob a pele. É a porta de emergência da via aérea.',
    pontos: [
      'Que limites definem a cavidade infraglótica?',
      'Por que ela edemacia com facilidade?',
      'Onde se faz a cricotireoidostomia?',
    ],
  },
  {
    termos: ['Prega Ariepiglótica'],
    classe: 'via-aerea',
    resumo: 'Prega de mucosa que vai da epiglote à aritenoide, delimitando a entrada da laringe.',
    localizacao: 'Borda lateral do ádito da laringe, separando-o do recesso piriforme.',
    funcao: 'Contém o músculo ariepiglótico, que estreita o ádito na deglutição, e as cartilagens cuneiforme e corniculada, que a enrijecem.',
    relacoes: 'Forma o limite entre a via aérea e a via alimentar na altura da laringe.',
    clinica:
      'Pregas ariepiglóticas curtas e flácidas que se dobram para dentro na inspiração produzem a laringomalácia, causa mais comum de estridor no lactente — estridor inspiratório que piora em decúbito dorsal e no choro e melhora em decúbito ventral, com resolução espontânea até os 18 meses na maioria dos casos. A supraglotoplastia trata os casos graves seccionando essas pregas.',
    memoria:
      'Bebê com estridor que melhora de bruços: laringomalácia. As pregas são moles e "sugam" para dentro na inspiração.',
    pontos: [
      'Que estruturas a prega ariepiglótica contém?',
      'Que limite anatômico ela estabelece?',
      'O que é laringomalácia?',
    ],
  },
  {
    termos: ['Músculo Cricoaritenóideo Posterior'],
    classe: 'musculo',
    resumo: 'Único músculo abdutor das pregas vocais — o único que abre a via aérea.',
    localizacao: 'Face posterior da lâmina da cricóidea, indo até o processo muscular da aritenoide.',
    funcao: 'Roda a aritenoide lateralmente, afastando as pregas vocais e abrindo a rima da glote a cada inspiração.',
    inervacao: 'Nervo laríngeo recorrente.',
    relacoes: 'Todos os demais músculos intrínsecos são adutores ou tensores.',
    clinica:
      'Ser o único abdutor é o fato mais importante da laringe: sua paralisia bilateral — em cirurgia de tireoide, na doença de Parkinson, na atrofia de múltiplos sistemas — fecha a via aérea e produz estridor com voz preservada, exigindo traqueostomia. Voz normal com estridor é um sinal paradoxal que aponta diretamente para esse músculo.',
    memoria:
      'Um músculo só abre a laringe: o cricoaritenóideo posterior. Se ele para dos dois lados, o paciente respira por um canudo.',
    pontos: [
      'Qual a ação do músculo cricoaritenóideo posterior?',
      'Por que ele é o mais importante da laringe?',
      'Que quadro sua paralisia bilateral produz?',
    ],
  },
  {
    termos: ['Músculo Cricotireóideo'],
    classe: 'musculo',
    resumo: 'Único músculo laríngeo inervado pelo ramo externo do laríngeo superior, responsável por afinar a voz.',
    localizacao: 'Face externa da laringe, do arco da cricóidea à borda inferior da tireóidea.',
    funcao:
      'Aproxima a cartilagem tireóidea da cricóidea, alongando e tensionando as pregas vocais e elevando a frequência fundamental da voz. É o músculo do agudo.',
    inervacao: 'Ramo externo do nervo laríngeo superior.',
    relacoes: 'O ramo externo corre junto à artéria tireóidea superior, no polo superior da tireoide.',
    clinica:
      'Essa relação é a razão de ele ser lesado na tireoidectomia: o resultado não é rouquidão franca, e sim fadiga vocal e perda dos agudos — sequela devastadora para cantores e professores e frequentemente subdiagnosticada, porque a voz de conversa permanece normal. Por isso a ligadura da tireóidea superior é feita rente à cápsula da glândula.',
    memoria:
      'É o único músculo da laringe que não obedece ao recorrente. E sua lesão não deixa rouco — deixa sem agudos.',
    pontos: [
      'Qual a ação do músculo cricotireóideo?',
      'Que nervo o inerva e por que ele é vulnerável?',
      'Que alteração vocal sua lesão produz?',
    ],
  },
  {
    termos: ['Músculo Aritenóideo Transverso'],
    classe: 'musculo',
    resumo: 'Único músculo intrínseco ímpar da laringe, que aproxima as duas aritenoides.',
    localizacao: 'Face posterior das cartilagens aritenóideas, unindo-as transversalmente.',
    funcao: 'Fecha a porção posterior da rima da glote, aproximando os corpos das aritenoides — o componente final do fechamento glótico.',
    inervacao: 'Nervo laríngeo recorrente, com contribuição bilateral.',
    relacoes: 'É o único músculo laríngeo que não é par.',
    clinica:
      'Sua inervação bilateral significa que ele é o único músculo laríngeo que não paralisa completamente em lesão unilateral do recorrente — e sua função residual ajuda a explicar a compensação vocal ao longo dos meses. Já sua fraqueza isolada produz fenda glótica posterior, com voz soprosa e escape de ar, achado comum na disfonia funcional.',
    memoria:
      'É o único ímpar e o único com nervo dos dois lados. Por isso ele é o último a falhar.',
    pontos: [
      'Qual a ação do músculo aritenóideo transverso?',
      'Por que ele é excepcional entre os músculos laríngeos?',
      'Que alteração vocal sua fraqueza produz?',
    ],
  },
  {
    termos: ['Músculo Tireo-hióideo'],
    classe: 'musculo',
    resumo: 'Músculo infra-hióideo curto que aproxima a laringe do osso hioide.',
    localizacao: 'Da linha oblíqua da cartilagem tireóidea à borda inferior do corpo e ao corno maior do hioide.',
    funcao: 'Eleva a laringe quando o hioide está fixo — passo essencial da deglutição — e abaixa o hioide quando a laringe está fixa.',
    inervacao: 'Fibras de C1 que trafegam com o nervo hipoglosso, e não pela alça cervical como os demais infra-hióideos.',
    relacoes: 'Coberto pelo esterno-hióideo e pelo omo-hióideo.',
    clinica:
      'A elevação laríngea que ele promove é o que leva a epiglote a cobrir o ádito e é o movimento que o examinador palpa ao avaliar a deglutição à beira do leito. Sua falha, no idoso ou no paciente neurológico, reduz a excursão laríngea e é um dos mecanismos centrais da disfagia orofaríngea e da broncoaspiração.',
    memoria:
      'Coloque o dedo no pomo de Adão e peça para engolir: o que sobe é a laringe, puxada por esse músculo. Se sobe pouco, o paciente aspira.',
    pontos: [
      'Qual a ação do músculo tireo-hióideo?',
      'Qual sua inervação e por que ela é peculiar?',
      'Como avaliar clinicamente a excursão laríngea?',
    ],
  },
  {
    termos: ['Esôfago (rebatido)', 'Esôfago (Rebatido)'],
    classe: 'viscera',
    resumo: 'Início do esôfago, atrás da laringe e da traqueia, com o esfíncter cricofaríngeo na entrada.',
    localizacao: 'Começa em C6, na borda inferior da cricóidea, e desce atrás da traqueia no pescoço, ligeiramente à esquerda.',
    funcao: 'Conduz o bolo ao estômago; seu esfíncter superior, o músculo cricofaríngeo, permanece tonicamente contraído e relaxa apenas na deglutição.',
    relacoes: 'O nervo laríngeo recorrente sobe no sulco traqueoesofágico, entre o esôfago e a traqueia.',
    clinica:
      'A posição do recorrente nesse sulco é a razão de ele ser identificado e preservado em toda tireoidectomia e em toda esofagectomia cervical. E o desvio do esôfago para a esquerda no pescoço é o que torna a abordagem cervical esquerda a via de escolha para acessá-lo. A falha de relaxamento do cricofaríngeo é a base da acalasia cricofaríngea e do divertículo de Zenker.',
    memoria:
      'O esôfago cervical desvia para a esquerda, e o nervo recorrente sobe no sulco entre ele e a traqueia. Duas regras que guiam o bisturi.',
    pontos: [
      'Em que nível o esôfago começa?',
      'Que nervo corre no sulco traqueoesofágico?',
      'Qual o esfíncter esofágico superior?',
    ],
  },
  {
    termos: ['Traqueia - Parede Membranácea', 'Traqueia (Porção Membranácea)'],
    classe: 'via-aerea',
    resumo: 'Parede posterior da traqueia, sem cartilagem, formada pelo músculo traqueal e tecido fibroso.',
    localizacao: 'Face posterior da traqueia, fechando a abertura dos anéis cartilagíneos em C.',
    funcao:
      'A ausência de cartilagem atrás permite que o esôfago se distenda durante a passagem do bolo alimentar, e permite também que o músculo traqueal reduza o calibre da traqueia na tosse, aumentando a velocidade do ar expelido.',
    relacoes: 'Está em contato direto com o esôfago.',
    clinica:
      'Essa parede é o ponto de menor resistência: é onde o balão da cânula pode erodir e criar a fístula traqueoesofágica — complicação temida da ventilação prolongada, que se manifesta por tosse à deglutição e secreção com alimento. É também por ela que o broncoscopista se orienta, já que a face membranácea sempre indica posterior.',
    memoria:
      'A traqueia é um C, não um O. A abertura fica atrás, encostada no esôfago — e é por ali que os dois se comunicam quando dá errado.',
    pontos: [
      'Por que a traqueia não tem cartilagem posteriormente?',
      'Que função o músculo traqueal exerce na tosse?',
      'O que é a fístula traqueoesofágica?',
    ],
  },
  {
    termos: ['Cavidade Nasal'],
    classe: 'via-aerea',
    resumo: 'Par de cavidades entre a base do crânio e o palato, divididas pelo septo e ocupadas pelas conchas.',
    localizacao: 'Da narina à coana, com teto formado pela lâmina cribiforme, assoalho pelo palato e parede lateral pelas conchas.',
    funcao: 'Condiciona o ar, aloja a mucosa olfatória, drena os seios paranasais e a lágrima, e serve de câmara de ressonância da voz.',
    vascularizacao: 'Plexo de Kiesselbach no septo anterior, formado por ramos das artérias esfenopalatina, etmoidal anterior, palatina maior e labial superior.',
    inervacao: 'Olfatória pelo I par; geral pelo V1 (etmoidais) e V2 (nasopalatino e nasais posteriores).',
    clinica:
      'O plexo de Kiesselbach é a fonte de mais de 90% das epistaxes, e por ser anterior e acessível cede à compressão digital das asas do nariz por 10 a 15 minutos — orientação simples que resolve a maioria dos casos e que os pacientes costumam fazer errado, comprimindo o osso em vez da cartilagem. A epistaxe posterior, da esfenopalatina, é a que exige tamponamento ou ligadura.',
    memoria:
      'Comprima a parte mole do nariz, não a dura. O sangramento vem do septo anterior, e é ali que a pinça dos dedos alcança.',
    pontos: [
      'Que artérias formam o plexo de Kiesselbach?',
      'Como se trata corretamente a epistaxe anterior?',
      'Que funções a cavidade nasal desempenha?',
    ],
  },
  {
    termos: ['Cavidade Oral'],
    classe: 'via-aerea',
    sistemas: ['respiratorio'],
    resumo: 'Espaço entre os lábios e o istmo das fauces, dividido em vestíbulo e cavidade oral própria.',
    localizacao: 'Limitada acima pelo palato, abaixo pelo assoalho e pela língua, à frente pelos lábios e atrás pelo istmo das fauces.',
    funcao: 'Primeira etapa da digestão e via aérea alternativa; participa da fala e da mastigação.',
    relacoes: 'O vestíbulo fica entre lábios/bochechas e dentes; a cavidade própria, dentro das arcadas dentárias.',
    clinica:
      'A distinção entre vestíbulo e cavidade própria tem consequência prática direta: no paciente com trismo por qualquer causa, o vestíbulo continua acessível, e é por ele que se administram medicações e se aspira secreção. Em anestesia, a abertura bucal limitada é um dos preditores mais fortes de via aérea difícil.',
    memoria:
      'Vestíbulo é do lado de fora dos dentes; cavidade própria é do lado de dentro. Dois espaços que só se comunicam atrás do último molar.',
    pontos: [
      'Que partes compõem a cavidade oral?',
      'Como elas se comunicam quando os dentes estão ocluídos?',
      'Por que essa distinção importa no paciente com trismo?',
    ],
  },
  {
    termos: ['Corpo da Língua', 'Raiz da Língua'],
    classe: 'viscera',
    resumo: 'As duas porções da língua, separadas pelo sulco terminal e com origens embrionárias e inervações distintas.',
    localizacao:
      'O corpo são os dois terços anteriores, na cavidade oral; a raiz é o terço posterior, na orofaringe. O sulco terminal em V, com o forame cego no ápice, é a fronteira.',
    funcao: 'Mastigação, deglutição, fala e gustação; a raiz contém a tonsila lingual, parte do anel de Waldeyer.',
    vascularizacao: 'Artéria lingual, ramo da carótida externa.',
    inervacao:
      'Corpo: sensibilidade geral pelo lingual (V3) e gustativa pela corda do tímpano (VII). Raiz: geral e gustativa pelo glossofaríngeo (IX). A região da epiglote é do vago.',
    clinica:
      'Essa dupla inervação, que parece arbitrária, é pura embriologia: os dois terços anteriores vêm do primeiro arco faríngeo e o terço posterior do terceiro. O forame cego, no vértice do V, é o ponto de origem da migração da tireoide — e é por isso que o cisto do ducto tireoglosso se move à deglutição e à protrusão da língua, sinal patognomônico que dispensa qualquer exame.',
    memoria:
      'Massa cervical mediana que sobe quando o paciente põe a língua para fora: cisto do ducto tireoglosso. A tireoide desceu por ali.',
    pontos: [
      'Como se divide a inervação da língua e por quê?',
      'O que é o forame cego da língua?',
      'Que sinal caracteriza o cisto do ducto tireoglosso?',
    ],
  },
]
