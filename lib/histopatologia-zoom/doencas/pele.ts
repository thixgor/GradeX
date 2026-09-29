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
]

