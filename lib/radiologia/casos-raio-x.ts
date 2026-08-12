import manifesto from '@/data/radiologia/casos-raio-x-assets.json'

export type CategoriaCasoRaioX =
  | 'cardiovascular'
  | 'variantes'
  | 'vias-aereas'
  | 'dispositivos'
  | 'pneumotorax'
  | 'cancer-pulmao'
  | 'mediastino'

export interface ImagemCasoRaioX {
  id: string
  titulo: string
  sprite: string
  largura: number
  altura: number
  indice: number
}

export interface CasoRaioX {
  slug: string
  categoria: CategoriaCasoRaioX
  categoriaTitulo: string
  titulo: string
  resumo: string
  explicacao: string
  sinais: string[]
  armadilhas: string[]
  imagens: ImagemCasoRaioX[]
}

export interface GuiaCategoriaCasoRaioX {
  id: CategoriaCasoRaioX
  titulo: string
  resumo: string
  pergunta: string
  roteiro: string[]
  cor: string
}

export const GUIAS_CASOS_RAIO_X: Record<CategoriaCasoRaioX, GuiaCategoriaCasoRaioX> = {
  cardiovascular: {
    id: 'cardiovascular',
    titulo: 'Doenças cardiovasculares',
    resumo: 'Silhueta cardíaca, circulação pulmonar, edema, derrames e materiais de cirurgia cardíaca.',
    pergunta: 'O coração está realmente aumentado e há sinais de hipertensão venosa pulmonar?',
    roteiro: [
      'Confirme projeção, inspiração e rotação antes de medir o coração.',
      'Meça o índice cardiotorácico apenas em radiografia PA tecnicamente adequada.',
      'Compare vasos dos ápices e das bases, procurando redistribuição vascular.',
      'Procure edema intersticial, edema alveolar e derrames pleurais.',
      'Revise válvulas, fios, clipes, eletrodos e demais dispositivos.',
    ],
    cor: 'rose',
  },
  variantes: {
    id: 'variantes',
    titulo: 'Variações anatômicas do tórax',
    resumo: 'Achados congênitos ou relacionados à idade que não devem ser confundidos com doença.',
    pergunta: 'O achado representa doença, variante anatômica ou erro técnico?',
    roteiro: [
      'Confira marcador de lateralidade e rotação.',
      'Compare o achado com a anatomia esperada e procure simetria.',
      'Avalie se há efeito de massa, destruição ou alteração de volume.',
      'Correlacione com exame físico e imagens anteriores.',
      'Quando houver compressão ou dúvida, considere TC ou RM.',
    ],
    cor: 'emerald',
  },
  'vias-aereas': {
    id: 'vias-aereas',
    titulo: 'Vias aéreas e colapso pulmonar',
    resumo: 'Desvios traqueomediastinais, perda de volume e padrões de atelectasia lobar.',
    pergunta: 'A traqueia e o mediastino foram empurrados ou puxados?',
    roteiro: [
      'Exclua rotação antes de interpretar desvio traqueal.',
      'Determine o lado da perda ou do ganho de volume.',
      'Siga brônquios principais e fissuras.',
      'Procure elevação do hemidiafragma, aproximação das costelas e hiperinsuflação compensatória.',
      'Em adulto, colapso lobar exige busca de obstrução tumoral.',
    ],
    cor: 'amber',
  },
  dispositivos: {
    id: 'dispositivos',
    titulo: 'Dispositivos e artefatos',
    resumo: 'Cateteres, tubos, stents, próteses e objetos externos — com posição e complicações.',
    pergunta: 'Que dispositivo é este, onde deveria terminar e que complicação preciso excluir?',
    roteiro: [
      'Identifique todo material antes de analisar o parênquima.',
      'Siga cada tubo ou eletrodo de uma extremidade à outra.',
      'Confirme ponta, trajeto, continuidade e número de componentes.',
      'Procure pneumotórax, colapso, perfuração e mau posicionamento.',
      'Não deixe o dispositivo ocultar pulmões, hilos e pleura.',
    ],
    cor: 'cyan',
  },
  pneumotorax: {
    id: 'pneumotorax',
    titulo: 'Pneumotórax',
    resumo: 'Da linha pleural quase invisível ao pneumotórax hipertensivo e às complicações do dreno.',
    pergunta: 'Há linha pleural, ausência de trama além dela e sinais de tensão?',
    roteiro: [
      'Percorra ápices e margens laterais procurando a linha pleural visceral.',
      'Confirme ausência de vasos além da linha.',
      'Compare ambos os lados, inclusive quando um pneumotórax já foi encontrado.',
      'Procure deslocamento mediastinal, depressão diafragmática e colapso pulmonar.',
      'Diferencie pregas cutâneas e bolhas enfisematosas antes de drenar.',
    ],
    cor: 'orange',
  },
  'cancer-pulmao': {
    id: 'cancer-pulmao',
    titulo: 'Câncer de pulmão',
    resumo: 'Massas, colapso, invasão, metástases, resposta terapêutica e armadilhas frequentes.',
    pergunta: 'A opacidade pode ser neoplásica e existem sinais de extensão ou complicação?',
    roteiro: [
      'Descreva localização, tamanho, contorno, densidade e cavitação.',
      'Procure adenopatia hilar ou mediastinal e colapso distal.',
      'Revise pleura, ossos e pulmão contralateral em busca de extensão.',
      'Compare com exames anteriores para documentar crescimento ou resposta.',
      'Examine regiões de difícil visualização: atrás do coração, hilos e abaixo dos hemidiafragmas.',
    ],
    cor: 'violet',
  },
  mediastino: {
    id: 'mediastino',
    titulo: 'Mediastino e hilos',
    resumo: 'Massas por compartimento, alterações hilares, aorta, hérnia hiatal e pneumomediastino.',
    pergunta: 'Qual linha mediastinal desapareceu e a qual compartimento ela pertence?',
    roteiro: [
      'Avalie largura mediastinal e contornos paratraqueais.',
      'Use o sinal da silhueta para localizar a lesão no plano anteroposterior.',
      'Compare tamanho e densidade dos hilos.',
      'Siga botão, aorta ascendente e descendente.',
      'Procure nível hidroaéreo, gás mediastinal e efeitos sobre a traqueia.',
    ],
    cor: 'indigo',
  },
}

type Definicao = {
  categoria: CategoriaCasoRaioX
  slug: string
  titulo: string
  resumo: string
  explicacao: string
  imagens: string[]
  sinais?: string[]
  armadilhas?: string[]
}

const d = (
  categoria: CategoriaCasoRaioX,
  slug: string,
  titulo: string,
  resumo: string,
  explicacao: string,
  imagens: string[],
  sinais: string[] = [],
  armadilhas: string[] = [],
): Definicao => ({ categoria, slug, titulo, resumo, explicacao, imagens, sinais, armadilhas })

const DEFINICOES: Definicao[] = [
  d('cardiovascular', 'cardiomegalia', 'Cardiomegalia', 'Medição do índice cardiotorácico e sinais específicos de aumento do átrio esquerdo.', 'O índice cardiotorácico (ICT) é a maior largura cardíaca dividida pela maior largura interna do tórax. Em PA, inspiração adequada e ausência de rotação, valores acima de 50% sugerem cardiomegalia. O conjunto mostra progressão de aumento leve (53%) para importante (68%) e maciço (79%); neste último, a abertura da carina acima de 90°, o duplo contorno direito e a convexidade do apêndice atrial esquerdo apontam para grande dilatação atrial esquerda.', ['Cardiomegalia leve — ICT de 53%', 'Cardiomegalia — ICT de 68%', 'Aumento maciço do átrio esquerdo — ICT de 79%'], ['Qualidade PA adequada antes da medida', 'ICT calculado com bordas internas do tórax', 'Carina aberta, duplo contorno e apêndice atrial esquerdo'], ['AP portátil e má inspiração ampliam falsamente a silhueta.', 'Cardiomegalia isolada não equivale a insuficiência cardíaca.']),
  d('cardiovascular', 'redistribuicao-vascular', 'Redistribuição vascular para os ápices', 'Hipertensão venosa pulmonar com vasos superiores proeminentes, edema e derrames.', 'Quando a pressão venosa pulmonar aumenta, os vasos dos campos superiores tornam-se tão calibrosos quanto — ou mais que — os basais. Neste exemplo há cardiomegalia (ICT 55%), redistribuição vascular, linhas septais, opacidades alveolares e derrames pleurais bilaterais: uma sequência coerente de congestão até edema pulmonar.', ['Proeminência vascular dos campos superiores'], ['Vasos apicais aumentados', 'Linhas de Kerley B', 'Opacidades alveolares e seios costofrênicos apagados'], ['Compare vasos à mesma distância do hilo.', 'Decúbito e técnica AP alteram a distribuição aparente.']),
  d('cardiovascular', 'edema-intersticial', 'Edema pulmonar intersticial', 'Linhas de Kerley B como expressão do espessamento dos septos interlobulares.', 'As linhas septais são opacidades horizontais curtas, periféricas e em contato com a pleura, mais visíveis junto aos seios costofrênicos. Em suspeita de falência ventricular esquerda são sinal específico de edema intersticial. Podem ser discretas e ocorrer com ou sem edema alveolar; bloqueio linfático por linfangite carcinomatosa ou sarcoidose integra o diferencial.', ['Linhas septais — exemplo 1', 'Linhas septais — exemplo 2', 'Linhas septais sutis — exemplo 3'], ['Linhas horizontais curtas na periferia', 'Contato com a borda pleural', 'Predomínio nas bases'], ['Não chame toda linha basal de Kerley: vasos, cicatrizes e atelectasias laminares podem simular.', 'Integre com contexto cardíaco e sinais de congestão.']),
  d('cardiovascular', 'edema-alveolar', 'Edema pulmonar alveolar', 'Opacidades centrais em “asa de borboleta”, simétricas ou assimétricas.', 'O líquido ultrapassa o interstício e preenche alvéolos e pequenas vias aéreas, produzindo consolidação. Na forma cardiogênica aguda, as opacidades irradiam dos hilos em padrão de asa de borboleta, frequentemente com cardiomegalia, linhas septais e derrames. Distribuição assimétrica é possível. Coração normal favorece causas não cardiogênicas, como hipoalbuminemia, mas não as confirma sozinho.', ['Edema alveolar — padrão em asa de borboleta', 'Padrão assimétrico em asa de borboleta', 'Edema pulmonar agudo em radiografia portátil', 'Edema pulmonar não cardiogênico'], ['Opacidades perihilares bilaterais', 'Derrames e linhas septais de apoio', 'ICT e contexto clínico'], ['Infecção bilateral pode ter aparência semelhante.', 'Radiografias portáteis ruins exigem correlação clínica, não falsa certeza.']),
  d('cardiovascular', 'derrame-pleural', 'Derrames pleurais na insuficiência cardíaca', 'Velamento dos seios costofrênicos, por vezes marcadamente assimétrico.', 'Na falência ventricular esquerda, o líquido pleural costuma acompanhar cardiomegalia e congestão vascular. Pode ser bilateral ou assimétrico: posição em decúbito redistribui o líquido e altera o aspecto. A ausência de cardiomegalia e redistribuição não exclui causa cardíaca, mas aumenta a probabilidade de causas alternativas.', ['Derrames pleurais bilaterais', 'Derrame pleural assimétrico'], ['Sinal do menisco', 'Apagamento do seio costofrênico', 'Sinais associados de congestão'], ['O decúbito pode fazer o líquido laminar e parecer opacidade difusa.', 'Derrame unilateral volumoso merece investigação de outra causa.']),
  d('cardiovascular', 'derrame-pericardico', 'Derrame pericárdico', 'Silhueta cardíaca globosa em contextos de insuficiência, pós-operatório ou malignidade.', 'O acúmulo de líquido no saco pericárdico pode produzir coração aumentado e arredondado. A radiografia sugere, mas não confirma: o ecocardiograma demonstra líquido e repercussão hemodinâmica. Compare o caso congestivo, o pós-operatório sem outros sinais de falência e o derrame maligno acompanhado de metástases pulmonares e derrames pleurais.', ['Derrame pericárdico com sinais de insuficiência cardíaca', 'Derrame pericárdico pós-operatório', 'Derrame pericárdico maligno'], ['Configuração globosa', 'Aumento relativamente uniforme da silhueta', 'Dissociação entre grande coração e congestão'], ['A radiografia não diagnostica tamponamento.', 'Cardiomiopatia também pode gerar silhueta globosa.']),
  d('cardiovascular', 'calcificacoes-cardiacas', 'Calcificações cardíacas e pericárdicas', 'Aneurisma ventricular, pericárdio calcificado e calcificação valvar mitral.', 'A localização e o formato ajudam a inferir a origem. Calcificação curvilínea em casca de ovo junto à borda esquerda pode indicar aneurisma ventricular pós-infarto; calcificação que acompanha o contorno cardíaco sugere pericárdio e associa-se a pericardite constritiva; calcificação na topografia do anel/valva mitral é frequente em idosos.', ['Aneurisma calcificado do ventrículo esquerdo', 'Calcificação pericárdica', 'Calcificação da valva mitral'], ['Contorno, topografia e relação com a silhueta', 'História de infarto, tuberculose ou idade avançada'], ['Calcificação visível não define repercussão funcional.', 'TC e ecocardiograma caracterizam melhor extensão e função.']),
  d('cardiovascular', 'cardiopatias-congenitas', 'Cardiopatias congênitas', 'Padrões de fluxo pulmonar e alterações pós-correção cirúrgica.', 'Artéria pulmonar desproporcionalmente grande em relação ao botão aórtico sugere aumento do fluxo pulmonar por shunt esquerda-direita, como comunicação interatrial ou persistência do canal arterial. Após correção de tetralogia de Fallot, artérias pulmonares aumentadas e arco aórtico direito podem representar o novo basal do paciente.', ['Comunicação interatrial', 'Persistência do canal arterial', 'Cardiopatia congênita após cirurgia corretiva'], ['Compare artéria pulmonar e botão aórtico', 'Avalie vascularização pulmonar', 'Reconheça arco aórtico direito e artefatos cirúrgicos'], ['Radiografia sugere fisiologia, mas ecocardiograma define a anatomia.', 'Sempre consulte o histórico operatório.']),
  d('cardiovascular', 'marcapassos', 'Marcapassos e cardiodesfibriladores', 'Gerador, eletrodos, pneumotórax pós-implante e bobinas de choque do CDI.', 'O gerador costuma estar no espaço retropeitoral esquerdo e pode ter um ou dois eletrodos nas câmaras direitas. Após implante, procure pneumotórax e confira continuidade e posição. No cardiodesfibrilador implantável, segmentos espessos do eletrodo são bobinas de choque na veia cava superior/braquiocefálica e no ventrículo direito.', ['Marcapasso', 'Pneumotórax após inserção de marcapasso', 'Cardiodesfibrilador implantável'], ['Número e trajeto dos eletrodos', 'Ponta e continuidade', 'Pneumotórax pós-procedimento'], ['Não confunda bobinas normais do CDI com fratura.', 'O gerador pode ocultar lesões pulmonares.']),
  d('cardiovascular', 'artefatos-cirurgia-cardiaca', 'Artefatos de cirurgia cardíaca', 'Fios de esternotomia, clipes de revascularização e próteses valvares.', 'Fios de esternotomia e próteses valvares são comuns. Clipes ao longo das mamárias internas podem refletir enxertos de revascularização. Além de nomear o material, avalie integridade e procure doença nova: no terceiro exemplo há cardiomegalia, redistribuição vascular, linhas septais e derrames.', ['Artefatos de cirurgia cardíaca e marcapasso', 'Clipes de enxerto coronariano', 'Próteses valvares aórtica e mitral'], ['Reconheça material esperado', 'Verifique integridade e posição', 'Continue a leitura do pulmão e da pleura'], ['Artefato conhecido não deve encerrar a leitura.', 'A aparência “normal” depende do procedimento realizado.']),
  d('cardiovascular', 'outros-artefatos-cardiacos', 'Outros artefatos cardíacos', 'Stent coronário, eletrodos cutâneos de ECG e múltiplos dispositivos do paciente crítico.', 'Stents coronários podem ser discretamente visíveis. Botões de ECG e outros objetos externos devem ser reconhecidos para não simular nódulos. Em pacientes graves, linhas e tubos frequentemente permanecem projetados sobre o tórax; quando houver dúvida, examine o paciente e consulte o prontuário.', ['Stent coronário', 'Botões de ECG', 'Múltiplos artefatos médicos e fio de estimulação temporária'], ['Determine se o objeto é interno ou externo', 'Siga continuidade e posição', 'Procure achados ocultos por sobreposição'], ['Nem todo objeto externo pode ser retirado com segurança.', 'Não atribua automaticamente uma opacidade a artefato.']),

  d('variantes', 'dextrocardia', 'Dextrocardia e pseudodextrocardia', 'Diferenciar situs inversus verdadeiro de uma imagem digital invertida.', 'Na dextrocardia com situs inversus, coração e bolha gástrica ficam à direita e o ictus é palpável à direita. Uma radiografia digital invertida pode produzir aparência idêntica; marcador de lateralidade e exame físico resolvem a dúvida. Erro de rotulagem é mais frequente que dextrocardia.', ['Dextrocardia com situs inversus', 'Pseudodextrocardia por imagem invertida'], ['Marcador R/L', 'Bolha gástrica', 'Posição do ictus'], ['Nunca diagnostique dextrocardia apenas pela imagem sem checar lateralidade.']),
  d('variantes', 'arco-aortico-direito', 'Arco aórtico à direita', 'Variante incidental ou associação com compressão e cardiopatia congênita.', 'O arco aórtico direito pode ser isolado e assintomático ou acompanhar anomalias dos grandes vasos e tetralogia de Fallot. Desvio ou estreitamento traqueal visível sugere efeito compressivo; sintomas respiratórios ou disfagia justificam avaliação seccional por TC ou RM.', ['Arco aórtico à direita incidental', 'Arco aórtico à direita com desvio traqueal'], ['Botão aórtico no lado direito', 'Traqueia e esôfago', 'Outras alterações congênitas'], ['A radiografia raramente demonstra todo o anel vascular.']),
  d('variantes', 'fissura-azigos', 'Fissura ázigos', 'Fissura acessória direita com formato de girino.', 'A veia ázigos, revestida por pleura visceral e parietal, migra através do ápice e cria uma fissura. A veia forma a “cabeça” e a linha pleural a “cauda” do girino. É encontrada em cerca de 1–2% das radiografias e ocorre somente à direita.', ['Fissura ázigos'], ['Linha curva no ápice direito', 'Pequena densidade venosa em sua base'], ['Não confundir com cicatriz, pneumotórax ou linha de dispositivo.']),
  d('variantes', 'fissura-acessoria', 'Fissura pulmonar acessória', 'Linha fissural congênita que pode simular atelectasia laminar.', 'Fissuras acessórias resultam de separação incompleta ou adicional entre segmentos pulmonares. São geralmente incidentais, de contorno fino e posição anatômica previsível, sem sinais associados de perda de volume.', ['Fissura acessória'], ['Linha fina e lisa', 'Ausência de perda de volume'], ['Atelectasia linear costuma acompanhar alteração de volume ou contexto agudo.']),
  d('variantes', 'costela-cervical', 'Costela cervical', 'Costela supranumerária, geralmente assintomática, ocasionalmente relacionada à síndrome do desfiladeiro torácico.', 'Origina-se de C7 e pode ser unilateral ou bilateral, completa ou rudimentar. Quando comprime plexo braquial ou vasos subclávios, produz sintomas neurológicos ou vasculares do membro superior; a correlação clínica é indispensável.', ['Costela cervical — exemplo 1', 'Costela cervical — exemplo 2'], ['Origem em C7', 'Relação com primeira costela e clavícula'], ['A presença da costela não prova síndrome do desfiladeiro torácico.']),
  d('variantes', 'variantes-costais', 'Variantes das costelas', 'Costela bífida, fusão congênita e hipoplasia.', 'Costelas podem estar ausentes, ser hipoplásicas, fundidas ou bífidas. A continuidade cortical lisa e a ausência de reação óssea agressiva favorecem variante congênita, quase sempre sem significado clínico.', ['Costela bífida', 'Fusão congênita da primeira e segunda costelas', 'Hipoplasia da quarta costela direita'], ['Conte o gradil bilateralmente', 'Observe cortical e espaços intercostais'], ['Não confundir variantes estáveis com fratura, destruição ou sequela cirúrgica.']),
  d('variantes', 'calcificacao-costocondral', 'Calcificação costocondral', 'Mineralização relacionada à idade nas extremidades anteriores das costelas.', 'As cartilagens costais normalmente não são visíveis, mas calcificam progressivamente com a idade e podem ficar exuberantes. O padrão costuma ser bilateral e acompanha as junções costocondrais.', ['Calcificação costocondral'], ['Distribuição nas extremidades anteriores mediais', 'Padrão relacionado à idade'], ['Pode projetar pseudonódulos; confirme em incidências e exames prévios.']),
  d('variantes', 'pectus-excavatum', 'Pectus excavatum', 'Deslocamento posterior do esterno com efeitos típicos nas projeções PA e lateral.', 'Na projeção PA, o coração é deslocado à esquerda, a borda cardíaca direita pode desaparecer e as costelas assumem orientação oblíqua semelhante ao número 7. O perfil demonstra diretamente o esterno posteriorizado.', ['Pectus excavatum — radiografia PA', 'Pectus excavatum — radiografia lateral'], ['Borda cardíaca direita apagada', 'Costelas em “7”', 'Esterno posteriorizado no perfil'], ['Pode simular doença do lobo médio na incidência frontal.']),
  d('variantes', 'escoliose', 'Escoliose', 'Curvatura e rotação torácicas que dificultam a avaliação do tórax.', 'A rotação associada à escoliose altera projeção de hilos, mediastino e coração; o índice cardiotorácico pode ser impreciso. Radiografia de tórax não é o exame adequado para medir ou planejar tratamento da escoliose.', ['Escoliose torácica'], ['Curvatura e rotação', 'Assimetria das costelas e pedículos'], ['Não quantifique escoliose em radiografia de tórax comum.']),

  d('vias-aereas', 'fibrose-pos-radioterapia', 'Fibrose pós-radioterapia', 'Perda de volume localizada que puxa a traqueia.', 'Sem rotação do paciente, o desvio traqueal é verdadeiro. A fibrose do lobo superior esquerdo reduz volume e puxa a traqueia para o mesmo lado. O diagnóstico de fibrose actínica exige distribuição compatível e história de radioterapia.', ['Fibrose pós-radioterapia'], ['Traqueia puxada para o lado da perda de volume', 'Opacidade e retração localizadas'], ['Sem história de radioterapia, procure outras causas de fibrose e colapso.']),
  d('vias-aereas', 'pneumonectomia', 'Pneumonectomia', 'Desvio intenso para o lado operado e hiperexpansão compensatória do pulmão remanescente.', 'Após retirada do pulmão esquerdo, traqueia, hilos, coração e grandes vasos migram para preencher o espaço; o brônquio principal termina abruptamente. O pulmão direito expande-se e pode atravessar a linha média.', ['Pneumonectomia esquerda'], ['Hemotórax opacificado com perda de volume', 'Mediastino puxado', 'Coto brônquico'], ['O aspecto pós-operatório esperado deve ser comparado com exames anteriores; novo deslocamento pode indicar complicação.']),
  d('vias-aereas', 'grande-derrame-pleural', 'Grande derrame pleural', 'Ganho de volume que empurra mediastino e traqueia para o lado oposto.', 'A opacificação do hemitórax inferior esquerdo com menisco representa líquido pleural. Neste caso, o volume é suficiente para empurrar o mediastino à direita. A etiologia foi mesotelioma associado ao asbesto.', ['Grande derrame pleural esquerdo'], ['Menisco', 'Desvio contralateral', 'Aumento de volume'], ['Se o mediastino desvia para o mesmo lado, procure colapso coexistente.']),
  d('vias-aereas', 'derrame-e-colapso', 'Derrame pleural associado a colapso', 'Hemitórax branco com traqueia desviada para o mesmo lado porque a perda de volume domina.', 'Apesar do menisco indicar derrame, a interrupção abrupta do brônquio principal esquerdo revela obstrução tumoral e colapso. A perda de volume supera o volume do líquido, puxando a traqueia para o lado opacificado.', ['Derrame e colapso do pulmão esquerdo'], ['Menisco pleural', 'Corte abrupto brônquico', 'Desvio ipsilateral'], ['“Hemitórax branco” exige decidir se há ganho, perda ou equilíbrio de volume.']),
  d('vias-aereas', 'colapso-lobo-inferior-direito', 'Colapso do lobo inferior direito', 'Perda de volume direita associada à obstrução brônquica tumoral.', 'O hemitórax direito perde volume e o mediastino é puxado para a direita. A massa pode não ser visível; em adulto, colapso lobar sem causa evidente deve levantar suspeita de neoplasia obstrutiva.', ['Colapso do lobo inferior direito'], ['Desvio ipsilateral', 'Opacidade triangular basal/retrocardíaca', 'Perda de volume'], ['Não exigir visualização da massa para suspeitar de obstrução maligna.']),
  d('vias-aereas', 'colapso-lobo-inferior-esquerdo', 'Colapso do lobo inferior esquerdo', 'Sinal da vela e duplo contorno cardíaco esquerdo.', 'O lobo colapsado torna-se uma opacidade triangular atrás do coração, formando segunda borda cardíaca — o sinal da vela. O hemidiafragma esquerdo deixa de ser seguido até a coluna porque tecidos de mesma densidade entram em contato.', ['Colapso do lobo inferior esquerdo'], ['Dupla borda cardíaca esquerda', 'Sinal da vela', 'Perda da borda do hemidiafragma posterior'], ['A região retrocardíaca deve ser revisada em toda radiografia.']),
  d('vias-aereas', 'colapso-lobo-superior-direito', 'Colapso do lobo superior direito', 'Elevação da fissura horizontal e tração da traqueia para a direita.', 'A perda de ar torna o campo superior direito denso e reduz seu volume. A fissura horizontal sobe e a traqueia é puxada. Em adulto, essa atelectasia raramente é causada apenas por muco ou corpo estranho; obstrução neoplásica deve ser excluída.', ['Colapso do lobo superior direito'], ['Fissura horizontal elevada', 'Opacidade apical', 'Desvio traqueal ipsilateral'], ['Colapso lobar em adulto é um sinal indireto importante de tumor.']),
  d('vias-aereas', 'paralisia-frenica', 'Paralisia do nervo frênico', 'Massa hilar superior com elevação do hemidiafragma por invasão neural.', 'A massa hilar superior esquerda distorce a traqueia e invade o frênico, paralisando e elevando o hemidiafragma esquerdo. A própria massa impede que a traqueia se desloque livremente em direção à perda de volume.', ['Paralisia frênica por massa hilar'], ['Hemidiafragma elevado', 'Massa hilar/superior', 'Perda de volume'], ['Elevação diafragmática também ocorre por técnica, eventração e causas abdominais.']),
  d('vias-aereas', 'colapso-lobo-superior-esquerdo', 'Colapso do lobo superior esquerdo', 'Opacidade em véu e sinal da Luftsichel.', 'O lobo superior esquerdo colapsado cria opacidade em véu, apaga a borda cardíaca esquerda e reduz o hemitórax. O lobo inferior hiperinsuflado contorna medialmente o lobo colapsado, produzindo o crescente aéreo da Luftsichel. Massa hilar oval pode indicar a causa obstrutiva.', ['Colapso do lobo superior esquerdo'], ['Opacidade em véu', 'Desvio traqueal à esquerda', 'Luftsichel', 'Hemidiafragma esquerdo preservado'], ['O aspecto pode ser sutil; compare o volume dos dois hemitórax.']),

  d('dispositivos', 'pneumocistose-e-piercing', 'Pneumocistose e piercing mamilar', 'Opacidades bilaterais por Pneumocystis e artefato metálico da parede torácica.', 'A pneumocistose em paciente com HIV costuma produzir opacidades intersticiais hilares bilaterais e simétricas, mas pode assumir qualquer padrão — inclusive radiografia normal. O anel e seu fecho menos denso são externos.', ['Pneumocistose e piercing mamilar'], ['Opacidades bilaterais', 'Artefato metálico superficial'], ['Radiografia normal não exclui pneumocistose.']),
  d('dispositivos', 'cateter-jugular-tunelizado', 'Cateter jugular tunelizado para quimioterapia', 'Trajeto intravascular, túnel subcutâneo e pontos de entrada/saída.', 'O cateter entra pela jugular interna e termina na junção cavoatrial. Entre a saída cutânea e a entrada venosa, percorre túnel subcutâneo anterior; acessos externos permitem terapia prolongada.', ['Cateter jugular interno tunelizado'], ['Ponta na junção cavoatrial', 'Segmento intravenoso', 'Túnel subcutâneo e acessos externos'], ['Confirme ausência de pneumotórax e trajeto arterial após inserção.']),
  d('dispositivos', 'port-a-cath', 'Port-a-cath', 'Reservatório totalmente implantado conectado ao sistema venoso central.', 'O cateter entra na veia subclávia e liga-se a um reservatório subcutâneo puncionável. No caso, o pulmão mostra retículo grosseiro e linhas paralelas de bronquiectasias relacionadas à fibrose cística.', ['Port-a-cath e bronquiectasias'], ['Reservatório subcutâneo', 'Ponta venosa central', 'Trajeto contínuo'], ['Inspecione também o pulmão sob o dispositivo.']),
  d('dispositivos', 'cateter-tunelizado', 'Cateter tunelizado', 'Acesso venoso central prolongado pela via subclávia esquerda.', 'Outro modelo de linha tunelizada em paciente oncológico. A leitura deve documentar ponto de entrada, trajeto, ponta e complicações pleuropulmonares.', ['Cateter tunelizado pela subclávia esquerda'], ['Trajeto sem angulação abrupta', 'Ponta venosa central'], ['Dobras e migração podem comprometer funcionamento.']),
  d('dispositivos', 'stent-esofagico', 'Stent esofágico', 'Prótese expansível associada a câncer esofágico metastático.', 'Além do stent, há fios de esternotomia, destruição da quinta costela direita com massa de partes moles e derrames pleurais. É um exemplo de como a análise do dispositivo não substitui a leitura sistemática.', ['Stent esofágico e doença metastática'], ['Stent no trajeto esofágico', 'Destruição costal', 'Massa extrapleural e derrames'], ['Não interrompa a leitura depois de identificar o dispositivo.']),
  d('dispositivos', 'tubo-endotraqueal-mal-posicionado', 'Tubo endotraqueal mal posicionado', 'Ponta no brônquio principal direito com colapso do pulmão esquerdo.', 'O tubo avançou além da carina e ventila preferencialmente o pulmão direito. O esquerdo colapsa, fica opaco e exibe broncogramas aéreos. Reposicionamento acima da carina permite reexpansão.', ['Tubo endotraqueal no brônquio principal direito'], ['Localize carina e ponta', 'Opacificação por colapso contralateral', 'Broncogramas aéreos'], ['A flexão do pescoço pode avançar a ponta; a extensão pode retraí-la.']),
  d('dispositivos', 'artefatos-de-cirurgia-cardiaca', 'Artefatos de cirurgia cardíaca', 'Fios medianos, prótese aórtica e clipes axilares.', 'Fios de esternotomia marcam acesso mediano, a prótese situa-se na posição aórtica e clipes axilares relacionam-se a mastectomia parcial prévia. A topografia e a história distinguem materiais de diferentes procedimentos.', ['Fios de esternotomia, prótese aórtica e clipes axilares'], ['Posição e finalidade de cada artefato', 'Continuidade dos fios'], ['Clipes fora do mediastino podem pertencer a cirurgia mamária, não cardíaca.']),
  d('dispositivos', 'protese-valvar-mitral', 'Prótese valvar mitral', 'Scout de TC demonstrando fios de esternotomia e prótese mitral.', 'A projeção de planejamento da TC não equivale a uma radiografia diagnóstica, mas permite reconhecer material. A posição mais inferior e posterior ajuda a localizar a prótese mitral.', ['Prótese valvar mitral em scout de TC'], ['Fios medianos', 'Topografia valvar'], ['A incidência e a rotação influenciam a projeção das válvulas.']),
  d('dispositivos', 'marcapasso-ocultando-massa', 'Marcapasso ocultando massa pulmonar', 'Pequena opacidade na margem do gerador, retrospectivamente já maligna.', 'Os eletrodos terminam em átrio direito, ventrículo direito e seio coronário. Na borda do gerador há uma opacidade pulmonar que poderia ser ignorada; o caso seguinte demonstra sua progressão.', ['Marcapasso ocultando massa pulmonar'], ['Revise contornos do gerador', 'Examine pulmão e ossos “por trás” dos dispositivos'], ['Satisfação de busca após identificar o marcapasso é perigosa.']),
  d('dispositivos', 'marcapasso-com-massa-pulmonar', 'Marcapasso com massa pulmonar', 'Progressão da opacidade antes encoberta pelo gerador.', 'No seguimento, a massa torna-se evidente. A TC demonstrou doença inoperável já na época da primeira radiografia, reforçando a necessidade de leitura sistemática de toda a imagem.', ['Massa pulmonar adjacente ao marcapasso'], ['Crescimento em exames seriados', 'Contorno independente do gerador'], ['Sempre compare com exames anteriores.']),
  d('dispositivos', 'eletrodo-de-marcapasso-fraturado', 'Eletrodo de marcapasso fraturado', 'Descontinuidade do fio associada à falha do dispositivo.', 'A fratura do eletrodo explica o mau funcionamento. A radiografia também mostra silhueta cardíaca muito aumentada, considerando a projeção AP sentada, e vasos superiores aumentados por hipertensão venosa pulmonar.', ['Fratura do eletrodo de marcapasso'], ['Interrupção ou angulação do fio', 'Cardiomegalia e congestão associadas'], ['Sobreposição pode simular descontinuidade; confirme em outra projeção.']),

  d('pneumotorax', 'pneumotorax-hipertensivo', 'Pneumotórax hipertensivo', 'Emergência com colapso pulmonar e deslocamento mediastinal contralateral.', 'O hemitórax esquerdo hiperlúcido contém ar pleural; o pulmão está completamente comprimido. Traqueia e coração desviam-se à direita e o hemidiafragma esquerdo está deprimido. Quando a tensão é diagnosticada clinicamente, o tratamento não deve esperar radiografia.', ['Pneumotórax hipertensivo esquerdo'], ['Pulmão colapsado', 'Desvio mediastinal', 'Depressão diafragmática'], ['É diagnóstico clínico e requer descompressão imediata.']),
  d('pneumotorax', 'tamanho-do-pneumotorax', 'Tamanho do pneumotórax', 'Medição hilar, pneumotórax apical e compressão não uniforme.', 'A regra britânica clássica considera grande a separação maior que 2 cm no nível do hilo, mas só se aplica quando a borda pulmonar é aproximadamente paralela à parede. Coleções localizadas podem conter grande volume sem separação hilar. Sintomas e doença pulmonar de base influenciam a conduta.', ['Pneumotórax grande — mais de 2 cm no hilo', 'Pneumotórax pequeno e apical', 'Pneumotórax localizado: pequeno ou grande?'], ['Meça no nível do hilo quando aplicável', 'Avalie forma e volume', 'Integre sintomas e reserva pulmonar'], ['Não use a regra de 2 cm em compressão não uniforme.']),
  d('pneumotorax', 'pneumotorax-sutil', 'Pneumotórax sutil', 'Linha pleural fina e discreta, sem trama pulmonar além dela.', 'O aspecto clássico é uma linha fina como traço de lápis que representa a pleura visceral. Todo tórax deve ser inspecionado especificamente para pneumotórax. Radiografia expiratória não oferece benefício rotineiro; TC pode resolver dúvida selecionada.', ['Pneumotórax pequeno e sutil'], ['Linha pleural visceral', 'Ausência de vasos periféricos'], ['Pregas cutâneas e borda escapular podem imitar a linha pleural.']),
  d('pneumotorax', 'grande-pneumotorax-tensao-inicial', 'Grande pneumotórax com tensão inicial', 'Deslocamentos discretos podem preceder deterioração rápida.', 'Há grande pneumotórax direito com coração desviado à esquerda, hemidiafragma direito discretamente deprimido e pequeno desvio traqueal. A elevação da pressão reduz retorno venoso; a prioridade é ABC e ajuda imediata, não discutir terminologia.', ['Grande pneumotórax direito com sinais iniciais de tensão'], ['Desvio cardíaco', 'Depressão do hemidiafragma', 'Desvio traqueal mesmo discreto'], ['A gravidade clínica não depende de desvio exuberante.']),
  d('pneumotorax', 'dreno-toracico', 'Dreno torácico', 'Reexpansão após drenagem com mínimo pneumotórax residual.', 'No mesmo paciente, o dreno projeta-se para o tórax superior e resta pequena coleção apical. Além da ponta, verifique orifícios laterais, dobras e posição extrapleural.', ['Dreno torácico e pneumotórax residual'], ['Trajeto e ponta do dreno', 'Linha pleural residual'], ['Ponta ideal depende da indicação; posição isolada não define funcionamento.']),
  d('pneumotorax', 'enfisema-subcutaneo', 'Enfisema subcutâneo após dreno', 'Ar nos tecidos moles como complicação do dreno ou do próprio pneumotórax.', 'O ar disseca planos subcutâneos e produz lucências lineares. Pode resultar de técnica, deslocamento do dreno ou de orifício lateral situado fora da cavidade pleural; à palpação, causa crepitação semelhante a plástico-bolha.', ['Dreno torácico e enfisema subcutâneo'], ['Lucências nos tecidos moles', 'Posição dos orifícios laterais'], ['Enfisema extenso pode ocultar um pneumotórax subjacente.']),
  d('pneumotorax', 'pneumotorax-iatrogenico', 'Pneumotórax iatrogênico', 'Ar pleural após toracocentese, associado a líquido residual.', 'Após instrumentação pleural, deve-se procurar pneumotórax. Quando ar e líquido coexistem, a interface tende a ficar horizontal, e não em menisco. Há consolidação/derrame residual na base direita e pneumotórax acima.', ['Hidropneumotórax após toracocentese'], ['Linha pleural', 'Nível ar-líquido horizontal', 'Derrame residual'], ['A necessidade de drenagem depende do tamanho e da condição clínica.']),
  d('pneumotorax', 'pneumotorax-bilateral-na-dpoc', 'Pneumotórax bilateral na DPOC', 'Pneumotórax secundário em pulmões com enfisema e múltiplas bolhas.', 'Além de bolhas de paredes curvas, há bordas pulmonares pleurais em ambos os lados. Encontrar pneumotórax unilateral não encerra a busca; doença pulmonar grave reduz reserva e aumenta relevância clínica mesmo de coleções menores.', ['Pneumotórax bilateral em enfisema grave'], ['Bordas pulmonares bilaterais', 'Bolhas enfisematosas', 'Hiperinsuflação'], ['Diferenciar parede de bolha de pleura visceral pode exigir TC.']),
  d('pneumotorax', 'pseudopneumotorax-bolha', 'Pseudopneumotórax por bolha gigante', 'Bolha enfisematosa que simula ar pleural.', 'Pregas de pele e bolhas gigantes são imitadores importantes. Compare com exames antigos: estabilidade favorece bolha. Em dúvida clínica ou radiológica, discuta TC antes de inserir dreno, pois perfurar uma bolha pode causar dano grave.', ['Bolha gigante simulando pneumotórax'], ['Procure vasos e parede da bolha', 'Compare com estudos prévios'], ['Não coloque dreno se o diagnóstico não estiver seguro.']),

  d('cancer-pulmao', 'massa-versus-consolidacao', 'Massa versus consolidação', 'A radiografia frequentemente não distingue neoplasia de infecção.', 'Uma massa arredondada grande e uma consolidação podem ambas representar câncer. Derrame pleural também ocorre em infecção e malignidade. A informação clínica, a evolução e exames complementares — especialmente TC e broncoscopia — definem a etiologia.', ['Câncer de pulmão — massa', 'Câncer de pulmão — consolidação'], ['Descreva padrão sem presumir etiologia', 'Procure efeito de massa, colapso e adenopatia'], ['“Consolidação” descreve preenchimento alveolar; não significa necessariamente infecção.']),
  d('cancer-pulmao', 'massa-hilar-e-derrame', 'Massa hilar e derrame pleural', 'Hilo direito anormal, adenopatia paratraqueal e derrame.', 'O hilo direito está maior e mais denso, com apagamento das estruturas vasculares normais. Linfonodos alargam o mediastino e apagam a faixa paratraqueal; o seio costofrênico forma menisco. Broncoscopia e biópsia confirmaram câncer.', ['Massa hilar direita e derrame'], ['Assimetria hilar', 'Faixa paratraqueal apagada', 'Menisco pleural'], ['Compare hilos por tamanho e densidade, não apenas altura.']),
  d('cancer-pulmao', 'massa-cavitada', 'Massa pulmonar cavitada', 'Necrose central em neoplasia, particularmente carcinoma escamoso.', 'Tumores sólidos podem necrosar e cavitar. Parede espessa ou irregular aumenta suspeita, mas infecção e vasculite também cavitam. Fios e clipes indicam revascularização miocárdica prévia e não explicam a lesão pulmonar.', ['Massa pulmonar cavitada'], ['Parede e contorno da cavidade', 'Componente sólido', 'Lesões adicionais'], ['Cavitação não é sinônimo de câncer; use clínica, TC e histologia.']),
  d('cancer-pulmao', 'colapso-lobar-sinal-s-dourado', 'Colapso lobar — sinal do S dourado', 'Massa central deforma a fissura horizontal elevada.', 'A perda de volume eleva a fissura horizontal; a massa obstrutiva produz convexidade focal e cria um contorno em S. Esse sinal é altamente sugestivo de câncer bloqueando o brônquio do lobo superior direito.', ['Colapso do lobo superior direito — sinal do S dourado'], ['Fissura elevada', 'Convexidade causada pela massa', 'Perda de volume'], ['A massa pode ser menos evidente que o sinal indireto de colapso.']),
  d('cancer-pulmao', 'paralisia-do-nervo-frenico', 'Progressão tumoral e paralisia frênica', 'Elevação do hemidiafragma após crescimento de massa hilar.', 'Inicialmente há pequeno nódulo próximo ao hilo e hemidiafragma direito normal. Dezoito meses depois, a massa alcança hilo e borda cardíaca; a nova elevação diafragmática indica invasão ou compressão do nervo frênico.', ['Nódulo hilar com hemidiafragma normal', 'Massa progressiva com paralisia frênica'], ['Compare altura diafragmática no tempo', 'Avalie crescimento e contato hilar'], ['Mudança do hemidiafragma pode ser a pista de progressão, mesmo antes de sintomas.']),
  d('cancer-pulmao', 'destruicao-ossea', 'Destruição óssea por câncer de pulmão', 'Invasão direta da parede torácica com lise de costelas.', 'Massa no campo superior direito atravessa a parede e destrói segmentos da terceira e quarta costelas. Dor crescente no ombro pode ser a manifestação dominante, mesmo sem novos sintomas respiratórios.', ['Massa pulmonar com destruição da terceira e quarta costelas'], ['Falhas corticais', 'Massa de partes moles associada', 'Dor localizada'], ['Revise costelas atrás de massas e nos ápices.']),
  d('cancer-pulmao', 'resposta-a-radioterapia', 'Resposta à radioterapia', 'Redução de nódulo espiculado após radioterapia estereotáxica.', 'O nódulo arredondado do campo médio direito apresenta margens espiculadas no detalhe, característica suspeita confirmada por biópsia. Após radioterapia, diminui significativamente. Comparação deve considerar tamanho, densidade e alterações actínicas ao redor.', ['Nódulo maligno antes do tratamento', 'Detalhe da margem espiculada', 'Redução após radioterapia'], ['Margens espiculadas', 'Mensuração comparável', 'Mudanças pós-tratamento'], ['Fibrose actínica pode dificultar a avaliação de recidiva.']),
  d('cancer-pulmao', 'progressao-da-doenca', 'Progressão do câncer de pulmão', 'Série temporal de resposta inicial, recidiva e progressão pleuromediastinal.', 'A massa hilar responde à quimioterapia, mas permanece paralisia frênica. Depois recidiva com consolidação distal, perda de volume, derrame e extensão mediastinal contralateral. A fissura sobe com colapso e surge derrame subpulmonar; no último exame, massa e derrames aumentam, inclusive contralateralmente.', ['Antes do tratamento', 'Três meses após quimioterapia — resposta', 'Quatro meses após quimioterapia — recidiva', 'Progressão com derrame subpulmonar', 'Progressão adicional e derrame contralateral'], ['Compare sempre na mesma ordem', 'Fissuras e hemidiafragma revelam volume', 'Pleura e mediastino mostram extensão'], ['Resposta parcial não encerra vigilância; sinais indiretos podem persistir ou antecipar recidiva.']),
  d('cancer-pulmao', 'metastases-do-pulmao', 'Metástases de câncer pulmonar', 'Disseminação para o pulmão contralateral e para costela.', 'Uma massa pulmonar primária pode gerar múltiplos nódulos em ambos os pulmões ou invadir/metastatizar para osso. Expansão focal da sexta costela direita indica doença óssea.', ['Metástases de pulmão para pulmão', 'Metástase de pulmão para costela'], ['Nódulos múltiplos', 'Lesão costal expansiva', 'Massa primária dominante'], ['Nem todo nódulo adicional é metástase; contexto e TC são necessários.']),
  d('cancer-pulmao', 'metastases-para-o-pulmao', 'Metástases para os pulmões', 'Padrões nodulares de colangiocarcinoma e carcinoma renal.', 'Metástases hematogênicas variam de inúmeros micronódulos a nódulos arredondados grandes de tamanhos diferentes. O carcinoma renal é classicamente associado a metástases “em bala de canhão”, mas a aparência não identifica com segurança o tumor primário.', ['Metástases pulmonares de colangiocarcinoma', 'Metástases em “bala de canhão” de carcinoma renal'], ['Distribuição bilateral aleatória', 'Número e tamanhos variados'], ['O padrão sugere via de disseminação, não define a origem.']),
  d('cancer-pulmao', 'armadilha-massa-retrocardiaca', 'Armadilha: massa atrás do coração', 'Grande câncer de pulmão oculto na zona retrocardíaca esquerda.', 'À primeira vista a radiografia parece normal, mas há massa arredondada no lobo inferior esquerdo sobreposta ao coração. A revisão sistemática das regiões retrocardíaca e paravertebral evita essa falha perceptiva.', ['Massa pulmonar retrocardíaca'], ['Aumento focal de densidade através da silhueta cardíaca', 'Assimetria retrocardíaca'], ['Não aumente brilho e contraste apenas no centro dos pulmões; revise zonas ocultas.']),
  d('cancer-pulmao', 'armadilha-massa-subdiafragmatica', 'Armadilha: massa abaixo do diafragma', 'Nódulo pulmonar baixo projetado sobre partes moles do abdome superior.', 'O pulmão estende-se abaixo da cúpula diafragmática na periferia. O nódulo no campo inferior direito fica parcialmente oculto por tecidos abdominais; no detalhe, é espiculado e cavitado.', ['Massa pulmonar projetada abaixo do diafragma', 'Detalhe espiculado e cavitado'], ['Revise recessos costofrênicos e pulmão infradiafragmático', 'Procure contorno independente'], ['Não trate toda densidade sob a cúpula como abdominal.']),

  d('mediastino', 'massa-mediastinal-anterior', 'Massa mediastinal anterior', 'Timoma e bócio localizados pela preservação de linhas de outros compartimentos.', 'No timoma, contornos mediastinais abaulam, mas botão aórtico, linha ázigo-esofágica e aorta descendente permanecem visíveis, afastando origem média ou posterior. O bócio estreita e desvia a traqueia, apagando a faixa paratraqueal apenas no nível da massa.', ['Massa mediastinal anterior — timoma', 'Massa mediastinal anterior — tireoide'], ['Use linhas preservadas para localizar', 'Avalie desvio e estreitamento traqueal'], ['Radiografia localiza aproximadamente; TC caracteriza extensão.']),
  d('mediastino', 'massa-mediastinal-superior', 'Massa mediastinal superior', 'Linfoma alargando o mediastino e apagando contornos.', 'A massa de partes moles alarga o mediastino superior, mistura-se ao topo do botão aórtico e apaga a faixa paratraqueal direita. Derrames bilaterais coexistem. Biópsia linfonodal confirmou linfoma.', ['Massa mediastinal superior — linfoma'], ['Alargamento superior', 'Faixa paratraqueal apagada', 'Derrames'], ['Técnica AP pode ampliar mediastino; procure sinais estruturais adicionais.']),
  d('mediastino', 'massa-mediastinal-posterior', 'Massa mediastinal posterior', 'Localização retrocardíaca pelo apagamento da aorta descendente.', 'A massa arredondada esquerda preserva borda cardíaca e vasos hilares, mas apaga a linha da aorta descendente. Pelo sinal da silhueta, isso localiza a lesão posteriormente.', ['Massa mediastinal posterior'], ['Borda cardíaca preservada', 'Hilo preservado', 'Aorta descendente apagada'], ['Uma massa “hilar” na projeção frontal pode ser posterior.']),
  d('mediastino', 'aumento-hilar-unilateral', 'Aumento hilar unilateral', 'Hilo esquerdo grande, denso e com vasos indistintos por câncer broncogênico.', 'Hilos normais são assimétricos no formato, mas semelhantes em densidade e volume. Aumento unilateral, especialmente com perda da arquitetura vascular, sugere massa ou adenopatia e exige investigação.', ['Aumento hilar unilateral — câncer de pulmão'], ['Compare densidade e tamanho', 'Procure vasos atravessando a opacidade'], ['Não confundir artéria pulmonar proeminente com massa sem avaliar seus ramos.']),
  d('mediastino', 'aumento-hilar-bilateral', 'Aumento hilar bilateral', 'Sarcoidose e linfoma com aparência radiográfica semelhante.', 'Adenopatia hilar bilateral simétrica é clássica da sarcoidose, mas não específica. Linfoma pode produzir padrão quase idêntico; distribuição, clínica e biópsia linfonodal distinguem.', ['Aumento hilar bilateral — sarcoidose', 'Aumento hilar bilateral — linfoma'], ['Simetria, contorno e adenopatia paratraqueal', 'Alterações pulmonares associadas'], ['“Bilateral” não significa automaticamente sarcoidose.']),
  d('mediastino', 'fibrose-pos-radioterapia-mediastinal', 'Fibrose pós-radioterapia', 'Cicatrização perihilar na distribuição do campo irradiado.', 'Anos após radioterapia para doença de Hodgkin, pulmões junto aos hilos tornam-se retraídos e densos. O diagnóstico depende da história e da correspondência com o território irradiado.', ['Fibrose pós-radioterapia perihilar'], ['Opacidade e retração geométricas', 'Distribuição relacionada ao campo'], ['Sem história de radioterapia, não use esse diagnóstico por aparência isolada.']),
  d('mediastino', 'aumento-da-aorta', 'Aumento da aorta torácica', 'Aneurisma descendente e dilatação pós-estenótica da aorta ascendente.', 'A aorta descendente pode estar grosseiramente alargada por aneurisma. Na estenose por valva aórtica bicúspide, jato pós-estenótico dilata a aorta ascendente mesmo antes de cardiomegalia ou falência ventricular.', ['Aneurisma da aorta descendente', 'Dilatação aneurismática da aorta ascendente'], ['Identifique o segmento aórtico', 'Compare com exames prévios', 'Procure calcificação e efeito de massa'], ['Radiografia não exclui síndrome aórtica aguda; TC angiográfica é o exame decisivo quando indicada.']),
  d('mediastino', 'desenrolamento-da-aorta', 'Desenrolamento da aorta', 'Alongamento senil da aorta, frequentemente acompanhado de aterosclerose calcificada.', 'Com a idade, a aorta ascendente alonga-se e o botão torna-se mais proeminente. É achado comum e não constitui aneurisma por si só. Calcificação mural indica aterosclerose.', ['Desenrolamento e calcificação da aorta'], ['Alongamento sem massa focal', 'Calcificação parietal'], ['Não confundir proeminência esperada da idade com aneurisma; compare contornos e dimensões.']),
  d('mediastino', 'coarctacao-da-aorta', 'Coarctação da aorta', 'Entalhes costais e sinal do número 3.', 'O estreitamento congênito desvia fluxo para artérias intercostais, que erodem a borda inferior da quarta à oitava costelas bilateralmente. O contorno pré-estenótico, o ponto de coarctação e a dilatação pós-estenótica formam o sinal do 3.', ['Entalhes costais na coarctação', 'Sinal do número 3'], ['Notching inferior bilateral de costelas médias', 'Contorno aórtico em 3'], ['Os sinais podem ser discretos; suspeita clínica orienta angio-TC ou RM.']),
  d('mediastino', 'hernia-hiatal', 'Hérnia hiatal', 'Estômago intratorácico com nível hidroaéreo retrocardíaco.', 'A herniação do estômago acima do diafragma varia de pequena a muito volumosa. Um nível gás-líquido retrocardíaco é pista central, embora pequenas hérnias possam não aparecer na radiografia.', ['Hérnia hiatal grande', 'Hérnia hiatal pequena'], ['Nível hidroaéreo retrocardíaco', 'Localização acima do diafragma'], ['Ausência na radiografia não exclui hérnia hiatal.']),
  d('mediastino', 'pneumomediastino', 'Pneumomediastino', 'Gás delineando estruturas e separando a pleura mediastinal.', 'Ar proveniente de lesão pulmonar, via aérea ou esôfago disseca tecidos do mediastino. A pleura mediastinal torna-se uma linha branca fina; enfisema subcutâneo e pneumotórax podem coexistir.', ['Pneumomediastino'], ['Linhas de gás ao redor de estruturas mediastinais', 'Pleura mediastinal visível'], ['O achado pode ser muito sutil; etiologia esofágica exige atenção urgente.']),
]

const paginas = new Map(
  (manifesto.pages as Array<{
    category: CategoriaCasoRaioX
    slug: string
    images: Array<{ index: number; file: string; frameWidth: number; height: number }>
  }>).map((pagina) => [`${pagina.category}/${pagina.slug}`, pagina]),
)

export const CASOS_RAIO_X: CasoRaioX[] = DEFINICOES.map((definicao) => {
  const guia = GUIAS_CASOS_RAIO_X[definicao.categoria]
  const pagina = paginas.get(`${definicao.categoria}/${definicao.slug}`)
  if (!pagina) throw new Error(`Manifesto ausente para ${definicao.categoria}/${definicao.slug}`)
  if (pagina.images.length < definicao.imagens.length) {
    throw new Error(`Imagens insuficientes para ${definicao.slug}: ${pagina.images.length}/${definicao.imagens.length}`)
  }
  return {
    slug: definicao.slug,
    categoria: definicao.categoria,
    categoriaTitulo: guia.titulo,
    titulo: definicao.titulo,
    resumo: definicao.resumo,
    explicacao: definicao.explicacao,
    sinais: definicao.sinais ?? [],
    armadilhas: definicao.armadilhas ?? [],
    imagens: definicao.imagens.map((titulo, indice) => {
      const imagem = pagina.images[indice]
      return {
        id: `${definicao.slug}-${indice + 1}`,
        titulo,
        sprite: imagem.file,
        largura: imagem.frameWidth,
        altura: imagem.height,
        indice: indice + 1,
      }
    }),
  }
})

export const CASOS_POR_SLUG = new Map(CASOS_RAIO_X.map((caso) => [caso.slug, caso]))
export const TOTAL_CASOS_RAIO_X = CASOS_RAIO_X.length
export const TOTAL_IMAGENS_CASOS_RAIO_X = CASOS_RAIO_X.reduce((total, caso) => total + caso.imagens.length, 0)

export function casosDaCategoria(categoria: CategoriaCasoRaioX) {
  return CASOS_RAIO_X.filter((caso) => caso.categoria === categoria)
}

export function casoVizinho(slug: string, direcao: -1 | 1) {
  const indice = CASOS_RAIO_X.findIndex((caso) => caso.slug === slug)
  if (indice < 0) return null
  return CASOS_RAIO_X[indice + direcao] ?? null
}
