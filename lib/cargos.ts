/**
 * Registro de cargos — o catálogo de "o que uma conta pode ser".
 *
 * ## O problema que isto resolve
 *
 * Até aqui, criar um cargo novo era uma tarefa de programação. O `Quest` (o
 * Banco de Questões vendido sozinho) exigiu tocar em nove arquivos: o union de
 * `AccountType`, a tabela de tetos, a de flashcards, os padrões de permissão, o
 * seletor do admin, o selo da barra lateral, o rótulo do perfil, os filtros de
 * expiração e o Plus+ Guard. Nada disso é decisão de engenharia — é decisão de
 * produto, e produto não devia esperar deploy.
 *
 * Aqui o cargo vira **dado**: um documento com id, rótulo, cor, se é pago e
 * quais áreas da plataforma ele libera (com teto, quando a área tem). O admin
 * cria em `/admin/cargos` e o cargo já existe para atribuir a um usuário,
 * marcar num material e vender num plano.
 *
 * ## Por que reusar `PlanPermissions`
 *
 * As permissões modulares de plano (`lib/plan-entitlements.ts`) já descrevem
 * exatamente o que um cargo precisa dizer: uma regra por área, com liberação e
 * teto por janela. Inventar um segundo formato daria dois vocabulários para a
 * mesma pergunta — e, pior, dois lugares para a resposta divergir. O cargo
 * carrega um bloco `PlanPermissions` e todo o maquinário de contagem, recusa e
 * mensagem passa a valer para ele de graça.
 *
 * ## A regra de precedência (a parte que não pode dar errado)
 *
 * Três camadas respondem "esta conta pode abrir tal área", nesta ordem:
 *
 *  1. **Plano** (`user.premiumPlanType` → `PlanConfig.permissoes`) com o
 *     interruptor ligado. Quem comprou um plano específico é regido por ele.
 *  2. **Cargo** (`user.accountType` → `CargoDefinicao.permissoes`) com o
 *     interruptor ligado. É o caso de todo cargo criado pelo admin.
 *  3. **Caminho legado** — as tabelas por cargo em `lib/tier-limits.ts` e os
 *     testes diretos (`isPlusAccount`, `temAcessoAoBanco`). É o que continua
 *     valendo quando nenhuma das duas camadas acima está ligada.
 *
 * Os cargos embutidos nascem com o interruptor **desligado** de propósito:
 * assim este arquivo entra em produção sem mudar o acesso de ninguém. Ligar o
 * interruptor de um embutido é uma escolha explícita do admin, feita numa tela
 * que mostra o que muda.
 *
 * ## Este arquivo é isomórfico
 *
 * Só tipos e funções puras — a página do admin e as rotas de servidor consomem
 * daqui. Quem toca no banco é `lib/cargos-server.ts`.
 */

import { PLUS_LABEL, QUEST_LABEL } from './account-tier'
import {
  PLAN_FEATURE_KEYS,
  normalizePlanPermissions,
  permissoesLiberadas,
  permissoesPadraoParaCargo,
  regraDaArea,
  todosOsModulosDoManual,
  type PlanFeatureKey,
  type PlanPermissions,
} from './plan-entitlements'

/** Sobe quando o formato do documento muda de forma incompatível. */
export const CARGO_VERSION = 1

// ─── Cores do selo ────────────────────────────────────────────────────────────

/**
 * Paleta fechada em vez de campo livre de cor.
 *
 * O selo do cargo aparece no perfil, na lista de usuários e no cabeçalho da
 * conta — três lugares com fundo claro e escuro. Um hex digitado à mão passa
 * no editor e some no tema escuro; estas doze combinações foram escolhidas
 * para ter contraste nos dois.
 */
export const CARGO_CORES = [
  { id: 'cinza', label: 'Cinza', classes: 'from-gray-400 to-gray-500', hex: '#6b7280' },
  { id: 'ambar', label: 'Âmbar', classes: 'from-yellow-500 to-orange-500', hex: '#f59e0b' },
  { id: 'esmeralda', label: 'Esmeralda', classes: 'from-emerald-500 to-teal-500', hex: '#10b981' },
  { id: 'azul', label: 'Azul', classes: 'from-blue-500 to-cyan-500', hex: '#3b82f6' },
  { id: 'violeta', label: 'Violeta', classes: 'from-violet-500 to-purple-600', hex: '#8b5cf6' },
  { id: 'rosa', label: 'Rosa', classes: 'from-pink-500 to-rose-500', hex: '#ec4899' },
  { id: 'vermelho', label: 'Vermelho', classes: 'from-red-500 to-orange-600', hex: '#ef4444' },
  { id: 'verde', label: 'Verde', classes: 'from-green-600 to-emerald-600', hex: '#16a34a' },
  { id: 'indigo', label: 'Índigo', classes: 'from-indigo-500 to-blue-600', hex: '#6366f1' },
  { id: 'ciano', label: 'Ciano', classes: 'from-cyan-500 to-sky-600', hex: '#06b6d4' },
  { id: 'laranja', label: 'Laranja', classes: 'from-orange-500 to-amber-600', hex: '#f97316' },
  { id: 'ardosia', label: 'Ardósia', classes: 'from-slate-600 to-slate-700', hex: '#475569' },
] as const

export type CargoCor = (typeof CARGO_CORES)[number]['id']

const COR_PADRAO: CargoCor = 'cinza'

export function classesDaCor(cor?: string | null): string {
  return (CARGO_CORES.find(c => c.id === cor) || CARGO_CORES[0]).classes
}

export function hexDaCor(cor?: string | null): string {
  return (CARGO_CORES.find(c => c.id === cor) || CARGO_CORES[0]).hex
}

// ─── Ícones do selo ───────────────────────────────────────────────────────────

/**
 * Nomes de ícone aceitos. A tradução para o componente fica na interface — este
 * arquivo roda no servidor e não importa `lucide-react`.
 */
export const CARGO_ICONES = [
  'none',
  'crown',
  'sparkles',
  'target',
  'timer',
  'star',
  'zap',
  'shield',
  'book',
  'graduation',
  'infinity',
] as const

export type CargoIcone = (typeof CARGO_ICONES)[number]

// ─── O cargo ──────────────────────────────────────────────────────────────────

export interface CargoDefinicao {
  /** Slug gravado em `user.accountType`. Imutável depois de criado. */
  id: string
  /** Rótulo de marca, como aparece para o aluno ("Plus+", "Quest"). */
  nome: string
  /** Uma linha explicando o que o cargo entrega. Aparece no admin. */
  descricao?: string
  cor: CargoCor
  icone: CargoIcone
  /**
   * Cargo pago: vence pela data em `premiumExpiresAt`, é rebaixado pelo cron,
   * conta como receita e entra nas cotas antiabuso do Plus+ Guard.
   *
   * Um cargo **não** pago é um rótulo sem cobrança (gratuito, trial, cortesia):
   * não vence sozinho e o Guard não o alcança.
   */
  pago: boolean
  /**
   * O que o cargo libera. Com `permissoes.ativo` desligado, este bloco é
   * ignorado e o caminho legado (tabelas por cargo) responde — ver o cabeçalho
   * deste arquivo.
   */
  permissoes: PlanPermissions
  /**
   * Cargo de fábrica. Não pode ser apagado nem ter o id trocado: existe código
   * que o nomeia diretamente (`isPlusAccount`, filtros de receita, cupons).
   */
  embutido?: boolean
  ordem: number
  criadoEm?: Date
  atualizadoEm?: Date
}

/** O que a interface precisa saber sobre um cargo. Seguro de expor ao cliente. */
export interface CargoPublico {
  id: string
  nome: string
  descricao?: string
  cor: CargoCor
  icone: CargoIcone
  pago: boolean
  embutido: boolean
  ordem: number
  /** Áreas liberadas, já resolvidas — a interface não recalcula regra. */
  areas: Record<PlanFeatureKey, boolean>
  /** O bloco modular está ligado para este cargo? */
  modular: boolean
}

// ─── Cargos de fábrica ────────────────────────────────────────────────────────

/**
 * Ids que o código nomeia diretamente e que, por isso, não podem sumir.
 *
 * `gratuito` é o piso de toda conta (é para onde o cron rebaixa quem vence, e
 * o que `normalizeAccountType` devolve para valor desconhecido). `plus` é o
 * cargo que `isPlusAccount()` testa em ~100 lugares. `trial` e `quest` têm
 * ramos próprios na rota que atribui cargo.
 */
export const CARGOS_EMBUTIDOS_IDS = ['gratuito', 'trial', 'quest', 'plus'] as const

/**
 * O registro de fábrica — o que existe antes de o admin abrir `/admin/cargos`
 * pela primeira vez, e o piso sobre o qual o que está gravado é mesclado.
 *
 * Todos nascem com `permissoes.ativo: false`: o registro entra em produção sem
 * mudar o acesso de ninguém, e cada cargo só passa a ser regido por ele quando
 * alguém liga o interruptor na tela.
 */
export function cargosEmbutidos(): CargoDefinicao[] {
  const base = (
    id: string,
    nome: string,
    descricao: string,
    cor: CargoCor,
    icone: CargoIcone,
    pago: boolean,
    ordem: number,
  ): CargoDefinicao => ({
    id,
    nome,
    descricao,
    cor,
    icone,
    pago,
    // O padrão do cargo é o que ele já concede hoje pelo caminho legado, para
    // que ligar o interruptor não conceda nem tire nada por acidente.
    permissoes: { ...permissoesPadraoParaCargo(id), ativo: false },
    embutido: true,
    ordem,
  })

  return [
    base(
      'gratuito',
      'Gratuito',
      'O piso de toda conta. É para onde o cron rebaixa quem vence.',
      'cinza',
      'none',
      false,
      1,
    ),
    base(
      'trial',
      'Trial',
      'Período de teste com prazo próprio (`trialExpiresAt`).',
      'azul',
      'timer',
      false,
      2,
    ),
    /*
     * Rótulo vindo das constantes de marca, e não escrito aqui.
     *
     * O "Quest" virou "Quest+" numa mudança de posicionamento, e um nome
     * digitado neste arquivo teria sobrevivido à mudança: a plataforma inteira
     * diria "Quest+" e só esta tela diria "Quest". O registro é a fonte da
     * verdade sobre cargo, mas não sobre marca — a marca continua sendo de
     * `account-tier`, e o admin pode reescrevê-la salvando por cima.
     */
    base(
      'quest',
      QUEST_LABEL,
      'O Banco de Questões e o PDF das provas, vendidos sozinhos. Fora disso, vale uma conta gratuita.',
      'esmeralda',
      'target',
      true,
      3,
    ),
    base(
      'plus',
      PLUS_LABEL,
      'A plataforma inteira, sem teto.',
      'ambar',
      'crown',
      true,
      4,
    ),
  ]
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

/**
 * Ids reservados: são valores que já significam outra coisa no documento do
 * usuário ou nos filtros de acesso, e um cargo com esse id criaria uma conta
 * que o resto do sistema lê errado.
 */
export const IDS_RESERVADOS = [
  'admin', // `user.role`, não `accountType` — daria um cargo que finge ser admin
  'user', // idem
  'monitor', // cargo secundário (`secondaryRole`), usado nos grupos de acesso
  'premium', // alias legado de `plus`
  'essential', // alias legado de `plus`
  'plus+', // `normalizeAccountType` já traduz para `plus`
  'quest+', // idem, para `quest`
]

/**
 * Transforma o nome digitado num id utilizável: minúsculo, sem acento, só
 * letras/números/hífen. "Manual Clínico Pro" → "manual-clinico-pro".
 */
export function slugDeCargo(valor: string): string {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export interface VeredictoDeId {
  valido: boolean
  motivo?: string
}

/** O id serve? Roda igual no editor (aviso na hora) e na rota (recusa). */
export function validarIdDeCargo(id: string, idsExistentes: string[] = []): VeredictoDeId {
  const slug = slugDeCargo(id)
  if (!slug) return { valido: false, motivo: 'Dê um nome ao cargo.' }
  if (slug.length < 3) return { valido: false, motivo: 'O id precisa de pelo menos 3 letras.' }
  if (IDS_RESERVADOS.includes(slug)) {
    return { valido: false, motivo: `"${slug}" é reservado pelo sistema. Escolha outro nome.` }
  }
  if (idsExistentes.includes(slug)) {
    return { valido: false, motivo: `Já existe um cargo com o id "${slug}".` }
  }
  return { valido: true }
}

// ─── Normalização e sanitização ───────────────────────────────────────────────

function corValida(valor: unknown): CargoCor {
  const v = String(valor || '')
  return (CARGO_CORES.find(c => c.id === v)?.id as CargoCor) || COR_PADRAO
}

function iconeValido(valor: unknown): CargoIcone {
  const v = String(valor || '') as CargoIcone
  return CARGO_ICONES.includes(v) ? v : 'none'
}

/**
 * Completa um cargo vindo do banco (ou do formulário) com os padrões.
 *
 * Tolerante de propósito, pelo mesmo motivo de `normalizePlanPermissions`: o
 * documento vive no Mongo e sobrevive a mudanças de código. Um campo com lixo
 * não pode derrubar a checagem de acesso de quem já tem o cargo.
 */
export function normalizeCargo(entrada: Partial<CargoDefinicao> | null | undefined): CargoDefinicao | null {
  if (!entrada || typeof entrada !== 'object') return null
  const id = slugDeCargo(String(entrada.id || ''))
  if (!id) return null

  return {
    id,
    nome: String(entrada.nome || id).trim().slice(0, 40) || id,
    descricao: entrada.descricao ? String(entrada.descricao).trim().slice(0, 200) : undefined,
    cor: corValida(entrada.cor),
    icone: iconeValido(entrada.icone),
    pago: !!entrada.pago,
    permissoes: normalizePlanPermissions(entrada.permissoes),
    embutido: !!entrada.embutido,
    ordem: Number.isFinite(Number(entrada.ordem)) ? Number(entrada.ordem) : 99,
    criadoEm: entrada.criadoEm ? new Date(entrada.criadoEm) : undefined,
    atualizadoEm: entrada.atualizadoEm ? new Date(entrada.atualizadoEm) : undefined,
  }
}

/**
 * Mescla o que está gravado com os cargos de fábrica.
 *
 * Os embutidos são a base e sempre existem, mesmo que o documento gravado não
 * os cite — sumir com o `gratuito` porque alguém salvou uma lista incompleta
 * deixaria contas sem cargo válido. O gravado por cima traz as edições do
 * admin (rótulo, cor, permissões), mas nunca consegue apagar um embutido nem
 * tirar dele a marca de embutido.
 */
export function mesclarRegistroDeCargos(gravados?: unknown): CargoDefinicao[] {
  const embutidos = cargosEmbutidos()
  const porId = new Map<string, CargoDefinicao>(embutidos.map(c => [c.id, c]))

  if (Array.isArray(gravados)) {
    for (const bruto of gravados) {
      const cargo = normalizeCargo(bruto as Partial<CargoDefinicao>)
      if (!cargo) continue
      const embutido = porId.get(cargo.id)
      porId.set(cargo.id, {
        ...cargo,
        // A marca de embutido é do código, não do documento: um cargo criado
        // pelo admin não vira intocável por gravar `embutido: true`, e um
        // embutido não vira apagável por gravar `false`.
        embutido: !!embutido,
        // Nem o rótulo nem a cor de um embutido são sagrados — o admin pode
        // renomear o "Plus+" se a marca mudar. Mas `pago` de um embutido é
        // estrutural (o cron e o Guard contam com ele), então fica fixo.
        pago: embutido ? embutido.pago : cargo.pago,
      })
    }
  }

  return Array.from(porId.values()).sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
}

/** Versão para a rota de escrita: normaliza, protege os embutidos e carimba. */
export function sanitizarRegistroDeCargos(entrada: unknown): CargoDefinicao[] {
  const agora = new Date()
  return mesclarRegistroDeCargos(entrada).map((cargo, indice) => ({
    ...cargo,
    ordem: indice + 1,
    permissoes: { ...cargo.permissoes, atualizadoEm: agora },
    criadoEm: cargo.criadoEm || agora,
    atualizadoEm: agora,
  }))
}

// ─── Consultas puras ──────────────────────────────────────────────────────────

export function acharCargo(registro: CargoDefinicao[], id?: string | null): CargoDefinicao | null {
  if (!id) return null
  const alvo = slugDeCargo(String(id))
  return registro.find(c => c.id === alvo) || null
}

/**
 * As áreas que um cargo libera, prontas para a interface.
 *
 * Com o bloco modular desligado o cargo não responde por área nenhuma — quem
 * responde é o caminho legado —, então aqui a resposta é o padrão do cargo, que
 * é justamente o retrato do que o legado concede.
 */
export function areasDoCargo(cargo: CargoDefinicao): Record<PlanFeatureKey, boolean> {
  const fonte = cargo.permissoes.ativo ? cargo.permissoes : permissoesPadraoParaCargo(cargo.id)
  return PLAN_FEATURE_KEYS.reduce((acc, key) => {
    acc[key] = regraDaArea(fonte, key).liberado
    return acc
  }, {} as Record<PlanFeatureKey, boolean>)
}

/** Recorte seguro para mandar ao navegador. */
export function cargoPublico(cargo: CargoDefinicao): CargoPublico {
  return {
    id: cargo.id,
    nome: cargo.nome,
    descricao: cargo.descricao,
    cor: cargo.cor,
    icone: cargo.icone,
    pago: cargo.pago,
    embutido: !!cargo.embutido,
    ordem: cargo.ordem,
    areas: areasDoCargo(cargo),
    modular: cargo.permissoes.ativo,
  }
}

/** Um cargo novo, pronto para o formulário: nada liberado, tudo a ligar. */
export function cargoEmBranco(ordem: number): CargoDefinicao {
  const permissoes = permissoesLiberadas()
  for (const key of PLAN_FEATURE_KEYS) {
    permissoes.regras[key] = { liberado: false, limite: 0, periodo: 'dia' }
  }
  return {
    id: '',
    nome: '',
    descricao: '',
    cor: COR_PADRAO,
    icone: 'none',
    pago: true,
    /*
     * Nasce com o interruptor LIGADO e tudo fechado — o oposto dos embutidos.
     *
     * Um cargo criado agora não tem caminho legado para herdar: nenhuma tabela
     * de tetos o conhece. Se ele nascesse desligado, `resolverPermissoes` cairia
     * no legado, o legado não o encontraria e a conta se comportaria como
     * gratuita — o admin teria criado um cargo que não faz nada e não saberia
     * por quê. Ligado e fechado, o que ele libera é exatamente o que a pessoa
     * marcar na tela.
     */
    permissoes: { ...permissoes, ativo: true, manualClinicoModulos: todosOsModulosDoManual(false) },
    ordem,
  }
}
