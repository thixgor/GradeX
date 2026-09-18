import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoIdade,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSexo,
  campoSimNao,
  fmt,
  fmtInt,
  fmtLivre,
  fmtPct,
  num,
  numOu,
  opc,
  sim,
  somaSimNao,
} from '../helpers'

const asa: Ferramenta = {
  id: 'asa',
  nome: 'Classificação ASA de estado físico',
  sinonimos: ['asa', 'estado fisico', 'risco anestesico'],
  resumo: 'Descreve o estado físico pré-anestésico em seis classes, com exemplos por classe.',
  categorias: ['cirurgia'],
  campos: [
    campoOpc('classe', 'Classe ASA', [
      { valor: '1', rotulo: 'ASA I — paciente saudável', pontos: 1, descricao: 'Sem doença orgânica, fisiológica ou psiquiátrica. Não fumante, sem uso ou uso mínimo de álcool.' },
      { valor: '2', rotulo: 'ASA II — doença sistêmica leve', pontos: 2, descricao: 'Sem limitação funcional substantiva. Exemplos: tabagista, etilista social, gestante, IMC de 30 a 40, diabetes ou hipertensão controlados, doença pulmonar leve.' },
      { valor: '3', rotulo: 'ASA III — doença sistêmica grave', pontos: 3, descricao: 'Com limitação funcional. Exemplos: diabetes ou hipertensão mal controlados, DPOC, IMC ≥ 40, hepatite ativa, dependência de álcool, marca-passo, doença renal em diálise regular, infarto ou AVC há mais de 3 meses.' },
      { valor: '4', rotulo: 'ASA IV — doença sistêmica grave com ameaça constante à vida', pontos: 4, descricao: 'Exemplos: infarto, AVC ou isquemia cardíaca há menos de 3 meses, disfunção valvar grave, fração de ejeção muito reduzida, sepse, coagulopatia grave, doença renal terminal sem diálise regular.' },
      { valor: '5', rotulo: 'ASA V — moribundo, sem expectativa de sobrevida sem a cirurgia', pontos: 5, descricao: 'Exemplos: rotura de aneurisma abdominal, trauma maciço, hemorragia intracraniana com efeito de massa, isquemia mesentérica com disfunção múltipla.' },
      { valor: '6', rotulo: 'ASA VI — morte encefálica, doador de órgãos', pontos: 6 },
    ]),
    campoSimNao('emergencia', 'Cirurgia de emergência (sufixo E)', 1, 'Emergência é aquela em que o atraso no tratamento aumenta significativamente a ameaça à vida ou a parte do corpo.'),
  ],
  calcular: (v) => {
    const classe = num(v, 'classe')
    if (classe === null) return null
    const emergencia = sim(v, 'emergencia')
    const mortalidade = ['', '< 0,1%', '0,2%', '1,8%', '7,8%', '9,4%', '—'][classe]
    const nivel: Nivel = classe >= 5 ? 'critico' : classe === 4 ? 'alerta' : classe === 3 ? 'atencao' : 'ok'
    return {
      titulo: `ASA ${['', 'I', 'II', 'III', 'IV', 'V', 'VI'][classe]}${emergencia ? 'E' : ''}`,
      valor: `ASA ${['', 'I', 'II', 'III', 'IV', 'V', 'VI'][classe]}${emergencia ? 'E' : ''}`,
      nivel,
      rotuloNivel: emergencia ? 'Cirurgia de emergência' : 'Cirurgia eletiva ou de urgência',
      detalhes: [
        { rotulo: 'Mortalidade perioperatória associada', valor: mortalidade, nota: 'Valores de séries observacionais; variam muito conforme o porte cirúrgico e a população.' },
        { rotulo: 'Sufixo E', valor: emergencia ? 'Aplicado' : 'Não aplicado', nota: 'A emergência aumenta o risco em qualquer classe — é modificador, não classe própria.' },
      ],
      interpretacao: [
        '**A classificação ASA descreve o paciente, não a cirurgia nem o risco anestésico.** Essa é a confusão mais comum: ASA não é escore de risco, é uma descrição padronizada do estado físico. O risco final resulta da combinação entre estado físico, porte cirúrgico, urgência e fatores da equipe e do serviço.',
        'Sua utilidade real está em três coisas: comunicação padronizada entre profissionais, ajuste de risco em pesquisa e auditoria, e gatilho para avaliação adicional. A concordância entre avaliadores é apenas moderada, sobretudo entre as classes II e III.',
        'A idade isoladamente **não** determina a classe. Um idoso hígido é ASA I ou II; um jovem com diabetes descontrolado é ASA III.',
        'A American Society of Anesthesiologists publicou em 2020 uma lista de exemplos por classe justamente para reduzir a variabilidade — os exemplos aqui apresentados derivam dela.',
        'Por que o **estado físico** prediz desfecho perioperatório tem explicação em reserva funcional. A anestesia e a cirurgia impõem uma agressão fisiológica com três componentes. O primeiro é **farmacológico**: agentes hipnóticos e opioides deprimem a contratilidade miocárdica, reduzem o tônus vasomotor simpático e abolem o drive respiratório; o bloqueio neuroaxial acrescenta simpatectomia química com vasodilatação e queda de pré-carga. O segundo é **mecânico**: a ventilação com pressão positiva inverte o regime de pressão intratorácica, reduzindo o retorno venoso; o pneumoperitônio da laparoscopia comprime a veia cava e eleva a pressão intra-abdominal; a posição cirúrgica redistribui volume. O terceiro é a **resposta neuroendócrina e inflamatória ao trauma**, com liberação de catecolaminas, cortisol e vasopressina, elevação de fibrinogênio, fator VIII e inibidor do ativador de plasminogênio — um estado hipermetabólico, hipercoagulável e pró-inflamatório que persiste por dias. Um paciente com reserva cardíaca, pulmonar, renal e hepática íntegras absorve os três golpes sem consequência. Um paciente ASA III ou IV já opera no limite de um ou mais desses sistemas, e a mesma agressão consome a margem que restava — é aí que surgem isquemia miocárdica, insuficiência renal aguda, descompensação respiratória e delirium. É por isso que a classificação, apesar de descritiva e subjetiva, correlaciona de forma consistente com mortalidade: ela é, na prática, uma medida grosseira de **reserva fisiológica agregada**.',
      ],
      conduta: classe <= 2
        ? [
            `**ASA ${classe === 1 ? 'I' : 'II'}${emergencia ? 'E' : ''}.** Avaliação pré-anestésica de rotina. Exames complementares devem ser guiados pela história e pelo exame físico, **não** pela idade nem por protocolo fixo: exames de rotina em paciente hígido para cirurgia de pequeno porte não reduzem complicações e geram achados incidentais que atrasam procedimentos sem benefício.`,
            'Confirme jejum conforme as diretrizes atuais (6 horas para sólidos, 2 horas para líquidos claros — incluindo bebida carboidratada, que faz parte dos protocolos ERAS e reduz resistência insulínica pós-operatória), revise medicamentos de uso contínuo e oriente quais manter e quais suspender.',
            'Aplique o **escore de Apfel** para definir profilaxia de náusea e vômito, e avalie risco tromboembólico pelo **Caprini** para decidir profilaxia mecânica ou farmacológica.',
            emergencia ? 'O sufixo E eleva o risco em qualquer classe. Otimize o que for possível no tempo disponível — volemia, eletrólitos, glicemia, coagulação — sem atrasar a cirurgia indicada.' : 'Em cirurgia eletiva, aproveite a consulta pré-anestésica para intervenções que melhoram desfecho: cessação do tabagismo (idealmente 4 a 8 semanas antes), controle glicêmico, tratamento de anemia e otimização nutricional.',
          ]
        : classe === 3
          ? [
              `**ASA III${emergencia ? 'E' : ''} — doença sistêmica grave com limitação funcional** (mortalidade associada em torno de 1,8% nas séries observacionais, muito dependente do porte cirúrgico). O foco passa a ser **otimização pré-operatória**, e em cirurgia eletiva vale adiar dias ou semanas para ganhar margem.`,
              'Estratifique o risco cardíaco com o **RCRI** ou o **Gupta MICA**, e avalie capacidade funcional com o **DASI** — capacidade acima de 4 METs, medida objetivamente, dispensa boa parte da investigação cardiológica adicional. Solicite avaliação especializada apenas quando o resultado for mudar a conduta.',
              'Avalie risco pulmonar com o **ARISCAT** e institua as medidas que reduzem complicação respiratória: cessação do tabagismo, fisioterapia respiratória pré-operatória, tratamento de broncoespasmo e rastreio de apneia do sono com STOP-BANG.',
              'Otimize cada sistema comprometido: controle pressórico e glicêmico, compensação de insuficiência cardíaca, tratamento de anemia (ferro intravenoso quando indicado, preferível a transfusão), ajuste de diálise, correção de eletrólitos e revisão de anticoagulantes e antiagregantes com plano definido de suspensão e reintrodução.',
              'Planeje o pós-operatório **antes** da cirurgia: leito de recuperação adequado, analgesia multimodal poupadora de opioide, mobilização precoce, profilaxia tromboembólica e de delirium. Em ASA III, a complicação costuma surgir no pós-operatório, não na sala.',
            ]
          : [
              `**ASA ${['', '', '', '', 'IV', 'V', 'VI'][classe]}${emergencia ? 'E' : ''}.** ${classe === 6 ? 'Morte encefálica, doador de órgãos — a conduta segue o protocolo de manutenção do doador e a logística de captação.' : classe === 5 ? 'Paciente moribundo, sem expectativa de sobrevida sem a cirurgia. A operação é a única chance, e a decisão é de sobrevivência imediata: ressuscitação e cirurgia correm em paralelo.' : 'Doença sistêmica grave com ameaça constante à vida. Mortalidade perioperatória em torno de 7,8% e frequentemente muito maior conforme o porte.'}`,
              classe === 6
                ? 'Mantenha a estabilidade hemodinâmica, a normotermia e a oxigenação do doador conforme protocolo, e siga a legislação e os trâmites da central de transplantes.'
                : '**Reavalie a indicação e as alternativas.** Há procedimento menos invasivo que resolva o problema? Radiologia intervencionista, endoscopia, cirurgia paliativa de menor porte, ou tratamento clínico? Em ASA IV e V, a escolha do procedimento pesa tanto quanto a técnica anestésica.',
              classe === 6
                ? 'Registre e comunique conforme as normas institucionais.'
                : '**Discuta objetivos de cuidado explicitamente** com o paciente, quando possível, e com a família: expectativa realista, disposição quanto a suporte avançado, ventilação prolongada e reanimação. Registre a conversa. Essa discussão faz parte do preparo cirúrgico, não é sua alternativa.',
              classe === 6
                ? 'Equipe dedicada e coordenação com a captação.'
                : 'Planeje leito de terapia intensiva no pós-operatório, monitorização invasiva, reserva de hemocomponentes e equipe experiente. Em cirurgia de emergência, otimize o que for possível no tempo disponível — volemia, perfusão, eletrólitos, glicemia, coagulação — sem transformar a otimização em atraso fatal.',
            ],
      alertas: [
        'ASA **descreve o paciente, não a cirurgia nem o risco anestésico**. É a confusão mais comum. Uma herniorrafia num paciente ASA IV continua sendo ASA IV, e o risco final depende também do porte cirúrgico, da urgência e do serviço.',
        'A idade isoladamente **não** define a classe. Idoso hígido é ASA I ou II; jovem com diabetes descontrolado é ASA III. Gestação normal é ASA II, não ASA I.',
        'A concordância entre avaliadores é apenas moderada, sobretudo entre as classes II e III. Use a lista de exemplos de 2020 e registre a justificativa da classe atribuída.',
        'O sufixo **E** é modificador, não classe própria: eleva o risco dentro de qualquer classe e deve ser registrado sempre que o atraso aumente a ameaça à vida ou a um membro.',
        'ASA não substitui estratificação específica. Para risco cardíaco use RCRI ou Gupta MICA, para pulmonar use ARISCAT, para tromboembolismo use Caprini e para náusea e vômito use Apfel.',
      ],
      tabela: {
        titulo: 'Classes ASA',
        colunas: ['Classe', 'Definição'],
        linhas: [
          ['I', 'Paciente saudável'],
          ['II', 'Doença sistêmica leve, sem limitação funcional'],
          ['III', 'Doença sistêmica grave, com limitação funcional'],
          ['IV', 'Doença sistêmica grave com ameaça constante à vida'],
          ['V', 'Moribundo, sem expectativa de sobrevida sem a cirurgia'],
          ['VI', 'Morte encefálica, doador de órgãos'],
        ],
        destaque: classe - 1,
      },
    }
  },
  formula: ['Classes I a VI, com sufixo E para emergência'],
  fundamento:
    'A classificação nasceu em 1941 com o propósito de permitir comparação estatística entre serviços, e não de prever risco individual. Sua sobrevivência por mais de oito décadas se deve à simplicidade e à correlação consistente, ainda que grosseira, com desfechos — apesar da subjetividade reconhecida. O que ela captura, no fundo, é **reserva fisiológica agregada**. A anestesia e a cirurgia impõem três agressões simultâneas: farmacológica (hipnóticos e opioides deprimem contratilidade, tônus vasomotor e drive respiratório; o bloqueio neuroaxial acrescenta simpatectomia química), mecânica (a ventilação com pressão positiva inverte o regime de pressão intratorácica e reduz o retorno venoso; o pneumoperitônio comprime a cava) e neuroendócrina (catecolaminas, cortisol e vasopressina, com elevação de fibrinogênio, fator VIII e inibidor do ativador de plasminogênio, produzindo estado hipermetabólico, hipercoagulável e pró-inflamatório que dura dias). Quem tem reserva absorve os três; quem já opera no limite de um sistema consome a margem restante, e é aí que aparecem isquemia miocárdica, lesão renal aguda, descompensação respiratória e delirium. Vale insistir no que a classificação **não** é: ela não considera o porte da cirurgia, a duração, a perda sanguínea prevista, a experiência da equipe nem a estrutura do serviço — todos determinantes reais de desfecho. O risco perioperatório é o produto de estado físico, agressão cirúrgica e contexto, e o ASA descreve apenas o primeiro fator. Sua concordância entre avaliadores é apenas moderada, particularmente na fronteira entre II e III, que é justamente onde mais decisões se apoiam; foi para reduzir essa variabilidade que a sociedade americana publicou, em 2020, a lista de exemplos por classe. Na prática moderna, o ASA funciona melhor como **linguagem comum e gatilho de avaliação adicional** do que como estimador de risco: um ASA III deve disparar estratificação específica com RCRI ou Gupta MICA para o coração, ARISCAT para o pulmão, Caprini para trombose e DASI para capacidade funcional.',
  armadilhas: [
    'Não classifique pelo porte da cirurgia. Uma herniorrafia num ASA IV continua sendo ASA IV.',
    'Gestação normal é ASA II, e não ASA I.',
    'A idade isoladamente não determina a classe: idoso hígido é ASA I ou II, jovem com diabetes descontrolado é ASA III.',
    'A concordância entre avaliadores é moderada, sobretudo entre II e III — exatamente a fronteira em que mais decisões se apoiam. Registre a justificativa da classe.',
    'O sufixo E é modificador de urgência, não classe própria. Omiti-lo subestima o risco registrado e prejudica a comparação em auditoria.',
    'ASA não é escore de risco e não substitui RCRI, Gupta MICA, ARISCAT, Caprini nem DASI. Usá-lo isoladamente para decidir investigação pré-operatória é aplicação indevida.',
    'Exames pré-operatórios de rotina guiados pela classe ASA, e não pela história e pelo exame físico, não reduzem complicações e geram achados incidentais que atrasam cirurgias sem benefício.',
  ],
  referencias: [
    { texto: 'American Society of Anesthesiologists. ASA Physical Status Classification System. Última revisão em 2020.' },
    { texto: 'Mayhew D, Mendonca V, Murthy BVS. A review of ASA physical status — historical perspectives and modern developments. Anaesthesia. 2019;74(3):373-379.' },
    { texto: 'Halvorsen S, Mehilli J, Cassese S, et al. 2022 ESC Guidelines on cardiovascular assessment and management of patients undergoing non-cardiac surgery. Eur Heart J. 2022;43(39):3826-3924.' },
  ],
}

const rcri: Ferramenta = {
  id: 'rcri',
  nome: 'Índice de risco cardíaco revisado (RCRI de Lee)',
  sigla: 'RCRI',
  sinonimos: ['rcri', 'lee', 'risco cardiaco cirurgia', 'avaliacao pre-operatoria'],
  resumo: 'Estima risco de evento cardíaco maior em cirurgia não cardíaca.',
  categorias: ['cirurgia', 'cardiologia'],
  campos: [
    campoSimNao('cirurgiaAlto', 'Cirurgia de alto risco', 1, 'Intraperitoneal, intratorácica ou vascular suprainguinal.'),
    campoSimNao('coronariana', 'Doença coronariana', 1, 'Infarto prévio, teste de esforço positivo, angina, uso de nitrato, ou onda Q no eletrocardiograma.'),
    campoSimNao('insuficienciaCardiaca', 'Insuficiência cardíaca', 1, 'História de edema agudo, dispneia paroxística noturna, estertores, B3 ou congestão em radiografia.'),
    campoSimNao('cerebrovascular', 'Doença cerebrovascular', 1, 'AVC ou ataque isquêmico transitório prévio.'),
    campoSimNao('insulina', 'Diabetes em uso de insulina', 1),
    campoSimNao('creatinina', 'Creatinina pré-operatória > 2,0 mg/dL', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'cirurgiaAlto', pontos: 1 },
      { id: 'coronariana', pontos: 1 },
      { id: 'insuficienciaCardiaca', pontos: 1 },
      { id: 'cerebrovascular', pontos: 1 },
      { id: 'insulina', pontos: 1 },
      { id: 'creatinina', pontos: 1 },
    ])
    const riscoOriginal = ['0,4%', '0,9%', '6,6%', '11%'][Math.min(total, 3)]
    const riscoValidacao = ['3,9%', '6,0%', '10,1%', '15%'][Math.min(total, 3)]
    const alto = total >= 2
    return {
      titulo: 'RCRI',
      valor: String(total),
      unidade: 'de 6 pontos',
      nivel: total >= 3 ? 'critico' : total === 2 ? 'alerta' : total === 1 ? 'atencao' : 'ok',
      rotuloNivel: alto ? 'Risco elevado' : 'Risco baixo',
      detalhes: [
        { rotulo: 'Risco na coorte original de Lee (1999)', valor: riscoOriginal, nota: 'Desfecho: infarto, edema agudo de pulmão, fibrilação ventricular, parada cardíaca ou bloqueio total.' },
        { rotulo: 'Risco em metanálise de validação', valor: riscoValidacao, nota: 'Estimativas contemporâneas, com definição de infarto por troponina de alta sensibilidade — mais altas que as originais.' },
        { rotulo: 'Limiar de risco elevado', valor: '≥ 2 pontos' },
      ],
      conduta: [
        '**0 a 1 fator (risco < 1%)**: prossiga para a cirurgia sem investigação cardíaca adicional. Testes funcionais nesse grupo não reduzem eventos e geram atrasos e cascatas diagnósticas.',
        '**2 ou mais fatores**, em cirurgia de risco intermediário ou alto: avalie a **capacidade funcional** primeiro (DASI, ou capacidade de subir dois lances de escada, equivalente a ≥ 4 METs). Capacidade preservada permite prosseguir; capacidade reduzida ou desconhecida justifica teste funcional **apenas se o resultado for mudar a conduta** — ou seja, se houver disposição para revascularizar ou para mudar a estratégia cirúrgica.',
        'Use os **biomarcadores** quando disponíveis: BNP ou NT-proBNP pré-operatórios elevados identificam risco aumentado melhor que o RCRI isolado, e indicam vigilância de troponina no 1º, 2º e 3º dias de pós-operatório para detectar **lesão miocárdica após cirurgia não cardíaca (MINS)**, que é majoritariamente assintomática e associada a mortalidade elevada.',
        'Otimize o que é modificável: **mantenha o betabloqueador de quem já usa** (a retirada abrupta aumenta eventos), mas **não inicie betabloqueador nos dias que antecedem a cirurgia** — o ensaio POISE mostrou redução de infarto ao custo de mais acidente vascular cerebral e morte. Mantenha estatina e aspirina conforme a indicação individual, e discuta com o cirurgião o momento seguro para suspender antiagregante em paciente com stent recente.',
        'Lembre que o RCRI **subestima o risco em cirurgia vascular aberta e em cirurgia de emergência**, e que ele não contempla idade, anemia, fragilidade nem capacidade funcional. Em idosos, combine com uma avaliação de **fragilidade** — ela prediz complicação, delirium, institucionalização e mortalidade melhor que qualquer índice cardíaco.',
      ],
      interpretacao: [
        alto
          ? '**Risco elevado (≥ 2 pontos).** Combine com a capacidade funcional: se ela for boa (DASI acima de 34 pontos ou capacidade acima de 4 METs), a investigação adicional raramente muda conduta. Se for ruim ou desconhecida, considere dosar peptídeo natriurético (BNP ou NT-proBNP) — que é a estratégia recomendada pela diretriz canadense e melhora a discriminação.'
          : 'Risco baixo. Investigação cardiovascular adicional não está indicada; prossiga para a cirurgia com os cuidados habituais.',
        '**Testes não invasivos só se justificam quando o resultado mudar a conduta.** Revascularização coronariana profilática antes de cirurgia não cardíaca **não** reduz eventos — o ensaio CARP demonstrou isso claramente. Investigar por investigar apenas adia a cirurgia e adiciona risco.',
        '**Betabloqueador não deve ser iniciado nos dias que antecedem a cirurgia.** O ensaio POISE mostrou redução de infarto ao custo de aumento de AVC e de mortalidade total com metoprolol iniciado no perioperatório. Quem já usa betabloqueador cronicamente deve **manter**.',
        '**Estatina deve ser mantida** em quem já usa, e considerada em cirurgia vascular. **Inibidores da ECA e bloqueadores do receptor de angiotensina** habitualmente são suspensos 24 horas antes pelo risco de hipotensão intraoperatória — decisão individualizada.',
        'O RCRI não vê fragilidade, anemia, doença pulmonar nem estado funcional. Ferramentas complementares — DASI, NSQIP, avaliação de fragilidade — cobrem o que ele ignora.',
      ],
    }
  },
  formula: ['1 ponto para cada um dos 6 preditores'],
  fundamento:
    'Lee e colaboradores derivaram o índice em 1999 a partir de mais de 4 mil cirurgias não cardíacas eletivas, simplificando o índice de Goldman de 1977. As seis variáveis representam quatro eixos: o estresse imposto pela cirurgia (porte), a doença coronariana estabelecida, a reserva miocárdica (insuficiência cardíaca) e os marcadores de doença aterosclerótica difusa (cerebrovascular, diabetes insulinodependente, disfunção renal).',
  armadilhas: [
    'Não se aplica a cirurgia cardíaca nem a procedimentos de emergência, população em que foi validado precariamente.',
    'A definição de "cirurgia de alto risco" é específica: intraperitoneal, intratorácica ou vascular suprainguinal. Cirurgia vascular infrainguinal e cirurgias de pequeno porte não contam.',
  ],
  referencias: [
    { texto: 'Lee TH, Marcantonio ER, Mangione CM, et al. Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. Circulation. 1999;100(10):1043-1049.' },
    { texto: 'Duceppe E, Parlow J, MacDonald P, et al. Canadian Cardiovascular Society guidelines on perioperative cardiac risk assessment and management for patients who undergo noncardiac surgery. Can J Cardiol. 2017;33(1):17-32.' },
  ],
}

const gupta: Ferramenta = {
  id: 'gupta-mica',
  nome: 'Gupta MICA — risco de infarto ou parada cardíaca perioperatória',
  sinonimos: ['gupta', 'mica', 'nsqip', 'risco cardiaco perioperatorio'],
  resumo: 'Modelo do NSQIP para infarto ou parada cardíaca em 30 dias após cirurgia não cardíaca.',
  categorias: ['cirurgia', 'cardiologia'],
  campos: [
    campoIdade({ min: 18 }),
    campoOpc('asa', 'Classe ASA', [
      { valor: '-5.17', rotulo: 'ASA I — paciente saudável', pontos: 0 },
      { valor: '-3.29', rotulo: 'ASA II — doença sistêmica leve', pontos: 0 },
      { valor: '-1.92', rotulo: 'ASA III — doença sistêmica grave', pontos: 0 },
      { valor: '-0.95', rotulo: 'ASA IV — ameaça constante à vida', pontos: 0 },
      { valor: '0', rotulo: 'ASA V — moribundo', pontos: 0 },
    ]),
    campoOpc('funcional', 'Estado funcional', [
      { valor: '0', rotulo: 'Independente', pontos: 0 },
      { valor: '0.65', rotulo: 'Parcialmente dependente', pontos: 0 },
      { valor: '1.03', rotulo: 'Totalmente dependente', pontos: 0 },
    ]),
    campoSeg('creatinina', 'Creatinina > 1,5 mg/dL', [
      { valor: '0', rotulo: 'Não' },
      { valor: '0.61', rotulo: 'Sim' },
    ]),
    campoOpc('procedimento', 'Categoria do procedimento', [
      { valor: '-1.1', rotulo: 'Mama, endócrina, superficial ou pequeno porte', pontos: 0 },
      { valor: '0', rotulo: 'Ortopédica, urológica, ginecológica, cabeça e pescoço', pontos: 0 },
      { valor: '0.7', rotulo: 'Abdominal, torácica não cardíaca, hepatobiliar', pontos: 0 },
      { valor: '1.6', rotulo: 'Vascular arterial (aorta, revascularização periférica)', pontos: 0 },
    ], { ajuda: 'O modelo original usa 21 categorias com coeficientes próprios. Estas quatro faixas são uma condensação por nível de risco.' }),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    const asaCoef = num(v, 'asa')
    const funcional = num(v, 'funcional')
    const creat = num(v, 'creatinina')
    const proc = num(v, 'procedimento')
    if (idade === null || asaCoef === null || funcional === null || creat === null || proc === null) return null
    const x = -5.25 + 0.02 * idade + asaCoef + funcional + creat + proc
    const risco = (Math.exp(x) / (1 + Math.exp(x))) * 100
    const nivel: Nivel = risco >= 5 ? 'critico' : risco >= 1 ? 'alerta' : risco >= 0.5 ? 'atencao' : 'ok'
    return {
      titulo: 'Risco de infarto ou parada cardíaca em 30 dias',
      valor: fmtPct(risco, 2),
      nivel,
      rotuloNivel: risco >= 1 ? 'Risco elevado' : 'Risco baixo',
      detalhes: [
        { rotulo: 'Contribuição da idade', valor: fmt(0.02 * idade, 2), nota: 'Cada ano adiciona 0,02 ao logito.' },
        { rotulo: 'Contribuição da classe ASA', valor: fmt(asaCoef, 2), nota: 'É a variável de maior peso do modelo.' },
        { rotulo: 'Contribuição do estado funcional', valor: fmt(funcional, 2) },
        { rotulo: 'Contribuição da creatinina', valor: fmt(creat, 2) },
        { rotulo: 'Contribuição do procedimento', valor: fmt(proc, 2) },
        { rotulo: 'Limiar de investigação adicional', valor: '≥ 1%', nota: 'As diretrizes americana e europeia usam 1% de risco estimado como limiar acima do qual a avaliação cardiovascular adicional pode ser considerada.' },
      ],
      conduta: [
        '**Risco < 1%**: nenhuma investigação cardíaca adicional. O resultado apoia a decisão de prosseguir e é útil para documentar o consentimento informado com número, e não com impressão.',
        '**Risco ≥ 1%**: é o limiar em que as diretrizes consideram o paciente de risco elevado. Avalie capacidade funcional e, se reduzida, discuta a utilidade de teste não invasivo — sempre com a pergunta prévia de se o resultado mudaria a conduta cirúrgica ou anestésica.',
        'Prefira o Gupta MICA ao RCRI quando quiser uma **estimativa percentual contínua**: por ser derivado de uma base de mais de 200 mil pacientes do programa NSQIP, ele discrimina melhor e considera o tipo específico de procedimento, dependência funcional, idade e creatinina.',
        'Use o número para **planejar o cuidado perioperatório**, não apenas para classificar: risco alto justifica leito monitorado no pós-operatório, vigilância de troponina seriada, controle rigoroso de anemia e de volemia, e discussão prévia sobre a possibilidade de adiar cirurgia eletiva até otimização.',
        'Considere sempre a alternativa de **não operar ou de operar menos**: em paciente de risco muito alto, a comparação relevante não é entre teste funcional e nenhum teste, e sim entre a cirurgia proposta, uma abordagem menos invasiva e o tratamento conservador. Essa conversa pertence ao pré-operatório e frequentemente não acontece.',
      ],
      interpretacao: [
        'O Gupta MICA foi derivado do banco NSQIP com mais de 200 mil cirurgias e superou o RCRI em discriminação (área sob a curva de 0,88 contra 0,75) — sobretudo por incluir estado funcional e uma granularidade muito maior de tipos de procedimento.',
        'Risco estimado **abaixo de 1%** dispensa investigação cardiovascular adicional na maioria das diretrizes; **acima de 1%**, a próxima pergunta é sobre capacidade funcional, e só depois sobre exames.',
        '**O estado funcional é uma das variáveis mais fortes e mais fáceis de obter.** Perguntar se a pessoa cuida de si, sobe um lance de escadas ou caminha dois quarteirões vale mais do que muitos exames.',
        '⚠ Esta implementação condensa as 21 categorias de procedimento do modelo original em quatro faixas de risco. O resultado é aproximado; para decisão formal, use a calculadora oficial do NSQIP, que também estima outras complicações.',
      ],
      alertas: ['Modelos de risco são derivados de populações específicas. Um paciente com fragilidade importante, anemia significativa ou doença pulmonar grave tem risco maior do que qualquer um desses modelos captura.'],
    }
  },
  formula: [
    'x = −5,25 + 0,02 × idade + coeficiente ASA + coeficiente funcional + 0,61 (se creatinina > 1,5) + coeficiente do procedimento',
    'Risco = e^x / (1 + e^x)',
  ],
  fundamento:
    'O modelo é uma regressão logística construída sobre o National Surgical Quality Improvement Program americano, um registro prospectivo com auditoria de qualidade dos dados. Sua superioridade sobre o RCRI vem de duas escolhas: usar variáveis contínuas (idade) em vez de dicotomizadas, e granular o tipo de procedimento em vez de agrupá-lo em "alto risco / não alto risco".',
  armadilhas: [
    'O desfecho é apenas infarto e parada cardíaca. Não estima AVC, complicação renal, pulmonar nem mortalidade global.',
    'A definição de infarto perioperatório mudou com a troponina de alta sensibilidade, e modelos antigos subestimam a incidência atual.',
  ],
  referencias: [
    { texto: 'Gupta PK, Gupta H, Sundaram A, et al. Development and validation of a risk calculator for prediction of cardiac risk after surgery. Circulation. 2011;124(4):381-387.' },
  ],
}

const alvarado: Ferramenta = {
  id: 'alvarado',
  nome: 'Escore de Alvarado',
  sinonimos: ['alvarado', 'apendicite', 'mantrels', 'dor em fossa iliaca direita'],
  resumo: 'Probabilidade de apendicite aguda por oito achados clínicos e laboratoriais.',
  categorias: ['cirurgia', 'emergencia'],
  campos: [
    campoSimNao('migracao', 'Migração da dor para a fossa ilíaca direita', 1),
    campoSimNao('anorexia', 'Anorexia', 1),
    campoSimNao('nausea', 'Náusea ou vômito', 1),
    campoSimNao('dorFid', 'Dor à palpação em fossa ilíaca direita', 2),
    campoSimNao('descompressao', 'Dor à descompressão brusca', 1),
    campoSimNao('febre', 'Temperatura ≥ 37,3 °C', 1),
    campoSimNao('leucocitose', 'Leucócitos ≥ 10.000/mm³', 2),
    campoSimNao('desvio', 'Desvio à esquerda (neutrófilos ≥ 75%)', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'migracao', pontos: 1 },
      { id: 'anorexia', pontos: 1 },
      { id: 'nausea', pontos: 1 },
      { id: 'dorFid', pontos: 2 },
      { id: 'descompressao', pontos: 1 },
      { id: 'febre', pontos: 1 },
      { id: 'leucocitose', pontos: 2 },
      { id: 'desvio', pontos: 1 },
    ])
    const faixa = total <= 4 ? 0 : total <= 6 ? 1 : total <= 8 ? 2 : 3
    const rotulos = ['Apendicite improvável', 'Apendicite possível', 'Apendicite provável', 'Apendicite muito provável']
    const nivel: Nivel = (['ok', 'atencao', 'alerta', 'critico'] as Nivel[])[faixa]
    return {
      titulo: 'Escore de Alvarado',
      valor: String(total),
      unidade: 'de 10 pontos',
      nivel,
      rotuloNivel: rotulos[faixa],
      detalhes: [
        { rotulo: 'Mnemônica MANTRELS', valor: 'M igração · A norexia · N áusea · T enderness (dor à palpação) · R ebound · E levação de temperatura · L eucocitose · S hift (desvio)' },
        { rotulo: 'Conduta sugerida', valor: ['Alta com orientação e retorno', 'Observação e reavaliação seriada, ou imagem', 'Imagem e avaliação cirúrgica', 'Avaliação cirúrgica'][faixa] },
      ],
      conduta: [
        '**Escore 0–3 (baixo risco)**: apendicite é improvável. Considere alta com reavaliação em 12–24 h e orientação clara de sinais de retorno, ou observação seriada — a reavaliação pelo mesmo examinador tem alto valor diagnóstico e evita imagem desnecessária.',
        '**Escore 4–6 (intermediário)**: solicite imagem. **Ultrassonografia** primeiro em crianças, jovens e gestantes (sem radiação); **tomografia** em adultos quando a ultrassonografia for inconclusiva, que é o cenário mais frequente em pacientes com maior biotipo. Ressonância é a alternativa na gestante com ultrassonografia inconclusiva.',
        '**Escore 7–10 (alto risco)**: apendicite provável. Em homens jovens com quadro típico, alguns serviços indicam cirurgia sem imagem; na maioria dos contextos, a tomografia ainda reduz apendicectomias negativas e ajuda a identificar complicação. Acione a cirurgia e inicie antibiótico e analgesia — analgesia não mascara o exame abdominal, e negá-la é prática ultrapassada.',
        'Considere **tratamento antibiótico exclusivo** em apendicite não complicada selecionada (sem apendicolito, sem perfuração, sem abscesso): cerca de 70% evitam a cirurgia em 1 ano, com o restante operando depois. É uma opção legítima a oferecer, especialmente quando o risco cirúrgico é alto — e uma conversa de decisão compartilhada, não uma escolha do serviço.',
        'Saiba onde o escore **falha**: mulheres em idade fértil (grande sobreposição com doença ginecológica — peça beta-hCG sempre), idosos (apresentação atípica, maior taxa de perfuração), crianças pequenas e imunossuprimidos. Nesses grupos, o limiar para imagem deve ser mais baixo, e escores alternativos como o AIR e o AAS têm desempenho superior.',
      ],
      interpretacao: [
        faixa === 0
          ? 'Escore ≤ 4: apendicite improvável. O valor preditivo negativo é bom o suficiente para dispensar imagem na maioria dos casos, com orientação de retorno diante de piora.'
          : faixa === 1
            ? 'Faixa intermediária: é aqui que o escore menos ajuda e a imagem mais rende. **Ultrassonografia** é o primeiro exame em crianças, gestantes e adultos magros; **tomografia** tem acurácia superior em adultos, e a ressonância é a escolha na gestante quando o ultrassom é inconclusivo.'
            : 'Escore alto: probabilidade elevada. Em homens jovens com quadro típico, muitos serviços operam sem imagem; em mulheres em idade fértil, a imagem reduz apendicectomias negativas ao afastar causas ginecológicas.',
        '**O escore tem desempenho pior em mulheres em idade fértil**, porque doença inflamatória pélvica, cisto ovariano roto, torção anexial, endometriose e gestação ectópica imitam o quadro e pontuam alto.',
        'O escore **AIR** (Appendicitis Inflammatory Response) tem desempenho melhor em validações externas, sobretudo por incluir a proteína C reativa e por graduar a defesa abdominal em três níveis.',
        '**Tratamento não operatório com antibiótico** é alternativa razoável na apendicite não complicada e sem apendicolito — o ensaio CODA mostrou não inferioridade em qualidade de vida, com cerca de 30% de apendicectomia no primeiro ano. A presença de apendicolito eleva substancialmente a falha.',
      ],
      tabela: {
        titulo: 'Interpretação',
        colunas: ['Pontos', 'Probabilidade'],
        linhas: [['0 – 4', 'Improvável'], ['5 – 6', 'Possível'], ['7 – 8', 'Provável'], ['9 – 10', 'Muito provável']],
        destaque: faixa,
      },
    }
  },
  formula: ['Soma de 8 itens; dor à palpação em fossa ilíaca direita e leucocitose valem 2 pontos cada'],
  fundamento:
    'Alvarado derivou o escore em 1986 de uma série retrospectiva, atribuindo peso 2 aos dois achados com maior razão de verossimilhança — dor à palpação na fossa ilíaca direita e leucocitose. A estrutura reproduz a história natural da apendicite: obstrução luminal gera dor visceral periumbilical, distensão e anorexia; a inflamação transmural atinge o peritônio parietal e a dor migra e se localiza; a resposta sistêmica gera febre e leucocitose com desvio.',
  armadilhas: [
    'Apendicite retrocecal ou pélvica pode não ter dor típica em fossa ilíaca direita nem defesa — e o escore falha.',
    'Em idosos, a apresentação é frequentemente atípica e a perfuração é mais comum ao diagnóstico.',
    'Antibiótico ou analgésico prévios mascaram o quadro. **Analgesia adequada não atrapalha o diagnóstico** — essa crença foi refutada.',
  ],
  referencias: [
    { texto: 'Alvarado A. A practical score for the early diagnosis of acute appendicitis. Ann Emerg Med. 1986;15(5):557-564.' },
    { texto: 'CODA Collaborative. A randomized trial comparing antibiotics with appendectomy for appendicitis. N Engl J Med. 2020;383(20):1907-1919.' },
  ],
}

const air: Ferramenta = {
  id: 'air-score',
  nome: 'AIR Score para apendicite',
  sinonimos: ['air', 'appendicitis inflammatory response', 'apendicite escore'],
  resumo: 'Escore de resposta inflamatória, superior ao Alvarado em validações externas.',
  categorias: ['cirurgia', 'emergencia'],
  campos: [
    campoSimNao('vomito', 'Vômitos', 1, 'Sintoma precoce, decorrente do estímulo peristáltico reflexo pela distensão da luz apendicular. Vômito ANTES da dor sugere gastroenterite; depois da dor, sugere apendicite.'),
    campoSimNao('dorFid', 'Dor em fossa ilíaca direita', 1, 'Marca o momento em que a serosa inflamada atinge o peritônio parietal, inervado por fibras somáticas. A MIGRAÇÃO da dor periumbilical para a fossa ilíaca direita é o achado de maior valor preditivo da anamnese.'),
    campoOpc('defesa', 'Defesa abdominal', [
      { valor: '0', rotulo: 'Ausente', pontos: 0 },
      { valor: '1', rotulo: 'Leve', pontos: 1 },
      { valor: '2', rotulo: 'Moderada', pontos: 2 },
      { valor: '3', rotulo: 'Intensa', pontos: 3 },
    ]),
    campoSimNao('febre', 'Temperatura ≥ 38,5 °C', 1, 'Corte alto e específico. Febre baixa é comum e não pontua; febre alta precoce deve levantar outras causas, e no idoso pode faltar mesmo em quadro perfurado.'),
    campoOpc('neutrofilos', 'Neutrófilos', [
      { valor: '0', rotulo: 'Menos de 70%', pontos: 0 },
      { valor: '1', rotulo: '70 a 84%', pontos: 1 },
      { valor: '2', rotulo: '85% ou mais', pontos: 2 },
    ]),
    campoOpc('leucocitos', 'Leucócitos', [
      { valor: '0', rotulo: 'Menos de 10.000/mm³', pontos: 0 },
      { valor: '1', rotulo: '10.000 a 14.900/mm³', pontos: 1 },
      { valor: '2', rotulo: '15.000/mm³ ou mais', pontos: 2 },
    ]),
    campoOpc('pcr', 'Proteína C reativa', [
      { valor: '0', rotulo: 'Menos de 10 mg/L', pontos: 0 },
      { valor: '1', rotulo: '10 a 49 mg/L', pontos: 1 },
      { valor: '2', rotulo: '50 mg/L ou mais', pontos: 2 },
    ]),
  ],
  calcular: (v) => {
    const opcoes = ['defesa', 'neutrofilos', 'leucocitos', 'pcr']
    let total = 0
    for (const id of opcoes) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    total += somaSimNao(v, [{ id: 'vomito', pontos: 1 }, { id: 'dorFid', pontos: 1 }, { id: 'febre', pontos: 1 }])
    const faixa = total <= 4 ? 0 : total <= 8 ? 1 : 2
    return {
      titulo: 'AIR Score',
      valor: String(total),
      unidade: 'de 12 pontos',
      nivel: (['ok', 'atencao', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Baixa probabilidade', 'Probabilidade indeterminada', 'Alta probabilidade'][faixa],
      detalhes: [
        { rotulo: 'Conduta sugerida', valor: ['Alta com reavaliação ambulatorial; imagem raramente necessária', 'Observação com reavaliação em 4 a 8 h, ou imagem', 'Avaliação cirúrgica; imagem conforme o serviço e o perfil do paciente'][faixa] },
        { rotulo: 'Valor preditivo negativo com escore ≤ 4', valor: '≈ 97%' },
      ],
      interpretacao: [
        'O AIR foi construído a partir de coorte prospectiva e valoriza os **marcadores de resposta inflamatória** — proteína C reativa, neutrófilos e grau de defesa —, que se correlacionam com a gravidade da apendicite, e não apenas com sua presença. Isso o torna melhor para identificar apendicite complicada.',
        'Em validações externas, o AIR discrimina melhor que o Alvarado, sobretudo em mulheres e em crianças, e reduz o uso de tomografia quando incorporado a um protocolo estruturado.',
        'A **proteína C reativa** merece atenção: ela sobe com 8 a 12 horas de atraso em relação ao início dos sintomas. Valor normal nas primeiras horas **não** exclui apendicite; valor muito alto sugere perfuração ou abscesso.',
        'Na faixa indeterminada, **reavaliação clínica seriada** em 4 a 8 horas resolve boa parte dos casos sem imagem — a apendicite é uma doença evolutiva, e o tempo é um recurso diagnóstico.',
        'A história natural da apendicite explica por que os itens do escore aparecem em **sequência temporal**, e por que aplicá-lo cedo demais subestima. Tudo começa com obstrução da luz apendicular, por hiperplasia linfoide (a causa mais comum em crianças e adolescentes), fecalito, corpo estranho ou tumor. A mucosa continua secretando muco num compartimento fechado, a pressão intraluminal sobe e distende a parede — e a distensão visceral estimula fibras aferentes viscerais que entram na medula em T8 a T10, produzindo dor **referida periumbilical**, mal localizada, que é a queixa inicial clássica. A mesma distensão estimula o peristaltismo reflexo e o centro do vômito, daí a anorexia e os vômitos precoces. Com a pressão crescente, a drenagem venosa e linfática é comprometida, instala-se isquemia da mucosa e a flora luminal invade a parede: começa a inflamação transmural. Quando a serosa inflamada toca o **peritônio parietal**, que é inervado por fibras somáticas segmentares, a dor migra e se localiza na fossa ilíaca direita e surge a defesa — é a migração da dor, o achado de maior valor preditivo da anamnese. A resposta sistêmica vem depois: febre e leucocitose com neutrofilia em 6 a 12 horas, e proteína C reativa mais tarde ainda, com 8 a 12 horas de atraso, porque depende de síntese hepática induzida por IL-6. Se a isquemia progride, a parede necrosa e perfura, tipicamente após 48 a 72 horas, com bloqueio pelo omento (abscesso ou plastrão) ou peritonite difusa.',
        'Essa cronologia tem três consequências práticas. Primeira: **proteína C reativa normal nas primeiras horas não exclui apendicite** — ela simplesmente ainda não teve tempo de subir. Segunda: proteína C reativa muito alta com leucócitos apenas moderadamente elevados sugere quadro já avançado, com perfuração ou abscesso, porque a leucocitose é mais precoce e pode até cair na peritonite estabelecida. Terceira, e a mais útil: num paciente com poucas horas de dor e escore indeterminado, **a reavaliação em 4 a 8 horas vale mais que a tomografia imediata** — se for apendicite, o escore sobe; se não for, os sintomas se definem em outra direção.',
      ],
      conduta: total <= 4
        ? [
            '**Baixa probabilidade.** Alta com orientação e retorno é apropriada na maioria dos casos, desde que a dor seja tolerável, o paciente esteja bem e haja acesso garantido a reavaliação.',
            'Considere os diagnósticos alternativos mais frequentes conforme o perfil: adenite mesentérica e gastroenterite em criança; **causas ginecológicas** em mulher em idade fértil (cisto ovariano roto ou torcido, doença inflamatória pélvica, gravidez ectópica — peça beta-hCG **sempre**); cólica nefrética, infecção urinária, diverticulite (inclusive de ceco, que mimetiza apendicite), doença de Crohn e constipação.',
            'Oriente retorno imediato se a dor **migrar** para a fossa ilíaca direita, piorar, surgir febre, vômitos persistentes ou incapacidade de andar sem dor. A migração da dor é o achado de maior valor preditivo da anamnese, e o paciente precisa saber reconhecê-la.',
            'Evite analgesia que impeça a reavaliação? Não — esse é um mito desfeito há décadas. Analgesia adequada, inclusive com opioide, **não** mascara o diagnóstico nem aumenta o erro, e negá-la é maltrato sem benefício diagnóstico.',
          ]
        : total <= 8
          ? [
              '**Zona indeterminada**, que é onde o escore mais rende justamente por não decidir sozinho. A conduta preferencial é **reavaliação clínica seriada em 4 a 8 horas** com repetição do hemograma e da proteína C reativa — a apendicite é doença evolutiva, e o tempo é recurso diagnóstico que dispensa radiação.',
              'Solicite imagem conforme o perfil do paciente: **ultrassonografia** primeiro em crianças, adolescentes, mulheres jovens e gestantes (sem radiação, e boa para causas ginecológicas), **tomografia** em adultos quando a ultrassonografia for inconclusiva ou o biotipo dificultar, e **ressonância** em gestantes com ultrassonografia inconclusiva.',
              'Peça **beta-hCG** em toda mulher em idade fértil antes de qualquer imagem ou conduta cirúrgica. Gravidez ectópica rota é o diagnóstico que não pode passar.',
              'Mantenha o paciente em observação com jejum, hidratação e analgesia. Não inicie antibiótico antes de definir a conduta, a menos que haja sinais de sepse — antibiótico precoce em quadro indefinido mascara a evolução clínica que se quer observar.',
            ]
          : [
              '**Alta probabilidade.** Acione a equipe cirúrgica. Em quadro clinicamente típico com escore alto, a cirurgia pode ser indicada sem imagem adicional, sobretudo em homens jovens — a tomografia acrescenta pouco e atrasa.',
              'Inicie **antibiótico pré-operatório** com cobertura para gram-negativos e anaeróbios, administrado na indução anestésica. Em apendicite não complicada, a antibioticoterapia se encerra em até 24 horas do pós-operatório; em complicada, prossegue por 4 a 7 dias conforme a evolução.',
              '**Apendicectomia laparoscópica** é a abordagem preferencial: menos infecção de ferida, menos dor, retorno mais rápido. O tratamento **não operatório** com antibiótico é alternativa válida em apendicite não complicada selecionada (sem apendicolito, sem abscesso, sem perfuração), com cerca de 25 a 40% de recorrência em um ano — discuta com o paciente quando aplicável.',
              'Se houver **abscesso ou plastrão** bem formado com sintomas de vários dias, considere a estratégia de drenagem percutânea com antibiótico e apendicectomia de intervalo, em vez de cirurgia imediata num campo inflamado e hostil.',
              'Hidrate, corrija eletrólitos e trate a dor enquanto aguarda. Em sinais de peritonite difusa, sepse ou instabilidade, a cirurgia é urgente e a ressuscitação corre em paralelo, não antes.',
            ],
      alertas: [
        'Desempenho pior em **extremos de idade e em mulheres em idade fértil** — justamente os grupos de maior morbidade. No idoso, a apresentação é frequentemente atípica, a febre pode faltar e a perfuração é mais comum; na criança pequena, o diagnóstico é tardio e a perfuração chega a 80%.',
        'Proteína C reativa normal nas primeiras horas **não exclui** apendicite: ela leva 8 a 12 horas para subir. Um escore baixo colhido cedo demais mede o tempo de doença, não a probabilidade.',
        'Leucocitose que **cai** com piora clínica não é melhora: pode indicar peritonite estabelecida com consumo e sequestro. Leia o hemograma junto da clínica.',
        'Beta-hCG é obrigatório em toda mulher em idade fértil antes de imagem ou cirurgia. Gravidez ectópica rota é a armadilha clássica da fossa ilíaca direita.',
        'Analgesia **não mascara** o diagnóstico de abdome agudo — esse mito já foi desfeito por ensaios randomizados. Negar analgesia não melhora a acurácia e prolonga sofrimento.',
        'Escore alto em paciente idoso deve levantar também **neoplasia de ceco** obstruindo o apêndice, sobretudo se houver anemia, perda de peso ou alteração do hábito intestinal.',
      ],
    }
  },
  formula: ['Soma de 7 itens (0 a 12 pontos)'],
  fundamento:
    'O escore parte da premissa de que a apendicite é definida pela intensidade da resposta inflamatória, e não apenas pela presença de sintomas. Ao graduar a defesa abdominal em quatro níveis e incluir três marcadores laboratoriais com faixas, ele captura o contínuo entre apendicite inicial, flegmonosa e perfurada — o que os escores dicotômicos não fazem.',
  armadilhas: [
    'Como todo escore de apendicite, tem desempenho pior em extremos de idade e em mulheres em idade fértil.',
    'A proteína C reativa sobe com 8 a 12 horas de atraso. Aplicar o escore nas primeiras horas de dor mede o tempo de evolução, não a probabilidade de apendicite.',
    'Leucocitose alta com proteína C reativa baixa sugere quadro precoce; proteína C reativa muito alta com leucócitos apenas moderados sugere quadro avançado, com perfuração ou abscesso. A dissociação entre os dois é informativa.',
    'Escore baixo não dispensa reavaliação em paciente com poucas horas de sintomas — a apendicite é evolutiva, e a decisão correta muitas vezes é observar, não descartar.',
    'Não distingue apendicite de outras causas cirúrgicas de fossa ilíaca direita: diverticulite de ceco, doença de Crohn, torção ovariana e neoplasia obstruindo o apêndice produzem escores semelhantes.',
    'Antibiótico iniciado antes da definição diagnóstica mascara a evolução clínica que a reavaliação seriada pretende observar.',
  ],
  referencias: [
    { texto: 'Andersson M, Andersson RE. The appendicitis inflammatory response score. World J Surg. 2008;32(8):1843-1849.' },
    { texto: 'Di Saverio S, Podda M, De Simone B, et al. Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines. World J Emerg Surg. 2020;15(1):27.' },
  ],
}

const tokyo: Ferramenta = {
  id: 'tokyo-colecistite',
  nome: 'Tokyo Guidelines para colecistite aguda',
  sinonimos: ['tokyo', 'colecistite', 'colecistite aguda', 'tg18'],
  resumo: 'Aplica os critérios diagnósticos e a graduação de gravidade da colecistite aguda.',
  categorias: ['cirurgia', 'gastroenterologia'],
  campos: [
    campoSimNao('murphy', 'Sinal de Murphy, ou massa, dor ou defesa em hipocôndrio direito', 1, 'Critério A — sinais locais de inflamação.'),
    campoSimNao('febre', 'Febre', 1, 'Critério B — sinais sistêmicos.'),
    campoSimNao('pcr', 'Proteína C reativa elevada', 1, 'Critério B.'),
    campoSimNao('leucocitose', 'Leucocitose', 1, 'Critério B.'),
    campoSimNao('imagem', 'Achados de imagem característicos de colecistite aguda', 1, 'Critério C — espessamento parietal > 4 mm, distensão vesicular, cálculo impactado, líquido perivesicular, Murphy ultrassonográfico.'),
    campoSimNao('disfuncaoCardio', 'Disfunção cardiovascular (necessidade de vasopressor)', 1, 'Critério de grau III.'),
    campoSimNao('disfuncaoNeuro', 'Alteração do nível de consciência', 1),
    campoSimNao('disfuncaoResp', 'Disfunção respiratória (PaO₂/FiO₂ < 300)', 1),
    campoSimNao('disfuncaoRenal', 'Disfunção renal (oligúria ou creatinina > 2,0 mg/dL)', 1),
    campoSimNao('disfuncaoHepatica', 'Disfunção hepática (INR > 1,5)', 1),
    campoSimNao('disfuncaoHemato', 'Plaquetas < 100.000/mm³', 1),
    campoSimNao('leucoAlta', 'Leucócitos > 18.000/mm³', 1, 'Critério de grau II.'),
    campoSimNao('massaPalpavel', 'Massa dolorosa palpável em hipocôndrio direito', 1, 'Critério de grau II.'),
    campoSimNao('duracao', 'Duração dos sintomas > 72 horas', 1, 'Critério de grau II.'),
    campoSimNao('inflamacaoLocal', 'Inflamação local acentuada', 1, 'Colecistite gangrenosa, enfisematosa, abscesso peri ou intra-hepático, peritonite biliar.'),
  ],
  calcular: (v) => {
    const a = sim(v, 'murphy')
    const b = ['febre', 'pcr', 'leucocitose'].some((id) => sim(v, id))
    const c = sim(v, 'imagem')
    const suspeita = a && b
    const definida = a && b && c
    const grauIII = ['disfuncaoCardio', 'disfuncaoNeuro', 'disfuncaoResp', 'disfuncaoRenal', 'disfuncaoHepatica', 'disfuncaoHemato'].filter((id) => sim(v, id)).length
    const grauII = ['leucoAlta', 'massaPalpavel', 'duracao', 'inflamacaoLocal'].filter((id) => sim(v, id)).length
    const grau = grauIII > 0 ? 3 : grauII > 0 ? 2 : 1
    const nivel: Nivel = grau === 3 ? 'critico' : grau === 2 ? 'alerta' : 'atencao'
    return {
      titulo: definida ? `Colecistite aguda definida — grau ${['', 'I (leve)', 'II (moderada)', 'III (grave)'][grau]}` : suspeita ? 'Colecistite aguda suspeita' : 'Critérios diagnósticos não preenchidos',
      valor: definida || suspeita ? `Grau ${['', 'I', 'II', 'III'][grau]}` : 'Não preenche',
      nivel: definida || suspeita ? nivel : 'ok',
      rotuloNivel: definida ? 'Diagnóstico definido (A + B + C)' : suspeita ? 'Suspeita (A + B, falta imagem)' : '',
      detalhes: [
        { rotulo: 'Critério A — sinais locais', valor: a ? 'Presente' : 'Ausente', nivel: a ? 'alerta' : 'ok' },
        { rotulo: 'Critério B — sinais sistêmicos', valor: b ? 'Presente' : 'Ausente', nivel: b ? 'alerta' : 'ok' },
        { rotulo: 'Critério C — imagem', valor: c ? 'Presente' : 'Ausente', nivel: c ? 'alerta' : 'ok' },
        { rotulo: 'Critérios de grau III (disfunção orgânica)', valor: `${grauIII} presente(s)`, nivel: grauIII > 0 ? 'critico' : 'ok' },
        { rotulo: 'Critérios de grau II', valor: `${grauII} presente(s)`, nivel: grauII > 0 ? 'alerta' : 'ok' },
      ],
      conduta: [
        '**Grau I (leve)**: colecistectomia laparoscópica **precoce, na mesma internação**, idealmente nas primeiras 72 horas do início dos sintomas. Adiar para \'esfriar o processo\' aumenta conversão, complicação e reinternação — a conduta mudou, e a cirurgia precoce é o padrão atual.',
        '**Grau II (moderado)**: colecistectomia precoce em serviço com experiência laparoscópica; se as condições locais ou do paciente não permitirem, faça drenagem (colecistostomia percutânea ou drenagem transpapilar) e programe a cirurgia de intervalo.',
        '**Grau III (grave, com disfunção orgânica)**: estabilize primeiro — suporte hemodinâmico, antibiótico, correção de disfunções — e opte por **drenagem biliar** como ponte. A colecistectomia precoce nesse grupo só é aceitável em centro de alto volume, com paciente que responde rapidamente ao suporte.',
        'Verifique sempre se há **coledocolitíase ou colangite associada**: bilirrubina elevada, dilatação de via biliar, tríade de Charcot ou pêntade de Reynolds. A colangite aguda exige **drenagem biliar urgente por colangiopancreatografia retrógrada**, e nesse cenário a descompressão tem prioridade sobre a colecistectomia.',
        'Não perca a **colecistite alitiásica**, que ocorre em paciente crítico, em jejum prolongado, em nutrição parenteral, após grande queimadura ou trauma. Ela tem evolução mais rápida para gangrena e perfuração, o diagnóstico é mais difícil, e o tratamento inicial de escolha costuma ser a drenagem percutânea.',
      ],
      interpretacao: [
        '**Diagnóstico:** suspeita com 1 item de A + 1 item de B; definido quando se acrescenta C (imagem). **Gravidade:** grau III (grave) na presença de qualquer disfunção orgânica; grau II (moderada) com leucócitos acima de 18.000, massa palpável, sintomas há mais de 72 horas ou inflamação local acentuada; grau I quando nenhum dos anteriores.',
        '**A colecistectomia laparoscópica precoce — nas primeiras 72 horas, e idealmente na mesma internação — é o tratamento de escolha nos graus I e II** em pacientes com risco cirúrgico aceitável. A antiga prática de "esfriar o processo" e operar em 6 semanas foi abandonada: a cirurgia precoce reduz tempo total de internação e não aumenta complicações (ensaio ACDC).',
        'No **grau III**, estabilize primeiro: suporte de órgãos, antibiótico e drenagem. **Colecistostomia percutânea** é a alternativa clássica para quem não tolera cirurgia; a drenagem transmural guiada por ecoendoscopia vem ganhando espaço. Depois da estabilização, reavalie a colecistectomia.',
        'A **colecistite alitiásica** (sem cálculos) ocorre em pacientes críticos, com jejum prolongado, nutrição parenteral, queimados e pós-operatórios. É mais grave, evolui mais rápido para gangrena e perfuração, e o diagnóstico exige alto índice de suspeição.',
        'Antibioticoterapia deve cobrir enterobactérias e anaeróbios conforme a gravidade e o perfil local de resistência, e ser descalonada com a cultura da bile quando disponível.',
      ],
      alertas: ['Icterícia, colangite (tríade de Charcot: febre, icterícia e dor) ou dilatação de vias biliares mudam o diagnóstico e a conduta — coledocolitíase e colangite exigem drenagem biliar, tipicamente por colangiopancreatografia endoscópica.'],
    }
  },
  formula: ['Diagnóstico: A + B (suspeita) · A + B + C (definido)', 'Grau III: qualquer disfunção orgânica · Grau II: 1 dos 4 critérios · Grau I: nenhum'],
  fundamento:
    'As Tokyo Guidelines foram criadas em 2007 e revisadas em 2013 e 2018 para padronizar diagnóstico e conduta na colecistite e na colangite — áreas em que a variabilidade de prática era enorme. A separação por gravidade é a peça central: ela define quem opera cedo, quem drena e quem precisa de terapia intensiva antes de qualquer intervenção.',
  armadilhas: [
    'Não confunda colecistite com colangite. Colangite tem icterícia e evidência de obstrução biliar, e a prioridade é a drenagem da via biliar.',
    'Ultrassonografia é o exame inicial (sensibilidade em torno de 80 a 90%). A cintilografia hepatobiliar tem a maior sensibilidade, mas raramente é necessária.',
  ],
  referencias: [
    { texto: 'Yokoe M, Hata J, Takada T, et al. Tokyo Guidelines 2018: diagnostic criteria and severity grading of acute cholecystitis. J Hepatobiliary Pancreat Sci. 2018;25(1):41-54.' },
    { texto: 'Gutt CN, Encke J, Köninger J, et al. Acute cholecystitis: early versus delayed cholecystectomy (ACDC). Ann Surg. 2013;258(3):385-393.' },
  ],
}

const possum: Ferramenta = {
  id: 'possum',
  nome: 'POSSUM e P-POSSUM',
  sinonimos: ['possum', 'p-possum', 'morbimortalidade cirurgica', 'risco cirurgico'],
  resumo: 'Estima morbidade e mortalidade cirúrgica a partir do escore fisiológico e do operatório.',
  categorias: ['cirurgia'],
  campos: [
    campoNum('fisiologico', 'Escore fisiológico', { min: 12, max: 88, passo: 1, padrao: '12', ajuda: '12 variáveis (idade, sinais cardíacos e respiratórios, pressão, pulso, Glasgow, hemoglobina, leucócitos, ureia, sódio, potássio, eletrocardiograma), cada uma com 1, 2, 4 ou 8 pontos. Mínimo de 12.' }),
    campoNum('operatorio', 'Escore de gravidade operatória', { min: 6, max: 44, passo: 1, padrao: '6', ajuda: '6 variáveis (porte da cirurgia, número de procedimentos, perda sanguínea, contaminação peritoneal, presença de malignidade, urgência), cada uma com 1, 2, 4 ou 8 pontos. Mínimo de 6.' }),
  ],
  calcular: (v) => {
    const ps = num(v, 'fisiologico')
    const os = num(v, 'operatorio')
    if (ps === null || os === null) return null
    const logitMorb = -5.91 + 0.16 * ps + 0.19 * os
    const morbidade = (Math.exp(logitMorb) / (1 + Math.exp(logitMorb))) * 100
    const logitMort = -7.04 + 0.13 * ps + 0.16 * os
    const mortalidade = (Math.exp(logitMort) / (1 + Math.exp(logitMort))) * 100
    const logitP = -9.065 + 0.1692 * ps + 0.155 * os
    const mortalidadeP = (Math.exp(logitP) / (1 + Math.exp(logitP))) * 100
    const nivel: Nivel = mortalidadeP >= 20 ? 'critico' : mortalidadeP >= 5 ? 'alerta' : mortalidadeP >= 1 ? 'atencao' : 'ok'
    return {
      titulo: 'Mortalidade estimada (P-POSSUM)',
      valor: fmtPct(mortalidadeP, 1),
      nivel,
      rotuloNivel: `Escore fisiológico ${ps} · operatório ${os}`,
      detalhes: [
        { rotulo: 'Morbidade estimada (POSSUM)', valor: fmtPct(morbidade, 1), nota: 'ln(R/(1−R)) = −5,91 + 0,16 × PS + 0,19 × OS' },
        { rotulo: 'Mortalidade estimada (POSSUM)', valor: fmtPct(mortalidade, 1), nota: 'ln(R/(1−R)) = −7,04 + 0,13 × PS + 0,16 × OS. **Superestima em pacientes de baixo risco.**' },
        { rotulo: 'Mortalidade estimada (P-POSSUM)', valor: fmtPct(mortalidadeP, 1), nota: 'ln(R/(1−R)) = −9,065 + 0,1692 × PS + 0,1550 × OS. Recalibrada para corrigir a superestimativa do POSSUM original no baixo risco.' },
      ],
      conduta: [
        'Use o POSSUM para **planejar recursos e informar o consentimento**, não para negar cirurgia. O número transforma \'cirurgia de risco\' numa estimativa quantitativa que o paciente e a família podem compreender, e é a base de uma conversa honesta sobre alternativas.',
        'Prefira o **P-POSSUM** para estimar mortalidade: o POSSUM original a superestima sistematicamente em pacientes de baixo risco, por causa do modelo de regressão logística original. Para cirurgia colorretal, use o **CR-POSSUM**, e para cirurgia vascular o **V-POSSUM**.',
        'Risco estimado **alto** deve disparar providências concretas: leito de terapia intensiva reservado, otimização pré-operatória de anemia (ferro intravenoso em vez de transfusão quando houver tempo), nutrição, controle glicêmico e cessação de tabagismo, e discussão sobre abordagem menos invasiva ou tratamento conservador.',
        'Conheça a limitação estrutural do escore: **12 variáveis fisiológicas e 6 operatórias**, algumas das quais só são conhecidas **durante ou após a operação** (perda sanguínea, contaminação peritoneal, malignidade, urgência). Isso o torna excelente para auditoria e comparação de resultados entre serviços, e limitado para decisão pré-operatória pura.',
        'Complemente com o que o POSSUM não mede: **fragilidade**, capacidade funcional, cognição, suporte social e preferências do paciente. Em idosos, uma avaliação geriátrica ampla antes da cirurgia reduz delirium e tempo de internação — ganho que nenhum ajuste de técnica cirúrgica produz.',
      ],
      interpretacao: [
        'O POSSUM foi criado em 1991 para **auditoria com ajuste de risco**, e não para aconselhar pacientes individualmente. Sua finalidade original é permitir que serviços comparem seus desfechos observados com os esperados, corrigindo pela gravidade da população — a razão entre observado e esperado.',
        'A separação entre escore **fisiológico** e **operatório** é conceitualmente elegante: o primeiro descreve o paciente que chega à sala; o segundo, o que acontece dentro dela. E o segundo só fica completo depois da cirurgia (perda sanguínea, contaminação, achado de malignidade), o que limita seu uso como ferramenta pré-operatória de decisão.',
        'O **P-POSSUM** corrigiu o principal defeito do original: o POSSUM não podia estimar mortalidade abaixo de 1%, o que inflava sistematicamente o risco em pacientes jovens e hígidos. A versão de Portsmouth reajustou os coeficientes.',
        'Existem variantes por especialidade — CR-POSSUM (colorretal), V-POSSUM (vascular), O-POSSUM (esofagogástrica) —, com calibração melhor no respectivo domínio.',
      ],
      alertas: ['O escore operatório depende de dados intraoperatórios. Estimá-los antes da cirurgia introduz imprecisão e deve ser explicitado.'],
    }
  },
  formula: [
    'POSSUM morbidade: ln(R/(1−R)) = −5,91 + 0,16 × PS + 0,19 × OS',
    'POSSUM mortalidade: ln(R/(1−R)) = −7,04 + 0,13 × PS + 0,16 × OS',
    'P-POSSUM mortalidade: ln(R/(1−R)) = −9,065 + 0,1692 × PS + 0,1550 × OS',
  ],
  fundamento:
    'Copeland e colaboradores construíram o POSSUM sobre a intuição de que o desfecho cirúrgico é o produto de duas forças independentes: a reserva fisiológica do paciente e a agressão imposta pelo procedimento. A regressão logística com as duas somas como preditores formaliza essa intuição, e a estrutura sobreviveu a três décadas de uso e a múltiplas recalibrações.',
  armadilhas: [
    'Os escores mínimos são 12 (fisiológico) e 6 (operatório) — nunca zero, porque cada variável começa em 1 ponto.',
    'Aplicar o POSSUM a um paciente individual para decidir operar ou não é uso fora da finalidade original.',
  ],
  referencias: [
    { texto: 'Copeland GP, Jones D, Walters M. POSSUM: a scoring system for surgical audit. Br J Surg. 1991;78(3):355-360.' },
    { texto: 'Prytherch DR, Whiteley MS, Higgins B, et al. POSSUM and Portsmouth POSSUM for predicting mortality. Br J Surg. 1998;85(9):1217-1220.' },
  ],
}

const apfel: Ferramenta = {
  id: 'apfel',
  nome: 'Escore de Apfel para náuseas e vômitos pós-operatórios',
  sinonimos: ['apfel', 'nvpo', 'ponv', 'nausea pos-operatoria', 'vomito'],
  resumo: 'Quatro fatores que preveem náusea e vômito no pós-operatório e definem a profilaxia.',
  categorias: ['cirurgia'],
  campos: [
    campoSimNao('feminino', 'Sexo feminino', 1, 'O preditor isolado mais forte, com risco cerca de três vezes maior. Atribuído à modulação estrogênica da zona de gatilho quimiorreceptora — a diferença surge na puberdade e se atenua após a menopausa.'),
    campoSimNao('naoFumante', 'Não fumante', 1, 'Item invertido: pontua quem NÃO fuma. Fumantes têm menos náusea pós-operatória, provavelmente por indução de CYP450 (que acelera o metabolismo dos anestésicos) e por dessensibilização de vias eméticas por hidrocarbonetos policíclicos. Não é motivo para fumar.'),
    campoSimNao('historia', 'História de náusea e vômito pós-operatório ou de cinetose', 1, 'Vale qualquer um dos dois. Cinetose (enjoo de carro, barco, avião) indica sensibilidade vestibular aumentada, e a via vestibular converge para os mesmos núcleos do tronco que medeiam o vômito.'),
    campoSimNao('opioide', 'Uso previsto de opioide no pós-operatório', 1, 'O único item MODIFICÁVEL do escore. O opioide age em receptores mu na zona de gatilho quimiorreceptora e retarda o esvaziamento gástrico — estratégias poupadoras de opioide reduzem o risco na origem.'),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'feminino', pontos: 1 },
      { id: 'naoFumante', pontos: 1 },
      { id: 'historia', pontos: 1 },
      { id: 'opioide', pontos: 1 },
    ])
    const risco = ['10%', '21%', '39%', '61%', '79%'][total]
    const nivel: Nivel = total >= 3 ? 'alerta' : total === 2 ? 'atencao' : 'ok'
    const antiemeticos = Math.min(total, 4)
    return {
      titulo: 'Escore de Apfel',
      valor: String(total),
      unidade: 'de 4 pontos',
      nivel,
      rotuloNivel: `Risco de náusea e vômito: ${risco}`,
      detalhes: [
        { rotulo: 'Risco estimado em 24 h', valor: risco },
        { rotulo: 'Número de intervenções profiláticas recomendadas', valor: String(antiemeticos), nota: 'Regra prática: uma intervenção para cada fator de risco. Cada intervenção reduz o risco relativo em cerca de 25 a 30%.' },
      ],
      interpretacao: [
        '**As classes de antieméticos devem ser combinadas, não repetidas.** Antagonistas de receptor 5-HT₃ (ondansetrona 4 mg), corticoide (dexametasona 4 a 8 mg, na indução), antagonista de receptor de neurocinina-1 (aprepitanto), antagonista dopaminérgico (droperidol, haloperidol em dose baixa, metoclopramida em dose alta), anti-histamínico (dimenidrinato) e escopolamina transdérmica. Somar dois antagonistas 5-HT₃ não acrescenta nada.',
        '**A anestesia também é profilaxia.** Anestesia venosa total com propofol reduz náusea e vômito de forma comparável a um antiemético; evitar óxido nitroso e anestésicos inalatônios, minimizar opioides com analgesia multimodal e evitar reversão com neostigmina em dose alta reduzem ainda mais.',
        'Se houver náusea apesar da profilaxia, **use uma classe diferente** da usada profilaticamente. Repetir a ondansetrona nas primeiras 6 horas raramente funciona.',
        'A hidratação adequada com cristaloide reduz náusea, sobretudo em cirurgias ambulatoriais — é uma medida barata e frequentemente esquecida.',
        'A razão de a profilaxia ser multimodal está na anatomia do vômito: o centro bulbar recebe **quatro aferências paralelas**, cada uma com neurotransmissor próprio — zona de gatilho quimiorreceptora na área postrema (D₂, 5-HT₃, NK₁), aparelho vestibular (H₁, M₁), trato gastrointestinal (5-HT₃ pelas células enterocromafins e aferências vagais) e córtex (ansiedade, dor, estímulos visuais). Como as vias são redundantes, bloquear uma deixa as outras livres. Daí a eficácia ser aditiva entre **classes diferentes** e não entre doses da mesma classe, e daí a regra de uma intervenção por ponto do escore.',
      ],
      conduta: total === 0
        ? [
            'Risco basal (cerca de 10%). **Profilaxia farmacológica não é obrigatória**, mas use as medidas anestésicas que reduzem o estímulo na origem: hidratação adequada com cristaloide, analgesia multimodal poupadora de opioide e evitar óxido nitroso quando possível.',
            'Tenha antiemético de resgate prescrito e disponível. Ausência de fatores de risco não é ausência de risco.',
          ]
        : [
            `**${total} fator(es) de risco, risco estimado de ${risco} em 24 horas.** Prescreva **${antiemeticos} intervenção(ões) profilática(s) de classes diferentes** — cada uma reduz o risco relativo em cerca de 25 a 30%, e o efeito é aditivo apenas entre classes distintas.`,
            'Combine a partir destas classes: **dexametasona** 4 a 8 mg na indução (age lentamente, por isso vai no início), **ondansetrona** 4 mg ao fim da cirurgia (age rápido, por isso vai no fim), **droperidol** 0,625 a 1,25 mg ou haloperidol em dose baixa, **aprepitanto** (antagonista NK₁, útil quando o vômito é o desfecho a evitar), **escopolamina transdérmica** aplicada antes da indução, e **dimenidrinato**. Nunca repita a mesma classe.',
            '**A técnica anestésica é profilaxia e conta como intervenção.** Anestesia venosa total com propofol reduz náusea de forma comparável a um antiemético; evitar anestésico inalatório e óxido nitroso, minimizar opioide com analgesia multimodal (anti-inflamatório, dipirona, paracetamol, bloqueio regional, dexmedetomidina, lidocaína venosa) e evitar dose alta de neostigmina somam efeito.',
            'Hidrate adequadamente com cristaloide — medida barata, eficaz sobretudo em cirurgia ambulatorial, e sistematicamente esquecida.',
            'Se houver náusea apesar da profilaxia, **troque de classe**. Repetir ondansetrona nas primeiras 6 horas raramente funciona, porque os receptores 5-HT₃ já estão bloqueados. E antes de atribuir tudo à anestesia, descarte complicação: íleo, obstrução, hipotensão, hipoglicemia, dor não controlada, distensão gástrica e hipertensão intracraniana.',
            total >= 3
              ? 'Em risco alto (61 a 79%), considere também alta ambulatorial mais cautelosa: náusea e vômito são causa frequente de readmissão não planejada em cirurgia de day hospital. Oriente o paciente e prescreva antiemético para casa.'
              : 'Verifique o QT antes de empilhar antieméticos: droperidol e haloperidol o prolongam, e a ondansetrona também em menor grau. Em paciente de risco, aplique o escore de Tisdale.',
          ],
      alertas: [
        'O item do tabagismo é **invertido** — pontua quem NÃO fuma. Marcar o fumante como positivo inverte o escore e leva a profilaxia excessiva no paciente errado.',
        'Náusea e vômito persistentes no pós-operatório podem ser **sinal de complicação** (íleo, obstrução, hipotensão, hipoglicemia, hipertensão intracraniana) e não apenas efeito anestésico. Reavalie o paciente antes de repetir antiemético.',
        'Somar duas doses da mesma classe não aumenta a eficácia, apenas os efeitos adversos. A profilaxia é aditiva entre classes diferentes.',
        'Droperidol, haloperidol e, em menor grau, ondansetrona prolongam o intervalo QT. Em paciente com QT longo ou em uso de outros fármacos prolongadores, avalie o risco antes de combinar.',
        'O escore prevê náusea e vômito — não risco cirúrgico, nem risco anestésico global. Para isso existem ASA, RCRI e ARISCAT.',
      ],
      tabela: {
        titulo: 'Risco por número de fatores',
        colunas: ['Fatores', 'Risco em 24 h'],
        linhas: [['0', '10%'], ['1', '21%'], ['2', '39%'], ['3', '61%'], ['4', '79%']],
        destaque: total,
      },
    }
  },
  formula: ['1 ponto para cada: sexo feminino · não fumante · história de NVPO ou cinetose · opioide pós-operatório'],
  fundamento:
    'Apfel simplificou modelos anteriores até chegar aos quatro preditores independentes mais fortes, e demonstrou que o risco cresce de forma quase linear com o número deles. O achado mais contraintuitivo é o do tabagismo: fumantes têm **menos** náusea pós-operatória, provavelmente por indução enzimática de citocromos que metabolizam anestésicos e por dessensibilização de vias eméticas. A anatomia do vômito explica por que a profilaxia precisa ser **multimodal** e por que somar antieméticos da mesma classe não funciona. O ato de vomitar é coordenado pelo centro do vômito, no bulbo, que recebe aferências de quatro vias com neurotransmissores distintos: a **zona de gatilho quimiorreceptora** na área postrema (fora da barreira hematoencefálica, sensível a substâncias circulantes, rica em receptores D₂ de dopamina, 5-HT₃ de serotonina e NK₁ de neurocinina), o **aparelho vestibular** (receptores H₁ de histamina e muscarínicos M₁), o **trato gastrointestinal** (células enterocromafins liberam serotonina que estimula aferências vagais via 5-HT₃) e o **córtex** (ansiedade, dor, estímulos visuais e olfativos). Cada antiemético bloqueia uma via: ondansetrona nos 5-HT₃, dexametasona por mecanismo ainda incerto envolvendo prostaglandinas e ação central, droperidol e haloperidol nos D₂, aprepitanto nos NK₁, escopolamina nos muscarínicos, difenidramina nos H₁. Como as vias são paralelas e redundantes, bloquear uma só deixa as outras livres — e é exatamente por isso que a eficácia é aditiva quando se combinam **classes diferentes**, e não quando se dobra a dose de uma. A regra prática das diretrizes decorre disso: um antiemético de classe distinta para cada ponto do escore, somado a estratégias que reduzem o estímulo na origem (anestesia venosa total com propofol em vez de inalatório, técnica poupadora de opioide, analgesia multimodal, hidratação adequada e evitar óxido nitroso).',
  armadilhas: [
    'O escore prevê náusea e vômito, não risco cirúrgico. Não use para outras decisões.',
    'Náusea persistente no pós-operatório pode ser sinal de complicação — íleo, obstrução, hipotensão, hipoglicemia, hipertensão intracraniana — e não apenas efeito anestésico.',
    'O item do tabagismo é invertido: pontua quem **não** fuma. Marcar o fumante como positivo inverte o sentido do escore.',
    'Somar dois antieméticos da mesma classe (duas doses de ondansetrona, por exemplo) não aumenta a eficácia — só o efeito adverso. A profilaxia é aditiva entre classes diferentes.',
    'Náusea que ocorre apesar de profilaxia adequada não deve ser tratada repetindo o mesmo fármaco nas primeiras 6 horas: troque de classe.',
    'O escore foi derivado em cirurgia sob anestesia geral com inalatório. Em bloqueio regional puro, o risco basal é muito menor e o escore superestima.',
    'Não se aplica a náusea de quimioterapia, de gestação nem de outras causas — as vias predominantes e os fármacos de escolha são diferentes.',
    'Droperidol e haloperidol prolongam o QT; ondansetrona também, em menor grau. Em paciente com QT longo ou em uso de outros fármacos prolongadores, aplique o escore de Tisdale antes de empilhar antieméticos.',
  ],
  referencias: [
    { texto: 'Apfel CC, Läärä E, Koivuranta M, et al. A simplified risk score for predicting postoperative nausea and vomiting. Anesthesiology. 1999;91(3):693-700.' },
    { texto: 'Gan TJ, Belani KG, Bergese S, et al. Fourth consensus guidelines for the management of postoperative nausea and vomiting. Anesth Analg. 2020;131(2):411-448.' },
  ],
}

const jejum: Ferramenta = {
  id: 'jejum-pre-operatorio',
  nome: 'Jejum pré-operatório',
  sinonimos: ['jejum', 'jejum pre-operatorio', 'aspiracao', 'eras', 'carboidrato pre-operatorio'],
  resumo: 'Tempos de jejum por tipo de alimento e as exceções que costumam ser esquecidas.',
  categorias: ['cirurgia', 'nutricao'],
  campos: [
    campoOpc('ingesta', 'Última ingestão', [
      { valor: '2', rotulo: 'Líquidos claros (água, chá, café sem leite, suco sem polpa, bebida com carboidrato)', pontos: 2 },
      { valor: '4', rotulo: 'Leite materno', pontos: 4 },
      { valor: '6', rotulo: 'Fórmula infantil, leite de vaca, refeição leve (torrada, bolacha)', pontos: 6 },
      { valor: '8', rotulo: 'Refeição completa, frituras, carnes, alimentos gordurosos', pontos: 8 },
    ]),
    campoNum('horasDesde', 'Horas desde a última ingestão', { unidade: 'h', min: 0, max: 48, passo: 0.5 }),
    campoSimNao('riscoAspiracao', 'Fator de risco para aspiração', 1, 'Gastroparesia diabética, obstrução intestinal, refluxo grave, gestação a partir do segundo trimestre, obesidade mórbida com refluxo, uso de agonista de GLP-1, trauma recente, dor intensa ou opioide.'),
    campoSeg('cirurgia', 'Caráter da cirurgia', [
      { valor: 'eletiva', rotulo: 'Eletiva' },
      { valor: 'urgencia', rotulo: 'Urgência ou emergência' },
    ]),
  ],
  calcular: (v) => {
    const necessario = num(v, 'ingesta')
    const decorrido = num(v, 'horasDesde')
    if (necessario === null || decorrido === null) return null
    const urgencia = opc(v, 'cirurgia') === 'urgencia'
    const risco = sim(v, 'riscoAspiracao')
    const cumprido = decorrido >= necessario
    const faltam = Math.max(0, necessario - decorrido)
    return {
      titulo: cumprido ? 'Jejum cumprido' : 'Jejum ainda não cumprido',
      valor: cumprido ? `${fmt(decorrido, 1)} h` : `faltam ${fmt(faltam, 1)} h`,
      nivel: urgencia ? 'critico' : cumprido ? 'ok' : 'alerta',
      rotuloNivel: `Exigido: ${necessario} h`,
      detalhes: [
        { rotulo: 'Tempo decorrido', valor: `${fmt(decorrido, 1)} h` },
        { rotulo: 'Tempo exigido', valor: `${necessario} h` },
        { rotulo: 'Fator de risco para aspiração', valor: risco ? 'Presente' : 'Ausente', nota: risco ? 'Considere sequência rápida com pressão cricoide, sonda gástrica prévia, e profilaxia com antagonista H₂ ou inibidor de bomba de prótons e antiácido não particulado.' : undefined, nivel: risco ? 'alerta' : 'ok' },
      ],
      conduta: [
        'Aplique a regra **2–4–6–8**: líquidos claros até **2 horas** antes, leite materno até **4 horas**, fórmula infantil e refeição leve até **6 horas**, refeição gordurosa ou carne até **8 horas**. Esses são os intervalos das diretrizes atuais, e o jejum de \'nada por boca após a meia-noite\' está abandonado.',
        '**Estimule a ingestão de líquido claro até 2 horas antes** — água, chá, café sem leite, suco sem polpa, bebida com carboidrato. O jejum prolongado causa desidratação, hipoglicemia, resistência insulínica, desconforto, irritabilidade (especialmente em crianças) e não reduz aspiração. Bebida com maltodextrina 2 h antes faz parte dos protocolos ERAS e melhora a recuperação.',
        'Prolongue o jejum apenas em situações de **esvaziamento gástrico retardado**: gastroparesia diabética, obstrução, estenose pilórica, refluxo grave, gestação avançada, trauma recente, dor intensa, uso de opioide e **agonistas de GLP-1**, que retardam substancialmente o esvaziamento — nesses últimos, considere suspender o fármaco antes do procedimento eletivo conforme o protocolo local e avaliar o conteúdo gástrico por ultrassonografia.',
        'Em **emergência**, presuma estômago cheio independentemente do tempo de jejum e use **indução em sequência rápida** com pressão cricoide conforme a prática do serviço. O tempo de jejum não é critério para adiar cirurgia de urgência.',
        'Mantenha a **medicação de uso contínuo** com um gole de água: anti-hipertensivos (com a ressalva de suspender IECA e BRA na manhã da cirurgia pelo risco de hipotensão na indução), antiarrítmicos, antiepilépticos, broncodilatadores, corticoide e antirretrovirais. A suspensão indiscriminada de toda a prescrição na véspera causa mais dano do que o jejum.',
      ],
      interpretacao: [
        urgencia
          ? '**Em urgência e emergência, o jejum não é pré-requisito.** Todo paciente é tratado como estômago cheio: sequência rápida de intubação, com material de aspiração pronto e equipe preparada.'
          : cumprido
            ? 'Tempo de jejum adequado para o tipo de alimento informado.'
            : `Faltam ${fmt(faltam, 1)} horas para completar o jejum exigido.`,
        '**Jejum prolongado é prejudicial, não protetor.** As diretrizes atuais recomendam explicitamente **2 horas para líquidos claros**, e estimulam a ingestão de líquido claro até esse limite. Jejum de "meia-noite" para cirurgia da tarde causa desidratação, hipoglicemia, resistência insulínica, desconforto e irritabilidade — sem qualquer redução adicional do risco de aspiração.',
        'Os protocolos **ERAS** vão além e recomendam **bebida com carboidrato (12,5%) até 2 horas antes** da indução em pacientes sem risco de aspiração: reduz a resistência insulínica pós-operatória, o catabolismo proteico e o tempo de internação.',
        '**Agonistas de GLP-1** (semaglutida, liraglutida, tirzepatida) retardam significativamente o esvaziamento gástrico. As sociedades de anestesia recomendam suspender os de administração semanal por 1 semana e os diários por 1 dia antes de procedimento eletivo, ou tratar como estômago cheio — a orientação continua evoluindo.',
        'Medicações orais de uso contínuo devem ser mantidas com um gole de água, salvo indicação específica de suspensão.',
      ],
      tabela: {
        titulo: 'Tempos de jejum recomendados',
        colunas: ['Ingestão', 'Jejum mínimo'],
        linhas: [
          ['Líquidos claros', '2 horas'],
          ['Leite materno', '4 horas'],
          ['Fórmula infantil, leite não humano, refeição leve', '6 horas'],
          ['Refeição completa, frituras, carnes', '8 horas'],
        ],
        destaque: necessario === 2 ? 0 : necessario === 4 ? 1 : necessario === 6 ? 2 : 3,
      },
    }
  },
  formula: ['Líquidos claros 2 h · leite materno 4 h · fórmula ou refeição leve 6 h · refeição completa 8 h'],
  fundamento:
    'A regra do jejum nasceu da síndrome de Mendelson, descrita em 1946 — aspiração de conteúdo gástrico ácido durante anestesia obstétrica. Décadas de estudos depois, ficou claro que o esvaziamento gástrico de líquidos claros é exponencial e praticamente completo em 90 a 120 minutos, e que prolongar o jejum de líquidos **não** reduz o volume nem a acidez residual. A regra de 2 horas é, portanto, fisiologicamente fundamentada, não uma flexibilização de conveniência.',
  armadilhas: [
    'Suco com polpa, leite e bebidas com gordura **não** são líquidos claros. Chá e café **sem leite** são.',
    'A pressão cricoide (manobra de Sellick) permanece controversa: pode dificultar a laringoscopia e a ventilação, e a evidência de eficácia é fraca.',
  ],
  referencias: [
    { texto: 'Practice Guidelines for Preoperative Fasting and the Use of Pharmacologic Agents to Reduce the Risk of Pulmonary Aspiration. Anesthesiology. 2017;126(3):376-393.' },
    { texto: 'Ljungqvist O, Scott M, Fearon KC. Enhanced Recovery After Surgery: a review. JAMA Surg. 2017;152(3):292-298.' },
  ],
}

const volemiaCirurgica: Ferramenta = {
  id: 'volume-sanguineo-perda',
  nome: 'Volume sanguíneo, perda estimada e transfusão maciça',
  sinonimos: ['volemia', 'perda sanguinea', 'transfusao macica', 'abc score', 'perda permitida'],
  resumo: 'Estima volemia, perda permitida antes da transfusão e o gatilho de protocolo maciço.',
  categorias: ['cirurgia', 'emergencia', 'hematologia'],
  campos: [
    campoPeso(),
    campoSeg('faixa', 'Faixa etária e sexo', [
      { valor: '75', rotulo: 'Homem adulto (75 mL/kg)' },
      { valor: '65', rotulo: 'Mulher adulta (65 mL/kg)' },
      { valor: '80', rotulo: 'Criança (80 mL/kg)' },
      { valor: '90', rotulo: 'Lactente e neonato (85 a 90 mL/kg)' },
    ]),
    campoNum('htInicial', 'Hematócrito inicial', { unidade: '%', min: 10, max: 60, passo: 0.5, padrao: '42' }),
    campoNum('htMinimo', 'Hematócrito mínimo aceitável', { unidade: '%', min: 15, max: 40, passo: 0.5, padrao: '21', ajuda: 'Corresponde à hemoglobina de 7 g/dL na maioria dos contextos; 24% (Hb 8) em coronariopatas.' }),
    campoNum('perdaEstimada', 'Perda sanguínea observada', { unidade: 'mL', min: 0, max: 8000, passo: 50, opcional: true }),
    campoSimNao('penetrante', 'Mecanismo penetrante', 1, 'Componente do escore ABC de predição de transfusão maciça.'),
    campoSimNao('pas90', 'PA sistólica ≤ 90 mmHg', 1),
    campoSimNao('fc120', 'Frequência cardíaca ≥ 120 bpm', 1),
    campoSimNao('fast', 'FAST positivo', 1),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const mlkg = Number(opc(v, 'faixa') || '75')
    const htI = num(v, 'htInicial')
    const htM = num(v, 'htMinimo')
    const perda = num(v, 'perdaEstimada')
    if (peso === null || htI === null || htM === null || htI <= 0) return null
    const volemia = peso * mlkg
    const perdaPermitida = (volemia * (htI - htM)) / htI
    const abc = somaSimNao(v, [
      { id: 'penetrante', pontos: 1 },
      { id: 'pas90', pontos: 1 },
      { id: 'fc120', pontos: 1 },
      { id: 'fast', pontos: 1 },
    ])
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Volume sanguíneo estimado', valor: `${fmtInt(volemia)} mL`, nota: `${mlkg} mL/kg × ${fmt(peso, 1)} kg` },
      { rotulo: 'Perda sanguínea permitida', valor: `${fmtInt(perdaPermitida)} mL`, nota: `Volume que pode ser perdido antes de o hematócrito cair de ${fmt(htI, 1)}% para ${fmt(htM, 1)}%, assumindo reposição volêmica com cristaloide.` },
      { rotulo: 'Perda de 15% da volemia (classe I)', valor: `${fmtInt(volemia * 0.15)} mL`, nota: 'Sinais mínimos; frequência cardíaca normal ou discretamente elevada.' },
      { rotulo: 'Perda de 30% da volemia (classe II)', valor: `${fmtInt(volemia * 0.3)} mL`, nota: 'Taquicardia, redução da pressão de pulso, ansiedade. **A pressão sistólica ainda está normal.**' },
      { rotulo: 'Perda de 40% da volemia (classe III)', valor: `${fmtInt(volemia * 0.4)} mL`, nota: 'Hipotensão, taquicardia importante, confusão, oligúria. É aqui que a pressão finalmente cai.' },
      { rotulo: 'Perda acima de 40% (classe IV)', valor: `> ${fmtInt(volemia * 0.4)} mL`, nota: 'Ameaça imediata à vida.', nivel: 'critico' },
      { rotulo: 'Escore ABC (predição de transfusão maciça)', valor: `${abc} de 4`, nota: '≥ 2 pontos prediz necessidade de transfusão maciça e é gatilho para acionar o protocolo.', nivel: abc >= 2 ? 'critico' : 'ok' },
    ]
    if (perda !== null) {
      const pct = (perda / volemia) * 100
      detalhes.unshift({ rotulo: 'Perda observada', valor: `${fmtInt(perda)} mL (${fmt(pct, 1)}% da volemia)`, nota: pct >= 40 ? 'Classe IV' : pct >= 30 ? 'Classe III' : pct >= 15 ? 'Classe II' : 'Classe I', nivel: pct >= 30 ? 'critico' : pct >= 15 ? 'alerta' : 'ok' })
    }
    const nivel: Nivel = abc >= 2 ? 'critico' : perda !== null && perda > perdaPermitida ? 'alerta' : 'neutro'
    return {
      titulo: 'Volume sanguíneo estimado',
      valor: fmtInt(volemia),
      unidade: 'mL',
      nivel,
      rotuloNivel: abc >= 2 ? 'ABC ≥ 2 — acionar protocolo de transfusão maciça' : '',
      detalhes,
      conduta: [
        'Reconheça o **choque hemorrágico pela classe**, lembrando que a pressão arterial cai tarde: na classe I (até 15% de perda) tudo está normal; na classe II (15–30%) há taquicardia e redução da pressão de pulso; na classe III (30–40%) aparece hipotensão e confusão; na classe IV (> 40%) há colapso. Frequência cardíaca, pressão de pulso, enchimento capilar e nível de consciência mudam antes da sistólica.',
        'Ative o **protocolo de transfusão maciça** diante de perda estimada acima de 30–40%, escore ABC ≥ 2, ou necessidade prevista de mais de 4 concentrados em 1 hora. Transfunda em proporção **1:1:1** de hemácias, plasma e plaquetas — a reposição apenas com hemácias e cristaloide produz coagulopatia dilucional e piora o sangramento.',
        'Pratique a **reanimação de controle de danos**: hipotensão permissiva (sistólica de 80–90 mmHg, ou palpação de pulso radial) até o controle cirúrgico do sangramento, **exceto** em trauma cranioencefálico, em que a perfusão cerebral exige pressão mais alta. Minimize cristaloide, que dilui fatores e agrava a acidose.',
        'Combata a **tríade letal — hipotermia, acidose e coagulopatia**, que se retroalimentam: aqueça o paciente e os fluidos ativamente, corrija a perfusão e reponha fatores. **Ácido tranexâmico 1 g em 10 minutos, seguido de 1 g em 8 horas, dentro das primeiras 3 horas** do trauma reduz mortalidade; depois de 3 horas ele passa a ser prejudicial.',
        'Reponha **cálcio** durante a transfusão maciça: o citrato dos hemocomponentes quela o cálcio ionizado, e a hipocalcemia agrava a coagulopatia e a disfunção miocárdica. Monitore cálcio ionizado, fibrinogênio (alvo > 1,5–2,0 g/L) e, quando disponível, use **tromboelastografia ou tromboelastometria** para guiar a reposição em vez de proporções fixas.',
      ],
      interpretacao: [
        '**A classificação de choque hemorrágico do ATLS ensina uma lição central: a pressão arterial cai tarde.** Um adulto jovem perde até 30% da volemia — cerca de 1,5 L — com pressão sistólica ainda normal, sustentada por taquicardia e vasoconstrição. Taquicardia com pressão de pulso estreita é o achado precoce; hipotensão já é choque avançado.',
        '**Transfusão maciça** é classicamente definida como 10 ou mais unidades de hemácias em 24 horas, ou 4 unidades em 1 hora. Definições contemporâneas privilegiam a velocidade: 3 unidades em 1 hora, ou o conceito de "sangramento crítico".',
        '**O protocolo de transfusão maciça** entrega hemácias, plasma e plaquetas em relação equilibrada (próxima de 1:1:1), evitando a coagulopatia dilucional da reposição com hemácias isoladas. O ensaio PROPPR comparou 1:1:1 com 2:1:1 e mostrou hemostasia mais rápida e menos morte por exsanguinação nas primeiras 24 horas com a relação equilibrada.',
        '**Monitorize e trate a tríade letal:** aquecimento ativo do paciente e dos fluidos (hipotermia agrava a coagulopatia de forma dose-dependente), correção da acidose por perfusão e não por bicarbonato, cálcio ionizado (o citrato dos hemocomponentes quela cálcio e a hipocalcemia agrava a coagulopatia e a hipotensão) e fibrinogênio acima de 150 a 200 mg/dL.',
        'A estimativa de perda por inspeção visual é notoriamente imprecisa — subestima em 30 a 50%. Pese compressas, meça o conteúdo dos aspiradores e some.',
      ],
      alertas: ['Ácido tranexâmico 1 g em 10 minutos seguido de 1 g em 8 horas, **em até 3 horas** do trauma, reduz mortalidade. Depois de 3 horas, pode aumentar a mortalidade por sangramento.'],
    }
  },
  formula: [
    'Volume sanguíneo = peso × 75 (♂) | 65 (♀) | 80 (criança) | 85 a 90 mL/kg (lactente)',
    'Perda permitida = volemia × (Ht inicial − Ht mínimo) / Ht inicial',
    'ABC: mecanismo penetrante + PAS ≤ 90 + FC ≥ 120 + FAST positivo; ≥ 2 aciona o protocolo',
  ],
  fundamento:
    'A fórmula da perda permitida assume que a perda é reposta por cristaloide, mantendo o volume total constante enquanto a massa eritrocitária cai — daí a proporcionalidade direta com a queda do hematócrito. É uma aproximação: na prática, a diluição não é instantânea e a redistribuição entre compartimentos leva horas.',
  armadilhas: [
    'O hematócrito medido durante sangramento ativo não reflete a perda: a hemodiluição ainda não aconteceu. Não se tranquilize com hematócrito normal em hemorragia aguda.',
    'Em idosos, betabloqueados e atletas, a resposta taquicárdica pode estar ausente ou atenuada, mascarando a perda.',
  ],
  referencias: [
    { texto: 'American College of Surgeons. Advanced Trauma Life Support Student Course Manual. 10ª ed. 2018.' },
    { texto: 'Holcomb JB, Tilley BC, Baraniuk S, et al. Transfusion of plasma, platelets, and red blood cells in a 1:1:1 vs a 1:1:2 ratio (PROPPR). JAMA. 2015;313(5):471-482.' },
    { texto: 'Nunez TC, Voskresensky IV, Dossett LA, et al. Early prediction of massive transfusion in trauma: simple as ABC? J Trauma. 2009;66(2):346-352.' },
  ],
}

const hidricaPerioperatoria: Ferramenta = {
  id: 'reposicao-hidrica-perioperatoria',
  nome: 'Reposição hídrica perioperatória',
  sinonimos: ['reposicao perioperatoria', 'terceiro espaco', 'fluidoterapia cirurgica', 'gdt'],
  resumo: 'Calcula manutenção, déficit de jejum e perdas por exposição — com a crítica moderna a cada um.',
  categorias: ['cirurgia'],
  campos: [
    campoPeso(),
    campoNum('horasJejum', 'Horas de jejum', { unidade: 'h', min: 0, max: 24, passo: 0.5, padrao: '8' }),
    campoNum('duracao', 'Duração prevista da cirurgia', { unidade: 'h', min: 0.5, max: 12, passo: 0.5, padrao: '2' }),
    campoOpc('trauma', 'Grau de exposição e trauma cirúrgico', [
      { valor: '2', rotulo: 'Pequeno (superficial, laparoscopia curta) — 2 mL/kg/h', pontos: 2 },
      { valor: '4', rotulo: 'Moderado (abdominal fechada, ortopédica) — 4 mL/kg/h', pontos: 4 },
      { valor: '6', rotulo: 'Grande (laparotomia extensa, torácica) — 6 mL/kg/h', pontos: 6 },
    ]),
    campoNum('perdaSangue', 'Perda sanguínea estimada', { unidade: 'mL', min: 0, max: 5000, passo: 50, padrao: '0' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const jejum = numOu(v, 'horasJejum', 8)
    const duracao = numOu(v, 'duracao', 2)
    const trauma = num(v, 'trauma')
    const sangue = numOu(v, 'perdaSangue', 0)
    if (peso === null || trauma === null) return null
    const manutencaoHora = peso <= 10 ? peso * 4 : peso <= 20 ? 40 + (peso - 10) * 2 : 60 + (peso - 20) * 1
    const deficitJejum = manutencaoHora * jejum
    const perdasExposicao = trauma * peso * duracao
    const reposicaoSangue = sangue * 3
    const totalClassico = deficitJejum + manutencaoHora * duracao + perdasExposicao + reposicaoSangue
    const restritivo = manutencaoHora * duracao + sangue * 1.5 + peso * 1.5 * duracao
    return {
      titulo: 'Reposição total (abordagem clássica)',
      valor: fmtInt(totalClassico),
      unidade: 'mL',
      nivel: 'neutro',
      rotuloNivel: `${fmt(duracao, 1)} h de cirurgia · ${fmt(peso, 1)} kg`,
      detalhes: [
        { rotulo: 'Manutenção por hora (regra 4-2-1)', valor: `${fmtInt(manutencaoHora)} mL/h` },
        { rotulo: 'Déficit de jejum', valor: `${fmtInt(deficitJejum)} mL`, nota: 'Manutenção × horas de jejum. **Este item é o mais questionado hoje** — com jejum de 2 horas para líquidos claros e bebida com carboidrato pré-operatória, o déficit real é muito menor do que a conta sugere.' },
        { rotulo: 'Manutenção durante a cirurgia', valor: `${fmtInt(manutencaoHora * duracao)} mL` },
        { rotulo: 'Perdas por exposição e "terceiro espaço"', valor: `${fmtInt(perdasExposicao)} mL`, nota: '**O conceito de terceiro espaço não anatômico foi refutado.** Estudos com traçadores não confirmaram sua existência; o que existe é extravasamento para o interstício por lesão do glicocálice endotelial, agravado justamente pela reposição excessiva.' },
        { rotulo: 'Reposição de perda sanguínea (3:1 com cristaloide)', valor: `${fmtInt(reposicaoSangue)} mL`, nota: 'A regra 3:1 também é hoje considerada excessiva; 1,5:1 é mais próximo do necessário quando o objetivo é apenas restaurar volume.' },
        { rotulo: 'Estimativa por abordagem restritiva', valor: `${fmtInt(restritivo)} mL`, nota: 'Manutenção + 1 a 2 mL/kg/h de perdas + reposição de sangue 1,5:1. É o que a prática contemporânea recomenda como ponto de partida.', nivel: 'ok' },
      ],
      conduta: [
        'Adote a estratégia **restritiva ou zero-balance** em cirurgia de grande porte: a antiga fórmula de Holliday-Segar somada a reposição generosa de \'terceiro espaço\' produz sobrecarga, edema intestinal, deiscência de anastomose, íleo prolongado e complicação pulmonar. O alvo moderno é balanço próximo de zero, com ganho de peso pós-operatório mínimo.',
        'Prefira a **terapia guiada por metas** em cirurgia de alto risco: reponha volume em alíquotas de 250 mL e mantenha apenas se houver aumento do volume sistólico, usando variação de pressão de pulso, monitorização de débito ou elevação passiva de pernas. Isso substitui metas fixas por resposta individual.',
        'Escolha **cristaloide balanceado** (Ringer lactato, Plasma-Lyte) em vez de soro fisiológico a 0,9% para volumes grandes: a salina em excesso causa acidose metabólica hiperclorêmica, com vasoconstrição renal e maior necessidade de terapia de substituição renal. Evite **amidos (hidroxietilamido)**, associados a lesão renal e mortalidade.',
        'Reduza a **perda insensível estimada**, que é historicamente superestimada: hoje se calcula em torno de 0,5 a 1 mL/kg/h mesmo em laparotomia aberta, contra os 8 a 10 mL/kg/h da literatura antiga. É esse número inflado que sustenta a hiper-hidratação tradicional.',
        'Trate **hipotensão sob anestesia** com vasopressor, não com volume adicional: ela decorre majoritariamente da vasoplegia induzida pelos anestésicos, e não de hipovolemia. Combine com os demais elementos do protocolo ERAS — jejum abreviado com carboidrato, normotermia, analgesia multimodal poupadora de opioide, retirada precoce de sondas e mobilização no mesmo dia.',
      ],
      interpretacao: [
        '**A fluidoterapia perioperatória mudou radicalmente.** A abordagem clássica, com déficit de jejum, terceiro espaço e reposição 3:1, gerava balanços positivos de 4 a 6 litros em laparotomias — com edema intestinal, íleo prolongado, deiscência de anastomose, edema pulmonar e internação mais longa.',
        '**Nem restritivo demais é bom.** O ensaio RELIEF mostrou que a estratégia muito restritiva aumentou lesão renal aguda em comparação com uma estratégia moderada. O alvo é **zero-balanço**: repor o que se perde, sem excesso e sem déficit.',
        '**Terapia guiada por metas (GDT)** — titular fluidos pelo volume sistólico ou por variáveis dinâmicas de responsividade em vez de fórmulas fixas — é o padrão em cirurgia de grande porte. Ela reduz complicações em pacientes de alto risco.',
        '**Vasopressor não é sinal de fracasso.** A hipotensão da anestesia é predominantemente vasoplégica, não hipovolêmica: tratá-la com litros de cristaloide em vez de vasopressor é a fonte mais comum de sobrecarga intraoperatória.',
        'Meça o que puder: diurese, perda em compressas e aspiradores, e parâmetros dinâmicos. As fórmulas são ponto de partida — a reavaliação é o método.',
      ],
      alertas: ['Cristaloides balanceados são preferíveis à salina 0,9% em volumes acima de 2 litros, pela acidose hiperclorêmica.'],
    }
  },
  formula: [
    'Manutenção (4-2-1): 4 mL/kg/h nos primeiros 10 kg + 2 nos 10 kg seguintes + 1 acima disso',
    'Déficit de jejum = manutenção × horas de jejum',
    'Perdas por exposição: 2 a 6 mL/kg/h conforme o trauma cirúrgico',
    'Reposição de sangue: 3:1 com cristaloide (clássico) ou 1,5:1 (contemporâneo)',
  ],
  fundamento:
    'A fórmula clássica foi construída nos anos 1960, quando se acreditava num "terceiro espaço" não anatômico que sequestraria litros de líquido durante grandes cirurgias. Pesquisas com traçadores nas últimas duas décadas não confirmaram esse compartimento. O que se observa é dano ao glicocálice endotelial — a camada de glicoproteínas que reveste o endotélio e regula a permeabilidade — provocado por inflamação, isquemia-reperfusão e, ironicamente, pela própria hipervolemia, que libera peptídeo natriurético atrial e degrada o glicocálice.',
  armadilhas: [
    'Somar todos os componentes da fórmula clássica produz volumes que hoje são reconhecidamente excessivos em cirurgia abdominal.',
    'Balanço hídrico positivo cumulativo é preditor independente de complicação e de mortalidade em cirurgia de grande porte.',
  ],
  referencias: [
    { texto: 'Myles PS, Bellomo R, Corcoran T, et al. Restrictive versus liberal fluid therapy for major abdominal surgery (RELIEF). N Engl J Med. 2018;378(24):2263-2274.' },
    { texto: 'Chappell D, Jacob M, Hofmann-Kiefer K, Conzen P, Rehm M. A rational approach to perioperative fluid management. Anesthesiology. 2008;109(4):723-740.' },
  ],
}

export const ferramentas: Ferramenta[] = [asa, rcri, gupta, alvarado, air, tokyo, possum, apfel, jejum, volemiaCirurgica, hidricaPerioperatoria]

export default ferramentas
