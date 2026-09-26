import type { AchadoMarcado, DetalheCaso, EstruturaCaso, TipoMarcacao } from './casos-raio-x-detalhes'

const e = (nome: string, anatomia: string, normal: string, neste: string, alerta?: string): EstruturaCaso =>
  ({ nome, anatomia, normal, neste, alerta })
const m = (titulo: string, descricao: string, tipo: TipoMarcacao = 'achado'): AchadoMarcado => ({ titulo, descricao, tipo })

/**
 * Dossiê da segunda leva — tórax (infecções, doença difusa, pleura).
 * As "marcações" aqui não têm seta: descrevem onde procurar na radiografia única.
 */
export const DETALHES_LEVA_2_TORAX: Record<string, DetalheCaso> = {
  'pneumonia-lobar': {
    mecanismo: 'O exsudato inflamatório substitui o ar dos alvéolos por líquido de densidade de água. Como o lobo continua com o mesmo volume e os brônquios permanecem ventilados, a opacidade é homogênea, para exatamente na fissura e deixa os brônquios desenhados em preto no seu interior — o broncograma aéreo. É a assinatura do espaço aéreo cheio, não colapsado.',
    estruturas: [
      e('Fissura', 'Dobra de pleura visceral que separa os lobos; a menor é horizontal à direita, as oblíquas só aparecem no perfil.', 'Linha fina, quase invisível, na posição habitual.', 'Vira a borda reta e nítida da consolidação, sem se deslocar.', 'Fissura deslocada em direção à opacidade é colapso, não pneumonia.'),
      e('Brônquios segmentares', 'Ramos aéreos que atravessam o lobo até a periferia.', 'Invisíveis, porque ar dentro de ar não faz contraste.', 'Aparecem como ramificações escuras dentro da opacidade branca — o broncograma.', 'Broncograma também existe em edema, hemorragia e linfoma alveolar.'),
      e('Borda cardíaca e hemidiafragma', 'Interfaces entre o coração ou o diafragma e o pulmão aerado.', 'Contornos nítidos em todo o trajeto.', 'O contorno some onde a consolidação encosta nele — sinal da silhueta.', 'Borda direita apagada = lobo médio; hemidiafragma apagado = lobo inferior.'),
    ],
    marcacoes: {
      1: [
        m('Opacidade homogênea', 'Densidade uniforme, sem áreas de pulmão preservado no meio, ocupando um lobo.'),
        m('Limite na fissura', 'A borda inferior (ou superior) é reta e nítida — a fissura contendo o exsudato.'),
        m('Broncograma aéreo', 'Ramos escuros e afilados dentro da opacidade: brônquios ainda cheios de ar.'),
      ],
      2: [
        m('Fissura oblíqua no perfil', 'A consolidação para na fissura oblíqua, o que confirma o lobo acometido.'),
        m('Volume preservado', 'O lobo consolidado ocupa o espaço habitual; nada foi puxado.'),
      ],
    },
    conduta: 'Diagnóstico clínico-radiológico; hemocultura e escarro quando internado. Radiografia de controle em 6 semanas: consolidação que não some pede TC e broncoscopia — pode ser obstrução por tumor.',
  },
  broncopneumonia: {
    mecanismo: 'A infecção nasce nos bronquíolos terminais e se espalha para os ácinos vizinhos: cada foco é um pequeno lóbulo cheio de exsudato, separado de outros por pulmão normal. Como os brônquios estão cheios de pus, não há broncograma. A distribuição segue a árvore aérea — multifocal, bilateral, mais nas bases —, não a anatomia lobar.',
    estruturas: [
      e('Lóbulo pulmonar secundário', 'Menor unidade delimitada por septos, de 1 a 2 cm, com um bronquíolo no centro.', 'Invisível na radiografia normal.', 'Cada lóbulo infectado vira uma opacidade mal definida de 1 a 2 cm; a soma dá o padrão em manchas.', 'Confluência de lóbulos simula consolidação lobar.'),
      e('Bases pulmonares', 'Regiões inferiores, mais perfundidas e mais dependentes.', 'Mais densas que os ápices pela sobreposição de vasos.', 'Concentram os focos, dos dois lados.', 'Compare com o filme anterior: o que já estava lá não é broncopneumonia.'),
    ],
    marcacoes: {
      1: [
        m('Focos múltiplos', 'Opacidades nodulares ou em manchas, de bordas borradas, em mais de um lobo.'),
        m('Bilateralidade', 'Os dois pulmões acometidos, sem simetria perfeita.'),
        m('Sem broncograma', 'Os brônquios estão cheios de secreção e não contrastam.'),
      ],
    },
    conduta: 'Antibiótico de amplo espectro conforme o cenário (comunitário, hospitalar, aspirativo). Filme que piora sob tratamento: pense em derrame, abscesso ou germe resistente — TC.',
  },
  'lobo-abaulado-klebsiella': {
    mecanismo: 'A resposta inflamatória muito exsudativa aumenta o volume do lobo: o exsudato empurra a fissura para o lobo vizinho e ela fica convexa. É o inverso mecânico do colapso. Klebsiella é o germe clássico porque produz uma cápsula mucoide volumosa; pneumococo também faz.',
    estruturas: [
      e('Fissura menor', 'Separa o lobo superior direito do médio; horizontal, ao nível do hilo direito.', 'Reta ou discretamente côncava para cima.', 'Abaulada para baixo, convexa, pelo lobo superior "inchado".', 'Só existe à direita — o sinal não pode ser descrito no pulmão esquerdo.'),
      e('Parênquima do lobo superior direito', 'Segmentos apical, anterior e posterior.', 'Transparente, com vasos afilando para a periferia.', 'Consolidado, denso, frequentemente com áreas de necrose e cavitação.', 'Necrose central com nível hidroaéreo = abscesso em formação.'),
    ],
    marcacoes: {
      1: [
        m('Fissura convexa', 'O limite inferior da consolidação, em vez de reto, faz uma curva para baixo.'),
        m('Consolidação densa', 'Opacidade mais branca que a pneumonia comum, pelo volume de exsudato.'),
        m('Cavitação', 'Procure áreas lucentes irregulares dentro da opacidade.'),
      ],
    },
    conduta: 'Pneumonia grave: internação, cobertura para Klebsiella (e para anaeróbios se aspiração), TC se houver suspeita de abscesso ou empiema.',
  },
  'abscesso-pulmonar': {
    mecanismo: 'A necrose liquefativa do parênquima infectado se comunica com um brônquio; parte do conteúdo é expectorada e entra ar. Forma-se uma cavidade com nível hidroaéreo cercada por parede de tecido inflamatório, espessa e irregular no início. A localização em segmentos dependentes conta a história: aspiração em decúbito.',
    estruturas: [
      e('Cavidade', 'Espaço aéreo patológico dentro de uma consolidação.', 'Não existe.', 'Redonda, com nível horizontal e parede espessa (> 4 mm) e irregular.', 'Parede fina e lisa é cisto ou bolha infectada; parede nodular é tumor.'),
      e('Ângulo com a pleura', 'Geometria do contato entre a lesão e a parede torácica.', '—', 'Agudo: a lesão é intrapulmonar e "afasta-se" da pleura.', 'Empiema faz ângulo obtuso e forma lenticular.'),
    ],
    marcacoes: {
      1: [
        m('Nível hidroaéreo', 'Linha horizontal separando o líquido (embaixo) do ar (em cima) dentro da cavidade.'),
        m('Parede espessa', 'Anel de tecido denso ao redor da cavidade, de espessura irregular.'),
        m('Consolidação ao redor', 'Pneumonia que deu origem ao abscesso, envolvendo a cavidade.'),
      ],
      2: [
        m('Mesmo diâmetro no perfil', 'O abscesso é esférico: mede o mesmo nas duas incidências.'),
        m('Segmento dependente', 'Segmento posterior do superior ou superior do inferior — a topografia da aspiração.'),
      ],
    },
    conduta: 'Antibiótico prolongado (semanas) com cobertura para anaeróbios; drenagem postural. TC se não melhorar em 2 semanas; broncoscopia para excluir obstrução em fumante.',
  },
  'tuberculose-primaria': {
    mecanismo: 'No primeiro contato, o bacilo se multiplica no foco pulmonar e viaja pelos linfáticos até o hilo: a resposta imune ainda não contém a infecção e o linfonodo cresce. Consolidação inespecífica + adenopatia ipsilateral é a combinação que separa da pneumonia comum, que não faz adenopatia.',
    estruturas: [
      e('Linfonodos hilares e paratraqueais', 'Cadeias que drenam o pulmão, ao lado dos brônquios principais e da traqueia.', 'Não fazem borda; o hilo tem contorno côncavo e densidade de vasos.', 'Hilo denso e lobulado, ou faixa paratraqueal direita alargada, do lado da consolidação.', 'Em criança, o timo e os vasos podem parecer adenopatia — compare os lados.'),
      e('Foco de Ghon', 'Consolidação parenquimatosa do primeiro contato.', '—', 'Opacidade em qualquer lobo, frequentemente subpleural, sem cavitação.', 'Cicatriza como nódulo calcificado.'),
    ],
    marcacoes: {
      1: [
        m('Consolidação parenquimatosa', 'Opacidade de espaço aéreo em qualquer lobo — a localização não ajuda.'),
        m('Adenopatia ipsilateral', 'Hilo do mesmo lado maior e mais denso, com contorno convexo.'),
        m('Derrame associado', 'Procure o seio costofrênico apagado do mesmo lado.'),
      ],
    },
    conduta: 'Escarro (baciloscopia, teste molecular) e, em criança, lavado gástrico; tratamento com quatro drogas. Radiografia de controle mostra a calcificação em meses.',
  },
  'tuberculose-pos-primaria': {
    mecanismo: 'Com imunidade prévia, a reativação provoca necrose caseosa intensa nos segmentos mais ventilados e menos perfundidos — ápices e segmentos posteriores. A caseificação drena para o brônquio e deixa cavidades; o material aspirado semeia outros segmentos (disseminação broncogênica). Fibrose e retração vêm com o tempo.',
    estruturas: [
      e('Segmento apicoposterior', 'Topo do lobo superior, atrás da clavícula.', 'Transparente; a clavícula e a primeira costela se sobrepõem.', 'Opacidades heterogêneas e cavidade de parede fina ou espessa.', 'A clavícula esconde: peça incidência apicolordótica.'),
      e('Cavidade tuberculosa', 'Espaço resultante da eliminação do cáseo.', '—', 'Sem nível hidroaéreo na maioria (o conteúdo é sólido), cercada de nódulos.', 'Cavidade residual pode abrigar aspergiloma.'),
    ],
    marcacoes: {
      1: [
        m('Cavidade apical', 'Área lucente arredondada no ápice, com parede visível, geralmente sem nível.'),
        m('Opacidades fibronodulares', 'Nódulos e estrias ao redor da cavidade e no segmento posterior.'),
        m('Disseminação broncogênica', 'Nódulos pequenos no lobo inferior contralateral — cáseo aspirado.'),
      ],
    },
    conduta: 'Isolamento respiratório, escarro seriado e teste molecular, tratamento padrão. Controle com radiografia aos 2 e 6 meses; a cavidade pode persistir como sequela.',
  },
  'tuberculose-miliar': {
    mecanismo: 'Bacilos que entram na corrente sanguínea se distribuem pelos capilares de todo o pulmão e formam granulomas do mesmo tamanho ao mesmo tempo. Por isso os nódulos são uniformes e sem predomínio zonal — o oposto das metástases hematogênicas, que chegam em ondas e crescem em ritmos diferentes.',
    estruturas: [
      e('Interstício perivascular', 'Bainha de tecido conjuntivo ao redor dos capilares e arteríolas.', 'Invisível.', 'Recheado de granulomas de 1 a 3 mm, que somados dão o aspecto granuloso.', 'No início, o filme pode parecer só "mal exposto".'),
      e('Ápices e bases', 'Extremos do pulmão.', 'Ápices menos perfundidos.', 'Acometidos igualmente — a distribuição hematogênica ignora a gravidade.', 'Predomínio basal sugere metástases; apical, silicose ou sarcoidose.'),
    ],
    marcacoes: {
      1: [
        m('Micronódulos difusos', 'Pontos de 1 a 3 mm, incontáveis, dos dois lados.'),
        m('Uniformidade', 'Todos do mesmo tamanho — chegaram juntos pelo sangue.'),
        m('Mediastino normal', 'Sem adenopatia obrigatória e sem derrame.'),
      ],
      2: [
        m('Tamanho dos nódulos', 'Cada ponto mede o de um grão de milheto; nenhum passa de 3 mm.'),
      ],
    },
    conduta: 'Emergência em imunossuprimido: tratamento empírico antes da confirmação, fundo de olho (tubérculos coroidais), hemocultura para micobactéria e busca de meningite.',
  },
  'sequela-de-tuberculose': {
    mecanismo: 'A cura deixa fibrose no lugar da inflamação: a fibrose retrai, puxa o hilo para cima, espessa a pleura apical e dilata os brônquios por tração. Os granulomas calcificam por deposição distrófica de cálcio no cáseo. Nada disso tem atividade — e a estabilidade em exames sucessivos é o que prova.',
    estruturas: [
      e('Hilo', 'Confluência de vasos e brônquios no centro do pulmão.', 'O esquerdo fica 1 a 2 cm mais alto que o direito.', 'Puxado para cima do lado da fibrose apical, invertendo a relação.', 'Hilo elevado por fibrose não é adenopatia.'),
      e('Granulomas calcificados', 'Nódulos densos no parênquima e nos linfonodos.', '—', 'Pequenos, muito densos, de bordas nítidas; imóveis ao longo dos anos.', 'Calcificação excêntrica num nódulo que cresce: pode ser tumor englobando o granuloma.'),
    ],
    marcacoes: {
      1: [
        m('Fibrose apical', 'Estrias e retração no ápice, com espessamento pleural.'),
        m('Hilo elevado', 'O hilo do lado afetado está mais alto que o esperado.'),
        m('Calcificações', 'Nódulos densos no parênquima e no hilo — complexo de Ranke.'),
      ],
    },
    conduta: 'Nenhum tratamento; documentar como sequela e comparar com filme anterior. Sintomas novos, cavidade com conteúdo ou nódulo que cresce merecem escarro e TC.',
  },
  empiema: {
    mecanismo: 'Pus no espaço pleural deposita fibrina que sela compartimentos e prende o líquido: a coleção deixa de obedecer à gravidade e assume forma lenticular. A fístula broncopleural introduz ar e cria o nível, mas a geometria da coleção — alongada — faz o nível medir diferente em cada incidência.',
    estruturas: [
      e('Espaço pleural', 'Fenda virtual entre pleura visceral e parietal.', 'Invisível.', 'Ocupado por coleção lenticular de base ampla contra a parede.', 'Coleção lenticular também pode ser hemotórax organizado ou tumor pleural.'),
      e('Ângulo com a parede torácica', 'Interface entre a coleção e a parede.', '—', 'Obtuso: a lesão "se afasta" suavemente da parede — origem pleural.', 'Ângulo agudo = lesão intrapulmonar.'),
    ],
    marcacoes: {
      1: [
        m('Coleção lenticular', 'Opacidade de bordas convexas para o pulmão, encostada na parede torácica.'),
        m('Ângulos obtusos', 'A transição com a parede é suave — lesão pleural.'),
        m('Nível hidroaéreo', 'Se houver fístula: linha horizontal dentro da coleção.'),
      ],
      2: [
        m('Nível de outro comprimento', 'No perfil, o nível mede diferente do PA — a coleção é alongada, não esférica.'),
      ],
    },
    conduta: 'Toracocentese diagnóstica e drenagem torácica imediata; TC com contraste para loculações e decisão de fibrinolítico ou decorticação.',
  },
  'pneumonia-por-aspiracao': {
    mecanismo: 'Conteúdo gástrico ou orofaríngeo cai nos segmentos que estão em posição dependente no momento da aspiração. O ácido causa pneumonite química em horas; a flora oral (anaeróbios, estreptococos) causa pneumonia bacteriana em dias. A topografia é a assinatura: posterior em quem estava deitado, basal em quem estava sentado, mais à direita sempre.',
    estruturas: [
      e('Brônquio principal direito', 'Mais curto, largo e vertical que o esquerdo.', 'Continuação quase reta da traqueia.', 'Recebe a maior parte do material aspirado — por isso o predomínio à direita.', 'Aspiração bilateral é comum em grandes volumes.'),
      e('Segmentos dependentes', 'Posteriores dos lobos superiores e superiores dos inferiores (decúbito); basais posteriores (sentado).', '—', 'Consolidação que aparece em horas.', 'No filme frontal, o segmento superior do inferior projeta-se sobre o hilo e passa despercebido.'),
    ],
    marcacoes: {
      1: [
        m('Consolidação basal direita', 'Opacidade no lobo inferior direito, posterior, em paciente com fator de risco.'),
        m('Distribuição dependente', 'A opacidade segue a gravidade, não um lobo inteiro.'),
        m('Evolução rápida', 'Surgiu horas após o evento — pneumonite química.'),
      ],
    },
    conduta: 'Suporte e observação nas primeiras 48 h (a pneumonite pode resolver sem antibiótico); antibiótico se febre persistente ou piora; TC se abscesso ou empiema.',
  },
  pneumocistose: {
    mecanismo: 'O fungo prolifera nos alvéolos e provoca exsudato espumoso e espessamento septal difuso. O envolvimento começa nos hilos e avança para a periferia; não há necrose nem reação linfonodal, por isso não há derrame nem adenopatia. A destruição das paredes alveolares nos lobos superiores forma cistos que rompem.',
    estruturas: [
      e('Região peri-hilar', 'Parênquima ao redor dos hilos, nos campos médios.', 'Vasos e brônquios bem definidos.', 'Velados por opacidade tênue e granular que borra os vasos — vidro fosco.', 'Edema cardiogênico tem o mesmo padrão em asa de borboleta.'),
      e('Periferia e bases', 'Regiões subpleurais.', 'Transparentes.', 'Relativamente poupadas no início.', 'Envolvimento difuso na fase tardia apaga essa diferença.'),
    ],
    marcacoes: {
      1: [
        m('Vidro fosco peri-hilar', 'Opacidade tênue e simétrica ao redor dos hilos, com vasos ainda visíveis.'),
        m('Periferia poupada', 'As bordas do pulmão estão mais transparentes que o centro.'),
        m('Sem derrame ou adenopatia', 'Seios costofrênicos livres, hilos de contorno normal.'),
      ],
    },
    conduta: 'Sulfametoxazol-trimetoprima em dose alta, corticoide se PaO2 < 70 mmHg; TC de alta resolução e lavado broncoalveolar quando o filme é normal e a hipoxemia persiste.',
  },
  aspergiloma: {
    mecanismo: 'Numa cavidade preexistente, o Aspergillus cresce como uma bola de hifas livre, sem invadir a parede. Entre a bola e a parede sobra ar, que fica sempre no ponto mais alto — o crescente muda de posição quando o paciente muda de decúbito. A hemoptise vem da neovascularização da parede da cavidade.',
    estruturas: [
      e('Cavidade antiga', 'Espaço aéreo residual de tuberculose, sarcoidose ou bronquiectasia.', '—', 'Parede espessada, com massa densa e móvel no interior.', 'Cavidade que não existia antes pede outro diagnóstico.'),
      e('Crescente aéreo', 'Ar entre a bola fúngica e a parede.', '—', 'Meia-lua lucente superior em pé, que se desloca ao deitar.', 'Crescente em imunodeprimido neutropênico é aspergilose invasiva em recuperação.'),
    ],
    marcacoes: {
      1: [
        m('Massa dentro da cavidade', 'Opacidade arredondada, densa, dentro de um espaço aéreo apical.'),
        m('Crescente aéreo', 'Meia-lua escura entre a massa e a parede, na parte superior.'),
        m('Espessamento pleural', 'Pleura apical adjacente espessada — reação à cavidade crônica.'),
      ],
    },
    conduta: 'Vigilância se assintomático; hemoptise maciça exige embolização de artérias brônquicas e, se possível, ressecção. Antifúngico sistêmico tem eficácia limitada.',
  },
  bronquiectasias: {
    mecanismo: 'Infecção e inflamação repetidas destroem o músculo e a cartilagem da parede brônquica; o brônquio dilata, perde o afilamento e enche de secreção. A perda de volume dos lobos afetados aproxima os brônquios uns dos outros. Só os brônquios de 3 a 5 mm ou mais ficam visíveis na radiografia.',
    estruturas: [
      e('Brônquios segmentares', 'Ramos que acompanham as artérias até a periferia.', 'Afilam progressivamente; invisíveis além do hilo.', 'Dilatados, com paredes espessas: trilhos de trem de lado e anéis de frente.', 'Brônquio maior que a artéria vizinha = bronquiectasia (sinal do anel de sinete, na TC).'),
      e('Lobos inferiores', 'Regiões dependentes, onde a secreção estagna.', '—', 'Mais acometidos; perda de volume com hemidiafragma elevado.', 'Predomínio superior aponta para fibrose cística ou tuberculose.'),
    ],
    marcacoes: {
      1: [
        m('Trilhos de trem', 'Duas linhas paralelas espessas que não afilam — brônquio dilatado visto de lado.'),
        m('Anéis', 'Círculos de parede grossa — brônquio dilatado visto de frente.'),
        m('Dedo de luva', 'Opacidade tubular ramificada: brônquio cheio de secreção.'),
      ],
    },
    conduta: 'TC de alta resolução confirma e mapeia; investigar causa (fibrose cística, imunodeficiência, discinesia, sequela); fisioterapia respiratória e antibiótico nas exacerbações.',
  },
  'covid-19': {
    mecanismo: 'O vírus lesa o epitélio alveolar e o endotélio, provocando dano alveolar difuso de predomínio periférico e basal. O exsudato parcial produz vidro fosco; a organização posterior, consolidação e bandas. A pleura e os linfonodos não participam, e o coração não está doente — por isso sem derrame, sem adenopatia, sem cardiomegalia.',
    estruturas: [
      e('Periferia subpleural', 'Faixa de parênquima junto à pleura visceral.', 'Transparente, quase sem vasos visíveis.', 'Opacidades em vidro fosco ou consolidação, bilaterais, poupando os hilos.', 'Edema cardiogênico é central; COVID é periférico.'),
      e('Bases', 'Lobos inferiores.', '—', 'Mais acometidos, com progressão para os campos médios na segunda semana.', 'Consolidação lobar única não é COVID típico.'),
    ],
    marcacoes: {
      1: [
        m('Opacidades periféricas', 'Manchas de vidro fosco ou consolidação encostadas na pleura, dos dois lados.'),
        m('Predomínio basal', 'Mais denso nos lobos inferiores.'),
        m('Sem derrame nem adenopatia', 'Seios costofrênicos e hilos preservados.'),
      ],
    },
    conduta: 'Teste molecular; TC só quando muda a conduta (dúvida diagnóstica, embolia). Radiografia seriada para complicações: pneumotórax, pneumomediastino, derrame por coinfecção.',
  },
  'fibrose-pulmonar-idiopatica': {
    mecanismo: 'Fibroblastos depositam colágeno no interstício subpleural e basal, destroem a arquitetura alveolar e formam cistos de favo de mel. O tecido fibrótico encolhe: os volumes caem, as cúpulas sobem e os brônquios são puxados (bronquiectasias de tração). O padrão histológico é a pneumonia intersticial usual.',
    estruturas: [
      e('Interstício subpleural basal', 'Tecido de sustentação junto à pleura nos lobos inferiores.', 'Invisível.', 'Reticulado grosseiro com cistos de 3 a 10 mm justapostos — favo de mel.', 'Insuficiência cardíaca faz linhas finas basais que mudam com diurético.'),
      e('Volumes pulmonares', 'Altura do pulmão da cúpula ao ápice.', 'Cúpula direita na 6ª costela anterior em inspiração.', 'Reduzidos: cúpulas altas, costelas próximas, coração relativamente grande.', 'Enfisema associado pode normalizar os volumes e mascarar.'),
    ],
    marcacoes: {
      1: [
        m('Reticulado basal', 'Rede de linhas grosseiras nas bases, mais na periferia.'),
        m('Faveolamento', 'Pequenos cistos agrupados, de paredes espessas, subpleurais.'),
        m('Pulmões pequenos', 'Cúpulas altas e costelas aproximadas — perda de volume.'),
      ],
    },
    conduta: 'TC de alta resolução; padrão típico de UIP dispensa biópsia. Antifibróticos (pirfenidona, nintedanibe), oxigênio, avaliação para transplante; excluir causas (asbesto, colagenose, fármacos).',
  },
  sarcoidose: {
    mecanismo: 'Granulomas não caseosos proliferam primeiro nos linfonodos hilares e mediastinais e depois ao longo dos linfáticos pulmonares — que correm pelos feixes broncovasculares, septos e pleura. Daí a sequência: adenopatia, nódulos perilinfáticos, reticulado, fibrose apical. A simetria é a marca.',
    estruturas: [
      e('Hilos', 'Vasos, brônquios e linfonodos no centro de cada pulmão.', 'Contorno côncavo lateral, densidade de vasos, esquerdo um pouco mais alto.', 'Convexos, lobulados e densos, simetricamente — adenopatia.', 'Linfoma é assimétrico e cresce no mediastino anterior.'),
      e('Linfonodos paratraqueais direitos', 'Cadeia ao longo da traqueia, dentro da faixa paratraqueal.', 'Faixa < 3 mm.', 'Faixa alargada — o "1" da tríade de Garland.', '—'),
    ],
    marcacoes: {
      1: [
        m('Adenopatia hilar bilateral', 'Os dois hilos aumentados, lobulados e simétricos.'),
        m('Adenopatia paratraqueal', 'Faixa paratraqueal direita alargada.'),
        m('Parênquima', 'Procure micronódulos e reticulado nos campos médios e superiores.'),
      ],
    },
    conduta: 'Estadiar (0 a IV); biópsia (linfonodo por EBUS ou lesão acessível) quando o quadro não é típico; corticoide só se sintomas ou envolvimento extrapulmonar relevante. Muitos regridem espontaneamente.',
  },
  silicose: {
    mecanismo: 'Partículas de sílica engolidas por macrófagos os matam e desencadeiam fibrose nodular concêntrica, que se acumula nos lobos superiores (menor drenagem linfática). Os linfonodos que recebem a sílica calcificam na periferia. A confluência dos nódulos forma massas de fibrose, que se retraem para os hilos e deixam enfisema ao redor.',
    estruturas: [
      e('Lobos superiores', 'Metade superior de cada pulmão.', 'Menos vascularizados, mais transparentes.', 'Semeados de nódulos de 2 a 5 mm, bem definidos, alguns calcificados.', 'Sarcoidose e tuberculose miliar entram no diferencial.'),
      e('Linfonodos hilares', 'Cadeias no hilo.', 'Invisíveis.', 'Calcificação em anel na periferia — casca de ovo.', 'Casca de ovo também em sarcoidose tratada e após radioterapia, mas é rara fora da silicose.'),
    ],
    marcacoes: {
      1: [
        m('Nódulos superiores', 'Pequenos nódulos bem delimitados nos campos superiores e médios.'),
        m('Casca de ovo', 'Anéis calcificados nos hilos.'),
        m('Massas conglomeradas', 'Opacidades grandes, simétricas, próximas ao mediastino — fibrose maciça.'),
      ],
    },
    conduta: 'Afastamento da exposição, notificação como doença ocupacional, rastreio de tuberculose (PPD/IGRA) e de câncer de pulmão; sem tratamento específico.',
  },
  'asbestose-placas-pleurais': {
    mecanismo: 'Fibras de asbesto migram até a pleura parietal e induzem placas de colágeno hialino que calcificam após 20 a 30 anos. No parênquima, a fibrose intersticial basal (asbestose) segue o mesmo padrão da FPI. As placas são marcador de exposição; a fibrose é a doença.',
    estruturas: [
      e('Pleura parietal diafragmática', 'Reveste a face superior das cúpulas.', 'Invisível.', 'Placas calcificadas em folha sobre as cúpulas — quase patognomônicas.', 'Calcificação de um único lado é sequela de empiema ou hemotórax.'),
      e('Pleura parietal lateral', 'Face interna das costelas.', 'Invisível.', 'Placas em faixa quando vistas de perfil, em manchas irregulares quando de frente.', 'Placa de frente parece nódulo pulmonar.'),
    ],
    marcacoes: {
      1: [
        m('Placas nas cúpulas', 'Calcificações lineares sobre os hemidiafragmas.'),
        m('Placas laterais', 'Opacidades densas, irregulares, projetadas sobre os campos pulmonares — de frente.'),
        m('Reticulado basal', 'Se presente, é a asbestose propriamente dita.'),
      ],
    },
    conduta: 'História ocupacional; TC para caracterizar fibrose e rastrear mesotelioma e câncer; espirometria; notificação.',
  },
  'linfangite-carcinomatosa': {
    mecanismo: 'Células tumorais embolizam para os linfáticos pulmonares (ou os invadem por via retrógrada a partir dos linfonodos hilares) e os obstruem. O interstício septal e peribroncovascular incha de linfa e de tumor: linhas de Kerley, reticulado e espessamento hilar, num padrão que não obedece à simetria hidrostática do edema cardíaco.',
    estruturas: [
      e('Septos interlobulares', 'Paredes de tecido conjuntivo entre lóbulos, onde correm os linfáticos.', 'Invisíveis.', 'Espessados por tumor e linfa — linhas B de Kerley, mas assimétricas.', 'Edema cardiogênico faz Kerley simétricas e com coração grande.'),
      e('Silhueta cardíaca', 'Coração e grandes vasos.', 'ICT < 50%.', 'Normal — o coração não participa.', 'Coração normal com "edema" unilateral é a pista.'),
    ],
    marcacoes: {
      1: [
        m('Reticulado assimétrico', 'Linhas septais mais evidentes em um pulmão ou lobo.'),
        m('Linhas de Kerley B', 'Traços curtos e horizontais na periferia das bases.'),
        m('Hilo aumentado e derrame', 'Do mesmo lado do reticulado.'),
      ],
    },
    conduta: 'TC de alta resolução (espessamento nodular dos septos); confirma-se por citologia do lavado ou biópsia transbrônquica. Prognóstico reservado; tratamento é o do tumor primário.',
  },
  sdra: {
    mecanismo: 'A lesão inflamatória da barreira alvéolo-capilar deixa passar líquido rico em proteína para os alvéolos, sem aumento da pressão hidrostática. O padrão é alveolar, bilateral e difuso, sem os sinais de hipertensão venosa (redistribuição, Kerley, coração grande). A fase proliferativa e fibrótica muda o padrão para reticular.',
    estruturas: [
      e('Espaço alveolar', 'Unidades de troca gasosa.', 'Cheias de ar — pulmão escuro.', 'Cheias de exsudato — opacidades confluentes bilaterais, com broncogramas.', 'Broncopneumonia bilateral é idêntica; a história decide.'),
      e('Silhueta cardíaca e pedículo vascular', 'Coração e vasos mediastinais.', 'Normais.', 'Normais — o que separa da causa cardíaca.', 'No ventilado com balanço hídrico positivo, os dois mecanismos se somam.'),
    ],
    marcacoes: {
      1: [
        m('Opacidades bilaterais difusas', 'Consolidação e vidro fosco em todos os campos, dos dois lados.'),
        m('Coração normal', 'Silhueta de tamanho normal, sem redistribuição vascular.'),
        m('Sem derrame', 'Seios costofrênicos livres ou com lâmina mínima.'),
      ],
    },
    conduta: 'Ventilação protetora (volume corrente baixo, PEEP), posição prona nos graves, tratar a causa. Ecocardiograma para excluir componente cardiogênico; TC se dúvida ou complicação.',
  },
  'enfisema-dpoc': {
    mecanismo: 'A destruição dos septos alveolares reduz a superfície de troca e a retração elástica: o ar fica preso, o pulmão aumenta e a pressão intratorácica empurra o diafragma para baixo e o coração para a vertical. Bolhas são espaços aéreos > 1 cm de parede fina. A oligoemia periférica reflete a perda de capilares.',
    estruturas: [
      e('Cúpulas diafragmáticas', 'Músculo em cúpula que separa tórax e abdome.', 'Cúpula direita no nível da 6ª costela anterior, convexa.', 'Achatadas ou invertidas, abaixo da 7ª costela anterior.', 'Inspiração forçada em pessoa jovem também baixa o diafragma — olhe a forma, não só a altura.'),
      e('Espaço retroesternal', 'Área entre o esterno e a aorta ascendente no perfil.', '< 2,5 cm de profundidade.', 'Alargado (> 2,5 cm) pelo lobo superior hiperinsuflado.', '—'),
    ],
    marcacoes: {
      1: [
        m('Cúpulas achatadas', 'Hemidiafragmas baixos e planos, abaixo da 7ª costela anterior.'),
        m('Coração em gota', 'Silhueta estreita e vertical.'),
        m('Bolhas', 'Áreas sem vasos delimitadas por linha fina, mais nos ápices.'),
      ],
      2: [
        m('Espaço retroesternal alargado', 'Área lucente atrás do esterno maior que 2,5 cm.'),
        m('Diafragma plano no perfil', 'Cúpulas retificadas vistas de lado.'),
      ],
    },
    conduta: 'Espirometria confirma obstrução; TC quantifica o enfisema e rastreia câncer em fumantes; cessação do tabagismo, broncodilatadores, reabilitação, oxigênio se hipoxemia.',
  },
  'fibrose-cistica': {
    mecanismo: 'O defeito do canal CFTR desidrata o muco, que obstrui os brônquios e cria infecção crônica (Pseudomonas, estafilococo); a inflamação destrói a parede brônquica e forma bronquiectasias, predominantes nos lobos superiores por razões de drenagem e ventilação. O aprisionamento de ar hiperinsufla o pulmão.',
    estruturas: [
      e('Brônquios dos lobos superiores', 'Ramos aéreos das regiões apicais.', 'Invisíveis além do hilo.', 'Dilatados, de paredes espessas, muitos cheios de muco.', 'Bronquiectasias basais sugerem outra causa.'),
      e('Hilos', 'Centro do pulmão.', 'Contorno côncavo.', 'Proeminentes por adenopatia reacional e artérias pulmonares dilatadas.', 'Hilo grande em jovem com bronquiectasias: pense em FC antes de linfoma.'),
    ],
    marcacoes: {
      1: [
        m('Bronquiectasias superiores', 'Anéis e trilhos nos campos superiores, dos dois lados.'),
        m('Rolhas de muco', 'Opacidades tubulares ramificadas — dedos de luva.'),
        m('Hiperinsuflação', 'Cúpulas baixas e pulmões grandes.'),
      ],
    },
    conduta: 'Teste do suor e genotipagem; TC de alta resolução para estadiar; fisioterapia, antibiótico inalado, moduladores de CFTR; vigilância de pneumotórax e hemoptise.',
  },
  'nodulo-pulmonar-solitario': {
    mecanismo: 'Qualquer processo focal com densidade de água num pulmão cheio de ar aparece como nódulo: granuloma cicatrizado, hamartoma, carcinoma inicial, metástase única. A borda reflete o crescimento (expansivo e liso versus infiltrativo e espiculado), a calcificação reflete a idade e a natureza, e o crescimento no tempo é a única prova de malignidade sem biópsia.',
    estruturas: [
      e('Borda do nódulo', 'Interface com o parênquima.', '—', 'Lisa e regular sugere benigno; lobulada, espiculada ou com "coroa" sugere maligno.', 'Carcinoma inicial pode ser liso; a borda sozinha não decide.'),
      e('Calcificação', 'Cálcio dentro do nódulo.', '—', 'Central, laminar, difusa ou em pipoca são padrões benignos.', 'Excêntrica ou pontilhada não protege.'),
    ],
    marcacoes: {
      1: [
        m('Nódulo único', 'Opacidade arredondada menor que 3 cm, cercada de pulmão normal.'),
        m('Borda', 'Descreva: lisa, lobulada ou espiculada.'),
        m('Densidade', 'Procure calcificação e seu padrão.'),
      ],
      2: [
        m('Detalhe da borda', 'Ampliação: espículas finas irradiando para o parênquima ou contorno liso.'),
      ],
    },
    conduta: 'Buscar exame antigo; TC com medidas; seguir o protocolo Fleischner por tamanho e risco; PET-TC e biópsia para nódulos sólidos > 8 mm com risco. Estável por 2 anos = benigno.',
  },
  'hamartoma-pulmonar': {
    mecanismo: 'Cartilagem, gordura e tecido fibroso crescem de forma desorganizada mas benigna, formando um nódulo bem encapsulado que cresce muito lentamente. A cartilagem calcifica em conglomerados irregulares — a pipoca. A gordura, quando presente, é a outra assinatura (visível só na TC).',
    estruturas: [
      e('Matriz condroide', 'Cartilagem dentro do nódulo.', '—', 'Calcificação grosseira, em grumos irregulares, central.', 'Condrossarcoma metastático calcifica de forma parecida — história.'),
      e('Borda', 'Interface com o pulmão.', '—', 'Lisa, bem delimitada, às vezes lobulada.', 'Espiculação não é hamartoma.'),
    ],
    marcacoes: {
      1: [
        m('Nódulo bem delimitado', 'Opacidade redonda ou lobulada, de borda nítida, periférica.'),
        m('Calcificação em pipoca', 'Grumos densos e irregulares no interior.'),
        m('Estabilidade', 'Compare com exame antigo: crescimento lento ou nulo.'),
      ],
    },
    conduta: 'TC confirma gordura e calcificação; se típico, acompanhar. Biópsia ou ressecção se o padrão for atípico ou o nódulo crescer.',
  },
  'metastases-em-bala-de-canhao': {
    mecanismo: 'Êmbolos tumorais chegam pelas artérias pulmonares e se implantam preferencialmente nas bases, mais perfundidas. Cada implante cresce de forma expansiva e esférica, empurrando o parênquima — bordas nítidas. Chegaram em momentos diferentes, por isso tamanhos diferentes.',
    estruturas: [
      e('Bases pulmonares', 'Lobos inferiores.', 'Mais vasos, mais densidade.', 'Concentram os nódulos maiores.', 'Nódulos apicais únicos são mais provavelmente primários.'),
      e('Borda dos nódulos', 'Interface com o parênquima.', '—', 'Lisa e bem definida — crescimento expansivo.', 'Metástases de adenocarcinoma podem ser mal definidas; sarcomas e escamosos podem cavitar.'),
    ],
    marcacoes: {
      1: [
        m('Múltiplos nódulos redondos', 'Esferas de bordas nítidas espalhadas pelos dois pulmões.'),
        m('Tamanhos variados', 'De poucos milímetros a vários centímetros.'),
        m('Predomínio basal', 'Mais numerosos e maiores nos lobos inferiores.'),
      ],
    },
    conduta: 'TC de tórax e abdome; identificar o primário (rim, testículo, tireoide, cólon, sarcoma); biópsia de um nódulo se não houver primário conhecido.',
  },
  'derrame-subpulmonar': {
    mecanismo: 'Por razões ainda discutidas (elasticidade do pulmão basal, aderências), parte dos derrames se acumula entre a base do pulmão e o diafragma antes de subir pela parede. O pulmão "flutua" sobre o líquido e o contorno visto no filme é o do pulmão, não do diafragma — por isso o ápice da falsa cúpula fica deslocado lateralmente.',
    estruturas: [
      e('Falsa cúpula', 'Interface entre a base do pulmão e o líquido.', 'A cúpula verdadeira tem ápice no terço médio.', 'Ápice deslocado para o terço lateral; a curva lateral cai abruptamente.', 'Paralisia frênica e hepatomegalia elevam a cúpula real, com ápice no lugar.'),
      e('Bolha gástrica', 'Ar no fundo do estômago, sob o hemidiafragma esquerdo.', 'A menos de 1 cm da cúpula.', 'Separada da "cúpula" por mais de 2 cm — o líquido está entre eles.', '—'),
    ],
    marcacoes: {
      1: [
        m('Ápice lateralizado', 'O ponto mais alto da "cúpula" está no terço externo, não no meio.'),
        m('Bolha gástrica afastada', 'À esquerda, mais de 2 cm entre o ar gástrico e a falsa cúpula.'),
        m('Seio costofrênico', 'Pode estar livre — o líquido ainda não subiu pela parede.'),
      ],
      2: [
        m('Líquido móvel', 'No decúbito lateral, o derrame escorre e forma uma faixa ao longo da parede.'),
      ],
    },
    conduta: 'Ultrassom confirma e quantifica; toracocentese diagnóstica se etiologia desconhecida; tratar a causa (insuficiência cardíaca, pneumonia, neoplasia).',
  },
  'derrame-loculado': {
    mecanismo: 'Fibrina e aderências entre as pleuras dividem o espaço pleural em câmaras. O líquido preso não desce com a gravidade e se acomoda contra a parede ou dentro de uma fissura, assumindo forma biconvexa. Na fissura, a coleção é o tumor fantasma — que some quando o derrame é reabsorvido.',
    estruturas: [
      e('Fissura menor', 'Entre lobo superior e médio à direita.', 'Linha fina horizontal.', 'Distendida por líquido: opacidade elíptica ou lenticular no seu trajeto.', 'Massa verdadeira não muda com diurético.'),
      e('Pleura parietal lateral', 'Face interna da parede.', 'Invisível.', 'Coleção biconvexa encostada nela, de contorno nítido.', 'Massa pleural sólida tem a mesma forma — TC com contraste.'),
    ],
    marcacoes: {
      1: [
        m('Contorno convexo', 'A coleção abaula para dentro do pulmão, sem menisco.'),
        m('Posição fixa', 'Não muda entre filmes em pé e deitado.'),
        m('Sem sinal da silhueta pulmonar', 'Vasos pulmonares visíveis através — está na pleura.'),
      ],
      2: [
        m('Tumor fantasma', 'Opacidade elíptica no trajeto da fissura, no perfil.'),
      ],
    },
    conduta: 'Ultrassom mostra septos e guia a punção; derrame loculado parapneumônico é complicado — drenagem, fibrinolítico ou cirurgia conforme a TC.',
  },
  hidropneumotorax: {
    mecanismo: 'Ar e líquido coexistem no espaço pleural: em pé, o ar sobe e o líquido desce, separados por uma interface horizontal que atravessa todo o hemitórax. Não há menisco porque o menisco depende da tensão superficial entre líquido e pulmão encostado — aqui há ar entre eles.',
    estruturas: [
      e('Interface ar-líquido', 'Superfície do líquido pleural.', '—', 'Linha reta e horizontal de parede a parede.', 'Nível hidroaéreo dentro do pulmão (abscesso) é curto e cercado de parênquima.'),
      e('Linha pleural visceral', 'Borda do pulmão colapsado.', 'Encostada na parede, invisível.', 'Visível acima do nível, com ausência de vasos além dela.', '—'),
    ],
    marcacoes: {
      1: [
        m('Nível horizontal', 'Interface reta ocupando toda a largura do hemitórax.'),
        m('Pneumotórax acima', 'Linha pleural visceral e espaço sem vasos.'),
        m('Pulmão colapsado', 'Pulmão retraído em direção ao hilo.'),
      ],
    },
    conduta: 'Drenagem torácica; investigar a causa (trauma, iatrogenia, fístula, ruptura esofágica — esta com pneumomediastino e derrame à esquerda, urgência cirúrgica).',
  },
  hemotorax: {
    mecanismo: 'Sangue de vasos intercostais, mamários, pulmonares ou do hilo enche o espaço pleural. Tem a densidade do líquido e se comporta como derrame — menisco em pé, véu em decúbito. A velocidade de acúmulo e o volume drenado definem se há sangramento ativo.',
    estruturas: [
      e('Espaço pleural em decúbito', 'Camada posterior do espaço pleural no paciente deitado.', '—', 'Sangue se espalha por trás do pulmão — hemitórax difusamente mais opaco com vasos visíveis.', 'Rotação do paciente também escurece um lado.'),
      e('Costelas', 'Arcos costais.', 'Corticais contínuas.', 'Fraturas em série, frequentemente sobre o hemotórax.', 'Fraturas altas: pense em lesão vascular.'),
    ],
    marcacoes: {
      1: [
        m('Véu no hemitórax', 'Hemitórax mais denso de forma homogênea, com vasos ainda visíveis.'),
        m('Fraturas costais', 'Degraus corticais em costelas consecutivas.'),
        m('Pneumotórax associado', 'Procure sulco profundo ou linha pleural.'),
      ],
      2: [
        m('Menisco em pé', 'Curva côncava do líquido subindo pela parede lateral.'),
      ],
    },
    conduta: 'Dreno torácico calibroso; toracotomia se > 1.500 mL iniciais ou > 200 mL/h por 2 a 4 horas; TC para lesões associadas; hemotórax retido pede videotoracoscopia.',
  },
  mesotelioma: {
    mecanismo: 'O tumor da pleura cresce em superfície, como uma casca que envolve o pulmão, invade a pleura mediastinal e as fissuras e enrijece o hemitórax. Apesar do derrame associado, o hemitórax encolhe em vez de expandir — a rigidez tumoral vence a pressão do líquido.',
    estruturas: [
      e('Pleura mediastinal', 'Faceta da pleura parietal que reveste o mediastino.', 'Invisível.', 'Espessada e nodular — o que a fibrose benigna nunca faz.', 'Envolvimento mediastinal = suspeita de malignidade.'),
      e('Volume do hemitórax', 'Espaço entre as costelas e a posição do mediastino.', 'Simétrico.', 'Reduzido: costelas aproximadas e mediastino desviado para o lado da lesão, mesmo com derrame.', 'Derrame comum empurra o mediastino para o lado oposto.'),
    ],
    marcacoes: {
      1: [
        m('Espessamento pleural nodular', 'Casca irregular envolvendo o pulmão, incluindo o mediastino.'),
        m('Hemitórax retraído', 'Costelas próximas e mediastino puxado para a lesão.'),
        m('Derrame associado', 'Líquido que não desloca o mediastino para o lado oposto.'),
      ],
    },
    conduta: 'TC com contraste, biópsia pleural guiada ou por toracoscopia; história de asbesto; prognóstico reservado — tratamento multimodal em centros especializados.',
  },
  'calcificacao-pleural': {
    mecanismo: 'Sangue, pus ou cáseo não drenados organizam-se em fibrose que envolve o pulmão; anos depois, o cálcio se deposita nessa fibrose. A casca rígida prende o pulmão em volume reduzido (restrição) e puxa o mediastino. É unilateral porque a causa foi unilateral.',
    estruturas: [
      e('Pleura visceral e parietal fundidas', 'Casca fibrosa que substitui o espaço pleural.', '—', 'Placa contínua e calcificada envolvendo base e face lateral.', 'Placas do asbesto são múltiplas, pequenas, bilaterais e poupam ápices.'),
      e('Hemitórax', 'Espaço costal e posição mediastinal.', 'Simétrico.', 'Menor, com costelas aproximadas e mediastino puxado.', 'Crescimento ou nodularidade nova pede TC — tumor sobre fibrotórax.'),
    ],
    marcacoes: {
      1: [
        m('Calcificação em placa', 'Faixa densa e contínua contornando a base e a face lateral do pulmão.'),
        m('Unilateralidade', 'Só um hemitórax acometido.'),
        m('Retração', 'Costelas aproximadas e mediastino desviado para a lesão.'),
      ],
    },
    conduta: 'Sem tratamento se estável; espirometria para restrição; decorticação em casos selecionados com pulmão viável. Mudança de aspecto pede TC.',
  },
  'derrame-em-decubito': {
    mecanismo: 'Deitado, o líquido pleural escorre para a região posterior e se distribui em camada fina sobre toda a superfície posterior do pulmão. A radiografia AP soma essa camada ao parênquima: o hemitórax fica mais denso de forma homogênea, sem menisco, e os vasos continuam visíveis porque o pulmão em si está aerado.',
    estruturas: [
      e('Espaço pleural posterior', 'Região dependente no decúbito dorsal.', '—', 'Ocupado por camada de líquido de espessura uniforme.', 'Precisa de 200 a 500 mL para ser visível.'),
      e('Ápice pulmonar', 'Topo do pulmão.', 'Transparente.', 'Capuz de densidade quando o líquido sobe pela face posterior até o ápice.', 'Espessamento apical antigo simula o capuz.'),
    ],
    marcacoes: {
      1: [
        m('Véu homogêneo', 'Hemitórax inteiro mais denso, sem limite definido, sem menisco.'),
        m('Vasos preservados', 'Desenho vascular visível através da densidade — o líquido está atrás.'),
        m('Seio apagado e capuz apical', 'Seio costofrênico borrado; densidade no ápice.'),
      ],
    },
    conduta: 'Ultrassom à beira do leito quantifica e guia a punção; radiografia em pé ou em decúbito lateral quando possível; tratar a causa.',
  },
}
