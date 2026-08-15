import type { Marcador } from '../tipos'

/**
 * Ferro — segunda linha.
 *
 * A ferritina resolve a maioria dos casos e falha exatamente nos difíceis: ela
 * é proteína de fase aguda, e sobe na inflamação mesmo com estoque vazio. Este
 * arquivo reúne os marcadores que existem para resolver essa ambiguidade —
 * receptor solúvel de transferrina e hepcidina não se movem com inflamação
 * pelos mesmos motivos que a ferritina, e é justamente por isso que ajudam.
 *
 * O outro grupo aqui é o das capacidades de ligação (CTLF/TIBC e UIBC), que
 * medem a transferrina por um caminho funcional em vez de imunológico. São o
 * mesmo dado visto de outro ângulo, e conhecer a aritmética entre eles evita
 * pedir três exames para responder uma pergunta.
 */
export const marcadores: Marcador[] = [
  {
    id: 'receptor-soluvel-transferrina',
    nome: 'Receptor solúvel de transferrina',
    sigla: 'sTfR',
    sinonimos: ['stfr', 'receptor soluvel de transferrina', 'receptor de transferrina solúvel', 'tfr1 soluvel'],
    grupo: 'ferro',
    sistemas: ['hematologico', 'metabolico'],
    material: 'Soro',
    unidade: 'mg/L',
    referencias: [
      { rotulo: 'Adultos', minimo: 2.2, maximo: 5.0, unidade: 'mg/L', observacao: 'Faixas variam bastante entre métodos — a comparação seriada só vale no mesmo laboratório.' },
      { rotulo: 'Índice sTfR/log ferritina', texto: '< 1 sugere anemia de doença crônica; > 2 sugere carência de ferro', unidade: '' },
    ],
    resumo:
      'A porção extracelular do receptor de transferrina que se desprende da membrana do eritroblasto. Aumenta quando a célula tem fome de ferro — e, ao contrário da ferritina, não se altera com inflamação.',
    entenda:
      'O eritroblasto capta ferro pelo receptor de transferrina na sua membrana. Quando falta ferro, a célula expressa mais receptores para tentar capturar o pouco que circula; parte deles é clivada e vai para o plasma. O sTfR é, portanto, uma medida direta da demanda celular por ferro. Isso o torna a ferramenta para o problema mais frequente da hematologia ambulatorial: distinguir carência de ferro de anemia da doença crônica quando a ferritina vem "normal" porque a inflamação a elevou.',
    aprofundar: [
      'O sTfR tem dois determinantes, e confundi-los produz erro: a **massa eritroide** e a **carência de ferro**. Uma medula hiperproliferativa — hemólise, talassemia, resposta a eritropoetina — tem muitos eritroblastos e, portanto, muitos receptores, elevando o sTfR sem que falte ferro. Por isso o exame não se interpreta isolado em quem tem reticulocitose.',
      'O índice sTfR/log(ferritina) foi criado para combinar as duas informações num único número e é mais discriminante que qualquer dos dois isolados. Ele funciona porque a ferritina cai na carência e sobe na inflamação, enquanto o sTfR sobe na carência e ignora a inflamação: o quociente amplifica a diferença em vez de diluí-la.',
      'Na deficiência combinada — o paciente com doença inflamatória crônica que também esgotou o ferro — a ferritina pode estar entre 30 e 100 ng/mL e o sTfR elevado. Esse é o cenário em que reposição de ferro muda o desfecho e em que só a ferritina teria dito "não faltam estoques".',
    ],
    fisiologia: {
      oQueE: 'Fragmento solúvel do receptor de transferrina tipo 1, clivado da superfície celular e circulante ligado à transferrina.',
      origem: 'Predominantemente eritroblastos da medula óssea (cerca de 80% da massa total de receptores do organismo).',
      funcao: 'Refletir a demanda tecidual de ferro e a massa de precursores eritroides.',
      circulacao: 'Circula como complexo receptor–transferrina, estável e não afetado por reagentes de fase aguda.',
      eliminacao: 'Depuração hepática e reticuloendotelial.',
      percurso: [
        'Ferro intracelular baixo',
        'IRP estabiliza o mRNA do receptor de transferrina',
        'mais receptores na membrana do eritroblasto',
        'clivagem proteolítica da porção extracelular',
        'sTfR plasmático ↑',
      ],
    },
    aumento: {
      resumo: 'Fome celular de ferro ou massa eritroide expandida — nunca inflamação, e é essa indiferença que o torna útil.',
      mecanismos: [
        {
          titulo: 'Carência de ferro na célula',
          explicacao: 'A proteína reguladora de ferro (IRP) se liga ao mRNA do receptor quando o ferro intracelular cai, protegendo-o da degradação. Mais mRNA estável, mais receptor, mais fragmento solúvel.',
          exemplos: [
            { causa: 'Anemia ferropriva', etapas: ['estoques esgotados', 'ferro intracelular baixo no eritroblasto', 'expressão aumentada do receptor', 'sTfR ↑ com ferritina ↓'], nota: 'Sobe mais tarde que a ferritina cai — a ferritina baixa continua sendo o primeiro sinal.' },
            { causa: 'Ferropenia funcional em doença renal sob eritropoetina', etapas: ['estímulo eritropoético farmacológico', 'consumo de ferro maior que a mobilização dos estoques', 'sTfR ↑ com ferritina normal ou alta'], nota: 'Aqui o exame corrige o erro que a ferritina induziria: há ferro estocado, mas ele não chega à medula.' },
          ],
        },
        {
          titulo: 'Expansão da massa eritroide',
          explicacao: 'Mais eritroblastos significam mais receptores no total, independentemente de haver ou não carência de ferro.',
          exemplos: [
            { causa: 'Hemólise crônica, talassemia, esferocitose', etapas: ['destruição periférica acelerada', 'hiperplasia eritroide compensatória', 'massa de receptores ↑', 'sTfR ↑ sem carência de ferro'], nota: 'Nesse contexto o sTfR perde a capacidade de diagnosticar ferropenia.' },
            { causa: 'Recuperação de anemia megaloblástica após B12 ou folato', etapas: ['medula volta a proliferar em dias', 'consumo intenso de ferro', 'sTfR ↑ transitório'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Hipoproliferação medular — a medula produz pouco, então há poucos receptores.',
      mecanismos: [
        {
          titulo: 'Massa eritroide reduzida',
          explicacao: 'Sem precursores, não há de onde vir o receptor solúvel. O valor baixo diz mais sobre a medula do que sobre o ferro.',
          exemplos: [
            { causa: 'Aplasia medular, aplasia pura da série vermelha', etapas: ['ausência de eritroblastos', 'poucos receptores de transferrina', 'sTfR ↓'] },
            { causa: 'Doença renal crônica sem eritropoetina', etapas: ['produção renal de EPO reduzida', 'eritropoese diminuída', 'sTfR ↓ ou normal apesar da anemia'], nota: 'Anemia com sTfR baixo aponta para falha de estímulo, não para falta de matéria-prima.' },
          ],
        },
      ],
    },
    comparacoes: [
      {
        id: 'ferropenia-vs-doenca-cronica',
        titulo: 'Anemia ferropriva × anemia da doença crônica × as duas juntas',
        pergunta: 'A ferritina veio 80 ng/mL num paciente com artrite reumatoide e anemia microcítica. Falta ferro?',
        hipoteses: ['Ferropriva pura', 'Doença crônica pura', 'Ferropriva + doença crônica'],
        linhas: [
          { marcador: 'Ferritina', celulas: ['↓↓', 'normal ou ↑', 'normal (30–100)'] },
          { marcador: 'Ferro sérico', celulas: ['↓', '↓', '↓'] },
          { marcador: 'Transferrina / CTLF', celulas: ['↑', '↓ ou normal', 'normal'] },
          { marcador: 'Saturação de transferrina', celulas: ['↓↓', '↓', '↓'] },
          { marcador: 'sTfR', celulas: ['↑', 'normal', '↑'] },
          { marcador: 'sTfR / log ferritina', celulas: ['> 2', '< 1', '> 2'] },
          { marcador: 'Hepcidina', celulas: ['↓↓', '↑', 'variável'] },
        ],
        leitura:
          'A ferritina e o ferro sérico caem nas três colunas — por isso não resolvem. A transferrina separa a primeira coluna (o fígado a produz mais quando falta ferro; a inflamação a reduz). O sTfR separa a segunda: ele ignora a inflamação e só sobe quando a célula tem fome de ferro. A terceira coluna é a armadilha clínica, e é a que só o sTfR ou a hepcidina identificam.',
        limites:
          'Reticulocitose por qualquer causa eleva o sTfR e invalida a leitura. Em hemólise crônica ou talassemia, volte à hemoglobina reticulocitária ou à resposta terapêutica.',
      },
    ],
    relacionados: [
      { titulo: 'O painel do ferro', ids: ['ferritina', 'ferro-serico', 'transferrina', 'saturacao-transferrina', 'hepcidina'], leitura: 'A ferritina mede estoque, a saturação mede transporte, o sTfR mede demanda e a hepcidina mede o comando que regula tudo. São quatro perguntas diferentes sobre o mesmo metal.' },
      { titulo: 'Quando a dúvida é se a medula está recebendo ferro hoje', ids: ['hemoglobina-reticulocitaria', 'reticulocitos'], leitura: 'A hemoglobina reticulocitária responde em dias e não depende de imunoensaio caro — muitas vezes substitui o sTfR na prática.' },
    ],
    interferentes: {
      preAnalitico: ['Hemólise da amostra eleva falsamente — hemácias lisadas liberam receptores de membrana.'],
      fisiologico: ['Gestação e altitude elevam por expansão da eritropoese.'],
      metodo: ['Não há padronização internacional: valores de laboratórios diferentes não são intercambiáveis, e faixas de corte publicadas só valem para o método em que foram derivadas.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['ferritina', 'hepcidina', 'hemoglobina-reticulocitaria', 'saturacao-transferrina'],
  },

  {
    id: 'hepcidina',
    nome: 'Hepcidina',
    sinonimos: ['hepcidina', 'hepcidin', 'hamp'],
    grupo: 'ferro',
    sistemas: ['hematologico', 'hepatobiliar', 'metabolico'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Homens', minimo: 1, maximo: 55, unidade: 'ng/mL' },
      { rotulo: 'Mulheres em idade fértil', minimo: 1, maximo: 35, unidade: 'ng/mL' },
      { rotulo: 'Observação', texto: 'Exame de disponibilidade restrita e sem padronização entre métodos', unidade: '' },
    ],
    resumo:
      'O hormônio hepático que comanda a entrada de ferro na circulação. Alta, o ferro fica preso dentro das células; baixa, o ferro é liberado. Explica a anemia da doença crônica e a hemocromatose num único mecanismo.',
    entenda:
      'A hepcidina se liga à ferroportina — o único canal de saída de ferro que existe em enterócitos, macrófagos e hepatócitos — e a degrada. Sem ferroportina, o ferro absorvido no intestino e o ferro reciclado das hemácias velhas não conseguem sair para o plasma. É por isso que a inflamação, que eleva a hepcidina via IL-6, produz ferro sérico baixo com ferritina alta: o metal existe, está estocado, e não pode circular. E é por isso que a hemocromatose, em que a hepcidina falha, causa sobrecarga: nada trava a absorção.',
    aprofundar: [
      'A descoberta da hepcidina reorganizou a compreensão do metabolismo do ferro porque revelou que a absorção intestinal é regulada na saída da célula, não na entrada. O enterócito capta ferro com facilidade; o que decide se esse ferro chega ao plasma é a ferroportina na membrana basolateral — e quem decide sobre a ferroportina é a hepcidina.',
      'Três sinais aumentam a hepcidina: estoques de ferro cheios (proteção contra sobrecarga), inflamação via IL-6 (defesa — bactérias precisam de ferro para crescer, e sequestrá-lo é uma estratégia antimicrobiana ancestral) e o próprio estado inflamatório crônico. Dois a reduzem: eritropoese ativa, via eritroferrona liberada pelos eritroblastos, e hipóxia. O conflito entre esses sinais explica quadros mistos — o paciente com talassemia e sobrecarga de ferro tem eritropoese ineficaz suprimindo a hepcidina apesar dos estoques cheios, e absorve ferro que já lhe sobra.',
      'A hemocromatose hereditária tipo 1 (HFE) não é uma doença do transporte de ferro: é uma doença de sinalização da hepcidina. A proteína HFE participa da via que informa ao hepatócito que os estoques estão cheios; mutada, esse sinal não chega, a hepcidina permanece inadequadamente baixa e a absorção intestinal continua como se houvesse carência.',
    ],
    fisiologia: {
      oQueE: 'Peptídeo de 25 aminoácidos, hormônio central da homeostase do ferro.',
      origem: 'Hepatócito, principalmente; quantidades menores em macrófagos e adipócitos.',
      sintese: 'Gene HAMP, induzido pela via BMP/SMAD (sinal de estoque) e pela via IL-6/STAT3 (sinal inflamatório).',
      funcao: 'Ligar-se à ferroportina e induzir sua internalização e degradação, bloqueando a exportação de ferro das células para o plasma.',
      eliminacao: 'Filtração renal — acumula-se na doença renal crônica.',
      meiaVida: 'Minutos a poucas horas.',
      orgaosEnvolvidos: ['Fígado', 'Intestino (enterócito duodenal)', 'Macrófagos', 'Rim'],
      percurso: [
        'IL-6 ou estoques de ferro cheios',
        'hepatócito transcreve HAMP',
        'hepcidina circulante ↑',
        'ferroportina internalizada e degradada',
        'ferro retido em enterócitos e macrófagos',
        'ferro sérico ↓ com ferritina ↑',
      ],
    },
    aumento: {
      resumo: 'Inflamação, estoques cheios ou retenção renal — em todos os casos, ferro preso dentro das células.',
      mecanismos: [
        {
          titulo: 'Indução inflamatória',
          explicacao: 'A IL-6 ativa STAT3 no hepatócito e transcreve HAMP em horas. É uma resposta de defesa: privar o patógeno de ferro.',
          exemplos: [
            { causa: 'Infecção, artrite reumatoide, neoplasia, doença renal crônica', etapas: ['IL-6 ↑', 'hepcidina ↑', 'ferroportina degradada', 'ferro sequestrado em macrófagos', 'ferro sérico ↓, ferritina ↑, anemia normocítica'], nota: 'É a fisiopatologia completa da anemia da doença crônica em uma frase.' },
            { causa: 'Obesidade', etapas: ['inflamação de baixo grau do tecido adiposo', 'IL-6 discretamente ↑', 'hepcidina ↑', 'ferropenia funcional com ferritina normal'], nota: 'Explica por que reposição oral de ferro frequentemente falha em obesos.' },
          ],
        },
        {
          titulo: 'Sinalização de estoques cheios e retenção renal',
          explicacao: 'Ferro hepático elevado ativa a via BMP6/SMAD; a filtração glomerular reduzida diminui a depuração do peptídeo.',
          exemplos: [
            { causa: 'Sobrecarga de ferro transfusional', etapas: ['ferro hepático ↑', 'BMP6 ↑', 'hepcidina ↑', 'absorção intestinal freada — mas a transfusão continua entregando ferro'] },
            { causa: 'Doença renal crônica avançada', etapas: ['depuração renal reduzida', 'hepcidina acumulada', 'ferro indisponível para a medula', 'resistência à eritropoetina'], nota: 'Um dos motivos para preferir ferro endovenoso na DRC: ele contorna o bloqueio intestinal.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Carência de ferro, eritropoese ativa ou falha genética da via de sinalização — em todos, absorção intestinal liberada.',
      mecanismos: [
        {
          titulo: 'Supressão pela eritropoese',
          explicacao: 'O eritroblasto em proliferação secreta eritroferrona, que inibe a transcrição de HAMP. A medula manda liberar ferro quando precisa dele.',
          exemplos: [
            { causa: 'Anemia ferropriva', etapas: ['estoques vazios e eritropoese estimulada', 'hepcidina ↓↓', 'ferroportina preservada', 'absorção intestinal máxima'] },
            { causa: 'Talassemia e outras eritropoeses ineficazes', etapas: ['expansão eritroide sem produção efetiva', 'eritroferrona ↑↑', 'hepcidina suprimida apesar de estoques cheios', 'sobrecarga de ferro mesmo sem transfusão'], nota: 'É a razão de haver hemocromatose secundária em talassemia intermédia não transfundida.' },
          ],
        },
        {
          titulo: 'Falha genética da sinalização',
          explicacao: 'Mutações em HFE, hemojuvelina, TFR2 ou no próprio HAMP impedem que o sinal de estoque cheio chegue ao promotor.',
          exemplos: [
            { causa: 'Hemocromatose hereditária', etapas: ['sinal de estoque não transmitido', 'hepcidina inadequadamente baixa', 'absorção intestinal persistente', 'saturação de transferrina ↑↑ e depósito parenquimatoso'], nota: 'Saturação acima de 45% com ferritina alta é o achado de triagem — a hepcidina explica, mas raramente é medida.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O eixo completo do ferro', ids: ['ferritina', 'saturacao-transferrina', 'receptor-soluvel-transferrina', 'ferro-serico'], leitura: 'Hepcidina alta com ferritina alta e saturação baixa é bloqueio inflamatório. Hepcidina baixa com saturação alta é sobrecarga por absorção.' },
      { titulo: 'Por que a inflamação entra nessa conta', ids: ['pcr', 'vhs'], leitura: 'A IL-6 que eleva a PCR é a mesma que eleva a hepcidina: ferritina alta com PCR alta quase nunca significa estoque de ferro adequado.' },
    ],
    interferentes: {
      fisiologico: ['Ritmo circadiano marcado — concentração sobe ao longo do dia; colher sempre no mesmo horário.'],
      metodo: ['Ausência de padronização internacional entre imunoensaios e espectrometria de massa; valores absolutos não são comparáveis entre laboratórios.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['ferritina', 'receptor-soluvel-transferrina', 'saturacao-transferrina'],
  },

  {
    id: 'capacidade-ligacao-ferro',
    nome: 'Capacidade total de ligação do ferro',
    sigla: 'CTLF / TIBC',
    sinonimos: ['ctlf', 'tibc', 'capacidade total de ligacao do ferro', 'capacidade de ligacao', 'capacidade ferropexica'],
    grupo: 'ferro',
    sistemas: ['hematologico', 'metabolico'],
    material: 'Soro',
    unidade: 'µg/dL',
    referencias: [
      { rotulo: 'Adultos', minimo: 250, maximo: 400, unidade: 'µg/dL' },
    ],
    resumo:
      'Quanto ferro o soro conseguiria carregar se toda a transferrina estivesse ocupada. É a transferrina medida por função em vez de por imunoensaio — e sobe quando falta ferro.',
    entenda:
      'O laboratório satura a amostra com ferro em excesso, remove o que não se ligou e mede o que ficou: esse total é a CTLF. Como praticamente todo o ferro plasmático viaja na transferrina, a CTLF é uma medida indireta dela (CTLF ≈ transferrina em mg/dL × 1,4). A informação clínica está no sentido contraintuitivo do movimento: quando falta ferro, o fígado produz **mais** transferrina, e a CTLF sobe. Quando há inflamação, a transferrina cai como proteína de fase aguda negativa, e a CTLF desce.',
    aprofundar: [
      'A aritmética do painel do ferro fecha em três números: CTLF = ferro sérico + UIBC, e saturação de transferrina = ferro sérico ÷ CTLF × 100. Conhecendo dois, o terceiro é redundante — e pedir os três é um desperdício comum em solicitação de rotina.',
      'A CTLF alta com ferro baixo é o padrão da ferropenia; a CTLF baixa com ferro baixo é o padrão da inflamação. Essa oposição é a mais útil de todo o painel, porque o ferro sérico sozinho é idêntico nas duas situações. A CTLF é, portanto, o discriminante barato — disponível em qualquer laboratório, ao contrário do sTfR e da hepcidina.',
    ],
    fisiologia: {
      oQueE: 'Quantidade máxima de ferro que as proteínas transportadoras do soro — essencialmente a transferrina — são capazes de ligar.',
      origem: 'Reflete a transferrina sintetizada pelo hepatócito.',
      funcao: 'Estimar a capacidade de transporte de ferro disponível no plasma.',
      metabolismo: 'A síntese hepática de transferrina aumenta na carência de ferro e diminui na inflamação, na desnutrição e na hepatopatia.',
      orgaosEnvolvidos: ['Fígado', 'Medula óssea'],
    },
    aumento: {
      resumo: 'O fígado produz mais transferrina — por carência de ferro, por estrogênio ou por perda seletiva de outras proteínas.',
      mecanismos: [
        {
          titulo: 'Resposta hepática à carência de ferro',
          explicacao: 'A queda do ferro intracelular no hepatócito desestabiliza a repressão do gene da transferrina, e a síntese aumenta na tentativa de melhorar a captação e a entrega.',
          exemplos: [
            { causa: 'Anemia ferropriva', etapas: ['estoques esgotados', 'síntese hepática de transferrina ↑', 'CTLF ↑ com ferro sérico ↓', 'saturação ↓↓'], nota: 'CTLF acima de 400 µg/dL com saturação abaixo de 15% é praticamente diagnóstico.' },
            { causa: 'Gestação e uso de estrogênio', etapas: ['estrogênio estimula a síntese hepática de transferrina', 'CTLF ↑ sem carência necessariamente'], nota: 'Uma CTLF alta em gestante não fecha ferropenia sozinha — confira ferritina.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Menos transferrina disponível — inflamação, desnutrição, hepatopatia, perda renal ou sobrecarga de ferro.',
      mecanismos: [
        {
          titulo: 'Proteína de fase aguda negativa',
          explicacao: 'Na inflamação, o hepatócito desloca a síntese para PCR, fibrinogênio e haptoglobina, e reduz albumina e transferrina.',
          exemplos: [
            { causa: 'Infecção, neoplasia, doença inflamatória crônica', etapas: ['IL-6 ↑', 'síntese de transferrina ↓', 'CTLF ↓ com ferro sérico ↓ e ferritina ↑'], nota: 'A CTLF baixa é o que separa este quadro da ferropenia.' },
          ],
        },
        {
          titulo: 'Perda ou falha de síntese',
          explicacao: 'A transferrina é uma proteína de peso intermediário: sai na urina quando a barreira glomerular falha e falta quando o fígado ou o aporte proteico falham.',
          exemplos: [
            { causa: 'Síndrome nefrótica', etapas: ['proteinúria não seletiva', 'perda urinária de transferrina', 'CTLF ↓ apesar de possível carência de ferro concomitante'] },
            { causa: 'Cirrose e desnutrição proteico-calórica', etapas: ['capacidade de síntese hepática reduzida', 'CTLF ↓ junto com albumina ↓'] },
            { causa: 'Hemocromatose e sobrecarga transfusional', etapas: ['ferro hepático elevado reprime a síntese de transferrina', 'CTLF ↓ com ferro sérico ↑', 'saturação ↑↑ — acima de 45%'], nota: 'Saturação muito alta com CTLF baixa é o par que sugere sobrecarga.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A aritmética do painel', ids: ['ferro-serico', 'transferrina', 'saturacao-transferrina', 'uibc'], leitura: 'CTLF = ferro sérico + UIBC. Saturação = ferro ÷ CTLF. Pedir os quatro é redundância; dois bastam para calcular o resto.' },
    ],
    interferentes: {
      preAnalitico: ['Hemólise eleva o ferro sérico e distorce a saturação calculada, sem alterar a CTLF diretamente.'],
      fisiologico: ['Estrogênio, gestação e uso de contraceptivo oral elevam.'],
      metodo: ['Métodos que calculam a CTLF a partir da transferrina imunológica dão resultados discretamente diferentes dos que a medem por saturação direta.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['transferrina', 'saturacao-transferrina', 'uibc', 'ferritina'],
  },

  {
    id: 'uibc',
    nome: 'Capacidade latente de ligação do ferro',
    sigla: 'UIBC',
    sinonimos: ['uibc', 'capacidade latente', 'capacidade insaturada de ligacao do ferro', 'clif'],
    grupo: 'ferro',
    sistemas: ['hematologico', 'metabolico'],
    material: 'Soro',
    unidade: 'µg/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 150, maximo: 375, unidade: 'µg/dL' }],
    resumo:
      'A parte da transferrina que ainda está livre para carregar ferro. UIBC = CTLF − ferro sérico. É a mesma informação da CTLF vista pelo lado vazio da carreta.',
    entenda:
      'Se a transferrina é uma frota de caminhões, o ferro sérico é a carga transportada, a CTLF é a capacidade total da frota e a UIBC é o espaço vazio. Muitos laboratórios medem diretamente a UIBC (é tecnicamente mais simples) e calculam a CTLF somando o ferro sérico. Clinicamente, UIBC alta significa transferrina sobrando vazia — o padrão da carência de ferro; UIBC baixa significa transferrina cheia, o padrão da sobrecarga.',
    fisiologia: {
      oQueE: 'Fração da capacidade de ligação da transferrina ainda não ocupada por ferro.',
      origem: 'Derivada da transferrina hepática e do ferro circulante no momento da coleta.',
      funcao: 'Quantificar a reserva de transporte disponível, complementando o ferro sérico.',
      percurso: ['Transferrina hepática', 'sítios de ligação ocupados pelo ferro sérico', 'sítios livres = UIBC', 'soma dos dois = CTLF'],
    },
    aumento: {
      resumo: 'Muita transferrina vazia: carência de ferro, gestação, estrogênio.',
      mecanismos: [
        {
          titulo: 'Transferrina abundante com pouco ferro para carregar',
          explicacao: 'A síntese de transferrina sobe na ferropenia enquanto o ferro plasmático cai — os dois movimentos se somam para elevar a fração livre.',
          exemplos: [
            { causa: 'Anemia ferropriva', etapas: ['ferro sérico ↓ e transferrina ↑', 'sítios livres ↑↑', 'UIBC ↑ com saturação ↓↓'] },
            { causa: 'Uso de estrogênio ou gestação', etapas: ['síntese hepática de transferrina ↑', 'UIBC ↑ sem necessariamente faltar ferro'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Transferrina cheia ou escassa: sobrecarga de ferro, inflamação, hepatopatia, síndrome nefrótica.',
      mecanismos: [
        {
          titulo: 'Sítios ocupados ou transportador ausente',
          explicacao: 'A UIBC cai tanto quando sobra ferro (os sítios se ocupam) quanto quando falta transferrina (não há sítios).',
          exemplos: [
            { causa: 'Hemocromatose e sobrecarga transfusional', etapas: ['ferro plasmático ↑↑', 'sítios da transferrina ocupados', 'UIBC ↓ com saturação > 45%'], nota: 'UIBC muito baixa é um sinalizador barato de sobrecarga em triagem populacional.' },
            { causa: 'Inflamação crônica e hepatopatia', etapas: ['síntese de transferrina ↓', 'menos sítios totais', 'UIBC ↓ com ferro sérico também ↓'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A conta fechada', ids: ['capacidade-ligacao-ferro', 'ferro-serico', 'saturacao-transferrina'], leitura: 'UIBC + ferro sérico = CTLF. Qualquer resultado que não feche essa soma indica erro analítico ou troca de amostra.' },
    ],
    interferentes: {
      preAnalitico: ['Hemólise eleva o ferro sérico e reduz artificialmente a UIBC calculada.'],
      fisiologico: ['Variação circadiana do ferro sérico (maior de manhã) desloca a UIBC no sentido oposto ao longo do dia.'],
    },
    utilidade: ['diagnostico', 'triagem'],
    estudarTambem: ['capacidade-ligacao-ferro', 'saturacao-transferrina'],
  },

  {
    id: 'protoporfirina-zinco',
    nome: 'Protoporfirina-zinco eritrocitária',
    sigla: 'ZPP',
    sinonimos: ['zpp', 'protoporfirina zinco', 'protoporfirina eritrocitaria livre', 'fep'],
    grupo: 'ferro',
    sistemas: ['hematologico', 'toxicologico'],
    material: 'Sangue total com EDTA',
    unidade: 'µmol/mol heme',
    referencias: [
      { rotulo: 'Adultos', texto: '< 40', unidade: 'µmol/mol heme' },
      { rotulo: 'Sugestivo de carência de ferro ou exposição a chumbo', texto: '> 70', unidade: 'µmol/mol heme' },
    ],
    resumo:
      'O que a hemácia produz quando falta ferro para inserir na protoporfirina: no lugar do ferro, entra zinco. Sobe na ferropenia e na intoxicação por chumbo — e apenas nelas, o que a torna surpreendentemente específica.',
    entenda:
      'A última etapa da síntese do heme é a inserção de um átomo de ferro na protoporfirina IX, catalisada pela ferroquelatase. Se não há ferro disponível, ou se a enzima está inibida (o chumbo a inibe), o zinco ocupa o lugar. O resultado é uma hemácia que carrega protoporfirina-zinco em vez de heme, e como a hemácia vive 120 dias, o exame reflete a disponibilidade de ferro nas últimas semanas — não no dia da coleta.',
    aprofundar: [
      'A ZPP tem duas virtudes práticas: é barata, feita por hematofluorômetro em gota de sangue, e não é proteína de fase aguda. Por isso foi historicamente usada em triagem populacional de ferropenia infantil e em vigilância ocupacional de trabalhadores expostos a chumbo.',
      'A limitação é que ela não distingue as duas causas principais entre si — ferropenia e saturnismo produzem o mesmo aumento — e sobe também na anemia da doença crônica, em que o ferro está sequestrado e igualmente indisponível para a ferroquelatase. Uma ZPP alta diz "o eritroblasto não recebeu ferro"; dizer por que exige o painel completo ou a dosagem de chumbo.',
    ],
    fisiologia: {
      oQueE: 'Protoporfirina IX quelada com zinco em vez de ferro, acumulada dentro da hemácia.',
      origem: 'Eritroblasto medular, na etapa final da síntese do heme.',
      sintese: 'Formada quando a ferroquelatase não dispõe de ferro ou está inibida e insere zinco no anel de protoporfirina.',
      funcao: 'Não tem função — é um subproduto que denuncia falha na entrega de ferro à mitocôndria do eritroblasto.',
      meiaVida: 'Permanece pela vida da hemácia: cerca de 120 dias.',
      orgaosEnvolvidos: ['Medula óssea'],
      percurso: [
        'Succinil-CoA e glicina',
        'protoporfirina IX na mitocôndria do eritroblasto',
        'ferroquelatase insere ferro → heme',
        'sem ferro ou com enzima inibida → insere zinco',
        'ZPP acumulada na hemácia por 120 dias',
      ],
    },
    aumento: {
      resumo: 'Ferro indisponível na mitocôndria do eritroblasto — por carência, por sequestro inflamatório ou por inibição enzimática pelo chumbo.',
      mecanismos: [
        {
          titulo: 'Falta de substrato para a ferroquelatase',
          explicacao: 'Sem ferro chegando à mitocôndria, a protoporfirina se acumula e o zinco, abundante, ocupa o sítio.',
          exemplos: [
            { causa: 'Anemia ferropriva', etapas: ['estoques esgotados', 'entrega de ferro ao eritroblasto insuficiente', 'zinco inserido no lugar do ferro', 'ZPP ↑ semanas antes da microcitose se instalar'] },
            { causa: 'Anemia da doença crônica', etapas: ['hepcidina ↑ retém ferro nos macrófagos', 'eritroblasto não recebe ferro apesar de estoques cheios', 'ZPP ↑ com ferritina ↑'], nota: 'É a mesma leitura da ferropenia funcional: o exame mede entrega, não estoque.' },
          ],
        },
        {
          titulo: 'Inibição enzimática',
          explicacao: 'O chumbo inibe a ferroquelatase e a ALA-desidratase, bloqueando a síntese do heme em dois pontos.',
          exemplos: [
            { causa: 'Intoxicação por chumbo (saturnismo)', etapas: ['chumbo inibe a ferroquelatase', 'ferro não é inserido apesar de disponível', 'ZPP ↑↑ com ferro sérico e ferritina normais ou altos'], nota: 'ZPP alta com painel de ferro normal em trabalhador exposto deve levar direto à dosagem de chumbo no sangue.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para saber qual é a causa', ids: ['ferritina', 'chumbo', 'hemoglobina-reticulocitaria'], leitura: 'ZPP alta com ferritina baixa é ferropenia; com ferritina normal e história ocupacional, pense em chumbo; a hemoglobina reticulocitária confirma se a entrega de ferro melhorou após tratamento, e responde bem mais rápido.' },
    ],
    interferentes: {
      preAnalitico: ['Exposição da amostra à luz degrada a porfirina — proteger o tubo.'],
      fisiologico: ['Hiperbilirrubinemia produz fluorescência que interfere na leitura por hematofluorômetro.'],
    },
    utilidade: ['triagem', 'acompanhamento'],
    estudarTambem: ['ferritina', 'chumbo', 'hemoglobina-reticulocitaria'],
  },
]
