import type { Marcador } from '../tipos'

/**
 * Músculo e osso — dois tecidos que só aparecem no laboratório indiretamente.
 *
 * Nenhum exame mede "força muscular" ou "resistência óssea". O que se mede são
 * proteínas que vazam da célula muscular lesada e fragmentos de colágeno
 * liberados durante a remodelação óssea. Essa indireção explica as armadilhas:
 * uma CK alta pode ser exercício, e não miopatia; um CTX alto pode ser
 * simplesmente a coleta feita à tarde e sem jejum.
 *
 * O tema unificador do metabolismo ósseo é que **o osso está sempre sendo
 * destruído e reconstruído**. Os marcadores não dizem quanta massa óssea
 * existe — a densitometria diz isso. Eles dizem a que velocidade ela está
 * mudando, e é por isso que servem para verificar se um tratamento está
 * funcionando semanas depois de iniciado, em vez de esperar dois anos pela
 * densitometria seguinte.
 */
export const marcadores: Marcador[] = [
  {
    id: 'aldolase',
    nome: 'Aldolase',
    sinonimos: ['aldolase', 'aldolase serica', 'aldolase a'],
    grupo: 'muscular',
    sistemas: ['musculoesqueletico'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [{ rotulo: 'Adultos', minimo: 1.0, maximo: 7.6, unidade: 'U/L' }],
    resumo:
      'Enzima glicolítica presente no músculo, no fígado e no cérebro. Complementa a CK na avaliação da miopatia — e ocasionalmente está elevada quando a CK já normalizou.',
    entenda:
      'A aldolase não acrescenta muito quando a CK está francamente elevada: as duas se movem juntas na maioria das miopatias. Seu interesse está nas situações discordantes. Em algumas miopatias inflamatórias, sobretudo naquelas com acometimento predominante do perimísio e da fáscia, a aldolase permanece elevada com CK normal ou pouco alterada — e é ela que sinaliza atividade da doença.',
    aprofundar: [
      'A distinção entre elevação muscular e hepática exige atenção. A aldolase existe em três isoformas: A (músculo), B (fígado) e C (cérebro). O ensaio de rotina mede a atividade total, e hepatopatias a elevam. Diante de aldolase alta, a companhia da CK aponta para músculo; a companhia de ALT com GGT alterada aponta para fígado.',
      'O mesmo raciocínio vale para a AST e a LDH, que sobem em lesão muscular e frequentemente são interpretadas como hepáticas. Um paciente com miopatia pode chegar rotulado como "hepatopatia" por ter AST e ALT elevadas — e a GGT normal com CK alta desfaz o mal-entendido em um instante. A ALT também existe no músculo, ainda que em menor quantidade, o que torna esse erro mais comum do que se supõe.',
      'Na dermatomiosite amiopática, tanto a CK quanto a aldolase podem estar normais apesar de doença ativa e potencialmente grave — o que reforça que nenhum marcador enzimático exclui miopatia inflamatória. O painel de autoanticorpos específicos e a imagem por ressonância cumprem esse papel.',
    ],
    fisiologia: {
      oQueE: 'Enzima da via glicolítica que cliva a frutose-1,6-bifosfato.',
      origem: 'Músculo esquelético (isoforma A), fígado (B) e cérebro (C).',
      funcao: 'Etapa central da glicólise.',
      orgaosEnvolvidos: ['Músculo esquelético', 'Fígado'],
      percurso: ['Enzima citoplasmática do miócito', 'lesão da membrana celular', 'extravasamento para o interstício', 'absorção linfática e plasmática', 'aldolase sérica ↑'],
    },
    aumento: {
      resumo: 'Lesão muscular de qualquer causa, hepatopatia, ou — em títulos altos com CK normal — miopatia inflamatória com acometimento fascial.',
      mecanismos: [
        {
          titulo: 'Extravasamento por lesão de miócito',
          explicacao: 'A ruptura ou o aumento de permeabilidade da membrana muscular liberam enzimas citoplasmáticas na circulação.',
          exemplos: [
            { causa: 'Miopatias inflamatórias', etapas: ['infiltrado inflamatório com necrose de fibras', 'aldolase e CK ↑', 'fraqueza proximal simétrica'], nota: 'Aldolase alta com CK normal ocorre em formas com acometimento perimisial e fascial.' },
            { causa: 'Distrofias musculares e rabdomiólise', etapas: ['destruição extensa de fibras', 'aldolase, CK, AST, LDH e mioglobina ↑', 'risco renal na rabdomiólise'] },
            { causa: 'Hepatopatia', etapas: ['liberação da isoforma B', 'aldolase ↑ com CK normal e transaminases alteradas'], nota: 'A CK é o que separa origem muscular de hepática.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A origem da elevação enzimática', ids: ['ck', 'ast', 'alt', 'ggt', 'ldh'], leitura: 'AST, ALT e LDH altas com CK alta e GGT normal indicam músculo, não fígado — é um dos erros de interpretação mais comuns da bioquímica de rotina.' },
      { titulo: 'Na suspeita de miopatia inflamatória', ids: ['anticorpos-miosite', 'fan'], leitura: 'O painel de anticorpos específicos define o subtipo e prediz acometimento pulmonar e risco neoplásico.' },
    ],
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['ck', 'anticorpos-miosite', 'mioglobina'],
  },

  {
    id: 'marcadores-remodelacao-ossea',
    nome: 'Marcadores de remodelação óssea (CTX, P1NP, osteocalcina e fosfatase alcalina óssea)',
    sigla: 'CTX / P1NP',
    sinonimos: ['ctx', 'ntx', 'telopeptideo', 'p1np', 'osteocalcina', 'fosfatase alcalina ossea', 'marcadores de turnover osseo'],
    grupo: 'osseo',
    sistemas: ['musculoesqueletico', 'metabolico', 'endocrino'],
    material: 'Soro em jejum, colhido pela manhã',
    unidade: 'pg/mL, µg/L e U/L',
    referencias: [
      { rotulo: 'CTX sérico — mulheres na pré-menopausa', texto: '< 0,573', unidade: 'ng/mL' },
      { rotulo: 'CTX — mulheres na pós-menopausa', texto: '< 1,008', unidade: 'ng/mL' },
      { rotulo: 'P1NP', minimo: 15, maximo: 80, unidade: 'µg/L' },
      { rotulo: 'Fosfatase alcalina óssea', minimo: 5, maximo: 25, unidade: 'µg/L' },
      { rotulo: 'Preparo', texto: 'Jejum obrigatório e coleta matinal', unidade: '', observacao: 'O CTX cai até 50% após alimentação e tem variação circadiana ampla — sem esse preparo o resultado não é interpretável.' },
    ],
    resumo:
      'Medem a velocidade da remodelação óssea, não a massa. O CTX marca reabsorção, o P1NP marca formação — e a queda do CTX após iniciar bisfosfonato confirma adesão e resposta em meses, não em anos.',
    entenda:
      'O osso é continuamente reabsorvido por osteoclastos e reconstruído por osteoblastos. Durante a reabsorção, o colágeno tipo I é degradado e seus telopeptídeos C-terminais (CTX) são liberados na circulação. Durante a formação, o pró-colágeno tipo I libera o propeptídeo N-terminal (P1NP). Medir os dois é medir os dois lados do balanço — e a diferença entre eles, ao longo do tempo, é o que determina se a massa óssea cresce ou diminui.',
    aprofundar: [
      'A aplicação mais útil é o acompanhamento terapêutico. A densitometria só detecta mudança significativa após um a dois anos; o CTX cai substancialmente em três meses de bisfosfonato. Isso permite responder cedo duas perguntas práticas: o paciente está tomando a medicação? E ela está funcionando? Uma queda esperada confirma adesão e efeito; a ausência de queda aponta para não adesão, técnica de administração incorreta ou má absorção.',
      'O preparo é decisivo e frequentemente ignorado. O CTX tem ritmo circadiano com pico na madrugada e nadir à tarde, e cai até pela metade após uma refeição — a ingestão de alimento suprime a reabsorção óssea por mecanismo mediado por hormônios intestinais. Uma coleta vespertina sem jejum pode produzir um valor "normal" em alguém com remodelação acelerada.',
      'A fosfatase alcalina óssea tem uso próprio na doença de Paget, em que a remodelação é localmente descontrolada e a enzima atinge valores muito altos, servindo tanto para diagnóstico quanto para monitorar a resposta ao tratamento. Ela também ajuda a esclarecer uma fosfatase alcalina total elevada de origem indeterminada, junto com a GGT e a 5’-nucleotidase.',
      'A osteocalcina é produzida pelo osteoblasto e depende de vitamina K para sua carboxilação. Além de marcador de formação, ela tem função endócrina reconhecida sobre a sensibilidade à insulina — mas sua dosagem clínica de rotina é limitada por instabilidade da amostra e por variabilidade entre métodos.',
      'Um dado de segurança que estes marcadores ajudam a contextualizar: a supressão excessiva e prolongada da remodelação, com CTX muito baixo por anos, associa-se a fraturas atípicas de fêmur e a osteonecrose de mandíbula. É parte do raciocínio que sustenta as pausas terapêuticas após cinco anos de bisfosfonato em pacientes de risco moderado.',
    ],
    fisiologia: {
      oQueE: 'Fragmentos liberados durante a degradação (CTX, NTX) e a síntese (P1NP, osteocalcina, fosfatase alcalina óssea) da matriz de colágeno tipo I.',
      origem: 'Osteoclastos (reabsorção) e osteoblastos (formação).',
      funcao: 'Refletir a taxa de remodelação óssea em curso.',
      eliminacao: 'Depuração renal — acumulam-se na insuficiência renal, o que limita a interpretação.',
      orgaosEnvolvidos: ['Osso', 'Rim', 'Paratireoides'],
      percurso: [
        'Osteoclasto reabsorve matriz óssea',
        'colágeno tipo I degradado libera CTX',
        'osteoblasto sintetiza novo colágeno',
        'pró-colágeno libera P1NP',
        'concentração sérica reflete a velocidade do ciclo',
      ],
    },
    aumento: {
      resumo: 'Remodelação acelerada — pós-menopausa, hiperparatireoidismo, hipertireoidismo, metástase óssea, doença de Paget ou consolidação de fratura.',
      mecanismos: [
        {
          titulo: 'Aceleração do ciclo de remodelação',
          explicacao: 'A perda do freio estrogênico ou o excesso de PTH e de hormônio tireoidiano aumentam o recrutamento e a atividade dos osteoclastos, e a formação acompanha em desequilíbrio.',
          exemplos: [
            { causa: 'Pós-menopausa', etapas: ['queda do estrogênio', 'aumento do RANKL e da atividade osteoclástica', 'CTX e P1NP ↑', 'perda de massa óssea acelerada nos primeiros anos'], nota: 'Marcadores altos predizem perda mais rápida e maior risco de fratura, independentemente da densitometria.' },
            { causa: 'Hiperparatireoidismo e hipertireoidismo', etapas: ['estímulo hormonal direto à remodelação', 'CTX e P1NP ↑ com cálcio e fosfatase alcalina alterados', 'reversão após tratamento da causa'] },
            { causa: 'Metástase óssea e mieloma', etapas: ['ativação osteoclástica pelo tumor', 'CTX ↑↑ com hipercalcemia', 'risco de evento esquelético'] },
            { causa: 'Doença de Paget', etapas: ['remodelação localmente desorganizada e intensa', 'fosfatase alcalina óssea muito elevada', 'monitoramento da resposta ao bisfosfonato pelo mesmo marcador'] },
            { causa: 'Consolidação de fratura recente', etapas: ['formação óssea intensa localizada', 'P1NP ↑ por meses', 'resultado não interpretável para avaliar osteoporose'], nota: 'Aguardar pelo menos 6 meses após fratura para dosar.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Supressão terapêutica da remodelação — o efeito desejado dos antirreabsortivos — ou remodelação baixa por doença adinâmica.',
      mecanismos: [
        {
          titulo: 'Inibição da atividade osteoclástica',
          explicacao: 'Bisfosfonatos e denosumabe reduzem o número e a atividade dos osteoclastos, derrubando o CTX em semanas.',
          exemplos: [
            { causa: 'Tratamento com bisfosfonato ou denosumabe', etapas: ['inibição osteoclástica', 'CTX ↓ substancialmente em 3 meses', 'P1NP ↓ em seguida', 'confirmação de adesão e de resposta'], nota: 'Ausência de queda esperada aponta para não adesão ou má absorção antes de sugerir falha terapêutica.' },
            { causa: 'Doença óssea adinâmica na doença renal crônica', etapas: ['PTH excessivamente suprimido', 'remodelação muito reduzida', 'marcadores baixos com risco de fratura e de calcificação vascular'], nota: 'Nem sempre menos remodelação é melhor — na doença renal, o osso adinâmico é um problema.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel do metabolismo ósseo', ids: ['calcio', 'fosforo', 'pth', 'vitamina-d', 'fosfatase-alcalina'], leitura: 'Cálcio, fósforo, PTH e vitamina D definem a causa do distúrbio; os marcadores de remodelação definem a velocidade e a resposta ao tratamento.' },
      { titulo: 'Antes de tratar osteoporose', ids: ['calcio', 'vitamina-d', 'creatinina', 'tsh'], leitura: 'Corrigir deficiência de vitamina D e excluir causas secundárias — hipertireoidismo, hiperparatireoidismo, doença celíaca — precede a terapia antirreabsortiva.' },
    ],
    advertencia:
      'Sem jejum e sem coleta matinal, o CTX não é interpretável. Os marcadores medem velocidade de remodelação, não massa óssea — não substituem a densitometria no diagnóstico de osteoporose.',
    interferentes: {
      fisiologico: ['Ritmo circadiano acentuado, com nadir vespertino.', 'Alimentação reduz o CTX em até 50%.', 'Fratura recente eleva o P1NP por meses.'],
      medicamentos: ['Antirreabsortivos reduzem acentuadamente; corticoides reduzem a formação e elevam a reabsorção relativa.'],
      metodo: ['Depuração renal — resultados não são interpretáveis na insuficiência renal avançada.'],
    },
    utilidade: ['acompanhamento', 'prognostico'],
    estudarTambem: ['vitamina-d', 'pth', 'calcio', 'fosfatase-alcalina'],
  },

  {
    id: 'vitamina-d-1-25',
    nome: '1,25-di-hidroxivitamina D (calcitriol)',
    sigla: '1,25(OH)₂D',
    sinonimos: ['calcitriol', '1 25 dihidroxivitamina d', 'vitamina d ativa', '1,25 oh2 d'],
    grupo: 'osseo',
    sistemas: ['metabolico', 'renal', 'endocrino'],
    material: 'Soro',
    unidade: 'pg/mL',
    referencias: [{ rotulo: 'Adultos', minimo: 20, maximo: 60, unidade: 'pg/mL' }],
    resumo:
      'A forma ativa da vitamina D — e o exame que **não** se pede para avaliar deficiência. Sua indicação é restrita a hipercalcemias e a distúrbios do fósforo.',
    entenda:
      'Este é um dos equívocos mais frequentes da solicitação laboratorial. Como o calcitriol é a forma ativa, parece intuitivo dosá-lo para avaliar o estado de vitamina D — mas ele tem meia-vida de horas, é rigidamente regulado pelo PTH e pelo fósforo, e frequentemente está **normal ou alto** na deficiência, porque o PTH elevado estimula sua produção. O exame que reflete o estoque corporal é a 25-hidroxivitamina D, com meia-vida de semanas.',
    aprofundar: [
      'A indicação legítima do calcitriol está na investigação da hipercalcemia com PTH suprimido. As doenças granulomatosas — sarcoidose, tuberculose, histoplasmose, beriliose — e alguns linfomas expressam 1-alfa-hidroxilase nos macrófagos ativados, produzindo calcitriol fora do controle do PTH e do fósforo. O resultado é hipercalcemia com PTH baixo e calcitriol alto, um padrão que aponta diretamente para essa etiologia.',
      'A outra indicação é nos distúrbios do fósforo. No raquitismo hipofosfatêmico ligado ao X e na osteomalácia oncogênica, o excesso de FGF-23 inibe a 1-alfa-hidroxilase; o resultado é hipofosfatemia com calcitriol inapropriadamente normal ou baixo — quando deveria estar alto em resposta ao fósforo baixo. Essa "inadequação" é o achado diagnóstico.',
      'Na doença renal crônica, o rim perde a capacidade de produzir calcitriol, e a queda contribui para o hiperparatireoidismo secundário: menos calcitriol significa menos absorção intestinal de cálcio e menos supressão direta da paratireoide. Esse é o racional da reposição de análogos ativos de vitamina D nesses pacientes — que precisam de calcitriol pronto, não de colecalciferol.',
      'Nas intoxicações, a distinção também é útil: a intoxicação por colecalciferol cursa com 25-hidroxivitamina D muito alta e calcitriol normal ou até baixo (por supressão do PTH), enquanto a intoxicação por calcitriol ou por seus análogos cursa com o inverso.',
    ],
    fisiologia: {
      oQueE: 'Metabólito ativo da vitamina D, hormônio esteroide que atua em receptor nuclear.',
      origem: 'Rim, pela 1-alfa-hidroxilase tubular proximal; também macrófagos ativados em doenças granulomatosas.',
      sintese: 'Hidroxilação da 25-hidroxivitamina D na posição 1-alfa, estimulada por PTH e inibida por fósforo e FGF-23.',
      funcao: 'Aumentar a absorção intestinal de cálcio e fósforo e modular a diferenciação óssea e imune.',
      meiaVida: '4 a 15 horas.',
      orgaosEnvolvidos: ['Rim', 'Intestino', 'Osso', 'Paratireoides'],
      percurso: [
        'Pele e dieta fornecem colecalciferol',
        'fígado hidroxila em 25-hidroxivitamina D — o estoque',
        'rim hidroxila em 1,25-di-hidroxivitamina D sob comando do PTH',
        'absorção intestinal de cálcio aumentada',
        'retroalimentação negativa sobre o PTH',
      ],
    },
    aumento: {
      resumo: 'Produção extrarrenal em doenças granulomatosas e linfomas, hiperparatireoidismo primário, ou administração de análogos ativos.',
      mecanismos: [
        {
          titulo: 'Produção fora do controle regulatório',
          explicacao: 'Macrófagos ativados expressam 1-alfa-hidroxilase que não responde ao PTH nem ao fósforo, produzindo calcitriol de forma autônoma.',
          exemplos: [
            { causa: 'Sarcoidose, tuberculose, linfoma', etapas: ['1-alfa-hidroxilase macrofágica ativada', 'calcitriol ↑ sem controle', 'absorção intestinal de cálcio aumentada', 'hipercalcemia com PTH suprimido e hipercalciúria'], nota: 'Hipercalcemia com PTH baixo e calcitriol alto tem esse diagnóstico diferencial estreito.' },
            { causa: 'Hiperparatireoidismo primário', etapas: ['PTH elevado estimula a 1-alfa-hidroxilase', 'calcitriol normal ou alto', 'hipercalcemia com PTH inapropriadamente normal ou elevado'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Doença renal crônica, excesso de FGF-23, hipoparatireoidismo — ou calcitriol inapropriadamente baixo na hipofosfatemia.',
      mecanismos: [
        {
          titulo: 'Falha da hidroxilação renal',
          explicacao: 'A perda de massa renal e o excesso de FGF-23 reduzem a atividade da 1-alfa-hidroxilase.',
          exemplos: [
            { causa: 'Doença renal crônica', etapas: ['perda de 1-alfa-hidroxilase tubular', 'calcitriol ↓', 'absorção intestinal de cálcio reduzida', 'hiperparatireoidismo secundário'], nota: 'Explica por que se repõe análogo ativo, e não colecalciferol, nesses pacientes.' },
            { causa: 'Raquitismo hipofosfatêmico e osteomalácia oncogênica', etapas: ['FGF-23 ↑ inibe a 1-alfa-hidroxilase e a reabsorção tubular de fósforo', 'hipofosfatemia com calcitriol inapropriadamente normal ou baixo', 'osteomalácia e dor óssea'], nota: 'O calcitriol deveria estar alto com fósforo baixo — a ausência dessa resposta é o achado.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O exame que realmente avalia deficiência', ids: ['vitamina-d', 'pth', 'calcio', 'fosforo'], leitura: 'Para avaliar estoque de vitamina D, dose a 25-hidroxivitamina D. O calcitriol responde outra pergunta.' },
      { titulo: 'Na hipercalcemia', ids: ['pth', 'calcio', 'calcio-ionizado'], leitura: 'PTH alto aponta hiperparatireoidismo; PTH baixo com calcitriol alto aponta granulomatose ou linfoma; PTH baixo com calcitriol normal aponta malignidade por PTHrP.' },
    ],
    advertencia:
      'Não solicite a 1,25-di-hidroxivitamina D para avaliar deficiência de vitamina D: ela pode estar normal ou alta na carência. O exame correto é a 25-hidroxivitamina D.',
    utilidade: ['diagnostico'],
    estudarTambem: ['vitamina-d', 'pth', 'calcio', 'fosforo'],
  },
]
