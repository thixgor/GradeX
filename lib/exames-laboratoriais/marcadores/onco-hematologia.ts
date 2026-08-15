import type { Marcador } from '../tipos'

/**
 * Onco-hematologia — quando o hemograma deixa de ser um número e vira uma
 * pergunta sobre clonalidade.
 *
 * Os exames deste arquivo respondem a uma pergunta que nenhum contador
 * automático responde: **essas células são uma reação ou uma linhagem?** Uma
 * leucocitose pode ser resposta a uma infecção ou uma leucemia; uma
 * trombocitose pode ser ferropenia ou trombocitemia essencial; uma
 * hiperproteinemia pode ser inflamação ou mieloma. A diferença entre policlonal
 * e monoclonal é a diferença entre "o organismo respondeu" e "uma célula
 * escapou do controle" — e é sempre um exame molecular, citométrico ou
 * eletroforético que a estabelece, nunca a contagem.
 *
 * Há uma consequência ética disso que atravessa todas as fichas: nenhum destes
 * exames diagnostica sozinho. Um JAK2 positivo sem eritrocitose não é
 * policitemia vera, e uma banda monoclonal pequena, muito mais frequentemente
 * que mieloma, é uma gamopatia monoclonal de significado indeterminado que só
 * exige acompanhamento.
 */
export const marcadores: Marcador[] = [
  {
    id: 'jak2',
    nome: 'Mutação JAK2 V617F',
    sigla: 'JAK2',
    sinonimos: ['jak2', 'jak2 v617f', 'janus quinase 2', 'mutacao jak2'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico'],
    material: 'Sangue total com EDTA (DNA de granulócitos)',
    unidade: 'presente/ausente e carga alélica (%)',
    referencias: [
      { rotulo: 'Resultado qualitativo', texto: 'Ausente (não detectada)', unidade: '' },
      { rotulo: 'Carga alélica quando presente', texto: 'Relatada em % — de < 1% a > 90%', unidade: '%', observacao: 'A carga alélica se correlaciona com fenótipo: baixa em trombocitemia essencial, alta em policitemia vera e mielofibrose.' },
    ],
    resumo:
      'A troca de uma valina por fenilalanina na posição 617 da quinase JAK2, que deixa a via de sinalização da eritropoetina permanentemente ligada. Presente em mais de 95% das policitemias vera e em cerca de metade das trombocitemias essenciais e mielofibroses.',
    entenda:
      'A JAK2 é a quinase acoplada aos receptores de eritropoetina, trombopoetina e G-CSF: quando o hormônio se liga, a JAK2 fosforila e a célula prolifera. A mutação V617F rompe o domínio autoinibitório JH2, e a quinase passa a sinalizar sem hormônio nenhum. O resultado é uma medula que produz hemácias, plaquetas ou granulócitos de forma autônoma — e, na policitemia vera, uma eritrocitose com eritropoetina sérica **baixa**, porque o feedback funciona: o organismo percebe o excesso de hemácias e desliga a EPO, mas a célula não precisa mais dela.',
    aprofundar: [
      'A tríade de raciocínio na eritrocitose é: hematócrito alto → dosar eritropoetina → se baixa, pesquisar JAK2. EPO baixa significa que a proliferação é autônoma (primária); EPO alta significa que alguém está estimulando (hipóxia, tumor produtor de EPO, uso exógeno). Inverter essa ordem — pedir JAK2 antes da EPO — é caro e frequentemente desnecessário.',
      'Cerca de 3% dos casos de policitemia vera são JAK2 V617F negativos e carregam mutações no éxon 12 do mesmo gene, que precisam ser pesquisadas separadamente quando a suspeita clínica é forte e a EPO está baixa. Nas neoplasias mieloproliferativas com plaquetas altas, quando JAK2 é negativo, a sequência seguinte é CALR e depois MPL: as três mutações são mutuamente exclusivas e, juntas, explicam a maioria dos casos.',
      'A carga alélica importa clinicamente. Ela reflete a proporção de células portadoras e tende a ser baixa na trombocitemia essencial, intermediária na policitemia vera e alta na mielofibrose — o que sustenta a hipótese de que essas três entidades são estágios de um contínuo, não doenças separadas. Cargas acima de 50% implicam homozigose por recombinação mitótica e associam-se a fenótipo mais proliferativo e maior risco de transformação.',
      'Um achado incidental de JAK2 positivo em pessoa com hemograma normal não é doença: é hematopoese clonal de potencial indeterminado. Aumenta o risco de trombose e de evolução, mas não estabelece diagnóstico e não justifica tratamento citorredutor.',
    ],
    fisiologia: {
      oQueE: 'Mutação pontual somática adquirida no gene JAK2, presente nas células hematopoéticas clonais e ausente na linhagem germinativa.',
      origem: 'Célula-tronco hematopoética; a detecção é feita no DNA de granulócitos do sangue periférico.',
      funcao: 'A JAK2 normal transduz o sinal dos receptores de citocinas hematopoéticas (EPO, TPO, G-CSF) para a via STAT5. A forma mutada mantém essa via ativa constitutivamente.',
      orgaosEnvolvidos: ['Medula óssea', 'Baço (hematopoese extramedular)'],
      percurso: [
        'Mutação V617F na célula-tronco',
        'perda da autoinibição do domínio JH2',
        'sinalização STAT5 contínua sem ligante',
        'proliferação autônoma de eritroide, megacariocítica e granulocítica',
        'eritrocitose e/ou trombocitose com eritropoetina baixa',
      ],
    },
    aumento: {
      resumo: 'A pergunta não é "por que sobe", e sim "o que a presença significa": proliferação mieloide clonal.',
      significado:
        'Presente confirma clonalidade e exclui as causas reacionais de eritrocitose e trombocitose. Ausente não exclui neoplasia mieloproliferativa — restam CALR, MPL e o éxon 12.',
      mecanismos: [
        {
          titulo: 'Ativação constitutiva da via JAK-STAT',
          explicacao: 'Sem o freio do domínio pseudoquinase, a JAK2 fosforila STAT5 continuamente, e os progenitores crescem em cultura sem eritropoetina — o fenômeno das colônias eritroides endógenas.',
          exemplos: [
            { causa: 'Policitemia vera', etapas: ['V617F na célula-tronco', 'sinalização autônoma do receptor de EPO', 'eritrocitose com EPO sérica ↓', 'hematócrito ↑↑ com risco trombótico'], nota: 'É a combinação EPO baixa + JAK2 positivo que fecha o raciocínio, não o JAK2 isolado.' },
            { causa: 'Trombocitemia essencial', etapas: ['V617F com carga alélica baixa', 'sinalização do receptor de trombopoetina ativada', 'megacariopoese autônoma', 'plaquetas persistentemente > 450.000/mm³ sem causa reacional'], nota: 'Antes de concluir, exclua ferropenia e inflamação — as duas causas reacionais mais frequentes de trombocitose.' },
            { causa: 'Mielofibrose primária', etapas: ['clone com carga alélica alta', 'liberação de citocinas fibrogênicas pelos megacariócitos', 'fibrose medular', 'leucoeritroblastose com dacriócitos e hematopoese extramedular'] },
            { causa: 'Trombose esplâncnica sem causa aparente', etapas: ['trombose de veia porta ou hepática', 'hemograma pode estar normal por hemodiluição e hiperesplenismo', 'JAK2 positivo revela o clone oculto'], nota: 'Pesquisa obrigatória em trombose de sítio incomum, mesmo com hemograma normal.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A sequência da eritrocitose', ids: ['hematocrito', 'hemoglobina', 'eritropoetina'], leitura: 'Hematócrito alto com EPO baixa aponta para causa primária e justifica o JAK2. Com EPO alta, procure hipóxia, apneia do sono, tabagismo ou tumor produtor de EPO.' },
      { titulo: 'Quando JAK2 vem negativo', ids: ['calr', 'mpl', 'plaquetas'], leitura: 'Em trombocitose persistente com JAK2 negativo, CALR e MPL completam a investigação molecular. CALR positiva tem prognóstico trombótico melhor.' },
    ],
    advertencia:
      'Resultado positivo isolado não estabelece diagnóstico de neoplasia mieloproliferativa: exige critérios clínicos, hemograma compatível e, em muitos casos, biópsia de medula óssea. Hematopoese clonal com JAK2 positivo e hemograma normal ocorre e não é doença.',
    interferentes: {
      preAnalitico: ['Amostra com poucos granulócitos (leucopenia intensa) reduz a sensibilidade — a mutação está nas células mieloides, não nos linfócitos.'],
      metodo: ['A sensibilidade varia muito: PCR alelo-específico quantitativo detecta cargas abaixo de 1%, enquanto sequenciamento Sanger só detecta acima de 15%. Um "negativo" por método pouco sensível não é o mesmo que ausência.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['eritropoetina', 'hematocrito', 'plaquetas', 'calr'],
  },

  {
    id: 'calr',
    nome: 'Mutação CALR (calreticulina)',
    sigla: 'CALR',
    sinonimos: ['calr', 'calreticulina', 'mutacao calr'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico'],
    material: 'Sangue total com EDTA',
    unidade: 'presente/ausente (tipo 1 ou tipo 2)',
    referencias: [{ rotulo: 'Resultado', texto: 'Ausente (não detectada)', unidade: '' }],
    resumo:
      'Inserções ou deleções no éxon 9 da calreticulina que criam uma cauda proteica nova, capaz de ativar o receptor de trombopoetina. Presente em 20 a 30% das trombocitemias essenciais e mielofibroses JAK2-negativas.',
    entenda:
      'A calreticulina normal é uma chaperona do retículo endoplasmático. As mutações do éxon 9 deslocam o quadro de leitura e produzem uma proteína com terminal carboxílico completamente diferente, que se liga ao receptor de trombopoetina (MPL) e o ativa sem ligante — chegando, por outro caminho, exatamente ao mesmo destino do JAK2 V617F: proliferação megacariocítica autônoma. Reconhecer isso muda a prática: quando JAK2 vem negativo numa trombocitose persistente, a investigação não terminou.',
    aprofundar: [
      'As mutações se dividem em dois tipos com significado prognóstico distinto. O tipo 1 (deleção de 52 pb) predomina na mielofibrose e associa-se a fenótipo mais fibrótico; o tipo 2 (inserção de 5 pb) predomina na trombocitemia essencial e cursa com plaquetas mais altas e menor risco de progressão.',
      'Pacientes com trombocitemia essencial CALR-mutada têm, em média, contagem plaquetária mais alta e risco trombótico **menor** que os JAK2-mutados. É um dos exemplos em que o marcador molecular pesa mais na estratificação de risco que o próprio número de plaquetas — e por isso a genotipagem entrou nos escores de decisão terapêutica.',
      'Os casos que são negativos para JAK2, CALR e MPL recebem a designação "triplo-negativos". Não significa ausência de doença: significa que o driver molecular não foi identificado com o painel padrão, e o diagnóstico passa a depender integralmente da biópsia medular e da exclusão de causas reacionais.',
    ],
    fisiologia: {
      oQueE: 'Mutação somática de deslocamento de quadro de leitura no éxon 9 do gene CALR, gerando um neopeptídeo C-terminal.',
      origem: 'Célula-tronco hematopoética clonal.',
      funcao: 'A calreticulina normal atua como chaperona de ligação ao cálcio no retículo endoplasmático; a mutada adquire a capacidade de ativar o receptor MPL.',
      percurso: [
        'Inserção ou deleção no éxon 9',
        'novo terminal C rico em resíduos básicos',
        'ligação anômala ao receptor de trombopoetina',
        'ativação de JAK2 a jusante e de STAT5',
        'megacariopoese autônoma',
      ],
    },
    aumento: {
      resumo: 'Presença indica clone mieloproliferativo com ativação do eixo trombopoetina em paciente JAK2-negativo.',
      mecanismos: [
        {
          titulo: 'Ativação do receptor de trombopoetina pelo neopeptídeo',
          explicacao: 'A cauda mutante se liga ao domínio extracelular do MPL e o mantém em conformação ativa — a via final é a mesma do JAK2 V617F, alcançada por outra porta.',
          exemplos: [
            { causa: 'Trombocitemia essencial JAK2-negativa', etapas: ['CALR tipo 2 no clone', 'MPL ativado sem trombopoetina', 'plaquetas frequentemente > 700.000/mm³', 'risco trombótico menor que no JAK2 mutado'] },
            { causa: 'Mielofibrose primária', etapas: ['CALR tipo 1', 'megacariócitos displásicos liberam TGF-β', 'fibrose reticulínica e colágena', 'esplenomegalia e leucoeritroblastose'], nota: 'CALR tipo 1 em mielofibrose associa-se a sobrevida melhor que triplo-negativo ou ASXL1 mutado.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O trio dos drivers', ids: ['jak2', 'mpl', 'plaquetas'], leitura: 'JAK2, CALR e MPL são mutuamente exclusivos. A ordem prática é JAK2 primeiro (mais frequente), depois CALR, depois MPL.' },
      { titulo: 'Antes de investigar molecularmente', ids: ['ferritina', 'pcr'], leitura: 'Trombocitose reacional por ferropenia ou inflamação é muito mais comum que neoplasia. Ferritina e PCR normais tornam a pesquisa molecular defensável.' },
    ],
    advertencia: 'Resultado positivo confirma clonalidade, mas o diagnóstico da entidade específica exige critérios da OMS, incluindo histologia medular.',
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['jak2', 'mpl', 'plaquetas'],
  },

  {
    id: 'mpl',
    nome: 'Mutação MPL (receptor de trombopoetina)',
    sigla: 'MPL',
    sinonimos: ['mpl', 'mpl w515', 'receptor de trombopoetina', 'mutacao mpl'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico'],
    material: 'Sangue total com EDTA',
    unidade: 'presente/ausente',
    referencias: [{ rotulo: 'Resultado', texto: 'Ausente (não detectada)', unidade: '' }],
    resumo:
      'Mutações no códon 515 do receptor de trombopoetina que o mantêm ativo sem ligante. Terceiro driver na fila da investigação de trombocitose clonal, presente em cerca de 5% dos casos.',
    entenda:
      'Enquanto o JAK2 é a quinase e a CALR é o ativador anômalo, o MPL é o próprio receptor. As mutações W515L e W515K alteram o domínio justamembrana que normalmente impede a dimerização espontânea; sem esse freio, o receptor se dimeriza e sinaliza continuamente. As três alterações convergem para a mesma via — a lição é que a fisiopatologia de um grupo de doenças pode ter várias entradas moleculares e um só desfecho funcional.',
    fisiologia: {
      oQueE: 'Mutação somática no gene MPL, tipicamente W515L ou W515K, no domínio justamembranar do receptor de trombopoetina.',
      origem: 'Célula-tronco hematopoética clonal.',
      funcao: 'O receptor MPL normal medeia a proliferação e a maturação megacariocítica em resposta à trombopoetina.',
      percurso: ['Mutação no códon 515', 'perda do freio à dimerização', 'receptor ativo sem trombopoetina', 'JAK2/STAT5 ativados', 'trombocitose clonal'],
    },
    aumento: {
      resumo: 'Presença indica neoplasia mieloproliferativa em paciente JAK2 e CALR negativos.',
      mecanismos: [
        {
          titulo: 'Dimerização espontânea do receptor',
          explicacao: 'A substituição do triptofano 515 elimina a barreira conformacional que mantém o receptor monomérico na ausência de ligante.',
          exemplos: [
            { causa: 'Trombocitemia essencial', etapas: ['W515L no clone', 'receptor ativo continuamente', 'megacariopoese autônoma', 'plaquetas ↑ com JAK2 e CALR negativos'] },
            { causa: 'Mielofibrose primária', etapas: ['clone MPL-mutado', 'proliferação megacariocítica atípica', 'fibrose medular progressiva', 'anemia e esplenomegalia'], nota: 'MPL em mielofibrose associa-se a anemia mais precoce e menor celularidade medular.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A investigação sequencial', ids: ['jak2', 'calr', 'plaquetas'], leitura: 'Pedir os três em paralelo é aceitável quando o acesso permite; sequencialmente, a ordem por frequência economiza recurso sem perder caso.' },
    ],
    advertencia: 'Positividade confirma clonalidade; o diagnóstico da entidade depende de critérios clínicos e histológicos.',
    utilidade: ['diagnostico'],
    estudarTambem: ['jak2', 'calr'],
  },

  {
    id: 'bcr-abl',
    nome: 'Transcrito BCR-ABL1',
    sigla: 'BCR-ABL',
    sinonimos: ['bcr abl', 'bcr-abl1', 'cromossomo philadelphia', 'philadelphia', 't(9;22)', 'p210', 'p190'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico'],
    material: 'Sangue total com EDTA ou medula óssea (RNA)',
    unidade: '% na escala internacional (IS)',
    referencias: [
      { rotulo: 'Ausente', texto: 'Não detectado', unidade: '' },
      { rotulo: 'Resposta molecular maior (RM3)', texto: '≤ 0,1% IS', unidade: '%' },
      { rotulo: 'Resposta molecular profunda (RM4.5)', texto: '≤ 0,0032% IS', unidade: '%', observacao: 'Patamar exigido para considerar suspensão de inibidor de tirosina quinase em protocolos de descontinuação.' },
    ],
    resumo:
      'O gene de fusão criado pela translocação t(9;22) — o cromossomo Philadelphia. Define a leucemia mieloide crônica, e sua quantificação seriada é o exemplo mais bem-sucedido de monitoramento molecular de doença residual em oncologia.',
    entenda:
      'A translocação junta o gene BCR do cromossomo 22 ao ABL1 do cromossomo 9, criando uma tirosina quinase permanentemente ativa. O resultado é uma expansão granulocítica com maturação preservada — o hemograma da LMC tem toda a série granulocítica representada, dos mieloblastos aos segmentados, com basofilia. Essa maturação preservada é o que a distingue da leucemia aguda e o que explica por que o paciente pode estar assintomático com 150.000 leucócitos.',
    aprofundar: [
      'A escala internacional (IS) foi criada porque o resultado bruto de PCR quantitativa não é comparável entre laboratórios. Cada serviço aplica um fator de conversão validado, e é por isso que o laudo precisa dizer explicitamente "escala internacional". Comparar um valor IS com um valor bruto de outro laboratório é um erro que muda decisão terapêutica.',
      'O tamanho do transcrito importa: p210 (b3a2/b2a2) é o da LMC clássica; p190 (e1a2) aparece na leucemia linfoblástica aguda Philadelphia-positiva e tem prognóstico distinto; p230 é raro e cursa com neutrofilia mais indolente. O laboratório precisa saber qual pesquisar, porque o primer é específico.',
      'O monitoramento seriado tem regras claras: RM3 (≤0,1%) aos 12 meses é o marco de resposta ótima; um aumento de dez vezes com perda de RM3 exige pesquisa de mutação no domínio quinase do ABL, sendo a T315I a que confere resistência a quase todos os inibidores e obriga a mudar de classe. É a doença em que o exame laboratorial, isoladamente, dirige a troca de medicamento.',
      'Um detalhe de raciocínio diagnóstico: leucocitose com desvio escalonado, basofilia e esplenomegalia sugere LMC; leucocitose com desvio escalonado, granulações tóxicas e sem basofilia sugere reação leucemoide. A fosfatase alcalina leucocitária, historicamente usada para separar as duas, foi substituída pelo BCR-ABL, que é definitivo.',
    ],
    fisiologia: {
      oQueE: 'Transcrito de fusão resultante da translocação recíproca entre os cromossomos 9 e 22, codificando uma tirosina quinase constitutivamente ativa.',
      origem: 'Célula-tronco hematopoética; detectado por RT-PCR quantitativa no sangue periférico.',
      funcao: 'A quinase de fusão fosforila substratos das vias RAS, PI3K e STAT5, promovendo proliferação e inibindo apoptose independentemente de sinal externo.',
      percurso: [
        't(9;22) na célula-tronco',
        'fusão BCR-ABL1',
        'tirosina quinase constitutivamente ativa',
        'proliferação granulocítica com maturação preservada',
        'leucocitose com desvio escalonado e basofilia',
      ],
    },
    aumento: {
      resumo: 'Presença define a doença; a quantidade define a resposta ao tratamento e antecipa a recaída antes de qualquer alteração no hemograma.',
      significado:
        'Um valor crescente em duas medidas consecutivas indica perda de resposta molecular e precede a recaída hematológica em meses — é a janela em que a conduta ainda pode ser ajustada sem crise blástica.',
      mecanismos: [
        {
          titulo: 'Expansão do clone Philadelphia-positivo',
          explicacao: 'A quantidade de transcrito é proporcional à massa de células leucêmicas; a PCR quantitativa mede diretamente esse volume.',
          exemplos: [
            { causa: 'Leucemia mieloide crônica ao diagnóstico', etapas: ['clone BCR-ABL positivo expandido', 'transcrito próximo a 100% IS', 'leucocitose com desvio escalonado e basofilia', 'esplenomegalia'] },
            { causa: 'Perda de resposta por mutação no domínio quinase', etapas: ['mutação como T315I no sítio de ligação do inibidor', 'fármaco deixa de bloquear a quinase', 'transcrito sobe dez vezes ou mais', 'necessidade de trocar de inibidor'], nota: 'A subida do transcrito antecede a recaída hematológica — é o motivo de monitorar a cada três meses.' },
            { causa: 'Não adesão ao inibidor de tirosina quinase', etapas: ['exposição farmacológica insuficiente', 'clone volta a expandir', 'transcrito ↑ sem mutação detectável'], nota: 'É a causa mais frequente de perda de resposta, e a primeira a investigar antes de pesquisar mutação.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O hemograma que levanta a suspeita', ids: ['leucocitos', 'basofilos', 'granulocitos-imaturos', 'plaquetas'], leitura: 'Leucocitose com todas as formas granulocíticas presentes, basofilia e trombocitose é o quadro típico. Basofilia persistente sem explicação alérgica merece BCR-ABL.' },
      { titulo: 'Para diferenciar de reação leucemoide', ids: ['pcr', 'esfregaco'], leitura: 'A reação leucemoide tem granulações tóxicas, PCR alta e não tem basofilia; a LMC tem basofilia, eosinofilia e o espectro completo de maturação.' },
    ],
    advertencia:
      'Resultados de PCR quantitativa só são comparáveis entre si quando expressos na escala internacional e, idealmente, obtidos no mesmo laboratório. Um "aumento" entre serviços diferentes pode ser artefato metodológico.',
    interferentes: {
      preAnalitico: ['O RNA degrada rapidamente: amostra que demora mais de 24 a 48 horas para ser processada pode gerar falso-negativo ou subestimação.'],
      metodo: ['Sensibilidade depende da qualidade do RNA e do gene controle usado; laudos devem informar o limite de detecção alcançado naquela amostra.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    estudarTambem: ['leucocitos', 'basofilos', 'granulocitos-imaturos'],
  },

  {
    id: 'pml-rara',
    nome: 'Transcrito PML-RARA',
    sigla: 'PML-RARA',
    sinonimos: ['pml rara', 't(15;17)', 'leucemia promielocitica', 'lpa'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico'],
    material: 'Sangue total ou medula óssea (RNA)',
    unidade: 'presente/ausente',
    referencias: [{ rotulo: 'Resultado', texto: 'Não detectado', unidade: '' }],
    resumo:
      'O gene de fusão da leucemia promielocítica aguda. É o exame mais urgente da hematologia: a doença mata por coagulopatia nas primeiras horas e o tratamento específico começa antes de o resultado sair.',
    entenda:
      'A translocação t(15;17) funde o gene PML ao receptor alfa do ácido retinoico. A proteína de fusão bloqueia a diferenciação no estágio de promielócito — e o promielócito é uma célula carregada de grânulos ricos em fator tecidual e em proteases. Quando essas células se rompem, disparam coagulação intravascular disseminada e hiperfibrinólise simultâneas. É a razão de a LPA ser a leucemia com maior mortalidade nos primeiros dias e menor mortalidade a longo prazo: se o paciente sobrevive à hemorragia, a doença é curável.',
    aprofundar: [
      'A conduta correta inverte a lógica habitual: diante de leucemia aguda com promielócitos anômalos, CIVD e fibrinogênio consumido, o ácido transretinoico (ATRA) é iniciado **antes** da confirmação molecular. O ATRA reverte o bloqueio de diferenciação e reduz a liberação de material pró-coagulante em horas. Esperar o resultado custa vidas; iniciar e depois suspender, se a fusão não se confirmar, custa pouco.',
      'A coagulopatia da LPA é dupla e por isso singular: há consumo (CIVD, com D-dímero muito alto e fibrinogênio baixo) e hiperfibrinólise primária (a anexina II expressa no promielócito acelera a conversão de plasminogênio em plasmina). Essa combinação explica por que o sangramento é desproporcional à contagem plaquetária.',
    ],
    fisiologia: {
      oQueE: 'Transcrito de fusão entre o gene da proteína de leucemia promielocítica e o receptor alfa do ácido retinoico.',
      origem: 'Precursor mieloide na medula óssea.',
      funcao: 'A proteína de fusão recruta correpressores ao promotor dos genes-alvo do ácido retinoico, bloqueando a diferenciação no estágio de promielócito.',
      percurso: [
        't(15;17)',
        'proteína de fusão PML-RARA',
        'repressão da transcrição dependente de ácido retinoico',
        'bloqueio de maturação em promielócito',
        'liberação de fator tecidual e anexina II',
        'CIVD com hiperfibrinólise',
      ],
    },
    aumento: {
      resumo: 'Presença define leucemia promielocítica aguda — e transforma um diagnóstico de leucemia numa emergência hematológica específica.',
      mecanismos: [
        {
          titulo: 'Bloqueio de diferenciação com liberação de material pró-coagulante',
          explicacao: 'Os promielócitos acumulados carregam grânulos ricos em fator tecidual; sua lise dispara a cascata e, ao mesmo tempo, a fibrinólise.',
          exemplos: [
            { causa: 'Leucemia promielocítica aguda ao diagnóstico', etapas: ['fusão PML-RARA', 'acúmulo de promielócitos hipergranulares', 'liberação de fator tecidual e anexina II', 'CIVD com fibrinogênio ↓, D-dímero ↑↑, plaquetas ↓', 'hemorragia — inclusive intracraniana'], nota: 'Fibrinogênio baixo em leucemia aguda deve ser tratado como LPA até prova em contrário.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A coagulopatia que acompanha', ids: ['fibrinogenio', 'd-dimero', 'plaquetas', 'inr'], leitura: 'Fibrinogênio consumido com D-dímero muito alto em leucemia aguda é o alerta. A reposição agressiva de fibrinogênio e plaquetas acompanha o ATRA desde a primeira hora.' },
    ],
    advertencia: 'A suspeita clínica basta para iniciar tratamento específico; não se aguarda a confirmação molecular para começar o ácido transretinoico.',
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['fibrinogenio', 'd-dimero', 'plaquetas'],
  },

  {
    id: 'flt3',
    nome: 'Mutações FLT3 (ITD e TKD)',
    sigla: 'FLT3',
    sinonimos: ['flt3', 'flt3 itd', 'flt3 tkd', 'duplicacao interna em tandem'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico'],
    material: 'Medula óssea ou sangue periférico (DNA)',
    unidade: 'presente/ausente e razão alélica',
    referencias: [
      { rotulo: 'Resultado', texto: 'Ausente', unidade: '' },
      { rotulo: 'Razão alélica ITD', texto: 'Relatada como alta (≥ 0,5) ou baixa (< 0,5)', unidade: '', observacao: 'Razão alta associa-se a pior prognóstico e pesa na indicação de transplante.' },
    ],
    resumo:
      'Mutações que ativam a quinase FLT3 na leucemia mieloide aguda. Definem prognóstico pior e, hoje, indicam terapia dirigida — é um marcador que mudou de "prognóstico" para "preditivo".',
    entenda:
      'A FLT3 é um receptor de tirosina quinase dos progenitores hematopoéticos. A duplicação interna em tandem (ITD) na região justamembranar e as mutações pontuais no domínio quinase (TKD) a mantêm ativa sem ligante. Na LMA, a ITD aparece em cerca de 25% dos casos e associa-se a leucocitose alta, medula hipercelular e recaída precoce. A razão alélica — quanto do alelo está mutado — quantifica o peso do clone e entrou nos algoritmos de estratificação de risco.',
    aprofundar: [
      'A associação com NPM1 muda a leitura: NPM1 mutado com FLT3-ITD ausente ou de baixa razão alélica é prognóstico favorável; NPM1 mutado com ITD de alta razão alélica volta a ser risco intermediário ou adverso. Nenhum dos dois marcadores se interpreta isolado, e essa interdependência é a razão de os painéis moleculares da LMA serem pedidos em conjunto e com prazo — o resultado precisa chegar antes da decisão sobre transplante na primeira remissão.',
      'A ITD pode surgir na recaída em paciente que era negativo ao diagnóstico, e desaparecer sob pressão terapêutica. Isso significa que o exame deve ser repetido na recaída: a decisão sobre inibidor de FLT3 depende do estado molecular naquele momento, não do inicial.',
    ],
    fisiologia: {
      oQueE: 'Alterações no gene FLT3: duplicação interna em tandem no domínio justamembranar ou mutação pontual no domínio de tirosina quinase.',
      origem: 'Blastos mieloides da medula óssea.',
      funcao: 'O receptor FLT3 normal responde ao seu ligante promovendo proliferação de progenitores; mutado, sinaliza continuamente por STAT5.',
      percurso: ['ITD ou TKD no gene FLT3', 'receptor ativo sem ligante', 'ativação de STAT5 e RAS', 'proliferação blástica', 'leucocitose alta e recaída precoce'],
    },
    aumento: {
      resumo: 'Presença indica LMA de maior risco e, ao mesmo tempo, doença passível de terapia dirigida.',
      mecanismos: [
        {
          titulo: 'Sinalização constitutiva do receptor',
          explicacao: 'A duplicação desestabiliza o domínio autoinibitório; a quinase dimeriza e fosforila sem ligante, mantendo o blasto em ciclo.',
          exemplos: [
            { causa: 'LMA com FLT3-ITD de alta razão alélica', etapas: ['clone dominante com receptor ativo', 'leucocitose muito alta ao diagnóstico', 'remissão frequentemente obtida mas de curta duração', 'indicação de inibidor de FLT3 e de transplante na primeira remissão'] },
            { causa: 'Recaída de LMA previamente FLT3 negativa', etapas: ['seleção de subclone mutado sob quimioterapia', 'ITD detectável na recaída', 'reorienta a terapia de resgate'], nota: 'Repetir o painel na recaída não é redundância: o genótipo muda.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel da LMA', ids: ['npm1', 'leucocitos', 'plaquetas'], leitura: 'FLT3 e NPM1 se interpretam juntos: a combinação, e não cada um isolado, define o grupo de risco.' },
    ],
    advertencia: 'Exame de estratificação, não de diagnóstico: a LMA é diagnosticada por morfologia, citometria e critérios de blastos; o painel molecular decide o tratamento.',
    utilidade: ['prognostico'],
    estudarTambem: ['npm1', 'imunofenotipagem'],
  },

  {
    id: 'npm1',
    nome: 'Mutação NPM1 (nucleofosmina)',
    sigla: 'NPM1',
    sinonimos: ['npm1', 'nucleofosmina', 'mutacao npm1'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico'],
    material: 'Medula óssea ou sangue periférico',
    unidade: 'presente/ausente e transcrito quantitativo (%)',
    referencias: [{ rotulo: 'Resultado', texto: 'Ausente', unidade: '' }],
    resumo:
      'Mutação da nucleofosmina que a desloca do núcleo para o citoplasma. É a alteração isolada mais frequente na LMA de cariótipo normal, marca prognóstico favorável e serve como alvo para monitorar doença residual.',
    entenda:
      'A nucleofosmina normalmente circula entre nucléolo e citoplasma. As mutações do éxon 12 criam um sinal de exportação nuclear adicional, e a proteína fica retida no citoplasma — daí o nome NPM1c. Isso desregula p53 e ARF e favorece a leucemogênese. Clinicamente, a LMA NPM1-mutada com cariótipo normal e sem FLT3-ITD de alta carga responde bem à quimioterapia e frequentemente dispensa transplante na primeira remissão.',
    aprofundar: [
      'O transcrito mutado é específico do clone e não existe em célula normal, o que faz dele um alvo ideal para doença residual mensurável por PCR quantitativa. Persistência do transcrito após dois ciclos de consolidação, ou sua reascensão durante o seguimento, antecipa a recaída hematológica em meses — janela em que a intervenção preemptiva é possível.',
      'A mutação é considerada estável ao longo da doença na maioria dos casos, o que sustenta seu uso como marcador de seguimento — ao contrário do FLT3, que pode aparecer e desaparecer. Essa diferença de estabilidade é a razão de NPM1 servir para monitorar e FLT3 servir para decidir terapia dirigida.',
    ],
    fisiologia: {
      oQueE: 'Mutação de inserção no éxon 12 do gene NPM1, gerando proteína com localização citoplasmática aberrante.',
      origem: 'Blastos mieloides.',
      funcao: 'A nucleofosmina participa da biogênese ribossômica, do transporte nucleocitoplasmático e da regulação de p53/ARF.',
      percurso: ['Inserção no éxon 12', 'novo sinal de exportação nuclear', 'proteína retida no citoplasma', 'regulação de p53/ARF perturbada', 'leucemogênese em cariótipo normal'],
    },
    aumento: {
      resumo: 'Presença define subgrupo de LMA com prognóstico favorável quando isolada — e fornece o alvo para monitorar doença residual.',
      mecanismos: [
        {
          titulo: 'Deslocalização citoplasmática da nucleofosmina',
          explicacao: 'A retenção citoplasmática sequestra parceiros nucleares e desativa vias supressoras tumorais dependentes da localização nuclear correta.',
          exemplos: [
            { causa: 'LMA de cariótipo normal NPM1-mutada sem FLT3-ITD', etapas: ['NPM1c no citoplasma dos blastos', 'boa resposta à quimioterapia de indução', 'sobrevida favorável', 'transplante em primeira remissão geralmente dispensável'] },
            { causa: 'Doença residual mensurável ascendente', etapas: ['transcrito NPM1 volta a subir na PCR quantitativa', 'clone reexpandindo antes de alteração no hemograma', 'janela para intervenção preemptiva'], nota: 'Aqui o laboratório antecipa a clínica em semanas a meses.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Sempre lido junto com', ids: ['flt3'], leitura: 'NPM1 favorável só permanece favorável na ausência de FLT3-ITD de alta razão alélica.' },
    ],
    advertencia: 'Marcador prognóstico e de doença residual — não estabelece o diagnóstico de leucemia por si.',
    utilidade: ['prognostico', 'acompanhamento'],
    estudarTambem: ['flt3', 'imunofenotipagem'],
  },

  {
    id: 'imunofenotipagem',
    nome: 'Imunofenotipagem por citometria de fluxo',
    sigla: 'Citometria',
    sinonimos: ['imunofenotipagem', 'citometria de fluxo', 'facs', 'painel de marcadores celulares'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico', 'imunologico'],
    material: 'Sangue total com EDTA, medula óssea ou líquidos (liquor, pleural)',
    unidade: 'percentual de células por população e intensidade de expressão',
    referencias: [
      { rotulo: 'Resultado', texto: 'Populações com padrão de expressão normal, sem clone identificado', unidade: '' },
      { rotulo: 'Relação kappa/lambda em linfócitos B', minimo: 0.9, maximo: 3.0, unidade: 'razão', observacao: 'Razão fora de 0,5–4,0 sugere restrição de cadeia leve — ou seja, clonalidade B.' },
    ],
    resumo:
      'O exame que identifica cada célula pelos antígenos que ela expressa, uma a uma, aos milhares por segundo. É o que transforma "linfocitose" em "linfócitos B clonais com restrição de cadeia leve kappa" — a diferença entre reação e doença.',
    entenda:
      'A citometria marca as células com anticorpos ligados a fluoróforos e as passa por um laser individualmente. Cada célula produz uma assinatura de tamanho, granularidade e expressão de antígenos. Duas perguntas são respondidas: qual é a linhagem (mieloide, B, T, NK) e o padrão é normal ou aberrante. A clonalidade B se estabelece pela restrição de cadeia leve — populações normais de linfócitos B misturam kappa e lambda numa proporção de 2:1; um clone expressa apenas uma.',
    aprofundar: [
      'A citometria não substitui a morfologia — ela a complementa. O esfregaço mostra o que a célula parece; a citometria mostra o que ela expressa. Há linfomas com morfologia banal e imunofenótipo inequívoco, e há blastos morfologicamente evidentes cuja linhagem só a citometria define — decisão que muda inteiramente o protocolo terapêutico entre leucemia linfoide e mieloide aguda.',
      'A linfocitose do adulto é o cenário em que o exame mais rende. Linfocitose persistente com linfócitos pequenos e maduros, CD5 e CD19 coexpressos, CD23 positivo e restrição de cadeia leve é leucemia linfocítica crônica — diagnóstico feito no sangue periférico, sem biópsia. Linfocitose com padrão policlonal e história de infecção viral recente é reação, e só precisa de repetição do hemograma.',
      'A citometria também quantifica doença residual mensurável com sensibilidade de 10⁻⁴ a 10⁻⁵, e detecta populações raras em líquidos — infiltração leptomeníngea no liquor com celularidade quase normal é um achado que só a citometria alcança, e que muda o estadiamento.',
      'Uma limitação prática que precisa ser dita: a amostra tem que chegar viva. Células apoptóticas mudam o padrão de expressão e produzem laudos inconclusivos. Amostra de fim de semana, transporte demorado ou refrigeração inadequada inutilizam o exame — e a repetição exige nova punção.',
    ],
    fisiologia: {
      oQueE: 'Técnica de identificação e quantificação de populações celulares pela expressão de antígenos de superfície e citoplasmáticos.',
      origem: 'Aplica-se a qualquer suspensão celular: sangue, medula, linfonodo dissociado, liquor, líquidos de serosas.',
      funcao: 'Definir linhagem, estágio de maturação e clonalidade das células presentes.',
      percurso: [
        'Marcação com anticorpos fluorescentes',
        'passagem célula a célula pelo laser',
        'dispersão frontal (tamanho) e lateral (granularidade)',
        'intensidade de fluorescência por antígeno',
        'agrupamento em populações e identificação de padrão aberrante',
      ],
    },
    aumento: {
      resumo: 'O achado relevante não é um número alto, e sim a presença de uma população com fenótipo aberrante ou restrição de cadeia leve.',
      significado:
        'Uma população clonal identificada estabelece que há doença linfoproliferativa ou mieloide; a ausência de clone em citopenia aponta para causa periférica, carencial ou reacional.',
      mecanismos: [
        {
          titulo: 'Expansão de uma população com fenótipo único',
          explicacao: 'Células derivadas de um mesmo precursor transformado expressam o mesmo conjunto de antígenos, inclusive a mesma cadeia leve — o que uma resposta imune normal, por definição policlonal, nunca faz.',
          exemplos: [
            { causa: 'Leucemia linfocítica crônica', etapas: ['linfocitose persistente > 5.000/mm³', 'linfócitos B coexpressando CD5 e CD19', 'CD23 positivo e cadeia leve restrita', 'diagnóstico fechado no sangue periférico'] },
            { causa: 'Leucemia aguda', etapas: ['blastos > 20% na medula', 'citometria define linhagem mieloide ou linfoide', 'protocolo terapêutico inteiramente diferente conforme a linhagem'], nota: 'É a decisão em que a citometria é insubstituível e urgente.' },
            { causa: 'Linfocitose reacional viral', etapas: ['linfócitos atípicos ativados', 'padrão policlonal com kappa e lambda preservados', 'ausência de aberração fenotípica', 'conduta: repetir o hemograma, não investigar mais'], nota: 'Excluir clone é tão útil quanto encontrá-lo.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A dupla com a morfologia', ids: ['esfregaco', 'leucocitos', 'linfocitos-absolutos'], leitura: 'O esfregaço levanta a suspeita e orienta o painel; a citometria fecha a linhagem e a clonalidade.' },
      { titulo: 'Quando a suspeita é gamopatia', ids: ['eletroforese-proteinas', 'cadeias-leves-livres', 'imunofixacao'], leitura: 'Na suspeita de mieloma, a citometria de medula quantifica os plasmócitos clonais; a eletroforese e a imunofixação caracterizam a proteína que eles produzem.' },
    ],
    interferentes: {
      preAnalitico: [
        'Viabilidade celular: amostra com mais de 24 a 48 horas, congelada ou hemolisada produz laudo inconclusivo.',
        'Liquor e líquidos de serosas têm células frágeis — devem ser processados em poucas horas.',
      ],
      medicamentos: ['Corticoide recente reduz drasticamente a população linfoide e pode mascarar um clone pequeno; rituximab elimina células CD20 positivas e altera todo o painel B.'],
      metodo: ['Painéis diferem entre laboratórios; comparação seriada de doença residual exige o mesmo painel e o mesmo serviço.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    estudarTambem: ['esfregaco', 'linfocitos-absolutos', 'eletroforese-proteinas'],
  },

  {
    id: 'cadeias-leves-livres',
    nome: 'Cadeias leves livres séricas (kappa e lambda)',
    sigla: 'FLC',
    sinonimos: ['cadeias leves livres', 'flc', 'kappa lambda livres', 'relacao kappa lambda', 'freelite'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico', 'renal'],
    material: 'Soro',
    unidade: 'mg/L e razão κ/λ',
    referencias: [
      { rotulo: 'Kappa livre', minimo: 3.3, maximo: 19.4, unidade: 'mg/L' },
      { rotulo: 'Lambda livre', minimo: 5.7, maximo: 26.3, unidade: 'mg/L' },
      { rotulo: 'Razão κ/λ — função renal normal', minimo: 0.26, maximo: 1.65, unidade: 'razão' },
      { rotulo: 'Razão κ/λ — insuficiência renal', minimo: 0.37, maximo: 3.1, unidade: 'razão', observacao: 'A faixa se desloca porque a kappa depende mais da depuração renal; usar a faixa habitual gera falso-positivo em doença renal crônica.' },
    ],
    resumo:
      'As cadeias leves que o plasmócito produz em excesso e não consegue montar com as pesadas. A razão kappa/lambda alterada é o sinal mais sensível de clonalidade plasmocitária — mais que a eletroforese.',
    entenda:
      'Todo plasmócito normal produz um discreto excesso de cadeias leves em relação às pesadas, e esse excesso circula livre até ser filtrado e reabsorvido no túbulo proximal. O que importa não são as concentrações absolutas — que sobem em qualquer inflamação policlonal e na insuficiência renal — e sim a **razão** entre kappa e lambda. Um clone produz uma só, e a razão se desloca. É por isso que o exame detecta mieloma de cadeias leves e amiloidose AL, condições em que a eletroforese sérica pode estar completamente normal.',
    aprofundar: [
      'A cinética explica o valor no seguimento: a meia-vida das cadeias leves livres é de 2 a 6 horas, contra 21 dias da IgG. Isso significa que a resposta ao tratamento aparece nas cadeias leves em dias, enquanto a proteína monoclonal íntegra leva semanas para cair. Em doença de progressão rápida — leucemia de plasmócitos, amiloidose com comprometimento cardíaco — essa diferença de tempo é decisiva.',
      'A interpretação em doença renal exige cuidado explícito. As cadeias leves livres são depuradas pelo rim; quando a filtração cai, ambas se acumulam, mas a kappa (monomérica, menor) se acumula proporcionalmente mais que a lambda (dimérica). Por isso a faixa da razão precisa ser ampliada na DRC — e ignorar isso é uma das causas mais comuns de encaminhamento hematológico desnecessário.',
      'Uma razão muito alterada (acima de 100 ou abaixo de 0,01) em paciente com gamopatia monoclonal assintomática é um dos critérios que definem mieloma que exige tratamento mesmo sem lesão de órgão-alvo estabelecida — o marcador deixou de apenas descrever e passou a indicar conduta.',
    ],
    fisiologia: {
      oQueE: 'Cadeias leves de imunoglobulina não ligadas a cadeias pesadas, circulantes no plasma.',
      origem: 'Plasmócitos da medula óssea e do tecido linfoide.',
      sintese: 'Produzidas em discreto excesso em relação às cadeias pesadas em toda síntese normal de imunoglobulina.',
      funcao: 'Não têm função isolada — são o excedente de uma linha de montagem.',
      eliminacao: 'Filtração glomerular seguida de reabsorção e catabolismo no túbulo proximal.',
      meiaVida: 'Kappa: 2 a 4 horas. Lambda: 3 a 6 horas. Prolonga-se muito na insuficiência renal.',
      orgaosEnvolvidos: ['Medula óssea', 'Rim (túbulo proximal)'],
      percurso: [
        'Plasmócito produz excesso de cadeia leve',
        'circulação como cadeia livre',
        'filtração glomerular',
        'reabsorção e catabolismo tubular proximal',
        'concentração sérica baixa e razão κ/λ estável',
      ],
    },
    aumento: {
      resumo: 'Produção clonal, estímulo policlonal ou retenção renal — só a razão separa os três.',
      mecanismos: [
        {
          titulo: 'Produção monoclonal',
          explicacao: 'Um clone plasmocitário produz uma única cadeia leve em grande quantidade; a outra permanece normal ou cai por supressão da hematopoese policlonal. A razão se desloca de forma marcante.',
          exemplos: [
            { causa: 'Mieloma múltiplo de cadeias leves', etapas: ['clone plasmocitário produz só kappa (ou só lambda)', 'cadeia envolvida ↑↑ e não envolvida ↓', 'razão muito alterada', 'eletroforese sérica pode ser normal'], nota: 'É a razão de as cadeias leves livres serem obrigatórias na triagem de gamopatia, ao lado da eletroforese e da imunofixação.' },
            { causa: 'Amiloidose AL', etapas: ['clone pequeno produz cadeia leve com propensão a formar fibrilas', 'deposição em coração, rim e nervo', 'razão alterada com pico eletroforético pequeno ou ausente'], nota: 'Suspeitar em síndrome nefrótica com proteinúria de cadeia leve, insuficiência cardíaca com paredes espessas e voltagem baixa, ou neuropatia periférica inexplicada.' },
          ],
        },
        {
          titulo: 'Aumento policlonal e retenção renal',
          explicacao: 'Estímulo imune generalizado eleva as duas cadeias; a queda da filtração glomerular reduz a depuração das duas. Em ambos os casos a razão permanece próxima do normal — e é isso que exclui clone.',
          exemplos: [
            { causa: 'Doença autoimune, infecção crônica, HIV', etapas: ['ativação policlonal de plasmócitos', 'kappa e lambda ↑ proporcionalmente', 'razão preservada', 'sem clonalidade'] },
            { causa: 'Doença renal crônica', etapas: ['filtração glomerular ↓', 'acúmulo de ambas as cadeias', 'kappa acumula proporcionalmente mais', 'razão desloca-se levemente para cima'], nota: 'Aplique a faixa ampliada para DRC antes de concluir por clone.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A tríade de triagem da gamopatia', ids: ['eletroforese-proteinas', 'imunofixacao', 'proteinas-totais'], leitura: 'Eletroforese + imunofixação + cadeias leves livres detectam praticamente todas as gamopatias. Nenhuma das três isolada tem essa cobertura.' },
      { titulo: 'A repercussão de órgão-alvo', ids: ['calcio', 'creatinina', 'hemoglobina', 'albumina'], leitura: 'Cálcio alto, creatinina alta, anemia e lesão óssea são o acrônimo CRAB que transforma gamopatia assintomática em mieloma que exige tratamento.' },
    ],
    advertencia:
      'Razão alterada não é sinônimo de mieloma: gamopatia monoclonal de significado indeterminado é muito mais frequente e exige apenas acompanhamento. Ajustar a faixa de referência à função renal antes de interpretar.',
    interferentes: {
      fisiologico: ['Envelhecimento eleva discretamente ambas as cadeias.'],
      metodo: ['Antissoros nefelométricos diferentes dão valores absolutos distintos; o seguimento exige o mesmo método. Excesso de antígeno pode causar subestimação grosseira — o laboratório precisa diluir a amostra.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    estudarTambem: ['eletroforese-proteinas', 'imunofixacao', 'beta-2-microglobulina'],
  },

  {
    id: 'beta-2-microglobulina',
    nome: 'Beta-2-microglobulina',
    sigla: 'β2M',
    sinonimos: ['beta 2 microglobulina', 'b2m', 'beta2 microglobulina'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico', 'renal', 'imunologico'],
    material: 'Soro ou urina',
    unidade: 'mg/L',
    referencias: [
      { rotulo: 'Soro — adultos', minimo: 0.8, maximo: 2.4, unidade: 'mg/L' },
      { rotulo: 'Urina', texto: '< 0,3', unidade: 'mg/L', observacao: 'Elevação urinária isolada indica lesão tubular proximal — a proteína é filtrada e deveria ser inteiramente reabsorvida.' },
    ],
    resumo:
      'A cadeia leve do complexo maior de histocompatibilidade classe I, presente na superfície de toda célula nucleada. No soro, mede massa tumoral e função renal ao mesmo tempo; na urina, mede exclusivamente lesão tubular proximal.',
    entenda:
      'A β2M se desprende continuamente da superfície celular e é depurada quase só pelo rim: filtrada livremente e reabsorvida no túbulo proximal. Isso lhe dá dois usos completamente diferentes. No soro, sobe quando há muitas células produzindo (linfoproliferações) ou quando o rim não depura — e no mieloma essas duas coisas coexistem, o que é justamente por que ela é um marcador prognóstico tão forte ali. Na urina, sobe apenas quando o túbulo proximal falha em reabsorvê-la, servindo como marcador de lesão tubular independentemente do glomérulo.',
    aprofundar: [
      'A β2M sérica compõe, com a albumina, o Sistema Internacional de Estadiamento do mieloma múltiplo — dois exames baratos que estratificam sobrevida melhor que a maioria dos marcadores caros. A lógica é elegante: a β2M reflete massa tumoral e comprometimento renal, e a albumina reflete o estado inflamatório e nutricional produzido pela IL-6.',
      'A distinção entre proteinúria glomerular e tubular usa exatamente essa propriedade. A albumina é grande e só aparece na urina quando o glomérulo falha; a β2M é pequena, é sempre filtrada e só aparece quando o túbulo falha. Proteinúria com β2M urinária alta e albuminúria baixa aponta para nefrite intersticial, síndrome de Fanconi ou nefrotoxicidade tubular — não para glomerulopatia.',
      'A β2M urinária é instável em pH ácido: degrada-se em urina com pH abaixo de 6. A amostra precisa ser alcalinizada ou colhida em recipiente tamponado, e um resultado normal em urina muito ácida não exclui lesão tubular. É uma armadilha pré-analítica que gera falso-negativo com frequência.',
    ],
    fisiologia: {
      oQueE: 'Cadeia leve invariável do complexo MHC classe I, de 11,8 kDa, presente em todas as células nucleadas.',
      origem: 'Superfície de linfócitos, monócitos e demais células nucleadas; liberada pela renovação de membrana.',
      funcao: 'Estabilizar a estrutura do MHC classe I para apresentação de antígenos aos linfócitos T citotóxicos.',
      eliminacao: 'Filtração glomerular livre seguida de reabsorção e catabolismo completo no túbulo proximal.',
      meiaVida: 'Cerca de 2 horas com função renal normal.',
      orgaosEnvolvidos: ['Sistema linfoide', 'Rim (túbulo proximal)'],
      percurso: [
        'Renovação do MHC-I na superfície celular',
        'β2M livre no plasma',
        'filtração glomerular completa',
        'reabsorção no túbulo proximal',
        'catabolismo lisossomal — praticamente nada aparece na urina',
      ],
    },
    aumento: {
      resumo: 'Mais células produzindo, ativação imune, ou rim que não depura — no mieloma, os três ao mesmo tempo.',
      mecanismos: [
        {
          titulo: 'Massa celular expandida e ativação linfoide',
          explicacao: 'A quantidade circulante é proporcional ao número e à taxa de renovação de células nucleadas, especialmente linfoides.',
          exemplos: [
            { causa: 'Mieloma múltiplo', etapas: ['massa plasmocitária expandida', 'liberação de β2M ↑', 'frequente comprometimento renal por cadeias leves', 'β2M sérica ↑↑ — estadiamento e prognóstico'], nota: 'β2M ≥ 5,5 mg/L define o estádio III do ISS, independentemente de outros achados.' },
            { causa: 'Linfomas, leucemia linfocítica crônica, HIV', etapas: ['expansão e ativação linfoide', 'renovação acelerada de MHC-I', 'β2M ↑ proporcional à carga de doença'], nota: 'No HIV, a β2M acompanha a ativação imune crônica e não a carga viral diretamente.' },
          ],
        },
        {
          titulo: 'Retenção por queda de filtração',
          explicacao: 'Sendo depurada quase exclusivamente pelo rim, a β2M acumula-se de forma previsível quando a filtração glomerular cai.',
          exemplos: [
            { causa: 'Doença renal crônica', etapas: ['TFG ↓', 'depuração de β2M ↓', 'β2M sérica ↑ sem doença linfoproliferativa'], nota: 'Interpretar a β2M sérica sem olhar a creatinina produz conclusões oncológicas erradas.' },
            { causa: 'Amiloidose associada à diálise', etapas: ['β2M retida por anos em hemodiálise', 'deposição amiloide em sinóvia e osso', 'síndrome do túnel do carpo e artropatia'], nota: 'A própria molécula retida vira a fibrila amiloide — um marcador que se torna doença.' },
          ],
        },
        {
          titulo: 'Perda urinária por falha tubular',
          explicacao: 'Quando o túbulo proximal está lesado, a proteína filtrada não é reabsorvida e aparece na urina.',
          exemplos: [
            { causa: 'Nefrite intersticial, síndrome de Fanconi, nefrotoxicidade por tenofovir ou aminoglicosídeo', etapas: ['lesão do túbulo proximal', 'reabsorção de proteínas de baixo peso comprometida', 'β2M urinária ↑ com albuminúria baixa', 'padrão de proteinúria tubular'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O estadiamento do mieloma', ids: ['albumina', 'cadeias-leves-livres', 'calcio', 'creatinina'], leitura: 'β2M e albumina compõem o ISS. As cadeias leves e o cálcio dizem se há doença ativa exigindo tratamento.' },
      { titulo: 'Para separar proteinúria glomerular de tubular', ids: ['albuminuria', 'proteinuria', 'creatinina'], leitura: 'Albuminúria alta com β2M urinária normal é glomerular; o inverso é tubular. A distinção muda inteiramente a investigação.' },
    ],
    advertencia: 'Nunca interpretar a β2M sérica sem a função renal ao lado: a elevação por retenção é indistinguível, no número, da elevação por massa tumoral.',
    interferentes: {
      preAnalitico: ['Urina ácida (pH < 6) degrada a proteína e produz falso-negativo na avaliação tubular.'],
      fisiologico: ['Sobe com a idade, acompanhando a queda fisiológica da filtração glomerular.'],
    },
    utilidade: ['prognostico', 'acompanhamento', 'diagnostico'],
    estudarTambem: ['cadeias-leves-livres', 'creatinina', 'albumina'],
  },

  {
    id: 'eletroforese-proteinas',
    nome: 'Eletroforese de proteínas séricas',
    sigla: 'EFP',
    sinonimos: ['eletroforese de proteinas', 'proteinograma', 'efp', 'eletroforese serica', 'spep'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'imunologico', 'hepatobiliar', 'oncologico'],
    material: 'Soro',
    unidade: 'g/dL e % por fração',
    referencias: [
      { rotulo: 'Albumina', minimo: 3.5, maximo: 5.2, unidade: 'g/dL' },
      { rotulo: 'Alfa-1', minimo: 0.1, maximo: 0.4, unidade: 'g/dL' },
      { rotulo: 'Alfa-2', minimo: 0.5, maximo: 1.0, unidade: 'g/dL' },
      { rotulo: 'Beta', minimo: 0.6, maximo: 1.2, unidade: 'g/dL' },
      { rotulo: 'Gama', minimo: 0.7, maximo: 1.6, unidade: 'g/dL' },
      { rotulo: 'Componente monoclonal', texto: 'Ausente', unidade: '' },
    ],
    resumo:
      'Separa as proteínas do soro por carga e tamanho em cinco frações. Cada fração conta uma história diferente — e a presença de um pico estreito na região gama é o achado que muda a vida do paciente.',
    entenda:
      'O soro é aplicado num gel sob campo elétrico e as proteínas migram conforme sua carga. O traçado resultante é lido como um perfil, não como cinco números isolados: a inflamação aguda eleva alfa-1 e alfa-2 e reduz albumina; a cirrose funde as bandas beta e gama; a síndrome nefrótica esvazia a albumina e eleva alfa-2 (a alfa-2-macroglobulina é grande demais para ser perdida na urina); e a gamopatia monoclonal produz um pico estreito e alto onde deveria haver uma elevação larga.',
    aprofundar: [
      'A diferença entre pico monoclonal e hipergamaglobulinemia policlonal é a diferença entre uma célula e um exército. O policlonal é uma elevação larga da base gama inteira — muitos clones, muitas imunoglobulinas diferentes, típico de infecção crônica, hepatopatia e doença autoimune. O monoclonal é um pico estreito, com base curta, porque é uma única proteína idêntica produzida por um único clone.',
      'A fusão beta-gama ("ponte beta-gama") é um dos achados mais específicos da eletroforese: ocorre na cirrose porque a IgA policlonal aumentada migra na região entre beta e gama, preenchendo o vale que normalmente as separa. Ver isso num traçado deveria disparar a pergunta sobre hepatopatia crônica antes de qualquer outro exame.',
      'A ausência da banda alfa-1 é outro achado que se vê e não se calcula: a alfa-1-antitripsina responde por quase toda essa fração, e sua deficiência produz um traçado com um vale onde deveria haver um pico. Enfisema em jovem ou hepatopatia neonatal com alfa-1 achatada leva direto à dosagem da alfa-1-antitripsina.',
      'A eletroforese é uma triagem, não a confirmação. Um pico visualizado precisa de imunofixação para dizer qual imunoglobulina e qual cadeia leve o compõem; e a ausência de pico não exclui gamopatia, porque o mieloma de cadeias leves e a amiloidose AL frequentemente produzem traçado normal. Por isso a triagem completa exige eletroforese + imunofixação + cadeias leves livres.',
    ],
    fisiologia: {
      oQueE: 'Separação das proteínas séricas por migração em campo elétrico, gerando cinco frações e um traçado densitométrico.',
      origem: 'Albumina e a maioria das globulinas alfa e beta são hepáticas; as gamaglobulinas vêm dos plasmócitos.',
      funcao: 'Revelar o perfil de síntese proteica e detectar proteínas anômalas que a dosagem de proteínas totais mascararia.',
      orgaosEnvolvidos: ['Fígado', 'Medula óssea e tecido linfoide', 'Rim'],
      percurso: [
        'Soro aplicado no gel ou capilar',
        'migração por carga sob campo elétrico',
        'albumina migra mais rápido, gama mais lento',
        'densitometria do traçado',
        'leitura do perfil e busca de pico estreito',
      ],
    },
    aumento: {
      resumo: 'Cada fração sobe por um motivo diferente — e o padrão do conjunto vale muito mais que qualquer valor isolado.',
      mecanismos: [
        {
          titulo: 'Pico monoclonal na região gama ou beta',
          explicacao: 'Um clone plasmocitário produz uma imunoglobulina idêntica em grande quantidade, gerando uma banda estreita e alta.',
          exemplos: [
            { causa: 'Gamopatia monoclonal de significado indeterminado', etapas: ['clone plasmocitário pequeno', 'pico < 3 g/dL', 'plasmócitos medulares < 10%', 'sem lesão de órgão-alvo', 'conduta: acompanhamento seriado'], nota: 'É o desfecho mais frequente de um pico monoclonal — a maioria nunca evolui.' },
            { causa: 'Mieloma múltiplo', etapas: ['expansão plasmocitária clonal', 'pico monoclonal alto com supressão das demais imunoglobulinas', 'lesão de órgão: cálcio ↑, creatinina ↑, anemia, lesão óssea'], nota: 'A supressão das imunoglobulinas normais explica as infecções de repetição.' },
          ],
        },
        {
          titulo: 'Elevação policlonal da gama',
          explicacao: 'Estímulo antigênico crônico ativa muitos clones diferentes; a base gama inteira se eleva de forma larga.',
          exemplos: [
            { causa: 'Cirrose hepática', etapas: ['translocação bacteriana intestinal e estímulo antigênico persistente', 'IgA policlonal ↑', 'ponte beta-gama no traçado', 'albumina ↓ simultaneamente'], nota: 'Albumina baixa com gama larga e ponte beta-gama é praticamente assinatura de hepatopatia crônica.' },
            { causa: 'Doença autoimune, HIV, infecção crônica', etapas: ['ativação policlonal de plasmócitos', 'gama larga sem pico', 'razão kappa/lambda preservada'] },
          ],
        },
        {
          titulo: 'Padrão de fase aguda e padrão nefrótico',
          explicacao: 'A inflamação e a perda urinária seletiva remodelam as frações de formas opostas e reconhecíveis.',
          exemplos: [
            { causa: 'Inflamação aguda', etapas: ['albumina ↓ (fase aguda negativa)', 'alfa-1 e alfa-2 ↑ (antitripsina, haptoglobina, ceruloplasmina)', 'gama normal'] },
            { causa: 'Síndrome nefrótica', etapas: ['perda urinária de proteínas de médio peso', 'albumina ↓↓ e gama ↓', 'alfa-2 ↑ — a alfa-2-macroglobulina é grande demais para ser filtrada', 'padrão característico com pico alfa-2 dominante'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para caracterizar um pico', ids: ['imunofixacao', 'cadeias-leves-livres', 'imunoglobulinas'], leitura: 'A eletroforese vê o pico; a imunofixação diz de que ele é feito; as cadeias leves livres detectam o que ele não mostra.' },
      { titulo: 'Para saber se há doença de órgão-alvo', ids: ['calcio', 'creatinina', 'hemoglobina', 'beta-2-microglobulina'], leitura: 'Um pico monoclonal só vira urgência quando acompanhado de hipercalcemia, insuficiência renal, anemia ou lesão óssea.' },
    ],
    advertencia:
      'Traçado normal não exclui gamopatia: mieloma de cadeias leves, mieloma não secretor e amiloidose AL podem cursar com eletroforese sérica inteiramente normal. Complementar sempre com imunofixação e cadeias leves livres quando a suspeita é clínica.',
    interferentes: {
      preAnalitico: ['Usar plasma em vez de soro cria uma banda de fibrinogênio na região beta-gama que imita um pico monoclonal — erro pré-analítico clássico.', 'Hemólise adiciona banda de hemoglobina-haptoglobina na região alfa-2.'],
      medicamentos: ['Anticorpos monoclonais terapêuticos (daratumumabe, elotuzumabe) aparecem como pequenos picos e confundem a avaliação de resposta no mieloma.'],
    },
    utilidade: ['triagem', 'diagnostico', 'acompanhamento'],
    estudarTambem: ['imunofixacao', 'cadeias-leves-livres', 'albumina', 'imunoglobulinas'],
  },

  {
    id: 'imunofixacao',
    nome: 'Imunofixação de proteínas',
    sigla: 'IFE',
    sinonimos: ['imunofixacao', 'ife', 'imunofixacao serica', 'imunofixacao urinaria', 'imunoeletroforese'],
    grupo: 'onco-hematologia',
    sistemas: ['hematologico', 'oncologico', 'imunologico'],
    material: 'Soro e/ou urina de 24 horas',
    unidade: 'qualitativo — tipo de cadeia pesada e leve',
    referencias: [
      { rotulo: 'Soro', texto: 'Ausência de banda monoclonal', unidade: '' },
      { rotulo: 'Urina', texto: 'Ausência de proteína de Bence Jones', unidade: '' },
    ],
    resumo:
      'Identifica de que imunoglobulina é feito o pico visto na eletroforese: qual cadeia pesada (IgG, IgA, IgM) e qual cadeia leve (kappa ou lambda). É a confirmação de clonalidade, não a triagem.',
    entenda:
      'Depois de separar as proteínas por eletroforese, aplica-se sobre cada trilha um antissoro específico — anti-IgG, anti-IgA, anti-IgM, anti-kappa, anti-lambda. A proteína que reage precipita e cora como uma banda nítida. Um clone produz uma banda em exatamente duas trilhas: a da sua cadeia pesada e a da sua cadeia leve. É essa coincidência de posição em duas trilhas que estabelece o diagnóstico de gamopatia monoclonal.',
    aprofundar: [
      'A imunofixação urinária responde uma pergunta que o exame de urina de rotina não responde: a fita reagente detecta albumina e é praticamente cega para cadeias leves. A proteína de Bence Jones pode existir em quantidade suficiente para causar lesão renal com a fita marcando "traços". Por isso, na suspeita de mieloma, a pesquisa se faz por imunofixação em urina concentrada de 24 horas, nunca por fita.',
      'O tipo de cadeia pesada tem consequência clínica direta. IgM monoclonal aponta para macroglobulinemia de Waldenström e para o risco de síndrome de hiperviscosidade — a molécula é pentamérica e grande. IgA monoclonal migra na região beta e pode se esconder no traçado da eletroforese, sendo revelada só pela imunofixação. IgD e IgE monoclonais são raros e frequentemente perdidos se o painel não incluir os antissoros correspondentes.',
      'Depois do tratamento, a imunofixação define a resposta completa: o pico pode ter desaparecido da eletroforese e a imunofixação ainda mostrar banda residual. É o critério que separa "resposta parcial muito boa" de "resposta completa", e a diferença tem peso prognóstico.',
    ],
    fisiologia: {
      oQueE: 'Técnica que combina separação eletroforética com precipitação por antissoros específicos para tipificar imunoglobulinas.',
      origem: 'Detecta o produto de um clone plasmocitário ou linfoplasmocitário.',
      funcao: 'Estabelecer se uma banda é monoclonal e identificar sua composição de cadeias pesada e leve.',
      percurso: [
        'Eletroforese em múltiplas trilhas paralelas',
        'aplicação de antissoro específico sobre cada trilha',
        'precipitação do complexo antígeno-anticorpo',
        'coloração e leitura',
        'banda nítida coincidente em duas trilhas = clone',
      ],
    },
    aumento: {
      resumo: 'A presença de banda monoclonal define clonalidade; o tipo identificado orienta o diagnóstico específico.',
      significado:
        'Banda presente em soro ou urina estabelece que existe um clone produtor. A magnitude, a repercussão de órgão e o percentual de plasmócitos medulares é que definem se é gamopatia de significado indeterminado, mieloma indolente ou mieloma que exige tratamento.',
      mecanismos: [
        {
          titulo: 'Produção de imunoglobulina idêntica por um clone',
          explicacao: 'Todas as moléculas produzidas por um clone têm a mesma cadeia pesada e a mesma cadeia leve, e portanto a mesma mobilidade eletroforética — daí a banda estreita e a reatividade restrita a dois antissoros.',
          exemplos: [
            { causa: 'Mieloma IgG kappa', etapas: ['clone plasmocitário produz IgG kappa', 'banda coincidente nas trilhas anti-IgG e anti-kappa', 'ausência de banda nas demais', 'supressão das imunoglobulinas policlonais'] },
            { causa: 'Macroglobulinemia de Waldenström', etapas: ['clone linfoplasmocitário produz IgM', 'banda em anti-IgM e numa das cadeias leves', 'IgM pentamérica eleva a viscosidade', 'risco de sangramento mucoso, alteração visual e confusão'], nota: 'IgM monoclonal com sintomas neurológicos ou visuais é urgência por hiperviscosidade.' },
            { causa: 'Mieloma de cadeias leves', etapas: ['clone produz apenas cadeia leve', 'imunofixação sérica pode mostrar só a cadeia leve, sem pesada', 'imunofixação urinária positiva para Bence Jones', 'lesão tubular renal por cilindros de cadeia leve'], nota: 'A eletroforese sérica costuma ser normal — este é o caso que ela perde.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A tríade da investigação', ids: ['eletroforese-proteinas', 'cadeias-leves-livres'], leitura: 'Eletroforese detecta, imunofixação tipifica, cadeias leves livres quantificam e detectam o que as outras duas perdem.' },
      { titulo: 'Quando a IgM é monoclonal', ids: ['imunoglobulinas', 'plaquetas'], leitura: 'IgM alta com sintomas de hiperviscosidade exige avaliação imediata; a IgM também interfere em ensaios de coagulação e pode causar sangramento por disfunção plaquetária adquirida.' },
    ],
    advertencia:
      'A imunofixação é qualitativa: ela diz que existe e do que é feito, não quanto. A quantificação vem da eletroforese e das cadeias leves livres. Bandas pequenas transitórias podem aparecer após transplante ou infecção grave e não indicam neoplasia.',
    interferentes: {
      preAnalitico: ['Urina não concentrada pode dar falso-negativo para Bence Jones — a coleta de 24 horas com concentração é obrigatória.'],
      medicamentos: ['Anticorpos monoclonais terapêuticos produzem bandas próprias, tipicamente IgG kappa, que podem ser confundidas com doença residual.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['eletroforese-proteinas', 'cadeias-leves-livres', 'beta-2-microglobulina'],
  },
]
