import type { DoencaCanonicaEntrada } from '../../esquemas'

/**
 * Esteatose hepática — piloto do padrão "acúmulo intracelular reversível".
 *
 * Escolhida porque é a doença em que a distinção entre *acúmulo* e *lesão* fica
 * mais nítida e mais consequente: gordura no hepatócito, sozinha, é adaptação
 * reversível; gordura com balonização e inflamação lobular é esteato-hepatite, e
 * a diferença entre as duas decide prognóstico. É também o melhor exemplo de
 * artefato didático: o vacúolo lipídico é um espaço vazio porque o solvente da
 * inclusão dissolveu a gordura — o aluno vê a ausência, não a substância.
 */
export const esteatoseHepatica: DoencaCanonicaEntrada = {
  id: 'esteatose-hepatica',
  slug: 'esteatose-hepatica',
  nome: 'Esteatose hepática',
  sinonimos: ['fígado gorduroso', 'degeneração gordurosa do fígado', 'esteatose macrogoticular'],
  sinonimosEmIngles: ['hepatic steatosis', 'fatty liver', 'macrovesicular steatosis'],
  sistemaId: 'hepatobiliopancreatico',
  orgaos: ['Fígado'],
  natureza: 'nao-neoplasica',
  catalogoIds: [
    'unicamp-consequencias-da-esteatose-para-o-hepatocito-e-para-o-figado-como-um-tod-3f5b48284a',
    'unicamp-esteatose-macrogoticular-3320ddc8e6',
    'histopathology-atlas-bs3-macrovesicular-and-microvesicular-steatosis-lipogranuloma-liver-c657d04b03',
  ],
  midiasPrincipais: [],
  midiasBloqueadas: [],
  mecanismoIds: ['acumulo-intracelular', 'adaptacao-celular', 'reparo-fibrose'],
  padroesMorfologicos: [
    'vacúolos macrogoticulares com deslocamento nuclear',
    'distribuição zonal centrolobular',
    'balonização hepatocitária',
    'fibrose perissinusoidal',
  ],
  conteudo: {
    objetivos: [
      'Explicar os quatro pontos do metabolismo hepático de triglicerídeos em que a esteatose pode nascer.',
      'Diferenciar esteatose macro e microgoticular pela morfologia e pelo significado clínico.',
      'Reconhecer os achados que convertem esteatose simples em esteato-hepatite.',
      'Justificar por que a fibrose inicial é perissinusoidal e o que isso significa funcionalmente.',
    ],
    definicao:
      'Acúmulo de triglicerídeos no citoplasma do hepatócito acima do normal, visível ao ' +
      'microscópio óptico como vacúolos, decorrente de desequilíbrio entre entrada, síntese, ' +
      'oxidação e exportação de lipídeos.',
    etiologias: [
      {
        agente: 'Álcool',
        categoria: 'toxica',
        explicacao:
          'A oxidação do etanol consome NAD+ e eleva a razão NADH/NAD+. Isso inibe a β-oxidação de ' +
          'ácidos graxos e favorece a síntese de triglicerídeos — o hepatócito passa a queimar ' +
          'etanol em vez de gordura.',
      },
      {
        agente: 'Resistência à insulina e síndrome metabólica',
        categoria: 'metabolica',
        explicacao:
          'A lipólise periférica descontrolada aumenta a chegada de ácidos graxos livres ao fígado, ' +
          'enquanto a hiperinsulinemia estimula a lipogênese de novo. Entrada aumentada e síntese ' +
          'aumentada ao mesmo tempo.',
      },
      {
        agente: 'Fármacos (amiodarona, tamoxifeno, corticoides, valproato, tetraciclina)',
        categoria: 'iatrogenica',
        explicacao:
          'Interferem na β-oxidação mitocondrial ou na montagem de VLDL. O valproato e a ' +
          'tetraciclina produzem caracteristicamente o padrão microgoticular, mais grave.',
      },
      {
        agente: 'Desnutrição proteica e nutrição parenteral prolongada',
        categoria: 'metabolica',
        explicacao:
          'Falta de apolipoproteínas trava a exportação de triglicerídeos como VLDL; a gordura fica ' +
          'retida por não ter transporte.',
      },
    ],
    fatoresDeRisco: [
      {
        fator: 'Obesidade central e diabetes tipo 2',
        porQue:
          'Tecido adiposo visceral resistente à insulina libera ácidos graxos livres continuamente ' +
          'para a veia porta, e o fígado é o primeiro órgão a recebê-los.',
        forca: 'estabelecido',
      },
      {
        fator: 'Consumo crônico de álcool',
        porQue:
          'Efeito direto sobre o estado redox hepatocitário e sobre a expressão de fatores de ' +
          'transcrição lipogênicos.',
        forca: 'estabelecido',
      },
      {
        fator: 'Perda ponderal muito rápida',
        porQue:
          'Mobiliza grandes quantidades de ácidos graxos do tecido adiposo em curto intervalo, ' +
          'sobrecarregando temporariamente a capacidade hepática de oxidação e exportação.',
        forca: 'provável',
      },
    ],
    histologiaNormalDeReferencia: [
      {
        titulo: 'Fígado normal — lóbulo e placa hepatocitária',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-digestorio',
          'major-glands',
          'liver',
          'liver-1',
        ],
        oQueObservar:
          'Cordões de hepatócitos de uma a duas células de espessura, irradiando da veia central ' +
          'para os espaços-porta; citoplasma eosinofílico granular e homogêneo; núcleo central e ' +
          'redondo; sinusoides estreitos e regulares. Nenhum vacúolo. Guardar a homogeneidade do ' +
          'citoplasma é o que torna o vacúolo evidente depois.',
        aproximado: false,
      },
      {
        titulo: 'Fígado normal — espaço-porta e zonação',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-digestorio',
          'major-glands',
          'liver',
          'liver-3',
        ],
        oQueObservar:
          'A tríade portal (ramo da porta, ramo da artéria hepática e ducto biliar) e a distância ' +
          'até a veia centrolobular. A zona 3, mais próxima da veia central, é a de menor tensão de ' +
          'oxigênio — e é por isso que a esteatose começa lá.',
        aproximado: false,
      },
    ],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'acumulo-intracelular',
        aplicacao:
          'O hepatócito acumula triglicerídeos quando qualquer um de quatro pontos falha: entrada ' +
          'aumentada de ácidos graxos livres, lipogênese de novo aumentada, β-oxidação reduzida, ou ' +
          'exportação de VLDL travada. Cada etiologia ataca um ponto diferente — e é por isso que a ' +
          'mesma morfologia serve a causas tão distintas.',
      },
      {
        mecanismoId: 'adaptacao-celular',
        aplicacao:
          'Enquanto há apenas gordura, o hepatócito continua funcional e o processo é reversível: ' +
          'suspenso o estímulo, os triglicerídeos são mobilizados em semanas. A esteatose simples é ' +
          'adaptação, não lesão — e tratá-la como doença estabelecida distorce o prognóstico.',
      },
      {
        mecanismoId: 'reparo-fibrose',
        aplicacao:
          'Quando a lipotoxicidade e o estresse oxidativo se somam à gordura, células estreladas ' +
          'perissinusoidais se ativam e depositam colágeno no espaço de Disse. A fibrose começa ' +
          'exatamente onde ocorre a troca metabólica, em padrão "em tela de galinheiro" ao redor de ' +
          'hepatócitos individuais — não nos espaços-porta.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Oferta de ácidos graxos livres acima da capacidade de processamento',
        porQue:
          'Seja pela lipólise periférica descontrolada da resistência insulínica, seja pelo desvio ' +
          'metabólico imposto pelo etanol, o hepatócito recebe mais substrato lipídico do que pode ' +
          'oxidar ou exportar.',
      },
      {
        etapa: 'alvo',
        titulo: 'Mitocôndria e via de montagem da VLDL no retículo endoplasmático',
        porQue:
          'A β-oxidação mitocondrial é a saída oxidativa; a montagem de VLDL é a saída exportadora. ' +
          'Bloquear qualquer uma delas transforma o excedente em triglicerídeo estocado.',
      },
      {
        etapa: 'resposta-celular',
        titulo: 'Esterificação e formação de gotículas lipídicas',
        porQue:
          'Ácido graxo livre é detergente e tóxico para membranas. Esterificá-lo em triglicerídeo e ' +
          'guardá-lo numa gotícula é, paradoxalmente, um mecanismo de proteção — a célula ' +
          'neutraliza o que não consegue eliminar.',
        achadoAssociado: 'Vacúolos citoplasmáticos que coalescem e deslocam o núcleo para a periferia',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Estresse oxidativo, lipotoxicidade e recrutamento inflamatório',
        porQue:
          'Metabólitos lipídicos intermediários — não o triglicerídeo em si — geram espécies ' +
          'reativas de oxigênio, estresse do retículo e ativação de células de Kupffer. Aí a ' +
          'adaptação vira lesão: o hepatócito baliçoniza e o lóbulo recebe infiltrado ' +
          'inflamatório misto.',
        achadoAssociado: 'Balonização hepatocitária, corpúsculos de Mallory-Denk e inflamação lobular',
      },
      {
        etapa: 'morfologia',
        titulo: 'Fibrose perissinusoidal progressiva',
        porQue:
          'Células estreladas ativadas por citocinas e por produtos da peroxidação lipídica ' +
          'depositam colágeno no espaço de Disse. O sinusoide, antes um canal fenestrado e permeável, ' +
          'ganha uma parede.',
        achadoAssociado: 'Colágeno em "tela de galinheiro" ao redor de hepatócitos isolados na zona 3',
      },
      {
        etapa: 'disfuncao',
        titulo: 'Capilarização do sinusoide e perda de troca metabólica',
        porQue:
          'O endotélio sinusoidal perde as fenestras e ganha membrana basal. A troca bidirecional ' +
          'entre sangue e hepatócito — razão de ser da arquitetura hepática — é comprometida antes ' +
          'de qualquer alteração de enzima sérica.',
      },
      {
        etapa: 'clinica',
        titulo: 'Hepatomegalia e alteração de aminotransferases',
        porQue:
          'O volume acumulado aumenta o tamanho do órgão; a lesão de membrana em hepatócitos ' +
          'balonizados libera ALT e AST. A esteatose simples costuma ser silenciosa — o achado ' +
          'inicial é frequentemente incidental em ultrassonografia.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Cirrose e carcinoma hepatocelular',
        porQue:
          'A fibrose perissinusoidal se estende, forma pontes entre estruturas vasculares e delimita ' +
          'nódulos regenerativos. A regeneração contínua num ambiente de estresse oxidativo aumenta ' +
          'a probabilidade de eventos mutacionais, o que sustenta o risco neoplásico.',
      },
    ],
    macroscopia: [
      {
        achado: 'Fígado aumentado, amarelado, de borda romba e consistência amolecida',
        processo: 'Acúmulo difuso de triglicerídeos no citoplasma dos hepatócitos.',
        consequencia:
          'Sugere esteatose extensa; a cor e a consistência não distinguem esteatose simples de ' +
          'esteato-hepatite.',
        peso: 'sugestivo',
      },
      {
        achado: 'Superfície de corte que unta a lâmina de vidro',
        processo: 'Alta concentração de lipídeo livre no tecido.',
        consequencia: 'Sinal clássico de necropsia; não quantifica nem gradua.',
        peso: 'frequente',
      },
    ],
    histopatologia: {
      panoramica: {
        procure:
          'Antes de olhar qualquer hepatócito, avalie a distribuição: a gordura é difusa ou tem ' +
          'preferência por uma zona do lóbulo? Localize as veias centrais e os espaços-porta.',
        achados: [
          {
            achado: 'Predomínio da vacuolização na zona 3 (centrolobular)',
            processo:
              'Menor tensão de oxigênio e maior atividade do citocromo P450 2E1 nessa região.',
            consequencia:
              'A zonação é a primeira pista etiológica: padrão centrolobular sugere álcool ou ' +
              'doença hepática metabólica no adulto.',
            peso: 'sugestivo',
          },
          {
            achado: 'Arquitetura lobular preservada, sem nódulos',
            processo: 'Ausência de remodelamento fibrótico completo.',
            consequencia: 'Afasta cirrose estabelecida; a doença ainda é potencialmente reversível.',
            peso: 'necessário',
          },
        ],
      },
      pequeno: {
        procure:
          'Estime a proporção de hepatócitos com vacúolo e verifique se há inflamação lobular ou ' +
          'portal associada.',
        achados: [
          {
            achado: 'Hepatócitos com vacúolo único e grande, núcleo deslocado para a periferia',
            processo: 'Coalescência das gotículas lipídicas (esteatose macrogoticular).',
            consequencia:
              'Padrão mais comum e de melhor prognóstico quando isolado; a célula permanece viável.',
            peso: 'necessário',
          },
          {
            achado: 'Infiltrado inflamatório misto disperso no lóbulo',
            processo: 'Recrutamento de neutrófilos e mononucleares por lipotoxicidade.',
            consequencia:
              'Junto de balonização, converte o diagnóstico de esteatose simples em esteato-hepatite.',
            peso: 'necessário',
          },
          {
            achado: 'Lipogranulomas: pequenos agregados de macrófagos em torno de gordura extracelular',
            processo: 'Reação a lipídeo liberado por ruptura de hepatócitos.',
            consequencia: 'Achado comum, de significado limitado isoladamente.',
            peso: 'frequente',
          },
        ],
      },
      medio: {
        procure:
          'Diferencie o vacúolo lipídico de outros vacúolos e procure hepatócitos balonizados, que ' +
          'são maiores e de citoplasma rarefeito, não vacuolado.',
        achados: [
          {
            achado: 'Balonização: hepatócito aumentado, citoplasma rarefeito e finamente reticulado',
            processo:
              'Lesão do citoesqueleto de queratina com retenção de água e desorganização de ' +
              'organelas.',
            consequencia:
              'É o marcador morfológico de lesão hepatocitária, e não de simples acúmulo. Sua ' +
              'presença muda o diagnóstico e o prognóstico.',
            peso: 'necessário',
          },
          {
            achado: 'Esteatose microgoticular: múltiplos vacúolos pequenos com núcleo central',
            processo: 'Falha aguda e grave da β-oxidação mitocondrial.',
            consequencia:
              'Padrão de alerta: associa-se a esteatose aguda da gravidez, síndrome de Reye e ' +
              'toxicidade por valproato ou tetraciclina, com curso potencialmente fulminante.',
            peso: 'sugestivo',
          },
        ],
      },
      grande: {
        procure:
          'Confirme a natureza do conteúdo do vacúolo e procure inclusões citoplasmáticas ' +
          'específicas.',
        achados: [
          {
            achado: 'Vacúolo opticamente vazio, de contorno nítido, deslocando o núcleo',
            processo:
              'O triglicerídeo foi dissolvido pelos solventes do processamento em parafina; o que ' +
              'se vê é o espaço que ele ocupava.',
            consequencia:
              'Aparência é de ausência de substância — confirmar lipídeo exige corte de congelação ' +
              'com Oil Red O ou Sudan.',
            peso: 'necessário',
          },
          {
            achado: 'Corpúsculos de Mallory-Denk: inclusões eosinofílicas irregulares perinucleares',
            processo: 'Agregados de queratinas 8/18 mal dobradas, ubiquitinadas, com p62.',
            consequencia:
              'Reforça esteato-hepatite; não é específico de etiologia alcoólica, ao contrário do ' +
              'que a tradição sugeria.',
            peso: 'sugestivo',
          },
        ],
      },
      sintese:
        'Esteatose isolada, com arquitetura preservada e sem balonização nem inflamação lobular, é ' +
        'adaptação reversível. O diagnóstico muda de natureza quando aparecem os três componentes da ' +
        'esteato-hepatite — esteatose, balonização e inflamação lobular — e a gravidade passa a ser ' +
        'determinada pela fibrose, que precisa ser estadiada com tricrômico. A morfologia, porém, ' +
        'não distingue causa alcoólica de metabólica: as duas produzem o mesmo quadro, e a ' +
        'diferenciação é clínica.',
    },
    coloracoesEspeciais: [
      {
        nome: 'Tricrômico de Masson',
        tipo: 'coloracao',
        pergunta: 'Já existe fibrose e em que compartimento ela está?',
        padraoEsperado:
          'Colágeno em azul. Na doença hepática gordurosa, o padrão inicial é perissinusoidal na ' +
          'zona 3, em "tela de galinheiro", ao redor de hepatócitos individuais — não portal.',
        controles: 'Controle com fibrose conhecida; o excesso de coloração superestima o estágio.',
        limitacoes: [
          'Fibrose fina pode ser subestimada em fragmentos pequenos ou fragmentados de biópsia.',
          'Não distingue fibrose ativa de cicatriz antiga estabilizada.',
        ],
        mudaODiferencial:
          'O compartimento da fibrose orienta a etiologia: perissinusoidal aponta para doença ' +
          'gordurosa; portal com interface hepatítica aponta para hepatite crônica viral ou ' +
          'autoimune.',
      },
      {
        nome: 'Oil Red O / Sudan em corte de congelação',
        tipo: 'coloracao',
        pergunta: 'O conteúdo dos vacúolos é realmente lipídeo?',
        padraoEsperado: 'Gotículas coradas em vermelho-alaranjado no citoplasma.',
        controles: 'Exige tecido não processado em parafina; controle positivo de tecido adiposo.',
        limitacoes: [
          'Impossível em material já incluído em parafina — a decisão precisa ser tomada na macroscopia.',
          'Não diferencia triglicerídeo de outros lipídeos neutros.',
        ],
        mudaODiferencial:
          'Resolve a confusão entre esteatose e outros vacúolos citoplasmáticos, como o glicogênio ' +
          'da doença de depósito ou o vacúolo hidrópico da lesão isquêmica.',
      },
      {
        nome: 'PAS com e sem digestão por diástase',
        tipo: 'coloracao',
        pergunta: 'O vacúolo contém glicogênio, ou há glóbulos de alfa-1-antitripsina?',
        padraoEsperado:
          'Glicogênio: PAS positivo que desaparece após a diástase. Alfa-1-antitripsina: glóbulos ' +
          'PAS positivos e diástase-resistentes, periportais.',
        controles: 'Lâmina pareada com e sem digestão, obrigatoriamente.',
        limitacoes: [
          'Glicogênio se perde com fixação prolongada, produzindo falso-negativo.',
          'Glóbulos podem ser escassos em heterozigotos.',
        ],
        mudaODiferencial:
          'Separa esteatose de glicogenose e de deficiência de alfa-1-antitripsina, duas entidades ' +
          'com conduta e aconselhamento inteiramente distintos.',
      },
    ],
    imunoHistoquimica: [
      {
        nome: 'Citoqueratina 8/18 (perda) e p62',
        tipo: 'imuno-histoquimica',
        pergunta: 'Este hepatócito aumentado está realmente balonizado?',
        padraoEsperado:
          'Perda da marcação citoplasmática normal de CK8/18 no hepatócito balonizado, com ' +
          'positividade para p62 nos corpúsculos de Mallory-Denk.',
        controles: 'Hepatócitos não balonizados do mesmo corte servem como controle interno.',
        limitacoes: [
          'Interpretação exige avaliação comparativa e é sujeita a variabilidade entre observadores.',
          'Não é necessária na rotina: a balonização é diagnóstico de HE.',
        ],
        mudaODiferencial:
          'Ajuda a resolver casos-limite entre esteatose simples e esteato-hepatite, distinção com ' +
          'implicação prognóstica direta.',
      },
    ],
    biologiaMolecular: [],
    correlacaoClinica: [
      {
        achadoMorfologico: 'Esteatose macrogoticular difusa sem balonização',
        consequenciaFuncional: 'Aumento de volume hepático com função sintética preservada.',
        manifestacao:
          'Hepatomegalia e esteatose à ultrassonografia, habitualmente assintomática, com enzimas ' +
          'normais ou discretamente elevadas.',
      },
      {
        achadoMorfologico: 'Balonização com inflamação lobular',
        consequenciaFuncional: 'Lesão de membrana hepatocitária com extravasamento enzimático.',
        manifestacao: 'Elevação persistente de ALT e AST; risco de progressão para fibrose.',
      },
      {
        achadoMorfologico: 'Fibrose em ponte e nódulos regenerativos',
        consequenciaFuncional:
          'Aumento da resistência intra-hepática ao fluxo portal e perda de massa funcional.',
        manifestacao:
          'Hipertensão portal, ascite, varizes esofágicas e insuficiência hepática progressiva.',
      },
      {
        achadoMorfologico: 'Esteatose microgoticular difusa',
        consequenciaFuncional: 'Falência aguda da β-oxidação mitocondrial com queda de produção de ATP.',
        manifestacao:
          'Insuficiência hepática aguda, hipoglicemia e encefalopatia — emergência médica.',
      },
    ],
    diagnosticosDiferenciais: [
      {
        nome: 'Esteato-hepatite (alcoólica ou metabólica)',
        motivoDaConfusao: 'A esteatose é o achado dominante nas duas.',
        achadosCompartilhados: ['esteatose macrogoticular', 'distribuição centrolobular'],
        discriminador:
          'Balonização hepatocitária associada a inflamação lobular. Sem os dois, é esteatose simples.',
        exameQueResolve: 'Tricrômico para estadiar a fibrose, que define o prognóstico.',
        armadilhaDeAmostragem:
          'Biópsia representa cerca de 1/50.000 do órgão; amostragem insuficiente subestima ' +
          'balonização e fibrose.',
      },
      {
        nome: 'Glicogenose e núcleos glicogenados',
        motivoDaConfusao: 'Citoplasma vacuolizado e claro.',
        achadosCompartilhados: ['citoplasma claro', 'hepatomegalia'],
        discriminador:
          'PAS positivo com digestão por diástase; o vacúolo é menos nítido e não desloca o núcleo.',
        exameQueResolve: 'PAS pareado com e sem diástase.',
      },
      {
        nome: 'Doença de depósito lisossomal (Gaucher, Niemann-Pick)',
        motivoDaConfusao: 'Células volumosas com citoplasma alterado no parênquima hepático.',
        achadosCompartilhados: ['citoplasma expandido', 'hepatomegalia'],
        discriminador:
          'A célula acometida é o macrófago sinusoidal, não o hepatócito, e o citoplasma tem aspecto ' +
          'estriado (Gaucher) ou espumoso uniforme (Niemann-Pick).',
        exameQueResolve: 'Dosagem enzimática e teste genético.',
      },
      {
        nome: 'Hepatite crônica viral com esteatose associada',
        motivoDaConfusao: 'Esteatose acompanha com frequência a hepatite C, sobretudo genótipo 3.',
        achadosCompartilhados: ['esteatose', 'inflamação', 'fibrose'],
        discriminador:
          'Inflamação de predomínio portal com hepatite de interface e agregados linfoides portais, ' +
          'e fibrose que começa portal, não perissinusoidal.',
        exameQueResolve: 'Sorologia e carga viral.',
      },
    ],
    complicacoes: [
      {
        complicacao: 'Cirrose',
        mecanismo:
          'Fibrose perissinusoidal progride para septos e pontes, delimitando nódulos regenerativos ' +
          'e alterando definitivamente a hemodinâmica hepática.',
      },
      {
        complicacao: 'Carcinoma hepatocelular',
        mecanismo:
          'Ciclos repetidos de lesão e regeneração em ambiente de estresse oxidativo aumentam a ' +
          'chance de fixação de mutações em clones proliferantes; pode ocorrer mesmo sem cirrose ' +
          'estabelecida na doença metabólica.',
      },
      {
        complicacao: 'Insuficiência hepática aguda na esteatose microgoticular',
        mecanismo:
          'Colapso da β-oxidação mitocondrial com queda abrupta de ATP e falência simultânea de ' +
          'múltiplas funções hepatocitárias.',
      },
    ],
    normalVersusPatologico: [
      {
        aspecto: 'Citoplasma do hepatócito',
        normal: 'Eosinofílico, granular e homogêneo.',
        patologico:
          'Ocupado por vacúolo único e grande (macrogoticular) ou por múltiplos vacúolos pequenos ' +
          '(microgoticular).',
      },
      {
        aspecto: 'Posição do núcleo',
        normal: 'Central, redondo, com nucléolo evidente.',
        patologico:
          'Deslocado para a periferia e achatado contra a membrana na esteatose macrogoticular; ' +
          'central na microgoticular.',
      },
      {
        aspecto: 'Espaço de Disse',
        normal: 'Virtual, sem colágeno; sinusoide fenestrado permitindo troca livre.',
        patologico:
          'Expandido por colágeno; sinusoide capilarizado, com perda das fenestras e da troca.',
      },
      {
        aspecto: 'Placa hepatocitária',
        normal: 'Uma a duas células de espessura, radial e regular.',
        patologico:
          'Distorcida por células volumosas e, nas fases avançadas, fragmentada por septos fibrosos.',
      },
    ],
    resumoDeProva: [
      'Quatro pontos de falha: entrada aumentada, lipogênese aumentada, β-oxidação reduzida, exportação de VLDL travada.',
      'Macrogoticular: vacúolo único, núcleo periférico, mais benigna. Microgoticular: múltiplos vacúolos, núcleo central, sinal de falência mitocondrial aguda.',
      'Esteatose simples ≠ esteato-hepatite: a diferença é balonização + inflamação lobular.',
      'A fibrose da doença gordurosa começa perissinusoidal na zona 3, não portal.',
      'O vacúolo é vazio na parafina porque a gordura foi dissolvida — confirmar exige congelação.',
    ],
    armadilhas: [
      'Chamar de esteato-hepatite qualquer esteatose com algum linfócito no lóbulo, sem balonização.',
      'Atribuir corpúsculos de Mallory-Denk exclusivamente ao álcool.',
      'Confundir balonização com hepatócito grande de citoplasma claro por glicogênio.',
      'Estadiar fibrose em fragmento de biópsia curto ou fragmentado, subestimando o estágio.',
      'Pedir Oil Red O depois de o material já ter ido para a parafina — a decisão é na macroscopia.',
    ],
    perguntasDeAutoavaliacao: [
      {
        pergunta:
          'Biópsia hepática mostra 40% dos hepatócitos com vacúolo único e grande, predomínio ' +
          'centrolobular, sem balonização, sem inflamação lobular e com tricrômico sem fibrose. Qual ' +
          'o diagnóstico e o significado prognóstico?',
        alternativas: [
          'Esteato-hepatite com fibrose inicial; alto risco de cirrose.',
          'Esteatose simples macrogoticular; processo potencialmente reversível com controle do fator causal.',
          'Cirrose micronodular em formação.',
          'Doença de depósito de glicogênio.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'Sem balonização e sem inflamação lobular, não se pode falar em esteato-hepatite. Sem ' +
          'colágeno ao tricrômico, não há fibrose para estadiar. O quadro é de acúmulo adaptativo, ' +
          'reversível se a causa for removida. Cirrose exigiria nódulos delimitados por septos; ' +
          'glicogenose teria PAS diástase-lábil e não deslocaria o núcleo.',
        nivel: 'essencial',
      },
      {
        pergunta:
          'Por que a fibrose da doença hepática gordurosa começa no espaço perissinusoidal da zona 3 ' +
          'e não nos espaços-porta?',
        alternativas: [
          'Porque os espaços-porta não contêm fibroblastos.',
          'Porque a célula estrelada, que produz o colágeno, reside no espaço de Disse, e a zona 3 é a de menor tensão de oxigênio e maior atividade do CYP2E1 — onde a lesão se concentra.',
          'Porque a zona 1 recebe menos sangue arterial.',
          'Porque a fibrose portal só ocorre em doenças virais por definição anatômica.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'A célula estrelada hepática mora no espaço de Disse, perissinusoidal — quando ativada, ' +
          'deposita colágeno exatamente ali. A zona 3 concentra a lesão por ser a mais distante da ' +
          'oferta de oxigênio do espaço-porta e por ter maior expressão de CYP2E1, que gera espécies ' +
          'reativas. Os espaços-porta têm fibroblastos, e fibrose portal ocorre em várias doenças ' +
          'não virais — o que muda é onde o estímulo se concentra.',
        nivel: 'aprofundar',
      },
      {
        pergunta:
          'Gestante no terceiro trimestre desenvolve icterícia, hipoglicemia e encefalopatia. A ' +
          'biópsia mostra hepatócitos com múltiplos vacúolos pequenos e núcleos centrais, sem ' +
          'necrose extensa. Como interpretar a morfologia?',
        alternativas: [
          'Esteatose macrogoticular banal; achado incidental.',
          'Esteatose microgoticular, indicando falência aguda da β-oxidação mitocondrial — quadro grave que exige conduta obstétrica imediata.',
          'Hepatite viral aguda.',
          'Colestase gravídica benigna.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'O padrão microgoticular com núcleo central significa que a célula não conseguiu nem ' +
          'oxidar nem coalescer o lipídeo: é falência mitocondrial aguda, não acúmulo crônico. O ' +
          'contexto — terceiro trimestre, hipoglicemia, encefalopatia — configura esteatose aguda da ' +
          'gravidez, com indicação de interrupção da gestação. A ausência de necrose extensa é ' +
          'característica e engana quem espera gravidade proporcional à destruição tecidual.',
        nivel: 'avancado',
      },
    ],
    referencias: [
      {
        citacao:
          'Kumar V, Abbas AK, Aster JC. Robbins & Cotran Pathologic Basis of Disease. 10ª ed. Elsevier; 2021. Capítulo de fígado e vias biliares.',
        organizacao: 'Elsevier',
        edicao: '10ª',
        ano: 2021,
      },
      {
        citacao:
          'Burt AD, Ferrell LD, Hübscher SG. MacSween’s Pathology of the Liver. 8ª ed. Elsevier; 2023.',
        organizacao: 'Elsevier',
        edicao: '8ª',
        ano: 2023,
      },
      {
        citacao:
          'Rinella ME, et al. A multisociety Delphi consensus statement on new fatty liver disease nomenclature. Hepatology. 2023;78(6):1966-1986.',
        ano: 2023,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    versao: 1,
    atualizadoEm: '2026-08-09',
    pendencias: [
      'Revisão por hepatopatologista, com atenção à nomenclatura: a terminologia MASLD/MASH substituiu NAFLD/NASH em consenso de 2023 e o texto precisa ser conferido contra a versão adotada institucionalmente.',
      'Definir se o sistema de graduação e estadiamento (NAS/SAF) entra na página e em qual nível de leitura.',
      'Nenhuma lâmina selecionada como principal: direitos das duas fontes pendentes.',
    ],
    historico: [
      {
        data: '2026-08-09',
        autor: 'Edição GradeX',
        nota: 'Primeira redação do conteúdo piloto. Texto autoral, não revisado por profissional habilitado.',
      },
    ],
  },
}
