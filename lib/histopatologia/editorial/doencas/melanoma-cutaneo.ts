import type { DoencaCanonicaEntrada } from '../../esquemas'

export const melanomaCutaneo: DoencaCanonicaEntrada = {
  id: 'melanoma-cutaneo',
  slug: 'melanoma-cutaneo',
  nome: 'Melanoma cutâneo',
  sinonimos: ['melanoma maligno da pele'],
  sinonimosEmIngles: ['cutaneous melanoma', 'malignant melanoma'],
  sistemaId: 'pele',
  orgaos: ['Pele'],
  natureza: 'neoplasica-maligna',
  catalogoIds: [
    'unicamp-p6-p24-3133ac6473',
    'unicamp-p29-p7-df6ed1d807',
    'unicamp-metastase-de-melanoma-maligno-no-lobo-frontal-e-3b289e9a9e',
  ],
  mecanismoIds: ['displasia', 'invasao-neoplasica'],
  padroesMorfologicos: ['assimetria', 'crescimento pagetoide', 'falta de maturação', 'invasão dérmica'],
  conteudo: {
    objetivos: [
      'Avaliar lesão melanocítica por arquitetura antes de procurar atipia celular.',
      'Distinguir componente in situ, invasão e profundidade de Breslow.',
      'Usar SOX10/S100 e Melan-A como marcadores de linhagem, não como prova isolada de malignidade.',
    ],
    definicao:
      'Neoplasia maligna de melanócitos da pele, caracterizada por crescimento intraepidérmico desorganizado e/ou invasão dérmica, com potencial de disseminação linfática e hematogênica.',
    etiologias: [{
      agente: 'Dano ultravioleta e alterações em vias MAPK, ciclo celular e telômeros',
      categoria: 'fisica',
      explicacao: 'Radiação UV produz assinatura mutacional; alterações como BRAF, NRAS e perda de CDKN2A permitem expansão e sobrevivência clonal.',
    }],
    fatoresDeRisco: [
      { fator: 'Exposição UV intermitente intensa e queimaduras solares', porQue: 'Aumentam dano ao DNA melanocítico e seleção de clones mutados.', forca: 'estabelecido' },
      { fator: 'Muitos nevos, nevos atípicos ou história familiar', porQue: 'Elevam o número de clones sob risco e podem refletir predisposição germinativa.', forca: 'estabelecido' },
    ],
    histologiaNormalDeReferencia: [{
      titulo: 'Epiderme e derme normais',
      caminhoNormal: ['orgaos-e-sistemas', 'pele', 'epidermis', 'epidermis-1'],
      oQueObservar: 'Melanócitos isolados na camada basal, sem ninhos confluentes ou ascensão pagetoide; derme organizada e livre de melanócitos.',
      aproximado: false,
    }],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'displasia',
        aplicacao: 'O clone perde a relação regular melanócito:queratinócito, forma ninhos confluentes e sobe pela epiderme, apagando simetria e maturação.',
      },
      {
        mecanismoId: 'invasao-neoplasica',
        aplicacao: 'Melanócitos atravessam a membrana basal e expandem-se na derme sem maturar em profundidade, ganhando acesso a vasos linfáticos e sanguíneos.',
      },
    ],
    fisiopatologiaEspecifica: [
      { etapa: 'gatilho', titulo: 'Dano genômico ou predisposição ativa clone melanocítico', porQue: 'Mutação direcionadora inicia expansão, enquanto falhas adicionais removem senescência e controle do ciclo.' },
      { etapa: 'alvo', titulo: 'Melanócitos da unidade epidérmica', porQue: 'Células basais produtoras de melanina passam a proliferar fora da proporção e dos nichos habituais.' },
      { etapa: 'resposta-celular', titulo: 'Atipia e crescimento pagetoide', porQue: 'Perda de adesão e polaridade permite células isoladas subirem pelas camadas epidérmicas.', achadoAssociado: 'Melanócitos grandes e irregulares acima da camada basal.' },
      { etapa: 'resposta-tecidual', titulo: 'Fase de crescimento radial', porQue: 'O clone se espalha lateralmente no componente intraepidérmico e pode formar ninhos assimétricos.' },
      { etapa: 'morfologia', titulo: 'Fase invasiva e crescimento vertical', porQue: 'Células atravessam a junção e formam população dérmica que não reduz tamanho em profundidade.', achadoAssociado: 'Componente dérmico sem maturação e com mitoses.' },
      { etapa: 'complicacao', titulo: 'Metástase linfática ou hematogênica', porQue: 'Profundidade crescente e ulceração aproximam o tumor de vasos e selecionam clones capazes de sobreviver à disseminação.' },
    ],
    macroscopia: [{
      achado: 'Lesão assimétrica, de borda irregular e cores heterogêneas, nova ou em evolução',
      processo: 'Crescimento clonal desigual, pigmentação variável, regressão, hemorragia e ulceração.',
      consequencia: 'Orienta suspeita e local de amostragem, mas melanoma amelanótico pode não seguir o padrão.',
      peso: 'sugestivo',
    }],
    histopatologia: {
      panoramica: {
        procure: 'Avalie simetria, circunscrição, relação do componente juncional com o dérmico, ulceração e maior profundidade.',
        achados: [{
          achado: 'Lesão assimétrica e mal delimitada com crescimento além do componente dérmico',
          processo: 'Expansão radial desordenada e infiltração desigual.',
          consequencia: 'Contrasta com muitos nevos benignos simétricos e circunscritos.',
          peso: 'sugestivo',
        }],
      },
      pequeno: {
        procure: 'Procure confluência juncional, pagetoidismo, falta de maturação e resposta do hospedeiro.',
        achados: [{
          achado: 'Ninhos irregulares e melanócitos isolados ascendendo na epiderme',
          processo: 'Perda de coesão, polaridade e restrição ao compartimento basal.',
          consequencia: 'Sustenta componente in situ quando extenso e fora do contexto anatômico esperado.',
          peso: 'sugestivo',
        }],
      },
      medio: {
        procure: 'Compare tamanho e citologia das células superficiais e profundas e procure mitoses dérmicas.',
        achados: [{
          achado: 'Ausência de maturação em profundidade',
          processo: 'O clone invasor mantém tamanho, atipia e atividade proliferativa na derme profunda.',
          consequencia: 'Separa melanoma de nevo que amadurece progressivamente.',
          peso: 'necessário',
        }],
      },
      grande: {
        procure: 'Confirme atipia melanocítica, nucléolos, mitoses e pigmento sem confundir melanófagos.',
        achados: [{
          achado: 'Melanócitos pleomórficos com nucléolos proeminentes e mitoses',
          processo: 'Instabilidade genômica e proliferação da população invasiva.',
          consequencia: 'Apoia malignidade; profundidade de Breslow e ulceração carregam maior valor prognóstico.',
          peso: 'frequente',
        }],
      },
      sintese:
        'O diagnóstico integra assimetria, desorganização juncional, pagetoidismo e falta de maturação. Após reconhecer invasão, é obrigatório medir Breslow e documentar ulceração e margens.',
    },
    imunoHistoquimica: [{
      nome: 'SOX10/S100, Melan-A e PRAME',
      tipo: 'imuno-histoquimica',
      pergunta: 'As células são melanocíticas e o padrão de expressão apoia uma proliferação maligna?',
      padraoEsperado: 'SOX10/S100 realçam linhagem; Melan-A mostra arquitetura; PRAME difuso apoia melanoma em contexto adequado.',
      limitacoes: ['Marcadores de linhagem também marcam nevos; PRAME pode ser negativo em melanomas e positivo focalmente em nevos.'],
      mudaODiferencial: 'Ajuda a mapear extensão e distinguir mimetizadores, mas nunca substitui a arquitetura em HE.',
    }],
    biologiaMolecular: [{
      nome: 'BRAF, NRAS e KIT conforme contexto clínico',
      tipo: 'molecular',
      pergunta: 'Existe alteração direcionadora com implicação terapêutica em doença avançada?',
      padraoEsperado: 'Alteração depende da via etiológica e do sítio; BRAF V600 é frequente em melanomas cutâneos de baixa exposição cumulativa.',
      limitacoes: ['Resultado não estabelece malignidade e deve ser solicitado com finalidade clínica definida.'],
      mudaODiferencial: 'Orienta terapia-alvo e, em casos selecionados, ajuda na relação entre tumor primário e metástase.',
    }],
    correlacaoClinica: [{
      achadoMorfologico: 'Maior profundidade de Breslow e ulceração',
      consequenciaFuncional: 'Maior acesso vascular e agressividade biológica.',
      manifestacao: 'Aumento do risco de recorrência e disseminação regional ou sistêmica.',
    }],
    diagnosticosDiferenciais: [
      {
        nome: 'Nevo melanocítico composto',
        motivoDaConfusao: 'Também forma ninhos juncionais e componente dérmico pigmentado.',
        achadosCompartilhados: ['melanócitos juncionais', 'ninhos dérmicos', 'pigmento'],
        discriminador: 'Simetria, circunscrição e maturação progressiva em profundidade favorecem nevo.',
      },
      {
        nome: 'Carcinoma pouco diferenciado',
        motivoDaConfusao: 'Melanoma amelanótico pode formar células epitelioides coesas.',
        achadosCompartilhados: ['atipia intensa', 'ninhos invasivos'],
        discriminador: 'SOX10/S100 e marcadores melanocíticos versus citoqueratinas, interpretados como painel.',
      },
    ],
    complicacoes: [
      { complicacao: 'Metástase linfonodal', mecanismo: 'Invasão dérmica oferece acesso à rede linfática cutânea.' },
      { complicacao: 'Metástases viscerais e cerebrais', mecanismo: 'Disseminação hematogênica de clones invasivos pode alcançar múltiplos órgãos.' },
    ],
    normalVersusPatologico: [
      { aspecto: 'Distribuição melanocítica', normal: 'Células isoladas e regulares na base.', patologico: 'Confluência, ninhos irregulares e ascensão pagetoide.' },
      { aspecto: 'Maturação dérmica', normal: 'Não há melanócitos dérmicos.', patologico: 'Componente invasivo sem redução celular em profundidade.' },
    ],
    resumoDeProva: [
      'Arquitetura vem antes da citologia: assimetria, pagetoidismo e falta de maturação.',
      'Breslow mede da camada granulosa/base da ulceração à célula invasiva mais profunda.',
      'SOX10 e Melan-A mostram linhagem; não provam malignidade sozinhos.',
    ],
    armadilhas: ['Confundir melanófago pigmentado com célula tumoral.', 'Usar PRAME negativo para excluir melanoma.'],
    perguntasDeAutoavaliacao: [{
      pergunta: 'Qual achado diferencia melhor melanoma invasivo de nevo composto benigno?',
      alternativas: ['Ausência de maturação do componente dérmico em profundidade.', 'Presença de melanina.', 'Ninhos na junção dermoepidérmica.', 'S100 positivo.'],
      indiceCorreto: 0,
      devolutiva: 'Pigmento, ninhos e S100 ocorrem em lesões benignas e malignas. No melanoma, as células dérmicas mantêm tamanho, atipia e proliferação em profundidade, em vez de amadurecer.',
      nivel: 'aprofundar',
    }],
    referencias: [
      {
        citacao: 'College of American Pathologists. Protocol for the Examination of Excision Specimens from Patients with Invasive Melanoma of the Skin. Version 1.2.0.0.',
        url: 'https://documents.cap.org/documents/New-Cancer-Protocols-March-2025/Skin.Inv_Melanoma.Res_1.2.0.0.REL.CAPCP.pdf',
        organizacao: 'CAP',
        ano: 2025,
      },
      {
        citacao: 'WHO Classification of Tumours Editorial Board. Skin Tumours. 4ª ed. IARC; 2018.',
        url: 'https://publications.iarc.who.int/Book-And-Report-Series/Who-Classification-Of-Tumours/WHO-Classification-Of-Skin-Tumours-2018',
        organizacao: 'OMS/IARC',
        edicao: '4ª',
        ano: 2018,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão por dermatopatologista e conferência do protocolo CAP vigente.'],
    historico: [{ data: '2026-08-10', autor: 'Edição Domine Aqui', nota: 'Capítulo aprofundado vinculado a casos cutâneos e metástase cerebral.' }],
  },
}
