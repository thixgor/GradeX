import type { AchadoPatologico } from '../tipos'

/** Adaptações celulares: metaplasia, atrofia, hiperplasia, hipertrofia. */
export const ACHADOS_ADAPTACAO: AchadoPatologico[] = [
  {
    id: 'metaplasia-intestinal',
    nome: 'Metaplasia intestinal',
    sinonimos: ['metaplasia intestinal gástrica', 'metaplasia colunar com caliciformes'],
    categoria: 'adaptacao',
    resumo:
      'Epitélio do tipo intestinal — células caliciformes em "cálice", às vezes células de Paneth e borda em escova — substituindo o epitélio normal do estômago (ou do esôfago, no Barrett).',
    comoReconhecer: [
      'No médio aumento: entre as glândulas gástricas de citoplasma claro e uniforme, aparecem glândulas com vacúolos redondos e brancos de muco (células caliciformes) espaçados — como no intestino.',
      'No grande aumento: caliciformes com o muco "empurrando" o núcleo para a base; células de Paneth com grânulos vermelho-vivos na base das criptas (metaplasia completa).',
      'O epitélio foveolar gástrico normal também é mucoso, mas o muco ocupa o topo de TODAS as células de modo uniforme (em "capuz"), sem vacúolos isolados.',
    ],
    mecanismo: [
      'Agressão crônica (H. pylori, refluxo biliar, ácido no esôfago) faz as células-tronco trocarem de programa de diferenciação — ativação de CDX2, o gene "mestre" do intestino.',
      'O novo epitélio é mais resistente ao agente, mas é também terreno para displasia.',
    ],
    significado: [
      'É um passo da cascata de Correa (gastrite crônica → atrofia → metaplasia intestinal → displasia → adenocarcinoma gástrico do tipo intestinal).',
      'No esôfago, metaplasia intestinal define o esôfago de Barrett e o risco de adenocarcinoma esofágico.',
      'Metaplasia é reversível em princípio, mas a metaplasia intestinal extensa raramente regride mesmo após erradicar o H. pylori.',
    ],
    ondeOcorre: ['Gastrite crônica por H. pylori e gastrite autoimune', 'Esôfago de Barrett', 'Bordas de úlceras gástricas crônicas'],
    armadilhas: [
      'Células "pseudocaliciformes" (foveolares distendidas por muco) não têm o formato de cálice nítido; em dúvida, o Alcian blue pH 2,5 cora a mucina intestinal (ácida) de azul.',
    ],
  },
  {
    id: 'hiperplasia-glandular',
    nome: 'Hiperplasia nodular glandular e estromal',
    sinonimos: ['hiperplasia', 'nódulos hiperplásicos'],
    categoria: 'adaptacao',
    resumo:
      'Aumento do número de células de um órgão, formando nódulos de glândulas e/ou estroma que mantêm a arquitetura e a citologia normais.',
    comoReconhecer: [
      'No pequeno aumento: nódulos arredondados, de tamanhos variados, que comprimem o tecido ao redor.',
      'No grande aumento: as células são iguais às normais — sem atipia —, apenas em maior número.',
    ],
    mecanismo: ['Estímulo hormonal ou de fatores de crescimento persistente leva as células a proliferar; se o estímulo cessa, a hiperplasia regride (diferente da neoplasia).'],
    significado: ['Benigna; causa sintomas por volume (obstrução urinária na próstata, sangramento no endométrio).'],
    ondeOcorre: ['Hiperplasia prostática benigna', 'Hiperplasia endometrial', 'Bócio nodular', 'Hiperplasia da mama'],
    armadilhas: ['Hiperplasia endometrial com atipia é precursora de carcinoma: sempre avalie a citologia.'],
  },
]
