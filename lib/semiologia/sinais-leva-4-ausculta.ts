import type { Sinal } from './esquemas'

/**
 * Quarta leva, parte 4 — os sons que faltavam para a ausculta cardíaca ter
 * um mínimo de vocabulário completo: as bulhas normais e seus desdobramentos,
 * a estenose mitral, a insuficiência aórtica, o prolapso e o sopro inocente.
 * O caso real de cada ficha é áudio (Heart Sound & Murmur Library, Judge e
 * Mangrulkar, University of Michigan, CC BY-SA 3.0). Fone de ouvido.
 */
export const SINAIS_LEVA_4_AUSCULTA: Sinal[] = [
  {
    slug: 'bulhas-normais',
    nome: 'Bulhas normais — B1 e B2',
    sinonimos: ['Primeira e segunda bulhas', 'S1 e S2', 'Tum-tá', 'Desdobramento de B1'],
    sistema: 'cardiovascular',
    resumo: 'O "tum-tá" que tudo o mais modifica: B1 (mitral e tricúspide fechando) mais grave e longa no ápice, B2 (aórtica e pulmonar) mais aguda e curta na base — saber o normal é o que permite ouvir o anormal.',
    definicao: 'B1: som grave, de maior duração, síncrono com o pulso carotídeo, mais intenso no ápice, produzido pelo fechamento mitral e tricúspide; pode ser discretamente desdobrado no foco tricúspide (componentes M1 e T1, normal). B2: som mais agudo e breve, mais intenso na base, produzido pelo fechamento aórtico (A2) e pulmonar (P2); sístole é o intervalo curto entre B1 e B2, diástole o intervalo longo entre B2 e a B1 seguinte.',
    comoProcurar: [
      { passo: 'Palpe a carótida enquanto ausculta: a bulha que coincide com o pulso é B1.', detalhe: 'Na taquicardia, sístole e diástole se igualam e é a carótida que diz qual é qual.' },
      { passo: 'Ápice com a campânula, base com o diafragma.', detalhe: 'B1 domina no ápice; B2 domina na base. A intensidade relativa muda com o foco.' },
      { passo: 'Ouça cada bulha isoladamente por alguns ciclos, depois os intervalos.', detalhe: 'A ausculta é sequencial: B1, B2, sístole, diástole — nunca tudo de uma vez.' },
    ],
    mecanismo: 'As bulhas são vibrações da desaceleração súbita do sangue quando as valvas fecham e as estruturas cardíacas se tensionam: B1 no início da contração isovolumétrica (mitral antes da tricúspide), B2 no início do relaxamento (aórtica antes da pulmonar). A intensidade depende da posição dos folhetos no momento do fechamento, da força da contração e da transmissão pela parede torácica.',
    significado: 'É a referência de tudo: B1 hiperfonética na estenose mitral e no PR curto, hipofonética na insuficiência mitral e no PR longo; B2 hiperfonética (A2) na hipertensão arterial e (P2) na hipertensão pulmonar, abolida na estenose aórtica calcificada. Desdobramento fisiológico de B2 na inspiração; de B1, discreto e no foco tricúspide.',
    armadilhas: ['Confundir B1 desdobrada com B4 ou com click de ejeção — B4 vem antes de B1 e é grave; click vem depois e é agudo.', 'Obesidade, DPOC e derrame pericárdico abafam as duas bulhas — bulhas hipofonéticas não são necessariamente do coração.'],
    causas: [
      { titulo: 'B1 alterada', mecanismo: 'Posição dos folhetos mitrais no fechamento.', itens: ['Hiperfonética: estenose mitral, PR curto, taquicardia', 'Hipofonética: insuficiência mitral, PR longo, disfunção de VE', 'Variável: fibrilação atrial, bloqueio AV total'] },
      { titulo: 'B2 alterada', mecanismo: 'Pressão de fechamento aórtico e pulmonar.', itens: ['A2 hiperfonética: hipertensão arterial', 'P2 hiperfonética: hipertensão pulmonar', 'A2 hipofonética ou ausente: estenose aórtica grave'] },
    ],
    referencias: ['Judge RD, Mangrulkar RS. Heart Sound & Murmur Library. University of Michigan, 2015.', 'Bickley LS. Bates — Propedêutica Médica, 13ª ed.'],
  },
  {
    slug: 'desdobramento-de-b2',
    nome: 'Desdobramento de B2',
    sinonimos: ['Split S2', 'Desdobramento fisiológico, fixo e paradoxal', 'B2 única'],
    sistema: 'cardiovascular',
    resumo: 'A segunda bulha se abre em dois na inspiração e fecha na expiração — fisiológico. Se fica aberta o tempo todo (fixo), é comunicação interatrial ou bloqueio de ramo direito; se abre na expiração (paradoxal), o ventrículo esquerdo está atrasado.',
    definicao: 'Separação audível entre A2 e P2 no foco pulmonar, com o diafragma: fisiológico — desdobra na inspiração (P2 atrasa) e funde na expiração; amplo e fixo — desdobrado nas duas fases, sem variação respiratória (CIA, BRD completo); paradoxal — desdobrado na expiração e fundido na inspiração (BRE, estenose aórtica grave, marca-passo em VD); B2 única — sem desdobramento audível, normal no idoso e na obesidade, ou por A2 ausente na estenose aórtica.',
    comoProcurar: [
      { passo: 'Diafragma no 2º espaço intercostal esquerdo, paciente respirando lenta e profundamente.', detalhe: 'Só no foco pulmonar P2 é audível; no ápice ouve-se só A2.' },
      { passo: 'Acompanhe várias respirações: abre na inspiração, fecha na expiração?', detalhe: 'Sentado, o desdobramento fisiológico costuma fechar completamente na expiração.' },
      { passo: 'Não varia? É fixo. Abre na expiração? É paradoxal.', detalhe: 'Fixo pede ecocardiograma (CIA); paradoxal pede ECG (BRE).' },
    ],
    mecanismo: 'A inspiração aumenta o retorno venoso ao coração direito, prolonga a sístole do VD e atrasa P2; ao mesmo tempo reduz o retorno ao esquerdo e adianta A2 — o desdobramento fisiológico. Na CIA, o shunt mantém o VD sobrecarregado nas duas fases e o desdobramento não varia; no BRD, o VD é ativado tarde. No BRE e na estenose aórtica grave, é A2 que atrasa e passa a cair depois de P2 — na inspiração P2 atrasa e "alcança" A2, fundindo.',
    significado: 'Desdobramento fixo é um dos poucos sinais físicos que diagnosticam uma cardiopatia congênita no adulto assintomático (CIA). Paradoxal indica atraso elétrico ou mecânico do VE. B2 única por A2 abolida é marcador de estenose aórtica grave.',
    armadilhas: ['Desdobramento amplo mas variável (não fixo) no BRD e na estenose pulmonar — o que define a CIA é não variar.', 'Sopro de ejeção pulmonar suave acompanha a CIA e o desdobramento fixo — não o confunda com estenose pulmonar.', 'Em jovens em decúbito, o desdobramento pode persistir discretamente na expiração — sentado, fecha.'],
    causas: [
      { titulo: 'Fixo', mecanismo: 'Sobrecarga de volume ou atraso elétrico do VD constantes.', itens: ['Comunicação interatrial', 'Bloqueio de ramo direito completo', 'Estenose pulmonar (amplo, pouco variável)'] },
      { titulo: 'Paradoxal', mecanismo: 'A2 atrasada.', itens: ['Bloqueio de ramo esquerdo', 'Estenose aórtica grave', 'Marca-passo em VD', 'Cardiomiopatia hipertrófica obstrutiva'] },
      { titulo: 'B2 única', mecanismo: 'Um componente inaudível.', itens: ['Idoso e obeso (normal)', 'Estenose aórtica calcificada (A2 ausente)', 'Tetralogia de Fallot (P2 ausente)'] },
    ],
    referencias: ['Judge RD, Mangrulkar RS. Heart Sound & Murmur Library. University of Michigan, 2015.', 'Shaver JA. Cardiac auscultation: a cost-effective diagnostic skill. Curr Probl Cardiol, 1995.'],
  },
  {
    slug: 'sopro-de-estenose-mitral',
    nome: 'Sopro de estenose mitral',
    sinonimos: ['Ruflar diastólico', 'Estalido de abertura', 'Reforço pré-sistólico'],
    sistema: 'cardiovascular',
    resumo: 'B1 hiperfonética, um estalido agudo logo após B2 e, em seguida, um ruflar grave e rolante que enche a diástole e cresce antes de B1 — só no ápice, com a campânula, em decúbito lateral esquerdo.',
    definicao: 'Sopro diastólico de baixa frequência (ruflar), localizado no ápice, ouvido com a campânula em decúbito lateral esquerdo, iniciado após o estalido de abertura (som agudo 0,04 a 0,12 s depois de A2) e com reforço pré-sistólico em ritmo sinusal (contração atrial); B1 hiperfonética; quanto mais grave a estenose, mais longo o sopro e mais precoce o estalido.',
    comoProcurar: [
      { passo: 'Decúbito lateral esquerdo, campânula encostada sem pressão no ápice, paciente em expiração.', detalhe: 'Pressionar a campânula transforma-a em diafragma e apaga o ruflar grave.' },
      { passo: 'Ouça o intervalo B2-B1: o estalido agudo e depois o ruflar.', detalhe: 'Cinco flexões de braço ou dez agachamentos aumentam o fluxo e fazem o ruflar aparecer quando é discreto.' },
      { passo: 'Meça o intervalo A2-estalido: curto (< 0,08 s) é estenose grave.', detalhe: 'Em fibrilação atrial, some o reforço pré-sistólico.' },
    ],
    mecanismo: 'Os folhetos fundidos e rígidos abrem com um estalo (estalido de abertura) quando a pressão atrial vence a ventricular; o sangue passa pelo orifício estreito em turbulência de baixa frequência durante todo o enchimento; a contração atrial acelera o fluxo no fim da diástole (reforço pré-sistólico); a valva ainda aberta e tensa fecha com força na sístole (B1 hiperfonética).',
    significado: 'Sopro da doença reumática — ainda comum no Brasil. A gravidade se lê pela duração do ruflar e pelo intervalo A2-estalido, não pela intensidade. Fibrilação atrial, hipertensão pulmonar (P2 hiperfonética) e embolia são as consequências que a ausculta antecipa.',
    armadilhas: ['Sopro de Austin Flint (insuficiência aórtica grave): ruflar diastólico apical sem estalido e com B1 normal ou hipofonética.', 'Mixoma atrial esquerdo imita — o sopro muda com a posição.', 'Estenose mitral "silenciosa" no débito baixo, na obesidade e na calcificação extrema (sem estalido).'],
    causas: [
      { titulo: 'Estenose mitral', mecanismo: 'Obstrução do enchimento ventricular esquerdo.', itens: ['Doença reumática (95%)', 'Calcificação anular grave do idoso', 'Congênita, carcinoide, lúpus (raras)'] },
      { titulo: 'Ruflar sem estenose', mecanismo: 'Hiperfluxo ou vibração do folheto.', itens: ['Austin Flint (insuficiência aórtica)', 'Hiperfluxo mitral na insuficiência mitral grave e na CIV', 'Mixoma atrial'] },
    ],
    referencias: ['Judge RD, Mangrulkar RS. Heart Sound & Murmur Library. University of Michigan, 2015.', 'Otto CM et al. 2020 ACC/AHA Guideline for the Management of Patients With Valvular Heart Disease. Circulation, 2021.'],
  },
  {
    slug: 'sopro-de-insuficiencia-aortica',
    nome: 'Sopro de insuficiência aórtica',
    sinonimos: ['Sopro diastólico aspirativo', 'Sopro de regurgitação aórtica', 'Sopro protodiastólico em decrescendo'],
    sistema: 'cardiovascular',
    resumo: 'Um sopro suave, aspirativo, que começa logo com B2 e vai morrendo pela diástole, melhor ouvido com o paciente sentado, inclinado para a frente, em expiração forçada, no 3º espaço intercostal esquerdo — o sopro mais fácil de perder.',
    definicao: 'Sopro diastólico de alta frequência, em decrescendo, iniciado imediatamente após A2, mais audível na borda esternal esquerda (3º e 4º espaços) ou no foco aórtico, com o diafragma, paciente sentado e inclinado para a frente em apneia expiratória; duração proporcional à gravidade na forma crônica (curto na aguda, por equalização de pressões); acompanhado de pulso amplo e célere e pressão diferencial alargada; na forma grave, ruflar apical de Austin Flint.',
    comoProcurar: [
      { passo: 'Sente o paciente, incline-o para a frente, peça expiração completa e apneia; diafragma firme na borda esternal esquerda.', detalhe: 'É a única posição em que o sopro discreto aparece; deitado, ele some.' },
      { passo: 'Procure o som "de sopro de vento" logo depois de B2.', detalhe: 'Alta frequência, suave — treine o ouvido no silêncio.' },
      { passo: 'Confira os periféricos: pulso em martelo d\'água, pressão diferencial > 60 mmHg, pulsação capilar (Quincke), sinal de Musset.', detalhe: 'Na aguda (endocardite, dissecção) os periféricos faltam e o sopro é curto — a gravidade está no paciente, não no sopro.' },
    ],
    mecanismo: 'O sangue reflui da aorta para o VE durante a diástole pelo orifício incompetente; o gradiente é máximo logo após o fechamento (por isso começa com A2) e cai à medida que a pressão ventricular sobe (decrescendo). O volume regurgitado dilata o VE, aumenta o volume sistólico (pulso amplo) e reduz a pressão diastólica (pressão diferencial alargada).',
    significado: 'Diagnóstico frequentemente perdido porque exige posição e técnica; a duração do sopro, não a intensidade, acompanha a gravidade na forma crônica. Na forma aguda — endocardite, dissecção tipo A — o sopro é curto e suave e o paciente está em edema agudo: a ausculta subestima e o ecocardiograma decide.',
    armadilhas: ['Sopro de Graham Steell (insuficiência pulmonar na hipertensão pulmonar): mesma tonalidade, mesmo local, sem periféricos e com P2 hiperfonética.', 'Sopro sistólico de ejeção acompanha a IA (hiperfluxo) e não significa estenose associada.', 'Confundir o ruflar de Austin Flint com estenose mitral.'],
    causas: [
      { titulo: 'Doença dos folhetos', mecanismo: 'Coaptação incompleta.', itens: ['Valva bicúspide', 'Doença reumática', 'Endocardite infecciosa (aguda)', 'Degenerativa'] },
      { titulo: 'Doença da raiz', mecanismo: 'Dilatação do anel.', itens: ['Dissecção aórtica tipo A (aguda)', 'Marfan, aortopatias', 'Sífilis terciária', 'Espondiloartrites, arterite'] },
    ],
    referencias: ['Judge RD, Mangrulkar RS. Heart Sound & Murmur Library. University of Michigan, 2015.', 'Choudhry NK, Etchells EE. Does this patient have aortic regurgitation? JAMA, 1999.'],
  },
  {
    slug: 'prolapso-mitral-click',
    nome: 'Click mesossistólico do prolapso mitral',
    sinonimos: ['Click sistólico', 'Síndrome click-sopro', 'Prolapso da valva mitral'],
    sistema: 'cardiovascular',
    resumo: 'Um estalo agudo no meio da sístole, às vezes seguido de um sopro que cresce até B2 — e que muda de lugar quando o paciente fica de pé (mais cedo) ou agacha (mais tarde): o folheto que se joga para o átrio.',
    definicao: 'Som agudo, breve, de alta frequência, no meio ou no fim da sístole (não de ejeção — vem bem depois de B1), audível no ápice com o diafragma, isolado ou seguido de sopro telessistólico em crescendo até B2 (regurgitação mitral pelo folheto prolapsado); manobras que reduzem o volume do VE (ficar de pé, Valsalva) adiantam o click e alongam o sopro; as que o aumentam (agachar, decúbito) atrasam o click e encurtam o sopro.',
    comoProcurar: [
      { passo: 'Diafragma no ápice, paciente deitado: localize o click no meio da sístole.', detalhe: 'Click de ejeção vem colado a B1; o do prolapso vem depois, no meio.' },
      { passo: 'Peça para ficar de pé e ausculte de novo: o click adianta e o sopro alonga.', detalhe: 'Depois agache: o click atrasa. É a manobra que confirma.' },
      { passo: 'Sopro holossistólico sem click em quem tinha click: a regurgitação progrediu.', detalhe: 'Ecocardiograma quantifica; ruptura de cordoalha muda tudo de repente.' },
    ],
    mecanismo: 'O folheto redundante (degeneração mixomatosa) se projeta para o átrio quando o VE atinge um certo volume na sístole; a tensão súbita das cordoalhas e do folheto produz o click; a partir daí a coaptação falha e o sangue reflui — o sopro telessistólico. Um VE menor (ortostatismo) atinge o volume crítico mais cedo; um VE maior (agachamento), mais tarde.',
    significado: 'A valvopatia mais comum nos países ricos (2 a 3% da população); a maioria é benigna. O que importa é a regurgitação associada, a ruptura de cordoalha (sopro súbito holossistólico) e o risco de endocardite. As manobras posturais são o teste mais específico da beira do leito.',
    armadilhas: ['Click de ejeção aórtico ou pulmonar: protossistólico, não se move com a postura.', 'Atrito pericárdico tem componente sistólico "em raspa" — não é click.', 'Sopro telessistólico isquêmico (disfunção de papilar) não tem click e aparece com a dor.'],
    causas: [
      { titulo: 'Prolapso primário', mecanismo: 'Degeneração mixomatosa dos folhetos.', itens: ['Prolapso mitral idiopático', 'Marfan, Ehlers-Danlos, osteogênese imperfeita'] },
      { titulo: 'Secundário', mecanismo: 'Desproporção entre folheto e ventrículo.', itens: ['CIA, cardiomiopatia hipertrófica', 'Disfunção de músculo papilar (isquemia)', 'Ruptura de cordoalha (endocardite, trauma)'] },
    ],
    referencias: ['Judge RD, Mangrulkar RS. Heart Sound & Murmur Library. University of Michigan, 2015.', 'Delling FN, Vasan RS. Epidemiology and pathophysiology of mitral valve prolapse. Circulation, 2014.'],
  },
  {
    slug: 'sopro-inocente',
    nome: 'Sopro sistólico de ejeção inocente',
    sinonimos: ['Sopro funcional', 'Sopro de fluxo', 'Sopro de Still', 'Sopro benigno da criança'],
    sistema: 'cardiovascular',
    resumo: 'Sopro sistólico curto, suave, de ejeção, na borda esternal esquerda, sem B2 anormal, sem click, sem irradiação e que some ao sentar — o sopro de metade das crianças saudáveis e da gestante, que não precisa de ecocardiograma.',
    definicao: 'Sopro mesossistólico de ejeção, grau 1 a 2/6, suave ou vibratório/musical (Still), localizado na borda esternal esquerda baixa ou no foco pulmonar, sem irradiação, que diminui ou desaparece na posição sentada, em pé e com Valsalva, em paciente sem sintomas, com bulhas normais (B2 com desdobramento fisiológico), sem click, sem frêmito, sem sopro diastólico e com pulsos normais. Também: sopro de ejeção pulmonar suave da gestante, do anêmico e do febril (hiperfluxo).',
    comoProcurar: [
      { passo: 'Caracterize: onde, quando na sístole, intensidade, timbre, irradiação.', detalhe: 'Sistólico, curto, suave, sem irradiação, sem frêmito — os cinco "sem".' },
      { passo: 'Ausculte deitado e depois sentado ou de pé.', detalhe: 'Some ou diminui: fluxo; persiste ou aumenta: estrutural (CMH aumenta em pé).' },
      { passo: 'Confira B2, pulsos femorais e pressão nos quatro membros na criança.', detalhe: 'B2 fixa (CIA), pulsos femorais fracos (coarctação) ou click transformam o inocente em orgânico.' },
    ],
    mecanismo: 'Fluxo normal ou aumentado atravessando uma via de saída normal produz turbulência audível quando a parede torácica é fina (criança) ou o débito é alto (febre, anemia, gestação, hipertireoidismo); as vibrações das cordas tendíneas falsas do VE dão o timbre musical de Still. Sem obstrução, não há gradiente — e por isso o sopro é curto, suave e mesossistólico.',
    significado: 'Reconhecer o inocente poupa ecocardiogramas e angústia; os critérios negativos (sem sintomas, sem frêmito, sem irradiação, bulhas normais, muda com postura) têm boa acurácia nas mãos de quem treinou. Sopro sistólico com qualquer "sinal vermelho" — diastólico associado, holossistólico, grau ≥ 3, click, B2 anormal, sintomas — não é inocente.',
    armadilhas: ['Estenose aórtica leve e CMH em jovem podem soar como inocente — CMH aumenta em pé e com Valsalva, o inocente diminui.', 'CIA: sopro de ejeção pulmonar suave, mas com B2 fixa.', 'Sopro venoso (zumbido contínuo cervical, some ao comprimir a jugular) é inocente e contínuo — não confundir com PCA.'],
    causas: [
      { titulo: 'Fluxo normal em tórax fino', mecanismo: 'Turbulência fisiológica na via de saída.', itens: ['Sopro de Still (2 a 7 anos)', 'Sopro de ejeção pulmonar do adolescente', 'Sopro venoso cervical'] },
      { titulo: 'Hiperfluxo', mecanismo: 'Débito aumentado.', itens: ['Gestação', 'Anemia', 'Febre', 'Hipertireoidismo', 'Fístula arteriovenosa'] },
    ],
    referencias: ['Judge RD, Mangrulkar RS. Heart Sound & Murmur Library. University of Michigan, 2015.', 'McCrindle BW et al. Cardinal clinical signs in the differentiation of heart murmurs in children. Arch Pediatr Adolesc Med, 1996.'],
  },
]
