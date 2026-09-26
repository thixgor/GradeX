import type { AchadoMarcado, DetalheCaso, EstruturaCaso, TipoMarcacao } from './casos-raio-x-detalhes'

const e = (nome: string, anatomia: string, normal: string, neste: string, alerta?: string): EstruturaCaso =>
  ({ nome, anatomia, normal, neste, alerta })
const m = (titulo: string, descricao: string, tipo: TipoMarcacao = 'achado'): AchadoMarcado => ({ titulo, descricao, tipo })

/** Dossiê da segunda leva — abdome. */
export const DETALHES_LEVA_2_ABDOME: Record<string, DetalheCaso> = {
  pneumoperitonio: {
    mecanismo: 'O gás que sai da luz intestinal é livre para subir: em pé, acumula-se sob o diafragma, entre o fígado e a cúpula, onde não há nada de densidade parecida para escondê-lo. A cúpula fica desenhada como uma linha fina com ar dos dois lados — pulmão acima, gás livre abaixo. Bastam poucos mililitros se o paciente ficou em pé tempo suficiente.',
    estruturas: [
      e('Hemidiafragma direito', 'Cúpula sobre o fígado.', 'Encostada no fígado, sem interface visível abaixo.', 'Separada do fígado por meia-lua de gás; a cúpula vira uma linha fina.', 'Cólon interposto (Chilaiditi) tem haustras — ar livre não tem.'),
      e('Hemidiafragma esquerdo', 'Cúpula sobre o estômago e o baço.', 'Bolha gástrica logo abaixo.', 'Ar livre além da bolha: a parede gástrica fica visível entre os dois gases.', 'A bolha gástrica é o falso-positivo clássico.'),
    ],
    marcacoes: {
      1: [
        m('Meia-lua subdiafragmática', 'Faixa escura entre o fígado e a cúpula direita.'),
        m('Cúpula em linha fina', 'O diafragma desenhado como traço, com gás dos dois lados.'),
        m('Bilateralidade', 'Ar também sob a cúpula esquerda, além da bolha gástrica.'),
      ],
      2: [
        m('Ar sobre o fígado', 'No decúbito lateral esquerdo, o gás sobe entre o fígado e a parede.'),
      ],
    },
    conduta: 'Cirurgia na maioria; TC define o ponto de perfuração. Pós-operatório recente: comparar com filme anterior — ar que aumenta é deiscência.',
  },
  'sinal-de-rigler': {
    mecanismo: 'A parede intestinal só é visível quando há contraste dos dois lados. Normalmente só o gás luminal contrasta a face interna; a externa se confunde com a gordura e as vísceras. Com ar livre em volume grande, o gás extraluminal contorna a alça e a parede aparece como linha branca fina entre dois pretos.',
    estruturas: [
      e('Parede da alça', 'Camadas mucosa a serosa.', 'Só a face interna é delineada.', 'Linha fina visível dos dois lados.', 'Duas alças encostadas somam duas paredes — mais espessas.'),
      e('Ligamento falciforme', 'Prega peritoneal entre o fígado e a parede anterior.', 'Invisível.', 'Linha vertical no hipocôndrio direito contornada por gás.', 'Sinal complementar e específico.'),
    ],
    marcacoes: {
      1: [
        m('Dupla parede', 'Contorno branco fino da alça com gás dentro e fora.'),
        m('Ligamento falciforme', 'Linha vertical delineada à direita da linha média.'),
        m('Gás em triângulos', 'Lucências triangulares entre alças — gás livre entre elas.'),
      ],
    },
    conduta: 'Confirmar com decúbito lateral esquerdo ou TC; cirurgia. Em UTI, Rigler no filme de rotina é perfuração até prova contrária.',
  },
  'obstrucao-de-delgado': {
    mecanismo: 'Acima do obstáculo, secreções (7 a 8 litros por dia) e gás deglutido acumulam-se e dilatam as alças; abaixo, o conteúdo é absorvido e o cólon esvazia. As válvulas coniventes, pregas circulares completas do jejuno e íleo, ficam esticadas e visíveis atravessando a luz. Em pé, cada alça forma o seu nível.',
    estruturas: [
      e('Válvulas coniventes', 'Pregas mucosas circulares do delgado.', 'Invisíveis ou finas.', 'Linhas que cruzam toda a luz da alça dilatada — empilhadas como moedas.', 'Haustrações do cólon não cruzam a luz inteira.'),
      e('Cólon', 'Alças periféricas.', 'Gás e fezes.', 'Colabado, sem gás — o conteúdo já passou.', 'Cólon com gás não exclui obstrução parcial ou recente.'),
    ],
    marcacoes: {
      1: [
        m('Níveis hidroaéreos', 'Vários níveis em alturas diferentes, em pé.'),
        m('Alças centrais dilatadas', 'Diâmetro acima de 3 cm, no centro do abdome.'),
        m('Cólon vazio', 'Sem gás no cólon e no reto.'),
      ],
      2: [
        m('Válvulas coniventes', 'Pregas finas cruzando a luz inteira — empilhamento de moedas.'),
        m('Cicatriz e hérnias', 'Procure a causa: clipes cirúrgicos, gás na região inguinal.'),
      ],
    },
    conduta: 'Sonda nasogástrica, hidratação, TC com contraste para ponto de transição e sinais de isquemia; cirurgia se estrangulamento, alça fechada ou falha do tratamento conservador em 48 a 72 h.',
  },
  'obstrucao-de-colon': {
    mecanismo: 'O obstáculo (tumor, volvo, diverticulite) bloqueia o cólon; a montante, gás e fezes se acumulam e dilatam as alças periféricas. Se a válvula ileocecal impede o refluxo, o cólon vira um tubo fechado nas duas pontas e o ceco — o segmento de maior raio e parede mais fina — sofre a maior tensão (lei de Laplace) e perfura.',
    estruturas: [
      e('Cólon', 'Alças periféricas com haustrações.', 'Diâmetro < 6 cm.', 'Dilatado até o ponto de obstrução; reto sem gás.', 'Pseudo-obstrução tem o mesmo aspecto.'),
      e('Ceco', 'Fundo do cólon direito.', '< 9 cm.', 'Muito dilatado — risco de perfuração.', 'Ceco > 9 cm é urgência mesmo sem peritonite.'),
    ],
    marcacoes: {
      1: [
        m('Alças periféricas dilatadas', 'Cólon emoldurando o abdome, acima de 6 cm.'),
        m('Haustrações', 'Pregas que não atravessam toda a luz — é cólon.'),
        m('Ponto de parada', 'Onde o gás termina; reto vazio.'),
      ],
    },
    conduta: 'TC com contraste define causa e nível; descompressão endoscópica ou stent como ponte em tumor; cirurgia se ceco > 9 cm, peritonite ou volvo cecal.',
  },
  'volvo-de-sigmoide': {
    mecanismo: 'O sigmoide redundante, com mesentério longo e base estreita, torce sobre si mesmo; a alça fechada nas duas extremidades enche de gás e sobe, com as paredes mediais encostadas formando a linha central do grão de café. A torção obstrui também o cólon proximal.',
    estruturas: [
      e('Sigmoide', 'Segmento distal do cólon, na pelve.', 'Pequeno, com fezes.', 'Alça gigante, sem haustras, em U invertido subindo até o hipocôndrio.', 'Volvo cecal aponta para o outro lado e tem válvula ileocecal visível.'),
      e('Linhas convergentes', 'Paredes da alça torcida.', '—', 'Três linhas brancas que convergem para a pelve, no ponto da torção.', '—'),
    ],
    marcacoes: {
      1: [
        m('Grão de café', 'Alça enorme em U invertido, com uma linha central densa.'),
        m('Ápice no hipocôndrio', 'A alça sobe da pelve para o quadrante superior direito ou acima de T10.'),
        m('Convergência pélvica', 'As linhas da alça apontam para o ponto de torção na pelve.'),
      ],
    },
    conduta: 'Descompressão por retossigmoidoscopia com sonda retal; cirurgia se isquemia, falha ou recorrência (sigmoidectomia eletiva na mesma internação).',
  },
  'volvo-cecal': {
    mecanismo: 'Um ceco com fixação peritoneal incompleta gira em torno do eixo do íleo terminal e do cólon ascendente e sobe para o abdome superior esquerdo. A torção fecha a saída do íleo — o delgado dilata a montante — e o cólon distal, vazio, colapsa.',
    estruturas: [
      e('Ceco', 'Fundo do cólon direito.', 'Na fossa ilíaca direita.', 'Deslocado para o hipocôndrio esquerdo ou epigástrio, em forma de rim.', 'Distensão gástrica ocupa a mesma região — sonda esvazia.'),
      e('Delgado', 'Alças centrais.', 'Sem dilatação.', 'Dilatado, porque a válvula ileocecal está obstruída.', 'Delgado dilatado com cólon distal vazio: obstrução na transição.'),
    ],
    marcacoes: {
      1: [
        m('Alça fora do lugar', 'Grande alça arredondada no quadrante superior esquerdo.'),
        m('Forma de rim', 'Reentrância correspondente à válvula ileocecal.'),
        m('Delgado dilatado', 'Alças centrais com níveis a montante.'),
      ],
    },
    conduta: 'Cirurgia (hemicolectomia direita ou cecopexia); endoscopia não resolve; TC mostra o redemoinho mesentérico e a viabilidade da parede.',
  },
  'ileo-paralitico': {
    mecanismo: 'A motilidade para por reflexo simpático (cirurgia, peritonite, cólica renal), por drogas ou por distúrbio eletrolítico. O gás deglutido não avança e se distribui de forma uniforme por delgado e cólon, sem ponto de bloqueio. Não há alça "lutando" — por isso ruídos ausentes e dilatação moderada e difusa.',
    estruturas: [
      e('Delgado e cólon', 'Todo o trato.', 'Gás moderado no cólon; pouco no delgado.', 'Ambos moderadamente dilatados, com gás até o reto.', 'Obstrução de cólon com válvula incompetente dá o mesmo filme.'),
      e('Ponto de transição', 'Local onde o calibre muda de dilatado para colabado.', '—', 'Ausente — a dilatação é contínua.', 'A TC é o exame que procura a transição.'),
    ],
    marcacoes: {
      1: [
        m('Gás difuso', 'Delgado e cólon com gás, dilatação moderada e uniforme.'),
        m('Gás no reto', 'O gás chega até o final — nada obstrui.'),
        m('Sem transição', 'Nenhuma alça termina abruptamente.'),
      ],
    },
    conduta: 'Tratar a causa (potássio, suspender opioides, deambular), sonda se vômitos; TC se não resolver em 3 a 5 dias ou se dor localizada.',
  },
  'megacolon-toxico': {
    mecanismo: 'A inflamação transmural grave destrói o plexo mioentérico e paralisa o cólon; o óxido nítrico produzido pela inflamação relaxa o músculo liso. O segmento mais alto no decúbito, o transverso, é o que mais dilata. A mucosa ulcerada e edemaciada sobra em ilhas que se projetam na luz.',
    estruturas: [
      e('Cólon transverso', 'Segmento entre as flexuras, anterior.', '< 6 cm.', 'Dilatado acima de 6 cm, sem haustras, com contorno irregular.', 'Dilatação com haustras preservadas é mais provavelmente obstrução.'),
      e('Mucosa', 'Revestimento interno.', 'Lisa.', 'Ilhas de mucosa edemaciada projetadas na luz — pseudopólipos.', 'Impressões digitais indicam edema submucoso grave.'),
    ],
    marcacoes: {
      1: [
        m('Transverso dilatado', 'Segmento acima de 6 cm de largura.'),
        m('Ausência de haustras', 'Contorno liso e "sujo", sem as pregas habituais.'),
        m('Ilhas de mucosa', 'Nodulações irregulares projetadas na luz.'),
      ],
    },
    conduta: 'UTI, corticoide venoso, antibiótico, sonda, radiografia diária; colectomia se não melhorar em 48 a 72 horas ou se perfurar. Sem enema, sem colonoscopia.',
  },
  'calculo-renal-radiopaco': {
    mecanismo: 'Cálculos de oxalato e fosfato de cálcio, e os de estruvita, contêm cálcio suficiente para atenuar mais que as partes moles: aparecem como opacidades densas, muitas vezes laminadas. O cálculo que ocupa a pelve e os cálices molda a forma do sistema coletor — o coraliforme, típico de estruvita e infecção crônica.',
    estruturas: [
      e('Silhueta renal', 'Sombra do rim delineada pela gordura perirrenal, ao lado de L1-L3.', 'Contorno em feijão, homogêneo.', 'Opacidade densa projetada sobre ela, ramificada no coraliforme.', 'Calcificação de cartilagem costal se sobrepõe ao polo superior.'),
      e('Trajeto ureteral', 'Dos processos transversos lombares à junção sacroilíaca e à bexiga.', 'Invisível.', 'Pequena opacidade sobre um dos pontos de estreitamento.', 'Flebólitos ficam abaixo desse trajeto e têm centro lucente.'),
    ],
    marcacoes: {
      1: [
        m('Cálculo coraliforme', 'Opacidade ramificada moldando pelve e cálices.'),
        m('Laminação', 'Camadas concêntricas dentro do cálculo.'),
        m('Densidade', 'Mais branco que o osso adjacente.'),
      ],
      2: [
        m('Cálculo ureteral', 'Ponto denso no trajeto do ureter, junto ao processo transverso ou à sacroilíaca.'),
      ],
    },
    conduta: 'TC sem contraste na cólica; a radiografia simples acompanha cálculos radiopacos conhecidos e a litotripsia; tratar infecção no coraliforme.',
  },
  'calculos-biliares-e-vesicula-em-porcelana': {
    mecanismo: 'Cálculos de colesterol puro são invisíveis; os mistos e os pigmentares depositam carbonato de cálcio em camadas ou na periferia. Múltiplos cálculos se moldam uns aos outros — facetas. Na vesícula em porcelana, a inflamação crônica calcifica a própria parede, que fica como uma casca.',
    estruturas: [
      e('Hipocôndrio direito', 'Região sob a 12ª costela, lateral à coluna.', 'Sem calcificações.', 'Grupo de opacidades facetadas (cálculos) ou casca oval (porcelana).', 'Rim direito projeta-se no mesmo lugar: perfil separa.'),
      e('Parede vesicular', 'Camada muscular e mucosa.', 'Invisível.', 'Calcificada em casca contínua — porcelana.', 'Associada a carcinoma: cirurgia.'),
    ],
    marcacoes: {
      1: [
        m('Cálculos facetados', 'Opacidades com faces planas que se encaixam.'),
        m('Centro lucente ou laminação', 'Padrão em camadas dentro de cada cálculo.'),
        m('Topografia', 'Abaixo da 12ª costela direita, lateral à coluna.'),
      ],
      2: [
        m('Vesícula em porcelana', 'Casca calcificada oval na topografia da vesícula.'),
      ],
    },
    conduta: 'Ultrassom para cálculos; vesícula em porcelana: colecistectomia pelo risco de carcinoma, mesmo assintomática.',
  },
  'pneumatose-intestinal': {
    mecanismo: 'Gás entra na parede por dois caminhos: ruptura da mucosa com pressão luminal (isquemia, obstrução, enterocolite), ou dissecação a partir de ar alveolar rompido que desce pelo mediastino e pelo mesentério (DPOC, ventilação). No primeiro, o gás segue para as veias mesentéricas e para a porta; no segundo, é um achado.',
    estruturas: [
      e('Parede intestinal', 'Camadas da alça.', 'Invisível como parede.', 'Bolhas ou faixas lineares de gás paralelas à luz, por fora dela.', 'Fezes com gás na luz simulam — a pneumatose acompanha o contorno.'),
      e('Veia porta', 'Ramifica-se no fígado até a periferia.', 'Invisível.', 'Ramos lucentes que chegam à periferia do fígado — gás portal.', 'Aerobilia é central; gás portal é periférico.'),
    ],
    marcacoes: {
      1: [
        m('Gás na parede', 'Linhas ou bolhas escuras acompanhando o contorno das alças.'),
        m('Distribuição', 'Segmento longo — sugere isquemia mesentérica.'),
        m('Gás portal', 'Procure ramificações lucentes na periferia do fígado.'),
      ],
      2: [
        m('Ramos periféricos', 'Lucências ramificadas até a borda do fígado — veia porta.'),
      ],
    },
    conduta: 'Lactato, TC com contraste; laparotomia se isquemia; pneumatose cística benigna sem sintomas não se opera.',
  },
  'ileo-biliar': {
    mecanismo: 'Colecistite crônica cola a vesícula ao duodeno e um cálculo grande erode a parede, criando fístula colecistoduodenal. O ar do intestino sobe pela fístula para a via biliar (aerobilia) e o cálculo desce até encalhar no íleo terminal, onde a luz é mais estreita — obstrução mecânica.',
    estruturas: [
      e('Via biliar', 'Ductos no centro do fígado, convergindo para o hilo.', 'Invisível.', 'Ramificações lucentes centrais — aerobilia.', 'Gás portal é periférico.'),
      e('Íleo terminal', 'Última porção do delgado, na fossa ilíaca direita.', '—', 'Cálculo calcificado ectópico, longe da vesícula; delgado dilatado a montante.', 'O cálculo pode ser invisível — a TC o vê.'),
    ],
    marcacoes: {
      1: [
        m('Aerobilia', 'Gás ramificado no centro do fígado.'),
        m('Obstrução de delgado', 'Alças dilatadas com níveis.'),
        m('Cálculo ectópico', 'Opacidade calcificada na fossa ilíaca direita ou na pelve.'),
      ],
    },
    conduta: 'Enterolitotomia (retirada do cálculo); a fístula pode ser tratada depois. TC confirma a tríade e localiza o cálculo.',
  },
  'corpo-estranho-ingerido': {
    mecanismo: 'O esôfago tem três estreitamentos — cricofaríngeo, cruzamento do arco aórtico e junção gastroesofágica — onde objetos param. A bateria de botão, ao contato com a mucosa úmida, gera corrente e hidróxido na cátodo: queimadura em 2 horas, perfuração em horas. Ímãs em alças diferentes se atraem através das paredes e as necrosam.',
    estruturas: [
      e('Esôfago cervical', 'Atrás da traqueia, ao nível de C6.', 'Colabado, invisível.', 'Moeda de frente (o esôfago é largo no plano coronal); na traqueia ficaria de perfil.', 'Perfil resolve a dúvida: esôfago é posterior.'),
      e('Bateria de botão', 'Disco com anel duplo e borda em degrau.', '—', 'Halo (duplo anel) de frente e degrau de perfil.', 'Moeda não tem halo nem degrau.'),
    ],
    marcacoes: {
      1: [
        m('Moeda de frente', 'Disco redondo projetado no pescoço ou no mediastino superior — está no esôfago.'),
        m('Nível do estreitamento', 'Cricofaríngeo, arco aórtico ou junção esofagogástrica.'),
      ],
      2: [
        m('Sinal do halo', 'Duplo anel concêntrico — bateria de botão.'),
        m('Localização', 'Esôfago = emergência; estômago = observação com critérios.'),
      ],
    },
    conduta: 'Bateria no esôfago: endoscopia imediata (< 2 h); ímãs múltiplos: endoscopia/cirurgia; moeda no esôfago: endoscopia em 24 h se não passar; objetos no estômago sem risco: filme seriado.',
  },
  fecaloma: {
    mecanismo: 'Fezes retidas no reto perdem água e endurecem; o reto distende e o reflexo de evacuação se esgota. A massa cresce, comprime a bexiga e obstrui o cólon a montante; fezes líquidas passam ao lado (incontinência paradoxal). A pressão da massa contra a parede pode ulcerar (úlcera estercoral).',
    estruturas: [
      e('Reto e sigmoide', 'Cólon distal na pelve.', 'Pequena quantidade de fezes com gás.', 'Distendidos por massa heterogênea com bolhas — vidro moído.', 'Tumor não tem bolhas entremeadas.'),
      e('Bexiga', 'Anterior ao reto.', 'Não visível ou pequena.', 'Comprimida e deslocada para a frente e para cima.', 'Retenção urinária por fecaloma é comum no idoso.'),
    ],
    marcacoes: {
      1: [
        m('Massa fecal', 'Opacidade heterogênea volumosa na pelve, com bolhas de gás.'),
        m('Distensão retossigmoideana', 'O reto e o sigmoide alargados pela massa.'),
        m('Cólon a montante', 'Dilatação por obstrução funcional.'),
      ],
    },
    conduta: 'Desimpactação manual e enemas; investigar causa (opioides, hipotireoidismo, tumor); vigiar úlcera estercoral e perfuração.',
  },
  'pancreatite-cronica-calcificada': {
    mecanismo: 'Nos ductos pancreáticos, tampões de proteína calcificam (litostatina) e o parênquima fibrótico deposita cálcio — o processo de anos de inflamação, tipicamente alcoólica. As calcificações reproduzem a forma da glândula: oblíqua, cruzando a coluna em L1-L2.',
    estruturas: [
      e('Pâncreas', 'Retroperitoneal, da curva duodenal (cabeça) ao hilo esplênico (cauda).', 'Invisível.', 'Desenhado por calcificações puntiformes agrupadas em trajeto oblíquo.', 'Linfonodos calcificados são poucos e redondos.'),
      e('Aorta', 'À esquerda da coluna.', 'Invisível.', 'Pode ter calcificação própria — vertical, não oblíqua.', '—'),
    ],
    marcacoes: {
      1: [
        m('Calcificações agrupadas', 'Múltiplos pontos densos no epigástrio.'),
        m('Trajeto oblíquo', 'Da direita (L2) para cima e para a esquerda (L1).'),
        m('Topografia', 'Sobre a coluna, em L1-L2 — retroperitônio.'),
      ],
    },
    conduta: 'TC para ductos, pseudocistos e massa (câncer sobre pancreatite crônica); enzimas, insulina, analgesia; abstinência.',
  },
  'dupla-bolha': {
    mecanismo: 'A obstrução completa do duodeno impede a passagem de ar deglutido: estômago e bulbo duodenal distendem e o resto do intestino fica sem gás. A segunda bolha fica à direita da coluna, separada da primeira pelo piloro contraído.',
    estruturas: [
      e('Estômago', 'Hipocôndrio esquerdo.', 'Bolha gástrica pequena.', 'Distendido, com nível — a primeira bolha.', '—'),
      e('Bulbo duodenal', 'À direita da coluna, logo abaixo do piloro.', 'Sem gás.', 'Distendido — a segunda bolha.', 'Gás distal presente = estenose, membrana ou volvo.'),
    ],
    marcacoes: {
      1: [
        m('Duas bolhas', 'Estômago à esquerda e duodeno à direita, ambos com gás e nível.'),
        m('Ausência de gás distal', 'Abdome inferior completamente sem gás.'),
        m('Contexto', 'Vômito bilioso nas primeiras horas, polidrâmnio.'),
      ],
    },
    conduta: 'Sonda gástrica, hidratação, ecocardiograma (associação com cardiopatia na trissomia 21), cirurgia (duodenoduodenostomia). Com gás distal: estudo contrastado urgente para excluir volvo.',
  },
  'enterocolite-necrosante': {
    mecanismo: 'Isquemia, imaturidade da barreira e colonização bacteriana somam-se no prematuro: a mucosa se rompe, bactérias fermentadoras entram na parede e produzem gás (pneumatose); o gás segue pelas veias mesentéricas para a porta; a necrose transmural perfura.',
    estruturas: [
      e('Parede das alças', 'Camadas do intestino.', 'Invisível.', 'Bolhas (submucosa) ou linhas (subserosa) de gás — pneumatose.', 'Fezes com gás na luz simulam pneumatose.'),
      e('Alça fixa', 'Uma alça específica.', 'Muda de posição entre filmes.', 'Dilatada e na mesma posição em exames seriados — parede doente.', '—'),
    ],
    marcacoes: {
      1: [
        m('Pneumatose', 'Bolhas ou faixas lucentes na parede de alças, mais no cólon direito.'),
        m('Alça fixa', 'Alça dilatada que não muda entre filmes.'),
        m('Distensão', 'Alças dilatadas de forma difusa.'),
      ],
      2: [
        m('Gás portal', 'Ramificações lucentes sobre o fígado.'),
        m('Pneumoperitônio', 'Ar entre o fígado e a parede no decúbito lateral esquerdo.'),
      ],
    },
    conduta: 'Dieta zero, sonda, antibiótico, radiografia a cada 6 a 8 h; cirurgia ou dreno peritoneal se perfuração ou piora clínica.',
  },
  'aneurisma-de-aorta-calcificado': {
    mecanismo: 'A aterosclerose calcifica a íntima; a degeneração da média enfraquece a parede, que dilata. A calcificação, presa à parede, desenha o contorno do aneurisma — duas linhas curvas separadas pelo diâmetro dilatado. Só se vê quando há cálcio suficiente e quando a projeção é tangencial à parede.',
    estruturas: [
      e('Aorta abdominal', 'À esquerda da coluna lombar, da L1 à bifurcação em L4.', 'Invisível; calcificações lineares finas com diâmetro < 3 cm.', 'Calcificação curvilínea delimitando tubo > 3 cm.', 'Aorta tortuosa sem dilatação não é aneurisma.'),
      e('Psoas', 'Músculo lateral à coluna.', 'Contorno nítido.', 'Apagado se houver hematoma retroperitoneal — ruptura contida.', '—'),
    ],
    marcacoes: {
      1: [
        m('Parede calcificada', 'Linhas curvas paralelas à esquerda da coluna.'),
        m('Diâmetro', 'Distância entre as linhas acima de 3 cm.', 'medida'),
        m('Posição', 'Infrarrenal, entre L2 e L4.'),
      ],
      2: [
        m('Perfil', 'Aneurisma à frente da coluna lombar, melhor delimitado.'),
      ],
    },
    conduta: 'Ultrassom para medir e acompanhar; angiotomografia para planejar; reparo eletivo a partir de 5,5 cm (5,0 em mulheres) ou crescimento rápido; dor com aneurisma conhecido é ruptura até prova contrária.',
  },
  'sinal-de-chilaiditi': {
    mecanismo: 'A frouxidão dos ligamentos suspensores do cólon e do fígado, a atrofia hepática (cirrose), o diafragma elevado e a distensão colônica permitem que o cólon suba e se interponha entre o fígado e a cúpula direita. O gás da alça fica exatamente onde o ar livre ficaria — o que muda é que ele está dentro de uma víscera com parede e pregas.',
    estruturas: [
      e('Hemidiafragma direito', 'Cúpula sobre o fígado.', 'Encostada no fígado.', 'Separado do fígado por uma alça cheia de gás.', 'A cúpula aparece como linha, igual no pneumoperitônio.'),
      e('Haustrações', 'Pregas semilunares do cólon.', 'Visíveis no cólon com gás.', 'Visíveis dentro da lucência subdiafragmática — prova de que o gás está numa alça.', 'Sem haustras, é ar livre até prova contrária.'),
    ],
    marcacoes: {
      1: [
        m('Lucência subdiafragmática', 'Gás entre a cúpula direita e o fígado.'),
        m('Haustras', 'Pregas atravessando parcialmente a lucência — cólon interposto.'),
        m('Fígado rebaixado', 'Borda superior do fígado abaixo da alça.', 'referencia'),
      ],
    },
    conduta: 'Correlacionar com o abdome; decúbito lateral esquerdo ou TC se houver dúvida clínica. Sem sintomas, nenhum tratamento.',
  },
  'calcificacoes-abdominais-benignas': {
    mecanismo: 'Flebólitos são trombos venosos antigos que calcificaram em camadas, com o centro menos denso; linfonodos calcificam após infecção granulomatosa antiga; a cartilagem costal calcifica com a idade; fibromas uterinos degeneram e calcificam. Nenhum deles muda de conduta — reconhecer é o objetivo.',
    estruturas: [
      e('Flebólitos', 'Veias pélvicas laterais à bexiga.', '—', 'Opacidades redondas de 2 a 5 mm, centro lucente, abaixo da linha interespinhosa.', 'Cálculo ureteral distal fica acima e não tem centro lucente.'),
      e('Linfonodos mesentéricos', 'Ao longo do mesentério, centro do abdome.', '—', 'Calcificações grosseiras, em amora, poucas, que mudam de posição.', '—'),
    ],
    marcacoes: {
      1: [
        m('Flebólitos', 'Pequenos círculos com centro lucente na pelve lateral.'),
        m('Posição', 'Abaixo do trajeto ureteral, próximo à parede pélvica.'),
      ],
      2: [
        m('Linfonodos calcificados', 'Calcificações irregulares e móveis no centro do abdome.'),
      ],
    },
    conduta: 'Nenhuma; se dúvida entre flebólito e cálculo ureteral com clínica de cólica, TC sem contraste.',
  },
}
