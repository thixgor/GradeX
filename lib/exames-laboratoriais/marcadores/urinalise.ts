import type { Marcador } from '../tipos'

/**
 * Urinálise — o exame mais barato e mais subaproveitado da medicina.
 *
 * A fita reagente e o sedimento respondem a perguntas que exames caros não
 * respondem: de onde vem a hematúria, se a proteinúria é glomerular, se a
 * infecção é bacteriana, se o rim está concentrando. O sedimento, em especial,
 * é o único "exame de imagem" do néfron disponível à beira do leito — os
 * cilindros trazem a assinatura do túbulo de onde saíram.
 */
export const marcadores: Marcador[] = [
  {
    id: 'eas',
    nome: 'Urina tipo I (EAS)',
    sigla: 'EAS',
    sinonimos: ['eas', 'urina tipo 1', 'urina rotina', 'sumario de urina', 'parcial de urina', 'urinalise'],
    grupo: 'urinalise',
    sistemas: ['renal', 'infeccioso'],
    material: 'Urina de jato médio, primeira da manhã de preferência',
    unidade: '—',
    referencias: [
      { rotulo: 'Proteína', texto: 'Ausente ou traços', unidade: '' },
      { rotulo: 'Glicose, cetonas, nitrito', texto: 'Ausentes', unidade: '' },
      { rotulo: 'Hemácias', texto: '< 5 por campo', unidade: '/campo' },
      { rotulo: 'Leucócitos', texto: '< 10 por campo (< 5 em alguns laboratórios)', unidade: '/campo' },
    ],
    resumo:
      'Reúne aspecto, densidade, pH, fita reagente e sedimento. Interpretado por inteiro, localiza a doença renal e urinária melhor que qualquer outro exame isolado.',
    entenda:
      'O EAS deve ser lido como um conjunto, não como uma lista de itens. Proteinúria com hematúria dismórfica e cilindros hemáticos aponta glomerulopatia. Leucocitúria com nitrito positivo e bacteriúria aponta infecção. Leucocitúria estéril, sem nitrito e sem crescimento em cultura, aponta nefrite intersticial, tuberculose urinária ou litíase. Cilindros granulosos pigmentares apontam necrose tubular aguda. Cada combinação é um diagnóstico diferente.',
    aprofundar: [
      'A fita detecta sangue pela atividade peroxidase-símile do heme — e por isso é positiva também para hemoglobina livre e mioglobina, que não são hemácias. Fita positiva para sangue com sedimento sem hemácias é um achado específico e valioso: significa hemoglobinúria (hemólise intravascular) ou mioglobinúria (rabdomiólise). Nos dois casos, o risco de lesão renal aguda é o que orienta a conduta.',
      'A morfologia da hemácia localiza o sangramento. Hemácias dismórficas — deformadas ao atravessar a membrana basal glomerular —, sobretudo acantócitos, e cilindros hemáticos indicam origem glomerular. Hemácias isomórficas, de morfologia preservada, indicam origem do trato urinário: litíase, infecção, neoplasia, trauma. Essa distinção define se a investigação segue para nefrologia ou para urologia.',
      'A fita reagente detecta sobretudo albumina e é pouco sensível a outras proteínas. Isso a torna cega para as cadeias leves do mieloma: um paciente com proteinúria de Bence-Jones importante pode ter fita negativa. Diante de suspeita clínica — idoso com anemia, dor óssea, hipercalcemia e insuficiência renal —, a investigação exige eletroforese de proteínas urinárias, não fita.',
    ],
    fisiologia: {
      oQueE: 'Análise física, química e microscópica da urina.',
      origem: 'Filtrado glomerular modificado pela reabsorção e secreção tubulares, mais células e proteínas do trato urinário.',
      funcao: 'Revelar a integridade da barreira glomerular, a função tubular e a presença de inflamação ou infecção no trato urinário.',
      percurso: ['Filtração glomerular', 'reabsorção e secreção tubulares', 'concentração medular', 'urina final com sua composição e sedimento'],
    },
    aumento: {
      resumo: 'Cada alteração da fita e do sedimento tem seu próprio significado — o valor está na combinação.',
      mecanismos: [
        {
          titulo: 'Proteinúria',
          explicacao: 'Barreira glomerular rompida, túbulo que não reabsorve, ou proteína em excesso no plasma.',
          exemplos: [
            { causa: 'Glomerulopatias, nefropatia diabética e hipertensiva', etapas: ['lesão da barreira de filtração', 'passagem de albumina', 'proteinúria persistente'], nota: 'Proteinúria na fita exige quantificação por relação proteína/creatinina.' },
            { causa: 'Febre, exercício, ortostatismo', etapas: ['alteração hemodinâmica transitória', 'proteinúria funcional que desaparece na repetição'] },
          ],
        },
        {
          titulo: 'Hematúria',
          explicacao: 'Sangue de origem glomerular ou do trato urinário — e a morfologia diz qual.',
          exemplos: [
            { causa: 'Glomerulonefrite, nefropatia por IgA', etapas: ['passagem de hemácias pela membrana basal lesada', 'hemácias dismórficas e cilindros hemáticos', 'proteinúria associada'] },
            { causa: 'Litíase, infecção, neoplasia urotelial, trauma, cateterismo', etapas: ['sangramento no trato urinário', 'hemácias isomórficas sem cilindros'], nota: 'Hematúria isomórfica sem infecção em adulto acima de 40 anos exige investigação de neoplasia urotelial.' },
            { causa: 'Rabdomiólise e hemólise intravascular', etapas: ['mioglobina ou hemoglobina livre filtradas', 'fita positiva para sangue sem hemácias no sedimento'] },
          ],
        },
        {
          titulo: 'Leucocitúria, nitrito e bacteriúria',
          explicacao: 'Inflamação do trato urinário, com ou sem bactéria.',
          exemplos: [
            { causa: 'Infecção urinária', etapas: ['invasão bacteriana', 'resposta leucocitária', 'nitrito positivo se a bactéria reduz nitrato (enterobactérias)'], nota: 'Nitrito negativo não exclui infecção: cocos gram-positivos e Pseudomonas não reduzem nitrato, e urina de permanência curta na bexiga também dá falso-negativo.' },
            { causa: 'Nefrite intersticial, tuberculose urinária, litíase, corpo estranho', etapas: ['inflamação sem bactéria cultivável', 'leucocitúria estéril'], nota: 'Piúria estéril é um achado que exige explicação — não é normal.' },
          ],
        },
        {
          titulo: 'Glicosúria e cetonúria',
          explicacao: 'Carga filtrada excedeu a capacidade de reabsorção, ou o metabolismo mudou para cetogênese.',
          exemplos: [
            { causa: 'Diabetes descompensado', etapas: ['glicemia acima do limiar renal (~180 mg/dL)', 'glicosúria'], nota: 'Inibidores de SGLT2 causam glicosúria com glicemia normal — é o mecanismo de ação, não descompensação.' },
            { causa: 'Síndrome de Fanconi', etapas: ['reabsorção tubular proximal comprometida', 'glicosúria com glicemia normal, aminoacidúria e fosfatúria'] },
            { causa: 'Jejum, cetoacidose, dieta cetogênica', etapas: ['lipólise e cetogênese', 'cetonúria'], nota: 'A fita detecta sobretudo acetoacetato: no início da cetoacidose, quando predomina beta-hidroxibutirato, ela pode subestimar.' },
          ],
        },
        {
          titulo: 'Cilindros e cristais',
          explicacao: 'Os cilindros formam-se no túbulo, moldados sobre a proteína de Tamm-Horsfall — e carregam a assinatura do que estava ali.',
          exemplos: [
            { causa: 'Cilindros hialinos', etapas: ['concentração urinária e desidratação', 'achado inespecífico e frequentemente normal'] },
            { causa: 'Cilindros granulosos pigmentares', etapas: ['descamação de células tubulares necróticas', 'necrose tubular aguda'] },
            { causa: 'Cilindros hemáticos', etapas: ['hemácias no lúmen tubular', 'glomerulonefrite'], nota: 'É praticamente patognomônico de doença glomerular.' },
            { causa: 'Cilindros leucocitários', etapas: ['leucócitos no lúmen tubular', 'pielonefrite ou nefrite intersticial'], nota: 'Diferencia infecção alta de cistite.' },
            { causa: 'Cristais de oxalato, ácido úrico, fosfato ou cistina', etapas: ['supersaturação urinária', 'cristalúria'], nota: 'Cristais de oxalato de cálcio em forma de envelope, com acidose e gap osmolar alto, sugerem intoxicação por etilenoglicol.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para caracterizar a doença renal', ids: ['creatinina', 'proteinuria', 'albuminuria', 'tfg'], leitura: 'O EAS localiza (glomerular, tubular, urológico); a proteinúria quantifica; creatinina e TFG medem a repercussão funcional.' },
    ],
    interferentes: {
      preAnalitico: ['Urina que demora a ser analisada lisa hemácias, dissolve cilindros e permite multiplicação bacteriana.', 'Contaminação vulvar ou menstruação produz falso-positivo de hematúria e leucocitúria.'],
      fisiologico: ['Urina muito diluída reduz a sensibilidade de todos os parâmetros; muito alcalina lisa células.'],
      medicamentos: ['Rifampicina, fenazopiridina e beterraba alteram a cor; ácido ascórbico em altas doses causa falso-negativo para sangue e glicose na fita.'],
    },
    utilidade: ['diagnostico', 'rastreamento', 'triagem'],
    estudarTambem: ['creatinina', 'proteinuria', 'densidade-urinaria', 'sodio-urinario'],
  },

  {
    id: 'densidade-urinaria',
    nome: 'Densidade e pH urinários',
    sinonimos: ['densidade urinaria', 'ph urinario', 'gravidade especifica'],
    grupo: 'urinalise',
    sistemas: ['renal'],
    material: 'Urina',
    unidade: '—',
    referencias: [
      { rotulo: 'Densidade', minimo: 1.005, maximo: 1.03, unidade: '' },
      { rotulo: 'Densidade isostenúrica', texto: '~1.010', unidade: '', observacao: 'Igual à do plasma: indica perda da capacidade de concentrar e diluir.' },
      { rotulo: 'pH urinário', minimo: 4.5, maximo: 8.0, unidade: '' },
    ],
    resumo: 'Densidade estima a capacidade de concentração renal; o pH urinário revela a resposta tubular ao estado ácido-base — e explica certos cristais.',
    entenda:
      'A densidade acompanha a osmolalidade urinária e responde à mesma pergunta de forma mais barata: o rim está concentrando? Densidade alta com azotemia sugere causa pré-renal (o túbulo está íntegro e ávido); densidade fixa em torno de 1.010 (isostenúria) indica lesão tubular ou doença renal crônica. Já o pH urinário orienta a investigação de acidose tubular renal: pH urinário persistentemente acima de 5,5 diante de acidose sistêmica indica incapacidade de acidificar a urina — a acidose tubular renal tipo 1.',
    fisiologia: {
      oQueE: 'Densidade: relação entre a massa da urina e a da água. pH: concentração de H⁺ excretado.',
      origem: 'Resultam da reabsorção de água (ADH e gradiente medular) e da secreção tubular de H⁺ e amônio.',
      funcao: 'Refletir a capacidade de concentração e de acidificação renal.',
      percurso: ['Filtrado isotônico', 'alça de Henle cria o gradiente medular', 'ADH regula a reabsorção de água no coletor', 'túbulo distal secreta H⁺ e amônio', 'urina final'],
    },
    aumento: {
      resumo: 'Densidade alta: desidratação, SIADH, glicosúria, proteinúria maciça ou contraste iodado. pH alto: infecção por bactéria produtora de urease, acidose tubular tipo 1, dieta vegetariana.',
      mecanismos: [
        { titulo: 'Concentração urinária máxima', explicacao: 'A ADH está agindo e o rim retém água.', exemplos: [{ causa: 'Desidratação, hipovolemia, SIADH', etapas: ['ADH ↑', 'reabsorção de água ↑', 'densidade ↑'] }] },
        { titulo: 'Solutos osmoticamente ativos', explicacao: 'Glicose, proteína e contraste elevam a densidade sem que haja concentração real.', exemplos: [{ causa: 'Glicosúria, proteinúria maciça, contraste iodado', etapas: ['soluto pesado na urina', 'densidade falsamente ↑'], nota: 'A osmolalidade urinária não sofre esse artefato na mesma medida.' }] },
        { titulo: 'Alcalinização urinária', explicacao: 'Bactérias com urease desdobram ureia em amônia, alcalinizando a urina.', exemplos: [{ causa: 'Infecção por Proteus, Klebsiella ou Ureaplasma', etapas: ['urease bacteriana', 'pH urinário > 7', 'formação de cálculos de estruvita'], nota: 'pH alcalino persistente com cálculos coraliformes sugere infecção por germe produtor de urease.' }] },
      ],
    },
    reducao: {
      resumo: 'Densidade baixa: diabetes insipidus, polidipsia, diuréticos, doença tubulointersticial. pH baixo: acidose metabólica, dieta hiperproteica, cetoacidose.',
      mecanismos: [
        { titulo: 'Incapacidade de concentrar', explicacao: 'Falta ADH, o rim não responde a ela, ou o gradiente medular se perdeu.', exemplos: [{ causa: 'Diabetes insipidus, doença tubulointersticial, hipercalcemia, hipocalemia, lítio', etapas: ['reabsorção de água comprometida', 'urina diluída e poliúria'] }] },
        { titulo: 'Acidificação apropriada', explicacao: 'O rim excreta o excesso de ácido.', exemplos: [{ causa: 'Acidose metabólica, cetoacidose, dieta hiperproteica', etapas: ['secreção de H⁺ ↑', 'pH urinário < 5,5'], nota: 'Se, apesar da acidose sistêmica, o pH urinário não cai abaixo de 5,5, suspeitar de acidose tubular renal distal.' }] },
      ],
    },
    relacionados: [{ titulo: 'Na investigação de poliúria e azotemia', ids: ['osmolalidade-urinaria', 'sodio-urinario', 'creatinina'], leitura: 'Densidade alta com azotemia sugere pré-renal; isostenúria sugere lesão tubular ou doença crônica.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['eas', 'osmolalidade-urinaria', 'sodio-urinario'],
  },
]
