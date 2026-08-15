import type { Marcador } from '../tipos'

/**
 * Perfil lipídico — do básico ao expandido.
 *
 * A ideia que organiza este grupo: o que causa aterosclerose não é
 * "colesterol", é **partícula que contém apoB atravessando o endotélio e
 * ficando retida ali**. Colesterol é a carga; a apoB conta os veículos. Por
 * isso as fichas insistem em não-HDL e apoB — os dois marcadores que contam
 * partículas em vez de medir carga, e que explicam por que um paciente com
 * LDL "no alvo" e triglicerídeos altos continua em risco.
 */
export const marcadores: Marcador[] = [
  {
    id: 'colesterol-total',
    nome: 'Colesterol total',
    sinonimos: ['ct', 'colesterol'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular', 'metabolico'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Desejável', texto: '< 190', unidade: 'mg/dL', observacao: 'As metas atuais são definidas por LDL e não-HDL conforme o risco cardiovascular, não pelo colesterol total.' }],
    resumo: 'A soma do colesterol de todas as lipoproteínas. Isoladamente pouco útil — serve para calcular o não-HDL e o LDL.',
    entenda:
      'O colesterol total soma LDL, HDL, VLDL e remanescentes. Um total alto às custas de HDL alto não tem o mesmo significado de um total alto às custas de LDL. Por isso ele saiu das metas terapêuticas e permaneceu apenas como componente de cálculo: colesterol total menos HDL dá o não-HDL, que representa todo o colesterol aterogênico e é, hoje, um alvo melhor que o LDL isolado.',
    fisiologia: {
      oQueE: 'Esteroide de 27 carbonos, componente estrutural das membranas celulares e precursor de hormônios esteroides, vitamina D e ácidos biliares.',
      origem: 'Síntese hepática endógena (cerca de 70%) e absorção intestinal (cerca de 30%).',
      sintese: 'Via HMG-CoA redutase — o passo limitante e o alvo das estatinas.',
      circulacao: 'Transportado em lipoproteínas, pois é insolúvel em água.',
      funcao: 'Fluidez de membrana, síntese de hormônios esteroides, vitamina D e sais biliares.',
      eliminacao: 'Excreção biliar como colesterol livre e sais biliares.',
      orgaosEnvolvidos: ['Fígado', 'Intestino', 'Adrenal', 'Gônadas'],
      percurso: ['Síntese hepática (HMG-CoA redutase) e absorção intestinal', 'lipoproteínas plasmáticas', 'captação tecidual', 'excreção biliar'],
    },
    aumento: {
      resumo: 'Genética, dieta, resistência à insulina, hipotireoidismo, colestase, síndrome nefrótica e medicamentos.',
      mecanismos: [
        {
          titulo: 'Redução do clearance de LDL',
          explicacao: 'Menos receptores de LDL no hepatócito significam menos partículas retiradas da circulação.',
          exemplos: [
            { causa: 'Hipercolesterolemia familiar', etapas: ['mutação no receptor de LDL, na apoB ou na PCSK9', 'clearance de LDL ↓', 'colesterol muito elevado desde a infância', 'doença coronária precoce'], nota: 'LDL acima de 190 mg/dL, xantomas tendíneos e história familiar de evento precoce: rastrear a família.' },
            { causa: 'Hipotireoidismo', etapas: ['expressão de receptores de LDL ↓', 'clearance ↓', 'colesterol ↑'], nota: 'Dislipidemia de causa reversível — dosar TSH antes de iniciar estatina.' },
          ],
        },
        {
          titulo: 'Produção aumentada ou desvio metabólico',
          explicacao: 'O fígado produz mais VLDL, ou o colesterol não é excretado.',
          exemplos: [
            { causa: 'Síndrome nefrótica', etapas: ['hipoalbuminemia', 'síntese hepática compensatória de lipoproteínas ↑', 'colesterol ↑↑'] },
            { causa: 'Colestase', etapas: ['excreção biliar de colesterol ↓', 'acúmulo plasmático', 'colesterol ↑ com FA e GGT ↑'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hipertireoidismo, desnutrição, hepatopatia grave, doença crítica e má absorção.',
      mecanismos: [
        {
          titulo: 'Síntese reduzida ou consumo aumentado',
          explicacao: 'O fígado não produz, ou o metabolismo acelerado consome.',
          exemplos: [
            { causa: 'Hepatopatia avançada, desnutrição, má absorção', etapas: ['síntese ou absorção ↓', 'colesterol ↓'], nota: 'Colesterol baixo no cirrótico é marcador de gravidade.' },
            { causa: 'Hipertireoidismo, doença crítica, neoplasia avançada', etapas: ['catabolismo acelerado', 'colesterol ↓'] },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Para o que realmente importa', ids: ['ldl', 'hdl', 'nao-hdl', 'triglicerideos'], leitura: 'O total só ganha sentido decomposto: LDL e não-HDL são o alvo, HDL é modulador de risco e os triglicerídeos revelam o componente metabólico.' }],
    interferentes: { fisiologico: ['Gestação eleva; doença aguda e infarto reduzem por até 6 a 8 semanas — não avaliar perfil lipídico nesse período.'] },
    utilidade: ['rastreamento'],
    estudarTambem: ['ldl', 'nao-hdl', 'apob', 'triglicerideos'],
  },

  {
    id: 'ldl',
    nome: 'LDL-colesterol',
    sigla: 'LDL-c',
    sinonimos: ['ldl', 'colesterol ldl', 'colesterol ruim', 'friedewald', 'martin hopkins'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Risco baixo', texto: '< 130', unidade: 'mg/dL' },
      { rotulo: 'Risco intermediário', texto: '< 100', unidade: 'mg/dL' },
      { rotulo: 'Risco alto', texto: '< 70', unidade: 'mg/dL' },
      { rotulo: 'Risco muito alto', texto: '< 50', unidade: 'mg/dL', observacao: 'As metas são definidas pelo risco cardiovascular global, não por um valor universal.' },
    ],
    resumo:
      'A lipoproteína que entrega colesterol aos tecidos — e que, retida na parede arterial, inicia a placa. É o principal alvo terapêutico da prevenção cardiovascular.',
    entenda:
      'A partícula de LDL atravessa o endotélio e, quando fica retida na íntima pelos proteoglicanos, sofre oxidação. O macrófago a capta por receptores scavenger não regulados, transforma-se em célula espumosa e inicia a placa. A relação entre LDL e evento cardiovascular é causal, contínua e cumulativa — não há limiar abaixo do qual o risco desapareça, e a exposição ao longo dos anos importa tanto quanto o valor atual. É por isso que a hipercolesterolemia familiar, que expõe desde a infância, produz eventos décadas antes.',
    aprofundar: [
      'O LDL é geralmente calculado, não medido. A fórmula de Friedewald (LDL = CT − HDL − TG/5) assume uma relação fixa entre triglicerídeos e colesterol da VLDL, o que falha em duas situações: com triglicerídeos acima de 400 mg/dL, em que a fórmula é inválida, e com LDL baixo, em que ela subestima o valor real. A equação de Martin-Hopkins usa um fator variável em vez do divisor fixo 5 e é mais acurada nesses cenários — sobretudo em pacientes já tratados, com LDL abaixo de 70. O LDL direto dispensa cálculo e é preferível com hipertrigliceridemia importante.',
      'Um mesmo valor de LDL pode corresponder a números muito diferentes de partículas. Na resistência à insulina, as partículas são pequenas e densas: carregam pouco colesterol cada, então o LDL calculado parece aceitável enquanto o número de partículas — e o risco — está alto. Esse é o descolamento que a apoB e o não-HDL corrigem, e é a razão pela qual pacientes diabéticos com "LDL no alvo" continuam tendo eventos.',
    ],
    fisiologia: {
      oQueE: 'Lipoproteína de baixa densidade, produto final do catabolismo da VLDL, com uma única molécula de apoB100 por partícula.',
      origem: 'Fígado, via VLDL → IDL → LDL.',
      funcao: 'Entregar colesterol aos tecidos periféricos.',
      metabolismo: 'Removida da circulação pelo receptor hepático de LDL, cuja expressão é regulada pelo conteúdo intracelular de colesterol e degradada pela PCSK9.',
      meiaVida: '2 a 3 dias.',
      orgaosEnvolvidos: ['Fígado', 'Parede arterial'],
      percurso: ['VLDL hepática', 'lipólise pela lipase lipoproteica', 'IDL', 'LDL', 'receptor hepático de LDL ou retenção na íntima arterial'],
    },
    aumento: {
      resumo: 'Genética, dieta rica em gordura saturada e trans, hipotireoidismo, síndrome nefrótica, colestase e medicamentos.',
      mecanismos: [
        {
          titulo: 'Clearance reduzido',
          explicacao: 'Menos receptores de LDL funcionantes no fígado — por mutação, por hormônio ou por saturação.',
          exemplos: [
            { causa: 'Hipercolesterolemia familiar', etapas: ['receptor de LDL deficiente', 'partículas permanecem na circulação', 'LDL ↑↑ desde a infância'], nota: 'Heterozigose afeta cerca de 1 em 250 pessoas e é largamente subdiagnosticada.' },
            { causa: 'Hipotireoidismo', etapas: ['hormônio tireoidiano regula a expressão do receptor de LDL', 'expressão ↓', 'LDL ↑'], nota: 'Reversível com levotiroxina.' },
            { causa: 'Dieta rica em gordura saturada e trans', etapas: ['colesterol intracelular hepático ↑', 'expressão do receptor de LDL ↓ por retroalimentação', 'LDL ↑'] },
          ],
        },
        {
          titulo: 'Produção aumentada',
          explicacao: 'O fígado exporta mais VLDL, que é convertida em LDL.',
          exemplos: [{ causa: 'Síndrome nefrótica, colestase, corticoides, ciclosporina, antirretrovirais', etapas: ['síntese hepática de lipoproteínas ↑', 'LDL ↑'] }],
        },
      ],
    },
    reducao: {
      resumo: 'Tratamento eficaz, hipertireoidismo, hepatopatia, desnutrição, doença crítica e defeitos genéticos raros.',
      mecanismos: [
        {
          titulo: 'Síntese reduzida ou clearance aumentado',
          explicacao: 'O fígado não produz, ou os receptores captam mais.',
          exemplos: [
            { causa: 'Estatinas, ezetimiba, inibidores de PCSK9', etapas: ['síntese hepática de colesterol ↓ ou receptores de LDL ↑', 'LDL ↓'], nota: 'A redução do LDL traduz-se em redução proporcional de eventos, qualquer que seja o mecanismo usado.' },
            { causa: 'Hepatopatia grave, desnutrição, hipertireoidismo, doença crítica', etapas: ['síntese ↓ ou catabolismo ↑', 'LDL ↓'], nota: 'LDL espontaneamente muito baixo em paciente não tratado exige explicação, não comemoração.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Quando o LDL não basta', ids: ['nao-hdl', 'apob', 'triglicerideos'], leitura: 'Com triglicerídeos acima de 150, o LDL subestima o risco: use não-HDL e apoB, que contam todas as partículas aterogênicas.' },
      { titulo: 'Antes de tratar', ids: ['tsh', 'glicemia-jejum', 'creatinina', 'alt'], leitura: 'Excluir causas secundárias — hipotireoidismo, diabetes, síndrome nefrótica, hepatopatia — antes de rotular como dislipidemia primária.' },
    ],
    interferentes: {
      preAnalitico: ['O jejum deixou de ser obrigatório na maioria dos contextos; permanece recomendado quando os triglicerídeos estão acima de 440 mg/dL.'],
      fisiologico: ['Após infarto, cirurgia ou infecção, o perfil lipídico permanece alterado por 6 a 8 semanas.'],
      metodo: ['Friedewald é inválido com triglicerídeos > 400 mg/dL e subestima o LDL abaixo de 70 mg/dL; Martin-Hopkins é mais acurado nessas faixas.'],
    },
    normalizacao: [
      { cenario: 'LDL alto por causa secundária', caminho: 'Tratar a causa: levotiroxina no hipotireoidismo, controle da síndrome nefrótica, ajuste de medicamentos. O LDL cai junto.', prazo: 'Semanas a meses.' },
      { cenario: 'LDL alto primário', caminho: 'Mudança de estilo de vida e terapia hipolipemiante conforme o risco cardiovascular global — não conforme o número isolado.', prazo: 'A resposta à estatina é vista em 4 a 6 semanas.' },
    ],
    utilidade: ['rastreamento', 'prognostico', 'acompanhamento'],
    estudarTambem: ['nao-hdl', 'apob', 'lpa', 'triglicerideos'],
  },

  {
    id: 'hdl',
    nome: 'HDL-colesterol',
    sigla: 'HDL-c',
    sinonimos: ['hdl', 'colesterol bom', 'hdl2', 'hdl3'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Homens', texto: '> 40', unidade: 'mg/dL' },
      { rotulo: 'Mulheres', texto: '> 50', unidade: 'mg/dL' },
    ],
    resumo:
      'A lipoproteína do transporte reverso de colesterol. HDL baixo é marcador de risco — mas elevá-lo farmacologicamente não reduziu eventos.',
    entenda:
      'A HDL retira colesterol dos macrófagos da parede arterial e o leva ao fígado. Epidemiologicamente, HDL baixo associa-se a mais eventos cardiovasculares. Contudo, ensaios que elevaram o HDL com fármacos não reduziram desfechos, e estudos genéticos não sustentam causalidade. A leitura atual é que HDL baixo sinaliza sobretudo o contexto que o acompanha — resistência à insulina, triglicerídeos altos, obesidade, sedentarismo — e é esse contexto, não o número, que deve ser tratado. HDL muito alto (acima de 90 mg/dL) tampouco é protetor e associa-se, em algumas coortes, a risco aumentado.',
    fisiologia: {
      oQueE: 'Lipoproteína de alta densidade, rica em apoA1, com subfrações HDL2 (maior, mais madura) e HDL3 (menor, mais densa).',
      origem: 'Fígado e intestino.',
      funcao: 'Transporte reverso de colesterol: capta colesterol dos tecidos periféricos e macrófagos via ABCA1 e o leva ao fígado; tem ainda ação antioxidante e anti-inflamatória.',
      orgaosEnvolvidos: ['Fígado', 'Intestino', 'Parede arterial'],
      percurso: ['ApoA1 nascente', 'captação de colesterol via ABCA1 no macrófago', 'esterificação pela LCAT', 'HDL madura', 'entrega hepática via SR-B1'],
    },
    aumento: {
      resumo: 'Exercício aeróbico, estrogênio, consumo moderado de álcool e variantes genéticas.',
      mecanismos: [
        {
          titulo: 'Estímulo metabólico e hormonal',
          explicacao: 'Exercício e estrogênio aumentam a produção de apoA1 e a atividade da lipase lipoproteica.',
          exemplos: [
            { causa: 'Exercício aeróbico regular, estrogênio, álcool em quantidade moderada', etapas: ['síntese de apoA1 ↑', 'HDL ↑'] },
            { causa: 'Deficiência de CETP', etapas: ['menor transferência de ésteres de colesterol da HDL para lipoproteínas com apoB', 'HDL ↑↑ sem proteção cardiovascular proporcional'], nota: 'Exemplo de que HDL alto não é automaticamente benéfico.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Resistência à insulina, hipertrigliceridemia, obesidade, tabagismo, sedentarismo e alguns medicamentos.',
      mecanismos: [
        {
          titulo: 'Troca lipídica com partículas ricas em triglicerídeos',
          explicacao: 'Com triglicerídeos altos, a CETP troca ésteres de colesterol da HDL por triglicerídeos; a HDL enriquecida em triglicerídeos é hidrolisada e catabolizada mais rápido.',
          exemplos: [{ causa: 'Síndrome metabólica, diabetes tipo 2, obesidade visceral', etapas: ['triglicerídeos ↑', 'ação da CETP', 'HDL rica em triglicerídeos', 'catabolismo acelerado', 'HDL ↓'], nota: 'É por isso que HDL baixo e triglicerídeos altos aparecem sempre juntos — são o mesmo fenômeno.' }],
        },
        { titulo: 'Outros', explicacao: 'Tabagismo, esteroides anabolizantes e alguns fármacos reduzem.', exemplos: [{ causa: 'Tabagismo, anabolizantes, betabloqueadores não seletivos, progestágenos', etapas: ['síntese de apoA1 ↓ ou catabolismo ↑', 'HDL ↓'] }] },
      ],
    },
    relacionados: [{ titulo: 'Leia com', ids: ['triglicerideos', 'nao-hdl', 'glicemia-jejum'], leitura: 'HDL baixo com triglicerídeos altos é a assinatura da resistência à insulina — o alvo terapêutico é ela, não o HDL.' }],
    utilidade: ['rastreamento', 'prognostico'],
    estudarTambem: ['triglicerideos', 'apoa1', 'nao-hdl'],
  },

  {
    id: 'triglicerideos',
    nome: 'Triglicerídeos',
    sigla: 'TG',
    sinonimos: ['triglicerides', 'tg', 'trigliceridemia'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular', 'metabolico', 'digestivo'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Desejável (jejum)', texto: '< 150', unidade: 'mg/dL' },
      { rotulo: 'Desejável (sem jejum)', texto: '< 175', unidade: 'mg/dL' },
      { rotulo: 'Risco de pancreatite', texto: '> 500 (muito alto acima de 1.000)', unidade: 'mg/dL' },
    ],
    resumo:
      'A gordura de transporte e armazenamento. Marcador de resistência à insulina e, acima de 500 mg/dL, causa direta de pancreatite aguda.',
    entenda:
      'Os triglicerídeos circulam em quilomícrons (de origem intestinal) e VLDL (de origem hepática). Sua concentração depende do equilíbrio entre produção hepática — aumentada por resistência à insulina, álcool e frutose — e depuração pela lipase lipoproteica, cuja atividade a insulina estimula. Daí a associação constante com síndrome metabólica. Acima de 500 mg/dL, e sobretudo acima de 1.000, a preocupação deixa de ser cardiovascular e passa a ser pancreatite: os quilomícrons obstruem a microcirculação pancreática e a lipase local libera ácidos graxos livres tóxicos.',
    fisiologia: {
      oQueE: 'Ésteres de glicerol com três ácidos graxos — a forma de armazenamento e transporte de energia.',
      origem: 'Dieta (quilomícrons) e síntese hepática (VLDL).',
      funcao: 'Fornecer energia ao músculo e substrato de armazenamento ao tecido adiposo.',
      metabolismo: 'Hidrolisados pela lipase lipoproteica no endotélio capilar, liberando ácidos graxos livres para captação tecidual.',
      orgaosEnvolvidos: ['Intestino', 'Fígado', 'Tecido adiposo', 'Músculo'],
      percurso: ['Gordura da dieta ou síntese hepática', 'quilomícrons e VLDL', 'lipase lipoproteica no endotélio', 'ácidos graxos livres', 'músculo (energia) ou adipócito (estoque)'],
    },
    aumento: {
      resumo: 'Resistência à insulina, álcool, dieta rica em carboidratos simples, obesidade, hipotireoidismo, doença renal e medicamentos.',
      mecanismos: [
        {
          titulo: 'Produção hepática aumentada',
          explicacao: 'A resistência à insulina libera ácidos graxos do tecido adiposo, que chegam ao fígado e são reesterificados e exportados como VLDL.',
          exemplos: [
            { causa: 'Síndrome metabólica e diabetes tipo 2', etapas: ['lipólise adipocitária não suprimida', 'fluxo de ácidos graxos ao fígado ↑', 'síntese de VLDL ↑', 'triglicerídeos ↑ com HDL ↓'], nota: 'Triglicerídeos altos com HDL baixo é a dislipidemia aterogênica clássica.' },
            { causa: 'Álcool e frutose', etapas: ['substrato para lipogênese hepática ↑', 'VLDL ↑', 'triglicerídeos ↑'], nota: 'O álcool pode elevar de forma dramática em predispostos — causa frequente de hipertrigliceridemia severa.' },
          ],
        },
        {
          titulo: 'Depuração reduzida',
          explicacao: 'A lipase lipoproteica não hidrolisa adequadamente as partículas ricas em triglicerídeos.',
          exemplos: [
            { causa: 'Deficiência de lipase lipoproteica ou de apoC-II (quilomicronemia familiar)', etapas: ['hidrólise de quilomícrons comprometida', 'triglicerídeos > 1.000 mg/dL', 'pancreatite de repetição e xantomas eruptivos'] },
            { causa: 'Hipotireoidismo, doença renal crônica, síndrome nefrótica', etapas: ['atividade da lipase ↓', 'triglicerídeos ↑'] },
            { causa: 'Estrogênios, corticoides, tamoxifeno, antirretrovirais, antipsicóticos atípicos, isotretinoína', etapas: ['produção ↑ ou depuração ↓', 'triglicerídeos ↑'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Resistência à insulina e obesidade', 'Álcool', 'Dieta rica em carboidratos simples'],
        comuns: ['Diabetes descompensado', 'Hipotireoidismo', 'Medicamentos'],
        menosComuns: ['Quilomicronemia familiar', 'Síndrome nefrótica'],
        emergencias: ['Triglicerídeos > 1.000 mg/dL com dor abdominal — pancreatite hipertrigliceridêmica'],
      },
    },
    reducao: { resumo: 'Desnutrição, má absorção, hipertireoidismo e hepatopatia avançada.', mecanismos: [{ titulo: 'Aporte ou síntese reduzidos', explicacao: 'Falta substrato ou o catabolismo está acelerado.', exemplos: [{ causa: 'Desnutrição, má absorção, hipertireoidismo, hepatopatia terminal', etapas: ['síntese ou aporte ↓', 'triglicerídeos ↓'] }] }] },
    relacionados: [
      { titulo: 'Na síndrome metabólica', ids: ['hdl', 'glicemia-jejum', 'hba1c', 'acido-urico'], leitura: 'Triglicerídeos altos com HDL baixo, glicemia alterada e ácido úrico alto compõem o quadro da resistência à insulina.' },
      { titulo: 'Na dor abdominal', ids: ['lipase', 'calcio'], leitura: 'Triglicerídeos acima de 1.000 com dor abdominal indicam pancreatite hipertrigliceridêmica — e a amilase pode vir falsamente normal por interferência da lipemia.' },
    ],
    interferentes: {
      preAnalitico: ['Refeição recente eleva de forma importante — para valores muito altos, coletar em jejum de 12 horas.', 'Lipemia intensa interfere em vários outros ensaios do mesmo tubo (sódio, amilase, hemoglobina).'],
      fisiologico: ['Álcool nas 48 horas anteriores eleva.'],
    },
    normalizacao: [
      { cenario: 'Hipertrigliceridemia por resistência à insulina', caminho: 'Perda de peso, redução de açúcares e álcool, atividade física e controle glicêmico. Responde muito bem a mudança de estilo de vida — mais que qualquer outra fração lipídica.', prazo: 'Semanas.' },
      { cenario: 'Hipertrigliceridemia grave (> 500)', caminho: 'Abstinência alcoólica, restrição de gordura, fibrato e controle do diabetes. O objetivo imediato é prevenir pancreatite, não reduzir risco cardiovascular.', prazo: 'Dias a semanas.' },
    ],
    utilidade: ['rastreamento', 'diagnostico', 'acompanhamento'],
    estudarTambem: ['hdl', 'nao-hdl', 'glicemia-jejum', 'lipase'],
  },

  {
    id: 'nao-hdl',
    nome: 'Colesterol não-HDL',
    sinonimos: ['nao hdl', 'colesterol nao hdl', 'non-hdl'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular'],
    material: 'Calculado: colesterol total menos HDL',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Meta', texto: 'LDL-alvo + 30', unidade: 'mg/dL', observacao: 'A meta acompanha a do LDL conforme o risco: se o LDL-alvo é 70, o não-HDL é 100.' }],
    resumo:
      'Todo o colesterol carregado por partículas aterogênicas. Melhor preditor de risco que o LDL, especialmente com triglicerídeos elevados — e não exige jejum.',
    entenda:
      'Subtrair o HDL do colesterol total deixa exatamente o colesterol contido em LDL, VLDL, IDL, remanescentes e Lp(a) — todas partículas com apoB, todas capazes de entrar na parede arterial e ficar retidas. Por isso o não-HDL captura o risco que o LDL isolado perde quando há hipertrigliceridemia: as partículas remanescentes, altamente aterogênicas, não entram no cálculo do LDL, mas entram no não-HDL. E como o HDL e o colesterol total variam pouco com a alimentação, ele pode ser calculado sem jejum.',
    fisiologia: {
      oQueE: 'Soma do colesterol de todas as lipoproteínas que contêm apoB.',
      origem: 'Cálculo simples a partir do perfil lipídico básico.',
      funcao: 'Estimar a carga aterogênica total.',
      percurso: ['Colesterol total', 'menos HDL', 'colesterol de todas as partículas com apoB', 'risco aterogênico'],
    },
    aumento: {
      resumo: 'Mesmas causas do LDL alto, somadas às da hipertrigliceridemia — e é essa soma que o torna melhor preditor.',
      mecanismos: [
        {
          titulo: 'Aumento de qualquer partícula aterogênica',
          explicacao: 'Contabiliza LDL, VLDL, IDL, remanescentes e Lp(a) num único número.',
          exemplos: [{ causa: 'Dislipidemia aterogênica da síndrome metabólica', etapas: ['VLDL e remanescentes ↑', 'LDL pode parecer normal', 'não-HDL ↑ revela o risco escondido'], nota: 'É o cenário em que o LDL isolado mais engana.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Confirme com a contagem de partículas', ids: ['apob', 'ldl', 'triglicerideos'], leitura: 'Não-HDL e apoB dizem quase a mesma coisa; a apoB conta partículas diretamente, o não-HDL soma a carga que elas transportam.' }],
    utilidade: ['rastreamento', 'prognostico', 'acompanhamento'],
    estudarTambem: ['apob', 'ldl', 'triglicerideos'],
  },

  {
    id: 'apob',
    nome: 'Apolipoproteína B',
    sigla: 'ApoB',
    sinonimos: ['apob100', 'apo b', 'apolipoproteina b100'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Desejável', texto: '< 90', unidade: 'mg/dL' },
      { rotulo: 'Risco alto — meta', texto: '< 80', unidade: 'mg/dL' },
      { rotulo: 'Risco muito alto — meta', texto: '< 65', unidade: 'mg/dL' },
    ],
    resumo:
      'Conta o número de partículas aterogênicas — uma apoB por partícula. É a medida mais direta da carga de risco.',
    entenda:
      'Cada partícula de LDL, VLDL, IDL, remanescente e Lp(a) carrega exatamente uma molécula de apoB100. Dosar apoB é, portanto, contar partículas. Isso importa porque o que penetra e fica retido na parede arterial é a partícula, não o colesterol que ela transporta. Quando LDL e apoB discordam — LDL aparentemente controlado com apoB alta —, quem está certo sobre o risco é a apoB: significa muitas partículas pequenas e densas, cada uma pobre em colesterol. É a situação típica do diabético e do paciente com síndrome metabólica.',
    fisiologia: {
      oQueE: 'Proteína estrutural das lipoproteínas aterogênicas; a apoB100 é hepática e a apoB48, intestinal.',
      origem: 'Fígado (apoB100) e intestino (apoB48).',
      funcao: 'Dar estrutura à partícula e servir de ligante para o receptor de LDL.',
      percurso: ['Uma apoB100 por partícula de VLDL', 'mantida na conversão a IDL e LDL', 'apoB total = número de partículas aterogênicas'],
    },
    aumento: {
      resumo: 'Número aumentado de partículas aterogênicas — o risco real, mesmo quando o LDL parece aceitável.',
      mecanismos: [
        {
          titulo: 'Excesso de partículas',
          explicacao: 'Produção hepática aumentada ou depuração reduzida elevam a contagem.',
          exemplos: [
            { causa: 'Resistência à insulina, diabetes tipo 2, hipertrigliceridemia', etapas: ['VLDL ↑ e partículas de LDL pequenas e densas', 'muitas partículas com pouco colesterol cada', 'apoB ↑ com LDL calculado normal'], nota: 'Discordância entre LDL e apoB identifica o risco residual — e a apoB é quem manda.' },
            { causa: 'Hipercolesterolemia familiar', etapas: ['clearance de LDL ↓', 'apoB ↑↑'] },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Compare sempre', ids: ['ldl', 'nao-hdl', 'triglicerideos'], leitura: 'ApoB alta com LDL no alvo significa muitas partículas pequenas e densas — risco subestimado pelo LDL.' }],
    utilidade: ['rastreamento', 'prognostico'],
    estudarTambem: ['ldl', 'nao-hdl', 'lpa'],
  },

  {
    id: 'apoa1',
    nome: 'Apolipoproteína A1',
    sigla: 'ApoA1',
    sinonimos: ['apo a1', 'apolipoproteina a1'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Homens', minimo: 110, maximo: 180, unidade: 'mg/dL' },
      { rotulo: 'Mulheres', minimo: 120, maximo: 200, unidade: 'mg/dL' },
    ],
    resumo: 'A principal proteína da HDL. A relação apoB/apoA1 resume, em um número, o equilíbrio entre partículas aterogênicas e protetoras.',
    entenda:
      'A apoA1 ativa a LCAT e interage com o transportador ABCA1 do macrófago, sendo o motor do transporte reverso de colesterol. Clinicamente, seu maior valor está na relação apoB/apoA1, que se mostrou um dos melhores preditores de infarto em estudos populacionais — melhor que qualquer fração isolada, porque compara diretamente o que agride e o que remove.',
    fisiologia: {
      oQueE: 'Principal apolipoproteína da HDL.',
      origem: 'Fígado e intestino.',
      funcao: 'Ativar a LCAT e mediar o efluxo de colesterol do macrófago via ABCA1.',
      percurso: ['ApoA1 nascente', 'efluxo de colesterol do macrófago (ABCA1)', 'esterificação (LCAT)', 'HDL madura', 'entrega hepática'],
    },
    aumento: { resumo: 'Exercício, estrogênio e consumo moderado de álcool.', mecanismos: [{ titulo: 'Síntese aumentada', explicacao: 'Estímulos hormonais e metabólicos aumentam a produção hepática.', exemplos: [{ causa: 'Exercício, estrogênio, álcool moderado', etapas: ['síntese de apoA1 ↑', 'apoA1 e HDL ↑'] }] }] },
    reducao: { resumo: 'Resistência à insulina, obesidade, tabagismo, hepatopatia e doença de Tangier.', mecanismos: [{ titulo: 'Síntese reduzida ou catabolismo acelerado', explicacao: 'A troca lipídica com partículas ricas em triglicerídeos acelera a remoção da apoA1.', exemplos: [{ causa: 'Síndrome metabólica, tabagismo, hepatopatia', etapas: ['catabolismo ↑ ou síntese ↓', 'apoA1 ↓'] }] }] },
    relacionados: [{ titulo: 'A relação que prediz', ids: ['apob', 'hdl'], leitura: 'A relação apoB/apoA1 compara partículas aterogênicas com protetoras e é um preditor de risco robusto.' }],
    utilidade: ['prognostico'],
    estudarTambem: ['apob', 'hdl'],
  },

  {
    id: 'lpa',
    nome: 'Lipoproteína(a)',
    sigla: 'Lp(a)',
    sinonimos: ['lipoproteina a', 'lp a', 'lpa'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular'],
    material: 'Soro',
    unidade: 'nmol/L',
    referencias: [
      { rotulo: 'Desejável', texto: '< 75 nmol/L (≈ 30 mg/dL)', unidade: 'nmol/L' },
      { rotulo: 'Risco aumentado', texto: '> 125 nmol/L (≈ 50 mg/dL)', unidade: 'nmol/L', observacao: 'A dosagem em nmol/L é preferível: mg/dL sofre com a variação do tamanho das isoformas.' },
    ],
    resumo:
      'Uma partícula de LDL com uma apolipoproteína(a) acoplada. Geneticamente determinada, praticamente fixa ao longo da vida — e um fator de risco causal independente.',
    entenda:
      'A Lp(a) é uma LDL à qual se liga covalentemente a apo(a), uma proteína estruturalmente semelhante ao plasminogênio. Isso lhe dá duplo efeito: aterogênico (como qualquer partícula com apoB) e potencialmente pró-trombótico (por competir com o plasminogênio e inibir a fibrinólise). Seu nível é determinado em mais de 90% pela genética, não muda com dieta nem com estatina, e por isso a recomendação é dosá-la ao menos uma vez na vida — o valor não vai mudar, e identifica risco que os demais lipídios não capturam.',
    aprofundar: [
      'A apo(a) contém repetições de domínios kringle IV tipo 2, cujo número varia entre indivíduos e determina o tamanho da isoforma. Isoformas menores associam-se a níveis plasmáticos mais altos e a maior risco. Essa variação de tamanho é o que torna a dosagem em massa (mg/dL) imprecisa: uma mesma massa pode corresponder a números muito diferentes de partículas. A dosagem molar (nmol/L) conta partículas e é a recomendada.',
      'Lp(a) elevada é fator de risco independente para doença coronária, acidente vascular cerebral isquêmico e — de forma característica — estenose aórtica calcificada. Como ainda não há terapia específica aprovada de redução com desfecho comprovado, a conduta atual é intensificar o controle dos demais fatores de risco e rastrear familiares de primeiro grau, dado o forte componente hereditário.',
    ],
    fisiologia: {
      oQueE: 'Partícula de LDL ligada covalentemente à apolipoproteína(a), homóloga do plasminogênio.',
      origem: 'Fígado; concentração determinada geneticamente pelo gene LPA.',
      funcao: 'Função fisiológica não estabelecida; possivelmente participa da reparação tecidual e da resposta a lesão vascular.',
      percurso: ['Gene LPA determina o tamanho da isoforma', 'síntese hepática de apo(a)', 'ligação covalente à apoB100 da LDL', 'Lp(a) circulante — nível estável por toda a vida'],
    },
    aumento: {
      resumo: 'Determinação genética; secundariamente, doença renal, hipotireoidismo e estados inflamatórios elevam de forma modesta.',
      mecanismos: [
        {
          titulo: 'Determinação genética',
          explicacao: 'O número de repetições kringle IV do gene LPA define o nível plasmático desde o nascimento.',
          exemplos: [{ causa: 'Isoformas pequenas de apo(a)', etapas: ['menos repetições kringle', 'secreção hepática mais eficiente', 'Lp(a) ↑ por toda a vida', 'risco coronário e de estenose aórtica ↑'], nota: 'Não responde a dieta nem a estatina — que pode até elevá-la discretamente.' }],
        },
        { titulo: 'Causas secundárias', explicacao: 'Algumas condições elevam modestamente.', exemplos: [{ causa: 'Síndrome nefrótica, doença renal crônica, hipotireoidismo, menopausa', etapas: ['depuração ↓ ou síntese ↑', 'Lp(a) ↑ moderada'] }] },
      ],
    },
    relacionados: [{ titulo: 'Na avaliação de risco', ids: ['ldl', 'apob', 'pcr-ultrassensivel'], leitura: 'Lp(a) alta identifica risco que o LDL não captura — e justifica metas de LDL mais agressivas, já que não há terapia específica estabelecida.' }],
    utilidade: ['rastreamento', 'prognostico'],
    estudarTambem: ['ldl', 'apob'],
  },

  {
    id: 'ldl-oxidado',
    nome: 'LDL oxidado e partículas remanescentes',
    sinonimos: ['ldl ox', 'ldl oxidada', 'remanescentes', 'idl', 'colesterol remanescente', 'apoc iii', 'apoe'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Colesterol remanescente (calculado)', texto: '< 30 (CT − HDL − LDL)', unidade: 'mg/dL', observacao: 'A dosagem direta de LDL oxidado, apoC-III e apoE não é rotineira e permanece sobretudo em pesquisa.' }],
    resumo:
      'O perfil lipídico expandido: partículas remanescentes, IDL, LDL oxidado e as apolipoproteínas reguladoras. Explicam o risco que o painel básico não mostra.',
    entenda:
      'O colesterol remanescente — o que sobra ao subtrair HDL e LDL do total — representa o colesterol das lipoproteínas ricas em triglicerídeos parcialmente hidrolisadas: VLDL residual, IDL e remanescentes de quilomícrons. Essas partículas são pequenas o bastante para atravessar o endotélio e ricas em colesterol, sendo captadas diretamente pelo macrófago sem necessidade de oxidação prévia — o que as torna intensamente aterogênicas. Estudos genéticos sustentam causalidade, e é esse componente que explica boa parte do risco residual em pacientes com triglicerídeos altos.',
    aprofundar: [
      'A oxidação da LDL retida na íntima é o passo que a torna irreconhecível para o receptor de LDL e reconhecível pelos receptores scavenger do macrófago — que não têm retroalimentação negativa. O macrófago acumula colesterol até virar célula espumosa. Dosar LDL oxidado no plasma, porém, não se traduziu em ganho clínico sobre os marcadores estabelecidos, e o exame permanece de uso predominantemente investigacional.',
      'As apolipoproteínas menores modulam esse metabolismo de formas com consequências terapêuticas. A apoC-II é cofator obrigatório da lipase lipoproteica — sua deficiência causa quilomicronemia grave. A apoC-III a inibe, e níveis altos associam-se a hipertrigliceridemia e maior risco; pessoas com variantes de perda de função da apoC-III têm triglicerídeos baixos e menos doença coronária, o que a tornou alvo de terapias em desenvolvimento. A apoE governa a captação hepática de remanescentes: o genótipo E2/E2 causa disbetalipoproteinemia, com acúmulo de IDL, xantomas palmares e risco vascular elevado.',
    ],
    fisiologia: {
      oQueE: 'Conjunto de lipoproteínas intermediárias e apolipoproteínas reguladoras do metabolismo das partículas ricas em triglicerídeos.',
      origem: 'Fígado e intestino; formadas durante a lipólise da VLDL e dos quilomícrons.',
      funcao: 'Estágios intermediários do transporte de lipídios; a apoC-II ativa e a apoC-III inibe a lipase lipoproteica, e a apoE medeia a captação hepática.',
      percurso: ['VLDL e quilomícrons', 'lipólise parcial pela lipase lipoproteica', 'remanescentes e IDL', 'captação hepática via apoE — ou retenção na parede arterial'],
    },
    aumento: {
      resumo: 'Hipertrigliceridemia, resistência à insulina, disbetalipoproteinemia (apoE2/E2) e deficiências de lipase.',
      mecanismos: [
        {
          titulo: 'Lipólise incompleta e captação hepática deficiente',
          explicacao: 'As partículas ricas em triglicerídeos permanecem em circulação em estágio intermediário, altamente aterogênico.',
          exemplos: [
            { causa: 'Resistência à insulina e hipertrigliceridemia', etapas: ['produção de VLDL ↑ e lipólise ↓', 'acúmulo de remanescentes', 'colesterol remanescente ↑', 'risco cardiovascular residual'], nota: 'É o componente que o LDL calculado não captura.' },
            { causa: 'Disbetalipoproteinemia (apoE2/E2)', etapas: ['apoE com baixa afinidade pelo receptor hepático', 'acúmulo de IDL e remanescentes', 'colesterol e triglicerídeos ambos elevados, xantomas palmares'], nota: 'Elevação proporcional de colesterol e triglicerídeos com xantomas palmares é praticamente diagnóstica.' },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'O que pedir na prática', ids: ['nao-hdl', 'apob', 'triglicerideos'], leitura: 'Na rotina, não-HDL e apoB já capturam o risco das partículas remanescentes. O perfil expandido acrescenta valor em dislipidemias graves ou discordantes.' }],
    utilidade: ['prognostico'],
    estudarTambem: ['triglicerideos', 'nao-hdl', 'apob'],
  },
]
