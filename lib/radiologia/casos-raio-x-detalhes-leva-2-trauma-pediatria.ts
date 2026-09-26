import type { AchadoMarcado, DetalheCaso, EstruturaCaso, TipoMarcacao } from './casos-raio-x-detalhes'

const e = (nome: string, anatomia: string, normal: string, neste: string, alerta?: string): EstruturaCaso =>
  ({ nome, anatomia, normal, neste, alerta })
const m = (titulo: string, descricao: string, tipo: TipoMarcacao = 'achado'): AchadoMarcado => ({ titulo, descricao, tipo })

/** Dossiê da segunda leva — trauma, UTI e pediatria. */
export const DETALHES_LEVA_2_TRAUMA_PEDIATRIA: Record<string, DetalheCaso> = {
  'fraturas-de-costelas': {
    mecanismo: 'A costela é um arco: a força direta a quebra no ponto de impacto, a compressão anteroposterior a quebra na curva lateral, onde a tensão é máxima. Cada fratura pode rasgar a pleura (pneumotórax), o vaso intercostal (hemotórax) e contundir o pulmão embaixo. Três costelas com dois traços cada libertam um segmento que se move com a pressão pleural, ao contrário do resto do tórax.',
    estruturas: [
      e('Cortical costal', 'Osso compacto que contorna cada arco.', 'Linha contínua, sem degraus, em todo o arco.', 'Degrau, interrupção ou dupla linha — a fratura, melhor vista na oblíqua.', 'Sobreposição de arcos posteriores e anteriores esconde traços.'),
      e('Espaço pleural sobre a fratura', 'Pleura logo abaixo do arco quebrado.', 'Invisível.', 'Linha pleural (pneumotórax) ou opacidade basal (hemotórax).', 'A complicação importa mais que a fratura.'),
    ],
    marcacoes: {
      1: [
        m('Degraus corticais', 'Interrupções na cortical de costelas consecutivas na curva lateral.'),
        m('Hemotórax', 'Menisco ou véu na base do mesmo lado.'),
        m('Contusão subjacente', 'Opacidade mal definida sob as fraturas.'),
      ],
      2: [
        m('Detalhe do degrau', 'Cortical que desalinha — o traço de fratura ampliado.'),
      ],
    },
    conduta: 'Analgesia eficaz (bloqueio, peridural nos múltiplos), fisioterapia, vigilância de pneumotórax tardio; TC em trauma de alta energia e em fraturas altas ou baixas; fixação cirúrgica em tórax instável selecionado.',
  },
  'contusao-pulmonar': {
    mecanismo: 'A onda de energia rompe capilares alveolares: sangue e edema enchem os alvéolos no território atingido, sem respeitar segmentos, porque a lesão é mecânica e não segue a via aérea. A reabsorção é rápida — o filme clareia em dias. O que não clareia era outra coisa desde o início ou virou complicação.',
    estruturas: [
      e('Parênquima sob o impacto', 'Região do pulmão adjacente à parede que recebeu a força.', 'Transparente.', 'Opacidade heterogênea, mal definida, não segmentar.', 'Aspiração e pneumonia respeitam segmentos; a contusão não.'),
      e('Costelas vizinhas', 'Arcos sobre a área contundida.', 'Íntegros.', 'Frequentemente fraturados no adulto; íntegros na criança.', 'Ausência de fratura não exclui contusão em criança.'),
    ],
    marcacoes: {
      1: [
        m('Opacidade não segmentar', 'Mancha de bordas borradas que não obedece a fissuras.'),
        m('Sob as fraturas', 'Localizada logo abaixo dos arcos costais quebrados.'),
        m('Tempo', 'Presente já nas primeiras 6 horas — o que a distingue de pneumonia.'),
      ],
    },
    conduta: 'Oxigênio, analgesia, fisioterapia; evitar excesso de volume; TC se hipoxemia desproporcional (laceração, hematoma) ou se a opacidade persistir além de 7 a 10 dias.',
  },
  'ruptura-diafragmatica': {
    mecanismo: 'A compressão brusca do abdome multiplica a pressão intra-abdominal e rasga o diafragma no seu ponto mais fraco, o hemidiafragma esquerdo posterolateral; o fígado protege o direito. A pressão negativa do tórax aspira as vísceras para cima, e elas ficam lá — o estômago com o seu nível, as alças com o seu gás.',
    estruturas: [
      e('Hemidiafragma esquerdo', 'Cúpula muscular à esquerda.', 'Linha curva contínua acima da bolha gástrica.', 'Não identificável; substituído por vísceras com gás no hemitórax inferior.', 'Elevação sem perda do contorno é eventração ou paralisia.'),
      e('Sonda nasogástrica', 'Tubo que desce pelo esôfago até o estômago.', 'Ponta abaixo do diafragma, à esquerda.', 'Desce, cruza o diafragma e sobe de novo — o estômago está no tórax.', 'Sem sonda, injete contraste ou faça TC.'),
    ],
    marcacoes: {
      1: [
        m('Estômago no tórax', 'Bolha com nível hidroaéreo projetada no hemitórax esquerdo inferior.'),
        m('Sonda enrolada no tórax', 'O trajeto da sonda sobe acima do nível esperado do diafragma.'),
        m('Desvio mediastinal', 'Coração e traqueia empurrados para a direita.'),
      ],
    },
    conduta: 'TC com reconstrução coronal e sagital; cirurgia (redução das vísceras e sutura do diafragma) — sempre, pelo risco de encarceramento tardio.',
  },
  'lesao-aortica-traumatica': {
    mecanismo: 'A desaceleração faz o arco móvel continuar em movimento enquanto a aorta descendente, presa às costelas, para: a tensão máxima é no istmo, e a adventícia pode conter o sangue (pseudoaneurisma) por horas. O hematoma mediastinal que se forma é o que a radiografia mostra — e ele pode vir de qualquer vaso, não só da aorta.',
    estruturas: [
      e('Mediastino superior', 'Compartimento entre os pulmões acima do coração.', 'Largura < 8 cm em AP a 1 m, ou < 25% da largura torácica.', 'Alargado pelo hematoma.', 'AP portátil, rotação e má inspiração alargam sem hematoma.'),
      e('Botão aórtico', 'Contorno do arco aórtico à esquerda da traqueia.', 'Convexidade nítida.', 'Apagado ou indistinto pelo sangue ao redor.', 'O sinal mais específico entre os radiográficos.'),
    ],
    marcacoes: {
      1: [
        m('Mediastino alargado', 'Largura do mediastino superior acima de 8 cm.'),
        m('Botão aórtico apagado', 'Contorno do arco perdido no hematoma.'),
        m('Desvio da traqueia e da sonda', 'Traqueia e sonda nasogástrica deslocadas para a direita.'),
      ],
    },
    conduta: 'Angiotomografia imediata em todo paciente com mecanismo de desaceleração e qualquer sinal mediastinal; controle rigoroso da pressão (betabloqueador); reparo endovascular.',
  },
  'sinal-do-sulco-profundo': {
    mecanismo: 'Ar pleural procura o ponto mais alto. Deitado, o ponto mais alto do tórax é anterior e inferior — o recesso costofrênico anterior. O ar ali se projeta, na incidência AP, como um seio costofrênico lateral profundo, escuro e nítido, porque não há pulmão nem líquido entre o ar pleural e o filme.',
    estruturas: [
      e('Seio costofrênico lateral', 'Ângulo entre a parede torácica e o hemidiafragma.', 'Agudo, curto, com densidade parenquimatosa.', 'Profundo, alongado para baixo e mais escuro que o contralateral.', 'Compare sempre os dois lados no mesmo filme.'),
      e('Hemidiafragma', 'Cúpula.', 'Contorno nítido mas não excessivamente.', 'Contorno excepcionalmente nítido — ar pleural o contorna por cima.', '—'),
    ],
    marcacoes: {
      1: [
        m('Sulco profundo', 'Seio costofrênico que desce mais e é mais lucente que o oposto.'),
        m('Hemidiafragma nítido', 'Contorno diafragmático mais bem definido do lado do pneumotórax.'),
        m('Lucência paramediastinal', 'Faixa escura ao lado do coração — ar anteromedial.'),
      ],
    },
    conduta: 'Ultrassom pleural confirma (ausência de deslizamento, ponto pulmonar); drenagem se sintomático, volumoso ou em ventilação mecânica.',
  },
  'sonda-nasogastrica-mal-posicionada': {
    mecanismo: 'A sonda é empurrada às cegas; em paciente sedado, sem reflexo de tosse, ela entra na laringe e desce pela traqueia com a mesma facilidade que pelo esôfago — e o brônquio direito, mais vertical, é o caminho natural. Nada disso dói. O que revela é o trajeto no filme.',
    estruturas: [
      e('Trajeto esofágico', 'Linha média do tórax, à esquerda da coluna na parte inferior.', 'Sonda vertical, mediana, que cruza o diafragma e curva para a esquerda.', 'Sonda que se desvia lateralmente na altura da carina — entrou no brônquio.', 'Sonda "mediana" pode estar na traqueia até a carina.'),
      e('Ponta da sonda', 'Extremidade distal com marcador radiopaco.', 'No corpo gástrico, ≥ 10 cm abaixo da junção esofagogástrica.', 'Sobre o campo pulmonar ou no seio costofrênico.', 'Ponta na base pulmonar esquerda simula estômago — confira se cruzou o diafragma.'),
    ],
    marcacoes: {
      1: [
        m('Desvio na carina', 'A sonda deixa a linha média na altura da bifurcação traqueal.'),
        m('Trajeto brônquico', 'Segue o brônquio principal direito para baixo e para fora.'),
        m('Ponta no pulmão', 'Extremidade projetada sobre o parênquima, sem curva gástrica.'),
      ],
    },
    conduta: 'Retirar a sonda imediatamente, sem infundir nada; radiografia após reposicionar; se houve infusão, tratar como aspiração e vigiar pneumotórax e empiema.',
  },
  'cateter-central-mal-posicionado': {
    mecanismo: 'O cateter segue o fluxo venoso e as bifurcações: da subclávia pode virar para cima na jugular ou cruzar para o lado oposto pelo tronco braquiocefálico; da jugular direita pode entrar na ázigos, que desemboca na cava posteriormente. A ponta fora da cava superior infunde em vaso pequeno ou encosta na parede — erosão, trombose, extravasamento.',
    estruturas: [
      e('Veia cava superior', 'Tronco venoso à direita da coluna, da junção das braquiocefálicas ao átrio.', 'Invisível; sua projeção é a faixa paratraqueal direita.', 'A ponta deveria estar aqui, paralela ao eixo, ao nível da carina.', 'Ponta na junção cavoatrial é aceitável; no átrio, discutível.'),
      e('Veia jugular interna', 'Sobe pelo pescoço lateral à traqueia.', 'Fora do filme.', 'Cateter que sobe em direção ao pescoço em vez de descer.', 'Tem de ser reposicionado — infusão retrógrada para a cabeça.'),
    ],
    marcacoes: {
      1: [
        m('Cateter ascendente', 'A ponta aponta para o pescoço, acima da clavícula.'),
        m('Trajeto na jugular', 'O cateter segue lateral à traqueia para cima.'),
        m('Pneumotórax', 'Confira o ápice do lado da punção.'),
      ],
      2: [
        m('Cruzamento contralateral', 'O cateter atravessa a linha média e aponta para a subclávia oposta.'),
      ],
    },
    conduta: 'Reposicionar sob radioscopia ou trocar por fio-guia; nunca infundir vasoativo ou nutrição parenteral em ponta mal posicionada; radiografia de controle após qualquer manipulação.',
  },
  'atelectasia-por-rolha-de-muco': {
    mecanismo: 'Com o brônquio obstruído, o oxigênio dos alvéolos distais é absorvido pelo sangue e não é reposto; o lobo esvazia em horas (mais rápido sob oxigênio a 100%). O pulmão que perde volume puxa o que está em volta — fissura, hilo, mediastino, diafragma — e o pulmão vizinho se expande para ocupar o espaço.',
    estruturas: [
      e('Traqueia e mediastino', 'Estruturas centrais.', 'Medianas.', 'Puxados para o lado da opacidade.', 'Derrame maciço empurra para o lado oposto.'),
      e('Hemidiafragma', 'Cúpula do lado afetado.', 'Na 6ª costela anterior.', 'Elevado — perda de volume.', 'Elevação sem opacidade pode ser paralisia frênica.'),
    ],
    marcacoes: {
      1: [
        m('Hemitórax opaco', 'Opacidade completa ou lobar, homogênea.'),
        m('Desvio ipsilateral', 'Traqueia e coração puxados para a opacidade.'),
        m('Hemidiafragma elevado', 'Cúpula alta do lado da atelectasia.'),
      ],
    },
    conduta: 'Aspiração traqueal, fisioterapia, broncoscopia se não reexpandir; verificar a posição do tubo endotraqueal antes de tudo.',
  },
  bronquiolite: {
    mecanismo: 'O vírus destrói o epitélio bronquiolar e produz edema e muco que obstruem parcialmente vias aéreas de pequeno calibre — que na criança já são estreitas. A obstrução em válvula aprisiona ar (hiperinsuflação) e a obstrução completa de alguns bronquíolos colapsa pequenas áreas (atelectasias lineares que migram). O parênquima em si não consolida.',
    estruturas: [
      e('Paredes brônquicas peri-hilares', 'Brônquios de médio calibre ao redor dos hilos.', 'Finas, quase invisíveis.', 'Espessadas por edema — anéis e trilhos peri-hilares.', 'Espessamento também em asma e infecção viral em geral.'),
      e('Volume pulmonar', 'Altura das cúpulas e número de costelas.', '6 costelas anteriores.', 'Mais de 8 costelas posteriores; cúpulas achatadas; coração pequeno.', 'Hiperinsuflação unilateral não é bronquiolite.'),
    ],
    marcacoes: {
      1: [
        m('Hiperinsuflação', 'Cúpulas achatadas e pulmões grandes.'),
        m('Espessamento peribrônquico', 'Anéis de parede espessa ao redor dos hilos.'),
        m('Atelectasias lineares', 'Faixas de opacidade que somem no filme seguinte.'),
      ],
    },
    conduta: 'Suporte (oxigênio, hidratação); sem antibiótico nem broncodilatador de rotina; radiografia só se curso atípico, febre alta persistente ou assimetria.',
  },
  'corpo-estranho-aspirado': {
    mecanismo: 'O objeto alojado num brônquio se comporta como válvula: na inspiração, o brônquio dilata e o ar passa; na expiração, o brônquio estreita e o ar fica preso. O pulmão obstruído não esvazia e fica maior e mais escuro que o outro, empurrando o mediastino no filme expiratório. Obstrução completa dá o oposto: atelectasia.',
    estruturas: [
      e('Pulmão obstruído', 'Pulmão distal ao corpo estranho.', 'Esvazia na expiração como o outro.', 'Permanece insuflado, mais lucente e com vasos afilados.', 'Na inspiração pode parecer igual ao outro.'),
      e('Mediastino na expiração', 'Estruturas centrais.', 'Mediano.', 'Desviado para o lado sadio, porque o obstruído não esvazia.', 'Rotação simula desvio — cheque as clavículas.'),
    ],
    marcacoes: {
      1: [
        m('Pulmão hiperinsuflado', 'Um lado permanece grande e escuro na expiração.'),
        m('Desvio contralateral', 'Mediastino empurrado para o lado normal.'),
        m('Objeto', 'Só visível se radiopaco — a maioria não é.'),
      ],
      2: [
        m('Inspiração normal', 'Na inspiração, os dois lados se parecem — por isso o expiratório é obrigatório.'),
      ],
    },
    conduta: 'Broncoscopia rígida por indicação clínica (engasgo testemunhado), mesmo com filme normal; nunca esperar a pneumonia obstrutiva para confirmar.',
  },
  epiglotite: {
    mecanismo: 'A infecção bacteriana da epiglote e das estruturas supraglóticas produz edema maciço em horas. A epiglote, uma lâmina fina de cartilagem elástica, vira uma massa; as pregas ariepiglóticas espessam e a via aérea supraglótica se fecha. A subglote, abaixo das cordas, é poupada.',
    estruturas: [
      e('Epiglote', 'Lâmina de cartilagem na base da língua, no perfil do pescoço.', 'Fina e curva, como uma folha.', 'Arredondada e espessa — o polegar.', 'Flexão do pescoço "engorda" a epiglote; o perfil deve ser em extensão.'),
      e('Pregas ariepiglóticas', 'Da epiglote às aritenoides.', 'Finas.', 'Espessadas, obliterando a valécula.', '—'),
    ],
    marcacoes: {
      1: [
        m('Epiglote em polegar', 'Sombra arredondada e volumosa na base da língua.'),
        m('Pregas espessadas', 'Faixa densa entre a epiglote e as aritenoides.'),
        m('Hipofaringe distendida', 'Coluna de ar dilatada acima da obstrução.'),
      ],
    },
    conduta: 'Via aérea antes de qualquer exame: intubação em ambiente controlado, com cirurgião disponível; antibiótico (ceftriaxona); radiografia só em paciente estável, sentado, com médico ao lado.',
  },
  crupe: {
    mecanismo: 'O edema viral da subglote reduz um lúmen que na criança mede poucos milímetros: uma redução de 1 mm no raio quadruplica a resistência. A coluna de ar perde os ombros laterais que a cartilagem cricoide normalmente sustenta e afila simetricamente logo abaixo das cordas vocais.',
    estruturas: [
      e('Subglote', 'Via aérea logo abaixo das cordas vocais, dentro da cricoide.', 'Ombros laterais nítidos; coluna de ar de largura constante.', 'Afilada em ponta, simétrica — a torre.', 'A torre pode ser fisiológica na expiração e no choro.'),
      e('Epiglote', 'No perfil.', 'Fina.', 'Normal — o que separa de epiglotite.', '—'),
    ],
    marcacoes: {
      1: [
        m('Estreitamento subglótico', 'Coluna de ar da traqueia afilando logo abaixo das cordas.'),
        m('Perda dos ombros', 'O contorno em degrau da subglote desaparece.'),
        m('Simetria', 'Afilamento igual dos dois lados.'),
      ],
    },
    conduta: 'Corticoide (dexametasona) e adrenalina nebulizada nos moderados; radiografia dispensável no quadro típico — serve para excluir outras causas de estridor.',
  },
  'timo-normal': {
    mecanismo: 'O timo é proporcionalmente enorme no lactente e fica no mediastino anterior, encostado no esterno e moldado pelas costelas. Como é mole, muda de forma com a respiração e não comprime nada. A sua borda inferior nítida e reta, apoiada na fissura menor, faz a vela; a ondulação costal faz a onda.',
    estruturas: [
      e('Timo', 'Órgão linfoide no mediastino anterossuperior.', 'Sombra homogênea sobre o mediastino superior, mais à direita, com borda inferior nítida.', 'Idem — o caso é o normal.', 'Lobulação, calcificação ou desvio traqueal não são timo normal.'),
      e('Traqueia', 'Coluna de ar central.', 'Mediana, sem estreitamento.', 'Mediana — o timo não a desloca.', 'Traqueia desviada pede investigação de massa.'),
    ],
    marcacoes: {
      1: [
        m('Sinal da vela', 'Borda inferior reta e nítida do timo, fazendo ângulo com a fissura menor.'),
        m('Sinal da onda', 'Borda lateral ondulada pelas costelas anteriores.'),
        m('Sem efeito de massa', 'Traqueia mediana, brônquios no lugar.'),
      ],
    },
    conduta: 'Nenhuma; se dúvida, ultrassom mostra o timo homogêneo envolvendo os vasos sem comprimi-los. Evitar TC e biópsia em "massa" mediastinal típica do lactente.',
  },
  'hernia-diafragmatica-congenita': {
    mecanismo: 'A falha de fechamento do canal pleuroperitoneal, por volta da 8ª semana, deixa as vísceras subirem enquanto o pulmão se forma: o pulmão ipsilateral fica hipoplásico e o contralateral também, por compressão. Ao nascer, o ar deglutido enche as alças no tórax. A gravidade é da hipoplasia e da hipertensão pulmonar, não da hérnia.',
    estruturas: [
      e('Hemitórax esquerdo', 'Cavidade pleural esquerda.', 'Pulmão aerado.', 'Ocupado por alças com gás e pelo estômago; pulmão comprimido no ápice.', 'Antes do ar entrar, o hemitórax é opaco e simula derrame.'),
      e('Abdome', 'Cavidade abdominal.', 'Alças com gás.', 'Escavado, sem gás — as vísceras estão no tórax.', 'Malformação cística tem abdome normal.'),
    ],
    marcacoes: {
      1: [
        m('Alças no tórax', 'Múltiplas bolhas de gás no hemitórax esquerdo.'),
        m('Mediastino desviado', 'Coração empurrado para a direita.'),
        m('Abdome sem gás', 'Cavidade abdominal vazia — sinal complementar.'),
      ],
    },
    conduta: 'Intubação imediata (nunca ventilar com máscara), sonda gástrica aberta, estabilização da hipertensão pulmonar; cirurgia só após estabilizar, em geral em 24 a 72 horas.',
  },
  'doenca-da-membrana-hialina': {
    mecanismo: 'Sem surfactante, a tensão superficial fecha os alvéolos a cada expiração; milhões de unidades colapsadas ao lado de outras abertas dão o aspecto granular. Os brônquios, que não dependem de surfactante, ficam abertos e contrastam com o parênquima colapsado — os broncogramas. O volume total cai porque o pulmão não consegue se manter expandido.',
    estruturas: [
      e('Parênquima', 'Alvéolos e interstício.', 'Transparente e homogêneo.', 'Granular fino, difuso e simétrico — vidro despolido.', 'Pneumonia por estreptococo B é idêntica.'),
      e('Brônquios', 'Via aérea intrapulmonar.', 'Invisíveis.', 'Broncogramas que se estendem até a periferia.', 'Broncograma central pequeno pode ser normal no recém-nascido.'),
    ],
    marcacoes: {
      1: [
        m('Padrão granular', 'Opacidade fina, uniforme, nos dois pulmões.'),
        m('Broncogramas aéreos', 'Ramificações escuras chegando à periferia.'),
        m('Volumes reduzidos', 'Cúpulas altas, tórax pequeno — apesar de possível ventilação.'),
      ],
    },
    conduta: 'Surfactante exógeno, CPAP ou ventilação; antibiótico até excluir sepse por estreptococo B; radiografia após surfactante e diante de qualquer piora (pneumotórax, enfisema intersticial).',
  },
  'taquipneia-transitoria': {
    mecanismo: 'O pulmão fetal está cheio de líquido produzido pelo epitélio; o trabalho de parto aciona a reabsorção pelos canais de sódio. Sem trabalho de parto (cesárea eletiva), o líquido sobra e se acumula no interstício e nos linfáticos peri-hilares e nas fissuras, até ser drenado em 1 a 3 dias.',
    estruturas: [
      e('Interstício peri-hilar', 'Tecido ao redor dos hilos e dos brônquios.', 'Invisível.', 'Estrias radiadas a partir dos hilos — linfáticos e septos cheios.', 'Padrão parecido com edema de outra causa (cardiopatia).'),
      e('Fissura menor', 'À direita.', 'Linha fina.', 'Espessada por líquido — traço branco no seu trajeto.', '—'),
    ],
    marcacoes: {
      1: [
        m('Estrias peri-hilares', 'Linhas que irradiam dos hilos para a periferia.'),
        m('Líquido na fissura', 'Faixa branca horizontal à direita.'),
        m('Volumes normais ou aumentados', 'Pulmões bem insuflados — não é membrana hialina.'),
      ],
    },
    conduta: 'Oxigênio e observação; melhora em 24 a 72 horas confirma. Persistência além de 72 horas: ecocardiograma e reavaliação do diagnóstico.',
  },
  'pneumonia-redonda': {
    mecanismo: 'As vias colaterais entre alvéolos (poros de Kohn) e entre bronquíolos e alvéolos (canais de Lambert) são imaturas na criança pequena; a consolidação não se espalha lateralmente e fica contida, esférica, com bordas nítidas. À medida que o tratamento age (ou a criança cresce), o padrão vira consolidação convencional.',
    estruturas: [
      e('Lobo inferior posterior', 'Segmentos posteriores basais.', 'Transparentes.', 'Opacidade esférica de bordas bem definidas.', 'Massa em criança é raríssima — trate antes de investigar.'),
      e('Broncograma', 'Brônquios dentro da opacidade.', '—', 'Podem estar presentes e ajudam a dizer que é consolidação.', '—'),
    ],
    marcacoes: {
      1: [
        m('Opacidade esférica', 'Bola de bordas nítidas, única.'),
        m('Localização posterior', 'Lobo inferior, atrás do coração ou junto à coluna.'),
        m('Contexto febril', 'Criança pequena com febre e tosse.'),
      ],
    },
    conduta: 'Antibiótico para pneumonia comunitária; radiografia de controle em 2 a 3 semanas. TC apenas se a opacidade persistir ou a criança não tiver sinais de infecção.',
  },
  'aspiracao-de-meconio': {
    mecanismo: 'O mecônio é espesso e irritante: obstrui parcialmente os brônquios (aprisionamento de ar e hiperinsuflação), obstrui completamente alguns (atelectasias), inativa o surfactante e causa pneumonite química (consolidações grosseiras). Alvéolos hiperdistendidos rompem — pneumotórax e pneumomediastino. A hipertensão pulmonar persistente vem junto.',
    estruturas: [
      e('Parênquima', 'Alvéolos.', 'Homogêneo.', 'Opacidades grosseiras, irregulares e assimétricas alternando com áreas hiperlucentes.', 'Membrana hialina é fina, homogênea e de volumes baixos.'),
      e('Volume pulmonar', 'Cúpulas.', 'Normal.', 'Aumentado — cúpulas achatadas.', '—'),
    ],
    marcacoes: {
      1: [
        m('Opacidades grosseiras', 'Manchas densas e irregulares, dos dois lados, assimétricas.'),
        m('Hiperinsuflação', 'Cúpulas achatadas e pulmões grandes.'),
        m('Ar extra-alveolar', 'Procure pneumotórax e pneumomediastino.'),
      ],
    },
    conduta: 'Suporte ventilatório, surfactante em casos selecionados, óxido nítrico se hipertensão pulmonar; radiografia a cada piora súbita — pneumotórax.',
  },
  'fraturas-de-maus-tratos': {
    mecanismo: 'A lesão metafisária clássica é uma fratura planar através da metáfise imatura, produzida por tração e torção violenta do membro (ou por sacudidas): o fragmento arrancado aparece em canto ou, quando visto obliquamente, em alça de balde. As fraturas de arcos costais posteriores resultam de compressão do tórax com as mãos, com alavanca sobre os processos transversos — quase impossíveis por queda.',
    estruturas: [
      e('Metáfise', 'Região de crescimento entre a fise e a diáfise.', 'Contorno liso e contínuo.', 'Fragmento em canto ou em alça de balde separado da metáfise.', 'Espículas metafisárias fisiológicas são simétricas e não separam fragmento.'),
      e('Arcos costais posteriores', 'Junto à coluna.', 'Íntegros.', 'Fraturas múltiplas em consolidação (calo), bilaterais, no mesmo nível.', 'Reanimação cardiopulmonar não produz fraturas posteriores no lactente.'),
    ],
    marcacoes: {
      1: [
        m('Lesão metafisária em canto', 'Pequeno fragmento triangular na borda da metáfise.'),
        m('Alça de balde', 'O mesmo fragmento visto de outro ângulo: arco denso paralelo à fise.'),
        m('Sem trauma proporcional', 'História que não explica.'),
      ],
      2: [
        m('Fraturas costais posteriores', 'Calos arredondados nos arcos posteriores, vários níveis.'),
        m('Idades diferentes', 'Fraturas com e sem calo no mesmo filme.'),
      ],
    },
    conduta: 'Série esquelética completa (padrão ACR), repetida em 2 semanas; fundo de olho e neuroimagem no lactente; notificação obrigatória ao conselho tutelar; excluir osteogênese imperfeita e raquitismo na avaliação, não como pré-condição.',
  },
}
