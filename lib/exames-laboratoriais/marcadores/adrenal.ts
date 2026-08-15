import type { Marcador } from '../tipos'

/**
 * Adrenal e neuroendócrino — exames em que o preparo vale mais que o método.
 *
 * Poucos setores da medicina laboratorial punem tanto o descuido pré-analítico
 * quanto este. O cortisol tem ritmo circadiano: colhido à tarde, um valor
 * "normal" pode significar doença. A aldosterona e a renina dependem de
 * postura, sódio da dieta e de praticamente toda medicação anti-hipertensiva.
 * As metanefrinas sobem com estresse, cafeína, paracetamol e a própria punção
 * — o paciente precisa estar deitado e em repouso por vinte minutos antes de a
 * agulha entrar.
 *
 * A consequência prática é que a maioria dos falsos-positivos deste arquivo
 * não vem do laboratório: vem de exames colhidos sem preparo e interpretados
 * como se tivessem sido. Antes de investigar um resultado alterado aqui, vale
 * perguntar como ele foi colhido.
 */
export const marcadores: Marcador[] = [
  {
    id: 'cortisol-salivar',
    nome: 'Cortisol salivar noturno, cortisol livre urinário e teste de supressão com dexametasona',
    sigla: 'Rastreio de Cushing',
    sinonimos: ['cortisol salivar', 'cortisol livre urinario', 'teste de supressao com dexametasona', 'cushing rastreio', 'cortisol 24h'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'metabolico'],
    material: 'Saliva (23h), urina de 24 horas, soro após dexametasona',
    unidade: 'µg/dL, µg/24h',
    referencias: [
      { rotulo: 'Cortisol salivar às 23h', texto: '< 0,15 (varia muito conforme o método)', unidade: 'µg/dL' },
      { rotulo: 'Cortisol livre urinário de 24h', texto: 'Abaixo do limite superior do método', unidade: 'µg/24h', observacao: 'Valores acima de três vezes o limite superior são mais específicos.' },
      { rotulo: 'Supressão com 1 mg de dexametasona às 23h', texto: 'Cortisol sérico às 8h < 1,8', unidade: 'µg/dL' },
    ],
    resumo:
      'Os três testes de rastreio da síndrome de Cushing. Cada um mede uma propriedade diferente do eixo: a perda do ritmo circadiano, a produção total diária e a resistência à retroalimentação negativa.',
    entenda:
      'O cortisol sérico isolado não serve para rastrear Cushing, porque um valor alto pode ser apenas o pico matinal ou estresse da punção. O que caracteriza a síndrome é a perda dos mecanismos de controle: o cortisol deveria cair a valores mínimos à meia-noite (o salivar noturno testa isso), a produção total diária deveria ser limitada (o urinário testa isso), e uma dose de corticoide deveria desligar a hipófise (a dexametasona testa isso). Dois testes alterados, de metodologias diferentes, são o que estabelece a suspeita.',
    aprofundar: [
      'O pseudo-Cushing é o principal problema do rastreio, e é comum: depressão maior, alcoolismo, obesidade grave, diabetes descompensado, apneia do sono e estresse crônico ativam o eixo e produzem resultados alterados sem que haja tumor. A distinção depende do quadro clínico — estrias violáceas largas, fraqueza proximal, equimoses fáceis e fácies pletórica pesam muito mais que qualquer valor isolado — e, quando necessário, de testes de segunda linha.',
      'A dexametasona é escolhida por não ser detectada pelos ensaios de cortisol: ela suprime a hipófise sem interferir na dosagem. Mas seu metabolismo é hepático, via CYP3A4, e aí está uma armadilha frequente: fenitoína, carbamazepina, rifampicina e outros indutores aceleram sua depuração e produzem falta de supressão sem doença. Na direção contrária, o estrogênio eleva a globulina ligadora de cortisol e o cortisol total, gerando falha de supressão aparente — em usuárias de contraceptivo, o exame deve ser feito após seis semanas de suspensão.',
      'A ordem da investigação importa: primeiro confirma-se que há hipercortisolismo (os três testes de rastreio), e só então se determina a causa dosando o ACTH. ACTH suprimido indica origem adrenal; ACTH normal ou alto indica doença de Cushing hipofisária ou secreção ectópica. Inverter essa ordem — pedir ACTH antes de confirmar o hipercortisolismo — gera resultados ininterpretáveis.',
      'O cortisol salivar tem uma vantagem prática notável: mede a fração livre, não sofre influência da globulina ligadora e pode ser colhido em casa, no horário correto, sem o estresse de uma punção hospitalar. É provavelmente o teste de rastreio mais adequado à realidade ambulatorial.',
    ],
    fisiologia: {
      oQueE: 'Testes que avaliam, respectivamente, o ritmo circadiano, a produção integrada de 24 horas e a integridade da retroalimentação negativa do eixo hipotálamo-hipófise-adrenal.',
      origem: 'Córtex adrenal, zona fasciculada, sob comando do ACTH.',
      funcao: 'O cortisol regula gliconeogênese, resposta ao estresse, imunomodulação e tônus vascular.',
      orgaosEnvolvidos: ['Hipotálamo', 'Hipófise', 'Córtex adrenal'],
      percurso: [
        'CRH hipotalâmico com ritmo circadiano',
        'ACTH hipofisário em pulsos, com pico matinal',
        'cortisol adrenal segue o mesmo ritmo',
        'retroalimentação negativa sobre hipotálamo e hipófise',
        'no Cushing: ritmo perdido, produção aumentada, retroalimentação ineficaz',
      ],
    },
    aumento: {
      resumo: 'Síndrome de Cushing endógena, corticoide exógeno ou pseudo-Cushing por ativação fisiológica do eixo.',
      mecanismos: [
        {
          titulo: 'Produção autônoma',
          explicacao: 'Um tumor produz cortisol ou ACTH independentemente do controle hipotalâmico, abolindo o ritmo e a supressibilidade.',
          exemplos: [
            { causa: 'Doença de Cushing (adenoma hipofisário)', etapas: ['ACTH secretado autonomamente', 'hiperplasia adrenal bilateral', 'cortisol elevado com ACTH normal ou alto', 'supressão apenas com dose alta de dexametasona'] },
            { causa: 'Adenoma ou carcinoma adrenal', etapas: ['produção autônoma de cortisol', 'ACTH suprimido por retroalimentação', 'atrofia da adrenal contralateral'], nota: 'Por isso a suspensão abrupta após adrenalectomia causa insuficiência adrenal.' },
            { causa: 'Secreção ectópica de ACTH', etapas: ['tumor neuroendócrino, frequentemente pulmonar', 'ACTH muito elevado', 'hipocalemia e alcalose metabólica acentuadas', 'instalação rápida com hiperpigmentação'], nota: 'Hipocalemia grave com hipertensão e hiperglicemia de início rápido sugere origem ectópica.' },
          ],
        },
        {
          titulo: 'Ativação fisiológica do eixo — pseudo-Cushing',
          explicacao: 'Estados de estresse crônico elevam o cortisol de forma real, mas por mecanismo regulado, o que dificulta a distinção pelos testes de rastreio.',
          exemplos: [
            { causa: 'Depressão maior, alcoolismo, obesidade grave, apneia do sono, diabetes descompensado', etapas: ['ativação crônica do eixo', 'rastreio alterado sem tumor', 'ausência dos sinais específicos de Cushing'], nota: 'Estrias violáceas largas, fraqueza proximal e equimoses fáceis são o que discrimina — não o número.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Insuficiência adrenal primária ou secundária, ou supressão do eixo por corticoide exógeno.',
      mecanismos: [
        {
          titulo: 'Falência da produção ou do estímulo',
          explicacao: 'A destruição do córtex adrenal ou a ausência de ACTH reduzem o cortisol; o corticoide exógeno prolongado suprime o eixo inteiro.',
          exemplos: [
            { causa: 'Insuficiência adrenal primária (Addison)', etapas: ['destruição autoimune, tuberculosa ou hemorrágica do córtex', 'cortisol ↓ com ACTH ↑↑', 'hiperpigmentação, hiponatremia, hipercalemia'], nota: 'A hipercalemia distingue da forma secundária: falta também aldosterona.' },
            { causa: 'Supressão por corticoide exógeno', etapas: ['uso prolongado de corticoide', 'CRH e ACTH suprimidos', 'atrofia adrenal', 'insuficiência ao suspender abruptamente'], nota: 'É a causa mais comum de insuficiência adrenal na prática.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Depois de confirmar o hipercortisolismo', ids: ['acth', 'cortisol', 'potassio'], leitura: 'O ACTH define a origem: suprimido é adrenal, alto é hipofisário ou ectópico. Hipocalemia acentuada sugere ectópico.' },
      { titulo: 'As consequências metabólicas', ids: ['glicemia-jejum', 'hba1c', 'triglicerideos'], leitura: 'Hiperglicemia, dislipidemia e hipertensão são a repercussão sistêmica que motiva o tratamento.' },
    ],
    advertencia:
      'Nenhum teste de rastreio isolado estabelece o diagnóstico: são necessários pelo menos dois testes alterados de metodologias diferentes, em paciente com fenótipo clínico compatível.',
    interferentes: {
      medicamentos: ['Indutores do CYP3A4 (fenitoína, carbamazepina, rifampicina) aceleram o metabolismo da dexametasona e causam falha de supressão sem doença.', 'Estrogênio eleva a globulina ligadora e o cortisol total.'],
      preAnalitico: ['Coleta salivar fora do horário ou após escovação com sangramento gengival invalida o resultado.', 'Coleta de urina de 24 horas incompleta subestima o cortisol livre.'],
    },
    utilidade: ['triagem', 'diagnostico'],
    estudarTambem: ['cortisol', 'acth', 'potassio'],
  },

  {
    id: 'dhea-s',
    nome: 'Sulfato de deidroepiandrosterona e androstenediona',
    sigla: 'DHEA-S',
    sinonimos: ['dhea-s', 'dheas', 'sulfato de deidroepiandrosterona', 'androstenediona', 'androgenios adrenais'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'metabolico'],
    material: 'Soro',
    unidade: 'µg/dL e ng/dL',
    referencias: [
      { rotulo: 'DHEA-S — mulheres adultas', minimo: 35, maximo: 430, unidade: 'µg/dL', observacao: 'Declina progressivamente com a idade; a faixa precisa ser ajustada por década.' },
      { rotulo: 'DHEA-S — homens adultos', minimo: 80, maximo: 560, unidade: 'µg/dL' },
      { rotulo: 'DHEA-S sugestivo de tumor adrenal', texto: '> 700', unidade: 'µg/dL' },
      { rotulo: 'Androstenediona — mulheres', minimo: 30, maximo: 200, unidade: 'ng/dL' },
    ],
    resumo:
      'O androgênio quase exclusivamente adrenal. Numa mulher com hirsutismo, ele responde de onde vêm os androgênios: adrenal ou ovário.',
    entenda:
      'A sulfatação do DHEA ocorre principalmente na adrenal, e o DHEA-S tem meia-vida longa e sem pulsatilidade — o que o torna um marcador estável da produção androgênica adrenal, ao contrário da testosterona, que é predominantemente ovariana na mulher e varia ao longo do dia. Diante de hirsutismo, a combinação dos dois localiza a fonte: testosterona alta com DHEA-S normal aponta para o ovário; DHEA-S muito alto aponta para a adrenal.',
    aprofundar: [
      'A magnitude importa mais que a simples positividade. Elevações discretas de DHEA-S são comuns na síndrome dos ovários policísticos e não indicam tumor. Valores acima de 700 µg/dL, especialmente com instalação rápida do hirsutismo, virilização (clitoromegalia, engrossamento da voz, alopecia androgênica) e amenorreia, sugerem tumor adrenal produtor e exigem imagem.',
      'A hiperplasia adrenal congênita não clássica por deficiência de 21-hidroxilase é o principal diferencial da síndrome dos ovários policísticos e é frequentemente esquecida — ambas cursam com hirsutismo, irregularidade menstrual e infertilidade. O que as separa é a 17-hidroxiprogesterona basal colhida na fase folicular, entre 7 e 9 horas da manhã: valores acima de 200 ng/dL exigem teste de estímulo com ACTH.',
      'O DHEA-S declina de forma marcante com a idade — um valor de 200 µg/dL é normal aos 30 anos e alto aos 70. Interpretar sem a faixa ajustada por década produz erros nos dois sentidos. Não há, por outro lado, evidência que sustente a reposição de DHEA como terapia antienvelhecimento.',
    ],
    fisiologia: {
      oQueE: 'DHEA-S: forma sulfatada da deidroepiandrosterona, principal androgênio circulante em concentração. Androstenediona: precursor comum de testosterona e estrona.',
      origem: 'Zona reticular do córtex adrenal (DHEA-S quase exclusivamente); androstenediona tem origem adrenal e ovariana.',
      funcao: 'Precursores de andrógenos e estrógenos potentes na periferia.',
      meiaVida: 'DHEA-S: várias horas, sem pulsatilidade — daí sua estabilidade como marcador.',
      orgaosEnvolvidos: ['Adrenal', 'Ovário', 'Pele e tecido adiposo (conversão periférica)'],
      percurso: [
        'Colesterol convertido em pregnenolona na adrenal',
        'via da 17-hidroxilase gera DHEA',
        'sulfotransferase adrenal gera DHEA-S',
        'conversão periférica em testosterona e diidrotestosterona',
        'ação no folículo piloso e na glândula sebácea',
      ],
    },
    aumento: {
      resumo: 'Tumor adrenal, hiperplasia adrenal congênita, síndrome dos ovários policísticos ou Cushing ACTH-dependente.',
      mecanismos: [
        {
          titulo: 'Produção adrenal aumentada',
          explicacao: 'O estímulo pelo ACTH ou a autonomia tumoral elevam a produção da zona reticular.',
          exemplos: [
            { causa: 'Tumor adrenal produtor de androgênio', etapas: ['produção autônoma', 'DHEA-S > 700 µg/dL', 'virilização de instalação rápida', 'imagem adrenal indicada'] },
            { causa: 'Hiperplasia adrenal congênita não clássica', etapas: ['deficiência parcial de 21-hidroxilase', 'acúmulo de 17-hidroxiprogesterona', 'desvio para a via androgênica', 'hirsutismo, acne e irregularidade menstrual desde a adolescência'], nota: 'Principal diferencial da síndrome dos ovários policísticos.' },
            { causa: 'Síndrome dos ovários policísticos', etapas: ['DHEA-S discretamente elevado em parte das pacientes', 'testosterona total e livre elevadas', 'padrão predominantemente ovariano'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Insuficiência adrenal, hipopituitarismo, envelhecimento fisiológico ou uso de corticoide.',
      mecanismos: [
        {
          titulo: 'Redução do estímulo ou da massa adrenal',
          explicacao: 'Sem ACTH ou sem córtex funcionante, a zona reticular não produz.',
          exemplos: [
            { causa: 'Insuficiência adrenal e hipopituitarismo', etapas: ['produção adrenal reduzida', 'DHEA-S ↓', 'em mulheres, perda de pelos axilares e pubianos e queda de libido'], nota: 'Nas mulheres a adrenal é a principal fonte de androgênio — sua falência tem sintomas próprios.' },
            { causa: 'Envelhecimento e corticoterapia', etapas: ['declínio fisiológico da zona reticular ou supressão do ACTH', 'DHEA-S ↓ sem doença primária da adrenal'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A investigação do hirsutismo', ids: ['testosterona-total', 'shbg', '17-oh-progesterona', 'prolactina'], leitura: 'Testosterona aponta o ovário, DHEA-S aponta a adrenal, a 17-OH-progesterona rastreia hiperplasia congênita e a prolactina exclui hiperprolactinemia.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['testosterona-total', '17-oh-progesterona', 'shbg'],
  },

  {
    id: '17-oh-progesterona',
    nome: '17-hidroxiprogesterona e 11-desoxicortisol',
    sigla: '17-OHP',
    sinonimos: ['17 oh progesterona', '17-ohp', '17 hidroxiprogesterona', '11 desoxicortisol', 'hiperplasia adrenal congenita', 'teste do pezinho'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'metabolico'],
    material: 'Soro, colhido pela manhã e na fase folicular em mulheres',
    unidade: 'ng/dL',
    referencias: [
      { rotulo: 'Adultos — fase folicular, manhã', texto: '< 200', unidade: 'ng/dL' },
      { rotulo: 'Zona indeterminada', texto: '200 a 1.000 — exige teste de estímulo com ACTH', unidade: 'ng/dL' },
      { rotulo: 'Diagnóstico de forma clássica', texto: '> 1.000 (frequentemente muito acima)', unidade: 'ng/dL' },
    ],
    resumo:
      'O metabólito que se acumula quando falta a 21-hidroxilase. É o exame do rastreio neonatal da hiperplasia adrenal congênita — uma doença que mata recém-nascidos por crise perdedora de sal quando não diagnosticada.',
    entenda:
      'A 21-hidroxilase converte a 17-hidroxiprogesterona em 11-desoxicortisol, a caminho do cortisol. Sem ela, o substrato se acumula e é desviado para a via androgênica. As consequências são três e simultâneas: falta cortisol, falta aldosterona (na forma clássica perdedora de sal) e sobram androgênios. Daí o recém-nascido com genitália ambígua, hiponatremia, hipercalemia e choque na segunda semana de vida — quadro que o rastreio neonatal existe para antecipar.',
    aprofundar: [
      'O rastreio neonatal tem particularidades importantes: prematuridade e estresse perinatal elevam falsamente a 17-OHP, gerando reconvocações desnecessárias, e por isso os pontos de corte são ajustados por peso ao nascer e idade gestacional. Um resultado alterado no rastreio exige confirmação sérica antes de qualquer conduta — mas, diante de um recém-nascido com desidratação, hiponatremia e hipercalemia, o tratamento não deve aguardar.',
      'A forma não clássica se manifesta apenas na adolescência ou na vida adulta, com hirsutismo, acne, irregularidade menstrual e infertilidade — indistinguível clinicamente da síndrome dos ovários policísticos. O rastreio é a 17-OHP basal matinal na fase folicular; valores na zona indeterminada exigem teste de estímulo com ACTH, que amplifica o acúmulo do substrato e revela o bloqueio parcial.',
      'O 11-desoxicortisol identifica um bloqueio diferente: a deficiência de 11-beta-hidroxilase, segunda causa mais comum de hiperplasia adrenal congênita. Ela também causa virilização, mas com **hipertensão** e hipocalemia — porque o desoxicorticosterona acumulado tem atividade mineralocorticoide. É o oposto da perda de sal da deficiência de 21-hidroxilase, e a pressão arterial é o que separa as duas na beira do leito.',
      'A 17-OHP varia com o ciclo menstrual — o corpo lúteo a produz — e tem ritmo circadiano. Colher na fase lútea ou à tarde produz falso-positivo, e essa é a causa mais comum de investigação desnecessária em mulheres com hirsutismo.',
    ],
    fisiologia: {
      oQueE: 'Precursores da esteroidogênese adrenal que se acumulam a montante de bloqueios enzimáticos.',
      origem: 'Córtex adrenal; também corpo lúteo, na fase lútea do ciclo.',
      funcao: 'Intermediários da síntese de cortisol.',
      orgaosEnvolvidos: ['Adrenal', 'Ovário'],
      percurso: [
        'Colesterol → pregnenolona → 17-hidroxiprogesterona',
        '21-hidroxilase converte em 11-desoxicortisol',
        '11-beta-hidroxilase converte em cortisol',
        'bloqueio enzimático acumula o substrato imediatamente anterior',
        'desvio do excesso para a via androgênica',
      ],
    },
    aumento: {
      resumo: 'Bloqueio enzimático da esteroidogênese — ou coleta em fase lútea, à tarde, ou em recém-nascido prematuro.',
      mecanismos: [
        {
          titulo: 'Bloqueio da 21-hidroxilase',
          explicacao: 'Sem a enzima, o cortisol não é produzido, o ACTH sobe sem freio, a adrenal hiperplasia e o substrato acumulado é desviado para androgênios.',
          exemplos: [
            { causa: 'Forma clássica perdedora de sal', etapas: ['deficiência quase completa da enzima', 'cortisol e aldosterona ↓', 'androgênios ↑ com virilização da genitália feminina', 'hiponatremia, hipercalemia e choque na segunda semana de vida'], nota: 'Emergência neonatal — hidrocortisona e fluidos não devem aguardar confirmação.' },
            { causa: 'Forma não clássica', etapas: ['deficiência parcial', '17-OHP basal entre 200 e 1.000 ng/dL', 'teste de estímulo com ACTH confirma', 'hirsutismo e irregularidade menstrual na adolescência'] },
          ],
        },
        {
          titulo: 'Bloqueio da 11-beta-hidroxilase',
          explicacao: 'O desoxicorticosterona acumulado tem atividade mineralocorticoide, produzindo hipertensão em vez de perda de sal.',
          exemplos: [
            { causa: 'Deficiência de 11-beta-hidroxilase', etapas: ['11-desoxicortisol e desoxicorticosterona ↑', 'virilização com hipertensão e hipocalemia', 'quadro oposto ao da deficiência de 21-hidroxilase'] },
          ],
        },
        {
          titulo: 'Elevação sem doença',
          explicacao: 'Fontes fisiológicas e condições perinatais elevam o marcador transitoriamente.',
          exemplos: [
            { causa: 'Coleta na fase lútea ou à tarde', etapas: ['produção pelo corpo lúteo e ritmo circadiano', '17-OHP falsamente elevada', 'repetição na fase folicular pela manhã resolve'] },
            { causa: 'Prematuridade e estresse perinatal', etapas: ['elevação fisiológica no rastreio neonatal', 'necessidade de pontos de corte ajustados por peso e idade gestacional'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O quadro completo da crise adrenal neonatal', ids: ['sodio', 'potassio', 'glicemia-jejum', 'cortisol'], leitura: 'Hiponatremia com hipercalemia e hipoglicemia em recém-nascido é crise adrenal até prova em contrário.' },
      { titulo: 'Na investigação do hirsutismo', ids: ['testosterona-total', 'dhea-s'], leitura: 'A 17-OHP é o que separa hiperplasia adrenal congênita não clássica da síndrome dos ovários policísticos.' },
    ],
    advertencia:
      'Em recém-nascido com desidratação, hiponatremia e hipercalemia, o tratamento com hidrocortisona e fluidos não deve aguardar confirmação laboratorial.',
    utilidade: ['triagem', 'diagnostico'],
    estudarTambem: ['cortisol', 'dhea-s', 'aldosterona', 'potassio'],
  },

  {
    id: 'renina-aldosterona',
    nome: 'Renina direta e relação aldosterona/renina',
    sigla: 'ARR',
    sinonimos: ['renina direta', 'atividade de renina plasmatica', 'arr', 'relacao aldosterona renina', 'hiperaldosteronismo primario', 'conn'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'cardiovascular', 'renal'],
    material: 'Plasma, colhido pela manhã após o paciente estar sentado ou em pé por 2 horas',
    unidade: 'ng/dL por ng/mL/h (ou por µUI/mL)',
    referencias: [
      { rotulo: 'Relação aldosterona/renina — rastreio positivo', texto: '> 30 (com aldosterona > 15 ng/dL)', unidade: 'razão', observacao: 'Os pontos de corte dependem da unidade e do método de renina — verificar sempre o padrão do laboratório.' },
      { rotulo: 'Renina direta — faixa habitual', texto: 'Dependente do método, da postura e do sódio da dieta', unidade: 'µUI/mL' },
    ],
    resumo:
      'O rastreio do hiperaldosteronismo primário — a causa secundária mais comum de hipertensão, presente em cerca de 5 a 10% dos hipertensos e em proporção bem maior entre os resistentes.',
    entenda:
      'A lógica é comparar o hormônio com seu estímulo. Normalmente, a aldosterona só sobe quando a renina sobe. No hiperaldosteronismo primário, a adrenal produz aldosterona de forma autônoma; o excesso de sódio e volume suprime a renina, e a relação entre os dois dispara. É essa **dissociação** — aldosterona alta com renina suprimida — que caracteriza a doença, não o valor absoluto de nenhum dos dois.',
    aprofundar: [
      'A grande dificuldade prática é que quase toda medicação anti-hipertensiva interfere. Espironolactona e eplerenona precisam ser suspensas por quatro a seis semanas — elas são o interferente mais grave. Betabloqueadores reduzem a renina e elevam falsamente a relação. Inibidores da ECA, bloqueadores do receptor de angiotensina e diuréticos elevam a renina e podem produzir falso-negativo. Os fármacos mais neutros, quando é preciso manter tratamento, são o verapamil de liberação lenta, a hidralazina e a doxazosina.',
      'Um ponto que muda o rastreio populacional: nem todo paciente com hiperaldosteronismo primário tem hipocalemia. A maioria, na verdade, é normocalêmica — a hipocalemia aparece em uma minoria e sobretudo nos casos mais graves. Esperar pela hipocalemia para investigar é a razão pela qual essa condição é tão subdiagnosticada. As indicações de rastreio são hipertensão resistente, hipertensão com hipocalemia (espontânea ou induzida por diurético), incidentaloma adrenal, hipertensão de início precoce e história familiar de acidente vascular cerebral em idade jovem.',
      'Diagnosticar importa porque muda o desfecho, e não só a pressão. O excesso de aldosterona causa fibrose miocárdica, remodelamento vascular e lesão renal por mecanismos independentes da pressão arterial — pacientes com hiperaldosteronismo têm mais eventos cardiovasculares que hipertensos essenciais com a mesma pressão. O tratamento específico, cirúrgico ou com antagonista mineralocorticoide, reduz esse risco adicional.',
      'O rastreio positivo não é diagnóstico: exige teste confirmatório com sobrecarga de sódio ou de fludrocortisona, e depois cateterismo de veias adrenais para determinar se a produção é unilateral (adenoma, tratável cirurgicamente) ou bilateral (hiperplasia, tratada com medicação). A imagem isoladamente é insuficiente, porque incidentalomas não funcionantes são comuns.',
    ],
    fisiologia: {
      oQueE: 'Renina: enzima renal que inicia a cascata renina-angiotensina-aldosterona. Aldosterona: mineralocorticoide da zona glomerulosa.',
      origem: 'Aparelho justaglomerular renal (renina); zona glomerulosa adrenal (aldosterona).',
      funcao: 'Regular volume extracelular e pressão arterial pela reabsorção de sódio e excreção de potássio.',
      orgaosEnvolvidos: ['Rim', 'Adrenal', 'Pulmão (ECA)'],
      percurso: [
        'Queda da perfusão renal ou do sódio distal',
        'liberação de renina',
        'angiotensinogênio → angiotensina I → angiotensina II',
        'estímulo à secreção de aldosterona',
        'reabsorção de sódio e secreção de potássio no ducto coletor',
        'no hiperaldosteronismo primário: aldosterona autônoma suprime a renina',
      ],
    },
    aumento: {
      resumo: 'Relação elevada indica autonomia da aldosterona; renina alta isolada indica hiperaldosteronismo secundário.',
      mecanismos: [
        {
          titulo: 'Produção autônoma de aldosterona',
          explicacao: 'A secreção independente do sistema renina-angiotensina expande o volume, suprime a renina e eleva a relação entre os dois.',
          exemplos: [
            { causa: 'Adenoma produtor de aldosterona (síndrome de Conn)', etapas: ['produção autônoma unilateral', 'renina suprimida', 'relação > 30 com aldosterona > 15 ng/dL', 'hipertensão com ou sem hipocalemia', 'adrenalectomia pode curar'] },
            { causa: 'Hiperplasia adrenal bilateral idiopática', etapas: ['produção autônoma bilateral', 'mesmo perfil laboratorial', 'cateterismo de veias adrenais distingue do adenoma', 'tratamento com antagonista mineralocorticoide'], nota: 'É a forma mais frequente — e a que não se beneficia de cirurgia.' },
          ],
        },
        {
          titulo: 'Estímulo apropriado do sistema — hiperaldosteronismo secundário',
          explicacao: 'A queda da perfusão renal eleva a renina, que eleva a aldosterona; a relação entre os dois permanece normal.',
          exemplos: [
            { causa: 'Estenose de artéria renal', etapas: ['hipoperfusão renal', 'renina ↑↑ e aldosterona ↑', 'relação normal', 'hipertensão renovascular'] },
            { causa: 'Insuficiência cardíaca, cirrose, uso de diurético', etapas: ['volume circulante efetivo reduzido', 'ativação apropriada do eixo', 'renina e aldosterona ↑ proporcionalmente'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Renina e aldosterona baixas juntas apontam para excesso de outro mineralocorticoide ou para hipoaldosteronismo.',
      mecanismos: [
        {
          titulo: 'Supressão do eixo por mineralocorticoide não aldosterona',
          explicacao: 'Outra substância com atividade mineralocorticoide expande o volume e suprime tanto a renina quanto a aldosterona.',
          exemplos: [
            { causa: 'Síndrome de excesso aparente de mineralocorticoide, alcaçuz, síndrome de Liddle', etapas: ['ativação do receptor mineralocorticoide sem aldosterona', 'hipertensão com hipocalemia e alcalose', 'renina e aldosterona ambas suprimidas'], nota: 'Hipertensão hipocalêmica com aldosterona baixa aponta para essas causas raras.' },
            { causa: 'Hipoaldosteronismo hiporreninêmico', etapas: ['nefropatia diabética', 'renina e aldosterona ↓', 'hipercalemia com acidose hiperclorêmica'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O contexto eletrolítico', ids: ['potassio', 'sodio', 'bicarbonato', 'aldosterona'], leitura: 'Hipocalemia com alcalose metabólica e hipertensão é o quadro clássico — mas a maioria dos pacientes é normocalêmica.' },
      { titulo: 'Quando o eixo está desligado', ids: ['ttkg', 'cortisol'], leitura: 'Hipercalemia com TTKG baixo indica hipoaldosteronismo, o extremo oposto do espectro.' },
    ],
    advertencia:
      'Espironolactona e eplerenona invalidam o exame e devem ser suspensas por 4 a 6 semanas. Betabloqueadores, inibidores da ECA, bloqueadores do receptor de angiotensina e diuréticos alteram o resultado nos dois sentidos.',
    interferentes: {
      medicamentos: ['Antagonistas mineralocorticoides (interferência mais grave), betabloqueadores, inibidores da ECA, bloqueadores do receptor de angiotensina, diuréticos e anti-inflamatórios.'],
      preAnalitico: ['Postura e horário: colher pela manhã, após 2 horas em pé ou sentado.', 'Restrição de sódio na dieta eleva a renina e produz falso-negativo.', 'Hipocalemia suprime a secreção de aldosterona — corrigir o potássio antes de dosar.'],
    },
    utilidade: ['triagem', 'diagnostico'],
    estudarTambem: ['aldosterona', 'potassio', 'ttkg'],
  },

  {
    id: 'metanefrinas',
    nome: 'Metanefrinas plasmáticas e urinárias',
    sigla: 'Metanefrinas',
    sinonimos: ['metanefrinas', 'metanefrinas plasmaticas', 'metanefrinas urinarias', 'normetanefrina', 'catecolaminas', 'acido vanilmandelico', 'vma', 'feocromocitoma'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'cardiovascular', 'oncologico'],
    material: 'Plasma colhido com o paciente deitado há pelo menos 20 minutos, ou urina de 24 horas',
    unidade: 'pg/mL e µg/24h',
    referencias: [
      { rotulo: 'Metanefrina plasmática livre', texto: '< 65', unidade: 'pg/mL' },
      { rotulo: 'Normetanefrina plasmática livre', texto: '< 196', unidade: 'pg/mL' },
      { rotulo: 'Metanefrinas urinárias totais de 24h', texto: '< 1.000', unidade: 'µg/24h' },
      { rotulo: 'Altamente sugestivo de feocromocitoma', texto: 'Valores acima de 3 a 4 vezes o limite superior', unidade: '' },
    ],
    resumo:
      'Os metabólitos das catecolaminas — e o exame de escolha para feocromocitoma, porque são produzidos continuamente dentro do tumor, enquanto as catecolaminas são liberadas em picos que o exame pode não pegar.',
    entenda:
      'Essa é a razão de as metanefrinas terem substituído as catecolaminas. O feocromocitoma libera catecolaminas de forma episódica, e uma dosagem colhida entre as crises pode ser normal. Mas o próprio tumor metaboliza catecolaminas em metanefrinas continuamente, dentro de suas células, e as libera de forma constante. As metanefrinas refletem, portanto, a presença do tumor, não o momento da crise — o que explica sua sensibilidade próxima de 99%.',
    aprofundar: [
      'A alta sensibilidade tem um preço: falsos-positivos são frequentes, sobretudo em elevações discretas. As causas mais comuns não são tumores — são medicamentos e situações fisiológicas. Antidepressivos tricíclicos e inibidores de recaptação de serotonina e noradrenalina, levodopa, descongestionantes, betabloqueadores, paracetamol (interferência analítica em alguns métodos), cafeína, nicotina, estresse agudo, exercício e a apneia do sono elevam o resultado. Antes de partir para imagem em uma elevação discreta, revisar a lista de medicamentos e repetir com preparo adequado resolve a maioria dos casos.',
      'O preparo da coleta plasmática é parte do exame e é ignorado com frequência: o paciente deve estar deitado, em repouso, há pelo menos 20 minutos, com o acesso venoso já puncionado — colher no momento da punção mede o estresse da agulha. Sem esse cuidado, a taxa de falso-positivo aumenta substancialmente.',
      'O padrão de secreção sugere a localização: tumores adrenais tendem a produzir tanto adrenalina quanto noradrenalina (metanefrina e normetanefrina elevadas), enquanto paragangliomas extra-adrenais geralmente só produzem noradrenalina, porque lhes falta a enzima que converte noradrenalina em adrenalina — presente apenas na medula adrenal, sob influência do cortisol adjacente. Normetanefrina isoladamente elevada aponta para localização extra-adrenal.',
      'Cerca de 30 a 40% dos feocromocitomas e paragangliomas são hereditários — associados a mutações em RET, VHL, NF1 e nos genes das subunidades da succinato desidrogenase. Isso significa que todo diagnóstico deve levar a aconselhamento genético, independentemente da idade ou da história familiar. As mutações de SDHB, em particular, associam-se a maior risco de malignidade e exigem seguimento prolongado.',
      'Uma advertência cirúrgica que precisa constar: nunca opere um feocromocitoma sem bloqueio alfa-adrenérgico prévio adequado. A manipulação do tumor libera uma descarga catecolaminérgica capaz de causar crise hipertensiva, edema agudo de pulmão e morte. O mesmo vale para qualquer cirurgia adrenal em paciente não investigado — a razão pela qual metanefrinas são obrigatórias antes de operar um incidentaloma.',
    ],
    fisiologia: {
      oQueE: 'Metanefrina e normetanefrina: produtos da O-metilação da adrenalina e da noradrenalina pela catecol-O-metiltransferase.',
      origem: 'Medula adrenal e gânglios simpáticos; a metabolização ocorre dentro das próprias células cromafins.',
      funcao: 'Não têm atividade — são metabólitos de inativação.',
      eliminacao: 'Conjugação e excreção urinária; o ácido vanilmandélico é o produto final comum.',
      orgaosEnvolvidos: ['Medula adrenal', 'Gânglios simpáticos', 'Rim'],
      percurso: [
        'Tirosina → dopa → dopamina → noradrenalina → adrenalina',
        'metabolização intracelular contínua pela COMT',
        'metanefrina e normetanefrina liberadas de forma constante',
        'excreção urinária, parte como ácido vanilmandélico',
      ],
    },
    aumento: {
      resumo: 'Feocromocitoma ou paraganglioma — ou, muito mais frequentemente, medicamento, estresse ou preparo inadequado.',
      mecanismos: [
        {
          titulo: 'Produção tumoral contínua',
          explicacao: 'O tecido cromafim tumoral metaboliza catecolaminas dentro de suas células e libera metanefrinas de forma constante, independentemente das crises.',
          exemplos: [
            { causa: 'Feocromocitoma adrenal', etapas: ['tumor cromafim na medula adrenal', 'metanefrina e normetanefrina ↑ ', 'hipertensão paroxística ou sustentada, cefaleia, sudorese e palpitações', 'bloqueio alfa antes de qualquer cirurgia'], nota: 'A tríade cefaleia-sudorese-palpitação com hipertensão é clássica, mas frequentemente ausente.' },
            { causa: 'Paraganglioma extra-adrenal', etapas: ['tecido cromafim fora da adrenal', 'normetanefrina isoladamente elevada', 'maior associação com mutações de SDHB e com malignidade'], nota: 'O padrão bioquímico sugere a localização antes da imagem.' },
          ],
        },
        {
          titulo: 'Elevações não tumorais',
          explicacao: 'Fármacos, condições de coleta e estados adrenérgicos elevam as metanefrinas sem que haja tumor.',
          exemplos: [
            { causa: 'Antidepressivos, levodopa, descongestionantes, paracetamol, cafeína, nicotina', etapas: ['aumento real ou interferência analítica', 'elevação tipicamente discreta', 'normalização após suspensão e repetição'], nota: 'É a causa mais comum de resultado alterado na prática ambulatorial.' },
            { causa: 'Estresse agudo, dor, exercício, apneia do sono, insuficiência cardíaca', etapas: ['ativação simpática fisiológica', 'metanefrinas ↑ moderadamente', 'sem tumor'] },
            { causa: 'Coleta sem repouso prévio', etapas: ['punção venosa no momento da coleta', 'descarga adrenérgica aguda', 'falso-positivo'], nota: 'Deitado, acesso já puncionado, 20 minutos de repouso — o preparo é parte do exame.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'No contexto sindrômico', ids: ['calcitonina', 'pth', 'calcio'], leitura: 'Feocromocitoma com carcinoma medular de tireoide e hiperparatireoidismo configura neoplasia endócrina múltipla tipo 2 — e a ordem cirúrgica importa: adrenal primeiro.' },
      { titulo: 'Marcador complementar', ids: ['cromogranina-a', 'glicemia-jejum'], leitura: 'A cromogranina A acompanha a massa tumoral; a hiperglicemia é consequência do excesso catecolaminérgico e melhora após a ressecção.' },
    ],
    advertencia:
      'Metanefrinas são obrigatórias antes de qualquer cirurgia adrenal, inclusive de incidentaloma aparentemente não funcionante. Operar um feocromocitoma sem bloqueio alfa prévio pode ser fatal.',
    interferentes: {
      medicamentos: ['Antidepressivos tricíclicos e duais, levodopa, descongestionantes, betabloqueadores, paracetamol, buspirona.'],
      preAnalitico: ['Coleta sem repouso prévio de 20 minutos em decúbito.', 'Cafeína, nicotina e exercício nas horas anteriores.', 'Coleta de urina de 24 horas incompleta.'],
    },
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['cromogranina-a', 'calcitonina', 'cortisol-salivar'],
  },

  {
    id: 'acido-5-hidroxiindolacetico',
    nome: 'Ácido 5-hidroxindolacético urinário',
    sigla: '5-HIAA',
    sinonimos: ['5-hiaa', 'acido 5 hidroxiindolacetico', '5 hidroxindolacetico', 'sindrome carcinoide', 'serotonina metabolito'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'digestivo', 'oncologico'],
    material: 'Urina de 24 horas, com restrição dietética prévia',
    unidade: 'mg/24h',
    referencias: [
      { rotulo: 'Adultos', minimo: 2, maximo: 8, unidade: 'mg/24h' },
      { rotulo: 'Sugestivo de síndrome carcinoide', texto: '> 25', unidade: 'mg/24h' },
    ],
    resumo:
      'O metabólito final da serotonina. Elevado na síndrome carcinoide — e falsamente elevado por uma lista de alimentos que precisa ser conhecida antes da coleta, sob pena de o exame não valer nada.',
    entenda:
      'Tumores neuroendócrinos do intestino médio produzem serotonina em excesso, que é metabolizada a 5-HIAA e excretada na urina. A síndrome carcinoide — rubor facial, diarreia secretora, broncoespasmo e, tardiamente, doença valvar cardíaca direita — só aparece quando o tumor escapa do metabolismo hepático de primeira passagem, ou seja, tipicamente quando já há metástase hepática ou o tumor é de localização extraintestinal.',
    aprofundar: [
      'A restrição dietética não é opcional: banana, abacaxi, abacate, kiwi, ameixa, tomate, berinjela, nozes e chocolate contêm serotonina ou seus precursores e elevam substancialmente o 5-HIAA. A restrição deve começar 48 a 72 horas antes e continuar durante a coleta. Sem ela, um resultado alterado não distingue tumor de salada de frutas — e é a causa mais frequente de falso-positivo.',
      'Vários medicamentos também interferem: paracetamol, guaifenesina, cafeína, nicotina e levodopa elevam; inibidores da monoaminoxidase, metildopa e fenotiazinas reduzem. A revisão da prescrição precede a interpretação.',
      'A doença valvar carcinoide é a consequência que mais justifica diagnosticar cedo: a serotonina circulante induz fibrose no endocárdio das câmaras direitas, produzindo insuficiência tricúspide e estenose pulmonar. As câmaras esquerdas são poupadas porque o pulmão metaboliza a serotonina — a menos que haja shunt intracardíaco ou tumor pulmonar primário, que é a exceção elegante que confirma a regra.',
      'O 5-HIAA se combina com a cromogranina A no seguimento: a cromogranina reflete a massa tumoral e detecta também tumores não funcionantes, enquanto o 5-HIAA reflete a atividade secretora de serotonina. Curvas divergentes entre os dois trazem informação sobre mudança de comportamento do tumor.',
    ],
    fisiologia: {
      oQueE: 'Produto final da degradação da serotonina pela monoaminoxidase e pela aldeído desidrogenase.',
      origem: 'Serotonina produzida por células enterocromafins intestinais e por tumores neuroendócrinos.',
      funcao: 'Nenhuma — é metabólito de excreção.',
      eliminacao: 'Urinária.',
      orgaosEnvolvidos: ['Intestino delgado', 'Fígado', 'Coração direito', 'Rim'],
      percurso: [
        'Triptofano → 5-hidroxitriptofano → serotonina',
        'metabolismo hepático de primeira passagem',
        'escape sistêmico quando há metástase hepática',
        'degradação a 5-HIAA',
        'excreção urinária',
      ],
    },
    aumento: {
      resumo: 'Síndrome carcinoide — ou dieta rica em serotonina, medicamentos, doença celíaca e obstrução intestinal.',
      mecanismos: [
        {
          titulo: 'Produção tumoral de serotonina com escape hepático',
          explicacao: 'O fígado normalmente metaboliza toda a serotonina que chega pela veia porta; a metástase hepática ou a localização extraintestinal permitem que ela alcance a circulação sistêmica.',
          exemplos: [
            { causa: 'Tumor neuroendócrino de intestino médio com metástase hepática', etapas: ['produção de serotonina pelo tumor', 'perda do metabolismo de primeira passagem', '5-HIAA urinário ↑↑', 'rubor, diarreia secretora, broncoespasmo', 'fibrose valvar direita tardia'] },
            { causa: 'Tumor carcinoide brônquico', etapas: ['secreção diretamente na circulação sistêmica', 'síndrome carcinoide sem metástase hepática', 'possível acometimento valvar esquerdo'], nota: 'A exceção que mostra por que normalmente só o lado direito é acometido.' },
          ],
        },
        {
          titulo: 'Elevação não tumoral',
          explicacao: 'Alimentos ricos em serotonina, fármacos e condições que aumentam a produção intestinal elevam o metabólito.',
          exemplos: [
            { causa: 'Dieta com banana, abacaxi, abacate, kiwi, nozes, tomate, chocolate', etapas: ['aporte exógeno de serotonina e precursores', '5-HIAA falsamente elevado', 'necessidade de restrição por 48 a 72 horas antes e durante a coleta'], nota: 'Causa mais frequente de resultado alterado.' },
            { causa: 'Doença celíaca, doença de Whipple, obstrução intestinal', etapas: ['aumento da produção intestinal de serotonina', 'elevação moderada sem tumor'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel neuroendócrino', ids: ['cromogranina-a', 'histamina'], leitura: 'A cromogranina reflete massa tumoral, o 5-HIAA reflete secreção de serotonina, e a metil-histamina distingue mastocitose, que também causa rubor.' },
    ],
    advertencia:
      'A restrição dietética por 48 a 72 horas antes e durante a coleta é obrigatória. Sem ela, o resultado não é interpretável.',
    interferentes: {
      fisiologico: ['Alimentos ricos em serotonina elevam substancialmente.'],
      medicamentos: ['Paracetamol, guaifenesina, cafeína, levodopa elevam; inibidores da monoaminoxidase, metildopa e fenotiazinas reduzem.'],
      preAnalitico: ['Coleta de 24 horas incompleta subestima o resultado.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['cromogranina-a', 'histamina', 'metanefrinas'],
  },
]
