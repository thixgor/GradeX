import type { DoencaCanonicaEntrada } from '../../esquemas'

export const carcinomaPapiliferoDaTireoide: DoencaCanonicaEntrada = {
  id: 'carcinoma-papilifero-da-tireoide',
  slug: 'carcinoma-papilifero-da-tireoide',
  nome: 'Carcinoma papilífero da tireoide',
  sinonimos: ['carcinoma papilar da tireoide', 'CPT'],
  sinonimosEmIngles: ['papillary thyroid carcinoma', 'PTC'],
  sistemaId: 'endocrino',
  orgaos: ['Tireoide', 'Linfonodos cervicais'],
  natureza: 'neoplasica-maligna',
  catalogoIds: ['unicamp-carcinoma-papilifero-6ef89e8898'],
  mecanismoIds: ['displasia', 'invasao-neoplasica'],
  padroesMorfologicos: ['núcleos claros e sulcados', 'pseudoinclusões intranucleares', 'papilas', 'corpos psamomatosos'],
  conteudo: {
    objetivos: [
      'Priorizar as características nucleares sobre a presença isolada de papilas.',
      'Distinguir pseudoinclusão citoplasmática de inclusão verdadeira e sulco de artefato.',
      'Integrar arquitetura, invasão, subtipo e alterações da via MAPK.',
    ],
    definicao:
      'Carcinoma maligno derivado de célula folicular da tireoide, definido por um conjunto característico de alterações nucleares e frequentemente associado à ativação da via MAPK.',
    etiologias: [{
      agente: 'Alterações somáticas da via MAPK, incluindo BRAF V600E e fusões RET',
      categoria: 'genetica',
      explicacao: 'Ativação constitutiva sustenta proliferação e modifica diferenciação nuclear; a alteração varia conforme subtipo e exposição.',
    }],
    fatoresDeRisco: [{
      fator: 'Exposição cervical à radiação ionizante, sobretudo na infância',
      porQue: 'Quebras de DNA favorecem rearranjos oncogênicos em células foliculares vulneráveis.',
      forca: 'estabelecido',
    }],
    histologiaNormalDeReferencia: [{
      titulo: 'Tireoide normal — folículos e coloide',
      caminhoNormal: ['orgaos-e-sistemas', 'sistema-endocrino', 'organs', 'thyroid', 'thyroid-1'],
      oQueObservar: 'Folículos arredondados cheios de coloide, revestidos por células cúbicas com núcleos pequenos, uniformes e escuros.',
      aproximado: false,
    }],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'displasia',
        aplicacao: 'Ativação MAPK altera polaridade, cromatina e membrana nuclear, gerando clareamento, sobreposição, sulcos e pseudoinclusões em população clonal.',
      },
      {
        mecanismoId: 'invasao-neoplasica',
        aplicacao: 'O clone infiltra parênquima e vasos linfáticos, explicando metástases cervicais frequentes mesmo em tumores primários pequenos.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Ativação oncogênica da via MAPK',
        porQue: 'BRAF ou fusão de quinase mantém sinal proliferativo em célula folicular sem estímulo fisiológico.',
      },
      {
        etapa: 'alvo',
        titulo: 'Programa de diferenciação da célula folicular',
        porQue: 'A sinalização modifica arquitetura e membrana nuclear enquanto parte do fenótipo tireoidiano é preservada.',
      },
      {
        etapa: 'resposta-celular',
        titulo: 'Fenótipo nuclear papilífero',
        porQue: 'Redistribuição da cromatina e invaginações de membrana produzem clareamento, sulcos e pseudoinclusões.',
        achadoAssociado: 'Núcleos aumentados, sobrepostos, claros, sulcados e com pseudoinclusões.',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Papilas verdadeiras e calcificação lamelar',
        porQue: 'Eixos fibrovasculares sustentam crescimento; necrose papilar microscópica pode mineralizar em camadas.',
        achadoAssociado: 'Papilas com eixo fibrovascular e corpos psamomatosos.',
      },
      {
        etapa: 'morfologia',
        titulo: 'Invasão linfática e disseminação cervical',
        porQue: 'Proximidade da rede linfática tireoidiana facilita êmbolos e metástases em linfonodos regionais.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Recorrência locorregional ou extensão extratireoidiana',
        porQue: 'Subtipos e alterações de maior risco podem ultrapassar a cápsula e persistir em linfonodos ou tecidos cervicais.',
      },
    ],
    macroscopia: [{
      achado: 'Nódulo firme, branco-acinzentado, infiltrativo ou parcialmente circunscrito, por vezes calcificado',
      processo: 'Proliferação epitelial com fibrose, papilas e depósitos de cálcio.',
      consequencia: 'Aspecto sugere malignidade, mas tumores pequenos ou encapsulados podem parecer discretos.',
      peso: 'frequente',
    }],
    histopatologia: {
      panoramica: {
        procure: 'Mapeie interface, cápsula, multifocalidade, papilas e relação com tecidos extratireoidianos.',
        achados: [{
          achado: 'Nódulo papilífero ou folicular distinto do parênquima normal',
          processo: 'Expansão clonal que reorganiza os folículos e pode infiltrar a periferia.',
          consequencia: 'Localiza a lesão; arquitetura isolada não define carcinoma papilífero.',
          peso: 'necessário',
        }],
      },
      pequeno: {
        procure: 'Confirme papilas verdadeiras e distribuição difusa das alterações nucleares.',
        achados: [{
          achado: 'Papilas com eixo fibrovascular revestidas por células sobrepostas',
          processo: 'Crescimento epitelial orientado por estroma vascular central.',
          consequencia: 'Favorece o padrão clássico, mas papilas também ocorrem em lesões benignas.',
          peso: 'sugestivo',
        }],
      },
      medio: {
        procure: 'Compare cromatina, contorno nuclear, orientação e presença de psamomas.',
        achados: [{
          achado: 'Núcleos aumentados, claros, sobrepostos e sulcados',
          processo: 'Redistribuição periférica da cromatina e irregularidade da membrana.',
          consequencia: 'O conjunto nuclear, quando difuso, é o núcleo do diagnóstico.',
          peso: 'necessário',
        }],
      },
      grande: {
        procure: 'Confirme sulcos e pseudoinclusões e não conte vacúolos ou sobreposição como equivalentes.',
        achados: [{
          achado: 'Pseudoinclusões intranucleares bem delimitadas com textura citoplasmática',
          processo: 'Invaginação citoplasmática através de membrana nuclear irregular.',
          consequencia: 'É pista útil, porém deve integrar um conjunto e não funcionar como achado isolado.',
          peso: 'sugestivo',
        }],
      },
      sintese:
        'O carcinoma papilífero é definido pelo fenótipo nuclear em contexto arquitetural adequado. Papilas e psamomas ajudam, mas não substituem a avaliação de núcleos, invasão e subtipo.',
    },
    imunoHistoquimica: [{
      nome: 'Tireoglobulina, TTF-1, PAX8 e BRAF VE1',
      tipo: 'imuno-histoquimica',
      pergunta: 'O tumor é de linhagem folicular tireoidiana e há expressão compatível com BRAF V600E?',
      padraoEsperado: 'Marcadores de linhagem positivos; VE1 citoplasmático em tumores com BRAF V600E validado.',
      limitacoes: ['Marcadores de linhagem não separam benigno de maligno; VE1 exige controle e confirmação conforme laboratório.'],
      mudaODiferencial: 'Confirma origem tireoidiana em metástase e pode apoiar via molecular, mas morfologia define a entidade.',
    }],
    biologiaMolecular: [{
      nome: 'Painel de BRAF e fusões de quinase',
      tipo: 'molecular',
      pergunta: 'Qual alteração direcionadora da via MAPK está presente?',
      padraoEsperado: 'BRAF V600E no padrão clássico ou fusões RET/NTRK em subconjuntos mutuamente exclusivos.',
      limitacoes: ['Ausência das alterações pesquisadas não exclui carcinoma papilífero.'],
      mudaODiferencial: 'Pode apoiar classificação, prognóstico e opção terapêutica em doença avançada.',
    }],
    correlacaoClinica: [{
      achadoMorfologico: 'Invasão linfática intratireoidiana',
      consequenciaFuncional: 'Transporte de células a linfonodos cervicais.',
      manifestacao: 'Adenomegalia cervical, às vezes primeira manifestação de tumor pequeno.',
    }],
    diagnosticosDiferenciais: [
      {
        nome: 'Nódulo hiperplásico com papilas',
        motivoDaConfusao: 'Pode formar projeções papilares e áreas de clareamento focal.',
        achadosCompartilhados: ['papilas', 'coloide', 'nódulo tireoidiano'],
        discriminador: 'Núcleos uniformes sem conjunto difuso de clareamento, sulcos, sobreposição e pseudoinclusões.',
      },
      {
        nome: 'NIFTP',
        motivoDaConfusao: 'Apresenta padrão folicular e características nucleares do tipo papilífero.',
        achadosCompartilhados: ['núcleos do tipo papilífero', 'arquitetura folicular'],
        discriminador: 'Lesão encapsulada, não invasiva, com critérios de exclusão e amostragem completa da cápsula.',
      },
    ],
    complicacoes: [
      { complicacao: 'Metástase linfonodal cervical', mecanismo: 'Invasão de vasos linfáticos transporta o clone a cadeias cervicais.' },
      { complicacao: 'Extensão extratireoidiana', mecanismo: 'Crescimento infiltrativo alcança músculo, nervo ou estruturas aerodigestivas.' },
    ],
    normalVersusPatologico: [
      { aspecto: 'Núcleos', normal: 'Pequenos, redondos, uniformes e escuros.', patologico: 'Aumentados, claros, sobrepostos, sulcados e pseudoinclusos.' },
      { aspecto: 'Arquitetura', normal: 'Folículos regulares com coloide.', patologico: 'Papilas ou folículos neoplásicos com organização anormal.' },
    ],
    resumoDeProva: [
      'É diagnóstico nuclear: papilas ajudam, mas não bastam.',
      'Pseudoinclusão é citoplasma invaginado, não um corpúsculo nuclear verdadeiro.',
      'Disseminação linfática cervical é típica; alterações BRAF/fusões ativam MAPK.',
    ],
    armadilhas: ['Diagnosticar por uma pseudoinclusão isolada.', 'Chamar NIFTP sem amostrar completamente a interface capsular.'],
    perguntasDeAutoavaliacao: [{
      pergunta: 'Qual conjunto sustenta melhor carcinoma papilífero da tireoide?',
      alternativas: ['Clareamento nuclear difuso, sobreposição, sulcos e pseudoinclusões.', 'Papila isolada sem alteração nuclear.', 'Coloide abundante e núcleos uniformes.', 'Invasão vascular sem fenótipo nuclear papilífero.'],
      indiceCorreto: 0,
      devolutiva: 'A entidade é definida pelo conjunto de alterações nucleares distribuídas na população tumoral. Papilas isoladas são inespecíficas, e invasão sem esse fenótipo aponta para outro carcinoma folicular.',
      nivel: 'essencial',
    }],
    referencias: [
      {
        citacao: 'WHO Classification of Tumours Editorial Board. Endocrine and Neuroendocrine Tumours. 5ª ed. IARC; 2022.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10199828/',
        organizacao: 'OMS/IARC',
        edicao: '5ª',
        ano: 2022,
      },
      {
        citacao: 'College of American Pathologists. Protocol for the Examination of Specimens From Patients With Carcinomas of the Thyroid Gland. Version 4.4.0.0.',
        url: 'https://documents.cap.org/documents/Thyroid_4.4.0.0.REL_CAPCP.pdf',
        organizacao: 'CAP',
        ano: 2023,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão por patologista de cabeça e pescoço antes da publicação médica definitiva.'],
    historico: [{ data: '2026-08-10', autor: 'Edição Domine Aqui', nota: 'Capítulo aprofundado vinculado à coleção de morfologia nuclear.' }],
  },
}
