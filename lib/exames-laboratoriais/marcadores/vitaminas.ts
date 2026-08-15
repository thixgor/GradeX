import type { Marcador } from '../tipos'

/**
 * Vitaminas e micronutrientes — e a diferença entre estoque e função.
 *
 * A dosagem sérica de uma vitamina mede o que está circulando, não o que está
 * disponível dentro da célula. Essa distinção não é acadêmica: a vitamina B12
 * é o exemplo canônico, com valores "normais" em pacientes que já têm
 * deficiência funcional e lesão neurológica em curso. Os marcadores
 * funcionais — homocisteína e ácido metilmalônico — medem se a via
 * bioquímica dependente daquela vitamina está de fato funcionando, e é por
 * isso que existem.
 *
 * O outro tema é a inflamação. Zinco, selênio, ferro e vitamina C caem na fase
 * aguda por redistribuição, e não por carência. Dosá-los em paciente
 * internado grave produz um retrato do estado inflamatório, não do estado
 * nutricional — e a reposição baseada nesses valores raramente é a conduta
 * correta.
 */
export const marcadores: Marcador[] = [
  {
    id: 'homocisteina',
    nome: 'Homocisteína e ácido metilmalônico',
    sigla: 'Hcy / AMM',
    sinonimos: ['homocisteina', 'hcy', 'acido metilmalonico', 'amm', 'mma', 'marcadores funcionais de b12'],
    grupo: 'vitaminas',
    sistemas: ['metabolico', 'hematologico', 'neurologico', 'cardiovascular'],
    material: 'Soro ou plasma processado rapidamente',
    unidade: 'µmol/L e nmol/L',
    referencias: [
      { rotulo: 'Homocisteína', minimo: 5, maximo: 15, unidade: 'µmol/L' },
      { rotulo: 'Ácido metilmalônico', texto: '< 370', unidade: 'nmol/L' },
      { rotulo: 'Interpretação conjunta', texto: 'Ambos elevados → deficiência de B12; só homocisteína elevada → deficiência de folato', unidade: '' },
    ],
    resumo:
      'Os marcadores funcionais das vitaminas B12 e folato. Sobem antes de a dosagem sérica cair — e resolvem a zona cinzenta em que a B12 vem "normal" num paciente que já tem neuropatia.',
    entenda:
      'A B12 é cofator de duas reações. Na primeira, converte homocisteína em metionina — reação que também depende do folato. Na segunda, converte metilmalonil-CoA em succinil-CoA — reação que depende **só** da B12. Quando falta B12, os dois substratos se acumulam. Quando falta apenas folato, só a homocisteína se acumula, porque a via do metilmalonato não usa folato. Essa assimetria bioquímica é o que permite distinguir as duas carências com dois exames.',
    aprofundar: [
      'A zona cinzenta da B12 — entre 200 e 400 pg/mL — é onde os marcadores funcionais mais rendem. Nessa faixa, uma parcela substancial dos pacientes tem deficiência real, especialmente idosos, usuários crônicos de metformina ou de inibidores de bomba de prótons, e pacientes com gastrite atrófica ou pós-bariátricos. Ácido metilmalônico elevado nessa faixa confirma a deficiência e justifica reposição.',
      'A urgência de acertar vem da neurologia. A degeneração combinada subaguda da medula — comprometimento dos cordões posteriores e laterais — pode se instalar **sem anemia e sem macrocitose**, e torna-se irreversível se não tratada precocemente. O clássico erro sequencial é: paciente com parestesias e marcha atáxica, hemograma normal, B12 de 280 pg/mL, investigação encerrada. O ácido metilmalônico teria mudado o desfecho.',
      'Há uma armadilha terapêutica relacionada: repor folato em um paciente com deficiência de B12 corrige a anemia megaloblástica e **não** corrige o dano neurológico, que continua progredindo silenciosamente sem o sinal de alerta hematológico. Por isso não se repõe folato isoladamente sem antes afastar deficiência de B12.',
      'A homocisteína é também um fator de risco cardiovascular independente, mas essa observação teve um desfecho instrutivo: reduzi-la com vitaminas do complexo B não reduziu eventos cardiovasculares em ensaios clínicos. É um dos exemplos mais claros de associação epidemiológica sem causalidade acionável — e a razão de a homocisteína não ser mais recomendada como alvo terapêutico em prevenção cardiovascular.',
      'Homocisteína muito elevada, acima de 100 µmol/L, em criança ou jovem com ectopia do cristalino, hábito marfanoide e trombose sugere homocistinúria clássica por deficiência de cistationina beta-sintase — uma doença genética com tratamento dietético específico.',
    ],
    fisiologia: {
      oQueE: 'Homocisteína: aminoácido intermediário do metabolismo da metionina. Ácido metilmalônico: intermediário do catabolismo de ácidos graxos de cadeia ímpar e de aminoácidos.',
      origem: 'Metabolismo intracelular dependente de B12, folato e B6.',
      funcao: 'Não têm função própria — acumulam-se quando a enzima dependente de vitamina não funciona.',
      eliminacao: 'Renal — ambos se acumulam na insuficiência renal.',
      orgaosEnvolvidos: ['Fígado', 'Sistema nervoso', 'Medula óssea', 'Rim'],
      percurso: [
        'Metionina → homocisteína',
        'B12 e folato remetilam homocisteína a metionina',
        'B6 converte homocisteína a cistationina',
        'B12 converte metilmalonil-CoA a succinil-CoA',
        'falta de B12 acumula os dois; falta de folato acumula só a homocisteína',
      ],
    },
    aumento: {
      resumo: 'Deficiência de B12 ou folato, insuficiência renal, hipotireoidismo, variantes genéticas ou fármacos.',
      mecanismos: [
        {
          titulo: 'Bloqueio da via dependente de vitamina',
          explicacao: 'Sem o cofator, a enzima não converte o substrato, que se acumula no plasma — em proporção à gravidade e à duração da carência.',
          exemplos: [
            { causa: 'Deficiência de vitamina B12', etapas: ['gastrite atrófica, cirurgia bariátrica, metformina ou dieta vegana estrita', 'homocisteína e ácido metilmalônico ↑', 'anemia megaloblástica com neutrófilos hipersegmentados', 'degeneração combinada subaguda da medula'], nota: 'A neuropatia pode preceder a anemia — e é irreversível se tratada tarde.' },
            { causa: 'Deficiência de folato', etapas: ['aporte insuficiente, alcoolismo, gestação ou metotrexato', 'homocisteína ↑ com ácido metilmalônico normal', 'anemia megaloblástica sem neuropatia'], nota: 'A normalidade do metilmalônico é o que separa das duas carências.' },
          ],
        },
        {
          titulo: 'Retenção e outras causas',
          explicacao: 'A depuração renal reduzida e algumas condições metabólicas elevam os marcadores sem carência vitamínica.',
          exemplos: [
            { causa: 'Insuficiência renal', etapas: ['depuração reduzida', 'homocisteína e ácido metilmalônico ↑ sem deficiência', 'interpretação comprometida'], nota: 'É a principal causa de falso-positivo dos dois marcadores.' },
            { causa: 'Hipotireoidismo, polimorfismo da MTHFR, tabagismo, deficiência de B6', etapas: ['redução da atividade enzimática ou do cofator', 'homocisteína moderadamente ↑'] },
            { causa: 'Homocistinúria clássica', etapas: ['deficiência de cistationina beta-sintase', 'homocisteína > 100 µmol/L', 'ectopia do cristalino, hábito marfanoide, trombose e atraso cognitivo'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A investigação da anemia macrocítica', ids: ['vitamina-b12', 'acido-folico', 'vcm', 'reticulocitos'], leitura: 'B12 na zona cinzenta com VCM alto e neutrófilos hipersegmentados exige marcadores funcionais antes de encerrar a investigação.' },
      { titulo: 'A causa da deficiência de B12', ids: ['gastrina', 'anti-transglutaminase'], leitura: 'Gastrina alta com pepsinogênio I baixo indica gastrite atrófica autoimune, causa clássica de anemia perniciosa.' },
    ],
    advertencia:
      'Não reponha folato isoladamente sem afastar deficiência de B12: a anemia corrige e o dano neurológico progride sem sinal de alerta. Insuficiência renal eleva ambos os marcadores e compromete a interpretação.',
    interferentes: {
      preAnalitico: ['A homocisteína aumenta na amostra se o plasma não for separado rapidamente — as hemácias continuam a produzi-la. Centrifugar em até uma hora ou manter em gelo.'],
      fisiologico: ['Sobe com a idade, com o tabagismo e no sexo masculino.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['vitamina-b12', 'acido-folico', 'vcm', 'gastrina'],
  },

  {
    id: 'vitaminas-lipossoluveis',
    nome: 'Vitaminas A, E e K',
    sigla: 'A / E / K',
    sinonimos: ['vitamina a', 'retinol', 'vitamina e', 'alfa tocoferol', 'vitamina k', 'vitaminas lipossoluveis'],
    grupo: 'vitaminas',
    sistemas: ['metabolico', 'digestivo', 'hematologico'],
    material: 'Soro protegido da luz',
    unidade: 'µg/dL e mg/L',
    referencias: [
      { rotulo: 'Vitamina A (retinol)', minimo: 30, maximo: 80, unidade: 'µg/dL' },
      { rotulo: 'Vitamina E (alfa-tocoferol)', minimo: 5.5, maximo: 17, unidade: 'mg/L', observacao: 'Deve ser corrigida pelos lipídios séricos: a vitamina E circula nas lipoproteínas.' },
      { rotulo: 'Vitamina K', texto: 'Avaliada indiretamente pelo INR na maioria dos contextos', unidade: '' },
    ],
    resumo:
      'Vitaminas que dependem de gordura para serem absorvidas — e cuja deficiência, portanto, aponta quase sempre para má absorção de lipídios em vez de aporte insuficiente.',
    entenda:
      'A absorção das vitaminas A, D, E e K exige lipase pancreática, sais biliares e mucosa intestinal íntegra. A falha de qualquer um dos três compromete as quatro simultaneamente. Por isso a deficiência dessas vitaminas raramente é isolada e raramente é dietética: ela é o sintoma laboratorial de colestase, insuficiência pancreática exócrina, doença celíaca, doença de Crohn extensa ou cirurgia bariátrica disabsortiva.',
    aprofundar: [
      'A vitamina K é a mais rapidamente depletada porque seu estoque hepático é pequeno — dias, não meses. Isso lhe dá um uso diagnóstico elegante: um INR alargado que **corrige** após administração de vitamina K indica deficiência (colestase, antibiótico prolongado, desnutrição, uso de varfarina); um INR que **não corrige** indica falência de síntese hepática. Um único teste separa duas causas com prognósticos completamente diferentes.',
      'A vitamina E precisa ser interpretada em relação aos lipídios porque circula ligada às lipoproteínas. Um paciente com hipercolesterolemia terá vitamina E sérica alta sem excesso tecidual; um com hipolipidemia grave, o contrário. A razão vitamina E/colesterol total corrige esse efeito. A deficiência prolongada produz uma síndrome neurológica específica — ataxia, arreflexia, neuropatia periférica e retinopatia — reversível se tratada cedo.',
      'A vitamina A tem um comportamento parecido com o do ferro: ela circula ligada à proteína ligadora de retinol, que é reagente de fase aguda **negativa**. Na inflamação, o fígado reduz a síntese dessa proteína e o retinol sérico cai sem que haja carência. Dosar vitamina A em paciente com PCR elevada produz falso diagnóstico de deficiência com frequência.',
      'A hipervitaminose A merece atenção porque é causada por suplementação e produz um quadro reconhecível: hepatotoxicidade com hipertensão portal, hipercalcemia, alopecia, descamação cutânea, dor óssea e hipertensão intracraniana idiopática. Na gestação, é teratogênica — e essa é a razão de os retinoides orais exigirem contracepção rigorosa.',
      'A deficiência de vitamina A ainda é uma causa relevante de cegueira infantil evitável no mundo: a xeroftalmia progride de cegueira noturna a manchas de Bitot, xerose corneana e ceratomalácia. Também aumenta a mortalidade por sarampo e por diarreia, o que sustenta os programas de suplementação em populações de risco.',
    ],
    fisiologia: {
      oQueE: 'Vitaminas lipossolúveis absorvidas junto com as gorduras da dieta e armazenadas no fígado e no tecido adiposo.',
      origem: 'Dieta; a vitamina K também é produzida pela microbiota intestinal.',
      circulacao: 'Retinol ligado à proteína ligadora de retinol; vitamina E nas lipoproteínas.',
      funcao: 'Visão e diferenciação epitelial (A); antioxidante de membrana (E); gama-carboxilação dos fatores de coagulação II, VII, IX e X e das proteínas C e S (K).',
      orgaosEnvolvidos: ['Intestino delgado', 'Fígado', 'Pâncreas', 'Vias biliares'],
      percurso: [
        'Ingestão com gordura da dieta',
        'emulsificação por sais biliares e hidrólise por lipase pancreática',
        'formação de micelas e absorção no enterócito',
        'transporte em quilomícrons pela via linfática',
        'estoque hepático e adiposo',
      ],
    },
    aumento: {
      resumo: 'Praticamente sempre por suplementação — e a hipervitaminose A é a que produz doença.',
      mecanismos: [
        {
          titulo: 'Acúmulo por suplementação excessiva',
          explicacao: 'Sendo lipossolúveis, essas vitaminas não são eliminadas pela urina e se acumulam no fígado e no tecido adiposo.',
          exemplos: [
            { causa: 'Hipervitaminose A', etapas: ['suplementação prolongada em dose alta', 'acúmulo hepático nas células estreladas', 'hepatotoxicidade com hipertensão portal, hipercalcemia, alopecia e hipertensão intracraniana'], nota: 'Teratogênica na gestação — motivo da contracepção obrigatória com retinoides orais.' },
            { causa: 'Vitamina E em dose alta', etapas: ['interferência com a vitamina K', 'prolongamento do tempo de protrombina', 'risco hemorrágico aumentado em anticoagulados'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Má absorção de gorduras — colestase, insuficiência pancreática, doença celíaca ou cirurgia bariátrica — e, no caso da A, também inflamação.',
      mecanismos: [
        {
          titulo: 'Má absorção de lipídios',
          explicacao: 'Sem lipase, sem sais biliares ou sem mucosa absortiva, as quatro vitaminas lipossolúveis deixam de ser absorvidas simultaneamente.',
          exemplos: [
            { causa: 'Colestase crônica e insuficiência pancreática exócrina', etapas: ['falta de sais biliares ou de lipase', 'esteatorreia', 'deficiência combinada de A, D, E e K', 'INR alargado que corrige com vitamina K'], nota: 'A correção do INR com vitamina K é o teste que separa colestase de falência hepática.' },
            { causa: 'Doença celíaca, Crohn extenso, cirurgia bariátrica disabsortiva', etapas: ['superfície absortiva reduzida', 'deficiência progressiva ao longo de meses a anos', 'necessidade de reposição por via parenteral em alguns casos'] },
            { causa: 'Deficiência de vitamina E prolongada', etapas: ['perda da proteção antioxidante das membranas neuronais', 'ataxia, arreflexia, neuropatia e retinopatia pigmentar', 'reversível se tratada precocemente'] },
          ],
        },
        {
          titulo: 'Redução por inflamação',
          explicacao: 'A proteína ligadora de retinol é reagente de fase aguda negativa, e sua queda derruba o retinol sérico sem carência real.',
          exemplos: [
            { causa: 'Inflamação sistêmica', etapas: ['síntese hepática da proteína ligadora de retinol reduzida', 'vitamina A sérica ↓ com estoque hepático preservado', 'falso diagnóstico de deficiência'], nota: 'Interprete sempre com a PCR ao lado.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O teste que a vitamina K permite', ids: ['inr', 'albumina', 'bilirrubina-total'], leitura: 'INR alargado que corrige com vitamina K indica colestase ou carência; que não corrige indica insuficiência hepática. Albumina baixa reforça a segunda.' },
      { titulo: 'A causa da má absorção', ids: ['elastase-fecal', 'anti-transglutaminase', 'acidos-biliares'], leitura: 'Elastase fecal baixa aponta o pâncreas; anti-transglutaminase aponta doença celíaca; ácidos biliares e fosfatase alcalina apontam colestase.' },
    ],
    advertencia:
      'Vitamina A sérica não é interpretável em vigência de inflamação. Vitamina E deve ser corrigida pelos lipídios séricos.',
    interferentes: {
      preAnalitico: ['Retinol e tocoferol são fotossensíveis — a amostra deve ser protegida da luz.'],
      fisiologico: ['Lipemia e hiperlipidemia elevam a vitamina E sem excesso tecidual.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['vitamina-d', 'inr', 'elastase-fecal', 'pcr'],
  },

  {
    id: 'oligoelementos',
    nome: 'Selênio, cobre, manganês e vitamina C',
    sigla: 'Oligoelementos',
    sinonimos: ['selenio', 'cobre serico', 'manganes', 'vitamina c', 'acido ascorbico', 'escorbuto', 'oligoelementos'],
    grupo: 'vitaminas',
    sistemas: ['metabolico', 'hematologico', 'neurologico'],
    material: 'Soro em tubo livre de metais',
    unidade: 'µg/L e mg/dL',
    referencias: [
      { rotulo: 'Selênio', minimo: 70, maximo: 150, unidade: 'µg/L' },
      { rotulo: 'Cobre sérico', minimo: 70, maximo: 140, unidade: 'µg/dL' },
      { rotulo: 'Manganês', minimo: 4, maximo: 15, unidade: 'µg/L' },
      { rotulo: 'Vitamina C', minimo: 0.4, maximo: 2.0, unidade: 'mg/dL' },
    ],
    resumo:
      'Micronutrientes cuja deficiência produz quadros específicos e reversíveis — e cuja dosagem é distorcida pela inflamação com tanta frequência que a interpretação exige sempre a PCR ao lado.',
    entenda:
      'Selênio, cobre e zinco são redistribuídos durante a resposta de fase aguda: caem no plasma por sequestro tecidual e por redução das proteínas transportadoras, sem que haja carência corporal. Um paciente em terapia intensiva com PCR de 200 mg/L terá esses três elementos baixos quase invariavelmente. Repor com base nesse retrato é tratar a inflamação como se fosse desnutrição.',
    aprofundar: [
      'A deficiência de cobre é uma causa reversível e frequentemente esquecida de citopenias e de mielopatia. Ela imita duas doenças de forma notável: a mielodisplasia, com anemia, neutropenia e vacuolização de precursores na medula, e a deficiência de B12, com mielopatia dos cordões posteriores. Suas causas mais comuns são cirurgia bariátrica, nutrição parenteral prolongada e — de forma característica — excesso de zinco, que compete pela absorção intestinal e induz metalotioneína, que sequestra o cobre. Suplementação de zinco por conta própria é uma causa real e crescente.',
      'A deficiência de selênio produz cardiomiopatia (doença de Keshan, descrita em regiões de solo pobre em selênio) e miopatia com CK elevada. Aparece em nutrição parenteral prolongada sem suplementação e em síndromes disabsortivas graves. O selênio é cofator da glutationa peroxidase e das deiodinases — sua falta compromete tanto a defesa antioxidante quanto a conversão periférica de T4 em T3.',
      'O escorbuto ainda existe, e sua descrição não é histórica. Aparece em idosos que moram sozinhos, em pessoas com transtorno alimentar, em alcoolistas e em crianças com dietas muito restritas. O quadro é característico: hemorragias perifoliculares com pelos em saca-rolha, gengivite hemorrágica, artralgia com hemartrose, má cicatrização e anemia. A resposta à reposição é dramática, em dias — e o diagnóstico se faz pela clínica e pela história alimentar, mais que pela dosagem, que é tecnicamente instável.',
      'O manganês tem o problema inverso: sua toxicidade é mais relevante que sua deficiência. Acumula-se em nutrição parenteral prolongada, sobretudo com colestase (a excreção é biliar), e se deposita nos gânglios da base, produzindo um parkinsonismo que não responde a levodopa e uma hiperintensidade característica na ressonância. Em pacientes em nutrição parenteral de longo prazo, é preciso monitorar e ajustar.',
    ],
    fisiologia: {
      oQueE: 'Micronutrientes essenciais que atuam como cofatores enzimáticos em concentrações mínimas.',
      origem: 'Dieta; absorção intestinal regulada e competitiva entre alguns deles.',
      funcao: 'Selênio: glutationa peroxidase e deiodinases. Cobre: citocromo-oxidase, superóxido dismutase, ceruloplasmina. Vitamina C: síntese de colágeno e absorção de ferro. Manganês: superóxido dismutase mitocondrial.',
      orgaosEnvolvidos: ['Intestino delgado', 'Fígado', 'Medula óssea', 'Sistema nervoso'],
      percurso: [
        'Absorção intestinal competitiva (zinco compete com cobre)',
        'transporte plasmático em proteínas específicas',
        'incorporação em enzimas nos tecidos',
        'excreção predominantemente biliar',
        'redistribuição para os tecidos na fase aguda, derrubando o valor plasmático',
      ],
    },
    aumento: {
      resumo: 'Suplementação excessiva, colestase (manganês) ou fase aguda (cobre, que sobe com a ceruloplasmina).',
      mecanismos: [
        {
          titulo: 'Acúmulo por excreção comprometida ou aporte excessivo',
          explicacao: 'A excreção biliar é a via principal desses elementos; a colestase e a nutrição parenteral prolongada permitem o acúmulo.',
          exemplos: [
            { causa: 'Toxicidade por manganês', etapas: ['nutrição parenteral prolongada, sobretudo com colestase', 'deposição nos gânglios da base', 'parkinsonismo não responsivo a levodopa', 'hiperintensidade em T1 na ressonância'] },
            { causa: 'Cobre elevado na fase aguda', etapas: ['ceruloplasmina é reagente de fase aguda positiva', 'cobre total ↑ sem sobrecarga real'], nota: 'Não confundir com hipocupremia da doença de Wilson, em que o cobre livre é que está alto.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Carência real por má absorção ou aporte insuficiente — ou, muito mais frequentemente em internados, redistribuição inflamatória.',
      mecanismos: [
        {
          titulo: 'Carência verdadeira',
          explicacao: 'Absorção comprometida, aporte ausente ou competição com outro elemento reduzem o conteúdo corporal e a função enzimática dependente.',
          exemplos: [
            { causa: 'Deficiência de cobre por excesso de zinco ou cirurgia bariátrica', etapas: ['zinco induz metalotioneína que sequestra o cobre', 'anemia e neutropenia refratárias a ferro', 'mielopatia semelhante à da deficiência de B12', 'vacuolização de precursores na medula imitando mielodisplasia'], nota: 'Causa reversível de citopenias — pergunte sobre suplementos de zinco.' },
            { causa: 'Deficiência de selênio', etapas: ['nutrição parenteral sem suplementação ou má absorção grave', 'cardiomiopatia e miopatia com CK elevada', 'conversão periférica de T4 em T3 comprometida'] },
            { causa: 'Escorbuto', etapas: ['aporte de vitamina C praticamente ausente por meses', 'síntese de colágeno comprometida', 'hemorragias perifoliculares, gengivite hemorrágica, hemartrose e má cicatrização', 'resposta dramática à reposição em dias'], nota: 'Idoso que mora sozinho, alcoolista ou transtorno alimentar são os contextos típicos.' },
          ],
        },
        {
          titulo: 'Redistribuição inflamatória',
          explicacao: 'A resposta de fase aguda desloca esses elementos do plasma para os tecidos e reduz suas proteínas transportadoras.',
          exemplos: [
            { causa: 'Paciente crítico com inflamação sistêmica', etapas: ['sequestro tecidual e queda das proteínas transportadoras', 'selênio, zinco e ferro plasmáticos ↓', 'sem carência corporal correspondente'], nota: 'Interpretar sem a PCR leva a reposições desnecessárias.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O contexto inflamatório obrigatório', ids: ['pcr', 'albumina', 'zinco'], leitura: 'PCR alta e albumina baixa indicam que os oligoelementos plasmáticos refletem a fase aguda, não o estado nutricional.' },
      { titulo: 'Quando as citopenias são carenciais', ids: ['ceruloplasmina', 'vitamina-b12', 'hemoglobina', 'neutrofilos-absolutos'], leitura: 'Anemia com neutropenia e mielopatia, refratária a ferro e B12, deve levar à dosagem de cobre e à pergunta sobre uso de zinco.' },
    ],
    advertencia:
      'Dosagens plasmáticas de selênio, cobre e zinco não refletem o estado nutricional em vigência de inflamação. Interprete sempre com a PCR ao lado.',
    interferentes: {
      preAnalitico: ['Tubos comuns contaminam a amostra com metais — exige tubo certificado livre de elementos-traço.', 'A vitamina C é instável: a amostra precisa ser protegida da luz, acidificada e congelada rapidamente.'],
      fisiologico: ['Fase aguda reduz selênio, zinco e ferro e eleva o cobre.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['zinco', 'ceruloplasmina', 'pcr', 'vitamina-b12'],
  },
]
