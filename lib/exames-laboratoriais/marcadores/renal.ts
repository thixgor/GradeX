import type { Marcador } from '../tipos'

/**
 * Função renal e urinálise quantitativa.
 *
 * O rim é o órgão que o laboratório enxerga melhor — e o que mais engana quem
 * lê apenas o número. Creatinina "normal" em idoso sarcopênico pode esconder
 * metade da função perdida; ureia alta pode não ter nada a ver com o rim. Por
 * isso as fichas deste grupo insistem na mesma ideia: creatinina não é função
 * renal, é um marcador indireto de filtração cuja produção depende da massa
 * muscular de quem está sendo medido.
 */
export const marcadores: Marcador[] = [
  {
    id: 'creatinina',
    nome: 'Creatinina',
    sinonimos: ['creatinina serica', 'cr'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Soro ou plasma',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Homens adultos', minimo: 0.7, maximo: 1.3, unidade: 'mg/dL' },
      { rotulo: 'Mulheres adultas', minimo: 0.6, maximo: 1.1, unidade: 'mg/dL' },
      { rotulo: 'Crianças', minimo: 0.3, maximo: 0.7, unidade: 'mg/dL', observacao: 'Varia muito com a idade e a estatura — a referência pediátrica sobe conforme a massa muscular.' },
      { rotulo: 'Gestantes', minimo: 0.4, maximo: 0.8, unidade: 'mg/dL', observacao: 'A hiperfiltração fisiológica da gestação derruba a creatinina: 1,0 mg/dL numa gestante já é anormal.' },
    ],
    resumo:
      'Produto final do metabolismo muscular, filtrado pelo glomérulo. Sobe quando a filtração cai — mas seu valor basal depende de quanta massa muscular a pessoa tem.',
    entenda:
      'A creatinina vem da creatina do músculo esquelético, que se converte espontaneamente a uma taxa quase constante — cerca de 1,5% do pool por dia. Ela é livremente filtrada no glomérulo e praticamente não é reabsorvida, o que a torna um bom traçador de filtração. O problema é o outro lado da equação: a produção depende da massa muscular. Um idoso sarcopênico de 50 kg pode ter creatinina de 1,0 mg/dL com metade da função renal perdida, enquanto um jovem musculoso tem 1,3 mg/dL com rins perfeitos. Por isso a creatinina isolada não é função renal — a TFG estimada, que corrige por idade e sexo, é.',
    aprofundar: [
      'A relação entre creatinina e TFG é hiperbólica, não linear, e isso muda a leitura de forma decisiva. Da TFG de 120 para 60 mL/min — metade da função renal perdida — a creatinina sobe apenas de 0,8 para cerca de 1,2 mg/dL, uma variação que passa por "dentro da normalidade". Já de 30 para 15 mL/min ela salta de 2,5 para 5,0 mg/dL. Ou seja: a creatinina é insensível justamente na faixa em que a detecção precoce importaria mais, e exageradamente sensível quando a doença já está avançada.',
      'Existe secreção tubular de creatinina, responsável por 10 a 20% da excreção total. Ela é bloqueada por cimetidina e trimetoprima, que elevam a creatinina sérica sem que a filtração tenha mudado — é elevação real do marcador sem lesão renal. O mesmo vale para o cobicistate e o dolutegravir. Reconhecer isso evita suspender medicações eficazes e investigar uma lesão que não existe.',
      'A cinética explica por que a creatinina atrasa o diagnóstico na lesão renal aguda. Se a filtração cessar completamente agora, a creatinina sobe apenas 1 a 2 mg/dL por dia, porque depende do acúmulo do que continua sendo produzido. Nas primeiras horas de uma necrose tubular aguda, a creatinina pode estar quase normal com o rim já gravemente lesado. Débito urinário e biomarcadores precoces reconhecem o dano antes; a creatinina é retrospectiva por natureza.',
      'A padronização por espectrometria de massa com diluição isotópica (IDMS) reduziu, mas não eliminou, a variação entre métodos. O ensaio de Jaffé sofre interferência de cromógenos não creatinínicos — glicose, corpos cetônicos, bilirrubina, cefalosporinas —, o que superestima o valor em cetoacidose e icterícia. O método enzimático é mais específico. Comparar creatininas de laboratórios diferentes exige saber que o método pode ser outro.',
    ],
    fisiologia: {
      oQueE: 'Anidrido cíclico da creatina, produzido de forma não enzimática e a taxa constante no músculo esquelético.',
      origem: 'Músculo esquelético. A creatina vem da síntese hepática e renal (a partir de glicina, arginina e metionina) e da dieta — carne vermelha, sobretudo.',
      sintese: 'A creatina e a fosfocreatina musculares sofrem ciclização espontânea e irreversível a creatinina, a cerca de 1,5% do pool total por dia.',
      circulacao: 'Circula livre no plasma, sem se ligar a proteínas — por isso é livremente filtrada.',
      funcao: 'Nenhuma. É um produto de excreção, e é justamente essa inércia metabólica que a torna um bom marcador de filtração.',
      metabolismo: 'Não é metabolizada: o que é produzido é excretado.',
      eliminacao: 'Filtração glomerular (80 a 90%) e secreção tubular proximal (10 a 20%).',
      meiaVida: 'Cerca de 4 horas com função renal normal; prolonga-se muito na doença renal avançada.',
      orgaosEnvolvidos: ['Músculo esquelético (produção)', 'Rim (excreção)', 'Fígado (síntese de creatina)'],
      percurso: [
        'Creatina e fosfocreatina musculares',
        'ciclização espontânea (~1,5%/dia)',
        'creatinina na corrente sanguínea',
        'filtração glomerular livre',
        'pequena secreção tubular proximal',
        'urina',
      ],
    },
    aumento: {
      resumo:
        'Ou o rim filtra menos, ou o músculo produz mais, ou algo bloqueou a secreção tubular sem tocar na filtração. Só o primeiro grupo é doença renal.',
      significado:
        'Creatinina alta significa queda da filtração glomerular — depois de excluída produção aumentada e interferência. O que ela não diz é onde: pré-renal, renal ou pós-renal.',
      mecanismos: [
        {
          titulo: 'Queda da filtração — causa pré-renal',
          explicacao:
            'O rim está estruturalmente íntegro, mas chega pouco sangue a ele. A resposta fisiológica é reabsorver ávidamente sódio e água — e, junto, ureia. Daí a assinatura: a ureia sobe proporcionalmente mais que a creatinina.',
          exemplos: [
            { causa: 'Desidratação, hemorragia, vômitos, diarreia', etapas: ['queda do volume circulante efetivo', 'ativação do SRAA e da ADH', 'queda do fluxo plasmático renal', 'TFG ↓', 'creatinina ↑ com ureia/creatinina > 40'], nota: 'Reversível com reposição volêmica — e essa reversibilidade é o que a define.' },
            { causa: 'Insuficiência cardíaca e cirrose descompensada', etapas: ['débito cardíaco baixo ou vasodilatação esplâncnica', 'volume arterial efetivo reduzido', 'vasoconstrição renal', 'TFG ↓'], nota: 'Na síndrome cardiorrenal e na hepatorrenal, o rim está anatomicamente normal.' },
            { causa: 'AINEs, IECA/BRA, ciclosporina', etapas: ['perda da autorregulação glomerular (AINE contrai a aferente; IECA dilata a eferente)', 'queda da pressão de filtração', 'creatinina ↑'], nota: 'Elevação de até 30% após iniciar IECA/BRA é esperada e não exige suspensão — é sinal de efeito hemodinâmico, não de lesão.' },
          ],
        },
        {
          titulo: 'Queda da filtração — lesão renal intrínseca',
          explicacao: 'O parênquima está lesado: glomérulo, túbulo, interstício ou vasos. A capacidade de concentrar urina se perde, e o sódio urinário sobe.',
          exemplos: [
            { causa: 'Necrose tubular aguda (isquemia prolongada, sepse, contraste, rabdomiólise)', etapas: ['lesão do epitélio tubular', 'obstrução intraluminal por cilindros e retrodifusão do filtrado', 'TFG ↓', 'sódio urinário > 40 mEq/L e FENa > 2%'], nota: 'Cilindros granulosos pigmentares no sedimento são o achado clássico.' },
            { causa: 'Glomerulonefrites', etapas: ['inflamação glomerular', 'redução da superfície de filtração', 'creatinina ↑ com hematúria dismórfica, cilindros hemáticos e proteinúria'] },
            { causa: 'Nefrite intersticial alérgica', etapas: ['hipersensibilidade a fármaco', 'infiltrado inflamatório intersticial', 'creatinina ↑ com eosinofilia e leucocitúria estéril'], nota: 'Antibióticos, AINEs e inibidores de bomba de prótons são os agentes mais comuns.' },
            { causa: 'Doença renal crônica de qualquer etiologia', etapas: ['perda progressiva de néfrons', 'TFG ↓ sustentada por mais de 3 meses', 'creatinina ↑ estável ou lentamente progressiva'], nota: 'Anemia normocítica, hiperfosfatemia e PTH alto acompanham e sugerem cronicidade.' },
          ],
        },
        {
          titulo: 'Queda da filtração — causa pós-renal',
          explicacao: 'A urina é formada e não sai. A pressão retrógrada anula o gradiente de filtração.',
          exemplos: [
            { causa: 'Hiperplasia prostática, litíase bilateral, neoplasia pélvica, bexiga neurogênica', etapas: ['obstrução ao fluxo urinário', 'pressão retrógrada no espaço de Bowman', 'queda do gradiente de filtração', 'creatinina ↑'], nota: 'É a causa mais rapidamente reversível — e a que a ultrassonografia resolve em minutos. Anúria alternada com poliúria sugere obstrução.' },
          ],
        },
        {
          titulo: 'Produção aumentada — sem doença renal',
          explicacao: 'Chega mais creatinina ao plasma porque o músculo entregou mais, não porque o rim filtrou menos.',
          exemplos: [
            { causa: 'Rabdomiólise', etapas: ['lise de fibras musculares', 'liberação maciça de creatina e mioglobina', 'creatinina ↑ desproporcional à ureia', 'CK ↑↑'], nota: 'Aqui há os dois: produção aumentada e lesão tubular pela mioglobina.' },
            { causa: 'Massa muscular elevada, exercício intenso, dieta hiperproteica ou ingestão recente de carne', etapas: ['maior pool de creatina', 'maior conversão diária', 'creatinina basal mais alta sem doença'], nota: 'Fisiculturistas e usuários de suplemento de creatina têm creatinina basal mais alta; interpretar como doença renal é erro comum.' },
          ],
        },
        {
          titulo: 'Bloqueio da secreção tubular — elevação sem queda de filtração',
          explicacao:
            'A creatinina sobe porque a via de saída acessória foi bloqueada. A TFG verdadeira não mudou, e a ureia permanece estável — que é a pista.',
          exemplos: [
            { causa: 'Trimetoprima, cimetidina, cobicistate, dolutegravir', etapas: ['inibição competitiva do transportador tubular de cátions orgânicos', 'menos creatinina secretada', 'creatinina sérica ↑ 0,1 a 0,4 mg/dL', 'TFG real inalterada'], nota: 'Elevação estável, precoce e sem ureia acompanhando. Cistatina C, que não usa essa via, confirma que a filtração está preservada.' },
          ],
        },
        {
          titulo: 'Interferência analítica',
          explicacao: 'O método superestima o valor por reação cruzada com outras substâncias.',
          exemplos: [{ causa: 'Cetoacidose, icterícia intensa, algumas cefalosporinas (método de Jaffé)', etapas: ['cromógenos não creatinínicos reagem no ensaio', 'creatinina falsamente ↑'], nota: 'O método enzimático não sofre essa interferência.' }],
        },
      ],
      causas: {
        muitoComuns: ['Desidratação', 'Doença renal crônica (diabetes e hipertensão)', 'AINEs e IECA/BRA'],
        comuns: ['Necrose tubular aguda', 'Insuficiência cardíaca descompensada', 'Obstrução urinária por próstata'],
        menosComuns: ['Glomerulonefrites', 'Nefrite intersticial alérgica', 'Síndrome hepatorrenal'],
        naoEsquecer: ['Rabdomiólise', 'Bloqueio de secreção por trimetoprima ou cimetidina', 'Massa muscular elevada como causa de creatinina basal alta'],
        emergencias: ['Lesão renal aguda com hipercalemia', 'Obstrução urinária bilateral', 'Uremia sintomática'],
      },
    },
    reducao: {
      resumo: 'Creatinina baixa quase nunca é doença do rim — é pouco músculo produzindo, ou muito plasma diluindo.',
      significado:
        'O risco da creatinina baixa é interpretativo: ela mascara a perda de função renal em quem tem pouca massa muscular, e faz doses de fármacos de excreção renal parecerem seguras quando não são.',
      mecanismos: [
        {
          titulo: 'Produção reduzida',
          explicacao: 'Menos músculo, menos creatina, menos creatinina — com filtração igual.',
          exemplos: [
            { causa: 'Sarcopenia do idoso, desnutrição, caquexia neoplásica', etapas: ['massa muscular ↓', 'produção diária ↓', 'creatinina ↓ com TFG possivelmente reduzida'], nota: 'É onde a creatinina mais engana. Cistatina C, que independe do músculo, resolve.' },
            { causa: 'Amputação, doenças neuromusculares, tetraplegia', etapas: ['massa muscular muito reduzida', 'creatinina ↓ persistente'] },
            { causa: 'Hepatopatia avançada', etapas: ['síntese hepática de creatina ↓', 'menos substrato muscular', 'creatinina ↓'], nota: 'Na cirrose, creatinina normal pode acompanhar função renal ruim — o escore MELD subestima o risco por isso.' },
          ],
        },
        {
          titulo: 'Hiperfiltração e diluição',
          explicacao: 'A filtração aumentou, ou o volume plasmático expandiu.',
          exemplos: [
            { causa: 'Gestação', etapas: ['expansão volêmica e hiperfiltração glomerular', 'TFG ↑ em até 50%', 'creatinina ↓ fisiológica'], nota: 'Creatinina de 1,0 mg/dL em gestante é anormal, embora esteja "na referência" do adulto.' },
            { causa: 'Sobrecarga hídrica, SIADH', etapas: ['expansão do volume plasmático', 'creatinina ↓ por diluição'] },
          ],
        },
      ],
    },
    comparacoes: [
      {
        id: 'pre-renal-vs-renal-vs-pos-renal',
        titulo: 'Lesão renal pré-renal × renal intrínseca × pós-renal',
        pergunta: 'A creatinina subiu. Falta perfusão, o parênquima está lesado, ou a urina não está saindo?',
        hipoteses: ['Pré-renal', 'Renal intrínseca (NTA)', 'Pós-renal'],
        linhas: [
          { marcador: 'Relação ureia/creatinina', celulas: ['> 40', '10–20 (normal)', 'variável'] },
          { marcador: 'Sódio urinário', celulas: ['< 20 mEq/L', '> 40 mEq/L', 'variável'] },
          { marcador: 'FENa', celulas: ['< 1%', '> 2%', 'variável'] },
          { marcador: 'Densidade urinária', celulas: ['> 1.020', '~1.010 (isostenúria)', 'variável'] },
          { marcador: 'Osmolalidade urinária', celulas: ['> 500 mOsm/kg', '< 350 mOsm/kg', 'variável'] },
          { marcador: 'Sedimento', celulas: ['normal ou cilindros hialinos', 'cilindros granulosos pigmentares', 'normal ou hematúria'] },
          { marcador: 'Ultrassonografia', celulas: ['normal', 'normal ou rins pequenos se crônica', 'hidronefrose'] },
        ],
        leitura:
          'O eixo é a capacidade tubular de reabsorver sódio. No pré-renal o túbulo está vivo e desesperado por volume: retém sódio (Na urinário baixo, FENa < 1%), concentra a urina (densidade e osmolalidade altas) e arrasta ureia junto — daí a relação ureia/creatinina alta. Na necrose tubular o túbulo está lesado e não consegue reabsorver: perde sódio, não concentra (urina isostenúrica) e descama cilindros. No pós-renal a bioquímica urinária é inconclusiva porque o problema é mecânico — quem responde é a imagem.',
        limites:
          'Diurético em uso invalida o sódio urinário e a FENa (nesse caso, usar a fração de excreção de ureia, com corte < 35% para pré-renal). Doença renal crônica prévia, glomerulonefrite e contraste alteram os índices. Nenhum deles substitui a avaliação clínica de volemia.',
      },
    ],
    relacionados: [
      { titulo: 'Para avaliar função renal de verdade', ids: ['tfg', 'ureia', 'cistatina-c'], leitura: 'A creatinina isolada não é função renal. A TFG estimada corrige por idade e sexo; a cistatina C escapa da dependência de massa muscular; a ureia informa sobre volemia e catabolismo.' },
      { titulo: 'Para avaliar consequências da perda de função', ids: ['potassio', 'bicarbonato', 'fosforo', 'calcio', 'hemoglobina'], leitura: 'A queda da TFG produz hipercalemia, acidose metabólica, hiperfosfatemia, hipocalcemia com PTH alto e anemia por deficiência de eritropoetina. Esse conjunto sugere cronicidade.' },
      { titulo: 'Para localizar a lesão', ids: ['sodio-urinario', 'proteinuria', 'eas'], leitura: 'Sódio urinário e sedimento separam pré-renal de renal intrínseca; a proteinúria quantifica lesão glomerular.' },
    ],
    interferentes: {
      preAnalitico: ['Hemólise e lipemia interferem em alguns ensaios.', 'Refeição rica em carne eleva transitoriamente em até 0,3 mg/dL nas horas seguintes.'],
      fisiologico: ['Massa muscular, sexo, idade, etnia e gestação alteram o valor basal.', 'Exercício intenso eleva transitoriamente.'],
      medicamentos: ['Trimetoprima, cimetidina, cobicistate e dolutegravir elevam por bloqueio da secreção tubular, sem reduzir a TFG.', 'AINEs, IECA/BRA, contraste iodado, aminoglicosídeos, vancomicina, anfotericina e inibidores de calcineurina reduzem a TFG de fato.'],
      metodo: ['O método de Jaffé sofre interferência de cetonas, bilirrubina e cefalosporinas; o enzimático é mais específico. Comparar resultados de laboratórios diferentes exige saber qual método foi usado.'],
    },
    cinetica: {
      inicio: 'Sobe 1 a 2 mg/dL por dia quando a filtração cessa. Nas primeiras horas de lesão aguda pode estar quase normal.',
      normalizacao: 'Após correção de causa pré-renal, cai em 24 a 72 horas. Na necrose tubular, a recuperação leva de 1 a 3 semanas.',
      tendencia: 'A variação entre duas dosagens vale mais que o valor absoluto: um aumento de 0,3 mg/dL em 48 horas já define lesão renal aguda, mesmo dentro da faixa de referência.',
    },
    normalizacao: [
      { cenario: 'Elevação por desidratação ou hipovolemia', caminho: 'Restaurar o volume circulante. Reestabelecida a perfusão, a filtração retorna — não há lesão a curar.', prazo: '24 a 72 horas.' },
      { cenario: 'Elevação após iniciar IECA/BRA', caminho: 'Elevação de até 30% é hemodinâmica e esperada: manter a medicação e reavaliar em 1 a 2 semanas. Acima disso, ou com hipercalemia, reduzir dose e investigar estenose de artéria renal.', prazo: 'Estabiliza em 1 a 2 semanas.' },
      { cenario: 'Necrose tubular aguda', caminho: 'Retirar o agente agressor, manter perfusão e evitar nefrotóxicos. O epitélio tubular se regenera — o tempo é do rim, não do tratamento.', prazo: '1 a 3 semanas, por vezes com fase poliúrica de recuperação.' },
      { cenario: 'Obstrução urinária', caminho: 'Desobstruir. É a causa com a reversão mais rápida e mais completa, desde que precoce.', prazo: 'Horas a dias, com possível poliúria pós-desobstrutiva que exige reposição.' },
      { cenario: 'Doença renal crônica', caminho: 'Não há normalização a esperar: os néfrons perdidos não retornam. O objetivo passa a ser frear a progressão — controle pressórico, IECA/BRA, inibidores de SGLT2, controle glicêmico e evitar nefrotóxicos.', prazo: 'Meta de estabilização, não de normalização.' },
      { cenario: 'Elevação por trimetoprima ou cimetidina', caminho: 'Nada a tratar: a filtração não mudou. Documentar o novo basal e, se necessário, confirmar com cistatina C.', prazo: 'Retorna ao basal em dias após a suspensão.' },
    ],
    utilidade: ['diagnostico', 'rastreamento', 'acompanhamento', 'prognostico'],
    padroes: ['lesao-renal-aguda', 'sindrome-uremica'],
    doencas: ['doenca-renal-cronica', 'lesao-renal-aguda-pre-renal'],
    estudarTambem: ['tfg', 'ureia', 'cistatina-c', 'potassio', 'eas'],
  },

  {
    id: 'ureia',
    nome: 'Ureia',
    sigla: 'BUN',
    sinonimos: ['nitrogenio ureico', 'bun', 'ureia serica'],
    grupo: 'renal',
    sistemas: ['renal', 'hepatobiliar'],
    material: 'Soro ou plasma',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Adultos', minimo: 15, maximo: 45, unidade: 'mg/dL' },
      { rotulo: 'Nitrogênio ureico (BUN)', minimo: 7, maximo: 20, unidade: 'mg/dL', observacao: 'BUN = ureia ÷ 2,14. Laudos internacionais usam BUN; os brasileiros, ureia total.' },
    ],
    resumo:
      'O produto final do metabolismo das proteínas, feito no fígado e excretado pelo rim. Sobe na doença renal — e também sempre que o corpo cataboliza mais proteína ou reabsorve mais água.',
    entenda:
      'A ureia é sintetizada no fígado a partir da amônia gerada na desaminação dos aminoácidos. É filtrada no glomérulo e, diferentemente da creatinina, é parcialmente reabsorvida no túbulo — e essa reabsorção é regulada pelo estado de volume. Quando falta volume, a ADH e a angiotensina II aumentam a reabsorção de água, e a ureia vem junto. É isso que faz a ureia subir mais que a creatinina na desidratação e produz a relação ureia/creatinina acima de 40, uma das pistas mais úteis da nefrologia clínica.',
    aprofundar: [
      'A ureia tem três determinantes independentes: filtração glomerular, oferta de nitrogênio (dieta, catabolismo, sangue no trato digestivo) e estado de volume. Isso a torna pior que a creatinina como marcador de filtração e melhor que ela como marcador de contexto. Ureia desproporcionalmente alta com creatinina normal aponta para desidratação, hemorragia digestiva, catabolismo intenso (corticoide, sepse, trauma) ou dieta hiperproteica. Ureia baixa com creatinina normal aponta para hepatopatia, desnutrição ou sobrecarga hídrica.',
      'Na hemorragia digestiva alta, o sangue no lúmen intestinal é uma carga proteica digerida e absorvida como aminoácidos, convertidos em ureia no fígado. Some-se a hipovolemia, e a ureia sobe de forma marcante enquanto a creatinina mal se move. Relação ureia/creatinina acima de 100 em paciente com melena é altamente sugestiva de sangramento digestivo alto.',
      'Na doença renal crônica avançada, a ureia deixa de ser apenas um marcador e passa a contribuir para os sintomas: a síndrome urêmica — náusea, anorexia, prurido, pericardite, encefalopatia, disfunção plaquetária — correlaciona-se com o acúmulo de solutos nitrogenados, dos quais a ureia é o representante mensurável. É por isso que ela ainda participa da decisão de iniciar diálise, ainda que nenhum valor isolado a indique.',
    ],
    fisiologia: {
      oQueE: 'Diamida do ácido carbônico — a forma atóxica e hidrossolúvel em que o organismo elimina o nitrogênio proveniente das proteínas.',
      origem: 'Fígado, no ciclo da ureia (ciclo de Krebs-Henseleit), dentro do hepatócito periportal.',
      sintese: 'A amônia da desaminação dos aminoácidos entra no ciclo com o CO₂ e é convertida em ureia em cinco passos enzimáticos, com gasto de ATP.',
      circulacao: 'Distribui-se livremente pela água corporal total, sem ligação proteica.',
      funcao: 'Detoxificar a amônia e participar do mecanismo de contracorrente que concentra a urina na medula renal.',
      eliminacao: 'Filtração glomerular, com reabsorção tubular variável (40 a 60%) dependente do estado de volume e da ADH.',
      orgaosEnvolvidos: ['Fígado (síntese)', 'Rim (excreção)', 'Intestino (carga proteica)', 'Músculo (catabolismo)'],
      percurso: [
        'Proteína da dieta e catabolismo tecidual',
        'aminoácidos → desaminação',
        'amônia',
        'ciclo da ureia no fígado',
        'ureia no plasma',
        'filtração glomerular',
        'reabsorção tubular regulada pela ADH',
        'urina',
      ],
    },
    aumento: {
      resumo:
        'Três caminhos independentes: filtra-se menos, oferta-se mais nitrogênio, ou reabsorve-se mais água. A relação com a creatinina diz qual deles predomina.',
      mecanismos: [
        {
          titulo: 'Redução da filtração glomerular',
          explicacao: 'Menos filtrado, mais acúmulo — o mesmo mecanismo da creatinina.',
          exemplos: [{ causa: 'Lesão renal aguda e doença renal crônica', etapas: ['TFG ↓', 'excreção de ureia ↓', 'ureia ↑ proporcional à creatinina (relação 10–20)'] }],
        },
        {
          titulo: 'Reabsorção tubular aumentada — estado hipovolêmico',
          explicacao:
            'A ADH e a angiotensina II aumentam a reabsorção de água no túbulo coletor, e a ureia acompanha por arraste e por difusão facilitada. A creatinina não é reabsorvida — daí a dissociação.',
          exemplos: [
            { causa: 'Desidratação, insuficiência cardíaca, cirrose descompensada', etapas: ['volume arterial efetivo ↓', 'ADH ↑', 'reabsorção de água e ureia ↑', 'ureia/creatinina > 40'], nota: 'É a assinatura da azotemia pré-renal.' },
          ],
        },
        {
          titulo: 'Oferta aumentada de nitrogênio',
          explicacao: 'Chega mais substrato ao ciclo da ureia — de fora ou do próprio corpo.',
          exemplos: [
            { causa: 'Hemorragia digestiva alta', etapas: ['sangue digerido no lúmen', 'absorção de aminoácidos', 'síntese hepática de ureia ↑', 'ureia ↑↑ com creatinina normal'], nota: 'Relação ureia/creatinina acima de 100 com melena é fortemente sugestiva.' },
            { causa: 'Catabolismo aumentado (corticoide, sepse, trauma, queimadura, febre)', etapas: ['proteólise tecidual', 'mais aminoácidos desaminados', 'ureia ↑'] },
            { causa: 'Dieta hiperproteica ou nutrição parenteral rica em aminoácidos', etapas: ['carga proteica ↑', 'ureia ↑ sem doença renal'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Desidratação', 'Doença renal crônica', 'Dieta hiperproteica'],
        comuns: ['Insuficiência cardíaca', 'Corticoterapia', 'Sepse e estados catabólicos'],
        menosComuns: ['Nutrição parenteral hiperproteica'],
        naoEsquecer: ['Hemorragia digestiva alta com creatinina normal'],
        emergencias: ['Síndrome urêmica', 'Sangramento digestivo ativo'],
      },
    },
    reducao: {
      resumo: 'Fígado que não sintetiza, proteína que não chega, ou água que dilui.',
      mecanismos: [
        {
          titulo: 'Falência da síntese hepática',
          explicacao: 'O ciclo da ureia é hepático: fígado insuficiente produz pouca ureia — e a amônia se acumula no lugar.',
          exemplos: [{ causa: 'Insuficiência hepática aguda, cirrose avançada', etapas: ['ciclo da ureia comprometido', 'ureia ↓', 'amônia ↑', 'risco de encefalopatia'], nota: 'Ureia baixa com amônia alta em hepatopata é sinal de gravidade, não de rim saudável.' }],
        },
        {
          titulo: 'Oferta reduzida de nitrogênio',
          explicacao: 'Falta substrato para o ciclo.',
          exemplos: [{ causa: 'Desnutrição proteica, dieta vegetariana estrita, anorexia', etapas: ['ingesta proteica ↓', 'menos amônia gerada', 'ureia ↓'] }],
        },
        {
          titulo: 'Diluição e hiperfiltração',
          explicacao: 'Mais água ou mais filtração derrubam a concentração.',
          exemplos: [
            { causa: 'Gestação', etapas: ['hiperfiltração e expansão volêmica', 'ureia ↓ fisiológica'] },
            { causa: 'SIADH, polidipsia, hiper-hidratação', etapas: ['expansão da água corporal', 'ureia ↓ por diluição e maior excreção'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A relação que muda a conduta', ids: ['creatinina'], leitura: 'Ureia/creatinina acima de 40 aponta causa pré-renal ou carga proteica; entre 10 e 20 sugere lesão renal intrínseca; abaixo de 10 sugere hepatopatia, desnutrição ou sobrecarga hídrica.' },
      { titulo: 'No hepatopata', ids: ['amonia', 'albumina', 'inr'], leitura: 'Ureia baixa com amônia alta indica falência do ciclo da ureia — perda de função sintética, e não benefício renal.' },
    ],
    interferentes: {
      fisiologico: ['Dieta proteica, jejum prolongado, gestação e idade alteram o valor.'],
      medicamentos: ['Corticoides e tetraciclinas elevam por catabolismo; diuréticos elevam por hipovolemia.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['lesao-renal-aguda', 'sindrome-uremica'],
    estudarTambem: ['creatinina', 'tfg', 'sodio', 'amonia'],
  },

  {
    id: 'tfg',
    nome: 'Taxa de filtração glomerular estimada',
    sigla: 'TFGe',
    sinonimos: ['tfg', 'egfr', 'clearance de creatinina', 'filtracao glomerular', 'ckd-epi'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Calculada a partir da creatinina sérica (ou da cistatina C)',
    unidade: 'mL/min/1,73 m²',
    referencias: [
      { rotulo: 'Normal', texto: '≥ 90', unidade: 'mL/min/1,73 m²' },
      { rotulo: 'Estágio 2 — redução leve', texto: '60 a 89', unidade: 'mL/min/1,73 m²', observacao: 'Só caracteriza doença renal se houver lesão associada (proteinúria, alteração de imagem ou sedimento).' },
      { rotulo: 'Estágio 3a / 3b', texto: '45 a 59 / 30 a 44', unidade: 'mL/min/1,73 m²' },
      { rotulo: 'Estágio 4', texto: '15 a 29', unidade: 'mL/min/1,73 m²' },
      { rotulo: 'Estágio 5', texto: '< 15', unidade: 'mL/min/1,73 m²', observacao: 'Falência renal — avaliar terapia de substituição.' },
    ],
    resumo:
      'A estimativa de quanto plasma os glomérulos filtram por minuto. É o que traduz a creatinina em função renal de verdade.',
    entenda:
      'A TFG estimada corrige a creatinina pelos determinantes da sua produção — idade e sexo — usando equações validadas (CKD-EPI é a recomendada). Isso resolve o problema central da creatinina isolada: 1,2 mg/dL em homem de 30 anos corresponde a TFG normal; o mesmo valor em mulher de 80 anos corresponde a doença renal estágio 3. A classificação em estágios não é só nomenclatura: define rastreio de complicações, ajuste de doses e momento de encaminhamento ao nefrologista.',
    aprofundar: [
      'As equações pressupõem estado estável. Numa lesão renal aguda, a creatinina ainda está subindo e não reflete a filtração atual — a TFG calculada superestima grosseiramente a função. Por isso, em paciente instável, o que orienta é a variação da creatinina e o débito urinário, não a TFG estimada.',
      'As equações também assumem produção de creatinina "média" para idade e sexo. Elas erram nos extremos de massa muscular: superestimam a função em sarcopênicos, cirróticos e amputados, e subestimam em pessoas muito musculosas. Nessas situações, a cistatina C — ou a equação combinada creatinina-cistatina C — é mais confiável. As diretrizes atuais recomendaram a remoção do coeficiente de raça das equações, por não haver base fisiológica que a sustente.',
      'A classificação KDIGO cruza dois eixos, e ler só um deles perde metade da informação: a TFG (G1 a G5) e a albuminúria (A1 a A3). Um paciente com TFG de 70 e albuminúria de 500 mg/g tem risco cardiovascular e de progressão muito maior que outro com TFG de 50 e albuminúria normal. A proteinúria não é um detalhe do estadiamento — é metade dele.',
    ],
    fisiologia: {
      oQueE: 'Volume de plasma depurado de uma substância por unidade de tempo, normalizado para 1,73 m² de superfície corporal.',
      origem: 'Resulta da pressão hidrostática do capilar glomerular, da pressão oncótica, do fluxo plasmático renal e da superfície de filtração disponível.',
      funcao: 'É a medida integrada da função excretora renal — o número que resume quantos néfrons estão trabalhando.',
      orgaosEnvolvidos: ['Rim', 'Coração (perfusão)', 'Sistema arterial'],
      percurso: ['Fluxo plasmático renal', 'pressão de ultrafiltração no glomérulo', 'filtrado no espaço de Bowman', 'TFG'],
    },
    aumento: {
      resumo: 'Hiperfiltração — fisiológica na gestação, patológica no diabetes inicial e na obesidade.',
      mecanismos: [
        {
          titulo: 'Hiperfiltração adaptativa',
          explicacao: 'Cada néfron remanescente ou estimulado filtra mais. Compensa a curto prazo e lesa a longo prazo, por hipertensão intraglomerular.',
          exemplos: [
            { causa: 'Diabetes mellitus em fase inicial, obesidade, rim único', etapas: ['vasodilatação da arteríola aferente', 'pressão intraglomerular ↑', 'TFG ↑ transitória', 'lesão glomerular progressiva'], nota: 'A hiperfiltração precede a albuminúria na nefropatia diabética. É o alvo dos inibidores de SGLT2, que restauram o feedback tubuloglomerular.' },
            { causa: 'Gestação', etapas: ['expansão volêmica e vasodilatação renal', 'TFG ↑ em até 50%'], nota: 'Fisiológica e reversível após o parto.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Todas as causas de lesão renal — pré-renal, intrínseca e pós-renal — reduzem a TFG. E o envelhecimento a reduz sem doença.',
      mecanismos: [
        {
          titulo: 'Perda de néfrons funcionantes',
          explicacao: 'Menos unidades filtrantes, menor filtração total.',
          exemplos: [
            { causa: 'Nefropatia diabética e hipertensiva', etapas: ['glomeruloesclerose progressiva', 'perda de superfície de filtração', 'TFG ↓ ao longo de anos'], nota: 'Juntas, são a principal causa de doença renal crônica terminal no mundo.' },
            { causa: 'Glomerulonefrites, doença policística, nefrite intersticial crônica', etapas: ['destruição de néfrons', 'TFG ↓'] },
          ],
        },
        {
          titulo: 'Redução hemodinâmica',
          explicacao: 'Os néfrons estão íntegros, mas a pressão de filtração caiu.',
          exemplos: [{ causa: 'Hipovolemia, insuficiência cardíaca, IECA/BRA, AINEs', etapas: ['queda da pressão de ultrafiltração', 'TFG ↓ reversível'] }],
        },
        {
          titulo: 'Envelhecimento renal',
          explicacao: 'Há perda fisiológica de néfrons com a idade, sem doença.',
          exemplos: [{ causa: 'Senescência renal', etapas: ['perda de ~1 mL/min/ano após os 40 anos', 'TFG ↓ progressiva'], nota: 'Por isso TFG entre 60 e 89 em idoso, sem proteinúria nem alteração de sedimento, não é automaticamente doença renal crônica.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'O estadiamento completo', ids: ['proteinuria', 'albuminuria', 'creatinina'], leitura: 'A classificação KDIGO exige TFG e albuminúria. A albuminúria prediz progressão e risco cardiovascular independentemente da TFG.' },
      { titulo: 'Complicações a rastrear conforme a TFG cai', ids: ['potassio', 'bicarbonato', 'fosforo', 'pth', 'hemoglobina'], leitura: 'A partir do estágio 3, rastreia-se anemia, distúrbio mineral e ósseo, acidose e hipercalemia.' },
    ],
    interferentes: {
      fisiologico: ['Massa muscular, idade, sexo, gestação e dieta afetam a creatinina e, portanto, a estimativa.'],
      medicamentos: ['Fármacos que bloqueiam a secreção tubular de creatinina (trimetoprima, cimetidina, cobicistate) reduzem a TFG estimada sem alterar a real.'],
      metodo: ['A equação exige estado estável: em lesão renal aguda a TFG estimada não vale.', 'CKD-EPI, MDRD e Cockcroft-Gault dão resultados diferentes — o ajuste de dose de fármacos deve seguir a equação recomendada na bula.'],
    },
    utilidade: ['diagnostico', 'rastreamento', 'acompanhamento', 'prognostico'],
    estudarTambem: ['creatinina', 'cistatina-c', 'albuminuria', 'proteinuria'],
  },

  {
    id: 'cistatina-c',
    nome: 'Cistatina C',
    sinonimos: ['cistatina', 'cystatin c'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Soro',
    unidade: 'mg/L',
    referencias: [{ rotulo: 'Adultos', minimo: 0.6, maximo: 1.0, unidade: 'mg/L', observacao: 'Varia com o método; usar sempre a referência do laboratório executor.' }],
    resumo:
      'Proteína produzida por todas as células nucleadas a taxa constante. Estima a filtração glomerular sem depender de massa muscular.',
    entenda:
      'A cistatina C resolve exatamente o ponto cego da creatinina. Por ser produzida por qualquer célula nucleada, sua geração independe de músculo — então funciona bem em idoso sarcopênico, cirrótico, amputado, criança e paciente com doença neuromuscular, situações em que a creatinina superestima a função renal. Também detecta antes a queda da filtração na chamada "faixa cega da creatinina" (TFG entre 60 e 90). Em contrapartida, sofre influência de corticoide, disfunção tireoidiana, obesidade, tabagismo e inflamação — e custa mais.',
    fisiologia: {
      oQueE: 'Proteína de baixo peso molecular (13 kDa), inibidora de proteases da família das cisteína-proteinases.',
      origem: 'Produzida constitutivamente por todas as células nucleadas do organismo, a taxa praticamente constante.',
      funcao: 'Inibir catepsinas — regulando a degradação proteica extracelular.',
      eliminacao: 'Livremente filtrada pelo glomérulo e completamente reabsorvida e catabolizada no túbulo proximal; praticamente não retorna à circulação, e por isso não é dosada na urina como marcador de filtração.',
      orgaosEnvolvidos: ['Todas as células nucleadas (produção)', 'Rim (filtração e catabolismo tubular)', 'Tireoide (influencia a produção)'],
      percurso: ['Células nucleadas', 'cistatina C plasmática', 'filtração glomerular livre', 'reabsorção e degradação tubular proximal'],
    },
    aumento: {
      resumo: 'Queda da filtração glomerular — e, fora do rim, corticoide, hipertireoidismo, obesidade e inflamação.',
      mecanismos: [
        {
          titulo: 'Redução da filtração',
          explicacao: 'Menos filtrado, mais acúmulo plasmático.',
          exemplos: [{ causa: 'Doença renal aguda ou crônica', etapas: ['TFG ↓', 'menos cistatina filtrada', 'cistatina C ↑'], nota: 'Sobe antes da creatinina em quedas discretas de filtração.' }],
        },
        {
          titulo: 'Produção aumentada — sem doença renal',
          explicacao: 'A taxa de produção celular sobe por estímulo hormonal, inflamatório ou metabólico.',
          exemplos: [
            { causa: 'Corticoterapia, hipertireoidismo, obesidade, tabagismo, inflamação sistêmica', etapas: ['produção celular ↑', 'cistatina C ↑ com TFG preservada'], nota: 'É o espelho do problema da creatinina: cada marcador tem seu conjunto próprio de fatores não renais.' },
          ],
        },
      ],
    },
    reducao: { resumo: 'Hipotireoidismo e ciclosporina reduzem a produção.', mecanismos: [{ titulo: 'Produção reduzida', explicacao: 'A síntese celular cai por influência hormonal ou farmacológica.', exemplos: [{ causa: 'Hipotireoidismo, ciclosporina', etapas: ['produção ↓', 'cistatina C ↓ com TFG inalterada'] }] }] },
    relacionados: [
      { titulo: 'Use quando a creatinina não serve', ids: ['creatinina', 'tfg'], leitura: 'Discordância entre a TFG estimada pela creatinina e pela cistatina C é informação: aponta massa muscular atípica ou interferência na secreção tubular. A equação combinada é a mais acurada.' },
    ],
    interferentes: {
      fisiologico: ['Obesidade, tabagismo, idade e função tireoidiana alteram a produção.'],
      medicamentos: ['Corticoides elevam; ciclosporina reduz.'],
    },
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['creatinina', 'tfg'],
  },

  {
    id: 'acido-urico',
    nome: 'Ácido úrico',
    sinonimos: ['uricemia', 'urato'],
    grupo: 'renal',
    sistemas: ['renal', 'metabolico'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Homens', minimo: 3.4, maximo: 7.0, unidade: 'mg/dL' },
      { rotulo: 'Mulheres', minimo: 2.4, maximo: 6.0, unidade: 'mg/dL', observacao: 'O estrogênio é uricosúrico: os valores sobem após a menopausa.' },
    ],
    resumo:
      'Produto final do metabolismo das purinas no ser humano. Sobe quando se produz muito ou — muito mais frequentemente — quando o rim excreta pouco.',
    entenda:
      'Cerca de 90% das hiperuricemias são por subexcreção renal, não por superprodução. Isso explica a companhia habitual do ácido úrico alto: diuréticos tiazídicos e de alça, doença renal crônica, resistência à insulina, obesidade, álcool e desidratação — todos reduzem a excreção tubular. E explica também por que hiperuricemia é tão frequente na síndrome metabólica. Importante: a maioria dos hiperuricêmicos nunca terá gota, e durante a crise aguda de gota o ácido úrico pode estar normal ou até baixo — o diagnóstico é clínico e, idealmente, por cristais no líquido sinovial.',
    fisiologia: {
      oQueE: 'Produto final da degradação das purinas (adenina e guanina) nos primatas, que perderam a uricase por mutação evolutiva.',
      origem: 'Fígado e intestino, a partir de purinas endógenas (turnover celular) e da dieta.',
      sintese: 'Hipoxantina → xantina → ácido úrico, reações catalisadas pela xantina-oxidase — a enzima que o alopurinol inibe.',
      funcao: 'Tem atividade antioxidante plasmática, embora o significado clínico disso seja debatido.',
      eliminacao: 'Dois terços pelo rim (com reabsorção e secreção tubulares complexas, mediadas pelo transportador URAT1) e um terço pelo intestino.',
      orgaosEnvolvidos: ['Fígado', 'Rim', 'Intestino'],
      percurso: ['Purinas da dieta e do turnover celular', 'hipoxantina', 'xantina', 'xantina-oxidase', 'ácido úrico', 'excreção renal (2/3) e intestinal (1/3)'],
    },
    aumento: {
      resumo: 'Excreta-se pouco (a grande maioria) ou produz-se muito (lise celular, dieta, doenças mieloproliferativas).',
      mecanismos: [
        {
          titulo: 'Excreção renal reduzida',
          explicacao: 'O URAT1 reabsorve mais urato quando há hipovolemia, acidose ou competição por ácidos orgânicos (lactato, cetoácidos).',
          exemplos: [
            { causa: 'Diuréticos tiazídicos e de alça', etapas: ['depleção de volume', 'reabsorção proximal aumentada', 'urato ↑'], nota: 'É a causa medicamentosa mais comum de hiperuricemia.' },
            { causa: 'Doença renal crônica', etapas: ['TFG ↓', 'excreção de urato ↓', 'hiperuricemia'] },
            { causa: 'Resistência à insulina e obesidade', etapas: ['insulina estimula a reabsorção tubular de urato e sódio', 'hiperuricemia como componente da síndrome metabólica'] },
            { causa: 'Álcool, jejum, cetoacidose, acidose lática', etapas: ['ácidos orgânicos competem com o urato pela secreção tubular', 'excreção ↓', 'urato ↑'], nota: 'Explica por que a crise de gota costuma seguir libação alcoólica.' },
          ],
        },
        {
          titulo: 'Produção aumentada',
          explicacao: 'Mais purinas entram na via — por destruição celular maciça, por doença proliferativa ou pela dieta.',
          exemplos: [
            { causa: 'Síndrome de lise tumoral', etapas: ['destruição maciça de células neoplásicas', 'liberação de ácidos nucleicos', 'urato ↑↑ com potássio ↑ e fósforo ↑', 'nefropatia por urato'], nota: 'Emergência oncológica: hidratação e rasburicase, não alopurinol isolado.' },
            { causa: 'Doenças mieloproliferativas, psoríase extensa, hemólise crônica', etapas: ['turnover celular ↑', 'mais purinas degradadas', 'urato ↑'] },
            { causa: 'Dieta rica em purinas e frutose', etapas: ['carga de purinas e depleção de ATP hepático pela frutose', 'produção de urato ↑'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Diuréticos', 'Obesidade e síndrome metabólica', 'Álcool'],
        comuns: ['Doença renal crônica', 'Dieta rica em purinas e frutose'],
        menosComuns: ['Doenças mieloproliferativas', 'Psoríase extensa'],
        naoEsquecer: ['Pré-eclâmpsia (o ácido úrico sobe e acompanha a gravidade)'],
        emergencias: ['Síndrome de lise tumoral'],
      },
    },
    reducao: {
      resumo: 'Fármacos uricosúricos, síndrome de Fanconi, SIADH e hepatopatia grave.',
      mecanismos: [
        {
          titulo: 'Excreção aumentada',
          explicacao: 'A reabsorção tubular é bloqueada, farmacologicamente ou por lesão do túbulo proximal.',
          exemplos: [
            { causa: 'Losartana, fenofibrato, altas doses de salicilato, probenecida', etapas: ['inibição do URAT1', 'uricosúria ↑', 'urato ↓'] },
            { causa: 'Síndrome de Fanconi, SIADH', etapas: ['perda tubular generalizada ou expansão volêmica', 'excreção de urato ↑', 'urato ↓'], nota: 'Ácido úrico baixo com hiponatremia favorece SIADH sobre outras causas.' },
          ],
        },
        {
          titulo: 'Produção reduzida',
          explicacao: 'Falta substrato ou falta enzima.',
          exemplos: [{ causa: 'Hepatopatia grave, deficiência de xantina-oxidase, alopurinol', etapas: ['síntese ↓', 'urato ↓'] }],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na síndrome metabólica', ids: ['glicemia-jejum', 'triglicerideos', 'hdl'], leitura: 'Hiperuricemia costuma andar com resistência à insulina, triglicerídeos altos e HDL baixo — a mesma fisiopatologia.' },
      { titulo: 'Na lise tumoral', ids: ['potassio', 'fosforo', 'calcio', 'ldh', 'creatinina'], leitura: 'Urato, potássio e fósforo altos com cálcio baixo e creatinina em elevação, após quimioterapia, definem a síndrome de lise tumoral.' },
    ],
    interferentes: {
      fisiologico: ['Sexo masculino, menopausa, jejum, desidratação e exercício intenso elevam.'],
      medicamentos: ['Tiazídicos, diuréticos de alça, ciclosporina, pirazinamida, etambutol e baixas doses de aspirina elevam; losartana, fenofibrato e probenecida reduzem.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['creatinina', 'potassio', 'fosforo'],
  },

  {
    id: 'proteinuria',
    nome: 'Proteinúria',
    sinonimos: ['proteina urinaria', 'proteinuria de 24 horas', 'relacao proteina creatinina'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Urina de 24 horas ou amostra isolada (relação proteína/creatinina)',
    unidade: 'mg/24h',
    referencias: [
      { rotulo: 'Normal (24 horas)', texto: '< 150', unidade: 'mg/24h' },
      { rotulo: 'Relação proteína/creatinina', texto: '< 200', unidade: 'mg/g', observacao: 'Correlaciona-se bem com a excreção de 24 horas e dispensa a coleta cronometrada.' },
      { rotulo: 'Faixa nefrótica', texto: '> 3.500', unidade: 'mg/24h' },
    ],
    resumo:
      'Proteína na urina. O glomérulo normal é uma barreira quase perfeita — proteinúria significa que essa barreira foi rompida ou que o túbulo parou de reabsorver.',
    entenda:
      'A barreira de filtração glomerular seleciona por tamanho e por carga: repele a albumina, que é grande e aniônica. O pouco que passa é reabsorvido no túbulo proximal. Proteinúria, portanto, tem três origens possíveis. A glomerular (a mais relevante) indica lesão da barreira e é rica em albumina; acima de 3,5 g/24h define faixa nefrótica. A tubular decorre de falha na reabsorção e é composta por proteínas de baixo peso molecular. A de sobrecarga ocorre quando a produção excede a capacidade de reabsorção — cadeias leves no mieloma, mioglobina na rabdomiólise.',
    fisiologia: {
      oQueE: 'Excreção urinária de proteínas acima do limiar fisiológico.',
      origem: 'Filtrado glomerular que escapou à reabsorção tubular, mais proteínas secretadas pelo próprio trato urinário (Tamm-Horsfall).',
      funcao: 'Marcador de integridade da barreira de filtração e da função tubular proximal.',
      percurso: ['Proteínas plasmáticas', 'barreira glomerular (tamanho e carga)', 'filtrado', 'reabsorção tubular proximal', 'urina (< 150 mg/dia)'],
    },
    aumento: {
      resumo: 'Barreira glomerular rompida, túbulo que não reabsorve, ou produção que excede a capacidade de reabsorção.',
      mecanismos: [
        {
          titulo: 'Proteinúria glomerular',
          explicacao: 'A perda de podócitos ou a inflamação da membrana basal deixam passar albumina e proteínas maiores.',
          exemplos: [
            { causa: 'Nefropatia diabética', etapas: ['hiperfiltração e glicação da membrana basal', 'perda de carga aniônica', 'albuminúria progressiva', 'proteinúria franca'], nota: 'A albuminúria é o marcador mais precoce — surge muito antes de a creatinina se mover.' },
            { causa: 'Glomerulopatias primárias (lesão mínima, GESF, membranosa)', etapas: ['lesão podocitária', 'perda maciça de albumina', 'síndrome nefrótica: proteinúria > 3,5 g, hipoalbuminemia, edema e dislipidemia'] },
            { causa: 'Glomerulonefrite aguda, lúpus, vasculites', etapas: ['inflamação glomerular', 'proteinúria com hematúria dismórfica e cilindros hemáticos'], nota: 'Proteinúria com hematúria dismórfica é a assinatura da síndrome nefrítica.' },
          ],
        },
        {
          titulo: 'Proteinúria tubular',
          explicacao: 'A filtração está normal; o túbulo proximal perdeu a capacidade de reabsorver as proteínas pequenas que passam fisiologicamente.',
          exemplos: [{ causa: 'Nefrite intersticial, síndrome de Fanconi, necrose tubular, mieloma com lesão tubular', etapas: ['lesão do túbulo proximal', 'reabsorção de proteínas de baixo peso ↓', 'proteinúria geralmente < 2 g/dia, pobre em albumina'] }],
        },
        {
          titulo: 'Proteinúria de sobrecarga',
          explicacao: 'A concentração plasmática de uma proteína filtrável excede a capacidade de reabsorção tubular.',
          exemplos: [
            { causa: 'Mieloma múltiplo (cadeias leves)', etapas: ['produção monoclonal excessiva', 'filtração maciça', 'cadeias leves na urina'], nota: 'A fita reagente detecta sobretudo albumina e pode ser negativa: exige eletroforese ou pesquisa de proteína de Bence-Jones.' },
            { causa: 'Rabdomiólise (mioglobina) e hemólise intravascular (hemoglobina)', etapas: ['liberação maciça do pigmento', 'filtração e toxicidade tubular', 'proteinúria com fita positiva para sangue sem hemácias no sedimento'] },
          ],
        },
        {
          titulo: 'Proteinúria funcional e benigna',
          explicacao: 'Aumento transitório, sem doença renal.',
          exemplos: [
            { causa: 'Febre, exercício intenso, insuficiência cardíaca, proteinúria ortostática', etapas: ['alteração hemodinâmica glomerular transitória', 'proteinúria < 1 g que desaparece na repetição'], nota: 'Proteinúria ortostática em adolescente: ausente na primeira urina da manhã, presente ao longo do dia. É benigna.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para caracterizar a síndrome', ids: ['albumina', 'creatinina', 'colesterol-total', 'eas'], leitura: 'Proteinúria nefrótica com albumina baixa, colesterol alto e edema caracteriza síndrome nefrótica; proteinúria com hematúria dismórfica e creatinina em elevação caracteriza síndrome nefrítica.' },
    ],
    interferentes: {
      preAnalitico: ['Coleta de 24 horas incompleta subestima — a creatinina urinária no mesmo frasco permite conferir a adequação.', 'Urina muito concentrada ou alcalina produz falso-positivo na fita.'],
      fisiologico: ['Febre, exercício, ortostatismo e gestação elevam transitoriamente.'],
    },
    utilidade: ['diagnostico', 'rastreamento', 'prognostico', 'acompanhamento'],
    estudarTambem: ['albuminuria', 'tfg', 'eas', 'albumina'],
  },

  {
    id: 'albuminuria',
    nome: 'Relação albumina/creatinina urinária',
    sigla: 'RAC',
    sinonimos: ['microalbuminuria', 'albuminuria', 'racu', 'uacr'],
    grupo: 'renal',
    sistemas: ['renal', 'cardiovascular'],
    material: 'Amostra isolada de urina, preferencialmente a primeira da manhã',
    unidade: 'mg/g',
    referencias: [
      { rotulo: 'A1 — normal a levemente aumentada', texto: '< 30', unidade: 'mg/g' },
      { rotulo: 'A2 — moderadamente aumentada', texto: '30 a 300', unidade: 'mg/g', observacao: 'A antiga "microalbuminúria". O termo caiu em desuso por sugerir uma albumina pequena, que não existe.' },
      { rotulo: 'A3 — gravemente aumentada', texto: '> 300', unidade: 'mg/g' },
    ],
    resumo:
      'O marcador mais precoce de lesão glomerular e um preditor independente de risco cardiovascular — mesmo com creatinina e TFG normais.',
    entenda:
      'A albuminúria detecta a lesão da barreira de filtração anos antes de a TFG cair. No diabetes, é o primeiro sinal laboratorial de nefropatia. Mas seu valor vai além do rim: albuminúria elevada indica disfunção endotelial sistêmica e prediz eventos cardiovasculares independentemente da função renal. Por isso entra no estadiamento KDIGO como eixo próprio, e por isso sua redução é alvo terapêutico — IECA/BRA e inibidores de SGLT2 reduzem a albuminúria e, com ela, a progressão renal e o risco cardiovascular.',
    fisiologia: {
      oQueE: 'Excreção urinária de albumina, normalizada pela creatinina urinária para corrigir a diluição da amostra.',
      origem: 'Albumina plasmática que atravessou a barreira glomerular e escapou à reabsorção tubular.',
      funcao: 'Marcador de integridade da barreira de filtração e da função endotelial.',
      percurso: ['Albumina plasmática', 'barreira glomerular íntegra a repele', 'lesão endotelial e podocitária', 'passagem de albumina', 'albuminúria'],
    },
    aumento: {
      resumo: 'Lesão glomerular precoce, hipertensão, disfunção endotelial — e, transitoriamente, febre, exercício e descompensação glicêmica.',
      mecanismos: [
        {
          titulo: 'Lesão da barreira glomerular',
          explicacao: 'A perda de carga aniônica e de integridade podocitária deixa passar albumina.',
          exemplos: [
            { causa: 'Nefropatia diabética', etapas: ['hiperglicemia crônica', 'glicação da membrana basal e hiperfiltração', 'perda de seletividade de carga', 'albuminúria progressiva'], nota: 'Rastreamento anual: desde o diagnóstico no diabetes tipo 2; a partir do 5º ano no tipo 1.' },
            { causa: 'Hipertensão arterial', etapas: ['pressão intraglomerular ↑', 'lesão endotelial', 'albuminúria'] },
          ],
        },
        {
          titulo: 'Elevações transitórias',
          explicacao: 'Alterações hemodinâmicas passageiras aumentam a passagem de albumina sem lesão estrutural.',
          exemplos: [{ causa: 'Febre, exercício, infecção urinária, hiperglicemia aguda, insuficiência cardíaca descompensada', etapas: ['alteração hemodinâmica glomerular', 'albuminúria transitória'], nota: 'Por isso o diagnóstico exige duas de três amostras alteradas em intervalo de 3 a 6 meses.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'Estadiamento e risco', ids: ['tfg', 'creatinina', 'glicemia-jejum', 'hba1c'], leitura: 'TFG e albuminúria juntas definem o risco de progressão; controle glicêmico e pressórico são o que muda esse risco.' },
    ],
    interferentes: {
      preAnalitico: ['Amostra da primeira urina da manhã reduz a interferência do ortostatismo.'],
      fisiologico: ['Exercício nas 24 horas anteriores, febre, menstruação e infecção urinária elevam.'],
    },
    utilidade: ['rastreamento', 'prognostico', 'acompanhamento'],
    estudarTambem: ['tfg', 'proteinuria', 'creatinina'],
  },

  {
    id: 'sodio-urinario',
    nome: 'Sódio urinário',
    sinonimos: ['na urinario', 'sodio na urina', 'fena', 'fracao de excrecao de sodio'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Amostra isolada de urina ou urina de 24 horas',
    unidade: 'mEq/L',
    referencias: [
      { rotulo: 'Amostra isolada', texto: 'Depende da ingesta — interpretar sempre no contexto', unidade: 'mEq/L' },
      { rotulo: 'Sugestivo de causa pré-renal', texto: '< 20', unidade: 'mEq/L' },
      { rotulo: 'Sugestivo de lesão tubular', texto: '> 40', unidade: 'mEq/L' },
    ],
    resumo:
      'Mede se o túbulo está retendo ou perdendo sódio. É o exame que separa hipovolemia de lesão tubular — e que orienta a investigação da hiponatremia.',
    entenda:
      'O sódio urinário responde a duas perguntas distintas, conforme o contexto. Na lesão renal aguda: o túbulo está tentando reter volume (sódio urinário baixo, causa pré-renal) ou perdeu essa capacidade (sódio alto, necrose tubular)? Na hiponatremia: o rim está retendo sódio porque falta volume (sódio urinário baixo) ou o está excretando apesar da hiponatremia, o que aponta SIADH ou perda renal de sal (sódio alto)? A fração de excreção de sódio (FENa) refina a leitura ao corrigir pela creatinina, mas perde validade em uso de diurético — nesse caso usa-se a fração de excreção de ureia.',
    fisiologia: {
      oQueE: 'Concentração de sódio na urina, resultante do balanço entre filtração e reabsorção tubular.',
      origem: 'Sódio filtrado no glomérulo e reabsorvido em cerca de 99% ao longo do néfron, sob controle da aldosterona e do peptídeo natriurético.',
      funcao: 'Reflete diretamente o estado de volume efetivo e a integridade tubular.',
      percurso: ['Sódio filtrado', 'reabsorção no túbulo proximal (65%)', 'alça de Henle (25%)', 'túbulo distal e coletor (aldosterona)', 'excreção urinária (~1%)'],
    },
    aumento: {
      resumo: 'O túbulo não está reabsorvendo — por lesão, por diurético, por excesso de volume ou por SIADH.',
      mecanismos: [
        {
          titulo: 'Lesão tubular',
          explicacao: 'O epitélio lesado não consegue reabsorver sódio, mesmo diante de hipovolemia.',
          exemplos: [{ causa: 'Necrose tubular aguda', etapas: ['lesão do epitélio tubular', 'reabsorção de sódio ↓', 'sódio urinário > 40 mEq/L e FENa > 2%'] }],
        },
        {
          titulo: 'Bloqueio farmacológico ou hormonal da reabsorção',
          explicacao: 'A reabsorção é inibida por fármaco ou pela ausência de aldosterona.',
          exemplos: [
            { causa: 'Diuréticos', etapas: ['bloqueio do transportador tubular', 'natriurese', 'sódio urinário ↑'], nota: 'Invalida a interpretação da FENa — usar a fração de excreção de ureia.' },
            { causa: 'Insuficiência adrenal', etapas: ['aldosterona ↓', 'reabsorção distal de sódio ↓', 'perda renal de sal com hiponatremia e hipercalemia'] },
          ],
        },
        {
          titulo: 'SIADH',
          explicacao: 'A volemia está normal ou levemente expandida; o rim excreta sódio normalmente enquanto retém água.',
          exemplos: [{ causa: 'SIADH', etapas: ['ADH inapropriadamente alta', 'retenção de água livre', 'hiponatremia com sódio urinário > 40 mEq/L e osmolalidade urinária alta'], nota: 'Sódio urinário alto com hiponatremia e euvolemia é o achado que sustenta o diagnóstico.' }],
        },
      ],
    },
    reducao: {
      resumo: 'O rim está retendo sódio — porque falta volume efetivo, em qualquer cenário.',
      mecanismos: [
        {
          titulo: 'Ávida retenção de sódio',
          explicacao: 'O SRAA está ativado e o túbulo reabsorve quase todo o sódio filtrado.',
          exemplos: [
            { causa: 'Desidratação, hemorragia, perdas digestivas', etapas: ['volume efetivo ↓', 'aldosterona ↑', 'sódio urinário < 20 mEq/L e FENa < 1%'] },
            { causa: 'Insuficiência cardíaca, cirrose, síndrome nefrótica', etapas: ['volume arterial efetivo ↓ apesar do edema', 'retenção ávida de sódio', 'sódio urinário baixo com paciente edemaciado'], nota: 'Edema com sódio urinário baixo parece contraditório e não é: o volume circulante efetivo está reduzido.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para investigar hiponatremia', ids: ['sodio', 'osmolalidade-urinaria', 'acido-urico'], leitura: 'Sódio urinário e osmolalidade urinária, somados à avaliação de volemia, distinguem SIADH de hipovolemia e de polidipsia.' },
      { titulo: 'Para localizar a lesão renal aguda', ids: ['creatinina', 'ureia', 'eas'], leitura: 'Sódio urinário baixo com ureia/creatinina alta aponta pré-renal; sódio alto com cilindros granulosos aponta necrose tubular.' },
    ],
    interferentes: {
      medicamentos: ['Qualquer diurético invalida a interpretação por dias.'],
      fisiologico: ['A ingesta de sal do dia anterior determina o valor em pessoa saudável — o exame só faz sentido dentro de uma pergunta clínica.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['creatinina', 'sodio', 'ureia'],
  },
]
