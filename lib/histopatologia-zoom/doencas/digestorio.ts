import type { DoencaZoom } from '../tipos'

/** Trato digestivo: esôfago, estômago, intestinos e apêndice. */
export const DOENCAS_DIGESTORIO: DoencaZoom[] = [
  {
    id: 'apendicite-aguda',
    nome: 'Apendicite aguda',
    sinonimos: ['apendicite supurativa', 'apendicite flegmonosa', 'apendicite gangrenosa'],
    nomesEmIngles: ['acute appendicitis'],
    sistema: 'digestorio',
    orgao: 'apendice',
    prioridade: 1,
    resumo:
      'Inflamação aguda do apêndice cecal, quase sempre desencadeada por obstrução da luz, cujo critério histológico é a presença de neutrófilos infiltrando a muscular própria.',
    epidemiologia:
      'A emergência cirúrgica abdominal mais comum: risco ao longo da vida de 7–8 %, pico entre 10 e 30 anos. Em crianças pequenas e idosos o diagnóstico tende a atrasar e a perfuração é mais frequente.',
    patogenese: [
      'Obstrução da luz — fecalito no adulto, hiperplasia linfoide na criança, mais raramente corpo estranho, parasita ou tumor.',
      'A mucosa continua secretando muco na luz fechada: a pressão sobe e ultrapassa a pressão venosa da parede.',
      'O retorno venoso para, a parede congestiona e fica isquêmica; a barreira mucosa se rompe e ulcera.',
      'Bactérias da luz invadem a parede; neutrófilos migram da mucosa em direção à serosa — a inflamação fica transmural.',
      'Ao chegar à serosa, surge peritonite localizada (exsudato fibrinopurulento) — é quando a dor migra do epigástrio para a fossa ilíaca direita.',
      'Se a isquemia progride, a parede necrosa (forma gangrenosa) e pode perfurar, com abscesso ou peritonite difusa.',
    ],
    roteiro: [
      'Panorâmico: identifique o apêndice em corte transversal — luz central, mucosa com folículos linfoides, submucosa, muscular própria em duas camadas e serosa com o mesoapêndice (gordura).',
      'Procure onde a mucosa perdeu as glândulas: a luz passa a ser delimitada por exsudato purulento (ulceração).',
      'Siga a parede de dentro para fora e, na muscular própria, procure fendas de edema com células pequenas entre os feixes: são neutrófilos — o critério diagnóstico.',
      'Na superfície externa, veja se há uma faixa rosa felpuda com neutrófilos (exsudato fibrinopurulento): periapendicite.',
      'Grande aumento: confirme os núcleos segmentados dos neutrófilos na muscular e procure necrose (gangrena) e perfuração.',
    ],
    achados: [
      {
        achado: 'inflamacao-aguda-transmural',
        tipo: 'especifico',
        comoAparece: 'Neutrófilos entre os feixes da muscular própria, separados por edema. É o critério diagnóstico.',
        peso: 'criterio',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Mucosa com perda de glândulas e epitélio, substituída por exsudato purulento voltado para a luz.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Lençóis de neutrófilos na mucosa, na luz e na submucosa — pus.',
        peso: 'criterio',
      },
      {
        achado: 'exsudato-fibrinopurulento',
        tipo: 'especifico',
        comoAparece: 'Fibrina e neutrófilos sobre a serosa (periapendicite): a inflamação chegou ao peritônio.',
        peso: 'frequente',
      },
      {
        achado: 'edema-inflamatorio',
        tipo: 'geral',
        comoAparece: 'Fendas claras afastando os feixes musculares e a trama da submucosa e da subserosa.',
        peso: 'frequente',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Vasos da submucosa, da subserosa e do mesoapêndice dilatados e cheios de hemácias.',
        peso: 'frequente',
      },
      {
        achado: 'abscesso',
        tipo: 'geral',
        comoAparece: 'Coleções de pus na parede ou no mesoapêndice, nas formas supurativas avançadas.',
        peso: 'ocasional',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Parede sem núcleos, hipereosinofílica, na forma gangrenosa.',
        peso: 'ocasional',
      },
      {
        achado: 'hiperplasia-linfoide-reativa',
        tipo: 'especifico',
        comoAparece: 'Folículos linfoides grandes, com centros germinativos, que podem estreitar a luz — causa comum de obstrução em jovens.',
        peso: 'ocasional',
      },
      {
        achado: 'fecalito',
        tipo: 'especifico',
        comoAparece: 'Concreção lamelar na luz; muitas vezes não aparece no corte examinado.',
        peso: 'ocasional',
      },
      {
        achado: 'perfuracao-da-parede',
        tipo: 'especifico',
        comoAparece: 'Descontinuidade transmural com necrose e pus comunicando luz e serosa.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Apêndice normal com folículos linfoides proeminentes',
        comoSeparar:
          'Folículos com centros germinativos são normais no jovem; sem neutrófilos na muscular própria não há apendicite, por mais "roxa" que a mucosa pareça.',
      },
      {
        nome: 'Periapendicite secundária (peritonite de outra origem)',
        comoSeparar:
          'Inflamação só na serosa, com mucosa e muscular poupadas: vem de fora (salpingite, diverticulite, perfuração de outra víscera). Na apendicite, o gradiente vai de dentro para fora.',
      },
      {
        nome: 'Apendicite granulomatosa (Crohn, Yersinia, tuberculose)',
        comoSeparar: 'Granulomas epitelioides e inflamação crônica transmural com fibrose — não o predomínio de neutrófilos.',
      },
      {
        nome: 'Neoplasia do apêndice (tumor neuroendócrino, neoplasia mucinosa)',
        comoSeparar:
          'Pode causar a obstrução: sempre procure ninhos de células uniformes na ponta (neuroendócrino) ou epitélio mucinoso displásico e muco dissecando a parede.',
      },
    ],
    correlacaoClinica: [
      'Dor periumbilical que migra para a fossa ilíaca direita (ponto de McBurney) = a inflamação passou da mucosa (dor visceral, mal localizada) à serosa (dor somática, localizada).',
      'Febre baixa e leucocitose com neutrofilia refletem a mesma resposta neutrofílica vista na parede.',
      'Tratamento: apendicectomia; antibiótico isolado é opção em casos não complicados selecionados. O exame histológico confirma o diagnóstico e exclui tumor.',
    ],
    comparacaoComNormal: [
      'No normal, a mucosa tem glândulas (criptas) regulares, com células caliciformes, sobre uma lâmina própria cheia de folículos linfoides.',
      'A muscular própria normal é compacta e rosa homogênea, sem fendas nem células inflamatórias entre os feixes.',
      'A serosa normal é uma linha fina de mesotélio sobre tecido conjuntivo frouxo, sem fibrina.',
    ],
    doencaDoManual: 'apendicite-aguda',
  },
]
