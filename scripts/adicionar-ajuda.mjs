#!/usr/bin/env node
/**
 * Acrescenta `ajuda` a campos que ainda não têm — o texto de "de onde tirar
 * este dado" que aparece sob o rótulo no painel.
 *
 * Cada construtor recebe a ajuda de um jeito, e o script trata os dois que
 * cobrem a quase totalidade do catálogo:
 *
 *   campoNum(id, rotulo, { ... })         → a ajuda entra como chave do objeto
 *   campoSimNao(id, rotulo, pontos)       → a ajuda é o 4º argumento posicional
 *   campoSeg/campoOpc(id, rotulo, [...])  → a ajuda entra no objeto final, que
 *                                            é criado se ainda não existir
 *
 * Os dois primeiros cabem numa linha; `campoSeg` e `campoOpc` levam a lista de
 * opções no meio e quase sempre ocupam várias, então o fim da chamada é achado
 * equilibrando parênteses a partir do início dela. Qualquer caso em que a
 * chamada não fecha, ou em que o identificador aparece mais de uma vez, é
 * devolvido para edição manual — a mesma regra dos outros scripts desta pasta:
 * ambiguidade não se resolve no escuro.
 *
 * Uso: node scripts/adicionar-ajuda.mjs <arquivo.json>
 * JSON: { "<arquivo-alvo>": { "<id-ferramenta>": { "<id-campo>": "texto" } } }
 */

import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const arquivoDeEntrada = process.argv[2]
if (!arquivoDeEntrada) {
  console.error('uso: node scripts/adicionar-ajuda.mjs <arquivo.json>')
  process.exit(1)
}

function aspas(texto) {
  return `'${texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/**
 * Percorre o texto a partir do `(` da chamada e devolve o índice do `)` que a
 * fecha, ignorando parênteses dentro de literais de texto. Devolve -1 se a
 * chamada não fechar — o que faz o chamador recusar a edição.
 */
function fimDaChamada(texto, inicio) {
  let nivel = 0
  let dentroDeAspas = false
  for (let i = inicio; i < texto.length; i += 1) {
    const c = texto[i]
    if (c === '\\') { i += 1; continue }
    if (c === "'") { dentroDeAspas = !dentroDeAspas; continue }
    if (dentroDeAspas) continue
    if (c === '(') nivel += 1
    if (c === ')') {
      nivel -= 1
      if (nivel === 0) return i
    }
  }
  return -1
}

const plano = JSON.parse(readFileSync(arquivoDeEntrada, 'utf8'))
let adicionadas = 0
const recusadas = []

for (const [caminho, porFerramenta] of Object.entries(plano)) {
  let texto = readFileSync(caminho, 'utf8')
  let mexeu = false

  for (const [idFerramenta, porCampo] of Object.entries(porFerramenta)) {
    for (const [idCampo, ajuda] of Object.entries(porCampo)) {
      // Recorta a ferramenta a cada campo, porque cada edição desloca o texto.
      const marca = texto.indexOf(`id: '${idFerramenta}',`)
      if (marca === -1) {
        recusadas.push(`${idFerramenta}: id não encontrado`)
        break
      }
      const seguinte = texto.slice(marca + 1).search(/\n\s*id: '[a-z0-9-]+',/)
      const limite = seguinte === -1 ? texto.length : marca + 1 + seguinte

      const re = new RegExp(`campo(Num|SimNao|Seg|Opc)\\(\\s*'${idCampo}',`, 'g')
      const achados = [...texto.slice(marca, limite).matchAll(re)]
      if (achados.length !== 1) {
        recusadas.push(`${idFerramenta}.${idCampo}: ${achados.length} ocorrências`)
        continue
      }
      const tipo = achados[0][1]
      const inicioChamada = marca + achados[0].index
      const abreParen = texto.indexOf('(', inicioChamada)
      const fecha = fimDaChamada(texto, abreParen)
      if (fecha === -1) {
        recusadas.push(`${idFerramenta}.${idCampo}: chamada não fecha — edição manual`)
        continue
      }
      const chamada = texto.slice(inicioChamada, fecha + 1)
      // Duas formas de já ter ajuda: a chave `ajuda:` e, em `campoSimNao`, um
      // quarto argumento posicional depois dos pontos. Checar só a primeira
      // produziu uma chamada com cinco argumentos, que o compilador recusou.
      const jaTemPosicional =
        tipo === 'SimNao' &&
        /campoSimNao\(\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*-?[\d.]+\s*,\s*'/.test(chamada)
      if (/\bajuda:/.test(chamada) || jaTemPosicional) {
        recusadas.push(`${idFerramenta}.${idCampo}: já tem ajuda`)
        continue
      }

      let novoTexto
      if (tipo === 'SimNao') {
        // 4º argumento posicional, imediatamente antes do parêntese final.
        novoTexto = `${texto.slice(0, fecha)}, ${aspas(ajuda)}${texto.slice(fecha)}`
      } else {
        // Objeto de opções final. Existe em campoNum; em campoSeg e campoOpc
        // pode faltar, e nesse caso é criado.
        const objeto = chamada.lastIndexOf('{')
        const temObjetoFinal = objeto !== -1 && chamada.slice(objeto).includes('}')
        if (tipo === 'Num' && temObjetoFinal) {
          const pos = inicioChamada + objeto + 1
          novoTexto = `${texto.slice(0, pos)} ajuda: ${aspas(ajuda)},${texto.slice(pos)}`
        } else if (tipo !== 'Num' && /\}\s*\)$/.test(chamada)) {
          const pos = inicioChamada + chamada.lastIndexOf('{') + 1
          novoTexto = `${texto.slice(0, pos)} ajuda: ${aspas(ajuda)},${texto.slice(pos)}`
        } else if (tipo !== 'Num') {
          novoTexto = `${texto.slice(0, fecha)}, { ajuda: ${aspas(ajuda)} }${texto.slice(fecha)}`
        } else {
          recusadas.push(`${idFerramenta}.${idCampo}: campoNum sem objeto de opções — edição manual`)
          continue
        }
      }
      texto = novoTexto
      adicionadas += 1
      mexeu = true
    }
  }

  if (mexeu) writeFileSync(caminho, texto, 'utf8')
}

console.log(`ajudas adicionadas: ${adicionadas}`)
if (recusadas.length > 0) {
  console.log('recusadas (nada foi escrito para estas):')
  for (const r of recusadas) console.log(`  - ${r}`)
}
