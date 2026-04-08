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

export type OdontologiaPeriodo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export function getOdontologiaTopicos(periodo: OdontologiaPeriodo): TopicItemWithModules[] {
  const topicos: Record<number, TopicItemWithModules[]> = {
    // ═══════════════════════════════════════════════════════════
    // 1º PERÍODO
    // ═══════════════════════════════════════════════════════════
    1: [
      {
        id: 'odo-p1-biologia-celular',
        nome: 'Biologia Celular',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p1-estrutura-funcao-celular',
            nome: 'Estrutura e Função Celular',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-organelas-compartimentos',
                nome: 'Organelas e compartimentos celulares',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-organelas-1', nome: 'Núcleo, mitocôndria e retículo endoplasmático' },
                  { id: 'odo-p1-organelas-2', nome: 'Complexo de Golgi e lisossomos' },
                ],
              },
              {
                id: 'odo-p1-ciclo-divisao-celular',
                nome: 'Ciclo e divisão celular',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-ciclo-1', nome: 'Fases da mitose e meiose' },
                  { id: 'odo-p1-ciclo-2', nome: 'Checkpoints e apoptose' },
                ],
              },
            ],
          },
          {
            id: 'odo-p1-comunicacao-sinalizacao',
            nome: 'Comunicação e Sinalização Celular',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-receptores-vias',
                nome: 'Receptores e vias de sinalização',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-receptores-1', nome: 'Receptores de membrana — tirosina quinase e GPCRs' },
                  { id: 'odo-p1-receptores-2', nome: 'Segundos mensageiros (AMPc, IP3, Ca²⁺)' },
                ],
              },
              {
                id: 'odo-p1-transporte-membrana',
                nome: 'Transporte de membrana',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-transporte-1', nome: 'Difusão simples, facilitada e osmose' },
                  { id: 'odo-p1-transporte-2', nome: 'Transporte ativo — bomba Na⁺/K⁺ ATPase' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p1-microbiologia-imunologia',
        nome: 'Microbiologia e Imunologia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p1-microbiologia-oral',
            nome: 'Microbiologia Oral',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-microbiota-cavidade-bucal',
                nome: 'Microbiota da cavidade bucal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-microbiota-1', nome: 'Biofilme dental — formação e composição' },
                  { id: 'odo-p1-microbiota-2', nome: 'Streptococcus mutans, Porphyromonas gingivalis e Lactobacillus' },
                ],
              },
              {
                id: 'odo-p1-mecanismos-virulencia',
                nome: 'Mecanismos de virulência bacteriana',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-virulencia-1', nome: 'Adesinas, enzimas e toxinas bacterianas' },
                  { id: 'odo-p1-virulencia-2', nome: 'Resistência bacteriana e antibioticoterapia em odontologia' },
                ],
              },
            ],
          },
          {
            id: 'odo-p1-imunologia-aplicada',
            nome: 'Imunologia Aplicada à Odontologia',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-imunidade-inata-adaptativa',
                nome: 'Imunidade inata e adaptativa na cavidade oral',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-imunidade-1', nome: 'Saliva — lisozima, IgA secretora e defensinas' },
                  { id: 'odo-p1-imunidade-2', nome: 'Linfócitos T e B na resposta periodontal' },
                ],
              },
              {
                id: 'odo-p1-hipersensibilidade',
                nome: 'Hipersensibilidade e reações alérgicas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-hipersensibilidade-1', nome: 'Alergia ao látex e materiais dentários' },
                  { id: 'odo-p1-hipersensibilidade-2', nome: 'Hipersensibilidade tipo I e IV na clínica odontológica' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p1-morfofisiologia-sistemas-i',
        nome: 'Morfofisiologia dos Sistemas I',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p1-cardiovascular-respiratorio',
            nome: 'Sistema Cardiovascular e Respiratório',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-anatomia-fisiologia-cardiovascular',
                nome: 'Anatomia e fisiologia cardiovascular',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-cardiovascular-1', nome: 'Ciclo cardíaco, débito cardíaco e pressão arterial' },
                  { id: 'odo-p1-cardiovascular-2', nome: 'Regulação da pressão — SRAA e SNA' },
                ],
              },
              {
                id: 'odo-p1-fisiologia-respiratoria',
                nome: 'Fisiologia respiratória',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-respiratoria-1', nome: 'Mecânica respiratória e volumes pulmonares' },
                  { id: 'odo-p1-respiratoria-2', nome: 'Troca gasosa e transporte de O₂ e CO₂' },
                ],
              },
            ],
          },
          {
            id: 'odo-p1-nervoso-endocrino',
            nome: 'Sistema Nervoso e Endócrino',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-neuroanatomia-funcional',
                nome: 'Neuroanatomia funcional',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-neuroanatomia-1', nome: 'Nervos cranianos — origem, trajeto e função' },
                  { id: 'odo-p1-neuroanatomia-2', nome: 'Sistema nervoso autônomo — simpático e parassimpático' },
                ],
              },
              {
                id: 'odo-p1-fisiologia-endocrina',
                nome: 'Fisiologia endócrina básica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-endocrina-1', nome: 'Eixo hipotálamo-hipófise e feedback hormonal' },
                  { id: 'odo-p1-endocrina-2', nome: 'Insulina, glucagon e cortisol — relevância clínica' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p1-etica-bioetica',
        nome: 'Ética e Bioética',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p1-fundamentos-eticos',
            nome: 'Fundamentos Éticos em Odontologia',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-codigo-etica',
                nome: 'Código de Ética Odontológica (CEO)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-codigo-etica-1', nome: 'Direitos e deveres do cirurgião-dentista' },
                  { id: 'odo-p1-codigo-etica-2', nome: 'Sigilo profissional e prontuário odontológico' },
                ],
              },
              {
                id: 'odo-p1-bioetica-clinica',
                nome: 'Bioética clínica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-bioetica-1', nome: 'Princípios de Beauchamp e Childress aplicados à odontologia' },
                  { id: 'odo-p1-bioetica-2', nome: 'Autonomia do paciente e consentimento informado' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p1-saude-coletiva-epidemiologia',
        nome: 'Saúde Coletiva e Epidemiologia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p1-epidemiologia-saude-bucal',
            nome: 'Epidemiologia em Saúde Bucal',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-indices-epidemiologicos',
                nome: 'Índices epidemiológicos em odontologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-indices-1', nome: 'CPOD e ceos — cálculo e interpretação' },
                  { id: 'odo-p1-indices-2', nome: 'Índice de placa (IP) e índice gengival (IG)' },
                ],
              },
              {
                id: 'odo-p1-determinantes-sociais',
                nome: 'Determinantes sociais da saúde bucal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-determinantes-1', nome: 'Fluorose, cárie e doença periodontal — prevalência no Brasil' },
                  { id: 'odo-p1-determinantes-2', nome: 'Levantamentos epidemiológicos nacionais (SB Brasil)' },
                ],
              },
            ],
          },
          {
            id: 'odo-p1-promocao-saude-bucal',
            nome: 'Promoção de Saúde Bucal',
            incluido: false,
            modulos: [
              {
                id: 'odo-p1-estrategias-prevencao',
                nome: 'Estratégias de prevenção coletiva',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-prevencao-1', nome: 'Fluoretação da água e de dentifrícios' },
                  { id: 'odo-p1-prevencao-2', nome: 'Educação em saúde bucal — técnicas e abordagens' },
                ],
              },
              {
                id: 'odo-p1-vigilancia-saude-bucal',
                nome: 'Vigilância em saúde bucal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p1-vigilancia-1', nome: 'Indicadores de saúde bucal no SUS' },
                  { id: 'odo-p1-vigilancia-2', nome: 'Programa Brasil Sorridente' },
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
        id: 'odo-p2-anatomia-cabeca-pescoco-embriologia',
        nome: 'Anatomia de Cabeça e Pescoço e Embriologia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p2-anatomia-cabeca',
            nome: 'Anatomia da Cabeça',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-ossos-cranio-face',
                nome: 'Ossos do crânio e da face',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-ossos-1', nome: 'Maxila e mandíbula — estrutura, acidentes anatômicos e referências clínicas' },
                  { id: 'odo-p2-ossos-2', nome: 'Articulação temporomandibular (ATM) — componentes e movimentos' },
                ],
              },
              {
                id: 'odo-p2-musculos-mastigacao',
                nome: 'Músculos da mastigação e expressão facial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-musculos-1', nome: 'Masseter, temporal, pterigóideos — origem, inserção e ação' },
                  { id: 'odo-p2-musculos-2', nome: 'Inervação motora — nervo facial (VII par)' },
                ],
              },
            ],
          },
          {
            id: 'odo-p2-nervos-vasos',
            nome: 'Nervos e Vasos da Cabeça e Pescoço',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-nervo-trigemeo',
                nome: 'Nervo trigêmeo (V par) — ramos odontológicos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-trigemeo-1', nome: 'Nervo alveolar inferior, lingual e bucal — trajeto e bloqueio anestésico' },
                  { id: 'odo-p2-trigemeo-2', nome: 'Nervo palatino maior, nasopalatino e infraorbitário' },
                ],
              },
              {
                id: 'odo-p2-vascularizacao',
                nome: 'Vascularização da face e cavidade oral',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-vascularizacao-1', nome: 'Artéria carótida externa e seus ramos' },
                  { id: 'odo-p2-vascularizacao-2', nome: 'Drenagem linfática — relevância no diagnóstico de infecções e neoplasias' },
                ],
              },
            ],
          },
          {
            id: 'odo-p2-embriologia-craniofacial',
            nome: 'Embriologia Craniofacial',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-desenvolvimento-face-palato',
                nome: 'Desenvolvimento da face e palato',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-desenvolvimento-1', nome: 'Processos faciais — fusão e fissuras labiopalatinas' },
                  { id: 'odo-p2-desenvolvimento-2', nome: 'Desenvolvimento dos arcos faríngeos' },
                ],
              },
              {
                id: 'odo-p2-odontogenese',
                nome: 'Odontogênese',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-odontogenese-1', nome: 'Fases do desenvolvimento dentário (lâmina, broto, capuz, sino)' },
                  { id: 'odo-p2-odontogenese-2', nome: 'Amelogênese e dentinogênese — distúrbios clínicos' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p2-patologia-geral',
        nome: 'Patologia Geral',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p2-lesao-morte-celular',
            nome: 'Lesão e Morte Celular',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-adaptacoes-celulares',
                nome: 'Adaptações celulares',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-adaptacoes-1', nome: 'Hipertrofia, hiperplasia, atrofia e metaplasia' },
                  { id: 'odo-p2-adaptacoes-2', nome: 'Displasia e carcinogênese' },
                ],
              },
              {
                id: 'odo-p2-necrose-inflamacao',
                nome: 'Necrose e inflamação',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-necrose-1', nome: 'Tipos de necrose (coagulativa, liquefativa, caseosa)' },
                  { id: 'odo-p2-necrose-2', nome: 'Mediadores inflamatórios e processo de reparo' },
                ],
              },
            ],
          },
          {
            id: 'odo-p2-patologia-oral-basica',
            nome: 'Patologia Oral Básica',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-lesoes-reativas',
                nome: 'Lesões reativas e inflamatórias da mucosa bucal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-lesoes-reativas-1', nome: 'Fibroma, hiperplasia fibrosa e épulis' },
                  { id: 'odo-p2-lesoes-reativas-2', nome: 'Mucocele, rânula e cisto de retenção' },
                ],
              },
              {
                id: 'odo-p2-neoplasias',
                nome: 'Neoplasias de interesse odontológico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-neoplasias-1', nome: 'Carcinoma de células escamosas (CCE) oral — características' },
                  { id: 'odo-p2-neoplasias-2', nome: 'Ameloblastoma e tumor odontogênico ceratocístico' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p2-materiais-odontologicos',
        nome: 'Materiais Odontológicos',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p2-materiais-restauradores',
            nome: 'Materiais Restauradores',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-resinas-compostas',
                nome: 'Resinas compostas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-resinas-1', nome: 'Composição (matriz orgânica, carga e agente de união)' },
                  { id: 'odo-p2-resinas-2', nome: 'Contração de polimerização e estratégias para reduzi-la' },
                ],
              },
              {
                id: 'odo-p2-amalgama',
                nome: 'Amálgama dentário',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-amalgama-1', nome: 'Composição, manipulação e propriedades mecânicas' },
                  { id: 'odo-p2-amalgama-2', nome: 'Indicações, contraindicações e aspectos toxicológicos' },
                ],
              },
            ],
          },
          {
            id: 'odo-p2-materiais-moldagem-cimentacao',
            nome: 'Materiais de Moldagem e Cimentação',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-materiais-moldagem',
                nome: 'Materiais de moldagem',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-moldagem-1', nome: 'Alginato — proporção, manipulação e cuidados' },
                  { id: 'odo-p2-moldagem-2', nome: 'Elastômeros (poliéter, silicone de adição e condensação)' },
                ],
              },
              {
                id: 'odo-p2-cimentos',
                nome: 'Cimentos odontológicos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-cimentos-1', nome: 'Cimento de ionômero de vidro (CIV) — convencional e modificado por resina' },
                  { id: 'odo-p2-cimentos-2', nome: 'Cimentos resinosos — indicações em prótese e ortodontia' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p2-anatomia-escultura-dentaria',
        nome: 'Anatomia e Escultura Dentária',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p2-morfologia-dentaria',
            nome: 'Morfologia Dentária',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-dentes-anteriores',
                nome: 'Dentes anteriores permanentes',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-anteriores-1', nome: 'Incisivos centrais e laterais superiores e inferiores — anatomia' },
                  { id: 'odo-p2-anteriores-2', nome: 'Caninos superiores e inferiores — características morfológicas' },
                ],
              },
              {
                id: 'odo-p2-dentes-posteriores',
                nome: 'Dentes posteriores permanentes',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-posteriores-1', nome: 'Pré-molares — variações radiculares e cuspídeas' },
                  { id: 'odo-p2-posteriores-2', nome: 'Molares superiores e inferiores — anatomia coronária e radicular' },
                ],
              },
            ],
          },
          {
            id: 'odo-p2-oclusao-articulacao',
            nome: 'Oclusão e Articulação Dentária',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-oclusao-normal',
                nome: 'Conceitos de oclusão normal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-oclusao-1', nome: 'Classe I, II e III de Angle' },
                  { id: 'odo-p2-oclusao-2', nome: 'Guia anterior, guia canina e função em grupo' },
                ],
              },
              {
                id: 'odo-p2-contatos-oclusais',
                nome: 'Contatos oclusais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-contatos-1', nome: 'Pontos de contato em MIH (máxima intercuspidação habitual)' },
                  { id: 'odo-p2-contatos-2', nome: 'Interferências oclusais e ajuste oclusal' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p2-farmacologia-geral',
        nome: 'Farmacologia Geral',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p2-farmacocinetica-farmacodinamica',
            nome: 'Farmacocinética e Farmacodinâmica',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-farmacocinetica',
                nome: 'Farmacocinética aplicada à odontologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-farmacocinetica-1', nome: 'ADME — absorção, distribuição, metabolismo e excreção' },
                  { id: 'odo-p2-farmacocinetica-2', nome: 'Meia-vida e ajuste de dose em populações especiais' },
                ],
              },
              {
                id: 'odo-p2-farmacodinamica',
                nome: 'Farmacodinâmica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-farmacodinamica-1', nome: 'Receptores, agonistas e antagonistas' },
                  { id: 'odo-p2-farmacodinamica-2', nome: 'Dose-resposta, potência e índice terapêutico' },
                ],
              },
            ],
          },
          {
            id: 'odo-p2-classes-farmacologicas',
            nome: 'Principais Classes Farmacológicas em Odontologia',
            incluido: false,
            modulos: [
              {
                id: 'odo-p2-anti-inflamatorios-analgesicos',
                nome: 'Anti-inflamatórios e analgésicos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-aines-1', nome: 'AINEs — mecanismo de ação, indicações e efeitos adversos' },
                  { id: 'odo-p2-aines-2', nome: 'Paracetamol e dipirona — uso racional em odontologia' },
                ],
              },
              {
                id: 'odo-p2-antimicrobianos',
                nome: 'Antimicrobianos em odontologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p2-antimicrobianos-1', nome: 'Amoxicilina, azitromicina e metronidazol — quando e como prescrever' },
                  { id: 'odo-p2-antimicrobianos-2', nome: 'Resistência bacteriana e uso racional de antibióticos' },
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
        id: 'odo-p3-periodontia',
        nome: 'Periodontia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p3-tecidos-periodontais',
            nome: 'Tecidos Periodontais',
            incluido: false,
            modulos: [
              {
                id: 'odo-p3-anatomia-periodonto',
                nome: 'Anatomia do periodonto de proteção e suporte',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-anatomia-periodonto-1', nome: 'Gengiva — gengiva livre, inserida e papilar' },
                  { id: 'odo-p3-anatomia-periodonto-2', nome: 'Ligamento periodontal, cemento e osso alveolar' },
                ],
              },
              {
                id: 'odo-p3-histologia-periodontal',
                nome: 'Histologia periodontal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-histologia-1', nome: 'Fibras periodontais — grupos e funções' },
                  { id: 'odo-p3-histologia-2', nome: 'Junção cemento-esmalte (JCE) e sulco gengival' },
                ],
              },
            ],
          },
          {
            id: 'odo-p3-doenca-periodontal',
            nome: 'Doença Periodontal',
            incluido: false,
            modulos: [
              {
                id: 'odo-p3-gengivite',
                nome: 'Gengivite',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-gengivite-1', nome: 'Gengivite induzida por biofilme — critérios diagnósticos' },
                  { id: 'odo-p3-gengivite-2', nome: 'Gengivites modificadas por fatores sistêmicos (gravidez, diabetes)' },
                ],
              },
              {
                id: 'odo-p3-periodontite',
                nome: 'Periodontite',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-periodontite-1', nome: 'Nova classificação (2017) — estadiamento e gradação' },
                  { id: 'odo-p3-periodontite-2', nome: 'Bolsa periodontal, perda de inserção clínica e nível ósseo radiográfico' },
                ],
              },
            ],
          },
          {
            id: 'odo-p3-tratamento-periodontal-basico',
            nome: 'Tratamento Periodontal Básico',
            incluido: false,
            modulos: [
              {
                id: 'odo-p3-raspagem-alisamento',
                nome: 'Raspagem e alisamento radicular (RAR)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-raspagem-1', nome: 'Instrumentos manuais (curetas Gracey) e ultrassônicos' },
                  { id: 'odo-p3-raspagem-2', nome: 'Protocolo de raspagem por quadrante e full-mouth' },
                ],
              },
              {
                id: 'odo-p3-manutencao-periodontal',
                nome: 'Manutenção periodontal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-manutencao-1', nome: 'Terapia periodontal de suporte (TPS) — intervalos e parâmetros' },
                  { id: 'odo-p3-manutencao-2', nome: 'Controle de placa supervisionado e motivação' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p3-semiologia-estomatologia',
        nome: 'Semiologia e Estomatologia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p3-semiologia-oral',
            nome: 'Semiologia Oral',
            incluido: false,
            modulos: [
              {
                id: 'odo-p3-anamnese-exame-clinico',
                nome: 'Anamnese e exame clínico em odontologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-anamnese-1', nome: 'Histórico médico e odontológico — perguntas essenciais' },
                  { id: 'odo-p3-anamnese-2', nome: 'Exame extrabucal — linfonodos, ATM e glândulas salivares' },
                ],
              },
              {
                id: 'odo-p3-exame-intrabucal',
                nome: 'Exame intrabucal sistematizado',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-intrabucal-1', nome: 'Mucosa jugal, palato, língua, assoalho e rebordo — sequência' },
                  { id: 'odo-p3-intrabucal-2', nome: 'Descrição semiológica de lesões — cor, forma, superfície, consistência' },
                ],
              },
            ],
          },
          {
            id: 'odo-p3-lesoes-fundamentais',
            nome: 'Lesões Fundamentais da Mucosa Oral',
            incluido: false,
            modulos: [
              {
                id: 'odo-p3-lesoes-brancas',
                nome: 'Lesões brancas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-brancas-1', nome: 'Leucoplasia, eritroplasia e líquen plano oral' },
                  { id: 'odo-p3-brancas-2', nome: 'Candidíase oral — formas clínicas e diagnóstico diferencial' },
                ],
              },
              {
                id: 'odo-p3-lesoes-ulceradas',
                nome: 'Lesões ulceradas e vesiculobolhosas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-ulceradas-1', nome: 'Aftas — classificação e manejo' },
                  { id: 'odo-p3-ulceradas-2', nome: 'Herpes simples oral — primária e recorrente' },
                  { id: 'odo-p3-ulceradas-3', nome: 'Pênfigo vulgar e penfigoide — características clínicas' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p3-sistema-unico-saude',
        nome: 'Sistema Único de Saúde',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p3-organizacao-sus',
            nome: 'Organização do SUS',
            incluido: false,
            modulos: [
              {
                id: 'odo-p3-principios-diretrizes',
                nome: 'Princípios e diretrizes do SUS',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-principios-1', nome: 'Universalidade, integralidade e equidade' },
                  { id: 'odo-p3-principios-2', nome: 'Descentralização, regionalização e hierarquização' },
                ],
              },
              {
                id: 'odo-p3-redes-atencao',
                nome: 'Redes de Atenção à Saúde (RAS)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-redes-1', nome: 'Atenção Primária como ordenadora da rede' },
                  { id: 'odo-p3-redes-2', nome: 'Centro de Especialidades Odontológicas (CEO) e LRPD' },
                ],
              },
            ],
          },
          {
            id: 'odo-p3-saude-bucal-sus',
            nome: 'Saúde Bucal no SUS',
            incluido: false,
            modulos: [
              {
                id: 'odo-p3-politica-nacional',
                nome: 'Política Nacional de Saúde Bucal (PNSB)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-pnsb-1', nome: 'Brasil Sorridente — objetivos, metas e resultados' },
                  { id: 'odo-p3-pnsb-2', nome: 'Equipe de Saúde Bucal na ESF — composição e atribuições' },
                ],
              },
              {
                id: 'odo-p3-atencao-coletiva',
                nome: 'Atenção em saúde bucal coletiva',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p3-coletiva-1', nome: 'Escovação supervisionada e aplicação tópica de flúor' },
                  { id: 'odo-p3-coletiva-2', nome: 'Triagem e referenciamento de casos complexos' },
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
        id: 'odo-p4-clinica-cariologia',
        nome: 'Clínica de Cariologia e Adequação do Meio Bucal',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p4-cariologia',
            nome: 'Cariologia',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-etiologia-progressao',
                nome: 'Etiologia e progressão da cárie',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-etiologia-1', nome: 'Tríade de Keyes — hospedeiro, microbiota e substrato' },
                  { id: 'odo-p4-etiologia-2', nome: 'Ciclo de des-remineralização e papel do flúor' },
                ],
              },
              {
                id: 'odo-p4-diagnostico-carie',
                nome: 'Diagnóstico da cárie',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-diagnostico-1', nome: 'Critérios ICDAS — estadiamento das lesões' },
                  { id: 'odo-p4-diagnostico-2', nome: 'Radiografia interproximal — cárie em esmalte, dentina e cemento' },
                ],
              },
            ],
          },
          {
            id: 'odo-p4-adequacao-meio-bucal',
            nome: 'Adequação do Meio Bucal',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-controle-atividade-carie',
                nome: 'Controle da atividade de cárie',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-controle-1', nome: 'Selantes de fóssulas e fissuras — indicação e técnica' },
                  { id: 'odo-p4-controle-2', nome: 'Cariostáticos — diamino fluoreto de prata (DFS) e verniz fluoretado' },
                ],
              },
              {
                id: 'odo-p4-dieta-carie',
                nome: 'Dieta e cárie',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-dieta-1', nome: 'Açúcares fermentáveis e frequência de consumo' },
                  { id: 'odo-p4-dieta-2', nome: 'Orientação dietética como prevenção primária' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p4-oclusao-dtm',
        nome: 'Oclusão e Disfunção Temporomandibular',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p4-oclusao-funcional',
            nome: 'Oclusão Funcional',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-relacao-centrica',
                nome: 'Conceitos de oclusão em relação cêntrica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-centrica-1', nome: 'Relação cêntrica x MIH — diferenças e importância clínica' },
                  { id: 'odo-p4-centrica-2', nome: 'Movimentos mandibulares — protrusão, lateralidade e abertura' },
                ],
              },
              {
                id: 'odo-p4-analise-oclusal',
                nome: 'Análise oclusal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-analise-1', nome: 'Articuladores — semiajustável e totalmente ajustável' },
                  { id: 'odo-p4-analise-2', nome: 'Registros oclusais — cera, silicone e papel articular' },
                ],
              },
            ],
          },
          {
            id: 'odo-p4-dtm',
            nome: 'Disfunção Temporomandibular (DTM)',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-diagnostico-dtm',
                nome: 'Diagnóstico da DTM',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-dtm-diagnostico-1', nome: 'Critérios diagnósticos DC/TMD — eixo I e eixo II' },
                  { id: 'odo-p4-dtm-diagnostico-2', nome: 'Exame da ATM — palpação, sons e limitação de abertura' },
                ],
              },
              {
                id: 'odo-p4-tratamento-dtm',
                nome: 'Tratamento da DTM',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-dtm-tratamento-1', nome: 'Placa miorrelaxante — confecção e ajuste' },
                  { id: 'odo-p4-dtm-tratamento-2', nome: 'Fisioterapia, farmacoterapia e abordagem multidisciplinar' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p4-dentistica',
        nome: 'Dentística',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p4-restauracoes-diretas',
            nome: 'Restaurações Diretas',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-preparo-cavitario',
                nome: 'Preparo cavitário',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-preparo-1', nome: 'Classificação de Black das cavidades' },
                  { id: 'odo-p4-preparo-2', nome: 'Princípios de preparo — extensão preventiva x mínima intervenção' },
                ],
              },
              {
                id: 'odo-p4-tecnica-resina',
                nome: 'Técnica restauradora com resina composta',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-tecnica-1', nome: 'Sistema adesivo — condicionamento ácido, primer e adesivo' },
                  { id: 'odo-p4-tecnica-2', nome: 'Técnica incremental — estratégias de polimerização' },
                ],
              },
            ],
          },
          {
            id: 'odo-p4-estetica-dentistica',
            nome: 'Estética em Dentística',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-clareamento',
                nome: 'Clareamento dental',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-clareamento-1', nome: 'Clareamento de consultório (H₂O₂ 35-38%) — protocolo' },
                  { id: 'odo-p4-clareamento-2', nome: 'Clareamento caseiro (peróxido de carbamida 10-22%) — moldeira e uso' },
                ],
              },
              {
                id: 'odo-p4-facetas-diretas',
                nome: 'Facetas diretas em resina',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-facetas-1', nome: 'Seleção de cor e caracterização' },
                  { id: 'odo-p4-facetas-2', nome: 'Preparo dental e técnica de estratificação' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p4-protese-removivel',
        nome: 'Prótese Removível',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p4-protese-total',
            nome: 'Prótese Total',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-planejamento-edentulo',
                nome: 'Planejamento e exame do paciente edêntulo',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-edentulo-1', nome: 'Rebordo alveolar — classificação de Atwood' },
                  { id: 'odo-p4-edentulo-2', nome: 'Relações intermaxilares — dimensão vertical de oclusão (DVO)' },
                ],
              },
              {
                id: 'odo-p4-confeccao-protese-total',
                nome: 'Confecção da prótese total',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-confeccao-1', nome: 'Moldagem funcional — moldeira individual e pasta zinco-enólica' },
                  { id: 'odo-p4-confeccao-2', nome: 'Montagem de dentes artificiais — esquema oclusal balanceado bilateral' },
                ],
              },
            ],
          },
          {
            id: 'odo-p4-ppr',
            nome: 'Prótese Parcial Removível (PPR)',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-planejamento-ppr',
                nome: 'Planejamento da PPR',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-ppr-planejamento-1', nome: 'Classificação de Kennedy — classes e modificações' },
                  { id: 'odo-p4-ppr-planejamento-2', nome: 'Componentes da PPR — grampos, apoios, conectores e selas' },
                ],
              },
              {
                id: 'odo-p4-ajuste-ppr',
                nome: 'Ajuste e instalação da PPR',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-ppr-ajuste-1', nome: 'Verificação de oclusão e estabilidade' },
                  { id: 'odo-p4-ppr-ajuste-2', nome: 'Instruções de higiene e manutenção ao paciente' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p4-anestesiologia-terapeutica',
        nome: 'Anestesiologia e Terapêutica Medicamentosa',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p4-anestesia-local',
            nome: 'Anestesia Local em Odontologia',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-anestesicos-locais',
                nome: 'Anestésicos locais — farmacologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-anestesicos-1', nome: 'Mecanismo de ação — bloqueio de canais de Na⁺' },
                  { id: 'odo-p4-anestesicos-2', nome: 'Lidocaína, mepivacaína, articaína e bupivacaína — comparativo' },
                ],
              },
              {
                id: 'odo-p4-tecnicas-anestesicas',
                nome: 'Técnicas anestésicas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-tecnicas-1', nome: 'Bloqueio do nervo alveolar inferior — técnica clássica e de Gow-Gates' },
                  { id: 'odo-p4-tecnicas-2', nome: 'Infiltração, intraligamentar e intrapulpar — indicações' },
                ],
              },
            ],
          },
          {
            id: 'odo-p4-terapeutica-medicamentosa',
            nome: 'Terapêutica Medicamentosa em Odontologia',
            incluido: false,
            modulos: [
              {
                id: 'odo-p4-prescricao',
                nome: 'Prescrição odontológica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-prescricao-1', nome: 'Estrutura da receita — componentes e legislação' },
                  { id: 'odo-p4-prescricao-2', nome: 'Prescrição de antibióticos, analgésicos e anti-inflamatórios' },
                ],
              },
              {
                id: 'odo-p4-populacoes-especiais',
                nome: 'Populações especiais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p4-populacoes-1', nome: 'Gestantes, crianças, idosos e cardiopatas — ajuste de conduta' },
                  { id: 'odo-p4-populacoes-2', nome: 'Interações medicamentosas relevantes na clínica odontológica' },
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
        id: 'odo-p5-endodontia',
        nome: 'Endodontia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p5-diagnostico-endodontico',
            nome: 'Diagnóstico Endodôntico',
            incluido: false,
            modulos: [
              {
                id: 'odo-p5-testes-vitalidade',
                nome: 'Testes de vitalidade e diagnóstico pulpar',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-testes-1', nome: 'Testes térmicos (frio e calor) e elétrico' },
                  { id: 'odo-p5-testes-2', nome: 'Classificação das patologias pulpares e periapicais (AAE 2020)' },
                ],
              },
              {
                id: 'odo-p5-radiologia-endodontica',
                nome: 'Radiologia endodôntica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-radiologia-1', nome: 'Radiografia periapical — técnica paralela e bissectriz' },
                  { id: 'odo-p5-radiologia-2', nome: 'CBCT em endodontia — indicações e interpretação' },
                ],
              },
            ],
          },
          {
            id: 'odo-p5-tratamento-endodontico',
            nome: 'Tratamento Endodôntico',
            incluido: false,
            modulos: [
              {
                id: 'odo-p5-acesso-odontometria',
                nome: 'Acesso endodôntico e odontometria',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-acesso-1', nome: 'Abertura coronária — anatomia por grupo dental' },
                  { id: 'odo-p5-acesso-2', nome: 'Comprimento de trabalho — localizador apical e radiografia' },
                ],
              },
              {
                id: 'odo-p5-preparo-quimico-mecanico',
                nome: 'Preparo químico-mecânico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-preparo-1', nome: 'Instrumentação rotatória — NiTi, sistemas e sequências' },
                  { id: 'odo-p5-preparo-2', nome: 'Irrigação — hipoclorito de sódio, EDTA e clorexidina' },
                ],
              },
              {
                id: 'odo-p5-obturacao-canais',
                nome: 'Obturação dos canais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-obturacao-1', nome: 'Técnica da condensação lateral e termocompactação' },
                  { id: 'odo-p5-obturacao-2', nome: 'Cimentos endodônticos — AH Plus, Sealer 26 e biocerâmicos' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p5-protese-fixa',
        nome: 'Prótese Fixa',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p5-fundamentos-protese-fixa',
            nome: 'Fundamentos de Prótese Fixa',
            incluido: false,
            modulos: [
              {
                id: 'odo-p5-planejamento-restauracao',
                nome: 'Planejamento e seleção do tipo de restauração',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-planejamento-1', nome: 'Inlays, onlays, overlays e coroas totais — indicações' },
                  { id: 'odo-p5-planejamento-2', nome: 'Materiais em prótese fixa — metalo-cerâmica, zircônia e dissilicato de lítio' },
                ],
              },
              {
                id: 'odo-p5-preparo-coroa-total',
                nome: 'Preparo dental para coroa total',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-preparo-coroa-1', nome: 'Desgastes oclusais, axiais e chanfro/ombro' },
                  { id: 'odo-p5-preparo-coroa-2', nome: 'Expulsividade, altura clínica e resistência à remoção' },
                ],
              },
            ],
          },
          {
            id: 'odo-p5-laboratorio-instalacao',
            nome: 'Laboratório e Instalação',
            incluido: false,
            modulos: [
              {
                id: 'odo-p5-moldagem-protese-fixa',
                nome: 'Moldagem para prótese fixa',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-moldagem-pf-1', nome: 'Afastamento gengival — fios retratores e pastas expansoras' },
                  { id: 'odo-p5-moldagem-pf-2', nome: 'Moldagem com silicone de adição — dupla mistura e monofase' },
                ],
              },
              {
                id: 'odo-p5-instalacao-protese-fixa',
                nome: 'Instalação e ajuste da prótese fixa',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-instalacao-1', nome: 'Adaptação marginal — critérios de aceitação' },
                  { id: 'odo-p5-instalacao-2', nome: 'Cimentação definitiva — escolha do cimento e protocolo' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p5-tecnicas-cirurgicas',
        nome: 'Técnicas Cirúrgicas',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p5-principios-cirurgia-oral',
            nome: 'Princípios de Cirurgia Oral',
            incluido: false,
            modulos: [
              {
                id: 'odo-p5-instrumental-cirurgico',
                nome: 'Instrumental cirúrgico e técnica asséptica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-instrumental-1', nome: 'Bisturi, elevadores e fórceps — uso correto' },
                  { id: 'odo-p5-instrumental-2', nome: 'Esterilização e paramentação cirúrgica' },
                ],
              },
              {
                id: 'odo-p5-exodontia',
                nome: 'Exodontia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-exodontia-1', nome: 'Exodontia simples — sindesmotomia, luxação e avulsão' },
                  { id: 'odo-p5-exodontia-2', nome: 'Exodontia de dentes com múltiplas raízes — odontossecção' },
                ],
              },
            ],
          },
          {
            id: 'odo-p5-cirurgia-dentoalveolar',
            nome: 'Cirurgia Dentoalveolar',
            incluido: false,
            modulos: [
              {
                id: 'odo-p5-terceiros-molares',
                nome: 'Cirurgia de terceiros molares',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-terceiros-1', nome: 'Classificação de Pell & Gregory e Winter — posição e profundidade' },
                  { id: 'odo-p5-terceiros-2', nome: 'Técnica cirúrgica — incisão, retalho, osteotomia e sutura' },
                ],
              },
              {
                id: 'odo-p5-complicacoes-cirurgicas',
                nome: 'Complicações cirúrgicas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p5-complicacoes-1', nome: 'Hemorragia, seco alveolar e fratura de instrumento' },
                  { id: 'odo-p5-complicacoes-2', nome: 'Comunicação bucoantral — diagnóstico e conduta' },
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
        id: 'odo-p6-cirurgia-traumatologia-bmf',
        nome: 'Cirurgia e Traumatologia Buco-Maxilo-Facial',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p6-cirurgia-bmf',
            nome: 'Cirurgia Buco-Maxilo-Facial',
            incluido: false,
            modulos: [
              {
                id: 'odo-p6-cistos-tumores',
                nome: 'Cistos e tumores odontogênicos — tratamento cirúrgico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-cistos-1', nome: 'Enucleação, curetagem e marsupialização' },
                  { id: 'odo-p6-cistos-2', nome: 'Recidiva e acompanhamento radiográfico' },
                ],
              },
              {
                id: 'odo-p6-biopsia',
                nome: 'Biópsia de lesões orais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-biopsia-1', nome: 'Biópsia incisional, excisional e por punch' },
                  { id: 'odo-p6-biopsia-2', nome: 'Preparo da peça e pedido histopatológico' },
                ],
              },
            ],
          },
          {
            id: 'odo-p6-traumatologia',
            nome: 'Traumatologia Dentária e Maxilofacial',
            incluido: false,
            modulos: [
              {
                id: 'odo-p6-traumatismo-dentario',
                nome: 'Traumatismo dentário',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-traumatismo-1', nome: 'Classificação de Andreasen — concussão a avulsão' },
                  { id: 'odo-p6-traumatismo-2', nome: 'Conduta clínica no trauma — reimplante, contenção e acompanhamento' },
                ],
              },
              {
                id: 'odo-p6-fraturas-face',
                nome: 'Fraturas dos ossos da face',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-fraturas-1', nome: 'Fraturas de mandíbula — classificação e abordagem' },
                  { id: 'odo-p6-fraturas-2', nome: 'Fraturas do complexo zigomático e Le Fort — diagnóstico clínico e por imagem' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p6-endodontia-avancada',
        nome: 'Endodontia Avançada',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p6-retratamento-cirurgia',
            nome: 'Retratamento e Cirurgia Endodôntica',
            incluido: false,
            modulos: [
              {
                id: 'odo-p6-retratamento',
                nome: 'Retratamento endodôntico não cirúrgico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-retratamento-1', nome: 'Remoção de obturação — solventes, calor e instrumentos' },
                  { id: 'odo-p6-retratamento-2', nome: 'Desobstrução de canais calcificados' },
                ],
              },
              {
                id: 'odo-p6-cirurgia-parendodontica',
                nome: 'Cirurgia parendodôntica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-parendodontica-1', nome: 'Curetagem periapical e apicectomia — técnica' },
                  { id: 'odo-p6-parendodontica-2', nome: 'Obturação retrógrada — MTA e biocerâmicos' },
                ],
              },
            ],
          },
          {
            id: 'odo-p6-casos-complexos',
            nome: 'Casos Complexos em Endodontia',
            incluido: false,
            modulos: [
              {
                id: 'odo-p6-anatomia-interna',
                nome: 'Anatomia interna complexa',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-anatomia-interna-1', nome: 'Canais em C, dens invaginatus e taurodontismo' },
                  { id: 'odo-p6-anatomia-interna-2', nome: 'Uso do CBCT no planejamento de casos difíceis' },
                ],
              },
              {
                id: 'odo-p6-endodontia-regenerativa',
                nome: 'Endodontia regenerativa',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-regenerativa-1', nome: 'Revascularização pulpar em dentes imaturos' },
                  { id: 'odo-p6-regenerativa-2', nome: 'Protocolo com NaOCl, medicação intracanal e MTA' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p6-clinica-dor-dtm',
        nome: 'Clínica da Dor (DTM)',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p6-avaliacao-diagnostico-dor',
            nome: 'Avaliação e Diagnóstico da Dor Orofacial',
            incluido: false,
            modulos: [
              {
                id: 'odo-p6-tipos-dor',
                nome: 'Tipos de dor orofacial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-tipos-dor-1', nome: 'Dor musculoesquelética, neurovascular e neuropática' },
                  { id: 'odo-p6-tipos-dor-2', nome: 'Dor referida — padrões miofasciais na face' },
                ],
              },
              {
                id: 'odo-p6-instrumentos-avaliacao',
                nome: 'Instrumentos de avaliação da dor',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-instrumentos-1', nome: 'EVA, McGill e DC/TMD — aplicação clínica' },
                  { id: 'odo-p6-instrumentos-2', nome: 'Qualidade de vida e impacto da dor crônica (OHIP-14)' },
                ],
              },
            ],
          },
          {
            id: 'odo-p6-tratamento-multidisciplinar',
            nome: 'Tratamento Multidisciplinar da Dor',
            incluido: false,
            modulos: [
              {
                id: 'odo-p6-abordagem-conservadora',
                nome: 'Abordagem conservadora',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-conservadora-1', nome: 'Placa oclusal, fisioterapia e biofeedback' },
                  { id: 'odo-p6-conservadora-2', nome: 'Farmacoterapia — AINEs, miorrelaxantes e antidepressivos tricíclicos' },
                ],
              },
              {
                id: 'odo-p6-intervencoes-minimamente-invasivas',
                nome: 'Intervenções minimamente invasivas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p6-intervencoes-1', nome: 'Toxina botulínica em DTM — protocolo e pontos de aplicação' },
                  { id: 'odo-p6-intervencoes-2', nome: 'Agulhamento a seco de pontos-gatilho musculares' },
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
        id: 'odo-p7-deontologia-odontologia-legal',
        nome: 'Deontologia e Odontologia Legal',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p7-odontologia-legal',
            nome: 'Odontologia Legal',
            incluido: false,
            modulos: [
              {
                id: 'odo-p7-identificacao-humana',
                nome: 'Identificação humana em odontologia forense',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-identificacao-1', nome: 'Rugoscopia e queiroscopia palatina' },
                  { id: 'odo-p7-identificacao-2', nome: 'Estimativa de idade pelo método de Gustafson' },
                ],
              },
              {
                id: 'odo-p7-documentacao-pericias',
                nome: 'Documentação odontológica em perícias',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-documentacao-1', nome: 'Prontuário como documento legal — responsabilidade civil e criminal' },
                  { id: 'odo-p7-documentacao-2', nome: 'Lesões corporais — avaliação e laudo pericial' },
                ],
              },
            ],
          },
          {
            id: 'odo-p7-deontologia',
            nome: 'Deontologia Odontológica',
            incluido: false,
            modulos: [
              {
                id: 'odo-p7-responsabilidade-profissional',
                nome: 'Responsabilidade profissional',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-responsabilidade-1', nome: 'Imperícia, negligência e imprudência — exemplos clínicos' },
                  { id: 'odo-p7-responsabilidade-2', nome: 'Termo de consentimento livre e esclarecido (TCLE)' },
                ],
              },
              {
                id: 'odo-p7-cfo',
                nome: 'Conselho Federal de Odontologia (CFO)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-cfo-1', nome: 'Estrutura e funcionamento dos CROs' },
                  { id: 'odo-p7-cfo-2', nome: 'Infrações éticas — processos e penalidades' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p7-periodontia-avancada-implantodontia',
        nome: 'Periodontia Avançada e Implantodontia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p7-periodontia-cirurgica',
            nome: 'Periodontia Cirúrgica',
            incluido: false,
            modulos: [
              {
                id: 'odo-p7-cirurgias-ressectivas',
                nome: 'Cirurgias ressectivas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-ressectivas-1', nome: 'Gengivectomia e retalho de Widman modificado' },
                  { id: 'odo-p7-ressectivas-2', nome: 'Osteoplastia e ostectomia — indicações' },
                ],
              },
              {
                id: 'odo-p7-cirurgias-regenerativas',
                nome: 'Cirurgias regenerativas e mucogengivais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-regenerativas-1', nome: 'Enxerto de tecido conjuntivo subepitelial — técnica' },
                  { id: 'odo-p7-regenerativas-2', nome: 'ROG — membranas e substitutos ósseos' },
                ],
              },
            ],
          },
          {
            id: 'odo-p7-implantodontia',
            nome: 'Implantodontia',
            incluido: false,
            modulos: [
              {
                id: 'odo-p7-planejamento-implantes',
                nome: 'Planejamento para implantes',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-planejamento-implantes-1', nome: 'Análise tomográfica — altura, largura e densidade óssea' },
                  { id: 'odo-p7-planejamento-implantes-2', nome: 'Guia cirúrgico convencional e guia tomográfico' },
                ],
              },
              {
                id: 'odo-p7-cirurgia-implante',
                nome: 'Cirurgia de instalação do implante',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-cirurgia-implante-1', nome: 'Protocolo cirúrgico — fresagem e torque de instalação' },
                  { id: 'odo-p7-cirurgia-implante-2', nome: 'Implantação imediata, precoce e tardia — critérios de escolha' },
                ],
              },
              {
                id: 'odo-p7-protese-implante',
                nome: 'Prótese sobre implante',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-protese-implante-1', nome: 'Coroa unitária sobre implante — componentes protéticos' },
                  { id: 'odo-p7-protese-implante-2', nome: 'Protocolo de carga — convencional, precoce e imediata' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p7-harmonizacao-orofacial',
        nome: 'Bases para Harmonização Orofacial',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p7-anatomia-facial-aplicada',
            nome: 'Anatomia Facial Aplicada',
            incluido: false,
            modulos: [
              {
                id: 'odo-p7-proporcoes-analise',
                nome: 'Proporções e análise facial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-proporcoes-1', nome: 'Terços faciais, ângulos e simetria' },
                  { id: 'odo-p7-proporcoes-2', nome: 'Análise do sorriso — exposição gengival, linha do sorriso e corredor bucal' },
                ],
              },
              {
                id: 'odo-p7-envelhecimento-facial',
                nome: 'Envelhecimento facial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-envelhecimento-1', nome: 'Ptose de tecidos moles e perda de volume' },
                  { id: 'odo-p7-envelhecimento-2', nome: 'Compartimentos de gordura facial e sua relevância' },
                ],
              },
            ],
          },
          {
            id: 'odo-p7-procedimentos-hof',
            nome: 'Procedimentos em Harmonização Orofacial',
            incluido: false,
            modulos: [
              {
                id: 'odo-p7-toxina-botulinica',
                nome: 'Toxina botulínica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-toxina-1', nome: 'Mecanismo de ação e reversibilidade' },
                  { id: 'odo-p7-toxina-2', nome: 'Aplicação em rugas dinâmicas — glabela, frontal e pés-de-galinha' },
                ],
              },
              {
                id: 'odo-p7-preenchedores',
                nome: 'Preenchedores dérmicos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p7-preenchedores-1', nome: 'Ácido hialurônico — viscosidades e indicações' },
                  { id: 'odo-p7-preenchedores-2', nome: 'Técnicas de aplicação — bolus, retroinjeção e fanning' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 8º PERÍODO
    // ═══════════════════════════════════════════════════════════
    8: [
      {
        id: 'odo-p8-odontopediatria',
        nome: 'Odontopediatria',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p8-comportamento-atendimento',
            nome: 'Comportamento e Atendimento Infantil',
            incluido: false,
            modulos: [
              {
                id: 'odo-p8-psicologia-comportamento',
                nome: 'Psicologia do comportamento infantil no consultório',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-psicologia-1', nome: 'Escala de Frankl — classificação do comportamento' },
                  { id: 'odo-p8-psicologia-2', nome: 'Técnicas de manejo comportamental — dizer-mostrar-fazer, distração e reforço positivo' },
                ],
              },
              {
                id: 'odo-p8-sedacao-consciente',
                nome: 'Sedação consciente em odontopediatria',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-sedacao-1', nome: 'Óxido nitroso — indicações e protocolo' },
                  { id: 'odo-p8-sedacao-2', nome: 'Sedação oral com midazolam — doses e monitoramento' },
                ],
              },
            ],
          },
          {
            id: 'odo-p8-clinica-odontopediatrica',
            nome: 'Clínica Odontopediátrica',
            incluido: false,
            modulos: [
              {
                id: 'odo-p8-carie-infancia',
                nome: 'Cárie na infância — dentição decídua e mista',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-carie-infancia-1', nome: 'Cárie precoce da infância (ECC) — etiologia e prevenção' },
                  { id: 'odo-p8-carie-infancia-2', nome: 'Restaurações em dentes decíduos — resina, ionômero e coroa de aço' },
                ],
              },
              {
                id: 'odo-p8-pulpoterapia',
                nome: 'Pulpoterapia e pulpectomia em dentes decíduos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-pulpoterapia-1', nome: 'Pulpotomia com MTA e formocresol — protocolo' },
                  { id: 'odo-p8-pulpoterapia-2', nome: 'Pulpectomia — instrumentação e obturação com pasta reabsorvível' },
                ],
              },
              {
                id: 'odo-p8-traumatismo-criancas',
                nome: 'Traumatismo dentário em crianças',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-traumatismo-1', nome: 'Intrusão, extrusão e avulsão em decíduos — conduta' },
                  { id: 'odo-p8-traumatismo-2', nome: 'Sequelas do trauma no sucessor permanente' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p8-ortodontia',
        nome: 'Ortodontia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p8-diagnostico-ortodontico',
            nome: 'Diagnóstico Ortodôntico',
            incluido: false,
            modulos: [
              {
                id: 'odo-p8-analise-cefalometrica',
                nome: 'Análise cefalométrica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-cefalometrica-1', nome: 'Pontos e planos cefalométricos — traçado manual e digital' },
                  { id: 'odo-p8-cefalometrica-2', nome: 'Análise de Steiner e Ricketts — interpretação dos ângulos ANB, SNA e SNB' },
                ],
              },
              {
                id: 'odo-p8-modelos-discrepancia',
                nome: 'Modelos de estudo e análise de discrepância',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-modelos-1', nome: 'Análise de Bolton — desproporção dentária' },
                  { id: 'odo-p8-modelos-2', nome: 'Análise de espaço — apinhamento e diastemas' },
                ],
              },
            ],
          },
          {
            id: 'odo-p8-aparelhos-mecanica',
            nome: 'Aparelhos e Mecânica Ortodôntica',
            incluido: false,
            modulos: [
              {
                id: 'odo-p8-aparelhos-removiveis',
                nome: 'Aparelhos removíveis',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-removiveis-1', nome: 'Placa de Hawley — componentes e indicações' },
                  { id: 'odo-p8-removiveis-2', nome: 'Aparelhos funcionais — Bionator e ativador de Andresen' },
                ],
              },
              {
                id: 'odo-p8-aparelhos-fixos',
                nome: 'Aparelhos fixos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-fixos-1', nome: 'Braquetes — colagem e posicionamento' },
                  { id: 'odo-p8-fixos-2', nome: 'Arcos e fios — sequência de NiTi ao aço inoxidável' },
                  { id: 'odo-p8-fixos-3', nome: 'Mecânica de retração e fechamento de espaços' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p8-odontologia-hospitalar',
        nome: 'Odontologia Hospitalar',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p8-cd-hospital',
            nome: 'O Cirurgião-Dentista no Hospital',
            incluido: false,
            modulos: [
              {
                id: 'odo-p8-atuacao-uti',
                nome: 'Atuação em UTI e enfermaria',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-uti-1', nome: 'Saúde bucal do paciente hospitalizado — pneumonia associada à VM' },
                  { id: 'odo-p8-uti-2', nome: 'Protocolo de higiene oral em pacientes sob ventilação mecânica' },
                ],
              },
              {
                id: 'odo-p8-avaliacao-pre-operatoria',
                nome: 'Avaliação pré-operatória odontológica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-pre-operatoria-1', nome: 'Focos infecciosos bucais antes de cirurgias cardíacas e transplantes' },
                  { id: 'odo-p8-pre-operatoria-2', nome: 'Profilaxia antibiótica — endocardite infecciosa e imunossuprimidos' },
                ],
              },
            ],
          },
          {
            id: 'odo-p8-pacientes-comprometidos',
            nome: 'Odontologia em Pacientes Sistematicamente Comprometidos',
            incluido: false,
            modulos: [
              {
                id: 'odo-p8-doencas-sistemicas',
                nome: 'Conduta em pacientes com doenças sistêmicas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-sistemicas-1', nome: 'Hipertensão, diabetes e coagulopatias — adaptação do atendimento' },
                  { id: 'odo-p8-sistemicas-2', nome: 'Uso de bisfofonatos e osteonecrose de mandíbula (MRONJ)' },
                ],
              },
              {
                id: 'odo-p8-paciente-oncologico',
                nome: 'Paciente oncológico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-oncologico-1', nome: 'Mucosite oral — graus, prevenção e manejo' },
                  { id: 'odo-p8-oncologico-2', nome: 'Xerostomia por radioterapia — tratamento e cuidados' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p8-oncologia-odontologia',
        nome: 'Oncologia na Odontologia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p8-cancer-oral',
            nome: 'Câncer Oral',
            incluido: false,
            modulos: [
              {
                id: 'odo-p8-epidemiologia-fatores-risco',
                nome: 'Epidemiologia e fatores de risco',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-epidemiologia-1', nome: 'Tabaco, álcool e HPV — evidências e mecanismos' },
                  { id: 'odo-p8-epidemiologia-2', nome: 'Incidência no Brasil — dados do INCA' },
                ],
              },
              {
                id: 'odo-p8-diagnostico-precoce',
                nome: 'Diagnóstico precoce',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-diagnostico-precoce-1', nome: 'Lesões potencialmente malignas — leucoplasia, eritroplasia e queilite actínica' },
                  { id: 'odo-p8-diagnostico-precoce-2', nome: 'Biópsia e estadiamento TNM do carcinoma oral' },
                ],
              },
            ],
          },
          {
            id: 'odo-p8-tratamento-reabilitacao',
            nome: 'Tratamento e Reabilitação',
            incluido: false,
            modulos: [
              {
                id: 'odo-p8-modalidades-tratamento',
                nome: 'Modalidades de tratamento',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-modalidades-1', nome: 'Cirurgia, radioterapia e quimioterapia — impactos na cavidade oral' },
                  { id: 'odo-p8-modalidades-2', nome: 'Trismo, osteorradionecrose e manejo odontológico' },
                ],
              },
              {
                id: 'odo-p8-reabilitacao-oral',
                nome: 'Reabilitação oral pós-tratamento oncológico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p8-reabilitacao-1', nome: 'Prótese bucomaxilofacial — obturadores e epíteses' },
                  { id: 'odo-p8-reabilitacao-2', nome: 'Implantes em pacientes irradiados — protocolos e riscos' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 9º PERÍODO
    // ═══════════════════════════════════════════════════════════
    9: [
      {
        id: 'odo-p9-pacientes-necessidades-especiais',
        nome: 'Odontologia para Pacientes com Necessidades Especiais',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p9-abordagem-clinica-condicao',
            nome: 'Abordagem Clínica por Condição',
            incluido: false,
            modulos: [
              {
                id: 'odo-p9-deficiencia-intelectual-tea',
                nome: 'Pacientes com deficiência intelectual e TEA',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p9-tea-1', nome: 'Síndrome de Down — manifestações orais e adaptação do atendimento' },
                  { id: 'odo-p9-tea-2', nome: 'Manejo comportamental no TEA — comunicação e ambiente sensorial' },
                ],
              },
              {
                id: 'odo-p9-deficiencia-fisica-sensorial',
                nome: 'Pacientes com deficiência física e sensorial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p9-fisica-1', nome: 'Adaptação da cadeira odontológica e posicionamento' },
                  { id: 'odo-p9-fisica-2', nome: 'Deficiência visual e auditiva — comunicação alternativa' },
                ],
              },
            ],
          },
          {
            id: 'odo-p9-populacoes-vulneraveis',
            nome: 'Saúde Bucal em Populações Vulneráveis',
            incluido: false,
            modulos: [
              {
                id: 'odo-p9-idosos-institucionalizados',
                nome: 'Idosos institucionalizados',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p9-idosos-1', nome: 'Xerostomia, próteses mal adaptadas e candidíase em idosos' },
                  { id: 'odo-p9-idosos-2', nome: 'Prevenção de aspiração e higiene oral dependente' },
                ],
              },
              {
                id: 'odo-p9-pacientes-acamados',
                nome: 'Pacientes acamados e domiciliares',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p9-acamados-1', nome: 'Atendimento odontológico domiciliar — equipamentos portáteis' },
                  { id: 'odo-p9-acamados-2', nome: 'Cuidadores — treinamento em higiene bucal' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p9-tecnologia-inovacao',
        nome: 'Tecnologia e Inovação na Odontologia',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p9-odontologia-digital',
            nome: 'Odontologia Digital',
            incluido: false,
            modulos: [
              {
                id: 'odo-p9-escaneamento-intraoral',
                nome: 'Escaneamento intraoral e fluxo digital',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p9-escaneamento-1', nome: 'Scanners intraorais — funcionamento e comparativo entre sistemas' },
                  { id: 'odo-p9-escaneamento-2', nome: 'Fluxo digital completo — scan, CAD/CAM e impressão' },
                ],
              },
              {
                id: 'odo-p9-fresagem-impressao3d',
                nome: 'Fresagem e impressão 3D',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p9-fresagem-1', nome: 'Fresagem de blocos cerâmicos e zircônia (CAD/CAM chairside)' },
                  { id: 'odo-p9-fresagem-2', nome: 'Impressão 3D de guias cirúrgicos, modelos e aparelhos ortodônticos' },
                ],
              },
            ],
          },
          {
            id: 'odo-p9-tecnologias-emergentes',
            nome: 'Tecnologias Emergentes',
            incluido: false,
            modulos: [
              {
                id: 'odo-p9-ia-odontologia',
                nome: 'Inteligência artificial em odontologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p9-ia-1', nome: 'IA no diagnóstico radiográfico — cárie, osso e lesões periapicais' },
                  { id: 'odo-p9-ia-2', nome: 'Softwares de planejamento cirúrgico virtual' },
                ],
              },
              {
                id: 'odo-p9-laser',
                nome: 'Laser em odontologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p9-laser-1', nome: 'Laser de diodo, Er:YAG e Nd:YAG — comprimentos de onda e indicações' },
                  { id: 'odo-p9-laser-2', nome: 'Laser em periodontia, clareamento e tecidos moles' },
                ],
              },
            ],
          },
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // 10º PERÍODO
    // ═══════════════════════════════════════════════════════════
    10: [
      {
        id: 'odo-p10-urgencias-odontologicas-ii',
        nome: 'Clínica de Urgências Odontológicas II',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p10-urgencias-clinicas-avancadas',
            nome: 'Urgências Clínicas Avançadas',
            incluido: false,
            modulos: [
              {
                id: 'odo-p10-urgencias-pulpares',
                nome: 'Urgências pulpares e periapicais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p10-pulpares-1', nome: 'Pulpite irreversível sintomática — diagnóstico diferencial e conduta imediata' },
                  { id: 'odo-p10-pulpares-2', nome: 'Abscesso dentoalveolar agudo — drenagem e antibioticoterapia' },
                ],
              },
              {
                id: 'odo-p10-urgencias-periodontais',
                nome: 'Urgências periodontais',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p10-periodontais-1', nome: 'Pericoronarite — lavagem, orientação e indicação cirúrgica' },
                  { id: 'odo-p10-periodontais-2', nome: 'Abscesso periodontal agudo — drenagem e raspagem de urgência' },
                ],
              },
            ],
          },
          {
            id: 'odo-p10-emergencias-medicas',
            nome: 'Emergências Médicas no Consultório',
            incluido: false,
            modulos: [
              {
                id: 'odo-p10-reconhecimento-manejo',
                nome: 'Reconhecimento e manejo das emergências',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p10-manejo-1', nome: 'Síncope vasovagal, hipoglicemia e crise hipertensiva — conduta' },
                  { id: 'odo-p10-manejo-2', nome: 'Reação anafilática e broncoespasmo — adrenalina e protocolo BLS' },
                ],
              },
              {
                id: 'odo-p10-suporte-basico-vida',
                nome: 'Suporte básico de vida (SBV) aplicado à odontologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p10-sbv-1', nome: 'RCP — compressões, ventilação e DEA' },
                  { id: 'odo-p10-sbv-2', nome: 'Kit de emergência do consultório odontológico — composição e validade' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'odo-p10-clinica-multidisciplinar-crianca-adolescente',
        nome: 'Clínica Multidisciplinar da Criança e do Adolescente',
        incluido: false,
        subtopicos: [
          {
            id: 'odo-p10-interceptacao-reabilitacao',
            nome: 'Intercepção Ortodôntica e Reabilitação Infantil',
            incluido: false,
            modulos: [
              {
                id: 'odo-p10-mas-oclusoes',
                nome: 'Má-oclusões na dentição decídua e mista',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p10-mas-oclusoes-1', nome: 'Mordida cruzada anterior e posterior — expansão e aparelhos removíveis' },
                  { id: 'odo-p10-mas-oclusoes-2', nome: 'Hábitos bucais deletérios — sucção, bruxismo e respiração bucal' },
                ],
              },
              {
                id: 'odo-p10-reabilitacao-infancia',
                nome: 'Reabilitação oral na infância',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p10-reabilitacao-1', nome: 'Mantenedores de espaço — indicações e tipos' },
                  { id: 'odo-p10-reabilitacao-2', nome: 'Reabilitação oral completa sob anestesia geral em crianças — protocolo' },
                ],
              },
            ],
          },
          {
            id: 'odo-p10-abordagem-multidisciplinar',
            nome: 'Abordagem Multidisciplinar em Pediatria',
            incluido: false,
            modulos: [
              {
                id: 'odo-p10-integracao-medicina-fono',
                nome: 'Integração com medicina e fonoaudiologia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p10-integracao-1', nome: 'Frenectomia lingual e labial — diagnóstico e técnica' },
                  { id: 'odo-p10-integracao-2', nome: 'SAME — coordenação do cuidado com equipe de saúde' },
                ],
              },
              {
                id: 'odo-p10-plano-tratamento-integral',
                nome: 'Plano de tratamento integral na criança',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'odo-p10-plano-1', nome: 'Sequenciamento clínico — urgência, controle e reabilitação' },
                  { id: 'odo-p10-plano-2', nome: 'Prontuário odontológico infantil — registros e responsabilidade legal' },
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
