import type { DoencaZoom } from '../tipos'

/** Sistema reprodutor feminino. */
export const DOENCAS_REPRODUTOR_FEMININO: DoencaZoom[] = [
  {
    id: 'neoplasia-intraepitelial-cervical',
    nome: 'Neoplasia intraepitelial cervical (NIC 3)',
    sinonimos: ['NIC', 'CIN', 'lesão intraepitelial escamosa de alto grau', 'HSIL', 'displasia cervical'],
    nomesEmIngles: ['cervical intraepithelial neoplasia', 'CIN 3', 'high-grade squamous intraepithelial lesion'],
    sistema: 'reprodutor-feminino',
    orgao: 'colo-uterino',
    prioridade: 1,
    resumo:
      'Displasia do epitélio escamoso do colo uterino causada pelo HPV de alto risco; na NIC 3, células imaturas e atípicas ocupam toda a espessura do epitélio, sem invasão da membrana basal — é a lesão precursora que o rastreamento procura.',
    epidemiologia:
      'O câncer do colo do útero é o terceiro mais comum em mulheres no Brasil. A NIC 3 tem pico entre 25 e 35 anos, cerca de 10 anos antes do carcinoma invasivo. Fatores: HPV 16/18, início sexual precoce, múltiplos parceiros, tabagismo, imunossupressão. A vacina contra HPV previne a maioria dos casos.',
    patogenese: [
      'O HPV infecta as células basais do epitélio escamoso na zona de transformação (junção escamocolunar), onde as células de reserva são mais vulneráveis.',
      'Na maioria das mulheres a infecção é eliminada em 1–2 anos; quando persiste, as proteínas E6 (degrada p53) e E7 (inativa Rb) mantêm as células proliferando.',
      'As células deixam de amadurecer: primeiro no terço inferior (NIC 1), depois em dois terços (NIC 2) e em toda a espessura (NIC 3).',
      'A displasia se estende para dentro das criptas endocervicais, ainda sem invadir.',
      'Sem tratamento, uma parte das NIC 3 rompe a membrana basal em anos: carcinoma escamoso invasivo.',
    ],
    roteiro: [
      'Panorâmico: encontre a ectocérvice normal (epitélio escamoso rosado, que clareia na superfície) e a endocérvice (glândulas mucinosas); a lesão fica na zona de transformação entre elas.',
      'Médio aumento: o epitélio da zona de transformação está escuro em toda a espessura, e ilhas arredondadas escuras descem no estroma — extensão às glândulas.',
      'Grande aumento: compare lado a lado com o epitélio normal — na NIC 3 não há células superficiais achatadas de citoplasma claro; núcleos grandes e mitoses chegam à superfície.',
      'Verifique o contorno inferior: liso (in situ) ou irregular, com células soltas no estroma (invasão).',
    ],
    achados: [
      {
        achado: 'displasia-escamosa-espessura-total',
        tipo: 'especifico',
        comoAparece: 'Células imaturas atípicas em toda a espessura do epitélio escamoso, sem maturação.',
        peso: 'criterio',
      },
      {
        achado: 'extensao-glandular-da-nic',
        tipo: 'especifico',
        comoAparece: 'Ilhas lisas de epitélio displásico nas criptas endocervicais.',
        peso: 'frequente',
      },
      {
        achado: 'transicao-abrupta-para-mucosa-normal',
        tipo: 'especifico',
        comoAparece: 'Limite nítido entre o epitélio displásico e o epitélio escamoso normal.',
        peso: 'frequente',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos grandes, hipercromáticos e pleomórficos; mitoses acima da camada basal.',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Cervicite crônica no estroma sob a lesão.',
        peso: 'frequente',
      },
      {
        achado: 'invasao-estromal',
        tipo: 'geral',
        comoAparece: 'Se presente, já é carcinoma invasivo — a NIC, por definição, não invade.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Metaplasia escamosa imatura',
        comoSeparar: 'Células imaturas uniformes, sem pleomorfismo nem mitoses atípicas; p16 negativo ou em mosaico.',
      },
      {
        nome: 'Atrofia (pós-menopausa)',
        comoSeparar: 'Epitélio fino de células basais uniformes, sem atipia; p16 e Ki-67 baixos.',
      },
      {
        nome: 'Carcinoma escamoso microinvasivo',
        comoSeparar: 'Línguas irregulares de células com citoplasma eosinofílico abundante no estroma, com reação desmoplásica.',
      },
    ],
    correlacaoClinica: [
      'Assintomática: detectada no rastreamento (citologia de Papanicolau ou teste de DNA-HPV) e confirmada por colposcopia com biópsia.',
      'Colposcopia: área acetobranca com mosaico e pontilhado na zona de transformação.',
      'Tratamento: excisão da zona de transformação (cirurgia de alta frequência) ou conização, com seguimento.',
      'Prevenção primária: vacina contra HPV (meninas e meninos) — a maior arma contra esta doença.',
    ],
    comparacaoComNormal: [
      'Na ectocérvice normal, o epitélio escamoso amadurece: células basais pequenas embaixo e, em cima, células achatadas com citoplasma claro (glicogênio) e núcleos pequenos.',
      'Na NIC 3, essa maturação desaparece: o epitélio inteiro parece camada basal, escuro e cheio de núcleos grandes.',
    ],
  },
  {
    id: 'leiomioma-uterino',
    nome: 'Leiomioma uterino',
    sinonimos: ['mioma uterino', 'fibroma uterino', 'fibroide'],
    nomesEmIngles: ['uterine leiomyoma', 'fibroid'],
    sistema: 'reprodutor-feminino',
    orgao: 'utero',
    prioridade: 21,
    resumo:
      'Tumor benigno de músculo liso do miométrio, bem delimitado, formado por fascículos entrelaçados de células fusiformes sem atipia — o tumor mais comum da mulher.',
    epidemiologia:
      'Até 70 % das mulheres aos 50 anos têm pelo menos um mioma; mais frequente e mais precoce em mulheres negras. Cresce na menacme e regride na menopausa. É a principal indicação de histerectomia.',
    patogenese: [
      'Uma única célula muscular lisa do miométrio sofre mutação (MED12 em cerca de 70 %, ou rearranjo de HMGA2) e passa a proliferar como clone.',
      'O clone depende de estrógeno e progesterona, que estimulam fatores de crescimento locais — por isso o mioma cresce na gestação e encolhe após a menopausa.',
      'As células produzem matriz extracelular abundante (colágeno), o que deixa o nódulo firme e branco, de superfície de corte em redemoinho.',
      'Quando o crescimento ultrapassa o suprimento de sangue, o centro sofre degeneração hialina, cística, calcificação ou, na gestação, infarto hemorrágico ("degeneração vermelha").',
    ],
    roteiro: [
      'Panorâmico: nódulo bem delimitado, mais compacto e rosado que o miométrio ao redor, com áreas pálidas e homogêneas de hialinização.',
      'Médio aumento: fascículos de células fusiformes que se cruzam em ângulos variados, cortados longitudinal e transversalmente.',
      'Grande aumento: núcleos alongados de pontas rombas ("em charuto"), sem atipia; conte mitoses.',
      'Procure ativamente os três critérios de malignidade — atipia difusa, mitoses numerosas e necrose de células tumorais — e confirme que estão ausentes.',
    ],
    achados: [
      {
        achado: 'fasciculos-de-musculo-liso',
        tipo: 'especifico',
        comoAparece: 'Fascículos entrelaçados de células musculares lisas fusiformes, de citoplasma rosa e núcleo em charuto, formando um nódulo bem delimitado.',
        peso: 'criterio',
      },
      {
        achado: 'degeneracao-hialina',
        tipo: 'geral',
        comoAparece: 'Áreas róseas, vítreas e pouco celulares no interior do nódulo, com transição gradual para os fascículos viáveis.',
        peso: 'frequente',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Deve faltar ou ser apenas focal; atipia difusa moderada a acentuada aponta para leiomiossarcoma.',
        peso: 'ocasional',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Ausente no leiomioma; necrose de células tumorais, de borda abrupta, é critério de leiomiossarcoma.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Leiomiossarcoma',
        comoSeparar: 'Pelo menos dois de três: atipia moderada a acentuada difusa, mais de 10 mitoses por 10 campos de grande aumento e necrose de células tumorais. Costuma ser único, grande, mal delimitado e de pós-menopausa.',
      },
      {
        nome: 'Adenomiose',
        comoSeparar: 'Mal delimitada, sem pseudocápsula; há glândulas e estroma endometrial no meio do miométrio hipertrofiado.',
      },
      {
        nome: 'Tumor do estroma endometrial',
        comoSeparar: 'Células pequenas, ovais, semelhantes ao estroma endometrial proliferativo, com arteríolas espiraladas e crescimento em língua no miométrio; CD10 positivo.',
      },
    ],
    correlacaoClinica: [
      'Sangramento uterino aumentado (sobretudo nos submucosos), anemia ferropriva, dor e peso pélvico, aumento do volume abdominal, compressão da bexiga e infertilidade.',
      'Diagnóstico por ultrassonografia (nódulos hipoecoicos bem delimitados) ou ressonância.',
      'Tratamento: observação nas assintomáticas; análogos de GnRH, progestágenos e ácido tranexâmico; miomectomia, embolização das artérias uterinas ou histerectomia.',
    ],
    comparacaoComNormal: [
      'O miométrio normal também é feito de feixes de músculo liso, mas organizados em camadas e entremeados por vasos, sem formar nódulo.',
      'No leiomioma, os mesmos feixes ficam mais densos, em redemoinho, e se separam do miométrio por uma borda nítida (pseudocápsula).',
    ],
  },
]
