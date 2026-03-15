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

export type PsicologiaAFYAPeriodo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export function getPsicologiaAFYATopicos(periodo: PsicologiaAFYAPeriodo): TopicItemWithModules[] {
  const topicos: Record<number, TopicItemWithModules[]> = {
    // ═══════════════════════════════════════════════════════════
    // 1º PERÍODO
    // ═══════════════════════════════════════════════════════════
    1: [
      {
        id: 'psi-p1-competencia-relacional',
        nome: 'Competência Relacional',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p1-comunicacao-interpessoal',
            nome: 'Comunicação Interpessoal',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-escuta-ativa',
                nome: 'Escuta ativa e empatia',
                horasEstimadas: 15,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-escuta-ativa-1', nome: 'Técnicas de escuta sem julgamento' },
                  { id: 'psi-p1-escuta-ativa-2', nome: 'Diferença entre simpatia e empatia' }
                ]
              },
              {
                id: 'psi-p1-comunicacao-nao-verbal',
                nome: 'Comunicação não-verbal',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-comunicacao-nao-verbal-1', nome: 'Linguagem corporal e postura' },
                  { id: 'psi-p1-comunicacao-nao-verbal-2', nome: 'Expressão facial e contato visual' }
                ]
              }
            ]
          },
          {
            id: 'psi-p1-relacoes-humanas',
            nome: 'Relações Humanas no Contexto Profissional',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-dinamicas-grupo',
                nome: 'Dinâmicas de grupo',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-dinamicas-grupo-1', nome: 'Papéis sociais e grupais' },
                  { id: 'psi-p1-dinamicas-grupo-2', nome: 'Conflito e cooperação' }
                ]
              },
              {
                id: 'psi-p1-autoconhecimento',
                nome: 'Autoconhecimento e inteligência emocional',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-autoconhecimento-1', nome: 'Consciência emocional' },
                  { id: 'psi-p1-autoconhecimento-2', nome: 'Regulação emocional básica' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p1-sociologia-antropologia',
        nome: 'Sociologia e Antropologia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p1-fundamentos-sociologicos',
            nome: 'Fundamentos Sociológicos',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-sociedade-cultura',
                nome: 'Sociedade, cultura e indivíduo',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-sociedade-cultura-1', nome: 'Socialização primária e secundária' },
                  { id: 'psi-p1-sociedade-cultura-2', nome: 'Instituições sociais (família, escola, religião)' }
                ]
              },
              {
                id: 'psi-p1-estratificacao',
                nome: 'Estratificação e desigualdade social',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-estratificacao-1', nome: 'Classes sociais e mobilidade' },
                  { id: 'psi-p1-estratificacao-2', nome: 'Raça, gênero e poder' }
                ]
              }
            ]
          },
          {
            id: 'psi-p1-fundamentos-antropologicos',
            nome: 'Fundamentos Antropológicos',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-cultura-identidade',
                nome: 'Cultura e identidade',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-cultura-identidade-1', nome: 'Etnocentrismo e relativismo cultural' },
                  { id: 'psi-p1-cultura-identidade-2', nome: 'Diversidade cultural e práticas sociais' }
                ]
              },
              {
                id: 'psi-p1-antropologia-corpo',
                nome: 'Antropologia do corpo e da saúde',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-antropologia-corpo-1', nome: 'Representações culturais da doença' },
                  { id: 'psi-p1-antropologia-corpo-2', nome: 'Rituais e práticas de cura' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p1-psicologia-artes',
        nome: 'Psicologia e Artes',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p1-psicologia-expressao',
            nome: 'Psicologia da Expressão',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-arte-linguagem',
                nome: 'Arte como linguagem psíquica',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-arte-linguagem-1', nome: 'Sublimação e criatividade' },
                  { id: 'psi-p1-arte-linguagem-2', nome: 'Arte e inconsciente (perspectiva psicanalítica)' }
                ]
              },
              {
                id: 'psi-p1-arteterapia',
                nome: 'Arteterapia — introdução',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-arteterapia-1', nome: 'Uso terapêutico das artes visuais' },
                  { id: 'psi-p1-arteterapia-2', nome: 'Música, teatro e expressão corporal na clínica' }
                ]
              }
            ]
          },
          {
            id: 'psi-p1-estetica-psicologia',
            nome: 'Estética e Psicologia',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-percepcao-estetica',
                nome: 'Percepção estética',
                horasEstimadas: 10,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-percepcao-estetica-1', nome: 'Belo, feio e emoção' },
                  { id: 'psi-p1-percepcao-estetica-2', nome: 'Psicologia das cores e formas' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p1-introducao-psicologia',
        nome: 'Introdução à Psicologia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p1-historia-psicologia',
            nome: 'História da Psicologia',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-origens-filosoficas',
                nome: 'Origens filosóficas',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-origens-filosoficas-1', nome: 'Psicologia em Descartes, Locke e Kant' },
                  { id: 'psi-p1-origens-filosoficas-2', nome: 'Wundt e o nascimento da psicologia científica' }
                ]
              },
              {
                id: 'psi-p1-grandes-escolas',
                nome: 'Grandes escolas e correntes',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-grandes-escolas-1', nome: 'Estruturalismo e funcionalismo' },
                  { id: 'psi-p1-grandes-escolas-2', nome: 'Behaviorismo, Gestalt, Psicanálise e Humanismo' }
                ]
              }
            ]
          },
          {
            id: 'psi-p1-ciencia-profissao',
            nome: 'Psicologia como Ciência e Profissão',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-objeto-estudo',
                nome: 'Objeto de estudo da psicologia',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-objeto-estudo-1', nome: 'Comportamento, mente e subjetividade' },
                  { id: 'psi-p1-objeto-estudo-2', nome: 'Diferenças entre psicologia, psiquiatria e psicanálise' }
                ]
              },
              {
                id: 'psi-p1-areas-atuacao',
                nome: 'Áreas de atuação do psicólogo',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-areas-atuacao-1', nome: 'Clínica, escolar, organizacional, social e hospitalar' },
                  { id: 'psi-p1-areas-atuacao-2', nome: 'Perfil e competências profissionais' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p1-fenomenos-processos',
        nome: 'Fenômenos e Processos Psicológicos Básicos',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p1-processos-cognitivos',
            nome: 'Processos Cognitivos',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-atencao-percepcao',
                nome: 'Atenção e percepção',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-atencao-percepcao-1', nome: 'Tipos de atenção (seletiva, sustentada, dividida)' },
                  { id: 'psi-p1-atencao-percepcao-2', nome: 'Leis da percepção (Gestalt)' }
                ]
              },
              {
                id: 'psi-p1-memoria',
                nome: 'Memória',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-memoria-1', nome: 'Memória de curto e longo prazo' },
                  { id: 'psi-p1-memoria-2', nome: 'Codificação, armazenamento e recuperação' }
                ]
              },
              {
                id: 'psi-p1-linguagem-pensamento',
                nome: 'Linguagem e pensamento',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-linguagem-pensamento-1', nome: 'Desenvolvimento da linguagem' },
                  { id: 'psi-p1-linguagem-pensamento-2', nome: 'Pensamento lógico, criativo e crítico' }
                ]
              }
            ]
          },
          {
            id: 'psi-p1-processos-emocionais',
            nome: 'Processos Emocionais e Motivacionais',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-emocoes',
                nome: 'Emoções básicas e complexas',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-emocoes-1', nome: 'Teorias das emoções (James-Lange, Cannon-Bard)' },
                  { id: 'psi-p1-emocoes-2', nome: 'Emoção e cognição' }
                ]
              },
              {
                id: 'psi-p1-motivacao',
                nome: 'Motivação',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-motivacao-1', nome: 'Hierarquia de necessidades de Maslow' },
                  { id: 'psi-p1-motivacao-2', nome: 'Motivação intrínseca e extrínseca' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p1-etica-profissional',
        nome: 'Ética Profissional em Psicologia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p1-codigo-etica',
            nome: 'Código de Ética do Psicólogo',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-principios-fundamentais',
                nome: 'Princípios fundamentais',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-principios-fundamentais-1', nome: 'Respeito à dignidade e autonomia do cliente' },
                  { id: 'psi-p1-principios-fundamentais-2', nome: 'Não discriminação e compromisso social' }
                ]
              },
              {
                id: 'psi-p1-direitos-deveres',
                nome: 'Direitos e deveres do psicólogo',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-direitos-deveres-1', nome: 'Sigilo e confidencialidade' },
                  { id: 'psi-p1-direitos-deveres-2', nome: 'Quebra do sigilo — quando e como' }
                ]
              }
            ]
          },
          {
            id: 'psi-p1-dilemas-eticos',
            nome: 'Dilemas Éticos na Prática',
            incluido: false,
            modulos: [
              {
                id: 'psi-p1-relacao-terapeutica',
                nome: 'Relação terapêutica e limites',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-relacao-terapeutica-1', nome: 'Transferência e contratransferência na ética' },
                  { id: 'psi-p1-relacao-terapeutica-2', nome: 'Duplos vínculos e conflitos de interesse' }
                ]
              },
              {
                id: 'psi-p1-documentos-psicologicos',
                nome: 'Documentos psicológicos',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p1-documentos-psicologicos-1', nome: 'Laudo, relatório e parecer psicológico' },
                  { id: 'psi-p1-documentos-psicologicos-2', nome: 'Prontuário e registro de atendimento' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 2º PERÍODO
    // ═══════════════════════════════════════════════════════════
    2: [
      {
        id: 'psi-p2-filosofia',
        nome: 'Filosofia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p2-filosofia-mente',
            nome: 'Filosofia da Mente',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-mente-corpo',
                nome: 'Problema mente-corpo',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-mente-corpo-1', nome: 'Dualismo cartesiano' },
                  { id: 'psi-p2-mente-corpo-2', nome: 'Monismo e fisicalismo' }
                ]
              },
              {
                id: 'psi-p2-consciencia',
                nome: 'Consciência e subjetividade',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-consciencia-1', nome: 'Fenomenologia de Husserl' },
                  { id: 'psi-p2-consciencia-2', nome: 'Intencionalidade e experiência vivida' }
                ]
              }
            ]
          },
          {
            id: 'psi-p2-filosofia-sujeito',
            nome: 'Filosofia do Sujeito',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-identidade-existencia',
                nome: 'Identidade e existência',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-identidade-existencia-1', nome: 'Sartre e a liberdade radical' },
                  { id: 'psi-p2-identidade-existencia-2', nome: 'Heidegger e o ser-no-mundo' }
                ]
              },
              {
                id: 'psi-p2-etica-filosofica',
                nome: 'Ética filosófica',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-etica-filosofica-1', nome: 'Ética kantiana e o imperativo categórico' },
                  { id: 'psi-p2-etica-filosofica-2', nome: 'Utilitarismo e consequencialismo' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p2-bases-biologicas',
        nome: 'Bases Biológicas do Comportamento',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p2-neurociencia-basica',
            nome: 'Neurociência Básica',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-neuronio',
                nome: 'Estrutura e função do neurônio',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-neuronio-1', nome: 'Potencial de ação e sinapses' },
                  { id: 'psi-p2-neuronio-2', nome: 'Neurotransmissores principais (dopamina, serotonina, GABA)' }
                ]
              },
              {
                id: 'psi-p2-snc',
                nome: 'Sistema nervoso central e periférico',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-snc-1', nome: 'Funções do cérebro (lobos cerebrais)' },
                  { id: 'psi-p2-snc-2', nome: 'Sistema límbico e emoções' }
                ]
              }
            ]
          },
          {
            id: 'psi-p2-biologia-comportamento',
            nome: 'Biologia do Comportamento',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-genetica',
                nome: 'Genética e comportamento',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-genetica-1', nome: 'Hereditariedade e traços psicológicos' },
                  { id: 'psi-p2-genetica-2', nome: 'Epigenética — ambiente e expressão gênica' }
                ]
              },
              {
                id: 'psi-p2-ritmos',
                nome: 'Ritmos biológicos e estados de consciência',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-ritmos-1', nome: 'Ciclo circadiano e sono' },
                  { id: 'psi-p2-ritmos-2', nome: 'Efeitos do sono na memória e humor' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p2-direitos-humanos',
        nome: 'Direitos Humanos, Diversidade e Inclusão',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p2-fundamentos-dh',
            nome: 'Fundamentos dos Direitos Humanos',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-historia-dh',
                nome: 'História e declarações internacionais',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-historia-dh-1', nome: 'Declaração Universal dos Direitos Humanos (1948)' },
                  { id: 'psi-p2-historia-dh-2', nome: 'Direitos humanos no Brasil (Constituição de 1988)' }
                ]
              },
              {
                id: 'psi-p2-psicologia-dh',
                nome: 'Psicologia e direitos humanos',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-psicologia-dh-1', nome: 'Papel do psicólogo na defesa de direitos' },
                  { id: 'psi-p2-psicologia-dh-2', nome: 'Psicologia do testemunho e tortura' }
                ]
              }
            ]
          },
          {
            id: 'psi-p2-diversidade-inclusao',
            nome: 'Diversidade e Inclusão',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-raca-racismo',
                nome: 'Raça, etnia e racismo',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-raca-racismo-1', nome: 'Racismo estrutural e institucional' },
                  { id: 'psi-p2-raca-racismo-2', nome: 'Impacto psicológico do racismo' }
                ]
              },
              {
                id: 'psi-p2-inclusao-pcd',
                nome: 'Inclusão de pessoas com deficiência',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-inclusao-pcd-1', nome: 'Modelos médico e social da deficiência' },
                  { id: 'psi-p2-inclusao-pcd-2', nome: 'Acessibilidade e saúde mental' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p2-desenvolvimento-infancia',
        nome: 'Psicologia do Desenvolvimento — Infância e Adolescência',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p2-desenvolvimento-infantil',
            nome: 'Desenvolvimento na Infância',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-teorias-infantil',
                nome: 'Teorias do desenvolvimento infantil',
                horasEstimadas: 20,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-teorias-infantil-1', nome: 'Piaget — estágios cognitivos (sensório-motor ao pré-operatório)' },
                  { id: 'psi-p2-teorias-infantil-2', nome: 'Vygotsky — zona de desenvolvimento proximal' },
                  { id: 'psi-p2-teorias-infantil-3', nome: 'Wallon — afetividade e cognição' }
                ]
              },
              {
                id: 'psi-p2-desenvolvimento-emocional',
                nome: 'Desenvolvimento emocional e vincular',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-desenvolvimento-emocional-1', nome: 'Teoria do apego (Bowlby e Ainsworth)' },
                  { id: 'psi-p2-desenvolvimento-emocional-2', nome: 'Tipos de apego (seguro, ansioso, evitativo, desorganizado)' }
                ]
              },
              {
                id: 'psi-p2-desenvolvimento-motor',
                nome: 'Desenvolvimento motor e psicomotor',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-desenvolvimento-motor-1', nome: 'Marcos do desenvolvimento motor' },
                  { id: 'psi-p2-desenvolvimento-motor-2', nome: 'Psicomotricidade e aprendizagem' }
                ]
              }
            ]
          },
          {
            id: 'psi-p2-desenvolvimento-adolescencia',
            nome: 'Desenvolvimento na Adolescência',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-mudancas-adolescencia',
                nome: 'Mudanças físicas e psicológicas',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-mudancas-adolescencia-1', nome: 'Puberdade e identidade de gênero' },
                  { id: 'psi-p2-mudancas-adolescencia-2', nome: 'Crise de identidade (Erikson — estágio 5)' }
                ]
              },
              {
                id: 'psi-p2-adolescencia-sociedade',
                nome: 'Adolescência e sociedade',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-adolescencia-sociedade-1', nome: 'Grupo de pares e pertencimento' },
                  { id: 'psi-p2-adolescencia-sociedade-2', nome: 'Risco, impulsividade e tomada de decisão' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p2-psicologia-saude',
        nome: 'Psicologia em Saúde',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p2-saude-doenca',
            nome: 'Saúde, Doença e Subjetividade',
            incluido: false,
            modulos: [
              {
                id: 'psi-p2-conceitos-saude',
                nome: 'Conceitos de saúde e doença',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-conceitos-saude-1', nome: 'Modelo biomédico x biopsicossocial' },
                  { id: 'psi-p2-conceitos-saude-2', nome: 'Determinantes sociais da saúde' }
                ]
              },
              {
                id: 'psi-p2-comportamento-saude',
                nome: 'Comportamento e saúde',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p2-comportamento-saude-1', nome: 'Adesão ao tratamento' },
                  { id: 'psi-p2-comportamento-saude-2', nome: 'Psicologia da dor crônica' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 3º PERÍODO
    // ═══════════════════════════════════════════════════════════
    3: [
      {
        id: 'psi-p3-desenvolvimento-adulto',
        nome: 'Psicologia do Desenvolvimento — Adulto e Idoso',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p3-vida-adulta',
            nome: 'Desenvolvimento na Vida Adulta',
            incluido: false,
            modulos: [
              {
                id: 'psi-p3-teorias-adulto',
                nome: 'Teorias do desenvolvimento adulto',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-teorias-adulto-1', nome: 'Erikson — estágios da intimidade, generatividade e integridade' },
                  { id: 'psi-p3-teorias-adulto-2', nome: 'Levinson — transições da vida adulta' }
                ]
              },
              {
                id: 'psi-p3-trabalho-familia',
                nome: 'Trabalho, família e identidade',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-trabalho-familia-1', nome: 'Escolha profissional e satisfação no trabalho' },
                  { id: 'psi-p3-trabalho-familia-2', nome: 'Conjugalidade e parentalidade' }
                ]
              }
            ]
          },
          {
            id: 'psi-p3-envelhecimento',
            nome: 'Envelhecimento e Psicologia do Idoso',
            incluido: false,
            modulos: [
              {
                id: 'psi-p3-teorias-envelhecimento',
                nome: 'Teorias do envelhecimento',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-teorias-envelhecimento-1', nome: 'Envelhecimento ativo e bem-sucedido' },
                  { id: 'psi-p3-teorias-envelhecimento-2', nome: 'Perdas e luto no envelhecimento' }
                ]
              },
              {
                id: 'psi-p3-saude-mental-idoso',
                nome: 'Saúde mental no envelhecimento',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-saude-mental-idoso-1', nome: 'Demências (Alzheimer, vascular)' },
                  { id: 'psi-p3-saude-mental-idoso-2', nome: 'Depressão e ansiedade na terceira idade' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p3-estatistica',
        nome: 'Estatística Aplicada à Psicologia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p3-estatistica-descritiva',
            nome: 'Estatística Descritiva',
            incluido: false,
            modulos: [
              {
                id: 'psi-p3-organizacao-dados',
                nome: 'Organização e apresentação de dados',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-organizacao-dados-1', nome: 'Tabelas de frequência' },
                  { id: 'psi-p3-organizacao-dados-2', nome: 'Gráficos (histograma, boxplot, dispersão)' }
                ]
              },
              {
                id: 'psi-p3-medidas-tendencia',
                nome: 'Medidas de tendência central e dispersão',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-medidas-tendencia-1', nome: 'Média, mediana, moda' },
                  { id: 'psi-p3-medidas-tendencia-2', nome: 'Variância, desvio padrão e amplitude' }
                ]
              }
            ]
          },
          {
            id: 'psi-p3-estatistica-inferencial',
            nome: 'Estatística Inferencial',
            incluido: false,
            modulos: [
              {
                id: 'psi-p3-probabilidade',
                nome: 'Probabilidade e distribuições',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-probabilidade-1', nome: 'Distribuição normal e curva de Gauss' },
                  { id: 'psi-p3-probabilidade-2', nome: 'Intervalos de confiança' }
                ]
              },
              {
                id: 'psi-p3-testes-estatisticos',
                nome: 'Testes estatísticos básicos',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-testes-estatisticos-1', nome: 'Teste t de Student' },
                  { id: 'psi-p3-testes-estatisticos-2', nome: 'Correlação de Pearson e Spearman' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p3-experimental',
        nome: 'Psicologia Experimental',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p3-metodologia-experimental',
            nome: 'Metodologia Experimental',
            incluido: false,
            modulos: [
              {
                id: 'psi-p3-fundamentos-experimental',
                nome: 'Fundamentos do método experimental',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-fundamentos-experimental-1', nome: 'Variável dependente, independente e de controle' },
                  { id: 'psi-p3-fundamentos-experimental-2', nome: 'Hipóteses e operacionalização' }
                ]
              },
              {
                id: 'psi-p3-delineamentos',
                nome: 'Delineamentos de pesquisa',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-delineamentos-1', nome: 'Experimento controlado e quase-experimento' },
                  { id: 'psi-p3-delineamentos-2', nome: 'Cegamento simples e duplo' }
                ]
              }
            ]
          },
          {
            id: 'psi-p3-experimentos-classicos',
            nome: 'Experimentos Clássicos em Psicologia',
            incluido: false,
            modulos: [
              {
                id: 'psi-p3-condicionamento',
                nome: 'Condicionamento e aprendizagem',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-condicionamento-1', nome: 'Pavlov — reflexo condicionado' },
                  { id: 'psi-p3-condicionamento-2', nome: 'Skinner — caixa operante e reforço' }
                ]
              },
              {
                id: 'psi-p3-obediencia-conformidade',
                nome: 'Obediência e conformidade',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-obediencia-conformidade-1', nome: 'Milgram — obediência à autoridade' },
                  { id: 'psi-p3-obediencia-conformidade-2', nome: 'Asch — conformidade social' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p3-neuroanatomia',
        nome: 'Neuroanatomia Humana',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p3-snc-anatomia',
            nome: 'Anatomia do Sistema Nervoso Central',
            incluido: false,
            modulos: [
              {
                id: 'psi-p3-encefalo',
                nome: 'Encéfalo',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-encefalo-1', nome: 'Córtex cerebral — lobos e funções' },
                  { id: 'psi-p3-encefalo-2', nome: 'Gânglios da base, cerebelo e tronco encefálico' }
                ]
              },
              {
                id: 'psi-p3-sistema-limbico',
                nome: 'Sistema límbico',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-sistema-limbico-1', nome: 'Amígdala e processamento do medo' },
                  { id: 'psi-p3-sistema-limbico-2', nome: 'Hipocampo e memória' }
                ]
              }
            ]
          },
          {
            id: 'psi-p3-neuroanatomia-funcional',
            nome: 'Neuroanatomia Funcional',
            incluido: false,
            modulos: [
              {
                id: 'psi-p3-vias-sensoriais',
                nome: 'Vias sensoriais e motoras',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-vias-sensoriais-1', nome: 'Córtex motor e somatossensorial' },
                  { id: 'psi-p3-vias-sensoriais-2', nome: 'Vias visuais e auditivas' }
                ]
              },
              {
                id: 'psi-p3-neuroplasticidade',
                nome: 'Neuroplasticidade',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p3-neuroplasticidade-1', nome: 'Plasticidade sináptica e aprendizagem' },
                  { id: 'psi-p3-neuroplasticidade-2', nome: 'Recuperação neural após lesão' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 4º PERÍODO
    // ═══════════════════════════════════════════════════════════
    4: [
      {
        id: 'psi-p4-psicologia-social',
        nome: 'Psicologia Social',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p4-cognicao-social',
            nome: 'Cognição Social',
            incluido: false,
            modulos: [
              {
                id: 'psi-p4-atitudes',
                nome: 'Atitudes e mudança de atitudes',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-atitudes-1', nome: 'Formação de atitudes' },
                  { id: 'psi-p4-atitudes-2', nome: 'Dissonância cognitiva (Festinger)' }
                ]
              },
              {
                id: 'psi-p4-preconceito',
                nome: 'Preconceito e estereótipos',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-preconceito-1', nome: 'Teoria da identidade social (Tajfel)' },
                  { id: 'psi-p4-preconceito-2', nome: 'Redução do preconceito — hipótese do contato' }
                ]
              }
            ]
          },
          {
            id: 'psi-p4-influencia-social',
            nome: 'Influência Social',
            incluido: false,
            modulos: [
              {
                id: 'psi-p4-conformidade',
                nome: 'Conformidade, obediência e submissão',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-conformidade-1', nome: 'Normativa x informacional' },
                  { id: 'psi-p4-conformidade-2', nome: 'Poder e autoridade' }
                ]
              },
              {
                id: 'psi-p4-comportamento-grupo',
                nome: 'Comportamento em grupo',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-comportamento-grupo-1', nome: 'Facilitação e inibição social' },
                  { id: 'psi-p4-comportamento-grupo-2', nome: 'Pensamento grupal (groupthink)' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p4-saude-mental',
        nome: 'Psicologia e Saúde Mental',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p4-conceitos-saude-mental',
            nome: 'Conceitos de Saúde Mental',
            incluido: false,
            modulos: [
              {
                id: 'psi-p4-normal-patologico',
                nome: 'Normal e patológico',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-normal-patologico-1', nome: 'Critérios de classificação (DSM-5 e CID-11)' },
                  { id: 'psi-p4-normal-patologico-2', nome: 'Estigma e saúde mental' }
                ]
              },
              {
                id: 'psi-p4-promocao-prevencao',
                nome: 'Promoção e prevenção em saúde mental',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-promocao-prevencao-1', nome: 'Fatores de risco e proteção' },
                  { id: 'psi-p4-promocao-prevencao-2', nome: 'Estratégias de promoção de saúde mental' }
                ]
              }
            ]
          },
          {
            id: 'psi-p4-reforma-psiquiatrica',
            nome: 'Reforma Psiquiátrica e Políticas de Saúde Mental',
            incluido: false,
            modulos: [
              {
                id: 'psi-p4-antimanicomial',
                nome: 'Movimento antimanicomial no Brasil',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-antimanicomial-1', nome: 'Lei 10.216/2001 — direitos das pessoas com transtorno mental' },
                  { id: 'psi-p4-antimanicomial-2', nome: 'CAPS e a rede de atenção psicossocial (RAPS)' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p4-psicologia-comunitaria',
        nome: 'Psicologia Comunitária',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p4-fundamentos-comunitaria',
            nome: 'Fundamentos da Psicologia Comunitária',
            incluido: false,
            modulos: [
              {
                id: 'psi-p4-comunidade',
                nome: 'Comunidade como espaço de atuação',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-comunidade-1', nome: 'Identidade comunitária e pertencimento' },
                  { id: 'psi-p4-comunidade-2', nome: 'Empoderamento e protagonismo social' }
                ]
              },
              {
                id: 'psi-p4-intervencao-comunitaria',
                nome: 'Intervenção comunitária',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-intervencao-comunitaria-1', nome: 'Diagnóstico participativo' },
                  { id: 'psi-p4-intervencao-comunitaria-2', nome: 'Grupos comunitários e mobilização social' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p4-escolar-educacional',
        nome: 'Psicologia Escolar, Educacional e Aprendizagem',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p4-aprendizagem',
            nome: 'Psicologia da Aprendizagem',
            incluido: false,
            modulos: [
              {
                id: 'psi-p4-teorias-aprendizagem',
                nome: 'Teorias da aprendizagem',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-teorias-aprendizagem-1', nome: 'Behaviorismo aplicado à educação (Skinner)' },
                  { id: 'psi-p4-teorias-aprendizagem-2', nome: 'Construtivismo (Piaget) e sociointeracionismo (Vygotsky)' }
                ]
              },
              {
                id: 'psi-p4-dificuldades-aprendizagem',
                nome: 'Dificuldades de aprendizagem',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-dificuldades-aprendizagem-1', nome: 'Dislexia, discalculia e TDAH' },
                  { id: 'psi-p4-dificuldades-aprendizagem-2', nome: 'Avaliação psicopedagógica' }
                ]
              }
            ]
          },
          {
            id: 'psi-p4-psicologo-escolar',
            nome: 'Psicólogo no Contexto Escolar',
            incluido: false,
            modulos: [
              {
                id: 'psi-p4-papel-escolar',
                nome: 'Papel do psicólogo escolar',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-papel-escolar-1', nome: 'Atuação institucional x clínica no contexto escolar' },
                  { id: 'psi-p4-papel-escolar-2', nome: 'Relação família-escola' }
                ]
              },
              {
                id: 'psi-p4-violencia-escolar',
                nome: 'Violência escolar',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p4-violencia-escolar-1', nome: 'Bullying e cyberbullying' },
                  { id: 'psi-p4-violencia-escolar-2', nome: 'Intervenção psicológica no bullying' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 5º PERÍODO
    // ═══════════════════════════════════════════════════════════
    5: [
      {
        id: 'psi-p5-psicometria',
        nome: 'Psicometria e Testagem Psicológica',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p5-fundamentos-psicometria',
            nome: 'Fundamentos da Psicometria',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-tct',
                nome: 'Teoria clássica dos testes (TCT)',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-tct-1', nome: 'Fidedignidade e validade' },
                  { id: 'psi-p5-tct-2', nome: 'Normatização e padronização' }
                ]
              },
              {
                id: 'psi-p5-tri',
                nome: 'Teoria de resposta ao item (TRI)',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-tri-1', nome: 'Curva característica do item' },
                  { id: 'psi-p5-tri-2', nome: 'Parâmetros a, b, c' }
                ]
              }
            ]
          },
          {
            id: 'psi-p5-instrumentos',
            nome: 'Instrumentos Psicológicos',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-testes-inteligencia',
                nome: 'Testes de inteligência',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-testes-inteligencia-1', nome: 'Escalas Wechsler (WAIS, WISC)' },
                  { id: 'psi-p5-testes-inteligencia-2', nome: 'Matrizes Progressivas de Raven' }
                ]
              },
              {
                id: 'psi-p5-testes-personalidade',
                nome: 'Testes de personalidade',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-testes-personalidade-1', nome: 'Inventários (MMPI, BFP)' },
                  { id: 'psi-p5-testes-personalidade-2', nome: 'Técnicas projetivas (Rorschach, TAT, HTP)' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p5-tecnicas-grupais',
        nome: 'Teorias e Técnicas Grupais',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p5-dinamica-grupos',
            nome: 'Dinâmica de Grupos',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-fases-grupo',
                nome: 'Fases do grupo terapêutico',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-fases-grupo-1', nome: 'Formação, conflito, coesão e dissolução' },
                  { id: 'psi-p5-fases-grupo-2', nome: 'Papéis terapêuticos dentro do grupo' }
                ]
              },
              {
                id: 'psi-p5-lideranca-grupos',
                nome: 'Liderança e facilitação de grupos',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-lideranca-grupos-1', nome: 'Estilos de liderança' },
                  { id: 'psi-p5-lideranca-grupos-2', nome: 'Técnicas do facilitador grupal' }
                ]
              }
            ]
          },
          {
            id: 'psi-p5-modalidades-grupais',
            nome: 'Modalidades Grupais',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-grupos-terapeuticos',
                nome: 'Grupos terapêuticos',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-grupos-terapeuticos-1', nome: 'Grupos de apoio e grupos de psicoterapia' },
                  { id: 'psi-p5-grupos-terapeuticos-2', nome: 'Psicodrama (Moreno)' }
                ]
              },
              {
                id: 'psi-p5-grupos-institucional',
                nome: 'Grupos em contexto institucional',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-grupos-institucional-1', nome: 'Grupos em CAPS, hospitais e escolas' },
                  { id: 'psi-p5-grupos-institucional-2', nome: 'Gestão de conflitos em grupo' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p5-comportamental',
        nome: 'Fundamentos de Psicologia Comportamental',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p5-behaviorismo',
            nome: 'Behaviorismo Clássico e Operante',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-condicionamento-classico',
                nome: 'Condicionamento clássico',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-condicionamento-classico-1', nome: 'Aquisição, extinção e recuperação espontânea' },
                  { id: 'psi-p5-condicionamento-classico-2', nome: 'Generalização e discriminação de estímulos' }
                ]
              },
              {
                id: 'psi-p5-condicionamento-operante',
                nome: 'Condicionamento operante',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-condicionamento-operante-1', nome: 'Reforço positivo e negativo' },
                  { id: 'psi-p5-condicionamento-operante-2', nome: 'Punição e extinção operante' },
                  { id: 'psi-p5-condicionamento-operante-3', nome: 'Esquemas de reforçamento (razão, intervalo)' }
                ]
              }
            ]
          },
          {
            id: 'psi-p5-aba',
            nome: 'Análise do Comportamento Aplicada (ABA)',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-fundamentos-aba',
                nome: 'Fundamentos da ABA',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-fundamentos-aba-1', nome: 'Análise funcional do comportamento' },
                  { id: 'psi-p5-fundamentos-aba-2', nome: 'Linha de base e intervenção' }
                ]
              },
              {
                id: 'psi-p5-aplicacoes-aba',
                nome: 'Aplicações clínicas',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-aplicacoes-aba-1', nome: 'ABA no autismo (TEA)' },
                  { id: 'psi-p5-aplicacoes-aba-2', nome: 'Token economy e modelagem' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p5-psicanalise',
        nome: 'Fundamentos da Psicanálise',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p5-freud',
            nome: 'Freud — Obra Fundamental',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-metapsicologia',
                nome: 'Metapsicologia freudiana',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-metapsicologia-1', nome: '1ª tópica (consciente, pré-consciente, inconsciente)' },
                  { id: 'psi-p5-metapsicologia-2', nome: '2ª tópica (id, ego, superego)' }
                ]
              },
              {
                id: 'psi-p5-pulsao',
                nome: 'Pulsão e sexualidade',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-pulsao-1', nome: 'Pulsão de vida (Eros) e pulsão de morte (Tânatos)' },
                  { id: 'psi-p5-pulsao-2', nome: 'Fases do desenvolvimento psicossexual' }
                ]
              }
            ]
          },
          {
            id: 'psi-p5-mecanismos-defesa',
            nome: 'Mecanismos de Defesa e Complexo de Édipo',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-defesas',
                nome: 'Principais mecanismos de defesa',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-defesas-1', nome: 'Repressão, projeção, regressão e sublimação' },
                  { id: 'psi-p5-defesas-2', nome: 'Negação, racionalização e deslocamento' }
                ]
              },
              {
                id: 'psi-p5-edipo',
                nome: 'Complexo de Édipo',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-edipo-1', nome: 'Édipo masculino e feminino' },
                  { id: 'psi-p5-edipo-2', nome: 'Castração, falo e lei do pai' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p5-juridica',
        nome: 'Psicologia Jurídica',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p5-sistema-justica',
            nome: 'Psicologia e Sistema de Justiça',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-psicologo-juridico',
                nome: 'Atuação do psicólogo jurídico',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-psicologo-juridico-1', nome: 'Avaliação psicológica forense' },
                  { id: 'psi-p5-psicologo-juridico-2', nome: 'Elaboração de laudos periciais' }
                ]
              },
              {
                id: 'psi-p5-testemunho',
                nome: 'Psicologia do testemunho',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-testemunho-1', nome: 'Memória e falsas memórias' },
                  { id: 'psi-p5-testemunho-2', nome: 'Entrevista investigativa com crianças (NICHD)' }
                ]
              }
            ]
          },
          {
            id: 'psi-p5-temas-juridica',
            nome: 'Temas Especiais em Psicologia Jurídica',
            incluido: false,
            modulos: [
              {
                id: 'psi-p5-violencia-domestica',
                nome: 'Violência doméstica e familiar',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-violencia-domestica-1', nome: 'Ciclo da violência' },
                  { id: 'psi-p5-violencia-domestica-2', nome: 'Lei Maria da Penha — aspectos psicológicos' }
                ]
              },
              {
                id: 'psi-p5-prisional',
                nome: 'Psicologia prisional',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p5-prisional-1', nome: 'Impacto psicológico do encarceramento' },
                  { id: 'psi-p5-prisional-2', nome: 'Ressocialização e reincidência' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 6º PERÍODO
    // ═══════════════════════════════════════════════════════════
    6: [
      {
        id: 'psi-p6-psicanalise',
        nome: 'Psicanálise',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p6-pos-freudianos',
            nome: 'Pós-Freudianos e Relações Objetais',
            incluido: false,
            modulos: [
              {
                id: 'psi-p6-klein',
                nome: 'Melanie Klein',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-klein-1', nome: 'Posição esquizo-paranoide e depressiva' },
                  { id: 'psi-p6-klein-2', nome: 'Inveja, gratidão e reparação' }
                ]
              },
              {
                id: 'psi-p6-winnicott',
                nome: 'Donald Winnicott',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-winnicott-1', nome: 'Objeto transicional e espaço potencial' },
                  { id: 'psi-p6-winnicott-2', nome: 'Verdadeiro e falso self' }
                ]
              },
              {
                id: 'psi-p6-bion',
                nome: 'Wilfred Bion',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-bion-1', nome: 'Continente e conteúdo' },
                  { id: 'psi-p6-bion-2', nome: 'Teoria do pensar e elementos beta/alfa' }
                ]
              }
            ]
          },
          {
            id: 'psi-p6-lacan',
            nome: 'Jacques Lacan',
            incluido: false,
            modulos: [
              {
                id: 'psi-p6-tres-registros',
                nome: 'Os três registros',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-tres-registros-1', nome: 'Real, simbólico e imaginário' },
                  { id: 'psi-p6-tres-registros-2', nome: 'O Nome-do-Pai e a metáfora paterna' }
                ]
              },
              {
                id: 'psi-p6-desejo-gozo',
                nome: 'Desejo e gozo',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-desejo-gozo-1', nome: 'Desejo do Outro' },
                  { id: 'psi-p6-desejo-gozo-2', nome: 'Gozo, fantasia e sintoma' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p6-comportamental',
        nome: 'Psicologia Comportamental',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p6-terapia-comportamental',
            nome: 'Terapia Comportamental',
            incluido: false,
            modulos: [
              {
                id: 'psi-p6-dessensibilizacao',
                nome: 'Dessensibilização sistemática',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-dessensibilizacao-1', nome: 'Hierarquia de ansiedade' },
                  { id: 'psi-p6-dessensibilizacao-2', nome: 'Relaxamento progressivo de Jacobson' }
                ]
              },
              {
                id: 'psi-p6-exposicao',
                nome: 'Exposição e prevenção de resposta',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-exposicao-1', nome: 'Aplicação no TOC e fobias' },
                  { id: 'psi-p6-exposicao-2', nome: 'Inundação x dessensibilização' }
                ]
              }
            ]
          },
          {
            id: 'psi-p6-tcc',
            nome: 'Terapia Cognitivo-Comportamental (TCC)',
            incluido: false,
            modulos: [
              {
                id: 'psi-p6-fundamentos-tcc',
                nome: 'Fundamentos da TCC',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-fundamentos-tcc-1', nome: 'Tríade cognitiva de Beck' },
                  { id: 'psi-p6-fundamentos-tcc-2', nome: 'Distorções cognitivas' }
                ]
              },
              {
                id: 'psi-p6-tecnicas-tcc',
                nome: 'Técnicas da TCC',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-tecnicas-tcc-1', nome: 'Reestruturação cognitiva' },
                  { id: 'psi-p6-tecnicas-tcc-2', nome: 'Registro de pensamentos disfuncionais (RPD)' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p6-psicopatologia',
        nome: 'Fundamentos de Psicopatologia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p6-psicopatologia-descritiva',
            nome: 'Psicopatologia Descritiva',
            incluido: false,
            modulos: [
              {
                id: 'psi-p6-alteracoes-percepcao',
                nome: 'Alterações da percepção',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-alteracoes-percepcao-1', nome: 'Ilusões e alucinações (tipos e contextos)' },
                  { id: 'psi-p6-alteracoes-percepcao-2', nome: 'Despersonalização e desrealização' }
                ]
              },
              {
                id: 'psi-p6-alteracoes-pensamento',
                nome: 'Alterações do pensamento',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-alteracoes-pensamento-1', nome: 'Forma (fuga de ideias, tangencialidade, desagregação)' },
                  { id: 'psi-p6-alteracoes-pensamento-2', nome: 'Conteúdo (delírios — persecutório, grandioso, ciumento)' }
                ]
              },
              {
                id: 'psi-p6-alteracoes-afetividade',
                nome: 'Alterações da afetividade e da consciência',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-alteracoes-afetividade-1', nome: 'Humor deprimido, eufórico, disfórico' },
                  { id: 'psi-p6-alteracoes-afetividade-2', nome: 'Obnubilação, sopor e coma' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p6-fenomenologica-existencial',
        nome: 'Fundamentos de Psicologia Fenomenológica e Existencial',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p6-fenomenologia',
            nome: 'Fenomenologia',
            incluido: false,
            modulos: [
              {
                id: 'psi-p6-husserl',
                nome: 'Husserl e a fenomenologia transcendental',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-husserl-1', nome: 'Intencionalidade da consciência' },
                  { id: 'psi-p6-husserl-2', nome: 'Epoché e redução fenomenológica' }
                ]
              },
              {
                id: 'psi-p6-merleau-ponty',
                nome: 'Merleau-Ponty e a fenomenologia do corpo',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-merleau-ponty-1', nome: 'Corpo vivido x corpo objetivo' },
                  { id: 'psi-p6-merleau-ponty-2', nome: 'Esquema corporal e percepção' }
                ]
              }
            ]
          },
          {
            id: 'psi-p6-existencial',
            nome: 'Psicologia Existencial',
            incluido: false,
            modulos: [
              {
                id: 'psi-p6-existencialismo',
                nome: 'Existencialismo aplicado à psicologia',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-existencialismo-1', nome: 'Dasein e existência autêntica (Heidegger)' },
                  { id: 'psi-p6-existencialismo-2', nome: 'Liberdade, responsabilidade e angústia (Sartre)' }
                ]
              },
              {
                id: 'psi-p6-logoterapia',
                nome: 'Logoterapia (Frankl)',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p6-logoterapia-1', nome: 'Vontade de sentido' },
                  { id: 'psi-p6-logoterapia-2', nome: 'Técnicas — intenção paradoxal e derreflexão' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 7º PERÍODO
    // ═══════════════════════════════════════════════════════════
    7: [
      {
        id: 'psi-p7-avaliacao-psicologica',
        nome: 'Avaliação Psicológica',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p7-processo-avaliacao',
            nome: 'Processo de Avaliação Psicológica',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-entrevista',
                nome: 'Entrevista psicológica',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-entrevista-1', nome: 'Tipos de entrevista (triagem, diagnóstica, devolutiva)' },
                  { id: 'psi-p7-entrevista-2', nome: 'Estrutura da entrevista clínica' }
                ]
              },
              {
                id: 'psi-p7-planejamento',
                nome: 'Planejamento da avaliação',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-planejamento-1', nome: 'Escolha de instrumentos por objetivo' },
                  { id: 'psi-p7-planejamento-2', nome: 'Baterias de testes e integração de resultados' }
                ]
              }
            ]
          },
          {
            id: 'psi-p7-documentos',
            nome: 'Elaboração de Documentos',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-relatorio-laudo',
                nome: 'Relatório e laudo psicológico',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-relatorio-laudo-1', nome: 'Estrutura técnica do laudo' },
                  { id: 'psi-p7-relatorio-laudo-2', nome: 'Linguagem e responsabilidade ética no laudo' }
                ]
              },
              {
                id: 'psi-p7-devolucao',
                nome: 'Devolução de resultados',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-devolucao-1', nome: 'Como comunicar resultados ao paciente/família' },
                  { id: 'psi-p7-devolucao-2', nome: 'Limites da avaliação e encaminhamentos' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p7-fenomenologica-aprofundamento',
        nome: 'Psicologia Fenomenológica Existencial (Aprofundamento)',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p7-clinicas-existenciais',
            nome: 'Abordagens Clínicas Existenciais',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-daseinanalyse',
                nome: 'Daseinanalyse (Binswanger e Boss)',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-daseinanalyse-1', nome: 'Mundo próprio, co-mundo e mundo circundante' },
                  { id: 'psi-p7-daseinanalyse-2', nome: 'Modos de ser no mundo' }
                ]
              },
              {
                id: 'psi-p7-psicoterapia-existencial',
                nome: 'Psicoterapia existencial contemporânea',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-psicoterapia-existencial-1', nome: 'Yalom — os quatro dados existenciais (morte, liberdade, isolamento, falta de sentido)' },
                  { id: 'psi-p7-psicoterapia-existencial-2', nome: 'Presença terapêutica e encontro genuíno' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p7-tecnicas-exame',
        nome: 'Técnicas de Exame Psicológico',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p7-projetivas',
            nome: 'Técnicas Projetivas',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-rorschach',
                nome: 'Rorschach',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-rorschach-1', nome: 'Sistema compreensivo de Exner' },
                  { id: 'psi-p7-rorschach-2', nome: 'Variáveis de localização, determinantes e conteúdo' }
                ]
              },
              {
                id: 'psi-p7-tat-cat',
                nome: 'TAT e CAT',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-tat-cat-1', nome: 'Análise de narrativas' },
                  { id: 'psi-p7-tat-cat-2', nome: 'Temas e defesas identificadas nas histórias' }
                ]
              }
            ]
          },
          {
            id: 'psi-p7-graficas',
            nome: 'Técnicas Gráficas',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-htp',
                nome: 'HTP (Casa-Árvore-Pessoa)',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-htp-1', nome: 'Indicadores clínicos nos desenhos' },
                  { id: 'psi-p7-htp-2', nome: 'Integração com entrevista e histórico' }
                ]
              },
              {
                id: 'psi-p7-dfh',
                nome: 'Desenho da Figura Humana (DFH)',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-dfh-1', nome: 'Escala de maturidade e indicadores emocionais' },
                  { id: 'psi-p7-dfh-2', nome: 'Uso com crianças e adultos' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p7-organizacional',
        nome: 'Psicologia Organizacional e do Trabalho',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p7-comportamento-org',
            nome: 'Comportamento Organizacional',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-motivacao-trabalho',
                nome: 'Motivação e satisfação no trabalho',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-motivacao-trabalho-1', nome: 'Teoria dos dois fatores de Herzberg' },
                  { id: 'psi-p7-motivacao-trabalho-2', nome: 'Teoria da autodeterminação aplicada ao trabalho' }
                ]
              },
              {
                id: 'psi-p7-lideranca-org',
                nome: 'Liderança organizacional',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-lideranca-org-1', nome: 'Estilos de liderança (transformacional, transacional)' },
                  { id: 'psi-p7-lideranca-org-2', nome: 'Liderança situacional' }
                ]
              }
            ]
          },
          {
            id: 'psi-p7-saude-trabalhador',
            nome: 'Saúde do Trabalhador',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-psicopatologia-trabalho',
                nome: 'Psicopatologia do trabalho',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-psicopatologia-trabalho-1', nome: 'Burnout — fases e instrumentos de avaliação (MBI)' },
                  { id: 'psi-p7-psicopatologia-trabalho-2', nome: 'Assédio moral e suas consequências psicológicas' }
                ]
              },
              {
                id: 'psi-p7-ergonomia',
                nome: 'Ergonomia e qualidade de vida',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-ergonomia-1', nome: 'NR-17 e saúde mental' },
                  { id: 'psi-p7-ergonomia-2', nome: 'Programas de qualidade de vida no trabalho (QVT)' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p7-hospitalar',
        nome: 'Psicologia Hospitalar',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p7-contexto-hospitalar',
            nome: 'Psicologia no Contexto Hospitalar',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-equipe-multi',
                nome: 'O psicólogo na equipe multidisciplinar',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-equipe-multi-1', nome: 'UTI, oncologia e cuidados paliativos' },
                  { id: 'psi-p7-equipe-multi-2', nome: 'Comunicação de más notícias' }
                ]
              },
              {
                id: 'psi-p7-humanizacao',
                nome: 'Humanização hospitalar',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-humanizacao-1', nome: 'Política Nacional de Humanização (PNH)' },
                  { id: 'psi-p7-humanizacao-2', nome: 'Acolhimento e vínculo na saúde' }
                ]
              }
            ]
          },
          {
            id: 'psi-p7-adoecimento',
            nome: 'Adoecimento e Hospitalização',
            incluido: false,
            modulos: [
              {
                id: 'psi-p7-doenca-cronica',
                nome: 'Impacto psicológico da doença crônica',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-doenca-cronica-1', nome: 'Fases de adaptação à doença (modelo de Kübler-Ross)' },
                  { id: 'psi-p7-doenca-cronica-2', nome: 'Adesão ao tratamento e subjetividade' }
                ]
              },
              {
                id: 'psi-p7-cuidados-paliativos',
                nome: 'Cuidados paliativos e luto',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p7-cuidados-paliativos-1', nome: 'Finitude, morte e processo de morrer' },
                  { id: 'psi-p7-cuidados-paliativos-2', nome: 'Luto antecipatório e apoio à família' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 8º PERÍODO
    // ═══════════════════════════════════════════════════════════
    8: [
      {
        id: 'psi-p8-politicas-publicas',
        nome: 'Psicologia e Políticas Públicas',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p8-sus-redes',
            nome: 'Psicologia no SUS e Redes de Atenção',
            incluido: false,
            modulos: [
              {
                id: 'psi-p8-atencao-basica',
                nome: 'Atenção básica e saúde mental',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-atencao-basica-1', nome: 'NASF e o psicólogo na ESF' },
                  { id: 'psi-p8-atencao-basica-2', nome: 'Matriciamento em saúde mental' }
                ]
              },
              {
                id: 'psi-p8-redes-protecao',
                nome: 'Redes de proteção social',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-redes-protecao-1', nome: 'CRAS, CREAS e o SUAS' },
                  { id: 'psi-p8-redes-protecao-2', nome: 'Psicólogo no contexto de assistência social' }
                ]
              }
            ]
          },
          {
            id: 'psi-p8-politicas-saude-mental',
            nome: 'Políticas de Saúde Mental no Brasil',
            incluido: false,
            modulos: [
              {
                id: 'psi-p8-reforma-psiquiatrica',
                nome: 'Reforma Psiquiátrica Brasileira',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-reforma-psiquiatrica-1', nome: 'Histórico — do manicômio ao CAPS' },
                  { id: 'psi-p8-reforma-psiquiatrica-2', nome: 'Desafios atuais da desinstitucionalização' }
                ]
              },
              {
                id: 'psi-p8-politicas-especificas',
                nome: 'Políticas específicas',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-politicas-especificas-1', nome: 'Política Nacional de Saúde Mental para populações vulneráveis' },
                  { id: 'psi-p8-politicas-especificas-2', nome: 'Crack, álcool e outras drogas — políticas de atenção' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p8-projeto-pesquisa',
        nome: 'Projeto de Pesquisa em Psicologia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p8-metodologia',
            nome: 'Metodologia Científica',
            incluido: false,
            modulos: [
              {
                id: 'psi-p8-tipos-pesquisa',
                nome: 'Tipos de pesquisa',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-tipos-pesquisa-1', nome: 'Pesquisa quantitativa, qualitativa e mista' },
                  { id: 'psi-p8-tipos-pesquisa-2', nome: 'Pesquisa-ação e pesquisa participante' }
                ]
              },
              {
                id: 'psi-p8-revisao-literatura',
                nome: 'Revisão de literatura',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-revisao-literatura-1', nome: 'Revisão sistemática e meta-análise' },
                  { id: 'psi-p8-revisao-literatura-2', nome: 'Uso de bases de dados (PsycINFO, Scielo, PubMed)' }
                ]
              }
            ]
          },
          {
            id: 'psi-p8-etica-pesquisa',
            nome: 'Ética na Pesquisa',
            incluido: false,
            modulos: [
              {
                id: 'psi-p8-cep',
                nome: 'CEP e normas éticas',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-cep-1', nome: 'Resolução 510/2016 — pesquisa com seres humanos em ciências humanas' },
                  { id: 'psi-p8-cep-2', nome: 'Termo de Consentimento Livre e Esclarecido (TCLE)' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p8-genero-sexualidade',
        nome: 'Psicologia, Gênero e Sexualidade Humana',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p8-genero-identidade',
            nome: 'Gênero e Identidade',
            incluido: false,
            modulos: [
              {
                id: 'psi-p8-construcao-genero',
                nome: 'Construção social do gênero',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-construcao-genero-1', nome: 'Binarismo de gênero e críticas feministas' },
                  { id: 'psi-p8-construcao-genero-2', nome: 'Identidade de gênero e transexualidade' }
                ]
              },
              {
                id: 'psi-p8-psicologia-feminista',
                nome: 'Psicologia feminista',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-psicologia-feminista-1', nome: 'Interseccionalidade (gênero, raça e classe)' },
                  { id: 'psi-p8-psicologia-feminista-2', nome: 'Violência de gênero e saúde mental' }
                ]
              }
            ]
          },
          {
            id: 'psi-p8-sexualidade',
            nome: 'Sexualidade Humana',
            incluido: false,
            modulos: [
              {
                id: 'psi-p8-orientacao-sexual',
                nome: 'Orientação sexual e diversidade',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-orientacao-sexual-1', nome: 'LGBTfobia e impacto psicológico' },
                  { id: 'psi-p8-orientacao-sexual-2', nome: 'Resolução CFP 01/2018 — não patologização da homossexualidade' }
                ]
              },
              {
                id: 'psi-p8-saude-sexual',
                nome: 'Saúde sexual',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-saude-sexual-1', nome: 'Disfunções sexuais e abordagem terapêutica' },
                  { id: 'psi-p8-saude-sexual-2', nome: 'Educação sexual e prevenção' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'psi-p8-neuropsicologia',
        nome: 'Neuropsicologia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p8-fundamentos-neuro',
            nome: 'Fundamentos da Neuropsicologia',
            incluido: false,
            modulos: [
              {
                id: 'psi-p8-funcoes-executivas',
                nome: 'Funções executivas',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-funcoes-executivas-1', nome: 'Planejamento, inibição, flexibilidade cognitiva e memória de trabalho' },
                  { id: 'psi-p8-funcoes-executivas-2', nome: 'Avaliação das funções executivas (BRIEF, WCST, FAS)' }
                ]
              },
              {
                id: 'psi-p8-avaliacao-neuro',
                nome: 'Avaliação neuropsicológica',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-avaliacao-neuro-1', nome: 'Baterias neuropsicológicas (NEUPSILIN, BANFE)' },
                  { id: 'psi-p8-avaliacao-neuro-2', nome: 'Diagnóstico diferencial — TDAH, TEA e demências' }
                ]
              }
            ]
          },
          {
            id: 'psi-p8-neuro-clinica',
            nome: 'Neuropsicologia Clínica',
            incluido: false,
            modulos: [
              {
                id: 'psi-p8-lesoes',
                nome: 'Lesões e síndromes neurológicas',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-lesoes-1', nome: 'Afasias, apraxias e agnosias' },
                  { id: 'psi-p8-lesoes-2', nome: 'Traumatismo cranioencefálico (TCE) e reabilitação' }
                ]
              },
              {
                id: 'psi-p8-neuro-desenvolvimento',
                nome: 'Neuropsicologia do desenvolvimento',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p8-neuro-desenvolvimento-1', nome: 'TDAH — bases neurológicas e intervenção' },
                  { id: 'psi-p8-neuro-desenvolvimento-2', nome: 'TEA — perfil neuropsicológico' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 9º PERÍODO
    // ═══════════════════════════════════════════════════════════
    9: [
      {
        id: 'psi-p9-psicopatologia-aplicada',
        nome: 'Psicopatologia Aplicada',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p9-transtornos-humor',
            nome: 'Transtornos do Humor',
            incluido: false,
            modulos: [
              {
                id: 'psi-p9-depressao',
                nome: 'Depressão',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p9-depressao-1', nome: 'Critérios diagnósticos — DSM-5 e CID-11' },
                  { id: 'psi-p9-depressao-2', nome: 'Depressão maior, distimia e transtorno disruptivo do humor' },
                  { id: 'psi-p9-depressao-3', nome: 'Avaliação de risco de suicídio' }
                ]
              },
              {
                id: 'psi-p9-bipolar',
                nome: 'Transtorno Bipolar',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p9-bipolar-1', nome: 'Tipo I, Tipo II e ciclotimia' },
                  { id: 'psi-p9-bipolar-2', nome: 'Episódios maníacos e mistos' }
                ]
              }
            ]
          },
          {
            id: 'psi-p9-transtornos-ansiedade',
            nome: 'Transtornos de Ansiedade',
            incluido: false,
            modulos: [
              {
                id: 'psi-p9-fobias-tag',
                nome: 'Fobias, TAG e transtorno do pânico',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p9-fobias-tag-1', nome: 'Diferenças clínicas entre os quadros ansiosos' },
                  { id: 'psi-p9-fobias-tag-2', nome: 'Modelos cognitivos e neurobiológicos da ansiedade' }
                ]
              },
              {
                id: 'psi-p9-tept',
                nome: 'TEPT e transtorno de estresse agudo',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p9-tept-1', nome: 'Trauma psicológico — critérios e avaliação' },
                  { id: 'psi-p9-tept-2', nome: 'Intervenções baseadas em trauma (EMDR, TCC-trauma)' }
                ]
              }
            ]
          },
          {
            id: 'psi-p9-transtornos-psicoticos',
            nome: 'Transtornos Psicóticos',
            incluido: false,
            modulos: [
              {
                id: 'psi-p9-esquizofrenia',
                nome: 'Esquizofrenia',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p9-esquizofrenia-1', nome: 'Sintomas positivos, negativos e cognitivos' },
                  { id: 'psi-p9-esquizofrenia-2', nome: 'Evolução, prognóstico e intervenção psicossocial' }
                ]
              },
              {
                id: 'psi-p9-outros-psicoticos',
                nome: 'Outros transtornos psicóticos',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p9-outros-psicoticos-1', nome: 'Transtorno esquizoafetivo e transtorno delirante' },
                  { id: 'psi-p9-outros-psicoticos-2', nome: 'Primeiro episódio psicótico — abordagem clínica' }
                ]
              }
            ]
          },
          {
            id: 'psi-p9-transtornos-personalidade',
            nome: 'Transtornos de Personalidade',
            incluido: false,
            modulos: [
              {
                id: 'psi-p9-clusters',
                nome: 'Cluster A, B e C',
                horasEstimadas: 18,
                incluido: false,
                submodulos: [
                  { id: 'psi-p9-clusters-1', nome: 'TPB (Borderline) — critérios, DBT e manejo' },
                  { id: 'psi-p9-clusters-2', nome: 'TPNarcisista, TPAntissocial e TPEvitativa' }
                ]
              },
              {
                id: 'psi-p9-avaliacao-personalidade',
                nome: 'Avaliação de personalidade',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p9-avaliacao-personalidade-1', nome: 'SCID-II e PDQ-4' },
                  { id: 'psi-p9-avaliacao-personalidade-2', nome: 'Formulação de caso com transtorno de personalidade' }
                ]
              }
            ]
          }
        ]
      }
    ],

    // ═══════════════════════════════════════════════════════════
    // 10º PERÍODO
    // ═══════════════════════════════════════════════════════════
    10: [
      {
        id: 'psi-p10-psicofarmacologia',
        nome: 'Psicofarmacologia',
        incluido: false,
        subtopicos: [
          {
            id: 'psi-p10-psicofarmacos-snc',
            nome: 'Psicofármacos e Sistema Nervoso Central',
            incluido: false,
            modulos: [
              {
                id: 'psi-p10-antidepressivos',
                nome: 'Antidepressivos',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p10-antidepressivos-1', nome: 'ISRS, IRSN e tricíclicos — mecanismo de ação' },
                  { id: 'psi-p10-antidepressivos-2', nome: 'Efeitos colaterais e interações medicamentosas' }
                ]
              },
              {
                id: 'psi-p10-ansioliticos',
                nome: 'Ansiolíticos e hipnóticos',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p10-ansioliticos-1', nome: 'Benzodiazepínicos — uso e riscos de dependência' },
                  { id: 'psi-p10-ansioliticos-2', nome: 'Buspirona e outras alternativas' }
                ]
              }
            ]
          },
          {
            id: 'psi-p10-psicofarmacos-condicao',
            nome: 'Psicofármacos por Condição Clínica',
            incluido: false,
            modulos: [
              {
                id: 'psi-p10-antipsicoticos',
                nome: 'Antipsicóticos',
                horasEstimadas: 16,
                incluido: false,
                submodulos: [
                  { id: 'psi-p10-antipsicoticos-1', nome: 'Típicos e atípicos — diferenças e usos' },
                  { id: 'psi-p10-antipsicoticos-2', nome: 'Síndrome metabólica e discinesia tardia' }
                ]
              },
              {
                id: 'psi-p10-estabilizadores',
                nome: 'Estabilizadores do humor',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p10-estabilizadores-1', nome: 'Lítio — mecanismo, janela terapêutica e monitoramento' },
                  { id: 'psi-p10-estabilizadores-2', nome: 'Anticonvulsivantes como estabilizadores (valproato, lamotrigina)' }
                ]
              }
            ]
          },
          {
            id: 'psi-p10-farmaco-pratica',
            nome: 'Psicofarmacologia e Prática do Psicólogo',
            incluido: false,
            modulos: [
              {
                id: 'psi-p10-integracao',
                nome: 'Integração farmacoterapia e psicoterapia',
                horasEstimadas: 14,
                incluido: false,
                submodulos: [
                  { id: 'psi-p10-integracao-1', nome: 'Quando indicar avaliação psiquiátrica' },
                  { id: 'psi-p10-integracao-2', nome: 'Efeitos dos psicofármacos no processo psicoterapêutico' }
                ]
              },
              {
                id: 'psi-p10-populacoes-especiais',
                nome: 'Psicofarmacologia em populações especiais',
                horasEstimadas: 12,
                incluido: false,
                submodulos: [
                  { id: 'psi-p10-populacoes-especiais-1', nome: 'Crianças, idosos e gestantes' },
                  { id: 'psi-p10-populacoes-especiais-2', nome: 'Comorbidades e polifarmácia' }
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
