/**
 * Para onde o Dom pode levar o aluno.
 *
 * O Dom não inventa link: ele escolhe um destino de uma lista curta que o
 * servidor montou ANTES de chamar a IA, a partir da frase do aluno, e a rota
 * confere que o escolhido estava na lista. Assim "Quero mudar a minha senha"
 * vira `/profile?campo=senha` mesmo que o modelo erre, e nenhuma resposta
 * consegue mandar alguém para fora do site.
 *
 * A busca reaproveita o catálogo e o motor da busca global
 * (`lib/busca-plataforma`), com dois ajustes para frase falada:
 *
 * - o motor exige que TODO termo case (certo para a caixa de busca, errado
 *   para "quero fazer flashcards de cardio"): aqui cada palavra significativa
 *   é ranqueada sozinha e os pontos se somam por item;
 * - o catálogo ganha os atalhos que só fazem sentido numa conversa (trocar
 *   senha, APG, ranking, suporte, comprar).
 *
 * Client-safe e sem banco: roda em microssegundos e é testável.
 */

import { CATALOGO, filtrarPorAcesso } from '@/lib/busca-plataforma/catalogo'
import { indexar, ranquear } from '@/lib/busca-plataforma/motor'
import { termosDaConsulta } from '@/lib/busca-plataforma/texto'
import type { ItemBusca } from '@/lib/busca-plataforma/tipos'
import { isPaidAccount, isPlusAccount, temAcessoAoBanco } from '@/lib/account-tier'

export interface CandidatoDeDestino {
  id: string
  titulo: string
  href: string
  /** Área paga que a pessoa ainda não tem. */
  exclusivo: boolean
  /** Uma linha para o modelo saber o que tem lá. */
  resumo?: string
}

function atalho(id: string, titulo: string, href: string, palavrasChave: string[], subtitulo: string, prioridade = 8): ItemBusca {
  return { id: `dom:${id}`, titulo, href, subtitulo, palavrasChave, prioridade, grupo: 'pagina', icone: 'sparkles' }
}

const ATALHOS_DO_DOM: ItemBusca[] = [
  atalho('senha', 'Trocar a senha', '/profile?campo=senha', ['senha', 'mudar senha', 'trocar senha', 'alterar senha', 'redefinir senha', 'esqueci senha'], 'Perfil › Configurações › Senha', 9),
  atalho('dados', 'Editar meus dados', '/profile?campo=dados', ['dados', 'nome', 'periodo', 'faculdade', 'cpf', 'telefone', 'email', 'editar perfil'], 'Perfil › Configurações'),
  atalho('foto', 'Trocar a foto do perfil', '/profile?campo=foto', ['foto', 'avatar', 'imagem do perfil', 'retrato'], 'Perfil › Foto'),
  atalho('apg', 'APGs por período', '/apg', ['apg', 'apgs', 'grupo tutorial', 'tutoria', 'objetivos de aprendizagem', 'pbl', 'problema'], 'Materiais dos grupos tutoriais (APG) organizados por período', 9),
  atalho('ranking', 'Ranking de XP', '/ranking', ['ranking', 'xp', 'liga', 'posicao', 'classificacao', 'nivel', 'pontos'], 'Sua posição, liga e o ranking da semana'),
  atalho('suporte', 'Central de ajuda e suporte', '/suporte', ['suporte', 'ajuda', 'problema', 'bug', 'erro', 'reclamacao', 'atendimento', 'reembolso', 'cancelar'], 'Fale com a equipe ou abra um ticket'),
  atalho('planos', 'Planos Plus+ e Quest+', '/buy', ['comprar', 'assinar', 'assinatura', 'plano', 'planos', 'plus', 'quest', 'preco', 'valor', 'pagar', 'desconto'], 'Compare os planos e assine', 8),
  atalho('simulado', 'Fazer um simulado', '/provas', ['simulado', 'simulados', 'prova', 'provas', 'testar conhecimento', 'avaliacao'], 'Provas e simulados da plataforma', 9),
  atalho('cronograma-faculdade', 'Cronogramas da faculdade', '/cronogramas', ['cronograma', 'cronogramas', 'calendario da faculdade', 'ementa', 'grade', 'plano de estudo'], 'Seus cronogramas e o calendário do período', 9),
  atalho('materiais-meus', 'Meus materiais', '/materiais?tab=mine', ['meus materiais', 'comprei', 'minhas compras', 'apostila comprada'], 'Os materiais que você já tem'),
  atalho('anatomia', 'Anatomia (atlas, 3D e quiz)', '/anatomia', ['anatomia', 'anatomico', 'osso', 'musculo', 'nervo', 'atlas'], 'Atlas, modelos 3D e quiz de anatomia', 9),
]

const STOPWORDS = new Set(
  'quero queria gostaria preciso precisava posso pode poderia me te leva levar levame mostra mostrar ver abrir abre ir vou vamos fazer faz fazendo estudar estudo onde fica esta como para pra pro com sem uma umas uns um o a os as de do da dos das no na nos nas em e ou que qual quais isso esse essa aqui la ai meu minha meus minhas seu sua dom oi ola por favor obrigado tem ter algum alguma sobre coisa coisas tipo tal agora hoje so mais muito bem area parte pagina site plataforma tudo td oi ola eai bom boa dia tarde noite beleza blz valeu obrigada vc voce'.split(' '),
)

let indice: ReturnType<typeof indexar<ItemBusca>> | null = null
function indiceDoDom() {
  indice ??= indexar([...ATALHOS_DO_DOM, ...CATALOGO.filter((i) => i.href && !i.acao)])
  return indice
}

export function exclusivoPara(href: string, accountType: string, isAdmin: boolean): boolean {
  if (isAdmin) return false
  if (href.startsWith('/flashcards/ia') || href.startsWith('/exams/create-personal')) return !isPaidAccount(accountType)
  if (href.startsWith('/banco-questoes')) return !temAcessoAoBanco(accountType)
  if (href.startsWith('/manual-clinico') || href.startsWith('/anatomia') || href.startsWith('/aulas')) return !isPlusAccount(accountType)
  return false
}

/** As palavras que importam numa frase falada ("quero estudar histologia" → ["histologia"]). */
export function termosSignificativos(frase: string): string[] {
  return termosDaConsulta(frase).filter((t) => t.length > 2 && !STOPWORDS.has(t))
}

/** Até `limite` destinos plausíveis para a frase, do mais provável ao menos. */
export function candidatosDeDestino(
  frase: string,
  p: { accountType: string; isAdmin: boolean; limite?: number },
): CandidatoDeDestino[] {
  const termos = termosDaConsulta(frase)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .slice(0, 8)
  if (!termos.length) return []
  // Em português o objeto do pedido vem cedo ("um SIMULADO de cardio"): a
  // primeira palavra significativa pesa mais que as seguintes.
  const consultas = termos.map((t, i) => ({ texto: t, peso: Math.max(0.5, 1 - i * 0.15) }))
  for (let i = 0; i < termos.length - 1; i++) consultas.push({ texto: `${termos[i]} ${termos[i + 1]}`, peso: 1.4 })

  const pontos = new Map<string, { item: ItemBusca; pontos: number }>()
  const base = indiceDoDom()
  for (const { texto: consulta, peso } of consultas) {
    for (const r of ranquear(base, consulta, { limite: 6 })) {
      const atual = pontos.get(r.item.id)
      pontos.set(r.item.id, { item: r.item, pontos: (atual?.pontos || 0) + Math.max(0, r.pontos) * peso })
    }
  }
  const permitidos = new Set(filtrarPorAcesso([...pontos.values()].map((v) => v.item), { isAdmin: p.isAdmin }).map((i) => i.id))
  const vistos = new Set<string>()
  return [...pontos.values()]
    .filter((v) => permitidos.has(v.item.id) && v.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .filter((v) => {
      const href = v.item.href!.split('?')[0]
      if (vistos.has(href)) return false
      vistos.add(href)
      return true
    })
    .slice(0, p.limite ?? 6)
    .map(({ item }) => ({
      id: item.id,
      titulo: item.titulo,
      href: item.href!,
      exclusivo: exclusivoPara(item.href!, p.accountType, p.isAdmin),
      resumo: item.subtitulo?.slice(0, 90),
    }))
}

/** Só aceita caminho interno (nada de `//host`, `javascript:` ou `https://`). */
export function hrefInternoSeguro(href: unknown): string | null {
  if (typeof href !== 'string') return null
  const h = href.trim()
  if (!/^\/(?!\/)[\w\-./?=&%[\]]*$/.test(h) || h.includes('..')) return null
  return h.slice(0, 200)
}
