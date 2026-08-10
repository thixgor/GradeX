import type { DoencaCanonicaEntrada } from '../../esquemas'

export const osteomieliteCronica: DoencaCanonicaEntrada = {
  id: 'osteomielite-cronica',
  slug: 'osteomielite-cronica',
  nome: 'Osteomielite crônica',
  sinonimos: ['infecção óssea crônica'],
  sinonimosEmIngles: ['chronic osteomyelitis'],
  sistemaId: 'ossos-partes-moles',
  orgaos: ['Osso', 'Medula óssea', 'Periósteo'],
  natureza: 'nao-neoplasica',
  catalogoIds: ['unicamp-osteomielite-cronica-81df18837f'],
  mecanismoIds: ['infeccao-persistente', 'necrose-coagulativa', 'inflamacao-cronica', 'reparo-fibrose'],
  padroesMorfologicos: ['sequestro ósseo', 'involucro', 'tecido de granulação', 'trajeto fistuloso'],
  conteudo: {
    objetivos: [
      'Reconhecer sequestro, involucro e cloaca como tradução morfológica da infecção persistente.',
      'Distinguir osso necrótico infectado de osso reativo viável.',
      'Relacionar histologia a cultura profunda, imagem e necessidade de controle cirúrgico do foco.',
    ],
    definicao:
      'Infecção persistente do osso e da medula, caracterizada por necrose óssea desvitalizada, inflamação crônica e reparo reativo, frequentemente com sequestro, involucro e trajeto fistuloso.',
    etiologias: [
      {
        agente: 'Bactérias piogênicas, frequentemente Staphylococcus aureus',
        categoria: 'infecciosa',
        explicacao: 'Chegam por via hematogênica, extensão contígua, trauma, cirurgia ou implante e persistem em osso avascular ou biofilme.',
      },
      {
        agente: 'Infecção associada a fratura exposta, material ortopédico ou úlcera crônica',
        categoria: 'iatrogenica',
        explicacao: 'Barreira rompida e tecido pouco perfundido permitem inoculação direta e dificultam resposta imune e antibiótico.',
      },
    ],
    fatoresDeRisco: [
      { fator: 'Diabetes, doença vascular e neuropatia', porQue: 'Úlceras, hipóxia e resposta imune prejudicada facilitam extensão ao osso e impedem cicatrização.', forca: 'estabelecido' },
      { fator: 'Trauma aberto ou prótese', porQue: 'Inoculam microrganismos e oferecem superfície para biofilme resistente.', forca: 'estabelecido' },
    ],
    histologiaNormalDeReferencia: [{
      titulo: 'Osso normal — trabéculas viáveis e medula',
      caminhoNormal: ['tecidos', 'tecido-conjuntivo', 'bone', 'as-a-tissue', 'as-a-tissue-1'],
      oQueObservar: 'Osteócitos ocupando lacunas, trabéculas organizadas e medula sem exsudato, fibrose ou tecido de granulação.',
      aproximado: false,
    }],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'infeccao-persistente',
        aplicacao: 'Bactérias permanecem em osso avascular e biofilme, protegidas de fagócitos e de concentrações adequadas de antimicrobianos.',
      },
      {
        mecanismoId: 'necrose-coagulativa',
        aplicacao: 'Pressão do exsudato, trombose e descolamento periosteal interrompem a perfusão; trabéculas morrem e formam o sequestro.',
      },
      {
        mecanismoId: 'inflamacao-cronica',
        aplicacao: 'Linfócitos, plasmócitos, histiócitos e surtos neutrofílicos mantêm destruição óssea e tecido de granulação ao redor do foco.',
      },
      {
        mecanismoId: 'reparo-fibrose',
        aplicacao: 'Periósteo viável deposita novo osso ao redor do sequestro, formando o involucro, enquanto fibrose organiza a cavidade e o trajeto de drenagem.',
      },
    ],
    fisiopatologiaEspecifica: [
      { etapa: 'gatilho', titulo: 'Microrganismo alcança osso vulnerável', porQue: 'Bacteremia, contiguidade ou inoculação direta coloca o agente em medula, córtex ou superfície de implante.' },
      { etapa: 'alvo', titulo: 'Microcirculação óssea e interfaces com material estranho', porQue: 'Vasos terminais e superfícies de biofilme tornam a eliminação especialmente difícil.' },
      { etapa: 'resposta-celular', titulo: 'Supuração e ativação osteoclástica', porQue: 'Neutrófilos e citocinas destroem tecido, enquanto osteoclastos ampliam reabsorção.', achadoAssociado: 'Pus, debris e lacunas de reabsorção.' },
      { etapa: 'resposta-tecidual', titulo: 'Necrose avascular forma o sequestro', porQue: 'Trombose e pressão separam fragmento morto do osso perfundido.', achadoAssociado: 'Trabéculas com lacunas vazias cercadas por granulação.' },
      { etapa: 'morfologia', titulo: 'Involucro e cloaca tentam conter e drenar', porQue: 'Periósteo forma osso novo ao redor do foco; uma abertura permite saída de pus à superfície.' },
      { etapa: 'complicacao', titulo: 'Fístula, fratura, sepse ou transformação escamosa rara', porQue: 'Persistência destrói suporte, dissemina agente e mantém epitélio fistuloso sob irritação por anos.' },
    ],
    macroscopia: [
      {
        achado: 'Fragmento de osso morto separado, cercado por pus e tecido de granulação',
        processo: 'Necrose avascular cria sequestro que abriga bactérias.',
        consequencia: 'Foco protegido explica recorrência e necessidade frequente de desbridamento.',
        peso: 'sugestivo',
      },
      {
        achado: 'Casca de osso novo com abertura de drenagem',
        processo: 'Reação periosteal forma involucro e cloaca.',
        consequencia: 'Documenta tentativa de contenção e caminho para fístula cutânea.',
        peso: 'sugestivo',
      },
    ],
    histopatologia: {
      panoramica: {
        procure: 'Mapeie osso necrótico, osso reativo, cavidade supurativa, tecido de granulação e eventual trajeto fistuloso.',
        achados: [{
          achado: 'Sequestro central circundado por inflamação e osso reativo',
          processo: 'Separação de fragmento avascular dentro de foco infectado persistente.',
          consequencia: 'Reconstrói a cronicidade e explica falha de antibiótico isolado.',
          peso: 'sugestivo',
        }],
      },
      pequeno: {
        procure: 'Compare lacunas osteocíticas, revestimento osteoblástico e organização das trabéculas antigas e novas.',
        achados: [{
          achado: 'Trabéculas necróticas com lacunas osteocíticas vazias',
          processo: 'Morte do osso após interrupção do suprimento vascular.',
          consequencia: 'Confirma necrose, mas etiologia infecciosa exige contexto inflamatório e microbiológico.',
          peso: 'necessário',
        }],
      },
      medio: {
        procure: 'Avalie interface entre osso morto, granulação, fibrose e focos supurativos.',
        achados: [{
          achado: 'Tecido de granulação fibrovascular com inflamação mista',
          processo: 'Tentativa contínua de reparar e conter foco que não pode ser eliminado.',
          consequencia: 'Demonstra atividade crônica com possíveis exacerbações neutrofílicas.',
          peso: 'frequente',
        }],
      },
      grande: {
        procure: 'Procure neutrófilos, colônias, plasmócitos e osteoblastos reativos sem depender de bactéria visível.',
        achados: [{
          achado: 'Neutrófilos e debris sobre osso necrótico, com plasmócitos na periferia',
          processo: 'Infecção ativa superposta a resposta crônica organizada.',
          consequencia: 'Sustenta osteomielite, mas cultura profunda identifica agente e sensibilidade.',
          peso: 'sugestivo',
        }],
      },
      sintese:
        'O padrão reúne osso necrótico, inflamação e reparo reativo. Histologia confirma o processo e exclui tumor; cultura de tecido profundo e imagem definem agente e extensão.',
    },
    coloracoesEspeciais: [{
      nome: 'Gram, Grocott e Ziehl–Neelsen',
      tipo: 'coloracao',
      pergunta: 'Há bactéria, fungo ou micobactéria demonstrável no tecido?',
      padraoEsperado: 'Agente realçado conforme parede e propriedades tintoriais; pode ser negativo em baixa carga ou após antibiótico.',
      limitacoes: ['Sensibilidade limitada e risco de contaminação; cultura e testes moleculares permanecem necessários.'],
      mudaODiferencial: 'Agente específico redireciona tratamento e separa infecção piogênica de causas granulomatosas.',
    }],
    correlacaoClinica: [
      {
        achadoMorfologico: 'Cloaca e trajeto fistuloso',
        consequenciaFuncional: 'Drenagem intermitente do foco profundo à pele.',
        manifestacao: 'Secreção crônica, cicatriz aderida e exacerbações dolorosas.',
      },
      {
        achadoMorfologico: 'Destruição cortical e sequestro',
        consequenciaFuncional: 'Perda de resistência e foco avascular persistente.',
        manifestacao: 'Dor, instabilidade, fratura e recorrência após antibiótico.',
      },
    ],
    diagnosticosDiferenciais: [
      {
        nome: 'Osteonecrose não infectada',
        motivoDaConfusao: 'Também apresenta trabéculas mortas com lacunas vazias e reparo periférico.',
        achadosCompartilhados: ['osso necrótico', 'fibrose', 'reação osteoblástica'],
        discriminador: 'Supuração, granulação infectada, fístula e cultura positiva favorecem osteomielite.',
      },
      {
        nome: 'Osteossarcoma',
        slug: 'osteossarcoma',
        motivoDaConfusao: 'Osso reativo exuberante e atipia reparativa podem simular produção tumoral.',
        achadosCompartilhados: ['formação óssea', 'celularidade', 'destruição'],
        discriminador: 'Osteossarcoma mostra osteoide produzido por células malignas pleomórficas, não apenas osso reativo organizado.',
      },
    ],
    complicacoes: [
      { complicacao: 'Fratura patológica', mecanismo: 'Necrose e reabsorção reduzem continuidade e resistência do osso.' },
      { complicacao: 'Carcinoma escamoso em fístula crônica', mecanismo: 'Irritação epitelial prolongada permite progressão displásica rara na cicatriz.' },
      { complicacao: 'Sepse', mecanismo: 'Exacerbação rompe contenção local e libera bactérias na circulação.' },
    ],
    normalVersusPatologico: [
      { aspecto: 'Viabilidade óssea', normal: 'Osteócitos presentes nas lacunas.', patologico: 'Lacunas vazias no sequestro desvitalizado.' },
      { aspecto: 'Reparo', normal: 'Remodelamento coordenado.', patologico: 'Involucro irregular ao redor de pus e granulação.' },
    ],
    resumoDeProva: [
      'Sequestro é osso morto infectado; involucro é osso novo reativo ao redor.',
      'Avascularidade e biofilme explicam por que antibiótico isolado frequentemente falha.',
      'Histologia confirma e exclui neoplasia; cultura profunda identifica o agente.',
    ],
    armadilhas: ['Chamar toda osteonecrose de osteomielite.', 'Usar swab superficial como representação confiável do agente profundo.'],
    perguntasDeAutoavaliacao: [{
      pergunta: 'Por que o sequestro mantém a osteomielite crônica?',
      alternativas: ['É avascular e abriga microrganismos protegidos de defesa e antibiótico.', 'Produz autoanticorpos.', 'É osso novo hipervascular.', 'Impede apenas a drenagem linfática.'],
      indiceCorreto: 0,
      devolutiva: 'O sequestro perdeu perfusão e tornou-se reservatório físico de microrganismos e biofilme. Sem vasos, chegam mal tanto células imunes quanto concentrações terapêuticas de antimicrobianos.',
      nivel: 'essencial',
    }],
    referencias: [
      {
        citacao: 'Pineda C et al. The imaging of osteomyelitis. Quant Imaging Med Surg. 2016.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4858469/',
        ano: 2016,
      },
      {
        citacao: 'Infectious Diseases Society of America. Clinical Practice Guidelines for Native Vertebral Osteomyelitis in Adults. 2015.',
        url: 'https://www.idsociety.org/practice-guideline/vertebral-osteomyelitis/',
        organizacao: 'IDSA',
        ano: 2015,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão conjunta por patologista osteoarticular e infectologista.'],
    historico: [{ data: '2026-08-10', autor: 'Edição Domine Aqui', nota: 'Capítulo aprofundado vinculado à coleção de osteomielite crônica.' }],
  },
}
