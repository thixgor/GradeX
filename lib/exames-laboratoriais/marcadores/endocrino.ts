import type { Marcador } from '../tipos'

/**
 * Endocrinologia — organizada por eixos, não por hormônios soltos.
 *
 * Nenhum hormônio se interpreta sozinho: o que informa é a **relação entre o
 * hormônio periférico e o seu tropo hipofisário**. TSH alto com T4 baixo e TSH
 * baixo com T4 baixo são doenças de órgãos diferentes com o mesmo T4. Cortisol
 * baixo com ACTH alto e cortisol baixo com ACTH baixo, idem. Por isso cada
 * ficha deste grupo insiste no par, e as comparações lado a lado são a forma
 * mais rápida de aprender a ler o eixo.
 */
export const marcadores: Marcador[] = [
  {
    id: 'tsh',
    nome: 'Hormônio tireoestimulante',
    sigla: 'TSH',
    sinonimos: ['tsh', 'tireotropina', 'hormonio tireoestimulante'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'mUI/L',
    referencias: [
      { rotulo: 'Adultos', minimo: 0.4, maximo: 4.5, unidade: 'mUI/L' },
      { rotulo: 'Gestante — 1º trimestre', minimo: 0.1, maximo: 2.5, unidade: 'mUI/L', observacao: 'O hCG estimula o receptor de TSH e suprime fisiologicamente o TSH no primeiro trimestre.' },
      { rotulo: 'Idosos', texto: 'Limite superior tende a ser mais alto', unidade: 'mUI/L', observacao: 'O TSH sobe fisiologicamente com a idade — tratar todo idoso com TSH de 5 é sobretratamento.' },
    ],
    resumo:
      'O hormônio hipofisário que comanda a tireoide. Por ser regulado por retroalimentação logarítmica, é o exame mais sensível para detectar disfunção tireoidiana primária.',
    entenda:
      'Pequenas variações do T4 livre produzem grandes variações do TSH — a relação entre eles é log-linear. É isso que faz do TSH o melhor exame de rastreio: ele se altera antes de o hormônio periférico sair da faixa normal, o que define o hipotireoidismo e o hipertireoidismo subclínicos. Mas essa mesma sensibilidade tem um pré-requisito: o eixo hipotálamo-hipófise precisa estar íntegro. Em doença hipofisária, o TSH deixa de ser confiável, e a interpretação passa a depender do T4 livre.',
    aprofundar: [
      'A regra de ouro é ler TSH e T4 livre juntos e sempre na mesma direção do raciocínio. TSH alto com T4 baixo: hipotireoidismo primário — a tireoide falhou e a hipófise cobra. TSH baixo com T4 alto: hipertireoidismo primário — a tireoide produz sozinha e a hipófise se cala. TSH baixo ou inapropriadamente normal com T4 baixo: hipotireoidismo central — a hipófise ou o hipotálamo falharam, e o TSH "normal" é, na verdade, inadequado. TSH alto com T4 alto: raro, e aponta adenoma hipofisário produtor de TSH ou resistência ao hormônio tireoidiano.',
      'A síndrome do eutireoidiano doente é a armadilha mais comum na interpretação hospitalar. Em doença aguda grave, a conversão periférica de T4 em T3 cai e aumenta a produção de T3 reverso; o TSH pode estar baixo na fase aguda e rebote-alto na recuperação. Nada disso é doença tireoidiana, e tratar com levotiroxina não beneficia. A conduta correta é evitar dosar função tireoidiana em paciente agudamente enfermo, salvo forte suspeita clínica.',
      'A biotina em altas doses — comum em suplementos para cabelo e unhas — interfere em ensaios que usam o sistema biotina-estreptavidina, e produz um padrão que imita tireotoxicose: TSH falsamente baixo com T4 e T3 falsamente altos. É causa reconhecida de diagnóstico equivocado. Suspender a biotina por 48 a 72 horas e repetir resolve.',
    ],
    fisiologia: {
      oQueE: 'Glicoproteína hipofisária de duas subunidades (alfa, comum a FSH, LH e hCG, e beta, específica).',
      origem: 'Células tireotróficas da adeno-hipófise, sob estímulo do TRH hipotalâmico.',
      funcao: 'Estimular a captação de iodo, a síntese e a liberação de T4 e T3 e o trofismo da glândula tireoide.',
      metabolismo: 'Suprimido por retroalimentação negativa do T4 e do T3 livres sobre hipófise e hipotálamo.',
      meiaVida: 'Cerca de 60 minutos, com secreção pulsátil e ritmo circadiano (pico noturno).',
      orgaosEnvolvidos: ['Hipotálamo', 'Hipófise', 'Tireoide'],
      percurso: ['TRH hipotalâmico', 'TSH hipofisário', 'tireoide: síntese de T4 e T3', 'retroalimentação negativa sobre hipófise e hipotálamo'],
    },
    aumento: {
      resumo: 'Hipotireoidismo primário, em quase todos os casos. Raramente, adenoma produtor de TSH ou resistência hormonal.',
      mecanismos: [
        {
          titulo: 'Perda da retroalimentação negativa',
          explicacao: 'Com pouco hormônio tireoidiano circulante, a hipófise aumenta o TSH para tentar estimular a glândula.',
          exemplos: [
            { causa: 'Tireoidite de Hashimoto', etapas: ['destruição autoimune do tecido tireoidiano', 'T4 livre ↓', 'retroalimentação negativa reduzida', 'TSH ↑', 'anti-TPO positivo'], nota: 'É a causa mais comum de hipotireoidismo em áreas com iodo suficiente.' },
            { causa: 'Pós-tireoidectomia, pós-iodo radioativo, deficiência de iodo', etapas: ['massa tireoidiana funcionante ↓', 'T4 ↓', 'TSH ↑'] },
            { causa: 'Amiodarona, lítio, inibidores de tirosina-quinase, interferon', etapas: ['bloqueio da síntese ou tireoidite induzida', 'T4 ↓', 'TSH ↑'], nota: 'Quem usa amiodarona precisa de vigilância de função tireoidiana — ela causa tanto hipo quanto hipertireoidismo.' },
            { causa: 'Hipotireoidismo subclínico', etapas: ['reserva tireoidiana reduzida', 'TSH ↑ com T4 livre ainda normal'], nota: 'A hipófise compensa antes de o hormônio periférico cair — por isso o TSH é o marcador precoce.' },
          ],
        },
        {
          titulo: 'Elevações não tireoidianas',
          explicacao: 'Situações em que o TSH sobe sem hipotireoidismo verdadeiro.',
          exemplos: [
            { causa: 'Recuperação de doença aguda grave, insuficiência adrenal não tratada, idade avançada', etapas: ['desregulação transitória do eixo', 'TSH ↑ com T4 normal'], nota: 'Repetir após 6 a 8 semanas antes de tratar.' },
            { causa: 'Adenoma hipofisário produtor de TSH ou resistência ao hormônio tireoidiano', etapas: ['secreção autônoma ou receptor insensível', 'TSH ↑ ou inapropriadamente normal com T4 ↑'], nota: 'Padrão raro e discordante: TSH e T4 ambos altos.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hipertireoidismo primário, hipotireoidismo central, uso de levotiroxina em dose excessiva, gestação inicial ou doença aguda.',
      mecanismos: [
        {
          titulo: 'Excesso de hormônio tireoidiano',
          explicacao: 'O excesso de T4 e T3 suprime a hipófise.',
          exemplos: [
            { causa: 'Doença de Graves', etapas: ['anticorpo estimulador do receptor de TSH (TRAb)', 'produção autônoma de T4 e T3', 'TSH suprimido', 'bócio difuso e oftalmopatia'] },
            { causa: 'Bócio multinodular tóxico, adenoma tóxico', etapas: ['autonomia nodular', 'T4 e T3 ↑', 'TSH ↓'] },
            { causa: 'Tireoidite subaguda ou pós-parto (fase inicial)', etapas: ['destruição folicular com liberação de hormônio pré-formado', 'tireotoxicose transitória', 'TSH ↓'], nota: 'Captação de iodo baixa — o que a distingue de Graves e muda o tratamento (não se usa antitireoidiano).' },
            { causa: 'Levotiroxina em dose excessiva', etapas: ['aporte exógeno', 'TSH suprimido'], nota: 'Causa iatrogênica frequente, com risco de osteoporose e fibrilação atrial em idosos.' },
          ],
        },
        {
          titulo: 'Falha hipofisária ou hipotalâmica',
          explicacao: 'A hipófise não produz TSH suficiente, e o "normal" passa a ser inapropriado.',
          exemplos: [{ causa: 'Tumor hipofisário, apoplexia, síndrome de Sheehan, radioterapia, hipofisite', etapas: ['secreção de TSH ↓', 'T4 livre ↓ com TSH baixo ou inapropriadamente normal'], nota: 'Nesse cenário o TSH não serve de guia: acompanha-se pelo T4 livre.' }],
        },
        {
          titulo: 'Supressão fisiológica ou por doença',
          explicacao: 'Estímulos externos suprimem transitoriamente o eixo.',
          exemplos: [
            { causa: 'Gestação (1º trimestre)', etapas: ['hCG estimula o receptor de TSH', 'T4 ↑ discreto', 'TSH ↓ fisiológico'] },
            { causa: 'Doença aguda grave, corticoide em dose alta, dopamina', etapas: ['supressão central do eixo', 'TSH ↓ sem tireotoxicose'], nota: 'Síndrome do eutireoidiano doente — não tratar.' },
          ],
        },
      ],
    },
    comparacoes: [
      {
        id: 'tsh-t4-padroes',
        titulo: 'Os padrões do eixo tireoidiano',
        pergunta: 'TSH e T4 livre juntos: qual órgão falhou?',
        hipoteses: ['Hipotireoidismo primário', 'Hipotireoidismo central', 'Hipertireoidismo primário', 'Subclínicos'],
        linhas: [
          { marcador: 'TSH', celulas: ['↑', '↓ ou normal', '↓↓', '↑ (hipo) ou ↓ (hiper)'] },
          { marcador: 'T4 livre', celulas: ['↓', '↓', '↑', 'normal'] },
          { marcador: 'T3', celulas: ['normal ou ↓', '↓', '↑', 'normal'] },
          { marcador: 'Local do problema', celulas: ['tireoide', 'hipófise/hipotálamo', 'tireoide', 'reserva reduzida ou autonomia inicial'] },
          { marcador: 'Investigação', celulas: ['anti-TPO', 'RM de sela e demais eixos hipofisários', 'TRAb, cintilografia', 'repetir em 6–8 semanas'] },
        ],
        leitura:
          'A pergunta é sempre "o TSH está apropriado para esse T4?". No hipotireoidismo primário, sim: a tireoide falhou e a hipófise, íntegra, cobra mais — TSH alto. No central, não: o T4 está baixo e o TSH deveria estar alto, mas está baixo ou normal — o que denuncia a hipófise. É por isso que TSH "normal" com T4 baixo nunca é normal, e é o achado mais fácil de deixar passar no laudo.',
        limites: 'Doença aguda grave, biotina, amiodarona e corticoides alteram os três valores sem doença tireoidiana. Em gestante, os intervalos são específicos por trimestre.',
      },
    ],
    relacionados: [
      { titulo: 'Nunca sozinho', ids: ['t4-livre', 't3'], leitura: 'O TSH só se interpreta com o T4 livre. Isolado, ele não distingue doença primária de central.' },
      { titulo: 'Consequências metabólicas', ids: ['colesterol-total', 'ck', 'sodio', 'prolactina'], leitura: 'Hipotireoidismo eleva colesterol e CK, pode causar hiponatremia e elevar a prolactina pelo aumento do TRH.' },
    ],
    interferentes: {
      fisiologico: ['Ritmo circadiano com pico noturno; a idade eleva o limite superior; gestação reduz no 1º trimestre.'],
      medicamentos: ['Amiodarona, lítio, corticoides, dopamina, inibidores de tirosina-quinase e imunoterápicos alteram.', 'Biotina em alta dose produz TSH falsamente baixo com T4 falsamente alto.'],
      metodo: ['Anticorpos heterófilos podem elevar falsamente.'],
    },
    cinetica: { tendencia: 'Após ajuste de levotiroxina, o TSH leva de 6 a 8 semanas para refletir a nova dose — dosar antes disso leva a ajustes desnecessários.' },
    normalizacao: [
      { cenario: 'Hipotireoidismo primário', caminho: 'Reposição de levotiroxina em jejum, ajustada pelo TSH a cada 6 a 8 semanas até a meta.', prazo: '2 a 3 meses até a estabilização.' },
      { cenario: 'TSH alterado em doença aguda', caminho: 'Não tratar. Repetir após a recuperação clínica — a maioria normaliza sozinha.', prazo: '4 a 8 semanas após a alta.' },
    ],
    utilidade: ['rastreamento', 'diagnostico', 'acompanhamento'],
    padroes: ['hipotireoidismo-primario', 'hipertireoidismo-primario'],
    estudarTambem: ['t4-livre', 't3', 'colesterol-total'],
  },

  {
    id: 't4-livre',
    nome: 'T4 livre',
    sigla: 'T4L',
    sinonimos: ['tiroxina livre', 't4 livre', 'ft4'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'ng/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 0.8, maximo: 1.8, unidade: 'ng/dL' }],
    resumo: 'A fração ativa do principal hormônio tireoidiano. Junto ao TSH, define se a disfunção é primária ou central.',
    entenda:
      'Mais de 99% do T4 circula ligado à TBG, à albumina e à transtirretina; apenas a fração livre entra na célula e é convertida em T3 pelas desiodases. Por isso o T4 livre é preferível ao total: a TBG sobe na gestação e com estrogênios e cai na síndrome nefrótica e na hepatopatia, alterando o T4 total sem que a fração ativa mude.',
    fisiologia: {
      oQueE: 'Tetraiodotironina não ligada a proteínas plasmáticas.',
      origem: 'Produzido exclusivamente pela tireoide, a partir da iodação da tireoglobulina.',
      funcao: 'Pró-hormônio: convertido em T3 nos tecidos pelas desiodases tipo 1 e 2, regula o metabolismo basal, o crescimento e o desenvolvimento neurológico.',
      metabolismo: 'Desiodação periférica em T3 (ativo) ou T3 reverso (inativo).',
      meiaVida: '7 dias — por isso a levotiroxina é de dose única diária e o TSH demora semanas a refletir mudanças.',
      orgaosEnvolvidos: ['Tireoide', 'Fígado', 'Rim', 'Hipófise'],
      percurso: ['Iodo captado pela tireoide', 'tireoglobulina iodada', 'T4 secretado', 'desiodase periférica', 'T3 ativo no núcleo celular'],
    },
    aumento: {
      resumo: 'Hipertireoidismo, tireotoxicose factícia, tireoidite em fase destrutiva e excesso de levotiroxina.',
      mecanismos: [
        {
          titulo: 'Produção ou liberação aumentada',
          explicacao: 'A glândula produz autonomamente ou libera hormônio pré-formado ao ser destruída.',
          exemplos: [
            { causa: 'Doença de Graves, bócio multinodular tóxico', etapas: ['estímulo autoimune ou autonomia nodular', 'síntese ↑', 'T4 livre ↑ com TSH suprimido'] },
            { causa: 'Tireoidite subaguda, pós-parto ou por amiodarona tipo 2', etapas: ['destruição folicular', 'liberação de hormônio estocado', 'tireotoxicose transitória com captação baixa'] },
            { causa: 'Ingestão exógena', etapas: ['levotiroxina em excesso', 'T4 ↑ com tireoglobulina baixa'], nota: 'Tireoglobulina baixa denuncia origem exógena — na tireotoxicose endógena ela está alta.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hipotireoidismo primário (com TSH alto) ou central (com TSH baixo ou inapropriadamente normal).',
      mecanismos: [
        {
          titulo: 'Falha da glândula',
          explicacao: 'A tireoide não produz.',
          exemplos: [{ causa: 'Hashimoto, pós-tireoidectomia, deficiência de iodo, medicamentos', etapas: ['produção ↓', 'T4 livre ↓', 'TSH ↑ compensatório'] }],
        },
        {
          titulo: 'Falha do comando',
          explicacao: 'A hipófise não estimula.',
          exemplos: [{ causa: 'Doença hipofisária ou hipotalâmica', etapas: ['TSH insuficiente', 'T4 livre ↓ com TSH baixo ou normal'], nota: 'Exige investigar os demais eixos hipofisários — sobretudo o corticotrófico, que é o de risco imediato.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'O par obrigatório', ids: ['tsh', 't3'], leitura: 'TSH e T4 livre juntos localizam a doença; o T3 acrescenta na tireotoxicose por T3 e na avaliação de gravidade.' }],
    interferentes: {
      fisiologico: ['Gestação altera as proteínas ligadoras e exige intervalos por trimestre.'],
      medicamentos: ['Amiodarona, heparina, fenitoína, carbamazepina e biotina interferem.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['hipotireoidismo-primario', 'hipertireoidismo-primario'],
    estudarTambem: ['tsh', 't3'],
  },

  {
    id: 't3',
    nome: 'T3 total e livre',
    sigla: 'T3',
    sinonimos: ['triiodotironina', 't3 livre', 't3 total'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'ng/dL',
    referencias: [{ rotulo: 'T3 total — adultos', minimo: 80, maximo: 200, unidade: 'ng/dL' }],
    resumo: 'O hormônio tireoidiano biologicamente ativo. Útil sobretudo para caracterizar tireotoxicose — não serve para diagnosticar hipotireoidismo.',
    entenda:
      'Cerca de 80% do T3 circulante vem da conversão periférica do T4, e apenas 20% da secreção tireoidiana direta. No hipotireoidismo, o organismo prioriza essa conversão, e o T3 é o último a cair — por isso dosar T3 para investigar hipotireoidismo é inútil. Já na tireotoxicose ele é valioso: existe a tireotoxicose por T3, com TSH suprimido, T4 livre normal e T3 elevado, que passaria despercebida sem essa dosagem.',
    fisiologia: {
      oQueE: 'Tri-iodotironina, a forma que se liga ao receptor nuclear e exerce a ação hormonal.',
      origem: '20% da tireoide; 80% da conversão periférica do T4 pelas desiodases.',
      funcao: 'Regular o metabolismo basal, a termogênese, o inotropismo e o cronotropismo cardíaco, o metabolismo lipídico e o desenvolvimento.',
      meiaVida: 'Cerca de 1 dia.',
      percurso: ['T4 circulante', 'desiodase tipo 1 e 2 nos tecidos', 'T3 ativo', 'receptor nuclear', 'transcrição gênica'],
    },
    aumento: {
      resumo: 'Tireotoxicose, especialmente a forma por T3, e ingestão de T3 exógeno.',
      mecanismos: [
        { titulo: 'Produção aumentada', explicacao: 'A glândula hiperfuncionante produz proporcionalmente mais T3.', exemplos: [{ causa: 'Doença de Graves, adenoma tóxico', etapas: ['estímulo autônomo', 'secreção preferencial de T3', 'T3 ↑ com T4 por vezes normal'], nota: 'A tireotoxicose por T3 é mais comum em nódulos autônomos e em áreas com deficiência de iodo.' }] },
      ],
    },
    reducao: {
      resumo: 'Síndrome do eutireoidiano doente — muito mais frequente que hipotireoidismo verdadeiro.',
      mecanismos: [
        {
          titulo: 'Conversão periférica reduzida',
          explicacao: 'Na doença aguda, a desiodase tipo 1 é inibida e o T4 é desviado para T3 reverso, inativo. É adaptação, não doença.',
          exemplos: [{ causa: 'Doença crítica, jejum prolongado, corticoide, propranolol, amiodarona', etapas: ['desiodase tipo 1 inibida', 'conversão desviada para T3 reverso', 'T3 ↓ com TSH e T4 variáveis'], nota: 'Não tratar. Repetir após a recuperação.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Leia com', ids: ['tsh', 't4-livre'], leitura: 'T3 isolado não diagnostica nada. Com TSH suprimido e T4 normal, revela a tireotoxicose por T3.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['tsh', 't4-livre'],
  },

  {
    id: 'cortisol',
    nome: 'Cortisol',
    sinonimos: ['cortisol serico', 'cortisol matinal', 'cortisol salivar', 'cortisol livre urinario'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'metabolico'],
    material: 'Soro (8h), saliva (23h) ou urina de 24 horas',
    unidade: 'µg/dL',
    referencias: [
      { rotulo: 'Sérico às 8h', minimo: 5, maximo: 25, unidade: 'µg/dL' },
      { rotulo: 'Após teste de supressão com 1 mg de dexametasona', texto: '< 1,8', unidade: 'µg/dL', observacao: 'Valor acima disso indica supressão inadequada e exige investigação de hipercortisolismo.' },
      { rotulo: 'Cortisol salivar à meia-noite', texto: 'Baixo (varia com o método)', unidade: 'µg/dL', observacao: 'A perda do nadir noturno é um dos achados mais precoces da síndrome de Cushing.' },
    ],
    resumo:
      'O hormônio do estresse e da manutenção da pressão arterial e da glicemia. Tem ritmo circadiano acentuado — e por isso o horário da coleta é parte do exame.',
    entenda:
      'O cortisol é secretado em pulsos, com pico no início da manhã e nadir por volta da meia-noite. Uma dosagem isolada, portanto, quase nunca responde a uma pergunta clínica sozinha: para investigar excesso, usam-se testes que exploram a perda do ritmo (cortisol salivar noturno) ou da supressibilidade (dexametasona 1 mg); para investigar deficiência, usa-se o cortisol matinal e, na dúvida, o teste de estímulo com ACTH sintético.',
    aprofundar: [
      'Na insuficiência adrenal, o ACTH separa primária de secundária, e a diferença é clínica. Na primária (doença de Addison), a adrenal falhou: o ACTH sobe, e como ele deriva da POMC — precursor também do hormônio melanócito-estimulante —, surge hiperpigmentação. Como a zona glomerulosa também é destruída, falta aldosterona: hipercalemia, hiponatremia e hipovolemia. Na secundária, a hipófise falhou: ACTH baixo, sem hiperpigmentação, e com aldosterona preservada (regulada pela angiotensina, não pelo ACTH) — então há hiponatremia, mas o potássio costuma ser normal.',
      'A causa mais comum de insuficiência adrenal na prática é o uso crônico de corticoide exógeno, que suprime o eixo. A retirada abrupta após semanas de uso pode precipitar crise adrenal. Vale lembrar que a dexametasona não é medida pelos ensaios de cortisol, mas suprime o eixo — por isso ela é usada nos testes de supressão, e por isso um paciente em uso dela pode ter cortisol indetectável sem doença adrenal alguma.',
    ],
    fisiologia: {
      oQueE: 'Glicocorticoide esteroide produzido na zona fasciculada do córtex adrenal.',
      origem: 'Córtex adrenal, a partir do colesterol, sob estímulo do ACTH.',
      circulacao: 'Circula ligado à globulina ligadora de corticosteroides (CBG) e à albumina; apenas 5 a 10% está livre e ativo.',
      funcao: 'Gliconeogênese, catabolismo proteico, lipólise, manutenção do tônus vascular e da resposta pressora às catecolaminas, e imunomodulação.',
      metabolismo: 'Inativado no fígado e excretado como metabólitos conjugados.',
      meiaVida: '60 a 90 minutos.',
      orgaosEnvolvidos: ['Hipotálamo (CRH)', 'Hipófise (ACTH)', 'Adrenal', 'Fígado'],
      percurso: ['CRH hipotalâmico', 'ACTH hipofisário', 'córtex adrenal: síntese de cortisol', 'ação tecidual', 'retroalimentação negativa'],
    },
    aumento: {
      resumo: 'Síndrome de Cushing (exógena, hipofisária, adrenal ou ectópica), estresse agudo e pseudo-Cushing.',
      mecanismos: [
        {
          titulo: 'Excesso de ACTH',
          explicacao: 'O estímulo trófico contínuo sobre a adrenal aumenta a produção de cortisol.',
          exemplos: [
            { causa: 'Doença de Cushing (adenoma hipofisário)', etapas: ['secreção autônoma de ACTH', 'hiperplasia adrenal bilateral', 'cortisol ↑ com ACTH normal ou ↑'], nota: 'É a causa endógena mais comum.' },
            { causa: 'Secreção ectópica de ACTH (carcinoma de pequenas células do pulmão, tumores neuroendócrinos)', etapas: ['produção tumoral de ACTH', 'cortisol ↑↑ de instalação rápida', 'hipocalemia e alcalose acentuadas com pouca alteração cushingoide'], nota: 'O quadro clínico clássico de Cushing pode faltar: predominam hipocalemia, miopatia e hiperpigmentação.' },
          ],
        },
        {
          titulo: 'Produção adrenal autônoma',
          explicacao: 'A adrenal produz sem comando, e o ACTH é suprimido.',
          exemplos: [{ causa: 'Adenoma ou carcinoma adrenal', etapas: ['produção autônoma de cortisol', 'ACTH suprimido', 'atrofia da adrenal contralateral'] }],
        },
        {
          titulo: 'Exógena e funcional',
          explicacao: 'Corticoide administrado ou hiperativação fisiológica do eixo.',
          exemplos: [
            { causa: 'Corticoterapia', etapas: ['aporte exógeno', 'quadro cushingoide com cortisol endógeno e ACTH suprimidos'], nota: 'É, de longe, a causa mais comum de síndrome de Cushing.' },
            { causa: 'Estresse agudo, depressão grave, alcoolismo, obesidade', etapas: ['ativação do eixo', 'cortisol ↑ sem doença adrenal'], nota: 'Pseudo-Cushing: pode dar teste de supressão alterado e exige investigação cuidadosa.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Insuficiência adrenal primária (com ACTH alto) ou secundária (com ACTH baixo), incluindo a supressão por corticoide exógeno.',
      mecanismos: [
        {
          titulo: 'Destruição adrenal',
          explicacao: 'A glândula não produz, e o ACTH sobe tentando estimular.',
          exemplos: [{ causa: 'Adrenalite autoimune (Addison), tuberculose, hemorragia adrenal, metástases, adrenoleucodistrofia', etapas: ['destruição do córtex adrenal', 'cortisol e aldosterona ↓', 'ACTH ↑', 'hiperpigmentação, hiponatremia, hipercalemia e hipotensão'], nota: 'Hiponatremia com hipercalemia e eosinofilia é a assinatura laboratorial.' }],
        },
        {
          titulo: 'Falha do estímulo hipofisário',
          explicacao: 'Sem ACTH, a zona fasciculada atrofia. A aldosterona é poupada porque depende da angiotensina.',
          exemplos: [
            { causa: 'Suspensão abrupta de corticoide crônico', etapas: ['supressão prolongada do eixo', 'atrofia adrenal', 'cortisol ↓ com ACTH ↓'], nota: 'A causa mais comum de insuficiência adrenal secundária.' },
            { causa: 'Tumor hipofisário, apoplexia, Sheehan, radioterapia, hipofisite por imunoterápicos', etapas: ['produção de ACTH ↓', 'cortisol ↓ sem hiperpigmentação e com potássio normal'] },
          ],
        },
      ],
    },
    comparacoes: [
      {
        id: 'insuficiencia-adrenal-primaria-vs-secundaria',
        titulo: 'Insuficiência adrenal primária × secundária',
        pergunta: 'O cortisol está baixo. A adrenal falhou ou a hipófise parou de pedir?',
        hipoteses: ['Primária (Addison)', 'Secundária (hipofisária)'],
        linhas: [
          { marcador: 'ACTH', celulas: ['↑↑', '↓ ou normal-baixo'] },
          { marcador: 'Hiperpigmentação', celulas: ['presente', 'ausente'] },
          { marcador: 'Aldosterona', celulas: ['↓', 'preservada'] },
          { marcador: 'Potássio', celulas: ['↑', 'normal'] },
          { marcador: 'Sódio', celulas: ['↓', '↓'] },
          { marcador: 'Outros eixos hipofisários', celulas: ['normais', 'frequentemente comprometidos'] },
        ],
        leitura:
          'Duas consequências decorrem do local da lesão. A hiperpigmentação existe apenas na primária porque o ACTH elevado deriva da POMC, precursora também do hormônio melanócito-estimulante. E a hipercalemia existe apenas na primária porque a aldosterona é regulada pela angiotensina II e pelo potássio, e não pelo ACTH: com a hipófise doente, a zona glomerulosa continua funcionando. Por isso a hiponatremia aparece nas duas, mas a hipercalemia identifica a primária.',
      },
    ],
    relacionados: [
      { titulo: 'Sempre com', ids: ['acth', 'sodio', 'potassio', 'glicemia-jejum'], leitura: 'ACTH localiza a lesão; sódio, potássio e glicemia mostram a repercussão.' },
    ],
    interferentes: {
      preAnalitico: ['O horário da coleta é parte do exame — cortisol das 16h não se interpreta com referência das 8h.'],
      fisiologico: ['Estresse, dor, doença aguda, gestação e estrogênios (que elevam a CBG) alteram o valor.'],
      medicamentos: ['Corticoides exógenos suprimem; a prednisolona reage em muitos ensaios de cortisol, a dexametasona não.'],
    },
    utilidade: ['diagnostico'],
    padroes: ['insuficiencia-adrenal', 'sindrome-de-cushing'],
    estudarTambem: ['acth', 'sodio', 'potassio', 'aldosterona'],
  },

  {
    id: 'acth',
    nome: 'ACTH',
    sinonimos: ['hormonio adrenocorticotrofico', 'corticotrofina', 'acth plasmatico'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Plasma com EDTA, em gelo, processamento imediato',
    unidade: 'pg/mL',
    referencias: [{ rotulo: 'Adultos às 8h', minimo: 10, maximo: 60, unidade: 'pg/mL' }],
    resumo: 'O hormônio hipofisário que comanda o cortisol. É ele que localiza a lesão em qualquer distúrbio do eixo adrenal.',
    entenda:
      'O ACTH é o exame que transforma um cortisol alterado em diagnóstico topográfico. Cortisol baixo com ACTH alto: a adrenal falhou. Cortisol baixo com ACTH baixo: a hipófise falhou. Cortisol alto com ACTH suprimido: a adrenal produz sozinha. Cortisol alto com ACTH normal ou alto: a fonte é hipofisária ou ectópica. É extremamente instável in vitro e exige coleta em gelo com processamento imediato.',
    fisiologia: {
      oQueE: 'Peptídeo de 39 aminoácidos derivado da clivagem da pró-opiomelanocortina (POMC).',
      origem: 'Células corticotróficas da adeno-hipófise, sob estímulo do CRH.',
      funcao: 'Estimular a esteroidogênese na zona fasciculada adrenal e manter o trofismo do córtex.',
      meiaVida: 'Cerca de 10 minutos, com secreção pulsátil e ritmo circadiano.',
      percurso: ['CRH', 'POMC clivada em ACTH e MSH', 'córtex adrenal', 'cortisol', 'retroalimentação negativa'],
    },
    aumento: {
      resumo: 'Insuficiência adrenal primária, doença de Cushing e secreção ectópica.',
      mecanismos: [
        { titulo: 'Perda da retroalimentação', explicacao: 'Cortisol baixo desinibe a hipófise.', exemplos: [{ causa: 'Doença de Addison', etapas: ['cortisol ↓', 'ACTH ↑↑', 'hiperpigmentação por estímulo do MSH'] }] },
        { titulo: 'Produção autônoma', explicacao: 'Tumor hipofisário ou não hipofisário produz ACTH sem controle.', exemplos: [{ causa: 'Doença de Cushing, secreção ectópica por carcinoma de pequenas células', etapas: ['secreção autônoma', 'cortisol ↑ com ACTH não suprimido'], nota: 'O teste de supressão com dexametasona em dose alta e a dosagem de CRH ajudam a separar hipofisário de ectópico.' }] },
      ],
    },
    reducao: {
      resumo: 'Insuficiência adrenal secundária e tumor adrenal produtor de cortisol.',
      mecanismos: [
        { titulo: 'Supressão por cortisol', explicacao: 'O excesso de cortisol, endógeno ou exógeno, cala a hipófise.', exemplos: [{ causa: 'Adenoma adrenal, corticoterapia', etapas: ['cortisol ↑ ou exógeno', 'ACTH suprimido', 'atrofia da adrenal contralateral'] }] },
        { titulo: 'Falha hipofisária', explicacao: 'A hipófise não produz.', exemplos: [{ causa: 'Tumor, apoplexia, Sheehan, hipofisite', etapas: ['ACTH ↓', 'cortisol ↓ sem hiperpigmentação'] }] },
      ],
    },
    relacionados: [{ titulo: 'Sempre em par com', ids: ['cortisol'], leitura: 'ACTH sozinho não diz nada: é a combinação com o cortisol que localiza a lesão.' }],
    interferentes: { preAnalitico: ['Extremamente instável: exige tubo com EDTA, gelo e centrifugação imediata. Amostra mal manipulada dá valor falsamente baixo.'] },
    utilidade: ['diagnostico'],
    estudarTambem: ['cortisol', 'aldosterona'],
  },

  {
    id: 'prolactina',
    nome: 'Prolactina',
    sigla: 'PRL',
    sinonimos: ['prl', 'prolactina serica', 'hiperprolactinemia'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Mulheres não gestantes', texto: '< 25', unidade: 'ng/mL' },
      { rotulo: 'Homens', texto: '< 20', unidade: 'ng/mL' },
      { rotulo: 'Sugestivo de macroprolactinoma', texto: '> 200', unidade: 'ng/mL' },
    ],
    resumo:
      'O único hormônio hipofisário sob inibição tônica — a dopamina o freia. Por isso qualquer coisa que interrompa a dopamina o eleva.',
    entenda:
      'A prolactina é continuamente inibida pela dopamina vinda do hipotálamo pela haste hipofisária. Isso cria uma lógica diagnóstica particular: além de tumores produtores, qualquer coisa que bloqueie a dopamina (antipsicóticos, metoclopramida) ou interrompa a haste (tumor de outra natureza comprimindo, o chamado efeito haste) eleva a prolactina. A magnitude ajuda: valores acima de 200 ng/mL sugerem macroprolactinoma; entre 25 e 100, medicamentos, hipotireoidismo e estresse são causas mais prováveis.',
    fisiologia: {
      oQueE: 'Hormônio polipeptídico da adeno-hipófise.',
      origem: 'Células lactotróficas hipofisárias.',
      funcao: 'Estimular a lactação e inibir o eixo gonadotrófico — o que explica a amenorreia e a disfunção erétil da hiperprolactinemia.',
      metabolismo: 'Sob inibição tônica da dopamina hipotalâmica; estimulada pelo TRH e pela sucção.',
      percurso: ['Dopamina hipotalâmica inibe', 'lactotrofo hipofisário', 'prolactina', 'mama (lactação) e inibição de GnRH'],
    },
    aumento: {
      resumo: 'Prolactinoma, medicamentos, hipotireoidismo primário, gestação, estresse, doença renal e macroprolactina.',
      mecanismos: [
        {
          titulo: 'Perda da inibição dopaminérgica',
          explicacao: 'Sem dopamina chegando ao lactotrofo, a secreção é liberada.',
          exemplos: [
            { causa: 'Antipsicóticos, metoclopramida, antidepressivos, verapamil, opioides', etapas: ['bloqueio de receptores D2', 'inibição tônica removida', 'prolactina ↑ (geralmente 25 a 100 ng/mL)'], nota: 'É a causa mais comum de hiperprolactinemia — revisar a lista de medicamentos antes de pedir ressonância.' },
            { causa: 'Compressão da haste hipofisária por tumor não produtor', etapas: ['interrupção do fluxo de dopamina', 'prolactina ↑ moderada'], nota: 'Efeito haste: eleva menos que um prolactinoma do mesmo tamanho.' },
          ],
        },
        {
          titulo: 'Produção autônoma',
          explicacao: 'O tumor produz independentemente da regulação.',
          exemplos: [{ causa: 'Prolactinoma', etapas: ['adenoma lactotrófico', 'prolactina ↑↑', 'amenorreia, galactorreia, hipogonadismo'], nota: 'A magnitude costuma acompanhar o tamanho do tumor.' }],
        },
        {
          titulo: 'Estímulo fisiológico e metabólico',
          explicacao: 'TRH e outros estímulos elevam a prolactina.',
          exemplos: [
            { causa: 'Hipotireoidismo primário', etapas: ['TRH ↑', 'estímulo cruzado ao lactotrofo', 'prolactina ↑'], nota: 'Dosar TSH sempre antes de investigar hipófise — corrigir o hipotireoidismo normaliza a prolactina.' },
            { causa: 'Gestação, lactação, estresse, punção venosa, exercício, doença renal crônica', etapas: ['estímulo fisiológico ou clearance ↓', 'prolactina ↑'] },
          ],
        },
        {
          titulo: 'Macroprolactina',
          explicacao: 'Complexo de prolactina com imunoglobulina, biologicamente inativo mas detectado pelo ensaio.',
          exemplos: [{ causa: 'Macroprolactinemia', etapas: ['complexo prolactina-IgG', 'ensaio detecta', 'prolactina "alta" em paciente assintomático'], nota: 'Investigar com precipitação por polietilenoglicol antes de tratar paciente sem sintomas.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Antes de pensar em tumor', ids: ['tsh', 'creatinina'], leitura: 'Hipotireoidismo, doença renal, medicamentos e macroprolactina explicam a maior parte das hiperprolactinemias.' }],
    interferentes: { preAnalitico: ['Estresse da punção e exercício elevam — repetir em condições basais antes de investigar.'] },
    utilidade: ['diagnostico'],
    estudarTambem: ['tsh', 'fsh', 'testosterona-total'],
  },

  {
    id: 'pth',
    nome: 'Paratormônio',
    sigla: 'PTH',
    sinonimos: ['paratormonio', 'pth intacto', 'hormonio da paratireoide'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'metabolico', 'renal'],
    material: 'Soro ou plasma',
    unidade: 'pg/mL',
    referencias: [{ rotulo: 'Adultos', minimo: 15, maximo: 65, unidade: 'pg/mL', observacao: 'Só se interpreta junto ao cálcio da mesma amostra.' }],
    resumo:
      'O regulador central do cálcio. Seu valor nunca se lê sozinho: o que importa é se ele está apropriado para o cálcio daquele momento.',
    entenda:
      'O PTH é secretado quando o receptor sensor de cálcio da paratireoide percebe queda do cálcio ionizado. Ele então eleva a calcemia por três vias: reabsorção óssea, reabsorção tubular renal de cálcio (com excreção de fosfato) e ativação da vitamina D, que aumenta a absorção intestinal. Toda a interpretação decorre daí: PTH alto com cálcio alto é inapropriado — hiperparatireoidismo primário; PTH alto com cálcio baixo é apropriado — secundário, por deficiência de vitamina D ou doença renal; PTH baixo com cálcio baixo é inapropriado — hipoparatireoidismo.',
    fisiologia: {
      oQueE: 'Peptídeo de 84 aminoácidos secretado pelas glândulas paratireoides.',
      origem: 'Células principais das paratireoides.',
      funcao: 'Elevar o cálcio plasmático e reduzir o fosfato, por ação óssea, renal e — indiretamente, via calcitriol — intestinal.',
      meiaVida: '2 a 4 minutos.',
      orgaosEnvolvidos: ['Paratireoides', 'Osso', 'Rim', 'Intestino'],
      percurso: ['Cálcio ionizado ↓', 'receptor sensor de cálcio', 'PTH ↑', 'reabsorção óssea + reabsorção tubular de cálcio + 1-alfa-hidroxilase renal', 'cálcio ↑ e fosfato ↓'],
    },
    aumento: {
      resumo: 'Hiperparatireoidismo primário (cálcio alto), secundário (cálcio baixo ou normal) ou terciário (autonomia após estímulo crônico).',
      mecanismos: [
        {
          titulo: 'Hiperparatireoidismo primário',
          explicacao: 'Secreção autônoma, independente do cálcio.',
          exemplos: [{ causa: 'Adenoma de paratireoide (85%), hiperplasia, NEM 1 e 2A', etapas: ['secreção autônoma de PTH', 'cálcio ↑ com fosfato ↓', 'hipercalciúria, litíase, osteoporose'], nota: 'Cálcio alto com PTH não suprimido é diagnóstico — nenhuma outra hipercalcemia mantém o PTH elevado.' }],
        },
        {
          titulo: 'Hiperparatireoidismo secundário',
          explicacao: 'O PTH sobe apropriadamente porque o cálcio está baixo ou o fosfato está alto.',
          exemplos: [
            { causa: 'Deficiência de vitamina D', etapas: ['absorção intestinal de cálcio ↓', 'cálcio ionizado ↓', 'PTH ↑ compensatório', 'cálcio sérico mantido às custas do osso'], nota: 'É a causa mais comum de PTH alto com cálcio normal.' },
            { causa: 'Doença renal crônica', etapas: ['retenção de fosfato e queda do calcitriol', 'FGF-23 ↑', 'PTH ↑↑', 'doença mineral e óssea da DRC'] },
          ],
        },
        {
          titulo: 'Hiperparatireoidismo terciário',
          explicacao: 'Após anos de estímulo, a glândula hiperplásica torna-se autônoma.',
          exemplos: [{ causa: 'Doença renal crônica de longa data, pós-transplante renal', etapas: ['hiperplasia paratireoidiana prolongada', 'autonomia', 'PTH ↑↑ com cálcio ↑'] }],
        },
      ],
    },
    reducao: {
      resumo: 'Hipoparatireoidismo pós-cirúrgico ou autoimune, hipomagnesemia e supressão por hipercalcemia de outra causa.',
      mecanismos: [
        {
          titulo: 'Perda ou lesão das glândulas',
          explicacao: 'Sem paratireoides, não há PTH.',
          exemplos: [{ causa: 'Pós-tireoidectomia, autoimune, síndrome de DiGeorge, irradiação cervical', etapas: ['PTH ↓', 'cálcio ↓ com fosfato ↑', 'tetania, parestesias, sinais de Chvostek e Trousseau'] }],
        },
        {
          titulo: 'Hipomagnesemia',
          explicacao: 'O magnésio é necessário para a secreção e a ação periférica do PTH.',
          exemplos: [{ causa: 'Hipomagnesemia', etapas: ['secreção de PTH ↓ e resistência periférica', 'hipocalcemia refratária'], nota: 'Corrigir o magnésio é pré-requisito para corrigir o cálcio.' }],
        },
        {
          titulo: 'Supressão apropriada',
          explicacao: 'Hipercalcemia de outra origem cala a paratireoide.',
          exemplos: [{ causa: 'Hipercalcemia da malignidade, intoxicação por vitamina D, granulomatoses', etapas: ['cálcio ↑', 'PTH suprimido apropriadamente'], nota: 'PTH suprimido com cálcio alto direciona a investigação para malignidade e vitamina D.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'O eixo mineral', ids: ['calcio', 'calcio-ionizado', 'fosforo', 'vitamina-d', 'creatinina'], leitura: 'PTH, cálcio, fósforo, vitamina D e função renal formam um sistema — nenhum se interpreta isolado.' }],
    interferentes: { preAnalitico: ['Deve ser colhido junto ao cálcio da mesma amostra: interpretar PTH com um cálcio de outra data é fonte comum de erro.'] },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['calcio', 'fosforo', 'vitamina-d'],
  },

  {
    id: 'testosterona-total',
    nome: 'Testosterona total e livre',
    sinonimos: ['testosterona', 'testosterona livre', 'testosterona biodisponivel'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro (coleta matinal, entre 7h e 10h)',
    unidade: 'ng/dL',
    referencias: [
      { rotulo: 'Homens adultos', minimo: 300, maximo: 1000, unidade: 'ng/dL', observacao: 'Coleta matinal e em jejum; confirmar com segunda dosagem antes de diagnosticar hipogonadismo.' },
      { rotulo: 'Mulheres adultas', minimo: 15, maximo: 70, unidade: 'ng/dL' },
    ],
    resumo: 'O principal androgênio. Circula quase todo ligado à SHBG — e é por isso que a testosterona total engana quando a SHBG está alterada.',
    entenda:
      'Cerca de 45% da testosterona circula fortemente ligada à SHBG, 53% fracamente ligada à albumina e apenas 2% livre. A fração biodisponível é a livre somada à ligada à albumina. Quando a SHBG está alterada — sobe no envelhecimento, no hipertireoidismo e na hepatopatia; cai na obesidade, no diabetes e no hipotireoidismo — a testosterona total desvia do que a testosterona ativa realmente é. Por isso, em obeso ou idoso com sintomas, a testosterona livre (ou calculada a partir da SHBG) é o exame correto.',
    fisiologia: {
      oQueE: 'Hormônio esteroide androgênico de 19 carbonos.',
      origem: 'Células de Leydig testiculares (95% no homem); ovários e adrenais na mulher.',
      funcao: 'Desenvolvimento e manutenção dos caracteres sexuais masculinos, espermatogênese, massa muscular e óssea, libido e eritropoese.',
      metabolismo: 'Convertida em di-hidrotestosterona pela 5-alfa-redutase e em estradiol pela aromatase.',
      orgaosEnvolvidos: ['Hipotálamo (GnRH)', 'Hipófise (LH e FSH)', 'Testículos', 'Tecido adiposo (aromatase)'],
      percurso: ['GnRH', 'LH hipofisário', 'célula de Leydig', 'testosterona', 'DHT (5-alfa-redutase) ou estradiol (aromatase)'],
    },
    aumento: {
      resumo: 'No homem: uso exógeno e tumores. Na mulher: síndrome dos ovários policísticos, hiperplasia adrenal e tumores.',
      mecanismos: [
        { titulo: 'Uso exógeno', explicacao: 'Aporte externo suprime o eixo.', exemplos: [{ causa: 'Anabolizantes e reposição de testosterona', etapas: ['aporte exógeno', 'LH e FSH suprimidos', 'atrofia testicular e azoospermia'], nota: 'Testosterona alta com LH suprimido em homem jovem sugere uso exógeno.' }] },
        { titulo: 'Hiperandrogenismo na mulher', explicacao: 'Produção ovariana ou adrenal aumentada.', exemplos: [{ causa: 'Síndrome dos ovários policísticos', etapas: ['resistência à insulina e LH ↑', 'produção ovariana de androgênios ↑', 'hirsutismo, acne, oligomenorreia'], nota: 'Testosterona muito alta (> 150 ng/dL na mulher) ou virilização rápida sugere tumor.' }] },
      ],
    },
    reducao: {
      resumo: 'Hipogonadismo primário (LH e FSH altos) ou secundário (LH e FSH baixos ou normais).',
      mecanismos: [
        { titulo: 'Falência testicular', explicacao: 'O testículo não produz e a hipófise cobra.', exemplos: [{ causa: 'Síndrome de Klinefelter, orquite, trauma, quimioterapia, criptorquidia', etapas: ['produção testicular ↓', 'testosterona ↓ com LH e FSH ↑'] }] },
        { titulo: 'Falência do comando', explicacao: 'A hipófise ou o hipotálamo não estimulam.', exemplos: [{ causa: 'Obesidade, opioides, corticoides, hiperprolactinemia, tumor hipofisário, síndrome de Kallmann, doença crônica', etapas: ['GnRH ou LH ↓', 'testosterona ↓ com LH e FSH baixos ou inapropriadamente normais'], nota: 'Obesidade e opioides são causas frequentes e reversíveis de hipogonadismo secundário.' }] },
      ],
    },
    relacionados: [{ titulo: 'Para localizar a lesão', ids: ['fsh', 'shbg', 'prolactina'], leitura: 'LH e FSH separam primário de secundário; a SHBG corrige a interpretação da testosterona total; a prolactina é causa tratável de hipogonadismo central.' }],
    interferentes: {
      fisiologico: ['Ritmo circadiano acentuado: coletar entre 7h e 10h. Doença aguda e privação de sono reduzem transitoriamente.'],
      medicamentos: ['Opioides, corticoides, antipsicóticos e anabolizantes suprimem o eixo.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['fsh', 'shbg', 'prolactina'],
  },

  {
    id: 'shbg',
    nome: 'Globulina ligadora de hormônios sexuais',
    sigla: 'SHBG',
    sinonimos: ['shbg', 'globulina ligadora de esteroides sexuais'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'nmol/L',
    referencias: [
      { rotulo: 'Homens', minimo: 15, maximo: 50, unidade: 'nmol/L' },
      { rotulo: 'Mulheres', minimo: 25, maximo: 120, unidade: 'nmol/L' },
    ],
    resumo: 'A proteína que liga testosterona e estradiol. Determina quanto do hormônio total está de fato disponível.',
    entenda:
      'A SHBG é o motivo pelo qual a testosterona total pode enganar. Ela cai na obesidade, na resistência à insulina, no hipotireoidismo e com androgênios — nesses casos, a testosterona total parece baixa embora a livre esteja adequada. E sobe no envelhecimento, no hipertireoidismo, na hepatopatia e com estrogênios — aí a total parece normal com a livre baixa. Dosá-la permite calcular a testosterona livre e biodisponível.',
    fisiologia: {
      oQueE: 'Glicoproteína hepática de ligação a esteroides sexuais.',
      origem: 'Fígado.',
      funcao: 'Transportar e modular a biodisponibilidade de testosterona, di-hidrotestosterona e estradiol.',
      percurso: ['Síntese hepática (modulada por insulina, tireoide e estrogênios)', 'ligação aos esteroides sexuais', 'regulação da fração livre'],
    },
    aumento: { resumo: 'Envelhecimento, hipertireoidismo, hepatopatia, estrogênios, anticonvulsivantes, HIV e desnutrição.', mecanismos: [{ titulo: 'Síntese hepática aumentada', explicacao: 'Estrogênio e hormônio tireoidiano estimulam a produção.', exemplos: [{ causa: 'Hipertireoidismo, estrogênios, cirrose, idade avançada', etapas: ['síntese hepática ↑', 'SHBG ↑', 'testosterona livre ↓ com total aparentemente normal'] }] }] },
    reducao: { resumo: 'Obesidade, resistência à insulina, hipotireoidismo, androgênios, corticoides e síndrome nefrótica.', mecanismos: [{ titulo: 'Supressão pela insulina', explicacao: 'A insulina inibe a síntese hepática de SHBG.', exemplos: [{ causa: 'Obesidade, síndrome metabólica, diabetes tipo 2', etapas: ['insulina ↑', 'síntese de SHBG ↓', 'testosterona total ↓ com livre preservada'], nota: 'SHBG baixa é um marcador precoce de resistência à insulina.' }] }] },
    relacionados: [{ titulo: 'Para calcular a fração ativa', ids: ['testosterona-total', 'estradiol'], leitura: 'A testosterona livre calculada a partir da total, da SHBG e da albumina é mais fiel que a total em obesos e idosos.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['testosterona-total', 'estradiol'],
  },

  {
    id: 'fsh',
    nome: 'FSH e LH',
    sinonimos: ['fsh', 'lh', 'hormonio foliculo estimulante', 'hormonio luteinizante', 'gonadotrofinas'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'mUI/mL',
    referencias: [
      { rotulo: 'Homens — FSH', minimo: 1.5, maximo: 12, unidade: 'mUI/mL' },
      { rotulo: 'Mulheres — fase folicular', minimo: 3, maximo: 10, unidade: 'mUI/mL' },
      { rotulo: 'Menopausa — FSH', texto: '> 25 a 40', unidade: 'mUI/mL' },
    ],
    resumo: 'As gonadotrofinas hipofisárias. São elas que dizem se um hipogonadismo é da gônada ou do comando.',
    entenda:
      'FSH e LH são o equivalente gonadal do TSH: sobem quando a gônada falha (hipogonadismo hipergonadotrófico) e ficam baixos ou inapropriadamente normais quando a hipófise ou o hipotálamo falham (hipogonadadismo hipogonadotrófico). Na mulher, o momento do ciclo é indispensável para interpretar; na menopausa, o FSH elevado com estradiol baixo confirma a falência ovariana.',
    fisiologia: {
      oQueE: 'Glicoproteínas hipofisárias que compartilham a subunidade alfa com TSH e hCG.',
      origem: 'Gonadotrofos da adeno-hipófise, sob estímulo pulsátil do GnRH.',
      funcao: 'FSH: espermatogênese no homem e crescimento folicular na mulher. LH: produção de testosterona pelas células de Leydig e ovulação com formação do corpo lúteo.',
      percurso: ['GnRH pulsátil', 'FSH e LH hipofisários', 'gônada: gametogênese e esteroidogênese', 'retroalimentação por esteroides sexuais e inibina'],
    },
    aumento: {
      resumo: 'Falência gonadal primária, menopausa e tumores hipofisários produtores.',
      mecanismos: [{ titulo: 'Perda da retroalimentação gonadal', explicacao: 'Sem esteroides sexuais e inibina, a hipófise aumenta as gonadotrofinas.', exemplos: [{ causa: 'Menopausa, insuficiência ovariana prematura, Klinefelter, Turner, quimioterapia, orquite', etapas: ['função gonadal ↓', 'retroalimentação ↓', 'FSH e LH ↑'] }] }],
    },
    reducao: {
      resumo: 'Hipogonadismo hipogonadotrófico — hipofisário, hipotalâmico ou funcional.',
      mecanismos: [
        { titulo: 'Falha central', explicacao: 'GnRH ou gonadotrofinas insuficientes.', exemplos: [{ causa: 'Tumor hipofisário, hiperprolactinemia, síndrome de Kallmann, anorexia, exercício extremo, estresse, opioides, corticoides', etapas: ['GnRH ou gonadotrofinas ↓', 'esteroides sexuais ↓ com FSH e LH baixos'], nota: 'Amenorreia hipotalâmica funcional é diagnóstico de exclusão frequente em atletas e em transtornos alimentares.' }] },
      ],
    },
    relacionados: [{ titulo: 'Para completar o eixo', ids: ['testosterona-total', 'estradiol', 'prolactina'], leitura: 'Gonadotrofinas altas com esteroide baixo = falência gonadal; ambas baixas = causa central, e a prolactina deve ser dosada.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['testosterona-total', 'estradiol', 'prolactina'],
  },

  {
    id: 'estradiol',
    nome: 'Estradiol e progesterona',
    sinonimos: ['estradiol', 'e2', 'progesterona'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'pg/mL',
    referencias: [
      { rotulo: 'Estradiol — fase folicular', minimo: 20, maximo: 150, unidade: 'pg/mL' },
      { rotulo: 'Estradiol — pico ovulatório', minimo: 150, maximo: 400, unidade: 'pg/mL' },
      { rotulo: 'Estradiol — pós-menopausa', texto: '< 30', unidade: 'pg/mL' },
      { rotulo: 'Progesterona — fase lútea (ovulação confirmada)', texto: '> 3 ng/mL', unidade: 'ng/mL', observacao: 'Dosar cerca de 7 dias antes da menstruação esperada.' },
    ],
    resumo: 'Os hormônios do ciclo ovariano. Só se interpretam com a data do ciclo — sem ela, o resultado não significa nada.',
    entenda:
      'O estradiol sobe na fase folicular, atinge o pico antes da ovulação e volta a subir na fase lútea. A progesterona só se eleva após a ovulação, produzida pelo corpo lúteo — e é por isso que a progesterona de fase lútea média acima de 3 ng/mL é a confirmação laboratorial de que houve ovulação. No homem, estradiol elevado (por aromatização periférica na obesidade ou por uso de anabolizantes) causa ginecomastia.',
    fisiologia: {
      oQueE: 'Estradiol: o estrogênio mais potente. Progesterona: esteroide da fase lútea e da manutenção da gestação.',
      origem: 'Células da granulosa (estradiol) e corpo lúteo (progesterona); também no tecido adiposo por aromatização, e na placenta durante a gestação.',
      funcao: 'Proliferação endometrial, caracteres sexuais secundários, mineralização óssea e retroalimentação sobre o eixo (estradiol); transformação secretora do endométrio e manutenção da gestação (progesterona).',
      percurso: ['FSH estimula a granulosa', 'aromatase converte androgênios em estradiol', 'pico de estradiol desencadeia o pico de LH', 'ovulação', 'corpo lúteo produz progesterona'],
    },
    aumento: {
      resumo: 'Gestação, tumores produtores, hiperestimulação ovariana e — no homem — obesidade e uso de anabolizantes.',
      mecanismos: [{ titulo: 'Produção aumentada ou aromatização', explicacao: 'A aromatase do tecido adiposo converte androgênios em estrogênios.', exemplos: [{ causa: 'Obesidade, hepatopatia, anabolizantes, tumores de células da granulosa', etapas: ['aromatização periférica ou produção tumoral ↑', 'estradiol ↑', 'ginecomastia no homem'] }] }],
    },
    reducao: {
      resumo: 'Menopausa, insuficiência ovariana prematura e hipogonadismo central.',
      mecanismos: [{ titulo: 'Falência ovariana ou central', explicacao: 'O folículo não produz, por esgotamento ou falta de estímulo.', exemplos: [{ causa: 'Menopausa, insuficiência ovariana prematura, amenorreia hipotalâmica', etapas: ['produção ovariana ↓', 'estradiol ↓', 'FSH ↑ (ovariana) ou ↓ (central)'] }] }],
    },
    relacionados: [{ titulo: 'Com as gonadotrofinas', ids: ['fsh', 'prolactina', 'tsh'], leitura: 'Amenorreia exige avaliar hCG, TSH, prolactina, FSH e estradiol — nessa ordem.' }],
    interferentes: { preAnalitico: ['O dia do ciclo é parte do exame: sem ele, o resultado é ininterpretável.'] },
    utilidade: ['diagnostico'],
    estudarTambem: ['fsh', 'prolactina', 'beta-hcg'],
  },

  {
    id: 'gh',
    nome: 'GH e IGF-1',
    sinonimos: ['hormonio do crescimento', 'gh', 'somatotropina', 'igf1', 'somatomedina c'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [{ rotulo: 'IGF-1', texto: 'Faixa específica por idade e sexo', unidade: 'ng/mL', observacao: 'O IGF-1 é o exame de escolha: o GH é pulsátil e uma dosagem isolada não vale.' }],
    resumo: 'O eixo somatotrófico. O GH é pulsátil demais para ser dosado isoladamente — quem o representa é o IGF-1, estável ao longo do dia.',
    entenda:
      'O GH é secretado em pulsos, sobretudo no sono profundo, e entre eles pode ser indetectável em pessoa saudável. Por isso a avaliação usa o IGF-1, produzido pelo fígado sob estímulo do GH e com meia-vida longa, refletindo a exposição integrada. Para confirmar acromegalia, faz-se o teste de supressão com sobrecarga de glicose (o GH deveria cair e não cai); para confirmar deficiência, testes de estímulo.',
    fisiologia: {
      oQueE: 'GH: peptídeo hipofisário. IGF-1: fator de crescimento hepático mediador da maior parte dos efeitos do GH.',
      origem: 'Somatotrofos hipofisários (GH); fígado (IGF-1).',
      funcao: 'Crescimento linear, anabolismo proteico, lipólise e resistência à ação da insulina.',
      percurso: ['GHRH hipotalâmico (e somatostatina inibindo)', 'GH hipofisário pulsátil', 'fígado produz IGF-1', 'crescimento e anabolismo tecidual'],
    },
    aumento: {
      resumo: 'Acromegalia e gigantismo, por adenoma hipofisário produtor de GH.',
      mecanismos: [{ titulo: 'Secreção autônoma', explicacao: 'O adenoma produz GH sem controle, elevando o IGF-1.', exemplos: [{ causa: 'Adenoma somatotrófico', etapas: ['GH autônomo', 'IGF-1 ↑', 'acromegalia com diabetes, hipertensão, apneia e cardiomiopatia'], nota: 'A tolerância à glicose alterada e o diabetes são consequências do efeito contrainsulínico do GH.' }] }],
    },
    reducao: {
      resumo: 'Deficiência de GH por doença hipofisária, congênita ou pós-tratamento de tumor.',
      mecanismos: [{ titulo: 'Falha hipofisária', explicacao: 'A hipófise não produz GH.', exemplos: [{ causa: 'Tumor hipofisário, cirurgia, radioterapia, trauma craniano, causas congênitas', etapas: ['GH ↓', 'IGF-1 ↓', 'baixa estatura na criança; alteração de composição corporal e qualidade de vida no adulto'] }] }],
    },
    relacionados: [{ titulo: 'Nos demais eixos hipofisários', ids: ['tsh', 'cortisol', 'prolactina', 'fsh'], leitura: 'Toda doença hipofisária exige avaliar todos os eixos: o corticotrófico é o de risco imediato.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['glicemia-jejum', 'cortisol', 'prolactina'],
  },

  {
    id: 'aldosterona',
    nome: 'Aldosterona e renina',
    sinonimos: ['aldosterona', 'renina', 'atividade de renina plasmatica', 'relacao aldosterona renina'],
    grupo: 'endocrino',
    sistemas: ['endocrino', 'renal', 'cardiovascular'],
    material: 'Soro e plasma, com preparo específico',
    unidade: 'ng/dL',
    referencias: [
      { rotulo: 'Relação aldosterona/renina — rastreio positivo', texto: '> 30 com aldosterona > 15 ng/dL', unidade: 'razão', observacao: 'Exige preparo: corrigir hipocalemia, suspender espironolactona por 4 a 6 semanas e coletar em posição sentada após 15 minutos.' },
    ],
    resumo: 'O eixo mineralocorticoide. A relação aldosterona/renina é o rastreio do hiperaldosteronismo primário — a causa endócrina mais comum de hipertensão secundária.',
    entenda:
      'A renina é liberada pelo aparelho justaglomerular quando a perfusão renal cai, gerando angiotensina II, que estimula a aldosterona. Esta retém sódio e água e excreta potássio. Na hipertensão com hipocalemia espontânea, ou refratária a três fármacos, o hiperaldosteronismo primário deve ser rastreado: nele a aldosterona é autônoma e a renina fica suprimida, elevando a relação entre as duas. É causa potencialmente curável e amplamente subdiagnosticada.',
    fisiologia: {
      oQueE: 'Aldosterona: mineralocorticoide da zona glomerulosa adrenal. Renina: enzima do aparelho justaglomerular renal.',
      origem: 'Córtex adrenal (zona glomerulosa) e rim.',
      funcao: 'Reabsorção de sódio e água e secreção de potássio e H⁺ no túbulo coletor — regulação do volume extracelular e da pressão arterial.',
      orgaosEnvolvidos: ['Rim', 'Adrenal', 'Fígado (angiotensinogênio)', 'Pulmão (ECA)'],
      percurso: ['Queda da perfusão renal', 'renina', 'angiotensinogênio → angiotensina I', 'ECA → angiotensina II', 'aldosterona', 'retenção de sódio e excreção de potássio'],
    },
    aumento: {
      resumo: 'Hiperaldosteronismo primário (renina baixa) ou secundário (renina alta).',
      mecanismos: [
        { titulo: 'Produção adrenal autônoma', explicacao: 'A aldosterona é produzida sem estímulo, e a renina é suprimida pela expansão volêmica resultante.', exemplos: [{ causa: 'Adenoma produtor de aldosterona, hiperplasia adrenal bilateral', etapas: ['aldosterona autônoma', 'retenção de sódio e hipertensão', 'perda de potássio', 'renina suprimida', 'relação aldosterona/renina ↑'], nota: 'Hipertensão com hipocalemia espontânea e alcalose metabólica é o quadro clássico.' }] },
        { titulo: 'Estímulo apropriado (secundário)', explicacao: 'A renina está alta porque o volume arterial efetivo caiu.', exemplos: [{ causa: 'Estenose de artéria renal, insuficiência cardíaca, cirrose, uso de diuréticos, hipovolemia', etapas: ['perfusão renal ↓', 'renina ↑', 'aldosterona ↑ com relação normal'] }] },
      ],
    },
    reducao: {
      resumo: 'Insuficiência adrenal e hipoaldosteronismo hiporreninêmico.',
      mecanismos: [{ titulo: 'Produção reduzida', explicacao: 'A zona glomerulosa não produz, ou a renina não a estimula.', exemplos: [{ causa: 'Doença de Addison, hipoaldosteronismo hiporreninêmico (comum na nefropatia diabética), IECA/BRA e heparina', etapas: ['aldosterona ↓', 'retenção de potássio', 'hipercalemia com acidose metabólica hiperclorêmica (acidose tubular renal tipo 4)'] }] }],
    },
    relacionados: [{ titulo: 'No rastreio da hipertensão secundária', ids: ['potassio', 'sodio', 'bicarbonato', 'creatinina'], leitura: 'Hipertensão com hipocalemia e alcalose metabólica sugere excesso mineralocorticoide; hipercalemia com acidose sugere o oposto.' }],
    interferentes: { medicamentos: ['Espironolactona, IECA/BRA, betabloqueadores, diuréticos e AINEs alteram — o preparo do exame é parte do exame.'] },
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['potassio', 'cortisol', 'sodio'],
  },
]
