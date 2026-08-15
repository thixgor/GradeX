import type { Marcador } from '../tipos'

/**
 * Marcadores tumorais, vitaminas, imunologia, infectologia e enzimas
 * pancreáticas.
 *
 * Estão juntos porque compartilham a mesma advertência editorial: são os
 * exames que mais produzem dano quando lidos fora de contexto. Marcador
 * tumoral elevado em pessoa assintomática costuma ser tudo, menos câncer; FAN
 * positivo em título baixo é achado de população saudável; sorologia positiva
 * não distingue infecção atual de contato antigo. Cada ficha aqui existe tanto
 * para ensinar o que o exame significa quanto para conter o que ele não
 * significa.
 */
export const marcadores: Marcador[] = [
  /* ───────────────────────── Marcadores tumorais ───────────────────────── */
  {
    id: 'psa',
    nome: 'Antígeno prostático específico',
    sigla: 'PSA',
    sinonimos: ['psa', 'psa total', 'psa livre', 'antigeno prostatico'],
    grupo: 'tumorais',
    sistemas: ['oncologico'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Referência tradicional', texto: '< 4,0', unidade: 'ng/mL', observacao: 'Não existe valor que exclua câncer nem que o confirme: o PSA é órgão-específico, não câncer-específico.' },
      { rotulo: 'Relação PSA livre/total', texto: '> 25% favorece hiperplasia benigna; < 10% aumenta a suspeita de neoplasia', unidade: '%' },
    ],
    resumo:
      'Uma protease produzida pela próstata — por qualquer próstata. Sobe em câncer, mas também em hiperplasia benigna, prostatite, ejaculação e manipulação.',
    entenda:
      'O PSA é específico do órgão, não da doença. Isso significa que sua elevação diz "algo está acontecendo na próstata", e não "existe câncer". Hiperplasia benigna, prostatite, retenção urinária, cateterismo, biópsia recente, ejaculação nas 48 horas anteriores e ciclismo elevam. Por isso as ferramentas que refinam a interpretação — densidade do PSA, velocidade de elevação, relação livre/total e ressonância multiparamétrica — importam mais que o valor absoluto.',
    advertencia:
      'PSA elevado não é diagnóstico de câncer de próstata, e PSA normal não o exclui. O rastreamento populacional é objeto de debate por causa do sobrediagnóstico — a decisão deve ser compartilhada com o paciente, considerando idade, expectativa de vida e história familiar.',
    fisiologia: {
      oQueE: 'Serina-protease da família das calicreínas, produzida pelo epitélio prostático.',
      origem: 'Próstata (e, em quantidade mínima, glândulas periuretrais).',
      funcao: 'Liquefazer o coágulo seminal, favorecendo a motilidade espermática.',
      meiaVida: '2 a 3 dias.',
      percurso: ['Epitélio prostático produz PSA', 'secreção no líquido seminal', 'pequena fração escapa ao plasma quando a arquitetura glandular é rompida', 'PSA sérico ↑'],
    },
    aumento: {
      resumo: 'Qualquer processo que rompa a arquitetura prostática: neoplasia, hiperplasia, inflamação ou manipulação.',
      mecanismos: [
        {
          titulo: 'Ruptura da barreira glandular',
          explicacao: 'O PSA é secretado no lúmen; quando a arquitetura se desorganiza, ele vaza para a circulação.',
          exemplos: [
            { causa: 'Adenocarcinoma de próstata', etapas: ['invasão e desorganização da arquitetura glandular', 'extravasamento de PSA', 'elevação progressiva'], nota: 'A velocidade de elevação ao longo do tempo informa mais que um valor isolado.' },
            { causa: 'Hiperplasia prostática benigna', etapas: ['aumento do volume glandular', 'mais tecido produzindo PSA', 'elevação proporcional ao volume'], nota: 'A densidade do PSA (valor ÷ volume prostático) ajuda a separar volume de doença.' },
            { causa: 'Prostatite', etapas: ['inflamação e ruptura de ácinos', 'PSA ↑↑ transitório'], nota: 'Pode elevar muito. Repetir 6 a 8 semanas após o tratamento antes de indicar biópsia.' },
            { causa: 'Cateterismo, biópsia, ejaculação, ciclismo, retenção urinária', etapas: ['manipulação mecânica', 'PSA ↑ transitório'], nota: 'Abstinência sexual de 48 horas antes da coleta evita um dos falsos-positivos mais comuns.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Inibidores da 5-alfa-redutase reduzem o PSA pela metade — e isso precisa ser corrigido na interpretação.',
      mecanismos: [
        {
          titulo: 'Redução farmacológica',
          explicacao: 'Finasterida e dutasterida reduzem o volume prostático e a produção de PSA.',
          exemplos: [{ causa: 'Finasterida, dutasterida', etapas: ['inibição da 5-alfa-redutase', 'redução do volume prostático', 'PSA cai ~50% em 6 a 12 meses'], nota: 'Multiplicar o valor por dois para interpretar. Um PSA que sobe sob esses fármacos é sinal de alerta.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Antes de decidir', ids: ['creatinina'], leitura: 'A decisão de biópsia integra PSA, toque retal, densidade, velocidade, relação livre/total e ressonância — nunca o valor isolado.' }],
    interferentes: {
      preAnalitico: ['Ejaculação, ciclismo, toque retal vigoroso, cateterismo e biópsia recentes elevam.'],
      medicamentos: ['Inibidores da 5-alfa-redutase reduzem em cerca de 50%.'],
    },
    utilidade: ['rastreamento', 'acompanhamento'],
    estudarTambem: ['cea', 'creatinina'],
  },

  {
    id: 'cea',
    nome: 'Marcadores tumorais séricos',
    sigla: 'CEA, CA 19-9, CA 125, CA 15-3, AFP',
    sinonimos: ['cea', 'ca 19-9', 'ca 125', 'ca 15-3', 'afp', 'alfafetoproteina', 'marcadores tumorais', 'antigeno carcinoembrionario'],
    grupo: 'tumorais',
    sistemas: ['oncologico'],
    material: 'Soro',
    unidade: 'ng/mL ou U/mL',
    referencias: [
      { rotulo: 'CEA', texto: '< 5 (< 3 em não fumantes)', unidade: 'ng/mL' },
      { rotulo: 'CA 19-9', texto: '< 37', unidade: 'U/mL' },
      { rotulo: 'CA 125', texto: '< 35', unidade: 'U/mL' },
      { rotulo: 'CA 15-3', texto: '< 30', unidade: 'U/mL' },
      { rotulo: 'AFP', texto: '< 10', unidade: 'ng/mL' },
    ],
    resumo:
      'Antígenos associados a tumores. Servem sobretudo para acompanhar doença já diagnosticada — quase nunca para diagnosticar e praticamente nunca para rastrear.',
    entenda:
      'Esses marcadores são produzidos por tecidos normais em pequena quantidade e por alguns tumores em quantidade maior. Nenhum deles é exclusivo de neoplasia: CEA sobe em tabagismo, DPOC, hepatopatia e doença inflamatória intestinal; CA 19-9 sobe em qualquer colestase, inclusive benigna; CA 125 sobe em endometriose, miomas, gestação, ascite de qualquer causa, insuficiência cardíaca e menstruação. O uso correto é o seguimento: em doença já diagnosticada com marcador elevado ao início, a queda documenta resposta e a nova elevação sugere recidiva.',
    advertencia:
      'Marcadores tumorais não devem ser usados como rastreamento em pessoas assintomáticas. Elevações em pessoa saudável geram investigações invasivas, exames de imagem sucessivos e angústia — na imensa maioria das vezes sem que exista neoplasia alguma. As exceções são específicas e limitadas: AFP no seguimento de cirrose com risco de hepatocarcinoma, e alguns marcadores em populações de altíssimo risco, sempre dentro de protocolos.',
    fisiologia: {
      oQueE: 'Glicoproteínas e antígenos de superfície expressos em tecidos embrionários e reexpressos por alguns tumores.',
      origem: 'CEA: epitélio digestivo. CA 19-9: epitélio pancreatobiliar. CA 125: epitélio celômico (peritônio, pleura, pericárdio, endométrio). CA 15-3: epitélio mamário. AFP: fígado fetal e saco vitelino.',
      funcao: 'Papel fisiológico na adesão celular e no desenvolvimento embrionário.',
      percurso: ['Tecido tumoral ou inflamado produz o antígeno', 'liberação na circulação', 'concentração proporcional à massa e à atividade — não à malignidade'],
    },
    aumento: {
      resumo: 'Neoplasias correspondentes, mas também um número grande de condições benignas.',
      mecanismos: [
        {
          titulo: 'Produção tumoral',
          explicacao: 'A massa neoplásica expressa e libera o antígeno em proporção ao volume e à atividade.',
          exemplos: [
            { causa: 'CEA — câncer colorretal', etapas: ['expressão tumoral', 'CEA ↑'], nota: 'Útil no seguimento pós-operatório: nova elevação sugere recidiva antes da imagem.' },
            { causa: 'CA 19-9 — câncer de pâncreas e vias biliares', etapas: ['expressão tumoral', 'CA 19-9 ↑'], nota: 'Cerca de 5 a 10% da população não expressa o antígeno de Lewis e tem CA 19-9 indetectável mesmo com tumor volumoso.' },
            { causa: 'CA 125 — câncer de ovário', etapas: ['expressão pelo epitélio celômico neoplásico', 'CA 125 ↑'], nota: 'Melhor desempenho na pós-menopausa, quando as causas benignas são menos frequentes.' },
            { causa: 'AFP — hepatocarcinoma e tumores germinativos', etapas: ['reexpressão do gene fetal', 'AFP ↑'], nota: 'Também elevada em hepatite, cirrose, regeneração hepática e gestação.' },
          ],
        },
        {
          titulo: 'Causas benignas',
          explicacao: 'Inflamação, colestase e proliferação epitelial benigna elevam os mesmos antígenos.',
          exemplos: [
            { causa: 'CEA: tabagismo, DPOC, hepatopatia, doença inflamatória intestinal, pancreatite', etapas: ['inflamação epitelial crônica', 'CEA ↑ discreta'] },
            { causa: 'CA 19-9: colestase de qualquer causa, colangite, pancreatite, cirrose', etapas: ['colestase e inflamação biliar', 'CA 19-9 ↑, por vezes acentuado'], nota: 'Colestase benigna pode elevar acima de 1.000 U/mL — desobstruir e repetir antes de concluir.' },
            { causa: 'CA 125: endometriose, miomas, gestação, menstruação, ascite, insuficiência cardíaca, pleurite, peritonite', etapas: ['irritação do epitélio celômico', 'CA 125 ↑'] },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Sempre com o contexto', ids: ['fosfatase-alcalina', 'ggt', 'bilirrubina-direta'], leitura: 'CA 19-9 alto com colestase exige primeiro desobstruir e repetir — a colestase por si só o eleva.' }],
    interferentes: {
      fisiologico: ['Tabagismo (CEA), menstruação e gestação (CA 125), colestase (CA 19-9).'],
      metodo: ['Anticorpos heterófilos causam falsos-positivos; o acompanhamento deve ser feito sempre no mesmo laboratório e método.'],
    },
    utilidade: ['acompanhamento', 'prognostico'],
    estudarTambem: ['psa', 'fosfatase-alcalina', 'ldh'],
  },

  {
    id: 'beta-hcg',
    nome: 'Beta-hCG',
    sinonimos: ['hcg', 'beta hcg', 'gonadotrofina corionica'],
    grupo: 'tumorais',
    sistemas: ['endocrino', 'oncologico'],
    material: 'Soro ou urina',
    unidade: 'mUI/mL',
    referencias: [
      { rotulo: 'Não gestante', texto: '< 5', unidade: 'mUI/mL' },
      { rotulo: 'Gestação inicial', texto: 'Duplica a cada 48 a 72 horas até ~10 semanas', unidade: 'mUI/mL', observacao: 'A cinética vale mais que o valor isolado na avaliação de gestação inicial.' },
    ],
    resumo: 'O hormônio da gestação — e também um marcador tumoral de tumores germinativos e doença trofoblástica.',
    entenda:
      'O hCG é produzido pelo sinciciotrofoblasto e mantém o corpo lúteo no início da gestação. Sua cinética é o que responde às perguntas clínicas: elevação inferior à esperada em 48 horas sugere gestação ectópica ou inviável; valores desproporcionalmente altos sugerem gestação múltipla ou doença trofoblástica. Fora da gestação, eleva-se em coriocarcinoma, mola hidatiforme e tumores germinativos — e, em homem, sua presença é sempre patológica.',
    fisiologia: {
      oQueE: 'Glicoproteína de duas subunidades; a alfa é comum a TSH, FSH e LH, e a beta é específica.',
      origem: 'Sinciciotrofoblasto placentário; tumores germinativos e trofoblásticos.',
      funcao: 'Manter o corpo lúteo e a produção de progesterona no primeiro trimestre.',
      meiaVida: '24 a 36 horas.',
      percurso: ['Implantação embrionária', 'sinciciotrofoblasto produz hCG', 'manutenção do corpo lúteo', 'progesterona sustenta o endométrio'],
    },
    aumento: {
      resumo: 'Gestação, doença trofoblástica gestacional, tumores germinativos e — raramente — secreção ectópica.',
      mecanismos: [
        { titulo: 'Produção trofoblástica', explicacao: 'Tecido trofoblástico normal ou neoplásico produz o hormônio.', exemplos: [{ causa: 'Gestação normal, gemelar, mola hidatiforme, coriocarcinoma', etapas: ['proliferação trofoblástica', 'hCG ↑'], nota: 'Valores muito acima do esperado para a idade gestacional, com útero aumentado e sem embrião, sugerem mola.' }] },
        { titulo: 'Produção tumoral', explicacao: 'Tumores germinativos expressam o hormônio.', exemplos: [{ causa: 'Tumores germinativos testiculares e ovarianos', etapas: ['expressão tumoral', 'hCG ↑'], nota: 'hCG detectável em homem exige investigação — pode preceder a massa palpável.' }] },
      ],
    },
    relacionados: [{ titulo: 'Na avaliação de gestação inicial', ids: ['estradiol'], leitura: 'A curva de hCG, associada à ultrassonografia transvaginal, é o que define viabilidade e localização.' }],
    interferentes: { metodo: ['Anticorpos heterófilos causam falso-positivo persistente ("hCG fantasma") — a dosagem urinária, que não sofre a interferência, resolve.'] },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['estradiol', 'fsh'],
  },

  /* ─────────────────────────── Vitaminas ─────────────────────────── */
  {
    id: 'vitamina-d',
    nome: 'Vitamina D (25-hidroxivitamina D)',
    sinonimos: ['vitamina d', '25 oh vitamina d', 'calcidiol', '25 hidroxivitamina d'],
    grupo: 'vitaminas',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Soro',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Suficiência (população geral)', texto: '≥ 20', unidade: 'ng/mL' },
      { rotulo: 'Alvo em grupos de risco', texto: '30 a 60', unidade: 'ng/mL', observacao: 'Idosos, gestantes, osteoporose, doença renal e má absorção.' },
      { rotulo: 'Deficiência', texto: '< 20 (grave abaixo de 10)', unidade: 'ng/mL' },
    ],
    resumo: 'O estoque corporal de vitamina D. Dosa-se a 25-hidroxivitamina D — nunca o calcitriol, que é regulado e não reflete reserva.',
    entenda:
      'A vitamina D da pele e da dieta é hidroxilada no fígado a 25-OH-vitamina D, a forma de estoque e de meia-vida longa, e depois no rim a 1,25-di-hidroxivitamina D (calcitriol), a forma ativa. O calcitriol é rigidamente regulado pelo PTH e pode estar normal ou até alto na deficiência — por isso dosá-lo para avaliar reserva é um erro comum. A deficiência causa hiperparatireoidismo secundário, com desmineralização óssea progressiva antes de qualquer alteração do cálcio sérico.',
    fisiologia: {
      oQueE: 'Secosteroide lipossolúvel; a 25-OH é sua forma circulante de reserva.',
      origem: '80 a 90% da síntese cutânea a partir do 7-desidrocolesterol sob radiação UVB; o restante da dieta.',
      metabolismo: 'Hidroxilação hepática (25-hidroxilase) e renal (1-alfa-hidroxilase, estimulada pelo PTH).',
      funcao: 'Aumentar a absorção intestinal de cálcio e fósforo; regular a mineralização óssea e modular a imunidade.',
      meiaVida: '2 a 3 semanas (25-OH); 4 a 6 horas (calcitriol).',
      orgaosEnvolvidos: ['Pele', 'Fígado', 'Rim', 'Intestino', 'Paratireoides'],
      percurso: ['7-desidrocolesterol na pele', 'UVB', 'colecalciferol', 'fígado: 25-hidroxilação', '25-OH-vitamina D (estoque)', 'rim: 1-alfa-hidroxilação (PTH)', 'calcitriol ativo'],
    },
    aumento: { resumo: 'Suplementação em dose excessiva e doenças granulomatosas (que produzem calcitriol, não 25-OH).', mecanismos: [{ titulo: 'Aporte excessivo', explicacao: 'A vitamina D é lipossolúvel e acumula-se.', exemplos: [{ causa: 'Suplementação em doses altas prolongadas', etapas: ['acúmulo', 'absorção intestinal de cálcio ↑', 'hipercalcemia e hipercalciúria', 'nefrolitíase e nefrocalcinose'], nota: 'A intoxicação é rara mas real, e ocorre sobretudo com megadoses sem monitoramento.' }] }] },
    reducao: {
      resumo: 'Baixa exposição solar, envelhecimento, obesidade, má absorção, doença hepática ou renal e anticonvulsivantes.',
      mecanismos: [
        { titulo: 'Síntese ou aporte reduzidos', explicacao: 'Menos UVB na pele, menos precursor ou menos capacidade de síntese cutânea.', exemplos: [{ causa: 'Baixa exposição solar, uso de filtro solar, pele mais pigmentada, idade avançada, institucionalização', etapas: ['síntese cutânea ↓', '25-OH-vitamina D ↓', 'PTH ↑ compensatório'] }] },
        { titulo: 'Absorção ou metabolismo comprometidos', explicacao: 'Vitamina lipossolúvel: depende de sais biliares e de fígado e rim funcionantes.', exemplos: [
          { causa: 'Doença celíaca, doença inflamatória intestinal, cirurgia bariátrica, colestase', etapas: ['absorção de gordura ↓', 'vitamina D ↓'] },
          { causa: 'Obesidade', etapas: ['sequestro no tecido adiposo', '25-OH-vitamina D plasmática ↓ com estoque corporal preservado'] },
          { causa: 'Anticonvulsivantes, glicocorticoides, antirretrovirais', etapas: ['catabolismo acelerado via CYP', 'vitamina D ↓'] },
        ] },
      ],
    },
    relacionados: [{ titulo: 'O eixo mineral', ids: ['calcio', 'pth', 'fosforo', 'fosfatase-alcalina'], leitura: 'Deficiência de vitamina D com PTH alto, cálcio normal-baixo e FA elevada é o padrão da osteomalácia e do hiperparatireoidismo secundário.' }],
    interferentes: { fisiologico: ['Estação do ano, latitude, pigmentação cutânea e uso de filtro solar alteram significativamente.'] },
    normalizacao: [{ cenario: 'Deficiência nutricional', caminho: 'Reposição com colecalciferol e correção da causa (exposição solar, má absorção). Reavaliar após 3 meses — a meia-vida longa exige paciência.', prazo: '8 a 12 semanas.' }],
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['calcio', 'pth', 'fosforo'],
  },

  {
    id: 'zinco',
    nome: 'Zinco, cobre e selênio',
    sinonimos: ['zinco', 'cobre', 'selenio', 'ceruloplasmina', 'oligoelementos', 'micronutrientes'],
    grupo: 'vitaminas',
    sistemas: ['metabolico'],
    material: 'Soro (tubo isento de metais)',
    unidade: 'µg/dL',
    referencias: [
      { rotulo: 'Zinco', minimo: 70, maximo: 120, unidade: 'µg/dL' },
      { rotulo: 'Cobre', minimo: 70, maximo: 140, unidade: 'µg/dL' },
      { rotulo: 'Ceruloplasmina', minimo: 20, maximo: 60, unidade: 'mg/dL' },
    ],
    resumo: 'Oligoelementos essenciais. Suas dosagens são fortemente influenciadas pela inflamação — o que limita a interpretação em paciente agudamente doente.',
    entenda:
      'O zinco cai na inflamação (é reagente de fase aguda negativo, redistribuído para o fígado), enquanto o cobre e a ceruloplasmina sobem (reagentes positivos). Isso significa que zinco baixo em paciente com PCR alta pode não indicar deficiência, e cobre "normal" pode mascarar deficiência real. Nos dois casos, a dosagem só é interpretável fora da fase aguda. A relevância clínica maior está na doença de Wilson, em que a ceruloplasmina baixa com cobre urinário alto é o achado que abre o diagnóstico.',
    fisiologia: {
      oQueE: 'Metais-traço que atuam como cofatores enzimáticos.',
      origem: 'Dieta; absorção intestinal regulada.',
      funcao: 'Zinco: cofator de mais de 300 enzimas, cicatrização, imunidade, paladar e síntese proteica. Cobre: cofator da citocromo-oxidase, da superóxido-dismutase e da ceruloplasmina (que participa do metabolismo do ferro). Selênio: componente da glutationa-peroxidase e das desiodases do hormônio tireoidiano.',
      percurso: ['Dieta', 'absorção intestinal', 'transporte plasmático ligado a albumina e ceruloplasmina', 'incorporação a metaloenzimas', 'excreção biliar (cobre) e intestinal (zinco)'],
    },
    aumento: {
      resumo: 'Cobre e ceruloplasmina sobem na inflamação, na gestação e com estrogênios. Zinco alto é quase sempre suplementação.',
      mecanismos: [{ titulo: 'Fase aguda e estímulo hormonal', explicacao: 'A ceruloplasmina é reagente de fase aguda positivo.', exemplos: [{ causa: 'Inflamação, infecção, gestação, anticoncepcional', etapas: ['síntese hepática de ceruloplasmina ↑', 'cobre plasmático ↑'], nota: 'Pode mascarar a ceruloplasmina baixa da doença de Wilson.' }] }],
    },
    reducao: {
      resumo: 'Deficiência nutricional, má absorção, perdas, inflamação — e, no caso da ceruloplasmina, doença de Wilson.',
      mecanismos: [
        { titulo: 'Aporte ou absorção reduzidos', explicacao: 'Dieta pobre, má absorção ou perdas aumentadas.', exemplos: [
          { causa: 'Deficiência de zinco: alcoolismo, cirrose, diarreia crônica, cirurgia bariátrica, nutrição parenteral sem reposição', etapas: ['aporte ou absorção ↓', 'zinco ↓', 'dermatite periorificial, alopecia, disgeusia, cicatrização deficiente, imunidade prejudicada'] },
          { causa: 'Deficiência de cobre: cirurgia bariátrica, excesso de suplementação de zinco', etapas: ['zinco induz metalotioneína no enterócito, que sequestra o cobre', 'deficiência de cobre', 'anemia e neutropenia refratárias a ferro e mielopatia'], nota: 'Anemia com neutropenia inexplicada em pós-bariátrico deve fazer pensar em deficiência de cobre.' },
        ] },
        { titulo: 'Doença de Wilson', explicacao: 'Defeito da ATP7B compromete a incorporação do cobre à ceruloplasmina e sua excreção biliar.', exemplos: [{ causa: 'Doença de Wilson', etapas: ['mutação da ATP7B', 'ceruloplasmina ↓ com cobre livre ↑ e cupriúria ↑', 'depósito hepático, neurológico e corneano (anéis de Kayser-Fleischer)'], nota: 'Hepatopatia inexplicada em pessoa jovem obriga a dosar ceruloplasmina.' }] },
      ],
    },
    relacionados: [{ titulo: 'Interpretação em contexto', ids: ['pcr', 'albumina', 'ast'], leitura: 'Zinco e cobre são fortemente afetados por inflamação e albumina — dosar fora da fase aguda.' }],
    interferentes: { preAnalitico: ['Exigem tubo isento de metais; contaminação por borracha da tampa eleva o zinco.'] },
    utilidade: ['diagnostico'],
    estudarTambem: ['albumina', 'pcr', 'hemoglobina'],
  },

  /* ─────────────────────────── Imunologia ─────────────────────────── */
  {
    id: 'fan',
    nome: 'Fator antinuclear',
    sigla: 'FAN',
    sinonimos: ['fan', 'ana', 'anticorpo antinuclear', 'fator antinuclear'],
    grupo: 'imunologia',
    sistemas: ['imunologico'],
    material: 'Soro',
    unidade: 'título',
    referencias: [
      { rotulo: 'Não reagente', texto: '< 1:80', unidade: 'título' },
      { rotulo: 'Título baixo', texto: '1:80 a 1:160', unidade: 'título', observacao: 'Presente em 10 a 15% da população saudável, sobretudo em mulheres e idosos.' },
      { rotulo: 'Título relevante', texto: '≥ 1:320 com padrão definido', unidade: 'título' },
    ],
    resumo:
      'Rastreio de autoimunidade sistêmica. Muito sensível para lúpus e pouco específico — o padrão e o título importam mais que a positividade.',
    entenda:
      'O FAN detecta anticorpos contra componentes nucleares por imunofluorescência indireta em células HEp-2. Sua sensibilidade para lúpus é altíssima — FAN negativo torna o diagnóstico muito improvável —, mas a especificidade é baixa: positividade em títulos baixos ocorre em pessoas saudáveis, em infecções, em hepatopatias, em neoplasias e com uso de fármacos. O padrão de fluorescência orienta quais anticorpos específicos pesquisar, e são esses os que fecham diagnóstico.',
    advertencia:
      'FAN não deve ser solicitado como rastreamento em pessoa sem manifestações clínicas sugestivas. Um FAN positivo em título baixo, sem sintomas, gera investigações em cascata e ansiedade sem benefício algum.',
    fisiologia: {
      oQueE: 'Conjunto de autoanticorpos dirigidos contra antígenos nucleares, nucleolares e citoplasmáticos.',
      origem: 'Linfócitos B autorreativos que escaparam da tolerância imunológica.',
      funcao: 'Nenhuma função fisiológica — são marcadores de perda de autotolerância.',
      percurso: ['Perda de tolerância a antígenos próprios', 'produção de autoanticorpos', 'imunofluorescência em células HEp-2', 'padrão e título'],
    },
    aumento: {
      resumo: 'Doenças autoimunes sistêmicas, mas também infecções, hepatopatias, neoplasias, fármacos e envelhecimento.',
      mecanismos: [
        {
          titulo: 'Autoimunidade sistêmica',
          explicacao: 'A perda de tolerância gera anticorpos contra antígenos nucleares, e o padrão sugere qual.',
          exemplos: [
            { causa: 'Lúpus eritematoso sistêmico', etapas: ['perda de tolerância', 'FAN positivo em título alto (padrão nuclear homogêneo ou pontilhado)', 'anti-DNA nativo e anti-Sm confirmam'], nota: 'Anti-DNA nativo correlaciona-se com atividade e com nefrite; anti-Sm é o mais específico.' },
            { causa: 'Esclerose sistêmica, Sjögren, doença mista, hepatite autoimune, artrite reumatoide', etapas: ['autoimunidade', 'FAN positivo com padrões característicos (centromérico, nucleolar, pontilhado fino)'], nota: 'Padrão centromérico sugere esclerose sistêmica limitada; nucleolar, esclerose difusa.' },
          ],
        },
        {
          titulo: 'Positividade sem doença autoimune',
          explicacao: 'Estímulos crônicos ao sistema imune geram autoanticorpos de baixo título.',
          exemplos: [{ causa: 'Envelhecimento, infecções crônicas, hepatopatias, neoplasias, fármacos (hidralazina, procainamida, anti-TNF, minociclina)', etapas: ['estímulo imune crônico ou induzido', 'FAN positivo em título baixo sem doença'], nota: 'Lúpus induzido por fármaco costuma cursar com anti-histona positivo e melhora com a suspensão.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'Se o FAN for positivo', ids: ['complemento-c3'], leitura: 'Pesquisar os anticorpos específicos conforme o padrão. No lúpus em atividade, C3 e C4 caem pelo consumo e o anti-DNA sobe.' },
    ],
    interferentes: { fisiologico: ['Idade avançada e sexo feminino aumentam a positividade em títulos baixos.'] },
    utilidade: ['triagem', 'diagnostico'],
    estudarTambem: ['complemento-c3', 'pcr', 'vhs'],
  },

  {
    id: 'complemento-c3',
    nome: 'Complemento C3 e C4',
    sinonimos: ['c3', 'c4', 'complemento', 'ch50'],
    grupo: 'imunologia',
    sistemas: ['imunologico'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'C3', minimo: 90, maximo: 180, unidade: 'mg/dL' },
      { rotulo: 'C4', minimo: 10, maximo: 40, unidade: 'mg/dL' },
    ],
    resumo: 'Proteínas do sistema complemento. Consumidas quando há formação de imunocomplexos — e é essa queda que marca atividade de doença.',
    entenda:
      'C3 e C4 são reagentes de fase aguda positivos e, portanto, sobem na inflamação. Quando caem, significa consumo, e o padrão da queda orienta a via ativada: C4 baixo com C3 baixo aponta ativação da via clássica por imunocomplexos (lúpus, crioglobulinemia, glomerulonefrite pós-infecciosa); C3 baixo com C4 normal aponta ativação da via alternativa (glomerulonefrite membranoproliferativa, sepse). No lúpus, a queda do complemento com elevação do anti-DNA nativo é o par que marca atividade, especialmente renal.',
    fisiologia: {
      oQueE: 'Proteínas plasmáticas da cascata do complemento, sintetizadas no fígado.',
      origem: 'Fígado.',
      funcao: 'Opsonização, quimiotaxia, lise de patógenos e depuração de imunocomplexos.',
      percurso: ['Imunocomplexo ativa a via clássica (C1 → C4 → C2 → C3)', 'ou superfície microbiana ativa a via alternativa (C3)', 'consumo de C3 e C4', 'queda plasmática'],
    },
    aumento: { resumo: 'Inflamação e infecção — comportamento de fase aguda, sem valor diagnóstico próprio.', mecanismos: [{ titulo: 'Fase aguda', explicacao: 'A síntese hepática aumenta na inflamação.', exemplos: [{ causa: 'Infecção, inflamação aguda', etapas: ['síntese hepática ↑', 'C3 e C4 ↑'] }] }] },
    reducao: {
      resumo: 'Consumo por imunocomplexos, deficiência congênita ou falha de síntese hepática.',
      mecanismos: [
        { titulo: 'Consumo pela via clássica', explicacao: 'Imunocomplexos ativam C1 e consomem C4 e depois C3.', exemplos: [{ causa: 'Lúpus em atividade, crioglobulinemia, glomerulonefrite pós-estreptocócica, endocardite', etapas: ['formação de imunocomplexos', 'ativação da via clássica', 'C3 e C4 ↓'], nota: 'Na nefrite lúpica, a queda do complemento acompanha a atividade e serve de acompanhamento.' }] },
        { titulo: 'Consumo pela via alternativa', explicacao: 'A ativação direta consome C3 e poupa C4.', exemplos: [{ causa: 'Glomerulonefrite membranoproliferativa, sepse, fator nefrítico C3', etapas: ['ativação da via alternativa', 'C3 ↓ com C4 normal'] }] },
      ],
    },
    relacionados: [{ titulo: 'Na atividade lúpica', ids: ['fan', 'proteinuria', 'creatinina'], leitura: 'Complemento em queda, anti-DNA em elevação, proteinúria nova e creatinina subindo sugerem nefrite lúpica em atividade.' }],
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['fan', 'proteinuria'],
  },

  {
    id: 'fator-reumatoide',
    nome: 'Fator reumatoide, anti-CCP e ANCA',
    sinonimos: ['fator reumatoide', 'fr', 'anti-ccp', 'anti ccp', 'anca', 'p-anca', 'c-anca', 'anticorpo anticitrulina'],
    grupo: 'imunologia',
    sistemas: ['imunologico'],
    material: 'Soro',
    unidade: 'UI/mL',
    referencias: [
      { rotulo: 'Fator reumatoide', texto: '< 14', unidade: 'UI/mL' },
      { rotulo: 'Anti-CCP', texto: '< 20', unidade: 'U/mL', observacao: 'Especificidade acima de 95% para artrite reumatoide.' },
    ],
    resumo: 'Autoanticorpos de doenças reumatológicas específicas. O anti-CCP é o mais específico para artrite reumatoide; o ANCA orienta o diagnóstico das vasculites de pequenos vasos.',
    entenda:
      'O fator reumatoide é um anticorpo contra a porção Fc da IgG — sensível para artrite reumatoide, mas positivo também em Sjögren, hepatite C, endocardite, tuberculose e em idosos saudáveis. O anti-CCP resolve essa limitação: tem especificidade acima de 95%, pode preceder os sintomas em anos e associa-se a doença erosiva. O ANCA, por sua vez, divide as vasculites de pequenos vasos: o padrão citoplasmático com anti-PR3 associa-se à granulomatose com poliangeíte, e o perinuclear com anti-MPO à poliangeíte microscópica.',
    fisiologia: {
      oQueE: 'Autoanticorpos: FR contra a porção Fc da IgG; anti-CCP contra peptídeos citrulinados; ANCA contra antígenos do citoplasma de neutrófilos.',
      origem: 'Linfócitos B autorreativos.',
      funcao: 'Nenhuma fisiológica; participam da formação de imunocomplexos e da ativação de neutrófilos (ANCA).',
      percurso: ['Perda de tolerância', 'produção de autoanticorpos', 'formação de imunocomplexos ou ativação de neutrófilos', 'lesão tecidual'],
    },
    aumento: {
      resumo: 'Doenças reumatológicas específicas — e, no caso do fator reumatoide, também infecções crônicas e idade.',
      mecanismos: [
        { titulo: 'Autoimunidade articular', explicacao: 'A citrulinação de proteínas sinoviais gera neoantígenos.', exemplos: [{ causa: 'Artrite reumatoide', etapas: ['citrulinação de proteínas (favorecida pelo tabagismo)', 'anti-CCP e FR', 'sinovite erosiva'], nota: 'Anti-CCP positivo prediz doença mais grave e erosiva, e pode preceder os sintomas em anos.' }] },
        { titulo: 'Estímulo imune crônico', explicacao: 'Infecções crônicas geram fator reumatoide sem artrite reumatoide.', exemplos: [{ causa: 'Hepatite C, endocardite, tuberculose, Sjögren, idade avançada', etapas: ['estímulo antigênico crônico', 'FR positivo sem artrite reumatoide'], nota: 'É por isso que o FR isolado não diagnostica.' }] },
        { titulo: 'Vasculites ANCA-associadas', explicacao: 'O ANCA ativa neutrófilos que lesam o endotélio de pequenos vasos.', exemplos: [{ causa: 'Granulomatose com poliangeíte (c-ANCA/PR3), poliangeíte microscópica (p-ANCA/MPO)', etapas: ['ativação de neutrófilos pelo ANCA', 'vasculite necrosante', 'síndrome pulmão-rim, hemorragia alveolar, glomerulonefrite rapidamente progressiva'], nota: 'Hemoptise com creatinina em elevação rápida e sedimento ativo é emergência: exige investigação e tratamento imediatos.' }] },
      ],
    },
    relacionados: [{ titulo: 'Na suspeita de vasculite', ids: ['creatinina', 'eas', 'proteinuria', 'pcr'], leitura: 'ANCA positivo com sedimento urinário ativo e creatinina subindo caracteriza glomerulonefrite rapidamente progressiva.' }],
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['fan', 'pcr', 'eas'],
  },

  {
    id: 'imunoglobulinas',
    nome: 'Imunoglobulinas e IgE',
    sinonimos: ['imunoglobulinas', 'iga', 'igg', 'igm', 'ige', 'eletroforese de proteinas', 'gamopatia'],
    grupo: 'imunologia',
    sistemas: ['imunologico'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'IgG', minimo: 700, maximo: 1600, unidade: 'mg/dL' },
      { rotulo: 'IgA', minimo: 70, maximo: 400, unidade: 'mg/dL' },
      { rotulo: 'IgM', minimo: 40, maximo: 230, unidade: 'mg/dL' },
      { rotulo: 'IgE total', texto: '< 100', unidade: 'UI/mL' },
    ],
    resumo: 'Quantificam a resposta humoral. Elevação policlonal aponta inflamação crônica; monoclonal aponta gamopatia; redução aponta imunodeficiência ou perda.',
    entenda:
      'A distinção decisiva é entre elevação policlonal e monoclonal, e quem a faz é a eletroforese de proteínas. Aumento policlonal de todas as classes indica estímulo antigênico crônico — infecção, hepatopatia, doença autoimune. Um pico monoclonal estreito na região gama indica proliferação de um único clone plasmocitário: gamopatia monoclonal de significado indeterminado, mieloma múltiplo ou macroglobulinemia. A IgE, por sua vez, pertence a outro eixo: alergia e parasitoses.',
    fisiologia: {
      oQueE: 'Anticorpos produzidos por plasmócitos, divididos em classes com funções distintas.',
      origem: 'Plasmócitos derivados de linfócitos B.',
      funcao: 'IgG: memória e resposta secundária, atravessa a placenta. IgA: mucosas e secreções. IgM: resposta primária e ativação do complemento. IgE: hipersensibilidade imediata e defesa antiparasitária.',
      percurso: ['Antígeno', 'linfócito B ativado', 'plasmócito', 'anticorpo específico no plasma e nas secreções'],
    },
    aumento: {
      resumo: 'Policlonal por estímulo crônico; monoclonal por gamopatia; IgE por atopia e parasitose.',
      mecanismos: [
        { titulo: 'Aumento policlonal', explicacao: 'Muitos clones respondem a estímulos antigênicos variados.', exemplos: [{ causa: 'Hepatopatia crônica, infecções crônicas, doenças autoimunes, HIV', etapas: ['estímulo antigênico persistente', 'hipergamaglobulinemia policlonal'], nota: 'Na hepatite autoimune, a IgG elevada é parte dos critérios diagnósticos.' }] },
        { titulo: 'Aumento monoclonal', explicacao: 'Um único clone plasmocitário prolifera e produz uma imunoglobulina idêntica.', exemplos: [{ causa: 'Gamopatia monoclonal de significado indeterminado, mieloma múltiplo, macroglobulinemia de Waldenström', etapas: ['proliferação clonal', 'pico monoclonal na eletroforese', 'supressão das demais imunoglobulinas'], nota: 'Mieloma: anemia, hipercalcemia, insuficiência renal e lesões ósseas líticas com VHS muito alto e pico monoclonal.' }] },
        { titulo: 'IgE elevada', explicacao: 'Resposta Th2 a alérgenos ou parasitos.', exemplos: [{ causa: 'Atopia, parasitoses, aspergilose broncopulmonar alérgica, síndrome de hiper-IgE', etapas: ['resposta Th2', 'IgE ↑ com eosinofilia'] }] },
      ],
    },
    reducao: {
      resumo: 'Imunodeficiências primárias, perda proteica, imunossupressão e supressão por clone neoplásico.',
      mecanismos: [
        { titulo: 'Produção reduzida', explicacao: 'Defeito congênito ou supressão medular.', exemplos: [{ causa: 'Imunodeficiência comum variável, deficiência seletiva de IgA, mieloma (que suprime as classes normais), rituximabe, corticoide', etapas: ['produção de anticorpos ↓', 'infecções de repetição sinopulmonares'], nota: 'Deficiência de IgA é a imunodeficiência primária mais comum e traz risco de reação transfusional anafilática.' }] },
        { titulo: 'Perda', explicacao: 'Imunoglobulinas escapam pela urina ou pelo intestino.', exemplos: [{ causa: 'Síndrome nefrótica, enteropatia perdedora de proteína, queimaduras extensas', etapas: ['perda proteica', 'imunoglobulinas ↓'] }] },
      ],
    },
    relacionados: [{ titulo: 'Na suspeita de mieloma', ids: ['calcio', 'creatinina', 'hemoglobina', 'vhs', 'proteinuria'], leitura: 'Anemia, hipercalcemia, insuficiência renal, dor óssea e VHS muito alto formam o quadro — a eletroforese sérica e urinária confirma.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['vhs', 'calcio', 'albumina', 'eosinofilos'],
  },

  /* ─────────────────────────── Infectologia ─────────────────────────── */
  {
    id: 'sorologias',
    nome: 'Sorologias virais e bacterianas',
    sinonimos: ['sorologia', 'hiv', 'hepatite b', 'hepatite c', 'sifilis', 'vdrl', 'toxoplasmose', 'cmv', 'ebv', 'dengue', 'igg', 'igm', 'hbsag', 'anti-hbs'],
    grupo: 'infectologia',
    sistemas: ['infeccioso', 'imunologico'],
    material: 'Soro',
    unidade: '—',
    referencias: [
      { rotulo: 'IgM', texto: 'Reagente sugere infecção recente', unidade: '' },
      { rotulo: 'IgG', texto: 'Reagente indica contato prévio ou imunidade', unidade: '' },
      { rotulo: 'Janela imunológica', texto: 'Período entre a infecção e a soroconversão', unidade: '', observacao: 'Sorologia negativa nesse intervalo não exclui infecção — daí o uso de testes moleculares em exposição recente.' },
    ],
    resumo:
      'Detectam a resposta imune ao agente, não o agente. Por isso a leitura é sempre temporal: IgM sugere recente, IgG sugere passado, e a janela imunológica é o ponto cego.',
    entenda:
      'A regra geral é que a IgM aparece primeiro e desaparece em semanas a meses, enquanto a IgG surge depois e persiste por anos ou pela vida. Dois cuidados são essenciais. Primeiro: a IgM pode persistir por muito tempo ou reagir de forma cruzada, e sozinha não prova infecção aguda — o teste de avidez de IgG resolve, sobretudo em gestante com suspeita de toxoplasmose. Segundo: na janela imunológica não há anticorpo detectável, e a exclusão depende de teste molecular ou de antígeno.',
    aprofundar: [
      'A sorologia da hepatite B é o exemplo mais didático de leitura por combinação. HBsAg positivo indica infecção ativa (aguda ou crônica, conforme a duração). Anti-HBc IgM positivo indica infecção aguda; anti-HBc IgG isolado indica contato prévio. Anti-HBs isolado, sem anti-HBc, indica vacinação — nunca infecção. HBeAg positivo indica replicação viral alta e maior infectividade. O conjunto responde perguntas que nenhum marcador isolado responde.',
      'No HIV, o teste de quarta geração detecta simultaneamente anticorpos e o antígeno p24, reduzindo a janela para cerca de 15 a 20 dias. Na sífilis, os testes treponêmicos (FTA-Abs, ELISA) permanecem positivos para sempre após a infecção — o VDRL, não treponêmico, é quem serve para acompanhar resposta ao tratamento, pela queda progressiva do título. Um VDRL que não cai quatro vezes em seis a doze meses sugere falha terapêutica ou reinfecção.',
    ],
    fisiologia: {
      oQueE: 'Detecção de anticorpos específicos (IgM, IgG) ou de antígenos virais no soro.',
      origem: 'Resposta humoral do hospedeiro ao contato com o agente.',
      funcao: 'Documentar exposição, infecção ativa ou imunidade.',
      percurso: ['Exposição ao agente', 'janela imunológica (sem anticorpos detectáveis)', 'IgM (dias a semanas)', 'IgG (semanas em diante, persistindo)', 'memória imunológica'],
    },
    aumento: {
      resumo: 'Positividade indica contato — atual ou passado — com o agente, ou vacinação.',
      mecanismos: [
        {
          titulo: 'Infecção aguda',
          explicacao: 'A resposta primária produz IgM antes de IgG.',
          exemplos: [
            { causa: 'Dengue', etapas: ['viremia (NS1 positivo nos primeiros dias)', 'IgM a partir do 4º a 5º dia', 'IgG depois'], nota: 'NS1 e teste molecular na fase precoce; sorologia a partir do 6º dia. Hemograma com plaquetopenia e hemoconcentração orienta a gravidade.' },
            { causa: 'Mononucleose (EBV), CMV, toxoplasmose', etapas: ['IgM positiva com IgG ainda negativa ou de baixa avidez', 'linfocitose com atipia e transaminases elevadas'], nota: 'Na gestante, a avidez de IgG é decisiva: avidez alta indica infecção há mais de 3 a 4 meses.' },
          ],
        },
        {
          titulo: 'Infecção crônica ou contato prévio',
          explicacao: 'A IgG persiste indefinidamente após a infecção.',
          exemplos: [
            { causa: 'Hepatite B crônica', etapas: ['HBsAg persistente por mais de 6 meses', 'anti-HBc IgG positivo', 'HBeAg e carga viral definem replicação'] },
            { causa: 'Hepatite C', etapas: ['anti-HCV positivo indica contato', 'carga viral (HCV-RNA) define infecção ativa'], nota: 'Anti-HCV positivo com carga viral indetectável indica infecção passada ou curada.' },
            { causa: 'Sífilis', etapas: ['teste treponêmico permanece positivo para sempre', 'VDRL titulado acompanha resposta ao tratamento'], nota: 'Queda de quatro vezes no título indica resposta adequada.' },
          ],
        },
        {
          titulo: 'Imunidade vacinal',
          explicacao: 'A vacina apresenta apenas o antígeno de superfície, e não o vírus inteiro: a resposta cobre o HBs e nunca o core.',
          exemplos: [
            {
              causa: 'Vacinação contra hepatite B',
              etapas: ['exposição só ao antígeno de superfície recombinante', 'produção de anti-HBs', 'nenhum contato com o antígeno do core', 'anti-HBs positivo isolado, com anti-HBc negativo'],
              nota: 'Essa combinação distingue quem foi vacinado de quem teve a infecção — nesta, o anti-HBc permanece positivo para sempre.',
            },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'Complementando a sorologia', ids: ['alt', 'ast', 'leucocitos', 'plaquetas', 'pcr'], leitura: 'Transaminases nas hepatites; hemograma na dengue e na mononucleose; PCR e procalcitonina para separar bacteriano de viral.' }],
    interferentes: {
      preAnalitico: ['Coleta na janela imunológica gera falso-negativo.'],
      metodo: ['Reações cruzadas entre flavivírus (dengue, zika, febre amarela e vacinas) limitam a especificidade das sorologias.', 'Fator reumatoide e anticorpos heterófilos causam falsos-positivos de IgM.'],
    },
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['alt', 'plaquetas', 'leucocitos', 'pcr'],
  },

  {
    id: 'culturas',
    nome: 'Culturas e testes moleculares',
    sinonimos: ['hemocultura', 'urocultura', 'cultura', 'antibiograma', 'pcr molecular', 'painel molecular'],
    grupo: 'infectologia',
    sistemas: ['infeccioso'],
    material: 'Sangue, urina, secreções, líquidos estéreis',
    unidade: '—',
    referencias: [
      { rotulo: 'Urocultura significativa', texto: '≥ 100.000 UFC/mL (limiares menores em cateterizados e sintomáticos)', unidade: 'UFC/mL' },
      { rotulo: 'Hemocultura', texto: 'Qualquer crescimento em sítio estéril merece interpretação — mas contaminação é frequente', unidade: '' },
    ],
    resumo: 'O único exame que identifica o agente e testa sua sensibilidade. É o que permite sair do antibiótico empírico para o dirigido.',
    entenda:
      'A cultura tem dois requisitos que determinam seu valor: coleta antes do antibiótico e técnica adequada. Hemoculturas devem ser colhidas em pares, de sítios diferentes, com antissepsia rigorosa — o crescimento de Staphylococcus coagulase-negativo em apenas um frasco costuma ser contaminação de pele, enquanto o mesmo germe em dois frascos e em paciente com prótese pode ser infecção real. Os testes moleculares são mais rápidos e detectam agentes não cultiváveis, mas identificam material genético, que pode persistir depois de o agente já não ser viável.',
    fisiologia: {
      oQueE: 'Cultivo do agente em meio apropriado, com identificação e teste de sensibilidade; ou detecção de ácido nucleico por amplificação.',
      origem: 'Amostra do sítio infectado.',
      funcao: 'Identificar o agente e orientar a terapia dirigida.',
      percurso: ['Coleta antes do antibiótico', 'incubação e crescimento', 'identificação da espécie', 'antibiograma', 'descalonamento para terapia dirigida'],
    },
    aumento: {
      resumo: 'Crescimento indica presença do agente — mas colonização, contaminação e infecção são coisas diferentes.',
      mecanismos: [
        {
          titulo: 'Infecção verdadeira',
          explicacao: 'O agente cresce em sítio normalmente estéril, com quadro clínico compatível.',
          exemplos: [{ causa: 'Bacteriemia, infecção urinária, meningite, pneumonia', etapas: ['invasão microbiana', 'crescimento em cultura', 'antibiograma orienta a terapia'], nota: 'Coletar antes do antibiótico aumenta muito o rendimento — uma dose prévia pode negativar a hemocultura.' }],
        },
        {
          titulo: 'Colonização e contaminação',
          explicacao: 'O agente está presente sem causar doença, ou foi introduzido na coleta.',
          exemplos: [
            { causa: 'Bacteriúria assintomática', etapas: ['colonização vesical sem invasão', 'urocultura positiva sem sintomas'], nota: 'Não se trata, exceto em gestantes e antes de procedimentos urológicos invasivos — tratar aumenta resistência sem benefício.' },
            { causa: 'Contaminação de hemocultura por flora cutânea', etapas: ['antissepsia inadequada', 'crescimento em um único frasco'], nota: 'Interpretar pelo número de frascos positivos, pelo tempo até o crescimento e pelo contexto clínico.' },
          ],
        },
      ],
    },
    relacionados: [{ titulo: 'No manejo da infecção', ids: ['pcr', 'procalcitonina', 'lactato', 'leucocitos'], leitura: 'Os marcadores inflamatórios medem a resposta e a gravidade; a cultura identifica o agente. São informações complementares, não substituíveis.' }],
    interferentes: { preAnalitico: ['Antibiótico prévio reduz drasticamente o rendimento.', 'Volume insuficiente de sangue reduz a sensibilidade da hemocultura.', 'Urina de coleta inadequada ou com demora à temperatura ambiente supervaloriza a contagem.'] },
    utilidade: ['diagnostico'],
    estudarTambem: ['procalcitonina', 'pcr', 'lactato', 'eas'],
  },

  /* ────────────────────── Pâncreas e trato digestivo ────────────────────── */
  {
    id: 'lipase',
    nome: 'Lipase e amilase',
    sinonimos: ['lipase', 'amilase', 'amilasemia', 'enzimas pancreaticas'],
    grupo: 'digestivo',
    sistemas: ['digestivo'],
    material: 'Soro',
    unidade: 'U/L',
    referencias: [
      { rotulo: 'Lipase', minimo: 10, maximo: 60, unidade: 'U/L' },
      { rotulo: 'Amilase', minimo: 30, maximo: 110, unidade: 'U/L' },
      { rotulo: 'Critério de pancreatite', texto: '≥ 3 vezes o limite superior', unidade: '', observacao: 'O valor não se correlaciona com a gravidade — não serve para prognóstico nem para acompanhamento.' },
    ],
    resumo:
      'Enzimas pancreáticas liberadas na inflamação da glândula. A lipase é mais específica e permanece elevada por mais tempo; a amilase tem muitas origens extrapancreáticas.',
    entenda:
      'A pancreatite aguda é diagnosticada por dois de três critérios: dor abdominal característica, elevação enzimática acima de três vezes o limite superior e achados de imagem. A lipase é preferida à amilase: é mais específica (a amilase também vem das glândulas salivares, das trompas e do intestino) e permanece elevada por 8 a 14 dias, contra 3 a 5 da amilase — o que a torna útil em quem procura atendimento tardiamente. Ponto essencial: a magnitude da elevação não indica gravidade, e repetir a dosagem para acompanhar não acrescenta nada.',
    fisiologia: {
      oQueE: 'Lipase: hidrolisa triglicerídeos. Amilase: hidrolisa amido e glicogênio.',
      origem: 'Lipase: predominantemente pâncreas. Amilase: pâncreas, glândulas salivares, trompas, intestino e ovários.',
      funcao: 'Digestão de gorduras e de carboidratos no lúmen intestinal.',
      eliminacao: 'A amilase é depurada pelo rim (e acumula-se na doença renal); a lipase é reabsorvida no túbulo.',
      percurso: ['Célula acinar pancreática', 'lesão ou obstrução ductal', 'extravasamento enzimático para o interstício e a circulação', 'lipase e amilase séricas ↑'],
    },
    aumento: {
      resumo: 'Pancreatite aguda, mas também obstrução intestinal, isquemia mesentérica, doença renal, macroamilasemia e patologia salivar.',
      mecanismos: [
        {
          titulo: 'Lesão pancreática',
          explicacao: 'A ativação intra-acinar das enzimas provoca autodigestão e liberação para a circulação.',
          exemplos: [
            { causa: 'Pancreatite biliar', etapas: ['cálculo obstrui a ampola', 'refluxo e hipertensão ductal', 'ativação intra-acinar do tripsinogênio', 'autodigestão', 'lipase e amilase ↑↑'], nota: 'É a causa mais comum. ALT acima de três vezes o normal em pancreatite aguda favorece fortemente a etiologia biliar.' },
            { causa: 'Pancreatite alcoólica', etapas: ['toxicidade direta e alteração da secreção', 'inflamação pancreática'] },
            { causa: 'Pancreatite hipertrigliceridêmica', etapas: ['triglicerídeos > 1.000 mg/dL', 'ácidos graxos livres tóxicos ao ácino', 'pancreatite'], nota: 'A lipemia intensa pode inibir o ensaio e produzir amilase falsamente normal — a lipase é mais confiável nesse cenário.' },
            { causa: 'Pós-CPRE, medicamentos (azatioprina, ácido valproico, didanosina), trauma, hipercalcemia', etapas: ['lesão acinar', 'enzimas ↑'] },
          ],
        },
        {
          titulo: 'Causas não pancreáticas',
          explicacao: 'Outras fontes da enzima ou redução do clearance.',
          exemplos: [
            { causa: 'Parotidite, cetoacidose diabética, gestação ectópica, obstrução intestinal, isquemia mesentérica, úlcera perfurada', etapas: ['liberação extrapancreática ou lesão de vizinhança', 'amilase ↑ com lipase normal ou pouco elevada'] },
            { causa: 'Doença renal crônica', etapas: ['clearance ↓', 'ambas elevadas em até 2 a 3 vezes sem pancreatite'] },
            { causa: 'Macroamilasemia', etapas: ['complexo amilase-imunoglobulina não filtrado', 'amilase persistentemente alta com lipase normal e amilase urinária baixa'], nota: 'Condição benigna que evita investigação desnecessária quando reconhecida.' },
          ],
        },
      ],
    },
    reducao: { resumo: 'Insuficiência pancreática exócrina avançada e fibrose cística — pouco usada como diagnóstico.', mecanismos: [{ titulo: 'Perda de massa acinar', explicacao: 'Não há tecido para produzir a enzima.', exemplos: [{ causa: 'Pancreatite crônica avançada, fibrose cística', etapas: ['destruição do parênquima exócrino', 'enzimas séricas ↓ com esteatorreia'], nota: 'A elastase fecal é o exame adequado para avaliar insuficiência exócrina.' }] }] },
    relacionados: [
      { titulo: 'Para definir a etiologia', ids: ['alt', 'triglicerideos', 'calcio', 'ggt'], leitura: 'ALT alta aponta origem biliar; triglicerídeos acima de 1.000, origem metabólica; hipercalcemia é causa mais rara e reconhecível.' },
      { titulo: 'Para avaliar gravidade', ids: ['pcr', 'creatinina', 'calcio', 'hematocrito', 'glicemia-jejum'], leitura: 'A gravidade se avalia por PCR, ureia, hematócrito, cálcio e disfunção orgânica — nunca pelo valor da lipase.' },
    ],
    interferentes: {
      preAnalitico: ['Lipemia intensa interfere no ensaio de amilase.'],
      medicamentos: ['Opioides podem elevar discretamente por espasmo do esfíncter de Oddi.'],
    },
    cinetica: { inicio: 'Sobem em 3 a 6 horas.', pico: '24 horas.', normalizacao: 'Amilase em 3 a 5 dias; lipase em 8 a 14 dias.', tendencia: 'Repetir a dosagem não avalia gravidade nem resposta — o acompanhamento é clínico, laboratorial (PCR, função orgânica) e por imagem.' },
    utilidade: ['diagnostico'],
    padroes: ['pancreatite-aguda'],
    estudarTambem: ['alt', 'triglicerideos', 'calcio', 'pcr'],
  },
]
