import type { Marcador } from '../tipos'

/**
 * Toxicologia e monitorização terapêutica.
 *
 * A segunda metade deste arquivo existe por uma razão específica, e vale
 * dizê-la com clareza: **não se trata de ensinar a ajustar a própria
 * medicação**. Trata-se de entender por que alguns fármacos exigem dosagem
 * sérica e a esmagadora maioria não. A resposta está em três propriedades que
 * se combinam: janela terapêutica estreita (a dose que trata e a que
 * intoxica são próximas), farmacocinética imprevisível entre pessoas, e
 * toxicidade que se manifesta tarde ou de forma inespecífica. Um fármaco com
 * essas três características não pode ser ajustado apenas pela clínica.
 *
 * A metade toxicológica compartilha um princípio com a anterior: a
 * concentração isolada quase nunca decide. O que decide é a concentração
 * **em relação ao tempo desde a exposição** — o nomograma do paracetamol é o
 * exemplo canônico, e um valor sem o horário da ingestão é um número sem
 * significado.
 */
export const marcadores: Marcador[] = [
  {
    id: 'chumbo',
    nome: 'Chumbo, mercúrio, arsênio, cádmio e alumínio',
    sigla: 'Metais pesados',
    sinonimos: ['chumbo', 'plumbemia', 'saturnismo', 'mercurio', 'arsenio', 'cadmio', 'aluminio', 'metais pesados'],
    grupo: 'toxicologia',
    sistemas: ['toxicologico', 'hematologico', 'neurologico', 'renal'],
    material: 'Sangue total com EDTA (chumbo, mercúrio) ou urina (arsênio, cádmio)',
    unidade: 'µg/dL e µg/L',
    referencias: [
      { rotulo: 'Chumbo — adultos, valor de referência', texto: '< 5', unidade: 'µg/dL', observacao: 'Não existe nível seguro de chumbo em crianças; qualquer valor detectável exige investigação da fonte.' },
      { rotulo: 'Chumbo — exposição ocupacional, limite de tolerância', texto: '< 40 (varia conforme a norma vigente)', unidade: 'µg/dL' },
      { rotulo: 'Mercúrio total no sangue', texto: '< 10', unidade: 'µg/L' },
      { rotulo: 'Arsênio urinário (formas inorgânicas)', texto: '< 35', unidade: 'µg/L', observacao: 'A ingestão de frutos do mar eleva o arsênio orgânico, não tóxico — exige restrição por 72 horas antes da coleta.' },
      { rotulo: 'Alumínio sérico em diálise', texto: '< 20', unidade: 'µg/L' },
    ],
    resumo:
      'Metais que se acumulam e lesam sistemas específicos. Cada um tem um alvo preferencial e um par bioquímico característico — e a maioria produz sintomas inespecíficos que só são explicados quando alguém pergunta sobre exposição.',
    entenda:
      'O chumbo é o mais relevante em saúde pública. Ele inibe duas enzimas da síntese do heme — a ALA-desidratase e a ferroquelatase —, produzindo anemia com pontilhado basófilo nas hemácias e elevação da protoporfirina-zinco. Compete com o cálcio em processos neuronais, causando déficit cognitivo irreversível em crianças. E se deposita no osso, de onde é remobilizado por décadas, inclusive durante a gestação e a lactação.',
    aprofundar: [
      'A anemia por chumbo tem uma assinatura reconhecível ao microscópio: pontilhado basófilo grosseiro nas hemácias, resultante da inibição da pirimidina-5’-nucleotidase, que impede a degradação do RNA ribossômico residual. Anemia microcítica com pontilhado basófilo e ferritina normal ou alta em criança ou em trabalhador exposto deve levar à dosagem de chumbo antes de qualquer reposição de ferro.',
      'Em crianças, o dano neurocognitivo ocorre em níveis muito abaixo dos que causam sintomas — e é irreversível. Por isso os órgãos de saúde abandonaram o conceito de "nível seguro": qualquer valor detectável justifica investigar a fonte, que costuma ser tinta antiga descascando, água conduzida por encanamento de chumbo, cerâmica esmaltada artesanal, atividade de reciclagem de baterias ou proximidade de fundições.',
      'O mercúrio tem duas formas com toxicidades distintas. O elementar e inorgânico, de exposição ocupacional, lesa preferencialmente o rim e causa tremor, gengivite e alterações comportamentais. O orgânico (metilmercúrio), adquirido pela ingestão de peixes predadores de topo de cadeia, é neurotóxico e atravessa a placenta — é a preocupação central na gestação, e a razão das recomendações sobre consumo de peixe.',
      'O arsênio exige uma restrição pré-analítica que invalida muitos exames: os frutos do mar contêm arsenobetaína, uma forma orgânica atóxica que eleva enormemente o arsênio urinário total. Sem 72 horas de restrição, ou sem especiação química que separe as formas inorgânicas, o resultado é ininterpretável. A intoxicação crônica produz lesões cutâneas características — hiperceratose palmoplantar e melanose em gotas de chuva — além de neuropatia e risco oncológico.',
      'O alumínio é quase exclusivamente um problema da doença renal crônica em diálise: sem excreção renal, ele se acumula e causa osteomalácia com dor óssea, anemia microcítica refratária e encefalopatia. A vigilância existe porque a fonte, historicamente, era a própria água do dialisato e os quelantes de fósforo à base de alumínio.',
    ],
    fisiologia: {
      oQueE: 'Metais sem função biológica que se ligam a grupamentos sulfidrila e competem com metais essenciais em sítios enzimáticos.',
      origem: 'Exposição ambiental, ocupacional ou alimentar.',
      funcao: 'Nenhuma — são xenobióticos cumulativos.',
      eliminacao: 'Renal e biliar, lenta; o chumbo se deposita no osso com meia-vida de décadas.',
      orgaosEnvolvidos: ['Sistema nervoso', 'Medula óssea', 'Rim', 'Osso'],
      percurso: [
        'Absorção respiratória ou digestiva',
        'ligação a grupamentos sulfidrila de enzimas',
        'inibição da síntese do heme e de vias neuronais',
        'deposição óssea e remobilização lenta',
        'excreção renal parcial',
      ],
    },
    aumento: {
      resumo: 'Exposição ambiental, ocupacional ou alimentar — e cada metal aponta para fontes e alvos específicos.',
      mecanismos: [
        {
          titulo: 'Inibição enzimática e competição com metais essenciais',
          explicacao: 'Ao se ligar a grupamentos sulfidrila, o metal inativa enzimas e desloca cálcio, zinco e ferro de seus sítios funcionais.',
          exemplos: [
            { causa: 'Saturnismo (intoxicação por chumbo)', etapas: ['inibição da ALA-desidratase e da ferroquelatase', 'anemia com pontilhado basófilo e protoporfirina-zinco ↑', 'neuropatia motora, dor abdominal em cólica, nefropatia', 'em crianças, déficit cognitivo irreversível'], nota: 'Anemia microcítica com ferritina normal e pontilhado basófilo pede plumbemia, não ferro.' },
            { causa: 'Intoxicação por metilmercúrio', etapas: ['ingestão de peixes predadores', 'acúmulo no sistema nervoso', 'parestesias, ataxia, constrição do campo visual', 'passagem placentária com neurotoxicidade fetal'] },
            { causa: 'Intoxicação crônica por arsênio', etapas: ['água contaminada ou exposição ocupacional', 'hiperceratose palmoplantar e melanose em gotas de chuva', 'neuropatia periférica sensitivo-motora', 'risco aumentado de câncer de pele, bexiga e pulmão'] },
            { causa: 'Acúmulo de alumínio na diálise', etapas: ['ausência de excreção renal', 'deposição óssea e cerebral', 'osteomalácia, anemia microcítica refratária e encefalopatia'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A pista hematológica', ids: ['protoporfirina-zinco', 'hemoglobina', 'vcm', 'ferritina', 'esfregaco'], leitura: 'Protoporfirina-zinco alta com ferritina normal e pontilhado basófilo no esfregaço é a assinatura do chumbo.' },
      { titulo: 'A repercussão renal', ids: ['creatinina', 'beta-2-microglobulina', 'acido-urico'], leitura: 'Metais pesados lesam o túbulo proximal — a beta-2-microglobulina urinária detecta essa lesão antes da creatinina se alterar.' },
    ],
    advertencia:
      'Não existe nível seguro de chumbo em crianças. A dosagem de arsênio exige restrição de frutos do mar por 72 horas ou especiação química — sem isso, o resultado não é interpretável.',
    interferentes: {
      preAnalitico: ['Tubos e agulhas devem ser certificados como livres de metais — a contaminação da coleta é uma causa real de falso-positivo.', 'Frutos do mar elevam o arsênio total sem toxicidade.'],
    },
    utilidade: ['diagnostico', 'triagem', 'acompanhamento'],
    estudarTambem: ['protoporfirina-zinco', 'hemoglobina', 'creatinina'],
  },

  {
    id: 'carboxihemoglobina',
    nome: 'Carboxi-hemoglobina e meta-hemoglobina',
    sigla: 'COHb / MetHb',
    sinonimos: ['carboxihemoglobina', 'cohb', 'monoxido de carbono', 'metahemoglobina', 'methb', 'metemoglobinemia', 'cianose'],
    grupo: 'toxicologia',
    sistemas: ['toxicologico', 'respiratorio', 'hematologico'],
    material: 'Sangue total (co-oximetria)',
    unidade: '%',
    referencias: [
      { rotulo: 'Carboxi-hemoglobina — não fumantes', texto: '< 3', unidade: '%' },
      { rotulo: 'Carboxi-hemoglobina — fumantes', texto: 'Até 10', unidade: '%' },
      { rotulo: 'Meta-hemoglobina', texto: '< 1,5', unidade: '%' },
      { rotulo: 'Meta-hemoglobina sintomática', texto: '> 15 — cianose; > 30 — sintomas graves', unidade: '%' },
    ],
    resumo:
      'Duas hemoglobinas disfuncionais que compartilham uma característica traiçoeira: a oximetria de pulso e a pO₂ arterial vêm normais, e só a co-oximetria revela o problema.',
    entenda:
      'A oximetria de pulso mede a absorção de luz em dois comprimentos de onda e assume que só existem oxi e desoxi-hemoglobina. A carboxi-hemoglobina absorve luz de forma semelhante à oxi-hemoglobina e é lida como saturação normal. A meta-hemoglobina absorve nos dois comprimentos igualmente e puxa a leitura para cerca de 85%, independentemente da gravidade. Em ambos os casos, a pO₂ arterial também é normal — porque o oxigênio **dissolvido** no plasma não foi afetado. O que mudou foi a capacidade de transporte, e só a co-oximetria a mede.',
    aprofundar: [
      'A intoxicação por monóxido de carbono é o "grande imitador": cefaleia, náusea, tontura e confusão são atribuídos a virose ou a intoxicação alimentar. A pista epidemiológica é o acometimento simultâneo de várias pessoas do mesmo domicílio, ou a melhora ao sair de casa. Aquecedores a gás mal ventilados, fogões, churrasqueiras em ambiente fechado e incêndios são as fontes. O tratamento é oxigênio a 100%, que reduz a meia-vida da carboxi-hemoglobina de cerca de 5 horas para 1 hora — e a oxigenoterapia hiperbárica em casos selecionados.',
      'A gravidade da intoxicação por monóxido de carbono não se correlaciona bem com o nível de carboxi-hemoglobina, especialmente se o paciente já recebeu oxigênio antes da coleta. Sintomas neurológicos e cardíacos, lactato e troponina pesam mais na decisão. Há ainda a síndrome neurológica tardia, que surge dias a semanas depois em uma parcela dos pacientes aparentemente recuperados.',
      'A meta-hemoglobinemia adquirida tem gatilhos identificáveis: dapsona, benzocaína e outros anestésicos tópicos, nitratos, nitritos, primaquina, sulfas e anilinas. Em lactentes, água de poço rica em nitratos é uma causa clássica. O quadro é cianose que não melhora com oxigênio, com sangue de coloração achocolatada e discrepância entre a saturação da oximetria e a gasometria — o chamado "gap de saturação".',
      'O tratamento com azul de metileno tem uma contraindicação que precisa ser lembrada: em pacientes com deficiência de G6PD, ele é ineficaz e pode precipitar hemólise, porque sua ação depende da NADPH gerada pela via das pentoses. Nesses casos, a alternativa é ácido ascórbico em dose alta, exsanguineotransfusão ou oxigenoterapia hiperbárica.',
    ],
    fisiologia: {
      oQueE: 'Carboxi-hemoglobina: hemoglobina ligada ao monóxido de carbono. Meta-hemoglobina: hemoglobina com ferro oxidado ao estado férrico.',
      origem: 'Exposição a monóxido de carbono ou a agentes oxidantes.',
      funcao: 'Nenhuma — são formas incapazes de transportar oxigênio.',
      meiaVida: 'Carboxi-hemoglobina: cerca de 5 horas em ar ambiente, 1 hora com oxigênio a 100%.',
      orgaosEnvolvidos: ['Hemácia', 'Sistema nervoso', 'Coração'],
      percurso: [
        'Monóxido de carbono liga-se à hemoglobina com afinidade 240 vezes maior que o oxigênio',
        'reduz a capacidade de transporte e desvia a curva de dissociação para a esquerda',
        'ou: agente oxidante converte o ferro ferroso em férrico',
        'meta-hemoglobina incapaz de ligar oxigênio',
        'hipóxia tecidual com pO₂ arterial normal',
      ],
    },
    aumento: {
      resumo: 'Exposição a monóxido de carbono ou a agentes oxidantes — com hipóxia tecidual apesar de oximetria e pO₂ normais.',
      mecanismos: [
        {
          titulo: 'Bloqueio do transporte de oxigênio',
          explicacao: 'O monóxido de carbono ocupa o sítio do oxigênio com afinidade muito maior e ainda desloca a curva de dissociação para a esquerda, dificultando a liberação do pouco oxigênio ligado.',
          exemplos: [
            { causa: 'Intoxicação por monóxido de carbono', etapas: ['aquecedor, fogão ou incêndio em ambiente fechado', 'carboxi-hemoglobina ↑', 'cefaleia, náusea, confusão, acidose láctica', 'oximetria de pulso e pO₂ falsamente normais'], nota: 'Vários moradores do mesmo domicílio com sintomas semelhantes é a pista epidemiológica.' },
          ],
        },
        {
          titulo: 'Oxidação do ferro do heme',
          explicacao: 'Agentes oxidantes convertem o ferro ferroso em férrico, que não liga oxigênio, e ainda aumentam a afinidade das subunidades restantes, agravando a hipóxia tecidual.',
          exemplos: [
            { causa: 'Meta-hemoglobinemia por dapsona, benzocaína, nitritos ou primaquina', etapas: ['oxidação do ferro do heme', 'cianose que não melhora com oxigênio', 'sangue achocolatado', 'gap entre saturação da oximetria e da gasometria'], nota: 'Cianose com pO₂ normal e sem cardiopatia é meta-hemoglobinemia até prova em contrário.' },
            { causa: 'Deficiência congênita de citocromo b5 redutase', etapas: ['incapacidade de reduzir a meta-hemoglobina formada fisiologicamente', 'cianose crônica bem tolerada desde a infância', 'ausência de dispneia proporcional'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A discrepância que denuncia', ids: ['pao2', 'lactato', 'ph'], leitura: 'pO₂ normal com acidose láctica e sintomas de hipóxia é o padrão dessas intoxicações — o oxigênio dissolvido está normal, o transportado não.' },
      { titulo: 'Antes de usar azul de metileno', ids: ['g6pd'], leitura: 'Em deficientes de G6PD, o azul de metileno é ineficaz e pode causar hemólise — a alternativa é ácido ascórbico ou exsanguineotransfusão.' },
    ],
    advertencia:
      'A oximetria de pulso não detecta nenhuma das duas condições. Diante de cianose ou de hipóxia com pO₂ normal, a co-oximetria é obrigatória.',
    utilidade: ['diagnostico'],
    estudarTambem: ['pao2', 'lactato', 'g6pd', 'hemoglobina'],
  },

  {
    id: 'monitorizacao-terapeutica',
    nome: 'Monitorização terapêutica de fármacos (digoxina, lítio, anticonvulsivantes, imunossupressores, vancomicina)',
    sigla: 'MTF',
    sinonimos: ['monitorizacao terapeutica', 'nivel serico de medicamento', 'digoxina', 'litio', 'valproato', 'carbamazepina', 'fenitoina', 'vancomicina', 'tacrolimo', 'ciclosporina', 'metotrexato'],
    grupo: 'farmacos',
    sistemas: ['toxicologico', 'metabolico'],
    material: 'Soro ou sangue total, colhido em horário definido em relação à dose',
    unidade: 'ng/mL, µg/mL, mEq/L',
    referencias: [
      { rotulo: 'Digoxina', texto: '0,5 a 0,9 ng/mL na insuficiência cardíaca (faixa mais baixa que a histórica)', unidade: 'ng/mL', observacao: 'Colher pelo menos 6 a 8 horas após a dose — antes disso a distribuição tecidual não terminou.' },
      { rotulo: 'Lítio', texto: '0,6 a 1,2 mEq/L, colhido 12 horas após a dose', unidade: 'mEq/L' },
      { rotulo: 'Fenitoína total', texto: '10 a 20 µg/mL — corrigir pela albumina quando baixa', unidade: 'µg/mL' },
      { rotulo: 'Vancomicina', texto: 'Alvo atual por área sob a curva (AUC/CIM 400–600); vale 10–20 µg/mL conforme o protocolo', unidade: 'µg/mL' },
      { rotulo: 'Tacrolimo', texto: 'Vale conforme o tempo pós-transplante e o protocolo do serviço', unidade: 'ng/mL' },
    ],
    resumo:
      'Alguns fármacos precisam ser dosados porque a dose não prediz a concentração e a concentração não prediz o efeito por igual em todos. Esta ficha explica **por quê** — não como ajustar dose, o que é decisão do prescritor.',
    entenda:
      'Três características, quando coexistem, tornam a dosagem necessária. Primeira: janela terapêutica estreita — a concentração que trata e a que intoxica estão próximas, como na digoxina e na fenitoína. Segunda: farmacocinética imprevisível — a mesma dose produz concentrações muito diferentes entre pessoas, por variação de metabolismo, função renal ou interações. Terceira: toxicidade tardia ou inespecífica — os sintomas da intoxicação se confundem com a doença tratada, como a náusea e a confusão da digoxina em um cardiopata idoso. A maioria dos medicamentos não tem essas três propriedades e por isso não se dosa.',
    aprofundar: [
      'O momento da coleta faz parte do exame e é o erro mais comum. A digoxina tem distribuição tecidual lenta: colhida duas horas após a dose, ela reflete a fase de distribuição e vem falsamente alta, levando a reduções de dose desnecessárias. A coleta correta é no vale, ao menos 6 a 8 horas depois. O lítio segue a mesma lógica, com coleta padronizada em 12 horas.',
      'A fenitoína ilustra outro princípio: ela circula ligada à albumina em cerca de 90%, e só a fração livre é ativa. Em hipoalbuminemia, uremia ou gestação, a fração livre aumenta enquanto o total permanece "normal" — o paciente pode estar intoxicado com um nível laboratorial dentro da faixa. Daí a necessidade de corrigir pela albumina ou, idealmente, de dosar a fração livre. Ela também tem cinética de saturação: acima de certa dose, pequenos incrementos produzem elevações desproporcionais da concentração.',
      'A intoxicação digitálica merece um parágrafo próprio porque é potencializada por distúrbios eletrolíticos. A hipocalemia aumenta a ligação da digoxina à bomba sódio-potássio e agrava a toxicidade mesmo com nível sérico dentro da faixa. Hipomagnesemia e hipercalcemia também agravam. Por isso a dosagem nunca se interpreta isolada do potássio — e por isso, na intoxicação, corrigir o potássio é parte do tratamento.',
      'Os imunossupressores de transplante — tacrolimo, ciclosporina, sirolimo — têm janela estreita nos dois sentidos: pouco significa rejeição, muito significa nefrotoxicidade e neurotoxicidade. E são substratos do CYP3A4, o que os torna vulneráveis a um número grande de interações: azólicos, macrolídeos e bloqueadores de canal de cálcio elevam os níveis; rifampicina e anticonvulsivantes os derrubam. Uma prescrição aparentemente banal pode custar um enxerto.',
      'A vancomicina passou por uma mudança conceitual relevante: o alvo deixou de ser o nível de vale isolado e passou a ser a área sob a curva em relação à concentração inibitória mínima, porque o vale isolado se correlacionava mal com eficácia e superestimava a exposição necessária, contribuindo para nefrotoxicidade. É um bom exemplo de como o parâmetro monitorado pode mudar sem que o fármaco mude.',
      'O metotrexato em altas doses é dosado por uma razão distinta das demais: não para ajustar a dose, mas para decidir por quanto tempo manter o resgate com ácido folínico. Níveis que não caem conforme o esperado indicam eliminação retardada e risco de mielotoxicidade e mucosite graves — e prolongam o resgate.',
    ],
    fisiologia: {
      oQueE: 'Dosagem da concentração sérica ou sanguínea de fármacos cuja resposta clínica não é previsível a partir da dose administrada.',
      origem: 'Fármaco administrado, distribuído e metabolizado conforme características individuais.',
      funcao: 'Permitir individualizar a exposição ao medicamento em vez de padronizar a dose.',
      orgaosEnvolvidos: ['Fígado', 'Rim', 'Tecidos-alvo'],
      percurso: [
        'Dose administrada',
        'absorção variável',
        'distribuição tecidual, com ligação proteica variável',
        'metabolismo hepático sujeito a interações',
        'eliminação renal ou biliar',
        'concentração final imprevisível a partir da dose',
      ],
    },
    aumento: {
      resumo: 'Acúmulo por queda de função renal ou hepática, interação medicamentosa, erro de dose ou coleta em horário inadequado.',
      significado:
        'Concentração acima da faixa não é sinônimo de intoxicação, e concentração dentro da faixa não a exclui — o quadro clínico e o contexto eletrolítico pesam tanto quanto o número.',
      mecanismos: [
        {
          titulo: 'Redução da eliminação',
          explicacao: 'A queda da função renal ou hepática prolonga a exposição, e o fármaco se acumula ao longo de várias meias-vidas.',
          exemplos: [
            { causa: 'Intoxicação digitálica na insuficiência renal', etapas: ['depuração renal da digoxina reduzida', 'acúmulo progressivo', 'náusea, alterações visuais cromáticas, arritmias', 'hipocalemia potencializa a toxicidade'], nota: 'Nunca interprete o nível sem o potássio: o paciente pode estar intoxicado dentro da faixa.' },
            { causa: 'Lítio em desidratação ou uso de diurético', etapas: ['reabsorção proximal de lítio aumentada junto com o sódio', 'nível sérico ↑', 'tremor grosseiro, ataxia, confusão, convulsões'], nota: 'Tiazídicos, inibidores da ECA e anti-inflamatórios elevam o lítio — combinação frequente e perigosa.' },
          ],
        },
        {
          titulo: 'Interação farmacológica',
          explicacao: 'A inibição de enzimas do citocromo P450 ou de transportadores eleva rapidamente a concentração de fármacos com metabolismo dependente delas.',
          exemplos: [
            { causa: 'Imunossupressor com azólico ou macrolídeo', etapas: ['inibição do CYP3A4', 'tacrolimo ou ciclosporina ↑↑ em poucos dias', 'nefrotoxicidade e neurotoxicidade'], nota: 'Prescrever fluconazol a um transplantado sem ajustar e monitorar é um erro com consequência renal real.' },
            { causa: 'Anticonvulsivante com indutor enzimático', etapas: ['rifampicina ou carbamazepina induzem o metabolismo', 'concentração ↓', 'perda de controle das crises ou rejeição do enxerto'] },
          ],
        },
        {
          titulo: 'Erro de coleta',
          explicacao: 'O valor só é interpretável quando colhido no momento previsto pelo protocolo do fármaco.',
          exemplos: [
            { causa: 'Digoxina colhida 2 horas após a dose', etapas: ['fase de distribuição ainda em curso', 'nível falsamente elevado', 'redução de dose indevida'], nota: 'Colher no vale, 6 a 8 horas depois — ou o exame informa o oposto do que deveria.' },
            { causa: 'Coleta do cateter por onde o fármaco foi infundido', etapas: ['contaminação da amostra', 'nível absurdamente alto', 'suspensão indevida do tratamento'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Subdose, não adesão, má absorção ou indução do metabolismo — e a não adesão é, de longe, a causa mais comum.',
      mecanismos: [
        {
          titulo: 'Exposição insuficiente',
          explicacao: 'Doses omitidas, absorção comprometida ou metabolismo acelerado reduzem a concentração abaixo do necessário.',
          exemplos: [
            { causa: 'Não adesão ao tratamento', etapas: ['doses omitidas', 'nível subterapêutico', 'perda de controle da doença'], nota: 'É a primeira hipótese diante de nível baixo — antes de aumentar a dose, converse sobre adesão.' },
            { causa: 'Indução enzimática', etapas: ['rifampicina, fenitoína, carbamazepina ou erva-de-são-joão', 'metabolismo acelerado', 'nível ↓ com a mesma dose'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O contexto que muda a interpretação', ids: ['creatinina', 'tfg-estimada', 'albumina', 'potassio', 'magnesio'], leitura: 'Função renal explica acúmulo; albumina baixa aumenta a fração livre; potássio e magnésio baixos potencializam a toxicidade digitálica.' },
      { titulo: 'A toxicidade que se monitora junto', ids: ['alt', 'plaquetas', 'leucocitos', 'tsh'], leitura: 'Valproato e carbamazepina exigem vigilância hepática e hematológica; o lítio exige TSH e função renal periódicos.' },
    ],
    advertencia:
      'Este conteúdo é educativo e não orienta automedicação nem ajuste de dose por conta própria. Qualquer alteração de esquema terapêutico é decisão do médico prescritor, com o paciente. Um nível dentro da faixa não exclui intoxicação, e um nível acima dela não a confirma isoladamente.',
    interferentes: {
      preAnalitico: ['Coleta fora do horário previsto em relação à dose é o erro mais frequente.', 'Coleta pelo mesmo acesso da infusão contamina a amostra.'],
      medicamentos: ['Inibidores e indutores do CYP3A4 e do CYP2C9 alteram profundamente as concentrações.'],
      metodo: ['Anticorpos antidigoxina usados no tratamento da intoxicação interferem no imunoensaio e tornam a dosagem subsequente ininterpretável.'],
    },
    utilidade: ['acompanhamento'],
    estudarTambem: ['creatinina', 'albumina', 'potassio', 'tfg-estimada'],
  },
]
