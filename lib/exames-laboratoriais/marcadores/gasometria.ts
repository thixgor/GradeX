import type { Marcador } from '../tipos'

/**
 * Gasometria e equilíbrio ácido-base.
 *
 * A gasometria é o exame mais algorítmico da medicina: existe uma sequência de
 * perguntas que, respondidas em ordem, resolve praticamente qualquer laudo.
 * Há acidemia ou alcalemia? O distúrbio primário é respiratório ou metabólico?
 * A compensação é adequada? Existe um segundo distúrbio escondido? Como está a
 * oxigenação? Essa sequência está implementada no interpretador da seção — e
 * as fichas abaixo explicam por que cada passo existe.
 */
export const marcadores: Marcador[] = [
  {
    id: 'ph',
    nome: 'pH arterial',
    sinonimos: ['ph', 'ph sanguineo', 'acidemia', 'alcalemia'],
    grupo: 'gasometria',
    sistemas: ['respiratorio', 'metabolico', 'renal'],
    material: 'Sangue arterial (ou venoso, com ressalvas)',
    unidade: '—',
    referencias: [
      { rotulo: 'Arterial', minimo: 7.35, maximo: 7.45, unidade: '' },
      { rotulo: 'Venoso', minimo: 7.32, maximo: 7.42, unidade: '', observacao: 'O pH venoso é cerca de 0,03 a 0,05 mais baixo — útil para triagem, insuficiente para avaliar oxigenação.' },
    ],
    resumo: 'A concentração de íons hidrogênio, em escala logarítmica. Define o distúrbio primário — e é sempre a primeira pergunta da leitura.',
    entenda:
      'O pH resulta da razão entre bicarbonato (metabólico, regulado pelo rim em dias) e PaCO₂ (respiratório, regulado pelo pulmão em minutos). A compensação nunca corrige o pH por completo: ela o aproxima do normal, mas não o ultrapassa. É por isso que o pH sempre aponta o distúrbio primário — se está ácido, o distúrbio primário é uma acidose, ainda que exista alcalose associada.',
    aprofundar: [
      'pH normal não significa ausência de distúrbio. Ele pode ser normal por compensação adequada de um distúrbio único, ou por distúrbios mistos que se anulam — acidose metabólica com alcalose respiratória, por exemplo, como no salicilato e na sepse. Por isso a leitura da gasometria nunca termina no pH: é obrigatório conferir se a compensação observada corresponde à esperada e calcular o ânion gap.',
      'O organismo tem três linhas de defesa contra variações de pH, em escalas de tempo distintas: os tampões químicos agem em segundos (bicarbonato, hemoglobina, proteínas, fosfato); a compensação respiratória, em minutos a horas; e a renal, em horas a dias. Essa hierarquia temporal explica por que uma acidose metabólica aguda já vem com hiperventilação, mas uma acidose respiratória aguda ainda não tem elevação de bicarbonato — que só aparece após 3 a 5 dias e permite datar o distúrbio.',
    ],
    fisiologia: {
      oQueE: 'Logaritmo negativo da concentração de íons hidrogênio no plasma.',
      origem: 'Resulta do balanço entre produção de ácidos (metabolismo) e sua eliminação (pulmão e rim).',
      funcao: 'Manter a conformação e a função das proteínas: fora da faixa estreita, enzimas, canais e receptores deixam de funcionar.',
      orgaosEnvolvidos: ['Pulmão (CO₂, em minutos)', 'Rim (bicarbonato e H⁺, em dias)', 'Tampões plasmáticos e intracelulares (imediatos)'],
      percurso: ['Produção diária de ácidos fixos e voláteis', 'tamponamento imediato', 'compensação respiratória (minutos)', 'compensação renal (dias)', 'pH mantido entre 7,35 e 7,45'],
    },
    aumento: {
      resumo: 'Alcalemia: alcalose metabólica (bicarbonato alto) ou respiratória (PaCO₂ baixa).',
      mecanismos: [
        {
          titulo: 'Alcalose respiratória',
          explicacao: 'A hiperventilação elimina CO₂ mais rápido do que ele é produzido.',
          exemplos: [
            { causa: 'Ansiedade, dor, febre, hipoxemia, embolia pulmonar, sepse precoce, gestação, altitude, intoxicação por salicilato', etapas: ['hiperventilação', 'PaCO₂ ↓', 'pH ↑'], nota: 'Alcalose respiratória inexplicada em paciente grave deve fazer pensar em sepse ou embolia — é frequentemente o primeiro sinal gasométrico.' },
          ],
        },
        {
          titulo: 'Alcalose metabólica',
          explicacao: 'Perde-se ácido ou ganha-se base, e o rim não consegue excretar o bicarbonato excedente por falta de volume ou de cloro.',
          exemplos: [
            { causa: 'Vômitos, aspiração gástrica, diuréticos', etapas: ['perda de H⁺ e cloro', 'contração volêmica', 'reabsorção ávida de bicarbonato', 'alcalose metabólica hipoclorêmica e hipocalêmica'], nota: 'Cloro urinário baixo indica alcalose responsiva a cloreto: corrige com salina.' },
            { causa: 'Hiperaldosteronismo, síndrome de Cushing, hipocalemia grave', etapas: ['secreção distal de H⁺ ↑', 'alcalose com cloro urinário alto'], nota: 'Alcalose não responsiva a cloreto — corrigir o excesso mineralocorticoide.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Acidemia: acidose metabólica (bicarbonato baixo) ou respiratória (PaCO₂ alta).',
      mecanismos: [
        {
          titulo: 'Acidose metabólica com ânion gap aumentado',
          explicacao: 'Um ácido se acumulou; o bicarbonato foi consumido tamponando-o e o ânion não medido ocupou seu lugar.',
          exemplos: [
            { causa: 'Acidose lática (choque, sepse, isquemia mesentérica, metformina)', etapas: ['metabolismo anaeróbio', 'lactato ↑', 'bicarbonato consumido', 'ânion gap ↑'], nota: 'Lactato acima de 4 mmol/L com hipotensão define choque e prediz mortalidade.' },
            { causa: 'Cetoacidose diabética ou alcoólica', etapas: ['lipólise e cetogênese', 'cetoácidos ↑', 'acidose com ânion gap ↑'] },
            { causa: 'Uremia, intoxicação por metanol, etilenoglicol ou salicilato', etapas: ['acúmulo de ácidos não medidos', 'ânion gap ↑'], nota: 'Ânion gap muito alto sem lactato nem cetonas obriga a calcular o gap osmolar e considerar intoxicação.' },
          ],
        },
        {
          titulo: 'Acidose metabólica com ânion gap normal',
          explicacao: 'Perdeu-se bicarbonato e o cloro o substituiu — a soma de ânions não mudou.',
          exemplos: [{ causa: 'Diarreia, acidose tubular renal, salina 0,9% em grande volume, fístulas digestivas', etapas: ['perda de bicarbonato', 'retenção de cloro', 'acidose hiperclorêmica'], nota: 'O ânion gap urinário separa perda intestinal (negativo) de acidose tubular renal (positivo).' }],
        },
        {
          titulo: 'Acidose respiratória',
          explicacao: 'A ventilação alveolar não elimina o CO₂ produzido.',
          exemplos: [
            { causa: 'DPOC exacerbado, depressão do centro respiratório (opioides, sedativos), doença neuromuscular, obstrução de vias aéreas, fadiga muscular', etapas: ['ventilação alveolar ↓', 'PaCO₂ ↑', 'pH ↓'], nota: 'Bicarbonato elevado junto indica cronicidade; normal indica quadro agudo — distinção decisiva na decisão de ventilar.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A leitura completa', ids: ['paco2', 'bicarbonato', 'anion-gap', 'lactato'], leitura: 'pH define o distúrbio primário; PaCO₂ e bicarbonato dizem qual componente é o culpado; o ânion gap e o lactato identificam o ácido.' },
    ],
    interferentes: {
      preAnalitico: ['Bolha de ar na seringa eleva a PaO₂ e reduz a PaCO₂.', 'Demora sem refrigeração permite metabolismo celular continuado: pH cai e PaCO₂ sobe.', 'Excesso de heparina líquida na seringa dilui e altera os valores.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['acidose-metabolica-anion-gap-alto', 'acidose-respiratoria', 'alcalose-metabolica'],
    estudarTambem: ['paco2', 'bicarbonato', 'anion-gap', 'lactato'],
  },

  {
    id: 'paco2',
    nome: 'PaCO₂',
    sinonimos: ['pco2', 'pressao parcial de gas carbonico', 'paco2'],
    grupo: 'gasometria',
    sistemas: ['respiratorio'],
    material: 'Sangue arterial',
    unidade: 'mmHg',
    referencias: [{ rotulo: 'Arterial', minimo: 35, maximo: 45, unidade: 'mmHg' }],
    resumo: 'O componente respiratório do equilíbrio ácido-base. É a medida direta e exclusiva da ventilação alveolar.',
    entenda:
      'A PaCO₂ é inversamente proporcional à ventilação alveolar: dobrar a ventilação reduz a PaCO₂ pela metade. Isso significa que ela não mede oxigenação nem troca gasosa — mede se o paciente está ventilando o suficiente. Um paciente pode estar profundamente hipoxêmico com PaCO₂ baixa (hiperventilando para compensar), e é justamente a "normalização" da PaCO₂ nesse paciente que anuncia fadiga muscular e necessidade iminente de suporte ventilatório.',
    fisiologia: {
      oQueE: 'Pressão parcial de dióxido de carbono no sangue arterial.',
      origem: 'Produzido pelo metabolismo celular; eliminado exclusivamente pelo pulmão.',
      funcao: 'É o principal estímulo do centro respiratório e o componente respiratório do sistema tampão bicarbonato.',
      orgaosEnvolvidos: ['Pulmão', 'Centro respiratório bulbar', 'Músculos respiratórios'],
      percurso: ['Metabolismo celular produz CO₂', 'transporte no sangue (bicarbonato, carbamino, dissolvido)', 'difusão alveolar', 'eliminação pela ventilação'],
    },
    aumento: {
      resumo: 'Hipoventilação alveolar — central, neuromuscular, obstrutiva ou por fadiga —, ou compensação de alcalose metabólica.',
      mecanismos: [
        {
          titulo: 'Hipoventilação',
          explicacao: 'A ventilação alveolar não acompanha a produção de CO₂.',
          exemplos: [
            { causa: 'Depressão do centro respiratório (opioides, benzodiazepínicos, lesão do SNC)', etapas: ['drive respiratório ↓', 'ventilação ↓', 'PaCO₂ ↑'] },
            { causa: 'DPOC, asma grave, doença neuromuscular, obesidade grave', etapas: ['trabalho respiratório ↑ ou força muscular ↓', 'ventilação alveolar insuficiente', 'PaCO₂ ↑'], nota: 'Na asma grave, PaCO₂ normal já é sinal de alarme: o paciente deveria estar hiperventilando.' },
            { causa: 'Fadiga muscular respiratória', etapas: ['esforço prolongado', 'falência da bomba respiratória', 'PaCO₂ subindo', 'indicação de suporte ventilatório'], nota: 'PaCO₂ que sobe de normal para alta num paciente taquipneico é a transição mais perigosa da insuficiência respiratória.' },
          ],
        },
        { titulo: 'Compensação de alcalose metabólica', explicacao: 'O organismo hipoventila para reter CO₂ e reduzir o pH.', exemplos: [{ causa: 'Alcalose metabólica sustentada', etapas: ['pH ↑', 'depressão do centro respiratório', 'PaCO₂ ↑ compensatória'], nota: 'A compensação é limitada — raramente ultrapassa 55 mmHg, porque a hipoxemia resultante estimula o drive de volta.' }] },
      ],
    },
    reducao: {
      resumo: 'Hiperventilação — por ansiedade, dor, hipoxemia, sepse, embolia ou compensação de acidose metabólica.',
      mecanismos: [
        { titulo: 'Hiperventilação primária', explicacao: 'O drive respiratório está aumentado por estímulo central ou periférico.', exemplos: [{ causa: 'Ansiedade, dor, febre, hipoxemia, embolia pulmonar, sepse, salicilato, gestação, hepatopatia', etapas: ['estímulo do centro respiratório', 'ventilação ↑', 'PaCO₂ ↓', 'alcalose respiratória'] }] },
        { titulo: 'Compensação de acidose metabólica', explicacao: 'A hiperventilação elimina CO₂ para elevar o pH.', exemplos: [{ causa: 'Cetoacidose, acidose lática, uremia', etapas: ['acidose metabólica', 'quimiorreceptores estimulados', 'respiração de Kussmaul', 'PaCO₂ ↓'], nota: 'A compensação esperada é estimável: PaCO₂ ≈ 1,5 × HCO₃⁻ + 8 ± 2 (fórmula de Winter). Fora dessa faixa, existe um segundo distúrbio.' }] },
      ],
    },
    relacionados: [{ titulo: 'A leitura ácido-base', ids: ['ph', 'bicarbonato', 'pao2'], leitura: 'pH e PaCO₂ na mesma direção indicam distúrbio metabólico; em direções opostas, distúrbio respiratório.' }],
    interferentes: { preAnalitico: ['Bolha de ar reduz falsamente; demora no processamento eleva.'] },
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['acidose-respiratoria'],
    estudarTambem: ['ph', 'bicarbonato', 'pao2'],
  },

  {
    id: 'pao2',
    nome: 'PaO₂ e saturação',
    sinonimos: ['pao2', 'po2', 'saturacao de oxigenio', 'sato2', 'oxigenacao'],
    grupo: 'gasometria',
    sistemas: ['respiratorio'],
    material: 'Sangue arterial',
    unidade: 'mmHg',
    referencias: [
      { rotulo: 'PaO₂ em ar ambiente', minimo: 80, maximo: 100, unidade: 'mmHg', observacao: 'Diminui com a idade: PaO₂ esperada ≈ 100 − (0,3 × idade).' },
      { rotulo: 'SatO₂', minimo: 95, maximo: 100, unidade: '%' },
      { rotulo: 'Relação PaO₂/FiO₂', texto: '> 300 é normal; ≤ 300, ≤ 200 e ≤ 100 definem SDRA leve, moderada e grave', unidade: '' },
    ],
    resumo: 'Mede a oxigenação — coisa distinta da ventilação. É o componente da gasometria que a PaCO₂ não informa.',
    entenda:
      'A PaO₂ é a pressão do oxigênio dissolvido no plasma; a saturação é a fração de hemoglobina ocupada por oxigênio. Elas se relacionam pela curva de dissociação, que é sigmoide: acima de 60 mmHg, a saturação varia pouco (o platô), e abaixo disso ela despenca. Por isso PaO₂ de 60 mmHg (saturação de ~90%) é o limiar clássico de atenção: dali para baixo, pequenas quedas de PaO₂ produzem grandes quedas de saturação. E a relação PaO₂/FiO₂ é o que permite comparar oxigenação entre pacientes recebendo frações inspiradas diferentes.',
    fisiologia: {
      oQueE: 'PaO₂: pressão parcial do oxigênio dissolvido. SatO₂: percentual de sítios de hemoglobina ocupados.',
      origem: 'Difusão alveolocapilar do oxigênio inspirado.',
      funcao: 'Determinar a oferta de oxigênio aos tecidos — que depende também da hemoglobina e do débito cardíaco.',
      percurso: ['Oxigênio inspirado', 'ventilação alveolar', 'difusão alveolocapilar', 'ligação à hemoglobina', 'transporte e liberação tecidual'],
    },
    aumento: { resumo: 'Oxigenoterapia e hiperventilação. Hiperóxia sustentada é tóxica e deve ser evitada.', mecanismos: [{ titulo: 'Oferta aumentada', explicacao: 'Maior fração inspirada eleva a pressão alveolar de oxigênio.', exemplos: [{ causa: 'Oxigenoterapia', etapas: ['FiO₂ ↑', 'PaO₂ ↑'], nota: 'Hiperóxia associa-se a pior desfecho em várias situações — titular o oxigênio para alvos, não ao máximo.' }] }] },
    reducao: {
      resumo: 'Cinco mecanismos de hipoxemia, e o gradiente alvéolo-arterial separa-os em dois grupos.',
      mecanismos: [
        {
          titulo: 'Distúrbio ventilação-perfusão',
          explicacao: 'Áreas ventiladas sem perfusão ou perfundidas sem ventilação. É o mecanismo mais comum e responde parcialmente ao oxigênio.',
          exemplos: [{ causa: 'DPOC, asma, pneumonia, embolia pulmonar, atelectasia', etapas: ['desequilíbrio V/Q', 'PaO₂ ↓ com gradiente A-a ↑', 'melhora com O₂ suplementar'] }],
        },
        {
          titulo: 'Shunt',
          explicacao: 'Sangue passa por alvéolos completamente não ventilados. Não corrige com oxigênio — é o que o distingue.',
          exemplos: [{ causa: 'SDRA, pneumonia extensa, edema agudo de pulmão, atelectasia maciça, shunt intracardíaco', etapas: ['perfusão sem ventilação', 'hipoxemia refratária ao O₂'], nota: 'Hipoxemia que não melhora com FiO₂ alta é shunt até prova em contrário.' }],
        },
        {
          titulo: 'Hipoventilação',
          explicacao: 'Menos ar renovado significa menos oxigênio alveolar. O gradiente A-a permanece normal.',
          exemplos: [{ causa: 'Depressão do centro respiratório, doença neuromuscular', etapas: ['ventilação ↓', 'PaCO₂ ↑ e PaO₂ ↓ com gradiente A-a normal'], nota: 'Gradiente normal com hipoxemia e hipercapnia identifica hipoventilação pura.' }],
        },
        {
          titulo: 'Distúrbio de difusão e baixa FiO₂',
          explicacao: 'A barreira alveolocapilar está espessada, ou o ar inspirado tem menos oxigênio.',
          exemplos: [
            { causa: 'Fibrose pulmonar, enfisema', etapas: ['difusão comprometida', 'hipoxemia sobretudo ao esforço'] },
            { causa: 'Altitude elevada', etapas: ['pressão inspirada de O₂ ↓', 'PaO₂ ↓ com gradiente A-a normal'] },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Para completar a avaliação', ids: ['paco2', 'lactato', 'hemoglobina'], leitura: 'Oxigenação não é oferta: hemoglobina baixa ou débito cardíaco reduzido causam hipóxia tecidual com PaO₂ normal — o lactato é quem revela.' }],
    interferentes: {
      preAnalitico: ['Bolha de ar na seringa eleva falsamente a PaO₂ — o erro mais comum da gasometria.'],
      metodo: ['A oximetria de pulso não distingue oxi de carboxi-hemoglobina nem detecta meta-hemoglobina: na intoxicação por monóxido de carbono, a saturação lida é falsamente normal.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['paco2', 'ph', 'lactato'],
  },

  {
    id: 'lactato',
    nome: 'Lactato',
    sinonimos: ['acido latico', 'lactato serico', 'lactatemia'],
    grupo: 'gasometria',
    sistemas: ['metabolico', 'cardiovascular'],
    material: 'Sangue arterial ou venoso, processamento imediato',
    unidade: 'mmol/L',
    referencias: [
      { rotulo: 'Normal', minimo: 0.5, maximo: 2.0, unidade: 'mmol/L' },
      { rotulo: 'Hiperlactatemia', texto: '2 a 4', unidade: 'mmol/L' },
      { rotulo: 'Choque (critério)', texto: '> 4', unidade: 'mmol/L', observacao: 'Lactato acima de 2 mmol/L com hipotensão refratária a volume define choque séptico.' },
    ],
    resumo:
      'Produto da glicólise anaeróbia. Marcador de hipoperfusão e de gravidade — e um dos poucos exames cuja tendência ao longo de horas orienta diretamente a reanimação.',
    entenda:
      'Quando a oferta de oxigênio não sustenta a demanda, o piruvato é desviado para lactato a fim de regenerar NAD⁺ e manter a glicólise. Por isso o lactato é o marcador funcional de perfusão tecidual — melhor que pressão arterial, que pode estar normal enquanto o tecido sofre. Mas nem todo lactato alto é hipoperfusão: a estimulação beta-adrenérgica, o excesso de piruvato e a redução do clearance hepático também o elevam. O que se acompanha é o clearance: queda de 10 a 20% a cada 2 horas de reanimação associa-se a melhor desfecho.',
    aprofundar: [
      'A acidose lática divide-se classicamente em dois tipos. O tipo A decorre de hipóxia tecidual: choque de qualquer causa, isquemia mesentérica, hipoxemia grave, anemia extrema, parada cardíaca. O tipo B ocorre sem hipóxia evidente: metformina (que inibe a gliconeogênese hepática e o complexo I mitocondrial), linezolida, antirretrovirais, intoxicação alcoólica, neoplasias com alto turnover, deficiência de tiamina, insuficiência hepática. Distinguir importa porque o tipo A exige restaurar perfusão e o tipo B exige remover a causa.',
      'Um erro frequente é atribuir todo lactato alto a sepse. Beta-2-agonistas em dose alta (salbutamol na crise asmática), adrenalina e o próprio trabalho muscular da respiração elevam o lactato por estímulo da glicólise aeróbia — sem hipoperfusão alguma. Nesses casos, o lactato alto acompanha melhora clínica, e persegui-lo com volume pode ser prejudicial.',
    ],
    fisiologia: {
      oQueE: 'Ânion do ácido lático, produto final da glicólise anaeróbia.',
      origem: 'Músculo, hemácias, intestino, cérebro e pele.',
      funcao: 'Permitir a continuidade da glicólise sem oxigênio ao regenerar NAD⁺; serve também de substrato gliconeogênico e energético.',
      metabolismo: 'Depurado em 60 a 70% pelo fígado (ciclo de Cori) e o restante pelo rim e pelo coração.',
      orgaosEnvolvidos: ['Músculo', 'Fígado', 'Rim', 'Hemácias'],
      percurso: ['Glicose → piruvato', 'sem oxigênio suficiente, piruvato → lactato (LDH)', 'lactato no plasma', 'fígado reconverte a glicose (ciclo de Cori)'],
    },
    aumento: {
      resumo: 'Hipoperfusão (tipo A), causas metabólicas e medicamentosas (tipo B), ou clearance hepático reduzido.',
      mecanismos: [
        {
          titulo: 'Hipóxia tecidual — tipo A',
          explicacao: 'A oferta de oxigênio não sustenta a demanda; a célula recorre à via anaeróbia.',
          exemplos: [
            { causa: 'Choque séptico, cardiogênico, hipovolêmico ou obstrutivo', etapas: ['perfusão tecidual ↓', 'metabolismo anaeróbio', 'lactato ↑', 'acidose metabólica com ânion gap alto'], nota: 'A tendência do lactato durante a reanimação é um dos melhores marcadores de resposta.' },
            { causa: 'Isquemia mesentérica', etapas: ['isquemia intestinal', 'lactato ↑ com dor desproporcional ao exame'], nota: 'Lactato alto com abdome pouco alterado ao exame em idoso com fibrilação atrial é a apresentação clássica.' },
          ],
        },
        {
          titulo: 'Causas sem hipóxia — tipo B',
          explicacao: 'A produção aumenta ou a depuração cai, sem déficit de oferta de oxigênio.',
          exemplos: [
            { causa: 'Metformina, linezolida, antirretrovirais, propofol', etapas: ['inibição da gliconeogênese ou da cadeia respiratória mitocondrial', 'lactato ↑'], nota: 'A acidose lática por metformina é rara mas grave, e ocorre sobretudo com função renal comprometida.' },
            { causa: 'Beta-2-agonistas e adrenalina', etapas: ['estímulo da glicólise aeróbia', 'produção de piruvato e lactato ↑ sem hipoperfusão'], nota: 'Comum na crise asmática tratada com salbutamol — não indica gravidade circulatória.' },
            { causa: 'Insuficiência hepática', etapas: ['clearance hepático ↓', 'lactato ↑'] },
            { causa: 'Deficiência de tiamina', etapas: ['piruvato-desidrogenase inativa', 'piruvato desviado a lactato', 'acidose lática responsiva à tiamina'], nota: 'Considerar em etilistas e em nutrição parenteral sem reposição vitamínica.' },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Na sepse e no choque', ids: ['ph', 'bicarbonato', 'anion-gap', 'procalcitonina'], leitura: 'Lactato alto com acidose e ânion gap elevado indica hipoperfusão; a procalcitonina sugere a etiologia bacteriana.' }],
    interferentes: {
      preAnalitico: ['Garrote prolongado, punho cerrado e demora no processamento elevam falsamente — a glicólise continua nas células da amostra.'],
      fisiologico: ['Exercício intenso eleva transitoriamente.'],
    },
    cinetica: { tendencia: 'O clearance de lactato (queda percentual em 2 a 6 horas) orienta a reanimação melhor do que qualquer valor isolado.' },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['acidose-metabolica-anion-gap-alto', 'sepse'],
    estudarTambem: ['ph', 'bicarbonato', 'anion-gap', 'procalcitonina'],
  },

  {
    id: 'anion-gap',
    nome: 'Ânion gap',
    sinonimos: ['anion gap', 'hiato anionico', 'ag'],
    grupo: 'gasometria',
    sistemas: ['metabolico', 'renal'],
    material: 'Calculado: Na⁺ − (Cl⁻ + HCO₃⁻)',
    unidade: 'mEq/L',
    referencias: [
      { rotulo: 'Normal', minimo: 8, maximo: 12, unidade: 'mEq/L', observacao: 'Corrigir pela albumina: somar 2,5 mEq/L para cada 1 g/dL de albumina abaixo de 4 g/dL.' },
    ],
    resumo:
      'Estima os ânions não medidos do plasma. É o cálculo que divide as acidoses metabólicas em dois grupos com diagnósticos diferentes.',
    entenda:
      'O plasma é eletricamente neutro: a soma dos cátions iguala a dos ânions. Como o laboratório mede sódio, cloro e bicarbonato mas não mede albumina, fosfato, sulfato e ácidos orgânicos, sobra uma diferença — o ânion gap. Quando um ácido se acumula (lactato, cetoácidos, salicilato), ele consome bicarbonato e ocupa seu lugar como ânion não medido: o gap sobe. Quando se perde bicarbonato diretamente (diarreia, acidose tubular), o cloro o substitui e o gap permanece normal.',
    aprofundar: [
      'A correção pela albumina é obrigatória em internados e frequentemente esquecida. A albumina é o principal ânion não medido: com albumina de 2 g/dL, o gap "normal" passa a ser em torno de 7, e um valor de 12 já representa acidose com gap aumentado. Deixar de corrigir faz perder o diagnóstico exatamente nos pacientes mais graves, que são os hipoalbuminêmicos.',
      'O delta-gap (variação do ânion gap comparada à variação do bicarbonato) revela distúrbios mistos. Se o gap subiu muito mais do que o bicarbonato caiu, há alcalose metabólica associada. Se o bicarbonato caiu mais do que o gap subiu, há também uma acidose com gap normal — cenário típico da cetoacidose diabética tratada com salina em grande volume, que troca uma acidose pela outra.',
    ],
    fisiologia: {
      oQueE: 'Diferença entre os cátions e os ânions rotineiramente medidos no plasma.',
      origem: 'Corresponde sobretudo à albumina, ao fosfato, ao sulfato e a ácidos orgânicos.',
      funcao: 'Ferramenta diagnóstica derivada do princípio da eletroneutralidade.',
      percurso: ['Na⁺ − (Cl⁻ + HCO₃⁻)', 'ânions não medidos', 'gap normal ou aumentado', 'classificação da acidose metabólica'],
    },
    aumento: {
      resumo: 'Acúmulo de ácidos: lactato, cetoácidos, uremia, intoxicações. E também alcalose e hiperalbuminemia.',
      mecanismos: [
        {
          titulo: 'Acúmulo de ânions ácidos',
          explicacao: 'O bicarbonato tampona o H⁺ e o ânion acompanhante fica no plasma, elevando o gap.',
          exemplos: [
            { causa: 'Acidose lática, cetoacidose, uremia', etapas: ['ácido acumulado', 'bicarbonato consumido', 'ânion não medido ↑', 'gap ↑'] },
            { causa: 'Intoxicação por metanol, etilenoglicol, salicilato ou propilenoglicol', etapas: ['metabólitos ácidos', 'gap ↑↑ com gap osmolar frequentemente alto'], nota: 'Gap alto sem lactato e sem cetonas é intoxicação até prova em contrário — calcular o gap osmolar.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hipoalbuminemia (a causa mais frequente), mieloma e intoxicações por brometo ou lítio.',
      mecanismos: [
        { titulo: 'Perda do principal ânion não medido', explicacao: 'A albumina responde pela maior parte do gap.', exemplos: [{ causa: 'Hipoalbuminemia', etapas: ['albumina ↓', 'ânions não medidos ↓', 'gap ↓'], nota: 'Sem correção, mascara acidoses com gap aumentado.' }] },
        { titulo: 'Cátions não medidos aumentados', explicacao: 'Paraproteínas catiônicas e cátions exógenos reduzem o gap.', exemplos: [{ causa: 'Mieloma múltiplo com paraproteína IgG, intoxicação por lítio ou brometo', etapas: ['cátions não medidos ↑', 'gap ↓ ou negativo'] }] },
      ],
    },
    relacionados: [{ titulo: 'Para completar a análise', ids: ['bicarbonato', 'lactato', 'albumina', 'cloro'], leitura: 'Gap alto: procurar lactato, cetonas, ureia e intoxicações. Gap normal: procurar perda digestiva ou renal de bicarbonato. Sempre corrigir pela albumina.' }],
    utilidade: ['diagnostico'],
    padroes: ['acidose-metabolica-anion-gap-alto', 'acidose-metabolica-hiperclorenica'],
    estudarTambem: ['bicarbonato', 'lactato', 'cloro', 'albumina'],
  },
]
