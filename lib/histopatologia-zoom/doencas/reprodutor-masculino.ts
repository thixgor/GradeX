import type { DoencaZoom } from '../tipos'

/** Sistema reprodutor masculino. */
export const DOENCAS_REPRODUTOR_MASCULINO: DoencaZoom[] = [
  {
    id: 'hiperplasia-prostatica-benigna',
    nome: 'Hiperplasia prostática benigna',
    sinonimos: ['HPB', 'hiperplasia nodular da próstata', 'adenoma de próstata (termo antigo)'],
    nomesEmIngles: ['benign prostatic hyperplasia', 'nodular hyperplasia of the prostate'],
    sistema: 'reprodutor-masculino',
    orgao: 'prostata',
    prioridade: 1,
    resumo:
      'Aumento benigno da próstata por nódulos de glândulas e de estroma fibromuscular na zona de transição, em volta da uretra; as glândulas mantêm a dupla camada epitelial e não há atipia.',
    epidemiologia:
      'Extremamente comum com a idade: presente em cerca de 50 % dos homens aos 50 anos e 90 % aos 80. Causa sintomas urinários em boa parte deles.',
    patogenese: [
      'A testosterona é convertida em di-hidrotestosterona (DHT) pela 5α-redutase tipo 2 das células estromais.',
      'A DHT estimula as células estromais e epiteliais a produzirem fatores de crescimento (FGF, TGF-β): proliferação e menor apoptose.',
      'O crescimento é nodular e começa na zona de transição e periuretral — por isso comprime a uretra, ao contrário do carcinoma, que nasce na zona periférica.',
      'Os nódulos misturam glândulas (algumas dilatadas por obstrução) e estroma de músculo liso, cujo tônus (receptores α1) também aperta a uretra.',
    ],
    roteiro: [
      'Panorâmico: nódulos arredondados de tamanhos variados, alguns com muitas glândulas (dilatadas, "renda"), outros quase só de estroma.',
      'Médio aumento: glândulas grandes, de contorno ondulado, com dobras papilares para a luz e secreção rosa; algumas dilatadas em cistos.',
      'Grande aumento: confirme a dupla camada — células colunares claras por dentro, células basais achatadas por fora — e a ausência de nucléolos grandes.',
      'Estroma: feixes de músculo liso e fibroblastos entre as glândulas.',
      'Procure focos de glândulas pequenas, de camada única e núcleos com nucléolo: seria carcinoma incidental.',
    ],
    achados: [
      {
        achado: 'hiperplasia-glandular',
        tipo: 'especifico',
        comoAparece: 'Nódulos de glândulas e de estroma fibromuscular, bem delimitados.',
        peso: 'criterio',
      },
      {
        achado: 'glandulas-com-dupla-camada',
        tipo: 'especifico',
        comoAparece: 'Glândulas com células luminais colunares e camada basal preservada, sem atipia.',
        peso: 'criterio',
      },
      {
        achado: 'dilatacao-cistica-glandular',
        tipo: 'geral',
        comoAparece: 'Glândulas dilatadas com secreção eosinofílica.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Prostatite crônica focal, frequente e sem significado maior.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Adenocarcinoma da próstata',
        comoSeparar:
          'Glândulas pequenas, aglomeradas e infiltrativas, com UMA camada (sem células basais), núcleos aumentados com nucléolos evidentes; nasce na zona periférica.',
      },
      {
        nome: 'Atrofia prostática',
        comoSeparar: 'Glândulas pequenas de citoplasma escasso, mas com células basais e sem nucléolos; comum em idosos.',
      },
      {
        nome: 'Neoplasia intraepitelial prostática de alto grau',
        comoSeparar: 'Glândulas de arquitetura benigna revestidas por células com nucléolos proeminentes, mas com camada basal (ao menos parcial).',
      },
    ],
    correlacaoClinica: [
      'Sintomas do trato urinário inferior: jato fraco, hesitação, gotejamento, noctúria, urgência; pode evoluir para retenção urinária, infecções e cálculos vesicais.',
      'Toque retal: próstata aumentada, lisa, elástica, simétrica (o carcinoma é endurecido e nodular).',
      'O PSA pode subir discretamente (volume); a HPB não é precursora de carcinoma.',
      'Tratamento: α-bloqueadores (relaxam o músculo liso), inibidores da 5α-redutase (finasterida — reduzem o volume), ressecção transuretral.',
    ],
    comparacaoComNormal: [
      'Na próstata normal, as glândulas túbulo-alveolares, com dupla camada, ficam dispersas num estroma fibromuscular, sem formar nódulos.',
      'Na HPB, as mesmas glândulas e o mesmo estroma formam nódulos, e muitas glândulas se dilatam — o tecido é o mesmo, só que em excesso e organizado em bolas.',
    ],
  },
  {
    id: 'seminoma',
    nome: 'Seminoma',
    sinonimos: ['seminoma clássico', 'tumor de células germinativas seminomatoso'],
    nomesEmIngles: ['seminoma'],
    sistema: 'reprodutor-masculino',
    orgao: 'testiculo',
    prioridade: 2,
    resumo:
      'Tumor de células germinativas mais comum do testículo: lençóis de células grandes e claras com nucléolo evidente, divididos por septos fibrosos com linfócitos.',
    epidemiologia: 'Homens de 25–45 anos; fatores de risco: criptorquidia (inclusive o testículo abdominal), tumor prévio no outro testículo, disgenesia gonadal, história familiar. Marcadores séricos em geral normais (hCG levemente elevado em alguns).',
    patogenese: [
      'Gonócitos fetais que não amadurecem permanecem nos túbulos como neoplasia de células germinativas in situ.',
      'Após a puberdade, essas células proliferam e invadem, formando o seminoma; o isocromossomo 12p (ganho de 12p) é característico.',
      'O tumor é muito imunogênico (linfócitos, granulomas) e muito sensível a radiação e platina.',
    ],
    roteiro: [
      'Panorâmico: massa homogênea que substitui os túbulos seminíferos; ao redor, testículo residual.',
      'Médio aumento: lençóis e lóbulos de células uniformes, septos com linfócitos, às vezes granulomas.',
      'Grande aumento: células grandes, citoplasma claro, membranas nítidas e núcleo com nucléolo; procure neoplasia in situ nos túbulos vizinhos.',
    ],
    achados: [
      {
        achado: 'celulas-germinativas-neoplasicas',
        tipo: 'especifico',
        comoAparece: 'Lençóis de células grandes, claras, com nucléolo proeminente.',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Linfócitos nos septos fibrosos.',
        peso: 'frequente',
      },
      {
        achado: 'granuloma-epitelioide',
        tipo: 'geral',
        comoAparece: 'Reação granulomatosa no tumor.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Carcinoma embrionário',
        comoSeparar: 'Células mais pleomórficas, sobrepostas, em glândulas e papilas, com necrose; CD30+ e OCT3/4+.',
      },
      {
        nome: 'Linfoma testicular',
        comoSeparar: 'Homens idosos, infiltração entre túbulos preservados, CD45+.',
      },
    ],
    correlacaoClinica: [
      'Aumento indolor do testículo; ultrassom com nódulo hipoecoico homogêneo. Marcadores (AFP, hCG, LDH) antes da cirurgia.',
      'Orquiectomia radical por via inguinal; vigilância, radioterapia ou quimioterapia (carboplatina) conforme o estádio. Cura > 95 %.',
    ],
    comparacaoComNormal: [
      'No testículo normal, túbulos seminíferos com espermatogênese em camadas, separados por interstício com células de Leydig.',
      'No seminoma, os túbulos desaparecem e são substituídos por lençóis de células grandes e claras.',
    ],
  },
]
