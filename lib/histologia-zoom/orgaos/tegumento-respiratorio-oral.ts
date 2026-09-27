import type { Orgao } from '../tipos'

/** Sistema tegumentar, respiratório e cavidade oral. */
export const ORGAOS_TEGUMENTO_RESPIRATORIO_ORAL: Orgao[] = [
  // ─── Tegumentar ───────────────────────────────────────────────────────────
  {
    id: 'pele-espessa',
    nome: 'Pele espessa',
    sistema: 'tegumentar',
    sinonimos: ['thick skin', 'pele glabra', 'palma', 'planta do pé', 'estrato lúcido', 'epiderme', 'corpúsculo de Meissner', 'glândula écrina'],
    ficha: {
      resumo:
        'Pele de palma e planta: epiderme com cinco estratos e camada córnea muito espessa, sem pelos nem glândulas sebáceas.',
      tecidoPrincipal: 'Epitelial de revestimento estratificado pavimentoso queratinizado',
      epitelios: [
        { tipo: 'Estratificado pavimentoso queratinizado', onde: 'Epiderme — basal, espinhoso, granuloso, lúcido e córneo.' },
        { tipo: 'Estratificado cúbico (ductos) e simples cúbico (porção secretora)', onde: 'Glândulas sudoríparas écrinas na derme profunda.' },
      ],
      morfologia: [
        'Estrato córneo muito espesso, eosinófilo e acelular — mais grosso que o resto da epiderme somado.',
        'Estrato lúcido: faixa fina, clara e homogênea abaixo do córneo (exclusiva da pele espessa).',
        'Estrato granuloso com grânulos de querato-hialina basófilos.',
        'Estrato espinhoso com células poligonais unidas por "pontes" (desmossomos).',
        'Cristas epidérmicas e papilas dérmicas bem desenvolvidas; corpúsculos de Meissner nas papilas.',
        'Glândulas écrinas enoveladas na derme profunda e ductos espiralados atravessando a epiderme.',
        'Corpúsculos de Pacini (lamelados, em cebola) na hipoderme.',
        'Ausência de folículos pilosos e glândulas sebáceas.',
      ],
      celulas: [
        { nome: 'Queratinócitos', pct: 70, nota: 'Todas as camadas da epiderme.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Derme.' },
        { nome: 'Células das glândulas sudoríparas', pct: 10, nota: 'Células claras, escuras e mioepiteliais.' },
        { nome: 'Melanócitos, Langerhans e Merkel', pct: 5, nota: 'Epiderme — melanócitos claros na camada basal.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Plexos dérmicos.' },
      ],
      tecidos: [
        { tipo: 'epitelial-revestimento', pct: 35, onde: 'Epiderme (incluindo o córneo espesso).' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 35, onde: 'Derme reticular.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Derme papilar.' },
        { tipo: 'adiposo-unilocular', pct: 10, onde: 'Hipoderme.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 10, onde: 'Glândulas sudoríparas écrinas.' },
      ],
      reconhecer: [
        'Camada córnea rosa enorme no topo.',
        'Estrato lúcido visível.',
        'Nenhum pelo.',
      ],
      diferencial: [
        'Pele fina: córneo delgado, sem lúcido, com folículos pilosos e sebáceas.',
        'Esôfago: estratificado sem queratina e com camada muscular.',
      ],
    },
  },
  {
    id: 'pele-fina',
    nome: 'Pele fina',
    sistema: 'tegumentar',
    sinonimos: ['thin skin', 'pele pilosa', 'folículo piloso', 'glândula sebácea', 'músculo eretor do pelo', 'epiderme'],
    ficha: {
      resumo:
        'Pele da maior parte do corpo: epiderme delgada com córneo fino, e derme com folículos pilosos e glândulas sebáceas.',
      tecidoPrincipal: 'Epitelial de revestimento e conjuntivo denso (derme)',
      epitelios: [
        { tipo: 'Estratificado pavimentoso queratinizado', onde: 'Epiderme fina, sem estrato lúcido.' },
        { tipo: 'Estratificado (bainhas radiculares) e glandular holócrino', onde: 'Folículos pilosos e glândulas sebáceas.' },
      ],
      morfologia: [
        'Epiderme delgada, estrato córneo fino e frouxo; estrato lúcido ausente.',
        'Folículos pilosos oblíquos, com bulbo, papila dérmica e bainhas radiculares.',
        'Glândulas sebáceas ligadas aos folículos: células claras, vacuolizadas, secreção holócrina.',
        'Músculo eretor do pelo (liso) entre o folículo e a derme papilar.',
        'Derme papilar frouxa e derme reticular densa não modelada.',
        'Glândulas sudoríparas écrinas na derme profunda.',
      ],
      celulas: [
        { nome: 'Queratinócitos (epiderme e folículo)', pct: 50, nota: 'Epiderme e bainhas do pelo.' },
        { nome: 'Fibroblastos', pct: 20, nota: 'Derme.' },
        { nome: 'Sebócitos', pct: 10, nota: 'Células vacuolizadas com núcleo central.' },
        { nome: 'Células das glândulas sudoríparas', pct: 5, nota: 'Écrinas.' },
        { nome: 'Adipócitos', pct: 10, nota: 'Hipoderme.' },
        { nome: 'Melanócitos e células endoteliais', pct: 5, nota: 'Camada basal e vasos.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 40, onde: 'Derme reticular.' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Epiderme e folículos pilosos.' },
        { tipo: 'adiposo-unilocular', pct: 15, onde: 'Hipoderme.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Derme papilar.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 10, onde: 'Glândulas sebáceas e sudoríparas.' },
        { tipo: 'muscular-liso', pct: 5, onde: 'Eretores do pelo.' },
      ],
      reconhecer: [
        'Epiderme fina com córneo delgado.',
        'Folículos pilosos e sebáceas na derme.',
      ],
      diferencial: [
        'Pele espessa: córneo grosso, estrato lúcido, sem pelos.',
        'Lábio: pele numa face, mucosa na outra e músculo esquelético no meio.',
      ],
    },
  },
  {
    id: 'pele-axilar',
    nome: 'Pele axilar',
    sistema: 'tegumentar',
    sinonimos: ['axilla', 'glândula apócrina', 'glândula sudorípara apócrina', 'axila', 'pelo terminal'],
    ficha: {
      resumo:
        'Pele fina da axila, com pelos terminais e as grandes glândulas sudoríparas apócrinas, que desembocam nos folículos.',
      tecidoPrincipal: 'Conjuntivo denso (derme) com glândulas apócrinas',
      epitelios: [
        { tipo: 'Estratificado pavimentoso queratinizado', onde: 'Epiderme.' },
        { tipo: 'Simples cúbico a cilíndrico com secreção apócrina', onde: 'Porção secretora das glândulas apócrinas, com luz ampla.' },
        { tipo: 'Estratificado cúbico', onde: 'Ductos sudoríparos.' },
      ],
      morfologia: [
        'Glândulas apócrinas na derme profunda e hipoderme: luz muito ampla, células eosinófilas com "cabeças" apicais (decapitação).',
        'Células mioepiteliais na base das glândulas apócrinas.',
        'Glândulas écrinas menores, com luz estreita, ao lado — compare as duas.',
        'Folículos pilosos grandes com glândulas sebáceas.',
        'Epiderme fina de pele pilosa.',
      ],
      celulas: [
        { nome: 'Queratinócitos', pct: 35, nota: 'Epiderme e folículos.' },
        { nome: 'Células secretoras apócrinas', pct: 20, nota: 'Eosinófilas, com protrusões apicais.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Derme.' },
        { nome: 'Adipócitos', pct: 15, nota: 'Hipoderme.' },
        { nome: 'Células écrinas e mioepiteliais', pct: 10, nota: 'Écrinas e base das apócrinas.' },
        { nome: 'Sebócitos', pct: 5, nota: 'Glândulas sebáceas.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 30, onde: 'Derme.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 25, onde: 'Apócrinas, écrinas e sebáceas.' },
        { tipo: 'adiposo-unilocular', pct: 20, onde: 'Hipoderme.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Epiderme e folículos.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Derme papilar e em volta das glândulas.' },
      ],
      reconhecer: [
        'Glândulas com luz enorme e epitélio eosinófilo baixo.',
        'Folículos pilosos grossos.',
      ],
      diferencial: ['Glândula mamária: lóbulos com ductos e ácinos em estroma próprio, sem folículos pilosos.'],
    },
  },
  {
    id: 'cicatriz-cutanea',
    nome: 'Cicatriz cutânea',
    sistema: 'tegumentar',
    sinonimos: ['scar', 'cicatriz', 'fibrose', 'reparo', 'tecido de granulação'],
    ficha: {
      resumo:
        'Pele cicatrizada: derme substituída por colágeno novo, fino e paralelo à superfície, sem anexos cutâneos.',
      tecidoPrincipal: 'Conjuntivo denso (colágeno de reparo)',
      epitelios: [
        { tipo: 'Estratificado pavimentoso queratinizado', onde: 'Epiderme sobre a cicatriz, achatada e sem cristas.' },
      ],
      morfologia: [
        'Epiderme regenerada sobre a lesão, com a junção dermoepidérmica achatada (sem papilas).',
        'Colágeno recente: fibras finas, compactas, orientadas paralelamente à superfície.',
        'Ausência de folículos pilosos e glândulas na área cicatricial — contraste com a pele normal nas bordas.',
        'Vasos neoformados verticais e fibroblastos ainda numerosos, conforme a idade da cicatriz.',
      ],
      celulas: [
        { nome: 'Fibroblastos/miofibroblastos', pct: 40, nota: 'Mais numerosos que na derme normal.' },
        { nome: 'Queratinócitos', pct: 35, nota: 'Epiderme.' },
        { nome: 'Células endoteliais', pct: 15, nota: 'Neovasos.' },
        { nome: 'Macrófagos e linfócitos', pct: 10, nota: 'Resíduo inflamatório.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 70, onde: 'Derme cicatricial e derme normal das bordas.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Epiderme.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Derme papilar das bordas e tecido de granulação residual.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Hipoderme.' },
      ],
      reconhecer: [
        'Área de derme sem anexos, com fibras paralelas à superfície.',
        'Epiderme retificada por cima.',
      ],
    },
  },

  // ─── Respiratório ─────────────────────────────────────────────────────────
  {
    id: 'traqueia',
    nome: 'Traqueia',
    sistema: 'respiratorio',
    sinonimos: ['trachea', 'epitélio respiratório', 'cartilagem hialina', 'células caliciformes', 'glândulas seromucosas', 'músculo traqueal', 'PAS'],
    ficha: {
      resumo:
        'Via aérea condutora: epitélio respiratório, submucosa com glândulas seromucosas e anel de cartilagem hialina em C.',
      tecidoPrincipal: 'Cartilagem hialina e epitélio respiratório',
      epitelios: [
        { tipo: 'Pseudoestratificado cilíndrico ciliado com células caliciformes (respiratório)', onde: 'Mucosa, revestindo a luz.' },
        { tipo: 'Simples cúbico/cilíndrico (ácinos e ductos)', onde: 'Glândulas seromucosas da submucosa.' },
      ],
      morfologia: [
        'Epitélio respiratório: núcleos em várias alturas, cílios no ápice, células caliciformes claras (magenta com PAS).',
        'Membrana basal espessa e nítida sob o epitélio.',
        'Lâmina própria com fibras elásticas e tecido linfoide difuso.',
        'Submucosa com glândulas seromucosas: ácinos mucosos claros e semilunas serosas.',
        'Anel de cartilagem hialina em C com pericôndrio; condrócitos em grupos isógenos.',
        'Músculo traqueal (liso) fechando o C na face posterior.',
        'Adventícia de conjuntivo frouxo por fora.',
        'Nos cortes semifinos em resina (azul de toluidina), cílios e corpúsculos basais aparecem com nitidez excepcional.',
      ],
      celulas: [
        { nome: 'Condrócitos', pct: 25, nota: 'Em lacunas na cartilagem.' },
        { nome: 'Células ciliadas', pct: 20, nota: 'As mais numerosas do epitélio.' },
        { nome: 'Células glandulares seromucosas', pct: 20, nota: 'Submucosa.' },
        { nome: 'Células caliciformes', pct: 10, nota: 'Entre as ciliadas.' },
        { nome: 'Células basais', pct: 10, nota: 'Células-tronco na base do epitélio.' },
        { nome: 'Fibroblastos, linfócitos e plasmócitos', pct: 10, nota: 'Lâmina própria.' },
        { nome: 'Células musculares lisas', pct: 5, nota: 'Músculo traqueal.' },
      ],
      tecidos: [
        { tipo: 'cartilagem-hialina', pct: 35, onde: 'Anel em C.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Lâmina própria, submucosa e adventícia.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 15, onde: 'Glândulas seromucosas.' },
        { tipo: 'epitelial-revestimento', pct: 10, onde: 'Epitélio respiratório.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Pericôndrio.' },
        { tipo: 'muscular-liso', pct: 5, onde: 'Músculo traqueal.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Adventícia.' },
      ],
      reconhecer: [
        'Cartilagem hialina grande em faixa curva.',
        'Epitélio pseudoestratificado ciliado na luz.',
        'Glândulas entre o epitélio e a cartilagem.',
      ],
      diferencial: [
        'Esôfago: estratificado pavimentoso, sem cartilagem, com camada muscular dupla.',
        'Brônquio: placas de cartilagem irregulares e músculo liso em espiral, dentro do pulmão.',
      ],
    },
  },
  {
    id: 'epiglote',
    nome: 'Epiglote',
    sistema: 'respiratorio',
    sinonimos: ['epiglottis', 'cartilagem elástica', 'laringe', 'larynx', 'orceína', 'resorcina'],
    ficha: {
      resumo:
        'Lâmina de cartilagem elástica revestida por mucosa: o exemplo clássico de cartilagem elástica, evidenciada por orceína ou resorcina.',
      tecidoPrincipal: 'Conjuntivo especializado cartilagem elástica',
      epitelios: [
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Face lingual e ápice da face laríngea.' },
        { tipo: 'Pseudoestratificado cilíndrico ciliado (respiratório)', onde: 'Parte inferior da face laríngea.' },
      ],
      morfologia: [
        'Eixo central de cartilagem elástica: matriz atravessada por uma rede densa de fibras elásticas escuras.',
        'Condrócitos em lacunas, isolados ou em pequenos grupos; pericôndrio nas duas faces.',
        'Com orceína (marrom) ou resorcina (violeta-escuro), a rede elástica fica evidente em torno das lacunas.',
        'Mucosa com glândulas seromucosas, às vezes alojadas em perfurações da cartilagem.',
        'Epitélio muda de estratificado pavimentoso para respiratório na face laríngea.',
      ],
      celulas: [
        { nome: 'Condrócitos', pct: 45, nota: 'Em lacunas no eixo.' },
        { nome: 'Células epiteliais', pct: 25, nota: 'Duas faces da mucosa.' },
        { nome: 'Células glandulares', pct: 15, nota: 'Glândulas seromucosas.' },
        { nome: 'Fibroblastos e células do pericôndrio', pct: 10, nota: 'Pericôndrio e lâmina própria.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Lâmina própria.' },
      ],
      tecidos: [
        { tipo: 'cartilagem-elastica', pct: 45, onde: 'Eixo central.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Lâmina própria.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Faces lingual e laríngea.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 10, onde: 'Glândulas seromucosas.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Pericôndrio.' },
      ],
      reconhecer: [
        'Cartilagem com rede de fibras escuras (coloração elástica).',
        'Lâmina fina com mucosa nas duas faces.',
      ],
      diferencial: [
        'Cartilagem hialina (traqueia): matriz homogênea, sem fibras visíveis.',
        'Pavilhão auricular: também elástica, mas com pele queratinizada nas duas faces.',
      ],
    },
  },
  {
    id: 'pulmao',
    nome: 'Pulmão',
    sistema: 'respiratorio',
    sinonimos: ['lung', 'alvéolo', 'pneumócito', 'bronquíolo', 'brônquio', 'pleura', 'mesotélio', 'septo interalveolar', 'macrófago alveolar', 'lunge'],
    ficha: {
      resumo:
        'Parênquima de troca gasosa: milhões de alvéolos de parede finíssima, com bronquíolos, vasos e a pleura na superfície.',
      tecidoPrincipal: 'Epitelial de revestimento (alvéolos) sobre conjuntivo elástico',
      epitelios: [
        { tipo: 'Simples pavimentoso (pneumócitos tipo I) com pneumócitos tipo II cúbicos', onde: 'Alvéolos.' },
        { tipo: 'Simples cilíndrico a cúbico ciliado, com células club (Clara)', onde: 'Bronquíolos.' },
        { tipo: 'Pseudoestratificado cilíndrico ciliado', onde: 'Brônquios intrapulmonares.' },
        { tipo: 'Simples pavimentoso (mesotélio)', onde: 'Pleura visceral.' },
      ],
      morfologia: [
        'Aspecto de "renda": espaços alveolares vazios separados por septos finos.',
        'Septos interalveolares com capilares, pneumócitos tipo I (achatados) e tipo II (cúbicos, espumosos).',
        'Macrófagos alveolares (células de poeira) livres na luz ou nos septos, às vezes com pigmento.',
        'Bronquíolos: sem cartilagem nem glândulas, com músculo liso em volta.',
        'Brônquios: placas de cartilagem hialina, glândulas e músculo liso.',
        'Ramos da artéria pulmonar acompanham as vias aéreas; veias correm nos septos.',
        'Pleura visceral com mesotélio e conjuntivo elástico na superfície.',
        'Com orceína, a trama elástica dos septos e da pleura fica marrom.',
      ],
      celulas: [
        { nome: 'Células endoteliais', pct: 35, nota: 'Capilares dos septos — as mais numerosas.' },
        { nome: 'Pneumócitos tipo II', pct: 15, nota: 'Cúbicos, nos cantos dos alvéolos.' },
        { nome: 'Pneumócitos tipo I', pct: 10, nota: 'Achatados; poucos em número, cobrem 95 % da superfície.' },
        { nome: 'Células intersticiais (fibroblastos)', pct: 20, nota: 'Septos.' },
        { nome: 'Macrófagos alveolares', pct: 10, nota: 'Livres ou septais.' },
        { nome: 'Células epiteliais bronquiolares e musculares lisas', pct: 10, nota: 'Vias aéreas.' },
      ],
      tecidos: [
        { tipo: 'epitelial-revestimento', pct: 35, onde: 'Revestimento alveolar, bronquiolar e pleural.' },
        { tipo: 'conjuntivo-elastico', pct: 25, onde: 'Interstício septal e pleura.' },
        { tipo: 'sangue', pct: 20, onde: 'Capilares septais e vasos.' },
        { tipo: 'muscular-liso', pct: 10, onde: 'Bronquíolos e vasos.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Bainhas peribroncovasculares.' },
        { tipo: 'cartilagem-hialina', pct: 5, onde: 'Placas dos brônquios.' },
      ],
      reconhecer: [
        'Renda de espaços vazios separados por paredes finas.',
        'Bronquíolos e vasos acompanhando-se em pares.',
      ],
      diferencial: [
        'Tecido adiposo: espaços vazios sem células nas paredes e núcleo em anel.',
        'Glândula mamária em lactação: alvéolos com secreção e epitélio cúbico.',
      ],
    },
  },

  // ─── Cavidade oral e dentes ───────────────────────────────────────────────
  {
    id: 'labio',
    nome: 'Lábio',
    sistema: 'cavidade-oral',
    sinonimos: ['lip', 'vermelhão', 'orbicular da boca', 'glândulas labiais', 'mucosa labial', 'zona de transição'],
    ficha: {
      resumo:
        'Três faces num só corte: pele por fora, vermelhão no meio e mucosa oral por dentro, com o orbicular da boca no centro.',
      tecidoPrincipal: 'Muscular estriado esquelético (orbicular da boca)',
      epitelios: [
        { tipo: 'Estratificado pavimentoso queratinizado', onde: 'Face cutânea, com pelos e glândulas.' },
        { tipo: 'Estratificado pavimentoso paraqueratinizado fino', onde: 'Vermelhão — papilas altas e capilares próximos à superfície.' },
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Face mucosa (interna).' },
      ],
      morfologia: [
        'Face externa: pele fina com folículos pilosos, sebáceas e sudoríparas.',
        'Vermelhão: epitélio fino, papilas dérmicas altas e vascularizadas — daí a cor vermelha.',
        'Face interna: mucosa com epitélio espesso não queratinizado e glândulas labiais (salivares menores, mucosas) na submucosa.',
        'Centro: feixes do músculo orbicular da boca cortados transversalmente.',
      ],
      celulas: [
        { nome: 'Queratinócitos/células epiteliais', pct: 35, nota: 'Três faces epiteliais.' },
        { nome: 'Fibras musculares esqueléticas (núcleos)', pct: 25, nota: 'Orbicular da boca.' },
        { nome: 'Células glandulares mucosas', pct: 15, nota: 'Glândulas labiais.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Lâmina própria e derme.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Plexo do vermelhão.' },
      ],
      tecidos: [
        { tipo: 'muscular-esqueletico', pct: 35, onde: 'Orbicular da boca.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 20, onde: 'Derme e lâmina própria.' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Pele, vermelhão e mucosa.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 10, onde: 'Glândulas labiais e anexos cutâneos.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Submucosa.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Entre os feixes musculares.' },
      ],
      reconhecer: [
        'Músculo esquelético no centro.',
        'Uma face com pelos e outra com epitélio espesso sem queratina.',
      ],
    },
  },
  {
    id: 'lingua',
    nome: 'Língua',
    sistema: 'cavidade-oral',
    sinonimos: ['tongue', 'papilas filiformes', 'papilas fungiformes', 'botões gustativos', 'músculo intrínseco', 'mastócitos', 'metacromasia'],
    ficha: {
      resumo:
        'Massa de músculo esquelético em três direções, coberta por mucosa com papilas no dorso.',
      tecidoPrincipal: 'Muscular estriado esquelético',
      epitelios: [
        { tipo: 'Estratificado pavimentoso paraqueratinizado', onde: 'Papilas filiformes do dorso.' },
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Face ventral e papilas fungiformes.' },
      ],
      morfologia: [
        'Feixes de músculo esquelético em três planos (longitudinal, transversal e vertical), cortados em todas as direções.',
        'Dorso com papilas filiformes (cônicas, queratinizadas) e fungiformes (em cogumelo).',
        'Face ventral lisa, sem papilas, com mucosa fina.',
        'Glândulas salivares menores entre os feixes musculares (serosas de von Ebner junto às valadas; mucosas na raiz).',
        'Com azul de toluidina, os mastócitos aparecem com grânulos metacromáticos violeta-avermelhados.',
      ],
      celulas: [
        { nome: 'Fibras musculares esqueléticas (núcleos)', pct: 45, nota: 'Núcleos periféricos.' },
        { nome: 'Células epiteliais', pct: 25, nota: 'Mucosa.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Septos e lâmina própria.' },
        { nome: 'Células glandulares', pct: 10, nota: 'Glândulas linguais.' },
        { nome: 'Mastócitos', pct: 5, nota: 'Perivasculares, metacromáticos na toluidina.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Vasos.' },
      ],
      tecidos: [
        { tipo: 'muscular-esqueletico', pct: 60, onde: 'Corpo da língua.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Mucosa do dorso e ventre.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Lâmina própria e septos.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Aponeurose lingual sob o dorso.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 5, onde: 'Glândulas linguais.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Entre feixes musculares.' },
      ],
      reconhecer: [
        'Músculo esquelético entrecruzado em três planos.',
        'Papilas na superfície.',
      ],
      diferencial: ['Lábio: músculo em uma direção só e pele numa das faces.'],
    },
  },
  {
    id: 'papilas-linguais',
    nome: 'Papilas linguais e botões gustativos',
    sistema: 'cavidade-oral',
    sinonimos: ['papila valada', 'papila circunvalada', 'papila foliada', 'papilla vallata', 'papilla foliata', 'botão gustativo', 'glândulas de von Ebner', 'taste bud'],
    ficha: {
      resumo:
        'Papilas valadas e foliadas: as que concentram os botões gustativos, nas paredes laterais, com glândulas serosas de von Ebner.',
      tecidoPrincipal: 'Epitelial de revestimento com neuroepitélio gustativo',
      epitelios: [
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Superfície das papilas e paredes do sulco.' },
        { tipo: 'Neuroepitélio (botões gustativos)', onde: 'Estruturas ovais claras nas paredes laterais das papilas.' },
        { tipo: 'Simples cúbico (ácinos serosos)', onde: 'Glândulas de von Ebner no fundo do sulco.' },
      ],
      morfologia: [
        'Papila valada: grande, circundada por um sulco profundo; não se projeta acima da superfície.',
        'Papila foliada: dobras paralelas separadas por fendas, na borda lateral posterior.',
        'Botões gustativos: estruturas ovais e pálidas no epitélio, com um poro gustativo voltado para o sulco.',
        'Células gustativas alongadas (claras e escuras) e células basais no botão.',
        'Glândulas serosas de von Ebner drenam para o fundo do sulco, lavando os receptores.',
        'Músculo esquelético abaixo.',
      ],
      celulas: [
        { nome: 'Células epiteliais de revestimento', pct: 35, nota: 'Epitélio estratificado.' },
        { nome: 'Células musculares esqueléticas (núcleos)', pct: 25, nota: 'Músculo da língua.' },
        { nome: 'Células serosas (von Ebner)', pct: 15, nota: 'Ácinos serosos.' },
        { nome: 'Células dos botões gustativos', pct: 10, nota: 'Receptoras, de sustentação e basais.' },
        { nome: 'Fibroblastos e células endoteliais', pct: 15, nota: 'Lâmina própria.' },
      ],
      tecidos: [
        { tipo: 'muscular-esqueletico', pct: 35, onde: 'Corpo da língua sob as papilas.' },
        { tipo: 'epitelial-revestimento', pct: 25, onde: 'Revestimento e botões gustativos.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Núcleo conjuntivo das papilas.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 15, onde: 'Glândulas de von Ebner.' },
        { tipo: 'nervoso-snp', pct: 5, onde: 'Fibras nervosas gustativas.' },
      ],
      reconhecer: [
        'Estruturas ovais pálidas no epitélio lateral da papila.',
        'Sulco com glândulas serosas no fundo.',
      ],
    },
  },
  {
    id: 'gengiva',
    nome: 'Gengiva marginal livre',
    sistema: 'cavidade-oral',
    sinonimos: ['gingiva', 'gengiva livre', 'sulco gengival', 'epitélio juncional', 'epitélio sulcular', 'mucosa mastigatória'],
    ficha: {
      resumo:
        'Mucosa mastigatória que abraça o colo do dente: epitélio oral queratinizado, epitélio do sulco e epitélio juncional.',
      tecidoPrincipal: 'Conjuntivo denso (lâmina própria) e epitélio estratificado',
      epitelios: [
        { tipo: 'Estratificado pavimentoso paraqueratinizado/queratinizado', onde: 'Epitélio gengival oral, com cristas longas.' },
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Epitélio sulcular.' },
        { tipo: 'Epitélio juncional (estratificado, poucas camadas)', onde: 'Fundo do sulco, aderido ao dente.' },
      ],
      morfologia: [
        'Face oral com epitélio queratinizado e cristas epiteliais longas e finas.',
        'Sulco gengival raso junto ao dente, revestido por epitélio não queratinizado.',
        'Epitélio juncional fino, afilando em direção apical, aderido ao esmalte ou cemento.',
        'Lâmina própria densa com feixes de fibras gengivais (dentogengivais, circulares).',
        'Infiltrado inflamatório discreto junto ao sulco é normal.',
      ],
      celulas: [
        { nome: 'Queratinócitos', pct: 55, nota: 'Epitélios oral, sulcular e juncional.' },
        { nome: 'Fibroblastos', pct: 25, nota: 'Lâmina própria.' },
        { nome: 'Leucócitos (linfócitos, neutrófilos)', pct: 10, nota: 'Junto ao epitélio juncional.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Plexo subepitelial.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 55, onde: 'Lâmina própria (fibras gengivais).' },
        { tipo: 'epitelial-revestimento', pct: 35, onde: 'Epitélios oral, sulcular e juncional.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Papilas conjuntivas.' },
      ],
      reconhecer: [
        'Epitélio com cristas longas que termina afinando junto ao espaço do dente.',
        'Lâmina própria densa sem submucosa.',
      ],
    },
  },
  {
    id: 'mucosa-palatina',
    nome: 'Mucosa palatina',
    sistema: 'cavidade-oral',
    sinonimos: ['palato duro', 'palatal mucosa', 'mucosa mastigatória', 'rugas palatinas', 'glândulas palatinas'],
    ficha: {
      resumo:
        'Mucosa mastigatória do palato duro: epitélio queratinizado firmemente aderido ao osso, com gordura ou glândulas na submucosa lateral.',
      tecidoPrincipal: 'Conjuntivo denso e epitélio queratinizado',
      epitelios: [
        { tipo: 'Estratificado pavimentoso orto ou paraqueratinizado', onde: 'Superfície oral do palato.' },
        { tipo: 'Simples cúbico/cilíndrico (ácinos mucosos)', onde: 'Glândulas palatinas na submucosa posterior.' },
      ],
      morfologia: [
        'Epitélio espesso queratinizado com cristas longas.',
        'Lâmina própria densa ligada diretamente ao periósteo (mucoperiósteo) na região mediana.',
        'Submucosa lateral: gordura na região anterior, glândulas mucosas na posterior.',
        'Osso palatino na base do corte, quando incluído.',
      ],
      celulas: [
        { nome: 'Queratinócitos', pct: 45, nota: 'Epitélio.' },
        { nome: 'Fibroblastos', pct: 20, nota: 'Lâmina própria.' },
        { nome: 'Células glandulares mucosas', pct: 15, nota: 'Glândulas palatinas.' },
        { nome: 'Adipócitos', pct: 10, nota: 'Submucosa anterior.' },
        { nome: 'Células endoteliais e osteócitos', pct: 10, nota: 'Vasos e osso.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 35, onde: 'Lâmina própria e mucoperiósteo.' },
        { tipo: 'epitelial-revestimento', pct: 25, onde: 'Epitélio queratinizado.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 15, onde: 'Glândulas palatinas.' },
        { tipo: 'adiposo-unilocular', pct: 10, onde: 'Submucosa anterior.' },
        { tipo: 'osso-compacto', pct: 10, onde: 'Palato ósseo.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Submucosa.' },
      ],
      reconhecer: ['Epitélio queratinizado sobre conjuntivo denso aderido a osso.'],
    },
  },
  {
    id: 'periodonto',
    nome: 'Periodonto',
    sistema: 'cavidade-oral',
    sinonimos: ['periodontium', 'ligamento periodontal', 'cemento', 'osso alveolar', 'fibras de Sharpey', 'dente', 'dentina', 'polpa'],
    ficha: {
      resumo:
        'Aparelho de inserção do dente: cemento, ligamento periodontal e osso alveolar, com a raiz de dentina e a polpa ao centro.',
      tecidoPrincipal: 'Conjuntivo denso (ligamento periodontal) e tecidos mineralizados',
      epitelios: [
        { tipo: 'Estratificado pavimentoso (gengiva e epitélio juncional)', onde: 'Na margem cervical, quando incluída.' },
        { tipo: 'Restos epiteliais de Malassez', onde: 'Pequenas ilhas epiteliais dentro do ligamento periodontal.' },
      ],
      morfologia: [
        'Raiz de dentina tubular, com a polpa (conjuntivo frouxo vascularizado) no centro.',
        'Cemento acelular fino no terço cervical e cemento celular (com cementócitos) no apical.',
        'Ligamento periodontal: feixes colágenos oblíquos entre cemento e osso — fibras de Sharpey inseridas nos dois lados.',
        'Osso alveolar (lâmina dura) com osteoblastos e osteoclastos em remodelação.',
        'Com Azan, o colágeno do ligamento fica azul intenso; dentina e osso em tons de azul-avermelhado.',
      ],
      celulas: [
        { nome: 'Fibroblastos do ligamento', pct: 35, nota: 'Alongados, entre os feixes.' },
        { nome: 'Osteócitos e osteoblastos', pct: 20, nota: 'Osso alveolar.' },
        { nome: 'Células da polpa (fibroblastos, odontoblastos)', pct: 20, nota: 'Odontoblastos em paliçada na periferia da polpa.' },
        { nome: 'Cementoblastos e cementócitos', pct: 10, nota: 'Superfície da raiz.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Ligamento e polpa muito vascularizados.' },
        { nome: 'Restos de Malassez', pct: 5, nota: 'Ilhotas epiteliais.' },
      ],
      tecidos: [
        { tipo: 'dentario-mineralizado', pct: 35, onde: 'Dentina e cemento da raiz.' },
        { tipo: 'osso-compacto', pct: 25, onde: 'Osso alveolar.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 20, onde: 'Ligamento periodontal (feixes orientados por função).' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Polpa dentária.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Gengiva e restos epiteliais.' },
      ],
      reconhecer: [
        'Faixa fibrosa estreita entre duas superfícies mineralizadas (raiz e osso).',
        'Dentina tubular com polpa central.',
      ],
    },
  },
  {
    id: 'germe-dentario',
    nome: 'Germe dentário (odontogênese)',
    sistema: 'cavidade-oral',
    sinonimos: ['tooth germ', 'fase de campânula', 'bell stage', 'órgão do esmalte', 'ameloblastos', 'odontoblastos', 'papila dentária', 'retículo estrelado', 'amelogênese'],
    ficha: {
      resumo:
        'Dente em formação: o órgão do esmalte em campânula envolvendo a papila dentária, e as fases secretora e de maturação do esmalte.',
      tecidoPrincipal: 'Tecidos odontogênicos (epitélio odontogênico e ectomesênquima)',
      epitelios: [
        { tipo: 'Epitélio odontogênico — interno (ameloblastos) e externo', onde: 'Órgão do esmalte, delimitando a campânula.' },
        { tipo: 'Estrato intermediário e retículo estrelado', onde: 'Entre os epitélios interno e externo.' },
        { tipo: 'Estratificado pavimentoso (epitélio oral)', onde: 'Superfície, com a lâmina dentária ligando-o ao germe.' },
      ],
      morfologia: [
        'Campânula: órgão do esmalte em forma de sino sobre a papila dentária.',
        'Epitélio interno do esmalte: ameloblastos altos e polarizados, voltados para a papila.',
        'Retículo estrelado: células estreladas em matriz clara abundante, no meio do órgão do esmalte.',
        'Papila dentária: ectomesênquima denso em células; na periferia, odontoblastos em paliçada formando pré-dentina.',
        'Folículo (saco) dentário envolvendo o germe — futuro periodonto.',
        'Fase secretora (incisivo de rato): ameloblastos altos com processos de Tomes; esmalte novo acidófilo.',
        'Fase de maturação: ameloblastos mais baixos, esmalte mais mineralizado e menos corado.',
        'Osso alveolar em formação em volta da cripta.',
      ],
      celulas: [
        { nome: 'Células ectomesenquimais da papila', pct: 30, nota: 'Futuras polpa e odontoblastos.' },
        { nome: 'Células do retículo estrelado', pct: 20, nota: 'Estreladas, afastadas por matriz.' },
        { nome: 'Ameloblastos', pct: 15, nota: 'Cilíndricos altos (epitélio interno).' },
        { nome: 'Odontoblastos', pct: 10, nota: 'Paliçada na periferia da papila.' },
        { nome: 'Células do folículo dentário', pct: 10, nota: 'Envoltório fibroso.' },
        { nome: 'Epitélio externo e estrato intermediário', pct: 10, nota: 'Achatadas.' },
        { nome: 'Osteoblastos', pct: 5, nota: 'Osso alveolar em formação.' },
      ],
      tecidos: [
        { tipo: 'dentario-odontogenico', pct: 55, onde: 'Órgão do esmalte e papila dentária.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Folículo dentário e mesênquima em volta.' },
        { tipo: 'dentario-mineralizado', pct: 10, onde: 'Esmalte e dentina recém-formados.' },
        { tipo: 'osso-primario', pct: 10, onde: 'Osso alveolar em formação.' },
        { tipo: 'epitelial-revestimento', pct: 10, onde: 'Epitélio oral e lâmina dentária.' },
      ],
      reconhecer: [
        'Sino epitelial com miolo claro (retículo estrelado) sobre um núcleo denso de células (papila).',
        'Camadas paralelas de ameloblastos e odontoblastos frente a frente.',
      ],
      diferencial: [
        'Ameloblastoma (patologia): ninhos de epitélio com periferia em paliçada e centro estrelado, mas sem papila e sem organização em campânula.',
      ],
    },
  },
]
