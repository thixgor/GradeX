import type { Marcador } from '../tipos'

/**
 * Função renal — segunda linha, e a urina como exame de sangue.
 *
 * A creatinina responde uma pergunta só: quanto o rim está filtrando *agora*,
 * com um atraso de um a dois dias e uma dependência incômoda da massa
 * muscular. Tudo o que este arquivo acrescenta serve para responder as
 * perguntas que ela não responde.
 *
 * A mais importante delas é **onde** está o problema. Um rim hipoperfundido e
 * um rim com túbulo necrosado produzem a mesma creatinina alta e a mesma
 * oligúria — mas produzem urinas completamente diferentes. O rim
 * hipoperfundido está funcionando: ele reabsorve sódio avidamente, concentra a
 * urina, e a fração de excreção de sódio despenca. O rim com necrose tubular
 * perdeu essa capacidade: excreta sódio como se não precisasse dele. Medir o
 * sódio na urina é, nesse contexto, medir se o túbulo ainda está vivo.
 */
export const marcadores: Marcador[] = [
  {
    id: 'tfg-estimada',
    nome: 'Taxa de filtração glomerular estimada (CKD-EPI, MDRD, Cockcroft-Gault)',
    sigla: 'TFGe',
    sinonimos: ['tfg estimada', 'ckd-epi', 'ckd epi', 'mdrd', 'cockcroft gault', 'clearance estimado', 'egfr', 'filtracao glomerular'],
    grupo: 'renal',
    sistemas: ['renal', 'metabolico'],
    material: 'Cálculo a partir da creatinina sérica',
    unidade: 'mL/min/1,73 m²',
    referencias: [
      { rotulo: 'Normal (G1)', texto: '≥ 90', unidade: 'mL/min/1,73 m²' },
      { rotulo: 'G2 — redução leve', texto: '60 a 89', unidade: 'mL/min/1,73 m²' },
      { rotulo: 'G3a / G3b', texto: '45 a 59 / 30 a 44', unidade: 'mL/min/1,73 m²' },
      { rotulo: 'G4 — redução grave', texto: '15 a 29', unidade: 'mL/min/1,73 m²' },
      { rotulo: 'G5 — falência renal', texto: '< 15', unidade: 'mL/min/1,73 m²' },
    ],
    resumo:
      'Converte a creatinina num número que significa algo: quanto plasma o rim depura por minuto. É a base do estadiamento da doença renal crônica e do ajuste de praticamente toda dose de medicamento.',
    entenda:
      'A creatinina isolada engana porque depende da massa muscular. Uma senhora de 80 anos com 45 kg e creatinina de 1,1 mg/dL tem função renal muito pior que um homem de 30 anos com a mesma creatinina — ela simplesmente produz menos creatinina para excretar. As equações de estimativa corrigem isso incorporando idade e sexo, e é por isso que o laudo deve sempre trazer a TFG estimada ao lado da creatinina.',
    aprofundar: [
      'As equações não são intercambiáveis e servem a propósitos distintos. A CKD-EPI é a mais acurada em toda a faixa e é a recomendada para estadiamento de doença renal crônica. A MDRD subestima valores acima de 60 e foi abandonada para essa faixa. A Cockcroft-Gault, apesar de mais antiga e menos acurada, ainda é usada para ajuste de dose de alguns fármacos porque foi com ela que os estudos de farmacocinética foram feitos — usar CKD-EPI nesses casos pode alterar a dose recomendada.',
      'Um detalhe que muda a conduta na beira do leito: o resultado é normalizado para 1,73 m² de superfície corporal. Para ajustar dose de medicamento em pacientes com peso muito distante da média — obesidade grave, caquexia —, é preciso **desnormalizar**, multiplicando pela superfície corporal real e dividindo por 1,73. Prescrever com a TFG normalizada em um paciente de 140 kg subestima a dose adequada.',
      'As equações não valem na lesão renal aguda. Elas pressupõem estado de equilíbrio entre produção e excreção de creatinina, e na fase aguda esse equilíbrio não existe: a creatinina ainda está subindo quando a filtração já caiu a quase zero. Nas primeiras 24 a 48 horas, a TFG estimada superestima grosseiramente a função real — e é por isso que os critérios de lesão renal aguda usam a **variação** da creatinina e o débito urinário, não a TFG.',
      'A retirada do coeficiente de raça das equações, adotada internacionalmente em 2021, corrigiu uma distorção real: o fator elevava artificialmente a TFG estimada de pessoas negras, retardando encaminhamento nefrológico e entrada em lista de transplante. Fórmulas atuais não incluem raça.',
    ],
    fisiologia: {
      oQueE: 'Estimativa matemática do volume de plasma depurado de creatinina por unidade de tempo, a partir da creatinina sérica, idade e sexo.',
      origem: 'Derivada da creatinina, produto do metabolismo muscular.',
      funcao: 'Traduzir a creatinina em uma medida de função renal comparável entre pessoas de massas musculares diferentes.',
      orgaosEnvolvidos: ['Rim', 'Músculo esquelético'],
      percurso: [
        'Creatina muscular convertida em creatinina de forma constante',
        'creatinina livremente filtrada no glomérulo',
        'pequena secreção tubular adicional',
        'concentração sérica em equilíbrio inversamente proporcional à filtração',
        'equação corrige por idade e sexo para estimar a TFG',
      ],
    },
    aumento: {
      resumo: 'TFG estimada alta pode ser hiperfiltração real — ou massa muscular reduzida gerando creatinina falsamente baixa.',
      mecanismos: [
        {
          titulo: 'Hiperfiltração glomerular',
          explicacao: 'Nas fases iniciais do diabetes e na gestação, a pressão intraglomerular aumenta e a filtração sobe acima do normal — o que precede, e não afasta, a doença renal.',
          exemplos: [
            { causa: 'Nefropatia diabética incipiente', etapas: ['hiperglicemia dilata a arteríola aferente', 'pressão intraglomerular ↑', 'TFG acima de 130 mL/min/1,73 m²', 'albuminúria surge apesar da filtração alta'], nota: 'TFG normal ou alta com albuminúria já é doença renal — o estadiamento usa os dois eixos.' },
            { causa: 'Gestação', etapas: ['expansão volêmica e vasodilatação renal', 'TFG ↑ em 40 a 50%', 'creatinina cai para valores que num não gestante seriam "baixos"'], nota: 'Creatinina de 1,0 mg/dL numa gestante já indica disfunção renal.' },
          ],
        },
        {
          titulo: 'Superestimação por baixa produção de creatinina',
          explicacao: 'Menos massa muscular significa menos creatinina produzida, e a equação lê isso como filtração melhor do que é.',
          exemplos: [
            { causa: 'Sarcopenia, amputação, paralisia, desnutrição, cirrose', etapas: ['produção de creatinina reduzida', 'creatinina sérica baixa apesar de filtração ruim', 'TFG estimada falsamente alta'], nota: 'Nesses pacientes, a cistatina C estima melhor a função renal por não depender de massa muscular.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Perda real de função — aguda ou crônica — ou superestimação da creatinina por massa muscular alta ou interferência.',
      mecanismos: [
        {
          titulo: 'Perda de néfrons funcionantes',
          explicacao: 'A redução do número de glomérulos funcionantes diminui a depuração total, elevando a creatinina em equilíbrio.',
          exemplos: [
            { causa: 'Doença renal crônica', etapas: ['perda progressiva de néfrons', 'hiperfiltração compensatória dos remanescentes', 'esgotamento da reserva', 'TFG em declínio ao longo de anos'], nota: 'A queda dos primeiros 50% de função quase não altera a creatinina — a curva é hiperbólica, não linear.' },
            { causa: 'Lesão renal aguda', etapas: ['queda abrupta da filtração', 'creatinina sobe com atraso de 24 a 48 horas', 'TFG estimada não é válida nessa fase'], nota: 'Use variação de creatinina e débito urinário, não TFG estimada.' },
          ],
        },
        {
          titulo: 'Subestimação por creatinina falsamente alta',
          explicacao: 'Massa muscular grande, ingestão recente de carne e fármacos que bloqueiam a secreção tubular elevam a creatinina sem que a filtração tenha mudado.',
          exemplos: [
            { causa: 'Trimetoprima, cimetidina, dolutegravir, cobicistate', etapas: ['bloqueio da secreção tubular de creatinina', 'creatinina sobe em 10 a 30%', 'filtração glomerular inalterada', 'TFG estimada falsamente reduzida'], nota: 'Elevação que aparece nos primeiros dias do fármaco e estabiliza — não é nefrotoxicidade.' },
            { causa: 'Atleta, uso de creatina, ingestão recente de carne', etapas: ['produção ou aporte de creatinina aumentados', 'creatinina alta com função normal'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Os dois eixos do estadiamento', ids: ['creatinina', 'albuminuria', 'cistatina-c'], leitura: 'A doença renal crônica se estadia por TFG **e** albuminúria. A cistatina C é a alternativa quando a massa muscular torna a creatinina não confiável.' },
      { titulo: 'As consequências da perda de função', ids: ['potassio', 'bicarbonato', 'fosforo', 'pth', 'hemoglobina'], leitura: 'Hipercalemia, acidose, hiperfosfatemia, hiperparatireoidismo secundário e anemia surgem em faixas previsíveis de TFG — cada um tem seu estágio típico.' },
    ],
    advertencia:
      'A TFG estimada não é válida na lesão renal aguda, em extremos de massa muscular ou em amputados. Para ajuste de dose em pesos extremos, desnormalize pela superfície corporal real.',
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    estudarTambem: ['creatinina', 'cistatina-c', 'albuminuria'],
  },

  {
    id: 'fracao-excrecao-sodio',
    nome: 'Fração de excreção de sódio e de ureia',
    sigla: 'FeNa / FeUr',
    sinonimos: ['fena', 'fracao de excrecao de sodio', 'feureia', 'fracao de excrecao de ureia', 'feur'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Urina e sangue simultâneos (amostra isolada)',
    unidade: '%',
    referencias: [
      { rotulo: 'FeNa — pré-renal', texto: '< 1', unidade: '%' },
      { rotulo: 'FeNa — necrose tubular aguda', texto: '> 2', unidade: '%' },
      { rotulo: 'FeUreia — pré-renal (válida em uso de diurético)', texto: '< 35', unidade: '%' },
      { rotulo: 'FeUreia — necrose tubular aguda', texto: '> 50', unidade: '%' },
    ],
    resumo:
      'Mede que proporção do sódio filtrado o rim está deixando escapar. Responde a pergunta central da lesão renal aguda: o túbulo ainda está funcionando?',
    entenda:
      'A fórmula parece árida mas a ideia é simples: compara-se quanto sódio saiu na urina com quanto foi filtrado, usando a creatinina como referência de volume filtrado. Um rim hipoperfundido percebe a hipovolemia, ativa renina-angiotensina-aldosterona e reabsorve quase todo o sódio — a FeNa cai abaixo de 1%. Um rim com túbulo necrosado não consegue reabsorver: o sódio escapa e a FeNa sobe acima de 2%. O exame não mede o glomérulo; mede a integridade do túbulo.',
    aprofundar: [
      'A grande limitação é o diurético, e ela é frequente: o paciente com insuficiência cardíaca descompensada e piora da função renal quase sempre está em uso de furosemida, que força a excreção de sódio e eleva a FeNa mesmo com o túbulo intacto. É exatamente aí que entra a fração de excreção de ureia: a ureia é reabsorvida no túbulo proximal, onde a furosemida não age (ela age na alça de Henle). A FeUreia permanece baixa na hipovolemia mesmo sob diurético — e resolve a dúvida que a FeNa não resolve.',
      'Existem falsos "pré-renais" com túbulo intacto e causa não hipovolêmica: a glomerulonefrite aguda cursa com FeNa baixa porque o problema é glomerular e o túbulo continua reabsorvendo avidamente; a síndrome hepatorrenal também, por vasoconstrição renal intensa; e a nefropatia por contraste e a rabdomiólise, nas primeiras horas, podem cursar com FeNa baixa apesar de haver lesão tubular em curso.',
      'A FeNa não se aplica à doença renal crônica: com poucos néfrons remanescentes, cada um precisa excretar mais sódio para manter o balanço, e a fração de excreção basal já é fisiologicamente alta. O exame só faz sentido na avaliação de lesão aguda com oligúria.',
    ],
    fisiologia: {
      oQueE: 'Proporção do sódio (ou da ureia) filtrado que é efetivamente excretado, calculada com sódio e creatinina séricos e urinários.',
      origem: 'Reflete a atividade de reabsorção tubular no momento da coleta.',
      funcao: 'Distinguir hipoperfusão renal com túbulo íntegro de lesão tubular estabelecida.',
      orgaosEnvolvidos: ['Túbulo proximal', 'Alça de Henle', 'Túbulo distal'],
      percurso: [
        'Sódio filtrado no glomérulo',
        'reabsorção em proporção regulada por aldosterona e volemia',
        'excreção do excedente',
        'a razão entre excretado e filtrado revela o estado do túbulo',
      ],
    },
    aumento: {
      resumo: 'Túbulo incapaz de reabsorver sódio — necrose tubular aguda, nefrite intersticial, diurético, doença renal crônica.',
      mecanismos: [
        {
          titulo: 'Perda da capacidade de reabsorção tubular',
          explicacao: 'Células tubulares lesadas perdem os transportadores de sódio e a polaridade de membrana, e o sódio filtrado escapa.',
          exemplos: [
            { causa: 'Necrose tubular aguda por isquemia ou nefrotoxina', etapas: ['lesão das células tubulares', 'perda dos transportadores de sódio', 'FeNa > 2% com cilindros granulosos na urina', 'oligúria que não responde a volume'], nota: 'Prova de volume que não melhora a diurese com FeNa alta indica lesão instalada, não hipovolemia.' },
            { causa: 'Uso de diurético de alça', etapas: ['bloqueio do cotransportador na alça de Henle', 'natriurese forçada', 'FeNa elevada com túbulo íntegro'], nota: 'Aqui a FeUreia é quem responde corretamente.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Rim ávido por sódio — hipovolemia, insuficiência cardíaca, cirrose, glomerulonefrite ou síndrome hepatorrenal.',
      mecanismos: [
        {
          titulo: 'Reabsorção tubular máxima',
          explicacao: 'A queda do volume circulante efetivo ativa o eixo renina-angiotensina-aldosterona, e o túbulo reabsorve praticamente todo o sódio filtrado.',
          exemplos: [
            { causa: 'Azotemia pré-renal por hipovolemia', etapas: ['perda de volume ou baixo débito', 'ativação de renina-angiotensina-aldosterona', 'reabsorção ávida de sódio e água', 'FeNa < 1%, urina concentrada, relação ureia/creatinina > 40'], nota: 'Responde à reposição volêmica — é a razão de fazer a distinção.' },
            { causa: 'Síndrome hepatorrenal', etapas: ['vasodilatação esplâncnica na cirrose', 'vasoconstrição renal intensa', 'FeNa muito baixa, frequentemente < 0,1%', 'não responde a volume'], nota: 'Pré-renal fisiologicamente, mas sem hipovolemia verdadeira — o tratamento é vasoconstritor esplâncnico e albumina.' },
            { causa: 'Glomerulonefrite aguda', etapas: ['lesão glomerular com túbulo preservado', 'reabsorção tubular mantida', 'FeNa baixa apesar de doença renal intrínseca'], nota: 'É a exceção clássica que impede usar a FeNa isoladamente.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A avaliação da lesão renal aguda', ids: ['creatinina', 'ureia', 'sodio-urinario', 'eas'], leitura: 'FeNa e FeUreia dizem sobre o túbulo; o sedimento urinário diz sobre o tipo de lesão — cilindros granulosos indicam necrose tubular, hemáticos indicam glomerulonefrite, leucocitários indicam nefrite intersticial.' },
    ],
    advertencia:
      'FeNa não é interpretável em uso de diurético (use FeUreia) nem na doença renal crônica. Glomerulonefrite e síndrome hepatorrenal produzem FeNa baixa apesar de doença renal intrínseca.',
    utilidade: ['diagnostico'],
    estudarTambem: ['sodio-urinario', 'creatinina', 'ureia', 'eas'],
  },

  {
    id: 'relacao-proteina-creatinina',
    nome: 'Relação proteína/creatinina e albumina/creatinina urinárias',
    sigla: 'RPC / RAC',
    sinonimos: ['relacao proteina creatinina', 'rpc', 'relacao albumina creatinina', 'rac', 'acr', 'microalbuminuria', 'proteinuria de amostra isolada'],
    grupo: 'renal',
    sistemas: ['renal', 'metabolico'],
    material: 'Amostra isolada de urina, preferencialmente a primeira da manhã',
    unidade: 'mg/g de creatinina',
    referencias: [
      { rotulo: 'Albumina/creatinina — A1 (normal a levemente aumentada)', texto: '< 30', unidade: 'mg/g' },
      { rotulo: 'A2 — moderadamente aumentada', texto: '30 a 300', unidade: 'mg/g' },
      { rotulo: 'A3 — gravemente aumentada', texto: '> 300', unidade: 'mg/g' },
      { rotulo: 'Proteína/creatinina — faixa nefrótica', texto: '> 3.500', unidade: 'mg/g' },
    ],
    resumo:
      'Substitui a coleta de 24 horas com acurácia equivalente e sem o erro mais comum da nefrologia ambulatorial: a coleta incompleta.',
    entenda:
      'A ideia é dividir a proteína pela creatinina na mesma amostra. Como a creatinina é excretada em ritmo praticamente constante — cerca de 1 grama por dia num adulto médio —, a razão entre as duas em uma amostra qualquer estima quanto de proteína sairia em 24 horas. Isso elimina a dependência do volume urinário e, sobretudo, elimina a coleta de 24 horas, que na prática é feita errada com muita frequência.',
    aprofundar: [
      'A distinção entre albumina e proteína total não é redundância. A albuminúria é o marcador precoce da lesão glomerular do diabetes e da hipertensão, e é ela que integra o estadiamento da doença renal crônica e prediz risco cardiovascular. A proteinúria total capta também proteínas de baixo peso — e é por isso que, na suspeita de mieloma, a albuminúria pode ser normal enquanto a proteinúria total está francamente elevada: as cadeias leves não são albumina. Uma dissociação entre proteinúria alta e albuminúria baixa deve levar à imunofixação urinária.',
      'A albuminúria é um marcador de disfunção endotelial, não apenas renal. Sua presença prediz eventos cardiovasculares independentemente da TFG, e sua redução sob tratamento com inibidores do sistema renina-angiotensina ou com inibidores de SGLT2 se associa a melhor desfecho renal e cardiovascular. É um dos poucos marcadores em que a resposta terapêutica tem valor prognóstico próprio.',
      'A confirmação exige repetição: um resultado alterado deve ser confirmado em duas de três amostras num intervalo de três a seis meses. Exercício intenso nas 24 horas anteriores, febre, infecção urinária, insuficiência cardíaca descompensada, hiperglicemia acentuada e menstruação elevam transitoriamente e produzem falso-positivo.',
      'A proteinúria ortostática é uma armadilha em adolescentes: proteinúria presente durante o dia e ausente na primeira urina da manhã, após repouso noturno. É benigna e não requer investigação — e a comparação entre a amostra matinal e uma amostra vespertina faz esse diagnóstico sem nenhum exame adicional.',
    ],
    fisiologia: {
      oQueE: 'Razão entre a concentração de proteína (ou albumina) e a de creatinina na mesma amostra de urina.',
      origem: 'A proteína vem de filtração glomerular aumentada ou de reabsorção tubular deficiente; a creatinina, do metabolismo muscular.',
      funcao: 'Estimar a excreção diária de proteína sem coleta cronometrada.',
      orgaosEnvolvidos: ['Glomérulo', 'Túbulo proximal'],
      percurso: [
        'Barreira glomerular normalmente retém a albumina por tamanho e carga',
        'lesão da barreira permite passagem',
        'túbulo proximal reabsorve parte do filtrado',
        'excedente aparece na urina',
        'razão com a creatinina normaliza o efeito da diluição',
      ],
    },
    aumento: {
      resumo: 'Lesão glomerular, sobrecarga de proteínas filtradas, falha de reabsorção tubular — ou elevação transitória fisiológica.',
      mecanismos: [
        {
          titulo: 'Perda da barreira glomerular',
          explicacao: 'A lesão do podócito e da membrana basal permite a passagem de albumina, que normalmente é retida por tamanho e por carga elétrica.',
          exemplos: [
            { causa: 'Nefropatia diabética', etapas: ['hiperglicemia e hiperfiltração', 'lesão do podócito e espessamento da membrana basal', 'albuminúria progressiva de A2 para A3', 'queda posterior da TFG'], nota: 'A albuminúria aparece anos antes da queda da filtração — é o marcador precoce.' },
            { causa: 'Síndrome nefrótica', etapas: ['lesão podocitária extensa', 'proteína/creatinina > 3.500 mg/g', 'hipoalbuminemia, edema e dislipidemia', 'risco trombótico aumentado'] },
          ],
        },
        {
          titulo: 'Sobrecarga e falha tubular',
          explicacao: 'Proteínas de baixo peso filtradas em excesso ultrapassam a capacidade de reabsorção; a lesão tubular reduz essa capacidade mesmo com filtração normal.',
          exemplos: [
            { causa: 'Mieloma múltiplo', etapas: ['cadeias leves livres filtradas em excesso', 'proteinúria total alta com albuminúria baixa', 'lesão tubular por cilindros'], nota: 'A dissociação entre os dois exames é a pista — a fita reagente é praticamente cega para cadeias leves.' },
            { causa: 'Nefrite intersticial e síndrome de Fanconi', etapas: ['reabsorção proximal comprometida', 'proteinúria tubular com beta-2-microglobulina urinária alta', 'albuminúria proporcionalmente baixa'] },
          ],
        },
        {
          titulo: 'Elevação transitória',
          explicacao: 'Situações que aumentam a pressão glomerular ou a permeabilidade capilar produzem proteinúria passageira sem doença renal.',
          exemplos: [
            { causa: 'Exercício intenso, febre, infecção urinária, insuficiência cardíaca descompensada', etapas: ['aumento transitório da permeabilidade glomerular', 'proteinúria que desaparece com a resolução do quadro'], nota: 'Confirme em duas de três amostras antes de diagnosticar.' },
            { causa: 'Proteinúria ortostática', etapas: ['proteinúria presente em amostra diurna', 'ausente na primeira urina da manhã', 'condição benigna de adolescentes'], nota: 'A comparação entre as duas amostras é todo o diagnóstico.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O estadiamento completo', ids: ['tfg-estimada', 'creatinina', 'albuminuria'], leitura: 'A doença renal crônica é classificada em duas dimensões — TFG e albuminúria. Um paciente com TFG normal e albuminúria A3 já tem doença renal e risco elevado.' },
      { titulo: 'Quando a proteinúria não é albumina', ids: ['imunofixacao', 'cadeias-leves-livres', 'beta-2-microglobulina'], leitura: 'Proteinúria alta com albuminúria baixa aponta para cadeias leves (glomerular por sobrecarga) ou para proteínas de baixo peso (tubular).' },
    ],
    utilidade: ['triagem', 'diagnostico', 'prognostico', 'acompanhamento'],
    estudarTambem: ['albuminuria', 'proteinuria', 'tfg-estimada'],
  },

  {
    id: 'eletrolitos-urinarios',
    nome: 'Eletrólitos urinários (sódio, potássio, cloro, cálcio, creatinina)',
    sigla: 'Na⁺/K⁺/Cl⁻ urinários',
    sinonimos: ['eletrolitos urinarios', 'potassio urinario', 'cloro urinario', 'calcio urinario', 'creatinina urinaria', 'anion gap urinario'],
    grupo: 'renal',
    sistemas: ['renal', 'metabolico'],
    material: 'Amostra isolada ou urina de 24 horas',
    unidade: 'mEq/L e mg/24h',
    referencias: [
      { rotulo: 'Sódio urinário — hipovolemia', texto: '< 20', unidade: 'mEq/L' },
      { rotulo: 'Potássio urinário — perda extrarrenal de potássio', texto: '< 20 mEq/L (ou < 15 mEq/24h)', unidade: 'mEq/L' },
      { rotulo: 'Cloro urinário — alcalose responsiva a salina', texto: '< 20', unidade: 'mEq/L' },
      { rotulo: 'Cálcio urinário de 24h', texto: 'Homens < 300; mulheres < 250', unidade: 'mg/24h' },
      { rotulo: 'Creatinina urinária de 24h', texto: 'Homens 20–25; mulheres 15–20', unidade: 'mg/kg/24h', observacao: 'Serve para verificar se a coleta de 24 horas foi completa — valor muito abaixo indica coleta perdida.' },
    ],
    resumo:
      'A urina responde perguntas que o sangue não responde: se a perda de um eletrólito é renal ou extrarrenal, se a alcalose responde a soro fisiológico, e se a coleta de 24 horas foi realmente completa.',
    entenda:
      'O princípio é sempre o mesmo: diante de uma alteração eletrolítica no sangue, pergunta-se o que o rim está fazendo com aquele íon. Se o potássio está baixo e a urina quase não tem potássio, o rim está poupando corretamente — a perda é intestinal. Se o potássio está baixo e a urina está cheia dele, o rim é o culpado. Uma única dosagem separa diarreia de hiperaldosteronismo, vômito de diurético, e assim por diante.',
    aprofundar: [
      'O cloro urinário é o exame mais elegante e mais subutilizado deste grupo. Ele classifica a alcalose metabólica em dois grupos com tratamentos opostos. Cloro urinário abaixo de 20 mEq/L indica alcalose **responsiva a salina**: vômitos, aspiração nasogástrica, uso prévio de diurético — o rim está retendo cloro porque falta volume, e soro fisiológico corrige. Acima de 20 indica alcalose **resistente a salina**: hiperaldosteronismo, síndrome de Bartter ou Gitelman, uso atual de diurético — e aqui soro fisiológico não corrige e pode piorar.',
      'A creatinina urinária de 24 horas tem uma função de controle de qualidade que quase nunca é usada: ela verifica se a coleta foi completa. Um adulto excreta 15 a 25 mg de creatinina por quilo por dia, com bastante previsibilidade. Se a coleta de um homem de 70 kg traz apenas 700 mg de creatinina, quando deveria trazer cerca de 1.500, a coleta perdeu metade do volume — e todos os demais resultados daquele frasco estão subestimados pela metade. Verificar isso antes de interpretar qualquer exame de 24 horas evita conclusões erradas.',
      'O ânion gap urinário (sódio + potássio − cloro) estima indiretamente a excreção de amônio, e por isso distingue as acidoses metabólicas hiperclorêmicas. Valor negativo significa muito amônio na urina — o rim está compensando, e a perda de bicarbonato é intestinal (diarreia). Valor positivo significa pouco amônio — o rim não está acidificando, e a causa é acidose tubular renal.',
      'O cálcio urinário separa duas condições que se confundem: a hipercalcemia hipocalciúrica familiar, benigna, cursa com cálcio urinário muito baixo e não deve ser operada; o hiperparatireoidismo primário cursa com cálcio urinário normal ou alto. Operar uma hipercalcemia hipocalciúrica familiar por engano é um erro cirúrgico evitável por uma dosagem barata.',
    ],
    fisiologia: {
      oQueE: 'Concentrações dos principais íons na urina, refletindo o manejo tubular no momento da coleta.',
      origem: 'Resultado da filtração glomerular seguida de reabsorção e secreção tubulares reguladas.',
      funcao: 'Revelar a resposta renal a um distúrbio eletrolítico ou ácido-básico sistêmico.',
      orgaosEnvolvidos: ['Túbulo proximal', 'Alça de Henle', 'Túbulo coletor'],
      percurso: [
        'Íon filtrado no glomérulo',
        'reabsorção regulada por aldosterona, ADH e volemia',
        'secreção ajustada conforme necessidade',
        'concentração urinária final revela a intenção do rim',
      ],
    },
    aumento: {
      resumo: 'Perda renal do íon — o rim é a via da perda, não a vítima dela.',
      mecanismos: [
        {
          titulo: 'Perda tubular do íon',
          explicacao: 'Excreção urinária alta na vigência de concentração sérica baixa indica que o rim está eliminando o que deveria conservar.',
          exemplos: [
            { causa: 'Hipocalemia com potássio urinário > 20 mEq/L', etapas: ['perda renal de potássio', 'causas: diurético, hiperaldosteronismo, Bartter, Gitelman, anfotericina', 'a pressão arterial e o estado ácido-básico refinam o diagnóstico'], nota: 'Hipocalemia + hipertensão + alcalose sugere hiperaldosteronismo; sem hipertensão, sugere Bartter, Gitelman ou diurético oculto.' },
            { causa: 'Hiponatremia com sódio urinário > 40 mEq/L e urina concentrada', etapas: ['secreção inapropriada de ADH', 'água retida com excreção de sódio mantida', 'osmolalidade urinária alta apesar de plasma diluído'], nota: 'A combinação sódio urinário alto + osmolalidade urinária alta + euvolemia define a SIADH.' },
            { causa: 'Hipercalciúria', etapas: ['excreção de cálcio > 300 mg/24h no homem ou 250 na mulher', 'risco de nefrolitíase', 'causas: idiopática, hiperparatireoidismo, sarcoidose, acidose tubular renal tipo 1'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Rim conservando o íon corretamente — a perda é extrarrenal, ou o estímulo de retenção é intenso.',
      mecanismos: [
        {
          titulo: 'Conservação tubular apropriada',
          explicacao: 'A excreção urinária baixa indica que o rim reconheceu o déficit e está poupando — a origem do problema está fora dele.',
          exemplos: [
            { causa: 'Hipocalemia com potássio urinário < 20 mEq/L', etapas: ['perda gastrointestinal (diarreia, laxante) ou aporte insuficiente', 'rim conserva potássio adequadamente', 'conduta: tratar a causa digestiva'] },
            { causa: 'Alcalose metabólica com cloro urinário < 20 mEq/L', etapas: ['vômitos ou aspiração nasogástrica', 'contração de volume com retenção ávida de cloro', 'alcalose responsiva a soro fisiológico'], nota: 'É a dicotomia que decide o tratamento da alcalose metabólica.' },
            { causa: 'Hipercalcemia com cálcio urinário muito baixo', etapas: ['hipercalcemia hipocalciúrica familiar', 'mutação no receptor sensor de cálcio', 'condição benigna', 'paratireoidectomia contraindicada'], nota: 'A dosagem evita uma cirurgia desnecessária.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O par sangue-urina', ids: ['sodio', 'potassio', 'cloro', 'bicarbonato'], leitura: 'Cada eletrólito sérico alterado tem uma pergunta urinária correspondente: o rim é a causa ou a vítima?' },
      { titulo: 'Na avaliação ácido-básica', ids: ['anion-gap', 'ph', 'bicarbonato'], leitura: 'O ânion gap urinário complementa o plasmático: ele diz se o rim está excretando amônio adequadamente na acidose hiperclorêmica.' },
    ],
    advertencia:
      'Sempre verifique a completude de uma coleta de 24 horas pela creatinina urinária antes de interpretar qualquer outro analito do mesmo frasco.',
    interferentes: {
      medicamentos: ['Diuréticos alteram profundamente todos os eletrólitos urinários — o resultado reflete o fármaco, não a fisiologia basal.'],
      preAnalitico: ['Coleta de 24 horas incompleta subestima todos os analitos proporcionalmente.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['sodio-urinario', 'potassio', 'fracao-excrecao-sodio', 'anion-gap'],
  },

  {
    id: 'ngal-kim1',
    nome: 'Biomarcadores de lesão tubular (NGAL e KIM-1)',
    sigla: 'NGAL / KIM-1',
    sinonimos: ['ngal', 'kim-1', 'kim1', 'lipocalina associada a gelatinase de neutrofilos', 'biomarcadores de lesao renal aguda'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Urina ou plasma',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'NGAL urinário', texto: '< 20 (corte dependente do método e do contexto)', unidade: 'ng/mL' },
      { rotulo: 'KIM-1 urinário', texto: 'Faixa dependente do método', unidade: 'ng/mL' },
    ],
    resumo:
      'Marcam a lesão da célula tubular no momento em que ela acontece — horas antes de a creatinina se mover. Respondem "há lesão?", enquanto a creatinina responde "a filtração já caiu?".',
    entenda:
      'A creatinina é um marcador de função, e por isso chega atrasada: ela só sobe depois que a filtração já caiu, o que leva 24 a 48 horas. Nesse intervalo, o rim já está lesado e nenhum exame de rotina revela. O NGAL e o KIM-1 são proteínas que a própria célula tubular passa a expressar quando é agredida, e aparecem na urina em 2 a 6 horas. A analogia útil é com a troponina: houve um período em que o infarto só era detectado pela repercussão, até que um marcador de lesão celular mudou a janela.',
    aprofundar: [
      'A promessa clínica é grande, mas a incorporação à prática permanece limitada por dois problemas honestos: os pontos de corte variam entre populações e métodos, e — mais importante — detectar a lesão mais cedo só muda o desfecho se houver uma intervenção capaz de modificá-lo. Nas cirurgias cardíacas e no uso de contraste, contextos em que o momento da agressão é conhecido, os marcadores têm melhor desempenho e mais utilidade prática.',
      'O NGAL tem uma limitação importante: além do túbulo, ele é produzido por neutrófilos ativados, e sobe na sepse e em inflamações sistêmicas mesmo sem lesão renal. Em unidade de terapia intensiva — exatamente onde seria mais útil — essa interferência reduz sua especificidade. O KIM-1 é mais específico do túbulo proximal, mas se eleva mais tardiamente.',
      'O conceito que esses marcadores introduziram é conceitualmente relevante mesmo onde eles não estão disponíveis: existe lesão renal sem queda de função e queda de função sem lesão. O paciente pré-renal tem função caindo com túbulo íntegro; o paciente com nefrotoxicidade precoce tem lesão sem creatinina alterada. Pensar nesses dois eixos separadamente é melhor medicina do que pensar só em creatinina.',
    ],
    fisiologia: {
      oQueE: 'NGAL: lipocalina expressa por células tubulares lesadas e por neutrófilos. KIM-1: glicoproteína transmembrana induzida no túbulo proximal após lesão.',
      origem: 'Células do túbulo proximal e da alça de Henle; NGAL também de neutrófilos.',
      funcao: 'Participam da resposta de reparo tubular e do sequestro de ferro após a lesão.',
      orgaosEnvolvidos: ['Túbulo proximal', 'Alça de Henle'],
      percurso: [
        'Agressão isquêmica ou tóxica à célula tubular',
        'indução rápida da expressão gênica de NGAL e KIM-1',
        'liberação no lúmen tubular',
        'detecção urinária em 2 a 6 horas',
        'creatinina só se altera 24 a 48 horas depois',
      ],
    },
    aumento: {
      resumo: 'Lesão tubular aguda em curso — ou, no caso do NGAL, inflamação sistêmica sem lesão renal.',
      significado: 'Elevação precede a alteração da creatinina e identifica quem terá lesão renal aguda antes de ela ser mensurável pelos exames convencionais.',
      mecanismos: [
        {
          titulo: 'Indução gênica na célula tubular agredida',
          explicacao: 'A lesão ativa programas de estresse celular que induzem essas proteínas em minutos a horas, muito antes de qualquer alteração funcional detectável.',
          exemplos: [
            { causa: 'Lesão renal aguda pós-cirurgia cardíaca', etapas: ['isquemia-reperfusão durante circulação extracorpórea', 'NGAL urinário ↑ em 2 a 6 horas', 'creatinina só sobe no segundo dia', 'janela para ajuste hemodinâmico e suspensão de nefrotóxicos'] },
            { causa: 'Nefrotoxicidade por aminoglicosídeo, vancomicina, anfotericina ou contraste', etapas: ['lesão direta do túbulo proximal', 'KIM-1 e NGAL ↑', 'oportunidade de suspender ou ajustar o fármaco antes da perda funcional'] },
            { causa: 'Sepse sem lesão renal', etapas: ['neutrófilos ativados produzem NGAL', 'elevação sistêmica sem lesão tubular', 'falso-positivo'], nota: 'É a principal limitação do NGAL no ambiente em que ele seria mais útil.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A comparação com o padrão atual', ids: ['creatinina', 'tfg-estimada', 'fracao-excrecao-sodio'], leitura: 'Creatinina mede função com atraso; NGAL e KIM-1 medem lesão em tempo real; a FeNa diz se o túbulo ainda reabsorve.' },
      { titulo: 'Outros marcadores tubulares', ids: ['beta-2-microglobulina'], leitura: 'A beta-2-microglobulina urinária mede falha de reabsorção proximal e é amplamente disponível — cumpre parcialmente o mesmo papel.' },
    ],
    advertencia: 'Pontos de corte não padronizados entre métodos e populações. O NGAL perde especificidade na sepse por ser também produzido por neutrófilos.',
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['creatinina', 'beta-2-microglobulina', 'tfg-estimada'],
  },
]
