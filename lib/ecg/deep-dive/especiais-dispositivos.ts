import type { DeepDiveMap } from './types'

/** Padrões especiais, artefatos e dispositivos. */
export const DEEP_DIVE_ESPECIAIS: DeepDiveMap = {
  'brugada-1': {
    emUmaFrase:
      'Supradesnivelamento em cúpula (coved) maior ou igual a 2 mm em V1–V2, descendo diretamente para uma onda T negativa: o único padrão diagnóstico de síndrome de Brugada.',
    secoes: [
      {
        titulo: 'A canalopatia por trás do desenho',
        texto:
          'A síndrome de Brugada é uma doença elétrica primária, hereditária com padrão autossômico dominante e penetrância variável, associada em cerca de 20% a 30% dos casos a mutações no gene SCN5A, que codifica a subunidade alfa do canal de sódio cardíaco. A perda de função desse canal reduz a corrente de entrada de sódio na fase 0 e desequilibra o balanço com a corrente transitória de saída de potássio (Ito), que é mais expressa no epicárdio da via de saída do ventrículo direito. Esse desequilíbrio cria um gradiente de voltagem transmural e uma dispersão da repolarização exatamente naquela região — o que gera tanto o supradesnivelamento característico em V1 e V2 quanto o substrato para reentrada em fase 2 e fibrilação ventricular.',
      },
      {
        titulo: 'Reconhecendo o tipo 1',
        texto:
          'O padrão tipo 1 é definido por supradesnivelamento do ponto J maior ou igual a 2 mm em pelo menos uma derivação entre V1 e V2, com morfologia em cúpula — o segmento ST desce de forma gradual e côncava para baixo até uma onda T negativa, sem retornar à linha de base. É o único padrão considerado diagnóstico; os tipos 2 e 3, em sela, são apenas sugestivos e requerem confirmação. Um detalhe técnico decisivo: as alterações podem ser dinâmicas e aparecer apenas em determinadas condições. Registrar V1 e V2 no segundo ou terceiro espaço intercostal (posições altas) aumenta significativamente a sensibilidade, porque aproxima os eletrodos da via de saída do ventrículo direito. O padrão pode ser desmascarado por febre, uso de bloqueadores de canal de sódio, vagotonia, álcool e refeições copiosas — e por isso o teste provocativo com ajmalina, flecainida ou procainamida é usado em casos duvidosos.',
      },
      {
        titulo: 'Estratificação de risco',
        texto:
          'Padrão de Brugada é o achado eletrocardiográfico; síndrome de Brugada é o padrão tipo 1 associado a manifestações clínicas — parada cardíaca recuperada, taquicardia ventricular polimórfica documentada, síncope de origem arrítmica, respiração agônica noturna ou história familiar de morte súbita precoce. O risco é maior em homens, entre a terceira e a quarta décadas de vida, e os eventos ocorrem caracteristicamente em repouso, durante o sono ou em vigência de febre — porque o aumento da temperatura acentua a disfunção do canal de sódio. Esse dado tem uma consequência prática imediata: todo portador deve tratar febre agressivamente com antitérmicos.',
      },
      {
        titulo: 'Conduta',
        texto:
          'O cardiodesfibrilador implantável é o único tratamento comprovadamente eficaz na prevenção de morte súbita e está indicado em sobreviventes de parada cardíaca e em pacientes com arritmia ventricular documentada; nos casos de síncope arrítmica, a indicação é individualizada. A quinidina, por bloquear a corrente Ito, reduz a indutibilidade de arritmias e é útil em pacientes com múltiplos choques ou como alternativa quando o dispositivo não é possível; a ablação epicárdica da via de saída do ventrículo direito é opção em casos selecionados. Todos os pacientes devem receber orientação sobre a lista de fármacos a evitar (disponível em bases dedicadas), tratar febre precocemente, evitar excesso de álcool e realizar rastreamento familiar com eletrocardiograma e, quando indicado, teste genético.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST em V1–V2', achado: 'Supradesnivelamento maior ou igual a 2 mm com morfologia em cúpula (coved).' },
      { onda: 'Onda T', achado: 'Negativa, sucedendo diretamente o ST descendente, sem retorno à linha de base.' },
      { onda: 'QRS', achado: 'Pode haver aspecto de bloqueio incompleto de ramo direito, mas sem onda S larga em V6.' },
      { onda: 'Derivações altas', achado: 'Registrar V1–V2 no 2º e 3º espaços intercostais aumenta a sensibilidade.' },
      { onda: 'Dinamismo', achado: 'O padrão pode aparecer e desaparecer; febre e bloqueadores de sódio o desmascaram.' },
    ],
    roteiro: [
      'Olhe V1 e V2 procurando supradesnivelamento em cúpula.',
      'Verifique se o ST desce diretamente para uma T negativa.',
      'Registre V1–V2 em posições altas se houver suspeita.',
      'Pergunte sobre síncope, sono agitado e morte súbita na família.',
      'Encaminhe ao eletrofisiologista; oriente sobre febre e fármacos proibidos.',
    ],
    separando: [
      { de: 'Bloqueio de ramo direito', chave: 'No BRD há rSR′ com S larga em DI e V6; no Brugada não há S larga lateral.' },
      { de: 'Repolarização precoce', chave: 'Supra côncavo com entalhe no ponto J e T positiva.' },
      { de: 'Pseudo-Brugada por hipercalemia', chave: 'Dose o potássio: o padrão desaparece com a correção.' },
      { de: 'Infarto anterosseptal', chave: 'Contexto de dor, evolução dinâmica e imagem em espelho.' },
    ],
    fixacao: [
      'Só o tipo 1 (coved com T negativa) é diagnóstico.',
      'Febre desmascara e desencadeia: trate a temperatura agressivamente.',
      'Derivações altas em V1–V2 aumentam a sensibilidade do exame.',
    ],
  },

  'brugada-2': {
    emUmaFrase:
      'Padrão em sela (saddleback) em V1–V2, com supradesnivelamento do ponto J e onda T positiva ou bifásica: sugestivo, porém não diagnóstico de síndrome de Brugada.',
    secoes: [
      {
        titulo: 'Sela não fecha diagnóstico',
        texto:
          'O padrão tipo 2 apresenta elevação do ponto J maior ou igual a 2 mm seguida de descida do segmento ST que permanece elevado pelo menos 0,5 mm acima da linha de base, com onda T positiva ou bifásica — o conjunto lembra uma sela de cavalo. Diferentemente do tipo 1, ele não é diagnóstico: pode ocorrer em corações normais, em atletas, em portadores de bloqueio incompleto de ramo direito, com eletrodos posicionados em espaços intercostais altos, na hipercalemia e em outras condições. Isso significa que o achado isolado, em paciente assintomático e sem história familiar, não justifica alarme — mas justifica investigação estruturada.',
      },
      {
        titulo: 'Critérios morfológicos que ajudam',
        texto:
          'Alguns parâmetros aumentam a probabilidade de que um padrão em sela represente doença: o ângulo beta, formado entre a linha ascendente da onda r′ e a linha descendente do ST, quando amplo; a base do triângulo da onda r′ medida a 5 mm do pico, quando maior que 3,5 mm; e a duração do QRS em V1–V2 maior que na V6. Nenhum desses critérios substitui a confirmação, que se faz por conversão do padrão para o tipo 1 — espontaneamente, durante febre, ou por teste provocativo farmacológico com bloqueador de canal de sódio, realizado em ambiente monitorizado e com desfibrilador disponível, pois o próprio teste pode desencadear arritmias.',
      },
      {
        titulo: 'Conduta prática',
        texto:
          'O primeiro passo é técnico: refazer o eletrocardiograma com posicionamento correto dos eletrodos e também em posições altas (segundo e terceiro espaços intercostais). O segundo é clínico: investigar síncope, palpitações, respiração agônica noturna, história familiar de morte súbita antes dos 45 anos e eventos durante febre. O terceiro é laboratorial: excluir hipercalemia e outras causas de pseudo-Brugada. Sem sintomas, sem história familiar e sem conversão para tipo 1, o paciente pode ser acompanhado clinicamente, com orientação sobre febre e fármacos a evitar. Com qualquer sinal de alarme, o encaminhamento ao eletrofisiologista é obrigatório.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST em V1–V2', achado: 'Padrão em sela: elevação do ponto J seguida de descida que se mantém ao menos 0,5 mm elevada.' },
      { onda: 'Onda T', achado: 'Positiva ou bifásica — diferentemente do tipo 1, em que é negativa.' },
      { onda: 'Onda r′', achado: 'Avalie o ângulo beta e a largura da base do triângulo da r′.' },
      { onda: 'Posicionamento', achado: 'Repita com V1–V2 nos espaços intercostais superiores.' },
      { onda: 'Conversão', achado: 'Transformação em tipo 1 (espontânea, febril ou provocada) é o que confirma o diagnóstico.' },
    ],
    roteiro: [
      'Reconheça o padrão em sela em V1–V2.',
      'Confirme o posicionamento dos eletrodos e repita em posições altas.',
      'Dose potássio e exclua causas de pseudo-Brugada.',
      'Investigue sintomas e história familiar.',
      'Encaminhe para teste provocativo se houver sinais de alarme.',
    ],
    separando: [
      { de: 'Brugada tipo 1', chave: 'Cúpula com T negativa — este sim é diagnóstico.' },
      { de: 'Bloqueio incompleto de ramo direito', chave: 'rSR′ com QRS entre 110 e 120 ms e ST normal.' },
      { de: 'Repolarização precoce', chave: 'Entalhe no ponto J com supra côncavo e T positiva ampla.' },
      { de: 'Eletrodos altos', chave: 'O padrão pode ser criado artificialmente; refaça com posicionamento correto.' },
    ],
    fixacao: [
      'Sela é suspeita; cúpula com T negativa é diagnóstico.',
      'Conversão para tipo 1 é o que fecha o caso.',
      'Antes de qualquer conclusão, confira o posicionamento dos eletrodos.',
    ],
  },

  'pe-s1q3t3': {
    emUmaFrase:
      'Onda S em DI, onda Q em DIII e onda T invertida em DIII, num paciente taquicárdico e dispneico: o padrão clássico — porém pouco frequente — do tromboembolismo pulmonar agudo.',
    secoes: [
      {
        titulo: 'O que a sobrecarga aguda faz ao coração direito',
        texto:
          'A obstrução súbita do leito arterial pulmonar eleva a pós-carga do ventrículo direito, que é uma câmara fina e pouco preparada para isso. Ele dilata agudamente, roda no tórax, comprime o ventrículo esquerdo pelo desvio do septo e entra em isquemia subendocárdica relativa. Eletricamente, isso desloca o eixo para a direita, gera atraso de condução no ventrículo direito e altera a repolarização das paredes direita e inferior. É desse conjunto que nascem os achados: onda S em DI (forças para a direita), onda Q e T invertida em DIII (sobrecarga inferior e direita), bloqueio de ramo direito novo, T invertida em V1 a V4 e desvio do eixo para a direita.',
      },
      {
        titulo: 'A verdade estatística sobre o S1Q3T3',
        texto:
          'Apesar de ser o padrão mais citado, o S1Q3T3 aparece em apenas cerca de 10% a 20% dos casos de tromboembolismo pulmonar, e não é específico — pode ocorrer em qualquer causa de sobrecarga aguda do ventrículo direito, incluindo pneumotórax hipertensivo, broncoespasmo grave e exacerbação de DPOC. O achado mais comum no tromboembolismo pulmonar é simplesmente a taquicardia sinusal, presente na maioria dos pacientes; alterações inespecíficas de ST e T vêm em seguida. O corolário clínico é essencial: o eletrocardiograma jamais exclui tromboembolismo pulmonar. Sua função é levantar a suspeita, avaliar gravidade e afastar diagnósticos alternativos como infarto e pericardite.',
      },
      {
        titulo: 'Valor prognóstico',
        texto:
          'Alguns achados identificam pacientes com maior sobrecarga do ventrículo direito e pior prognóstico: inversão de onda T em V1 a V4 (quanto mais extensa, maior a gravidade), bloqueio de ramo direito completo novo, S1Q3T3, desvio do eixo para a direita, fibrilação atrial de início recente e taquicardia sinusal persistente. Esses marcadores ajudam a estratificar junto com troponina, peptídeo natriurético, avaliação do ventrículo direito ao ecocardiograma ou à angiotomografia, e escores como o PESI, que orientam a decisão entre tratamento ambulatorial, internação e terapias de reperfusão.',
      },
      {
        titulo: 'Conduta',
        texto:
          'O diagnóstico se faz pela combinação de probabilidade pré-teste (escores de Wells ou de Genebra), D-dímero ajustado à idade nos casos de baixa probabilidade e angiotomografia de tórax como exame confirmatório. O tratamento é a anticoagulação, iniciada precocemente diante de alta suspeita, com trombólise sistêmica reservada aos casos de alto risco com instabilidade hemodinâmica, e tratamento dirigido por cateter ou embolectomia em situações selecionadas. À beira do leito, o ecocardiograma que mostra ventrículo direito dilatado, hipocinético com preservação do ápice (sinal de McConnell) e septo retificado tem enorme valor na tomada de decisão em paciente instável.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Taquicardia sinusal — o achado mais comum, ainda que inespecífico.' },
      { onda: 'DI', achado: 'Onda S proeminente, refletindo forças elétricas desviadas para a direita.' },
      { onda: 'DIII', achado: 'Onda Q e onda T invertida.' },
      { onda: 'V1–V4', achado: 'Inversão de onda T por sobrecarga do ventrículo direito; extensão correlaciona-se com gravidade.' },
      { onda: 'QRS', achado: 'Bloqueio de ramo direito completo ou incompleto, frequentemente novo.' },
      { onda: 'Eixo', achado: 'Desviado para a direita.' },
    ],
    roteiro: [
      'Comece pela frequência: taquicardia sinusal é a regra.',
      'Procure S em DI, Q e T invertida em DIII.',
      'Avalie T invertida em V1–V4 e bloqueio de ramo direito novo.',
      'Compare com traçado antigo para identificar o que é novo.',
      'Calcule a probabilidade pré-teste e siga o algoritmo diagnóstico — o ECG não exclui.',
    ],
    separando: [
      { de: 'Infarto inferior', chave: 'Supra em DII, DIII e aVF com reciprocidade em DI e aVL, sem sinais de sobrecarga direita aguda.' },
      { de: 'Isquemia anterior', chave: 'T invertida concentrada nas precordiais, com contexto anginoso e sem taquicardia desproporcional.' },
      { de: 'DPOC exacerbada', chave: 'Sinais crônicos de sobrecarga direita, P pulmonale e traçado antigo semelhante.' },
      { de: 'Pericardite', chave: 'Supra difuso com infradesnivelamento de PR.' },
    ],
    fixacao: [
      'O achado mais comum no TEP é taquicardia sinusal, não S1Q3T3.',
      'ECG normal nunca exclui tromboembolismo pulmonar.',
      'T invertida extensa em V1–V4 com BRD novo indica sobrecarga grave do VD.',
    ],
  },

  dextrocardia: {
    emUmaFrase:
      'Onda P negativa em DI, QRS predominantemente negativo em DI e progressão de R invertida nas precordiais: o coração está do lado direito do tórax.',
    secoes: [
      {
        titulo: 'Por que tudo se inverte',
        texto:
          'Na dextrocardia com situs inversus, o coração é uma imagem em espelho do normal e está posicionado no hemitórax direito. Todos os vetores elétricos apontam para a direita em vez de para a esquerda. Como DI é a derivação que mede a diferença entre braço esquerdo e braço direito, a inversão dos vetores torna negativos tanto a onda P quanto o QRS e a onda T nessa derivação. Nas precordiais, o padrão também se inverte: em vez de crescer, a onda R diminui progressivamente de V1 a V6, porque os eletrodos vão se afastando do coração em vez de se aproximarem. Uma consequência prática é que aVR e aVL parecem trocadas entre si.',
      },
      {
        titulo: 'A diferença crucial em relação à troca de eletrodos',
        texto:
          'A troca dos eletrodos dos braços também produz P e QRS negativos em DI, mas as precordiais permanecem normais, com progressão de R preservada — porque os eletrodos torácicos não foram afetados. Na dextrocardia verdadeira, as precordiais mostram regressão da onda R. Essa é a distinção que resolve o caso em segundos e evita o encaminhamento desnecessário de um erro técnico como cardiopatia. Confirmada a dextrocardia, o eletrocardiograma correto é obtido invertendo os eletrodos dos membros e posicionando as precordiais em espelho no hemitórax direito (V3R a V6R), o que restaura um traçado interpretável.',
      },
      {
        titulo: 'Contexto clínico',
        texto:
          'A dextrocardia com situs inversus totalis costuma ser um achado benigno e frequentemente incidental, com anatomia cardíaca normal em espelho. Uma associação importante é a síndrome de Kartagener — discinesia ciliar primária com situs inversus, bronquiectasias e sinusite crônica —, que deve ser lembrada em paciente com infecções respiratórias de repetição. Já a dextrocardia isolada, sem situs inversus abdominal, associa-se com muito mais frequência a cardiopatias congênitas complexas e exige investigação com ecocardiograma. Do ponto de vista prático, o mais importante é reconhecer o padrão para não interpretar erroneamente ondas Q, eixo e progressão de R, e para lembrar que, em situação de reanimação, as pás do desfibrilador devem ser posicionadas em espelho.',
      },
    ],
    ondaAOnda: [
      { onda: 'DI', achado: 'Onda P, QRS e onda T todos negativos — inversão completa da derivação.' },
      { onda: 'aVR e aVL', achado: 'Aparentam estar trocadas em relação ao traçado normal.' },
      { onda: 'Precordiais', achado: 'Progressão de R invertida: a amplitude diminui de V1 a V6.' },
      { onda: 'Eixo', achado: 'Desviado para a direita (aparentemente para o quadrante noroeste).' },
      { onda: 'Correção', achado: 'Refazer com eletrodos dos membros invertidos e precordiais em espelho (V3R–V6R).' },
    ],
    roteiro: [
      'Note P negativa em DI.',
      'Olhe as precordiais: a onda R regride de V1 a V6?',
      'Se as precordiais são normais, o problema é troca de eletrodos, não dextrocardia.',
      'Refaça o ECG com posicionamento espelhado.',
      'Investigue situs e considere ecocardiograma conforme o contexto.',
    ],
    separando: [
      { de: 'Troca de eletrodos dos braços', chave: 'Precordiais normais com progressão de R preservada.' },
      { de: 'Infarto lateral extenso', chave: 'Ondas Q com contexto clínico e evolução compatíveis, sem inversão da onda P em DI.' },
      { de: 'Ritmo juncional', chave: 'A P negativa aparece em DII, e não em DI.' },
    ],
    fixacao: [
      'P negativa em DI: pergunte sempre “as precordiais também estão invertidas?”.',
      'Precordiais normais = eletrodos trocados. Precordiais regressivas = dextrocardia.',
      'Em reanimação de dextrocárdico, posicione as pás em espelho.',
    ],
  },

  'limb-reversal': {
    emUmaFrase:
      'A troca dos eletrodos dos braços produz P e QRS negativos em DI com precordiais normais — um erro técnico que imita cardiopatia e se resolve refazendo o exame.',
    secoes: [
      {
        titulo: 'O erro mais comum do eletrocardiograma',
        texto:
          'A inversão dos eletrodos dos membros superiores é o erro técnico mais frequente na prática. Ao trocar braço direito por braço esquerdo, DI inverte-se completamente (P, QRS e T negativos), DII e DIII trocam de lugar, aVR e aVL trocam de lugar, e aVF permanece inalterada. O resultado é um traçado que sugere dextrocardia, infarto lateral ou ritmo ectópico — nenhum dos quais existe. Estima-se que erros de posicionamento ocorram em uma fração significativa dos exames, e boa parte das interpretações equivocadas em serviços de emergência tem essa origem banal.',
      },
      {
        titulo: 'Como identificar cada troca',
        texto:
          'Braço direito com braço esquerdo: P e QRS negativos em DI, com precordiais absolutamente normais — a assinatura. Braço direito com perna esquerda: complexos profundamente negativos em DII, aVR muitas vezes positiva e aspecto bizarro do traçado. Braço esquerdo com perna esquerda: alterações mais sutis, geralmente com P mais alta em DI que em DII, o que inverte a relação normal. Troca de perna direita (eletrodo neutro) com outro membro: reduz drasticamente a amplitude em uma das derivações, que pode ficar quase plana. Um princípio geral resolve a maioria dos casos: aVR deve ser sempre predominantemente negativa; se estiver positiva, suspeite de troca antes de suspeitar de doença.',
      },
      {
        titulo: 'Por que isso importa clinicamente',
        texto:
          'Traçados com eletrodos trocados já levaram a ativações desnecessárias de hemodinâmica, a diagnósticos falsos de infarto, a marcapassos indicados sem necessidade e a comparações inválidas em seguimento. Além disso, quando o erro se repete de forma inconsistente entre exames, cria a falsa impressão de alterações dinâmicas. A conduta correta é simples e barata: diante de qualquer traçado com padrão bizarro ou incongruente com a clínica, refazer o exame conferindo pessoalmente o posicionamento dos eletrodos. Vale também padronizar a checagem: aVR negativa, P positiva em DII, progressão de R coerente nas precordiais.',
      },
    ],
    ondaAOnda: [
      { onda: 'DI', achado: 'Onda P, QRS e T negativos — inversão completa quando os braços são trocados.' },
      { onda: 'aVR', achado: 'Torna-se positiva; em um traçado correto, aVR é sempre predominantemente negativa.' },
      { onda: 'DII e DIII', achado: 'Trocam de morfologia entre si.' },
      { onda: 'Precordiais', achado: 'NORMAIS, com progressão de R preservada — o dado que exclui dextrocardia.' },
      { onda: 'Correção', achado: 'Refazer o exame com posicionamento conferido resolve completamente.' },
    ],
    roteiro: [
      'Olhe aVR: está positiva? Desconfie imediatamente.',
      'Verifique a polaridade da P em DI e DII.',
      'Analise as precordiais: normais apontam erro técnico, não dextrocardia.',
      'Refaça o exame conferindo os eletrodos pessoalmente.',
      'Compare o novo traçado com exames anteriores.',
    ],
    separando: [
      { de: 'Dextrocardia', chave: 'Na dextrocardia as precordiais também se invertem, com regressão da onda R.' },
      { de: 'Ritmo juncional ou atrial baixo', chave: 'A P negativa aparece em DII e aVF, não em DI, e as precordiais são normais.' },
      { de: 'Infarto lateral', chave: 'Ondas Q com contexto clínico, evolução e sem inversão da P.' },
    ],
    fixacao: [
      'aVR positiva é quase sempre erro técnico, não doença.',
      'Precordiais normais com DI invertida = braços trocados.',
      'Refazer o ECG é o exame complementar mais barato da medicina.',
    ],
  },

  'muscle-tremor': {
    emUmaFrase:
      'Oscilações irregulares de alta frequência superpostas ao traçado, sem alterar a marcha dos complexos: artefato muscular que pode imitar fibrilação atrial, flutter ou até taquicardia ventricular.',
    secoes: [
      {
        titulo: 'De onde vem o ruído',
        texto:
          'O eletrocardiógrafo registra diferenças de potencial na superfície corporal — e o músculo esquelético também gera potenciais elétricos. Tremor, calafrio, tensão muscular, doença de Parkinson, movimentação, dor e frio produzem atividade elétrica de frequência mais alta que a cardíaca, que se soma ao sinal. O resultado é uma linha de base irregular e serrilhada. Como o ruído muscular tem amplitude e frequência variáveis, ele pode simular ondas f de fibrilação atrial, ondas F de flutter e, quando intenso, mascarar completamente o traçado, chegando a imitar taquicardia ventricular ou fibrilação ventricular no monitor.',
      },
      {
        titulo: 'Como reconhecer que é artefato',
        texto:
          'Três verificações resolvem quase todos os casos. Primeira: os complexos QRS continuam marchando por baixo do ruído, em intervalos regulares — marque-os com o paquímetro e veja se a cadência se mantém através do trecho “arrítmico”. Segunda: o ruído costuma afetar apenas algumas derivações, tipicamente as que envolvem o membro que treme, enquanto outras permanecem limpas; uma arritmia verdadeira aparece em todas. Terceira, e mais importante: olhe o paciente. Um paciente consciente, conversando e com pulso palpável não está em fibrilação ventricular. Essa checagem elementar já evitou incontáveis desfibrilações desnecessárias.',
      },
      {
        titulo: 'Prevenção e correção',
        texto:
          'Boa parte dos artefatos se resolve com técnica: aquecer o ambiente e cobrir o paciente, orientar relaxamento e respiração tranquila, apoiar bem os membros, reposicionar os eletrodos dos membros mais proximalmente (ombros e quadris) em pacientes com tremor, limpar a pele e usar eletrodos com gel adequado e dentro da validade, e evitar tração nos cabos. Filtros do aparelho podem reduzir o ruído, mas devem ser usados com parcimônia: filtros muito agressivos distorcem o segmento ST e a amplitude do QRS, e podem criar ou apagar achados diagnósticos. Repetir o exame com boa técnica é preferível a interpretar um traçado ruim.',
      },
    ],
    ondaAOnda: [
      { onda: 'Linha de base', achado: 'Oscilações irregulares de alta frequência e amplitude variável.' },
      { onda: 'QRS', achado: 'Preservados e marchando com regularidade por baixo do ruído — a chave do reconhecimento.' },
      { onda: 'Distribuição', achado: 'Ruído frequentemente restrito a algumas derivações, enquanto outras ficam limpas.' },
      { onda: 'Onda P e T', achado: 'Podem ficar irreconhecíveis, impedindo a análise do ritmo.' },
      { onda: 'Correlação clínica', achado: 'Paciente consciente com pulso normal exclui as arritmias imitadas.' },
    ],
    roteiro: [
      'Antes de tudo, olhe o paciente e cheque o pulso.',
      'Marque os QRS com o paquímetro e verifique se marcham regulares.',
      'Compare as derivações: o ruído está em todas ou só em algumas?',
      'Corrija a técnica: aqueça, relaxe, reposicione eletrodos, refaça o exame.',
      'Evite filtros agressivos que distorcem o ST.',
    ],
    separando: [
      { de: 'Fibrilação atrial', chave: 'Na FA os RR são irregulares; no artefato o RR permanece regular sob o ruído.' },
      { de: 'Flutter atrial', chave: 'O flutter tem ondas F regulares e periódicas; o artefato é caótico e não periódico.' },
      { de: 'Fibrilação ventricular', chave: 'Na FV não há QRS e o paciente está sem pulso.' },
      { de: 'Interferência elétrica', chave: 'A interferência da rede é perfeitamente regular, a 50 ou 60 Hz.' },
    ],
    fixacao: [
      'Trate o paciente, não o monitor.',
      'QRS marchando regular sob o ruído é a assinatura do artefato.',
      'Filtro em excesso apaga diagnóstico: prefira refazer com boa técnica.',
    ],
  },

  'mains-interference': {
    emUmaFrase:
      'Oscilação perfeitamente regular e uniforme superposta a todo o traçado, na frequência da rede elétrica (50 ou 60 Hz): interferência ambiental, não fenômeno biológico.',
    secoes: [
      {
        titulo: 'Origem física',
        texto:
          'Equipamentos ligados à rede elétrica criam campos eletromagnéticos que induzem correntes nos cabos e no corpo do paciente. Quando a impedância dos eletrodos é alta ou desigual entre eles, essa corrente induzida aparece no traçado como uma senoide contínua na frequência da rede — 60 Hz no Brasil e na maior parte das Américas, 50 Hz na Europa e em boa parte da Ásia. A distinção em relação ao artefato muscular é imediata: a interferência da rede é rigorosamente periódica, com amplitude e frequência constantes, enquanto o ruído muscular é irregular e variável. Em papel a 25 mm/s, uma oscilação de 60 Hz produz cerca de duas oscilações e meia por milímetro, formando uma faixa espessa e uniforme.',
      },
      {
        titulo: 'Por que atrapalha o diagnóstico',
        texto:
          'A senoide se soma a todas as ondas e pode: mascarar ondas P de baixa amplitude, impedindo a análise do ritmo; simular ondas f de fibrilação atrial ou ondas de flutter; espessar o traçado a ponto de tornar impossível medir com precisão o segmento ST e o intervalo QT; e criar entalhes falsos no QRS. Como as decisões clínicas mais importantes — reperfusão, anticoagulação, marca-passo — dependem exatamente desses detalhes, um traçado com interferência significativa deve ser repetido, e não interpretado com ressalvas.',
      },
      {
        titulo: 'Como eliminar',
        texto:
          'A solução é técnica e quase sempre eficaz: garantir bom contato dos eletrodos (limpar a pele com álcool, remover pelos quando necessário, usar eletrodos novos e com gel adequado), verificar o aterramento do equipamento, afastar cabos de fontes de energia e de outros aparelhos, desligar dispositivos próximos que não estejam em uso — bombas de infusão, aquecedores, ar-condicionado, celulares —, e evitar que os cabos fiquem tensionados ou cruzados com cabos de força. O filtro de rede (notch) do aparelho remove a frequência específica e é aceitável, mas o ideal é corrigir a causa: filtros sempre implicam alguma distorção do sinal, e um traçado limpo tecnicamente é sempre superior a um traçado filtrado.',
      },
    ],
    ondaAOnda: [
      { onda: 'Linha de base', achado: 'Oscilação senoidal perfeitamente regular a 50 ou 60 Hz, uniforme em todo o traçado.' },
      { onda: 'QRS', achado: 'Preservados, com marcha regular; podem parecer espessados ou entalhados.' },
      { onda: 'Onda P', achado: 'Frequentemente mascarada, prejudicando a análise do ritmo.' },
      { onda: 'Segmento ST e QT', achado: 'Medidas imprecisas — motivo suficiente para repetir o exame.' },
      { onda: 'Distribuição', achado: 'Costuma afetar todas as derivações de forma homogênea.' },
    ],
    roteiro: [
      'Reconheça a oscilação perfeitamente regular e uniforme.',
      'Diferencie do artefato muscular, que é irregular.',
      'Cheque contato dos eletrodos, gel, pele e aterramento.',
      'Afaste cabos e desligue equipamentos próximos.',
      'Repita o exame antes de tomar decisões baseadas em ST ou QT.',
    ],
    separando: [
      { de: 'Artefato muscular', chave: 'O muscular é irregular e variável; a interferência da rede é periódica e constante.' },
      { de: 'Flutter atrial', chave: 'As ondas F ocorrem a ~300 por minuto (5 Hz), muito mais lentas que 50–60 Hz.' },
      { de: 'Fibrilação atrial', chave: 'Na FA os RR são irregulares; aqui o ritmo subjacente permanece regular.' },
    ],
    fixacao: [
      'Regular e uniforme = rede elétrica. Irregular e variável = músculo.',
      'Nunca decida reperfusão com base em traçado cheio de interferência.',
      'Corrigir a causa é melhor que filtrar o sinal.',
    ],
  },

  'pacemaker-vvi': {
    emUmaFrase:
      'Espícula de estimulação seguida de QRS largo com morfologia de bloqueio de ramo esquerdo: um eletrodo no ventrículo direito, sem qualquer sincronia com o átrio.',
    secoes: [
      {
        titulo: 'O que significa o código VVI',
        texto:
          'O código de estimulação tem cinco letras, das quais três bastam para o dia a dia. A primeira indica a câmara estimulada, a segunda a câmara sentida e a terceira a resposta à detecção. VVI significa: estimula o ventrículo, sente o ventrículo e inibe-se quando detecta atividade ventricular própria — ou seja, só dispara se o coração não bater sozinho dentro do intervalo programado. Um R adicional (VVIR) indica resposta de frequência, com sensor que acelera a estimulação conforme a atividade física. O modo VVI é adequado sobretudo para pacientes em fibrilação atrial permanente com resposta lenta, situação em que não há atividade atrial organizada a ser sincronizada.',
      },
      {
        titulo: 'A leitura do traçado estimulado',
        texto:
          'Cada batimento estimulado começa com uma espícula — uma deflexão estreita e vertical, de duração muito curta — seguida imediatamente pelo QRS. Como o eletrodo fica na ponta do ventrículo direito, a ativação começa ali e se propaga para o ventrículo esquerdo por via muscular: o QRS é largo, com morfologia de bloqueio de ramo esquerdo e eixo superior. A repolarização acompanha, com ST e T discordantes do QRS — exatamente como no bloqueio de ramo esquerdo, e pelo mesmo motivo. Vale notar que dispositivos modernos com estimulação bipolar produzem espículas de amplitude muito pequena, às vezes difíceis de ver em algumas derivações; procurar em várias derivações evita concluir erroneamente que há ritmo próprio.',
      },
      {
        titulo: 'Os três problemas clássicos',
        texto:
          'Falha de captura: a espícula aparece, mas não é seguida de QRS — o estímulo não conseguiu despolarizar o miocárdio. Causas: deslocamento do eletrodo, fibrose na ponta, limiar aumentado, hipercalemia, isquemia, fratura do cabo ou bateria no fim. Falha de sensing (subdetecção): o aparelho não enxerga os batimentos próprios e dispara em momentos inadequados, com risco de estímulo sobre a onda T. Sobredetecção (oversensing): o aparelho interpreta ruído, miopotenciais ou a própria onda T como batimento e deixa de estimular, o que pode causar pausas em paciente dependente. Diante de qualquer suspeita, o caminho é radiografia de tórax, avaliação eletrônica do dispositivo e dosagem de potássio.',
      },
      {
        titulo: 'Isquemia e síndrome do marca-passo',
        texto:
          'Como no bloqueio de ramo esquerdo, o diagnóstico de infarto em ritmo estimulado exige critérios próprios: aplicam-se os critérios de Sgarbossa (supradesnivelamento concordante, infradesnivelamento em V1–V3 e supradesnivelamento discordante desproporcional), com desempenho aprimorado pela modificação de Smith usando a proporção ST/S. Outro conceito relevante do modo VVI é a síndrome do marca-passo: sem sincronia atrioventricular, o átrio pode contrair contra valvas fechadas, produzindo fadiga, tontura, pulsações cervicais, hipotensão e mal-estar. É uma das razões pelas quais a estimulação bicameral é preferida quando existe atividade atrial aproveitável.',
      },
    ],
    ondaAOnda: [
      { onda: 'Espícula', achado: 'Deflexão estreita e vertical precedendo o QRS; pode ser pequena em sistemas bipolares.' },
      { onda: 'QRS', achado: 'Largo, com morfologia de bloqueio de ramo esquerdo e eixo superior.' },
      { onda: 'ST e T', achado: 'Discordantes do QRS — esperado; use Sgarbossa para avaliar isquemia.' },
      { onda: 'Onda P', achado: 'Presente ou não, sem relação com os estímulos — não há sincronia atrioventricular.' },
      { onda: 'Frequência', achado: 'Igual ou superior à frequência mínima programada.' },
    ],
    roteiro: [
      'Localize as espículas em várias derivações.',
      'Verifique se cada espícula é seguida de QRS (captura).',
      'Verifique se o aparelho se inibe adequadamente diante de batimentos próprios (sensing).',
      'Avalie a morfologia: bloqueio de ramo esquerdo com eixo superior é o esperado.',
      'Diante de dor torácica, aplique os critérios de Sgarbossa.',
    ],
    separando: [
      { de: 'Bloqueio de ramo esquerdo', chave: 'Não há espícula precedendo o QRS.' },
      { de: 'Ritmo idioventricular', chave: 'Sem espículas e com frequência tipicamente entre 20 e 40 bpm.' },
      { de: 'Marca-passo bicameral', chave: 'Há duas espículas, uma atrial e uma ventricular, com sincronia AV.' },
      { de: 'Artefato', chave: 'Deflexões sem relação temporal fixa com os QRS.' },
    ],
    fixacao: [
      'Espícula + QRS largo com padrão de BRE = estimulação ventricular direita.',
      'Falha de captura, subdetecção e sobredetecção: os três problemas a procurar.',
      'Sgarbossa também vale para ritmo estimulado.',
    ],
  },

  'pacemaker-dual': {
    emUmaFrase:
      'Duas espículas por ciclo — uma antes da onda P e outra antes do QRS — restaurando a sequência atrioventricular fisiológica.',
    secoes: [
      {
        titulo: 'O modo DDD',
        texto:
          'DDD significa: estimula ambas as câmaras (átrio e ventrículo), sente ambas as câmaras e responde de forma dupla, inibindo-se ou deflagrando conforme o que detecta. Isso permite quatro comportamentos distintos no mesmo paciente, alternando batimento a batimento: estimulação atrial e ventricular (duas espículas); estimulação atrial com condução própria (espícula atrial seguida de QRS estreito); detecção atrial com estimulação ventricular (onda P própria seguida de espícula ventricular, o modo que preserva o comando sinusal em pacientes com bloqueio atrioventricular); e inibição completa quando o ritmo próprio é adequado. Reconhecer essa variabilidade evita interpretar como mau funcionamento aquilo que é comportamento programado.',
      },
      {
        titulo: 'Vantagens fisiológicas',
        texto:
          'A grande diferença em relação ao modo VVI é a preservação da sincronia atrioventricular. O átrio contrai antes do ventrículo, mantendo a contribuição atrial ao enchimento — algo em torno de 20% a 30% do volume, ainda mais relevante em corações com disfunção diastólica. Isso melhora o débito cardíaco, reduz a incidência de síndrome do marca-passo, diminui a ocorrência de fibrilação atrial e melhora a tolerância ao esforço, sobretudo quando associado a resposta de frequência (DDDR). Em contrapartida, a estimulação ventricular direita crônica e desnecessária pode induzir dessincronia e disfunção ventricular, e por isso os dispositivos modernos utilizam algoritmos que minimizam a estimulação ventricular quando a condução própria é possível.',
      },
      {
        titulo: 'Complicações específicas',
        texto:
          'A taquicardia mediada por marca-passo é a complicação mais característica do modo DDD: uma condução retrógrada do ventrículo para o átrio é detectada pelo eletrodo atrial, o dispositivo interpreta como atividade atrial legítima e dispara o ventrículo, que conduz retrogradamente de novo — criando um circuito de reentrada em que o aparelho é uma das pernas. O resultado é uma taquicardia regular na frequência máxima programada. O tratamento agudo é a aplicação de ímã, que converte o dispositivo para modo assíncrono e quebra o circuito; a prevenção definitiva é a reprogramação do período refratário atrial pós-ventricular. Outras situações a conhecer: comportamento de Wenckebach eletrônico e bloqueio 2:1 do dispositivo quando a frequência atrial ultrapassa o limite superior programado, e a mudança automática de modo (mode switch) diante de taquiarritmias atriais, que evita que o ventrículo seja estimulado em frequências altas durante fibrilação atrial.',
      },
    ],
    ondaAOnda: [
      { onda: 'Espícula atrial', achado: 'Precede a onda P estimulada, que costuma ter morfologia diferente da sinusal.' },
      { onda: 'Espícula ventricular', achado: 'Precede o QRS largo com morfologia de bloqueio de ramo esquerdo.' },
      { onda: 'Intervalo AV', achado: 'Constante e programado, reproduzindo o intervalo PR fisiológico.' },
      { onda: 'Variabilidade', achado: 'Batimentos podem alternar entre totalmente estimulados, parcialmente estimulados e próprios.' },
      { onda: 'Frequência', achado: 'Entre os limites inferior e superior programados; mode switch pode alterar o comportamento.' },
    ],
    roteiro: [
      'Procure espículas antes da P e antes do QRS.',
      'Meça o intervalo entre as duas espículas (intervalo AV programado).',
      'Verifique captura atrial e ventricular separadamente.',
      'Observe se o dispositivo se inibe adequadamente diante de batimentos próprios.',
      'Diante de taquicardia regular na frequência máxima, pense em taquicardia mediada por marca-passo.',
    ],
    separando: [
      { de: 'Marca-passo VVI', chave: 'Apenas uma espícula, ventricular, sem sincronia com o átrio.' },
      { de: 'Ritmo sinusal com bloqueio de ramo', chave: 'Ausência de espículas.' },
      { de: 'Taquicardia supraventricular', chave: 'Na taquicardia mediada por marca-passo, o ímã interrompe imediatamente.' },
      { de: 'Falha de captura', chave: 'Espícula presente sem despolarização correspondente da câmara.' },
    ],
    fixacao: [
      'Duas espículas por ciclo = estimulação bicameral.',
      'Sincronia AV preserva o kick atrial e evita a síndrome do marca-passo.',
      'Taquicardia regular na frequência máxima programada: aplique o ímã.',
    ],
  },

  'electrical-alternans': {
    emUmaFrase:
      'A amplitude do QRS alterna batimento a batimento porque o coração oscila dentro de um saco cheio de líquido: sinal clássico de derrame pericárdico volumoso e de tamponamento.',
    secoes: [
      {
        titulo: 'O coração pendular',
        texto:
          'Quando o saco pericárdico acumula líquido em quantidade suficiente, o coração perde suas amarras relativas e passa a balançar dentro dele, mudando de posição a cada ciclo — o fenômeno do swinging heart, visível ao ecocardiograma. Como a amplitude registrada em cada derivação depende da orientação do vetor cardíaco em relação ao eletrodo, essa mudança cíclica de posição produz variação alternada da amplitude do QRS: um batimento maior, o seguinte menor, e assim sucessivamente. Somam-se a isso dois outros achados do derrame volumoso: a baixa voltagem generalizada, porque o líquido funciona como isolante elétrico entre o coração e a parede torácica, e a taquicardia sinusal, mecanismo compensatório para manter o débito com volume sistólico reduzido.',
      },
      {
        titulo: 'Tamponamento é diagnóstico clínico',
        texto:
          'A alternância elétrica é sugestiva, mas o tamponamento cardíaco se diagnostica à beira do leito e pelo ecocardiograma. A tríade de Beck — hipotensão, turgência jugular e abafamento de bulhas — é clássica, embora incompleta em muitos casos. O sinal semiológico mais sensível é o pulso paradoxal: queda da pressão arterial sistólica maior que 10 mmHg durante a inspiração, decorrente da interdependência ventricular exagerada dentro do pericárdio distendido. Ao ecocardiograma, procuram-se derrame circunferencial, colapso diastólico do átrio direito e do ventrículo direito, variação respiratória exagerada dos fluxos transvalvares e veia cava inferior dilatada sem colapso inspiratório.',
      },
      {
        titulo: 'Conduta',
        texto:
          'O tratamento do tamponamento é a drenagem — pericardiocentese guiada por ecocardiograma ou, conforme a causa e o contexto, drenagem cirúrgica com janela pericárdica. Enquanto se prepara o procedimento, o paciente é dependente de pré-carga: administra-se volume e evita-se qualquer medida que reduza o retorno venoso; ventilação com pressão positiva pode precipitar colapso hemodinâmico e deve ser considerada com extrema cautela. As causas mais frequentes incluem neoplasia, pericardite (viral, bacteriana, tuberculose), uremia, doenças autoimunes, hipotireoidismo, complicações de procedimentos invasivos e trauma. Um diferencial importante do ponto de vista eletrocardiográfico é a alternância elétrica em taquicardia supraventricular — em que ela sugere AVRT por via acessória e não tem qualquer relação com derrame pericárdico.',
      },
    ],
    ondaAOnda: [
      { onda: 'QRS', achado: 'Amplitude alternando batimento a batimento — o achado que dá nome ao padrão.' },
      { onda: 'Voltagem', achado: 'Baixa de forma generalizada, pelo efeito isolante do líquido pericárdico.' },
      { onda: 'Ritmo', achado: 'Taquicardia sinusal quase sempre presente.' },
      { onda: 'Segmento ST', achado: 'Pode haver alterações de pericardite associada, com supra difuso e infra de PR.' },
      { onda: 'Onda P', achado: 'Em derrames muito volumosos, a alternância pode envolver P e T (alternância total).' },
    ],
    roteiro: [
      'Compare a altura dos QRS em batimentos consecutivos na mesma derivação.',
      'Verifique se há baixa voltagem generalizada e taquicardia.',
      'Avalie clinicamente: pressão, jugulares, bulhas e pulso paradoxal.',
      'Solicite ecocardiograma imediato.',
      'Prepare pericardiocentese; dê volume e evite reduzir a pré-carga.',
    ],
    separando: [
      { de: 'Artefato ou linha de base instável', chave: 'A alternância verdadeira é rigorosamente alternada e reprodutível em várias derivações.' },
      { de: 'Alternância em AVRT', chave: 'Ocorre durante taquicardia rápida e sugere via acessória, não derrame.' },
      { de: 'Baixa voltagem isolada', chave: 'Obesidade, DPOC, derrame pleural, mixedema e amiloidose reduzem voltagem sem alternância.' },
      { de: 'Bigeminismo', chave: 'No bigeminismo alternam-se morfologias diferentes (sinusal e ectópica), não apenas a amplitude.' },
    ],
    fixacao: [
      'Alternância elétrica + baixa voltagem + taquicardia = tríade eletrocardiográfica do derrame volumoso.',
      'Tamponamento é diagnóstico clínico e ecocardiográfico; o ECG apenas levanta a suspeita.',
      'Paciente dependente de pré-carga: volume sim, vasodilatador e pressão positiva com muito cuidado.',
    ],
  },
}
