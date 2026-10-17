/**
 * Detector de contato pessoal e de "combinar por fora" — puro, sem dependências,
 * usado no servidor (bloqueia e registra) e no navegador (filtra o que chega
 * pelo canal P2P da sala).
 *
 * ## Por que existe
 *
 * Telefone, e-mail, link ou perfil trocados no chat levam a aula para fora da
 * plataforma: sem contrato, sem garantia, sem reembolso — e sem a receita que
 * mantém a plataforma. O antigo `contato.ts` mascarava só ANTES do pagamento e
 * só o formato óbvio. Este pega as formas de burlar que aparecem na prática:
 *
 *  - telefone escrito por extenso ("nove nove oito…"), com emoji de número
 *    (2️⃣1️⃣), dígitos espaçados ("2 1 9 8 7…"), separadores esquisitos, +55, 0xx;
 *  - e-mail com "arroba", "(at)", "ponto com", espaços em volta do @;
 *  - link sem http ("wa.me/…", "bit . ly/…", "instagram ponto com/…");
 *  - @perfil, "meu insta é fulano", CPF/CNPJ (chaves PIX), chave aleatória;
 *  - convite ("me chama no zap", "vamos pro telegram") e pagamento por fora
 *    ("pix direto", "sem a taxa da plataforma").
 *
 * ## Sem atrapalhar a aula
 *
 * É conversa de estudante de saúde: "PA 120/80", "FC 80 90 100 110", "dose de
 * 500 mg", "dia 17/10/2026 às 14h30", "questões 12, 13 e 14", "o tumor cresce
 * por fora". Nada disso pode ser bloqueado. Por isso o telefone exige estrutura
 * de telefone brasileiro (DDD que existe, 9 do celular, grupos de 4–5 dígitos
 * ou dígitos soltos de propósito), datas e horas saem antes da contagem, e
 * "por fora" só conta perto de pagamento/combinação.
 *
 * Nenhum detector é à prova de quem insiste (ninguém consegue com regras). O que
 * passar e for denunciado, o admin vê no registro de tentativas.
 */

export type CategoriaContato =
  | 'telefone'
  | 'email'
  | 'link'
  | 'rede_social'
  | 'documento'
  | 'chave_pix'
  | 'convite_externo'
  | 'pagamento_por_fora'

export interface DeteccaoDeContato {
  /** `bloqueio`: não envia. `alerta`: envia, mas fica registrado para o admin. */
  nivel: 'bloqueio' | 'alerta' | null
  categorias: CategoriaContato[]
  /** O que disparou (cortado), para o admin entender o registro. */
  trechos: string[]
}

const NADA: DeteccaoDeContato = { nivel: null, categorias: [], trechos: [] }

/** O próprio site pode aparecer no chat. */
const DOMINIOS_PERMITIDOS = ['domineaqui.com.br', 'www.domineaqui.com.br', 'domineaqui.com']

// ─── Normalização ──────────────────────────────────────────────────────

/**
 * Minúsculas, sem acento, dígitos "exóticos" (𝟗, ９, ⑨, 2️⃣) viram dígitos
 * comuns e caracteres invisíveis somem. O texto ORIGINAL continua valendo para
 * o que depende de maiúscula (fim de frase).
 */
export function normalizarParaDeteccao(texto: string): string {
  return String(texto || '')
    .slice(0, 5_000)
    .normalize('NFKC')
    .replace(/[\uFE0F\u20E3\u200B-\u200D\u2060\uFEFF\u00AD]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const PALAVRAS_NUMERO: Record<string, string> = {
  zero: '0', um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4', cinco: '5',
  seis: '6', meia: '6', sete: '7', oito: '8', nove: '9',
}

// DDDs que existem no Brasil.
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92,
  93, 94, 95, 96, 97, 98, 99,
])

export function cpfValido(d: string): boolean {
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false
  const dv = (n: number) => {
    let s = 0
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10])
}

export function cnpjValido(d: string): boolean {
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false
  const calc = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const s = pesos.reduce((t, p, i) => t + Number(d[i]) * p, 0)
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
}

/** Os dígitos têm cara de telefone brasileiro (com ou sem DDD, +55, 0xx)? */
export function pareceTelefone(digitos: string): boolean {
  let d = digitos
  // 0 + operadora (0 21 21 98765-4321) ou 0 + DDD.
  if (d.length >= 13 && d.startsWith('0')) d = d.slice(3)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2)
  if (d.length === 10 || d.length === 11) {
    const ddd = Number(d.slice(0, 2))
    if (!DDDS.has(ddd)) return false
    const resto = d.slice(2)
    return resto.length === 9 ? resto[0] === '9' : /^[2-9]/.test(resto)
  }
  if (d.length === 9) return d[0] === '9'
  if (d.length === 8) return /^[2-9]/.test(d)
  return false
}

// ─── Sequências de dígitos (telefone, CPF, CNPJ) ───────────────────────

interface Sequencia {
  digitos: string
  grupos: number[]
  temPalavra: boolean
  comMais: boolean
  trecho: string
}

/** Tira datas e horas antes de procurar números: "17/10/2026 14:30" não é telefone. */
function semDatasEHoras(t: string): string {
  return t
    .replace(/\b\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}\b/g, ' ')
    .replace(/\b\d{4}\s*-\s*\d{1,2}\s*-\s*\d{1,2}\b/g, ' ')
    .replace(/\b\d{1,2}\s*(?::|h)\s*\d{2}\b/g, ' ')
    .replace(/\b(?:19|20)\d{2}\s*(?:[-/]|a|e|ate)\s*(?:19|20)\d{2}\b/g, ' ')
}

/**
 * Junta dígitos e números por extenso separados só por espaço, ponto, hífen,
 * parênteses, barra, emoji etc. Vírgula, ponto e vírgula e letras quebram a
 * sequência (lista "12, 13, 14" não vira um número só).
 */
function sequencias(normalizado: string): Sequencia[] {
  const t = semDatasEHoras(normalizado)
  const tokens = t.match(/\d+|[a-z]+|[,;:]|[^\da-z,;:]/g) || []
  const lista: Sequencia[] = []
  let atual: Sequencia | null = null
  let separadores = 0
  const fechar = () => {
    if (atual && atual.digitos.length >= 8) lista.push(atual)
    atual = null
    separadores = 0
  }
  for (const tok of tokens) {
    const ehDigito = /^\d+$/.test(tok)
    const palavra = PALAVRAS_NUMERO[tok]
    if (ehDigito || palavra) {
      if (!atual) atual = { digitos: '', grupos: [], temPalavra: false, comMais: false, trecho: '' }
      atual.digitos += ehDigito ? tok : palavra
      atual.grupos.push(ehDigito ? tok.length : 1)
      atual.temPalavra ||= !!palavra
      atual.trecho += tok
      separadores = 0
      continue
    }
    if (/^[a-z]+$/.test(tok) || tok === ',' || tok === ';' || tok === ':') {
      fechar()
      continue
    }
    // Separador (espaço, pontuação, símbolo, emoji): tolera alguns seguidos
    // (um emoji ocupa duas unidades).
    if (tok === '+' && !atual) {
      atual = { digitos: '', grupos: [], temPalavra: false, comMais: true, trecho: '+' }
      continue
    }
    if (atual) {
      separadores++
      if (separadores > 4) fechar()
      else atual.trecho += tok
    }
  }
  fechar()
  return lista
}

/** Palavras que, perto de um número, dizem "isto é contato". */
const PISTA_DE_CONTATO = /\b(tel|telefone|fone|cel|celular|whats\w*|wats\w*|zap\w*|wpp|numero|contato|pix|cpf|cnpj|chave)\b/

function analisarNumeros(normalizado: string, achou: (c: CategoriaContato, trecho: string) => void): void {
  const temPista = PISTA_DE_CONTATO.test(normalizado)
  for (const s of sequencias(normalizado)) {
    const d = s.digitos
    if ((d.length === 11 && cpfValido(d)) || (d.length === 14 && cnpjValido(d))) {
      achou('documento', s.trecho)
      continue
    }
    // Estrutura de telefone escrito por alguém: grupos de 4–5 dígitos
    // ("98765-4321"), tudo junto, dígitos soltos de propósito ("9 8 7 6…"),
    // por extenso, com +, ou com a palavra "zap/cel/telefone" por perto.
    // Lista de medidas ("80 90 100 110") não tem nada disso.
    const estrutura =
      s.grupos.some((g) => g >= 4) || s.grupos.every((g) => g === 1) || s.temPalavra || s.comMais || temPista
    if (estrutura && (pareceTelefone(d) || (s.comMais && d.length >= 10 && d.length <= 15))) achou('telefone', s.trecho)
  }
}

// ─── E-mail, links e perfis ────────────────────────────────────────────

const TLDS_FORTES = 'com|net|org|br|io|me|ly|gg|app|link|site|online|xyz|info|biz|chat|bio|tv|co|cc|to|ai|dev|page|store|shop|social|club|vip|live|digital|email|team|ee'
// Domínio sem espaço ("fulano.com", "wa.me", "t.me"). Sem os TLDs que são
// palavras comuns ("de", "se", "no", "in"): "etc.no caso" é digitação, não site.
const RE_DOMINIO = new RegExp(
  `(?:^|[^a-z0-9@._-])((?:[a-z0-9][a-z0-9-]*\\.)+(${TLDS_FORTES}|us|uk|eu|mx|ru|jp|edu|gov)(?:\\.[a-z]{2})?)(/[^\\s]*)?(?=$|[^a-z0-9])`,
  'g',
)
// TLDs que também são palavra ("me", "to" de "tô", "ai" de "aí"): só valem com
// rótulo de plataforma ("wa.me", "t.me") ou com caminho ("fulano.me/x").
const TLD_AMBIGUO = /^(?:me|to|ai|co)$/
const PLATAFORMAS = 'wa|t|m|bit|tinyurl|linktr|linktree|instagram|insta|ig|facebook|fb|tiktok|vm|youtube|youtu|discord|telegram|whatsapp|zap|gmail|hotmail|outlook|yahoo|icloud|lnk|beacons|cutt|calendly|linkedin|twitter|x|api\\.whatsapp|chat\\.whatsapp'
// Na forma com espaço ou por extenso, só os nomes de plataforma com 2+ letras
// ("raio x. com isso" é frase).
const PLATAFORMAS_ESPACADAS = 'wa|bit|tinyurl|linktr|linktree|instagram|insta|ig|facebook|fb|tiktok|youtube|youtu|discord|telegram|whatsapp|zap|gmail|hotmail|outlook|yahoo|icloud|lnk|beacons|cutt|calendly|linkedin|twitter'
const PROVEDORES_EMAIL = 'gmail|hotmail|outlook|yahoo|icloud|live|bol|uol|terra|proton|protonmail|msn|globo|r7'
const RE_PLATAFORMA = new RegExp(`^(?:www\\.)?(?:${PLATAFORMAS})$`)
const CONTEXTO_SOCIAL = /\b(?:insta(?:gram)?|ig|tiktok|twitter|perfil|arroba|segue|siga|seguir|me\s+add|me\s+adiciona|me\s+acha|me\s+procura|direct|bio)\b/

function analisarLinksEEmails(normalizado: string, original: string, achou: (c: CategoriaContato, trecho: string) => void): void {
  // E-mail ofuscado: "fulano arroba gmail ponto com", "fulano (at) gmail (dot) com".
  const desofuscado = normalizado
    .replace(/\s*[([{]\s*(?:arroba|at)\s*[)\]}]\s*|\s+arroba\s+/g, '@')
    .replace(new RegExp(`\\s*[([{]?\\s*(?:ponto|dot)\\s*[)\\]}]?\\s*(?=(?:${TLDS_FORTES})\\b)`, 'g'), '.')
  const email =
    desofuscado.match(/[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(?:\.[a-z0-9-]+)+/) ||
    // Com espaços em volta ("fulano @ gmail . com"): só terminando em TLD conhecido.
    desofuscado.match(new RegExp(`[a-z0-9][a-z0-9._%+-]*\\s*@\\s*[a-z0-9-]+(?:\\s*\\.\\s*[a-z0-9-]+)*\\s*\\.\\s*(?:${TLDS_FORTES})\\b`)) ||
    normalizado.match(new RegExp(`[a-z0-9._-]{3,}\\s*(?:@|arroba)\\s*(?:${PROVEDORES_EMAIL})\\b`))
  if (email) achou('email', email[0])

  // Link explícito.
  const explicito = normalizado.match(/https?:\/\/\S+|\bwww\s*\.\s*[a-z0-9-]+\S*/)
  if (explicito && !permitido(explicito[0])) achou('link', explicito[0])

  // Domínio sem espaço. O que tem "@" antes é e-mail (já tratado acima).
  const semEmails = normalizado.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+/g, ' ')
  for (const m of semEmails.matchAll(RE_DOMINIO)) {
    const dominio = m[1]
    const tld = m[2]
    const caminho = m[3]
    const rotulo = dominio.split('.').slice(0, -1).join('.')
    if (!/[a-z]/.test(dominio.split('.')[0]) || permitido(dominio)) continue
    if (TLD_AMBIGUO.test(tld) && !caminho && !RE_PLATAFORMA.test(rotulo)) continue
    // "Fim da aula.Com calma": maiúscula logo depois do ponto é frase digitada sem espaço.
    const noOriginal = original.toLowerCase().indexOf(dominio)
    if (noOriginal >= 0 && !caminho && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(original.slice(noOriginal + dominio.lastIndexOf('.') + 1))) continue
    achou('link', (dominio + (caminho || '')).slice(0, 80))
  }

  // Domínio com espaço ou por extenso ("wa . me/55…", "instagram ponto com",
  // "fulano ponto com ponto br"). Só com sinal forte: "nesse ponto com certeza"
  // e "Fim da aula. Com calma" são frases.
  const espacados = [
    new RegExp(`\\b(?:${PLATAFORMAS_ESPACADAS})\\s*(?:\\.|ponto|dot)\\s*(?:${TLDS_FORTES})\\b`),
    /\b(?:t|m|x)\s*(?:\.|ponto)\s*(?:me|com)\s*\//,
    /\b[a-z0-9-]{3,}\s*(?:ponto|dot)\s*(?:com|net|org)\s*(?:(?:ponto|dot|\.)\s*br\b|\/|$)/,
    /\b[a-z0-9-]{2,}\s*\.\s*(?:com|net|org)\s*\.\s*br\b/,
  ]
  for (const re of espacados) {
    const e = normalizado.match(re)
    if (!e) continue
    const compacto = e[0].replace(/\s*(?:ponto|dot)\s*/g, '.').replace(/\s+/g, '')
    if (permitido(compacto)) continue
    // "Ex. Com. Br" com maiúsculas é frase, não endereço.
    const idx = original.toLowerCase().indexOf(e[0].split(/\s/)[0])
    const fraseNormal = !/ponto|dot/.test(e[0]) && /\.\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(original.slice(Math.max(0, idx), idx + e[0].length + 2))
    if (!fraseNormal) {
      achou('link', e[0])
      break
    }
  }

  // @perfil: "@carla, pode repetir?" é menção; "@carla.silva23" ou "segue @carlamed" é perfil.
  if (!email) {
    for (const m of normalizado.matchAll(/(?:^|[\s(:])@([a-z0-9._]{3,30})\b/g)) {
      if (/[._\d]/.test(m[1]) || CONTEXTO_SOCIAL.test(normalizado)) {
        achou('rede_social', m[0].trim())
        break
      }
    }
  }
  const redeComNome = normalizado.match(
    /\b(?:insta(?:gram)?|ig|tiktok|tik tok|twitter|facebook|fb|discord|telegram|linkedin|threads|snap(?:chat)?)\s*(?::|=|->|e|eh|seria)\s*@?([a-z0-9._]{3,30})\b/,
  )
  if (redeComNome && /[:=]|->|\b(?:meu|minha|me\s+segue|segue|siga|procura|add)\b/.test(normalizado) && !/^(?:e|o|a|do|da|de|um|uma|tiktok|twitter|facebook|discord|telegram|linkedin|instagram|insta)$/.test(redeComNome[1])) {
    achou('rede_social', redeComNome[0])
  }
  const meuArroba = normalizado.match(/\b(?:meu|minha)\s+(?:@|arroba|user|usuario|perfil)\s*(?:e|eh|:|=)?\s*@?([a-z0-9._]{3,30})\b/)
  if (meuArroba && !/^(?:e|eh|de|do|da|no|na|ta|esta)$/.test(meuArroba[1])) achou('rede_social', meuArroba[0])

  // Chave PIX aleatória (UUID).
  const uuid = normalizado.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/)
  if (uuid) achou('chave_pix', uuid[0])
}

function permitido(trecho: string): boolean {
  const t = trecho.replace(/^https?:\/\//, '').replace(/^www\s*\.\s*/, 'www.').split(/[/?#\s]/)[0]
  return DOMINIOS_PERMITIDOS.some((d) => t === d || t.endsWith(`.${d}`))
}

// ─── Intenção: convite para fora e pagamento por fora ──────────────────

// Canal que por si só é "fora da plataforma". Meet/Zoom não entram: o admin pode
// permitir o link externo oficial da reserva.
const FORTE =
  '(?:whats\\w*|wats\\w*|uats\\w*|zap(?:zap)?|zapp|wpp|telegram\\w*|insta(?:gram)?\\b|direct|privado|pv|inbox|discord|e-?mail|gmail|messenger|signal|skype|facebook|tiktok|linkedin)'
// Palavras comuns que só são canal com possessivo ("meu número", "seu celular").
const FRACO = '(?:telefone|fone|cel|celular|numero|contato)'
const CONVITES = [
  new RegExp(`\\bme\\s+(?:chama|chame|add|adiciona|adicione|manda\\s+(?:mensagem|msg)|procura|procure|segue|siga|encontra|acha)\\s+(?:no|na|pelo|pela|via|por|em)?\\s*${FORTE}`),
  new RegExp(`\\bte\\s+(?:chamo|add|adiciono|mando|passo|chamar|passar|mandar|ligo|procuro)\\s+(?:no|na|pelo|pela|via|por|o|a)?\\s*${FORTE}`),
  new RegExp(`\\bte\\s+(?:passo|mando|passar|mandar|dou|dar)\\s+(?:o\\s+|a\\s+)?(?:meu|minha)\\s+(?:${FORTE}|${FRACO})`),
  new RegExp(`\\b(?:passa|passe|manda|mande|envia|envie|me\\s+da|me\\s+de|me\\s+passa|qual\\s+(?:e|eh)?\\s*(?:o\\s+|a\\s+)?)\\s*(?:o\\s+|a\\s+)?(?:seu|teu|sua|tua)\\s+(?:${FORTE}|${FRACO})`),
  new RegExp(`\\b(?:passa|passe|manda|mande|envia|envie|me\\s+da|me\\s+de|me\\s+passa)\\s+(?:o\\s+|a\\s+)?${FORTE}`),
  new RegExp(`\\b(?:meu|minha)\\s+${FORTE}\\s*(?:e|eh|:|=|seria)(?:\\s|$)`),
  new RegExp(`\\b(?:meu|minha)\\s+${FRACO}\\s*(?::|=)`),
  new RegExp(`\\b(?:vamos|bora|vem|vamo|podemos|pode|melhor)\\s+(?:(?:falar|conversar|combinar|continuar|seguir|marcar|fazer|ir|passar|mudar)\\s+)?(?:pro|pra|para\\s+o|para\\s+a|no|na|pelo|pela|por)\\s+${FORTE}`),
  new RegExp(`\\b(?:chama|fala|conversa|conversar|falar|combinar|combina|continua|continuar|marcar|marca)\\s+(?:comigo\\s+)?(?:no|na|pelo|pela|via|por)\\s+${FORTE}`),
]
const POR_FORA = [
  /\b(?:pix|pag(?!in)\w*|transferencia|transfere|deposito)\s+direto\b/,
  /\bdireto\s+(?:no|pelo|via)\s+pix\b/,
  /\bfora\s+da\s+(?:plataforma|domine\s?aqui|app|aplicativo|site)\b/,
  /\bsem\s+(?:passar|usar|ser)\s+(?:pela|a|pelo|o)\s+(?:plataforma|domine\s?aqui|app|site)\b/,
  /\b(?:sem|fugir\s+da|evitar\s+a|economiza\w*\s+a?)\s+(?:a\s+)?taxa\s+(?:da|de|do)\s+(?:plataforma|domine\s?aqui|app|site)\b/,
  /\bdesconto\s+(?:se|pra|para)\s+(?:pagar|fechar|combinar)\s+(?:direto|comigo|por\s+fora|fora)\b/,
]
// "por fora" só conta perto de dinheiro ou combinação: o tumor que cresce por
// fora e o pericárdio que cobre o coração por fora passam.
const POR_FORA_COM_CONTEXTO = /\bpor\s+fora\b/
const CONTEXTO_DE_DINHEIRO = /\b(?:pag(?!in)\w*|pix|combin(?:a|ar|amos|ado|ada|e)\b|valor|preco|dinheiro|transfer\w*|desconto|taxa|cobr(?:a|ar|o|anca|ando)\b|reais|r\$)/

export function detectarContato(texto: string): DeteccaoDeContato {
  const original = String(texto || '').slice(0, 5_000)
  if (!original.trim()) return NADA
  const normalizado = normalizarParaDeteccao(original)
  const categorias = new Set<CategoriaContato>()
  const trechos: string[] = []
  const achou = (c: CategoriaContato, trecho: string) => {
    categorias.add(c)
    if (trechos.length < 5) trechos.push(trecho.trim().slice(0, 80))
  }

  analisarNumeros(normalizado, achou)
  analisarLinksEEmails(normalizado, original, achou)
  for (const re of CONVITES) {
    const m = normalizado.match(re)
    if (m) {
      achou('convite_externo', m[0])
      break
    }
  }
  for (const re of POR_FORA) {
    const m = normalizado.match(re)
    if (m) {
      achou('pagamento_por_fora', m[0])
      break
    }
  }
  if (!categorias.has('pagamento_por_fora') && POR_FORA_COM_CONTEXTO.test(normalizado) && CONTEXTO_DE_DINHEIRO.test(normalizado)) {
    achou('pagamento_por_fora', 'por fora')
  }

  if (categorias.size) return { nivel: 'bloqueio', categorias: Array.from(categorias), trechos }

  // Só citar um canal externo ("o zap caiu") não bloqueia, mas fica registrado.
  const citacao = normalizado.match(/\b(?:whatsapp|whats|zap|wpp|telegram|instagram|insta|discord|tiktok|facebook|sem\s+taxa)\b/)
  if (citacao) return { nivel: 'alerta', categorias: [/sem\s+taxa/.test(citacao[0]) ? 'pagamento_por_fora' : 'convite_externo'], trechos: [citacao[0]] }
  return NADA
}

/**
 * A mensagem é quase só número (dígitos ou números por extenso)? Só nesse caso
 * vale a pena buscar as anteriores do mesmo autor para `detectarEmSequencia`.
 */
export function pareceFragmentoNumerico(texto: string): boolean {
  const n = normalizarParaDeteccao(texto)
  const so = n.replace(/\s+/g, '')
  if (!so || so.length > 60) return false
  if ((so.match(/\d/g) || []).length / so.length >= 0.5) return true
  const palavras = n.split(/[^a-z]+/).filter(Boolean)
  return palavras.length > 0 && palavras.filter((p) => p in PALAVRAS_NUMERO).length / palavras.length >= 0.5
}

/** Para mensagens partidas ("21 9876" … "54321"): olha as últimas do mesmo autor juntas. */
export function detectarEmSequencia(anteriores: string[], atual: string): DeteccaoDeContato {
  if (!anteriores.length || !pareceFragmentoNumerico(atual)) return NADA
  const junto = detectarContato([...anteriores.slice(-3), atual].join(' '))
  const relevantes = junto.categorias.filter((c) => c === 'telefone' || c === 'documento')
  return relevantes.length ? { nivel: 'bloqueio', categorias: relevantes, trechos: junto.trechos } : NADA
}

export const ROTULO_CATEGORIA: Record<CategoriaContato, string> = {
  telefone: 'telefone',
  email: 'e-mail',
  link: 'link',
  rede_social: 'rede social',
  documento: 'CPF/CNPJ',
  chave_pix: 'chave PIX',
  convite_externo: 'convite para outro canal',
  pagamento_por_fora: 'pagamento por fora',
}

export const AVISO_BLOQUEIO =
  'Por segurança, não é permitido enviar telefone, e-mail, link, rede social, CPF ou chave PIX, nem combinar contato ou pagamento por fora. Fale tudo por aqui: pagando pela DomineAqui você tem contrato, comprovante, garantia e reembolso. Para materiais, o monitor usa "Enviar material".'
