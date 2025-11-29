export type UserDifficulty = 'facil' | 'medio' | 'dificil'
export type ModelType = 'enem' | 'uerj' | 'medicina-afya' | 'personalizado'
export type MedicinaAFYAPeriodo = 1 | 2 | 3 | 4 | 5

// Importar função para ENEM
import { getENEMTopicos } from './enem-topicos-helper'

export interface StudyTime {
  segunda: number // horas
  terca: number
  quarta: number
  quinta: number
  sexta: number
  sabado: number
  domingo: number
}

export interface ModuleItem {
  id: string
  nome: string
  horasEstimadas: number
  dificuldadeUsuario?: UserDifficulty // Dificuldade do usuário neste módulo
  incluido: boolean
}

export interface SubtopicItem {
  id: string
  nome: string
  modulos: ModuleItem[]
  dificuldadeUsuario?: UserDifficulty // Dificuldade do usuário neste subtópico
  incluido: boolean
}

export interface TopicItem {
  id: string
  nome: string
  subtopicos: SubtopicItem[]
  dificuldadeUsuario?: UserDifficulty // Dificuldade do usuário neste tópico
  incluido: boolean
}

export interface CronogramaTemplate {
  id: string
  nome: string
  modelo: ModelType
  descricao: string
  topicos: TopicItem[]
}

export interface CronogramaConfig {
  modelo: ModelType
  tempoEstudo: StudyTime
  topicosInclusos: string[] // IDs dos tópicos inclusos
  subtopicosInclusos: string[] // IDs dos subtópicos inclusos
  modulosInclusos: string[] // IDs dos módulos inclusos
}

export interface CronogramaGerado {
  _id?: string
  usuarioId: string
  titulo: string
  modelo: ModelType
  tempoEstudo: StudyTime
  config: CronogramaConfig
  cronograma: CronogramaItem[] // Cronograma dia a dia
  totalHoras: number
  dataCriacao: Date
  dataAtualizacao: Date
}

export interface CronogramaItem {
  dia: string // Segunda, Terça, etc
  data: string // YYYY-MM-DD
  horasDisponivel: number
  atividades: AtividadeCronograma[]
}

export interface AtividadeCronograma {
  id: string
  topico: string
  subtopico: string
  modulo: string
  dificuldadeUsuario: UserDifficulty
  horas: number
  descricao: string
  concluido: boolean
}

// Templates padrão
export const TEMPLATES: Record<ModelType, CronogramaTemplate> = {
  'enem': {
    id: 'enem',
    nome: 'ENEM',
    modelo: 'enem',
    descricao: 'Prepare-se para o ENEM com cronograma personalizado',
    topicos: getENEMTopicos()
  },
  'uerj': {
    id: 'uerj',
    nome: 'UERJ',
    modelo: 'uerj',
    descricao: 'Prepare-se para o vestibular UERJ',
    topicos: [
      {
        id: 'uerj-portugues',
        nome: 'Português / Linguagens',
        incluido: false,
        subtopicos: [
          {
            id: 'uerj-port-construcao',
            nome: 'Construção do Texto',
            incluido: false,
            modulos: [
              { id: 'uerj-port-tipologias', nome: 'Tipologias Textuais', horasEstimadas: 15, incluido: false },
              { id: 'uerj-port-generos', nome: 'Gêneros Textuais', horasEstimadas: 20, incluido: false },
              { id: 'uerj-port-perspectivas', nome: 'Perspectivas Enunciativas', horasEstimadas: 18, incluido: false },
              { id: 'uerj-port-polifonia', nome: 'Polifonia e Intertextualidade', horasEstimadas: 22, incluido: false },
              { id: 'uerj-port-argumentacao', nome: 'Métodos de Argumentação', horasEstimadas: 16, incluido: false },
              { id: 'uerj-port-articulacao', nome: 'Articulação de Ideias', horasEstimadas: 20, incluido: false },
              { id: 'uerj-port-coesao', nome: 'Coesão e Coerência', horasEstimadas: 18, incluido: false },
              { id: 'uerj-port-semantica', nome: 'Relações Semânticas', horasEstimadas: 25, incluido: false },
              { id: 'uerj-port-morfossintaxe', nome: 'Morfossintaxe', horasEstimadas: 30, incluido: false },
              { id: 'uerj-port-naoverbais', nome: 'Elementos Não Verbais', horasEstimadas: 12, incluido: false }
            ]
          },
          {
            id: 'uerj-port-aspectos',
            nome: 'Aspectos Literários',
            incluido: false,
            modulos: [
              { id: 'uerj-port-natureza', nome: 'Natureza dos Textos', horasEstimadas: 15, incluido: false },
              { id: 'uerj-port-literatura-sociedade', nome: 'Literatura e Sociedade', horasEstimadas: 20, incluido: false },
              { id: 'uerj-port-representacoes', nome: 'Representações da Realidade', horasEstimadas: 18, incluido: false },
              { id: 'uerj-port-elementos-narrativa', nome: 'Elementos da Narrativa', horasEstimadas: 25, incluido: false },
              { id: 'uerj-port-recursos', nome: 'Recursos Estilísticos', horasEstimadas: 22, incluido: false }
            ]
          }
        ]
      },
      {
        id: 'uerj-matematica',
        nome: 'Matemática',
        incluido: false,
        subtopicos: [
          {
            id: 'uerj-mat-aritmetica',
            nome: 'Aritmética',
            incluido: false,
            modulos: [
              { id: 'uerj-mat-sistema-decimal', nome: 'Sistema Decimal e Operações', horasEstimadas: 12, incluido: false },
              { id: 'uerj-mat-naturais', nome: 'Números Naturais', horasEstimadas: 15, incluido: false },
              { id: 'uerj-mat-reais', nome: 'Números Reais e Intervalos', horasEstimadas: 14, incluido: false },
              { id: 'uerj-mat-razoes', nome: 'Razões, Proporções e Regra de Três', horasEstimadas: 18, incluido: false },
              { id: 'uerj-mat-conjuntos', nome: 'Conjuntos', horasEstimadas: 16, incluido: false }
            ]
          },
          {
            id: 'uerj-mat-algebra',
            nome: 'Álgebra',
            incluido: false,
            modulos: [
              { id: 'uerj-mat-expressoes', nome: 'Expressões Algébricas', horasEstimadas: 15, incluido: false },
              { id: 'uerj-mat-equacoes', nome: 'Equações e Inequações', horasEstimadas: 20, incluido: false },
              { id: 'uerj-mat-funcoes', nome: 'Funções', horasEstimadas: 35, incluido: false },
              { id: 'uerj-mat-sucessoes', nome: 'Sucessões Aritméticas e Geométricas', horasEstimadas: 20, incluido: false },
              { id: 'uerj-mat-combinatoria', nome: 'Análise Combinatória', horasEstimadas: 25, incluido: false },
              { id: 'uerj-mat-matrizes', nome: 'Matrizes e Determinantes', horasEstimadas: 22, incluido: false },
              { id: 'uerj-mat-sistemas', nome: 'Sistemas Lineares', horasEstimadas: 18, incluido: false }
            ]
          },
          {
            id: 'uerj-mat-geometria',
            nome: 'Geometria e Trigonometria',
            incluido: false,
            modulos: [
              { id: 'uerj-mat-geometria-plana', nome: 'Geometria Plana', horasEstimadas: 30, incluido: false },
              { id: 'uerj-mat-geometria-espacial', nome: 'Geometria Espacial', horasEstimadas: 28, incluido: false },
              { id: 'uerj-mat-trigonometria', nome: 'Trigonometria', horasEstimadas: 25, incluido: false }
            ]
          },
          {
            id: 'uerj-mat-estatistica',
            nome: 'Estatística e Probabilidade',
            incluido: false,
            modulos: [
              { id: 'uerj-mat-representacoes', nome: 'Representações Gráficas', horasEstimadas: 15, incluido: false },
              { id: 'uerj-mat-medidas', nome: 'Medidas Estatísticas', horasEstimadas: 20, incluido: false },
              { id: 'uerj-mat-probabilidade', nome: 'Probabilidade', horasEstimadas: 22, incluido: false }
            ]
          }
        ]
      },
      {
        id: 'uerj-fisica',
        nome: 'Física',
        incluido: false,
        subtopicos: [
          {
            id: 'uerj-fis-mecanica',
            nome: 'Mecânica',
            incluido: false,
            modulos: [
              { id: 'uerj-fis-grandezas', nome: 'Grandezas e Vetores', horasEstimadas: 12, incluido: false },
              { id: 'uerj-fis-leis-newton', nome: 'Leis de Newton', horasEstimadas: 20, incluido: false },
              { id: 'uerj-fis-energia', nome: 'Energia e Trabalho', horasEstimadas: 22, incluido: false },
              { id: 'uerj-fis-estatica', nome: 'Estática', horasEstimadas: 18, incluido: false },
              { id: 'uerj-fis-hidrostática', nome: 'Hidrostática', horasEstimadas: 16, incluido: false }
            ]
          },
          {
            id: 'uerj-fis-eletromagnetismo',
            nome: 'Eletromagnetismo',
            incluido: false,
            modulos: [
              { id: 'uerj-fis-eletrostatica', nome: 'Eletrostática e Eletrodinâmica', horasEstimadas: 25, incluido: false },
              { id: 'uerj-fis-eletromagnetismo-mod', nome: 'Eletromagnetismo', horasEstimadas: 20, incluido: false }
            ]
          },
          {
            id: 'uerj-fis-termologia',
            nome: 'Termologia',
            incluido: false,
            modulos: [
              { id: 'uerj-fis-temperatura', nome: 'Temperatura e Calor', horasEstimadas: 18, incluido: false },
              { id: 'uerj-fis-calorimetria', nome: 'Calorimetria', horasEstimadas: 16, incluido: false }
            ]
          }
        ]
      },
      {
        id: 'uerj-quimica',
        nome: 'Química',
        incluido: false,
        subtopicos: [
          {
            id: 'uerj-quim-constituintes',
            nome: 'Constituintes da Matéria',
            incluido: false,
            modulos: [
              { id: 'uerj-quim-atomico', nome: 'Modelo Atômico e Tabela Periódica', horasEstimadas: 20, incluido: false },
              { id: 'uerj-quim-ligacoes', nome: 'Ligações Químicas', horasEstimadas: 18, incluido: false }
            ]
          },
          {
            id: 'uerj-quim-transformacoes',
            nome: 'Transformações Químicas',
            incluido: false,
            modulos: [
              { id: 'uerj-quim-substancias', nome: 'Substâncias e Misturas', horasEstimadas: 14, incluido: false },
              { id: 'uerj-quim-solucoes', nome: 'Soluções', horasEstimadas: 16, incluido: false },
              { id: 'uerj-quim-gases', nome: 'Gases Ideais', horasEstimadas: 15, incluido: false },
              { id: 'uerj-quim-funcoes', nome: 'Funções Inorgânicas', horasEstimadas: 18, incluido: false },
              { id: 'uerj-quim-reacoes', nome: 'Reações Químicas', horasEstimadas: 20, incluido: false },
              { id: 'uerj-quim-estequiometria', nome: 'Estequiometria', horasEstimadas: 22, incluido: false },
              { id: 'uerj-quim-cinetica', nome: 'Cinética Química', horasEstimadas: 18, incluido: false },
              { id: 'uerj-quim-equilibrio', nome: 'Equilíbrio Químico', horasEstimadas: 20, incluido: false },
              { id: 'uerj-quim-ph', nome: 'pH e Ácidos/Bases', horasEstimadas: 16, incluido: false }
            ]
          }
        ]
      },
      {
        id: 'uerj-biologia',
        nome: 'Biologia',
        incluido: false,
        subtopicos: [
          {
            id: 'uerj-bio-bases',
            nome: 'Bases Moleculares',
            incluido: false,
            modulos: [
              { id: 'uerj-bio-biomoleculas', nome: 'Biomoléculas', horasEstimadas: 20, incluido: false }
            ]
          },
          {
            id: 'uerj-bio-energia',
            nome: 'Transformações Energéticas',
            incluido: false,
            modulos: [
              { id: 'uerj-bio-fotossintese', nome: 'Fotossíntese', horasEstimadas: 18, incluido: false },
              { id: 'uerj-bio-respiracao', nome: 'Respiração Celular', horasEstimadas: 20, incluido: false }
            ]
          },
          {
            id: 'uerj-bio-ambiente',
            nome: 'Seres Vivos e Ambiente',
            incluido: false,
            modulos: [
              { id: 'uerj-bio-ecologia', nome: 'Ecologia', horasEstimadas: 22, incluido: false },
              { id: 'uerj-bio-biodiversidade', nome: 'Biodiversidade e Evolução', horasEstimadas: 25, incluido: false }
            ]
          },
          {
            id: 'uerj-bio-citologia',
            nome: 'Citologia',
            incluido: false,
            modulos: [
              { id: 'uerj-bio-celula', nome: 'Estrutura e Função de Organelas', horasEstimadas: 20, incluido: false },
              { id: 'uerj-bio-divisao', nome: 'Divisão Celular', horasEstimadas: 22, incluido: false }
            ]
          },
          {
            id: 'uerj-bio-genetica',
            nome: 'Genética',
            incluido: false,
            modulos: [
              { id: 'uerj-bio-mendel', nome: 'Leis de Mendel', horasEstimadas: 20, incluido: false },
              { id: 'uerj-bio-codigo', nome: 'Código Genético', horasEstimadas: 18, incluido: false },
              { id: 'uerj-bio-hereditariedade', nome: 'Hereditariedade e Doenças Genéticas', horasEstimadas: 22, incluido: false }
            ]
          },
          {
            id: 'uerj-bio-fisiologia',
            nome: 'Fisiologia Humana',
            incluido: false,
            modulos: [
              { id: 'uerj-bio-sistemas', nome: 'Sistemas do Corpo Humano', horasEstimadas: 35, incluido: false },
              { id: 'uerj-bio-hormônios', nome: 'Hormônios e Metabolismo', horasEstimadas: 25, incluido: false },
              { id: 'uerj-bio-reproducao', nome: 'Reprodução Humana', horasEstimadas: 20, incluido: false }
            ]
          },
          {
            id: 'uerj-bio-doencas',
            nome: 'Doenças e Imunologia',
            incluido: false,
            modulos: [
              { id: 'uerj-bio-parasitarias', nome: 'Doenças Parasitárias', horasEstimadas: 18, incluido: false },
              { id: 'uerj-bio-imunologia', nome: 'Imunologia Básica', horasEstimadas: 20, incluido: false }
            ]
          }
        ]
      }
    ]
  },
  'medicina-afya': {
    id: 'medicina-afya',
    nome: 'Medicina AFYA',
    modelo: 'medicina-afya',
    descricao: 'Prepare-se para medicina com cronograma AFYA (SOI I-V + HAM I-V)',
    topicos: []
  },
  'personalizado': {
    id: 'personalizado',
    nome: 'Cronograma Personalizado',
    modelo: 'personalizado',
    descricao: 'Crie um cronograma do zero com seus próprios tópicos, subtópicos e módulos',
    topicos: []
  }
}
