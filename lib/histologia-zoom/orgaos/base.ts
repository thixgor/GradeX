import type { Orgao } from '../tipos'

/**
 * Célula, tecidos fundamentais, sangue, esqueleto e músculo.
 *
 * As porcentagens são estimativas didáticas (múltiplos de 5) da área do corte e
 * da população celular visível — ver `FichaDeCaracteristicas`.
 */
export const ORGAOS_BASE: Orgao[] = [
  // ─── Célula e divisão ─────────────────────────────────────────────────────
  {
    id: 'cromossomos-metafasicos',
    nome: 'Cromossomos metafásicos',
    sistema: 'celula',
    sinonimos: ['cariótipo', 'metáfase', 'chromosomes', 'metaphase spread', 'cromossomo'],
    ficha: {
      resumo:
        'Espalhamento de metáfase humana: cromossomos condensados e separados, a forma usada para montar o cariótipo.',
      tecidoPrincipal: 'Nenhum — preparação citogenética de células em cultura',
      epitelios: [],
      semEpitelio:
        'Não é um corte de tecido: são células bloqueadas em metáfase e rompidas sobre a lâmina, para espalhar os cromossomos.',
      morfologia: [
        'Aglomerados de cromossomos espalhados, cada um formado por duas cromátides-irmãs unidas pelo centrômero.',
        'Núcleos interfásicos intactos aparecem ao lado como círculos homogêneos, sem cromossomos individualizados.',
        'A posição do centrômero separa cromossomos metacêntricos, submetacêntricos e acrocêntricos.',
        'Com a orceína acética, o citoplasma quase desaparece e só a cromatina se cora.',
      ],
      celulas: [
        { nome: 'Núcleos em interfase', pct: 80, nota: 'A maioria das células não estava em divisão no momento da fixação.' },
        { nome: 'Metáfases espalhadas', pct: 15, nota: 'Alvo do exame: 46 cromossomos em células humanas normais.' },
        { nome: 'Prófases e metáfases incompletas', pct: 5, nota: 'Cromatina já condensada, mas sem espalhamento útil.' },
      ],
      tecidos: [],
      semTecidos:
        'Preparação citogenética: células em cultura (em geral linfócitos do sangue) rompidas sobre o vidro — não há tecido organizado para classificar.',
      reconhecer: [
        'Estruturas em X ou V soltas, sem arquitetura tecidual.',
        'Coloração monocromática vermelho-acastanhada.',
        'Metáfases em "roseta" ao lado de núcleos redondos.',
      ],
    },
  },
  {
    id: 'mitose-meristema',
    nome: 'Mitose no meristema radicular',
    sistema: 'celula',
    sinonimos: ['raiz de feijão', 'root tip', 'mitose', 'fases da mitose', 'meristema', 'ciclo celular'],
    ficha: {
      resumo:
        'Ponta de raiz de feijão: tecido vegetal em divisão intensa, o modelo clássico para identificar todas as fases da mitose.',
      tecidoPrincipal: 'Meristema apical (tecido vegetal em divisão)',
      epitelios: [],
      semEpitelio: 'Tecido vegetal: não há epitélio. As células são delimitadas por parede celulósica.',
      morfologia: [
        'Células cúbicas pequenas, enfileiradas em colunas, com parede celular nítida.',
        'Núcleos grandes em relação ao citoplasma — sinal de proliferação.',
        'Com Feulgen, só o DNA se cora em magenta: a cromatina conta a fase da divisão.',
        'Prófase (cromatina em novelo), metáfase (placa equatorial), anáfase (dois lotes em migração) e telófase (dois núcleos e a placa celular).',
      ],
      celulas: [
        { nome: 'Células em interfase', pct: 75, nota: 'Núcleo redondo com cromatina fina e nucléolo.' },
        { nome: 'Prófase', pct: 10, nota: 'Cromatina condensando em filamentos; é a fase mais longa da mitose.' },
        { nome: 'Metáfase', pct: 5, nota: 'Cromossomos alinhados no plano equatorial.' },
        { nome: 'Anáfase', pct: 5, nota: 'Cromátides-irmãs migrando para polos opostos.' },
        { nome: 'Telófase', pct: 5, nota: 'Dois núcleos-filhos e a placa celular (fragmoplasto) entre eles.' },
      ],
      tecidos: [],
      semTecidos:
        'Tecido vegetal: meristema apical, protoderme e coifa não entram na classificação dos tecidos animais. Na lâmina, praticamente 100 % da área é meristema em divisão.',
      reconhecer: [
        'Células quadradas com parede espessa — tecido vegetal.',
        'Magenta apenas na cromatina (Feulgen).',
        'Figuras de mitose em todas as fases no mesmo campo.',
      ],
    },
  },
  {
    id: 'escala-milimetrada',
    nome: 'Referência de escala',
    sistema: 'celula',
    sinonimos: ['papel milimetrado', 'scale paper', 'calibração', 'régua', 'escala'],
    ficha: {
      resumo:
        'Papel milimetrado montado em lâmina: serve para calibrar a noção de tamanho antes de estimar dimensões de células.',
      tecidoPrincipal: 'Nenhum — objeto de calibração',
      epitelios: [],
      semEpitelio: 'Não é material biológico.',
      morfologia: [
        'Linhas da grade milimétrica: cada quadrado grande mede 1 mm (1.000 µm).',
        'Compare: uma hemácia tem ~7,5 µm, um hepatócito ~25 µm, um ósteon ~200 µm.',
        'As fibras do papel mostram a textura irregular da celulose.',
      ],
      celulas: [],
      tecidos: [],
      semTecidos: 'Objeto de calibração, sem células.',
      reconhecer: ['Grade regular de linhas, sem células.'],
    },
  },

  // ─── Tecidos fundamentais ─────────────────────────────────────────────────
  {
    id: 'tendao',
    nome: 'Tendão',
    sistema: 'tecidos-fundamentais',
    sinonimos: ['tendon', 'conjuntivo denso modelado', 'tecido conjuntivo denso regular', 'tenócito'],
    ficha: {
      resumo:
        'O exemplo clássico de tecido conjuntivo denso modelado: feixes colágenos paralelos que transmitem a força do músculo ao osso.',
      tecidoPrincipal: 'Conjuntivo propriamente dito denso modelado (regular)',
      epitelios: [],
      semEpitelio: 'Órgão inteiramente conjuntivo, sem superfície livre revestida.',
      morfologia: [
        'Feixes de fibras colágenas tipo I espessos, paralelos e levemente ondulados, intensamente eosinófilos.',
        'Tenócitos (fibroblastos) com núcleos alongados e achatados, enfileirados entre os feixes.',
        'Endotendão (conjuntivo frouxo) separa os fascículos e leva vasos e nervos.',
        'Em corte transversal, os feixes aparecem como campos poligonais com núcleos estrelados entre eles.',
        'Pouquíssima substância fundamental e quase nenhum vaso dentro dos feixes.',
      ],
      celulas: [
        { nome: 'Tenócitos (fibroblastos)', pct: 85, nota: 'Núcleos finos, escuros, em fileira paralela às fibras.' },
        { nome: 'Células endoteliais e pericitos', pct: 10, nota: 'Nos vasos do endotendão e do peritendão.' },
        { nome: 'Macrófagos e mastócitos', pct: 5, nota: 'Raros, no conjuntivo frouxo entre fascículos.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-modelado', pct: 85, onde: 'Fascículos tendíneos — praticamente todo o corte.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Endotendão e peritendão, entre os fascículos.' },
      ],
      reconhecer: [
        'Rosa uniforme com fibras paralelas.',
        'Núcleos poucos, alongados e alinhados — "trilhos de trem".',
        'Sem estrias e sem núcleos centrais gordos (não é músculo).',
      ],
      diferencial: [
        'Músculo liso: núcleos em charuto, centrais e muito mais numerosos; citoplasma mais homogêneo.',
        'Nervo periférico: fibras onduladas com núcleos de Schwann e bainhas de mielina (espaços claros).',
        'Derme (denso não modelado): feixes cruzando em todas as direções.',
      ],
    },
  },
  {
    id: 'fibras-da-derme',
    nome: 'Fibras do conjuntivo (derme)',
    sistema: 'tecidos-fundamentais',
    sinonimos: ['fibras elásticas', 'fibras colágenas', 'elastic fibers', 'collagen fibers', 'derme', 'orceína', 'resorcina', 'azan'],
    ficha: {
      resumo:
        'Pele corada para fibras: mostra, lado a lado, a rede fina de fibras elásticas e os feixes grossos de colágeno da derme.',
      tecidoPrincipal: 'Conjuntivo propriamente dito denso não modelado (irregular) — derme reticular',
      epitelios: [
        { tipo: 'Estratificado pavimentoso queratinizado', onde: 'Epiderme, na borda superior do corte.' },
      ],
      morfologia: [
        'Derme papilar logo abaixo da epiderme: conjuntivo frouxo, fibras finas, muitos capilares.',
        'Derme reticular: feixes colágenos grossos entrecruzados em várias direções (denso não modelado).',
        'Com orceína ou resorcina, as fibras elásticas surgem como fios escuros, finos e ramificados, entre os feixes colágenos.',
        'Com Azan, o colágeno fica azul intenso e os núcleos vermelhos.',
        'Na derme papilar, as fibras elásticas finas (oxitalânicas) sobem perpendiculares em direção à epiderme.',
      ],
      celulas: [
        { nome: 'Queratinócitos', pct: 50, nota: 'Epiderme; muito densos, dominam a contagem.' },
        { nome: 'Fibroblastos', pct: 30, nota: 'Núcleos alongados entre os feixes da derme.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Capilares da derme papilar.' },
        { nome: 'Mastócitos e macrófagos', pct: 5, nota: 'Perivasculares.' },
        { nome: 'Células dos anexos', pct: 5, nota: 'Glândulas sudoríparas e folículos, quando incluídos.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 60, onde: 'Derme reticular.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Derme papilar.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Epiderme.' },
        { tipo: 'conjuntivo-elastico', pct: 5, onde: 'Rede de fibras elásticas distribuída pela derme (destacada pela coloração).' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Hipoderme, na borda inferior.' },
      ],
      reconhecer: [
        'Fios escuros finos e sinuosos (elásticas) contra fundo claro — orceína/resorcina.',
        'Azul intenso em feixes grossos (colágeno) — Azan.',
        'Epiderme estratificada no topo orienta a leitura.',
      ],
    },
  },
  {
    id: 'adiposo-unilocular',
    nome: 'Tecido adiposo unilocular (branco)',
    sistema: 'tecidos-fundamentais',
    sinonimos: ['gordura branca', 'white fat', 'adipócito', 'tecido adiposo branco', 'adipose tissue'],
    ficha: {
      resumo:
        'Reserva de energia e isolamento: adipócitos enormes com uma única gota lipídica, dissolvida no processamento.',
      tecidoPrincipal: 'Conjuntivo especializado adiposo unilocular',
      epitelios: [],
      semEpitelio: 'Tecido isolado, sem superfície revestida no corte.',
      morfologia: [
        'Aspecto de "favo de mel" ou rede de pesca: células poligonais grandes e vazias.',
        'A gota lipídica foi extraída pelos solventes: sobra um espaço branco delimitado por um fino anel de citoplasma.',
        'Núcleo achatado e empurrado para a periferia — a imagem de "anel de sinete".',
        'Septos de conjuntivo frouxo dividem o tecido em lóbulos e levam vasos.',
        'Capilares finos entre os adipócitos; hemácias às vezes visíveis.',
      ],
      celulas: [
        { nome: 'Adipócitos uniloculares', pct: 60, nota: 'Diâmetro de até 100 µm; núcleo periférico, em crescente.' },
        { nome: 'Células endoteliais', pct: 20, nota: 'Capilares em todas as junções entre adipócitos.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Nos septos interlobulares.' },
        { nome: 'Macrófagos', pct: 5, nota: 'Entre adipócitos; aumentam na obesidade.' },
        { nome: 'Células-tronco perivasculares (pré-adipócitos)', pct: 5, nota: 'Pequenas, fusiformes, junto a vasos.' },
      ],
      tecidos: [
        { tipo: 'adiposo-unilocular', pct: 90, onde: 'Lóbulos adiposos.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Septos interlobulares com vasos.' },
      ],
      reconhecer: [
        'Espaços brancos grandes e redondos com parede fina.',
        'Poucos núcleos, sempre na periferia da célula.',
        'Nenhum conteúdo dentro do espaço (diferente de alvéolo, que tem células).',
      ],
      diferencial: [
        'Pulmão: alvéolos também são espaços claros, mas com septos celulares, macrófagos e hemácias.',
        'Adiposo multilocular: células menores, citoplasma espumoso, núcleo central.',
      ],
    },
  },
  {
    id: 'adiposo-multilocular',
    nome: 'Tecido adiposo multilocular (pardo)',
    sistema: 'tecidos-fundamentais',
    sinonimos: ['gordura parda', 'brown fat', 'tecido adiposo marrom', 'termogênese', 'UCP1'],
    ficha: {
      resumo:
        'Tecido termogênico: adipócitos com muitas gotículas e mitocôndrias ricas em UCP1. Nesta lâmina, junto ao rim.',
      tecidoPrincipal: 'Conjuntivo especializado adiposo multilocular',
      epitelios: [
        { tipo: 'Simples cúbico (túbulos renais)', onde: 'No parênquima renal vizinho, quando incluído no corte.' },
      ],
      morfologia: [
        'Adipócitos menores que os brancos, poligonais, com citoplasma espumoso — muitas gotículas lipídicas.',
        'Núcleo redondo e central, diferente do núcleo periférico do adipócito branco.',
        'Citoplasma eosinófilo e granular entre as gotículas: é a densidade de mitocôndrias.',
        'Muitos capilares e arranjo lobular, parecido com glândula.',
        'O tecido fica ao lado do rim e da cápsula renal — use o rim como ponto de referência.',
      ],
      celulas: [
        { nome: 'Adipócitos multiloculares', pct: 60, nota: 'Citoplasma "em bolhas", núcleo central.' },
        { nome: 'Células endoteliais', pct: 20, nota: 'Vascularização muito rica.' },
        { nome: 'Adipócitos uniloculares', pct: 10, nota: 'Misturados, sobretudo na periferia.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Septos.' },
      ],
      tecidos: [
        { tipo: 'adiposo-multilocular', pct: 55, onde: 'Lóbulos de gordura parda perirrenal.' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Túbulos do rim adjacente.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Cápsula renal.' },
        { tipo: 'adiposo-unilocular', pct: 10, onde: 'Ilhas de gordura branca.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Septos vasculares.' },
      ],
      reconhecer: [
        'Células com muitos vacúolos pequenos e núcleo no meio.',
        'Aspecto glandular, rosado, muito vascularizado.',
      ],
      diferencial: [
        'Glândula sebácea: células também vacuolizadas, mas com núcleo picnótico e ligada a folículo piloso.',
        'Adrenal (fasciculada): espongiócitos vacuolizados, porém em cordões retos, com cápsula e medula.',
      ],
    },
  },

  // ─── Sangue ───────────────────────────────────────────────────────────────
  {
    id: 'sangue-periferico',
    nome: 'Sangue periférico',
    sistema: 'sangue',
    sinonimos: ['esfregaço sanguíneo', 'blood smear', 'hemácias', 'leucócitos', 'plaquetas', 'hemograma'],
    ficha: {
      resumo:
        'Esfregaço de sangue: a única preparação em que as células de um tecido aparecem soltas, uma a uma, para contagem diferencial.',
      tecidoPrincipal: 'Conjuntivo especializado — sangue',
      epitelios: [],
      semEpitelio: 'É um esfregaço, não um corte: as células foram estendidas numa camada única sobre o vidro.',
      morfologia: [
        'Hemácias anucleadas, bicôncavas, com halo central claro, ~7,5 µm — a régua do esfregaço.',
        'Neutrófilo: núcleo com 3–5 lóbulos e citoplasma rosa-pálido de grânulos finos.',
        'Eosinófilo: núcleo bilobado e grânulos grandes alaranjados.',
        'Basófilo: grânulos grossos azul-escuros que escondem o núcleo.',
        'Linfócito: núcleo redondo e denso ocupando quase toda a célula, orla fina de citoplasma azul.',
        'Monócito: a maior célula, núcleo em rim ou ferradura, citoplasma cinza-azulado.',
        'Plaquetas: fragmentos violeta de 2–3 µm, muitas vezes em grumos.',
        'Leia na "zona de leitura": onde as hemácias se tocam sem se sobrepor.',
      ],
      celulas: [
        { nome: 'Hemácias', pct: 95, nota: '~5 milhões/µL — praticamente todo o campo.' },
        { nome: 'Plaquetas', pct: 5, nota: '150–450 mil/µL; pequenas, violeta.' },
      ],
      tecidos: [{ tipo: 'sangue', pct: 100, onde: 'Todo o esfregaço.' }],
      reconhecer: [
        'Campo coberto de discos rosa sem núcleo.',
        'Leucócitos esparsos, com núcleos violeta de formas variadas.',
        'Fórmula leucocitária típica: neutrófilos 55–65 %, linfócitos 25–35 %, monócitos 3–8 %, eosinófilos 1–4 %, basófilos < 1 %.',
      ],
      diferencial: [
        'Medula óssea: muitos precursores nucleados, megacariócitos e células de tamanhos variados.',
      ],
    },
  },
  {
    id: 'medula-ossea',
    nome: 'Medula óssea',
    sistema: 'sangue',
    sinonimos: ['bone marrow', 'hematopoese', 'mielograma', 'megacariócito', 'eritroblasto', 'mieloblasto'],
    ficha: {
      resumo:
        'Esfregaço de medula óssea: todas as linhagens hematopoéticas em maturação, com os megacariócitos como marco.',
      tecidoPrincipal: 'Conjuntivo especializado hematopoético',
      epitelios: [],
      semEpitelio: 'Esfregaço de aspirado medular — células soltas, sem arquitetura de órgão.',
      morfologia: [
        'Celularidade muito maior que a do sangue: quase todas as células são nucleadas.',
        'Série granulocítica: do mieloblasto (núcleo grande, nucléolos) ao metamielócito (núcleo em rim) e bastonete.',
        'Série eritroide: eritroblastos com citoplasma que vai do azul intenso (basófilo) ao rosa (ortocromático) e núcleo cada vez menor e mais denso.',
        'Megacariócitos: células gigantes com núcleo multilobulado, fonte das plaquetas.',
        'Hemácias maduras ao fundo, como no sangue periférico.',
      ],
      celulas: [
        { nome: 'Série granulocítica (mieloblastos a segmentados)', pct: 55, nota: 'Relação mieloide:eritroide normal ~3:1.' },
        { nome: 'Série eritroide (eritroblastos)', pct: 20, nota: 'Núcleos redondos muito escuros, citoplasma azul a rosa.' },
        { nome: 'Linfócitos', pct: 15, nota: 'Pequenos, núcleo denso.' },
        { nome: 'Monócitos e plasmócitos', pct: 5, nota: 'Plasmócito: núcleo excêntrico em "roda de carroça".' },
        { nome: 'Megacariócitos', pct: 5, nota: 'Raros em número, gigantes em tamanho.' },
      ],
      tecidos: [{ tipo: 'hematopoetico', pct: 100, onde: 'Todo o esfregaço.' }],
      reconhecer: [
        'Muitas células nucleadas de tamanhos diferentes.',
        'Presença de megacariócitos.',
        'Precursores com citoplasma azul intenso.',
      ],
      diferencial: ['Sangue periférico: predominam hemácias anucleadas, leucócitos esparsos.'],
    },
  },

  // ─── Esqueleto ────────────────────────────────────────────────────────────
  {
    id: 'epifise-osso-longo',
    nome: 'Epífise de osso longo e placa de crescimento',
    sistema: 'esqueletico',
    sinonimos: ['tíbia', 'úmero', 'placa epifisária', 'disco epifisário', 'cartilagem de crescimento', 'tibia', 'humerus', 'growth plate', 'osso esponjoso'],
    ficha: {
      resumo:
        'Extremidade de osso longo em crescimento: cartilagem articular, placa epifisária com suas zonas e o osso esponjoso metafisário.',
      tecidoPrincipal: 'Conjuntivo especializado ósseo e cartilaginoso',
      epitelios: [],
      semEpitelio:
        'Osso não tem epitélio; a superfície articular é cartilagem hialina sem pericôndrio.',
      morfologia: [
        'Cartilagem articular hialina na superfície, sem pericôndrio.',
        'Placa epifisária com zonas em sequência: repouso, proliferação (condrócitos em pilhas de moedas), hipertrofia, calcificação e ossificação.',
        'Trabéculas de osso esponjoso com núcleo de cartilagem calcificada (basófila) revestido de osso (eosinófilo).',
        'Osteoblastos cúbicos enfileirados sobre as trabéculas; osteoclastos multinucleados em lacunas de Howship.',
        'Medula óssea hematopoética preenchendo os espaços entre as trabéculas.',
        'Cortical de osso compacto com ósteons na diáfise vizinha.',
      ],
      celulas: [
        { nome: 'Células hematopoéticas', pct: 45, nota: 'Nos espaços medulares — a maioria numérica.' },
        { nome: 'Condrócitos', pct: 30, nota: 'Em lacunas; em colunas na zona de proliferação, grandes e claros na hipertrofia.' },
        { nome: 'Osteócitos', pct: 10, nota: 'Em lacunas dentro da matriz óssea.' },
        { nome: 'Osteoblastos', pct: 10, nota: 'Camada cúbica sobre as trabéculas em formação.' },
        { nome: 'Osteoclastos', pct: 5, nota: 'Gigantes, multinucleados, eosinófilos.' },
      ],
      tecidos: [
        { tipo: 'cartilagem-hialina', pct: 30, onde: 'Cartilagem articular e placa epifisária.' },
        { tipo: 'osso-esponjoso', pct: 30, onde: 'Epífise e metáfise.' },
        { tipo: 'hematopoetico', pct: 25, onde: 'Espaços medulares.' },
        { tipo: 'osso-compacto', pct: 10, onde: 'Cortical.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Periósteo e pericôndrio.' },
      ],
      reconhecer: [
        'Faixa de cartilagem com condrócitos em colunas atravessando o osso.',
        'Trabéculas com miolo azulado (cartilagem calcificada) e casca rosa (osso).',
        'Medula óssea entre as trabéculas.',
      ],
      diferencial: [
        'Ossificação endocondral embrionária: modelo cartilaginoso inteiro, com centro de ossificação primário e colar ósseo.',
        'Corpo vertebral: osso esponjoso sem placa de crescimento longa; disco intervertebral vizinho.',
      ],
    },
  },
  {
    id: 'corpo-vertebral',
    nome: 'Corpo vertebral',
    sistema: 'esqueletico',
    sinonimos: ['vértebra', 'corpus vertebrae', 'disco intervertebral', 'osso trabecular', 'vertebra'],
    ficha: {
      resumo:
        'Corpo de vértebra: osso predominantemente esponjoso, com medula vermelha e a junção com o disco intervertebral.',
      tecidoPrincipal: 'Conjuntivo especializado ósseo esponjoso',
      epitelios: [],
      semEpitelio: 'Órgão esquelético, sem superfície epitelial.',
      morfologia: [
        'Trabéculas ósseas finas e interconectadas, orientadas pelas linhas de carga.',
        'Com Masson-Goldner, osso mineralizado verde e osteoide (não mineralizado) em vermelho-alaranjado sobre as trabéculas.',
        'Medula óssea vermelha abundante entre as trabéculas.',
        'Placa terminal de cartilagem hialina e o anel fibroso do disco (fibrocartilagem) na borda.',
        'Cortical fina de osso compacto contornando o corpo.',
      ],
      celulas: [
        { nome: 'Células hematopoéticas', pct: 60, nota: 'Medula vermelha ativa.' },
        { nome: 'Adipócitos medulares', pct: 15, nota: 'Espaços claros na medula.' },
        { nome: 'Osteócitos', pct: 10, nota: 'Nas trabéculas.' },
        { nome: 'Osteoblastos e osteoclastos', pct: 5, nota: 'Superfícies de remodelação.' },
        { nome: 'Condrócitos', pct: 10, nota: 'Placa terminal e disco.' },
      ],
      tecidos: [
        { tipo: 'hematopoetico', pct: 45, onde: 'Espaços entre as trabéculas.' },
        { tipo: 'osso-esponjoso', pct: 30, onde: 'Trabéculas do corpo vertebral.' },
        { tipo: 'fibrocartilagem', pct: 10, onde: 'Anel fibroso do disco intervertebral.' },
        { tipo: 'cartilagem-hialina', pct: 5, onde: 'Placa terminal.' },
        { tipo: 'osso-compacto', pct: 5, onde: 'Cortical fina.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Adipócitos medulares.' },
      ],
      reconhecer: [
        'Rede de trabéculas finas cheia de medula.',
        'Cortical delgada.',
        'Fibrocartilagem do disco na margem.',
      ],
    },
  },
  {
    id: 'ossificacao-intramembranosa',
    nome: 'Ossificação intramembranosa',
    sistema: 'esqueletico',
    sinonimos: ['intramembranous ossification', 'osso da calvária', 'mesênquima', 'osteoide', 'ossificação direta'],
    ficha: {
      resumo:
        'Formação de osso diretamente no mesênquima, sem molde de cartilagem — como nos ossos chatos do crânio.',
      tecidoPrincipal: 'Conjuntivo especializado ósseo primário (não lamelar)',
      epitelios: [
        { tipo: 'Estratificado pavimentoso (epiderme fetal)', onde: 'Pode aparecer na superfície, sobre a calvária.' },
      ],
      morfologia: [
        'Mesênquima frouxo com células estreladas e muitos vasos.',
        'Espículas e trabéculas de osso primário, eosinófilas, formando uma rede irregular.',
        'Osteoblastos cúbicos e basófilos enfileirados na superfície das trabéculas, depositando osteoide (faixa rosa-pálida sem células).',
        'Osteócitos presos em lacunas dentro da matriz recém-formada.',
        'Osteoclastos ocasionais remodelando as bordas.',
        'Ausência total de cartilagem — é o que a separa da ossificação endocondral.',
      ],
      celulas: [
        { nome: 'Células mesenquimais', pct: 40, nota: 'Estreladas, no tecido entre as trabéculas.' },
        { nome: 'Osteoblastos', pct: 25, nota: 'Epitelioides, em fila sobre o osso novo.' },
        { nome: 'Osteócitos', pct: 20, nota: 'Nas lacunas, maiores e mais numerosos que no osso maduro.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Capilares do mesênquima.' },
        { nome: 'Osteoclastos', pct: 5, nota: 'Multinucleados, nas superfícies de reabsorção.' },
      ],
      tecidos: [
        { tipo: 'osso-primario', pct: 45, onde: 'Trabéculas em formação.' },
        { tipo: 'conjuntivo-frouxo', pct: 40, onde: 'Mesênquima e periósteo em formação.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Camada fibrosa externa (futuro periósteo) e derme.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Epiderme fetal, quando presente.' },
      ],
      reconhecer: [
        'Trabéculas rosa revestidas por fileira de osteoblastos.',
        'Mesênquima em volta, sem cartilagem.',
      ],
      diferencial: [
        'Ossificação endocondral: há molde de cartilagem hialina e zonas de condrócitos hipertróficos.',
      ],
    },
  },
  {
    id: 'ossificacao-endocondral',
    nome: 'Ossificação endocondral',
    sistema: 'esqueletico',
    sinonimos: ['endochondral ossification', 'centro de ossificação primário', 'colar ósseo', 'molde cartilaginoso', 'embrião'],
    ficha: {
      resumo:
        'Osso longo embrionário: o molde de cartilagem hialina sendo substituído por osso a partir do centro de ossificação primário.',
      tecidoPrincipal: 'Conjuntivo especializado cartilaginoso e ósseo primário',
      epitelios: [
        { tipo: 'Estratificado pavimentoso (epiderme fetal)', onde: 'Na pele do membro, quando incluída.' },
      ],
      morfologia: [
        'Molde de cartilagem hialina com a forma do futuro osso, envolto por pericôndrio.',
        'Nas extremidades, condrócitos pequenos e em repouso; em direção ao centro, colunas de proliferação e condrócitos hipertróficos.',
        'Colar ósseo periosteal: osso formado por ossificação intramembranosa em volta da diáfise.',
        'Centro primário: cartilagem calcificada invadida pelo broto periosteal (vasos e células osteoprogenitoras).',
        'Trabéculas mistas — miolo basófilo de cartilagem calcificada e casca eosinófila de osso.',
        'Medula primitiva começando a se formar na cavidade.',
      ],
      celulas: [
        { nome: 'Condrócitos', pct: 50, nota: 'Das pequenas células em repouso às hipertróficas vacuolizadas.' },
        { nome: 'Células mesenquimais e osteoprogenitoras', pct: 20, nota: 'Pericôndrio, periósteo e broto periosteal.' },
        { nome: 'Osteoblastos', pct: 10, nota: 'Sobre as trabéculas e o colar ósseo.' },
        { nome: 'Células hematopoéticas', pct: 10, nota: 'Medula primitiva no centro.' },
        { nome: 'Osteócitos', pct: 5, nota: 'Nas trabéculas recentes.' },
        { nome: 'Osteoclastos/condroclastos', pct: 5, nota: 'Reabsorvem a cartilagem calcificada.' },
      ],
      tecidos: [
        { tipo: 'cartilagem-hialina', pct: 50, onde: 'Molde cartilaginoso das epífises e da diáfise ainda não ossificada.' },
        { tipo: 'osso-primario', pct: 20, onde: 'Colar ósseo e trabéculas do centro primário.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Mesênquima em volta e pericôndrio.' },
        { tipo: 'hematopoetico', pct: 10, onde: 'Medula primitiva.' },
        { tipo: 'muscular-esqueletico', pct: 5, onde: 'Músculos em desenvolvimento ao redor.' },
      ],
      reconhecer: [
        'Grande molde azul-pálido de cartilagem.',
        'Condrócitos que crescem em direção ao centro.',
        'Colar rosa de osso em volta da diáfise.',
      ],
      diferencial: [
        'Ossificação intramembranosa: sem cartilagem, osso forma-se direto no mesênquima.',
        'Placa epifisária pós-natal: cartilagem restrita a uma faixa entre epífise e metáfise.',
      ],
    },
  },

  // ─── Músculo ──────────────────────────────────────────────────────────────
  {
    id: 'musculo-esqueletico',
    nome: 'Músculo estriado esquelético',
    sistema: 'muscular',
    sinonimos: ['skeletal muscle', 'fibra muscular', 'estrias', 'sarcômero', 'rabdomiócito', 'músculo voluntário'],
    ficha: {
      resumo:
        'Músculo voluntário: fibras longas, multinucleadas e estriadas, organizadas por bainhas de conjuntivo.',
      tecidoPrincipal: 'Muscular estriado esquelético',
      epitelios: [],
      semEpitelio: 'Tecido muscular isolado; não há superfície livre.',
      morfologia: [
        'Em corte longitudinal: fibras cilíndricas paralelas com estrias transversais (bandas A escuras e I claras).',
        'Núcleos numerosos, alongados e periféricos, logo abaixo do sarcolema.',
        'Em corte transversal: fibras poligonais com núcleos na borda e miofibrilas pontilhadas (campos de Cohnheim).',
        'Endomísio envolve cada fibra; perimísio agrupa fascículos; epimísio envolve o músculo.',
        'Capilares abundantes no endomísio.',
      ],
      celulas: [
        { nome: 'Núcleos das fibras musculares', pct: 70, nota: 'Periféricos; uma fibra tem centenas.' },
        { nome: 'Células endoteliais', pct: 15, nota: 'Capilares entre as fibras.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Endomísio e perimísio.' },
        { nome: 'Células satélites', pct: 5, nota: 'Entre o sarcolema e a lâmina basal; difíceis de separar no óptico.' },
      ],
      tecidos: [
        { tipo: 'muscular-esqueletico', pct: 85, onde: 'Fibras musculares.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Endomísio e perimísio.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Epimísio e septos maiores.' },
      ],
      reconhecer: [
        'Estrias transversais nítidas.',
        'Muitos núcleos na periferia da fibra.',
        'Fibras largas e sem ramificação.',
      ],
      diferencial: [
        'Músculo cardíaco: fibras ramificadas, núcleo central único e discos intercalares.',
        'Músculo liso: sem estrias, células fusiformes, núcleo central.',
      ],
    },
  },
  {
    id: 'musculo-liso',
    nome: 'Músculo liso',
    sistema: 'muscular',
    sinonimos: ['smooth muscle', 'leiomiócito', 'músculo visceral', 'músculo involuntário', 'detrusor'],
    ficha: {
      resumo:
        'Camadas musculares lisas da parede da bexiga: células fusiformes em feixes cruzados, sob controle autônomo.',
      tecidoPrincipal: 'Muscular liso',
      epitelios: [
        { tipo: 'Urotélio (de transição)', onde: 'Revestimento da luz, se a mucosa estiver incluída.' },
      ],
      morfologia: [
        'Células fusiformes com núcleo único, central e alongado ("charuto").',
        'Citoplasma eosinófilo homogêneo, sem estrias.',
        'Em corte transversal: perfis redondos de tamanhos variados, só alguns com núcleo (o núcleo fica no meio da célula).',
        'Na bexiga, os feixes correm em várias direções (detrusor), separados por conjuntivo com vasos.',
        'Núcleos em saca-rolhas quando a célula está contraída.',
      ],
      celulas: [
        { nome: 'Células musculares lisas (leiomiócitos)', pct: 75, nota: 'Núcleo central alongado.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Entre os feixes.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Vasos nos septos.' },
        { nome: 'Células intersticiais e neurônios intramurais', pct: 5, nota: 'Pequenos gânglios autonômicos podem aparecer.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 75, onde: 'Feixes do detrusor.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Septos entre os feixes.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Urotélio, se presente.' },
      ],
      reconhecer: [
        'Rosa homogêneo com núcleos em charuto, centrais.',
        'Feixes cortados em direções diferentes no mesmo campo.',
      ],
      diferencial: [
        'Tendão/conjuntivo denso: núcleos mais finos e escassos, fibras onduladas acelulares.',
        'Nervo: núcleos ondulados de Schwann e bainhas claras.',
      ],
    },
  },
]
