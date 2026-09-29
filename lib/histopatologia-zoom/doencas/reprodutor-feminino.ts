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
]
