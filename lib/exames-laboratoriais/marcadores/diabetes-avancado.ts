import type { Marcador } from '../tipos'

/**
 * Diabetes — além da glicemia e da hemoglobina glicada.
 *
 * Três perguntas organizam este arquivo, e nenhuma delas é respondida pela
 * glicemia. **Que tipo de diabetes é este?** — os autoanticorpos respondem, e a
 * resposta muda o tratamento desde o primeiro dia. **Há resistência à insulina
 * ou falência de célula beta?** — os índices derivados de insulina e glicemia
 * respondem. **Há cetose?** — e aqui há um detalhe que muda condutas: a fita de
 * cetonúria mede acetoacetato e é praticamente cega para o beta-hidroxibutirato,
 * que é o corpo cetônico predominante justamente na cetoacidose grave.
 */
export const marcadores: Marcador[] = [
  {
    id: 'beta-hidroxibutirato',
    nome: 'Beta-hidroxibutirato e corpos cetônicos',
    sigla: 'BHB',
    sinonimos: ['beta hidroxibutirato', 'bhb', 'cetonemia', 'corpos cetonicos', 'cetonuria', 'acetoacetato'],
    grupo: 'glicemia',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Soro, plasma ou sangue capilar',
    unidade: 'mmol/L',
    referencias: [
      { rotulo: 'Normal', texto: '< 0,6', unidade: 'mmol/L' },
      { rotulo: 'Cetose', texto: '0,6 a 1,5', unidade: 'mmol/L' },
      { rotulo: 'Risco de cetoacidose', texto: '1,5 a 3,0', unidade: 'mmol/L' },
      { rotulo: 'Cetoacidose estabelecida', texto: '> 3,0', unidade: 'mmol/L' },
    ],
    resumo:
      'O corpo cetônico predominante — e o único que a fita de urina não detecta. É por isso que a cetonúria pode vir fracamente positiva num paciente com cetoacidose grave.',
    entenda:
      'Há três corpos cetônicos: acetoacetato, beta-hidroxibutirato e acetona. Na cetoacidose, o estado redox intracelular altamente reduzido desloca o equilíbrio fortemente para o beta-hidroxibutirato, que pode representar mais de 75% do total. A fita de urina usa a reação do nitroprussiato, que detecta acetoacetato e acetona — e não detecta o beta-hidroxibutirato. O resultado é um exame que subestima a cetose exatamente quando ela é mais grave.',
    aprofundar: [
      'Há uma consequência ainda mais contraintuitiva durante o tratamento: conforme a cetoacidose melhora e o estado redox se normaliza, o beta-hidroxibutirato é convertido em acetoacetato. A cetonúria pode, portanto, **aumentar** enquanto o paciente melhora. Usar a fita de urina para acompanhar a resolução leva a manter insulina venosa e jejum sem necessidade. A cetonemia capilar acompanha corretamente, caindo de forma monotônica.',
      'A cetoacidose euglicêmica é um cenário que se tornou comum com os inibidores de SGLT2 e precisa ser conhecido. Esses fármacos promovem glicosúria e reduzem a glicemia, ao mesmo tempo em que favorecem a cetogênese — o paciente chega com acidose de ânion gap alto, cetonemia elevada e glicemia normal ou pouco alterada. Sem dosar cetonas, o diagnóstico passa. Outras causas de cetoacidose euglicêmica são gestação, jejum prolongado e alcoolismo.',
      'A cetoacidose alcoólica tem fisiopatologia própria: o metabolismo do etanol gera NADH em excesso, o que ao mesmo tempo desloca o equilíbrio para o beta-hidroxibutirato e bloqueia a gliconeogênese. O paciente chega com acidose de ânion gap alto, glicemia normal ou baixa e nitroprussiato fracamente positivo — outro caso em que só a dosagem direta revela a magnitude real.',
      'A cetose nutricional das dietas cetogênicas alcança 0,5 a 3,0 mmol/L e é fisiológica: há insulina suficiente para conter a lipólise, e o pH permanece normal. A diferença entre cetose e cetoacidose não está na cetonemia isolada, mas na presença de acidose — o que exige gasometria e ânion gap para definir.',
    ],
    fisiologia: {
      oQueE: 'Ácido orgânico produzido no fígado a partir da beta-oxidação de ácidos graxos, usado como combustível alternativo à glicose.',
      origem: 'Mitocôndria do hepatócito.',
      sintese: 'Lipólise no tecido adiposo libera ácidos graxos; a beta-oxidação hepática gera acetil-CoA, convertida em corpos cetônicos quando o ciclo de Krebs está saturado.',
      funcao: 'Fornecer energia ao cérebro, ao músculo e ao coração na ausência de glicose disponível.',
      orgaosEnvolvidos: ['Fígado', 'Tecido adiposo', 'Cérebro', 'Rim'],
      percurso: [
        'Insulina insuficiente ou jejum prolongado',
        'lipólise não freada libera ácidos graxos',
        'beta-oxidação hepática gera acetil-CoA em excesso',
        'cetogênese: acetoacetato e beta-hidroxibutirato',
        'acúmulo com consumo de bicarbonato e acidose de ânion gap alto',
      ],
    },
    aumento: {
      resumo: 'Deficiência de insulina, jejum, álcool, inibidor de SGLT2 ou dieta cetogênica — e só a acidose diferencia cetose de cetoacidose.',
      mecanismos: [
        {
          titulo: 'Lipólise sem freio insulínico',
          explicacao: 'A insulina é o principal inibidor da lipase hormônio-sensível; sua falta libera ácidos graxos em massa para a beta-oxidação hepática.',
          exemplos: [
            { causa: 'Cetoacidose diabética', etapas: ['deficiência absoluta ou relativa de insulina com excesso de glucagon', 'lipólise intensa', 'cetogênese hepática', 'acidose de ânion gap alto com desidratação osmótica'], nota: 'Beta-hidroxibutirato acima de 3 mmol/L com pH baixo define; a cetonúria pode subestimar.' },
            { causa: 'Cetoacidose euglicêmica por inibidor de SGLT2', etapas: ['glicosúria mantém a glicemia normal', 'insulina relativamente baixa favorece cetogênese', 'acidose com glicemia normal', 'diagnóstico perdido se as cetonas não forem dosadas'], nota: 'Acidose de ânion gap alto em usuário de SGLT2 exige cetonemia mesmo com glicemia normal.' },
            { causa: 'Cetoacidose alcoólica', etapas: ['NADH em excesso pelo metabolismo do etanol', 'gliconeogênese bloqueada e equilíbrio deslocado para beta-hidroxibutirato', 'glicemia normal ou baixa', 'nitroprussiato fracamente positivo apesar de cetonemia alta'] },
            { causa: 'Jejum prolongado e dieta cetogênica', etapas: ['glicogênio esgotado', 'cetogênese como adaptação', 'cetonemia entre 0,5 e 3 mmol/L', 'pH normal — é cetose, não cetoacidose'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O diagnóstico da cetoacidose', ids: ['ph', 'bicarbonato', 'anion-gap-corrigido', 'glicemia-jejum'], leitura: 'Cetonemia alta define cetose; é a acidose com ânion gap alto que define cetoacidose. A glicemia pode ser normal.' },
      { titulo: 'O manejo e suas armadilhas', ids: ['potassio', 'sodio-corrigido', 'osmolalidade-serica'], leitura: 'O potássio total está depletado mesmo quando o sérico está normal ou alto — a insulina o desloca para dentro da célula e pode precipitar hipocalemia grave.' },
    ],
    advertencia:
      'A fita de cetonúria não detecta beta-hidroxibutirato e subestima a cetose grave. Durante o tratamento, a cetonúria pode aumentar enquanto o paciente melhora — use cetonemia para acompanhar.',
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['glicemia-jejum', 'bicarbonato', 'anion-gap-corrigido', 'potassio'],
  },

  {
    id: 'homa-ir',
    nome: 'HOMA-IR, HOMA-beta e índice TyG',
    sigla: 'HOMA',
    sinonimos: ['homa', 'homa-ir', 'homa ir', 'homa beta', 'resistencia insulinica', 'indice tyg', 'indice triglicerideos glicose'],
    grupo: 'glicemia',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Cálculo a partir de glicemia e insulina em jejum',
    unidade: 'índice',
    referencias: [
      { rotulo: 'HOMA-IR', texto: '(insulina em µUI/mL × glicemia em mg/dL) ÷ 405', unidade: 'índice' },
      { rotulo: 'HOMA-IR — ponto de corte usual', texto: '> 2,7 sugere resistência insulínica', unidade: 'índice', observacao: 'O corte varia entre populações e não é padronizado internacionalmente.' },
      { rotulo: 'Índice TyG', texto: 'ln[(triglicerídeos × glicemia) ÷ 2]', unidade: 'índice', observacao: 'Alternativa que dispensa a dosagem de insulina.' },
    ],
    resumo:
      'Estimam resistência à insulina e função da célula beta a partir de dois exames em jejum. São ferramentas de pesquisa e de raciocínio clínico — não critérios diagnósticos.',
    entenda:
      'A ideia por trás do HOMA é simples: numa pessoa sensível à insulina, basta pouca insulina para manter a glicemia normal. Se são necessárias insulina e glicemia altas ao mesmo tempo, há resistência. O produto das duas, ajustado por uma constante, estima essa resistência. O HOMA-beta usa a mesma lógica invertida para estimar a capacidade secretora residual.',
    aprofundar: [
      'A limitação central é que a dosagem de insulina não é padronizada entre laboratórios — os imunoensaios têm reatividade cruzada variável com a pró-insulina, e os valores não são intercambiáveis. Isso significa que pontos de corte publicados em um estudo não se aplicam automaticamente a outro laboratório, e que comparar um HOMA de dois serviços diferentes não é confiável. Por isso nenhuma diretriz o adota como critério diagnóstico.',
      'O uso clínico defensável não é diagnosticar, e sim explicar e acompanhar. Diante de uma síndrome dos ovários policísticos, de esteatose hepática ou de acantose nigricans, o HOMA quantifica a resistência insulínica que está por trás e ajuda a comunicar ao paciente o mecanismo do problema. E na avaliação seriada do mesmo paciente, no mesmo laboratório, a mudança é interpretável mesmo que o valor absoluto não seja comparável com o de terceiros.',
      'O índice TyG contorna o problema da insulina: usa apenas triglicerídeos e glicemia, ambos padronizados e baratos, e tem desempenho semelhante ao do HOMA na estimativa de resistência insulínica em estudos populacionais. É uma alternativa razoável em contextos de recurso limitado.',
      'Uma armadilha conceitual: o HOMA-IR não faz sentido em paciente com diabetes tipo 1 estabelecido nem em diabetes tipo 2 avançado com falência de célula beta. Ali a insulina está baixa porque não é produzida, e não porque há sensibilidade preservada — o índice resultará baixo em quem tem, na verdade, doença mais grave. O HOMA pressupõe célula beta funcionante.',
    ],
    fisiologia: {
      oQueE: 'Índices calculados que modelam a relação de equilíbrio entre a secreção de insulina e a glicemia de jejum.',
      origem: 'Derivados de glicemia e insulina (ou triglicerídeos) em jejum.',
      funcao: 'Estimar sensibilidade à insulina e capacidade secretora residual da célula beta.',
      orgaosEnvolvidos: ['Pâncreas', 'Fígado', 'Músculo', 'Tecido adiposo'],
      percurso: [
        'Resistência periférica à insulina',
        'célula beta compensa aumentando a secreção',
        'insulinemia de jejum elevada com glicemia ainda normal',
        'esgotamento progressivo da célula beta',
        'glicemia sobe e a insulina começa a cair',
      ],
    },
    aumento: {
      resumo: 'Resistência à insulina — obesidade central, esteatose hepática, síndrome dos ovários policísticos, síndrome metabólica.',
      mecanismos: [
        {
          titulo: 'Compensação da célula beta à resistência periférica',
          explicacao: 'Enquanto a célula beta consegue compensar, a insulinemia sobe e a glicemia permanece controlada — é a fase em que o índice mais informa.',
          exemplos: [
            { causa: 'Obesidade central e esteatose hepática', etapas: ['lipotoxicidade e inflamação do tecido adiposo visceral', 'resistência hepática e muscular à insulina', 'hiperinsulinemia compensatória', 'HOMA-IR ↑ com glicemia ainda normal'], nota: 'A fase em que a intervenção sobre peso e atividade física tem maior impacto.' },
            { causa: 'Síndrome dos ovários policísticos', etapas: ['resistência insulínica em grande parte das pacientes', 'hiperinsulinemia estimula produção ovariana de androgênio e reduz SHBG', 'hiperandrogenismo clínico e laboratorial'], nota: 'Explica por que sensibilizadores de insulina melhoram o hiperandrogenismo.' },
            { causa: 'Acantose nigricans e síndromes de resistência grave', etapas: ['resistência extrema', 'hiperinsulinemia acentuada', 'estímulo de receptores de IGF-1 na pele'], nota: 'A lesão cutânea é um marcador visível de hiperinsulinemia.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Sensibilidade preservada — ou falência da célula beta, situação em que o índice baixo indica doença mais grave, não melhor.',
      mecanismos: [
        {
          titulo: 'Secreção insulínica insuficiente',
          explicacao: 'Sem produção de insulina, o índice cai independentemente da sensibilidade periférica, invertendo seu significado.',
          exemplos: [
            { causa: 'Diabetes tipo 1 ou tipo 2 com falência de célula beta', etapas: ['insulina endógena baixa', 'HOMA-IR baixo apesar de hiperglicemia', 'índice não interpretável'], nota: 'O HOMA pressupõe célula beta funcionante — não o use nesse contexto.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Os componentes e o contexto', ids: ['insulina', 'glicemia-jejum', 'peptideo-c', 'triglicerideos'], leitura: 'O peptídeo C mede a secreção endógena real e não sofre interferência de insulina exógena — é preferível ao HOMA em quem já usa insulina.' },
      { titulo: 'A síndrome metabólica em volta', ids: ['hdl', 'triglicerideos', 'hba1c', 'alt'], leitura: 'Triglicerídeos altos com HDL baixo, ALT elevada e glicada limítrofe compõem o quadro que o HOMA quantifica.' },
    ],
    advertencia:
      'Não é critério diagnóstico de nenhuma condição. A dosagem de insulina não é padronizada entre laboratórios, e pontos de corte não são transferíveis entre serviços.',
    utilidade: ['acompanhamento'],
    estudarTambem: ['insulina', 'peptideo-c', 'glicemia-jejum', 'triglicerideos'],
  },

  {
    id: 'anticorpos-diabetes',
    nome: 'Autoanticorpos do diabetes tipo 1 (anti-GAD65, anti-IA2, anti-ZnT8 e anti-insulina)',
    sigla: 'Anti-GAD',
    sinonimos: ['anti gad', 'anti gad65', 'anti ia2', 'anti znt8', 'anti insulina', 'iaa', 'ica', 'lada', 'autoanticorpos diabetes'],
    grupo: 'glicemia',
    sistemas: ['endocrino', 'imunologico', 'metabolico'],
    material: 'Soro',
    unidade: 'U/mL',
    referencias: [
      { rotulo: 'Anti-GAD65', texto: 'Não reagente', unidade: 'U/mL' },
      { rotulo: 'Anti-IA2', texto: 'Não reagente', unidade: 'U/mL' },
      { rotulo: 'Anti-ZnT8', texto: 'Não reagente', unidade: 'U/mL' },
    ],
    resumo:
      'Identificam a destruição autoimune da célula beta. Sua principal utilidade não é o diabetes tipo 1 clássico da criança — é reconhecer o LADA no adulto que foi classificado como tipo 2 e não responde a antidiabéticos orais.',
    entenda:
      'O diabetes tipo 1 da criança magra com cetoacidose raramente exige anticorpos para ser diagnosticado — o quadro clínico basta. O problema está no adulto: uma parcela significativa dos diagnosticados como tipo 2 tem, na verdade, diabetes autoimune latente do adulto (LADA), com destruição autoimune lenta. Eles não são obesos, não têm síndrome metabólica, respondem mal aos orais e progridem rapidamente para insulina. O anti-GAD65 é o exame que identifica esse grupo.',
    aprofundar: [
      'Cada anticorpo tem um comportamento temporal próprio. O anti-insulina é o primeiro a aparecer em crianças pequenas e perde utilidade após qualquer uso de insulina exógena — depois disso, não se distingue autoanticorpo de anticorpo contra a insulina administrada. O anti-IA2 associa-se a progressão mais rápida. O anti-GAD65 é o mais persistente ao longo do tempo, e por isso o mais útil no adulto com diagnóstico tardio. O anti-ZnT8 acrescenta sensibilidade quando os demais são negativos.',
      'O número de anticorpos positivos prediz risco em familiares de primeiro grau: dois ou mais anticorpos com disglicemia identificam um estágio pré-clínico da doença com progressão praticamente inevitável ao longo dos anos. Isso deu origem a uma classificação por estágios e, mais recentemente, a intervenções imunomoduladoras capazes de retardar o início clínico — o primeiro contexto em que rastrear anticorpos em assintomáticos passou a ter consequência terapêutica.',
      'O anti-GAD tem uma associação neurológica que vale conhecer: em títulos muito altos, ele aparece na síndrome da pessoa rígida, na ataxia cerebelar autoimune e em algumas encefalites — porque a descarboxilase do ácido glutâmico é uma enzima neuronal, envolvida na síntese de GABA. Um título muito elevado em paciente com sintomas neurológicos não é achado incidental.',
      'A distinção com o MODY também importa: diabetes de início antes dos 25 anos, com forte história familiar em várias gerações, sem obesidade, sem cetoacidose e com **anticorpos negativos** e peptídeo C preservado sugere MODY — cuja confirmação é genética e cujo tratamento, em alguns subtipos, é sulfonilureia em dose baixa em vez de insulina. É um dos poucos casos em que o diagnóstico correto permite suspender insulina.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos contra antígenos da célula beta pancreática: descarboxilase do ácido glutâmico 65, tirosina fosfatase IA2, transportador de zinco 8 e a própria insulina.',
      origem: 'Resposta autoimune em indivíduos com haplótipos HLA de risco.',
      funcao: 'Marcadores da destruição autoimune — a lesão é mediada predominantemente por linfócitos T.',
      orgaosEnvolvidos: ['Ilhotas pancreáticas'],
      percurso: [
        'Predisposição genética HLA',
        'gatilho ambiental provável',
        'insulite com destruição progressiva de células beta',
        'aparecimento de autoanticorpos anos antes da hiperglicemia',
        'hiperglicemia quando cerca de 80% da massa beta foi perdida',
      ],
    },
    aumento: {
      resumo: 'Diabetes autoimune — tipo 1 clássico, LADA, ou estágio pré-clínico em familiares de risco.',
      significado:
        'Positividade em adulto classificado como tipo 2 indica LADA e prevê falência precoce dos antidiabéticos orais e necessidade de insulina.',
      mecanismos: [
        {
          titulo: 'Autoimunidade contra a célula beta',
          explicacao: 'A destruição imunomediada das ilhotas expõe antígenos intracelulares e gera anticorpos detectáveis, que precedem a hiperglicemia em meses a anos.',
          exemplos: [
            { causa: 'Diabetes tipo 1 clássico', etapas: ['destruição rápida da massa beta em criança ou adolescente', 'anticorpos múltiplos positivos', 'cetoacidose frequente na apresentação', 'peptídeo C baixo'] },
            { causa: 'LADA no adulto', etapas: ['destruição autoimune lenta após os 30 anos', 'anti-GAD65 positivo', 'fenótipo magro, sem síndrome metabólica', 'falência dos orais em poucos anos'], nota: 'Reconhecer muda a conduta: insulinização precoce em vez de escalonamento de orais.' },
            { causa: 'Estágio pré-clínico em familiar de primeiro grau', etapas: ['dois ou mais anticorpos positivos', 'glicemia ainda normal ou limítrofe', 'progressão para doença clínica altamente provável', 'possibilidade de intervenção imunomoduladora'] },
            { causa: 'Anti-GAD em títulos muito altos com sintomas neurológicos', etapas: ['a enzima também é neuronal', 'síndrome da pessoa rígida, ataxia cerebelar ou encefalite', 'investigação neurológica indicada'], nota: 'Não é achado incidental quando o título é muito elevado.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A reserva de célula beta', ids: ['peptideo-c', 'insulina', 'glicemia-jejum'], leitura: 'O peptídeo C mede a produção endógena mesmo em quem usa insulina — anticorpos positivos com peptídeo C baixo confirmam falência autoimune.' },
      { titulo: 'As autoimunidades associadas', ids: ['anti-tpo', 'anti-transglutaminase', 'cortisol'], leitura: 'Tireoidite autoimune, doença celíaca e insuficiência adrenal acompanham o diabetes tipo 1 com frequência e devem ser rastreadas.' },
    ],
    advertencia:
      'O anti-insulina perde valor diagnóstico após qualquer administração de insulina exógena. Anticorpos negativos não excluem diabetes tipo 1, sobretudo em populações não europeias.',
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['peptideo-c', 'anti-tpo', 'glicemia-jejum'],
  },
]
