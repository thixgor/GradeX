/**
 * Módulos 1 e 2 da trilha: de onde vem a eletricidade do coração e como a
 * célula cardíaca responde a ela (automatismo, condução, refratariedade).
 */
import type { CourseModule } from '../types'

export const MODULO_CONDUCAO: CourseModule = {
  id: 'conducao',
  title: 'A faísca',
  tagline: 'Onde nasce o impulso e por onde ele corre',
  color: 'emerald',
  lessons: [
    /* ───────────────────────────── 1.1 ───────────────────────────── */
    {
      id: 'o-que-e-ecg',
      title: 'O que o ECG realmente mede',
      subtitle: 'Nem batimento, nem contração: diferença de potencial',
      minutes: 6,
      xp: 20,
      steps: [
        {
          kind: 'teach',
          title: 'O ECG não vê o coração bater',
          lead: 'O eletrocardiograma é um voltímetro de altíssima sensibilidade colado na pele. Ele registra a diferença de potencial elétrico entre dois pontos do corpo ao longo do tempo.',
          body: [
            'Quando uma frente de despolarização caminha pelo miocárdio, ela separa, por alguns milissegundos, uma região já despolarizada (negativa por fora) de outra ainda em repouso (positiva por fora). Esse par de cargas separadas é um dipolo — um vetor, com direção, sentido e magnitude.',
            'O corpo humano é um volume condutor: cheio de água e eletrólitos. O dipolo gerado no coração produz correntes que chegam até a pele, e o aparelho amplifica essa voltagem cerca de mil vezes para desenhá-la no papel.',
            'Por isso o ECG é um exame elétrico, não mecânico. Ele diz que o estímulo chegou — não diz que o músculo respondeu. É exatamente essa diferença que define a atividade elétrica sem pulso (AESP): traçado organizado na tela, coração parado no tórax.',
          ],
          callouts: [
            {
              kind: 'porque',
              title: 'A regra de ouro dos vetores',
              text: 'Frente de despolarização que CAMINHA EM DIREÇÃO ao eletrodo positivo → deflexão POSITIVA (para cima). Que se AFASTA → deflexão NEGATIVA. Perpendicular → deflexão isodifásica (metade pra cima, metade pra baixo). Toda a leitura do ECG, do eixo ao infarto, sai dessas três frases.',
            },
            {
              kind: 'atencao',
              text: 'Repolarização é o contrário: a frente de repolarização caminhando em direção ao eletrodo gera deflexão NEGATIVA. Guarde isso — é a razão de a onda T ser positiva mesmo sendo repolarização (o coração repolariza do epicárdio para o endocárdio, ou seja, "de volta").',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Eletrodo não é derivação',
          lead: 'Você cola 10 eletrodos e obtém 12 derivações. Não é mágica nem redundância: derivação é o ponto de vista, eletrodo é a câmera.',
          bullets: [
            { t: '10 eletrodos', d: '4 nos membros (RA, LA, RL, LL) e 6 no tórax (V1 a V6). O do braço direito é o terra funcional junto com a perna direita.' },
            { t: '12 derivações', d: '6 no plano frontal (D1, D2, D3, aVR, aVL, aVF) e 6 no plano horizontal (V1–V6). Cada uma é uma combinação matemática das voltagens captadas.' },
            { t: 'Bipolar', d: 'Compara dois eletrodos entre si (D1, D2, D3). Tem polo positivo e polo negativo explícitos.' },
            { t: 'Unipolar', d: 'Compara um eletrodo com uma referência virtual (central terminal de Wilson). aVR, aVL, aVF e V1–V6 são unipolares.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'Por que "a" de aVR',
              text: 'O "a" é de AUMENTADA (augmented). As unipolares dos membros saíam com voltagem pequena demais; Goldberger removeu o próprio membro explorado da referência e o sinal cresceu ~50%. Daí aVR, aVL, aVF em vez de VR, VL, VF.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Paciente em parada. No monitor, um ritmo sinusal a 70 bpm com QRS estreito. Pulso central ausente.',
          question: 'O que esse traçado normal prova?',
          options: [
            { text: 'Que o coração está ejetando sangue — o problema é vascular' },
            { text: 'Apenas que o estímulo elétrico está sendo gerado e conduzido', correct: true },
            { text: 'Que há erro de leitura do monitor, pois traçado normal exclui parada' },
            { text: 'Que o paciente tem fibrilação ventricular fina' },
          ],
          explain: 'O ECG mede voltagem, não contração. Traçado organizado sem pulso é atividade elétrica sem pulso (AESP): o acoplamento excitação-contração falhou, ou não há volume/pressão para gerar pulso. É por isso que ninguém trata monitor — trata paciente.',
        },
        {
          kind: 'fill',
          question: 'Complete a regra dos vetores',
          sentence: 'Uma frente de DESPOLARIZAÇÃO que se afasta do eletrodo positivo gera uma deflexão ___.',
          options: ['positiva', 'negativa', 'isodifásica', 'ausente'],
          answer: 'negativa',
          explain: 'Afastou-se → negativa. É por isso que aVR (que olha o coração "de cima e da direita", contra o sentido geral da despolarização ventricular) tem P, QRS e T negativos no ECG normal. aVR positivo em ritmo sinusal significa quase sempre eletrodos trocados ou dextrocardia.',
        },
      ],
    },

    /* ───────────────────────────── 1.2 ───────────────────────────── */
    {
      id: 'sistema-conducao',
      title: 'O sistema de condução, peça por peça',
      subtitle: 'Do nó sinusal às fibras de Purkinje — com Bachmann no caminho',
      minutes: 12,
      xp: 40,
      steps: [
        {
          kind: 'teach',
          title: 'Um caminho, sete estações',
          lead: 'O impulso não se espalha ao acaso pelo músculo. Existe uma rede especializada — miócitos modificados, pobres em miofibrilas e ricos em canais iônicos — cuja função não é contrair, mas gerar e distribuir corrente.',
          body: [
            'A sequência é sempre a mesma: nó sinoatrial → vias internodais e feixe de Bachmann → nó atrioventricular → feixe de His (fascículo atrioventricular) → ramos direito e esquerdo → fascículos → rede de Purkinje → miocárdio ventricular.',
            'Cada estação tem duas propriedades numéricas que você precisa saber de cor: a frequência intrínseca (quantas vezes por minuto ela dispara sozinha) e a velocidade de condução (quão rápido o impulso a atravessa). São coisas diferentes, e confundi-las é o erro mais comum do assunto.',
          ],
          widget: { id: 'pacemaker-lab' },
        },
        {
          kind: 'teach',
          title: 'Nó sinoatrial — o maestro',
          lead: 'Nó de Keith-Flack. Fica na parede do átrio direito, junto à desembocadura da veia cava superior, no sulco terminal.',
          bullets: [
            { t: 'Por que ele manda', d: 'Não é por hierarquia anatômica: é porque tem a corrente If ("funny", de sódio, ativada por hiperpolarização) mais rápida. Ele chega ao limiar antes de todos e despolariza os demais antes que eles disparem sozinhos.' },
            { t: 'Supressão por overdrive', d: 'Ao ser estimulada acima da própria frequência, a célula subsidiária acumula sódio intracelular, a bomba Na⁺/K⁺-ATPase acelera e hiperpolariza a célula, atrasando o automatismo dela. Por isso o escape demora alguns segundos a aparecer quando o nó SA para — a pausa assistólica do bloqueio agudo.' },
            { t: 'Irrigação', d: 'Artéria do nó sinusal: ramo da coronária direita em ~60% e da circunflexa em ~40%. Infarto de parede inferior pode dar bradicardia sinusal por isso.' },
            { t: 'Inervação', d: 'Vago (acetilcolina, receptor M2) desacelera; simpático (noradrenalina, β1) acelera. No repouso predomina o tônus vagal — por isso a frequência intrínseca "de laboratório" (~100 bpm) é maior que a de repouso (~70 bpm).' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'SA = Sinusal e Superior',
              text: 'O nó Sinoatrial fica Superior (junto à cava Superior), no átrio direito. O Atrioventricular fica Abaixo, no septo interatrial inferior. Duas letras, duas alturas.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Feixe de Bachmann e as vias internodais',
          lead: 'A onda P não é a despolarização de um átrio só: é a soma de dois — direito primeiro, esquerdo logo em seguida.',
          body: [
            'Do nó SA saem três tratos internodais que conduzem pelo átrio direito até o nó AV: o anterior (de Bachmann), o médio (de Wenckebach) e o posterior (de Thorel). São feixes de miocárdio atrial com orientação preferencial das fibras — condução anisotrópica —, não cabos isolados como o His.',
            'O trato anterior se bifurca: um ramo desce para o nó AV e outro, o feixe de Bachmann propriamente dito, cruza o septo interatrial pelo teto dos átrios e leva o impulso ao átrio esquerdo. É a principal via de condução interatrial.',
            'Consequência direta: a primeira metade da onda P é átrio direito, a segunda metade é átrio esquerdo. Por isso a sobrecarga atrial direita aumenta a ALTURA da P (P pulmonale, componente inicial) e a sobrecarga atrial esquerda aumenta a LARGURA e entalha a P (P mitrale, componente terminal), com componente negativo terminal em V1.',
            'Quando o feixe de Bachmann falha — bloqueio interatrial avançado, a chamada síndrome de Bayés —, o átrio esquerdo passa a ser ativado de baixo para cima, e a P fica larga (≥120 ms) e bifásica ±  em D2, D3 e aVF. É um marcador forte de risco de fibrilação atrial e AVC.',
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'Os nomes dos tratos',
              text: '"BA-WE-TO": Bachmann (Anterior), Wenckebach (Médio), Thorel (Posterior). E lembre: só o de Bachmann atravessa para o átrio ESQUERDO.',
            },
            {
              kind: 'prova',
              text: 'P larga e entalhada em D2 com componente negativo terminal em V1 ≥ 1 mm × 40 ms (índice de Morrow) = sobrecarga atrial esquerda. P alta e apiculada ≥ 2,5 mm em D2 = sobrecarga atrial direita.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Nó atrioventricular — o pedágio',
          lead: 'Nó de Aschoff-Tawara, no triângulo de Koch (delimitado pelo tendão de Todaro, pelo folheto septal da tricúspide e pelo óstio do seio coronário).',
          body: [
            'É o único caminho elétrico entre átrios e ventrículos em um coração normal: o esqueleto fibroso do coração isola eletricamente as câmaras. Qualquer conexão adicional é uma via acessória (feixe de Kent, na pré-excitação).',
            'O nó AV tem três zonas funcionais: AN (atrionodal, transição), N (nodal compacta, onde o atraso é maior) e NH (nodo-His, saída). A zona N é a mais lenta do coração inteiro.',
          ],
          bullets: [
            { t: 'Função 1 — atrasar', d: 'O atraso fisiológico de 90 a 130 ms dá tempo para os átrios esvaziarem nos ventrículos antes da sístole ventricular. É a contribuição atrial ("kick atrial"), 20 a 30% do enchimento — e é por isso que a fibrilação atrial descompensa quem tem disfunção diastólica.' },
            { t: 'Função 2 — filtrar', d: 'Por ter refratariedade longa, o nó AV protege o ventrículo de frequências atriais absurdas. Num flutter atrial a 300 bpm, ele conduz 2:1 e entrega 150 bpm ao ventrículo. É um fusível.' },
            { t: 'Função 3 — reserva', d: 'Se o nó SA falha, a junção AV assume como marca-passo de escape a 40–60 bpm.' },
            { t: 'Irrigação', d: 'Artéria do nó AV: ramo da coronária direita em ~90%. Por isso o bloqueio AV do infarto inferior costuma ser nodal, suprahissiano, com QRS estreito e boa resposta à atropina.' },
          ],
          callouts: [
            {
              kind: 'clinica',
              title: 'Nodal x infranodal',
              text: 'Bloqueio NODAL (acima do His): QRS estreito, escape 40–60 bpm, responde a atropina, melhora com exercício, prognóstico bom. Bloqueio INFRANODAL (His-Purkinje): QRS largo, escape 20–40 bpm, NÃO responde a atropina (pode piorar!), piora com exercício, indica marca-passo.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Feixe de His e seus ramos — os nomes que caem em prova',
          lead: 'O feixe de His é o fascículo atrioventricular. Ele perfura o trígono fibroso direito, corre pela porção membranosa do septo e se divide.',
          bullets: [
            { t: 'Ramo direito', d: 'Fino, longo, com poucas conexões colaterais, corre subendocárdico até a banda moderadora e daí ao músculo papilar anterior do VD. Por ser fino e único, é o mais vulnerável: bloqueio de ramo direito é comum e muitas vezes benigno.' },
            { t: 'Ramo esquerdo', d: 'Curto e largo, abre-se em leque ao atravessar o septo. Divide-se classicamente em dois fascículos — e, na maioria dos corações, em três.' },
            { t: 'Fascículo anterossuperior (esquerdo)', d: 'Fino e longo, corre até o músculo papilar anterolateral. Irrigado só pela descendente anterior. É o mais frágil: o bloqueio divisional anterossuperior (BDAS) é o bloqueio fascicular mais frequente. Desvia o eixo para a ESQUERDA (−45° a −90°).' },
            { t: 'Fascículo posteroinferior (esquerdo)', d: 'Curto, espesso, em leque, até o músculo papilar posteromedial. Tem irrigação dupla (descendente anterior + coronária direita/descendente posterior). Raramente bloqueia; quando bloqueia (BDPI), o dano é extenso. Desvia o eixo para a DIREITA (+90° a +180°).' },
            { t: 'Fascículo septal (médio/anteromedial)', d: 'O terceiro fascículo, presente na maioria dos corações. Despolariza o septo médio. Seu bloqueio produz onda R proeminente em V1–V2 e perda da onda q septal — um diferencial de infarto posterior e de hipertrofia de VD.' },
            { t: 'Rede de Purkinje', d: 'Ramificação subendocárdica final que distribui o impulso a todo o ventrículo quase simultaneamente. É por isso que o QRS normal é estreito (< 120 ms) apesar da enorme massa ventricular.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'Fascículos e eixo — a "seta invertida"',
              text: 'O bloqueio joga o eixo PARA O LADO DO FASCÍCULO BLOQUEADO, porque aquela região despolariza por último. Anterossuperior bloqueado → o vetor vai por último para cima e para a esquerda → eixo desviado à ESQUERDA. Posteroinferior bloqueado → eixo à DIREITA. Bloqueou em cima, eixo pra cima.',
            },
            {
              kind: 'prova',
              title: 'Bi e trifascicular',
              text: 'BIFASCICULAR = BRD + BDAS (o mais comum) ou BRD + BDPI. TRIFASCICULAR (clássico) = bifascicular + BAV de 1º grau. Cuidado: BAV de 1º grau pode ser nodal e não representar o terceiro fascículo — o termo é criticado, mas ainda cai em prova.',
            },
          ],
        },
        {
          kind: 'order',
          question: 'Ordene o trajeto do impulso elétrico normal',
          hint: 'Comece onde o impulso nasce.',
          items: [
            'Nó sinoatrial (Keith-Flack)',
            'Vias internodais e feixe de Bachmann',
            'Nó atrioventricular (Aschoff-Tawara)',
            'Feixe de His (fascículo atrioventricular)',
            'Ramos direito e esquerdo',
            'Fascículos anterossuperior e posteroinferior',
            'Rede de Purkinje',
            'Miocárdio ventricular contrátil',
          ],
          explain: 'O feixe de Bachmann entra logo após o nó SA porque é ele quem leva o impulso ao átrio esquerdo — é a segunda metade da onda P. E note que os fascículos vêm depois dos ramos: fascículo é subdivisão do ramo esquerdo, não sinônimo de ramo.',
        },
        {
          kind: 'match',
          question: 'Relacione a estrutura ao seu nome próprio',
          pairs: [
            { left: 'Nó sinoatrial', right: 'Keith-Flack' },
            { left: 'Nó atrioventricular', right: 'Aschoff-Tawara' },
            { left: 'Via interatrial', right: 'Feixe de Bachmann' },
            { left: 'Fascículo atrioventricular', right: 'Feixe de His' },
            { left: 'Via acessória AV', right: 'Feixe de Kent' },
            { left: 'Trato internodal médio', right: 'Wenckebach' },
          ],
          explain: 'Wenckebach dá nome a duas coisas diferentes: o trato internodal médio e o bloqueio AV de 2º grau Mobitz I. Kent é a via acessória da síndrome de Wolff-Parkinson-White. E "fascículo atrioventricular" é o nome anatômico oficial do feixe de His.',
        },
      ],
    },

    /* ───────────────────────────── 1.3 ───────────────────────────── */
    {
      id: 'frequencias-intrinsecas',
      title: 'Frequências intrínsecas e a hierarquia',
      subtitle: 'O que é automatismo e quem assume quando o chefe cai',
      minutes: 10,
      xp: 35,
      steps: [
        {
          kind: 'teach',
          title: 'O que é frequência intrínseca',
          lead: 'É a frequência com que um tecido dispara SOZINHO, isolado de qualquer comando externo. Não é a frequência que ele conduz — é a que ele gera.',
          body: [
            'Células com automatismo não têm potencial de repouso estável. Após repolarizar, a membrana começa a subir espontaneamente na fase 4 (despolarização diastólica lenta), puxada pela corrente If de sódio e pela corrente de cálcio tipo T. Quando essa subida atinge o limiar, dispara um novo potencial de ação.',
            'A INCLINAÇÃO dessa subida é a frequência intrínseca. Quanto mais íngreme, mais rápido o limiar é atingido, maior a frequência. Do nó SA para baixo, a inclinação vai ficando mais suave — e a frequência, menor.',
            'Vale a hierarquia: quem dispara mais rápido comanda todo o coração, porque despolariza os outros antes que eles cheguem ao próprio limiar. O marca-passo mais rápido sempre vence.',
          ],
          table: {
            head: ['Marca-passo', 'Frequência intrínseca', 'O que ele comanda', 'Como aparece no ECG'],
            rows: [
              ['Nó sinoatrial', '60–100 bpm', 'O coração inteiro, em condições normais', 'P positiva em D2/D3/aVF e negativa em aVR, seguida de QRS estreito'],
              ['Focos atriais ectópicos', '60–80 bpm', 'Átrios e, por condução normal, ventrículos', 'P de morfologia diferente da sinusal; PR pode variar conforme o foco'],
              ['Junção AV (nó AV + His)', '40–60 bpm', 'Ventrículos; átrios só se houver condução retrógrada', 'QRS ESTREITO sem P, ou com P invertida em D2 antes/depois do QRS'],
              ['Sistema His-Purkinje / ventrículo', '20–40 bpm', 'Apenas os ventrículos', 'QRS LARGO (≥120 ms), bizarro, com T em sentido oposto; dissociação AV'],
            ],
            caption: 'Escape juncional e ventricular são mecanismos de SEGURANÇA. Suprimi-los é matar o paciente.',
          },
          callouts: [
            {
              kind: 'macete',
              title: 'A escada 100-60-40-20',
              text: 'Desça a escada de 20 em 20 (mais ou menos): SA 60–100, átrio 60–80, junção 40–60, ventrículo 20–40. Ou o clássico "60, 40, 20": SA sessenta, junção quarenta, ventrículo vinte — o piso de cada andar.',
            },
            {
              kind: 'clinica',
              title: 'A pergunta que resolve a bradicardia',
              text: 'Diante de uma bradicardia, pergunte: o QRS é estreito ou largo? ESTREITO a 40–60 = escape juncional, o problema está acima do His, geralmente reversível e responsivo à atropina. LARGO a 20–40 = escape ventricular, o problema está no His-Purkinje, é instável e pede marca-passo.',
            },
          ],
        },
        {
          kind: 'lab',
          title: 'Derrube um marca-passo e veja quem assume',
          intro: 'Bloqueie cada nível da hierarquia e observe qual estrutura assume o comando, a que frequência e com que morfologia de QRS. É a fisiopatologia dos bloqueios em um clique.',
          widget: { id: 'pacemaker-lab', props: { mode: 'blocks' } },
          outro: 'Repare que o escape nunca aparece instantaneamente: a supressão por overdrive precisa se dissipar, e é essa demora que produz a pausa — e a síncope de Stokes-Adams.',
        },
        {
          kind: 'quiz',
          stem: 'Idosa, 78 anos, síncope. ECG: átrios a 84 bpm com ondas P regulares; ventrículos a 32 bpm com QRS de 150 ms; nenhuma relação entre P e QRS.',
          question: 'Qual estrutura está comandando os ventrículos?',
          options: [
            { text: 'Nó sinoatrial, com condução lentificada' },
            { text: 'Junção atrioventricular' },
            { text: 'Sistema His-Purkinje distal / miocárdio ventricular', correct: true },
            { text: 'Foco atrial ectópico' },
          ],
          explain: 'Dois números entregam: frequência 32 bpm (faixa 20–40) e QRS largo de 150 ms. Escape juncional daria QRS estreito a 40–60 bpm. Ausência de relação P-QRS = dissociação AV = bloqueio AV total. Escape ventricular em BAVT é indicação de marca-passo, não de observação.',
        },
        {
          kind: 'fill',
          question: 'Complete o conceito',
          sentence: 'A supressão por ___ explica por que o escape demora alguns segundos para surgir quando o nó sinusal para de repente.',
          options: ['overdrive', 'refratariedade', 'reentrada', 'vagal'],
          answer: 'overdrive',
          explain: 'Ser estimulada acima da própria frequência sobrecarrega a célula subsidiária de sódio; a bomba Na⁺/K⁺-ATPase acelera, hiperpolariza a membrana e achata a fase 4. Cessado o comando, a célula leva segundos para recuperar a inclinação e disparar. Essa pausa é o substrato da síncope de Stokes-Adams.',
        },
      ],
    },

    /* ───────────────────────────── 1.4 ───────────────────────────── */
    {
      id: 'velocidades-conducao',
      title: 'Velocidades de condução',
      subtitle: 'Por que o nó AV é lento e o Purkinje é um raio',
      minutes: 9,
      xp: 35,
      steps: [
        {
          kind: 'teach',
          title: 'O que é velocidade de condução',
          lead: 'É a rapidez com que a frente de despolarização caminha por um tecido, em metros por segundo. Nada a ver com frequência intrínseca: um tecido pode disparar devagar e conduzir rápido, e vice-versa.',
          body: [
            'A velocidade depende de três coisas: (1) qual íon carrega a fase 0 do potencial de ação, (2) o diâmetro da fibra e (3) a densidade de junções comunicantes (gap junctions, formadas por conexinas) entre as células.',
            'Onde a fase 0 é feita por SÓDIO (canais rápidos, INa), a despolarização é abrupta e a condução é veloz: átrio, His, Purkinje, ventrículo. Onde a fase 0 é feita por CÁLCIO (canais lentos tipo L, ICaL), a subida é lenta e arrastada: nó SA e nó AV. Esses dois nós são chamados de tecidos de resposta lenta justamente por isso.',
            'O Purkinje soma tudo a favor: fibras grossas, riquíssimas em conexina 40, com fase 0 rápida de sódio. Chega a 4 m/s. O nó AV soma tudo contra: células pequenas, poucas junções, conexina 45 (de baixa condutância) e fase 0 de cálcio. Cai para 0,05 m/s — 80 vezes mais devagar.',
          ],
          table: {
            head: ['Estrutura', 'Velocidade', 'Íon da fase 0', 'Consequência funcional'],
            rows: [
              ['Nó sinoatrial', '~0,05 m/s', 'Cálcio (lento)', 'Não importa: o trecho é curtíssimo'],
              ['Musculatura atrial / vias internodais', '~1 m/s', 'Sódio (rápido)', 'Onda P dura menos de 120 ms'],
              ['Nó atrioventricular', '0,02–0,05 m/s', 'Cálcio (lento)', 'Atraso de 90–130 ms = segmento PR isoelétrico'],
              ['Feixe de His', '1–1,5 m/s', 'Sódio (rápido)', 'Transmissão fiel para os ramos'],
              ['Ramos e fascículos', '2–4 m/s', 'Sódio (rápido)', 'Ativação quase simultânea dos dois ventrículos'],
              ['Rede de Purkinje', '2–4 m/s', 'Sódio (rápido)', 'O tecido mais veloz do coração'],
              ['Miocárdio ventricular', '0,3–0,5 m/s', 'Sódio (rápido)', 'Se o estímulo nasce aqui, o QRS alarga'],
            ],
            numericFrom: 1,
          },
          widget: { id: 'velocity-lab' },
          callouts: [
            {
              kind: 'macete',
              title: 'O mais lento e o mais rápido',
              text: 'O MAIS LENTO é o nó AV (0,05 m/s) — e isso é bom, é o pedágio. O MAIS RÁPIDO é o Purkinje (4 m/s) — e isso também é bom, é o que mantém o QRS estreito. Guarde o par 0,05 × 4: uma diferença de 80 vezes dentro do mesmo órgão.',
            },
            {
              kind: 'porque',
              title: 'Por que QRS largo = origem ventricular',
              text: 'Se o impulso nasce no ventrículo, ele não usa a autoestrada do Purkinje: caminha músculo a músculo a 0,3–0,5 m/s. Percorrer a mesma massa a um décimo da velocidade leva 120, 140, 160 ms. Toda vez que o QRS alarga, ou o estímulo nasceu fora do sistema de condução, ou o sistema de condução está quebrado (bloqueio de ramo). Não existe terceira opção.',
            },
            {
              kind: 'atencao',
              title: 'A pegadinha clássica',
              text: 'Frequência intrínseca ≠ velocidade de condução. O nó SA é o marca-passo MAIS RÁPIDO em frequência (60–100 bpm) e um dos MAIS LENTOS em velocidade (0,05 m/s). São grandezas diferentes: uma é bpm, a outra é m/s.',
            },
          ],
        },
        {
          kind: 'quiz',
          question: 'Por que o nó AV conduz tão devagar?',
          options: [
            { text: 'Porque suas células têm potencial de repouso muito negativo' },
            { text: 'Porque a fase 0 depende de canais lentos de cálcio e há poucas junções comunicantes de baixa condutância', correct: true },
            { text: 'Porque é o tecido mais distante do nó sinusal' },
            { text: 'Porque suas fibras têm o maior diâmetro do coração' },
          ],
          explain: 'Tecido de resposta lenta: potencial de repouso menos negativo (−60 mV) inativa os canais de sódio, sobrando o cálcio tipo L para fazer a fase 0. Somado a células pequenas e conexina 45, resulta em 0,05 m/s. É exatamente esse mecanismo que os bloqueadores de canal de cálcio (verapamil, diltiazem) e os betabloqueadores exploram para frear a resposta ventricular na fibrilação atrial.',
        },
        {
          kind: 'match',
          question: 'Relacione cada valor à estrutura',
          pairs: [
            { left: '0,05 m/s', right: 'Nó atrioventricular' },
            { left: '1 m/s', right: 'Musculatura atrial' },
            { left: '4 m/s', right: 'Rede de Purkinje' },
            { left: '0,4 m/s', right: 'Miocárdio ventricular' },
            { left: '20–40 bpm', right: 'Automatismo ventricular' },
            { left: '60–100 bpm', right: 'Automatismo do nó sinusal' },
          ],
          explain: 'Repare que as duas últimas linhas são bpm, não m/s. Toda vez que a prova mistura as unidades, é justamente para testar se você separa automatismo de condução.',
        },
      ],
    },
  ],
}

export const MODULO_CELULA: CourseModule = {
  id: 'celula',
  title: 'A célula',
  tagline: 'Potencial de ação, refratariedade e por que o coração não faz tetania',
  color: 'sky',
  lessons: [
    /* ───────────────────────────── 2.1 ───────────────────────────── */
    {
      id: 'potencial-acao',
      title: 'O potencial de ação cardíaco',
      subtitle: 'As cinco fases e os íons de cada uma',
      minutes: 9,
      xp: 35,
      steps: [
        {
          kind: 'teach',
          title: 'Cinco fases, cinco correntes',
          lead: 'Todo achado do ECG — largura do QRS, nível do ST, altura da T, duração do QT — é a assinatura macroscópica de alguma dessas fases.',
          bullets: [
            { t: 'Fase 4 — repouso', d: 'Potencial estável em −90 mV nas células contráteis, mantido pela corrente retificadora de potássio (IK1) e pela bomba Na⁺/K⁺-ATPase. Nas células automáticas, esta fase não é estável: sobe sozinha (corrente If).' },
            { t: 'Fase 0 — despolarização', d: 'Abertura explosiva dos canais rápidos de sódio (INa). O potencial vai de −90 a +20 mV em 1–2 ms. É o que faz o QRS. Drogas classe I (bloqueadores de sódio) alargam o QRS mexendo exatamente aqui.' },
            { t: 'Fase 1 — repolarização inicial', d: 'Fechamento do sódio e saída transitória de potássio (Ito). Faz o pequeno entalhe que precede o platô — e é a base da onda J e do padrão de Brugada e da repolarização precoce.' },
            { t: 'Fase 2 — platô', d: 'Entrada de cálcio pelos canais tipo L equilibrando a saída de potássio. É a fase que sustenta o segmento ST no ECG e a que dispara a contração (o cálcio que entra libera cálcio do retículo sarcoplasmático).' },
            { t: 'Fase 3 — repolarização rápida', d: 'Cálcio fecha, potássio sai em massa (IKr e IKs). Corresponde à onda T. Drogas classe III (amiodarona, sotalol) bloqueiam IKr, prolongam a fase 3 e alongam o QT.' },
          ],
          widget: { id: 'refractory-lab', props: { focus: 'phases' } },
          callouts: [
            {
              kind: 'macete',
              title: 'A regra do "entra-sai"',
              text: 'Fase 0: entra Na⁺. Fase 2: entra Ca²⁺. Fase 3: sai K⁺. Despolarizar é entrar carga positiva; repolarizar é sair carga positiva. Todo o resto é detalhe.',
            },
            {
              kind: 'porque',
              title: 'A ponte com o ECG',
              text: 'QRS = fase 0 do conjunto dos ventrículos. Segmento ST = fase 2 (todo o ventrículo despolarizado ao mesmo tempo, sem diferença de potencial, por isso o ST é isoelétrico). Onda T = fase 3. Intervalo QT = fases 0 a 3 inteiras, ou seja, a duração da sístole elétrica.',
            },
          ],
        },
        {
          kind: 'fill',
          question: 'Complete a correspondência',
          sentence: 'O segmento ST corresponde à fase ___ do potencial de ação ventricular.',
          options: ['0', '1', '2', '3'],
          answer: '2',
          explain: 'Fase 2 = platô do cálcio = todo o ventrículo despolarizado simultaneamente. Sem gradiente de voltagem entre regiões, não há dipolo, e a linha volta ao isoelétrico. Quando uma região está isquêmica, ela não faz o platô direito — surge um gradiente e o ST desnivela. Supra e infra de ST são, na essência, um defeito na fase 2.',
        },
      ],
    },

    /* ───────────────────────────── 2.2 ───────────────────────────── */
    {
      id: 'refratariedade',
      title: 'Períodos refratários',
      subtitle: 'Absoluto, efetivo, relativo e o período supranormal',
      minutes: 11,
      xp: 40,
      steps: [
        {
          kind: 'teach',
          title: 'Por que a célula precisa de um tempo morto',
          lead: 'Depois de disparar, a célula cardíaca fica temporariamente incapaz de disparar de novo. Não é fadiga: é o estado físico dos canais de sódio.',
          body: [
            'Os canais rápidos de sódio têm três estados: FECHADO (pronto, em repouso), ABERTO (conduzindo, fase 0) e INATIVADO (fechado por uma segunda comporta, e incapaz de reabrir). Depois da fase 0, todos ficam inativados. Eles só voltam ao estado "pronto" quando a membrana repolariza abaixo de cerca de −60 mV.',
            'Enquanto praticamente nenhum canal se recuperou, nenhum estímulo — de qualquer intensidade — gera resposta. Esse é o período refratário absoluto. À medida que a repolarização avança e uma fração dos canais se recupera, estímulos fortes já conseguem gerar uma resposta, mas uma resposta ruim. Esse é o período refratário relativo.',
          ],
          bullets: [
            { t: 'Período refratário ABSOLUTO (PRA)', d: 'Do início da fase 0 até cerca de −50 mV na fase 3. Nenhum estímulo, por mais forte, provoca resposta. Ocupa o QRS e a maior parte do segmento ST.' },
            { t: 'Período refratário EFETIVO (PRE)', d: 'Um pouco mais longo que o absoluto: inclui o trecho em que até existe resposta local, mas ela não se propaga. É o conceito usado em eletrofisiologia — é o PRE que o estudo eletrofisiológico mede.' },
            { t: 'Período refratário RELATIVO (PRR)', d: 'Da saída do PRE até o fim da onda T. Estímulos supralimiares geram potenciais de ação de baixa amplitude, com fase 0 lenta, que conduzem devagar e podem bloquear em um ponto e não em outro. É o terreno perfeito para reentrada.' },
            { t: 'Período SUPRANORMAL', d: 'Um instante logo no fim da onda T, em que a membrana já está quase repolarizada mas ainda mais próxima do limiar que no repouso. Um estímulo SUBlimiar pode capturar. Explica capturas inesperadas e falhas intermitentes de marca-passo.' },
          ],
          widget: { id: 'refractory-lab', props: { focus: 'refractory' } },
          callouts: [
            {
              kind: 'clinica',
              title: 'Fenômeno R sobre T',
              text: 'Uma extrassístole ventricular que cai sobre o pico e o ramo descendente da onda T atinge o período refratário RELATIVO. Ali, partes do miocárdio já conduzem e outras não — dispersão da repolarização. É o gatilho clássico de taquicardia ventricular polimórfica e fibrilação ventricular. É também por isso que a cardioversão elétrica é SINCRONIZADA com o QRS: para o choque não cair na onda T.',
            },
            {
              kind: 'macete',
              title: 'Onde cada período mora no ECG',
              text: 'Desenhe o batimento: do início do QRS até o começo da T = ABSOLUTO. Do começo ao fim da onda T = RELATIVO (a "zona vulnerável" está no pico da T). Depois da T até o próximo QRS = excitável, tudo normal. "QRS e ST são intocáveis; a T é perigosa; o TP é livre."',
            },
          ],
        },
        {
          kind: 'lab',
          title: 'Dispare um estímulo e veja o que acontece',
          intro: 'Clique em qualquer ponto do potencial de ação para aplicar um estímulo. O laboratório mostra se houve resposta, que tipo de resposta e o que isso significaria no traçado.',
          widget: { id: 'refractory-lab', props: { focus: 'stimulate' } },
          outro: 'Compare: um estímulo no PRA não faz nada (é seguro). Um estímulo no PRR faz um potencial deformado, de condução lenta — é o que gera reentrada e mata.',
        },
        {
          kind: 'quiz',
          stem: 'Paciente monitorizado com extrassístoles ventriculares frequentes. Uma delas cai exatamente sobre o ápice da onda T e deflagra taquicardia ventricular polimórfica.',
          question: 'Em que período refratário essa extrassístole incidiu, e por que isso é perigoso?',
          options: [
            { text: 'Absoluto — nenhuma célula responde, e a arritmia foi coincidência' },
            { text: 'Relativo — parte das células responde e parte não, criando dispersão da repolarização e bloqueio unidirecional', correct: true },
            { text: 'Supranormal — todas as células respondem simultaneamente' },
            { text: 'Fase 4 — o miocárdio estava totalmente excitável e a resposta foi normal' },
          ],
          explain: 'No período refratário relativo, os canais de sódio estão parcialmente recuperados e de forma heterogênea. A frente encontra regiões condutoras e regiões bloqueadas: nasce o bloqueio unidirecional, condição obrigatória para a reentrada. Daí a fibrilação ventricular. Por isso se sincroniza a cardioversão e por isso o marca-passo tem período refratário programado.',
        },
        {
          kind: 'order',
          question: 'Ordene do início ao fim do ciclo, em relação ao ECG',
          items: [
            'Período refratário absoluto (QRS e início do ST)',
            'Período refratário efetivo termina (meio da fase 3)',
            'Período refratário relativo (onda T)',
            'Período supranormal (final da onda T)',
            'Excitabilidade plena (segmento TP)',
          ],
          explain: 'A sequência acompanha a repolarização: quanto mais canais de sódio se recuperam, mais fácil disparar. O supranormal é a única janela em que disparar é MAIS fácil que no repouso — porque o potencial de membrana ainda não voltou aos −90 mV, ficando mais perto do limiar.',
        },
      ],
    },

    /* ───────────────────────────── 2.3 ───────────────────────────── */
    {
      id: 'tetania',
      title: 'Por que o coração não faz tetania',
      subtitle: 'Refratariedade longa como mecanismo de sobrevivência',
      minutes: 8,
      xp: 30,
      steps: [
        {
          kind: 'teach',
          title: 'Músculo esquelético: soma e trava',
          lead: 'No músculo esquelético, o potencial de ação dura 1 a 5 ms e a contração (abalo) dura 50 a 100 ms. O período refratário acaba MUITO antes de a contração terminar.',
          body: [
            'Consequência: se um segundo estímulo chega antes de o abalo relaxar, ele gera uma nova contração que se SOMA à anterior. É a somação temporal. Aumentando a frequência, os abalos se fundem — primeiro em tétano incompleto (com ondulações), depois em tétano completo (platô liso e sustentado).',
            'Isso é útil, e é como você segura um copo: nenhuma contração isolada seria forte o bastante, mas a somação de abalos gera força mantida.',
          ],
        },
        {
          kind: 'teach',
          title: 'Músculo cardíaco: impossível somar',
          lead: 'No miocárdio, o potencial de ação dura 200 a 300 ms — praticamente o mesmo tempo da contração. O período refratário cobre quase toda a sístole.',
          body: [
            'Quando o miocárdio finalmente se torna excitável de novo, ele já relaxou. Não há como um segundo estímulo pegar a fibra ainda contraída. Portanto não há somação, não há tétano.',
            'A responsável é a fase 2, o platô de cálcio: ela é uma invenção evolutiva do coração para estender a refratariedade. Um coração que pudesse tetanizar entraria em contração sustentada, não relaxaria, não encheria — e não bombearia nada. Tétano cardíaco é sinônimo de parada.',
            'É a mesma razão pela qual a fibrilação ventricular mata: em FV, cada região se contrai por conta própria, fora de fase, e o ventrículo faz um movimento vermicular sem ejeção. O coração não tetaniza, mas pode fibrilar — e o resultado hemodinâmico é igualmente zero.',
          ],
          widget: { id: 'tetany-lab' },
          callouts: [
            {
              kind: 'macete',
              title: 'A frase que resolve a questão',
              text: '"O coração não tetaniza porque o período refratário dura quase o mesmo tempo que a contração." Se a prova pedir o mecanismo molecular: platô de cálcio (fase 2) prolongando o potencial de ação.',
            },
            {
              kind: 'prova',
              text: 'Pergunta clássica: "por que o aumento da frequência cardíaca não aumenta a força de contração por somação, como no esquelético?" Resposta: refratariedade longa impede somação. O coração aumenta força por outros caminhos — Frank-Starling, inotropismo simpático e o efeito escada de Bowditch (mais frequência → mais cálcio acumulado no retículo).',
            },
          ],
        },
        {
          kind: 'quiz',
          question: 'Qual característica do potencial de ação cardíaco impede a tetania?',
          options: [
            { text: 'A fase 0 rápida mediada por sódio' },
            { text: 'O platô de cálcio da fase 2, que prolonga o período refratário para 200–300 ms', correct: true },
            { text: 'O potencial de repouso de −90 mV' },
            { text: 'A corrente If das células marca-passo' },
          ],
          explain: 'O platô da fase 2 estende o potencial de ação até quase a duração inteira da contração; quando a célula volta a ser excitável, já relaxou. Sem janela para somação, não há tétano — e o ciclo enchimento/ejeção fica garantido a cada batimento.',
        },
      ],
    },
  ],
}
