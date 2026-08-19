import type { Marcador } from '../tipos'

/**
 * Hematologia avançada — os índices que o hemograma automatizado entrega e
 * quase ninguém lê, mais os exames de segunda linha da série vermelha.
 *
 * Há uma ideia comum a quase tudo neste arquivo: o contador automático mede
 * muito mais do que o laudo costuma destacar, e vários desses parâmetros
 * respondem perguntas que exigiriam exames caros. A hemoglobina reticulocitária
 * diz se o eritroblasto está recebendo ferro **hoje**, semanas antes de a
 * ferritina refletir; a fração de plaquetas imaturas diz se a medula está
 * produzindo, e evita uma punção medular; os granulócitos imaturos quantificam
 * o desvio à esquerda sem depender de alguém olhar a lâmina.
 *
 * O outro tema é a diferença entre **percentual e absoluto**. Nenhum
 * diferencial leucocitário se interpreta em porcentagem: ela muda quando
 * qualquer outra linhagem se altera. Por isso as contagens absolutas têm ficha
 * própria aqui — não são repetição das fichas percentuais do hemograma, são o
 * número que de fato decide conduta.
 */
export const marcadores: Marcador[] = [
  /* ══════════════════ Contagens absolutas ══════════════════ */
  {
    id: 'neutrofilos-absolutos',
    nome: 'Contagem absoluta de neutrófilos',
    sigla: 'CAN',
    sinonimos: ['can', 'anc', 'neutrofilos absolutos', 'contagem absoluta de neutrofilos'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'infeccioso'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Adultos', minimo: 1500, maximo: 7500, unidade: '/mm³' },
      { rotulo: 'Adultos (percentual)', minimo: 40, maximo: 70, unidade: '%', observacao: 'A conta que transforma o percentual em absoluto: (segmentados % + bastonetes %) × leucócitos totais ÷ 100.' },
      { rotulo: 'Neutropenia leve', texto: '1.000 a 1.500', unidade: '/mm³' },
      { rotulo: 'Neutropenia moderada', texto: '500 a 1.000', unidade: '/mm³' },
      { rotulo: 'Neutropenia grave', texto: '< 500', unidade: '/mm³', observacao: 'Faixa em que o risco de infecção grave sobe acentuadamente; febre nesse contexto é urgência.' },
    ],
    resumo:
      'O número absoluto de neutrófilos por volume — leucócitos totais × (segmentados + bastonetes) ÷ 100. É este valor, e não o percentual, que define risco infeccioso e conduta.',
    entenda:
      'A contagem absoluta é o exemplo mais consequente da diferença entre percentual e valor absoluto. Um paciente com 2.000 leucócitos e 20% de neutrófilos tem 400/mm³ — neutropenia grave — enquanto outro com 12.000 leucócitos e 20% tem 2.400/mm³, perfeitamente normal. O mesmo percentual, condutas opostas. Toda decisão sobre profilaxia antimicrobiana, adiamento de quimioterapia, isolamento e investigação de febre parte deste número.',
    aprofundar: [
      'O cálculo inclui os bastonetes, e essa escolha não é trivial: bastonetes são neutrófilos funcionalmente competentes, apenas mais jovens. Excluí-los subestimaria a capacidade de defesa exatamente no paciente que mais precisa dela — aquele que está mobilizando a reserva medular por infecção.',
      'A relação entre a contagem e o risco não é linear. Entre 1.000 e 1.500 o risco é próximo do normal. Entre 500 e 1.000 ele aumenta de forma modesta. Abaixo de 500 a curva sobe abruptamente, e abaixo de 100 a infecção deixa de produzir os sinais habituais — sem neutrófilos não há pus, não há infiltrado radiológico consolidado, não há sinais flogísticos. A febre pode ser a única manifestação, e é por isso que ela é tratada como emergência.',
      'A neutropenia étnica benigna merece reconhecimento explícito: frequente em pessoas de ascendência africana e do Oriente Médio, cursa com contagens entre 1.000 e 1.500/mm³ (às vezes menos) sem qualquer aumento de risco infeccioso. É um traço do pool marginado, não uma doença. Não reconhecê-la leva a investigações medulares desnecessárias e — mais grave — à suspensão de medicações eficazes, como clozapina ou quimioterapia, em pacientes que nunca estiveram em risco.',
    ],
    fisiologia: {
      oQueE: 'Número absoluto de neutrófilos circulantes, somando formas segmentadas e bastonetes.',
      origem: 'Medula óssea; representa apenas o pool circulante — metade dos neutrófilos intravasculares está aderida ao endotélio e não é contada.',
      funcao: 'Quantificar a capacidade efetiva de defesa contra bactérias e fungos.',
      meiaVida: '6 a 10 horas em circulação.',
      orgaosEnvolvidos: ['Medula óssea', 'Endotélio (pool marginado)', 'Tecidos'],
      percurso: [
        'Pool de reserva medular (5 a 10 vezes maior que o circulante)',
        'liberação sob G-CSF',
        'pool marginado aderido ao endotélio',
        'pool circulante — o que o exame conta',
        'migração para o tecido',
      ],
    },
    aumento: {
      resumo: 'Infecção bacteriana, inflamação estéril, corticoide, estresse ou proliferação clonal — os mesmos mecanismos da neutrofilia percentual, agora quantificados.',
      mecanismos: [
        {
          titulo: 'Liberação do pool de reserva e desmarginação',
          explicacao: 'A medula guarda uma reserva de neutrófilos maduros muitas vezes maior que a circulante, e metade dos circulantes está aderida ao endotélio. Dois compartimentos podem ser mobilizados em horas, sem produção nova.',
          exemplos: [
            { causa: 'Infecção bacteriana', etapas: ['G-CSF e IL-1 liberados', 'esvaziamento do pool medular de reserva', 'contagem absoluta ↑ com bastonetes'], nota: 'Acima de 7.500/mm³ com bastonetes acima de 10% caracteriza o desvio à esquerda de forma objetiva.' },
            { causa: 'Corticoide, estresse agudo, exercício', etapas: ['desmarginação do pool aderido ao endotélio', 'bloqueio da saída para o tecido', 'contagem absoluta ↑ em horas sem infecção'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Neutropenia. Produção reduzida, destruição periférica, sequestro — ou variante étnica benigna, que não é doença.',
      significado: 'Abaixo de 500/mm³ o paciente perde a capacidade de montar resposta inflamatória localizada: a infecção existe sem os sinais que a denunciariam.',
      mecanismos: [
        {
          titulo: 'Produção medular reduzida',
          explicacao: 'A granulopoese é suprimida, substituída ou carente de insumo. É a causa mais previsível e a de curso mais definido no tempo.',
          exemplos: [
            { causa: 'Quimioterapia citotóxica', etapas: ['toxicidade sobre precursores em divisão', 'esvaziamento progressivo do pool de reserva', 'nadir entre o 7º e o 14º dia', 'recuperação com monocitose precedendo a neutrofilia'], nota: 'A monocitose que aparece antes é sinal favorável: a linhagem monocítica se recupera primeiro.' },
            { causa: 'Aplasia medular, mielodisplasia, infiltração neoplásica', etapas: ['perda ou substituição do tecido hematopoético', 'produção insuficiente', 'neutropenia com outras citopenias'] },
          ],
        },
        {
          titulo: 'Destruição periférica ou consumo',
          explicacao: 'A célula é produzida normalmente e removida antes do tempo — por anticorpo, toxicidade direta ou consumo no foco infeccioso.',
          exemplos: [
            { causa: 'Agranulocitose medicamentosa', etapas: ['destruição imune ou tóxica dos precursores', 'queda abrupta em dias', 'contagem frequentemente abaixo de 200/mm³'], nota: 'Dipirona, metimazol, propiltiouracil, clozapina e sulfas são os agentes clássicos. Febre e odinofagia em quem iniciou um deles exige hemograma no mesmo dia.' },
            { causa: 'Sepse grave', etapas: ['consumo periférico que excede a produção', 'neutropenia', 'marcador de mau prognóstico'] },
          ],
        },
        {
          titulo: 'Variante constitucional',
          explicacao: 'O basal daquela pessoa é mais baixo por distribuição diferente entre os pools circulante e marginado — não há déficit de produção nem de função.',
          exemplos: [
            { causa: 'Neutropenia étnica benigna', etapas: ['maior proporção de neutrófilos no pool marginado', 'contagem circulante entre 1.000 e 1.500/mm³', 'reserva medular e função preservadas', 'sem aumento de risco infeccioso'], nota: 'Reconhecer evita punção medular e suspensão desnecessária de medicações.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Quimioterapia', 'Infecções virais', 'Medicamentos'],
        comuns: ['Neutropenia étnica benigna', 'Hiperesplenismo', 'Deficiência de B12 ou folato'],
        menosComuns: ['Aplasia medular', 'Mielodisplasia', 'Síndrome de Felty'],
        naoEsquecer: ['Agranulocitose por dipirona ou metimazol', 'HIV'],
        emergencias: ['Neutropenia febril', 'Agranulocitose com infecção'],
      },
    },
    relacionados: [
      { titulo: 'Para avaliar o risco real', ids: ['leucocitos', 'granulocitos-imaturos', 'monocitos'], leitura: 'A contagem absoluta define o risco; os granulócitos imaturos quantificam o desvio à esquerda; a monocitose anuncia recuperação medular antes da neutrofilia.' },
      { titulo: 'Na neutropenia febril', ids: ['pcr', 'procalcitonina', 'lactato'], leitura: 'Sem neutrófilos, os sinais inflamatórios locais desaparecem — os marcadores sistêmicos e o lactato passam a carregar mais peso na avaliação de gravidade.' },
    ],
    interferentes: {
      preAnalitico: ['Agregados plaquetários e eritroblastos podem ser contados como leucócitos e inflar o total, distorcendo o cálculo do absoluto.'],
      fisiologico: ['Ascendência africana e do Oriente Médio: contagem basal fisiologicamente mais baixa.'],
      medicamentos: ['Corticoides, lítio e G-CSF elevam; quimioterápicos, dipirona, metimazol, clozapina e sulfas reduzem.'],
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['infeccao-bacteriana'],
    estudarTambem: ['leucocitos', 'neutrofilos', 'granulocitos-imaturos', 'procalcitonina'],
  },

  {
    id: 'linfocitos-absolutos',
    nome: 'Contagem absoluta de linfócitos',
    sigla: 'CAL',
    sinonimos: ['cal', 'alc', 'linfocitos absolutos', 'linfopenia absoluta'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'imunologico'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Adultos', minimo: 1000, maximo: 4000, unidade: '/mm³' },
      { rotulo: 'Adultos (percentual)', minimo: 20, maximo: 45, unidade: '%', observacao: 'Absoluto = percentual × leucócitos totais ÷ 100. Linfócitos em 55% com 3.000 leucócitos são 1.650/mm³ — normais, apesar do percentual alto.' },
      { rotulo: 'Linfopenia', texto: '< 1.000', unidade: '/mm³' },
      { rotulo: 'Linfopenia grave', texto: '< 500', unidade: '/mm³', observacao: 'Associa-se a risco de infecção oportunista, sobretudo se sustentada.' },
    ],
    resumo:
      'O número absoluto de linfócitos circulantes. Linfopenia é um dos achados mais frequentes e mais subvalorizados do hemograma — e um preditor de desfecho independente.',
    entenda:
      'A linfopenia raramente é o motivo da consulta e quase nunca é comentada no laudo, mas carrega informação prognóstica robusta em sepse, cirurgia de grande porte, insuficiência cardíaca e neoplasia. Ela reflete tanto redistribuição (cortisol endógeno ou exógeno desloca linfócitos para tecidos linfoides) quanto apoptose induzida por citocinas. Linfopenia persistente sem explicação aguda tem uma investigação obrigatória: sorologia para HIV.',
    aprofundar: [
      'A relação neutrófilo/linfócito, calculada a partir dos absolutos, virou marcador prognóstico em vários contextos — sepse, síndrome coronariana, câncer, cirurgia. O que ela captura é a assinatura do estresse fisiológico: catecolaminas e cortisol elevam neutrófilos e derrubam linfócitos ao mesmo tempo, de modo que a razão amplifica um sinal que cada contagem isolada mostraria de forma mais tênue. É barata, derivada de exame já feito e não exige nada além do hemograma completo.',
      'A contagem total de linfócitos não distingue subpopulações, e essa limitação importa no HIV: o vírus destrói seletivamente linfócitos T CD4+, e a contagem total pode permanecer aceitável enquanto os CD4 despencam. Por isso o que quantifica a imunossupressão e orienta profilaxias é a contagem de CD4, não o linfócito total.',
    ],
    fisiologia: {
      oQueE: 'Número absoluto de linfócitos circulantes — T, B e NK somados.',
      origem: 'Precursor linfoide medular; maturação tímica (T) ou medular (B).',
      funcao: 'Quantificar a imunidade adaptativa disponível na circulação.',
      metabolismo: 'Apenas cerca de 2% do pool linfocitário está no sangue; o restante circula entre linfonodos, baço e tecidos.',
      percurso: ['Precursor linfoide', 'timo ou medula', 'órgãos linfoides secundários', 'recirculação sangue–linfa contínua'],
    },
    aumento: {
      resumo: 'Resposta viral, coqueluche, expansão clonal — ou redistribuição transitória por estresse agudo.',
      mecanismos: [
        {
          titulo: 'Expansão antigênica',
          explicacao: 'Clones específicos proliferam em resposta ao antígeno e aparecem na circulação como linfócitos ativados, maiores e com citoplasma basofílico.',
          exemplos: [
            { causa: 'Mononucleose infecciosa, CMV, toxoplasmose', etapas: ['proliferação de linfócitos T citotóxicos', 'linfocitose com atipia morfológica', 'transaminases frequentemente elevadas'] },
            { causa: 'Coqueluche', etapas: ['toxina pertussis bloqueia a saída de linfócitos dos vasos', 'linfocitose acentuada sem atipia', 'contagens que podem ultrapassar 20.000/mm³'], nota: 'Linfocitose muito alta em lactente com tosse paroxística é praticamente diagnóstica.' },
          ],
        },
        {
          titulo: 'Proliferação clonal',
          explicacao: 'Um clone linfoide prolifera de forma autônoma, produzindo população monomórfica de linfócitos maduros.',
          exemplos: [
            { causa: 'Leucemia linfocítica crônica', etapas: ['expansão clonal de linfócitos B maduros', 'linfocitose persistente acima de 5.000/mm³', 'smudge cells no esfregaço'], nota: 'Linfocitose persistente em adulto acima de 50 anos pede imunofenotipagem por citometria de fluxo.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Corticoide, estresse agudo, sepse, HIV, desnutrição, quimioterapia e perda linfática.',
      mecanismos: [
        {
          titulo: 'Redistribuição e apoptose induzida por cortisol',
          explicacao: 'O cortisol desloca linfócitos para tecidos linfoides e induz apoptose direta. O efeito é rápido — horas — e é a causa mais comum de linfopenia hospitalar.',
          exemplos: [
            { causa: 'Corticoterapia, cirurgia de grande porte, trauma, estresse agudo', etapas: ['cortisol ↑', 'redistribuição para órgãos linfoides e apoptose', 'linfopenia em horas', 'reversível com a resolução do estímulo'] },
          ],
        },
        {
          titulo: 'Destruição seletiva',
          explicacao: 'O agente ataca diretamente a população linfocitária, com efeito cumulativo ao longo do tempo.',
          exemplos: [
            { causa: 'HIV', etapas: ['infecção e destruição de linfócitos T CD4+', 'linfopenia progressiva ao longo de anos', 'imunossupressão com infecções oportunistas'], nota: 'Linfopenia persistente inexplicada é indicação formal de sorologia para HIV.' },
            { causa: 'Sepse e infecções virais graves', etapas: ['apoptose linfocitária induzida por citocinas', 'linfopenia aguda', 'marcador de gravidade e de pior desfecho'] },
          ],
        },
        {
          titulo: 'Perda e produção reduzida',
          explicacao: 'Os linfócitos escapam pela linfa ou não são produzidos por falta de substrato.',
          exemplos: [
            { causa: 'Linfangiectasia intestinal, quilotórax, drenagem linfática', etapas: ['perda de linfa rica em linfócitos', 'linfopenia acompanhada de hipoalbuminemia e hipogamaglobulinemia'] },
            { causa: 'Desnutrição grave, quimioterapia, radioterapia', etapas: ['produção comprometida', 'linfopenia sustentada'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Quando quantificar melhor', ids: ['cd4'], leitura: 'A contagem total não separa subpopulações. Em HIV e imunossupressão, é a contagem de CD4 que quantifica o risco de infecção oportunista.' },
      { titulo: 'Como sinal de estresse fisiológico', ids: ['neutrofilos-absolutos', 'cortisol'], leitura: 'Neutrofilia com linfopenia e eosinopenia é a assinatura do cortisol — endógeno ou exógeno.' },
    ],
    interferentes: {
      fisiologico: ['Crianças pequenas têm predomínio linfocitário fisiológico até cerca de 4 a 5 anos.', 'Exercício intenso e estresse reduzem transitoriamente.'],
      medicamentos: ['Corticoides, imunossupressores, rituximabe e quimioterápicos reduzem de forma marcante.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    padroes: ['infeccao-viral'],
    estudarTambem: ['linfocitos', 'cd4', 'neutrofilos-absolutos'],
  },

  {
    id: 'eosinofilos-absolutos',
    nome: 'Contagem absoluta de eosinófilos',
    sinonimos: ['eosinofilos absolutos', 'hipereosinofilia', 'contagem absoluta de eosinofilos'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'imunologico'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Normal', texto: '< 500', unidade: '/mm³' },
      { rotulo: 'Normal (percentual)', minimo: 1, maximo: 5, unidade: '%', observacao: 'É a faixa percentual que o laudo imprime ao lado; o corte clínico, porém, é o absoluto de 500/mm³.' },
      { rotulo: 'Eosinofilia leve', texto: '500 a 1.500', unidade: '/mm³' },
      { rotulo: 'Eosinofilia moderada a grave', texto: '> 1.500', unidade: '/mm³', observacao: 'Persistente nessa faixa, exige investigação de lesão de órgão-alvo — coração, pulmão, sistema nervoso.' },
    ],
    resumo:
      'O número absoluto de eosinófilos. É o valor que estratifica o risco de dano orgânico e decide a profundidade da investigação — o percentual não faz isso.',
    entenda:
      'A gradação por valor absoluto tem consequência direta. Até 1.500/mm³, o diferencial é dominado por atopia, parasitoses e reação medicamentosa, e a investigação é dirigida pela clínica. Acima de 1.500/mm³ mantidos, entra o conceito de hipereosinofilia: os grânulos eosinofílicos são citotóxicos, e a permanência em concentração alta lesa endocárdio, pulmão e nervos periféricos — independentemente da causa. Nesse patamar, a investigação passa a incluir avaliação de órgão-alvo, e não apenas a busca da etiologia.',
    aprofundar: [
      'No Brasil, a primeira hipótese diante de eosinofilia sem atopia evidente é helmintíase com fase de migração tecidual. A distinção importa: parasitas de ciclo exclusivamente intestinal, como o oxiúro e a giárdia, tipicamente **não** causam eosinofilia, porque não há contato do parasita com o tecido. Ascaridíase, estrongiloidíase, ancilostomíase, esquistossomose e toxocaríase, que atravessam tecidos, causam.',
      'A estrongiloidíase merece destaque próprio por uma razão de segurança: o corticoide sistêmico em portador não tratado pode desencadear hiperinfecção disseminada, com mortalidade alta. Em paciente de área endêmica que vai receber imunossupressão, a eosinofilia é o sinal que obriga a pesquisar e tratar antes.',
      'A eosinofilia com disfunção orgânica nova tem um diferencial que não pode ser adiado: reação medicamentosa grave (DRESS), nefrite intersticial alérgica, granulomatose eosinofílica com poliangeíte e síndrome hipereosinofílica. Eosinofilia com creatinina em elevação sugere nefrite intersticial; com asma de início tardio e mononeurite, sugere vasculite.',
    ],
    fisiologia: {
      oQueE: 'Número absoluto de eosinófilos circulantes — granulócitos com proteína básica principal e peroxidase eosinofílica nos grânulos.',
      origem: 'Medula óssea, sob estímulo predominante da IL-5.',
      funcao: 'Defesa antiparasitária tecidual por degranulação sobre helmintos grandes demais para fagocitose, e participação na inflamação alérgica.',
      meiaVida: '8 a 12 horas no sangue; dias a semanas no tecido, onde reside a maior parte da população.',
      percurso: ['Precursor medular', 'IL-5 da resposta Th2', 'eosinófilo circulante (fração pequena do total)', 'migração para pele, pulmão e trato digestivo'],
    },
    aumento: {
      resumo: 'Atopia, parasitose tecidual, reação medicamentosa, insuficiência adrenal, vasculite ou proliferação clonal.',
      mecanismos: [
        {
          titulo: 'Resposta Th2 — IL-5',
          explicacao: 'A IL-5 produzida na resposta alérgica e antiparasitária expande a linhagem na medula e recruta eosinófilos para o tecido.',
          exemplos: [
            { causa: 'Helmintíases com migração tecidual', etapas: ['larva atravessa o tecido', 'resposta Th2 com IL-5 ↑', 'eosinofilia, por vezes acentuada'], nota: 'Parasitas de ciclo exclusivamente luminal não elevam os eosinófilos — a migração tecidual é o gatilho.' },
            { causa: 'Atopia (asma, rinite, dermatite)', etapas: ['sensibilização alérgica', 'IL-5 ↑', 'eosinofilia leve a moderada, raramente acima de 1.500/mm³'] },
            { causa: 'Reação medicamentosa (DRESS, nefrite intersticial alérgica)', etapas: ['hipersensibilidade retardada', 'eosinofilia com exantema, febre e disfunção de órgão'], nota: 'Eosinofilia com creatinina subindo e leucocitúria estéril aponta nefrite intersticial alérgica.' },
          ],
        },
        {
          titulo: 'Perda do freio adrenal',
          explicacao: 'O cortisol suprime ativamente os eosinófilos. Sem ele, a supressão fisiológica desaparece.',
          exemplos: [
            { causa: 'Insuficiência adrenal', etapas: ['cortisol ↓', 'perda da supressão eosinofílica', 'eosinofilia associada a hiponatremia e hipercalemia'], nota: 'Essa tríade é uma das pistas mais úteis e mais ignoradas da insuficiência adrenal.' },
          ],
        },
        {
          titulo: 'Clonal e vasculítico',
          explicacao: 'A proliferação é autônoma, ou a eosinofilia é componente de doença sistêmica com lesão de órgão.',
          exemplos: [
            { causa: 'Síndrome hipereosinofílica, leucemia eosinofílica', etapas: ['proliferação clonal (rearranjos de PDGFRA/PDGFRB)', 'eosinofilia sustentada acima de 1.500/mm³', 'infiltração e lesão de coração, pulmão e nervos'] },
            { causa: 'Granulomatose eosinofílica com poliangeíte', etapas: ['vasculite de pequenos vasos', 'asma de início tardio, eosinofilia e mononeurite múltipla', 'ANCA positivo em parte dos casos'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Atopia', 'Helmintíases', 'Reação medicamentosa'],
        comuns: ['Dermatite atópica', 'Asma', 'Escabiose'],
        menosComuns: ['Vasculites', 'Síndrome hipereosinofílica', 'Neoplasias'],
        naoEsquecer: ['Estrongiloidíase antes de corticoide sistêmico', 'Insuficiência adrenal'],
        emergencias: ['DRESS', 'Hiperinfecção por Strongyloides'],
      },
    },
    reducao: {
      resumo: 'Eosinopenia é praticamente sinônimo de cortisol alto — endógeno ou exógeno.',
      mecanismos: [
        {
          titulo: 'Supressão pelo cortisol',
          explicacao: 'O cortisol induz apoptose e sequestro dos eosinófilos, com efeito em horas.',
          exemplos: [{ causa: 'Corticoterapia, sepse, estresse cirúrgico, síndrome de Cushing', etapas: ['cortisol ↑', 'apoptose e sequestro eosinofílico', 'eosinopenia'], nota: 'Eosinófilos zerados em paciente agudamente enfermo é achado esperado, não patológico.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na eosinofilia persistente', ids: ['ige-total', 'triptase', 'proteina-cationica-eosinofilica'], leitura: 'IgE alta favorece atopia e parasitose; triptase elevada sugere mastocitose associada, que muda a investigação.' },
      { titulo: 'Se houver hiponatremia junto', ids: ['cortisol', 'sodio', 'potassio'], leitura: 'Eosinofilia com hiponatremia e hipercalemia deve fazer pensar em insuficiência adrenal antes de qualquer outra hipótese.' },
    ],
    interferentes: {
      fisiologico: ['Variação circadiana: valores mais altos à noite, quando o cortisol está no nadir.'],
      medicamentos: ['Corticoides zeram; interleucina-2 e alguns imunobiológicos elevam.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['eosinofilos', 'ige-total', 'triptase', 'cortisol'],
  },

  {
    id: 'monocitos-absolutos',
    nome: 'Contagem absoluta de monócitos e basófilos',
    sinonimos: ['monocitos absolutos', 'basofilos absolutos', 'monocitose absoluta', 'basofilia absoluta'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: '/mm³',
    referencias: [
      { rotulo: 'Monócitos — adultos', minimo: 200, maximo: 1000, unidade: '/mm³' },
      { rotulo: 'Monócitos — adultos (percentual)', minimo: 2, maximo: 10, unidade: '%' },
      { rotulo: 'Monocitose relevante', texto: '> 1.000 sustentada por mais de 3 meses', unidade: '/mm³', observacao: 'Critério da leucemia mielomonocítica crônica quando associada a displasia. O critério é absoluto: monócitos em 12% de um leucograma de 5.000 são 600/mm³, e não preenchem o critério.' },
      { rotulo: 'Basófilos — adultos', minimo: 0, maximo: 200, unidade: '/mm³' },
      { rotulo: 'Basófilos — adultos (percentual)', minimo: 0, maximo: 2, unidade: '%' },
    ],
    resumo:
      'Duas linhagens minoritárias com valor diagnóstico desproporcional ao seu número: a monocitose anuncia recuperação medular e inflamação crônica; a basofilia aponta doença mieloproliferativa.',
    entenda:
      'O monócito circula poucos dias antes de virar macrófago tecidual, e sua contagem sobe em processos que exigem macrófago sustentado — tuberculose, endocardite, doenças inflamatórias intestinais, colagenoses. Mas o uso mais imediatamente prático é outro: após quimioterapia, a monocitose precede a recuperação dos neutrófilos em 1 a 3 dias, funcionando como o primeiro sinal de que a medula voltou. Já a basofilia é rara o bastante para que sua presença mereça atenção: em leucocitose com granulócitos imaturos, ela favorece leucemia mieloide crônica sobre reação leucemoide infecciosa.',
    fisiologia: {
      oQueE: 'Monócitos: células mononucleares fagocíticas, precursoras do macrófago. Basófilos: granulócitos com histamina e heparina, portadores de receptores de alta afinidade para IgE.',
      origem: 'Medula óssea — os monócitos a partir do progenitor granulocítico-monocítico, compartilhado com os neutrófilos.',
      funcao: 'Monócitos: fagocitose, apresentação de antígenos e formação do granuloma. Basófilos: liberação de mediadores na hipersensibilidade imediata.',
      meiaVida: 'Monócito: 1 a 3 dias no sangue, meses a anos como macrófago tecidual.',
      percurso: ['Progenitor granulocítico-monocítico', 'monócito circulante', 'migração tecidual', 'macrófago ou célula dendrítica'],
    },
    aumento: {
      resumo: 'Monocitose: inflamação crônica, infecção granulomatosa, recuperação medular ou clone mieloide. Basofilia: neoplasia mieloproliferativa, hipotireoidismo, alergia.',
      mecanismos: [
        {
          titulo: 'Demanda crônica por macrófago',
          explicacao: 'Processos que exigem formação e manutenção de granuloma aumentam de forma sustentada a produção e a saída de monócitos.',
          exemplos: [
            { causa: 'Tuberculose, endocardite, leishmaniose, doença de Crohn, colagenoses', etapas: ['estímulo inflamatório crônico', 'expansão da linhagem monocítica', 'monocitose persistente'] },
          ],
        },
        {
          titulo: 'Recuperação medular',
          explicacao: 'A linhagem monocítica se recupera antes da neutrofílica após aplasia induzida — é a primeira a reaparecer.',
          exemplos: [
            { causa: 'Pós-quimioterapia', etapas: ['retomada da hematopoese', 'monocitose 1 a 3 dias antes da neutrofilia', 'sinal precoce e favorável de recuperação'] },
          ],
        },
        {
          titulo: 'Proliferação clonal mieloide',
          explicacao: 'Um clone neoplásico expande a linhagem monocítica ou basofílica de forma autônoma e persistente.',
          exemplos: [
            { causa: 'Leucemia mielomonocítica crônica', etapas: ['proliferação clonal monocítica', 'monocitose acima de 1.000/mm³ por mais de 3 meses', 'displasia em uma ou mais linhagens'] },
            { causa: 'Leucemia mieloide crônica', etapas: ['BCR-ABL', 'granulopoese autônoma', 'leucocitose com toda a série granulocítica e basofilia'], nota: 'A basofilia é a pista que separa a LMC da reação leucemoide — infecção não produz basofilia.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Monocitopenia por corticoide, aplasia ou tricoleucemia; basopenia sem valor clínico estabelecido.',
      mecanismos: [
        {
          titulo: 'Supressão da linhagem',
          explicacao: 'A produção é suprimida junto às demais, ou substituída por infiltração clonal.',
          exemplos: [{ causa: 'Corticoterapia, aplasia medular, tricoleucemia', etapas: ['produção monocítica reduzida', 'monocitopenia'], nota: 'Monocitopenia acentuada com pancitopenia e esplenomegalia sugere tricoleucemia.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na leucocitose com formas jovens', ids: ['granulocitos-imaturos', 'bcr-abl'], leitura: 'Basofilia com granulócitos imaturos favorece LMC; a pesquisa de BCR-ABL confirma. Reação leucemoide infecciosa não cursa com basofilia.' },
    ],
    utilidade: ['diagnostico'],
    estudarTambem: ['monocitos', 'basofilos', 'neutrofilos-absolutos'],
  },

  {
    id: 'granulocitos-imaturos',
    nome: 'Granulócitos imaturos e bastonetes',
    sigla: 'GI',
    sinonimos: ['granulocitos imaturos', 'ig', 'bastonetes', 'desvio a esquerda', 'formas jovens'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'infeccioso'],
    material: 'Sangue total com EDTA',
    unidade: '%',
    referencias: [
      { rotulo: 'Granulócitos imaturos (contador automático)', texto: '< 0,5%', unidade: '%' },
      { rotulo: 'Bastonetes (esfregaço)', texto: '< 5%', unidade: '%' },
      { rotulo: 'Desvio à esquerda relevante', texto: 'Bastonetes > 10%', unidade: '%' },
    ],
    resumo:
      'A quantificação objetiva do desvio à esquerda. Mede formas jovens da linhagem granulocítica na circulação — promielócitos, mielócitos, metamielócitos e bastonetes.',
    entenda:
      'Os contadores hematológicos modernos quantificam granulócitos imaturos automaticamente, sem depender de alguém contar células na lâmina. Isso transformou um achado subjetivo e demorado num parâmetro reprodutível e imediato. Sua elevação significa que a demanda periférica excedeu o pool de reserva medular de células maduras, obrigando a medula a liberar formas ainda em maturação — o que ocorre em infecção bacteriana grave, mas também em qualquer estresse medular intenso.',
    aprofundar: [
      'Vale distinguir dois cenários que produzem o mesmo achado. Na reação leucemoide, a leucocitose ultrapassa 50.000/mm³ com desvio acentuado, e a causa é uma agressão intensa mas benigna — infecção grave, necrose extensa, uso de G-CSF. Na leucemia mieloide crônica, o quadro se parece, mas há basofilia associada e a fosfatase alcalina leucocitária é baixa (na reação leucemoide é alta). A pesquisa de BCR-ABL resolve.',
      'A presença de blastos é categoricamente diferente da presença de granulócitos imaturos. Metamielócitos e mielócitos representam maturação acelerada; blastos representam falha de maturação. Blastos circulantes, sobretudo com citopenias associadas, exigem avaliação hematológica imediata — não é continuidade do mesmo fenômeno, é outro diagnóstico.',
      'O quadro leucoeritroblástico — granulócitos imaturos junto com eritroblastos nucleados — merece leitura própria: sugere que a arquitetura medular foi rompida e as células estão escapando prematuramente. Infiltração neoplásica, mielofibrose e hemólise muito grave são as causas a considerar.',
    ],
    fisiologia: {
      oQueE: 'Formas jovens da linhagem granulocítica presentes na circulação: promielócitos, mielócitos, metamielócitos e bastonetes.',
      origem: 'Compartimento de maturação da medula óssea, normalmente retido até completar a maturação.',
      funcao: 'Os bastonetes já são funcionalmente competentes; as formas mais jovens têm capacidade fagocítica progressivamente menor.',
      percurso: ['Mieloblasto', 'promielócito', 'mielócito', 'metamielócito', 'bastonete', 'segmentado — o único que normalmente circula em quantidade'],
    },
    aumento: {
      resumo: 'A demanda periférica superou a reserva de células maduras. Infecção, inflamação intensa, G-CSF, gestação ou doença mieloproliferativa.',
      mecanismos: [
        {
          titulo: 'Esgotamento do pool de reserva',
          explicacao: 'O G-CSF esvazia primeiro o pool de neutrófilos maduros; quando ele acaba e a demanda persiste, formas em maturação são liberadas.',
          exemplos: [
            { causa: 'Infecção bacteriana grave e sepse', etapas: ['consumo tecidual maciço de neutrófilos', 'esvaziamento do pool medular maduro', 'liberação de bastonetes e mielócitos', 'granulócitos imaturos ↑'], nota: 'Aumento de granulócitos imaturos tem sido usado como marcador precoce de sepse, com resposta mais rápida que a da PCR.' },
            { causa: 'Uso terapêutico de G-CSF', etapas: ['estímulo farmacológico intenso da granulopoese', 'liberação de formas jovens', 'desvio à esquerda sem infecção'], nota: 'Achado esperado, não indica complicação.' },
          ],
        },
        {
          titulo: 'Ruptura da barreira medular',
          explicacao: 'A arquitetura da medula é desorganizada por fibrose ou infiltração, e as células escapam antes de amadurecer.',
          exemplos: [
            { causa: 'Mielofibrose, infiltração neoplásica da medula', etapas: ['perda da arquitetura sinusoidal', 'escape de precursores', 'quadro leucoeritroblástico com granulócitos imaturos e eritroblastos'], nota: 'Dacriócitos (hemácias em lágrima) associados reforçam a suspeita de mielofibrose.' },
          ],
        },
        {
          titulo: 'Proliferação clonal',
          explicacao: 'A granulopoese autônoma produz toda a série no sangue periférico, e não apenas as formas finais.',
          exemplos: [
            { causa: 'Leucemia mieloide crônica', etapas: ['BCR-ABL', 'granulopoese autônoma', 'toda a série granulocítica circulante com basofilia', 'fosfatase alcalina leucocitária baixa'] },
          ],
        },
      ],
    },
    reducao: { resumo: 'Ausência de granulócitos imaturos é o normal — não há significado em valores baixos.', mecanismos: [] },
    relacionados: [
      { titulo: 'Para caracterizar a resposta', ids: ['neutrofilos-absolutos', 'procalcitonina', 'esfregaco'], leitura: 'Granulócitos imaturos quantificam o desvio; a procalcitonina sugere etiologia bacteriana; o esfregaço identifica blastos, que mudam o diagnóstico.' },
      { titulo: 'Se houver eritroblastos junto', ids: ['nrbc'], leitura: 'Granulócitos imaturos com eritroblastos formam o quadro leucoeritroblástico — sugere ruptura da arquitetura medular.' },
    ],
    interferentes: {
      fisiologico: ['Gestação, sobretudo no terceiro trimestre, cursa com discreto desvio à esquerda fisiológico.', 'Recém-nascidos têm granulócitos imaturos circulantes normalmente nos primeiros dias.'],
      medicamentos: ['G-CSF e corticoides elevam.'],
    },
    utilidade: ['diagnostico', 'triagem'],
    padroes: ['infeccao-bacteriana'],
    estudarTambem: ['neutrofilos-absolutos', 'esfregaco', 'nrbc', 'leucocitos'],
  },

  {
    id: 'nrbc',
    nome: 'Eritroblastos circulantes',
    sigla: 'NRBC',
    sinonimos: ['nrbc', 'eritroblastos', 'hemacias nucleadas', 'normoblastos'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: '/100 leucócitos',
    referencias: [
      { rotulo: 'Adultos e crianças', texto: 'Ausentes', unidade: '' },
      { rotulo: 'Recém-nascido (primeiros dias)', texto: 'Até 10 por 100 leucócitos', unidade: '', observacao: 'Achado fisiológico no período neonatal imediato.' },
    ],
    resumo:
      'Hemácias que ainda têm núcleo, circulando no sangue periférico. Em adulto, é sempre anormal — e em paciente grave, um preditor de mortalidade independente.',
    entenda:
      'O eritroblasto perde o núcleo antes de deixar a medula; encontrá-lo na circulação significa que a barreira medular foi ultrapassada, seja por estímulo eritropoético extremo, seja por ruptura da arquitetura. Em terapia intensiva, a presença de eritroblastos associa-se de forma consistente a maior mortalidade, independentemente da causa — não porque eles sejam nocivos, mas porque marcam a intensidade do estresse fisiológico subjacente.',
    aprofundar: [
      'Há uma consequência técnica que altera outros parâmetros do próprio hemograma: os contadores automáticos podem confundir eritroblastos com leucócitos, superestimando a contagem total e, por consequência, distorcendo todos os valores absolutos do diferencial. Os equipamentos modernos os identificam e corrigem automaticamente, mas quando isso não ocorre, o laudo precisa trazer o total corrigido — e vale conferir antes de interpretar uma leucocitose inesperada.',
    ],
    fisiologia: {
      oQueE: 'Precursores eritroides nucleados — normoblastos — que normalmente expulsam o núcleo antes de sair da medula.',
      origem: 'Medula óssea; em situações patológicas, também de focos de hematopoese extramedular no fígado e no baço.',
      funcao: 'Sem função circulante; representam maturação incompleta ou escape prematuro.',
      percurso: ['Eritroblasto ortocromático', 'expulsão do núcleo na medula', 'reticulócito', 'hemácia — a forma que normalmente circula'],
    },
    aumento: {
      resumo: 'Estímulo eritropoético extremo, ruptura da arquitetura medular, hematopoese extramedular ou hipóxia grave.',
      mecanismos: [
        {
          titulo: 'Estímulo eritropoético máximo',
          explicacao: 'A demanda por hemácias é tão intensa que a medula libera precursores antes de completarem a maturação.',
          exemplos: [
            { causa: 'Hemólise grave, hemorragia maciça, hipóxia intensa', etapas: ['eritropoetina muito elevada', 'aceleração extrema da eritropoese', 'liberação de precursores nucleados'], nota: 'Nas anemias hemolíticas graves, eritroblastos e reticulocitose intensa aparecem juntos.' },
          ],
        },
        {
          titulo: 'Ruptura da arquitetura medular',
          explicacao: 'A fibrose ou a infiltração destrói a barreira sinusoidal que retém os precursores.',
          exemplos: [
            { causa: 'Mielofibrose, metástase medular, leucemias', etapas: ['desorganização do estroma medular', 'escape de precursores eritroides e granulocíticos', 'quadro leucoeritroblástico'], nota: 'Eritroblastos com dacriócitos e granulócitos imaturos é o retrato clássico da mielofibrose.' },
          ],
        },
        {
          titulo: 'Hematopoese extramedular e estresse crítico',
          explicacao: 'Fígado e baço retomam a produção, ou a intensidade do estresse sistêmico transborda a regulação normal.',
          exemplos: [
            { causa: 'Talassemia maior, mielofibrose com metaplasia', etapas: ['produção em fígado e baço', 'liberação sem a barreira medular', 'eritroblastos circulantes'] },
            { causa: 'Sepse, choque, insuficiência respiratória grave', etapas: ['estresse fisiológico extremo', 'aparecimento de eritroblastos', 'associação independente com mortalidade elevada'] },
          ],
        },
      ],
    },
    reducao: { resumo: 'Ausência é o esperado — não há significado clínico.', mecanismos: [] },
    relacionados: [
      { titulo: 'No quadro leucoeritroblástico', ids: ['granulocitos-imaturos', 'esfregaco', 'reticulocitos'], leitura: 'Eritroblastos com granulócitos imaturos e dacriócitos sugerem infiltração ou fibrose medular; com reticulocitose intensa, sugerem hemólise grave.' },
    ],
    interferentes: {
      metodo: ['Se o contador não os identificar, são somados aos leucócitos e distorcem o total e todos os absolutos do diferencial.'],
      fisiologico: ['Fisiológicos no recém-nascido nos primeiros dias de vida.'],
    },
    utilidade: ['diagnostico', 'prognostico'],
    estudarTambem: ['granulocitos-imaturos', 'esfregaco', 'reticulocitos'],
  },

  /* ══════════════════ Índices reticulocitários ══════════════════ */
  {
    id: 'indice-producao-reticulocitaria',
    nome: 'Índice de produção reticulocitária',
    sigla: 'IPR',
    sinonimos: ['ipr', 'indice reticulocitario', 'reticulocitos corrigidos', 'indice de producao reticulocitaria'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Calculado a partir de reticulócitos e hematócrito',
    unidade: '',
    referencias: [
      { rotulo: 'Resposta medular adequada em anemia', texto: '> 2 a 3', unidade: '' },
      { rotulo: 'Resposta inadequada (hipoproliferativa)', texto: '< 2', unidade: '' },
    ],
    resumo:
      'Corrige o percentual de reticulócitos por dois vieses simultâneos: a anemia, que infla a fração, e a liberação precoce de reticulócitos jovens, que os faz durar mais no sangue.',
    entenda:
      'O percentual de reticulócitos engana de duas maneiras em anemia grave. Primeiro, é uma fração de um denominador reduzido: 3% de 2 milhões de hemácias é muito menos produção que 3% de 5 milhões. Segundo, sob estímulo intenso de eritropoetina, a medula libera reticulócitos mais jovens, que sobrevivem 2 a 3 dias no sangue em vez de 1 — inflando a contagem sem que a produção real tenha aumentado na mesma proporção. O IPR corrige os dois, e é ele que responde honestamente à pergunta que organiza toda anemia: a medula está compensando?',
    aprofundar: [
      'O cálculo tem duas etapas. Primeiro corrige-se o percentual pelo hematócrito (reticulócitos observados × hematócrito do paciente ÷ hematócrito normal). Depois divide-se pelo fator de maturação, que cresce conforme a anemia se agrava — 1,0 com hematócrito normal, chegando a 2,5 em anemia grave. O resultado abaixo de 2 caracteriza anemia hipoproliferativa: o problema está na fábrica. Acima de 3, a medula está respondendo, e a causa está na periferia — perda ou destruição.',
      'Na prática moderna, o reticulócito absoluto (percentual × contagem de hemácias) resolve a maior parte dos casos com muito menos aritmética, e vários laboratórios já o reportam diretamente. O IPR permanece útil no ensino, porque explicita por que o percentual isolado engana, e nas anemias graves, em que o fator de maturação faz diferença real.',
    ],
    fisiologia: {
      oQueE: 'Índice derivado que estima a produção eritrocitária efetiva, corrigindo o percentual de reticulócitos pelo grau de anemia e pelo tempo de maturação.',
      origem: 'Cálculo a partir de dois parâmetros do hemograma.',
      funcao: 'Separar anemias hipoproliferativas das anemias com resposta medular adequada.',
      percurso: ['Reticulócitos observados (%)', '× correção pelo hematócrito', '÷ fator de maturação', 'índice de produção reticulocitária'],
    },
    aumento: {
      resumo: 'Índice acima de 3 indica medula competente reagindo a perda periférica — hemólise ou sangramento.',
      mecanismos: [
        {
          titulo: 'Resposta medular apropriada',
          explicacao: 'A medula tem insumo e integridade, e responde ao estímulo eritropoético aumentando a produção efetiva.',
          exemplos: [
            { causa: 'Hemólise, hemorragia aguda, resposta a reposição de ferro ou B12', etapas: ['perda ou destruição periférica', 'eritropoetina ↑', 'produção efetiva aumentada', 'IPR > 3'], nota: 'Índice alto redireciona a investigação da medula para o sangue periférico.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Índice abaixo de 2 caracteriza anemia hipoproliferativa: falta insumo, falta estímulo ou a medula está doente.',
      mecanismos: [
        {
          titulo: 'Produção efetiva insuficiente',
          explicacao: 'A medula não consegue aumentar a produção proporcionalmente à anemia — por falta de matéria-prima, de eritropoetina ou de tecido hematopoético.',
          exemplos: [
            { causa: 'Ferropenia, deficiência de B12 ou folato', etapas: ['insumo ausente', 'eritropoese limitada ou ineficaz', 'IPR < 2 apesar da anemia'] },
            { causa: 'Doença renal crônica', etapas: ['eritropoetina insuficiente', 'estímulo medular inadequado', 'IPR baixo com anemia normocítica'] },
            { causa: 'Aplasia, mielodisplasia, infiltração medular', etapas: ['tecido hematopoético comprometido', 'produção efetiva ↓', 'IPR muito baixo'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'A bifurcação da anemia', ids: ['reticulocitos', 'vcm', 'ldh', 'haptoglobina'], leitura: 'IPR baixo aponta a fábrica e leva ao painel de ferro e vitaminas; IPR alto aponta a periferia e leva ao painel de hemólise.' },
    ],
    interferentes: {
      preAnalitico: ['Transfusão recente suprime a eritropoese endógena e derruba o índice.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['reticulocitos', 'hemoglobina', 'hemoglobina-reticulocitaria'],
  },

  {
    id: 'hemoglobina-reticulocitaria',
    nome: 'Hemoglobina reticulocitária',
    sigla: 'CHr / RET-He',
    sinonimos: ['chr', 'ret-he', 'hemoglobina reticulocitaria', 'conteudo de hemoglobina do reticulocito'],
    grupo: 'ferro',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: 'pg',
    referencias: [
      { rotulo: 'Adultos', minimo: 28, maximo: 35, unidade: 'pg' },
      { rotulo: 'Sugestivo de eritropoese ferro-deficiente', texto: '< 28', unidade: 'pg', observacao: 'Corte varia com o equipamento; alguns usam 29 pg.' },
    ],
    resumo:
      'Quanto de hemoglobina há dentro dos reticulócitos — as células produzidas nos últimos dias. É a medida em tempo real da disponibilidade de ferro para a eritropoese.',
    entenda:
      'Todos os demais marcadores de ferro têm atraso ou ambiguidade. A ferritina reflete estoque e é reagente de fase aguda; o ferro sérico oscila com a hora do dia; a saturação depende de duas medidas. A hemoglobina reticulocitária escapa disso: ela olha as células que a medula acabou de produzir e pergunta se elas conseguiram se encher de hemoglobina. Se não conseguiram, o ferro está indisponível **agora** — semanas antes de o VCM cair e sem sofrer com a inflamação.',
    aprofundar: [
      'A aplicação em que ela mais se destaca é o paciente com inflamação — justamente onde os marcadores clássicos falham. Na doença renal crônica em uso de eritropoetina, ela permite detectar a deficiência funcional de ferro (quando a demanda estimulada supera a mobilização) e ajustar a reposição sem depender de uma ferritina que a inflamação distorce.',
      'Em pediatria, ela é particularmente valiosa como triagem: detecta eritropoese ferro-deficiente antes da anemia, com uma única amostra e sem punção adicional — o mesmo tubo do hemograma. É também um marcador de resposta precoce: sobe poucos dias após o início da reposição de ferro, muito antes de a hemoglobina se mover.',
    ],
    fisiologia: {
      oQueE: 'Conteúdo médio de hemoglobina dos reticulócitos, medido por dispersão de luz no contador automático.',
      origem: 'Reflete a hemoglobinização das hemácias produzidas nos últimos 2 a 4 dias.',
      funcao: 'Indicar, em tempo quase real, se o eritroblasto está recebendo ferro suficiente para hemoglobinizar.',
      percurso: ['Ferro disponível para o eritroblasto', 'síntese de heme durante a maturação', 'conteúdo de hemoglobina do reticulócito recém-liberado'],
    },
    aumento: {
      resumo: 'Macrocitose megaloblástica — células grandes carregam mais hemoglobina, ainda que a eritropoese seja ineficaz.',
      mecanismos: [
        {
          titulo: 'Reticulócito de volume aumentado',
          explicacao: 'Na assincronia núcleo-citoplasma, a célula cresce e acumula mais hemoglobina por unidade, mesmo com produção efetiva reduzida.',
          exemplos: [{ causa: 'Deficiência de B12 ou folato', etapas: ['síntese de DNA prejudicada', 'citoplasma cresce sem divisão adequada', 'reticulócito maior com mais hemoglobina', 'CHr ↑'] }],
        },
      ],
    },
    reducao: {
      resumo: 'Eritropoese ferro-deficiente: falta ferro absoluto ou o ferro existe e está indisponível.',
      mecanismos: [
        {
          titulo: 'Ferro indisponível para o eritroblasto',
          explicacao: 'Independentemente da causa — estoque esgotado ou bloqueio pela hepcidina —, o resultado no eritroblasto é o mesmo: hemoglobinização insuficiente.',
          exemplos: [
            { causa: 'Ferropenia absoluta', etapas: ['estoque esgotado', 'oferta insuficiente ao eritroblasto', 'CHr ↓ antes de o VCM cair'], nota: 'Detecta a deficiência semanas antes dos índices eritrocitários clássicos.' },
            { causa: 'Deficiência funcional de ferro sob eritropoetina', etapas: ['estímulo eritropoético intenso', 'mobilização de ferro insuficiente para a demanda criada', 'CHr ↓ com ferritina normal ou alta'], nota: 'É o cenário em que a ferritina mais engana, e em que a CHr mais ajuda.' },
            { causa: 'Talassemia', etapas: ['síntese de globina deficiente', 'menos hemoglobina por célula apesar de ferro normal', 'CHr ↓ com ferritina normal'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Quando os marcadores clássicos falham', ids: ['ferritina', 'saturacao-transferrina', 'pcr'], leitura: 'Com PCR elevada, a ferritina perde poder de excluir ferropenia. A CHr não é reagente de fase aguda e responde melhor nesse cenário.' },
    ],
    interferentes: {
      metodo: ['O nome e o corte variam com o fabricante (CHr na Siemens, RET-He na Sysmex) — comparar valores entre laboratórios exige atenção ao método.'],
    },
    cinetica: { tendencia: 'Sobe poucos dias após o início da reposição de ferro, muito antes da hemoglobina — é um marcador precoce de resposta.' },
    utilidade: ['diagnostico', 'rastreamento', 'acompanhamento'],
    estudarTambem: ['ferritina', 'saturacao-transferrina', 'reticulocitos', 'receptor-soluvel-transferrina'],
  },

  {
    id: 'indices-plaquetarios',
    nome: 'Índices plaquetários: PDW, PCT, P-LCR e IPF',
    sigla: 'PDW / IPF',
    sinonimos: ['pdw', 'pct plaquetario', 'plaquetocrito', 'p-lcr', 'ipf', 'fracao de plaquetas imaturas', 'indices plaquetarios'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: '%',
    referencias: [
      { rotulo: 'PDW — amplitude de distribuição', minimo: 9, maximo: 17, unidade: '%' },
      { rotulo: 'Plaquetócrito (PCT)', minimo: 0.15, maximo: 0.4, unidade: '%' },
      { rotulo: 'P-LCR — fração de plaquetas grandes', minimo: 15, maximo: 35, unidade: '%' },
      { rotulo: 'IPF — fração de plaquetas imaturas', minimo: 1, maximo: 5, unidade: '%' },
    ],
    resumo:
      'Os parâmetros plaquetários além da contagem. O IPF é o mais útil: mede plaquetas jovens e responde, sem punção medular, se a plaquetopenia é de produção ou de destruição.',
    entenda:
      'A fração de plaquetas imaturas é o análogo plaquetário do reticulócito. Plaquetas recém-liberadas ainda contêm RNA residual e são identificadas por fluorescência. Numa plaquetopenia, IPF alto significa que a medula está produzindo e as plaquetas estão sendo destruídas na periferia — PTI, microangiopatia, hiperesplenismo com resposta. IPF baixo significa que a medula não está produzindo — aplasia, quimioterapia, infiltração. Essa bifurcação é exatamente a que a punção medular responderia, e o IPF a resolve com o mesmo tubo do hemograma.',
    aprofundar: [
      'O IPF tem também valor preditivo na recuperação pós-quimioterapia: ele sobe dias antes da contagem plaquetária, sinalizando que a trombopoese retornou e permitindo antecipar quando a transfusão profilática deixará de ser necessária.',
      'PDW e P-LCR informam sobre heterogeneidade e tamanho, com a mesma lógica do VPM: populações jovens são maiores e mais heterogêneas. O plaquetócrito é o análogo do hematócrito — a fração do volume sanguíneo ocupada por plaquetas — e correlaciona-se melhor com a capacidade hemostática total do que a contagem isolada, já que uma plaqueta grande contribui mais que uma pequena.',
      'Uma armadilha comum: os índices plaquetários são muito sensíveis ao tempo entre a coleta e a leitura. As plaquetas incham progressivamente no EDTA, elevando o VPM e o PDW de forma artefatual. Amostras processadas com horas de atraso produzem índices que não representam o paciente.',
    ],
    fisiologia: {
      oQueE: 'Conjunto de parâmetros derivados da análise plaquetária: dispersão de tamanhos (PDW), massa total (plaquetócrito), fração de plaquetas grandes (P-LCR) e fração com RNA residual (IPF).',
      origem: 'Fragmentação do megacariócito medular sob estímulo da trombopoetina hepática.',
      funcao: 'Caracterizar a idade e a qualidade da população plaquetária, além da simples quantidade.',
      meiaVida: 'Plaqueta: 7 a 10 dias; a fração imatura circula como tal por cerca de 24 horas.',
      percurso: ['Trombopoetina hepática', 'megacariócito', 'fragmentação em plaquetas', 'plaqueta imatura com RNA residual (IPF)', 'plaqueta madura'],
    },
    aumento: {
      resumo: 'IPF alto indica trombopoese acelerada — destruição periférica com medula respondendo, ou recuperação medular em curso.',
      mecanismos: [
        {
          titulo: 'Turnover acelerado com medula competente',
          explicacao: 'A destruição periférica estimula a produção; a medula libera plaquetas jovens, maiores e ricas em RNA.',
          exemplos: [
            { causa: 'Púrpura trombocitopênica imune', etapas: ['destruição esplênica acelerada', 'trombopoese compensatória', 'IPF e VPM elevados com plaquetas baixas'], nota: 'A combinação plaquetopenia + IPF alto praticamente dispensa mielograma para responder à pergunta de produção versus destruição.' },
            { causa: 'Recuperação pós-quimioterapia', etapas: ['retomada da trombopoese', 'IPF sobe antes da contagem', 'antecipa a recuperação em 1 a 3 dias'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'IPF baixo com plaquetopenia aponta produção comprometida — a medula não está repondo.',
      mecanismos: [
        {
          titulo: 'Trombopoese insuficiente',
          explicacao: 'O megacariócito está ausente, suprimido ou displásico; a população circulante envelhece sem renovação.',
          exemplos: [
            { causa: 'Aplasia medular, quimioterapia, infiltração neoplásica', etapas: ['megacariopoese comprometida', 'sem liberação de plaquetas jovens', 'IPF baixo com plaquetopenia'], nota: 'Este é o cenário em que a avaliação medular continua indicada.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na investigação da plaquetopenia', ids: ['plaquetas', 'vpm', 'esfregaco'], leitura: 'A contagem quantifica, o IPF e o VPM dizem se a medula responde, e o esfregaço exclui pseudoplaquetopenia por agregação no EDTA.' },
    ],
    interferentes: {
      preAnalitico: ['Tempo prolongado entre coleta e leitura infla o VPM e o PDW pela tumefação das plaquetas no EDTA.', 'Agregados plaquetários distorcem todos os índices.'],
      metodo: ['Nem todo equipamento reporta IPF; os cortes variam com o fabricante.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['plaquetas', 'vpm', 'esfregaco'],
  },

  /* ══════════════════ Morfologia e enzimas eritrocitárias ══════════════════ */
  {
    id: 'esfregaco',
    nome: 'Esfregaço de sangue periférico',
    sinonimos: ['esfregaco', 'lamina', 'hematoscopia', 'morfologia eritrocitaria', 'analise morfologica'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA, lâmina corada',
    unidade: '—',
    referencias: [{ rotulo: 'Normal', texto: 'Hemácias normocíticas e normocrômicas, sem inclusões; leucócitos sem atipia; plaquetas em número e morfologia adequados', unidade: '' }],
    resumo:
      'A lâmina examinada por alguém. Nenhum contador automático substitui: esquizócitos, esferócitos, blastos, corpúsculos de Howell-Jolly e parasitas só aparecem aqui.',
    entenda:
      'O contador automático conta e mede, mas não reconhece formas. Existe um conjunto de diagnósticos em que a morfologia é o exame decisivo — e o pedido do esfregaço é o que separa uma investigação que chega ao diagnóstico de outra que gira em torno de números normais. Esquizócitos definem microangiopatia e podem mudar a conduta em horas; blastos mudam o diagnóstico inteiro; corpúsculos de Howell-Jolly denunciam asplenia funcional e indicam profilaxia antimicrobiana.',
    aprofundar: [
      'Alguns achados morfológicos praticamente fecham hipóteses. Esquizócitos (hemácias fragmentadas) com plaquetopenia e anemia caracterizam microangiopatia trombótica — PTT, SHU, CIVD, HELLP — e a PTT exige plasmaférese antes de qualquer confirmação laboratorial definitiva. Esferócitos com Coombs direto positivo indicam hemólise autoimune; com Coombs negativo e história familiar, esferocitose hereditária. Dacriócitos (hemácias em lágrima) com quadro leucoeritroblástico sugerem mielofibrose.',
      'Outros orientam a causa da anemia com precisão que nenhum índice alcança. Neutrófilos hipersegmentados confirmam megaloblastose; corpos de Heinz apontam estresse oxidativo por deficiência de G6PD; pontilhado basófilo grosseiro levanta intoxicação por chumbo; células em alvo aparecem em hemoglobinopatias e hepatopatia; rouleaux acentuado sugere paraproteinemia.',
      'A malária, a babesiose e as tripanossomíases são diagnosticadas na lâmina. Em paciente com febre e história de viagem para área endêmica, a pesquisa de hematozoários é exame de urgência — e negativo não exclui: repete-se em intervalos, idealmente durante o pico febril.',
    ],
    fisiologia: {
      oQueE: 'Análise microscópica da morfologia de hemácias, leucócitos e plaquetas em lâmina corada.',
      origem: 'Amostra do próprio sangue periférico, sem processamento além do esfregaço e da coloração.',
      funcao: 'Identificar alterações de forma, tamanho, inclusões e maturidade que os contadores automáticos não reconhecem.',
      percurso: ['Sangue com EDTA', 'esfregaço em lâmina', 'coloração panótica ou May-Grünwald-Giemsa', 'leitura microscópica'],
    },
    aumento: {
      resumo: 'Não se aplica quantitativamente — o valor está na presença de achados específicos, cada um com significado próprio.',
      mecanismos: [
        {
          titulo: 'Achados que definem microangiopatia',
          explicacao: 'A fibrina depositada na microcirculação corta mecanicamente as hemácias que passam, produzindo fragmentos com bordas angulares.',
          exemplos: [
            { causa: 'PTT, SHU, CIVD, síndrome HELLP', etapas: ['trombos de fibrina ou plaquetas na microcirculação', 'hemácias cortadas ao atravessar', 'esquizócitos com anemia e plaquetopenia'], nota: 'A associação esquizócitos + plaquetopenia + anemia é emergência hematológica: a PTT indica plasmaférese antes da confirmação.' },
          ],
        },
        {
          titulo: 'Achados que orientam a anemia',
          explicacao: 'A forma da hemácia registra o defeito que a produziu — de membrana, de hemoglobinização ou de síntese de DNA.',
          exemplos: [
            { causa: 'Esferocitose hereditária e hemólise autoimune', etapas: ['perda de membrana', 'forma esférica sem palidez central', 'esferócitos com CHCM elevada'] },
            { causa: 'Anemia megaloblástica', etapas: ['síntese de DNA prejudicada', 'assincronia núcleo-citoplasma nos granulócitos', 'neutrófilos hipersegmentados'] },
            { causa: 'Intoxicação por chumbo e talassemias', etapas: ['inibição de enzimas da via do heme ou defeito de globina', 'pontilhado basófilo grosseiro e células em alvo'] },
          ],
        },
        {
          titulo: 'Achados que mudam o diagnóstico',
          explicacao: 'Certas células não deveriam estar na circulação, e sua presença redireciona a investigação inteira.',
          exemplos: [
            { causa: 'Leucemias agudas', etapas: ['falha de maturação', 'blastos circulantes', 'citopenias associadas'], nota: 'Blastos no sangue periférico exigem avaliação hematológica imediata.' },
            { causa: 'Asplenia anatômica ou funcional', etapas: ['perda da função de remoção esplênica', 'corpúsculos de Howell-Jolly persistentes', 'risco aumentado de infecção por germes encapsulados'], nota: 'Achado que indica profilaxia e vacinação específicas.' },
            { causa: 'Malária, babesiose, tripanossomíase', etapas: ['parasitemia', 'formas parasitárias visíveis dentro ou fora das hemácias', 'diagnóstico feito na lâmina'] },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Quando pedir sem hesitar', ids: ['plaquetas', 'hemoglobina', 'granulocitos-imaturos', 'nrbc'], leitura: 'Plaquetopenia nova, anemia inexplicada, citopenias múltiplas, granulócitos imaturos ou eritroblastos — em qualquer um desses, a lâmina costuma responder o que os números não respondem.' },
    ],
    interferentes: {
      preAnalitico: ['Esfregaço feito com atraso ou com amostra mal homogeneizada altera a morfologia e cria artefatos de forma.', 'A distensão inadequada concentra células grandes na borda e distorce a leitura.'],
    },
    utilidade: ['diagnostico'],
    padroes: ['hemolise', 'anemia-macrocitica'],
    estudarTambem: ['plaquetas', 'reticulocitos', 'nrbc', 'granulocitos-imaturos'],
  },

  {
    id: 'coombs-direto',
    nome: 'Teste de Coombs direto e indireto',
    sigla: 'TAD / TAI',
    sinonimos: ['coombs', 'coombs direto', 'coombs indireto', 'teste da antiglobulina direto', 'tad', 'tai'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'imunologico'],
    material: 'Sangue total com EDTA (direto) e soro (indireto)',
    unidade: '—',
    referencias: [{ rotulo: 'Ambos', texto: 'Negativo', unidade: '' }],
    resumo:
      'Detectam anticorpos ligados à hemácia (direto) ou livres no plasma (indireto). O Coombs direto é o exame que separa hemólise imune de não imune — a bifurcação que muda o tratamento.',
    entenda:
      'Os dois testes usam o mesmo reagente com propósitos opostos. O direto pergunta: as hemácias **deste paciente** já estão revestidas por anticorpo ou complemento? É o exame da hemólise autoimune, da doença hemolítica do recém-nascido e da reação transfusional. O indireto pergunta: existe no plasma anticorpo capaz de reagir contra hemácias de outra pessoa? É o exame da prova cruzada pré-transfusional e do rastreamento de aloanticorpos na gestante.',
    aprofundar: [
      'O padrão de positividade do direto orienta o tipo de anticorpo. Positivo para IgG isolada sugere anemia hemolítica autoimune por anticorpos quentes, que agem a 37 °C e causam hemólise extravascular esplênica — respondem a corticoide. Positivo para complemento (C3d) isolado sugere anticorpos frios, que aglutinam em temperaturas baixas e ativam complemento — respondem mal a corticoide e melhoram com aquecimento e tratamento da causa de base.',
      'Duas armadilhas merecem atenção. Coombs direto positivo sem hemólise ocorre em cerca de 1 em 10.000 doadores saudáveis e é mais frequente em idosos, hospitalizados e em uso de imunoglobulina — positividade isolada, sem anemia nem marcadores de hemólise, não estabelece diagnóstico. E o inverso: hemólise autoimune com Coombs negativo existe em até 5% dos casos, quando a densidade de anticorpos está abaixo do limiar de detecção. Coombs negativo com painel de hemólise convincente não encerra a investigação.',
      'Na gestação, o Coombs indireto é o rastreamento de aloimunização: mãe Rh negativa com anticorpo anti-D detectável indica risco de doença hemolítica fetal. É esse teste que orienta a profilaxia com imunoglobulina anti-D e o acompanhamento fetal.',
    ],
    fisiologia: {
      oQueE: 'Testes de aglutinação com soro antiglobulina humana, que detecta IgG ou complemento ligados à superfície eritrocitária.',
      origem: 'Anticorpos produzidos pelo próprio paciente (autoanticorpos) ou contra hemácias de outro indivíduo (aloanticorpos).',
      funcao: 'Distinguir hemólise imunomediada de hemólise por outros mecanismos e garantir compatibilidade transfusional.',
      percurso: ['Anticorpo liga-se à hemácia', 'adição de soro antiglobulina', 'ponte entre hemácias revestidas', 'aglutinação visível'],
    },
    aumento: {
      resumo: 'Positividade indica hemácias revestidas (direto) ou anticorpos livres capazes de reagir (indireto).',
      mecanismos: [
        {
          titulo: 'Autoanticorpos quentes (IgG)',
          explicacao: 'Anticorpos IgG que reagem a 37 °C revestem a hemácia; o macrófago esplênico reconhece a porção Fc e remove fragmentos de membrana, produzindo esferócitos e hemólise extravascular.',
          exemplos: [
            { causa: 'Anemia hemolítica autoimune primária ou secundária', etapas: ['produção de autoanticorpo IgG antieritrocitário', 'opsonização das hemácias', 'captura e destruição esplênica', 'Coombs direto positivo para IgG com esferócitos'], nota: 'Investigar causa secundária: lúpus, linfoproliferação, medicamentos, infecções.' },
          ],
        },
        {
          titulo: 'Anticorpos frios e complemento',
          explicacao: 'Anticorpos IgM aglutinam hemácias em temperaturas baixas nas extremidades e fixam complemento; ao retornarem ao centro, restam apenas fragmentos de C3d ligados.',
          exemplos: [
            { causa: 'Doença por crioaglutininas, infecção por Mycoplasma ou EBV', etapas: ['IgM aglutina em baixa temperatura', 'ativação de complemento', 'hemólise intravascular e extravascular hepática', 'Coombs direto positivo para C3d'], nota: 'Corticoide funciona mal aqui; o tratamento passa por aquecimento e controle da causa de base.' },
          ],
        },
        {
          titulo: 'Aloanticorpos',
          explicacao: 'Exposição prévia a hemácias de outro indivíduo — transfusão ou gestação — gerou anticorpos contra antígenos que o paciente não possui.',
          exemplos: [
            { causa: 'Reação transfusional hemolítica', etapas: ['aloanticorpo preexistente', 'ligação às hemácias transfundidas', 'hemólise aguda', 'Coombs direto positivo pós-transfusão'] },
            { causa: 'Aloimunização materna anti-D', etapas: ['exposição a hemácias fetais Rh positivas', 'produção de anti-D', 'passagem transplacentária', 'doença hemolítica do feto e do recém-nascido'], nota: 'O Coombs indireto na gestante é o rastreamento que orienta a profilaxia anti-D.' },
          ],
        },
        {
          titulo: 'Positividade sem hemólise',
          explicacao: 'Anticorpos em baixa densidade ou proteínas inespecificamente adsorvidas produzem positividade sem destruição eritrocitária relevante.',
          exemplos: [
            { causa: 'Idosos, hospitalizados, uso de imunoglobulina intravenosa, hipergamaglobulinemia', etapas: ['adsorção inespecífica de imunoglobulinas', 'Coombs direto positivo', 'ausência de anemia e de marcadores de hemólise'], nota: 'Positividade isolada não é diagnóstico — exige o painel de hemólise para significar alguma coisa.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'O painel que dá sentido ao Coombs', ids: ['ldh', 'haptoglobina', 'bilirrubina-indireta', 'reticulocitos', 'esfregaco'], leitura: 'Coombs positivo só significa hemólise autoimune quando acompanhado de LDH alto, haptoglobina baixa, bilirrubina indireta alta e reticulocitose. Isolado, pode não significar nada.' },
    ],
    interferentes: {
      medicamentos: ['Metildopa, betalactâmicos em dose alta, imunoglobulina intravenosa e alguns imunobiológicos podem positivar o teste.'],
      preAnalitico: ['Amostra refrigerada favorece a ligação de crioaglutininas e pode gerar positividade artefatual — processar a 37 °C quando houver suspeita.'],
    },
    utilidade: ['diagnostico'],
    padroes: ['hemolise'],
    estudarTambem: ['haptoglobina', 'ldh', 'esfregaco', 'g6pd'],
  },

  {
    id: 'g6pd',
    nome: 'G6PD e piruvato-quinase',
    sigla: 'G6PD',
    sinonimos: ['g6pd', 'glicose 6 fosfato desidrogenase', 'piruvato quinase', 'deficiencia de g6pd', 'enzimopatias eritrocitarias'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: 'U/g Hb',
    referencias: [
      { rotulo: 'G6PD — adultos', minimo: 6, maximo: 12, unidade: 'U/g Hb', observacao: 'Não dosar durante ou logo após crise hemolítica: os reticulócitos jovens têm atividade alta e mascaram a deficiência.' },
      { rotulo: 'Piruvato-quinase', minimo: 9, maximo: 22, unidade: 'U/g Hb' },
    ],
    resumo:
      'As duas enzimopatias eritrocitárias mais relevantes. A G6PD protege contra estresse oxidativo; a piruvato-quinase gera o ATP que mantém a hemácia viva.',
    entenda:
      'A hemácia não tem mitocôndria nem núcleo: depende inteiramente da glicólise para produzir ATP e da via das pentoses para gerar NADPH, que regenera a glutationa reduzida — a defesa antioxidante da célula. A deficiência de G6PD compromete essa defesa: diante de estresse oxidativo (infecção, fava, fármacos oxidantes), a hemoglobina oxida, precipita como corpos de Heinz e a célula é destruída. A deficiência de piruvato-quinase compromete a produção de ATP e causa hemólise crônica, sem depender de gatilho.',
    aprofundar: [
      'O momento da dosagem da G6PD é decisivo e frequentemente erra-se nele. Durante a crise hemolítica, as células deficientes — as mais velhas — já foram destruídas, e restam reticulócitos jovens, cuja atividade enzimática é naturalmente alta. Dosar nesse momento produz resultado falsamente normal. A dosagem deve ser feita ao menos 3 meses após o episódio, ou interpretada com muita cautela se colhida na fase aguda.',
      'A herança é ligada ao X, então homens hemizigotos manifestam plenamente e mulheres heterozigotas têm população mista de hemácias — algumas deficientes, outras normais — por inativação aleatória do X. Isso significa que mulheres portadoras podem ter atividade enzimática intermediária e ainda assim hemolisar diante de estresse oxidativo intenso.',
      'A lista de gatilhos importa clinicamente: primaquina e outras 8-aminoquinolinas, nitrofurantoína, dapsona, sulfametoxazol, azul de metileno, rasburicase, naftalina e a fava. A rasburicase merece destaque porque é usada na síndrome de lise tumoral, exatamente em pacientes que não podem tolerar uma hemólise adicional — a triagem prévia é recomendada.',
    ],
    fisiologia: {
      oQueE: 'G6PD: primeira enzima da via das pentoses-fosfato, geradora de NADPH. Piruvato-quinase: enzima final da glicólise, geradora de ATP.',
      origem: 'Expressas na hemácia madura, que depende exclusivamente dessas vias por não possuir mitocôndria.',
      funcao: 'G6PD: manter a glutationa reduzida e proteger a hemoglobina da oxidação. Piruvato-quinase: gerar o ATP que sustenta a bomba de sódio-potássio e a integridade da membrana.',
      orgaosEnvolvidos: ['Hemácia', 'Baço (remoção das células lesadas)'],
      percurso: ['Glicose-6-fosfato', 'G6PD gera NADPH', 'NADPH regenera glutationa reduzida', 'glutationa neutraliza peróxidos', 'hemoglobina protegida da oxidação'],
    },
    aumento: {
      resumo: 'Atividade elevada reflete população eritrocitária jovem — reticulocitose —, não proteção adicional.',
      mecanismos: [
        {
          titulo: 'População jovem',
          explicacao: 'A atividade enzimática é máxima na hemácia recém-formada e declina com a idade celular; uma população renovada tem atividade média mais alta.',
          exemplos: [{ causa: 'Reticulocitose de qualquer causa', etapas: ['renovação acelerada da população eritrocitária', 'predomínio de células jovens com atividade alta', 'atividade média elevada — pode mascarar deficiência real'] }],
        },
      ],
    },
    reducao: {
      resumo: 'Deficiência enzimática hereditária, com hemólise episódica (G6PD) ou crônica (piruvato-quinase).',
      mecanismos: [
        {
          titulo: 'Defesa antioxidante comprometida — G6PD',
          explicacao: 'Sem NADPH suficiente, a glutationa não é regenerada; peróxidos oxidam a hemoglobina, que desnatura e precipita na membrana.',
          exemplos: [
            { causa: 'Exposição a fármaco oxidante, fava ou infecção', etapas: ['estresse oxidativo', 'glutationa reduzida esgotada', 'hemoglobina oxidada precipita como corpos de Heinz', 'baço remove os precipitados criando células mordidas', 'hemólise aguda intravascular e extravascular'], nota: 'A crise é autolimitada: as células mais velhas e deficientes são destruídas, e as jovens resistem por terem mais enzima.' },
          ],
        },
        {
          titulo: 'Produção de ATP comprometida — piruvato-quinase',
          explicacao: 'Sem ATP suficiente, a bomba de sódio-potássio falha, a célula perde potássio e água, enrijece e é retida no baço.',
          exemplos: [
            { causa: 'Deficiência de piruvato-quinase', etapas: ['glicólise comprometida na etapa final', 'ATP insuficiente', 'falha da bomba iônica e rigidez de membrana', 'hemólise crônica extravascular desde a infância'], nota: 'Diferentemente da G6PD, não depende de gatilho: a hemólise é contínua, com icterícia e esplenomegalia.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na crise hemolítica', ids: ['ldh', 'haptoglobina', 'bilirrubina-indireta', 'reticulocitos', 'esfregaco'], leitura: 'O painel de hemólise confirma a destruição; o esfregaço mostra corpos de Heinz e células mordidas; o Coombs negativo afasta causa imune.' },
    ],
    interferentes: {
      preAnalitico: ['Dosagem durante ou logo após a crise dá resultado falsamente normal — as células deficientes já foram destruídas.', 'Transfusão recente introduz hemácias normais e mascara a deficiência.'],
      fisiologico: ['Mulheres heterozigotas têm população mista e atividade intermediária.'],
    },
    utilidade: ['diagnostico', 'rastreamento'],
    padroes: ['hemolise'],
    estudarTambem: ['haptoglobina', 'ldh', 'esfregaco', 'coombs-direto'],
  },

  {
    id: 'eletroforese-hemoglobina',
    nome: 'Eletroforese de hemoglobina, HbA2 e HbF',
    sigla: 'EFHb',
    sinonimos: ['eletroforese de hemoglobina', 'hba2', 'hemoglobina fetal', 'hbf', 'teste de falcizacao', 'hplc de hemoglobina'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    unidade: '%',
    referencias: [
      { rotulo: 'HbA (adulto)', minimo: 96, maximo: 98, unidade: '%' },
      { rotulo: 'HbA2', minimo: 2, maximo: 3.5, unidade: '%', observacao: 'Acima de 3,5% é o critério diagnóstico da beta-talassemia menor.' },
      { rotulo: 'HbF (adulto)', texto: '< 1', unidade: '%' },
      { rotulo: 'HbS, HbC, HbE', texto: 'Ausentes', unidade: '%' },
    ],
    resumo:
      'Separa e quantifica as frações de hemoglobina. É o exame que confirma talassemias e hemoglobinopatias que o hemograma apenas sugere.',
    entenda:
      'A hemoglobina do adulto é 97% HbA (α2β2), 2 a 3% HbA2 (α2δ2) e menos de 1% HbF (α2γ2). Alterações nessas proporções revelam defeitos de síntese das cadeias. Na beta-talassemia menor, a produção deficiente de cadeias beta é parcialmente compensada pelas cadeias delta: a HbA2 sobe acima de 3,5%, e esse é o critério diagnóstico. Nas hemoglobinopatias estruturais, aparecem bandas anômalas — HbS, HbC, HbE — que a migração eletroforética identifica.',
    aprofundar: [
      'A alfa-talassemia é a exceção que o exame não resolve. Como as cadeias alfa entram na composição de HbA, HbA2 e HbF igualmente, sua deficiência reduz todas proporcionalmente — e a eletroforese sai normal. O diagnóstico da alfa-talassemia depende de análise molecular. Isso cria uma situação clínica comum: microcitose com ferritina normal e eletroforese normal, em que a alfa-talassemia é a hipótese que resta.',
      'A ferropenia concomitante pode mascarar a beta-talassemia menor: a deficiência de ferro reduz a síntese de todas as cadeias e derruba a HbA2 para dentro da faixa normal. Por isso a eletroforese deve ser interpretada com o estado de ferro conhecido — e, se houver ferropenia, repetida após a reposição.',
      'A HbF elevada tem significados distintos conforme o contexto. Na persistência hereditária de hemoglobina fetal, é benigna. Na beta-talassemia maior e na anemia falciforme, é protetora — a HbF não participa da polimerização da HbS —, e é justamente por isso que a hidroxiureia, que aumenta a HbF, reduz as crises vaso-oclusivas. Em síndromes mielodisplásicas e leucemias, sua elevação reflete estresse eritropoético.',
    ],
    fisiologia: {
      oQueE: 'Separação das frações de hemoglobina por carga elétrica (eletroforese) ou por afinidade cromatográfica (HPLC).',
      origem: 'Reflete quais genes de globina estão sendo expressos e em que proporção.',
      funcao: 'Identificar defeitos quantitativos (talassemias) e qualitativos (hemoglobinopatias estruturais) da síntese de hemoglobina.',
      percurso: ['Genes de globina alfa e beta', 'síntese das cadeias', 'montagem do tetrâmero', 'proporção entre HbA, HbA2 e HbF', 'separação eletroforética'],
    },
    aumento: {
      resumo: 'HbA2 alta define beta-talassemia menor; HbF alta aparece em talassemias, falciforme, persistência hereditária e estresse eritropoético; bandas anômalas identificam hemoglobinopatias.',
      mecanismos: [
        {
          titulo: 'Compensação por cadeia delta — HbA2',
          explicacao: 'Com a produção de cadeias beta reduzida, as cadeias alfa disponíveis combinam-se preferencialmente com delta, elevando a fração de HbA2.',
          exemplos: [
            { causa: 'Beta-talassemia menor', etapas: ['produção de cadeia beta reduzida', 'excesso relativo de cadeias alfa', 'combinação com cadeias delta', 'HbA2 > 3,5% com microcitose e RDW normal'], nota: 'Ferropenia associada derruba a HbA2 e pode mascarar o diagnóstico — repetir após repor ferro.' },
          ],
        },
        {
          titulo: 'Reativação da hemoglobina fetal',
          explicacao: 'A cadeia gama volta a ser expressa, seja por variante genética, seja por estresse eritropoético intenso.',
          exemplos: [
            { causa: 'Beta-talassemia maior e intermediária', etapas: ['ausência ou grave redução de cadeia beta', 'produção compensatória de cadeia gama', 'HbF muito elevada'] },
            { causa: 'Anemia falciforme sob hidroxiureia', etapas: ['indução farmacológica da expressão de gama', 'HbF ↑', 'menor polimerização da HbS e menos crises vaso-oclusivas'], nota: 'Aqui a elevação da HbF é o objetivo terapêutico, e seu acompanhamento mede a resposta.' },
          ],
        },
        {
          titulo: 'Hemoglobinas estruturais anômalas',
          explicacao: 'Uma mutação pontual altera a carga da cadeia beta, produzindo migração eletroforética distinta.',
          exemplos: [
            { causa: 'Anemia falciforme e traço falciforme', etapas: ['substituição de ácido glutâmico por valina na posição 6 da beta', 'HbS polimeriza em desoxigenação', 'hemácia falcizada, hemólise e vaso-oclusão'], nota: 'O teste de falcização confirma a presença de HbS, mas não distingue traço de doença — a eletroforese quantifica e resolve.' },
            { causa: 'Hemoglobinopatias C e E', etapas: ['mutação pontual na cadeia beta', 'banda anômala na eletroforese', 'microcitose com células em alvo'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'HbA2 baixa sugere alfa-talassemia ou ferropenia associada; HbA reduzida indica substituição por hemoglobina anômala.',
      mecanismos: [
        {
          titulo: 'Deficiência proporcional de cadeia alfa',
          explicacao: 'Como a cadeia alfa entra em todas as hemoglobinas, sua deficiência reduz todas as frações igualmente — e a eletroforese sai normal ou com HbA2 no limite inferior.',
          exemplos: [{ causa: 'Alfa-talassemia', etapas: ['produção de cadeia alfa reduzida', 'redução proporcional de HbA, HbA2 e HbF', 'eletroforese normal apesar da microcitose'], nota: 'Microcitose com ferritina e eletroforese normais deixa a alfa-talassemia como principal hipótese — o diagnóstico é molecular.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'Antes de interpretar', ids: ['ferritina', 'vcm', 'rdw', 'hemacias'], leitura: 'Ferropenia derruba a HbA2 e pode mascarar a beta-talassemia. Confirme o estado de ferro antes de concluir — e repita depois de repor.' },
    ],
    interferentes: {
      preAnalitico: ['Transfusão recente introduz hemoglobina do doador e invalida a quantificação por até 3 meses.'],
      fisiologico: ['No recém-nascido, a HbF é predominante fisiologicamente e declina ao longo do primeiro ano.'],
    },
    utilidade: ['diagnostico', 'rastreamento'],
    padroes: ['anemia-microcitica-hipocromica'],
    estudarTambem: ['vcm', 'ferritina', 'reticulocitos', 'esfregaco'],
  },

  {
    id: 'eritropoetina',
    nome: 'Eritropoetina',
    sigla: 'EPO',
    sinonimos: ['epo', 'eritropoietina', 'eritropoetina serica'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'renal'],
    material: 'Soro',
    unidade: 'mUI/mL',
    referencias: [{ rotulo: 'Adultos com hemoglobina normal', minimo: 4, maximo: 25, unidade: 'mUI/mL', observacao: 'O valor só se interpreta contra a hemoglobina: a pergunta é se a EPO está apropriada para o grau de anemia ou de policitemia.' }],
    resumo:
      'O hormônio renal que comanda a eritropoese. Como o TSH na tireoide, seu valor só significa alguma coisa quando confrontado com o parâmetro que ele deveria estar regulando.',
    entenda:
      'A eritropoetina é produzida pelas células intersticiais peritubulares do rim quando o sensor de oxigênio renal, via HIF-2α, percebe hipóxia. A relação com a hemoglobina é logarítmica e inversa: em anemia intensa, a EPO deveria subir centenas de vezes. Por isso a leitura é sempre relacional. EPO baixa com policitemia é praticamente a assinatura da policitemia vera; EPO alta com policitemia aponta causa secundária; EPO inapropriadamente baixa com anemia aponta doença renal.',
    aprofundar: [
      'A distinção entre policitemia primária e secundária tem consequência terapêutica imediata, e a EPO a resolve com um único exame. Na policitemia vera, a mutação JAK2 torna o receptor de EPO constitutivamente ativo: a medula produz sem estímulo, e a retroalimentação suprime a EPO a valores baixos ou indetectáveis. Na policitemia secundária — DPOC, apneia do sono, cardiopatia cianótica, altitude, tumor produtor —, a EPO está normal ou alta, porque é ela quem está causando o quadro.',
      'Na doença renal crônica, a EPO costuma estar dentro da faixa de referência, e é justamente isso que a torna inadequada: com hemoglobina de 8 g/dL, uma EPO "normal" representa uma resposta muito abaixo do que deveria. Interpretar esse valor como normal é o erro que a leitura relacional evita.',
    ],
    fisiologia: {
      oQueE: 'Glicoproteína de 165 aminoácidos, o principal fator de crescimento da linhagem eritroide.',
      origem: '90% nas células intersticiais peritubulares do córtex renal; cerca de 10% no fígado.',
      sintese: 'O sensor de oxigênio renal estabiliza o HIF-2α em hipóxia, que ativa a transcrição do gene da EPO.',
      funcao: 'Impedir a apoptose dos precursores eritroides e estimular sua proliferação e diferenciação.',
      meiaVida: '6 a 9 horas.',
      orgaosEnvolvidos: ['Rim', 'Fígado', 'Medula óssea'],
      percurso: ['Hipóxia tecidual renal', 'estabilização do HIF-2α', 'transcrição do gene da EPO', 'EPO circulante', 'receptor no precursor eritroide', 'sobrevida e proliferação eritroide'],
    },
    aumento: {
      resumo: 'Hipóxia de qualquer origem, produção tumoral ectópica ou administração exógena.',
      mecanismos: [
        {
          titulo: 'Resposta apropriada à hipóxia',
          explicacao: 'O rim percebe menos oxigênio e aumenta a produção — o mecanismo funcionando exatamente como deveria.',
          exemplos: [
            { causa: 'DPOC, apneia obstrutiva do sono, cardiopatia cianótica, altitude', etapas: ['hipoxemia crônica', 'HIF-2α estabilizado', 'EPO ↑', 'policitemia secundária apropriada'] },
            { causa: 'Anemia de qualquer causa', etapas: ['redução do transporte de oxigênio', 'EPO ↑ proporcionalmente à gravidade', 'estímulo eritropoético máximo'], nota: 'EPO que não sobe diante de anemia intensa denuncia o rim como parte do problema.' },
          ],
        },
        {
          titulo: 'Produção inapropriada',
          explicacao: 'Um tumor produz EPO fora do controle do sensor renal de oxigênio.',
          exemplos: [
            { causa: 'Carcinoma renal, hepatocarcinoma, hemangioblastoma cerebelar, leiomioma uterino', etapas: ['produção tumoral autônoma de EPO', 'eritropoese estimulada sem hipóxia', 'policitemia com EPO alta'], nota: 'Policitemia com EPO elevada e sem hipoxemia obriga a procurar tumor.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Doença renal crônica e policitemia vera — duas situações opostas em que a EPO baixa significa coisas diferentes.',
      mecanismos: [
        {
          titulo: 'Perda da capacidade de produção renal',
          explicacao: 'A massa de células peritubulares produtoras diminui com a perda de parênquima renal.',
          exemplos: [
            { causa: 'Doença renal crônica', etapas: ['redução da massa de células produtoras', 'EPO inapropriadamente normal ou baixa para o grau de anemia', 'anemia normocítica normocrômica'], nota: 'A anemia da DRC costuma aparecer a partir do estágio 3 e é indicação de reposição de agentes estimuladores da eritropoese.' },
          ],
        },
        {
          titulo: 'Supressão por eritrocitose autônoma',
          explicacao: 'A medula produz hemácias sem precisar de estímulo; a massa eritrocitária elevada suprime a produção renal por retroalimentação.',
          exemplos: [
            { causa: 'Policitemia vera', etapas: ['mutação JAK2 V617F', 'sinalização do receptor de EPO constitutivamente ativa', 'eritropoese autônoma', 'EPO suprimida por retroalimentação'], nota: 'EPO baixa com hemoglobina alta é o achado que mais aponta para policitemia vera.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Na policitemia', ids: ['hemoglobina', 'hematocrito', 'jak2'], leitura: 'EPO baixa com policitemia direciona para JAK2 e policitemia vera; EPO alta direciona para hipoxemia ou tumor produtor.' },
      { titulo: 'Na anemia da doença renal', ids: ['creatinina', 'tfg', 'ferritina'], leitura: 'Antes de atribuir a anemia à falta de EPO, é preciso garantir estoque de ferro adequado — a reposição de agentes estimuladores falha sem ferro.' },
    ],
    interferentes: {
      preAnalitico: ['Uso de agentes estimuladores da eritropoese eleva a dosagem e invalida a interpretação diagnóstica.'],
      fisiologico: ['Variação circadiana discreta, com valores mais altos à noite.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['hemoglobina', 'hematocrito', 'creatinina', 'jak2'],
  },
]
