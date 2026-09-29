import type { DoencaZoom } from '../tipos'

/** Pele. */
export const DOENCAS_PELE: DoencaZoom[] = [
  {
    id: 'carcinoma-basocelular',
    nome: 'Carcinoma basocelular',
    sinonimos: ['CBC', 'epitelioma basocelular', 'úlcera roedora'],
    nomesEmIngles: ['basal cell carcinoma', 'rodent ulcer'],
    sistema: 'tegumentar',
    orgao: 'pele-fina',
    prioridade: 1,
    resumo:
      'Câncer de pele mais comum, derivado das células basaloides do folículo piloso: ninhos de células azuladas com paliçada periférica e fendas de retração, que invadem a derme localmente mas quase nunca dão metástase.',
    epidemiologia:
      'É o câncer mais frequente em humanos — no Brasil, o câncer de pele não melanoma responde por cerca de 30 % de todos os tumores. Idosos de pele clara, com exposição solar crônica, em áreas fotoexpostas (face, principalmente nariz e região periorbitária).',
    patogenese: [
      'A radiação UVB causa mutações (dímeros de pirimidina) em células-tronco do folículo piloso e da camada basal.',
      'A mutação que importa ativa a via Hedgehog: perda de PTCH1 ou ativação de SMO. Na síndrome de Gorlin, a mutação de PTCH1 é germinativa (múltiplos CBC em jovens).',
      'As células proliferam formando ninhos basaloides que brotam da epiderme e invadem a derme, sustentados por um estroma próprio, mucinoso.',
      'O tumor cresce devagar e destrói localmente (pele, cartilagem, osso — daí "úlcera roedora"), mas depende do seu estroma: metástase é raríssima.',
    ],
    roteiro: [
      'Panorâmico: pele com massas arroxeadas na derme, muitas vezes ligadas à epiderme; note se a superfície está ulcerada.',
      'Médio aumento: ninhos de células basaloides de tamanhos variados, separados por estroma fibroso ou mucinoso.',
      'Na borda dos ninhos, procure a paliçada periférica.',
      'Entre ninho e estroma, procure a fenda de retração (linha branca).',
      'Classifique o padrão (nodular, superficial, infiltrativo, micronodular) e verifique as margens — os padrões infiltrativos recidivam mais.',
    ],
    achados: [
      {
        achado: 'ninhos-basaloides',
        tipo: 'especifico',
        comoAparece: 'Ilhas de células pequenas, azuladas, de núcleo oval e pouco citoplasma, na derme.',
        peso: 'criterio',
      },
      {
        achado: 'paliçada-periferica',
        tipo: 'especifico',
        comoAparece: 'Núcleos alinhados como estacas na periferia de cada ninho.',
        peso: 'criterio',
      },
      {
        achado: 'fenda-de-retracao',
        tipo: 'especifico',
        comoAparece: 'Espaço vazio entre o ninho e o estroma.',
        peso: 'frequente',
      },
      {
        achado: 'invasao-estromal',
        tipo: 'geral',
        comoAparece: 'Os ninhos invadem a derme a partir da epiderme; nos padrões infiltrativos, cordões finos em estroma fibroso.',
        peso: 'frequente',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Ulceração da epiderme sobre o tumor ("úlcera roedora"), com crosta.',
        peso: 'ocasional',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Linfócitos e plasmócitos no estroma em volta do tumor.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Carcinoma espinocelular',
        comoSeparar: 'Células grandes, de citoplasma eosinofílico abundante, com pontes intercelulares e pérolas córneas (queratinização); sem paliçada nem fenda de retração.',
      },
      {
        nome: 'Tricoepitelioma',
        comoSeparar: 'Benigno; ninhos basaloides com diferenciação folicular (cistos córneos, papilas), estroma celular aderido ao ninho, sem fendas.',
      },
      {
        nome: 'Ceratose seborreica',
        comoSeparar: 'Proliferação de células basaloides ACIMA do nível da epiderme, com pseudocistos córneos; não invade a derme.',
      },
    ],
    correlacaoClinica: [
      'Pápula perolada e brilhante, com telangiectasias e borda enrolada, que cresce devagar e pode ulcerar no centro.',
      'Tratamento: excisão com margens (cirurgia de Mohs em áreas nobres da face); em casos avançados, inibidores de Hedgehog (vismodegibe).',
      'Prevenção: fotoproteção desde a infância.',
    ],
    comparacaoComNormal: [
      'Na pele normal, a epiderme é um epitélio estratificado com uma única fileira de células basais; a derme tem colágeno, anexos e vasos, sem ilhas celulares.',
      'No carcinoma basocelular, células semelhantes às basais formam grandes ninhos que ocupam a derme — como se a camada basal tivesse proliferado para baixo.',
    ],
  },
  {
    id: 'carcinoma-espinocelular',
    nome: 'Carcinoma espinocelular',
    sinonimos: ['carcinoma epidermoide', 'carcinoma de células escamosas', 'CEC'],
    nomesEmIngles: ['squamous cell carcinoma'],
    sistema: 'tegumentar',
    orgao: 'pele-fina',
    prioridade: 2,
    resumo:
      'Neoplasia maligna dos queratinócitos: ninhos de células escamosas atípicas que invadem a derme e produzem queratina (pérolas córneas); pode dar metástase para linfonodos.',
    epidemiologia:
      'Segundo câncer de pele mais comum. Idosos de pele clara, áreas fotoexpostas (face, lábio inferior, orelhas, dorso das mãos); risco muito maior em imunossuprimidos (transplantados). Também surge em cicatrizes de queimadura e úlceras crônicas (úlcera de Marjolin).',
    patogenese: [
      'A radiação UVB provoca mutações de TP53 nos queratinócitos, que escapam da apoptose.',
      'Surge displasia restrita à epiderme: ceratose actínica (parcial) e carcinoma in situ/doença de Bowen (toda a espessura).',
      'Com mais mutações, as células rompem a membrana basal e invadem a derme em ninhos e cordões.',
      'Os ninhos mantêm parte da diferenciação escamosa: produzem queratina que se acumula em pérolas córneas.',
      'A invasão profunda e perineural abre caminho para os linfáticos: metástase linfonodal em 2–5 % (mais em lábio, orelha e imunossuprimidos).',
    ],
    roteiro: [
      'Panorâmico: massa exofítica ou ulcerada da pele, com ninhos róseos descendo para a derme.',
      'Médio aumento: ninhos irregulares de células escamosas, muitos com pérolas córneas no centro.',
      'Grande aumento: células grandes de citoplasma eosinofílico, pontes intercelulares, núcleos atípicos e mitoses.',
      'Avalie a profundidade (espessura em mm, nível anatômico), a invasão perineural e as margens.',
    ],
    achados: [
      {
        achado: 'ninhos-escamosos-infiltrativos',
        tipo: 'especifico',
        comoAparece: 'Ilhas irregulares de queratinócitos atípicos invadindo a derme.',
        peso: 'criterio',
      },
      {
        achado: 'perola-cornea',
        tipo: 'especifico',
        comoAparece: 'Redemoinhos de queratina no centro dos ninhos (carcinoma bem diferenciado).',
        peso: 'frequente',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos grandes, pleomórficos, com nucléolos, em células de citoplasma eosinofílico abundante.',
        peso: 'criterio',
      },
      {
        achado: 'invasao-estromal',
        tipo: 'geral',
        comoAparece: 'Os ninhos ultrapassam a membrana basal e infiltram a derme.',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Linfócitos e plasmócitos no estroma entre os ninhos.',
        peso: 'frequente',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Superfície ulcerada e com crosta nos tumores maiores.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Carcinoma basocelular',
        comoSeparar: 'Células basaloides pequenas, azuladas, com paliçada periférica e fendas de retração; sem queratinização abundante.',
      },
      {
        nome: 'Ceratoacantoma',
        comoSeparar: 'Lesão em cratera simétrica com tampão central de queratina e "lábios" de epiderme; cresce rápido e pode regredir — mas muitos o tratam como CEC bem diferenciado.',
      },
      {
        nome: 'Hiperplasia pseudoepiteliomatosa',
        comoSeparar: 'Proliferação reativa da epiderme em volta de úlceras ou infecções, sem atipia significativa nem mitoses atípicas.',
      },
    ],
    correlacaoClinica: [
      'Pápula ou placa ceratósica, endurecida, que cresce em semanas a meses e pode ulcerar ou sangrar; lesão "que não cicatriza" em área fotoexposta.',
      'Tratamento: excisão cirúrgica com margens; radioterapia em casos selecionados; imunoterapia (anti-PD-1) na doença avançada.',
      'Examine linfonodos regionais: ao contrário do basocelular, o espinocelular dá metástase.',
    ],
    comparacaoComNormal: [
      'Na pele normal, os queratinócitos formam camadas ordenadas — basal, espinhosa, granulosa e córnea — e a queratina fica só na superfície.',
      'No carcinoma espinocelular, queratinócitos atípicos formam ninhos dentro da derme e produzem queratina em lugares errados (pérolas no meio do tecido).',
    ],
  },
  {
    id: 'melanoma',
    nome: 'Melanoma cutâneo',
    sinonimos: ['melanoma maligno', 'melanoma extensivo superficial', 'melanoma nodular'],
    nomesEmIngles: ['cutaneous melanoma', 'malignant melanoma'],
    sistema: 'tegumentar',
    orgao: 'pele-fina',
    prioridade: 3,
    resumo:
      'Neoplasia maligna dos melanócitos: componente juncional de ninhos atípicos que sobem pela epiderme e invasão da derme por células atípicas que não maturam e se dividem.',
    epidemiologia:
      'Menos frequente que os carcinomas de pele, mas responsável pela maioria das mortes por câncer de pele. Fatores: exposição solar intermitente com queimaduras (sobretudo na infância), pele clara, muitos nevos, nevos atípicos, história familiar (CDKN2A), imunossupressão. Pode surgir em qualquer idade adulta, inclusive em jovens.',
    patogenese: [
      'A radiação UV e mutações hereditárias danificam o DNA dos melanócitos: BRAF V600E (≈ 50 %), NRAS, NF1; perda de CDKN2A e ativação de TERT.',
      'Fase de crescimento radial: melanócitos atípicos proliferam na epiderme e na junção (in situ), espalhando-se lateralmente — mancha que cresce e fica irregular.',
      'Fase de crescimento vertical: um clone adquire capacidade de invadir a derme e formar nódulos, sem maturar.',
      'Quanto mais profunda a invasão (Breslow), maior o acesso a linfáticos e vasos: metástases para linfonodos, pulmão, fígado e cérebro.',
    ],
    roteiro: [
      'Panorâmico: lesão assimétrica e mal delimitada; compare as bordas — no melanoma elas são desiguais.',
      'Epiderme: ninhos juncionais desiguais e confluentes; melanócitos isolados subindo (pagetoide); ulceração?',
      'Derme: lençóis e ninhos de células atípicas até a base, sem maturação; conte mitoses dérmicas.',
      'Meça a espessura de Breslow (da camada granulosa até a célula tumoral mais profunda) e procure regressão, invasão perineural e vascular.',
    ],
    achados: [
      {
        achado: 'ninhos-melanociticos-juncionais-atipicos',
        tipo: 'especifico',
        comoAparece: 'Ninhos desiguais e confluentes na junção dermoepidérmica, com células subindo pela epiderme.',
        peso: 'criterio',
      },
      {
        achado: 'ausencia-de-maturacao',
        tipo: 'especifico',
        comoAparece: 'Células grandes e atípicas em lençóis até a base da lesão, com mitoses dérmicas.',
        peso: 'criterio',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos grandes, vesiculosos, com nucléolos eosinofílicos proeminentes.',
        peso: 'frequente',
      },
      {
        achado: 'pigmento-melanico',
        tipo: 'geral',
        comoAparece: 'Melanina fina nas células tumorais e grosseira em melanófagos (pode faltar).',
        peso: 'frequente',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Ulceração da epiderme sobre o tumor — fator de pior prognóstico no estadiamento.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Nevo melanocítico (juncional, composto ou dérmico)',
        comoSeparar: 'Simétrico, bem delimitado, ninhos regulares, sem pagetoide extenso; as células maturam na profundidade e não há mitoses dérmicas profundas.',
      },
      {
        nome: 'Nevo de Spitz',
        comoSeparar: 'Jovens; células fusiformes e epitelioides grandes, mas lesão simétrica, com corpos de Kamino e maturação.',
      },
      {
        nome: 'Carcinoma pouco diferenciado ou linfoma na pele',
        comoSeparar: 'Imuno: melanoma é S100, SOX10, Melan-A e HMB-45 positivo; citoqueratina negativa.',
      },
    ],
    correlacaoClinica: [
      'Regra ABCDE: Assimetria, Bordas irregulares, Cores variadas, Diâmetro > 6 mm e Evolução (mudança). Sinal do "patinho feio".',
      'Diagnóstico por biópsia excisional com margem estreita; a espessura de Breslow orienta a margem definitiva e a biópsia do linfonodo sentinela.',
      'Tratamento: excisão ampla; na doença avançada, imunoterapia (anti-PD-1, anti-CTLA-4) e inibidores de BRAF/MEK — que mudaram o prognóstico.',
    ],
    comparacaoComNormal: [
      'Na pele normal, os melanócitos são células isoladas, espaçadas, na camada basal da epiderme — cerca de 1 para cada 10 queratinócitos basais.',
      'No melanoma, eles formam ninhos grandes e confluentes, sobem pela epiderme e invadem a derme em lençóis de células atípicas.',
    ],
  },
  {
    id: 'ceratose-seborreica',
    nome: 'Ceratose seborreica',
    sinonimos: ['queratose seborreica', 'verruga seborreica', 'ceratose senil'],
    nomesEmIngles: ['seborrhoeic keratosis'],
    sistema: 'tegumentar',
    orgao: 'pele-fina',
    prioridade: 4,
    resumo:
      'Proliferação epidérmica benigna muito comum em idosos: acantose de células basaloides uniformes, com pseudocistos córneos, que forma placa "colada" sobre a pele.',
    epidemiologia: 'Extremamente comum após os 40–50 anos, em tronco, face e dorso das mãos; múltiplas. Sem potencial maligno.',
    patogenese: [
      'Mutações ativadoras em FGFR3 e PIK3CA nos queratinócitos, às vezes favorecidas pelo sol e pela idade.',
      'Os queratinócitos basaloides proliferam para cima (exofítico), sem invadir a derme: a base da lesão fica no mesmo nível da pele ao redor.',
      'A superfície dobra-se e a queratina fica presa em invaginações — os pseudocistos córneos; melanina transferida pelos melanócitos deixa a lesão marrom.',
    ],
    roteiro: [
      'Panorâmico: lesão exofítica, bem delimitada, com base plana em linha reta com a epiderme vizinha.',
      'Médio aumento: acantose por células basaloides pequenas; pseudocistos córneos arredondados; hiperceratose e papilomatose.',
      'Grande aumento: células uniformes, sem atipia; mitoses raras; pigmento variável.',
    ],
    achados: [
      {
        achado: 'acantose-basaloide-exofitica',
        tipo: 'especifico',
        comoAparece: 'Epiderme muito espessada por células basaloides uniformes, acima do nível da pele vizinha.',
        peso: 'criterio',
      },
      {
        achado: 'pseudocistos-corneos',
        tipo: 'especifico',
        comoAparece: 'Cistos de queratina lamelar espalhados pela lesão.',
        peso: 'criterio',
      },
      {
        achado: 'pigmento-melanico',
        tipo: 'geral',
        comoAparece: 'Melanina nos queratinócitos basaloides nas formas pigmentadas.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Carcinoma basocelular',
        comoSeparar: 'Ninhos basaloides que invadem a derme, com paliçada periférica, fendas de retração e estroma mixoide.',
      },
      {
        nome: 'Carcinoma espinocelular / doença de Bowen',
        comoSeparar: 'Atipia citológica em toda a espessura, mitoses altas, disqueratose; pérolas córneas de células atípicas.',
      },
      {
        nome: 'Verruga vulgar',
        comoSeparar: 'Papilomatose com coilócitos e grânulos querato-hialinos grosseiros; cristas curvadas para o centro.',
      },
    ],
    correlacaoClinica: [
      'Placas ou pápulas marrons, de superfície verrucosa e aspecto "colado"; na dermatoscopia, cistos miliares e aberturas pseudofoliculares.',
      'Tratamento só por estética ou irritação (crioterapia, curetagem). Biopsiar se houver dúvida com melanoma.',
      'Sinal de Leser-Trélat: aparecimento súbito de muitas ceratoses, associado a adenocarcinoma gástrico.',
    ],
    comparacaoComNormal: [
      'A epiderme normal tem poucas camadas: basal, espinhosa, granulosa e córnea, com cristas regulares.',
      'Na ceratose seborreica, ela fica muito mais grossa, com células basaloides empilhadas e cistos de queratina presos no meio.',
    ],
  },
  {
    id: 'dermatofibroma',
    nome: 'Dermatofibroma',
    sinonimos: ['histiocitoma fibroso benigno', 'fibroma cutâneo', 'histiocitoma'],
    nomesEmIngles: ['dermatofibroma', 'benign fibrous histiocytoma'],
    sistema: 'tegumentar',
    orgao: 'pele-fina',
    prioridade: 5,
    resumo:
      'Lesão dérmica benigna de células fusiformes fibro-histiocíticas que aprisionam o colágeno na periferia, com a epiderme espessada e pigmentada por cima.',
    epidemiologia: 'Muito comum; adultos jovens e de meia-idade, mais em mulheres, sobretudo nas pernas. Às vezes surge após picada de inseto ou trauma pequeno.',
    patogenese: [
      'Proliferação clonal de células fibro-histiocíticas da derme (fusões de genes de PKC em parte dos casos), com componente reativo.',
      'As células crescem entre os feixes de colágeno sem destruí-los, cercando-os — imagem de colágeno aprisionado.',
      'Fatores de crescimento das células induzem hiperplasia e pigmentação da epiderme acima (lesão escura e firme).',
    ],
    roteiro: [
      'Panorâmico: área mal delimitada, mais celular, na derme reticular, com uma faixa de derme papilar poupada logo abaixo da epiderme.',
      'Epiderme: cristas alongadas, de base achatada e hiperpigmentadas.',
      'Médio e grande aumento: células fusiformes em arranjo desordenado, sem atipia; na borda, feixes de colágeno isolados e cercados pelas células.',
    ],
    achados: [
      {
        achado: 'proliferacao-fusocelular-com-colageno-aprisionado',
        tipo: 'especifico',
        comoAparece: 'Células fusiformes na derme cercando feixes de colágeno, principalmente na periferia.',
        peso: 'criterio',
      },
      {
        achado: 'hiperplasia-epidermica-sobrejacente',
        tipo: 'especifico',
        comoAparece: 'Epiderme espessada, com cristas alongadas, logo acima da lesão.',
        peso: 'frequente',
      },
      {
        achado: 'celulas-espumosas',
        tipo: 'geral',
        comoAparece: 'Macrófagos espumosos e com hemossiderina em algumas variantes.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Dermatofibrossarcoma protuberans',
        comoSeparar: 'Mais celular e uniforme, padrão estoriforme marcado, infiltra o subcutâneo em "favo de mel"; CD34+.',
      },
      {
        nome: 'Cicatriz',
        comoSeparar: 'Fibroblastos paralelos à superfície e vasos perpendiculares; sem colágeno aprisionado nem hiperplasia epidérmica.',
      },
    ],
    correlacaoClinica: [
      'Pápula firme, castanha, de 0,5–1 cm, geralmente assintomática; o "sinal da covinha" (depressão ao pinçar a lesão) é típico.',
      'Não exige tratamento; excisão se houver sintomas, crescimento ou dúvida diagnóstica.',
    ],
    comparacaoComNormal: [
      'Na derme normal, os feixes de colágeno são grossos, ondulados e pouco celulares, com fibroblastos esparsos.',
      'No dermatofibroma, há muitas células fusiformes entre esses feixes, que ficam isolados como ilhas; a epiderme por cima engrossa.',
    ],
  },
]
