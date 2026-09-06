/**
 * ═══════════════════════════════════════════════════════════════
 *  De caminho de URL para "o que a pessoa está fazendo"
 * ───────────────────────────────────────────────────────────────
 *  Função pura, sem banco e sem rede: recebe o caminho gravado no
 *  carimbo de presença (`sessions.lastPath`) e devolve a frase que o
 *  admin lê na tela.
 *
 *  Por que caminho, e não eventos de rastreamento: `trackView` só é
 *  chamado em quatro telas, então ele responderia "está no site" para
 *  a maior parte das pessoas. O caminho, ao contrário, existe em TODA
 *  requisição — e vem de carona num carimbo que já ia acontecer.
 *
 *  As regras são avaliadas em ordem, da mais específica para a mais
 *  genérica. Cair na última (`/algo-novo`) devolve "Em /algo-novo" em
 *  vez de mentir: rota nova aparece como rota nova até alguém
 *  descrevê-la aqui.
 * ═══════════════════════════════════════════════════════════════
 */

export interface Atividade {
  /** Módulo do site — usado para agrupar o resumo por área. */
  area: string
  /** O que a pessoa está fazendo, em português de gente. */
  label: string
}

interface Regra {
  test: RegExp
  area: string
  label: string
}

/** Um segmento de id/slug qualquer. */
const SEG = '[^/]+'

const REGRAS: Regra[] = [
  // ── Provas ────────────────────────────────────────────────────
  { test: new RegExp(`^/exam/${SEG}/results$`), area: 'Provas', label: 'Vendo o resultado da prova' },
  { test: new RegExp(`^/exam/${SEG}/user/`), area: 'Provas', label: 'Corrigindo a prova de um aluno' },
  { test: new RegExp(`^/exam/${SEG}`), area: 'Provas', label: 'Fazendo prova' },
  { test: /^\/exams\/create-personal/, area: 'Provas', label: 'Montando uma prova própria' },
  { test: new RegExp(`^/exams/personal/${SEG}/generate-questions`), area: 'Provas', label: 'Gerando questões com IA' },
  { test: /^\/provas/, area: 'Provas', label: 'Escolhendo uma prova' },

  // ── Materiais (inclusive o visualizador de PDF) ───────────────
  { test: new RegExp(`^/materiais/${SEG}/viewer`), area: 'Materiais', label: 'Lendo um PDF' },
  { test: new RegExp(`^/materiais/${SEG}/complementary/`), area: 'Materiais', label: 'Num material complementar' },
  { test: new RegExp(`^/materiais/${SEG}/html`), area: 'Materiais', label: 'Lendo um material' },
  { test: /^\/materiais\/checkout/, area: 'Materiais', label: 'No checkout de materiais' },
  { test: new RegExp(`^/materiais/${SEG}`), area: 'Materiais', label: 'Vendo a página de um material' },
  { test: /^\/materiais/, area: 'Materiais', label: 'Navegando pelos materiais' },
  { test: new RegExp(`^/pacotes/${SEG}`), area: 'Materiais', label: 'Vendo um pacote' },

  // ── Banco de Questões ─────────────────────────────────────────
  { test: new RegExp(`^/banco-questoes/listas/${SEG}`), area: 'Banco de Questões', label: 'Resolvendo uma lista' },
  { test: /^\/banco-questoes\/listas/, area: 'Banco de Questões', label: 'Nas listas do banco' },
  { test: /^\/banco-questoes\/historico/, area: 'Banco de Questões', label: 'Vendo o histórico do banco' },
  { test: new RegExp(`^/banco-questoes/${SEG}`), area: 'Banco de Questões', label: 'Resolvendo questões' },
  { test: /^\/banco-questoes/, area: 'Banco de Questões', label: 'No Banco de Questões' },

  // ── Flashcards ────────────────────────────────────────────────
  { test: new RegExp(`^/flashcards/d/${SEG}/editar`), area: 'Flashcards', label: 'Editando um baralho' },
  { test: new RegExp(`^/flashcards/d/${SEG}`), area: 'Flashcards', label: 'Revisando flashcards' },
  { test: /^\/flashcards\/ia/, area: 'Flashcards', label: 'Gerando flashcards com IA' },
  { test: /^\/flashcards/, area: 'Flashcards', label: 'Nos flashcards' },

  // ── Manual Clínico ────────────────────────────────────────────
  { test: /^\/manual-clinico\/histologia\/histopatologia\/atlas/, area: 'Histopatologia', label: 'No atlas de Histopatologia' },
  { test: /^\/manual-clinico\/histologia\/histopatologia/, area: 'Histopatologia', label: 'Na Histopatologia' },
  { test: new RegExp(`^/manual-clinico/histologia/quizzes/${SEG}`), area: 'Histologia', label: 'Fazendo um quiz de Histologia' },
  { test: /^\/manual-clinico\/histologia\/quizzes/, area: 'Histologia', label: 'Escolhendo um quiz de Histologia' },
  { test: /^\/manual-clinico\/histologia\/laboratorio/, area: 'Histologia', label: 'No laboratório de Histologia' },
  { test: /^\/manual-clinico\/histologia\/atlas/, area: 'Histologia', label: 'No atlas de Histologia' },
  { test: /^\/manual-clinico\/histologia\/caderno/, area: 'Histologia', label: 'No caderno de Histologia' },
  { test: /^\/manual-clinico\/histologia/, area: 'Histologia', label: 'No Manual de Histologia' },

  { test: /^\/manual-clinico\/radiologia\/tomografia/, area: 'Radiologia', label: 'Numa série de tomografia' },
  { test: /^\/manual-clinico\/radiologia\/raio-x\/quiz/, area: 'Radiologia', label: 'Num quiz de Raio-X' },
  { test: /^\/manual-clinico\/radiologia\/raio-x\/casos/, area: 'Radiologia', label: 'Num caso de Raio-X' },
  { test: /^\/manual-clinico\/radiologia\/raio-x/, area: 'Radiologia', label: 'No atlas de Raio-X' },
  { test: /^\/manual-clinico\/radiologia\/pranchas/, area: 'Radiologia', label: 'Nas pranchas de Radiologia' },
  { test: /^\/manual-clinico\/radiologia/, area: 'Radiologia', label: 'No Manual de Radiologia' },

  { test: new RegExp(`^/manual-clinico/farmacologia/${SEG}`), area: 'Farmacologia', label: 'Estudando um fármaco' },
  { test: /^\/manual-clinico\/farmacologia/, area: 'Farmacologia', label: 'Na Farmacologia' },
  { test: /^\/manual-clinico\/exames-laboratoriais/, area: 'Exames laboratoriais', label: 'Nos exames laboratoriais' },
  { test: /^\/manual-clinico\/eletrocardiograma/, area: 'Manual Clínico', label: 'No Eletrocardiograma' },
  { test: /^\/manual-clinico\/ferramentas/, area: 'Manual Clínico', label: 'Nas ferramentas clínicas' },
  { test: /^\/manual-clinico\/checkout/, area: 'Manual Clínico', label: 'No checkout do Manual' },
  { test: new RegExp(`^/manual-clinico/${SEG}`), area: 'Manual Clínico', label: 'Lendo um capítulo do Manual' },
  { test: /^\/manual-clinico/, area: 'Manual Clínico', label: 'No Manual Clínico' },

  // ── Anatomia ──────────────────────────────────────────────────
  { test: /^\/anatomia\/atlas-anatomia\/quiz/, area: 'Anatomia', label: 'Num quiz de Anatomia' },
  { test: /^\/anatomia\/atlas-anatomia/, area: 'Anatomia', label: 'No atlas de Anatomia' },
  { test: /^\/anatomia\/anatomia-3d/, area: 'Anatomia', label: 'Na Anatomia 3D' },
  { test: /^\/anatomia/, area: 'Anatomia', label: 'Em Domine Anatomia' },

  // ── Aulas ─────────────────────────────────────────────────────
  { test: /^\/aulas\/curso\//, area: 'Aulas', label: 'Dentro de um curso' },
  { test: /^\/aulas\/trilhas/, area: 'Aulas', label: 'Numa trilha de aulas' },
  { test: /^\/aulas\/gerenciar/, area: 'Aulas', label: 'Gerenciando aulas' },
  { test: /^\/aulas\/anotacoes/, area: 'Aulas', label: 'Nas anotações das aulas' },
  { test: /^\/aulas\/revisar/, area: 'Aulas', label: 'Revisando aulas' },
  { test: /^\/aulas\/(buscar|explorar)/, area: 'Aulas', label: 'Explorando o catálogo de aulas' },
  { test: /^\/aulas\/voce/, area: 'Aulas', label: 'Vendo o próprio progresso nas aulas' },
  { test: /^\/aulas\/certificado/, area: 'Aulas', label: 'Num certificado' },
  { test: new RegExp(`^/aulas/${SEG}`), area: 'Aulas', label: 'Assistindo uma aula' },
  { test: /^\/aulas/, area: 'Aulas', label: 'Nas aulas' },

  // ── Estudo dirigido ───────────────────────────────────────────
  { test: /^\/cronogramas\/criar/, area: 'Cronogramas', label: 'Criando um cronograma' },
  { test: new RegExp(`^/cronogramas/${SEG}`), area: 'Cronogramas', label: 'Seguindo um cronograma' },
  { test: /^\/cronogramas/, area: 'Cronogramas', label: 'Nos cronogramas' },
  { test: new RegExp(`^/mapa-mental/${SEG}`), area: 'Mapas mentais', label: 'Num mapa mental' },
  { test: /^\/mapa-mental/, area: 'Mapas mentais', label: 'Nos mapas mentais' },
  { test: /^\/apg/, area: 'APGs', label: 'Nas APGs' },

  // ── Comunidade e jogos ────────────────────────────────────────
  { test: /^\/forum\/new/, area: 'Fórum', label: 'Escrevendo no fórum' },
  { test: new RegExp(`^/forum/post/${SEG}/edit`), area: 'Fórum', label: 'Editando um post' },
  { test: /^\/forum\/post/, area: 'Fórum', label: 'Lendo um post do fórum' },
  { test: /^\/forum/, area: 'Fórum', label: 'No fórum' },
  { test: /^\/games\/crossword/, area: 'Jogos', label: 'Jogando palavras cruzadas' },
  { test: /^\/games\/hangman/, area: 'Jogos', label: 'Jogando forca' },
  { test: /^\/games\/error-hunt/, area: 'Jogos', label: 'Jogando caça-erros' },
  { test: /^\/games/, area: 'Jogos', label: 'Nos jogos' },
  { test: /^\/equipe/, area: 'Equipe', label: 'Na área da equipe' },

  // ── Conta, compra e institucional ─────────────────────────────
  { test: /^\/admin/, area: 'Administração', label: 'No painel de administração' },
  { test: /^\/dashboard/, area: 'Início', label: 'No painel inicial' },
  { test: /^\/profile/, area: 'Conta', label: 'No perfil' },
  { test: /^\/(buy|comprar|compra)/, area: 'Compra', label: 'Numa página de compra' },
  { test: /^\/loja/, area: 'Compra', label: 'Na loja' },
  { test: /^\/ativar/, area: 'Compra', label: 'Ativando uma chave' },
  { test: /^\/rifas/, area: 'Rifas', label: 'Nas rifas' },
  { test: /^\/prouni-fies/, area: 'ProUni e FIES', label: 'No ProUni e FIES' },
  { test: new RegExp(`^/forms/${SEG}`), area: 'Formulários', label: 'Respondendo um formulário' },
  { test: /^\/auth/, area: 'Conta', label: 'Entrando na conta' },
  { test: /^\/instalar/, area: 'Conta', label: 'Instalando o aplicativo' },
  { test: /^\/(politica-de-privacidade|termos-de-servico)/, area: 'Institucional', label: 'Lendo os termos' },
  { test: /^\/offline/, area: 'Institucional', label: 'Sem conexão' },
  { test: /^\/(amostra|lead|previa-landing|prescricao-real-no-sus|ecorj-ebook|ldpg-mnclinico)/, area: 'Institucional', label: 'Numa página de divulgação' },
  { test: /^\/$/, area: 'Início', label: 'Na página inicial' },
]

/** Quando nem o caminho é conhecido — sessão antiga, carimbo anterior a isto. */
export const ATIVIDADE_DESCONHECIDA: Atividade = {
  area: 'Plataforma',
  label: 'Navegando pela plataforma',
}

/**
 * Descreve o que a pessoa está fazendo a partir do caminho da página.
 *
 * Aceita caminho ou URL completa (o carimbo pode vir do cabeçalho
 * `referer`, que é absoluto) e ignora query string e âncora.
 */
export function descreverAtividade(path?: string | null): Atividade {
  const caminho = normalizarCaminho(path)
  if (!caminho) return ATIVIDADE_DESCONHECIDA

  for (const regra of REGRAS) {
    if (regra.test.test(caminho)) return { area: regra.area, label: regra.label }
  }

  // Rota que ninguém descreveu ainda: mostra o caminho cru em vez de
  // inventar um rótulo genérico que esconderia a novidade do admin.
  return { area: 'Plataforma', label: `Em ${caminho}` }
}

/** Deixa o caminho na forma canônica: só o pathname, sem barra final. */
export function normalizarCaminho(value?: string | null): string {
  if (!value) return ''
  let caminho = value.trim()
  if (!caminho) return ''

  if (caminho.includes('://')) {
    try {
      caminho = new URL(caminho).pathname
    } catch {
      return ''
    }
  }

  caminho = caminho.split('?')[0].split('#')[0]
  if (!caminho.startsWith('/')) return ''
  if (caminho.length > 1 && caminho.endsWith('/')) caminho = caminho.slice(0, -1)
  // Teto defensivo: o valor vem de cabeçalho, então é entrada de fora.
  return caminho.slice(0, 300)
}

/**
 * Extrai o id do material quando o caminho é de material/visualizador.
 *
 * Serve para a lista do admin trocar "Lendo um PDF" por "Lendo um PDF:
 * Resumão de Farmacologia" com uma única consulta para todo mundo online.
 */
export function idDoMaterialNoCaminho(path?: string | null): string | null {
  const caminho = normalizarCaminho(path)
  const match = /^\/materiais\/([a-fA-F0-9]{24})(\/|$)/.exec(caminho)
  return match ? match[1] : null
}
