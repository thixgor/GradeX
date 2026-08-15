import type { Marcador } from '../tipos'

/**
 * Trato digestivo — sangue e fezes.
 *
 * As fezes são o material biológico mais subutilizado da medicina laboratorial
 * brasileira, e a razão é cultural, não técnica. A calprotectina fecal
 * distingue doença inflamatória intestinal de síndrome do intestino irritável
 * com desempenho que nenhum exame de sangue alcança, e evita colonoscopias. A
 * elastase fecal diagnostica insuficiência pancreática exócrina sem sonda
 * duodenal. A alfa-1-antitripsina fecal prova perda proteica intestinal, algo
 * que nenhuma dosagem sérica consegue.
 *
 * O outro tema deste arquivo é a diferença entre **testar quem tem sintoma** e
 * **rastrear quem não tem**. O sangue oculto nas fezes é um exame de
 * rastreamento populacional de câncer colorretal com benefício demonstrado em
 * mortalidade — e é frequentemente mal usado como exame diagnóstico em quem já
 * tem sintoma, situação em que a colonoscopia é o exame correto
 * independentemente do resultado.
 */
export const marcadores: Marcador[] = [
  {
    id: 'amilase',
    nome: 'Amilase',
    sinonimos: ['amilase', 'amilase serica', 'amilasemia', 'macroamilasemia'],
    grupo: 'digestivo',
    sistemas: ['digestivo'],
    material: 'Soro ou urina',
    unidade: 'U/L',
    referencias: [
      { rotulo: 'Adultos', minimo: 30, maximo: 110, unidade: 'U/L' },
      { rotulo: 'Sugestivo de pancreatite aguda', texto: '> 3 vezes o limite superior', unidade: 'U/L' },
    ],
    resumo:
      'A enzima que digere amido. Sobe na pancreatite aguda, mas também em muitas outras condições — e a lipase a substituiu como exame de escolha por ser mais específica e permanecer elevada por mais tempo.',
    entenda:
      'A amilase tem duas isoformas: a pancreática e a salivar, e o exame de rotina mede a soma. Isso explica boa parte de sua inespecificidade — parotidite, cetoacidose diabética, gravidez ectópica rota e trauma facial elevam a amilase sem qualquer doença pancreática. Além disso, ela sobe e normaliza rapidamente: um paciente que chega três dias após o início da dor pode ter amilase normal e pancreatite em curso.',
    aprofundar: [
      'A macroamilasemia é uma armadilha benigna e frequentemente investigada em excesso: a amilase se liga a uma imunoglobulina, formando um complexo grande demais para ser filtrado pelo rim. O resultado é amilase sérica persistentemente elevada, amilase urinária baixa e paciente completamente assintomático. A relação depuração de amilase/depuração de creatinina baixa confirma, e a conduta é não fazer nada.',
      'A magnitude da elevação não indica gravidade da pancreatite — este é um erro comum. Um paciente com pancreatite necrosante grave pode ter amilase pouco elevada, e alguém com pancreatite edematosa leve pode ter valores muito altos. A gravidade se avalia por escores clínicos, PCR às 48 horas, ureia, hematócrito e imagem — nunca pela enzima.',
      'A pancreatite por hipertrigliceridemia tem uma peculiaridade laboratorial: os triglicerídeos muito elevados podem interferir no ensaio e produzir amilase e lipase falsamente normais ou pouco elevadas. Diante de dor abdominal típica com soro lipêmico e enzimas discordantes, a diluição da amostra revela o valor real.',
    ],
    fisiologia: {
      oQueE: 'Enzima que hidrolisa ligações glicosídicas do amido e do glicogênio.',
      origem: 'Pâncreas exócrino e glândulas salivares, em proporções semelhantes no soro.',
      funcao: 'Digestão de carboidratos complexos.',
      eliminacao: 'Depuração renal e reticuloendotelial.',
      meiaVida: 'Cerca de 12 horas.',
      orgaosEnvolvidos: ['Pâncreas', 'Glândulas salivares', 'Rim'],
      percurso: [
        'Síntese no ácino pancreático e na glândula salivar',
        'secreção no lúmen digestivo',
        'pequena fração alcança o plasma',
        'lesão acinar libera grande quantidade',
        'depuração renal rápida',
      ],
    },
    aumento: {
      resumo: 'Pancreatite, doença de glândula salivar, insuficiência renal, macroamilasemia ou abdome agudo de outra origem.',
      mecanismos: [
        {
          titulo: 'Extravasamento do ácino pancreático',
          explicacao: 'A ativação intraglandular de enzimas digestivas lesa o ácino e libera seu conteúdo na circulação.',
          exemplos: [
            { causa: 'Pancreatite aguda biliar ou alcoólica', etapas: ['obstrução do ducto ou toxicidade direta', 'ativação intracelular de tripsinogênio', 'autodigestão e lesão acinar', 'amilase e lipase ↑ em horas'], nota: 'A magnitude não indica gravidade — não use a enzima para prognóstico.' },
            { causa: 'Pancreatite pós-CPRE', etapas: ['manipulação da papila', 'elevação enzimática assintomática frequente', 'só é pancreatite se houver dor típica'], nota: 'Elevação isolada após o procedimento, sem dor, não é diagnóstico.' },
          ],
        },
        {
          titulo: 'Origem extrapancreática',
          explicacao: 'A isoforma salivar e a redução da depuração renal elevam a amilase total sem doença do pâncreas.',
          exemplos: [
            { causa: 'Parotidite, trauma facial, cetoacidose diabética, gravidez ectópica rota, perfuração de víscera', etapas: ['liberação da isoforma salivar ou de outros tecidos', 'amilase ↑ com lipase normal ou pouco alterada'], nota: 'A discordância entre amilase e lipase sugere origem não pancreática.' },
            { causa: 'Insuficiência renal', etapas: ['depuração reduzida', 'amilase e lipase ↑ de forma crônica e moderada', 'necessidade de pontos de corte mais altos'] },
            { causa: 'Macroamilasemia', etapas: ['complexo amilase-imunoglobulina não filtrável', 'amilase sérica ↑ persistente', 'amilase urinária ↓', 'paciente assintomático'], nota: 'Condição benigna — reconhecê-la evita investigação prolongada.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O exame preferido', ids: ['lipase'], leitura: 'A lipase é mais específica do pâncreas e permanece elevada por mais tempo — é o exame de escolha quando ambos estão disponíveis.' },
      { titulo: 'A avaliação da causa e da gravidade', ids: ['alt', 'fosfatase-alcalina', 'triglicerideos', 'calcio', 'pcr'], leitura: 'ALT elevada sugere origem biliar; triglicerídeos acima de 1.000 mg/dL sugerem etiologia lipídica; PCR às 48 horas e ureia estimam gravidade.' },
    ],
    advertencia: 'A magnitude da elevação enzimática não se correlaciona com a gravidade da pancreatite.',
    utilidade: ['diagnostico'],
    estudarTambem: ['lipase', 'triglicerideos', 'calcio'],
  },

  {
    id: 'gastrina',
    nome: 'Gastrina e pepsinogênios',
    sinonimos: ['gastrina', 'gastrinemia', 'pepsinogenio', 'pepsinogenio i', 'pepsinogenio ii', 'zollinger-ellison', 'gastrite atrofica'],
    grupo: 'digestivo',
    sistemas: ['digestivo', 'endocrino'],
    material: 'Soro em jejum, sem inibidor de bomba de prótons',
    unidade: 'pg/mL e ng/mL',
    referencias: [
      { rotulo: 'Gastrina em jejum', texto: '< 100', unidade: 'pg/mL' },
      { rotulo: 'Sugestivo de gastrinoma', texto: '> 1.000 com pH gástrico ácido', unidade: 'pg/mL' },
      { rotulo: 'Pepsinogênio I', minimo: 30, maximo: 160, unidade: 'ng/mL' },
      { rotulo: 'Relação pepsinogênio I/II', texto: '> 3', unidade: 'razão', observacao: 'Relação baixa com pepsinogênio I reduzido indica atrofia da mucosa do corpo gástrico.' },
    ],
    resumo:
      'A gastrina alta tem duas explicações opostas: um tumor que a produz em excesso, ou um estômago que não produz ácido. O pH gástrico é o que separa as duas — e a causa mais comum é simplesmente o omeprazol.',
    entenda:
      'A gastrina estimula a secreção ácida e é normalmente inibida pelo próprio ácido, num circuito de retroalimentação. Quando falta ácido — por atrofia da mucosa ou por inibidor de bomba de prótons —, o freio desaparece e a gastrina sobe. Quando um tumor a produz autonomamente, ela sobe apesar de haver muito ácido. A hipergastrinemia com **hipocloridria** é fisiológica; com **hipercloridria** é gastrinoma.',
    aprofundar: [
      'A interferência dos inibidores de bomba de prótons é tão grande que praticamente inviabiliza o exame sem suspensão prévia: eles podem elevar a gastrina várias vezes acima do normal, alcançando valores que sugeririam gastrinoma. A suspensão deve ser de pelo menos duas semanas — e feita com cautela, porque o paciente com síndrome de Zollinger-Ellison verdadeira pode ter complicação ulcerosa grave sem a medicação. É uma das poucas situações em que a preparação do exame tem risco próprio e exige julgamento clínico.',
      'A síndrome de Zollinger-Ellison deve ser suspeitada em úlceras múltiplas, úlceras distais ao bulbo duodenal, úlcera refratária ao tratamento, úlcera com diarreia (o excesso de ácido inativa as enzimas pancreáticas e causa esteatorreia) e úlcera em paciente sem Helicobacter pylori e sem uso de anti-inflamatórios. Até um quarto dos casos faz parte da neoplasia endócrina múltipla tipo 1, o que obriga a rastrear hiperparatireoidismo e tumores hipofisários.',
      'Os pepsinogênios funcionam como uma "biópsia sorológica" do estômago. O pepsinogênio I é produzido apenas pelas células principais do corpo gástrico; quando essa mucosa atrofia, ele cai, enquanto o pepsinogênio II, produzido também no antro, se mantém. A relação entre os dois cai, e essa queda identifica gastrite atrófica do corpo — condição com risco aumentado de adenocarcinoma gástrico e de tumor neuroendócrino, além de causar deficiência de B12 e de ferro por falta de ácido.',
      'A combinação de pepsinogênios com sorologia para Helicobacter pylori é usada em países de alta incidência para estratificar risco de câncer gástrico e selecionar quem deve fazer endoscopia — uma aplicação de rastreio populacional que o Brasil ainda não adotou de forma sistemática.',
    ],
    fisiologia: {
      oQueE: 'Gastrina: hormônio das células G antrais que estimula a secreção ácida. Pepsinogênios: precursores da pepsina, produzidos pela mucosa gástrica.',
      origem: 'Células G do antro (gastrina); células principais do corpo e do antro (pepsinogênios).',
      funcao: 'Estimular as células parietais a secretar ácido e promover o trofismo da mucosa gástrica.',
      orgaosEnvolvidos: ['Estômago', 'Duodeno', 'Pâncreas'],
      percurso: [
        'Distensão gástrica e peptídeos estimulam as células G',
        'gastrina liberada',
        'estímulo às células enterocromafins-like e parietais',
        'secreção de ácido clorídrico',
        'a acidez inibe a liberação de gastrina — retroalimentação negativa',
      ],
    },
    aumento: {
      resumo: 'Hipocloridria (inibidor de bomba de prótons, gastrite atrófica) ou produção autônoma por gastrinoma.',
      mecanismos: [
        {
          titulo: 'Perda do freio ácido',
          explicacao: 'Sem ácido no lúmen, a inibição fisiológica da célula G desaparece e a gastrina sobe de forma apropriada.',
          exemplos: [
            { causa: 'Uso de inibidor de bomba de prótons', etapas: ['supressão da secreção ácida', 'perda da retroalimentação negativa', 'gastrina ↑ várias vezes', 'hiperplasia das células enterocromafins-like'], nota: 'Causa mais comum de hipergastrinemia — e razão de suspender antes de dosar.' },
            { causa: 'Gastrite atrófica autoimune', etapas: ['destruição das células parietais do corpo', 'hipocloridria', 'gastrina ↑↑ e pepsinogênio I ↓', 'deficiência de B12 por falta de fator intrínseco', 'risco de tumor neuroendócrino gástrico'], nota: 'Anemia macrocítica com gastrina alta e pepsinogênio I baixo é o quadro completo.' },
          ],
        },
        {
          titulo: 'Produção autônoma',
          explicacao: 'Um tumor produz gastrina independentemente do pH luminal, mantendo secreção ácida máxima.',
          exemplos: [
            { causa: 'Gastrinoma (síndrome de Zollinger-Ellison)', etapas: ['tumor neuroendócrino duodenal ou pancreático', 'gastrina > 1.000 pg/mL com pH gástrico ácido', 'úlceras múltiplas e refratárias, diarreia e esteatorreia', 'rastrear neoplasia endócrina múltipla tipo 1'], nota: 'A combinação gastrina alta **com** ácido presente é o que define — sem medir o pH, o diagnóstico não se sustenta.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Pepsinogênio I baixo indica atrofia da mucosa do corpo gástrico; gastrina baixa tem pouco significado clínico.',
      mecanismos: [
        {
          titulo: 'Perda de massa de mucosa gástrica',
          explicacao: 'A destruição das células principais do corpo reduz a produção de pepsinogênio I, enquanto o II, também antral, se mantém.',
          exemplos: [
            { causa: 'Gastrite atrófica do corpo', etapas: ['perda de células principais e parietais', 'pepsinogênio I ↓ e relação I/II ↓', 'risco aumentado de adenocarcinoma gástrico', 'indicação de vigilância endoscópica'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'As consequências da hipocloridria', ids: ['vitamina-b12', 'ferritina', 'cromogranina-a'], leitura: 'Falta de ácido compromete a absorção de ferro e de B12; a hiperplasia das células enterocromafins-like eleva a cromogranina A.' },
      { titulo: 'No contexto da NEM 1', ids: ['pth', 'calcio', 'prolactina'], leitura: 'Gastrinoma com hipercalcemia e hiperprolactinemia configura neoplasia endócrina múltipla tipo 1.' },
    ],
    advertencia:
      'A dosagem em uso de inibidor de bomba de prótons não é interpretável. A suspensão prévia deve ser avaliada individualmente pelo risco de complicação ulcerosa.',
    interferentes: {
      medicamentos: ['Inibidores de bomba de prótons e antagonistas H2 elevam acentuadamente.'],
      fisiologico: ['Alimentação recente eleva — colher em jejum.', 'Insuficiência renal eleva por depuração reduzida.'],
    },
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['vitamina-b12', 'cromogranina-a', 'ferritina'],
  },

  {
    id: 'anti-transglutaminase',
    nome: 'Anticorpos da doença celíaca (anti-tTG, antiendomísio e antigliadina deamidada)',
    sigla: 'Anti-tTG',
    sinonimos: ['anti transglutaminase', 'anti ttg', 'antiendomisio', 'ema', 'antigliadina deamidada', 'dgp', 'doenca celiaca'],
    grupo: 'digestivo',
    sistemas: ['digestivo', 'imunologico'],
    material: 'Soro, com o paciente em dieta contendo glúten',
    unidade: 'U/mL',
    referencias: [
      { rotulo: 'Anti-transglutaminase IgA', texto: 'Não reagente', unidade: 'U/mL' },
      { rotulo: 'IgA sérica total', texto: 'Deve ser dosada junto — deficiência de IgA invalida o teste', unidade: 'mg/dL' },
      { rotulo: 'Antiendomísio IgA', texto: 'Não reagente', unidade: '' },
    ],
    resumo:
      'O rastreio da doença celíaca. Tem duas armadilhas que anulam o exame: dieta sem glúten iniciada antes da coleta, e deficiência seletiva de IgA — que é dez vezes mais frequente em celíacos.',
    entenda:
      'A transglutaminase tecidual é a enzima que deamida a gliadina, tornando-a mais imunogênica em indivíduos com HLA-DQ2 ou DQ8. O anticorpo dirigido a ela tem sensibilidade e especificidade altas e é o exame de primeira linha. Mas ele é da classe IgA — e a deficiência seletiva de IgA, presente em cerca de 2 a 3% dos celíacos contra 0,2% da população geral, produz resultado negativo em quem tem a doença. Por isso a IgA total é dosada obrigatoriamente junto.',
    aprofundar: [
      'A regra que mais compromete o diagnóstico na prática: **o paciente precisa estar comendo glúten**. Muitos chegam ao consultório já em dieta de exclusão iniciada por conta própria, e nessa condição os anticorpos negativam e a biópsia pode normalizar. Nesse caso, ou se faz o teste genético (HLA-DQ2/DQ8, cujo valor é excluir — negativo torna a doença praticamente impossível), ou se realiza reintrodução supervisionada do glúten por semanas antes de investigar.',
      'A doença celíaca se manifesta muito além do intestino, e reconhecer isso é o que aumenta o diagnóstico. Anemia ferropriva refratária à reposição oral, osteoporose precoce, elevação inexplicada de transaminases, infertilidade, dermatite herpetiforme, aftas recorrentes e neuropatia periférica são apresentações frequentes — muitas vezes sem qualquer sintoma digestivo. Anemia ferropriva que não responde a ferro oral é uma das indicações mais rentáveis de rastreio.',
      'Nas crianças, títulos de anti-tTG acima de dez vezes o limite superior, confirmados por antiendomísio positivo em segunda amostra, permitem diagnóstico sem biópsia segundo diretrizes pediátricas. Em adultos, a biópsia duodenal permanece necessária para confirmar e para estabelecer o grau de atrofia vilositária.',
      'O antiendomísio é mais específico e serve como confirmatório, mas depende de imunofluorescência com leitura operador-dependente. O antigliadina deamidada da classe IgG é a alternativa nos deficientes de IgA e em crianças abaixo de dois anos, em que a resposta à transglutaminase pode ainda não estar estabelecida.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos contra a transglutaminase tecidual tipo 2 e contra peptídeos de gliadina deamidada.',
      origem: 'Plasmócitos da lâmina própria intestinal.',
      funcao: 'Marcadores da resposta autoimune desencadeada pelo glúten em indivíduos geneticamente predispostos.',
      orgaosEnvolvidos: ['Intestino delgado', 'Pele', 'Fígado'],
      percurso: [
        'Ingestão de glúten em portador de HLA-DQ2 ou DQ8',
        'transglutaminase deamida a gliadina',
        'apresentação do peptídeo modificado ao linfócito T',
        'resposta inflamatória com atrofia vilositária',
        'produção de anticorpos detectáveis no soro',
      ],
    },
    aumento: {
      resumo: 'Doença celíaca ativa — e, em títulos baixos, ocasionalmente outras condições autoimunes ou hepatopatias.',
      mecanismos: [
        {
          titulo: 'Resposta autoimune ao glúten',
          explicacao: 'A exposição continuada ao glúten em predisposto mantém a produção de anticorpos e a atrofia vilositária.',
          exemplos: [
            { causa: 'Doença celíaca clássica', etapas: ['atrofia vilositária', 'má absorção com diarreia, distensão e perda de peso', 'anti-tTG ↑ com IgA total normal', 'biópsia duodenal confirma'] },
            { causa: 'Apresentação extraintestinal', etapas: ['anemia ferropriva refratária a ferro oral', 'osteoporose precoce ou transaminases elevadas sem causa', 'anti-tTG positivo sem sintomas digestivos'], nota: 'É a forma mais frequentemente perdida.' },
            { causa: 'Dermatite herpetiforme', etapas: ['depósitos de IgA nas papilas dérmicas', 'lesões vesiculosas pruriginosas em superfícies extensoras', 'anti-tTG frequentemente positivo', 'resposta à dieta sem glúten'] },
            { causa: 'Títulos baixos em outras condições', etapas: ['hepatopatia crônica, insuficiência cardíaca, outras doenças autoimunes', 'positividade fraca sem doença celíaca', 'antiendomísio negativo'], nota: 'Títulos discretos exigem confirmação antes de impor dieta vitalícia.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O exame obrigatório junto', ids: ['imunoglobulinas'], leitura: 'A IgA total deve ser dosada na mesma amostra: sua deficiência produz falso-negativo e exige testes da classe IgG.' },
      { titulo: 'As consequências da má absorção', ids: ['ferritina', 'vitamina-b12', 'acido-folico', 'vitamina-d', 'albumina'], leitura: 'Ferro, folato, B12, vitamina D e cálcio são os déficits mais frequentes — a ferropenia refratária é a apresentação mais comum no adulto.' },
    ],
    advertencia:
      'O exame só é válido com o paciente em dieta contendo glúten. Dose sempre a IgA total junto: sua deficiência é dez vezes mais frequente em celíacos e produz falso-negativo.',
    utilidade: ['triagem', 'diagnostico', 'acompanhamento'],
    estudarTambem: ['imunoglobulinas', 'ferritina', 'vitamina-d'],
  },

  {
    id: 'calprotectina-fecal',
    nome: 'Calprotectina e lactoferrina fecais',
    sigla: 'Calprotectina',
    sinonimos: ['calprotectina fecal', 'calprotectina', 'lactoferrina fecal', 'marcador de inflamacao intestinal'],
    grupo: 'fecal',
    sistemas: ['digestivo', 'imunologico'],
    material: 'Amostra isolada de fezes',
    unidade: 'µg/g',
    referencias: [
      { rotulo: 'Normal', texto: '< 50', unidade: 'µg/g' },
      { rotulo: 'Zona indeterminada', texto: '50 a 150 — repetir em 4 a 6 semanas', unidade: 'µg/g' },
      { rotulo: 'Inflamação provável', texto: '> 150', unidade: 'µg/g' },
      { rotulo: 'Doença inflamatória intestinal em atividade', texto: '> 250', unidade: 'µg/g' },
    ],
    resumo:
      'Mede o quanto o neutrófilo migrou para o lúmen intestinal. Distingue doença inflamatória intestinal de síndrome do intestino irritável com desempenho que nenhum exame de sangue alcança — e evita colonoscopias.',
    entenda:
      'A calprotectina é uma proteína ligadora de cálcio e zinco que representa cerca de 60% das proteínas citoplasmáticas do neutrófilo. Quando há inflamação da mucosa intestinal, neutrófilos migram para o lúmen e são eliminados nas fezes; a calprotectina é estável nesse meio por vários dias e pode ser quantificada. Ela mede inflamação **intestinal** especificamente — a PCR mede inflamação sistêmica e pode estar normal em doença de Crohn ileal limitada.',
    aprofundar: [
      'O impacto clínico maior está em quem **não** precisa de colonoscopia. Um paciente jovem com dor abdominal e alteração do hábito intestinal, sem sinais de alarme e com calprotectina abaixo de 50 µg/g, tem probabilidade muito baixa de doença inflamatória intestinal, e o diagnóstico de síndrome do intestino irritável pode ser feito com segurança. Evitar uma colonoscopia desnecessária em um paciente de 25 anos não é economia — é boa medicina.',
      'No seguimento da doença inflamatória intestinal, a calprotectina reflete a atividade **da mucosa**, que é o alvo terapêutico atual. Um paciente pode estar assintomático com inflamação mucosa persistente — e essa inflamação silenciosa é a que produz complicações. A elevação da calprotectina antecipa a recidiva clínica em semanas a meses, permitindo intervenção antes do sintoma. Também prediz recidiva pós-operatória na doença de Crohn.',
      'As causas não inflamatórias intestinais de elevação precisam ser conhecidas para não gerar investigação equivocada: anti-inflamatórios não esteroidais (causa muito frequente), infecções entéricas, doença celíaca, diverticulite, pólipos e neoplasia colorretal. Em crianças pequenas os valores são fisiologicamente mais altos.',
      'A lactoferrina fecal mede essencialmente o mesmo fenômeno — migração neutrofílica — e tem desempenho comparável. A escolha entre as duas costuma ser de disponibilidade local, e o seguimento deve manter o mesmo marcador e o mesmo laboratório.',
    ],
    fisiologia: {
      oQueE: 'Proteína heterodimérica ligadora de cálcio e zinco, abundante no citoplasma dos neutrófilos.',
      origem: 'Neutrófilos que migram para o lúmen intestinal durante a inflamação da mucosa.',
      funcao: 'Atividade antimicrobiana por sequestro de zinco e manganês, privando bactérias e fungos desses metais.',
      orgaosEnvolvidos: ['Intestino delgado', 'Cólon'],
      percurso: [
        'Inflamação da mucosa intestinal',
        'quimiotaxia e migração de neutrófilos para o lúmen',
        'lise celular com liberação de calprotectina',
        'estabilidade nas fezes por vários dias',
        'quantificação proporcional à intensidade da inflamação',
      ],
    },
    aumento: {
      resumo: 'Inflamação da mucosa intestinal de qualquer causa — doença inflamatória intestinal, infecção, anti-inflamatórios, neoplasia.',
      mecanismos: [
        {
          titulo: 'Migração neutrofílica para o lúmen',
          explicacao: 'Qualquer processo que rompa a barreira mucosa e recrute neutrófilos eleva a calprotectina, em proporção à extensão e à intensidade da inflamação.',
          exemplos: [
            { causa: 'Doença de Crohn e retocolite ulcerativa em atividade', etapas: ['inflamação transmural ou mucosa', 'recrutamento neutrofílico intenso', 'calprotectina > 250 µg/g', 'correlação com achados endoscópicos'], nota: 'Reflete atividade da mucosa, que é o alvo terapêutico — melhor que sintomas e melhor que PCR.' },
            { causa: 'Uso de anti-inflamatórios não esteroidais', etapas: ['enteropatia induzida por inibição de prostaglandinas', 'inflamação de intestino delgado', 'calprotectina ↑ sem doença inflamatória intestinal'], nota: 'Causa muito frequente de resultado alterado — perguntar sempre sobre o uso.' },
            { causa: 'Infecção entérica bacteriana', etapas: ['invasão da mucosa', 'resposta neutrofílica', 'calprotectina ↑ transitoriamente', 'normalização após a resolução'] },
            { causa: 'Neoplasia colorretal e pólipos', etapas: ['inflamação peritumoral', 'calprotectina moderadamente elevada'], nota: 'Não é exame de rastreio de câncer — para isso, o sangue oculto imunoquímico é o teste validado.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O que a calprotectina acrescenta', ids: ['pcr', 'vhs', 'hemoglobina', 'albumina'], leitura: 'A PCR mede inflamação sistêmica e pode estar normal em doença ileal limitada; a calprotectina mede inflamação intestinal diretamente.' },
      { titulo: 'Antes de concluir por doença inflamatória', ids: ['parasitologico-fezes', 'anti-transglutaminase'], leitura: 'Infecção entérica e doença celíaca elevam a calprotectina e precisam ser afastadas.' },
    ],
    utilidade: ['triagem', 'diagnostico', 'acompanhamento'],
    estudarTambem: ['pcr', 'sangue-oculto-fezes', 'anti-transglutaminase'],
  },

  {
    id: 'elastase-fecal',
    nome: 'Elastase pancreática fecal e gordura fecal',
    sigla: 'Elastase-1',
    sinonimos: ['elastase fecal', 'elastase-1', 'elastase pancreatica', 'gordura fecal', 'esteatorreia', 'sudan iii', 'van de kamer'],
    grupo: 'fecal',
    sistemas: ['digestivo'],
    material: 'Amostra isolada de fezes (elastase) ou coleta de 72 horas (gordura)',
    unidade: 'µg/g e g/24h',
    referencias: [
      { rotulo: 'Elastase fecal — normal', texto: '> 200', unidade: 'µg/g' },
      { rotulo: 'Insuficiência pancreática moderada', texto: '100 a 200', unidade: 'µg/g' },
      { rotulo: 'Insuficiência pancreática grave', texto: '< 100', unidade: 'µg/g' },
      { rotulo: 'Gordura fecal de 72h', texto: '< 7 g/24h com dieta de 100 g de gordura/dia', unidade: 'g/24h' },
    ],
    resumo:
      'A elastase fecal diagnostica insuficiência pancreática exócrina sem sonda duodenal — e, ao contrário de outras enzimas, não é degradada no trânsito intestinal nem afetada pela reposição enzimática oral.',
    entenda:
      'A elastase-1 pancreática resiste à degradação ao longo do trato digestivo e chega às fezes praticamente intacta, em concentração proporcional à produção pancreática. Isso a torna um marcador direto da função exócrina. Uma propriedade prática importante: as enzimas de reposição usadas no tratamento são de origem suína e não são reconhecidas pelo ensaio, que é específico para a elastase humana. O exame pode, portanto, ser feito sem suspender o tratamento.',
    aprofundar: [
      'A insuficiência pancreática exócrina é subdiagnosticada porque a esteatorreia só aparece quando mais de 90% da função foi perdida — a reserva do pâncreas é enorme. Antes disso, o paciente tem sintomas inespecíficos: distensão, flatulência, desconforto pós-prandial, perda de peso discreta e deficiência de vitaminas lipossolúveis. Pensar nela em pancreatite crônica, pós-pancreatectomia, fibrose cística, doença celíaca de longa data e diabetes de longa duração aumenta muito a taxa de diagnóstico.',
      'Uma limitação a conhecer: fezes líquidas diluem a elastase e produzem falso-positivo. O exame deve ser feito em amostra formada; em paciente com diarreia intensa, o resultado baixo pode não refletir a função pancreática.',
      'A dosagem quantitativa de gordura fecal em 72 horas continua sendo o padrão para documentar esteatorreia, mas é impopular por razões óbvias — exige dieta padronizada com 100 g de gordura por dia e coleta de três dias. A pesquisa qualitativa com Sudan III é simples e útil como triagem, embora menos sensível.',
      'A esteatorreia tem três origens que a elastase ajuda a separar: pancreática (elastase baixa), biliar (falta de sais biliares, com elastase normal) e mucosa (doença celíaca, doença de Crohn, supercrescimento bacteriano, também com elastase normal). Gordura fecal alta com elastase normal desloca a investigação para o intestino e para a via biliar.',
    ],
    fisiologia: {
      oQueE: 'Elastase-1: protease pancreática resistente à degradação intestinal. Gordura fecal: lipídios não absorvidos.',
      origem: 'Ácinos pancreáticos.',
      funcao: 'Digestão proteica; sua concentração fecal reflete a produção exócrina do pâncreas.',
      orgaosEnvolvidos: ['Pâncreas', 'Duodeno', 'Íleo'],
      percurso: [
        'Síntese acinar e secreção no suco pancreático',
        'trânsito intestinal sem degradação significativa',
        'concentração fecal proporcional à produção',
        'redução quando mais de 90% da função exócrina se perde',
      ],
    },
    aumento: {
      resumo: 'Elastase fecal alta não tem significado clínico; gordura fecal alta indica má absorção de lipídios.',
      mecanismos: [
        {
          titulo: 'Má absorção de gordura',
          explicacao: 'A digestão dos lipídios exige enzima pancreática, sal biliar e mucosa absortiva íntegra — a falha de qualquer um dos três produz esteatorreia.',
          exemplos: [
            { causa: 'Insuficiência pancreática exócrina', etapas: ['perda de mais de 90% da função acinar', 'lipase insuficiente', 'esteatorreia com elastase fecal < 100 µg/g', 'deficiência de vitaminas A, D, E e K'] },
            { causa: 'Colestase e desvio biliar', etapas: ['falta de sais biliares para emulsificar', 'esteatorreia com elastase fecal normal', 'investigação dirigida à via biliar'] },
            { causa: 'Doença celíaca, Crohn, supercrescimento bacteriano', etapas: ['superfície absortiva comprometida ou desconjugação de sais biliares', 'esteatorreia com elastase normal', 'investigação da mucosa'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Elastase fecal baixa indica insuficiência pancreática exócrina — ou fezes líquidas diluindo a amostra.',
      mecanismos: [
        {
          titulo: 'Perda de massa acinar pancreática',
          explicacao: 'A destruição progressiva do parênquima exócrino reduz a produção enzimática total.',
          exemplos: [
            { causa: 'Pancreatite crônica', etapas: ['fibrose e perda acinar progressiva', 'elastase fecal ↓', 'esteatorreia e perda de peso', 'reposição enzimática indicada'], nota: 'O exame pode ser feito sem suspender a reposição — o ensaio não reconhece a enzima suína.' },
            { causa: 'Fibrose cística e pós-pancreatectomia', etapas: ['obstrução ductal ou remoção de parênquima', 'insuficiência exócrina', 'elastase muito baixa desde a infância na fibrose cística'] },
            { causa: 'Amostra líquida', etapas: ['diluição da elastase pelas fezes aquosas', 'resultado falsamente baixo'], nota: 'Repetir em amostra formada antes de concluir.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'As consequências nutricionais', ids: ['vitamina-d', 'albumina', 'inr'], leitura: 'A má absorção de gorduras leva a déficit de vitaminas lipossolúveis — INR alargado por falta de vitamina K é uma apresentação clássica e reversível.' },
      { titulo: 'A causa da esteatorreia', ids: ['anti-transglutaminase', 'lipase', 'acidos-biliares'], leitura: 'Elastase baixa aponta o pâncreas; elastase normal com esteatorreia desloca a investigação para mucosa ou via biliar.' },
    ],
    interferentes: {
      preAnalitico: ['Fezes líquidas diluem a elastase e produzem falso-positivo para insuficiência.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['lipase', 'vitamina-d', 'anti-transglutaminase'],
  },

  {
    id: 'sangue-oculto-fezes',
    nome: 'Pesquisa de sangue oculto nas fezes (teste imunoquímico)',
    sigla: 'FIT / PSOF',
    sinonimos: ['sangue oculto', 'psof', 'fit', 'pesquisa de sangue oculto nas fezes', 'teste imunoquimico fecal', 'guaiaco'],
    grupo: 'fecal',
    sistemas: ['digestivo', 'oncologico'],
    material: 'Amostra isolada de fezes',
    unidade: 'reagente/não reagente ou µg de hemoglobina/g',
    referencias: [
      { rotulo: 'Teste imunoquímico', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Periodicidade no rastreamento', texto: 'Anual ou bienal a partir dos 45 a 50 anos', unidade: '' },
    ],
    resumo:
      'O exame de rastreamento de câncer colorretal com redução de mortalidade demonstrada. O teste imunoquímico detecta hemoglobina humana especificamente e dispensa a restrição dietética que o antigo teste do guáiaco exigia.',
    entenda:
      'Adenomas avançados e carcinomas colorretais sangram de forma intermitente e em quantidade pequena, invisível a olho nu. O teste imunoquímico usa anticorpos contra a globina humana, o que lhe dá duas vantagens sobre o método químico do guáiaco: não reage com hemoglobina animal da dieta nem com peroxidases vegetais, e não detecta sangramento alto — a globina é digerida no estômago e no intestino delgado, de modo que um resultado positivo aponta especificamente para o cólon.',
    aprofundar: [
      'A distinção mais importante deste exame é entre rastreamento e diagnóstico. Ele foi validado para rastrear pessoas **assintomáticas** de risco médio, e nesse papel reduz mortalidade por câncer colorretal. Em alguém com sangramento visível, anemia ferropriva, alteração do hábito intestinal ou perda de peso, o exame não tem papel: a colonoscopia está indicada independentemente do resultado, e um resultado negativo não deve tranquilizar ninguém nem adiar o procedimento.',
      'A periodicidade é parte do desempenho. Como o sangramento é intermitente, um único teste tem sensibilidade limitada; é a repetição anual ou bienal que confere ao programa a capacidade de detectar. Um teste isolado negativo, feito uma vez na vida, não cumpre a função de rastreamento.',
      'Todo resultado positivo exige colonoscopia — e não repetição do exame. Repetir um teste positivo até que venha negativo é uma prática que anula o programa de rastreio e atrasa diagnósticos. O valor preditivo positivo para neoplasia avançada justifica o procedimento.',
      'O teste do guáiaco, ainda usado em alguns serviços, exige restrição de carne vermelha, vitamina C e anti-inflamatórios por três dias, detecta sangramento de qualquer altura do trato digestivo e tem desempenho inferior. Onde houver escolha, o imunoquímico é superior em todos os aspectos.',
    ],
    fisiologia: {
      oQueE: 'Detecção de hemoglobina humana nas fezes por imunoensaio específico para a globina.',
      origem: 'Sangramento da mucosa colorretal.',
      funcao: 'Identificar lesões colorretais sangrantes antes de qualquer sintoma.',
      orgaosEnvolvidos: ['Cólon', 'Reto'],
      percurso: [
        'Adenoma avançado ou carcinoma com superfície friável',
        'sangramento intermitente de pequeno volume',
        'globina preservada no trânsito colônico',
        'detecção por anticorpo específico',
        'sangramento alto não é detectado — a globina é digerida antes',
      ],
    },
    aumento: {
      resumo: 'Resultado reagente indica sangramento colorretal — neoplásico ou não — e sempre exige colonoscopia.',
      significado:
        'Positivo não significa câncer: hemorroidas, doença diverticular, doença inflamatória intestinal e angiodisplasia também sangram. Mas todos exigem investigação endoscópica.',
      mecanismos: [
        {
          titulo: 'Sangramento da mucosa colorretal',
          explicacao: 'Lesões com neovascularização friável ou ulceração perdem sangue de forma intermitente para o lúmen.',
          exemplos: [
            { causa: 'Adenoma avançado ou carcinoma colorretal', etapas: ['superfície tumoral friável', 'sangramento intermitente', 'teste reagente', 'colonoscopia com ressecção — que interrompe a sequência adenoma-carcinoma'], nota: 'É onde o rastreamento salva vidas: removendo o adenoma antes de ele virar câncer.' },
            { causa: 'Doença hemorroidária, diverticular, inflamatória intestinal, angiodisplasia', etapas: ['sangramento de causa benigna', 'teste reagente', 'colonoscopia igualmente indicada'], nota: 'Atribuir o resultado a hemorroidas sem investigar é um erro que atrasa diagnósticos.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Quando a anemia é a pista', ids: ['ferritina', 'hemoglobina', 'vcm'], leitura: 'Anemia ferropriva em homem ou em mulher pós-menopausa exige investigação do trato digestivo independentemente do sangue oculto.' },
      { titulo: 'Marcadores relacionados', ids: ['cea', 'calprotectina-fecal'], leitura: 'O CEA não serve para rastreio, apenas para seguimento pós-operatório. A calprotectina mede inflamação, não sangramento.' },
    ],
    advertencia:
      'Exame de rastreamento em assintomáticos. Em quem tem sintomas ou anemia ferropriva, a colonoscopia está indicada independentemente do resultado — um teste negativo não exclui neoplasia. Todo resultado positivo exige colonoscopia, nunca repetição do teste.',
    utilidade: ['rastreamento'],
    estudarTambem: ['cea', 'ferritina', 'calprotectina-fecal'],
  },

  {
    id: 'parasitologico-fezes',
    nome: 'Parasitológico de fezes, coprocultura e toxina de Clostridioides difficile',
    sigla: 'EPF',
    sinonimos: ['parasitologico de fezes', 'epf', 'coprocultura', 'toxina clostridium', 'clostridioides difficile', 'exame de fezes', 'protoparasitologico'],
    grupo: 'fecal',
    sistemas: ['digestivo', 'infeccioso'],
    material: 'Fezes — três amostras em dias alternados para o parasitológico',
    unidade: 'presença/ausência',
    referencias: [
      { rotulo: 'Parasitológico', texto: 'Ausência de cistos, ovos e larvas', unidade: '' },
      { rotulo: 'Coprocultura', texto: 'Ausência de patógenos entéricos', unidade: '' },
      { rotulo: 'Toxinas A e B de C. difficile', texto: 'Não detectadas', unidade: '' },
    ],
    resumo:
      'Os exames que identificam o agente da diarreia. Cada um tem uma regra de uso que determina se ele será útil ou desperdiçado — e as três amostras do parasitológico não são burocracia.',
    entenda:
      'A eliminação de ovos e cistos é intermitente: um parasita presente pode não aparecer em uma única amostra. Por isso o parasitológico se faz em três amostras colhidas em dias alternados, o que aumenta substancialmente a sensibilidade. Uma amostra única negativa em paciente com suspeita clínica forte não exclui parasitose — é o erro mais comum com este exame.',
    aprofundar: [
      'A estrongiloidíase merece atenção especial no Brasil e exige método próprio. O Strongyloides elimina larvas, não ovos, e sua detecção requer o método de Baermann ou a cultura em placa de ágar — o exame de rotina tem sensibilidade baixa. A razão de insistir: a imunossupressão, sobretudo por corticoide, pode transformar uma infecção crônica assintomática em hiperinfecção disseminada com mortalidade altíssima. Todo paciente que vai receber corticoide em dose alta, quimioterapia ou imunobiológico e vem de área endêmica deve ser investigado e, em muitos protocolos, tratado empiricamente com ivermectina.',
      'A coprocultura tem indicação restrita, e isso é deliberado: a maioria das diarreias agudas é viral e autolimitada, e a cultura não muda a conduta. Ela se justifica em diarreia com sangue, febre alta, sinais de desidratação grave, imunossupressão, duração acima de sete dias, e em contextos de surto ou saúde pública. Pedir coprocultura em toda diarreia é gastar recurso sem alterar decisão.',
      'A pesquisa de Clostridioides difficile tem uma regra que é violada com frequência: **só se testa fezes diarreicas**. Uma parcela significativa de pacientes hospitalizados é colonizada sem doença, e testar fezes formadas identifica colonização — levando a tratamento desnecessário, com custo, efeitos adversos e mais disbiose. A conduta correta é testar apenas quem tem três ou mais evacuações não formadas em 24 horas. Pelo mesmo motivo, não se faz teste de cura: o exame permanece positivo por semanas após a resolução clínica.',
      'Nas parasitoses, a eosinofilia acompanha os helmintos com fase tecidual — Strongyloides, Ascaris, ancilostomídeos, Toxocara, Schistosoma — e não acompanha os protozoários intestinais como Giardia e Entamoeba. Diarreia com eosinofilia aponta para helmintíase; sem eosinofilia, não a exclui, mas desloca a probabilidade.',
    ],
    fisiologia: {
      oQueE: 'Exames que identificam parasitas, bactérias patogênicas e toxinas bacterianas nas fezes.',
      origem: 'Trato digestivo.',
      funcao: 'Identificar o agente etiológico da diarreia ou da parasitose intestinal.',
      orgaosEnvolvidos: ['Intestino delgado', 'Cólon'],
      percurso: [
        'Ingestão de cisto, ovo ou larva',
        'ciclo no hospedeiro, por vezes com fase tecidual',
        'eliminação intermitente de formas infectantes nas fezes',
        'detecção microscópica, por cultura ou por pesquisa de toxina',
      ],
    },
    aumento: {
      resumo: 'A identificação do agente define o tratamento — e a ausência dele em amostra única não exclui nada.',
      mecanismos: [
        {
          titulo: 'Identificação do agente etiológico',
          explicacao: 'Cada método detecta um tipo de agente, e a escolha do método precisa corresponder à suspeita clínica.',
          exemplos: [
            { causa: 'Estrongiloidíase', etapas: ['eliminação de larvas, não de ovos', 'necessidade do método de Baermann ou ágar', 'eosinofilia frequentemente presente', 'risco de hiperinfecção sob corticoide'], nota: 'Investigar e tratar antes de imunossuprimir salva vidas.' },
            { causa: 'Giardíase e amebíase', etapas: ['protozoários com eliminação intermitente de cistos', 'três amostras em dias alternados', 'geralmente sem eosinofilia'], nota: 'A ausência de eosinofilia não afasta protozoário — ela só acompanha helmintos com fase tecidual.' },
            { causa: 'Colite por Clostridioides difficile', etapas: ['uso recente de antimicrobiano', 'disbiose e proliferação do C. difficile', 'produção de toxinas A e B', 'diarreia com leucocitose e, nos casos graves, megacólon'], nota: 'Testar apenas fezes diarreicas; não repetir para controle de cura.' },
            { causa: 'Diarreia bacteriana invasiva', etapas: ['Salmonella, Shigella, Campylobacter ou E. coli invasiva', 'diarreia com sangue e febre', 'coprocultura indicada'], nota: 'Em suspeita de E. coli produtora de toxina Shiga, o antimicrobiano pode aumentar o risco de síndrome hemolítico-urêmica.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O que o sangue acrescenta', ids: ['eosinofilos-absolutos', 'ige-total', 'calprotectina-fecal'], leitura: 'Eosinofilia e IgE alta apontam para helmintos; a calprotectina alta indica inflamação da mucosa e ajuda a separar diarreia inflamatória de funcional.' },
      { titulo: 'Na diarreia grave', ids: ['leucocitos', 'creatinina', 'sodio', 'potassio', 'lactato'], leitura: 'Leucocitose, insuficiência renal e distúrbios eletrolíticos definem gravidade melhor que o próprio agente.' },
    ],
    advertencia:
      'Uma amostra negativa não exclui parasitose — o parasitológico exige três amostras em dias alternados. Não pesquise C. difficile em fezes formadas nem para controle de cura.',
    interferentes: {
      preAnalitico: ['Uso recente de contraste baritado, antiácidos, antimicrobianos e antiparasitários reduz a sensibilidade — aguardar alguns dias.', 'Fezes com urina ou água do vaso inviabilizam a análise.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['eosinofilos-absolutos', 'calprotectina-fecal', 'culturas'],
  },

  {
    id: 'alfa-1-antitripsina-fecal',
    nome: 'Alfa-1-antitripsina fecal (clearance de alfa-1-antitripsina)',
    sigla: 'A1AT fecal',
    sinonimos: ['alfa 1 antitripsina fecal', 'clearance de alfa 1 antitripsina', 'enteropatia perdedora de proteina'],
    grupo: 'fecal',
    sistemas: ['digestivo'],
    material: 'Fezes de 24 horas e soro',
    unidade: 'mL/24h',
    referencias: [
      { rotulo: 'Clearance de alfa-1-antitripsina', texto: '< 24', unidade: 'mL/24h' },
      { rotulo: 'Com diarreia', texto: '< 56', unidade: 'mL/24h' },
    ],
    resumo:
      'Prova que a proteína está sendo perdida pelo intestino. É o único exame que documenta enteropatia perdedora de proteína — porque usa uma proteína plasmática que resiste à digestão.',
    entenda:
      'A hipoalbuminemia tem quatro causas possíveis: síntese hepática reduzida, perda urinária, perda intestinal e consumo inflamatório. As três primeiras são fáceis de investigar — função hepática, proteinúria — mas a perda intestinal não tem marcador sérico. A alfa-1-antitripsina resolve isso porque tem peso molecular semelhante ao da albumina e, sendo uma antiprotease, não é degradada pelas enzimas digestivas: se ela aparece nas fezes, é porque vazou da circulação para o lúmen.',
    aprofundar: [
      'A investigação da hipoalbuminemia segue uma ordem lógica: albumina baixa com função hepática normal e sem proteinúria significativa deixa a perda intestinal como principal hipótese — e este exame a confirma. Diante de edema com albumina baixa, é frequente que a investigação pare na ausência de proteinúria e não avance, deixando o diagnóstico em aberto por meses.',
      'As causas se dividem em três grupos com fisiopatologias distintas: ulceração ou erosão da mucosa (doença inflamatória intestinal, neoplasia, enterite actínica), aumento da permeabilidade sem ulceração (doença celíaca, gastrite de Ménétrier, supercrescimento bacteriano) e obstrução linfática (linfangiectasia intestinal primária, pericardite constritiva, insuficiência cardíaca direita, cirurgia de Fontan).',
      'O grupo linfático merece destaque por ser contraintuitivo: um paciente com pericardite constritiva ou insuficiência cardíaca direita crônica pode ter hipoalbuminemia por perda intestinal, e o tratamento é cardíaco, não digestivo. A pista laboratorial adicional é a linfopenia — a linfa perdida carrega linfócitos junto com a proteína, e a combinação de hipoalbuminemia com linfopenia e hipogamaglobulinemia é bastante sugestiva de linfangiectasia.',
      'O exame deve ser interpretado com o pH gástrico em mente: a alfa-1-antitripsina é degradada em pH abaixo de 3, de modo que perdas gástricas — como na gastrite de Ménétrier — podem não ser detectadas sem supressão ácida concomitante.',
    ],
    fisiologia: {
      oQueE: 'Depuração fecal da alfa-1-antitripsina, calculada a partir de sua concentração nas fezes de 24 horas e no soro.',
      origem: 'Proteína plasmática de origem hepática que vaza para o lúmen intestinal.',
      funcao: 'Servir de marcador da perda proteica entérica por resistir à digestão.',
      orgaosEnvolvidos: ['Intestino delgado', 'Cólon', 'Sistema linfático'],
      percurso: [
        'Alfa-1-antitripsina plasmática',
        'extravasamento para o lúmen por ulceração, permeabilidade ou obstrução linfática',
        'resistência à degradação pelas proteases digestivas',
        'excreção fecal proporcional à perda',
      ],
    },
    aumento: {
      resumo: 'Perda proteica intestinal por ulceração, permeabilidade aumentada ou obstrução linfática.',
      mecanismos: [
        {
          titulo: 'Ruptura ou permeabilidade da mucosa',
          explicacao: 'A lesão epitelial permite que proteínas plasmáticas escapem diretamente para o lúmen.',
          exemplos: [
            { causa: 'Doença inflamatória intestinal, neoplasia, enterite actínica', etapas: ['ulceração da mucosa', 'exsudação de proteínas plasmáticas', 'hipoalbuminemia com clearance de alfa-1-antitripsina elevado'] },
            { causa: 'Doença celíaca e gastrite de Ménétrier', etapas: ['aumento da permeabilidade sem ulceração franca', 'perda proteica', 'hipoalbuminemia com edema'], nota: 'No caso gástrico, a supressão ácida é necessária para o exame não subestimar.' },
          ],
        },
        {
          titulo: 'Obstrução linfática',
          explicacao: 'A hipertensão nos linfáticos intestinais rompe os vasos e derrama linfa — rica em proteína e linfócitos — no lúmen.',
          exemplos: [
            { causa: 'Linfangiectasia intestinal primária', etapas: ['dilatação dos linfáticos da mucosa', 'perda de linfa para o lúmen', 'hipoalbuminemia, linfopenia e hipogamaglobulinemia', 'edema e derrames'], nota: 'A tríade albumina baixa + linfopenia + imunoglobulinas baixas é bastante característica.' },
            { causa: 'Pericardite constritiva, insuficiência cardíaca direita, circulação de Fontan', etapas: ['pressão venosa central elevada', 'hipertensão linfática', 'enteropatia perdedora de proteína secundária', 'tratamento é cardíaco'], nota: 'Hipoalbuminemia inexplicada em cardiopata deve levantar essa hipótese.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A investigação da hipoalbuminemia', ids: ['albumina', 'proteinuria', 'inr', 'imunoglobulinas'], leitura: 'Descarte perda renal com proteinúria e falência de síntese com INR e função hepática antes de investigar o intestino.' },
      { titulo: 'A pista da linfangiectasia', ids: ['linfocitos-absolutos', 'imunoglobulinas'], leitura: 'Linfopenia com hipogamaglobulinemia e hipoalbuminemia aponta para perda linfática.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['albumina', 'imunoglobulinas', 'linfocitos-absolutos'],
  },
]
