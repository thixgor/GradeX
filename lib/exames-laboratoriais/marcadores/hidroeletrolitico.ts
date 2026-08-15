import type { Marcador } from '../tipos'

/**
 * Cálculos hidroeletrolíticos e ácido-básicos — os exames que ninguém coleta.
 *
 * Tudo neste arquivo é derivado de valores que o paciente já tem. A
 * osmolalidade calculada, o gap osmolar, o sódio corrigido, o cálcio
 * corrigido, o ânion gap corrigido pela albumina, o delta-delta: nenhum deles
 * exige uma nova punção. São operações aritméticas sobre o painel básico — e
 * cada uma responde uma pergunta que os números crus escondem.
 *
 * Há um fio comum a quase todos: **o valor medido não é o valor fisiológico
 * relevante**. O sódio medido em uma hiperglicemia não reflete a tonicidade
 * real. O cálcio total em um hipoalbuminêmico não reflete o cálcio ionizado. O
 * ânion gap em um paciente crítico com albumina de 2,0 g/dL parece normal
 * quando na verdade está alto. Corrigir não é preciosismo acadêmico: é a
 * diferença entre ver e não ver o distúrbio.
 */
export const marcadores: Marcador[] = [
  {
    id: 'osmolalidade-serica',
    nome: 'Osmolalidade sérica e gap osmolar',
    sigla: 'Osm / GO',
    sinonimos: ['osmolalidade serica', 'osmolaridade', 'gap osmolar', 'hiato osmolar', 'osmol gap'],
    grupo: 'eletrolitos',
    sistemas: ['metabolico', 'renal', 'toxicologico'],
    material: 'Soro (medida por osmometria de ponto de congelamento) e cálculo',
    unidade: 'mOsm/kg',
    referencias: [
      { rotulo: 'Osmolalidade sérica medida', minimo: 275, maximo: 295, unidade: 'mOsm/kg' },
      { rotulo: 'Osmolalidade calculada', texto: '2 × Na⁺ + glicose/18 + ureia/6', unidade: 'mOsm/kg' },
      { rotulo: 'Gap osmolar normal', texto: '< 10', unidade: 'mOsm/kg', observacao: 'Acima de 10, procure um soluto não medido — tipicamente um álcool tóxico.' },
    ],
    resumo:
      'A diferença entre a osmolalidade que o osmômetro mede e a que a fórmula prevê revela solutos invisíveis ao painel de rotina. É o exame que detecta intoxicação por metanol e etilenoglicol antes de qualquer dosagem específica.',
    entenda:
      'A fórmula soma os osmóis que sabemos existir: sódio (com seu ânion acompanhante, daí o dobro), glicose e ureia. O osmômetro mede tudo o que está de fato dissolvido. Se o medido excede o calculado, existe alguma coisa ali que não foi contabilizada. Em contexto clínico compatível, essa "coisa" é quase sempre um álcool — etanol, metanol, etilenoglicol, isopropanol — ou manitol.',
    aprofundar: [
      'A combinação com o ânion gap conta a história inteira da intoxicação por álcoois tóxicos ao longo do tempo, e entender essa evolução é o que evita o erro fatal. Logo após a ingestão, o álcool ainda está íntegro: o gap osmolar está alto e o ânion gap normal. Conforme a álcool-desidrogenase o metaboliza em ácidos orgânicos — ácido fórmico no metanol, ácido glicólico e oxálico no etilenoglicol —, o gap osmolar **cai** e o ânion gap **sobe**. Um paciente que chega tarde pode ter gap osmolar normal e acidose grave, e a ausência do gap osmolar não exclui a intoxicação.',
      'O etanol é o interferente e o antídoto ao mesmo tempo. Ele eleva o gap osmolar sem ser tóxico — e, por competir pela álcool-desidrogenase, retarda a formação dos metabólitos tóxicos dos outros álcoois. Por isso o etanol já foi usado como antídoto antes do fomepizol. Na prática, se o etanol foi dosado, seu valor deve ser incluído na fórmula (etanol/4,6) para não mascarar outro soluto.',
      'A distinção entre osmolalidade e tonicidade importa clinicamente. A ureia atravessa livremente as membranas celulares e, portanto, contribui para a osmolalidade sem gerar movimento de água — é osmoticamente ineficaz. Um paciente urêmico tem osmolalidade alta e tonicidade normal, e suas células não estão desidratadas. Já a glicose, em ausência de insulina, não entra na célula e é osmoticamente ativa: ela puxa água do intracelular, e é isso que causa a hiponatremia da hiperglicemia.',
      'A pseudo-hiponatremia é a aplicação diagnóstica mais elegante: hipertrigliceridemia grave ou paraproteinemia deslocam o volume aquoso do plasma, e métodos que diluem a amostra medem menos sódio por volume total. A osmolalidade **medida**, no entanto, permanece normal — porque a fase aquosa está intacta. Sódio baixo com osmolalidade medida normal é artefato, não hiponatremia.',
    ],
    fisiologia: {
      oQueE: 'Concentração total de partículas osmoticamente ativas por quilograma de água plasmática.',
      origem: 'Determinada principalmente por sódio e seus ânions, glicose e ureia.',
      funcao: 'Regular a distribuição de água entre os compartimentos intra e extracelular.',
      orgaosEnvolvidos: ['Rim', 'Hipotálamo (osmorreceptores)', 'Neuro-hipófise'],
      percurso: [
        'Osmorreceptores hipotalâmicos detectam variação de tonicidade',
        'liberação ou supressão de ADH',
        'ajuste da reabsorção de água no ducto coletor',
        'osmolalidade mantida em faixa estreita',
      ],
    },
    aumento: {
      resumo: 'Hipernatremia, hiperglicemia, uremia — ou soluto exógeno não contabilizado pela fórmula.',
      mecanismos: [
        {
          titulo: 'Acúmulo de soluto não medido',
          explicacao: 'Substâncias osmoticamente ativas ausentes da fórmula elevam a osmolalidade medida sem elevar a calculada, criando o gap.',
          exemplos: [
            { causa: 'Intoxicação por metanol ou etilenoglicol', etapas: ['ingestão do álcool', 'gap osmolar ↑ com ânion gap ainda normal', 'metabolização a ácidos orgânicos', 'gap osmolar cai e ânion gap sobe', 'acidose metabólica grave e lesão de órgão-alvo'], nota: 'Metanol lesa o nervo óptico; etilenoglicol produz cristais de oxalato e insuficiência renal.' },
            { causa: 'Manitol, sorbitol, contraste, propilenoglicol', etapas: ['soluto exógeno na circulação', 'gap osmolar ↑ sem acidose', 'resolução com a depuração do soluto'], nota: 'Propilenoglicol é veículo de lorazepam e fenitoína endovenosos — infusão prolongada gera gap osmolar e acidose.' },
          ],
        },
        {
          titulo: 'Elevação por solutos contabilizados',
          explicacao: 'Quando o aumento se deve a sódio, glicose ou ureia, a calculada acompanha a medida e não há gap.',
          exemplos: [
            { causa: 'Estado hiperglicêmico hiperosmolar', etapas: ['glicemia muito elevada', 'osmolalidade > 320 mOsm/kg', 'desidratação intracelular e rebaixamento de consciência', 'gap osmolar normal'] },
            { causa: 'Hipernatremia por perda de água livre', etapas: ['perda de água sem sódio', 'osmolalidade ↑ com sódio ↑', 'sede e ADH máximo como resposta'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hiponatremia hipotônica verdadeira — a única forma de hiponatremia que move água para dentro das células.',
      mecanismos: [
        {
          titulo: 'Excesso de água livre em relação ao soluto',
          explicacao: 'A retenção de água ou a perda de soluto reduzem a tonicidade e deslocam água para o intracelular, com risco de edema cerebral.',
          exemplos: [
            { causa: 'SIADH, polidipsia primária, insuficiência cardíaca ou cirrose', etapas: ['água retida em excesso', 'osmolalidade sérica < 275 mOsm/kg', 'edema celular', 'sintomas neurológicos proporcionais à velocidade da queda'], nota: 'A osmolalidade urinária, junto com o sódio urinário, separa essas causas entre si.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na avaliação da hiponatremia', ids: ['sodio', 'osmolalidade-urinaria', 'sodio-urinario'], leitura: 'A sequência é: osmolalidade sérica (é hipotônica?), depois osmolalidade urinária (o ADH está ligado?), depois sódio urinário (há volume?).' },
      { titulo: 'Na acidose com gap osmolar', ids: ['anion-gap', 'lactato', 'ph', 'bicarbonato'], leitura: 'Gap osmolar alto com ânion gap alto e lactato normal aponta fortemente para álcool tóxico — e o tratamento não deve aguardar a dosagem específica.' },
    ],
    advertencia:
      'Gap osmolar normal não exclui intoxicação por álcool tóxico se a ingestão foi há muitas horas: o álcool já metabolizado deixa de gerar gap osmolar e passa a gerar acidose com ânion gap alto.',
    utilidade: ['diagnostico'],
    estudarTambem: ['sodio', 'anion-gap', 'osmolalidade-urinaria'],
  },

  {
    id: 'sodio-corrigido',
    nome: 'Sódio corrigido pela glicemia e cálcio corrigido pela albumina',
    sigla: 'Na⁺ corr / Ca²⁺ corr',
    sinonimos: ['sodio corrigido', 'sodio corrigido pela glicemia', 'calcio corrigido', 'calcio corrigido pela albumina', 'pseudo-hiponatremia'],
    grupo: 'eletrolitos',
    sistemas: ['metabolico', 'renal'],
    material: 'Cálculo a partir do painel bioquímico',
    unidade: 'mEq/L e mg/dL',
    referencias: [
      { rotulo: 'Sódio corrigido', texto: 'Na⁺ medido + 1,6 × [(glicemia − 100) ÷ 100]', unidade: 'mEq/L', observacao: 'Alguns autores usam fator 2,4 para glicemias acima de 400 mg/dL.' },
      { rotulo: 'Cálcio corrigido', texto: 'Ca²⁺ total + 0,8 × (4,0 − albumina)', unidade: 'mg/dL' },
      { rotulo: 'Referência do cálcio corrigido', minimo: 8.5, maximo: 10.5, unidade: 'mg/dL' },
    ],
    resumo:
      'Duas correções que mudam a conduta com frequência: a hiponatremia da hiperglicemia raramente precisa de sódio, e a hipocalcemia do hipoalbuminêmico frequentemente não existe.',
    entenda:
      'Nos dois casos o valor medido é real, mas não é o valor fisiologicamente relevante. Na hiperglicemia, a glicose retida no extracelular puxa água de dentro das células, diluindo o sódio — o sódio está realmente baixo, mas por deslocamento de água, não por excesso de água corporal. Tratar isso com salina hipertônica é um erro: corrigir a glicemia corrige o sódio. Na hipoalbuminemia, quase metade do cálcio total viaja ligada à albumina; menos albumina significa menos cálcio total medido, mas o cálcio **ionizado** — o biologicamente ativo — permanece normal.',
    aprofundar: [
      'A correção do sódio tem uma consequência prognóstica importante na cetoacidose diabética. Um paciente que chega com sódio medido de 130 mEq/L e glicemia de 700 mg/dL tem sódio corrigido em torno de 145 — ou seja, está **hipernatrêmico** de fato, com déficit importante de água livre. Conforme a insulina baixa a glicemia, o sódio medido subirá sozinho, e interpretar essa subida como hipernatremia iatrogênica leva a ajustes de fluido equivocados. Conhecer o sódio corrigido de entrada antecipa esse comportamento.',
      'A fórmula do cálcio corrigido tem limitações reconhecidas: ela foi derivada de populações ambulatoriais e apresenta desempenho ruim em pacientes críticos, em doença renal crônica e em distúrbios ácido-básicos. Quando o cálcio ionizado está disponível — e em ambiente de terapia intensiva geralmente está, junto com a gasometria —, ele deve ser preferido. A correção é uma aproximação para quando o ionizado não existe.',
      'O pH altera a ligação do cálcio à albumina de forma clinicamente relevante: a alcalose aumenta a ligação e reduz o cálcio ionizado sem alterar o total. É por isso que a hiperventilação produz parestesias e espasmo carpopedal com cálcio total normal — o cálcio livre caiu. A correção pela albumina não capta esse efeito; só o ionizado capta.',
      'Uma armadilha do outro lado: a pseudo-hiponatremia por hipertrigliceridemia ou paraproteinemia **não** é corrigida por essas fórmulas. Ali o sódio na fase aquosa é normal, e a osmolalidade medida é normal — é um artefato de método, não um distúrbio. Reconhecê-lo evita tratamento de uma hiponatremia que não existe.',
    ],
    fisiologia: {
      oQueE: 'Ajustes matemáticos que estimam o valor fisiologicamente ativo a partir do valor medido, corrigindo o efeito da glicose sobre a água e da albumina sobre a ligação do cálcio.',
      origem: 'Derivados do painel bioquímico básico.',
      funcao: 'Revelar o distúrbio real por trás de um número enganoso.',
      orgaosEnvolvidos: ['Rim', 'Paratireoides', 'Fígado'],
      percurso: [
        'Glicose retida no extracelular por falta de insulina',
        'gradiente osmótico puxa água do intracelular',
        'diluição do sódio medido',
        'ou: albumina baixa reduz a fração ligada de cálcio',
        'cálcio total cai com ionizado preservado',
      ],
    },
    aumento: {
      resumo: 'Sódio corrigido alto revela déficit de água livre mascarado pela hiperglicemia; cálcio corrigido alto revela hipercalcemia oculta pela hipoalbuminemia.',
      mecanismos: [
        {
          titulo: 'Desmascaramento do distúrbio real',
          explicacao: 'A correção remove o efeito do fator confundidor e expõe o distúrbio que o valor bruto escondia.',
          exemplos: [
            { causa: 'Cetoacidose diabética com sódio medido normal', etapas: ['glicemia muito elevada dilui o sódio medido', 'sódio corrigido acima de 145 mEq/L', 'déficit real de água livre significativo', 'reposição hídrica planejada considerando o valor corrigido'] },
            { causa: 'Hipercalcemia da malignidade em paciente desnutrido', etapas: ['albumina baixa reduz o cálcio total', 'cálcio total aparentemente normal', 'cálcio corrigido ou ionizado revela hipercalcemia', 'sintomas neurológicos e renais explicados'], nota: 'Hipercalcemia sintomática com cálcio total "normal" em paciente com albumina de 2,0 g/dL é um cenário real e perdido com frequência.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Cálcio corrigido baixo indica hipocalcemia verdadeira, que exige investigação de PTH, magnésio e vitamina D.',
      mecanismos: [
        {
          titulo: 'Hipocalcemia real',
          explicacao: 'Depois de descontar o efeito da albumina, um cálcio ainda baixo reflete déficit efetivo de cálcio ionizado.',
          exemplos: [
            { causa: 'Hipoparatireoidismo pós-tireoidectomia', etapas: ['remoção ou desvascularização das paratireoides', 'PTH ↓', 'cálcio corrigido ↓ com fósforo ↑', 'parestesias, sinal de Chvostek e Trousseau'] },
            { causa: 'Hipomagnesemia', etapas: ['magnésio baixo impede a secreção e a ação do PTH', 'hipocalcemia refratária à reposição de cálcio', 'correção só ocorre após repor magnésio'], nota: 'Hipocalcemia que não corrige com cálcio deve levar a dosar magnésio.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A medida direta quando disponível', ids: ['calcio-ionizado', 'calcio', 'albumina'], leitura: 'Em paciente crítico, prefira o cálcio ionizado à correção — a fórmula tem desempenho ruim justamente nesse cenário.' },
      { titulo: 'Na hiperglicemia', ids: ['sodio', 'glicemia-jejum', 'osmolalidade-serica'], leitura: 'Sódio corrigido, osmolalidade e cetonemia descrevem juntos o estado hídrico e metabólico da descompensação diabética.' },
    ],
    advertencia:
      'A pseudo-hiponatremia por hipertrigliceridemia ou paraproteinemia não é corrigida por estas fórmulas — reconhece-se pela osmolalidade medida normal.',
    utilidade: ['diagnostico'],
    estudarTambem: ['sodio', 'calcio-ionizado', 'albumina', 'magnesio'],
  },

  {
    id: 'anion-gap-corrigido',
    nome: 'Ânion gap corrigido e análise delta-delta',
    sigla: 'AG corr / Δ/Δ',
    sinonimos: ['anion gap corrigido', 'delta gap', 'delta delta', 'delta ratio', 'distúrbio misto acido base'],
    grupo: 'gasometria',
    sistemas: ['metabolico', 'renal', 'respiratorio'],
    material: 'Cálculo a partir de eletrólitos, albumina e gasometria',
    unidade: 'mEq/L e razão',
    referencias: [
      { rotulo: 'Ânion gap corrigido', texto: 'AG medido + 2,5 × (4,0 − albumina em g/dL)', unidade: 'mEq/L' },
      { rotulo: 'Razão delta/delta', texto: 'ΔAG ÷ ΔHCO₃⁻', unidade: 'razão' },
      { rotulo: 'Δ/Δ < 1', texto: 'Acidose de ânion gap alto + acidose hiperclorêmica associada', unidade: '' },
      { rotulo: 'Δ/Δ entre 1 e 2', texto: 'Acidose de ânion gap alto pura', unidade: '' },
      { rotulo: 'Δ/Δ > 2', texto: 'Acidose de ânion gap alto + alcalose metabólica associada', unidade: '' },
    ],
    resumo:
      'Duas correções que revelam distúrbios ácido-básicos escondidos: a albumina baixa mascara o ânion gap alto, e a análise delta-delta identifica o segundo e o terceiro distúrbio que coexistem com o primeiro.',
    entenda:
      'A albumina é o principal ânion não medido do plasma. Um paciente crítico com albumina de 2,0 g/dL tem um ânion gap basal cerca de 5 mEq/L menor que o de uma pessoa saudável — o que significa que um ânion gap "normal" de 12 nesse paciente é, na verdade, um ânion gap alto de 17. Sem a correção, uma acidose láctica ou uma cetoacidose pode passar completamente despercebida exatamente na população em que elas são mais frequentes.',
    aprofundar: [
      'A lógica do delta-delta parte de uma premissa simples: cada ânion orgânico acumulado deveria consumir um bicarbonato. Se o ânion gap subiu 12 e o bicarbonato caiu 12, há apenas uma acidose de ânion gap alto. Se o ânion gap subiu 12 mas o bicarbonato caiu 20, há um consumo adicional de bicarbonato por outra via — uma acidose hiperclorêmica concomitante, tipicamente por diarreia ou por soro fisiológico em excesso. Se o ânion gap subiu 12 e o bicarbonato caiu apenas 4, algo estava repondo bicarbonato — uma alcalose metabólica concomitante, tipicamente vômitos ou diurético.',
      'Esse raciocínio é o que permite identificar três distúrbios simultâneos num único paciente. O exemplo clássico é o etilista que chega com vômitos e cetoacidose alcoólica: tem acidose de ânion gap alto pelos cetoácidos, alcalose metabólica pelos vômitos, e frequentemente alcalose respiratória por hiperventilação. Nenhum desses três é visível olhando apenas o pH, que pode estar praticamente normal.',
      'A sequência completa de análise, na ordem que evita erros, é: (1) identificar a acidemia ou alcalemia pelo pH; (2) determinar o distúrbio primário por bicarbonato e pCO₂; (3) verificar se a compensação é adequada pelas fórmulas esperadas; (4) calcular o ânion gap corrigido pela albumina; (5) se ele estiver alto, aplicar o delta-delta. Pular a etapa 4 é o erro mais frequente na terapia intensiva.',
      'Uma armadilha: a acidose láctica tende a produzir Δ/Δ próximo de 1, enquanto a cetoacidose diabética frequentemente produz Δ/Δ maior que 1 porque os cetoânions são perdidos na urina — eles saem do organismo sem que o bicarbonato seja regenerado, e depois, com a hidratação, resta uma acidose hiperclorêmica residual. Isso explica por que o bicarbonato demora a normalizar mesmo após o ânion gap ter fechado.',
    ],
    fisiologia: {
      oQueE: 'Ânion gap: diferença entre cátions e ânions medidos, refletindo os ânions não medidos. Delta-delta: comparação entre o quanto o ânion gap subiu e o quanto o bicarbonato caiu.',
      origem: 'Cálculo a partir de sódio, cloro, bicarbonato e albumina.',
      funcao: 'Identificar acidoses por acúmulo de ácidos orgânicos e detectar distúrbios ácido-básicos mistos.',
      orgaosEnvolvidos: ['Rim', 'Pulmão', 'Fígado'],
      percurso: [
        'Ácido orgânico acumulado dissocia-se',
        'o próton é tamponado pelo bicarbonato',
        'o ânion permanece como ânion não medido',
        'ânion gap ↑ e bicarbonato ↓ em proporção aproximadamente 1:1',
        'desvios dessa proporção revelam um segundo distúrbio',
      ],
    },
    aumento: {
      resumo: 'Acúmulo de ácidos orgânicos — e, quando corrigido pela albumina, revela acidoses que o cálculo bruto esconderia.',
      mecanismos: [
        {
          titulo: 'Acúmulo de ânions não medidos',
          explicacao: 'Ácidos orgânicos consomem bicarbonato e deixam seus ânions no plasma, ampliando a diferença entre cátions e ânions medidos.',
          exemplos: [
            { causa: 'Acidose láctica', etapas: ['hipoperfusão ou disfunção mitocondrial', 'produção de lactato', 'ânion gap ↑ e bicarbonato ↓ proporcionalmente', 'Δ/Δ próximo de 1'], nota: 'A causa mais comum de ânion gap alto em ambiente hospitalar.' },
            { causa: 'Cetoacidose diabética', etapas: ['deficiência de insulina', 'cetogênese hepática', 'ânion gap ↑', 'perda urinária de cetoânions gera acidose hiperclorêmica residual', 'Δ/Δ frequentemente > 1'], nota: 'Explica por que o bicarbonato demora a normalizar depois de o ânion gap fechar.' },
            { causa: 'Acidose de ânion gap alto mascarada pela hipoalbuminemia', etapas: ['paciente crítico com albumina de 2,0 g/dL', 'ânion gap medido aparentemente normal em 12', 'ânion gap corrigido em 17 — francamente alto', 'acidose orgânica identificada'], nota: 'É a razão de a correção pela albumina ser obrigatória em terapia intensiva.' },
            { causa: 'Intoxicação por salicilato, metanol ou etilenoglicol', etapas: ['ácidos orgânicos exógenos ou seus metabólitos', 'ânion gap ↑ com gap osmolar variável conforme o tempo', 'necessidade de antídoto ou diálise'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Ânion gap baixo é raro e quase sempre significa hipoalbuminemia — ou, ocasionalmente, paraproteína catiônica ou intoxicação por lítio ou brometo.',
      mecanismos: [
        {
          titulo: 'Redução dos ânions não medidos ou aumento de cátions não medidos',
          explicacao: 'Menos albumina significa menos ânions não medidos; cátions não medidos em excesso reduzem a diferença calculada.',
          exemplos: [
            { causa: 'Hipoalbuminemia', etapas: ['perda do principal ânion não medido', 'ânion gap medido baixo', 'necessidade de correção antes de qualquer interpretação'] },
            { causa: 'Mieloma com paraproteína IgG catiônica', etapas: ['cátions não medidos em excesso', 'ânion gap reduzido, por vezes próximo de zero'], nota: 'Ânion gap muito baixo sem hipoalbuminemia deve levantar a hipótese de gamopatia.' },
            { causa: 'Intoxicação por brometo ou lítio', etapas: ['halogenetos interferem na medida do cloro', 'cloro falsamente elevado', 'ânion gap artificialmente reduzido ou negativo'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A análise ácido-básica completa', ids: ['ph', 'bicarbonato', 'paco2', 'anion-gap', 'lactato'], leitura: 'A ordem importa: pH, distúrbio primário, compensação esperada, ânion gap corrigido, delta-delta. Pular etapas esconde distúrbios.' },
      { titulo: 'Quando o gap é inexplicado', ids: ['osmolalidade-serica', 'beta-hidroxibutirato'], leitura: 'Ânion gap alto com lactato e cetonas normais deve levar ao gap osmolar e à pesquisa de intoxicação.' },
    ],
    advertencia:
      'Nunca interprete o ânion gap sem corrigi-lo pela albumina em paciente hospitalizado: a hipoalbuminemia mascara acidoses orgânicas clinicamente relevantes.',
    utilidade: ['diagnostico'],
    estudarTambem: ['anion-gap', 'bicarbonato', 'lactato', 'albumina'],
  },

  {
    id: 'gasometria-venosa',
    nome: 'Gasometria venosa e saturação venosa central',
    sigla: 'GV / SvcO₂',
    sinonimos: ['gasometria venosa', 'gaso venosa', 'svco2', 'saturacao venosa central', 'delta pco2', 'gap de co2'],
    grupo: 'gasometria',
    sistemas: ['respiratorio', 'cardiovascular', 'metabolico'],
    material: 'Sangue venoso periférico ou de cateter venoso central',
    unidade: 'mmHg, % e mEq/L',
    referencias: [
      { rotulo: 'pH venoso', texto: '0,03 a 0,05 unidades menor que o arterial', unidade: '' },
      { rotulo: 'pCO₂ venosa', texto: '4 a 6 mmHg maior que a arterial', unidade: 'mmHg' },
      { rotulo: 'Bicarbonato venoso', texto: 'Praticamente idêntico ao arterial', unidade: 'mEq/L' },
      { rotulo: 'Saturação venosa central (SvcO₂)', minimo: 70, maximo: 75, unidade: '%' },
      { rotulo: 'Delta pCO₂ (venoso − arterial)', texto: '< 6', unidade: 'mmHg', observacao: 'Acima de 6 sugere baixo débito cardíaco com fluxo insuficiente para remover CO₂.' },
    ],
    resumo:
      'A gasometria venosa responde quase tudo o que a arterial responde, exceto oxigenação — e a saturação venosa central mede algo que a arterial não mede: se a oferta de oxigênio está atendendo ao consumo.',
    entenda:
      'A punção arterial é dolorosa, tem complicações e frequentemente é evitável. Para avaliar equilíbrio ácido-básico — pH, bicarbonato, ânion gap, lactato —, a gasometria venosa é adequada, com diferenças previsíveis e pequenas em relação à arterial. O que a venosa não substitui é a avaliação da oxigenação: pO₂ venosa não informa sobre troca gasosa pulmonar, e para isso a arterial (ou a oximetria de pulso, quando suficiente) continua necessária.',
    aprofundar: [
      'A saturação venosa central mede o oxigênio que **sobrou** depois de os tecidos consumirem o que precisavam. Ela cai quando a oferta é insuficiente ou o consumo é excessivo: baixo débito cardíaco, anemia, hipoxemia, ou aumento da demanda metabólica. É, portanto, um marcador global de adequação entre oferta e consumo — mais informativo, nesse aspecto, que a pressão arterial.',
      'Uma SvcO₂ alta, acima de 80%, não é boa notícia: significa que os tecidos não estão extraindo oxigênio. Isso ocorre no choque séptico com disfunção mitocondrial e shunt microcirculatório, na intoxicação por cianeto e na hipotermia. Um paciente com lactato alto e SvcO₂ alta tem um problema de utilização celular, não de entrega — e mais volume ou mais hemácias não resolverão.',
      'O delta pCO₂ — a diferença entre a pCO₂ venosa central e a arterial — complementa a SvcO₂ com uma informação de fluxo. O CO₂ é muito mais difusível que o oxigênio, e sua remoção depende principalmente do fluxo sanguíneo. Um delta acima de 6 mmHg indica que o fluxo está insuficiente para lavar o CO₂ produzido, mesmo que a SvcO₂ pareça aceitável. É um marcador sensível de baixo débito.',
      'Uma nota técnica que muda o resultado: a gasometria venosa colhida com garrote prolongado, com o paciente contraindo a mão, ou de um membro isquêmico, reflete o metabolismo local e não o sistêmico — o pH será falsamente baixo e o lactato falsamente alto. E a amostra de cateter venoso central deve ser colhida após desprezar o volume do dispositivo, sob risco de diluição por infusão em curso.',
    ],
    fisiologia: {
      oQueE: 'Análise de pH, gases e eletrólitos em sangue venoso; a saturação venosa central reflete a extração tecidual de oxigênio.',
      origem: 'Sangue de retorno de veia cava superior (cateter central) ou de veia periférica.',
      funcao: 'Avaliar equilíbrio ácido-básico e a relação entre oferta e consumo de oxigênio.',
      orgaosEnvolvidos: ['Coração', 'Pulmão', 'Microcirculação'],
      percurso: [
        'Oxigênio entregue pelo débito cardíaco e pela hemoglobina',
        'extração tecidual conforme demanda metabólica',
        'sangue venoso carrega o oxigênio residual',
        'SvcO₂ baixa: oferta insuficiente ou consumo alto',
        'SvcO₂ alta com lactato alto: falha de utilização celular',
      ],
    },
    aumento: {
      resumo: 'SvcO₂ alta indica extração tecidual reduzida — disfunção mitocondrial, shunt microcirculatório ou demanda metabólica muito baixa.',
      mecanismos: [
        {
          titulo: 'Falha de extração ou consumo reduzido',
          explicacao: 'Quando a célula não consegue usar o oxigênio entregue, ele retorna pelo sangue venoso, elevando a saturação venosa.',
          exemplos: [
            { causa: 'Choque séptico com disfunção mitocondrial', etapas: ['shunt microcirculatório e falha de utilização celular', 'SvcO₂ > 80% com lactato elevado', 'aumentar oferta de oxigênio não corrige'], nota: 'É a situação em que otimizar débito e hemoglobina não melhora o desfecho.' },
            { causa: 'Intoxicação por cianeto', etapas: ['bloqueio da citocromo-oxidase', 'células incapazes de usar oxigênio', 'SvcO₂ muito alta com acidose láctica grave'], nota: 'Acidose láctica grave com saturação venosa alta em contexto de incêndio ou exposição química sugere cianeto.' },
            { causa: 'Hipotermia e sedação profunda', etapas: ['consumo metabólico reduzido', 'menor extração de oxigênio', 'SvcO₂ elevada sem doença'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'SvcO₂ baixa indica oferta insuficiente ou consumo aumentado — baixo débito, anemia, hipoxemia ou hipermetabolismo.',
      mecanismos: [
        {
          titulo: 'Desequilíbrio entre oferta e consumo',
          explicacao: 'Quando a entrega de oxigênio não acompanha a demanda, os tecidos extraem mais, e o sangue venoso retorna mais dessaturado.',
          exemplos: [
            { causa: 'Choque cardiogênico ou hipovolêmico', etapas: ['débito cardíaco reduzido', 'extração tecidual aumentada como compensação', 'SvcO₂ < 70% e delta pCO₂ > 6 mmHg', 'lactato em ascensão'], nota: 'A combinação de SvcO₂ baixa com delta pCO₂ alto aponta especificamente para fluxo insuficiente.' },
            { causa: 'Anemia grave ou hipoxemia', etapas: ['conteúdo arterial de oxigênio reduzido', 'compensação por extração aumentada', 'SvcO₂ ↓ com débito preservado'] },
            { causa: 'Hipermetabolismo (febre alta, agitação, trabalho respiratório intenso)', etapas: ['consumo de oxigênio aumentado', 'extração maior', 'SvcO₂ ↓ com oferta normal'], nota: 'Sedação e ventilação mecânica reduzem o consumo e melhoram a SvcO₂ sem alterar a oferta.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A avaliação da perfusão', ids: ['lactato', 'ph', 'bicarbonato', 'hemoglobina'], leitura: 'Lactato alto com SvcO₂ baixa é problema de entrega; lactato alto com SvcO₂ alta é problema de utilização. A conduta é oposta.' },
      { titulo: 'Quando a venosa basta', ids: ['paco2', 'pao2', 'anion-gap-corrigido'], leitura: 'Para ácido-base, a venosa é suficiente. Para oxigenação, só a arterial responde.' },
    ],
    advertencia:
      'A gasometria venosa não avalia oxigenação. Amostra colhida com garrote prolongado ou de membro isquêmico reflete metabolismo local e não sistêmico.',
    interferentes: {
      preAnalitico: ['Garrote prolongado e contração muscular durante a coleta reduzem o pH e elevam o lactato localmente.', 'Bolhas de ar na seringa alteram pO₂ e pCO₂.', 'Demora no processamento sem refrigeração permite consumo de oxigênio e produção de CO₂ pelas células da amostra.'],
    },
    utilidade: ['diagnostico', 'acompanhamento', 'prognostico'],
    estudarTambem: ['lactato', 'ph', 'paco2', 'bicarbonato'],
  },

  {
    id: 'ttkg',
    nome: 'Gradiente transtubular de potássio e osmolalidade urinária no distúrbio do sódio',
    sigla: 'TTKG',
    sinonimos: ['ttkg', 'gradiente transtubular de potassio', 'gradiente transtubular', 'agua livre'],
    grupo: 'eletrolitos',
    sistemas: ['renal', 'metabolico', 'endocrino'],
    material: 'Urina e sangue simultâneos',
    unidade: 'razão',
    referencias: [
      { rotulo: 'TTKG na hipercalemia — resposta adequada', texto: '> 7', unidade: 'razão' },
      { rotulo: 'TTKG na hipercalemia — hipoaldosteronismo', texto: '< 5', unidade: 'razão' },
      { rotulo: 'TTKG na hipocalemia — perda extrarrenal', texto: '< 3', unidade: 'razão' },
      { rotulo: 'Condição de validade', texto: 'Osmolalidade urinária maior que a plasmática e sódio urinário > 25 mEq/L', unidade: '' },
    ],
    resumo:
      'Estima a atividade da aldosterona no ducto coletor. Diante de uma hipercalemia, responde se o rim está tentando excretar potássio e não consegue, ou se simplesmente não está sendo instruído a fazê-lo.',
    entenda:
      'A excreção de potássio depende quase inteiramente do ducto coletor sob ação da aldosterona. O TTKG compara a concentração de potássio no fluido do ducto coletor com a do plasma, corrigindo pela reabsorção de água que ocorre depois — daí a divisão pelas osmolalidades. Um valor alto significa que a aldosterona está agindo; um valor baixo, na presença de hipercalemia, significa que ela não está.',
    aprofundar: [
      'A aplicação mais útil é na hipercalemia sem causa evidente. TTKG abaixo de 5 nesse contexto aponta para hipoaldosteronismo — que pode ser hiporreninêmico (o clássico "acidose tubular renal tipo 4" do diabético), por insuficiência adrenal, ou farmacológico: inibidores da ECA, bloqueadores do receptor de angiotensina, espironolactona, anti-inflamatórios, heparina e trimetoprima todos reduzem a ação da aldosterona por mecanismos diferentes. A revisão da prescrição resolve a maioria dos casos.',
      'As condições de validade não são detalhes: o cálculo pressupõe que a osmolalidade urinária seja maior que a plasmática (senão não houve reabsorção de água a corrigir) e que o sódio urinário seja suficiente para permitir a troca no ducto coletor (abaixo de 25 mEq/L não há sódio para reabsorver em troca de potássio). Fora dessas condições, o resultado não significa nada.',
      'É importante reconhecer que o TTKG vem sendo criticado justamente por essas premissas — a reciclagem de ureia no ducto coletor medular torna a correção pela osmolalidade menos exata do que se supunha. Muitos nefrologistas preferem hoje a relação potássio/creatinina urinária, mais simples e sem essas premissas. Ainda assim, o raciocínio que o TTKG ensina — perguntar se o rim está respondendo ao estímulo — permanece integralmente válido.',
      'Na hipocalemia, o mesmo raciocínio se aplica invertido: TTKG baixo significa que o rim está poupando potássio adequadamente, e a perda é digestiva; TTKG alto significa perda renal, e a pressão arterial e o estado ácido-básico apontam a causa.',
    ],
    fisiologia: {
      oQueE: 'Estimativa da relação entre a concentração de potássio no lúmen do ducto coletor cortical e a plasmática, corrigida pela reabsorção de água.',
      origem: 'Cálculo a partir de potássio e osmolalidade em sangue e urina.',
      funcao: 'Avaliar a atividade mineralocorticoide no néfron distal.',
      orgaosEnvolvidos: ['Ducto coletor cortical', 'Adrenal'],
      percurso: [
        'Aldosterona age na célula principal do ducto coletor',
        'reabsorção de sódio cria gradiente eletronegativo luminal',
        'secreção de potássio para o lúmen',
        'reabsorção subsequente de água concentra o potássio urinário',
        'correção pelas osmolalidades estima a concentração no ducto',
      ],
    },
    aumento: {
      resumo: 'Atividade mineralocorticoide preservada ou aumentada — resposta adequada à hipercalemia, ou perda renal de potássio na hipocalemia.',
      mecanismos: [
        {
          titulo: 'Estímulo mineralocorticoide ativo',
          explicacao: 'A aldosterona promove secreção de potássio no ducto coletor, elevando o gradiente calculado.',
          exemplos: [
            { causa: 'Hipercalemia com resposta renal adequada', etapas: ['potássio sérico ↑', 'aldosterona estimulada', 'TTKG > 7', 'a causa da hipercalemia é aporte, redistribuição ou filtração muito reduzida — não falha de aldosterona'] },
            { causa: 'Hipocalemia com TTKG > 4', etapas: ['perda renal de potássio', 'hiperaldosteronismo, diurético, Bartter ou Gitelman', 'a pressão arterial separa: alta sugere hiperaldosteronismo; normal sugere tubulopatia ou diurético'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hipoaldosteronismo ou resistência à aldosterona na hipercalemia; conservação renal adequada na hipocalemia.',
      mecanismos: [
        {
          titulo: 'Ação mineralocorticoide insuficiente',
          explicacao: 'Sem aldosterona eficaz, o ducto coletor não secreta potássio, e ele se acumula no plasma.',
          exemplos: [
            { causa: 'Hipoaldosteronismo hiporreninêmico', etapas: ['nefropatia diabética com lesão do aparelho justaglomerular', 'renina e aldosterona baixas', 'hipercalemia com acidose metabólica hiperclorêmica', 'TTKG < 5'], nota: 'É a acidose tubular renal tipo 4, muito frequente e frequentemente atribuída erroneamente à insuficiência renal.' },
            { causa: 'Fármacos que bloqueiam o eixo', etapas: ['inibidor da ECA, bloqueador do receptor de angiotensina, espironolactona, trimetoprima, heparina, anti-inflamatório', 'redução da produção ou da ação da aldosterona', 'hipercalemia com TTKG baixo'], nota: 'Revisar a prescrição resolve a maioria dos casos.' },
            { causa: 'Insuficiência adrenal primária', etapas: ['deficiência de aldosterona e cortisol', 'hipercalemia com hiponatremia', 'TTKG baixo', 'cortisol e ACTH definem o diagnóstico'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A investigação da hipercalemia', ids: ['potassio', 'aldosterona', 'cortisol', 'bicarbonato'], leitura: 'Hipercalemia com acidose hiperclorêmica e TTKG baixo em diabético é acidose tubular renal tipo 4 até prova em contrário.' },
      { titulo: 'A investigação da hipocalemia', ids: ['eletrolitos-urinarios', 'magnesio', 'aldosterona'], leitura: 'Potássio urinário e pressão arterial separam as causas. Hipomagnesemia perpetua a hipocalemia e precisa ser corrigida junto.' },
    ],
    advertencia:
      'Cálculo inválido se a osmolalidade urinária for menor que a plasmática ou se o sódio urinário for inferior a 25 mEq/L. A relação potássio/creatinina urinária é uma alternativa mais simples e sem essas premissas.',
    utilidade: ['diagnostico'],
    estudarTambem: ['potassio', 'aldosterona', 'eletrolitos-urinarios', 'osmolalidade-urinaria'],
  },
]
