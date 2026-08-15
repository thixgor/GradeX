import type { Marcador } from '../tipos'

/**
 * Hepatologia — segunda linha.
 *
 * As transaminases dizem que o hepatócito está se rompendo; a fosfatase
 * alcalina diz que a via biliar está obstruída. Nenhuma das duas diz se o
 * fígado **funciona**. Este arquivo reúne os exames que respondem as perguntas
 * seguintes: a colestase é hepática ou óssea (5’-nucleotidase)? A capacidade
 * de síntese está preservada (colinesterase)? Qual é a causa (ceruloplasmina,
 * alfa-1-antitripsina, autoanticorpos)? Há fibrose (escores derivados de
 * exames que já estão na rotina)?
 *
 * A última pergunta merece nota: APRI e FIB-4 se calculam com AST, ALT,
 * plaquetas e idade — dados que praticamente todo paciente já tem. Eles não
 * substituem elastografia nem biópsia, mas identificam quem quase certamente
 * não tem fibrose avançada e quem precisa de investigação. É a forma mais
 * barata de estadiamento hepático que existe.
 */
export const marcadores: Marcador[] = [
  {
    id: 'nucleotidase-5',
    nome: "5'-nucleotidase",
    sigla: "5'NT",
    sinonimos: ['5 nucleotidase', "5'-nucleotidase", '5nt', 'nucleotidase'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [{ rotulo: 'Adultos', minimo: 2, maximo: 15, unidade: 'U/L' }],
    resumo:
      "Enzima da membrana canalicular que sobe na colestase e não sobe na doença óssea. Resolve, com uma dosagem, a dúvida de origem de uma fosfatase alcalina elevada.",
    entenda:
      'A fosfatase alcalina existe em isoformas hepática, óssea, intestinal e placentária, e o exame de rotina mede a soma. Uma elevação isolada, portanto, pode vir do fígado ou do osso — e essa distinção muda toda a investigação. A 5’-nucleotidase é praticamente restrita ao fígado: se ela acompanha a fosfatase alcalina, a origem é hepatobiliar; se está normal, a origem é óssea.',
    aprofundar: [
      'A GGT cumpre a mesma função discriminadora e é muito mais disponível, o que explica por que a 5’-nucleotidase é pouco pedida no Brasil. Mas a GGT tem uma desvantagem importante: ela é induzida por álcool, fenitoína, carbamazepina e barbitúricos, subindo sem colestase. Nesses pacientes, a 5’-nucleotidase é o discriminador mais confiável — e é exatamente aí que ela ganha da GGT.',
      'Em gestantes, a fosfatase alcalina sobe fisiologicamente pela isoforma placentária, o que pode simular colestase. A 5’-nucleotidase permanece normal, e o par resolve a dúvida sem exames de imagem.',
      'Em crianças e adolescentes, a fosfatase alcalina é fisiologicamente alta pelo crescimento ósseo, com valores que assustariam num adulto. Uma 5’-nucleotidase ou GGT normais nesse contexto encerram a investigação.',
    ],
    fisiologia: {
      oQueE: 'Enzima ligada à membrana plasmática, especialmente à face canalicular do hepatócito, que hidrolisa nucleotídeos 5’-monofosfato.',
      origem: 'Fígado, predominantemente; presente em menor grau em outros tecidos, mas sem contribuição sérica relevante.',
      funcao: 'Hidrólise de nucleotídeos extracelulares, gerando adenosina.',
      eliminacao: 'Depuração hepática.',
      orgaosEnvolvidos: ['Fígado', 'Vias biliares'],
      percurso: [
        'Enzima ancorada na membrana canalicular',
        'sais biliares retidos solubilizam a membrana',
        'liberação da enzima na circulação',
        "5'NT sérica ↑ acompanhando a fosfatase alcalina hepática",
      ],
    },
    aumento: {
      resumo: 'Colestase intra ou extra-hepática, infiltração hepática — e praticamente nada mais.',
      mecanismos: [
        {
          titulo: 'Solubilização da membrana canalicular pelos sais biliares',
          explicacao: 'A retenção de sais biliares age como detergente sobre a membrana canalicular, liberando as enzimas ali ancoradas — o mesmo mecanismo da fosfatase alcalina hepática e da GGT.',
          exemplos: [
            { causa: 'Coledocolitíase, neoplasia periampular, colangite esclerosante', etapas: ['obstrução ao fluxo biliar', 'retenção de sais biliares', 'liberação enzimática canalicular', "5'NT e fosfatase alcalina ↑ em paralelo"] },
            { causa: 'Colestase intra-hepática por fármaco ou por colangite biliar primária', etapas: ['lesão de pequenos ductos', 'colestase sem dilatação à imagem', "5'NT ↑ com fosfatase alcalina ↑ e bilirrubina inicialmente normal"] },
            { causa: 'Metástases hepáticas e doenças infiltrativas', etapas: ['compressão de ductos intra-hepáticos', 'colestase segmentar', "elevação de fosfatase alcalina e 5'NT com bilirrubina normal"], nota: 'Fosfatase alcalina alta com bilirrubina normal em paciente oncológico deve levar a imagem hepática.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A dúvida que este exame resolve', ids: ['fosfatase-alcalina', 'ggt', 'calcio', 'pth'], leitura: "Fosfatase alcalina alta com 5'NT e GGT normais aponta para osso — e aí cálcio, fósforo e PTH conduzem a investigação." },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['fosfatase-alcalina', 'ggt', 'acidos-biliares'],
  },

  {
    id: 'acidos-biliares',
    nome: 'Ácidos biliares séricos',
    sigla: 'AB',
    sinonimos: ['acidos biliares', 'sais biliares', 'acidos biliares totais', 'colestase gestacional'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Soro em jejum',
    unidade: 'µmol/L',
    referencias: [
      { rotulo: 'Adultos em jejum', texto: '< 10', unidade: 'µmol/L' },
      { rotulo: 'Colestase intra-hepática da gestação', texto: '≥ 10', unidade: 'µmol/L' },
      { rotulo: 'Risco fetal elevado', texto: '≥ 100', unidade: 'µmol/L', observacao: 'Associa-se a aumento marcante do risco de óbito fetal e altera o momento do parto.' },
    ],
    resumo:
      'O exame que define a colestase intra-hepática da gestação — uma condição em que o risco não é materno e sim fetal, e em que o valor do marcador orienta o momento do parto.',
    entenda:
      'Os ácidos biliares são sintetizados no fígado a partir do colesterol, secretados na bile e reabsorvidos no íleo terminal, retornando ao fígado pela circulação êntero-hepática. Praticamente nada escapa para a circulação sistêmica em condições normais. Quando há colestase, eles se acumulam no sangue — e é essa elevação que causa o prurido característico, frequentemente noturno e palmoplantar, que precede qualquer alteração de bilirrubina.',
    aprofundar: [
      'A colestase intra-hepática da gestação é o cenário em que este exame é insubstituível. Ela ocorre no terceiro trimestre, cursa com prurido intenso sem lesão cutânea primária, e as transaminases podem estar apenas discretamente alteradas. O risco relevante é fetal: sofrimento agudo, prematuridade, mecônio e óbito intraútero. E — o ponto crucial — esse risco se correlaciona com o nível de ácidos biliares, não com a intensidade do prurido nem com as transaminases. Valores acima de 100 µmol/L justificam antecipação do parto.',
      'A elevação pós-prandial é fisiológica e substancial: a contração da vesícula libera ácidos biliares que transbordam para a circulação sistêmica. Por isso a coleta em jejum é obrigatória — um valor alto colhido após refeição não significa colestase.',
      'Fora da gestação, os ácidos biliares são um marcador sensível e precoce de colestase e de disfunção hepatocelular, mas seu uso é limitado porque exames mais disponíveis respondem as mesmas perguntas. A exceção é a investigação de prurido colestático com fosfatase alcalina ainda normal, em que eles se alteram primeiro.',
    ],
    fisiologia: {
      oQueE: 'Ácidos cólico e quenodesoxicólico e seus conjugados, produtos finais do catabolismo do colesterol.',
      origem: 'Hepatócito.',
      sintese: 'A partir do colesterol, pela via da 7-alfa-hidroxilase.',
      funcao: 'Emulsificar lipídios e permitir a absorção de gorduras e vitaminas lipossolúveis; atuam também como moléculas sinalizadoras via receptor FXR.',
      metabolismo: 'Circulação êntero-hepática: mais de 95% são reabsorvidos no íleo terminal e retornam ao fígado.',
      orgaosEnvolvidos: ['Fígado', 'Vesícula biliar', 'Íleo terminal'],
      percurso: [
        'Colesterol convertido em ácidos biliares no hepatócito',
        'conjugação e secreção na bile',
        'armazenamento vesicular e liberação pós-prandial',
        'emulsificação de gorduras no intestino',
        'reabsorção ileal e retorno portal ao fígado',
      ],
    },
    aumento: {
      resumo: 'Colestase de qualquer origem, disfunção hepatocelular ou shunt portossistêmico — e, fisiologicamente, o período pós-prandial.',
      mecanismos: [
        {
          titulo: 'Falha na captação e secreção hepática',
          explicacao: 'Quando o hepatócito não capta os ácidos biliares que retornam pela veia porta, ou não consegue secretá-los na bile, eles transbordam para a circulação sistêmica.',
          exemplos: [
            { causa: 'Colestase intra-hepática da gestação', etapas: ['estrogênio e progesterona no terceiro trimestre reduzem o transporte canalicular', 'predisposição genética em transportadores biliares', 'ácidos biliares séricos ↑', 'prurido palmoplantar noturno e risco fetal proporcional ao nível'], nota: 'O risco fetal segue o nível de ácidos biliares — não o prurido nem as transaminases.' },
            { causa: 'Obstrução biliar e colangite biliar primária', etapas: ['fluxo biliar comprometido', 'refluxo de ácidos biliares para o sangue', 'prurido antes da icterícia'] },
            { causa: 'Cirrose com shunt portossistêmico', etapas: ['sangue portal desvia do parênquima hepático', 'captação de primeira passagem reduzida', 'ácidos biliares ↑ mesmo sem colestase obstrutiva'], nota: 'É um marcador sensível de disfunção hepatocelular global.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na gestação com prurido', ids: ['alt', 'ast', 'bilirrubina-total', 'inr'], leitura: 'Transaminases podem estar pouco alteradas e a bilirrubina normal — os ácidos biliares são o exame que define diagnóstico e risco.' },
    ],
    advertencia: 'Colheita em jejum é obrigatória: a elevação pós-prandial fisiológica é substancial e produz falso-positivo.',
    interferentes: {
      preAnalitico: ['Coleta pós-prandial eleva fisiologicamente.'],
      medicamentos: ['Ácido ursodesoxicólico altera o perfil e o total dosado.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['fosfatase-alcalina', 'ggt', 'bilirrubina-total'],
  },

  {
    id: 'colinesterase',
    nome: 'Colinesterase sérica (pseudocolinesterase)',
    sigla: 'BChE',
    sinonimos: ['colinesterase', 'pseudocolinesterase', 'butirilcolinesterase', 'bche', 'colinesterase serica'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'toxicologico'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [{ rotulo: 'Adultos', minimo: 5300, maximo: 12900, unidade: 'U/L', observacao: 'Faixa dependente do método; a comparação seriada exige o mesmo laboratório.' }],
    resumo:
      'Enzima de síntese hepática com três usos distintos: medir capacidade de síntese do fígado, detectar intoxicação por organofosforados e prever apneia prolongada após succinilcolina.',
    entenda:
      'A colinesterase sérica é produzida pelo hepatócito e sua concentração reflete a capacidade de síntese hepática, assim como a albumina — mas com uma vantagem: sua meia-vida é de cerca de 10 dias, contra 20 da albumina, o que a torna mais sensível a mudanças recentes. Uma queda progressiva em hepatopata indica deterioração da função de síntese antes que a albumina se mova.',
    aprofundar: [
      'Na toxicologia, a colinesterase sérica é o exame de triagem da intoxicação por organofosforados e carbamatos. Esses compostos inibem a enzima, e a queda é proporcional à exposição. Vale a distinção: a colinesterase **sérica** (butirilcolinesterase) é mais sensível e cai primeiro, servindo de triagem e de vigilância ocupacional; a colinesterase **eritrocitária** (acetilcolinesterase) reflete melhor a inibição no sistema nervoso e correlaciona-se com a gravidade clínica, mas se recupera muito mais lentamente — em semanas, acompanhando a renovação das hemácias.',
      'Na anestesia, o déficit genético de colinesterase é a explicação da apneia prolongada após succinilcolina ou mivacúrio: sem a enzima, o bloqueador neuromuscular não é hidrolisado e o paciente permanece paralisado por horas em vez de minutos. A investigação com o número de dibucaína identifica as variantes atípicas e permite orientar familiares — uma informação que pertence ao prontuário de forma permanente.',
      'Uma queda isolada de colinesterase, sem hepatopatia conhecida e sem exposição, deve fazer perguntar sobre desnutrição, gestação (redução fisiológica) e uso de contraceptivos.',
    ],
    fisiologia: {
      oQueE: 'Butirilcolinesterase, esterase plasmática que hidrolisa ésteres de colina.',
      origem: 'Hepatócito.',
      funcao: 'Hidrolisar ésteres de colina exógenos, entre eles a succinilcolina, o mivacúrio, a cocaína e alguns anestésicos locais.',
      meiaVida: 'Cerca de 10 dias.',
      orgaosEnvolvidos: ['Fígado'],
      percurso: [
        'Síntese hepática contínua',
        'liberação no plasma',
        'hidrólise de ésteres de colina circulantes',
        'inibição irreversível por organofosforados',
      ],
    },
    aumento: {
      resumo: 'Síndrome nefrótica, obesidade, hiperlipidemia, diabetes — sem valor diagnóstico próprio.',
      mecanismos: [
        {
          titulo: 'Síntese hepática aumentada',
          explicacao: 'O estímulo à síntese proteica hepática que ocorre na síndrome nefrótica e em estados de resistência insulínica eleva também esta enzima.',
          exemplos: [
            { causa: 'Síndrome nefrótica, obesidade, hiperlipidemia', etapas: ['aumento da síntese proteica hepática', 'colinesterase ↑', 'sem significado clínico independente'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Falência de síntese hepática, intoxicação por inibidores, variante genética ou desnutrição.',
      mecanismos: [
        {
          titulo: 'Capacidade de síntese hepática reduzida',
          explicacao: 'Com menos hepatócitos funcionantes, a produção cai — de forma mais rápida que a da albumina pela meia-vida mais curta.',
          exemplos: [
            { causa: 'Cirrose e insuficiência hepática', etapas: ['perda de massa hepatocitária funcional', 'colinesterase ↓ progressiva', 'acompanha albumina ↓ e INR ↑'], nota: 'A queda seriada é um marcador sensível de deterioração.' },
            { causa: 'Desnutrição proteico-calórica', etapas: ['aporte de aminoácidos insuficiente', 'síntese hepática reduzida', 'colinesterase e albumina ↓'] },
          ],
        },
        {
          titulo: 'Inibição por tóxico',
          explicacao: 'Organofosforados fosforilam o sítio ativo de forma praticamente irreversível; carbamatos o carbamilam de forma reversível.',
          exemplos: [
            { causa: 'Intoxicação por organofosforado', etapas: ['inibição da enzima', 'acúmulo de acetilcolina nas sinapses', 'síndrome colinérgica: miose, sialorreia, broncorreia, bradicardia, fasciculações', 'colinesterase sérica ↓↓ proporcional à exposição'], nota: 'O tratamento com atropina e pralidoxima não deve aguardar o resultado — a clínica é o critério.' },
            { causa: 'Exposição ocupacional a praguicidas', etapas: ['inibição subclínica e cumulativa', 'queda progressiva em relação ao basal individual', 'indicação de afastamento da exposição'], nota: 'A vigilância compara o trabalhador com o próprio basal, não com a faixa populacional.' },
          ],
        },
        {
          titulo: 'Variante genética',
          explicacao: 'Alelos atípicos produzem enzima com afinidade reduzida, incapaz de hidrolisar a succinilcolina em tempo normal.',
          exemplos: [
            { causa: 'Deficiência genética de colinesterase', etapas: ['administração de succinilcolina ou mivacúrio', 'hidrólise muito lenta', 'apneia e bloqueio neuromuscular prolongados por horas', 'necessidade de ventilação até a recuperação espontânea'], nota: 'O número de dibucaína identifica a variante e permite orientar a família.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A função de síntese hepática', ids: ['albumina', 'inr', 'bilirrubina-total'], leitura: 'Albumina, INR e colinesterase medem a mesma coisa por três caminhos, com meias-vidas diferentes — o INR responde em dias, a colinesterase em semanas, a albumina em meses.' },
    ],
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['albumina', 'inr'],
  },

  {
    id: 'alfa-1-antitripsina',
    nome: 'Alfa-1-antitripsina',
    sigla: 'AAT',
    sinonimos: ['alfa 1 antitripsina', 'a1at', 'aat', 'deficiencia de alfa 1 antitripsina'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'respiratorio'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Adultos', minimo: 90, maximo: 200, unidade: 'mg/dL' },
      { rotulo: 'Limiar protetor pulmonar', texto: '> 57 (11 µmol/L)', unidade: 'mg/dL', observacao: 'Abaixo desse valor, o risco de enfisema aumenta acentuadamente.' },
    ],
    resumo:
      'A antiprotease que protege o pulmão da elastase do neutrófilo. Sua deficiência causa enfisema em jovens e hepatopatia — duas doenças de mecanismos opostos originadas da mesma mutação.',
    entenda:
      'A elegância fisiopatológica desta doença está em ter dois mecanismos contrários. No pulmão, o problema é **falta**: sem a antitripsina, a elastase liberada pelos neutrófilos destrói o septo alveolar, produzindo enfisema panacinar de predomínio basal — o oposto da distribuição do enfisema do tabagista. No fígado, o problema é **acúmulo**: a proteína mutante Z se polimeriza dentro do retículo endoplasmático do hepatócito e não é secretada, causando lesão por sobrecarga. Falta lá fora, sobra lá dentro.',
    aprofundar: [
      'Quando pedir: enfisema antes dos 45 anos, enfisema com predomínio em bases, enfisema em não tabagista, hepatopatia crônica sem causa definida, colestase neonatal prolongada, e paniculite ou vasculite associada a ANCA sem explicação. Diretrizes de pneumologia recomendam a dosagem em todo adulto com doença pulmonar obstrutiva persistente — porque o diagnóstico muda o aconselhamento familiar e, em alguns casos, permite reposição.',
      'Uma armadilha central: a alfa-1-antitripsina é proteína de fase aguda e sobe na inflamação. Um paciente heterozigoto com pneumonia pode ter valor dentro da faixa normal. Por isso a dosagem deve vir acompanhada da PCR, e um valor normal em vigência de inflamação não exclui deficiência. Quando a suspeita é forte, a fenotipagem ou a genotipagem resolve independentemente do estado inflamatório.',
      'O traçado da eletroforese de proteínas oferece uma pista visual gratuita: a alfa-1-antitripsina responde por quase toda a banda alfa-1, e sua deficiência produz um vale onde deveria haver um pico. Ver isso num proteinograma pedido por outro motivo já levanta a hipótese.',
      'A orientação prática que mais muda desfecho não é laboratorial: cessação absoluta do tabagismo. A fumaça oxida o sítio ativo do pouco de antitripsina disponível, inativando-a funcionalmente — o tabagismo, num deficiente, antecipa o enfisema em décadas.',
    ],
    fisiologia: {
      oQueE: 'Serpina plasmática, principal inibidor da elastase neutrofílica.',
      origem: 'Hepatócito, principalmente; também macrófagos e epitélio pulmonar.',
      funcao: 'Neutralizar as proteases liberadas por neutrófilos, protegendo a matriz elástica do pulmão.',
      orgaosEnvolvidos: ['Fígado', 'Pulmão'],
      percurso: [
        'Síntese hepática e secreção no plasma',
        'difusão para o interstício pulmonar',
        'neutralização da elastase liberada pelo neutrófilo',
        'na variante Z: polimerização e retenção no hepatócito',
        'falta no pulmão e acúmulo no fígado',
      ],
    },
    aumento: {
      resumo: 'Reagente de fase aguda — sobe na inflamação, na gestação e com estrogênio, sem valor diagnóstico próprio.',
      mecanismos: [
        {
          titulo: 'Resposta de fase aguda',
          explicacao: 'A IL-6 aumenta a síntese hepática, o que pode mascarar deficiência parcial.',
          exemplos: [
            { causa: 'Infecção, inflamação, gestação, estrogênio', etapas: ['estímulo hepático de fase aguda', 'alfa-1-antitripsina ↑', 'possível normalização falsa em heterozigoto'], nota: 'Dosar sempre com PCR ao lado.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Deficiência genética, perda proteica ou falência de síntese hepática.',
      mecanismos: [
        {
          titulo: 'Variantes genéticas com secreção reduzida',
          explicacao: 'As variantes Z e S produzem proteína que se polimeriza no retículo endoplasmático e não é secretada adequadamente.',
          exemplos: [
            { causa: 'Genótipo ZZ', etapas: ['polimerização intra-hepatocitária da proteína mutante', 'níveis séricos muito baixos', 'enfisema panacinar de predomínio basal em adulto jovem', 'hepatopatia por acúmulo, de colestase neonatal a cirrose no adulto'], nota: 'A distribuição basal do enfisema é o que o distingue do enfisema do tabagista, que predomina em ápices.' },
            { causa: 'Genótipo MZ ou SZ', etapas: ['deficiência parcial', 'risco aumentado sobretudo em fumantes', 'valores intermediários que podem parecer normais na fase aguda'] },
          ],
        },
        {
          titulo: 'Perda ou falência de síntese',
          explicacao: 'A proteína pode ser perdida pela urina ou pelo intestino, ou faltar por incapacidade hepática de produzi-la.',
          exemplos: [
            { causa: 'Síndrome nefrótica e enteropatia perdedora de proteína', etapas: ['perda de proteínas plasmáticas', 'alfa-1-antitripsina ↓ junto com albumina ↓'] },
            { causa: 'Insuficiência hepática avançada', etapas: ['capacidade de síntese comprometida', 'redução conjunta de várias proteínas hepáticas'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para interpretar corretamente', ids: ['pcr', 'eletroforese-proteinas', 'alt'], leitura: 'PCR alta invalida um valor normal; a eletroforese com banda alfa-1 achatada reforça a suspeita; ALT alterada aponta o componente hepático.' },
    ],
    advertencia: 'Valor normal em vigência de inflamação não exclui deficiência. Quando a suspeita clínica é forte, prossiga para fenotipagem ou genotipagem.',
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['pcr', 'eletroforese-proteinas', 'alfa-1-antitripsina-fecal'],
  },

  {
    id: 'ceruloplasmina',
    nome: 'Ceruloplasmina e cobre',
    sigla: 'Cp',
    sinonimos: ['ceruloplasmina', 'cobre serico', 'cobre urinario', 'doenca de wilson', 'cupremia'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'neurologico', 'metabolico'],
    material: 'Soro e urina de 24 horas',
    unidade: 'mg/dL e µg/24h',
    referencias: [
      { rotulo: 'Ceruloplasmina', minimo: 20, maximo: 60, unidade: 'mg/dL' },
      { rotulo: 'Cobre sérico total', minimo: 70, maximo: 140, unidade: 'µg/dL' },
      { rotulo: 'Cobre urinário de 24h', texto: '< 40', unidade: 'µg/24h' },
      { rotulo: 'Cobre urinário na doença de Wilson', texto: '> 100', unidade: 'µg/24h' },
    ],
    resumo:
      'O eixo do cobre. Na doença de Wilson, a ceruloplasmina cai, o cobre sérico total cai junto com ela — e mesmo assim há excesso de cobre no organismo, porque a fração livre e tóxica aumenta.',
    entenda:
      'Esse é o ponto que causa mais confusão em toda a hepatologia laboratorial: como pode haver **sobrecarga** de cobre com **cobre sérico baixo**? A explicação está na distribuição. Cerca de 90% do cobre plasmático viaja ligado à ceruloplasmina, que é a forma inerte e segura. Na doença de Wilson, a ATP7B defeituosa não consegue incorporar cobre à ceruloplasmina nem excretá-lo na bile: a ceruloplasmina cai (e com ela o cobre total medido), mas o cobre **livre** — não ligado — aumenta e se deposita em fígado, cérebro e córnea. O exame total engana; o cobre livre e o urinário revelam.',
    aprofundar: [
      'A investigação prática combina três achados: ceruloplasmina baixa, cobre urinário de 24 horas elevado e anéis de Kayser-Fleischer à lâmpada de fenda. Nenhum isolado é suficiente. A ceruloplasmina é normal em cerca de 5 a 15% dos pacientes com Wilson — especialmente na forma hepática — e é baixa em desnutrição, síndrome nefrótica, enteropatia perdedora e insuficiência hepática de qualquer causa. E, sendo proteína de fase aguda, sobe na inflamação, o que pode normalizar falsamente um valor baixo.',
      'A doença de Wilson deve ser pensada em toda hepatopatia inexplicada abaixo dos 40 anos, e em qualquer paciente jovem com sintomas neurológicos ou psiquiátricos novos associados a alteração hepática. O motivo é prático: é uma das poucas doenças hepáticas genéticas com tratamento eficaz, e o atraso diagnóstico custa função neurológica irreversível.',
      'A hepatite fulminante por Wilson tem uma assinatura laboratorial reconhecível e útil: anemia hemolítica com Coombs negativo (o cobre liberado maciçamente lisa as hemácias), fosfatase alcalina desproporcionalmente **baixa** e relação fosfatase alcalina/bilirrubina total abaixo de 4, com relação AST/ALT acima de 2,2. Esse conjunto, num jovem com insuficiência hepática aguda, indica transplante urgente.',
    ],
    fisiologia: {
      oQueE: 'Ceruloplasmina: ferroxidase plasmática que transporta cerca de 90% do cobre circulante.',
      origem: 'Hepatócito.',
      funcao: 'Oxidar o ferro ferroso a férrico para ligação à transferrina; transportar cobre de forma inerte.',
      eliminacao: 'O cobre é excretado predominantemente pela bile.',
      orgaosEnvolvidos: ['Fígado', 'Cérebro (gânglios da base)', 'Córnea', 'Rim'],
      percurso: [
        'Cobre absorvido no intestino chega ao fígado',
        'ATP7B incorpora cobre à apoceruloplasmina',
        'ceruloplasmina secretada no plasma',
        'excesso de cobre excretado na bile',
        'na doença de Wilson: as duas etapas falham, cobre livre acumula nos tecidos',
      ],
    },
    aumento: {
      resumo: 'Ceruloplasmina alta é fase aguda, gestação ou estrogênio; cobre alto acompanha a ceruloplasmina.',
      mecanismos: [
        {
          titulo: 'Resposta de fase aguda e estímulo estrogênico',
          explicacao: 'A ceruloplasmina é reagente de fase aguda positivo e responde a estrogênio, elevando também o cobre total ligado.',
          exemplos: [
            { causa: 'Inflamação, infecção, neoplasia, gestação, contraceptivo oral', etapas: ['síntese hepática ↑', 'ceruloplasmina e cobre total ↑', 'sem sobrecarga real de cobre'], nota: 'Pode mascarar uma ceruloplasmina baixa e retardar o diagnóstico de Wilson.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Doença de Wilson, perda proteica, desnutrição, insuficiência hepática ou deficiência de cobre.',
      mecanismos: [
        {
          titulo: 'Falha da incorporação e da excreção do cobre',
          explicacao: 'A ATP7B defeituosa impede tanto a ligação do cobre à ceruloplasmina quanto sua eliminação biliar — daí a queda da proteína com acúmulo tecidual do metal.',
          exemplos: [
            { causa: 'Doença de Wilson', etapas: ['mutação em ATP7B', 'ceruloplasmina ↓ e cobre sérico total ↓', 'cobre livre ↑ com deposição hepática, neurológica e corneana', 'cobre urinário de 24h ↑↑'], nota: 'A dissociação entre cobre total baixo e sobrecarga tecidual é a chave conceitual deste diagnóstico.' },
          ],
        },
        {
          titulo: 'Perda, carência ou falência de síntese',
          explicacao: 'Sendo proteína hepática de peso intermediário, a ceruloplasmina cai por perda urinária ou intestinal e por incapacidade de síntese.',
          exemplos: [
            { causa: 'Síndrome nefrótica, enteropatia perdedora, desnutrição, insuficiência hepática', etapas: ['perda ou síntese reduzida', 'ceruloplasmina ↓ sem doença de Wilson', 'cobre urinário normal'], nota: 'O cobre urinário normal é o que separa essas causas de Wilson.' },
            { causa: 'Deficiência de cobre (nutrição parenteral, cirurgia bariátrica, excesso de zinco)', etapas: ['aporte insuficiente ou competição com o zinco na absorção', 'anemia e neutropenia refratárias a ferro', 'mielopatia semelhante à da deficiência de B12'], nota: 'Deficiência de cobre é causa reversível e frequentemente esquecida de citopenias e mielopatia.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na hepatite fulminante do jovem', ids: ['fosfatase-alcalina', 'bilirrubina-total', 'ast', 'alt', 'haptoglobina'], leitura: 'Fosfatase alcalina desproporcionalmente baixa, relação AST/ALT alta e hemólise com Coombs negativo em jovem com insuficiência hepática aguda sugerem Wilson.' },
      { titulo: 'Quando o cobre está baixo por carência', ids: ['zinco', 'hemoglobina', 'neutrofilos-absolutos', 'vitamina-b12'], leitura: 'Excesso de zinco bloqueia a absorção de cobre; a deficiência resultante imita mielodisplasia e deficiência de B12.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['zinco', 'alt', 'coombs-direto'],
  },

  {
    id: 'autoanticorpos-hepaticos',
    nome: 'Autoanticorpos hepáticos (antimitocôndria, antimúsculo liso, anti-LKM1)',
    sigla: 'AMA / ASMA / LKM1',
    sinonimos: ['antimitocondria', 'ama', 'ama m2', 'antimusculo liso', 'asma', 'anti lkm1', 'anti lkm', 'hepatite autoimune anticorpos'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'imunologico'],
    material: 'Soro',
    unidade: 'título',
    referencias: [
      { rotulo: 'Antimitocôndria (AMA-M2)', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Antimúsculo liso', texto: 'Não reagente (título ≥ 1:40 é significativo)', unidade: '' },
      { rotulo: 'Anti-LKM1', texto: 'Não reagente', unidade: '' },
    ],
    resumo:
      'Os anticorpos que separam as hepatopatias autoimunes entre si: antimitocôndria define colangite biliar primária, antimúsculo liso define hepatite autoimune tipo 1, anti-LKM1 define o tipo 2.',
    entenda:
      'A distinção começa pelo padrão bioquímico e é confirmada pelo anticorpo. Padrão colestático — fosfatase alcalina e GGT predominando — com antimitocôndria positivo é colangite biliar primária. Padrão hepatocelular — transaminases predominando — com antimúsculo liso ou anti-LKM1 positivo e IgG elevada é hepatite autoimune. As duas podem coexistir na chamada síndrome de sobreposição, e os tratamentos diferem: ácido ursodesoxicólico na primeira, imunossupressão na segunda.',
    aprofundar: [
      'A colangite biliar primária tem um perfil laboratorial notavelmente coeso: mulher de meia-idade, prurido e fadiga, fosfatase alcalina elevada de forma persistente, IgM alta e AMA-M2 positivo. Com esse conjunto, a biópsia hepática deixou de ser necessária para o diagnóstico na maioria dos casos — um exemplo de exame sorológico que substituiu um procedimento invasivo.',
      'O AMA pode ser positivo anos antes de qualquer alteração bioquímica. Nesses casos, a conduta é acompanhamento com fosfatase alcalina periódica, não tratamento: a maioria desenvolverá a doença ao longo de uma década, mas nem todos, e tratar quem ainda não tem doença bioquímica não demonstrou benefício.',
      'Na hepatite autoimune, a IgG elevada é tão importante quanto o anticorpo — ela integra os escores diagnósticos e serve de marcador de atividade no seguimento. Uma particularidade que muda conduta: a normalização das transaminases sob tratamento não significa remissão histológica; a IgG persistentemente elevada indica atividade residual e é motivo para não reduzir a imunossupressão.',
      'O anti-LKM1 caracteriza a hepatite autoimune tipo 2, típica de crianças e adolescentes, de curso mais agressivo e com apresentação frequentemente aguda ou até fulminante. Reconhecê-la muda a urgência da imunossupressão.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos contra o complexo piruvato desidrogenase mitocondrial (AMA-M2), contra actina do músculo liso e contra o citocromo P450 2D6 (LKM1).',
      origem: 'Resposta autoimune em indivíduos geneticamente predispostos.',
      funcao: 'Marcadores diagnósticos; a patogenicidade direta é discutida, e a lesão é predominantemente mediada por linfócitos T.',
      orgaosEnvolvidos: ['Fígado', 'Ductos biliares intra-hepáticos'],
      percurso: [
        'Perda de tolerância a antígenos hepáticos ou biliares',
        'infiltrado linfocitário portal',
        'destruição de ductos (colangite biliar primária) ou de hepatócitos (hepatite autoimune)',
        'padrão bioquímico correspondente',
      ],
    },
    aumento: {
      resumo: 'Cada anticorpo define uma entidade — e o padrão bioquímico ao lado confirma qual.',
      mecanismos: [
        {
          titulo: 'Autorreatividade hepatobiliar específica',
          explicacao: 'A especificidade do anticorpo corresponde ao alvo tecidual: epitélio biliar na colangite biliar primária, hepatócito na hepatite autoimune.',
          exemplos: [
            { causa: 'Colangite biliar primária', etapas: ['AMA-M2 positivo', 'destruição de ductos biliares interlobulares', 'fosfatase alcalina e GGT ↑ persistentes com IgM ↑', 'prurido e fadiga', 'tratamento com ácido ursodesoxicólico'] },
            { causa: 'Hepatite autoimune tipo 1', etapas: ['antimúsculo liso e/ou FAN positivos', 'IgG ↑', 'transaminases elevadas com padrão hepatocelular', 'hepatite de interface à histologia', 'resposta a corticoide e azatioprina'] },
            { causa: 'Hepatite autoimune tipo 2', etapas: ['anti-LKM1 positivo', 'início na infância ou adolescência', 'curso mais agressivo, por vezes fulminante', 'necessidade de imunossupressão precoce'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O padrão bioquímico que orienta', ids: ['fosfatase-alcalina', 'ggt', 'alt', 'imunoglobulinas'], leitura: 'Colestático com IgM alta e AMA positivo é colangite biliar primária; hepatocelular com IgG alta e antimúsculo liso é hepatite autoimune.' },
      { titulo: 'Excluir antes de concluir', ids: ['hbsag', 'anti-hcv', 'ceruloplasmina', 'alfa-1-antitripsina'], leitura: 'Hepatites virais, Wilson e deficiência de alfa-1-antitripsina precisam ser afastadas — os autoanticorpos podem aparecer em títulos baixos em qualquer hepatopatia crônica.' },
    ],
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['fan', 'imunoglobulinas', 'fosfatase-alcalina'],
  },

  {
    id: 'escores-fibrose',
    nome: 'Escores não invasivos de fibrose (APRI e FIB-4)',
    sigla: 'APRI / FIB-4',
    sinonimos: ['apri', 'fib-4', 'fib4', 'escore de fibrose', 'fibrose hepatica nao invasiva', 'nafld fibrosis score'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Cálculo a partir de exames de rotina',
    unidade: 'índice',
    referencias: [
      { rotulo: 'FIB-4 — fibrose avançada improvável', texto: '< 1,30 (ou < 2,0 acima de 65 anos)', unidade: 'índice' },
      { rotulo: 'FIB-4 — zona indeterminada', texto: '1,30 a 2,67', unidade: 'índice' },
      { rotulo: 'FIB-4 — fibrose avançada provável', texto: '> 2,67', unidade: 'índice' },
      { rotulo: 'APRI — cirrose provável', texto: '> 2,0', unidade: 'índice' },
    ],
    resumo:
      'Índices calculados com AST, ALT, plaquetas e idade. Não substituem elastografia nem biópsia, mas identificam com segurança quem não precisa delas — e quem precisa com urgência.',
    entenda:
      'A lógica por trás dos escores é fisiológica, não estatística. A fibrose hepática avançada reduz a produção de trombopoetina e causa hiperesplenismo, derrubando as plaquetas; e altera a relação AST/ALT, porque a AST mitocondrial é liberada de forma desproporcional quando o dano é mais profundo. Combinando esses dois sinais com a idade, obtém-se uma estimativa de fibrose usando exames que qualquer paciente já tem.',
    aprofundar: [
      'O maior valor desses escores é o **valor preditivo negativo**. Um FIB-4 abaixo de 1,30 torna a fibrose avançada muito improvável, e isso permite tranquilizar e liberar do encaminhamento a maior parte dos pacientes com esteatose hepática — uma população enorme, que não caberia em serviços de hepatologia. Em atenção primária, esse é provavelmente o uso mais impactante de um cálculo laboratorial.',
      'A zona indeterminada é grande e é onde o escore falha; ali a elastografia hepática é o passo seguinte. Reconhecer o limite do instrumento é parte de usá-lo bem.',
      'Há ressalvas importantes. Em pacientes acima de 65 anos, o ponto de corte inferior deve ser elevado para 2,0, porque a idade entra na fórmula e produz falso-positivos. Os escores não são validados em hepatite aguda, em que as transaminases muito elevadas distorcem completamente o cálculo. E qualquer causa de plaquetopenia não hepática — púrpura imune, quimioterapia, esplenomegalia de outra origem — eleva falsamente o índice.',
      'A relação AST/ALT tem interpretação própria e vale conhecer: acima de 2 sugere doença hepática alcoólica (a deficiência de piridoxina característica reduz a síntese de ALT); acima de 1 em paciente com esteatose não alcoólica sugere progressão para fibrose. Abaixo de 1 é o padrão da esteatose simples e da maioria das hepatites virais crônicas.',
    ],
    fisiologia: {
      oQueE: 'Índices calculados: APRI = (AST/limite superior) ÷ plaquetas × 100; FIB-4 = (idade × AST) ÷ (plaquetas × √ALT).',
      origem: 'Derivados de exames de rotina, sem coleta adicional.',
      funcao: 'Estimar a probabilidade de fibrose hepática avançada sem procedimento invasivo.',
      orgaosEnvolvidos: ['Fígado', 'Baço', 'Medula óssea'],
      percurso: [
        'Fibrose hepática progressiva',
        'redução da produção de trombopoetina e hipertensão portal',
        'hiperesplenismo com queda das plaquetas',
        'liberação desproporcional de AST mitocondrial',
        'índice calculado reflete o conjunto',
      ],
    },
    aumento: {
      resumo: 'Índice alto sugere fibrose avançada — ou plaquetopenia de outra causa distorcendo o cálculo.',
      significado: 'FIB-4 acima de 2,67 indica alta probabilidade de fibrose avançada e justifica elastografia e encaminhamento.',
      mecanismos: [
        {
          titulo: 'Fibrose com hipertensão portal incipiente',
          explicacao: 'A queda das plaquetas e a elevação relativa da AST refletem, respectivamente, hipertensão portal e dano hepatocelular profundo.',
          exemplos: [
            { causa: 'Doença hepática gordurosa com fibrose avançada', etapas: ['esteato-hepatite persistente', 'fibrose progressiva', 'plaquetas em queda e relação AST/ALT invertendo para > 1', 'FIB-4 acima do corte superior'], nota: 'Esse é o paciente que precisa de hepatologista, entre milhões com esteatose que não precisam.' },
            { causa: 'Hepatite C ou B crônica com fibrose', etapas: ['inflamação persistente por décadas', 'fibrose septal', 'APRI e FIB-4 elevados', 'estadiamento e rastreio de carcinoma hepatocelular indicados'] },
            { causa: 'Plaquetopenia não hepática', etapas: ['púrpura imune, quimioterapia, hiperesplenismo de outra causa', 'índice falsamente elevado', 'ausência de fibrose'], nota: 'Sempre verificar se a plaquetopenia tem outra explicação antes de concluir.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Os componentes do cálculo', ids: ['ast', 'alt', 'plaquetas'], leitura: 'Os três exames já existem no perfil de rotina — o escore é interpretação, não exame novo.' },
      { titulo: 'Quando a fibrose é provável', ids: ['albumina', 'inr', 'bilirrubina-total', 'alfafetoproteina'], leitura: 'Albumina baixa, INR alargado e bilirrubina alta indicam que a fibrose já comprometeu a função — e a cirrose estabelecida exige rastreio semestral de carcinoma hepatocelular.' },
    ],
    advertencia:
      'Não validados em hepatite aguda. A zona indeterminada é ampla e exige elastografia. Em maiores de 65 anos, use o corte inferior ajustado para 2,0.',
    utilidade: ['triagem', 'prognostico'],
    estudarTambem: ['ast', 'alt', 'plaquetas', 'albumina'],
  },
]
