/**
 * A condição Mongo para "este campo de texto está de fato preenchido".
 *
 * `{ $exists: true, $ne: '' }` parece certo e não é: um campo gravado como
 * `null` PASSA nos dois lados — ele existe, e `null` não é igual a string
 * vazia. E `imagemUrl`/`explicacao` viram `null` sempre que alguém edita uma
 * questão pelo admin e apaga o campo (ver
 * app/api/admin/banco/questoes/[id]/route.ts, que grava
 * `body.imagemUrl?.trim() || null` de propósito — `null` para SOBRESCREVER um
 * valor antigo; `undefined` no Mongo Node driver não escreve o campo).
 *
 * O sintoma foi real: o filtro "só com imagem" do Banco de Questões incluía
 * questão sem imagem nenhuma, porque a última edição dela tinha limpado o
 * campo e deixado `imagemUrl: null` no documento.
 *
 * `$type: 'string'` não erra: exige que o valor SEJA uma string, o que
 * `null`, "campo ausente" e o tipo BSON `undefined` nunca são.
 */
export function campoTextoPreenchido() {
  return { $type: 'string' as const, $ne: '' }
}

/**
 * A MESMA regra, escrita como EXPRESSÃO de agregação.
 *
 * `campoTextoPreenchido()` devolve um operador de CONSULTA (`{ $type, $ne }`),
 * que serve num `$match` e não dentro de um `$cond` — e o `$cond` é onde a
 * contagem por faceta do criador de listas decide se uma questão tem imagem ou
 * resposta comentada (ver app/api/banco/facetas/route.ts).
 *
 * As duas moram juntas de propósito: o número que a tela mostra ao lado de um
 * filtro precisa bater com o que aquele filtro devolve. Uma versão só com
 * `$type` contaria a string vazia, e a tela ofereceria um recorte que volta
 * sem nada — que é exatamente o defeito que as facetas existem para eliminar.
 */
export function textoPreenchidoNaExpressao(campo: string) {
  return {
    $and: [{ $eq: [{ $type: campo }, 'string'] }, { $ne: [campo, ''] }],
  }
}
