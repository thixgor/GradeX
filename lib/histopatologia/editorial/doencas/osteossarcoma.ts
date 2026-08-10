import type { DoencaCanonicaEntrada } from '../../esquemas'

export const osteossarcoma: DoencaCanonicaEntrada = {
  id: 'osteossarcoma',
  slug: 'osteossarcoma',
  nome: 'Osteossarcoma',
  sinonimos: ['sarcoma osteogênico'],
  sinonimosEmIngles: ['osteosarcoma', 'osteogenic sarcoma'],
  sistemaId: 'ossos-partes-moles',
  orgaos: ['Osso'],
  natureza: 'neoplasica-maligna',
  catalogoIds: ['unicamp-osteossarcoma-26a7433455'],
  mecanismoIds: ['invasao-neoplasica'],
  padroesMorfologicos: ['osteoide produzido por tumor', 'pleomorfismo', 'permeação do osso hospedeiro', 'mitoses atípicas'],
  conteudo: {
    objetivos: [
      'Identificar osteoide diretamente produzido por células malignas como critério definidor.',
      'Separar osteoide tumoral de osso reativo e colágeno hialinizado.',
      'Integrar histologia, radiologia e resposta à quimioterapia na avaliação da peça.',
    ],
    definicao:
      'Neoplasia mesenquimal maligna cujas células tumorais produzem diretamente osteoide ou osso imaturo, mais comum em metáfises de ossos longos de adolescentes e adultos jovens.',
    etiologias: [{
      agente: 'Instabilidade genômica com alterações de TP53 e RB1',
      categoria: 'genetica',
      explicacao: 'Perda de controle do ciclo e reparo permite expansão de precursor osteoblástico altamente aberrante; a maioria é esporádica.',
    }],
    fatoresDeRisco: [
      { fator: 'Síndrome de Li-Fraumeni ou retinoblastoma hereditário', porQue: 'Mutação germinativa elimina um freio tumoral central e antecipa transformação osteoblástica.', forca: 'estabelecido' },
      { fator: 'Doença de Paget óssea ou radiação prévia', porQue: 'Remodelamento intenso ou dano genômico pode originar osteossarcoma secundário em idade mais alta.', forca: 'estabelecido' },
    ],
    histologiaNormalDeReferencia: [{
      titulo: 'Osso normal — matriz, osteoblastos e osteócitos',
      caminhoNormal: ['tecidos', 'tecido-conjuntivo', 'bone', 'as-a-tissue', 'as-a-tissue-1'],
      oQueObservar: 'Matriz organizada, trabéculas lamelares, osteoblastos alinhados na superfície e osteócitos pequenos em lacunas.',
      aproximado: false,
    }],
    mecanismoPatologicoGeral: [{
      mecanismoId: 'invasao-neoplasica',
      aplicacao: 'Células mesenquimais malignas depositam osteoide desorganizado entre si, permeiam trabéculas do osso hospedeiro e atravessam córtex para partes moles.',
    }],
    fisiopatologiaEspecifica: [
      { etapa: 'gatilho', titulo: 'Precursor osteoblástico perde controle genômico', porQue: 'Alterações em TP53/RB1 e instabilidade cromossômica permitem proliferação apesar de dano intenso.' },
      { etapa: 'alvo', titulo: 'Programa de formação de matriz osteoide', porQue: 'A célula transformada conserva capacidade osteoblástica, mas deposita matriz sem organização fisiológica.' },
      { etapa: 'resposta-celular', titulo: 'Proliferação sarcomatosa pleomórfica', porQue: 'Clone maligno expande com núcleos hipercromáticos, mitoses e diferenciação variável.', achadoAssociado: 'Células fusiformes ou epitelioides atípicas envolvendo matriz.' },
      { etapa: 'resposta-tecidual', titulo: 'Produção direta de osteoide tumoral', porQue: 'Células neoplásicas secretam matriz eosinofílica irregular que mineraliza de modo caótico.', achadoAssociado: 'Osteoide rendilhado encostado nas células malignas.' },
      { etapa: 'morfologia', titulo: 'Destruição cortical e extensão para partes moles', porQue: 'Permeação substitui medula, rompe córtex e levanta periósteo, produzindo massa extraóssea.' },
      { etapa: 'complicacao', titulo: 'Metástase hematogênica pulmonar', porQue: 'Invasão vascular envia células pela circulação venosa ao primeiro grande leito capilar, o pulmão.' },
    ],
    macroscopia: [{
      achado: 'Massa metafisária volumosa, branco-acinzentada, hemorrágica e mineralizada, rompendo córtex',
      processo: 'Crescimento sarcomatoso rápido com produção de matriz, necrose e extensão extraóssea.',
      consequencia: 'Correlaciona-se com padrão radiológico agressivo e orienta amostragem de áreas viáveis.',
      peso: 'frequente',
    }],
    histopatologia: {
      panoramica: {
        procure: 'Mapeie tumor viável, necrose pós-terapia, córtex, partes moles, margens e relação com a placa de crescimento.',
        achados: [{
          achado: 'Massa infiltrativa que substitui medula e permeia córtex',
          processo: 'Expansão neoplásica destrutiva ao longo de espaços ósseos.',
          consequencia: 'Demonstra agressividade e fornece mapa para estadiamento e resposta terapêutica.',
          peso: 'necessário',
        }],
      },
      pequeno: {
        procure: 'Localize matriz eosinofílica irregular e verifique se ela é produzida entre células tumorais.',
        achados: [{
          achado: 'Osteoide rendilhado depositado diretamente por células malignas',
          processo: 'Diferenciação osteoblástica aberrante do clone sarcomatoso.',
          consequencia: 'É o critério definidor do osteossarcoma, mesmo quando focal.',
          peso: 'suficiente',
        }],
      },
      medio: {
        procure: 'Compare componentes osteoblástico, condroblástico e fibroblástico e procure permeação vascular.',
        achados: [{
          achado: 'Células pleomórficas envolvendo e aprisionadas na matriz tumoral',
          processo: 'Produção de matriz simultânea à proliferação maligna.',
          consequencia: 'Separa osteoide tumoral de osso reativo margeado por osteoblastos regulares.',
          peso: 'necessário',
        }],
      },
      grande: {
        procure: 'Confirme atipia, mitoses anormais e contato íntimo entre célula neoplásica e osteoide.',
        achados: [{
          achado: 'Núcleos hipercromáticos pleomórficos e mitoses atípicas',
          processo: 'Instabilidade cromossômica e ciclo celular desregulado.',
          consequencia: 'Confirma alto grau na maioria dos casos convencionais, mas não substitui osteoide tumoral.',
          peso: 'frequente',
        }],
      },
      sintese:
        'O diagnóstico exige osteoide produzido pelas células malignas e correlação radiológica. Pleomorfismo sem osteoide define sarcoma, mas não necessariamente osteossarcoma.',
    },
    imunoHistoquimica: [{
      nome: 'SATB2',
      tipo: 'imuno-histoquimica',
      pergunta: 'Há diferenciação osteoblástica no tumor mesenquimal?',
      padraoEsperado: 'Marcação nuclear nas células tumorais com diferenciação osteoblástica.',
      limitacoes: ['Não é específico e marca outras lesões ósseas e alguns carcinomas; osteoide em HE continua necessário.'],
      mudaODiferencial: 'Apoia linhagem quando a matriz é escassa, mas não converte sarcoma sem osteoide em osteossarcoma.',
    }],
    correlacaoClinica: [{
      achadoMorfologico: 'Ruptura cortical e massa extraóssea',
      consequenciaFuncional: 'Fragilidade estrutural e irritação periosteal.',
      manifestacao: 'Dor progressiva, aumento de volume e possível fratura patológica.',
    }],
    diagnosticosDiferenciais: [
      {
        nome: 'Calosidade de fratura',
        motivoDaConfusao: 'Produz osso imaturo celular e mitoses durante reparo.',
        achadosCompartilhados: ['osteoide', 'celularidade', 'mitoses'],
        discriminador: 'Organização zonal, osteoblastos uniformes e ausência de atipia permeativa favorecem reparo.',
      },
      {
        nome: 'Sarcoma pleomórfico indiferenciado do osso',
        motivoDaConfusao: 'Compartilha alto grau, pleomorfismo e destruição óssea.',
        achadosCompartilhados: ['pleomorfismo', 'mitoses atípicas', 'invasão'],
        discriminador: 'Ausência de osteoide produzido pelo tumor após amostragem extensa.',
      },
    ],
    complicacoes: [
      { complicacao: 'Metástases pulmonares', mecanismo: 'Disseminação hematogênica por vasos medulares e periosteais.' },
      { complicacao: 'Fratura patológica', mecanismo: 'Substituição e destruição cortical retiram resistência mecânica do osso.' },
    ],
    normalVersusPatologico: [
      { aspecto: 'Osteoide', normal: 'Faixa ordenada margeada por osteoblastos uniformes.', patologico: 'Rendilhado irregular entre células malignas pleomórficas.' },
      { aspecto: 'Arquitetura', normal: 'Trabéculas organizadas e córtex contínuo.', patologico: 'Permeação medular, destruição cortical e extensão extraóssea.' },
    ],
    resumoDeProva: [
      'Critério definidor: osteoide produzido diretamente por células malignas.',
      'Pleomorfismo sozinho não basta; radiologia e amostragem protegem contra mimetizadores.',
      'Percentual de necrose pós-quimioterapia tem valor prognóstico e deve ser amostrado sistematicamente.',
    ],
    armadilhas: ['Confundir colágeno hialinizado com osteoide.', 'Interpretar osso reativo aprisionado como matriz produzida pelo tumor.'],
    perguntasDeAutoavaliacao: [{
      pergunta: 'Qual achado é indispensável para diagnosticar osteossarcoma?',
      alternativas: ['Osteoide produzido diretamente por células malignas.', 'SATB2 positivo isolado.', 'Massa óssea dolorosa.', 'Pleomorfismo sem matriz.'],
      indiceCorreto: 0,
      devolutiva: 'Localização, pleomorfismo e SATB2 apoiam a hipótese, mas a entidade exige demonstrar matriz osteoide depositada pelo próprio clone maligno, em correlação com a imagem.',
      nivel: 'essencial',
    }],
    referencias: [
      {
        citacao: 'College of American Pathologists. Protocol for the Examination of Resection Specimens From Patients With Primary Tumors of Bone. Version 4.2.0.0.',
        url: 'https://documents.cap.org/protocols/Bone_4.2.0.0.REL_CAPCP.pdf',
        organizacao: 'CAP',
        ano: 2024,
      },
      {
        citacao: 'WHO Classification of Tumours Editorial Board. Soft Tissue and Bone Tumours. 5ª ed. IARC; 2020.',
        organizacao: 'OMS/IARC',
        edicao: '5ª',
        ano: 2020,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão por patologista osteoarticular antes da publicação médica definitiva.'],
    historico: [{ data: '2026-08-10', autor: 'Edição Domine Aqui', nota: 'Capítulo aprofundado vinculado à coleção de osteossarcoma.' }],
  },
}
