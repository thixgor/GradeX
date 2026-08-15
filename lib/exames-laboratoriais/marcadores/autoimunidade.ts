import type { Marcador } from '../tipos'

/**
 * Autoanticorpos — o que cada um acrescenta depois que o FAN já veio positivo.
 *
 * O FAN é uma porta, não um diagnóstico. Ele é positivo em cerca de 10 a 15%
 * da população saudável, sobe com a idade e aparece em hepatopatias,
 * infecções e neoplasias. Pedir FAN em quem não tem sintoma de doença
 * autoimune é uma das formas mais eficientes de criar um paciente ansioso e
 * uma cascata de exames — e é por isso que a primeira coisa que este arquivo
 * ensina é **quando não pedir**.
 *
 * O que muda o raciocínio são os anticorpos específicos. Eles têm duas
 * propriedades que o FAN não tem: especificidade alta (anti-Sm é
 * praticamente exclusivo do lúpus, anti-Scl-70 da esclerose sistêmica difusa)
 * e valor prognóstico — o anti-RNA polimerase III prevê crise renal
 * esclerodérmica, o anti-MDA5 prevê doença pulmonar rapidamente progressiva,
 * o anti-dsDNA acompanha a atividade da nefrite lúpica. É por isso que a
 * pergunta certa raramente é "o FAN é positivo?" e quase sempre "qual é o
 * padrão, e qual anticorpo específico o explica?".
 */
export const marcadores: Marcador[] = [
  {
    id: 'anti-dna-nativo',
    nome: 'Anti-DNA de dupla hélice',
    sigla: 'Anti-dsDNA',
    sinonimos: ['anti dna', 'anti dsdna', 'anti dna nativo', 'anti dna dupla helice', 'crithidia'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'renal'],
    material: 'Soro',
    unidade: 'UI/mL ou título',
    referencias: [
      { rotulo: 'ELISA', texto: '< 30', unidade: 'UI/mL' },
      { rotulo: 'Imunofluorescência em Crithidia luciliae', texto: 'Não reagente', unidade: '', observacao: 'Método mais específico, ainda que menos sensível — reagente aqui tem peso diagnóstico maior.' },
    ],
    resumo:
      'Anticorpo altamente específico para lúpus e um dos poucos autoanticorpos cujo título acompanha a atividade da doença — em particular a da nefrite.',
    entenda:
      'O anti-dsDNA reconhece o DNA de dupla fita, e sua importância vem do que ele faz, não apenas do que marca: forma imunocomplexos que se depositam no glomérulo, ativam o complemento e produzem a nefrite lúpica. Por isso ele é ao mesmo tempo critério classificatório, marcador de atividade e agente da lesão — uma combinação rara. O título subindo com C3 e C4 caindo é a assinatura laboratorial da nefrite lúpica em atividade.',
    aprofundar: [
      'A tríade de acompanhamento do lúpus renal é anti-dsDNA ascendente, C3 e C4 em queda, e proteinúria em elevação. Os três se movem juntos porque descrevem um único fenômeno: mais anticorpo, mais imunocomplexo formado, mais complemento consumido no depósito glomerular, mais proteína perdida. Ler os três em conjunto detecta reativação antes do sintoma.',
      'Nem todo paciente com lúpus tem anti-dsDNA — a sensibilidade é de cerca de 60 a 70% — e nem todo anti-dsDNA positivo tem nefrite. Além disso, alguns pacientes têm o anticorpo persistentemente positivo com doença clinicamente quiescente. A regra prática é acompanhar a tendência do próprio paciente, não comparar seu valor com o de outro.',
      'O método importa. O ELISA é sensível e capta anticorpos de baixa avidez que podem aparecer em outras condições; a imunofluorescência em Crithidia luciliae detecta apenas anticorpos de alta avidez contra DNA puramente de dupla fita, e é mais específica. Um ELISA fracamente positivo com Crithidia negativa em paciente sem clínica de lúpus geralmente não significa doença.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpo dirigido ao DNA de dupla hélice, principalmente da classe IgG.',
      origem: 'Linfócitos B autorreativos que escaparam da tolerância central e periférica.',
      funcao: 'Não tem função fisiológica — forma imunocomplexos patogênicos com nucleossomos circulantes.',
      orgaosEnvolvidos: ['Rim', 'Pele', 'Sistema nervoso central'],
      percurso: [
        'Apoptose com depuração deficiente de restos nucleares',
        'exposição de nucleossomos ao sistema imune',
        'produção de anti-dsDNA',
        'formação de imunocomplexos',
        'deposição glomerular e ativação do complemento',
        'nefrite com consumo de C3 e C4',
      ],
    },
    aumento: {
      resumo: 'Lúpus eritematoso sistêmico, sobretudo com envolvimento renal em atividade.',
      significado: 'Título ascendente com queda de complemento indica atividade — muitas vezes antes de qualquer sintoma novo.',
      mecanismos: [
        {
          titulo: 'Perda de tolerância a antígenos nucleares',
          explicacao: 'A depuração deficiente de material apoptótico expõe cromatina ao sistema imune; células B autorreativas são ativadas e produzem anticorpos de alta avidez contra o DNA.',
          exemplos: [
            { causa: 'Nefrite lúpica em atividade', etapas: ['anti-dsDNA ↑', 'imunocomplexos depositados no glomérulo', 'ativação da via clássica com consumo de C3 e C4', 'proteinúria e hematúria dismórfica'], nota: 'A combinação anti-dsDNA ↑ + complemento ↓ + proteinúria ↑ é o alerta de reativação renal.' },
            { causa: 'Lúpus induzido por fármaco', etapas: ['hidralazina, procainamida, minociclina, anti-TNF', 'anti-histona positivo', 'anti-dsDNA geralmente negativo, exceto no induzido por anti-TNF'], nota: 'A exceção do anti-TNF é importante: ali o anti-dsDNA pode ser positivo.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A tríade da atividade lúpica', ids: ['complemento-c3', 'c4', 'proteinuria'], leitura: 'Anti-dsDNA subindo, complemento caindo e proteinúria aumentando descrevem um único processo: imunocomplexos se depositando no glomérulo.' },
      { titulo: 'O contexto sorológico', ids: ['fan', 'anti-sm'], leitura: 'O FAN abre a investigação; anti-dsDNA e anti-Sm são os dois anticorpos específicos que a fecham.' },
    ],
    utilidade: ['diagnostico', 'acompanhamento', 'prognostico'],
    estudarTambem: ['fan', 'complemento-c3', 'c4', 'anti-sm'],
  },

  {
    id: 'anti-sm',
    nome: 'Anti-Sm e anti-RNP',
    sigla: 'Anti-Sm',
    sinonimos: ['anti sm', 'anti smith', 'anti rnp', 'anti u1-rnp', 'antigenos nucleares extraiveis', 'ena'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'musculoesqueletico'],
    material: 'Soro',
    unidade: 'reagente/não reagente',
    referencias: [
      { rotulo: 'Anti-Sm', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anti-RNP', texto: 'Não reagente', unidade: '' },
    ],
    resumo:
      'Anti-Sm é quase exclusivo do lúpus — muito específico, pouco sensível. Anti-RNP em título alto e isolado define a doença mista do tecido conjuntivo.',
    entenda:
      'Os dois anticorpos reconhecem proteínas do mesmo complexo — as ribonucleoproteínas nucleares pequenas do spliceossomo. O anti-Sm reconhece as proteínas centrais e é praticamente patognomônico de lúpus, presente em apenas 20 a 30% dos pacientes; sua ausência não afasta nada, mas sua presença fecha. O anti-RNP reconhece as proteínas associadas ao U1, e em título muito alto na ausência de anti-Sm e anti-dsDNA caracteriza a doença mista do tecido conjuntivo, com fenômeno de Raynaud, mãos edemaciadas e miosite.',
    aprofundar: [
      'A relação entre especificidade e sensibilidade é o que organiza o uso destes anticorpos. Anti-Sm tem especificidade próxima de 99% e sensibilidade de 25% — é um teste para confirmar, nunca para excluir. Isso o torna útil justamente no paciente com FAN positivo, clínica sugestiva e anti-dsDNA negativo.',
      'Uma armadilha metodológica: os painéis de antígenos nucleares extraíveis (ENA) frequentemente reportam anti-Sm e anti-RNP juntos porque os antígenos coexistem no mesmo complexo, e a reatividade cruzada é possível. Anti-Sm positivo isolado, sem anti-RNP, é raro; o inverso é comum e caracteriza a doença mista.',
      'A doença mista do tecido conjuntivo tem, entre as conectivopatias, o melhor prognóstico renal — a nefrite é infrequente — mas risco significativo de hipertensão pulmonar, que é sua principal causa de morte. Reconhecer o anticorpo, portanto, muda o que se rastreia no seguimento: ecocardiograma periódico em vez de vigilância renal intensiva.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos contra proteínas de ribonucleoproteínas nucleares pequenas do complexo do spliceossomo.',
      origem: 'Resposta autoimune contra componentes do maquinário de processamento de RNA.',
      funcao: 'Nenhuma fisiológica — marcadores diagnósticos e, no caso do anti-RNP, definidores de entidade clínica.',
      percurso: ['Exposição de complexos snRNP', 'perda de tolerância', 'produção de anti-Sm ou anti-RNP', 'padrão salpicado no FAN'],
    },
    aumento: {
      resumo: 'Anti-Sm indica lúpus com alta confiança; anti-RNP isolado em título alto indica doença mista do tecido conjuntivo.',
      mecanismos: [
        {
          titulo: 'Autorreatividade contra o spliceossomo',
          explicacao: 'Complexos de RNA e proteína expostos durante apoptose tornam-se alvo, e o perfil de proteínas reconhecidas define o fenótipo clínico.',
          exemplos: [
            { causa: 'Lúpus eritematoso sistêmico', etapas: ['anti-Sm reagente', 'especificidade próxima de 99%', 'critério classificatório'], nota: 'Presente em apenas um quarto dos pacientes — ausência não exclui.' },
            { causa: 'Doença mista do tecido conjuntivo', etapas: ['anti-RNP em título alto e isolado', 'Raynaud, mãos edemaciadas, artrite, miosite', 'risco de hipertensão pulmonar', 'ecocardiograma periódico no seguimento'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel de anticorpos específicos', ids: ['fan', 'anti-dna-nativo', 'anti-ro'], leitura: 'Depois de um FAN positivo, o painel de antígenos extraíveis é o que define qual doença.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['fan', 'anti-dna-nativo'],
  },

  {
    id: 'anti-ro',
    nome: 'Anti-Ro/SSA e anti-La/SSB',
    sigla: 'Anti-Ro',
    sinonimos: ['anti ro', 'anti ssa', 'anti la', 'anti ssb', 'anti ro52', 'anti ro60'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico'],
    material: 'Soro',
    unidade: 'reagente/não reagente',
    referencias: [
      { rotulo: 'Anti-Ro/SSA', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anti-La/SSB', texto: 'Não reagente', unidade: '' },
    ],
    resumo:
      'Marcadores da síndrome de Sjögren e do lúpus cutâneo subagudo. São também os anticorpos que atravessam a placenta e causam lúpus neonatal e bloqueio cardíaco congênito — o que os torna um exame de rastreio obstétrico.',
    entenda:
      'O anti-Ro é o autoanticorpo com a consequência transplacentária mais bem documentada da reumatologia. Sendo IgG, ele atravessa a placenta a partir da 16ª semana e pode se ligar ao tecido de condução cardíaco fetal, causando bloqueio atrioventricular completo — uma lesão irreversível que exige marcapasso ao nascimento. Por isso, toda mulher com doença autoimune que planeja gestar deve ter esses anticorpos pesquisados, e as portadoras entram em vigilância ecocardiográfica fetal semanal entre a 16ª e a 26ª semana.',
    aprofundar: [
      'O anti-Ro é também o motivo de existir o "lúpus FAN-negativo". O antígeno Ro60 e, sobretudo, o Ro52 podem ser mal representados no substrato de células HEp-2 usado na imunofluorescência, produzindo FAN negativo em paciente com anticorpo presente. Diante de fotossensibilidade acentuada, lesões anulares subagudas ou síndrome seca com FAN negativo, pedir anti-Ro diretamente é a conduta correta.',
      'A distinção entre Ro52 e Ro60 ganhou relevância: o Ro52 (TRIM21) associa-se a miopatias inflamatórias, doença pulmonar intersticial e colangite biliar primária, além de Sjögren; o Ro60 associa-se mais fortemente a lúpus e Sjögren. Laudos que separam as duas especificidades fornecem informação prognóstica adicional.',
      'Na síndrome de Sjögren, anti-Ro e anti-La compõem os critérios classificatórios ao lado dos testes de secreção e da histologia de glândula salivar menor. O anti-La quase nunca aparece isolado — quando isso ocorre, o valor diagnóstico é baixo e deve ser interpretado com cautela.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos contra as ribonucleoproteínas Ro (60 e 52 kDa) e La (48 kDa).',
      origem: 'Resposta autoimune contra proteínas ligadas a RNAs pequenos citoplasmáticos e nucleares.',
      funcao: 'Sem função fisiológica; patogênicos no tecido de condução cardíaco fetal e na pele fotoexposta.',
      percurso: [
        'Produção materna de anti-Ro IgG',
        'transferência placentária a partir da 16ª semana',
        'ligação ao tecido de condução cardíaco fetal',
        'inflamação e fibrose do nó atrioventricular',
        'bloqueio cardíaco congênito irreversível',
      ],
    },
    aumento: {
      resumo: 'Síndrome de Sjögren, lúpus (especialmente cutâneo subagudo e neonatal) e miopatias com doença pulmonar.',
      mecanismos: [
        {
          titulo: 'Autorreatividade contra ribonucleoproteínas Ro e La',
          explicacao: 'A exposição do antígeno Ro na superfície de queratinócitos após irradiação ultravioleta explica a fotossensibilidade característica.',
          exemplos: [
            { causa: 'Síndrome de Sjögren', etapas: ['infiltração linfocítica de glândulas exócrinas', 'anti-Ro e anti-La reagentes', 'xerostomia e xeroftalmia', 'risco aumentado de linfoma de MALT ao longo do tempo'] },
            { causa: 'Lúpus cutâneo subagudo', etapas: ['anti-Ro reagente', 'exposição ultravioleta transloca o antígeno para a superfície do queratinócito', 'lesões anulares ou psoriasiformes em áreas fotoexpostas'] },
            { causa: 'Lúpus neonatal e bloqueio cardíaco congênito', etapas: ['anti-Ro materno atravessa a placenta', 'ligação ao tecido de condução fetal', 'bloqueio atrioventricular irreversível', 'exantema e citopenias neonatais transitórias'], nota: 'A lesão cardíaca é permanente; as manifestações cutâneas e hematológicas desaparecem com a depuração do anticorpo materno.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Quando o FAN é negativo', ids: ['fan'], leitura: 'Anti-Ro é a causa clássica de lúpus e Sjögren com FAN negativo — peça diretamente quando a clínica for sugestiva.' },
    ],
    advertencia:
      'Toda gestante ou mulher planejando gestação com doença autoimune deve ter anti-Ro pesquisado: o resultado positivo muda o protocolo de vigilância fetal.',
    utilidade: ['diagnostico', 'prognostico', 'rastreamento'],
    estudarTambem: ['fan', 'anti-sm'],
  },

  {
    id: 'anti-scl-70',
    nome: 'Anti-Scl-70, anticentrômero e anti-RNA polimerase III',
    sigla: 'Anti-Scl-70',
    sinonimos: ['anti scl 70', 'anti topoisomerase i', 'anticentromero', 'anti centromero', 'anti rna polimerase iii', 'esclerodermia anticorpos'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'respiratorio', 'renal'],
    material: 'Soro',
    unidade: 'reagente/não reagente',
    referencias: [
      { rotulo: 'Anti-Scl-70 (topoisomerase I)', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anticentrômero', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anti-RNA polimerase III', texto: 'Não reagente', unidade: '' },
    ],
    resumo:
      'Os três anticorpos da esclerose sistêmica, mutuamente exclusivos e com prognósticos completamente diferentes: cada um prediz um órgão-alvo distinto.',
    entenda:
      'Poucos exames traduzem tão diretamente prognóstico quanto estes. O anti-Scl-70 marca a forma cutânea difusa e prediz fibrose pulmonar. O anticentrômero marca a forma limitada (antiga síndrome CREST) e prediz hipertensão arterial pulmonar de instalação tardia, com sobrevida geral melhor. O anti-RNA polimerase III marca esclerodermia difusa de progressão cutânea rápida e prediz crise renal esclerodérmica — além de se associar a maior incidência de neoplasia concomitante.',
    aprofundar: [
      'A crise renal esclerodérmica é a razão pela qual identificar o anti-RNA polimerase III muda a conduta imediatamente: o paciente precisa de monitoramento pressórico domiciliar frequente, o corticoide em dose alta deve ser evitado por ser um gatilho conhecido, e o inibidor da enzima conversora é a terapia que transformou uma condição quase invariavelmente fatal em tratável — desde que iniciado precocemente.',
      'A associação do anti-RNA polimerase III com câncer é temporalmente estreita: as neoplasias tendem a ocorrer em janela próxima ao início da esclerodermia, sugerindo que a resposta autoimune possa ser desencadeada pelo tumor. Isso justifica rastreio oncológico dirigido por idade e sexo no momento do diagnóstico.',
      'A capilaroscopia periungueal, embora não seja exame laboratorial, é o complemento indispensável: alterações do padrão esclerodérmico com fenômeno de Raynaud e um destes anticorpos permitem diagnóstico muito precoce, antes da fibrose cutânea — janela em que a intervenção ainda pode modificar o curso.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos contra a topoisomerase I, contra proteínas centroméricas e contra a RNA polimerase III.',
      origem: 'Resposta autoimune em indivíduos com esclerose sistêmica.',
      funcao: 'Marcadores de subtipo clínico e preditores de órgão-alvo.',
      orgaosEnvolvidos: ['Pele', 'Pulmão', 'Rim', 'Vasos'],
      percurso: [
        'Lesão endotelial e ativação de fibroblastos',
        'exposição de antígenos nucleares',
        'produção de autoanticorpo com especificidade definida',
        'fenótipo clínico correspondente à especificidade',
      ],
    },
    aumento: {
      resumo: 'Esclerose sistêmica — e o anticorpo específico diz qual forma e qual complicação esperar.',
      mecanismos: [
        {
          titulo: 'Autorreatividade com fenótipo definido',
          explicacao: 'Cada especificidade se associa reprodutivelmente a um padrão de acometimento orgânico, permitindo antecipar complicações antes de elas aparecerem.',
          exemplos: [
            { causa: 'Esclerose sistêmica cutânea difusa', etapas: ['anti-Scl-70 reagente', 'espessamento cutâneo proximal e de tronco', 'doença pulmonar intersticial em alta proporção', 'vigilância com tomografia e prova de função pulmonar'] },
            { causa: 'Esclerose sistêmica cutânea limitada', etapas: ['anticentrômero reagente', 'Raynaud de longa data, esclerodactilia, telangiectasias, calcinose', 'hipertensão arterial pulmonar tardia', 'ecocardiograma anual'] },
            { causa: 'Esclerodermia com risco de crise renal', etapas: ['anti-RNA polimerase III reagente', 'progressão cutânea rápida', 'crise renal com hipertensão maligna, anemia hemolítica microangiopática e insuficiência renal aguda', 'inibidor da ECA como tratamento e corticoide em dose alta a evitar'], nota: 'Rastreio oncológico dirigido também é indicado no diagnóstico.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na crise renal esclerodérmica', ids: ['creatinina', 'ldh', 'haptoglobina', 'plaquetas'], leitura: 'Creatinina em ascensão com LDH alta, haptoglobina consumida, plaquetopenia e esquizócitos configuram microangiopatia — a assinatura da crise renal.' },
    ],
    advertencia: 'Corticoide em dose alta é um gatilho reconhecido de crise renal em pacientes com esclerose sistêmica difusa, especialmente anti-RNA polimerase III positivos.',
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['fan', 'creatinina', 'esfregaco'],
  },

  {
    id: 'anticorpos-miosite',
    nome: 'Anticorpos das miopatias inflamatórias (anti-Jo-1, Mi-2, MDA5, SRP, HMGCR)',
    sigla: 'Painel miosite',
    sinonimos: ['anti jo1', 'anti jo-1', 'anti mi2', 'anti mda5', 'anti srp', 'anti hmgcr', 'anti sintetase', 'painel de miosite'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'musculoesqueletico', 'respiratorio'],
    material: 'Soro',
    unidade: 'reagente/não reagente',
    referencias: [{ rotulo: 'Resultado', texto: 'Não reagente para todos os anticorpos do painel', unidade: '' }],
    resumo:
      'Cada anticorpo do painel define uma síndrome clínica própria — não são variações de uma mesma doença. O anti-MDA5, em particular, sinaliza risco de doença pulmonar rapidamente progressiva e potencialmente fatal.',
    entenda:
      'As miopatias inflamatórias deixaram de ser classificadas apenas por biópsia e passaram a ser organizadas por autoanticorpo, porque cada especificidade prediz um conjunto reprodutível de manifestações. Anti-Jo-1 e os demais antissintetases definem a síndrome antissintetase: miosite, doença pulmonar intersticial, artrite, febre, Raynaud e "mãos de mecânico". Anti-Mi-2 define dermatomiosite clássica com boa resposta ao tratamento. Anti-SRP e anti-HMGCR definem miopatia necrosante com CK muito elevada e pouca inflamação na biópsia.',
    aprofundar: [
      'O anti-MDA5 merece destaque isolado por sua gravidade. Associa-se a dermatomiosite clinicamente amiopática — lesões cutâneas típicas com força muscular preservada e CK normal, o que faz o diagnóstico ser retardado — e a doença pulmonar intersticial rapidamente progressiva, com mortalidade alta em semanas a meses. Um paciente com pápulas de Gottron, úlceras cutâneas digitais e dispneia progressiva com CK normal precisa deste anticorpo com urgência.',
      'O anti-HMGCR merece nota farmacológica: reconhece a enzima alvo das estatinas, e a miopatia necrosante associada pode persistir e progredir mesmo após a suspensão do fármaco, exigindo imunossupressão. É diferente da miopatia tóxica comum por estatina, que melhora com a suspensão. Diferenciar as duas evita tanto o subtratamento de uma doença autoimune quanto a imunossupressão de uma toxicidade simples.',
      'A dermatomiosite do adulto tem associação estabelecida com neoplasia oculta, particularmente forte com anti-TIF1-gama e anti-NXP2. O diagnóstico deve, portanto, deflagrar rastreio oncológico dirigido por idade, sexo e fatores de risco — e o perfil de anticorpos ajuda a decidir a intensidade desse rastreio.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos específicos de miosite dirigidos a aminoacil-tRNA sintetases, a componentes do complexo Mi-2, à proteína MDA5, à partícula de reconhecimento de sinal e à HMG-CoA redutase.',
      origem: 'Resposta autoimune contra antígenos citoplasmáticos e nucleares expressos no músculo em regeneração.',
      funcao: 'Definir subtipo clínico e prever acometimento pulmonar e risco neoplásico.',
      orgaosEnvolvidos: ['Músculo esquelético', 'Pulmão', 'Pele'],
      percurso: [
        'Expressão aumentada do antígeno no músculo em regeneração',
        'apresentação e perda de tolerância',
        'anticorpo específico produzido',
        'fenótipo clínico correspondente',
      ],
    },
    aumento: {
      resumo: 'Miopatia inflamatória — e a especificidade do anticorpo define qual síndrome e qual órgão vigiar.',
      mecanismos: [
        {
          titulo: 'Autorreatividade com fenótipo definido',
          explicacao: 'Cada antígeno reconhecido se associa a um padrão clínico reprodutível, o que permite antecipar complicações antes que se manifestem.',
          exemplos: [
            { causa: 'Síndrome antissintetase (anti-Jo-1)', etapas: ['miosite com CK elevada', 'doença pulmonar intersticial', 'artrite, febre, Raynaud, mãos de mecânico', 'tomografia de tórax e prova de função pulmonar no diagnóstico'] },
            { causa: 'Dermatomiosite amiopática anti-MDA5', etapas: ['lesões cutâneas típicas com úlceras digitais', 'CK frequentemente normal e força preservada', 'doença pulmonar intersticial rapidamente progressiva', 'necessidade de imunossupressão agressiva precoce'], nota: 'CK normal aqui não tranquiliza — é justamente o subtipo mais grave.' },
            { causa: 'Miopatia necrosante anti-HMGCR', etapas: ['exposição a estatina, embora possa ocorrer sem ela', 'CK muito elevada, frequentemente acima de 5.000', 'fraqueza proximal progressiva que persiste após suspender o fármaco', 'necessidade de imunossupressão'], nota: 'Difere da miotoxicidade simples por estatina, que melhora com a suspensão.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A avaliação do músculo', ids: ['ck', 'aldolase', 'ldh', 'ast'], leitura: 'CK e aldolase quantificam a lesão muscular; AST e LDH sobem junto e podem ser confundidas com hepatopatia — a GGT normal esclarece a origem muscular.' },
    ],
    advertencia:
      'Dermatomiosite no adulto exige rastreio de neoplasia oculta. CK normal não afasta miopatia inflamatória grave, especialmente na forma anti-MDA5.',
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['ck', 'aldolase', 'fan'],
  },

  {
    id: 'anca',
    nome: 'ANCA, anti-PR3 e anti-MPO',
    sigla: 'ANCA',
    sinonimos: ['anca', 'c-anca', 'p-anca', 'anti pr3', 'anti mpo', 'anticorpo anticitoplasma de neutrofilos'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'renal', 'respiratorio'],
    material: 'Soro',
    unidade: 'reagente/não reagente e UI/mL',
    referencias: [
      { rotulo: 'Imunofluorescência', texto: 'Não reagente (padrões c-ANCA e p-ANCA)', unidade: '' },
      { rotulo: 'Anti-PR3 (proteinase 3)', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anti-MPO (mieloperoxidase)', texto: 'Não reagente', unidade: '' },
    ],
    resumo:
      'Anticorpos contra grânulos do neutrófilo. Definem as vasculites de pequenos vasos e, junto com creatinina em ascensão e sedimento urinário ativo, identificam a emergência que é a glomerulonefrite rapidamente progressiva.',
    entenda:
      'O ANCA não é apenas marcador: ele ativa neutrófilos já pré-ativados por citocinas, fazendo-os aderir ao endotélio e degranular dentro do vaso. O resultado é necrose fibrinoide de capilares — no glomérulo, glomerulonefrite crescêntica; no pulmão, capilarite com hemorragia alveolar. A síndrome pulmão-rim que daí resulta é uma das poucas situações em que dias de atraso mudam o desfecho de forma irreversível.',
    aprofundar: [
      'A associação entre padrão e antígeno tem exceções que importam: c-ANCA corresponde tipicamente a anti-PR3 e à granulomatose com poliangiite; p-ANCA corresponde a anti-MPO e à poliangiite microscópica ou à granulomatose eosinofílica. Mas p-ANCA por imunofluorescência também aparece em doença inflamatória intestinal, colangite esclerosante e artrite reumatoide **sem** anti-MPO — por isso a confirmação por ELISA específico é obrigatória antes de qualquer conclusão.',
      'A tríade laboratorial que exige ação imediata é: creatinina em ascensão rápida, sedimento urinário com hematúria dismórfica e cilindros hemáticos, e ANCA positivo. Nesse cenário, a biópsia renal e o início de imunossupressão não devem aguardar; a perda de função glomerular em glomerulonefrite crescêntica torna-se irreversível em semanas.',
      'Um diferencial importante do ANCA induzido por fármaco: propiltiouracil, hidralazina, minociclina e cocaína adulterada com levamisol produzem ANCA — frequentemente com títulos muito altos de anti-MPO e positividade dupla para PR3 e MPO. A suspensão do agente é parte central do tratamento, e reconhecer isso evita imunossupressão prolongada desnecessária.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos dirigidos a enzimas dos grânulos azurófilos do neutrófilo: proteinase 3 e mieloperoxidase.',
      origem: 'Resposta autoimune contra constituintes do próprio neutrófilo.',
      funcao: 'Patogênicos: ativam neutrófilos primados, promovendo adesão endotelial, degranulação e formação de armadilhas extracelulares.',
      orgaosEnvolvidos: ['Rim', 'Pulmão', 'Vias aéreas superiores', 'Nervos periféricos'],
      percurso: [
        'Infecção ou inflamação prima o neutrófilo',
        'PR3 e MPO translocam para a superfície celular',
        'ANCA se liga ao antígeno exposto',
        'ativação do neutrófilo aderido ao endotélio',
        'degranulação intravascular e necrose fibrinoide',
        'glomerulonefrite crescêntica e capilarite pulmonar',
      ],
    },
    aumento: {
      resumo: 'Vasculite de pequenos vasos associada a ANCA — ou reatividade induzida por fármaco, ou p-ANCA inespecífico de doença inflamatória crônica.',
      mecanismos: [
        {
          titulo: 'Ativação neutrofílica mediada por autoanticorpo',
          explicacao: 'O anticorpo se liga ao antígeno translocado à superfície do neutrófilo primado, disparando degranulação dentro do vaso e destruindo a parede capilar.',
          exemplos: [
            { causa: 'Granulomatose com poliangiite', etapas: ['anti-PR3 (c-ANCA) reagente', 'acometimento de vias aéreas superiores, pulmão e rim', 'nódulos cavitados, sinusite destrutiva, glomerulonefrite', 'recidivas mais frequentes que na forma anti-MPO'] },
            { causa: 'Poliangiite microscópica', etapas: ['anti-MPO (p-ANCA) reagente', 'glomerulonefrite rapidamente progressiva', 'capilarite alveolar com hemorragia', 'menos manifestação de vias aéreas superiores'] },
            { causa: 'Granulomatose eosinofílica com poliangiite', etapas: ['asma de difícil controle e eosinofilia acentuada', 'ANCA positivo em cerca de metade dos casos', 'mononeurite múltipla e infiltrados pulmonares migratórios'], nota: 'ANCA negativo não afasta — a eosinofilia e a clínica é que conduzem.' },
            { causa: 'ANCA induzido por fármaco', etapas: ['propiltiouracil, hidralazina, minociclina, levamisol', 'títulos muito altos, por vezes dupla positividade PR3 e MPO', 'suspensão do agente como parte essencial do tratamento'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A emergência renal', ids: ['creatinina', 'eas', 'proteinuria', 'anti-membrana-basal'], leitura: 'ANCA positivo com creatinina subindo e sedimento ativo é glomerulonefrite rapidamente progressiva até prova em contrário. O anti-MBG deve ser pedido junto: há pacientes duplo-positivos, e o tratamento inclui plasmaférese.' },
      { titulo: 'Marcadores de atividade', ids: ['pcr', 'vhs', 'hemoglobina'], leitura: 'PCR e VHS acompanham a atividade; anemia normocítica de doença inflamatória é comum e melhora com o controle.' },
    ],
    advertencia:
      'Padrão p-ANCA por imunofluorescência sem anti-MPO confirmado por ELISA ocorre em doença inflamatória intestinal, artrite reumatoide e colangite esclerosante — e não indica vasculite.',
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['creatinina', 'eas', 'anti-membrana-basal', 'fan'],
  },

  {
    id: 'anti-membrana-basal',
    nome: 'Anticorpo antimembrana basal glomerular',
    sigla: 'Anti-MBG',
    sinonimos: ['anti mbg', 'anti gbm', 'anti membrana basal glomerular', 'goodpasture'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'renal', 'respiratorio'],
    material: 'Soro',
    unidade: 'U/mL',
    referencias: [{ rotulo: 'Resultado', texto: 'Não reagente', unidade: '' }],
    resumo:
      'Anticorpo contra o colágeno tipo IV da membrana basal do glomérulo e do alvéolo. Produz a doença de Goodpasture — e é um dos raros exames em que o atraso de dias custa o rim de forma definitiva.',
    entenda:
      'O alvo é o domínio não colagenoso da cadeia alfa-3 do colágeno IV, presente na membrana basal glomerular e na alveolar. O anticorpo se liga de forma linear e contínua ao longo dessa membrana — e é esse padrão linear na imunofluorescência da biópsia que dá o diagnóstico histológico. A lesão é rápida e destrutiva: glomerulonefrite crescêntica com perda de função em dias a semanas, e hemorragia alveolar que pode ser fatal antes da insuficiência renal.',
    aprofundar: [
      'A regra prática que vale memorizar: em toda síndrome pulmão-rim, peça anti-MBG **e** ANCA. Cerca de um terço dos pacientes com anti-MBG também tem ANCA positivo, e essa dupla positividade muda o prognóstico e a terapia — os duplo-positivos tendem a recidivar como vasculite ANCA depois de tratada a doença anti-MBG, e precisam de imunossupressão de manutenção prolongada.',
      'A plasmaférese tem papel central e urgente aqui, ao contrário da maioria das glomerulonefrites: o objetivo é remover o anticorpo circulante enquanto a imunossupressão bloqueia sua produção. O benefício depende criticamente do momento — pacientes que chegam já em diálise e com crescentes em quase todos os glomérulos raramente recuperam função renal.',
      'O tabagismo e a exposição a hidrocarbonetos são gatilhos reconhecidos da hemorragia alveolar: eles lesam a barreira alveolocapilar e expõem o antígeno ao anticorpo circulante. Isso explica por que alguns pacientes têm apenas doença renal e outros desenvolvem hemorragia pulmonar maciça com o mesmo anticorpo.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpo IgG contra o domínio NC1 da cadeia alfa-3 do colágeno tipo IV.',
      origem: 'Resposta autoimune após exposição do epítopo normalmente oculto na estrutura do colágeno.',
      funcao: 'Diretamente patogênico — a transferência passiva do anticorpo reproduz a doença.',
      orgaosEnvolvidos: ['Rim', 'Pulmão'],
      percurso: [
        'Exposição do epítopo NC1 por lesão ou fator ambiental',
        'produção de anti-MBG',
        'ligação linear à membrana basal glomerular e alveolar',
        'ativação de complemento e recrutamento de neutrófilos',
        'glomerulonefrite crescêntica e hemorragia alveolar',
      ],
    },
    aumento: {
      resumo: 'Doença antimembrana basal — glomerulonefrite rapidamente progressiva com ou sem hemorragia alveolar.',
      mecanismos: [
        {
          titulo: 'Agressão direta à membrana basal',
          explicacao: 'A ligação contínua do anticorpo ativa complemento e recruta neutrófilos ao longo de toda a membrana, produzindo ruptura capilar e formação de crescentes.',
          exemplos: [
            { causa: 'Doença de Goodpasture', etapas: ['anti-MBG reagente', 'hemoptise e infiltrados alveolares', 'creatinina em ascensão rápida com hematúria dismórfica', 'plasmaférese, corticoide e ciclofosfamida em caráter de urgência'], nota: 'A janela terapêutica é de dias — a função renal perdida não retorna.' },
            { causa: 'Dupla positividade anti-MBG e ANCA', etapas: ['ambos os anticorpos presentes', 'apresentação como doença anti-MBG', 'risco de recidiva tardia com padrão de vasculite ANCA', 'necessidade de manutenção imunossupressora prolongada'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A investigação da síndrome pulmão-rim', ids: ['anca', 'creatinina', 'eas', 'hemoglobina'], leitura: 'Anti-MBG e ANCA sempre juntos. Queda de hemoglobina com infiltrado pulmonar sugere hemorragia alveolar mesmo sem hemoptise.' },
    ],
    advertencia: 'Suspeita de doença antimembrana basal é emergência: a investigação e o início do tratamento não devem aguardar resultados de rotina.',
    utilidade: ['diagnostico'],
    estudarTambem: ['anca', 'creatinina', 'eas'],
  },

  {
    id: 'anti-ccp',
    nome: 'Anticorpo antipeptídeo citrulinado cíclico',
    sigla: 'Anti-CCP',
    sinonimos: ['anti ccp', 'accp', 'anti peptideo citrulinado', 'acpa'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'musculoesqueletico'],
    material: 'Soro',
    unidade: 'U/mL',
    referencias: [
      { rotulo: 'Adultos', texto: '< 20', unidade: 'U/mL' },
      { rotulo: 'Título alto', texto: '> 60', unidade: 'U/mL', observacao: 'Títulos altos associam-se a doença erosiva e manifestações extra-articulares.' },
    ],
    resumo:
      'Anticorpo contra proteínas citrulinadas. Mais específico que o fator reumatoide para artrite reumatoide, aparece anos antes dos sintomas e prediz doença erosiva.',
    entenda:
      'A citrulinação é uma modificação pós-traducional normal em que a arginina vira citrulina. Em indivíduos geneticamente predispostos — sobretudo portadores do epítopo compartilhado do HLA-DRB1 — proteínas citrulinadas passam a ser reconhecidas como estranhas. O tabagismo e a doença periodontal aumentam a citrulinação em mucosas e são fatores de risco estabelecidos, o que dá a este anticorpo uma história causal ambiental incomumente bem documentada.',
    aprofundar: [
      'A comparação com o fator reumatoide organiza o uso dos dois: sensibilidades semelhantes, mas o anti-CCP tem especificidade muito superior. O fator reumatoide aparece em hepatite C, Sjögren, endocardite, sarcoidose e em parcela crescente de idosos saudáveis; o anti-CCP praticamente não. Quando os dois são positivos, a probabilidade de artrite reumatoide é muito alta e o prognóstico é de doença mais agressiva.',
      'O anticorpo pode ser detectado anos antes do primeiro sintoma articular. Isso mudou o entendimento da doença: existe uma fase pré-clínica de autoimunidade estabelecida, e a artrite é o desfecho tardio de um processo iniciado nas mucosas. Em pacientes com artralgia sem sinovite e anti-CCP positivo, o risco de progressão para artrite estabelecida é substancial e justifica seguimento próximo.',
      'A relevância prognóstica é o que sustenta o pedido: positividade, especialmente em título alto, prediz erosões e pior desfecho funcional, e favorece o início precoce de droga modificadora de doença. Como o dano articular estrutural é irreversível, a decisão terapêutica precoce baseada nesse marcador tem impacto real e mensurável.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos dirigidos a resíduos de citrulina em proteínas modificadas pela peptidil-arginina deiminase.',
      origem: 'Provavelmente iniciados em mucosas — pulmonar (tabagismo) e periodontal.',
      funcao: 'Formam imunocomplexos que ativam complemento e osteoclastos na sinóvia.',
      orgaosEnvolvidos: ['Sinóvia', 'Pulmão', 'Periodonto'],
      percurso: [
        'Tabagismo ou periodontite aumentam a citrulinação em mucosa',
        'apresentação de peptídeos citrulinados no contexto do epítopo compartilhado',
        'produção de anti-CCP anos antes do sintoma',
        'imunocomplexos na sinóvia',
        'ativação de osteoclastos e erosão óssea',
      ],
    },
    aumento: {
      resumo: 'Artrite reumatoide — presente e futura. Poucas outras condições o produzem.',
      mecanismos: [
        {
          titulo: 'Autorreatividade contra proteínas citrulinadas',
          explicacao: 'Uma vez estabelecida, a resposta se amplifica na sinóvia, onde a citrulinação é abundante, e os imunocomplexos ativam diretamente os osteoclastos.',
          exemplos: [
            { causa: 'Artrite reumatoide estabelecida', etapas: ['anti-CCP reagente em título alto', 'sinovite simétrica de pequenas articulações', 'erosões marginais precoces', 'indicação de tratamento modificador de doença sem demora'] },
            { causa: 'Fase pré-clínica', etapas: ['anti-CCP positivo anos antes do sintoma', 'artralgia sem sinovite detectável', 'risco elevado de progressão', 'seguimento clínico próximo'] },
            { causa: 'Doença pulmonar intersticial associada', etapas: ['títulos altos com tabagismo', 'acometimento pulmonar por vezes anterior ao articular'], nota: 'Fibrose pulmonar com anti-CCP positivo deve levantar a hipótese de artrite reumatoide ainda sem artrite.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O par sorológico', ids: ['fator-reumatoide', 'pcr', 'vhs'], leitura: 'Anti-CCP e fator reumatoide positivos juntos indicam doença mais agressiva; PCR e VHS medem atividade, não diagnóstico.' },
    ],
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['fator-reumatoide', 'pcr', 'fan'],
  },

  {
    id: 'anticorpos-antifosfolipide',
    nome: 'Anticorpos antifosfolípide (anticoagulante lúpico, anticardiolipina, anti-β2-glicoproteína I)',
    sigla: 'SAF',
    sinonimos: ['anticoagulante lupico', 'anticardiolipina', 'anti beta 2 glicoproteina', 'sindrome antifosfolipide', 'saf', 'anticorpos antifosfolipides'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'cardiovascular'],
    material: 'Soro (ELISA) e plasma citratado (anticoagulante lúpico)',
    unidade: 'GPL/MPL, U/mL e razão',
    referencias: [
      { rotulo: 'Anticardiolipina IgG e IgM', texto: '< 40 GPL ou MPL (título médio a alto é o que tem valor)', unidade: 'GPL/MPL' },
      { rotulo: 'Anti-β2-glicoproteína I', texto: '< 20', unidade: 'U/mL' },
      { rotulo: 'Anticoagulante lúpico', texto: 'Ausente', unidade: '' },
      { rotulo: 'Confirmação', texto: 'Positividade persistente em duas ocasiões com pelo menos 12 semanas de intervalo', unidade: '', observacao: 'Um único resultado positivo nunca estabelece o diagnóstico.' },
    ],
    resumo:
      'O grupo de anticorpos que causa trombose e perda gestacional. Chama-se "anticoagulante" lúpico por prolongar o TTPa no tubo — e produz exatamente o oposto no paciente.',
    entenda:
      'O nome anticoagulante lúpico é um dos mais enganosos da medicina laboratorial. O anticorpo se liga a fosfolipídios usados como reagente no teste de coagulação, prolongando o TTPa in vitro. No organismo, no entanto, ele se liga à β2-glicoproteína I na superfície endotelial e plaquetária e promove ativação, expressão de fator tecidual e trombose. Um TTPa prolongado que não corrige com plasma normal em paciente sem sangramento deve levantar essa hipótese, não a de coagulopatia.',
    aprofundar: [
      'O diagnóstico exige persistência: positividade confirmada em duas ocasiões separadas por pelo menos 12 semanas. Isso não é formalidade burocrática — anticorpos antifosfolípide aparecem transitoriamente após infecções, sobretudo virais, e em uso de alguns fármacos, sem qualquer risco trombótico. Diagnosticar síndrome antifosfolípide com um único exame condena o paciente a anticoagulação vitalícia possivelmente desnecessária.',
      'A tripla positividade — anticoagulante lúpico, anticardiolipina e anti-β2-glicoproteína I todos positivos — identifica o subgrupo de maior risco trombótico e de recorrência. É a informação que mais pesa na decisão sobre intensidade e duração da anticoagulação.',
      'Uma questão prática relevante: os anticoagulantes orais diretos mostraram-se inferiores à varfarina na síndrome antifosfolípide, especialmente nos triplo-positivos e nos casos de trombose arterial. Além disso, tanto anticoagulantes orais diretos quanto heparina interferem no teste do anticoagulante lúpico e podem produzir falso-positivo — o exame deve ser colhido, sempre que possível, fora do uso desses fármacos.',
      'Na obstetrícia, a síndrome se manifesta como perdas gestacionais de repetição, óbito fetal após a 10ª semana, pré-eclâmpsia grave precoce e insuficiência placentária. O reconhecimento muda o desfecho: aspirina e heparina de baixo peso molecular aumentam substancialmente a taxa de nascidos vivos.',
    ],
    fisiologia: {
      oQueE: 'Família de autoanticorpos dirigidos a complexos de proteínas ligadoras de fosfolipídios, sobretudo a β2-glicoproteína I.',
      origem: 'Resposta autoimune primária ou associada a lúpus e outras conectivopatias.',
      funcao: 'Patogênicos: ativam endotélio, plaquetas e complemento, deslocam anticoagulantes naturais e induzem estado pró-trombótico.',
      orgaosEnvolvidos: ['Endotélio', 'Placenta', 'Sistema nervoso central'],
      percurso: [
        'Anticorpo liga-se à β2-glicoproteína I na superfície celular',
        'ativação de endotélio e plaquetas',
        'expressão de fator tecidual e ativação do complemento',
        'estado pró-trombótico',
        'trombose venosa, arterial ou insuficiência placentária',
      ],
    },
    aumento: {
      resumo: 'Síndrome antifosfolípide — ou positividade transitória pós-infecciosa, que não é doença.',
      significado: 'Positividade persistente com evento clínico (trombose ou morbidade gestacional) define a síndrome; positividade sem evento é apenas um fator de risco.',
      mecanismos: [
        {
          titulo: 'Ativação celular mediada por anticorpo',
          explicacao: 'A ligação à β2-glicoproteína I em superfícies celulares dispara sinalização pró-inflamatória e pró-coagulante, além de interferir na via da proteína C.',
          exemplos: [
            { causa: 'Trombose venosa profunda ou embolia pulmonar em jovem', etapas: ['anticorpos persistentemente positivos', 'ativação endotelial e plaquetária', 'trombose sem outro fator de risco', 'anticoagulação prolongada indicada'] },
            { causa: 'Morbidade gestacional', etapas: ['trombose e inflamação da microcirculação placentária', 'perdas recorrentes, óbito fetal, pré-eclâmpsia precoce', 'aspirina e heparina melhoram o desfecho'] },
            { causa: 'Síndrome antifosfolípide catastrófica', etapas: ['trombose de múltiplos pequenos vasos em dias', 'falência de três ou mais órgãos', 'plaquetopenia e microangiopatia', 'emergência com mortalidade elevada'] },
            { causa: 'Positividade transitória pós-infecciosa', etapas: ['infecção viral ou bacteriana recente', 'anticardiolipina IgM em título baixo', 'negativação em semanas', 'sem risco trombótico'], nota: 'Por isso a confirmação após 12 semanas é obrigatória.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O achado que levanta a suspeita', ids: ['ttpa', 'plaquetas', 'vdrl'], leitura: 'TTPa prolongado sem sangramento, plaquetopenia leve e VDRL falso-reagente formam um trio clássico que aponta para anticorpos antifosfolípide.' },
      { titulo: 'No contexto do lúpus', ids: ['fan', 'anti-dna-nativo'], leitura: 'Cerca de um terço dos pacientes com lúpus tem anticorpos antifosfolípide, e sua presença muda o manejo de gestação e de cirurgias.' },
    ],
    advertencia:
      'Um único resultado positivo não estabelece o diagnóstico. Heparina e anticoagulantes orais diretos interferem no teste do anticoagulante lúpico e devem ser considerados na interpretação.',
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['ttpa', 'plaquetas', 'fan'],
  },

  {
    id: 'c4',
    nome: 'Complemento C4 e CH50/AH50',
    sigla: 'C4',
    sinonimos: ['c4', 'complemento c4', 'ch50', 'ah50', 'complemento hemolitico total', 'atividade hemolitica do complemento'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico'],
    material: 'Soro (processamento rápido e congelamento)',
    unidade: 'mg/dL e U/mL',
    referencias: [
      { rotulo: 'C4', minimo: 10, maximo: 40, unidade: 'mg/dL' },
      { rotulo: 'CH50 (via clássica)', minimo: 30, maximo: 75, unidade: 'U/mL' },
      { rotulo: 'AH50 (via alternativa)', texto: 'Faixa dependente do método', unidade: 'U/mL' },
    ],
    resumo:
      'C4 é o componente da via clássica que cai primeiro quando imunocomplexos consomem complemento. CH50 e AH50 testam a integridade funcional de cada via inteira — e são os exames que identificam deficiências de componentes terminais.',
    entenda:
      'A lógica do complemento é mais simples do que parece quando organizada por via. A via clássica, ativada por imunocomplexos, consome C4 e depois C3. A via alternativa, ativada por superfícies microbianas e por autoanticorpos como o fator nefrítico C3, consome C3 mantendo o C4 normal. Por isso a combinação de C3 e C4 diz **qual via** foi ativada — informação que separa lúpus (as duas caem) de glomerulonefrite pós-estreptocócica ou glomerulopatia por C3 (só o C3 cai).',
    aprofundar: [
      'O CH50 e o AH50 respondem uma pergunta diferente das dosagens individuais: eles medem se a cascata inteira funciona, do início ao complexo de ataque à membrana. Um CH50 indetectável com C3 e C4 normais é a assinatura de deficiência de um componente terminal (C5 a C9) — e essa deficiência tem consequência clínica precisa: infecção meningocócica de repetição, frequentemente por sorogrupos incomuns. Identificar isso muda a vida do paciente, porque a vacinação amplia a proteção.',
      'Deficiências dos componentes iniciais da via clássica — C1q, C4, C2 — não causam infecção meningocócica: causam lúpus. A explicação é elegante e vale entender: o complemento inicial é essencial para a depuração de imunocomplexos e de restos apoptóticos. Sem ele, material nuclear se acumula, é apresentado ao sistema imune e a autoimunidade se instala. A deficiência de C1q é a condição com maior penetrância conhecida para lúpus.',
      'Uma armadilha pré-analítica séria: o complemento é lábil. Soro deixado em temperatura ambiente por horas perde atividade, e o CH50 vem falsamente baixo. Antes de investigar deficiência de complemento, é preciso confirmar que a amostra foi processada e congelada adequadamente — a repetição com coleta cuidadosa resolve a maioria dos "resultados alterados".',
      'O C4 tem ainda um uso específico e barato: é o exame de triagem do angioedema hereditário, permanecendo baixo mesmo fora das crises pelo consumo contínuo.',
    ],
    fisiologia: {
      oQueE: 'C4 é uma proteína da via clássica; CH50 e AH50 são ensaios funcionais que medem a capacidade de lisar hemácias-alvo pela via clássica e pela alternativa.',
      origem: 'Fígado, principalmente; também macrófagos e células endoteliais.',
      funcao: 'Opsonização, quimiotaxia, lise de patógenos e depuração de imunocomplexos e restos apoptóticos.',
      orgaosEnvolvidos: ['Fígado', 'Sistema mononuclear fagocitário'],
      percurso: [
        'Imunocomplexo ativa C1',
        'clivagem de C4 e C2 formando a C3-convertase clássica',
        'clivagem de C3',
        'via terminal C5 a C9 e complexo de ataque à membrana',
        'consumo dos componentes reduz suas concentrações séricas',
      ],
    },
    aumento: {
      resumo: 'Reagente de fase aguda — sobe modestamente na inflamação, sem valor diagnóstico próprio.',
      mecanismos: [
        {
          titulo: 'Resposta de fase aguda',
          explicacao: 'A síntese hepática de C3 e C4 aumenta em estados inflamatórios, o que pode mascarar consumo simultâneo.',
          exemplos: [
            { causa: 'Inflamação sistêmica', etapas: ['aumento da síntese hepática', 'C3 e C4 normais ou altos', 'possível consumo concomitante mascarado'], nota: 'Em paciente com lúpus e infecção, um C4 "normal" pode representar consumo compensado por síntese aumentada — a tendência do próprio paciente é o que informa.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Consumo por imunocomplexos, deficiência genética ou falha de síntese hepática.',
      mecanismos: [
        {
          titulo: 'Consumo pela via clássica',
          explicacao: 'Imunocomplexos ativam C1 e consomem C4 e C2 antes de C3 — daí o C4 ser o primeiro a cair.',
          exemplos: [
            { causa: 'Nefrite lúpica em atividade', etapas: ['imunocomplexos depositados no glomérulo', 'ativação da via clássica', 'C4 ↓ e depois C3 ↓', 'anti-dsDNA ↑ e proteinúria ↑'], nota: 'Queda de C4 costuma preceder a de C3 e a piora clínica.' },
            { causa: 'Crioglobulinemia mista', etapas: ['imunocomplexos crioprecipitáveis, frequentemente ligados à hepatite C', 'consumo intenso de C4 — muitas vezes indetectável', 'C3 relativamente preservado'], nota: 'C4 muito baixo com C3 quase normal é bastante sugestivo de crioglobulinemia.' },
            { causa: 'Angioedema hereditário', etapas: ['C1-inibidor deficiente', 'ativação contínua e não regulada de C1', 'C4 persistentemente ↓ mesmo entre crises'], nota: 'É o exame de triagem barato e disponível para essa condição.' },
          ],
        },
        {
          titulo: 'Consumo pela via alternativa',
          explicacao: 'A via alternativa consome C3 diretamente, poupando C4 — e essa dissociação identifica o mecanismo.',
          exemplos: [
            { causa: 'Glomerulonefrite pós-estreptocócica', etapas: ['ativação predominante da via alternativa', 'C3 ↓ com C4 normal', 'normalização do C3 em 6 a 8 semanas'], nota: 'C3 que não normaliza nesse prazo obriga a rever o diagnóstico.' },
            { causa: 'Glomerulopatia por C3 e fator nefrítico', etapas: ['autoanticorpo estabiliza a C3-convertase alternativa', 'consumo persistente de C3', 'C4 normal', 'hipocomplementemia crônica'] },
          ],
        },
        {
          titulo: 'Deficiência genética',
          explicacao: 'A falta congênita de um componente produz padrões característicos conforme a posição na cascata.',
          exemplos: [
            { causa: 'Deficiência de componente terminal (C5 a C9)', etapas: ['CH50 indetectável com C3 e C4 normais', 'infecções meningocócicas de repetição, por vezes por sorogrupos incomuns', 'indicação de vacinação ampliada'] },
            { causa: 'Deficiência de C1q, C2 ou C4', etapas: ['depuração deficiente de imunocomplexos e restos apoptóticos', 'lúpus de início precoce e alta penetrância'], nota: 'Aqui a falta de complemento causa autoimunidade, não infecção.' },
          ],
        },
      ],
    },
    comparacoes: [
      {
        id: 'padrao-de-complemento',
        titulo: 'C3 e C4: qual via foi ativada?',
        pergunta: 'Glomerulonefrite com complemento baixo — o que a combinação de C3 e C4 diz sobre o mecanismo?',
        hipoteses: ['Nefrite lúpica', 'Pós-estreptocócica', 'Crioglobulinemia', 'Glomerulopatia por C3'],
        linhas: [
          { marcador: 'C3', celulas: ['↓', '↓↓', 'normal ou ↓', '↓↓'] },
          { marcador: 'C4', celulas: ['↓↓', 'normal', '↓↓↓', 'normal'] },
          { marcador: 'Via ativada', celulas: ['clássica', 'alternativa', 'clássica', 'alternativa'] },
          { marcador: 'Evolução do complemento', celulas: ['acompanha atividade', 'normaliza em 6–8 semanas', 'persistentemente baixo', 'persistentemente baixo'] },
        ],
        leitura:
          'C4 baixo aponta para consumo pela via clássica — imunocomplexos, como no lúpus e na crioglobulinemia. C4 normal com C3 baixo aponta para a via alternativa, como na pós-estreptocócica e na glomerulopatia por C3. A evolução no tempo separa as duas últimas: a pós-estreptocócica normaliza, a glomerulopatia por C3 não.',
        limites: 'Complemento normal não exclui glomerulonefrite: nefropatia por IgA, vasculite ANCA e doença anti-MBG cursam com complemento normal.',
      },
    ],
    relacionados: [
      { titulo: 'A leitura conjunta', ids: ['complemento-c3', 'anti-dna-nativo', 'proteinuria'], leitura: 'No lúpus, complemento em queda com anti-dsDNA em ascensão e proteinúria crescente antecipa a reativação renal.' },
      { titulo: 'Na triagem de angioedema', ids: ['c1-inibidor'], leitura: 'C4 baixo persistente entre crises é o rastreio; o C1-inibidor funcional confirma.' },
    ],
    interferentes: {
      preAnalitico: ['O complemento é lábil: demora no processamento ou armazenamento inadequado reduz o CH50 sem doença. Confirme a qualidade da amostra antes de investigar deficiência.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['complemento-c3', 'anti-dna-nativo', 'c1-inibidor'],
  },

  {
    id: 'crioglobulinas',
    nome: 'Crioglobulinas',
    sinonimos: ['crioglobulinas', 'criocrito', 'crioglobulinemia'],
    grupo: 'autoimunidade',
    sistemas: ['imunologico', 'renal'],
    material: 'Soro coletado e transportado a 37 °C',
    unidade: 'criócrito (%) e tipo',
    referencias: [{ rotulo: 'Resultado', texto: 'Ausentes', unidade: '', observacao: 'A coleta exige tubo pré-aquecido e transporte a 37 °C — qualquer resfriamento antes da separação do soro produz falso-negativo.' }],
    resumo:
      'Imunoglobulinas que precipitam no frio e se redissolvem no calor. Sua pesquisa é o exame mais fácil de perder por erro pré-analítico de toda a imunologia laboratorial.',
    entenda:
      'Se o sangue esfria antes de o soro ser separado, as crioglobulinas precipitam junto com o coágulo e são descartadas — o resultado sai negativo em um paciente que as tem em abundância. Por isso o exame exige tubo pré-aquecido, transporte em recipiente a 37 °C e separação do soro ainda quente. Quando há suspeita clínica forte e o resultado vem negativo, a primeira hipótese é erro de coleta, não ausência da doença.',
    aprofundar: [
      'A classificação por tipo orienta a investigação da causa. O tipo I é uma imunoglobulina monoclonal isolada e aponta para gamopatia ou linfoproliferação, manifestando-se por hiperviscosidade e isquemia digital. Os tipos II e III são mistos, com componente de fator reumatoide, e produzem vasculite de pequenos vasos: púrpura palpável, artralgia, neuropatia periférica e glomerulonefrite membranoproliferativa.',
      'A associação com hepatite C é a mais importante na prática: o vírus é responsável pela maioria das crioglobulinemias mistas, e o tratamento antiviral eficaz frequentemente resolve a vasculite. Isso transformou uma doença tratada com imunossupressão numa doença tratada etiologicamente — todo paciente com crioglobulinemia mista deve ter anti-HCV e carga viral pesquisados.',
      'O padrão de complemento ajuda: C4 muito baixo, por vezes indetectável, com C3 relativamente preservado, é bastante característico. Somado a fator reumatoide positivo e púrpura em membros inferiores, compõe um quadro reconhecível antes mesmo do resultado da crioglobulina.',
    ],
    fisiologia: {
      oQueE: 'Imunoglobulinas séricas que precipitam reversivelmente a temperaturas abaixo de 37 °C.',
      origem: 'Clones de linfócitos B, frequentemente estimulados cronicamente pelo vírus da hepatite C.',
      funcao: 'Nenhuma — formam imunocomplexos que se depositam em pequenos vasos.',
      orgaosEnvolvidos: ['Pele', 'Rim', 'Nervos periféricos'],
      percurso: [
        'Estímulo antigênico crônico (tipicamente HCV)',
        'expansão de clones B produtores de fator reumatoide monoclonal',
        'formação de imunocomplexos crioprecipitáveis',
        'deposição em pequenos vasos com consumo de C4',
        'púrpura, neuropatia e glomerulonefrite',
      ],
    },
    aumento: {
      resumo: 'Presença de crioglobulinas indica gamopatia monoclonal (tipo I) ou vasculite crioglobulinêmica associada a infecção ou autoimunidade (tipos II e III).',
      mecanismos: [
        {
          titulo: 'Formação de imunocomplexos crioprecipitáveis',
          explicacao: 'Estímulo antigênico crônico gera imunoglobulinas com propriedade de fator reumatoide, que formam complexos insolúveis no frio e se depositam em vasos de pequeno calibre.',
          exemplos: [
            { causa: 'Crioglobulinemia mista associada à hepatite C', etapas: ['estímulo crônico de células B pelo HCV', 'crioglobulinas tipo II', 'púrpura palpável, artralgia, neuropatia', 'glomerulonefrite membranoproliferativa com C4 muito baixo'], nota: 'O tratamento antiviral resolve a vasculite na maioria dos casos.' },
            { causa: 'Crioglobulinemia tipo I por gamopatia monoclonal', etapas: ['imunoglobulina monoclonal isolada', 'precipitação em extremidades frias', 'isquemia digital, livedo, necrose', 'investigação de mieloma ou Waldenström'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A investigação obrigatória', ids: ['anti-hcv', 'carga-viral-hcv', 'c4', 'fator-reumatoide'], leitura: 'Crioglobulinemia mista pede hepatite C imediatamente; C4 muito baixo com C3 preservado e fator reumatoide positivo reforçam o quadro.' },
      { titulo: 'Quando o tipo é monoclonal', ids: ['eletroforese-proteinas', 'imunofixacao'], leitura: 'Tipo I obriga investigação de gamopatia monoclonal e de doença linfoproliferativa.' },
    ],
    advertencia:
      'Resultado negativo com suspeita clínica forte significa, na maioria das vezes, erro de coleta. Repita com tubo pré-aquecido e transporte a 37 °C antes de descartar o diagnóstico.',
    interferentes: {
      preAnalitico: ['Resfriamento da amostra antes da separação do soro é a causa quase universal de falso-negativo.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['c4', 'anti-hcv', 'fator-reumatoide'],
  },
]
