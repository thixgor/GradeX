import { TopicItem, SubtopicItem, ModuleItem } from './cronograma-types'

// Interface para submódulos
interface SubmoduleItem {
  id: string
  nome: string
  horasEstimadas?: number
}

// Estender ModuleItem para incluir submódulos
interface ModuleItemWithSubmodules extends ModuleItem {
  submodulos?: SubmoduleItem[]
}

// Estender SubtopicItem para incluir módulos com submódulos
interface SubtopicItemWithModules extends SubtopicItem {
  modulos: ModuleItemWithSubmodules[]
}

// Estender TopicItem para incluir subtópicos com módulos com submódulos
interface TopicItemWithModules extends TopicItem {
  subtopicos: SubtopicItemWithModules[]
}

export type BiomedicinaPeriodo = 1 | 2 | 3 | 4 | 5 | 6 | 7

export function getBiomedicinaTopicos(periodo: BiomedicinaPeriodo): TopicItemWithModules[] {
  const topicos: Record<number, TopicItemWithModules[]> = {
    // ═══════════════════════════════════════════════════════════
    // 1º PERÍODO
    // ═══════════════════════════════════════════════════════════
    1: [
      {
        id: 'bio-p1-biologia-celular',
        nome: 'Biologia Celular',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p1-estrutura-organizacao-celular',
            nome: 'Estrutura e Organização Celular',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-membrana-plasmatica',
                nome: 'Membrana plasmática',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-membrana-plasmatica-1', nome: 'Composição lipídica e proteica' },
                  { id: 'bio-p1-membrana-plasmatica-2', nome: 'Transporte ativo e passivo' },
                ],
              },
              {
                id: 'bio-p1-organelas-citoplasmaticas',
                nome: 'Organelas citoplasmáticas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-organelas-1', nome: 'Mitocôndria — estrutura e respiração celular' },
                  { id: 'bio-p1-organelas-2', nome: 'Retículo endoplasmático e complexo de Golgi' },
                ],
              },
            ],
          },
          {
            id: 'bio-p1-ciclo-divisao-celular',
            nome: 'Ciclo e Divisão Celular',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-mitose-meiose',
                nome: 'Mitose e meiose',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-mitose-meiose-1', nome: 'Fases da mitose (prófase ao citocinese)' },
                  { id: 'bio-p1-mitose-meiose-2', nome: 'Meiose I e II — diferenças e importância na reprodução' },
                ],
              },
              {
                id: 'bio-p1-controle-ciclo',
                nome: 'Controle do ciclo celular',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-controle-ciclo-1', nome: 'Checkpoints e ciclinas' },
                  { id: 'bio-p1-controle-ciclo-2', nome: 'Apoptose e morte celular programada' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p1-quimica-geral-organica',
        nome: 'Química Geral e Orgânica',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p1-quimica-geral',
            nome: 'Química Geral',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-ligacoes-quimicas',
                nome: 'Ligações químicas e estrutura molecular',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-ligacoes-1', nome: 'Ligações covalentes, iônicas e de hidrogênio' },
                  { id: 'bio-p1-ligacoes-2', nome: 'Polaridade e solubilidade' },
                ],
              },
              {
                id: 'bio-p1-equilibrio-acido-base',
                nome: 'Equilíbrio ácido-base',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-equilibrio-1', nome: 'pH, pKa e tampões biológicos' },
                  { id: 'bio-p1-equilibrio-2', nome: 'Importância do pH no sangue e tecidos' },
                ],
              },
            ],
          },
          {
            id: 'bio-p1-quimica-organica-aplicada',
            nome: 'Química Orgânica Aplicada à Biomedicina',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-grupos-funcionais',
                nome: 'Grupos funcionais e biomoléculas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-grupos-1', nome: 'Carboidratos, lipídeos e proteínas — estrutura química' },
                  { id: 'bio-p1-grupos-2', nome: 'Reações de oxidação, redução e hidrólise' },
                ],
              },
              {
                id: 'bio-p1-enzimas',
                nome: 'Enzimas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-enzimas-1', nome: 'Cinética enzimática (Michaelis-Menten)' },
                  { id: 'bio-p1-enzimas-2', nome: 'Inibição enzimática — competitiva e não competitiva' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p1-laboratorio-clinico',
        nome: 'Laboratório Clínico',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p1-fundamentos-laboratorio',
            nome: 'Fundamentos de Laboratório',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-biosseguranca',
                nome: 'Biossegurança',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-biosseguranca-1', nome: 'NRs aplicadas ao laboratório (NR-32)' },
                  { id: 'bio-p1-biosseguranca-2', nome: 'EPIs, EPCs e manejo de resíduos biológicos' },
                ],
              },
              {
                id: 'bio-p1-tecnicas-basicas',
                nome: 'Técnicas básicas de laboratório',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-tecnicas-1', nome: 'Vidraria, pipetagem e soluções' },
                  { id: 'bio-p1-tecnicas-2', nome: 'Centrifugação e espectrofotometria' },
                ],
              },
            ],
          },
          {
            id: 'bio-p1-coleta-processamento',
            nome: 'Coleta e Processamento de Amostras',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-tipos-amostras',
                nome: 'Tipos de amostras biológicas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-tipos-amostras-1', nome: 'Sangue — coleta por venopunção e punção capilar' },
                  { id: 'bio-p1-tipos-amostras-2', nome: 'Urina, fezes e secreções — técnicas de coleta' },
                ],
              },
              {
                id: 'bio-p1-pre-analitica',
                nome: 'Pré-analítica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-pre-analitica-1', nome: 'Interferentes pré-analíticos (jejum, hemólise, lipemia)' },
                  { id: 'bio-p1-pre-analitica-2', nome: 'Armazenamento e transporte de amostras' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p1-genetica',
        nome: 'Genética',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p1-genetica-classica-molecular',
            nome: 'Genética Clássica e Molecular',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-leis-mendel',
                nome: 'Leis de Mendel e herança',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-leis-mendel-1', nome: 'Dominância, recessividade e codominância' },
                  { id: 'bio-p1-leis-mendel-2', nome: 'Ligação ao X e herança mitocondrial' },
                ],
              },
              {
                id: 'bio-p1-estrutura-dna-rna',
                nome: 'Estrutura do DNA e RNA',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-dna-rna-1', nome: 'Replicação, transcrição e tradução' },
                  { id: 'bio-p1-dna-rna-2', nome: 'Código genético e mutações' },
                ],
              },
            ],
          },
          {
            id: 'bio-p1-genetica-humana-doencas',
            nome: 'Genética Humana e Doenças',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-cromossomos-cariotipagem',
                nome: 'Cromossomos e cariotipagem',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-cariotipagem-1', nome: 'Técnicas de cariotipagem (bandeamento GTG)' },
                  { id: 'bio-p1-cariotipagem-2', nome: 'Aneuploidias (Síndrome de Down, Turner, Klinefelter)' },
                ],
              },
              {
                id: 'bio-p1-doencas-geneticas',
                nome: 'Doenças genéticas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-doencas-geneticas-1', nome: 'Doenças autossômicas dominantes e recessivas' },
                  { id: 'bio-p1-doencas-geneticas-2', nome: 'Aconselhamento genético — princípios básicos' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p1-morfofisiologia-sistemas-i',
        nome: 'Morfofisiologia dos Sistemas I',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p1-sistema-cardiovascular',
            nome: 'Sistema Cardiovascular',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-anatomia-coracao',
                nome: 'Anatomia do coração e vasos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-anatomia-coracao-1', nome: 'Câmaras cardíacas, valvas e circulação' },
                  { id: 'bio-p1-anatomia-coracao-2', nome: 'Ciclo cardíaco e eletrocardiograma básico' },
                ],
              },
              {
                id: 'bio-p1-fisiologia-cardiovascular',
                nome: 'Fisiologia cardiovascular',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-fisio-cardio-1', nome: 'Débito cardíaco e pressão arterial' },
                  { id: 'bio-p1-fisio-cardio-2', nome: 'Regulação da pressão (SRAA e sistema nervoso autônomo)' },
                ],
              },
            ],
          },
          {
            id: 'bio-p1-sistema-respiratorio',
            nome: 'Sistema Respiratório',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-anatomia-vias-aereas',
                nome: 'Anatomia das vias aéreas e pulmões',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-vias-aereas-1', nome: 'Traqueia, brônquios e alvéolos — estrutura histológica' },
                  { id: 'bio-p1-vias-aereas-2', nome: 'Pleura e mediastino' },
                ],
              },
              {
                id: 'bio-p1-fisiologia-respiratoria',
                nome: 'Fisiologia respiratória',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-fisio-resp-1', nome: 'Mecânica respiratória e volumes pulmonares' },
                  { id: 'bio-p1-fisio-resp-2', nome: 'Troca gasosa e transporte de O₂ e CO₂' },
                ],
              },
            ],
          },
          {
            id: 'bio-p1-sistema-digestorio',
            nome: 'Sistema Digestório',
            incluido: false,
            modulos: [
              {
                id: 'bio-p1-anatomia-tubo-digestivo',
                nome: 'Anatomia do tubo digestivo',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-tubo-digestivo-1', nome: 'Esôfago, estômago, intestinos — organização histológica' },
                  { id: 'bio-p1-tubo-digestivo-2', nome: 'Fígado, pâncreas e vesícula biliar' },
                ],
              },
              {
                id: 'bio-p1-fisiologia-digestiva',
                nome: 'Fisiologia digestiva',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p1-fisio-digest-1', nome: 'Digestão enzimática e absorção de nutrientes' },
                  { id: 'bio-p1-fisio-digest-2', nome: 'Regulação hormonal da digestão (gastrina, secretina, CCK)' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 2º PERÍODO
    // ═══════════════════════════════════════════════════════════
    2: [
      {
        id: 'bio-p2-morfofisiologia-sistemas-ii',
        nome: 'Morfofisiologia dos Sistemas II',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p2-sistema-nervoso',
            nome: 'Sistema Nervoso',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-anatomia-snc',
                nome: 'Anatomia do sistema nervoso central',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-snc-1', nome: 'Encéfalo — lobos, cerebelo e tronco' },
                  { id: 'bio-p2-snc-2', nome: 'Medula espinhal — vias aferentes e eferentes' },
                ],
              },
              {
                id: 'bio-p2-fisiologia-neurologica',
                nome: 'Fisiologia neurológica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-fisio-neuro-1', nome: 'Potencial de ação e sinapse' },
                  { id: 'bio-p2-fisio-neuro-2', nome: 'Neurotransmissores e receptores' },
                ],
              },
            ],
          },
          {
            id: 'bio-p2-sistema-urinario',
            nome: 'Sistema Urinário',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-anatomia-renal',
                nome: 'Anatomia renal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-renal-1', nome: 'Néfron — estrutura e função' },
                  { id: 'bio-p2-renal-2', nome: 'Vascularização renal' },
                ],
              },
              {
                id: 'bio-p2-fisiologia-renal',
                nome: 'Fisiologia renal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-fisio-renal-1', nome: 'Filtração glomerular, reabsorção e secreção' },
                  { id: 'bio-p2-fisio-renal-2', nome: 'Regulação do equilíbrio hidroeletrolítico e ácido-base' },
                ],
              },
            ],
          },
          {
            id: 'bio-p2-sistema-endocrino',
            nome: 'Sistema Endócrino',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-glandulas-endocrinas',
                nome: 'Glândulas endócrinas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-glandulas-1', nome: 'Hipófise, tireoide, adrenal e pâncreas — hormônios e funções' },
                  { id: 'bio-p2-glandulas-2', nome: 'Feedback negativo e regulação hormonal' },
                ],
              },
              {
                id: 'bio-p2-fisiologia-endocrina',
                nome: 'Fisiologia endócrina',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-fisio-endo-1', nome: 'Eixo hipotálamo-hipófise-adrenal (HHA)' },
                  { id: 'bio-p2-fisio-endo-2', nome: 'Insulina, glucagon e homeostase glicêmica' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p2-microbiologia-imunologia',
        nome: 'Microbiologia e Imunologia',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p2-microbiologia-geral',
            nome: 'Microbiologia Geral',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-bacterias',
                nome: 'Bactérias',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-bacterias-1', nome: 'Estrutura bacteriana (parede, cápsula, flagelo)' },
                  { id: 'bio-p2-bacterias-2', nome: 'Coloração de Gram e classificação' },
                  { id: 'bio-p2-bacterias-3', nome: 'Mecanismos de resistência bacteriana' },
                ],
              },
              {
                id: 'bio-p2-virus-fungos',
                nome: 'Vírus e fungos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-virus-fungos-1', nome: 'Estrutura viral e ciclo replicativo' },
                  { id: 'bio-p2-virus-fungos-2', nome: 'Morfologia fúngica e dimorfismo' },
                ],
              },
            ],
          },
          {
            id: 'bio-p2-imunologia-basica',
            nome: 'Imunologia Básica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-imunidade-inata',
                nome: 'Imunidade inata',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-inata-1', nome: 'Barreiras físicas, células NK e fagócitos' },
                  { id: 'bio-p2-inata-2', nome: 'Sistema complemento' },
                ],
              },
              {
                id: 'bio-p2-imunidade-adaptativa',
                nome: 'Imunidade adaptativa',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-adaptativa-1', nome: 'Linfócitos T e B — ativação e diferenciação' },
                  { id: 'bio-p2-adaptativa-2', nome: 'Anticorpos — classes (IgG, IgM, IgA, IgE, IgD) e funções' },
                ],
              },
              {
                id: 'bio-p2-hipersensibilidade',
                nome: 'Hipersensibilidade e autoimunidade',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-hipersensibilidade-1', nome: 'Tipos I, II, III e IV de hipersensibilidade' },
                  { id: 'bio-p2-hipersensibilidade-2', nome: 'Doenças autoimunes — exemplos e mecanismos' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p2-bioquimica',
        nome: 'Bioquímica',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p2-metabolismo-carboidratos',
            nome: 'Metabolismo de Carboidratos',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-glicolise-gliconeogenese',
                nome: 'Glicólise e gliconeogênese',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-glicolise-1', nome: 'Enzimas-chave da glicólise' },
                  { id: 'bio-p2-glicolise-2', nome: 'Regulação e pontos de controle' },
                ],
              },
              {
                id: 'bio-p2-krebs-cadeia',
                nome: 'Ciclo de Krebs e cadeia respiratória',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-krebs-1', nome: 'Produção de ATP — rendimento energético' },
                  { id: 'bio-p2-krebs-2', nome: 'Fosforilação oxidativa e complexos mitocondriais' },
                ],
              },
            ],
          },
          {
            id: 'bio-p2-metabolismo-lipideos-proteinas',
            nome: 'Metabolismo de Lipídeos e Proteínas',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-beta-oxidacao',
                nome: 'Beta-oxidação de ácidos graxos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-beta-oxidacao-1', nome: 'Ativação, transporte (carnitina) e oxidação' },
                  { id: 'bio-p2-beta-oxidacao-2', nome: 'Corpos cetônicos — síntese e utilização' },
                ],
              },
              {
                id: 'bio-p2-metabolismo-proteico',
                nome: 'Metabolismo proteico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-proteico-1', nome: 'Transaminação e desaminação' },
                  { id: 'bio-p2-proteico-2', nome: 'Ciclo da ureia e hiperamonemia' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p2-psicologia-saude',
        nome: 'Psicologia em Saúde',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p2-relacao-profissional-paciente',
            nome: 'Relação Profissional-Paciente',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-comunicacao-saude',
                nome: 'Comunicação em saúde',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-comunicacao-1', nome: 'Comunicação de diagnósticos difíceis' },
                  { id: 'bio-p2-comunicacao-2', nome: 'Escuta ativa e empatia no contexto clínico' },
                ],
              },
              {
                id: 'bio-p2-adesao-tratamento',
                nome: 'Adesão ao tratamento',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-adesao-1', nome: 'Fatores psicológicos que interferem na adesão' },
                  { id: 'bio-p2-adesao-2', nome: 'Motivação e mudança de comportamento (modelo transteórico)' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p2-biologia-molecular-biotecnologia',
        nome: 'Biologia Molecular e Biotecnologia',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p2-tecnicas-biologia-molecular',
            nome: 'Técnicas de Biologia Molecular',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-pcr-variantes',
                nome: 'PCR e suas variantes',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-pcr-1', nome: 'PCR convencional, RT-PCR e PCR em tempo real' },
                  { id: 'bio-p2-pcr-2', nome: 'Aplicações diagnósticas (COVID-19, HIV, hepatites)' },
                ],
              },
              {
                id: 'bio-p2-eletroforese-sequenciamento',
                nome: 'Eletroforese e sequenciamento',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-eletroforese-1', nome: 'Eletroforese em gel de agarose e poliacrilamida' },
                  { id: 'bio-p2-eletroforese-2', nome: 'Sequenciamento de Sanger e next-generation sequencing (NGS)' },
                ],
              },
            ],
          },
          {
            id: 'bio-p2-biotecnologia-aplicada',
            nome: 'Biotecnologia Aplicada',
            incluido: false,
            modulos: [
              {
                id: 'bio-p2-engenharia-genetica',
                nome: 'Engenharia genética',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-engenharia-1', nome: 'Clonagem molecular e vetores de expressão' },
                  { id: 'bio-p2-engenharia-2', nome: 'CRISPR-Cas9 — mecanismo e aplicações' },
                ],
              },
              {
                id: 'bio-p2-biofarmacos',
                nome: 'Produção de biofármacos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p2-biofarmacos-1', nome: 'Anticorpos monoclonais — produção e uso terapêutico' },
                  { id: 'bio-p2-biofarmacos-2', nome: 'Vacinas recombinantes e de mRNA' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 3º PERÍODO
    // ═══════════════════════════════════════════════════════════
    3: [
      {
        id: 'bio-p3-imaginologia',
        nome: 'Imaginologia',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p3-metodos-imagem',
            nome: 'Métodos de Imagem',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-radiografia-tomografia',
                nome: 'Radiografia e tomografia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-radio-tomo-1', nome: 'Princípios físicos dos raios X' },
                  { id: 'bio-p3-radio-tomo-2', nome: 'TC — cortes axiais, coronais e sagitais' },
                ],
              },
              {
                id: 'bio-p3-rm-ultrassonografia',
                nome: 'Ressonância magnética e ultrassonografia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-rm-us-1', nome: 'Princípio do sinal de RM — T1, T2 e densidade de prótons' },
                  { id: 'bio-p3-rm-us-2', nome: 'Ultrassonografia — modos B, M e Doppler' },
                ],
              },
            ],
          },
          {
            id: 'bio-p3-interpretacao-imagens',
            nome: 'Interpretação de Imagens',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-alteracoes-patologicas',
                nome: 'Alterações patológicas em imagem',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-alteracoes-1', nome: 'Nódulos, massas, calcificações e infiltrados' },
                  { id: 'bio-p3-alteracoes-2', nome: 'Imagens em doenças respiratórias, abdominais e neurológicas' },
                ],
              },
              {
                id: 'bio-p3-medicina-nuclear',
                nome: 'Medicina nuclear',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-med-nuclear-1', nome: 'PET-CT — princípio e indicações' },
                  { id: 'bio-p3-med-nuclear-2', nome: 'Cintilografia e marcadores radioativos' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p3-parasitologia',
        nome: 'Parasitologia',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p3-protozoarios',
            nome: 'Protozoários de Importância Médica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-protozoarios-intestinais',
                nome: 'Protozoários intestinais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-proto-intest-1', nome: 'Entamoeba histolytica — ciclo, diagnóstico e amebíase' },
                  { id: 'bio-p3-proto-intest-2', nome: 'Giardia lamblia — formas clínicas e diagnóstico' },
                ],
              },
              {
                id: 'bio-p3-protozoarios-sanguineos',
                nome: 'Protozoários sanguíneos e teciduais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-proto-sang-1', nome: 'Plasmodium spp. — ciclo e diagnóstico da malária' },
                  { id: 'bio-p3-proto-sang-2', nome: 'Trypanosoma cruzi — doença de Chagas, diagnóstico e epidemiologia' },
                ],
              },
            ],
          },
          {
            id: 'bio-p3-helmintos-ectoparasitos',
            nome: 'Helmintos e Ectoparasitos',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-nematelmintos',
                nome: 'Nematelmintos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-nematelmintos-1', nome: 'Ascaris, Trichuris e Enterobius — diagnóstico laboratorial' },
                  { id: 'bio-p3-nematelmintos-2', nome: 'Ancilostomídeos e Strongyloides stercoralis' },
                ],
              },
              {
                id: 'bio-p3-platelmintos-ecto',
                nome: 'Platelmintos e ectoparasitos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-platelmintos-1', nome: 'Schistosoma mansoni — ciclo e diagnóstico' },
                  { id: 'bio-p3-platelmintos-2', nome: 'Pediculose e escabiose — diagnóstico e controle' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p3-saude-coletiva-epidemiologia',
        nome: 'Saúde Coletiva e Epidemiologia',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p3-epidemiologia-basica',
            nome: 'Epidemiologia Básica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-medidas-epidemiologicas',
                nome: 'Medidas epidemiológicas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-medidas-1', nome: 'Incidência, prevalência, mortalidade e letalidade' },
                  { id: 'bio-p3-medidas-2', nome: 'Sensibilidade, especificidade e valor preditivo' },
                ],
              },
              {
                id: 'bio-p3-estudos-epidemiologicos',
                nome: 'Estudos epidemiológicos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-estudos-1', nome: 'Coorte, caso-controle e transversal' },
                  { id: 'bio-p3-estudos-2', nome: 'Risco relativo e odds ratio' },
                ],
              },
            ],
          },
          {
            id: 'bio-p3-vigilancia-saude',
            nome: 'Vigilância em Saúde',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-doencas-notificacao',
                nome: 'Doenças de notificação compulsória',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-notificacao-1', nome: 'SINAN e fluxo de notificação' },
                  { id: 'bio-p3-notificacao-2', nome: 'Surtos e epidemias — investigação' },
                ],
              },
              {
                id: 'bio-p3-saude-publica-brasil',
                nome: 'Saúde pública no Brasil',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-saude-publica-1', nome: 'SUS — princípios e estrutura' },
                  { id: 'bio-p3-saude-publica-2', nome: 'Indicadores de saúde da população brasileira' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p3-farmacologia-geral',
        nome: 'Farmacologia Geral',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p3-farmacocinetica-farmacodinamica',
            nome: 'Farmacocinética e Farmacodinâmica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-farmacocinetica',
                nome: 'Farmacocinética',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-farmacocinetica-1', nome: 'ADME — absorção, distribuição, metabolismo e excreção' },
                  { id: 'bio-p3-farmacocinetica-2', nome: 'Meia-vida, volume de distribuição e clearance' },
                ],
              },
              {
                id: 'bio-p3-farmacodinamica',
                nome: 'Farmacodinâmica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-farmacodinamica-1', nome: 'Receptores farmacológicos — agonistas e antagonistas' },
                  { id: 'bio-p3-farmacodinamica-2', nome: 'Dose-resposta, potência e eficácia' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p3-patologia-geral',
        nome: 'Patologia Geral',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p3-lesao-morte-celular',
            nome: 'Lesão e Morte Celular',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-adaptacoes-celulares',
                nome: 'Adaptações celulares',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-adaptacoes-1', nome: 'Hipertrofia, hiperplasia, atrofia e metaplasia' },
                  { id: 'bio-p3-adaptacoes-2', nome: 'Displasia e neoplasia — diferenças' },
                ],
              },
              {
                id: 'bio-p3-necrose-apoptose',
                nome: 'Necrose e apoptose',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-necrose-1', nome: 'Tipos de necrose (coagulativa, liquefativa, caseosa, gordurosa)' },
                  { id: 'bio-p3-necrose-2', nome: 'Apoptose — vias intrínseca e extrínseca' },
                ],
              },
            ],
          },
          {
            id: 'bio-p3-inflamacao-reparo',
            nome: 'Inflamação e Reparo',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-inflamacao-aguda',
                nome: 'Inflamação aguda',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-inflamacao-aguda-1', nome: 'Vasodilatação, exsudação e migração leucocitária' },
                  { id: 'bio-p3-inflamacao-aguda-2', nome: 'Mediadores químicos (histamina, prostaglandinas, IL-1, TNF)' },
                ],
              },
              {
                id: 'bio-p3-inflamacao-cronica',
                nome: 'Inflamação crônica e reparo',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-inflamacao-cronica-1', nome: 'Granuloma — exemplos (tuberculose, sarcoidose)' },
                  { id: 'bio-p3-inflamacao-cronica-2', nome: 'Cicatrização primária e secundária' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p3-integracao-metabolica',
        nome: 'Integração Metabólica',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p3-integracao-macronutrientes',
            nome: 'Integração dos Macronutrientes',
            incluido: false,
            modulos: [
              {
                id: 'bio-p3-estado-alimentado-jejum',
                nome: 'Metabolismo no estado alimentado e jejum',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-alimentado-jejum-1', nome: 'Fluxo metabólico no período pós-prandial' },
                  { id: 'bio-p3-alimentado-jejum-2', nome: 'Adaptações metabólicas no jejum prolongado e cetose' },
                ],
              },
              {
                id: 'bio-p3-disturbios-metabolicos',
                nome: 'Distúrbios metabólicos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p3-disturbios-1', nome: 'Diabetes mellitus tipo 1 e 2 — fisiopatologia metabólica' },
                  { id: 'bio-p3-disturbios-2', nome: 'Obesidade e síndrome metabólica — bases bioquímicas' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 4º PERÍODO
    // ═══════════════════════════════════════════════════════════
    4: [
      {
        id: 'bio-p4-doencas-parasitarias-virais',
        nome: 'Manejo Clínico e Laboratorial de Doenças Parasitárias e Virais',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p4-diagnostico-parasitoses',
            nome: 'Diagnóstico Laboratorial de Parasitoses',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-epf',
                nome: 'Exame parasitológico de fezes (EPF)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-epf-1', nome: 'Métodos de Hoffman, Ritchie e Baermann-Moraes' },
                  { id: 'bio-p4-epf-2', nome: 'Leitura e interpretação de lâminas' },
                ],
              },
              {
                id: 'bio-p4-sorologia-parasitoses',
                nome: 'Diagnóstico sorológico de parasitoses',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-sorologia-parasit-1', nome: 'ELISA e hemaglutinação indireta para toxoplasmose e chagas' },
                  { id: 'bio-p4-sorologia-parasit-2', nome: 'Gota espessa e esfregaço para malária' },
                ],
              },
            ],
          },
          {
            id: 'bio-p4-diagnostico-infeccoes-virais',
            nome: 'Diagnóstico Laboratorial de Infecções Virais',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-sorologia-viral',
                nome: 'Sorologia viral',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-sorologia-viral-1', nome: 'Diagnóstico das hepatites B e C (HBsAg, anti-HBs, anti-HCV)' },
                  { id: 'bio-p4-sorologia-viral-2', nome: 'HIV — testes de triagem (ELISA) e confirmatórios (Western Blot)' },
                ],
              },
              {
                id: 'bio-p4-biologia-molecular-viral',
                nome: 'Biologia molecular nas infecções virais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-biomol-viral-1', nome: 'Carga viral — HIV, HCV e HBV' },
                  { id: 'bio-p4-biomol-viral-2', nome: 'Genotipagem viral e resistência antirretroviral' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p4-bromatologia',
        nome: 'Bromatologia',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p4-analise-alimentos',
            nome: 'Análise de Alimentos',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-composicao-centesimal',
                nome: 'Composição centesimal dos alimentos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-composicao-1', nome: 'Determinação de umidade, cinzas, proteínas e lipídeos' },
                  { id: 'bio-p4-composicao-2', nome: 'Métodos de Kjeldahl e Soxhlet' },
                ],
              },
              {
                id: 'bio-p4-contaminantes-alimentares',
                nome: 'Contaminantes alimentares',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-contaminantes-1', nome: 'Contaminantes químicos (pesticidas, metais pesados)' },
                  { id: 'bio-p4-contaminantes-2', nome: 'Micotoxinas — aflatoxinas e ocratoxinas' },
                ],
              },
            ],
          },
          {
            id: 'bio-p4-microbiologia-alimentos',
            nome: 'Microbiologia de Alimentos',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-microrganismos-alimentos',
                nome: 'Microrganismos em alimentos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-microrganismos-1', nome: 'Salmonella, Listeria e E. coli O157:H7 — diagnóstico' },
                  { id: 'bio-p4-microrganismos-2', nome: 'Contagem de coliformes totais e termotolerantes' },
                ],
              },
              {
                id: 'bio-p4-seguranca-alimentar',
                nome: 'Segurança alimentar',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-seguranca-1', nome: 'HACCP — pontos críticos de controle' },
                  { id: 'bio-p4-seguranca-2', nome: 'Rotulagem nutricional e legislação vigente (RDC 429)' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p4-liquidos-corporais',
        nome: 'Líquidos Corporais',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p4-urinalise',
            nome: 'Urinálise',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-equ',
                nome: 'Exame físico e químico da urina (EQU)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-equ-1', nome: 'Cor, aspecto, densidade e pH' },
                  { id: 'bio-p4-equ-2', nome: 'Proteínas, glicose, cetonas, bilirrubina e urobilinogênio' },
                ],
              },
              {
                id: 'bio-p4-sedimentoscopia',
                nome: 'Sedimentoscopia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-sedimentoscopia-1', nome: 'Cilindros, células e cristais urinários' },
                  { id: 'bio-p4-sedimentoscopia-2', nome: 'Bactérias e leveduras na urina — urocultura' },
                ],
              },
            ],
          },
          {
            id: 'bio-p4-outros-liquidos',
            nome: 'Outros Líquidos Corporais',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-lcr',
                nome: 'Líquido cefalorraquidiano (LCR)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-lcr-1', nome: 'Coleta por punção lombar e análise citoquímica' },
                  { id: 'bio-p4-lcr-2', nome: 'Padrões de LCR nas meningites bacteriana, viral e fúngica' },
                ],
              },
              {
                id: 'bio-p4-liquidos-pleurais',
                nome: 'Líquidos pleurais, peritoneais e sinoviais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-liquidos-pleurais-1', nome: 'Transudato x exsudato — critérios de Light' },
                  { id: 'bio-p4-liquidos-pleurais-2', nome: 'Análise citológica e bioquímica' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p4-etica-bioetica',
        nome: 'Ética e Bioética em Saúde',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p4-fundamentos-bioetica',
            nome: 'Fundamentos de Bioética',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-principios-bioeticos',
                nome: 'Princípios bioéticos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-principios-1', nome: 'Autonomia, beneficência, não maleficência e justiça (Beauchamp e Childress)' },
                  { id: 'bio-p4-principios-2', nome: 'Consentimento informado e autonomia do paciente' },
                ],
              },
              {
                id: 'bio-p4-dilemas-bioeticos',
                nome: 'Dilemas bioéticos contemporâneos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-dilemas-1', nome: 'Eutanásia, distanásia e ortotanásia' },
                  { id: 'bio-p4-dilemas-2', nome: 'Pesquisa com seres humanos — Resolução 466/2012' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p4-reproducao-humana',
        nome: 'Reprodução Humana Assistida',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p4-fundamentos-reproducao',
            nome: 'Fundamentos da Reprodução Humana',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-fisiologia-reprodutiva',
                nome: 'Fisiologia reprodutiva',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-fisio-reprod-1', nome: 'Ciclo menstrual — fases folicular, ovulatória e lútea' },
                  { id: 'bio-p4-fisio-reprod-2', nome: 'Espermatogênese e função do espermatozoide' },
                ],
              },
              {
                id: 'bio-p4-infertilidade',
                nome: 'Infertilidade — diagnóstico laboratorial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-infertilidade-1', nome: 'Espermograma — parâmetros (OMS 2021)' },
                  { id: 'bio-p4-infertilidade-2', nome: 'Avaliação hormonal da reserva ovariana (AMH, FSH, LH)' },
                ],
              },
            ],
          },
          {
            id: 'bio-p4-tecnicas-reproducao',
            nome: 'Técnicas de Reprodução Assistida',
            incluido: false,
            modulos: [
              {
                id: 'bio-p4-fiv-icsi',
                nome: 'Fertilização in vitro (FIV) e ICSI',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-fiv-icsi-1', nome: 'Estimulação ovariana controlada e monitoramento' },
                  { id: 'bio-p4-fiv-icsi-2', nome: 'Punção folicular, fecundação e cultura embrionária' },
                ],
              },
              {
                id: 'bio-p4-pgt',
                nome: 'Diagnóstico genético pré-implantacional (PGT)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p4-pgt-1', nome: 'PGT-A, PGT-M e PGT-SR — indicações' },
                  { id: 'bio-p4-pgt-2', nome: 'Biópsia embrionária e análise cromossômica (NGS)' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 5º PERÍODO
    // ═══════════════════════════════════════════════════════════
    5: [
      {
        id: 'bio-p5-doencas-bacterianas-fungicas',
        nome: 'Manejo Clínico e Laboratorial de Doenças Bacterianas e Fúngicas',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p5-bacteriologia-clinica',
            nome: 'Bacteriologia Clínica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p5-culturas-bacterianas',
                nome: 'Culturas bacterianas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-culturas-1', nome: 'Meios de cultura (ágar sangue, chocolate, MacConkey, CLED)' },
                  { id: 'bio-p5-culturas-2', nome: 'Identificação por MALDI-TOF e provas bioquímicas' },
                ],
              },
              {
                id: 'bio-p5-antibiograma',
                nome: 'Antibiograma',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-antibiograma-1', nome: 'Disco-difusão (Kirby-Bauer) e CIM' },
                  { id: 'bio-p5-antibiograma-2', nome: 'Interpretação de perfis de resistência (ESKAPE)' },
                ],
              },
            ],
          },
          {
            id: 'bio-p5-micologia-clinica',
            nome: 'Micologia Clínica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p5-micoses-superficiais',
                nome: 'Micoses superficiais e cutâneas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-micoses-sup-1', nome: 'Dermatófitos — KOH, cultura em Sabouraud e lâmpada de Wood' },
                  { id: 'bio-p5-micoses-sup-2', nome: 'Candida spp. — diagnóstico em mucosas e sangue' },
                ],
              },
              {
                id: 'bio-p5-micoses-sistemicas',
                nome: 'Micoses sistêmicas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-micoses-sist-1', nome: 'Histoplasma, Cryptococcus e Paracoccidioides' },
                  { id: 'bio-p5-micoses-sist-2', nome: 'Antígenos e anticorpos fúngicos — diagnóstico sorológico' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p5-hematologia-banco-sangue',
        nome: 'Hematologia e Banco de Sangue',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p5-hematologia-clinica',
            nome: 'Hematologia Clínica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p5-hemograma',
                nome: 'Hemograma completo',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-hemograma-1', nome: 'Série vermelha — eritrograma e índices hematimétricos (VCM, HCM, CHCM)' },
                  { id: 'bio-p5-hemograma-2', nome: 'Série branca — leucograma e fórmula leucocitária' },
                  { id: 'bio-p5-hemograma-3', nome: 'Plaquetas — contagem e morfologia' },
                ],
              },
              {
                id: 'bio-p5-anemias',
                nome: 'Anemias — diagnóstico laboratorial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-anemias-1', nome: 'Anemia ferropriva, megaloblástica e hemolítica — diferenciação laboratorial' },
                  { id: 'bio-p5-anemias-2', nome: 'Hemoglobinopatias — eletroforese de hemoglobina (falciforme, talassemia)' },
                ],
              },
            ],
          },
          {
            id: 'bio-p5-hemostasia-coagulacao',
            nome: 'Hemostasia e Coagulação',
            incluido: false,
            modulos: [
              {
                id: 'bio-p5-coagulacao',
                nome: 'Coagulação sanguínea',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-coagulacao-1', nome: 'Via extrínseca (TP/INR) e intrínseca (TTPA)' },
                  { id: 'bio-p5-coagulacao-2', nome: 'Fibrinogênio, D-dímero e CIVD' },
                ],
              },
              {
                id: 'bio-p5-banco-sangue',
                nome: 'Banco de sangue',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-banco-sangue-1', nome: 'Tipagem ABO e Rh — técnicas e interpretação' },
                  { id: 'bio-p5-banco-sangue-2', nome: 'Prova cruzada e reações transfusionais' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p5-citologia-hormonal-oncotica',
        nome: 'Citologia Hormonal e Oncótica',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p5-citologia-trato-genital',
            nome: 'Citologia do Trato Genital Feminino',
            incluido: false,
            modulos: [
              {
                id: 'bio-p5-papanicolaou',
                nome: 'Papanicolaou',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-papanicolaou-1', nome: 'Coleta e preparo do material — fixação e coloração' },
                  { id: 'bio-p5-papanicolaou-2', nome: 'Sistema Bethesda — classificação das lesões (ASCUS, LSIL, HSIL)' },
                ],
              },
              {
                id: 'bio-p5-citologia-hormonal',
                nome: 'Citologia hormonal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-cito-hormonal-1', nome: 'Índice cariopicnótico e maturação do epitélio vaginal' },
                  { id: 'bio-p5-cito-hormonal-2', nome: 'Interpretação hormonal em diferentes fases da vida (menarca, menacme, menopausa)' },
                ],
              },
            ],
          },
          {
            id: 'bio-p5-citologia-outros-sitios',
            nome: 'Citologia Oncótica de Outros Sítios',
            incluido: false,
            modulos: [
              {
                id: 'bio-p5-citologia-escarro',
                nome: 'Citologia de escarro e LBA',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-escarro-1', nome: 'Células inflamatórias e células neoplásicas em trato respiratório' },
                  { id: 'bio-p5-escarro-2', nome: 'Diagnóstico citológico de carcinomas pulmonares' },
                ],
              },
              {
                id: 'bio-p5-citologia-liquidos',
                nome: 'Citologia de líquidos corporais e punções',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-citologia-liquidos-1', nome: 'PAAF de tireoide — sistema Bethesda tireoidiano' },
                  { id: 'bio-p5-citologia-liquidos-2', nome: 'Líquidos pleurais e ascíticos — avaliação citológica de malignidade' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p5-pics',
        nome: 'Práticas Integrativas e Complementares em Saúde',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p5-pics-sus',
            nome: 'PICS no SUS',
            incluido: false,
            modulos: [
              {
                id: 'bio-p5-praticas-regulamentadas',
                nome: 'Principais práticas regulamentadas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-praticas-1', nome: 'Acupuntura, fitoterapia e homeopatia — bases e evidências' },
                  { id: 'bio-p5-praticas-2', nome: 'Política Nacional de PICS (PNPICS) — Portaria 971/2006 atualizada' },
                ],
              },
              {
                id: 'bio-p5-evidencias-pics',
                nome: 'Evidências científicas em PICS',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p5-evidencias-1', nome: 'Revisões Cochrane sobre acupuntura e fitoterapia' },
                  { id: 'bio-p5-evidencias-2', nome: 'Interações entre plantas medicinais e medicamentos' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 6º PERÍODO
    // ═══════════════════════════════════════════════════════════
    6: [
      {
        id: 'bio-p6-disturbios-endocrinos-metabolicos',
        nome: 'Manejo Clínico e Laboratorial de Distúrbios Endócrinos e Metabólicos',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p6-doencas-tireoide-adrenal',
            nome: 'Doenças da Tireoide e Adrenal',
            incluido: false,
            modulos: [
              {
                id: 'bio-p6-diagnostico-tireoide',
                nome: 'Diagnóstico laboratorial da tireoide',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-tireoide-1', nome: 'TSH, T3, T4 livre — interpretação em hipotireoidismo e hipertireoidismo' },
                  { id: 'bio-p6-tireoide-2', nome: 'Anticorpos tireóideos (anti-TPO, anti-Tg, TRAb)' },
                ],
              },
              {
                id: 'bio-p6-funcao-adrenal',
                nome: 'Função adrenal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-adrenal-1', nome: 'Cortisol — ritmo circadiano e testes de supressão (dexametasona)' },
                  { id: 'bio-p6-adrenal-2', nome: 'Síndrome de Cushing e Insuficiência Adrenal — diagnóstico diferencial' },
                ],
              },
            ],
          },
          {
            id: 'bio-p6-diabetes-sindrome-metabolica',
            nome: 'Diabetes e Síndrome Metabólica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p6-diagnostico-diabetes',
                nome: 'Diagnóstico laboratorial do diabetes',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-diabetes-1', nome: 'Glicemia em jejum, TOTG, hemoglobina glicada (HbA1c)' },
                  { id: 'bio-p6-diabetes-2', nome: 'Insulina e peptídeo C — interpretação' },
                ],
              },
              {
                id: 'bio-p6-perfil-lipidico',
                nome: 'Perfil lipídico e síndrome metabólica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-lipidico-1', nome: 'Colesterol total, LDL, HDL e triglicérides — cálculo de Friedewald' },
                  { id: 'bio-p6-lipidico-2', nome: 'Critérios diagnósticos da síndrome metabólica (IDF/NCEP)' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p6-desordens-imunohematologicas',
        nome: 'Manejo Clínico e Laboratorial de Desordens Imunohematológicas',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p6-doencas-autoimunes-hematologicas',
            nome: 'Doenças Autoimunes Hematológicas',
            incluido: false,
            modulos: [
              {
                id: 'bio-p6-anemias-hemoliticas',
                nome: 'Anemias hemolíticas autoimunes',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-ahai-1', nome: 'Teste de Coombs direto e indireto' },
                  { id: 'bio-p6-ahai-2', nome: 'AHAI por anticorpos quentes e frios' },
                ],
              },
              {
                id: 'bio-p6-trombocitopenias',
                nome: 'Trombocitopenias imunes',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-trombocitopenias-1', nome: 'PTI — diagnóstico laboratorial e diferencial' },
                  { id: 'bio-p6-trombocitopenias-2', nome: 'PTT e SHU — ADAMTS13 e critérios diagnósticos' },
                ],
              },
            ],
          },
          {
            id: 'bio-p6-imunodeficiencias-autoimunes',
            nome: 'Imunodeficiências e Doenças Autoimunes Sistêmicas',
            incluido: false,
            modulos: [
              {
                id: 'bio-p6-lupus-conjuntivo',
                nome: 'Lúpus e doenças do tecido conjuntivo',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-lupus-1', nome: 'FAN — padrões de imunofluorescência e anticorpos específicos (anti-dsDNA, anti-Sm)' },
                  { id: 'bio-p6-lupus-2', nome: 'Artrite reumatoide — FR e anti-CCP' },
                ],
              },
              {
                id: 'bio-p6-imunodeficiencias',
                nome: 'Imunodeficiências primárias e secundárias',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-imunodef-1', nome: 'Imunofenotipagem por citometria de fluxo' },
                  { id: 'bio-p6-imunodef-2', nome: 'Dosagem de imunoglobulinas e subclasses' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p6-cosmetologia-estetica',
        nome: 'Cosmetologia e Estética',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p6-pele-fisiologia',
            nome: 'Pele e Fisiologia Cutânea',
            incluido: false,
            modulos: [
              {
                id: 'bio-p6-estrutura-pele',
                nome: 'Estrutura da pele',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-pele-1', nome: 'Epiderme, derme e hipoderme — composição celular' },
                  { id: 'bio-p6-pele-2', nome: 'Melanogênese e fototipo de Fitzpatrick' },
                ],
              },
              {
                id: 'bio-p6-envelhecimento',
                nome: 'Envelhecimento cutâneo',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-envelhec-1', nome: 'Envelhecimento intrínseco e extrínseco (fotoenvelhecimento)' },
                  { id: 'bio-p6-envelhec-2', nome: 'Colágeno, elastina e ácido hialurônico — degradação e reposição' },
                ],
              },
            ],
          },
          {
            id: 'bio-p6-cosmeticos-ativos',
            nome: 'Cosméticos e Ativos',
            incluido: false,
            modulos: [
              {
                id: 'bio-p6-formulacoes',
                nome: 'Formulações cosméticas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-formulacoes-1', nome: 'Emulsões, géis, séruns e pós — tecnologia de formulação' },
                  { id: 'bio-p6-formulacoes-2', nome: 'Ativos dermocosméticos (vitamina C, retinol, AHAs, niacinamida)' },
                ],
              },
              {
                id: 'bio-p6-procedimentos-esteticos',
                nome: 'Procedimentos estéticos com base biomédica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-procedimentos-1', nome: 'Toxina botulínica e preenchedores — mecanismo e aplicação' },
                  { id: 'bio-p6-procedimentos-2', nome: 'Peelings químicos — classificação e profundidade' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'bio-p6-analises-toxicologicas-forenses',
        nome: 'Análises Toxicológicas e Forenses',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p6-toxicologia-analitica',
            nome: 'Toxicologia Analítica',
            incluido: false,
            modulos: [
              {
                id: 'bio-p6-tecnicas-deteccao',
                nome: 'Técnicas de detecção de substâncias',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-deteccao-1', nome: 'Imunoensaios (ELISA, CLIA) para triagem toxicológica' },
                  { id: 'bio-p6-deteccao-2', nome: 'Cromatografia (HPLC, CG-EM) para confirmação' },
                ],
              },
              {
                id: 'bio-p6-drogas-abuso',
                nome: 'Toxicologia de drogas de abuso',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-drogas-1', nome: 'Janelas de detecção — urina, sangue, cabelo e saliva' },
                  { id: 'bio-p6-drogas-2', nome: 'Canabinoides, cocaína, anfetaminas e opioides — metabolismo' },
                ],
              },
            ],
          },
          {
            id: 'bio-p6-toxicologia-forense',
            nome: 'Toxicologia Forense',
            incluido: false,
            modulos: [
              {
                id: 'bio-p6-analise-post-mortem',
                nome: 'Análise post-mortem',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-post-mortem-1', nome: 'Coleta de amostras forenses — cadeia de custódia' },
                  { id: 'bio-p6-post-mortem-2', nome: 'Intoxicação por etanol — dosagem e interpretação forense' },
                ],
              },
              {
                id: 'bio-p6-toxicologia-ocupacional',
                nome: 'Toxicologia ocupacional e ambiental',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p6-ocupacional-1', nome: 'Metais pesados — chumbo, mercúrio e arsênio — biomarcadores' },
                  { id: 'bio-p6-ocupacional-2', nome: 'Monitoramento biológico de trabalhadores expostos (IBMP e VR)' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 7º PERÍODO
    // ═══════════════════════════════════════════════════════════
    7: [
      {
        id: 'bio-p7-gestao-qualidade-laboratorial',
        nome: 'Gestão e Controle de Qualidade Laboratorial',
        incluido: false,
        subtopicos: [
          {
            id: 'bio-p7-gestao-qualidade',
            nome: 'Gestão da Qualidade em Laboratório',
            incluido: false,
            modulos: [
              {
                id: 'bio-p7-normas-acreditacao',
                nome: 'Normas e acreditação',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p7-normas-1', nome: 'ISO 15189 — requisitos para laboratórios clínicos' },
                  { id: 'bio-p7-normas-2', nome: 'PALC e ONA — sistemas de acreditação no Brasil' },
                ],
              },
              {
                id: 'bio-p7-ciq',
                nome: 'Controle interno da qualidade (CIQ)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p7-ciq-1', nome: 'Cartas de Levey-Jennings e regras de Westgard' },
                  { id: 'bio-p7-ciq-2', nome: 'Materiais de controle — como escolher e interpretar' },
                ],
              },
            ],
          },
          {
            id: 'bio-p7-gestao-laboratorial',
            nome: 'Gestão Laboratorial',
            incluido: false,
            modulos: [
              {
                id: 'bio-p7-indicadores-qualidade',
                nome: 'Indicadores de qualidade',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p7-indicadores-1', nome: 'Indicadores pré-analíticos, analíticos e pós-analíticos' },
                  { id: 'bio-p7-indicadores-2', nome: 'Taxa de rejeição de amostras e tempo de resposta (TAT)' },
                ],
              },
              {
                id: 'bio-p7-biosseguranca-gestao-riscos',
                nome: 'Biossegurança e gestão de riscos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'bio-p7-biosseguranca-1', nome: 'Gerenciamento de resíduos de serviços de saúde (PGRSS)' },
                  { id: 'bio-p7-biosseguranca-2', nome: 'Plano de contingência e gestão de incidentes laboratoriais' },
                ],
              },
            ],
          },
        ],
      },
    ],
  }

  return topicos[periodo] || []
}
