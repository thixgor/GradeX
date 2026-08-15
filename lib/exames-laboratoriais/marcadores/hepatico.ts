import type { Marcador } from '../tipos'

/**
 * Função hepática — e por que "função" é um nome enganoso.
 *
 * AST, ALT, FA e GGT não medem função nenhuma: são enzimas que vazam de
 * células lesadas ou que são induzidas por colestase. Quem mede função de fato
 * é a albumina, o INR e a bilirrubina — os três produtos que só o fígado
 * fabrica ou conjuga. Essa distinção organiza toda a leitura do painel
 * hepático, e é ela que separa "transaminases altas" de "insuficiência
 * hepática", duas coisas que o laudo apresenta lado a lado como se fossem
 * a mesma.
 */
export const marcadores: Marcador[] = [
  {
    id: 'ast',
    nome: 'Aspartato aminotransferase',
    sigla: 'AST',
    sinonimos: ['tgo', 'transaminase glutamico oxalacetica', 'aspartato aminotransferase', 'got'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [
      { rotulo: 'Homens', minimo: 10, maximo: 40, unidade: 'U/L' },
      { rotulo: 'Mulheres', minimo: 9, maximo: 32, unidade: 'U/L' },
    ],
    resumo:
      'Enzima presente no fígado, mas também no músculo, no coração e nas hemácias. Sobe quando essas células são lesadas — e nem sempre a célula é hepática.',
    entenda:
      'A AST (a antiga TGO) catalisa a transferência de grupo amino entre o aspartato e o alfa-cetoglutarato. Ela existe em duas formas: uma citoplasmática e outra mitocondrial. Isso importa clinicamente — lesões que rompem a mitocôndria, como a alcoólica, liberam desproporcionalmente mais AST. E como a enzima está longe de ser exclusiva do fígado, AST isolada elevada com ALT normal deve fazer pensar em músculo (dosar CK), coração ou hemólise da amostra antes de fígado.',
    aprofundar: [
      'A relação AST/ALT é uma das ferramentas mais úteis do painel hepático. Abaixo de 1 é o padrão da maioria das hepatopatias — hepatites virais, esteatose, medicamentosa —, porque a ALT é mais concentrada no citoplasma do hepatócito e vaza primeiro. Acima de 2, com GGT elevada, sugere fortemente doença hepática alcoólica: o álcool causa deficiência de piridoxal-5-fosfato (que a ALT precisa mais que a AST) e lesa preferencialmente a mitocôndria, rica em AST. Acima de 1 em paciente sem álcool levanta cirrose estabelecida, em que a relação se inverte pela redução do clearance sinusoidal.',
      'A magnitude da elevação orienta a etiologia melhor do que se costuma reconhecer. Elevações acima de 1.000 U/L têm um diferencial curto: hepatite viral aguda, hepatite isquêmica ("fígado de choque"), hepatite medicamentosa (paracetamol acima de todas) e, ocasionalmente, obstrução biliar aguda por cálculo. A hepatite isquêmica tem assinatura própria: pico muito alto, LDH alto na mesma proporção, e queda rápida em 48 a 72 horas assim que a perfusão é restabelecida.',
      'Transaminases normais não excluem doença hepática avançada. Na cirrose estabelecida, resta pouco hepatócito para lesar, e AST e ALT podem ser normais enquanto albumina, INR e plaquetas já denunciam a doença. É o erro mais comum na leitura do painel: confundir marcador de lesão com marcador de função.',
    ],
    fisiologia: {
      oQueE: 'Aminotransferase dependente de piridoxal-5-fosfato, que transfere o grupo amino do aspartato ao alfa-cetoglutarato, gerando oxaloacetato e glutamato.',
      origem: 'Fígado (citoplasma e mitocôndria), músculo esquelético, miocárdio, rim, cérebro, pâncreas e hemácias.',
      funcao: 'Conecta o metabolismo de aminoácidos ao ciclo de Krebs e participa da gliconeogênese.',
      metabolismo: 'Depurada pelas células sinusoidais hepáticas.',
      meiaVida: 'Cerca de 17 horas — por isso cai mais rápido que a ALT quando a agressão cessa.',
      orgaosEnvolvidos: ['Fígado', 'Músculo esquelético', 'Coração', 'Hemácias'],
      percurso: ['Lesão da membrana celular', 'extravasamento do conteúdo citoplasmático e mitocondrial', 'AST no plasma', 'depuração sinusoidal'],
    },
    aumento: {
      resumo: 'Lesão de célula que contém a enzima — hepática, muscular ou cardíaca — ou hemólise da própria amostra.',
      mecanismos: [
        {
          titulo: 'Lesão hepatocelular',
          explicacao: 'A membrana do hepatócito perde integridade e o conteúdo citoplasmático extravasa. A intensidade acompanha a extensão da necrose.',
          exemplos: [
            { causa: 'Hepatites virais agudas (A, B, C, E)', etapas: ['citotoxicidade mediada por linfócitos T contra hepatócitos infectados', 'necrose hepatocelular', 'AST e ALT ↑↑↑ com ALT > AST'], nota: 'Valores acima de 1.000 U/L com bilirrubina em elevação e INR alargado indicam gravidade.' },
            { causa: 'Hepatite isquêmica (fígado de choque)', etapas: ['hipoperfusão hepática', 'necrose centrolobular', 'AST e ALT ↑↑↑ com LDH ↑ proporcional', 'queda rápida em 48–72h'], nota: 'A queda veloz após restabelecer a perfusão é a assinatura — nenhuma hepatite viral cai assim.' },
            { causa: 'Doença hepática alcoólica', etapas: ['lesão mitocondrial e deficiência de piridoxal-5-fosfato', 'liberação preferencial de AST', 'AST/ALT > 2 com GGT ↑'], nota: 'Raramente ultrapassa 300 U/L: valores muito altos em etilista pedem outra explicação associada.' },
            { causa: 'Doença hepática gordurosa metabólica', etapas: ['esteatose com inflamação', 'lesão hepatocelular crônica de baixo grau', 'ALT ↑ discreta a moderada com AST/ALT < 1'], nota: 'É a causa mais comum de transaminases cronicamente elevadas na população geral.' },
            { causa: 'Hepatite medicamentosa (paracetamol, anti-TB, estatinas, metotrexato)', etapas: ['toxicidade direta ou idiossincrásica', 'necrose hepatocelular', 'AST e ALT ↑'], nota: 'No paracetamol, valores acima de 3.000 U/L são típicos e o INR é o que define gravidade.' },
          ],
        },
        {
          titulo: 'Lesão extra-hepática',
          explicacao: 'A enzima veio de outro tecido — e, se a ALT está normal, o fígado provavelmente não está envolvido.',
          exemplos: [
            { causa: 'Rabdomiólise, exercício intenso, miopatias, dermatomiosite', etapas: ['lesão muscular', 'liberação de AST muscular', 'AST ↑ com ALT normal ou pouco elevada e CK ↑↑'], nota: 'AST elevada com ALT normal exige dosar CK antes de investigar fígado.' },
            { causa: 'Infarto agudo do miocárdio', etapas: ['necrose miocárdica', 'AST ↑'], nota: 'Historicamente usada como marcador cardíaco; hoje substituída pela troponina.' },
            { causa: 'Hemólise', etapas: ['ruptura de hemácias, in vivo ou na amostra', 'liberação de AST eritrocitária', 'AST ↑ com LDH ↑'], nota: 'Amostra hemolisada é causa frequente de AST alta sem doença nenhuma.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Doença hepática gordurosa', 'Álcool', 'Medicamentos'],
        comuns: ['Hepatites virais', 'Lesão muscular', 'Amostra hemolisada'],
        menosComuns: ['Hepatite autoimune', 'Doença celíaca', 'Hemocromatose', 'Doença de Wilson'],
        naoEsquecer: ['Causa muscular quando a ALT está normal', 'Macro-AST (complexo com imunoglobulina, elevação persistente sem doença)'],
        emergencias: ['Hepatite fulminante (transaminases altas com INR alargado e encefalopatia)', 'Hepatite isquêmica por choque'],
      },
    },
    reducao: {
      resumo: 'Deficiência de piridoxina e uremia — sem relevância clínica isolada.',
      mecanismos: [
        {
          titulo: 'Falta de cofator ou inibição',
          explicacao: 'A enzima precisa de piridoxal-5-fosfato para funcionar no ensaio.',
          exemplos: [{ causa: 'Deficiência de vitamina B6, doença renal crônica avançada', etapas: ['atividade enzimática reduzida no ensaio', 'AST ↓'], nota: 'Pode mascarar lesão hepática em dialítico.' }],
        },
      ],
    },
    comparacoes: [
      {
        id: 'hepatocelular-vs-colestatico',
        titulo: 'Padrão hepatocelular × colestático × misto',
        pergunta: 'As enzimas hepáticas subiram. O problema é a célula ou o canalículo?',
        hipoteses: ['Hepatocelular', 'Colestático', 'Misto'],
        linhas: [
          { marcador: 'AST / ALT', celulas: ['↑↑ a ↑↑↑', 'normal ou ↑ leve', '↑'] },
          { marcador: 'Fosfatase alcalina', celulas: ['normal ou ↑ leve', '↑↑', '↑'] },
          { marcador: 'GGT', celulas: ['normal ou ↑ leve', '↑↑', '↑'] },
          { marcador: 'Bilirrubina direta', celulas: ['↑ variável', '↑↑', '↑'] },
          { marcador: 'Relação R (ALT/LSN ÷ FA/LSN)', celulas: ['> 5', '< 2', '2 a 5'] },
          { marcador: 'Causas típicas', celulas: ['vírus, álcool, fármaco, isquemia, autoimune', 'cálculo, tumor, CBP, CEP, fármaco', 'fármacos, sepse, hepatite colestática'] },
        ],
        leitura:
          'A relação R formaliza o que os olhos já veem: divide-se a ALT pelo seu limite superior e a FA pelo dela, e compara-se. Acima de 5, a lesão é da célula — algo está matando hepatócitos e derramando o citoplasma deles. Abaixo de 2, o problema é o fluxo biliar: a bile represada induz a síntese das enzimas canaliculares (FA e GGT), que são de membrana e não vazam por necrose, mas aumentam por indução. Entre 2 e 5, os dois mecanismos coexistem — cenário típico de lesão medicamentosa e de sepse.',
        limites: 'A relação R vale para caracterizar o padrão, não para dar etiologia. Um cálculo impactado no colédoco pode produzir, nas primeiras horas, transaminases acima de 1.000 U/L — padrão hepatocelular puro — antes de virar colestático.',
      },
    ],
    relacionados: [
      { titulo: 'O painel hepático completo', ids: ['alt', 'fosfatase-alcalina', 'ggt', 'bilirrubina-total', 'albumina', 'inr'], leitura: 'AST e ALT medem lesão; FA e GGT medem colestase; albumina e INR medem função sintética; a bilirrubina mede excreção. Só o conjunto diz se há lesão, se há obstrução e se o fígado ainda funciona.' },
      { titulo: 'Se a ALT estiver normal', ids: ['ck', 'ldh'], leitura: 'AST elevada com ALT normal aponta músculo ou hemólise — CK e LDH resolvem antes de qualquer investigação hepática.' },
    ],
    interferentes: {
      preAnalitico: ['Hemólise da amostra eleva falsamente — a AST existe dentro da hemácia.'],
      fisiologico: ['Exercício intenso, massa muscular elevada e obesidade elevam.', 'Valores são discretamente mais baixos em mulheres.'],
      medicamentos: ['Estatinas, amiodarona, metotrexato, isoniazida, antifúngicos azólicos, paracetamol e anabolizantes elevam.'],
      metodo: ['Macro-AST (enzima complexada a imunoglobulina) causa elevação persistente e isolada, sem doença — considerar quando tudo o mais é normal e a elevação não se explica.'],
    },
    cinetica: {
      inicio: 'Sobe em horas após a lesão.',
      normalizacao: 'Meia-vida de ~17 horas: cai antes da ALT quando a agressão cessa.',
      tendencia: 'Queda rápida com bilirrubina em elevação e INR alargando não é melhora — pode significar perda de massa hepática funcionante na hepatite fulminante.',
    },
    normalizacao: [
      { cenario: 'Elevação por esteatose metabólica', caminho: 'Perda de peso, controle de resistência à insulina e abstinência alcoólica. É a única causa comum em que a mudança de hábito é o próprio tratamento.', prazo: 'Meses; a redução de 7 a 10% do peso costuma normalizar.' },
      { cenario: 'Elevação medicamentosa', caminho: 'Avaliar a relação temporal e a gravidade. Suspensão quando indicada; nem toda elevação leve exige interromper um fármaco necessário.', prazo: 'Semanas após a suspensão.' },
      { cenario: 'Hepatite viral aguda', caminho: 'Tratar quando há terapia disponível e acompanhar. A normalização segue a resolução da lesão.', prazo: 'Semanas a meses.' },
      { cenario: 'Hepatite isquêmica', caminho: 'Restaurar a perfusão. O fígado se recupera rapidamente se o insulto hemodinâmico for corrigido.', prazo: '48 a 72 horas para queda acentuada.' },
    ],
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['hepatocelular', 'colestatico'],
    estudarTambem: ['alt', 'ggt', 'fosfatase-alcalina', 'bilirrubina-total', 'inr'],
  },

  {
    id: 'alt',
    nome: 'Alanina aminotransferase',
    sigla: 'ALT',
    sinonimos: ['tgp', 'transaminase glutamico piruvica', 'alanina aminotransferase', 'gpt'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [
      { rotulo: 'Homens', minimo: 10, maximo: 45, unidade: 'U/L' },
      { rotulo: 'Mulheres', minimo: 7, maximo: 35, unidade: 'U/L', observacao: 'Há proposta de reduzir os limites para 30 (homens) e 19 U/L (mulheres) para aumentar a sensibilidade em hepatopatia metabólica.' },
    ],
    resumo:
      'A enzima mais específica do fígado no painel hepático. Concentrada no citoplasma do hepatócito, é a primeira a vazar quando a célula sofre.',
    entenda:
      'A ALT (antiga TGP) é praticamente hepatoexclusiva: existe em pequena quantidade no rim e no músculo, mas sua elevação significa fígado com muito mais confiança que a AST. Como é citoplasmática, vaza precocemente em qualquer lesão de membrana, mesmo sem necrose completa. E como tem meia-vida mais longa (cerca de 47 horas), permanece elevada depois que a AST já começou a cair — o que inverte a relação AST/ALT ao longo da recuperação.',
    fisiologia: {
      oQueE: 'Aminotransferase citoplasmática que converte alanina e alfa-cetoglutarato em piruvato e glutamato.',
      origem: 'Predominantemente hepatócito; quantidades menores em rim e músculo.',
      funcao: 'Participa do ciclo glicose-alanina, transportando nitrogênio do músculo ao fígado para a gliconeogênese.',
      meiaVida: 'Cerca de 47 horas.',
      orgaosEnvolvidos: ['Fígado'],
      percurso: ['Lesão da membrana do hepatócito', 'extravasamento citoplasmático', 'ALT no plasma'],
    },
    aumento: {
      resumo: 'Lesão hepatocelular, em qualquer intensidade. É o marcador mais sensível de agressão ao fígado na prática ambulatorial.',
      mecanismos: [
        {
          titulo: 'Lesão da membrana do hepatócito',
          explicacao: 'Basta o aumento da permeabilidade — não é preciso necrose completa — para a ALT citoplasmática escapar.',
          exemplos: [
            { causa: 'Doença hepática gordurosa metabólica', etapas: ['acúmulo de triglicerídeos no hepatócito', 'lipotoxicidade e estresse oxidativo', 'inflamação de baixo grau', 'ALT ↑ crônica e discreta'], nota: 'A causa número um de ALT persistentemente elevada em adulto assintomático.' },
            { causa: 'Hepatites virais crônicas B e C', etapas: ['inflamação crônica mediada por resposta imune', 'lesão hepatocelular flutuante', 'ALT ↑ intermitente'], nota: 'ALT normal não afasta hepatite crônica ativa — a lesão pode ser flutuante.' },
            { causa: 'Hepatite autoimune', etapas: ['agressão imunomediada aos hepatócitos', 'ALT ↑ com hipergamaglobulinemia e autoanticorpos (FAN, antimúsculo liso, anti-LKM1)'] },
            { causa: 'Hemocromatose, doença de Wilson, deficiência de alfa-1-antitripsina, doença celíaca', etapas: ['dano hepatocelular por acúmulo ou mecanismo imunológico', 'ALT ↑ persistente sem causa evidente'], nota: 'São os diagnósticos a lembrar quando a investigação inicial não explica a elevação.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Doença hepática gordurosa metabólica', 'Álcool', 'Medicamentos'],
        comuns: ['Hepatites B e C', 'Hepatite medicamentosa'],
        menosComuns: ['Hepatite autoimune', 'Hemocromatose', 'Doença celíaca', 'Doença de Wilson'],
        naoEsquecer: ['Doença de Wilson em jovem com hepatopatia inexplicada', 'Deficiência de alfa-1-antitripsina'],
        emergencias: ['Insuficiência hepática aguda (ALT alta com INR > 1,5 e encefalopatia)'],
      },
    },
    reducao: { resumo: 'Deficiência de vitamina B6 e uremia — sem relevância clínica isolada.', mecanismos: [{ titulo: 'Falta de cofator', explicacao: 'A enzima depende de piridoxal-5-fosfato.', exemplos: [{ causa: 'Deficiência de B6, doença renal crônica', etapas: ['atividade enzimática ↓', 'ALT ↓'] }] }] },
    relacionados: [
      { titulo: 'A relação que orienta a etiologia', ids: ['ast', 'ggt'], leitura: 'AST/ALT < 1 é o padrão da maioria das hepatopatias; > 2 com GGT alta sugere álcool; > 1 sem álcool sugere cirrose estabelecida.' },
      { titulo: 'Para saber se o fígado ainda funciona', ids: ['albumina', 'inr', 'bilirrubina-total', 'plaquetas'], leitura: 'Lesão e função são coisas diferentes: transaminases normais com albumina baixa, INR alargado e plaquetopenia indicam cirrose avançada.' },
    ],
    interferentes: {
      fisiologico: ['Obesidade e síndrome metabólica elevam o basal.', 'Exercício extenuante eleva transitoriamente.'],
      medicamentos: ['Estatinas, isoniazida, amiodarona, metotrexato, antifúngicos, anti-inflamatórios e anabolizantes elevam.'],
    },
    utilidade: ['diagnostico', 'rastreamento', 'acompanhamento'],
    padroes: ['hepatocelular'],
    estudarTambem: ['ast', 'ggt', 'ferritina', 'albumina'],
  },

  {
    id: 'fosfatase-alcalina',
    nome: 'Fosfatase alcalina',
    sigla: 'FA',
    sinonimos: ['fal', 'alp', 'fosfatase alcalina total'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'metabolico'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [
      { rotulo: 'Adultos', minimo: 40, maximo: 130, unidade: 'U/L' },
      { rotulo: 'Crianças e adolescentes', texto: 'Até 2 a 3 vezes o valor do adulto', unidade: 'U/L', observacao: 'A isoforma óssea sobe durante o crescimento — elevação fisiológica, não colestase.' },
      { rotulo: 'Gestação (3º trimestre)', texto: 'Até 2 a 4 vezes o normal', unidade: 'U/L', observacao: 'A placenta produz sua própria isoforma.' },
    ],
    resumo:
      'Enzima de membrana presente no canalículo biliar e no osteoblasto. Sobe na colestase — e também em qualquer situação de alta atividade óssea.',
    entenda:
      'A FA não vaza de células mortas: ela é induzida. Quando a bile represa, os ácidos biliares acumulados estimulam a síntese da enzima no canalículo e a liberam da membrana — por isso a elevação demora um a dois dias e persiste depois de resolvida a obstrução. E como a mesma enzima existe no osso, na placenta e no intestino, elevação isolada exige a pergunta seguinte: de onde ela vem? A GGT responde. FA alta com GGT alta é fígado; FA alta com GGT normal é osso, placenta ou intestino.',
    fisiologia: {
      oQueE: 'Metaloenzima de membrana que hidrolisa ésteres de fosfato em pH alcalino; existe em isoformas hepática, óssea, placentária e intestinal.',
      origem: 'Membrana canalicular do hepatócito, osteoblasto, placenta e mucosa intestinal.',
      funcao: 'No osso, participa da mineralização da matriz; no fígado, do transporte canalicular.',
      metabolismo: 'Depuração hepática e reticuloendotelial.',
      meiaVida: 'Cerca de 7 dias — daí a persistência da elevação após a resolução da causa.',
      orgaosEnvolvidos: ['Fígado (canalículo biliar)', 'Osso', 'Placenta', 'Intestino'],
      percurso: ['Colestase', 'acúmulo de ácidos biliares', 'indução da síntese de FA canalicular', 'liberação da membrana para o plasma', 'FA ↑'],
    },
    aumento: {
      resumo: 'Colestase (com GGT alta) ou alta atividade osteoblástica (com GGT normal). A GGT é o desempate.',
      mecanismos: [
        {
          titulo: 'Colestase',
          explicacao: 'A bile represada induz a síntese da enzima e solubiliza a membrana canalicular, liberando FA para o plasma.',
          exemplos: [
            { causa: 'Coledocolitíase, tumor de cabeça de pâncreas, colangiocarcinoma', etapas: ['obstrução mecânica do fluxo biliar', 'acúmulo de ácidos biliares', 'indução de FA e GGT', 'FA ↑↑ com bilirrubina direta ↑'], nota: 'Colestase obstrutiva com dor e febre sugere colangite: é emergência, com necessidade de drenagem.' },
            { causa: 'Colangite biliar primária', etapas: ['destruição autoimune dos ductos biliares interlobulares', 'colestase crônica', 'FA ↑↑ com anticorpo antimitocôndria positivo'], nota: 'Mulher de meia-idade com prurido, fadiga e FA elevada: dosar AMA.' },
            { causa: 'Colangite esclerosante primária', etapas: ['fibrose e estenoses de ductos intra e extra-hepáticos', 'colestase', 'FA ↑↑'], nota: 'Forte associação com retocolite ulcerativa.' },
            { causa: 'Colestase medicamentosa (amoxicilina-clavulanato, anabolizantes, estrogênios, clorpromazina)', etapas: ['lesão do transporte canalicular', 'colestase sem obstrução mecânica', 'FA e GGT ↑'] },
            { causa: 'Lesões ocupando espaço no fígado (metástases, abscessos, granulomas)', etapas: ['compressão de ductos intra-hepáticos', 'colestase focal', 'FA ↑ com bilirrubina frequentemente normal'], nota: 'FA alta com bilirrubina normal e GGT alta sugere lesão infiltrativa — pede imagem.' },
          ],
        },
        {
          titulo: 'Atividade osteoblástica aumentada',
          explicacao: 'O osteoblasto expressa a isoforma óssea, e qualquer situação de formação óssea acelerada eleva a FA total.',
          exemplos: [
            { causa: 'Doença de Paget óssea', etapas: ['remodelação óssea desorganizada e intensa', 'FA ↑↑↑ com GGT normal e cálcio normal'], nota: 'FA muito alta com GGT normal em idoso: pensar em Paget.' },
            { causa: 'Metástases ósseas osteoblásticas, hiperparatireoidismo, osteomalácia, consolidação de fraturas', etapas: ['atividade osteoblástica ↑', 'FA óssea ↑'] },
            { causa: 'Crescimento na infância e adolescência', etapas: ['formação óssea fisiológica intensa', 'FA ↑ normal para a idade'], nota: 'Interpretar com referência pediátrica — não é colestase.' },
          ],
        },
        {
          titulo: 'Origem placentária e intestinal',
          explicacao: 'Outras isoformas contribuem para o total.',
          exemplos: [
            { causa: 'Gestação (3º trimestre)', etapas: ['produção placentária', 'FA ↑ fisiológica'] },
            { causa: 'Pós-prandial em indivíduos dos grupos sanguíneos O e B', etapas: ['isoforma intestinal ↑', 'FA discretamente ↑'], nota: 'Motivo para coletar em jejum.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Colestase medicamentosa', 'Doença óssea', 'Gestação'],
        comuns: ['Coledocolitíase', 'Metástases hepáticas', 'Colangite biliar primária'],
        menosComuns: ['Colangite esclerosante primária', 'Doença de Paget', 'Doenças infiltrativas (sarcoidose, amiloidose)'],
        naoEsquecer: ['Origem óssea quando a GGT está normal'],
        emergencias: ['Colangite aguda'],
      },
    },
    reducao: {
      resumo: 'Hipofosfatasia, hipotireoidismo, deficiência de zinco e magnésio, e desnutrição — incomum e raramente valorizado.',
      mecanismos: [
        {
          titulo: 'Produção ou atividade reduzida',
          explicacao: 'Falta o cofator (zinco, magnésio), o estímulo hormonal ou a enzima é geneticamente deficiente.',
          exemplos: [{ causa: 'Hipofosfatasia, hipotireoidismo, deficiência de zinco, desnutrição, anemia perniciosa', etapas: ['síntese ou atividade enzimática ↓', 'FA ↓'], nota: 'FA persistentemente baixa com fraturas e perda dentária precoce sugere hipofosfatasia.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'O desempate da origem', ids: ['ggt'], leitura: 'FA alta com GGT alta é hepatobiliar; FA alta com GGT normal é óssea, placentária ou intestinal. É o par mais eficiente do painel hepático.' },
      { titulo: 'Para caracterizar a colestase', ids: ['bilirrubina-direta', 'ggt', 'ast', 'alt'], leitura: 'FA e GGT altas com bilirrubina direta alta e transaminases pouco elevadas definem o padrão colestático.' },
    ],
    interferentes: {
      preAnalitico: ['Coleta pós-prandial eleva pela isoforma intestinal.'],
      fisiologico: ['Crescimento, gestação e consolidação de fraturas elevam sem doença hepática.'],
      medicamentos: ['Amoxicilina-clavulanato, anticonvulsivantes, estrogênios e anabolizantes elevam.'],
    },
    cinetica: {
      inicio: 'Sobe 1 a 2 dias após o início da colestase — mais lenta que as transaminases.',
      normalizacao: 'Meia-vida de ~7 dias: permanece elevada por 1 a 2 semanas após a desobstrução.',
      tendencia: 'FA ainda alta dias após a resolução clínica não indica falha do tratamento — indica a meia-vida longa da enzima.',
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['colestatico'],
    estudarTambem: ['ggt', 'bilirrubina-direta', 'calcio', 'pth'],
  },

  {
    id: 'ggt',
    nome: 'Gama-glutamil transferase',
    sigla: 'GGT',
    sinonimos: ['gama gt', 'gamma gt', 'ggtp', 'gama glutamil transpeptidase'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [
      { rotulo: 'Homens', minimo: 10, maximo: 60, unidade: 'U/L' },
      { rotulo: 'Mulheres', minimo: 8, maximo: 40, unidade: 'U/L' },
    ],
    resumo:
      'Enzima canalicular sensível a colestase e a indução enzimática. Muito sensível, pouco específica — sua função principal é confirmar que a FA veio do fígado.',
    entenda:
      'A GGT sobe em quase toda doença hepatobiliar e em muitas situações que não são doença: álcool, medicamentos indutores, obesidade, esteatose, diabetes. Isso a torna má como exame isolado e ótima como acompanhante. O uso mais valioso é responder à pergunta que a fosfatase alcalina deixa aberta: FA alta com GGT alta é colestase hepática; FA alta com GGT normal é osso ou placenta. Elevação isolada e persistente de GGT, sem outras alterações, geralmente reflete álcool, esteatose ou indução medicamentosa — e não exige investigação agressiva.',
    fisiologia: {
      oQueE: 'Enzima de membrana que transfere grupos gama-glutamil, participando do ciclo do glutamato e do metabolismo da glutationa.',
      origem: 'Membrana canalicular do hepatócito e epitélio dos ductos biliares; também presente em rim, pâncreas e intestino, mas a fração sérica é essencialmente hepatobiliar.',
      funcao: 'Recuperar aminoácidos e cisteína a partir da glutationa extracelular — relevante para a defesa antioxidante celular.',
      meiaVida: '7 a 10 dias.',
      orgaosEnvolvidos: ['Fígado', 'Vias biliares'],
      percurso: ['Colestase ou indução enzimática', 'síntese de GGT ↑ na membrana canalicular', 'liberação para o plasma', 'GGT ↑'],
    },
    aumento: {
      resumo: 'Colestase, álcool, indução medicamentosa, esteatose e síndrome metabólica.',
      mecanismos: [
        {
          titulo: 'Colestase',
          explicacao: 'O mesmo mecanismo da fosfatase alcalina: os ácidos biliares induzem a síntese e solubilizam a enzima da membrana canalicular.',
          exemplos: [{ causa: 'Obstrução biliar, colangite biliar primária, colestase medicamentosa', etapas: ['acúmulo de ácidos biliares', 'indução e liberação canalicular', 'GGT ↑ junto com FA ↑'] }],
        },
        {
          titulo: 'Indução enzimática',
          explicacao: 'O álcool e certos fármacos induzem o sistema microssomal hepático, aumentando a síntese da GGT sem que haja colestase ou necrose.',
          exemplos: [
            { causa: 'Consumo crônico de álcool', etapas: ['indução microssomal', 'síntese de GGT ↑', 'GGT ↑ isolada ou com AST/ALT > 2'], nota: 'É o marcador laboratorial mais sensível de consumo alcoólico crônico, embora inespecífico. Normaliza em 2 a 6 semanas de abstinência — o que a torna útil no acompanhamento.' },
            { causa: 'Fenitoína, fenobarbital, carbamazepina, rifampicina', etapas: ['indução do citocromo P450', 'GGT ↑ sem lesão hepática'], nota: 'Elevação esperada; não indica hepatotoxicidade por si só.' },
          ],
        },
        {
          titulo: 'Esteatose e síndrome metabólica',
          explicacao: 'A esteatose e o estresse oxidativo hepático aumentam a expressão da enzima.',
          exemplos: [{ causa: 'Doença hepática gordurosa, obesidade, diabetes tipo 2', etapas: ['esteatose e estresse oxidativo', 'GGT ↑ crônica e moderada'], nota: 'GGT elevada associa-se, epidemiologicamente, a maior risco cardiovascular e de diabetes.' }],
        },
      ],
    },
    reducao: { resumo: 'Sem significado clínico. Valores baixos são normais.', mecanismos: [] },
    relacionados: [
      { titulo: 'A dupla da colestase', ids: ['fosfatase-alcalina', 'bilirrubina-direta'], leitura: 'A GGT existe no painel sobretudo para confirmar a origem hepática da FA. Sozinha, raramente muda a conduta.' },
    ],
    interferentes: {
      fisiologico: ['Obesidade, sexo masculino e idade elevam o basal.'],
      medicamentos: ['Álcool, anticonvulsivantes indutores, rifampicina, estrogênios e AINEs elevam.'],
    },
    cinetica: { normalizacao: 'Normaliza em 2 a 6 semanas de abstinência alcoólica — útil no seguimento.' },
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['colestatico'],
    estudarTambem: ['fosfatase-alcalina', 'ast', 'alt'],
  },

  {
    id: 'bilirrubina-total',
    nome: 'Bilirrubina total',
    sigla: 'BT',
    sinonimos: ['bilirrubinas', 'bt'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'hematologico'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Adultos', minimo: 0.2, maximo: 1.2, unidade: 'mg/dL' },
      { rotulo: 'Icterícia clínica', texto: '> 2,5 a 3,0', unidade: 'mg/dL', observacao: 'Abaixo disso, a icterícia costuma não ser visível — mas o laboratório já a detecta.' },
    ],
    resumo:
      'Produto final da degradação do heme. A pergunta que organiza toda bilirrubina alta é: qual fração predomina, a direta ou a indireta?',
    entenda:
      'A hemácia envelhecida é fagocitada pelo macrófago, o heme é degradado em biliverdina e depois em bilirrubina indireta — lipossolúvel, tóxica, transportada ligada à albumina. O fígado a capta, conjuga com ácido glicurônico (UGT1A1) e a torna hidrossolúvel: é a bilirrubina direta, que é excretada na bile. Cada etapa desse percurso pode falhar, e a fração predominante diz qual falhou. Indireta alta: produz-se demais (hemólise) ou conjuga-se de menos (Gilbert, recém-nascido). Direta alta: conjugou-se, mas não conseguiu sair (colestase intra ou extra-hepática).',
    aprofundar: [
      'A bilirrubina direta não passa pelo filtro glomerular ligada à albumina, mas uma fração livre passa — por isso colúria ocorre na hiperbilirrubinemia direta e nunca na indireta. Isso dá um dado semiológico com valor diagnóstico direto: icterícia sem colúria aponta para causa pré-hepática ou defeito de conjugação; icterícia com colúria e acolia fecal aponta para colestase.',
      'A síndrome de Gilbert afeta cerca de 5 a 10% da população e é a causa mais comum de bilirrubina indireta levemente elevada. A atividade da UGT1A1 é reduzida em torno de 30%, e a bilirrubina sobe em jejum, estresse, infecção e exercício — exatamente quando o paciente costuma fazer exames. É benigna e não exige tratamento; reconhecê-la evita investigações desnecessárias, mas ela também tem relevância farmacológica (irinotecano e atazanavir dependem dessa enzima).',
    ],
    fisiologia: {
      oQueE: 'Pigmento tetrapirrólico amarelo, produto final do catabolismo do grupo heme.',
      origem: '80 a 85% da hemoglobina de hemácias senescentes; o restante de mioglobina, citocromos e eritropoese ineficaz.',
      sintese: 'A heme-oxigenase converte o heme em biliverdina, e a biliverdina-redutase a converte em bilirrubina indireta, no macrófago do sistema reticuloendotelial.',
      circulacao: 'A bilirrubina indireta circula ligada à albumina — insolúvel em água e, por isso, ausente da urina.',
      funcao: 'É produto de excreção, sem função metabólica relevante; em concentrações fisiológicas tem alguma atividade antioxidante plasmática.',
      metabolismo: 'Captada pelo hepatócito, conjugada com ácido glicurônico pela UGT1A1 e transformada em bilirrubina direta, hidrossolúvel.',
      eliminacao: 'Excretada na bile pelo transportador MRP2; no intestino, convertida em urobilinogênio e estercobilina pela microbiota — que dá a cor das fezes.',
      orgaosEnvolvidos: ['Baço e sistema reticuloendotelial', 'Fígado', 'Vias biliares', 'Intestino'],
      percurso: [
        'Hemácia senescente',
        'macrófago degrada o heme',
        'biliverdina',
        'bilirrubina indireta (ligada à albumina)',
        'captação hepatocitária',
        'conjugação pela UGT1A1',
        'bilirrubina direta',
        'excreção biliar',
        'urobilinogênio e estercobilina no intestino',
      ],
    },
    aumento: {
      resumo: 'Produção excessiva, captação/conjugação deficiente, ou excreção obstruída. A fração predominante identifica qual.',
      mecanismos: [
        {
          titulo: 'Predomínio indireto — produção aumentada',
          explicacao: 'Chega mais heme para degradar do que o fígado consegue conjugar. A capacidade de conjugação é grande, então a hemólise isolada raramente ultrapassa 4 a 5 mg/dL em adulto com fígado normal.',
          exemplos: [
            { causa: 'Hemólise de qualquer causa', etapas: ['destruição eritrocitária acelerada', 'produção de bilirrubina indireta ↑', 'capacidade hepática de conjugação excedida', 'BI ↑ com LDH ↑, haptoglobina ↓ e reticulócitos ↑'] },
            { causa: 'Eritropoese ineficaz (megaloblástica, talassemia, mielodisplasia)', etapas: ['destruição intramedular de precursores', 'produção de bilirrubina sem hemólise periférica', 'BI ↑ com reticulócitos baixos'] },
            { causa: 'Reabsorção de grandes hematomas', etapas: ['degradação do heme extravasado', 'BI ↑ transitória'] },
          ],
        },
        {
          titulo: 'Predomínio indireto — conjugação deficiente',
          explicacao: 'A UGT1A1 não dá conta: por variante genética, por imaturidade ou por inibição.',
          exemplos: [
            { causa: 'Síndrome de Gilbert', etapas: ['atividade da UGT1A1 reduzida (~30%)', 'conjugação limitada', 'BI ↑ leve em jejum, estresse ou infecção'], nota: 'Benigna. Bilirrubina total costuma ficar abaixo de 3 mg/dL, com todo o restante do painel hepático normal.' },
            { causa: 'Icterícia fisiológica do recém-nascido', etapas: ['imaturidade da UGT1A1 e maior turnover eritrocitário', 'BI ↑ nos primeiros dias'], nota: 'A bilirrubina indireta é lipossolúvel e atravessa a barreira hematoencefálica: valores muito altos no neonato causam kernicterus.' },
            { causa: 'Síndrome de Crigler-Najjar', etapas: ['deficiência grave ou total da UGT1A1', 'BI ↑↑↑ desde o nascimento'], nota: 'Rara e grave, ao contrário de Gilbert.' },
          ],
        },
        {
          titulo: 'Predomínio direto — colestase',
          explicacao: 'A bilirrubina foi conjugada e não conseguiu sair. Refluindo para o sangue, aparece na urina (colúria) e falta no intestino (acolia).',
          exemplos: [
            { causa: 'Obstrução biliar extra-hepática (cálculo, tumor de pâncreas, estenose)', etapas: ['bloqueio mecânico do fluxo biliar', 'refluxo de bilirrubina direta para o sangue', 'BD ↑ com FA e GGT ↑, colúria e acolia'], nota: 'Icterícia progressiva e indolor com vesícula palpável levanta neoplasia periampular (sinal de Courvoisier).' },
            { causa: 'Colestase intra-hepática (hepatite, cirrose, sepse, medicamentos, gestação)', etapas: ['comprometimento do transporte canalicular', 'excreção de bilirrubina direta ↓', 'BD ↑'], nota: 'Na sepse, a colestase é funcional: as citocinas inibem os transportadores canaliculares sem obstrução alguma.' },
            { causa: 'Síndromes de Dubin-Johnson e Rotor', etapas: ['defeito hereditário do transporte canalicular (MRP2)', 'BD ↑ isolada com painel hepático normal'], nota: 'Benignas — reconhecê-las evita investigação de obstrução inexistente.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Síndrome de Gilbert', 'Hepatopatia alcoólica', 'Coledocolitíase'],
        comuns: ['Hemólise', 'Hepatites virais', 'Colestase medicamentosa'],
        menosComuns: ['Colangite biliar primária', 'Dubin-Johnson', 'Crigler-Najjar'],
        naoEsquecer: ['Neoplasia periampular na icterícia indolor e progressiva', 'Colestase da gestação'],
        emergencias: ['Colangite aguda', 'Insuficiência hepática aguda', 'Kernicterus no neonato'],
      },
    },
    comparacoes: [
      {
        id: 'bilirrubina-direta-vs-indireta',
        titulo: 'Hiperbilirrubinemia indireta × direta',
        pergunta: 'A bilirrubina subiu. Ela ainda não foi conjugada, ou foi conjugada e não conseguiu sair?',
        hipoteses: ['Predomínio indireto', 'Predomínio direto'],
        linhas: [
          { marcador: 'Fração predominante', celulas: ['indireta > 80%', 'direta > 50%'] },
          { marcador: 'Colúria', celulas: ['ausente', 'presente'] },
          { marcador: 'Acolia fecal', celulas: ['ausente', 'presente na obstrução'] },
          { marcador: 'Fosfatase alcalina / GGT', celulas: ['normais', '↑↑'] },
          { marcador: 'LDH / haptoglobina', celulas: ['↑ / ↓ se hemólise', 'normais'] },
          { marcador: 'Causas', celulas: ['hemólise, Gilbert, eritropoese ineficaz', 'colestase, hepatite, obstrução'] },
        ],
        leitura:
          'A bilirrubina indireta é lipossolúvel e circula ligada à albumina — não é filtrada, e por isso a urina permanece clara. A direta é hidrossolúvel: quando reflui para o sangue, é filtrada e escurece a urina. Esse único fato explica a colúria e permite separar os dois grupos à beira do leito, antes do laudo.',
      },
    ],
    relacionados: [
      { titulo: 'Se a fração for indireta', ids: ['ldh', 'haptoglobina', 'reticulocitos', 'hemoglobina'], leitura: 'Painel de hemólise: LDH alto, haptoglobina baixa e reticulócitos altos confirmam destruição; tudo normal com bilirrubina levemente alta sugere Gilbert.' },
      { titulo: 'Se a fração for direta', ids: ['fosfatase-alcalina', 'ggt', 'ast', 'alt'], leitura: 'FA e GGT altas com transaminases pouco elevadas indicam colestase; transaminases muito altas indicam lesão hepatocelular com colestase secundária.' },
    ],
    interferentes: {
      preAnalitico: ['Exposição da amostra à luz degrada a bilirrubina e reduz falsamente o valor.', 'Hemólise da amostra pode interferir no ensaio.'],
      fisiologico: ['Jejum prolongado eleva a fração indireta, sobretudo em portadores de Gilbert.'],
      medicamentos: ['Rifampicina e atazanavir competem pela captação e conjugação, elevando a bilirrubina sem lesão hepática.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['colestatico', 'hemolise'],
    estudarTambem: ['bilirrubina-direta', 'bilirrubina-indireta', 'fosfatase-alcalina', 'ldh'],
  },

  {
    id: 'bilirrubina-direta',
    nome: 'Bilirrubina direta',
    sigla: 'BD',
    sinonimos: ['bilirrubina conjugada', 'bd'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Adultos', texto: '< 0,3', unidade: 'mg/dL' }],
    resumo: 'A bilirrubina já conjugada pelo fígado. Sua elevação significa que a bile não está saindo — em algum ponto entre o canalículo e o duodeno.',
    entenda:
      'Bilirrubina direta elevada é sempre colestase, e a questão seguinte é onde: intra-hepática (hepatite, cirrose, sepse, fármacos, colangite biliar primária) ou extra-hepática (cálculo, tumor, estenose). A imagem responde. Por ser hidrossolúvel, ela aparece na urina — a colúria precede a icterícia visível e é um dos sinais mais precoces de colestase.',
    fisiologia: {
      oQueE: 'Bilirrubina conjugada a uma ou duas moléculas de ácido glicurônico, hidrossolúvel.',
      origem: 'Hepatócito, pela ação da UDP-glicuronosiltransferase (UGT1A1).',
      funcao: 'Forma excretável da bilirrubina — a conjugação é o que permite eliminá-la pela bile.',
      eliminacao: 'Transporte canalicular ativo (MRP2) para a bile; pequena fração filtrada na urina quando há refluxo plasmático.',
      percurso: ['Bilirrubina indireta captada', 'conjugação pela UGT1A1', 'bilirrubina direta', 'MRP2 → canalículo biliar', 'intestino'],
    },
    aumento: {
      resumo: 'Colestase intra-hepática, obstrução extra-hepática ou defeito hereditário de transporte canalicular.',
      mecanismos: [
        {
          titulo: 'Obstrução do fluxo biliar',
          explicacao: 'A bile não escoa e a bilirrubina conjugada reflui para o sinusoide.',
          exemplos: [
            { causa: 'Coledocolitíase, neoplasia periampular, estenose biliar', etapas: ['obstrução mecânica', 'pressão biliar ↑', 'refluxo canalicular', 'BD ↑ com FA e GGT ↑, colúria e acolia'] },
          ],
        },
        {
          titulo: 'Comprometimento do transporte canalicular',
          explicacao: 'O canalículo não consegue excretar, mesmo sem obstrução mecânica.',
          exemplos: [
            { causa: 'Sepse, nutrição parenteral, fármacos, colestase da gestação', etapas: ['inibição dos transportadores canaliculares por citocinas ou toxinas', 'colestase funcional', 'BD ↑'], nota: 'A colestase da sepse pode ser desproporcional às demais alterações hepáticas.' },
            { causa: 'Síndrome de Dubin-Johnson', etapas: ['deficiência hereditária do MRP2', 'BD ↑ isolada, benigna'] },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Confirmar colestase', ids: ['fosfatase-alcalina', 'ggt', 'bilirrubina-total'], leitura: 'BD alta com FA e GGT altas caracteriza colestase; BD alta com FA e GGT normais sugere Dubin-Johnson ou Rotor.' }],
    utilidade: ['diagnostico'],
    padroes: ['colestatico'],
    estudarTambem: ['bilirrubina-total', 'fosfatase-alcalina', 'ggt'],
  },

  {
    id: 'bilirrubina-indireta',
    nome: 'Bilirrubina indireta',
    sigla: 'BI',
    sinonimos: ['bilirrubina nao conjugada', 'bi'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'hematologico'],
    material: 'Soro (calculada: total menos direta)',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Adultos', texto: '< 1,0', unidade: 'mg/dL' }],
    resumo: 'A bilirrubina que ainda não passou pelo fígado. Sobe quando se produz demais (hemólise) ou se conjuga de menos (Gilbert, neonato).',
    entenda:
      'Como circula ligada à albumina e é lipossolúvel, a bilirrubina indireta não aparece na urina — icterícia sem colúria é sua marca. No recém-nascido, essa mesma lipossolubilidade é o perigo: ela atravessa a barreira hematoencefálica e pode depositar-se nos núcleos da base, causando kernicterus. Em adulto, elevação isolada e leve, com o restante do painel normal, é quase sempre síndrome de Gilbert.',
    fisiologia: {
      oQueE: 'Bilirrubina não conjugada, lipossolúvel, transportada ligada à albumina.',
      origem: 'Macrófagos do sistema reticuloendotelial, a partir da degradação do heme.',
      funcao: 'Forma de transporte do pigmento até o fígado; possui atividade antioxidante.',
      circulacao: 'Ligada à albumina — deslocada dela por sulfonamidas e ceftriaxona, o que aumenta a fração livre e o risco de kernicterus no neonato.',
      percurso: ['Heme', 'biliverdina', 'bilirrubina indireta', 'ligação à albumina', 'captação hepatocitária'],
    },
    aumento: {
      resumo: 'Hemólise, eritropoese ineficaz, reabsorção de hematoma, ou deficiência de conjugação.',
      mecanismos: [
        {
          titulo: 'Sobrecarga de produção',
          explicacao: 'Degrada-se mais heme do que o fígado consegue conjugar.',
          exemplos: [{ causa: 'Hemólise, eritropoese ineficaz, hematomas extensos', etapas: ['produção de bilirrubina ↑', 'capacidade de conjugação excedida', 'BI ↑'] }],
        },
        {
          titulo: 'Conjugação deficiente',
          explicacao: 'A UGT1A1 tem atividade reduzida — por genética, imaturidade ou competição farmacológica.',
          exemplos: [
            { causa: 'Síndrome de Gilbert', etapas: ['atividade reduzida da UGT1A1', 'BI ↑ leve em jejum e estresse'], nota: 'Painel hepático normal e ausência de anemia diferenciam de hemólise.' },
            { causa: 'Recém-nascido, Crigler-Najjar, rifampicina, atazanavir', etapas: ['conjugação limitada ou competida', 'BI ↑'] },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Investigar hemólise', ids: ['ldh', 'haptoglobina', 'reticulocitos'], leitura: 'BI alta com LDH alto, haptoglobina baixa e reticulocitose é hemólise; BI alta isolada com tudo normal é Gilbert.' }],
    interferentes: { fisiologico: ['Jejum prolongado, exercício e infecção elevam em portadores de Gilbert.'] },
    utilidade: ['diagnostico'],
    padroes: ['hemolise'],
    estudarTambem: ['ldh', 'haptoglobina', 'reticulocitos', 'bilirrubina-total'],
  },

  {
    id: 'albumina',
    nome: 'Albumina',
    sinonimos: ['albumina serica', 'alb'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar', 'renal', 'metabolico'],
    material: 'Soro',
    unidade: 'g/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 3.5, maximo: 5.2, unidade: 'g/dL' }],
    resumo:
      'A principal proteína do plasma, feita exclusivamente pelo fígado. Marcador de função sintética, de estado nutricional e — sobretudo — de inflamação.',
    entenda:
      'A albumina responde por cerca de 75% da pressão oncótica do plasma e transporta bilirrubina, ácidos graxos, cálcio, hormônios e fármacos. Como tem meia-vida de cerca de 20 dias, ela não cai rapidamente: hipoalbuminemia aguda quase sempre significa perda (renal, intestinal, cutânea), diluição ou redistribuição para o interstício por aumento da permeabilidade capilar na inflamação — não desnutrição instalada em dias. Na hepatopatia crônica, ela é um dos pilares da avaliação de função sintética, ao lado do INR.',
    aprofundar: [
      'Chamar a albumina de "marcador nutricional" é uma simplificação que atrapalha. Na inflamação, a IL-6 desvia a síntese hepática das proteínas constitutivas (albumina, transferrina) para as de fase aguda (PCR, fibrinogênio, ferritina) — a albumina é, tecnicamente, um reagente de fase aguda negativo. Some-se o extravasamento capilar, e a albumina cai em qualquer doença aguda grave independentemente do estado nutricional. Por isso hipoalbuminemia é um dos preditores de mortalidade mais robustos em internação: ela mede gravidade, não dieta.',
      'A albumina liga cerca de 40% do cálcio sérico. Quando ela cai, o cálcio total cai junto sem que o cálcio ionizado — o fisiologicamente ativo — se altere. Daí a correção: some-se 0,8 mg/dL ao cálcio total para cada 1,0 g/dL de albumina abaixo de 4,0. Ignorar isso produz diagnósticos falsos de hipocalcemia em hipoalbuminêmicos, que são a maioria dos internados.',
    ],
    fisiologia: {
      oQueE: 'Proteína plasmática de 66 kDa, sintetizada exclusivamente pelo hepatócito, cerca de 12 a 15 g por dia.',
      origem: 'Fígado.',
      funcao: 'Manter a pressão oncótica plasmática (75% dela) e transportar bilirrubina, ácidos graxos livres, cálcio, hormônios tireoidianos e diversos fármacos.',
      metabolismo: 'Catabolizada em vários tecidos; sua síntese é reduzida pela IL-6 na inflamação.',
      meiaVida: 'Cerca de 20 dias — por isso reflete semanas, e não dias.',
      orgaosEnvolvidos: ['Fígado (síntese)', 'Rim (perda)', 'Intestino (perda)', 'Interstício (redistribuição)'],
      percurso: ['Hepatócito sintetiza', 'albumina no plasma', 'pressão oncótica e transporte', 'catabolismo tecidual'],
    },
    aumento: {
      resumo: 'Praticamente só desidratação — a hemoconcentração eleva sem que a síntese tenha mudado.',
      mecanismos: [
        {
          titulo: 'Hemoconcentração',
          explicacao: 'A massa de albumina é a mesma; o volume plasmático encolheu.',
          exemplos: [{ causa: 'Desidratação, garrote prolongado na coleta', etapas: ['volume plasmático ↓', 'albumina ↑ relativa'], nota: 'Não existe hiperalbuminemia por produção aumentada.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Síntese reduzida, perda (renal, intestinal, cutânea), redistribuição inflamatória ou diluição.',
      mecanismos: [
        {
          titulo: 'Síntese reduzida',
          explicacao: 'O fígado não produz — por perda de massa funcional ou por desvio inflamatório da síntese.',
          exemplos: [
            { causa: 'Cirrose hepática', etapas: ['perda de massa hepatocitária funcionante', 'síntese ↓', 'albumina ↓ com INR alargado'], nota: 'Compõe o escore de Child-Pugh: albumina, bilirrubina, INR, ascite e encefalopatia.' },
            { causa: 'Inflamação aguda e crônica', etapas: ['IL-6 ↑', 'desvio da síntese hepática para proteínas de fase aguda', 'albumina ↓'], nota: 'É reagente de fase aguda negativo — cai por inflamação, e não apenas por desnutrição.' },
            { causa: 'Desnutrição proteico-calórica grave', etapas: ['falta de substrato para síntese', 'albumina ↓ tardiamente'], nota: 'Pela meia-vida longa, é marcador tardio de desnutrição: a pré-albumina responde mais rápido.' },
          ],
        },
        {
          titulo: 'Perda',
          explicacao: 'A albumina sai do compartimento plasmático por uma barreira rompida.',
          exemplos: [
            { causa: 'Síndrome nefrótica', etapas: ['lesão da barreira glomerular', 'proteinúria > 3,5 g/dia', 'albumina ↓ com edema e dislipidemia'] },
            { causa: 'Enteropatia perdedora de proteína, doença inflamatória intestinal', etapas: ['perda pela mucosa intestinal', 'albumina ↓ sem proteinúria'] },
            { causa: 'Grandes queimados, feridas extensas', etapas: ['perda pela superfície cutânea lesada', 'albumina ↓'] },
          ],
        },
        {
          titulo: 'Redistribuição e diluição',
          explicacao: 'A albumina não foi perdida nem deixou de ser feita: mudou de compartimento ou foi diluída.',
          exemplos: [
            { causa: 'Sepse, grandes cirurgias, capilaridade aumentada', etapas: ['permeabilidade capilar ↑', 'passagem de albumina para o interstício', 'albumina plasmática ↓ com edema'] },
            { causa: 'Sobrecarga hídrica, gestação, insuficiência cardíaca', etapas: ['expansão do volume plasmático', 'albumina ↓ por diluição'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Inflamação e doença aguda', 'Cirrose', 'Síndrome nefrótica'],
        comuns: ['Desnutrição', 'Sobrecarga hídrica', 'Enteropatia perdedora de proteína'],
        naoEsquecer: ['Corrigir o cálcio total pela albumina antes de diagnosticar hipocalcemia'],
      },
    },
    relacionados: [
      { titulo: 'Função sintética hepática', ids: ['inr', 'bilirrubina-total', 'plaquetas'], leitura: 'Albumina baixa, INR alargado, bilirrubina alta e plaquetopenia formam o retrato da cirrose descompensada — muito mais informativo que transaminases.' },
      { titulo: 'Antes de interpretar o cálcio', ids: ['calcio', 'calcio-ionizado'], leitura: 'Hipoalbuminemia derruba o cálcio total sem alterar o ionizado. Corrija ou dose o ionizado.' },
      { titulo: 'Se houver proteinúria', ids: ['proteinuria', 'colesterol-total'], leitura: 'Albumina baixa com proteinúria nefrótica, edema e hipercolesterolemia define a síndrome nefrótica.' },
    ],
    interferentes: {
      preAnalitico: ['Garrote prolongado e postura ortostática elevam em até 10%.'],
      fisiologico: ['Gestação e decúbito prolongado reduzem.'],
    },
    cinetica: { normalizacao: 'Meia-vida de ~20 dias: a resposta a intervenção nutricional demora semanas e a pré-albumina é melhor para o seguimento curto.' },
    normalizacao: [
      { cenario: 'Hipoalbuminemia por inflamação aguda', caminho: 'Tratar a doença de base. A albumina sobe sozinha quando a IL-6 cai — infusão de albumina não corrige a causa e tem indicações específicas.', prazo: 'Semanas.' },
      { cenario: 'Perda renal (síndrome nefrótica)', caminho: 'Tratar a glomerulopatia e reduzir a proteinúria com bloqueio do sistema renina-angiotensina.', prazo: 'Meses, conforme a resposta da proteinúria.' },
      { cenario: 'Cirrose', caminho: 'Não normaliza enquanto a massa hepática funcionante não se recuperar. A albumina passa a ser marcador prognóstico, não alvo.', prazo: 'Depende da reversibilidade da hepatopatia.' },
    ],
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    estudarTambem: ['inr', 'proteinuria', 'calcio', 'bilirrubina-total'],
  },

  {
    id: 'inr',
    nome: 'TAP / INR',
    sigla: 'INR',
    sinonimos: ['tempo de protrombina', 'tap', 'rni', 'atividade de protrombina'],
    grupo: 'coagulacao',
    sistemas: ['hepatobiliar'],
    material: 'Plasma citratado',
    unidade: 'razão',
    referencias: [
      { rotulo: 'Sem anticoagulante', minimo: 0.9, maximo: 1.1, unidade: 'razão' },
      { rotulo: 'Em uso de varfarina (alvo usual)', minimo: 2.0, maximo: 3.0, unidade: 'razão', observacao: 'Alvo de 2,5 a 3,5 em prótese valvar mecânica mitral.' },
    ],
    resumo:
      'Avalia a via extrínseca e comum da coagulação. Fora da anticoagulação, é um dos melhores marcadores de função sintética hepática — e o mais precoce deles.',
    entenda:
      'O tempo de protrombina depende dos fatores VII, X, V, II e do fibrinogênio, todos produzidos pelo fígado. O fator VII tem a meia-vida mais curta de toda a cascata — cerca de 6 horas —, o que faz do INR o primeiro marcador a se alterar quando a síntese hepática falha, muito antes da albumina, cuja meia-vida é de 20 dias. Na insuficiência hepática aguda, o INR é simultaneamente o marcador mais sensível e o principal critério prognóstico.',
    fisiologia: {
      oQueE: 'Razão normalizada internacional do tempo de protrombina, padronizada pelo índice de sensibilidade da tromboplastina usada.',
      origem: 'Reflete a atividade dos fatores da via extrínseca e comum, sintetizados no hepatócito.',
      sintese: 'Os fatores II, VII, IX e X exigem carboxilação dependente de vitamina K para se tornarem funcionais — o passo que a varfarina bloqueia.',
      funcao: 'Não tem função própria: é um tempo de coagulação padronizado para permitir comparação entre laboratórios.',
      meiaVida: 'Fator VII: ~6 horas. É o elo mais frágil e por isso o primeiro a faltar.',
      orgaosEnvolvidos: ['Fígado (síntese)', 'Intestino (absorção de vitamina K)', 'Microbiota intestinal (produção de vitamina K)'],
      percurso: ['Hepatócito sintetiza os fatores', 'carboxilação dependente de vitamina K', 'fatores funcionais no plasma', 'via extrínseca e comum', 'tempo de protrombina'],
    },
    aumento: {
      resumo: 'Falta de síntese hepática, falta de vitamina K, anticoagulação, consumo (CIVD) ou inibidores.',
      mecanismos: [
        {
          titulo: 'Falência da síntese hepática',
          explicacao: 'O fígado não produz os fatores. Como o VII tem meia-vida de horas, o INR alarga precocemente.',
          exemplos: [
            { causa: 'Insuficiência hepática aguda', etapas: ['necrose hepatocelular maciça', 'síntese de fatores ↓', 'INR ↑ rapidamente'], nota: 'INR ≥ 1,5 com encefalopatia define insuficiência hepática aguda e indica avaliação para transplante.' },
            { causa: 'Cirrose', etapas: ['perda de massa funcionante', 'síntese ↓', 'INR ↑ com albumina ↓'], nota: 'Compõe os escores de Child-Pugh e MELD.' },
          ],
        },
        {
          titulo: 'Deficiência de vitamina K',
          explicacao: 'Os fatores são sintetizados, mas não carboxilados — e sem carboxilação não funcionam.',
          exemplos: [
            { causa: 'Colestase prolongada, má absorção, uso de antibióticos de largo espectro, nutrição parenteral', etapas: ['absorção de vitamina K ↓ (é lipossolúvel e depende de sais biliares)', 'carboxilação insuficiente', 'INR ↑'], nota: 'A prova está na resposta: INR que corrige após vitamina K parenteral indica deficiência, e não falência hepática.' },
            { causa: 'Doença hemorrágica do recém-nascido', etapas: ['estoque hepático baixo e microbiota ainda não colonizada', 'INR ↑'], nota: 'Motivo da vitamina K profilática ao nascer.' },
          ],
        },
        {
          titulo: 'Anticoagulação e consumo',
          explicacao: 'Bloqueio farmacológico da carboxilação ou consumo dos fatores em coagulação sistêmica.',
          exemplos: [
            { causa: 'Varfarina', etapas: ['inibição da epóxido-redutase da vitamina K', 'fatores não carboxilados', 'INR ↑ dose-dependente'] },
            { causa: 'CIVD', etapas: ['ativação sistêmica da coagulação', 'consumo de fatores e plaquetas', 'INR e TTPa alargados com fibrinogênio ↓ e D-dímero ↑↑'] },
          ],
        },
      ],
    },
    reducao: { resumo: 'INR abaixo da faixa não indica hipercoagulabilidade — o exame não foi feito para isso.', mecanismos: [] },
    comparacoes: [
      {
        id: 'inr-vitamina-k-vs-hepatica',
        titulo: 'INR alargado: deficiência de vitamina K × insuficiência hepática',
        pergunta: 'O INR alargou. É falta de vitamina K (corrigível) ou falência de síntese (não corrigível)?',
        hipoteses: ['Deficiência de vitamina K', 'Insuficiência hepática'],
        linhas: [
          { marcador: 'Fator V', celulas: ['normal', '↓'] },
          { marcador: 'Fator VII', celulas: ['↓', '↓'] },
          { marcador: 'Albumina', celulas: ['normal', '↓'] },
          { marcador: 'Resposta à vitamina K parenteral', celulas: ['corrige em 12–24h', 'não corrige'] },
        ],
        leitura:
          'O fator V é o desempate, e a razão é elegante: ele é sintetizado pelo fígado mas não depende de vitamina K. Se o fator V está normal e o VII está baixo, falta vitamina K. Se ambos estão baixos, falta fígado. Na prática ambulatorial, a resposta à vitamina K parenteral resolve a mesma pergunta em 24 horas.',
      },
    ],
    relacionados: [
      { titulo: 'Função sintética hepática', ids: ['albumina', 'bilirrubina-total', 'plaquetas'], leitura: 'INR alarga primeiro (fator VII, meia-vida de 6 horas); a albumina cai depois (meia-vida de 20 dias). Juntos, datam a lesão.' },
      { titulo: 'Se houver consumo', ids: ['ttpa', 'fibrinogenio', 'd-dimero', 'plaquetas'], leitura: 'INR e TTPa alargados com fibrinogênio baixo, plaquetopenia e D-dímero muito alto caracterizam CIVD.' },
    ],
    interferentes: {
      preAnalitico: ['Tubo de citrato mal preenchido altera a proporção sangue/anticoagulante e alarga falsamente.', 'Hematócrito muito alto (> 55%) reduz o plasma disponível e alarga falsamente.'],
      medicamentos: ['Varfarina; antibióticos e amiodarona potencializam. Os anticoagulantes orais diretos podem alargar discretamente sem que o INR sirva para monitorá-los.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['insuficiencia-hepatica'],
    estudarTambem: ['albumina', 'ttpa', 'fibrinogenio', 'plaquetas'],
  },

  {
    id: 'ldh',
    nome: 'Desidrogenase lática',
    sigla: 'LDH',
    sinonimos: ['dhl', 'desidrogenase latica', 'lactato desidrogenase'],
    grupo: 'hepatico',
    sistemas: ['hematologico', 'hepatobiliar', 'oncologico'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [{ rotulo: 'Adultos', minimo: 140, maximo: 280, unidade: 'U/L', observacao: 'Varia bastante entre métodos.' }],
    resumo:
      'Enzima presente em praticamente todas as células. Sobe em qualquer lesão tecidual — o que a torna sensível, inespecífica e útil só dentro de um contexto.',
    entenda:
      'A LDH catalisa a conversão de piruvato em lactato e existe em cinco isoformas distribuídas por todos os tecidos. Elevação isolada não localiza nada. Em contextos específicos, porém, ela é decisiva: no painel de hemólise (com haptoglobina baixa e bilirrubina indireta alta), na hepatite isquêmica (sobe proporcionalmente às transaminações, ao contrário da viral), na avaliação prognóstica de linfomas e na suspeita de pneumocistose. Nesses cenários, a LDH deixa de ser inespecífica porque a pergunta já foi delimitada.',
    fisiologia: {
      oQueE: 'Enzima citoplasmática tetramérica que interconverte piruvato e lactato, com cinco isoformas (LDH-1 a LDH-5) de distribuição tecidual distinta.',
      origem: 'Todas as células nucleadas, hemácias, miocárdio, fígado, músculo, rim, pulmão.',
      funcao: 'Regenerar NAD+ na glicólise anaeróbia — permitindo que a célula produza ATP sem oxigênio.',
      orgaosEnvolvidos: ['Praticamente todos os tecidos'],
      percurso: ['Lesão ou destruição celular', 'extravasamento citoplasmático', 'LDH plasmática ↑'],
    },
    aumento: {
      resumo: 'Qualquer destruição celular: hemólise, necrose, isquemia, neoplasia, eritropoese ineficaz.',
      mecanismos: [
        {
          titulo: 'Destruição de hemácias',
          explicacao: 'A hemácia é riquíssima em LDH; sua ruptura, in vivo ou na amostra, eleva o valor.',
          exemplos: [
            { causa: 'Hemólise', etapas: ['ruptura eritrocitária', 'liberação de LDH', 'LDH ↑ com haptoglobina ↓ e BI ↑'] },
            { causa: 'Amostra hemolisada', etapas: ['ruptura in vitro', 'LDH falsamente ↑'], nota: 'Causa muito comum de LDH alta sem doença — conferir se o laudo registra hemólise.' },
          ],
        },
        {
          titulo: 'Necrose e isquemia tecidual',
          explicacao: 'Células mortas derramam o conteúdo citoplasmático.',
          exemplos: [
            { causa: 'Hepatite isquêmica, infarto, isquemia mesentérica, rabdomiólise, pancreatite', etapas: ['necrose celular', 'LDH ↑'], nota: 'Na hepatite isquêmica a LDH sobe na mesma proporção das transaminases, diferentemente da viral — a relação ALT/LDH abaixo de 1,5 aponta isquemia.' },
          ],
        },
        {
          titulo: 'Alto turnover celular neoplásico',
          explicacao: 'A massa tumoral tem turnover elevado e libera LDH continuamente.',
          exemplos: [
            { causa: 'Linfomas, leucemias, tumores germinativos, síndrome de lise tumoral', etapas: ['proliferação e morte celular acelerada', 'LDH ↑'], nota: 'Integra o índice prognóstico internacional dos linfomas e o estadiamento dos tumores germinativos.' },
          ],
        },
        {
          titulo: 'Eritropoese ineficaz',
          explicacao: 'Precursores destruídos dentro da própria medula liberam LDH sem hemólise periférica.',
          exemplos: [{ causa: 'Anemia megaloblástica, mielodisplasia, talassemia', etapas: ['destruição intramedular', 'LDH ↑↑ com reticulócitos baixos'], nota: 'LDH muito alta com VCM alto e reticulócito baixo é sugestiva de anemia megaloblástica.' }],
        },
      ],
    },
    reducao: { resumo: 'Sem significado clínico.', mecanismos: [] },
    relacionados: [
      { titulo: 'Painel de hemólise', ids: ['haptoglobina', 'bilirrubina-indireta', 'reticulocitos'], leitura: 'LDH sozinha não diz nada; com haptoglobina baixa e bilirrubina indireta alta, define hemólise.' },
    ],
    interferentes: { preAnalitico: ['Hemólise da amostra e demora na separação do soro elevam falsamente — é o interferente mais frequente deste exame.'] },
    utilidade: ['diagnostico', 'prognostico'],
    padroes: ['hemolise'],
    estudarTambem: ['haptoglobina', 'bilirrubina-indireta', 'ast'],
  },

  {
    id: 'amonia',
    nome: 'Amônia',
    sinonimos: ['amonia serica', 'nh3', 'amoniemia'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Plasma (tubo em gelo, processamento imediato)',
    unidade: 'µmol/L',
    referencias: [{ rotulo: 'Adultos', minimo: 11, maximo: 50, unidade: 'µmol/L', observacao: 'Extremamente dependente do pré-analítico: coleta sem garrote, em gelo, e processamento em até 15 minutos.' }],
    resumo:
      'Produto nitrogenado tóxico que o fígado converte em ureia. Sobe quando o fígado falha ou quando há desvio portossistêmico — mas o nível não define a conduta.',
    entenda:
      'A amônia vem sobretudo da atividade bacteriana intestinal sobre proteínas e da desaminação de aminoácidos. O fígado a captura na primeira passagem e a converte em ureia. Quando há insuficiência hepática ou shunt portossistêmico, ela escapa para a circulação sistêmica, atravessa a barreira hematoencefálica e provoca edema astrocitário — a base da encefalopatia hepática. Ponto crucial: a correlação entre o nível de amônia e o grau de encefalopatia é fraca. O diagnóstico é clínico; a amônia serve para apoiar a hipótese, sobretudo em coma de causa indeterminada, e não para titular o tratamento.',
    fisiologia: {
      oQueE: 'Nitrogênio na forma de NH₃/NH₄⁺, produto do catabolismo de aminoácidos e da atividade bacteriana intestinal.',
      origem: 'Colonócitos e bactérias intestinais (urease), rim e músculo.',
      funcao: 'Intermediário do metabolismo nitrogenado; em excesso, é neurotóxica.',
      metabolismo: 'Convertida em ureia no ciclo hepático da ureia e em glutamina no músculo e no cérebro.',
      eliminacao: 'Como ureia pela urina; pequena fração como amônio urinário, importante no tamponamento ácido-base.',
      orgaosEnvolvidos: ['Intestino (produção)', 'Fígado (detoxificação)', 'Rim', 'Músculo', 'Cérebro'],
      percurso: ['Proteína intestinal e bactérias com urease', 'amônia', 'veia porta', 'ciclo da ureia no fígado', 'ureia', 'urina'],
    },
    aumento: {
      resumo: 'Insuficiência hepática, shunt portossistêmico, carga nitrogenada aumentada ou defeito congênito do ciclo da ureia.',
      mecanismos: [
        {
          titulo: 'Falência da detoxificação hepática',
          explicacao: 'O ciclo da ureia não dá conta, por perda de massa funcionante.',
          exemplos: [{ causa: 'Insuficiência hepática aguda, cirrose descompensada', etapas: ['ciclo da ureia comprometido', 'amônia ↑', 'edema astrocitário', 'encefalopatia hepática'], nota: 'Ureia baixa com amônia alta reforça a falência do ciclo.' }],
        },
        {
          titulo: 'Desvio portossistêmico',
          explicacao: 'O sangue portal chega à circulação sistêmica sem passar pelo hepatócito.',
          exemplos: [{ causa: 'Hipertensão portal, TIPS, shunts cirúrgicos', etapas: ['sangue portal desvia do fígado', 'amônia não é detoxificada', 'encefalopatia'], nota: 'Encefalopatia após TIPS é complicação conhecida e esperada.' }],
        },
        {
          titulo: 'Carga nitrogenada aumentada',
          explicacao: 'Chega mais amônia do que o fígado comprometido consegue processar. São os precipitantes clássicos da encefalopatia.',
          exemplos: [
            { causa: 'Hemorragia digestiva', etapas: ['sangue no lúmen intestinal', 'degradação bacteriana', 'amônia ↑'], nota: 'É o precipitante mais frequente de encefalopatia em cirróticos.' },
            { causa: 'Constipação, infecção, dieta hiperproteica, hipocalemia e alcalose', etapas: ['produção ou absorção de amônia ↑', 'encefalopatia'], nota: 'A hipocalemia aumenta a amoniogênese renal — corrigir potássio faz parte do tratamento.' },
          ],
        },
        {
          titulo: 'Defeitos congênitos e fármacos',
          explicacao: 'A enzima do ciclo falta, ou o fármaco a inibe.',
          exemplos: [
            { causa: 'Distúrbios hereditários do ciclo da ureia', etapas: ['deficiência enzimática', 'hiperamonemia grave'], nota: 'Considerar em recém-nascido com encefalopatia e alcalose respiratória.' },
            { causa: 'Ácido valproico', etapas: ['inibição do ciclo da ureia', 'hiperamonemia com transaminases normais'], nota: 'Encefalopatia por valproato pode ocorrer com fígado normal.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'No hepatopata', ids: ['ureia', 'albumina', 'inr', 'potassio'], leitura: 'Amônia alta com ureia baixa, albumina baixa e INR alargado indica falência hepática; a hipocalemia agrava a hiperamonemia e deve ser corrigida.' },
    ],
    interferentes: {
      preAnalitico: ['É o exame mais sensível a erro de coleta do painel hepático: garrote, punho cerrado, demora no transporte, amostra fora do gelo e hemólise elevam falsamente.'],
      fisiologico: ['Dieta hiperproteica e exercício intenso elevam.'],
      medicamentos: ['Ácido valproico eleva; diuréticos elevam por alcalose e hipocalemia.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['ureia', 'albumina', 'inr'],
  },
]
