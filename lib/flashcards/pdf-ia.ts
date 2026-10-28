import jsPDF from 'jspdf'

import {
  criarFolha,
  desenharCabecalhoDaQuestao,
  desenharCartaoDeTitulo,
  finalizarFolha,
  novaPagina,
} from '@/lib/pdf/folha'
import { carregarLogo, fonte, registrarFontes } from '@/lib/pdf/marca'
import { MEDIDAS_DO_COMENTARIO, desenharCaixaDeTexto, fecharQuestao } from '@/lib/pdf/questao-na-folha'
import { quebrarTexto } from '@/lib/pdf/texto'

/**
 * O PDF de um deck de flashcards gerado pela IA.
 *
 * Era uma janela HTML aberta com `window.open` e mandada para o "Imprimir" do
 * navegador: o resultado dependia do navegador (margens, cabeçalho com a URL,
 * fonte do sistema), pedia para liberar pop-up e não tinha a marca. Agora é o
 * mesmo documento dos outros PDFs da plataforma — fundo, vidro, Inter, logo —
 * e baixa direto.
 *
 * Os cards correm em sequência, não um por página: é a folha de revisão que a
 * versão impressa já era. Uma caixa curta nunca se parte entre páginas (ver
 * `desenharCaixaDeTexto`).
 */

export interface CartaoParaPdf {
  front: string
  back: string
  hint?: string
}

export async function gerarPdfDeFlashcardsIa(deck: { title: string; theme?: string }, cartoes: CartaoParaPdf[]): Promise<Blob> {
  const doc = new jsPDF()
  const familia = await registrarFontes(doc)
  const folha = criarFolha(doc, familia, await carregarLogo(), 'Flashcards com IA')

  desenharCartaoDeTitulo(folha, {
    titulo: deck.title || 'Flashcards',
    chips: [deck.theme || null, `${cartoes.length} ${cartoes.length === 1 ? 'cartão' : 'cartões'}`].filter(
      (chip): chip is string => !!chip,
    ),
  })

  const FRENTE = { corpoDoTexto: 11, alturaDaLinha: 6 }
  const m = MEDIDAS_DO_COMENTARIO
  const larguraDoTexto = folha.larguraUtil - 2 * m.recuo

  /** Quanto uma caixa de texto vai ocupar — para decidir a página antes. */
  const alturaDaCaixa = (texto: string, corpo: number, entrelinha: number) => {
    fonte(doc, 'normal', corpo)
    return m.alturaDoTitulo + quebrarTexto(doc, texto, larguraDoTexto).length * entrelinha + m.respiroInferior + 4
  }

  // O texto vem com a mesma marcação das provas: `**negrito**` sai em negrito
  // e um `*` solto continua sendo texto (ver `lib/pdf/texto.ts`).
  cartoes.forEach((cartao, i) => {
    const frente = cartao.front || '(sem texto)'
    const verso = cartao.back || '(sem resposta)'

    // Um cartão anda inteiro: a frente no pé de uma página e o verso no
    // topo da seguinte separam a pergunta da resposta. Só um cartão alto
    // demais para isso pode se partir.
    const altura =
      11.6 +
      alturaDaCaixa(frente, FRENTE.corpoDoTexto, FRENTE.alturaDaLinha) +
      alturaDaCaixa(verso, m.corpoDoTexto, m.alturaDaLinha) +
      (cartao.hint ? alturaDaCaixa(cartao.hint, m.corpoDoTexto, m.alturaDaLinha) : 0)
    if (altura <= 130 && folha.y + altura > folha.limite) novaPagina(folha)

    desenharCabecalhoDaQuestao(folha, `Cartão ${i + 1}`, [], 30)
    desenharCaixaDeTexto(folha, frente, 'Frente', { tom: 'claro', medidas: FRENTE })
    desenharCaixaDeTexto(folha, verso, 'Verso', { tom: 'verde' })
    if (cartao.hint) desenharCaixaDeTexto(folha, cartao.hint, 'Dica', { tom: 'laranja' })
    fecharQuestao(folha)
  })

  finalizarFolha(folha, deck.title, 'Flashcards')
  return doc.output('blob')
}
