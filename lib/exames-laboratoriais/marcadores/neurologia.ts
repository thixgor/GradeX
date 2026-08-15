import type { Marcador } from '../tipos'

/**
 * Neurologia laboratorial.
 *
 * O sistema nervoso é o tecido mais protegido do organismo e, por isso, o que
 * menos se revela no sangue. Quase tudo aqui depende de duas estratégias:
 * medir no compartimento certo — o líquor, do outro lado da barreira — ou
 * medir proteínas que só existem no neurônio e que, quando aparecem no
 * plasma, provam que ele foi lesado.
 *
 * O neurofilamento leve é o exemplo mais claro da segunda estratégia e mudou o
 * campo: uma proteína do axônio, dosável no sangue por ensaios ultrassensíveis,
 * que sobe em qualquer neurodegeneração. Ele não diz **qual** doença — diz que
 * axônios estão morrendo, o que já é mais do que qualquer exame de rotina
 * oferecia.
 */
export const marcadores: Marcador[] = [
  {
    id: 'neurofilamento-leve',
    nome: 'Cadeia leve de neurofilamento',
    sigla: 'NfL',
    sinonimos: ['neurofilamento leve', 'nfl', 'neurofilament light', 'cadeia leve de neurofilamento'],
    grupo: 'neurologia',
    sistemas: ['neurologico'],
    material: 'Soro, plasma ou líquor',
    unidade: 'pg/mL',
    referencias: [
      { rotulo: 'Adultos jovens (soro)', texto: '< 10', unidade: 'pg/mL', observacao: 'A faixa sobe progressivamente com a idade e com a queda da função renal — a interpretação exige valores ajustados.' },
      { rotulo: 'Líquor', texto: 'Faixa dependente do método', unidade: 'pg/mL' },
    ],
    resumo:
      'Proteína do citoesqueleto axonal que vaza para o líquor e para o sangue quando o axônio é lesado. É um marcador geral de dano neuronal — sensível a quase tudo e específico de nada.',
    entenda:
      'Os neurofilamentos dão sustentação estrutural ao axônio. Quando ele degenera, essas proteínas escapam para o líquido intersticial cerebral, atingem o líquor e, em quantidade menor, o sangue. Ensaios ultrassensíveis tornaram possível medi-las no plasma, o que transformou um exame que exigia punção lombar em um exame de sangue — e abriu a possibilidade de acompanhar neurodegeneração ao longo do tempo.',
    aprofundar: [
      'A ausência de especificidade não é defeito: é a natureza do marcador. NfL sobe na esclerose múltipla, na esclerose lateral amiotrófica, nas demências, no traumatismo cranioencefálico, no acidente vascular cerebral, nas neuropatias periféricas e na neurotoxicidade por quimioterápicos. Ele responde "há dano axonal e quanto", não "qual doença". Usá-lo para diagnóstico diferencial é usá-lo errado.',
      'Onde ele rende é no acompanhamento. Na esclerose múltipla, valores elevados predizem atividade inflamatória futura e progressão de incapacidade, e caem sob tratamento eficaz — o que permite avaliar resposta terapêutica sem esperar por uma nova lesão na ressonância. Na esclerose lateral amiotrófica, valores altos ao diagnóstico associam-se a progressão mais rápida e servem como desfecho em ensaios clínicos.',
      'Duas variáveis precisam ser corrigidas antes de qualquer leitura: a idade, porque o NfL sobe fisiologicamente ao longo da vida acompanhando a perda axonal do envelhecimento, e a função renal, porque ele é depurado pelo rim e se acumula na doença renal crônica. Um valor "alto" num paciente de 75 anos com creatinina de 2,0 mg/dL pode não significar nada.',
      'Um uso emergente e promissor é como marcador de triagem: um NfL normal em paciente com queixa cognitiva ou sintomas neurológicos inespecíficos torna neurodegeneração ativa improvável, e isso tem valor tranquilizador real em uma população em que a ansiedade sobre demência é enorme.',
    ],
    fisiologia: {
      oQueE: 'Subunidade leve dos neurofilamentos, proteínas do citoesqueleto exclusivas do neurônio.',
      origem: 'Axônios do sistema nervoso central e periférico.',
      funcao: 'Sustentação estrutural e manutenção do calibre axonal, determinando a velocidade de condução.',
      eliminacao: 'Depuração renal — acumula-se na insuficiência renal.',
      orgaosEnvolvidos: ['Sistema nervoso central', 'Nervos periféricos', 'Rim'],
      percurso: [
        'Lesão ou degeneração axonal',
        'liberação de neurofilamentos no interstício cerebral',
        'passagem para o líquor',
        'drenagem para o sangue em concentração cerca de 40 vezes menor',
        'detecção por ensaio ultrassensível no plasma',
      ],
    },
    aumento: {
      resumo: 'Dano axonal de qualquer causa — e também idade avançada e insuficiência renal, que precisam ser descontadas.',
      mecanismos: [
        {
          titulo: 'Degeneração axonal',
          explicacao: 'A perda da integridade do axônio libera seu conteúdo estrutural, em quantidade proporcional à extensão e à velocidade da lesão.',
          exemplos: [
            { causa: 'Esclerose múltipla em atividade', etapas: ['inflamação desmielinizante com transecção axonal', 'NfL ↑ no líquor e no sangue', 'valor prediz atividade futura e progressão', 'queda sob tratamento eficaz'], nota: 'Permite avaliar resposta terapêutica antes que uma nova lesão apareça na ressonância.' },
            { causa: 'Esclerose lateral amiotrófica', etapas: ['degeneração do neurônio motor superior e inferior', 'NfL muito elevado', 'valores altos ao diagnóstico predizem progressão mais rápida'] },
            { causa: 'Traumatismo cranioencefálico e acidente vascular cerebral', etapas: ['lesão axonal difusa ou focal', 'NfL ↑ nas horas seguintes com pico em dias', 'magnitude proporcional à extensão do dano'] },
            { causa: 'Neurotoxicidade por quimioterápico', etapas: ['lesão axonal periférica por taxanos ou platina', 'NfL ↑ antes dos sintomas neuropáticos', 'possibilidade de ajuste terapêutico'] },
          ],
        },
        {
          titulo: 'Elevação sem doença neurológica ativa',
          explicacao: 'Envelhecimento e retenção renal elevam o marcador sem que haja neurodegeneração em curso.',
          exemplos: [
            { causa: 'Idade avançada e doença renal crônica', etapas: ['perda axonal fisiológica e depuração reduzida', 'NfL ↑ sem doença ativa', 'necessidade de ajuste por idade e função renal'], nota: 'Sem essa correção, o exame produz alarmes falsos com frequência.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Para interpretar corretamente', ids: ['creatinina', 'tfg-estimada'], leitura: 'Função renal reduzida eleva o NfL sem dano neuronal — corrigir antes de concluir.' },
      { titulo: 'Quando a suspeita é demência', ids: ['biomarcadores-alzheimer'], leitura: 'O NfL diz que há neurodegeneração; os biomarcadores amiloide e tau dizem se ela é da doença de Alzheimer.' },
    ],
    advertencia:
      'Marcador de dano axonal, não de doença específica. Não estabelece diagnóstico e deve ser interpretado com idade e função renal em mãos.',
    utilidade: ['prognostico', 'acompanhamento'],
    estudarTambem: ['biomarcadores-alzheimer', 'liquor', 'creatinina'],
  },

  {
    id: 'biomarcadores-alzheimer',
    nome: 'Biomarcadores da doença de Alzheimer (Aβ42, relação Aβ42/40, p-tau e tau total)',
    sigla: 'Aβ / p-tau',
    sinonimos: ['beta amiloide', 'abeta 42', 'relacao abeta 42 40', 'p-tau', 'p-tau181', 'p-tau217', 'tau total', 'proteina tau', 'biomarcadores alzheimer'],
    grupo: 'neurologia',
    sistemas: ['neurologico'],
    material: 'Líquor ou plasma (ensaios ultrassensíveis)',
    unidade: 'pg/mL e razão',
    referencias: [
      { rotulo: 'Aβ42 liquórico', texto: 'Reduzido na doença de Alzheimer', unidade: 'pg/mL', observacao: 'Os pontos de corte são específicos de cada plataforma e não são transferíveis entre laboratórios.' },
      { rotulo: 'Relação Aβ42/Aβ40', texto: 'Reduzida — mais robusta que o Aβ42 isolado', unidade: 'razão' },
      { rotulo: 'p-tau181 ou p-tau217', texto: 'Elevado', unidade: 'pg/mL' },
      { rotulo: 'Tau total', texto: 'Elevado — marcador de intensidade da neurodegeneração', unidade: 'pg/mL' },
    ],
    resumo:
      'Traduzem em números a fisiopatologia do Alzheimer: o amiloide que se agrega no cérebro **desaparece** do líquor, enquanto a tau fosforilada, liberada pelos emaranhados, aumenta. É a única situação em que um marcador baixo indica mais doença.',
    entenda:
      'O padrão é contraintuitivo e vale entender bem. O peptídeo Aβ42 se agrega em placas dentro do parênquima cerebral — e, ao ficar preso ali, deixa de circular no líquor. Por isso o **Aβ42 baixo** indica maior carga amiloide. A proteína tau hiperfosforilada, ao contrário, forma emaranhados neurofibrilares e vaza para o líquor conforme os neurônios degeneram: p-tau alta indica mais patologia. A assinatura completa é Aβ42 baixo com p-tau alta.',
    aprofundar: [
      'A relação Aβ42/Aβ40 é preferida ao Aβ42 isolado porque corrige a variação individual na produção total de amiloide. Uma pessoa que produz pouco amiloide terá Aβ42 baixo sem ter doença; a razão com o Aβ40 normaliza esse efeito e melhora substancialmente o desempenho diagnóstico.',
      'A migração desses marcadores do líquor para o plasma é uma das mudanças mais significativas da neurologia recente. Ensaios ultrassensíveis de p-tau217 e p-tau181 no sangue alcançam desempenho próximo ao do líquor e da tomografia por emissão de pósitrons, com uma fração do custo e sem punção lombar. Isso torna viável, pela primeira vez, uma triagem em atenção primária — com todas as questões éticas que isso levanta.',
      'A questão ética não é acessória. Esses marcadores ficam alterados anos a décadas antes dos sintomas, e identificam pessoas cognitivamente normais com patologia de Alzheimer em curso. Testar alguém assintomático significa entregar uma informação sobre risco elevado de uma doença que, até muito recentemente, não tinha tratamento modificador. Por isso as recomendações restringem o uso a pacientes com comprometimento cognitivo objetivo, e sempre com aconselhamento prévio.',
      'O uso clínico mais defensável hoje é diferenciar causas de demência em casos atípicos: início precoce, apresentação não amnéstica, progressão atípica, ou dúvida entre Alzheimer e demência frontotemporal. Também identificam quem tem patologia amiloide e, portanto, quem pode ser candidato a anticorpos antiamiloide — cujo uso exige a confirmação por biomarcador, não apenas o quadro clínico.',
      'A proteína 14-3-3 no líquor tem um papel diferente e específico: ela marca destruição neuronal rápida e maciça, e integra os critérios diagnósticos da doença de Creutzfeldt-Jakob. Não é específica — sobe também em encefalite e em acidente vascular extenso —, mas em demência rapidamente progressiva com mioclonias e alterações eletroencefalográficas típicas, ela pesa muito.',
    ],
    fisiologia: {
      oQueE: 'Aβ42 e Aβ40: peptídeos derivados da clivagem da proteína precursora amiloide. Tau: proteína associada a microtúbulos, fosforilada patologicamente na doença.',
      origem: 'Neurônios do sistema nervoso central.',
      funcao: 'A tau estabiliza microtúbulos axonais; o amiloide tem funções fisiológicas ainda em investigação.',
      orgaosEnvolvidos: ['Córtex cerebral', 'Hipocampo'],
      percurso: [
        'Clivagem da proteína precursora amiloide gera Aβ42',
        'agregação em placas no parênquima cerebral',
        'Aβ42 liquórico ↓ por sequestro nas placas',
        'hiperfosforilação da tau e formação de emaranhados',
        'degeneração neuronal libera p-tau e tau total no líquor',
      ],
    },
    aumento: {
      resumo: 'p-tau e tau total elevadas indicam patologia neurofibrilar e neurodegeneração; a tau total isolada sobe em qualquer dano neuronal agudo.',
      mecanismos: [
        {
          titulo: 'Patologia neurofibrilar e degeneração neuronal',
          explicacao: 'A hiperfosforilação da tau desestabiliza os microtúbulos e forma emaranhados; a morte neuronal subsequente libera tau no líquor.',
          exemplos: [
            { causa: 'Doença de Alzheimer', etapas: ['acúmulo de amiloide seguido de patologia tau', 'Aβ42 ↓ com p-tau ↑ e tau total ↑', 'padrão que precede sintomas em anos', 'confirma patologia amiloide em candidatos a terapia dirigida'] },
            { causa: 'Doença de Creutzfeldt-Jakob', etapas: ['destruição neuronal maciça e rápida', 'tau total muito elevada e proteína 14-3-3 positiva', 'demência rapidamente progressiva com mioclonias'], nota: 'A 14-3-3 não é específica — sobe em qualquer necrose neuronal extensa.' },
            { causa: 'Acidente vascular cerebral extenso e encefalite', etapas: ['dano neuronal agudo', 'tau total ↑ com p-tau normal', 'padrão que distingue de neurodegeneração crônica'], nota: 'A p-tau é o que confere especificidade para Alzheimer; a tau total sozinha não.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Aβ42 e a relação Aβ42/Aβ40 reduzidas indicam maior carga de placas amiloides no cérebro.',
      mecanismos: [
        {
          titulo: 'Sequestro do amiloide nas placas',
          explicacao: 'O peptídeo agregado no parênquima não circula: quanto mais placa, menos Aβ42 disponível no líquor.',
          exemplos: [
            { causa: 'Patologia amiloide cerebral', etapas: ['agregação de Aβ42 em placas', 'redução da fração solúvel liquórica', 'Aβ42 ↓ e relação Aβ42/Aβ40 ↓', 'alteração detectável décadas antes dos sintomas'], nota: 'É o único contexto em que um marcador **baixo** indica mais doença.' },
            { causa: 'Angiopatia amiloide cerebral', etapas: ['deposição de amiloide na parede vascular', 'Aβ40 e Aβ42 reduzidos no líquor', 'risco de hemorragia lobar'], nota: 'Relevante antes de indicar anticoagulação ou terapia antiamiloide.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A extensão da neurodegeneração', ids: ['neurofilamento-leve'], leitura: 'O NfL mede quanto axônio está sendo perdido; os biomarcadores amiloide e tau dizem por qual patologia.' },
      { titulo: 'As causas reversíveis a excluir antes', ids: ['tsh', 'vitamina-b12', 'vdrl', 'sodio', 'calcio'], leitura: 'Hipotireoidismo, deficiência de B12, neurossífilis, hiponatremia e hipercalcemia produzem declínio cognitivo tratável e devem ser afastados primeiro.' },
    ],
    advertencia:
      'Não indicados para pessoas cognitivamente normais fora de protocolos de pesquisa: identificam patologia décadas antes dos sintomas e a informação tem consequências pessoais sérias. Pontos de corte são específicos de cada plataforma e não são comparáveis entre laboratórios.',
    interferentes: {
      preAnalitico: ['O peptídeo amiloide adere ao plástico: tubos e protocolos de manipulação específicos são obrigatórios, e a adesão reduz o valor medido.'],
      metodo: ['Ausência de padronização entre plataformas — comparações seriadas exigem o mesmo laboratório e o mesmo ensaio.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['neurofilamento-leve', 'liquor', 'vitamina-b12', 'tsh'],
  },

  {
    id: 'anticorpos-neurologicos',
    nome: 'Autoanticorpos neurológicos (anti-AChR, anti-MuSK, anti-aquaporina-4, anti-MOG e anti-NMDA)',
    sigla: 'Anticorpos neuro',
    sinonimos: ['anti receptor de acetilcolina', 'anti achr', 'anti musk', 'miastenia gravis', 'anti aquaporina 4', 'anti aqp4', 'neuromielite optica', 'anti mog', 'anti nmda', 'encefalite autoimune'],
    grupo: 'neurologia',
    sistemas: ['neurologico', 'imunologico'],
    material: 'Soro; anti-NMDA deve ser pesquisado também no líquor',
    unidade: 'nmol/L ou reagente/não reagente',
    referencias: [
      { rotulo: 'Anti-receptor de acetilcolina', texto: '< 0,02', unidade: 'nmol/L' },
      { rotulo: 'Anti-MuSK', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anti-aquaporina-4', texto: 'Não reagente', unidade: '' },
      { rotulo: 'Anti-NMDA', texto: 'Não reagente — pesquisar em soro **e** líquor', unidade: '' },
    ],
    resumo:
      'Anticorpos que causam doença neurológica diretamente — e cujo reconhecimento muda o tratamento de imediato, porque essas doenças respondem a imunoterapia enquanto outras neurodegenerações não respondem a nada.',
    entenda:
      'O que une esses anticorpos é a patogenicidade direta: eles não são apenas marcadores, eles produzem a doença. O anti-receptor de acetilcolina bloqueia e destrói a junção neuromuscular, causando fadiga muscular flutuante. O anti-aquaporina-4 ataca o astrócito, produzindo lesões medulares extensas e neurite óptica grave. O anti-NMDA remove receptores da sinapse, causando encefalite com psicose, convulsões e discinesias. Identificá-los é identificar uma doença tratável.',
    aprofundar: [
      'A distinção entre neuromielite óptica e esclerose múltipla é uma das mais consequentes da neurologia, porque os tratamentos divergem e alguns fármacos usados na esclerose múltipla **pioram** a neuromielite óptica. As pistas laboratoriais e clínicas: mielite longitudinalmente extensa (três ou mais segmentos vertebrais), neurite óptica bilateral ou grave, ausência de bandas oligoclonais, e anti-aquaporina-4 positivo. O anti-MOG define uma terceira entidade, mais frequente em crianças, com melhor prognóstico e curso frequentemente monofásico.',
      'A encefalite anti-NMDA tem uma apresentação que faz o paciente chegar à psiquiatria antes da neurologia: sintomas psicóticos, alteração de comportamento e catatonia precedem as convulsões, as discinesias orofaciais e a disautonomia. Em mulheres jovens, a associação com teratoma de ovário é forte o suficiente para que a busca pelo tumor seja obrigatória — sua remoção faz parte do tratamento. O anticorpo deve ser pesquisado no líquor além do soro: há casos com soro negativo e líquor positivo.',
      'Na miastenia gravis, a divisão sorológica orienta o manejo. O anti-receptor de acetilcolina é positivo na maioria e associa-se a timoma em cerca de 10 a 15% dos casos, o que torna a tomografia de tórax obrigatória ao diagnóstico. O anti-MuSK caracteriza um subgrupo com predomínio bulbar e facial, resposta pior a anticolinesterásicos e melhor a rituximabe. Uma parcela é soronegativa para ambos, e nela o diagnóstico se apoia na eletroneuromiografia com estimulação repetitiva.',
      'Uma regra prática comum a todos: em síndrome neurológica de instalação subaguda e curso atípico, especialmente em jovens, vale pesquisar autoanticorpos antes de concluir por doença degenerativa ou psiquiátrica primária. Esses quadros respondem a imunoterapia — e o tempo até o tratamento se correlaciona com a recuperação funcional.',
    ],
    fisiologia: {
      oQueE: 'Autoanticorpos dirigidos a receptores e canais da junção neuromuscular, do astrócito ou da sinapse neuronal.',
      origem: 'Plasmócitos autorreativos, por vezes estimulados por antígeno tumoral (síndromes paraneoplásicas).',
      funcao: 'Diretamente patogênicos — bloqueiam, internalizam ou destroem seus alvos.',
      orgaosEnvolvidos: ['Junção neuromuscular', 'Medula espinhal', 'Nervo óptico', 'Córtex e sistema límbico'],
      percurso: [
        'Perda de tolerância, por vezes deflagrada por tumor ou infecção',
        'anticorpo dirigido a um alvo neuronal específico',
        'bloqueio, internalização ou lise mediada por complemento',
        'síndrome clínica correspondente ao alvo',
        'reversibilidade com imunoterapia precoce',
      ],
    },
    aumento: {
      resumo: 'Cada anticorpo define uma síndrome tratável — e a especificidade determina o alvo e o tratamento.',
      mecanismos: [
        {
          titulo: 'Agressão dirigida a um alvo neuronal específico',
          explicacao: 'O anticorpo se liga ao seu antígeno e o bloqueia, internaliza ou destrói, produzindo perda de função exatamente onde o alvo se expressa.',
          exemplos: [
            { causa: 'Miastenia gravis', etapas: ['anti-receptor de acetilcolina bloqueia e destrói a junção neuromuscular', 'fraqueza flutuante com fadigabilidade', 'ptose e diplopia frequentemente iniciais', 'tomografia de tórax obrigatória para pesquisar timoma'] },
            { causa: 'Miastenia anti-MuSK', etapas: ['acometimento bulbar e facial predominante', 'resposta pior a anticolinesterásicos', 'melhor resposta a rituximabe'] },
            { causa: 'Neuromielite óptica (anti-aquaporina-4)', etapas: ['ataque ao astrócito com ativação de complemento', 'mielite longitudinalmente extensa e neurite óptica grave', 'bandas oligoclonais geralmente ausentes'], nota: 'Distinguir da esclerose múltipla é crítico: alguns tratamentos dela pioram esta doença.' },
            { causa: 'Encefalite anti-NMDA', etapas: ['internalização dos receptores NMDA da sinapse', 'psicose, catatonia, convulsões, discinesias e disautonomia', 'busca obrigatória por teratoma de ovário em mulheres jovens', 'resposta a imunoterapia e à ressecção do tumor'], nota: 'Pesquisar no líquor além do soro — há casos com soro negativo.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A avaliação do compartimento central', ids: ['liquor'], leitura: 'Pleocitose linfocítica e bandas oligoclonais no líquor apoiam etiologia autoimune; o anti-NMDA precisa ser pesquisado ali.' },
      { titulo: 'Autoimunidade associada', ids: ['anti-tpo', 'fan'], leitura: 'Tireoidite autoimune e outras conectivopatias acompanham essas síndromes com frequência maior que na população geral.' },
    ],
    advertencia:
      'Soronegatividade não exclui nenhuma dessas doenças. Em síndrome neurológica subaguda e atípica, a imunoterapia empírica pode ser iniciada antes do resultado quando a suspeita é forte — o tempo até o tratamento determina a recuperação.',
    utilidade: ['diagnostico'],
    estudarTambem: ['liquor', 'fan', 'anti-tpo'],
  },
]
