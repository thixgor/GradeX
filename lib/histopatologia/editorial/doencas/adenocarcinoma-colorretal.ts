import type { DoencaCanonicaEntrada } from '../../esquemas'

/**
 * Adenocarcinoma colorretal — piloto do padrão neoplásico maligno.
 *
 * Está no conjunto piloto porque é a doença em que a cadeia genótipo →
 * morfologia → conduta é mais explícita: a sequência adenoma-carcinoma tem
 * correlato morfológico em cada etapa, e o achado que define malignidade —
 * invasão além da muscular da mucosa — é uma decisão estritamente
 * arquitetural, tomada em pequeno aumento.
 *
 * É também a única doença do piloto que consolida entradas das **duas** fontes
 * do catálogo, o que exercita a consolidação editorial multi-fonte.
 */
export const adenocarcinomaColorretal: DoencaCanonicaEntrada = {
  id: 'adenocarcinoma-colorretal',
  slug: 'adenocarcinoma-colorretal',
  nome: 'Adenocarcinoma colorretal',
  sinonimos: ['adenocarcinoma do cólon', 'câncer colorretal', 'carcinoma do intestino grosso'],
  sinonimosEmIngles: ['colorectal adenocarcinoma', 'colon adenocarcinoma', 'colorectal cancer'],
  sistemaId: 'gastrointestinal',
  orgaos: ['Cólon', 'Reto'],
  natureza: 'neoplasica-maligna',
  catalogoIds: [
    'unicamp-adenocarcinoma-do-colon-4ca15bcd68',
    'histopathology-atlas-colon-adenocarcinoma-e9915c53ba',
    'histopathology-atlas-colon-adenocarcinoma-pt4a-e2267232c4',
    'histopathology-atlas-mucinous-adenocarcinoma-of-colon-arising-from-tubulovillus-adenoma-a0566ce2de',
    'unicamp-metastase-de-adenocarcinoma-do-colon-no-lobo-temporal-d-33f97b2f58',
  ],
  midiasPrincipais: [],
  midiasBloqueadas: [],
  mecanismoIds: ['displasia', 'invasao-neoplasica', 'reparo-fibrose'],
  padroesMorfologicos: [
    'glândulas irregulares infiltrando a parede',
    'necrose "suja" intraluminal',
    'reação desmoplásica',
    'invasão linfovascular e perineural',
  ],
  conteudo: {
    objetivos: [
      'Percorrer a sequência adenoma–carcinoma e apontar o correlato morfológico de cada etapa.',
      'Identificar o critério de invasão que define malignidade no cólon e explicar por que ele é diferente do de outros órgãos.',
      'Justificar por que tumores de cólon direito e esquerdo se apresentam clinicamente de formas distintas.',
      'Explicar o papel da instabilidade de microssatélites no diagnóstico, no prognóstico e na terapêutica.',
    ],
    definicao:
      'Neoplasia epitelial maligna do intestino grosso, com diferenciação glandular, que na maioria ' +
      'dos casos surge de um adenoma precursor por acúmulo sequencial de alterações genéticas e se ' +
      'define morfologicamente pela invasão além da muscular da mucosa.',
    etiologias: [
      {
        agente: 'Instabilidade cromossômica (via APC/β-catenina)',
        categoria: 'genetica',
        explicacao:
          'Perda bialélica de APC desregula a via Wnt e permite acúmulo nuclear de β-catenina, que ' +
          'ativa transcrição proliferativa. É o evento iniciador em cerca de 80% dos casos; ' +
          'mutações subsequentes em KRAS e TP53 completam a progressão.',
      },
      {
        agente: 'Instabilidade de microssatélites (deficiência de reparo de mal pareamento)',
        categoria: 'genetica',
        explicacao:
          'Perda de MLH1, MSH2, MSH6 ou PMS2 — por metilação somática do promotor de MLH1 ou por ' +
          'mutação germinativa (síndrome de Lynch) — acumula erros em sequências repetitivas e gera ' +
          'tumores hipermutados, com fenótipo morfológico e imunológico próprios.',
      },
      {
        agente: 'Inflamação crônica (doença inflamatória intestinal de longa duração)',
        categoria: 'imunologica',
        explicacao:
          'Ciclos prolongados de lesão e regeneração num ambiente rico em espécies reativas ' +
          'favorecem alterações genéticas. Nesta via, a displasia é frequentemente plana e ' +
          'multifocal, e TP53 muta cedo — o inverso da sequência esporádica.',
      },
    ],
    fatoresDeRisco: [
      {
        fator: 'Idade acima de 50 anos',
        porQue:
          'O acúmulo sequencial de mutações exige tempo; a incidência sobe de forma acentuada a ' +
          'partir dessa faixa, o que fundamenta o início do rastreamento.',
        forca: 'estabelecido',
      },
      {
        fator: 'História familiar e síndromes hereditárias (Lynch, polipose adenomatosa familiar)',
        porQue:
          'Uma mutação germinativa elimina uma das etapas necessárias, antecipando e multiplicando ' +
          'os eventos tumorais.',
        forca: 'estabelecido',
      },
      {
        fator: 'Dieta rica em carne processada e pobre em fibras, obesidade e sedentarismo',
        porQue:
          'Prolongam o tempo de contato de carcinógenos com a mucosa e alteram a microbiota e o ' +
          'metabolismo de ácidos biliares.',
        forca: 'estabelecido',
      },
      {
        fator: 'Doença inflamatória intestinal com mais de oito a dez anos de evolução',
        porQue:
          'Regeneração epitelial contínua em ambiente inflamatório aumenta a probabilidade de ' +
          'displasia plana difícil de detectar.',
        forca: 'estabelecido',
      },
    ],
    histologiaNormalDeReferencia: [
      {
        titulo: 'Intestino grosso normal — criptas e mucosa',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-digestorio',
          'tubular-digestive-system',
          'large-intestine-and-anus',
          'large-intestine-1',
        ],
        oQueObservar:
          'Criptas retas, paralelas, do mesmo comprimento, apoiadas na muscular da mucosa como ' +
          '"tubos de ensaio numa estante"; abundantes células caliciformes; maturação da base para a ' +
          'superfície; mitoses restritas ao terço basal. Cada um desses quatro traços é perdido, na ' +
          'ordem, quando a displasia se instala.',
        aproximado: false,
      },
      {
        titulo: 'Intestino grosso normal — camadas da parede',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-digestorio',
          'tubular-digestive-system',
          'large-intestine-and-anus',
          'large-intestine-4',
        ],
        oQueObservar:
          'Mucosa, muscular da mucosa, submucosa, muscular própria e subserosa, com limites nítidos. ' +
          'Reconhecer a muscular da mucosa é indispensável: é a linha cuja transposição converte ' +
          'displasia de alto grau em carcinoma invasor.',
        aproximado: false,
      },
      {
        titulo: 'Visão geral do sistema digestório tubular',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-digestorio',
          'tubular-digestive-system',
          'overview-of-the-tubular-digestive-system',
          'overview-1',
        ],
        oQueObservar:
          'O plano geral de organização em camadas que se repete do esôfago ao reto. É o mapa que ' +
          'permite estadiar profundidade de invasão em qualquer segmento.',
        aproximado: false,
      },
    ],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'displasia',
        aplicacao:
          'No cólon, a displasia se instala dentro do adenoma: as criptas perdem a maturação de ' +
          'superfície, os núcleos se alongam, hipercromáticos e pseudoestratificados, e as mitoses ' +
          'sobem para o topo. É a expressão morfológica das primeiras alterações clonais, e o ' +
          'estágio em que a polipectomia ainda cura.',
      },
      {
        mecanismoId: 'invasao-neoplasica',
        aplicacao:
          'A malignidade se define quando glândulas neoplásicas atravessam a muscular da mucosa e ' +
          'alcançam a submucosa. No cólon esse limiar é anatômico e prático: os vasos linfáticos ' +
          'quase inexistem na lâmina própria colônica, de modo que displasia de alto grau intramucosa ' +
          'não metastatiza — e é por isso que, aqui, "invasor" começa na submucosa, e não na membrana ' +
          'basal.',
      },
      {
        mecanismoId: 'reparo-fibrose',
        aplicacao:
          'O estroma responde à invasão com desmoplasia: fibroblastos ativados depositam colágeno ' +
          'denso ao redor dos ninhos tumorais. Essa reação é o que dá ao tumor a consistência firme ' +
          'palpável e o aspecto retraído macroscopicamente, e é um dos sinais indiretos de invasão ' +
          'verdadeira em fragmentos pequenos.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Perda funcional de APC numa célula-tronco da cripta',
        porQue:
          'APC integra o complexo de destruição da β-catenina. Sem ele, a β-catenina se acumula, ' +
          'migra ao núcleo e liga-se a TCF/LEF, ativando MYC e ciclina D1. A célula deixa de ' +
          'responder aos sinais que limitariam sua proliferação.',
      },
      {
        etapa: 'alvo',
        titulo: 'Via Wnt e o eixo de renovação da cripta',
        porQue:
          'A cripta colônica normal é uma linha de montagem: proliferação na base, maturação em ' +
          'direção à superfície, apoptose e descamação no topo. A via Wnt controla justamente o ' +
          'compartimento proliferativo — desregulá-la desmonta o gradiente inteiro.',
      },
      {
        etapa: 'resposta-celular',
        titulo: 'Expansão clonal com perda de maturação',
        porQue:
          'As células filhas não amadurecem: perdem mucina, mantêm núcleos grandes e continuam se ' +
          'dividindo acima do terço basal. Mutações adicionais em KRAS conferem vantagem ' +
          'proliferativa e em TP53 removem o controle de dano ao DNA.',
        achadoAssociado: 'Adenoma com displasia: núcleos alongados, hipercromáticos, pseudoestratificados',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Crescimento adenomatoso e progressão a alto grau',
        porQue:
          'O clone forma uma lesão polipoide (tubular, tubuloviloso ou viloso). O componente viloso e ' +
          'o tamanho maior implicam maior superfície proliferativa e mais tempo — e por isso maior ' +
          'chance de displasia de alto grau.',
        achadoAssociado: 'Arquitetura cribriforme e perda completa da polaridade nuclear',
      },
      {
        etapa: 'morfologia',
        titulo: 'Invasão da submucosa e reação desmoplásica',
        porQue:
          'A célula neoplásica adquire capacidade de degradar a matriz e de migrar. Ao atravessar a ' +
          'muscular da mucosa, encontra um compartimento com linfáticos e vênulas — e induz o ' +
          'estroma a produzir colágeno denso ao seu redor.',
        achadoAssociado:
          'Glândulas irregulares na submucosa, envoltas por estroma desmoplásico; necrose "suja"',
      },
      {
        etapa: 'disfuncao',
        titulo: 'Obstrução luminal, sangramento crônico e perda de superfície absortiva',
        porQue:
          'No cólon esquerdo, de luz estreita e fezes formadas, a massa anular obstrui. No cólon ' +
          'direito, de luz ampla e conteúdo líquido, o tumor cresce como massa vegetante que ulcera ' +
          'e sangra de forma oculta e continuada.',
      },
      {
        etapa: 'clinica',
        titulo: 'Apresentação distinta conforme o segmento',
        porQue:
          'Cólon esquerdo: alteração do hábito intestinal, fezes em fita, hematoquezia e obstrução. ' +
          'Cólon direito: anemia ferropriva por sangramento oculto, fadiga e massa palpável — sem ' +
          'alteração do hábito. A mesma doença, duas histórias clínicas, por razões puramente ' +
          'anatômicas.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Metástase linfática e hepática, perfuração e carcinomatose',
        porQue:
          'A drenagem venosa do cólon é portal, o que torna o fígado o primeiro filtro e o sítio ' +
          'metastático mais comum. A invasão da serosa abre a cavidade peritoneal à disseminação, e ' +
          'a obstrução com distensão a montante pode levar à perfuração diastática.',
      },
    ],
    macroscopia: [
      {
        achado: 'Lesão anular constritiva com bordas elevadas e centro ulcerado ("anel de guardanapo")',
        processo: 'Crescimento circunferencial com desmoplasia e retração.',
        consequencia: 'Padrão típico do cólon esquerdo; correlaciona-se com quadro obstrutivo.',
        peso: 'sugestivo',
      },
      {
        achado: 'Massa vegetante polipoide exofítica',
        processo: 'Crescimento predominantemente intraluminal em segmento de luz ampla.',
        consequencia: 'Padrão típico do cólon direito; correlaciona-se com sangramento oculto.',
        peso: 'sugestivo',
      },
      {
        achado: 'Superfície de corte firme, esbranquiçada, com áreas amareladas de necrose',
        processo: 'Desmoplasia estromal e necrose tumoral por crescimento além do suprimento vascular.',
        consequencia: 'Firmeza é sinal indireto de estroma desmoplásico, e portanto de invasão.',
        peso: 'frequente',
      },
    ],
    histopatologia: {
      panoramica: {
        procure:
          'Localize a muscular da mucosa e siga-a por toda a extensão do corte. A pergunta de ' +
          'pequeno aumento é uma só: as glândulas neoplásicas estão acima ou abaixo dela?',
        achados: [
          {
            achado: 'Glândulas neoplásicas ultrapassando a muscular da mucosa e ocupando a submucosa',
            processo: 'Invasão verdadeira, com aquisição de capacidade migratória e proteolítica.',
            consequencia:
              'É o critério de carcinoma invasor no cólon. Abaixo dessa linha existe drenagem ' +
              'linfática e, portanto, risco metastático.',
            peso: 'necessário',
          },
          {
            achado: 'Interface abrupta entre mucosa normal e área tumoral',
            processo: 'Expansão clonal com substituição da mucosa preexistente.',
            consequencia: 'Delimita a extensão e orienta a avaliação de margens.',
            peso: 'frequente',
          },
          {
            achado: 'Adenoma residual na periferia da lesão',
            processo: 'Remanescente do precursor de onde o carcinoma emergiu.',
            consequencia:
              'Documenta a sequência adenoma-carcinoma e apoia a origem colônica primária da lesão.',
            peso: 'sugestivo',
          },
        ],
      },
      pequeno: {
        procure:
          'Avalie o padrão arquitetural das glândulas e a natureza do estroma que as circunda.',
        achados: [
          {
            achado: 'Glândulas de tamanho e forma irregulares, anguladas, com fusão e cribriformidade',
            processo: 'Proliferação desorganizada sem o controle arquitetural da cripta normal.',
            consequencia:
              'Sustenta malignidade quando associada a invasão; isoladamente pode ocorrer em ' +
              'displasia de alto grau.',
            peso: 'sugestivo',
          },
          {
            achado: 'Estroma desmoplásico: colágeno denso, fibroblastos ativados, ao redor dos ninhos',
            processo: 'Resposta do estroma à invasão, induzida por fatores liberados pelo tumor.',
            consequencia:
              'Um dos sinais mais úteis de invasão verdadeira em biópsias pequenas, em que a ' +
              'muscular da mucosa pode não estar representada.',
            peso: 'sugestivo',
          },
          {
            achado: 'Necrose "suja" intraluminal: debris eosinofílicos com restos nucleares basofílicos',
            processo:
              'Apoptose e necrose de células tumorais na luz glandular, com acúmulo de cariorrexe.',
            consequencia:
              'Achado clássico do adenocarcinoma colorretal, útil inclusive para sugerir origem ' +
              'colônica numa metástase de sítio primário desconhecido.',
            peso: 'sugestivo',
          },
        ],
      },
      medio: {
        procure:
          'Gradue a diferenciação pela proporção de formação glandular e procure invasão de espaços.',
        achados: [
          {
            achado: 'Formação glandular em mais de 50% da área (bem a moderadamente diferenciado)',
            processo: 'Manutenção parcial do programa de diferenciação epitelial.',
            consequencia:
              'Base da graduação em dois níveis (baixo e alto grau) adotada pela classificação vigente.',
            peso: 'frequente',
          },
          {
            achado: 'Invasão de espaços linfovasculares e de bainhas perineurais',
            processo:
              'Penetração de células tumorais em canais preexistentes, com sobrevida em trânsito.',
            consequencia:
              'Fator prognóstico independente; sua presença altera a indicação de terapia adjuvante.',
            peso: 'sugestivo',
          },
          {
            achado: 'Brotamento tumoral: células isoladas ou grupos de até quatro na frente invasiva',
            processo: 'Dissociação celular na interface com o estroma, associada a transição EMT-like.',
            consequencia:
              'Marcador prognóstico adverso, especialmente relevante em pT1 tratado por polipectomia.',
            peso: 'sugestivo',
          },
        ],
      },
      grande: {
        procure:
          'Confirme a atipia citológica e caracterize eventuais componentes especiais — mucinoso, em ' +
          'anel de sinete, medular.',
        achados: [
          {
            achado: 'Núcleos alongados, hipercromáticos, pseudoestratificados, com nucléolos evidentes',
            processo: 'Alteração do conteúdo e da organização da cromatina em células proliferantes.',
            consequencia: 'Confirma a natureza neoplásica das glândulas irregulares.',
            peso: 'necessário',
          },
          {
            achado: 'Lagos de mucina extracelular com células tumorais flutuando (componente mucinoso)',
            processo: 'Superprodução e extravasamento de mucina pela célula neoplásica.',
            consequencia:
              'Quando ocupa mais de metade do tumor, define o subtipo mucinoso, frequentemente ' +
              'associado a instabilidade de microssatélites.',
            peso: 'sugestivo',
          },
          {
            achado: 'Infiltrado linfocitário intratumoral proeminente com borda de crescimento expansiva',
            processo: 'Resposta imune a neoantígenos gerados pela alta carga mutacional.',
            consequencia:
              'Levanta a hipótese de tumor com deficiência de reparo de mal pareamento, o que obriga ' +
              'a testagem do painel de MMR.',
            peso: 'sugestivo',
          },
        ],
      },
      sintese:
        'O diagnóstico exige invasão além da muscular da mucosa; arquitetura irregular, desmoplasia e ' +
        'necrose suja sustentam a leitura, mas o critério é arquitetural e é lido em pequeno aumento. ' +
        'O que a morfologia sozinha não entrega, e precisa ser complementado, é o estado do sistema de ' +
        'reparo de mal pareamento e o perfil molecular acionável (RAS e BRAF) — informações que ' +
        'mudam prognóstico e tratamento e que uma lâmina de HE apenas sugere.',
    },
    coloracoesEspeciais: [
      {
        nome: 'PAS-Alcian blue',
        tipo: 'coloracao',
        pergunta: 'O material extracelular abundante é realmente mucina, e de que tipo?',
        padraoEsperado:
          'Mucinas neutras em magenta (PAS) e ácidas em azul (Alcian). No adenocarcinoma mucinoso, ' +
          'lagos extensos de mucina ácida circundando ninhos tumorais.',
        controles: 'Células caliciformes normais do próprio corte servem de controle interno.',
        limitacoes: [
          'Não distingue mucina de origem colônica de mucina de outros primários.',
          'Mucina abundante pode diluir as células tumorais e dificultar a avaliação de margem.',
        ],
        mudaODiferencial:
          'Confirma o componente mucinoso, que tem implicação na resposta terapêutica e frequentemente ' +
          'acompanha instabilidade de microssatélites.',
      },
    ],
    imunoHistoquimica: [
      {
        nome: 'Painel de proteínas de reparo de mal pareamento (MLH1, PMS2, MSH2, MSH6)',
        tipo: 'imuno-histoquimica',
        pergunta:
          'O tumor é deficiente em reparo de mal pareamento — e há suspeita de síndrome de Lynch?',
        padraoEsperado:
          'Marcação nuclear preservada nas quatro proteínas em tumores proficientes. Perda em par ' +
          '(MLH1/PMS2 ou MSH2/MSH6) indica deficiência; linfócitos e células estromais do próprio ' +
          'corte devem permanecer positivos.',
        controles:
          'Controle interno obrigatório: linfócitos, células estromais e criptas normais. Sem ' +
          'positividade interna, uma perda aparente não é interpretável.',
        limitacoes: [
          'Perda de MLH1/PMS2 é muito mais frequentemente somática (metilação do promotor) do que germinativa; exige teste de BRAF V600E ou de metilação antes de concluir por Lynch.',
          'Terapia neoadjuvante pode alterar a expressão.',
          'Marcação heterogênea ou fraca é fonte de erro interobservador.',
        ],
        mudaODiferencial:
          'Deficiência de MMR muda três coisas ao mesmo tempo: aponta possível síndrome hereditária ' +
          'com implicação familiar, altera o prognóstico no estádio II e indica imunoterapia com ' +
          'inibidores de checkpoint na doença avançada.',
      },
      {
        nome: 'CK20 positivo / CK7 negativo e CDX2',
        tipo: 'imuno-histoquimica',
        pergunta:
          'Numa metástase de sítio primário desconhecido, o padrão é compatível com origem colorretal?',
        padraoEsperado:
          'CK20 citoplasmática positiva, CK7 negativa e CDX2 nuclear positiva é o perfil clássico do ' +
          'adenocarcinoma colorretal.',
        controles: 'Controles externos positivos e negativos para cada anticorpo.',
        limitacoes: [
          'Tumores pouco diferenciados e com instabilidade de microssatélites podem perder CDX2.',
          'Adenocarcinomas de outros sítios (estômago, vias biliares, ovário mucinoso) podem exibir perfis sobrepostos.',
        ],
        mudaODiferencial:
          'Orienta, mas não define: o perfil sugere origem colorretal e precisa ser confrontado com ' +
          'imagem e história clínica.',
      },
    ],
    biologiaMolecular: [
      {
        nome: 'Painel de RAS (KRAS/NRAS) e BRAF V600E',
        tipo: 'molecular',
        pergunta:
          'O tumor pode se beneficiar de anti-EGFR, e há alteração de valor prognóstico ou de triagem?',
        padraoEsperado:
          'Detecção de mutações nos códons de RAS relevantes e da substituição V600E em BRAF, em ' +
          'material com celularidade tumoral suficiente.',
        limitacoes: [
          'Exige quantificação prévia da fração de células tumorais; áreas muito mucinosas ou necróticas comprometem o resultado.',
          'Heterogeneidade intratumoral pode gerar resultados discordantes entre blocos.',
          'Um resultado negativo não exclui outras alterações fora do painel.',
        ],
        mudaODiferencial:
          'RAS mutado contraindica anti-EGFR. BRAF V600E, num tumor com perda de MLH1/PMS2, aponta ' +
          'para causa somática por metilação e reduz muito a probabilidade de síndrome de Lynch.',
      },
    ],
    correlacaoClinica: [
      {
        achadoMorfologico: 'Lesão anular constritiva em cólon esquerdo',
        consequenciaFuncional: 'Redução progressiva da luz num segmento com fezes já formadas.',
        manifestacao: 'Alteração do hábito intestinal, fezes em fita, cólicas e obstrução intestinal.',
      },
      {
        achadoMorfologico: 'Massa vegetante ulcerada em cólon direito',
        consequenciaFuncional: 'Sangramento crônico de baixo volume em segmento de luz ampla.',
        manifestacao: 'Anemia ferropriva, fadiga e massa palpável, sem alteração do hábito intestinal.',
      },
      {
        achadoMorfologico: 'Invasão de espaços linfovasculares',
        consequenciaFuncional: 'Acesso a rotas de disseminação regional e sistêmica.',
        manifestacao: 'Linfonodos comprometidos e metástases hepáticas pela drenagem portal.',
      },
      {
        achadoMorfologico: 'Penetração da serosa visceral',
        consequenciaFuncional: 'Exposição de células tumorais à cavidade peritoneal.',
        manifestacao: 'Carcinomatose peritoneal e ascite neoplásica.',
      },
    ],
    diagnosticosDiferenciais: [
      {
        nome: 'Adenoma com displasia de alto grau (carcinoma intramucoso)',
        motivoDaConfusao:
          'Atipia citológica e arquitetura cribriforme idênticas às do carcinoma invasor.',
        achadosCompartilhados: ['atipia nuclear intensa', 'arquitetura cribriforme', 'perda de maturação'],
        discriminador:
          'Ausência de invasão além da muscular da mucosa e ausência de desmoplasia. No cólon, a ' +
          'lesão intramucosa não metastatiza.',
        armadilhaDeAmostragem:
          'Biópsia superficial pode não incluir a muscular da mucosa; nesse caso o laudo deve dizer ' +
          '"pelo menos displasia de alto grau", e não afirmar ausência de invasão.',
      },
      {
        nome: 'Pseudoinvasão em pólipo pediculado',
        motivoDaConfusao:
          'Glândulas displásicas deslocadas para a submucosa do pedículo por torção mecânica.',
        achadosCompartilhados: ['glândulas displásicas na submucosa'],
        discriminador:
          'Glândulas arredondadas e circundadas por lâmina própria, com hemossiderina e hemorragia ' +
          'antiga, sem desmoplasia e sem irregularidade angulada.',
        exameQueResolve: 'Cortes seriados demonstrando continuidade com a superfície e ausência de estroma desmoplásico.',
      },
      {
        nome: 'Adenocarcinoma metastático de outro sítio',
        motivoDaConfusao: 'Morfologia glandular semelhante em biópsia de cólon.',
        achadosCompartilhados: ['glândulas atípicas', 'invasão'],
        discriminador:
          'Ausência de componente adenomatoso adjacente e perfil imuno-histoquímico discordante ' +
          '(por exemplo, CK7 positivo e CK20 negativo).',
        exameQueResolve: 'Painel CK7/CK20/CDX2 correlacionado com imagem.',
      },
      {
        nome: 'Displasia associada a doença inflamatória intestinal',
        motivoDaConfusao:
          'Alterações regenerativas intensas em mucosa colítica simulam displasia, e vice-versa.',
        achadosCompartilhados: ['atipia nuclear', 'arquitetura distorcida', 'inflamação'],
        discriminador:
          'Maturação de superfície preservada e gradiente de atipia decrescente em direção ao topo ' +
          'sugerem regeneração; atipia uniforme até a superfície sugere displasia.',
        exameQueResolve: 'Revisão por segundo patologista, prática recomendada nesse cenário específico.',
      },
      {
        nome: 'Tumor neuroendócrino bem diferenciado',
        motivoDaConfusao: 'Ninhos celulares monótonos infiltrando a submucosa.',
        achadosCompartilhados: ['infiltração submucosa', 'ninhos celulares'],
        discriminador:
          'Cromatina "sal e pimenta", arquitetura organoide ou trabecular e ausência de formação ' +
          'glandular verdadeira.',
        exameQueResolve: 'Sinaptofisina e cromogranina positivas; índice Ki-67 para graduação.',
      },
    ],
    complicacoes: [
      {
        complicacao: 'Obstrução intestinal completa',
        mecanismo:
          'Crescimento circunferencial com desmoplasia reduz a luz até impedir a passagem do ' +
          'conteúdo fecal formado.',
      },
      {
        complicacao: 'Perfuração com peritonite',
        mecanismo:
          'Necrose tumoral com ruptura local, ou perfuração diastática do ceco distendido a montante ' +
          'de uma obstrução distal.',
      },
      {
        complicacao: 'Metástase hepática',
        mecanismo:
          'Invasão venosa com drenagem pelo sistema porta, tornando o fígado o primeiro leito ' +
          'capilar encontrado pelas células tumorais.',
      },
      {
        complicacao: 'Anemia ferropriva grave',
        mecanismo:
          'Sangramento oculto crônico pela superfície ulcerada, com depleção progressiva das ' +
          'reservas de ferro.',
      },
    ],
    normalVersusPatologico: [
      {
        aspecto: 'Arquitetura das criptas',
        normal: 'Retas, paralelas, do mesmo comprimento, apoiadas na muscular da mucosa.',
        patologico:
          'Glândulas irregulares, anguladas, fundidas e cribriformes, sem relação com a muscular da ' +
          'mucosa.',
      },
      {
        aspecto: 'Maturação epitelial',
        normal: 'Proliferação na base, maturação e mucina em direção à superfície.',
        patologico:
          'Maturação abolida; núcleos atípicos e mitoses em toda a altura, com perda de células ' +
          'caliciformes.',
      },
      {
        aspecto: 'Estroma',
        normal: 'Lâmina própria frouxa e delicada, com poucas células inflamatórias.',
        patologico: 'Estroma desmoplásico denso, fibroblástico, envolvendo os ninhos invasores.',
      },
      {
        aspecto: 'Muscular da mucosa',
        normal: 'Faixa contínua e íntegra separando mucosa e submucosa.',
        patologico: 'Interrompida e ultrapassada por glândulas neoplásicas — o critério de invasão.',
      },
    ],
    resumoDeProva: [
      'Critério de malignidade no cólon: invasão além da muscular da mucosa. Displasia de alto grau intramucosa não metastatiza.',
      'Sequência clássica: APC → KRAS → TP53, com correlato morfológico em cada etapa.',
      'Necrose "suja" e desmoplasia são as duas pistas de que se trata de adenocarcinoma colorretal invasor.',
      'Cólon direito sangra e causa anemia; cólon esquerdo obstrui. A diferença é de calibre e de consistência das fezes.',
      'O painel de MMR muda diagnóstico sindrômico, prognóstico e indicação de imunoterapia — não é opcional.',
    ],
    armadilhas: [
      'Diagnosticar invasão em pólipo pediculado com pseudoinvasão: procurar lâmina própria em volta e hemossiderina.',
      'Afirmar ausência de invasão em biópsia superficial que não amostrou a muscular da mucosa.',
      'Concluir por síndrome de Lynch a partir da perda isolada de MLH1/PMS2, sem testar BRAF ou metilação.',
      'Interpretar mucosa colítica regenerativa como displasia — a maturação de superfície é o discriminador.',
      'Ler painel de MMR sem controle interno positivo: uma falha técnica vira "perda de expressão".',
    ],
    perguntasDeAutoavaliacao: [
      {
        pergunta:
          'Pólipo pediculado ressecado por colonoscopia mostra glândulas displásicas na submucosa do ' +
          'pedículo, arredondadas, circundadas por lâmina própria, com hemossiderina no estroma e sem ' +
          'desmoplasia. Qual o diagnóstico?',
        alternativas: [
          'Adenocarcinoma invasor pT1; indicar colectomia segmentar.',
          'Pseudoinvasão em adenoma: deslocamento mecânico de glândulas, sem invasão verdadeira.',
          'Adenocarcinoma mucinoso.',
          'Tumor neuroendócrino.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'Os três achados que definem pseudoinvasão estão presentes: glândulas arredondadas, ' +
          'acompanhadas de lâmina própria, e hemossiderina indicando hemorragia antiga por torção do ' +
          'pedículo. Falta o que a invasão verdadeira exigiria — glândulas anguladas e irregulares ' +
          'envoltas por estroma desmoplásico. Diagnosticar pT1 aqui levaria a uma colectomia ' +
          'desnecessária.',
        nivel: 'essencial',
      },
      {
        pergunta:
          'Por que a displasia de alto grau confinada à mucosa colônica não é considerada carcinoma ' +
          'com risco metastático, ao contrário do que ocorre em outros órgãos?',
        alternativas: [
          'Porque a mucosa colônica não tem membrana basal.',
          'Porque a lâmina própria colônica é praticamente desprovida de vasos linfáticos, de modo que só a partir da submucosa existe rota de disseminação.',
          'Porque as células displásicas do cólon não expressam proteases.',
          'Porque a mucosa colônica se renova a cada cinco dias e elimina as células atípicas.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'A convenção não é arbitrária: é anatômica. A lâmina própria do cólon tem densidade ' +
          'linfática muito baixa, o que torna a metástase a partir de lesão intramucosa um evento ' +
          'praticamente inexistente. Por isso o limiar prático de "invasor" foi colocado na submucosa, ' +
          'onde os linfáticos existem. Membrana basal, proteases e renovação epitelial existem no ' +
          'cólon como em qualquer epitélio.',
        nivel: 'aprofundar',
      },
      {
        pergunta:
          'Adenocarcinoma de cólon direito, mucinoso, com infiltrado linfocitário intratumoral ' +
          'proeminente, mostra perda de MLH1 e PMS2 e preservação de MSH2 e MSH6, com controles ' +
          'internos positivos. Qual o próximo passo mais apropriado?',
        alternativas: [
          'Encaminhar diretamente para aconselhamento genético como síndrome de Lynch confirmada.',
          'Testar BRAF V600E e/ou metilação do promotor de MLH1 para distinguir causa somática de germinativa.',
          'Repetir a imuno-histoquímica em outro bloco.',
          'Indicar anti-EGFR imediatamente.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'O padrão de perda MLH1/PMS2 é, na maioria das vezes, somático: resulta de metilação do ' +
          'promotor de MLH1, frequentemente acompanhada de BRAF V600E. Confirmar isso evita ' +
          'encaminhar a família inteira a uma investigação genética desnecessária — e, se negativo, ' +
          'fortalece muito a suspeita de Lynch. Repetir a imuno-histoquímica não é necessário com ' +
          'controles internos válidos, e anti-EGFR depende do estado de RAS, ainda não avaliado.',
        nivel: 'avancado',
      },
    ],
    referencias: [
      {
        citacao:
          'WHO Classification of Tumours Editorial Board. Digestive System Tumours. 5ª ed. Lyon: IARC; 2019.',
        organizacao: 'OMS/IARC',
        edicao: '5ª',
        ano: 2019,
      },
      {
        citacao:
          'Kumar V, Abbas AK, Aster JC. Robbins & Cotran Pathologic Basis of Disease. 10ª ed. Elsevier; 2021. Capítulo do trato gastrointestinal.',
        organizacao: 'Elsevier',
        edicao: '10ª',
        ano: 2021,
      },
      {
        citacao:
          'Amin MB, et al. AJCC Cancer Staging Manual. 8ª ed. Springer; 2017. Capítulo de cólon e reto.',
        organizacao: 'American Joint Committee on Cancer',
        edicao: '8ª',
        ano: 2017,
      },
      {
        citacao:
          'College of American Pathologists. Protocol for the Examination of Specimens From Patients With Primary Carcinoma of the Colon and Rectum.',
        organizacao: 'College of American Pathologists',
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    versao: 1,
    atualizadoEm: '2026-08-09',
    pendencias: [
      'Revisão por patologista gastrointestinal, com conferência do estadiamento contra a edição vigente do AJCC.',
      'Confirmar se a graduação em dois níveis descrita corresponde à prática institucional adotada.',
      'Definir critérios de brotamento tumoral (contagem e área) conforme o consenso adotado, hoje não especificados no texto.',
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
