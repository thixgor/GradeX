import type { DoencaCanonicaEntrada } from '../../esquemas'

export const linfomaDeHodgkin: DoencaCanonicaEntrada = {
  id: 'linfoma-de-hodgkin',
  slug: 'linfoma-de-hodgkin',
  nome: 'Linfoma de Hodgkin clássico',
  sinonimos: ['doença de Hodgkin', 'linfoma de Hodgkin'],
  sinonimosEmIngles: ['classic Hodgkin lymphoma', 'Hodgkin lymphoma'],
  sistemaId: 'hematolinfoide',
  orgaos: ['Linfonodo', 'Baço', 'Medula óssea'],
  natureza: 'neoplasica-maligna',
  catalogoIds: [
    'histopathology-atlas-hodgkin-lymphoma-7ecb5b6f8d',
    'unicamp-oh-7-c865ea0f28',
    'unicamp-oh-33-56ac3a7c8a',
  ],
  mecanismoIds: ['invasao-neoplasica', 'inflamacao-cronica'],
  padroesMorfologicos: ['células de Hodgkin/Reed–Sternberg', 'fundo inflamatório misto', 'bandas fibrosas'],
  conteudo: {
    objetivos: [
      'Encontrar as raras células neoplásicas dentro do microambiente reativo.',
      'Interpretar CD30, CD15, PAX5 e CD45 como perfil integrado.',
      'Separar linfoma de Hodgkin clássico de ALCL, grandes células B e linfoma de Hodgkin nodular com predomínio linfocitário.',
    ],
    definicao:
      'Neoplasia linfoide de origem B na qual células de Hodgkin/Reed–Sternberg são escassas e sobrevivem em um microambiente abundante de linfócitos, histiócitos, eosinófilos e plasmócitos.',
    etiologias: [{
      agente: 'Transformação de célula B do centro germinativo, com EBV em uma parcela dos casos',
      categoria: 'neoplasica',
      explicacao: 'A célula tumoral perde grande parte do programa B e recruta células reativas por citocinas; EBV pode fornecer sinais de sobrevivência.',
    }],
    fatoresDeRisco: [{
      fator: 'Imunodeficiência, inclusive infecção por HIV',
      porQue: 'Controle imune reduzido favorece clones associados a EBV.',
      forca: 'estabelecido',
    }],
    histologiaNormalDeReferencia: [{
      titulo: 'Linfonodo normal — córtex, paracórtex e medula',
      caminhoNormal: [
        'orgaos-e-sistemas',
        'sistema-linfoide',
        'organs',
        'lymph-node',
        'lymph-node-1',
      ],
      oQueObservar: 'Cápsula, seio subcapsular, folículos corticais, paracórtex e cordões medulares em compartimentos reconhecíveis.',
      aproximado: false,
    }],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'invasao-neoplasica',
        aplicacao: 'Células HRS clonais substituem a arquitetura e podem disseminar-se de modo contíguo entre cadeias linfonodais.',
      },
      {
        mecanismoId: 'inflamacao-cronica',
        aplicacao: 'A maior parte da massa é reativa: quimiocinas tumorais recrutam eosinófilos, linfócitos, histiócitos e plasmócitos que sustentam o clone.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Célula B adquire programa de sobrevivência anormal',
        porQue: 'Ativação constitutiva de vias como NF-κB impede apoptose apesar da perda do receptor B funcional.',
      },
      {
        etapa: 'resposta-celular',
        titulo: 'Formação de células HRS e secreção de citocinas',
        porQue: 'O clone torna-se grande, multinucleado e recruta uma população reativa muito mais numerosa.',
        achadoAssociado: 'Células grandes mono ou binucleadas com nucléolos eosinofílicos proeminentes.',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Microambiente inflamatório e, no subtipo nodular esclerose, fibrose',
        porQue: 'Citocinas atraem células reativas e ativam fibroblastos.',
        achadoAssociado: 'Fundo misto e bandas colágenas que dividem o linfonodo.',
      },
      {
        etapa: 'disfuncao',
        titulo: 'Substituição linfonodal e produção sistêmica de citocinas',
        porQue: 'A arquitetura imune se perde e mediadores inflamatórios circulantes afetam todo o organismo.',
      },
      {
        etapa: 'clinica',
        titulo: 'Adenomegalia e sintomas B',
        porQue: 'Expansão nodal causa massa; citocinas contribuem para febre, sudorese e perda ponderal.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Disseminação nodal, extranodal ou medular',
        porQue: 'A progressão costuma alcançar cadeias linfonodais contíguas e, em estágios avançados, baço, medula e outros órgãos.',
      },
    ],
    macroscopia: [{
      achado: 'Linfonodos aumentados, firmes, confluentes e branco-acinzentados',
      processo: 'Substituição por tumor, infiltrado reativo e fibrose variável.',
      consequencia: 'Sugere linfoma, mas classificação depende de arquitetura, citologia e IHQ.',
      peso: 'frequente',
    }],
    histopatologia: {
      panoramica: {
        procure: 'Avalie apagamento arquitetural, nodularidade, bandas fibrosas e áreas de necrose.',
        achados: [{
          achado: 'Arquitetura parcialmente ou totalmente substituída por infiltrado difuso ou nodular',
          processo: 'Expansão tumoral e do microambiente reativo.',
          consequencia: 'Favorece linfoma sobre hiperplasia reativa, mas não define subtipo.',
          peso: 'necessário',
        }],
      },
      pequeno: {
        procure: 'Procure bandas largas, nódulos e composição do fundo inflamatório.',
        achados: [{
          achado: 'Fundo polimorfo com linfócitos, eosinófilos, histiócitos e plasmócitos',
          processo: 'Recrutamento por citocinas secretadas pelas células HRS.',
          consequencia: 'É contexto característico; um tapete monomorfo pede outro linfoma.',
          peso: 'sugestivo',
        }],
      },
      medio: {
        procure: 'Faça busca sistemática por células grandes atípicas entre células reativas.',
        achados: [{
          achado: 'Células de Hodgkin mononucleadas e variantes Reed–Sternberg binucleadas',
          processo: 'Clone B transformado com falha de citocinese e grande atividade transcricional.',
          consequencia: 'Levanta a hipótese, que exige fenótipo apropriado.',
          peso: 'necessário',
        }],
      },
      grande: {
        procure: 'Confirme nucléolos, membrana nuclear e eventuais células lacunares.',
        achados: [{
          achado: 'Nucléolos grandes eosinofílicos com halo claro, aspecto de olhos de coruja',
          processo: 'Nucléolo exuberante em célula neoplásica grande.',
          consequencia: 'Morfologia clássica, porém não patognomônica.',
          peso: 'sugestivo',
        }],
      },
      sintese:
        'O diagnóstico não é uma célula isolada: requer HRS em ambiente apropriado e perfil imunofenotípico coerente, com exclusão de mimetizadores.',
    },
    imunoHistoquimica: [{
      nome: 'CD30, CD15, PAX5, CD20 e CD45',
      tipo: 'imuno-histoquimica',
      pergunta: 'As células grandes têm o fenótipo de linfoma de Hodgkin clássico?',
      padraoEsperado: 'CD30 forte e difuso, CD15 frequente, PAX5 fraco; CD45 ausente e CD20 negativo ou fraco/heterogêneo.',
      limitacoes: ['CD30 e CD15 não são específicos; intensidade e localização devem ser avaliadas nas células-alvo.'],
      mudaODiferencial: 'PAX5 fraco e CD45 negativo apoiam Hodgkin clássico frente a ALCL e linfomas B de grandes células.',
    }],
    correlacaoClinica: [{
      achadoMorfologico: 'Microambiente rico em citocinas',
      consequenciaFuncional: 'Inflamação sistêmica e catabolismo.',
      manifestacao: 'Febre, sudorese noturna, prurido e perda ponderal.',
    }],
    diagnosticosDiferenciais: [
      {
        nome: 'Linfoma anaplásico de grandes células',
        motivoDaConfusao: 'Células grandes CD30 positivas podem lembrar HRS.',
        achadosCompartilhados: ['CD30 forte', 'células grandes pleomórficas'],
        discriminador: 'Fenótipo T/citotóxico ou ALK, PAX5 ausente e morfologia de células hallmark.',
      },
      {
        nome: 'Linfoma de Hodgkin nodular com predomínio linfocitário',
        motivoDaConfusao: 'Nome semelhante e células grandes em nódulos.',
        achadosCompartilhados: ['neoplasia B nodal', 'células grandes dispersas'],
        discriminador: 'Células LP expressam fortemente CD20/BCL6 e em geral não expressam CD30/CD15.',
      },
    ],
    complicacoes: [
      {
        complicacao: 'Disseminação extranodal ou medular',
        mecanismo: 'Progressão por cadeias linfáticas e, em doença avançada, via hematogênica.',
      },
      {
        complicacao: 'Neoplasias e toxicidades tardias relacionadas ao tratamento',
        mecanismo: 'Quimioterapia e radioterapia podem produzir dano orgânico e mutações secundárias.',
      },
    ],
    normalVersusPatologico: [
      {
        aspecto: 'Arquitetura',
        normal: 'Compartimentos corticais, paracorticais e medulares preservados.',
        patologico: 'Arquitetura apagada ou dividida por bandas fibrosas.',
      },
      {
        aspecto: 'População celular',
        normal: 'Mistura organizada sem células HRS.',
        patologico: 'Raras células HRS em fundo reativo desorganizado.',
      },
    ],
    resumoDeProva: [
      'A célula tumoral é minoria; a massa é majoritariamente microambiente reativo.',
      'Perfil clássico: CD30+, CD15 frequente, PAX5 fraco e CD45−.',
      'Reed–Sternberg não é patognomônica: contexto e painel são obrigatórios.',
    ],
    armadilhas: ['Diagnosticar por uma célula Reed–Sternberg-like isolada.', 'Confundir Hodgkin clássico com a entidade nodular de predomínio linfocitário.'],
    perguntasDeAutoavaliacao: [{
      pergunta: 'Qual perfil favorece linfoma de Hodgkin clássico em células grandes de um fundo inflamatório misto?',
      alternativas: [
        'CD30 forte, PAX5 fraco e CD45 negativo.',
        'CD20 forte, BCL6 forte e CD30 negativo.',
        'Citoqueratina forte e PAX8 positivo.',
        'Mieloperoxidase forte e CD117 positivo.',
      ],
      indiceCorreto: 0,
      devolutiva: 'O perfil demonstra ativação CD30 com programa B atenuado; os demais sugerem NLPHL, carcinoma ou neoplasia mieloide.',
      nivel: 'aprofundar',
    }],
    referencias: [
      {
        citacao: 'Alaggio R et al. The 5th edition of the World Health Organization Classification of Haematolymphoid Tumours: Lymphoid Neoplasms. Leukemia. 2022.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9214472/',
        organizacao: 'OMS',
        ano: 2022,
      },
      {
        citacao: 'Kumar V, Abbas AK, Aster JC. Robbins & Cotran Pathologic Basis of Disease. 10ª ed. Elsevier; 2021.',
        organizacao: 'Elsevier',
        edicao: '10ª',
        ano: 2021,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    versao: 1,
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão por hematopatologista antes de publicação médica definitiva.'],
    historico: [{
      data: '2026-08-10',
      autor: 'Edição Domine Aqui',
      nota: 'Capítulo aprofundado criado e consolidado a partir de três conjuntos de lâminas.',
    }],
  },
}
