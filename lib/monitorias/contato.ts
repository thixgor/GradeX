/**
 * Esconde contato pessoal no chat ANTES do pagamento.
 *
 * Por quê: se o aluno e o monitor trocam WhatsApp antes de pagar, combinam por
 * fora — e aí não há garantia, contrato, comprovante nem reembolso. Depois do
 * pagamento confirmado o chat fica livre.
 *
 * Não é à prova de quem quer burlar (ninguém consegue isso com regex); é um
 * lembrete com dente, e o Termo proíbe pagamento por fora.
 */

const PADROES: Array<[RegExp, string]> = [
  // e-mail
  [/[A-Za-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[A-Za-z0-9.-]+\s*(\.|\(dot\))\s*[A-Za-z]{2,}/gi, '[e-mail oculto]'],
  // links de WhatsApp / Telegram
  [/(https?:\/\/)?(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|t\.me|telegram\.me)\/\S*/gi, '[link oculto]'],
  // telefone BR: 8 a 13 dígitos com separadores comuns
  [/(\+?55[\s.-]?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/g, '[telefone oculto]'],
  // @usuario de rede social
  [/(^|\s)@[A-Za-z0-9._]{3,30}/g, '$1[perfil oculto]'],
  // chave PIX aleatória (UUID)
  [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[chave oculta]'],
]

export interface ResultadoMascara {
  texto: string
  mascarou: boolean
}

export function mascararContato(texto: string): ResultadoMascara {
  let resultado = texto
  for (const [padrao, troca] of PADROES) resultado = resultado.replace(padrao, troca)
  return { texto: resultado, mascarou: resultado !== texto }
}

export const AVISO_CONTATO =
  'Por segurança, contatos pessoais ficam ocultos até o pagamento ser confirmado. Pagamento fora da plataforma não tem garantia, contrato nem reembolso.'
