import type { AchadoMarcado, DetalheCaso, EstruturaCaso, TipoMarcacao } from './casos-raio-x-detalhes'

const e = (nome: string, anatomia: string, normal: string, neste: string, alerta?: string): EstruturaCaso =>
  ({ nome, anatomia, normal, neste, alerta })
const m = (titulo: string, descricao: string, tipo: TipoMarcacao = 'achado'): AchadoMarcado => ({ titulo, descricao, tipo })

/** Dossiê da segunda leva — osso e articulação. */
export const DETALHES_LEVA_2_OSTEOARTICULAR: Record<string, DetalheCaso> = {
  'fratura-de-colles': {
    mecanismo: 'A mão espalmada recebe a força com o punho em extensão: a cortical dorsal do rádio distal, mais fina, cede em compressão e a volar em tensão. O fragmento distal gira para o dorso e impacta; a inclinação radial se perde e o rádio encurta em relação à ulna, cuja estiloide frequentemente arranca.',
    estruturas: [
      e('Rádio distal', 'Metáfise a 2 a 3 cm da articulação.', 'Inclinação volar de 11° no perfil, radial de 22° na frontal.', 'Angulado para o dorso, encurtado, cominuído dorsalmente.', 'Desvio volar é Smith, não Colles.'),
      e('Estiloide ulnar', 'Ponta da ulna.', 'Íntegra.', 'Fraturada em metade dos casos — avulsão pelo ligamento triangular.', '—'),
    ],
    marcacoes: {
      1: [
        m('Traço metafisário', 'Fratura transversa do rádio a 2 a 3 cm da articulação.'),
        m('Encurtamento', 'A superfície do rádio ficou no nível ou abaixo da ulna.', 'medida'),
        m('Estiloide ulnar', 'Fragmento avulsionado na ponta da ulna.'),
      ],
      2: [
        m('Angulação dorsal', 'O fragmento distal inclina para o dorso — dorso de garfo.'),
        m('Cominução dorsal', 'Cortical dorsal fragmentada e impactada.'),
      ],
    },
    conduta: 'Redução e gesso na maioria; fixação se instável (cominução dorsal, encurtamento > 3 mm, inclinação dorsal residual > 10°, degrau articular). Investigar osteoporose.',
  },
  'fratura-de-escafoide': {
    mecanismo: 'Com o punho hiperestendido, o escafoide é pressionado contra a borda dorsal do rádio e quebra na cintura. A irrigação entra pelo polo distal e corre para o proximal; a fratura interrompe o fluxo do fragmento proximal, que pode necrosar. A linha inicial é estreita — só aparece quando a reabsorção a alarga.',
    estruturas: [
      e('Cintura do escafoide', 'Parte média do osso, entre os polos.', 'Cortical contínua na incidência com desvio ulnar.', 'Linha lucente transversa, às vezes só na segunda semana.', 'Filme normal não exclui.'),
      e('Polo proximal', 'Extremidade junto ao rádio.', 'Mesma densidade do resto.', 'Pode ficar mais denso — necrose avascular — nas semanas seguintes.', 'Esclerose do polo proximal é mau sinal.'),
    ],
    marcacoes: {
      1: [
        m('Traço na cintura', 'Linha fina atravessando a parte média do escafoide.'),
        m('Incidência', 'PA com desvio ulnar estende o escafoide e expõe o traço.'),
      ],
      2: [
        m('Reabsorção', 'No controle, a linha está mais larga e evidente.'),
      ],
    },
    conduta: 'Imobilizar com dor na tabaqueira mesmo com filme normal; repetir em 10 a 14 dias ou ressonância; fraturas do polo proximal e desviadas: cirurgia.',
  },
  'fratura-do-boxeador': {
    mecanismo: 'O impacto axial sobre a cabeça do 5º metacarpo, com o punho fechado, concentra a força no colo — a região mais estreita. A cortical volar cede e a cabeça inclina para a palma. Os músculos intrínsecos mantêm a angulação, e a rotação do fragmento distal é o que mais compromete a função.',
    estruturas: [
      e('Colo do 5º metacarpo', 'Transição entre diáfise e cabeça.', 'Alinhado com a diáfise.', 'Fraturado, com a cabeça angulada para a palma.', 'Rotação não se vê bem na radiografia — exame clínico.'),
      e('Cabeça do 5º metacarpo', 'Extremidade articular.', 'No eixo.', 'Caída para a palma; encurtamento do metacarpo.', '—'),
    ],
    marcacoes: {
      1: [
        m('Traço no colo', 'Fratura logo abaixo da cabeça do 5º metacarpo.'),
        m('Angulação volar', 'A cabeça inclina para a palma — meça o ângulo na oblíqua.', 'medida'),
        m('Encurtamento', 'O 5º metacarpo ficou mais curto que o esperado.'),
      ],
    },
    conduta: 'Redução e tala em posição intrínseca-plus se angulação < 40° e sem rotação; fixação se maior. Pesquisar ferida de mordida sobre a MCF.',
  },
  'fratura-de-colo-de-femur': {
    mecanismo: 'O osso trabecular do colo, rarefeito pela osteoporose, falha sob a carga lateral da queda. A fratura intracapsular rompe os vasos retinaculares que sobem pelo colo — a cabeça perde o suprimento. O peso do membro roda e encurta o fêmur; a cabeça inclina em varo.',
    estruturas: [
      e('Colo femoral', 'Entre a cabeça e os trocânteres, dentro da cápsula.', 'Cortical medial contínua; ângulo cervicodiafisário 125 a 135°.', 'Cortical interrompida, trabéculas comprimidas, varo.', 'Impactada em valgo: só uma faixa densa.'),
      e('Trocânter menor', 'Projeção posteromedial.', 'Parcialmente escondido pela diáfise.', 'Totalmente exposto — o membro está rodado externamente.', '—'),
    ],
    marcacoes: {
      1: [
        m('Interrupção cortical', 'Degrau na cortical medial do colo, logo abaixo da cabeça.'),
        m('Varo', 'A cabeça inclina para baixo em relação ao colo.'),
        m('Rotação externa', 'Trocânter menor muito visível.'),
      ],
      2: [
        m('Desvio no perfil', 'Angulação e desvio dos fragmentos na incidência axial.'),
      ],
    },
    conduta: 'Cirurgia em 24 a 48 horas: fixação nas não deslocadas, artroplastia nas deslocadas do idoso; ressonância se filme normal e clínica forte.',
  },
  'fratura-intertrocanterica': {
    mecanismo: 'A força da queda atravessa a região trocantérica, esponjosa e vascularizada, fora da cápsula: o traço vai do trocânter maior ao menor, e a tração do iliopsoas arranca o menor. Sem lesão vascular da cabeça, consolida bem — mas a instabilidade e o sangramento são maiores.',
    estruturas: [
      e('Linha intertrocantérica', 'Do trocânter maior ao menor, na face anterior.', 'Contínua.', 'Traço de fratura oblíquo com cominução.', 'Extensão à diáfise muda o implante.'),
      e('Trocânter menor', 'Inserção do iliopsoas.', 'Fixo.', 'Fragmento separado e deslocado para cima — instabilidade posteromedial.', '—'),
    ],
    marcacoes: {
      1: [
        m('Traço oblíquo', 'Fratura entre os trocânteres, com fragmentos.'),
        m('Trocânter menor solto', 'Fragmento deslocado pelo iliopsoas.'),
        m('Varo e encurtamento', 'Diáfise elevada, colo em varo.'),
      ],
    },
    conduta: 'Fixação interna (haste ou placa com parafuso deslizante) em 24 a 48 horas; reposição volêmica; prevenção de tromboembolismo.',
  },
  'luxacao-anterior-de-ombro': {
    mecanismo: 'Abdução com rotação externa alavanca a cabeça contra a borda anteroinferior da glenoide; o lábio e a cápsula anterior cedem e a cabeça escapa para a frente, sob o coracoide. Ao sair, a face posterolateral da cabeça bate na glenoide e se deprime (Hill-Sachs); a borda da glenoide pode fraturar (Bankart).',
    estruturas: [
      e('Cabeça umeral', 'Esfera articular.', 'Centrada na glenoide, sobreposta parcialmente.', 'Subcoracóidea: abaixo e medial à glenoide.', 'Posterior parece no lugar na frontal.'),
      e('Glenoide', 'Cavidade da escápula.', 'Cabeça sobreposta em elipse.', 'Vazia; borda anteroinferior pode ter fragmento (Bankart).', '—'),
    ],
    marcacoes: {
      1: [
        m('Cabeça subcoracóidea', 'Cabeça umeral abaixo do processo coracoide, medial à glenoide.'),
        m('Glenoide vazia', 'Cavidade sem a sobreposição habitual.'),
        m('Tubérculo maior', 'Procure fratura associada.'),
      ],
      2: [
        m('Posição anterior no Y', 'A cabeça está à frente do centro do Y (glenoide).'),
      ],
      3: [
        m('Hill-Sachs', 'Depressão no contorno posterolateral da cabeça após a redução.'),
      ],
    },
    conduta: 'Redução após radiografia (excluir fratura do colo), imobilização curta, radiografia pós-redução; ressonância e estabilização cirúrgica no jovem com recidiva.',
  },
  'luxacao-posterior-de-ombro': {
    mecanismo: 'A contração violenta e simultânea dos rotadores internos (convulsão, choque elétrico) ou o impacto com o braço aduzido empurram a cabeça para trás da glenoide. Travada em rotação interna, a cabeça perde o relevo do tubérculo maior e fica simétrica — a lâmpada. Na frontal, a sobreposição habitual entre cabeça e glenoide desaparece.',
    estruturas: [
      e('Cabeça umeral', 'Esfera.', 'Assimétrica na frontal pelo tubérculo maior lateral.', 'Redonda e simétrica — rotação interna fixa.', 'Rotação interna voluntária também dá lâmpada; a fixidez é clínica.'),
      e('Espaço glenoumeral', 'Entre a cabeça e a borda anterior da glenoide.', '< 6 mm.', 'Alargado — sinal da borda.', '—'),
    ],
    marcacoes: {
      1: [
        m('Lâmpada', 'Cabeça umeral arredondada, sem o contorno do tubérculo maior.'),
        m('Sinal da borda', 'Espaço aumentado entre a cabeça e a glenoide anterior.'),
        m('Perda da sobreposição', 'A cabeça não se sobrepõe à glenoide como deveria.'),
      ],
      2: [
        m('Posição posterior', 'Na axilar, a cabeça está atrás da glenoide.'),
      ],
    },
    conduta: 'Redução sob sedação; TC para Hill-Sachs reverso e fratura da glenoide posterior; luxações crônicas (> 3 semanas) costumam precisar de cirurgia.',
  },
  'fratura-supracondiliana': {
    mecanismo: 'A queda sobre a mão com o cotovelo estendido alavanca o úmero distal, fino entre as fossas coronoide e olecraniana, que quebra transversalmente. O sangue enche a articulação e desloca os coxins de gordura para fora das fossas: o anterior levanta em vela, o posterior aparece. O fragmento distal angula para trás e a linha umeral anterior deixa de cruzar o capítulo.',
    estruturas: [
      e('Coxim gorduroso posterior', 'Gordura na fossa olecraniana.', 'Escondido na fossa — invisível.', 'Visível como faixa lucente atrás do úmero distal — sempre anormal.', '—'),
      e('Linha umeral anterior', 'Tangente à cortical anterior do úmero no perfil.', 'Cruza o terço médio do capítulo.', 'Cruza o terço anterior ou passa à frente — fragmento angulado posteriormente.', 'Perfil sem 90° de flexão distorce.'),
    ],
    marcacoes: {
      1: [
        m('Coxim posterior', 'Faixa lucente atrás do úmero distal — derrame.'),
        m('Vela anterior', 'Coxim anterior elevado e triangular.'),
        m('Traço', 'Linha de fratura supracondiliana, se visível.'),
      ],
      2: [
        m('Linha umeral anterior', 'Não cruza o terço médio do capítulo.', 'referencia'),
      ],
    },
    conduta: 'Tala com derrame sem traço e reavaliar em 7 a 10 dias; fraturas desviadas (Gartland II e III): redução e pinos; exame neurovascular antes e depois.',
  },
  'fratura-de-monteggia-e-galeazzi': {
    mecanismo: 'Rádio e ulna formam um anel fechado pelas articulações radioulnares proximal e distal e pela membrana interóssea. Quando um osso quebra e encurta ou angula, o anel precisa abrir em outro ponto: a articulação do outro osso luxa. Monteggia abre em cima (cabeça do rádio); Galeazzi abre embaixo (ulna distal).',
    estruturas: [
      e('Linha radiocapitelar', 'Eixo do rádio proximal prolongado.', 'Cruza o centro do capítulo em qualquer incidência.', 'Não cruza — cabeça do rádio luxada (Monteggia).', 'Traçar a linha em todo cotovelo de criança.'),
      e('Articulação radioulnar distal', 'Entre a ulna e a incisura do rádio.', 'Espaço < 2 mm, estiloide ulnar alinhada.', 'Alargada, ulna proeminente (Galeazzi).', '—'),
    ],
    marcacoes: {
      1: [
        m('Fratura da ulna', 'Traço no terço proximal ou médio da ulna.'),
        m('Cabeça do rádio luxada', 'A linha radiocapitelar não passa pelo capítulo.', 'referencia'),
      ],
      2: [
        m('Fratura do rádio distal', 'Traço no terço distal do rádio.'),
        m('Radioulnar distal aberta', 'Espaço alargado entre ulna e rádio, estiloide ulnar deslocada.'),
      ],
    },
    conduta: 'Fixação do osso fraturado restaura o comprimento e reduz a luxação; imobilização em supinação (Galeazzi); confirmar a redução da cabeça do rádio no intraoperatório.',
  },
  'fratura-de-tornozelo-weber': {
    mecanismo: 'A rotação do talo dentro da pinça transmite força à fíbula por vias diferentes conforme a posição do pé: supinação-adução avulsiona o maléolo lateral abaixo da sindesmose (A); supinação-rotação externa espirala a fíbula ao nível dela (B); pronação-rotação externa rompe a sindesmose e quebra a fíbula acima (C). A altura do traço prediz a lesão ligamentar.',
    estruturas: [
      e('Maléolo lateral', 'Extremidade distal da fíbula.', 'Íntegro.', 'Traço transverso (A), oblíquo (B) ou acima da sindesmose (C).', 'Fíbula intacta com pinça aberta: olhe o joelho.'),
      e('Espaço claro medial', 'Entre o maléolo medial e o talo, na mortise.', '< 4 mm e igual ao superior.', 'Alargado — deltoide rompido, instável.', 'Requer incidência em mortise (rotação interna de 15°).'),
    ],
    marcacoes: {
      1: [
        m('Weber B', 'Traço oblíquo no nível da sindesmose.'),
        m('Espaço medial', 'Menor que 4 mm — deltoide íntegro, estável.', 'medida'),
      ],
      2: [
        m('Weber C', 'Traço acima da sindesmose.'),
        m('Pinça alargada', 'Espaço tibiofibular aumentado — sindesmose rota.'),
      ],
    },
    conduta: 'A estável em bota; B com espaço medial normal em gesso; B instável e C: fixação com reparo da sindesmose; Maisonneuve exige radiografia da perna inteira.',
  },
  'fratura-de-jones': {
    mecanismo: 'A base do 5º metatarso recebe a tração do fibular curto e da fáscia plantar lateral. A inversão brusca avulsiona a tuberosidade (pseudo-Jones); a carga repetida ou o trauma na junção metafisodiafisária, zona de suprimento arterial precário, produz a fratura de Jones, que consolida mal.',
    estruturas: [
      e('Junção metafisodiafisária', 'A 1,5 a 3 cm da ponta da base.', 'Cortical contínua.', 'Traço transverso — Jones.', 'Zona de má vascularização: pseudartrose frequente.'),
      e('Tuberosidade', 'Ponta proximal da base.', 'Íntegra; na criança, apófise longitudinal.', 'Traço transverso na ponta — avulsão.', 'Apófise é paralela ao osso; fratura é transversa.'),
    ],
    marcacoes: {
      1: [
        m('Fratura de Jones', 'Traço transverso na junção entre metáfise e diáfise.'),
        m('Distância da base', '1,5 a 3 cm da ponta — a zona crítica.', 'medida'),
      ],
      2: [
        m('Avulsão da tuberosidade', 'Traço transverso na ponta proximal, com fragmento pequeno.'),
      ],
    },
    conduta: 'Avulsão: sapato rígido e carga; Jones: gesso sem carga 6 a 8 semanas ou parafuso intramedular (atletas); estresse: parafuso.',
  },
  'lesao-de-lisfranc': {
    mecanismo: 'A base do 2º metatarso está encaixada entre os cuneiformes e presa ao cuneiforme medial pelo ligamento de Lisfranc; não há ligamento entre as bases do 1º e 2º. Carga axial com o pé em flexão plantar rompe o ligamento e os metatarsos deslocam lateralmente e dorsalmente. Sem carga, a articulação pode voltar ao lugar e o filme parecer normal.',
    estruturas: [
      e('Espaço entre 1º e 2º metatarso', 'Base dos dois primeiros raios.', '< 2 mm.', 'Alargado — diástase.', 'Comparar com o pé contralateral.'),
      e('Borda medial do 2º metatarso', 'Base do 2º raio.', 'Alinhada com a borda medial do cuneiforme intermédio.', 'Desalinhada lateralmente.', 'Na oblíqua, a borda medial do 4º alinha com o cuboide.'),
    ],
    marcacoes: {
      1: [
        m('Diástase', 'Espaço entre a base do 1º e do 2º metatarso maior que 2 mm.', 'medida'),
        m('Sinal do fleck', 'Fragmento ósseo pequeno entre as bases — avulsão do ligamento.'),
        m('Desalinhamento', 'Borda medial do 2º metatarso lateral à do cuneiforme intermédio.', 'referencia'),
      ],
    },
    conduta: 'TC para mapear; fixação anatômica (parafusos ou artrodese) — a lesão negligenciada evolui para pé plano doloroso e artrose.',
  },
  'fratura-de-patela': {
    mecanismo: 'A patela é um osso sesamoide dentro do aparelho extensor: contração violenta do quadríceps com o joelho fletido a parte transversalmente e afasta os fragmentos; queda direta a esmaga em estrela. O retináculo, se íntegro, mantém os fragmentos próximos e a extensão possível; se roto, a diástase cresce e o joelho não estende.',
    estruturas: [
      e('Patela', 'Sesamoide anterior ao fêmur distal.', 'Contorno oval contínuo; bipartida tem ossículo superolateral corticalizado.', 'Traço transverso com fragmentos separados.', 'Bipartida: bordas lisas, bilateral, sem dor.'),
      e('Diástase', 'Espaço entre os fragmentos.', '—', 'Maior que 3 mm — retináculo rompido.', 'Degrau articular > 2 mm também é cirúrgico.'),
    ],
    marcacoes: {
      1: [
        m('Traço transverso', 'Fratura dividindo a patela em polo superior e inferior.'),
        m('Diástase', 'Espaço entre os fragmentos, medido no perfil.', 'medida'),
        m('Derrame', 'Lipo-hemartrose na bolsa suprapatelar.'),
      ],
      2: [
        m('Fragmentos na axial', 'Traços verticais e degraus na superfície articular.'),
      ],
    },
    conduta: 'Diástase < 3 mm e extensão ativa preservada: imobilização; caso contrário, banda de tensão ou parafusos; patelectomia parcial em cominuição do polo inferior.',
  },
  'osteoartrose-de-joelho': {
    mecanismo: 'A cartilagem perde proteoglicanos e afina; o osso subcondral, sem amortecimento, espessa (esclerose) e fissura (cistos); as margens produzem osso novo (osteófitos) para ampliar a superfície de carga. O compartimento medial suporta mais peso e gasta primeiro — o joelho entra em varo e o desgaste acelera.',
    estruturas: [
      e('Compartimento medial', 'Entre côndilo e platô mediais.', 'Espaço de 4 a 6 mm, igual ao lateral, com carga.', 'Estreitado ou abolido; esclerose e cistos.', 'Sem carga, o espaço parece normal.'),
      e('Osteófitos', 'Osso novo nas margens.', 'Ausentes.', 'Bicos nas bordas do fêmur, da tíbia e da patela.', '—'),
    ],
    marcacoes: {
      1: [
        m('Estreitamento medial', 'Espaço articular reduzido no compartimento medial, com carga.', 'medida'),
        m('Osteófitos', 'Projeções ósseas nas margens tibiais e femorais.'),
        m('Esclerose e cistos', 'Osso subcondral denso com lucências arredondadas.'),
      ],
      2: [
        m('Patelofemoral', 'Estreitamento e osteófitos entre patela e tróclea na axial.'),
      ],
    },
    conduta: 'Exercício, perda de peso, analgesia; infiltração em crises; artroplastia quando a dor limita a vida apesar do tratamento — a radiografia não define a hora, o paciente define.',
  },
  'gota-tofacea': {
    mecanismo: 'Depósitos de urato (tofos) crescem nas partes moles periarticulares e, pressionando o osso, o reabsorvem de fora para dentro; o osso responde com esclerose na borda e tenta contornar o tofo, formando o lábio pendente. A cartilagem é poupada até tarde — o espaço articular fica normal.',
    estruturas: [
      e('Erosão periarticular', 'Defeito ósseo ao lado da articulação.', 'Ausente.', 'Redonda, com borda esclerótica e lábio saliente — saca-bocado.', 'AR erode na margem sem esclerose.'),
      e('Espaço articular', 'Cartilagem.', 'Normal.', 'Preservado apesar das erosões.', 'Osteopenia periarticular ausente — outro ponto contra AR.'),
    ],
    marcacoes: {
      1: [
        m('Saca-bocado', 'Erosão arredondada com borda esclerótica no 1º metatarsofalangiano.'),
        m('Lábio pendente', 'Osso que se projeta sobre o tofo na borda da erosão.'),
        m('Tofo', 'Massa de partes moles densa, excêntrica, ao lado da articulação.'),
      ],
      2: [
        m('Erosões na mão', 'Saca-bocados nas interfalangianas com espaço preservado.'),
      ],
    },
    conduta: 'Ácido úrico e cristais no líquido; hipouricemiante contínuo (alopurinol) para dissolver tofos; ultrassom e TC de dupla energia mostram urato antes da erosão.',
  },
  'doenca-de-paget': {
    mecanismo: 'Osteoclastos anormais, grandes e hiperativos, reabsorvem osso em frente; os osteoblastos respondem com osso lamelar desorganizado e abundante. O resultado é osso maior, com cortical espessa e trabéculas grosseiras — resistente à compressão mas frágil à flexão, por isso arqueia e fratura em giz.',
    estruturas: [
      e('Cortical', 'Osso compacto periférico.', 'Fina e uniforme.', 'Espessada, com trabéculas grosseiras que invadem a medular.', 'Metástase blástica não espessa a cortical.'),
      e('Tamanho do osso', 'Dimensão total.', 'Simétrico ao contralateral.', 'Aumentado — a assinatura do Paget.', '—'),
    ],
    marcacoes: {
      1: [
        m('Trabéculas grosseiras', 'Padrão trabecular espesso e desorganizado no hemipelve.'),
        m('Cortical espessa', 'Linha iliopectínea engrossada.'),
        m('Osso aumentado', 'Hemipelve maior que o lado oposto.'),
      ],
      2: [
        m('Chama de vela', 'Frente lítica em V avançando pela diáfise.'),
        m('Arqueamento', 'Tíbia curvada, com cortical espessa.'),
      ],
    },
    conduta: 'Fosfatase alcalina e cintilografia para extensão; bisfosfonato (zoledronato) se dor, sítio de risco ou fosfatase muito alta; vigiar sarcoma e fratura.',
  },
  'metastases-osseas': {
    mecanismo: 'Células tumorais colonizam a medula vermelha (esqueleto axial) e secretam fatores que ativam osteoclastos (lise) ou osteoblastos (esclerose). A lise só aparece na radiografia quando 30 a 50% do osso trabecular foi destruído; a cortical rompida e o pedículo apagado são os sinais mais precoces na coluna.',
    estruturas: [
      e('Pedículo vertebral', 'Coluna óssea posterior ao corpo, visto de frente como um "olho".', 'Dois olhos por vértebra.', 'Um pedículo ausente — destruído.', 'Mieloma poupa os pedículos por muito tempo.'),
      e('Pelve', 'Osso ilíaco, sacro, ísquio.', 'Densidade homogênea.', 'Manchas densas (blásticas) ou lucências sem margem (líticas).', 'Ilhas ósseas são únicas e espiculadas.'),
    ],
    marcacoes: {
      1: [
        m('Pedículo ausente', 'Falta um dos "olhos" da vértebra na frontal.'),
        m('Lise sem margem', 'Área de destruição sem borda esclerótica.'),
      ],
      2: [
        m('Metástases blásticas', 'Manchas densas múltiplas na pelve — próstata.'),
      ],
    },
    conduta: 'Cintilografia ou PET para extensão; biópsia se primário desconhecido; radioterapia para dor; fixação profilática em lesão lítica de osso de carga (Mirels).',
  },
  'mieloma-multiplo': {
    mecanismo: 'Os plasmócitos malignos secretam RANKL e outros fatores que ativam osteoclastos e suprimem osteoblastos: reabsorção sem reparo. Cada foco é uma perfuração limpa, sem esclerose ao redor; a soma dá osteopenia difusa. Sem atividade osteoblástica, a cintilografia não capta.',
    estruturas: [
      e('Calota craniana', 'Díploe entre as tábuas.', 'Homogênea.', 'Múltiplas lucências redondas e uniformes — sal e pimenta.', 'Metástases líticas no crânio são de tamanhos variados.'),
      e('Coluna', 'Corpos vertebrais.', 'Densidade normal, pedículos presentes.', 'Osteopenia difusa e fraturas em cunha; pedículos preservados.', 'Fratura vertebral em osteopenia "sem causa" merece eletroforese.'),
    ],
    marcacoes: {
      1: [
        m('Lesões em saca-bocado', 'Lucências redondas, do mesmo tamanho, sem borda esclerótica.'),
        m('Distribuição', 'Por toda a calota, sem predomínio.'),
      ],
      2: [
        m('Lesões endosteais', 'Erosões na face interna da cortical do fêmur.'),
        m('Osteopenia', 'Osso globalmente menos denso.'),
      ],
    },
    conduta: 'Eletroforese e imunofixação, cadeias leves, mielograma; ressonância de corpo inteiro ou TC de baixa dose para estadiar (a cintilografia não serve); tratamento hematológico e bisfosfonato.',
  },
  'osteomielite-aguda': {
    mecanismo: 'Na metáfise, os capilares terminais fazem alças de fluxo lento sem fagócitos eficientes: a bactéria se aloja, multiplica-se e o pus se acumula sob pressão. O pus levanta o periósteo (reação periosteal), corta a irrigação da cortical (sequestro) e o periósteo descolado forma osso novo ao redor (invólucro). Tudo isso leva dias a semanas para aparecer na radiografia.',
    estruturas: [
      e('Metáfise', 'Região adjacente à fise.', 'Trabéculas regulares.', 'Rarefação mal definida, com destruição da cortical.', 'Ewing e histiocitose têm a mesma imagem.'),
      e('Periósteo', 'Membrana que reveste o osso.', 'Invisível.', 'Descolado e ossificando em camadas paralelas à cortical.', 'Reação periosteal aparece 10 a 14 dias após o início.'),
    ],
    marcacoes: {
      1: [
        m('Rarefação metafisária', 'Área mal definida de perda de densidade perto da fise.'),
        m('Reação periosteal', 'Linha de osso novo paralela à cortical.'),
        m('Partes moles', 'Edema apagando os planos de gordura.'),
      ],
      2: [
        m('Sequestro', 'Fragmento denso de osso morto dentro de lucência.'),
        m('Invólucro', 'Casca de osso novo ao redor do sequestro.'),
      ],
    },
    conduta: 'Hemocultura e aspirado; antibiótico venoso após coleta; ressonância para extensão e abscesso; drenagem cirúrgica se abscesso subperiosteal ou falha em 48 a 72 h.',
  },
  osteossarcoma: {
    mecanismo: 'Células mesenquimais malignas produzem osteoide desorganizado e crescem rapidamente através da cortical. O periósteo tenta conter: onde é levantado lentamente, ossifica em camadas; onde o tumor rompe, ele só consegue formar osso nas bordas do descolamento (Codman) e ao longo dos vasos perpendiculares (raio de sol).',
    estruturas: [
      e('Metáfise do fêmur distal', 'Região de crescimento mais ativa do esqueleto.', 'Trabéculas regulares.', 'Lesão mista, destrutiva, com matriz densa em nuvem.', '—'),
      e('Periósteo', 'Membrana de revestimento.', 'Invisível.', 'Triângulo de Codman na borda e espículas perpendiculares (raio de sol).', 'Codman também em osteomielite e Ewing.'),
    ],
    marcacoes: {
      1: [
        m('Lesão metafisária agressiva', 'Área de destruição e esclerose de bordas mal definidas.'),
        m('Raio de sol', 'Espículas perpendiculares à cortical.'),
        m('Triângulo de Codman', 'Periósteo ossificado levantado em triângulo na borda da lesão.'),
        m('Matriz em nuvem', 'Densidade osteoide amorfa fora do osso.'),
      ],
    },
    conduta: 'Ressonância de todo o osso, TC de tórax, cintilografia; biópsia planejada pela equipe oncológica ortopédica; quimioterapia neoadjuvante e ressecção com preservação do membro.',
  },
  osteocondroma: {
    mecanismo: 'Um fragmento da placa de crescimento se separa e continua produzindo osso por ossificação endocondral em direção oposta à fise. Por isso a exostose é contínua com o osso de origem (mesma cortical, mesma medular) e aponta para longe da articulação. Para de crescer quando a fise fecha.',
    estruturas: [
      e('Cortical e medular', 'Osso compacto e esponjoso.', 'Contínuos ao longo do osso.', 'Prolongam-se para dentro da exostose — a continuidade diagnóstica.', 'Lesões sem continuidade medular não são osteocondroma.'),
      e('Capa cartilaginosa', 'Cartilagem no ápice.', '—', 'Invisível na radiografia; irregularidade ou calcificações no ápice sugerem capa espessa.', 'Capa > 2 cm no adulto: condrossarcoma.'),
    ],
    marcacoes: {
      1: [
        m('Exostose', 'Projeção óssea pediculada a partir da metáfise.'),
        m('Continuidade', 'Cortical e medular do fêmur entrando na lesão.'),
        m('Direção', 'Aponta para longe da articulação.', 'referencia'),
      ],
    },
    conduta: 'Observar; ressecção se dor, compressão neurovascular ou crescimento após a maturidade; ressonância para medir a capa quando há suspeita.',
  },
  'fratura-vertebral-por-compressao': {
    mecanismo: 'O corpo vertebral osteoporótico suporta a carga axial pela parede anterior, mais fina; sob flexão, ela cede primeiro e o platô superior afunda. A parede posterior, mais espessa e apoiada nos pedículos, resiste — a vértebra vira cunha sem invadir o canal.',
    estruturas: [
      e('Parede anterior', 'Cortical anterior do corpo.', 'Altura igual à posterior.', 'Colapsada — perda de altura anterior > 20%.', 'Perda de altura em vértebra jovem sem trauma: tumor.'),
      e('Parede posterior', 'Cortical posterior, limite do canal.', 'Reta.', 'Preservada, sem retropulsão.', 'Retropulsão = fratura em explosão.'),
    ],
    marcacoes: {
      1: [
        m('Cunha anterior', 'Corpo vertebral com a frente mais baixa que a parte posterior.'),
        m('Perda de altura', 'Redução > 20% em relação às vértebras vizinhas.', 'medida'),
        m('Parede posterior íntegra', 'Cortical posterior reta, sem fragmento no canal.'),
      ],
    },
    conduta: 'Analgesia, mobilização precoce, órtese se necessário; investigar e tratar osteoporose; ressonância se dor persistente (edema = fratura aguda para vertebroplastia) ou sinais de alerta de malignidade.',
  },
  espondilolistese: {
    mecanismo: 'A pars interarticularis (istmo) conecta as facetas superior e inferior e resiste ao cisalhamento; fraturas de estresse repetidas (ginastas, hiperextensão) a rompem — espondilólise — e o corpo, sem freio posterior, escorrega para a frente. No idoso, a artrose das facetas afrouxa a articulação e o mesmo deslizamento ocorre com o arco íntegro.',
    estruturas: [
      e('Istmo (pars)', 'Entre as facetas, visto na oblíqua como o pescoço do cão escocês.', 'Contínuo.', 'Linha lucente — o colar no pescoço do cão.', 'Só a oblíqua mostra bem; TC confirma.'),
      e('Alinhamento dos corpos', 'Borda posterior de cada corpo no perfil.', 'Linha contínua.', 'Degrau anterior — o corpo de cima à frente do de baixo.', 'Grau de Meyerding pelo percentual.'),
    ],
    marcacoes: {
      1: [
        m('Anterolistese', 'L5 deslocada para a frente sobre S1 no perfil.'),
        m('Grau', 'Percentual do deslizamento em relação ao platô de S1.', 'medida'),
      ],
      2: [
        m('Colar do cão escocês', 'Linha lucente no istmo na incidência oblíqua.'),
      ],
    },
    conduta: 'Ístmica de baixo grau: fisioterapia e restrição de hiperextensão; progressiva ou sintomática com radiculopatia: artrodese; degenerativa: descompressão com ou sem fusão.',
  },
  'espondilite-anquilosante': {
    mecanismo: 'A inflamação das ênteses (inserção de ligamentos no osso) erode e depois ossifica: nas sacroilíacas, erosões seguidas de fusão; na coluna, erosão dos cantos vertebrais (Romanus) e ossificação das fibras externas do ânulo fibroso, que forma pontes verticais e finas entre vértebras — os sindesmófitos. A coluna inteira se funde num tubo rígido.',
    estruturas: [
      e('Sacroilíacas', 'Articulações entre sacro e ilíaco.', 'Espaço nítido de 2 a 4 mm, bordas lisas.', 'Erosões, esclerose e fusão, dos dois lados igualmente.', 'Sacroileíte assimétrica sugere psoriásica ou reativa.'),
      e('Sindesmófitos', 'Ossificação do ânulo.', 'Ausentes.', 'Pontes verticais e finas unindo os corpos, contínuas.', 'Osteófitos são horizontais e grossos.'),
    ],
    marcacoes: {
      1: [
        m('Sacroileíte bilateral', 'Erosões, esclerose ou fusão simétrica das sacroilíacas.'),
        m('Simetria', 'Os dois lados igualmente acometidos.'),
      ],
      2: [
        m('Sindesmófitos', 'Pontes verticais finas entre os corpos vertebrais.'),
        m('Vértebra quadrada', 'Perda da concavidade anterior do corpo.'),
        m('Coluna em bambu', 'Fusão contínua com aspecto ondulado.'),
      ],
    },
    conduta: 'HLA-B27 e ressonância das sacroilíacas nos casos iniciais; anti-inflamatórios, fisioterapia, anti-TNF ou anti-IL-17; trauma na coluna fundida = TC obrigatória.',
  },
  'legg-calve-perthes': {
    mecanismo: 'A cabeça femoral em crescimento tem irrigação precária, dependente de vasos retinaculares; a interrupção (causa desconhecida) mata o osso epifisário. O osso morto não cresce (epífise pequena), fica denso por compressão das trabéculas, fratura sob a cartilagem (crescente) e fragmenta; a revascularização remodela ao longo de anos.',
    estruturas: [
      e('Epífise femoral', 'Núcleo de ossificação da cabeça.', 'Redonda, do mesmo tamanho e densidade da contralateral.', 'Menor, mais densa, depois fragmentada e achatada.', 'Bilateral simétrico: displasia epifisária.'),
      e('Fratura subcondral', 'Linha sob a superfície articular.', 'Ausente.', 'Crescente lucente paralelo à superfície — melhor na incidência em rã.', 'A extensão do crescente prediz a gravidade.'),
    ],
    marcacoes: {
      1: [
        m('Epífise pequena e densa', 'Núcleo menor e mais branco que o contralateral.'),
        m('Espaço articular', 'Alargado medialmente pelo derrame e pela cartilagem espessa.'),
      ],
      2: [
        m('Crescente subcondral', 'Linha lucente sob a superfície da cabeça na incidência em rã.'),
        m('Fragmentação', 'Epífise em pedaços.'),
      ],
    },
    conduta: 'Contenção da cabeça no acetábulo (órtese ou osteotomia conforme idade e extensão), restrição de impacto; ressonância nos casos iniciais.',
  },
  epifisiolise: {
    mecanismo: 'Na puberdade, a fise proximal do fêmur enfraquece (hormônios, obesidade) e se orienta mais verticalmente; o cisalhamento da carga faz a epífise escorregar posteroinferiormente sobre o colo — através da zona hipertrófica da fise. O deslizamento é predominantemente posterior, por isso a incidência em rã é mais sensível que a frontal.',
    estruturas: [
      e('Linha de Klein', 'Tangente à borda superior do colo femoral, na frontal.', 'Corta uma fatia da epífise.', 'Passa acima da epífise ou só a tangencia.', 'Compare com o lado oposto — o deslizamento pode ser bilateral.'),
      e('Fise', 'Placa de crescimento.', 'Fina e regular.', 'Alargada e irregular — pré-deslizamento.', '—'),
    ],
    marcacoes: {
      1: [
        m('Linha de Klein', 'A tangente ao colo não corta a epífise à direita.', 'referencia'),
        m('Fise alargada', 'Placa de crescimento mais larga e irregular do lado afetado.'),
        m('Epífise baixa', 'Núcleo da cabeça mais inferior que o contralateral.'),
      ],
      2: [
        m('Deslizamento posterior', 'Na incidência em rã, a epífise está deslocada para trás do colo.'),
      ],
    },
    conduta: 'Sem carga imediata; fixação in situ com parafuso; avaliar o lado contralateral; endocrinologia se atípico (hipotireoidismo, hipopituitarismo).',
  },
  'luxacao-posterior-de-quadril': {
    mecanismo: 'Com o quadril fletido e aduzido, a força axial pela diáfise (joelho no painel) empurra a cabeça para trás, através da cápsula posterior e frequentemente através da parede posterior do acetábulo. A cabeça, presa pelos músculos em rotação interna e adução, fica acima do acetábulo; os vasos retinaculares se estiram.',
    estruturas: [
      e('Cabeça femoral', 'Esfera.', 'Centrada no acetábulo, mesmo tamanho da contralateral.', 'Acima e lateral ao acetábulo, aparentando ser menor (mais longe do filme).', 'Anterior: inferior e medial, maior.'),
      e('Parede posterior do acetábulo', 'Borda posterior da cavidade.', 'Contínua.', 'Fragmento fraturado em metade dos casos.', 'Fragmento intra-articular impede a redução.'),
    ],
    marcacoes: {
      1: [
        m('Cabeça luxada', 'Cabeça femoral acima e lateral ao acetábulo.'),
        m('Cabeça menor', 'Parece menor que a contralateral — está mais longe do filme.'),
        m('Rotação interna', 'Trocânter menor escondido pela diáfise.'),
        m('Fratura acetabular', 'Fragmento da parede posterior.'),
      ],
    },
    conduta: 'Redução fechada em até 6 horas sob sedação; TC pós-redução para fragmentos e congruência; cirurgia se irredutível, instável ou com fragmento intra-articular; vigiar necrose da cabeça.',
  },
  'fratura-de-clavicula': {
    mecanismo: 'A clavícula é o único elo ósseo entre o membro e o tronco; a queda sobre o ombro transmite a força ao seu terço médio, onde a curvatura muda e o osso é mais fino. O esternocleidomastóideo puxa o fragmento medial para cima; o peso do braço e o peitoral puxam o lateral para baixo e para dentro — cavalgamento.',
    estruturas: [
      e('Terço médio da clavícula', 'Segmento entre as curvas.', 'Contínuo.', 'Fraturado, com fragmentos cavalgados.', 'Terço lateral envolve ligamentos coracoclaviculares.'),
      e('Ápice pulmonar', 'Pulmão abaixo da clavícula.', 'Transparente até a parede.', 'Procure linha pleural — pneumotórax associado.', '—'),
    ],
    marcacoes: {
      1: [
        m('Fratura do terço médio', 'Traço na parte média da clavícula.'),
        m('Fragmento medial elevado', 'Segmento medial puxado para cima.'),
        m('Cavalgamento', 'Fragmentos sobrepostos — encurtamento.', 'medida'),
      ],
    },
    conduta: 'Tipoia 3 a 6 semanas na maioria; placa se encurtamento > 2 cm, cominução, pele ameaçada, lateral deslocada ou politrauma.',
  },
  'osteonecrose-da-cabeca-femoral': {
    mecanismo: 'Corticoide e álcool aumentam a gordura medular e a pressão intraóssea; anemia falciforme e luxação interrompem os vasos. O osso subcondral morto mantém a forma até que as microfraturas acumuladas produzam a fratura subcondral (crescente) e, sob carga, o colapso do segmento. A cartilagem sobrevive por difusão — o espaço fica normal até a artrose secundária.',
    estruturas: [
      e('Osso subcondral de carga', 'Segmento anterossuperior da cabeça.', 'Homogêneo.', 'Esclerose em faixa, depois crescente lucente e achatamento.', 'Ressonância detecta meses antes.'),
      e('Espaço articular', 'Cartilagem.', 'Normal.', 'Preservado apesar do colapso — ao contrário da artrose primária.', '—'),
    ],
    marcacoes: {
      1: [
        m('Esclerose subcondral', 'Faixa densa no segmento superior da cabeça.'),
        m('Crescente', 'Linha lucente curva logo abaixo da superfície articular.'),
      ],
      2: [
        m('Colapso', 'Achatamento do segmento de carga na incidência em rã.'),
        m('Espaço preservado', 'Articulação com espaço normal apesar da deformidade.'),
      ],
    },
    conduta: 'Ressonância dos dois quadris; descompressão do núcleo antes do colapso; artroplastia após colapso com dor; suspender ou reduzir corticoide e álcool.',
  },
}
