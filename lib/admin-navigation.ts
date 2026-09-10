import type { LucideIcon } from 'lucide-react'
import {
  BadgeDollarSign,
  BadgePercent,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  Database,
  FileText,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Key,
  LifeBuoy,
  Mail,
  Megaphone,
  MessageSquare,
  MessageSquareQuote,
  Music,
  Network,
  Package,
  Pill,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Ticket,
  Users,
  Users2,
  Video,
} from 'lucide-react'

/**
 * Mapa único do painel administrativo.
 *
 * Antes cada superfície tinha a sua própria lista: a home do /admin repetia
 * 27 cartões grandes escritos à mão e o resto do painel não tinha índice
 * nenhum — de dentro de uma seção só se voltava pelo botão do navegador. O
 * resultado no celular era o que o usuário relatou: rolar meia tela atrás de
 * uma função, e várias páginas que existem (tickets, verificação de equipe,
 * farmacologia, fórum, proctoring...) simplesmente não apareciam em lugar
 * nenhum.
 *
 * Este arquivo passa a ser a fonte única: a home monta os grupos a partir
 * daqui e o atalho flutuante (`admin-quick-nav`) busca na mesma lista. Página
 * nova de admin = uma entrada aqui, e ela aparece nos dois lugares.
 */

export type AdminGroupKey = 'conteudo' | 'comercial' | 'pessoas' | 'operacao'

export interface AdminGroup {
  key: AdminGroupKey
  label: string
  /** Rótulo curto usado nos chips de filtro, onde não cabe o nome inteiro. */
  labelCurto: string
  description: string
  /** Gradiente do grupo — os cartões herdam dele, em vez de 27 cores soltas. */
  color: string
}

export interface AdminShortcut {
  label: string
  href: string
}

export interface AdminSection {
  title: string
  description: string
  href: string
  icon: LucideIcon
  group: AdminGroupKey
  /** Sinônimos e termos que a pessoa realmente digita ("musica", "suporte"). */
  keywords?: string[]
  /** Ações internas da seção, para pular direto sem passar pela listagem. */
  atalhos?: AdminShortcut[]
  /** Marca destinos fora de `/admin` (ex.: gestão de aulas, mapas mentais). */
  externo?: boolean
}

export const ADMIN_GROUPS: AdminGroup[] = [
  {
    key: 'conteudo',
    label: 'Conteúdo & Estudo',
    labelCurto: 'Conteúdo',
    description: 'O que o aluno estuda: provas, questões, aulas, manuais e games.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'comercial',
    label: 'Vendas & Financeiro',
    labelCurto: 'Vendas',
    description: 'Receita, produtos, cupons, rifas, doações e captação.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'pessoas',
    label: 'Pessoas & Comunidade',
    labelCurto: 'Pessoas',
    description: 'Usuários, cargos, equipe, suporte e comunicação.',
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    key: 'operacao',
    label: 'Operação & Sistema',
    labelCurto: 'Sistema',
    description: 'Números da plataforma, fiscalização de provas e configurações.',
    color: 'from-orange-500 to-red-500',
  },
]

export const ADMIN_SECTIONS: AdminSection[] = [
  // ── Conteúdo & Estudo ────────────────────────────────────────────────
  {
    title: 'Provas',
    description: 'Criar, editar e acompanhar provas. Corrigir discursivas e ver submissões.',
    href: '/admin/exams',
    icon: FileText,
    group: 'conteudo',
    keywords: ['prova', 'exame', 'simulado', 'correcao', 'submissao'],
    atalhos: [{ label: 'Nova prova', href: '/admin/exams/create' }],
  },
  {
    title: 'Banco de Questões',
    description: 'Questões, hierarquia de assuntos, importação em massa e relatos de erro.',
    href: '/admin/banco-questoes',
    icon: Database,
    group: 'conteudo',
    keywords: ['questao', 'banco', 'topico', 'assunto', 'importar', 'relato'],
    atalhos: [
      { label: 'Questões', href: '/admin/banco-questoes/questoes' },
      { label: 'Hierarquia', href: '/admin/banco-questoes/hierarquia' },
      { label: 'Importar', href: '/admin/banco-questoes/importar' },
      { label: 'Importar provas', href: '/admin/banco-questoes/importar-provas' },
      { label: 'Histórico de importação', href: '/admin/banco-questoes/importar/historico' },
      { label: 'Extrair questões', href: '/admin/banco-questoes/extrair' },
      { label: 'Relatos', href: '/admin/banco-questoes/relatos' },
    ],
  },
  {
    title: 'Aulas & Trilhas',
    description: 'Estrutura do ensino, catálogo, turmas e publicação de aulas.',
    href: '/aulas/gerenciar',
    icon: GraduationCap,
    group: 'conteudo',
    externo: true,
    keywords: ['aula', 'trilha', 'turma', 'ensino', 'monitor', 'catalogo'],
    atalhos: [
      { label: 'Estrutura', href: '/aulas/gerenciar/estrutura' },
      { label: 'Catálogo', href: '/aulas/gerenciar/catalogo' },
      { label: 'Turmas', href: '/aulas/gerenciar/turmas' },
    ],
  },
  {
    title: 'Flashcards Manuais',
    description: 'Decks oficiais, comerciais e da comunidade. Decks pagos entram em /materiais.',
    href: '/admin/flashcards/manual',
    icon: BookOpen,
    group: 'conteudo',
    keywords: ['flashcard', 'deck', 'card', 'anki'],
    atalhos: [{ label: 'Pastas', href: '/admin/flashcards/manual/pastas' }],
  },
  {
    title: 'Temas de Flashcards',
    description: 'Temas sugeridos para a geração automática de flashcards.',
    href: '/admin/flashcards/themes',
    icon: Sparkles,
    group: 'conteudo',
    keywords: ['flashcard', 'tema', 'sugestao', 'ia'],
  },
  {
    title: 'Manual Clínico',
    description: 'Patologias do manual: cadastrar, importar e editar fichas de estudo.',
    href: '/admin/manual-clinico',
    icon: HeartPulse,
    group: 'conteudo',
    keywords: ['patologia', 'manual', 'clinico', 'ficha', 'doenca'],
    atalhos: [
      { label: 'Nova patologia', href: '/admin/manual-clinico/novo' },
      { label: 'Importar', href: '/admin/manual-clinico/importar' },
    ],
  },
  {
    title: 'Farmacologia',
    description: 'Fármacos do manual de farmacologia: cadastro, edição e importação.',
    href: '/admin/farmacologia',
    icon: Pill,
    group: 'conteudo',
    keywords: ['farmaco', 'remedio', 'medicamento', 'bula', 'farmacologia'],
    atalhos: [{ label: 'Importar', href: '/admin/farmacologia/importar' }],
  },
  {
    title: 'Games Educativos',
    description: 'Conteúdo dos jogos: Palavras Cruzadas, Forca e Caça aos Erros.',
    href: '/admin/games',
    icon: Gamepad2,
    group: 'conteudo',
    keywords: ['jogo', 'game', 'forca', 'cruzadas', 'caca aos erros'],
  },
  {
    title: 'Cronogramas & Avaliações',
    description: 'Provas e trabalhos por seção e período, com os lembretes de cada avaliação.',
    href: '/admin/cronogramas',
    icon: Calendar,
    group: 'conteudo',
    keywords: ['cronograma', 'calendario', 'avaliacao', 'ementa', 'lembrete'],
  },
  {
    title: 'Mapas Mentais',
    description: 'Todos os mapas da plataforma, inclusive privados e protegidos por senha.',
    href: '/mapa-mental?scope=all-admin',
    icon: Network,
    group: 'conteudo',
    externo: true,
    keywords: ['mapa', 'mental', 'mindmap'],
  },
  {
    title: 'Playlists de Estudo',
    description: 'Playlists do YouTube do player de música ambiente — foco e concentração.',
    href: '/admin/study-playlists',
    icon: Music,
    group: 'conteudo',
    keywords: ['musica', 'musicas', 'playlist', 'som', 'radio', 'youtube', 'player'],
  },
  {
    title: 'Tópicos do Fórum',
    description: 'Categorias e tópicos fixos do fórum da comunidade.',
    href: '/admin/forum-topics',
    icon: MessageSquare,
    group: 'conteudo',
    keywords: ['forum', 'topico', 'comunidade', 'discussao'],
  },

  // ── Vendas & Financeiro ──────────────────────────────────────────────
  {
    title: 'DomineAqui Analytics',
    description: 'Vendas, assinaturas, conversão, abandonos, pedidos e cancelamentos.',
    href: '/admin/analytics',
    icon: BadgeDollarSign,
    group: 'comercial',
    keywords: ['analytics', 'receita', 'financeiro', 'vendas', 'faturamento', 'assinatura'],
  },
  {
    title: 'Materiais',
    description: 'Marketplace de materiais: criar materiais, pastas e pacotes, com preço ou grátis.',
    href: '/admin/materiais',
    icon: ShoppingCart,
    group: 'comercial',
    keywords: ['material', 'pdf', 'apostila', 'pacote', 'marketplace'],
  },
  {
    title: 'Loja Física',
    description: 'Produtos impressos, galeria, entrega, frete por região e pedidos.',
    href: '/admin/loja',
    icon: Package,
    group: 'comercial',
    keywords: ['loja', 'produto', 'frete', 'pedido', 'entrega', 'impresso'],
  },
  {
    title: 'Cupons',
    description: 'Cupons de desconto para materiais, flashcards e pacotes.',
    href: '/admin/coupons',
    icon: BadgePercent,
    group: 'comercial',
    keywords: ['cupom', 'cupons', 'desconto', 'promocao', 'voucher'],
  },
  {
    title: 'Lotes por Evento',
    description: 'Descontos progressivos ligados a uma prova ou evento — quem compra antes paga menos.',
    href: '/admin/pricing-events',
    icon: Calendar,
    group: 'comercial',
    keywords: ['lote', 'evento', 'preco', 'desconto progressivo'],
  },
  {
    title: 'PROUNI / FIES',
    description: 'Desconto por produto para bolsistas e análise das solicitações com comprovantes.',
    href: '/admin/prouni',
    icon: GraduationCap,
    group: 'comercial',
    keywords: ['prouni', 'fies', 'bolsa', 'bolsista', 'comprovante'],
  },
  {
    title: 'Doações Pix',
    description: 'Aprovar doações pendentes, editar ranking e configurar a exibição nos interstitials.',
    href: '/admin/doacoes',
    icon: HeartHandshake,
    group: 'comercial',
    keywords: ['doacao', 'pix', 'apoio', 'ranking'],
  },
  {
    title: 'Rifas & Sorteios',
    description: 'Criar rifas, vender números via Mercado Pago e sortear ao vivo.',
    href: '/admin/rifas',
    icon: Ticket,
    group: 'comercial',
    keywords: ['rifa', 'sorteio', 'numero', 'premio', 'mercado pago'],
    atalhos: [{ label: 'Nova rifa', href: '/admin/rifas/new' }],
  },
  {
    title: 'Serial Keys',
    description: 'Gerar e gerenciar chaves de ativação Trial, Plus+ e personalizadas.',
    href: '/admin/keys',
    icon: Key,
    group: 'comercial',
    keywords: ['key', 'chave', 'serial', 'ativacao', 'licenca', 'plus'],
  },
  {
    title: 'Captura de Leads',
    description: 'Páginas de captura com material gratuito, com e-mails e sequências.',
    href: '/admin/leads',
    icon: Target,
    group: 'comercial',
    keywords: ['lead', 'captura', 'isca', 'email marketing', 'funil'],
    atalhos: [{ label: 'Novo lead', href: '/admin/leads/new' }],
  },

  // ── Pessoas & Comunidade ─────────────────────────────────────────────
  {
    title: 'Usuários',
    description: 'Contas, permissões, status, compras e sessões de cada pessoa.',
    href: '/admin/users',
    icon: Users,
    group: 'pessoas',
    keywords: ['usuario', 'aluno', 'conta', 'banir', 'permissao', 'sessao'],
  },
  {
    title: 'Cargos',
    description: 'Cargos da plataforma: o que cada um abre, se é pago e como aparece.',
    href: '/admin/cargos',
    icon: ShieldCheck,
    group: 'pessoas',
    keywords: ['cargo', 'role', 'monitor', 'permissao', 'acesso'],
  },
  {
    title: 'Equipe',
    description: 'Integrantes exibidos na landing page, com foto, cargo e ordenação.',
    href: '/admin/equipe',
    icon: Users2,
    group: 'pessoas',
    keywords: ['equipe', 'time', 'sobre', 'landing', 'integrante'],
  },
  {
    title: 'Tickets & Suporte',
    description: 'Fila de atendimento: responder, priorizar e encerrar chamados dos usuários.',
    href: '/admin/tickets',
    icon: LifeBuoy,
    group: 'pessoas',
    keywords: ['ticket', 'tickets', 'suporte', 'chamado', 'atendimento', 'ajuda', 'chat'],
  },
  {
    title: 'Enviar E-mails',
    description: 'Disparos em massa, templates prontos, rascunhos e agendamentos.',
    href: '/admin/emails',
    icon: Mail,
    group: 'pessoas',
    keywords: ['email', 'e-mail', 'campanha', 'disparo', 'template', 'newsletter'],
  },
  {
    title: 'Pesquisas e Formulários',
    description: 'Formulários de inscrição, pesquisas e feedbacks, com as respostas.',
    href: '/admin/forms',
    icon: ClipboardList,
    group: 'pessoas',
    keywords: ['formulario', 'pesquisa', 'enquete', 'feedback', 'resposta'],
  },
  {
    title: 'Avaliações',
    description: 'Moderar avaliações de materiais e decks, criar manuais e travar por item.',
    href: '/admin/avaliacoes',
    icon: Star,
    group: 'pessoas',
    keywords: ['avaliacao', 'review', 'nota', 'estrela', 'comentario'],
  },
  {
    title: 'Depoimentos',
    description: 'Vídeos de depoimentos de alunos exibidos na landing page.',
    href: '/admin/depoimentos',
    icon: MessageSquareQuote,
    group: 'pessoas',
    keywords: ['depoimento', 'testimonial', 'video', 'landing'],
  },

  // ── Operação & Sistema ───────────────────────────────────────────────
  {
    title: 'Estatísticas',
    description: 'Visão geral da plataforma: usuários, provas, conteúdo e quem está online.',
    href: '/admin/stats',
    icon: BarChart3,
    group: 'operacao',
    keywords: ['estatistica', 'stats', 'metrica', 'relatorio', 'online', 'dashboard'],
  },
  {
    title: 'Proctoring ao Vivo',
    description: 'Monitorar câmera, áudio e tela de quem está fazendo prova neste momento.',
    href: '/admin/proctoring',
    icon: Video,
    group: 'operacao',
    keywords: ['proctoring', 'fiscalizacao', 'camera', 'monitoramento', 'ao vivo', 'cola'],
  },
  {
    title: 'Anúncios',
    description: 'Banners e anúncios rotativos exibidos dentro da plataforma.',
    href: '/admin/anuncios',
    icon: Megaphone,
    group: 'operacao',
    keywords: ['anuncio', 'banner', 'aviso', 'propaganda'],
  },
  {
    title: 'Configurações',
    description: 'Landing page, planos, métodos de pagamento, menu lateral e trava de segurança.',
    href: '/admin/settings',
    icon: SlidersHorizontal,
    group: 'operacao',
    keywords: ['configuracao', 'ajuste', 'settings', 'seguranca', 'plano', 'pagamento', 'menu'],
  },
]

/** Remove acento e caixa para a busca casar "musica" com "Música". */
export function normalizarTermo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Texto onde a busca procura: título, descrição, grupo, sinônimos e atalhos. */
function indiceDaSecao(secao: AdminSection): string {
  const grupo = ADMIN_GROUPS.find((g) => g.key === secao.group)
  return normalizarTermo(
    [
      secao.title,
      secao.description,
      grupo?.label ?? '',
      ...(secao.keywords ?? []),
      ...(secao.atalhos ?? []).map((a) => a.label),
    ].join(' '),
  )
}

/**
 * Busca por palavras soltas: "import quest" acha "Banco de Questões".
 * Todos os termos precisam aparecer, em qualquer ordem.
 */
export function buscarSecoesAdmin(
  termo: string,
  secoes: AdminSection[] = ADMIN_SECTIONS,
): AdminSection[] {
  const termos = normalizarTermo(termo).split(/\s+/).filter(Boolean)
  if (termos.length === 0) return secoes

  const pontuadas = secoes
    .map((secao) => {
      const indice = indiceDaSecao(secao)
      if (!termos.every((t) => indice.includes(t))) return null
      const titulo = normalizarTermo(secao.title)
      // Casar no título vale mais que casar na descrição: quem digita "prova"
      // quer a seção Provas em primeiro, não "Importar provas do banco".
      const peso = termos.reduce((soma, t) => {
        if (titulo.startsWith(t)) return soma + 3
        if (titulo.includes(t)) return soma + 2
        return soma
      }, 0)
      return { secao, peso }
    })
    .filter((item): item is { secao: AdminSection; peso: number } => item !== null)

  return pontuadas.sort((a, b) => b.peso - a.peso).map((item) => item.secao)
}

/** Atalhos internos que casam com o termo, para aparecerem como destino próprio. */
export function buscarAtalhosAdmin(
  termo: string,
): Array<{ secao: AdminSection; atalho: AdminShortcut }> {
  const termos = normalizarTermo(termo).split(/\s+/).filter(Boolean)
  if (termos.length === 0) return []

  const achados: Array<{ secao: AdminSection; atalho: AdminShortcut }> = []
  for (const secao of ADMIN_SECTIONS) {
    for (const atalho of secao.atalhos ?? []) {
      const indice = normalizarTermo(`${atalho.label} ${secao.title}`)
      if (termos.every((t) => indice.includes(t))) achados.push({ secao, atalho })
    }
  }
  return achados
}

export function secoesDoGrupo(grupo: AdminGroupKey): AdminSection[] {
  return ADMIN_SECTIONS.filter((secao) => secao.group === grupo)
}

export function grupoPorChave(chave: AdminGroupKey): AdminGroup | undefined {
  return ADMIN_GROUPS.find((grupo) => grupo.key === chave)
}

/**
 * Seção correspondente a uma rota. Usa o prefixo mais longo para que
 * `/admin/banco-questoes/questoes` seja creditado ao Banco de Questões.
 */
export function secaoPorRota(pathname: string): AdminSection | undefined {
  let melhor: AdminSection | undefined
  for (const secao of ADMIN_SECTIONS) {
    const base = secao.href.split('?')[0]
    if (pathname === base || pathname.startsWith(`${base}/`)) {
      if (!melhor || base.length > melhor.href.split('?')[0].length) melhor = secao
    }
  }
  return melhor
}

// ── Memória local: favoritos e recentes ────────────────────────────────
// Ficam no navegador de propósito. É preferência de atalho, não dado de
// negócio: não vale uma coleção no banco nem uma chamada extra por página.

export const ADMIN_FAVORITOS_KEY = 'gradex:admin:favoritos'
export const ADMIN_RECENTES_KEY = 'gradex:admin:recentes'
const MAX_RECENTES = 6

function lerLista(chave: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const bruto = window.localStorage.getItem(chave)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function gravarLista(chave: string, lista: string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(chave, JSON.stringify(lista))
  } catch {
    // Navegador sem storage (aba anônima travada, cota cheia): o painel
    // continua inteiro, só sem a memória de atalhos.
  }
}

export function lerFavoritosAdmin(): string[] {
  return lerLista(ADMIN_FAVORITOS_KEY)
}

export function alternarFavoritoAdmin(href: string): string[] {
  const atuais = lerFavoritosAdmin()
  const proximos = atuais.includes(href)
    ? atuais.filter((item) => item !== href)
    : [...atuais, href]
  gravarLista(ADMIN_FAVORITOS_KEY, proximos)
  return proximos
}

export function lerRecentesAdmin(): string[] {
  return lerLista(ADMIN_RECENTES_KEY)
}

/** Registra a visita a uma rota do painel, mantendo a mais recente na frente. */
export function registrarVisitaAdmin(pathname: string): string[] {
  const secao = secaoPorRota(pathname)
  if (!secao) return lerRecentesAdmin()
  const atuais = lerRecentesAdmin().filter((href) => href !== secao.href)
  const proximos = [secao.href, ...atuais].slice(0, MAX_RECENTES)
  gravarLista(ADMIN_RECENTES_KEY, proximos)
  return proximos
}

/** Resolve uma lista de hrefs guardados em seções, ignorando o que sumiu. */
export function secoesPorHrefs(hrefs: string[]): AdminSection[] {
  return hrefs
    .map((href) => ADMIN_SECTIONS.find((secao) => secao.href === href))
    .filter((secao): secao is AdminSection => Boolean(secao))
}
