import { CATEGORIAS } from '../ferramentas-clinicas/categorias'
import {
  SIDEBAR_SECTION_DEFINITIONS,
  normalizeSidebarSections,
  type SidebarSectionKey,
  type SidebarSectionSettings,
} from '../sidebar-sections'
import type { ItemBusca } from './tipos'

/**
 * Catálogo estático da busca global: tudo o que existe na plataforma e não vem
 * do banco — áreas, páginas, ferramentas, ajustes de conta, painel do admin e
 * as ações que a busca sabe executar.
 *
 * Duas regras que este arquivo segue de propósito:
 *
 *  1. As ÁREAS não são escritas à mão. Elas nascem de `SIDEBAR_SECTION_DEFINITIONS`,
 *     a mesma fonte do menu lateral e do carrossel da dashboard. Uma área nova
 *     aparece na busca sem que ninguém precise lembrar de vir aqui — e uma área
 *     desligada pelo admin some das três superfícies ao mesmo tempo.
 *
 *  2. Cada item carrega `palavrasChave` com o nome que o usuário usaria de
 *     cabeça, incluindo sigla, erro comum e sinônimo ("prova", "simulado",
 *     "teste"). É o que separa uma busca que entende de uma que só compara
 *     strings: ninguém digita "Banco de Questões" inteiro.
 */

/** Sinônimos e apelidos por área. O rótulo e a descrição já vêm das definições. */
const CHAVES_DA_AREA: Record<SidebarSectionKey, string[]> = {
  provas: ['prova', 'provas', 'simulado', 'simulados', 'teste', 'avaliacao', 'exame', 'gabarito'],
  bancoQuestoes: ['banco', 'questoes', 'bq', 'questao', 'exercicios', 'treino', 'resolver'],
  aulas: ['aula', 'aulas', 'video', 'videoaula', 'gravada', 'ao vivo', 'live', 'assistir'],
  flashcards: ['flashcard', 'flash card', 'cards', 'anki', 'revisao espacada', 'deck', 'decks'],
  mapaMental: ['mapa mental', 'mapas mentais', 'mindmap', 'esquema', 'diagrama'],
  cronogramas: ['cronograma', 'planejamento', 'agenda', 'plano de estudo', 'calendario', 'rotina'],
  forum: ['forum', 'duvida', 'duvidas', 'discussao', 'comunidade', 'perguntas'],
  games: ['games', 'jogo', 'jogos', 'gamificacao', 'brincar', 'quiz'],
  manualClinico: ['manual clinico', 'patologia', 'patologias', 'doenca', 'doencas', 'cid', 'cid10', 'clinica'],
  ferramentasClinicas: ['calculadora', 'calculadoras', 'escore', 'escores', 'score', 'ferramenta', 'gasometria', 'sepse'],
  farmacologia: ['farmaco', 'farmacos', 'remedio', 'medicamento', 'medicamentos', 'dose', 'posologia', 'bula'],
  anatomia3d: ['anatomia', 'anatomico', '3d', 'atlas', 'corpo humano', 'osso', 'musculo'],
  manualExames: ['exame', 'exames', 'laboratorio', 'laboratorial', 'hemograma', 'creatinina', 'tgo', 'tgp', 'referencia'],
  manualHistologia: ['histologia', 'lamina', 'laminas', 'microscopio', 'tecido', 'tecidos', 'he'],
  manualRadiologia: ['radiologia', 'raio x', 'raiox', 'rx', 'tomografia', 'tc', 'imagem', 'laudo'],
  manualEletro: ['ecg', 'eletrocardiograma', 'eletro', 'ekg', 'ritmo', 'derivacoes', 'arritmia'],
  materiais: ['material', 'materiais', 'apostila', 'resumo', 'pdf', 'ebook', 'biblioteca', 'livro'],
  rifas: ['rifa', 'rifas', 'sorteio', 'sorteios', 'premio', 'numero da sorte'],
}

/** Ícone de cada área quando o admin não escolheu outro. */
const ICONE_DA_AREA: Record<SidebarSectionKey, string> = {
  provas: 'file-text',
  bancoQuestoes: 'database',
  aulas: 'video',
  flashcards: 'brain',
  mapaMental: 'network',
  cronogramas: 'book-marked',
  forum: 'message-circle',
  games: 'gamepad-2',
  manualClinico: 'heart-pulse',
  ferramentasClinicas: 'calculator',
  farmacologia: 'pill',
  anatomia3d: 'person-standing',
  manualExames: 'flask-conical',
  manualHistologia: 'microscope',
  manualRadiologia: 'scan-line',
  manualEletro: 'activity',
  materiais: 'book-open',
  rifas: 'ticket',
}

/**
 * Área "dona" de cada seção, para o filtro de acesso. As seções que nascem
 * desligadas (`defaultEnabled: false`) são atalhos que o admin pode promover no
 * menu — desligadas elas não somem da plataforma, então a busca continua
 * levando até elas pela área que as contém.
 */
const AREA_MAE: Partial<Record<SidebarSectionKey, SidebarSectionKey>> = {
  ferramentasClinicas: 'manualClinico',
  farmacologia: 'manualClinico',
  manualExames: 'manualClinico',
  manualHistologia: 'manualClinico',
  manualRadiologia: 'manualClinico',
  manualEletro: 'manualClinico',
}

const AREAS: ItemBusca[] = SIDEBAR_SECTION_DEFINITIONS.map(secao => ({
  id: `area:${secao.key}`,
  titulo: secao.label,
  subtitulo: secao.description,
  trilha: 'Áreas da plataforma',
  palavrasChave: CHAVES_DA_AREA[secao.key],
  prioridade: secao.defaultEnabled ? 10 : 8,
  grupo: 'area',
  href: secao.href,
  icone: ICONE_DA_AREA[secao.key],
  secao: secao.key,
}))

/** Uma entrada por família de calculadoras — as 201 ferramentas em si são
 *  pesadas e ficam com a busca do servidor, que não cobra download do celular. */
const FERRAMENTAS: ItemBusca[] = CATEGORIAS.map(categoria => ({
  id: `ferramenta:${categoria.id}`,
  titulo: categoria.nome,
  subtitulo: `${categoria.total} calculadoras — ${categoria.subtitulo}`,
  trilha: 'Manual Clínico › Ferramentas Clínicas',
  palavrasChave: ['calculadora', 'escore', 'score', 'ferramenta', categoria.id],
  prioridade: 6,
  grupo: 'ferramenta',
  href: `/manual-clinico/ferramentas/${categoria.id}`,
  icone: 'calculator',
  etiqueta: 'Calculadoras',
  secao: 'manualClinico',
}))

/** Atalho curto para declarar as páginas sem repetir campo por campo. */
function pagina(
  id: string,
  titulo: string,
  href: string,
  trilha: string,
  icone: string,
  palavrasChave: string[],
  extras: Partial<ItemBusca> = {},
): ItemBusca {
  return {
    id: `pagina:${id}`,
    titulo,
    href,
    trilha,
    icone,
    palavrasChave,
    grupo: 'pagina',
    prioridade: 5,
    ...extras,
  }
}

const PAGINAS: ItemBusca[] = [
  pagina('dashboard', 'Início', '/dashboard', 'Plataforma', 'home',
    ['inicio', 'home', 'dashboard', 'painel', 'principal'], { prioridade: 9 }),

  // ── Provas ────────────────────────────────────────────────────────────
  pagina('prova-pessoal', 'Criar prova pessoal', '/exams/create-personal', 'Provas', 'file-check',
    ['criar prova', 'nova prova', 'prova pessoal', 'montar prova', 'simulado proprio'],
    { subtitulo: 'Monte uma prova sua, com as questões que quiser.', secao: 'provas', prioridade: 7 }),

  // ── Banco de Questões ─────────────────────────────────────────────────
  pagina('banco-historico', 'Histórico de questões', '/banco-questoes/historico', 'Banco de Questões', 'clock',
    ['historico', 'respondidas', 'desempenho', 'erros', 'acertos', 'resolucoes'],
    { subtitulo: 'Tudo o que você já respondeu, com acertos e erros.', secao: 'bancoQuestoes' }),
  pagina('banco-listas', 'Minhas listas de questões', '/banco-questoes/listas', 'Banco de Questões', 'list-checks',
    ['listas', 'lista de questoes', 'caderno', 'separadas', 'salvas'],
    { subtitulo: 'Listas montadas por você ou geradas aleatoriamente.', secao: 'bancoQuestoes' }),

  // ── Flashcards ────────────────────────────────────────────────────────
  pagina('flashcards-ia', 'Flashcards com IA', '/flashcards/ia', 'Flashcards', 'sparkles',
    ['ia', 'inteligencia artificial', 'gerar flashcards', 'automatico', 'criar cards'],
    { subtitulo: 'Gere cartões automaticamente a partir do seu material.', secao: 'flashcards', prioridade: 6 }),

  // ── Cronogramas ───────────────────────────────────────────────────────
  pagina('cronograma-criar', 'Criar cronograma', '/cronogramas/criar', 'Cronogramas', 'calendar-days',
    ['novo cronograma', 'criar cronograma', 'planejar', 'montar plano'],
    { subtitulo: 'Monte um plano de estudo por período, tempo e dificuldade.', secao: 'cronogramas', prioridade: 6 }),

  // ── Fórum ─────────────────────────────────────────────────────────────
  pagina('forum-novo', 'Nova publicação no fórum', '/forum/new', 'Fórum', 'pencil',
    ['postar', 'publicar', 'perguntar', 'tirar duvida', 'novo topico'],
    { subtitulo: 'Publique uma dúvida ou um material para a comunidade.', secao: 'forum' }),

  // ── Games ─────────────────────────────────────────────────────────────
  pagina('game-cruzadas', 'Palavras cruzadas', '/games/crossword', 'Games', 'puzzle',
    ['cruzadas', 'palavras cruzadas', 'crossword', 'cruzadinha'], { secao: 'games' }),
  pagina('game-forca', 'Jogo da forca', '/games/hangman', 'Games', 'gamepad-2',
    ['forca', 'hangman', 'adivinhar palavra'], { secao: 'games' }),
  pagina('game-caca-erro', 'Caça ao erro', '/games/error-hunt', 'Games', 'crosshair',
    ['caca ao erro', 'error hunt', 'achar erro', 'corrigir'], { secao: 'games' }),

  // ── Histologia ────────────────────────────────────────────────────────
  // As áreas em si (Ferramentas, Farmacologia, ECG, Histologia, Radiologia,
  // Anatomia) não são repetidas aqui: já entram por `SIDEBAR_SECTION_DEFINITIONS`
  // com o mesmo destino. O que segue são as páginas INTERNAS de cada uma.
  pagina('histologia-atlas', 'Atlas de lâminas', '/manual-clinico/histologia/atlas', 'Histologia', 'microscope',
    ['atlas', 'laminas', 'acervo', 'ver laminas'], { secao: 'manualClinico' }),
  pagina('histologia-caderno', 'Caderno de histologia', '/manual-clinico/histologia/caderno', 'Histologia', 'book-marked',
    ['caderno', 'anotacoes', 'progresso', 'estudo dirigido'], { secao: 'manualClinico' }),
  pagina('histologia-laboratorio', 'Laboratório de histologia', '/manual-clinico/histologia/laboratorio', 'Histologia', 'flask-conical',
    ['laboratorio', 'pratica', 'modulos', 'roteiro'], { secao: 'manualClinico' }),
  pagina('histologia-quizzes', 'Quizzes de histologia', '/manual-clinico/histologia/quizzes', 'Histologia', 'list-checks',
    ['quiz', 'quizzes', 'identificar lamina', 'teste'], { secao: 'manualClinico' }),
  pagina('histopatologia', 'Histopatologia', '/manual-clinico/histologia/histopatologia', 'Histologia', 'biohazard',
    ['histopatologia', 'patologia', 'doencas', 'lesao', 'anatomia patologica'],
    { subtitulo: 'Doenças por sistema, mecanismos e atlas de lâminas patológicas.', secao: 'manualClinico', prioridade: 6 }),
  pagina('histopatologia-atlas', 'Atlas de histopatologia', '/manual-clinico/histologia/histopatologia/atlas', 'Histopatologia', 'microscope',
    ['atlas', 'laminas', 'patologicas'], { secao: 'manualClinico' }),
  pagina('histopatologia-mecanismos', 'Mecanismos de lesão', '/manual-clinico/histologia/histopatologia/mecanismos', 'Histopatologia', 'dna',
    ['mecanismos', 'lesao celular', 'necrose', 'apoptose', 'inflamacao'], { secao: 'manualClinico' }),
  pagina('histopatologia-webpath', 'Acervo WebPath (Utah)', '/manual-clinico/histologia/histopatologia/webpath-utah', 'Histopatologia', 'library',
    ['webpath', 'utah', 'acervo externo', 'capitulos'], { secao: 'manualClinico' }),

  // ── Exames Laboratoriais ──────────────────────────────────────────────
  pagina('exames-marcadores', 'Marcadores laboratoriais', '/manual-clinico/exames-laboratoriais/marcadores', 'Exames Laboratoriais', 'flask-conical',
    ['marcador', 'marcadores', 'valor de referencia', 'referencia', 'hemoglobina', 'creatinina', 'tgo', 'tgp'], { secao: 'manualClinico' }),
  pagina('exames-padroes', 'Padrões laboratoriais', '/manual-clinico/exames-laboratoriais/padroes', 'Exames Laboratoriais', 'activity',
    ['padrao', 'padroes', 'hepatocelular', 'colestatico', 'hemolise', 'cetoacidose'], { secao: 'manualClinico' }),
  pagina('exames-sistemas', 'Exames por sistema', '/manual-clinico/exames-laboratoriais/sistemas', 'Exames Laboratoriais', 'stethoscope',
    ['sistema', 'sistemas', 'hepatobiliar', 'renal', 'endocrino', 'gasometria'], { secao: 'manualClinico' }),
  pagina('exames-comparar', 'Comparar diagnósticos', '/manual-clinico/exames-laboratoriais/comparar', 'Exames Laboratoriais', 'scale',
    ['comparar', 'diferenciar', 'diagnostico diferencial', 'ferropriva', 'talassemia'], { secao: 'manualClinico' }),
  pagina('exames-doencas', 'Doenças e padrão esperado', '/manual-clinico/exames-laboratoriais/doencas', 'Exames Laboratoriais', 'microscope',
    ['doenca', 'doencas', 'padrao esperado', 'anemia ferropriva', 'cirrose'], { secao: 'manualClinico' }),
  pagina('exames-laboratorio-virtual', 'Laboratório Virtual', '/manual-clinico/exames-laboratoriais/laboratorio', 'Exames Laboratoriais', 'dices',
    ['laboratorio virtual', 'gerar exame', 'praticar', 'caso', 'desafio'], { secao: 'manualClinico' }),

  // ── Radiologia ────────────────────────────────────────────────────────
  pagina('raio-x', 'Raio-X', '/manual-clinico/radiologia/raio-x', 'Radiologia', 'scan',
    ['raio x', 'raiox', 'rx', 'radiografia', 'torax'], { secao: 'manualClinico' }),
  pagina('raio-x-casos', 'Casos de Raio-X', '/manual-clinico/radiologia/raio-x/casos', 'Radiologia', 'file-search',
    ['casos', 'caso clinico', 'laudo', 'achados'], { secao: 'manualClinico' }),
  pagina('raio-x-quiz', 'Quiz de Raio-X', '/manual-clinico/radiologia/raio-x/quiz', 'Radiologia', 'target',
    ['quiz', 'teste', 'treinar imagem'], { secao: 'manualClinico' }),
  pagina('tomografia', 'Tomografia', '/manual-clinico/radiologia/tomografia', 'Radiologia', 'layers',
    ['tomografia', 'tc', 'cortes', 'axial', 'janela'], { secao: 'manualClinico' }),

  // ── Anatomia ──────────────────────────────────────────────────────────
  pagina('anatomia-3d', 'Modelos 3D', '/anatomia/anatomia-3d', 'Anatomia', 'box',
    ['3d', 'modelo', 'girar', '360', 'tridimensional']),
  pagina('anatomia-atlas', 'Atlas de anatomia', '/anatomia/atlas-anatomia', 'Anatomia', 'orbit',
    ['atlas', 'pranchas', 'marcadores', 'estruturas']),
  pagina('anatomia-quiz', 'Quiz de anatomia', '/anatomia/atlas-anatomia/quiz', 'Anatomia', 'target',
    ['quiz', 'identificacao', 'teste de anatomia']),

  // ── Materiais e loja ──────────────────────────────────────────────────
  pagina('loja', 'Loja', '/materiais?tab=loja', 'Materiais', 'store',
    ['loja', 'comprar', 'produtos', 'fisico', 'camiseta'],
    { subtitulo: 'Produtos físicos e itens da plataforma.' }),

  // ── Aulas ─────────────────────────────────────────────────────────────
  pagina('aulas-gerenciar', 'Gerenciar aulas', '/aulas/gerenciar', 'Aulas', 'folder',
    ['gerenciar', 'estrutura', 'criar aula', 'modulos'],
    { secao: 'aulas', somenteAdmin: true }),
]

const CONTA: ItemBusca[] = [
  pagina('perfil', 'Meu perfil', '/profile', 'Conta', 'user',
    ['perfil', 'conta', 'dados', 'senha', 'foto', 'editar perfil', 'estatisticas'],
    { grupo: 'conta', prioridade: 8, subtitulo: 'Seus dados, progresso e preferências.' }),
  pagina('upgrade', 'Assinar o Plus+', '/buy', 'Conta', 'shopping-cart',
    ['upgrade', 'plus', 'premium', 'assinar', 'assinatura', 'plano', 'pagar', 'preco'],
    { grupo: 'conta', prioridade: 7, subtitulo: 'Compare os planos e libere a plataforma inteira.' }),
  pagina('ativar', 'Ativar chave de acesso', '/ativar', 'Conta', 'key',
    ['ativar', 'chave', 'serial', 'codigo', 'cupom', 'resgatar'], { grupo: 'conta' }),
  pagina('instalar', 'Instalar o aplicativo', '/instalar', 'Conta', 'smartphone',
    ['instalar', 'app', 'aplicativo', 'celular', 'pwa', 'android', 'iphone'], { grupo: 'conta' }),
  pagina('equipe', 'Equipe', '/equipe', 'Institucional', 'users',
    ['equipe', 'time', 'quem somos', 'sobre'], { grupo: 'conta', prioridade: 3 }),
  pagina('termos', 'Termos de serviço', '/termos-de-servico', 'Institucional', 'scroll-text',
    ['termos', 'contrato', 'regras', 'uso'], { grupo: 'conta', prioridade: 2 }),
  pagina('privacidade', 'Política de privacidade', '/politica-de-privacidade', 'Institucional', 'shield',
    ['privacidade', 'dados', 'lgpd', 'politica'], { grupo: 'conta', prioridade: 2 }),
]

const ACOES: ItemBusca[] = [
  {
    id: 'acao:criar-prova',
    titulo: 'Criar uma prova',
    subtitulo: 'Abre o formulário de nova prova, de onde você estiver.',
    trilha: 'Ação rápida',
    palavrasChave: ['nova prova', 'criar prova', 'montar prova', 'adicionar prova'],
    prioridade: 8,
    grupo: 'acao',
    acao: 'criar-prova',
    icone: 'file-check',
  },
  {
    id: 'acao:alternar-tema',
    titulo: 'Alternar tema claro/escuro',
    subtitulo: 'Troca entre o modo claro e o escuro.',
    trilha: 'Ação rápida',
    palavrasChave: ['tema', 'escuro', 'claro', 'dark mode', 'noturno', 'aparencia'],
    prioridade: 7,
    grupo: 'acao',
    acao: 'alternar-tema',
    icone: 'moon',
  },
  {
    id: 'acao:modo-lite',
    titulo: 'Modo Lite',
    subtitulo: 'Desliga animações e efeitos pesados em aparelhos mais fracos.',
    trilha: 'Ação rápida',
    palavrasChave: ['lite', 'leve', 'desempenho', 'performance', 'travando', 'lento', 'animacoes'],
    prioridade: 7,
    grupo: 'acao',
    acao: 'modo-lite',
    icone: 'zap',
  },
  {
    id: 'acao:tour',
    titulo: 'Refazer o tour da plataforma',
    subtitulo: 'Passeio guiado pelas áreas principais.',
    trilha: 'Ação rápida',
    palavrasChave: ['tour', 'tutorial', 'ajuda', 'como usar', 'guia', 'passeio'],
    prioridade: 6,
    grupo: 'acao',
    acao: 'abrir-tour',
    icone: 'compass',
  },
  {
    id: 'acao:sair',
    titulo: 'Sair da conta',
    subtitulo: 'Encerra a sessão neste aparelho.',
    trilha: 'Ação rápida',
    palavrasChave: ['sair', 'logout', 'deslogar', 'encerrar sessao', 'trocar de conta'],
    prioridade: 4,
    grupo: 'acao',
    acao: 'sair',
    icone: 'lock',
  },
]

/** Atalho para as páginas do painel administrativo. */
function admin(id: string, titulo: string, href: string, palavrasChave: string[], icone = 'shield'): ItemBusca {
  return {
    id: `admin:${id}`,
    titulo,
    href,
    trilha: 'Painel do administrador',
    icone,
    palavrasChave: ['admin', 'painel', ...palavrasChave],
    grupo: 'admin',
    prioridade: 4,
    somenteAdmin: true,
  }
}

const ADMIN: ItemBusca[] = [
  admin('painel', 'Painel administrativo', '/admin', ['administracao', 'gerenciar'], 'shield'),
  admin('usuarios', 'Usuários', '/admin/users', ['usuarios', 'alunos', 'contas', 'banir', 'assinaturas'], 'users'),
  admin('stats', 'Estatísticas', '/admin/stats', ['estatisticas', 'numeros', 'metricas'], 'bar-chart'),
  admin('analytics', 'Analytics', '/admin/analytics', ['analytics', 'funil', 'conversao', 'trafego'], 'trending-up'),
  admin('settings', 'Configurações do site', '/admin/settings', ['configuracoes', 'ajustes', 'menu', 'secoes', 'icones', 'landing'], 'cross'),
  admin('exams', 'Provas (admin)', '/admin/exams', ['provas', 'criar prova', 'correcoes'], 'file-text'),
  admin('banco', 'Banco de questões (admin)', '/admin/banco-questoes', ['questoes', 'importar', 'hierarquia', 'relatos'], 'database'),
  admin('banco-questoes-lista', 'Questões cadastradas', '/admin/banco-questoes/questoes', ['questoes', 'editar questao'], 'database'),
  admin('banco-importar', 'Importar questões', '/admin/banco-questoes/importar', ['importar', 'txt', 'lote'], 'files'),
  admin('banco-extrair', 'Extrair questões', '/admin/banco-questoes/extrair', ['extrair', 'pdf', 'ia'], 'file-search'),
  admin('banco-hierarquia', 'Hierarquia do banco', '/admin/banco-questoes/hierarquia', ['periodos', 'modulos', 'topicos'], 'network'),
  admin('banco-relatos', 'Relatos de questões', '/admin/banco-questoes/relatos', ['relatos', 'reports', 'erros'], 'megaphone'),
  admin('aulas', 'Aulas (admin)', '/admin/aulas', ['aulas', 'videos', 'topicos'], 'video'),
  admin('materiais', 'Materiais (admin)', '/admin/materiais', ['materiais', 'pdf', 'pacotes', 'vendas'], 'book-open'),
  admin('manual-clinico', 'Manual Clínico (admin)', '/admin/manual-clinico', ['patologias', 'importar', 'cid'], 'heart-pulse'),
  admin('farmacologia', 'Farmacologia (admin)', '/admin/farmacologia', ['medicamentos', 'farmacos'], 'pill'),
  admin('flashcards', 'Flashcards (admin)', '/admin/flashcards/manual', ['decks', 'pastas', 'temas'], 'brain'),
  admin('games', 'Games (admin)', '/admin/games', ['jogos', 'cruzadas', 'forca'], 'gamepad-2'),
  admin('forum-topics', 'Tópicos do fórum', '/admin/forum-topics', ['forum', 'topicos', 'moderar'], 'message-circle'),
  admin('rifas', 'Rifas (admin)', '/admin/rifas', ['rifas', 'sorteios', 'numeros'], 'ticket'),
  admin('loja', 'Loja (admin)', '/admin/loja', ['loja', 'produtos', 'pedidos'], 'store'),
  admin('coupons', 'Cupons', '/admin/coupons', ['cupom', 'desconto', 'promocao'], 'tag'),
  admin('keys', 'Chaves de acesso', '/admin/keys', ['serial', 'chaves', 'ativacao'], 'key'),
  admin('pricing-events', 'Eventos de preço', '/admin/pricing-events', ['promocao', 'preco', 'campanha'], 'percent'),
  admin('leads', 'Leads', '/admin/leads', ['leads', 'crm', 'contatos'], 'users'),
  admin('emails', 'E-mails', '/admin/emails', ['email', 'disparo', 'campanha'], 'megaphone'),
  admin('forms', 'Formulários', '/admin/forms', ['formularios', 'respostas', 'pesquisa'], 'clipboard-list'),
  admin('tickets', 'Tickets de suporte', '/admin/tickets', ['suporte', 'chamados', 'atendimento'], 'message-circle'),
  admin('proctoring', 'Proctoring', '/admin/proctoring', ['fiscalizacao', 'camera', 'monitoramento'], 'camera'),
  admin('verificacao', 'Verificações', '/admin/verificacao', ['verificar', 'documentos', 'aprovar'], 'file-check'),
  admin('avaliacoes', 'Avaliações', '/admin/avaliacoes', ['reviews', 'notas', 'feedback'], 'star'),
  admin('depoimentos', 'Depoimentos', '/admin/depoimentos', ['depoimentos', 'testimonials'], 'smile'),
  admin('anuncios', 'Anúncios', '/admin/anuncios', ['anuncios', 'banner', 'ads'], 'megaphone'),
  admin('doacoes', 'Doações', '/admin/doacoes', ['doacoes', 'apoio'], 'coins'),
  admin('receita', 'Receita', '/admin/receita', ['receita', 'faturamento', 'financeiro', 'vendas'], 'banknote'),
  admin('equipe', 'Equipe (admin)', '/admin/equipe', ['equipe', 'time', 'membros'], 'users'),
  admin('playlists', 'Playlists de estudo', '/admin/study-playlists', ['musica', 'playlist', 'foco'], 'film'),
]

/** Catálogo completo, na ordem em que foi declarado. */
export const CATALOGO: ItemBusca[] = [...ACOES, ...AREAS, ...PAGINAS, ...FERRAMENTAS, ...CONTA, ...ADMIN]

export interface ContextoDeAcesso {
  isAdmin: boolean
  secoes?: Partial<SidebarSectionSettings> | null
}

/**
 * Filtra o catálogo pelo que a pessoa pode de fato abrir.
 *
 * Mesmo critério do menu lateral: admin enxerga tudo; para os demais, uma área
 * desligada some junto com as páginas que moram dentro dela. Levar alguém a uma
 * área desligada é pior que não encontrar nada — a página desvia de volta para
 * a dashboard e a busca parece quebrada.
 */
export function filtrarPorAcesso(itens: readonly ItemBusca[], { isAdmin, secoes }: ContextoDeAcesso): ItemBusca[] {
  const normalizadas = normalizeSidebarSections(secoes)

  return itens.filter(item => {
    if (item.somenteAdmin && !isAdmin) return false
    if (isAdmin || !item.secao) return true

    // Só as seções que nascem ligadas funcionam como interruptor de área. As
    // outras são atalhos de menu: desligá-las não fecha a página.
    const chave = AREA_MAE[item.secao] ?? item.secao
    const definicao = SIDEBAR_SECTION_DEFINITIONS.find(s => s.key === chave)
    if (!definicao?.defaultEnabled) return true

    return normalizadas[chave] !== false
  })
}
