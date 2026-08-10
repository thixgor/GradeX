import type { DoencaCanonicaEntrada } from '../../esquemas'

export const doencaDeCrohn: DoencaCanonicaEntrada = {
  id: 'doenca-de-crohn',
  slug: 'doenca-de-crohn',
  nome: 'Doença de Crohn',
  sinonimos: ['enterite regional', 'ileíte de Crohn'],
  sinonimosEmIngles: ['Crohn disease', "Crohn's disease"],
  sistemaId: 'gastrointestinal',
  orgaos: ['Íleo terminal', 'Cólon', 'Trato gastrointestinal'],
  natureza: 'nao-neoplasica',
  catalogoIds: [
    'histopathology-atlas-crohns-disease-8aad2c6162',
    'histopathology-atlas-crohn-disease-fistule-82269ec2ad',
  ],
  mecanismoIds: ['inflamacao-cronica', 'inflamacao-granulomatosa', 'reparo-fibrose'],
  padroesMorfologicos: ['inflamação descontínua e transmural', 'úlceras fissurantes', 'granulomas não caseosos', 'fístulas'],
  conteudo: {
    objetivos: [
      'Reconstruir a doença transmural a partir de biópsias mucosas necessariamente incompletas.',
      'Distinguir atividade neutrofílica de cronicidade arquitetural e de granulomas diagnósticos.',
      'Integrar distribuição segmentar, endoscopia, imagem e histologia no diferencial com retocolite e infecção.',
    ],
    definicao:
      'Doença inflamatória intestinal crônica, recidivante e imunomediada, capaz de envolver qualquer segmento do trato gastrointestinal em padrão descontínuo e frequentemente transmural, produzindo ulceração, estenose e fístulas.',
    etiologias: [{
      agente: 'Resposta imune inadequada à microbiota em hospedeiro geneticamente suscetível',
      categoria: 'imunologica',
      explicacao: 'Variantes em barreira e reconhecimento microbiano, incluindo NOD2, combinam-se a fatores ambientais; não há um agente único suficiente.',
    }],
    fatoresDeRisco: [
      {
        fator: 'Tabagismo',
        porQue: 'Associa-se a curso mais agressivo, recorrência e necessidade de cirurgia por mecanismos de barreira e imunidade.',
        forca: 'estabelecido',
      },
      {
        fator: 'História familiar de doença inflamatória intestinal',
        porQue: 'Reflete compartilhamento de variantes de suscetibilidade e exposições ambientais.',
        forca: 'estabelecido',
      },
    ],
    histologiaNormalDeReferencia: [{
      titulo: 'Intestino delgado normal — vilosidades, criptas e parede',
      caminhoNormal: [
        'orgaos-e-sistemas',
        'sistema-digestorio',
        'tubular-digestive-system',
        'small-intestine',
        'small-intestine-1',
      ],
      oQueObservar: 'Vilosidades e criptas regulares, lâmina própria delicada e camadas da parede sem agregados inflamatórios transmurais.',
      aproximado: false,
    }],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'inflamacao-cronica',
        aplicacao: 'Ativação imune persistente lesa criptas e remodela a mucosa em focos separados, produzindo plasmocitose basal e distorção arquitetural que registram cronicidade.',
      },
      {
        mecanismoId: 'inflamacao-granulomatosa',
        aplicacao: 'Macrófagos epitelioides podem formar granulomas não relacionados a ruptura de cripta; quando presentes e após excluir infecção, apoiam fortemente Crohn.',
      },
      {
        mecanismoId: 'reparo-fibrose',
        aplicacao: 'Ciclos transmurais de ulceração e reparo depositam colágeno nas camadas profundas, estreitando a luz e criando trajetos fistulosos entre órgãos.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Barreira intestinal e resposta à microbiota perdem equilíbrio',
        porQue: 'Predisposição genética e ambiente permitem ativação imune persistente contra conteúdo luminal habitual.',
      },
      {
        etapa: 'alvo',
        titulo: 'Unidades cripta–vilosidade e parede intestinal',
        porQue: 'A agressão começa na mucosa, mas mediadores e úlceras profundas estendem o processo às demais camadas.',
      },
      {
        etapa: 'resposta-celular',
        titulo: 'Inflamação crônica com surtos neutrofílicos',
        porQue: 'Linfócitos e plasmócitos mantêm cronicidade; neutrófilos entram em criptas durante atividade.',
        achadoAssociado: 'Plasmocitose basal, criptite e abscessos de cripta em distribuição focal.',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Úlceras aftosas evoluem para fissuras transmurais',
        porQue: 'Focos de dano coalescem e aprofundam-se ao longo de planos de menor resistência.',
        achadoAssociado: 'Úlceras lineares entre ilhas de mucosa, formando calçamento.',
      },
      {
        etapa: 'morfologia',
        titulo: 'Fibrose, estenose e fístula',
        porQue: 'Reparo repetido contrai a parede; fissuras que atravessam a serosa podem aderir e comunicar estruturas.',
        achadoAssociado: 'Espessamento mural, estenose e trajeto fistuloso.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Obstrução, abscesso, má absorção e neoplasia',
        porQue: 'Estenose bloqueia trânsito, penetração carrega bactérias aos tecidos e inflamação longa aumenta risco de displasia.',
      },
    ],
    macroscopia: [
      {
        achado: 'Lesões salteadas, úlceras lineares e mucosa em calçamento',
        processo: 'Inflamação focal separada por ilhas de mucosa relativamente preservada.',
        consequencia: 'Distribuição ajuda a separar Crohn de colite ulcerativa contínua, especialmente antes do tratamento.',
        peso: 'sugestivo',
      },
      {
        achado: 'Parede espessada, gordura mesentérica envolvente e estenose',
        processo: 'Inflamação transmural, hipertrofia muscular e fibrose cicatricial.',
        consequencia: 'Explica obstrução e demonstra componente profundo não representado por biópsia.',
        peso: 'sugestivo',
      },
    ],
    histopatologia: {
      panoramica: {
        procure: 'Compare segmentos e mapeie descontinuidade, profundidade das úlceras, espessura mural e trajetos fistulosos.',
        achados: [{
          achado: 'Inflamação focal e transmural em peça cirúrgica',
          processo: 'Resposta imune segmentar que se estende da mucosa à serosa.',
          consequencia: 'É uma assinatura forte de Crohn, mas a transmuralidade não pode ser avaliada em biópsia mucosa.',
          peso: 'sugestivo',
        }],
      },
      pequeno: {
        procure: 'Avalie distorção de criptas, plasmocitose basal e alternância entre áreas alteradas e preservadas.',
        achados: [{
          achado: 'Distorção arquitetural focal com inflamação crônica descontínua',
          processo: 'Ciclos de dano e regeneração desalinhada das criptas.',
          consequencia: 'Registra cronicidade e distribuição, mas tratamento pode apagar o padrão salteado.',
          peso: 'necessário',
        }],
      },
      medio: {
        procure: 'Procure criptite, abscessos, erosões e granulomas longe de criptas rompidas.',
        achados: [{
          achado: 'Granuloma epitelioide não caseoso não relacionado a lesão de cripta',
          processo: 'Organização macrofágica de resposta imune persistente.',
          consequencia: 'Apoia fortemente Crohn depois de excluir micobactéria, fungo e corpo estranho.',
          peso: 'sugestivo',
        }],
      },
      grande: {
        procure: 'Diferencie neutrófilos de atividade, plasmócitos de cronicidade e histiócitos epitelioides.',
        achados: [{
          achado: 'Neutrófilos no epitélio sobre fundo linfoplasmocitário',
          processo: 'Atividade aguda superposta a doença inflamatória crônica.',
          consequencia: 'Permite relatar atividade, mas não determina sozinho o subtipo de DII.',
          peso: 'frequente',
        }],
      },
      sintese:
        'Crohn resulta da convergência entre distribuição descontínua, cronicidade focal, ulceração profunda e, quando presente, granuloma apropriado. Uma biópsia isolada não demonstra toda a doença transmural.',
    },
    coloracoesEspeciais: [{
      nome: 'Ziehl–Neelsen e Grocott',
      tipo: 'coloracao',
      pergunta: 'Um granuloma é imunomediado ou causado por micobactéria/fungo?',
      padraoEsperado: 'Ausência de agentes em Crohn; positividade redireciona para infecção específica.',
      limitacoes: ['Sensibilidade é limitada em baixa carga; resultado negativo não exclui infecção.'],
      mudaODiferencial: 'Agente identificado impede atribuir o granuloma à doença de Crohn sem investigação adicional.',
    }],
    correlacaoClinica: [
      {
        achadoMorfologico: 'Estenose fibrótica do íleo',
        consequenciaFuncional: 'Redução fixa do calibre e trânsito prejudicado.',
        manifestacao: 'Dor pós-prandial, distensão e obstrução recorrente.',
      },
      {
        achadoMorfologico: 'Úlcera fissurante transmural',
        consequenciaFuncional: 'Comunicação com alça, pele ou órgão adjacente.',
        manifestacao: 'Fístula, abscesso e drenagem persistente.',
      },
    ],
    diagnosticosDiferenciais: [
      {
        nome: 'Retocolite ulcerativa',
        motivoDaConfusao: 'Ambas causam colite crônica com distorção de criptas e atividade neutrofílica.',
        achadosCompartilhados: ['distorção arquitetural', 'plasmocitose basal', 'criptite'],
        discriminador: 'Retocolite não tratada é contínua, começa no reto e permanece predominantemente mucosa, sem fístulas.',
      },
      {
        nome: 'Tuberculose intestinal',
        motivoDaConfusao: 'Pode acometer íleo-ceco com estenose e granulomas.',
        achadosCompartilhados: ['granulomas', 'espessamento mural', 'ulceração'],
        discriminador: 'Necrose caseosa, granulomas confluentes e demonstração microbiológica favorecem tuberculose.',
      },
    ],
    complicacoes: [
      { complicacao: 'Estenose e obstrução', mecanismo: 'Fibrose transmural progressiva contrai a parede e estreita a luz.' },
      { complicacao: 'Fístula e abscesso', mecanismo: 'Úlcera fissurante atravessa a parede e inocula bactérias em estruturas adjacentes.' },
      { complicacao: 'Displasia e carcinoma', mecanismo: 'Inflamação colônica prolongada favorece seleção clonal e progressão neoplásica.' },
    ],
    normalVersusPatologico: [
      { aspecto: 'Distribuição', normal: 'Mucosa uniforme dentro de cada segmento.', patologico: 'Focos alterados alternando com áreas preservadas.' },
      { aspecto: 'Parede', normal: 'Camadas finas e sem inflamação organizada.', patologico: 'Inflamação transmural, fibrose e fissuras.' },
    ],
    resumoDeProva: [
      'Crohn é descontínuo e transmural; a biópsia vê apenas a porção mucosa dessa história.',
      'Granuloma apoia muito, mas é incomum e exige exclusão de infecção e reação a cripta.',
      'Fissura profunda explica fístula; reparo repetido explica estenose.',
    ],
    armadilhas: ['Excluir Crohn porque não há granuloma.', 'Chamar padrão focal de diagnóstico em paciente já tratado sem considerar cicatrização desigual.'],
    perguntasDeAutoavaliacao: [{
      pergunta: 'Qual achado, em peça cirúrgica, mais favorece Crohn frente a retocolite ulcerativa?',
      alternativas: ['Inflamação transmural descontínua com fístula.', 'Criptite neutrofílica isolada.', 'Plasmocitose basal isolada.', 'Depleção de mucina superficial.'],
      indiceCorreto: 0,
      devolutiva: 'Criptite, plasmocitose e depleção de mucina ocorrem nas duas doenças. A combinação de descontinuidade, transmuralidade e fístula reconstrói especificamente o comportamento penetrante de Crohn.',
      nivel: 'aprofundar',
    }],
    referencias: [
      {
        citacao: 'ECCO-ESGAR-ESP-IBUS Guideline on Diagnostics and Monitoring of Patients with Inflammatory Bowel Disease: Part 1. J Crohns Colitis. 2025.',
        url: 'https://academic.oup.com/ecco-jcc/article/19/7/jjaf106/8219802',
        organizacao: 'ECCO/ESGAR/ESP/IBUS',
        ano: 2025,
      },
      {
        citacao: 'Magro F et al. European consensus on the histopathology of inflammatory bowel disease. J Crohns Colitis. 2013.',
        url: 'https://academic.oup.com/ecco-jcc/article/7/10/827/379239',
        organizacao: 'ECCO/ESP',
        ano: 2013,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão por patologista gastrointestinal antes da publicação médica definitiva.'],
    historico: [{ data: '2026-08-10', autor: 'Edição Domine Aqui', nota: 'Capítulo aprofundado vinculado a lâminas de mucosa e fístula.' }],
  },
}
