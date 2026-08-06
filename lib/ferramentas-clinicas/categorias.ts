import type { Categoria, CategoriaId } from './tipos'

/**
 * As 15 famílias de ferramentas.
 *
 * `total` é escrito à mão porque o índice precisa mostrar o número antes de
 * carregar o módulo pesado de cada categoria (cada um é um chunk separado, só
 * baixado quando a pessoa abre a categoria ou usa a busca). Em desenvolvimento,
 * `index.ts` compara o total declarado com o real e grita no console se
 * divergirem — o número na tela é promessa, não decoração.
 */
export const CATEGORIAS: Categoria[] = [
  {
    id: 'gasometria',
    nome: 'Gasometria e equilíbrio ácido-base',
    subtitulo: 'Do pH ao delta-delta, com a conta aberta',
    descricao:
      'Interpretar uma gasometria é responder quatro perguntas em ordem — acidemia ou alcalemia, quem é o distúrbio primário, a compensação é a esperada, e há um segundo distúrbio escondido no ânion gap. Estas ferramentas percorrem exatamente essa sequência e mostram cada passo, inclusive os que costumam ser pulados.',
    icone: 'gasometria',
    cor: 'ciano',
    total: 18,
  },
  {
    id: 'cardiologia',
    nome: 'Cardiologia',
    subtitulo: 'ECG, escores de risco e hemodinâmica',
    descricao:
      'Os escores cardiológicos existem para transformar impressão em probabilidade: quem pode ir para casa da emergência, quem precisa de anticoagulação, quem sangra se anticoagulado. Aqui estão as calculadoras de ECG, os escores de dor torácica, de fibrilação atrial, de tromboembolismo e as contas hemodinâmicas de beira de leito.',
    icone: 'cardiologia',
    cor: 'vermelho',
    total: 29,
  },
  {
    id: 'pneumologia',
    nome: 'Pneumologia e ventilação mecânica',
    subtitulo: 'Mecânica ventilatória, oxigenação e gravidade',
    descricao:
      'Ventilação protetora é aritmética: peso predito define volume corrente, volume corrente e complacência definem driving pressure, e driving pressure é a variável que mais consistentemente se associa a mortalidade na SDRA. Somam-se os escores de gravidade da pneumonia, do TEP e os índices de desmame.',
    icone: 'pneumologia',
    cor: 'azul',
    total: 21,
  },
  {
    id: 'nefrologia',
    nome: 'Nefrologia e eletrólitos',
    subtitulo: 'Filtração, frações de excreção e distúrbios do sódio',
    descricao:
      'A conta do sódio é a que mais mata quando feita errado: corrigir rápido demais desmieliniza, devagar demais deixa convulsionar. Estas ferramentas cobrem estimativa de função renal, as frações de excreção que separam pré-renal de necrose tubular, e os cálculos de déficit e velocidade de correção com os limites de segurança explícitos.',
    icone: 'nefrologia',
    cor: 'violeta',
    total: 21,
  },
  {
    id: 'infectologia',
    nome: 'Infectologia',
    subtitulo: 'Sepse, deterioração clínica e antimicrobianos',
    descricao:
      'Sepse é disfunção orgânica, não febre com taquicardia — a mudança de definição em 2016 trocou SIRS por SOFA e é a razão de escore nenhum aqui ser gatilho isolado de conduta. Ao lado dos escores de rastreio e gravidade, as ferramentas de dose, ajuste renal e alvo farmacodinâmico de antimicrobianos.',
    icone: 'infectologia',
    cor: 'verde',
    total: 21,
  },
  {
    id: 'neurologia',
    nome: 'Neurologia',
    subtitulo: 'Coma, AVC, hemorragia e sedação',
    descricao:
      'Escalas neurológicas são o exame físico transformado em número reprodutível entre plantões — é isso que permite comparar o NIHSS da porta com o de duas horas depois e decidir. Estão aqui as escalas de coma, os escores de AVC isquêmico e hemorrágico, as de sedação e delirium e a conta de perfusão cerebral.',
    icone: 'neurologia',
    cor: 'indigo',
    total: 17,
  },
  {
    id: 'gastroenterologia',
    nome: 'Gastroenterologia e hepatologia',
    subtitulo: 'Cirrose, hemorragia digestiva, pancreatite e fibrose',
    descricao:
      'A hepatologia é a especialidade dos escores: Child-Pugh classifica, MELD prioriza transplante, Maddrey define corticoide na hepatite alcoólica e King’s College define transplante urgente na falência aguda. Junto vêm os escores de hemorragia digestiva, de gravidade da pancreatite e os índices não invasivos de fibrose.',
    icone: 'gastroenterologia',
    cor: 'ambar',
    total: 19,
  },
  {
    id: 'hematologia',
    nome: 'Hematologia',
    subtitulo: 'Hemograma, coagulação e reposição',
    descricao:
      'Ler um hemograma é converter percentuais em valores absolutos e comparar com o esperado para a resposta medular. Aqui estão a correção de reticulócitos, a classificação das anemias, os escores de trombose e de trombocitopenia induzida por heparina, e a conta de ferro de Ganzoni.',
    icone: 'hematologia',
    cor: 'rosa',
    total: 17,
  },
  {
    id: 'endocrinologia',
    nome: 'Endocrinologia e metabolismo',
    subtitulo: 'Diabetes, tireoide, insulina e composição corporal',
    descricao:
      'Da relação insulina-carboidrato ao gap osmolar da cetoacidose, esta categoria reúne as contas do dia a dia endocrinológico — incluindo as conversões de corticoide e de hormônio tireoidiano que resolvem metade dos erros de prescrição.',
    icone: 'endocrinologia',
    cor: 'laranja',
    total: 17,
  },
  {
    id: 'pediatria',
    nome: 'Pediatria e neonatologia',
    subtitulo: 'Dose por peso, hidratação, crescimento e recém-nascido',
    descricao:
      'Criança não é adulto pequeno, e a prova disso é que quase toda conduta pediátrica passa por uma conta de peso ou superfície corporal. Estão aqui Holliday-Segar, as escalas neonatais, os percentis de crescimento, a fototerapia e as doses máximas que evitam intoxicação.',
    icone: 'pediatria',
    cor: 'turquesa',
    total: 19,
  },
  {
    id: 'ginecologia',
    nome: 'Obstetrícia e ginecologia',
    subtitulo: 'Idade gestacional, pré-eclâmpsia e risco obstétrico',
    descricao:
      'Datar a gestação corretamente muda cada decisão que vem depois — do rastreio à via de parto. Somam-se os escores de indução, os critérios de pré-eclâmpsia, a dose de sulfato de magnésio e os índices de risco obstétrico.',
    icone: 'ginecologia',
    cor: 'magenta',
    total: 16,
  },
  {
    id: 'emergencia',
    nome: 'Emergência e terapia intensiva',
    subtitulo: 'Gravidade, drogas vasoativas e infusões',
    descricao:
      'Na emergência a conta precisa sair em segundos e sem erro de vírgula: mcg/kg/min para mL/h, diluição padrão, gotas por minuto, dose máxima de anestésico local. Ao lado, os escores de gravidade que definem UTI e o checklist de sequência rápida.',
    icone: 'emergencia',
    cor: 'vermelho',
    total: 76,
  },
  {
    id: 'cirurgia',
    nome: 'Cirurgia e avaliação perioperatória',
    subtitulo: 'Risco cirúrgico, apendicite, colecistite e sangramento',
    descricao:
      'A avaliação pré-operatória é um exercício de estratificação: ASA descreve o doente, RCRI estima evento cardíaco, Caprini estima trombose e POSSUM estima morbimortalidade global. Junto, os escores diagnósticos de abdome agudo e as contas de volemia e transfusão.',
    icone: 'cirurgia',
    cor: 'esmeralda',
    total: 16,
  },
  {
    id: 'farmacologia',
    nome: 'Farmacologia e prescrição',
    subtitulo: 'Doses, conversões, cinética e interações',
    descricao:
      'Prescrever com segurança é dominar quatro contas — dose por peso, ajuste por função de órgão, conversão entre fármacos da mesma classe e velocidade de infusão. Esta categoria cobre as quatro, mais a farmacocinética que explica por que a dose de ataque não depende do clearance.',
    icone: 'farmacologia',
    cor: 'azul',
    total: 22,
  },
  {
    id: 'nutricao',
    nome: 'Nutrição clínica',
    subtitulo: 'Gasto energético, proteína e risco nutricional',
    descricao:
      'A meta calórica errada tem dois custos simétricos: subnutrição perpetua a perda de massa magra, hipernutrição gera hiperglicemia e retenção de CO₂. Aqui estão as equações preditivas, as metas proteicas por condição, os escores de rastreio e o risco de síndrome de realimentação.',
    icone: 'nutricao',
    cor: 'lima',
    total: 17,
  },
]

export const CATEGORIA_POR_ID: Record<CategoriaId, Categoria> = CATEGORIAS.reduce(
  (acc, c) => {
    acc[c.id] = c
    return acc
  },
  {} as Record<CategoriaId, Categoria>,
)

export const IDS_CATEGORIAS = CATEGORIAS.map((c) => c.id)

export function ehCategoria(id: string): id is CategoriaId {
  return IDS_CATEGORIAS.includes(id as CategoriaId)
}
