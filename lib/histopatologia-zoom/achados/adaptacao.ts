import type { AchadoPatologico } from '../tipos'

/** Adaptações celulares: metaplasia, atrofia, hiperplasia, hipertrofia. */
export const ACHADOS_ADAPTACAO: AchadoPatologico[] = [
  {
    id: 'metaplasia-intestinal',
    nome: 'Metaplasia intestinal',
    sinonimos: ['metaplasia intestinal gástrica', 'metaplasia colunar com caliciformes'],
    categoria: 'adaptacao',
    resumo:
      'Epitélio do tipo intestinal — células caliciformes em "cálice", às vezes células de Paneth e borda em escova — substituindo o epitélio normal do estômago (ou do esôfago, no Barrett).',
    comoReconhecer: [
      'No médio aumento: entre as glândulas gástricas de citoplasma claro e uniforme, aparecem glândulas com vacúolos redondos e brancos de muco (células caliciformes) espaçados — como no intestino.',
      'No grande aumento: caliciformes com o muco "empurrando" o núcleo para a base; células de Paneth com grânulos vermelho-vivos na base das criptas (metaplasia completa).',
      'O epitélio foveolar gástrico normal também é mucoso, mas o muco ocupa o topo de TODAS as células de modo uniforme (em "capuz"), sem vacúolos isolados.',
    ],
    mecanismo: [
      'Agressão crônica (H. pylori, refluxo biliar, ácido no esôfago) faz as células-tronco trocarem de programa de diferenciação — ativação de CDX2, o gene "mestre" do intestino.',
      'O novo epitélio é mais resistente ao agente, mas é também terreno para displasia.',
    ],
    significado: [
      'É um passo da cascata de Correa (gastrite crônica → atrofia → metaplasia intestinal → displasia → adenocarcinoma gástrico do tipo intestinal).',
      'No esôfago, metaplasia intestinal define o esôfago de Barrett e o risco de adenocarcinoma esofágico.',
      'Metaplasia é reversível em princípio, mas a metaplasia intestinal extensa raramente regride mesmo após erradicar o H. pylori.',
    ],
    ondeOcorre: ['Gastrite crônica por H. pylori e gastrite autoimune', 'Esôfago de Barrett', 'Bordas de úlceras gástricas crônicas'],
    armadilhas: [
      'Células "pseudocaliciformes" (foveolares distendidas por muco) não têm o formato de cálice nítido; em dúvida, o Alcian blue pH 2,5 cora a mucina intestinal (ácida) de azul.',
    ],
  },
  {
    id: 'hiperplasia-glandular',
    nome: 'Hiperplasia nodular glandular e estromal',
    sinonimos: ['hiperplasia', 'nódulos hiperplásicos'],
    categoria: 'adaptacao',
    resumo:
      'Aumento do número de células de um órgão, formando nódulos de glândulas e/ou estroma que mantêm a arquitetura e a citologia normais.',
    comoReconhecer: [
      'No pequeno aumento: nódulos arredondados, de tamanhos variados, que comprimem o tecido ao redor.',
      'No grande aumento: as células são iguais às normais — sem atipia —, apenas em maior número.',
    ],
    mecanismo: ['Estímulo hormonal ou de fatores de crescimento persistente leva as células a proliferar; se o estímulo cessa, a hiperplasia regride (diferente da neoplasia).'],
    significado: ['Benigna; causa sintomas por volume (obstrução urinária na próstata, sangramento no endométrio).'],
    ondeOcorre: ['Hiperplasia prostática benigna', 'Hiperplasia endometrial', 'Bócio nodular', 'Hiperplasia da mama'],
    armadilhas: ['Hiperplasia endometrial com atipia é precursora de carcinoma: sempre avalie a citologia.'],
  },
  {
    id: 'metaplasia-oncocitica',
    nome: 'Metaplasia oncocítica (células de Hürthle)',
    sinonimos: ['células de Hürthle', 'oncócitos', 'células de Askanazy'],
    categoria: 'adaptacao',
    resumo:
      'Células foliculares da tireoide aumentadas, de citoplasma eosinofílico abundante e granular e núcleo grande com nucléolo — cheias de mitocôndrias.',
    comoReconhecer: [
      'No médio aumento: folículos pequenos revestidos por células grandes e rosa-intensas, diferentes do epitélio cúbico baixo normal.',
      'No grande aumento: citoplasma granular fino (as mitocôndrias), núcleo redondo, às vezes com nucléolo evidente.',
    ],
    mecanismo: ['Estresse celular crônico (inflamação autoimune, envelhecimento) induz proliferação de mitocôndrias, muitas disfuncionais.'],
    significado: ['Achado característico da tireoidite de Hashimoto; também forma as neoplasias oncocíticas (adenoma e carcinoma de células de Hürthle).'],
    ondeOcorre: ['Tireoidite de Hashimoto', 'Bócio nodular', 'Neoplasias oncocíticas da tireoide, glândulas salivares (tumor de Warthin) e rim (oncocitoma)'],
    armadilhas: ['Em tireoidite, a atipia nuclear das células de Hürthle é reativa — não confundir com carcinoma papilífero, que tem núcleos em vidro fosco, fendas e pseudoinclusões.'],
  },
  {
    id: 'atrofia-folicular',
    nome: 'Atrofia folicular tireoidiana',
    sinonimos: ['atrofia de folículos', 'folículos pequenos com pouco coloide'],
    categoria: 'adaptacao',
    resumo: 'Folículos pequenos, com pouco coloide ou colapsados, espalhados entre o infiltrado inflamatório — perda de parênquima funcionante.',
    comoReconhecer: ['Folículos menores e mais escassos que o normal, de luz estreita, com coloide escasso ou ausente.'],
    mecanismo: ['A destruição imune (linfócitos T citotóxicos, anticorpos anti-TPO) mata as células foliculares; o que resta encolhe e produz menos hormônio.'],
    significado: ['Base morfológica do hipotireoidismo: menos folículos, menos coloide, menos tiroxina.'],
    ondeOcorre: ['Tireoidite de Hashimoto', 'Tireoidite pós-radiação', 'Envelhecimento'],
    armadilhas: ['Tireoide hiperestimulada (Graves) também tem pouco coloide, mas com epitélio alto e hiperplásico, não atrófico.'],
  },
  {
    id: 'glandulas-com-dupla-camada',
    nome: 'Glândulas com dupla camada epitelial preservada',
    sinonimos: ['células basais preservadas', 'camada basal'],
    categoria: 'arquitetura',
    resumo:
      'Glândulas revestidas por duas camadas — células colunares luminais, claras e secretoras, e uma fileira de células basais achatadas por fora —, o sinal mais importante de benignidade na próstata.',
    comoReconhecer: [
      'No grande aumento: por fora das células colunares, uma segunda fileira de núcleos escuros, achatados, paralelos à membrana basal.',
      'As glândulas benignas são grandes, com contorno ondulado e dobras papilares para a luz.',
    ],
    mecanismo: ['Na hiperplasia, as unidades glandulares normais se multiplicam sem perder sua organização; as células basais permanecem.'],
    significado: [
      'Separa glândulas benignas (hiperplasia, atrofia) do adenocarcinoma, que tem uma só camada (perdeu as células basais).',
      'Em casos difíceis, a imuno-histoquímica para células basais (p63, citoqueratina de alto peso) confirma.',
    ],
    ondeOcorre: ['Hiperplasia prostática benigna', 'Próstata normal', 'Adenose e atrofia prostática'],
    armadilhas: ['Células basais podem ser difíceis de ver em glândulas atróficas ou cortadas tangencialmente.'],
  },
  {
    id: 'dilatacao-cistica-glandular',
    nome: 'Dilatação cística das glândulas',
    sinonimos: ['glândulas císticas', 'cistos de retenção'],
    categoria: 'arquitetura',
    resumo: 'Glândulas muito dilatadas, com epitélio achatado e secreção rosa na luz, formando espaços arredondados vistos a olho nu.',
    comoReconhecer: ['No pequeno aumento: buracos redondos, grandes, com conteúdo rosa-pálido, dentro dos nódulos.'],
    mecanismo: ['Obstrução da drenagem pelos nódulos vizinhos faz a secreção se acumular e distender a glândula.'],
    significado: ['Comum na hiperplasia prostática; benigno.'],
    ondeOcorre: ['Hiperplasia prostática benigna', 'Hiperplasia endometrial simples', 'Doença fibrocística da mama'],
    armadilhas: ['Não confundir com neoplasia cística: o epitélio não tem atipia.'],
  },
  {
    id: 'tireoidizacao-tubular',
    nome: 'Atrofia tubular com tireoidização',
    sinonimos: ['tireoidização', 'túbulos com cilindros coloides', 'atrofia tubular'],
    categoria: 'adaptacao',
    resumo:
      'Túbulos renais atróficos e dilatados, revestidos por epitélio achatado e cheios de cilindros eosinofílicos homogêneos — o conjunto lembra folículos tireoidianos com coloide.',
    comoReconhecer: [
      'No pequeno aumento: grupos de estruturas redondas cheias de material rosa, espalhadas no interstício inflamado e fibroso.',
      'No grande aumento: epitélio tubular baixo e achatado; cilindro hialino (proteína de Tamm-Horsfall) homogêneo na luz.',
    ],
    mecanismo: [
      'Inflamação e fibrose do interstício destroem néfrons de modo irregular; os túbulos obstruídos perdem epitélio e acumulam proteína, que se condensa em cilindros.',
    ],
    significado: [
      'Sinal de doença tubulointersticial crônica — muito típico da pielonefrite crônica e da nefropatia de refluxo.',
    ],
    ondeOcorre: ['Pielonefrite crônica', 'Nefropatia obstrutiva e de refluxo', 'Estágio final de várias nefropatias'],
    armadilhas: ['Não confundir com tecido tireoidiano ectópico nem com cilindros de mieloma (fraturados, com reação de células gigantes).'],
  },
  {
    id: 'fibrose-intersticial',
    nome: 'Fibrose intersticial',
    sinonimos: ['fibrose tubulointersticial'],
    categoria: 'reparo',
    resumo:
      'Colágeno depositado entre os túbulos (ou entre as células de qualquer parênquima), afastando-os e substituindo néfrons perdidos.',
    comoReconhecer: [
      'Espaços amplos entre túbulos, preenchidos por tecido conjuntivo rosa-pálido com fibroblastos e células inflamatórias crônicas.',
      'O tricrômio de Masson cora o colágeno em azul/verde e permite quantificá-la.',
    ],
    mecanismo: ['Lesão tubular e inflamação crônica ativam fibroblastos e miofibroblastos intersticiais (TGF-β).'],
    significado: ['É o melhor preditor histológico da perda de função renal, qualquer que seja a doença de base.'],
    ondeOcorre: ['Pielonefrite crônica', 'Nefropatia diabética e hipertensiva avançada', 'Rejeição crônica de transplante', 'Toxicidade por inibidores de calcineurina'],
    armadilhas: ['Edema intersticial também afasta os túbulos, mas sem colágeno.'],
  },
  {
    id: 'espessamento-arterial',
    nome: 'Espessamento da parede arterial (arteriosclerose)',
    sinonimos: ['arteriosclerose', 'fibrose intimal', 'arteriolosclerose hialina', 'esclerose arterial'],
    categoria: 'circulatorio',
    resumo: 'Artérias e arteríolas com parede espessada por fibrose da íntima, hialinização ou hiperplasia muscular, e luz estreitada.',
    comoReconhecer: [
      'Parede desproporcionalmente espessa em relação à luz, com íntima fibrosa em camadas ("em casca de cebola" na hipertensão maligna) ou material hialino rosa homogêneo (arteriolosclerose hialina).',
    ],
    mecanismo: ['Hipertensão, diabetes e envelhecimento lesam o endotélio; plasma extravasa na parede (hialinose) e células musculares proliferam e produzem matriz.'],
    significado: ['Reduz o fluxo ao parênquima: isquemia crônica, atrofia e fibrose — contribui para a perda de néfrons.'],
    ondeOcorre: ['Rim de hipertensos e diabéticos', 'Envelhecimento', 'Nefropatias crônicas'],
    armadilhas: ['Artérias cortadas obliquamente parecem mais espessas.'],
  },
  {
    id: 'nodulos-regenerativos',
    nome: 'Nódulos de regeneração hepatocitária',
    sinonimos: ['nódulos regenerativos', 'nódulos cirróticos', 'micronódulos', 'macronódulos'],
    categoria: 'arquitetura',
    resumo:
      'Ilhas arredondadas de hepatócitos, sem a organização em lóbulo (sem veia centrolobular no centro nem espaços-porta regulares), cercadas por septos fibrosos — a unidade da cirrose.',
    comoReconhecer: [
      'No pequeno aumento: o fígado vira um "calçamento" de bolas rosadas separadas por faixas pálidas de colágeno.',
      'Micronodular: nódulos < 3 mm, de tamanho uniforme (álcool, hemocromatose); macronodular: nódulos maiores e variados (hepatites virais).',
      'Dentro do nódulo, trabéculas de hepatócitos às vezes com duas células de espessura (regeneração) e sem veia central.',
    ],
    mecanismo: [
      'Necrose hepatocitária repetida ativa as células estreladas, que depositam colágeno e formam septos ligando espaços-porta e veias centrais.',
      'Os hepatócitos sobreviventes proliferam dentro dos compartimentos isolados pelos septos, formando nódulos sem a arquitetura vascular normal.',
    ],
    significado: [
      'Nódulos regenerativos + fibrose em septos que envolvem todo o fígado = cirrose, estágio final comum de doenças hepáticas crônicas.',
      'A arquitetura desorganizada desvia o sangue dos sinusoides: hipertensão portal e insuficiência hepática; é terreno para carcinoma hepatocelular.',
    ],
    ondeOcorre: ['Cirrose de qualquer causa (álcool, hepatites B e C, MASLD, hemocromatose, doenças biliares)'],
    armadilhas: [
      'Hiperplasia nodular focal e hiperplasia nodular regenerativa formam nódulos sem fibrose em septos completos.',
      'Em biópsia por agulha, fragmentos arredondados de parênquima podem ser o único sinal: o tricrômio e a reticulina ajudam.',
    ],
  },
  {
    id: 'reacao-ductular',
    nome: 'Reação ductular',
    sinonimos: ['proliferação ductular', 'dúctulos proliferados'],
    categoria: 'reparo',
    resumo:
      'Dúctulos biliares pequenos, curvos, de luz estreita e epitélio cúbico, multiplicados na borda dos espaços-porta e dentro dos septos fibrosos, geralmente com neutrófilos e edema ao redor.',
    comoReconhecer: [
      'Estruturas tubulares pequenas e irregulares, sem luz evidente ou com luz fina, espalhadas no estroma fibroso da interface.',
      'Diferente do ducto biliar interlobular normal: um ducto único, redondo, acompanhando a artéria no espaço-porta.',
    ],
    mecanismo: [
      'Quando os hepatócitos não conseguem se regenerar ou há obstrução biliar, as células progenitoras (canais de Hering) proliferam, formando dúctulos.',
      'Os dúctulos secretam citocinas que estimulam a fibrose.',
    ],
    significado: ['Acompanha lesão hepática crônica e obstrução biliar; sua intensidade se correlaciona com a progressão da fibrose.'],
    ondeOcorre: ['Cirrose', 'Obstrução biliar extra-hepática', 'Hepatites crônicas avançadas', 'Colangite biliar primária'],
    armadilhas: ['Não confundir com adenocarcinoma (colangiocarcinoma): os dúctulos reativos são pequenos, uniformes, sem atipia e sem invasão.'],
  },
  {
    id: 'atrofia-acinar-com-ilhotas-preservadas',
    nome: 'Atrofia acinar com ilhotas relativamente preservadas',
    sinonimos: ['agregação de ilhotas', 'lóbulos residuais', 'atrofia acinar'],
    categoria: 'adaptacao',
    resumo:
      'Na fibrose do pâncreas, os ácinos desaparecem primeiro; sobram lóbulos pequenos e ilhotas de Langerhans, que ficam agrupadas e desproporcionalmente evidentes.',
    comoReconhecer: [
      'Pequenas ilhas de tecido pancreático isoladas em fibrose densa.',
      'Dentro delas, ácinos com grânulos de zimogênio vermelhos e, no meio, uma ilhota pálida de células endócrinas de citoplasma claro.',
    ],
    mecanismo: ['Os ácinos sofrem mais com a obstrução ductal, a inflamação e a isquemia; as ilhotas resistem mais tempo, mas acabam também destruídas.'],
    significado: [
      'Marca a pancreatite crônica e mostra que a arquitetura lobular é preservada — argumento importante contra adenocarcinoma.',
      'Explica a sequência clínica: primeiro insuficiência exócrina (esteatorreia), depois diabetes.',
    ],
    ondeOcorre: ['Pancreatite crônica', 'Fibrose pancreática a montante de obstrução tumoral', 'Fibrose cística'],
    armadilhas: ['Agregados de ilhotas podem ser confundidos com tumor neuroendócrino; na pancreatite estão dentro de lóbulos residuais, com ácinos em volta.'],
  },
  {
    id: 'glomeruloesclerose-nodular',
    nome: 'Glomeruloesclerose nodular (nódulos de Kimmelstiel-Wilson)',
    sinonimos: ['nódulos de Kimmelstiel-Wilson', 'esclerose mesangial nodular', 'glomeruloesclerose diabética'],
    categoria: 'deposito',
    resumo:
      'Nódulos redondos, acelulares e eosinofílicos de matriz mesangial na periferia dos lóbulos glomerulares, com núcleos empurrados para a borda e capilares comprimidos ao redor.',
    comoReconhecer: [
      'No médio aumento: glomérulo grande e mais rosado, com massas arredondadas pálidas dentro dos lóbulos.',
      'No grande aumento: nódulo de matriz lamelar e pouco celular (PAS positivo), com capilares em "coroa" na periferia; às vezes microaneurismas.',
    ],
    mecanismo: [
      'A hiperglicemia crônica glica proteínas da matriz (produtos finais de glicação avançada) e estimula TGF-β: as células mesangiais produzem colágeno IV e fibronectina em excesso.',
      'A matriz se acumula primeiro de forma difusa (expansão mesangial) e depois em nódulos, reduzindo a superfície de filtração.',
    ],
    significado: [
      'Lesão característica da nefropatia diabética avançada (classe III da classificação de Tervaert). É a principal causa de doença renal terminal no mundo.',
    ],
    ondeOcorre: ['Nefropatia diabética', 'Doença de depósito de cadeias leves', 'Amiloidose', 'Glomerulonefrite membranoproliferativa (fase crônica)', 'Glomerulopatia nodular idiopática (tabagismo, hipertensão)'],
    armadilhas: ['Amiloide também forma nódulos, mas é mais homogêneo, PAS fraco e Congo positivo; depósito de cadeias leves exige imunofluorescência.'],
  },
  {
    id: 'espessamento-da-parede-capilar-glomerular',
    nome: 'Espessamento difuso da parede capilar glomerular',
    sinonimos: ['espessamento da membrana basal glomerular', 'alças capilares rígidas', 'alças em "arame"'],
    categoria: 'deposito',
    resumo:
      'As alças capilares do glomérulo ficam uniformemente grossas, rosadas e rígidas ("abertas demais"), sem aumento de células — o glomérulo parece normal no pequeno aumento, mas as paredes parecem desenhadas com traço grosso.',
    comoReconhecer: [
      'No H&E: alças capilares abertas, com paredes eosinofílicas espessas e contorno regular; celularidade normal.',
      'Na prata (metenamina): "espículas" da membrana basal entre os depósitos, na nefropatia membranosa; a imunofluorescência mostra IgG granular nas alças.',
    ],
    mecanismo: [
      'Na nefropatia membranosa, anticorpos (anti-PLA2R na maioria) se ligam aos podócitos e formam depósitos subepiteliais; a membrana basal cresce entre e sobre os depósitos.',
      'O complemento ativado (C5b-9) lesa o podócito sem atrair neutrófilos: proteinúria maciça sem inflamação.',
    ],
    significado: ['Padrão da nefropatia membranosa — principal causa de síndrome nefrótica primária no adulto. Também no diabetes (membrana basal espessada) e no lúpus classe V.'],
    ondeOcorre: ['Nefropatia membranosa', 'Nefropatia diabética', 'Nefrite lúpica classe V'],
    armadilhas: ['Cortes espessos e glomérulos cortados tangencialmente parecem ter paredes grossas; a prata e a imunofluorescência confirmam.'],
  },
  {
    id: 'destruicao-de-septos-alveolares',
    nome: 'Destruição de septos alveolares (espaços aéreos alargados)',
    sinonimos: ['enfisema', 'alargamento dos espaços aéreos', 'septos rotos'],
    categoria: 'arquitetura',
    resumo:
      'Espaços aéreos distais anormalmente grandes, por destruição das paredes alveolares, com pontas de septos soltas ("septos flutuantes") e sem fibrose importante.',
    comoReconhecer: [
      'No pequeno aumento: o pulmão parece uma renda rasgada, com espaços grandes e irregulares em vez de alvéolos pequenos e iguais.',
      'No médio aumento: septos terminando em pontas livres e com vasos pobres; antracose frequente.',
    ],
    mecanismo: [
      'O tabagismo atrai neutrófilos e macrófagos que liberam elastase e metaloproteinases; o fumo inativa a α1-antitripsina.',
      'A elastina dos septos é destruída e os alvéolos se fundem; perde-se a tração elástica que mantém os bronquíolos abertos (aprisionamento aéreo).',
    ],
    significado: ['Define o enfisema (DPOC). Centroacinar no fumante (lobos superiores), panacinar na deficiência de α1-antitripsina (lobos inferiores).'],
    ondeOcorre: ['Enfisema centroacinar e panacinar', 'Enfisema parasseptal e bolhas'],
    armadilhas: ['Pulmão mal insuflado ou hiperinsuflado artificialmente e cortes espessos alteram o tamanho dos alvéolos; procure os septos rompidos.'],
  },
]
