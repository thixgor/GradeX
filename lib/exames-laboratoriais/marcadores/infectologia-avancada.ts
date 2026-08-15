import type { Marcador } from '../tipos'

/**
 * Infectologia laboratorial — HIV, hepatites virais e sífilis, marcador a
 * marcador.
 *
 * "Sorologia positiva" é uma das frases mais perigosas da medicina, porque ela
 * some com a distinção que decide tudo: **anticorpo é memória, antígeno é
 * presença, ácido nucleico é replicação**. Uma pessoa com anti-HBc positivo
 * isolado, uma com HBsAg positivo e uma com carga viral de 10 milhões têm
 * relações completamente diferentes com o mesmo vírus, e a única forma de
 * separá-las é entender o que cada marcador mede.
 *
 * O segundo fio condutor é o tempo. Toda infecção tem uma janela em que o
 * exame ainda não virou, e a duração dessa janela depende do que se mede: o
 * RNA aparece primeiro, depois o antígeno, depois o IgM, depois o IgG. Saber
 * essa ordem é o que permite dizer "esse resultado negativo não vale ainda" —
 * uma frase que evita transmissões.
 */
export const marcadores: Marcador[] = [
  /* ═══════════════════════════ HIV ═══════════════════════════ */
  {
    id: 'hiv-antigeno-anticorpo',
    nome: 'Teste de HIV de 4ª geração (antígeno p24 e anticorpos)',
    sigla: 'Ag/Ac HIV',
    sinonimos: ['hiv', 'teste hiv', 'anti-hiv', 'p24', 'hiv 4a geracao', 'elisa hiv', 'sorologia hiv'],
    grupo: 'infectologia',
    sistemas: ['infeccioso', 'imunologico'],
    material: 'Soro ou plasma',
    unidade: 'reagente/não reagente',
    referencias: [
      { rotulo: 'Resultado', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Janela diagnóstica — 4ª geração', texto: '15 a 20 dias', unidade: '', observacao: 'A detecção do antígeno p24 encurta a janela em cerca de uma semana em relação aos testes que só detectam anticorpo.' },
    ],
    resumo:
      'Detecta simultaneamente o antígeno viral p24 e os anticorpos anti-HIV. É o teste inicial recomendado, e sua principal virtude é encurtar a janela imunológica ao capturar a infecção antes da soroconversão.',
    entenda:
      'Depois da exposição, o HIV replica intensamente por semanas antes que o organismo produza anticorpos. Nesse período — a infecção aguda — a carga viral é altíssima e a transmissibilidade é máxima, mas os testes de terceira geração, que só detectam anticorpo, resultam negativos. O antígeno p24 é uma proteína do capsídeo viral que aparece no plasma por volta do 15º dia e desaparece quando os anticorpos surgem e formam complexos com ele. O teste de quarta geração cobre justamente essa lacuna.',
    aprofundar: [
      'A curva temporal dos marcadores é o que organiza todo o raciocínio: o RNA viral é detectável por volta do 10º dia, o antígeno p24 entre o 15º e o 20º, os anticorpos IgM/IgG a partir do 20º ao 30º dia. Um teste de quarta geração não reagente 30 dias após uma exposição de risco alto ainda merece repetição; não reagente aos 90 dias praticamente exclui.',
      'Existe uma zona de "janela do antígeno" que confunde: entre a terceira e a quinta semana, o p24 pode já ter caído (consumido pelos anticorpos nascentes) enquanto os anticorpos ainda estão abaixo do limiar de detecção. É raro, mas ocorre — e é a razão de a suspeita clínica de síndrome retroviral aguda (febre, faringite, exantema, linfadenopatia, úlceras orais) justificar carga viral mesmo com teste de quarta geração negativo.',
      'O fluxograma diagnóstico brasileiro exige dois testes com metodologias diferentes para conclusão. Um resultado reagente isolado nunca deve ser comunicado como diagnóstico: a prevalência da infecção na população testada determina o valor preditivo positivo, e em populações de baixa prevalência os falso-reagentes não são desprezíveis. Comunicar diagnóstico de HIV com base em um único teste é um erro com consequências devastadoras.',
      'Uma situação específica que precisa ser conhecida: crianças nascidas de mães vivendo com HIV carregam anticorpos maternos transferidos pela placenta até 18 meses de idade. Nelas, o teste sorológico é inútil para diagnóstico e a definição se faz exclusivamente por carga viral.',
    ],
    fisiologia: {
      oQueE: 'Imunoensaio que detecta o antígeno p24 do capsídeo do HIV e anticorpos das classes IgM e IgG contra proteínas virais.',
      origem: 'O p24 vem da replicação viral ativa; os anticorpos, da resposta humoral do hospedeiro.',
      funcao: 'Identificar infecção pelo HIV o mais precocemente possível.',
      percurso: [
        'Exposição e infecção das células CD4',
        'replicação viral intensa — RNA detectável em ~10 dias',
        'antigenemia p24 entre 15 e 20 dias',
        'soroconversão IgM e IgG entre 20 e 30 dias',
        'complexação do p24 pelos anticorpos e queda da antigenemia',
      ],
    },
    aumento: {
      resumo: 'Resultado reagente indica infecção pelo HIV — sempre a ser confirmada por segundo teste de metodologia distinta.',
      significado:
        'Reagente confirmado estabelece a infecção, não o estágio. Definir se há imunodeficiência exige CD4 e carga viral.',
      mecanismos: [
        {
          titulo: 'Presença de antígeno viral ou de resposta humoral',
          explicacao: 'O ensaio captura duas realidades biológicas distintas: proteína do vírus circulante e anticorpos produzidos contra ele.',
          exemplos: [
            { causa: 'Infecção aguda pelo HIV', etapas: ['replicação viral maciça', 'antigenemia p24 detectável', 'anticorpos ainda ausentes ou incipientes', 'teste reagente com carga viral muito alta e imunoblot indeterminado'], nota: 'Fase de maior transmissibilidade de toda a história natural — reconhecer muda o desfecho de contatos.' },
            { causa: 'Infecção crônica estabelecida', etapas: ['anticorpos anti-HIV plenamente formados', 'p24 complexado e indetectável', 'teste reagente por componente de anticorpo'] },
            { causa: 'Reatividade inespecífica', etapas: ['gestação, doença autoimune, vacinação recente ou hipergamaglobulinemia', 'reação cruzada no imunoensaio', 'segundo teste de metodologia diferente não reagente'], nota: 'É exatamente por isso que o fluxograma exige dois testes distintos.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Não reagente significa ausência de infecção — desde que a janela tenha sido respeitada.',
      mecanismos: [
        {
          titulo: 'Janela imunológica',
          explicacao: 'Antes de haver antígeno ou anticorpo em quantidade detectável, o exame é negativo numa pessoa efetivamente infectada e altamente transmissora.',
          exemplos: [
            { causa: 'Exposição recente (menos de 15 dias)', etapas: ['replicação viral em curso', 'antigenemia ainda abaixo do limiar', 'anticorpos ausentes', 'teste não reagente apesar da infecção'], nota: 'Se a exposição foi de alto risco, a conduta é profilaxia pós-exposição e repetição do teste, não alta.' },
            { causa: 'Profilaxia pré ou pós-exposição em uso', etapas: ['supressão da replicação viral', 'soroconversão atrasada ou atenuada', 'necessidade de janela ampliada para conclusão'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Depois do diagnóstico', ids: ['carga-viral-hiv', 'cd4'], leitura: 'A carga viral mede a replicação e guia o tratamento; o CD4 mede o dano imunológico acumulado e define a profilaxia de infecções oportunistas.' },
      { titulo: 'Coinfecções a rastrear sempre', ids: ['hbsag', 'anti-hcv', 'vdrl'], leitura: 'Hepatites B e C e sífilis compartilham vias de transmissão e devem ser pesquisadas em todo diagnóstico novo de HIV.' },
    ],
    advertencia:
      'Um único teste reagente não estabelece diagnóstico. A confirmação exige segundo teste com metodologia diferente, conforme o fluxograma vigente. Em menores de 18 meses, o diagnóstico é exclusivamente por carga viral.',
    utilidade: ['diagnostico', 'triagem'],
    estudarTambem: ['carga-viral-hiv', 'cd4', 'linfocitos-absolutos'],
  },

  {
    id: 'carga-viral-hiv',
    nome: 'Carga viral do HIV (RNA quantitativo)',
    sigla: 'CV-HIV',
    sinonimos: ['carga viral', 'carga viral hiv', 'rna hiv', 'hiv rna quantitativo', 'viremia hiv'],
    grupo: 'infectologia',
    sistemas: ['infeccioso', 'imunologico'],
    material: 'Plasma com EDTA',
    unidade: 'cópias/mL e log₁₀',
    referencias: [
      { rotulo: 'Meta terapêutica', texto: 'Indetectável (< 40 ou < 50 cópias/mL, conforme o método)', unidade: 'cópias/mL' },
      { rotulo: 'Falha virológica', texto: '> 200 cópias/mL confirmada em duas amostras sob tratamento', unidade: 'cópias/mL' },
      { rotulo: 'Infecção aguda', texto: 'Frequentemente > 100.000', unidade: 'cópias/mL' },
    ],
    resumo:
      'Quantifica o RNA viral circulante. Mede replicação em tempo real: guia o tratamento, define falha terapêutica e é o exame que sustenta o princípio de que indetectável é intransmissível.',
    entenda:
      'A carga viral e o CD4 respondem perguntas diferentes e complementares. A carga viral é o quanto o vírus está se replicando **agora** — é dinâmica, responde ao tratamento em semanas e diz sobre transmissibilidade. O CD4 é o dano imunológico **acumulado** — muda lentamente e diz sobre risco de infecção oportunista. Um paciente pode ter carga viral indetectável há anos e CD4 ainda baixo, porque a recuperação imune é mais lenta que a supressão viral.',
    aprofundar: [
      'O conceito de indetectável igual a intransmissível transformou a epidemiologia e a vida das pessoas vivendo com HIV: a supressão viral sustentada por pelo menos seis meses elimina a transmissão sexual do vírus. Isso deu ao exame um peso que vai muito além do acompanhamento clínico — ele é o instrumento de uma mudança social real, e comunicá-lo corretamente faz parte do cuidado.',
      'A leitura em log₁₀ é a que importa clinicamente. Uma queda de 1 log é uma redução de dez vezes. Após o início do tratamento, espera-se queda de pelo menos 1 log em 4 semanas e supressão completa em 12 a 24 semanas. Uma queda menor que essa levanta suspeita de adesão insuficiente, interação farmacológica ou resistência — e a ordem de investigação é sempre essa, porque adesão é de longe a causa mais comum.',
      'Os "blips" — elevações transitórias e isoladas entre 50 e 200 cópias/mL em paciente previamente suprimido — geralmente não indicam falha e não justificam mudança de esquema. Reagir a um blip trocando o tratamento expõe o paciente a novos efeitos adversos sem benefício. Falha virológica exige valores acima de 200 confirmados em duas amostras.',
      'Em recém-nascidos de mães vivendo com HIV, a carga viral é o único método diagnóstico válido: os anticorpos maternos atravessam a placenta e tornam a sorologia positiva na criança não infectada até os 18 meses.',
    ],
    fisiologia: {
      oQueE: 'Quantificação por amplificação de ácido nucleico do RNA do HIV-1 no plasma.',
      origem: 'Vírions produzidos por linfócitos T CD4 e macrófagos infectados.',
      funcao: 'Medir a intensidade da replicação viral em curso.',
      meiaVida: 'O vírion plasmático tem meia-vida de menos de 6 horas — a viremia reflete produção contínua, não acúmulo.',
      percurso: [
        'Infecção de linfócito CD4',
        'transcrição reversa e integração ao genoma',
        'produção de novos vírions',
        'liberação no plasma',
        'RNA quantificado — reflete a taxa de produção do momento',
      ],
    },
    aumento: {
      resumo: 'Replicação viral ativa: infecção não tratada, falha de adesão, resistência ou ativação imune intercorrente.',
      mecanismos: [
        {
          titulo: 'Replicação sem supressão farmacológica',
          explicacao: 'Sem antirretroviral eficaz, o vírus produz bilhões de partículas por dia, e a viremia reflete diretamente essa produção.',
          exemplos: [
            { causa: 'Infecção aguda', etapas: ['ausência de resposta imune específica', 'replicação explosiva no tecido linfoide intestinal', 'carga viral frequentemente acima de 100.000 cópias/mL', 'depleção maciça de CD4 de mucosa'], nota: 'Pico de viremia coincide com o pico de transmissibilidade.' },
            { causa: 'Falha de adesão ao tratamento', etapas: ['concentração subterapêutica dos antirretrovirais', 'retomada da replicação', 'carga viral volta a subir', 'risco de seleção de mutações de resistência'], nota: 'Primeira hipótese diante de qualquer rebote — antes de genotipagem.' },
            { causa: 'Resistência viral', etapas: ['mutações selecionadas sob pressão farmacológica parcial', 'perda de eficácia do esquema', 'viremia persistente apesar de adesão adequada', 'genotipagem indica troca de esquema'] },
          ],
        },
        {
          titulo: 'Elevação transitória por ativação imune',
          explicacao: 'Infecções intercorrentes e vacinação ativam linfócitos latentemente infectados e produzem viremia passageira.',
          exemplos: [
            { causa: 'Vacinação recente ou infecção intercorrente', etapas: ['ativação de células com provírus latente', 'produção viral transitória', 'blip entre 50 e 200 cópias/mL', 'retorno espontâneo à indetecção'], nota: 'Não é falha; repetir em 4 a 8 semanas antes de qualquer decisão.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A dupla do acompanhamento', ids: ['cd4', 'hiv-antigeno-anticorpo'], leitura: 'A carga viral mede o vírus, o CD4 mede o hospedeiro. Supressão viral vem em meses; recuperação de CD4 pode levar anos.' },
      { titulo: 'Toxicidade do tratamento', ids: ['creatinina', 'alt', 'colesterol-total', 'triglicerideos'], leitura: 'O acompanhamento inclui função renal (tenofovir), hepática e perfil lipídico — a doença virou crônica e o cuidado é o de uma condição crônica.' },
    ],
    interferentes: {
      preAnalitico: ['O RNA é instável: plasma que demora mais de 6 horas para ser separado, ou tubo mantido em temperatura ambiente por longo período, subestima o resultado.'],
      metodo: ['Limites de detecção variam entre plataformas; "indetectável" significa "abaixo do limite daquele método", e comparar valores entre laboratórios exige atenção ao limite declarado.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    estudarTambem: ['cd4', 'hiv-antigeno-anticorpo'],
  },

  {
    id: 'cd4',
    nome: 'Contagem de linfócitos T CD4 e relação CD4/CD8',
    sigla: 'CD4',
    sinonimos: ['cd4', 'linfocitos cd4', 't4', 'contagem de cd4', 'cd4/cd8', 'relacao cd4 cd8'],
    grupo: 'infectologia',
    sistemas: ['imunologico', 'infeccioso', 'hematologico'],
    material: 'Sangue total com EDTA (citometria de fluxo)',
    unidade: 'células/mm³ e %',
    referencias: [
      { rotulo: 'Adultos', minimo: 500, maximo: 1500, unidade: 'células/mm³' },
      { rotulo: 'Percentual de CD4', minimo: 30, maximo: 60, unidade: '%', observacao: 'Menos sujeito a variação que o absoluto — preferido em crianças e quando há leucopenia.' },
      { rotulo: 'Relação CD4/CD8', minimo: 1.0, maximo: 3.0, unidade: 'razão' },
      { rotulo: 'Risco de infecções oportunistas', texto: '< 200 células/mm³', unidade: 'células/mm³', observacao: 'Limiar clássico para profilaxia de pneumocistose.' },
    ],
    resumo:
      'Quantifica os linfócitos T auxiliares — a célula que o HIV destrói. Não mede o vírus: mede o dano imunológico acumulado, e é o que define risco de infecção oportunista e necessidade de profilaxia.',
    entenda:
      'O linfócito T CD4 é o maestro da resposta imune adaptativa: ativa macrófagos, ajuda linfócitos B a produzir anticorpos e sustenta os T citotóxicos. Sua depleção progressiva explica o espectro de infecções que definem a aids, e explica também por que esse espectro é previsível pela contagem. Abaixo de 200, pneumocistose. Abaixo de 100, toxoplasmose cerebral e criptococose. Abaixo de 50, micobacteriose atípica disseminada e retinite por citomegalovírus. É um dos raros exames em que um número traduz diretamente uma lista de diagnósticos a considerar.',
    aprofundar: [
      'O valor percentual é mais estável que o absoluto, porque o absoluto é o produto de três medidas — leucócitos totais, percentual de linfócitos e percentual de CD4 — e a variabilidade de cada uma se multiplica. Em situações que alteram os leucócitos totais (infecção aguda, corticoide, esplenectomia), o percentual é mais confiável. Em crianças menores de 5 anos, cujos valores absolutos são fisiologicamente muito mais altos, o percentual é o parâmetro padrão.',
      'A relação CD4/CD8 traz informação que a contagem isolada não traz. Ela permanece invertida em muitos pacientes com CD4 já recuperado sob tratamento, e essa inversão persistente se associa a inflamação crônica e a maior risco de doença cardiovascular e neoplasia não definidora de aids. É um marcador de envelhecimento imunológico, não de imunodeficiência aguda.',
      'A contagem de CD4 tem variabilidade biológica alta: cai com infecção intercorrente, com corticoide, com cirurgia recente, e varia ao longo do dia. Decisões clínicas não devem se basear numa única medida em paciente doente — a repetição fora do quadro agudo é o que dá o valor real.',
      'Uma nota epidemiológica importante: com o tratamento precoce universal, o CD4 perdeu peso na decisão de iniciar antirretroviral (que hoje é imediato, em qualquer contagem) e manteve peso na decisão sobre profilaxias e sobre a suspensão delas. O exame mudou de função sem perder relevância.',
    ],
    fisiologia: {
      oQueE: 'Subpopulação de linfócitos T que expressa a molécula CD4, correceptora do MHC classe II.',
      origem: 'Timo, a partir de precursores medulares; a maior parte reside em tecido linfoide, sobretudo o intestinal.',
      funcao: 'Coordenar a resposta imune adaptativa: ativação de macrófagos, auxílio à produção de anticorpos, manutenção da resposta citotóxica.',
      circulacao: 'Apenas cerca de 2% dos linfócitos T do organismo estão no sangue — a contagem periférica é uma amostra de um compartimento muito maior.',
      orgaosEnvolvidos: ['Timo', 'Linfonodos', 'Tecido linfoide associado à mucosa intestinal', 'Baço'],
      percurso: [
        'HIV liga-se ao CD4 e ao correceptor CCR5 ou CXCR4',
        'infecção e destruição direta ou por ativação imune',
        'depleção maciça no tecido linfoide intestinal já na fase aguda',
        'declínio progressivo no sangue ao longo de anos',
        'abaixo de 200/mm³, perda do controle de patógenos intracelulares',
      ],
    },
    aumento: {
      resumo: 'Recuperação imunológica sob tratamento, ou elevação relativa em linfocitose de outra causa.',
      mecanismos: [
        {
          titulo: 'Reconstituição imune',
          explicacao: 'Com a replicação viral suprimida, cessa a destruição e a redistribuição a partir dos tecidos linfoides eleva a contagem periférica; depois, a produção tímica repõe lentamente.',
          exemplos: [
            { causa: 'Início de antirretroviral eficaz', etapas: ['carga viral suprimida', 'redistribuição rápida de células dos tecidos nos primeiros meses', 'reposição tímica lenta ao longo de anos', 'CD4 sobe em média 50 a 150 células/mm³ por ano'], nota: 'A recuperação é mais lenta e menos completa quanto mais tarde o tratamento começa — o argumento central do tratamento precoce.' },
            { causa: 'Síndrome inflamatória de reconstituição imune', etapas: ['recuperação rápida da resposta contra patógeno latente', 'inflamação intensa contra antígenos micobacterianos ou fúngicos', 'piora clínica paradoxal apesar da melhora laboratorial'], nota: 'Piora clínica com CD4 subindo e carga viral caindo é reconstituição, não falha.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Destruição pelo HIV, supressão medular, redistribuição transitória ou linfopenia idiopática.',
      significado: 'Abaixo de 200 células/mm³ define aids independentemente de manifestação clínica, e indica profilaxia primária de pneumocistose.',
      mecanismos: [
        {
          titulo: 'Destruição e exaustão pelo HIV',
          explicacao: 'Além da lise direta das células infectadas, a ativação imune crônica acelera a apoptose de células não infectadas — a maior parte da depleção é indireta.',
          exemplos: [
            { causa: 'HIV não tratado', etapas: ['replicação viral persistente', 'destruição direta e ativação imune crônica', 'declínio progressivo de CD4 ao longo de anos', 'infecções oportunistas conforme o limiar atingido'] },
            { causa: 'Infecção intercorrente aguda ou corticoterapia', etapas: ['redistribuição de linfócitos para tecidos', 'queda transitória do CD4 periférico', 'recuperação espontânea com a resolução'], nota: 'Não confundir com progressão da doença: repetir fora do quadro agudo.' },
          ],
        },
        {
          titulo: 'Linfopenia não relacionada ao HIV',
          explicacao: 'CD4 baixo não é sinônimo de HIV — quimioterapia, imunossupressores, desnutrição grave e linfopenia idiopática produzem o mesmo achado.',
          exemplos: [
            { causa: 'Linfocitopenia T CD4 idiopática', etapas: ['CD4 persistentemente < 300/mm³', 'sorologia para HIV repetidamente negativa', 'ausência de outra imunodeficiência identificável', 'risco aumentado de criptococose e outras oportunistas'] },
            { causa: 'Imunossupressão farmacológica', etapas: ['corticoide em dose alta, quimioterapia, anticorpos anti-linfocitários', 'depleção de CD4', 'risco oportunista análogo ao do HIV avançado'], nota: 'Profilaxia de pneumocistose se aplica também nesse contexto.' },
          ],
        },
      ],
    },
    comparacoes: [
      {
        id: 'cd4-vs-carga-viral',
        titulo: 'CD4 × carga viral: o que cada um responde',
        pergunta: 'O paciente está em tratamento há um ano, carga viral indetectável e CD4 ainda 180. Isso é falha?',
        hipoteses: ['Início de tratamento', 'Supressão viral recente', 'Falha virológica', 'Reconstituição incompleta'],
        linhas: [
          { marcador: 'Carga viral', celulas: ['↑↑', '↓ indetectável', '↑ em ascensão', 'indetectável'] },
          { marcador: 'CD4', celulas: ['↓', 'subindo lentamente', 'caindo', 'baixo e estável'] },
          { marcador: 'Risco oportunista', celulas: ['alto', 'em redução', 'crescente', 'ainda presente'] },
          { marcador: 'Conduta', celulas: ['iniciar TARV', 'manter e aguardar', 'investigar adesão e genotipar', 'manter profilaxias'] },
        ],
        leitura:
          'Carga viral indetectável com CD4 que não recupera não é falha virológica: é reconstituição imune incompleta, mais comum em quem iniciou tratamento com CD4 muito baixo ou em idade avançada. A conduta é manter o esquema e manter as profilaxias enquanto o CD4 permanecer abaixo do limiar.',
        limites: 'CD4 isolado num quadro infeccioso agudo não é interpretável — repita em consulta de rotina.',
      },
    ],
    relacionados: [
      { titulo: 'O par obrigatório', ids: ['carga-viral-hiv', 'hiv-antigeno-anticorpo'], leitura: 'A carga viral avalia o tratamento; o CD4 avalia o risco de complicação. Interpretar um sem o outro leva a conclusões erradas nos dois sentidos.' },
      { titulo: 'De onde vem o número', ids: ['linfocitos-absolutos', 'leucocitos'], leitura: 'O CD4 absoluto deriva do leucograma; qualquer coisa que altere leucócitos ou linfócitos totais desloca o resultado sem que a imunidade tenha mudado.' },
    ],
    interferentes: {
      preAnalitico: ['Amostra com mais de 24 a 48 horas compromete a viabilidade celular e subestima a contagem.'],
      fisiologico: ['Variação circadiana significativa — coletar sempre no mesmo período do dia.', 'Esplenectomia eleva os valores de forma persistente.'],
      medicamentos: ['Corticoide reduz agudamente; interferon reduz; quimioterapia reduz de forma prolongada.'],
    },
    utilidade: ['prognostico', 'acompanhamento'],
    estudarTambem: ['carga-viral-hiv', 'linfocitos-absolutos', 'imunofenotipagem'],
  },

  /* ═══════════════════════ Hepatite B ═══════════════════════ */
  {
    id: 'hbsag',
    nome: 'Antígeno de superfície do vírus da hepatite B',
    sigla: 'HBsAg',
    sinonimos: ['hbsag', 'antigeno australia', 'ag hbs', 'antigeno de superficie hepatite b'],
    grupo: 'infectologia',
    sistemas: ['hepatobiliar', 'infeccioso'],
    material: 'Soro',
    unidade: 'reagente/não reagente',
    referencias: [{ rotulo: 'Resultado', texto: 'Não reagente', unidade: '' }],
    resumo:
      'A proteína do envelope viral circulante. Sua presença significa infecção pelo vírus B — aguda ou crônica —, e sua persistência por mais de seis meses define cronicidade.',
    entenda:
      'O HBsAg é produzido em enorme excesso pelo hepatócito infectado: circulam partículas subvirais vazias em quantidade muito maior que os vírions completos. Isso o torna o marcador mais sensível e o primeiro a aparecer, cerca de 4 a 10 semanas após a exposição, antes mesmo dos sintomas e da elevação das transaminases. Sua presença nunca significa imunidade nem vacinação: significa que existe vírus.',
    aprofundar: [
      'A confusão entre HBsAg e anti-HBs é responsável por erros de conduta reais. O **antígeno** é o vírus; o **anticorpo** é a proteção. HBsAg reagente é infecção; anti-HBs reagente isolado é vacinação; anti-HBs junto com anti-HBc é infecção passada resolvida. Ler o painel completo, e não um marcador isolado, é o que evita informar erradamente a alguém que está infectado ou protegido.',
      'A janela imunológica da hepatite B é o período entre o desaparecimento do HBsAg e o aparecimento do anti-HBs, em que só o anti-HBc IgM é detectável. Nessa fase, um painel incompleto sugeriria ausência de infecção — motivo pelo qual o anti-HBc integra a triagem.',
      'A quantificação do HBsAg (HBsAg quantitativo) ganhou espaço no manejo da hepatite crônica: níveis muito baixos com carga viral baixa e ALT normal caracterizam o portador inativo, enquanto níveis altos indicam maior atividade transcricional do cccDNA hepático. Ajuda a decidir quem precisa de tratamento e quem pode ser apenas monitorado.',
      'A perda do HBsAg com soroconversão para anti-HBs é a "cura funcional" — o desfecho terapêutico mais desejado, raro com os antivirais atuais, porque o cccDNA permanece no núcleo do hepatócito indefinidamente. É essa persistência nuclear que explica a reativação sob imunossupressão em pessoas com infecção aparentemente resolvida.',
    ],
    fisiologia: {
      oQueE: 'Proteína do envelope do vírus da hepatite B, presente em vírions completos e em partículas subvirais.',
      origem: 'Hepatócito infectado.',
      funcao: 'Componente estrutural do envelope viral; sua detecção sinaliza infecção ativa.',
      orgaosEnvolvidos: ['Fígado'],
      percurso: [
        'Infecção do hepatócito',
        'cccDNA estabelecido no núcleo',
        'transcrição e produção de HBsAg em excesso',
        'liberação de partículas subvirais na circulação',
        'HBsAg detectável 4 a 10 semanas após exposição',
      ],
    },
    aumento: {
      resumo: 'Presença de infecção pelo vírus B — a persistência além de seis meses define cronicidade.',
      mecanismos: [
        {
          titulo: 'Produção pelo hepatócito infectado',
          explicacao: 'Enquanto houver cccDNA transcricionalmente ativo, o HBsAg continua sendo produzido e detectado.',
          exemplos: [
            { causa: 'Hepatite B aguda', etapas: ['HBsAg reagente com anti-HBc IgM reagente', 'ALT muito elevada', 'clareamento do HBsAg em semanas a meses na maioria dos adultos', 'soroconversão para anti-HBs'], nota: 'Mais de 90% dos adultos imunocompetentes resolvem; em recém-nascidos, mais de 90% cronificam — a idade da aquisição é o determinante principal.' },
            { causa: 'Hepatite B crônica', etapas: ['HBsAg reagente por mais de 6 meses', 'anti-HBc IgG reagente e IgM não reagente', 'carga viral e ALT definem a fase', 'risco de cirrose e carcinoma hepatocelular'] },
            { causa: 'Reativação sob imunossupressão', etapas: ['cccDNA latente no hepatócito', 'perda do controle imune por rituximab, corticoide ou quimioterapia', 'reaparecimento do HBsAg em quem era anti-HBc positivo isolado', 'hepatite grave, por vezes fulminante'], nota: 'É a razão de o anti-HBc ser obrigatório antes de terapia imunossupressora, mesmo com HBsAg negativo.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel que dá sentido ao resultado', ids: ['anti-hbs', 'anti-hbc', 'hbeag', 'carga-viral-hbv'], leitura: 'Nenhum marcador do vírus B se interpreta sozinho: é a combinação que define fase, infectividade e necessidade de tratamento.' },
      { titulo: 'A repercussão hepática', ids: ['alt', 'ast', 'bilirrubina-total', 'inr', 'albumina'], leitura: 'ALT define atividade inflamatória; INR e albumina definem função de síntese e diferenciam hepatite de insuficiência hepática.' },
    ],
    advertencia: 'HBsAg reagente nunca significa vacinação nem imunidade — significa presença do vírus. A proteção vacinal é indicada pelo anti-HBs isolado.',
    utilidade: ['diagnostico', 'triagem', 'acompanhamento'],
    estudarTambem: ['anti-hbs', 'anti-hbc', 'carga-viral-hbv'],
  },

  {
    id: 'anti-hbs',
    nome: 'Anticorpo contra o antígeno de superfície do HBV',
    sigla: 'Anti-HBs',
    sinonimos: ['anti hbs', 'anticorpo anti hbs', 'ac anti hbs', 'anticorpo de superficie hepatite b'],
    grupo: 'infectologia',
    sistemas: ['hepatobiliar', 'infeccioso', 'imunologico'],
    material: 'Soro',
    unidade: 'mUI/mL',
    referencias: [
      { rotulo: 'Título protetor', texto: '≥ 10', unidade: 'mUI/mL' },
      { rotulo: 'Não protetor', texto: '< 10', unidade: 'mUI/mL' },
    ],
    resumo:
      'O anticorpo neutralizante contra o envelope viral. É o único marcador de proteção — seja por vacinação, seja por infecção resolvida. Título acima de 10 mUI/mL indica imunidade.',
    entenda:
      'A vacina contra hepatite B contém apenas o antígeno de superfície recombinante. Por isso o vacinado desenvolve **somente** anti-HBs, sem anti-HBc — e essa é exatamente a diferença que separa vacinação de infecção passada. Quem teve a doença e curou tem os dois: anti-HBs (proteção) e anti-HBc (cicatriz do contato com o vírus inteiro). Reconhecer esse padrão de duas linhas resolve a maioria das dúvidas de interpretação do painel.',
    aprofundar: [
      'O título de anti-HBs cai com o tempo após a vacinação, e pode ficar abaixo de 10 mUI/mL anos depois — sem que isso signifique perda de proteção. A memória imunológica persiste, e a resposta anamnéstica a uma exposição real é rápida. Por isso, na população geral, não se recomenda dosagem rotineira nem reforço; a dosagem pós-vacinal é indicada em grupos específicos, como profissionais de saúde, pacientes em diálise, imunodeprimidos e recém-nascidos de mães HBsAg positivas.',
      'Cerca de 5 a 10% dos adultos não respondem ao esquema vacinal completo. Antes de rotular alguém como não respondedor, é preciso descartar infecção crônica não diagnosticada (HBsAg e anti-HBc) e considerar fatores como obesidade, tabagismo, idade avançada, doença renal crônica e aplicação glútea em vez de deltoide — um erro técnico que reduz significativamente a imunogenicidade.',
      'A coexistência de HBsAg e anti-HBs reagentes ocorre em uma minoria de portadores crônicos e não indica cura: reflete anticorpos incapazes de neutralizar aquele subtipo viral, ou a presença de mutantes de escape. Nesses casos, o que manda é o HBsAg e a carga viral.',
    ],
    fisiologia: {
      oQueE: 'Anticorpo neutralizante dirigido ao antígeno de superfície do vírus da hepatite B.',
      origem: 'Plasmócitos após exposição ao antígeno, natural ou vacinal.',
      funcao: 'Neutralizar partículas virais e impedir a infecção de hepatócitos.',
      percurso: [
        'Exposição ao HBsAg (vacina ou infecção)',
        'resposta humoral com produção de anti-HBs',
        'neutralização de partículas circulantes',
        'proteção duradoura por memória imunológica',
      ],
    },
    aumento: {
      resumo: 'Imunidade — por vacinação, por infecção resolvida ou por imunoglobulina hiperimune recebida.',
      significado: 'Título ≥ 10 mUI/mL indica proteção. O que diferencia vacinação de infecção passada é o anti-HBc, não o título.',
      mecanismos: [
        {
          titulo: 'Resposta humoral protetora',
          explicacao: 'O anticorpo se liga ao envelope viral e impede a entrada no hepatócito; sua presença em título suficiente confere proteção.',
          exemplos: [
            { causa: 'Vacinação completa', etapas: ['exposição apenas ao antígeno recombinante de superfície', 'anti-HBs reagente isolado', 'anti-HBc não reagente', 'HBsAg não reagente'], nota: 'Padrão de uma linha só — a assinatura da vacinação.' },
            { causa: 'Infecção passada resolvida', etapas: ['exposição ao vírus completo', 'clareamento do HBsAg', 'anti-HBs e anti-HBc reagentes', 'imunidade natural'], nota: 'Padrão de duas linhas — a assinatura da cura.' },
            { causa: 'Imunoglobulina hiperimune recente', etapas: ['administração passiva de anti-HBs após exposição ou transplante', 'anticorpo detectável sem resposta própria', 'declínio em semanas a meses'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Ausência de proteção: nunca vacinado, não respondedor, ou perda do título sem perda de memória.',
      mecanismos: [
        {
          titulo: 'Ausência ou falência de resposta vacinal',
          explicacao: 'A produção do anticorpo depende de resposta T-dependente eficiente; condições que a comprometem reduzem a soroconversão.',
          exemplos: [
            { causa: 'Não respondedor à vacina', etapas: ['esquema completo aplicado', 'anti-HBs < 10 mUI/mL após 1 a 2 meses', 'necessidade de novo esquema, dose dobrada ou via intradérmica conforme protocolo'], nota: 'Antes de rotular, excluir infecção crônica e revisar técnica de aplicação.' },
            { causa: 'Doença renal crônica, imunossupressão, obesidade, idade avançada', etapas: ['resposta humoral reduzida', 'títulos baixos ou ausentes', 'indicação de esquema reforçado'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Como ler o painel completo', ids: ['hbsag', 'anti-hbc'], leitura: 'Anti-HBs isolado é vacina. Anti-HBs com anti-HBc é infecção curada. HBsAg com anti-HBc é infecção ativa. Anti-HBc isolado exige investigação adicional.' },
    ],
    utilidade: ['triagem', 'acompanhamento'],
    estudarTambem: ['hbsag', 'anti-hbc'],
  },

  {
    id: 'anti-hbc',
    nome: 'Anticorpo contra o antígeno core do HBV (total e IgM)',
    sigla: 'Anti-HBc',
    sinonimos: ['anti hbc', 'anti hbc total', 'anti hbc igm', 'anticorpo core hepatite b'],
    grupo: 'infectologia',
    sistemas: ['hepatobiliar', 'infeccioso'],
    material: 'Soro',
    unidade: 'reagente/não reagente',
    referencias: [
      { rotulo: 'Anti-HBc total', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anti-HBc IgM', texto: 'Não reagente', unidade: '', observacao: 'Reagente indica infecção aguda ou reagudização de hepatite crônica.' },
    ],
    resumo:
      'A cicatriz sorológica do contato com o vírus B. Nunca aparece após vacinação — só após infecção. O IgM separa a fase aguda; o total permanece por toda a vida.',
    entenda:
      'O antígeno core está dentro do vírion e não é componente da vacina. Por isso o anti-HBc é o marcador que prova contato com o vírus real. O anti-HBc IgM surge cedo e dura cerca de seis meses, sendo o marcador da fase aguda — e o único positivo durante a janela em que o HBsAg já desapareceu e o anti-HBs ainda não surgiu. O anti-HBc total (IgG) persiste indefinidamente e marca que aquela pessoa encontrou o vírus em algum momento.',
    aprofundar: [
      'O anti-HBc isolado — reagente com HBsAg e anti-HBs negativos — é o padrão mais difícil de interpretar do painel, e tem quatro explicações possíveis: janela imunológica da infecção aguda, infecção passada com anti-HBs que caiu abaixo do limiar, infecção oculta (com cccDNA e carga viral detectável apesar de HBsAg negativo) ou resultado falso-reagente. A conduta é dosar carga viral e, conforme o contexto, repetir o painel.',
      'A consequência prática mais importante desse padrão está na imunossupressão. Pacientes anti-HBc positivos com HBsAg negativo carregam cccDNA no núcleo dos hepatócitos e podem reativar a infecção sob rituximab, corticoide em dose alta, quimioterapia ou transplante — com hepatite grave e por vezes fatal. Por isso o anti-HBc é obrigatório antes de iniciar essas terapias, e a profilaxia antiviral é indicada nos casos de maior risco.',
      'O anti-HBc IgM também reaparece em reagudizações de hepatite B crônica, o que pode confundir com infecção aguda. A diferenciação usa o contexto: HBsAg conhecido previamente positivo, títulos de IgM geralmente mais baixos, e história clínica.',
    ],
    fisiologia: {
      oQueE: 'Anticorpo dirigido ao antígeno do nucleocapsídeo (core) do vírus da hepatite B.',
      origem: 'Resposta humoral do hospedeiro à proteína core, expressa apenas na infecção natural.',
      funcao: 'Não é neutralizante — serve como marcador de exposição ao vírus completo.',
      percurso: [
        'Infecção pelo vírus completo',
        'exposição ao antígeno core',
        'anti-HBc IgM em semanas, persistindo cerca de 6 meses',
        'anti-HBc IgG substituindo o IgM',
        'IgG persistente por toda a vida',
      ],
    },
    aumento: {
      resumo: 'Contato com o vírus da hepatite B — em qualquer fase, e nunca por vacinação.',
      mecanismos: [
        {
          titulo: 'Exposição ao nucleocapsídeo viral',
          explicacao: 'Como o core não integra a vacina, a presença do anticorpo prova que houve infecção pelo vírus íntegro.',
          exemplos: [
            { causa: 'Hepatite B aguda', etapas: ['anti-HBc IgM reagente', 'HBsAg reagente', 'ALT muito elevada', 'evolução para clareamento na maioria dos adultos'] },
            { causa: 'Janela imunológica', etapas: ['HBsAg já negativo', 'anti-HBs ainda não detectável', 'apenas anti-HBc IgM reagente'], nota: 'Sem o anti-HBc no painel, essa infecção passaria despercebida.' },
            { causa: 'Infecção passada resolvida', etapas: ['anti-HBc total reagente com anti-HBs reagente', 'HBsAg não reagente', 'imunidade natural com cccDNA latente'], nota: 'Latente não é ausente: sob imunossupressão pode reativar.' },
            { causa: 'Anti-HBc isolado', etapas: ['reagente sem HBsAg e sem anti-HBs', 'quatro hipóteses possíveis', 'carga viral define infecção oculta', 'risco de reativação sob imunossupressão'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel completo', ids: ['hbsag', 'anti-hbs', 'carga-viral-hbv'], leitura: 'É a combinação que informa. Anti-HBc isolado exige carga viral antes de qualquer conclusão.' },
    ],
    advertencia:
      'Pesquisa obrigatória antes de iniciar rituximab, quimioterapia ou imunossupressão potente: anti-HBc positivo com HBsAg negativo tem risco real de reativação grave e pode requerer profilaxia antiviral.',
    utilidade: ['diagnostico', 'triagem'],
    estudarTambem: ['hbsag', 'anti-hbs', 'carga-viral-hbv'],
  },

  {
    id: 'hbeag',
    nome: 'Antígeno e do HBV e anti-HBe',
    sigla: 'HBeAg',
    sinonimos: ['hbeag', 'antigeno e', 'anti hbe', 'ag hbe'],
    grupo: 'infectologia',
    sistemas: ['hepatobiliar', 'infeccioso'],
    material: 'Soro',
    unidade: 'reagente/não reagente',
    referencias: [
      { rotulo: 'HBeAg', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anti-HBe', texto: 'Não reagente', unidade: '' },
    ],
    resumo:
      'Marcador de replicação viral intensa e alta infectividade. Sua soroconversão para anti-HBe geralmente marca a transição para uma fase de menor atividade — mas não em todos os casos.',
    entenda:
      'O HBeAg é uma proteína secretada por hepatócitos com replicação viral ativa e alta produção de vírions. Sua presença indica infectividade elevada — o que importa sobretudo na transmissão vertical: gestante HBeAg positiva sem profilaxia transmite ao recém-nascido em altíssima proporção. A soroconversão espontânea para anti-HBe ocorre com o tempo e costuma acompanhar queda da carga viral e normalização da ALT.',
    aprofundar: [
      'A armadilha é a hepatite B crônica HBeAg-negativa, causada por mutantes na região pré-core que não conseguem produzir o antígeno e continuam replicando ativamente. Nesse cenário, o paciente tem HBeAg negativo, anti-HBe positivo — o que sugeriria fase inativa — mas mantém carga viral elevada, ALT flutuante e progressão para fibrose. É frequente na região mediterrânea e na Ásia, e é a razão de a carga viral, e não o HBeAg, ser o parâmetro que decide tratamento.',
      'Por isso, a classificação atual da hepatite B crônica combina quatro variáveis: HBeAg, carga viral, ALT e grau de fibrose. As fases — infecção HBeAg positiva, hepatite HBeAg positiva, infecção HBeAg negativa (portador inativo) e hepatite HBeAg negativa — determinam se o paciente é tratado ou apenas monitorado, e a passagem entre elas não é linear.',
    ],
    fisiologia: {
      oQueE: 'Proteína solúvel derivada do gene pré-core, secretada durante replicação viral ativa.',
      origem: 'Hepatócito infectado com transcrição intensa.',
      funcao: 'Modula a resposta imune do hospedeiro, favorecendo tolerância — hipótese que explica a alta cronificação na transmissão vertical.',
      percurso: [
        'Replicação viral intensa',
        'secreção de HBeAg',
        'alta carga viral e alta infectividade',
        'pressão imune ao longo dos anos',
        'soroconversão para anti-HBe com queda da replicação — ou seleção de mutante pré-core',
      ],
    },
    aumento: {
      resumo: 'HBeAg reagente indica replicação intensa e alta infectividade; anti-HBe reagente sugere — mas não garante — menor atividade.',
      mecanismos: [
        {
          titulo: 'Replicação viral ativa com transcrição do gene pré-core',
          explicacao: 'A secreção de HBeAg acompanha a produção elevada de vírions.',
          exemplos: [
            { causa: 'Hepatite B crônica HBeAg positiva', etapas: ['carga viral muito alta', 'HBeAg reagente', 'ALT elevada indicando dano imunomediado', 'indicação de tratamento antiviral'] },
            { causa: 'Gestante HBeAg positiva', etapas: ['alta carga viral', 'risco de transmissão vertical muito elevado', 'indicação de antiviral no terceiro trimestre além de vacina e imunoglobulina ao recém-nascido'], nota: 'A intervenção reduz drasticamente a transmissão — é um dos maiores ganhos de saúde pública ligados a um exame.' },
            { causa: 'Mutante pré-core (HBeAg negativo com anti-HBe positivo)', etapas: ['mutação impede a produção de HBeAg', 'replicação continua', 'carga viral alta com HBeAg negativo', 'ALT flutuante e fibrose progressiva'], nota: 'Anti-HBe positivo não autoriza concluir por doença inativa: é a carga viral que decide.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O que realmente define a fase', ids: ['carga-viral-hbv', 'alt', 'hbsag'], leitura: 'Carga viral e ALT, junto com o grau de fibrose, definem se há indicação de tratamento — o HBeAg apenas contextualiza.' },
    ],
    utilidade: ['prognostico', 'acompanhamento'],
    estudarTambem: ['carga-viral-hbv', 'hbsag', 'alt'],
  },

  {
    id: 'carga-viral-hbv',
    nome: 'Carga viral do HBV (DNA quantitativo)',
    sigla: 'HBV-DNA',
    sinonimos: ['carga viral hbv', 'hbv dna', 'dna vhb', 'carga viral hepatite b'],
    grupo: 'infectologia',
    sistemas: ['hepatobiliar', 'infeccioso'],
    material: 'Plasma ou soro',
    unidade: 'UI/mL e log₁₀',
    referencias: [
      { rotulo: 'Indetectável', texto: '< 10 a 20 UI/mL, conforme o método', unidade: 'UI/mL' },
      { rotulo: 'Portador inativo', texto: '< 2.000', unidade: 'UI/mL', observacao: 'Com ALT normal e fibrose ausente.' },
      { rotulo: 'Indicação de tratamento (em geral)', texto: '> 2.000 com ALT elevada, ou > 20.000 em HBeAg positivo', unidade: 'UI/mL' },
    ],
    resumo:
      'Quantifica o DNA viral circulante. É o parâmetro que define atividade replicativa, risco de progressão para cirrose e carcinoma hepatocelular, e a resposta ao tratamento.',
    entenda:
      'A carga viral do HBV se comporta de forma diferente da do HIV em um ponto importante: aqui o dano hepático não é causado pelo vírus diretamente, e sim pela resposta imune contra os hepatócitos infectados. Por isso existe a fase de "infecção crônica HBeAg positiva" — antes chamada de imunotolerante — com carga viral altíssima e ALT normal: há muito vírus e pouca inflamação, porque o sistema imune ainda não atacou. A combinação de carga viral com ALT é o que descreve o estado real.',
    aprofundar: [
      'Estudos populacionais de longo prazo mostraram que a carga viral sustentada é preditor independente de carcinoma hepatocelular e de cirrose, em relação praticamente linear. Essa observação foi o que transformou a carga viral de marcador de acompanhamento em critério de indicação terapêutica: tratar reduz a viremia e, com ela, o risco de desfecho oncológico.',
      'A supressão sob análogos de nucleos(t)ídeo é quase universal quando há adesão, e a resistência é rara com os fármacos de alta barreira genética. Por isso uma carga viral que não suprime é, na esmagadora maioria das vezes, um problema de adesão — a investigação começa aí, não na genotipagem.',
      'O tratamento suprime a replicação mas não elimina o cccDNA nuclear, o que significa que a suspensão do antiviral pode ser seguida de reativação, às vezes grave. É uma diferença crucial em relação à hepatite C, que é curável. Explicar essa distinção ao paciente evita interrupções por conta própria com consequências sérias.',
    ],
    fisiologia: {
      oQueE: 'DNA do vírus da hepatite B quantificado por amplificação de ácido nucleico.',
      origem: 'Vírions produzidos a partir do cccDNA no núcleo do hepatócito.',
      funcao: 'Medir a intensidade da replicação viral.',
      orgaosEnvolvidos: ['Fígado'],
      percurso: [
        'cccDNA no núcleo do hepatócito',
        'transcrição do RNA pré-genômico',
        'transcrição reversa no capsídeo',
        'montagem e liberação de vírions',
        'DNA viral quantificado no plasma',
      ],
    },
    aumento: {
      resumo: 'Replicação ativa — com ou sem inflamação, e essa distinção depende da ALT.',
      mecanismos: [
        {
          titulo: 'Transcrição ativa do cccDNA',
          explicacao: 'Quanto maior a atividade transcricional e menor o controle imune, maior a produção de vírions.',
          exemplos: [
            { causa: 'Infecção crônica HBeAg positiva com ALT normal', etapas: ['carga viral muito alta', 'ausência de resposta imune agressiva', 'ALT normal e fibrose mínima', 'monitoramento, sem indicação imediata de tratamento na maioria dos protocolos'], nota: 'Muito vírus com pouca inflamação — o dano vem da resposta, não do vírus.' },
            { causa: 'Hepatite crônica ativa', etapas: ['carga viral elevada com ALT persistentemente alta', 'destruição imunomediada de hepatócitos', 'fibrose progressiva', 'indicação de antiviral'] },
            { causa: 'Reativação sob imunossupressão', etapas: ['perda do controle imune', 'carga viral sobe antes de qualquer alteração de ALT', 'hepatite grave quando a imunidade se restaura'], nota: 'Monitorar carga viral durante imunossupressão detecta a reativação na fase silenciosa.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A leitura conjunta', ids: ['hbsag', 'hbeag', 'alt', 'inr', 'albumina'], leitura: 'Carga viral + ALT definem a fase; INR e albumina definem se há insuficiência hepática instalada.' },
      { titulo: 'Rastreio de carcinoma hepatocelular', ids: ['alfafetoproteina'], leitura: 'Portadores crônicos com cirrose, e alguns sem cirrose conforme o perfil de risco, entram em rastreio periódico com ultrassonografia e alfafetoproteína.' },
    ],
    utilidade: ['prognostico', 'acompanhamento', 'diagnostico'],
    estudarTambem: ['hbsag', 'hbeag', 'alt'],
  },

  /* ═══════════════════════ Hepatite C ═══════════════════════ */
  {
    id: 'anti-hcv',
    nome: 'Anticorpo anti-HCV',
    sigla: 'Anti-HCV',
    sinonimos: ['anti hcv', 'anticorpo hepatite c', 'sorologia hepatite c', 'anti vhc'],
    grupo: 'infectologia',
    sistemas: ['hepatobiliar', 'infeccioso'],
    material: 'Soro',
    unidade: 'reagente/não reagente',
    referencias: [
      { rotulo: 'Resultado', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Janela sorológica', texto: '6 a 10 semanas', unidade: '' },
    ],
    resumo:
      'Marca contato com o vírus da hepatite C — e apenas isso. Não distingue infecção ativa de infecção curada, e não é neutralizante nem protetor. A definição depende obrigatoriamente da carga viral.',
    entenda:
      'Esta é a diferença mais importante entre hepatite B e C na sorologia: no vírus B, o anticorpo de superfície significa cura e proteção; no vírus C, o anticorpo não protege de nada e persiste indefinidamente mesmo após a cura. Um paciente tratado e curado com antivirais de ação direta permanece anti-HCV reagente pelo resto da vida. Por isso, todo anti-HCV reagente exige carga viral: reagente com RNA detectável é infecção ativa; reagente com RNA indetectável é infecção passada, espontaneamente resolvida ou tratada.',
    aprofundar: [
      'Cerca de 15 a 25% das pessoas infectadas eliminam o vírus espontaneamente na fase aguda e ficam anti-HCV positivas para sempre, sem doença. Interpretar o anticorpo como doença ativa nesses casos gera ansiedade e investigações desnecessárias — e, o inverso, tratar o anticorpo como cura em quem tem RNA detectável deixa passar uma infecção hoje curável em oito a doze semanas de tratamento oral.',
      'A hepatite C é a doença em que a virada terapêutica mais transformou o valor do diagnóstico. Com os antivirais de ação direta, as taxas de cura ultrapassam 95%, e o principal obstáculo epidemiológico passou a ser o diagnóstico: a infecção é silenciosa por décadas, e a maioria dos infectados não sabe. Isso justifica a testagem ampliada por faixa etária e fator de risco, e não apenas na presença de alteração hepática.',
      'Em imunodeprimidos graves e em pacientes em hemodiálise, a resposta de anticorpos pode ser insuficiente e o anti-HCV vir negativo apesar de infecção ativa. Nesses grupos, e na suspeita de infecção aguda dentro da janela sorológica, a investigação é feita diretamente por carga viral.',
    ],
    fisiologia: {
      oQueE: 'Anticorpos dirigidos a proteínas estruturais e não estruturais do vírus da hepatite C.',
      origem: 'Resposta humoral do hospedeiro.',
      funcao: 'Marcador de exposição — não confere proteção nem impede reinfecção.',
      percurso: [
        'Exposição parenteral ao HCV',
        'RNA detectável em 1 a 2 semanas',
        'anticorpos entre 6 e 10 semanas',
        'anticorpos persistem indefinidamente, com ou sem cura',
      ],
    },
    aumento: {
      resumo: 'Contato prévio com o vírus C — ativo ou não, e só o RNA responde qual.',
      mecanismos: [
        {
          titulo: 'Resposta humoral à infecção',
          explicacao: 'A produção de anticorpos ocorre independentemente do desfecho da infecção, e eles não desaparecem com a cura.',
          exemplos: [
            { causa: 'Hepatite C crônica', etapas: ['anti-HCV reagente', 'RNA detectável', 'ALT frequentemente flutuante ou normal', 'fibrose progressiva ao longo de décadas'], nota: 'ALT normal não exclui doença ativa nem fibrose avançada na hepatite C.' },
            { causa: 'Infecção resolvida espontaneamente ou tratada', etapas: ['anti-HCV reagente permanentemente', 'RNA indetectável', 'sem doença ativa'], nota: 'A cura não negativa o anticorpo — informar isso ao paciente evita anos de confusão.' },
            { causa: 'Reatividade falsa', etapas: ['doença autoimune, hipergamaglobulinemia ou paraproteinemia', 'reação inespecífica no imunoensaio', 'RNA indetectável e ausência de fatores de risco'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A definição obrigatória', ids: ['carga-viral-hcv', 'alt', 'plaquetas'], leitura: 'Anti-HCV reagente sem carga viral é um resultado incompleto. Plaquetas baixas com ALT alterada sugerem fibrose avançada e mudam o estadiamento.' },
    ],
    advertencia: 'Anti-HCV reagente não significa infecção ativa nem imunidade. Sem carga viral, o resultado não conclui nada.',
    utilidade: ['triagem', 'diagnostico'],
    estudarTambem: ['carga-viral-hcv', 'alt'],
  },

  {
    id: 'carga-viral-hcv',
    nome: 'Carga viral do HCV (RNA quantitativo)',
    sigla: 'HCV-RNA',
    sinonimos: ['carga viral hcv', 'hcv rna', 'rna vhc', 'carga viral hepatite c', 'pcr hepatite c'],
    grupo: 'infectologia',
    sistemas: ['hepatobiliar', 'infeccioso'],
    material: 'Plasma com EDTA',
    unidade: 'UI/mL e log₁₀',
    referencias: [
      { rotulo: 'Indetectável', texto: '< 12 a 15 UI/mL, conforme o método', unidade: 'UI/mL' },
      { rotulo: 'Resposta virológica sustentada', texto: 'Indetectável 12 semanas após o fim do tratamento', unidade: '', observacao: 'Equivale a cura da infecção.' },
    ],
    resumo:
      'Define se a infecção pelo vírus C está ativa. É o exame que confirma o diagnóstico, e sua negativação 12 semanas após o tratamento estabelece a cura — um dos poucos exames que declaram uma doença crônica encerrada.',
    entenda:
      'A carga viral do HCV, ao contrário da do HIV e da do HBV, não se correlaciona com gravidade nem com progressão da doença. Um paciente com um milhão de cópias não tem doença mais grave que um com dez mil. Ela responde a apenas duas perguntas, ambas binárias: há infecção ativa? E, depois do tratamento, houve cura? A magnitude do número é praticamente irrelevante.',
    aprofundar: [
      'A resposta virológica sustentada — RNA indetectável 12 semanas após o fim do tratamento — é aceita como cura definitiva, com recidiva tardia rara. É um conceito diferente de tudo o que se aplica ao HIV e ao HBV, e vale a pena enfatizá-lo: aqui o vírus é eliminado do organismo, não apenas suprimido.',
      'A cura da infecção não apaga a fibrose já instalada. Pacientes com cirrose que alcançam resposta virológica sustentada permanecem em risco de carcinoma hepatocelular e mantêm indicação de rastreio semestral por imagem. Confundir cura virológica com cura hepática é um erro que faz pacientes abandonarem o seguimento no momento em que ele ainda importa.',
      'A genotipagem viral perdeu grande parte de sua importância com os esquemas pangenotípicos atuais, mas ainda é solicitada em situações específicas de retratamento e em contextos com acesso restrito a determinados fármacos.',
      'A reinfecção é possível: os anticorpos não protegem. Em populações com exposição continuada, a testagem periódica por carga viral — e não por sorologia, que permanecerá reagente — é o método de seguimento correto.',
    ],
    fisiologia: {
      oQueE: 'RNA do vírus da hepatite C quantificado por amplificação de ácido nucleico.',
      origem: 'Replicação viral no hepatócito.',
      funcao: 'Confirmar infecção ativa e documentar cura.',
      orgaosEnvolvidos: ['Fígado'],
      percurso: [
        'Exposição parenteral',
        'RNA detectável em 1 a 2 semanas',
        'cronificação em 75 a 85% dos casos',
        'replicação persistente por décadas com fibrose progressiva',
        'antiviral de ação direta suprime e elimina',
      ],
    },
    aumento: {
      resumo: 'Presença de replicação viral — infecção ativa, aguda ou crônica. A magnitude não indica gravidade.',
      mecanismos: [
        {
          titulo: 'Replicação viral no hepatócito',
          explicacao: 'O vírus replica continuamente; a viremia reflete produção, não extensão do dano hepático.',
          exemplos: [
            { causa: 'Hepatite C crônica', etapas: ['RNA detectável por mais de 6 meses', 'inflamação persistente de baixo grau', 'fibrose progressiva ao longo de décadas', 'indicação de tratamento independentemente do estágio'], nota: 'Todo paciente com infecção ativa tem indicação de tratamento hoje — a estratificação decide urgência, não elegibilidade.' },
            { causa: 'Infecção aguda dentro da janela sorológica', etapas: ['RNA detectável em 1 a 2 semanas', 'anti-HCV ainda não reagente', 'diagnóstico só é possível pela carga viral'] },
            { causa: 'Recidiva ou reinfecção após tratamento', etapas: ['RNA volta a ser detectável após resposta sustentada', 'genotipagem distingue recidiva de reinfecção por outro genótipo', 'anticorpo permanece reagente e não ajuda'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A avaliação da doença hepática', ids: ['alt', 'ast', 'plaquetas', 'albumina', 'inr'], leitura: 'A relação AST/plaquetas (APRI) e o FIB-4 estimam fibrose sem biópsia, usando exames que já estão na rotina.' },
      { titulo: 'Rastreio oncológico após a cura', ids: ['alfafetoproteina'], leitura: 'Cirrose estabelecida mantém indicação de rastreio de carcinoma hepatocelular mesmo após resposta virológica sustentada.' },
    ],
    advertencia: 'A magnitude da carga viral do HCV não indica gravidade da doença hepática — o estadiamento de fibrose é feito por elastografia, escores ou biópsia, não pela viremia.',
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['anti-hcv', 'alt', 'plaquetas'],
  },

  /* ═══════════════════════ Sífilis ═══════════════════════ */
  {
    id: 'vdrl',
    nome: 'VDRL / RPR (testes não treponêmicos)',
    sigla: 'VDRL',
    sinonimos: ['vdrl', 'rpr', 'teste nao treponemico', 'sorologia sifilis', 'reagina plasmatica'],
    grupo: 'infectologia',
    sistemas: ['infeccioso'],
    material: 'Soro (ou liquor, na neurossífilis)',
    unidade: 'título (diluições)',
    referencias: [
      { rotulo: 'Resultado', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Quando reagente', texto: 'Titulado: 1:1, 1:2, 1:4, 1:8, 1:16…', unidade: '', observacao: 'A variação de dois títulos (quatro vezes) é o que caracteriza resposta ao tratamento ou reinfecção.' },
    ],
    resumo:
      'Detecta anticorpos contra cardiolipina liberada pelo dano tecidual — não contra o treponema. Por ser quantitativo, é o exame que monitora resposta ao tratamento; por ser inespecífico, produz falso-reagentes.',
    entenda:
      'Os testes não treponêmicos medem reaginas: anticorpos contra lipídios liberados por células danificadas pela infecção e por lipídios do próprio treponema. Isso explica suas duas propriedades definidoras. Como não são dirigidos ao agente, podem ser positivos em outras condições — gestação, doenças autoimunes, infecções virais, uso de drogas injetáveis, idade avançada. E como caem quando a atividade da doença cessa, servem para acompanhar o tratamento, coisa que os testes treponêmicos não fazem.',
    aprofundar: [
      'A queda de dois títulos (quatro vezes — por exemplo, de 1:32 para 1:8) em 6 a 12 meses define resposta adequada ao tratamento. A subida de dois títulos indica reinfecção ou falha. Comparações só são válidas quando feitas no mesmo laboratório e com o mesmo método, porque VDRL e RPR não são intercambiáveis e a variação entre técnicas pode simular mudança clínica.',
      'O efeito prozona é uma armadilha grave: em sífilis secundária com altíssima carga de anticorpos, o excesso impede a formação da rede de floculação e o teste resulta falso-negativo na amostra não diluída. O laboratório precisa diluir a amostra quando a suspeita clínica é forte. É um falso-negativo que ocorre justamente na fase mais transmissível da doença.',
      'A "cicatriz sorológica" — VDRL persistentemente reagente em títulos baixos após tratamento adequado — ocorre em uma parcela dos pacientes e não indica falha. Retratar com base apenas nisso, sem elevação de título e sem sinais clínicos, expõe o paciente sem benefício.',
      'No liquor, o VDRL é altamente específico para neurossífilis: reagente confirma. Mas é pouco sensível — não reagente não exclui, e o diagnóstico se apoia também em celularidade, proteína e contexto clínico.',
    ],
    fisiologia: {
      oQueE: 'Anticorpos anticardiolipina (reaginas) detectados por floculação com antígeno lipídico.',
      origem: 'Resposta a lipídios liberados por células lesadas e a lipídios da membrana do treponema.',
      funcao: 'Marcador quantitativo de atividade da infecção.',
      percurso: [
        'Infecção por Treponema pallidum',
        'dano tecidual com liberação de lipídios',
        'produção de reaginas',
        'título proporcional à atividade da doença',
        'queda dos títulos com tratamento eficaz',
      ],
    },
    aumento: {
      resumo: 'Sífilis em atividade — ou reatividade cruzada por outra condição inflamatória, infecciosa ou autoimune.',
      mecanismos: [
        {
          titulo: 'Atividade da infecção treponêmica',
          explicacao: 'A liberação continuada de lipídios celulares durante a infecção sustenta a produção de reaginas, em título proporcional à carga de doença.',
          exemplos: [
            { causa: 'Sífilis primária', etapas: ['cancro duro', 'VDRL frequentemente ainda não reagente ou em título baixo', 'teste treponêmico positiva antes'], nota: 'Na fase primária o não treponêmico pode ser negativo — a lesão clínica e o teste treponêmico é que fecham.' },
            { causa: 'Sífilis secundária', etapas: ['disseminação hematogênica com exantema palmoplantar e condiloma plano', 'títulos altos, frequentemente ≥ 1:32', 'risco de efeito prozona com falso-negativo'], nota: 'Suspeita clínica forte com VDRL não reagente exige que o laboratório dilua a amostra.' },
            { causa: 'Sífilis latente ou terciária', etapas: ['títulos geralmente mais baixos', 'ausência de manifestação clínica na latente', 'necessidade de estadiamento pela duração conhecida da infecção'] },
          ],
        },
        {
          titulo: 'Reatividade não treponêmica falsa',
          explicacao: 'Qualquer condição que produza anticorpos antifosfolipídeos ou lesão tecidual pode gerar reatividade sem sífilis, tipicamente em títulos baixos.',
          exemplos: [
            { causa: 'Gestação, lúpus, síndrome antifosfolípide, hepatite, mononucleose, idade avançada, uso de drogas injetáveis', etapas: ['produção de anticorpos anticardiolipina por outro mecanismo', 'VDRL reagente em título baixo', 'teste treponêmico não reagente'], nota: 'É a razão de o fluxograma exigir sempre um teste treponêmico junto.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O par obrigatório', ids: ['teste-treponemico'], leitura: 'Um não treponêmico reagente sem treponêmico confirmatório não conclui. E um treponêmico reagente sem o não treponêmico não permite monitorar o tratamento.' },
      { titulo: 'Coinfecções a rastrear', ids: ['hiv-antigeno-anticorpo', 'hbsag', 'anti-hcv'], leitura: 'Sífilis diagnosticada obriga a testar HIV e hepatites: as vias de transmissão coincidem e a coinfecção altera o manejo.' },
    ],
    advertencia:
      'Títulos de VDRL e RPR não são intercambiáveis: o acompanhamento exige o mesmo teste e, idealmente, o mesmo laboratório. Suspeita clínica forte com resultado não reagente exige diluição da amostra pelo risco de efeito prozona.',
    utilidade: ['diagnostico', 'triagem', 'acompanhamento'],
    estudarTambem: ['teste-treponemico', 'hiv-antigeno-anticorpo'],
  },

  {
    id: 'teste-treponemico',
    nome: 'Testes treponêmicos (FTA-Abs, TPHA, ELISA, teste rápido)',
    sigla: 'FTA-Abs',
    sinonimos: ['fta abs', 'tpha', 'teste treponemico', 'elisa treponemico', 'teste rapido sifilis', 'mha-tp'],
    grupo: 'infectologia',
    sistemas: ['infeccioso'],
    material: 'Soro ou sangue total (teste rápido)',
    unidade: 'reagente/não reagente',
    referencias: [{ rotulo: 'Resultado', texto: 'Não reagente', unidade: '' }],
    resumo:
      'Detecta anticorpos dirigidos ao próprio Treponema pallidum. É específico e positiva mais cedo — mas permanece reagente por toda a vida, mesmo após cura, e por isso não serve para monitorar tratamento.',
    entenda:
      'A dupla treponêmico/não treponêmico funciona porque cada um compensa a limitação do outro. O treponêmico é específico (não dá falso-positivo por gravidez ou lúpus) e sensibiliza mais cedo, mas não distingue infecção atual de passada. O não treponêmico é inespecífico, mas quantitativo e dinâmico. Nenhum dos dois isolado responde à pergunta clínica completa: "há sífilis, e ela está ativa?"',
    aprofundar: [
      'Existem dois fluxogramas válidos. O tradicional começa pelo não treponêmico e confirma com o treponêmico; o reverso — hoje muito usado porque os imunoensaios treponêmicos são automatizáveis — começa pelo treponêmico e complementa com o não treponêmico. O fluxograma reverso gera uma situação particular: treponêmico reagente com não treponêmico não reagente, que pode ser sífilis muito precoce, sífilis tratada no passado, ou falso-reagente. A resolução usa um segundo teste treponêmico de metodologia diferente e o contexto clínico.',
      'O teste rápido treponêmico, feito em sangue de polpa digital com resultado em minutos, transformou o rastreio em pré-natal, em populações de difícil acesso e em situações de parto sem sorologia prévia. Sua limitação é a mesma dos demais treponêmicos: reagente em quem já teve sífilis tratada. Por isso um teste rápido reagente exige VDRL quantitativo antes de decidir tratar.',
      'A cicatriz sorológica treponêmica é permanente na maioria dos pacientes. Isso significa que, para alguém que já teve sífilis, a única forma de diagnosticar reinfecção é a variação de títulos do não treponêmico — outra razão de o exame quantitativo ser insubstituível.',
    ],
    fisiologia: {
      oQueE: 'Anticorpos IgG e IgM dirigidos a antígenos específicos do Treponema pallidum.',
      origem: 'Resposta humoral específica à infecção treponêmica.',
      funcao: 'Confirmar que a reatividade observada se deve ao treponema e não a reação cruzada.',
      percurso: [
        'Infecção por Treponema pallidum',
        'resposta específica em 1 a 3 semanas',
        'anticorpos treponêmicos detectáveis antes dos não treponêmicos',
        'persistência vitalícia mesmo após tratamento eficaz',
      ],
    },
    aumento: {
      resumo: 'Contato com o treponema — atual ou em qualquer momento da vida. Não distingue infecção ativa de curada.',
      mecanismos: [
        {
          titulo: 'Resposta humoral específica',
          explicacao: 'Os anticorpos contra antígenos treponêmicos são induzidos precocemente e persistem indefinidamente, independentemente do tratamento.',
          exemplos: [
            { causa: 'Sífilis primária precoce', etapas: ['cancro presente', 'treponêmico já reagente', 'não treponêmico ainda negativo'], nota: 'É a fase em que o treponêmico ganha do não treponêmico em sensibilidade.' },
            { causa: 'Sífilis previamente tratada', etapas: ['treponêmico permanentemente reagente', 'não treponêmico não reagente ou em título baixo estável', 'sem indicação de retratamento'], nota: 'Reagente aqui não é doença — é história.' },
            { causa: 'Reação cruzada por outras treponematoses', etapas: ['bouba, pinta, bejel', 'anticorpos cruzam com T. pallidum', 'treponêmico reagente sem sífilis venérea'], nota: 'Relevante em áreas endêmicas de treponematoses não venéreas.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A leitura conjunta obrigatória', ids: ['vdrl'], leitura: 'Treponêmico responde "houve infecção?"; não treponêmico responde "está ativa e respondeu ao tratamento?". As duas perguntas precisam ser feitas.' },
    ],
    advertencia:
      'Permanece reagente por toda a vida após a infecção, mesmo tratada. Não use testes treponêmicos para avaliar resposta terapêutica nem para diagnosticar reinfecção.',
    utilidade: ['diagnostico', 'triagem'],
    estudarTambem: ['vdrl', 'hiv-antigeno-anticorpo'],
  },
]
