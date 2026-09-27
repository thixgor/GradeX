import type { Orgao } from '../tipos'

/** Tubo digestório e glândulas anexas. */
export const ORGAOS_DIGESTORIO: Orgao[] = [
  // ─── Tubo digestório ──────────────────────────────────────────────────────
  {
    id: 'esofago',
    nome: 'Esôfago',
    sistema: 'digestorio',
    sinonimos: ['oesophagus', 'esophagus', 'glândulas esofágicas', 'muscular da mucosa', 'tubo digestório'],
    ficha: {
      resumo:
        'Tubo de passagem do bolo alimentar: epitélio estratificado pavimentoso não queratinizado e camada muscular que vai de esquelética a lisa.',
      tecidoPrincipal: 'Muscular (túnica muscular) e epitélio estratificado',
      epitelios: [
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Mucosa, revestindo a luz pregueada.' },
        { tipo: 'Simples cúbico/cilíndrico (ácinos mucosos)', onde: 'Glândulas esofágicas na submucosa.' },
      ],
      morfologia: [
        'Luz irregular e pregueada pelas dobras longitudinais da mucosa e submucosa.',
        'Epitélio estratificado pavimentoso espesso, sem queratina.',
        'Muscular da mucosa longitudinal, espessa e nítida.',
        'Submucosa com glândulas esofágicas mucosas e vasos.',
        'Muscular própria: circular interna e longitudinal externa — esquelética no terço superior, mista no médio, lisa no inferior.',
        'Adventícia (não serosa) na maior parte do trajeto.',
      ],
      celulas: [
        { nome: 'Células epiteliais', pct: 35, nota: 'Estratificado espesso.' },
        { nome: 'Células musculares (lisas e/ou esqueléticas)', pct: 35, nota: 'Túnica muscular e muscular da mucosa.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Lâmina própria, submucosa, adventícia.' },
        { nome: 'Células glandulares mucosas', pct: 5, nota: 'Glândulas esofágicas.' },
        { nome: 'Células endoteliais e neurônios dos plexos', pct: 10, nota: 'Plexos de Meissner e Auerbach.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 30, onde: 'Muscular própria (terços médio e inferior) e muscular da mucosa.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Lâmina própria e submucosa.' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Mucosa.' },
        { tipo: 'muscular-esqueletico', pct: 15, onde: 'Muscular própria (terço superior).' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Adventícia.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 5, onde: 'Glândulas esofágicas.' },
      ],
      reconhecer: [
        'Estratificado sem queratina na luz.',
        'Tubo com camada muscular espessa em duas direções.',
      ],
      diferencial: [
        'Vagina: estratificado não queratinizado, mas sem muscular da mucosa nem glândulas.',
        'Traqueia: cartilagem e epitélio respiratório.',
      ],
    },
  },
  {
    id: 'juncao-esofagogastrica',
    nome: 'Junção esofagogástrica (cárdia)',
    sistema: 'digestorio',
    sinonimos: ['cárdia', 'cardia', 'transição esôfago-estômago', 'glândulas cárdicas', 'linha Z'],
    ficha: {
      resumo:
        'Transição abrupta do epitélio estratificado do esôfago para o epitélio simples cilíndrico mucoso do estômago.',
      tecidoPrincipal: 'Epitelial (duas mucosas lado a lado)',
      epitelios: [
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Lado esofágico.' },
        { tipo: 'Simples cilíndrico mucossecretor', onde: 'Lado gástrico, revestindo superfície e fovéolas.' },
        { tipo: 'Glandular tubular (glândulas cárdicas mucosas)', onde: 'Mucosa da cárdia.' },
      ],
      morfologia: [
        'Ponto de transição nítido entre os dois epitélios (linha Z).',
        'Glândulas cárdicas: tubulares, enoveladas, mucosas, com luz ampla.',
        'Mais adiante, mucosa de corpo/fundo com glândulas gástricas retas e células parietais.',
        'Muscular da mucosa e muscular própria contínuas entre os dois órgãos.',
      ],
      celulas: [
        { nome: 'Células epiteliais estratificadas', pct: 25, nota: 'Lado esofágico.' },
        { nome: 'Células mucosas de superfície e das glândulas cárdicas', pct: 25, nota: 'Citoplasma claro apical.' },
        { nome: 'Células musculares lisas', pct: 25, nota: 'Muscular da mucosa e própria.' },
        { nome: 'Células parietais e principais', pct: 10, nota: 'Glândulas do corpo, além da cárdia.' },
        { nome: 'Fibroblastos, linfócitos e plasmócitos', pct: 15, nota: 'Lâmina própria.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 30, onde: 'Muscular da mucosa e muscular própria.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 25, onde: 'Glândulas cárdicas e gástricas.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Lâmina própria e submucosa.' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Esofágico e gástrico.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Adventícia/serosa.' },
      ],
      reconhecer: ['Dois epitélios diferentes na mesma superfície, com transição abrupta.'],
    },
  },
  {
    id: 'estomago-corpo-fundo',
    nome: 'Estômago — corpo e fundo',
    sistema: 'digestorio',
    sinonimos: ['stomach', 'corpo gástrico', 'fundo gástrico', 'células parietais', 'células principais', 'glândulas oxínticas', 'fovéolas'],
    ficha: {
      resumo:
        'Mucosa oxíntica: fovéolas rasas e glândulas longas e retas com células parietais (HCl) e principais (pepsinogênio).',
      tecidoPrincipal: 'Epitelial glandular exócrino (mucosa gástrica)',
      epitelios: [
        { tipo: 'Simples cilíndrico mucossecretor', onde: 'Superfície e fovéolas gástricas.' },
        { tipo: 'Glandular tubular simples ramificado', onde: 'Glândulas gástricas (fúndicas) na lâmina própria.' },
      ],
      morfologia: [
        'Fovéolas ocupam só o quarto superficial da mucosa; o resto são glândulas longas e retas.',
        'Células parietais: grandes, redondas, eosinófilas, "ovo frito", concentradas no terço médio.',
        'Células principais: basófilas, na base das glândulas.',
        'Células mucosas do colo no istmo; células enteroendócrinas dispersas.',
        'Muscular da mucosa fina; submucosa frouxa; muscular própria com três camadas (oblíqua, circular, longitudinal).',
        'Serosa na superfície externa.',
      ],
      celulas: [
        { nome: 'Células parietais (oxínticas)', pct: 25, nota: 'Eosinófilas, redondas.' },
        { nome: 'Células principais (zimogênicas)', pct: 20, nota: 'Basófilas, na base.' },
        { nome: 'Células mucosas de superfície e do colo', pct: 20, nota: 'Apical clara.' },
        { nome: 'Células musculares lisas', pct: 20, nota: 'Muscular própria e da mucosa.' },
        { nome: 'Linfócitos, plasmócitos e fibroblastos', pct: 10, nota: 'Lâmina própria.' },
        { nome: 'Células enteroendócrinas', pct: 5, nota: 'Claras, basais.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-exocrino', pct: 35, onde: 'Glândulas gástricas.' },
        { tipo: 'muscular-liso', pct: 35, onde: 'Muscular própria e muscular da mucosa.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Lâmina própria e submucosa.' },
        { tipo: 'epitelial-revestimento', pct: 10, onde: 'Epitélio de superfície e fovéolas.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Serosa.' },
      ],
      reconhecer: [
        'Mucosa espessa com glândulas retas e paralelas.',
        'Células rosadas redondas (parietais) no meio das glândulas.',
      ],
      diferencial: [
        'Piloro: fovéolas profundas (metade da mucosa) e glândulas mucosas enoveladas, sem parietais abundantes.',
        'Cólon: criptas retas cheias de caliciformes, sem células parietais.',
      ],
    },
  },
  {
    id: 'estomago-piloro',
    nome: 'Estômago — região pilórica',
    sistema: 'digestorio',
    sinonimos: ['piloro', 'pylorus', 'antro', 'glândulas pilóricas', 'células G', 'esfíncter pilórico'],
    ficha: {
      resumo:
        'Mucosa pilórica: fovéolas profundas e glândulas mucosas enoveladas, com células G produtoras de gastrina.',
      tecidoPrincipal: 'Epitelial glandular exócrino mucoso',
      epitelios: [
        { tipo: 'Simples cilíndrico mucossecretor', onde: 'Superfície e fovéolas profundas.' },
        { tipo: 'Glandular tubular ramificado enovelado (mucoso)', onde: 'Glândulas pilóricas.' },
      ],
      morfologia: [
        'Fovéolas profundas, ocupando cerca de metade da espessura da mucosa.',
        'Glândulas pilóricas curtas, enoveladas, de células mucosas claras.',
        'Poucas células parietais; células G (enteroendócrinas) dispersas.',
        'Camada circular da muscular própria espessada — o esfíncter pilórico.',
      ],
      celulas: [
        { nome: 'Células mucosas (superfície e glândulas)', pct: 45, nota: 'Citoplasma claro.' },
        { nome: 'Células musculares lisas', pct: 30, nota: 'Esfíncter espesso.' },
        { nome: 'Linfócitos, plasmócitos e fibroblastos', pct: 15, nota: 'Lâmina própria.' },
        { nome: 'Células enteroendócrinas (G)', pct: 5, nota: 'Basais.' },
        { nome: 'Células parietais', pct: 5, nota: 'Raras.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 40, onde: 'Muscular própria (esfíncter).' },
        { tipo: 'epitelial-glandular-exocrino', pct: 25, onde: 'Glândulas pilóricas.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Superfície e fovéolas.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Lâmina própria e submucosa.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Serosa.' },
      ],
      reconhecer: [
        'Fovéolas profundas e glândulas claras enoveladas.',
        'Muscular muito espessa.',
      ],
      diferencial: ['Corpo/fundo: fovéolas rasas e glândulas retas ricas em parietais.', 'Duodeno: vilosidades e glândulas de Brunner na submucosa.'],
    },
  },
  {
    id: 'duodeno',
    nome: 'Duodeno',
    sistema: 'digestorio',
    sinonimos: ['duodenum', 'glândulas de Brunner', 'vilosidades', 'criptas de Lieberkühn', 'enterócitos', 'intestino delgado'],
    ficha: {
      resumo:
        'Primeiro segmento do intestino delgado: vilosidades, criptas e as glândulas de Brunner na submucosa, que neutralizam o ácido gástrico.',
      tecidoPrincipal: 'Epitelial (mucosa absortiva) e glandular (Brunner)',
      epitelios: [
        { tipo: 'Simples cilíndrico com borda em escova e células caliciformes', onde: 'Vilosidades e criptas.' },
        { tipo: 'Glandular tubuloacinoso mucoso (glândulas de Brunner)', onde: 'Submucosa.' },
      ],
      morfologia: [
        'Vilosidades largas, em folha, cobertas por enterócitos com borda em escova.',
        'Criptas de Lieberkühn entre as vilosidades, com células de Paneth (grânulos eosinófilos) na base.',
        'Glândulas de Brunner na submucosa: ácinos mucosos claros que atravessam a muscular da mucosa.',
        'Lâmina própria rica em linfócitos e plasmócitos.',
        'Muscular própria circular interna e longitudinal externa.',
      ],
      celulas: [
        { nome: 'Enterócitos', pct: 30, nota: 'Cilíndricos, borda em escova.' },
        { nome: 'Células mucosas das glândulas de Brunner', pct: 20, nota: 'Claras, na submucosa.' },
        { nome: 'Células musculares lisas', pct: 15, nota: 'Muscular própria.' },
        { nome: 'Linfócitos, plasmócitos e macrófagos', pct: 15, nota: 'Lâmina própria.' },
        { nome: 'Células caliciformes', pct: 10, nota: 'Entre os enterócitos.' },
        { nome: 'Células de Paneth e enteroendócrinas', pct: 5, nota: 'Base das criptas.' },
        { nome: 'Fibroblastos e células endoteliais', pct: 5, nota: 'Eixo das vilosidades.' },
      ],
      tecidos: [
        { tipo: 'epitelial-revestimento', pct: 25, onde: 'Vilosidades e criptas.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 20, onde: 'Glândulas de Brunner.' },
        { tipo: 'muscular-liso', pct: 20, onde: 'Muscular própria e da mucosa.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Lâmina própria e submucosa.' },
        { tipo: 'linfoide', pct: 10, onde: 'Infiltrado difuso da lâmina própria.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Adventícia/serosa.' },
      ],
      reconhecer: [
        'Vilosidades na superfície.',
        'Glândulas claras na submucosa (Brunner) — marca exclusiva do duodeno.',
      ],
      diferencial: [
        'Jejuno: vilosidades altas, pregas circulares, sem Brunner.',
        'Piloro: sem vilosidades.',
      ],
    },
  },
  {
    id: 'jejuno',
    nome: 'Jejuno',
    sistema: 'digestorio',
    sinonimos: ['jejunum', 'pregas circulares', 'válvulas coniventes', 'vilosidades', 'intestino delgado', 'absorção'],
    ficha: {
      resumo:
        'Segmento de maior absorção: pregas circulares altas cobertas por vilosidades longas e digitiformes.',
      tecidoPrincipal: 'Epitelial de revestimento absortivo',
      epitelios: [
        { tipo: 'Simples cilíndrico com borda em escova e células caliciformes', onde: 'Vilosidades e criptas.' },
      ],
      morfologia: [
        'Pregas circulares (de Kerckring) com eixo de submucosa, cobertas de vilosidades.',
        'Vilosidades longas e finas, com lácteo central (capilar linfático) e músculo liso no eixo.',
        'Criptas de Lieberkühn com células de Paneth na base.',
        'Sem glândulas na submucosa e com poucas placas de Peyer (comuns no íleo).',
      ],
      celulas: [
        { nome: 'Enterócitos', pct: 40, nota: 'A maioria do epitélio.' },
        { nome: 'Linfócitos, plasmócitos e macrófagos', pct: 20, nota: 'Lâmina própria.' },
        { nome: 'Células musculares lisas', pct: 15, nota: 'Muscular própria e eixo das vilosidades.' },
        { nome: 'Células caliciformes', pct: 10, nota: 'Aumentam em direção ao íleo.' },
        { nome: 'Fibroblastos e células endoteliais', pct: 10, nota: 'Eixo das vilosidades.' },
        { nome: 'Células de Paneth e enteroendócrinas', pct: 5, nota: 'Criptas.' },
      ],
      tecidos: [
        { tipo: 'epitelial-revestimento', pct: 35, onde: 'Vilosidades e criptas.' },
        { tipo: 'conjuntivo-frouxo', pct: 25, onde: 'Lâmina própria e submucosa das pregas.' },
        { tipo: 'muscular-liso', pct: 25, onde: 'Muscular própria e da mucosa.' },
        { tipo: 'linfoide', pct: 10, onde: 'Lâmina própria.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Serosa.' },
      ],
      reconhecer: [
        'Pregas altas cobertas por vilosidades longas.',
        'Nenhuma glândula na submucosa.',
      ],
      diferencial: ['Duodeno: Brunner na submucosa.', 'Cólon: sem vilosidades, criptas retas cheias de caliciformes.'],
    },
  },
  {
    id: 'ileo',
    nome: 'Íleo',
    sistema: 'digestorio',
    sinonimos: ['ileum', 'íleo terminal', 'placas de Peyer', 'Peyer patches', 'GALT', 'células M', 'intestino delgado'],
    ficha: {
      resumo:
        'Porção final do intestino delgado: vilosidades mais curtas, muitas caliciformes e as placas de Peyer — folículos linfoides agregados na mucosa e submucosa.',
      tecidoPrincipal: 'Epitelial de revestimento (mucosa) e linfoide (placas de Peyer)',
      epitelios: [
        { tipo: 'Simples cilíndrico com borda em escova e células caliciformes', onde: 'Vilosidades e criptas.' },
        { tipo: 'Epitélio associado a folículo (com células M)', onde: 'Cúpula sobre as placas de Peyer.' },
      ],
      morfologia: [
        'Vilosidades mais curtas e largas que no jejuno; caliciformes mais numerosas.',
        'Placas de Peyer: vários folículos linfoides com centros germinativos, na lâmina própria e invadindo a submucosa, do lado oposto ao mesentério.',
        'Sobre os folículos, a cúpula tem epitélio sem vilosidades, com células M que captam antígenos.',
        'Criptas de Lieberkühn com células de Paneth (grânulos eosinófilos) na base.',
        'Muscular da mucosa interrompida pelos folículos; muscular própria em duas camadas; serosa.',
      ],
      celulas: [
        { nome: 'Linfócitos', pct: 35, nota: 'Placas de Peyer e lâmina própria.' },
        { nome: 'Enterócitos', pct: 25, nota: 'Superfície das vilosidades.' },
        { nome: 'Células caliciformes', pct: 12, nota: 'Mais numerosas que no jejuno.' },
        { nome: 'Células musculares lisas', pct: 15, nota: 'Muscular própria e da mucosa.' },
        { nome: 'Plasmócitos, macrófagos e fibroblastos', pct: 8, nota: 'Lâmina própria.' },
        { nome: 'Células de Paneth e enteroendócrinas', pct: 5, nota: 'Criptas.' },
      ],
      tecidos: [
        { tipo: 'linfoide', pct: 30, onde: 'Placas de Peyer e infiltrado da lâmina própria.' },
        { tipo: 'epitelial-revestimento', pct: 25, onde: 'Vilosidades e criptas.' },
        { tipo: 'muscular-liso', pct: 20, onde: 'Muscular própria e da mucosa.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Lâmina própria e submucosa.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Serosa.' },
      ],
      reconhecer: [
        'Vilosidades na superfície e folículos linfoides agregados na base da mucosa.',
        'Muitas células caliciformes.',
      ],
      diferencial: [
        'Apêndice: folículos em anel, mas sem vilosidades (criptas colônicas).',
        'Jejuno: vilosidades altas e poucos folículos isolados.',
      ],
    },
  },
  {
    id: 'colon',
    nome: 'Cólon',
    sistema: 'digestorio',
    sinonimos: ['colon', 'intestino grosso', 'criptas', 'células caliciformes', 'tênias', 'large intestine'],
    ficha: {
      resumo:
        'Intestino grosso: mucosa plana sem vilosidades, com criptas retas e profundas repletas de células caliciformes.',
      tecidoPrincipal: 'Epitelial (mucosa de criptas) e muscular',
      epitelios: [
        { tipo: 'Simples cilíndrico com numerosas células caliciformes', onde: 'Superfície e criptas de Lieberkühn.' },
      ],
      morfologia: [
        'Superfície plana, sem vilosidades.',
        'Criptas retas, paralelas e regulares, como tubos de ensaio enfileirados.',
        'Células caliciformes muito numerosas, claras (muco).',
        'Nódulos linfoides na lâmina própria e submucosa.',
        'Camada longitudinal externa concentrada em três faixas (tênias do cólon).',
      ],
      celulas: [
        { nome: 'Células caliciformes', pct: 30, nota: 'Mais numerosas nas criptas.' },
        { nome: 'Colonócitos (absortivos)', pct: 20, nota: 'Superfície.' },
        { nome: 'Células musculares lisas', pct: 25, nota: 'Muscular própria.' },
        { nome: 'Linfócitos, plasmócitos e macrófagos', pct: 15, nota: 'Lâmina própria.' },
        { nome: 'Fibroblastos e células endoteliais', pct: 10, nota: 'Lâmina própria e submucosa.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 35, onde: 'Muscular própria e da mucosa.' },
        { tipo: 'epitelial-revestimento', pct: 25, onde: 'Criptas e superfície.' },
        { tipo: 'conjuntivo-frouxo', pct: 25, onde: 'Lâmina própria e submucosa.' },
        { tipo: 'linfoide', pct: 10, onde: 'Nódulos linfoides.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Serosa.' },
      ],
      reconhecer: [
        'Mucosa lisa com criptas retas em fila.',
        'Muitas caliciformes.',
      ],
      diferencial: [
        'Apêndice: mesmas criptas, mas luz pequena e anel contínuo de folículos linfoides.',
        'Intestino delgado: vilosidades.',
      ],
    },
  },
  {
    id: 'apendice',
    nome: 'Apêndice vermiforme',
    sistema: 'digestorio',
    sinonimos: ['appendix', 'apêndice cecal', 'folículos linfoides', 'GALT'],
    ficha: {
      resumo:
        'Divertículo do ceco com luz estreita e mucosa colônica infiltrada por um anel quase contínuo de folículos linfoides.',
      tecidoPrincipal: 'Conjuntivo especializado linfoide',
      epitelios: [
        { tipo: 'Simples cilíndrico com células caliciformes', onde: 'Superfície e criptas.' },
      ],
      morfologia: [
        'Luz pequena, irregular, às vezes triangular ou com conteúdo.',
        'Folículos linfoides com centros germinativos na mucosa e submucosa, formando um anel.',
        'Criptas menos numerosas e irregulares, afastadas pelos folículos.',
        'Muscular própria completa (sem tênias) e serosa.',
      ],
      celulas: [
        { nome: 'Linfócitos', pct: 50, nota: 'Folículos e infiltrado difuso.' },
        { nome: 'Células musculares lisas', pct: 20, nota: 'Muscular própria.' },
        { nome: 'Células epiteliais e caliciformes', pct: 15, nota: 'Criptas.' },
        { nome: 'Macrófagos e plasmócitos', pct: 10, nota: 'Centros germinativos e lâmina própria.' },
        { nome: 'Fibroblastos', pct: 5, nota: 'Submucosa.' },
      ],
      tecidos: [
        { tipo: 'linfoide', pct: 40, onde: 'Anel de folículos na mucosa e submucosa.' },
        { tipo: 'muscular-liso', pct: 25, onde: 'Muscular própria.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Submucosa.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Mucosa.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Serosa e mesoapêndice.' },
      ],
      reconhecer: ['Luz pequena cercada por um anel de folículos linfoides.'],
      diferencial: ['Cólon: luz ampla, criptas regulares, folículos esparsos.', 'Tonsila: epitélio estratificado.'],
    },
  },
  {
    id: 'canal-anal',
    nome: 'Canal anal',
    sistema: 'digestorio',
    sinonimos: ['anus', 'junção anorretal', 'esfíncter anal', 'zona de transição anal', 'linha pectínea'],
    ficha: {
      resumo:
        'Transição da mucosa colorretal para o epitélio estratificado e depois para a pele, com os esfíncteres interno (liso) e externo (esquelético).',
      tecidoPrincipal: 'Muscular (esfíncteres) e epitélio em transição',
      epitelios: [
        { tipo: 'Simples cilíndrico com caliciformes', onde: 'Porção retal, acima da zona de transição.' },
        { tipo: 'Estratificado cúbico/cilíndrico (zona de transição)', onde: 'Região das colunas anais.' },
        { tipo: 'Estratificado pavimentoso não queratinizado → queratinizado', onde: 'Abaixo da linha pectínea até a pele perianal.' },
      ],
      morfologia: [
        'Sequência de epitélios ao longo do corte: colônico, de transição, estratificado não queratinizado e pele.',
        'Esfíncter interno: espessamento da camada circular de músculo liso.',
        'Esfíncter externo: músculo esquelético mais externo.',
        'Plexo venoso hemorroidário na submucosa.',
        'Na pele perianal: pelos, glândulas sebáceas e apócrinas (circum-anais).',
      ],
      celulas: [
        { nome: 'Células epiteliais (vários tipos)', pct: 30, nota: 'Ao longo da transição.' },
        { nome: 'Células musculares lisas', pct: 25, nota: 'Esfíncter interno.' },
        { nome: 'Fibras musculares esqueléticas (núcleos)', pct: 15, nota: 'Esfíncter externo.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Submucosa e derme.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Plexo venoso.' },
        { nome: 'Células glandulares', pct: 5, nota: 'Glândulas anais e anexos cutâneos.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 25, onde: 'Esfíncter interno e muscular da mucosa.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Submucosa com plexo venoso.' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Mucosas e epiderme.' },
        { tipo: 'muscular-esqueletico', pct: 15, onde: 'Esfíncter externo.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Derme perianal.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 5, onde: 'Glândulas anais, sebáceas e apócrinas.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Fossa isquioanal.' },
      ],
      reconhecer: ['Mudança de epitélio simples para estratificado e depois para pele no mesmo corte.'],
    },
  },

  // ─── Glândulas anexas ─────────────────────────────────────────────────────
  {
    id: 'parotida',
    nome: 'Glândula parótida',
    sistema: 'glandulas-digestivas',
    sinonimos: ['parotid', 'glandula parotis', 'ácinos serosos', 'ducto estriado', 'ducto intercalar', 'glândula salivar serosa'],
    ficha: {
      resumo:
        'Maior glândula salivar, puramente serosa: ácinos de células basófilas, ductos intercalares longos e ductos estriados evidentes.',
      tecidoPrincipal: 'Epitelial glandular exócrino seroso',
      epitelios: [
        { tipo: 'Simples piramidal (ácinos serosos)', onde: 'Unidades secretoras.' },
        { tipo: 'Simples cúbico baixo', onde: 'Ductos intercalares.' },
        { tipo: 'Simples cilíndrico com estriações basais', onde: 'Ductos estriados.' },
        { tipo: 'Pseudoestratificado a estratificado cilíndrico', onde: 'Ductos excretores interlobulares.' },
      ],
      morfologia: [
        'Lóbulos separados por septos com ductos excretores e vasos.',
        'Ácinos serosos: células piramidais, núcleo redondo basal, citoplasma basófilo na base e grânulos de zimogênio no ápice; luz minúscula.',
        'Ductos estriados: epitélio eosinófilo com estrias basais (mitocôndrias em pregas).',
        'Adipócitos dispersos no parênquima — aumentam com a idade.',
        'Células mioepiteliais em volta dos ácinos.',
      ],
      celulas: [
        { nome: 'Células serosas acinares', pct: 65, nota: 'Basófilas, piramidais.' },
        { nome: 'Células dos ductos', pct: 15, nota: 'Intercalares e estriados.' },
        { nome: 'Adipócitos', pct: 10, nota: 'No estroma.' },
        { nome: 'Células mioepiteliais', pct: 5, nota: 'Achatadas, na periferia dos ácinos.' },
        { nome: 'Fibroblastos, plasmócitos e células endoteliais', pct: 5, nota: 'Septos.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-exocrino', pct: 75, onde: 'Ácinos e ductos.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Septos interlobulares.' },
        { tipo: 'adiposo-unilocular', pct: 10, onde: 'Adipócitos intraglandulares.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Cápsula.' },
      ],
      reconhecer: [
        'Só ácinos escuros (serosos), sem ácinos claros.',
        'Ductos estriados rosados em cada lóbulo.',
      ],
      diferencial: [
        'Pâncreas: também seroso, mas com ilhotas de Langerhans, células centroacinares e sem ductos estriados.',
        'Submandibular: mistura de ácinos serosos e mucosos.',
      ],
    },
  },
  {
    id: 'submandibular',
    nome: 'Glândula submandibular',
    sistema: 'glandulas-digestivas',
    sinonimos: ['submandibular gland', 'glandula submandibularis', 'glândula mista', 'semiluas serosas', 'meias-luas'],
    ficha: {
      resumo:
        'Glândula salivar mista com predomínio seroso: ácinos serosos, túbulos mucosos e semiluas serosas.',
      tecidoPrincipal: 'Epitelial glandular exócrino misto (seromucoso)',
      epitelios: [
        { tipo: 'Simples piramidal (ácinos serosos)', onde: 'Maioria das unidades secretoras.' },
        { tipo: 'Simples cúbico a cilíndrico mucoso', onde: 'Túbulos mucosos com semiluas serosas.' },
        { tipo: 'Simples cilíndrico com estriações basais', onde: 'Ductos estriados, longos e numerosos.' },
      ],
      morfologia: [
        'Maioria de ácinos serosos basófilos.',
        'Túbulos mucosos claros, de citoplasma espumoso e núcleo achatado na base.',
        'Semiluas serosas: capuzes de células serosas sobre as extremidades dos túbulos mucosos (em parte artefato de fixação).',
        'Ductos estriados muito evidentes.',
      ],
      celulas: [
        { nome: 'Células serosas', pct: 55, nota: 'Ácinos e semiluas.' },
        { nome: 'Células mucosas', pct: 20, nota: 'Túbulos claros.' },
        { nome: 'Células dos ductos', pct: 15, nota: 'Estriados e intercalares.' },
        { nome: 'Células mioepiteliais', pct: 5, nota: 'Periféricas.' },
        { nome: 'Fibroblastos, plasmócitos e células endoteliais', pct: 5, nota: 'Estroma.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-exocrino', pct: 80, onde: 'Unidades secretoras e ductos.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Septos.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Cápsula.' },
      ],
      reconhecer: [
        'Mistura de ácinos escuros e claros, com escuros predominando.',
        'Semiluas serosas.',
      ],
      diferencial: ['Sublingual: predomínio mucoso.', 'Parótida: só serosa.'],
    },
  },
  {
    id: 'sublingual',
    nome: 'Glândula sublingual',
    sistema: 'glandulas-digestivas',
    sinonimos: ['sublingual gland', 'glandula sublingualis', 'glândula mucosa', 'túbulos mucosos'],
    ficha: {
      resumo:
        'Glândula salivar mista com predomínio mucoso: túbulos mucosos claros, poucas semiluas serosas e ductos estriados curtos.',
      tecidoPrincipal: 'Epitelial glandular exócrino mucoso',
      epitelios: [
        { tipo: 'Simples cúbico a cilíndrico mucoso', onde: 'Túbulos mucosos.' },
        { tipo: 'Simples piramidal seroso', onde: 'Semiluas serosas.' },
        { tipo: 'Simples cúbico/cilíndrico', onde: 'Ductos, pouco desenvolvidos.' },
      ],
      morfologia: [
        'Túbulos mucosos claros e espumosos em maioria.',
        'Núcleos achatados comprimidos contra a base das células mucosas.',
        'Semiluas serosas presentes, mas menos que na submandibular.',
        'Ductos intercalares e estriados curtos e escassos.',
        'Mais conjuntivo interlobular que as outras salivares.',
      ],
      celulas: [
        { nome: 'Células mucosas', pct: 60, nota: 'Claras.' },
        { nome: 'Células serosas', pct: 15, nota: 'Semiluas.' },
        { nome: 'Células dos ductos', pct: 10, nota: 'Escassos.' },
        { nome: 'Fibroblastos, plasmócitos e células endoteliais', pct: 10, nota: 'Septos.' },
        { nome: 'Células mioepiteliais', pct: 5, nota: 'Periféricas.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-exocrino', pct: 75, onde: 'Túbulos e ductos.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Septos amplos.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Cápsula.' },
      ],
      reconhecer: ['Predomínio de ácinos claros (mucosos).', 'Poucos ductos estriados.'],
      diferencial: ['Submandibular: predomínio seroso e muitos ductos estriados.'],
    },
  },
  {
    id: 'glandula-salivar-menor',
    nome: 'Glândula salivar menor',
    sistema: 'glandulas-digestivas',
    sinonimos: ['minor salivary gland', 'glândulas labiais', 'glândulas bucais', 'glândula mucosa', 'salivares menores'],
    ficha: {
      resumo:
        'Pequenas glândulas espalhadas pela submucosa oral (lábios, bochechas, palato), predominantemente mucosas, que drenam direto para a boca.',
      tecidoPrincipal: 'Epitelial glandular exócrino mucoso',
      epitelios: [
        { tipo: 'Simples cúbico a cilíndrico mucoso (túbulos) com semiluas serosas', onde: 'Unidades secretoras.' },
        { tipo: 'Simples cúbico a estratificado cúbico', onde: 'Ductos curtos, sem ductos estriados desenvolvidos.' },
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Mucosa oral, quando incluída.' },
      ],
      morfologia: [
        'Lóbulos pequenos de túbulos mucosos claros, espumosos, com núcleo achatado na base.',
        'Semiluas serosas ocasionais nas extremidades dos túbulos.',
        'Ductos excretores curtos atravessando a lâmina própria até o epitélio.',
        'Estroma conjuntivo com infiltrado linfocitário focal (comum e normal com a idade).',
        'Mucosa oral de epitélio estratificado pavimentoso na superfície do fragmento.',
      ],
      celulas: [
        { nome: 'Células mucosas', pct: 55, nota: 'Túbulos claros.' },
        { nome: 'Células ductais', pct: 12, nota: 'Ductos curtos.' },
        { nome: 'Células serosas', pct: 8, nota: 'Semiluas.' },
        { nome: 'Células epiteliais da mucosa oral', pct: 10, nota: 'Superfície.' },
        { nome: 'Fibroblastos, linfócitos e plasmócitos', pct: 10, nota: 'Estroma.' },
        { nome: 'Células mioepiteliais', pct: 5, nota: 'Periféricas.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-exocrino', pct: 65, onde: 'Lóbulos glandulares.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Estroma e lâmina própria.' },
        { tipo: 'epitelial-revestimento', pct: 10, onde: 'Mucosa oral.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Tecido adiposo entre os lóbulos.' },
      ],
      reconhecer: ['Lóbulos pequenos de ácinos claros (mucosos) sob um epitélio estratificado.'],
      diferencial: [
        'Sublingual: também mucosa, mas glândula maior, encapsulada, com lóbulos amplos.',
        'Glândulas esofágicas: na submucosa do esôfago, sob muscular da mucosa.',
      ],
    },
  },
  {
    id: 'pancreas',
    nome: 'Pâncreas',
    sistema: 'glandulas-digestivas',
    sinonimos: ['pancreas', 'ilhotas de Langerhans', 'ácinos pancreáticos', 'células centroacinares', 'insulina', 'células beta', 'zimogênio', 'autorradiografia'],
    ficha: {
      resumo:
        'Glândula mista: ácinos serosos exócrinos produtores de enzimas e ilhotas de Langerhans endócrinas, claras, dispersas entre eles.',
      tecidoPrincipal: 'Epitelial glandular exócrino (98 %) e endócrino (ilhotas)',
      epitelios: [
        { tipo: 'Simples piramidal seroso', onde: 'Ácinos pancreáticos.' },
        { tipo: 'Simples pavimentoso a cúbico (centroacinares, intercalares)', onde: 'Início dos ductos, dentro do ácino.' },
        { tipo: 'Simples cúbico a cilíndrico', onde: 'Ductos intralobulares e interlobulares.' },
        { tipo: 'Glandular endócrino em cordões', onde: 'Ilhotas de Langerhans.' },
      ],
      morfologia: [
        'Ácinos serosos com base basófila (RER) e ápice eosinófilo cheio de grânulos de zimogênio.',
        'Células centroacinares pálidas no centro do ácino — marca exclusiva do pâncreas.',
        'Ilhotas de Langerhans: ninhos redondos e pálidos de células endócrinas com capilares.',
        'Sem ductos estriados (diferente das salivares).',
        'Na imuno-histoquímica para insulina, as células β (centro da ilhota) ficam marrons.',
        'Na autorradiografia, os grãos de prata acompanham a proteína marcada: RER (chase 0) → grânulos de zimogênio (chase longo).',
        'Cortes semifinos em resina mostram os grânulos de zimogênio individualmente.',
      ],
      celulas: [
        { nome: 'Células acinares', pct: 80, nota: 'Serosas, polarizadas.' },
        { nome: 'Células das ilhotas (β, α, δ, PP)', pct: 5, nota: 'β ~ 70 % da ilhota, α ~ 20 %.' },
        { nome: 'Células centroacinares e ductais', pct: 10, nota: 'Secretam bicarbonato.' },
        { nome: 'Fibroblastos e células endoteliais', pct: 5, nota: 'Septos e capilares.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-exocrino', pct: 85, onde: 'Ácinos e ductos.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Septos interlobulares.' },
        { tipo: 'epitelial-glandular-endocrino', pct: 5, onde: 'Ilhotas de Langerhans.' },
      ],
      reconhecer: [
        'Ácinos serosos com ilhas claras (ilhotas).',
        'Células centroacinares.',
      ],
      diferencial: [
        'Parótida: ductos estriados, adipócitos, sem ilhotas.',
        'Tireoide: folículos com coloide, não ácinos.',
      ],
    },
  },
  {
    id: 'figado',
    nome: 'Fígado',
    sistema: 'glandulas-digestivas',
    sinonimos: ['liver', 'hepatócitos', 'lóbulo hepático', 'espaço porta', 'tríade portal', 'sinusoides', 'células de Kupffer', 'veia centrolobular', 'nanquim'],
    ficha: {
      resumo:
        'Maior glândula do corpo: placas de hepatócitos irradiando da veia central, separadas por sinusoides, com espaços porta na periferia.',
      tecidoPrincipal: 'Epitelial glandular (hepatócitos em placas)',
      epitelios: [
        { tipo: 'Epitélio glandular em placas (hepatócitos)', onde: 'Todo o parênquima.' },
        { tipo: 'Simples cúbico', onde: 'Ductos biliares interlobulares no espaço porta.' },
        { tipo: 'Simples pavimentoso (endotélio fenestrado dos sinusoides)', onde: 'Entre as placas de hepatócitos.' },
      ],
      morfologia: [
        'Lóbulo clássico hexagonal com veia centrolobular no centro.',
        'Placas de hepatócitos com uma a duas células de espessura, irradiando para a periferia.',
        'Hepatócitos poligonais grandes, com núcleo central redondo, às vezes binucleados.',
        'Sinusoides entre as placas, com células de Kupffer (macrófagos) na parede.',
        'Espaço porta: ramo da veia porta (maior, parede fina), da artéria hepática (menor, parede espessa) e ducto biliar (cúbico).',
        'Com nanquim injetado na veia porta, as células de Kupffer ficam pretas — mostrando a fagocitose.',
        'Com van Gieson, o colágeno dos espaços porta fica vermelho; sem coloração, o corte é quase invisível.',
      ],
      celulas: [
        { nome: 'Hepatócitos', pct: 70, nota: 'Maioria da massa e do número.' },
        { nome: 'Células endoteliais sinusoidais', pct: 10, nota: 'Núcleos finos na parede dos sinusoides.' },
        { nome: 'Células de Kupffer', pct: 10, nota: 'Macrófagos sinusoidais.' },
        { nome: 'Células estreladas (Ito)', pct: 5, nota: 'Espaço de Disse, armazenam vitamina A.' },
        { nome: 'Colangiócitos e fibroblastos portais', pct: 5, nota: 'Espaço porta.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-exocrino', pct: 80, onde: 'Placas de hepatócitos (secreção de bile).' },
        { tipo: 'sangue', pct: 10, onde: 'Sinusoides e veias.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Espaços porta.' },
        { tipo: 'conjuntivo-reticular', pct: 5, onde: 'Trama de fibras reticulares ao longo dos sinusoides.' },
      ],
      reconhecer: [
        'Placas de células grandes e rosadas convergindo para uma veia.',
        'Espaços porta com três estruturas.',
      ],
      diferencial: [
        'Adrenal: cordões retos, cápsula, córtex e medula.',
        'Rim: túbulos e glomérulos, não placas.',
      ],
    },
  },
  {
    id: 'vesicula-biliar',
    nome: 'Vesícula biliar',
    sistema: 'glandulas-digestivas',
    sinonimos: ['gallbladder', 'seios de Rokitansky-Aschoff', 'bile', 'mucosa pregueada'],
    ficha: {
      resumo:
        'Reservatório de bile: mucosa muito pregueada de epitélio simples cilíndrico, sem muscular da mucosa nem submucosa.',
      tecidoPrincipal: 'Epitelial de revestimento e muscular liso',
      epitelios: [
        { tipo: 'Simples cilíndrico alto (sem caliciformes)', onde: 'Mucosa, sobre pregas ramificadas.' },
      ],
      morfologia: [
        'Pregas mucosas altas e ramificadas que, em corte, parecem glândulas ou vilosidades.',
        'Epitélio simples cilíndrico alto com núcleos basais e microvilos curtos — sem células caliciformes.',
        'Lâmina própria frouxa e vascularizada.',
        'Sem muscular da mucosa e sem submucosa.',
        'Camada muscular lisa com feixes em várias direções, entremeados de conjuntivo.',
        'Perimuscular espessa e serosa (ou adventícia na face hepática).',
      ],
      celulas: [
        { nome: 'Células epiteliais cilíndricas', pct: 40, nota: 'Absorvem água e concentram a bile.' },
        { nome: 'Células musculares lisas', pct: 25, nota: 'Camada muscular.' },
        { nome: 'Fibroblastos', pct: 20, nota: 'Lâmina própria e perimuscular.' },
        { nome: 'Linfócitos e plasmócitos', pct: 10, nota: 'Lâmina própria.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Vasos.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-frouxo', pct: 35, onde: 'Lâmina própria e camada perimuscular.' },
        { tipo: 'muscular-liso', pct: 30, onde: 'Camada muscular.' },
        { tipo: 'epitelial-revestimento', pct: 25, onde: 'Mucosa pregueada.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Serosa/adventícia.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Subseroso.' },
      ],
      reconhecer: [
        'Pregas altas com epitélio cilíndrico sem caliciformes.',
        'Ausência de submucosa.',
      ],
      diferencial: [
        'Intestino delgado: caliciformes, criptas e submucosa.',
        'Tuba uterina: pregas também, mas epitélio ciliado.',
      ],
    },
  },
]
