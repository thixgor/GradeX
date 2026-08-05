/**
 * Módulos 8 a 11: o que acontece quando cada onda dá errado, como identificar
 * bloqueios, o efeito de eletrólitos e temperatura, e a leitura sistemática.
 */
import type { CourseModule } from '../types'

export const MODULO_ALTERACOES: CourseModule = {
  id: 'alteracoes',
  title: 'Quando a onda dá errado',
  tagline: 'Cada deformidade tem um mecanismo — e ele é dedutível',
  color: 'orange',
  lessons: [
    /* ───────────────────────────── 8.1 ───────────────────────────── */
    {
      id: 'onda-p-alterada',
      title: 'Onda P alterada',
      subtitle: 'Alta, larga, invertida, ausente e bloqueada',
      minutes: 10,
      xp: 40,
      steps: [
        {
          kind: 'teach',
          title: 'A P conta a história dos átrios',
          lead: 'Primeira metade da P = átrio direito. Segunda metade = átrio esquerdo. Toda alteração de P se explica por qual metade cresceu, atrasou ou sumiu.',
          bullets: [
            { t: 'P pulmonale (alta)', d: '≥ 2,5 mm em D2, D3 ou aVF, apiculada. Sobrecarga atrial DIREITA: os dois átrios continuam despolarizando em sequência, mas o vetor direito cresce e a soma fica mais alta, não mais larga. Causas: DPOC, hipertensão pulmonar, estenose tricúspide, cardiopatia congênita.' },
            { t: 'P mitrale (larga e entalhada)', d: '≥ 120 ms com entalhe de ≥ 40 ms entre os picos em D2, e componente negativo terminal em V1 com área ≥ 1 mm × 40 ms (índice de Morrow). Sobrecarga atrial ESQUERDA: o átrio esquerdo despolariza tardiamente e prolonga a segunda metade da P. Causas: estenose/insuficiência mitral, hipertensão, disfunção diastólica.' },
            { t: 'P invertida em D2/D3/aVF', d: 'A despolarização atrial vem de BAIXO para cima: ritmo atrial baixo ou juncional com condução retrógrada. Se o PR for < 120 ms, é juncional; se a P vier depois do QRS, é juncional com condução retrógrada tardia.' },
            { t: 'P ausente', d: 'Fibrilação atrial (linha ondulante, RR irregular), ritmo juncional (RR regular, QRS estreito), parada sinusal, hipercalemia grave (paralisia atrial — P some antes de o QRS alargar) e bloqueio sinoatrial.' },
            { t: 'P bloqueada', d: 'P presente sem QRS depois. Se o PR ia alongando, é Mobitz I; se estava fixo, é Mobitz II; se não há relação nenhuma, é BAVT.' },
            { t: 'P sem relação com o QRS', d: 'Dissociação AV. Procure a P "andando" por cima e por dentro do QRS e da T. É o achado que fecha BAVT e ajuda a provar taquicardia ventricular.' },
          ],
          widget: { id: 'wave-doctor', props: { focus: 'p' } },
          callouts: [
            {
              kind: 'macete',
              title: 'Pulmonale × Mitrale',
              text: 'PulmonAle = Alta (a doença é do pulmão, à DIREITA). MitrAle = LArga (a valva mitral é à ESQUERDA, e o átrio esquerdo atrasa). "Direita cresce pra cima, esquerda cresce pro lado."',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Paciente com estenose mitral. ECG: P de 140 ms em D2, com dois picos separados por 45 ms, e componente negativo terminal profundo em V1.',
          question: 'O que esse padrão indica e qual o mecanismo?',
          options: [
            { text: 'Sobrecarga atrial direita, por aumento do vetor inicial' },
            { text: 'Sobrecarga atrial esquerda, por atraso da despolarização do átrio esquerdo prolongando a segunda metade da P', correct: true },
            { text: 'Bloqueio AV de 1º grau, por atraso no nó AV' },
            { text: 'Ritmo atrial ectópico baixo' },
          ],
          explain: 'P mitrale. O átrio esquerdo dilatado leva mais tempo para despolarizar; como ele é o SEGUNDO a ser ativado (via feixe de Bachmann), o prolongamento aparece no fim da onda. Em V1, o átrio esquerdo é posterior e se afasta do eletrodo — daí o componente negativo terminal.',
        },
      ],
    },

    /* ───────────────────────────── 8.2 ───────────────────────────── */
    {
      id: 'qrs-alterado',
      title: 'QRS alterado',
      subtitle: 'Largo, alto, baixo, com Q patológica',
      minutes: 11,
      xp: 40,
      steps: [
        {
          kind: 'teach',
          title: 'Quatro perguntas sobre todo QRS',
          bullets: [
            { t: 'Está LARGO (≥ 120 ms)?', d: 'Só há duas explicações: o estímulo nasceu fora do sistema de condução (ritmo ventricular, marca-passo, WPW) ou o sistema de condução está quebrado (bloqueio de ramo, hipercalemia, drogas classe I). Não existe QRS largo "por hipertrofia" isolada.' },
            { t: 'Está ALTO?', d: 'Sokolow-Lyon: S em V1 + R em V5 ou V6 ≥ 35 mm. Cornell: R em aVL + S em V3 > 28 mm (homem) / > 20 mm (mulher). R em aVL ≥ 11 mm. Somado a sobrecarga (infra de ST com T assimétrica em V5/V6, o "strain"), fecha hipertrofia de VE.' },
            { t: 'Está BAIXO (< 5 mm nos membros e < 10 mm nas precordiais)?', d: 'Algo está entre o coração e o eletrodo, ou o músculo diminuiu: derrame pericárdico, obesidade, DPOC/enfisema, mixedema, amiloidose, pneumotórax, anasarca.' },
            { t: 'Tem Q PATOLÓGICA?', d: '≥ 40 ms ou ≥ 25% do R, em duas contíguas. Necrose. Localize pelo grupo de derivações e você localiza o infarto.' },
          ],
          widget: { id: 'wave-doctor', props: { focus: 'qrs' } },
          callouts: [
            {
              kind: 'clinica',
              title: 'Alternância elétrica',
              text: 'QRS que muda de amplitude a cada batimento, com taquicardia e baixa voltagem, é a tríade de derrame pericárdico volumoso com tamponamento — o coração está literalmente balançando dentro do líquido. É emergência de pericardiocentese.',
            },
            {
              kind: 'macete',
              title: 'Largo = "de onde veio ou por onde passou"',
              text: 'QRS largo? Pergunte: "de ONDE veio esse estímulo" (ventrículo, marca-passo, via acessória) ou "por ONDE ele passou" (ramo bloqueado, miocárdio envenenado por potássio ou por bloqueador de sódio). Uma das duas responde sempre.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Paciente oncológico, dispneico, hipotenso. ECG: taquicardia sinusal a 118 bpm, QRS de 4 mm nos membros, com amplitude alternando batimento a batimento.',
          question: 'Qual o diagnóstico eletrocardiográfico?',
          options: [
            { text: 'Hipertrofia de ventrículo esquerdo com sobrecarga' },
            { text: 'Derrame pericárdico volumoso com alternância elétrica — suspeita de tamponamento', correct: true },
            { text: 'Infarto anterior extenso' },
            { text: 'Bloqueio de ramo esquerdo intermitente' },
          ],
          explain: 'A tríade taquicardia + baixa voltagem + alternância elétrica é altamente sugestiva de tamponamento. O coração oscila ("swinging heart") dentro do líquido, mudando a orientação do vetor a cada batimento. Ecocardiograma à beira do leito e pericardiocentese.',
        },
      ],
    },

    /* ───────────────────────────── 8.3 ───────────────────────────── */
    {
      id: 'st-e-t',
      title: 'ST e onda T alterados',
      subtitle: 'Supra, infra, T apiculada, T invertida',
      minutes: 12,
      xp: 45,
      steps: [
        {
          kind: 'teach',
          title: 'Por que o ST desnivela',
          lead: 'O segmento ST é a fase 2. Quando uma região do miocárdio não consegue fazer o platô como as vizinhas, aparece um gradiente de voltagem entre elas — e a linha sai do isoelétrico.',
          body: [
            'Na lesão SUBEPICÁRDICA (transmural, oclusão total), o vetor de lesão aponta para FORA, em direção ao eletrodo que cobre a área: supradesnivelamento. Na lesão SUBENDOCÁRDICA (suboclusão, desequilíbrio oferta/demanda), o vetor aponta para DENTRO, afastando-se do eletrodo: infradesnivelamento.',
            'Por isso o supra localiza a artéria culpada e o infra, na maioria das vezes, não localiza nada — o infra difuso é um fenômeno global de subendocárdio.',
          ],
          bullets: [
            { t: 'Supra de ST isquêmico', d: 'Convexo para cima ("em abóbada"/tombstone), localizado em derivações contíguas, com imagem em espelho recíproca. Critério: ≥ 1 mm em duas contíguas; em V2–V3, ≥ 2 mm em homens > 40 anos, ≥ 2,5 mm em homens < 40 e ≥ 1,5 mm em mulheres.' },
            { t: 'Supra de pericardite', d: 'Côncavo para cima ("carinha feliz"), DIFUSO (não respeita território coronariano), sem imagem em espelho (exceto aVR), com INFRA DE PR — o achado mais específico. Relação ST/T em V6 > 0,25 sugere pericardite.' },
            { t: 'Repolarização precoce', d: 'Supra côncavo com entalhe no ponto J, em jovens, mais em V2–V5, com T alta e assimétrica. Estável ao longo do tempo. Não some com exercício (ao contrário, costuma normalizar).' },
            { t: 'Infra de ST', d: 'Horizontal ou descendente ≥ 0,5 mm é isquemia até prova em contrário. Ascendente ("upsloping") tem menor valor. Infra difuso com supra em aVR = lesão de tronco ou triarterial.' },
            { t: 'Infra em "colher"', d: 'Côncavo, com descida suave — impregnação digitálica. Não é isquemia nem intoxicação: é efeito. Vem com QT curto e T achatada.' },
            { t: 'T apiculada', d: 'Alta, estreita, simétrica, base estreita: hipercalemia. Alta, larga, assimétrica, base larga: isquemia hiperaguda (a primeira alteração do infarto, antes do supra).' },
            { t: 'T invertida', d: 'Isquemia (simétrica, profunda), sobrecarga/strain (assimétrica, com infra), lesão de SNC (gigante, com QT longo), embolia pulmonar (V1–V4), miocardite, memória elétrica pós-marca-passo. Em V1 e D3 pode ser normal; em aVR é sempre normal.' },
            { t: 'Padrão de Wellens', d: 'T bifásica (tipo A) ou profundamente invertida e simétrica (tipo B) em V2–V3, com dor JÁ RESOLVIDA e enzimas normais ou pouco alteradas. Indica suboclusão crítica da descendente anterior proximal. Não faça teste ergométrico: encaminhe ao cateterismo.' },
          ],
          widget: { id: 'wave-doctor', props: { focus: 'st' } },
          callouts: [
            {
              kind: 'macete',
              title: 'Carinha feliz × carinha triste',
              text: 'Supra CÔNCAVO (sorriso, "carinha feliz") tende a ser benigno: pericardite, repolarização precoce. Supra CONVEXO (careta, "carinha triste"/abóbada) é infarto. E o infra de PR é a assinatura da pericardite: nenhuma outra causa comum de supra tem isso.',
            },
            {
              kind: 'macete',
              title: 'Espelho localiza a culpada',
              text: 'Supra em D2/D3/aVF com D3 > D2 e infra em D1/aVL → coronária DIREITA. Supra inferior com D2 ≥ D3 e sem infra em D1 → circunflexa. Supra em V1–V4 → descendente anterior. Sempre confira V4R no inferior.',
            },
          ],
        },
        {
          kind: 'order',
          question: 'Ordene a evolução eletrocardiográfica do infarto com supra',
          items: [
            'Onda T hiperaguda (alta, larga, simétrica) — minutos',
            'Supradesnivelamento de ST convexo — minutos a horas',
            'Aparecimento da onda Q patológica — horas',
            'Inversão da onda T com ST ainda elevado — 1 a 3 dias',
            'Normalização do ST, mantendo Q e T invertida — dias a semanas',
            'Onda Q persistente com T normalizada — meses (sequela)',
          ],
          explain: 'A onda T hiperaguda é a PRIMEIRA alteração e a mais perdida — um ECG "quase normal" com T alta e larga em paciente com dor merece novo traçado em 10–15 minutos. Se o supra persiste além de 4–6 semanas com Q, suspeite de aneurisma ventricular.',
        },
        {
          kind: 'quiz',
          stem: 'Jovem de 26 anos, dor torácica que piora ao deitar e melhora ao inclinar-se para frente, após quadro viral. ECG: supra de ST côncavo em D1, D2, aVL, aVF, V2 a V6, infra de ST em aVR e infradesnivelamento do segmento PR em D2.',
          question: 'Qual achado é o mais específico para o diagnóstico?',
          options: [
            { text: 'O supra difuso em muitas derivações' },
            { text: 'A concavidade do supradesnivelamento' },
            { text: 'O infradesnivelamento do segmento PR', correct: true },
            { text: 'A ausência de onda Q' },
          ],
          explain: 'Infra de PR é a assinatura da pericardite: reflete a corrente de lesão ATRIAL (a onda Ta deslocada), que praticamente nenhuma outra causa de supra produz. Supra difuso sem território coronariano e sem imagem em espelho apoia, mas é o infra de PR que fecha. Em aVR o padrão se inverte: supra de PR e infra de ST.',
        },
      ],
    },
  ],
}

export const MODULO_BLOQUEIOS: CourseModule = {
  id: 'bloqueios',
  title: 'Bloqueios',
  tagline: 'Atrioventriculares, de ramo e fasciculares',
  color: 'fuchsia',
  lessons: [
    /* ───────────────────────────── 9.1 ───────────────────────────── */
    {
      id: 'bloqueios-av',
      title: 'Bloqueios atrioventriculares',
      subtitle: '1º, 2º (Mobitz I e II), 2:1, avançado e total',
      minutes: 14,
      xp: 55,
      steps: [
        {
          kind: 'teach',
          title: 'O algoritmo em três perguntas',
          lead: 'Todo bloqueio AV se resolve olhando a relação entre P e QRS. Três perguntas, na ordem, resolvem qualquer traçado.',
          bullets: [
            { t: '1. Toda P é seguida de QRS?', d: 'SIM e PR > 200 ms → BAV de 1º grau. SIM e PR normal → não há bloqueio AV.' },
            { t: '2. Alguma P não conduz?', d: 'Então é 2º grau ou total. Vá para a pergunta 3.' },
            { t: '3. O PR das batidas conduzidas é constante?', d: 'ALONGA progressivamente até falhar → Mobitz I (Wenckebach). CONSTANTE e de repente falha → Mobitz II. NÃO há relação nenhuma entre P e QRS → BAV total (3º grau).' },
          ],
          widget: { id: 'block-lab', props: { focus: 'av' } },
        },
        {
          kind: 'teach',
          title: 'Os cinco padrões, com nome e conduta',
          table: {
            head: ['Tipo', 'ECG', 'Sítio provável', 'Conduta'],
            rows: [
              [
                'BAV 1º grau',
                'PR > 200 ms, fixo, toda P conduz',
                'Nodal (na maioria)',
                'Benigno isolado. Investigar drogas, isquemia inferior, doença de Lyme, atleta',
              ],
              [
                'BAV 2º grau Mobitz I (Wenckebach)',
                'PR alonga progressivamente até uma P bloquear; o RR ENCURTA antes da pausa; pausa < 2 × RR anterior',
                'Nodal',
                'Geralmente benigno; frequente em atletas e à noite. Tratar só se sintomático',
              ],
              [
                'BAV 2º grau Mobitz II',
                'PR FIXO nas conduzidas, com falha súbita e imprevisível; costuma vir com QRS largo',
                'Infranodal (His-Purkinje)',
                'Nunca é benigno. Alto risco de progressão para BAVT. MARCA-PASSO',
              ],
              [
                'BAV 2:1',
                'Uma P conduz, uma não, alternadamente. Não dá para ver o PR alongando (não há duas conduzidas seguidas)',
                'Indeterminado',
                'Investigue: QRS estreito + melhora com atropina/exercício = nodal. QRS largo + piora com exercício = infranodal',
              ],
              [
                'BAV total (3º grau)',
                'Dissociação AV completa: P-P regular, R-R regular, sem relação; frequência atrial > ventricular',
                'Nodal ou infranodal, conforme o escape',
                'MARCA-PASSO. Escape estreito 40–60 = nodal; largo 20–40 = infranodal, mais instável',
              ],
            ],
          },
          callouts: [
            {
              kind: 'macete',
              title: 'Os apelidos que resolvem',
              text: 'MOBITZ I = "vai enrolando até desistir" (PR alonga, aí falha). MOBITZ II = "sem aviso" (PR fixo, falha do nada). BAVT = "cada um na sua" (P e QRS marchando independentes). Wenckebach começa com W de "Wagarosa": vai devagar até parar.',
            },
            {
              kind: 'macete',
              title: 'A escada do Wenckebach',
              text: 'No Mobitz I, o INCREMENTO do PR diminui a cada batimento, por isso o RR vai ENCURTANDO antes da pausa. Achou RR encurtando antes de uma pausa? É Wenckebach, mesmo que você não consiga medir o PR.',
            },
            {
              kind: 'clinica',
              title: 'Não dê atropina no bloqueio infranodal',
              text: 'Atropina acelera o nó SA, aumenta o número de P chegando — e o His-Purkinje doente não dá conta, aumentando o grau de bloqueio. Bradicardia com QRS largo e Mobitz II: marca-passo transcutâneo e transvenoso, não atropina.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Traçado: P-P regular a 80 bpm. PR do 1º batimento 180 ms, do 2º 240 ms, do 3º 300 ms; a 4ª P não conduz. O ciclo se repete. QRS de 90 ms.',
          question: 'Qual o diagnóstico e o sítio provável?',
          options: [
            { text: 'BAV 2º grau Mobitz II, infranodal' },
            { text: 'BAV 2º grau Mobitz I (Wenckebach), nodal', correct: true },
            { text: 'BAV total com escape juncional' },
            { text: 'BAV de 1º grau com extrassístoles atriais bloqueadas' },
          ],
          explain: 'PR alongando progressivamente até uma P bloquear, em ciclos (aqui 4:3), com QRS estreito: Wenckebach nodal. Repare no detalhe fisiológico: o incremento do PR diminui (60 ms, depois 60 ms) e por isso o RR encurta antes da pausa — o oposto do que a intuição diz. Conduta: observar, revisar drogas, tratar só se sintomático.',
        },
      ],
    },

    /* ───────────────────────────── 9.2 ───────────────────────────── */
    {
      id: 'bloqueios-ramo',
      title: 'Bloqueios de ramo e fasciculares',
      subtitle: 'BRD, BRE, BDAS, BDPI — critérios e macetes',
      minutes: 13,
      xp: 50,
      steps: [
        {
          kind: 'teach',
          title: 'O raciocínio: quem está bloqueado despolariza por último',
          lead: 'Se um ramo está bloqueado, o ventrículo dele não recebe o impulso pela via rápida. Ele é ativado tardiamente, célula a célula, vindo do outro lado. Isso alarga o QRS e joga a porção FINAL do complexo para o lado bloqueado.',
          body: [
            'Daí o método universal: olhe o FIM do QRS. Se o final aponta para a direita (R′ em V1, S alargada em V6, "atraso final direito"), o ramo bloqueado é o DIREITO. Se o final aponta para a esquerda (R alargada e entalhada em V6/D1, ausência de q septal), o bloqueado é o ESQUERDO.',
          ],
          table: {
            head: ['', 'BRD', 'BRE'],
            rows: [
              ['QRS', '≥ 120 ms (incompleto: 110–119)', '≥ 120 ms'],
              ['V1', 'rsR′ ou rSR′ ("orelhas de coelho", "M")', 'QS ou rS profundo e alargado'],
              ['V6 / D1', 'S alargada e empastada', 'R alargada, com entalhe/platô; SEM onda q septal'],
              ['Repolarização', 'T invertida em V1–V3 (discordância esperada)', 'T invertida em D1, aVL, V5–V6 (discordância esperada)'],
              ['Significado clínico', 'Frequente em normais; investigar VD, TEP, congênitos', 'Quase sempre doença estrutural: HAS, isquemia, cardiomiopatia, estenose aórtica'],
            ],
          },
          widget: { id: 'bbb-lab' },
          callouts: [
            {
              kind: 'macete',
              title: 'WiLLiaM MaRRoW',
              text: 'BRE (LBBB, Left) = W em V1 e M em V6 → "Wi-LL-iam". BRD (RBBB, Right) = M em V1 e W em V6 → "Ma-RR-ow". As letras duplas do meio dizem o lado. É o macete mais usado do mundo — e funciona porque o fim do QRS aponta para o lado doente.',
            },
            {
              kind: 'macete',
              title: 'A "orelha de coelho"',
              text: 'rSR′ em V1 é a orelha de coelho do BRD. Se a segunda orelha (R′) for MAIOR que a primeira e vier em taquicardia de QRS largo, pense em origem VENTRICULAR, não em BRD (critério de Marriott/Brugada).',
            },
            {
              kind: 'atencao',
              title: 'BRE novo é bandeira vermelha',
              text: 'BRE presumidamente novo com dor torácica típica é tratado como equivalente de infarto com supra. Para diagnosticar infarto NA VIGÊNCIA de BRE ou de ritmo de marca-passo, use os critérios de Sgarbossa modificados (Smith): supra concordante ≥ 1 mm, infra concordante ≥ 1 mm em V1–V3, ou supra discordante com razão ST/S ≤ −0,25.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Bloqueios fasciculares (divisionais)',
          bullets: [
            { t: 'BDAS — anterossuperior', d: 'Eixo entre −45° e −90°; qR em D1 e aVL; rS em D2, D3 e aVF; QRS < 120 ms; deflexão intrinsecoide em aVL ≥ 45 ms. É o mais comum, porque o fascículo é fino, longo e tem irrigação única.' },
            { t: 'BDPI — posteroinferior', d: 'Eixo entre +90° e +180°; rS em D1 e aVL; qR em D2, D3 e aVF; QRS < 120 ms. Raro isoladamente — exige excluir hipertrofia de VD, biotipo longilíneo e infarto lateral antes de diagnosticar.' },
            { t: 'Bifascicular', d: 'BRD + BDAS (o mais frequente) ou BRD + BDPI. Risco de progressão para BAVT, sobretudo com síncope.' },
            { t: 'Bloqueio fascicular septal', d: 'R proeminente em V1–V2 com perda da q septal em V5–V6. Diferencial de infarto posterior e hipertrofia de VD.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'Seta do BDAS e do BDPI',
              text: 'BDAS: "Anterossuperior sobe" → eixo para CIMA e para a ESQUERDA (qR em D1/aVL, rS nas inferiores). BDPI: "Posteroinferior desce" → eixo para BAIXO e para a DIREITA (rS em D1/aVL, qR nas inferiores). O padrão qR aponta o fascículo bloqueado.',
            },
            {
              kind: 'prova',
              title: 'Fascicular não alarga',
              text: 'Bloqueio FASCICULAR mantém QRS < 120 ms — ele muda o EIXO, não a largura, porque o outro fascículo do mesmo ramo cobre o território rapidamente. Se o QRS passou de 120 ms, ou há bloqueio de ramo associado, ou não é fascicular isolado.',
            },
          ],
        },
        {
          kind: 'match',
          question: 'Relacione o achado ao bloqueio',
          pairs: [
            { left: 'rSR′ em V1 com S alargada em V6', right: 'Bloqueio de ramo direito' },
            { left: 'R alargada e entalhada em V6, sem q septal', right: 'Bloqueio de ramo esquerdo' },
            { left: 'Eixo −60° com qR em aVL e rS em D2/D3/aVF', right: 'Bloqueio divisional anterossuperior' },
            { left: 'Eixo +120° com qR em D2/D3/aVF e rS em D1', right: 'Bloqueio divisional posteroinferior' },
            { left: 'PR alongando até uma P bloquear', right: 'BAV 2º grau Mobitz I' },
            { left: 'P e QRS totalmente dissociados', right: 'BAV total' },
          ],
          explain: 'Note o padrão: nos bloqueios de RAMO você olha V1 e V6 (plano horizontal, largura do QRS). Nos FASCICULARES você olha o EIXO no plano frontal com QRS estreito. Nos AV você olha a relação P-QRS. Três olhares diferentes para três problemas diferentes.',
        },
        {
          kind: 'quiz',
          stem: 'ECG: QRS de 140 ms, rSR′ em V1, S empastada em V6, eixo a −60° com qR em aVL e rS em D2, D3 e aVF. PR de 230 ms.',
          question: 'Como se descreve esse traçado?',
          options: [
            { text: 'Bloqueio de ramo esquerdo com BAV de 1º grau' },
            { text: 'Bloqueio bifascicular (BRD + BDAS) associado a BAV de 1º grau — o clássico "trifascicular"', correct: true },
            { text: 'Bloqueio divisional posteroinferior isolado' },
            { text: 'Taquicardia ventricular' },
          ],
          explain: 'rSR′ em V1 com QRS ≥ 120 ms = BRD. Eixo −60° com qR em aVL e rS nas inferiores = BDAS. Os dois juntos = bifascicular. Somando o PR > 200 ms, é o padrão historicamente chamado de trifascicular. Com síncope, esse conjunto tem indicação de investigação eletrofisiológica e frequentemente de marca-passo.',
        },
      ],
    },
  ],
}

export const MODULO_METABOLICO: CourseModule = {
  id: 'metabolico',
  title: 'Eletrólitos e temperatura',
  tagline: 'Potássio, cálcio, magnésio, frio e febre — com o mecanismo',
  color: 'teal',
  lessons: [
    {
      id: 'potassio',
      title: 'Potássio: o íon que manda no repouso',
      subtitle: 'Por que a hipercalemia apicula a T e a hipocalemia cria a onda U',
      minutes: 12,
      xp: 45,
      steps: [
        {
          kind: 'teach',
          title: 'O mecanismo, em uma frase',
          lead: 'O potássio determina o potencial de repouso da célula. Mudou o potássio extracelular, mudou o ponto de partida de tudo.',
          body: [
            'O potencial de repouso é essencialmente o potencial de equilíbrio do potássio (equação de Nernst). Quando o K⁺ extracelular SOBE, o gradiente entre dentro e fora diminui e a célula fica MENOS negativa (despolarizada parcialmente, ex.: de −90 para −70 mV).',
            'Duas consequências opostas e simultâneas: (1) a repolarização fica mais RÁPIDA, porque a hipercalemia aumenta a condutância dos canais IKr — daí a onda T alta, estreita e simétrica; (2) a despolarização fica mais LENTA, porque o repouso menos negativo mantém parte dos canais de sódio inativados — daí o achatamento da P, o alargamento do QRS e o prolongamento do PR.',
            'Na hipocalemia, o inverso: a repolarização se arrasta, a onda T achata e a repolarização tardia (Purkinje/células M) se destaca como onda U proeminente. O que parece "QT longo" é, muitas vezes, uma fusão T-U mal medida.',
          ],
          table: {
            head: ['K⁺ sérico', 'Achado no ECG', 'Mecanismo'],
            rows: [
              ['5,5–6,5', 'T apiculada, estreita, simétrica, base estreita ("em tenda")', 'IKr acelerado → repolarização mais rápida'],
              ['6,5–7,5', 'PR longo, P achata e some (paralisia atrial)', 'Átrio é mais sensível: sódio inativado precocemente'],
              ['7,0–8,0', 'QRS alarga progressivamente', 'Canais de sódio inativados → fase 0 lenta'],
              ['> 8,0', 'Onda sinusoidal (QRS funde com T)', 'Condução muito lenta e repolarização rápida se sobrepondo'],
              ['> 9,0', 'Fibrilação ventricular / assistolia', 'Perda total da excitabilidade organizada'],
              ['< 3,0', 'T achatada, infra de ST, onda U proeminente, QU longo', 'Repolarização prolongada e heterogênea'],
              ['< 2,5', 'Fusão T-U, extrassístoles, risco de torsades', 'Dispersão da repolarização'],
            ],
          },
          widget: { id: 'electrolyte-lab', props: { scenario: 'potassio' } },
          callouts: [
            {
              kind: 'macete',
              title: 'A "escada da hipercalemia"',
              text: 'T em TENDA → P some → PR alonga → QRS alarga → SINUSOIDAL → parada. Sobe um degrau a cada 0,5–1,0 mEq. E o macete visual: "a T fica pontuda o bastante para furar a mão".',
            },
            {
              kind: 'macete',
              title: 'Hipocalemia = "U de Uau, cadê o potássio"',
              text: 'T achata e nasce a U. Se você vê onda U grande, pense em POTÁSSIO BAIXO — e cheque o magnésio junto, porque hipomagnesemia impede a correção do potássio (bloqueia a reabsorção renal).',
            },
            {
              kind: 'clinica',
              title: 'ECG não exclui hipercalemia',
              text: 'Até 1/3 dos pacientes com K⁺ > 6,5 têm ECG normal. Nunca descarte hipercalemia por traçado normal. Mas ECG alterado com hipercalemia = EMERGÊNCIA: gluconato de cálcio primeiro (estabiliza a membrana em minutos, sem mexer no potássio), depois insulina+glicose e beta-2 (deslocam), depois diálise/resina (removem).',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Paciente renal crônico, fraqueza. ECG: ausência de ondas P, QRS de 160 ms, T altas e apiculadas, FC 48 bpm.',
          question: 'Qual a primeira medida terapêutica?',
          options: [
            { text: 'Insulina regular com glicose' },
            { text: 'Gluconato de cálcio intravenoso', correct: true },
            { text: 'Hemodiálise de urgência' },
            { text: 'Bicarbonato de sódio' },
          ],
          explain: 'Com alterações eletrocardiográficas, o cálcio vem PRIMEIRO: ele não reduz o potássio, mas restaura o gradiente entre o potencial de repouso e o limiar, estabilizando a membrana em 1–3 minutos e prevenindo fibrilação ventricular. Insulina+glicose e beta-2 deslocam o potássio para dentro da célula (30–60 min) e a diálise remove (definitivo) — nessa ordem.',
        },
        {
          kind: 'fill',
          question: 'Complete',
          sentence: 'Na hipercalemia, o alargamento do QRS ocorre porque o potencial de repouso menos negativo mantém os canais de ___ inativados.',
          options: ['sódio', 'potássio', 'cálcio', 'cloreto'],
          answer: 'sódio',
          explain: 'Com repouso em −70 mV em vez de −90 mV, boa parte dos canais rápidos de sódio permanece na conformação inativada. Sobra menos corrente INa para a fase 0, ela fica lenta e a condução se arrasta — QRS largo. É o mesmo mecanismo pelo qual bloqueadores de canal de sódio (classe I, antidepressivos tricíclicos) alargam o QRS, e por isso o bicarbonato ajuda nas duas situações.',
        },
      ],
    },
    {
      id: 'calcio-temperatura',
      title: 'Cálcio, magnésio e temperatura',
      subtitle: 'Quem mexe no ST e no QT, e por quê',
      minutes: 11,
      xp: 45,
      steps: [
        {
          kind: 'teach',
          title: 'Cálcio: o íon do platô',
          lead: 'O cálcio comanda a fase 2. Mexer nele muda a DURAÇÃO do platô — ou seja, o comprimento do segmento ST — sem mexer na onda T.',
          bullets: [
            { t: 'HIPOcalcemia', d: 'Menos cálcio extracelular → menor gradiente → a corrente ICaL demora mais a se completar → PLATÔ MAIS LONGO → segmento ST ALONGADO → QT LONGO com onda T de morfologia e duração NORMAIS. É a assinatura: QT longo à custa do ST, não da T. Risco de torsades. Causas: hipoparatireoidismo, pós-tireoidectomia, pancreatite, sepse, rabdomiólise, transfusão maciça (citrato).' },
            { t: 'HIPERcalcemia', d: 'Mais cálcio → platô encurta → ST curto ou ausente (a T "nasce colada" no QRS) → QT CURTO. Em níveis muito altos, pode surgir onda J de Osborn e bradiarritmias. Causas: hiperparatireoidismo, neoplasia, imobilização, intoxicação por vitamina D.' },
            { t: 'HIPOmagnesemia', d: 'Prolonga o QT, achata a T e favorece torsades. Quase sempre anda junto com hipocalemia e hipocalcemia — e sem corrigir o magnésio, o potássio não sobe.' },
            { t: 'HIPERmagnesemia', d: 'Prolonga PR e QRS, bradicardia; em níveis extremos, bloqueio AV e parada.' },
          ],
          widget: { id: 'electrolyte-lab', props: { scenario: 'calcio' } },
          callouts: [
            {
              kind: 'macete',
              title: 'A regra do "QT de quem"',
              text: 'QT longo com ST ESTICADO e T normal = HIPOcalcemia. QT longo com T ALARGADA/BIZARRA = hipocalemia, drogas ou QT longo congênito. QT curto com ST quase inexistente = HIPERcalcemia. "O cálcio mexe no ST; o potássio mexe na T."',
            },
            {
              kind: 'macete',
              title: 'Cálcio, na mão',
              text: 'CálCio alto = tudo Curto (ST curto, QT curto). Cálcio baixo = tudo Comprido. A palavra "cálcio" tem C de Curto quando ele está alto.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Temperatura: frio e febre',
          bullets: [
            { t: 'HIPOTERMIA', d: 'O frio desacelera TODOS os processos dependentes de canais iônicos e do metabolismo: bradicardia sinusal (que não responde a atropina), prolongamento de PR, QRS e QT, e a onda J de OSBORN — entalhe no ponto J, que aparece abaixo de 32 °C e cresce conforme a temperatura cai. Somam-se tremor muscular no traçado e, abaixo de 30 °C, alto risco de fibrilação atrial e depois ventricular.' },
            { t: 'Por que a onda J aparece no frio', d: 'A hipotermia acentua a corrente Ito da fase 1 no epicárdio, mas não no endocárdio. Cria-se um gradiente transmural de voltagem justo no fim do QRS — e esse gradiente é a onda J.' },
            { t: 'Cuidado no hipotérmico', d: 'O miocárdio frio é irritável: movimentação brusca, intubação e acesso central podem deflagrar FV. E a FV hipotérmica costuma ser refratária à desfibrilação até que o paciente seja reaquecido acima de ~30 °C. "Ninguém está morto até estar quente e morto."' },
            { t: 'HIPERTERMIA / febre', d: 'Acelera tudo: taquicardia sinusal (cerca de +10 bpm por grau acima de 37 °C), encurtamento de PR e QT, aumento do consumo de oxigênio. A febre é também um gatilho clássico do padrão de BRUGADA tipo 1 — em paciente com síndrome de Brugada, tratar a febre agressivamente é conduta antiarrítmica.' },
            { t: 'Dissociação pulso-temperatura', d: 'Febre alta SEM taquicardia proporcional (sinal de Faget) aponta para febre tifoide, legionelose, febre amarela, brucelose ou uso de betabloqueador.' },
          ],
          widget: { id: 'electrolyte-lab', props: { scenario: 'temperatura' } },
          callouts: [
            {
              kind: 'macete',
              title: 'Osborn, o boneco de neve',
              text: 'Onda J de OSBORN = O de "Oh, que frio". Aparece < 32 °C e é proporcional à queda: quanto mais fria a corcova, maior. E lembre da tríade do frio: bradicardia + tudo prolongado + onda J.',
            },
            {
              kind: 'clinica',
              title: 'Febre e Brugada',
              text: 'Se um paciente com padrão de Brugada chega febril, o ECG pode "virar" tipo 1 e o risco de FV sobe. Antitérmico é medida de segurança elétrica, não conforto.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Pós-operatório de tireoidectomia total. Paciente com parestesias periorais e espasmo carpal. ECG: QT de 520 ms a 70 bpm, com segmento ST visivelmente alongado e onda T de duração e morfologia normais.',
          question: 'Qual o distúrbio e por que o ST está alongado?',
          options: [
            { text: 'Hipocalemia — a repolarização se arrasta e cria onda U' },
            { text: 'Hipocalcemia — o platô da fase 2 se prolonga, esticando o segmento ST sem alterar a onda T', correct: true },
            { text: 'Hipercalcemia — o platô encurta' },
            { text: 'Hipotermia — surge onda J de Osborn' },
          ],
          explain: 'Hipoparatireoidismo pós-cirúrgico é a causa clássica. O cálcio extracelular baixo reduz a força motriz da ICaL, prolongando a fase 2. Como só o platô se estica, o QT alonga à custa do SEGMENTO ST, com a onda T preservada — padrão que praticamente fecha o diagnóstico. Trate com gluconato de cálcio IV; hipomagnesemia associada precisa ser corrigida junto.',
        },
        {
          kind: 'match',
          question: 'Relacione o distúrbio ao achado',
          pairs: [
            { left: 'Hipercalemia', right: 'Onda T apiculada e simétrica' },
            { left: 'Hipocalemia', right: 'Onda U proeminente' },
            { left: 'Hipocalcemia', right: 'Segmento ST alongado com T normal' },
            { left: 'Hipercalcemia', right: 'QT curto com ST quase ausente' },
            { left: 'Hipotermia', right: 'Onda J de Osborn' },
            { left: 'Digital (efeito)', right: 'Infra de ST em colher com QT curto' },
          ],
          explain: 'Guarde os pares por onde eles atuam: potássio mexe na onda T (e na U), cálcio mexe no segmento ST, temperatura baixa cria a onda J e o digital "escava" o ST. Nenhum deles é aleatório — cada um age na fase do potencial de ação que controla.',
        },
      ],
    },
  ],
}

export const MODULO_LAUDO: CourseModule = {
  id: 'laudo',
  title: 'A leitura sistemática',
  tagline: 'Dez passos que nunca deixam passar nada — e o caderno de macetes',
  color: 'indigo',
  lessons: [
    {
      id: 'dez-passos',
      title: 'Laudo em dez passos',
      subtitle: 'A ordem que impede o erro de ancoragem',
      minutes: 10,
      xp: 45,
      steps: [
        {
          kind: 'teach',
          title: 'Por que ter uma ordem fixa',
          lead: 'O maior erro na leitura de ECG não é não saber — é achar a alteração óbvia primeiro e parar de olhar. Uma sequência fixa protege contra isso.',
          body: [
            'Leia SEMPRE na mesma ordem, mesmo quando o supra de ST salta aos olhos. Você vai encontrar a segunda alteração, aquela que muda a conduta: o bloqueio associado, a hipercalemia por trás da bradicardia, o QT longo que contraindica a droga que você ia prescrever.',
          ],
          bullets: [
            { t: '1. Dados técnicos', d: 'Nome, data, velocidade (25 mm/s?), ganho (10 mm/mV?), calibração e qualidade do traçado. Artefato? Eletrodo trocado?' },
            { t: '2. Frequência', d: 'Ventricular e, se diferente, atrial.' },
            { t: '3. Ritmo', d: 'Há onda P? Toda P é seguida de QRS? Todo QRS é precedido de P? O RR é regular?' },
            { t: '4. Eixo', d: 'D1 e aVF pelo método dos quadrantes; confirme com D2 se houver desvio à esquerda.' },
            { t: '5. Onda P', d: 'Duração, amplitude, morfologia, eixo.' },
            { t: '6. Intervalo PR', d: 'Curto, normal ou longo? Fixo ou variável?' },
            { t: '7. QRS', d: 'Largura, amplitude, ondas Q, progressão de R, morfologia em V1/V6.' },
            { t: '8. ST e T', d: 'Desnível medido a partir do TP, morfologia da T, imagem em espelho.' },
            { t: '9. QT/QTc', d: 'Meça na derivação com o QT mais longo e corrija.' },
            { t: '10. Comparação e conclusão', d: 'Compare com traçados antigos — "novo" muda tudo. Depois escreva a conclusão em uma frase clínica.' },
          ],
          widget: { id: 'read-order-lab' },
          callouts: [
            {
              kind: 'macete',
              title: 'O mnemônico da ordem',
              text: '"Ficha, Frequência, Ritmo, Eixo, P, PR, QRS, ST-T, QT, Compara" — ou o clássico "Fé Rei, Pé Pequeno, Quase Sempre Quieto, Compara". Qualquer sequência serve, desde que seja SEMPRE a mesma.',
            },
            {
              kind: 'clinica',
              title: 'Comparar salva vidas',
              text: 'Um BRE antigo é achado. Um BRE novo com dor é infarto. Uma T invertida crônica é sequela. Uma T invertida nova é isquemia. Antes de laudar qualquer alteração, pergunte pelo ECG anterior.',
            },
          ],
        },
        {
          kind: 'order',
          question: 'Ordene a leitura sistemática',
          items: [
            'Conferir calibração, velocidade e qualidade do traçado',
            'Calcular a frequência cardíaca',
            'Determinar o ritmo (há P? toda P conduz?)',
            'Determinar o eixo elétrico',
            'Analisar a onda P',
            'Medir o intervalo PR',
            'Analisar o QRS (largura, amplitude, Q, progressão de R)',
            'Analisar o segmento ST e a onda T',
            'Medir o QT e corrigir para a frequência',
            'Comparar com traçados anteriores e concluir',
          ],
          explain: 'Repare que ritmo vem ANTES do eixo e das ondas: você precisa saber de onde vem o estímulo antes de interpretar a forma dele. E a comparação é sempre o último passo — porque é ela que transforma "achado" em "achado novo".',
        },
      ],
    },
    {
      id: 'caderno-macetes',
      title: 'Caderno de macetes',
      subtitle: 'Tudo que se decora, em um lugar só',
      minutes: 8,
      xp: 35,
      steps: [
        {
          kind: 'teach',
          title: 'Números para saber de cor',
          table: {
            head: ['Item', 'Valor', 'Macete'],
            rows: [
              ['Quadradinho', '40 ms / 0,1 mV', '"Zero-quatro e zero-um"'],
              ['Quadradão', '200 ms / 0,5 mV', 'Cinco quadradinhos'],
              ['Onda P', '< 120 ms e < 2,5 mm', '"Cabe em três quadradinhos"'],
              ['PR', '120–200 ms', '"De três a cinco quadradinhos"'],
              ['QRS', '< 120 ms', '"Menos de três quadradinhos"'],
              ['QTc', '≤ 450 / 460 ms', '"QT menor que metade do RR"'],
              ['Q patológica', '≥ 40 ms ou ≥ 25% do R', '"Quarenta e vinte e cinco"'],
              ['Sokolow-Lyon', 'S V1 + R V5/V6 ≥ 35 mm', '"Sete quadradões somados"'],
              ['Eixo normal', '−30° a +90°', '"D1 e aVF positivos"'],
              ['Frequência (regular)', '300 ÷ quadradões', '300-150-100-75-60-50'],
              ['Frequência (irregular)', 'QRS em 6 s × 10', '"Conta e põe um zero"'],
            ],
            numericFrom: 1,
          },
        },
        {
          kind: 'teach',
          title: 'Frases que resolvem questão',
          bullets: [
            { t: 'WiLLiaM MaRRoW', d: 'BRE = W em V1, M em V6. BRD = M em V1, W em V6.' },
            { t: 'Carinha feliz × triste', d: 'Supra côncavo tende a benigno (pericardite, repolarização precoce); convexo é infarto.' },
            { t: 'Infra de PR', d: 'Assinatura da pericardite.' },
            { t: 'D3 > D2 com infra em D1/aVL', d: 'Infarto inferior por coronária DIREITA — peça V4R.' },
            { t: 'Infra em V1–V3 com R alta e T positiva', d: 'Infarto POSTERIOR em espelho — peça V7–V9.' },
            { t: 'Supra em aVR com infra difuso', d: 'Lesão de tronco ou triarterial.' },
            { t: 'T bifásica ou profundamente invertida em V2–V3 sem dor', d: 'Wellens — descendente anterior proximal crítica. Nada de ergométrico.' },
            { t: 'Onda J', d: 'Osborn, hipotermia < 32 °C.' },
            { t: 'T em tenda', d: 'Hipercalemia. Onda U grande = hipocalemia.' },
            { t: 'ST esticado com T normal', d: 'Hipocalemia? Não — HIPOcalcemia.' },
            { t: 'PR curto + delta', d: 'WPW. Em FA com WPW, nada de bloqueador do nó AV.' },
            { t: 'Bradicardia + QRS largo + Mobitz II', d: 'Marca-passo, não atropina.' },
            { t: 'Taquicardia + baixa voltagem + alternância', d: 'Tamponamento.' },
            { t: 'QRS largo em taquicardia: assuma TV', d: 'Em paciente com cardiopatia, taquicardia de QRS largo é TV até prova em contrário. Tratar como TV nunca é o erro grave; tratar TV como TSV é.' },
          ],
          callouts: [
            {
              kind: 'prova',
              title: 'A pergunta de ouro',
              text: 'Diante de qualquer traçado difícil, faça duas perguntas: (1) o QRS é largo ou estreito? (2) o ritmo é regular ou irregular? Essas duas respostas dividem quase todas as arritmias em quatro caixas e reduzem o diferencial a dois ou três diagnósticos.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Taquicardia a 180 bpm, regular, QRS de 150 ms, em paciente de 68 anos com infarto prévio. Há dissociação AV e um batimento de captura.',
          question: 'Qual a conduta correta?',
          options: [
            { text: 'Adenosina, por se tratar provavelmente de TSV com aberrância' },
            { text: 'Tratar como taquicardia ventricular — amiodarona se estável, cardioversão sincronizada se instável', correct: true },
            { text: 'Verapamil intravenoso' },
            { text: 'Manobra vagal seguida de digoxina' },
          ],
          explain: 'Dissociação AV e batimento de captura ou fusão são critérios praticamente diagnósticos de TV. Somados a idade > 35 anos e infarto prévio, a probabilidade de TV passa de 95%. Verapamil em TV pode causar colapso hemodinâmico. A regra permanece: taquicardia de QRS largo em cardiopata é TV até prova em contrário.',
        },
      ],
    },
  ],
}
