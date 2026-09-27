/**
 * Curadoria das lâminas do HistoViewer: cada espécime → órgão, com o
 * complemento em português que o distingue das lâminas irmãs.
 *
 * A chave é a pasta de imagens (`root`), a identidade real do scan. A ordem das
 * entradas define a ordem das lâminas dentro do órgão **e o sufixo do slug**
 * (`traqueia-he`, `traqueia-he-2`…): acrescente entradas no fim de cada órgão,
 * nunca no meio, para não mudar URLs já compartilhadas.
 *
 * `null` no complemento significa "o título do órgão basta".
 */
export interface Curadoria {
  orgao: string
  subtitulo: string | null
  nota?: string
}

const c = (orgao: string, subtitulo: string | null = null, nota?: string): Curadoria => ({
  orgao,
  subtitulo,
  nota,
})

export const CURADORIA: Record<string, Curadoria> = {
  // Célula e divisão
  'Chromosomes/Sample1/': c('cromossomos-metafasicos', 'Metáfase humana — preparação 1'),
  'Chromosomes/Sample2/': c('cromossomos-metafasicos', 'Metáfase humana — preparação 2'),
  'praep6-2new/': c('mitose-meristema', 'Raiz de feijão'),
  'Mitosis/Sample2/': c('mitose-meristema', 'Raiz de feijão — objetiva 100×'),
  'mmpaper/': c('escala-milimetrada', 'Papel milimetrado', 'Use para ter noção de escala: cada quadrado maior mede 1 mm.'),

  // Tecidos fundamentais
  'praep5new/': c('tendao', null),
  'praep2/': c('fibras-da-derme', 'Fibras elásticas — resorcina'),
  'praep2orc/': c('fibras-da-derme', 'Fibras elásticas — orceína'),
  'Skin/Sample7/': c('fibras-da-derme', 'Fibras colágenas — Azan', 'O colágeno fica azul intenso: compare a derme papilar (fina) com a reticular (grossa).'),
  'Adipocytes/Sample1/': c('adiposo-unilocular', null),
  'Kidney/Sample7/': c('adiposo-multilocular', 'Perirrenal — panorâmica'),
  'Kidney/Sample9/': c('adiposo-multilocular', 'Perirrenal — alta resolução'),

  // Sangue
  'Blood/Sample4/': c('sangue-periferico', 'Esfregaço'),
  'Blood/specimen1/': c('sangue-periferico', 'Esfregaço — biologia celular'),
  'praep9e/': c('sangue-periferico', 'Esfregaço — lâmina 1'),
  'praep9d/': c('sangue-periferico', 'Esfregaço — lâmina 2'),
  'praep9c/': c('sangue-periferico', 'Esfregaço — lâmina 3'),
  'praep9b/': c('sangue-periferico', 'Esfregaço — lâmina 4'),
  'praep9a/': c('sangue-periferico', 'Esfregaço — lâmina 5'),
  'Bonemarrow/Sample1/': c('medula-ossea', 'Esfregaço de aspirado'),

  // Esqueleto
  'praep11/': c('epifise-osso-longo', 'Tíbia proximal'),
  'praep23/': c('epifise-osso-longo', 'Tíbia proximal — tricrômico', 'No Masson-Goldner, osso mineralizado em verde e osteoide em vermelho-alaranjado.'),
  'praep26/': c('epifise-osso-longo', 'Úmero', 'O azul de toluidina realça a matriz cartilaginosa por metacromasia.'),
  'praep24/': c('corpo-vertebral', null),
  'praep27a/': c('ossificacao-intramembranosa', null),
  'praep28/': c('ossificacao-endocondral', 'Embrião'),

  // Músculo
  'praep12b/': c('musculo-esqueletico', null),
  'Bladder/Sample1/': c('musculo-liso', 'Camadas da bexiga'),

  // Nervoso
  'Nerve/Sample3/': c('medula-espinal', 'Panorâmica'),
  'Nerve/Sample2/': c('medula-espinal', 'Corno anterior'),
  'Nerve/Sample7/': c('medula-espinal', 'Alta resolução'),
  'praep33/': c('medula-espinal', 'Com gânglio da raiz dorsal — mielina', 'A coloração de mielina inverte o Nissl: substância branca escura, cinzenta clara.'),
  'Nerve/Sample4/': c('cortex-cerebral', null),
  'Nerve/Sample5/': c('nervo-periferico', 'Corte transversal'),
  'Nerve/Sample6/': c('nervo-periferico', 'Fibras dissociadas', 'Preparação por dissociação (pluck): as fibras isoladas mostram os nós de Ranvier.'),
  'Nerve/Sample1/': c('ganglio-autonomo', 'Parede da bexiga'),

  // Cardiovascular
  'praep15b/': c('aorta', 'Parede aórtica'),
  'praep16b/': c('aorta', 'Lâminas elásticas'),
  'Aorta/Sample4/': c('aorta', 'Lâminas elásticas — scan antigo'),
  'praep15/': c('aorta', 'Parede aórtica — scan antigo'),
  'praep15a/': c('aorta', 'Com linfonodo para-aórtico — scan antigo'),
  'praep13/': c('arteria-coronaria', null),
  'praep18a/': c('coracao', 'Alta resolução'),
  'praep18new/': c('coracao', 'Panorâmica'),
  'praep19a/': c('coracao', 'Colágeno do miocárdio', 'O picrossírius destaca em vermelho o colágeno do interstício e do esqueleto fibroso.'),

  // Linfoide
  'Lymphnode/Sample1/': c('linfonodo', 'Fibras reticulares', 'A prata revela o estroma reticular que o HE esconde.'),
  'praep61/': c('linfonodo', null),
  'praep62/': c('baco', null),
  'praep60/': c('timo', 'Indivíduo jovem'),
  'praep59/': c('tonsila', null),

  // Tegumentar
  'praep63/': c('pele-espessa', null),
  'praep64/': c('pele-fina', null),
  'praep65/': c('pele-axilar', 'Com glândulas apócrinas'),
  'Skin/Sample6/': c('cicatriz-cutanea', null, 'Colágeno fino e recente, sem anexos cutâneos na área da cicatriz.'),

  // Respiratório
  'praep92/': c('traqueia', 'Cartilagem hialina'),
  'praep92b/': c('traqueia', 'Mucosa'),
  'praep92c/': c('traqueia', 'Parede completa'),
  'praep92d/': c('traqueia', 'Parede completa — 2'),
  'praep92e/': c('traqueia', 'Células caliciformes', 'O PAS cora em magenta o muco das caliciformes e das glândulas.'),
  'praep92f/': c('traqueia', 'Células caliciformes — 2'),
  'Trachea/Sample4/': c('traqueia', 'Panorâmica'),
  'Trachea/Sample6/': c('traqueia', 'Panorâmica — 2'),
  'Trachea/Specimen1/': c('traqueia', 'Corte semifino', 'Corte semifino em resina: cílios, corpúsculos basais e caliciformes com nitidez excepcional.'),
  'Trachea/Specimen2/': c('traqueia', 'Corte semifino — 2'),
  'Trachea/Specimen3/': c('traqueia', 'Corte semifino — 3'),
  'Larynx/Sample1/': c('epiglote', 'Fibras elásticas — resorcina'),
  'Larynx/Sample2/': c('epiglote', 'Fibras elásticas — orceína'),
  'praep93a/': c('pulmao', 'Parênquima'),
  'praep93b/': c('pulmao', 'Parênquima — 2'),
  'praep93c/': c('pulmao', 'Parênquima — 3'),
  'praep93d/': c('pulmao', 'Parênquima — 4'),
  'praep93e/': c('pulmao', 'Parênquima — 5'),
  'praep93f/': c('pulmao', 'Parênquima — 6'),
  'Lunge2/': c('pulmao', 'Com pleura (mesotélio)'),
  'praep93/': c('pulmao', 'Panorâmica'),
  'praep94/': c('pulmao', 'Fibras elásticas'),

  // Cavidade oral
  'praep69/': c('labio', 'Preparação 1'),
  'praep69b/': c('labio', 'Preparação 2'),
  'dental/51-15/': c('labio', 'Coleção de odontologia'),
  'Tongue/Sample1/': c('lingua', 'Mastócitos', 'Os grânulos dos mastócitos ficam violeta-avermelhados: metacromasia do azul de toluidina.'),
  'praep70-20x/': c('lingua', null),
  'praep71/': c('lingua', 'Com papila valada'),
  'dental/55-5/': c('lingua', 'Corte transversal'),
  'dental/56-6/': c('papilas-linguais', 'Papila valada'),
  'dental/57-6/': c('papilas-linguais', 'Papila foliada'),
  'dental/53-1/': c('gengiva', null),
  'dental/54-14/': c('mucosa-palatina', null),
  'dental/63-11/': c('periodonto', 'Azan'),
  'dental/64-13/': c('periodonto', null),
  'dental/65-10/': c('germe-dentario', 'Campânula — molar decíduo humano'),
  'dental/66-2/': c('germe-dentario', 'Campânula — incisivo decíduo humano'),
  'dental/67-14/': c('germe-dentario', 'Germe dentário'),
  'dental/68-8/': c('germe-dentario', 'Amelogênese — fase secretora'),
  'dental/69-2/': c('germe-dentario', 'Amelogênese — fase de maturação'),

  // Digestório
  'praep77/': c('esofago', null),
  'praep78/': c('juncao-esofagogastrica', null),
  'praep79/': c('estomago-corpo-fundo', null),
  'praep80/': c('estomago-piloro', null),
  'praep81/': c('duodeno', 'Com glândulas de Brunner'),
  'praep82/': c('jejuno', null),
  'praep83/': c('colon', 'Alta resolução'),
  'praep83b/': c('colon', 'Panorâmica'),
  'praep85/': c('apendice', null),
  'praep84/': c('canal-anal', null),

  // Glândulas anexas
  'praep73/': c('parotida', null),
  'Glands/Sample6/': c('parotida', 'Alta resolução'),
  'Glands/Sample2/': c('parotida', 'Panorâmica'),
  'dental/59-13/': c('parotida', 'Azan'),
  'praep74/': c('submandibular', null),
  'praep74b/': c('submandibular', 'Lâmina 2'),
  'Glands/Sample5/': c('submandibular', 'Lâmina 3'),
  'dental/60-14/': c('submandibular', 'Coleção de odontologia'),
  'praep75b/': c('sublingual', null),
  'praep75/': c('sublingual', 'Panorâmica'),
  'Glands/Sample4/': c('sublingual', 'Alta resolução'),
  'praep86/': c('pancreas', 'Exócrino e endócrino'),
  'Pancreas/Sample10/': c('pancreas', 'Alta resolução'),
  'praep7-1new/': c('pancreas', 'Ácinos e ilhotas'),
  'Pancreas/Sample1/': c('pancreas', 'Ácinos e ilhotas — 2'),
  'Pancreas/Sample11/': c('pancreas', 'Corte semifino', 'Corte semifino em resina: grânulos de zimogênio visíveis um a um no ápice das células acinares.'),
  'Pancreas/Sample8/': c('pancreas', 'Autorradiografia — chase 0 min', 'Logo após o pulso de aminoácido marcado, os grãos de prata ficam sobre o RER basal.'),
  'Pancreas/Sample7/': c('pancreas', 'Autorradiografia — chase 117 min', 'Duas horas depois, os grãos migraram para os grânulos de zimogênio apicais: é a rota secretora.'),
  'Pancreas/Sample6/': c('pancreas', 'Autorradiografia — chase 117 min (2)'),
  'praep87/': c('pancreas', 'Insulina nas células β', 'Imuno-histoquímica: só as células β das ilhotas ficam marrons.'),
  'praep3-1/': c('figado', null),
  'praep3-2/': c('figado', 'Colágeno portal', 'No van Gieson, o colágeno dos espaços porta fica vermelho e os hepatócitos amarelados.'),
  'praep6-1new/': c('figado', 'Núcleos em destaque', 'A hematoxilina férrica realça núcleos — procure hepatócitos binucleados.'),
  'Liver/Sample8/': c('figado', 'Núcleos em destaque — 2'),
  'Liver/Sample9/': c('figado', 'Corte semifino'),
  'Liver/Sample5/': c('figado', 'Sem coloração', 'O corte sem corante mostra por que a coloração existe: o tecido é quase transparente.'),
  'praep88/': c('figado', 'Células de Kupffer com nanquim', 'Nanquim injetado na veia porta foi fagocitado pelas células de Kupffer — os pontos pretos nos sinusoides.'),
  'praep90b/': c('vesicula-biliar', null),
  'praep90/': c('vesicula-biliar', 'Panorâmica'),
  'Galdeep/Sample2/': c('vesicula-biliar', 'Alta resolução'),
  'Galdeep/Sample1/': c('vesicula-biliar', 'Panorâmica — 2'),

  // Urinário
  'praep97/': c('rim', null),
  'praep96/': c('rim', 'Panorâmica'),
  'Kidney/Sample4/': c('rim', 'Corte semifino'),
  'Kidney/Sample5/': c('rim', 'Fosfatase ácida', 'Histoquímica enzimática: lisossomos dos túbulos proximais marcados.'),
  'Kidney/Sample6/': c('rim', 'Citocromo-oxidase', 'Histoquímica enzimática: túbulos ricos em mitocôndrias escurecem mais.'),
  'praep98/': c('ureter', null),
  'praep5-3/': c('bexiga', null),
  'Overgangsep/Sample1/': c('bexiga', 'Urotélio'),
  'praep100/': c('uretra', null),

  // Endócrino
  'praep34/': c('hipofise', null),
  'praep35/': c('hipofise', 'Tricrômico de Mallory', 'No Mallory, acidófilas ficam vermelho-alaranjadas e basófilas azuis.'),
  'praep36/': c('tireoide', null),
  'praep37b/': c('paratireoide', null),
  'praep37/': c('paratireoide', 'Scan antigo'),
  'praep38/': c('adrenal', null),

  // Reprodutor masculino
  'praep47b/': c('testiculo', null),
  'praep47/': c('testiculo', 'Panorâmica'),
  'praep48/': c('testiculo', 'Espermatogênese', 'A hematoxilina férrica contrasta as fases da espermatogênese.'),
  'praep50/': c('ducto-deferente', null),
  'praep52b/': c('prostata', null),
  'praep52/': c('prostata', 'Panorâmica'),
  'praep53/': c('penis', null),

  // Reprodutor feminino
  'praep40/': c('ovario', 'Folículos'),
  'praep40b/': c('ovario', 'Folículos — 2'),
  'praep40c/': c('ovario', 'Folículos — 3'),
  'praep41c/': c('ovario', 'Corpo lúteo, corpos albicans e atresia'),
  'praep41/': c('ovario', 'Corpo lúteo — panorâmica'),
  'praep41b/': c('ovario', 'Corpo lúteo — panorâmica 2'),
  'praep42/': c('tuba-uterina', 'Ampola'),
  'praep43b/': c('tuba-uterina', 'Istmo'),
  'praep44b/': c('utero', 'Fase proliferativa tardia'),
  'praep44/': c('utero', 'Fase proliferativa tardia — scan antigo'),
  'praep45/': c('utero', 'Fase secretora (curetagem)'),
  'praep55/': c('utero', 'Gravídico'),
  'praep46c/': c('colo-uterino', null),
  'praep46/': c('colo-uterino', 'Panorâmica'),
  'praep66/': c('glandula-mamaria', 'Inativa'),
  'praep67/': c('glandula-mamaria', 'Gestação'),
  'praep68/': c('glandula-mamaria', 'Lactação'),
  'praepsma/': c('glandula-mamaria', 'Inativa — células mioepiteliais (SMA)', 'Imuno para actina de músculo liso: a camada mioepitelial em volta de ductos e ácinos fica marrom.'),

  // Embriologia
  'Blastocyst/Sample1/': c('blastocisto', null),
  'praep56/': c('placenta', 'Corte transversal'),
  'praep56b/': c('placenta', 'Corte transversal — 2'),
  'praep57/': c('cordao-umbilical', null),
  'praep58/': c('membranas-fetais', null),

  // Sentidos
  'praep91/': c('olho', null),
  'Cornea/Sample1/': c('cornea', null),
  'praep95/': c('nervo-optico', null),
  'praep76/': c('orelha-interna', 'Cóclea'),

  // ─── GTEx (NIH) — lâminas humanas em H&E, scan 20× ────────────────────────
  // Chave: tissueSampleId. Acrescente no fim de cada órgão, como acima.
  'GTEX-ZUA1-2926': c('cerebelo', 'Humano', 'Folhas cerebelares com as três camadas do córtex e substância branca central; células de Purkinje bem preservadas.'),
  'GTEX-1128S-2726': c('cortex-cerebral', 'Humano — HE', 'Em HE o córtex mostra a citoarquitetura por núcleos; os prolongamentos, que a prata revela, ficam invisíveis.'),
  'GTEX-145MO-3126': c('hipofise', 'Humana — adeno e neuro-hipófise'),
  'GTEX-ZQUD-1326': c('arteria-muscular', 'Artéria tibial (humana)'),
  'GTEX-ZT9X-2126': c('nervo-periferico', 'Nervo tibial (humano) — HE', 'Em HE a mielina aparece como espaço claro e rendado em volta do axônio (a gordura foi extraída no processamento).'),
  'GTEX-ZYFG-2026': c('ileo', 'Humano — com placas de Peyer'),
  'GTEX-RU1J-1426': c('vagina', 'Humana'),
  'GTEX-Y3I4-1926': c('glandula-salivar-menor', 'Humana — com mucosa oral'),
  'GTEX-R55E-2026': c('rim', 'Medula renal (humana)', 'Um fragmento é quase só medula (alças de Henle, ductos coletores, vasos retos); o outro mostra a junção corticomedular.'),
  'GTEX-1GMR3-0826': c('adiposo-unilocular', 'Omento (humano)'),
  'GTEX-WEY5-0426': c('coracao', 'Ventrículo esquerdo (humano)'),
  'GTEX-Y114-2526': c('musculo-esqueletico', 'Humano — HE'),
  'GTEX-PSDG-0226': c('pele-fina', 'Perna exposta ao sol (humana)', 'Pele de área exposta ao sol: procure na derme superficial a elastose solar — fibras elásticas degeneradas, basofílicas e grumosas.'),

  // ─── Fotomicrografias avulsas (Commons, HPA) — campo único, não lâmina inteira
  // Chave: `root` de acervo-imagens.json.
  'commons-pineal-baixo': c('glandula-pineal', 'Campo único — pequeno aumento', 'Fotomicrografia de um campo, não a lâmina inteira: parênquima lobulado e muito celular.'),
  'commons-pineal-alto': c('glandula-pineal', 'Campo único — grande aumento', 'Fotomicrografia de um campo: cápsula de pia-máter no alto e pinealócitos logo abaixo.'),
  'commons-vesicula-seminal-baixo': c('vesicula-seminal', 'Humana — campo único, pequeno aumento', 'Peça de prostatectomia. Fotomicrografia de um campo: a luz inteira com as pregas em labirinto e a parede muscular.'),
  'commons-vesicula-seminal-medio': c('vesicula-seminal', 'Humana — campo único, médio aumento', 'Fotomicrografia de um campo: pregas da mucosa e epitélio sobre a parede muscular.'),
  'commons-osso-compacto-100': c('osso-compacto', 'Humano — desgaste, 100×', 'Corte desgastado de osso humano, sem coloração. Fotomicrografia de um campo.'),
  'commons-osso-compacto-200': c('osso-compacto', 'Humano — desgaste, 200×', 'Corte desgastado de osso humano, sem coloração: lacunas e canalículos em volta dos canais de Havers.'),
  'commons-fibrocartilagem-40': c('fibrocartilagem', 'Campo único — 40×', 'Fotomicrografia de um campo.'),
  'commons-fibrocartilagem-400': c('fibrocartilagem', 'Campo único — 400×', 'Fotomicrografia de um campo: condrócitos enfileirados entre feixes de colágeno.'),
  'commons-areolar-100': c('conjuntivo-frouxo', 'Distensão — 100×', 'Membrana distendida, não corte. Fotomicrografia de um campo.'),
  'commons-areolar-200': c('conjuntivo-frouxo', 'Distensão — 200×', 'Membrana distendida, não corte: fibras colágenas e elásticas em todo o comprimento.'),
  'commons-discos-intercalares': c('coracao', 'Discos intercalares — hematoxilina férrica', 'Corte longitudinal de miocárdio em hematoxilina férrica, que realça as estrias e os discos intercalares. Fotomicrografia de um campo.'),
  'hpa-hipocampo-giro-denteado': c('hipocampo', 'Humano — giro denteado (núcleo de microarranjo)', 'Núcleo de 1 mm de um microarranjo de tecido (Human Protein Atlas). Só a contracoloração de hematoxilina: os núcleos contam a arquitetura, o citoplasma quase não se vê.'),
}
