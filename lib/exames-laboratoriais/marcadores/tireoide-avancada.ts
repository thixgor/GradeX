import type { Marcador } from '../tipos'

/**
 * Tireoide — o painel completo, e por que quase nunca se pede o painel
 * completo.
 *
 * O TSH resolve a esmagadora maioria das perguntas tireoidianas, e essa é a
 * primeira lição: pedir "perfil tireoidiano" com sete exames em quem tem
 * apenas cansaço é gerar achados que precisarão ser explicados. A lógica do
 * eixo justifica isso — a hipófise "lê" o hormônio tireoidiano com uma
 * sensibilidade logarítmica, de modo que uma variação pequena de T4 livre
 * produz uma variação grande de TSH. O TSH é, portanto, o amplificador
 * biológico da função tireoidiana.
 *
 * Os exames deste arquivo entram quando o TSH sozinho não basta: quando ele é
 * discordante do quadro clínico, quando o problema pode ser central, quando é
 * preciso saber a **causa** e não apenas a função, e quando o paciente está
 * gravemente doente — situação em que o eixo inteiro se comporta de forma
 * enganosa.
 */
export const marcadores: Marcador[] = [
  {
    id: 't4-total',
    nome: 'T4 total e T3 total',
    sigla: 'T4T / T3T',
    sinonimos: ['t4 total', 't3 total', 'tiroxina total', 'triiodotironina total'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'metabolico'],
    material: 'Soro',
    unidade: 'µg/dL e ng/dL',
    referencias: [
      { rotulo: 'T4 total — adultos', minimo: 4.5, maximo: 12.0, unidade: 'µg/dL' },
      { rotulo: 'T3 total — adultos', minimo: 80, maximo: 200, unidade: 'ng/dL' },
      { rotulo: 'Gestação', texto: 'T4 e T3 totais elevados fisiologicamente por aumento da TBG', unidade: '' },
    ],
    resumo:
      'Medem a soma do hormônio livre com o ligado às proteínas transportadoras. Como mais de 99% está ligado, o valor total reflete sobretudo a quantidade de proteína — não a função da tireoide.',
    entenda:
      'Essa dependência das proteínas transportadoras é a razão de o T4 total ter sido substituído pelo T4 livre na prática. Uma gestante, uma mulher em uso de contraceptivo e um paciente com hepatite têm TBG elevada e, portanto, T4 total alto — com função tireoidiana perfeitamente normal. Já um paciente com síndrome nefrótica ou cirrose tem TBG baixa e T4 total baixo, também sem doença tireoidiana. O hormônio livre, que é o biologicamente ativo, está normal nos quatro.',
    aprofundar: [
      'O T3 total mantém um uso específico e importante: a tireotoxicose por T3, em que o T4 livre está normal e apenas o T3 está elevado. Ocorre em cerca de 5% dos hipertireoidismos, sobretudo em adenoma tóxico e em fases iniciais da doença de Graves, e passaria despercebida se apenas o T4 livre fosse dosado num paciente com TSH suprimido. TSH suprimido com T4 livre normal exige dosar T3 antes de concluir por hipertireoidismo subclínico.',
      'Na direção oposta, o T3 é o exame mais inútil para diagnosticar hipotireoidismo. A conversão periférica de T4 em T3 é preservada até fases avançadas, e o T3 é frequentemente o último a cair — pedir T3 para investigar hipotireoidismo produz um resultado normal que atrasa o diagnóstico.',
      'Na síndrome do doente eutireoidiano, o T3 total é o primeiro a cair, por redução da deiodinase tipo 1 e desvio da conversão para T3 reverso. Um T3 baixo em paciente internado grave é o achado mais comum de todo o painel tireoidiano — e não indica hipotireoidismo nem exige reposição.',
    ],
    fisiologia: {
      oQueE: 'Concentração total de tiroxina e triiodotironina, somando as frações livre e ligada a proteínas.',
      origem: 'Tireoide (todo o T4 e cerca de 20% do T3); o restante do T3 vem da conversão periférica.',
      circulacao: 'Mais de 99% ligado à TBG, à transtirretina e à albumina.',
      funcao: 'Regular a taxa metabólica basal, o desenvolvimento neurológico e a sensibilidade adrenérgica.',
      meiaVida: 'T4: cerca de 7 dias. T3: cerca de 1 dia.',
      orgaosEnvolvidos: ['Tireoide', 'Fígado', 'Rim', 'Hipófise'],
      percurso: [
        'Tireoide secreta predominantemente T4',
        'T4 liga-se à TBG no plasma',
        'deiodinases teciduais convertem T4 em T3 ativo',
        'T3 atua no receptor nuclear',
        'retroalimentação sobre hipófise e hipotálamo',
      ],
    },
    aumento: {
      resumo: 'Hipertireoidismo verdadeiro — ou, muito mais frequentemente, aumento da proteína transportadora.',
      mecanismos: [
        {
          titulo: 'Aumento da proteína transportadora',
          explicacao: 'Mais TBG significa mais hormônio ligado e, portanto, mais hormônio total, sem que a fração livre se altere.',
          exemplos: [
            { causa: 'Gestação, estrogênio, contraceptivo oral, hepatite aguda', etapas: ['síntese hepática de TBG ↑', 'T4 e T3 totais ↑', 'T4 livre e TSH normais', 'sem doença tireoidiana'], nota: 'É a razão de o T4 total ter sido abandonado como exame de triagem.' },
          ],
        },
        {
          titulo: 'Produção hormonal aumentada',
          explicacao: 'A tireoide hiperfuncionante ou a ingestão exógena elevam as frações livre e total simultaneamente.',
          exemplos: [
            { causa: 'Doença de Graves e bócio multinodular tóxico', etapas: ['produção autônoma ou estimulada por TRAb', 'T4 e T3 totais e livres ↑', 'TSH suprimido'] },
            { causa: 'Tireotoxicose por T3', etapas: ['TSH suprimido', 'T4 livre normal', 'T3 total elevado isoladamente'], nota: 'Ocorre em cerca de 5% dos casos e só é encontrada se o T3 for dosado.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hipotireoidismo — ou redução da proteína transportadora, ou doença sistêmica grave.',
      mecanismos: [
        {
          titulo: 'Redução da proteína transportadora ou da ligação',
          explicacao: 'Perda proteica, falência de síntese ou deslocamento farmacológico reduzem o total sem alterar o livre.',
          exemplos: [
            { causa: 'Síndrome nefrótica, cirrose, desnutrição, androgênios', etapas: ['TBG ↓', 'T4 total ↓ com T4 livre normal', 'TSH normal'] },
            { causa: 'Fenitoína, carbamazepina, salicilato em dose alta, furosemida endovenosa', etapas: ['deslocamento do hormônio dos sítios de ligação', 'T4 total ↓ com fração livre transitoriamente ↑', 'interpretação confusa se apenas o total for dosado'] },
          ],
        },
        {
          titulo: 'Produção reduzida ou desvio metabólico',
          explicacao: 'A falência glandular reduz as duas frações; a doença grave desvia a conversão periférica.',
          exemplos: [
            { causa: 'Hipotireoidismo primário', etapas: ['destruição ou falência da glândula', 'T4 total e livre ↓', 'TSH ↑↑'] },
            { causa: 'Síndrome do doente eutireoidiano', etapas: ['doença sistêmica grave', 'deiodinase tipo 1 inibida', 'T3 total ↓ e T3 reverso ↑', 'TSH normal ou baixo'], nota: 'T3 baixo é o achado mais precoce e mais frequente em paciente internado grave.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O exame que substituiu este', ids: ['t4-livre', 'tsh'], leitura: 'O T4 livre não depende das proteínas transportadoras e é o exame de escolha. O T4 total só mantém interesse quando há dúvida sobre interferência de método no livre.' },
      { titulo: 'Quando o TSH está suprimido e o T4 livre normal', ids: ['t3'], leitura: 'Dose T3 antes de concluir por hipertireoidismo subclínico — a tireotoxicose por T3 é a exceção que muda a conduta.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['t4-livre', 'tsh', 't3', 'tbg'],
  },

  {
    id: 't3-reverso',
    nome: 'T3 reverso e a síndrome do doente eutireoidiano',
    sigla: 'rT3',
    sinonimos: ['t3 reverso', 'rt3', 'triiodotironina reversa', 'sindrome do doente eutireoidiano', 'euthyroid sick'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'metabolico'],
    material: 'Soro',
    unidade: 'ng/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 10, maximo: 24, unidade: 'ng/dL' }],
    resumo:
      'O produto inativo da desiodação do T4. Sobe quando o organismo decide desacelerar o metabolismo — e é a assinatura bioquímica da síndrome do doente eutireoidiano.',
    entenda:
      'O T4 pode ser desiodado em duas posições. Retirando o iodo do anel externo, forma-se T3, ativo. Retirando do anel interno, forma-se T3 reverso, biologicamente inerte. Em doenças graves, jejum prolongado e estresse metabólico, a via se desloca para o T3 reverso: menos hormônio ativo, mais hormônio inerte. É provavelmente uma adaptação para poupar energia e proteína — e não uma falha a ser corrigida.',
    aprofundar: [
      'A implicação clínica é direta e importante: **não se repõe hormônio tireoidiano na síndrome do doente eutireoidiano**. Ensaios que tentaram fazê-lo não demonstraram benefício, e há razões fisiológicas para suspeitar de dano — a redução do metabolismo pode ser protetora no paciente crítico. O papel do laboratório aqui é reconhecer o padrão e evitar a intervenção.',
      'O padrão evolui em fases reconhecíveis. Primeiro cai o T3 total com T4 e TSH normais. Depois, na doença mais grave, o T4 total também cai, e o TSH pode ficar baixo — imitando hipotireoidismo central. Na recuperação, o TSH sobe transitoriamente acima do normal antes de voltar ao basal, o que pode ser confundido com hipotireoidismo primário se dosado no momento errado.',
      'A regra prática que evita a maioria dos erros: **não peça exames tireoidianos em paciente internado grave, a menos que haja suspeita clínica forte de doença tireoidiana**. Se for imprescindível, o TSH acompanhado de T4 livre é o par mínimo, e a interpretação deve ser adiada para a convalescença. O T3 reverso ajuda a diferenciar — alto na síndrome do doente eutireoidiano, baixo ou normal no hipotireoidismo verdadeiro —, mas sua disponibilidade é limitada e o contexto clínico geralmente basta.',
      'Fora do paciente crítico, o T3 reverso é frequentemente vendido como marcador de "hipotireoidismo celular" ou de fadiga, o que não tem sustentação. Não há indicação estabelecida para dosá-lo em paciente ambulatorial com sintomas inespecíficos e TSH normal.',
    ],
    fisiologia: {
      oQueE: 'Isômero inativo da triiodotironina, formado pela desiodação do anel interno do T4.',
      origem: 'Tecidos periféricos, principalmente fígado e rim, pela deiodinase tipo 3.',
      funcao: 'Nenhuma atividade hormonal — representa uma via de inativação do T4.',
      metabolismo: 'Degradado por desiodação subsequente.',
      orgaosEnvolvidos: ['Fígado', 'Rim', 'Músculo'],
      percurso: [
        'T4 secretado pela tireoide',
        'deiodinase tipo 1 e 2 formam T3 ativo (anel externo)',
        'deiodinase tipo 3 forma T3 reverso (anel interno)',
        'em doença grave, a via se desloca para o T3 reverso',
        'menos hormônio ativo com T4 e TSH inicialmente normais',
      ],
    },
    aumento: {
      resumo: 'Doença sistêmica grave, jejum prolongado, corticoide, amiodarona, propranolol e contrastes iodados.',
      mecanismos: [
        {
          titulo: 'Desvio da desiodação para a via inativa',
          explicacao: 'A inibição da deiodinase tipo 1 e o aumento da tipo 3 deslocam o metabolismo do T4 da produção de hormônio ativo para a de hormônio inerte.',
          exemplos: [
            { causa: 'Sepse, infarto, cirurgia de grande porte, queimadura', etapas: ['citocinas inflamatórias inibem a deiodinase tipo 1', 'T3 ↓ e T3 reverso ↑', 'TSH normal ou baixo', 'sem indicação de reposição hormonal'], nota: 'Reconhecer o padrão evita uma intervenção que não beneficia e pode prejudicar.' },
            { causa: 'Jejum prolongado e desnutrição', etapas: ['adaptação metabólica para poupar energia', 'conversão desviada para T3 reverso', 'redução da taxa metabólica basal'] },
            { causa: 'Amiodarona, corticoide em dose alta, propranolol, contraste iodado', etapas: ['inibição farmacológica da deiodinase tipo 1', 'T3 ↓ e T3 reverso ↑', 'alteração que persiste enquanto durar a exposição'], nota: 'A amiodarona é o caso mais complexo: pode causar tanto hipotireoidismo quanto tireotoxicose, além desse efeito sobre a conversão.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel do paciente crítico', ids: ['tsh', 't4-livre', 't3'], leitura: 'T3 baixo com T3 reverso alto e TSH normal define a síndrome do doente eutireoidiano. Se o TSH estivesse muito elevado, seria hipotireoidismo verdadeiro.' },
    ],
    advertencia:
      'Não há indicação de reposição de hormônio tireoidiano na síndrome do doente eutireoidiano. Evite solicitar exames tireoidianos em paciente internado grave sem suspeita clínica específica.',
    utilidade: ['diagnostico'],
    estudarTambem: ['tsh', 't4-livre', 't3'],
  },

  {
    id: 'tbg',
    nome: 'Globulina ligadora de tiroxina',
    sigla: 'TBG',
    sinonimos: ['tbg', 'globulina ligadora de tiroxina', 'proteina ligadora de hormonio tireoidiano', 't3 uptake'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'µg/mL',
    referencias: [{ rotulo: 'Adultos', minimo: 12, maximo: 30, unidade: 'µg/mL' }],
    resumo:
      'A proteína que carrega a maior parte do hormônio tireoidiano. Sua dosagem serve para explicar discordâncias entre hormônio total e livre — não para avaliar função tireoidiana.',
    entenda:
      'A TBG transporta cerca de 70% do T4 circulante. Como só a fração livre é ativa, variações da TBG mudam o hormônio total sem mudar a função. O organismo compensa rapidamente: mais TBG captura mais hormônio livre, o TSH sobe momentaneamente, a tireoide produz mais, e o novo equilíbrio tem mais hormônio total e a mesma fração livre. A pessoa permanece eutireoidiana o tempo todo.',
    aprofundar: [
      'Quando pedir: diante de um T4 total muito discordante do T4 livre e do TSH, ou de uma família com valores tireoidianos anômalos e ausência de sintomas. O excesso hereditário de TBG, ligado ao X, produz T4 total elevado por gerações sem qualquer doença — e já levou muitos pacientes a tratamentos desnecessários.',
      'A gestação é o cenário fisiológico mais importante. O estrogênio aumenta a síntese hepática de TBG e reduz sua depuração pela sialilação, elevando substancialmente o T4 total. Além disso, o hCG do primeiro trimestre tem atividade tireotrófica fraca, estimulando a tireoide e suprimindo parcialmente o TSH. Por isso as faixas de referência do TSH na gestação são específicas por trimestre, e usar a faixa do adulto não gestante gera diagnósticos equivocados nos dois sentidos.',
      'A disalbuminemia familiar hiperiroxinêmica é uma variante relacionada e curiosa: uma albumina anômala com afinidade aumentada pelo T4 eleva o T4 total e pode interferir em alguns ensaios de T4 livre, produzindo resultados falsamente altos. Paciente assintomático com T4 livre alto e TSH normal deve levantar a suspeita de interferência de método antes de qualquer diagnóstico.',
    ],
    fisiologia: {
      oQueE: 'Glicoproteína hepática que liga com alta afinidade tiroxina e triiodotironina.',
      origem: 'Hepatócito.',
      funcao: 'Reservatório circulante de hormônio tireoidiano, tamponando variações agudas da secreção.',
      orgaosEnvolvidos: ['Fígado', 'Tireoide'],
      percurso: [
        'Síntese hepática, aumentada pelo estrogênio',
        'ligação de T4 e T3 no plasma',
        'apenas a fração livre atravessa a membrana celular',
        'variações de TBG alteram o total e não o livre',
      ],
    },
    aumento: {
      resumo: 'Estrogênio, gestação, hepatite aguda, porfiria e excesso hereditário — todos com função tireoidiana normal.',
      mecanismos: [
        {
          titulo: 'Aumento da síntese ou redução da depuração',
          explicacao: 'O estrogênio aumenta a produção hepática e a sialilação da molécula, prolongando sua meia-vida.',
          exemplos: [
            { causa: 'Gestação e uso de estrogênio', etapas: ['síntese hepática ↑ e depuração ↓', 'T4 total ↑ com T4 livre normal', 'TSH com faixa de referência própria por trimestre'], nota: 'Aplicar a faixa do não gestante produz diagnósticos errados nos dois sentidos.' },
            { causa: 'Excesso hereditário de TBG', etapas: ['herança ligada ao X', 'T4 total elevado em várias gerações', 'ausência total de sintomas', 'T4 livre e TSH normais'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Perda proteica, falência hepática, androgênios, corticoide e deficiência hereditária.',
      mecanismos: [
        {
          titulo: 'Perda ou síntese reduzida',
          explicacao: 'Sendo proteína hepática de peso intermediário, é perdida na urina e no intestino e falta na insuficiência hepática.',
          exemplos: [
            { causa: 'Síndrome nefrótica e enteropatia perdedora de proteína', etapas: ['perda proteica', 'TBG ↓', 'T4 total ↓ com livre normal'] },
            { causa: 'Androgênios, glicocorticoides em dose alta, cirrose', etapas: ['síntese hepática reduzida', 'TBG ↓', 'T4 total ↓ sem hipotireoidismo'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A discordância que este exame explica', ids: ['t4-total', 't4-livre', 'tsh'], leitura: 'T4 total alterado com T4 livre e TSH normais é praticamente sempre variação de proteína transportadora.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['t4-total', 't4-livre', 'tsh'],
  },

  {
    id: 'anti-tpo',
    nome: 'Anticorpo antiperoxidase tireoidiana',
    sigla: 'Anti-TPO',
    sinonimos: ['anti tpo', 'antiperoxidase', 'anti microssomal', 'atpo', 'anticorpo antitireoidiano'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'imunologico'],
    material: 'Soro',
    unidade: 'UI/mL',
    referencias: [{ rotulo: 'Adultos', texto: '< 35 (varia conforme o método)', unidade: 'UI/mL' }],
    resumo:
      'O marcador da tireoidite autoimune. Presente na maioria dos casos de Hashimoto — e também em cerca de 10% da população saudável, o que exige cautela ao interpretá-lo isoladamente.',
    entenda:
      'A peroxidase tireoidiana é a enzima que oxida o iodeto e o incorpora à tireoglobulina. Anticorpos contra ela acompanham — e provavelmente participam de — a destruição autoimune progressiva do parênquima. Sua presença explica a etiologia de um hipotireoidismo, mas não a sua gravidade: o TSH e o T4 livre é que dizem o quanto a função está comprometida.',
    aprofundar: [
      'O valor prognóstico é a informação mais útil deste exame. Em pacientes com hipotireoidismo subclínico — TSH elevado com T4 livre normal —, a presença de anti-TPO aumenta significativamente a taxa anual de progressão para hipotireoidismo franco. Isso muda a decisão de tratar ou observar, e a frequência do seguimento.',
      'Na gestação, o anti-TPO tem duas consequências práticas. Primeira: gestantes anti-TPO positivas com TSH normal têm maior risco de desenvolver hipotireoidismo ao longo da gestação, e devem ser monitoradas em cada trimestre. Segunda: são as que desenvolvem tireoidite pós-parto, um quadro bifásico — tireotoxicose transitória entre o segundo e o quarto mês, seguida de hipotireoidismo — frequentemente confundido com depressão pós-parto ou com doença de Graves. A distinção com Graves importa e é feita pelo TRAb e pela captação, não pelos hormônios.',
      'A positividade em pessoas assintomáticas com TSH normal é comum, especialmente em mulheres e com o avançar da idade. Nesse contexto, não é doença e não exige tratamento — apenas justifica dosar TSH periodicamente. Rastrear anti-TPO em população geral não tem indicação.',
      'O anti-TPO acompanha frequentemente outras doenças autoimunes — vitiligo, diabetes tipo 1, doença celíaca, anemia perniciosa, insuficiência adrenal. Sua detecção em um paciente com uma dessas condições é esperada, e a recíproca vale: tireoidite autoimune deve fazer perguntar sobre as demais.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpo dirigido à peroxidase tireoidiana, enzima da membrana apical do tireócito.',
      origem: 'Resposta autoimune com infiltração linfocitária da glândula.',
      funcao: 'Marcador de autoimunidade tireoidiana; contribui para a citotoxicidade dependente de anticorpo.',
      orgaosEnvolvidos: ['Tireoide'],
      percurso: [
        'Perda de tolerância a antígenos tireoidianos',
        'infiltração linfocitária da glândula',
        'produção de anti-TPO e antitireoglobulina',
        'destruição progressiva do parênquima',
        'hipotireoidismo ao longo de anos',
      ],
    },
    aumento: {
      resumo: 'Tireoidite autoimune — de Hashimoto, pós-parto ou associada a outras doenças autoimunes; também presente na doença de Graves.',
      mecanismos: [
        {
          titulo: 'Autoimunidade tireoidiana',
          explicacao: 'A resposta imune contra antígenos do tireócito produz anticorpos detectáveis e infiltrado linfocitário destrutivo.',
          exemplos: [
            { causa: 'Tireoidite de Hashimoto', etapas: ['infiltração linfocitária crônica', 'anti-TPO ↑↑', 'destruição progressiva do parênquima', 'TSH ↑ e depois T4 livre ↓'], nota: 'Explica a causa; a gravidade é dada pelo TSH e pelo T4 livre.' },
            { causa: 'Tireoidite pós-parto', etapas: ['anti-TPO positivo na gestação', 'reconstituição imune no puerpério', 'fase tireotóxica transitória por destruição folicular', 'fase hipotireoidiana e recuperação na maioria'], nota: 'Diferenciar de Graves muda o tratamento: aqui não há hiperprodução, e antitireoidiano é inútil.' },
            { causa: 'Doença de Graves', etapas: ['anti-TPO positivo em grande parte dos casos', 'coexistência com TRAb', 'o TRAb é quem define o diagnóstico'] },
            { causa: 'Positividade em pessoa saudável', etapas: ['anti-TPO detectável com TSH normal', 'presente em cerca de 10% da população', 'sem doença — apenas seguimento periódico do TSH'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A função, que este exame não mede', ids: ['tsh', 't4-livre'], leitura: 'O anti-TPO diz a causa; o TSH e o T4 livre dizem a gravidade e definem se há indicação de tratamento.' },
      { titulo: 'Quando há tireotoxicose', ids: ['trab'], leitura: 'O TRAb é quem separa doença de Graves de tireoidite destrutiva — e a conduta é oposta.' },
    ],
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['tsh', 't4-livre', 'trab', 'tireoglobulina'],
  },

  {
    id: 'trab',
    nome: 'Anticorpo antirreceptor de TSH (TRAb / TSI)',
    sigla: 'TRAb',
    sinonimos: ['trab', 'tsi', 'anticorpo antirreceptor de tsh', 'imunoglobulina tireoestimulante', 'trab graves'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'imunologico'],
    material: 'Soro',
    unidade: 'UI/L ou % de atividade',
    referencias: [
      { rotulo: 'TRAb', texto: '< 1,75', unidade: 'UI/L' },
      { rotulo: 'TSI (bioensaio)', texto: 'Não estimulante', unidade: '%' },
    ],
    resumo:
      'O anticorpo que causa a doença de Graves ao estimular o receptor de TSH. É o exame que separa hipertireoidismo por hiperprodução de tireotoxicose por destruição — distinção que decide todo o tratamento.',
    entenda:
      'O TRAb se liga ao receptor de TSH e o ativa, fazendo a tireoide produzir hormônio sem qualquer comando hipofisário. Isso é conceitualmente diferente da tireoidite subaguda ou pós-parto, em que a glândula não produz mais — apenas libera o hormônio pré-formado ao ser destruída. Nas duas situações o paciente está tireotóxico e o TSH está suprimido, mas na primeira o antitireoidiano funciona e na segunda ele é inteiramente inútil.',
    aprofundar: [
      'Na gestação, o TRAb ganha uma dimensão que nenhum outro anticorpo tireoidiano tem: sendo IgG, ele atravessa a placenta e pode estimular a tireoide fetal, causando tireotoxicose fetal e neonatal. Por isso a dosagem é obrigatória no segundo e terceiro trimestres em gestantes com Graves atual ou passado — inclusive naquelas já tratadas com iodo radioativo ou tireoidectomia, que estão eutireoidianas ou hipotireoidianas mas podem manter títulos altos. A mãe curada pode gerar um feto tireotóxico.',
      'O TRAb também tem valor prognóstico no tratamento com antitireoidianos: títulos que permanecem altos ao fim de 12 a 18 meses de tratamento predizem recidiva após a suspensão, o que orienta a escolha entre manter o fármaco ou indicar terapia definitiva.',
      'Na orbitopatia de Graves, o TRAb se correlaciona com a atividade e a gravidade do acometimento ocular — os fibroblastos orbitários expressam receptor de TSH, o que explica por que um anticorpo tireoidiano produz doença ocular. Isso também explica por que a orbitopatia pode surgir ou piorar em paciente já eutireoidiano: o alvo não é apenas a tireoide.',
      'Um ponto técnico: os ensaios de terceira geração medem a ligação ao receptor (TRAb) e não distinguem anticorpos estimulantes de bloqueadores. Raramente, anticorpos bloqueadores causam hipotireoidismo. O bioensaio de TSI mede especificamente a estimulação e resolve a dúvida nos casos discordantes.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos dirigidos ao receptor de TSH, com atividade estimulante, bloqueadora ou neutra.',
      origem: 'Linfócitos B autorreativos, com produção também intratireoidiana.',
      funcao: 'Ativar o receptor de TSH de forma independente do hormônio hipofisário.',
      orgaosEnvolvidos: ['Tireoide', 'Órbita', 'Pele pré-tibial'],
      percurso: [
        'Perda de tolerância ao receptor de TSH',
        'anticorpo estimulante liga-se ao receptor',
        'ativação contínua de adenilato ciclase',
        'produção hormonal autônoma com TSH suprimido',
        'estímulo também de fibroblastos orbitários',
      ],
    },
    aumento: {
      resumo: 'Doença de Graves — e, raramente, hipotireoidismo por anticorpo bloqueador.',
      significado: 'TRAb positivo em paciente tireotóxico confirma hiperprodução e indica antitireoidiano; TRAb negativo em tireotoxicose sugere destruição glandular, em que o antitireoidiano não tem papel.',
      mecanismos: [
        {
          titulo: 'Estimulação autônoma do receptor',
          explicacao: 'O anticorpo mimetiza o TSH e ativa o receptor continuamente, escapando de toda retroalimentação.',
          exemplos: [
            { causa: 'Doença de Graves', etapas: ['TRAb estimulante ↑', 'produção hormonal autônoma', 'TSH suprimido com T4 e T3 elevados', 'bócio difuso, orbitopatia e, ocasionalmente, dermopatia'] },
            { causa: 'Gestante com Graves atual ou prévio', etapas: ['TRAb atravessa a placenta', 'estímulo da tireoide fetal', 'taquicardia fetal, bócio e restrição de crescimento', 'necessidade de vigilância fetal específica'], nota: 'Dosagem obrigatória mesmo em mãe já tratada e eutireoidiana.' },
            { causa: 'Tireoidite subaguda ou pós-parto', etapas: ['tireotoxicose por liberação de hormônio pré-formado', 'TRAb negativo', 'captação de iodo baixa', 'tratamento sintomático apenas'], nota: 'É a distinção prática mais importante deste exame.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A distinção que muda o tratamento', ids: ['tsh', 't4-livre', 't3', 'anti-tpo'], leitura: 'Tireotoxicose com TRAb positivo é hiperprodução; com TRAb negativo, pense em destruição glandular ou tireotoxicose factícia.' },
      { titulo: 'Quando a suspeita é hormônio exógeno', ids: ['tireoglobulina'], leitura: 'Na tireotoxicose factícia, a tireoglobulina está baixa — a glândula está suprimida, não produzindo.' },
    ],
    advertencia:
      'Dosagem obrigatória em gestantes com doença de Graves atual ou pregressa, mesmo que eutireoidianas após tratamento definitivo: o anticorpo atravessa a placenta e pode causar tireotoxicose fetal.',
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['tsh', 't4-livre', 'anti-tpo', 'tireoglobulina'],
  },
]
