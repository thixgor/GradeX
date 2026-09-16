import type { Sinal } from './esquemas'

/**
 * Sinais cardiovasculares e respiratórios que são **tempo e comparação**, não
 * imagem: sopros, bulhas extras, pulsos, sons respiratórios, percussão e
 * frêmito. As fichas seguem o mesmo caminho das demais (o que conta como
 * presente → como se procura → por que aparece → o que muda), e a figura de
 * cada uma usa a notação que o próprio exame usa — fonocardiograma, traçado
 * de pulso, mapa do tórax — em vez de uma fotografia que não registraria nada.
 */
export const SINAIS_CARDIORRESPIRATORIOS: Sinal[] = [
  {
    slug: 'pressao-arterial-ortostatica',
    nome: 'Hipotensão ortostática',
    sinonimos: ['Hipotensão postural', 'Queda ortostática da pressão'],
    sistema: 'cardiovascular',
    resumo: 'A pressão que cai quando o paciente levanta — o sinal que explica a síncope de quem "só ficou tonto".',
    definicao:
      'Queda da pressão sistólica ≥ 20 mmHg ou da diastólica ≥ 10 mmHg dentro de 3 minutos após ficar em pé (ou inclinar a 60°), comparada à medida deitada. Uma queda menor com sintomas também conta. Sem a medida deitada, não há como definir o sinal.',
    comoProcurar: [
      { passo: 'Meça deitado após 5 minutos de repouso.', detalhe: 'A medida sentada não serve de base: já perdeu parte do retorno venoso. É deitado × em pé.' },
      { passo: 'Levante o paciente e meça em 1 e em 3 minutos, de pé.', detalhe: 'A queda imediata (nos primeiros 15 segundos) some rápido e passa despercebida; a clássica é a de 3 minutos. Meça as duas.' },
      { passo: 'Registre a frequência cardíaca junto.', detalhe: 'Frequência que sobe ≥ 15 bpm com a queda aponta hipovolemia (reflexo intacto); frequência que não sobe aponta falha autonômica ou betabloqueio.' },
      { passo: 'Pergunte o que ele sente enquanto está em pé.', detalhe: 'Tontura, visão escurecida e dor nos ombros ("cabide") em pé são sintomas ortostáticos mesmo quando a queda numérica não fecha o critério.' },
    ],
    mecanismo:
      'Ao levantar, 500 a 800 mL de sangue migram para as pernas e o esplâncnico em segundos. O barorreflexo carotídeo percebe a queda do estiramento e responde em um batimento: taquicardia e vasoconstrição, restaurando a pressão antes que o cérebro perceba. O sinal aparece quando falta volume para redistribuir (hipovolemia, hemorragia), quando o reflexo está lento ou ausente (neuropatia autonômica, idade, Parkinson), ou quando fármacos bloqueiam a resposta (alfabloqueadores, diuréticos, antidepressivos tricíclicos, nitratos). A frequência cardíaca diz qual dos três: sobe na hipovolemia, fica parada na disautonomia.',
    significado:
      'É a causa mais frequentemente identificável de síncope no idoso e o sinal físico mais útil na avaliação de desidratação e sangramento oculto. Muda o que se faz: revisão da lista de medicamentos, reposição de volume, investigação de sangramento, e, na disautonomia, medidas não farmacológicas e midodrina ou fludrocortisona. Em paciente com queda ou síncope, a medida ortostática negativa também importa — desloca a investigação para o coração.',
    armadilhas: [
      'Medir sentado × em pé subestima a queda. A base é deitado.',
      'Medir só uma vez, imediatamente ao levantar, perde a hipotensão tardia; medir só aos 3 minutos perde a inicial. Faça as duas.',
      'Queda pequena com sintomas em pé é clinicamente ortostática, mesmo sem fechar 20/10.',
      'No idoso a prevalência é alta e nem sempre explica a síncope; o achado é necessário, não suficiente.',
    ],
    causas: [
      { titulo: 'Hipovolemia (frequência sobe)', mecanismo: 'Falta volume para redistribuir; o reflexo funciona e taquicardiza.', itens: ['Desidratação (diarreia, vômito, diurético)', 'Hemorragia, inclusive digestiva oculta', 'Insuficiência adrenal', 'Sepse inicial'] },
      { titulo: 'Falha autonômica (frequência não sobe)', mecanismo: 'O reflexo não vasoconstringe nem acelera.', itens: ['Neuropatia diabética', 'Parkinson e atrofia de múltiplos sistemas', 'Amiloidose', 'Idade avançada e desuso'] },
      { titulo: 'Fármacos', mecanismo: 'Bloqueio do reflexo ou vasodilatação direta.', itens: ['Alfabloqueadores (tansulosina, doxazosina)', 'Diuréticos', 'Nitratos e vasodilatadores', 'Antidepressivos tricíclicos, antipsicóticos', 'Betabloqueadores (impedem a taquicardia compensatória)'] },
    ],
    desempenho: [
      { alvo: 'Perda sanguínea aguda > 1 L', sensibilidade: '~97% (aumento da FC ≥ 30 bpm ou tontura grave em pé)', especificidade: '~98%', leitura: 'O aumento da frequência em pé é mais sensível que a queda da pressão para perda de sangue moderada.', fonte: 'McGee S, Abernethy WB, Simel DL. Is this patient hypovolemic? JAMA, 1999.' },
    ],
    ilustracao: { id: 'pulso', params: { achado: 'ortostatico', valor: 30 }, alt: 'Barras de pressão sistólica deitado e em pé, com a queda ortostática' },
    referencias: ['Freeman R et al. Consensus statement on the definition of orthostatic hypotension. Clin Auton Res, 2011.', 'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.'],
  },
  {
    slug: 'pulso-irregularmente-irregular',
    nome: 'Pulso irregularmente irregular',
    sinonimos: ['Arritmia completa', 'Pulso da fibrilação atrial'],
    sistema: 'cardiovascular',
    resumo: 'Intervalos que mudam sem nenhum padrão — e amplitude que muda junto. É fibrilação atrial até o eletrocardiograma dizer o contrário.',
    definicao:
      'Ritmo do pulso em que os intervalos entre os batimentos variam sem qualquer periodicidade reconhecível, com amplitude também variável (batimentos após pausas longas são mais fortes). Diferente da irregularidade "regular" da extrassístole (batimento adiantado seguido de pausa, num padrão que se repete) e da arritmia sinusal (acelera na inspiração, desacelera na expiração).',
    comoProcurar: [
      { passo: 'Palpe o pulso radial por pelo menos 30 segundos — um minuto se irregular.', detalhe: '15 segundos não bastam para reconhecer padrão; a fibrilação lenta engana em amostras curtas.' },
      { passo: 'Procure padrão: repete? acompanha a respiração?', detalhe: 'Extrassístole é "regular com falhas"; arritmia sinusal é ondulação respiratória; fibrilação é caos.' },
      { passo: 'Ausculte o ápice e compare com o pulso radial.', detalhe: 'Na fibrilação rápida, batimentos fracos não chegam ao punho — o déficit de pulso (frequência apical > radial) é característico.' },
      { passo: 'Peça o eletrocardiograma.', detalhe: 'O pulso levanta a suspeita; só o traçado confirma e diferencia de flutter com condução variável e de extrassístoles multifocais.' },
    ],
    mecanismo:
      'Na fibrilação atrial, os átrios disparam 400 a 600 vezes por minuto de forma desorganizada, e o nó atrioventricular deixa passar um impulso ocasional, em intervalos que dependem do seu período refratário aleatoriamente estimulado. Cada intervalo diastólico diferente enche o ventrículo de modo diferente — e cada sístole ejeta um volume diferente. É por isso que a amplitude varia junto com o ritmo: intervalo longo, enchimento maior, pulso mais forte; intervalo curto, pulso fraco ou ausente no punho.',
    significado:
      'Fibrilação atrial não diagnosticada é a causa evitável mais comum de AVC isquêmico. Reconhecer o pulso irregularmente irregular numa consulta de rotina e pedir o ECG é, provavelmente, a ação preventiva de maior rendimento que o exame físico oferece. Além do risco embólico, a resposta ventricular rápida causa palpitação, dispneia e insuficiência cardíaca; a lenta, síncope. Muda a conduta: anticoagulação conforme CHA₂DS₂-VASc e controle de frequência ou ritmo.',
    armadilhas: [
      'Contar em 15 segundos e multiplicar por 4 subestima ou superestima a frequência na fibrilação; conte um minuto no ápice.',
      'Extrassístoles frequentes simulam irregularidade — mas têm padrão (batimento precoce, pausa, retomada). Se em dúvida, ECG.',
      'A arritmia sinusal do jovem é irregular e benigna; some com a apneia.',
      'Fibrilação com resposta lenta e regular (bloqueio AV total) tem pulso regular — o sinal desaparece justamente quando a arritmia é mais grave.',
    ],
    causas: [
      { titulo: 'Fibrilação atrial', mecanismo: 'Condução aleatória pelo nó AV.', itens: ['Hipertensão e cardiopatia hipertensiva', 'Valvopatia mitral', 'Insuficiência cardíaca', 'Hipertireoidismo', 'Álcool ("holiday heart")', 'Pós-operatório de cirurgia cardíaca', 'Embolia pulmonar, sepse, pneumonia'] },
      { titulo: 'Outras irregularidades', mecanismo: 'Podem parecer caóticas em amostras curtas.', itens: ['Flutter atrial com condução variável', 'Extrassístoles atriais ou ventriculares frequentes', 'Taquicardia atrial multifocal (DPOC descompensada)'] },
    ],
    desempenho: [
      { alvo: 'Fibrilação atrial ao ECG', sensibilidade: '~94%', especificidade: '~72%', razaoPositiva: '~3,4', razaoNegativa: '~0,1', leitura: 'Pulso regular quase exclui fibrilação; pulso irregular pede ECG, porque um quarto dos irregulares tem outra arritmia.', fonte: 'Cooke G et al. Is pulse palpation helpful in detecting atrial fibrillation? J Fam Pract, 2006.' },
    ],
    ilustracao: { id: 'pulso', params: { achado: 'irregular', valor: 60 }, alt: 'Traçado de pulso com intervalos e amplitudes variáveis sem padrão' },
    patologias: ['fibrilacao-atrial'],
    referencias: ['Hindricks G et al. 2020 ESC Guidelines for the diagnosis and management of atrial fibrillation. Eur Heart J, 2021.', 'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.'],
  },
  {
    slug: 'pulso-paradoxal',
    nome: 'Pulso paradoxal',
    sinonimos: ['Sinal de Kussmaul do pulso', 'Queda inspiratória exagerada da pressão sistólica'],
    sistema: 'cardiovascular',
    resumo: 'O pulso que enfraquece a cada inspiração — o exagero de um fenômeno normal, e o sinal físico mais confiável do tamponamento.',
    definicao:
      'Queda da pressão arterial sistólica maior que 10 mmHg durante a inspiração tranquila. Não é um paradoxo: o normal é cair até 10; o sinal é o exagero. Clinicamente, o pulso radial some ou enfraquece de modo perceptível a cada inspiração. Mede-se com o esfigmomanômetro, e o número é o que define.',
    comoProcurar: [
      { passo: 'Insufle o manguito acima da sistólica e desinfle devagar, 2 mmHg por segundo.', detalhe: 'Mais rápido que isso e a diferença de 10 mmHg passa entre dois batimentos.' },
      { passo: 'Anote a pressão em que os sons de Korotkoff aparecem só na expiração.', detalhe: 'É o primeiro ponto: batimentos audíveis intermitentes, sincronizados com a expiração.' },
      { passo: 'Continue e anote a pressão em que os sons aparecem em todos os batimentos.', detalhe: 'A diferença entre os dois pontos é o pulso paradoxal. Acima de 10 mmHg é positivo; acima de 20, quase certamente tamponamento ou crise asmática grave.' },
      { passo: 'Peça respiração tranquila, não profunda.', detalhe: 'Respiração forçada aumenta a queda em qualquer pessoa e cria falso positivo.' },
    ],
    mecanismo:
      'Na inspiração, a pressão intratorácica negativa puxa sangue para o átrio direito; o ventrículo direito se enche mais e o septo se desloca para a esquerda, reduzindo um pouco o enchimento do esquerdo. Com o pericárdio livre, o VD acomoda o volume expandindo para fora e o efeito no VE é pequeno — a queda normal de até 10 mmHg. No tamponamento, o pericárdio rígido e cheio não deixa o VD expandir para fora: todo o volume inspiratório extra empurra o septo para dentro do VE, que ejeta menos naquele batimento. A pressão cai porque os dois ventrículos passam a competir pelo mesmo espaço. Na asma grave, o mecanismo é a oscilação extrema da pressão intratorácica, que faz o mesmo com o retorno venoso.',
    significado:
      'Em paciente com derrame pericárdico, pulso paradoxal > 10 mmHg é o sinal físico com melhor razão de verossimilhança para tamponamento — e, com hipotensão, turgência jugular e taquicardia, exige pericardiocentese, não mais exames. Na asma e na DPOC descompensadas, quantifica a gravidade: acima de 20 mmHg é crise grave. Também aparece em embolia pulmonar maciça, choque hipovolêmico e pericardite constritiva (raramente).',
    armadilhas: [
      'Não confundir com o pulso alternante (amplitude alterna a cada batimento, independentemente da respiração — insuficiência ventricular grave).',
      'Ausência de pulso paradoxal não exclui tamponamento: comunicação interatrial, insuficiência aórtica grave e hipertrofia do VE o abolem.',
      'Fibrilação atrial torna a medida difícil; use o ecocardiograma.',
      'Respiração profunda ou irregular cria o sinal em pessoa sadia.',
    ],
    causas: [
      { titulo: 'Pericárdio', mecanismo: 'Interdependência ventricular exagerada por pressão pericárdica.', itens: ['Tamponamento cardíaco', 'Pericardite constritiva (menos comum)', 'Derrame pericárdico volumoso com repercussão'] },
      { titulo: 'Pulmão', mecanismo: 'Oscilação extrema da pressão intratorácica.', itens: ['Crise asmática grave', 'DPOC exacerbada', 'Embolia pulmonar maciça', 'Pneumotórax hipertensivo'] },
      { titulo: 'Outras', mecanismo: 'Redução de volume ou obstrução ao enchimento.', itens: ['Choque hipovolêmico', 'Obesidade mórbida', 'Gestação avançada'] },
    ],
    desempenho: [
      { alvo: 'Tamponamento em paciente com derrame pericárdico (queda > 10 mmHg)', sensibilidade: '~82%', razaoPositiva: '3,3', razaoNegativa: '0,03', leitura: 'Em quem tem derrame, a ausência do sinal quase exclui tamponamento; a presença aumenta bastante a probabilidade — e com queda > 12 mmHg a razão positiva sobe para ~6.', fonte: 'Roy CL et al. Does this patient with a pericardial effusion have cardiac tamponade? JAMA, 2007.' },
    ],
    ilustracao: { id: 'pulso', params: { achado: 'paradoxal', valor: 15 }, alt: 'Traçado de pulso com amplitude que diminui durante a inspiração' },
    patologias: ['tamponamento-cardiaco'],
    referencias: ['Roy CL et al. Does this patient with a pericardial effusion have cardiac tamponade? JAMA, 2007.', 'Bilchick KC, Wise RA. Paradoxical physical findings described by Kussmaul: pulsus paradoxus and Kussmaul’s sign. Lancet, 2002.'],
  },
  {
    slug: 'refluxo-hepatojugular',
    nome: 'Refluxo hepatojugular positivo',
    sinonimos: ['Refluxo abdominojugular', 'Teste de compressão abdominal'],
    sistema: 'cardiovascular',
    resumo: 'Aperta-se o abdome e a coluna jugular sobe — e fica lá. É o ventrículo direito dizendo que não aguenta mais um mililitro.',
    definicao:
      'Elevação sustentada da pressão venosa jugular (≥ 3 cm, ou ≥ 4 cmH₂O) durante 10 a 15 segundos de compressão firme do abdome, que se mantém enquanto a compressão dura e cai abruptamente quando ela cessa. No normal, a coluna sobe por um ou dois batimentos e volta ao nível anterior mesmo com a mão ainda comprimindo.',
    comoProcurar: [
      { passo: 'Posicione o paciente a 30 a 45° e localize o topo da coluna jugular interna.', detalhe: 'Se não vê o topo, o sinal não pode ser medido. Ajuste a inclinação até encontrá-lo.' },
      { passo: 'Comprima o abdome médio (ou o quadrante superior direito) com a palma, com força constante, por 10 a 15 segundos.', detalhe: 'Pressão de cerca de 20 a 35 mmHg — o suficiente para incomodar, não para doer. Peça que continue respirando normalmente.' },
      { passo: 'Observe a coluna durante toda a compressão.', detalhe: 'Subir e ficar é positivo. Subir e voltar em segundos, apesar da mão, é negativo.' },
      { passo: 'Solte de uma vez e veja a queda.', detalhe: 'A queda brusca ao soltar confirma que a coluna que subiu era pressão venosa, e não Valsalva do paciente.' },
    ],
    mecanismo:
      'A compressão do abdome espreme o sangue do leito esplâncnico e hepático para a cava inferior — um bolus de volume para o átrio direito. O coração direito normal aceita esse volume e o bombeia adiante em poucos batimentos; a pressão venosa sobe e cai. Quando o ventrículo direito está cheio ao limite da sua complacência (congestão, disfunção, sobrecarga de pressão), ele não tem para onde acomodar o extra, e a pressão a montante — a coluna jugular — sobe e permanece elevada enquanto a mão empurra. O sinal é a incapacidade de acomodar volume, e é por isso que ele também aparece na constrição e no tamponamento.',
    significado:
      'É o sinal de congestão que mais ajuda quando a jugular basal é duvidosa: torna visível uma pressão de enchimento elevada que ainda não subiu o bastante para ser vista em repouso. Em dispneia aguda, refluxo positivo aponta insuficiência cardíaca como causa e se correlaciona com pressão capilar pulmonar elevada. Muda a conduta: diurético, e cautela com volume. Refluxo negativo com jugular baixa em paciente hipotenso apoia hipovolemia.',
    armadilhas: [
      'Paciente que prende a respiração ou faz Valsalva durante a compressão sobe a jugular sem doença. Peça respiração normal.',
      'Compressão fraca ou curta dá falso negativo. São 10 a 15 segundos de pressão firme.',
      'Se o topo da coluna não é visível, o exame não foi feito.',
      'Insuficiência tricúspide isolada positiva o sinal sem que haja congestão esquerda.',
    ],
    causas: [
      { titulo: 'Coração direito que não acomoda volume', mecanismo: 'Complacência do VD esgotada.', itens: ['Insuficiência cardíaca (esquerda com repercussão direita, ou direita)', 'Cor pulmonale', 'Infarto de VD', 'Insuficiência tricúspide'] },
      { titulo: 'Restrição externa', mecanismo: 'O pericárdio impede a expansão.', itens: ['Pericardite constritiva', 'Tamponamento'] },
    ],
    desempenho: [
      { alvo: 'Pressão capilar pulmonar ≥ 15 mmHg (congestão esquerda)', sensibilidade: '~55–84%', especificidade: '~83–98%', razaoPositiva: '~6', razaoNegativa: '~0,3', leitura: 'Positivo, aponta congestão com boa segurança; negativo não exclui.', fonte: 'Wiese J. The abdominojugular reflux sign. Am J Med, 2000; McGee S, Evidence-Based Physical Diagnosis.' },
    ],
    ilustracao: { id: 'jugular', params: { altura: 12 }, alt: 'Pescoço com a coluna jugular elevada durante a compressão abdominal' },
    patologias: ['insuficiencia-cardiaca'],
    referencias: ['Wiese J. The abdominojugular reflux sign. Am J Med, 2000.', 'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.'],
  },
  {
    slug: 'sopro-de-estenose-aortica',
    nome: 'Sopro sistólico de estenose aórtica',
    sinonimos: ['Sopro ejetivo aórtico', 'Sopro em diamante', 'Sopro crescendo-decrescendo'],
    sistema: 'cardiovascular',
    resumo: 'Áspero, em losango, no foco aórtico e subindo pelas carótidas — o sopro que envelhece com o paciente e mata quando ignorado.',
    definicao:
      'Sopro mesossistólico de ejeção, rude, que começa após B1, cresce até o meio da sístole e decresce antes de B2 (crescendo-decrescendo), mais audível no segundo espaço intercostal direito, irradiando para as carótidas. Graduado de 1 a 6 (Levine): 1 só com atenção, 3 alto sem frêmito, 4 com frêmito, 6 audível sem o estetoscópio encostar. Os sinais de gravidade são outros: pico tardio, B2 abafada ou única, pulso parvus et tardus.',
    comoProcurar: [
      { passo: 'Ausculte o foco aórtico com o diafragma, paciente sentado e inclinado para a frente, em apneia expiratória.', detalhe: 'Aproxima a base do coração da parede; sopros aórticos leves só aparecem assim.' },
      { passo: 'Siga o sopro até as carótidas.', detalhe: 'Irradiação para o pescoço é o que o separa do sopro mitral. Ausculte as carótidas com o paciente em apneia.' },
      { passo: 'Ouça o momento do pico e a B2.', detalhe: 'Pico no fim da sístole e B2 aórtica abafada ou ausente indicam válvula calcificada e estenose grave. Pico precoce com B2 nítida sugere esclerose sem estenose.' },
      { passo: 'Palpe a carótida enquanto ausculta.', detalhe: 'Ascensão lenta e amplitude pequena (parvus et tardus) é sinal de gravidade — e some no idoso com artérias rígidas.' },
    ],
    mecanismo:
      'O ventrículo esquerdo ejeta através de um orifício estreito e o fluxo turbulento vibra as estruturas ao redor. A intensidade acompanha o fluxo: cresce à medida que a ejeção acelera, atinge o máximo quando o gradiente é maior e decresce quando o fluxo cai — daí o losango. Quanto mais grave a estenose, mais tempo o ventrículo leva para atingir o pico de fluxo, e o pico do sopro se desloca para o fim da sístole. O sopro é ejetivo, portanto separado de B1 (a valva mitral já fechou quando a ejeção começa) e termina antes de B2. A calcificação que imobiliza a válvula abafa o componente aórtico de B2.',
    significado:
      'Estenose aórtica grave sintomática (angina, síncope, dispneia) tem sobrevida de 2 a 3 anos sem troca valvar — e o sopro é o único aviso em quem ainda não sintomatizou. Achar o sopro pede ecocardiograma para graduar; a intensidade do sopro não mede gravidade, mas o pico tardio, a B2 abafada e o pulso lento sim. Muda a conduta em outra direção também: vasodilatadores e hipovolemia são mal tolerados; a anestesia precisa saber.',
    armadilhas: [
      'Intensidade não é gravidade: a estenose crítica com débito baixo pode ter sopro suave.',
      'Sopro ejetivo aórtico sem irradiação, pico precoce e B2 normal no idoso costuma ser esclerose aórtica — comum, benigna, mas com risco cardiovascular associado.',
      'Fenômeno de Gallavardin: o componente musical do sopro pode irradiar para o ápice e simular insuficiência mitral.',
      'Cardiomiopatia hipertrófica obstrutiva dá sopro parecido, mas que aumenta com Valsalva e ao ficar em pé; o da estenose aórtica diminui.',
    ],
    causas: [
      { titulo: 'Estenose aórtica valvar', mecanismo: 'Orifício estreito com fluxo turbulento.', itens: ['Degeneração calcífica do idoso', 'Valva bicúspide (apresentação mais precoce)', 'Reumática (com acometimento mitral associado)'] },
      { titulo: 'Sopros ejetivos que imitam', mecanismo: 'Fluxo aumentado ou obstrução em outro nível.', itens: ['Esclerose aórtica sem estenose', 'Cardiomiopatia hipertrófica obstrutiva', 'Estado hiperdinâmico (anemia, febre, gestação)', 'Estenose pulmonar (foco pulmonar, sem irradiação carotídea)'] },
    ],
    desempenho: [
      { alvo: 'Estenose aórtica grave', razaoPositiva: 'pico tardio ~3,9 · B2 reduzida ~3,6 · pulso lento ~3,0', razaoNegativa: 'ausência de irradiação para a carótida direita ~0,1', leitura: 'O que gradua não é o volume do sopro: é o tempo do pico, a B2 e o pulso. Sopro sem irradiação para as carótidas quase exclui estenose grave.', fonte: 'Etchells E et al. Does this patient have an abnormal systolic murmur? JAMA, 1997.' },
    ],
    ilustracao: { id: 'fonocardiograma', params: { tipo: 'sopro-ejecao', intensidade: 3 }, alt: 'Fonocardiograma com sopro em losango entre B1 e B2' },
    patologias: ['estenose-aortica'],
    referencias: ['Etchells E et al. Does this patient have an abnormal systolic murmur? JAMA, 1997.', 'Otto CM et al. 2020 ACC/AHA Guideline for the Management of Patients With Valvular Heart Disease.'],
  },
  {
    slug: 'sopro-de-insuficiencia-mitral',
    nome: 'Sopro holossistólico de insuficiência mitral',
    sinonimos: ['Sopro de regurgitação mitral', 'Sopro pansistólico apical'],
    sistema: 'cardiovascular',
    resumo: 'Do primeiro ao segundo som, sem subir nem descer, no ápice e correndo para a axila — o sangue voltando para o átrio durante a sístole inteira.',
    definicao:
      'Sopro que ocupa toda a sístole, começando com B1 (ou encobrindo-a) e terminando em B2 ou além dela, de intensidade constante ("em platô"), suave ou em jato de vapor, mais audível no ápice e irradiando para a axila e o dorso. Diferente do ejetivo, não tem intervalo entre B1 e o início, nem forma de losango.',
    comoProcurar: [
      { passo: 'Ausculte o ápice com o diafragma, paciente em decúbito lateral esquerdo.', detalhe: 'Aproxima o ápice da parede e aumenta os sopros mitrais.' },
      { passo: 'Siga o sopro para a axila e para o dorso.', detalhe: 'Irradiação para a axila é a assinatura mitral; para a base e carótidas seria aórtica.' },
      { passo: 'Compare com B1: o sopro começa junto?', detalhe: 'Holossistólico cola em B1. Sopro que começa depois de B1, com um intervalo, é ejetivo.' },
      { passo: 'Procure B3 e o ictus deslocado.', detalhe: 'B3 apical e ictus difuso e desviado indicam sobrecarga de volume e regurgitação significativa.' },
    ],
    mecanismo:
      'A valva mitral incompetente deixa sangue voltar do ventrículo para o átrio esquerdo desde o início da contração — a pressão do VE supera a do átrio já no começo da sístole isovolumétrica, antes mesmo da aórtica abrir, e continua superior até depois de B2. Por isso o sopro começa com B1 e atravessa B2. O gradiente VE–AE é grande e relativamente constante ao longo da sístole, e a intensidade não varia: o platô é o retrato de um gradiente estável. O átrio recebe volume extra, dilata, e o ventrículo, que precisa ejetar esse volume a mais na diástole seguinte, dilata também — daí B3 e ictus deslocado.',
    significado:
      'Insuficiência mitral pode ser crônica e bem tolerada por anos ou aguda e catastrófica (ruptura de cordoalha, disfunção de papilar no infarto, endocardite). O sopro novo em paciente com infarto ou febre é emergência. Na crônica, a intensidade se correlaciona razoavelmente com a gravidade — ao contrário da estenose aórtica —, e sopro ≥ 3/6 com B3 e ictus deslocado pede ecocardiograma e discussão de cirurgia antes que o ventrículo se perca. Também explica fibrilação atrial e insuficiência cardíaca "sem causa".',
    armadilhas: [
      'Na insuficiência mitral aguda o sopro pode ser curto e suave — o átrio pequeno e não complacente iguala pressões rápido. A gravidade está no edema pulmonar, não no sopro.',
      'Insuficiência tricúspide também é holossistólica, mas na borda esternal esquerda baixa e aumenta na inspiração (sinal de Carvallo).',
      'Comunicação interventricular é holossistólica e rude na borda esternal, com frêmito, sem irradiação axilar.',
      'Prolapso mitral dá clique mesossistólico com sopro tardio, não holossistólico — a não ser quando já há regurgitação importante.',
    ],
    causas: [
      { titulo: 'Insuficiência mitral primária (a válvula)', mecanismo: 'Folhetos, cordas ou anel doentes.', itens: ['Degeneração mixomatosa e prolapso', 'Reumática', 'Endocardite', 'Ruptura de cordoalha', 'Calcificação anular'] },
      { titulo: 'Insuficiência mitral secundária (o ventrículo)', mecanismo: 'Válvula normal em ventrículo dilatado ou isquêmico que a impede de coaptar.', itens: ['Cardiomiopatia dilatada', 'Infarto com disfunção de papilar', 'Insuficiência cardíaca avançada'] },
    ],
    desempenho: [
      { alvo: 'Insuficiência mitral moderada a grave', razaoPositiva: 'sopro ≥ 3/6 ~4 · B3 apical ~2,4', razaoNegativa: 'ausência de sopro apical holossistólico ~0,2', leitura: 'Aqui a intensidade ajuda: sopro forte com B3 aponta regurgitação importante.', fonte: 'Etchells E et al. JAMA, 1997; McGee S, Evidence-Based Physical Diagnosis.' },
    ],
    ilustracao: { id: 'fonocardiograma', params: { tipo: 'sopro-holossistolico', intensidade: 4 }, alt: 'Fonocardiograma com sopro em platô ocupando toda a sístole' },
    patologias: ['insuficiencia-mitral'],
    referencias: ['Etchells E et al. Does this patient have an abnormal systolic murmur? JAMA, 1997.', 'Otto CM et al. 2020 ACC/AHA Valvular Heart Disease Guideline.'],
  },
  {
    slug: 'terceira-bulha',
    nome: 'Terceira bulha (B3)',
    sinonimos: ['Galope ventricular', 'Galope protodiastólico', 'Ritmo de galope por B3'],
    sistema: 'cardiovascular',
    resumo: 'Um som grave e surdo logo depois de B2, como uma sílaba a mais — "Ken-TU-cky". No adulto, é o ventrículo sobrecarregado de volume que se enche depressa demais.',
    definicao:
      'Som de baixa frequência, breve, 120 a 180 ms após B2, no início da diástole (fase de enchimento rápido), mais audível com a campânula no ápice, em decúbito lateral esquerdo, na expiração. Fisiológico em crianças, adolescentes, gestantes e atletas; patológico a partir dos 40 anos, quando indica disfunção ventricular ou sobrecarga de volume.',
    comoProcurar: [
      { passo: 'Use a campânula, apoiada de leve, no ápice.', detalhe: 'B3 é grave; o diafragma e a pressão excessiva a filtram. Encoste sem apertar.' },
      { passo: 'Decúbito lateral esquerdo, apneia expiratória.', detalhe: 'Aproxima o ápice e elimina o ruído respiratório.' },
      { passo: 'Cadencie: B1 — B2 — bulha extra. É depois de B2.', detalhe: 'O ritmo lembra "Ken-TU-cky" (B3) contra "TEN-nes-see" (B4). Sentir o pulso carotídeo ajuda a saber onde está a sístole.' },
      { passo: 'Diferencie de B2 desdobrada e de estalido de abertura.', detalhe: 'O desdobramento é agudo e colado em B2; o estalido mitral é agudo e alto; B3 é surda, grave e mais tardia.' },
    ],
    mecanismo:
      'Na fase de enchimento rápido, o sangue entra no ventrículo e desacelera bruscamente quando encontra a parede. Se o ventrículo é complacente e o volume normal, a desaceleração é suave e silenciosa. Quando o volume que entra é grande (regurgitação, shunt) ou o ventrículo está dilatado e rígido no fim do enchimento (insuficiência cardíaca sistólica), a coluna de sangue freia contra uma parede que já não cede, e a vibração resultante é a B3. É um som de parede, não de válvula — por isso é grave e por isso desaparece quando se trata a congestão.',
    significado:
      'No adulto, B3 é o sinal físico mais específico de disfunção sistólica e de pressão de enchimento elevada, com valor prognóstico independente: prediz hospitalização e morte na insuficiência cardíaca e complicações em cirurgia não cardíaca. Em dispneia aguda, B3 desloca fortemente para insuficiência cardíaca. Muda a conduta imediata (diurético) e a de longo prazo (o paciente com B3 tem doença estrutural até prova em contrário — ecocardiograma).',
    armadilhas: [
      'Em menores de 40 anos, gestantes e atletas, B3 é normal. O contexto decide.',
      'Sensibilidade baixa: a maioria dos pacientes com insuficiência cardíaca não tem B3 audível. Ausência não tranquiliza.',
      'Difícil em obesos, enfisematosos e taquicárdicos — na taquicardia, B3 e B4 se fundem no galope de soma.',
      'Concordância entre examinadores é modesta; quem ouviu com a campânula em decúbito lateral tem mais razão do que quem ouviu de pé com o diafragma.',
    ],
    causas: [
      { titulo: 'Disfunção sistólica e sobrecarga de volume', mecanismo: 'Ventrículo dilatado, rígido no fim do enchimento.', itens: ['Insuficiência cardíaca com fração de ejeção reduzida', 'Insuficiência mitral ou aórtica importantes', 'Cardiomiopatia dilatada', 'Shunts esquerda-direita'] },
      { titulo: 'Fisiológica', mecanismo: 'Enchimento rápido e vigoroso de um ventrículo jovem.', itens: ['Crianças e adolescentes', 'Gestação', 'Atletas', 'Estados hipercinéticos (febre, anemia, hipertireoidismo)'] },
    ],
    desempenho: [
      { alvo: 'Insuficiência cardíaca em dispneia aguda', sensibilidade: '~13%', especificidade: '~99%', razaoPositiva: '~11', leitura: 'Quando presente, quase fecha o diagnóstico; ausente, não diz nada.', fonte: 'Wang CS et al. Does this dyspneic patient in the emergency department have congestive heart failure? JAMA, 2005.' },
    ],
    ilustracao: { id: 'fonocardiograma', params: { tipo: 'b3', intensidade: 2 }, alt: 'Fonocardiograma com uma bulha extra grave logo após B2' },
    patologias: ['insuficiencia-cardiaca'],
    referencias: ['Wang CS et al. JAMA, 2005.', 'Drazner MH et al. Prognostic importance of elevated jugular venous pressure and a third heart sound in patients with heart failure. N Engl J Med, 2001.'],
  },
  {
    slug: 'quarta-bulha',
    nome: 'Quarta bulha (B4)',
    sinonimos: ['Galope atrial', 'Galope pré-sistólico', 'Ritmo de galope por B4'],
    sistema: 'cardiovascular',
    resumo: 'Um som surdo logo antes de B1 — "TEN-nes-see". É o átrio empurrando sangue para dentro de um ventrículo que não relaxa.',
    definicao:
      'Som grave, breve, no fim da diástole, imediatamente antes de B1, coincidindo com a contração atrial. Mais audível com a campânula no ápice (B4 esquerda) ou na borda esternal esquerda baixa (B4 direita, que aumenta na inspiração). Nunca é fisiológica no adulto jovem em repouso, e por definição não existe na fibrilação atrial, que não tem contração atrial.',
    comoProcurar: [
      { passo: 'Campânula leve no ápice, decúbito lateral esquerdo.', detalhe: 'Mesma técnica da B3: som grave, pressão mínima.' },
      { passo: 'Cadencie: bulha extra — B1 — B2. É antes de B1.', detalhe: '"TEN-nes-see": a sílaba extra vem primeiro. Sentir a carótida localiza B1.' },
      { passo: 'Peça para o paciente fazer um esforço isométrico (apertar as mãos).', detalhe: 'Aumenta a pós-carga e a B4 esquerda fica mais audível.' },
      { passo: 'Diferencie de B1 desdobrada.', detalhe: 'O desdobramento de B1 é agudo e audível com o diafragma; B4 é grave e some com a pressão da campânula.' },
    ],
    mecanismo:
      'No fim da diástole, o átrio contrai e injeta os últimos 20 a 30% do volume no ventrículo. Num ventrículo complacente, esse volume entra sem resistência e em silêncio. Quando a parede está rígida — hipertrofia pela hipertensão ou estenose aórtica, isquemia aguda, fibrose, infiltração —, o átrio precisa contrair com força contra uma câmara que não cede, e a chegada abrupta do sangue vibra a parede rígida: a B4. É a assinatura da disfunção diastólica, e o átrio que a gera é o mesmo que, dilatado com o tempo, vai fibrilar — momento em que a B4 desaparece.',
    significado:
      'B4 diz que o ventrículo está rígido, não necessariamente fraco. É comum e esperada na cardiopatia hipertensiva, na estenose aórtica, na cardiomiopatia hipertrófica e na isquemia — durante o infarto agudo, quase todos os pacientes têm B4 transitória. Em dor torácica, uma B4 nova aponta para isquemia. Muda menos a conduta imediata do que a B3, mas diz que há doença estrutural e apoia investigação de disfunção diastólica e hipertrofia.',
    armadilhas: [
      'Não existe B4 em fibrilação atrial. Se ouviu, era outra coisa.',
      'Uma B4 suave em idosos hipertensos é tão comum que perde poder discriminativo.',
      'Na taquicardia, B3 e B4 se somam num galope de quatro tempos ou de soma; desacelerar (massagem carotídea, quando seguro) as separa.',
      'B4 direita aumenta na inspiração; a esquerda, não. É o que localiza o lado.',
    ],
    causas: [
      { titulo: 'Ventrículo esquerdo rígido', mecanismo: 'Complacência reduzida por hipertrofia, isquemia ou infiltração.', itens: ['Cardiopatia hipertensiva', 'Estenose aórtica', 'Cardiomiopatia hipertrófica', 'Isquemia e infarto agudo', 'Amiloidose e outras restritivas'] },
      { titulo: 'Ventrículo direito rígido', mecanismo: 'Mesma física, à direita.', itens: ['Hipertensão pulmonar', 'Estenose pulmonar', 'Cor pulmonale'] },
    ],
    ilustracao: { id: 'fonocardiograma', params: { tipo: 'b4', intensidade: 2 }, alt: 'Fonocardiograma com uma bulha extra grave imediatamente antes de B1' },
    referencias: ['McGee S. Evidence-Based Physical Diagnosis, 5ª ed.', 'Constant J. Bedside Cardiology, 5ª ed.'],
  },
  {
    slug: 'pulsos-assimetricos',
    nome: 'Pulsos assimétricos',
    sinonimos: ['Diferença de pulsos entre os membros', 'Déficit de pulso unilateral'],
    sistema: 'cardiovascular',
    resumo: 'O pulso que existe de um lado e falta do outro — a dissecção da aorta e a oclusão arterial contadas pela mão.',
    definicao:
      'Diferença perceptível de amplitude entre pulsos homólogos (radial, femoral, pedioso) ou entre membros superiores e inferiores, ou diferença de pressão sistólica > 15 a 20 mmHg entre os braços. Inclui a ausência unilateral de um pulso que deveria estar presente. Assimetria é comparação: o sinal só existe se os dois lados foram examinados.',
    comoProcurar: [
      { passo: 'Palpe os pulsos homólogos ao mesmo tempo, um em cada mão.', detalhe: 'Radiais, depois femorais, depois pediosos. A comparação simultânea é mais sensível que a sequencial.' },
      { passo: 'Meça a pressão nos dois braços.', detalhe: 'Diferença > 15 mmHg é anormal; > 20 mmHg em dor torácica aguda é dissecção até prova em contrário.' },
      { passo: 'Compare braço com perna: pulso femoral atrasado ou fraco em relação ao radial é coartação.', detalhe: 'No jovem hipertenso, é o exame de 10 segundos que ninguém faz.' },
      { passo: 'Se um pulso falta, use o Doppler portátil.', detalhe: 'Separa ausência real de dificuldade de palpação — edema, obesidade, hipotensão.' },
    ],
    mecanismo:
      'O pulso é a onda de pressão que percorre a árvore arterial; qualquer obstrução ou desvio entre a aorta e o ponto palpado a atenua ou atrasa. Na dissecção, a falsa luz comprime a verdadeira e pode ocluir os óstios dos troncos supra-aórticos ou das ilíacas — e o pulso some ou enfraquece do lado acometido, às vezes de forma intermitente conforme a lâmina se move. Na oclusão embólica ou trombótica aguda, o pulso desaparece distal ao êmbolo. Na coartação, a onda que chega às pernas é menor e atrasada porque atravessou um estreitamento. Na doença arterial crônica, colaterais mantêm um pulso fraco e tardio.',
    significado:
      'Em dor torácica ou dorsal aguda, pulsos assimétricos ou déficit de pulso é o sinal físico com maior razão de verossimilhança para dissecção de aorta — muda a urgência de "descartar infarto" para angiotomografia imediata e controle rígido de pressão e frequência. Em dor de membro aguda, pulso ausente com membro frio é isquemia aguda: embolectomia ou trombólise contam em horas. No hipertenso jovem, o atraso femoral é coartação. Na rotina, a assimetria de braços prediz risco cardiovascular e doença arterial subclávia.',
    armadilhas: [
      'Só se percebe assimetria examinando os dois lados; o exame unilateral é o erro mais comum.',
      'Pulso pedioso está ausente congenitamente em até 10% das pessoas — compare com o tibial posterior antes de concluir.',
      'A maioria das dissecções não tem déficit de pulso: o sinal é específico, não sensível.',
      'Diferença de pressão entre os braços em paciente assintomático costuma ser estenose de subclávia; investigue, mas não é emergência.',
    ],
    causas: [
      { titulo: 'Aguda — emergência', mecanismo: 'Oclusão ou compressão súbita da luz arterial.', itens: ['Dissecção de aorta', 'Embolia arterial (fibrilação atrial, trombo de VE)', 'Trombose arterial aguda sobre placa', 'Trauma vascular'] },
      { titulo: 'Crônica', mecanismo: 'Estenose fixa com colaterais.', itens: ['Doença arterial periférica aterosclerótica', 'Estenose de subclávia (roubo de subclávia)', 'Coartação da aorta', 'Arterite de Takayasu ("doença sem pulso")'] },
    ],
    desempenho: [
      { alvo: 'Dissecção aguda de aorta em dor torácica', sensibilidade: '~31%', especificidade: '~95%', razaoPositiva: '~5,7', leitura: 'Presente, é um dos achados mais fortes; ausente, não exclui — dois terços das dissecções têm pulsos simétricos.', fonte: 'Klompas M. Does this patient have an acute thoracic aortic dissection? JAMA, 2002.' },
    ],
    ilustracao: { id: 'pulso', params: { achado: 'assimetrico', valor: 70 }, alt: 'Dois traçados de pulso lado a lado, o do lado afetado com amplitude muito menor' },
    patologias: ['disseccao-de-aorta'],
    referencias: ['Klompas M. Does this patient have an acute thoracic aortic dissection? JAMA, 2002.', 'Clark CE et al. Association of a difference in systolic blood pressure between arms with vascular disease and mortality. Lancet, 2012.'],
  },
  {
    slug: 'extremidade-fria-com-pulso-reduzido',
    nome: 'Extremidade fria com pulso reduzido',
    sinonimos: ['Hipoperfusão de extremidade', 'Membro frio'],
    sistema: 'cardiovascular',
    resumo: 'A mão que está mais fria que a sua e um pulso que mal se sente — hipoperfusão, seja do membro ou do corpo inteiro.',
    definicao:
      'Extremidade com temperatura da pele nitidamente inferior à esperada e à do membro contralateral (ou às do examinador, com o dorso da mão), acompanhada de palidez ou cianose e de pulso distal diminuído ou ausente. Pode ser unilateral (oclusão arterial) ou bilateral (choque, vasoconstrição sistêmica). A temperatura da pele do pé em torno de 20 a 25 °C num ambiente aquecido é fria; 30 a 34 °C, normal.',
    comoProcurar: [
      { passo: 'Toque com o dorso da mão, comparando os dois lados e subindo do pé ao joelho.', detalhe: 'O dorso é mais sensível à temperatura que a palma. Encontre o nível em que a pele volta a esquentar: é a altura da obstrução.' },
      { passo: 'Olhe a cor com o membro na horizontal e depois elevado.', detalhe: 'Palidez à elevação e rubor tardio ao pender (teste de Buerger) indicam isquemia crônica.' },
      { passo: 'Palpe os pulsos distais e compare; se ausentes, Doppler.', detalhe: 'Pulso fraco bilateral com extremidades frias e frequência alta é choque, não doença arterial.' },
      { passo: 'Meça o enchimento capilar e teste sensibilidade e motricidade.', detalhe: 'Enchimento > 3 s reforça hipoperfusão; perda de sensibilidade ou de movimento no membro frio é isquemia com prazo.' },
    ],
    mecanismo:
      'A pele é aquecida pelo sangue que passa por ela. Quando o fluxo cai — por obstrução arterial proximal ou por vasoconstrição sistêmica do choque, que desvia sangue da pele para órgãos nobres —, a extremidade perde calor para o ambiente e não o repõe. A palidez é a ausência de sangue nos capilares; a cianose vem quando o pouco sangue que chega fica tempo demais e é totalmente dessaturado; o pulso enfraquece porque a onda de pressão foi amortecida pela obstrução ou porque o volume sistólico caiu. No choque, é o primeiro sinal de que a perfusão periférica foi sacrificada — aparece antes da hipotensão.',
    significado:
      'Unilateral e agudo, é isquemia de membro: emergência vascular com janela de 6 horas. Bilateral, é choque com vasoconstrição (hipovolêmico, cardiogênico, obstrutivo) até prova em contrário — e distingue do choque distributivo inicial, em que as extremidades estão quentes. Na insuficiência cardíaca, extremidades frias definem o perfil "frio" que precisa de inotrópico, não só de diurético. Muda a conduta em horas nos dois cenários.',
    armadilhas: [
      'Ambiente frio e ansiedade esfriam as mãos de qualquer pessoa. Compare com o tronco e reexamine aquecido.',
      'Fenômeno de Raynaud dá extremidades frias, pálidas e cianóticas com pulsos normais — é vasoespasmo, não obstrução.',
      'Choque séptico começa com extremidades quentes; esfriam quando o débito cai. Frio tardio na sepse é sinal de piora.',
      'Neuropatia diabética dá pé quente e seco com pulsos presentes; a úlcera nesse pé é neuropática, não isquêmica.',
    ],
    causas: [
      { titulo: 'Unilateral — o membro', mecanismo: 'Obstrução arterial.', itens: ['Isquemia aguda por embolia ou trombose', 'Doença arterial periférica crítica', 'Dissecção de aorta com extensão a uma ilíaca', 'Síndrome compartimental (tardio)'] },
      { titulo: 'Bilateral — o corpo', mecanismo: 'Vasoconstrição para preservar órgãos nobres.', itens: ['Choque hipovolêmico e hemorrágico', 'Choque cardiogênico', 'Tamponamento e embolia pulmonar', 'Sepse em fase tardia', 'Hipotermia'] },
    ],
    ilustracao: { id: 'membro-inferior', params: { achado: 'frio', valor: 26 }, alt: 'Perna pálida com termômetro marcando a pele fria' },
    patologias: ['choque-hipovolemico', 'isquemia-aguda-de-membro'],
    referencias: ['Nohria A et al. Clinical assessment identifies hemodynamic profiles that predict outcomes in patients admitted with heart failure. J Am Coll Cardiol, 2003.', 'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.'],
  },

  // ─── Respiratório ─────────────────────────────────────────────────────────

  {
    slug: 'estridor-inspiratorio',
    nome: 'Estridor inspiratório',
    sinonimos: ['Estridor', 'Cornagem'],
    sistema: 'respiratorio',
    resumo: 'Um som áspero e agudo que entra com o ar, ouvido sem estetoscópio — a via aérea superior avisando que está fechando.',
    definicao:
      'Ruído respiratório de alta frequência, monofônico, áspero, produzido por fluxo turbulento numa via aérea extratorácica estreitada — laringe, traqueia cervical, faringe —, predominante ou exclusivo na inspiração, audível à distância. Estridor expiratório ou bifásico indica obstrução intratorácica ou fixa e é mais grave. Graduação clínica: ao esforço ou choro; em repouso; bifásico com tiragem e alteração de consciência.',
    comoProcurar: [
      { passo: 'Ouça antes de tocar, e de longe.', detalhe: 'O estridor se ouve da porta. Aproximar o estetoscópio da traqueia diferencia de sibilo transmitido, mas o diagnóstico já foi feito.' },
      { passo: 'Diga em que fase ocorre.', detalhe: 'Inspiratório: obstrução acima das cordas vocais ou glótica. Bifásico: subglótica ou traqueal. Expiratório: intratorácica.' },
      { passo: 'Olhe a postura, a saliva e a cor.', detalhe: 'Criança sentada inclinada, babando, com o queixo para a frente, é epiglotite — não abra a boca dela.' },
      { passo: 'Avalie o esforço: tiragem, batimento de asa nasal, uso de acessórios.', detalhe: 'Estridor que diminui enquanto o esforço aumenta não é melhora: é fadiga.' },
    ],
    mecanismo:
      'A via aérea extratorácica tende a colapsar na inspiração, quando a pressão dentro dela fica abaixo da atmosférica. Se já está estreitada — edema, corpo estranho, massa, paralisia de cordas —, o fluxo pela fenda residual acelera, vira turbulento e vibra as paredes: som agudo, áspero, inspiratório. Como a resistência ao fluxo varia com a quarta potência do raio, uma redução de metade do calibre multiplica a resistência por dezesseis — é por isso que o estridor pode surgir e evoluir para obstrução completa em minutos, sobretudo na criança, cuja laringe tem milímetros.',
    significado:
      'Estridor é um dos poucos sinais que dispensam qualquer exame antes de agir: em repouso, é via aérea crítica. As causas são poucas e o tempo é curto: crupe, epiglotite, corpo estranho, anafilaxia, abscesso profundo, tumor ou estenose em adulto. Muda a conduta para garantir a via aérea primeiro — adrenalina inalatória e corticoide no crupe, adrenalina intramuscular na anafilaxia, intubação em ambiente controlado quando o estridor é de repouso e progressivo.',
    armadilhas: [
      'Confundir com sibilo: sibilo é polifônico, expiratório, difuso e intratorácico; estridor é monofônico, inspiratório e cervical.',
      'Estridor que "melhora" com o cansaço da criança é obstrução piorando com menos fluxo.',
      'Examinar a garganta com abaixador em suspeita de epiglotite pode fechar a via aérea.',
      'No adulto, estridor de instalação lenta é tumor ou estenose até prova em contrário — laringoscopia, não broncodilatador.',
    ],
    causas: [
      { titulo: 'Criança', mecanismo: 'Laringe pequena; edema de milímetros fecha.', itens: ['Crupe viral (laringotraqueíte)', 'Epiglotite', 'Corpo estranho', 'Abscesso retrofaríngeo', 'Anafilaxia', 'Laringomalácia (lactente, crônico)'] },
      { titulo: 'Adulto', mecanismo: 'Obstrução estrutural ou edema.', itens: ['Angioedema e anafilaxia', 'Tumor de laringe', 'Estenose subglótica pós-intubação', 'Paralisia bilateral de pregas vocais', 'Corpo estranho', 'Bócio compressivo'] },
    ],
    ilustracao: { id: 'fonocardiograma', params: { tipo: 'estridor', intensidade: 2 }, alt: 'Linha do tempo respiratória com onda áspera ocupando a inspiração' },
    referencias: ['Bjornson CL, Johnson DW. Croup in children. CMAJ, 2013.', 'Porto CC. Semiologia Médica, 8ª ed.'],
  },
  {
    slug: 'uso-de-musculatura-acessoria',
    nome: 'Uso de musculatura acessória',
    sinonimos: ['Tiragem', 'Sinais de esforço respiratório', 'Retrações'],
    sistema: 'respiratorio',
    resumo: 'Quando os esternocleidomastoideos e os intercostais aparecem a cada respiração, o diafragma já não dá conta sozinho.',
    definicao:
      'Contração visível dos músculos que normalmente não participam da respiração tranquila — esternocleidomastoideos, escalenos, intercostais, abdominais na expiração — junto com retrações (tiragem) supraclavicular, intercostal ou subcostal, batimento de asa nasal e, na criança, gemência. Costuma vir com taquipneia (> 24 irpm no adulto) e, quando grave, com respiração paradoxal (abdome que afunda na inspiração).',
    comoProcurar: [
      { passo: 'Olhe o pescoço e o tórax despidos por 30 segundos antes de encostar o estetoscópio.', detalhe: 'O esforço respiratório se vê, não se ausculta. Conte a frequência nesse tempo.' },
      { passo: 'Procure os esternocleidomastoideos saltando a cada inspiração.', detalhe: 'É o músculo acessório mais fácil de ver, e sua contração se correlaciona com obstrução grave.' },
      { passo: 'Procure retrações: fúrcula, intercostais, rebordo costal.', detalhe: 'A pressão intratorácica muito negativa suga a pele para dentro. Quanto mais alta a retração, maior o esforço.' },
      { passo: 'Ponha a mão no abdome e veja se ele sobe com a inspiração.', detalhe: 'Abdome que afunda enquanto o tórax expande é paradoxo — fadiga do diafragma, intubação próxima.' },
    ],
    mecanismo:
      'Na respiração tranquila, o diafragma faz quase todo o trabalho e os intercostais externos ajudam pouco. Quando a demanda sobe (obstrução, pulmão rígido, acidose) ou o diafragma falha (fadiga, hiperinsuflação que o achata), o centro respiratório recruta o que sobra: esternocleidomastoideos e escalenos puxam o esterno e as costelas superiores para cima; os abdominais empurram o diafragma na expiração. A pressão pleural muito negativa que esses músculos geram suga os tecidos moles para dentro — a tiragem. O sinal é literalmente o trabalho respiratório tornado visível, e a respiração paradoxal marca o momento em que o diafragma cansou.',
    significado:
      'É o sinal mais confiável de insuficiência respiratória iminente à beira do leito, mais que a saturação — que cai tarde — e mais que a gasometria, que demora. Muda a conduta para suporte imediato: oxigênio, broncodilatador, ventilação não invasiva ou intubação conforme a causa. Na asma, uso de acessórios e fala entrecortada definem crise grave. Na criança, retrações e gemência são critérios de internação. O desaparecimento do sinal com a piora da consciência não é melhora: é exaustão.',
    armadilhas: [
      'Paciente que "melhora" e para de usar acessórios enquanto fica sonolento está exaurindo. Reavalie a gasometria.',
      'Obesidade e mama volumosa escondem retrações; olhe o pescoço.',
      'Ansiedade e hiperventilação psicogênica aumentam a frequência mas raramente recrutam esternocleidomastoideos de modo sustentado.',
      'No DPOC crônico, algum uso de acessórios é basal; compare com o estado habitual do paciente.',
    ],
    causas: [
      { titulo: 'Aumento da demanda', mecanismo: 'Obstrução, rigidez ou acidose exigem mais trabalho.', itens: ['Asma e DPOC exacerbados', 'Pneumonia e SDRA', 'Edema pulmonar', 'Obstrução de via aérea superior', 'Acidose metabólica (Kussmaul)'] },
      { titulo: 'Falha da bomba', mecanismo: 'O diafragma não consegue.', itens: ['Fadiga muscular em qualquer insuficiência respiratória prolongada', 'Doença neuromuscular (Guillain-Barré, miastenia)', 'Paralisia diafragmática', 'Hiperinsuflação grave'] },
    ],
    ilustracao: { id: 'mapa-toracico', params: { achado: 'musculatura-acessoria', frequencia: 32 }, alt: 'Tórax com esternocleidomastoideos contraídos e retrações intercostais' },
    referencias: ['Tulaimat A et al. The validity and reliability of the clinical assessment of increased work of breathing in acutely ill patients. J Crit Care, 2016.', 'Global Initiative for Asthma (GINA), 2024.'],
  },
  {
    slug: 'sibilos-difusos',
    nome: 'Sibilos difusos',
    sinonimos: ['Chiado', 'Sibilância', 'Roncos e sibilos'],
    sistema: 'respiratorio',
    resumo: 'Muitos assobios de alturas diferentes, nos dois pulmões, na expiração — as vias aéreas pequenas estreitando todas de uma vez.',
    definicao:
      'Sons contínuos, musicais, de alta frequência (> 400 Hz), polifônicos (várias notas ao mesmo tempo), audíveis em ambos os hemitórax, predominando na expiração e, quando graves, também na inspiração. Diferente do sibilo monofônico localizado (uma nota, um lugar) e do estridor (inspiratório, cervical). A ausência de sibilos numa crise com esforço intenso e murmúrio quase inaudível — "tórax silencioso" — é mais grave que sibilos altos.',
    comoProcurar: [
      { passo: 'Ausculte todos os campos, na inspiração e na expiração, com o paciente respirando de boca aberta.', detalhe: 'Sibilos só expiratórios são obstrução leve a moderada; bifásicos, grave.' },
      { passo: 'Peça uma expiração forçada.', detalhe: 'Revela sibilos que a respiração tranquila esconde. Duração da expiração forçada > 6 segundos sugere obstrução.' },
      { passo: 'Diga se são polifônicos e simétricos.', detalhe: 'Várias notas nos dois lados: broncoespasmo difuso. Uma nota fixa num lugar: obstrução focal.' },
      { passo: 'Avalie o murmúrio por baixo dos sibilos.', detalhe: 'Murmúrio que some com esforço crescente é o tórax silencioso: o ar não entra o bastante para chiar.' },
    ],
    mecanismo:
      'O sibilo é produzido pela vibração das paredes de uma via aérea estreitada até quase o fechamento — como a palheta de um instrumento de sopro. A frequência depende da massa e da elasticidade da parede, não do calibre; por isso vias aéreas diferentes dão notas diferentes, e o broncoespasmo difuso, que estreita centenas delas, soa polifônico. Predomina na expiração porque as vias aéreas intratorácicas se comprimem quando a pressão pleural sobe. O estreitamento vem de três componentes que variam de doença para doença: contração do músculo liso, edema da mucosa e secreção na luz.',
    significado:
      'Sibilos difusos são a assinatura da asma e da DPOC exacerbada, e respondem ao broncodilatador em minutos — a resposta em si é diagnóstica. Mas "nem tudo que chia é asma": insuficiência cardíaca (asma cardíaca), anafilaxia, aspiração e bronquiolite também chiam, e cada um tem outro tratamento. O sinal muda a conduta para broncodilatador e corticoide na asma e na DPOC, e a gravidade se mede pelo esforço, pela fala e pela saturação, não pelo volume do chiado.',
    armadilhas: [
      'Tórax silencioso com esforço máximo é a crise mais grave, não a mais leve.',
      'Sibilos em idoso com dispneia aguda, estertores e jugular alta são edema pulmonar, não asma. O broncodilatador não vai resolver.',
      'Sibilo unilateral fixo não é asma: é corpo estranho, tumor ou tampão.',
      'Ausência de sibilos entre crises não exclui asma; o diagnóstico é funcional (espirometria), não auscultatório.',
    ],
    causas: [
      { titulo: 'Broncoespasmo difuso', mecanismo: 'Contração de músculo liso, edema e muco em muitas vias aéreas.', itens: ['Asma', 'DPOC exacerbada', 'Bronquiolite viral (lactente)', 'Anafilaxia', 'Aspiração e inalação de irritantes'] },
      { titulo: 'Chiado que não é broncoespasmo primário', mecanismo: 'Edema peribrônquico ou compressão.', itens: ['Insuficiência cardíaca ("asma cardíaca")', 'Embolia pulmonar (raro)', 'Disfunção de cordas vocais (inspiratório, simula asma refratária)'] },
    ],
    ilustracao: { id: 'fonocardiograma', params: { tipo: 'sibilos', intensidade: 2 }, alt: 'Linha do tempo respiratória com ondas musicais de várias frequências na expiração' },
    patologias: ['asma', 'dpoc'],
    referencias: ['Bohadana A, Izbicki G, Kraman SS. Fundamentals of lung auscultation. N Engl J Med, 2014.', 'Global Initiative for Asthma (GINA), 2024.'],
  },
  {
    slug: 'sibilo-monofonico-localizado',
    nome: 'Sibilo monofônico localizado',
    sinonimos: ['Sibilo fixo', 'Sibilo unilateral', 'Wheeze focal'],
    sistema: 'respiratorio',
    resumo: 'Um único assobio, sempre na mesma nota e no mesmo lugar — um brônquio, uma obstrução, uma causa que não é asma.',
    definicao:
      'Som contínuo, musical, de frequência única e constante, audível numa região delimitada do tórax e que não muda de nota nem de local entre respirações. Pode ser inspiratório, expiratório ou bifásico. O oposto dos sibilos difusos: uma via aérea, não centenas.',
    comoProcurar: [
      { passo: 'Ausculte campo a campo, comparando os lados.', detalhe: 'O sibilo focal se ouve num ponto e some poucos centímetros ao lado.' },
      { passo: 'Reausculte após tosse e após broncodilatador.', detalhe: 'Muco se move e muda; obstrução fixa não. Broncodilatador não altera o sibilo de um tumor.' },
      { passo: 'Diga a nota: é sempre a mesma?', detalhe: 'Monofônico significa uma frequência constante. Se muda de altura, são várias vias aéreas.' },
      { passo: 'Procure o resto: murmúrio reduzido distal, atelectasia, hemoptise, emagrecimento.', detalhe: 'O sibilo fixo é o começo da história; a obstrução por trás é o diagnóstico.' },
    ],
    mecanismo:
      'Uma única via aérea, estreitada a ponto de vibrar, produz uma única nota — determinada pela massa e pela tensão da sua parede. Como o estreitamento é fixo (massa, corpo estranho, estenose), a nota não muda entre respirações nem responde ao broncodilatador, que age no músculo liso de vias que aqui não estão contraídas. Se a obstrução for de um brônquio-fonte, o som pode ser transmitido e parecer difuso, mas continua monofônico. Muco parcialmente obstrutivo também produz sibilo focal, mas move-se com a tosse e muda de lugar.',
    significado:
      'Sibilo monofônico fixo é obstrução endobrônquica até prova em contrário: tumor no adulto fumante, corpo estranho na criança e no idoso com prótese dentária. É o achado que separa "asma de difícil controle" de câncer de pulmão. Muda a conduta para radiografia e tomografia de tórax e broncoscopia — não para mais um broncodilatador.',
    armadilhas: [
      'Tratar como asma. O sibilo unilateral que não responde ao broncodilatador precisa de imagem, não de dose maior.',
      'Tampão de muco simula o sinal; a tosse o desloca. Se sumiu depois de tossir, era secreção.',
      'Obstrução de brônquio-fonte pode transmitir o sibilo para os dois lados e parecer difusa; a monofonia denuncia.',
      'Na criança, corpo estranho pode ter passado semanas antes e a história de engasgo ser esquecida.',
    ],
    causas: [
      { titulo: 'Obstrução fixa de brônquio', mecanismo: 'Estreitamento estrutural de uma via aérea.', itens: ['Carcinoma broncogênico', 'Corpo estranho aspirado', 'Tumor carcinoide ou metástase endobrônquica', 'Estenose brônquica pós-tuberculose', 'Compressão extrínseca por linfonodo ou massa'] },
      { titulo: 'Obstrução parcial móvel', mecanismo: 'Muda com a tosse.', itens: ['Tampão mucoso', 'Coágulo', 'Broncomalácia localizada'] },
    ],
    ilustracao: { id: 'fonocardiograma', params: { tipo: 'sibilo-monofonico', intensidade: 400 }, alt: 'Linha do tempo respiratória com uma única onda musical regular' },
    referencias: ['Bohadana A, Izbicki G, Kraman SS. Fundamentals of lung auscultation. N Engl J Med, 2014.', 'Porto CC. Semiologia Médica, 8ª ed.'],
  },
  {
    slug: 'estertores-crepitantes',
    nome: 'Estertores crepitantes',
    sinonimos: ['Crepitações', 'Estertores finos', 'Crackles', 'Velcro'],
    sistema: 'respiratorio',
    resumo: 'Estalos curtos no fim da inspiração, como cabelo esfregado junto ao ouvido — alvéolos e pequenas vias aéreas abrindo de uma vez.',
    definicao:
      'Sons descontínuos, breves (< 20 ms), explosivos, não musicais, predominantes no fim da inspiração, que não somem com a tosse. Finos (agudos, como velcro) na fibrose e no edema intersticial inicial; grossos (mais graves, mais longos) na pneumonia, no edema alveolar e na bronquiectasia. Distribuição conta: bases bilaterais (congestão, fibrose), focal (pneumonia), difusos até os ápices (edema agudo, SDRA).',
    comoProcurar: [
      { passo: 'Ausculte as bases posteriores com o paciente sentado, respirando fundo pela boca.', detalhe: 'Os crepitantes gravitacionais começam nas bases e sobem com a gravidade da congestão.' },
      { passo: 'Peça para tossir e reausculte.', detalhe: 'Crepitantes que somem eram secreção ou atelectasia de decúbito; os que ficam são intersticiais ou alveolares.' },
      { passo: 'Note a fase: fim da inspiração é o padrão; início da inspiração sugere DPOC ou bronquiectasia.', detalhe: 'O momento em que a via aérea abre depende do seu calibre — pequenas abrem no fim.' },
      { passo: 'Mapeie a extensão e a simetria.', detalhe: 'Até que altura sobem? Um lado ou dois? É o mapa que separa pneumonia de insuficiência cardíaca.' },
    ],
    mecanismo:
      'Vias aéreas pequenas e alvéolos que colabaram na expiração — por líquido intersticial, exsudato, fibrose ou compressão — reabrem abruptamente quando a pressão inspiratória vence a tensão que os mantinha fechados. Cada reabertura é uma explosão minúscula de equalização de pressão: o estalo. Como as vias menores precisam de mais pressão para abrir, os estalos se concentram no fim da inspiração. O timbre depende do tamanho da via: finas dão estalos agudos e curtos (velcro), maiores dão estalos mais graves. Não são bolhas de líquido, como se pensou por décadas — são aberturas.',
    significado:
      'Crepitantes bilaterais nas bases em paciente dispneico apontam edema pulmonar; focais com febre, pneumonia; finos difusos "em velcro" em paciente crônico, fibrose intersticial. Mudam a conduta conforme o mapa: diurético, antibiótico ou investigação com tomografia. Na insuficiência cardíaca, a altura até onde sobem acompanha a pressão de enchimento e serve para acompanhar a resposta ao tratamento.',
    armadilhas: [
      'Crepitantes basais em idoso acamado que somem após respirações profundas e tosse são atelectasia de decúbito — não doença.',
      'Insuficiência cardíaca crônica compensada pode não ter crepitantes apesar de pressão elevada: os linfáticos se adaptaram. Ausência não exclui.',
      'Pelos do tórax roçando o estetoscópio simulam crepitantes; molhe os pelos ou pressione mais.',
      'Crepitantes finos de velcro em fibrose não respondem a diurético; o mapa (difusos, secos, crônicos) é o que separa.',
    ],
    causas: [
      { titulo: 'Líquido no interstício ou alvéolo', mecanismo: 'Colapso de pequenas vias por edema ou exsudato.', itens: ['Edema pulmonar cardiogênico', 'Pneumonia', 'SDRA', 'Hemorragia alveolar'] },
      { titulo: 'Fibrose e cicatriz', mecanismo: 'Vias aéreas rígidas que abrem tarde e com estalo.', itens: ['Fibrose pulmonar idiopática', 'Pneumonite de hipersensibilidade crônica', 'Asbestose', 'Doença intersticial de colagenoses'] },
      { titulo: 'Vias aéreas maiores', mecanismo: 'Estalos precoces e grossos.', itens: ['Bronquiectasias', 'DPOC', 'Atelectasia de decúbito'] },
    ],
    desempenho: [
      { alvo: 'Insuficiência cardíaca em dispneia aguda', sensibilidade: '~60%', especificidade: '~78%', razaoPositiva: '~2,8', leitura: 'Ajuda, mas não decide sozinho; o conjunto (jugular, B3, edema) é que pesa.', fonte: 'Wang CS et al. JAMA, 2005.' },
    ],
    ilustracao: { id: 'fonocardiograma', params: { tipo: 'estertores', intensidade: 2 }, alt: 'Linha do tempo respiratória com estalos curtos concentrados no fim da inspiração' },
    patologias: ['edema-agudo-de-pulmao', 'pneumonia-adquirida-na-comunidade'],
    referencias: ['Bohadana A, Izbicki G, Kraman SS. Fundamentals of lung auscultation. N Engl J Med, 2014.', 'Wang CS et al. JAMA, 2005.'],
  },
  {
    slug: 'murmurio-vesicular-abolido',
    nome: 'Murmúrio vesicular abolido unilateralmente',
    sinonimos: ['Silêncio auscultatório', 'Ausência de sons respiratórios'],
    sistema: 'respiratorio',
    resumo: 'Um hemitórax que respira e outro que não faz som nenhum — ou o ar não entra, ou há algo entre o pulmão e o estetoscópio.',
    definicao:
      'Ausência ou redução marcada do murmúrio vesicular em um hemitórax, ou numa região dele, comparado ao lado oposto, em paciente cujo esforço respiratório é visível. Sinal de comparação: exige auscultar pontos simétricos dos dois lados, alternadamente. Costuma vir com outros achados que dizem o motivo: hipertimpanismo (pneumotórax) ou macicez (derrame), desvio da traqueia, frêmito reduzido.',
    comoProcurar: [
      { passo: 'Ausculte em pares simétricos, alternando os lados a cada ponto.', detalhe: 'A assimetria só se percebe na comparação imediata; auscultar um lado inteiro e depois o outro perde o sinal.' },
      { passo: 'Peça inspirações profundas pela boca.', detalhe: 'Respiração superficial abole o murmúrio nos dois lados e cria falsa assimetria.' },
      { passo: 'Percuta o lado silencioso.', detalhe: 'Hipertimpânico: ar (pneumotórax). Maciço: líquido ou consolidação. É a percussão que separa as duas emergências.' },
      { passo: 'Olhe a traqueia e palpe o frêmito.', detalhe: 'Traqueia desviada para o lado oposto ao silêncio, em paciente instável, é pneumotórax hipertensivo — descomprima antes da radiografia.' },
    ],
    mecanismo:
      'O murmúrio vesicular é o som do ar turbulento nas vias aéreas de médio calibre, filtrado pelo parênquima até a parede. Some por dois motivos: o ar não chega (obstrução de brônquio-fonte, intubação seletiva, colapso do pulmão) ou algo se interpõe entre o pulmão e a parede e absorve ou reflete o som (ar pleural, líquido pleural, espessamento). No pneumotórax, o ar pleural desacopla o pulmão da parede; no derrame, a coluna de líquido reflete o som; na consolidação, o murmúrio some mas é substituído por som brônquico — e o frêmito aumenta, o que a diferencia do derrame.',
    significado:
      'Em trauma ou dispneia súbita, murmúrio abolido de um lado é pneumotórax ou hemotórax até prova em contrário — e, com hipotensão e traqueia desviada, pneumotórax hipertensivo, que se trata com agulha antes de qualquer imagem. No paciente intubado, é intubação seletiva (tubo no brônquio direito) até que se confirme o contrário. Fora da urgência, aponta derrame volumoso ou atelectasia de um lobo. Muda a conduta em minutos.',
    armadilhas: [
      'Obesidade, enfisema e derrame bilateral reduzem o murmúrio dos dois lados e escondem a assimetria. Compare pontos simétricos com inspiração forçada.',
      'Consolidação também abole o murmúrio vesicular, mas o substitui por sopro brônquico e aumenta o frêmito; não confunda com derrame.',
      'Em pneumotórax hipertensivo, esperar a radiografia para agir é o erro fatal clássico.',
      'Intubação seletiva: tubo profundo demais abole o murmúrio à esquerda. Confira a profundidade antes de pensar em pneumotórax.',
    ],
    causas: [
      { titulo: 'Ar ou líquido entre pulmão e parede', mecanismo: 'Desacoplamento acústico.', itens: ['Pneumotórax (espontâneo, traumático, hipertensivo)', 'Derrame pleural volumoso', 'Hemotórax', 'Espessamento pleural extenso'] },
      { titulo: 'O ar não entra', mecanismo: 'Obstrução ou colapso.', itens: ['Intubação seletiva', 'Atelectasia por obstrução brônquica (tampão, tumor, corpo estranho)', 'Pneumonectomia'] },
    ],
    ilustracao: { id: 'mapa-toracico', params: { achado: 'mv-abolido', valor: 80 }, alt: 'Mapa do tórax com um hemitórax marcado como silencioso e o outro normal' },
    patologias: ['pneumotorax', 'derrame-pleural'],
    referencias: ['ATLS — Advanced Trauma Life Support, 10ª ed.', 'Bohadana A, Izbicki G, Kraman SS. N Engl J Med, 2014.'],
  },
  {
    slug: 'macicez-a-percussao',
    nome: 'Macicez à percussão',
    sinonimos: ['Submacicez', 'Som maciço', 'Percussão abafada'],
    sistema: 'respiratorio',
    resumo: 'O dedo bate e o tórax responde surdo, como a coxa — onde deveria haver ar, há líquido ou tecido.',
    definicao:
      'Som de percussão abafado, curto e de tom alto sobre uma área do tórax que normalmente daria som claro pulmonar, com sensação de resistência no dedo plexímetro. Macicez absoluta (como sobre a coxa) indica líquido ou massa sólida; submacicez, consolidação ou lâmina menor de líquido. Sinal de comparação e de limite: descreve-se a extensão a partir da base e o nível em que o som muda.',
    comoProcurar: [
      { passo: 'Percuta pontos simétricos dos dois lados, de cima para baixo, na face posterior com o paciente sentado.', detalhe: 'O dedo médio da mão não dominante apoiado firme no espaço intercostal; a ponta do outro dedo médio bate curto e perpendicular.' },
      { passo: 'Encontre o nível em que o som claro vira maciço e marque-o.', detalhe: 'A altura da macicez a partir da base estima o volume do derrame; nível que muda com a posição do paciente confirma líquido livre.' },
      { passo: 'Percuta a região acima da macicez.', detalhe: 'Submacicez com sopro brônquico logo acima do derrame é o pulmão comprimido — não é consolidação separada.' },
      { passo: 'Some ao murmúrio e ao frêmito.', detalhe: 'Maciço com murmúrio abolido e frêmito reduzido: derrame. Maciço com sopro brônquico e frêmito aumentado: consolidação.' },
    ],
    mecanismo:
      'A percussão põe a parede torácica e o que está por baixo dela para vibrar. Pulmão cheio de ar ressoa em baixa frequência e por mais tempo — o som claro. Líquido e tecido sólido não ressoam: absorvem a energia e devolvem um som curto, alto e abafado. O dedo sente a diferença tanto quanto o ouvido: a parede sobre líquido não vibra. Por isso a macicez é ao mesmo tempo um achado auditivo e tátil, e por isso funciona para derrame (líquido), consolidação (parênquima sem ar) e massa — todos substituíram o ar por algo denso.',
    significado:
      'Macicez unilateral na base é o sinal físico mais útil para derrame pleural, com razão de verossimilhança que justifica pedir a radiografia mesmo sem outros achados; sua ausência torna derrame moderado a grande improvável. Localiza também consolidação e atelectasia. Muda a conduta para imagem e, se derrame, toracocentese. A extensão em centímetros serve de referência para acompanhar.',
    armadilhas: [
      'Percussão sobre a escápula, o fígado ou o coração é maciça no normal; conheça os limites antes de chamar de anormal.',
      'Derrame pequeno (< 300 mL) não altera a percussão; ausência do sinal não exclui derrame pequeno.',
      'Elevação do diafragma (hepatomegalia, paralisia diafragmática) simula macicez basal.',
      'Percussão fraca ou com o dedo mal apoiado dá som abafado em qualquer lugar. Técnica antes de interpretação.',
    ],
    causas: [
      { titulo: 'Líquido', mecanismo: 'Coluna de líquido entre pulmão e parede.', itens: ['Derrame pleural (transudato ou exsudato)', 'Hemotórax', 'Empiema'] },
      { titulo: 'Parênquima sem ar', mecanismo: 'Alvéolos preenchidos ou colabados.', itens: ['Pneumonia consolidada', 'Atelectasia', 'Tumor ou massa', 'Fibrotórax'] },
    ],
    desempenho: [
      { alvo: 'Derrame pleural (radiografia)', sensibilidade: '~89%', especificidade: '~81%', razaoPositiva: '~8,7', razaoNegativa: '~0,3', leitura: 'O melhor sinal físico isolado para derrame; macicez ausente torna derrame significativo improvável.', fonte: 'Wong CL et al. Does this patient have a pleural effusion? JAMA, 2009.' },
    ],
    ilustracao: { id: 'mapa-toracico', params: { achado: 'macicez', valor: 10 }, alt: 'Mapa do tórax com zona maciça a partir da base de um hemitórax' },
    patologias: ['derrame-pleural'],
    referencias: ['Wong CL et al. Does this patient have a pleural effusion? JAMA, 2009.', 'Porto CC. Semiologia Médica, 8ª ed.'],
  },
  {
    slug: 'fremito-toracovocal-aumentado',
    nome: 'Frêmito toracovocal aumentado',
    sinonimos: ['FTV aumentado', 'Frêmito vocal aumentado'],
    sistema: 'respiratorio',
    resumo: 'A voz do paciente vibra mais forte sob a mão numa região — o pulmão ali ficou sólido e conduz o som como madeira.',
    definicao:
      'Aumento da vibração palpável na parede torácica quando o paciente fala ("trinta e três"), em uma região comparada com a simétrica do lado oposto. Acompanha consolidação com brônquio pérvio. O oposto — frêmito reduzido — indica ar ou líquido entre o pulmão e a parede. Sinal de comparação: sem o lado oposto, não há referência.',
    comoProcurar: [
      { passo: 'Apoie a borda ulnar da mão (ou a palma) sobre a parede posterior, em pontos simétricos, alternando os lados.', detalhe: 'A borda ulnar é mais sensível à vibração que a palma. Uma mão de cada vez, comparando.' },
      { passo: 'Peça para dizer "trinta e três" com voz grave e forte, sempre da mesma forma.', detalhe: 'Vogais graves vibram mais. Voz fraca ou aguda abole o frêmito nos dois lados.' },
      { passo: 'Percorra de cima para baixo e marque onde a vibração muda.', detalhe: 'Aumento focal com macicez e sopro brônquico é consolidação; redução com macicez é derrame.' },
      { passo: 'Confirme com a ausculta da voz (broncofonia, pectorilóquia).', detalhe: 'A voz que se ouve nítida no estetoscópio sobre a área é o mesmo fenômeno pela via auditiva.' },
    ],
    mecanismo:
      'A voz gera vibração na laringe que desce pela árvore brônquica. O pulmão aerado, cheio de interfaces ar-tecido, dispersa e atenua essa vibração antes de chegar à parede — por isso o frêmito normal é discreto. Quando o parênquima se consolida e o brônquio continua aberto, o som atravessa um meio homogêneo e denso, que conduz vibração muito melhor que o pulmão esponjoso: o frêmito chega à mão amplificado. Se o brônquio está obstruído ou há ar ou líquido pleural no caminho, a transmissão se interrompe e o frêmito cai. O sinal depende, portanto, de duas condições: meio sólido e via aérea pérvia.',
    significado:
      'Frêmito aumentado localizado, com macicez e crepitantes ou sopro brônquico, é consolidação pneumônica com boa especificidade — e é o que a diferencia à beira do leito do derrame, que reduz o frêmito. Orienta a radiografia e apoia o tratamento como pneumonia enquanto a imagem não vem. Reduzido, muda a hipótese para derrame, pneumotórax ou atelectasia obstrutiva.',
    armadilhas: [
      'Obesidade, mama, musculatura espessa e voz fraca reduzem o frêmito bilateralmente; o que vale é a assimetria.',
      'Consolidação com brônquio obstruído (tumor, tampão) não aumenta o frêmito — pode reduzi-lo. Ausência do sinal não exclui pneumonia.',
      'Frêmito é sinal de baixa sensibilidade e concordância modesta entre examinadores; some-o a percussão e ausculta em vez de decidir por ele.',
      'Derrame pequeno pode aumentar o frêmito logo acima da sua borda, onde o pulmão comprimido está consolidado.',
    ],
    causas: [
      { titulo: 'Consolidação com brônquio pérvio', mecanismo: 'Meio sólido conduzindo a vibração.', itens: ['Pneumonia lobar', 'Infarto pulmonar', 'Massa com brônquio patente', 'Pulmão comprimido acima de derrame'] },
    ],
    desempenho: [
      { alvo: 'Pneumonia (radiografia)', sensibilidade: '~5–10%', especificidade: '~96–99%', leitura: 'Raro, mas quando presente pesa a favor; não procure só ele.', fonte: 'Metlay JP, Kapoor WN, Fine MJ. Does this patient have community-acquired pneumonia? JAMA, 1997.' },
    ],
    ilustracao: { id: 'mapa-toracico', params: { achado: 'fremito-aumentado', valor: 60 }, alt: 'Mapa do tórax com zona de frêmito aumentado em um hemitórax' },
    patologias: ['pneumonia-adquirida-na-comunidade'],
    referencias: ['Metlay JP, Kapoor WN, Fine MJ. JAMA, 1997.', 'Porto CC. Semiologia Médica, 8ª ed.'],
  },
  {
    slug: 'fremito-toracovocal-reduzido',
    nome: 'Frêmito toracovocal reduzido',
    sinonimos: ['FTV diminuído ou abolido', 'Frêmito vocal ausente'],
    sistema: 'respiratorio',
    resumo: 'A voz que não chega à mão de um lado — ar ou líquido entre o pulmão e a parede interrompendo a vibração.',
    definicao:
      'Redução ou ausência da vibração palpável da voz numa região do tórax comparada à simétrica do lado oposto, com voz de igual intensidade. Acompanha pneumotórax, derrame pleural, espessamento pleural e atelectasia por obstrução brônquica. É o par do frêmito aumentado, e a comparação entre os dois lados é o sinal inteiro.',
    comoProcurar: [
      { passo: 'Borda ulnar da mão em pontos simétricos, alternando, enquanto o paciente diz "trinta e três".', detalhe: 'Mesma técnica do frêmito aumentado; o que muda é a direção da assimetria.' },
      { passo: 'Percuta a região de frêmito reduzido.', detalhe: 'Hipertimpânico: pneumotórax. Maciço: derrame. Sem percussão, o frêmito reduzido não diz qual dos dois.' },
      { passo: 'Ausculte o murmúrio.', detalhe: 'Reduzido ou abolido nos dois casos; o conjunto frêmito + percussão + murmúrio é o que decide.' },
      { passo: 'No derrame, marque o nível.', detalhe: 'O frêmito some abaixo do nível do líquido e pode aumentar logo acima, onde o pulmão está comprimido.' },
    ],
    mecanismo:
      'A vibração da voz precisa de um caminho contínuo de tecido do brônquio à parede. Ar pleural é um isolante acústico quase perfeito; líquido pleural reflete e amortece a vibração; um brônquio obstruído impede que ela entre no pulmão distal. Em todos os casos, a mão sobre a parede sente menos ou nada. É o mesmo princípio do frêmito aumentado invertido: onde o pulmão consolidado conduz, o ar e o líquido isolam.',
    significado:
      'Frêmito reduzido de um lado é o sinal que, com percussão e murmúrio, fecha o tripé do derrame (maciço, silencioso, sem frêmito) e do pneumotórax (hipertimpânico, silencioso, sem frêmito). Em trauma e dispneia aguda, é parte da avaliação que decide drenagem. Muda a conduta para imagem imediata — ou para descompressão, se o paciente está instável e o quadro é de pneumotórax hipertensivo.',
    armadilhas: [
      'Frêmito reduzido bilateral é obesidade, enfisema, derrame bilateral ou voz fraca — não é o sinal.',
      'Sem percussão, frêmito reduzido não distingue ar de líquido; e os dois têm tratamento diferente.',
      'Atelectasia por obstrução reduz o frêmito e puxa a traqueia para o lado doente; derrame volumoso empurra para o oposto. A traqueia desempata.',
      'Espessamento pleural crônico reduz o frêmito sem doença aguda; a história diz.',
    ],
    causas: [
      { titulo: 'Isolante entre pulmão e parede', mecanismo: 'Ar ou líquido pleural.', itens: ['Pneumotórax', 'Derrame pleural', 'Hemotórax', 'Espessamento ou tumor pleural'] },
      { titulo: 'Vibração que não entra', mecanismo: 'Brônquio obstruído.', itens: ['Atelectasia por tampão, tumor ou corpo estranho', 'Intubação seletiva'] },
    ],
    ilustracao: { id: 'mapa-toracico', params: { achado: 'fremito-reduzido', valor: 70 }, alt: 'Mapa do tórax com zona de frêmito reduzido em um hemitórax' },
    patologias: ['derrame-pleural', 'pneumotorax'],
    referencias: ['Wong CL et al. Does this patient have a pleural effusion? JAMA, 2009.', 'Porto CC. Semiologia Médica, 8ª ed.'],
  },
]
