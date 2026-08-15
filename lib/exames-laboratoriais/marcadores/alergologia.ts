import type { Marcador } from '../tipos'

/**
 * Alergologia laboratorial — e o limite honesto do que ela consegue provar.
 *
 * Há um princípio que precisa atravessar todas as fichas deste arquivo:
 * **sensibilização não é alergia**. Um IgE específico positivo para amendoim
 * significa que existem anticorpos capazes de reconhecer aquele alimento; se a
 * pessoa passa mal ao comê-lo é uma pergunta clínica, não laboratorial. Cerca
 * de metade das pessoas com IgE específico positivo tolera o alimento sem
 * qualquer sintoma. Interpretar o exame sem a história é o erro que produz
 * dietas de exclusão desnecessárias e, ironicamente, aumenta o risco de alergia
 * verdadeira em crianças.
 *
 * O contraponto é a triptase, que faz o inverso: ela não diz a que a pessoa é
 * alérgica, mas prova que houve degranulação mastocitária — é a confirmação
 * retrospectiva de que aquele evento foi anafilaxia, e não outra coisa.
 */
export const marcadores: Marcador[] = [
  {
    id: 'ige-total',
    nome: 'IgE total',
    sigla: 'IgE',
    sinonimos: ['ige', 'ige total', 'imunoglobulina e', 'ige serica'],
    grupo: 'alergologia',
    sistemas: ['imunologico', 'respiratorio'],
    material: 'Soro',
    unidade: 'UI/mL',
    referencias: [
      { rotulo: 'Adultos', texto: '< 100', unidade: 'UI/mL' },
      { rotulo: 'Crianças 1 a 5 anos', texto: '< 60', unidade: 'UI/mL' },
      { rotulo: 'Recém-nascidos', texto: '< 1,5', unidade: 'UI/mL', observacao: 'IgE não atravessa a placenta — valor elevado no cordão indica produção fetal própria.' },
    ],
    resumo:
      'A imunoglobulina da alergia e da defesa antiparasitária. Sobe na atopia, mas também na parasitose, em imunodeficiências e em algumas neoplasias — e um valor normal não exclui alergia alguma.',
    entenda:
      'A IgE circula em concentração ínfima comparada às outras imunoglobulinas — nanogramas contra miligramas — porque quase toda ela está ancorada na superfície dos mastócitos e basófilos, ligada ao receptor FcεRI. Essa localização explica tudo: quando o alérgeno faz ponte entre duas moléculas de IgE na membrana, o mastócito degranula em segundos. E explica também por que a IgE total tem valor diagnóstico modesto: o que importa é a IgE específica ligada ao mastócito, não a quantidade total flutuando no soro.',
    aprofundar: [
      'A distribuição da IgE total na população geral se sobrepõe muito entre alérgicos e não alérgicos. Um valor normal ocorre em uma parcela substancial de pacientes com rinite alérgica e asma alérgica bem documentadas; e valores altos ocorrem em pessoas sem qualquer sintoma. Por isso a IgE total isolada não serve para diagnosticar nem para excluir atopia — ela contextualiza.',
      'No Brasil, a parasitose intestinal é causa frequente e frequentemente esquecida de IgE muito elevada. A resposta Th2 contra helmintos é a função evolutiva original da IgE, e a alergia é, nessa leitura, uma resposta antiparasitária dirigida ao alvo errado. IgE de milhares de UI/mL com eosinofilia em paciente sem quadro atópico convincente pede parasitológico e, dependendo da epidemiologia, pesquisa de estrongiloidíase.',
      'Valores extremos — dezenas de milhares — apontam para um conjunto pequeno e específico: síndrome de hiper-IgE (com abscessos frios, pneumatoceles e dentição decídua retida), aspergilose broncopulmonar alérgica, dermatite atópica grave, síndrome de Wiskott-Aldrich e algumas parasitoses disseminadas.',
      'A IgE total tem hoje um uso prático que independe do diagnóstico: ela define a dose e a elegibilidade do omalizumabe, anticorpo anti-IgE usado em asma alérgica grave e urticária crônica. Aqui o exame deixou de ser diagnóstico e virou dosimétrico.',
    ],
    fisiologia: {
      oQueE: 'Imunoglobulina de classe E, produzida por plasmócitos após troca de classe induzida por IL-4 e IL-13.',
      origem: 'Plasmócitos de mucosas respiratória e intestinal e de linfonodos regionais.',
      circulacao: 'Concentração plasmática mínima; a maior parte está ligada a receptores de alta afinidade em mastócitos teciduais e basófilos.',
      funcao: 'Defesa contra helmintos; na atopia, medeia a hipersensibilidade imediata ao promover degranulação mastocitária.',
      meiaVida: 'Cerca de 2 dias no plasma, mas semanas a meses quando ligada ao mastócito.',
      orgaosEnvolvidos: ['Mucosa respiratória', 'Mucosa intestinal', 'Pele', 'Linfonodos'],
      percurso: [
        'Alérgeno apresentado com perfil Th2',
        'IL-4 e IL-13 induzem troca de classe para IgE',
        'IgE liberada e capturada por FcεRI em mastócitos',
        'reexposição faz ponte entre duas IgE vizinhas',
        'degranulação: histamina, triptase, leucotrienos',
      ],
    },
    aumento: {
      resumo: 'Resposta Th2 — alérgica, antiparasitária, ou desregulada por defeito imune ou clone neoplásico.',
      mecanismos: [
        {
          titulo: 'Resposta Th2 alérgica',
          explicacao: 'A exposição repetida a alérgenos em indivíduo geneticamente predisposto orienta a resposta para IL-4/IL-13 e para produção de IgE específica, que se soma no total.',
          exemplos: [
            { causa: 'Dermatite atópica, asma alérgica, rinite alérgica', etapas: ['sensibilização a aeroalérgenos ou alimentos', 'produção de IgE específica múltipla', 'IgE total ↑ proporcional ao número de sensibilizações', 'eosinofilia frequentemente associada'], nota: 'Quanto mais alérgenos envolvidos, maior a IgE total — a marcha atópica se reflete no número.' },
            { causa: 'Aspergilose broncopulmonar alérgica', etapas: ['colonização brônquica por Aspergillus em asmático ou fibrocístico', 'resposta Th2 intensa e persistente ao fungo', 'IgE total frequentemente > 1.000 UI/mL', 'IgE específica e IgG específica anti-Aspergillus positivas'], nota: 'IgE total abaixo de 500 UI/mL torna o diagnóstico improvável — é um dos poucos contextos em que a IgE total é critério formal.' },
          ],
        },
        {
          titulo: 'Resposta antiparasitária',
          explicacao: 'Helmintos induzem resposta Th2 vigorosa e policlonal, elevando a IgE sem relação com atopia.',
          exemplos: [
            { causa: 'Estrongiloidíase, ascaridíase, toxocaríase, esquistossomose', etapas: ['antígenos helmínticos estimulam IL-4 e IL-5', 'IgE total ↑↑ e eosinofilia', 'sem correlação com sintomas alérgicos'], nota: 'Em paciente que vai receber corticoide ou imunossupressor, a estrongiloidíase precisa ser tratada antes: a imunossupressão pode desencadear hiperinfecção fatal.' },
          ],
        },
        {
          titulo: 'Desregulação imune e clonalidade',
          explicacao: 'Defeitos de regulação da resposta Th2 ou proliferação de clones produtores elevam a IgE sem alérgeno definido.',
          exemplos: [
            { causa: 'Síndrome de hiper-IgE (STAT3 ou DOCK8)', etapas: ['defeito na via Th17 e na regulação Th2', 'IgE > 2.000 UI/mL desde a infância', 'abscessos cutâneos frios, pneumonias com pneumatoceles, eczema grave'] },
            { causa: 'Linfoma de Hodgkin, mieloma IgE, HIV avançado', etapas: ['desregulação da resposta imune ou clone produtor', 'IgE ↑ sem quadro alérgico correspondente'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Praticamente sem significado clínico isolado — exceto no contexto de imunodeficiência com todas as classes baixas.',
      mecanismos: [
        {
          titulo: 'Falha global de produção de imunoglobulinas',
          explicacao: 'A IgE baixa só é informativa quando acompanha redução das demais classes, indicando defeito de produção e não ausência de atopia.',
          exemplos: [
            { causa: 'Agamaglobulinemia, imunodeficiência comum variável', etapas: ['falha de maturação de linfócitos B', 'IgG, IgA, IgM e IgE ↓', 'infecções bacterianas de repetição'], nota: 'IgE indetectável isolada, com as demais classes normais, não é doença.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O que realmente responde a pergunta alérgica', ids: ['ige-especifica', 'eosinofilos-absolutos'], leitura: 'A IgE total contextualiza; a IgE específica identifica o alérgeno; a eosinofilia mede a atividade da resposta Th2 no tecido.' },
      { titulo: 'Quando a IgE alta não é alergia', ids: ['parasitologico-fezes', 'proteina-cationica-eosinofilica'], leitura: 'IgE muito alta com eosinofilia e sem quadro atópico convincente pede investigação parasitária antes de qualquer painel de alérgenos.' },
    ],
    advertencia:
      'IgE total normal não exclui alergia, e IgE total alta não a confirma. O diagnóstico de alergia é clínico; o laboratório apenas apoia.',
    interferentes: {
      fisiologico: ['Sobe progressivamente da infância até a adolescência e declina no idoso.', 'Tabagismo eleva.', 'Etnia e carga parasitária populacional deslocam a faixa de normalidade — valores de referência importados frequentemente não se aplicam.'],
      medicamentos: ['Corticoide sistêmico prolongado reduz.', 'Omalizumabe eleva a IgE total medida por formar complexos, tornando o exame ininterpretável durante o tratamento.'],
    },
    utilidade: ['triagem', 'acompanhamento'],
    estudarTambem: ['ige-especifica', 'eosinofilos-absolutos', 'triptase'],
  },

  {
    id: 'ige-especifica',
    nome: 'IgE específica (RAST / ImmunoCAP)',
    sigla: 'IgE esp.',
    sinonimos: ['ige especifica', 'rast', 'immunocap', 'painel de alergenos', 'ige alergeno especifica', 'phadiatop'],
    grupo: 'alergologia',
    sistemas: ['imunologico', 'respiratorio', 'digestivo'],
    material: 'Soro',
    unidade: 'kUA/L',
    referencias: [
      { rotulo: 'Classe 0 — indetectável', texto: '< 0,10', unidade: 'kUA/L' },
      { rotulo: 'Classe 1 — baixo', texto: '0,35 a 0,70', unidade: 'kUA/L' },
      { rotulo: 'Classe 2 a 3 — moderado', texto: '0,70 a 17,5', unidade: 'kUA/L' },
      { rotulo: 'Classe 4 a 6 — alto', texto: '> 17,5', unidade: 'kUA/L', observacao: 'A classe reflete a quantidade de anticorpo, não a gravidade da reação clínica.' },
    ],
    resumo:
      'Mede anticorpos IgE dirigidos a um alérgeno específico. Estabelece sensibilização — não estabelece alergia. A diferença entre as duas coisas é a informação clínica mais importante desta ficha.',
    entenda:
      'O soro do paciente é exposto ao alérgeno fixado em uma fase sólida; a IgE que reconhece aquele alérgeno se liga e é quantificada. Um resultado positivo diz que o sistema imune produziu anticorpos contra aquela proteína. Se a exposição produz sintomas depende de fatores que o tubo não conhece: quantidade de IgE ligada ao mastócito, afinidade, limiar de degranulação, dose de exposição, cofatores como exercício e álcool. Por isso o exame não substitui a história — ele a confirma ou a questiona.',
    aprofundar: [
      'A consequência prática mais importante: **não se pede painel de alérgenos em quem não tem sintomas**. Testar cinquenta alimentos numa criança com eczema produz, previsivelmente, vários positivos, e cada positivo tende a virar uma exclusão dietética. O resultado é desnutrição, restrição social e — pela perda de tolerância oral — aumento do risco de alergia verdadeira ao alimento retirado. O exame deve ser dirigido pela história, alérgeno a alérgeno.',
      'Existem valores de corte com valor preditivo positivo alto para alguns alimentos — acima dos quais a probabilidade de reação clínica é muito elevada e o teste de provocação pode ser dispensado. Esses cortes são específicos por alimento e por idade, e não se extrapolam entre alérgenos: o corte do ovo não vale para o amendoim.',
      'O diagnóstico por componentes moleculares refinou o exame. Em vez de testar "amendoim", testam-se as proteínas individuais: Ara h 2 associa-se a reação sistêmica grave, enquanto Ara h 8 (homóloga do pólen de bétula) associa-se apenas a síndrome de alergia oral leve. Dois pacientes com "IgE para amendoim positiva" podem, portanto, ter prognósticos opostos — e é o componente que separa.',
      'A reatividade cruzada explica muitos positivos clinicamente irrelevantes. Determinantes de carboidratos e panalérgenos como as profilinas são compartilhados entre pólens, frutas e látex, produzindo positividade ampla sem correspondência sintomática. É uma das razões de o painel amplo gerar mais confusão que informação.',
    ],
    fisiologia: {
      oQueE: 'Anticorpos IgE dirigidos contra epítopos de um alérgeno definido.',
      origem: 'Plasmócitos de mucosas e linfonodos regionais após sensibilização.',
      funcao: 'Ligar-se ao receptor de alta afinidade do mastócito e desencadear degranulação na reexposição ao alérgeno.',
      percurso: [
        'Primeira exposição ao alérgeno',
        'apresentação com perfil Th2 e troca de classe para IgE',
        'IgE específica ancorada no mastócito tecidual',
        'reexposição: ponte entre duas IgE',
        'degranulação e sintomas em minutos',
      ],
    },
    aumento: {
      resumo: 'Sensibilização ao alérgeno testado — o que pode ou não corresponder a doença clínica.',
      significado:
        'Positivo com história compatível confirma o diagnóstico. Positivo sem história é sensibilização assintomática, e a conduta é não restringir. Negativo com história muito sugestiva não fecha: valores baixos podem ocorrer em alergia mediada por IgE local ou por alérgenos não incluídos no painel.',
      mecanismos: [
        {
          titulo: 'Produção de IgE dirigida a um antígeno ambiental ou alimentar',
          explicacao: 'A troca de classe para IgE ocorre em resposta a antígenos específicos, e cada sensibilização gera anticorpos com especificidade própria.',
          exemplos: [
            { causa: 'Rinite alérgica por ácaros', etapas: ['exposição domiciliar contínua a Dermatophagoides', 'IgE específica ↑', 'degranulação mastocitária na mucosa nasal', 'espirros, prurido, rinorreia e obstrução'], nota: 'Aqui o positivo com história típica permite imunoterapia específica — o único tratamento que modifica o curso da doença.' },
            { causa: 'Anafilaxia alimentar', etapas: ['sensibilização a proteína alimentar', 'IgE específica alta, frequentemente a componente de risco', 'degranulação sistêmica na ingestão', 'urticária, broncoespasmo, hipotensão'], nota: 'A gravidade da reação não se prevê pela classe: paciente com classe 2 pode ter anafilaxia e paciente com classe 5 pode tolerar.' },
            { causa: 'Sensibilização assintomática', etapas: ['IgE específica detectável', 'ausência de qualquer sintoma na exposição', 'exame positivo sem doença'], nota: 'É o resultado mais frequente em painéis pedidos sem indicação clínica — e o que mais causa dano por dietas desnecessárias.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O contexto da resposta alérgica', ids: ['ige-total', 'eosinofilos-absolutos'], leitura: 'A IgE total ajuda a interpretar: um valor específico modesto numa IgE total muito alta pesa menos que o mesmo valor com IgE total normal.' },
      { titulo: 'Para confirmar anafilaxia', ids: ['triptase'], leitura: 'A IgE específica diz a que a pessoa é sensibilizada; a triptase colhida no evento prova que houve degranulação mastocitária.' },
    ],
    advertencia:
      'Não peça painéis amplos de alérgenos sem sintomas dirigidos. Sensibilização não é alergia, e exclusões alimentares baseadas apenas em IgE específica causam dano nutricional e podem induzir perda de tolerância.',
    interferentes: {
      fisiologico: ['Reatividade cruzada entre pólens, frutas e látex gera positivos sem correspondência clínica.'],
      medicamentos: ['Ao contrário dos testes cutâneos, o resultado não é afetado por anti-histamínicos — é a vantagem prática do método sorológico.'],
      metodo: ['Determinantes de carboidratos reagentes cruzados produzem positividade ampla em alguns ensaios; o diagnóstico por componentes contorna esse problema.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['ige-total', 'triptase', 'eosinofilos-absolutos'],
  },

  {
    id: 'triptase',
    nome: 'Triptase sérica',
    sinonimos: ['triptase', 'triptase serica', 'beta triptase', 'triptase mastocitaria'],
    grupo: 'alergologia',
    sistemas: ['imunologico'],
    material: 'Soro',
    unidade: 'µg/L',
    referencias: [
      { rotulo: 'Basal — adultos', texto: '< 11,4', unidade: 'µg/L' },
      { rotulo: 'Elevação significativa em evento agudo', texto: '> (1,2 × basal) + 2', unidade: 'µg/L', observacao: 'A fórmula compara o valor do evento com o basal do próprio paciente — é mais sensível que qualquer corte fixo.' },
      { rotulo: 'Sugestivo de mastocitose sistêmica', texto: '> 20 persistente', unidade: 'µg/L' },
    ],
    resumo:
      'A protease dos grânulos do mastócito. Colhida durante ou logo após o evento, prova que houve degranulação — é a confirmação laboratorial de anafilaxia. Persistentemente alta, aponta para mastocitose.',
    entenda:
      'O mastócito é a única célula que armazena triptase em quantidade relevante. Quando degranula, libera histamina (que desaparece em minutos e é impossível de medir na prática) e triptase, que sobe em 15 a 30 minutos, atinge o pico em 1 a 2 horas e volta ao basal em 6 a 24 horas. Essa janela é o que torna o exame útil e, ao mesmo tempo, fácil de perder: colhido no dia seguinte, o resultado será normal mesmo numa anafilaxia inequívoca.',
    aprofundar: [
      'A regra prática que muda o rendimento do exame: colher duas amostras. Uma entre 30 minutos e 2 horas do evento, e outra pelo menos 24 horas depois, quando o paciente já se recuperou, para estabelecer o basal. A comparação entre as duas — e não o valor isolado — é o que confirma degranulação. Um valor de 9 µg/L parece normal, mas se o basal daquela pessoa é 3, houve degranulação inequívoca.',
      'A triptase pode não subir em anafilaxia alimentar, sobretudo em crianças, porque a degranulação nesses casos é predominantemente de mastócitos da mucosa intestinal e a liberação sistêmica é menor. Triptase normal, portanto, não exclui anafilaxia: o diagnóstico permanece clínico. Ela sobe de forma mais confiável nas anafilaxias por veneno de himenóptero e por medicamentos endovenosos.',
      'A triptase basal persistentemente elevada tem duas explicações principais e uma terceira frequentemente esquecida. Mastocitose sistêmica (com mutação KIT D816V), síndrome de ativação mastocitária, e a alfa-triptasemia hereditária — uma duplicação do gene TPSAB1 presente em cerca de 5% da população, que eleva a triptase basal sem doença mastocitária e sem necessidade de investigação medular. Reconhecer a terceira evita biópsias de medula desnecessárias.',
      'Um valor basal elevado também é fator de risco: pessoas com triptase basal alta têm reações mais graves a veneno de himenóptero e a anestésicos, e essa informação muda a orientação de portar adrenalina autoinjetável.',
    ],
    fisiologia: {
      oQueE: 'Serina protease tetramérica armazenada nos grânulos secretores dos mastócitos.',
      origem: 'Mastócitos teciduais; quantidade muito menor em basófilos.',
      circulacao: 'A alfa-protriptase é liberada continuamente e compõe o valor basal, refletindo a massa total de mastócitos. A beta-triptase madura só é liberada na degranulação e produz o pico agudo.',
      funcao: 'Degradar matriz extracelular, ativar receptores PAR-2, recrutar eosinófilos e amplificar a resposta inflamatória local.',
      meiaVida: 'Cerca de 2 horas — daí a janela estreita de coleta.',
      orgaosEnvolvidos: ['Pele', 'Mucosa respiratória e intestinal', 'Medula óssea'],
      percurso: [
        'Alérgeno faz ponte entre IgE no mastócito',
        'degranulação',
        'beta-triptase liberada no interstício',
        'absorção para a circulação em 15 a 30 minutos',
        'pico em 1 a 2 horas, retorno ao basal em 6 a 24 horas',
      ],
    },
    aumento: {
      resumo: 'Degranulação mastocitária aguda, ou massa mastocitária aumentada de forma persistente.',
      mecanismos: [
        {
          titulo: 'Degranulação aguda',
          explicacao: 'A liberação maciça do conteúdo granular durante uma reação sistêmica leva a beta-triptase ao plasma em quantidade mensurável.',
          exemplos: [
            { causa: 'Anafilaxia por veneno de himenóptero ou por fármaco endovenoso', etapas: ['ponte de IgE nos mastócitos', 'degranulação sistêmica', 'triptase ↑ em 30 minutos com pico em 1 a 2 horas', 'retorno ao basal em 24 horas'], nota: 'É o cenário de maior rendimento diagnóstico do exame.' },
            { causa: 'Reação anafilactoide não mediada por IgE (contraste, opioides, vancomicina)', etapas: ['degranulação direta do mastócito sem IgE', 'triptase ↑ do mesmo modo'], nota: 'A triptase confirma a degranulação, mas não distingue mecanismo imune de não imune.' },
            { causa: 'Anafilaxia alimentar', etapas: ['degranulação predominantemente em mastócitos de mucosa', 'liberação sistêmica menor', 'triptase frequentemente normal'], nota: 'Resultado normal aqui não afasta o diagnóstico.' },
          ],
        },
        {
          titulo: 'Massa mastocitária aumentada ou variante genética',
          explicacao: 'O basal reflete quantos mastócitos existem no organismo — e também quantas cópias do gene da alfa-triptase a pessoa herdou.',
          exemplos: [
            { causa: 'Mastocitose sistêmica', etapas: ['proliferação clonal de mastócitos com mutação KIT D816V', 'infiltração de medula, pele e trato digestivo', 'triptase basal persistentemente > 20 µg/L', 'episódios recorrentes de rubor, hipotensão e diarreia'] },
            { causa: 'Alfa-triptasemia hereditária', etapas: ['duplicação ou triplicação do gene TPSAB1', 'triptase basal moderadamente elevada de forma constitucional', 'sem clone mastocitário', 'não requer biópsia medular'], nota: 'Presente em torno de 5% da população — é a causa mais comum de triptase basal alta.' },
            { causa: 'Doença renal crônica avançada', etapas: ['depuração reduzida', 'triptase basal discretamente ↑ sem doença mastocitária'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na investigação da anafilaxia', ids: ['ige-especifica', 'histamina'], leitura: 'A triptase prova que houve degranulação; a IgE específica, colhida semanas depois, identifica o agente. Fazer as duas na ordem certa é o que fecha o caso.' },
      { titulo: 'Quando o basal é alto', ids: ['imunofenotipagem', 'fosfatase-alcalina'], leitura: 'Triptase basal persistentemente alta com organomegalia ou citopenias justifica investigação medular por citometria e pesquisa de KIT D816V.' },
    ],
    advertencia:
      'Triptase normal não exclui anafilaxia. O diagnóstico de anafilaxia é clínico e o tratamento com adrenalina nunca deve aguardar qualquer resultado laboratorial.',
    cinetica: {
      inicio: '15 a 30 minutos após o início da reação',
      pico: '1 a 2 horas',
      normalizacao: '6 a 24 horas',
      tendencia: 'A comparação entre a amostra do evento e o basal do próprio paciente é mais sensível que qualquer valor de corte isolado.',
    },
    interferentes: {
      preAnalitico: ['Coleta fora da janela de 30 minutos a 4 horas produz falso-negativo — é o erro mais comum com este exame.'],
      fisiologico: ['Alfa-triptasemia hereditária eleva o basal em cerca de 5% da população sem qualquer doença.'],
      metodo: ['Os imunoensaios comerciais medem alfa e beta triptase juntas, e é por isso que o basal e o agudo precisam ser comparados entre si.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['ige-especifica', 'histamina', 'eosinofilos-absolutos'],
  },

  {
    id: 'proteina-cationica-eosinofilica',
    nome: 'Proteína catiônica eosinofílica',
    sigla: 'ECP',
    sinonimos: ['ecp', 'proteina cationica eosinofilica', 'eosinophil cationic protein'],
    grupo: 'alergologia',
    sistemas: ['imunologico', 'respiratorio'],
    material: 'Soro (coleta com protocolo rígido de tempo e temperatura)',
    unidade: 'µg/L',
    referencias: [{ rotulo: 'Adultos', texto: '< 15', unidade: 'µg/L', observacao: 'Extremamente dependente do tempo e da temperatura de coagulação da amostra.' }],
    resumo:
      'Uma das proteínas tóxicas dos grânulos do eosinófilo. Mede não quantos eosinófilos existem, mas quanto eles estão degranulando — a atividade da inflamação eosinofílica, não sua magnitude numérica.',
    entenda:
      'A contagem de eosinófilos diz quantas células circulam; a ECP diz quanto conteúdo tóxico elas liberaram. É a diferença entre contar soldados e medir a munição gasta. Na asma eosinofílica, na dermatite atópica e na esofagite eosinofílica, a lesão tecidual vem da proteína básica maior, da ECP e da neurotoxina — não da presença da célula em si. Por isso a ECP se correlaciona melhor com atividade de doença que a eosinofilia.',
    aprofundar: [
      'A limitação do exame é pré-analítica e severa: o eosinófilo continua degranulando dentro do tubo enquanto o sangue coagula. Isso significa que o valor depende de quanto tempo a amostra ficou coagulando e em que temperatura — variações de 30 minutos alteram o resultado significativamente. Protocolos rígidos (coagulação por tempo padronizado a temperatura controlada, centrifugação imediata) são obrigatórios, e a ausência deles é a razão de o exame ser pouco reprodutível na prática de rotina.',
      'Na prática clínica contemporânea, a ECP foi em grande parte deslocada por marcadores mais robustos de inflamação tipo 2: a fração exalada de óxido nítrico na asma e a própria contagem absoluta de eosinófilos, que hoje orienta a escolha de terapia biológica. A ECP mantém interesse fisiopatológico e de pesquisa e valor pontual no acompanhamento de doenças eosinofílicas de órgão.',
    ],
    fisiologia: {
      oQueE: 'Ribonuclease catiônica armazenada nos grânulos específicos do eosinófilo.',
      origem: 'Eosinófilos maduros, medulares e teciduais.',
      funcao: 'Citotoxicidade contra helmintos por formação de poros na membrana; nos tecidos do hospedeiro, causa dano epitelial e neurotoxicidade.',
      eliminacao: 'Depuração hepática e renal.',
      orgaosEnvolvidos: ['Mucosa brônquica', 'Pele', 'Trato digestivo'],
      percurso: [
        'IL-5 recruta e ativa eosinófilos',
        'migração para o tecido-alvo',
        'degranulação com liberação de ECP e proteína básica maior',
        'dano epitelial e remodelamento',
        'ECP absorvida para a circulação',
      ],
    },
    aumento: {
      resumo: 'Eosinófilos ativados degranulando — asma em atividade, dermatite atópica extensa, parasitose tecidual, síndromes hipereosinofílicas.',
      mecanismos: [
        {
          titulo: 'Ativação e degranulação eosinofílica',
          explicacao: 'A IL-5 e as quimiocinas eotaxinas recrutam e ativam eosinófilos, que liberam o conteúdo granular no tecido; parte alcança a circulação.',
          exemplos: [
            { causa: 'Asma eosinofílica em atividade', etapas: ['inflamação tipo 2 na mucosa brônquica', 'eosinófilos ativados degranulam', 'dano epitelial e hiperresponsividade', 'ECP ↑ acompanhando a atividade clínica'], nota: 'Correlaciona-se melhor com atividade que a eosinofilia periférica, mas hoje o FeNO e a contagem absoluta cumprem o mesmo papel com melhor reprodutibilidade.' },
            { causa: 'Dermatite atópica extensa e esofagite eosinofílica', etapas: ['infiltração eosinofílica do tecido-alvo', 'degranulação local persistente', 'ECP sérica ↑'] },
            { causa: 'Parasitose tecidual invasiva', etapas: ['migração larvária pelos tecidos', 'resposta eosinofílica intensa', 'ECP ↑ com IgE ↑↑'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A inflamação tipo 2 completa', ids: ['eosinofilos-absolutos', 'ige-total'], leitura: 'A contagem mede quantidade, a ECP mede ativação e a IgE mede a orientação Th2 da resposta. Juntas descrevem o eixo inteiro.' },
    ],
    advertencia: 'Resultado muito dependente do processamento da amostra: sem protocolo pré-analítico controlado, o valor não é confiável nem comparável entre coletas.',
    interferentes: {
      preAnalitico: ['Tempo e temperatura de coagulação alteram profundamente o resultado — os eosinófilos degranulam dentro do tubo.', 'Amostra hemolisada é inutilizável.'],
      medicamentos: ['Corticoides reduzem acentuadamente por induzirem apoptose eosinofílica.'],
    },
    utilidade: ['acompanhamento'],
    estudarTambem: ['eosinofilos-absolutos', 'ige-total'],
  },

  {
    id: 'histamina',
    nome: 'Histamina plasmática e metabólitos urinários',
    sinonimos: ['histamina', 'n-metil-histamina', 'metil histamina urinaria', 'histamina plasmatica'],
    grupo: 'alergologia',
    sistemas: ['imunologico'],
    material: 'Plasma com EDTA em gelo, ou urina de 24 horas',
    unidade: 'nmol/L (plasma) ou µg/24h (urina)',
    referencias: [
      { rotulo: 'Plasma', texto: '< 1,0', unidade: 'nmol/L', observacao: 'Pico entre 5 e 15 minutos do evento — janela quase impraticável em atendimento de urgência.' },
      { rotulo: 'N-metil-histamina urinária de 24h', texto: '< 200', unidade: 'µg/24h', observacao: 'A dosagem urinária do metabólito é bem mais viável que a plasmática.' },
    ],
    resumo:
      'O mediador que produz os sintomas imediatos da alergia. No plasma tem meia-vida de minutos, o que a torna quase inútil na urgência; o metabólito urinário de 24 horas é o que se usa na prática.',
    entenda:
      'A histamina causa vasodilatação, aumento de permeabilidade capilar, broncoconstrição e prurido — ou seja, a urticária, o angioedema, a queda de pressão e o broncoespasmo da anafilaxia. Mas ela é degradada em 1 a 2 minutos pela diamina oxidase e pela histamina-N-metiltransferase. Quando o paciente chega ao pronto-socorro, a histamina já desapareceu, e é por isso que a triptase — com meia-vida de 2 horas — é o exame usado para confirmar degranulação, e não a histamina.',
    aprofundar: [
      'A dosagem urinária do metabólito N-metil-histamina em urina de 24 horas contorna o problema cinético e é útil em duas situações: investigação de mastocitose sistêmica, ao lado da triptase basal, e investigação de síndromes de flushing recorrente sem diagnóstico. Nesse contexto o exame compõe painel com ácido 5-hidroxindolacético e cromogranina A para separar mastocitose de tumor neuroendócrino.',
      'A intolerância à histamina — deficiência de diamina oxidase intestinal — é uma entidade diferente e frequentemente confundida com alergia alimentar. Os sintomas surgem após alimentos ricos em histamina (queijos curados, vinho, peixe mal conservado, embutidos), não envolvem IgE, e os testes alérgicos são negativos. Reconhecer a diferença evita painéis alérgicos repetidos e sem resposta.',
    ],
    fisiologia: {
      oQueE: 'Amina biogênica derivada da histidina, armazenada nos grânulos de mastócitos e basófilos.',
      origem: 'Mastócitos teciduais, basófilos e células enterocromafins gástricas.',
      sintese: 'Descarboxilação da histidina pela histidina-descarboxilase.',
      funcao: 'Vasodilatação, aumento de permeabilidade vascular, broncoconstrição, prurido e estímulo à secreção ácida gástrica.',
      metabolismo: 'Degradada pela diamina oxidase (via intestinal) e pela histamina-N-metiltransferase, gerando N-metil-histamina.',
      meiaVida: '1 a 2 minutos no plasma.',
      percurso: [
        'Degranulação mastocitária',
        'histamina liberada no interstício',
        'ligação a receptores H1 e H2',
        'vasodilatação, permeabilidade e broncoconstrição',
        'degradação em minutos a N-metil-histamina',
        'excreção urinária do metabólito',
      ],
    },
    aumento: {
      resumo: 'Degranulação mastocitária, massa mastocitária expandida ou déficit de degradação intestinal.',
      mecanismos: [
        {
          titulo: 'Liberação aguda pelos mastócitos e basófilos',
          explicacao: 'A ponte de IgE ou a ativação direta do mastócito liberam histamina pré-formada em segundos.',
          exemplos: [
            { causa: 'Anafilaxia', etapas: ['degranulação sistêmica', 'histamina plasmática ↑↑ em 5 a 15 minutos', 'já indetectável em 30 a 60 minutos'], nota: 'A janela é tão estreita que o exame raramente é praticável — use triptase.' },
          ],
        },
        {
          titulo: 'Produção crônica aumentada',
          explicacao: 'Massa mastocitária expandida libera histamina continuamente, elevando o metabólito urinário de 24 horas mesmo fora de crise.',
          exemplos: [
            { causa: 'Mastocitose sistêmica', etapas: ['infiltração mastocitária de medula e tecidos', 'liberação basal contínua de histamina', 'N-metil-histamina urinária ↑ com triptase basal ↑'] },
            { causa: 'Intolerância à histamina por deficiência de diamina oxidase', etapas: ['degradação intestinal insuficiente', 'absorção de histamina alimentar', 'sintomas após queijos curados, vinho e embutidos', 'testes alérgicos negativos'], nota: 'Não é alergia: não há IgE envolvida e o painel de alérgenos permanece negativo.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A investigação do flushing recorrente', ids: ['triptase', 'acido-5-hidroxiindolacetico', 'cromogranina-a'], leitura: 'Mastocitose eleva triptase e metil-histamina; tumor carcinoide eleva 5-HIAA e cromogranina A. O painel conjunto separa os dois.' },
    ],
    interferentes: {
      preAnalitico: ['A amostra plasmática precisa ir imediatamente ao gelo e ser centrifugada a frio; qualquer demora libera histamina dos basófilos e produz falso aumento.'],
      fisiologico: ['Dieta rica em histamina (queijos curados, vinho tinto, embutidos, peixes escombrídeos) nos dias anteriores eleva o metabólito urinário — a restrição dietética antes da coleta é obrigatória.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['triptase', 'ige-total'],
  },

  {
    id: 'c1-inibidor',
    nome: 'Inibidor de C1-esterase (quantitativo e funcional)',
    sigla: 'C1-INH',
    sinonimos: ['c1 inibidor', 'c1-inh', 'inibidor de c1 esterase', 'c1 esterase'],
    grupo: 'alergologia',
    sistemas: ['imunologico'],
    material: 'Soro (quantitativo) e plasma citratado (funcional)',
    unidade: 'mg/dL e % de atividade',
    referencias: [
      { rotulo: 'C1-INH quantitativo', minimo: 21, maximo: 39, unidade: 'mg/dL' },
      { rotulo: 'C1-INH funcional', minimo: 70, maximo: 130, unidade: '%' },
      { rotulo: 'C4', minimo: 10, maximo: 40, unidade: 'mg/dL', observacao: 'C4 baixo entre as crises é o achado de triagem mais sensível do angioedema hereditário.' },
    ],
    resumo:
      'A proteína que freia simultaneamente o complemento e o sistema de contato. Sua falta produz angioedema sem urticária e sem prurido — que não responde a anti-histamínico, corticoide nem adrenalina.',
    entenda:
      'O C1-inibidor bloqueia a C1-esterase, o fator XIIa e a calicreína. Quando falta, a calicreína cliva o cininogênio de alto peso e libera bradicinina em excesso — e a bradicinina é um vasodilatador potente que causa edema profundo de derme, submucosa e vísceras. O quadro resultante é característico e distinto da alergia: edema assimétrico de face, lábios, mãos ou genitais, sem urticária, sem prurido, com dor abdominal em cólica quando acomete a alça intestinal, evoluindo em horas e durando dias.',
    aprofundar: [
      'A distinção clínica com o angioedema histaminérgico define a conduta e pode salvar a vida. O angioedema por bradicinina não melhora com adrenalina, anti-histamínico ou corticoide — insistir nesses fármacos enquanto o edema de laringe progride é a sequência que mata. O tratamento é reposição de C1-inibidor, icatibanto ou plasma fresco na indisponibilidade dos anteriores.',
      'A triagem é feita pelo C4, que permanece baixo mesmo entre as crises porque o consumo é contínuo. É um exame barato e amplamente disponível: C4 normal em paciente assintomático torna o angioedema hereditário improvável. C4 baixo obriga a dosar C1-INH quantitativo e funcional.',
      'Os três tipos importam. No tipo 1 (85% dos casos), o C1-INH é baixo em quantidade e em função. No tipo 2, a quantidade é normal ou alta e a função é baixa — a proteína existe mas não funciona, e é por isso que **o teste funcional é obrigatório**: dosar apenas o quantitativo perde um em cada sete pacientes. O tipo 3, associado a mutações do fator XII, cursa com C1-INH e C4 normais, é dependente de estrogênio e predomina em mulheres.',
      'A forma adquirida ocorre em doenças linfoproliferativas e gamopatias monoclonais, por consumo ou por autoanticorpo. A pista laboratorial que a separa da hereditária é o C1q: baixo na adquirida, normal na hereditária. Angioedema que começa após os 40 anos deve levar a essa pesquisa e à investigação de doença linfoproliferativa subjacente.',
      'Uma armadilha frequente: os inibidores da ECA causam angioedema pelo mesmo mediador — a ECA degrada bradicinina, e bloqueá-la a acumula. Nesse caso todos os exames de complemento são normais, e o diagnóstico é a suspensão do fármaco. O angioedema por IECA pode surgir anos após o início do medicamento, o que faz muita gente descartar a hipótese indevidamente.',
    ],
    fisiologia: {
      oQueE: 'Serpina plasmática que inibe C1r, C1s, o fator XIIa, a calicreína plasmática e a plasmina.',
      origem: 'Hepatócito.',
      funcao: 'Impedir a ativação espontânea da via clássica do complemento e conter o sistema de contato, limitando a geração de bradicinina.',
      orgaosEnvolvidos: ['Fígado', 'Endotélio'],
      percurso: [
        'C1-INH insuficiente ou disfuncional',
        'calicreína e fator XIIa sem freio',
        'clivagem do cininogênio de alto peso molecular',
        'bradicinina ↑↑',
        'receptor B2 no endotélio',
        'extravasamento e angioedema profundo sem urticária',
      ],
    },
    aumento: {
      resumo: 'Sem significado clínico — o C1-INH é reagente de fase aguda e sobe discretamente na inflamação.',
      mecanismos: [
        {
          titulo: 'Resposta de fase aguda',
          explicacao: 'A síntese hepática aumenta modestamente em estados inflamatórios, sem repercussão clínica.',
          exemplos: [
            { causa: 'Inflamação sistêmica', etapas: ['estímulo hepático de fase aguda', 'C1-INH discretamente ↑', 'sem consequência clínica'], nota: 'Atenção: no tipo 2 o valor quantitativo pode vir alto e mascarar a doença — só o funcional revela.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Angioedema hereditário ou adquirido — a bradicinina sem freio.',
      significado: 'C1-INH funcional abaixo de 50% com C4 baixo estabelece o diagnóstico de angioedema hereditário na presença de história compatível.',
      mecanismos: [
        {
          titulo: 'Deficiência hereditária',
          explicacao: 'Mutações no gene SERPING1 reduzem a produção (tipo 1) ou geram proteína disfuncional (tipo 2), ambas com herança autossômica dominante.',
          exemplos: [
            { causa: 'Angioedema hereditário tipo 1', etapas: ['mutação com produção reduzida', 'C1-INH quantitativo e funcional ↓', 'C4 persistentemente ↓', 'crises de edema sem urticária desencadeadas por trauma, estresse ou procedimento dentário'] },
            { causa: 'Angioedema hereditário tipo 2', etapas: ['proteína produzida em quantidade normal mas disfuncional', 'C1-INH quantitativo normal ou alto', 'C1-INH funcional ↓', 'C4 ↓'], nota: 'Só o teste funcional faz o diagnóstico — pedir apenas o quantitativo perde este tipo.' },
          ],
        },
        {
          titulo: 'Deficiência adquirida',
          explicacao: 'Consumo aumentado por complexos imunes ou destruição por autoanticorpo, tipicamente no contexto de doença linfoproliferativa.',
          exemplos: [
            { causa: 'Angioedema adquirido por linfoproliferação ou gamopatia', etapas: ['consumo ou autoanticorpo anti-C1-INH', 'C1-INH ↓ com C4 ↓ e C1q ↓', 'início dos sintomas após os 40 anos'], nota: 'O C1q baixo é o que separa da forma hereditária e obriga a investigar doença de base.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A triagem e a diferenciação', ids: ['complemento-c3', 'c4'], leitura: 'C4 baixo persistente é o rastreio; C1q separa hereditário de adquirido; C3 costuma ser normal em ambos, o que ajuda a afastar consumo por via alternativa.' },
    ],
    advertencia:
      'Angioedema sem urticária que não responde a adrenalina, anti-histamínico e corticoide deve ser tratado como mediado por bradicinina até prova em contrário. O tratamento é específico e a demora pode ser fatal em edema de via aérea.',
    interferentes: {
      preAnalitico: ['O teste funcional é sensível ao processamento: plasma que demora a ser separado ou passa por ciclos de congelamento perde atividade e gera falso-positivo para deficiência.'],
      fisiologico: ['Estrogênio (gestação, contraceptivo) reduz o C1-INH e desencadeia crises — relevante no tipo 3, dependente de estrogênio.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['complemento-c3', 'c4'],
  },
]
