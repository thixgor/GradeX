import type { DoencaCanonicaEntrada } from '../../esquemas'

export const glioblastoma: DoencaCanonicaEntrada = {
  id: 'glioblastoma',
  slug: 'glioblastoma',
  nome: 'Glioblastoma',
  sinonimos: ['glioblastoma IDH não mutado', 'glioma difuso grau 4 do adulto'],
  sinonimosEmIngles: ['glioblastoma, IDH-wildtype', 'GBM'],
  sistemaId: 'sistema-nervoso',
  orgaos: ['Encéfalo'],
  natureza: 'neoplasica-maligna',
  catalogoIds: [
    'histopathology-atlas-glioblastoma-c34e608b5c',
    'unicamp-glioblastoma-4fa734e480',
    'unicamp-nptglioblastoma10a-2fc99edd61',
  ],
  mecanismoIds: ['invasao-neoplasica', 'necrose-coagulativa'],
  padroesMorfologicos: ['necrose em pseudopaliçada', 'proliferação microvascular', 'infiltração difusa'],
  conteudo: {
    objetivos: [
      'Reconhecer necrose em pseudopaliçada e proliferação microvascular como critérios clássicos de grau 4.',
      'Integrar morfologia, estado de IDH e alterações moleculares conforme a classificação atual.',
      'Distinguir marcador diagnóstico, prognóstico e preditivo no painel de glioma.',
    ],
    definicao:
      'Glioma astrocítico difuso do adulto, IDH não mutado e grau 4 do sistema nervoso central, ' +
      'definido por necrose/proliferação microvascular ou por alterações moleculares qualificadoras no contexto apropriado.',
    etiologias: [{
      agente: 'Alterações somáticas em vias de TERT, EGFR, PI3K e controle do ciclo celular',
      categoria: 'genetica',
      explicacao: 'Promovem imortalidade, sinalização proliferativa, sobrevivência e infiltração do parênquima.',
    }],
    fatoresDeRisco: [{
      fator: 'Radiação ionizante terapêutica prévia',
      porQue: 'Dano genômico pode originar glioma após longo período de latência.',
      forca: 'estabelecido',
    }],
    histologiaNormalDeReferencia: [{
      titulo: 'Tecido nervoso normal — neurópilo, neurônios e glia',
      caminhoNormal: ['tecidos', 'tecido-nervoso', 'visao-geral', 'nervous-tissue-overview-1'],
      oQueObservar: 'Baixa celularidade relativa, neurópilo delicado, neurônios espaçados e vasos finos sem tufos endoteliais.',
      aproximado: false,
    }],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'invasao-neoplasica',
        aplicacao: 'Células neoplásicas migram pelo neurópilo e ao redor de neurônios e vasos, ultrapassando o limite radiológico.',
      },
      {
        mecanismoId: 'necrose-coagulativa',
        aplicacao: 'Crescimento e trombose vascular geram hipóxia; células viáveis se alinham ao redor da necrose em pseudopaliçada.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Clone glial adquire programa proliferativo IDH não mutado',
        porQue: 'Alterações de TERT, EGFR e cromossomos 7/10 permitem expansão sem maturação normal.',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Infiltração difusa do parênquima',
        porQue: 'Células percorrem tratos e espaços perivasculares, tornando a ressecção microscópica completa inviável.',
        achadoAssociado: 'Satelitose perineuronal e acúmulo subpial/perivascular.',
      },
      {
        etapa: 'morfologia',
        titulo: 'Hipóxia, necrose e angiogênese',
        porQue: 'A demanda excede o suprimento; hipóxia induz VEGF e proliferação vascular glomeruloide.',
        achadoAssociado: 'Necrose em pseudopaliçada e proliferação microvascular.',
      },
      {
        etapa: 'disfuncao',
        titulo: 'Edema e destruição de circuitos',
        porQue: 'Barreira hematoencefálica anormal e infiltração elevam pressão e interrompem redes neurais.',
      },
      {
        etapa: 'clinica',
        titulo: 'Déficit focal, convulsão e hipertensão intracraniana',
        porQue: 'A manifestação depende da topografia e do efeito de massa, não apenas do tamanho.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Recorrência local e herniação por efeito de massa',
        porQue: 'Células infiltrativas permanecem além da margem ressecada, enquanto edema e progressão podem elevar criticamente a pressão intracraniana.',
      },
    ],
    macroscopia: [{
      achado: 'Massa infiltrativa variegada com necrose e hemorragia, por vezes cruzando o corpo caloso',
      processo: 'Crescimento rápido, angiogênese frágil e disseminação por tratos de substância branca.',
      consequencia: 'Explica heterogeneidade de imagem e amostragem; aspecto em borboleta é sugestivo, não específico.',
      peso: 'sugestivo',
    }],
    histopatologia: {
      panoramica: {
        procure: 'Mapeie áreas viáveis, necrose, hemorragia e interface infiltrativa antes de escolher o maior aumento.',
        achados: [{
          achado: 'Tumor hipercelular alternando com necrose geográfica',
          processo: 'Crescimento heterogêneo com colapso perfusional.',
          consequencia: 'Amostragem só da necrose ou só da periferia pode subestimar o tumor.',
          peso: 'frequente',
        }],
      },
      pequeno: {
        procure: 'Procure pseudopaliçadas e tufos vasculares multilaminados.',
        achados: [{
          achado: 'Necrose circundada por células neoplásicas em pseudopaliçada',
          processo: 'Migração de células viáveis para longe da região hipóxica.',
          consequencia: 'No glioma difuso adequado, é critério histológico de grau 4.',
          peso: 'sugestivo',
        }],
      },
      medio: {
        procure: 'Avalie vasos, infiltração e pleomorfismo em áreas não necróticas.',
        achados: [{
          achado: 'Proliferação microvascular glomeruloide',
          processo: 'Angiogênese induzida por hipóxia com múltiplas camadas endoteliais/pericíticas.',
          consequencia: 'É o outro critério histológico clássico de grau 4.',
          peso: 'sugestivo',
        }],
      },
      grande: {
        procure: 'Confirme atipia glial, mitoses e relação das células com neurônios e neurópilo.',
        achados: [{
          achado: 'Células pleomórficas com mitoses e infiltração do parênquima',
          processo: 'Proliferação clonal agressiva e migração difusa.',
          consequencia: 'Diferencia tumor infiltrativo de reação glial quando integrado a IHQ e molecular.',
          peso: 'necessário',
        }],
      },
      sintese:
        'Morfologia de grau 4 deve ser integrada a IDH. Em adulto com glioma astrocítico IDH não mutado, alterações moleculares qualificadoras também podem estabelecer glioblastoma mesmo sem necrose ou proliferação microvascular na amostra.',
    },
    imunoHistoquimica: [{
      nome: 'GFAP, IDH1 R132H, ATRX e p53',
      tipo: 'imuno-histoquimica',
      pergunta: 'Há diferenciação glial e qual via molecular inicial é sugerida?',
      padraoEsperado: 'GFAP variável; IDH1 R132H negativo no glioblastoma IDH não mutado; ATRX frequentemente retido.',
      limitacoes: ['IDH1 R132H negativo não exclui mutação rara e pode exigir sequenciamento.'],
      mudaODiferencial: 'IDH mutado redireciona para astrocytoma IDH mutado grau 4, entidade distinta.',
    }],
    biologiaMolecular: [{
      nome: 'EGFR, promotor de TERT e assinatura +7/−10; metilação de MGMT',
      tipo: 'molecular',
      pergunta: 'Há qualificador molecular diagnóstico e biomarcador preditivo?',
      padraoEsperado: 'Amplificação de EGFR, mutação do promotor de TERT ou ganho de 7/perda de 10 apoiam a entidade; MGMT metilado prediz maior benefício de temozolomida.',
      limitacoes: ['Resultados dependem de celularidade e devem ser interpretados no contexto histológico e etário.'],
      mudaODiferencial: 'Qualificadores definem glioblastoma em cenário próprio; MGMT informa resposta, não linhagem.',
    }],
    correlacaoClinica: [{
      achadoMorfologico: 'Infiltração além da margem aparente',
      consequenciaFuncional: 'Persistência microscópica após ressecção.',
      manifestacao: 'Recorrência local é comum apesar de cirurgia ampla.',
    }],
    diagnosticosDiferenciais: [
      {
        nome: 'Astrocitoma IDH mutado, grau 4',
        motivoDaConfusao: 'Também pode apresentar necrose e proliferação microvascular.',
        achadosCompartilhados: ['glioma difuso', 'morfologia de alto grau'],
        discriminador: 'Mutação de IDH define outra entidade e muda prognóstico.',
      },
      {
        nome: 'Metástase cerebral',
        motivoDaConfusao: 'Massa necrótica e edematosa de alto grau.',
        achadosCompartilhados: ['necrose', 'pleomorfismo'],
        discriminador: 'Interface mais circunscrita, diferenciação epitelial e citoqueratinas conforme o primário.',
      },
    ],
    complicacoes: [
      {
        complicacao: 'Herniação cerebral',
        mecanismo: 'Efeito de massa e edema elevam a pressão intracraniana.',
      },
      {
        complicacao: 'Recorrência infiltrativa',
        mecanismo: 'Células dispersas permanecem além da margem cirúrgica e resistem ao microambiente terapêutico.',
      },
    ],
    normalVersusPatologico: [
      {
        aspecto: 'Celularidade',
        normal: 'Neurônios e glia espaçados em neurópilo delicado.',
        patologico: 'Hipercelularidade pleomórfica com mitoses e infiltração.',
      },
      {
        aspecto: 'Vasos',
        normal: 'Capilares finos com parede única.',
        patologico: 'Tufos microvasculares multilaminados e trombose.',
      },
    ],
    resumoDeProva: [
      'Glioblastoma do adulto é IDH não mutado e CNS WHO grau 4.',
      'Necrose em pseudopaliçada e proliferação microvascular são os critérios histológicos clássicos.',
      'MGMT metilado é preditivo; não é critério de linhagem.',
    ],
    armadilhas: ['Usar IDH1 R132H negativo como prova absoluta de IDH não mutado.', 'Confundir borda infiltrativa com limite cirúrgico real.'],
    perguntasDeAutoavaliacao: [{
      pergunta: 'Qual combinação é mais característica da morfologia de glioblastoma?',
      alternativas: [
        'Necrose em pseudopaliçada e proliferação microvascular.',
        'Rosetas de Flexner-Wintersteiner e calcificação.',
        'Psamomas e corpos de Verocay.',
        'Granulomas e células gigantes tipo Langhans.',
      ],
      indiceCorreto: 0,
      devolutiva: 'Hipóxia produz pseudopaliçadas e angiogênese exuberante; juntas são a assinatura histológica clássica de grau 4, que ainda deve ser integrada ao estado molecular de IDH.',
      nivel: 'essencial',
    }],
    referencias: [
      {
        citacao: 'Louis DN et al. The 2021 WHO Classification of Tumors of the Central Nervous System: a summary. Neuro-Oncology. 2021.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8328013/',
        organizacao: 'OMS',
        ano: 2021,
      },
      {
        citacao: 'WHO 2021 Classification of Central Nervous System tumours: practical update for diffuse gliomas.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9723092/',
        ano: 2022,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    versao: 1,
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão por neuropatologista e conferência do painel molecular institucional.'],
    historico: [{
      data: '2026-08-10',
      autor: 'Edição Domine Aqui',
      nota: 'Capítulo aprofundado criado e vinculado a coleções de histologia, IHQ e neuroimagem.',
    }],
  },
}
