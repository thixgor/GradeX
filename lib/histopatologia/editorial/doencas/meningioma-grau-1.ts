import type { DoencaCanonicaEntrada } from '../../esquemas'

export const meningiomaGrau1: DoencaCanonicaEntrada = {
  id: 'meningioma-grau-1',
  slug: 'meningioma-grau-1',
  nome: 'Meningioma grau 1',
  sinonimos: ['meningioma CNS WHO grau 1', 'meningioma benigno'],
  sinonimosEmIngles: ['meningioma CNS WHO grade 1', 'grade 1 meningioma'],
  sistemaId: 'sistema-nervoso',
  orgaos: ['Meninges'],
  natureza: 'neoplasica-benigna',
  catalogoIds: ['unicamp-meningiomas-grau-i-9eff67d87c'],
  mecanismoIds: ['proliferacao-benigna'],
  padroesMorfologicos: ['redemoinhos meningoteliais', 'pseudoinclusões nucleares', 'corpos psamomatosos', 'ancoragem dural'],
  conteudo: {
    objetivos: [
      'Reconhecer diferenciação meningotelial em arquitetura, citologia e imunofenótipo.',
      'Separar subtipo de grau e procurar sistematicamente critérios que elevam o grau.',
      'Interpretar invasão óssea, invasão cerebral e mitoses sem confundi-las.',
    ],
    definicao:
      'Neoplasia primária das meninges com diferenciação meningotelial e critérios de CNS WHO grau 1, geralmente de crescimento lento, sem invasão cerebral nem alterações histológicas ou moleculares que imponham grau superior.',
    etiologias: [{
      agente: 'Alterações somáticas, frequentemente perda de NF2/22q em parte dos sítios',
      categoria: 'genetica',
      explicacao: 'Perda de controle de contato e alterações dependentes da localização permitem expansão de células meningoteliais.',
    }],
    fatoresDeRisco: [
      { fator: 'Radioterapia craniana prévia', porQue: 'Dano genômico tardio pode originar meningiomas múltiplos ou biologicamente mais agressivos.', forca: 'estabelecido' },
      { fator: 'Neurofibromatose tipo 2', porQue: 'Perda germinativa de NF2 predispõe a meningiomas múltiplos e outros tumores do sistema nervoso.', forca: 'estabelecido' },
    ],
    histologiaNormalDeReferencia: [{
      titulo: 'Tecido nervoso normal — interface com parênquima',
      caminhoNormal: ['tecidos', 'tecido-nervoso', 'visao-geral', 'nervous-tissue-overview-1'],
      oQueObservar: 'Parênquima com neurônios e glia em neurópilo, sem línguas tumorais; as meninges normais são finas e não formam massa.',
      aproximado: true,
      notaDeAproximacao: 'O acervo normal não possui lâmina dedicada às células aracnoideas das meninges.',
    }],
    mecanismoPatologicoGeral: [{
      mecanismoId: 'proliferacao-benigna',
      aplicacao: 'Células meningoteliais formam massa expansiva aderida à dura, com redemoinhos e calcificação, comprimindo mais do que infiltrando o encéfalo.',
    }],
    fisiopatologiaEspecifica: [
      { etapa: 'gatilho', titulo: 'Clone meningotelial adquire vantagem proliferativa', porQue: 'Alteração de NF2 ou outra via dependente da topografia permite crescimento autônomo lento.' },
      { etapa: 'alvo', titulo: 'Células aracnoideas junto à dura e seios venosos', porQue: 'Essas células originam massas extra-axiais que permanecem ligadas a superfícies meníngeas.' },
      { etapa: 'resposta-celular', titulo: 'Diferenciação meningotelial coesa', porQue: 'Células mantêm junções e membranas interdigitantes, formando lóbulos e redemoinhos.', achadoAssociado: 'Redemoinhos e pseudoinclusões nucleares.' },
      { etapa: 'resposta-tecidual', titulo: 'Massa dural expansiva e mineralização', porQue: 'Crescimento comprime o parênquima e redemoinhos degenerados podem calcificar em psamomas.' },
      { etapa: 'disfuncao', titulo: 'Compressão do encéfalo ou de nervos', porQue: 'Mesmo histologicamente benigno, o tumor desloca estruturas dentro de compartimento rígido.' },
      { etapa: 'complicacao', titulo: 'Recorrência ou déficit por localização crítica', porQue: 'Ressecção incompleta, sítio inacessível e alguns perfis moleculares permitem persistência apesar do grau baixo.' },
    ],
    macroscopia: [{
      achado: 'Massa extra-axial firme, bem delimitada e aderida à dura, por vezes calcificada',
      processo: 'Crescimento expansivo meningotelial com colágeno e corpos psamomatosos variáveis.',
      consequencia: 'Explica compressão e cauda dural; delimitação não elimina necessidade de examinar interface cerebral.',
      peso: 'frequente',
    }],
    histopatologia: {
      panoramica: {
        procure: 'Avalie padrão lobulado, cápsula, dura, osso e principalmente interface com o parênquima cerebral.',
        achados: [{
          achado: 'Tumor extra-axial relativamente circunscrito e lobulado',
          processo: 'Expansão coesa a partir das meninges, com compressão do tecido adjacente.',
          consequencia: 'Favorece meningioma de baixo grau, desde que não haja invasão cerebral verdadeira.',
          peso: 'frequente',
        }],
      },
      pequeno: {
        procure: 'Identifique redemoinhos, fascículos, lóbulos meningoteliais e psamomas e faça contagem mitótica dirigida.',
        achados: [{
          achado: 'Redemoinhos concêntricos e corpos psamomatosos',
          processo: 'Arranjo coeso com mineralização progressiva do centro dos redemoinhos.',
          consequencia: 'É assinatura de diferenciação meningotelial, não critério isolado de grau.',
          peso: 'sugestivo',
        }],
      },
      medio: {
        procure: 'Procure lençóis, hipercelularidade, células pequenas, nucléolos, necrose e invasão cerebral.',
        achados: [{
          achado: 'Arquitetura meningotelial sem conjunto de critérios atípicos',
          processo: 'Proliferação de baixo grau que preserva organização e baixa atividade mitótica.',
          consequencia: 'Sustenta grau 1 depois de excluir subtipos e alterações que imponham grau 2 ou 3.',
          peso: 'necessário',
        }],
      },
      grande: {
        procure: 'Confirme membranas indistintas, núcleos ovais e pseudoinclusões; conte mitoses em área representativa.',
        achados: [{
          achado: 'Núcleos uniformes com cromatina delicada e pseudoinclusões citoplasmáticas',
          processo: 'Invaginações da membrana nuclear contêm linguetas de citoplasma.',
          consequencia: 'Apoia linhagem; pseudoinclusão também aparece em outras neoplasias e não define grau.',
          peso: 'frequente',
        }],
      },
      sintese:
        'Meningioma grau 1 exige reconhecer linhagem e excluir critérios de grau superior. Invasão cerebral, subtipo claro/cordoide, atividade mitótica ou alterações moleculares específicas mudam a classificação.',
    },
    imunoHistoquimica: [{
      nome: 'SSTR2A, EMA e receptor de progesterona',
      tipo: 'imuno-histoquimica',
      pergunta: 'A neoplasia extra-axial apresenta diferenciação meningotelial?',
      padraoEsperado: 'SSTR2A membranar forte e EMA membranar/dot-like; receptor de progesterona frequente em grau baixo.',
      limitacoes: ['Nenhum marcador define grau sozinho e EMA também marca outras neoplasias.'],
      mudaODiferencial: 'SSTR2A forte favorece meningioma frente a schwannoma e tumor fibroso solitário.',
    }],
    correlacaoClinica: [{
      achadoMorfologico: 'Massa expansiva aderida à dura',
      consequenciaFuncional: 'Compressão focal de córtex, nervos ou seio venoso.',
      manifestacao: 'Convulsão, déficit focal, cefaleia ou neuropatia craniana conforme a localização.',
    }],
    diagnosticosDiferenciais: [
      {
        nome: 'Tumor fibroso solitário',
        motivoDaConfusao: 'Também é massa dural de células fusiformes e vasos proeminentes.',
        achadosCompartilhados: ['localização dural', 'células fusiformes', 'colágeno'],
        discriminador: 'STAT6 nuclear e arquitetura de vasos ramificados favorecem tumor fibroso solitário; SSTR2A favorece meningioma.',
      },
      {
        nome: 'Schwannoma',
        motivoDaConfusao: 'Pode ser extra-axial, fasciculado e EMA focal.',
        achadosCompartilhados: ['massa circunscrita', 'células fusiformes'],
        discriminador: 'S100/SOX10 difusos, corpos de Verocay e vasos hialinizados favorecem schwannoma.',
      },
    ],
    complicacoes: [
      { complicacao: 'Recorrência local', mecanismo: 'Tumor residual em dura, seio ou osso continua a crescer lentamente.' },
      { complicacao: 'Herniação ou déficit neurológico', mecanismo: 'Massa e edema podem elevar pressão ou comprimir área eloquente.' },
    ],
    normalVersusPatologico: [
      { aspecto: 'Meninges', normal: 'Camadas finas sem massa.', patologico: 'Proliferação nodular aderida à dura.' },
      { aspecto: 'Interface cerebral', normal: 'Superfície preservada.', patologico: 'Compressão no grau 1; línguas infiltrativas elevam para grau 2.' },
    ],
    resumoDeProva: [
      'Subtipo não é sinônimo de grau; procure atipia, mitoses, invasão cerebral e critérios moleculares.',
      'Invasão óssea não equivale a invasão cerebral e não eleva automaticamente o grau.',
      'SSTR2A/EMA apoiam linhagem; classificação depende da morfologia e do contexto molecular.',
    ],
    armadilhas: ['Chamar invasão óssea de critério de grau 2.', 'Graduar por Ki-67 isolado sem contagem mitótica e critérios formais.'],
    perguntasDeAutoavaliacao: [{
      pergunta: 'Qual achado retira um meningioma meningotelial convencional da categoria grau 1?',
      alternativas: ['Invasão verdadeira do parênquima cerebral.', 'Corpos psamomatosos.', 'Pseudoinclusões nucleares.', 'Aderência à dura.'],
      indiceCorreto: 0,
      devolutiva: 'Psamomas, pseudoinclusões e aderência dural são características comuns da linhagem. Invasão cerebral verdadeira é critério de CNS WHO grau 2, diferentemente da simples compressão.',
      nivel: 'aprofundar',
    }],
    referencias: [
      {
        citacao: 'Louis DN et al. The 2021 WHO Classification of Tumors of the Central Nervous System: a summary. Neuro-Oncology. 2021.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8328013/',
        organizacao: 'OMS',
        edicao: '5ª',
        ano: 2021,
      },
      {
        citacao: 'Intracranial meningiomas: an update of the 2021 World Health Organization classifications and review of management. 2023.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10477988/',
        ano: 2023,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão por neuropatologista e auditoria dos critérios de grau na edição vigente.'],
    historico: [{ data: '2026-08-10', autor: 'Edição Domine Aqui', nota: 'Capítulo aprofundado vinculado à coleção extensa de meningiomas grau 1.' }],
  },
}
