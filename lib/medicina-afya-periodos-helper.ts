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

export function getMedicinaAFYATopicos(periodo: 1 | 2 | 3 | 4 | 5): TopicItemWithModules[] {
  const topicos: Record<number, TopicItemWithModules[]> = {
    1: [
      // SOI I
      {
        id: 'med-p1-soi1',
        nome: 'SOI I',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p1-soi1-bases',
            nome: 'Bases Moleculares e Celulares (introdução transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-soi1-bases-membrana',
                nome: 'Membrana plasmática e transporte',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-bases-membrana-1', nome: 'Estrutura da membrana (modelo mosaico-fluido)' },
                  { id: 'med-p1-soi1-bases-membrana-2', nome: 'Transporte passivo (difusão simples, facilitada, osmose)' },
                  { id: 'med-p1-soi1-bases-membrana-3', nome: 'Transporte ativo primário e secundário (bomba Na+/K+-ATPase, simportes, antiportes)' },
                  { id: 'med-p1-soi1-bases-membrana-4', nome: 'Potenciais de membrana e gradientes iônicos' }
                ]
              },
              {
                id: 'med-p1-soi1-bases-potencial',
                nome: 'Potenciais de ação e transmissão sináptica',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-bases-potencial-1', nome: 'Potencial de repouso da membrana' },
                  { id: 'med-p1-soi1-bases-potencial-2', nome: 'Canais iônicos dependentes de voltagem' },
                  { id: 'med-p1-soi1-bases-potencial-3', nome: 'Potencial de ação rápido (neurônio, músculo esquelético)' },
                  { id: 'med-p1-soi1-bases-potencial-4', nome: 'Potencial de ação lento (nós cardíacos)' }
                ]
              },
              {
                id: 'med-p1-soi1-bases-ciclo',
                nome: 'Ciclo celular e morte celular',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-bases-ciclo-1', nome: 'Fases do ciclo celular e regulação (ciclinas/CDK)' },
                  { id: 'med-p1-soi1-bases-ciclo-2', nome: 'Apoptose vs necrose – relevância clínica' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-soi1-cardio',
            nome: 'Sistema Cardiocirculatório',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-soi1-cardio-anatomia',
                nome: 'Anatomia macro e microscópica do coração e vasos',
                horasEstimadas: 54,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-cardio-anatomia-1', nome: 'Configuração externa e câmaras cardíacas' },
                  { id: 'med-p1-soi1-cardio-anatomia-2', nome: 'Parede cardíaca (endotélio, miocárdio, pericárdio)' },
                  { id: 'med-p1-soi1-cardio-anatomia-3', nome: 'Sistema de condução elétrico (nó SA, nó AV, feixe de His, Purkinje)' },
                  { id: 'med-p1-soi1-cardio-anatomia-4', nome: 'Artérias, arteríolas, capilares, vênulas e veias (histologia)' },
                  { id: 'med-p1-soi1-cardio-anatomia-5', nome: 'Circulação coronariana e fetal' }
                ]
              },
              {
                id: 'med-p1-soi1-cardio-fisiologia',
                nome: 'Fisiologia da contração cardíaca',
                horasEstimadas: 46,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-cardio-fisiologia-1', nome: 'Acoplamento excitação-contração no miócito cardíaco' },
                  { id: 'med-p1-soi1-cardio-fisiologia-2', nome: 'Potencial de ação cardíaco (células rápidas e lentas)' },
                  { id: 'med-p1-soi1-cardio-fisiologia-3', nome: 'Período refratário e extra-sístoles' },
                  { id: 'med-p1-soi1-cardio-fisiologia-4', nome: 'Lei de Frank-Starling e regulação inotrópica/lusitrópica' }
                ]
              },
              {
                id: 'med-p1-soi1-cardio-ciclo',
                nome: 'Ciclo cardíaco e hemodinâmica',
                horasEstimadas: 52,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-cardio-ciclo-1', nome: 'Fases do ciclo cardíaco e curvas de pressão-volume' },
                  { id: 'med-p1-soi1-cardio-ciclo-2', nome: 'Débito cardíaco e seus determinantes' },
                  { id: 'med-p1-soi1-cardio-ciclo-3', nome: 'Resistência vascular periférica e pressão arterial' },
                  { id: 'med-p1-soi1-cardio-ciclo-4', nome: 'Regulação nervosa e humoral da circulação (SNA, renina-angiotensina, ANP)' }
                ]
              },
              {
                id: 'med-p1-soi1-cardio-eletro',
                nome: 'Eletrofisiologia cardíaca básica',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-cardio-eletro-1', nome: 'ECG normal e correlação anatomofisiológica' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-soi1-hemo',
            nome: 'Sistema Linfo-Hematopoiético e Imunológico',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-soi1-hemo-hematopoiese',
                nome: 'Hematopoiese',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-hemo-hematopoiese-1', nome: 'Células-tronco hematopoiéticas e microambiente medular' },
                  { id: 'med-p1-soi1-hemo-hematopoiese-2', nome: 'Linhagem eritroide, granulocítica, megacariocítica e linfóide' },
                  { id: 'med-p1-soi1-hemo-hematopoiese-3', nome: 'Regulação (citocinas: EPO, TPO, G-CSF etc.)' }
                ]
              },
              {
                id: 'med-p1-soi1-hemo-eritrocitos',
                nome: 'Eritrócitos e hemoglobina',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-hemo-eritrocitos-1', nome: 'Síntese e catabolismo da hemoglobina' },
                  { id: 'med-p1-soi1-hemo-eritrocitos-2', nome: 'Curva de dissociação do oxigênio e efeito Bohr' },
                  { id: 'med-p1-soi1-hemo-eritrocitos-3', nome: 'Anemias carenciais e hemolíticas – base morfofuncional' }
                ]
              },
              {
                id: 'med-p1-soi1-hemo-leucocitos',
                nome: 'Leucócitos e imunidade inata',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-hemo-leucocitos-1', nome: 'Granulócitos, monócitos/macrófagos, células NK' },
                  { id: 'med-p1-soi1-hemo-leucocitos-2', nome: 'Sistema complemento e fagocitose' }
                ]
              },
              {
                id: 'med-p1-soi1-hemo-imunidade',
                nome: 'Imunidade adaptativa (básico)',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-hemo-imunidade-1', nome: 'Órgãos linfoides primários (medula e timo) e secundários' },
                  { id: 'med-p1-soi1-hemo-imunidade-2', nome: 'Apresentação de antígeno (MHC I e II)' },
                  { id: 'med-p1-soi1-hemo-imunidade-3', nome: 'Linfócitos T e B – ativação básica' }
                ]
              },
              {
                id: 'med-p1-soi1-hemo-histologia',
                nome: 'Histologia dos órgãos linfoides',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-hemo-histologia-1', nome: 'Baço, linfonodos, tonsilas e MALT' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-soi1-respiratorio',
            nome: 'Sistema Respiratório',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-soi1-resp-anatomia',
                nome: 'Anatomia das vias aéreas e pulmão',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-resp-anatomia-1', nome: 'Vias aéreas superiores e inferiores' },
                  { id: 'med-p1-soi1-resp-anatomia-2', nome: 'Alvéolo e barreira hemato-aérea' },
                  { id: 'med-p1-soi1-resp-anatomia-3', nome: 'Vascularização e inervação pulmonar' }
                ]
              },
              {
                id: 'med-p1-soi1-resp-mecanica',
                nome: 'Mecânica ventilatória',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-resp-mecanica-1', nome: 'Pressões intrapleurais e compliance pulmonar' },
                  { id: 'med-p1-soi1-resp-mecanica-2', nome: 'Surfactante e lei de Laplace' },
                  { id: 'med-p1-soi1-resp-mecanica-3', nome: 'Volumes e capacidades pulmonares' }
                ]
              },
              {
                id: 'med-p1-soi1-resp-trocas',
                nome: 'Trocas gasosas',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-resp-trocas-1', nome: 'Difusão de O₂ e CO₂ (lei de Fick)' },
                  { id: 'med-p1-soi1-resp-trocas-2', nome: 'Relação ventilação/perfusão (V/Q)' },
                  { id: 'med-p1-soi1-resp-trocas-3', nome: 'Transporte de O₂ e CO₂ no sangue' }
                ]
              },
              {
                id: 'med-p1-soi1-resp-controle',
                nome: 'Controle da respiração',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-resp-controle-1', nome: 'Centros respiratórios e quimiorreceptores' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-soi1-digestorio',
            nome: 'Sistema Digestório',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-soi1-dig-parede',
                nome: 'Parede do tubo digestivo e glândulas anexas',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-dig-parede-1', nome: 'Camadas histológicas do TGI' },
                  { id: 'med-p1-soi1-dig-parede-2', nome: 'Histologia do fígado, vesícula biliar e pâncreas exócrino' },
                  { id: 'med-p1-soi1-dig-parede-3', nome: 'Motilidade digestiva (peristaltismo, complexo motor migratório)' }
                ]
              },
              {
                id: 'med-p1-soi1-dig-macronutrientes',
                nome: 'Digestão e absorção de macronutrientes',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-dig-macronutrientes-1', nome: 'Digestão e absorção de carboidratos' },
                  { id: 'med-p1-soi1-dig-macronutrientes-2', nome: 'Digestão e absorção de proteínas' },
                  { id: 'med-p1-soi1-dig-macronutrientes-3', nome: 'Digestão e absorção de lipídios (micelas, quilomícrons)' },
                  { id: 'med-p1-soi1-dig-macronutrientes-4', nome: 'Absorção de vitaminas e minerais' }
                ]
              },
              {
                id: 'med-p1-soi1-dig-regulacao',
                nome: 'Regulação hormonal do sistema digestivo',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-dig-regulacao-1', nome: 'Gastrina, secretina, CCK, GIP, motilina' },
                  { id: 'med-p1-soi1-dig-regulacao-2', nome: 'Fases cefálica, gástrica e intestinal da secreção' }
                ]
              },
              {
                id: 'med-p1-soi1-dig-hepaticas',
                nome: 'Funções hepáticas',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-dig-hepaticas-1', nome: 'Metabolismo da bilirrubina' },
                  { id: 'med-p1-soi1-dig-hepaticas-2', nome: 'Síntese de proteínas plasmáticas e detoxificação' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-soi1-integracao',
            nome: 'Integração Morfofuncional e Clínica (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-soi1-integracao-correlacao',
                nome: 'Correlação estrutura-função em situações patológicas frequentes',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-soi1-integracao-correlacao-1', nome: 'Anemia ferropriva × anemia megaloblástica' },
                  { id: 'med-p1-soi1-integracao-correlacao-2', nome: 'Insuficiência cardíaca × choque cardiogênico' },
                  { id: 'med-p1-soi1-integracao-correlacao-3', nome: 'Asma × DPOC (alterações estruturais e funcionais)' },
                  { id: 'med-p1-soi1-integracao-correlacao-4', nome: 'Doença ulcerosa péptica × esteatose hepática' }
                ]
              }
            ]
          }
        ]
      },
      // HAM I
      {
        id: 'med-p1-ham1',
        nome: 'HAM I',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p1-ham1-comunicacao',
            nome: 'Relação Médico-Paciente e Comunicação Humanizada',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-ham1-com-etica',
                nome: 'Princípios éticos e bioéticos na relação médico-paciente',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-com-etica-1', nome: 'Autonomia, beneficência, não maleficência e justiça' },
                  { id: 'med-p1-ham1-com-etica-2', nome: 'Consentimento livre e esclarecido (em adulto e criança)' },
                  { id: 'med-p1-ham1-com-etica-3', nome: 'Sigilo médico e quebra de sigilo (situações excepcionais)' }
                ]
              },
              {
                id: 'med-p1-ham1-com-verbal',
                nome: 'Comunicação verbal e não verbal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-com-verbal-1', nome: 'Escuta ativa e empatia' },
                  { id: 'med-p1-ham1-com-verbal-2', nome: 'Técnica SPIKES para notícias difíceis' },
                  { id: 'med-p1-ham1-com-verbal-3', nome: 'Linguagem acessível, evitando jargões médicos' }
                ]
              },
              {
                id: 'med-p1-ham1-com-abordagem',
                nome: 'Abordagem centrada na pessoa e na família',
                horasEstimadas: 10,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-com-abordagem-1', nome: 'Modelo biopsicossocial de Engel' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-ham1-documentos',
            nome: 'Ética no Preenchimento de Documentos Médicos',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-ham1-doc-prontuario',
                nome: 'Prontuário único e registro médico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-doc-prontuario-1', nome: 'Elementos obrigatórios do prontuário (CFM Resolução 2219/2018)' },
                  { id: 'med-p1-ham1-doc-prontuario-2', nome: 'Evolução médica, prescrição, atestados e declarações' },
                  { id: 'med-p1-ham1-doc-prontuario-3', nome: 'Responsabilidade civil, penal e ética do registro incorreto' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-ham1-biosseguranca',
            nome: 'Biossegurança e Precauções Universais',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-ham1-bioseg-higienizacao',
                nome: 'Higienização das mãos e paramentação',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-bioseg-higienizacao-1', nome: 'Técnica de higienização simples e antissepsia cirúrgica' },
                  { id: 'med-p1-ham1-bioseg-higienizacao-2', nome: 'Sequência correta de colocação e retirada de EPIs' },
                  { id: 'med-p1-ham1-bioseg-higienizacao-3', nome: 'Precauções padrão, por gotículas e por aerossóis' }
                ]
              },
              {
                id: 'med-p1-ham1-bioseg-perfurocortantes',
                nome: 'Gerenciamento de perfurocortantes e acidentes ocupacionais',
                horasEstimadas: 10,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-bioseg-perfurocortantes-1', nome: 'Conduta pós-exposição a material biológico (PEP)' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-ham1-antropometria',
            nome: 'Medidas Antropométricas e Gráficos de Crescimento',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-ham1-antrop-avaliacao',
                nome: 'Avaliação antropométrica em crianças e adultos',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-antrop-avaliacao-1', nome: 'Peso, estatura, perímetro cefálico, abdominal e braquial' },
                  { id: 'med-p1-ham1-antrop-avaliacao-2', nome: 'Cálculo e interpretação do IMC (adulto e infantil)' },
                  { id: 'med-p1-ham1-antrop-avaliacao-3', nome: 'Curvas OMS 2006/2007 – escore Z de peso/idade, estatura/idade, peso/estatura' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-ham1-sinais',
            nome: 'Sinais Vitais',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-ham1-sinais-temp',
                nome: 'Temperatura corporal',
                horasEstimadas: 10,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-sinais-temp-1', nome: 'Técnicas axilar, timpânica, retal e valores de referência por faixa etária' }
                ]
              },
              {
                id: 'med-p1-ham1-sinais-fc',
                nome: 'Frequência cardíaca e pulso periférico',
                horasEstimadas: 10,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-sinais-fc-1', nome: 'Locais de palpação, regularidade, amplitude e valores normais' }
                ]
              },
              {
                id: 'med-p1-ham1-sinais-fr',
                nome: 'Frequência respiratória',
                horasEstimadas: 10,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-sinais-fr-1', nome: 'Contagem correta e padrões respiratórios' }
                ]
              },
              {
                id: 'med-p1-ham1-sinais-pa',
                nome: 'Pressão arterial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-sinais-pa-1', nome: 'Técnica correta (manguito adequado, posição, 1ª e 5ª fase de Korotkoff)' },
                  { id: 'med-p1-ham1-sinais-pa-2', nome: 'Valores de referência por idade e percentil (crianças)' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-ham1-ectoscopia',
            nome: 'Ectoscopia Geral e Noções de Exame Físico',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-ham1-ecto-inspecao',
                nome: 'Inspeção geral (estado de consciência, hidratação, fácies)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-ecto-inspecao-1', nome: 'Escala de Glasgow básica' },
                  { id: 'med-p1-ham1-ecto-inspecao-2', nome: 'Identificação de cianose, icterícia, palidez, edema' }
                ]
              },
              {
                id: 'med-p1-ham1-ecto-cabeca',
                nome: 'Cabeça e pescoço',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-ecto-cabeca-1', nome: 'Palpação de cadeias linfáticas, tireoide e fontanelas' }
                ]
              },
              {
                id: 'med-p1-ham1-ecto-sistemas',
                nome: 'Introdução aos sistemas com maior ênfase no HAM I',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-ecto-sistemas-1', nome: 'Inspeção e palpação abdominal básica' },
                  { id: 'med-p1-ham1-ecto-sistemas-2', nome: 'Ausculta cardíaca e pulmonar (focos básicos)' },
                  { id: 'med-p1-ham1-ecto-sistemas-3', nome: 'Inspeção de membros e coluna' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-ham1-anamnese',
            nome: 'Introdução à Anamnese',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-ham1-anam-estrutura',
                nome: 'Estrutura da anamnese',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-anam-estrutura-1', nome: 'Identificação, queixa principal, história da doença atual (HDA)' },
                  { id: 'med-p1-ham1-anam-estrutura-2', nome: 'Interrogatório sintomático por aparelhos (básico)' }
                ]
              },
              {
                id: 'med-p1-ham1-anam-historia',
                nome: 'História patológica pregressa, medicamentosa, alérgica, familiar e social',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-anam-historia-1', nome: 'Antecedentes pessoais, medicações, alergias, história familiar e contexto social' }
                ]
              }
            ]
          },
          {
            id: 'med-p1-ham1-treinamento',
            nome: 'Treinamento Prático (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p1-ham1-treino-roleplay',
                nome: 'Role-play de acolhimento e anamnese inicial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-treino-roleplay-1', nome: 'Simulação de primeiro atendimento com foco em comunicação' }
                ]
              },
              {
                id: 'med-p1-ham1-treino-manequins',
                nome: 'Treinamento em manequins e simuladores de sinais vitais',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-treino-manequins-1', nome: 'Prática de aferição de sinais vitais em simuladores' }
                ]
              },
              {
                id: 'med-p1-ham1-treino-osce',
                nome: 'Estações OSCE básicas (higienização das mãos, aferição PA, antropometria)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-treino-osce-1', nome: 'Estações práticas de avaliação estruturada' }
                ]
              },
              {
                id: 'med-p1-ham1-treino-balint',
                nome: 'Grupos Balint para reflexão sobre a relação médico-paciente',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p1-ham1-treino-balint-1', nome: 'Discussão em grupo sobre aspectos emocionais da prática médica' }
                ]
              }
            ]
          }
        ]
      }
    ],
    2: [
      // SOI II
      {
        id: 'med-p2-soi2',
        nome: 'SOI II',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p2-soi2-nervoso',
            nome: 'Sistema Nervoso',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-soi2-nervoso-org',
                nome: 'Organização geral e neurohistologia',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-nervoso-org-1', nome: 'Neurônio: corpo celular, axônio, dendritos, bainha de mielina' },
                  { id: 'med-p2-soi2-nervoso-org-2', nome: 'Sinapse química e elétrica' },
                  { id: 'med-p2-soi2-nervoso-org-3', nome: 'Neuroglia (astrócitos, oligodendrócitos, micróglia, ependimárias)' },
                  { id: 'med-p2-soi2-nervoso-org-4', nome: 'Barreira hematoencefálica' }
                ]
              },
              {
                id: 'med-p2-soi2-nervoso-neuro',
                nome: 'Neurofisiologia celular',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-nervoso-neuro-1', nome: 'Potencial de repouso e potencial de ação neuronal' },
                  { id: 'med-p2-soi2-nervoso-neuro-2', nome: 'Condução saltatória' },
                  { id: 'med-p2-soi2-nervoso-neuro-3', nome: 'Transmissão sináptica (neurotransmissores excitatórios e inibitórios)' },
                  { id: 'med-p2-soi2-nervoso-neuro-4', nome: 'Plasticidade sináptica básica' }
                ]
              },
              {
                id: 'med-p2-soi2-nervoso-medula',
                nome: 'Medula espinal e nervos espinais',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-nervoso-medula-1', nome: 'Organização anatômica e substância cinzenta/branca' },
                  { id: 'med-p2-soi2-nervoso-medula-2', nome: 'Reflexos medulares (mioático e flexor)' },
                  { id: 'med-p2-soi2-nervoso-medula-3', nome: 'Vias sensitivas e motoras' }
                ]
              },
              {
                id: 'med-p2-soi2-nervoso-tronco',
                nome: 'Tronco encefálico e nervos cranianos',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-nervoso-tronco-1', nome: 'Funções vitais, núcleos dos nervos cranianos III–XII' }
                ]
              },
              {
                id: 'med-p2-soi2-nervoso-cerebelo',
                nome: 'Cerebelo',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-nervoso-cerebelo-1', nome: 'Circuitos cerebelares e controle da coordenação motora' }
                ]
              },
              {
                id: 'med-p2-soi2-nervoso-diencefalo',
                nome: 'Diencéfalo',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-nervoso-diencefalo-1', nome: 'Tálamo (revezamento sensorial)' },
                  { id: 'med-p2-soi2-nervoso-diencefalo-2', nome: 'Hipotálamo (controle neuroendócrino e autonômico)' }
                ]
              },
              {
                id: 'med-p2-soi2-nervoso-telencefalo',
                nome: 'Telencéfalo',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-nervoso-telencefalo-1', nome: 'Córtex cerebral – áreas funcionais (Brodmann)' },
                  { id: 'med-p2-soi2-nervoso-telencefalo-2', nome: 'Sistema límbico (memória e emoção)' },
                  { id: 'med-p2-soi2-nervoso-telencefalo-3', nome: 'Vias motoras descendentes (piramidal e extrapiramidal)' }
                ]
              },
              {
                id: 'med-p2-soi2-nervoso-autonomo',
                nome: 'Sistema nervoso autônomo',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-nervoso-autonomo-1', nome: 'Divisão simpática e parassimpática' },
                  { id: 'med-p2-soi2-nervoso-autonomo-2', nome: 'Neurotransmissores autonômicos e receptores' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-soi2-osteomuscular',
            nome: 'Sistema Osteomuscular',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-soi2-osteo-tecido',
                nome: 'Tecido ósseo e cartilaginoso',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-osteo-tecido-1', nome: 'Ossificação endocondral e intramembranosa' },
                  { id: 'med-p2-soi2-osteo-tecido-2', nome: 'Remodelação óssea (osteoblasto, osteócito, osteoclasto)' },
                  { id: 'med-p2-soi2-osteo-tecido-3', nome: 'Cartilagem hialina, elástica e fibrosa' }
                ]
              },
              {
                id: 'med-p2-soi2-osteo-musculo',
                nome: 'Músculo esquelético',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-osteo-musculo-1', nome: 'Ultraestrutura da fibra muscular e sarcômero' },
                  { id: 'med-p2-soi2-osteo-musculo-2', nome: 'Acoplamento excitação-contração (liberação de Ca²⁺ do retículo sarcoplasmático)' },
                  { id: 'med-p2-soi2-osteo-musculo-3', nome: 'Tipos de fibras musculares (I, IIa, IIx) e fadiga' },
                  { id: 'med-p2-soi2-osteo-musculo-4', nome: 'Unidade motora e graduação da força' }
                ]
              },
              {
                id: 'med-p2-soi2-osteo-fisiologia',
                nome: 'Fisiologia da contração muscular',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-osteo-fisiologia-1', nome: 'Teoria dos filamentos deslizantes' },
                  { id: 'med-p2-soi2-osteo-fisiologia-2', nome: 'Relação comprimento-tensão e lei de Starling muscular' }
                ]
              },
              {
                id: 'med-p2-soi2-osteo-articulacoes',
                nome: 'Articulações e biomecânica básica',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-osteo-articulacoes-1', nome: 'Tipos de articulações e movimentos' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-soi2-endocrino',
            nome: 'Sistema Endócrino',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-soi2-endo-conceitos',
                nome: 'Conceitos gerais e eixo hipotálamo-hipófise',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-endo-conceitos-1', nome: 'Hormônios liberadores e inibidores hipotalâmicos' },
                  { id: 'med-p2-soi2-endo-conceitos-2', nome: 'Hormônios adenopofisários (GH, TSH, ACTH, FSH/LH, PRL)' }
                ]
              },
              {
                id: 'med-p2-soi2-endo-tireoide',
                nome: 'Tireoide',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-endo-tireoide-1', nome: 'Síntese de T3/T4 e eje TSH-TRH' },
                  { id: 'med-p2-soi2-endo-tireoide-2', nome: 'Ações metabólicas e de crescimento' }
                ]
              },
              {
                id: 'med-p2-soi2-endo-suprarrenal',
                nome: 'Suprarrenal',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-endo-suprarrenal-1', nome: 'Zona glomerulosa (aldosterona – SRAA)' },
                  { id: 'med-p2-soi2-endo-suprarrenal-2', nome: 'Zona fasciculada (cortisol – eje CRH-ACTH)' },
                  { id: 'med-p2-soi2-endo-suprarrenal-3', nome: 'Medula suprarrenal (catecolaminas)' }
                ]
              },
              {
                id: 'med-p2-soi2-endo-pancreas',
                nome: 'Pâncreas endócrino',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-endo-pancreas-1', nome: 'Regulação da glicemia (insulina e glucagon)' },
                  { id: 'med-p2-soi2-endo-pancreas-2', nome: 'Outros hormônios das ilhotas (somatostatina, polipeptídeo pancreático)' }
                ]
              },
              {
                id: 'med-p2-soi2-endo-calcio',
                nome: 'Metabolismo do cálcio e fósforo',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-endo-calcio-1', nome: 'PTH, vitamina D e calcitonina' }
                ]
              },
              {
                id: 'med-p2-soi2-endo-sexuais',
                nome: 'Hormônios sexuais e eixo hipotálamo-hipófise-gonadal (introdução)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-endo-sexuais-1', nome: 'Eixo HPA e regulação hormonal reprodutiva' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-soi2-reprodutor',
            nome: 'Sistema Reprodutor',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-soi2-repro-gametogenese',
                nome: 'Gametogênese e diferenciação sexual',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-repro-gametogenese-1', nome: 'Espermatogênese e ciclo do seminífero' },
                  { id: 'med-p2-soi2-repro-gametogenese-2', nome: 'Ovogênese e foliculogênese' }
                ]
              },
              {
                id: 'med-p2-soi2-repro-masculino',
                nome: 'Sistema reprodutor masculino',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-repro-masculino-1', nome: 'Anatomia e histologia dos testículos, epidídimo, ductos e glândulas anexas' },
                  { id: 'med-p2-soi2-repro-masculino-2', nome: 'Regulação hormonal (GnRH-FSH/LH-testosterona)' }
                ]
              },
              {
                id: 'med-p2-soi2-repro-feminino',
                nome: 'Sistema reprodutor feminino',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-repro-feminino-1', nome: 'Anatomia e histologia do ovário, tubas, útero e vagina' },
                  { id: 'med-p2-soi2-repro-feminino-2', nome: 'Ciclo ovariano e ciclo endometrial' },
                  { id: 'med-p2-soi2-repro-feminino-3', nome: 'Hormônios ovarianos (estrogênios, progesterona) e feedback' }
                ]
              },
              {
                id: 'med-p2-soi2-repro-fertilizacao',
                nome: 'Fertilização, implantação e placentação',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-repro-fertilizacao-1', nome: 'hCG, progesterona placentária e parto' }
                ]
              },
              {
                id: 'med-p2-soi2-repro-puberdade',
                nome: 'Puberdade e menopausa (básico)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-repro-puberdade-1', nome: 'Mudanças fisiológicas e endócrinas' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-soi2-urinario',
            nome: 'Sistema Urinário',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-soi2-urin-anatomia',
                nome: 'Anatomia macro e microscópica do rim e vias urinárias',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-urin-anatomia-1', nome: 'Néfron (glomérulo, túbulos, ducto coletor)' },
                  { id: 'med-p2-soi2-urin-anatomia-2', nome: 'Vascularização renal e aparelho justaglomerular' }
                ]
              },
              {
                id: 'med-p2-soi2-urin-filtracao',
                nome: 'Filtração glomerular',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-urin-filtracao-1', nome: 'Pressões de Starling no glomérulo' },
                  { id: 'med-p2-soi2-urin-filtracao-2', nome: 'Taxa de filtração glomerular (TFG) e clearance' }
                ]
              },
              {
                id: 'med-p2-soi2-urin-reabsorcao',
                nome: 'Reabsorção e secreção tubular',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-urin-reabsorcao-1', nome: 'Túbulo proximal (reabsorção de Na⁺, glicose, aminoácidos, bicarbonato)' },
                  { id: 'med-p2-soi2-urin-reabsorcao-2', nome: 'Alça de Henle e mecanismo de contracorrente' },
                  { id: 'med-p2-soi2-urin-reabsorcao-3', nome: 'Túbulo distal e ducto coletor – regulação fina' },
                  { id: 'med-p2-soi2-urin-reabsorcao-4', nome: 'Aldosterona, ADH e peptídeo natriurético atrial' }
                ]
              },
              {
                id: 'med-p2-soi2-urin-acidobase',
                nome: 'Equilíbrio ácido-base',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-urin-acidobase-1', nome: 'Reabsorção e excreção de HCO₃⁻ e H⁺' },
                  { id: 'med-p2-soi2-urin-acidobase-2', nome: 'Acidose e alcalose metabólica/ respiratória (compensação renal)' }
                ]
              },
              {
                id: 'med-p2-soi2-urin-volume',
                nome: 'Controle do volume extracelular e pressão arterial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-urin-volume-1', nome: 'Sistema renina-angiotensina-aldosterona (SRAA)' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-soi2-integracao',
            nome: 'Integração Morfofuncional e Clínica (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-soi2-integracao-correlacao',
                nome: 'Correlação estrutura-função em agravos prevalentes',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-soi2-integracao-correlacao-1', nome: 'Diabetes mellitus tipo 1 e 2' },
                  { id: 'med-p2-soi2-integracao-correlacao-2', nome: 'Hipertireoidismo e hipotireoidismo' },
                  { id: 'med-p2-soi2-integracao-correlacao-3', nome: 'Doença de Cushing e Addison' },
                  { id: 'med-p2-soi2-integracao-correlacao-4', nome: 'Insuficiência renal aguda e crônica' },
                  { id: 'med-p2-soi2-integracao-correlacao-5', nome: 'Acidente vascular encefálico isquêmico e hemorrágico' },
                  { id: 'med-p2-soi2-integracao-correlacao-6', nome: 'Osteoporose e raquitismo/osteomalácia' }
                ]
              }
            ]
          }
        ]
      },
      // HAM II
      {
        id: 'med-p2-ham2',
        nome: 'HAM II',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p2-ham2-comunicacao',
            nome: 'Comunicação Médica Avançada',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-ham2-com-dificil',
                nome: 'Comunicação em situações difíceis',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-com-dificil-1', nome: 'Dar más notícias (protocolo SPIKES)' },
                  { id: 'med-p2-ham2-com-dificil-2', nome: 'Comunicação com pacientes agitados, agressivos ou confusos' },
                  { id: 'med-p2-ham2-com-dificil-3', nome: 'Comunicação com familiares em situações de luto' }
                ]
              },
              {
                id: 'med-p2-ham2-com-intercultural',
                nome: 'Comunicação intercultural e vulnerabilidade',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-com-intercultural-1', nome: 'Abordagem a pacientes em situação de rua, indígenas, LGBTQIA+, idosos frágeis' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-ham2-sbv',
            nome: 'Suporte Básico de Vida (SBV) – AHA/ERC 2020',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-ham2-sbv-cadeia',
                nome: 'Cadeia de sobrevivência e reconhecimento de PCR',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-sbv-cadeia-1', nome: 'Verificar responsividade, ativar emergência, pedir DEA' },
                  { id: 'med-p2-ham2-sbv-cadeia-2', nome: 'Avaliação de respiração e pulso carotídeo' }
                ]
              },
              {
                id: 'med-p2-ham2-sbv-rcp',
                nome: 'RCP de alta qualidade – adulto',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-sbv-rcp-1', nome: 'Compressões torácicas (profundidade, frequência, recoil)' },
                  { id: 'med-p2-ham2-sbv-rcp-2', nome: 'Ventilações com bolsa-máscara e via aérea básica' }
                ]
              },
              {
                id: 'med-p2-ham2-sbv-dea',
                nome: 'Uso do Desfibrilador Externo Automático (DEA)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-sbv-dea-1', nome: 'Técnica de uso e integração com RCP' }
                ]
              },
              {
                id: 'med-p2-ham2-sbv-pediatrico',
                nome: 'SBV pediátrico (lactente e criança)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-sbv-pediatrico-1', nome: 'Diferenças técnicas (profundidade, frequência, compressão com 2 dedos ou mãos)' },
                  { id: 'med-p2-ham2-sbv-pediatrico-2', nome: 'Engasgo (manobra de Heimlich e tapas/torácicas em bebê)' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-ham2-nervoso',
            nome: 'Exame Físico – Sistema Nervoso',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-ham2-neuro-basico',
                nome: 'Exame neurológico básico',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-neuro-basico-1', nome: 'Estado mental (nível de consciência, orientação, atenção)' },
                  { id: 'med-p2-ham2-neuro-basico-2', nome: 'Pares cranianos (II a XII – foco em III, IV, VI, VII, pupila)' },
                  { id: 'med-p2-ham2-neuro-basico-3', nome: 'Força muscular (escala 0–5), reflexos tendinosos' },
                  { id: 'med-p2-ham2-neuro-basico-4', nome: 'Sensibilidade tátil, dolorosa e vibratória' },
                  { id: 'med-p2-ham2-neuro-basico-5', nome: 'Coordenação (dedo-nariz, calcanhar-joelho), marcha e Romberg' }
                ]
              },
              {
                id: 'med-p2-ham2-neuro-meningea',
                nome: 'Sinais de irritação meníngea (rigidez de nuca, Kernig, Brudzinski)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-neuro-meningea-1', nome: 'Técnicas de avaliação de meningite' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-ham2-osteomuscular',
            nome: 'Exame Físico – Sistema Osteomuscular',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-ham2-osteo-inspecao',
                nome: 'Inspeção e palpação articular',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-osteo-inspecao-1', nome: 'Ombro (manobras de Neer, Hawkins, Yergason)' },
                  { id: 'med-p2-ham2-osteo-inspecao-2', nome: 'Joelho (Lachman, gaveta anterior/posterior, McMurray)' },
                  { id: 'med-p2-ham2-osteo-inspecao-3', nome: 'Coluna (Lasegue, Schober, manobra de Spurling)' },
                  { id: 'med-p2-ham2-osteo-inspecao-4', nome: 'Quadril (FABER, Trendelenburg)' }
                ]
              },
              {
                id: 'med-p2-ham2-osteo-marcha',
                nome: 'Avaliação de marcha e equilíbrio',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-osteo-marcha-1', nome: 'Testes de equilíbrio e coordenação motora' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-ham2-urinario',
            nome: 'Exame Físico – Sistema Urinário e Genital Masculino',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-ham2-urin-abdome',
                nome: 'Abdome e região lombar',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-urin-abdome-1', nome: 'Sinal de Giordano (punho-percussão)' },
                  { id: 'med-p2-ham2-urin-abdome-2', nome: 'Palpação renal (manobra de balotamento)' }
                ]
              },
              {
                id: 'med-p2-ham2-urin-genital',
                nome: 'Exame genital masculino',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-urin-genital-1', nome: 'Inspeção e palpação de bolsa escrotal, testículos, epidídimo' },
                  { id: 'med-p2-ham2-urin-genital-2', nome: 'Toque retal (próstata: tamanho, consistência, nódulos)' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-ham2-genital-feminino',
            nome: 'Exame Físico – Genital Feminino e Mamas',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-ham2-mamas-exame',
                nome: 'Exame das mamas',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-mamas-exame-1', nome: 'Inspeção (retratação, inversão de mamilo, pele em casca de laranja)' },
                  { id: 'med-p2-ham2-mamas-exame-2', nome: 'Palpação em quadrantes + axilas' }
                ]
              },
              {
                id: 'med-p2-ham2-gineco-exame',
                nome: 'Exame ginecológico básico',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-gineco-exame-1', nome: 'Inspeção de genitália externa' },
                  { id: 'med-p2-ham2-gineco-exame-2', nome: 'Toque vaginal bimanual (útero e anexos) – introdução supervisionada' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-ham2-endocrino',
            nome: 'Exame Físico – Sistema Endócrino',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-ham2-endo-tireoide',
                nome: 'Tireoide e pescoço',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-endo-tireoide-1', nome: 'Inspeção e palpação de tireoide (manobra de Pemberton)' },
                  { id: 'med-p2-ham2-endo-tireoide-2', nome: 'Sinal de Chvostek e Trousseau (hipoparatireoidismo)' }
                ]
              },
              {
                id: 'med-p2-ham2-endo-sinais',
                nome: 'Sinais de Cushing, acromegalia, mixedema',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-endo-sinais-1', nome: 'Identificação de sinais clínicos endócrinos' }
                ]
              }
            ]
          },
          {
            id: 'med-p2-ham2-treinamento',
            nome: 'Treinamento Prático e OSCE (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p2-ham2-treino-rcp',
                nome: 'Estações OSCE: RCP adulto/pediátrico + DEA',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-treino-rcp-1', nome: 'Prática de RCP em manequins' }
                ]
              },
              {
                id: 'med-p2-ham2-treino-neuro',
                nome: 'Exame neurológico completo em ator padronizado',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-treino-neuro-1', nome: 'Simulação de exame neurológico completo' }
                ]
              },
              {
                id: 'med-p2-ham2-treino-osteo',
                nome: 'Exame osteomuscular (ombro + joelho + coluna)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-treino-osteo-1', nome: 'Prática de manobras articulares' }
                ]
              },
              {
                id: 'med-p2-ham2-treino-toque',
                nome: 'Toque retal masculino e exame de mamas',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-treino-toque-1', nome: 'Prática supervisionada de exames' }
                ]
              },
              {
                id: 'med-p2-ham2-treino-teleconsulta',
                nome: 'Role-play de teleconsulta',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-treino-teleconsulta-1', nome: 'Simulação de atendimento remoto' }
                ]
              },
              {
                id: 'med-p2-ham2-treino-simulacao',
                nome: 'Simulação realística de PCR em adulto e criança',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p2-ham2-treino-simulacao-1', nome: 'Cenários realísticos de parada cardiorrespiratória' }
                ]
              }
            ]
          }
        ]
      }
    ],
    3: [
      // SOI III
      {
        id: 'med-p3-soi3',
        nome: 'SOI III',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p3-soi3-conceitos',
            nome: 'Conceitos Gerais de Fisiopatologia e Imunologia Aplicada',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-soi3-conceitos-inflamacao',
                nome: 'Resposta inflamatória aguda e crônica',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-conceitos-inflamacao-1', nome: 'Mediadores químicos da inflamação (histamina, prostaglandinas, leucotrienos, citocinas)' },
                  { id: 'med-p3-soi3-conceitos-inflamacao-2', nome: 'Resposta celular (neutrófilos, macrófagos, mastócitos)' },
                  { id: 'med-p3-soi3-conceitos-inflamacao-3', nome: 'Inflamação granulomatosa vs supurativa' }
                ]
              },
              {
                id: 'med-p3-soi3-conceitos-cicatrizacao',
                nome: 'Cicatrização e reparo tecidual',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-conceitos-cicatrizacao-1', nome: 'Cicatrização por primeira e segunda intenção, fatores de crescimento' }
                ]
              },
              {
                id: 'med-p3-soi3-conceitos-edema',
                nome: 'Edema e choque',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-conceitos-edema-1', nome: 'Mecanismos (aumento de pressão hidrostática, ↓ pressão oncótica, ↑ permeabilidade, obstrução linfática)' },
                  { id: 'med-p3-soi3-conceitos-edema-2', nome: 'Tipos de choque (hipovolêmico, cardiogênico, distributivo, obstrutivo)' }
                ]
              },
              {
                id: 'med-p3-soi3-conceitos-farmacologia',
                nome: 'Farmacologia geral aplicada',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-conceitos-farmacologia-1', nome: 'Farmacocinética e farmacodinâmica básica' },
                  { id: 'med-p3-soi3-conceitos-farmacologia-2', nome: 'Vias de administração, biodisponibilidade e meia-vida' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-soi3-cardio',
            nome: 'Sistema Cardiocirculatório – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-soi3-cardio-ic',
                nome: 'Insuficiência cardíaca',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-cardio-ic-1', nome: 'IC sistólica vs diastólica, fração de ejeção' },
                  { id: 'med-p3-soi3-cardio-ic-2', nome: 'Remodelamento cardíaco e neuro-hormonal (SRAA, sistema simpático, BNP)' },
                  { id: 'med-p3-soi3-cardio-ic-3', nome: 'Classificação NYHA e tratamento farmacológico (IECA, betabloqueadores, diuréticos, antagonistas da aldosterona)' }
                ]
              },
              {
                id: 'med-p3-soi3-cardio-isquemica',
                nome: 'Doença isquêmica do miocárdio',
                horasEstimadas: 45,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-cardio-isquemica-1', nome: 'Aterosclerose – patogênese e fatores de risco' },
                  { id: 'med-p3-soi3-cardio-isquemica-2', nome: 'Angina estável, instável e IAM (com e sem supradesnivelamento de ST)' },
                  { id: 'med-p3-soi3-cardio-isquemica-3', nome: 'Marcadores de necrose miocárdica e reperfusão' }
                ]
              },
              {
                id: 'med-p3-soi3-cardio-arritmias',
                nome: 'Arritmias cardíacas',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-cardio-arritmias-1', nome: 'Taquiarritmias supraventriculares e ventriculares' },
                  { id: 'med-p3-soi3-cardio-arritmias-2', nome: 'Bradicardias e bloqueios AV' }
                ]
              },
              {
                id: 'med-p3-soi3-cardio-has',
                nome: 'Hipertensão arterial sistêmica',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-cardio-has-1', nome: 'HAS primária vs secundária' },
                  { id: 'med-p3-soi3-cardio-has-2', nome: 'Crises hipertensivas e emergências' }
                ]
              },
              {
                id: 'med-p3-soi3-cardio-valvulares',
                nome: 'Doenças valvulares e endocardite',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-cardio-valvulares-1', nome: 'Estenose e insuficiência valvular' }
                ]
              },
              {
                id: 'med-p3-soi3-cardio-tromboembolismo',
                nome: 'Tromboembolismo venoso e embolia pulmonar',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-cardio-tromboembolismo-1', nome: 'Fisiopatologia e manejo' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-soi3-respiratorio',
            nome: 'Sistema Respiratório – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-soi3-resp-obstrutivas',
                nome: 'Doenças obstrutivas',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-resp-obstrutivas-1', nome: 'Asma brônquica – fisiopatologia e crise aguda' },
                  { id: 'med-p3-soi3-resp-obstrutivas-2', nome: 'DPOC – enfisema e bronquite crônica (tabagismo, α1-antitripsina)' }
                ]
              },
              {
                id: 'med-p3-soi3-resp-restritivas',
                nome: 'Doenças restritivas e intersticiais',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-resp-restritivas-1', nome: 'Fibrose pulmonar idiopática e pneumoconioses' }
                ]
              },
              {
                id: 'med-p3-soi3-resp-insuficiencia',
                nome: 'Insuficiência respiratória e hipoxemia',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-resp-insuficiencia-1', nome: 'Tipos (hipoxêmica e hipercápnica)' },
                  { id: 'med-p3-soi3-resp-insuficiencia-2', nome: 'Relação V/Q, shunt e espaço morto' }
                ]
              },
              {
                id: 'med-p3-soi3-resp-pneumonias',
                nome: 'Pneumonias (comunitária, hospitalar, aspirativa)',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-resp-pneumonias-1', nome: 'Etiologia, diagnóstico e tratamento' }
                ]
              },
              {
                id: 'med-p3-soi3-resp-tep',
                nome: 'Tromboembolismo pulmonar e hipertensão pulmonar',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-resp-tep-1', nome: 'Fisiopatologia e manejo' }
                ]
              },
              {
                id: 'med-p3-soi3-resp-derrame',
                nome: 'Derrame pleural e pneumotórax',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-resp-derrame-1', nome: 'Diagnóstico e tratamento' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-soi3-hemo',
            nome: 'Sistema Hemolinfopoiético – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-soi3-hemo-anemias',
                nome: 'Anemias',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-hemo-anemias-1', nome: 'Anemia ferropriva, megaloblástica, hemolíticas (falciforme, esferocitose)' },
                  { id: 'med-p3-soi3-hemo-anemias-2', nome: 'Anemia de doença crônica e aplástica' },
                  { id: 'med-p3-soi3-hemo-anemias-3', nome: 'Interpretação do hemograma e reticulócitos' }
                ]
              },
              {
                id: 'med-p3-soi3-hemo-leucopenias',
                nome: 'Leucopenias e leucocitoses',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-hemo-leucopenias-1', nome: 'Neutropenia, agranulocitose' }
                ]
              },
              {
                id: 'med-p3-soi3-hemo-sindromes',
                nome: 'Síndromes mieloproliferativas e linfoproliferativas',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-hemo-sindromes-1', nome: 'Leucemia mieloide crônica, leucemia linfoide aguda' },
                  { id: 'med-p3-soi3-hemo-sindromes-2', nome: 'Linfomas Hodgkin e não-Hodgkin (básico)' }
                ]
              },
              {
                id: 'med-p3-soi3-hemo-hemostasia',
                nome: 'Distúrbios hemostáticos',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-hemo-hemostasia-1', nome: 'Coagulopatias (hemofilia, doença de von Willebrand)' },
                  { id: 'med-p3-soi3-hemo-hemostasia-2', nome: 'CIVD e púrpura trombocitopênica' },
                  { id: 'med-p3-soi3-hemo-hemostasia-3', nome: 'Trombofilias e anticoagulação' }
                ]
              },
              {
                id: 'med-p3-soi3-hemo-transfusao',
                nome: 'Transfusão e reações transfusionais',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-hemo-transfusao-1', nome: 'Indicações e complicações' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-soi3-tegumentar',
            nome: 'Sistema Tegumentar – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-soi3-teg-dermatoses',
                nome: 'Dermatoses inflamatórias e alérgicas',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-teg-dermatoses-1', nome: 'Dermatite atópica, psoríase, urticária' },
                  { id: 'med-p3-soi3-teg-dermatoses-2', nome: 'Reações de hipersensibilidade tipos I–IV na pele' }
                ]
              },
              {
                id: 'med-p3-soi3-teg-infeccoes',
                nome: 'Infecções cutâneas bacterianas, virais e fúngicas',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-teg-infeccoes-1', nome: 'Impetigo, erisipela, herpes zoster, candidíase' },
                  { id: 'med-p3-soi3-teg-infeccoes-2', nome: 'Hanseníase e tuberculose cutânea' }
                ]
              },
              {
                id: 'med-p3-soi3-teg-queimaduras',
                nome: 'Queimaduras',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-teg-queimaduras-1', nome: 'Classificação, regra dos 9 de Wallace, reposição volêmica' }
                ]
              },
              {
                id: 'med-p3-soi3-teg-ulceras',
                nome: 'Úlceras de pressão e pé diabético',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-teg-ulceras-1', nome: 'Prevenção e tratamento' }
                ]
              },
              {
                id: 'med-p3-soi3-teg-neoplasias',
                nome: 'Neoplasias cutâneas (carcinoma basocelular, espinocelular, melanoma)',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-teg-neoplasias-1', nome: 'Diagnóstico e estadiamento' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-soi3-integracao',
            nome: 'Integração Clínica e Abordagem dos Principais Agravos (casos transversais)',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-soi3-integracao-casos',
                nome: 'Casos clínicos integrados',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-soi3-integracao-casos-1', nome: 'Infarto agudo do miocárdio' },
                  { id: 'med-p3-soi3-integracao-casos-2', nome: 'Insuficiência cardíaca descompensada' },
                  { id: 'med-p3-soi3-integracao-casos-3', nome: 'Crise asmática e exacerbação de DPOC' },
                  { id: 'med-p3-soi3-integracao-casos-4', nome: 'Pneumonia grave e sepse de foco pulmonar' },
                  { id: 'med-p3-soi3-integracao-casos-5', nome: 'Anemia grave e hemorragia digestiva alta' },
                  { id: 'med-p3-soi3-integracao-casos-6', nome: 'TEP de alto risco' },
                  { id: 'med-p3-soi3-integracao-casos-7', nome: 'Choque séptico e queimado grave' }
                ]
              }
            ]
          }
        ]
      },
      // HAM III
      {
        id: 'med-p3-ham3',
        nome: 'HAM III',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p3-ham3-cardio',
            nome: 'Semiologia Cardiovascular Avançada',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-cardio-precordial',
                nome: 'Inspeção e palpação precordial',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-cardio-precordial-1', nome: 'Ictus cordis, frêmito, impulsão, choque da ponta' },
                  { id: 'med-p3-ham3-cardio-precordial-2', nome: 'Bulhas hiperfonéticas, frêmito' }
                ]
              },
              {
                id: 'med-p3-ham3-cardio-ausculta',
                nome: 'Ausculta cardíaca',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-cardio-ausculta-1', nome: 'Focos de ausculta (aórtico, pulmonar, tricúspide, mitral)' },
                  { id: 'med-p3-ham3-cardio-ausculta-2', nome: 'B1, B2, B3, B4' },
                  { id: 'med-p3-ham3-cardio-ausculta-3', nome: 'Sopros sistólicos e diastólicos – identificação e manobras' }
                ]
              },
              {
                id: 'med-p3-ham3-cardio-pulso',
                nome: 'Pulso venoso jugular e edema',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-cardio-pulso-1', nome: 'Avaliação de PVJ e edema periférico' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-ham3-respiratorio',
            nome: 'Semiologia Respiratória Avançada',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-resp-inspecao',
                nome: 'Inspeção e palpação torácica',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-resp-inspecao-1', nome: 'Expansibilidade, frêmito toracovocal' },
                  { id: 'med-p3-ham3-resp-inspecao-2', nome: 'Sinal de TVE (timpanismo, macicez)' }
                ]
              },
              {
                id: 'med-p3-ham3-resp-percussao',
                nome: 'Percussão pulmonar',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-resp-percussao-1', nome: 'Macicez, submacicez, som claro pulmonar, timpanismo' }
                ]
              },
              {
                id: 'med-p3-ham3-resp-ausculta',
                nome: 'Ausculta pulmonar',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-resp-ausculta-1', nome: 'Murmúrio vesicular, broncovesicular, diminuído' },
                  { id: 'med-p3-ham3-resp-ausculta-2', nome: 'Estertores, sibilos, roncos, atrito pleural' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-ham3-hematologica',
            nome: 'Semiologia Hematológica e Linfática',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-hema-linfonodos',
                nome: 'Palpação de linfonodos',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-hema-linfonodos-1', nome: 'Cadeias cervicais, axilares, inguinais – tamanho, consistência, mobilidade, dor' }
                ]
              },
              {
                id: 'med-p3-ham3-hema-baço',
                nome: 'Baço e fígado (palpação e percussão)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-hema-baço-1', nome: 'Sinal de Castell, borda hepática, baço palpável' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-ham3-tegumentar',
            nome: 'Semiologia Tegumentar',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-teg-lesoes',
                nome: 'Lesões elementares da pele',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-teg-lesoes-1', nome: 'Mácula, pápula, nódulo, vesícula, bolha, pústula, crosta, escama, úlcera' },
                  { id: 'med-p3-ham3-teg-lesoes-2', nome: 'Lesões em alvo, livedo, púrpura palpável' }
                ]
              },
              {
                id: 'med-p3-ham3-teg-anexos',
                nome: 'Anexos cutâneos',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-teg-anexos-1', nome: 'Cabelo, unhas (baqueteamento, linhas de Beau, onicólise)' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-ham3-procedimentos',
            nome: 'Procedimentos Básicos I',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-proc-acesso',
                nome: 'Acesso venoso periférico',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-proc-acesso-1', nome: 'Escolha do cateter, técnica asséptica, fixação' },
                  { id: 'med-p3-ham3-proc-acesso-2', nome: 'Complicações (flebite, infiltração)' }
                ]
              },
              {
                id: 'med-p3-ham3-proc-gasometria',
                nome: 'Gasometria arterial',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-proc-gasometria-1', nome: 'Punção da radial (teste de Allen)' }
                ]
              },
              {
                id: 'med-p3-ham3-proc-sondagem-ng',
                nome: 'Sondagem nasogástrica',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-proc-sondagem-ng-1', nome: 'Técnica e indicações' }
                ]
              },
              {
                id: 'med-p3-ham3-proc-sondagem-vesical',
                nome: 'Sondagem vesical de alívio e demora (masculina e feminina)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-proc-sondagem-vesical-1', nome: 'Técnica asséptica e cuidados' }
                ]
              },
              {
                id: 'med-p3-ham3-proc-punção-lombar',
                nome: 'Punção lombar (técnica teórica + simulação)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-proc-punção-lombar-1', nome: 'Indicações e técnica' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-ham3-emergencias',
            nome: 'Abordagem das Principais Emergências Clínicas (SOI III)',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-emer-dor-toracica',
                nome: 'Dor torácica aguda',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-emer-dor-toracica-1', nome: 'Anamnese direcionada, exame físico focado, leitura de ECG básico' },
                  { id: 'med-p3-ham3-emer-dor-toracica-2', nome: 'Protocolo de SCA' }
                ]
              },
              {
                id: 'med-p3-ham3-emer-dispneia',
                nome: 'Dispneia aguda',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-emer-dispneia-1', nome: 'Insuficiência cardíaca descompensada, crise asmática, TEP' }
                ]
              },
              {
                id: 'med-p3-ham3-emer-choque',
                nome: 'Choque (reconhecimento e classificação)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-emer-choque-1', nome: 'Avaliação e manejo inicial' }
                ]
              },
              {
                id: 'med-p3-ham3-emer-anemia',
                nome: 'Anemia grave / hemorragia',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-emer-anemia-1', nome: 'Acesso venoso calibroso, transfusão de emergência' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-ham3-ecg',
            nome: 'Eletrocardiograma Básico',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-ecg-tecnica',
                nome: 'Técnica de realização e leitura sistemática',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-ecg-tecnica-1', nome: 'Colocação de eletrodos, derivações' },
                  { id: 'med-p3-ham3-ecg-tecnica-2', nome: 'Ritmo sinusal, BRD, BRE, extrassístoles, fibrilação atrial' }
                ]
              },
              {
                id: 'med-p3-ham3-ecg-isquemica',
                nome: 'Alterações isquêmicas',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-ecg-isquemica-1', nome: 'Supra e subdesnivelamento de ST, onda Q, inversão de T' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-ham3-exames',
            nome: 'Interpretação de Exames Complementares',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-exam-rx-torax',
                nome: 'Rx de tórax normal e patológico',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-exam-rx-torax-1', nome: 'Silhueta cardíaca, infiltrados, derrame pleural, pneumotórax' }
                ]
              },
              {
                id: 'med-p3-ham3-exam-hemograma',
                nome: 'Hemograma completo + coagulograma',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-exam-hemograma-1', nome: 'Interpretação de resultados' }
                ]
              },
              {
                id: 'med-p3-ham3-exam-marcadores',
                nome: 'BNP, troponina, D-dímero',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-exam-marcadores-1', nome: 'Significado clínico' }
                ]
              }
            ]
          },
          {
            id: 'med-p3-ham3-treinamento',
            nome: 'Treinamento Prático e OSCE (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p3-ham3-treino-cardio',
                nome: 'Estação OSCE – exame cardiovascular completo',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-treino-cardio-1', nome: 'Simulação de exame cardíaco' }
                ]
              },
              {
                id: 'med-p3-ham3-treino-resp',
                nome: 'Estação OSCE – exame respiratório completo',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-treino-resp-1', nome: 'Simulação de exame respiratório' }
                ]
              },
              {
                id: 'med-p3-ham3-treino-acesso',
                nome: 'Estação OSCE – acesso venoso periférico',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-treino-acesso-1', nome: 'Prática de punção venosa' }
                ]
              },
              {
                id: 'med-p3-ham3-treino-gaso',
                nome: 'Estação OSCE – gasometria arterial + sondagem vesical',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-treino-gaso-1', nome: 'Prática de procedimentos' }
                ]
              },
              {
                id: 'med-p3-ham3-treino-iam',
                nome: 'Simulação realística – dor torácica (IAM)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-treino-iam-1', nome: 'Cenário de infarto agudo do miocárdio' }
                ]
              },
              {
                id: 'med-p3-ham3-treino-eap',
                nome: 'Simulação realística – dispneia aguda (edema agudo de pulmão)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p3-ham3-treino-eap-1', nome: 'Cenário de edema agudo de pulmão' }
                ]
              }
            ]
          }
        ]
      }
    ],
    4: [
      // SOI IV
      {
        id: 'med-p4-soi4',
        nome: 'SOI IV',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p4-soi4-conceitos',
            nome: 'Conceitos Gerais Transversais de Fisiopatologia e Farmacologia',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-soi4-conceitos-estresse',
                nome: 'Resposta ao estresse e eixo hipotálamo-hipófise-adrenal',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-conceitos-estresse-1', nome: 'Eixo HPA e resposta ao estresse' }
                ]
              },
              {
                id: 'med-p4-soi4-conceitos-farmacologia',
                nome: 'Farmacologia clínica aplicada (continuação)',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-conceitos-farmacologia-1', nome: 'Antidiabéticos orais, insulina, antidiuréticos, diuréticos' },
                  { id: 'med-p4-soi4-conceitos-farmacologia-2', nome: 'Antiácidos, inibidores da bomba de próton, laxantes, antidiarreicos' }
                ]
              },
              {
                id: 'med-p4-soi4-conceitos-semiologia',
                nome: 'Semiologia abdominal e urológica básica',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-conceitos-semiologia-1', nome: 'Exame físico abdominal e urológico' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-soi4-endocrino',
            nome: 'Sistema Endócrino – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-soi4-endo-dm',
                nome: 'Diabetes mellitus',
                horasEstimadas: 45,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-endo-dm-1', nome: 'DM tipo 1 vs tipo 2 – patogênese e complicações agudas (cetoacidose, estado hiperosmolar)' },
                  { id: 'med-p4-soi4-endo-dm-2', nome: 'Complicações crônicas micro e macrovasculares' }
                ]
              },
              {
                id: 'med-p4-soi4-endo-tireoide',
                nome: 'Doenças da tireoide',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-endo-tireoide-1', nome: 'Hipotireoidismo e hipertireoidismo (incluindo crise tireotóxica)' },
                  { id: 'med-p4-soi4-endo-tireoide-2', nome: 'Nódulos tireoidianos e câncer de tireoide' }
                ]
              },
              {
                id: 'med-p4-soi4-endo-suprarrenal',
                nome: 'Doenças das suprarrenais',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-endo-suprarrenal-1', nome: 'Síndrome de Cushing, hiperaldosteronismo primário' },
                  { id: 'med-p4-soi4-endo-suprarrenal-2', nome: 'Insuficiência suprarrenal primária (Doença de Addison) e secundária' }
                ]
              },
              {
                id: 'med-p4-soi4-endo-calcio',
                nome: 'Distúrbios do metabolismo do cálcio',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-endo-calcio-1', nome: 'Hiperparatireoidismo, hipoparatireoidismo, hipercalcemia maligna' }
                ]
              },
              {
                id: 'med-p4-soi4-endo-obesidade',
                nome: 'Obesidade e síndrome metabólica',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-endo-obesidade-1', nome: 'Fisiopatologia e manejo' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-soi4-digestorio',
            nome: 'Sistema Digestório – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-soi4-dig-esofago',
                nome: 'Doenças do esôfago e estômago',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-dig-esofago-1', nome: 'DRGE e esôfago de Barrett' },
                  { id: 'med-p4-soi4-dig-esofago-2', nome: 'Úlcera péptica e infecção por H. pylori' },
                  { id: 'med-p4-soi4-dig-esofago-3', nome: 'Gastrites e câncer gástrico' }
                ]
              },
              {
                id: 'med-p4-soi4-dig-intestinal',
                nome: 'Doenças intestinais',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-dig-intestinal-1', nome: 'Doença inflamatória intestinal (Crohn e RCU)' },
                  { id: 'med-p4-soi4-dig-intestinal-2', nome: 'Síndrome do intestino irritável' },
                  { id: 'med-p4-soi4-dig-intestinal-3', nome: 'Doença celíaca e má-absorção' }
                ]
              },
              {
                id: 'med-p4-soi4-dig-diarreia',
                nome: 'Diarreia aguda e crônica',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-dig-diarreia-1', nome: 'Diarreias infecciosas, disbiose e C. difficile' }
                ]
              },
              {
                id: 'med-p4-soi4-dig-hepatobiliar',
                nome: 'Doenças hepatobiliares',
                horasEstimadas: 45,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-dig-hepatobiliar-1', nome: 'Hepatites virais (A, B, C) e autoimune' },
                  { id: 'med-p4-soi4-dig-hepatobiliar-2', nome: 'Esteatose hepática alcoólica e NASH' },
                  { id: 'med-p4-soi4-dig-hepatobiliar-3', nome: 'Cirrose e suas complicações (ascite, HTP, encefalopatia)' },
                  { id: 'med-p4-soi4-dig-hepatobiliar-4', nome: 'Colelitíase, colecistite e coledocolitíase' }
                ]
              },
              {
                id: 'med-p4-soi4-dig-pancreas',
                nome: 'Pancreatopatias',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-dig-pancreas-1', nome: 'Pancreatite aguda e crônica' },
                  { id: 'med-p4-soi4-dig-pancreas-2', nome: 'Câncer de pâncreas' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-soi4-renal',
            nome: 'Sistema Renal e Vias Urinárias – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-soi4-renal-sindrome',
                nome: 'Síndrome nefrítica e nefrótica',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-renal-sindrome-1', nome: 'Glomerulonefrites (pós-estreptocócica, lúpica, IgA)' },
                  { id: 'med-p4-soi4-renal-sindrome-2', nome: 'Síndrome nefrótica mínima mudança, ESF, amiloidose' }
                ]
              },
              {
                id: 'med-p4-soi4-renal-insuficiencia',
                nome: 'Insuficiência renal aguda e crônica',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-renal-insuficiencia-1', nome: 'IRA pré-renal, renal e pós-renal' },
                  { id: 'med-p4-soi4-renal-insuficiencia-2', nome: 'DRC estádios, anemia e doença ósseo-mineral' }
                ]
              },
              {
                id: 'med-p4-soi4-renal-hidroeletrolinico',
                nome: 'Distúrbios hidroeletrolíticos e ácido-base',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-renal-hidroeletrolinico-1', nome: 'Hiponatremia, hipernatremia, hipocalemia, hipercalemia' },
                  { id: 'med-p4-soi4-renal-hidroeletrolinico-2', nome: 'Acidose e alcalose metabólica/respiratória' }
                ]
              },
              {
                id: 'med-p4-soi4-renal-infeccoes',
                nome: 'Infecções urinárias e pielonefrite',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-renal-infeccoes-1', nome: 'Diagnóstico e tratamento' }
                ]
              },
              {
                id: 'med-p4-soi4-renal-litiase',
                nome: 'Litíase urinária e cólica renal',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-renal-litiase-1', nome: 'Fisiopatologia e manejo' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-soi4-urogenital',
            nome: 'Sistema Urogenital/Reprodutor – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-soi4-urogen-dst',
                nome: 'Doenças sexualmente transmissíveis',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-urogen-dst-1', nome: 'Sífilis, gonorreia, clamídia, HPV, herpes genital' },
                  { id: 'med-p4-soi4-urogen-dst-2', nome: 'HIV básico (estádios e profilaxia)' }
                ]
              },
              {
                id: 'med-p4-soi4-urogen-gineco',
                nome: 'Doenças ginecológicas',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-urogen-gineco-1', nome: 'Mioma uterino, endometriose, SOP' },
                  { id: 'med-p4-soi4-urogen-gineco-2', nome: 'Sangramento uterino disfuncional' },
                  { id: 'med-p4-soi4-urogen-gineco-3', nome: 'Câncer de colo do útero e rastreamento (Papanicolaou)' }
                ]
              },
              {
                id: 'med-p4-soi4-urogen-mama',
                nome: 'Doenças da mama',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-urogen-mama-1', nome: 'Mastites, fibroadenoma, câncer de mama' }
                ]
              },
              {
                id: 'med-p4-soi4-urogen-prostatica',
                nome: 'Doenças prostáticas',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-urogen-prostatica-1', nome: 'HPB e prostatite' },
                  { id: 'med-p4-soi4-urogen-prostatica-2', nome: 'Câncer de próstata e PSA' }
                ]
              },
              {
                id: 'med-p4-soi4-urogen-disfuncao',
                nome: 'Disfunção erétil e infertilidade (básico)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-urogen-disfuncao-1', nome: 'Etiologia e manejo' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-soi4-exames',
            nome: 'Exames Complementares (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-soi4-exam-interpretacao',
                nome: 'Interpretação de exames',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-exam-interpretacao-1', nome: 'Função hepática (TGO/TGP, bilirrubinas, albumina, INR)' },
                  { id: 'med-p4-soi4-exam-interpretacao-2', nome: 'Função renal (creatinina, ureia, clearance, proteinúria)' },
                  { id: 'med-p4-soi4-exam-interpretacao-3', nome: 'Glicemia, HbA1c, TSH, T4 livre, cortisol' },
                  { id: 'med-p4-soi4-exam-interpretacao-4', nome: 'USG abdominal, TC de abdome, endoscopia digestiva alta' },
                  { id: 'med-p4-soi4-exam-interpretacao-5', nome: 'Uro-TC, PSA, colpocitologia oncótica' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-soi4-integracao',
            nome: 'Integração Clínica – Principais Agravos (casos transversais)',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-soi4-integracao-casos',
                nome: 'Casos clínicos integrados',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-soi4-integracao-casos-1', nome: 'Abdome agudo (apendicite, colecistite, pancreatite, perfuração)' },
                  { id: 'med-p4-soi4-integracao-casos-2', nome: 'Hemorragia digestiva alta e baixa' },
                  { id: 'med-p4-soi4-integracao-casos-3', nome: 'Icterícia obstrutiva vs hepatocelular' },
                  { id: 'med-p4-soi4-integracao-casos-4', nome: 'Diabetes descompensado (cetoacidose e hiperosmolar)' },
                  { id: 'med-p4-soi4-integracao-casos-5', nome: 'Insuficiência renal aguda com hipercalemia' },
                  { id: 'med-p4-soi4-integracao-casos-6', nome: 'Cirrose descompensada com ascite e peritonite bacteriana espontânea' },
                  { id: 'med-p4-soi4-integracao-casos-7', nome: 'Cólica renal e pielonefrite grave' }
                ]
              }
            ]
          }
        ]
      },
      // HAM IV
      {
        id: 'med-p4-ham4',
        nome: 'HAM IV',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p4-ham4-abdominal',
            nome: 'Semiologia Abdominal Avançada',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-abdominal-inspecao',
                nome: 'Inspeção abdominal',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-abdominal-inspecao-1', nome: 'Distensão, cicatrizes, circulação colateral, hérnias' },
                  { id: 'med-p4-ham4-abdominal-inspecao-2', nome: 'Sinal de Cullen e Grey-Turner' }
                ]
              },
              {
                id: 'med-p4-ham4-abdominal-ausculta',
                nome: 'Ausculta abdominal',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-abdominal-ausculta-1', nome: 'Ruídos hidroaéreos normais, hiper/hipoativos, sopros vasculares' }
                ]
              },
              {
                id: 'med-p4-ham4-abdominal-percussao',
                nome: 'Percussão abdominal',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-abdominal-percussao-1', nome: 'Macicez móvel, timpanismo, sinal do piparote' }
                ]
              },
              {
                id: 'med-p4-ham4-abdominal-palpacao',
                nome: 'Palpação superficial e profunda',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-abdominal-palpacao-1', nome: 'Sinal de Murphy, Rovsing, Blumberg, McBurney' },
                  { id: 'med-p4-ham4-abdominal-palpacao-2', nome: 'Palpação de fígado, baço e massas' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-ham4-renal',
            nome: 'Semiologia Renal e Urológica',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-renal-lombar',
                nome: 'Região lombar e abdome',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-renal-lombar-1', nome: 'Sinal de Giordano, manobra de balotamento renal' }
                ]
              },
              {
                id: 'med-p4-ham4-renal-genital',
                nome: 'Exame genital masculino completo (revisão + avançado)',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-renal-genital-1', nome: 'Palpação de próstata (toque retal), hérnias inguinais' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-ham4-ginecologico',
            nome: 'Semiologia Ginecológica e Mamas (continuação)',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-gineco-completo',
                nome: 'Exame ginecológico completo',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-gineco-completo-1', nome: 'Posição ginecológica, inspeção vulvar, espéculo' },
                  { id: 'med-p4-ham4-gineco-completo-2', nome: 'Toque vaginal bimanual (útero, anexos, fundo de saco)' }
                ]
              },
              {
                id: 'med-p4-ham4-gineco-papanicolaou',
                nome: 'Coleta de colpocitologia oncótica (Papanicolaou)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-gineco-papanicolaou-1', nome: 'Técnica de coleta e preparação' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-ham4-endocrino',
            nome: 'Semiologia Endócrina Avançada',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-endo-pescoço',
                nome: 'Pescoço e tireoide',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-endo-pescoço-1', nome: 'Palpação tireoidiana (manobra de Lahey e Pemberton)' }
                ]
              },
              {
                id: 'med-p4-ham4-endo-sinais',
                nome: 'Sinais específicos',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-endo-sinais-1', nome: 'Oftalmopatia de Graves, mixedema pretibial' },
                  { id: 'med-p4-ham4-endo-sinais-2', nome: 'Acantose nigricans, estrias rubras de Cushing' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-ham4-procedimentos',
            nome: 'Procedimentos Intermediários',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-proc-punção-lombar',
                nome: 'Punção lombar (prática em manequim)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-proc-punção-lombar-1', nome: 'Técnica e indicações' }
                ]
              },
              {
                id: 'med-p4-ham4-proc-paracentese',
                nome: 'Paracentese abdominal (técnica + indicações)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-proc-paracentese-1', nome: 'Técnica asséptica' }
                ]
              },
              {
                id: 'med-p4-ham4-proc-toracocentese',
                nome: 'Toracocentese (técnica + indicações)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-proc-toracocentese-1', nome: 'Técnica e cuidados' }
                ]
              },
              {
                id: 'med-p4-ham4-proc-cateterismo',
                nome: 'Cateterismo venoso central (técnica teórica + simulação)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-proc-cateterismo-1', nome: 'Indicações e técnica' }
                ]
              },
              {
                id: 'med-p4-ham4-proc-biopsia',
                nome: 'Biópsia de medular (técnica teórica)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-proc-biopsia-1', nome: 'Indicações e técnica' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-ham4-emergencias',
            nome: 'Abordagem das Principais Emergências Clínicas',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-emer-abdome',
                nome: 'Abdome agudo',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-emer-abdome-1', nome: 'Apendicite, colecistite, pancreatite, úlcera perfurada' },
                  { id: 'med-p4-ham4-emer-abdome-2', nome: 'Exame físico focado + sinais de irritação peritoneal' }
                ]
              },
              {
                id: 'med-p4-ham4-emer-hemorragia',
                nome: 'Hemorragia digestiva alta e baixa',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-emer-hemorragia-1', nome: 'Protocolo de reposição volêmica, acesso venoso calibroso' }
                ]
              },
              {
                id: 'med-p4-ham4-emer-ictericia',
                nome: 'Icterícia obstrutiva vs hepatocelular',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-emer-ictericia-1', nome: 'Diagnóstico diferencial' }
                ]
              },
              {
                id: 'med-p4-ham4-emer-cetoacidose',
                nome: 'Cetoacidose diabética e estado hiperosmolar',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-emer-cetoacidose-1', nome: 'Reconhecimento e manejo inicial' }
                ]
              },
              {
                id: 'med-p4-ham4-emer-ira',
                nome: 'Insuficiência renal aguda com hipercalemia ameaçadora',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-emer-ira-1', nome: 'Avaliação e tratamento de emergência' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-ham4-exames-imagem',
            nome: 'Exames Complementares e Imagem',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-exam-usg',
                nome: 'Ultrassonografia abdominal',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-exam-usg-1', nome: 'Fígado esteatótico, litíase biliar, hidronefrose' }
                ]
              },
              {
                id: 'med-p4-ham4-exam-endoscopia',
                nome: 'Endoscopia digestiva alta',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-exam-endoscopia-1', nome: 'Indicações e achados' }
                ]
              },
              {
                id: 'med-p4-ham4-exam-tc',
                nome: 'Tomografia de abdome',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-exam-tc-1', nome: 'Interpretação de achados' }
                ]
              },
              {
                id: 'med-p4-ham4-exam-marcadores',
                nome: 'Marcadores tumorais (PSA, CEA, CA 19-9, AFP)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-exam-marcadores-1', nome: 'Significado clínico (básico)' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-ham4-laboratoriais',
            nome: 'Interpretação de Exames Laboratoriais',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-lab-hepatico',
                nome: 'Perfil hepático (TGO/TGP, FA, GGT, bilirrubinas)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-lab-hepatico-1', nome: 'Interpretação de resultados' }
                ]
              },
              {
                id: 'med-p4-ham4-lab-renal',
                nome: 'Função renal (creatinina, ureia, eletrólitos, gasometria venosa)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-lab-renal-1', nome: 'Interpretação de resultados' }
                ]
              },
              {
                id: 'med-p4-ham4-lab-glicemico',
                nome: 'Perfil glicêmico (glicemia de jejum, HbA1c, cetonemia)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-lab-glicemico-1', nome: 'Interpretação de resultados' }
                ]
              },
              {
                id: 'med-p4-ham4-lab-pancreatico',
                nome: 'Amilase, lipase, lactato',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-lab-pancreatico-1', nome: 'Significado clínico' }
                ]
              }
            ]
          },
          {
            id: 'med-p4-ham4-treinamento',
            nome: 'Treinamento Prático e OSCE (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p4-ham4-treino-abdominal',
                nome: 'Estação OSCE – exame abdominal completo',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-treino-abdominal-1', nome: 'Simulação de exame abdominal' }
                ]
              },
              {
                id: 'med-p4-ham4-treino-gineco',
                nome: 'Estação OSCE – exame ginecológico + coleta de Papanicolaou',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-treino-gineco-1', nome: 'Prática supervisionada' }
                ]
              },
              {
                id: 'med-p4-ham4-treino-punção',
                nome: 'Estação OSCE – punção lombar em manequim',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-treino-punção-1', nome: 'Prática de técnica' }
                ]
              },
              {
                id: 'med-p4-ham4-treino-abdome-agudo',
                nome: 'Simulação realística – abdome agudo (apendicite)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-treino-abdome-agudo-1', nome: 'Cenário de apendicite' }
                ]
              },
              {
                id: 'med-p4-ham4-treino-cetoacidose',
                nome: 'Simulação realística – cetoacidose diabética',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-treino-cetoacidose-1', nome: 'Cenário de descompensação diabética' }
                ]
              },
              {
                id: 'med-p4-ham4-treino-hemorragia',
                nome: 'Simulação realística – hemorragia digestiva alta',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p4-ham4-treino-hemorragia-1', nome: 'Cenário de hemorragia gastrointestinal' }
                ]
              }
            ]
          }
        ]
      }
    ],
    5: [
      // SOI V
      {
        id: 'med-p5-soi5',
        nome: 'SOI V',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p5-soi5-locomotor',
            nome: 'Sistema Locomotor – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-soi5-locomotor-articular',
                nome: 'Doenças articulares degenerativas e inflamatórias',
                horasEstimadas: 45,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-locomotor-articular-1', nome: 'Osteoartrite (artrose) – joelho, quadril, coluna' },
                  { id: 'med-p5-soi5-locomotor-articular-2', nome: 'Artrite reumatoide – critérios ACR/EULAR' },
                  { id: 'med-p5-soi5-locomotor-articular-3', nome: 'Lúpus eritematoso sistêmico e espondiloartrites (espondilite anquilosante, artrite psoriásica)' },
                  { id: 'med-p5-soi5-locomotor-articular-4', nome: 'Gota e artrite por pirofosfato' }
                ]
              },
              {
                id: 'med-p5-soi5-locomotor-ossea',
                nome: 'Doenças ósseas metabólicas',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-locomotor-ossea-1', nome: 'Osteoporose primária e secundária' },
                  { id: 'med-p5-soi5-locomotor-ossea-2', nome: 'Doença de Paget, osteomalácia' }
                ]
              },
              {
                id: 'med-p5-soi5-locomotor-fraturas',
                nome: 'Fraturas e complicações',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-locomotor-fraturas-1', nome: 'Consolidação, retardo, pseudoartrose, tromboembolismo' }
                ]
              },
              {
                id: 'med-p5-soi5-locomotor-dor',
                nome: 'Lombalgia e cervicalgia',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-locomotor-dor-1', nome: 'Hérnia discal, estenose de canal, radiculopatia' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-soi5-nervoso',
            nome: 'Sistema Nervoso – Fisiopatologia e Clínica',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-soi5-nervoso-ave',
                nome: 'Acidente vascular encefálico (AVE)',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-nervoso-ave-1', nome: 'AVE isquêmico (trombótico/embólico) vs hemorrágico' },
                  { id: 'med-p5-soi5-nervoso-ave-2', nome: 'Janela terapêutica, trombólise, trombectomia' }
                ]
              },
              {
                id: 'med-p5-soi5-nervoso-desmielinizantes',
                nome: 'Doenças desmielinizantes',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-nervoso-desmielinizantes-1', nome: 'Esclerose múltipla' },
                  { id: 'med-p5-soi5-nervoso-desmielinizantes-2', nome: 'Síndrome de Guillain-Barré' }
                ]
              },
              {
                id: 'med-p5-soi5-nervoso-neurodegenerativas',
                nome: 'Doenças neurodegenerativas',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-nervoso-neurodegenerativas-1', nome: 'Doença de Parkinson' },
                  { id: 'med-p5-soi5-nervoso-neurodegenerativas-2', nome: 'Doença de Alzheimer e demências' }
                ]
              },
              {
                id: 'med-p5-soi5-nervoso-epilepsia',
                nome: 'Epilepsia e estado de mal epiléptico',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-nervoso-epilepsia-1', nome: 'Classificação, diagnóstico e tratamento' }
                ]
              },
              {
                id: 'med-p5-soi5-nervoso-meningites',
                nome: 'Meningites e encefalites',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-nervoso-meningites-1', nome: 'Etiologia, diagnóstico e manejo' }
                ]
              },
              {
                id: 'med-p5-soi5-nervoso-neuropatias',
                nome: 'Neuropatias periféricas (diabética, alcoólica, carencial)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-nervoso-neuropatias-1', nome: 'Fisiopatologia e manifestações clínicas' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-soi5-psiquiatria',
            nome: 'Saúde Mental – Psiquiatria',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-soi5-psiq-ansiedade',
                nome: 'Transtornos de ansiedade e depressão',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-psiq-ansiedade-1', nome: 'TAG, transtorno de pânico, depressão maior' },
                  { id: 'med-p5-soi5-psiq-ansiedade-2', nome: 'ISRS, IRSN, benzodiazepínicos' }
                ]
              },
              {
                id: 'med-p5-soi5-psiq-bipolar',
                nome: 'Transtorno bipolar do humor',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-psiq-bipolar-1', nome: 'Episódios maníacos e depressivos' }
                ]
              },
              {
                id: 'med-p5-soi5-psiq-esquizofrenia',
                nome: 'Esquizofrenia e transtornos psicóticos',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-psiq-esquizofrenia-1', nome: 'Sintomas positivos e negativos' }
                ]
              },
              {
                id: 'med-p5-soi5-psiq-substancias',
                nome: 'Transtornos relacionados a substâncias (álcool, crack, cannabis)',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-psiq-substancias-1', nome: 'Dependência e síndrome de abstinência' }
                ]
              },
              {
                id: 'med-p5-soi5-psiq-suicidio',
                nome: 'Tentativa de suicídio e emergência psiquiátrica',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-psiq-suicidio-1', nome: 'Avaliação de risco e manejo' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-soi5-sentidos',
            nome: 'Órgãos dos Sentidos',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-soi5-sent-oftalmologia',
                nome: 'Oftalmologia',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-sent-oftalmologia-1', nome: 'Catarata, glaucoma (ângulo aberto/fechado)' },
                  { id: 'med-p5-soi5-sent-oftalmologia-2', nome: 'Retinopatia diabética e hipertensiva' },
                  { id: 'med-p5-soi5-sent-oftalmologia-3', nome: 'Degeneração macular relacionada à idade' },
                  { id: 'med-p5-soi5-sent-oftalmologia-4', nome: 'Conjuntivite, uveíte, descolamento de retina' }
                ]
              },
              {
                id: 'med-p5-soi5-sent-orl',
                nome: 'Otorrinolaringologia',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-sent-orl-1', nome: 'Otite média aguda e crônica, sinusite' },
                  { id: 'med-p5-soi5-sent-orl-2', nome: 'Vertigem posicional paroxística benigna, doença de Ménière' },
                  { id: 'med-p5-soi5-sent-orl-3', nome: 'Perda auditiva neurossensorial e condutiva' },
                  { id: 'med-p5-soi5-sent-orl-4', nome: 'Epistaxe, câncer de laringe, nódulo de corda vocal' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-soi5-endocrino-avancado',
            nome: 'Sistema Endócrino – Temas Avançados (complementação do SOI IV)',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-soi5-endo-hipofise',
                nome: 'Doenças da hipófise',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-endo-hipofise-1', nome: 'Acromegalia, prolactinoma, diabetes insípido' },
                  { id: 'med-p5-soi5-endo-hipofise-2', nome: 'Doença de Cushing hipófise-dependente' }
                ]
              },
              {
                id: 'med-p5-soi5-endo-nem',
                nome: 'Neoplasias endócrinas múltiplas (NEM 1 e 2)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-endo-nem-1', nome: 'Síndromes hereditárias' }
                ]
              },
              {
                id: 'med-p5-soi5-endo-paratireoide',
                nome: 'Doenças da paratireoide e feocromocitoma',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-endo-paratireoide-1', nome: 'Hiperparatireoidismo e feocromocitoma' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-soi5-exames',
            nome: 'Exames Complementares e Imagem (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-soi5-exam-imagem',
                nome: 'Exames de imagem e complementares',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-exam-imagem-1', nome: 'TC e RM de crânio (AVE, tumores, hidrocefalia)' },
                  { id: 'med-p5-soi5-exam-imagem-2', nome: 'Eletroneuromiografia, EEG, liquor' },
                  { id: 'med-p5-soi5-exam-imagem-3', nome: 'RX e densitometria óssea' },
                  { id: 'med-p5-soi5-exam-imagem-4', nome: 'Campimetria, tonometria, gonioscopia' },
                  { id: 'med-p5-soi5-exam-imagem-5', nome: 'Audiometria tonal e imitanciometria' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-soi5-integracao',
            nome: 'Integração Clínica – Principais Emergências e Casos (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-soi5-integracao-casos',
                nome: 'Casos clínicos integrados',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-soi5-integracao-casos-1', nome: 'AVE agudo' },
                  { id: 'med-p5-soi5-integracao-casos-2', nome: 'Crise convulsiva e estado de mal epiléptico' },
                  { id: 'med-p5-soi5-integracao-casos-3', nome: 'Lombociatalgia aguda com déficit neurológico' },
                  { id: 'med-p5-soi5-integracao-casos-4', nome: 'Fratura de fêmur em idoso osteoporose' },
                  { id: 'med-p5-soi5-integracao-casos-5', nome: 'Glaucoma agudo perda visual súbita' },
                  { id: 'med-p5-soi5-integracao-casos-6', nome: 'Surdez súbita e vertigem periférica grave' },
                  { id: 'med-p5-soi5-integracao-casos-7', nome: 'Surto psicótico tentativa de suicídio' },
                  { id: 'med-p5-soi5-integracao-casos-8', nome: 'Cetoacidose por omissão de insulina em DM1' }
                ]
              }
            ]
          }
        ]
      },
      // HAM V
      {
        id: 'med-p5-ham5',
        nome: 'HAM V',
        incluido: false,
        subtopicos: [
          {
            id: 'med-p5-ham5-neuro',
            nome: 'Semiologia Neurológica Completa',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-neuro-mental',
                nome: 'Exame do estado mental',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-neuro-mental-1', nome: 'Nível de consciência (Glasgow), orientação, atenção, memória, linguagem' },
                  { id: 'med-p5-ham5-neuro-mental-2', nome: 'Mini-Mental (MMSE) e MoCA básico' }
                ]
              },
              {
                id: 'med-p5-ham5-neuro-pares',
                nome: 'Pares cranianos completo',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-neuro-pares-1', nome: 'I ao XII – foco em III/IV/VI (motricidade ocular), V (sensibilidade facial), VII (facial), VIII (audição + nistagmo), IX/X (faringe/laringe)' }
                ]
              },
              {
                id: 'med-p5-ham5-neuro-motricidade',
                nome: 'Motricidade, sensibilidade e reflexos',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-neuro-motricidade-1', nome: 'Escala de força 0–5, reflexos profundos, Babinski, Hoffmann, clonus' }
                ]
              },
              {
                id: 'med-p5-ham5-neuro-coordenacao',
                nome: 'Coordenação, marcha e equilíbrio',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-neuro-coordenacao-1', nome: 'Dedo-nariz, calcanhar-joelho, Romberg, marcha tandem' }
                ]
              },
              {
                id: 'med-p5-ham5-neuro-meningeos',
                nome: 'Sinais meníngeos e rigidez de nuca',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-neuro-meningeos-1', nome: 'Kernig, Brudzinski, Lasègue' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-ham5-psiquiatrica',
            nome: 'Semiologia Psiquiátrica',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-psiq-exame',
                nome: 'Exame psíquico estruturado',
                horasEstimadas: 35,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-psiq-exame-1', nome: 'Aparência, atitude, consciência, atenção, orientação' },
                  { id: 'med-p5-ham5-psiq-exame-2', nome: 'Humor/afeto, pensamento (curso, forma, conteúdo), percepção (alucinações)' },
                  { id: 'med-p5-ham5-psiq-exame-3', nome: 'Insight, juízo crítico, risco suicida/homicida' }
                ]
              },
              {
                id: 'med-p5-ham5-psiq-risco',
                nome: 'Avaliação de risco suicida (SAD PERSONS)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-psiq-risco-1', nome: 'Protocolo de avaliação' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-ham5-oftalmologica',
            nome: 'Semiologia Oftalmológica',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-oftal-acuidade',
                nome: 'Acuidade visual, reflexos pupilares, motricidade ocular',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-oftal-acuidade-1', nome: 'Testes de visão e motricidade' }
                ]
              },
              {
                id: 'med-p5-ham5-oftal-fundo',
                nome: 'Fundo de olho (papila, mácula, vasos)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-oftal-fundo-1', nome: 'Oftalmoscopia' }
                ]
              },
              {
                id: 'med-p5-ham5-oftal-tonometria',
                nome: 'Tonometria (método de aplanação) e campimetria por confrontação',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-oftal-tonometria-1', nome: 'Técnicas de avaliação' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-ham5-orl',
            nome: 'Semiologia Otorrinolaringológica',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-orl-otoscopia',
                nome: 'Otoscopia, Rinoscopia anterior, oroscopia',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-orl-otoscopia-1', nome: 'Técnicas de inspeção' }
                ]
              },
              {
                id: 'med-p5-ham5-orl-provas',
                nome: 'Prova de Rinne e Weber',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-orl-provas-1', nome: 'Avaliação auditiva' }
                ]
              },
              {
                id: 'med-p5-ham5-orl-testes',
                nome: 'Teste do sussurro, diapasão 512 Hz, nistagmo',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-orl-testes-1', nome: 'Testes de audição e equilíbrio' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-ham5-osteomuscular-avancado',
            nome: 'Semiologia Osteomuscular Avançada',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-osteo-manobras',
                nome: 'Manobras específicas',
                horasEstimadas: 40,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-osteo-manobras-1', nome: 'Ombro (Neer, Hawkins, Jobe, Yergason)' },
                  { id: 'med-p5-ham5-osteo-manobras-2', nome: 'Joelho (Lachman, gaveta, pivot-shift, McMurray, Apley)' },
                  { id: 'med-p5-ham5-osteo-manobras-3', nome: 'Coluna cervical (Spurling) e lombar (Lasègue, SLR cruzado)' },
                  { id: 'med-p5-ham5-osteo-manobras-4', nome: 'Quadril (FABER/Patrick, Trendelenburg)' }
                ]
              },
              {
                id: 'med-p5-ham5-osteo-reumatologica',
                nome: 'Avaliação reumatológica (DAS28 básico, sinais de artrite)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-osteo-reumatologica-1', nome: 'Avaliação de artrite' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-ham5-procedimentos-avancados',
            nome: 'Procedimentos Avançados',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-proc-punção-real',
                nome: 'Punção lombar real (em paciente supervisionado)',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-proc-punção-real-1', nome: 'Técnica em paciente' }
                ]
              },
              {
                id: 'med-p5-ham5-proc-sutura',
                nome: 'Sutura simples e em pontos separados',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-proc-sutura-1', nome: 'Técnica de sutura' }
                ]
              },
              {
                id: 'med-p5-ham5-proc-retirada-pontos',
                nome: 'Retirada de pontos e curativo complexo',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-proc-retirada-pontos-1', nome: 'Técnicas de cuidado de feridas' }
                ]
              },
              {
                id: 'med-p5-ham5-proc-infiltracao',
                nome: 'Infiltração articular/intratendínea',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-proc-infiltracao-1', nome: 'Técnica de infiltração' }
                ]
              },
              {
                id: 'med-p5-ham5-proc-imobilizacao',
                nome: 'Imobilização gessada básica (punho, tornozelo)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-proc-imobilizacao-1', nome: 'Técnica de imobilização' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-ham5-emergencias',
            nome: 'Abordagem das Principais Emergências',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-emer-ave',
                nome: 'Acidente vascular encefálico (AVE) agudo',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-emer-ave-1', nome: 'Escala NIHSS, FAST, janela terapêutica' }
                ]
              },
              {
                id: 'med-p5-ham5-emer-convulsao',
                nome: 'Crise convulsiva e estado de mal epiléptico',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-emer-convulsao-1', nome: 'Manejo de emergência' }
                ]
              },
              {
                id: 'med-p5-ham5-emer-cefaleia',
                nome: 'Cefaleia súbita + meningite',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-emer-cefaleia-1', nome: 'Diagnóstico diferencial' }
                ]
              },
              {
                id: 'med-p5-ham5-emer-visual',
                nome: 'Perda visual aguda (glaucoma de ângulo fechado, oclusão arterial retiniana)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-emer-visual-1', nome: 'Avaliação e manejo' }
                ]
              },
              {
                id: 'med-p5-ham5-emer-auditiva',
                nome: 'Surdez súbita e vertigem central vs periférica',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-emer-auditiva-1', nome: 'Diagnóstico diferencial' }
                ]
              },
              {
                id: 'med-p5-ham5-emer-suicidio',
                nome: 'Tentativa de suicídio e agitação psicomotora',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-emer-suicidio-1', nome: 'Protocolo de segurança' }
                ]
              },
              {
                id: 'med-p5-ham5-emer-trauma',
                nome: 'Traumatismo raquimedular e fratura com déficit neurológico',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-emer-trauma-1', nome: 'Manejo inicial' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-ham5-exames',
            nome: 'Exames Complementares e Imagem',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-exam-tc-rm',
                nome: 'TC e RM de crânio (AVE, tumores, hidrocefalia)',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-exam-tc-rm-1', nome: 'Interpretação de imagens' }
                ]
              },
              {
                id: 'med-p5-ham5-exam-liquor',
                nome: 'Liquor (análise básica: celularidade, proteína, glicose)',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-exam-liquor-1', nome: 'Interpretação de resultados' }
                ]
              },
              {
                id: 'med-p5-ham5-exam-neuro',
                nome: 'Eletroneuromiografia e EEG básico',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-exam-neuro-1', nome: 'Interpretação de traçados' }
                ]
              },
              {
                id: 'med-p5-ham5-exam-audio-campo',
                nome: 'Audiometria, campimetria computadorizada',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-exam-audio-campo-1', nome: 'Interpretação de resultados' }
                ]
              },
              {
                id: 'med-p5-ham5-exam-rx-denso',
                nome: 'RX e densitometria óssea',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-exam-rx-denso-1', nome: 'Interpretação de imagens' }
                ]
              }
            ]
          },
          {
            id: 'med-p5-ham5-treinamento',
            nome: 'Treinamento Prático e OSCE (transversal)',
            incluido: false,
            modulos: [
              {
                id: 'med-p5-ham5-treino-neuro',
                nome: 'Estação OSCE – exame neurológico completo',
                horasEstimadas: 30,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-treino-neuro-1', nome: 'Simulação de exame neurológico' }
                ]
              },
              {
                id: 'med-p5-ham5-treino-psiq',
                nome: 'Estação OSCE – exame psíquico + avaliação de risco suicida',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-treino-psiq-1', nome: 'Simulação de exame psiquiátrico' }
                ]
              },
              {
                id: 'med-p5-ham5-treino-oftal',
                nome: 'Estação OSCE – fundo de olho + otoscopia',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-treino-oftal-1', nome: 'Prática de técnicas' }
                ]
              },
              {
                id: 'med-p5-ham5-treino-ortopedico',
                nome: 'Estação OSCE – manobras ortopédicas (ombro + joelho + coluna)',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-treino-ortopedico-1', nome: 'Prática de manobras' }
                ]
              },
              {
                id: 'med-p5-ham5-treino-punção-sutura',
                nome: 'Estação OSCE – punção lombar + sutura',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-treino-punção-sutura-1', nome: 'Prática de procedimentos' }
                ]
              },
              {
                id: 'med-p5-ham5-treino-ave',
                nome: 'Simulação realística – AVE hiperagudo',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-treino-ave-1', nome: 'Cenário de AVE agudo' }
                ]
              },
              {
                id: 'med-p5-ham5-treino-psicomotora',
                nome: 'Simulação realística – paciente agitado com tentativa de suicídio',
                horasEstimadas: 25,
                incluido: false,
                submodulos: [
                  { id: 'med-p5-ham5-treino-psicomotora-1', nome: 'Cenário de emergência psiquiátrica' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }

  return topicos[periodo] || []
}
