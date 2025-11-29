import { TopicItem } from './cronograma-types'

export function getENEMTopicos(): TopicItem[] {
  return [
    // @ts-ignore - submodulos é opcional em ModuleItem
    {
      id: 'enem-portugues',
      nome: 'Português e Literatura',
      incluido: false,
      subtopicos: [
        {
          id: 'enem-port-dominar',
          nome: 'Dominar Linguagens - Norma culta e interpretação textual',
          incluido: false,
          modulos: [
            {
              id: 'enem-port-gramatica',
              nome: 'Gramática normativa e variação linguística',
              horasEstimadas: 25,
              incluido: false,
              submodulos: [
                { id: 'enem-port-gram-1', nome: 'Classes de palavras e funções sintáticas' },
                { id: 'enem-port-gram-2', nome: 'Período simples e composto: coordenação e subordinação' },
                { id: 'enem-port-gram-3', nome: 'Concordância, regência, crase e colocação pronominal' }
              ]
            },
            {
              id: 'enem-port-leitura',
              nome: 'Leitura e interpretação de textos verbais',
              horasEstimadas: 30,
              incluido: false,
              submodulos: [
                { id: 'enem-port-leit-1', nome: 'Tipos textuais e gêneros textuais' },
                { id: 'enem-port-leit-2', nome: 'Coesão e coerência textual' },
                { id: 'enem-port-leit-3', nome: 'Figuras de linguagem' }
              ]
            },
            {
              id: 'enem-port-variacao',
              nome: 'Variação linguística e funções da linguagem',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-port-var-1', nome: 'Variação diatópica, diastrática e diafásica' },
                { id: 'enem-port-var-2', nome: 'Funções de Jakobson' }
              ]
            }
          ]
        },
        {
          id: 'enem-lit-compreender',
          nome: 'Compreender Fenômenos - Literatura brasileira e portuguesa',
          incluido: false,
          modulos: [
            {
              id: 'enem-lit-escolas',
              nome: 'Escolas literárias e períodos históricos',
              horasEstimadas: 35,
              incluido: false,
              submodulos: [
                { id: 'enem-lit-esc-1', nome: 'Quinhentismo, Barroco e Arcadismo' },
                { id: 'enem-lit-esc-2', nome: 'Romantismo e Realismo/Naturalismo' },
                { id: 'enem-lit-esc-3', nome: 'Simbolismo, Parnasianismo e Modernismo' }
              ]
            },
            {
              id: 'enem-lit-temas',
              nome: 'Temas e contextos literários',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-lit-tem-1', nome: 'Identidade nacional, escravidão e imigração' },
                { id: 'enem-lit-tem-2', nome: 'Intertextualidade e paródia' }
              ]
            },
            {
              id: 'enem-lit-obras',
              nome: 'Análise de obras canônicas',
              horasEstimadas: 25,
              incluido: false,
              submodulos: [
                { id: 'enem-lit-obr-1', nome: 'Memórias Póstumas de Brás Cubas e Vidas Secas' },
                { id: 'enem-lit-obr-2', nome: 'Poesia concreta e literatura pós-moderna' }
              ]
            }
          ]
        },
        {
          id: 'enem-red-enfrentar',
          nome: 'Enfrentar Situações-Problema - Produção textual e argumentação',
          incluido: false,
          modulos: [
            {
              id: 'enem-red-estrutura',
              nome: 'Estrutura da redação dissertativa-argumentativa',
              horasEstimadas: 30,
              incluido: false,
              submodulos: [
                { id: 'enem-red-est-1', nome: 'Introdução, desenvolvimento e conclusão' },
                { id: 'enem-red-est-2', nome: 'Competências ENEM' }
              ]
            },
            {
              id: 'enem-red-analise',
              nome: 'Análise de textos argumentativos',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-red-ana-1', nome: 'Tese, argumentos e contra-argumentos' },
                { id: 'enem-red-ana-2', nome: 'Estratégias retóricas: ethos, pathos, logos' }
              ]
            }
          ]
        },
        {
          id: 'enem-arg-construir',
          nome: 'Construir Argumentação - Textos não literários',
          incluido: false,
          modulos: [
            {
              id: 'enem-arg-jornalistico',
              nome: 'Gêneros jornalísticos e publicitários',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-arg-jor-1', nome: 'Notícia, editorial, charge e propaganda' },
                { id: 'enem-arg-jor-2', nome: 'Discurso político e ideológico' }
              ]
            },
            {
              id: 'enem-arg-hibridos',
              nome: 'Textos híbridos e multimodais',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-arg-hib-1', nome: 'Charges, tirinhas e infográficos' }
              ]
            }
          ]
        },
        {
          id: 'enem-prop-elaborar',
          nome: 'Elaborar Propostas - Intervenção social na linguagem',
          incluido: false,
          modulos: [
            {
              id: 'enem-prop-intervencao',
              nome: 'Proposta de intervenção em temas sociais',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-prop-int-1', nome: 'Direitos humanos e inclusão linguística' },
                { id: 'enem-prop-int-2', nome: 'Soluções para intolerância verbal e fake news' }
              ]
            },
            {
              id: 'enem-prop-etica',
              nome: 'Reflexão ética na linguagem',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-prop-et-1', nome: 'Linguagem inclusiva e promoção da cidadania' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'enem-linguas',
      nome: 'Línguas Estrangeiras',
      incluido: false,
      subtopicos: [
        {
          id: 'enem-ling-dominar',
          nome: 'Dominar Linguagens - Vocabulário e gramática básica',
          incluido: false,
          modulos: [
            {
              id: 'enem-ling-ingles',
              nome: 'Inglês - Estruturas essenciais',
              horasEstimadas: 25,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-ing-1', nome: 'Tempos verbais e modais' },
                { id: 'enem-ling-ing-2', nome: 'Vocabulário temático' },
                { id: 'enem-ling-ing-3', nome: 'Preposições, conectores e phrasal verbs' }
              ]
            },
            {
              id: 'enem-ling-espanhol',
              nome: 'Espanhol - Estructuras básicas',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-esp-1', nome: 'Tiempos verbales y subjuntivo' },
                { id: 'enem-ling-esp-2', nome: 'Vocabulario temático' }
              ]
            }
          ]
        },
        {
          id: 'enem-ling-compreender',
          nome: 'Compreender Fenômenos - Interpretação de textos autênticos',
          incluido: false,
          modulos: [
            {
              id: 'enem-ling-leitura',
              nome: 'Leitura compreensiva',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-leit-1', nome: 'Textos jornalísticos e e-mails' },
                { id: 'enem-ling-leit-2', nome: 'Contextos globais' }
              ]
            },
            {
              id: 'enem-ling-analise',
              nome: 'Análise cultural',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-ana-1', nome: 'Referências culturais em textos' }
              ]
            }
          ]
        },
        {
          id: 'enem-ling-enfrentar',
          nome: 'Enfrentar Situações-Problema - Inferência e dedução',
          incluido: false,
          modulos: [
            {
              id: 'enem-ling-multipla',
              nome: 'Questões de múltipla escolha',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-mul-1', nome: 'Identificação de ideias principais' },
                { id: 'enem-ling-mul-2', nome: 'Comparação de opiniões' }
              ]
            },
            {
              id: 'enem-ling-aplicacao',
              nome: 'Aplicação prática',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-apl-1', nome: 'Interpretação de gráficos e tabelas' }
              ]
            }
          ]
        },
        {
          id: 'enem-ling-construir',
          nome: 'Construir Argumentação - Produção oral e escrita implícita',
          incluido: false,
          modulos: [
            {
              id: 'enem-ling-construcao',
              nome: 'Construção de respostas',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-cons-1', nome: 'Seleção de evidências textuais' }
              ]
            },
            {
              id: 'enem-ling-critica',
              nome: 'Crítica cultural',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-crit-1', nome: 'Análise de viés em textos midiáticos' }
              ]
            }
          ]
        },
        {
          id: 'enem-ling-elaborar',
          nome: 'Elaborar Propostas - Soluções globais',
          incluido: false,
          modulos: [
            {
              id: 'enem-ling-propostas',
              nome: 'Propostas em contexto internacional',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-prop-1', nome: 'Intervenções para temas globais' }
              ]
            },
            {
              id: 'enem-ling-cidadania',
              nome: 'Cidadania intercultural',
              horasEstimadas: 10,
              incluido: false,
              submodulos: [
                { id: 'enem-ling-cid-1', nome: 'Promoção de diálogo multicultural' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'enem-matematica',
      nome: 'Matemática',
      incluido: false,
      subtopicos: [
        {
          id: 'enem-mat-dominar',
          nome: 'Dominar Linguagens - Linguagem matemática e raciocínio lógico',
          incluido: false,
          modulos: [
            {
              id: 'enem-mat-algebra',
              nome: 'Álgebra básica e avançada',
              horasEstimadas: 30,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-alg-1', nome: 'Equações, inequações e sistemas lineares' },
                { id: 'enem-mat-alg-2', nome: 'Razão, proporção, porcentagem e juros' },
                { id: 'enem-mat-alg-3', nome: 'Polinômios' }
              ]
            },
            {
              id: 'enem-mat-geometria',
              nome: 'Geometria plana e espacial',
              horasEstimadas: 30,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-geom-1', nome: 'Triângulos, quadriláteros e polígonos' },
                { id: 'enem-mat-geom-2', nome: 'Sólidos geométricos' },
                { id: 'enem-mat-geom-3', nome: 'Trigonometria' }
              ]
            },
            {
              id: 'enem-mat-combinatoria',
              nome: 'Análise combinatória e probabilidade',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-comb-1', nome: 'Permutações, arranjos e combinações' },
                { id: 'enem-mat-comb-2', nome: 'Probabilidade' }
              ]
            }
          ]
        },
        {
          id: 'enem-mat-compreender',
          nome: 'Compreender Fenômenos - Aplicações em contextos reais',
          incluido: false,
          modulos: [
            {
              id: 'enem-mat-estatistica',
              nome: 'Estatística e probabilidade aplicada',
              horasEstimadas: 25,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-est-1', nome: 'Medidas de tendência central e dispersão' },
                { id: 'enem-mat-est-2', nome: 'Análise de dados' }
              ]
            },
            {
              id: 'enem-mat-analitica',
              nome: 'Geometria analítica',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-ana-1', nome: 'Distância, reta e circunferência' },
                { id: 'enem-mat-ana-2', nome: 'Modelagem' }
              ]
            }
          ]
        },
        {
          id: 'enem-mat-enfrentar',
          nome: 'Enfrentar Situações-Problema - Resolução de problemas',
          incluido: false,
          modulos: [
            {
              id: 'enem-mat-problemas',
              nome: 'Problemas contextualizados',
              horasEstimadas: 25,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-prob-1', nome: 'Otimização e escalas' },
                { id: 'enem-mat-prob-2', nome: 'Lógica proposicional' }
              ]
            },
            {
              id: 'enem-mat-financeira',
              nome: 'Matemática financeira',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-fin-1', nome: 'Descontos, impostos e sequências' },
                { id: 'enem-mat-fin-2', nome: 'Modelos de crescimento' }
              ]
            }
          ]
        },
        {
          id: 'enem-mat-construir',
          nome: 'Construir Argumentação - Demonstração e justificativa',
          incluido: false,
          modulos: [
            {
              id: 'enem-mat-provas',
              nome: 'Provas lógicas',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-prov-1', nome: 'Indução matemática' },
                { id: 'enem-mat-prov-2', nome: 'Argumentação em geometria' }
              ]
            },
            {
              id: 'enem-mat-grafica',
              nome: 'Interpretação gráfica',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-graf-1', nome: 'Funções e representações' }
              ]
            }
          ]
        },
        {
          id: 'enem-mat-elaborar',
          nome: 'Elaborar Propostas - Modelagem matemática social',
          incluido: false,
          modulos: [
            {
              id: 'enem-mat-modelagem',
              nome: 'Propostas de intervenção',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-mod-1', nome: 'Modelos para planejamento urbano' },
                { id: 'enem-mat-mod-2', nome: 'Análise estatística' }
              ]
            },
            {
              id: 'enem-mat-etica',
              nome: 'Ética em dados',
              horasEstimadas: 10,
              incluido: false,
              submodulos: [
                { id: 'enem-mat-et-1', nome: 'Viés em estatísticas' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'enem-humanas',
      nome: 'Ciências Humanas',
      incluido: false,
      subtopicos: [
        {
          id: 'enem-hum-compreender',
          nome: 'Compreender Fenômenos - Processos histórico-geográficos',
          incluido: false,
          modulos: [
            {
              id: 'enem-hum-historia',
              nome: 'História do Brasil e mundial',
              horasEstimadas: 35,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-hist-1', nome: 'Colonização, independência e república' },
                { id: 'enem-hum-hist-2', nome: 'História global' },
                { id: 'enem-hum-hist-3', nome: 'Movimentos sociais' }
              ]
            },
            {
              id: 'enem-hum-geografia',
              nome: 'Geografia física e humana',
              horasEstimadas: 30,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-geog-1', nome: 'Relevo, clima e biomas' },
                { id: 'enem-hum-geog-2', nome: 'Urbanização e migrações' },
                { id: 'enem-hum-geog-3', nome: 'Questões ambientais' }
              ]
            },
            {
              id: 'enem-hum-filosofia',
              nome: 'Filosofia e Sociologia',
              horasEstimadas: 25,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-fil-1', nome: 'Filosofia: história e pensadores' },
                { id: 'enem-hum-fil-2', nome: 'Sociologia: conceitos e autores' }
              ]
            }
          ]
        },
        {
          id: 'enem-hum-enfrentar',
          nome: 'Enfrentar Situações-Problema - Análise de fontes e mapas',
          incluido: false,
          modulos: [
            {
              id: 'enem-hum-documentos',
              nome: 'Interpretação de documentos históricos',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-doc-1', nome: 'Cartas, manifestos e charges' },
                { id: 'enem-hum-doc-2', nome: 'Mapas temáticos' }
              ]
            },
            {
              id: 'enem-hum-contemporaneos',
              nome: 'Problemas contemporâneos',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-cont-1', nome: 'Conflitos e migrações' },
                { id: 'enem-hum-cont-2', nome: 'Políticas públicas' }
              ]
            }
          ]
        },
        {
          id: 'enem-hum-construir',
          nome: 'Construir Argumentação - Relação entre fatos e conceitos',
          incluido: false,
          modulos: [
            {
              id: 'enem-hum-causas',
              nome: 'Causas e consequências',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-caus-1', nome: 'Revoluções e impactos sociais' },
                { id: 'enem-hum-caus-2', nome: 'Argumentação filosófica' }
              ]
            },
            {
              id: 'enem-hum-debates',
              nome: 'Debates sociológicos',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-deb-1', nome: 'Identidade e multiculturalismo' }
              ]
            }
          ]
        },
        {
          id: 'enem-hum-elaborar',
          nome: 'Elaborar Propostas - Intervenções solidárias',
          incluido: false,
          modulos: [
            {
              id: 'enem-hum-desigualdades',
              nome: 'Propostas para desigualdades',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-desig-1', nome: 'Educação inclusiva' },
                { id: 'enem-hum-desig-2', nome: 'Sustentabilidade' }
              ]
            },
            {
              id: 'enem-hum-cidadania',
              nome: 'Cidadania ativa',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-hum-cid-1', nome: 'Participação política' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'enem-natureza',
      nome: 'Ciências da Natureza',
      incluido: false,
      subtopicos: [
        {
          id: 'enem-nat-compreender',
          nome: 'Compreender Fenômenos - Conceitos científicos',
          incluido: false,
          modulos: [
            {
              id: 'enem-nat-quimica',
              nome: 'Química - Estrutura da matéria',
              horasEstimadas: 30,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-quim-1', nome: 'Átomos, moléculas e ligações' },
                { id: 'enem-nat-quim-2', nome: 'Estequiometria e soluções' },
                { id: 'enem-nat-quim-3', nome: 'Cinética e equilíbrio' }
              ]
            },
            {
              id: 'enem-nat-fisica',
              nome: 'Física - Mecânica e energia',
              horasEstimadas: 30,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-fis-1', nome: 'Cinemática e dinâmica' },
                { id: 'enem-nat-fis-2', nome: 'Ondas, som e luz' },
                { id: 'enem-nat-fis-3', nome: 'Eletricidade' }
              ]
            },
            {
              id: 'enem-nat-biologia',
              nome: 'Biologia - Organização do vivente',
              horasEstimadas: 30,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-bio-1', nome: 'Célula e genética' },
                { id: 'enem-nat-bio-2', nome: 'Ecologia e evolução' }
              ]
            }
          ]
        },
        {
          id: 'enem-nat-enfrentar',
          nome: 'Enfrentar Situações-Problema - Aplicações experimentais',
          incluido: false,
          modulos: [
            {
              id: 'enem-nat-experimentos',
              nome: 'Experimentos e modelagem',
              horasEstimadas: 25,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-exp-1', nome: 'Gráficos e análise de dados' },
                { id: 'enem-nat-exp-2', nome: 'Problemas ambientais' }
              ]
            },
            {
              id: 'enem-nat-saude',
              nome: 'Saúde e tecnologia',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-sau-1', nome: 'Vacinas e antibióticos' },
                { id: 'enem-nat-sau-2', nome: 'Energia renovável' }
              ]
            }
          ]
        },
        {
          id: 'enem-nat-construir',
          nome: 'Construir Argumentação - Relação teoria-prática',
          incluido: false,
          modulos: [
            {
              id: 'enem-nat-hipoteses',
              nome: 'Hipóteses e evidências',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-hip-1', nome: 'Método científico' },
                { id: 'enem-nat-hip-2', nome: 'Debates éticos' }
              ]
            },
            {
              id: 'enem-nat-interdisciplinaridade',
              nome: 'Interdisciplinaridade',
              horasEstimadas: 15,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-inter-1', nome: 'Química-física e biologia-química' }
              ]
            }
          ]
        },
        {
          id: 'enem-nat-elaborar',
          nome: 'Elaborar Propostas - Intervenções ambientais e de saúde',
          incluido: false,
          modulos: [
            {
              id: 'enem-nat-sustentaveis',
              nome: 'Soluções sustentáveis',
              horasEstimadas: 20,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-sust-1', nome: 'Reciclagem e energias alternativas' },
                { id: 'enem-nat-sust-2', nome: 'Prevenção de doenças' }
              ]
            },
            {
              id: 'enem-nat-inclusao',
              nome: 'Inclusão científica',
              horasEstimadas: 10,
              incluido: false,
              submodulos: [
                { id: 'enem-nat-incl-1', nome: 'Educação ambiental' }
              ]
            }
          ]
        }
      ]
    }
  ]
}
